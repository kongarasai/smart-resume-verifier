const axios = require('axios');
const { query } = require('../config/database');

const TECH_SKILLS = [
  'javascript','typescript','python','java','c++','golang','rust','ruby','php','swift','kotlin',
  'react','angular','vue','nextjs','nodejs','express','django','flask','fastapi','spring','spring boot',
  'laravel','postgresql','mysql','mongodb','redis','elasticsearch','docker','kubernetes','aws','azure',
  'gcp','terraform','git','graphql','rest','microservices','kafka','machine learning','tensorflow',
  'pytorch','sql','linux','devops','flutter','android','ios','react native','html','css','tailwind',
  'bootstrap','hibernate','maven','gradle','jenkins','ci/cd','nginx','oauth','security','data science',
  'big data','hadoop','spark','tableau','power bi','solidity','blockchain','unity','opencv','pandas',
  'numpy','selenium','jest','cypress','node.js','next.js','vue.js',
];

const normalise = (s) => s.toLowerCase().trim()
  .replace(/\bnode\.js\b/, 'nodejs').replace(/\brest api\b/, 'rest')
  .replace(/\bnext\.js\b/, 'nextjs').replace(/\bvue\.js\b/, 'vue');

const extractSkills = (text) => {
  if (!text) return [];
  const lower = text.toLowerCase();
  return [...new Set(TECH_SKILLS.filter(s => lower.includes(s)).map(normalise))];
};

// ── Source 1: Remotive ──
const fetchRemotive = async () => {
  const res = await axios.get('https://remotive.com/api/remote-jobs?limit=100', { timeout: 12000 });
  let count = 0;
  for (const job of res.data.jobs || []) {
    const skills = extractSkills(`${job.title} ${(job.tags||[]).join(' ')} ${job.description?.substring(0,400)||''}`);
    await query(
      `INSERT INTO job_listings (external_id, title, company, location, description, required_skills, job_type, apply_url, source_platform)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'remotive')
       ON CONFLICT (external_id, source_platform) DO UPDATE SET title=$2, company=$3, fetched_at=NOW()`,
      [String(job.id), job.title, job.company_name, job.candidate_required_location||'Remote',
       (job.description||'').substring(0,600), skills, job.job_type, job.url]
    ).catch(()=>{});
    count++;
  }
  return count;
};

// ── Source 2: Jobicy ──
const fetchJobicy = async () => {
  const res = await axios.get('https://jobicy.com/api/v2/remote-jobs?count=100&geo=usa&industry=tech', { timeout: 12000 });
  let count = 0;
  for (const job of res.data.jobs || []) {
    const skills = extractSkills(`${job.jobTitle} ${job.jobIndustry||''} ${job.jobExcerpt||''}`);
    await query(
      `INSERT INTO job_listings (external_id, title, company, location, description, required_skills, apply_url, source_platform)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'jobicy')
       ON CONFLICT (external_id, source_platform) DO UPDATE SET title=$2, company=$3, fetched_at=NOW()`,
      [String(job.id), job.jobTitle, job.companyName, job.jobGeo||'Remote',
       (job.jobExcerpt||'').substring(0,600), skills, job.url]
    ).catch(()=>{});
    count++;
  }
  return count;
};

// ── Source 3: Arbeitnow ──
const fetchArbeitnow = async () => {
  const res = await axios.get('https://www.arbeitnow.com/api/job-board-api', { timeout: 12000 });
  let count = 0;
  for (const job of (res.data.data||[]).slice(0,80)) {
    const skills = extractSkills(`${job.title} ${(job.tags||[]).join(' ')} ${job.description?.substring(0,400)||''}`);
    const eid = job.slug || Buffer.from(job.title+job.company_name).toString('base64').substring(0,40);
    await query(
      `INSERT INTO job_listings (external_id, title, company, location, description, required_skills, apply_url, source_platform)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'arbeitnow')
       ON CONFLICT (external_id, source_platform) DO UPDATE SET title=$2, company=$3, fetched_at=NOW()`,
      [eid, job.title, job.company_name, job.location||'Remote',
       (job.description||'').substring(0,600), skills, job.url]
    ).catch(()=>{});
    count++;
  }
  return count;
};

// ── Source 4: FindWork ──
const fetchFindwork = async () => {
  try {
    const res = await axios.get('https://findwork.dev/api/jobs/?remote=true', { timeout: 12000,
      headers: { Authorization: `Token ${process.env.FINDWORK_TOKEN||''}` } });
    let count = 0;
    for (const job of (res.data.results||[]).slice(0,50)) {
      const skills = extractSkills(`${job.role} ${(job.keywords||[]).join(' ')}`);
      await query(
        `INSERT INTO job_listings (external_id, title, company, location, description, required_skills, apply_url, source_platform)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'findwork')
         ON CONFLICT (external_id, source_platform) DO UPDATE SET title=$2, company=$3, fetched_at=NOW()`,
        [String(job.id), job.role, job.company_name, job.location||'Remote',
         (job.text||'').substring(0,600), skills, job.url]
      ).catch(()=>{});
      count++;
    }
    return count;
  } catch { return 0; }
};

