// src/disputes/letter.ts
// Produces a DRAFT dispute letter for the participant/coach to review, complete,
// and mail themselves. Nothing here submits anything anywhere automatically.
// Bureau dispute mailing addresses verified July 2026 — reconfirm periodically,
// bureaus do change these.
import type { Bureau, Dispute } from "./types";

const BUREAU_INFO: Record<Bureau, { name: string; address: string[] }> = {
  equifax: {
    name: "Equifax Information Services LLC",
    address: ["P.O. Box 740256", "Atlanta, GA 30374-0256"],
  },
  experian: {
    name: "Experian",
    address: ["P.O. Box 4500", "Allen, TX 75013"],
  },
  transunion: {
    name: "TransUnion Consumer Solutions",
    address: ["P.O. Box 2000", "Chester, PA 19016-2000"],
  },
};

export interface LetterConsumer {
  fullName: string;
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
}

export function generateDisputeLetter(dispute: Dispute, consumer: LetterConsumer): string {
  const bureau = BUREAU_INFO[dispute.bureau];
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const cityStateZip =
    consumer.city && consumer.state && consumer.postalCode
      ? `${consumer.city}, ${consumer.state} ${consumer.postalCode}`
      : null;

  const lines = [
    "[DRAFT — review and complete before mailing. This is not legal advice, and mailing this letter does not guarantee any outcome.]",
    "",
    consumer.fullName,
    consumer.addressLine1 || "[Your street address]",
    cityStateZip || "[City, State ZIP]",
    "",
    today,
    "",
    bureau.name,
    ...bureau.address,
    "",
    "Re: Request to investigate inaccurate information",
    "",
    "To Whom It May Concern:",
    "",
    "I am writing to dispute the following item in my credit file, as is my right under the Fair Credit Reporting Act, 15 U.S.C. § 1681i. This item is inaccurate or incomplete, and I am requesting that it be investigated and corrected or removed.",
    "",
    `Creditor/Furnisher: ${dispute.creditorName}`,
    dispute.accountReference ? `Account reference: ${dispute.accountReference}` : null,
    "",
    `Reason for dispute: ${dispute.reason}`,
    "",
    "Please investigate this matter and provide me with a written response, including the results of your investigation, within the time period required by law. Please also send me a corrected copy of my credit report if any changes are made as a result of this dispute.",
    "",
    "Enclosed are copies of documents supporting my position, if applicable.",
    "",
    "Thank you for your prompt attention to this matter.",
    "",
    "Sincerely,",
    "",
    consumer.fullName,
  ];

  return lines.filter((line) => line !== null).join("\n");
}
