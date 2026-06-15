const axios = require('axios');
const { db, admin } = require('../config/firebase');
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
    const profileDoc = await db.collection('profiles').doc(req.user.id).get();
    urlToUse = profileDoc.exists ? profileDoc.data().leetcode_url : null;
  }
  if (!urlToUse) return res.status(400).json({ error: 'No LeetCode URL. Add it to your profile first.' });

  if (leetcode_url) {
    await db.collection('profiles').doc(req.user.id).set({
      leetcode_url: leetcode_url,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  const username = extractUsername(urlToUse);
  if (!username) return res.status(400).json({ error: 'Invalid LeetCode URL. Expected: https://leetcode.com/u/username' });

  try {
    const { user, contest } = await fetchProfile(username);
    const parsed = parseStats(user, contest);
    const codingScore = calcCodingScore(parsed);

    const lcData = {
      leetcode_username: username,
      total_solved: parsed.total_solved,
      easy_solved: parsed.easy_solved,
      medium_solved: parsed.medium_solved,
      hard_solved: parsed.hard_solved,
      languages_used: parsed.languages_used,
      contest_rating: parsed.contest_rating,
      ranking: parsed.ranking,
      coding_evidence_score: codingScore,
      extracted_at: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('leetcode_data').doc(req.user.id).set(lcData, { merge: true });

    // Add LeetCode languages as skills
    const batch = db.batch();
    for (const lang of parsed.languages_used.slice(0, 6)) {
      const docRef = db.collection('users').doc(req.user.id).collection('skills').doc(lang.toLowerCase().replace(/[^a-z0-9]/g, '-'));
      batch.set(docRef, { name: lang, source: 'leetcode', verification_level: 'evidence' }, { merge: true });
    }

    batch.set(db.collection('users').doc(req.user.id).collection('progress_events').doc(), {
      event_type: 'leetcode_verified',
      event_title: 'LeetCode Verified',
      event_detail: `${parsed.total_solved} problems solved, ${parsed.languages_used.length} languages`,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();

    // Run cross-source verification
    await runVerification(req.user.id).catch(e => console.error('Verification after LC:', e.message));

    const storedDoc = await db.collection('leetcode_data').doc(req.user.id).get();
    res.json({ ...storedDoc.data(), username, verified: true, contests_attended: parsed.contests_attended, top_percentage: parsed.top_percentage });
  } catch (err) {
    console.error('LC error:', err.message);
    if (err.message.includes('not found')) return res.status(404).json({ error: err.message });
    if (err.code === 'ECONNABORTED') return res.status(504).json({ error: 'LeetCode API timed out. Try again.' });
    res.status(500).json({ error: 'LeetCode verification failed: ' + err.message });
  }
};

const getLeetCodeData = async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const resultDoc = await db.collection('leetcode_data').doc(userId).get();
  const profileDoc = await db.collection('profiles').doc(userId).get();
  const lcUrl = profileDoc.exists ? profileDoc.data().leetcode_url : null;
  const un = lcUrl ? extractUsername(lcUrl) : null;
  res.json(resultDoc.exists ? { ...resultDoc.data(), username: resultDoc.data().leetcode_username || un } : null);
};

module.exports = { verifyLeetCode, getLeetCodeData };
