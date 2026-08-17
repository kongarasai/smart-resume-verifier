/**
 * Skill Verification Engine
 * -------------------------
 * Matches skills across ALL evidence sources and computes
 * verification levels based on how many sources confirm each skill.
 */

const { db, admin } = require('../config/firebase');

const normalise = (s) => s.toLowerCase().trim()
  .replace(/\bnode\.js\b/g, 'nodejs')
  .replace(/\bc\+\+\b/g, 'cpp')
  .replace(/\brest api\b/g, 'rest')
  .replace(/\bci\/cd\b/g, 'cicd');

const LEVEL_ORDER = ['claimed', 'evidence', 'verified', 'strong_verified'];

const deriveLevel = (src) => {
  const cnt = [src.has_resume, src.has_github, src.has_leetcode, src.has_practice, src.has_project].filter(Boolean).length;
  // Strong Verified ONLY if ALL 5 pillars are satisfied: Resume, GitHub, LeetCode, Practice, and Projects
  if (cnt === 5 || (src.has_resume && src.has_github && src.has_leetcode && src.has_practice && src.has_project)) {
    return 'strong_verified';
  }
  // Verified: Satisfied with 3 or 4 sources, or confirmed with Resume + Practice
  if (cnt >= 3 || (src.has_resume && src.has_practice)) {
    return 'verified';
  }
  // Evidence: At least 2 sources satisfied (e.g. Resume + LeetCode, GitHub + Projects, etc.)
  if (cnt >= 2) {
    return 'evidence';
  }
  // Claimed: 1 source or self-claimed
  return 'claimed';
};

