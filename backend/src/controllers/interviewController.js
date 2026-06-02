const { query } = require('../config/database');

const scheduleInterview = async (req, res) => {
  const { candidate_id, scheduled_date, scheduled_time, mode, notes, meeting_link } = req.body;
  if (!candidate_id || !scheduled_date || !scheduled_time || !mode) {
    return res.status(400).json({ error: 'candidate_id, date, time, and mode are required' });
  }

  try {
    const cand = await query('SELECT id, full_name FROM users WHERE id=$1 AND role=$2', [candidate_id, 'candidate']);
    if (!cand.rows[0]) return res.status(404).json({ error: 'Candidate not found' });

    const riskRes = await query('SELECT overall_score FROM confidence_scores WHERE user_id=$1', [candidate_id]);
    const score = riskRes.rows[0]?.overall_score || 0;
    const risk_level = score >= 70 ? 'low' : score >= 40 ? 'medium' : 'high';

    const result = await query(
      `INSERT INTO interviews (candidate_id, hr_id, scheduled_date, scheduled_time, mode, notes, meeting_link, risk_level)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [candidate_id, req.user.id, scheduled_date, scheduled_time, mode, notes, meeting_link, risk_level]
    );

    const hrRes = await query('SELECT full_name FROM users WHERE id=$1', [req.user.id]);
    const { sendNotification } = require('./notificationController');
    await sendNotification(
      req.app, 
      candidate_id, 
      'interview_scheduled', 
      'Interview Scheduled', 
      `Your interview has been scheduled for ${scheduled_date} at ${scheduled_time} (${mode}) by ${hrRes.rows[0]?.full_name}`, 
      result.rows[0].id
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to schedule interview' });
  }
};

const getMyInterviews = async (req, res) => {
  const field = req.user.role === 'hr' ? 'hr_id' : 'candidate_id';
  try {
    const result = await query(
      `SELECT i.*,
              u_c.full_name as candidate_name, u_c.email as candidate_email,
              u_h.full_name as hr_name, u_h.email as hr_email
       FROM interviews i
       JOIN users u_c ON u_c.id = i.candidate_id
       JOIN users u_h ON u_h.id = i.hr_id
       WHERE i.${field} = $1
       ORDER BY i.scheduled_date DESC, i.scheduled_time DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load interviews' });
  }
};

const updateInterview = async (req, res) => {
  const { status, notes, meeting_link } = req.body;
  try {
    const result = await query(
      `UPDATE interviews SET status=$1, notes=COALESCE($2,notes), meeting_link=COALESCE($3,meeting_link), updated_at=NOW()
       WHERE id=$4 AND hr_id=$5 RETURNING *`,
      [status, notes, meeting_link, req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Interview not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
};

// Get all HR contacts the candidate has an interview with (for messaging)
const getMyInterviewContacts = async (req, res) => {
  try {
    const result = await query(
      `SELECT DISTINCT u.id, u.full_name, u.email, i.status, i.scheduled_date, i.scheduled_time, i.mode
       FROM interviews i
       JOIN users u ON u.id = CASE WHEN i.candidate_id=$1 THEN i.hr_id ELSE i.candidate_id END
       WHERE (i.candidate_id=$1 OR i.hr_id=$1)
         AND i.status != 'cancelled'
       ORDER BY i.scheduled_date DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load contacts' });
  }
};

// FIX: Proper parentheses so AND/OR precedence works correctly
const sendMessage = async (req, res) => {
  const { receiver_id, content } = req.body;
  if (!receiver_id || !content?.trim()) {
    return res.status(400).json({ error: 'receiver_id and content required' });
  }

  try {
    // FIXED: Proper parentheses around OR clause
    const interviewCheck = await query(
      `SELECT id FROM interviews 
       WHERE ((candidate_id=$1 AND hr_id=$2) OR (candidate_id=$2 AND hr_id=$1))
         AND status != 'cancelled'
       LIMIT 1`,
      [req.user.id, receiver_id]
    );

    if (!interviewCheck.rows[0]) {
      return res.status(403).json({ error: 'Messaging is only enabled after an interview is scheduled between you' });
    }

    const result = await query(
      `INSERT INTO messages (sender_id, receiver_id, interview_id, content)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user.id, receiver_id, interviewCheck.rows[0].id, content.trim()]
    );

    const senderRes = await query('SELECT full_name FROM users WHERE id=$1', [req.user.id]);
    const { sendNotification } = require('./notificationController');
    await sendNotification(
      req.app, 
      receiver_id, 
      'new_message', 
      'New Message', 
      `New message from ${senderRes.rows[0]?.full_name}`, 
      result.rows[0].id
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

const getConversation = async (req, res) => {
  const other = req.params.userId;
  try {
    // Verify they have an interview together before showing messages
    const interviewCheck = await query(
      `SELECT id FROM interviews 
       WHERE ((candidate_id=$1 AND hr_id=$2) OR (candidate_id=$2 AND hr_id=$1))
         AND status != 'cancelled'
       LIMIT 1`,
      [req.user.id, other]
    );
    if (!interviewCheck.rows[0]) {
      return res.status(403).json({ error: 'Messaging only available after an interview is scheduled' });
    }

    const result = await query(
      `SELECT m.*, u.full_name as sender_name
       FROM messages m JOIN users u ON u.id = m.sender_id
       WHERE (m.sender_id=$1 AND m.receiver_id=$2)
          OR (m.sender_id=$2 AND m.receiver_id=$1)
       ORDER BY m.sent_at ASC`,
      [req.user.id, other]
    );
    await query(
      `UPDATE messages SET is_read=true WHERE receiver_id=$1 AND sender_id=$2`,
      [req.user.id, other]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load messages' });
  }
};

const getMyConversations = async (req, res) => {
  try {
    const result = await query(
      `SELECT DISTINCT ON (other_user_id)
         other_user_id,
         other_name,
         last_message,
         last_sent_at,
         unread_count
       FROM (
         SELECT
           CASE WHEN m.sender_id=$1 THEN m.receiver_id ELSE m.sender_id END as other_user_id,
           u.full_name as other_name,
           m.content as last_message,
           m.sent_at as last_sent_at,
           (SELECT COUNT(*) FROM messages m2 
            WHERE m2.receiver_id=$1 
              AND m2.sender_id = CASE WHEN m.sender_id=$1 THEN m.receiver_id ELSE m.sender_id END
              AND m2.is_read=false) as unread_count
         FROM messages m
         JOIN users u ON u.id = CASE WHEN m.sender_id=$1 THEN m.receiver_id ELSE m.sender_id END
         WHERE m.sender_id=$1 OR m.receiver_id=$1
         ORDER BY m.sent_at DESC
       ) sub
       ORDER BY other_user_id, last_sent_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load conversations' });
  }
};

const getNotifications = async (req, res) => {
  const result = await query(
    'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20',
    [req.user.id]
  );
  res.json(result.rows);
};

const markNotificationRead = async (req, res) => {
  await query('UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ message: 'Marked as read' });
};

module.exports = {
  scheduleInterview, getMyInterviews, updateInterview, getMyInterviewContacts,
  sendMessage, getConversation, getMyConversations,
};
