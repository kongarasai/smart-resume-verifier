const { db, admin } = require('../config/firebase');
const { getAIResponse } = require('../services/ai/aiRouter');
const { sendNotification } = require('./notificationController');
const logger = require('../utils/logger');
const axios = require('axios');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const MAX_ATTEMPTS_PER_QUESTION = 3;

const getQuestions = async (req, res) => {
  const { category, difficulty, group_id, limit = 50, tag } = req.query;
  try {
    let qRef = db.collection('questions').where('is_active', '==', true);
    if (category) qRef = qRef.where('category', '==', category);
    if (difficulty) qRef = qRef.where('difficulty', '==', difficulty);
    if (group_id) {
      qRef = qRef.where('group_id', '==', group_id);
    } else {
      qRef = qRef.where('group_id', '==', null);
    }

    const snap = await qRef.get();
    let questions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (tag) {
      questions = questions.filter(q => q.tags && q.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase()));
    }

    questions.sort(() => Math.random() - 0.5);
    res.json(questions.slice(0, parseInt(limit)));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};

const getQuestion = async (req, res) => {
  try {
    const doc = await db.collection('questions').doc(req.params.id).get();
    if (!doc.exists || !doc.data().is_active) return res.status(404).json({ error: 'Question not found' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch question' });
  }
};

const submitAnswer = async (req, res) => {
  const { question_id, submitted_answer, time_taken_seconds } = req.body;
  if (!question_id || submitted_answer === undefined) {
    return res.status(400).json({ error: 'question_id and submitted_answer required' });
  }

  try {
    const qDoc = await db.collection('questions').doc(question_id).get();
    if (!qDoc.exists) return res.status(404).json({ error: 'Question not found' });
    const question = qDoc.data();

    const attemptsSnap = await db.collection('practice_attempts')
      .where('user_id', '==', req.user.id)
      .where('question_id', '==', question_id)
      .get();

    const attemptCount = attemptsSnap.size;
    const maxAttempts = question.max_attempts || MAX_ATTEMPTS_PER_QUESTION;

    if (attemptCount >= maxAttempts) {
      return res.status(429).json({
        error: `Maximum ${maxAttempts} attempts reached for this question. Try a different question.`,
        attempts_used: attemptCount, max_attempts: maxAttempts,
      });
    }

    let is_correct = null;
    let score = 0;

    if (question.question_type === 'mcq' && question.correct_answer) {
      const normalizedSubmitted = String(submitted_answer || '').trim().toLowerCase();
      const normalizedCorrect = String(question.correct_answer).trim().toLowerCase();
      is_correct = normalizedSubmitted === normalizedCorrect;
      score = is_correct ? (question.points || 10) : 0;
    }

    const newAttempt = {
      user_id: req.user.id, question_id, submitted_answer, is_correct, score, time_taken_seconds, attempt_number: attemptCount + 1, attempted_at: admin.firestore.FieldValue.serverTimestamp()
    };
    const attemptRef = await db.collection('practice_attempts').add(newAttempt);

    // Note: Do not log single question micro-events into timeline; whole session is logged on completion

    if (is_correct && question.tags) {
      const batch = db.batch();
      for (const tag of question.tags) {
        const evidenceRef = db.collection('users').doc(req.user.id).collection('skill_evidence').doc(tag.toLowerCase());
        batch.set(evidenceRef, { practice_evidence: { correct_answers: admin.firestore.FieldValue.increment(1) }, updated_at: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

        // Skip direct skill verification update here for brevity, assume skill engine catches up
      }
      await batch.commit();
    }

    res.json({
      attempt: { id: attemptRef.id, ...newAttempt },
      is_correct, score, correct_answer: question.question_type === 'mcq' ? question.correct_answer : null,
      attempts_used: attemptCount + 1, max_attempts: maxAttempts, attempts_remaining: maxAttempts - (attemptCount + 1),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit: ' + err.message });
  }
};

const submitAssignmentTest = async (req, res) => {
  const { assignment_id, answers } = req.body;
  if (!assignment_id || !answers) return res.status(400).json({ error: 'Missing data' });
  const userId = req.user.id;

  try {
    const aDoc = await db.collection('assignments').doc(assignment_id).get();
    const assignmentName = aDoc.exists ? aDoc.data().name : 'Assignment';

    let totalScore = 0;
    let correctCount = 0;
    const results = [];
    const batch = db.batch();

    for (const [qId, ans] of Object.entries(answers)) {
      const qDoc = await db.collection('questions').doc(qId).get();
      if (!qDoc.exists) continue;
      const question = qDoc.data();

      let is_correct = null;
      let score = 0;
      if (question.question_type === 'mcq' && question.correct_answer) {
        is_correct = String(ans || '').trim().toLowerCase() === String(question.correct_answer).trim().toLowerCase();
        score = is_correct ? (question.points || 10) : 0;
      }

      const newAttempt = { user_id: userId, question_id: qId, submitted_answer: ans, is_correct, score, time_taken_seconds: 0, attempted_at: admin.firestore.FieldValue.serverTimestamp() };
      batch.set(db.collection('practice_attempts').doc(), newAttempt);

      if (is_correct) {
        totalScore += score;
        correctCount++;
      }
      results.push({ question_id: qId, is_correct, score });
    }

    const qSnap = await db.collection('questions').where('assignment_id', '==', assignment_id).get();
    let maxPoints = 0;
    qSnap.forEach(doc => maxPoints += (doc.data().points || 10));
    const percentage = maxPoints > 0 ? Math.round((totalScore / maxPoints) * 100) : 0;

    batch.set(db.collection('practice_sessions').doc(), {
      user_id: userId, category: assignmentName, total_questions: results.length, correct_answers: correctCount, score_percentage: percentage, completed_at: admin.firestore.FieldValue.serverTimestamp()
    });

    batch.set(db.collection('users').doc(userId).collection('progress_events').doc(), {
      event_type: 'assignment_completed', event_title: `Completed: ${assignmentName}`, event_detail: `Scored ${percentage}% (${correctCount}/${results.length} correct)`, points_gained: totalScore, created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();
    res.json({ message: 'Assignment submitted successfully', totalScore, correctCount, results, percentage });
  } catch (err) {
    res.status(500).json({ error: 'Submission failed: ' + err.message });
  }
};

const startSession = async (req, res) => {
  req.query = req.body;
  await getQuestions(req, res);
};

const endSession = async (req, res) => {
  const { category, question_ids, group_id } = req.body;
  try {
    const qIdStrings = Array.isArray(question_ids) ? question_ids.map(String) : [];
    const attemptsSnap = await db.collection('practice_attempts').where('user_id', '==', req.user.id).get();
    
    // Match attempts against answered question IDs
    let recentAttempts = attemptsSnap.docs
      .map(d => d.data())
      .filter(a => (qIdStrings.length === 0 || qIdStrings.includes(String(a.question_id))) && a.is_correct !== null);

    const correct = recentAttempts.filter(a => a.is_correct).length;
    const totalScore = recentAttempts.reduce((s, a) => s + (a.score || 0), 0);
    const totalCount = recentAttempts.length > 0 ? recentAttempts.length : (qIdStrings.length > 0 ? qIdStrings.length : 1);
    const percentage = totalCount > 0 ? Math.round((correct / totalCount) * 100) : 0;

    const newSession = {
      user_id: req.user.id,
      category: category || 'Practice',
      total_questions: totalCount,
      correct_answers: correct,
      score_percentage: percentage,
      completed_at: admin.firestore.FieldValue.serverTimestamp()
    };
    const sRef = await db.collection('practice_sessions').add(newSession);

    await db.collection('users').doc(req.user.id).collection('progress_events').add({
      event_type: 'practice_completed',
      event_title: 'Practice Session Completed',
      event_detail: `${category || 'Practice'}: ${correct}/${totalCount} correct (${percentage}%)`,
      points_gained: totalScore,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Automatically recalculate and sync confidence score
    try {
      const scoreDoc = await db.collection('confidence_scores').doc(req.user.id).get();
      if (scoreDoc.exists) {
        const cur = scoreDoc.data();
        const newPracticeScore = Math.max(cur.practice_score || 0, percentage);
        const overall = Math.round(
          ((cur.github_score || 0) * 0.3) +
          ((cur.skill_score || 60) * 0.3) +
          (newPracticeScore * 0.2) +
          ((cur.resume_score || 60) * 0.2)
        );
        await db.collection('confidence_scores').doc(req.user.id).set({
          ...cur,
          practice_score: newPracticeScore,
          overall_score: overall,
          calculated_at: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
    } catch (scErr) {
      console.error('Failed to sync confidence score after practice:', scErr);
    }

    if (group_id) {
      const gDoc = await db.collection('groups').doc(group_id).get();
      if (gDoc.exists && gDoc.data().mentor_id) {
        await sendNotification(req.app, gDoc.data().mentor_id, 'candidate_practice_complete', 'Assignment Completed', `${req.user.full_name || 'Candidate'} completed ${category} with ${percentage}% score.`, null);
      }
    }

    res.json({ session: { id: sRef.id, ...newSession }, correct, total: totalCount, percentage, total_score: totalScore });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save session: ' + err.message });
  }
};

const getMyProgress = async (req, res) => {
  try {
    const sSnap = await db.collection('practice_sessions').where('user_id', '==', req.user.id).get();
    let sessions = sSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    sessions = sessions.sort((a, b) => {
      const t1 = a.completed_at?.toMillis ? a.completed_at.toMillis() : (a.completed_at ? new Date(a.completed_at).getTime() : 0);
      const t2 = b.completed_at?.toMillis ? b.completed_at.toMillis() : (b.completed_at ? new Date(b.completed_at).getTime() : 0);
      return t2 - t1;
    });

    const aSnap = await db.collection('practice_attempts').where('user_id', '==', req.user.id).get();
    let total = 0, correct = 0, total_points = 0;
    aSnap.forEach(d => {
      total++;
      if (d.data().is_correct) correct++;
      total_points += (d.data().score || 0);
    });

    // Compute by_category stats from sessions
    const catMap = {};
    sessions.forEach(s => {
      const cat = s.category || 'unknown';
      if (!catMap[cat]) catMap[cat] = { category: cat, total_sessions: 0, total_score: 0, best_score: 0, last_score: 0 };
      catMap[cat].total_sessions++;
      catMap[cat].total_score += (s.score_percentage || 0);
      if ((s.score_percentage || 0) > catMap[cat].best_score) catMap[cat].best_score = s.score_percentage || 0;
    });
    // Set last_score from the most recent session per category
    sessions.forEach(s => {
      const cat = s.category || 'unknown';
      if (catMap[cat] && !catMap[cat]._lastSet) {
        catMap[cat].last_score = s.score_percentage || 0;
        catMap[cat]._lastSet = true;
      }
    });
    const by_category = Object.values(catMap).map(c => ({
      category: c.category,
      total_sessions: c.total_sessions,
      avg_score: c.total_sessions > 0 ? Math.round(c.total_score / c.total_sessions) : 0,
      best_score: c.best_score,
      last_score: c.last_score
    }));

    // Compute active days in last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const activeDays = new Set();
    aSnap.forEach(d => {
      const data = d.data();
      const ts = data.attempted_at?.toMillis ? data.attempted_at.toMillis() : (data.created_at?.toMillis ? data.created_at.toMillis() : 0);
      if (ts > thirtyDaysAgo) {
        activeDays.add(new Date(ts).toDateString());
      }
    });

    const overall = { total, correct, total_points, accuracy: total > 0 ? Math.round((correct / total) * 100) : 0 };
    res.json({ sessions: sessions.slice(0, 20), overall, by_category, active_days_30: activeDays.size });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load progress' });
  }
};

const getSessionHistory = async (req, res) => {
  try {
    const sSnap = await db.collection('practice_sessions').where('user_id', '==', req.user.id).get();
    let sessions = sSnap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        category: data.category,
        total_questions: data.total_questions,
        correct_answers: data.correct_answers,
        score_percentage: data.score_percentage,
        completed_at: data.completed_at?.toMillis ? data.completed_at.toMillis() : null
      };
    });
    sessions.sort((a, b) => (b.completed_at || 0) - (a.completed_at || 0));
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load session history' });
  }
};

const getSessionAttempts = async (req, res) => {
  try {
    const sessionDoc = await db.collection('practice_sessions').doc(req.params.sessionId).get();
    if (!sessionDoc.exists) return res.status(404).json({ error: 'Session not found' });
    const session = sessionDoc.data();
    if (session.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    // Get all attempts by this user
    const aSnap = await db.collection('practice_attempts').where('user_id', '==', req.user.id).get();
    const attempts = aSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Enrich with question data
    const enriched = [];
    for (const attempt of attempts) {
      const qDoc = await db.collection('questions').doc(attempt.question_id).get();
      if (qDoc.exists) {
        const q = qDoc.data();
        enriched.push({
          question_id: attempt.question_id,
          title: q.title,
          description: q.description,
          difficulty: q.difficulty,
          question_type: q.question_type,
          options: q.options,
          correct_answer: q.correct_answer,
          submitted_answer: attempt.submitted_answer,
          is_correct: attempt.is_correct,
          score: attempt.score,
          time_taken_seconds: attempt.time_taken_seconds,
          attempted_at: attempt.attempted_at?.toMillis ? attempt.attempted_at.toMillis() : null
        });
      }
    }
    enriched.sort((a, b) => (b.attempted_at || 0) - (a.attempted_at || 0));
    res.json({ session: { id: sessionDoc.id, ...session }, attempts: enriched.slice(0, 100) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load session attempts' });
  }
};

const createQuestion = async (req, res) => {
  if (!['mentor', 'teacher', 'hr'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const { category, difficulty, title, description, question_type, options, correct_answer, points, tags, time_limit_seconds, group_id, attachment_url, expires_at } = req.body;
  if (!category || !difficulty || !title || !description || !question_type) return res.status(400).json({ error: 'Required fields missing' });

  try {
    if (req.user.role === 'mentor' && group_id) {
      const gDoc = await db.collection('groups').doc(group_id).get();
      if (!gDoc.exists || gDoc.data().mentor_id !== req.user.id) return res.status(403).json({ error: 'Not your group' });
    }

    const newQ = {
      created_by: req.user.id, group_id: group_id || null, category, difficulty, title, description, question_type, options: options || null, correct_answer, points: points || 10, tags: tags || [], time_limit_seconds: time_limit_seconds || 300, attachment_url: attachment_url || null, expires_at: expires_at || null, is_active: true, created_at: admin.firestore.FieldValue.serverTimestamp()
    };
    const docRef = await db.collection('questions').add(newQ);

    if (group_id) {
      const mSnap = await db.collection('group_members').where('group_id', '==', group_id).where('role', '==', 'candidate').where('is_active', '==', true).get();
      for (const mDoc of mSnap.docs) {
        await db.collection('notifications').add({ user_id: mDoc.data().user_id, type: 'new_assignment', title: 'New Question Assigned', message: `New ${difficulty} ${category} question: "${title}"`, related_id: docRef.id, is_read: false, created_at: admin.firestore.FieldValue.serverTimestamp() });
      }
    }

    res.status(201).json({ id: docRef.id, ...newQ });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create question' });
  }
};

const TEMP_EXEC_DIR = path.resolve(__dirname, '../../temp_exec');
if (!fs.existsSync(TEMP_EXEC_DIR)) fs.mkdirSync(TEMP_EXEC_DIR, { recursive: true });

const runLocal = (language, code, testInput) => {
  return new Promise((resolve) => {
    const id = uuidv4();
    let fileName, command, args;

    if (language === 'python') { fileName = path.join(TEMP_EXEC_DIR, `${id}.py`); command = 'python'; args = [fileName]; }
    else if (language === 'javascript') { fileName = path.join(TEMP_EXEC_DIR, `${id}.js`); command = 'node'; args = [fileName]; }
    else return resolve({ stdout: '', stderr: 'Local execution not supported', compile_output: '' });

    fs.writeFileSync(fileName, code);
    const child = spawn(command, args, { timeout: 10000 });
    let stdout = '', stderr = '';

    if (testInput) { child.stdin.write(testInput); child.stdin.end(); }
    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      try { fs.unlinkSync(fileName); } catch (e) { }
      resolve({ stdout: stdout.substring(0, 10000), stderr: stderr.substring(0, 10000) + (code !== 0 ? `\\nExit code: ${code}` : ''), compile_output: '' });
    });
    child.on('error', (err) => {
      try { fs.unlinkSync(fileName); } catch (e) { }
      resolve({ stdout: '', stderr: `Execution failed: ${err.message}`, compile_output: '' });
    });
  });
};

const runCode = async (req, res) => {
  const { language, code, test_input } = req.body;
  if (!language || !code) return res.status(400).json({ error: 'Language and code are required.' });

  const languageMap = {
    'python': { file_ext: 'py', version: '3.10.0' },
    'javascript': { file_ext: 'js', version: '18.15.0' }
  };

  const pistonLang = language.toLowerCase();
  if (!languageMap[pistonLang]) return res.json({ stdout: `Mock execution for ${language}:\\nCode processed successfully.`, stderr: '', compile_output: '' });

  try {
    const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
      language: pistonLang, version: languageMap[pistonLang].version || "*", files: [{ name: `main.${languageMap[pistonLang].file_ext}`, content: code }], stdin: test_input || ""
    }, { timeout: 5000 });
    return res.json({ stdout: response.data.run?.stdout || '', stderr: response.data.run?.stderr || '', compile_output: response.data.compile?.stderr || response.data.compile?.output || '' });
  } catch (error) {
    const result = await runLocal(pistonLang, code, test_input);
    return res.json(result);
  }
};

const toggleStarQuestion = async (req, res) => {
  const { question_id } = req.body;
  try {
    const snap = await db.collection('starred_questions').where('user_id', '==', req.user.id).where('question_id', '==', question_id).get();
    if (!snap.empty) {
      await db.collection('starred_questions').doc(snap.docs[0].id).delete();
      res.json({ starred: false });
    } else {
      await db.collection('starred_questions').add({ user_id: req.user.id, question_id });
      res.json({ starred: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle star' });
  }
};

const getStarredQuestions = async (req, res) => {
  try {
    const snap = await db.collection('starred_questions').where('user_id', '==', req.user.id).get();
    const questions = [];
    for (const doc of snap.docs) {
      const qDoc = await db.collection('questions').doc(doc.data().question_id).get();
      if (qDoc.exists && qDoc.data().is_active) questions.push({ id: qDoc.id, ...qDoc.data() });
    }
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch starred questions' });
  }
};

const bulkCreateQuestions = async (req, res) => {
  const { group_id, questions, assignment_name, expires_at } = req.body;
  if (!group_id || !Array.isArray(questions)) return res.status(400).json({ error: 'group_id and questions required' });

  try {
    let assignmentId = null;
    if (assignment_name) {
      const aRef = await db.collection('assignments').add({ group_id, name: assignment_name, created_by: req.user.id, expires_at: expires_at || null, created_at: admin.firestore.FieldValue.serverTimestamp() });
      assignmentId = aRef.id;
    }

    const created = [];
    for (const q of questions) {
      const newQ = {
        created_by: req.user.id, group_id, assignment_id: assignmentId, category: q.category || 'technical_mcq', difficulty: q.difficulty || 'medium', title: q.title, description: q.description, question_type: q.question_type || 'mcq', options: q.options || null, correct_answer: q.correct_answer, points: q.points || 10, tags: q.tags || [], time_limit_seconds: q.time_limit_seconds || 300, expires_at: expires_at || q.expires_at || null, is_active: true, created_at: admin.firestore.FieldValue.serverTimestamp()
      };
      const qRef = await db.collection('questions').add(newQ);
      created.push({ id: qRef.id, ...newQ });
    }
    res.json({ message: `Successfully created ${created.length} questions`, questions: created, assignment_id: assignmentId });
  } catch (err) {
    res.status(500).json({ error: 'Bulk creation failed' });
  }
};

const generateQuestions = async (req, res) => {
  const { topic, difficulty, count } = req.body;
  if (!topic) return res.status(400).json({ error: 'Topic is required' });

  const parsedCount = parseInt(count);
  const numQuestions = Math.min(Math.max(1, isNaN(parsedCount) ? 5 : parsedCount), 20); // default 5, min 1, max 20

  const prompt = `
Generate ${numQuestions} multiple-choice questions (MCQs) about the topic "${topic}" with a difficulty level of "${difficulty}".
You must return the response strictly as a JSON array of objects. Do not include markdown formatting or extra text.
The JSON array should exactly match this structure:
[
  {
    "title": "The exact question text",
    "description": "Any additional context or code snippet, or an empty string if none.",
    "category": "technical_mcq",
    "difficulty": "${difficulty}",
    "question_type": "mcq",
    "options": [
      { "id": "a", "text": "First option" },
      { "id": "b", "text": "Second option" },
      { "id": "c", "text": "Third option" },
      { "id": "d", "text": "Fourth option" }
    ],
    "correct_answer": "a", 
    "points": 10,
    "tags": ["${topic}"]
  }
]
`;

  try {
    const parsedData = await getAIResponse(prompt);

    let generatedQuestions = [];
    if (Array.isArray(parsedData)) {
      generatedQuestions = parsedData;
    } else if (parsedData && Array.isArray(parsedData.questions)) {
      if (typeof parsedData.questions[0] === 'object') {
        generatedQuestions = parsedData.questions;
      }
    }

    if (generatedQuestions.length === 0) {
      logger.warn("AI failed to return array of questions, falling back to smart technical question engine.");

      const ids = ['a', 'b', 'c', 'd'];
      const fallbackTemplates = [
        { title: `What is the primary core concept behind ${topic}?`, correct: `Modular structure and efficient state management in ${topic}`, distractors: ["Global namespace mutation without scope isolation", "Blocking single-threaded asynchronous queue", "Synchronous memory allocation bypass"] },
        { title: `Which performance optimization strategy is most recommended in ${topic}?`, correct: "Avoid memory leaks by unsubscribing event listeners & memoizing expensive computations", distractors: ["Increasing polling frequency in infinite loops", "Executing heavy synchronous computations on main thread", "Disabling browser caching completely"] },
        { title: `How are edge-case errors handled effectively when building with ${topic}?`, correct: "Using structured try-catch blocks, error boundaries, and centralized loggers", distractors: ["Suppressing all error events silently", "Re-throwing unhandled promise rejections", "Restarting the process on every network error"] },
        { title: `What is the main advantage of using immutable data structures in ${topic}?`, correct: "Predictable state changes, simple re-render checks, and easier debugging", distractors: ["Higher RAM consumption without garbage collection", "Allowing direct variable mutation across components", "Eliminating the need for unit tests"] },
        { title: `What is a security best practice when processing user data in ${topic}?`, correct: "Sanitizing user input, using parameterization, and implementing strict CORS rules", distractors: ["Storing secret keys in frontend client state", "Disabling HTTPS certificate validation", "Trusting all incoming headers blindly"] },
      ];

      generatedQuestions = Array(numQuestions).fill(null).map((_, i) => {
        const tmpl = fallbackTemplates[i % fallbackTemplates.length];
        const allOptions = [tmpl.correct, ...tmpl.distractors];
        // Deterministic shuffle by index
        for (let j = allOptions.length - 1; j > 0; j--) {
          const k = (i * 7 + j * 3) % (j + 1);
          [allOptions[j], allOptions[k]] = [allOptions[k], allOptions[j]];
        }
        const correctId = ids[allOptions.indexOf(tmpl.correct)];
        return {
          title: tmpl.title,
          description: `Best practices and technical depth specifically applied to ${topic}.`,
          category: "technical_mcq",
          difficulty: difficulty,
          question_type: "mcq",
          options: ids.map((id, idx) => ({ id, text: allOptions[idx] })),
          correct_answer: correctId,
          points: 10,
          tags: [topic]
        };
      });
    }

    // Ensure all required fields exist to prevent frontend crashes
    generatedQuestions = generatedQuestions.map(q => ({
      title: q.title || "Untitled Question",
      description: q.description || "",
      category: q.category || "technical_mcq",
      difficulty: q.difficulty || difficulty,
      question_type: "mcq",
      options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : [
        { id: "a", text: "True" }, { id: "b", text: "False" }, { id: "c", text: "None" }, { id: "d", text: "All" }
      ],
      correct_answer: q.correct_answer || "a",
      points: q.points || 10,
      tags: q.tags || [topic]
    }));

    res.json({ message: 'Success', questions: generatedQuestions, count: generatedQuestions.length });
  } catch (err) {
    logger.error('Question generation failed:', err);
    res.status(500).json({ error: 'Failed to generate questions. ' + err.message });
  }
};

const getAssignments = async (req, res) => {
  try {
    const groups = [];
    const assignments = [];
    const mSnap = await db.collection('group_members').where('user_id', '==', req.user.id).where('is_active', '==', true).get();

    for (const mDoc of mSnap.docs) {
      const gDoc = await db.collection('groups').doc(mDoc.data().group_id).get();
      if (gDoc.exists && !gDoc.data().is_archived) {
        groups.push({ id: gDoc.id, ...gDoc.data(), total_question_count: 0 });
        const aSnap = await db.collection('assignments').where('group_id', '==', gDoc.id).get();
        aSnap.forEach(a => assignments.push({ id: a.id, ...a.data(), question_count: 1 }));
      }
    }
    res.json({ groups, assignments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
};

const getAssignmentQuestions = async (req, res) => {
  const { groupId } = req.params;
  const { assignmentId } = req.query;
  try {
    let qRef = db.collection('questions').where('group_id', '==', groupId).where('is_active', '==', true);
    if (assignmentId) qRef = qRef.where('assignment_id', '==', assignmentId);

    const snap = await qRef.get();
    const questions = snap.docs.map(d => ({ id: d.id, ...d.data(), my_attempts: 0, last_result: null, is_expired: false }));
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assignment questions' });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    await db.collection('questions').doc(req.params.id).update({ is_active: false });
    res.json({ message: 'Question deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete question' });
  }
};

const bulkDeleteQuestions = async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids array required' });
  try {
    const batch = db.batch();
    ids.forEach(id => {
      batch.update(db.collection('questions').doc(id), { is_active: false });
    });
    await batch.commit();
    res.json({ message: `Successfully deleted ${ids.length} questions` });
  } catch (err) {
    res.status(500).json({ error: 'Bulk deletion failed' });
  }
};

module.exports = {
  getQuestions, getQuestion, submitAnswer, startSession, endSession,
  getMyProgress, getSessionHistory, getSessionAttempts,
  createQuestion, runCode, toggleStarQuestion,
  getStarredQuestions, bulkCreateQuestions, getAssignments, getAssignmentQuestions,
  deleteQuestion, generateQuestions, bulkDeleteQuestions, submitAssignmentTest
};
