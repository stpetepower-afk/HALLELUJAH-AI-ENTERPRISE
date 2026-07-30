// src/auth/routes.ts
import { Router } from "express";
import { registerUser, loginUser, AuthError } from "./service";
import { requireAuth, type AuthedRequest } from "./middleware";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  try {
    const { email, password, role } = req.body ?? {};
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    const { user, token } = await registerUser(email, password, role);
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
