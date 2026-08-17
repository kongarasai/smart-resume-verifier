const { db, admin } = require('../config/firebase');

async function syncAndMigrateAll() {
  console.log('--- Starting Comprehensive Identity and Workspace/Group Sync ---');

  const listUsersResult = await admin.auth().listUsers(1000);
  const authUsersByEmail = new Map();
  listUsersResult.users.forEach(u => {
    if (u.email) authUsersByEmail.set(u.email.toLowerCase().trim(), u);
  });

  const uSnap = await db.collection('users').get();
  for (const doc of uSnap.docs) {
    const data = doc.data();
    const email = (data.email || '').toLowerCase().trim();
    if (!email) continue;

    const authUser = authUsersByEmail.get(email);
    const targetUid = authUser ? authUser.uid : doc.id;

    if (doc.id !== targetUid) {
      console.log(`Migrating user ${email}: old doc "${doc.id}" -> canonical "${targetUid}" (${data.role})`);

      const canonicalRef = db.collection('users').doc(targetUid);
      const canonicalDoc = await canonicalRef.get();
      const mergedData = {
        email,
        full_name: data.full_name || authUser?.displayName || email.split('@')[0],
        role: data.role || 'candidate',
        photo_url: data.photo_url || authUser?.photoURL || '',
        is_active: data.is_active !== undefined ? data.is_active : true,
        created_at: data.created_at || admin.firestore.FieldValue.serverTimestamp(),
        last_login: admin.firestore.FieldValue.serverTimestamp()
      };
      await canonicalRef.set(mergedData, { merge: true });

      // Migrate workspaces
      const wsSnap = await db.collection('workspaces').where('mentor_id', '==', doc.id).get();
      for (const wDoc of wsSnap.docs) {
        console.log(`  Updating workspace ${wDoc.id} mentor_id -> ${targetUid}`);
        await wDoc.ref.update({ mentor_id: targetUid });
      }

      // Migrate groups
      const gSnap = await db.collection('groups').where('mentor_id', '==', doc.id).get();
      for (const gDoc of gSnap.docs) {
        console.log(`  Updating group ${gDoc.id} mentor_id -> ${targetUid}`);
        await gDoc.ref.update({ mentor_id: targetUid });
      }

      // Migrate group_members
      const gmSnap = await db.collection('group_members').where('user_id', '==', doc.id).get();
      for (const gmDoc of gmSnap.docs) {
        console.log(`  Updating group_member ${gmDoc.id} user_id -> ${targetUid}`);
        await gmDoc.ref.update({ user_id: targetUid });
      }

      // Migrate questions
      const qSnap = await db.collection('questions').where('created_by', '==', doc.id).get();
      for (const qDoc of qSnap.docs) {
        await qDoc.ref.update({ created_by: targetUid });
      }

      // Migrate other subcollections
      for (const col of ['profiles', 'privacy_settings', 'confidence_scores', 'skills', 'projects', 'education', 'experience', 'certificates']) {
        const cDoc = await db.collection(col).doc(doc.id).get();
        if (cDoc.exists) {
          await db.collection(col).doc(targetUid).set(cDoc.data(), { merge: true });
          await cDoc.ref.delete();
        }
      }

      await doc.ref.delete();
      console.log(`  Deleted old user doc "${doc.id}"`);
    } else {
      console.log(`User ${email} has canonical UID ${doc.id}`);
    }
  }

  // Also check if any workspaces/groups have mentor_ids matching mentor_gmail_com
  const wsSnap = await db.collection('workspaces').where('mentor_id', '==', 'mentor_gmail_com').get();
  for (const wDoc of wsSnap.docs) {
    console.log(`Fixing workspace ${wDoc.id} mentor_id mentor_gmail_com -> HElOXLlSUpWdeTfcADrSiwZxzPo1`);
    await wDoc.ref.update({ mentor_id: 'HElOXLlSUpWdeTfcADrSiwZxzPo1' });
  }

  const gSnap = await db.collection('groups').where('mentor_id', '==', 'mentor_gmail_com').get();
  for (const gDoc of gSnap.docs) {
    console.log(`Fixing group ${gDoc.id} mentor_id mentor_gmail_com -> HElOXLlSUpWdeTfcADrSiwZxzPo1`);
    await gDoc.ref.update({ mentor_id: 'HElOXLlSUpWdeTfcADrSiwZxzPo1' });
  }

  console.log('--- Sync Completed Successfully ---');
  process.exit(0);
}

syncAndMigrateAll().catch(e => {
  console.error(e);
  process.exit(1);
});
