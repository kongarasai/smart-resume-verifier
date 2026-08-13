-- Smart Resume Truth Verifier — Full Platform Schema v2
-- Run: psql -d smart_resume_verifier -f schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- USERS (roles: candidate, mentor, teacher, hr)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('candidate', 'mentor', 'teacher', 'hr')),
  full_name VARCHAR(255) NOT NULL,
  photo_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP
);

-- PROFILES (candidate extended info)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  headline VARCHAR(255),
  phone VARCHAR(30),
  location VARCHAR(255),
  bio TEXT,
  years_experience INTEGER DEFAULT 0,
  linkedin_url VARCHAR(500),
  github_url VARCHAR(500),
  leetcode_url VARCHAR(500),
  resume_url VARCHAR(500),
  resume_filename VARCHAR(255),
  resume_parsed_at TIMESTAMP,
  profile_completeness INTEGER DEFAULT 0,
  career_readiness VARCHAR(30) DEFAULT 'beginner',
  job_readiness_score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- HR PROFILES
CREATE TABLE hr_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  company_name VARCHAR(255),
  designation VARCHAR(255),
  company_website VARCHAR(500),
  linkedin_url VARCHAR(500),
  hiring_interests TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- PRIVACY SETTINGS
CREATE TABLE privacy_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  allow_hr_view BOOLEAN DEFAULT TRUE,
  allow_mentor_view BOOLEAN DEFAULT TRUE,
  public_profile BOOLEAN DEFAULT FALSE,
  show_skills_public BOOLEAN DEFAULT TRUE,
  show_github BOOLEAN DEFAULT TRUE,
  show_leetcode BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SKILLS (UNIQUE per user+name+source — no duplicates within same source)
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  source VARCHAR(50) NOT NULL CHECK (source IN ('resume', 'github', 'manual', 'leetcode', 'practice')),
  proficiency_level VARCHAR(20) CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  verification_level VARCHAR(20) DEFAULT 'claimed' CHECK (verification_level IN ('claimed', 'evidence', 'verified', 'expert')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, name, source)
);

-- PROJECTS
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  project_url VARCHAR(500),
  github_url VARCHAR(500),
  technologies TEXT[],
  source VARCHAR(30) CHECK (source IN ('resume', 'github', 'manual')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- EDUCATION
CREATE TABLE education (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  institution VARCHAR(255),
  degree VARCHAR(255),
  field_of_study VARCHAR(255),
  start_year INTEGER,
  end_year INTEGER,
  grade VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- EXPERIENCE
CREATE TABLE experience (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company VARCHAR(255),
  role VARCHAR(255),
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  description TEXT,
  technologies TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- CERTIFICATES
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  issuer VARCHAR(255),
  issue_date DATE,
  expiry_date DATE,
  credential_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- CODING PLATFORMS
CREATE TABLE coding_platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(100) NOT NULL,
  profile_url VARCHAR(500),
  username VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- GITHUB DATA
CREATE TABLE github_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  github_username VARCHAR(255),
  total_repos INTEGER DEFAULT 0,
  total_stars INTEGER DEFAULT 0,
  total_forks INTEGER DEFAULT 0,
  total_commits INTEGER DEFAULT 0,
  languages JSONB DEFAULT '{}',
  top_repos JSONB DEFAULT '[]',
  contribution_streak INTEGER DEFAULT 0,
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  account_created_at DATE,
  last_active DATE,
  skill_match_score INTEGER DEFAULT 0,
  raw_data JSONB,
  fetched_at TIMESTAMP DEFAULT NOW()
);

-- LEETCODE DATA
CREATE TABLE leetcode_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  leetcode_username VARCHAR(255),
  total_solved INTEGER DEFAULT 0,
  easy_solved INTEGER DEFAULT 0,
  medium_solved INTEGER DEFAULT 0,
  hard_solved INTEGER DEFAULT 0,
  acceptance_rate DECIMAL(5,2),
  languages_used TEXT[],
  contest_rating INTEGER,
  ranking INTEGER,
  coding_evidence_score INTEGER DEFAULT 0,
  extracted_at TIMESTAMP DEFAULT NOW()
);

-- WORKSPACES (mentor owns)
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- GROUPS (belongs to workspace, max 5 per workspace)
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  mentor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  max_members INTEGER DEFAULT 50,
  is_archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- GROUP MEMBERS (candidate can be in multiple groups)
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  added_by UUID REFERENCES users(id),
  role VARCHAR(20) DEFAULT 'candidate' CHECK (role IN ('candidate', 'teacher')),
  is_active BOOLEAN DEFAULT TRUE,
  removed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- INVITES
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ASSIGNMENTS (created by mentor)
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- QUESTIONS (created by mentor/teacher)
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID REFERENCES users(id),
  group_id UUID REFERENCES groups(id),
  assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('coding', 'aptitude', 'technical_mcq', 'hr', 'general')),
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  question_type VARCHAR(30) NOT NULL CHECK (question_type IN ('mcq', 'code', 'text')),
  options JSONB,
  correct_answer TEXT,
  points INTEGER DEFAULT 10,
  tags TEXT[],
  time_limit_seconds INTEGER DEFAULT 300,
  max_attempts INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- PRACTICE ATTEMPTS (anti-cheat: max 3 per question)
