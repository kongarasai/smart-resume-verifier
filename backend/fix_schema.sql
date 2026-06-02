-- Fix Schema: Create missing tables for Smart Resume Verifier

-- 1. Mock Interview Sessions
CREATE TABLE IF NOT EXISTS mock_interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    overall_score INTEGER,
    feedback JSONB,
    questions_count INTEGER,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Resume Feedback
CREATE TABLE IF NOT EXISTS resume_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER,
    feedback JSONB,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Trust Scores
CREATE TABLE IF NOT EXISTS trust_scores (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    overall_trust_index INTEGER,
    resume_score INTEGER,
    github_score INTEGER,
    interview_score INTEGER,
    fraud_risk_level VARCHAR(20) DEFAULT 'low',
    last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_mock_sessions_user ON mock_interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_feedback_user ON resume_feedback(user_id);
