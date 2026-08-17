const { db, admin } = require('../config/firebase');

async function migrateAll() {
  console.log('Starting full database migration to canonical Firebase Auth UIDs...');

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
    if (authUser && doc.id !== authUser.uid) {
      console.log(`Migrating user ${email}: old doc ID "${doc.id}" -> new doc ID "${authUser.uid}" (role: ${data.role})`);
      
      // 1. Create/merge canonical document
      const canonicalRef = db.collection('users').doc(authUser.uid);
      const canonicalDoc = await canonicalRef.get();
      const mergedData = {
        email,
        full_name: data.full_name || authUser.displayName || email.split('@')[0],
        role: data.role || 'candidate',
        photo_url: data.photo_url || authUser.photoURL || '',
        is_active: data.is_active !== undefined ? data.is_active : true,
        created_at: data.created_at || admin.firestore.FieldValue.serverTimestamp(),
        last_login: admin.firestore.FieldValue.serverTimestamp()
      };
      await canonicalRef.set(mergedData, { merge: true });

      // 2. Migrate group_members
      const gmSnap = await db.collection('group_members').where('user_id', '==', doc.id).get();
      for (const gmDoc of gmSnap.docs) {
        console.log(`  Updating group_member ${gmDoc.id}: user_id ${doc.id} -> ${authUser.uid}`);
        await gmDoc.ref.update({ user_id: authUser.uid });
      }

      // 3. Migrate other collections referencing doc.id
      const collectionsToCheck = ['profiles', 'privacy_settings', 'confidence_scores', 'skills', 'projects', 'education', 'experience', 'certificates'];
      for (const col of collectionsToCheck) {
        const cDoc = await db.collection(col).doc(doc.id).get();
        if (cDoc.exists) {
          console.log(`  Migrating ${col} doc ${doc.id} -> ${authUser.uid}`);
          await db.collection(col).doc(authUser.uid).set(cDoc.data(), { merge: true });
          await cDoc.ref.delete();
        }
      }

      // 4. Delete old user doc
      await doc.ref.delete();
      console.log(`  Deleted old user doc "${doc.id}"`);
    } else if (authUser && doc.id === authUser.uid) {
      console.log(`User ${email} already has canonical UID ${doc.id}`);
    }
  }

  console.log('Migration complete!');
  process.exit(0);
}

migrateAll().catch(e => { console.error(e); process.exit(1); });
