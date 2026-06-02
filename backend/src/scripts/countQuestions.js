require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  // Count by category
  const cats = await pool.query(
    "SELECT category, COUNT(*) as count FROM questions WHERE group_id IS NULL GROUP BY category ORDER BY category"
  );
  console.log('\n=== QUESTIONS BY CATEGORY ===');
  console.table(cats.rows);

  // Coding by language
  const langs = await pool.query(
    "SELECT tags[1] as language, COUNT(*) as count FROM questions WHERE category='coding' AND group_id IS NULL GROUP BY tags[1] ORDER BY tags[1]"
  );
  console.log('\n=== CODING QUESTIONS BY LANGUAGE ===');
  console.table(langs.rows);

  // Total
  const total = await pool.query("SELECT COUNT(*) as total FROM questions WHERE group_id IS NULL");
  console.log('\nTOTAL PUBLIC QUESTIONS:', total.rows[0].total);

  pool.end();
}
run();
