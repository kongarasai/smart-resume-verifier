require('dotenv').config();
const { query } = require('./src/config/database');

async function test() {
  const userId = '4f8fbed5-47fe-4bd7-abf0-5c2e828b116d'; // Yagami's ID
  try {
    console.log(`Testing query for userId: ${userId}`);
    const hrEvalRes = await query(`
        SELECT he.*, u.full_name as hr_name, u.photo_url as hr_photo 
        FROM hr_evaluations he 
        LEFT JOIN users u ON u.id = he.hr_id 
        WHERE he.candidate_id = $1::uuid 
        ORDER BY he.created_at DESC
      `, [userId]);
    
    console.log(`Found ${hrEvalRes.rows.length} rows`);
    console.log('Data:', hrEvalRes.rows);
  } catch (err) {
    console.error('Query failed:', err);
  } finally {
    process.exit();
  }
}

test();
