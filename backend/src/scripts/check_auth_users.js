const { admin, db } = require('../config/firebase');

async function listAllUsers(nextPageToken) {
  const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
  console.log('=== FIREBASE AUTH USERS ===');
  listUsersResult.users.forEach((userRecord) => {
    console.log(`Auth UID: ${userRecord.uid} | Email: ${userRecord.email} | Name: ${userRecord.displayName} | CustomClaims: ${JSON.stringify(userRecord.customClaims)}`);
  });
  if (listUsersResult.pageToken) {
    await listAllUsers(listUsersResult.pageToken);
  }
}

listAllUsers().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
