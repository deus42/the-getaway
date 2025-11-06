# Agent Operating Guide

This guide defines how Codex agents work inside **The Getaway** repository. Follow it end-to-end before writing code.

## 1. Quick Reference
- Root app: `the-getaway/` (Vite + React + TypeScript).
- Source folders: `src/components`, `src/game`, `src/store`, `src/__tests__`, `src/assets`, `public/`.
- Build output: `the-getaway/dist/`; Jest mocks live in `the-getaway/__mocks__/`.
- Primary scripts (run from `the-getaway/`): `yarn dev`, `yarn build`, `yarn preview`, `yarn lint`, `yarn test`, `yarn test:watch`.
- Use Yarn for all package scripts and installs.

## 2. Pre-Task Checklist (Mandatory)
1. **Check Linear first**  
   - Use the MCP Linear integration to query the backlog; all Linear lookups must go through MCP commands.  
   - Before starting any roadmap step, confirm MCP access is active. When planning or creating a new MVP task, create the Linear issue (or locate it) and set its status to `Todo`. Leave PostMVP/optional work parked in `Backlog`. Only move an issue to `In Progress` once implementation actually begins so status reflects reality.  
   - Open the **MVP** (and **PostMVP** when relevant) Linear projects and treat them as the live task index.  
   - Identify the next `Todo` issue assigned to you or that matches the roadmap order. Await explicit handoff before pulling in extra work.  
   - If the target roadmap step lacks a Linear issue, create one immediately under the MVP project before coding.
   - For improvement requests, create the Linear ticket first and wait for explicit approval before writing code.
2. **Wrap-up discipline**  
   - Only move the active Linear issue to a terminal state (`Done`, `In Review`, etc.) after the implementation, documentation, validation, and commits are finalized **and the requester explicitly confirms the work**.  
   - Keep the issue in `In Progress` (or `In Review` if that state exists) until the user signs off; do not self-certify completion.  
   - After committing with approval, use MCP to update the issue state before ending the task.
2. **Confirm task scope**  
   - Read the Linear issue, `memory-bank/mvp-plan.md`, and related memory bank docs (`game-design.md`, `architecture.md`, `plot.md`, `post-mvp-plan.md` when applicable).  
   - Note prerequisites, validation steps, documentation requirements, and any linked roadmap references.
3. **Update Linear status**  
   - Move the issue to `In Progress` only when you start implementation and keep status synchronized while coding.  
   - Update the issue description/notes if scope shifts; revert to `Todo` if you stop work without finishing.

Do not begin coding until this checklist is complete.

## 3. Implementation Workflow
- **Operational sequence (follow for every task)**
  1. Accept/confirm the roadmap step or Linear ticket, then move the issue to `In Progress`.
  2. Draft a detailed implementation plan and pause for approval or scope corrections before touching code.
  3. Implement once the plan is approved.
  4. Immediately after implementation, produce a structured Level 0 playtest scenario (step-by-step) that exercises the new behaviour. Do not wait for the user to request it.
  5. Await review; if feedback requires changes, address the notes then regenerate an updated playtest scenario describing the new validation run.
  6. Commit only when explicitly instructed to do so.
  7. After final approval and commit, **wait for the requester to verify the change**; only then move the Linear issue to the terminal state (`Done` unless otherwise directed).
  8. If verification is still pending, leave the issue in `In Progress` (or `In Review`) so follow-up can occur without reopening states.

- **During development**
- Keep changes focused on the active Linear issue. Ignore unrelated modified files; never revert user-authored work.  
- Prefer incremental commits; use imperative commit messages (Conventional Commits welcome).  
- Keep the Linear issue state aligned with reality (e.g., pause → `Todo`, active work → `In Progress`).  
- Follow TypeScript, React, and Redux best practices; avoid default exports for shared utilities.
- When a feature needs hands-on validation, ensure Level 0 contains or is updated with an accessible scenario that exercises the new behavior before closing the task.
- Reference the active Linear key (for example, `GET-9`) in every commit message so Git ↔ Linear linking stays automatic.
- For any styling or theming request, audit the relevant HUD/app surfaces across the whole solution and update inconsistent styles or tokens so the UX remains cohesive—do not leave outdated palettes or utilities behind.
- **Testing**
  - Match validation steps from the roadmap and Linear ticket.  
  - Default commands: `yarn lint`, targeted `yarn test` runs, or full suites when coverage is expected.  
  - Record executed commands in PR summaries, progress logs, or issue comments.
  - Each time an implementation or follow-up fix lands, produce a concise QA playtest script (typically 3–6 steps) that can be run in Level 0 to verify the change; include the script in the task summary or review response.
