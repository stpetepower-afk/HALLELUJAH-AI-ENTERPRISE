// src/cases/types.ts
export type CaseStatus = "active" | "closed";
export type CasePriority = "low" | "medium" | "high" | "urgent";

export interface Case {
  id: string;
  userId: string;
  status: CaseStatus;
  priority: CasePriority | null;
  assignedCoach: string | null;
  currentStage: string | null;
  nextBestAction: string | null;
  readinessStartScore: number | null;
  readinessCurrentScore: number | null;
  openedAt: string;
  completedAt: string | null;
}
