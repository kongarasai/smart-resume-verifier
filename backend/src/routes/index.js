const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { uploadResume: uploadResumeMiddleware, uploadPhoto: uploadPhotoMiddleware, handleUploadError } = require('../middleware/upload');

const { register, login, logout, me } = require('../controllers/authController');
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/logout', logout);
router.get('/auth/me', authenticate, me);

const profileCtrl = require('../controllers/profileController');
const resumeFeedbackCtrl = require('../controllers/resumeFeedbackController');
router.get('/profile', authenticate, profileCtrl.getProfile);
router.put('/profile', authenticate, profileCtrl.updateProfile);
router.post('/profile/photo', authenticate, uploadPhotoMiddleware.single('photo'), handleUploadError, profileCtrl.uploadPhoto);
router.post('/profile/resume', authenticate, requireRole('candidate'), uploadResumeMiddleware.single('resume'), handleUploadError, profileCtrl.uploadResume);
router.get('/profile/timeline', authenticate, profileCtrl.getTimeline);
router.get('/profile/timeline/:userId', authenticate, profileCtrl.getTimeline);
router.put('/profile/privacy', authenticate, requireRole('candidate'), profileCtrl.updatePrivacy);
router.put('/profile/availability', authenticate, requireRole('candidate'), profileCtrl.updateAvailability);
// Parametric routes MUST be last in their respective namespaces
router.get('/profile/resume-feedback', authenticate, requireRole('candidate'), resumeFeedbackCtrl.getResumeFeedback);
router.get('/profile/:userId', authenticate, profileCtrl.getProfile);
router.get('/hr-profile', authenticate, requireRole('hr'), profileCtrl.getHRProfile);
router.put('/hr-profile', authenticate, requireRole('hr'), profileCtrl.updateHRProfile);

router.post('/skills', authenticate, profileCtrl.addSkill);
router.delete('/skills/:id', authenticate, profileCtrl.deleteSkill);
router.post('/projects', authenticate, profileCtrl.addProject);
router.delete('/projects/:id', authenticate, profileCtrl.deleteProject);
router.post('/education', authenticate, profileCtrl.addEducation);
router.delete('/education/:id', authenticate, profileCtrl.deleteEducation);
router.post('/experience', authenticate, profileCtrl.addExperience);
router.delete('/experience/:id', authenticate, profileCtrl.deleteExperience);
router.post('/certificates', authenticate, profileCtrl.addCertificate);
router.delete('/certificates/:id', authenticate, profileCtrl.deleteCertificate);
router.post('/platforms', authenticate, profileCtrl.addPlatform);

const { parseResume, getParseResult } = require('../services/resumeParser');
router.post('/resume/parse', authenticate, requireRole('candidate'), parseResume);
router.get('/resume/parse', authenticate, getParseResult);
router.get('/resume/parse/:userId', authenticate, getParseResult);

const skillVerif = require('../services/skillVerificationEngine');
router.post('/verification/run', authenticate, skillVerif.triggerVerification);
router.post('/verification/run/:userId', authenticate, skillVerif.triggerVerification);
router.get('/verification/summary', authenticate, skillVerif.getVerificationSummary);
router.get('/verification/summary/:userId', authenticate, skillVerif.getVerificationSummary);
router.get('/verification/skill/:userId/:skillName', authenticate, skillVerif.getSkillEvidence);
router.get('/verification/skill/:skillName', authenticate, skillVerif.getSkillEvidence);

const { fetchGitHubData, getGitHubData } = require('../services/githubService');
router.post('/github/verify', authenticate, fetchGitHubData);
router.get('/github/data', authenticate, getGitHubData);
router.get('/github/data/:userId', authenticate, getGitHubData);

const { verifyLeetCode, getLeetCodeData } = require('../services/leetcodeService');
router.post('/leetcode/verify', authenticate, requireRole('candidate'), verifyLeetCode);
router.get('/leetcode/data', authenticate, getLeetCodeData);
router.get('/leetcode/data/:userId', authenticate, getLeetCodeData);

const practiceCtrl = require('../controllers/practiceController');
router.get('/questions', authenticate, practiceCtrl.getQuestions);
router.post('/questions/bulk', authenticate, practiceCtrl.bulkCreateQuestions);
router.delete('/questions/bulk', authenticate, practiceCtrl.bulkDeleteQuestions);
router.get('/questions/:id', authenticate, practiceCtrl.getQuestion);
router.delete('/questions/:id', authenticate, practiceCtrl.deleteQuestion);
router.post('/questions', authenticate, practiceCtrl.createQuestion);


