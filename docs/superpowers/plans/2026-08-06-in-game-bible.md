# In-Game Game Design Bible Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Add an exhaustive finalized-only English/Ukrainian Game Design Bible to the live game, accessible from the start menu, paused menu, and F1, with a polished responsive reference-manual layout.

**Architecture:** A typed bilingual catalog supplies semantic blocks to a standalone modal renderer. Level0RuntimeShell owns only overlay session state, entry points, composable bible pause ownership, and text-bridge exposure; the Bible cannot mutate game/save state. Test-only coverage and decision traceability independently prove finalized-rule completeness while forbidden-marker tests prevent governance or uncertainty from reaching rendered text.

**Tech Stack:** React 19, TypeScript 5.7, Redux Toolkit, Jest/jsdom, Testing Library, Phaser shell integration, Vite, component-owned CSS, Playwright/web-game client.

**Execution constraints:** Work on visible main per repository policy. Preserve all unrelated dirty GET-204/GET-205/GET-208 runtime, art, generated, and untracked work. Do not create a branch/worktree, reset, restore, broadly format, stage, or commit without the requester's separate explicit authorization. The GET-139 entry gate requires the corrected canonical specification to be reviewed and committed as a standalone documentation change before any runtime file is edited. Therefore execution must stop after Task 1's reviewed documentation diff; Tasks 2–7 remain blocked until the requester authorizes that documentation commit and its SHA is verified.

---

## File map

Create:

- the-getaway/src/content/gameBible/types.ts — semantic content and search/UI-state types.
- the-getaway/src/content/gameBible/coverage.ts — independent required finalized-topic inventory.
- the-getaway/src/content/gameBible/traceability.ts — non-rendered Approved-decision classification.
- the-getaway/src/content/gameBible/sharedRules.ts — shared language-neutral numeric/state facts.
- the-getaway/src/content/gameBible/en.ts — complete English Bible.
- the-getaway/src/content/gameBible/uk.ts — equivalent Ukrainian Bible.
- the-getaway/src/content/gameBible/catalog.ts — lookup, validation, rendered-text extraction, search.
- the-getaway/src/components/level0/Level0GameBible.tsx — modal, navigation, search, focus, drawer, block rendering.
- the-getaway/src/components/level0/Level0GameBible.css — responsive three/two/one-pane layout.
- the-getaway/src/__tests__/level0GameBibleContent.test.ts — coverage, parity, finality, relations, traceability.
- the-getaway/src/__tests__/level0GameBible.test.tsx — component and shell integration.

Modify only:

- Level0RuntimeShell.tsx and its CSS for entry/lifecycle/focus.
- runtime/types.ts, runtime/persistence.ts, and existing persistence/slice tests for transient bible pause.
- level0AgentBridge.ts and its tests for callback-driven UI text state.
- `memory-bank/01 MVP/Game Design.md`, `memory-bank/01 MVP/12 Game Design Decision Register.md`, `memory-bank/01 MVP/15 Linear Implementation Program.md`, the canonical HUD specification, `memory-bank/01 MVP/95 MVP Readiness Checklist.md`, `memory-bank/04 Engineering/Architecture.md`, and `progress/GET-201.md`.

Do not modify package scripts, art files, layout contracts, city rendering, surveillance implementation, or generated assets.

### Task 0: Snapshot the shared workspace and parallel-task boundary

**Files:** `progress/GET-201.md` only.

- [x] **Step 1: Capture the baseline before any edit**

