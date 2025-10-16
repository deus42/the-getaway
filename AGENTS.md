# Agent Operating Guide

This guide defines how Codex agents work inside **The Getaway** repository. Follow it end-to-end before writing code.

## 1. Quick Reference
- Root app: `the-getaway/` (Vite + React + TypeScript).
- Source folders: `src/components`, `src/game`, `src/store`, `src/__tests__`, `src/assets`, `public/`.
- Primary scripts (run from `the-getaway/`): `yarn dev`, `yarn build`, `yarn preview`, `yarn lint`, `yarn test`, `yarn test:watch`.
- Use Yarn for all package scripts and installs.

## 2. Pre-Task Checklist (Mandatory)
1. **Check Linear first**  
   - Open the **MVP** (and **PostMVP** when relevant) Linear projects.  
   - Identify the next `Todo` issue you are assigned to or that matches the roadmap order.  
   - If the target roadmap step lacks a Linear issue, create one immediately under the MVP project before coding.
2. **Confirm task scope**  
   - Read the Linear issue, `memory-bank/mvp-plan.md`, and related memory bank docs (`game-design.md`, `architecture.md`, `plot.md`).  
   - Note prerequisites, validation steps, and documentation requirements.
3. **Update Linear status**  
   - Move the issue to `In Progress` only when you start implementation.  
   - Keep status synchronized; revert to `Todo` if you stop work without finishing.

Do not begin coding until this checklist is complete.

## 3. Implementation Workflow
- **During development**
  - Keep changes focused on the active Linear issue. Ignore unrelated modified files; never revert user-authored work.
  - Prefer incremental commits; use imperative commit messages (Conventional Commits welcome).
  - Follow TypeScript, React, and Redux best practices; avoid default exports for shared utilities.
- **Testing**
  - Match validation steps from the roadmap and Linear ticket.  
  - Default commands: `yarn lint`, targeted `yarn test` runs, or full suites when coverage is expected.  
  - Record executed commands in PR summaries, progress logs, or issue comments.
- **Documentation updates**
  - Update `memory-bank/architecture.md` whenever architectural patterns, game systems, or data flow change.  
  - Update `memory-bank/game-design.md` for gameplay rules, balance numbers, or narrative WHAT decisions.  
  - After finishing a roadmap step, log it in `memory-bank/progress.md` using the XML structure.  
  - Mirror scope changes in `memory-bank/mvp-plan.md` only when the plan itself evolves (never mark completion there).
- **Linear sync**
  - When work completes, add a comment to the Linear issue summarizing tasks performed, validation, and key code references.  
  - Move the issue to `Done` immediately after the implementation, docs, and validation are complete.

## 4. Coding Standards
- TypeScript throughout; add explicit types on exported/public APIs.
- Indentation: 2 spaces, single quotes, trailing semicolons.
- React components use PascalCase files; functions, variables, slices use camelCase.
- Keep code self-explanatory; add brief comments only when complex logic needs framing.
- Prefer `apply_patch` for manual edits; avoid using it for generated files.

## 5. Testing & Validation Expectations
- Jest + React Testing Library (`ts-jest`, `jest-environment-jsdom`).
- Tests live in `src/__tests__/` with `.test.ts` or `.test.tsx` suffixes.
- Setup file: `src/setupTests.ts` (includes `@testing-library/jest-dom`).
- Aim to cover reducers, selectors, and core game logic. Optional coverage via `yarn test --coverage`.
- Document exact commands executed when reporting validation results.

## 6. Memory Bank Discipline
- **Design vs. Architecture**  
  - `game-design.md` = game mechanics, balance, player experience (WHAT).  
  - `architecture.md` = code patterns, modules, data flow (HOW).  
  - Never mix the two; sync both whenever implementation deviates from plan.
- **Progress tracking**  
  - `memory-bank/progress.md` records completed steps only (with XML tags).  
  - `memory-bank/mvp-plan.md` lists scope; edit only to change requirements or ordering.
- **Narrative work**  
  - When adding or editing dialogue/quests, align tone with `memory-bank/plot.md` and cite the referenced section in change summaries.

## 7. Commit & PR Guidelines
- Use imperative messages (`feat:`, `fix:`, etc. acceptable).  
- PRs must include: summary + rationale, linked issues (e.g., `Closes #123`), screenshots/GIFs for UI changes, tests executed, and note any breaking changes.
- Never commit secrets; keep runtime config in `.env.local` with `VITE_` prefixes.
- Place large/optimized assets in `public/`.

## 8. Handoff Requirements
- Before requesting review or merging: confirm implementation, docs, tests, and Linear status are all updated.  
- Provide logical next steps (tests to rerun, smoke checks) when delivering work.  
- If unexpected repo changes appear, pause and ask the user how to proceed—do not revert unowned work.

Adhering to this guide keeps roadmap docs, Linear, and the codebase in sync. Follow it strictly for every task.
