const { pool } = require('../config/database');
const { githubVerification, leetcodeVerification } = require('../utils/externalVerifications');
const logger = require('../utils/logger');

const scoringController = {
  calculateTrustIndex: async (req, res) => {
    const userId = req.user.id;

    try {
      // 1. Fetch all data points
      const [profile, skills, interviews, resume] = await Promise.all([
        pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]),
        pool.query('SELECT * FROM skills WHERE user_id = $1', [userId]),
        pool.query('SELECT overall_score FROM mock_interview_sessions WHERE user_id = $1 ORDER BY completed_at DESC LIMIT 1', [userId]),
        pool.query('SELECT score FROM resume_feedback WHERE user_id = $1', [userId])
      ]);

      const userProfile = profile.rows[0];
      let githubScore = 0;
      let fraudRisk = 'low';

      // 2. External Data Analysis
      if (userProfile?.github_url) {
        const githubUsername = userProfile.github_url.split('/').pop();
        const githubData = await githubVerification.analyzeProfile(githubUsername);
        if (githubData) {
          githubScore = Math.round(githubData.originality_ratio * 100);
          if (githubData.trust_level === 'low') fraudRisk = 'medium';
        }
      }

      // 3. Weighting Algorithm
      const interviewScore = interviews.rows[0]?.overall_score || 0;
      const resumeScore = resume.rows[0]?.score || 0;
      const verifiedSkills = skills.rows.filter(s => s.is_verified).length;
      const skillScore = Math.min((verifiedSkills / (skills.rows.length || 1)) * 100, 100);

      // Weighted Score: 30% GitHub, 30% Skills, 20% Interview, 20% Resume
      const overallIndex = Math.round(
        (githubScore * 0.3) + 
        (skillScore * 0.3) + 
        (interviewScore * 0.2) + 
        (resumeScore * 0.2)
      );

      // 4. Persistence
      await pool.query(
        `INSERT INTO confidence_scores (user_id, overall_score, github_score, practice_score, fraud_probability, fraud_reasons, calculated_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE SET 
         overall_score = $2, github_score = $3, practice_score = $4, fraud_probability = $5, fraud_reasons = $6, calculated_at = CURRENT_TIMESTAMP`,
        [userId, overallIndex, githubScore, interviewScore, 0.5, JSON.stringify([])]
      );

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
      const result = await pool.query('SELECT * FROM confidence_scores WHERE user_id = $1', [req.params.userId || req.user.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Score not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  }
};

module.exports = scoringController;
