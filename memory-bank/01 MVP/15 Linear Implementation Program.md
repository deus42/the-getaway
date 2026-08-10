---
status: MVP
type: implementation-program
parent: GET-139
canonical: true
---

# Linear Implementation Program

This document is the copy source for GET-139, its ten top-level children, six focused nested Improvement children — of which T3A is canceled as absorbed by T7A — and the affected GET-179 harness contract. Each description is deliberately self-contained: a Linear issue may link back here and to the canonical specifications, but those links do not replace the behavior, boundary, evidence, and recovery contract embedded in the issue itself.

These aliases and exact Linear keys are authoritative for the implementation program.

| Alias | Exact Linear key | Title | Label | Initial state | Blocks |
|---|---|---|---|---|---|
| T1 | GET-201 | Canonical game-design bible and decision register | Improvement | In Progress | T2–T10 and GET-139 |
| T2 | GET-202 | Recover the canonical pre-rewrite foundation | Improvement | Todo | T3 and all runtime implementation |
| T3 | GET-203 | Level 0 runtime and shared outdoor-layout contract | Feature | Todo | T3A, T4, T7, T8, T9, T10 |
| T3A | GET-211 | Rename the operation baseline and Restart Attempt contract | Improvement | Todo | T8A and GET-179 modernization |
| T4 | GET-204 | Tokyo city foundation: hero intersection to dense live district | Improvement | Todo | T5 |
| T5 | GET-205 | Hidzu Corporation identity and graphic-surveillance-noir world art | Improvement | Todo | T6, T10, and T10B visual integration |
| T6 | GET-206 | Grounded actors, portraits, and entry-flow presentation | Improvement | Todo | T10 and T10B final presentation |
| T7 | GET-207 | Protagonist RPG identity, progression, Health, and Paranoia | Feature | Todo | T8, T9, T10 |
| T8 | GET-208 | Surveillance, security, civilians, hiding, drone, and noncombat escape | Feature | Todo | T8A, T9 contextual integration, and T10 scenarios |
| T7A | GET-216 | Pivot the protagonist to Paranoia tiers, binary abilities, cover-select, and research | Improvement | Todo | T8A, T9A, and the GET-179 modernization |
| T8A | GET-212 | Make Hidzu Corporation surveillance readable, attributable, and limited | Improvement | Todo | T9A |
| H1 | GET-179 | Modernize the guided Level 0 harness vocabulary and probes | Existing issue | Existing state | T9A milestone gate |
| T9 | GET-209 | Dialogue, George, facts, dossier, social feed, and four-lane HUD | Feature | Todo | T9A and T10 content integration |
| T9A | GET-213 | Make gates, evidence, George, departure, and failure fully legible | Improvement | Todo | T10A |
| T10 | GET-210 | Tokyo escape content, audio, onboarding, and end-to-end acceptance | Feature | Todo | T10A, T10B, and GET-139 acceptance |
| T10A | GET-214 | Make curfew, routes, recovery, and street sound live in the city | Improvement | Todo | T10B and GET-139 acceptance |
| T10B | GET-215 | Blend actors into authored street lighting | Improvement | Todo | GET-139 acceptance |

The table records each issue's creation state, not its current operational state; GET-179 is listed only because its existing contract changes. The specification entry gate was satisfied by the separately committed GET-201 package. This Fable-alignment package requires its own validated, separately authorized documentation commit before any of the five new children or GET-179 modernization starts. Keep the GET-139 → GET-210 top-level order unchanged and one implementation child active at a time. A validated committed deliverable may unlock its successor while the predecessor remains `In Review` pending requester verification. Every top-level child and the five focused children remain closure blockers for GET-139 through final acceptance.

`OPEN-*` items are ticket acceptance/freeze gates rather than a program-wide start gate. Each ticket may implement the queue's recorded recommendation as a reversible provisional trial only when its progress note and Linear comment identify the assumption, implementation seam, live proof, and rollback path. Provisional behavior cannot move beyond `In Review` or be described as final until the requester accepts, changes, postpones, or removes the decision.

## GET-139 — Tokyo escape vertical slice

- **Label:** Feature
- **Operational state:** Preserve current Linear state during this planning pass
- **Project:** MVP

### Why this ticket exists

GET-139 is the acceptance parent for rebuilding Level 0 as a coherent 15–20 minute outdoor Tokyo surveillance-escape RPG prologue. It keeps canonical documentation, runtime foundation, source-authored city, grounded actors, RPG identity, surveillance, information systems, authored content, audio, and final live proof under one dependency-governed program instead of allowing isolated subsystem checklists to redefine the game.

### Player promise

The player creates a grounded expatriate protagonist who is not already a Hidzu Corporation target, seeks passage toward Miami to investigate their father and Cold Iron, makes optional preparation choices, reads and evades truthful surveillance, recovers Lira's medkits, may copy consequential Cold Iron evidence, validates transit before midnight, and receives a factual debrief. Failure and Restart Attempt teach the real system without invented knowledge, tactical combat, or opaque shortcuts.

### Starting state

- The canonical authority order is requester directive → Decision Register → canonical specifications → owning Linear issue → Architecture → runtime/tests.
- The original specification gate is committed at `b50a4cd5290490cc8ab8c3521a2c22acaa1afdce`; this approved Fable-alignment package is uncommitted and must be separately validated/authorized before its runtime work.
- Existing top-level GET-201–GET-210 operational states remain unchanged during planning. Five new children start `Todo`, `Improvement`, project `MVP`; GET-179 keeps its existing state.
- The shared dirty worktree and unrelated runtime/art work are protected.

### Complete player flow

1. Select the playable cover; enter the safehouse at 18:30 at Calm (internal Paranoia 0) and network `Clear`.
2. Meet Lira and learn that passage toward Miami is exchanged for confiscated medkits; consult Naila/Brant in any order or skip them.
3. George reads the actual departure state; confirmation creates `OperationAttemptBaseline` and starts the operation.
4. Travel through Transit Road, Market Ring, and Outer Space. Normal public camera visibility is harmless until an observed rule break; ordinary geometry creates blind spots.
5. Use Observation for exact discovered coverage, interact explicitly, use the single camera group once, and respond to Needle/last-known pursuit without combat.
6. Recover and return medkits. Advance optional Cold Iron evidence from unknown through warning/recognition to an explicit five-minute manifest copy.
7. Manage time and Paranoia through authored city changes, one-use grounding actions, one difficult-escape relief, and honest George thresholds.
8. Validate transit before midnight, debrief from real ledgers, and choose Continue Exploring or End Demo.
9. On failure, receive a cause-specific explanation; capture alone shows an evidence-limited Hidzu Corporation report. Restart Attempt restores the exact baseline.

### System rules and state transitions

Direct click/WASD movement, explicit interaction, full-pause Observation, deterministic gates, binary general facts, the dedicated Cold Iron chain, Paranoia tiers, `Clear/Suspicious/Pursuit`, last-known search, discrete hiding/blending, one Needle patrol, four-lane HUD, and authored world time remain the current contract. Concern requires current visibility plus one of five approved `SurveillanceRuleBreakEvidence` types. Every nonterminal gate failure commits a declared worse path. Clock boundaries at 21:00, 21:30, 22:00, and 23:30 are idempotent. Actor light regions are presentation-only.

### Internal milestones and proof gates

1. Validate and separately commit this canonical/Linear package.
2. Preserve the top-level T1→T10 program and existing parent states.
3. Deliver T3A Restart foundation, then T8A surveillance and GET-179 modernization.
4. Require both T8A and the GET-179 milestone before T9A information/failure work.
5. Deliver T10A city time/routes/recovery/audio, then T10B actor-light integration.
6. Run normal-control, bilingual, fixed-viewport evidence before automated closeout.
7. Keep GET-139 nonterminal until the requester verifies the authorized committed build.

### Content requirements

Deliver the complete bilingual Level 0 script/state catalog, named routes, four clock moments, three ambient thresholds, two grounding actions, threshold lines, one camera group, Needle patrol/warnings, civilian reactions, Cold Iron progression/copy, exact gate verdicts/fail-forward paths, George limit/readback lines, cause-specific failure content, capture-report read model, debrief variants, and actor-light metadata. Every item uses stable IDs and declared effects.

### World/UI/audio/George feedback

The street—not only the HUD—communicates time, coverage, route identity, and institutional presence. Normal camera warnings are subtle light/reflection cues; Observation shows exact discovered geometry. Needle has a hum and authored warnings. Civilians show only small visible reactions. George and current-task lanes remain separate; George is factual, explicitly explains information limits, never hides information in silence, and has no deletion/freedom arc. No Observation vignettes or decorative Bible quotations are added.

### Failure and recovery

Breakdown at Paranoia 100 stages its surrender and shows a simple factual cause. Midnight lists unfinished Lira-return/transit requirements and never implies capture. Capture derives only actual sightings, detected camera-feed change, Needle verification, and capture evidence; unseen path gaps remain disconnected. **Restart Attempt** dispatches `restartAttempt` against `OperationAttemptBaseline` under `restart_attempt_confirmation`; stale development saves are rejected rather than guessed forward.

### Explicit exclusions

- No special off-grid layer, omniscient George, semantic silence, universal rumor/confirmed/leverage ladder, Observation vignettes, injury/limp simulation, civilian reporting, HUD-lane merge, Bible epigraph decoration, tactical combat, automatic collection, forced progress/failure, or debug-only acceptance.
- No gameplay/runtime implementation or commit in this documentation pass.
- No top-level GET-139→GET-210 reorder and no parent status change during planning.

### Dependencies and OPEN blockers

The package depends on the existing specification/recovery gates. Resolved here: `OPEN-NAR-002` and `OPEN-PAR-002`. Numeric surveillance timing, loop duration, civilian placement, layout anchors, pacing, dossier wireframe, lighting, and audio remain open acceptance values. `OPEN-ART-005` owns final actor-tint intensity/feather with a reversible strongest-region-only, 250 ms, restrained amber/cyan baseline.

### Canonical decisions/spec sections

Implements the full approved decision set, especially `GDR-PC-005`, `GDR-SAFE-001`, `GDR-SUR-006`–`GDR-SUR-010`, `GDR-CIV-001`, `GDR-RPG-007`, `GDR-FACT-002`, `GDR-PAR-006`, `GDR-PAR-007`, `GDR-GEO-004`, `GDR-FAIL-001`, `GDR-TIME-004`, `GDR-SET-007`, `GDR-AUD-002`, `GDR-HLT-003`, and `GDR-ART-011`. Canonical sources are [[Game Design]], [[10 MVP Spine]], [[11 Level 0 Vertical Slice Contract]], [[12 Game Design Decision Register]], [[13 Level 0 Content and State Matrix]], [[14 Specification Review Queue]], all affected 16-section system specifications, [[03 Lore/Plot Bible]], [[04 Engineering/Architecture]], [[04 Engineering/Roadmap]], and [[95 MVP Readiness Checklist]].

### Human-play acceptance

Run the complete matrix at 1280×720, 1440×900, and 1920×1080 in English and Ukrainian. Prove harmless public observation; each concern source; geometric blind spots; single camera use/history; Clear reset; Needle warnings; presentation-only civilians; exact gate preview/result verdicts and fail-forward paths; all Cold Iron states/copy cost; baseline restoration; one-use grounding/threshold lines; idempotent clock changes; evidence-limited failure reports; named routes/sound thresholds; and presentation-only actor tint. Use normal controls only.

### Documentation and validation obligations

Maintain decision/document/ticket bidirectional traceability, full 16-section specs, complete self-contained issue descriptions, resolved-open atomicity, valid links, current-authority terminology, Markdown hygiene, normalized Linear parity, and exact dependency relations. Record the five created keys and validation evidence in `progress/GET-139.md`. Do not commit until explicitly authorized and do not move any issue to `Done` until requester verification.

## T1 — Canonical game-design bible and decision register

- **Label:** Improvement
- **Initial state:** In Progress
- **Parent:** GET-139

### Why this ticket exists

The repository, runtime, tests, historical progress, and existing Linear program describe several mutually incompatible versions of The Getaway. Earlier sources still present a fixed Operative, Ghost/Wire/Force packages, A* routing, `Pressure`, a sparse four-block compound, tactical combat, AutoBattle, and a three-lane HUD as current intent. The requester rejected that direction and approved a grounded Tokyo surveillance-escape RPG instead. This ticket creates one canonical specification before any recovery or reimplementation can turn another stale checklist into product behavior.

The first specification package established the correct structure but did not prove that every historical answer and later requester correction was captured, nor did its short hub provide the complete readable Bible requested for ongoing implementation. A later requester correction also established that “in-game documentation” means the complete Bible must be usable inside the running game, not only stored as internal Markdown. This ticket therefore has three inseparable deliverables: a forensic design audit, the finished canonical authoring Bible, and its exhaustive finalized-only player-facing projection.

The work is complete only when all 214 structured design exchanges, prose directives, earlier design/lore material, later corrections, current parallel-task decisions, canonical documents, implementation evidence, and Linear have an explicit present outcome; when product rules, lore, system specifications, Architecture, Roadmap, readiness, AGENTS governance, progress evidence, and the ten implementation tickets agree; and when a player can read the fullest practical finalized design in English or Ukrainian from the start menu, paused menu, or `F1` without seeing governance or unresolved material. Historic work remains recoverable evidence, but no completed test, old ticket, compiling subsystem, or raw Markdown rendering may outrank the current design.

### Player promise

The player can open a polished **Game Design Bible** before New Game, from the paused menu, or with `F1` during eligible play and understand the complete finalized game without leaving the application. The reference explains the fantasy, campaign, chronological Level 0 journey, every system, cross-system causality, feedback, failure and recovery, persistence, production direction, content boundaries, and continuation. It is exhaustive rather than a short tutorial, and English/Ukrainian presentations have equivalent structure and meaning.

The underlying game promise remains a customizable expatriate cover, a human-scale watched city, two viable infiltration timings, optional contacts, honest facts and binary gates, explicit medkit recovery and transit validation, recoverable surveillance, a factual debrief, and persistent consequences toward Miami. Contextual onboarding still teaches immediate actions through play; the Bible is the complete optional reference, not a replacement for world feedback, George, HUD, dossier, dialogue, or readable failure.

### Starting state

- The original canonical package is committed as `b50a4cd5290490cc8ab8c3521a2c22acaa1afdce`; its recovery boundary remains recorded in `progress/GET-139.md`.
- GET-201 is `In Review` and remains nonterminal pending requester review. Implementation descendants have progressed in parallel under the validated-commit gate, so their newest explicit requester decisions must be refreshed before authoring and before final validation.
- The active shared worktree contains protected runtime, art, and concurrent documentation changes. This ticket may edit only its documentation/governance boundary and must preserve newer task-owned changes.
- The raw source contains 215 early question calls: one preceding recovery/governance baseline plus exactly 214 original design exchanges. All 214 design exchanges were answered, including `doc_audience = Canonical game bible`. Forty-five later structured clarification calls plus later prose corrections and approvals are audited separately as subsequent evidence rather than miscounted as part of the original 214.
- Direct requester correction on 2026-08-06 supersedes the inferred documentation-only/no-codex interpretation: GET-201 owns the complete player-facing in-game Bible as well as the canonical audit/authoring package. The approved design is `docs/superpowers/specs/2026-08-06-in-game-bible-design.md`.
- The active shared worktree contains protected runtime, art, and concurrent documentation changes. The corrected canonical specification must be reviewed and committed separately before Bible runtime files are edited. GET-201 must then be the only active visual/runtime child; another task's state is never changed silently.
- No gameplay schema, mission behavior, production art, or save-format change belongs to the Bible. No commit is authorized without a separate explicit requester instruction.

### Complete player flow

Before any run, the start menu shows `Game Design Bible` with an `F1` hint. Opening it creates no run or pause state. During an active run, the paused menu shows the same action; eligible `F1` opens directly from play. The player searches localized title/summary/section/body/keyword content, selects chapters and on-page sections, reads semantic prose/tables/state flows/examples, uses previous/next, and closes to the exact invoking surface. Opening in active play acquires `bible` pause once; opening above the menu composes `menu + bible`; closing releases only `bible` and restores focus. Higher-priority modals and editable inputs keep authority.

The Bible describes the entire normal-control experience without gaps: New Game; cover-select; 18:30 safehouse opening; Lira briefing; optional Naila and Brant preparation; deliberate dusk or curfew timing; direct movement and full-pause observation; camera, civilian, security, terminal, hiding, blending, and Needle decisions; explicit medkit recovery; optional Cold Iron warning/recognition/five-minute copy; Clear/Suspicious/Pursuit escape; explicit Lira handoff; outbound-terminal validation before midnight; safehouse/grounding recovery and research; factual debrief; and `Continue Exploring` or `End Demo`.

The documents must also define the breakdown, capture, deadline, incompatible-save, and deterministic Restart Attempt paths. Every step names starting state, authoritative transition, player-visible feedback, forbidden shortcut, and human-play evidence.

### System rules and state transitions

Use [[12 Game Design Decision Register]] as the atomic status ledger: `Approved`, `Removed`, `Postponed`, or `Superseded`, with rationale, player effect, provenance, canonical owner, ticket owner, and historic rating only where actually recorded. Normative system-specification sections 1–12 and 15–16 contain current Approved behavior. Required sections 13 and 14 may summarize removed behavior and Post-MVP extensions only when explicitly labeled non-current; the register and clearly historical records retain the complete rejected, postponed, and superseded detail.

Every per-system specification must contain the shared sixteen sections from player fantasy through owning ticket. Every unresolved required value receives an existing stable `OPEN-*` entry with a recommended baseline and blocked tickets. The precedence order is current requester directive, Decision Register, canonical product/system/lore specification, Linear issue, Architecture, then tests/runtime/history as evidence.

The runtime never renders canonical Markdown. A typed bilingual catalog contains only finalized player-facing prose and semantic blocks. Each section retains non-rendered source and Approved-decision references. An independent test-only inventory parses current Approved decisions and required topics so every player-facing rule maps to a Bible section or receives a bounded non-player-facing governance classification. Unresolved constants are not invented: the Bible explains the approved behavior at the approved precision and omits only the undecided number.

Bible UI state is React-local, URL-independent, and session-only. The runtime recognizes `bible` as a transient composable pause owner but strips it from autosave, hydration, and Restart Attempt. Opening, navigation, locale change, search, and close cannot mutate run, clock, position, facts, mission, outcome ledger, autosave, or Restart Attempt. Repeated `F1`, close/Escape races, unmount, run replacement, New Game, and shell teardown are idempotent and release only ownership acquired by that overlay instance.

### Internal milestones and proof gates

1. Forensically extract and classify all 214 structured exchanges, prose directives, earlier canonical material, later corrections, current task decisions, runtime/test evidence, and Linear into a temporary decision-coverage matrix.
2. Resolve explicit supersession chains and return material ambiguity to the requester instead of guessing. Implemented or ticketed behavior without Approved or explicitly provisional authority is a gap; a stable `OPEN-*` is not.
3. Turn [[Game Design]] into the complete readable Bible entry point, expand [[10 MVP Spine]], make [[11 Level 0 Vertical Slice Contract]] a chronological walkthrough, and complete every affected 16-section system chapter with prose, tables, examples, dependencies, failure/recovery, content, and acceptance.
4. Reconcile every Level 0 transition across cover-select, safehouse, briefing, preparation, departure, both timings, surveillance, cache/evidence, escape, Lira return, validation, debrief, progression, Continue Exploring, and End Demo.
5. Align the Decision Register, content/state matrix, review queue, Art Direction, Architecture, Roadmap, Post-MVP boundary, MVP Readiness, indexes, AGENTS, and `progress/GET-201.md` after the active parallel task reaches a stable checkpoint.
6. Regenerate GET-139, GET-201–GET-210, GET-179, and all five focused-child descriptions from this canonical program; rewrite each in full without changing existing operational state, then read every issue back for semantic parity.
7. Specify and implement the typed sixteen-chapter English/Ukrainian catalog, independent Approved-decision/topic traceability, forbidden-content gate, semantic renderer, search/navigation, focus-contained responsive layout, start/pause/`F1` entry, composable pause lifecycle, persistence stripping, and equivalent agent text state through red/green tests.
8. Run contradiction, sixteen-section, unique-ID/reference, traceability, wiki-link, ticket-parity, Markdown hygiene, and final documentation-diff review. Record exact evidence and legitimate OPEN items in `progress/GET-201.md`.
9. Prove the live surface at `1920×1080`, `1440×900`, `1280×720`, `1200`, `1199`, `841`, `840`, and `390×844`; exercise EN/UK search, chapter/section navigation, drawer, tables, pause/resume, focus/input, no-state-mutation, Restart Attempt, and text-bridge behavior; stop for requester visual acceptance before full closeout.

### Content requirements

The package must cover product identity; setting; narrative; covers/abilities/research; Paranoia; movement, interaction, camera, and observation; stealth; surveillance; civilians/security; time and schedules; safehouse/save/Restart Attempt; dialogue/gates; George; facts/dossier/minimap/terminals; objectives; social feed; combat and inventory disposition; city/Blender pipeline; actors/portraits; HUD; audio; localization; accessibility; performance; readiness; and delivery governance.

The Decision Register must retain recoverable historic ratings exactly, including the withdrawn `9.2/10` and reviewed `4.5/10` visual assessment, without reconstructing missing ratings.

The main Bible reading experience must explain the game fantasy, intended experience, pillars, setting/campaign premise, Level 0 promise, complete loop, system relationships, content boundaries, visual/audio direction, failure, research, persistence, continuation, and chapter navigation. The system package must cover setting, narrative, covers/abilities/research, gates, Paranoia, movement, interaction, observation, stealth, surveillance, cameras, Needle, security, civilians, time, schedules, safehouse, Restart Attempt, dialogue, George, facts, dossier, objectives, HUD, minimap, social feed, terminals, combat disposition, inventory disposition, Blender/world art, actors, portraits, lighting, audio, localization, accessibility, performance, readiness, and governance.

The in-game catalog has exactly sixteen chapters: What The Getaway Is; Setting and Campaign; Complete Level 0 Journey; Character/Covers/Abilities/Research; Paranoia/Failure/Recovery; Movement/Interaction/Camera/Observation; Time/Schedules/Safehouse/Save/Restart Attempt; Surveillance/Cameras/Security/Civilians/Drone; Stealth/Hiding/Blending/Interception/Escape; Narrative/Dialogue/George/Contacts; Facts/Dossier/Objectives/Minimap/Terminals/Social Feed; HUD; World/District/Routes/Geometry; Art/Blender/Actors/Portraits/Lighting; Audio/Localization/Accessibility/Performance; Content Boundaries/Continuation.

