// src/auth/routes.ts
import { Router } from "express";
import { registerUser, loginUser, updateUserRole, AuthError } from "./service";
import { requireAuth, requireRole, type AuthedRequest } from "./middleware";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    // Role is never taken from the request body — self-service signup is always "consumer".
    // Elevating to coach/admin/partner requires an existing admin via PATCH /auth/users/:id/role.
    const { user, token } = await registerUser(email, password);
    res.status(201).json({ user, token });
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Registration failed" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    const { user, token } = await loginUser(email, password);
    res.json({ user, token });
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(401).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Login failed" });
  }
});

authRouter.get("/me", requireAuth, (req: AuthedRequest, res) => {
  res.json({ user: req.user });
});

authRouter.patch("/users/:id/role", requireAuth, requireRole("admin"), async (req: AuthedRequest, res) => {
  try {
    const { role } = req.body ?? {};
    if (!role) {
      res.status(400).json({ error: "role is required" });
      return;
    }
    const updated = await updateUserRole(req.params.id, role);
    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ user: updated });
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Failed to update role" });
  }
});
