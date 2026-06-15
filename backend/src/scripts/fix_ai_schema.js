require('dotenv').config();
const { pool } = require('../config/database');

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resume_parse_results (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          raw_text TEXT,
          parsed_skills JSONB DEFAULT '[]'::jsonb,
          parsed_experience JSONB DEFAULT '[]'::jsonb,
          parsed_education JSONB DEFAULT '[]'::jsonb,
          parsed_projects JSONB DEFAULT '[]'::jsonb,
          parsed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS mock_interview_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          overall_score INTEGER DEFAULT 0,
          feedback JSONB DEFAULT '{}'::jsonb,
          questions_count INTEGER DEFAULT 0,
          completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('AI tables created successfully');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
