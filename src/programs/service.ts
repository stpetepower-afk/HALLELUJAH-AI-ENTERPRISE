// src/programs/service.ts
// Speculative module, built on explicit override -- see Documents/HANDOFF.md.
import { getPool } from "../db/pool";
import type { CaseProgram, CaseProgramStatus, Program } from "./types";

export class ProgramError extends Error {}

const VALID_STATUSES: CaseProgramStatus[] = ["enrolled", "completed", "dropped"];

export async function listPrograms(): Promise<Program[]> {
  const pool = getPool();
  const result = await pool.query("SELECT * FROM programs ORDER BY name");
  return result.rows.map((row: { id: string; name: string; category: string | null }) => ({
    id: row.id,
    name: row.name,
    category: row.category,
  }));
}

export async function enrollCaseInProgram(
  caseId: string,
  programId: string,
  provider?: string
): Promise<CaseProgram> {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO case_programs (case_id, program_id, provider)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [caseId, programId, provider ?? null]
  );
  return toCaseProgramRow(pool, result.rows[0]);
}

export async function listProgramsForCase(caseId: string): Promise<CaseProgram[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT case_programs.*, programs.name AS program_name
     FROM case_programs
     JOIN programs ON programs.id = case_programs.program_id
     WHERE case_programs.case_id = $1
     ORDER BY enrolled_at DESC`,
    [caseId]
  );
  return result.rows.map(toCaseProgram);
}

export async function updateCaseProgramStatus(
  id: string,
  status: CaseProgramStatus
): Promise<CaseProgram | null> {
  if (!VALID_STATUSES.includes(status)) throw new ProgramError("Invalid status");
  const pool = getPool();
  const result = await pool.query(
    `UPDATE case_programs SET status = $1, completed_at = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
     WHERE id = $2 RETURNING *`,
    [status, id]
  );
  if (!result.rows[0]) return null;
  return toCaseProgramRow(pool, result.rows[0]);
}

async function toCaseProgramRow(
  pool: ReturnType<typeof getPool>,
  row: {
    id: string;
    case_id: string;
    program_id: string;
    status: CaseProgramStatus;
    provider: string | null;
    enrolled_at: string;
    completed_at: string | null;
  }
): Promise<CaseProgram> {
  const programResult = await pool.query("SELECT name FROM programs WHERE id = $1", [row.program_id]);
  return toCaseProgram({ ...row, program_name: programResult.rows[0]?.name ?? "" });
}

function toCaseProgram(row: {
  id: string;
  case_id: string;
  program_id: string;
  program_name: string;
  status: CaseProgramStatus;
  provider: string | null;
  enrolled_at: string;
  completed_at: string | null;
}): CaseProgram {
  return {
    id: row.id,
    caseId: row.case_id,
    programId: row.program_id,
    programName: row.program_name,
    status: row.status,
    provider: row.provider,
    enrolledAt: row.enrolled_at,
    completedAt: row.completed_at,
  };
}