const runVerification = async (userId) => {
  const [skillsSnap, githubDoc, leetcodeDoc, practiceSnap, projectSnap, existingVerifSnap] = await Promise.all([
    db.collection('users').doc(userId).collection('skills').get(),
    db.collection('github_data').doc(userId).get(),
    db.collection('leetcode_data').doc(userId).get(),
    db.collection('users').doc(userId).collection('practice_attempts').where('is_correct', '==', true).get(),
    db.collection('users').doc(userId).collection('projects').get(),
    db.collection('skill_verifications').where('user_id', '==', userId).get()
  ]);

  const resume = new Set();
  skillsSnap.forEach(doc => resume.add(normalise(doc.data().name)));

  const ghLangs = githubDoc.exists ? (githubDoc.data().languages || {}) : {};
  const github = new Set(Object.keys(ghLangs).map(l => normalise(l)));

  const lcLangs = leetcodeDoc.exists ? (leetcodeDoc.data().languages_used || []) : [];
  const leetcode = new Set(lcLangs.map(l => normalise(l)));

  const practice = new Set();
  practiceSnap.forEach(doc => {
    const tags = doc.data().question_tags || [];
    tags.forEach(t => practice.add(normalise(t)));
  });

  const projectTechs = new Set();
  projectSnap.forEach(doc => {
    (doc.data().technologies || []).forEach(t => projectTechs.add(normalise(t)));
  });

  const allSkills = new Set([...resume, ...github, ...leetcode, ...practice, ...projectTechs]);

  const verifications = {};
  for (const skill of allSkills) {
    verifications[skill] = {
      skill_name: skill,
      has_resume: resume.has(skill),
      has_github: github.has(skill),
      has_leetcode: leetcode.has(skill),
      has_practice: practice.has(skill),
      has_project: projectTechs.has(skill),
      source_count: 0,
    };
    const v = verifications[skill];
    v.source_count = [v.has_resume, v.has_github, v.has_leetcode, v.has_practice, v.has_project].filter(Boolean).length;
    v.verification_level = deriveLevel(v);
  }

  const batch = db.batch();
  for (const [skillName, v] of Object.entries(verifications)) {
    const docRef = db.collection('skill_verifications').doc(`${userId}_${skillName}`);
    batch.set(docRef, {
      user_id: userId,
      skill_name: skillName,
      has_resume: v.has_resume,
      has_github: v.has_github,
      has_leetcode: v.has_leetcode,
      has_practice: v.has_practice,
      has_project: v.has_project,
      source_count: v.source_count,
      verification_level: v.verification_level,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    if (v.has_resume) upsertSkillInBatch(batch, userId, skillName, 'resume', v.verification_level);
    if (v.has_github) upsertSkillInBatch(batch, userId, skillName, 'github', v.verification_level);
    if (v.has_leetcode) upsertSkillInBatch(batch, userId, skillName, 'leetcode', v.verification_level);
    if (v.has_practice) upsertSkillInBatch(batch, userId, skillName, 'practice', v.verification_level);
  }

  // Delete stale verifications that are no longer present in allSkills
  existingVerifSnap.forEach(doc => {
    const skillName = doc.data().skill_name;
    if (skillName && !allSkills.has(skillName)) {
      batch.delete(doc.ref);
    }
  });

  await batch.commit();

  const counts = { claimed: 0, evidence: 0, verified: 0, strong_verified: 0, total: allSkills.size };
  for (const v of Object.values(verifications)) counts[v.verification_level]++;
  return { verifications, counts };
};

const upsertSkillInBatch = (batch, userId, name, source, verificationLevel) => {
  const safeId = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const docRef = db.collection('users').doc(userId).collection('skills').doc(`${safeId}_${source}`);
  batch.set(docRef, { name, source, verification_level: verificationLevel }, { merge: true });
};

const getVerificationSummary = async (req, res) => {
  const userId = req.params.userId || req.user.id;
  try {
    const verifSnap = await db.collection('skill_verifications').where('user_id', '==', userId).get();
    const skills = verifSnap.docs.map(doc => doc.data());
    skills.sort((a, b) => b.source_count - a.source_count || a.skill_name.localeCompare(b.skill_name));

    const counts = { claimed: 0, evidence: 0, verified: 0, strong_verified: 0, total: skills.length };
    skills.forEach(r => {
      const level = r.verification_level || 'claimed';
      if (counts[level] !== undefined) {
        counts[level]++;
      } else {
        counts.claimed++;
      }
    });
    res.json({ skills, counts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load verification data' });
  }
};

const triggerVerification = async (req, res) => {
  const userId = req.params.userId || req.user.id;
  try {
    const result = await runVerification(userId);
    try {
      const { recalculateUserScoreInternal } = require('./scoringService');
      await recalculateUserScoreInternal(userId);
    } catch (scoreErr) {
      console.error('Failed to auto-recalculate score after verification:', scoreErr);
    }
    res.json({ message: 'Verification complete', counts: result.counts });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed: ' + err.message });
  }
};

const getSkillEvidence = async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const skillName = req.params.skillName;
  const norm = normalise(skillName);
  try {
    const verDoc = await db.collection('skill_verifications').doc(`${userId}_${norm}`).get();
    const ghDoc = await db.collection('github_data').doc(userId).get();
    const lcDoc = await db.collection('leetcode_data').doc(userId).get();
    
    const projSnap = await db.collection('users').doc(userId).collection('projects').get();
    const projects = [];
    projSnap.forEach(doc => {
      const p = doc.data();
      if (p.technologies && p.technologies.map(normalise).includes(norm)) {
        projects.push({ title: p.title, github_url: p.github_url, project_url: p.project_url });
      }
    });

    const practSnap = await db.collection('users').doc(userId).collection('practice_attempts').where('is_correct', '==', true).get();
    let correctCount = 0;
    practSnap.forEach(doc => {
      const tags = doc.data().question_tags || [];
      if (tags.map(normalise).includes(norm)) correctCount++;
    });

    const ghData = ghDoc.exists ? ghDoc.data() : {};
    const ghLangs = ghData.languages || {};

    res.json({
      skill: norm,
      verification: verDoc.exists ? verDoc.data() : null,
      evidence: {
        github: {
          repo_count: ghLangs[skillName] || ghLangs[skillName.charAt(0).toUpperCase() + skillName.slice(1)] || 0,
          top_repos: (ghData.top_repos || []).filter(r => normalise(r.language || '') === norm).slice(0, 3),
        },
        leetcode: {
          languages: lcDoc.exists ? lcDoc.data().languages_used || [] : [],
          solved: lcDoc.exists ? lcDoc.data().total_solved || 0 : 0,
        },
        projects,
        practice: { correct_answers: correctCount },
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load skill evidence: ' + err.message });
  }
};

module.exports = { runVerification, getVerificationSummary, triggerVerification, getSkillEvidence, normalise };
