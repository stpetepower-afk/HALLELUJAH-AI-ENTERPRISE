# HANDOFF.md

Written for any developer picking this up cold — a different programmer, a future agency, or future-you after time away. Plain Markdown, no special tools needed to read it. Last verified accurate: 2026-07-30 (later same day as the previous version).

**Read this before Documents/ARCHITECTURE.md.** ARCHITECTURE.md was written early and describes an intended future shape (microservices, Kubernetes, an internal LLM API layer). None of that exists. This document describes what's actually here.

---

## What this is, in one paragraph

A small Node/TypeScript/Express backend plus one static HTML page, backed by a real Postgres database. It lets a coach (or admin) log in, enroll a program participant, track a coaching case for them, generate a draft credit-dispute letter (optionally seeded by AI-suggested items from an uploaded credit-report screenshot), track outcomes and program enrollments, and see an activity log. There is no participant-facing app, no payment processing, no deployment beyond a developer's own machine, and no automated integration with credit bureaus.

## Important: read this before trusting the module list below

Cases, disputes, and the coach console were built because real testing surfaced a real gap each time — that discipline is documented in the git log and is the right way to keep building this.

**Outcomes, Programs, Activity Log, and the Dashboard were different.** They were built speculatively, at the founder's explicit request and explicit override of a direct recommendation not to — see the conversation this was built in for the full exchange. That means: the `outcomes` metric list, the `programs` catalog, and the dashboard's chosen stats are **guesses**, not validated by any real pilot usage. They may be the wrong shape. Don't treat their existence as evidence they're needed or correct — treat them as a hypothesis waiting on the pilot log (`Documents/PILOT-LOG.md`) to confirm or contradict.

## Real vs. aspirational — check this before trusting any other doc in this repo

| Document | Reflects reality? |
|---|---|
| This file (HANDOFF.md) | Yes — kept current |
| STARTUP-CHECKLIST.md | Yes — tested, real commands |
| PILOT-LOG.md | Yes — it's a blank/filled template, not a claim |
| Documents/ARCHITECTURE.md | No — early aspirational draft, predates the real code |
| Documents/OASIS-CAMPUS-MASTER-PLAN.md | Explicitly labeled draft/pre-financing — treat accordingly |
| README.md business framing | Corrected as of this handoff; if it drifts again, don't trust it over this file |

## Stack

