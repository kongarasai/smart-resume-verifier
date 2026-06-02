const axios = require('axios');
const { query } = require('../config/database');
const { runVerification } = require('./skillVerificationEngine');

const GRAPHQL = 'https://leetcode.com/graphql';

const extractUsername = (url) => {
  if (!url) return null;
  const m = url.match(/leetcode\.com\/(?:u\/)?([^\/\?#]+)/);
  return m ? m[1].trim() : null;
};

const fetchProfile = async (username) => {
  const gqlQuery = `
    query($username: String!) {
      matchedUser(username: $username) {
        username
        submitStats: submitStatsGlobal {
          acSubmissionNum { difficulty count submissions }
        }
        profile { ranking reputation }
        languageProblemCount { languageName problemsSolved }
      }
      userContestRanking(username: $username) {
        rating globalRanking totalParticipants topPercentage attendedContestsCount
      }
    }`;
  const resp = await axios.post(GRAPHQL, { query: gqlQuery, variables: { username } }, {
    headers: { 'Content-Type': 'application/json', 'Referer': 'https://leetcode.com', 'User-Agent': 'Mozilla/5.0' },
    timeout: 15000,
  });
  if (resp.data.errors) throw new Error(resp.data.errors[0]?.message || 'LeetCode API error');
  if (!resp.data.data?.matchedUser) throw new Error(`LeetCode user "${username}" not found`);
  return { user: resp.data.data.matchedUser, contest: resp.data.data.userContestRanking };
};

const parseStats = (user, contest) => {
  const stats = user.submitStats?.acSubmissionNum || [];
  const get = (d) => stats.find(s => s.difficulty === d)?.count || 0;
  const easy = get('Easy'), medium = get('Medium'), hard = get('Hard');
  const total = get('All') || (easy + medium + hard);
  const langs = (user.languageProblemCount || []).sort((a, b) => b.problemsSolved - a.problemsSolved).slice(0, 8).map(l => l.languageName);
  return {
    total_solved: total, easy_solved: easy, medium_solved: medium, hard_solved: hard,
    ranking: user.profile?.ranking || null,
    contest_rating: contest?.rating ? Math.round(contest.rating) : null,
    contest_global_ranking: contest?.globalRanking || null,
    contests_attended: contest?.attendedContestsCount || 0,
    top_percentage: contest?.topPercentage || null,
    languages_used: langs,
  };
};

const calcCodingScore = (d) => {
  let s = 0;
  s += Math.min((d.total_solved || 0) * 0.15, 20);
  s += Math.min((d.medium_solved || 0) * 0.25, 30);
  s += Math.min((d.hard_solved || 0) * 0.5, 25);
  if (d.contest_rating > 1800) s += 15;
  else if (d.contest_rating > 1500) s += 10;
  else if (d.contest_rating > 1200) s += 5;
  if (d.ranking && d.ranking < 10000) s += 5;
  return Math.min(Math.round(s), 100);
};

const verifyLeetCode = async (req, res) => {
  const { leetcode_url } = req.body;
  let urlToUse = leetcode_url;
  if (!urlToUse) {
    const pr = await query('SELECT leetcode_url FROM profiles WHERE user_id=$1', [req.user.id]);
    urlToUse = pr.rows[0]?.leetcode_url;
  }
  if (!urlToUse) return res.status(400).json({ error: 'No LeetCode URL. Add it to your profile first.' });

  if (leetcode_url) {
    await query('UPDATE profiles SET leetcode_url=$1, updated_at=NOW() WHERE user_id=$2', [leetcode_url, req.user.id]);
  }

  const username = extractUsername(urlToUse);
  if (!username) return res.status(400).json({ error: 'Invalid LeetCode URL. Expected: https://leetcode.com/u/username' });

  try {
    const { user, contest } = await fetchProfile(username);
    const parsed = parseStats(user, contest);
    const codingScore = calcCodingScore(parsed);

    await query(
      `INSERT INTO leetcode_data (user_id, leetcode_username, total_solved, easy_solved, medium_solved, hard_solved,
         languages_used, contest_rating, ranking, coding_evidence_score, extracted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         leetcode_username=$2, total_solved=$3, easy_solved=$4, medium_solved=$5, hard_solved=$6,
         languages_used=$7, contest_rating=$8, ranking=$9, coding_evidence_score=$10, extracted_at=NOW()`,
      [req.user.id, username, parsed.total_solved, parsed.easy_solved, parsed.medium_solved, parsed.hard_solved,
       parsed.languages_used, parsed.contest_rating, parsed.ranking, codingScore]
    );

    // Add LeetCode languages as skills
    for (const lang of parsed.languages_used.slice(0, 6)) {
      await query(
        `INSERT INTO skills (user_id, name, source, verification_level) VALUES ($1,$2,'leetcode','evidence')
         ON CONFLICT (user_id, name, source) DO NOTHING`,
        [req.user.id, lang]
      ).catch(() => {});
    }

    await query(
      `INSERT INTO progress_events (user_id, event_type, event_title, event_detail)
       VALUES ($1,'leetcode_verified','LeetCode Verified',$2)`,
      [req.user.id, `${parsed.total_solved} problems solved, ${parsed.languages_used.length} languages`]
    ).catch(() => {});

    // Run cross-source verification
    await runVerification(req.user.id).catch(e => console.error('Verification after LC:', e.message));

    const stored = await query('SELECT * FROM leetcode_data WHERE user_id=$1', [req.user.id]);
    res.json({ ...stored.rows[0], username, verified: true, contests_attended: parsed.contests_attended, top_percentage: parsed.top_percentage });
  } catch (err) {
    console.error('LC error:', err.message);
    if (err.message.includes('not found')) return res.status(404).json({ error: err.message });
    if (err.code === 'ECONNABORTED') return res.status(504).json({ error: 'LeetCode API timed out. Try again.' });
    res.status(500).json({ error: 'LeetCode verification failed: ' + err.message });
  }
};

const getLeetCodeData = async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const result = await query('SELECT * FROM leetcode_data WHERE user_id=$1', [userId]);
  const pr = await query('SELECT leetcode_url FROM profiles WHERE user_id=$1', [userId]);
  const un = pr.rows[0]?.leetcode_url ? extractUsername(pr.rows[0].leetcode_url) : null;
  res.json(result.rows[0] ? { ...result.rows[0], username: result.rows[0].leetcode_username || un } : null);
};

module.exports = { verifyLeetCode, getLeetCodeData };
