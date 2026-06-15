require('dotenv').config();
const { db, admin } = require('../config/firebase');

async function recalculate() {
  const users = await db.collection('users').get();
  for (const doc of users.docs) {
    const userId = doc.id;
    let rawFraudProb = 0.15 + (Math.random() * 0.1);
    
    const profileDoc = await db.collection('profiles').doc(userId).get();
    const userProfile = profileDoc.exists ? profileDoc.data() : null;

    if (!userProfile?.github_url && !userProfile?.leetcode_url) {
      rawFraudProb += 0.3; 
    } else {
      rawFraudProb = Math.max(0.05, rawFraudProb - 0.1); // bonus for having links
    }

    rawFraudProb = Math.min(Math.max(rawFraudProb, 0.05), 0.95);
    const fraudRisk = rawFraudProb > 0.65 ? 'high' : rawFraudProb > 0.35 ? 'medium' : 'low';

    await db.collection('confidence_scores').doc(userId).set({
      fraud_probability: rawFraudProb,
      fraud_risk_level: fraudRisk
    }, { merge: true });
    
    console.log(`Updated fraud probability for ${userId}: ${rawFraudProb.toFixed(2)} (${fraudRisk})`);
  }
  console.log('Done!');
  process.exit(0);
}

recalculate().catch(console.error);
