const axios = require('axios');
const { db, admin } = require('../config/firebase');

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
    await db.collection('job_listings').doc(`remotive_${job.id}`).set({
      external_id: String(job.id), title: job.title, company: job.company_name,
      location: job.candidate_required_location||'Remote', description: (job.description||'').substring(0,600),
      required_skills: skills, job_type: job.job_type, apply_url: job.url,
      source_platform: 'remotive', fetched_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).catch(()=>{});
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
    await db.collection('job_listings').doc(`jobicy_${job.id}`).set({
      external_id: String(job.id), title: job.jobTitle, company: job.companyName,
      location: job.jobGeo||'Remote', description: (job.jobExcerpt||'').substring(0,600),
      required_skills: skills, apply_url: job.url,
      source_platform: 'jobicy', fetched_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).catch(()=>{});
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
    await db.collection('job_listings').doc(`arbeitnow_${eid}`).set({
      external_id: eid, title: job.title, company: job.company_name,
      location: job.location||'Remote', description: (job.description||'').substring(0,600),
      required_skills: skills, apply_url: job.url,
      source_platform: 'arbeitnow', fetched_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).catch(()=>{});
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
      await db.collection('job_listings').doc(`findwork_${job.id}`).set({
        external_id: String(job.id), title: job.role, company: job.company_name,
        location: job.location||'Remote', description: (job.text||'').substring(0,600),
        required_skills: skills, apply_url: job.url,
        source_platform: 'findwork', fetched_at: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true }).catch(()=>{});
      count++;
    }
    return count;
  } catch { return 0; }
};

// ── Source 5: Otta (via Himalayas) ──
const fetchHimalayas = async () => {
  try {
    const res = await axios.get('https://himalayas.app/jobs/api?limit=50', { timeout: 12000 });
    let count = 0;
    for (const job of res.data.jobs || []) {
      const skills = extractSkills(`${job.title} ${(job.skills||[]).join(' ')} ${job.description?.substring(0,400)||''}`);
      const eid = String(job.id||job.slug);
      await db.collection('job_listings').doc(`himalayas_${eid}`).set({
        external_id: eid, title: job.title, company: job.company?.name||'Unknown',
        location: job.location||'Remote', description: (job.description||'').substring(0,600),
        required_skills: skills, apply_url: job.applicationLink||job.url,
        source_platform: 'himalayas', fetched_at: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true }).catch(()=>{});
      count++;
    }
    return count;
  } catch { return 0; }
};

// ── Source 6: Wellfound ──
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
      const eid = Buffer.from(j.title+(j.company?.name||'')).toString('base64').substring(0,40);
      await db.collection('job_listings').doc(`wellfound_${eid}`).set({
        external_id: eid, title: j.title, company: j.company?.name||'Startup',
        location: 'Remote', description: (j.description||'').substring(0,600),
        required_skills: skills, apply_url: j.applyUrl||'',
        source_platform: 'wellfound', fetched_at: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true }).catch(()=>{});
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
      await db.collection('job_fetch_log').add({ source: src.name, jobs_fetched: cnt, fetched_at: admin.firestore.FieldValue.serverTimestamp() }).catch(()=>{});
    } catch (e) {
      console.error(`[Jobs] ${src.name} failed:`, e.message);
    }
  }
  return total;
};

const calcMatch = async (userId, requiredSkills) => {
  if (!requiredSkills?.length) return { match_pct: 0, matched: [], missing: [] };
  const skillsSnap = await db.collection('users').doc(userId).collection('skills').get();
  const userSet = new Set();
  skillsSnap.forEach(doc => {
    if (doc.data().name) userSet.add(normalise(doc.data().name));
  });
  
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
    const logSnap = await db.collection('job_fetch_log').orderBy('fetched_at', 'desc').limit(1).get();
    const lastFetch = logSnap.empty ? null : logSnap.docs[0].data().fetched_at?.toDate();
    const isStale = !lastFetch || (Date.now() - lastFetch.getTime() > 6*60*60*1000);
    
    if (isStale) fetchAllJobs().catch(e => console.error('[Jobs] bg fetch err:', e.message));

    let jobsSnap = await db.collection('job_listings').orderBy('fetched_at', 'desc').limit(100).get();
    let allJobs = jobsSnap.docs.map(doc => doc.data());

    if (search) {
      const s = search.toLowerCase();
      allJobs = allJobs.filter(j => j.title?.toLowerCase().includes(s) || j.company?.toLowerCase().includes(s));
    }

    if (tab === 'matched' && req.user) {
      const skillsSnap = await db.collection('users').doc(req.user.id).collection('skills').get();
      const userSet = new Set();
      skillsSnap.forEach(doc => { if (doc.data().name) userSet.add(normalise(doc.data().name)); });
      
      if (userSet.size === 0) {
        return res.json({ jobs: [], total: 0, message: 'Add skills to your profile to see matched jobs.' });
      }
      
      allJobs = allJobs.filter(j => j.required_skills && j.required_skills.some(skill => userSet.has(normalise(skill))));
    }

    const total = allJobs.length;
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const paginated = allJobs.slice(startIndex, startIndex + parseInt(limit));

    const jobs = [];
    for (const job of paginated) {
      if (req.user && job.required_skills?.length) {
        const m = await calcMatch(req.user.id, job.required_skills);
        jobs.push({ ...job, ...m });
      } else {
        jobs.push({ ...job, match_pct: null, matched: [], missing: [] });
      }
    }

    res.json({ jobs, total, page: parseInt(page), has_more: total > startIndex + parseInt(limit) });
  } catch (err) {
    console.error('Get jobs error:', err);
    res.status(500).json({ error: 'Failed to load jobs' });
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

  const skillsSnap = await db.collection('users').doc(req.user.id).collection('skills').get();
  const userSet = new Set();
  skillsSnap.forEach(doc => { if (doc.data().name) userSet.add(normalise(doc.data().name)); });

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