- **Documentation updates**
  - Update `memory-bank/architecture.md` whenever architectural patterns, game systems, or data flow change.  
  - Update `memory-bank/game-design.md` for gameplay rules, balance numbers, or narrative WHAT decisions.  
  - After finishing a roadmap step, log it in `memory-bank/progress.md` using the XML structure.  
  - Mirror scope changes in `memory-bank/mvp-plan.md` only when the plan itself evolves (never mark completion there).  
  - Reference `memory-bank/post-mvp-plan.md` when deferring work beyond MVP.
- **Linear sync**
  - Ensure every roadmap step has a corresponding Linear issue under the correct project.  
  - When work completes, add a comment to the Linear issue summarizing tasks performed, validation, and key code references.  
  - Move the issue to `Done` immediately after the implementation, docs, and validation are complete.
- **Narrative work**
  - When adding or editing dialogue/quests, align tone with `memory-bank/plot.md` and cite the referenced section in change summaries.
- **Finalize before commits**
  - Confirm implementation soundness before committing; do not request merges until tests, docs, and issues are aligned.

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
  - Log each completed roadmap step in `progress.md` with matching step IDs and summary details.
- **Narrative work**  
  - When adding or editing dialogue/quests, align tone with `memory-bank/plot.md` and cite the referenced section in change summaries.  
  - Review `memory-bank/post-mvp-plan.md` for deferred narrative beats.

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

## 9. Repository Reference
### Project Structure & Module Organization
- Root app lives in `the-getaway/` (Vite + React + TypeScript).
- Source code in `the-getaway/src/`:
  - `components/` (UI like `GameCanvas.tsx`, `GameController.tsx`)
  - `game/` (core logic: `combat/`, `world/`, `quests/`, `interfaces/`, `scenes/`)
  - `store/` (Redux Toolkit slices: `playerSlice.ts`, `worldSlice.ts`)
  - `__tests__/` (unit/integration tests)
  - `assets/` and `public/` for static files
- Build output in `the-getaway/dist/`. Jest mocks in `the-getaway/__mocks__/`.

### Build, Test, and Development Commands
- Dev server: `cd the-getaway && yarn dev` (Vite on localhost).
- Build: `yarn build` (type-check + production bundle to `dist/`).
- Preview build: `yarn preview`.
- Lint: `yarn lint` (ESLint per `eslint.config.js`).
- Tests: `yarn test` or `yarn test:watch` (Jest + jsdom).

### Security & Configuration Tips
- Do not commit secrets. For runtime config, prefer Vite envs prefixed with `VITE_` and keep local values in `.env.local` (gitignored).
- Large assets belong in `public/` and should be optimized.

## 10. Roadmap & Memory Bank Reference
- The 24-step implementation roadmap lives in `memory-bank/mvp-plan.md` (Phases 1–8). Keep numbering intact and update the plan only when scope changes.
- Treat `memory-bank/mvp-plan.md` as the authoritative scope document—do not record completion status there.
- Mirror completed work in `memory-bank/progress.md`; each milestone should reference the matching step number and appear in chronological order.
- Cross-check plan vs. progress before merging large features so documentation and code stay in sync.
- `memory-bank/plot.md` folds in the story overview—review it whenever narrative beats, quests, or factions are touched.
- `memory-bank/game-design.md` documents the agreed toolchain and gameplay pillars; align new systems with it or log deviations.
- `memory-bank/architecture.md` must reflect current code structure. Update it alongside architectural changes so docs never drift.
- `memory-bank/post-mvp-plan.md` captures deferred Phase 9 optional expansions (advanced stamina, vehicle systems, survival mode); consult it when planning post-MVP work.

## 11. Linear Workflow Callouts
- Use the Linear “MVP” and “PostMVP” projects as the live task index; review them before picking up work so you don’t have to rescan the full plan/progress set each time.
- Keep Linear issues in sync with roadmap status; update the issue state and descriptions whenever a step is added, started, or completed.
- Create a Linear issue under the “MVP” project for every roadmap step/task as soon as it is added, and keep the issue status in sync with its completion in the docs.
- Leave MVP roadmap issues in `Todo` through the planning phase and only switch to `In Progress` while actively implementing them; keep PostMVP items in `Backlog` until they are formally pulled into scope. Move issues to `Done` immediately after the corresponding implementation, documentation, and validation finish.
- After finishing a roadmap step (or related Linear task), add an implementation summary comment to the matching Linear issue before moving it to `Done`; include key tasks, validation, and notable code references.
- **Linear ticket types**: review the ticket type reference below and always apply the matching `Feature`, `Improvement`, or `Bug` label when creating an issue via MCP so downstream automation stays intact; improvements do not replace feature tickets in the roadmap.

### Ticket Type Reference
- **Feature**: Create these when you are delivering a net-new roadmap capability or advancing an existing roadmap step. They should track scope from the MVP/PostMVP plan and carry the `Feature` label.
- **Improvement**: Use this classification for UX polish, quality-of-life changes, or refinements to already shipped systems. Improvements never replace roadmap features and must be labelled `Improvement`.
- **Bug**: File bugs for regressions, defects, or broken behaviours that were previously working. Bugs should highlight the observed failure and include the `Bug` label.
- Whenever you open an issue through MCP, apply the label that matches the ticket type so reporting and automations stay accurate.