// ── Source 5: Otta (public RSS/scrape alternative) via Himalayas ──
const fetchHimalayas = async () => {
  try {
    const res = await axios.get('https://himalayas.app/jobs/api?limit=50', { timeout: 12000 });
    let count = 0;
    for (const job of res.data.jobs || []) {
      const skills = extractSkills(`${job.title} ${(job.skills||[]).join(' ')} ${job.description?.substring(0,400)||''}`);
      await query(
        `INSERT INTO job_listings (external_id, title, company, location, description, required_skills, apply_url, source_platform)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'himalayas')
         ON CONFLICT (external_id, source_platform) DO UPDATE SET title=$2, company=$3, fetched_at=NOW()`,
        [String(job.id||job.slug), job.title, job.company?.name||'Unknown', job.location||'Remote',
         (job.description||'').substring(0,600), skills, job.applicationLink||job.url]
      ).catch(()=>{});
      count++;
    }
    return count;
  } catch { return 0; }
};

// ── Source 6: Wellfound / AngelList public feed ──
const fetchWellfound = async () => {
  try {
    const res = await axios.get('https://api.wellfound.com/graphql', {
      method: 'POST',
      data: { query: `{ jobListings(remote: true, first: 50) { edges { node { title company { name } applyUrl skills { name } description } } } }` },
      timeout: 8000
    });
    let count = 0;
    for (const edge of (res.data.data?.jobListings?.edges||[])) {
      const j = edge.node;
      const skills = extractSkills(`${j.title} ${(j.skills||[]).map(function(s){return s.name||"";}).join(' ')}`);
      await query(
        `INSERT INTO job_listings (external_id, title, company, location, description, required_skills, apply_url, source_platform)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'wellfound')
         ON CONFLICT (external_id, source_platform) DO UPDATE SET fetched_at=NOW()`,
        [Buffer.from(j.title+j.company?.name||'').toString('base64').substring(0,40),
         j.title, j.company?.name||'Startup', 'Remote',
         (j.description||'').substring(0,600), skills, j.applyUrl||'']
      ).catch(()=>{});
      count++;
    }
    return count;
  } catch { return 0; }
};

const fetchAllJobs = async () => {
  const sources = [
    { name: 'remotive', fn: fetchRemotive },
    { name: 'jobicy', fn: fetchJobicy },
    { name: 'arbeitnow', fn: fetchArbeitnow },
    { name: 'findwork', fn: fetchFindwork },
    { name: 'himalayas', fn: fetchHimalayas },
    { name: 'wellfound', fn: fetchWellfound },
  ];

  let total = 0;
  for (const src of sources) {
    try {
      const cnt = await src.fn();
      total += cnt;
      console.log(`[Jobs] ${src.name}: ${cnt} jobs`);
      await query('INSERT INTO job_fetch_log (source, jobs_fetched) VALUES ($1,$2)', [src.name, cnt]).catch(()=>{});
    } catch (e) {
      console.error(`[Jobs] ${src.name} failed:`, e.message);
    }
  }
  return total;
};

const calcMatch = async (userId, requiredSkills) => {
  if (!requiredSkills?.length) return { match_pct: 0, matched: [], missing: [] };
  const skillsRes = await query('SELECT DISTINCT LOWER(name) as name FROM skills WHERE user_id=$1', [userId]);
  const userSet = new Set(skillsRes.rows.map(r => normalise(r.name)));
  const matched = requiredSkills.filter(s => userSet.has(normalise(s)));
  const missing = requiredSkills.filter(s => !userSet.has(normalise(s)));
  return {
    match_pct: Math.round((matched.length / requiredSkills.length) * 100),
    matched,
    missing: missing.map((skill, i) => ({ skill, priority: i < 2 ? 'high' : i < 4 ? 'medium' : 'low' })),
  };
};

