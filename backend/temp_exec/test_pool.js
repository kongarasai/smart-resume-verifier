require('dotenv').config({path: '../.env'});
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  password: String('837479'),
  max: 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
pool.query('SELECT 1').then(() => {
  console.log('SUCCESS');
  pool.end();
}).catch(err => {
  console.error('ERROR:', err);
  pool.end();
});
