const logger = require('../utils/logger');
const { db } = require('../config/firebase');

const log = (req, res) => {
  const { level, message, context } = req.body;
  const userStr = req.user ? `${req.user.email} (${req.user.role})` : 'Anonymous';
  
  const logMsg = `[FRONTEND] [${userStr}] ${message}`;
  
  if (level === 'error') logger.error(logMsg, context);
  else if (level === 'warn') logger.warn(logMsg, context);
  else logger.info(logMsg, context);
  
  res.json({ ok: true });
};

const dbCheck = async (req, res) => {
  try {
    const collections = await db.listCollections();
    
    res.json({
      status: 'ok',
      collections: collections.map(c => c.id)
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = { log, dbCheck };
