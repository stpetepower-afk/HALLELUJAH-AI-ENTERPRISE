// src/config/llm-client.ts
// LLM Client Configuration (NVIDIA NIM + OpenAI fallback)

import "./env";
import OpenAI from "openai";
import { requireSecret } from "../utils/secrets-manager";
import { log } from "../utils/logger";

export type LLMProvider = "nvidia" | "openai";
export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const NVIDIA_DEFAULT_MODEL = "deepseek-ai/deepseek-r1";
const OPENAI_DEFAULT_MODEL = "gpt-4o-mini";

export function getLLMClient(): { provider: LLMProvider; client: OpenAI; model: string } {
  if (process.env.NVIDIA_API_KEY) {
    return {
      provider: "nvidia",
      client: new OpenAI({ apiKey: requireSecret("NVIDIA_API_KEY"), baseURL: NVIDIA_BASE_URL }),
      model: process.env.NVIDIA_MODEL || NVIDIA_DEFAULT_MODEL,
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      provider: "openai",
      client: new OpenAI({ apiKey: requireSecret("OPENAI_API_KEY") }),
      model: process.env.OPENAI_MODEL || OPENAI_DEFAULT_MODEL,
    };
  }
  throw new Error("No LLM provider configured; set NVIDIA_API_KEY or OPENAI_API_KEY in environment");
}

export async function complete(messages: ChatMessage[]): Promise<string> {
  const { provider, client, model } = getLLMClient();
  try {
    const response = await client.chat.completions.create({ model, messages });
    return response.choices[0]?.message?.content ?? "";
  } catch (err) {
    log(`LLM call failed (${provider}):`, err instanceof Error ? err.message : err);
    throw err;
  }
}
