require('dotenv').config();
const { query } = require('./src/config/database');

async function test() {
  try {
    const sql = `
      SELECT u.id, u.full_name, u.email, u.photo_url,
        p.headline, p.location, p.years_experience, p.github_url, p.leetcode_url,
        p.profile_completeness, p.career_readiness, p.job_readiness_score,
        cs.overall_score, cs.confidence_label, cs.github_score, cs.practice_score,
        cs.coding_evidence_score, cs.project_score,
        gd.total_repos, gd.total_commits,
        ld.total_solved, ld.medium_solved, ld.hard_solved,
        ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as skills
      FROM users u
      JOIN profiles p ON p.user_id = u.id
      LEFT JOIN confidence_scores cs ON cs.user_id = u.id
      LEFT JOIN github_data gd ON gd.user_id = u.id
      LEFT JOIN leetcode_data ld ON ld.user_id = u.id
      LEFT JOIN skills s ON s.user_id = u.id
      WHERE u.role = 'candidate' AND u.is_active = true
      GROUP BY u.id, u.full_name, u.email, u.photo_url, p.headline, p.location,
      p.years_experience, p.github_url, p.leetcode_url, p.profile_completeness, p.career_readiness,
      p.job_readiness_score, cs.overall_score, cs.confidence_label, cs.github_score, cs.practice_score,
      cs.coding_evidence_score, cs.project_score, gd.total_repos, gd.total_commits,
      ld.total_solved, ld.medium_solved, ld.hard_solved
      ORDER BY cs.overall_score DESC NULLS LAST
    `;
    const res = await query(sql);
    console.log("Success! Rows:", res.rows.length);
  } catch(e) {
    console.error("SQL Error:", e.message);
  }
  process.exit(0);
}
test();
