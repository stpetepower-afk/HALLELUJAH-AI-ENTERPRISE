// src/config/llm-client.ts
// LLM Client Configuration (NVIDIA DeepSeek + OpenAI fallback)

import dotenv from "dotenv";
dotenv.config();

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export function getLLMClient() {
  if (NVIDIA_API_KEY) {
    return { provider: "nvidia", apiKeyEnv: "NVIDIA_API_KEY" };
  }
  if (OPENAI_API_KEY) {
    return { provider: "openai", apiKeyEnv: "OPENAI_API_KEY" };
  }
  throw new Error("No LLM provider configured; set NVIDIA_API_KEY or OPENAI_API_KEY in environment");
}
