/**
 * Skill Verification Engine
 * -------------------------
 * Matches skills across ALL evidence sources and computes
 * verification levels based on how many sources confirm each skill.
 *
 * Levels:
 *   claimed        - resume only
 *   evidence       - resume + 1 other source (github OR leetcode)
 *   verified       - resume + practice  OR  resume + github + leetcode
 *   strong_verified - 3+ sources (resume + github + practice, etc.)
 */

const { query } = require('../config/database');

// Canonical skill name normalizer
const normalise = (s) => s.toLowerCase().trim()
  .replace(/\bnode\.js\b/g, 'nodejs')
  .replace(/\bc\+\+\b/g, 'cpp')
  .replace(/\brest api\b/g, 'rest')
  .replace(/\bci\/cd\b/g, 'cicd');

const LEVEL_ORDER = ['claimed', 'evidence', 'verified', 'strong_verified'];

const deriveLevel = (src) => {
  const cnt = [src.has_resume, src.has_github, src.has_leetcode, src.has_practice, src.has_project]
    .filter(Boolean).length;

  if (cnt >= 3) return 'strong_verified';
  if (src.has_resume && (src.has_github || src.has_leetcode) && src.has_practice) return 'strong_verified';
  if (src.has_resume && src.has_practice) return 'verified';
  if (src.has_resume && (src.has_github || src.has_leetcode || src.has_project)) return 'evidence';
  if (cnt >= 2 && !src.has_resume) return 'evidence'; // cross-source without resume still counts
  if (cnt >= 1) return 'claimed';
  return 'claimed';
};

/**
 * Full re-verification for a user. Called after:
 * - Resume parsed
 * - GitHub verified
 * - LeetCode verified
 * - Practice answer submitted (correct)
 * - Project added
 */
const runVerification = async (userId) => {
  // ── 1. Gather all skill evidence ──
  const [resumeSkills, githubData, leetcodeData, practiceSkills, projectSkills] = await Promise.all([
    query("SELECT DISTINCT LOWER(name) as name FROM skills WHERE user_id=$1 AND source='resume'", [userId]),
    query('SELECT languages FROM github_data WHERE user_id=$1', [userId]),
    query('SELECT languages_used FROM leetcode_data WHERE user_id=$1', [userId]),
    query(`SELECT DISTINCT LOWER(t.tag) as name
           FROM practice_attempts pa
           JOIN questions q ON q.id = pa.question_id
           CROSS JOIN LATERAL unnest(q.tags) as t(tag)
           WHERE pa.user_id=$1 AND (pa.is_correct=TRUE OR q.question_type='code')`, [userId]),
    query('SELECT technologies FROM projects WHERE user_id=$1', [userId]),
  ]);

  const resume = new Set(resumeSkills.rows.map(r => normalise(r.name)));

  // GitHub languages map
  const ghLangs = githubData.rows[0]?.languages || {};
  const github = new Set(Object.keys(ghLangs).map(l => normalise(l)));

  // LeetCode languages
  const lcLangs = leetcodeData.rows[0]?.languages_used || [];
  const leetcode = new Set(lcLangs.map(l => normalise(l)));

  // Practice (tags from correct answers)
  const practice = new Set(practiceSkills.rows.map(r => normalise(r.name)));

  // Project technologies
  const projectTechs = new Set();
  for (const proj of projectSkills.rows) {
    (proj.technologies || []).forEach(t => projectTechs.add(normalise(t)));
  }

  // ── 2. Union of all known skills ──
  const allSkills = new Set([...resume, ...github, ...leetcode, ...practice, ...projectTechs]);

  // ── 3. Build verification map ──
  const verifications = {};
  for (const skill of allSkills) {
    verifications[skill] = {
      skill_name: skill,
      has_resume: resume.has(skill),
      has_github: github.has(skill),
      has_leetcode: leetcode.has(skill),
      has_practice: practice.has(skill),
      has_project: projectTechs.has(skill),
      source_count: 0,
    };
    const v = verifications[skill];
    v.source_count = [v.has_resume, v.has_github, v.has_leetcode, v.has_practice, v.has_project].filter(Boolean).length;
    v.verification_level = deriveLevel(v);
  }

  // ── 4. Upsert skill_verifications table ──
  for (const [skillName, v] of Object.entries(verifications)) {
    await query(
      `INSERT INTO skill_verifications
         (user_id, skill_name, has_resume, has_github, has_leetcode, has_practice, has_project, source_count, verification_level, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
       ON CONFLICT (user_id, skill_name) DO UPDATE SET
         has_resume=$3, has_github=$4, has_leetcode=$5, has_practice=$6, has_project=$7,
         source_count=$8, verification_level=$9, updated_at=NOW()`,
      [userId, skillName, v.has_resume, v.has_github, v.has_leetcode, v.has_practice, v.has_project, v.source_count, v.verification_level]
    );

    // Keep skills table in sync — upsert each verified source
    if (v.has_resume) await upsertSkill(userId, skillName, 'resume', v.verification_level);
    if (v.has_github) await upsertSkill(userId, skillName, 'github', v.verification_level);
    if (v.has_leetcode) await upsertSkill(userId, skillName, 'leetcode', v.verification_level);
    if (v.has_practice) await upsertSkill(userId, skillName, 'practice', v.verification_level);
  }

  // ── 5. Return summary ──
  const counts = { claimed: 0, evidence: 0, verified: 0, strong_verified: 0, total: allSkills.size };
  for (const v of Object.values(verifications)) counts[v.verification_level]++;
  return { verifications, counts };
};

