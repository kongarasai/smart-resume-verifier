require('dotenv').config();
const { db } = require('../src/config/firebase');

async function listUsers() {
  try {
    const snap = await db.collection('users').get();
    console.log(`Found ${snap.size} users:`);
    snap.forEach(doc => {
      console.log(`ID: ${doc.id}, Email: ${doc.data().email}, Role: ${doc.data().role}, Name: ${doc.data().full_name}`);
    });
  } catch (err) {
    console.error('Error listing users:', err);
  }
  process.exit(0);
}

listUsers();
