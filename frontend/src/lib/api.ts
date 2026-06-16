import axios from 'axios';
import toast from 'react-hot-toast';

const cleanUrl = (url: string) => url.replace(/^"+|"+$/g, '').trim();
const rawApiUrl = 'https://smart-resume-backend-7jeu.onrender.com/api';
const API_URL = 'https://smart-resume-backend-7jeu.onrender.com/api/';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 60000, // Increased timeout for AI Generation requests
  headers: { 
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
});

// ── Request Interceptor: attach localStorage token + CSRF ──
api.interceptors.request.use((config) => {
  console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
  }
  if (typeof document !== 'undefined') {
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf-token='))
      ?.split('=')[1];
    if (csrfToken) config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

// Unwrap helper to support both direct payload access and backward-compatible .data access
const unwrap = (r: any) => {
  const d = r.data;
  if (d && typeof d === 'object' && !('data' in d)) {
    Object.defineProperty(d, 'data', { value: d, enumerable: false, writable: true });
  }
  return d;
};

// ── Response Interceptor: global 401 redirect & Error Toasts ──
api.interceptors.response.use(
  (res) => {
    console.log(`[API SUCCESS] ${res.config.method?.toUpperCase()} ${res.config.url}`);
    return res;
  },
  (err) => {
    console.error(`[API ERROR] ${err.config?.method?.toUpperCase()} ${err.config?.url}`, err.response?.status);
    
    // Handle Network Timeouts & Server Drops
    if (err.code === 'ECONNABORTED' || err.message.includes('timeout') || err.message === 'Network Error') {
      if (typeof window !== 'undefined') toast.error('Connection to server lost. Please check your network.');
    } else if (err.response?.status >= 500) {
      if (typeof window !== 'undefined') toast.error(err.response.data?.error || 'The server encountered an error.');
    }

    if (
      err.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !window.location.pathname.includes('/auth/')
    ) {
      toast.error('Session expired. Please log in again.');
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(err);
  }
);

// ════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════
export const authAPI = {
  register: (data: any) => api.post('auth/register', data),
  login: (data: any) => api.post('auth/login', data),
  logout: () => api.post('auth/logout'),
  me: () => api.get('auth/me').then(unwrap),
};

// ════════════════════════════════════════════
// PROFILE
// ════════════════════════════════════════════
export const profileAPI = {
  get: (userId?: string) => api.get(userId ? `profile/${userId}` : 'profile').then(unwrap),
  update: (data: any) => api.put('profile', data).then(unwrap),
  uploadPhoto: (fileOrFormData: File | FormData) => {
    const formData = fileOrFormData instanceof FormData ? fileOrFormData : (() => { const fd = new FormData(); fd.append('photo', fileOrFormData); return fd; })();
    return api.post('profile/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(unwrap);
  },
  uploadResume: (fileOrFormData: File | FormData) => {
    const formData = fileOrFormData instanceof FormData ? fileOrFormData : (() => { const fd = new FormData(); fd.append('resume', fileOrFormData); return fd; })();
    return api.post('profile/resume', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(unwrap);
  },
  getTimeline: (userId?: string) => api.get(userId ? `profile/timeline/${userId}` : 'profile/timeline').then(unwrap),
  updatePrivacy: (data: any) => api.put('profile/privacy', data).then(unwrap),
  addSkill: (data: any) => api.post('skills', data).then(unwrap),
  deleteSkill: (id: string) => api.delete(`skills/${id}`).then(unwrap),
  addProject: (data: any) => api.post('projects', data).then(unwrap),
  deleteProject: (id: string) => api.delete(`projects/${id}`).then(unwrap),
  addEducation: (data: any) => api.post('education', data).then(unwrap),
  deleteEducation: (id: string) => api.delete(`education/${id}`).then(unwrap),
  addExperience: (data: any) => api.post('experience', data).then(unwrap),
  deleteExperience: (id: string) => api.delete(`experience/${id}`).then(unwrap),
  addCertificate: (data: any) => api.post('certificates', data).then(unwrap),
  getResumeFeedback: () => api.get('profile/resume-feedback').then(unwrap),
  deleteCertificate: (id: string) => api.delete(`certificates/${id}`).then(unwrap),
};

// ════════════════════════════════════════════
// AVAILABILITY
// ════════════════════════════════════════════
export const availabilityAPI = {
  update: (data: any) => api.put('profile/availability', data).then(unwrap),
};

// ════════════════════════════════════════════
// RESUME
// ════════════════════════════════════════════
export const resumeAPI = {
  parse: () => api.post('resume/parse').then(unwrap),
  getResult: (userId?: string) => api.get(userId ? `resume/parse/${userId}` : 'resume/parse').then(unwrap),
};

// ════════════════════════════════════════════
// SCORING
// ════════════════════════════════════════════
export const scoringAPI = {
  calculate: () => api.post('score/calculate').then(unwrap),
  get: (userId?: string) => api.get(userId ? `score/${userId}` : 'score').then(unwrap),
  getRisk: (userId: string) => api.get(`score/${userId}/risk`).then(unwrap),
  getSuggestions: (candidateId: string) => api.get(`suggestions/${candidateId}`).then(unwrap),
};

// ════════════════════════════════════════════
// TRUST SCORE
// ════════════════════════════════════════════
export const trustScoreAPI = {
  calculate: () => api.post('trust-score/calculate').then(unwrap),
  get: (userId?: string) => api.get(userId ? `trust-score/${userId}` : 'trust-score').then(unwrap),
};

// ════════════════════════════════════════════
// VERIFICATION
// ════════════════════════════════════════════
export const verificationAPI = {
  run: (userId?: string) => api.post(userId ? `verification/run/${userId}` : 'verification/run').then(unwrap),
  getSummary: (userId?: string) => api.get(userId ? `verification/summary/${userId}` : 'verification/summary').then(unwrap),
  getSkillEvidence: (skillName: string, userId?: string) =>
    api.get(userId ? `verification/skill/${userId}/${skillName}` : `verification/skill/${skillName}`).then(unwrap),
};

// ════════════════════════════════════════════
// GITHUB
// ════════════════════════════════════════════
export const githubAPI = {
  verify: (data?: any) => api.post('github/verify', data || {}).then(unwrap),
  getData: (userId?: string) => api.get(userId ? `github/data/${userId}` : 'github/data').then(unwrap),
};

// ════════════════════════════════════════════
// LEETCODE
// ════════════════════════════════════════════
export const leetcodeAPI = {
  verify: (data?: any) => api.post('leetcode/verify', data || {}).then(unwrap),
  getData: (userId?: string) => api.get(userId ? `leetcode/data/${userId}` : 'leetcode/data').then(unwrap),
};

// ════════════════════════════════════════════
// PRACTICE / QUESTIONS
// ════════════════════════════════════════════
export const practiceAPI = {
  getQuestions: (params?: any) => api.get('questions', { params }).then(unwrap),
  getQuestion: (id: string) => api.get(`questions/${id}`).then(unwrap),
  createQuestion: (data: any) => api.post('questions', data).then(unwrap),
  deleteQuestion: (id: string) => api.delete(`questions/${id}`).then(unwrap),
  bulkCreateQuestions: (data: any) => api.post('questions/bulk', data).then(unwrap),
  bulkDeleteQuestions: (data: any) => api.delete('questions/bulk', { data }).then(unwrap),
  generateQuestions: (data: any) => api.post('questions/generate', data).then(unwrap),
  startSession: (data: any) => api.post('practice/start', data).then(unwrap),
  submitAnswer: (data: any) => api.post('practice/submit', data).then(unwrap),
  endSession: (data: any) => api.post('practice/end', data).then(unwrap),
  submitAssignmentTest: (data: { assignment_id: string, answers: Record<string, string> }) => api.post('practice/submit-assignment', data).then(unwrap),
  runCode: (data: any) => api.post('practice/run-code', data).then(unwrap),
  getProgress: () => api.get('practice/progress').then(unwrap),
  toggleStar: (data: any) => api.post('practice/toggle-star', data).then(unwrap),
  getStarred: () => api.get('practice/starred').then(unwrap),
  getAssignments: () => api.get('practice/assignments').then(unwrap),
  getAssignmentQuestions: (groupId: string, assignmentId?: string) =>
    api.get(`practice/assignments/${groupId}`, { params: assignmentId ? { assignmentId } : {} }).then(unwrap),
  parsePdfMcqs: (fileOrFormData: File | FormData) => {
    const formData = fileOrFormData instanceof FormData ? fileOrFormData : (() => { const fd = new FormData(); fd.append('file', fileOrFormData); return fd; })();
    return api.post('practice/parse-pdf-mcqs', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(unwrap);
  },
  getHistory: () => api.get('practice/history').then(unwrap),
  getSessionAttempts: (sessionId: string) => api.get(`practice/history/${sessionId}`).then(unwrap),
};

// ════════════════════════════════════════════
// RANKING
// ════════════════════════════════════════════
export const rankingAPI = {
  get: () => api.get('ranking').then(unwrap),
  getGroup: (groupId: string) => api.get(`ranking/group/${groupId}`).then(unwrap),
  recalculate: () => api.post('ranking/recalculate').then(unwrap),
};

// ════════════════════════════════════════════
// GROUPS (Mentor)
// ════════════════════════════════════════════
export const groupAPI = {
  createWorkspace: (data: any) => api.post('workspaces', data).then(unwrap),
  getWorkspaces: () => api.get('workspaces').then(unwrap),
  deleteWorkspace: (id: string) => api.delete(`workspaces/${id}`).then(unwrap),
  getWorkspaceComparison: (id: string) => api.get(`workspaces/${id}/compare`).then(unwrap),
  createGroup: (data: any) => api.post('groups', data).then(unwrap),
  getGroups: () => api.get('groups').then(unwrap),
  archiveGroup: (id: string) => api.patch(`groups/${id}/archive`).then(unwrap),
  getMembers: (groupId: string) => api.get(`groups/${groupId}/members`).then(unwrap),
  addMembers: (data: any) => api.post('groups/members/add', data).then(unwrap),
  removeMember: (data: any) => api.post('groups/members/remove', data).then(unwrap),
  sendInvites: (data: any) => api.post('groups/invites', data).then(unwrap),
  exportReport: (groupId: string, format?: string) => api.get(`groups/${groupId}/export`, { params: format ? { format } : {} }).then(unwrap),
  getAnnouncements: (groupId: string) => api.get(`groups/${groupId}/announcements`).then(unwrap),
  createAnnouncement: (data: any) => api.post('announcements', data).then(unwrap),
  uploadAttachment: (fileOrFormData: File | FormData) => {
    const formData = fileOrFormData instanceof FormData ? fileOrFormData : (() => { const fd = new FormData(); fd.append('file', fileOrFormData); return fd; })();
    return api.post('upload/attachment', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(unwrap);
  },
};

// ════════════════════════════════════════════
// MENTOR
// ════════════════════════════════════════════
export const mentorAPI = {
  getCandidates: () => api.get('groups').then(unwrap),
  getCandidateDetail: (id: string) => api.get(`mentor/candidates/${id}`).then(unwrap),
  getCandidate: (id: string) => api.get(`mentor/candidates/${id}`).then(unwrap),
  addTeacher: (data: any) => api.post('groups/teacher/add', data).then(unwrap),
  getGroupQuestions: (groupId: string) => api.get(`groups/${groupId}/questions`).then(unwrap),
  getGroupAnalytics: (groupId: string) => api.get(`groups/${groupId}/analytics`).then(unwrap),
  getWorkspaceComparison: (workspaceId: string) => api.get(`workspaces/${workspaceId}/compare`).then(unwrap),
};

// ════════════════════════════════════════════
// TEACHER
// ════════════════════════════════════════════
export const teacherAPI = {
  getGroups: () => api.get('groups').then(unwrap),
  getWorkspaces: () => api.get('workspaces/teacher').then(unwrap),
  getGroupMembers: (groupId: string) => api.get(`groups/${groupId}/members`).then(unwrap),
  getGroupQuestions: (groupId: string) => api.get(`groups/${groupId}/questions`).then(unwrap),
  getGroupRanking: (groupId: string) => api.get(`ranking/group/${groupId}`).then(unwrap),
  getGroupAnalytics: (groupId: string) => api.get(`groups/${groupId}/analytics`).then(unwrap),
  getCandidateDetail: (id: string) => api.get(`teacher/candidates/${id}`).then(unwrap),
  getCandidate: (id: string) => api.get(`teacher/candidates/${id}`).then(unwrap),
  getWorkspaceComparison: (workspaceId: string) => api.get(`workspaces/${workspaceId}/compare`).then(unwrap),
  createQuestion: (data: any) => api.post('questions', data).then(unwrap),
};

// ════════════════════════════════════════════
// CANDIDATE GROUPS
// ════════════════════════════════════════════
export const candidateGroupAPI = {
  getMyGroups: () => api.get('my-groups').then(unwrap),
  getGroupMembers: (groupId: string) => api.get(`groups/${groupId}/members`).then(unwrap),
  getGroupQuestions: (groupId: string, assignmentId?: string) =>
    api.get(`practice/assignments/${groupId}`, { params: assignmentId ? { assignmentId } : {} }).then(unwrap),
  getGroupRanking: (groupId: string) => api.get(`ranking/group/${groupId}`).then(unwrap),
  getGroupAnnouncements: (groupId: string) => api.get(`groups/${groupId}/announcements`).then(unwrap),
};

// ════════════════════════════════════════════
// HR
// ════════════════════════════════════════════
export const hrAPI = {
  searchCandidates: (params?: any) => api.get('hr/candidates', { params }).then(unwrap),
  getCandidateDetail: (id: string) => api.get(`hr/candidates/${id}`).then(unwrap),
  getCandidate: (id: string) => api.get(`hr/candidates/${id}`).then(unwrap),
  matchRequirements: (data: any) => api.post('hr/match', data).then(unwrap),
  getShortlist: () => api.get('hr/shortlist').then(unwrap),
  getAnalytics: () => api.get('hr/analytics').then(unwrap),
  shortlistCandidate: (candidateId: string, data?: any) => api.post(`hr/shortlist/${candidateId}`, data || {}).then(unwrap),
  removeShortlist: (candidateId: string) => api.delete(`hr/shortlist/${candidateId}`).then(unwrap),
};

// ════════════════════════════════════════════
// HR PROFILE
// ════════════════════════════════════════════
export const hrProfileAPI = {
  get: () => api.get('hr-profile').then(unwrap),
  update: (data: any) => api.put('hr-profile', data).then(unwrap),
};

// ════════════════════════════════════════════
// EVALUATION
// ════════════════════════════════════════════
export const evaluationAPI = {
  getHR: (candidateId: string) => api.get(`evaluations/hr/${candidateId}`).then(unwrap),
  saveHR: (candidateId: string, data: any) => api.post(`evaluations/hr/${candidateId}`, data).then(unwrap),
  getTeacher: (candidateId: string) => api.get(`evaluations/teacher/${candidateId}`).then(unwrap),
  saveTeacher: (candidateId: string, data: any) => api.post(`evaluations/teacher/${candidateId}`, data).then(unwrap),
};

// ════════════════════════════════════════════
// INTERVIEWS
// ════════════════════════════════════════════
export const interviewAPI = {
  schedule: (data: any) => api.post('interviews', data).then(unwrap),
  getMy: () => api.get('interviews').then(unwrap),
  update: (id: string, data: any) => api.patch(`interviews/${id}`, data).then(unwrap),
  getContacts: () => api.get('interview-contacts').then(unwrap),
};

// ════════════════════════════════════════════
// MOCK INTERVIEW
// ════════════════════════════════════════════
export const mockInterviewAPI = {
  getQuestions: () => api.get('mock-interview/questions').then(unwrap),
  evaluate: (data: any) => api.post('mock-interview/evaluate', data).then(unwrap),
  saveSession: (data: any) => api.post('mock-interview/session', data).then(unwrap),
  getHistory: () => api.get('mock-interview/history').then(unwrap),
};

// ════════════════════════════════════════════
// MESSAGES
// ════════════════════════════════════════════
export const messageAPI = {
  send: (data: any) => api.post('messages', data).then(unwrap),
  getConversations: () => api.get('messages/conversations').then(unwrap),
  getConversation: (userId: string) => api.get(`messages/${userId}`).then(unwrap),
};

// ════════════════════════════════════════════
// JOBS
// ════════════════════════════════════════════
export const jobAPI = {
  getAll: (params?: any) => api.get('jobs', { params }).then(unwrap),
  analyze: (data: any) => api.post('jobs/analyze', data).then(unwrap),
  refresh: () => api.post('jobs/refresh').then(unwrap),
  getStatus: (jobId: string) => api.get(`jobs/status/${jobId}`).then(unwrap),
};

// ════════════════════════════════════════════
// NOTIFICATIONS
// ════════════════════════════════════════════
export const notificationAPI = {
  getAll: () => api.get('notifications').then(unwrap),
  markRead: (id: string) => api.patch(`notifications/${id}/read`).then(unwrap),
  markAllRead: () => api.patch('notifications/read-all').then(unwrap),
};

export default api;
