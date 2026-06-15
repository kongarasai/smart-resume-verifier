const { db, admin } = require('../config/firebase');

const scheduleInterview = async (req, res) => {
  const { candidate_id, scheduled_date, scheduled_time, mode, notes, meeting_link } = req.body;
  if (!candidate_id || !scheduled_date || !scheduled_time || !mode) {
    return res.status(400).json({ error: 'candidate_id, date, time, and mode are required' });
  }

  try {
    const candDoc = await db.collection('users').doc(candidate_id).get();
    if (!candDoc.exists || candDoc.data().role !== 'candidate') return res.status(404).json({ error: 'Candidate not found' });

    const riskDoc = await db.collection('confidence_scores').doc(candidate_id).get();
    const score = riskDoc.exists ? riskDoc.data().overall_score : 0;
    const risk_level = score >= 70 ? 'low' : score >= 40 ? 'medium' : 'high';

    const newInterview = {
      candidate_id,
      hr_id: req.user.id,
      scheduled_date,
      scheduled_time,
      mode,
      notes: notes || '',
      meeting_link: meeting_link || '',
      risk_level,
      status: 'scheduled',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('interviews').add(newInterview);

    const hrDoc = await db.collection('users').doc(req.user.id).get();
    const hrName = hrDoc.exists ? hrDoc.data().full_name : 'An HR Representative';

    const { sendNotification } = require('./notificationController');
    await sendNotification(
      req.app, 
      candidate_id, 
      'interview_scheduled', 
      'Interview Scheduled', 
      `Your interview has been scheduled for ${scheduled_date} at ${scheduled_time} (${mode}) by ${hrName}`, 
      docRef.id
    );

    res.status(201).json({ id: docRef.id, ...newInterview });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to schedule interview' });
  }
};

const getMyInterviews = async (req, res) => {
  const field = req.user.role === 'hr' ? 'hr_id' : 'candidate_id';
  try {
    const snap = await db.collection('interviews').where(field, '==', req.user.id).get();
    const interviews = [];
    
    for (const doc of snap.docs) {
      const data = doc.data();
      const [candDoc, hrDoc] = await Promise.all([
        db.collection('users').doc(data.candidate_id).get(),
        db.collection('users').doc(data.hr_id).get()
      ]);
      
      const cand = candDoc.exists ? candDoc.data() : {};
      const hr = hrDoc.exists ? hrDoc.data() : {};
      
      interviews.push({
        id: doc.id, ...data,
        candidate_name: cand.full_name, candidate_email: cand.email,
        hr_name: hr.full_name, hr_email: hr.email
      });
    }

    interviews.sort((a, b) => {
      if (a.scheduled_date !== b.scheduled_date) return b.scheduled_date.localeCompare(a.scheduled_date);
      return (b.scheduled_time || '').localeCompare(a.scheduled_time || '');
    });

    res.json(interviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load interviews' });
  }
};

const updateInterview = async (req, res) => {
  const { status, notes, meeting_link } = req.body;
  try {
    const docRef = db.collection('interviews').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().hr_id !== req.user.id) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const updates = { updated_at: admin.firestore.FieldValue.serverTimestamp() };
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (meeting_link !== undefined) updates.meeting_link = meeting_link;

    await docRef.update(updates);
    const updatedDoc = await docRef.get();
    
    res.json({ id: updatedDoc.id, ...updatedDoc.data() });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
};

const getMyInterviewContacts = async (req, res) => {
  try {
    const asHrSnap = await db.collection('interviews').where('hr_id', '==', req.user.id).get();
    const asCandSnap = await db.collection('interviews').where('candidate_id', '==', req.user.id).get();
    
    const allInterviews = [...asHrSnap.docs, ...asCandSnap.docs].map(d => ({ id: d.id, ...d.data() })).filter(i => i.status !== 'cancelled');
    
    const contactsMap = new Map();
    for (const i of allInterviews) {
      const otherId = i.candidate_id === req.user.id ? i.hr_id : i.candidate_id;
      if (!contactsMap.has(otherId)) {
        contactsMap.set(otherId, { ...i, target_user: otherId });
      }
    }

    const contacts = [];
    for (const [otherId, i] of contactsMap.entries()) {
      const uDoc = await db.collection('users').doc(otherId).get();
      const u = uDoc.exists ? uDoc.data() : {};
      contacts.push({
        id: otherId, full_name: u.full_name, email: u.email,
        status: i.status, scheduled_date: i.scheduled_date, scheduled_time: i.scheduled_time, mode: i.mode
      });
    }

    contacts.sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date));
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load contacts' });
  }
};

