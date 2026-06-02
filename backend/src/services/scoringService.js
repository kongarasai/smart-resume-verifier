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
const { query } = require('../config/database');
const axios = require('axios');

const MAX_SKILL_SCORE = 100;

const computeSkillVerificationScore = async (userId) => {
  // Resume Skill Match Score calculation logic (max 100)
  const result = await query(
    'SELECT verification_level, COUNT(*) as cnt FROM skill_verifications WHERE user_id=$1 GROUP BY verification_level',
    [userId]
  );
  let raw = 0;
  for (const row of result.rows) {
    if (row.verification_level === 'claimed') raw += parseInt(row.cnt) * 10;
    else if (row.verification_level === 'evidence') raw += parseInt(row.cnt) * 20;
    else if (row.verification_level === 'verified') raw += parseInt(row.cnt) * 40;
    else if (row.verification_level === 'strong_verified') raw += parseInt(row.cnt) * 50;
  }
  // Assume ~10 skills verified for a perfect score
  return Math.min(Math.round((raw / 500) * 100), MAX_SKILL_SCORE);
};

const computePracticeScore = async (userId) => {
  // Coding Test Score implementation
  // Fetch average score from coding practice sessions
  const result = await query(
    `SELECT AVG(score_percentage) as avg_score
     FROM practice_sessions 
     WHERE user_id=$1 AND category='coding'`,
    [userId]
  );
  
  const codingSessionAvg = parseFloat(result.rows[0]?.avg_score || 0);
  
  // Also check leetcode fallback if practice session is missing
  const lcResult = await query('SELECT coding_evidence_score FROM leetcode_data WHERE user_id=$1', [userId]);
  const lcScore = parseFloat(lcResult.rows[0]?.coding_evidence_score || 0);
  
  // Use the best available coding proof
  return Math.max(codingSessionAvg, lcScore, 0);
};

const computeGitHubScore = async (userId) => {
  const result = await query('SELECT skill_match_score FROM github_data WHERE user_id=$1', [userId]);
  return parseFloat(result.rows[0]?.skill_match_score || 0);
};

async function getFraudProbability(userId, overallScore, testScore, githubScore, skillScore) {
  try {
    // Collect extra user data for fraud prediction API
    const userRes = await query('SELECT email FROM users WHERE id=$1', [userId]);
    const parsedRes = await query('SELECT parsed_skills FROM resume_parse_results WHERE user_id=$1', [userId]);
    const claimedSkillsStr = (parsedRes.rows[0]?.parsed_skills || []).join(', ');
    
    // Call the Python AI Microservice
    const aiResp = await axios.post(`${process.env.OCR_SERVICE_URL || 'http://10.68.139.201:8000'}/ai/fraud-predict`, {
       test_score: testScore,
       github_score: githubScore,
       skill_score: skillScore,
       claimed_skills_text: claimedSkillsStr || "unknown"
    }, { timeout: 8000 }).catch(() => null);

    if (aiResp && aiResp.data && typeof aiResp.data.fraud_probability !== 'undefined') {
       return {
         prob: parseFloat(aiResp.data.fraud_probability),
         reasons: aiResp.data.fraud_reasons || []
       };
    }
  } catch (e) {
    // Fallback if AI api is down or missing
  }
  
  // Fallback simple heuristic if AI fails
  let fraudRiskProb = 0.5; // Neutral
  let reasons = [];
  if (testScore > 80 && githubScore < 20) { fraudRiskProb = 0.75; reasons.push("Suspiciously high test score but no GitHub proof"); }
  if (skillScore > 90 && githubScore < 10) { fraudRiskProb = 0.8; reasons.push("Claims many skills but lacks GitHub proof"); }
  if (testScore < 30 && skillScore > 80) { fraudRiskProb = 0.85; reasons.push("Failed test despite claiming high skills"); }
  if (githubScore > 70 && testScore > 70) { fraudRiskProb = 0.1; }
  
  return { prob: fraudRiskProb, reasons };
}

