const { query } = require('../config/database');

exports.saveHREvaluation = async (req, res) => {
  const { candidateId } = req.params;
  const hrId = req.user?.id;
  let { status: rawStatus, notes } = req.body;
  const status = (rawStatus || 'hold').toLowerCase();

  // Clean notes from accidental name prefixes (if any)
  if (notes && typeof notes === 'string') {
    const hrName = req.user?.full_name?.toLowerCase();
    if (hrName && notes.toLowerCase().startsWith(hrName)) {
       notes = notes.substring(hrName.length).trim();
    }
  }

  if (!hrId || !candidateId) {
    return res.status(400).json({ error: 'HR ID and Candidate ID are required' });
  }

  try {
    console.log(`Saving HR evaluation: candidate=${candidateId}, hr=${hrId}, status=${status}`);
    
    const result = await query(
      'INSERT INTO hr_evaluations (id, candidate_id, hr_id, status, notes) VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING *',
      [candidateId, hrId, status, notes]
    );

    // Add specific timeline event
    const eventTypeMap = {
      'shortlisted': 'shortlisted',
      'rejected': 'rejected',
      'hold': 'hold'
    };
    const eventType = eventTypeMap[status] || 'hr_review';
    
    const eventTitleMap = {
      'shortlisted': '🎉 Shortlisted for Interview',
      'rejected': '📁 Application Reviewed',
      'hold': '⏳ Application On Hold'
    };
    const eventTitle = eventTitleMap[status] || 'HR Review Status Updated';

    await query(
      "INSERT INTO progress_events (id, user_id, event_type, event_title, event_detail) VALUES (gen_random_uuid(), $1, $2, $3, $4)",
      [candidateId, eventType, eventTitle, notes || `Status updated to ${status}`]
    ).catch(e => console.error('Timeline error:', e));

    // Notify candidate
    await query(
      "INSERT INTO notifications (id, user_id, type, title, message) VALUES (gen_random_uuid(), $1, $2, $3, $4)",
      [candidateId, 'hiring_update', eventTitle, notes || `HR has updated your recruitment status to ${status}`]
    ).catch(e => console.error('Notification error:', e));

    res.json(result.rows[0]);
  } catch (err) {
    console.error('HR Eval Save Error:', err);
    res.status(500).json({ error: 'Failed to save evaluation: ' + err.message });
  }
};

exports.getHREvaluation = async (req, res) => {
  const { candidateId } = req.params;
  const hrId = req.user.id;
  try {
    const data = (await query('SELECT * FROM hr_evaluations WHERE candidate_id=$1 AND hr_id=$2', [candidateId, hrId])).rows[0];
    res.json(data || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch evaluation' });
  }
};

exports.saveTeacherFeedback = async (req, res) => {
    const { candidateId } = req.params;
    const teacherId = req.user.id;
    const { notes } = req.body;
  
    try {
      const result = await query(
          'INSERT INTO teacher_feedbacks (candidate_id, teacher_id, notes) VALUES ($1, $2, $3) RETURNING *',
          [candidateId, teacherId, notes]
      );
      
      // Add timeline event
      await query(
        "INSERT INTO progress_events (user_id, event_type, event_title, event_detail) VALUES ($1, 'teacher_feedback', 'Teacher Feedback Added', $2)",
        [candidateId, 'A teacher provided feedback on your profile.']
      );
  
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save feedback' });
    }
};

exports.getTeacherFeedbacks = async (req, res) => {
    const { candidateId } = req.params;
    try {
      const data = await query(
          'SELECT t.*, u.full_name as teacher_name FROM teacher_feedbacks t JOIN users u ON t.teacher_id=u.id WHERE t.candidate_id=$1 ORDER BY t.created_at DESC', 
          [candidateId]
      );
      res.json(data.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch feedbacks' });
    }
};