Every chapter includes a purpose/player promise, outline, detailed prose, concrete Level 0 examples, useful state/comparison tables, inputs and downstream effects, world/HUD/dialogue/audio/George feedback, failure/recovery/persistence/Restart Attempt behavior, and related chapters. English and Ukrainian share IDs, navigation order, semantic block shapes, topic coverage, shared rules, tables/state relationships, and meaning; every chapter receives recorded bilingual semantic review and a back-translation spot-check.

### World/UI/audio/George feedback

The canonical package specifies graphic surveillance noir, exactly four dense mission blocks with three functional identities and three interlocking loops, named Neo Tokyo 2 source provenance, close street-first play and a four-block overview, truthful surveillance geometry, the four-lane 16–18% dock, an always-visible named Paranoia tier with lit/locked abilities, world-visible paused overlays, one-function terminals, knowledge-limited minimap, bounded George prompts and private AR presence, and required audio families. It states which internal values remain open instead of turning recommendations into silent production constants.

The player-facing Bible uses a restrained surveillance-noir reference-manual shell. At `>=1200px`: sticky top bar, `264px` chapter rail, centered article capped at `820px`/`76ch`, and `196px` on-page outline. At `841–1199px`: `224px` rail, article, and inline section list. At `<=840px`: one column, full-width search row, chapter drawer inside the single dialog, expandable on-page navigation, `16–24px` padding, locally scrollable tables, and ≥`44px` targets. Warm practical gold marks current reading context, cyan supports action, and crimson appears only in genuine danger/failure examples. No critical meaning is color- or audio-only.

Underlying world/HUD/dialogue/audio/George state remains visible only as the paused invoking context and is not recomputed by the Bible. Search-result count and section changes are announced accessibly. Headings and tables are semantic; current chapter/section use `aria-current`; focus remains trapped and returns to the invoker or gameplay shell.

### Failure and recovery

If sources conflict, do not reconcile them by compromise or by whichever implementation is easiest. Identify the conflict, use the precedence order, record the rejected/superseded rule, and update every downstream owner. A missing decision becomes an `OPEN-*` blocker. A broken link, duplicate ID, unmapped decision, incomplete ticket, or active stale rule fails this ticket's gate.

The verified archive remains the recovery path for protected work. No reset, restore, deletion, or selective salvage occurs here.

The in-game content gate fails on any governance identifier, tracker/dependency state, provisional/recommended/unresolved/approval language, Removed/Superseded/rejected/historical alternative, implementation ownership, repository path, raw wiki link, or test/build/coverage/commit/delivery state. Missing or stale source/decision/topic mappings fail validation. Missing localized content fails closed to a controlled error rather than silently mixing locales or rendering internal material.

Opening from active play freezes clock, schedules, surveillance, Needle, autonomous actors, movement, interaction, and deadline. Closing above a paused menu leaves the menu paused. A missing invocation target restores a safe menu/world focus fallback. Session reading state never enters save or Restart Attempt, stale chapter/section memory falls back to the first valid target, and teardown cannot leak or prematurely release pause ownership.

### Explicit exclusions

- No mission/gameplay behavior, save-format, gameplay schema, or production-art mutation.
- No silent approval of recommended `OPEN-*` baselines.
- No new parallel design archive outside `memory-bank/`.
- No short tutorial/help page as a substitute for contextual onboarding; the complete finalized in-game Bible is required.
- No direct canonical-Markdown renderer, runtime content filtering, governance/debug/development copy, or raw source reference in the player-visible surface.
- No generic documentation editor, annotations, bookmarks saved into the run, external links, write actions, or game-state mutation from the Bible.
- No resurrection of removed systems as “future flexibility.”
- No commit, ticket `Done`, or GET-139 closure without requester authorization and verification.

### Dependencies and OPEN blockers

Gate 0's verified recovery archive and the separately committed original specification package are prerequisites already satisfied. This Fable-alignment package must receive its own reviewed documentation commit before the five focused children or GET-179 modernization begins. GET-201 must be the only active visual/runtime child during its own implementation; downstream tasks remain parked or terminal. T1 remains a closure blocker for T2–T10, the focused children, and GET-139 but does not invalidate previously committed delivery evidence.

The Bible feature itself has no provisional `OPEN-*` assumption: its existence, name, scope, access points, finalized-only content boundary, bilingual equivalence, pause behavior, information architecture, and responsive breakpoints are Approved. Unresolved game-design values remain represented internally for their owning systems but never render; their existence does not justify invented constants or block explanation of the Approved behavior.

### Canonical decisions/spec sections

Implements `GDR-PROD-001`, `GDR-PROD-002`, `GDR-SET-001`, `GDR-SET-002`, `GDR-SET-004`, `GDR-SET-005`, `GDR-SET-006`, `GDR-PC-004`, `GDR-UI-004`, `GDR-GOV-001`, `GDR-GOV-002`, `GDR-GOV-003`, `GDR-GOV-005`, `GDR-GOV-007`, `GDR-GOV-008`, `GDR-REM-012`, and `GDR-SUP-004`, plus every current Approved player-facing rule mapped by the independent in-game coverage inventory.

Canonical sources are [[Game Design]], [[10 MVP Spine]], [[11 Level 0 Vertical Slice Contract]], [[12 Game Design Decision Register]], [[13 Level 0 Content and State Matrix]], [[14 Specification Review Queue]], every system specification in [[01 MVP/00 Index]], [[03 Lore/Plot Bible]], [[04 Engineering/Architecture]], [[04 Engineering/Roadmap]], [[45 HUD & Information Architecture]], [[95 MVP Readiness Checklist]], `AGENTS.md`, `progress/GET-139.md`, the forensic audit record in `progress/GET-201.md`, and the approved in-game design `docs/superpowers/specs/2026-08-06-in-game-bible-design.md`.

### Human-play acceptance

Specification acceptance means a reviewer can trace each step of `AC-L0-001` through `AC-L0-029` from player action to state transition, content owner, feedback, persistence/Restart Attempt, outcome-ledger write, failure/recovery rule, and ticket without relying on old code. Every one of the 214 historical structured exchanges and every later material correction has an explicit current, superseded, unresolved, non-design, or stale-mirror outcome. A reviewer must also find no current claim for fixed Operative/Trace, packages, A*, Pressure, tactical combat, AutoBattle, the rejected sparse compound or oversized nine-block board, fantasy actors, procedural narrative, deep inventory, a three-lane HUD, special off-grid zones, universal evidence grading, injury simulation, or hidden George silence.

Runtime acceptance requires all of the following under live human control:

- start-menu button and `F1` open the Bible with no run/pause creation; paused-menu button and `F1` compose `menu + bible`; active-play `F1` acquires one Bible owner; ineligible modals/editable inputs retain authority;
- every one of sixteen chapters and every section is reachable in EN and UK; title, summary, section, body, and keyword search return deterministic localized labels/excerpts and focus the correct section;
- drawer, focus trap/restoration, Escape precedence, backdrop/close behavior, semantic headings/tables, result announcements, current-state semantics, controller/pointer/keyboard blocking, and stale-target fallback work at the defined breakpoints;
- opening, navigating, and closing preserve mission, clock, position, facts, network, outcome, autosave, and Restart Attempt; repeated `F1`, close/Escape races, unmount, run replacement, New Game, and shell teardown do not leak or double-release pause;
- inspected screenshots pass at `1920×1080`, `1440×900`, `1280×720`, `1200`, `1199`, `841`, `840`, and `390×844`, including long Ukrainian headings, search results, a table, deep scroll, and the narrow drawer;
- rendered and text-bridge content contains no unresolved/governance/history/implementation/delivery material, and the bridge reports the same open/chapter/section/query/drawer/ordered-result state visible to the player.

### Documentation and validation obligations

Run a full current-doc contradiction search; validate all sixteen specification headings and all sixteen in-game chapters; validate unique `GDR-*`, `OPEN-*`, fact, gate, objective, state, failure, terminal, acceptance, Bible chapter/section/topic IDs, and source references; verify bidirectional decision/document/ticket/Bible mappings; resolve wiki links; inspect every Linear child after rewrite for semantic description parity plus unchanged label/state/parent/blocker/dependency data; and run `git diff --check`.

The in-game validation gate parses every Approved Decision Register row; checks rendered mapping or bounded non-player-facing classification; checks every required topic and per-chapter semantic role; checks exact EN/UK structure, shared numeric/state data, search fields, relations, source resolution, and recorded semantic review; and rejects governance, uncertainty, historical, implementation, repository, raw-link, or delivery-process content. Focused component/runtime tests cover search, navigation, breakpoints, focus, input, pause, persistence, Restart Attempt, teardown, and text state. After live acceptance, run lint, build, all tests, coverage above 80%, guided AI regression, inspect the newest report, and resolve/defer every actionable finding.

Record source boundaries, audit counts, per-system coverage, repaired gaps/conflicts, supersession chains, legitimate internal OPEN items, in-game chapter/topic/decision/source coverage, bilingual review, live screenshots, console state, pause/focus/no-mutation proof, tests, AI report, affected chapters/tickets, and Linear readback evidence in `progress/GET-201.md`. Keep T1 nonterminal pending requester verification. Create no commit without separate authorization.

## T2 — Recover the canonical pre-rewrite foundation

- **Label:** Improvement
- **Initial state:** Todo
- **Parent:** GET-139

### Why this ticket exists

The current dirty worktree contains a destructive rewrite mixed with valuable research, assets, diagnostics, and partially useful runtime work. Simply continuing would preserve rejected product decisions; simply resetting would destroy recoverable work. This ticket creates a deliberate, auditable transition from the protected rewrite to the last clean pre-rewrite foundation while salvaging only items explicitly approved by the canonical specification.

Recovery is not a vote for every old system. It restores a comprehensible base from which T3–T10 can implement the approved Tokyo escape without treating rewrite deletions or experiments as canonical.

### Player promise

The player-facing purpose is to restore the valuable identity that was lost—character creation, Character screen, George, Paranoia, progression, dialogue-led RPG foundations, and the original four-lane HUD concept—without bringing back obsolete breadth. The eventual slice should inherit responsive movement research, factual state concepts, visual references, and reliable playtest diagnostics where they help, while rejecting the fixed Operative, packages, combat strip, fantasy actors, synthetic city, and sparse compound.

### Starting state

- Baseline is `main` at `49a4da7bed164051cc1fbeba60493ca5de92310f`.
- The verified archive at `/Users/deus/.codex/recovery/the-getaway/GET-139-docs-preflight-20260802T120000Z` contains tracked changes, untracked files, checksums, and a successful temporary restoration proof.
- The shared workspace remains dirty and protected; no cleanup has occurred.
- T1 must have a reviewed, validated, committed deliverable before this ticket begins; T1 may remain `In Review` pending requester verification.
- There are no `OPEN-*` design blockers owned by T2; ambiguity about salvage ownership is resolved against the canonical specification and documented rather than guessed.

### Complete player flow

This ticket does not deliver the new Tokyo mission. Its runtime exit is a bootable, honest foundation: Main Menu opens; New Game reaches the restored character-creation/identity path or a clearly documented restoration seam; the app can initialize without stale fixed-Operative/package/combat state; restored Character, George, Paranoia, progression, and four-lane HUD foundations are present or mapped to an explicit later owner; and incompatible rewrite saves receive an honest New Game path rather than corrupted defaults.

No restored route, quest, visual, or combat behavior is presented as the final Level 0 experience. The baseline exists so the new work can be built intentionally.

### System rules and state transitions

Classify every rewrite-owned tracked/untracked surface as `restore`, `salvage`, `archive-only`, `reject`, or `unresolved`. Restore the clean foundation first; apply a salvage only when it maps to an approved target contract and can be isolated without importing rejected assumptions. Approved salvage categories are direct responsive movement research, factual-ledger concepts, validated visual references, Neo Tokyo compiler/recipe work, and reusable live-playtest diagnostics.

Retired schema state containing fixed Operative, Ghost/Wire/Force, combat, reputation, storylet, or deep-inventory assumptions is never silently hydrated into the target run. T3/T7 own the new schema; T2 may establish the honest incompatibility boundary but does not guess a migration.

### Internal milestones and proof gates

1. Re-read and checksum the external archive; compare manifest, patch, untracked count, and baseline SHA with `progress/GET-139.md`.
2. Reproduce the protected dirty state in a fresh temporary copy again before modifying the shared workspace.
3. Produce a file/module-level disposition map with rationale and target ticket for every salvage candidate.
4. Restore the shared workspace to the approved pre-rewrite foundation without overwriting unrelated requester work.
5. Apply only reviewed salvage slices, one coherent category at a time, with diff review after each.
6. Remove active initialization paths for rejected rewrite state and establish honest incompatible-save behavior.
7. Boot and inspect the baseline, run focused checks, and record every restored, salvaged, archived, rejected, or deferred surface.

### Content requirements

The recovery ledger must cover source, assets, scripts, tests, documentation remnants, save fields, feature flags, generated files, and untracked materials. It must name the archive location/checksums, old and restored baselines, exact salvaged files/ideas, destination ticket, and why each retained part is compatible with the current design.

Any restored player-facing copy is temporary foundation content and must not assert Tokyo facts still blocked in the review queue.

### World/UI/audio/George feedback

The bootable baseline must not display the rejected compact compound, fantasy actor set, combat/AutoBattle UI, Ghost/Wire/Force setup, `Pressure`, or three-lane rewrite HUD as the future contract. Restored Character, George, Paranoia, and HUD foundations may look pre-production, but they must initialize coherently and be clearly assigned to T6/T7/T9 for replacement. Stale audio, alarms, overlays, and event listeners from the rewrite must not survive New Game or load.

### Failure and recovery

Any checksum mismatch, patch failure, untracked extraction failure, ownership uncertainty, or unexpected divergence stops destructive recovery. Preserve the shared workspace and reproduce in a temporary copy until the cause is understood. If a salvage imports rejected state or breaks boot, remove only that documented salvage slice and return to the verified restored baseline; never use a broad destructive reset.

### Explicit exclusions

- No new gameplay, final layout, city art, actor production, authored Tokyo mission, or balancing.
- No wholesale transplant of the rewrite.
- No compact compound, fixed Operative/Trace, packages, A*, tactical combat, AutoBattle, fantasy actors, synthetic city, deep inventory, storylets, or reputation.
- No raw licensed Neo Tokyo geometry committed.
- No partial save migration and no claim that a restored legacy test proves the new slice.

### Dependencies and OPEN blockers

Depends on T1 review, validation, and separately authorized documentation commit. Blocks T3 and therefore every runtime implementation child. No existing `OPEN-*` item directly blocks recovery. A salvage that would decide player behavior remains archive-only until its owning ticket can implement it through an approved rule or an explicit reversible provisional seam.

### Canonical decisions/spec sections

Implements `GDR-GOV-004` and removes active influence from `GDR-REM-001` through `GDR-REM-011` as mapped to T2. Primary sources are [[04 Engineering/Roadmap]] Gate 2, [[04 Engineering/Architecture]] sections 1, 18, and 19, [[12 Game Design Decision Register]] Removed behavior, `AGENTS.md` recovery governance, and the archive evidence in `progress/GET-139.md`.

### Human-play acceptance

From a clean start, the application boots without console/page/state errors, stale package selection, combat HUD, or corrupted save defaults. New Game reaches the intended restored identity foundation or a documented placeholder seam. Character creation, Character screen, George, Paranoia, progression, and original HUD foundations are present or have an exact file-level restoration path. Restarting New Game clears stale runtime state. This is baseline acceptance only, not acceptance of the new Tokyo mission or visual direction.

### Documentation and validation obligations

Append the complete recovery/disposition ledger and reproduction commands to `progress/GET-139.md`; update Architecture only for confirmed recovered ownership; keep Roadmap sequencing unchanged. Review `git status`, `git diff`, patch applicability, archive checksums, boot logs, save incompatibility behavior, and focused tests. Do not commit until explicitly authorized. Move no implementation ticket forward until the recovered baseline is reproducible and requester-visible risks are recorded.

## T3 — Level 0 runtime and shared outdoor-layout contract

- **Label:** Feature
- **Initial state:** Todo
- **Parent:** GET-139

### Why this ticket exists

The rejected Level 0 was a sparse tactical board whose routing, anchors, camera, HUD focus, persistence, and art semantics drifted independently. The new city needs one gameplay-owned outdoor contract before Blender composition or system integration can be trustworthy. T3 establishes the runtime spine: three traversable city loops, direct movement, explicit interaction, camera/observation behavior, deterministic time/pause ownership, safehouse actions, and separate autosave/operation-baseline seams. T3A owns the approved public/shared rename, schema bump, and Restart Attempt readback/restore contract on top of that delivered seam.

This ticket owns foundations, not final surveillance mechanics, RPG tuning, UI content, or production art.

### Player promise

The protagonist begins at 18:30 in a readable outdoor safehouse boundary and can move through a continuous Tokyo greybox using click or WASD without A* choosing a route. Movement responds immediately, slides along walls and corners, and reports invalid destinations honestly. The player can inspect known information in full-pause Observation, use explicit interactions, wait or Rest safely, choose dusk or curfew timing, and trust that failure Restart Attempt will return to the exact operation-departure state.

All mandatory places are reachable through three interlocking loops; no building, input layer, or camera transition steals control or hides a required anchor.

### Starting state

- T1 has a reviewed, validated, committed deliverable and T2 has produced a reproducible bootable foundation; either predecessor may remain `In Review` pending requester verification.
- Exact layout dimensions, loop geometry, street widths, anchors, safehouse boundary, actor movement tuning, and default camera framing remain T3 acceptance decisions; use only their recorded `OPEN-*` recommendations as reversible provisional layout/configuration data.
- The world is outdoor-only; no full interior is required.
- T3 begins from the mission skeleton and measured greybox behavior. Its provisional geometry must remain replaceable by the later accepted four-block Blender master; it must not preserve the old `54×38` sparse/fenced four-block compound, `84×60` nine-block board, `96×72` experiment, nine-parcel layout, or sprite-collage assumptions.

### Complete player flow

1. New Level 0 initializes the protagonist inside the safehouse at 18:30 with a current-run autosave, no `OperationAttemptBaseline`, and the Lira objective.
2. The player reads available safehouse actions, moves directly with click or WASD, and interacts explicitly with Lira/contact/terminal/entrance placeholders through typed range, visibility, occlusion, ownership, and availability results.
3. After accepting the operation, the player may Wait in confirmed 30-minute steps or Rest for 30 minutes and Paranoia −40.
4. Explicit operation departure creates one immutable operation baseline and starts the active route; T7A supplies its final `OperationAttemptBaseline` schema, readback, and `restartAttempt` action.
5. The player can reach public and service entrances, all contact and terminal anchors, cache/manifest anchors, camera/device regions, hiding/blending anchors, and the return path across three connected loops without pathfinding.
6. Observation pauses clock, schedules, cameras, actors, drone placeholders, and movement while allowing camera pan/read-only inspection of known state.
7. Reload, failure Restart Attempt, and New Game rebuild the scene, camera, focus, time, and saved state without stale listeners or overlays.

### System rules and state transitions

`Level0LayoutContract` is authoritative for district bounds, zones, traversal loops, surfaces, building footprints, entrances, occluders, contacts, terminals, cameras, drone regions, hiding/blending contexts, objectives, interaction/audio anchors, semantic masks, art-layer IDs, and 64×32 2:1 projection metadata. Phaser and Blender consume the same versioned contract.

Click stores one direct world-space intent; WASD stores directional intent; any new input replaces the previous intent. Local collision sliding is allowed, but no A*, queue, safest-path calculation, threat-aware steering, or automatic door traversal exists. Invalid clicks return a typed reason and optional nearest reachable marker without routing there.

The world clock starts 18:30, advances at 30× only during unpaused exploration, enters curfew at 22:00, and reaches the operation deadline at 00:00. Pause is an additive owner set. Autosave and the once-per-attempt operation baseline are separate versioned records. The existing stable loop IDs carry localized display-name keys; T10A supplies Transit Road, Market Ring, and Outer Space content.

Safehouse entry and action availability while directly observed, `Suspicious`, or `Pursuit` is an explicit unresolved domain seam under `OPEN-SAFE-001`. T3 may expose typed state and unavailable reasons, but it cannot assume that crossing the boundary clears surveillance or enables recovery/planning actions.

### Internal milestones and proof gates

1. **Layout draft:** define three loops, outdoor safehouse, public/service approaches, Lira/Naila/Brant, three terminals, cameras, drone regions, minimum hiding/blending contexts, cache, manifest, and return/validation anchors.
2. **Movement proof:** measure the outer loop at two to three minutes using approved tuning or the isolated reversible `OPEN-MOV-002` recommendation; prove click/WASD parity, immediate override, wall/corner/alley sliding, invalid-click feedback, and no path request.
3. **Interaction proof:** exercise every target type and every available/too-far/blocked/occluded/unavailable result through normal input.
4. **Pause/focus proof:** open/close every declared pause surface and Observation beside active autonomous state; prove zero clock/simulation leak and no sacrificial click.
5. **Persistence proof:** distinguish autosave from an immutable departure baseline; prove compatible hydration and an isolated upgrade seam for T3A's v3 `OperationAttemptBaseline`/stale-save rejection.
6. **Projection proof:** compare runtime collision/debug geometry, markers, entrances, masks, and Blender input from one contract.

### Content requirements

Author the semantic layout record, zones, three loop identities, roads/sidewalks/alleys/crossings/plazas/service areas, footprints, entrances, safehouse/departure action, contact/device/objective anchors, minimum contexts from [[13 Level 0 Content and State Matrix]], schedule hooks, and diagnostic labels. Author typed interaction reasons, pause owners, world-clock boundaries, Wait/Rest/departure confirmations, save envelopes, and incompatibility copy keys without freezing unresolved narrative prose.

### World/UI/audio/George feedback

Greybox surfaces must distinguish walkable, blocked, entrance, interaction, and observation semantics without pretending to be final art. Destination markers show intent/rejection; world prompts name range/occlusion/availability; the camera follows the current protagonist after load/restart and restores follow after Observation. HUD time/curfew/deadline and safehouse previews reflect authoritative state. Audio events are semantic hooks only; T10 authors production cues. George can explain verified current objective, time, known blockers, and safehouse actions through T9 later, but T3 never routes or acts for the player.

