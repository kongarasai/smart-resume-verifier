require('dotenv').config({path: '../.env'});
const { pool, query } = require('../src/config/database');
(async () => {
  try {
    const users = await query("SELECT id FROM users WHERE role='candidate' LIMIT 1");
    const candidateId = users.rows[0].id;
    console.log('Candidate ID:', candidateId);
    
    const req = { user: { id: candidateId }, params: { id: candidateId } };
    
    const [user, profile, github, leetcode, confidence, skillsRes, projects, education, experience, certs, practice, parseResult, hr_eval] = await Promise.all([
      query('SELECT id, full_name, email, photo_url, created_at FROM users WHERE id=$1 AND role=$2', [candidateId, 'candidate']),
      query('SELECT * FROM profiles WHERE user_id=$1', [candidateId]),
      query('SELECT * FROM github_data WHERE user_id=$1', [candidateId]),
      query('SELECT * FROM leetcode_data WHERE user_id=$1', [candidateId]),
      query('SELECT * FROM confidence_scores WHERE user_id=$1', [candidateId]),
      query('SELECT name, source, verification_level, proficiency_level FROM skills WHERE user_id=$1', [candidateId]),
      query('SELECT * FROM projects WHERE user_id=$1', [candidateId]),
      query('SELECT * FROM education WHERE user_id=$1', [candidateId]),
      query('SELECT * FROM experience WHERE user_id=$1', [candidateId]),
      query('SELECT * FROM certificates WHERE user_id=$1', [candidateId]),
      query('SELECT * FROM practice_sessions WHERE user_id=$1 ORDER BY completed_at DESC LIMIT 5', [candidateId]),
      query('SELECT parsed_skills FROM resume_parse_results WHERE user_id=$1', [candidateId]),
      query('SELECT status, notes FROM hr_evaluations WHERE candidate_id=$1 AND hr_id=$2 ORDER BY created_at DESC LIMIT 1', [candidateId, req.user.id]),
    ]);
    console.log('Success! No errors.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
})();