const calculateConfidenceScore = async (req, res) => {
  const userId = req.params.userId || req.user.id;
  try {
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
    const profileRes = await query('SELECT profile_completeness FROM profiles WHERE user_id=$1', [userId]);
    const profileScore = profileRes.rows[0]?.profile_completeness || 0;

    // AI Fraud Risk Component
    const fraudData = await getFraudProbability(userId, finalScore, testScore, githubScore, skillScore);
    const fraudProbability = fraudData.prob;
    
    let fraudRiskLabel = 'Medium';
    if (fraudProbability > 0.65) fraudRiskLabel = 'High';
    else if (fraudProbability < 0.35) fraudRiskLabel = 'Low';

    // Skill gaps logic
    const allVerified = await query("SELECT skill_name FROM skill_verifications WHERE user_id=$1 AND source_count >= 1", [userId]);
    const verifiedSet = new Set(allVerified.rows.map(r => r.skill_name.toLowerCase()));
    const commonSkills = ['javascript', 'python', 'sql', 'git', 'docker', 'react', 'nodejs', 'aws', 'java'];
    const skillGaps = commonSkills.filter(s => !verifiedSet.has(s));

    const weakAreas = [];
    if (skillScore < 50) weakAreas.push('Verify more skills via resume or manual upload');
    if (testScore < 60) weakAreas.push('Improve coding test results on SentryConnect or LeetCode');
    if (githubScore < 60) weakAreas.push('Enhance GitHub footprint and origin repositories');

    // Store in DB
    await query(
      `INSERT INTO confidence_scores 
         (user_id, github_score, practice_score, coding_evidence_score, profile_completeness_score,
          project_score, overall_score, confidence_label, skill_gaps, weak_areas, 
          fraud_probability, fraud_reasons, calculated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         github_score=$2, practice_score=$3, coding_evidence_score=$4, profile_completeness_score=$5,
         project_score=$6, overall_score=$7, confidence_label=$8, skill_gaps=$9, weak_areas=$10,
         fraud_probability=$11, fraud_reasons=$12, calculated_at=NOW()`,
      [
        userId, 
        Math.round(githubScore), 
        Math.round(testScore), 
        Math.round(testScore), // used leetcode slot temporarily to mirror code test
        profileScore,
        0, // Project score removed from the primary math requirement, but kept in Table as 0
        finalScore, 
        confidenceLabel, 
        JSON.stringify(skillGaps), 
        JSON.stringify(weakAreas),
        fraudProbability,
        JSON.stringify(fraudData.reasons)
      ]
    );

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
  const result = await query('SELECT * FROM confidence_scores WHERE user_id=$1', [userId]);

  let respData = result.rows[0] ? result.rows[0] : null;

  if (respData) {
     // If we have cached fraud data, use it. Otherwise, return with defaults.
     // This avoids the slow AI microservice call on every GET request.
     const fraudProb = respData.fraud_probability !== null ? parseFloat(respData.fraud_probability) : 0.5;
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
  const cs = (await query('SELECT * FROM confidence_scores WHERE user_id=$1', [userId])).rows[0];
  if (!cs) return res.json({ risk: 'unknown', reason: 'No score. Run verification first.' });

  // Approximate old predictionRisk mapped to AI
  const pScore = parseFloat(cs.practice_score || 0);
  const gScore = parseFloat(cs.github_score || 0);
  const sScore = Math.min(100, Math.max(0, (cs.overall_score - (pScore * 0.5) - (gScore * 0.3)) / 0.2));

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
    const cs = (await query('SELECT weak_areas, skill_gaps FROM confidence_scores WHERE user_id=$1', [candidateId])).rows[0];
    if (!cs) return res.status(404).json({ error: 'Run candidate verification first' });

    const weakAreas = cs.weak_areas || [];
    const skillGaps = cs.skill_gaps || [];
    const suggestions = [];

    const codingQs = await query("SELECT id, title, difficulty, category FROM questions WHERE category='coding' ORDER BY RANDOM() LIMIT 3");
    suggestions.push({ area: 'Coding Skills', questions: codingQs.rows });

    const techQs = await query("SELECT id, title, difficulty, category FROM questions WHERE category='technical_mcq' ORDER BY RANDOM() LIMIT 3");
    suggestions.push({ area: 'Technical Knowledge', questions: techQs.rows });

    suggestions.push({
      area: 'Skill Gap Probing',
      skill_gaps: skillGaps,
      custom_questions: skillGaps.slice(0, 3).map(s => ({
        title: `Describe a project where you used ${s}. What challenges did you face?`,
        type: 'behavioral'
      }))
    });

    await query(
      'INSERT INTO interview_suggestions (candidate_id, hr_id, suggested_questions, based_on_weak_areas) VALUES ($1,$2,$3,$4)',
      [candidateId, hrId, JSON.stringify(suggestions), weakAreas]
    ).catch(() => {});

    res.json({ suggestions, weak_areas: weakAreas, skill_gaps: skillGaps });
  } catch (err) {
    res.status(500).json({ error: 'Failed: ' + err.message });
  }
};

module.exports = { calculateConfidenceScore, getConfidenceScore, predictRisk, generateInterviewSuggestions };

