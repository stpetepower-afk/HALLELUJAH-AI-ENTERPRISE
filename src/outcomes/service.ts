// src/outcomes/service.ts
// Speculative module, built on explicit override -- see Documents/HANDOFF.md.
import { getPool } from "../db/pool";
import type { Outcome } from "./types";

export class OutcomeError extends Error {}

export interface UpsertOutcomeInput {
  caseId: string;
  metric: string;
  baselineValue?: string;
  currentValue?: string;
  unit?: string;
}

// One row per (case, metric) -- calling this again for the same metric
// updates it rather than creating a duplicate history row. If per-check-in
// history turns out to matter, that's a real reason to revisit this shape.
export async function upsertOutcome(input: UpsertOutcomeInput): Promise<Outcome> {
  if (!input.metric.trim()) throw new OutcomeError("metric is required");
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO outcomes (case_id, metric, baseline_value, current_value, unit)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (case_id, metric) DO UPDATE SET
       baseline_value = COALESCE(EXCLUDED.baseline_value, outcomes.baseline_value),
       current_value = COALESCE(EXCLUDED.current_value, outcomes.current_value),
       unit = COALESCE(EXCLUDED.unit, outcomes.unit),
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [input.caseId, input.metric, input.baselineValue ?? null, input.currentValue ?? null, input.unit ?? null]
  );
  return toOutcome(result.rows[0]);
}

export async function listOutcomesForCase(caseId: string): Promise<Outcome[]> {
  const pool = getPool();
  const result = await pool.query(
    "SELECT * FROM outcomes WHERE case_id = $1 ORDER BY metric",
    [caseId]
  );
  return result.rows.map(toOutcome);
}

function toOutcome(row: {
  id: string;
  case_id: string;
  metric: string;
  baseline_value: string | null;
  current_value: string | null;
  unit: string | null;
  updated_at: string;
}): Outcome {
  return {
    id: row.id,
    caseId: row.case_id,
    metric: row.metric,
    baselineValue: row.baseline_value,
    currentValue: row.current_value,
    unit: row.unit,
    updatedAt: row.updated_at,
  };
}
