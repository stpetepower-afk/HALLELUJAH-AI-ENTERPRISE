-- src/db/schema/004_disputes.sql
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id),
  bureau VARCHAR(20) NOT NULL CHECK (bureau IN ('equifax', 'experian', 'transunion')),
  creditor_name VARCHAR(255) NOT NULL,
  account_reference VARCHAR(100),
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'pending', 'resolved', 'rejected')),
  outcome_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP,
  resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_disputes_case_id ON disputes (case_id);
