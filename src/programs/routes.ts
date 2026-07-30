// src/programs/routes.ts
// Speculative module, built on explicit override -- see Documents/HANDOFF.md.
// Mounted at /programs in server.ts.
import { Router } from "express";
import { requireAuth, requireRole, type AuthedRequest } from "../auth/middleware";
import { getCase } from "../cases/service";
import { recordActivity } from "../activity/service";
import {
  listPrograms,
  enrollCaseInProgram,
  listProgramsForCase,
  updateCaseProgramStatus,
  ProgramError,
} from "./service";

export const programRouter = Router();

programRouter.use(requireAuth);
programRouter.use(requireRole("coach", "admin"));

// The catalog itself -- static reference data, not case-specific.
programRouter.get("/", async (_req, res) => {
  const programs = await listPrograms();
  res.json({ programs });
});

programRouter.get("/cases/:caseId", async (req, res) => {
  const found = await getCase(req.params.caseId);
  if (!found) {
    res.status(404).json({ error: "Case not found" });
    return;
  }
  const programs = await listProgramsForCase(req.params.caseId);
  res.json({ programs });
});

programRouter.post("/cases/:caseId", async (req: AuthedRequest, res) => {
  const { programId, provider } = req.body ?? {};
  if (!programId) {
    res.status(400).json({ error: "programId is required" });
    return;
  }
  const found = await getCase(req.params.caseId);
  if (!found) {
    res.status(404).json({ error: "Case not found" });
    return;
  }
  const enrollment = await enrollCaseInProgram(req.params.caseId, programId, provider);
  await recordActivity(req.params.caseId, req.user!.id, "program_enrolled", enrollment.programName);
  res.status(201).json({ enrollment });
});

programRouter.patch("/enrollments/:id", async (req, res) => {
  try {
    const { status } = req.body ?? {};
    if (!status) {
      res.status(400).json({ error: "status is required" });
      return;
    }
    const updated = await updateCaseProgramStatus(req.params.id, status);
    if (!updated) {
      res.status(404).json({ error: "Enrollment not found" });
      return;
    }
    res.json({ enrollment: updated });
  } catch (err) {
    if (err instanceof ProgramError) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Failed to update enrollment" });
  }
});