### Failure and recovery

At 00:00, the domain issues deadline failure while either medkit return or transit validation remains incomplete; final mission content is integrated by T10. Restart Attempt restores identity/build payload, resources, exact departure time, facts/contacts/knowledge, mission/objectives, safehouse state, position, and deterministic generation while clearing all later runtime state. Incompatible rewrite saves explain New Game and never partially hydrate. A topology, anchor, or projection mismatch fails the gate and is fixed at the layout source rather than disguised in rendering. Safehouse arrival under active surveillance follows the approved or explicitly provisional `OPEN-SAFE-001` rule and cannot become an undocumented state reset.

### Explicit exclusions

- No A*, navigation mesh route execution, click queue, automatic route choice, threat-aware steering, or minimap movement.
- No final Hidzu Corporation art, actor production, surveillance-state mechanics, dialogue content, RPG balancing, or mission integration.
- No full interiors, decorative clutter, old compound geometry, or art-defined collision.
- No automatic pickup, proximity completion, background simulation under pause, silent save migration, or post-departure baseline overwrite.

### Dependencies and OPEN blockers

Depends on T2. Blocks T3A, T4, T7, T8, T9, and T10. Critical acceptance blockers are `OPEN-NAR-007`, `OPEN-TIME-001`, `OPEN-MOV-001`, `OPEN-CIV-001`, `OPEN-SEC-001`, `OPEN-LAYOUT-001`, `OPEN-LAYOUT-002`, `OPEN-LAYOUT-003`, `OPEN-LAYOUT-005`, and `OPEN-SAFE-001`. High acceptance blockers are `OPEN-NAR-013`, `OPEN-MOV-002`, `OPEN-MOV-003`, and `OPEN-LAYOUT-004`. These items do not block ticket start after T2; any recorded recommendation encoded before approval is a reversible provisional trial documented with its seam, live proof, and rollback path.

### Canonical decisions/spec sections

Implements `GDR-PROD-004`, `GDR-SET-002`, `GDR-MIS-006`, `GDR-TIME-001` through `GDR-TIME-003`, `GDR-MOV-001` through `GDR-MOV-003`, `GDR-INT-001`, `GDR-OBS-001`, `GDR-OBS-002`, `GDR-STL-001`, `GDR-ART-002`, `GDR-ART-004`, `GDR-REM-003`, `GDR-REM-008`, `GDR-SUP-001`, and `GDR-SUP-002`.

Canonical detail is in [[11 Level 0 Vertical Slice Contract]] starting state, movement, observation, time, safehouse, and save sections; [[13 Level 0 Content and State Matrix]] sections 1–3, 7–8, 12–13; [[41 Movement, Interaction & Observation]]; [[44 Safehouse, Save & Restart Attempt]]; [[80 Day-Night Cycle]]; [[04 Engineering/Architecture]] sections 3–7 and 11–12; and [[04 Engineering/Roadmap]] Gate 3.

### Human-play acceptance

- Complete `AC-L0-001` through safehouse/Lira reachability with first meaningful decision under three minutes after content integration.
- Reach every mandatory anchor by both input methods without any pathfinding request.
- Traverse walls, corners, narrow alleys, entrances, and all three loops without sticking, tunneling, or stale intent.
- Open Observation and every available overlay next to active clock/schedule diagnostics; prove all simulation freezes and focus returns cleanly.
- Wait, Rest, depart, alter the run, fail through a diagnostic boundary, and Restart Attempt; prove exact departure restoration.
- Reach/cross the safehouse boundary while observed, Suspicious, and in Pursuit; prove typed unavailable reasons and the approved or explicitly provisional `OPEN-SAFE-001` behavior without an automatic clear (`AC-L0-019`). Provisional proof informs review but does not close final acceptance.
- Inspect debug geometry against collision, interaction, entrance, minimap, mask, and Blender coordinates; no edge disagreement or unreachable required target remains.

### Documentation and validation obligations

Update Architecture only for implemented ownership/data flow, the layout/content schema, Building Positioning Runbook inputs, MVP Readiness evidence states, and `progress/GET-203.md`. Add focused tests for layout validation, reachability without pathfinding, movement override/sliding, interaction results, pause ownership, clock boundaries, camera reset, save envelopes, baseline immutability, and incompatibility. After live proof and requester acceptance, run relevant validators plus the AGENTS closeout suite and guided AI regression; record human evidence separately because automation cannot accept movement feel or layout readability.

## T4 — Four-block Neo Tokyo 2 city rebuild

* **Label:** Improvement
* **State:** In Progress
* **Parent:** GET-139
* **Blocks:** GET-205 and downstream visual integration

### Why this ticket exists

The committed Level 0 plate is a meaningful visual-direction checkpoint: it improved camera intimacy, actor scale, glare, separate population, collision rejection, and overview stability. It is not the final city foundation. Source audit found that its architecture is a generated raster composition with zero production buildings that can be traced to named Neo Tokyo 2 assets.

The earlier real Blender district also failed: it used genuine kit geometry but assembled it as a sparse, flat catalog scene. The correction is not a return to that city and not a larger one-shot rebuild. GET-204 now builds exactly four dense mission blocks from named Neo Tokyo 2 assets, preserving the approved composition and human-scale relationship while restoring professional source identity.

### Player promise

Normal play reproduces the locked KitBash blend's human/door/sidewalk/street/building proportions: the protagonist reads as a person without dominating the street, nearby entrances and civilians remain legible, buildings make a credible street canyon, and the player can read an immediate movement choice plus a surveillance relationship. Reference 2 supplies camera intimacy and social staging, not actor size.

Manual overview reveals the same compact four-block mission space. It does not expose an empty board, isolated showcase buildings, a tower cluster, repeated generated plates, or corrupted edges.

The city is attractive, maintained, contemporary, and comprehensively watched. It is not fantasy Neo, generic neon cyberpunk, or a military compound.

### Locked reference authority

1. `art/references/get205/kitbash-reference2-blend-concept-v1.png`
   * SHA-256: `b8e69fcbb4839cf2fb70fa80e03c42ff321e6a5ee00c2287f1f824f08e951c5d`
   * Approved AI-assisted previsualization.
   * Owns the four-block composition, close camera, authoritative human/door/sidewalk/street/building proportions, street-wall density, warm/cold value hierarchy, and one restrained Hidzu Corporation landmark.
   * Does **not** own production geometry and may never be promoted as game architecture.
2. `art/references/get204/street-play-target.png`
   * Owns normal-play intimacy, social readability, surveillance readability, and street context; it does not own actor size.
3. `art/references/get204/canvas-quality-target.png`
   * Owns material depth, facade richness, motivated lighting, readable midtones, and restrained wet response.
4. `art/references/get204/dense-city-target.png`
   * Secondary overview-density reference only; it does not expand the mission scope.

### Starting state and protected baseline

* Source pack: `/Volumes/Elements/Backup/Downloads/Game/Neo Tokyo 2`.
* Authoring environment: Blender 5.0.1.
* Runtime projection: 64×32, 2:1 isometric.
* The actual Blender close/overview proof and four-block treatment direction are approved. One master now registers 16 KitBash clusters from 10 named Neo Tokyo 2 building roots, and its people-free derivatives render on the normal Phaser route as an uncommitted live candidate. The committed plate remains recovery-only until requester live acceptance and an authorized commit.
* Current HUD, Menu, character systems, movement, quests, dialogue, surveillance behavior, George, and progression are not redesigned here.
* Current uncommitted GET-205 treatment and partial GET-208 work remain protected.
* Raw licensed geometry/textures and generated `.blend` files stay outside Git.
* No commit is authorized until the relevant visual result is accepted and the requester explicitly asks to commit.

### Exact city shape

The master contains exactly four dense urban blocks:

1. **Safehouse/backstreet block**
   * discreet safehouse threshold;
   * residential/service frontage;
   * sheltered edges and utilities;
   * ordinary route into public space.
2. **Public/transit/contact block**
   * strongest civilian/public presence;
   * compact commercial or service frontage;
   * transit shelter/kiosk and public screens;
   * contact staging and normalized surveillance.
3. **Controlled logistics block**
   * Hidzu Corporation logistics frontage;
   * public delivery threshold and identity control;
   * mission-objective frontage;
   * institutional without a fortress silhouette.
4. **Service-seam block**
   * alley/loading space;
   * camera-terminal relationship;
   * hiding structure and rear approach;
   * route reconnecting public and safehouse sides.

Three interlocking route loops may cross these blocks, but mission topology remains gameplay-owned. The art must express approved route purposes and cannot invent or delete them for composition.

Mostly low/mid-rise source buildings form continuous street walls and resolved corners. One restrained landmark may orient the district. A skyline cluster, monumental boulevard, second/third tower landmark, large plaza, and decorative outer city are excluded.

### Source and geometry rules

Every visible production building and source-derived prop records:

* exact Neo Tokyo 2 source prefix/group;
* source path or collection;
* selected structural members;
* normalized ground contact;
* authored transform;
* block and route role;
* attached project-owned gap fills.

AI-generated or synthetically regenerated production architecture is prohibited. Cropped synthetic frontage that obscures source identity is prohibited. Project-owned roads, sidewalks, curbs, crossings, drainage, entrance aprons, signs, cameras, thresholds, shelters, and other gameplay-serving public-realm gap fills are allowed.

The same master scene owns building geometry, camera family, public realm, materials, lighting, and later export registration. Runtime collision, entrances, occlusion, masks, and anchors are derived only after the master passes its first visual gate.

### Camera, people, and world treatment

* Normal play uses a close classic 2:1 isometric frame.
* The protagonist occupies the lower-center lead area.
* At `1440×900` with the approved `16–18%` dock, target visible protagonist alpha-body height is approximately `68–80 px`, excluding shadow, selection ring, and George. The locked blend relationship outranks the numeric band.
* Protagonist, contacts, security, and civilians use one shared base scale. Camera zoom changes the world and all human actors uniformly; no protagonist-only, per-scene, or per-zoom compensation is allowed.
* The close frame retains one immediate route choice, one social context, and one surveillance relationship.
* Overview uses the same master scene and reveals only the four-block mission space.
* A few separate proxy figures may establish scale in offline renders.
* Environment exports contain zero baked people; protagonist, contacts, civilians, security, drone, George, and stateful devices remain runtime-owned.
* Roads have material separation, repairs, drainage, markings, roughness variation, and restrained reflections tied to visible light sources.
* Buildings retain recognizable kit geometry/materials, readable midtones, believable sills, and visible entrances.
* Blue hour supplies cool fill; sodium warmth comes from visible practicals.
* Cyan is scarce and device-bound; crimson is reserved for genuine restriction/danger.
* Wet response may enrich materials but cannot become broad glare, ripples, or mirror pavement.
* GET-204 may establish one restrained Hidzu Corporation landmark cue. Full identity grammar, propaganda, schedule states, and atmosphere remain GET-205.

### Delivery sequence and gates

 1. Align Linear, canonical specifications, progress notes, and source-provenance policy.
 2. Write a failing contract test that rejects the old eight-block/20-cluster recipe and requires exactly four source-bound blocks.
 3. Create a new mission-district manifest with named Neo Tokyo 2 provenance.
 4. Build one actual Blender master and author the four-block public realm.
 5. Render close and overview frames from the same scene.
 6. Internally reject weak scale, massing, street walls, source identity, materials, or lighting and fix one variable class per pass.
 7. Present the strongest actual Blender close/overview pair to the requester.
 8. Only after explicit Blender approval, export registered layers and semantic geometry and integrate a reversible live candidate.
 9. Prove live camera, actors, collision, entrances, selective occlusion, and overview at target viewports.
10. Obtain separate live acceptance before closeout and any authorized commit.

### First requester gate: actual Blender proof

The proof contains:

* one close play frame showing the locked blend's actor/door/sidewalk/street/building proportions, Reference 2 camera intimacy/social staging, entrance and route readability, source architecture, and rendering quality;
* one overview showing the same four-block master, compact mission scope, three functional identities, named source buildings, one restrained landmark maximum, and no sparse-board silhouette;
* source inventory, Blender version, camera, dimensions, and hashes.

The generated concept may appear beside the proof only as a target. It is never evidence that the production scene exists.

### Failure and recovery

Reject the pass if it shows any of the following:

* weak or untraceable KitBash identity;
* generated production architecture;
* tiny character or distant board framing;
* tower-dominated or monumental massing;
* isolated buildings, empty lots, oversized plaza, or sparse compound language;
* flat roads, floating buildings, blank facades, or impossible light;
* glare, ripple, fog, bloom, neon, or grading used to hide weak geometry;
* baked people in environment art;
* labels or decorative clutter compensating for unreadable routes;
* overview voids, seams, blur, or corruption.

On failure, preserve the last measured baseline and change one variable class: source selection, massing, street hierarchy, camera/actor relationship, public realm, material, or lighting. Do not proceed to runtime to disguise the defect.

### Explicit exclusions

* No HUD or Menu redesign.
* No quest, dialogue, RPG, George, stealth, surveillance, combat, or actor-system redesign.
* No large city beyond the four mission blocks.
* No synthetic replacement of Neo Tokyo 2 buildings.
* No per-building Phaser collage as final production architecture.
* No raw licensed geometry/textures or generated `.blend` in Git.
* No baked people.
* No runtime replacement before Blender approval.
* No GET-205 implementation while this source-geometry gate is active.

### Dependencies, OPEN blockers, and canonical ownership

GET-204 depends on GET-203's delivered runtime, projection, direct-movement, and semantic-layout foundations, while explicitly superseding every rejected sparse-compound, nine-block, full-district, and generated-plate geometry assumption. It blocks GET-205 and downstream visual integration. Work already present for GET-205 or GET-208 is protected concurrent evidence only and does not transfer ownership into this ticket.

The approved four-block envelope, three functional identities, three traversal loops, named Neo Tokyo 2 provenance, same-master Blender proof, and separate live-acceptance gate are current rules. `GDR-ART-014` resolves the former actor-proportion open item through the locked blend; the derived runtime scalar remains an implementation value. Exact accepted bounds, widths, detailed anchors, masks, camera calibration, occluder behavior, and performance limits remain governed by `OPEN-MOV-003`, `OPEN-LAYOUT-001`, `OPEN-LAYOUT-002`, `OPEN-LAYOUT-004`, and `OPEN-PERF-001` until requester evidence freezes them; no implementation constant silently resolves those items. `GDR-ART-013` separately fixes the environment-state delivery and 750 ms crossfade contract.

Implements `GDR-PROD-004`, `GDR-ART-002` through `GDR-ART-007`, `GDR-ART-009`, `GDR-ART-010`, `GDR-ART-014`, `GDR-GOV-001`, `GDR-SUP-001`, and `GDR-SUP-002`. Canonical ownership is [[30 Art Direction (MVP)]] sections 3–6 and 9–15, [[31 GET-204 Visual Rebuild Quality Contract]], [[13 Level 0 Content and State Matrix]] section 13, [[41 Movement, Interaction & Observation]] camera and layout rules, [[04 Engineering/Architecture]] sections 5–7, and [[04 Engineering/Roadmap]] Gate 4.

### Human-play acceptance after Blender approval

The later live candidate must:

* come from the accepted master;
* keep the protagonist and population as separate runtime actors;
* prevent movement onto visible buildings and people;
* align collision, entrances, occlusion, masks, and anchors with visible geometry;
* preserve current controls, HUD, Menu, and gameplay ownership;
* show a readable close frame and coherent four-block overview at 1440×900 and 1920×1080, with 1280×720 compatibility; the 1440×900 frame measures the `68–80 px` protagonist alpha-body band and visibly matches the blend's surrounding proportions;
* contain no fallback leak, generated-plate seam, void, angle mismatch, or zoom corruption.

The requester accepts the live result separately. Only then may closeout validation and an explicitly authorized commit occur.

### Documentation and validation obligations

Keep the Decision Register, Art Direction, GET-204 quality contract, Roadmap, MVP Readiness, AGENTS source-provenance rule, this Linear issue/comments, and `progress/GET-204.md` aligned.

Before an authorized commit, run relevant art/layout validators, lint, build, tests, coverage above the project floor, and the guided Level 0 playtest; inspect the visual evidence and diff. Technical success cannot substitute for visual acceptance.

## T5 — Hidzu Corporation identity and graphic-surveillance-noir world art

- **Label:** Improvement
- **Initial state:** Todo
- **Parent:** GET-139

### Why this ticket exists

An unchanged asset kit can provide coherent architecture but cannot by itself express The Getaway's identity. On the requester-accepted, committed same-master T4 four-block city, T5 adds the second visual layer: a consistent Hidzu Corporation-controlled Tokyo where corporate safety, identity scoring, logistics, public information, and surveillance are understandable through repeated visual grammar. It corrects the previous drift into fantasy Neo, generic neon cyberpunk, broad cyan glow, darkness, and atmospheric clutter without replacing the accepted source geometry.

### Player promise

The same technically validated city now receives a Hidzu Corporation treatment. The player can read where identity is checked, which devices are active/connected, how cameras relate to terminals, where public service becomes controlled access, and when danger is merely ambient versus confirmed. The locked target is blue-black, wet, reflective surveillance noir: cold institutional surfaces and cool ambient fill dominate, localized sodium practicals create motivated contrast, cyan is scarce active technology, and crimson is real threat. Streets and hard surfaces carry believable rain-darkened material response and restrained reflections rather than a beige/ochre wash. The protagonist/objective remain stronger than ambience, and dusk, blue hour, and curfew feel distinct while remaining one city. The ticket is visually unaccepted until the requester approves a live side-by-side comparison against the registered references.

### Starting state

- Earlier T4/T5 offline compositions and the former three-gate/full-city plan are historical evidence only. GET-204's named-KitBash four-block Blender source was requester-accepted and committed at `2206f8b`. GET-205 commit `c1f7cda` is a recoverable technical publication baseline only: on `2026-08-09` the requester rejected its warm, beige/ochre, comparatively dry and flat grade as materially different from the locked target. Preserve the accepted four-block geometry, topology, anchors, camera, KitBash provenance, and runtime publication path while rebuilding materials, lighting, wetness, reflections, atmosphere, and Hidzu integration from the authored Blender source.
- Reference authority is explicit: `canvas-quality-target.png` owns blue-black wet material, lighting, and reflection quality; `kitbash-reference2-blend-concept-v1.png` owns the compact four-block source/composition relationship and the authoritative human/door/sidewalk/street/building proportions without becoming production geometry; `street-play-target.png` (Reference 2) owns normal-camera intimacy, inhabited social staging, surveillance readability, and HUD/world relationship but not actor size. The dense-city reference is overview-density guidance only.
- Hidzu Corporation's institutional role is canonical, but Takahiro's formal title, district name, Japanese diegetic language, and the wider safehouse exterior remain explicit OPEN items. `GDR-ART-013` resolves the environment crossfade at 750 ms without resolving actor tint under `OPEN-ART-005`.
- T5 may change materials, signage, lighting, civic/surveillance props, atmosphere, and flattened derivatives; it may not silently change topology, required anchors, device mechanics, or route viability.

### Complete player flow

The player leaves the safehouse into a district that first reads as ordered civic infrastructure. Lira's area communicates the human edge of identity exclusion. The route toward Naila, Brant, and the logistics site retains GET-214's existing non-emissive route signage and public-screen language; T5 adds no cyan wayfinding, route-marker, or street-edge lighting. Before curfew, delivery activity and queues make public blending plausible while cameras remain legible. During blue hour and curfew, public messaging, practical lights, reduced activity, and verifier presence shift the mood without hiding walkable space. The camera terminal, cache terminal, transit terminal, cameras, hiding/blending structures, entrances, manifest/cache, and outbound path each read through their proper fiction and knowledge state.

### System rules and state transitions

The T5 lifecycle is `COMMITTED_TECHNICAL_BASELINE → DOCUMENTATION_ENTRY_COMMIT → BLUE_HOUR_HERO_APPROVAL → THREE_STATE_EXPORT → LIVE_SIDE_BY_SIDE_ACCEPTANCE → ACCEPTANCE_COMMIT → COMMITTED_BUILD_VERIFICATION`. T5 consumes but does not redefine T3/T4 gameplay semantics. Dusk, blue-hour, and curfew are three Cycles-baked people-free asset sets from one immutable geometry/camera registration. Blue hour becomes authoritative at 20:00 and curfew at 22:00; each target prefetches ten authored minutes before its boundary and replaces the prior complete set through a 750 ms crossfade only after every target texture is ready. Active technology cyan appears on declared Hidzu Corporation devices/connections and a small named set of non-directional building-integrated accents. Cyan wayfinding, route-marker/street-edge lights, broad architectural neon, and multiplicative full-city phase tint are prohibited. Amber remains a localized practical/objective/time accent rather than the world grade. Crimson appears only for confirmed danger/Pursuit. Neutral information uses muted teal/bone. Lighting remains motivated by visible sources with consistent upper-left direction.

Every placed or modified object must support navigation, surveillance, hiding/blending, line-of-sight cover, hazard, entrance, contact, mission interaction, safehouse, objective readability, or required civic atmosphere. Public screens and feed surfaces communicate authored Hidzu Corporation claims but never leak undiscovered operational facts.

### Internal milestones and proof gates

