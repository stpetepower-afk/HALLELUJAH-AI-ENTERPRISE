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

// Image input needs a vision-capable model. The NVIDIA default (DeepSeek R1)
// does not support it, so this deliberately requires OpenAI rather than
// silently trying a text model against an image.
export async function completeWithImage(prompt: string, imageDataUrl: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "Image analysis requires OPENAI_API_KEY -- the configured NVIDIA model does not support image input."
    );
  }
  const client = new OpenAI({ apiKey: requireSecret("OPENAI_API_KEY") });
  const model = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";
  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    });
    return response.choices[0]?.message?.content ?? "";
  } catch (err) {
    log("Vision LLM call failed:", err instanceof Error ? err.message : err);
    throw err;
  }
}
