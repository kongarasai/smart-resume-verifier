require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hr_evaluations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        candidate_id UUID REFERENCES users(id) ON DELETE CASCADE,
        hr_id UUID REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'Hold',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS teacher_feedbacks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        candidate_id UUID REFERENCES users(id) ON DELETE CASCADE,
        teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  console.log('Successfully created hr_evaluations and teacher_feedbacks');
  pool.end();
}

run().catch(console.error);
