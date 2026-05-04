# Agent Operating Guide

## Vault Preload

- Before repo-specific work, read `/Users/deus/Projects/Vault-Tec/00 Agent Memory.md`.
- From that entrypoint, preload `35 Context/Agent Operating System.md`.
- Then read this repo's Source Project overlay under `90 Admin/Workstream Registry/Source Projects/`.
- Treat this file as the repo-specific specialization after Vault defaults.

This guide defines how Codex agents work inside **The Getaway** repository. Follow it end-to-end before writing code.

## Guide Use & Priority
- Active workflow sections are `Vault Preload`, `Quick Reference`, `Pre-Task Checklist`, `Implementation Workflow`, `Execution Policy`, `Testing & Validation`, `Memory Bank Discipline`, `Handoff Requirements`, and `Task Notes & Resume`.
- Sections `9` through `15` are reference material. Use them when they apply, but do not let reference detail delay the active workflow.
- If sections conflict, follow the higher-priority active workflow section first, then the more specific project rule, then the reference section.
- For AGENTS, instruction, or workflow-only doc changes, do not create or move Linear issues unless the requester explicitly asks. Use the active cross-repo AGENTS worklog or a local `progress/adhoc-<task-slug>.md` note when continuity is needed.
- MVP readiness updates apply only to gameplay, UX, roadmap, or acceptance-risk changes. Skip them for instruction-only changes and state that they were skipped.
- Debug, Rating, Review, and ask-log expectations are operational controls, not substitutes for doing the task. Keep the main result first.

## 1. Quick Reference
- Root app: `the-getaway/` (Vite + React + TypeScript).
- Source folders: `src/components`, `src/game`, `src/store`, `src/__tests__`, `src/assets`, `public/`.
- Build output: `the-getaway/dist/`; Jest mocks live in `the-getaway/__mocks__/`.
- Primary scripts (run from `the-getaway/`): `yarn dev`, `yarn build`, `yarn preview`, `yarn lint`, `yarn test`, `yarn test:watch`.
- Local ports: Vite dev runs at `http://localhost:5174`; Vite preview runs at `http://localhost:4174`; both use `strictPort`.
- Use Yarn for all package scripts and installs.
- Default working branch: `main`. At task start, switch the shared workspace to `main` and keep implementation + approved commits on `main` unless the requester explicitly asks for a separate branch/worktree.
- Character presentation default: hero appearance presets and Level 0 named interactive NPCs should use the manifest-driven sprite pipeline (`the-getaway/src/content/characters/spriteManifest.ts`, `the-getaway/public/characters/<spriteSetId>/`, `SpriteCharacterRigFactory`). Keep the noir-vector rigs only as fallback when the sprite matrix is incomplete/invalid or the actor is outside the current sprite rollout.

## Docs (Obsidian Vault)
The `memory-bank/` folder is an Obsidian vault (Markdown-only) and is the canonical project documentation.

Start here:
- Vault home: `memory-bank/00 Home.md`

Key docs:
- MVP design hub: `memory-bank/01 MVP/Game Design.md`
- Roadmap + progress log: `memory-bank/04 Engineering/Roadmap.md`
- Architecture (HOW): `memory-bank/04 Engineering/Architecture.md`
- Lore (WHAT/tone): `memory-bank/03 Lore/Plot Bible.md`
- Post-MVP index: `memory-bank/02 Post-MVP/00 Index.md`

## 2. Pre-Task Checklist (Mandatory for gameplay/roadmap implementation)
1. **Check Linear first**
   - Use the MCP Linear integration to query the backlog; all Linear lookups must go through MCP commands.
   - Before starting any roadmap step, confirm MCP access is active. When planning or creating a new MVP task, locate the existing Linear issue or ask the requester whether they want a new ticket created. Do not create a new issue silently. When a new issue is approved, set it to `Todo`. Leave PostMVP/optional work parked in `Backlog`. Only move an issue to `In Progress` once implementation actually begins so status reflects reality.
   - Open the **MVP** (and **PostMVP** when relevant) Linear projects and treat them as the live task index.
   - Identify the next `Todo` issue assigned to you or that matches the roadmap order. Await explicit handoff before pulling in extra work.
   - If the target roadmap step lacks a Linear issue, ask the requester whether to create one before coding. Reuse the active ticket when the ask is a direct follow-up and a separate issue would add no value.
   - For improvement requests, do not create a new Linear ticket until the requester explicitly asks for one or approves creating it.
