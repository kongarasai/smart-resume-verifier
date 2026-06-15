require('dotenv').config();
const { query } = require('../config/database');
const { db } = require('../config/firebase');

async function migrate() {
  console.log('Migrating GitHub Data...');
  const gh = await query('SELECT * FROM github_data');
  for (const row of gh.rows) {
    await db.collection('github_data').doc(row.user_id).set({
      github_username: row.github_username,
      total_repos: row.total_repos,
      total_stars: row.total_stars,
      total_forks: row.total_forks,
      total_commits: row.total_commits,
      languages: typeof row.languages === 'string' ? JSON.parse(row.languages) : row.languages,
      top_repos: typeof row.top_repos === 'string' ? JSON.parse(row.top_repos) : row.top_repos,
      followers: row.followers,
      following: row.following,
      account_created_at: row.account_created_at,
      last_active: row.last_active,
      skill_match_score: row.skill_match_score,
      raw_data: typeof row.raw_data === 'string' ? JSON.parse(row.raw_data) : row.raw_data,
      fetched_at: row.fetched_at || new Date()
    }, { merge: true });
    console.log(`Migrated GitHub data for ${row.user_id}`);
  }

  console.log('Migrating LeetCode Data...');
  const lc = await query('SELECT * FROM leetcode_data');
  for (const row of lc.rows) {
    await db.collection('leetcode_data').doc(row.user_id).set({
      leetcode_username: row.leetcode_username,
      total_solved: row.total_solved,
      easy_solved: row.easy_solved,
      medium_solved: row.medium_solved,
      hard_solved: row.hard_solved,
      languages_used: typeof row.languages_used === 'string' ? JSON.parse(row.languages_used) : row.languages_used,
      contest_rating: row.contest_rating,
      ranking: row.ranking,
      coding_evidence_score: row.coding_evidence_score,
      extracted_at: row.extracted_at || new Date()
    }, { merge: true });
    console.log(`Migrated LeetCode data for ${row.user_id}`);
  }
  console.log('Done!');
  process.exit(0);
}

migrate().catch(console.error);
