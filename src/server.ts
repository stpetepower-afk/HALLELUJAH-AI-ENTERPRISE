// src/server.ts
import express from "express";
import { authRouter } from "./auth/routes";
import { caseRouter } from "./cases/routes";
import { complete } from "./config/llm-client";
import { getPool } from "./db/pool";
import { log } from "./utils/logger";

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

const app = express();
app.use(express.json());

app.use("/auth", authRouter);
app.use("/cases", caseRouter);

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

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => log(`Server listening on port ${port}`));