1. Register the reference roles above and convert them into explicit value, palette, wet-material, reflection, silhouette, surveillance, locked-blend proportion, UI-adjacency, and rejection criteria. Measure the `1440×900` protagonist alpha body separately from shadow, selection ring, and George.
2. Define Hidzu Corporation environmental grammar: identity frames, cameras, connected-device markers, terminals, checkpoint language, public screens, propaganda, non-directional building-integrated accents, and warnings. Preserve existing non-emissive route signage; add no T5 wayfinding fixture.
3. Derive a versioned v4 scene from the accepted v3 master and render one blue-hour hero only in Cycles Metal: `1440×900`, public-crossing centre `{29,22}`, zoom `2.9`, 45° azimuth, 30° elevation. Present `reference | candidate | delta notes` plus a 200% road/reflection crop. No `6400×3600` master, cutout matrix, or runtime state is produced before requester approval of that frame.
4. After hero approval, author aligned dusk, blue-hour, and curfew people-free lighting/material states. Every state retains the wet blue-black baseline: dusk is least dark with the broadest localized window/practical activity; blue hour owns the approved reference balance; curfew reduces public amber and strengthens declared surveillance/device sources plus sparse red threat accents. T10B later owns `ActorLightRegion` metadata and runtime actor tinting.
5. Remove only the two vent-ring assemblies and WAIT/REST rooftop HVAC clutter through recorded connected-component fingerprints containing source object/material, bounds, vertex count, and hash; never delete an entire material-split object. Preserve every building transform, footprint, collision region, anchor, route, and source-provenance record.
6. Publish the three state/profile matrix through complete staging and validation before atomic replacement. Advance directly to manifest schema v2: keep placement/depth metadata immutable, nest `path`, `sha256`, and `bytes` under each asset's three states, add state-specific `source.stablePlates` hashes, and expose a typed phase resolver without parallel v1 support. Extend runtime with target-state prefetch, generation-token stale-request rejection, 750 ms complete-set crossfade, observable failure, and old-GameObject/texture disposal. Retire the full-city tint/atmosphere overlay as the world-color authority. Cap each state at 115% of the current compressed payload—approximately 3.58 MB desktop and 1.22 MB mobile—and report total transfer, one-set decoded residency, and two-set transition peak.
7. Inspect normal play, Observation, Suspicious/Pursuit presentation hooks, minimum zoom, both profiles, state transitions, and every fixed viewport. Present the live game side by side with the exact registered references and obtain requester acceptance before T6/T9/T10 final visual integration.

### Content requirements

Produce a visual reference board, palette/value guide, wet material set, practical-light inventory with stable region candidates, Hidzu Corporation logo/device/non-directional architectural-accent grammar, propaganda/public-screen content templates, camera/terminal state treatments, three aligned schedule-state exports, semantic theme tokens, component-removal fingerprints, and asset provenance for all committed derivatives. Existing non-emissive route signage remains GET-214-owned; T5 adds no wayfinding fixture. Author enough public messaging to express safety, efficiency, transit, identity continuity, civic sentiment, suppression, and controlled access without implying unresolved facts.

### World/UI/audio/George feedback

World feedback must prioritize current objective/action, actor, observation/threat, traversal/entrance, architecture, then ambience. Camera coverage uses truthful restrained geometry and never paints buildings broadly cyan. The future HUD/overlays use matching matte ink, angular edges, fine bone/brass rules, restrained shadows, and semantic colors, but T9 owns their implementation. Audio anchors correspond to visible cameras, Needle's route, terminals, screens, curfew sources, and entrances. George's AR presentation is subordinate, private, and nonphysical; T6/T9 own the asset and behavior.

### Failure and recovery

Visual acceptance fails on a warm beige/ochre world grade, dry or flat roads, weak material depth, missing wet reflections, post-process-only recoloring, generic neon cyberpunk, fantasy ornament, crushed curfew blacks, impossible lights, broad glow, large translucent buildings, unmotivated fog, soft upscaled composites, slab bases, repeated plates, unreadable devices, hidden objectives, or decorative clutter. Correct the authored Blender materials, lighting, atmosphere, and export layers without reopening accepted topology unless measured gameplay evidence proves a real layout defect. Missing/invalid initial-state T5 art fails visibly with an observable diagnostic rather than showing a partial set or silently substituting another world. A transition failure discards the partial target, retains the current complete state, diagnoses observably, and retries at the next synchronization or reload. The explicit `visualTreatment=get204-1` route remains a deliberate diagnostic choice, never an automatic production fallback.

### Explicit exclusions

- No synthetic replacement of Neo Tokyo geometry or per-building collage.
- No gameplay detection, network transitions, dialogue, facts, or objective logic.
- No raw licensed geometry or untracked production truth.
- No fantasy-Neo costume/world language, generic neon abundance, broad cyan/crimson ambience, or city-wide transparency.
- No cyan wayfinding, route-marker/street-edge light source, floating panel, oversized billboard, or multiplicative tint presented as authored state lighting.
- No public-feed posting, messaging, social simulation, procedural propaganda, or hidden fact delivery.
- No clutter added solely to make the city look busy.

### Dependencies and OPEN blockers

Depends on a requester-accepted and committed GET-204 same-master live four-block candidate. Blocks T6, T9, T10, and T10B final visual integration. Critical acceptance blocker is `OPEN-NAR-015`. High acceptance blockers are `OPEN-NAR-003`, `OPEN-NAR-013`, `OPEN-NAR-014`, `OPEN-LAYOUT-004`, and the color-independent visual-state portion of `OPEN-ACC-001`. `GDR-ART-013` resolves the former `OPEN-ART-004` environment-state/crossfade seam; actor-light transition behavior remains separate under `OPEN-ART-005`. Neo Tokyo 2 production use is approved; raw vendor source remains outside Git. Recorded recommendations may be trialed reversibly for live comparison; they remain non-final while open. T5 provides authored practical-light regions but does not own actor tint behavior or `OPEN-ART-005`. T5 does not own `OPEN-PERF-001`, but its export must remain measurable against the T4/T10 provisional or approved budget.

### Canonical decisions/spec sections

Implements `GDR-SET-003`, `GDR-SET-005`, `GDR-SOC-001`, `GDR-ART-001`, `GDR-ART-002`, `GDR-ART-003`, `GDR-ART-012`, `GDR-ART-013`, `GDR-ART-014`, `GDR-REM-011`, `GDR-SUP-004`, and the outdoor boundary in `GDR-PROD-004`. Canonical detail is in [[20 Setting & Worldbuilding]], [[30 Art Direction (MVP)]], [[31 GET-204 Visual Rebuild Quality Contract]], [[80 Day-Night Cycle]], [[35 Narrative Alignment]], [[47 Social Feed]], [[03 Lore/Plot Bible]] sections 3, 8, 11, and 12, and [[04 Engineering/Roadmap]] Gate 5.

### Human-play acceptance

Fixed captures at 1280×720, 1440×900, 1920×1080, and automatic mobile 390×844 must cover safehouse, dusk street, each contact area, public route, curfew route, camera/terminal relationship, cache/manifest, Suspicious/Pursuit hooks, clean-world/current-HUD frames, overview, both profiles, three known occlusion sites, actor-foot stability, and the 0.60→3.25 zoom sweep. At 1440×900, include a fixed aligned dusk/blue-hour/curfew strip and direct side-by-side crops against the locked KitBash blend and `canvas-quality-target.png`, plus a Reference 2 comparison for camera/social/HUD treatment only. The normal frame must show approximately `68–80 px` of protagonist alpha body, exclude shadow/ring/George from that measure, preserve one shared human base scale, and retain the blend's door/sidewalk/street/building relationship. Prove initial state, 19:50/21:50 prefetch, 20:00/22:00 boundaries, direct jumps, Restart Attempt/hydration rewind, stale completion, load failure, 750 ms crossfade, post-transition GameObject/texture disposal, and one-/two-set residency without black frames or partial art. A reviewer can distinguish objective, neutral civic system, active technology, caution, and confirmed danger without relying on color alone. Wet roads, cool blue-black ambient values, crisp restrained reflections, actors/placeholders, entrances, and device states remain readable in all states. The requester must agree the live scene is Hidzu Corporation-controlled Tokyo and materially approaches the registered references—not a warm/dry kit demo, fantasy cyberpunk collage, oversized-character diorama, or technically valid substitute.

### Documentation and validation obligations

Update Art Direction with the registered reference/rubric and implemented conventions, the asset/art manifest, Architecture only for realized theme/layer data flow, MVP Readiness evidence, and `progress/GET-205.md`. Add a fixed-frame reference-delta validator with versioned shadow, road, amber, and cyan masks. Against the supplied reference require shadow mean Lab `b* < 0` and no more than `+2` warmer, amber fraction no greater than `115%`, cyan/emissive fraction at least `85%`, road specular coverage at least `85%`, and luminance `p95–p05` spread at least `90%`; freeze approved per-state frames as later regression baselines. Validate source/provenance, semantic tokens, immutable registration, practical-light sources, safehouse component fingerprints, payload/decode budgets, color-independent cues after `OPEN-ACC-001`, fixed captures, and the `GDR-ART-013` runtime transition. Use live inspected frames as the gate; validators and image-generation counts are supporting evidence only.

## T6 — Grounded actors, portraits, and entry-flow presentation

- **Label:** Improvement
- **Initial state:** Todo
- **Parent:** GET-139

### Why this ticket exists

The prior characters were tiny or stiff against monumental buildings and drifted into fantasy-operative styling. Actor sheets, portraits, cover-select, dialogue identity, and world scale also came from inconsistent sources. T6 establishes one grounded cast and one manifest contract so the protagonist, contacts, Hidzu Corporation security, civilians, Takahiro's broadcast image, and George's private AR presence belong to the same modern surveillance dystopia.

### Player promise

The player chooses one of four distinct contemporary protagonist appearances and recognizes that same person in the world and all approved identity surfaces. Lira, Naila, Brant, security, and civilian/service roles are readable without permanent labels. Bodies remain grounded, directional, and proportionate at the accepted close normal frame and composed manual overview through dusk and curfew. Portrait/world identity stays coherent, and nobody looks like a fantasy commando or tactical enemy token.

### Starting state

- T5 must first provide the requester-accepted blue-black, wet, reflective GET-205 rebake. The current GET-205 publication and committed T6 actor batch are recoverable technical baselines, not the immutable live comparison context. T3 supplies authoritative actor anchors and T7A supplies current cover/condition state when integrated.
- Exactly twelve world actor sets are required: four protagonist presets, Lira, Naila, Brant, two Hidzu Corporation security archetypes, and three civilian archetypes.
- The matrix is 64×96 frames, eight directions, four frames, and `idle`/`move`/`interact`; attack is not required.
- GDR-ART-014 resolves actor proportion: keep `64×96`, origin `(0.50, 0.92)`, alpha height `54–64` px, and one shared base scale for all twelve actors. After GET-205 fixes the camera/building relationship, derive that scalar so the `1440×900` normal frame shows approximately `68–80 px` of protagonist alpha body, excluding shadow, selection ring, and George, and visibly matches the locked blend's human/door/sidewalk/street/building relationship. Earlier `1.15`, `1.30`, `0.64`, and committed `0.96` values are evidence only; no zoom compensation, protagonist-only multiplier, or arbitrary per-scene scaling is allowed.
- T6 owns reusable security/civilian visual archetypes, not names, biographies, counts, schedules, or authoritative placements. Lira's unresolved identity/relationship is outside T6; her art may communicate only the approved medical-supplies role.
- George hardware, Naila/Brant biography cues, entry-flow ownership, actor scale, and shipping budgets remain explicit OPEN items. `OPEN-PERF-001` has no numeric baseline, so T6 may record measurements but cannot pass shipping-performance acceptance.

### Complete player flow

New Game presents the four authored covers, one playable and three visibly disabled; confirming the playable cover persists its appearance ID. In the safehouse and district, the protagonist's idle, facing, movement, and interactions align with their ground anchor. Lira, Naila, and Brant appear as the same identities used in dialogue/debrief presentation. Civilians visually support delivery activity, queues, waiting, and service roles; security reads as institutional verification staff rather than a combat class. At curfew and during surveillance transitions, actor value and silhouettes remain legible. George appears as a private near-character AR companion and in his HUD identity without becoming a physical party member.

### System rules and state transitions

Each world actor has a stable actor ID, ownership (`player`, `contact`, `security`, or `civilian`), sprite-set ID, 64×96 frame contract, four frames per animation, eight direction keys, shared origin/foot anchor, runtime scale, portrait key, and explicit fallback. Presentation mirrors authoritative position, facing, locomotion, interaction, dialogue, and schedule state; it never owns collision, detection, mission state, or build effects.

The protagonist appearance transitions once from unselected to one authored preset at confirmation and persists through autosave, Restart Attempt, debrief, and compatible continuation. World actors display exactly one of `idle`, `move`, or `interact`. Portrait selection uses the same stable identity. Missing required matrices fail production acceptance rather than silently substituting fantasy/attack assets.

### Internal milestones and proof gates

1. Resolve biographies/hardware boundaries needed for visual references without authoring final dialogue.
2. Reuse the locked blend as the shared proportion reference, then produce the costume, silhouette, palette, portrait, and anchor references tied to the accepted GET-205 world treatment. Derive one shared actor scalar only after the camera/export is fixed.
3. Create four protagonist sets, then prove cover-select and world persistence with placeholder shell integration.
4. Create Lira/Naila/Brant; prove world/portrait identity continuity.
5. Create two security and three civilian sets; prove role readability in public/curfew contexts.
6. Create twelve matching `256×256` identity portraits, one `256×256` Takahiro broadcast portrait, and one separately registered `256×256` transparent George AR idle/base asset; validate crop/safe area, provenance/hash/bytes, and neutral fallback.
7. Validate every 8×3×4 matrix, direction order, origin, foot-anchor stability within two pixels, frame occupancy, depth, and fallback metadata.
8. Capture all identities and all twelve portraits plus Takahiro and George at the accepted close normal frame and composed overview across dusk, blue hour, and curfew. At `1440×900`, record visible-alpha height and the surrounding door/sidewalk/street relationship against the locked blend. T6 proves its neutral selection seam and live protagonist/contact anchors; Character, dialogue, Restart Attempt/debrief, and schedules remain deferred/not checked for T7/T9/T10.

### Content requirements

Maintain actor/portrait manifests, stable preset/actor IDs, source references, asset-generation or painting recipes, frame normalization rules, direction/state/frame naming, anchors, scales, occupancy bounds, depth policy, neutral fallback policy, path safety, SHA-256, compressed/decoded byte metrics, and provenance. Identity portraits are `256×256`, contain one identity with face/shoulders inside the central 80% safe area, and bake no localized text. Clothing must reflect expatriates, contacts, service/public civilians, and corporate security without weapons, fantasy armor, package colors, or unexplained military competence.

### World/UI/audio/George feedback

Facing, foot contact, locomotion, and interaction must be readable against the accepted GET-205 production city without labels or x-ray effects. Cover-select and Character screen show the selected appearance once T9's shell is integrated. Dialogue/debrief identity matches the world actor. Footsteps/interactions emit semantic hooks for T10 audio but do not drive state. George's T6 base art is private, restrained, and visually distinct from a physical actor; proof places it near the protagonist's upper-right at `28–36` screen pixels and suppresses it while a full overlay owns focus, but T9 owns final states, placement, prompts, and suppression. It never owns collision/occlusion/depth or implies that other characters see him.

### Failure and recovery

Production acceptance fails for missing matrices, anchor drift, sliding feet, mirrored/wrong direction, roof placement, scale mismatch, silhouette ambiguity, fantasy styling, portrait mismatch, unreadable curfew values, or stale appearance after Restart Attempt/New Game. Correct the asset/manifest/integration; do not move gameplay anchors or add labels. Restart Attempt restores authoritative actor state and keeps the selected protagonist identity without preserving post-departure dialogue, pursuit, or animation state.

### Explicit exclusions

- No attack animations, weapons, combat silhouettes, fixed Trace/Operative, backgrounds, packages, or appearance-based mechanics.
- No combinatorial body-part creator beyond four authored presets.
- No permanent labels, arbitrary per-scene scaling, protagonist-only enlargement, zoom counter-scaling, giant sprites, or art-owned collision/detection.
- No final dialogue prose, schedules, surveillance mechanics, HUD shell, or mission integration.
- No invented Lira/Naila/Brant biography or George hardware before its OPEN decision.

### Dependencies and OPEN blockers

Depends on the requester-accepted, validated, and committed T5 production city; consumes T3 anchors and later T7/T9 identity state/surfaces. Blocks T10 and T10B final presentation. T6 owns stable actor origins/foot anchors; T10B alone owns light-region sampling/tint. High acceptance blockers are `OPEN-NAR-009`, `OPEN-NAR-010`, `OPEN-NAR-011`, `OPEN-UI-002`, `OPEN-ART-003`, and `OPEN-PERF-001`. Their recommendations may be trialed provisionally through replaceable manifests/assets and cannot be called accepted while open. `OPEN-UI-002` must preserve the Roadmap split: T6 owns appearance/George assets; T9 owns shell/layout.

### Canonical decisions/spec sections

Implements `GDR-PC-002`, `GDR-GEO-001`, `GDR-ART-001`, `GDR-ART-005`, `GDR-REM-011`, and `GDR-SUP-003`. Canonical detail is in [[48 Actors & Portraits]], [[30 Art Direction (MVP)]] actor rules, [[40 George (AI Companion)]], [[92 Character, Covers, Abilities & Research]] appearance contract, [[04 Engineering/Architecture]] Art/Actors contract, and [[04 Engineering/Roadmap]] Gate 6.

### Human-play acceptance

For the current T6 gate, select every protagonist preset through the neutral appearance seam across fresh runs and verify it in the safehouse world; final Character/dialogue/Restart Attempt/debrief persistence remains deferred to T7/T9/T10. Meet Lira, Naila, and Brant and distinguish their world/portrait identities without labels. Inspect both reusable security and all three civilian visual archetypes without treating them as authoritative placed/scheduled actors. Inspect all twelve portraits, Takahiro, and George. At 1280×720, 1440×900, and 1920×1080, compare the accepted GET-205 normal and overview framings across dusk, blue hour, and curfew for pixel-derived foot stability within two pixels, correct facing/state, human-scale proportions, no roof placement, and readable silhouettes. Missing/corrupt assets must produce an observable neutral diagnostic and fail the production gate; fallback never counts as the production matrix. GET-204 or greybox fallback captures do not satisfy the current production-city gate.

### Documentation and validation obligations

Update actor/portrait inventories, Art Direction, implemented manifest ownership in Architecture, MVP Readiness, and `progress/GET-206.md`. Run sprite-matrix, pixel-derived anchor/occupancy, direction, frame, scale, portrait, provenance/hash/path, fallback/fault-injection, and measured-load validators; run `yarn sprites:validate`; inspect live captures at every required state and viewport. Record exact counts, requests, compressed bytes, estimated decoded texture bytes, cold-load timing, and observed FPS without claiming a shipping ceiling while `OPEN-PERF-001` is open. Preserve one authoritative foot anchor per actor for T10B, but do not add lighting-driven detection/movement or Health injury presentation. After visual acceptance, run the AGENTS closeout suite and guided AI regression.

## T7 — Protagonist RPG identity, progression, Health, and Paranoia

> **Superseded scope (2026-08-07):** this section records the delivered creation-state contract, kept as In Review evidence. The numeric model it describes — Health, attributes, skills, XP, levels, and arithmetic checks — is superseded by `GDR-RPG-008`/`GDR-RPG-009`/`GDR-RPG-010`, `GDR-PAR-008`/`GDR-PAR-009`, `GDR-HLT-004`, and `GDR-PC-006`. The current condition/ability scope is **T7A (GET-216)**. Nothing below is current MVP intent.

- **Label:** Feature
- **Initial state:** Todo
- **Parent:** GET-139

### Why this ticket exists

The rewrite removed the RPG foundation the requester had invested in and replaced it with a fixed Operative plus route packages. T7 restores a focused, persistent protagonist build and the two consequential resources that support the game's themes. It owns identity/build payload, deterministic checks, Character screen, authored XP/level-up, Health, Paranoia, and their save/Restart Attempt behavior. It does not recreate a perk forest, equipment game, combat stats, or package selection.

### Player promise

In under two minutes, the player creates a callsign, selects one of four appearances, and makes a small set of meaningful capability choices. T7 establishes and visibly explains why a Social/Mental protagonist and a Technical/Evasion protagonist resolve the same authored requirement differently; T8–T10 then place those capabilities into dialogue, evidence, terminals, hiding, and escape while keeping both builds viable. T7 makes requirements/results deterministic and explainable, makes Paranoia and authored Health loss consequential without an injury simulation, and establishes safehouse/debrief allocation. T10 owns the normal mission milestones that earn the first level-up and demonstrate continuation into Miami.

### Starting state

- T3 supplies new-schema, autosave, Restart Attempt, safehouse, time, pause, and runtime foundations.
- T6 supplies final appearance assets when available, but T7 must preserve the four stable appearance IDs and may use validated temporary presentation until integration.
- New runs begin before Level 0 in character creation, then Health 100 and Paranoia 0 in the safehouse.
- Exact Level 0 check requirements, XP threshold/awards, derived-stat disposition, Health costs, Paranoia event amounts/rates, and smaller recovery amounts remain T7 acceptance decisions; their recorded `OPEN-*` recommendations may be trialed through replaceable authored data.
- The reversible `OPEN-RPG-002` recommendation trials a `100 XP` Level 2 threshold with one-shot `50 XP` awards for explicit medkit return and outbound-transit validation. It remains provisional and cannot be described as accepted tuning.
- Callsign normalization/display validation remains `OPEN-RPG-005`; its Unicode-safe 1–24-code-point recommendation may be trialed reversibly and must not be described as accepted while open.

### Complete player flow

1. Enter callsign; choose one of four appearances.
2. Allocate four additional points across Physical, Mental, Social, and Technical, each starting at 1 with creation cap 3 and long-term cap 5.
3. Allocate six points across Stealth, Evasion, Awareness, Composure, Insight, Influence, Systems, and OpSec, each starting at 0 with creation cap 2 and long-term cap 5.
4. Review practical Level 0 meanings and confirm a valid build. Persist `PlayerIdentity` separately from `PlayerBuild`.
5. Expose one reusable exact `Level0CheckBreakdown`. T9A mounts the same deterministic math as `preview` before every checked choice and `result` after selection; every nonterminal catalog failure has a real declared worse path.
6. Apply visible authored Health or Paranoia effects; show current resources continuously and explain every change.
7. Award each authored XP milestone once. When the threshold is reached, hold progression pending until safehouse/debrief.
8. Allocate two skill points per level and one attribute point every third level; enforce caps and persist the result.

### System rules and state transitions

Check resolution is `attribute + skill − Paranoia penalty + authored situational modifier ≥ visible requirement`; each check names one attribute and one skill. A designated fact may reveal, lower, or guarantee only its declared outcome. No RNG, hidden percentage, reroll, critical result, or global fact bonus exists. Locked options remain visible with exact reasons unless their existence would itself leak unknown information.

Paranoia is 0–100 and always named `Paranoia`: 0–39 gives no penalty, 40–69 gives −1, 70–89 gives −2, 90–99 gives −3, and 100 causes fatal medical collapse. It never creates false clues/UI. Curfew causes no passive gain; walking/waiting outside causes no passive recovery. Health is 0–100, changes only through authored physical consequences, and fails at 0. Rest costs 30 minutes, restores Health to 100, and removes 40 Paranoia. Health never creates an injury state, limp, movement/detection penalty, or civilian reaction. Exact other effects use approved values or explicitly recorded provisional authored data until live review resolves them.

