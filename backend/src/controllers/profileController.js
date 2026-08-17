const { db, admin } = require('../config/firebase');
const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

const calcCompleteness = (profile, skills, projects, education, certs) => {
  let score = 0;
  if (profile.headline) score += 5;
  if (profile.phone) score += 5;
  if (profile.location) score += 5;
  if (profile.linkedin_url) score += 5;
  if (profile.github_url) score += 15;
  if (profile.leetcode_url) score += 10;
  if (profile.resume_url) score += 15;
  if (skills.length > 0) score += 15;
  if (projects.length > 0) score += 10;
  if (education.length > 0) score += 10;
  if (certs.length > 0) score += 5;
  return Math.min(score, 100);
};

const calcCareerReadiness = (completeness, confidence) => {
  const combined = (completeness * 0.4) + ((confidence || 0) * 0.6);
  if (combined >= 85) return 'top_performer';
  if (combined >= 70) return 'interview_ready';
  if (combined >= 55) return 'job_ready';
  if (combined >= 35) return 'developing';
  return 'beginner';
};

const fetchSubcollection = async (userId, collectionName) => {
  const snapshot = await db.collection('users').doc(userId).collection(collectionName).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const getProfile = async (req, res) => {
  const userId = req.params.userId || req.user.id;

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });
    
    const userData = userDoc.data();

    const privacyDoc = await db.collection('privacy_settings').doc(userId).get();
    const privacy = privacyDoc.exists ? privacyDoc.data() : null;

    if (userId !== req.user.id && privacy) {
      if (req.user.role === 'hr' && privacy.allow_hr_view === false) {
        return res.status(403).json({ error: 'This candidate has restricted HR access' });
      }
      if (req.user.role === 'mentor' && privacy.allow_mentor_view === false) {
        return res.status(403).json({ error: 'This candidate has restricted mentor access' });
      }
    }

    const profileDoc = await db.collection('profiles').doc(userId).get();
    const profileData = profileDoc.exists ? profileDoc.data() : {};

    const [skills, projects, education, experience, certificates, platforms, hrEvalRes] = await Promise.all([
      fetchSubcollection(userId, 'skills'),
      fetchSubcollection(userId, 'projects'),
      fetchSubcollection(userId, 'education'),
      fetchSubcollection(userId, 'experience'),
      fetchSubcollection(userId, 'certificates'),
      fetchSubcollection(userId, 'coding_platforms'),
      db.collection('hr_evaluations').where('candidate_id', '==', userId).get()
    ]);

    const confidenceDoc = await db.collection('confidence_scores').doc(userId).get();
    const confidenceData = confidenceDoc.exists ? confidenceDoc.data() : null;

    const hiring_status = hrEvalRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const mergedProfile = { ...profileData, full_name: userData.full_name, email: userData.email, photo_url: userData.photo_url };

    // Deduplicate skills case-insensitively, keeping the highest verification level
    const skillMap = {};
    const levels = ['claimed', 'evidence', 'verified', 'strong_verified', 'expert'];
    for (const s of skills) {
      const key = (s.name || '').toLowerCase().trim();
      if (!skillMap[key]) {
        skillMap[key] = s;
      } else {
        const currentLevelIdx = levels.indexOf(skillMap[key].verification_level || 'claimed');
        const newLevelIdx = levels.indexOf(s.verification_level || 'claimed');
        if (newLevelIdx > currentLevelIdx) {
          skillMap[key] = s;
        }
      }
    }
    const deduplicatedSkills = Object.values(skillMap);

    res.json({
      profile: mergedProfile,
      skills: deduplicatedSkills,
      raw_skills: skills,
      projects,
      education,
      experience,
      certificates,
      platforms,
      confidence: confidenceData,
      privacy,
      hiring_status,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load profile: ' + err.message });
  }
};

const updateProfile = async (req, res) => {
  const { headline, phone, location, bio, linkedin_url, github_url, leetcode_url, years_experience } = req.body;
  const userId = req.user.id;
  try {
    const profileRef = db.collection('profiles').doc(userId);
    
    await profileRef.set({
      headline: headline || null,
      phone: phone || null,
      location: location || null,
      bio: bio || null,
      linkedin_url: linkedin_url || null,
      github_url: github_url || null,
      leetcode_url: leetcode_url || null,
      years_experience: years_experience || 0,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Recalculate completeness
    const profileDoc = await profileRef.get();
    const [skills, projects, education, certs] = await Promise.all([
      fetchSubcollection(userId, 'skills'),
      fetchSubcollection(userId, 'projects'),
      fetchSubcollection(userId, 'education'),
      fetchSubcollection(userId, 'certificates'),
    ]);
    const confDoc = await db.collection('confidence_scores').doc(userId).get();
    const confScore = confDoc.exists ? confDoc.data().overall_score : 0;
    
    const completeness = calcCompleteness(profileDoc.data(), skills, projects, education, certs);
    const careerReadiness = calcCareerReadiness(completeness, confScore);
    
    await profileRef.update({ profile_completeness: completeness, career_readiness: careerReadiness });

    res.json({ message: 'Profile updated', completeness, career_readiness: careerReadiness });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed: ' + err.message });
  }
};

const uploadPhoto = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });
  const photoUrl = `/uploads/photos/${req.file.filename}`;
  try {
    await Promise.all([
      db.collection('users').doc(req.user.id).set({
        photo_url: photoUrl,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true }),
      db.collection('profiles').doc(req.user.id).set({
        photo_url: photoUrl,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true })
    ]);
    res.json({ message: 'Photo uploaded', photoUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save photo' });
  }
};

const uploadResume = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded. Please select a PDF file.' });

  const ext = path.extname(req.file.originalname).toLowerCase();
  if (!['.pdf', '.doc', '.docx'].includes(ext)) {
    return res.status(400).json({ error: 'Invalid file type. Please upload a PDF, DOC, or DOCX file.' });
  }

  const resumeUrl = `/uploads/resumes/${req.file.filename}`;
  try {
    await db.collection('profiles').doc(req.user.id).update({
      resume_url: resumeUrl,
      resume_filename: req.file.originalname,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ message: 'Resume uploaded successfully', resumeUrl, filename: req.file.originalname });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record resume: ' + err.message });
  }
};

