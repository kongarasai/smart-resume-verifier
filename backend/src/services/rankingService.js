const { db, admin } = require('../config/firebase');

// Ranking formula weights
const WEIGHTS = {
  practice: 0.30,
  projects: 0.20,
  github: 0.15,
  leetcode: 0.15,
  skills: 0.10,
  activity: 0.10,
};

const calculateUserScores = async (userId) => {
  const [practiceSnap, githubDoc, leetcodeDoc, skillsSnap, projectsSnap, activitySnap] = await Promise.all([
    db.collection('users').doc(userId).collection('practice_sessions').get(),
    db.collection('github_data').doc(userId).get(),
    db.collection('leetcode_data').doc(userId).get(),
    db.collection('users').doc(userId).collection('skills').get(),
    db.collection('users').doc(userId).collection('projects').get(),
    db.collection('users').doc(userId).collection('practice_attempts')
      .where('attempted_at', '>', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).get(),
  ]);

  let practiceSum = 0;
  practiceSnap.forEach(doc => practiceSum += (doc.data().score_percentage || 0));
  const practiceAvg = practiceSnap.size > 0 ? practiceSum / practiceSnap.size : 0;

  const uniqueSkills = new Set();
  skillsSnap.forEach(doc => {
    if (doc.data().name) uniqueSkills.add(doc.data().name.toLowerCase());
  });

  const practiceScore = Math.min(practiceAvg, 100);
  const githubScore = Math.min(parseFloat(githubDoc.exists ? githubDoc.data().skill_match_score : 0) || 0, 100);
  const leetcodeScore = Math.min(parseFloat(leetcodeDoc.exists ? leetcodeDoc.data().coding_evidence_score : 0) || 0, 100);
  const skillCount = uniqueSkills.size;
  const projectCount = projectsSnap.size;
  const activityCount = activitySnap.size;

  const skillScore = Math.min(skillCount * 5, 100);
  const projectScore = Math.min(projectCount * 20, 100);
  const activityScore = Math.min(activityCount * 10, 100);

  const total = Math.round(
    practiceScore * WEIGHTS.practice +
    projectScore * WEIGHTS.projects +
    githubScore * WEIGHTS.github +
    leetcodeScore * WEIGHTS.leetcode +
    skillScore * WEIGHTS.skills +
    activityScore * WEIGHTS.activity
  );

  return {
    practice_score: Math.round(practiceScore),
    github_score: Math.round(githubScore),
    leetcode_score: Math.round(leetcodeScore),
    project_score: Math.round(projectScore),
    skill_score: Math.round(skillScore),
    activity_score: Math.round(activityScore),
    total_score: total,
  };
};

