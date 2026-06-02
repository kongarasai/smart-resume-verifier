const { query } = require('../config/database');

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
  const [practiceRes, githubRes, leetcodeRes, skillsRes, projectsRes, activityRes] = await Promise.all([
    query('SELECT AVG(score_percentage) as avg, COUNT(*) as count FROM practice_sessions WHERE user_id=$1', [userId]),
    query('SELECT skill_match_score FROM github_data WHERE user_id=$1', [userId]),
    query('SELECT coding_evidence_score, total_solved FROM leetcode_data WHERE user_id=$1', [userId]),
    query('SELECT COUNT(DISTINCT name) as count FROM skills WHERE user_id=$1', [userId]),
    query('SELECT COUNT(*) as count FROM projects WHERE user_id=$1', [userId]),
    query('SELECT COUNT(*) as count FROM practice_attempts WHERE user_id=$1 AND attempted_at > NOW() - INTERVAL \'30 days\'', [userId]),
  ]);

  const practiceScore = Math.min(parseFloat(practiceRes.rows[0]?.avg || 0) || 0, 100);
  const githubScore = Math.min(parseFloat(githubRes.rows[0]?.skill_match_score || 0) || 0, 100);
  const leetcodeScore = Math.min(parseFloat(leetcodeRes.rows[0]?.coding_evidence_score || 0) || 0, 100);
  const skillCount = parseInt(skillsRes.rows[0]?.count || 0);
  const projectCount = parseInt(projectsRes.rows[0]?.count || 0);
  const activityCount = parseInt(activityRes.rows[0]?.count || 0);

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
  const membersRes = await query(
    "SELECT user_id FROM group_members WHERE group_id=$1 AND is_active=TRUE AND role='candidate'",
    [groupId]
  );

  const memberScores = [];
  for (const member of membersRes.rows) {
    const scores = await calculateUserScores(member.user_id);
    memberScores.push({ user_id: member.user_id, ...scores });
  }

  memberScores.sort((a, b) => b.total_score - a.total_score);

  for (let i = 0; i < memberScores.length; i++) {
    const m = memberScores[i];
    const newRank = i + 1;

    // Get previous rank
    const prevRes = await query('SELECT rank_position FROM rankings WHERE user_id=$1 AND group_id=$2', [m.user_id, groupId]);
    const prevRank = prevRes.rows[0]?.rank_position || newRank;
    const rankChange = prevRank - newRank; // positive = improved

    await query(
      `INSERT INTO rankings (user_id, group_id, rank_position, total_score, practice_score, github_score,
        leetcode_score, project_score, skill_score, activity_score, previous_rank, rank_change, calculated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
       ON CONFLICT (user_id, group_id) DO UPDATE SET
       rank_position=$3, total_score=$4, practice_score=$5, github_score=$6, leetcode_score=$7,
       project_score=$8, skill_score=$9, activity_score=$10, previous_rank=$11, rank_change=$12, calculated_at=NOW()`,
      [m.user_id, groupId, newRank, m.total_score, m.practice_score, m.github_score,
       m.leetcode_score, m.project_score, m.skill_score, m.activity_score, prevRank, rankChange]
    );

    // Notify on rank improvement
    if (rankChange > 0) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES ($1, 'ranking_update', 'Ranking Improved!', $2)`,
        [m.user_id, `Your rank improved from #${prevRank} to #${newRank} in this group!`]
      ).catch(() => {});
    }
  }

  return memberScores;
};

