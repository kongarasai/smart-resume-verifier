const { db, admin } = require('../config/firebase');

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
    
    const newEval = {
      candidate_id: candidateId,
      hr_id: hrId,
      status: status,
      notes: notes,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const evalRef = await db.collection('hr_evaluations').add(newEval);

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

    db.collection('users').doc(candidateId).collection('progress_events').add({
      event_type: eventType,
      event_title: eventTitle,
      event_detail: notes || `Status updated to ${status}`,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    }).catch(e => console.error('Timeline error:', e));

    // Notify candidate
    db.collection('notifications').add({
      user_id: candidateId,
      type: 'hiring_update',
      title: eventTitle,
      message: notes || `HR has updated your recruitment status to ${status}`,
      is_read: false,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    }).catch(e => console.error('Notification error:', e));

    res.json({ id: evalRef.id, ...newEval });
  } catch (err) {
    console.error('HR Eval Save Error:', err);
    res.status(500).json({ error: 'Failed to save evaluation: ' + err.message });
  }
};

exports.getHREvaluation = async (req, res) => {
  const { candidateId } = req.params;
  const hrId = req.user.id;
  try {
    const snap = await db.collection('hr_evaluations')
      .where('candidate_id', '==', candidateId)
      .where('hr_id', '==', hrId)
      .orderBy('created_at', 'desc')
      .limit(1)
      .get();
      
    res.json(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
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
      const newFeedback = {
        candidate_id: candidateId,
        teacher_id: teacherId,
        notes: notes,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      };
      const result = await db.collection('teacher_feedbacks').add(newFeedback);
      
      // Add timeline event
      db.collection('users').doc(candidateId).collection('progress_events').add({
        event_type: 'teacher_feedback',
        event_title: 'Teacher Feedback Added',
        event_detail: 'A teacher provided feedback on your profile.',
        created_at: admin.firestore.FieldValue.serverTimestamp()
      }).catch(e => console.error(e));
  
      res.json({ id: result.id, ...newFeedback });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save feedback' });
    }
};

exports.getTeacherFeedbacks = async (req, res) => {
    const { candidateId } = req.params;
    try {
      const snap = await db.collection('teacher_feedbacks')
        .where('candidate_id', '==', candidateId)
        .orderBy('created_at', 'desc')
        .get();
        
      const feedbacks = [];
      for (const doc of snap.docs) {
        const data = doc.data();
        const teacherDoc = await db.collection('users').doc(data.teacher_id).get();
        const teacherName = teacherDoc.exists ? teacherDoc.data().full_name : 'Unknown Teacher';
        feedbacks.push({ id: doc.id, teacher_name: teacherName, ...data });
      }
      res.json(feedbacks);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch feedbacks' });
    }
};
