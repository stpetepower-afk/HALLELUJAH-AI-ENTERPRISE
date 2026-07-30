# HALLELUJAH-AI-ENTERPRISE

**Status as of 2026-07-30:** early pilot. One real coach/admin user, one real pilot participant (the founder, testing the workflow on himself before it touches anyone else). Not deployed publicly — runs locally. Read [Documents/HANDOFF.md](Documents/HANDOFF.md) before assuming anything about what exists.

## Project Overview
HEOS (Hallelujah Enterprise Operating System) is the software side of Hallelujah Ministries' financial-coaching and community-development work. It currently does two things for real: tracks coaching cases for program participants, and generates draft credit-dispute letters for a coach to review and mail (nothing auto-submits anywhere). Everything else referenced in planning documents — Oasis Campus, additional program modules, AI-driven coaching — is roadmap, not built.

## Start Here
- **New to this repo?** Read [Documents/HANDOFF.md](Documents/HANDOFF.md) first — an honest account of what's built, what isn't, and known gaps.
- **Setting up a dev environment?** Follow [STARTUP-CHECKLIST.md](STARTUP-CHECKLIST.md).
- **Running the actual pilot?** [Documents/PILOT-LOG.md](Documents/PILOT-LOG.md) is the plain-text weekly log — no software needed to use it.

## Project Structure
Core documentation lives in `/Documents`. Knowledge Base templates live in `/Knowledge-Base`. Application source lives in `/src`; the coach console UI is a single static page in `/public`.

## Documentation Hub

### Start Here
- [Documents/HANDOFF.md](Documents/HANDOFF.md) — real technical state, for any developer picking this up
- [STARTUP-CHECKLIST.md](STARTUP-CHECKLIST.md) — how to actually run this locally
- [Documents/PILOT-LOG.md](Documents/PILOT-LOG.md) — weekly pilot tracking, plain text

### Architecture & Planning
- Documents/ARCHITECTURE.md — system architecture & technology stack (aspirational — written before most of the actual code existed; HANDOFF.md reflects what's real)
- Documents/ADR-TEMPLATE.md — architecture decision record template
- Documents/DECISIONS.md — decision log & process
- Documents/OASIS-CAMPUS-MASTER-PLAN.md — fourplex pilot → 10-year community development roadmap (draft, pre-financing)

### Security & Onboarding
- Documents/SECURITY.md — data protection and incident response
- Documents/CONTRIBUTING.md — developer onboarding and standards

### Knowledge Base
- Knowledge-Base/RESEARCH-TEMPLATE.md — research format

