// src/disputes/routes.ts
// Mounted at /disputes in server.ts — keep every path relative to that root
// so requireAuth stays scoped here and never intercepts unrelated requests
// (it previously being mounted at app root broke static file serving).
import { Router } from "express";
import { requireAuth, requireRole } from "../auth/middleware";
import { getCase } from "../cases/service";
import { getUserById } from "../auth/service";
import {
  createDispute,
  listDisputesForCase,
  getDispute,
  updateDispute,
  DisputeError,
} from "./service";
import { generateDisputeLetter } from "./letter";

export const disputeRouter = Router();

disputeRouter.use(requireAuth);
disputeRouter.use(requireRole("coach", "admin"));

disputeRouter.get("/", async (req, res) => {
  const caseId = typeof req.query.caseId === "string" ? req.query.caseId : undefined;
  if (!caseId) {
    res.status(400).json({ error: "caseId query parameter is required" });
    return;
  }
  const found = await getCase(caseId);
  if (!found) {
    res.status(404).json({ error: "Case not found" });
    return;
  }
  const disputes = await listDisputesForCase(caseId);
  res.json({ disputes });
});

disputeRouter.post("/", async (req, res) => {
  try {
    const { caseId, bureau, creditorName, accountReference, reason } = req.body ?? {};
    if (!caseId || !bureau || !creditorName || !reason) {
      res.status(400).json({ error: "caseId, bureau, creditorName, and reason are required" });
      return;
    }
    const found = await getCase(caseId);
    if (!found) {
      res.status(404).json({ error: "Case not found" });
      return;
    }
    const created = await createDispute({ caseId, bureau, creditorName, accountReference, reason });
    res.status(201).json({ dispute: created });
  } catch (err) {
    if (err instanceof DisputeError) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Failed to create dispute" });
  }
});

disputeRouter.patch("/:id", async (req, res) => {
  try {
    const updated = await updateDispute(req.params.id, req.body ?? {});
    if (!updated) {
      res.status(404).json({ error: "Dispute not found" });
      return;
    }
    res.json({ dispute: updated });
  } catch (err) {
    if (err instanceof DisputeError) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Failed to update dispute" });
  }
});

// Renders a draft letter — never sends or submits anything.
disputeRouter.get("/:id/letter", async (req, res) => {
  const dispute = await getDispute(req.params.id);
  if (!dispute) {
    res.status(404).json({ error: "Dispute not found" });
    return;
  }
  const caseRecord = await getCase(dispute.caseId);
  if (!caseRecord) {
    res.status(404).json({ error: "Case not found" });
    return;
  }
  const consumer = await getUserById(caseRecord.userId);
  if (!consumer) {
    res.status(404).json({ error: "Participant not found" });
    return;
  }
  if (!consumer.fullName) {
    res.status(400).json({ error: "Participant's full name must be set before generating a letter" });
    return;
  }
  const letter = generateDisputeLetter(dispute, { fullName: consumer.fullName });
  res.json({ letter });
});
