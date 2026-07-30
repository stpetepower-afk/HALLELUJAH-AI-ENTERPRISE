// src/outcomes/types.ts
// Speculative module, built on explicit override -- see Documents/HANDOFF.md.
export interface Outcome {
  id: string;
  caseId: string;
  metric: string;
  baselineValue: string | null;
  currentValue: string | null;
  unit: string | null;
  updatedAt: string;
}
