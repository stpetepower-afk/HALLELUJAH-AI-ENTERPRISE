// src/activity/types.ts
// Speculative module, built on explicit override -- see Documents/HANDOFF.md.
export interface ActivityEntry {
  id: string;
  caseId: string;
  actorId: string | null;
  action: string;
  detail: string | null;
  createdAt: string;
}
