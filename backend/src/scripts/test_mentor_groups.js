const { db } = require('../config/firebase');

async function testMentor() {
  const mentorUser = {
    id: 'HElOXLlSUpWdeTfcADrSiwZxzPo1',
    email: 'mentor@gmail.com',
    role: 'mentor'
  };

  const req = { user: mentorUser, query: {} };
  
  const mentorIds = new Set([req.user.id]);
  if (req.user.email) {
    const uSnap = await db.collection('users').where('email', '==', req.user.email.toLowerCase()).get();
    uSnap.docs.forEach(d => mentorIds.add(d.id));
  }

  console.log('Mentor IDs matched:', Array.from(mentorIds));

  // 1. Workspaces
  const snap = await db.collection('workspaces').get();
  const workspaces = [];
  for (const doc of snap.docs) {
    if (mentorIds.has(doc.data().mentor_id)) {
      const gSnap = await db.collection('groups').where('workspace_id', '==', doc.id).where('is_archived', '==', false).get();
      workspaces.push({ id: doc.id, ...doc.data(), group_count: gSnap.size });
    }
  }

  console.log(`Found ${workspaces.length} workspaces for mentor:`, workspaces.map(w => ({ id: w.id, name: w.name, groups: w.group_count })));

  // 2. Groups
  const gSnap = await db.collection('groups').where('is_archived', '==', false).get();
  const groups = [];
  for (const doc of gSnap.docs) {
    if (mentorIds.has(doc.data().mentor_id)) {
      const wDoc = await db.collection('workspaces').doc(doc.data().workspace_id).get();
      const mSnap = await db.collection('group_members').where('group_id', '==', doc.id).where('is_active', '==', true).get();
      groups.push({ id: doc.id, ...doc.data(), workspace_name: wDoc.exists ? wDoc.data().name : '', member_count: mSnap.size });
    }
  }

  console.log(`Found ${groups.length} groups for mentor:`, groups.map(g => ({ id: g.id, name: g.name, ws: g.workspace_name, members: g.member_count })));
  
  process.exit(0);
}

testMentor().catch(e => { console.error(e); process.exit(1); });
