const { db, admin } = require('../config/firebase');
const { recalculateGroupRanking } = require('../services/rankingService');
const crypto = require('crypto');

const MAX_GROUPS_PER_WORKSPACE = 5;

// ── WORKSPACES ──
const createWorkspace = async (req, res) => {
  const { name, description } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Workspace name required' });
  try {
    const newWs = {
      mentor_id: req.user.id,
      name: name.trim(),
      description: description || '',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };
    const docRef = await db.collection('workspaces').add(newWs);
    res.status(201).json({ id: docRef.id, ...newWs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create workspace: ' + err.message });
  }
};

const getMyWorkspaces = async (req, res) => {
  try {
    const snap = await db.collection('workspaces').where('mentor_id', '==', req.user.id).get();
    const workspaces = [];
    for (const doc of snap.docs) {
      const gSnap = await db.collection('groups').where('workspace_id', '==', doc.id).where('is_archived', '==', false).get();
      workspaces.push({ id: doc.id, ...doc.data(), group_count: gSnap.size });
    }
    workspaces.sort((a, b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));
    res.json(workspaces);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load workspaces' });
  }
};

const deleteWorkspace = async (req, res) => {
  try {
    const docRef = db.collection('workspaces').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().mentor_id !== req.user.id) return res.status(404).json({ error: 'Workspace not found' });
    await docRef.delete();
    res.json({ message: 'Workspace deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete workspace: ' + err.message });
  }
};

const getTeacherWorkspaces = async (req, res) => {
  try {
    const membersSnap = await db.collection('group_members')
      .where('user_id', '==', req.user.id)
      .where('role', '==', 'teacher')
      .where('is_active', '==', true)
      .get();

    const workspaceIds = new Set();
    const workspaces = [];
    
    for (const mDoc of membersSnap.docs) {
      const gDoc = await db.collection('groups').doc(mDoc.data().group_id).get();
      if (gDoc.exists && !gDoc.data().is_archived) {
        const wsId = gDoc.data().workspace_id;
        if (!workspaceIds.has(wsId)) {
          workspaceIds.add(wsId);
          const wDoc = await db.collection('workspaces').doc(wsId).get();
          if (wDoc.exists) {
            workspaces.push({ id: wDoc.id, ...wDoc.data(), mentor_id: gDoc.data().mentor_id });
          }
        }
      }
    }
    res.json(workspaces);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load workspaces' });
  }
};

// ── GROUPS ──
const createGroup = async (req, res) => {
  const { workspace_id, name, description } = req.body;
  if (!workspace_id || !name?.trim()) return res.status(400).json({ error: 'workspace_id and name required' });
  try {
    const wDoc = await db.collection('workspaces').doc(workspace_id).get();
    if (!wDoc.exists || wDoc.data().mentor_id !== req.user.id) return res.status(403).json({ error: 'Workspace not found or not yours' });

    const gSnap = await db.collection('groups').where('workspace_id', '==', workspace_id).where('is_archived', '==', false).get();
    if (gSnap.size >= MAX_GROUPS_PER_WORKSPACE) {
      return res.status(400).json({ error: `Maximum ${MAX_GROUPS_PER_WORKSPACE} active groups per workspace` });
    }

    const newGroup = {
      workspace_id,
      mentor_id: req.user.id,
      name: name.trim(),
      description: description || '',
      is_archived: false,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };
    const gRef = await db.collection('groups').add(newGroup);
    
    db.collection('activity_logs').add({
      user_id: req.user.id,
      action: 'group_created',
      details: { group_name: name },
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({ id: gRef.id, ...newGroup });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create group: ' + err.message });
  }
};

const getGroups = async (req, res) => {
  const { workspace_id } = req.query;
  try {
    const groups = [];
    if (req.user.role === 'mentor') {
      let gQuery = db.collection('groups').where('mentor_id', '==', req.user.id).where('is_archived', '==', false);
      if (workspace_id) gQuery = gQuery.where('workspace_id', '==', workspace_id);
      const snap = await gQuery.get();
      
      for (const doc of snap.docs) {
        const wDoc = await db.collection('workspaces').doc(doc.data().workspace_id).get();
        const mSnap = await db.collection('group_members').where('group_id', '==', doc.id).where('is_active', '==', true).get();
        groups.push({ id: doc.id, ...doc.data(), workspace_name: wDoc.exists ? wDoc.data().name : '', member_count: mSnap.size });
      }
    } else if (req.user.role === 'teacher') {
      const mSnap = await db.collection('group_members').where('user_id', '==', req.user.id).where('role', '==', 'teacher').where('is_active', '==', true).get();
      for (const mDoc of mSnap.docs) {
        const gDoc = await db.collection('groups').doc(mDoc.data().group_id).get();
        if (gDoc.exists && !gDoc.data().is_archived) {
          if (workspace_id && gDoc.data().workspace_id !== workspace_id) continue;
          const wDoc = await db.collection('workspaces').doc(gDoc.data().workspace_id).get();
          const allMSnap = await db.collection('group_members').where('group_id', '==', gDoc.id).where('is_active', '==', true).get();
          groups.push({ id: gDoc.id, ...gDoc.data(), workspace_name: wDoc.exists ? wDoc.data().name : '', member_count: allMSnap.size });
        }
      }
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    groups.sort((a, b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load groups' });
  }
};

const archiveGroup = async (req, res) => {
  try {
    const gRef = db.collection('groups').doc(req.params.id);
    const doc = await gRef.get();
    if (!doc.exists || doc.data().mentor_id !== req.user.id) return res.status(404).json({ error: 'Group not found' });
    
    await gRef.update({ is_archived: true, archived_at: admin.firestore.FieldValue.serverTimestamp() });
    const updated = await gRef.get();
    res.json({ message: 'Group archived', group: { id: updated.id, ...updated.data() } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to archive group' });
  }
};

// ── MEMBERS ──
const addMembersByEmail = async (req, res) => {
  const { group_id, emails, role: memberRole = 'candidate' } = req.body;
  if (!group_id || !emails?.length) return res.status(400).json({ error: 'group_id and emails[] required' });

  const groupDoc = await db.collection('groups').doc(group_id).get();
  if (!groupDoc.exists || groupDoc.data().mentor_id !== req.user.id || groupDoc.data().is_archived) {
    return res.status(403).json({ error: 'Group not found or not yours' });
  }
  const groupName = groupDoc.data().name;

  const mSnap = await db.collection('group_members').where('group_id', '==', group_id).where('is_active', '==', true).where('role', '==', 'candidate').get();
  const currentCandidates = mSnap.size;

  const summary = { total: emails.length, added: 0, already_in_group: 0, not_registered: [], skipped: 0 };
  const allowedRole = memberRole === 'teacher' ? 'teacher' : 'candidate';
  const { sendNotification } = require('./notificationController');

  for (const email of emails) {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) continue;

    const uSnap = await db.collection('users').where('email', '==', trimmed).where('role', '==', allowedRole).get();
    if (uSnap.empty) {
      summary.not_registered.push(trimmed);
      continue;
    }
    const userId = uSnap.docs[0].id;

    const existingMSnap = await db.collection('group_members').where('group_id', '==', group_id).where('user_id', '==', userId).get();
    
    if (!existingMSnap.empty) {
      const mDoc = existingMSnap.docs[0];
      if (mDoc.data().is_active) {
        summary.already_in_group++;
      } else {
        await db.collection('group_members').doc(mDoc.id).update({ is_active: true, removed_at: null, role: allowedRole });
        summary.added++;
      }
    } else {
      if (allowedRole === 'candidate' && currentCandidates + summary.added >= 50) { // MAX members
        summary.skipped++; continue;
      }
      await db.collection('group_members').add({
        group_id, user_id: userId, added_by: req.user.id, role: allowedRole, is_active: true, created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      summary.added++;

      const notifMsg = allowedRole === 'teacher' ? `You have been added as a teacher to group "${groupName}"` : `You have been added to group "${groupName}" by your mentor`;
      await sendNotification(req.app, userId, 'group_added', 'Added to Group', notifMsg, group_id);
      
      db.collection('users').doc(userId).collection('progress_events').add({
        event_type: 'group_joined', event_title: 'Joined Group', event_detail: `Added to group "${groupName}"`, created_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  // Not strictly calling SQL recalculateGroupRanking here since it's firestore now. We'll handle ranks differently in NoSQL.
  res.json(summary);
};

const addTeacherToGroup = async (req, res) => {
  const { group_id, email } = req.body;
  if (!group_id || !email) return res.status(400).json({ error: 'group_id and email required' });

  const groupDoc = await db.collection('groups').doc(group_id).get();
  if (!groupDoc.exists || groupDoc.data().mentor_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

  const uSnap = await db.collection('users').where('email', '==', email.toLowerCase()).where('role', '==', 'teacher').get();
  if (uSnap.empty) return res.status(404).json({ error: `No teacher account found with email "${email}".` });

  const userId = uSnap.docs[0].id;
  const existingMSnap = await db.collection('group_members').where('group_id', '==', group_id).where('user_id', '==', userId).get();

  if (!existingMSnap.empty) {
    await db.collection('group_members').doc(existingMSnap.docs[0].id).update({ is_active: true, role: 'teacher' });
  } else {
    await db.collection('group_members').add({
      group_id, user_id: userId, added_by: req.user.id, role: 'teacher', is_active: true, created_at: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  const { sendNotification } = require('./notificationController');
  await sendNotification(req.app, userId, 'group_added', 'Added as Teacher', `You've been added as a teacher to group "${groupDoc.data().name}"`, group_id);

  res.json({ message: `${uSnap.docs[0].data().full_name} added as teacher`, teacher: { id: userId, ...uSnap.docs[0].data() } });
};

const removeMember = async (req, res) => {
  const { group_id, user_id } = req.body;
  const groupDoc = await db.collection('groups').doc(group_id).get();
  if (!groupDoc.exists || groupDoc.data().mentor_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

  const mSnap = await db.collection('group_members').where('group_id', '==', group_id).where('user_id', '==', user_id).get();
  if (!mSnap.empty) {
    await db.collection('group_members').doc(mSnap.docs[0].id).update({ is_active: false, removed_at: admin.firestore.FieldValue.serverTimestamp() });
  }

  const { sendNotification } = require('./notificationController');
  await sendNotification(req.app, user_id, 'group_removed', 'Removed from Group', 'You have been removed from a group by your mentor');
  res.json({ message: 'Member removed from group (account and skills preserved)' });
};

const getGroupMembers = async (req, res) => {
  const { groupId } = req.params;
  try {
    const mSnap = await db.collection('group_members').where('group_id', '==', groupId).where('is_active', '==', true).get();
    const members = [];
    for (const doc of mSnap.docs) {
      const data = doc.data();
      const uDoc = await db.collection('users').doc(data.user_id).get();
      const pDoc = await db.collection('profiles').doc(data.user_id).get();
      const csDoc = await db.collection('confidence_scores').doc(data.user_id).get();
      
      const u = uDoc.exists ? uDoc.data() : {};
      const p = pDoc.exists ? pDoc.data() : {};
      const cs = csDoc.exists ? csDoc.data() : {};

      members.push({
        member_id: doc.id,
        group_role: data.role,
        joined_at: data.created_at,
        user_id: data.user_id,
        full_name: u.full_name,
        email: u.email,
        photo_url: u.photo_url,
        headline: p.headline,
        profile_completeness: p.profile_completeness || 0,
        career_readiness: p.career_readiness || 0,
        confidence_score: cs.overall_score || 0,
        rank_position: 0, rank_score: 0, rank_change: 0,
        last_practice: null
      });
    }
    
    // Simplistic sorting for now since rankings need NoSQL refactoring
    members.sort((a, b) => {
      if (a.group_role !== b.group_role) return a.group_role === 'teacher' ? -1 : 1;
      return b.confidence_score - a.confidence_score;
    });

    res.json(members);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load members' });
  }
};

const sendInvites = async (req, res) => {
  const { group_id, emails } = req.body;
  const results = [];
  for (const email of emails) {
    const token = crypto.randomBytes(32).toString('hex');
    try {
      await db.collection('invites').add({
        email: email.toLowerCase(), group_id, invited_by: req.user.id, token, status: 'pending', created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      const baseUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');
      const inviteLink = `${baseUrl}/auth/login?invite=${token}`;
      results.push({ email, invite_link: inviteLink, status: 'created' });
    } catch { results.push({ email, status: 'failed' }); }
  }
  res.json({ invites: results });
};

const processInviteAfterRegistration = async (userId, email) => {
  const snap = await db.collection('invites').where('email', '==', email.toLowerCase()).where('status', '==', 'pending').get();
  for (const doc of snap.docs) {
    await db.collection('group_members').add({
      group_id: doc.data().group_id, user_id: userId, added_by: doc.data().invited_by, role: 'candidate', is_active: true, created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    await db.collection('invites').doc(doc.id).update({ status: 'accepted' });
  }
};

const createAnnouncement = async (req, res) => {
  const { group_id, title, content, attachment_url } = req.body;
  if (!group_id || !title || !content) return res.status(400).json({ error: 'group_id, title and content required' });
  try {
    const newAnn = {
      created_by: req.user.id, group_id, title, content, attachment_url: attachment_url || null, created_at: admin.firestore.FieldValue.serverTimestamp()
    };
    const annRef = await db.collection('announcements').add(newAnn);

    const mSnap = await db.collection('group_members').where('group_id', '==', group_id).where('is_active', '==', true).where('role', '==', 'candidate').get();
    const { sendNotification } = require('./notificationController');
    for (const mDoc of mSnap.docs) {
      await sendNotification(req.app, mDoc.data().user_id, 'announcement', 'New Announcement', title, annRef.id);
    }
    res.status(201).json({ id: annRef.id, ...newAnn });
  } catch (err) {
    res.status(500).json({ error: 'Failed to post announcement' });
  }
};

const getGroupAnnouncements = async (req, res) => {
  const { groupId } = req.params;
  try {
    const snap = await db.collection('announcements').where('group_id', '==', groupId).get();
    let announcements = [];
    for (const doc of snap.docs) {
      const data = doc.data();
      const uDoc = await db.collection('users').doc(data.created_by).get();
      announcements.push({ 
        id: doc.id, 
        ...data, 
        created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : data.created_at,
        author: uDoc.exists ? uDoc.data().full_name : 'Unknown', 
        author_role: uDoc.exists ? uDoc.data().role : '' 
      });
    }
    announcements.sort((a, b) => {
      const t1 = new Date(a.created_at || 0).getTime();
      const t2 = new Date(b.created_at || 0).getTime();
      return t2 - t1;
    });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load announcements' });
  }
};

const getMyGroups = async (req, res) => {
  try {
    const mSnap = await db.collection('group_members').where('user_id', '==', req.user.id).where('is_active', '==', true).get();
    const groups = [];
    for (const mDoc of mSnap.docs) {
      const gDoc = await db.collection('groups').doc(mDoc.data().group_id).get();
      if (gDoc.exists && !gDoc.data().is_archived) {
        const wDoc = await db.collection('workspaces').doc(gDoc.data().workspace_id).get();
        const mentorDoc = await db.collection('users').doc(gDoc.data().mentor_id).get();
        const candSnap = await db.collection('group_members').where('group_id', '==', gDoc.id).where('role', '==', 'candidate').where('is_active', '==', true).get();
        
        groups.push({
          id: gDoc.id, ...gDoc.data(),
          workspace_name: wDoc.exists ? wDoc.data().name : '',
          mentor_name: mentorDoc.exists ? mentorDoc.data().full_name : '',
          candidate_count: candSnap.size,
          rank_position: 0, total_score: 0, rank_change: 0
        });
      }
    }
    groups.sort((a, b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load groups' });
  }
};

const getGroupQuestions = async (req, res) => {
  const { groupId } = req.params;
  try {
    const mSnap = await db.collection('group_members').where('group_id', '==', groupId).where('user_id', '==', req.user.id).where('is_active', '==', true).get();
    const gDoc = await db.collection('groups').doc(groupId).get();
    if (mSnap.empty && (!gDoc.exists || gDoc.data().mentor_id !== req.user.id)) return res.status(403).json({ error: 'Not a member of this group' });

    const qSnap = await db.collection('questions').where('group_id', '==', groupId).where('is_active', '==', true).get();
    const questions = [];
    const now = Date.now();
    
    for (const doc of qSnap.docs) {
      const q = doc.data();
      const uDoc = await db.collection('users').doc(q.created_by).get();
      
      let assignmentName = null;
      let expiresAt = q.expires_at;
      if (q.assignment_id) {
        const aDoc = await db.collection('assignments').doc(q.assignment_id).get();
        if (aDoc.exists) {
          assignmentName = aDoc.data().name;
          if (!expiresAt) expiresAt = aDoc.data().expires_at;
        }
      }

      const attemptsSnap = await db.collection('practice_attempts').where('question_id', '==', doc.id).where('user_id', '==', req.user.id).orderBy('attempted_at', 'desc').get();
      
      questions.push({
        id: doc.id, ...q,
        created_by_name: uDoc.exists ? uDoc.data().full_name : 'Unknown',
        assignment_name: assignmentName,
        expires_at: expiresAt,
        my_attempts: attemptsSnap.size,
        last_result: attemptsSnap.empty ? null : attemptsSnap.docs[0].data().is_correct,
        is_expired: expiresAt ? (expiresAt.toDate ? expiresAt.toDate().getTime() : new Date(expiresAt).getTime()) < now : false
      });
    }
    
    questions.sort((a, b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load questions' });
  }
};

const getWorkspaceComparison = async (req, res) => {
  const { workspaceId } = req.params;
  try {
    const wDoc = await db.collection('workspaces').doc(workspaceId).get();
    const isMentor = wDoc.exists && wDoc.data().mentor_id === req.user.id;
    let isTeacher = false;
    
    if (!isMentor) {
      const mSnap = await db.collection('group_members').where('user_id', '==', req.user.id).where('role', '==', 'teacher').where('is_active', '==', true).get();
      for (const mDoc of mSnap.docs) {
        const gDoc = await db.collection('groups').doc(mDoc.data().group_id).get();
        if (gDoc.exists && gDoc.data().workspace_id === workspaceId) isTeacher = true;
      }
    }

    if (!isMentor && !isTeacher) return res.status(403).json({ error: 'Access denied' });

    const gSnap = await db.collection('groups').where('workspace_id', '==', workspaceId).where('is_archived', '==', false).get();
    const groups = [];

    for (const doc of gSnap.docs) {
      const mSnap = await db.collection('group_members').where('group_id', '==', doc.id).where('role', '==', 'candidate').where('is_active', '==', true).get();
      
      let sumConf = 0;
      let confCount = 0;
      
      for (const mDoc of mSnap.docs) {
        const csDoc = await db.collection('confidence_scores').doc(mDoc.data().user_id).get();
        if (csDoc.exists) {
          sumConf += csDoc.data().overall_score || 0;
          confCount++;
        }
      }

      groups.push({
        id: doc.id, name: doc.data().name,
        candidate_count: mSnap.size,
        avg_confidence: confCount > 0 ? sumConf / confCount : 0,
        avg_rank_score: 0, top_score: 0, weekly_attempts: 0
      });
    }

    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load comparison: ' + err.message });
  }
};

const exportGroupReport = async (req, res) => {
  const { groupId } = req.params;
  const { format = 'csv' } = req.query;
  try {
    const mSnap = await db.collection('group_members').where('group_id', '==', groupId).where('is_active', '==', true).get();
    const members = [];
    
    for (const doc of mSnap.docs) {
      const data = doc.data();
      const uDoc = await db.collection('users').doc(data.user_id).get();
      const pDoc = await db.collection('profiles').doc(data.user_id).get();
      const csDoc = await db.collection('confidence_scores').doc(data.user_id).get();
      
      const u = uDoc.exists ? uDoc.data() : {};
      const p = pDoc.exists ? pDoc.data() : {};
      const cs = csDoc.exists ? csDoc.data() : {};

      members.push({
        full_name: u.full_name, email: u.email, group_role: data.role,
        rank_position: 0, total_score: 0, practice_score: 0, github_score: 0, leetcode_score: 0,
        profile_completeness: p.profile_completeness || 0,
        career_readiness: p.career_readiness || 0,
        overall_score: cs.overall_score || 0
      });
    }

    members.sort((a, b) => a.group_role.localeCompare(b.group_role));

    if (format === 'csv') {
      const header = 'Name,Email,Role,Rank,Total Score,Practice,GitHub,LeetCode,Profile%,Career Readiness,Confidence\\n';
      const rows = members.map(m =>
        `"${m.full_name}","${m.email}","${m.group_role}",${m.rank_position||'—'},${Math.round(m.total_score||0)},${Math.round(m.practice_score||0)},${Math.round(m.github_score||0)},${Math.round(m.leetcode_score||0)},${m.profile_completeness||0},${m.career_readiness||'—'},${m.overall_score||0}`
      ).join('\\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="group-report-${groupId}.csv"`);
      return res.send(header + rows);
    }
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
};

const getAssignmentAnalytics = async (req, res) => {
  const { groupId } = req.params;
  try {
    const aSnap = await db.collection('assignments').where('group_id', '==', groupId).get();
    const stats = [];
    
    for (const doc of aSnap.docs) {
      const qSnap = await db.collection('questions').where('assignment_id', '==', doc.id).where('is_active', '==', true).get();
      stats.push({
        id: doc.id, name: doc.data().name, created_at: doc.data().created_at, expires_at: doc.data().expires_at,
        question_count: qSnap.size,
        completion_count: 0, avg_score: 0
      });
    }
    
    res.json(stats);
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
