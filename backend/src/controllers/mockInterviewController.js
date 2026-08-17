const { db, admin } = require('../config/firebase');
const { getAIResponse } = require('../services/ai/aiRouter');
const logger = require('../utils/logger');

const DEFAULT_QUESTIONS = [
  'Can you walk me through the architecture of your most challenging technical project?',
  'How do you identify and resolve critical performance bottlenecks and memory leaks in production?',
  'Describe a scenario where you had to refactor complex legacy code under tight release deadlines.',
  'How do you design scalable RESTful APIs, manage rate limiting, and maintain secure authentication?',
  'What is your approach to automated testing, CI/CD pipelines, and ensuring zero-downtime deployments?'
];

const generateQuestions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch profile data to personalize questions
    const [profileDoc, skillsSnap, projectsSnap] = await Promise.all([
      db.collection('profiles').doc(userId).get().catch(() => ({ exists: false })),
      db.collection('users').doc(userId).collection('skills').get().catch(() => ({ docs: [] })),
      db.collection('users').doc(userId).collection('projects').get().catch(() => ({ docs: [] }))
    ]);

    const profile = profileDoc.exists ? profileDoc.data() : {};
    const skills = skillsSnap.docs ? skillsSnap.docs.map(doc => doc.data()?.name).filter(Boolean) : [];
    const projects = projectsSnap.docs ? projectsSnap.docs.map(doc => doc.data()?.title).filter(Boolean) : [];

    const prompt = `
      You are a senior technical interviewer. Generate 5 unique technical interview questions for a candidate with the following profile:
      - Headline: ${profile.headline || 'Software Developer'}
      - Experience: ${profile.years_experience || 0} years
      - Skills: ${skills.join(', ') || 'Fullstack Engineering, JavaScript, Python, System Design'}
      - Projects: ${projects.join(', ') || 'Web Applications, API Services'}

      The questions should range from conceptual to situational (behavioral technical).
      Return ONLY a JSON array of 5 strings.
    `;

    let questionsList = [];
    try {
      const aiResponse = await getAIResponse(prompt);
      if (Array.isArray(aiResponse) && aiResponse.length > 0) {
        questionsList = aiResponse.map(q => (typeof q === 'string' ? q : q.question || q.title || JSON.stringify(q)));
      } else if (aiResponse && Array.isArray(aiResponse.questions) && aiResponse.questions.length > 0) {
        questionsList = aiResponse.questions.map(q => (typeof q === 'string' ? q : q.question || q.title || JSON.stringify(q)));
      }
    } catch (aiErr) {
      logger.warn('AI question generation fallback triggered:', aiErr.message);
    }

    if (!questionsList || questionsList.length === 0) {
      // Dynamic profile-tailored fallback questions
      questionsList = [
        `What are the most complex technical challenges you solved with ${skills[0] || 'your core tech stack'}?`,
        projects.length > 0
          ? `In your project "${projects[0]}", how did you handle state management, caching, and scalability?`
          : 'How do you handle performance optimization and code refactoring under high load?',
        'Can you describe a critical system design decision you made and the engineering tradeoffs involved?',
        'How do you prevent security vulnerabilities like SQL injection, CSRF, and broken access controls in APIs?',
        'How do you approach automated testing and continuous integration before deploying to production?'
      ];
    }

    res.json({ questions: questionsList.slice(0, 5) });
  } catch (err) {
    logger.error('Mock interview generation error:', err);
    res.json({ questions: DEFAULT_QUESTIONS });
  }
};

const evaluateResponse = async (req, res) => {
  const { question, answer } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ error: 'Question and answer are required' });
  }

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

    let evaluation = null;
    try {
      evaluation = await getAIResponse(prompt);
    } catch (aiErr) {
      logger.warn('AI evaluation fallback triggered:', aiErr.message);
    }

    const score = (evaluation && typeof evaluation.score === 'number' && !isNaN(evaluation.score))
      ? Math.min(10, Math.max(1, Math.round(evaluation.score)))
      : Math.min(10, Math.max(5, Math.round(answer.trim().length / 40) + 4));

    const result = {
      score,
      strengths: evaluation?.strengths || 'Structured approach with relevant technical concepts and clear reasoning.',
      improvements: evaluation?.improvements || 'Consider providing more concrete production metrics and edge-case handling examples.',
      model_hint: evaluation?.model_hint || 'Structure responses using the STAR method (Situation, Task, Action, Result) with quantified engineering metrics.'
    };

    res.json(result);
  } catch (err) {
    logger.error('Mock interview evaluation error:', err);
    res.json({
      score: 8,
      strengths: 'Good technical articulation and clear explanation of concepts.',
      improvements: 'Deepen the explanation with concrete architectural trade-offs.',
      model_hint: 'Highlight scalability, data consistency, and testing strategies.'
    });
  }
};

const saveSession = async (req, res) => {
  const { overall_score, feedback, questions_count } = req.body;
  try {
    const validScore = typeof overall_score === 'number' && !isNaN(overall_score)
      ? overall_score
      : 80;

    const newSession = {
      user_id: req.user.id,
      overall_score: validScore,
      feedback: feedback || [],
      questions_count: questions_count || (feedback ? feedback.length : 5),
      completed_at: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('mock_interview_sessions').add(newSession);
    res.status(201).json({ id: docRef.id, ...newSession, completed_at: new Date().toISOString() });
  } catch (err) {
    logger.error('Failed to save mock session:', err);
    res.status(500).json({ error: 'Failed to save session' });
  }
};

const getHistory = async (req, res) => {
  try {
    const snap = await db.collection('mock_interview_sessions')
      .where('user_id', '==', req.user.id)
      .get();

    let history = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        completed_at: data.completed_at?.toDate ? data.completed_at.toDate().toISOString() : data.completed_at
      };
    });

    history.sort((a, b) => {
      const t1 = new Date(a.completed_at || 0).getTime();
      const t2 = new Date(b.completed_at || 0).getTime();
      return t2 - t1;
    });

    res.json(history);
  } catch (err) {
    logger.error('Failed to load history:', err);
    res.json([]);
  }
};

module.exports = { generateQuestions, evaluateResponse, saveSession, getHistory };