Run from `/Users/deus/Projects/The Getaway`:

    git rev-parse HEAD
    git status --short
    git diff --name-only
    git diff -- 'memory-bank/01 MVP/Game Design.md' 'memory-bank/01 MVP/12 Game Design Decision Register.md' 'memory-bank/01 MVP/15 Linear Implementation Program.md' 'memory-bank/01 MVP/45 HUD & Information Architecture.md' 'memory-bank/01 MVP/95 MVP Readiness Checklist.md' 'memory-bank/04 Engineering/Architecture.md' 'progress/GET-201.md' 'the-getaway/src/components/level0/Level0RuntimeShell.tsx' 'the-getaway/src/components/level0/Level0RuntimeShell.css' 'the-getaway/src/game/level0/runtime/types.ts' 'the-getaway/src/game/level0/runtime/persistence.ts' 'the-getaway/src/game/level0/runtime/__tests__/persistence.test.ts' 'the-getaway/src/store/__tests__/level0RuntimeSlice.test.ts' 'the-getaway/src/game/level0/playtest/level0AgentBridge.ts' 'the-getaway/src/game/level0/playtest/__tests__/level0AgentBridge.test.ts'

Expected: current HEAD plus a complete dirty-file/target-overlap snapshot; do not alter or clean any result.

- [x] **Step 2: Refresh the parallel task boundary**

Read the current GET-204/GET-205/GET-208 task snapshot and active progress notes. Record task ownership, newer dirty documentation, and every overlap with GET-201 targets. If a target is still being written, wait for its stable checkpoint before editing it. Record every currently active Linear child; before Task 2, GET-201 must be the only active visual/runtime ticket and downstream work must be parked or terminal as required by AGENTS.md.

- [x] **Step 3: Record the boundary**

Append the HEAD, snapshot time, task-owned target list, overlap decisions, and protected paths to `progress/GET-201.md`. This becomes the comparison baseline for Tasks 1, 6, and 7.

### Task 1: Correct canonical and Linear ownership before runtime work

**Files:** `memory-bank/01 MVP/Game Design.md`, `memory-bank/01 MVP/12 Game Design Decision Register.md`, `memory-bank/01 MVP/15 Linear Implementation Program.md`, the canonical HUD specification resolved from `memory-bank/01 MVP/00 Index.md`, `memory-bank/04 Engineering/Architecture.md`, `progress/GET-201.md`, and Linear GET-201.

- [x] **Step 1: Record the Approved rule**

Add one GDR-UI decision: the complete finalized bilingual Game Design Bible is visible from start/pause/F1; it pauses active simulation and exposes no OPEN/tracker/historical/provisional content.

- [x] **Step 2: Update the owning WHAT/HOW specifications**

Add player promise, entry points, layout breakpoints, final-only content boundary, search, focus, pause, bilingual parity, and human-play acceptance to Game Design and HUD sections 1–12 and 15–16. Add catalog → renderer → shell flow to Architecture.

- [x] **Step 3: Rewrite T1**

Remove the old No F1 help/codex exclusion. Add the complete runtime flow, state transitions, finality, bilingual content, layout, accessibility, failure behavior, and acceptance. Preserve exactly fourteen ticket headings.

- [x] **Step 4: Rewrite GET-201 from T1 without changing its operational state**

Use Linear MCP with only the issue ID and complete description. Preserve `In Review` until the standalone documentation commit exists. Read back and normalize only automatic issue links/bullets/ordered lists. Verify label Improvement, parent GET-139, project MVP, title/priority, state, and relations unchanged.

- [x] **Step 5: Run documentation preflight**

Run from `/Users/deus/Projects/The Getaway`:

    git diff --check -- memory-bank progress/GET-201.md docs/superpowers

Expected: exit 0. Record the pre-runtime dirty target boundary.

- [x] **Step 6: Run the canonical documentation gate**

Run the existing audit checks recorded in `progress/GET-201.md` against the exact current files: 21 system chapters with 16 required headings, 10 Linear Program sections with 14 required headings, unique and known `GDR-*`/`OPEN-*`/journey IDs, resolved wiki links, contradiction/finality search, and semantic Linear readback parity. Re-read the task-owned diff against Task 0 and confirm no active parallel-task change was overwritten.

- [x] **Step 7: Mandatory standalone documentation checkpoint**