### Internal milestones and proof gates

1. Define/validate `PlayerIdentity`, `PlayerBuild`, creation draft states, persistence, and retired-save rejection.
2. Implement creation budgets/caps, callsign/preset validation, practical explanations, and summary.
3. Implement the pure check resolver, reusable preview/result breakdown data, fact rules, validated nonfatal fail-forward contract, and duplicate/reroll protection using approved values or the explicitly recorded reversible recommendations from `OPEN-RPG-001` and `OPEN-RPG-004`.
4. Restore a Character screen containing only identity, level/XP, four attributes, eight skills, Health, Paranoia, unspent points, important facts, and long-term consequences.
5. Implement Health/Paranoia event ledgers, 40/70/90 announcement history, fatal outcomes, Rest integration, and baseline restoration with tuning values isolated in approved or provisional authored data.
6. Implement idempotent milestone XP and safehouse/debrief allocation using the approved or provisionally recorded `OPEN-RPG-002` table.
7. Prove two deliberately different player-created builds against the same deterministic catalog entries, with the reusable check breakdown showing exact math. Preserve typed effect seams for dialogue, manifest, terminal/trace, recovery, and interception; T8–T10 own their normal-control mission integration and must re-prove the practical differences there.

### Content requirements

Provide localized callsign/allocation validation; four appearance IDs; concrete descriptions for all attributes/skills; two viable sample builds; a complete Level 0 check catalog; authored requirement, modifier, fact, success, and real fail-forward data; Health/Paranoia source and recovery event records; threshold-announcement history; milestone XP IDs/thresholds; Character-screen fact/consequence summaries; and new-schema persistence validation. Each resource change stores stable source, amount, time, before/after, feedback, localization, and attempt treatment.

### World/UI/audio/George feedback

The protagonist HUD lane always shows callsign where appropriate, level/XP compactly, Health, and Paranoia. Character creation and Character screen explain capability in practical language, not packages. Check UI lists attribute, skill, requirement, Paranoia penalty, fact/modifier, final total, and result. Threshold/resource/progression changes have concise world/HUD/text and semantic audio hooks. George may explain verified build/resource state and consequences but cannot recommend a canonical build, spend points, heal, lower stress, reveal hidden checks, or choose an option.

### Failure and recovery

Health 0 produces `failure.health`; Paranoia 100 produces `failure.paranoia`; both name the contributing authored source. Failed nonterminal checks commit their declared fail-forward result and cannot be rerolled by reopening; only the final failed capture escape may be fatal. Restart Attempt restores identity, build, level, XP, unspent points, Health, Paranoia, facts, and relevant state from `OperationAttemptBaseline`. New Game clears them. Rewrite/stale development saves are rejected rather than guessed into current fields.

### Explicit exclusions

- No fixed Trace/Operative, backgrounds, Ghost/Wire/Force, perk tree, combat skill/stat, equipment grid, faction meter, crafting, encumbrance, or automatic allocation.
- No RNG, hidden roll, generic intel bonus, XP grinding, dialogue-exhaustion XP, kill XP, or repeatable milestone.
- No passive damage, passive Health regeneration, consumable healing, injury state, limp, Health-based movement/detection/civilian reaction, passive curfew Paranoia, outdoor decay, hallucination, or dishonest UI.
- No implementation of surveillance mechanics, dialogue graph/HUD shell, or final authored mission content owned by T8–T10.

### Dependencies and OPEN blockers

Depends on T3; blocks T8, T9, and T10. Critical acceptance blockers are `OPEN-NAR-001`, `OPEN-RPG-001`, `OPEN-RPG-002`, `OPEN-RPG-004`, `OPEN-HLT-001`, and `OPEN-PAR-001`. High acceptance blockers are `OPEN-RPG-003` and `OPEN-RPG-005`. Recorded recommendations may be trialed provisionally through authored data/constants with deterministic tests and rollback seams; unresolved values prevent final acceptance, not ticket start. T7 owns RPG/resource payload and behavior; T3/T3A own persistence infrastructure/renaming; T8A supplies evidence-gated surveillance sources; T9A presents exact checks/failures; T10A authors grounding/threshold content.

### Canonical decisions/spec sections

Implements `GDR-PC-002`, `GDR-PC-003`, `GDR-PC-005`, `GDR-MIS-008`, `GDR-RPG-001` through `GDR-RPG-007`, `GDR-HLT-001` through `GDR-HLT-003`, `GDR-PAR-001` through `GDR-PAR-007`, `GDR-TIME-003`, `GDR-SUR-005`, `GDR-ESC-001`, `GDR-FACT-001`, `GDR-FACT-002`, `GDR-REM-001`, `GDR-REM-002`, and `GDR-REM-006`.

Canonical detail is in [[92 Character, Covers, Abilities & Research]], [[43 Failure, Surrender & Recovery]], [[60 Paranoia]], [[50 Combat]], [[44 Safehouse, Save & Restart Attempt]], [[13 Level 0 Content and State Matrix]] sections 4–5 and 10–12, [[04 Engineering/Architecture]] sections 5, 10, and 12, and [[04 Engineering/Roadmap]] Gate 7.

### Delivery acceptance and deferred human-play gates

GET-207's delivery gate separates player-facing T7 controls from focused domain/persistence evidence. It does not invent mission transitions merely to expose foundations. Authored XP triggers, departure, dialogue, manifest, terminal/trace, pursuit recovery, interception, and complete-route differences are normal-control integration owned jointly with T8–T10 and must be reported as deferred—not simulated or claimed complete by T7 fixtures.

- **T7 player-facing evidence:** create valid and invalid builds, confirm budgets/caps, reach safehouse in at most two minutes without package knowledge, open/close the paused Character panel, see truthful Health/Paranoia/XP/build state, and round-trip the exact player-created run through Continue.
- **T7 player-facing allocation seam:** with a pending authored level supplied through the canonical action seam, activate and allocate two skill points through Character controls at an allowed safehouse/debrief context; outside that context the same controls are disabled with a reason.
- **T7 reusable presentation evidence:** create Social/Mental and Technical/Evasion builds through New Game and render different exact results for the same catalog requirement with the reusable check-breakdown component. This is component evidence until T9 mounts it in a normal mission choice.
- **T7 focused resolver/persistence evidence:** verify exact before/after math, attempt identity, anti-reroll behavior, designated binary-fact effects, dedicated Cold Iron state validation, and recomputation during hydration.
- **T7 focused resource/failure/Restart Attempt evidence:** cross and recover across every Paranoia threshold, verify exact penalties/feedback, prove no passive curfew mutation, reach Health 0 and Paranoia 100 with exact causes/source IDs, and restore exact departure state. Normal departure remains deferred until Lira/preparation content exists.
- **T7 focused progression evidence:** award each provisional milestone once, test third-level attribute logic, caps, exact save/reload, Restart Attempt, and New Game. T10 owns normal medkit/transit triggers.
- **Deferred integrated human-play:** T8–T10 must re-prove practical dialogue, recognition, terminal/trace, recovery, interception, both route variants, and equal completion viability through normal mission controls.

### Documentation and validation obligations

Update Character/Health/Paranoia specs only for approved rules or clearly labelled provisional tables, Architecture for implemented state/data flow, MVP Readiness, and `progress/GET-207.md`. Add unit tests for creation validation, pure checks, fact effects, penalties, Health/Paranoia events, fatal outcomes, XP idempotency, allocation/caps, save hydration, Restart Attempt, and retired-schema rejection; component tests for creation/Character/check explanations. After T7 player-facing proof, run the AGENTS closeout suite and guided AI regression. Report later mission integrations as deferred and never treat a fixture, direct store dispatch, or domain test as human-play evidence.

## T8 — Surveillance, security, civilians, hiding, drone, and noncombat escape

- **Label:** Feature
- **Initial state:** Todo
- **Parent:** GET-139

### Why this ticket exists

Surveillance, Paranoia, hiding, and escape are the game rather than a prelude to combat. The existing work never produced a fair, recoverable network: detection jumped between states, visual cones did not reliably describe detection, pursuers could behave omnisciently, stealth became a toggle, and failure opened tactical combat or AutoBattle. T8 owns the reusable noncombat pressure loop shared by cameras, Needle, human security, authored civilian contexts, terminals, hiding, blending, last-known-position search, interception, and return to safety. Its focused T8A child owns the approved rule-break attribution, camera-use limit/history, exact coverage presentation, recognition reset, and civilian presentation. T10 authors mission encounters without redefining those mechanics.

### Player promise

The player can look at a street and understand who or what is watching, why concern exists, what the network last knows, and which credible place or social context might break confirmation. Ordinary public visibility is harmless; concern begins only when a real observer sees an approved rule break. Suspicious creates tense but recoverable verification, Pursuit follows evidence rather than hidden coordinates, and returning fully to Clear resets recognition. Technical preparation can use the one connected camera group once and leaves persistent clean/traced history. If caught, the player's build and facts support a short deterministic escape choice—not a second combat game.

### Starting state

- T3 provides layout anchors, shared geometry, observation, movement, interaction, time/pause, devices, schedules, and persistence infrastructure.
- T7A provides deterministic gates, Paranoia tiers, ability state, facts seam, and failure payloads.
- T4/T5 provide technically validated, committed provisional visual geometry and surveillance grammar; requester acceptance remains their final visual gate. T6 provides security/civilian actors.
- Network starts `Clear`, with no last-known position and only discovered devices exposed to player knowledge.
- Exact camera rates, confirmation rules, search timings, loop duration, civilian/security schedules, Paranoia events, and context placement remain T8 acceptance decisions; their recorded `OPEN-*` recommendations may be trialed through replaceable authored data.

### Complete player flow

1. Discover a camera through ordinary sight, contact knowledge, or authored interaction; normal play shows subtle light/reflection warning while Observation shows exact discovered coverage.
2. Cross an ordinary public lane in view and remain `Clear`. A current observer must then witness a restricted-area breach, protected interaction, medkit removal, failed verification, or detected camera-feed change before concern/Paranoia can begin.
3. With paired valid visibility and rule-break evidence, enter `Suspicious`, record source and last-known position, communicate the attributable Paranoia source/rate, focus nearby connected cameras, and dispatch Needle when appropriate.
4. Break current observation, move away from last-known position, and enter a credible authored hiding or blending context. Invalid entry explains direct observation, range, schedule, occupancy, or context requirements.
5. If valid evidence continues, a checkpoint fails, or Needle verifies, enter `Pursuit`. Security and Needle investigate network evidence and last-known positions, never secret live coordinates.
6. Break sight, change direction, and use an authored context. Successful escape transitions `Pursuit → Suspicious → Clear`, clears recognition, and may grant the first qualifying difficult-escape −5 Paranoia relief once.
7. At the connected terminal, a qualified build may use the single mapped camera group once. Its active loop may expire, but `clean` or `traced` persists until Restart Attempt; a detected feed change is a rule-break source.
8. If intercepted, present only supported Influence/Insight, Composure, Evasion, or Physical escape options with exact previewed requirements/costs. Success returns to real-time escape; only the final failed escape causes capture.
9. If the player reaches the safehouse boundary while observed, `Suspicious`, or in `Pursuit`, apply the approved or explicitly provisional `OPEN-SAFE-001` action/state rule. Boundary crossing never becomes an undocumented network reset.

### System rules and state transitions

`SurveillanceState` contains `level`, source device/actor, last-known position, timestamps, current search area, camera-group attempt history, recognition sources, ledger entries, and trace/verification provenance. Raw `ObservationEvidence` remains geometry truth. `SurveillanceRuleBreakEvidence` exists only for the five approved behaviors, and a concern transition requires both records. `Suspicious → Pursuit` requires continued valid evidence, failed verification, or Needle verification—never a hidden timer alone. `Pursuit → Suspicious` requires broken sight plus credible evasion; `Suspicious → Clear` requires completed context recovery and clears recognition. Render and detection use the same camera geometry and solid occlusion. Ordinary geometry creates blind spots; no off-grid zone type exists.

Hiding and blending are authored IDs with geometry, availability schedule, capacity, prerequisites, invalid reasons, and recovery behavior. Cache and terminal interactions use the `GDR-INT-002` commit/resolve boundary with trial durations under `OPEN-INT-001`; schedule-bound opportunities degrade into alternatives rather than disappearing. A context cannot be entered while directly observed. Civilian group size/placement remains under updated `OPEN-CIV-001`; civilians may show small glances or movement only from visible camera, Needle, or player behavior, and never read hidden state or report the player. Human-security roster and schedules use Approved data or the explicit reversible `OPEN-SEC-001` baseline; security verifies, blocks, and intercepts but has no battle AI. Needle follows one authored patrol, emits a hum plus approach/verification warnings, searches legitimate last-known areas/contexts, and cannot attack or be fought. Noise exists only as authored world events with known source and investigation consequence.

Surveillance-origin Paranoia accrues only while current valid observation is paired with approved rule-break/Pursuit evidence attributable to a communicated source. Ordinary public visibility produces none. The surveillance reducer owns that deterministic exposure window and stops it when evidence breaks. `OPEN-PAR-001` owns exact rate, overlap, sampling, and caps; a transition-only one-shot substitute is not silently canonical.

### Internal milestones and proof gates

1. Register each tuning/context/schedule value as Approved or as the queue's explicit reversible provisional baseline, exercise it through fixed greybox route tests, and lock it only after live acceptance.
2. Implement one authoritative surveillance/network reducer, paired observation/rule-break evidence, and an evidence-limited ledger; no painter, actor, civilian, or HUD owns hidden state.
3. Prove harmless public observation plus camera render/detection/occlusion identity, geometric blind spots, subtle normal warnings, and exact Observation coverage.
4. Implement Suspicious, last-known position, Needle patrol/dispatch/warnings/search, recognition reset, and recover-to-Clear without Pursuit.
5. Implement Pursuit evidence loss, direction change, discrete hiding/blending, and staged recovery.
6. Implement the single-use connected camera group, Systems/OpSec result, active expiry, persistent clean/traced history, trace provenance, and unrelated-device rejection.
7. Add authored security/civilian schedules, visible-only civilian reactions, interception options/costs, evidence-limited capture failure, and `OperationAttemptBaseline` compatibility through T3A.
8. Run dusk blending and curfew hiding routes under normal controls, including failure and recovery, before mission integration.

### Content requirements

Author the one camera-group topology and attempt history, exact discovered coverage geometry, subtle warning grammar, the five rule-break records, recognition reset, one Needle patrol/hum/warning package, an Approved or explicitly provisional `OPEN-SEC-001` human-security roster, `OPEN-CIV-001` civilian groups/placements, visible civilian reaction cues, hiding/blending contexts, authored noise events, terminal/device mappings, interception options, exact cost previews, fail-forward/success results, capture-ledger entries, and localized invalid reasons. Every event stores source, timestamp, prior/new state, last-known data, world/HUD/audio feedback, Paranoia/time effect, and outcome-ledger contribution. Content supports dusk, curfew, and uninformed routes.

### World/UI/audio/George feedback

Normal play shows subtle authored camera LEDs/IR glints/reflections; Observation alone shows exact discovered coverage, and unknown devices are not revealed. Clear uses neutral restraint, Suspicious uses amber focus/last-known communication, and Pursuit reserves crimson for confirmed danger. Camera sweep/lock, Needle hum/approach/verification, state transitions, context entry/rejection, clean/trace history, and interception need distinct visual and semantic audio cues. Civilians may glance or step aside only from visible events and never convey hidden network truth. HUD/George may state verified source, last-known area, route risk, and recovery condition; neither may reveal undiscovered devices, safe paths, live pursuer targets, or guaranteed outcomes. George explicitly names why information is missing rather than using silence.

### Failure and recovery

Suspicious is always recoverable unless another explicit authored event confirms identity. Pursuit recovery first returns to Suspicious, not directly to Clear; full Clear resets recognition. Missing or invalid context data fails closed with a readable unavailable reason, never invisibility. Successful interception may cost approved or explicitly provisional Paranoia or time and must say so before selection. Only a failed final capture-escape option produces `failure.capture`; its Hidzu Corporation read model contains real sightings, detected feed change, Needle verification, and capture evidence only, with unseen gaps disconnected. Restart Attempt restores `OperationAttemptBaseline`. Paranoia 100 routes through the T7A breakdown/surrender failure; deadline is separate. Saving/loading cannot erase concern, last-known state, camera history, context occupancy, or Needle/search provenance.

### Explicit exclusions

- No AP combat, AutoBattle, attack grid, weapons, enemy HP, takedown power, overwatch, suppression, EMP, noise lure, breach package, or armed drone.
- No stealth toggle, universal dark-tile hiding, permanent invisibility, passive crouch/noise simulation, omniscient pursuer, camera-through-wall detection, or mismatch between rendered and detected cones.
- No whole-district hack, repeated camera use, remote unrelated-device action, random check, or hidden confirmation timer.
- No off-grid zone, simulated crowd, civilian hidden-state access/reporting, injury/Health reaction, reputation/trust meter, procedural patrol generator, or T10-authored bypass around these mechanics.

### Dependencies and OPEN blockers

Depends on validated committed T3 and T7 foundations; T8A additionally depends on T3A. T8 consumes T4–T6 geometry/presentation and blocks T8A, T9 contextual presentation, and T10 integration. Critical acceptance blockers are `OPEN-PAR-001`, `OPEN-SUR-001`, `OPEN-SUR-002`, `OPEN-SUR-003`, `OPEN-CIV-001`, `OPEN-SEC-001`, `OPEN-LAYOUT-003`, and `OPEN-SAFE-001`. High acceptance blockers are `OPEN-MOV-002`, `OPEN-SUR-004`, and `OPEN-NAR-012`. Recorded recommendations may be trialed provisionally through authored state-machine/content data with explicit live proof and rollback; unresolved behavior cannot be final. T8 owns reusable mechanics; T8A owns attribution/limits/presentation/history; T10/T10A own final placement and city content.

### Canonical decisions/spec sections

Implements `GDR-PAR-004` through `GDR-PAR-008`, `GDR-OBS-001`, `GDR-OBS-002`, `GDR-SUR-001` through `GDR-SUR-011`, `GDR-INT-002`, `GDR-CIV-001`, `GDR-STL-001` through `GDR-STL-003`, `GDR-ESC-001`, `GDR-ESC-002`, `GDR-FAIL-001`, `GDR-REM-004`, and `GDR-REM-005`.

Canonical detail is in [[42 Surveillance, Security & Civilian Behavior]], [[70 Stealth]], [[50 Combat]], [[60 Paranoia]], [[41 Movement, Interaction & Observation]], [[13 Level 0 Content and State Matrix]] sections 6–8 and 11, [[04 Engineering/Architecture]] surveillance ownership/contracts, and [[04 Engineering/Roadmap]] Gate 8.

### Human-play acceptance

- Complete `AC-L0-003`, `AC-L0-008` through `AC-L0-012`, and relevant parts of `AC-L0-018` under normal controls.
- Stand visibly in ordinary public camera coverage and remain harmless; trigger every approved rule break separately; inspect subtle normal warnings/exact Observation coverage and solid-geometry blind spots.
- Trigger Suspicious, watch Needle investigate the stored last-known area with its hum/warnings, recover through a valid context, return fully to Clear, and verify recognition reset with no combat or omniscient correction.
- Trigger Pursuit, break sight, change direction, hide/blend, observe search at the old position, and return through Suspicious to Clear.
- Use the one connected group cleanly and with weak-OpSec trace in separate attempts; prove it cannot be reused, active expiry preserves history, and unrelated devices remain unchanged.
- Trigger visible civilian glances/movement and prove the same civilians neither reveal hidden network state nor mutate surveillance.
- Enter invalid contexts and unsupported interception options; every rejection/cost/failure is explicit and Restart Attempt is deterministic.
- Complete `AC-L0-019` by attempting safehouse entry/actions in all network states and proving there is no boundary reset or magical recovery.

### Documentation and validation obligations

Update surveillance/stealth/combat specs only with approved tuning, Architecture for implemented event/state ownership, MVP Readiness, and `progress/GET-208.md`. Add pure geometry/occlusion, transition, last-known, search, context, schedule, trace, interception, persistence, and outcome-ledger tests. Provide live dusk/curfew captures with debug geometry plus player-facing captures without it. After human-control acceptance, run the AGENTS closeout suite and guided AI regression. Automated state reachability cannot accept fairness, warning quality, or tension.

## T9 — Dialogue, George, facts, dossier, social feed, and four-lane HUD

- **Label:** Feature
- **Initial state:** Todo
- **Parent:** GET-139

### Why this ticket exists

Dialogue and George previously existed as broad but weak surfaces: choices did not reliably alter play, free text implied powers the companion did not have, facts drifted toward generic currency, the journal exposed unrelated systems, and the HUD either consumed too much world or was compressed into the rejected three-lane rewrite. T9 builds the shared information and authored-conversation infrastructure through which the player understands identity, facts, surveillance, objectives, time, and consequence. Its focused T9A child mounts exact gate verdicts, the Cold Iron chain, George limit/readback behavior, and cause-specific failure presentation after T8A plus the GET-179 milestone. T10 supplies final mission content.

### Player promise

Conversation is gameplay. The player sees the exact line they will say, the exact met/not-met gate verdict before committing, the identical reasons afterward, and the declared worse path on nonterminal failure. General facts stay binary while the dedicated Cold Iron evidence chain creates one consequential street-to-document progression. George feels present as a private AR companion, explains every information limit, and remains honest, bounded, and non-agentic. A slim four-lane dock keeps George and current task separate while the dossier/minimap reveal only what the protagonist knows.

### Starting state

- T3 provides pause/focus, clock, layout anchors, interaction, discovered-world state, overlay ownership, and persistence.
- T7A provides identity/ability/gate/condition payloads; T8 provides network/context state and verified risk data; T6 provides portrait/George art.
- The canonical semantic dialogue graph is language-neutral; English and Ukrainian render identical IDs, requirements, effects, and order.
- Exact fiction, dialogue wireframes, lane allocation, accessibility baseline, localization ownership, and some George/contact identities remain T9 acceptance decisions; their recorded `OPEN-*` recommendations may be trialed through replaceable authored content and tokens.

### Complete player flow