### Definition of Done
- After the implementation is complete and before requesting feedback or review, run the full unit test suite and ensure it passes (`yarn test`).
- Verify total Jest coverage is **greater than 80%**; use `yarn test --coverage` (or the project’s equivalent) and address any regressions before proceeding.
- Do not hand off work, request review, or move a Linear issue forward until both conditions above are satisfied.
- Include the executed test command(s) and coverage confirmation in the task summary or issue comment when reporting completion.

## 12. Accountability Protocol
- When delivering results in this workspace, restate the user’s latest request in detail before describing your work. Include every explicit instruction so reviewers can trace outcomes back to the ask.
- Follow the format: **Initial Ask** (verbatim or high-fidelity restatement), **What We Did**, **Playtest/Validation**.
- Do not omit requirements even if they were later clarified; list all directives so accountability is clear.
- Maintain a living Ask Log that captures every user directive. Group entries by related areas, work through them step-by-step, cross out items when completed, and keep the log updated as requests evolve.
- Pause mid-implementation for validation whenever a grouped set of asks raises ambiguity or benefits from an early check-in.

## 13. Separation of Concerns: Design vs Architecture
**CRITICAL:** Understand the difference before making changes.

- **game-design.md = WHAT** (gameplay mechanics, rules, balance numbers, player experience)
- **architecture.md = HOW** (code patterns, modules, file paths, technical implementation)

### Decision Guide
- Player mechanics, AP costs, damage? → **game-design.md**
- Code organization, Redux slices, file paths? → **architecture.md**
- Game rules and formulas? → **game-design.md**
- Design patterns, data flow? → **architecture.md**

### Two-Way Sync
1. **Design → Implementation**: Update game-design.md (WHAT) → Implement → Document in architecture.md (HOW) → Log in progress.md.
2. **Technical Constraint → Design**: Note in architecture.md → Adjust game-design.md if needed → Document compromise.

### Common Mistakes
- ❌ Putting code paths in game-design.md.
- ❌ Putting balance numbers in architecture.md.
- ✅ Keep WHAT and HOW separate.

## 14. XML Tagging in Documentation
The memory-bank documentation uses XML tags to improve LLM agent parsing and information retrieval. When reading or updating documentation:

### progress.md Structure
- `<step id="N" status="completed|pending">` - Wraps each completed implementation step.
- `<step_metadata>` - Contains step number, title, status, and completion date.
- `<tasks>` - Lists concrete tasks accomplished in the step.
- `<implementation>` - Technical implementation details (optional).
- `<code_reference file="path">` - References specific files modified.
- `<validation>` - Test commands and validation procedures.
- `<notes>` or `<maintenance_notes date="...">` - Additional context.

### mvp-plan.md Structure
- `<phase id="N" name="...">` - Groups related steps by implementation phase.
- `<step id="N">` - Individual implementation steps (no status attribute; track status only in progress.md).
- `<step_metadata>` - Step metadata including phase assignment.
- `<instructions>` - High-level task description.
- `<details>` - Detailed implementation requirements.
- `<test>` - Validation and testing procedures.

### Benefits of XML Structure
- **Quick Navigation**: Agents can extract specific steps by ID or status.
- **Structured Queries**: Easy to find all pending tasks or completed work.
- **Hierarchical Context**: Phase grouping provides implementation context.
- **Validation Tracking**: Test procedures are explicitly tagged for reference.

### architecture.md Structure
- `<architecture_section id="..." category="...">` - Major architectural patterns and systems.
- `<pattern name="...">` - Named design patterns (e.g., "Manhattan Grid System", "Unidirectional Data Flow").
- `<design_principles>` - Key design decisions and principles.
- `<technical_flow>` - Step-by-step technical implementation flows.
- `<code_location>` - File paths and module references.

### game-design.md Structure (Optional Tags)
- `<game_system id status>` - Major gameplay systems (status: implemented|partial|not_implemented).
- `<mechanic name>` - Individual game mechanics.
- `<rule type>` - Game rules (type: formula|constraint|condition).
- `<balance_values system>` - Numerical tuning values.
- `<implementation_status>` - Current state (✅ IMPLEMENTED | ⚠️ PARTIAL | ❌ NOT IMPLEMENTED).

### When Updating Documentation
- Maintain existing XML structure and tag hierarchy.
- Record completion status exclusively in `memory-bank/progress.md`; update the plan only when scope or requirements change.
- Keep tags well-formed (properly opened and closed).
- Use appropriate category attributes.

### Validation Before/After Implementation
- **Before:** Check game-design.md for feature spec (WHAT), check architecture.md for patterns (HOW).
- **After:** Update both documents with what changed, log completion in progress.md.
- Tag XML sections incrementally as they're referenced/updated (not required for all content immediately).
