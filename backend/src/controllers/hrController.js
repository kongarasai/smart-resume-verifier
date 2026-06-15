const { db, admin } = require('../config/firebase');
const logger = require('../utils/logger');

const searchCandidates = async (req, res) => {
  const { skills, min_experience, min_confidence, min_practice_score, has_github, sort_by, order } = req.query;
  const sortBy = sort_by || 'overall_score';
  const sortDir = order === 'asc' ? 1 : -1;

  try {
    // In Firestore, complex JOINs and dynamic filtering require fetching users 
    // and filtering in memory, or using a specialized search index (like Algolia).
    // For this migration, we perform in-memory filtering.
    
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'candidate')
      .where('is_active', '==', true)
      .get();
      
    let candidates = [];

    for (const doc of usersSnapshot.docs) {
      const u = { id: doc.id, ...doc.data() };
      
      const [profileDoc, confDoc, gdDoc, ldDoc, skillsSnap] = await Promise.all([
        db.collection('profiles').doc(u.id).get(),
        db.collection('confidence_scores').doc(u.id).get(),
        db.collection('github_data').doc(u.id).get(),
        db.collection('leetcode_data').doc(u.id).get(),
        db.collection('users').doc(u.id).collection('skills').get()
      ]);
      
      const p = profileDoc.exists ? profileDoc.data() : {};
      const cs = confDoc.exists ? confDoc.data() : {};
      const gd = gdDoc.exists ? gdDoc.data() : {};
      const ld = ldDoc.exists ? ldDoc.data() : {};
      const sNames = skillsSnap.docs.map(s => (s.data().name || '').toLowerCase());

      candidates.push({
        id: u.id, full_name: u.full_name, email: u.email, photo_url: u.photo_url,
        headline: p.headline, location: p.location, years_experience: p.years_experience || 0,
        github_url: p.github_url, leetcode_url: p.leetcode_url,
        profile_completeness: p.profile_completeness || 0, career_readiness: p.career_readiness,
        overall_score: cs.overall_score || 0, confidence_label: cs.confidence_label,
        practice_score: cs.practice_score || 0,
        total_repos: gd.total_repos || 0, total_commits: gd.total_commits || 0,
        total_solved: ld.total_solved || 0,
        skills: [...new Set(sNames)]
      });
    }

    // Apply filters
    if (min_experience) candidates = candidates.filter(c => c.years_experience >= parseInt(min_experience));
    if (min_confidence) candidates = candidates.filter(c => c.overall_score >= parseInt(min_confidence));
    if (min_practice_score) candidates = candidates.filter(c => c.practice_score >= parseInt(min_practice_score));
    if (has_github === 'true') candidates = candidates.filter(c => c.github_url && c.github_url.trim() !== '');

    if (skills) {
      const skillArr = skills.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      candidates = candidates.filter(c => skillArr.every(sk => c.skills.includes(sk)));
    }

    // Apply sorting
    candidates.sort((a, b) => {
      const valA = a[sortBy] || 0;
      const valB = b[sortBy] || 0;
      if (valA < valB) return -1 * sortDir;
      if (valA > valB) return 1 * sortDir;
      return 0;
    });

    // Privacy filter
    const privacySnap = await db.collection('privacy_settings').get();
    const privacyMap = {};
    privacySnap.docs.forEach(doc => privacyMap[doc.id] = doc.data().allow_hr_view);
    
    candidates = candidates.filter(c => privacyMap[c.id] !== false);

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const totalCount = candidates.length;
    const totalPages = Math.ceil(totalCount / limit);
    const paginatedData = candidates.slice((page - 1) * limit, page * limit);

    // Log activity asynchronously
    db.collection('users').doc(req.user.id).collection('activity_logs').add({
      action: 'hr_viewed_candidates',
      details: {},
      created_at: admin.firestore.FieldValue.serverTimestamp()
    }).catch(() => {});

    res.json({
      data: paginatedData,
      pagination: { totalCount, totalPages, currentPage: page, limit }
    });

  } catch (err) {
    logger.error('HR Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
};

const getCandidateDetail = async (req, res) => {
  const candidateId = req.params.id;
  try {
    db.collection('users').doc(req.user.id).collection('activity_logs').add({
      action: 'hr_viewed_profile',
      details: { candidate_id: candidateId },
      created_at: admin.firestore.FieldValue.serverTimestamp()
    }).catch(() => {});

    const userDoc = await db.collection('users').doc(candidateId).get();
    if (!userDoc.exists || userDoc.data().role !== 'candidate') {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const [profileDoc, githubDoc, leetcodeDoc, confidenceDoc, parseDoc, hrEvalSnap] = await Promise.all([
      db.collection('profiles').doc(candidateId).get(),
      db.collection('github_data').doc(candidateId).get(),
      db.collection('leetcode_data').doc(candidateId).get(),
      db.collection('confidence_scores').doc(candidateId).get(),
      db.collection('resume_parse_results').doc(candidateId).get(),
      db.collection('hr_evaluations').where('candidate_id', '==', candidateId).where('hr_id', '==', req.user.id).get()
    ]);

    let evalDocs = hrEvalSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    evalDocs.sort((a,b) => (b.created_at?.toMillis?.()||0) - (a.created_at?.toMillis?.()||0));
    const latestEval = evalDocs.length > 0 ? evalDocs[0] : null;

    const fetchSub = async (col) => {
      const snap = await db.collection('users').doc(candidateId).collection(col).get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const [skillsRes, projects, education, experience, certs, practiceSnap] = await Promise.all([
      fetchSub('skills'),
      fetchSub('projects'),
      fetchSub('education'),
      fetchSub('experience'),
      fetchSub('certificates'),
      db.collection('practice_sessions').where('user_id', '==', candidateId).get()
    ]);

    let practiceDocs = practiceSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    practiceDocs.sort((a,b) => (b.completed_at?.toMillis?.()||0) - (a.completed_at?.toMillis?.()||0));
    practiceDocs = practiceDocs.slice(0, 5);

    const skillMap = {};
    for (const s of skillsRes) {
      const key = (s.name || '').toLowerCase();
      if (!skillMap[key]) skillMap[key] = { name: s.name, sources: [], verification_level: s.verification_level };
      if (!skillMap[key].sources.includes(s.source)) skillMap[key].sources.push(s.source);
      const levels = ['claimed', 'evidence', 'verified', 'expert'];
      if (levels.indexOf(s.verification_level) > levels.indexOf(skillMap[key].verification_level)) {
        skillMap[key].verification_level = s.verification_level;
      }
    }

    res.json({
      user: { id: userDoc.id, ...userDoc.data() },
      profile: profileDoc.exists ? profileDoc.data() : {},
      github: githubDoc.exists ? githubDoc.data() : {},
      leetcode: leetcodeDoc.exists ? leetcodeDoc.data() : {},
      confidence: confidenceDoc.exists ? confidenceDoc.data() : {},
      skills: Object.values(skillMap),
      projects, education, experience, certificates: certs,
      recent_practice: practiceDocs,
      resume_skills: parseDoc.exists ? parseDoc.data().parsed_skills : [],
      hiring_status: latestEval,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load candidate: ' + err.message });
  }
};

const matchRequirements = async (req, res) => {
  const { required_skills, min_experience, technologies } = req.body;
  if (!required_skills || !required_skills.length) {
    return res.status(400).json({ error: 'required_skills array is required' });
  }

  try {
    const usersSnap = await db.collection('users').where('role', '==', 'candidate').where('is_active', '==', true).get();
    let candidates = [];

    for (const doc of usersSnap.docs) {
      const c = { id: doc.id, ...doc.data() };
      const [profileDoc, confDoc, skillsSnap] = await Promise.all([
        db.collection('profiles').doc(c.id).get(),
        db.collection('confidence_scores').doc(c.id).get(),
        db.collection('users').doc(c.id).collection('skills').get()
      ]);
      
      c.years_experience = profileDoc.exists ? profileDoc.data().years_experience || 0 : 0;
      c.overall_score = confDoc.exists ? confDoc.data().overall_score || 0 : 0;
      c.skill_details = skillsSnap.docs.map(s => ({ name: (s.data().name || '').toLowerCase(), verification: s.data().verification_level }));
      candidates.push(c);
    }

    const scored = candidates.map(c => {
      const reqSkills = required_skills.map(s => s.toLowerCase());
      const techSkills = (technologies || []).map(s => s.toLowerCase());

      let totalPoints = 0;
      let maxPoints = reqSkills.length * 3;
      
      const matched = [];
      const missing = [];

      reqSkills.forEach(req => {
        const detail = c.skill_details.find(s => s.name === req);
        if (detail) {
          matched.push(req);
          const weights = { expert: 3, verified: 2, evidence: 1.5, claimed: 1 };
          totalPoints += weights[detail.verification] || 1;
        } else {
          missing.push(req);
        }
      });

      const skillMatchPct = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
      const techMatched = techSkills.filter(req => c.skill_details.some(s => s.name === req));
      const techMatchPct = techSkills.length > 0 ? Math.round((techMatched.length / techSkills.length) * 100) : 100;
      const expMatch = min_experience ? Math.min(((c.years_experience) / min_experience) * 100, 100) : 100;
      
      const overallMatch = Math.round(skillMatchPct * 0.6 + techMatchPct * 0.2 + expMatch * 0.2);

      return {
        id: c.id, full_name: c.full_name,
        skill_match: skillMatchPct, tech_match: techMatchPct,
        experience_match: Math.round(expMatch), overall_match: overallMatch,
        confidence_score: c.overall_score,
        matched_skills: matched, missing_skills: missing,
        is_verified_match: c.skill_details.some(s => matched.includes(s.name) && ['verified', 'expert'].includes(s.verification))
      };
    });

    scored.sort((a, b) => b.overall_match - a.overall_match || b.confidence_score - a.confidence_score);
    res.json({ matches: scored.slice(0, 20) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Matching failed: ' + err.message });
  }
};

const shortlistCandidate = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { notes } = req.body;
    const hrId = req.user.id;

    const evalSnap = await db.collection('hr_evaluations')
      .where('candidate_id', '==', candidateId)
      .where('hr_id', '==', hrId).get();

    let docId;
    if (!evalSnap.empty) {
      docId = evalSnap.docs[0].id;
      await db.collection('hr_evaluations').doc(docId).update({
        status: 'Shortlist',
        notes,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      const newRef = await db.collection('hr_evaluations').add({
        candidate_id: candidateId,
        hr_id: hrId,
        status: 'Shortlist',
        notes,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      docId = newRef.id;
    }

    const { sendNotification } = require('./notificationController');
    await sendNotification(req.app, candidateId, 'candidate_shortlisted', 'You have been shortlisted!', `An HR from ${req.user.company_name || 'a company'} has shortlisted your profile.`, hrId);

    const updatedDoc = await db.collection('hr_evaluations').doc(docId).get();
    res.json({ message: "Candidate shortlisted", evaluation: { id: updatedDoc.id, ...updatedDoc.data() } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const removeShortlist = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const hrId = req.user.id;

    const evalSnap = await db.collection('hr_evaluations')
      .where('candidate_id', '==', candidateId)
      .where('hr_id', '==', hrId).get();

    const batch = db.batch();
    evalSnap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    res.json({ message: "Candidate removed from shortlist" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const getShortlist = async (req, res) => {
  try {
    const evalSnap = await db.collection('hr_evaluations')
      .where('hr_id', '==', req.user.id)
      .where('status', 'in', ['Shortlist', 'shortlist', 'shortlisted'])
      .get();

    const data = [];
    for (const doc of evalSnap.docs) {
      const e = doc.data();
      const [uDoc, pDoc, csDoc] = await Promise.all([
        db.collection('users').doc(e.candidate_id).get(),
        db.collection('profiles').doc(e.candidate_id).get(),
        db.collection('confidence_scores').doc(e.candidate_id).get()
      ]);
      
      const u = uDoc.exists ? uDoc.data() : {};
      const p = pDoc.exists ? pDoc.data() : {};
      const cs = csDoc.exists ? csDoc.data() : {};

      data.push({
        candidate_id: e.candidate_id,
        status: e.status, notes: e.notes, created_at: e.created_at, updated_at: e.updated_at,
        full_name: u.full_name, email: u.email, photo_url: u.photo_url,
        headline: p.headline, location: p.location,
        overall_score: cs.overall_score, confidence_label: cs.confidence_label
      });
    }

    data.sort((a, b) => {
      const dateA = a.updated_at || a.created_at || { toMillis: () => 0 };
      const dateB = b.updated_at || b.created_at || { toMillis: () => 0 };
      return dateB.toMillis() - dateA.toMillis();
    });

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const hrId = req.user.id;

    // 1. Fetch HR evaluations for funnel
    const evalSnap = await db.collection('hr_evaluations').where('hr_id', '==', hrId).get();
    const funnelMap = {};
    evalSnap.docs.forEach(doc => {
      const s = doc.data().status;
      if (!s) return;
      const key = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      funnelMap[key] = (funnelMap[key] || 0) + 1;
    });
    const funnel = Object.entries(funnelMap).map(([status, count]) => ({ status, count }));

    // 2. Fetch confidence scores
    const confSnap = await db.collection('confidence_scores').get();
    let totalConf = 0, confCount = 0;
    const fraudMap = { low: 0, medium: 0, high: 0 };
    
    confSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.overall_score !== undefined) {
         totalConf += data.overall_score;
         confCount++;
      }
      
      const prob = data.fraud_probability || 0;
      if (prob < 0.3) fraudMap.low++;
      else if (prob < 0.7) fraudMap.medium++;
      else fraudMap.high++;
    });

    const avg_confidence = confCount > 0 ? Math.round(totalConf / confCount) : 0;
    const fraud_stats = [
      { risk: 'low', count: fraudMap.low },
      { risk: 'medium', count: fraudMap.medium },
      { risk: 'high', count: fraudMap.high }
    ];

    // 3. Fetch skills
    const skillsSnap = await db.collectionGroup('skills').get();
    const skillMap = {};
    skillsSnap.docs.forEach(doc => {
       const n = (doc.data().name || '').toLowerCase();
       if (n) skillMap[n] = (skillMap[n] || 0) + 1;
    });
    const skills = Object.entries(skillMap)
       .map(([skill, count]) => ({ skill, count }))
       .sort((a,b) => b.count - a.count)
       .slice(0, 10);

    res.json({
      skills,
      funnel,
      avg_confidence,
      fraud_stats,
      trends: []
    });
  } catch (err) {
    logger.error('HR Analytics error:', err);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
};

module.exports = { 
  searchCandidates, getCandidateDetail, matchRequirements, 
  shortlistCandidate, removeShortlist, getShortlist, getAnalytics 
};