1. The four-lane dock shows knowledge minimap, protagonist, George, and one current quest beat in 16–18% viewport height.
2. The player opens an anchored world-visible dialogue. Time/simulation pause; speaker portrait/name/line, history, and exact player lines remain legible.
3. Available and locked options show the exact gate verdict with its reason. Selection commits one authored effect bundle once, shows the matching result, and applies a declared real fail-forward path unless it is the final failed capture escape.
4. General facts record a stable binary key, provenance, time, source node, and designated uses. Cold Iron alone advances `unknown → Naila warning → manifest recognized → manifest copied`; the copy interaction costs five world minutes and has no additional check.
5. The player opens dossier/Character/minimap/feed overlays without losing focus or time. The dossier presents current objective, completed beats, optional preparation, evidence, people/places, timeline, and established consequences.
6. George offers only authored prompts valid for current context/verified ledgers. His private floating avatar and HUD lane stay synchronized; insufficient evidence always yields an honest reason rather than semantic silence. Before departure he reads the real `OperationAttemptBaseline` inputs/restoration meaning.
7. Hidzu Corporation feed/screens provide read-only propaganda, notices, curated civic sentiment, suppression, or transit context without posting/messaging simulation.
8. Closing any surface returns input ownership without a sacrificial movement click; state remains equivalent in English and Ukrainian.

### System rules and state transitions

Dialogue nodes and choices use stable semantic IDs, localized text keys, visibility rules, `GateRequirement`, gate verdict preview/result, binary fact requirements, cost preview, success/real fail-forward effect bundles, history entries, and outcome-ledger writes. Effects are transactional and idempotent; reopening cannot reroll, re-award, duplicate facts, or recopy the manifest. Contacts have no generic trust meter. `FactLedger` remains binary; `ColdIronEvidenceState` is the sole staged chain. Objective/minimap precision derives from facts/discovery, not hidden omniscience.

`GeorgePrompt` is authored for allowed context, required facts/mission state, exclusions, question/response keys, explicit unavailable-reason keys, and `effect: none`. George cannot mutate the world, conceal rules through silence, or carry a deletion/freedom want in Level 0. The HUD owns presentation only; domain state remains in its system. George and current-task lanes remain separate. All overlays/dialogue own a named pause token and release it deterministically.

### Internal milestones and proof gates

1. Register approved values or explicit reversible provisional baselines for dialogue/dossier wireframes, lane allocation, accessibility, localization, and core fiction `OPEN-*` items; lock them only after live acceptance.
2. Define/validate semantic dialogue, effect-bundle, binary fact/provenance, `ColdIronEvidenceState`, dossier, minimap-discovery, George-limit/readback, and cause-specific failure schemas.
3. Implement transaction-safe dialogue/gate/history with exact preview/result verdict parity, nonfatal fail-forward validation, and bilingual state equivalence.
4. Implement binary FactLedger propagation plus the dedicated Cold Iron warning/recognition/five-minute copy chain without a universal evidence ladder.
5. Implement George lane/private avatar synchronization, contextual prompts with explicit insufficiency behavior, 40/70/90 one-shot lines, and departure readback.
6. Implement the four-lane 16–18% dock plus Character, dossier, dialogue, feed, and related overlays across all target viewports.
7. After T8A and GET-179's reachable-control milestone, integrate verified risk/context evidence plus capture/deadline/resource failure read models and prove pause/focus/no-information-leak behavior before T10A content.

### Content requirements

Provide reusable nodes/choice/effect/gate-verdict schemas; English/Ukrainian localization catalogs; portrait/name/history treatment; binary fact catalog/provenance labels; the four-state Cold Iron catalog and five-minute copy action; dossier sections; discovery/precision rules; George prompt/limit/readback/threshold lines; capture/deadline/resource failure models; current-beat models; social-feed cards/screens; overlay empty/error states; and semantic HUD tokens. T10/T10A author final mission/city lines, but T9/T9A provide representative samples for every effect, lock, fail-forward, and cause-specific failure path. Accessibility content includes non-color risk labels, keyboard focus/order, scalable text, subtitles/captions, reduced motion/flash, and volume entry points once approved.

### World/UI/audio/George feedback

The world stays visible behind anchored overlays. Amber denotes objectives/time/curfew, crimson only Pursuit/immediate danger, cyan connected Hidzu Corporation technology, and muted teal/bone neutral knowledge. Matte ink/angular surfaces replace glass blur and broad glow. Every choice/fact/objective/state change gets concise text and restrained semantic audio without covering the city. George comments only on verified facts/current state, explicitly names why useful information is unavailable, and cannot contradict the dossier, reveal unknown cameras, prescribe a hidden safe route, act as a generic chat box, or ask to be deleted.

### Failure and recovery

Missing localization or invalid node/effect data fails validation and cannot silently fall back to different semantics. A failed deterministic choice applies its authored worse path once and remains in history; only the final failed capture escape may terminate the attempt. George always explains an unavailable-information boundary and never encodes hidden meaning in absence. Capture reads only real surveillance-ledger evidence and preserves disconnected unseen gaps; deadline lists unfinished requirements; Paranoia and time consequences stay factual. Overlay errors preserve world state/pause ownership, then offer safe close/Restart Attempt. `OperationAttemptBaseline` restores committed domain state, while transient UI never mutates outcomes. Safehouse controls and George planning prompts show the approved or explicitly provisional `OPEN-SAFE-001` unavailable reason instead of creating a UI-only escape from active surveillance.

### Explicit exclusions

- No procedural dialogue, runtime LLM/tone mixer, unrestricted free text, exposition XP, dialogue farming, hidden random roll, trust/reputation bar, storylet, witness/gossip, or generic intelligence currency.
- No George movement, hacking, interaction, surveillance change, invented fact, undiscovered reveal, automatic choice, guaranteed uncertain prediction, hidden-information silence, or deletion/freedom arc.
- No full-route minimap, undiscovered camera marker, minimap movement command, procedural contract list, inventory/equipment/perk/faction/crafting surface, posting, messaging, followers, or search-risk simulation.
- No universal rumor/confirmed/leverage grading, glossy oversized HUD, permanent labels, three-lane dock, George/current-task lane merge, Bible quotation decoration, or T10-specific script logic embedded in shared UI components.

### Dependencies and OPEN blockers

Depends on validated committed T3 and T7 foundations and consumes T6/T8 state. T9 blocks T9A and T10; T9A depends on T8A plus the GET-179 modernization milestone and blocks T10A. Critical acceptance blockers are `OPEN-NAR-004`, `OPEN-NAR-005`, `OPEN-NAR-007`, `OPEN-NAR-008`, `OPEN-NAR-015`, `OPEN-ABL-001`, and `OPEN-SAFE-001`. High acceptance blockers are `OPEN-NAR-006`, `OPEN-NAR-009` through `OPEN-NAR-011`, `OPEN-NAR-014`, `OPEN-UI-001` through `OPEN-UI-003`, `OPEN-LOC-001`, and `OPEN-ACC-001`. `OPEN-NAR-002` and `OPEN-PAR-002` are resolved. Recorded recommendations remain reversible/non-final while open.

### Canonical decisions/spec sections

Implements `GDR-MIS-003` through `GDR-MIS-008`, `GDR-PAR-003`, `GDR-PAR-007`, `GDR-TIME-002`, `GDR-OBS-002`, `GDR-STL-002`, `GDR-DLG-001` through `GDR-DLG-003`, `GDR-RPG-007`, `GDR-FACT-001`, `GDR-FACT-002`, `GDR-GEO-001` through `GDR-GEO-004`, `GDR-SAFE-001`, `GDR-FAIL-001`, `GDR-UI-001` through `GDR-UI-003`, `GDR-SOC-001`, `GDR-REM-009`, `GDR-REM-010`, and `GDR-REM-012`.

Canonical detail is in [[90 Dialogue]], [[40 George (AI Companion)]], [[46 Facts, Dossier, Minimap & Terminals]], [[45 HUD & Information Architecture]], [[47 Social Feed]], [[91 Quests & Objectives]], [[13 Level 0 Content and State Matrix]] sections 4, 9–10, and 14, [[04 Engineering/Architecture]] UI/content contracts, and [[04 Engineering/Roadmap]] Gate 9.

### Human-play acceptance

- Complete representative Lira, Naila, and Brant conversations with exact lines, preview/result parity, every declared nonterminal fail-forward, history, and practical binary-fact propagation.
- Verify each contact changes at least one designated piece of knowledge and never a trust bar; skip both without soft lock.
- Reach all four Cold Iron states and prove the explicit copy costs five minutes with no check or universal evidence-grade mutation.
- Ask every available/unavailable George prompt in HUD, Observation, safehouse, and dossier; prove verified-only answers, explicit limit reasons, no semantic silence/personal arc, departure readback, and zero world mutation.
- Trigger capture/deadline/breakdown and prove each uses only its own authoritative read model.
- Discover and withhold cameras/locations/facts; verify minimap, objective precision, dossier, and George reveal exactly the known subset.
- At 1280×720, 1440×900, and 1920×1080, exercise all overlays, long English/Ukrainian strings, focus restoration, accessibility modes, and 16–18% four-lane dock.
- Repeat an equivalent semantic path in both languages and prove identical state, gates, facts, costs, objective, and ledger writes (`AC-L0-017`, `AC-L0-018`).
- In `AC-L0-019`, verify every blocked safehouse control and George prompt communicates the same accepted network-state reason in both languages.

### Documentation and validation obligations

Update Dialogue/George/Facts/HUD/Social/Quest specs only with approved resolved content, Architecture for schemas/ownership, MVP Readiness, localization manifest, and `progress/GET-209.md`. Add schema, transactional effect, idempotency, fact propagation, knowledge filtering, George permission, pause/focus, responsive layout, accessibility, and bilingual-equivalence tests. Capture live overlays at all viewports/languages and inspect them visually. After human acceptance, run the AGENTS closeout suite and guided AI regression; DOM presence alone cannot accept readability or consequence.

## T10 — Tokyo escape content, audio, onboarding, and end-to-end acceptance

- **Label:** Feature
- **Initial state:** Todo
- **Parent:** GET-139

### Why this ticket exists

The program is successful only when the approved systems become one coherent, normal-control prologue. Previous passes optimized subsystem checklists and bridge-driven routes while the live game remained confusing, sparse, visually inconsistent, and mechanically half-built. T10 owns authored Level 0 mission content, dialogue/debrief script integration, pacing, onboarding, audio implementation, outcome/continuation assembly, and end-to-end acceptance. It may tune approved values or explicitly recorded reversible provisional baselines; it cannot invent untracked mechanics or hide missing work behind debug actions.

### Player promise

From New Game to debrief, the player experiences a 15–20 minute grounded Tokyo escape story: choose a cover, begin as someone Hidzu Corporation does not yet consider a problem, meet Lira, optionally learn from Naila/Brant, choose dusk public behavior or curfew service evasion, recover confiscated medkits, optionally recognize and copy Cold Iron evidence, escape a fair attributable surveillance response, return the supplies, validate passage toward Miami before midnight, recover/level up, and receive a debrief that names only what happened. Both informed and uninformed runs remain possible, and the ending honestly stops before Miami.

### Starting state

- T2–T9 have passed their own live gates and expose stable contracts/content seams.
- No implementation child is accepted merely because its tests pass; T10 begins from a production-like preview and the canonical acceptance matrix.
- Every T10 `OPEN-*` item has either an approved rule or an explicitly recorded reversible provisional baseline. Unresolved Critical and High items block final acceptance of their affected surfaces, not T10 start.
- New Game uses the new schema only. The operation begins at 18:30 in the outdoor safehouse at Calm (Paranoia 0), no mission facts, network Clear, and no fake Miami level.

### Complete player flow

1. Select the playable cover in under one minute; contextual onboarding teaches confirmation and Character access.
2. Enter the safehouse; George introduces immediate controls/situation only. Exit and meet Lira within the first three minutes.
3. Accept the medkit/passage exchange. Lira explains Hidzu Corporation logistics, midnight, and available preparation without forcing errands; the protagonist seeks Miami to investigate their father and Cold Iron rather than flee a pre-existing corporate flag.
4. Consult Naila and/or Brant in either order or skip both. Facts alter objective precision, dialogue, terminal understanding, blending, evidence recognition, George, and debrief only where authored.
5. Hear George read the real departure time, contacts, the Paranoia tier, held abilities, and restoration meaning; confirm `OperationAttemptBaseline`. Choose Transit Road/Market Ring/Outer Space timing and adapt as the four clock moments change the street.
6. Read subtle camera warnings, use Observation for exact discovered coverage, remain harmless in ordinary public view, avoid or trigger observed rule breaks, use the single camera group once, and respond to Suspicious/Pursuit/Needle/interception as play produces.
7. Explicitly recover medkits. Advance optional Cold Iron evidence from Naila warning to manifest recognition, then explicitly spend five world minutes to copy it—or leave it at any earlier state without blocking completion.
8. Escape the site and fully resolve active surveillance state. Explicitly return medkits to Lira; receive route/fact/consequence-aware dialogue and transit credential.
9. Explicitly use the outbound terminal before 00:00. Use safehouse Rest or the two one-use city grounding actions as appropriate; return for factual debrief, recovery, and any available research.
10. Choose `Continue Exploring` or `End Demo`; preserve Miami continuation data without loading a placeholder level.

### System rules and state transitions

The objective state machine, binary facts, `ColdIronEvidenceState`, exact gate catalog, surveillance ledger, outcome ledger, failure IDs, `OperationAttemptBaseline`, and acceptance IDs in [[13 Level 0 Content and State Matrix]] are authoritative. Every mission-object transition requires explicit input and is idempotent. Midnight causes `failure.deadline` while either medkits have not been returned or transit has not been validated. Completion requires both; active Suspicious/Pursuit must be resolved before invisible completion. Cold Iron evidence is always optional. The debrief reads authoritative ledgers; it never reconstructs truth from display logs or generic morality.

Ordinary public visibility is harmless. Surveillance concern requires paired visibility and approved rule-break evidence; normal geometry/occlusion creates blind spots; Clear resets recognition. The one camera group's terminal history persists until Restart Attempt. Every gated choice shows identical preview/result verdicts and each nonterminal failure advances through a declared worse path. Four clock boundaries are idempotent. Actor tint is presentation-only.

Onboarding is contextual and disappears once the action is demonstrated. The complete in-game Game Design Bible remains an optional reference under T1 and never substitutes for teaching immediate controls through play. Audio and visual feedback use the same semantic events as gameplay. English and Ukrainian share semantic IDs. Performance, save, and viewport behavior are part of acceptance, not post-ship polish. Until `OPEN-TIME-001` is accepted, pacing trials use its recorded 1–2 / 2–3 / 0–4 / 6–8 / 3–4 / 2–3 minute segment bands, 19:15–19:45 dusk-departure window, and 60-world-minute return reserve; segment maxima do not stack and the total remains 15–20 minutes.

### Internal milestones and proof gates

1. Register approved or reversible provisional values for all T10 fiction, tuning, localization, accessibility, audio, and performance decisions; freeze the authored beat sheet and route budgets only after live acceptance.
2. Integrate T9A's gates/Cold Iron/George/failure contract, then author the cover-select opening, Lira briefing, optional contacts, both timing routes, cache/copy, return, validation, debrief, failures, Restart Attempt, and ending.
3. Deliver T10A's four street-clock moments, named-route/grounding/threshold/civilian content, and three spatial sound thresholds with bilingual parity.
4. Deliver T10B's validated foot-anchor `ActorLightRegion` tint after T10A city/content evidence.
5. Prove objective/fact/surveillance/outcome ledgers across informed, uninformed, every Cold Iron state, each rule break, Clear recovery, interception, every failure, and completion.
6. Tune first decision, route pacing, return reserve, HUD/overlay/world readability, sound thresholds, and actor tint through normal-control sessions.
7. Run every `AC-L0-*` case in a stable preview at target viewports/languages; fix all in-scope findings and rerun affected routes.
8. Run automated closeout and guided AI regression only after live human/visual proof; prepare a requester-verifiable committed build only after explicit commit authorization.

### Content requirements

Deliver the complete English/Ukrainian semantic script; contact biographies/portraits/anchors; mission/objective/binary-fact/Cold-Iron/gate/effect data; Transit Road/Market Ring/Outer Space schedule content; four idempotent clock moments; civilian/security/device/context placement; one camera group and Needle patrol; three one-function terminals; cache/medkit/manifest-recognition/five-minute-copy interactions; two grounding actions and three threshold lines; three spatial ambience locations; contextual onboarding; all cause-specific failure/debrief/completion variants; cover/ability/fact consequences; Miami continuation payload; public Hidzu Corporation feed/signage excerpts; and actor-light metadata. Every branch declares prerequisites, visible consequence, ledger write, localization, Restart Attempt behavior, and fallback.

### World/UI/audio/George feedback

The accepted continuous city, grounded actors, separate George/current-task lanes, overlays, and graphic surveillance-noir semantics remain coherent through all four clock moments. Objectives outrank ambient art; characters/entrances/contexts remain readable without permanent labels. Normal camera coverage reads through subtle light/reflection while Observation shows exact discovered geometry. Audio includes the three threshold locations plus Needle and clock cues; no voice acting is required. Actors receive only subtle semantic amber/cyan foot-anchor tint. George teaches immediate context, explains unavailable information, reads departure truth, warns once at 40/70/90, and never solves the route or expresses a deletion arc.

### Failure and recovery

Breakdown at Paranoia 100 states its staged surrender and factual cause. Deadline lists unfinished Lira-return/transit requirements and never claims capture. Capture alone shows a short Hidzu Corporation report/map built only from actual sightings, detected feed change, Needle verification, and capture evidence; unseen route gaps remain disconnected. Each offers Restart Attempt from a valid `OperationAttemptBaseline`; stale schema explains New Game. Missing optional contacts/evidence never soft-locks. Missing required content/localization/audio/anchor/transition fails validation rather than auto-completing.

### Explicit exclusions

- No tactical combat, AutoBattle, fantasy gadgets, package selection, procedural dialogue/quests/storylets, runtime LLM, broad inventory/economy/crafting, reputation/trust, social simulation, complex interior, vehicle, or fake Level 1.
- No automatic pickup/handoff/completion, teleport, debug clock/state action, direct internal-role targeting, obscured DOM click, bridge-only operation, or hidden objective mutation in acceptance.
- No special off-grid zones, Observation vignettes, George deletion/silence mechanic, universal evidence grading, injury/limp simulation, civilian reporting, HUD-lane merge, Bible epigraph decoration, decorative clutter, synthetic Neo Tokyo replacement, permanent labels, oversized HUD, unsupported free text, or fixture claim standing in for live quality.
- No reopening approved mechanic ownership inside the integration ticket; required changes return to the owning ticket/spec.

### Dependencies and OPEN blockers

Depends on validated committed T3–T9 deliverables. T10A additionally depends on T9A; T10B depends on T10A. Critical acceptance blockers are `OPEN-NAR-001`, `OPEN-NAR-004`, `OPEN-NAR-005`, `OPEN-NAR-007`, `OPEN-NAR-008`, `OPEN-NAR-015`, `OPEN-ABL-001`, `OPEN-ABL-002`, `OPEN-NAR-016`, `OPEN-PAR-001`, `OPEN-TIME-001`, `OPEN-CIV-001`, `OPEN-SEC-001`, `OPEN-LAYOUT-005`, and `OPEN-SAFE-001`. High acceptance blockers are `OPEN-NAR-003`, `OPEN-NAR-006`, `OPEN-NAR-010` through `OPEN-NAR-014`, `OPEN-AUD-001`, `OPEN-LOC-001`, `OPEN-ACC-001`, `OPEN-PERF-001`, and `OPEN-ART-005`. `OPEN-NAR-002` and `OPEN-PAR-002` are resolved. Recorded recommendations remain explicitly provisional until accepted.

### Canonical decisions/spec sections

Implements the end-to-end current contract, especially `GDR-PROD-001` through `GDR-PROD-003`, `GDR-SET-001` through `GDR-SET-007`, `GDR-PC-004`, `GDR-PC-005`, `GDR-CAMP-001`, `GDR-MIS-001` through `GDR-MIS-010`, `GDR-RPG-007` through `GDR-RPG-010`, `GDR-HLT-004`, `GDR-PC-006`, `GDR-PROD-005`, `GDR-INT-002`, `GDR-SUR-011`, `GDR-SOC-002`, `GDR-PAR-005` through `GDR-PAR-009`, `GDR-TIME-001`, `GDR-TIME-004`, `GDR-SAFE-001`, `GDR-SUR-006` through `GDR-SUR-010`, `GDR-CIV-001`, `GDR-INT-001`, `GDR-STL-003`, `GDR-ESC-001`, `GDR-ESC-002`, `GDR-DLG-001`, `GDR-DLG-003`, `GDR-FACT-001`, `GDR-FACT-002`, `GDR-GEO-002`, `GDR-GEO-004`, `GDR-FAIL-001`, `GDR-SOC-001`, `GDR-AUD-001`, `GDR-AUD-002`, `GDR-ART-011`, `GDR-GOV-001`, and `GDR-GOV-006`.

Canonical detail is in [[Game Design]], [[10 MVP Spine]], [[11 Level 0 Vertical Slice Contract]], every system specification, [[13 Level 0 Content and State Matrix]], [[03 Lore/Plot Bible]], [[30 Art Direction (MVP)]], [[95 MVP Readiness Checklist]], [[04 Engineering/Architecture]], and [[04 Engineering/Roadmap]] Gate 10.

### Human-play acceptance

Run all `AC-L0-001` through `AC-L0-030` (with `AC-L0-013` retired) in a stable production-like preview. Cover harmless public observation, every rule break, geometric blind spots, one-use camera/history, Clear reset, Needle, civilians, all Cold Iron states/copy, exact gate preview/result and fail-forward, baseline readback/restoration, grounding/thresholds, four clock moments, named routes, three sounds, evidence-limited failures, actor tint, both languages, and every target viewport. Each run uses only normal visible controls and the modernized guided harness vocabulary. Acceptance requires 15–20 minute pacing, first decision under three minutes, four-lane dock at 16–18%, continuous city, human-scale actors, readable risks/actions, exact outcomes, no magical safehouse reset, and no console/page/state/save/objective errors.

### Documentation and validation obligations

