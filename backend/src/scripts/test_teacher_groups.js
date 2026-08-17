const { db } = require('../config/firebase');

async function testGroups() {
  const teacherUser = {
    id: 'U4jnfM96BWaww1tAgyvGsOu2CFy1', // Firebase Auth UID
    email: 'teacher@gmail.com',
    role: 'teacher'
  };

  const req = { user: teacherUser, query: {} };
  
  // Re-run getGroups logic
  const teacherIds = new Set([req.user.id]);
  if (req.user.email) {
    const uSnap = await db.collection('users').where('email', '==', req.user.email.toLowerCase()).get();
    uSnap.docs.forEach(d => teacherIds.add(d.id));
  }

  console.log('Teacher IDs matched:', Array.from(teacherIds));

  const mSnap = await db.collection('group_members')
    .where('role', '==', 'teacher')
    .where('is_active', '==', true)
    .get();

  console.log('Found total teacher group_members docs:', mSnap.size);
  mSnap.docs.forEach(d => {
    console.log(`- Member doc: ${d.id}, GroupID: ${d.data().group_id}, UserID: ${d.data().user_id}`);
  });

  const seenGroupIds = new Set();
  const groups = [];
  for (const mDoc of mSnap.docs) {
    const mData = mDoc.data();
    if (teacherIds.has(mData.user_id)) {
      console.log(`Matched teacher membership in group ${mData.group_id}`);
      if (!seenGroupIds.has(mData.group_id)) {
        seenGroupIds.add(mData.group_id);
        const gDoc = await db.collection('groups').doc(mData.group_id).get();
        if (gDoc.exists && !gDoc.data().is_archived) {
          const wDoc = await db.collection('workspaces').doc(gDoc.data().workspace_id).get();
          const allMSnap = await db.collection('group_members').where('group_id', '==', gDoc.id).where('is_active', '==', true).get();
          groups.push({
            id: gDoc.id,
            ...gDoc.data(),
            workspace_name: wDoc.exists ? wDoc.data().name : '',
            member_count: allMSnap.size
          });
        }
      }
    }
  }

  console.log('Final groups returned to teacher:', groups);
  process.exit(0);
}

testGroups().catch(e => { console.error(e); process.exit(1); });
