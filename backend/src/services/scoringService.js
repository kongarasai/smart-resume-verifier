/**
 * Scoring Service
 * ------------------
 * Truth Verification Engine Formula:
 * Final Score (0–100) = 
 *   - Coding Test Score (50%)
 *   - GitHub Authenticity Score (30%)
 *   - Resume Skill Match Score (20%)
 *
 * Confidence Level:
 *   - 80–100 -> Highly Verified
 *   - 60–79 -> Moderately Verified
 *   - <60 -> Risky Candidate
 */
const { db, admin } = require('../config/firebase');
const axios = require('axios');
const { canReadUser } = require('../middleware/authorize');

const MAX_SKILL_SCORE = 100;

const computeSkillVerificationScore = async (userId) => {
  const skillsSnap = await db.collection('users').doc(userId).collection('skills').get();
  let raw = 0;
  skillsSnap.docs.forEach(doc => {
    const level = doc.data().verification_level;
    if (level === 'claimed') raw += 10;
    else if (level === 'evidence') raw += 20;
    else if (level === 'verified') raw += 40;
    else if (level === 'strong_verified' || level === 'expert') raw += 50;
  });
  return Math.min(Math.round((raw / 500) * 100), MAX_SKILL_SCORE);
};

const computePracticeScore = async (userId) => {
  const snap = await db.collection('practice_sessions').where('user_id', '==', userId).get();
  let total = 0, count = 0;
  snap.docs.forEach(d => {
    if (d.data().score_percentage !== undefined) {
      total += parseFloat(d.data().score_percentage);
      count++;
    }
  });
  const codingSessionAvg = count > 0 ? total / count : 0;
  
  const lcDoc = await db.collection('leetcode_data').doc(userId).get();
  const lcScore = lcDoc.exists ? parseFloat(lcDoc.data().coding_evidence_score || 0) : 0;
  
  return Math.max(codingSessionAvg, lcScore, 0);
};

const computeGitHubScore = async (userId) => {
  const doc = await db.collection('github_data').doc(userId).get();
  return doc.exists ? parseFloat(doc.data().skill_match_score || 0) : 0;
};

async function getFraudProbability(userId, overallScore, testScore, githubScore, skillScore) {
  let rawFraudProb = 0.15 + (Math.random() * 0.1); 
  let reasons = [];

  const profileDoc = await db.collection('profiles').doc(userId).get();
  const userProfile = profileDoc.exists ? profileDoc.data() : null;

  if (!userProfile?.github_url && !userProfile?.leetcode_url) {
    rawFraudProb += 0.3;
    reasons.push("No GitHub or LeetCode verification");
  }

  if (testScore > 80 && githubScore < 20) { 
    rawFraudProb += 0.25; 
    reasons.push("Suspiciously high test score but no GitHub proof"); 
  }
  if (skillScore > 90 && githubScore < 10) { 
    rawFraudProb += 0.3; 
    reasons.push("Claims many skills but lacks GitHub proof"); 
  }
  if (testScore < 30 && skillScore > 80) { 
    rawFraudProb += 0.35; 
    reasons.push("Failed test despite claiming high skills"); 
  }
  if (githubScore > 70 && testScore > 70) { 
    rawFraudProb = Math.max(0.05, rawFraudProb - 0.2); 
  }

  rawFraudProb = Math.min(Math.max(rawFraudProb, 0.05), 0.95);
  return { prob: rawFraudProb, reasons };
}

const calculateConfidenceScore = async (req, res) => {
  const userId = req.params.userId || req.user.id;

  // IDOR guard: only the owner or privileged roles can trigger score calculation
  if (!canReadUser(req, userId)) {
    return res.status(403).json({ error: 'Access denied: you can only calculate your own confidence score' });
  }

    const [skillScore, testScore, githubScore] = await Promise.all([
      computeSkillVerificationScore(userId),
      computePracticeScore(userId),
      computeGitHubScore(userId)
    ]);

    // NEW FORMULA:
    const overall = (testScore * 0.50) + (githubScore * 0.30) + (skillScore * 0.20);
    const finalScore = Math.round(overall);

    // Confidence Level:
    let confidenceLabel = 'Risky Candidate';
    if (finalScore >= 80) confidenceLabel = 'Highly Verified';
    else if (finalScore >= 60) confidenceLabel = 'Moderately Verified';

    // Fetch basic completeness profile to avoid schema breaking on unrelated sections
    const profileDocScore = await db.collection('profiles').doc(userId).get();
    const profileScore = profileDocScore.exists ? (profileDocScore.data().profile_completeness || 0) : 0;

    // AI Fraud Risk Component
    const fraudData = await getFraudProbability(userId, finalScore, testScore, githubScore, skillScore);
    const fraudProbability = fraudData.prob;
    
    let fraudRiskLabel = 'Medium';
    if (fraudProbability > 0.65) fraudRiskLabel = 'High';
    else if (fraudProbability < 0.35) fraudRiskLabel = 'Low';

    // Skill gaps logic
    const skillsSnap = await db.collection('users').doc(userId).collection('skills').get();
    const verifiedSet = new Set(skillsSnap.docs.map(d => (d.data().name || '').toLowerCase()));
    const commonSkills = ['javascript', 'python', 'sql', 'git', 'docker', 'react', 'nodejs', 'aws', 'java'];
    const skillGaps = commonSkills.filter(s => !verifiedSet.has(s));

    const weakAreas = [];
    if (skillScore < 50) weakAreas.push('Verify more skills via resume or manual upload');
    if (testScore < 60) weakAreas.push('Improve coding test results on SentryConnect or LeetCode');
    if (githubScore < 60) weakAreas.push('Enhance GitHub footprint and origin repositories');

    const scoreData = {
      user_id: userId,
      github_score: Math.round(githubScore),
      practice_score: Math.round(testScore),
      coding_evidence_score: Math.round(testScore),
      profile_completeness_score: profileScore,
      skill_match_score: Math.round(skillScore),
      project_score: 0,
      overall_score: finalScore,
      confidence_label: confidenceLabel,
      skill_gaps: skillGaps,
      weak_areas: weakAreas,
      fraud_probability: fraudProbability,
      fraud_reasons: fraudData.reasons,
      fraud_risk_level: fraudRiskLabel,
      calculated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('confidence_scores').doc(userId).set(scoreData, { merge: true });

    res.json({
      coding_test_score: Math.round(testScore),
      github_score: Math.round(githubScore),
      skill_match_score: Math.round(skillScore),
      overall_score: finalScore,
      confidence_label: confidenceLabel,
      fraud_probability: fraudProbability,
      fraud_reasons: fraudData.reasons,
      fraud_risk_level: fraudRiskLabel,
      skill_gaps: skillGaps,
      weak_areas: weakAreas
    });
  } catch (err) {
    console.error('Score error:', err);
    res.status(500).json({ error: 'Score calculation failed: ' + err.message });
  }
};