- **Runtime**: Node.js, TypeScript, ESM (`"type": "module"` in package.json)
- **Web framework**: Express
- **Database**: PostgreSQL (currently a free-tier Neon instance — see whoever holds the founder's `.env` for the connection string; it is *not* committed to git)
- **Auth**: JWT (`jsonwebtoken`), bcrypt password hashing (`bcryptjs`)
- **LLM**: `openai` SDK pointed at either NVIDIA NIM's OpenAI-compatible endpoint or OpenAI directly, selected by whichever API key is present in the environment
- **Frontend**: one static HTML file (`public/coach-console.html`), vanilla JS, no framework, no build step
- **Dev tooling**: `tsx` for running TypeScript directly, no bundler, no test runner configured yet

## Source layout

```
src/
  config/
    env.ts             — loads .env; import this first in any new entrypoint
    llm-client.ts       — complete() for text, completeWithImage() for vision (OpenAI only —
                          the default NVIDIA model has no image support)
  db/
    pool.ts             — Postgres connection pool (reads DATABASE_URL)
    migrate.ts          — applies every src/db/schema/*.sql file in order
    seed-admin.ts        — one-time script to bootstrap the first admin account
    schema/               — migrations, numbered, run in filename order
  auth/
    service.ts           — register/login/getUserById/getUserByEmail/getUserByEmail/
                           updateUserRole/updateUserFullName/updateUserAddress
    jwt.ts, password.ts, middleware.ts, types.ts
    routes.ts             — POST /register, /login, GET /me, GET/PATCH /users/:id(/role|/full-name|/address)
  cases/
    service.ts            — case CRUD, joined with participant email/name for display
    routes.ts             — POST/GET /cases, GET/PATCH/DELETE /cases/:id (DELETE archives, does not drop the row)
  disputes/
    service.ts, letter.ts (draft letter generator), extract.ts (vision-based
    suggestion from a screenshot, image never persisted), routes.ts — mounted at /disputes
  activity/    — speculative (see note above); append-only log, mounted at /activity
  outcomes/    — speculative; case-metric baseline/current tracking, mounted at /outcomes
  programs/    — speculative; program catalog + case enrollments, mounted at /programs
  dashboard/   — speculative; read-only aggregation of existing cases/disputes data, mounted at /dashboard
  server.ts                — wires it all together, serves public/ as static files
public/
  coach-console.html        — the only UI that exists
```

## What's real and tested (not just written)

- Auth: register (always creates role `consumer`; there is no way to self-register as coach/admin — intentional, see Security below), login, JWT issuance, role-gated routes, address/full-name fields
- Cases: create (including intake-by-email, which also creates the participant's account if they don't have one yet), list (coach sees only their own assigned cases; admin sees all), view, update, archive-on-close
- Disputes: create against a case, list, generate a draft letter (real, verified-as-of-July-2026 bureau mailing addresses — reconfirm periodically, they change) using the participant's real name/address once set
- Vision-based extraction plumbing (`/disputes/extract`): verified to fail cleanly with a clear error when no `OPENAI_API_KEY` is set. The actual extraction accuracy — does it correctly read a real credit report screenshot — is **unverified**; no API key was configured to test it against. Test that before trusting it with a real report.
- Activity log, outcomes, programs, dashboard: verified end-to-end against the live database and in a real browser session (create/list/update all exercised) — the *plumbing* is solid. Whether the *shape* (which metrics, which programs, which dashboard stats) is right is unverified, per the note above.
- All of the above tested against a live database in a real browser session, not just via curl — see git log for specifics of what broke and got fixed along the way (there's real bug history there, worth reading, including a routing bug that briefly broke the entire static file server)

## What's explicitly NOT built

- Any participant-facing login/UI — the coach console blocks non-coach/admin roles outright
- Password reset / account recovery
- Any credit bureau integration — no report pulling via an API, no automated dispute submission, no API calls to Equifax/Experian/TransUnion. Screenshot-based suggestion exists (see above) but is a human-reviewed suggestion tool, not an integration.
- Credit freeze functionality — deliberately scoped to informational links only; doing it "for" someone would require holding identity data this system has no reason to store
- Deployment — this runs on `npm run dev`, on a developer's own machine, full stop
- Automated tests — none exist; verification so far has been manual (typecheck + live smoke tests)

## Security notes for whoever works on this next

- Public registration is hardcoded to role `consumer`. This was a real, fixed vulnerability — see the commit that fixed it before changing this logic back.
- Passwords are bcrypt-hashed, never logged in plaintext (see `src/utils/logger.ts`'s secret-masking, though it currently only masks API key patterns — extend it if you add other secret shapes).
- `.env` is gitignored and must stay that way. If a real database credential ever gets pasted into a chat log or ticket, rotate it — don't assume it's fine because it's "just dev."
- This has **not** had a legal/compliance review for the credit-dispute functionality. Do not point it at real third-party program participants (beyond the founder's own pilot case) until that review happens — see PILOT-LOG.md and Documents/OASIS-CAMPUS-MASTER-PLAN.md for context on why.
- Credit report screenshots uploaded to `/disputes/extract` are processed in memory for that one request and never written to disk or the database. If you modify this endpoint, preserve that property deliberately — a stored credit-report image is a much bigger liability than the last-4-digits account references the rest of this system deliberately limits itself to.

## If you're picking this up to extend it

Don't add a new feature because it "completes the architecture." Cases, disputes, the intake flow, and the full-name/address fields were each added because a real, specific gap showed up while testing with real data — not because a plan called for it. Keep doing that.

The one exception is Outcomes/Programs/Activity/Dashboard, built on explicit override of that exact advice (see the note near the top of this file). That override was the founder's call to make, not a change in what's actually good practice here — the default for anything past this point should go back to: don't build it until real usage demands it.
