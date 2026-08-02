# Documents/MASTER-STATUS.md

Current state of the Hallelujah ecosystem as of 2026-08-02. Read `Documents/HANDOFF.md` first — it contains the authoritative technical detail; this document is a higher-level orientation across the full ecosystem.

---

## What Is Live Right Now

### HALLELUJAH-AI-ENTERPRISE (HEOS)
- **URL:** https://hallelujah-heos.netlify.app
- **Deployed:** Yes — live on Netlify, backed by a real Neon Postgres database.
- **What it does:** Tracks coaching cases for program participants and generates draft credit-dispute letters for a coach to review. One real coach/admin user, one real pilot participant (the founder).
- **What it does not do:** No participant-facing UI, no automated credit bureau submissions, no CI/CD (manual `netlify deploy --prod`), no automated tests.
- **Deployment method:** Manual CLI deploy — a pushed commit does **not** go live until someone runs `npx netlify-cli deploy --prod`.

### hallelujah-one (Automation Playground)
- **Status:** Proposed / in setup. Local-only scripts targeting `~/hallelujah-one` on the founder's Mac with Ollama at `localhost:11434`.
- **What it does:** Shell automation for daily Ollama evolution reports, daemon health checks, and hourly RIM scoring.
- **Not deployed remotely** — these scripts run on local hardware only.

---

## What Is Built vs. Aspirational

| Item | Status | Source of truth |
|------|--------|-----------------|
| Case tracking (HEOS) | ✅ Built and tested live | `src/cases/` — `HANDOFF.md` |
| Credit-dispute letter generation | ✅ Built and tested live | `src/disputes/` — `HANDOFF.md` |
| Auth (login, JWT, role gating) | ✅ Built and tested live | `src/auth/` — `HANDOFF.md` |
| Activity log, outcomes, programs, dashboard | ✅ Plumbing solid; **shape unvalidated** | `HANDOFF.md` — speculative section |
| Vision-based credit-report extraction | ⚠️ Plumbing verified; extraction accuracy **unverified** | `src/disputes/extract.ts` |
| Participant-facing UI | ❌ Not built | Deliberately out of scope until pilot validates need |
| Password reset / account recovery | ❌ Not built | Out of scope |
| Automated credit bureau integration | ❌ Not built | Deliberately out of scope |
| CI/CD (auto-deploy on push) | ❌ Not configured | Manual deploy only |
| Automated tests | ❌ None | First-round validation was manual |
| Oasis Campus / 10-year plan | 📝 Planning doc only | `Documents/OASIS-CAMPUS-MASTER-PLAN.md` |
| AI-driven coaching (full) | 📝 Roadmap only | Referenced in README; not built |
| hallelujah-one automation playground | 🔧 Scripts authored; local setup pending | `automation/` scripts |

---

## Open Work — Ordered by Urgency

### 🔴 Critical (do before anything else)
1. **Rotate the Neon database password.** The `DATABASE_URL` credential was pasted into a chat session on 2026-07-30. See `Documents/SECURITY-ROTATION.md` for the full step-by-step runbook.

### 🟡 Important (do soon)
2. **Add automated tests.** No test runner is configured. Manual smoke-testing has caught real bugs; a regression test suite will catch them faster. Start with auth and case-creation flows.
3. **Set up CI/CD.** A pushed commit does not deploy automatically. At minimum, wire a GitHub → Netlify integration so that main-branch pushes trigger a deploy automatically.
4. **Validate the speculative modules.** Activity, Outcomes, Programs, and Dashboard were built on override of explicit advice. The pilot log (`Documents/PILOT-LOG.md`) is the right place to collect evidence for whether their current shape is correct. Don't extend them until the log says something.

### 🟢 When time allows
5. **Legal/compliance review** for the credit-dispute functionality before expanding beyond the founder's own pilot case. See `HANDOFF.md` security notes.
6. **Verify vision extraction accuracy.** The `/disputes/extract` endpoint was verified to fail cleanly without an API key; it has not been tested against a real credit-report screenshot. Test before relying on it.

---

## Branch Cleanup

As of 2026-08-02, the following stale branches exist on `origin` and should be deleted once their content is confirmed merged or abandoned:

- `claude/*` branches (experimental, from prior Claude agent sessions)
- `copilot/*` branches (this PR and other Copilot agent sessions)
- `fable/*` branches (prior Fable agent sessions)

Only `main` should remain after cleanup. Deletion is a manual step: `git push origin --delete <branch-name>` for each, or via the GitHub UI (Repository → Branches).

---

## Key Documents

| Document | Purpose |
|----------|---------|
| `Documents/HANDOFF.md` | **Authoritative technical state** — read this before any other doc |
| `STARTUP-CHECKLIST.md` | How to run the project locally |
| `Documents/PILOT-LOG.md` | Weekly pilot tracking (fill in, don't guess) |
| `Documents/SECURITY-ROTATION.md` | Credential rotation runbook — **immediate action required** |
| `Documents/SECURITY.md` | General data-protection and incident-response policy |
| `Documents/ARCHITECTURE.md` | Early aspirational draft — **does not reflect reality** |
| `Documents/OASIS-CAMPUS-MASTER-PLAN.md` | 10-year community development plan — draft/pre-financing |
