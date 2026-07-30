// src/outcomes/routes.ts
// Speculative module, built on explicit override -- see Documents/HANDOFF.md.
// Mounted at /outcomes in server.ts.
import { Router } from "express";
import { requireAuth, requireRole, type AuthedRequest } from "../auth/middleware";
import { getCase } from "../cases/service";
import { recordActivity } from "../activity/service";
import { upsertOutcome, listOutcomesForCase, OutcomeError } from "./service";

export const outcomeRouter = Router();

outcomeRouter.use(requireAuth);
outcomeRouter.use(requireRole("coach", "admin"));

outcomeRouter.get("/", async (req, res) => {
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
  const outcomes = await listOutcomesForCase(caseId);
  res.json({ outcomes });
});

outcomeRouter.post("/", async (req: AuthedRequest, res) => {
  try {
    const { caseId, metric, baselineValue, currentValue, unit } = req.body ?? {};
    if (!caseId || !metric) {
      res.status(400).json({ error: "caseId and metric are required" });
      return;
    }
    const found = await getCase(caseId);
    if (!found) {
      res.status(404).json({ error: "Case not found" });
      return;
    }
    const outcome = await upsertOutcome({ caseId, metric, baselineValue, currentValue, unit });
    await recordActivity(caseId, req.user!.id, "outcome_updated", metric);
    res.status(201).json({ outcome });
  } catch (err) {
    if (err instanceof OutcomeError) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Failed to save outcome" });
  }
});
