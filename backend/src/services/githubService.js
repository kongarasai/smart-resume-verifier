const axios = require('axios');
const { query } = require('../config/database');
const { runVerification } = require('./skillVerificationEngine');

const GITHUB_API = 'https://api.github.com';
const getHeaders = () => {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'SmartResumeVerifier/2.0',
  };
  const token = process.env.GITHUB_TOKEN;
  if (token && token !== 'ghp_test_token_12345' && !token.startsWith('ghp_your_') && token.trim() !== '') {
    headers.Authorization = `token ${token}`;
  }
  return headers;
};

const githubGet = async (url) => {
  const headers = getHeaders();
  try {
    return await axios.get(url, { headers, timeout: 10000 });
  } catch (err) {
    if (err.response?.status === 401 && headers.Authorization) {
      console.warn('GitHub API returned 401 with token. Retrying without token...');
      const cleanHeaders = { ...headers };
      delete cleanHeaders.Authorization;
      return await axios.get(url, { headers: cleanHeaders, timeout: 10000 });
    }
    throw err;
  }
};

const extractUsername = (url) => {
  if (!url) return null;
  const m = url.match(/github\.com\/([^\/\?#]+)/);
  return m ? m[1].trim() : null;
};

const calcGitHubScore = ({ repos, stars, commits, languages, followers, ageYears }) => {
  let s = 0;
  s += Math.min(repos * 2, 25);
  s += Math.min(stars * 2, 20);
  s += Math.min(commits * 2, 25);
  s += Math.min(Object.keys(languages).length * 3, 15);
  s += Math.min(Math.floor(ageYears) * 2, 10);
  s += Math.min(followers, 5);
  return Math.min(Math.round(s), 100);
};

const fetchGitHubData = async (req, res) => {
  const userId = req.params.userId || req.user.id;
  try {
    const profileRes = await query('SELECT github_url FROM profiles WHERE user_id=$1', [userId]);
    const githubUrl = profileRes.rows[0]?.github_url;
    if (!githubUrl) return res.status(400).json({ error: 'No GitHub URL in profile. Add your GitHub URL first.' });

    const username = extractUsername(githubUrl);
    if (!username) return res.status(400).json({ error: 'Invalid GitHub URL format. Expected: https://github.com/username' });

    const [userResp, reposResp] = await Promise.all([
      githubGet(`${GITHUB_API}/users/${username}`),
      githubGet(`${GITHUB_API}/users/${username}/repos?per_page=100&sort=updated`),
    ]);

    const userData = userResp.data;
    const repos = reposResp.data;

    const langMap = {};
    let totalStars = 0, totalForks = 0;
    const topRepos = [];
    let originalRepoCount = 0;

    for (const repo of repos) {
      // 🚨 Exclude forked repositories (Originality Check)
      if (repo.fork) continue;
      
      originalRepoCount += 1;
      totalStars += repo.stargazers_count;
      totalForks += repo.forks_count;
      if (repo.language) langMap[repo.language] = (langMap[repo.language] || 0) + 1;
      if (topRepos.length < 6) topRepos.push({
        name: repo.name, description: repo.description, language: repo.language,
        stars: repo.stargazers_count, url: repo.html_url, updated_at: repo.updated_at,
      });
    }

    let totalCommits = 0;
    let pushEventsCount = 0;
    try {
      // 🚨 Check commit frequency / recent events
      const evRes = await githubGet(`${GITHUB_API}/users/${username}/events?per_page=100`);
      const pushEvents = evRes.data.filter(e => e.type === 'PushEvent');
      pushEventsCount = pushEvents.length;
      totalCommits = pushEvents.reduce((s, e) => s + (e.payload?.commits?.length || 0), 0);
    } catch {}

    const ageYears = (Date.now() - new Date(userData.created_at)) / (1000 * 60 * 60 * 24 * 365);
    // Score uses originalRepoCount + frequency context (pushEventsCount)
    // Max 100
    const calcGitHubScoreEnhanced = ({ originalRepos, stars, commits, pushEnvCnt, languages, followers, ageYears }) => {
       let s = 0;
       s += Math.min(originalRepos * 3, 30); // Heavily weigh original non-forked repos
       s += Math.min(stars * 2, 20);
       // Commit freq (recent pushes) and commits
       s += Math.min((commits * 1.5) + (pushEnvCnt * 2), 25);
       s += Math.min(Object.keys(languages).length * 3, 10);
       s += Math.min(Math.floor(ageYears) * 2, 10);
       s += Math.min(followers, 5);
       return Math.min(Math.round(s), 100);
    };

    const skillMatchScore = calcGitHubScoreEnhanced({ originalRepos: originalRepoCount, stars: totalStars, commits: totalCommits, pushEnvCnt: pushEventsCount, languages: langMap, followers: userData.followers, ageYears });

    await query(
      `INSERT INTO github_data (user_id, github_username, total_repos, total_stars, total_forks, total_commits,
         languages, top_repos, followers, following, account_created_at, last_active, skill_match_score, raw_data, fetched_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         github_username=$2, total_repos=$3, total_stars=$4, total_forks=$5, total_commits=$6,
         languages=$7, top_repos=$8, followers=$9, following=$10, account_created_at=$11,
         last_active=$12, skill_match_score=$13, raw_data=$14, fetched_at=NOW()`,
      [userId, username, repos.length, totalStars, totalForks, totalCommits,
       JSON.stringify(langMap), JSON.stringify(topRepos), userData.followers, userData.following,
       userData.created_at?.split('T')[0], userData.updated_at?.split('T')[0],
       skillMatchScore, JSON.stringify({ public_repos: userData.public_repos, bio: userData.bio })]
    );

    // Upsert GitHub language skills
    for (const lang of Object.keys(langMap)) {
      await query(
        `INSERT INTO skills (user_id, name, source, verification_level) VALUES ($1,$2,'github','evidence')
         ON CONFLICT (user_id, name, source) DO NOTHING`,
        [userId, lang]
      ).catch(() => {});
    }

    // Progress event
    await query(
      `INSERT INTO progress_events (user_id, event_type, event_title, event_detail)
       VALUES ($1,'github_verified','GitHub Verified',$2)`,
      [userId, `${repos.length} repos, ${Object.keys(langMap).length} languages detected`]
    ).catch(() => {});

    // Run cross-source verification
    await runVerification(userId).catch(e => console.error('Verification after GitHub:', e.message));

    const stored = await query('SELECT * FROM github_data WHERE user_id=$1', [userId]);
    res.json(stored.rows[0]);
  } catch (err) {
    console.error('GitHub error:', err.response?.data || err.message);
    if (err.response?.status === 404) return res.status(404).json({ error: `GitHub user not found. Check the URL in your profile.` });
    if (err.response?.status === 403) return res.status(429).json({ error: 'GitHub API rate limit reached. Try again in an hour or add a GitHub token.' });
    res.status(500).json({ error: 'GitHub verification failed: ' + err.message });
  }
};

const getGitHubData = async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const result = await query('SELECT * FROM github_data WHERE user_id=$1', [userId]);
  const profileRes = await query('SELECT github_url FROM profiles WHERE user_id=$1', [userId]);
  const ghUrl = profileRes.rows[0]?.github_url;
  const username = ghUrl ? extractUsername(ghUrl) : null;
  res.json(result.rows[0] ? { ...result.rows[0], username } : null);
};

module.exports = { fetchGitHubData, getGitHubData };
