-- V3 Patch — run after schema.sql if upgrading existing DB
-- Safe to run on fresh DB too (uses IF NOT EXISTS)

-- Candidate availability status
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability_updated_at TIMESTAMP;

-- Ranking change reason storage
ALTER TABLE rankings ADD COLUMN IF NOT EXISTS change_reasons JSONB DEFAULT '[]';
ALTER TABLE overall_rankings ADD COLUMN IF NOT EXISTS change_reasons JSONB DEFAULT '[]';

-- Interview status: add selected / rejected
-- (CHECK constraint altered to allow new values)
ALTER TABLE interviews DROP CONSTRAINT IF EXISTS interviews_status_check;
ALTER TABLE interviews ADD CONSTRAINT interviews_status_check 
  CHECK (status IN ('scheduled','completed','cancelled','rescheduled','selected','rejected'));

-- HR shortlist table
CREATE TABLE IF NOT EXISTS hr_shortlists (
  id SERIAL PRIMARY KEY,
  hr_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  candidate_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(hr_id, candidate_id)
);

-- Job sources table (track per-source fetch timestamps)
CREATE TABLE IF NOT EXISTS job_fetch_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source VARCHAR(100) NOT NULL,
  jobs_fetched INTEGER DEFAULT 0,
  fetched_at TIMESTAMP DEFAULT NOW()
);

-- Skill cross-source verification view (materialised as table for performance)
CREATE TABLE IF NOT EXISTS skill_verifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  skill_name VARCHAR(100) NOT NULL,
  has_resume BOOLEAN DEFAULT FALSE,
  has_github BOOLEAN DEFAULT FALSE,
  has_leetcode BOOLEAN DEFAULT FALSE,
  has_practice BOOLEAN DEFAULT FALSE,
  has_project BOOLEAN DEFAULT FALSE,
  source_count INTEGER DEFAULT 0,
  verification_level VARCHAR(20) DEFAULT 'claimed',
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_skill_verifications_user ON skill_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_hr_shortlists_hr ON hr_shortlists(hr_id);