const upsertSkill = async (userId, name, source, verificationLevel) => {
  await query(
    `INSERT INTO skills (user_id, name, source, verification_level)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (user_id, name, source) DO UPDATE SET verification_level=$4`,
    [userId, name, source, verificationLevel]
  ).catch(() => {});
};

// API: get verification summary for a user
const getVerificationSummary = async (req, res) => {
  const userId = req.params.userId || req.user.id;
  try {
    const result = await query(
      `SELECT skill_name, has_resume, has_github, has_leetcode, has_practice, has_project,
              source_count, verification_level
       FROM skill_verifications WHERE user_id=$1
       ORDER BY source_count DESC, skill_name ASC`,
      [userId]
    );
    // Counts
    const counts = { claimed: 0, evidence: 0, verified: 0, strong_verified: 0, total: result.rowCount };
    result.rows.forEach(r => {
      const level = r.verification_level;
      if (level === 'strong_verified') {
        counts.strong_verified++;
        counts.verified++;
        counts.evidence++;
        counts.claimed++;
      } else if (level === 'verified') {
        counts.verified++;
        counts.evidence++;
        counts.claimed++;
      } else if (level === 'evidence') {
        counts.evidence++;
        counts.claimed++;
      } else if (level === 'claimed') {
        counts.claimed++;
      }
    });
    res.json({ skills: result.rows, counts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load verification data' });
  }
};

// API: trigger full re-verification
const triggerVerification = async (req, res) => {
  const userId = req.params.userId || req.user.id;
  try {
    const result = await runVerification(userId);
    res.json({ message: 'Verification complete', counts: result.counts });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: 'Verification failed: ' + err.message });
  }
};

// API: get evidence for a specific skill (for modal)
const getSkillEvidence = async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const skillName = req.params.skillName;
  const norm = normalise(skillName);
  try {
    const [verRes, ghRes, lcRes, projRes, practRes] = await Promise.all([
      query('SELECT * FROM skill_verifications WHERE user_id=$1 AND skill_name=$2', [userId, norm]),
      query("SELECT total_repos, top_repos, languages FROM github_data WHERE user_id=$1", [userId]),
      query("SELECT total_solved, languages_used FROM leetcode_data WHERE user_id=$1", [userId]),
      query("SELECT title, github_url, project_url FROM projects WHERE user_id=$1 AND $2=ANY(SELECT LOWER(t) FROM unnest(technologies) t)", [userId, norm]),
      query(`SELECT COUNT(*) as correct_count FROM practice_attempts pa
             JOIN questions q ON q.id=pa.question_id
             WHERE pa.user_id=$1 AND (pa.is_correct=TRUE OR q.question_type='code') AND $2=ANY(SELECT LOWER(t) FROM unnest(q.tags) t)`,
        [userId, norm]),
    ]);

    const ghData = ghRes.rows[0] || {};
    const ghLangs = ghData.languages || {};

    res.json({
      skill: norm,
      verification: verRes.rows[0] || null,
      evidence: {
        github: {
          repo_count: ghLangs[skillName] || ghLangs[skillName.charAt(0).toUpperCase() + skillName.slice(1)] || 0,
          top_repos: (ghData.top_repos || []).filter(r => r.language?.toLowerCase() === norm).slice(0, 3),
        },
        leetcode: {
          languages: lcRes.rows[0]?.languages_used || [],
          solved: lcRes.rows[0]?.total_solved || 0,
        },
        projects: projRes.rows,
        practice: { correct_answers: parseInt(practRes.rows[0]?.correct_count || 0) },
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load skill evidence: ' + err.message });
  }
};

module.exports = { runVerification, getVerificationSummary, triggerVerification, getSkillEvidence, normalise };
