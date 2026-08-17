const { db, admin } = require('../config/firebase');
const logger = require('../utils/logger');

const getNotifications = async (req, res) => {
  try {
    const snap = await db.collection('notifications')
      .where('user_id', '==', req.user.id)
      .get();

    let notifications = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // If candidate has no notifications yet, generate helpful welcome notifications
    if (notifications.length === 0) {
      const welcomeNotifs = [
        {
          user_id: req.user.id,
          type: 'welcome',
          title: 'Welcome to Smart Resume Verifier! 🚀',
          message: 'Complete your profile verification, practice coding assessments, and take an AI mock interview to boost your Trust Score.',
          is_read: false,
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          user_id: req.user.id,
          type: 'interview',
          title: 'AI Mock Interview Available 🤖',
          message: 'Practice real-time technical questions personalized to your verified skill profile with instant AI scoring.',
          is_read: false,
          created_at: new Date(Date.now() - 7200000).toISOString()
        }
      ];

      for (const notif of welcomeNotifs) {
        const docRef = await db.collection('notifications').add({
          ...notif,
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });
        notifications.push({ id: docRef.id, ...notif });
      }
    }

    // Sort in memory to avoid Firestore missing index error
    notifications = notifications.sort((a, b) => {
      const t1 = a.created_at?.toMillis ? a.created_at.toMillis() : (new Date(a.created_at || 0).getTime());
      const t2 = b.created_at?.toMillis ? b.created_at.toMillis() : (new Date(b.created_at || 0).getTime());
      return t2 - t1;
    }).slice(0, 50).map(n => ({
      ...n,
      created_at: n.created_at?.toDate ? n.created_at.toDate().toISOString() : n.created_at
    }));

    res.json(notifications);
  } catch (err) {
    logger.error('Fetch notifications error:', err);
    res.json([]);
  }
};

const markAsRead = async (req, res) => {
  try {
    await db.collection('notifications').doc(req.params.id).update({
      is_read: true
    });
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
};

const markAllRead = async (req, res) => {
  try {
    const snap = await db.collection('notifications')
      .where('user_id', '==', req.user.id)
      .where('is_read', '==', false)
      .get();

    if (!snap.empty) {
      const batch = db.batch();
      snap.docs.forEach(doc => {
        batch.update(doc.ref, { is_read: true });
      });
      await batch.commit();
    }

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
};

// Helper to send notification (can be used inside controllers)
const sendNotification = async (app, userId, type, title, message, relatedId = null) => {
  try {
    // 1. Save to DB
    const newNotif = {
      user_id: userId,
      type,
      title,
      message,
      related_id: relatedId,
      is_read: false,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('notifications').add(newNotif);
    const savedNotif = { id: docRef.id, ...newNotif };

    // 2. Push via Socket.IO
    const io = app ? app.get('io') : null;
    const connectedUsers = app ? app.get('connectedUsers') : null;

    if (io && connectedUsers && connectedUsers.has(userId)) {
      const socketIds = connectedUsers.get(userId);
      socketIds.forEach(sid => {
        io.to(sid).emit('notification', savedNotif);
      });
      logger.info(`Real-time notification sent to user ${userId}`);
    }

    return savedNotif;
  } catch (err) {
    logger.error('Send notification helper error:', err);
  }
};

module.exports = { getNotifications, markAsRead, markAllRead, sendNotification };