2. **Wrap-up discipline**
   - Only move the active Linear issue to a terminal state (`Done`, `In Review`, etc.) after the implementation, documentation, validation, and commits are finalized **and the requester explicitly confirms the work**.
   - Keep the issue in `In Progress` (or `In Review` if that state exists) until the user signs off; do not self-certify completion.
   - After committing with approval, use MCP to update the issue state before ending the task.
3. **Confirm task scope**
   - Read the Linear issue, `memory-bank/04 Engineering/Roadmap.md`, and related memory bank docs (`01 MVP/Game Design.md`, `04 Engineering/Architecture.md`, `03 Lore/Plot Bible.md`).
   - Note prerequisites, validation steps, documentation requirements, and any linked roadmap references.
4. **Update Linear status**
   - Move the issue to `In Progress` only when you start implementation and keep status synchronized while coding.
   - Update the issue description/notes if scope shifts; revert to `Todo` if you stop work without finishing.
5. **Re-read + log asks before any action**
   - After **every** user ask (not just each session) and when resuming work, re-open this AGENTS.md guide (Sections 2–3 & 15) and the active `progress/<Linear-key>.md` file before touching code.
   - Immediately append the new directive to the Ask Log (UTC timestamp + verbatim ask + result placeholder) and refresh every applicable section (plan, notes, validation, etc.) before implementing anything from that ask.
   - Ensure each `progress/<Linear-key>.md` starts with a “Session Reminders” block highlighting this per-ask logging requirement; glance at that block every time you open the file.
   - If a progress file already exists when you start a new session, explicitly ask the requester whether to continue from the existing notes or start fresh; if they prefer a fresh start, rewrite the file (preserving only the new Ask Log) before planning.

6. **Update MVP readiness after every gameplay/UX task**
   - After finishing any gameplay/UX task (feature or fix), update: `memory-bank/01 MVP/95 MVP Readiness Checklist.md`.
   - In your handoff message, always include a short “MVP Readiness Summary” snippet (what got checked/what risk changed).

Do not begin coding until this checklist is complete.

## 3. Implementation Workflow

### Operational Sequence
1. Accept/confirm the roadmap step or Linear ticket, then move the issue to `In Progress`.
2. Draft a detailed implementation plan and pause for approval or scope corrections before touching code.
3. Implement once the plan is approved, iterating as needed; defer automated test authoring/execution until the requester accepts the behaviour.
4. Immediately run the post-implementation review loop: rate the work on task-appropriate dimensions, review the diff, fix safe findings automatically, rerun the relevant checks, then rate it again.
5. Immediately after implementation, produce a structured Level 0 playtest scenario (step-by-step) that exercises the new behaviour. Do not wait for the user to request it.
6. Await review; if feedback requires changes, address the notes then regenerate an updated playtest scenario describing the new validation run. Repeat this loop until the requester explicitly accepts the behaviour.
7. Only after acceptance, add/execute the required automated tests (`yarn lint`, builds, unit/integration suites, coverage) and capture the results for handoff or a dedicated testing agent/session.
8. Commit only when explicitly instructed to do so and after the acceptance-driven testing pass is complete.
9. After final approval and commit, **wait for the requester to verify the change**; only then move the Linear issue to the terminal state (`Done` unless otherwise directed).
10. If verification is still pending, leave the issue in `In Progress` (or `In Review`) so follow-up can occur without reopening states.

**Magic words (finish / complete / commit)**
When the requester uses any of these terms, treat it as a mandate to finalize the task: (1) ensure automated tests have been written/executed (lint, build, test, coverage) even if they were deferred earlier, (2) create the instructed commit(s) referencing the Linear key, (3) post the Linear issue summary comment, and (4) move the ticket to `Done` only after verification. Ask clarifying questions if any prerequisite (acceptance, test scope, commit message) is unclear before proceeding.

### Session Loop Reminder
1. Re-read AGENTS.md and the active `progress/<Linear-key>.md` before touching code.
2. Update the Ask Log/plan in `progress/<Linear-key>.md`.
3. Draft/refresh the implementation plan and pause for confirmation when required.
4. Implement, update notes with key decisions/tasks, and run validation.
5. Post the Linear issue comment summarizing work/tests before moving the ticket forward.

