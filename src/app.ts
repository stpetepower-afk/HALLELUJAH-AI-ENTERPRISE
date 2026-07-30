// src/app.ts
// The Express app itself, with no listen() call -- shared by the local dev
// entrypoint (server.ts) and the Netlify Function wrapper
// (netlify/functions/api.ts). Keep this file free of anything that assumes
// a long-running process (no setInterval, no in-memory state that needs to
// survive across requests) since it also runs in a serverless context.
import "./config/env";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { authRouter } from "./auth/routes";
import { caseRouter } from "./cases/routes";
import { disputeRouter } from "./disputes/routes";
import { activityRouter } from "./activity/routes";
import { outcomeRouter } from "./outcomes/routes";
import { programRouter } from "./programs/routes";
import { dashboardRouter } from "./dashboard/routes";
import { complete } from "./config/llm-client";
import { getPool } from "./db/pool";

// LAMBDA_TASK_ROOT is always set by AWS Lambda (which Netlify Functions run
// on) and never set locally -- a reliable way to tell the two contexts apart.
const isServerless = !!process.env.LAMBDA_TASK_ROOT;

async function checkDatabase(): Promise<"connected" | "error" | "not_configured"> {
  if (!process.env.DATABASE_URL) return "not_configured";
  try {
    await getPool().query("SELECT 1");
    return "connected";
  } catch {
    return "error";
  }
}

function checkLLM(): "configured" | "not_configured" {
  return process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY ? "configured" : "not_configured";
}

export const app = express();
// Default 100kb body limit is too small for base64-encoded credit-report
// screenshots posted to /disputes/extract.
app.use(express.json({ limit: "10mb" }));

app.use("/auth", authRouter);
app.use("/cases", caseRouter);
app.use("/disputes", disputeRouter);
app.use("/activity", activityRouter);
app.use("/outcomes", outcomeRouter);
app.use("/programs", programRouter);
app.use("/dashboard", dashboardRouter);

// Static files are served directly by Netlify's CDN from the publish
// directory in production -- this only matters for local dev (npm run dev).
// Skipped entirely in the serverless build: import.meta.url doesn't survive
// esbuild's CJS bundling for the function, and static requests never reach
// this function in production anyway (netlify.toml only redirects the rest).
if (!isServerless) {
  const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
  app.use(express.static(publicDir));
}

app.post("/llm/complete", async (req, res) => {
  const { messages } = req.body ?? {};
  if (!Array.isArray(messages)) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }
  try {
    const reply = await complete(messages);
    res.json({ reply });
  } catch {
    res.status(502).json({ error: "LLM request failed" });
  }
});

app.get("/health", async (_req, res) => {
  res.json({
    status: "ok",
    database: await checkDatabase(),
    llm: checkLLM(),
    jwt: process.env.JWT_SECRET_KEY ? "configured" : "not_configured",
  });
});
