// src/utils/secrets-manager.ts
// Minimal secrets manager wrapper (placeholder)

export function getSecret(name: string): string | undefined {
  return process.env[name];
}

export function requireSecret(name: string): string {
  const v = getSecret(name);
  if (!v) throw new Error(`Required secret ${name} is not set`);
  return v;
}
