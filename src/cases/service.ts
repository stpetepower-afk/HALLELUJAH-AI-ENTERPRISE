// src/cases/service.ts
import { getPool } from "../db/pool";
import type { Case, CasePriority } from "./types";

export class CaseError extends Error {}

const VALID_PRIORITIES: CasePriority[] = ["low", "medium", "high", "urgent"];

export interface CreateCaseInput {
  userId: string;
  priority?: CasePriority;
  currentStage?: string;
  readinessStartScore?: number;
  assignedCoach?: string;
}

export interface CaseUpdate {
  status?: "active" | "closed";
  priority?: CasePriority;
  assignedCoach?: string;
  currentStage?: string;
  nextBestAction?: string;
  readinessCurrentScore?: number;
}

export async function createCase(input: CreateCaseInput): Promise<Case> {
  if (input.priority && !VALID_PRIORITIES.includes(input.priority)) {
    throw new CaseError("Invalid priority");
  }
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO cases (user_id, priority, current_stage, readiness_start_score, readiness_current_score, assigned_coach)
     VALUES ($1, $2, $3, $4, $4, $5)
     RETURNING *`,
    [
      input.userId,
      input.priority ?? null,
      input.currentStage ?? null,
      input.readinessStartScore ?? null,
      input.assignedCoach ?? null,
    ]
  );
  return toCase(result.rows[0]);
}

export async function getCase(id: string): Promise<Case | null> {
  const pool = getPool();
  const result = await pool.query("SELECT * FROM cases WHERE id = $1", [id]);
  return result.rows[0] ? toCase(result.rows[0]) : null;
}

export async function listCases(filter: { assignedCoach?: string; userId?: string }): Promise<Case[]> {
  const pool = getPool();
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (filter.assignedCoach) {
    params.push(filter.assignedCoach);
    conditions.push(`assigned_coach = $${params.length}`);
  }
  if (filter.userId) {
    params.push(filter.userId);
    conditions.push(`user_id = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await pool.query(`SELECT * FROM cases ${where} ORDER BY opened_at DESC`, params);
  return result.rows.map(toCase);
}

export async function updateCase(id: string, update: CaseUpdate): Promise<Case | null> {
  if (update.priority && !VALID_PRIORITIES.includes(update.priority)) {
    throw new CaseError("Invalid priority");
  }

  const fields: string[] = [];
  const params: unknown[] = [];
  const set = (column: string, value: unknown) => {
    params.push(value);
    fields.push(`${column} = $${params.length}`);
  };

  if (update.status !== undefined) set("status", update.status);
  if (update.priority !== undefined) set("priority", update.priority);
  if (update.assignedCoach !== undefined) set("assigned_coach", update.assignedCoach);
  if (update.currentStage !== undefined) set("current_stage", update.currentStage);
  if (update.nextBestAction !== undefined) set("next_best_action", update.nextBestAction);
  if (update.readinessCurrentScore !== undefined) set("readiness_current_score", update.readinessCurrentScore);
  if (update.status === "closed") set("completed_at", new Date().toISOString());

  if (!fields.length) throw new CaseError("No fields to update");

  params.push(id);
  const pool = getPool();
  const result = await pool.query(
    `UPDATE cases SET ${fields.join(", ")} WHERE id = $${params.length} RETURNING *`,
    params
  );
  return result.rows[0] ? toCase(result.rows[0]) : null;
}

// Cases are archived, not hard-deleted — case history has to survive for outcome reporting.
export async function archiveCase(id: string): Promise<Case | null> {
  return updateCase(id, { status: "closed" });
}

function toCase(row: {
  id: string;
  user_id: string;
  status: Case["status"];
  priority: Case["priority"];
  assigned_coach: string | null;
  current_stage: string | null;
  next_best_action: string | null;
  readiness_start_score: number | null;
  readiness_current_score: number | null;
  opened_at: string;
  completed_at: string | null;
}): Case {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    priority: row.priority,
    assignedCoach: row.assigned_coach,
    currentStage: row.current_stage,
    nextBestAction: row.next_best_action,
    readinessStartScore: row.readiness_start_score,
    readinessCurrentScore: row.readiness_current_score,
    openedAt: row.opened_at,
    completedAt: row.completed_at,
  };
}
