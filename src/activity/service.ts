// src/activity/service.ts
// Speculative module, built on explicit override -- see Documents/HANDOFF.md.
import { getPool } from "../db/pool";
import type { ActivityEntry } from "./types";

export async function recordActivity(
  caseId: string,
  actorId: string | null,
  action: string,
  detail?: string
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO activity_log (case_id, actor_id, action, detail) VALUES ($1, $2, $3, $4)`,
    [caseId, actorId, action, detail ?? null]
  );
}

export async function listActivityForCase(caseId: string): Promise<ActivityEntry[]> {
  const pool = getPool();
  const result = await pool.query(
    "SELECT * FROM activity_log WHERE case_id = $1 ORDER BY created_at DESC",
    [caseId]
  );
  return result.rows.map(toEntry);
}

function toEntry(row: {
  id: string;
  case_id: string;
  actor_id: string | null;
  action: string;
  detail: string | null;
  created_at: string;
}): ActivityEntry {
  return {
    id: row.id,
    caseId: row.case_id,
    actorId: row.actor_id,
    action: row.action,
    detail: row.detail,
    createdAt: row.created_at,
  };
}