const getConfidenceScore = async (req, res) => {
  const userId = req.params.userId || req.user.id;

  // IDOR guard: only the owner or privileged roles can view another user's score
  if (!canReadUser(req, userId)) {
    return res.status(403).json({ error: 'Access denied: you can only view your own confidence score' });
  }

  const doc = await db.collection('confidence_scores').doc(userId).get();

  let respData = doc.exists ? doc.data() : null;

  if (respData) {
     const fraudProb = respData.fraud_probability !== undefined ? parseFloat(respData.fraud_probability) : 0.15;
     const reasons = respData.fraud_reasons || [];
     
     let riskLabel = 'Medium';
     if (fraudProb > 0.65) riskLabel = 'High';
     else if (fraudProb < 0.35) riskLabel = 'Low';
     
     respData = {
         ...respData,
         fraud_probability: fraudProb,
         fraud_reasons: reasons,
         fraud_risk_level: riskLabel
     };
  }

  res.json(respData);
};

const predictRisk = async (req, res) => {
  const userId = req.params.userId || req.user.id;

  // IDOR guard: only the owner or privileged roles can view risk prediction
  if (!canReadUser(req, userId)) {
    return res.status(403).json({ error: 'Access denied: you can only view your own risk profile' });
  }

  const doc = await db.collection('confidence_scores').doc(userId).get();
  const cs = doc.exists ? doc.data() : null;
  if (!cs) return res.json({ risk: 'unknown', reason: 'No score. Run verification first.' });

  const pScore = parseFloat(cs.practice_score || 0);
  const gScore = parseFloat(cs.github_score || 0);
  const sScore = parseFloat(cs.skill_match_score || 0);

  const fraudData = await getFraudProbability(userId, cs.overall_score, pScore, gScore, sScore);
  const fraudProb = fraudData.prob;
  
  let risk = 'medium';
  if (fraudProb > 0.65) risk = 'high';
  else if (fraudProb < 0.35) risk = 'low';

  const reasons = [];
  if (cs.overall_score < 60) reasons.push('Overall score is below 60 (Risky Candidate)');
  if (cs.skill_gaps?.length > 4) reasons.push(`${cs.skill_gaps.length} common skill gaps found`);
  if (fraudProb > 0.65) reasons.push('AI Fraud detection highlighted suspicious pattern');
  reasons.push(...fraudData.reasons);

  res.json({ risk, reasons, overall_score: cs.overall_score, fraud_probability: fraudProb });
};

const generateInterviewSuggestions = async (req, res) => {
  const candidateId = req.params.candidateId;
  const hrId = req.user.id;
  try {
    const doc = await db.collection('confidence_scores').doc(candidateId).get();
    const cs = doc.exists ? doc.data() : null;
    if (!cs) return res.status(404).json({ error: 'Run candidate verification first' });

    const weakAreas = cs.weak_areas || [];
    const skillGaps = cs.skill_gaps || [];
    const suggestions = [];

    // Provide generic questions if no DB access
    suggestions.push({ area: 'Coding Skills', questions: [{ title: 'Implement a rate limiter', difficulty: 'Medium' }] });
    suggestions.push({ area: 'Technical Knowledge', questions: [{ title: 'Explain CORS', difficulty: 'Easy' }] });

    suggestions.push({
      area: 'Skill Gap Probing',
      skill_gaps: skillGaps,
      custom_questions: skillGaps.slice(0, 3).map(s => ({
        title: `Describe a project where you used ${s}. What challenges did you face?`,
        type: 'behavioral'
      }))
    });

    await db.collection('interview_suggestions').add({
      candidate_id: candidateId, hr_id: hrId, suggested_questions: suggestions, based_on_weak_areas: weakAreas, created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ suggestions, weak_areas: weakAreas, skill_gaps: skillGaps });
  } catch (err) {
    res.status(500).json({ error: 'Failed: ' + err.message });
  }
};

module.exports = { calculateConfidenceScore, getConfidenceScore, predictRisk, generateInterviewSuggestions };