### During Development
- Keep changes focused on the active Linear issue. Ignore unrelated modified files; never revert user-authored work.
- Prefer incremental commits; use imperative commit messages (Conventional Commits welcome).
- When reviewing or comparing local changes, always diff against the current HEAD commit (the workspace baseline); do not compare against older commits unless the user explicitly requests a different ref.
- Keep the Linear issue state aligned with reality (e.g., pause → `Todo`, active work → `In Progress`).
- Unless the requester explicitly asks for branch isolation, switch the visible/shared workspace to `main` before implementing. Do not create hidden side branches or worktrees by default.
- Keep approved commits on `main`; do not implement in one branch/worktree and sync the result into another branch later.
- Follow TypeScript, React, and Redux best practices; avoid default exports for shared utilities.
- Maintain a per-task notes file. Before drafting your plan for a Linear issue, create or open a notes file at `progress/<Linear-key>.md` (for example, `progress/GET-117.md`). Use this file to record the Initial Ask, your implementation plan, key decisions, tasks executed, and the Level 0 validation script. Read and update this file whenever you resume work on the task to refresh context and mitigate context rot. These notes are separate from `memory-bank/04 Engineering/Roadmap.md` and should focus on actionable summaries rather than internal chain-of-thought.
- When a feature needs hands-on validation, ensure Level 0 contains or is updated with an accessible scenario that exercises the new behavior before closing the task.
- Reference the active Linear key (for example, `GET-9`) in every commit message so Git ↔ Linear linking stays automatic.
- When touching hero or named interactive NPC presentation, treat sprite-backed rendering as the default target and preserve vector-rig fallback only for missing/invalid sprite sets or actors that are not yet in the sprite manifest rollout.
- **Session workflow (mandatory):**
  1. Log the directive in `progress/<Linear-key>.md` with timestamp/Ask/Result placeholders.
  2. Re-read the log + plan, update the plan for the new directive.
  3. Only then implement. If step 1 isn’t complete, stop—no code edits.
- **Ask Log format:** Each entry must include UTC timestamp, verbatim ask, and a concise “Result” referencing touching files/sections so we can trace Ask → Change later.
- **Refactor & HUD styling:** When extracting/refactoring, move the existing values verbatim into dedicated component CSS (Tailwind utilities where possible). Confirm behaviour is unchanged before applying any tweaks; ask if uncertain. Every HUD/UI component keeps its own CSS surface—no bundled blobs.
- For any styling or theming request, audit the relevant HUD/app surfaces across the whole solution and update inconsistent styles or tokens so the UX remains cohesive—do not leave outdated palettes or utilities behind.

### Testing During Implementation
- Match validation steps from the roadmap and Linear ticket.
- Default commands: `yarn lint`, targeted `yarn test` runs, or full suites when coverage is expected.
- Record executed commands in PR summaries, progress logs, or issue comments.
- Each time an implementation or follow-up fix lands, produce a concise QA playtest script (typically 3–6 steps) that can be run in Level 0 to verify the change; include the script in the task summary or review response.
- Each implementation pass must also produce an initial rating, concrete review findings, fixes made, and a final rating using the dimensions that make sense for the task, such as correctness, scope discipline, UX, docs, validation, and performance.

### Building Positioning Workflow
- Treat building placement as a measured workflow, not an open-ended tuning loop. Before changing any building after the first pass, save a baseline in `progress/<Linear-key>.md` that includes: the current constants, the screenshot path used for comparison, and explicit edge-by-edge mismatch notes.
- Isolate variables. In any single pass, change exactly one of the following unless the requester explicitly asks for a mixed tradeoff: footprint geometry, render scale/origin/offset, door anchor, or depth/opacity/readability.
- Do not combine sprite-fit tuning and footprint tuning in the same pass by default. If both look wrong, pick the source-of-truth problem first, save a baseline, and adjust one class of variable at a time.
- After one measured rectangular/parallelogram fit pass, compare the mismatch against the runbook rubric in `memory-bank/04 Engineering/Building Positioning Runbook.md`. If the art still misses by more than the allowed tolerance, stop trim-chasing and switch the implementation plan to a custom polygon or multi-region footprint.
- When a pass moves the wrong edge or reopens a previously correct edge, revert to the saved baseline before attempting the next correction.