CREATE TABLE practice_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id),
  submitted_answer TEXT,
  is_correct BOOLEAN,
  score INTEGER DEFAULT 0,
  time_taken_seconds INTEGER,
  attempt_number INTEGER DEFAULT 1,
  attempted_at TIMESTAMP DEFAULT NOW()
);

-- PRACTICE SESSIONS
CREATE TABLE practice_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50),
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  score_percentage DECIMAL(5,2) DEFAULT 0,
  completed_at TIMESTAMP DEFAULT NOW()
);

-- RANKINGS (per group and overall)
CREATE TABLE rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  rank_position INTEGER,
  total_score DECIMAL(10,2) DEFAULT 0,
  practice_score DECIMAL(10,2) DEFAULT 0,
  github_score DECIMAL(10,2) DEFAULT 0,
  leetcode_score DECIMAL(10,2) DEFAULT 0,
  project_score DECIMAL(10,2) DEFAULT 0,
  skill_score DECIMAL(10,2) DEFAULT 0,
  activity_score DECIMAL(10,2) DEFAULT 0,
  previous_rank INTEGER,
  rank_change INTEGER DEFAULT 0,
  calculated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);

-- OVERALL RANKINGS (across all groups)
CREATE TABLE overall_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  rank_position INTEGER,
  total_score DECIMAL(10,2) DEFAULT 0,
  previous_rank INTEGER,
  rank_change INTEGER DEFAULT 0,
  calculated_at TIMESTAMP DEFAULT NOW()
);

-- CONFIDENCE SCORES
CREATE TABLE confidence_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  github_score INTEGER DEFAULT 0,
  practice_score INTEGER DEFAULT 0,
  coding_evidence_score INTEGER DEFAULT 0,
  profile_completeness_score INTEGER DEFAULT 0,
  project_score INTEGER DEFAULT 0,
  overall_score INTEGER DEFAULT 0,
  confidence_label VARCHAR(50),
  skill_gaps JSONB DEFAULT '[]',
  weak_areas JSONB DEFAULT '[]',
  calculated_at TIMESTAMP DEFAULT NOW()
);

-- SKILL EVIDENCE
CREATE TABLE skill_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  skill_name VARCHAR(100) NOT NULL,
  github_evidence JSONB DEFAULT '{}',
  practice_evidence JSONB DEFAULT '{}',
  leetcode_evidence JSONB DEFAULT '{}',
  resume_evidence JSONB DEFAULT '{}',
  evidence_score INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, skill_name)
);

-- JOB LISTINGS (fetched from APIs)
CREATE TABLE job_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id VARCHAR(255),
  title VARCHAR(500) NOT NULL,
  company VARCHAR(255),
  location VARCHAR(255),
  description TEXT,
  required_skills TEXT[],
  salary_range VARCHAR(255),
  job_type VARCHAR(50),
  apply_url VARCHAR(1000),
  source_platform VARCHAR(100),
  fetched_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(external_id, source_platform)
);

-- INTERVIEWS
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES users(id) ON DELETE CASCADE,
  hr_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  mode VARCHAR(30) NOT NULL CHECK (mode IN ('video', 'phone', 'in_person', 'technical')),
  status VARCHAR(30) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  notes TEXT,
  meeting_link VARCHAR(500),
  risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- MESSAGES
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  interview_id UUID REFERENCES interviews(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  related_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ACTIVITY LOGS
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- PROGRESS TIMELINE
CREATE TABLE progress_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  event_title VARCHAR(255) NOT NULL,
  event_detail TEXT,
  points_gained INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RESUME PARSE RESULTS
CREATE TABLE resume_parse_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  raw_text TEXT,
  parsed_skills TEXT[],
  parsed_experience JSONB DEFAULT '[]',
  parsed_education JSONB DEFAULT '[]',
  parsed_projects JSONB DEFAULT '[]',
  parsed_at TIMESTAMP DEFAULT NOW()
);

-- INTERVIEW SUGGESTIONS
CREATE TABLE interview_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES users(id),
  hr_id UUID REFERENCES users(id),
  suggested_questions JSONB DEFAULT '[]',
  based_on_weak_areas TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- MENTOR NOTES ON CANDIDATES
