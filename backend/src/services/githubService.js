const axios = require('axios');
const { db, admin } = require('../config/firebase');
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
    let githubUrl = req.body?.github_url || req.query?.github_url;
    if (githubUrl) {
      githubUrl = githubUrl.trim();
      if (!githubUrl.includes('github.com')) {
        githubUrl = `https://github.com/${githubUrl.replace(/^@/, '').replace(/^https?:\/\//, '')}`;
      }
      await db.collection('profiles').doc(userId).set({ 
        github_url: githubUrl,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } else {
      const profileDoc = await db.collection('profiles').doc(userId).get();
      githubUrl = profileDoc.exists ? profileDoc.data().github_url : null;
    }
    if (!githubUrl) return res.status(400).json({ error: 'No GitHub URL provided. Please enter your GitHub URL or username.' });

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

    const githubData = {
      github_username: username,
      total_repos: repos.length,
      total_stars: totalStars,
      total_forks: totalForks,
      total_commits: totalCommits,
      languages: langMap,
      top_repos: topRepos,
      followers: userData.followers,
      following: userData.following,
      account_created_at: userData.created_at?.split('T')[0] || null,
      last_active: userData.updated_at?.split('T')[0] || null,
      skill_match_score: skillMatchScore,
      raw_data: { public_repos: userData.public_repos, bio: userData.bio },
      fetched_at: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('github_data').doc(userId).set(githubData, { merge: true });

    // Upsert GitHub language skills
    const batch = db.batch();
    for (const lang of Object.keys(langMap)) {
      const docRef = db.collection('users').doc(userId).collection('skills').doc(lang.toLowerCase().replace(/[^a-z0-9]/g, '-'));
      batch.set(docRef, { name: lang, source: 'github', verification_level: 'evidence' }, { merge: true });
    }

    // Progress event
    batch.set(db.collection('users').doc(userId).collection('progress_events').doc(), {
      event_type: 'github_verified',
      event_title: 'GitHub Verified',
      event_detail: `${repos.length} repos, ${Object.keys(langMap).length} languages detected`,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();

    // Run cross-source verification
    await runVerification(userId).catch(e => console.error('Verification after GitHub:', e.message));

    const storedDoc = await db.collection('github_data').doc(userId).get();
    res.json(storedDoc.data());
  } catch (err) {
    console.error('GitHub error:', err.response?.data || err.message);
    if (err.response?.status === 404) return res.status(404).json({ error: `GitHub user not found. Check the URL in your profile.` });
    if (err.response?.status === 403) return res.status(429).json({ error: 'GitHub API rate limit reached. Try again in an hour or add a GitHub token.' });
    res.status(500).json({ error: 'GitHub verification failed: ' + err.message });
  }
};

const getGitHubData = async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const resultDoc = await db.collection('github_data').doc(userId).get();
  const profileDoc = await db.collection('profiles').doc(userId).get();
  const github_url = profileDoc.exists ? profileDoc.data().github_url : null;
  const username = github_url ? extractUsername(github_url) : null;
  if (resultDoc.exists) {
    res.json({ ...resultDoc.data(), github_url, username: resultDoc.data().github_username || username });
  } else if (github_url) {
    res.json({ github_url, username, not_verified_yet: true });
  } else {
    res.json(null);
  }
};

module.exports = { fetchGitHubData, getGitHubData };
