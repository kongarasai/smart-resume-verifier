require('dotenv').config();
const { pool } = require('../config/database');

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resume_feedback (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          score NUMERIC DEFAULT 0,
          feedback JSONB DEFAULT '{}'::jsonb,
          calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('resume_feedback table created successfully');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