const recalculateGroupRanking = async (groupId) => {
  const membersSnap = await db.collection('groups').doc(groupId).collection('members')
    .where('is_active', '==', true)
    .where('role', '==', 'candidate').get();

  const memberScores = [];
  for (const doc of membersSnap.docs) {
    const userId = doc.data().user_id || doc.id;
    const scores = await calculateUserScores(userId);
    memberScores.push({ user_id: userId, ...scores });
  }

  memberScores.sort((a, b) => b.total_score - a.total_score);

  for (let i = 0; i < memberScores.length; i++) {
    const m = memberScores[i];
    const newRank = i + 1;
    const rankDocId = `${m.user_id}_${groupId}`;

    const prevDoc = await db.collection('rankings').doc(rankDocId).get();
    const prevRank = prevDoc.exists ? prevDoc.data().rank_position : newRank;
    const rankChange = prevRank - newRank;

    await db.collection('rankings').doc(rankDocId).set({
      user_id: m.user_id,
      group_id: groupId,
      rank_position: newRank,
      total_score: m.total_score,
      practice_score: m.practice_score,
      github_score: m.github_score,
      leetcode_score: m.leetcode_score,
      project_score: m.project_score,
      skill_score: m.skill_score,
      activity_score: m.activity_score,
      previous_rank: prevRank,
      rank_change: rankChange,
      calculated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    if (rankChange > 0) {
      await db.collection('notifications').add({
        user_id: m.user_id,
        type: 'ranking_update',
        title: 'Ranking Improved!',
        message: `Your rank improved from #${prevRank} to #${newRank} in this group!`,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      }).catch(() => {});
    }
  }

  return memberScores;
};

const recalculateOverallRanking = async () => {
  const candidatesSnap = await db.collection('users').where('role', '==', 'candidate').where('is_active', '==', true).get();
  const allScores = [];

  for (const c of candidatesSnap.docs) {
    const scores = await calculateUserScores(c.id);
    allScores.push({ user_id: c.id, ...scores });
  }

  allScores.sort((a, b) => b.total_score - a.total_score);

  const batch = db.batch();
  for (let i = 0; i < allScores.length; i++) {
    const m = allScores[i];
    const newRank = i + 1;
    const docRef = db.collection('overall_rankings').doc(m.user_id);
    const prevDoc = await docRef.get();
    const prevRank = prevDoc.exists ? prevDoc.data().rank_position : newRank;

    batch.set(docRef, {
      user_id: m.user_id,
      rank_position: newRank,
      total_score: m.total_score,
      previous_rank: prevRank,
      rank_change: prevRank - newRank,
      calculated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
  await batch.commit();
};

const getRanking = async (req, res) => {
  const userId = req.params.userId || req.user.id;
  try {
    const [groupSnap, overallDoc] = await Promise.all([
      db.collection('rankings').where('user_id', '==', userId).get(),
      db.collection('overall_rankings').doc(userId).get()
    ]);
    
    const group_rankings = [];
    for (const doc of groupSnap.docs) {
      const data = doc.data();
      let groupName = 'Unknown Group', workspaceName = 'Workspace';
      try {
        const gDoc = await db.collection('groups').doc(data.group_id).get();
        if (gDoc.exists) {
          groupName = gDoc.data().name;
          const wDoc = await db.collection('workspaces').doc(gDoc.data().workspace_id).get();
          if (wDoc.exists) workspaceName = wDoc.data().name;
        }
      } catch (e) {}
      group_rankings.push({ ...data, group_name: groupName, workspace_name: workspaceName });
    }
    
    group_rankings.sort((a, b) => a.rank_position - b.rank_position);

    res.json({ group_rankings, overall: overallDoc.exists ? overallDoc.data() : null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load rankings: ' + err.message });
  }
};

const getGroupRanking = async (req, res) => {
  const { groupId } = req.params;
  try {
    const rankingsSnap = await db.collection('rankings').where('group_id', '==', groupId).get();
    const results = [];
    
    for (const rDoc of rankingsSnap.docs) {
      const r = rDoc.data();
      const [uDoc, pDoc] = await Promise.all([
        db.collection('users').doc(r.user_id).get(),
        db.collection('profiles').doc(r.user_id).get()
      ]);
      if (uDoc.exists && uDoc.data().role === 'candidate') {
        results.push({
          ...r,
          full_name: uDoc.data().full_name,
          photo_url: uDoc.data().photo_url,
          headline: pDoc.exists ? pDoc.data().headline : null,
          profile_completeness: pDoc.exists ? pDoc.data().profile_completeness : 0
        });
      }
    }
    
    results.sort((a, b) => a.rank_position - b.rank_position);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load group ranking' });
  }
};

const triggerRecalculate = async (req, res) => {
  const userId = req.user.id;
  try {
    const scores = await calculateUserScores(userId);

    const confidenceLabel = scores.total_score >= 70 ? 'high' : scores.total_score >= 40 ? 'medium' : 'limited';
    
    await db.collection('confidence_scores').doc(userId).set({
      user_id: userId,
      github_score: scores.github_score,
      practice_score: scores.practice_score,
      coding_evidence_score: scores.leetcode_score,
      profile_completeness_score: scores.skill_score,
      project_score: scores.project_score,
      overall_score: scores.total_score,
      confidence_label: confidenceLabel,
      calculated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Workaround: Avoid collectionGroup index requirement by querying each group individually
    const groupsSnap = await db.collection('groups').get();
    for (const gDoc of groupsSnap.docs) {
      const memberQuery = await db.collection('groups').doc(gDoc.id).collection('members').where('user_id', '==', userId).get();
      if (!memberQuery.empty) {
        if (memberQuery.docs[0].data().is_active === true) {
          await recalculateGroupRanking(gDoc.id);
        }
      }
    }
    await recalculateOverallRanking();

    const profileDoc = await db.collection('profiles').doc(userId).get();
    const completeness = profileDoc.exists ? (profileDoc.data().profile_completeness || 0) : 0;
    const combined = completeness * 0.4 + scores.total_score * 0.6;
    const readiness = combined >= 85 ? 'top_performer' : combined >= 70 ? 'interview_ready' : combined >= 55 ? 'job_ready' : combined >= 35 ? 'developing' : 'beginner';
    
    await db.collection('profiles').doc(userId).update({
      career_readiness: readiness,
      job_readiness_score: Math.round(combined)
    });

    res.json({ scores, career_readiness: readiness, message: 'Rankings recalculated' });
  } catch (err) {
    console.error('Recalc error:', err);
    res.status(500).json({ error: 'Recalculation failed: ' + err.message });
  }
};

module.exports = { getRanking, getGroupRanking, triggerRecalculate, recalculateGroupRanking, recalculateOverallRanking, calculateUserScores };