Update canonical specs only for approved final values, Plot Bible for final authored continuity, Architecture for implemented integration, MVP Readiness evidence states, Roadmap Feature progress, and `progress/GET-210.md`. Validate all content/state/localization/audio/art manifests and fixed screenshots. Run relevant validators, `yarn sprites:validate` if actor outputs changed, lint, build, tests, coverage above 80%, and `yarn playtest:agent -- --profile guided-level0 --max-steps 20 --codex`; inspect and resolve/defer every finding. Record human route evidence separately. Do not mark T10 or GET-139 Done until the requester verifies the explicitly authorized committed build.

## T3A — Rename the operation baseline and Restart Attempt contract

- **Status: Canceled — absorbed by T7A (GET-216) on 2026-08-07.** The complete rename scope (Restart Attempt vocabulary, `OperationAttemptBaseline`, v3 schema boundary, validators, UI copy, stale-save rejection) executes inside T7A's single v2→v3 window, and T3A's blocks edges (T8A, GET-179 modernization) transferred to T7A. The historical 14-section contract remains in Git history and on the canceled Linear issue.

## T7A — Pivot the protagonist to Paranoia tiers, binary abilities, cover-select, and research

- **Label:** Improvement
- **Initial state:** Todo
- **Project:** MVP
- **Parent:** GET-207

### Why this ticket exists

The delivered T7 foundation implements the superseded numeric contract: Health, four attributes, eight skills, XP, levels, and arithmetic checks. T7A replaces it with the approved single-resource, binary-ability design before T9A presents gates and before any content hard-codes dead numbers. It also absorbs GET-211's rename scope so the game crosses exactly one v2→v3 schema boundary. (Design lineage per `GDR-GOV-009`: Pentiment's numberless identity; Deus Ex's binary enablers; Citizen Sleeper's drives and clocks; Disco Elysium's thought cabinet, made the spine.)

### Player promise

The player selects one of four covers of the same protagonist — one playable, three visibly disabled — and sees no number anywhere. Every gate reads met or not met with its exact reason. Named Paranoia tiers lock `fragile` abilities while `hardened` ones hold. Research at the safehouse trades facts plus world minutes for one new ability. At 100 the protagonist stages a surrender, and the ending reads only real evidence.

### Starting state

- T7 (GET-207, In Review) delivered the numeric foundation now superseded; its evidence remains historical and its committed build stays untouched as delivered proof.
- The pivot documentation package (register, queue, specs, matrix, this program) is committed with requester authorization; `traceability.ts` bijection was synchronized in the same pass.
- `LEVEL0_RUN_SCHEMA_VERSION` is 2; saves carry `retry*` names and numeric builds; neither migrates.
- The agent bridge exposes `health` and a three-band paranoia tier; the guided harness keys failure heuristics on `player.health`.

### Complete player flow

1. New Game opens cover-select: four covers with fictions, one confirmable, zero numbers.
2. The run starts at the safehouse at Calm with the cover's three abilities lit.
3. Gate encounters show met/not-met with exact reasons and keep at least two real solutions each.
4. Tier crossings lock the declared `fragile` abilities; George announces each first entry once.
5. Safehouse research consumes a declared fact plus world minutes and grants one ability, once.
6. Grounding actions and Rest recover Paranoia through the time economy.
7. At 100, the staged surrender ends the attempt as `failure.breakdown`; Restart Attempt restores the exact departure baseline.

### System rules and state transitions

Paranoia is internal 0–100 presented as Calm 0–39 / Uneasy 40–69 / Shaken 70–89 / Breaking 90–99 on the approved cuts; 100 is breakdown with surrender staging (`GDR-PAR-008`, `GDR-PAR-009`). Gates pass by designated lit ability OR designated fact OR declared costed path; verdicts are met/not-met with exact reasons and never arithmetic (`GDR-RPG-009`). Abilities are binary and tagged `fragile` (with a lock tier) or `hardened` (`GDR-RPG-008`). Research consumes facts plus world minutes and yields one ability once per option (`GDR-RPG-010`). Health does not exist; physical consequence expresses as time, Paranoia, or capture (`GDR-HLT-004`). The schema advances to v3 including the `OperationAttemptBaseline`/`restartAttempt`/`restart_attempt_confirmation` renames; stale v2 and retired development saves are rejected, never migrated.

### Internal milestones and proof gates

1. Execute the absorbed GET-211 inventory/rename seam: every shared/public/persisted `retry*` symbol becomes the Restart Attempt vocabulary in one typed pass.
2. Replace build/Health state with cover/ability/condition state and rewrite the v3 validators fail-closed.
3. Implement the gate resolver on the interaction-resolver `{status, reasonId}` pattern with verdict read models.
4. Implement tier derivation, `fragile` locks, and George tier announcements.
5. Implement the safehouse research action with once-only consumption.
6. Replace character creation with the cover-select shell: one playable, three visibly disabled, no numbers.
7. Rewrite the Bible's character and condition chapters (both locales), sharedRules, coverage topics, and traceability; add the per-chapter design-lineage notes phrased to clear the forbidden-text scan; perform the physical 43/92 file retitles with sourceRef and wiki-link updates.
8. Update the agent bridge: four-band named tiers plus a legacy `health: 100` constant in the existing removed-systems shim block until GET-179 modernizes the harness.
9. Run the terminology scan proving no current Health/XP/check surface remains in code, UI copy, or persistence.

### Content requirements

Bilingual: four cover names and fictions with three disabled presentations (`OPEN-NAR-016`); the ability catalog with tags and lock tiers (`OPEN-ABL-001`); research options and costs (`OPEN-ABL-002`); tier names and lock/unlock reasons; gate verdict reason strings; surrender staging variants; rewritten Bible chapters with lineage notes.

### World/UI/audio/George feedback

The protagonist lane and Character screen show one continuous read-only Paranoia slider whose position follows the exact internal value, with threshold ticks and the current named tier but no printed number (`GDR-UI-005`). Ability lit/locked states remain visible. Gates show verdicts where the choice lives. Tier changes use restrained semantic cues; George announces each first tier entry once, explains locks, and cannot research, unlock, or lower Paranoia.

### Failure and recovery

100 stages surrender/freeze/bolt per context before the `failure.breakdown` ending; the summary derives only from real ledger evidence. Failed costed paths commit their declared worse outcomes. Restart Attempt restores cover, abilities, research state, Paranoia, and tier one-shot histories exactly; v2/malformed saves reject to New Game with exact reasons.

### Explicit exclusions

- No Health, damage numbers, XP, levels, attribute/skill arithmetic, point allocation, respec, or derived stats anywhere.
- No hidden tier math, dishonest high-Paranoia UI, ability loss outside declared tier locks, or research randomness.
- No `retry*` alias shims that keep the retired vocabulary public; no save migration.
- No surveillance-causality, dialogue-graph, or city/audio changes owned by T8A/T9A/T10A.

### Dependencies and OPEN blockers

Depends on delivered T7 and the committed pivot documentation package; absorbs and supersedes T3A (GET-211) including its blocks edges. Blocks T8A, the GET-179 modernization, and T9A. Acceptance blockers: `OPEN-ABL-001`, `OPEN-ABL-002`, and `OPEN-NAR-016`; the revised `OPEN-RPG-005`, `OPEN-PAR-001`, `OPEN-TIME-001`, `OPEN-SAFE-001`, and `OPEN-LAYOUT-005` govern their surfaces. `OPEN-UI-004` is resolved by the continuous-slider rule in `GDR-UI-005`.

### Canonical decisions/spec sections

Implements `GDR-RPG-008`, `GDR-RPG-009`, `GDR-RPG-010`, `GDR-PAR-008`, `GDR-PAR-009`, `GDR-HLT-004`, `GDR-PC-006`, `GDR-UI-005`, `GDR-GOV-009`, and `GDR-SAFE-001`; revises the surfaces of `GDR-TIME-003`, `GDR-UI-002`, `GDR-FAIL-001`, `GDR-MIS-008`, `GDR-SUR-005`, and `GDR-ESC-001`. Canonical detail: [[92 Character, Covers, Abilities & Research]], [[43 Failure, Surrender & Recovery]], [[60 Paranoia]], [[44 Safehouse, Save & Restart Attempt]], [[45 HUD & Information Architecture]], [[13 Level 0 Content and State Matrix]] §§1–5, 10–12, 14, [[04 Engineering/Architecture]], and [[04 Engineering/Roadmap]] Gate 7.

### Human-play acceptance

- Cover-select shows four covers, confirms only the playable one, and contains zero numbers.
- The HUD and Character screen show the same continuous read-only Paranoia slider position, threshold ticks, and named tier without printing the numeric value.
- Every authored gate is solved two different ways under normal controls.
- Each tier boundary locks and relights exactly the declared `fragile` set with tier reasons while a `hardened` control ability passes throughout (`AC-L0-030`).
- Research consumes its exact fact and minutes once and grants exactly one ability.
- Reaching 100 stages the surrender and produces the evidence-limited breakdown ending (`AC-L0-014`); Restart Attempt restores the departure state exactly.
- The sixteen Bible chapters render the new design with lineage notes in both languages.
- All target viewports, both languages, normal controls only.

### Documentation and validation obligations

Update Character/Failure/Paranoia/Safehouse/HUD specs for shipped behavior, Architecture, the state matrix, readiness, localization inventory, README, and `progress/GET-216.md`. Focused Jest: Bible bijection/sixteen-chapter/forbidden-text/source-ref suites, gate resolver, tier locks, research idempotency, v3 rejection, bridge shim. Run the Improvement closeout and guided AI regression only after live human acceptance; commit only with explicit requester authorization and keep the issue non-terminal until the committed build is verified.

## T8A — Make Hidzu Corporation surveillance readable, attributable, and limited

- **Label:** Improvement
- **Initial state:** Todo
- **Project:** MVP
- **Parent:** GET-208

### Why this ticket exists

The surveillance foundation needs one honest causal rule. Public camera visibility cannot itself make an unknown expatriate suspicious, while invisible network logic, abstract cones, repeatable looping, an anonymous verifier, or omniscient civilians would make the system feel arbitrary. T8A couples concern to observed rule-breaking, makes coverage readable through the street, and gives every escalation source a persistent evidence record.

### Player promise

Walking normally through a public camera's view is safe. Concern starts only when a current observer sees a restricted-area breach, protected interaction, medkit removal, failed verification, or detected camera-feed change. Buildings create real blind spots. Normal play gives subtle light/reflection warnings; Observation shows exact discovered coverage. The player can use one camera group once, hears Needle coming, can recover to Clear, and reads small civilian reactions without civilians becoming secret informants.

### Starting state

- T8 supplies shared visibility geometry, Clear/Suspicious/Pursuit, last-known pursuit, hiding/blending, interception, and security/civilian/device seams.
- T3A supplies v3 `OperationAttemptBaseline` and `restartAttempt`; camera/recognition/ledger history must participate in it.
- Network starts `Clear`, recognition empty, the single camera group `unused`, and only discovered devices visible to player knowledge.
- Numeric detection/search/loop duration and placements remain governed by updated `OPEN-SUR-*`, `OPEN-CIV-001`, `OPEN-SEC-001`, and layout items.

### Complete player flow

1. Enter discovered public camera coverage, observe subtle physical warnings, and remain `Clear` with no Paranoia.
2. Enter Observation and inspect the same exact discovered geometry; stand behind solid occluders and confirm blind spots.
3. Trigger each approved observed rule break in isolated attempts and see source-attributed concern/Paranoia.
4. Enter Suspicious/Pursuit, receive truthful last-known feedback, and hear Needle's hum/approach/verification warnings during its one patrol.
5. Break observation, evade through a credible context, return fully to `Clear`, and confirm recognition is empty.
6. Use the one camera group; let active looping expire and confirm `clean`/`traced` remains until Restart Attempt and prevents reuse.
7. Observe civilians glance/step aside from visible events, then prove they never reveal hidden state or report the player.

### System rules and state transitions

`ObservationEvidence` remains raw geometry truth. `SurveillanceRuleBreakEvidence` exists only for `restricted-area-breach`, `protected-interaction`, `medkit-removal`, `failed-verification`, and `detected-camera-feed-change`, with observer/source/time/position. Concern and surveillance-origin Paranoia require both current valid visibility and valid rule-break/Pursuit evidence. Ordinary occlusion defines blind spots; no off-grid zone exists. Camera-group history is `unused | active | clean | traced`; `active` may expire only to `clean`/`traced`, never `unused`. Full `Clear` resets recognition. Needle is the single player-facing verifier. Civilian reaction is presentation-only.

### Internal milestones and proof gates

1. Separate visibility evidence from rule-break evidence and validate every producer/consumer.
2. Prove harmless public observation and every rule-break transition with source-attributed ledger/Paranoia output.
3. Bind subtle normal-play warnings and exact Observation display to the same discovered geometry/occlusion resolver.
4. Implement single camera-group history, expiry, clean/trace persistence, reuse rejection, baseline persistence, and Restart Attempt reset.
5. Author Needle's patrol/hum/approach/verification package and legitimate last-known behavior.
6. Implement full-Clear recognition reset and visible-only civilian presentation.
7. Derive the capture evidence ledger needed by T9A without exposing a complete path.

### Content requirements

Author the five rule-break definitions and localized source labels; one camera-group/terminal mapping; discovered-coverage/warning metadata; solid-occluder cases; one Needle patrol plus hum/approach/verification cues; recognition-reset feedback; small civilian glance/movement cues; persistent surveillance ledger entries; and clean/trace/reuse-blocked strings. All content is bilingual and uses stable IDs.

### World/UI/audio/George feedback

Normal play communicates cameras through status LEDs, IR glints, wet-pavement reflections, and restrained sweep/focus effects; it does not paint exact cones everywhere. Observation may render exact discovered geometry. Needle has a distinctive hum and explicit approach/verification warnings. Civilians never become a network HUD. George may report verified source/last-known/recovery state and explicitly explain when a non-networked/undiscovered source limits him; he cannot infer hidden coverage.

### Failure and recovery

Suspicious/Pursuit remain recoverable under T8 rules; full Clear erases recognition but not persistent camera-group history. A missing/invalid rule-break record cannot escalate the network or add Paranoia. A detected feed change may create concern/trace but cannot be fabricated after the fact. Capture records only real ledger evidence for T9A. Restart Attempt restores baseline camera/recognition/ledger state and resets post-departure use/events.

### Explicit exclusions

- No suspicion from ordinary public visibility, special off-grid zones, abstract always-on exact cones, repeatable camera looping, anonymous/random drone, omniscient pursuer, camera-through-solid detection, or global hack bus.
- No civilian access to hidden network state, reporting, gameplay authority, injury reaction, crowd simulation, or trust/reputation system.
- No Observation vignette/reward, lighting-driven detection, combat, or final failure-overlay implementation owned by T9A.

### Dependencies and OPEN blockers

Depends on T3A and the reusable T8 foundations; blocks T9A. Critical/high provisional values remain `OPEN-PAR-001`, `OPEN-SUR-001` through `OPEN-SUR-004`, `OPEN-CIV-001`, `OPEN-SEC-001`, `OPEN-LAYOUT-003`, `OPEN-SAFE-001`, and relevant `OPEN-MOV-*` tuning. Those values remain isolated/reversible and cannot alter the approved causal rules.

### Canonical decisions/spec sections

Implements `GDR-SUR-006` through `GDR-SUR-011`, `GDR-PROD-005`, `GDR-CIV-001`, `GDR-PAR-006`, `GDR-OBS-001`, `GDR-OBS-002`, `GDR-STL-001` through `GDR-STL-003`, and the surveillance portion of `GDR-FAIL-001`. The verification-lane set-piece, Needle's decision-point patrol, and active-recognition rendering (sweep hold at last-known, amber service lamps, manual-review mode, Needle route change) are owned here. Canonical detail is in [[42 Surveillance, Security & Civilian Behavior]], [[70 Stealth]], [[60 Paranoia]], [[41 Movement, Interaction & Observation]], [[13 Level 0 Content and State Matrix]] surveillance/acceptance rows, [[04 Engineering/Architecture]] section 8, and [[04 Engineering/Roadmap]] T8A.

### Human-play acceptance

- Prove ordinary public visibility remains Clear/no-Paranoia, then trigger each of the five concern sources through normal controls.
- Compare normal and Observation presentation against raw geometry; test representative solid occluders and discovered/undiscovered devices.
- Use the single camera group cleanly and traced in separate attempts; prove active expiry/history/reuse rejection and Restart Attempt reset.
- Reach Pursuit, verify Needle's patrol/hum/warnings/last-known search, recover through Suspicious to Clear, and prove recognition reset.
- Trigger civilian cues while diagnostics prove no surveillance mutation/hidden-state access.
- Save/restore every state and inspect English/Ukrainian cues at all target viewports.

### Documentation and validation obligations

Update surveillance/stealth/Paranoia/observation/civilian specs, Architecture, state matrix, MVP Readiness, manifests/localization, and the child progress note. Add pure evidence pairing, geometry/occlusion, state/reset, camera-history, persistence, Needle, civilian-presentation, and Paranoia-source tests plus live debug/player captures. Run the Improvement closeout only after human-control readability/fairness acceptance. Do not treat fixtures or debug cones as player proof.

## H1 — Modernize GET-179 guided Level 0 vocabulary and milestone probes

- **Existing Linear issue:** GET-179
- **Operational state/labels/parent:** Preserve current values

### Why this ticket exists

The guided harness still carries vocabulary and shortcuts from discarded stealth-toggle, automatic-collection, forced-progress/failure, and combat-era slices. Those controls can make unreachable or invalid behavior look integrated. GET-179 must describe and exercise the same six verbs available to a real Level 0 player and expose milestones as observation-only probes.

### Player promise

Harness evidence reflects a route a player could actually perform. A green guided report means normal movement, Observation, interaction, choices, contexts, and George consultation reached the milestone; it never means the harness toggled stealth, collected by proximity, set state, forced a failure, or invoked combat behind the player's back.

### Starting state

- T3A provides the final Restart Attempt control/action and schema-visible baseline state.
- The existing GET-179 issue, state, labels, project, parent, and prior evidence remain intact; this is a complete description replacement, not a new harness ticket.
- Current deterministic/fixture profiles may retain direct mutation only when explicitly labeled fixture evidence and excluded from canonical guided acceptance.
- T8A may develop in parallel after T7A, but T9A waits for both T8A and this milestone.
- Until this modernization lands, the bridge keeps a legacy `health: 100` constant in its removed-systems shim block; the modernized schema drops it and adopts the four named Paranoia tiers.

### Complete player flow

1. Start a new run through the typed non-verb start control.
2. Use only `move`, `observe`, `interact`, `choose`, `useContext`, and `consultGeorge` for gameplay.
3. Use typed wait controls where normal UI exposes waiting; never mutate the clock directly.
4. Reach and report cover-select, Lira acceptance, preparation, departure baseline, infiltration, medkits, all manifest states/copy, surveillance recovery, return, transit validation, debrief, capture, and deadline milestones.
5. Trigger **Restart Attempt** only through its typed non-verb control and verify the restoration milestone.
6. Emit a deterministic report that distinguishes reachable guided evidence from fixture-only state evidence.

### System rules and state transitions

The canonical verb union is exactly `move | observe | interact | choose | useContext | consultGeorge`. Start, wait, and Restart Attempt are controls, not verbs. Each command resolves through normal runtime ownership and exposes the same availability/blocked reason as player UI. A milestone probe reads authoritative state and transition provenance but cannot dispatch, mutate, synthesize, skip, or satisfy that milestone. Canonical profiles reject unknown/legacy verbs at schema validation.

### Internal milestones and proof gates

1. Inventory existing bridge actions/profiles and classify reachable control, non-verb control, diagnostic read, fixture mutation, or rejected shortcut.
2. Replace the public guided schema/parser/serializer with the six-verb union and typed non-verb controls.
3. Reject stealth-toggle, auto-collect, forced progress/failure, combat, teleport, direct role/target/state mutation, and stale aliases in canonical profiles.
4. Add typed observation-only milestone probes for the complete approved list.
5. Rewrite deterministic/guided profiles and tests; preserve fixture-only helpers behind explicit noncanonical boundaries.
6. Run guided routes and prove every reported milestone has a reachable event/action chain.

### Content requirements

Provide command schemas, localized/readable action names where reports display them, blocked-reason records, probe IDs, milestone predicates, event/provenance links, profile definitions, invalid-legacy fixtures, and report sections that label `live guided`, `deterministic reachable`, or `fixture only`. No mission content is duplicated inside the harness.

### World/UI/audio/George feedback

The harness observes the real world/HUD/audio/George outputs but owns none of them. `consultGeorge` uses the normal authored prompt surface. `observe` uses full-pause Observation. Screenshots and text bridges report current visible state without exposing hidden network data beyond approved diagnostics. The report names missing evidence honestly.

### Failure and recovery

An unreachable control, missing target, invalid wait, unavailable Restart Attempt, stale verb, or unmet probe fails/blocks the profile with its real reason; it never patches state to continue. Capture/deadline are reached through normal actions/time. A timeout is incomplete evidence. Fixture mutation may test isolated reducers but cannot unblock a guided milestone or final acceptance.

### Explicit exclusions

- No legacy stealth toggle, automatic collection, forced progress/failure, combat shortcut, teleport, direct internal-role targeting, direct store mutation, hidden clock set, or synthetic success in canonical profiles.
- No model identity claims from `--codex`, no replacement of human visual/play acceptance, and no new gameplay mechanic.
- No new Linear harness ticket.

### Dependencies and OPEN blockers

Depends on T3A. Its complete reachable milestone gate plus T8A blocks T9A. Content/tuning `OPEN-*` items may make a route legitimately blocked; the harness reports that state and uses an explicitly authorized reversible baseline only through normal controls. Model/tool freshness follows AGENTS and does not alter the vocabulary contract.

### Canonical decisions/spec sections

Implements the acceptance-control portions of `GDR-MOV-001`, `GDR-OBS-001`, `GDR-INT-001`, `GDR-SAFE-001`, `GDR-RPG-007`, `GDR-FACT-002`, `GDR-SUR-006` through `GDR-SUR-010`, and `GDR-FAIL-001`. Canonical detail is in [[13 Level 0 Content and State Matrix]] acceptance rows, [[04 Engineering/Architecture]] diagnostics/test layers, [[04 Engineering/Roadmap]] GET-179 milestone, and [[95 MVP Readiness Checklist]].

### Human-play acceptance

Inspect one deterministic reachable report and one guided report. Both use only the six verbs plus typed start/wait/Restart Attempt controls, reach their declared milestones with traceable normal actions, reject every legacy shortcut fixture, and distinguish fixture evidence. Confirm capture, deadline, manifest copy, surveillance recovery, and baseline restoration are not manufactured. Human control separately replays representative paths.