const recalculateOverallRanking = async () => {
  const candidatesRes = await query("SELECT id FROM users WHERE role='candidate' AND is_active=TRUE");
  const allScores = [];

  for (const c of candidatesRes.rows) {
    const scores = await calculateUserScores(c.id);
    allScores.push({ user_id: c.id, ...scores });
  }

  allScores.sort((a, b) => b.total_score - a.total_score);

  for (let i = 0; i < allScores.length; i++) {
    const m = allScores[i];
    const newRank = i + 1;
    const prevRes = await query('SELECT rank_position FROM overall_rankings WHERE user_id=$1', [m.user_id]);
    const prevRank = prevRes.rows[0]?.rank_position || newRank;

    await query(
      `INSERT INTO overall_rankings (user_id, rank_position, total_score, previous_rank, rank_change, calculated_at)
       VALUES ($1,$2,$3,$4,$5,NOW())
       ON CONFLICT (user_id) DO UPDATE SET
       rank_position=$2, total_score=$3, previous_rank=$4, rank_change=$5, calculated_at=NOW()`,
      [m.user_id, newRank, m.total_score, prevRank, prevRank - newRank]
    );
  }
};

// API handlers
const getRanking = async (req, res) => {
  const userId = req.params.userId || req.user.id;
  try {
    const [groupRes, overallRes] = await Promise.all([
      query(`SELECT r.*, g.name as group_name, w.name as workspace_name
             FROM rankings r JOIN groups g ON g.id=r.group_id JOIN workspaces w ON w.id=g.workspace_id
             WHERE r.user_id=$1 ORDER BY r.rank_position ASC`, [userId]),
      query('SELECT * FROM overall_rankings WHERE user_id=$1', [userId]),
    ]);
    res.json({ group_rankings: groupRes.rows, overall: overallRes.rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load rankings' });
  }
};

const getGroupRanking = async (req, res) => {
  const { groupId } = req.params;
  try {
    const result = await query(
      `SELECT r.*, u.full_name, u.photo_url, p.headline, p.profile_completeness
       FROM rankings r
       JOIN users u ON u.id=r.user_id
       LEFT JOIN profiles p ON p.user_id=r.user_id
       WHERE r.group_id=$1 AND u.role='candidate'
       ORDER BY r.rank_position ASC`,
      [groupId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load group ranking' });
  }
};

const triggerRecalculate = async (req, res) => {
  const userId = req.user.id;
  try {
    const scores = await calculateUserScores(userId);

    // Update confidence score
    await query(
      `INSERT INTO confidence_scores (user_id, github_score, practice_score, coding_evidence_score,
        profile_completeness_score, project_score, overall_score, confidence_label, calculated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
       ON CONFLICT (user_id) DO UPDATE SET
       github_score=$2, practice_score=$3, coding_evidence_score=$4, profile_completeness_score=$5,
       project_score=$6, overall_score=$7, confidence_label=$8, calculated_at=NOW()`,
      [userId, scores.github_score, scores.practice_score, scores.leetcode_score,
       scores.skill_score, scores.project_score, scores.total_score,
       scores.total_score >= 70 ? 'high' : scores.total_score >= 40 ? 'medium' : 'limited']
    );

    // Recalculate all groups user is in
    const groupsRes = await query('SELECT group_id FROM group_members WHERE user_id=$1 AND is_active=TRUE', [userId]);
    for (const g of groupsRes.rows) {
      await recalculateGroupRanking(g.group_id);
    }
    await recalculateOverallRanking();

    // Update career readiness
    const profileRes = await query('SELECT profile_completeness FROM profiles WHERE user_id=$1', [userId]);
    const completeness = profileRes.rows[0]?.profile_completeness || 0;
    const combined = completeness * 0.4 + scores.total_score * 0.6;
    const readiness = combined >= 85 ? 'top_performer' : combined >= 70 ? 'interview_ready' : combined >= 55 ? 'job_ready' : combined >= 35 ? 'developing' : 'beginner';
    await query('UPDATE profiles SET career_readiness=$1, job_readiness_score=$2 WHERE user_id=$3', [readiness, Math.round(combined), userId]);

    res.json({ scores, career_readiness: readiness, message: 'Rankings recalculated' });
  } catch (err) {
    console.error('Recalc error:', err);
    res.status(500).json({ error: 'Recalculation failed: ' + err.message });
  }
};

module.exports = { getRanking, getGroupRanking, triggerRecalculate, recalculateGroupRanking, recalculateOverallRanking, calculateUserScores };