router.post('/practice/start', authenticate, practiceCtrl.startSession);
router.post('/practice/submit', authenticate, practiceCtrl.submitAnswer);
router.post('/practice/end', authenticate, practiceCtrl.endSession);
router.post('/practice/run-code', authenticate, practiceCtrl.runCode);
router.get('/practice/progress', authenticate, practiceCtrl.getMyProgress);
router.post('/practice/toggle-star', authenticate, practiceCtrl.toggleStarQuestion);
router.get('/practice/starred', authenticate, practiceCtrl.getStarredQuestions);
router.get('/practice/assignments', authenticate, practiceCtrl.getAssignments);
router.get('/practice/assignments/:groupId', authenticate, practiceCtrl.getAssignmentQuestions);
router.post('/practice/submit-assignment', authenticate, practiceCtrl.submitAssignmentTest);
router.post('/questions/generate', authenticate, practiceCtrl.generateQuestions);



const scoringService = require('../services/scoringService');
router.post('/score/calculate', authenticate, scoringService.calculateConfidenceScore);
router.get('/score', authenticate, scoringService.getConfidenceScore);
router.get('/score/:userId', authenticate, scoringService.getConfidenceScore);
router.get('/score/:userId/risk', authenticate, scoringService.predictRisk);
router.get('/suggestions/:candidateId', authenticate, scoringService.generateInterviewSuggestions);

const rankingService = require('../services/rankingService');
router.get('/ranking', authenticate, rankingService.getRanking);
router.get('/ranking/group/:groupId', authenticate, rankingService.getGroupRanking);
router.post('/ranking/recalculate', authenticate, rankingService.triggerRecalculate);

const jobService = require('../services/jobService');
router.get('/jobs', authenticate, jobService.getJobs);
router.post('/jobs/analyze', authenticate, jobService.analyzeJobRole);
router.post('/jobs/refresh', authenticate, jobService.refreshJobs);

const evalCtrl = require('../controllers/evaluationController');
router.get('/evaluations/hr/:candidateId', authenticate, requireRole('hr'), evalCtrl.getHREvaluation);
router.post('/evaluations/hr/:candidateId', authenticate, requireRole('hr'), evalCtrl.saveHREvaluation);
router.get('/evaluations/teacher/:candidateId', authenticate, evalCtrl.getTeacherFeedbacks);
router.post('/evaluations/teacher/:candidateId', authenticate, requireRole('teacher'), evalCtrl.saveTeacherFeedback);

