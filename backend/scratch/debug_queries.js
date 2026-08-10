require('dotenv').config();
const { db } = require('../src/config/firebase');

const userId = 'e4dbcfe260507eba97f0bea7701c1afe';

async function testQueries() {
  console.log('--- Checking userDoc ---');
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    console.log('User Doc exists:', userDoc.exists);
    if (userDoc.exists) console.log(userDoc.data());
  } catch (e) { console.error('userDoc failed:', e); }

  console.log('--- Checking profiles ---');
  try {
    const profileDoc = await db.collection('profiles').doc(userId).get();
    console.log('Profile Doc exists:', profileDoc.exists);
    if (profileDoc.exists) console.log(profileDoc.data());
  } catch (e) { console.error('profileDoc failed:', e); }

  console.log('--- Checking subcollections ---');
  const collections = ['skills', 'projects', 'education', 'experience', 'certificates', 'coding_platforms'];
  for (const col of collections) {
    try {
      const snap = await db.collection('users').doc(userId).collection(col).get();
      console.log(`Subcollection ${col}: ${snap.size} docs`);
    } catch (e) { console.error(`Subcollection ${col} failed:`, e); }
  }

  console.log('--- Checking hr_evaluations ---');
  try {
    const snap = await db.collection('hr_evaluations').where('candidate_id', '==', userId).get();
    console.log(`hr_evaluations: ${snap.size} docs`);
  } catch (e) { console.error('hr_evaluations failed:', e); }

  console.log('--- Checking confidence_scores ---');
  try {
    const doc = await db.collection('confidence_scores').doc(userId).get();
    console.log('Confidence Score Doc exists:', doc.exists);
    if (doc.exists) console.log(doc.data());
  } catch (e) { console.error('confidenceDoc failed:', e); }

  process.exit(0);
}

testQueries();
