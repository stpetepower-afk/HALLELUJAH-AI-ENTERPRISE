-- src/db/schema/008_programs.sql
-- Speculative module, built on explicit override -- see Documents/HANDOFF.md.
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL UNIQUE,
  category VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS case_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id),
  program_id UUID NOT NULL REFERENCES programs(id),
  status VARCHAR(20) NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed', 'dropped')),
  provider VARCHAR(150),
  enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_case_programs_case_id ON case_programs (case_id);

-- Starting catalog, based on the household types discussed in the Oasis Campus
-- plan -- a guess at categories, not a validated list. Add/remove freely.
INSERT INTO programs (name, category) VALUES
  ('Financial coaching', 'financial'),
  ('Workforce training', 'employment'),
  ('Veteran services', 'veteran'),
  ('Wellness programs', 'wellness'),
  ('Housing support', 'housing'),
  ('Childcare assistance', 'family')
ON CONFLICT (name) DO NOTHING;