const groupCtrl = require('../controllers/groupController');
router.post('/workspaces', authenticate, requireRole('mentor'), groupCtrl.createWorkspace);
router.get('/workspaces', authenticate, groupCtrl.getMyWorkspaces);
router.delete('/workspaces/:id', authenticate, requireRole('mentor'), groupCtrl.deleteWorkspace);
router.get('/workspaces/teacher', authenticate, requireRole('teacher'), groupCtrl.getTeacherWorkspaces);
router.post('/groups', authenticate, requireRole('mentor'), groupCtrl.createGroup);
router.get('/groups', authenticate, groupCtrl.getGroups);
router.get('/my-groups', authenticate, requireRole('candidate'), groupCtrl.getMyGroups);
router.patch('/groups/:id/archive', authenticate, requireRole('mentor'), groupCtrl.archiveGroup);
router.get('/groups/:groupId/members', authenticate, groupCtrl.getGroupMembers);
router.post('/groups/members/add', authenticate, requireRole('mentor'), groupCtrl.addMembersByEmail);
router.post('/groups/teacher/add', authenticate, requireRole('mentor'), groupCtrl.addTeacherToGroup);
router.post('/groups/members/remove', authenticate, requireRole('mentor'), groupCtrl.removeMember);
router.post('/groups/invites', authenticate, requireRole('mentor'), groupCtrl.sendInvites);
router.get('/groups/:groupId/export', authenticate, groupCtrl.exportGroupReport);
router.get('/groups/:groupId/questions', authenticate, groupCtrl.getGroupQuestions);
router.post('/announcements', authenticate, groupCtrl.createAnnouncement);
router.get('/groups/:groupId/announcements', authenticate, groupCtrl.getGroupAnnouncements);
router.get('/workspaces/:workspaceId/compare', authenticate, groupCtrl.getWorkspaceComparison);
router.get('/groups/:groupId/analytics', authenticate, (req, res, next) => {
  if (!['mentor', 'teacher'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  next();
}, groupCtrl.getAssignmentAnalytics);

const hrCtrl = require('../controllers/hrController');
router.get('/hr/candidates', authenticate, requireRole('hr'), hrCtrl.searchCandidates);
router.get('/hr/candidates/:id', authenticate, requireRole('hr'), hrCtrl.getCandidateDetail);
router.post('/hr/match', authenticate, requireRole('hr'), hrCtrl.matchRequirements);
router.post('/hr/shortlist/:candidateId', authenticate, requireRole('hr'), evalCtrl.saveHREvaluation);
router.delete('/hr/shortlist/:candidateId', authenticate, requireRole('hr'), hrCtrl.removeShortlist);
router.get('/hr/shortlist', authenticate, requireRole('hr'), hrCtrl.getShortlist);
router.get('/hr/analytics', authenticate, requireRole('hr'), hrCtrl.getAnalytics);

// Teacher can view candidate profiles
router.get('/teacher/candidates/:id', authenticate, requireRole('teacher'), async (req, res) => {
  req.params.id = req.params.id;
  return hrCtrl.getCandidateDetail(req, res);
});

// Mentor can view candidate profiles
router.get('/mentor/candidates/:id', authenticate, requireRole('mentor'), async (req, res) => {
  req.params.id = req.params.id; 
  return hrCtrl.getCandidateDetail(req, res);
});

const mockInterviewCtrl = require('../controllers/mockInterviewController');
router.get('/mock-interview/questions', authenticate, requireRole('candidate'), mockInterviewCtrl.generateQuestions);
router.post('/mock-interview/evaluate', authenticate, requireRole('candidate'), mockInterviewCtrl.evaluateResponse);
router.post('/mock-interview/session', authenticate, requireRole('candidate'), mockInterviewCtrl.saveSession);
router.get('/mock-interview/history', authenticate, requireRole('candidate'), mockInterviewCtrl.getHistory);


const scoringCtrl = require('../controllers/scoringController');
router.post('/trust-score/calculate', authenticate, requireRole('candidate'), scoringCtrl.calculateTrustIndex);
router.get('/trust-score', authenticate, scoringCtrl.getTrustScore);
router.get('/trust-score/:userId', authenticate, scoringCtrl.getTrustScore);

const interviewCtrl = require('../controllers/interviewController');
router.post('/interviews', authenticate, requireRole('hr'), interviewCtrl.scheduleInterview);
router.get('/interviews', authenticate, interviewCtrl.getMyInterviews);
router.patch('/interviews/:id', authenticate, requireRole('hr'), interviewCtrl.updateInterview);
router.get('/interview-contacts', authenticate, interviewCtrl.getMyInterviewContacts);
router.post('/messages', authenticate, interviewCtrl.sendMessage);
router.get('/messages/conversations', authenticate, interviewCtrl.getMyConversations);
router.get('/messages/:userId', authenticate, interviewCtrl.getConversation);
router.get('/messages/:userId', authenticate, interviewCtrl.getConversation);

// Generic Attachment Upload for Mentor/Teacher (announcements, questions)
const { uploadAttachment } = require('../middleware/upload');
router.post('/upload/attachment', authenticate, uploadAttachment.single('file'), handleUploadError, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/attachments/${req.file.filename}` });
});

const bulkUploadCtrl = require('../controllers/bulkUploadController');
const multer = require('multer');
const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({ storage: memoryStorage });

router.post('/practice/parse-pdf-mcqs', authenticate, (req, res, next) => {
  if (!['mentor', 'teacher', 'hr'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  next();
}, uploadMemory.single('file'), bulkUploadCtrl.parsePdfMcqs);

// ── BACKGROUND JOBS ──
const jobCtrl = require('../controllers/jobController');
const notificationController = require('../controllers/notificationController');
router.get('/jobs/status/:id', authenticate, jobCtrl.getJobStatus);

// 12. NOTIFICATIONS
router.get('/notifications', authenticate, notificationController.getNotifications);
router.patch('/notifications/:id/read', authenticate, notificationController.markAsRead);
router.patch('/notifications/read-all', authenticate, notificationController.markAllRead);

const debugCtrl = require('../controllers/debugController');
router.get('/debug/db', debugCtrl.dbCheck);
router.get('/debug/firebase', async (req, res) => {
  try {
    const { db } = require('../config/firebase');
    const snap = await db.collection('users').limit(1).get();
    res.json({ 
      ok: true, 
      docs: snap.size, 
      has_sa: !!process.env.FIREBASE_SERVICE_ACCOUNT,
      project: process.env.GOOGLE_CLOUD_PROJECT || 'none'
    });
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack, has_sa: !!process.env.FIREBASE_SERVICE_ACCOUNT });
  }
});
router.post('/debug/log', (req, res, next) => {
  next();
}, debugCtrl.log);

module.exports = router;
