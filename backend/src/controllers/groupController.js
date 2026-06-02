const { query } = require('../config/database');
const { recalculateGroupRanking } = require('../services/rankingService');
const crypto = require('crypto');

const MAX_GROUPS_PER_WORKSPACE = 5;
const MAX_MEMBERS_PER_GROUP = 50;

// ── WORKSPACES ──
const createWorkspace = async (req, res) => {
  const { name, description } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Workspace name required' });
  try {
    const result = await query(
      'INSERT INTO workspaces (mentor_id, name, description) VALUES ($1,$2,$3) RETURNING *',
      [req.user.id, name.trim(), description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create workspace: ' + err.message });
  }
};

const getMyWorkspaces = async (req, res) => {
  try {
    const result = await query(
      `SELECT w.*, COUNT(g.id) as group_count
       FROM workspaces w LEFT JOIN groups g ON g.workspace_id=w.id AND g.is_archived=FALSE
       WHERE w.mentor_id=$1 GROUP BY w.id ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load workspaces' });
  }
};

const deleteWorkspace = async (req, res) => {
  try {
    // Optional: add a check if there are groups, but cascade delete in DB usually handles it or we restrict it.
    const w = await query('SELECT * FROM workspaces WHERE id=$1 AND mentor_id=$2', [req.params.id, req.user.id]);
    if (!w.rows[0]) return res.status(404).json({ error: 'Workspace not found' });
    
    await query('DELETE FROM workspaces WHERE id=$1', [req.params.id]);
    res.json({ message: 'Workspace deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete workspace: ' + err.message });
  }
};

// Return workspaces where user is teacher in any group
const getTeacherWorkspaces = async (req, res) => {
  try {
    const result = await query(
      `SELECT DISTINCT w.*, g.mentor_id
       FROM workspaces w
       JOIN groups g ON g.workspace_id=w.id
       JOIN group_members gm ON gm.group_id=g.id
       WHERE gm.user_id=$1 AND gm.role='teacher' AND gm.is_active=TRUE AND g.is_archived=FALSE`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load workspaces' });
  }
};

// ── GROUPS ──
const createGroup = async (req, res) => {
  const { workspace_id, name, description } = req.body;
  if (!workspace_id || !name?.trim()) return res.status(400).json({ error: 'workspace_id and name required' });
  try {
    const wsRes = await query('SELECT id FROM workspaces WHERE id=$1 AND mentor_id=$2', [workspace_id, req.user.id]);
    if (!wsRes.rows[0]) return res.status(403).json({ error: 'Workspace not found or not yours' });

    const countRes = await query('SELECT COUNT(*) as c FROM groups WHERE workspace_id=$1 AND is_archived=FALSE', [workspace_id]);
    if (parseInt(countRes.rows[0].c) >= MAX_GROUPS_PER_WORKSPACE) {
      return res.status(400).json({ error: `Maximum ${MAX_GROUPS_PER_WORKSPACE} active groups per workspace` });
    }

    const result = await query(
      'INSERT INTO groups (workspace_id, mentor_id, name, description) VALUES ($1,$2,$3,$4) RETURNING *',
      [workspace_id, req.user.id, name.trim(), description]
    );
    await query(`INSERT INTO activity_logs (user_id, action, details) VALUES ($1,'group_created',$2)`,
      [req.user.id, JSON.stringify({ group_name: name })]).catch(() => {});
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create group: ' + err.message });
  }
};

const getGroups = async (req, res) => {
  const { workspace_id } = req.query;
  try {
    let sql, params;
    if (req.user.role === 'mentor') {
      sql = `SELECT g.*, w.name as workspace_name, COUNT(gm.id) as member_count
             FROM groups g JOIN workspaces w ON w.id=g.workspace_id
             LEFT JOIN group_members gm ON gm.group_id=g.id AND gm.is_active=TRUE
             WHERE g.mentor_id=$1 AND g.is_archived=FALSE`;
      params = [req.user.id];
      if (workspace_id) { sql += ` AND g.workspace_id=$2`; params.push(workspace_id); }
      sql += ' GROUP BY g.id, w.name ORDER BY g.created_at DESC';
    } else if (req.user.role === 'teacher') {
      sql = `SELECT g.*, w.name as workspace_name, COUNT(gm2.id) as member_count
             FROM groups g JOIN workspaces w ON w.id=g.workspace_id
             JOIN group_members gm ON gm.group_id=g.id
             LEFT JOIN group_members gm2 ON gm2.group_id=g.id AND gm2.is_active=TRUE
             WHERE gm.user_id=$1 AND gm.role='teacher' AND gm.is_active=TRUE AND g.is_archived=FALSE
             GROUP BY g.id, w.name ORDER BY g.created_at DESC`;
      params = [req.user.id];
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load groups' });
  }
};

const archiveGroup = async (req, res) => {
  try {
    const result = await query(
      'UPDATE groups SET is_archived=TRUE, archived_at=NOW() WHERE id=$1 AND mentor_id=$2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Group not found' });
    res.json({ message: 'Group archived', group: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to archive group' });
  }
};

// ── MEMBERS ──
const addMembersByEmail = async (req, res) => {
  const { group_id, emails, role: memberRole = 'candidate' } = req.body;
  if (!group_id || !emails?.length) return res.status(400).json({ error: 'group_id and emails[] required' });

  const groupRes = await query('SELECT * FROM groups WHERE id=$1 AND mentor_id=$2 AND is_archived=FALSE', [group_id, req.user.id]);
  if (!groupRes.rows[0]) return res.status(403).json({ error: 'Group not found or not yours' });

  const countRes = await query("SELECT COUNT(*) as c FROM group_members WHERE group_id=$1 AND is_active=TRUE AND role='candidate'", [group_id]);
  const currentCandidates = parseInt(countRes.rows[0].c);

  const summary = { total: emails.length, added: 0, already_in_group: 0, not_registered: [], skipped: 0 };

  for (const email of emails) {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) continue;

    // For teacher role, allow teacher accounts; for candidate, only candidate role
    const allowedRole = memberRole === 'teacher' ? 'teacher' : 'candidate';
    const userRes = await query('SELECT id FROM users WHERE LOWER(email)=$1 AND role=$2', [trimmed, allowedRole]);
    if (!userRes.rows[0]) {
      summary.not_registered.push(trimmed);
      continue;
    }
    const userId = userRes.rows[0].id;

    const memberRes = await query('SELECT id, is_active FROM group_members WHERE group_id=$1 AND user_id=$2', [group_id, userId]);
    if (memberRes.rows[0]) {
      if (memberRes.rows[0].is_active) { summary.already_in_group++; continue; }
      await query('UPDATE group_members SET is_active=TRUE, removed_at=NULL, role=$3 WHERE group_id=$1 AND user_id=$2', [group_id, userId, allowedRole]);
      summary.added++;
    } else {
      if (allowedRole === 'candidate' && currentCandidates + summary.added >= groupRes.rows[0].max_members) {
        summary.skipped++; continue;
      }
      await query('INSERT INTO group_members (group_id, user_id, added_by, role) VALUES ($1,$2,$3,$4)', [group_id, userId, req.user.id, allowedRole]);
      summary.added++;

      // Notify
      const notifMsg = allowedRole === 'teacher'
        ? `You have been added as a teacher to group "${groupRes.rows[0].name}"`
        : `You have been added to group "${groupRes.rows[0].name}" by your mentor`;
      const { sendNotification } = require('./notificationController');
      await sendNotification(req.app, userId, 'group_added', 'Added to Group', notifMsg, group_id);

      await query(`INSERT INTO activity_logs (user_id, action, details) VALUES ($1,'mentor_added_member',$2)`,
        [req.user.id, JSON.stringify({ group_id, email: trimmed, role: allowedRole })]).catch(() => {});

      await query(`INSERT INTO progress_events (user_id, event_type, event_title, event_detail) VALUES ($1,'group_joined','Joined Group',$2)`,
        [userId, `Added to group "${groupRes.rows[0].name}"`]).catch(() => {});
    }
  }

  if (memberRole === 'candidate') await recalculateGroupRanking(group_id).catch(() => {});
  res.json(summary);
};

const addTeacherToGroup = async (req, res) => {
  const { group_id, email } = req.body;
  if (!group_id || !email) return res.status(400).json({ error: 'group_id and email required' });

  const groupRes = await query('SELECT * FROM groups WHERE id=$1 AND mentor_id=$2', [group_id, req.user.id]);
  if (!groupRes.rows[0]) return res.status(403).json({ error: 'Not authorized' });

  const teacherRes = await query("SELECT id, full_name FROM users WHERE LOWER(email)=LOWER($1) AND role='teacher'", [email]);
  if (!teacherRes.rows[0]) return res.status(404).json({ error: `No teacher account found with email "${email}". The user must register as a teacher first.` });

  const userId = teacherRes.rows[0].id;
  try {
    await query('INSERT INTO group_members (group_id, user_id, added_by, role) VALUES ($1,$2,$3,$4) ON CONFLICT (group_id, user_id) DO UPDATE SET is_active=TRUE, role=$4',
      [group_id, userId, req.user.id, 'teacher']);
    const { sendNotification } = require('./notificationController');
    await sendNotification(req.app, userId, 'group_added', 'Added as Teacher', `You've been added as a teacher to group "${groupRes.rows[0].name}"`, group_id);
    res.json({ message: `${teacherRes.rows[0].full_name} added as teacher`, teacher: teacherRes.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add teacher: ' + err.message });
  }
};

const removeMember = async (req, res) => {
  const { group_id, user_id } = req.body;
  const groupRes = await query('SELECT id FROM groups WHERE id=$1 AND mentor_id=$2', [group_id, req.user.id]);
  if (!groupRes.rows[0]) return res.status(403).json({ error: 'Not authorized' });
  try {
    await query('UPDATE group_members SET is_active=FALSE, removed_at=NOW() WHERE group_id=$1 AND user_id=$2', [group_id, user_id]);
    await query('DELETE FROM rankings WHERE group_id=$1 AND user_id=$2', [group_id, user_id]);
    const { sendNotification } = require('./notificationController');
    await sendNotification(req.app, user_id, 'group_removed', 'Removed from Group', 'You have been removed from a group by your mentor');
    res.json({ message: 'Member removed from group (account and skills preserved)' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
};

const getGroupMembers = async (req, res) => {
  const { groupId } = req.params;
  try {
    const result = await query(
      `SELECT gm.id as member_id, gm.role as group_role, gm.created_at as joined_at,
              u.id as user_id, u.full_name, u.email, u.photo_url,
              p.headline, p.profile_completeness, p.career_readiness,
              cs.overall_score as confidence_score,
              r.rank_position, r.total_score as rank_score, r.rank_change,
              (SELECT attempted_at FROM practice_attempts WHERE user_id=u.id ORDER BY attempted_at DESC LIMIT 1) as last_practice
       FROM group_members gm
       JOIN users u ON u.id=gm.user_id
       LEFT JOIN profiles p ON p.user_id=gm.user_id
       LEFT JOIN confidence_scores cs ON cs.user_id=gm.user_id
       LEFT JOIN rankings r ON r.user_id=gm.user_id AND r.group_id=$1
       WHERE gm.group_id=$1 AND gm.is_active=TRUE
       ORDER BY gm.role ASC, r.rank_position ASC NULLS LAST`,
      [groupId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load members' });
  }
};

// ── INVITES ──
const sendInvites = async (req, res) => {
  const { group_id, emails } = req.body;
  const results = [];
  for (const email of emails) {
    const token = crypto.randomBytes(32).toString('hex');
    try {
      await query('INSERT INTO invites (email, group_id, invited_by, token) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
        [email.toLowerCase(), group_id, req.user.id, token]);
      const baseUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');
      const inviteLink = `${baseUrl}/auth/login?invite=${token}`;
      results.push({ email, invite_link: inviteLink, status: 'created' });
    } catch { results.push({ email, status: 'failed' }); }
  }
  res.json({ invites: results });
};

const processInviteAfterRegistration = async (userId, email) => {
  const invites = await query("SELECT * FROM invites WHERE LOWER(email)=LOWER($1) AND status='pending' AND expires_at > NOW()", [email]);
  for (const invite of invites.rows) {
    await query('INSERT INTO group_members (group_id, user_id, added_by) VALUES ($1,$2,$3) ON CONFLICT (group_id,user_id) DO NOTHING',
      [invite.group_id, userId, invite.invited_by]).catch(() => {});
    await query("UPDATE invites SET status='accepted' WHERE id=$1", [invite.id]).catch(() => {});
  }
};

// ── ANNOUNCEMENTS ──
const createAnnouncement = async (req, res) => {
  const { group_id, title, content, attachment_url } = req.body;
  if (!group_id || !title || !content) return res.status(400).json({ error: 'group_id, title and content required' });
  try {
    const result = await query(
      'INSERT INTO announcements (created_by, group_id, title, content, attachment_url) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user.id, group_id, title, content, attachment_url || null]
    );
    const membersRes = await query("SELECT user_id FROM group_members WHERE group_id=$1 AND is_active=TRUE AND role='candidate'", [group_id]);
    const { sendNotification } = require('./notificationController');
    for (const m of membersRes.rows) {
      await sendNotification(req.app, m.user_id, 'announcement', 'New Announcement', title, result.rows[0].id);
    }
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to post announcement' });
  }
};

const getGroupAnnouncements = async (req, res) => {
  const { groupId } = req.params;
  try {
    const result = await query(
      'SELECT a.*, u.full_name as author, u.role as author_role FROM announcements a JOIN users u ON u.id=a.created_by WHERE a.group_id=$1 ORDER BY a.created_at DESC',
      [groupId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load announcements' });
  }
};

// ── CANDIDATE: my groups with full details ──
const getMyGroups = async (req, res) => {
  try {
    const result = await query(
      `SELECT g.*, w.name as workspace_name,
              r.rank_position, r.total_score, r.rank_change,
              COUNT(gm2.id) FILTER (WHERE gm2.role='candidate') as candidate_count,
              u.full_name as mentor_name
       FROM group_members gm
       JOIN groups g ON g.id=gm.group_id
       JOIN workspaces w ON w.id=g.workspace_id
       JOIN users u ON u.id=g.mentor_id
       LEFT JOIN rankings r ON r.user_id=$1 AND r.group_id=g.id
       LEFT JOIN group_members gm2 ON gm2.group_id=g.id AND gm2.is_active=TRUE
       WHERE gm.user_id=$1 AND gm.is_active=TRUE AND g.is_archived=FALSE
       GROUP BY g.id, w.name, r.rank_position, r.total_score, r.rank_change, u.full_name
       ORDER BY g.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load groups' });
  }
};

// Group questions (assigned to group by mentor/teacher)
const getGroupQuestions = async (req, res) => {
  const { groupId } = req.params;
  try {
    // Verify access
    const access = await query(
      'SELECT id FROM group_members WHERE group_id=$1 AND user_id=$2 AND is_active=TRUE',
      [groupId, req.user.id]
    );
    const isMentor = await query('SELECT id FROM groups WHERE id=$1 AND mentor_id=$2', [groupId, req.user.id]);
    if (!access.rows[0] && !isMentor.rows[0]) return res.status(403).json({ error: 'Not a member of this group' });

    // Fetch all active questions for the group
    const result = await query(
      `SELECT q.*, u.full_name as created_by_name, a.name as assignment_name, COALESCE(q.expires_at, a.expires_at) as expires_at,
              (SELECT COUNT(*) FROM practice_attempts pa WHERE pa.question_id=q.id AND pa.user_id=$2) as my_attempts,
              (SELECT is_correct FROM practice_attempts pa WHERE pa.question_id=q.id AND pa.user_id=$2 ORDER BY attempted_at DESC LIMIT 1) as last_result
       FROM questions q 
       JOIN users u ON u.id=q.created_by
       LEFT JOIN assignments a ON q.assignment_id = a.id
       WHERE q.group_id=$1 AND q.is_active=TRUE
       ORDER BY q.created_at DESC`,
      [groupId, req.user.id]
    );

    const now = new Date();
    const questions = result.rows.map(q => ({
      ...q,
      is_expired: q.expires_at && new Date(q.expires_at) < now
    }));

    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load questions' });
  }
};

// ── WORKSPACE comparison (mentor/teacher) ──
const getWorkspaceComparison = async (req, res) => {
  const { workspaceId } = req.params;
  try {
    // Check access: mentor owns workspace, or teacher in any group inside
    const mentorCheck = await query('SELECT id FROM workspaces WHERE id=$1 AND mentor_id=$2', [workspaceId, req.user.id]);
    const teacherCheck = await query(
      `SELECT g.id FROM groups g JOIN group_members gm ON gm.group_id=g.id
       WHERE g.workspace_id=$1 AND gm.user_id=$2 AND gm.role='teacher' AND gm.is_active=TRUE LIMIT 1`,
      [workspaceId, req.user.id]
    );
    if (!mentorCheck.rows[0] && !teacherCheck.rows[0]) return res.status(403).json({ error: 'Access denied' });

    const groupsRes = await query(
      `SELECT g.id, g.name,
              COUNT(gm.id) FILTER (WHERE gm.role='candidate' AND gm.is_active=TRUE) as candidate_count,
              AVG(cs.overall_score) as avg_confidence,
              AVG(r.total_score) as avg_rank_score,
              MAX(r.total_score) as top_score,
              COUNT(pa.id) FILTER (WHERE pa.attempted_at > NOW() - INTERVAL '7 days') as weekly_attempts
       FROM groups g
       LEFT JOIN group_members gm ON gm.group_id=g.id
       LEFT JOIN confidence_scores cs ON cs.user_id=gm.user_id
       LEFT JOIN rankings r ON r.user_id=gm.user_id AND r.group_id=g.id
       LEFT JOIN practice_attempts pa ON pa.user_id=gm.user_id
       WHERE g.workspace_id=$1 AND g.is_archived=FALSE
       GROUP BY g.id, g.name ORDER BY avg_rank_score DESC NULLS LAST`,
      [workspaceId]
    );
    res.json(groupsRes.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load comparison: ' + err.message });
  }
};

// ── EXPORT ──
const exportGroupReport = async (req, res) => {
  const { groupId } = req.params;
  const { format = 'csv' } = req.query;
  try {
    const members = await query(
      `SELECT u.full_name, u.email, gm.role as group_role, r.rank_position, r.total_score,
              r.practice_score, r.github_score, r.leetcode_score, p.profile_completeness, p.career_readiness,
              cs.overall_score
       FROM group_members gm
       JOIN users u ON u.id=gm.user_id
       LEFT JOIN profiles p ON p.user_id=gm.user_id
       LEFT JOIN confidence_scores cs ON cs.user_id=gm.user_id
       LEFT JOIN rankings r ON r.user_id=gm.user_id AND r.group_id=$1
       WHERE gm.group_id=$1 AND gm.is_active=TRUE
       ORDER BY gm.role ASC, r.rank_position ASC NULLS LAST`,
      [groupId]
    );
    if (format === 'csv') {
      const header = 'Name,Email,Role,Rank,Total Score,Practice,GitHub,LeetCode,Profile%,Career Readiness,Confidence\n';
      const rows = members.rows.map(m =>
        `"${m.full_name}","${m.email}","${m.group_role}",${m.rank_position||'—'},${Math.round(m.total_score||0)},${Math.round(m.practice_score||0)},${Math.round(m.github_score||0)},${Math.round(m.leetcode_score||0)},${m.profile_completeness||0},${m.career_readiness||'—'},${m.overall_score||0}`
      ).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="group-report-${groupId}.csv"`);
      return res.send(header + rows);
    }
    res.json(members.rows);
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
};

const getAssignmentAnalytics = async (req, res) => {
  const { groupId } = req.params;
  try {
    const stats = await query(
      `SELECT a.id, a.name, a.created_at, a.expires_at,
       (SELECT COUNT(*) FROM questions q WHERE q.assignment_id = a.id AND q.is_active=TRUE) as question_count,
       (SELECT COUNT(DISTINCT user_id) FROM practice_attempts pa 
        JOIN questions q ON pa.question_id = q.id 
        WHERE q.assignment_id = a.id) as completion_count,
       (SELECT AVG(user_score_pct) FROM (
         SELECT pa.user_id, 
                (SUM(pa.score)::float / NULLIF(SUM(q.points), 0)) * 100 as user_score_pct
         FROM practice_attempts pa
         JOIN questions q ON pa.question_id = q.id
         WHERE q.assignment_id = a.id
         GROUP BY pa.user_id
       ) as scores) as avg_score
       FROM assignments a
       WHERE a.group_id = $1`,
      [groupId]
    );
    res.json(stats.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

module.exports = {
  createWorkspace, getMyWorkspaces, getTeacherWorkspaces,
  createGroup, getGroups, archiveGroup,
  addMembersByEmail, addTeacherToGroup, removeMember, getGroupMembers,
  sendInvites, processInviteAfterRegistration,
  createAnnouncement, getGroupAnnouncements,
  getMyGroups, getGroupQuestions,
  getWorkspaceComparison,
  deleteWorkspace,
  exportGroupReport,
  getAssignmentAnalytics,
};