Stop and present the reviewed documentation diff to the requester. Ask for separate explicit authorization to stage and commit only the task-owned canonical/spec/plan/progress files. Do not edit `the-getaway/src/**`, move GET-201 to `In Progress`, or begin Task 2 before authorization.

- [x] **Step 8: After authorization, create and verify the documentation commit**

Stage only the reviewed task-owned documentation paths, inspect the staged diff, and commit with `docs(GET-201): define the in-game Game Design Bible`. Verify the resulting SHA, human-only identity, and exact committed paths.

Before moving GET-201 to `In Progress`, verify all of these gates explicitly: the predecessor/original GET-201 specification evidence is committed; the new standalone documentation commit is present; the live GET-201 description still has semantic parity with canonical T1; `progress/GET-201.md` names the live proof targets and states that the Bible runtime has no provisional `OPEN-*` assumption; and GET-204/GET-205/GET-208 plus every downstream child are parked or terminal so GET-201 is the only active visual/runtime ticket. If another task still owns an active state, stop for requester coordination rather than changing its state silently. Only after every gate passes, move GET-201 to `In Progress` without changing other metadata and record the SHA/state readback.

### Task 2: Build the finalized bilingual catalog through RED/GREEN cycles

**Files:** new content test and content/gameBible modules.

**Precondition:** Task 1's standalone documentation commit and all entry-gate evidence are verified; GET-201 is the only active visual/runtime ticket; all downstream tickets are parked or terminal; `progress/GET-201.md` records zero provisional `OPEN-*` assumptions for this implementation.

- [x] **Step 1: Write the failing structure/finality test**

