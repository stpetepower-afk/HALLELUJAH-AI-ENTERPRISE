// src/programs/types.ts
// Speculative module, built on explicit override -- see Documents/HANDOFF.md.
export interface Program {
  id: string;
  name: string;
  category: string | null;
}

export type CaseProgramStatus = "enrolled" | "completed" | "dropped";

export interface CaseProgram {
  id: string;
  caseId: string;
  programId: string;
  programName: string;
  status: CaseProgramStatus;
  provider: string | null;
  enrolledAt: string;
  completedAt: string | null;
}
