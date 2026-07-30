// src/disputes/types.ts
export type Bureau = "equifax" | "experian" | "transunion";
export type DisputeStatus = "draft" | "sent" | "pending" | "resolved" | "rejected";

export interface Dispute {
  id: string;
  caseId: string;
  bureau: Bureau;
  creditorName: string;
  accountReference: string | null;
  reason: string;
  status: DisputeStatus;
  outcomeNotes: string | null;
  createdAt: string;
  sentAt: string | null;
  resolvedAt: string | null;
}
