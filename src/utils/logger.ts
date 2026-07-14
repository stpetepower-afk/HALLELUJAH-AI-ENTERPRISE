// src/utils/logger.ts
// Simple logger that masks known secrets in output

const SENSITIVE_PATTERNS = [/nvapi-[A-Za-z0-9_-]+/g, /sk-[A-Za-z0-9_-]+/g];

export function maskSecrets(s: string): string {
  let out = s;
  for (const p of SENSITIVE_PATTERNS) out = out.replace(p, "[REDACTED]");
  return out;
}

export function log(...args: any[]) {
  console.log(maskSecrets(args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')));
}
