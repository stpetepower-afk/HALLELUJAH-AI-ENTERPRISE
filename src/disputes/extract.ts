// src/disputes/extract.ts
// Suggests dispute items from a credit-report screenshot. The image is never
// persisted to disk or database -- it exists only for the duration of this
// one request, then is discarded. Every suggestion requires human review
// before becoming a real dispute (see POST /disputes) -- extraction accuracy
// is unverified, and these ultimately become letters someone actually mails.
import { completeWithImage } from "../config/llm-client";
import type { Bureau } from "./types";

export interface ExtractedItem {
  creditorName: string;
  accountReference: string | null;
  bureau: Bureau | null;
  suggestedReason: string;
}

const VALID_BUREAUS = ["equifax", "experian", "transunion"];

const EXTRACTION_PROMPT = `You are looking at a screenshot of a credit report. Identify each negative or questionable item (late payments, collections, charge-offs, accounts that appear inaccurate or unfamiliar). For each one, return a JSON array of objects with exactly these fields:
- creditorName: the creditor or furnisher name as shown
- accountReference: the last 4 digits of the account number if visible, otherwise null (never return a full account number)
- bureau: "equifax", "experian", or "transunion" if the report identifies which bureau this is from, otherwise null
- suggestedReason: a short, factual description of what looks disputable about it -- do not invent details that aren't visible in the image

Return ONLY the JSON array, no other text. If nothing looks disputable, return an empty array.`;

export async function extractDisputeItemsFromImage(imageDataUrl: string): Promise<ExtractedItem[]> {
  const raw = await completeWithImage(EXTRACTION_PROMPT, imageDataUrl);
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter(
      (item): item is Record<string, unknown> =>
        !!item && typeof item === "object" && typeof (item as { creditorName?: unknown }).creditorName === "string"
    )
    .map((item) => ({
      creditorName: String(item.creditorName),
      accountReference: typeof item.accountReference === "string" ? item.accountReference : null,
      bureau: typeof item.bureau === "string" && VALID_BUREAUS.includes(item.bureau) ? (item.bureau as Bureau) : null,
      suggestedReason: typeof item.suggestedReason === "string" ? item.suggestedReason : "",
    }));
}
