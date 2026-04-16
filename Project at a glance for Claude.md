## Project at a glance

  - **Project:** LA 2028 Media Registration Portal (MRP) — a Next.js app
  managing
    Expression of Interest (EoI) and Press-by-Number (PbN) workflows for ~206
    National Olympic Committees during the 2028 Olympics.
  - **Local path:** /Users/kcorless/Documents/Projects/MRP
  - **GitHub:** https://github.com/maccorless/MRP
  - **Branch:** main (deploy is auto from main)
  - **Stack:** Next.js 16 (App Router), React 19, TypeScript, Drizzle ORM,
    PostgreSQL, Tailwind 4, Vitest, Bun
  - **Production URL (primary):** https://mrp.dgpbeta.com/
  - **Production URL (fallback, for networks that block the primary):**
    https://mrp-production-8073.up.railway.app/
    Both point to the same live environment.

  ## What to read first (in this order)

  1. `CLAUDE.md` at the repo root — project conventions, skill routing rules,
     architecture pointers. Follow it exactly.
  2. `/Users/kcorless/.claude/projects/-Users-kcorless-Documents-Projects-MRP/me
  mory/MEMORY.md`
     and the memory files it links to (`project-status.md`,
     `feedback-strategic-plan-is-ground-truth.md`, `feedback-git-push.md`).
     These are the prior Claude's point-in-time notes — treat them as context,
     not live truth, and verify against the current code before acting on them.
  3. `docs/strategic-plan-gap-analysis.md` — the authoritative reference for
     where our current MRP design conflicts with the IOC Strategic Plan.
  4. `docs/stakeholder-questions.md` — open design questions with stakeholders
     (Emma Morris at IOC, Martyn at OCOG, Randi, Lucia).
  5. `TODOS.md` — P0 and P1-GAP work items.
  6. `git log --oneline -20` — recent commits.

  ## Critical context that isn't obvious from the code

  - The **IOC Press Accreditation Strategic Plan for LA28 (Feb 2026 FINAL)** is
    the ground-truth process document, jointly agreed between the IOC and LA28.
    When our design conflicts with it, the plan wins. File:
    `docs/input and feedback/IOC Accreditation Strategic
  Plan_2026-Feb-FINAL.docx`
    (regenerate markdown with pandoc if needed).
  - A Thursday 2026-04-16 meeting with IOC + OCOG was the trigger for several
    open architectural questions — check `project-status.md` in memory for the
    list (PbN approval authority, "approve as candidate" framing, ENR as a PbN
    section not a separate track, post-handoff source-of-truth).
  - Admin sessions are sticky (8-hour cookie). To switch users when testing, the
    tester must fully sign out, use the "clear session" link on the login page,
    or open an incognito window. This is called out in the test guides.
  - Four admin roles with distinct dashboards: NOC (primary workflow hub), OCOG
    (PbN approval), IOC (cross-NOC oversight + sudo), IF (sport-scoped, shares
    NOC UI for now).
  - Auth lives in `src/middleware.ts` + `src/lib/session.ts` — don't bypass it.
  - The ACR client (`src/lib/acr/`) is a stub — not wired to a real API yet.

  ## Working conventions I care about

  - `git push` is allowed as part of the commit workflow — push after every
    commit I ask you to make, no need to ask. Force push is not allowed.
  - Tests live in `src/test/`, not colocated. Pattern: `*.test.ts`.
  - Never edit past DB migrations — always generate new ones via `bun
  db:generate`.
  - Markdown docs: when creating a new .md file, add a `Created: dd-MMM-yyyy
  HH:MM z`
    header on the first line (see `~/.claude/rules/markdown-timestamps.md`).
    when you make substantive changes.
  - For user-visible test guides (`docs/monkey-test-guide.md`,
    `docs/test-plan-manual-walkthrough.md`), always regenerate the matching
    `.docx` via pandoc after edits:
    `pandoc input.md -o input.docx --wrap=none`
  - Skill routing is in CLAUDE.md — follow it. E.g. for "ship" or "deploy" use
    the `ship` skill; for bugs use `investigate`; for product brainstorming use
    `office-hours`.

  ## What I do NOT want you to do on first turn

  - Don't start editing code or running commands beyond read-only exploration
    until I give you a task.
  - Don't recreate the prior memory files — you'll build up your own over time.
    Just read them as reference once.

  Please read the files listed above, then reply with: (a) a one-paragraph
  summary of where the project stands today, (b) anything in the memory files
  that looks stale vs. the current repo, and (c) ask me what I want to work on