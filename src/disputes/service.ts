// src/disputes/service.ts
import { getPool } from "../db/pool";
import type { Dispute, Bureau, DisputeStatus } from "./types";

export class DisputeError extends Error {}

const VALID_BUREAUS: Bureau[] = ["equifax", "experian", "transunion"];
const VALID_STATUSES: DisputeStatus[] = ["draft", "sent", "pending", "resolved", "rejected"];

export interface CreateDisputeInput {
  caseId: string;
  bureau: Bureau;
  creditorName: string;
  accountReference?: string;
  reason: string;
}

export async function createDispute(input: CreateDisputeInput): Promise<Dispute> {
  if (!VALID_BUREAUS.includes(input.bureau)) throw new DisputeError("Invalid bureau");
  if (!input.creditorName.trim()) throw new DisputeError("creditorName is required");
  if (!input.reason.trim()) throw new DisputeError("reason is required");

  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO disputes (case_id, bureau, creditor_name, account_reference, reason)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.caseId, input.bureau, input.creditorName, input.accountReference ?? null, input.reason]
  );
  return toDispute(result.rows[0]);
}

export async function listDisputesForCase(caseId: string): Promise<Dispute[]> {
  const pool = getPool();
  const result = await pool.query(
    "SELECT * FROM disputes WHERE case_id = $1 ORDER BY created_at DESC",
    [caseId]
  );
  return result.rows.map(toDispute);
}

export async function getDispute(id: string): Promise<Dispute | null> {
  const pool = getPool();
  const result = await pool.query("SELECT * FROM disputes WHERE id = $1", [id]);
  return result.rows[0] ? toDispute(result.rows[0]) : null;
}

export interface DisputeUpdate {
  status?: DisputeStatus;
  outcomeNotes?: string;
}

export async function updateDispute(id: string, update: DisputeUpdate): Promise<Dispute | null> {
  if (update.status && !VALID_STATUSES.includes(update.status)) throw new DisputeError("Invalid status");

  const fields: string[] = [];
  const params: unknown[] = [];
  const set = (column: string, value: unknown) => {
    params.push(value);
    fields.push(`${column} = $${params.length}`);
  };

  if (update.status !== undefined) {
    set("status", update.status);
    if (update.status === "sent") set("sent_at", new Date().toISOString());
    if (update.status === "resolved" || update.status === "rejected") {
      set("resolved_at", new Date().toISOString());
    }
  }
  if (update.outcomeNotes !== undefined) set("outcome_notes", update.outcomeNotes);

  if (!fields.length) throw new DisputeError("No fields to update");

  params.push(id);
  const pool = getPool();
  const result = await pool.query(
    `UPDATE disputes SET ${fields.join(", ")} WHERE id = $${params.length} RETURNING *`,
    params
  );
  return result.rows[0] ? toDispute(result.rows[0]) : null;
}

function toDispute(row: {
  id: string;
  case_id: string;
  bureau: Bureau;
  creditor_name: string;
  account_reference: string | null;
  reason: string;
  status: DisputeStatus;
  outcome_notes: string | null;
  created_at: string;
  sent_at: string | null;
  resolved_at: string | null;
}): Dispute {
  return {
    id: row.id,
    caseId: row.case_id,
    bureau: row.bureau,
    creditorName: row.creditor_name,
    accountReference: row.account_reference,
    reason: row.reason,
    status: row.status,
    outcomeNotes: row.outcome_notes,
    createdAt: row.created_at,
    sentAt: row.sent_at,
    resolvedAt: row.resolved_at,
  };
}