### Documentation Updates
- Update `memory-bank/04 Engineering/Architecture.md` whenever architectural patterns, game systems, or data flow change.
- Update `memory-bank/01 MVP/Game Design.md` for gameplay rules, balance numbers, or narrative WHAT decisions.
- After finishing a feature roadmap step, log it in `memory-bank/04 Engineering/Roadmap.md` (progress log section) using Markdown; skip improvements and bug fixes.
- Mirror scope changes in `memory-bank/04 Engineering/Roadmap.md` only when the plan itself evolves (never mark completion inside the plan section).
- When deferring work beyond MVP, add a note to `memory-bank/04 Engineering/Roadmap.md` and file details under `memory-bank/02 Post-MVP/` (see `memory-bank/02 Post-MVP/00 Index.md`).

### Linear Sync
- Ensure every roadmap step has a corresponding Linear issue under the correct project.
- When work completes, add a comment to the Linear issue summarizing tasks performed, validation, and key code references.
- Move the issue to `Done` only after implementation, docs, validation, commit approval, and requester verification are complete.

### Narrative Work
- When adding or editing dialogue/quests, align tone with `memory-bank/03 Lore/Plot Bible.md` and cite the referenced section in change summaries.

### Finalize Before Commits
- Confirm implementation soundness before committing; do not request merges until tests, docs, and issues are aligned.
- Commit message format (all issue types):
  - Use `type(GET-XXX): imperative summary` where `type` ∈ {`feat`, `fix`, `improvement`, `docs`, `refactor`, `test`, `perf`}.
  - The Linear key (`GET-XXX`) must appear exactly once in parentheses immediately after the type.
  - Keep the summary imperative and ≤ 72 characters.
  - Example: `fix(GET-115): prevent autobattle overlay blackout`

## Execution Policy
- For non-trivial gameplay, UI, or architecture work, bias toward caution over speed. For trivial copy or doc edits, use judgment and keep the loop tight.
- Extract and apply the active policy stack before work starts: platform and developer instructions, Vault OS policies, this repo's `Execution Policy`, `Never Guess Policy`, task-note/resume rules, Linear/workflow rules, validation/review requirements, security boundaries, and project-specific constraints.
- Handoff safeguard: keep the main result first, keep Debug factual, and skip/shorten it for tiny tasks.
- Workflow trace rule: when producing Debug, task notes, or KB-worthy handoffs, include linked `Used Policies`, linked `Instruction Sources`, and linked `Instruction Modified` for instruction/workflow files only; skip broad product/code file inventories unless those files define workflow policy.
- KB trace rule: for meaningful multi-ask work, preserve a concise ask/reply log in the task note: user ask, agent response/outcome, verification, and next step. Do not record hidden reasoning.
- Rating trace rule: when producing Rating, put `Iterations` under Rating and use `Suggested Next Steps` for the concrete work that would raise the result to `10/10`; write `none` only when no useful improvement remains.
- Compaction refresh rule: after any context compaction, session resume, or same-task follow-up, immediately re-open the current disk `AGENTS.md` and active task note/worklog from the filesystem before answering, editing, reviewing, validating, or handing off; cached conversation context, compacted summaries, prior tool output, pasted excerpts, and remembered instructions are not substitutes.

### Never Guess Policy
- Never invent source contents, command output, validation, file edits, dates, review results, sub-agent results, tool results, or user intent.
- Inspect first when repo files, Vault notes, task notes, generated reports, overlays, local docs, or tools can answer.
- Ask a sharp question when ambiguity changes scope, source-of-truth precedence, generated-vs-human ownership, mutation permission, rollback target, branch/worktree strategy, data source, safety, privacy boundary, validation path, or user preference.
- For low-risk assumptions, state the assumption, verify it when possible, and record it in the task note when meaningful.
- Never claim review, sub-agent work, tests, validation, command output, or file edits without tool evidence.
- Use `skipped`, `not checked`, `unavailable`, or `unknown` when evidence is missing, access is blocked, or a check was not run.

### Think Before Coding
- Surface assumptions about the active Linear issue, roadmap step, playtest target, and design-vs-architecture boundary before implementing.
- Ask instead of guessing when gameplay intent, UX expectations, or ticket scope is ambiguous.
- State tradeoffs when a smaller mechanic or UI change is safer than a broader system rewrite.

