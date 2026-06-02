const { query } = require('../config/database');
const { getAIResponse } = require('../services/ai/aiRouter');
const logger = require('../utils/logger');

const generateQuestions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch profile data to personalize questions
    const [profile, skills, projects] = await Promise.all([
      query('SELECT headline, bio, years_experience FROM profiles WHERE user_id = $1', [userId]),
      query('SELECT name FROM skills WHERE user_id = $1', [userId]),
      query('SELECT title, description FROM projects WHERE user_id = $1', [userId])
    ]);

    const prompt = `
      You are a senior technical interviewer. Generate 5 unique technical interview questions for a candidate with the following profile:
      - Headline: ${profile.rows[0]?.headline || 'Software Developer'}
      - Experience: ${profile.rows[0]?.years_experience || 0} years
      - Skills: ${skills.rows.map(s => s.name).join(', ')}
      - Projects: ${projects.rows.map(p => p.title).join(', ')}

      The questions should range from conceptual to situational (behavioral technical).
      Return ONLY a JSON array of strings.
    `;

    const questions = await getAIResponse(prompt);
    res.json({ questions });
  } catch (err) {
    logger.error('Mock interview generation error:', err);
    res.status(500).json({ error: 'Failed to generate interview questions' });
  }
};

const evaluateResponse = async (req, res) => {
  const { question, answer } = req.body;
  if (!question || !answer) return res.status(400).json({ error: 'Question and answer are required' });

  try {
    const prompt = `
      As a technical interviewer, evaluate the following candidate response.
      Question: "${question}"
      Candidate Answer: "${answer}"

      Provide a constructive evaluation including:
      1. Correctness/Completeness (0-10 score)
      2. Key strengths of the answer
      3. Areas for improvement
      4. A "Model Answer" hint.

      Return ONLY a JSON object with keys: "score", "strengths", "improvements", "model_hint".
    `;

    const evaluation = await getAIResponse(prompt);
    res.json(evaluation);
  } catch (err) {
    logger.error('Mock interview evaluation error:', err);
    res.status(500).json({ error: 'Failed to evaluate response' });
  }
};

const saveSession = async (req, res) => {
  const { overall_score, feedback, questions_count } = req.body;
  try {
    const result = await query(
      'INSERT INTO mock_interview_sessions (user_id, overall_score, feedback, questions_count) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.user.id, overall_score, JSON.stringify(feedback), questions_count]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error('Failed to save mock session:', err);
    res.status(500).json({ error: 'Failed to save session' });
  }
};

const getHistory = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM mock_interview_sessions WHERE user_id=$1 ORDER BY completed_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load history' });
  }
};

module.exports = { generateQuestions, evaluateResponse, saveSession, getHistory };
