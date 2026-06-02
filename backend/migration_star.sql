-- Add table for starred questions
CREATE TABLE IF NOT EXISTS starred_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

-- Add progress_events if not exists (already in schema.sql but good to be safe)
CREATE TABLE IF NOT EXISTS progress_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  event_title VARCHAR(255) NOT NULL,
  event_detail TEXT,
  points_gained INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
