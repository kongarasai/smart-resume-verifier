require('dotenv').config();
const { db } = require('../config/firebase');

const MAX_SKILL_SCORE = 100;

const computeSkillVerificationScore = async (userId) => {
  const skillsSnap = await db.collection('users').doc(userId).collection('skills').get();
  let raw = 0;
  skillsSnap.docs.forEach(doc => {
    const level = doc.data().verification_level;
    if (level === 'claimed') raw += 10;
    else if (level === 'evidence') raw += 20;
    else if (level === 'verified') raw += 40;
    else if (level === 'strong_verified' || level === 'expert') raw += 50;
  });
  return Math.min(Math.round((raw / 500) * 100), MAX_SKILL_SCORE);
};

const computePracticeScore = async (userId) => {
  const snap = await db.collection('practice_sessions').where('user_id', '==', userId).get();
  let total = 0, count = 0;
  snap.docs.forEach(d => {
    if (d.data().score_percentage !== undefined) {
      total += parseFloat(d.data().score_percentage);
      count++;
    }
  });
  const codingSessionAvg = count > 0 ? total / count : 0;
  
  const lcDoc = await db.collection('leetcode_data').doc(userId).get();
  const lcScore = lcDoc.exists ? parseFloat(lcDoc.data().coding_evidence_score || 0) : 0;
  
  return Math.max(codingSessionAvg, lcScore, 0);
};

const computeGitHubScore = async (userId) => {
  const doc = await db.collection('github_data').doc(userId).get();
  return doc.exists ? parseFloat(doc.data().skill_match_score || 0) : 0;
};

async function run() {
  const usersSnap = await db.collection('users').get();
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    if (data.role !== 'candidate') continue;

    console.log(`\nCandidate: ${data.full_name} (${data.email}) - ID: ${doc.id}`);
    
    // Get skills count
    const skillsSnap = await db.collection('users').doc(doc.id).collection('skills').get();
    console.log(`  Actual Skills count in subcollection: ${skillsSnap.size}`);
    
    const skillScore = await computeSkillVerificationScore(doc.id);
    const testScore = await computePracticeScore(doc.id);
    const githubScore = await computeGitHubScore(doc.id);
    
    const overall = (testScore * 0.50) + (githubScore * 0.30) + (skillScore * 0.20);
    const finalScore = Math.round(overall);
    
    console.log(`  Calculated:`);
    console.log(`    - Test Score (50%): ${testScore}`);
    console.log(`    - GitHub Score (30%): ${githubScore}`);
    console.log(`    - Skill Score (20%): ${skillScore}`);
    console.log(`    - Final Calculated Score: ${finalScore}`);
    
    const scoreDoc = await db.collection('confidence_scores').doc(doc.id).get();
    if (scoreDoc.exists) {
      console.log(`  Stored in DB:`, scoreDoc.data());
    } else {
      console.log(`  Stored in DB: NONE`);
    }
  }
  process.exit(0);
}

run().catch(console.error);