CREATE TABLE mentor_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id UUID REFERENCES users(id),
  candidate_id UUID REFERENCES users(id),
  group_id UUID REFERENCES groups(id),
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ANNOUNCEMENTS
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID REFERENCES users(id),
  group_id UUID REFERENCES groups(id),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_skills_user ON skills(user_id);
CREATE INDEX idx_skills_user_name_source ON skills(user_id, name, source);
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_practice_attempts_user ON practice_attempts(user_id);
CREATE INDEX idx_practice_attempts_user_question ON practice_attempts(user_id, question_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_interviews_candidate ON interviews(candidate_id);
CREATE INDEX idx_interviews_hr ON interviews(hr_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_confidence_user ON confidence_scores(user_id);
CREATE INDEX idx_rankings_user ON rankings(user_id);
CREATE INDEX idx_rankings_group ON rankings(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_progress_events_user ON progress_events(user_id);
CREATE INDEX idx_job_listings_source ON job_listings(source_platform);

-- DEFAULT QUESTIONS SEED
INSERT INTO questions (category, difficulty, title, description, question_type, options, correct_answer, points, tags) VALUES
('coding', 'easy', 'Two Sum', 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.', 'code', NULL, NULL, 10, ARRAY['array', 'hashmap']),
('coding', 'medium', 'Longest Substring Without Repeating Characters', 'Given a string s, find the length of the longest substring without repeating characters.', 'code', NULL, NULL, 20, ARRAY['string', 'sliding-window']),
('aptitude', 'easy', 'Speed and Distance', 'A train travels at 60 km/h. How long will it take to cover 180 km?', 'mcq', '[{"id":"a","text":"2 hours"},{"id":"b","text":"3 hours"},{"id":"c","text":"4 hours"},{"id":"d","text":"2.5 hours"}]', 'b', 10, ARRAY['speed', 'time']),
('technical_mcq', 'medium', 'REST API Methods', 'Which HTTP method is idempotent but NOT safe?', 'mcq', '[{"id":"a","text":"GET"},{"id":"b","text":"POST"},{"id":"c","text":"PUT"},{"id":"d","text":"DELETE"}]', 'c', 20, ARRAY['http', 'rest']),
('technical_mcq', 'easy', 'Database Normalization', 'Which normal form removes partial dependencies?', 'mcq', '[{"id":"a","text":"1NF"},{"id":"b","text":"2NF"},{"id":"c","text":"3NF"},{"id":"d","text":"BCNF"}]', 'b', 10, ARRAY['database', 'normalization']),
('hr', 'easy', 'Conflict Resolution', 'Describe a situation where you had a conflict with a team member and how you resolved it.', 'text', NULL, NULL, 10, ARRAY['behavioral', 'teamwork']),
('coding', 'hard', 'LRU Cache', 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement get(key) and put(key,value).', 'code', NULL, NULL, 30, ARRAY['design', 'cache', 'linkedlist']),
('aptitude', 'medium', 'Probability', 'A bag contains 3 red and 5 blue balls. What is the probability of picking 2 red balls without replacement?', 'mcq', '[{"id":"a","text":"3/28"},{"id":"b","text":"3/56"},{"id":"c","text":"1/14"},{"id":"d","text":"3/8"}]', 'a', 20, ARRAY['probability', 'combinations']),
('technical_mcq', 'hard', 'Distributed Systems', 'In a microservices architecture, which pattern handles distributed transactions without two-phase commit?', 'mcq', '[{"id":"a","text":"Two-phase commit"},{"id":"b","text":"Saga pattern"},{"id":"c","text":"Event sourcing only"},{"id":"d","text":"Synchronous REST calls"}]', 'b', 30, ARRAY['microservices', 'distributed']),
('technical_mcq', 'medium', 'Big O Notation', 'What is the time complexity of binary search on a sorted array of n elements?', 'mcq', '[{"id":"a","text":"O(n)"},{"id":"b","text":"O(n²)"},{"id":"c","text":"O(log n)"},{"id":"d","text":"O(1)"}]', 'c', 20, ARRAY['algorithms', 'searching']);

-- Added tables for bug fixes
CREATE TABLE IF NOT EXISTS teacher_feedbacks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    candidate_id UUID REFERENCES users(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notes TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hr_evaluations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    candidate_id UUID REFERENCES users(id) ON DELETE CASCADE,
    hr_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- MOCK INTERVIEW SESSIONS
CREATE TABLE IF NOT EXISTS mock_interview_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    overall_score INTEGER,
    feedback JSONB, -- array of question/answer/evaluation objects
    questions_count INTEGER,
    completed_at TIMESTAMP DEFAULT NOW()
);

-- RESUME FEEDBACK
CREATE TABLE IF NOT EXISTS resume_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER,
    feedback JSONB, -- stores list of suggestions
    calculated_at TIMESTAMP DEFAULT NOW()
);