### Documentation and validation obligations

Replace the complete GET-179 Linear description from this section while preserving its current metadata/state. Update Architecture diagnostics, acceptance matrix/readiness, bridge schema/profile docs, and existing GET-179 progress/evidence surfaces as applicable. Validate command/probe uniqueness, legacy rejection, reachability provenance, deterministic replay, report classification, and no direct mutation in canonical profiles. Run relevant tests/build and the guided profile after the owning runtime work exists; do not claim blocked future milestones now.

## T9A — Make gates, evidence, George, departure, and failure fully legible

- **Label:** Improvement
- **Initial state:** Todo
- **Project:** MVP
- **Parent:** GET-209

### Why this ticket exists

The core RPG/information systems can be deterministic yet still feel arbitrary when the verdict appears only after choice, facts flatten into generic grades, George's absence is ambiguous, departure restoration is invisible, or every failure uses a generic recap. T9A mounts the exact gate verdicts and evidence boundaries at the decisions where they matter, while deriving failure knowledge only from authoritative ledgers.

### Player promise

Before every gated choice the player sees met or not met with the exact reason — the designated ability and its lit/locked state, the designated fact, or the declared cost. Nonterminal failure always opens a declared worse but real path. Cold Iron evidence progresses through four understandable states. George says why he cannot help and reads the departure baseline honestly. Capture shows only Hidzu Corporation evidence that actually exists; deadline and breakdown tell their own truth.

### Starting state

- T9 supplies dialogue/effect/fact/dossier/minimap/George/HUD/overlay infrastructure and the separate George/current-task lanes.
- T7A supplies the pure gate resolver and reusable verdict read models.
- T8A supplies surveillance ledger/capture evidence; GET-179 has reached its modernized reachable milestone; T7A supplies baseline/readback/action.
- The exact gate catalog and dossier wireframe remain under `OPEN-ABL-001`/`OPEN-UI-*`; this ticket may use only their documented reversible baselines.

### Complete player flow

1. Open every gated dialogue/terminal/interception choice and inspect its verdict and reason before committing.
2. Choose success and fail-forward variants; inspect the identical post-resolution verdict and the committed outcome/effects.
3. Reach every nonterminal failure and continue through its declared time/Paranoia/objective/route cost; fail the final capture escape to end an attempt.
4. Start with Cold Iron `unknown`, receive Naila's warning, recognize the manifest through the authored observation, and explicitly spend five world minutes to copy it—or stop at any earlier state.
5. Ask George for known/unknown/non-networked information and receive verified content or an explicit truthful limit reason; never infer from silence.
6. Review George's live departure readback, confirm/cancel, then inspect Restart Attempt presentation.
7. Trigger capture, deadline, and breakdown failures and compare their distinct read models.

### System rules and state transitions

The gate verdict presentation is `preview | result`; both views are produced from the same resolver inputs and keys. Result adds only committed outcome/history. Every nonfatal catalog entry has at least one real `failForwardEffectId`; only the final failed capture escape is fatal. `FactLedger` stays binary. `ColdIronEvidenceState` alone advances `unknown | naila_warning | manifest_recognized | manifest_copied`; copying is explicit, idempotent, +5 world minutes, and gate-free. George always returns an authored response/limit reason when consulted; silence has no gameplay semantics and no deletion arc exists. Failure selectors are cause-specific.

### Internal milestones and proof gates

1. Mount preview verdicts in every authored gated-choice surface; mount results from committed resolutions.
2. Validate preview/result parity and reject every nonfatal catalog entry without a real reachable fail-forward effect.
3. Implement/validate the four-state Cold Iron reducer, observation recognition, five-minute copy, persistence, dossier/George/debrief propagation, and no universal grading.
4. Add explicit George limit reasons, separate-lane presentation, threshold/readback integration, and no-semantic-silence validation.
5. Build `CaptureReportReadModel` from the T8A ledger without path interpolation; build separate deadline/resource models.
6. Integrate Restart Attempt confirmation/readback presentation from T7A.
7. Prove all states/failures in both languages and through GET-179's reachable controls.

### Content requirements

Provide exact localized verdict labels; all gate keys and locked reasons; real fail-forward effect/cost copy; Cold Iron state/provenance/copy strings; George limit categories and departure lines; capture report headings/ledger event labels/map-gap treatment; deadline unfinished-requirement rows; breakdown factual explanations with surrender staging; Restart Attempt labels; and bilingual test fixtures.

### World/UI/audio/George feedback

Gate verdicts stay compact and attached to the choice; results visually preserve the same reasons. The four-lane HUD keeps George and current task distinct. George uses one concise live sentence per prompt/threshold/readback beat, never an invented inner want. Capture presentation reads as a restrained Hidzu Corporation incident report and partial map, not an omniscient replay. Cause-specific semantic cues may differ, but missing audio never changes state.

### Failure and recovery

Every nonterminal gate failure commits once, enters a worse real state/path, and cannot reroll on reopen. Only the final failed capture escape enters `failure.capture`. Capture report data is rejected if it contains an unobserved position, unknown tampering, nonexistent Needle verification, or a connected segment across an unseen gap. Deadline derives only unfinished requirements; breakdown derives only the Paranoia ledger. Restart Attempt restores `OperationAttemptBaseline`; overlay/UI transients are discarded.

### Explicit exclusions

- No RNG/roll animation, hidden math, generic “failed” wall, universal evidence levels, automatic manifest copy, extra copy gate, full-route reconstruction, fake capture at midnight, or shared generic failure screen.
- No George hidden silence, free text, deletion/freedom arc, automation, invented knowledge, George/current-task merge, Bible epigraph decoration, or Observation vignettes.
- No change to surveillance geometry/causality owned by T8A or city/audio content owned by T10A.

### Dependencies and OPEN blockers

Depends on T8A and the completed GET-179 modernization milestone plus delivered T7A/T9 foundations. Blocks T10A. Critical/high blockers include `OPEN-ABL-001`, `OPEN-NAR-004`, `OPEN-NAR-005`, `OPEN-NAR-007`, `OPEN-NAR-008`, `OPEN-NAR-009` through `OPEN-NAR-011`, `OPEN-NAR-014`, `OPEN-NAR-015`, `OPEN-UI-001` through `OPEN-UI-003`, `OPEN-LOC-001`, `OPEN-ACC-001`, and `OPEN-SAFE-001`. `OPEN-NAR-002` and `OPEN-PAR-002` are resolved.

### Canonical decisions/spec sections

Implements `GDR-RPG-007`, `GDR-RPG-009`, `GDR-PAR-009`, `GDR-FACT-002`, `GDR-GEO-004`, `GDR-SAFE-001`, `GDR-FAIL-001`, `GDR-PAR-007`, and the existing dialogue/fact/HUD decisions. Canonical detail is in [[90 Dialogue]], [[46 Facts, Dossier, Minimap & Terminals]], [[40 George (AI Companion)]], [[45 HUD & Information Architecture]], [[43 Failure, Surrender & Recovery]], [[44 Safehouse, Save & Restart Attempt]], [[13 Level 0 Content and State Matrix]], [[04 Engineering/Architecture]], and [[04 Engineering/Roadmap]] T9A.

### Human-play acceptance

- Compare preview/result for every gate and verify identical verdicts/reasons; execute every fail-forward route and the one final-capture exception.
- Reach `unknown`, Naila warning, manifest recognized, and manifest copied; verify exact five-minute cost, no gate, idempotency, persistence, and optional completion.
- Ask George across known, undiscovered, non-networked, and unavailable contexts; verify explicit reasons, no hidden silence/arc, separate lanes, threshold history, and exact departure readback.
- Trigger capture with sparse/dense evidence and inspect disconnected gaps; trigger deadline/breakdown and prove zero borrowed capture content.
- Restart from each failure and verify exact baseline; repeat at all target viewports/languages using normal controls.

### Documentation and validation obligations

Update Dialogue/Facts/George/HUD/Failure/Safehouse specs, Architecture, state matrix, readiness, localization, and the child progress note. Add breakdown parity, catalog fail-forward, Cold Iron transition/copy/persistence, George-limit, baseline presentation, capture non-disclosure, cause-specific failure, pause/focus, and bilingual tests. Inspect live overlays/maps at all viewports. Run Improvement closeout only after normal-control acceptance; no DOM/fixture proof substitutes for legibility/truth.

## T10A — Make curfew, routes, recovery, and street sound live in the city

- **Label:** Improvement
- **Initial state:** Todo
- **Project:** MVP
- **Parent:** GET-210

### Why this ticket exists

The 30× clock, traversal loops, and Paranoia economy are structurally present but remain HUD abstractions unless the street changes around them. T10A turns time into visible/audible city behavior, names the three routes in fiction, and gives the player authored grounding choices that trade scarce world time for relief rather than creating passive regeneration.

### Player promise

At 21:00, 21:30, 22:00, and 23:30 the street visibly and audibly tightens: announcements, shutters, crowds, lighting, and last-train cues make the deadline felt. Locals/signage call the loops Transit Road, Market Ring, and Outer Space. The player can spend ten minutes at vending-machine coffee or a shrine for ten Paranoia relief once each, hears George warn once at 40/70/90, and can locate life behind three street thresholds.

### Starting state

- T10 owns mission content/integration; T9A has delivered legible gates/evidence/George/failure behavior.
- T3 provides the 30× clock/schedule/loop IDs; T3A baseline includes processed boundaries/recovery history.
- T8A provides the qualifying difficult-surveillance-escape event and visible-only civilian reaction rules.
- Exact pacing, civilian placement/counts, final audio content/priority/ducking, layout anchors, and some lighting values remain updated `OPEN-*` acceptance items.

### Complete player flow

1. Travel `loop.public-contact`, `loop.logistics-service`, and `loop.outer-escape`; see/hear Transit Road, Market Ring, and Outer Space in signage/civilian/George content.
2. Cross 21:00, 21:30, 22:00, and 23:30 through real-time play, Wait, pause/resume, and save/restore; each boundary changes the street exactly once.
3. Approach the Transit Road restaurant, Market Ring workshop, and safehouse-side apartment and hear spatial ambience leak naturally at their thresholds.
4. Explicitly buy/use vending-machine coffee on Transit Road: +10 world minutes, −10 Paranoia, once per attempt.
5. Explicitly ground at the shrine near the Market Ring/Outer Space junction: +10 world minutes, −10 Paranoia, once per attempt.
6. Trigger one qualifying difficult surveillance escape for −5 once, and cross 40/70/90 so George speaks each line once.
7. Restart Attempt and verify all boundary/grounding/threshold/escape history returns to the baseline.

### System rules and state transitions

Clock boundaries are stable idempotent IDs at 21:00/21:30/22:00/23:30 and persist in `processedBoundaryIds`. Pause never advances time; explicit jumps process every crossed boundary once in order. Stable loop IDs remain unchanged; localized display keys yield Transit Road, Market Ring, and Outer Space. Each typed grounding action costs exactly ten world minutes, applies exactly −10 Paranoia, requires explicit confirmation/interaction, and has `usesPerAttempt: 1`. Difficult-escape relief is exactly −5 once. George threshold history is exactly 40/70/90 once per attempt. Dialogue grants no grounding relief.

### Internal milestones and proof gates

1. Add/validate localized loop display names without changing internal IDs or topology.
2. Author four boundary event bundles and idempotent processing across frame progression, Wait/Rest, pause, autosave/hydration, and baseline restore.
3. Author civilian/schedule/shutter/signage/light/audio changes for each boundary using approved or reversible provisional values.
4. Implement both typed one-use grounding definitions, exact confirmation previews, time/resource events, and baseline persistence.
5. Integrate the one difficult-escape relief and 40/70/90 George history/content.
6. Spatialize the three authored ambient sources and validate falloff/priority/ducking.
7. Prove bilingual normal-control routes and pacing at all viewports.

### Content requirements

Provide loop display-name keys and signage/civilian/George usages; four boundary IDs with PA/shutter/crowd/light/last-train changes; two grounding anchors/interactions/confirmations/used states; three George threshold lines per language; one qualifying escape feedback; Transit Road restaurant, Market Ring workshop, and safehouse apartment ambience emitters; subtitle/caption labels; schedule states; and persistence/acceptance fixtures.

### World/UI/audio/George feedback

The city carries time through restrained PA announcements, shutters, crowd thinning, practical-light changes, and last-train chimes; the HUD remains truthful but secondary. Ambient sound leaks through believable thresholds rather than flat global loops. Grounding has a small human animation/text/audio beat, not a vignette or collectible. George says one concise authored threshold line, names routes where useful, and never supplies hidden navigation or relief himself.

### Failure and recovery

A boundary bundle is idempotent: duplicate frame/save/jump evaluation cannot replay effects/audio/state. A used grounding action stays unavailable with a truthful reason until Restart Attempt; insufficient time or invalid interaction cannot apply partial effects. Deadline behavior remains T9A's unfinished-requirement report. Missing audio cannot block a boundary/resource transition and must fall back to text/visual cues. Restart Attempt restores exact processed/used/announced history from baseline.

### Explicit exclusions

- No passive Paranoia regeneration, proximity grounding, repeated farming, dialogue relief, third grounding spot, real-time waiting requirement, route-ID rename, procedural crowd simulation, random ambience, or voice-acting requirement.
- No Observation vignettes, Health injury effects, surveillance causality changes, actor tint implementation, or topology redesign.
- No final tuning claim while pacing/civilian/audio/layout OPEN items remain unaccepted.

### Dependencies and OPEN blockers

Depends on T9A and existing GET-210 city/content prerequisites; blocks T10B and final GET-139 acceptance. Relevant provisional blockers include `OPEN-TIME-001`, `OPEN-CIV-001`, `OPEN-LAYOUT-003` through `OPEN-LAYOUT-005`, `OPEN-AUD-001`, `OPEN-LOC-001`, `OPEN-ACC-001`, and `OPEN-PERF-001`. Approved exact boundary times, route names, grounding values, difficult relief, and threshold counts cannot be changed by tuning.

### Canonical decisions/spec sections

Implements `GDR-TIME-004`, `GDR-SET-007`, `GDR-AUD-002`, `GDR-SOC-002`, `GDR-PROD-005`, `GDR-PAR-006`, and `GDR-PAR-007`, with existing time/schedule/safehouse/audio decisions. Owns the reactive advisories (per `OPEN-SOC-001`), the sparse civic clock anchors, per-area tension identities, and relief geography. Canonical detail is in [[80 Day-Night Cycle]], [[20 Setting & Worldbuilding]], [[49 Audio]], [[60 Paranoia]], [[44 Safehouse, Save & Restart Attempt]], [[13 Level 0 Content and State Matrix]], [[04 Engineering/Architecture]] time/audio sections, and [[04 Engineering/Roadmap]] T10A.

### Human-play acceptance

- Traverse all three loops and verify every player-facing name in English/Ukrainian while stable IDs remain unchanged.
- Cross each clock boundary by live time, explicit jump, and save/pause restoration; verify exactly-once street/audio/schedule effects.
- Use each grounding action once, verify +10/−10 exactly, reject repeat use, and confirm Restart Attempt restoration.
- Trigger one difficult-escape −5 and threshold lines at 40/70/90 once each, including large jumps and restoration above a threshold.
- Inspect/hear each required ambient location, all clock states, and civilian schedule changes at 1280×720, 1440×900, and 1920×1080 in both languages.

### Documentation and validation obligations

Update Time/Setting/Audio/Paranoia/Safehouse specs, Architecture, state matrix, readiness, localization/audio/schedule manifests, and the child progress note. Add boundary-idempotency, pause/jump/save/restore, loop-display parity, grounding one-use/effects, threshold history, difficult-relief, emitter/priority/fallback, and bilingual tests. Capture/inspect all four clock states and three sound thresholds. Run Improvement closeout only after live behavior/audio acceptance.

## T10B — Blend actors into authored street lighting

- **Label:** Improvement
- **Initial state:** Todo
- **Project:** MVP
- **Parent:** GET-210

### Why this ticket exists

Grounded sprites can still look pasted over the accepted painted city when they ignore its practical light pools. Actor position and foot anchors already exist, and the world manifest already owns authored geometry/light semantics. T10B adds the smallest presentation-only bridge: sample authored amber/cyan light regions at the actor's feet and ease a restrained tint without changing gameplay.

### Player promise

As the protagonist, contacts, civilians, and security move beneath sodium lamps or near connected screens, they subtly inherit the street's amber/cyan light and feel seated in the same painting. Transitions are smooth, silhouettes remain readable, identity colors are not crushed, and the lighting never changes whether anyone can see, reach, or catch the player.

### Starting state

- T10A has delivered accepted city clock/content placement and its live states; T5 supplies authored practical-light pools; T6 supplies stable actor origins/foot anchors.
- The visual manifest can be versioned with `ActorLightRegion` metadata without changing gameplay topology.
- `OPEN-ART-005` keeps final strength/feather tuning open. Its reversible baseline is strongest-region-only blending, 250 ms easing, and restrained semantic amber/cyan intensity.
- All runtime/art/actor changes wait for the separately committed specification and predecessor gates.

### Complete player flow

1. Stand outside all light regions and see the actor's neutral authored palette.
2. Walk the actor's foot anchor into an amber region; observe one restrained 250 ms transition.
3. Cross into a cyan region and through an overlap; observe strongest-region-only selection with no flicker.
4. Leave every region and ease back to neutral.
5. Repeat with protagonist, contacts, civilians, and security across all four clock states and camera zooms.
6. Replay equivalent movement/detection/interaction scenarios and verify tint never changes gameplay state.

### System rules and state transitions

`ActorLightRegion` contains stable ID, world polygon, semantic tint (`amber | cyan`), intensity, and priority. The renderer samples the actor's authoritative foot anchor, selects the strongest containing region under the provisional baseline, resolves semantic palette tokens, and eases visual tint over 250 ms. Neutral applies when no region contains the anchor. The result is frame-local presentation only and may not enter visibility, surveillance, recognition, movement speed, collision, interaction range, schedule, AI, knowledge, save, or outcome calculations.

### Internal milestones and proof gates

1. Author/validate region metadata against accepted practical lights and world projection; reject orphaned, invalid, or out-of-bounds regions.
2. Implement one deterministic foot-anchor sampler and semantic-token resolver independent of actor class.
3. Implement strongest-region selection, 250 ms easing, neutral return, overlap/boundary stability, and reduced-motion/accessibility behavior as approved.
4. Add dependency tests proving gameplay modules cannot import/use tint output.
5. Integrate every required actor type and all clock/light states without per-actor magic values.
6. Capture and internally inspect all target viewports/languages; tune only through `OPEN-ART-005` data.

### Content requirements

Provide stable `ActorLightRegion` records for accepted sodium/connected-screen pools; semantic amber/cyan palette tokens; intensity/priority/feather configuration; neutral fallback; manifest version/validator rules; boundary/overlap fixtures; actor/clock-state capture scenarios; and performance diagnostics. Region metadata names its source light/scene layer and cannot substitute synthetic geometry.

### World/UI/audio/George feedback

Tint is subtle environmental integration, not an outline, aura, alert, or status color. It applies to world actors only, keeps portraits/HUD/George AR governed by their own presentation, and preserves Pursuit/crimson semantics. No extra audio, text, tutorial, or George line is required because lighting has no gameplay meaning.

### Failure and recovery

Missing/invalid region metadata fails the production validator and falls back observably to neutral actor color; fallback cannot pass visual acceptance. Region crossings cannot accumulate tint, flicker between equal regions, persist after scene/run replacement, or serialize into saves. Restart Attempt/New Game rebuild presentation from current position/light state with no retained tween. Performance failure rolls back the isolated tint layer, not gameplay or source art.

### Explicit exclusions

- No detection, visibility, stealth, recognition, movement, collision, interaction, schedule, Paranoia, civilian-behavior, dialogue, fact, or outcome effect.
- No dynamic global illumination, per-pixel light simulation, arbitrary per-actor color, crimson gameplay tint, bloom, outline, shadow-system rewrite, baked actor, or source-scene geometry replacement.
- No final intensity/feather claim before `OPEN-ART-005` live requester review.

### Dependencies and OPEN blockers

Depends on T10A and the accepted T5/T6 city-light/foot-anchor foundations; blocks final GET-139 visual acceptance. `OPEN-ART-005` owns final intensity/feather. `GDR-ART-014` already owns actor/world proportion and cannot grant tint gameplay authority; `OPEN-ACC-001` and `OPEN-PERF-001` may affect surrounding visual/performance acceptance. `GDR-ART-013` owns environment-state delivery only and cannot grant actor tint gameplay authority.

### Canonical decisions/spec sections

Implements `GDR-ART-011` and the presentation-only portions of `GDR-ART-001`, `GDR-ART-005`, and the accepted semantic palette rules. Canonical detail is in [[30 Art Direction (MVP)]], [[48 Actors & Portraits]], [[42 Surveillance, Security & Civilian Behavior]] exclusion boundary, [[04 Engineering/Architecture]] `ActorLightRegion`, [[13 Level 0 Content and State Matrix]] visual acceptance rows, [[14 Specification Review Queue]] `OPEN-ART-005`, and [[04 Engineering/Roadmap]] T10B.

### Human-play acceptance

- At 1280×720, 1440×900, and 1920×1080 in English/Ukrainian, inspect protagonist/contact/civilian/security actors entering/leaving amber and cyan regions, overlaps, and neutral streets across all four clock states.
- Verify foot alignment, strongest-region selection, 250 ms easing, restrained intensity, no flicker/pop/color crush, and readable identities at normal/minimum zoom.
- Replay camera observation, rule-break detection, pursuit, hiding/blending, movement timing, collision, interaction, and civilian schedule cases with tint enabled/disabled; domain outcomes must be byte/state equivalent.
- Corrupt/remove metadata and verify neutral observable fallback plus validator failure; inspect performance evidence on the approved target once defined.

### Documentation and validation obligations

Update Art Direction, Actors, Architecture, art/actor manifests, state-matrix/readiness visual rows, and the child progress note. Validate region provenance/bounds/IDs/tokens, foot-anchor sampling, overlap/boundary/easing, neutral fallback, dependency isolation, scene teardown, performance, and fixed captures. Use live inspected frames as acceptance; metadata counts/tests are supporting evidence. Run sprite validation if actor manifests change and the full Improvement closeout only after requester visual acceptance.