const getJobs = async (req, res) => {
  const { tab = 'all', page = 1, limit = 25, search } = req.query;
  try {
    // Auto-fetch if stale
    const staleRes = await query("SELECT MAX(fetched_at) as last, COUNT(*) as cnt FROM job_listings");
    const cnt = parseInt(staleRes.rows[0]?.cnt || 0);
    const last = staleRes.rows[0]?.last;
    const isStale = !last || (Date.now() - new Date(last).getTime() > 6*60*60*1000);
    if (cnt === 0 || isStale) fetchAllJobs().catch(e => console.error('[Jobs] bg fetch err:', e.message));

    let sql = 'SELECT * FROM job_listings WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      sql += ` AND (LOWER(title) LIKE $${params.length} OR LOWER(company) LIKE $${params.length})`;
    }

    if (tab === 'matched' && req.user) {
      const skillsRes = await query('SELECT DISTINCT LOWER(name) as name FROM skills WHERE user_id=$1', [req.user.id]);
      const userSkills = skillsRes.rows.map(r => normalise(r.name));
      if (!userSkills.length) {
        return res.json({ jobs: [], total: 0, message: 'Add skills to your profile to see matched jobs. Upload and parse your resume, then verify GitHub and LeetCode.' });
      }
      params.push(userSkills);
      sql += ` AND required_skills && $${params.length}::text[]`;
    }

    const countRes = await query(sql.replace('SELECT *', 'SELECT COUNT(*) as total'), params);
    const total = parseInt(countRes.rows[0]?.total || 0);

    params.push(parseInt(limit), (parseInt(page)-1)*parseInt(limit));
    sql += ` ORDER BY fetched_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`;

    const jobsRes = await query(sql, params);
    const jobs = [];
    for (const job of jobsRes.rows) {
      if (req.user && job.required_skills?.length) {
        const m = await calcMatch(req.user.id, job.required_skills);
        jobs.push({ ...job, ...m });
      } else {
        jobs.push({ ...job, match_pct: null, matched: [], missing: [] });
      }
    }

    res.json({ jobs, total, page: parseInt(page), has_more: total > parseInt(page)*parseInt(limit) });
  } catch (err) {
    console.error('Get jobs error:', err);
    const fallback = await query('SELECT * FROM job_listings ORDER BY fetched_at DESC LIMIT 25').catch(()=>({rows:[]}));
    res.json({ jobs: fallback.rows, total: fallback.rows.length, fallback: true });
  }
};

const analyzeJobRole = async (req, res) => {
  const { job_title } = req.body;
  if (!job_title) return res.status(400).json({ error: 'job_title required' });
  const ROLES = {
    'frontend': { r: ['javascript','react','html','css','typescript'], n: ['vue','nextjs','tailwind','graphql'] },
    'backend': { r: ['nodejs','python','java','sql','rest'], n: ['docker','kafka','redis','microservices'] },
    'full stack': { r: ['javascript','react','nodejs','sql','git'], n: ['typescript','docker','aws','mongodb'] },
    'data': { r: ['python','machine learning','sql','tensorflow'], n: ['pytorch','spark','tableau'] },
    'devops': { r: ['docker','kubernetes','aws','linux','terraform'], n: ['ansible','jenkins','ci/cd'] },
    'mobile': { r: ['android','ios','swift','kotlin'], n: ['flutter','react native'] },
    'java': { r: ['java','spring boot','sql','maven','git'], n: ['microservices','docker','kafka'] },
    'python': { r: ['python','sql','django','flask','git'], n: ['fastapi','postgresql','redis','aws'] },
    'machine learning': { r: ['python','tensorflow','pytorch','sql','pandas'], n: ['spark','hadoop','tableau'] },
    'security': { r: ['security','linux','networking','python'], n: ['kubernetes','aws','oauth'] },
    'cloud': { r: ['aws','docker','kubernetes','linux','terraform'], n: ['azure','gcp','ci/cd'] },
  };
  const title = job_title.toLowerCase();
  let roleData = null;
  for (const [k, d] of Object.entries(ROLES)) {
    if (title.includes(k)) { roleData = { role: job_title, required: d.r, nice: d.n }; break; }
  }
  if (!roleData) roleData = { role: job_title, required: extractSkills(job_title).slice(0,5), nice: [] };

  const skillsRes = await query('SELECT DISTINCT LOWER(name) as name FROM skills WHERE user_id=$1', [req.user.id]);
  const userSet = new Set(skillsRes.rows.map(r => normalise(r.name)));
  const matched = roleData.required.filter(s => userSet.has(normalise(s)));
  const missing = roleData.required.filter(s => !userSet.has(normalise(s)));
  const match_pct = roleData.required.length > 0 ? Math.round((matched.length/roleData.required.length)*100) : 0;

  res.json({
    role: roleData.role, match_pct, matched,
    missing: missing.map((skill,i) => ({ skill, priority: i===0?'high':i<3?'medium':'low' })),
    nice_to_have: roleData.nice,
    recommendations: missing.slice(0,3).map(s => `Learn ${s} — required for most ${job_title} roles`),
  });
};

const refreshJobs = async (req, res) => {
  try {
    const count = await fetchAllJobs();
    res.json({ message: `Fetched ${count} jobs from Remotive, Jobicy, Arbeitnow, Findwork, Himalayas, Wellfound`, count });
  } catch (err) {
    res.status(500).json({ error: 'Refresh failed: ' + err.message });
  }
};

module.exports = { getJobs, analyzeJobRole, refreshJobs, fetchAllJobs };
