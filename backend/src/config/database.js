const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected database error', err);
  process.exit(-1);
});

const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      logger.debug({ query: text.substring(0, 100), duration, rows: res.rowCount });
    }
    return res;
  } catch (err) {
    logger.error({ query: text, error: err.message });
    throw err;
  }
};

const paginate = async (sql, params, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const countSql = `SELECT COUNT(*) FROM (${sql}) AS count_query`;
  const dataSql = `${sql} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  
  const [countRes, dataRes] = await Promise.all([
    query(countSql, params),
    query(dataSql, [...params, limit, offset])
  ]);

  const total = parseInt(countRes.rows[0].count);
  return {
    data: dataRes.rows,
    meta: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    }
  };
};

const getClient = () => pool.connect();

module.exports = { query, paginate, getClient, pool };