const addSubcollectionItem = async (req, res, collectionName, data) => {
  try {
    const docRef = await db.collection('users').doc(req.user.id).collection(collectionName).add(data);
    res.status(201).json({ id: docRef.id, ...data });
  } catch (err) {
    res.status(500).json({ error: `Failed to add to ${collectionName}` });
  }
};

const deleteSubcollectionItem = async (req, res, collectionName) => {
  try {
    await db.collection('users').doc(req.user.id).collection(collectionName).doc(req.params.id).delete();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Deletion failed' });
  }
};

const addSkill = async (req, res) => {
  const userId = req.user.id;
  const name = (req.body.name || '').trim();
  const level = req.body.proficiency_level || 'beginner';
  const source = req.body.source || 'manual';
  
  if (!name) return res.status(400).json({ error: 'Skill name is required' });
  
  try {
    const skillsSnap = await db.collection('users').doc(userId).collection('skills').get();
    const exists = skillsSnap.docs.some(doc => (doc.data().name || '').toLowerCase().trim() === name.toLowerCase());
    
    if (exists) {
      return res.status(400).json({ error: 'Skill already exists on your profile' });
    }
    
    await addSubcollectionItem(req, res, 'skills', { 
      name, 
      proficiency_level: level, 
      verification_level: 'claimed', 
      source 
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add skill' });
  }
};

const deleteSkill = async (req, res) => {
  try {
    const userId = req.user.id;
    const skillId = req.params.id;
    
    // Find the skill to get its name
    const skillDoc = await db.collection('users').doc(userId).collection('skills').doc(skillId).get();
    if (!skillDoc.exists) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    const skillName = (skillDoc.data().name || '').toLowerCase().trim();
    
    // Find all matching skills in subcollection
    const skillsSnap = await db.collection('users').doc(userId).collection('skills').get();
    const batch = db.batch();
    
    skillsSnap.forEach(doc => {
      if ((doc.data().name || '').toLowerCase().trim() === skillName) {
        batch.delete(doc.ref);
      }
    });
    
    // Also delete any skill verification engines' record
    const verifDocRef = db.collection('skill_verifications').doc(`${userId}_${skillName}`);
    batch.delete(verifDocRef);
    
    const { normalise } = require('../services/skillVerificationEngine');
    const normName = normalise(skillName);
    if (normName !== skillName) {
      batch.delete(db.collection('skill_verifications').doc(`${userId}_${normName}`));
    }
    
    await batch.commit();
    res.json({ message: 'Skill deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete skill: ' + err.message });
  }
};

const addProject = (req, res) => addSubcollectionItem(req, res, 'projects', req.body);
const deleteProject = (req, res) => deleteSubcollectionItem(req, res, 'projects');

const addEducation = (req, res) => addSubcollectionItem(req, res, 'education', req.body);
const deleteEducation = (req, res) => deleteSubcollectionItem(req, res, 'education');

const addExperience = (req, res) => addSubcollectionItem(req, res, 'experience', req.body);
const deleteExperience = (req, res) => deleteSubcollectionItem(req, res, 'experience');

const addCertificate = (req, res) => addSubcollectionItem(req, res, 'certificates', req.body);
const deleteCertificate = (req, res) => deleteSubcollectionItem(req, res, 'certificates');

const addPlatform = (req, res) => addSubcollectionItem(req, res, 'coding_platforms', req.body);

const updatePrivacy = async (req, res) => {
  try {
    await db.collection('privacy_settings').doc(req.user.id).set({
      ...req.body,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    res.json({ message: 'Privacy settings updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update privacy settings' });
  }
};

const getTimeline = async (req, res) => {
  const userId = req.params.userId || req.user.id;
  try {
    const snapshot = await db.collection('users').doc(userId).collection('progress_events').orderBy('created_at', 'desc').limit(60).get();
    const events = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(ev => ev.event_type !== 'practice_attempt'); // Show whole sessions & major milestones, not individual questions
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load timeline' });
  }
};

const getHRProfile = async (req, res) => {
  try {
    const hrDoc = await db.collection('hr_profiles').doc(req.user.id).get();
    res.json({ user: req.user, hr_profile: hrDoc.exists ? hrDoc.data() : {} });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load HR profile' });
  }
};

const updateHRProfile = async (req, res) => {
  try {
    await db.collection('hr_profiles').doc(req.user.id).set({
      ...req.body,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    res.json({ message: 'HR profile updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update HR profile' });
  }
};

const updateAvailability = async (req, res) => {
  try {
    await db.collection('profiles').doc(req.user.id).update({
      availability: req.body.availability,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ message: 'Availability updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update availability' });
  }
};

module.exports = {
  getProfile, updateProfile, uploadPhoto, uploadResume,
  addSkill, deleteSkill, addProject, deleteProject,
  addEducation, deleteEducation, addExperience, deleteExperience,
  addCertificate, deleteCertificate, addPlatform,
  updatePrivacy, updateAvailability, getTimeline,
  getHRProfile, updateHRProfile,
};