### Simplicity First
- Ship the minimum change that satisfies the accepted behavior.
- Do not add speculative systems, reusable abstractions, or polish passes unless the ticket or requester actually calls for them.

### Surgical Changes
- Touch only the code, docs, assets, and progress notes directly tied to the active issue.
- Avoid adjacent refactors or asset churn unless your change makes them stale, broken, or misleading.

### Goal-Driven Execution
- Turn the ask into explicit proof points: Level 0 playtest steps, acceptance criteria, and post-acceptance automated checks.
- Do not claim completion until the requested behavior and the required verification loop are both explicit.

## 4. Coding Standards
- TypeScript throughout; add explicit types on exported/public APIs.
- Indentation: 2 spaces, single quotes, trailing semicolons.
- React components use PascalCase files; functions, variables, slices use camelCase.
- Keep code self-explanatory; add brief comments only when complex logic needs framing.
- Prefer `apply_patch` for manual edits; avoid using it for generated files.

## 5. Testing & Validation Expectations
- **Post-acceptance only:** Do not write or execute automated tests (unit, integration, coverage) until the requester explicitly accepts the in-game behaviour proven via the Level 0 playtest loop.
- Once acceptance is granted, add/adjust the necessary Jest suites (React Testing Library with `ts-jest`/`jest-environment-jsdom`) and run the required commands (`yarn lint`, `yarn build`, `yarn test`, `yarn test --coverage`). Capture these results in your summary or delegate them to a dedicated testing agent/session if instructed.
- Tests live in `src/__tests__/` with `.test.ts` or `.test.tsx` suffixes; setup file remains `src/setupTests.ts` (includes `@testing-library/jest-dom`).
- Aim to cover reducers, selectors, and core game logic. Optional coverage via `yarn test --coverage` becomes mandatory during the acceptance-to-commit phase.
- Document the executed commands and coverage confirmation when handing off or closing the task.

## 6. Memory Bank Discipline

### Design vs. Architecture
- `game-design.md` = game mechanics, balance, player experience (WHAT).
- `architecture.md` = code patterns, modules, data flow (HOW).
- Never mix the two; sync both whenever implementation deviates from plan.

### Progress Tracking
- `memory-bank/04 Engineering/Roadmap.md` records completed feature steps only in its progress log section; do not log improvements or bug fixes there.
- The plan sections inside `memory-bank/04 Engineering/Roadmap.md` list scope; edit only to change requirements or ordering.
- Log each completed feature roadmap step in the progress log with matching step IDs and summary details.

### Narrative Work
- When adding or editing dialogue/quests, align tone with `memory-bank/03 Lore/Plot Bible.md` and cite the referenced section in change summaries.
- Review deferred narrative beats under `memory-bank/02 Post-MVP/` (see `memory-bank/02 Post-MVP/00 Index.md`).

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

## 8a. Reporting & Handoff Policy
- Keep the main result first. Reporting sections support the handoff; they must not bury the outcome.
- For meaningful implementation handoffs, use this order when applicable: `Review`, `Rating`, then `Debug`. Include `Insights` only when there is a non-obvious task-relevant insight.
- For explicit review or audit asks, lead with findings first, then `Rating`, then `Debug`.
- Review is enabled for meaningful file changes. Perform it locally unless the requester explicitly authorizes sub-agent review and active platform/tool instructions permit it.
- Rating is enabled for meaningful work. Use 3 to 5 task-relevant rows, include `Iterations` under Rating, and use `Suggested Next Steps` for the concrete work that would raise the result to `10/10`.
- Debug is enabled for meaningful work that changes files, updates progress/workflow notes, performs audits/reviews, or has meaningful execution state. Disable it for one ask only when the user writes `Debug: off`.
- Debug must be factual and main-agent-authored. Include linked `Used Policies`, `Instruction Sources`, and `Instruction Modified` for instruction/workflow files only; skip broad product/code inventories unless those files define workflow policy.
- Use `skipped`, `not checked`, `unavailable`, or `unknown` when evidence is missing. Never claim tests, validation, review, sub-agent work, command output, or edits without tool evidence.
- Tiny/casual answers may skip Review, Rating, and Debug unless the requester asks for them.

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
- Dev server: `cd the-getaway && yarn dev` (Vite on `http://localhost:5174`, strict port).
- Build: `yarn build` (type-check + production bundle to `dist/`).
- Preview build: `yarn preview` (`http://localhost:4174`, strict port).
- Lint: `yarn lint` (ESLint per `eslint.config.js`).
- Tests: `yarn test` or `yarn test:watch` (Jest + jsdom).

