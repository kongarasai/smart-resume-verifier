const { db, admin } = require('../config/firebase');
const { getAIResponse } = require('../services/ai/aiRouter');
const logger = require('../utils/logger');

const generateQuestions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch profile data to personalize questions
    const [profileDoc, skillsSnap, projectsSnap] = await Promise.all([
      db.collection('profiles').doc(userId).get(),
      db.collection('users').doc(userId).collection('skills').get(),
      db.collection('users').doc(userId).collection('projects').get()
    ]);

    const profile = profileDoc.exists ? profileDoc.data() : {};
    const skills = skillsSnap.docs.map(doc => doc.data());
    const projects = projectsSnap.docs.map(doc => doc.data());

    const prompt = `
      You are a senior technical interviewer. Generate 5 unique technical interview questions for a candidate with the following profile:
      - Headline: ${profile.headline || 'Software Developer'}
      - Experience: ${profile.years_experience || 0} years
      - Skills: ${skills.map(s => s.name).join(', ')}
      - Projects: ${projects.map(p => p.title).join(', ')}

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
    const newSession = {
      user_id: req.user.id,
      overall_score,
      feedback,
      questions_count,
      completed_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('mock_interview_sessions').add(newSession);
    res.status(201).json({ id: docRef.id, ...newSession });
  } catch (err) {
    logger.error('Failed to save mock session:', err);
    res.status(500).json({ error: 'Failed to save session' });
  }
};

const getHistory = async (req, res) => {
  try {
    const snap = await db.collection('mock_interview_sessions')
      .where('user_id', '==', req.user.id)
      .orderBy('completed_at', 'desc')
      .get();
      
    const history = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load history' });
  }
};

module.exports = { generateQuestions, evaluateResponse, saveSession, getHistory };