const sendMessage = async (req, res) => {
  const { receiver_id, content } = req.body;
  if (!receiver_id || !content?.trim()) {
    return res.status(400).json({ error: 'receiver_id and content required' });
  }

  try {
    const asHrSnap = await db.collection('interviews').where('hr_id', '==', req.user.id).where('candidate_id', '==', receiver_id).get();
    const asCandSnap = await db.collection('interviews').where('hr_id', '==', receiver_id).where('candidate_id', '==', req.user.id).get();
    
    const allInterviews = [...asHrSnap.docs, ...asCandSnap.docs].filter(d => d.data().status !== 'cancelled');

    if (allInterviews.length === 0) {
      return res.status(403).json({ error: 'Messaging is only enabled after an interview is scheduled between you' });
    }

    const newMessage = {
      sender_id: req.user.id,
      receiver_id,
      interview_id: allInterviews[0].id,
      content: content.trim(),
      is_read: false,
      sent_at: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('messages').add(newMessage);

    const senderDoc = await db.collection('users').doc(req.user.id).get();
    const senderName = senderDoc.exists ? senderDoc.data().full_name : 'Someone';

    const { sendNotification } = require('./notificationController');
    await sendNotification(
      req.app, 
      receiver_id, 
      'new_message', 
      'New Message', 
      `New message from ${senderName}`, 
      docRef.id
    );

    res.status(201).json({ id: docRef.id, ...newMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

const getConversation = async (req, res) => {
  const other = req.params.userId;
  try {
    const asHrSnap = await db.collection('interviews').where('hr_id', '==', req.user.id).where('candidate_id', '==', other).get();
    const asCandSnap = await db.collection('interviews').where('hr_id', '==', other).where('candidate_id', '==', req.user.id).get();
    const allInterviews = [...asHrSnap.docs, ...asCandSnap.docs].filter(d => d.data().status !== 'cancelled');

    if (allInterviews.length === 0) {
      return res.status(403).json({ error: 'Messaging only available after an interview is scheduled' });
    }

    const sentSnap = await db.collection('messages').where('sender_id', '==', req.user.id).where('receiver_id', '==', other).get();
    const recvSnap = await db.collection('messages').where('sender_id', '==', other).where('receiver_id', '==', req.user.id).get();
    
    const messages = [...sentSnap.docs, ...recvSnap.docs].map(d => ({ id: d.id, ...d.data() }));

    const u1 = await db.collection('users').doc(req.user.id).get();
    const u2 = await db.collection('users').doc(other).get();
    const n1 = u1.exists ? u1.data().full_name : 'Unknown';
    const n2 = u2.exists ? u2.data().full_name : 'Unknown';

    messages.forEach(m => {
      m.sender_name = m.sender_id === req.user.id ? n1 : n2;
    });

    messages.sort((a, b) => {
      const aTime = a.sent_at ? a.sent_at.toMillis() : 0;
      const bTime = b.sent_at ? b.sent_at.toMillis() : 0;
      return aTime - bTime;
    });

    const batch = db.batch();
    recvSnap.docs.forEach(doc => {
      if (!doc.data().is_read) batch.update(doc.ref, { is_read: true });
    });
    await batch.commit();

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load messages' });
  }
};

const getMyConversations = async (req, res) => {
  try {
    const sentSnap = await db.collection('messages').where('sender_id', '==', req.user.id).get();
    const recvSnap = await db.collection('messages').where('receiver_id', '==', req.user.id).get();
    
    const allMessages = [...sentSnap.docs, ...recvSnap.docs].map(d => ({ id: d.id, ...d.data() }));
    
    const convMap = new Map();
    for (const m of allMessages) {
      const otherId = m.sender_id === req.user.id ? m.receiver_id : m.sender_id;
      if (!convMap.has(otherId)) {
        convMap.set(otherId, { last_message: m.content, last_sent_at: m.sent_at, unread_count: 0 });
      } else {
        const existing = convMap.get(otherId);
        const aTime = m.sent_at ? m.sent_at.toMillis() : 0;
        const bTime = existing.last_sent_at ? existing.last_sent_at.toMillis() : 0;
        if (aTime > bTime) {
          existing.last_message = m.content;
          existing.last_sent_at = m.sent_at;
        }
      }
      if (m.receiver_id === req.user.id && !m.is_read) {
        convMap.get(otherId).unread_count++;
      }
    }

    const conversations = [];
    for (const [otherId, data] of convMap.entries()) {
      const uDoc = await db.collection('users').doc(otherId).get();
      conversations.push({
        other_user_id: otherId,
        other_name: uDoc.exists ? uDoc.data().full_name : 'Unknown',
        ...data
      });
    }

    conversations.sort((a, b) => {
      const aTime = a.last_sent_at ? a.last_sent_at.toMillis() : 0;
      const bTime = b.last_sent_at ? b.last_sent_at.toMillis() : 0;
      return bTime - aTime;
    });

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load conversations' });
  }
};

module.exports = {
  scheduleInterview, getMyInterviews, updateInterview, getMyInterviewContacts,
  sendMessage, getConversation, getMyConversations,
};
