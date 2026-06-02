const axios = require('axios');
const logger = require('./logger');

const githubVerification = {
  analyzeProfile: async (username) => {
    try {
      // 1. Fetch User Info
      const userRes = await axios.get(`https://api.github.com/users/${username}`);
      const userData = userRes.data;

      // 2. Fetch Repos (Public)
      const reposRes = await axios.get(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`);
      const repos = reposRes.data;

      // 3. Analyze Activity & Originality
      let originalCount = 0;
      let forkCount = 0;
      let totalStars = 0;
      const languages = new Set();

      repos.forEach(repo => {
        if (repo.fork) forkCount++;
        else originalCount++;
        totalStars += repo.stargazers_count;
        if (repo.language) languages.add(repo.language);
      });

      const originalityRatio = originalCount / (repos.length || 1);
      
      return {
        username,
        public_repos: userData.public_repos,
        original_repos: originalCount,
        forked_repos: forkCount,
        total_stars: totalStars,
        languages: Array.from(languages),
        originality_ratio: originalityRatio,
        trust_level: originalityRatio > 0.7 ? 'high' : originalityRatio > 0.4 ? 'medium' : 'low'
      };
    } catch (err) {
      logger.error(`GitHub analysis failed for ${username}: ${err.message}`);
      return null;
    }
  }
};

const leetcodeVerification = {
  fetchStats: async (username) => {
    try {
      // LeetCode doesn't have a public REST API, using a GraphQL wrapper or mock for now
      // In production, we'd use a more robust scraper or a dedicated API service
      const query = `
        {
          matchedUser(username: "${username}") {
            submitStats: submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
              }
            }
          }
        }
      `;
      // Note: This is a placeholder. Real LeetCode verification requires a rotating proxy 
      // or a verified API key from a third-party provider.
      return {
        username,
        problems_solved: 150, // Mock data
        ranking: 50000,
        trust_score: 85
      };
    } catch (err) {
      return null;
    }
  }
};

module.exports = { githubVerification, leetcodeVerification };
