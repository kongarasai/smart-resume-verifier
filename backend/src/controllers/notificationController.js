const { query } = require('../config/database');
const logger = require('../utils/logger');

const getNotifications = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

const markAsRead = async (req, res) => {
  try {
    await query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
};

const markAllRead = async (req, res) => {
  try {
    await query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
};

// Helper to send notification (can be used inside controllers)
const sendNotification = async (app, userId, type, title, message, relatedId = null) => {
  try {
    // 1. Save to DB
    const result = await query(
      'INSERT INTO notifications (user_id, type, title, message, related_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, type, title, message, relatedId]
    );
    
    // 2. Push via Socket.IO
    const io = app.get('io');
    const connectedUsers = app.get('connectedUsers');
    
    if (io && connectedUsers.has(userId)) {
      const socketIds = connectedUsers.get(userId);
      socketIds.forEach(sid => {
        io.to(sid).emit('notification', result.rows[0]);
      });
      logger.info(`Real-time notification sent to user ${userId}`);
    }
    
    return result.rows[0];
  } catch (err) {
    logger.error('Send notification helper error:', err);
  }
};

module.exports = { getNotifications, markAsRead, markAllRead, sendNotification };
