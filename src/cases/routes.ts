// src/cases/routes.ts
import { Router } from "express";
import { requireAuth, requireRole, type AuthedRequest } from "../auth/middleware";
import { getUserByEmail, registerUser, AuthError } from "../auth/service";
import { createCase, getCase, listCases, updateCase, archiveCase, CaseError } from "./service";

export const caseRouter = Router();

caseRouter.use(requireAuth);

// Intake: a coach enrolling someone who has never registered themselves.
// Pass userId directly if the person already has an account; otherwise pass
// email (+ password, to create their account on the spot) to enroll them now.
caseRouter.post("/", requireRole("coach", "admin"), async (req: AuthedRequest, res) => {
  try {
    const { userId, email, password, priority, currentStage, nextBestAction, readinessStartScore, assignedCoach } =
      req.body ?? {};

    let resolvedUserId: string | undefined = userId;
    if (!resolvedUserId && email) {
      const existing = await getUserByEmail(email);
      if (existing) {
        resolvedUserId = existing.id;
      } else if (password) {
        const { user } = await registerUser(email, password);
        resolvedUserId = user.id;
      } else {
        res.status(400).json({
          error: "No account exists for that email. Provide a password to enroll them now.",
        });
        return;
      }
    }
    if (!resolvedUserId) {
      res.status(400).json({ error: "userId or email is required" });
      return;
    }

    // Whoever does intake owns the case by default; reassign later via PATCH.
    const created = await createCase({
      userId: resolvedUserId,
      priority,
      currentStage,
      nextBestAction,
      readinessStartScore,
      assignedCoach: assignedCoach ?? req.user!.id,
    });
    res.status(201).json({ case: created });
  } catch (err) {
    if (err instanceof CaseError || err instanceof AuthError) {
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
