# STARTUP-CHECKLIST.md

Real, tested steps to run this locally. No CI/CD or branch protection exists yet — those aren't relevant at this stage, and are removed from this checklist until they are.

1. Clone the repo, then `npm install`.
2. Get a Postgres database. Fastest path: a free instance from [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app) — any of them hand you a `postgresql://...` connection string in a couple of minutes, no local Postgres install needed.
3. Copy `.env.example` to `.env`. Fill in:
   - `DATABASE_URL` — the connection string from step 2
   - `JWT_SECRET_KEY` — generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
   - `NVIDIA_API_KEY` or `OPENAI_API_KEY` — only needed if you want `/llm/complete` to actually respond; everything else works without it
4. Run `npm run migrate` — applies every file in `src/db/schema/` in order, against the real database from step 2.
5. Create the first admin account (there's no public signup path to admin — by design, see `src/auth/service.ts`):
   `npm run seed:admin -- --email=you@example.com --password=yourpassword`
6. `npm run dev` — starts the server on port 3000 (or whatever `PORT` is set to).
7. Open `http://localhost:3000/coach-console.html` and log in with the account from step 5.
8. `npm run typecheck` before committing anything — `tsc --noEmit`, no test suite exists yet.

This only runs locally right now — nothing is deployed publicly. Deploying it is a real, undone task (hosting, secrets management, etc.), not just a config change.

