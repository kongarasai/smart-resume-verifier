const { query, paginate } = require('../config/database');
const logger = require('../utils/logger');

const searchCandidates = async (req, res) => {
  const { skills, min_experience, min_confidence, min_practice_score, has_github, sort_by, order } = req.query;
  const sortBy = sort_by || 'overall_score';
  const sortDir = order === 'asc' ? 'ASC' : 'DESC';

  try {
    let sql = `
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
    `;
    const params = [];

    if (min_experience) { sql += ` AND p.years_experience >= $${params.length + 1}`; params.push(parseInt(min_experience)); }
    if (min_confidence) { sql += ` AND cs.overall_score >= $${params.length + 1}`; params.push(parseInt(min_confidence)); }
    if (min_practice_score) { sql += ` AND cs.practice_score >= $${params.length + 1}`; params.push(parseInt(min_practice_score)); }
    if (has_github === 'true') sql += ` AND p.github_url IS NOT NULL AND p.github_url != ''`;

    sql += ` GROUP BY u.id, u.full_name, u.email, u.photo_url, p.headline, p.location,
      p.years_experience, p.github_url, p.leetcode_url, p.profile_completeness, p.career_readiness,
      p.job_readiness_score, cs.overall_score, cs.confidence_label, cs.github_score, cs.practice_score,
      cs.coding_evidence_score, cs.project_score, gd.total_repos, gd.total_commits,
      ld.total_solved, ld.medium_solved, ld.hard_solved`;

    if (skills) {
      const skillArr = skills.split(',').map(function(s) { return s.trim().toLowerCase(); }).filter(Boolean);
      sql = `SELECT * FROM (${sql}) sub WHERE skills && $${params.length + 1}::text[]`;
      params.push(skillArr);
      sql += ` ORDER BY ${sortBy} ${sortDir} NULLS LAST`;
    } else {
      const validSorts = {
        overall_score: 'cs.overall_score',
        profile_completeness: 'p.profile_completeness',
        years_experience: 'p.years_experience',
        total_solved: 'ld.total_solved',
        practice_score: 'cs.practice_score'
      };
      const col = validSorts[sortBy] || 'cs.overall_score';
      sql += ` ORDER BY ${col} ${sortDir} NULLS LAST`;
    }

    await query(`INSERT INTO activity_logs (user_id, action, details) VALUES ($1, 'hr_viewed_candidates', '{}')`, [req.user.id]).catch(() => {});

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await paginate(sql, params, page, limit);

    // Respect privacy settings (efficient bulk check)
    if (result.data.length > 0) {
      const userIds = result.data.map(r => r.id);
      const privacyRes = await query('SELECT user_id, allow_hr_view FROM privacy_settings WHERE user_id = ANY($1::uuid[])', [userIds]);
      const privacyMap = Object.fromEntries(privacyRes.rows.map(p => [p.user_id, p.allow_hr_view]));
      result.data = result.data.filter(row => privacyMap[row.id] !== false);
    }

    res.json(result);
  } catch (err) {
    logger.error('HR Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
};

const getCandidateDetail = async (req, res) => {
  const candidateId = req.params.id;
  try {
    await query(`INSERT INTO activity_logs (user_id, action, details) VALUES ($1, 'hr_viewed_profile', $2)`,
      [req.user.id, JSON.stringify({ candidate_id: candidateId })]).catch(() => {});

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

    if (!user.rows[0]) return res.status(404).json({ error: 'Candidate not found' });

    // Merge skills visually
    const skillMap = {};
    for (const s of skillsRes.rows) {
      const key = s.name.toLowerCase();
      if (!skillMap[key]) skillMap[key] = { name: s.name, sources: [], verification_level: s.verification_level };
      if (!skillMap[key].sources.includes(s.source)) skillMap[key].sources.push(s.source);
      const levels = ['claimed', 'evidence', 'verified', 'expert'];
      if (levels.indexOf(s.verification_level) > levels.indexOf(skillMap[key].verification_level)) {
        skillMap[key].verification_level = s.verification_level;
      }
    }

    res.json({
      user: user.rows[0], profile: profile.rows[0], github: github.rows[0],
      leetcode: leetcode.rows[0], confidence: confidence.rows[0],
      skills: Object.values(skillMap), projects: projects.rows,
      education: education.rows, experience: experience.rows, certificates: certs.rows,
      recent_practice: practice.rows, resume_skills: parseResult.rows[0]?.parsed_skills || [],
      hiring_status: hr_eval.rows[0] || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load candidate: ' + err.message });
  }
};

const matchRequirements = async (req, res) => {
  const { required_skills, min_experience, technologies } = req.body;
  if (!required_skills || !required_skills.length) {
    return res.status(400).json({ error: 'required_skills array is required' });
  }

  try {
    const candidatesRes = await query(
      `SELECT u.id, u.full_name, p.years_experience, cs.overall_score,
              ARRAY_AGG(JSON_BUILD_OBJECT('name', LOWER(s.name), 'verification', s.verification_level)) as skill_details
       FROM users u
       JOIN profiles p ON p.user_id = u.id
       LEFT JOIN confidence_scores cs ON cs.user_id = u.id
       LEFT JOIN skills s ON s.user_id = u.id
       WHERE u.role='candidate' AND u.is_active=true
       GROUP BY u.id, u.full_name, p.years_experience, cs.overall_score`
    );

    const scored = candidatesRes.rows.map(function(c) {
      const skillDetails = (c.skill_details || []).filter(s => s.name);
      const reqSkills = required_skills.map(s => s.toLowerCase());
      const techSkills = (technologies || []).map(s => s.toLowerCase());

      let totalPoints = 0;
      let maxPoints = reqSkills.length * 3; // 3 points per required skill max
      
      const matched = [];
      const missing = [];

      reqSkills.forEach(req => {
        const detail = skillDetails.find(s => s.name === req);
        if (detail) {
          matched.push(req);
          // Weights: expert: 3, verified: 2, evidence: 1.5, claimed: 1
          const weights = { expert: 3, verified: 2, evidence: 1.5, claimed: 1 };
          totalPoints += weights[detail.verification] || 1;
        } else {
          missing.push(req);
        }
      });

      const skillMatchPct = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
      const techMatched = techSkills.filter(req => skillDetails.some(s => s.name === req));
      const techMatchPct = techSkills.length > 0 ? Math.round((techMatched.length / techSkills.length) * 100) : 100;
      const expMatch = min_experience ? Math.min(((c.years_experience || 0) / min_experience) * 100, 100) : 100;
      
      // Overall Rank Score
      const overallMatch = Math.round(skillMatchPct * 0.6 + techMatchPct * 0.2 + expMatch * 0.2);

      return {
        id: c.id, full_name: c.full_name,
        skill_match: skillMatchPct, tech_match: techMatchPct,
        experience_match: Math.round(expMatch), overall_match: overallMatch,
        confidence_score: c.overall_score || 0,
        matched_skills: matched, missing_skills: missing,
        is_verified_match: skillDetails.some(s => matched.includes(s.name) && ['verified', 'expert'].includes(s.verification))
      };
    });

    scored.sort(function(a, b) { return b.overall_match - a.overall_match || b.confidence_score - a.confidence_score; });
    res.json({ matches: scored.slice(0, 20) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Matching failed: ' + err.message });
  }
};
const shortlistCandidate = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { notes } = req.body;
    const hrId = req.user.id;

    const existing = (await query('SELECT id FROM hr_evaluations WHERE candidate_id=$1 AND hr_id=$2', [candidateId, hrId])).rows[0];
    let result;

    if (existing) {
      result = await query(
        'UPDATE hr_evaluations SET status=$1, notes=$2 WHERE id=$3 RETURNING *',
        ['Shortlist', notes, existing.id]
      );
    } else {
      result = await query(
        'INSERT INTO hr_evaluations (candidate_id, hr_id, status, notes) VALUES ($1, $2, $3, $4) RETURNING *',
        [candidateId, hrId, 'Shortlist', notes]
      );
    }

    const { sendNotification } = require('./notificationController');
    await sendNotification(req.app, candidateId, 'candidate_shortlisted', 'You have been shortlisted!', `An HR from ${req.user.company_name || 'a company'} has shortlisted your profile.`, hrId);

    res.json({ message: "Candidate shortlisted", evaluation: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const removeShortlist = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const hrId = req.user.id;

    await query('DELETE FROM hr_evaluations WHERE candidate_id=$1 AND hr_id=$2', [candidateId, hrId]);

    res.json({ message: "Candidate removed from shortlist" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
const getShortlist = async (req, res) => {
  try {
    const rows = await query(
      `SELECT he.candidate_id, he.status, he.notes, he.created_at, he.updated_at,
              u.full_name, u.email, u.photo_url,
              p.headline, p.location,
              cs.overall_score, cs.confidence_label
       FROM hr_evaluations he
       JOIN users u ON u.id = he.candidate_id
       LEFT JOIN profiles p ON p.user_id = he.candidate_id
       LEFT JOIN confidence_scores cs ON cs.user_id = he.candidate_id
       WHERE he.hr_id=$1 AND LOWER(he.status) IN ('shortlist', 'shortlisted')
       ORDER BY COALESCE(he.updated_at, he.created_at) DESC`,
      [req.user.id]
    );

    res.json({ data: rows.rows });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
const getAnalytics = async (req, res) => {
  try {
    const [skillsDist, statusDist, confidenceAvg, fraudStats, trends] = await Promise.all([
      // 1. Top Skills Distribution
      query(`SELECT LOWER(name) as skill, COUNT(*) as count 
             FROM skills GROUP BY LOWER(name) ORDER BY count DESC LIMIT 8`),
      
      // 2. Hiring Funnel Status
      query(`SELECT status, COUNT(*) as count FROM hr_evaluations GROUP BY status`),
      
      // 3. Average Confidence Score
      query(`SELECT AVG(overall_score) as avg_score FROM confidence_scores`),

      // 4. Fraud Risk Distribution
      query(`SELECT fraud_risk_level as risk, COUNT(*) as count FROM trust_scores GROUP BY fraud_risk_level`),

      // 5. Registration Trends (Last 7 days)
      query(`SELECT DATE_TRUNC('day', created_at) as day, COUNT(*) as count 
             FROM users WHERE role = 'candidate' AND created_at > NOW() - INTERVAL '7 days'
             GROUP BY day ORDER BY day ASC`)
    ]);

    res.json({
      skills: skillsDist.rows,
      funnel: statusDist.rows,
      avg_confidence: Math.round(confidenceAvg.rows[0]?.avg_score || 0),
      fraud_stats: fraudStats.rows,
      trends: trends.rows
    });
  } catch (err) {
    logger.error('HR Analytics error:', err);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
};

module.exports = { 
  searchCandidates, getCandidateDetail, matchRequirements, 
  shortlistCandidate, removeShortlist, getShortlist, getAnalytics 
};