### Security & Configuration Tips
- Do not commit secrets. For runtime config, prefer Vite envs prefixed with `VITE_` and keep local values in `.env.local` (gitignored).
- Large assets belong in `public/` and should be optimized.

## 10. Roadmap & Memory Bank Reference
- The implementation roadmap lives in `memory-bank/04 Engineering/Roadmap.md` (MVP + Post-MVP sections). Keep numbering intact and update the plan sections only when scope changes.
- Treat `memory-bank/04 Engineering/Roadmap.md` as the authoritative scope document—do not record completion status inside the plan sections.
- Mirror completed feature work in the progress log; each milestone should reference the matching step number and appear in chronological order, and skip logging improvements or bug fixes.
- Cross-check plan vs. progress before merging large features so documentation and code stay in sync.
- `memory-bank/03 Lore/Plot Bible.md` folds in the story overview—review it whenever narrative beats, quests, or factions are touched.
- `memory-bank/01 MVP/Game Design.md` documents the agreed toolchain and gameplay pillars; align new systems with it or log deviations.
- `memory-bank/04 Engineering/Architecture.md` must reflect current code structure. Update it alongside architectural changes so docs never drift.
- Post-MVP specs live under `memory-bank/02 Post-MVP/` (see `memory-bank/02 Post-MVP/00 Index.md`); consult those notes when planning post-MVP work so MVP docs stay clean.

## 11. Linear Workflow Callouts
- Use the Linear “MVP” and “PostMVP” projects as the live task index; review them before picking up work so you don’t have to rescan the full plan/progress set each time.
- Keep Linear issues in sync with roadmap status; update the issue state and descriptions whenever a step is added, started, or completed.
- When a roadmap step/task needs a new Linear issue, ask the requester before creating it. If approved, create it under the “MVP” project and keep the issue status in sync with its completion in the docs. Reuse the active issue for direct follow-up asks when that keeps tracking clearer.
- Leave MVP roadmap issues in `Todo` through the planning phase and only switch to `In Progress` while actively implementing them; keep PostMVP items in `Backlog` until they are formally pulled into scope. Move issues to `Done` only after the corresponding implementation, documentation, validation, commit approval, and requester verification finish.
- After finishing a roadmap step (or related Linear task), add an implementation summary comment to the matching Linear issue before moving it to `Done`; include key tasks, validation, and notable code references.
- **Linear ticket types**: review the ticket type reference below and always apply the matching `Feature`, `Improvement`, or `Bug` label when creating an issue via MCP so downstream automation stays intact; improvements do not replace feature tickets in the roadmap.

### Ticket Type Reference
- **Feature**: Create these when you are delivering a net-new roadmap capability or advancing an existing roadmap step. They should track scope from the MVP/PostMVP plan and carry the `Feature` label.
- **Improvement**: Use this classification for UX polish, quality-of-life changes, or refinements to already shipped systems. Improvements never replace roadmap features and must be labelled `Improvement`.
- **Bug**: File bugs for regressions, defects, or broken behaviours that were previously working. Bugs should highlight the observed failure and include the `Bug` label.
- Whenever you open an issue through MCP, apply the label that matches the ticket type so reporting and automations stay accurate.

### Definition of Done
- After the requester explicitly accepts the Level 0 behaviour (Implementation Workflow Step 5), run the full lint pass and resolve all issues (`yarn lint` must exit cleanly).
- Build the project to confirm it compiles without errors (`yarn build`).
- Run the full unit test suite and ensure it passes (`yarn test`).
- Verify total Jest coverage is **greater than 80%**; use `yarn test --coverage` (or the project’s equivalent) and address any regressions before proceeding.
- Do not hand off work, request review, or move a Linear issue forward until all commands above succeed; this post-acceptance testing block can be executed by you or a delegated testing agent/session.
- Include each executed command (lint, build, test, coverage) and the coverage confirmation in the task summary or issue comment when reporting completion.

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
1. **Design → Implementation**: Update game-design.md (WHAT) → Implement → Document in architecture.md (HOW) → Log in the progress log (feature roadmap completions only).
2. **Technical Constraint → Design**: Note in architecture.md → Adjust game-design.md if needed → Document compromise.