The test imports `GAME_BIBLE_CATALOG`, `getRenderedBibleText`, and `validateGameBibleCatalog`. It requires sixteen chapters in each locale, matching chapter/section/block shapes, no validation errors, and no rendered match for governance IDs, implementation/delivery language, uncertainty language, historical alternatives, raw wiki links, or repository paths. Use a denylist at least as strict as:

    /OPEN-|GDR-|GET-\d+|Linear|provisional|unresolved|under review|recommended|recommendation|awaiting approval|Removed|Superseded|rejected|historical|implementation owner|delivery process|repository|commit|coverage|\[\[|memory-bank\/|progress\/|src\//i

Also perform a human semantic-finality pass over every rendered block: wording must describe the final game experience directly, never a proposal, production status, alternative, or approval process.

- [x] **Step 2: Run RED**

Run:

    (cd the-getaway && yarn test src/__tests__/level0GameBibleContent.test.ts --runInBand)

Expected: FAIL because content/gameBible/catalog does not exist.

- [x] **Step 3: Add minimal types and validation shell**

Define paragraph, bullets, steps, callout, table, and state-flow blocks; localized catalogs; search results; and UI text state. Every chapter must carry section-role coverage for `purpose`, `player-flow`, `rules-and-examples`, `connections`, `feedback`, `failure-recovery-persistence-retry`, and `see-also`. Validate IDs, table shape, relations, section targets, and every `sourceRefs` path/anchor.

- [x] **Step 4: Add failing independent traceability tests**

Read the canonical Decision Register in Jest, parse every Approved row, and assert each ID is covered by section decisionRefs or a bounded non-player-facing classification. Assert every required topic appears in equivalent locale section IDs.

- [x] **Step 5: Run RED again**

Run:

    (cd the-getaway && yarn test src/__tests__/level0GameBibleContent.test.ts --runInBand)

Expected: FAIL with missing topic/decision/role mappings, not a path/parser error.

- [x] **Step 6: Implement sixteen English chapters**

Each chapter satisfies every required role: design purpose and fantasy; complete player flow; rules, states, transitions, and concrete Level 0 examples; inputs and downstream effects; world/HUD/dialogue/audio/George feedback; failure, recovery, persistence, and Retry behavior; and explicit related chapters. Use `sharedRules.ts` only for values already approved canonically: 18:30, 30×, 22:00, 24:00, Health/Paranoia thresholds, four blocks, three identities/loops, character budgets, and HUD height.

- [x] **Step 7: Implement equivalent Ukrainian chapters**

Match IDs, topics, block types, table shapes, state flows, decision refs, and numeric rules. Use natural Ukrainian prose.

- [x] **Step 8: Complete traceability classification**

Map every player-visible Approved decision to a section. Classify only delivery/repository governance decisions as non-player-facing with a concrete reason.

- [x] **Step 9: Run GREEN and inspect metrics**

Run:

    (cd the-getaway && yarn test src/__tests__/level0GameBibleContent.test.ts --runInBand)

Report chapter/section/role/topic/decision/source-reference counts plus EN/UK rendered word counts. Expected: pass with no forbidden rendered marker, missing role, broken source ref, or uncovered Approved decision.

- [x] **Step 10: Record bilingual semantic review**

Record per-chapter review of examples, flows, tables, keywords, exact values, and cause/effect direction plus one back-translation spot-check per chapter.

### Task 3: Build the standalone responsive component test-first

**Files:** level0GameBible.test.tsx, Level0GameBible.tsx, Level0GameBible.css.

- [x] **Step 1: Write failing navigation/search tests**

Assert dialog naming, close focus, rail, active chapter/section, body blocks, search excerpts, result selection, no-results copy, previous/next boundaries, and slash-to-search. Search each indexed field independently—chapter title, chapter summary, section title, body, and keywords—in both EN and UK, and verify stable ordered result IDs and localized labels/excerpts.

- [x] **Step 2: Run RED**

Run:

    (cd the-getaway && yarn test src/__tests__/level0GameBible.test.tsx --runInBand)

Expected: FAIL because the component does not exist.

- [x] **Step 3: Implement semantic renderer and search**

Use exhaustive block switching, semantic headings/tables/captions, no HTML injection, memoized localized index, and result selection that scrolls/focuses the heading.

- [x] **Step 4: Run GREEN**

Run:

    (cd the-getaway && yarn test src/__tests__/level0GameBibleContent.test.ts src/__tests__/level0GameBible.test.tsx --runInBand)

Expected: content/search tests pass.

- [x] **Step 5: Add failing focus/drawer tests**

Mock narrow `matchMedia`. Assert drawer close focus, inert/hidden article, Tab containment, Escape precedence, backdrop close, trigger restoration, long Ukrainian names, and selected chapter focus. Add close/reopen tests for current-session chapter memory and a stale stored chapter/section ID fallback to the first valid target.

- [x] **Step 6: Implement focus traps and drawer**

Keep one modal. Scope refs/key handlers to the overlay. Add observer-backed active-section tracking with a deterministic jsdom fallback.

- [x] **Step 7: Implement approved CSS**

Use semantic tokens, three columns at ≥1200, two columns at 841–1199, drawer/single column at ≤840, article ≤820 px/76ch, bounded table scroll, ≥44 px targets, and no page-level overflow.

- [x] **Step 8: Run component GREEN**

Run:

    (cd the-getaway && yarn test src/__tests__/level0GameBibleContent.test.ts src/__tests__/level0GameBible.test.tsx --runInBand)

Expected: all standalone tests pass without console warnings.

### Task 4: Integrate start/menu/F1 and composable pause test-first

**Files:** Bible integration test, RuntimeShell, runtime types/persistence/tests, slice test.

- [x] **Step 1: Write failing entry/F1 matrix tests**

Require start-menu button without run/pause, gameplay F1 with one bible owner, paused-menu F1/button preserving menu+bible, repeated F1 no-op, ignored F1 in editable/modal contexts, eligible default prevention, Escape/close focus restoration, and deterministic close-button/Escape race handling.

Add lifecycle/input/state-invariance cases before implementation: unmount, run replacement, New Game, and shell teardown each release Bible pause ownership exactly once; a missing/stale invocation trigger falls back to the correct menu/world focus target; controller, pointer, keyboard, and Phaser input cannot reach the world while open; and opening/navigating/closing the Bible does not mutate mission, clock, position, outcome ledger, autosave payload, or Retry snapshot.

- [x] **Step 2: Run RED**

Run:

    (cd the-getaway && yarn test src/__tests__/level0GameBible.test.tsx src/__tests__/App.test.tsx --runInBand)

Expected: button missing and bible owner unsupported.

- [x] **Step 3: Add transient pause tests then implementation**

First test that bible composes with menu, is recognized by decode, and is stripped from autosave/hydration/Retry. Run RED with:

    (cd the-getaway && yarn test src/game/level0/runtime/__tests__/persistence.test.ts src/store/__tests__/level0RuntimeSlice.test.ts --runInBand)

Then minimally add it to `PauseOwner` and `PAUSE_OWNERS` while preserving normalization, and rerun the same command GREEN.

- [x] **Step 4: Integrate lifecycle**

Add local Bible UI state and refs for invocation/acquisition. Opening is idempotent; cleanup releases once; overlay sits above start/menu/runtime without unmounting the current surface; background becomes inert/hidden.

- [x] **Step 5: Add visible links**

Place Game Design Bible with F1 hint in the primary start/pause actions. Do not add HUD clutter unless live review proves discoverability inadequate.

- [x] **Step 6: Implement key precedence**

Handle F1/Escape in capture order, ignore editable/higher-priority modal states, prevent browser help only when eligible, and block Phaser input while open.

- [x] **Step 7: Run integration GREEN**

Run:

    (cd the-getaway && yarn test src/__tests__/level0GameBible.test.tsx src/__tests__/App.test.tsx src/__tests__/rpgIdentityIntegration.test.tsx src/game/level0/runtime/__tests__/persistence.test.ts src/store/__tests__/level0RuntimeSlice.test.ts --runInBand)

Expected: Bible, App, RPG identity, slice, and persistence focused suites pass.

### Task 5: Expose equivalent text state without Redux UI state

**Files:** level0AgentBridge test/source and RuntimeShell.

- [x] **Step 1: Write failing callback test**

Install bridge with `getUiState` and require `render_game_to_text.gameBible` to contain `open`, `chapterId`, `sectionId`, `query`, `drawerOpen`, `resultCount`, and ordered `visibleResults`. Each visible result contains stable chapter/section IDs plus localized label and excerpt.

- [x] **Step 2: Run RED**

Run:

    (cd the-getaway && yarn test src/game/level0/playtest/__tests__/level0AgentBridge.test.ts --runInBand)

Expected: `getUiState` unsupported.

- [x] **Step 3: Implement optional callback**

Keep existing callers compatible. Read callback only during text render. Pass a ref-backed callback from shell.

- [x] **Step 4: Run GREEN**

Run:

    (cd the-getaway && yarn test src/game/level0/playtest/__tests__/level0AgentBridge.test.ts src/__tests__/level0GameBible.test.tsx --runInBand)

Expected: bridge and Bible integration tests pass.

### Task 6: Live layout and behavior proof, then requester acceptance stop

**Files:** progress/GET-201.md plus local ignored screenshots.

- [x] **Step 1: Start the live game on strict port 5174**

Run:

    (cd the-getaway && yarn dev)

Do not alter package scripts.

Before opening the browser, freshly read the complete live GET-201 description and comments, the approved design spec, the canonical HUD/Game Design/Architecture rules, and `progress/GET-201.md`. Confirm GET-201 remains the only active ticket and record the exact comparison viewports, reference mockup, player-scale target, and proof paths.

- [x] **Step 2: Run the required web-game client**

Use /Users/deus/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js. Verify menu open/close, New Game, active F1 pause, search, chapter selection, close/resume, render_game_to_text, and console.

- [x] **Step 3: Capture every boundary**

Inspect screenshots at 1920×1080, 1440×900, 1280×720, 1200, 1199, 841, 840, and 390×844. Include long Ukrainian headings, search results, a table, deep scroll, and drawer.

- [x] **Step 4: Fix one visual class at a time**

Correct hierarchy/spacing, then rail/outline sizing, then drawer/table overflow, then polish. Re-run and inspect latest screenshots after every correction.

- [x] **Step 5: Run the five-step scenario**

1. Open from start and search Paranoia.
2. Switch to Ukrainian and verify equivalent chapter/section.
3. Start/continue, move once, note time/position.
4. Press F1, open Surveillance, prove time/movement paused.
5. Close and prove exact state resumes with correct focus.

- [ ] **Step 6: Mandatory visual acceptance stop**

Present the actual in-game link locations and inspected screenshots from the live build. Stop for requester visual/behavior acceptance. Do not run full lint/build/all-tests/coverage/AI-playtest closeout, stage, commit, or move GET-201 beyond `In Progress` until the requester accepts the live result or explicitly says to finalize.

### Task 7: Post-acceptance closeout only

**Precondition:** The requester accepted Task 6's live result or explicitly asked to finalize/commit the current pass.

**Files:** `memory-bank/01 MVP/95 MVP Readiness Checklist.md`, `progress/GET-201.md`, Linear GET-201, and all task-owned files.

- [ ] **Step 1: Record actual evidence**

Add counts, bilingual review, screenshots, console state, pause/focus proof, tests, and residual risk.

- [ ] **Step 2: Rebuild/read back GET-201 if contract changed**

Preserve In Progress; do not move Done.

- [ ] **Step 3: Run focused and broad checks**

Run exactly:

    (cd the-getaway && yarn test src/__tests__/level0GameBibleContent.test.ts src/__tests__/level0GameBible.test.tsx src/game/level0/runtime/__tests__/persistence.test.ts src/store/__tests__/level0RuntimeSlice.test.ts src/game/level0/playtest/__tests__/level0AgentBridge.test.ts --runInBand)
    (cd the-getaway && yarn lint)
    (cd the-getaway && yarn build)
    (cd the-getaway && yarn test --runInBand)
    (cd the-getaway && yarn test --coverage --runInBand)
    (cd the-getaway && yarn playtest:agent -- --profile guided-level0 --max-steps 20 --codex)

Expected: all pass and statement/line coverage remain above 80%. If protected incomplete concurrent work blocks a broad check, record the exact unrelated blocker and keep focused evidence separate.

- [ ] **Step 4: Inspect and resolve the AI-playtest report**

Open the newest report under `the-getaway/reports/ai-playtests/`. Record its path, runtime/session evidence for the effective model when model identity affects acceptance/cost, and every actionable in-scope finding. Fix each safe in-scope finding or explicitly defer it with reason and owner. If any fix changes behavior, rerun the focused tests, the affected live scenario, and `yarn playtest:agent`, then inspect the new report.

- [ ] **Step 5: Run canonical/diff hygiene**

Re-run the exact canonical audit commands recorded in `progress/GET-201.md` for 21×16 specs, 10×14 tickets, unique/known decision/open/journey IDs, wiki links, contradictions, forbidden player-visible markers, Approved-decision coverage, source-reference resolution, and Linear parity. Then run:

    git diff --check -- AGENTS.md memory-bank progress/GET-201.md docs/superpowers the-getaway/src

- [ ] **Step 6: Review task-owned diff against HEAD and dirty baseline**

Verify no unrelated runtime/art/generated path changed because of GET-201.

- [ ] **Step 7: Present closeout without unauthorized commit**

Present final evidence, in-game link instructions, and screenshots. Do not stage or commit the runtime pass, move GET-201 to Done, or unlock downstream work without a separate explicit authorization.
