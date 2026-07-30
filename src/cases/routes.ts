// src/cases/routes.ts
import { Router } from "express";
import { requireAuth, requireRole, type AuthedRequest } from "../auth/middleware";
import { createCase, getCase, listCases, updateCase, archiveCase, CaseError } from "./service";

export const caseRouter = Router();

caseRouter.use(requireAuth);

caseRouter.post("/", requireRole("coach", "admin"), async (req: AuthedRequest, res) => {
  try {
    const { userId, priority, currentStage, readinessStartScore, assignedCoach } = req.body ?? {};
    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }
    const created = await createCase({ userId, priority, currentStage, readinessStartScore, assignedCoach });
    res.status(201).json({ case: created });
  } catch (err) {
    if (err instanceof CaseError) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Failed to create case" });
  }
});

// Coaches see their own caseload; admins see everything.
caseRouter.get("/", requireRole("coach", "admin"), async (req: AuthedRequest, res) => {
  const filter = req.user!.role === "admin" ? {} : { assignedCoach: req.user!.id };
  const cases = await listCases(filter);
  res.json({ cases });
});

caseRouter.get("/:id", async (req: AuthedRequest, res) => {
  const found = await getCase(req.params.id);
  if (!found) {
    res.status(404).json({ error: "Case not found" });
    return;
  }
  const { role, id: userId } = req.user!;
  const canView = role === "admin" || role === "coach" || found.userId === userId;
  if (!canView) {
    res.status(403).json({ error: "Not authorized to view this case" });
    return;
  }
  res.json({ case: found });
});

caseRouter.patch("/:id", requireRole("coach", "admin"), async (req: AuthedRequest, res) => {
  try {
    const updated = await updateCase(req.params.id, req.body ?? {});
    if (!updated) {
      res.status(404).json({ error: "Case not found" });
      return;
    }
    res.json({ case: updated });
  } catch (err) {
    if (err instanceof CaseError) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Failed to update case" });
  }
});

// Archives (closes) the case rather than deleting the row — see service.ts.
caseRouter.delete("/:id", requireRole("coach", "admin"), async (req: AuthedRequest, res) => {
  const archived = await archiveCase(req.params.id);
  if (!archived) {
    res.status(404).json({ error: "Case not found" });
    return;
  }
  res.json({ case: archived });
});
