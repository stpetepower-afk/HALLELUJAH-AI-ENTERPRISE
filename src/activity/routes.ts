// src/activity/routes.ts
// Speculative module, built on explicit override -- see Documents/HANDOFF.md.
// Mounted at /activity in server.ts.
import { Router } from "express";
import { requireAuth, requireRole } from "../auth/middleware";
import { getCase } from "../cases/service";
import { listActivityForCase } from "./service";

export const activityRouter = Router();

activityRouter.use(requireAuth);
activityRouter.use(requireRole("coach", "admin"));

activityRouter.get("/", async (req, res) => {
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
  const entries = await listActivityForCase(caseId);
  res.json({ activity: entries });
});
