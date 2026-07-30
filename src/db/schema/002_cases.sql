-- src/db/schema/002_cases.sql
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_coach UUID REFERENCES users(id),
  current_stage VARCHAR(100),
  next_best_action TEXT,
  readiness_start_score INTEGER,
  readiness_current_score INTEGER,
  opened_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cases_assigned_coach ON cases (assigned_coach);
CREATE INDEX IF NOT EXISTS idx_cases_user_id ON cases (user_id);
