const { query } = require('../config/database');
const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

const calcCompleteness = (profile, skills, projects, education, certs) => {
  let score = 0;
  if (profile.headline) score += 5;
  if (profile.phone) score += 5;
  if (profile.location) score += 5;
  if (profile.linkedin_url) score += 5;
  if (profile.github_url) score += 15;
  if (profile.leetcode_url) score += 10;
  if (profile.resume_url) score += 15;
  if (skills.length > 0) score += 15;
  if (projects.length > 0) score += 10;
  if (education.length > 0) score += 10;
  if (certs.length > 0) score += 5;
  return Math.min(score, 100);
};

const calcCareerReadiness = (completeness, confidence) => {
  const combined = (completeness * 0.4) + ((confidence || 0) * 0.6);
  if (combined >= 85) return 'top_performer';
  if (combined >= 70) return 'interview_ready';
  if (combined >= 55) return 'job_ready';
  if (combined >= 35) return 'developing';
  return 'beginner';
};

const getProfile = async (req, res) => {
  const userId = req.params.userId || req.user.id;

  // Validate UUID format to prevent database crash on invalid user IDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (req.params.userId && !uuidRegex.test(userId)) {
    return res.status(400).json({ error: 'Invalid user ID format' });
  }

  // Privacy check for non-owners
  if (userId !== req.user.id) {
    const privacyRes = await query('SELECT * FROM privacy_settings WHERE user_id=$1', [userId]);
    const privacy = privacyRes.rows[0];
    if (privacy) {
      if (req.user.role === 'hr' && !privacy.allow_hr_view) {
        return res.status(403).json({ error: 'This candidate has restricted HR access' });
      }
      if (req.user.role === 'mentor' && !privacy.allow_mentor_view) {
        return res.status(403).json({ error: 'This candidate has restricted mentor access' });
      }
      // Teachers and Admin bypass privacy for verification purposes
    }
  }

  try {
    console.log(`Fetching profile for user: ${userId}`);
    const [profileRes, skillsRes, projectsRes, eduRes, expRes, certRes, platformsRes, confidenceRes, privacyRes, hrEvalRes] = await Promise.all([
      query('SELECT p.*, u.full_name, u.email, u.photo_url FROM profiles p JOIN users u ON u.id = p.user_id WHERE p.user_id = $1', [userId]),
      query('SELECT * FROM skills WHERE user_id = $1 ORDER BY name ASC', [userId]),
      query('SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
      query('SELECT * FROM education WHERE user_id = $1 ORDER BY end_year DESC', [userId]),
      query('SELECT * FROM experience WHERE user_id = $1 ORDER BY start_date DESC', [userId]),
      query('SELECT * FROM certificates WHERE user_id = $1 ORDER BY issue_date DESC', [userId]),
      query('SELECT * FROM coding_platforms WHERE user_id = $1', [userId]),
      query('SELECT * FROM confidence_scores WHERE user_id=$1', [userId]),
      query('SELECT * FROM privacy_settings WHERE user_id=$1', [userId]),
      query(`
        SELECT he.*, u.full_name as hr_name, u.photo_url as hr_photo 
        FROM hr_evaluations he 
        LEFT JOIN users u ON u.id = he.hr_id 
        WHERE he.candidate_id = $1::uuid 
        ORDER BY he.created_at DESC
      `, [userId]),
    ]);

    console.log(`Found ${hrEvalRes.rows.length} HR evaluations for user ${userId}`);

    if (!profileRes.rows[0]) return res.status(404).json({ error: 'Profile not found' });

    // Merge skills visually: group by name across sources
    const skillMap = {};
    for (const s of skillsRes.rows) {
      const key = s.name.toLowerCase();
      if (!skillMap[key]) {
        skillMap[key] = { name: s.name, sources: [], verification_level: s.verification_level, proficiency_level: s.proficiency_level, ids: [] };
      }
      skillMap[key].sources.push(s.source);
      skillMap[key].ids.push(s.id);
      // Upgrade verification level
      const levels = ['claimed', 'evidence', 'verified', 'strong_verified', 'expert'];
      const current = levels.indexOf(skillMap[key].verification_level);
      const incoming = levels.indexOf(s.verification_level);
      if (incoming > current) skillMap[key].verification_level = s.verification_level;
    }
    const mergedSkills = Object.values(skillMap);

    res.json({
      profile: profileRes.rows[0],
      skills: mergedSkills,
      raw_skills: skillsRes.rows,
      projects: projectsRes.rows,
      education: eduRes.rows,
      experience: expRes.rows,
      certificates: certRes.rows,
      platforms: platformsRes.rows,
      confidence: confidenceRes.rows[0] || null,
      privacy: privacyRes.rows[0] || null,
      hiring_status: hrEvalRes.rows || [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load profile: ' + err.message });
  }
};

const updateProfile = async (req, res) => {
  const { headline, phone, location, bio, linkedin_url, github_url, leetcode_url, years_experience } = req.body;
  try {
    // Ensure profile row exists
    await query('INSERT INTO profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [req.user.id]);
    // Ensure privacy row exists
    await query('INSERT INTO privacy_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [req.user.id]);

    await query(
      `UPDATE profiles SET headline=$1, phone=$2, location=$3, bio=$4, linkedin_url=$5,
       github_url=$6, leetcode_url=$7, years_experience=$8, updated_at=NOW() WHERE user_id=$9`,
      [headline, phone, location, bio, linkedin_url, github_url, leetcode_url, years_experience || 0, req.user.id]
    );

    // Recalculate completeness
    const [p, s, pr, e, c, conf] = await Promise.all([
      query('SELECT * FROM profiles WHERE user_id=$1', [req.user.id]),
      query('SELECT id FROM skills WHERE user_id=$1', [req.user.id]),
      query('SELECT id FROM projects WHERE user_id=$1', [req.user.id]),
      query('SELECT id FROM education WHERE user_id=$1', [req.user.id]),
      query('SELECT id FROM certificates WHERE user_id=$1', [req.user.id]),
      query('SELECT overall_score FROM confidence_scores WHERE user_id=$1', [req.user.id]),
    ]);
    const completeness = calcCompleteness(p.rows[0], s.rows, pr.rows, e.rows, c.rows);
    const careerReadiness = calcCareerReadiness(completeness, conf.rows[0]?.overall_score);
    await query('UPDATE profiles SET profile_completeness=$1, career_readiness=$2 WHERE user_id=$3',
      [completeness, careerReadiness, req.user.id]);

    // Progress timeline event
    await query(
      `INSERT INTO progress_events (user_id, event_type, event_title, event_detail)
       VALUES ($1,'profile_updated','Profile Updated','Profile information saved successfully')`,
      [req.user.id]
    ).catch(() => {});

    res.json({ message: 'Profile updated', completeness, career_readiness: careerReadiness });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed: ' + err.message });
  }
};

const uploadPhoto = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });
  const photoUrl = `/uploads/photos/${req.file.filename}`;
  try {
    await query('UPDATE users SET photo_url=$1, updated_at=NOW() WHERE id=$2', [photoUrl, req.user.id]);
    res.json({ message: 'Photo uploaded', photoUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save photo' });
  }
};

const uploadResume = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded. Please select a PDF file.' });

  const ext = path.extname(req.file.originalname).toLowerCase();
  if (!['.pdf', '.doc', '.docx'].includes(ext)) {
    return res.status(400).json({ error: 'Invalid file type. Please upload a PDF, DOC, or DOCX file.' });
  }

  const resumeUrl = `/uploads/resumes/${req.file.filename}`;
  const fullPath = path.join(UPLOADS_DIR, 'resumes', req.file.filename);

  // Verify file actually exists on disk
  if (!fs.existsSync(fullPath)) {
    return res.status(500).json({ error: 'File upload failed — file not saved to disk. Check server storage configuration.' });
  }

  try {
    await query(
      'UPDATE profiles SET resume_url=$1, resume_filename=$2, updated_at=NOW() WHERE user_id=$3',
      [resumeUrl, req.file.originalname, req.user.id]
    );
    await query(
      `INSERT INTO progress_events (user_id, event_type, event_title, event_detail)
       VALUES ($1, 'resume_uploaded', 'Resume Uploaded', $2)`,
      [req.user.id, req.file.originalname]
    ).catch(() => {});
    res.json({ message: 'Resume uploaded successfully', resumeUrl, filename: req.file.originalname });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record resume: ' + err.message });
  }
};

// Skills CRUD
const addSkill = async (req, res) => {
  const { name, source = 'manual', proficiency_level } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Skill name required' });
  try {
    const result = await query(
      `INSERT INTO skills (user_id, name, source, proficiency_level, verification_level)
       VALUES ($1, $2, $3, $4, 'claimed')
       ON CONFLICT (user_id, name, source) DO UPDATE
       SET proficiency_level=EXCLUDED.proficiency_level
       RETURNING *`,
      [req.user.id, name.trim(), source, proficiency_level]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add skill: ' + err.message });
  }
};

const deleteSkill = async (req, res) => {
  await query('DELETE FROM skills WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ message: 'Skill removed' });
};

// Projects CRUD
const addProject = async (req, res) => {
  const { title, description, project_url, github_url, technologies } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Project title required' });
  try {
    const result = await query(
      'INSERT INTO projects (user_id, title, description, project_url, github_url, technologies, source) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [req.user.id, title, description, project_url, github_url, technologies || [], 'manual']
    );
    await query(
      `INSERT INTO progress_events (user_id, event_type, event_title, event_detail)
       VALUES ($1, 'project_added', 'Project Added', $2)`,
      [req.user.id, title]
    ).catch(() => {});
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add project' });
  }
};

const deleteProject = async (req, res) => {
  await query('DELETE FROM projects WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ message: 'Project deleted' });
};

// Education
const addEducation = async (req, res) => {
  const { institution, degree, field_of_study, start_year, end_year, grade } = req.body;
  try {
    const result = await query(
      'INSERT INTO education (user_id, institution, degree, field_of_study, start_year, end_year, grade) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [req.user.id, institution, degree, field_of_study, start_year || null, end_year || null, grade]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add education' });
  }
};

const deleteEducation = async (req, res) => {
  await query('DELETE FROM education WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ message: 'Deleted' });
};

// Experience
const addExperience = async (req, res) => {
  const { company, role, start_date, end_date, is_current, description, technologies } = req.body;
  try {
    const result = await query(
      'INSERT INTO experience (user_id, company, role, start_date, end_date, is_current, description, technologies) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [req.user.id, company, role, start_date || null, end_date || null, is_current, description, technologies || []]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add experience' });
  }
};

const deleteExperience = async (req, res) => {
  await query('DELETE FROM experience WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ message: 'Deleted' });
};

// Certificates
const addCertificate = async (req, res) => {
  const { name, issuer, issue_date, expiry_date, credential_url } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Certificate name required' });
  try {
    const result = await query(
      'INSERT INTO certificates (user_id, name, issuer, issue_date, expiry_date, credential_url) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.user.id, name, issuer, issue_date || null, expiry_date || null, credential_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add certificate' });
  }
};

const deleteCertificate = async (req, res) => {
  await query('DELETE FROM certificates WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ message: 'Deleted' });
};

// Platform
const addPlatform = async (req, res) => {
  const { platform, profile_url, username } = req.body;
  if (!platform?.trim()) return res.status(400).json({ error: 'Platform required' });
  try {
    const result = await query(
      'INSERT INTO coding_platforms (user_id, platform, profile_url, username) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.user.id, platform, profile_url, username]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add platform' });
  }
};

// Privacy settings
const updatePrivacy = async (req, res) => {
  const { allow_hr_view, allow_mentor_view, public_profile, show_skills_public, show_github, show_leetcode } = req.body;
  try {
    await query(
      `INSERT INTO privacy_settings (user_id, allow_hr_view, allow_mentor_view, public_profile, show_skills_public, show_github, show_leetcode, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
       ON CONFLICT (user_id) DO UPDATE SET
       allow_hr_view=$2, allow_mentor_view=$3, public_profile=$4,
       show_skills_public=$5, show_github=$6, show_leetcode=$7, updated_at=NOW()`,
      [req.user.id, allow_hr_view, allow_mentor_view, public_profile, show_skills_public, show_github, show_leetcode]
    );
    res.json({ message: 'Privacy settings updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update privacy settings' });
  }
};

// Progress timeline
const getTimeline = async (req, res) => {
  const userId = req.params.userId || req.user.id;
  try {
    const result = await query(
      'SELECT * FROM progress_events WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load timeline' });
  }
};

// HR Profile management
const getHRProfile = async (req, res) => {
  try {
    const [userRes, hrRes] = await Promise.all([
      query('SELECT id, full_name, email, photo_url FROM users WHERE id=$1', [req.user.id]),
      query('SELECT * FROM hr_profiles WHERE user_id=$1', [req.user.id]),
    ]);
    res.json({ user: userRes.rows[0], hr_profile: hrRes.rows[0] || {} });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load HR profile' });
  }
};

const updateHRProfile = async (req, res) => {
  const { company_name, designation, company_website, linkedin_url, hiring_interests } = req.body;
  try {
    await query(
      `INSERT INTO hr_profiles (user_id, company_name, designation, company_website, linkedin_url, hiring_interests, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())
       ON CONFLICT (user_id) DO UPDATE SET
       company_name=$2, designation=$3, company_website=$4, linkedin_url=$5, hiring_interests=$6, updated_at=NOW()`,
      [req.user.id, company_name, designation, company_website, linkedin_url, hiring_interests || []]
    );
    res.json({ message: 'HR profile updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update HR profile' });
  }
};

const updateAvailability = async (req, res) => {
  const { availability } = req.body;

  try {
    await query(
      'UPDATE profiles SET availability=$1, updated_at=NOW() WHERE user_id=$2',
      [availability, req.user.id]
    );

    res.json({ message: 'Availability updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update availability' });
  }
};
module.exports = {
  getProfile, updateProfile, uploadPhoto, uploadResume,
  addSkill, deleteSkill, addProject, deleteProject,
  addEducation, deleteEducation, addExperience, deleteExperience,
  addCertificate, deleteCertificate, addPlatform,
  updatePrivacy, updateAvailability, getTimeline,
  getHRProfile, updateHRProfile,
};
