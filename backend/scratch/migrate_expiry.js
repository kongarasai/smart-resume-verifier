require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  console.log("Starting migration...");
  try {
    await pool.query(`
      ALTER TABLE assignments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
    `);
    console.log("Migration successful: Added expires_at columns.");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    await pool.end();
  }
}

migrate();
