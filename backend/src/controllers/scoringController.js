const { db, admin } = require('../config/firebase');
const { githubVerification, leetcodeVerification } = require('../utils/externalVerifications');
const logger = require('../utils/logger');
const { canReadUser } = require('../middleware/authorize');

const scoringController = {
  calculateTrustIndex: async (req, res) => {
    const userId = req.user.id;

    try {
      // 1. Fetch all data points
      const [profileDoc, skillsSnap, interviewsSnap, resumeSnap] = await Promise.all([
        db.collection('profiles').doc(userId).get(),
        db.collection('users').doc(userId).collection('skills').get(),
        db.collection('mock_interview_sessions').where('user_id', '==', userId).get(),
        db.collection('resume_feedback').where('user_id', '==', userId).get()
      ]);

      let interviewsDocs = interviewsSnap.docs.map(d => d.data()).sort((a,b) => (b.completed_at?.toMillis?.()||0) - (a.completed_at?.toMillis?.()||0));
      let resumeDocs = resumeSnap.docs.map(d => d.data()).sort((a,b) => (b.calculated_at?.toMillis?.()||0) - (a.calculated_at?.toMillis?.()||0));

      const userProfile = profileDoc.exists ? profileDoc.data() : null;
      let githubScore = 0;
      let fraudRisk = 'low';

      let rawFraudProb = 0.15 + (Math.random() * 0.1); // Base dynamic risk between 15% and 25%

      if (!userProfile?.github_url && !userProfile?.leetcode_url) {
        rawFraudProb += 0.3; // High risk if no external verification
      }

      // 2. External Data Analysis
      if (userProfile?.github_url) {
        const githubUsername = userProfile.github_url.split('/').pop();
        const githubData = await githubVerification.analyzeProfile(githubUsername).catch(() => null);
        if (githubData) {
          githubScore = Math.round(githubData.originality_ratio * 100);
          if (githubData.trust_level === 'low') rawFraudProb += 0.35;
          if (githubData.trust_level === 'high') rawFraudProb = Math.max(0.05, rawFraudProb - 0.2);
        }
      }

      // 3. Weighting Algorithm
      const interviewScore = interviewsDocs.length > 0 ? interviewsDocs[0].overall_score : 0;
      const resumeScore = resumeDocs.length > 0 ? resumeDocs[0].score : 0;
      
      const skills = skillsSnap.docs.map(doc => doc.data());
      const verifiedSkills = skills.filter(s => s.is_verified || ['verified', 'expert'].includes(s.verification_level)).length;
      const skillScore = Math.min((verifiedSkills / (skills.length || 1)) * 100, 100);

      // Weighted Score: 30% GitHub, 30% Skills, 20% Interview, 20% Resume
      const overallIndex = Math.round(
        (githubScore * 0.3) + 
        (skillScore * 0.3) + 
        (interviewScore * 0.2) + 
        (resumeScore * 0.2)
      );

      if (interviewsDocs.length > 0 && interviewsDocs[0].overall_score < 40 && verifiedSkills > 8) {
        rawFraudProb += 0.25; // High claims, low interview performance
      }

      rawFraudProb = Math.min(Math.max(rawFraudProb, 0.05), 0.95);
      fraudRisk = rawFraudProb > 0.65 ? 'high' : rawFraudProb > 0.35 ? 'medium' : 'low';

      // 4. Persistence
      const scoreData = {
        user_id: userId,
        overall_score: overallIndex,
        github_score: githubScore,
        practice_score: interviewScore,
        fraud_probability: rawFraudProb,
        fraud_reasons: [],
        calculated_at: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('confidence_scores').doc(userId).set(scoreData, { merge: true });

      res.json({
        trust_index: overallIndex,
        breakdown: { githubScore, skillScore, interviewScore, resumeScore },
        fraud_risk_level: fraudRisk
      });

    } catch (err) {
      logger.error(`Scoring failed for user ${userId}: ${err.message}`);
      res.status(500).json({ error: 'Failed to calculate trust score' });
    }
  },

  getTrustScore: async (req, res) => {
    try {
      const targetId = req.params.userId || req.user.id;

      // IDOR guard: candidates can only view their own trust score
      if (!canReadUser(req, targetId)) {
        return res.status(403).json({ error: 'Access denied: you can only view your own trust score' });
      }

      const doc = await db.collection('confidence_scores').doc(targetId).get();
      if (!doc.exists) return res.status(404).json({ error: 'Score not found' });
      res.json({ id: doc.id, ...doc.data() });
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  }
};

module.exports = scoringController;
