# HANDOFF.md

Written for any developer picking this up cold — a different programmer, a future agency, or future-you after time away. Plain Markdown, no special tools needed to read it. Last verified accurate: 2026-07-30, against commit `d06e6de`.

**Read this before Documents/ARCHITECTURE.md.** ARCHITECTURE.md was written early and describes an intended future shape (microservices, Kubernetes, an internal LLM API layer). None of that exists. This document describes what's actually here.

---

## What this is, in one paragraph

A small Node/TypeScript/Express backend plus one static HTML page, backed by a real Postgres database. It lets a coach (or admin) log in, enroll a program participant, track a coaching case for them, and generate a draft credit-dispute letter. That's the entire feature set. There is no participant-facing app, no payment processing, no deployment beyond a developer's own machine, and no automated integration with credit bureaus.

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
    env.ts            — loads .env; import this first in any new entrypoint
    llm-client.ts      — getLLMClient() / complete(messages)
  db/
    pool.ts            — Postgres connection pool (reads DATABASE_URL)
    migrate.ts         — applies every src/db/schema/*.sql file in order
    seed-admin.ts       — one-time script to bootstrap the first admin account
    schema/             — migrations, numbered, run in filename order
  auth/
    service.ts          — register/login/getUserById/getUserByEmail/updateUserRole/updateUserFullName
    jwt.ts, password.ts, middleware.ts, types.ts
    routes.ts            — POST /register, /login, GET /me, PATCH /users/:id/role, /users/:id/full-name
  cases/
    service.ts           — case CRUD, joined with participant email/name for display
    routes.ts            — POST/GET /cases, GET/PATCH/DELETE /cases/:id (DELETE archives, does not drop the row)
  disputes/
    service.ts, letter.ts (draft letter generator), routes.ts — mounted at /disputes
  server.ts               — wires it all together, serves public/ as static files
public/
  coach-console.html       — the only UI that exists
```

## What's real and tested (not just written)

- Auth: register (always creates role `consumer`; there is no way to self-register as coach/admin — intentional, see Security below), login, JWT issuance, role-gated routes
- Cases: create (including intake-by-email, which also creates the participant's account if they don't have one yet), list (coach sees only their own assigned cases; admin sees all), view, update, archive-on-close
- Disputes: create against a case, list, generate a draft letter (real, verified-as-of-July-2026 bureau mailing addresses — reconfirm periodically, they change)
- All of the above verified end-to-end against a live database in a real browser session, not just via curl — see git log for specifics of what broke and got fixed along the way (there's real bug history there, worth reading)

## What's explicitly NOT built

- Any participant-facing login/UI — the coach console blocks non-coach/admin roles outright
- Password reset / account recovery
- Any credit bureau integration — no report pulling, no automated dispute submission, no API calls to Equifax/Experian/TransUnion
- Credit freeze functionality — deliberately scoped to informational links only; doing it "for" someone would require holding identity data this system has no reason to store
- Outcome tracking, program assignments, audit/activity timeline, dashboards, reporting — all discussed and deliberately deferred until real pilot usage shows what shape they should take
- Deployment — this runs on `npm run dev`, on a developer's own machine, full stop
- Automated tests — none exist; verification so far has been manual (typecheck + live smoke tests)

## Security notes for whoever works on this next

- Public registration is hardcoded to role `consumer`. This was a real, fixed vulnerability — see the commit that fixed it before changing this logic back.
- Passwords are bcrypt-hashed, never logged in plaintext (see `src/utils/logger.ts`'s secret-masking, though it currently only masks API key patterns — extend it if you add other secret shapes).
- `.env` is gitignored and must stay that way. If a real database credential ever gets pasted into a chat log or ticket, rotate it — don't assume it's fine because it's "just dev."
- This has **not** had a legal/compliance review for the credit-dispute functionality. Do not point it at real third-party program participants (beyond the founder's own pilot case) until that review happens — see PILOT-LOG.md and Documents/OASIS-CAMPUS-MASTER-PLAN.md for context on why.

## If you're picking this up to extend it

Don't add a new feature because it "completes the architecture." Every module built so far (cases, disputes, the intake flow, the full-name field) was added because a real, specific gap showed up while testing with real data — not because a plan called for it. Keep doing that. If you're not sure whether something is needed yet, it probably isn't.
