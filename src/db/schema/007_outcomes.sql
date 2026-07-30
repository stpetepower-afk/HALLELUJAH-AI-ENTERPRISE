-- src/db/schema/007_outcomes.sql
-- Speculative module, built on explicit override -- see Documents/HANDOFF.md.
-- Values are text, not numbers, on purpose: some metrics are numeric (credit
-- score), some are categorical (employment status) -- forcing one type would
-- be guessing at a shape nobody's validated yet.
CREATE TABLE IF NOT EXISTS outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id),
  metric VARCHAR(100) NOT NULL,
  baseline_value VARCHAR(100),
  current_value VARCHAR(100),
  unit VARCHAR(50),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (case_id, metric)
);

CREATE INDEX IF NOT EXISTS idx_outcomes_case_id ON outcomes (case_id);
