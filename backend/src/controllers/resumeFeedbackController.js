const { db, admin } = require('../config/firebase');
const { getAIResponse } = require('../services/ai/aiRouter');
const logger = require('../utils/logger');

const getResumeFeedback = async (req, res) => {
  try {
    // 1. Check if we already have recent feedback
    const feedbackSnap = await db.collection('resume_feedback')
      .where('user_id', '==', req.user.id)
      .get();

    if (!feedbackSnap.empty) {
      const allDocs = feedbackSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      allDocs.sort((a, b) => {
        const t1 = a.calculated_at?.toMillis ? a.calculated_at.toMillis() : 0;
        const t2 = b.calculated_at?.toMillis ? b.calculated_at.toMillis() : 0;
        return t2 - t1;
      });
      const existing = allDocs[0];
      const calcDate = existing.calculated_at?.toDate() || new Date(0);
      if ((new Date() - calcDate) < 24 * 60 * 60 * 1000) {
        return res.json({ id: feedbackSnap.docs[0].id, ...existing });
      }
    }

    // 2. Otherwise, generate new feedback
    const fetchSub = async (col) => {
      const snap = await db.collection('users').doc(req.user.id).collection(col).get();
      return snap.docs.map(doc => doc.data());
    };

    const [profileDoc, skills, projects, experience] = await Promise.all([
      db.collection('profiles').doc(req.user.id).get(),
      fetchSub('skills'),
      fetchSub('projects'),
      fetchSub('experience')
    ]);
    
    const profile = profileDoc.exists ? profileDoc.data() : {};

    const prompt = `
      Evaluate the following professional profile for resume optimization:
      - Headline: ${profile.headline || 'N/A'}
      - Skills: ${skills.map(s => `${s.name} (${s.verification_level})`).join(', ')}
      - Projects: ${projects.map(p => p.title).join(', ')}
      - Experience: ${experience.map(e => `${e.role} at ${e.company}`).join(', ')}

      Provide a resume score (0-100) and 5 actionable suggestions for improvement.
      Return ONLY a JSON object with keys: "score", "suggestions" (array of strings).
    `;

    const feedbackData = await getAIResponse(prompt);
    
    const newFeedback = {
      user_id: req.user.id,
      score: feedbackData.score || 85,
      feedback: feedbackData.suggestions || feedbackData.tips || feedbackData.feedback || ["Improve action verbs", "Quantify your achievements"],
      calculated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('resume_feedback').add(newFeedback);

    res.json({ id: docRef.id, ...newFeedback });
  } catch (err) {
    logger.error('Resume feedback error:', err);
    res.status(500).json({ error: 'Failed to generate resume feedback' });
  }
};

module.exports = { getResumeFeedback };
