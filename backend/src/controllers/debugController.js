const logger = require('../utils/logger');
const { query } = require('../config/database');

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
    const tables = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    const usersCols = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
    
    res.json({
      status: 'ok',
      tables: tables.rows.map(r => r.table_name),
      usersColumns: usersCols.rows.map(r => r.column_name)
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = { log, dbCheck };
