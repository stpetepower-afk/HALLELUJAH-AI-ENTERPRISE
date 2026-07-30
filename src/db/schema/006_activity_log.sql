-- src/db/schema/006_activity_log.sql
-- Speculative module, built on explicit override -- see Documents/HANDOFF.md.
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id),
  actor_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  detail TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_log_case_id ON activity_log (case_id);
