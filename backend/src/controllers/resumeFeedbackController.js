const { query } = require('../config/database');
const { getAIResponse } = require('../services/ai/aiRouter');
const logger = require('../utils/logger');

const getResumeFeedback = async (req, res) => {
  try {
    // 1. Check if we already have recent feedback
    const existing = await query(
      'SELECT * FROM resume_feedback WHERE user_id=$1 ORDER BY calculated_at DESC LIMIT 1',
      [req.user.id]
    );

    // If feedback is less than 24h old, return it
    if (existing.rows[0] && (new Date() - new Date(existing.rows[0].calculated_at)) < 24 * 60 * 60 * 1000) {
      return res.json(existing.rows[0]);
    }

    // 2. Otherwise, generate new feedback
    const [profile, skills, projects, experience] = await Promise.all([
      query('SELECT headline, bio FROM profiles WHERE user_id = $1', [req.user.id]),
      query('SELECT name, verification_level FROM skills WHERE user_id = $1', [req.user.id]),
      query('SELECT title, description FROM projects WHERE user_id = $1', [req.user.id]),
      query('SELECT role, company, description FROM experience WHERE user_id = $1', [req.user.id])
    ]);

    const prompt = `
      Evaluate the following professional profile for resume optimization:
      - Headline: ${profile.rows[0]?.headline || 'N/A'}
      - Skills: ${skills.rows.map(s => `${s.name} (${s.verification_level})`).join(', ')}
      - Projects: ${projects.rows.map(p => p.title).join(', ')}
      - Experience: ${experience.rows.map(e => `${e.role} at ${e.company}`).join(', ')}

      Provide a resume score (0-100) and 5 actionable suggestions for improvement.
      Return ONLY a JSON object with keys: "score", "suggestions" (array of strings).
    `;

    const feedbackData = await getAIResponse(prompt);
    
    const result = await query(
      'INSERT INTO resume_feedback (user_id, score, feedback) VALUES ($1,$2,$3) RETURNING *',
      [req.user.id, feedbackData.score, JSON.stringify(feedbackData.suggestions)]
    );

    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Resume feedback error:', err);
    res.status(500).json({ error: 'Failed to generate resume feedback' });
  }
};

module.exports = { getResumeFeedback };
