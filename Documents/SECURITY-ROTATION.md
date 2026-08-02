# Documents/SECURITY-ROTATION.md

Credential rotation runbook and incident record.

---

## ⚠️ Critical: Database Credential Exposure — Action Required

**Incident date:** 2026-07-30
**Credential exposed:** `DATABASE_URL` — Neon Postgres connection string including the database password.
**How it happened:** The full `.env` contents (including `DATABASE_URL`) were pasted into a chat conversation on 2026-07-30.
**Risk window:** From the moment of that paste until the password is rotated, the credential is potentially accessible to anyone who can view that chat history.

---

## Immediate Rotation Steps

1. **Go to the Neon console:** https://console.neon.tech
2. **Find the project** connected to your `HALLELUJAH-AI-ENTERPRISE` database.
3. **Reset the database password** — either reset the existing user's password or create a new database branch with a fresh password. Either path gives you a new connection string.
4. **Update your local `.env`** with the new `DATABASE_URL`.
5. **Update the Netlify environment variable:**
   ```
   npx netlify-cli env:set DATABASE_URL "******host/db"
   ```
6. **Redeploy to production:**
   ```
   npx netlify-cli deploy --prod
   ```
7. **Verify** the live site at https://hallelujah-heos.netlify.app is still responding correctly after the redeploy.

---

## Audit Step

After rotating, check the Neon activity logs for any unauthorized connections that occurred on **2026-07-30 after the exposure time** — look for connections from unexpected IP addresses or at unexpected times. Neon logs are available under: *Project → Monitoring → Connection log*.

---

## Prevention Going Forward

**Never paste `.env` file contents into a chat, ticket, or issue.** If you need to share an example connection string format, use a placeholder:

```
DATABASE_URL=******host/db
```

The live password value stays in two places only:
- Your local `.env` (gitignored and never committed)
- Netlify's project environment variable settings

If a secret is ever pasted in chat again, treat it as compromised and rotate it **the same day**.

---

## Other Secrets in This Project

| Secret | Where to rotate | How to update after rotation |
|--------|----------------|------------------------------|
| `DATABASE_URL` | Neon console → Reset password | `netlify env:set DATABASE_URL "..."` then redeploy |
| `JWT_SECRET_KEY` | Generate a new value (`openssl rand -hex 64`) | `netlify env:set JWT_SECRET_KEY "..."` then redeploy — this invalidates all existing sessions |
| `OPENAI_API_KEY` | OpenAI platform → API keys | `netlify env:set OPENAI_API_KEY "..."` then redeploy |
| `NVIDIA_API_KEY` | NVIDIA NIM console → API keys | `netlify env:set NVIDIA_API_KEY "..."` then redeploy |

---

## Related

- `Documents/HANDOFF.md` — notes that this credential was pasted into chat and marks rotation as overdue
- `Documents/SECURITY.md` — general data protection and incident response policy
- `STARTUP-CHECKLIST.md` — how to set up `.env` locally from scratch
