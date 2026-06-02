const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');
const { runVerification } = require('./skillVerificationEngine');

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

const SKILLS_DICT = [
  'javascript','typescript','python','java','c++','c#','golang','rust','ruby','php','swift','kotlin',
  'react','angular','vue','nextjs','nodejs','node.js','express','nestjs','django','flask','fastapi',
  'spring','spring boot','laravel','postgresql','mysql','mongodb','redis','elasticsearch','cassandra',
  'dynamodb','sqlite','oracle','docker','kubernetes','aws','azure','gcp','terraform','ansible',
  'jenkins','ci/cd','git','github','gitlab','machine learning','deep learning','tensorflow','pytorch',
  'scikit-learn','nlp','computer vision','html','css','tailwind','bootstrap','graphql','rest api',
  'microservices','kafka','rabbitmq','grpc','linux','bash','devops','agile','scrum','figma',
  'data structures','algorithms','sql','nosql','hadoop','spark','tableau','power bi','excel',
  'android','ios','flutter','react native','hibernate','maven','gradle','nginx','oauth','jwt',
  'security','blockchain','solidity','unity','opencv','pandas','numpy','selenium','jest',
];

// Extract URLs from resume text
const extractURLs = (text) => {
  const urls = { github: null, linkedin: null, leetcode: null, portfolio: [] };

  const ghMatch = text.match(/github\.com\/([^\s\n\)'"]+)/i);
  if (ghMatch) urls.github = `https://github.com/${ghMatch[1]}`;

  const liMatch = text.match(/linkedin\.com\/in\/([^\s\n\)'"]+)/i);
  if (liMatch) urls.linkedin = `https://linkedin.com/in/${liMatch[1]}`;

  const lcMatch = text.match(/leetcode\.com\/(?:u\/)?([^\s\n\)'"]+)/i);
  if (lcMatch) urls.leetcode = `https://leetcode.com/u/${lcMatch[1]}`;

  // Portfolio/project URLs
  const urlRegex = /https?:\/\/[^\s\n\t"'>]+/gi;
  const allUrls = text.match(urlRegex) || [];
  const excludePatterns = ['github.com', 'linkedin.com', 'leetcode.com', 'mailto'];
  urls.portfolio = allUrls
    .filter(u => !excludePatterns.some(p => u.includes(p)))
    .slice(0, 5);

  return urls;
};

const extractTextFromPDF = async (filePath) => {
  const buffer = fs.readFileSync(filePath);
  try {
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (e) {
    throw new Error(`PDF parse failed: ${e.message}. Upload a text-based PDF, not a scanned image.`);
  }
};

const extractSkills = (text) => {
  const lower = text.toLowerCase();
  const found = SKILLS_DICT.filter(skill => {
    if (skill.length <= 3) {
      return new RegExp(`\\b${skill.replace(/[+#]/g, '\\$&')}\\b`, 'i').test(lower);
    }
    return lower.includes(skill);
  });
  return [...new Set(found)];
};

const extractSections = (text) => {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const sections = { education: [], experience: [], projects: [] };
  let currentSection = null;
  let buffer = [];
  const patterns = {
    education: /^(education|academic|qualification|degree)/i,
    experience: /^(experience|work|employment|professional|internship)/i,
    projects:   /^(project|portfolio|work sample)/i,
  };
  const flush = () => {
    if (currentSection && buffer.length) {
      sections[currentSection].push(buffer.join(' ').substring(0, 500));
      buffer = [];
    }
  };
  for (const line of lines) {
    let matched = false;
    for (const [sec, pat] of Object.entries(patterns)) {
      if (pat.test(line) && line.length < 60) { flush(); currentSection = sec; matched = true; break; }
    }
    if (!matched && currentSection) {
      buffer.push(line);
      if (buffer.length >= 10) flush();
    }
  }
  flush();
  return sections;
};

const parseResume = async (req, res) => {
  try {
    const profileRes = await query('SELECT resume_url, resume_filename FROM profiles WHERE user_id=$1', [req.user.id]);
    const profile = profileRes.rows[0];

    if (!profile?.resume_url) {
      return res.status(400).json({ error: 'No resume uploaded. Upload your PDF first using the Upload Resume button.' });
    }

    // Resolve path robustly
    const urlPath = profile.resume_url.replace(/^\/uploads\//, '');
    const resumePath = path.join(UPLOADS_DIR, urlPath);
    const fallbackPath = path.join(UPLOADS_DIR, 'resumes', path.basename(profile.resume_url));
    const finalPath = fs.existsSync(resumePath) ? resumePath : fs.existsSync(fallbackPath) ? fallbackPath : null;

    if (!finalPath) {
      return res.status(404).json({
        error: 'Resume file not found on server. Please re-upload your PDF — the previous upload may have been lost.'
      });
    }

    let rawText;
    try {
      rawText = await extractTextFromPDF(finalPath);
    } catch (e) {
      return res.status(422).json({ error: e.message });
    }

    if (!rawText || rawText.trim().length < 50) {
      return res.status(422).json({
        error: 'Resume has no extractable text. It appears to be a scanned image. Please upload a digital PDF created from Word, Google Docs, or LaTeX.'
      });
    }

    const skills = extractSkills(rawText);
    const sections = extractSections(rawText);
    const urls = extractURLs(rawText);

    // ── Store parse result ──
    await query(
      `INSERT INTO resume_parse_results (user_id, raw_text, parsed_skills, parsed_experience, parsed_education, parsed_projects, parsed_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())
       ON CONFLICT (user_id) DO UPDATE SET raw_text=$2, parsed_skills=$3, parsed_experience=$4, parsed_education=$5, parsed_projects=$6, parsed_at=NOW()`,
      [req.user.id, rawText.substring(0, 10000), skills,
       JSON.stringify(sections.experience), JSON.stringify(sections.education), JSON.stringify(sections.projects)]
    );

    // ── Replace resume skills (no duplicates within source) ──
    await query("DELETE FROM skills WHERE user_id=$1 AND source='resume'", [req.user.id]);
    let inserted = 0;
    for (const skillName of skills) {
      await query(
        `INSERT INTO skills (user_id, name, source, verification_level) VALUES ($1,$2,'resume','claimed')
         ON CONFLICT (user_id, name, source) DO NOTHING`,
        [req.user.id, skillName]
      );
      inserted++;
    }

    // ── Auto-fill profile URLs from resume ──
    const profileUpdates = {};
    if (urls.github) profileUpdates.github_url = urls.github;
    if (urls.linkedin) profileUpdates.linkedin_url = urls.linkedin;
    if (urls.leetcode) profileUpdates.leetcode_url = urls.leetcode;

    if (Object.keys(profileUpdates).length > 0) {
      const setClauses = Object.entries(profileUpdates).map(([k], i) => `${k}=$${i + 2}`).join(', ');
      const values = [req.user.id, ...Object.values(profileUpdates)];
      await query(`UPDATE profiles SET ${setClauses}, updated_at=NOW() WHERE user_id=$1`, values);
    }

    // ── Update parsed timestamp ──
    await query('UPDATE profiles SET resume_parsed_at=NOW() WHERE user_id=$1', [req.user.id]);

    // ── Auto-add portfolio projects ──
    let projectsAdded = 0;
    for (const url of urls.portfolio) {
      try {
        const exists = await query('SELECT id FROM projects WHERE user_id=$1 AND project_url=$2', [req.user.id, url]);
        if (!exists.rows[0]) {
          await query(
            "INSERT INTO projects (user_id, title, project_url, source) VALUES ($1,$2,$3,'resume')",
            [req.user.id, `Project from resume`, url]
          );
          projectsAdded++;
        }
      } catch {}
    }

    // ── Progress event ──
    await query(
      `INSERT INTO progress_events (user_id, event_type, event_title, event_detail)
       VALUES ($1,'resume_parsed','Resume Parsed',$2)`,
      [req.user.id, `Extracted ${inserted} skills, auto-filled ${Object.keys(profileUpdates).length} profile links`]
    ).catch(() => {});

    // ── Run full cross-source verification ──
    let verificationCounts = null;
    try {
      const vResult = await runVerification(req.user.id);
      verificationCounts = vResult.counts;
    } catch (ve) { console.error('Verification after parse failed:', ve.message); }

    return res.json({
      success: true,
      skills,
      skills_inserted: inserted,
      auto_filled: profileUpdates,
      portfolio_links_added: projectsAdded,
      education: sections.education,
      experience: sections.experience,
      projects: sections.projects,
      urls_found: urls,
      verification: verificationCounts,
    });
  } catch (err) {
    console.error('Resume parse error:', err);
    return res.status(500).json({ error: `Resume processing failed: ${err.message}` });
  }
};

const getParseResult = async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const result = await query('SELECT * FROM resume_parse_results WHERE user_id=$1', [userId]);
  res.json(result.rows[0] || null);
};

module.exports = { parseResume, getParseResult };
