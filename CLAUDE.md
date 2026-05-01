# PRP — Claude Instructions

## Project

LA 2028 Press Registration Portal. A Next.js 16 app managing media organisation Expressions of Interest (EoI) for the Olympics. Four admin roles (NOC, OCOG, IOC, IF) each with distinct permissions and dashboards. Public-facing application form at `/apply`.

**Stack**: Next.js 16 (App Router) · React 19 · TypeScript · Drizzle ORM · PostgreSQL · Tailwind CSS 4 · Vitest · Bun

## Dev commands

```
bun dev           # start dev server
bun run test      # run unit/integration tests (Vitest — excludes e2e)
bun test:e2e      # run end-to-end tests (Playwright — requires running dev server)
bun db:generate   # generate migration from schema changes
bun db:migrate    # apply pending migrations
bun db:studio     # open Drizzle Studio
bun run sync      # fast-forward `fixes` to match `main` (staging catch-up)
```

## Branches & deploys

- `main` → production (Railway prod watches this)
- `fixes` → staging (Railway staging watches this)
- **Golden rule:** `fixes` is never behind `main`.
- After any direct commit to `main`, run `bun run sync` to bring `fixes` up. Before starting work on `fixes`, run `bun run sync` first so you branch off the current prod state.
- Release flow for major work: commit to `fixes` → Railway stages → verify → `git checkout main && git merge --ff-only origin/fixes && git push origin main` → Railway deploys to prod.

## Architecture

- **Auth**: `src/middleware.ts` + `src/lib/session.ts` — do not bypass
- **Admin roles**: `src/app/admin/{noc,ocog,ioc}/` — NOC is primary workflow hub
- **EoI status flow**: Draft → Submitted → Under Review → Approved / Returned / Rejected
- **ACR client**: `src/lib/acr/` is a stub — not connected to real API yet
- **Quota logic**: `src/lib/quota-calc.ts`
- **DB schema**: `src/db/schema.ts` — migrations in `src/db/migrations/`

## Conventions

- Tests go in `src/test/`, not colocated — pattern `*.test.ts`
- Never edit past migrations; always generate new ones via `db:generate`
- Design tokens and role colour scheme are in `DESIGN.md`
- Do not commit `.env.local`
- Shared label maps live in `src/lib/labels.ts` (`ORG_TYPE_LABEL`, `PUB_TYPE_LABEL`, `GEO_COVERAGE_LABEL`) and `src/lib/audit-query.ts` (`ACTION_LABEL`, `ACTION_BADGE`). Do not redeclare locally.
- Form-tab Tailwind constants (`INPUT`, `BASE_INPUT`, `LABEL`, `HELP`, `inp()`, `Err()`) come from `src/app/apply/form/form-styles.tsx`. Do not redeclare per tab.
- Address formatting — use `formatAddress(org)` from `src/lib/format.ts`.
- Server-action error convention: form-submit actions redirect with `?error=code` query params (see `src/app/admin/noc/actions.ts`). Programmatic/async actions called from client handlers may return `{ error: string }` objects (see `setEnrRank` in `src/app/admin/noc/actions.ts`). Do not mix patterns in the same action.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
