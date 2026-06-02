-- Performance Optimization: Add indexes to speed up user-specific queries
-- This resolves the 1.4s delays in GET /api/profile and related routes

-- 1. Profiles & Settings
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_settings_user_id ON privacy_settings(user_id);

-- 2. Professional Details
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON skills(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_experience_user_id ON experience(user_id);
CREATE INDEX IF NOT EXISTS idx_education_user_id ON education(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_coding_platforms_user_id ON coding_platforms(user_id);

-- 3. Verification & Scores
CREATE INDEX IF NOT EXISTS idx_skill_verifications_user_id ON skill_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_confidence_scores_user_id ON confidence_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_github_data_user_id ON github_data(user_id);
CREATE INDEX IF NOT EXISTS idx_leetcode_data_user_id ON leetcode_data(user_id);

-- 4. Activity & Evaluation
CREATE INDEX IF NOT EXISTS idx_progress_events_user_id ON progress_events(user_id);
CREATE INDEX IF NOT EXISTS idx_hr_evaluations_candidate_id ON hr_evaluations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_hr_evaluations_hr_id ON hr_evaluations(hr_id);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_user_id ON practice_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);

-- 5. Messaging & Interviews
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_hr_id ON interviews(hr_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