### Common Mistakes
- ❌ Putting code paths in game-design.md.
- ❌ Putting balance numbers in architecture.md.
- ✅ Keep WHAT and HOW separate.

## 14. XML Tagging in Documentation
The memory-bank documentation uses XML tags to improve LLM agent parsing and information retrieval. When reading or updating documentation:

### progress.md Structure (Progress Log)
(Use these tags exclusively for completed feature roadmap steps—do not add improvements or bug fixes.)
- `<step id="N" status="completed|pending">` - Wraps each completed implementation step.
- `<step_metadata>` - Contains step number, title, status, and completion date.
- `<tasks>` - Lists concrete tasks accomplished in the step.
- `<implementation>` - Technical implementation details (optional).
- `<code_reference file="path">` - References specific files modified.
- `<validation>` - Test commands and validation procedures.
- `<notes>` or `<maintenance_notes date="...">` - Additional context.

### progress.md Structure (Plan Sections)
- `<phase id="N" name="...">` - Groups related steps by implementation phase.
- `<step id="N">` - Individual feature implementation steps (no status attribute; track status only in the progress log section).
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
- Record feature completion status exclusively in the progress log; update the plan sections only when scope or requirements change.
- Keep tags well-formed (properly opened and closed).
- Use appropriate category attributes.

### Validation Before/After Implementation
- **Before:** Check game-design.md for feature spec (WHAT), check architecture.md for patterns (HOW).
- **After:** Update both documents with what changed, log completion in the progress log (features only).
- Tag XML sections incrementally as they're referenced/updated (not required for all content immediately).

## 15. Task Notes & Resume / Per-Task Progress Files

To mitigate context rot and preserve a detailed record for every Linear ticket, create a dedicated notes file under a top-level `progress/` folder named after the Linear key (for example, `progress/GET-117.md`). Each notes file should:

- Capture the Initial Ask and any clarifications so the Ask Log is always available.
- Record the detailed implementation plan, key tasks performed, and important decisions or assumptions.
- Include the Level 0 playtest script or other validation steps once the feature is implemented.
- Serve as a quick reference when resuming work on the task without rereading the full conversation history.
- Track pending follow-ups such as “post Linear summary comment” or “await requester verification,” and mark them resolved once complete so nothing is skipped.
- Begin with a short “Session Reminders” block spelling out the re-read loop (re-open AGENTS.md, review the notes, refresh the plan, run validation, post the Linear comment) so context rot can’t skip these steps.
- When starting a new session and a notes file already exists, ask the requester whether to continue from the current notes or start fresh; if they choose “start fresh,” rewrite the file (retaining only the new ask and plan) before proceeding.

At the start of each task, open or create its notes file and log the current context. After each significant step or decision, append a concise entry so future sessions stay grounded. These notes complement `memory-bank/04 Engineering/Roadmap.md`, remain local-only (the `progress/` folder is `.gitignore`’d), and focus on actionable summaries rather than internal chain-of-thought. Use the notes as the source of truth for the mandatory Linear issue comment you must post before closing the ticket.

### Source Refresh Gate
- Before any same-task answer, implementation, review, audit, report, or handoff, re-open the current disk `AGENTS.md` and the active progress/worklog note with tool evidence from the current turn.
- After any context compaction, session resume, or same-task follow-up, perform this filesystem refresh immediately before continuing.
- Cached conversation context, compacted summaries, prior tool output, pasted instruction excerpts, and remembered `AGENTS.md` content are not valid substitutes.
- If there is no active Linear key because the task is instruction-only or workflow-only, use the nearest active cross-repo AGENTS worklog or create `progress/adhoc-<task-slug>.md` only when local continuity is needed. State `skipped` when a local progress file is not created.

### Sample Linear Issue Prompt

When you start a new roadmap step and the requester approves creating a Linear ticket, use a prompt like this to remind yourself (or another agent) to set up the notes file:

- `MCP: Create a new Linear issue in the "MVP" project.`
- `Title: Initialize notes file for GET-117`
- `Description: Create a per-task notes file at progress/GET-117.md. Use this file to record the initial ask, the detailed implementation plan, key decisions, tasks executed, and the Level 0 validation script for GET-117. This notes file will be used to refresh context and avoid context rot whenever work resumes.`
- `Label: Improvement`
- `Assignee: [your username]`
