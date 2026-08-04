---
status: MVP
type: implementation-program
parent: GET-139
canonical: true
---

# Linear Implementation Program

This document is the copy source for the ten GET-139 child issues. Each description is deliberately self-contained: a Linear issue may link back here and to the canonical specifications, but those links do not replace the behavior, boundary, evidence, and recovery contract embedded in the issue itself.

These aliases and exact Linear keys are authoritative for the implementation program.

| Alias | Exact Linear key | Title | Label | Initial state | Blocks |
|---|---|---|---|---|---|
| T1 | GET-201 | Canonical game-design bible and decision register | Improvement | In Progress | T2–T10 and GET-139 |
| T2 | GET-202 | Recover the canonical pre-rewrite foundation | Improvement | Todo | T3 and all runtime implementation |
| T3 | GET-203 | Level 0 runtime and shared outdoor-layout contract | Feature | Todo | T4, T7, T8, T9, T10 |
| T4 | GET-204 | Unchanged-kit Tokyo Blender master scene | Improvement | Todo | T5 |
| T5 | GET-205 | Hidzu identity and graphic-surveillance-noir world art | Improvement | Todo | T6 and T10 visual integration |
| T6 | GET-206 | Grounded actors, portraits, and entry-flow presentation | Improvement | Todo | T10 final presentation |
| T7 | GET-207 | Protagonist RPG identity, progression, Health, and Paranoia | Feature | Todo | T8, T9, T10 |
| T8 | GET-208 | Surveillance, security, civilians, hiding, drone, and noncombat escape | Feature | Todo | T9 contextual integration and T10 scenarios |
| T9 | GET-209 | Dialogue, George, facts, dossier, social feed, and four-lane HUD | Feature | Todo | T10 content integration |
| T10 | GET-210 | Tokyo escape content, audio, onboarding, and end-to-end acceptance | Feature | Todo | GET-139 acceptance |

Only T1 may be `In Progress` until the specification package is reviewed, validated, and committed separately. After that entry gate, keep one child active at a time in Roadmap order. A validated committed deliverable may unlock its successor while the predecessor remains `In Review` pending requester verification. Every child blocks GET-139 through final acceptance.

`OPEN-*` items are ticket acceptance/freeze gates rather than a program-wide start gate. Each ticket may implement the queue's recorded recommendation as a reversible provisional trial only when its progress note and Linear comment identify the assumption, implementation seam, live proof, and rollback path. Provisional behavior cannot move beyond `In Review` or be described as final until the requester accepts, changes, postpones, or removes the decision.

## T1 — Canonical game-design bible and decision register

- **Label:** Improvement
- **Initial state:** In Progress
- **Parent:** GET-139

### Why this ticket exists

The repository, runtime, tests, historical progress, and existing Linear program describe several mutually incompatible versions of The Getaway. Earlier sources still present a fixed Operative, Ghost/Wire/Force packages, A* routing, `Pressure`, a sparse four-block compound, tactical combat, AutoBattle, and a three-lane HUD as current intent. The requester rejected that direction and approved a grounded Tokyo surveillance-escape RPG instead. This ticket creates one canonical specification before any recovery or reimplementation can turn another stale checklist into product behavior.

The work is complete only when product rules, lore, system specifications, Architecture, Roadmap, readiness, AGENTS governance, progress evidence, and the ten implementation tickets agree. Historic work remains recoverable evidence, but no completed test, old ticket, or compiling subsystem may outrank the current design.

### Player promise

Although this ticket changes internal documentation rather than the executable game, it protects a concrete player promise: Level 0 will become a 15–20 minute outdoor Tokyo prologue about surveillance, Paranoia, dialogue, hiding, compromised technology, George, practical RPG builds, and escape. It will not become a combat-centric power fantasy or an assembly of disconnected features because an older implementation happened to exist.

The future player can expect a customizable expatriate, a human-scale watched city, two viable infiltration timings, optional contacts, honest facts and checks, explicit medkit recovery and transit validation, recoverable surveillance, a factual debrief, and real progression toward Miami.

### Starting state

- The protected worktree is based on `main` at `49a4da7bed164051cc1fbeba60493ca5de92310f` and has a verified external recovery archive recorded in `progress/GET-139.md`.
- Draft canonical documents exist but require full contradiction, template, link, decision-ID, and ticket-traceability review.
- GET-139 still has stale implementation children and relationships in Linear.
- Only T1 is eligible to be `In Progress`; no gameplay, runtime, production-art, or player-facing content change is authorized by this ticket.
- `OPEN-NAR-003` and `OPEN-ART-001` remain explicit review items. Their recommended baselines are not approved values.

### Complete player flow

The specification must describe the entire normal-control experience without gaps: New Game; callsign, appearance, attribute, and skill creation; 18:30 safehouse opening; Lira briefing; optional Naila and Brant preparation; deliberate dusk or curfew timing; direct movement and full-pause observation; camera, civilian, security, terminal, hiding, blending, and verifier-drone decisions; explicit medkit recovery; optional manifest recognition; Clear/Suspicious/Pursuit escape; explicit Lira handoff; outbound-terminal validation before midnight; safehouse recovery and level-up; factual debrief; and `Continue Exploring` or `End Demo`.

The documents must also define the Health, Paranoia, capture, deadline, incompatible-save, and deterministic Retry paths. Every step names starting state, authoritative transition, player-visible feedback, forbidden shortcut, and human-play evidence.

### System rules and state transitions

Use [[12 Game Design Decision Register]] as the atomic status ledger: `Approved`, `Removed`, `Postponed`, or `Superseded`, with rationale, player effect, provenance, canonical owner, ticket owner, and historic rating only where actually recorded. Normative system-specification sections 1–12 and 15–16 contain current Approved behavior. Required sections 13 and 14 may summarize removed behavior and Post-MVP extensions only when explicitly labeled non-current; the register and clearly historical records retain the complete rejected, postponed, and superseded detail.

Every per-system specification must contain the shared sixteen sections from player fantasy through owning ticket. Every unresolved required value receives an existing stable `OPEN-*` entry with a recommended baseline and blocked tickets. The precedence order is current requester directive, Decision Register, canonical product/system/lore specification, Linear issue, Architecture, then tests/runtime/history as evidence.

### Internal milestones and proof gates

1. Complete the Game Design hub, MVP Spine, Level 0 contract, Decision Register, content/state matrix, review queue, and all per-system specifications.
2. Reconcile Tokyo/Hidzu with the preserved 2036 Cold Iron campaign and distinguish Hidzu as upstream supplier from Eisenclave as American integrator/operator.
3. Align Art Direction, Architecture, Roadmap, Post-MVP boundary, MVP Readiness, indexes, AGENTS, and `progress/GET-139.md`.
4. Produce this ten-ticket copy source and then create self-contained Linear issues with exact aliases, labels, states, blockers, and dependency relationships.
5. Run contradiction searches, sixteen-section checks, unique-ID/reference checks, traceability checks, Markdown hygiene, and independent specification review.
6. Present the package and explicit review queue to the requester. Commit documentation separately only after explicit authorization.

### Content requirements

The package must cover product identity; setting; narrative; character creation/progression; Health; Paranoia; movement, interaction, camera, and observation; stealth; surveillance; civilians/security; time and schedules; safehouse/save/Retry; dialogue/checks; George; facts/dossier/minimap/terminals; objectives; social feed; combat and inventory disposition; city/Blender pipeline; actors/portraits; HUD; audio; localization; accessibility; performance; readiness; and delivery governance.

The Decision Register must retain recoverable historic ratings exactly, including the withdrawn `9.2/10` and reviewed `4.5/10` visual assessment, without reconstructing missing ratings.

### World/UI/audio/George feedback

This ticket defines rather than implements feedback. The package must specify graphic surveillance noir, human-scale continuous city form, truthful surveillance geometry, the four-lane 16–18% dock, always-visible Health and Paranoia, world-visible paused overlays, one-function terminals, knowledge-limited minimap, bounded George prompts and private AR presence, and required audio families. It must state which values remain open instead of turning recommendations into silent production constants.

### Failure and recovery

If sources conflict, do not reconcile them by compromise or by whichever implementation is easiest. Identify the conflict, use the precedence order, record the rejected/superseded rule, and update every downstream owner. A missing decision becomes an `OPEN-*` blocker. A broken link, duplicate ID, unmapped decision, incomplete ticket, or active stale rule fails this ticket's gate.

The verified archive remains the recovery path for protected work. No reset, restore, deletion, or selective salvage occurs here.

### Explicit exclusions

- No gameplay/runtime/schema implementation, player-facing content production, or production-art mutation.
- No silent approval of recommended `OPEN-*` baselines.
- No new parallel design archive outside `memory-bank/`.
- No F1 help/codex feature.
- No resurrection of removed systems as “future flexibility.”
- No commit, ticket `Done`, or GET-139 closure without requester authorization and verification.

### Dependencies and OPEN blockers

Gate 0's verified recovery snapshot is the prerequisite. T1 blocks T2–T10 and GET-139 until its reviewed package is validated and committed separately. `OPEN-NAR-003` and `OPEN-ART-001` remain represented for their owning later surfaces; they do not block the documentation commit. After the commit, one implementation child may move to `In Progress` under the provisional-trial policy above.

### Canonical decisions/spec sections

Implements `GDR-PROD-001`, `GDR-PROD-002`, `GDR-SET-001`, `GDR-SET-002`, `GDR-SET-004`, `GDR-SET-005`, `GDR-SET-006`, `GDR-PC-004`, `GDR-GOV-001`, `GDR-GOV-002`, `GDR-GOV-003`, `GDR-GOV-005`, `GDR-GOV-007`, and `GDR-SUP-004`.

Canonical sources are [[Game Design]], [[10 MVP Spine]], [[11 Level 0 Vertical Slice Contract]], [[12 Game Design Decision Register]], [[13 Level 0 Content and State Matrix]], [[14 Specification Review Queue]], every system specification in [[01 MVP/00 Index]], [[03 Lore/Plot Bible]], [[04 Engineering/Architecture]], [[04 Engineering/Roadmap]], [[95 MVP Readiness Checklist]], `AGENTS.md`, and `progress/GET-139.md`.

### Human-play acceptance

No runtime play acceptance is claimed. Specification acceptance means a reviewer can trace each step of `AC-L0-001` through `AC-L0-019` from player action to state transition, content owner, feedback, failure/recovery rule, and ticket without relying on old code. A reviewer must also find no current claim for fixed Operative/Trace, packages, A*, Pressure, tactical combat, AutoBattle, the rejected compound, fantasy actors, procedural narrative, deep inventory, or a three-lane HUD.

### Documentation and validation obligations

Run a full current-doc contradiction search; validate all sixteen headings; validate unique `GDR-*`, `OPEN-*`, fact, check, objective, state, failure, terminal, and acceptance IDs; verify bidirectional decision/document/ticket references; inspect every Linear child after creation for exact label/state/parent/blocker/dependency data; and run `git diff --check`. Record evidence and unresolved risks in `progress/GET-139.md`. Keep T1 nonterminal until requester review and authorized documentation commit.

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

The rejected Level 0 was a sparse tactical board whose routing, anchors, camera, HUD focus, persistence, and art semantics drifted independently. The new city needs one gameplay-owned outdoor contract before Blender composition or system integration can be trustworthy. T3 establishes the runtime spine: three traversable city loops, direct movement, explicit interaction, camera/observation behavior, deterministic time/pause ownership, safehouse actions, and distinct autosave/Retry infrastructure.

This ticket owns foundations, not final surveillance mechanics, RPG tuning, UI content, or production art.

### Player promise

The protagonist begins at 18:30 in a readable outdoor safehouse boundary and can move through a continuous Tokyo greybox using click or WASD without A* choosing a route. Movement responds immediately, slides along walls and corners, and reports invalid destinations honestly. The player can inspect known information in full-pause Observation, use explicit interactions, wait or Rest safely, choose dusk or curfew timing, and trust that failure Retry will return to the exact operation-departure state.

All mandatory places are reachable through three interlocking loops; no building, input layer, or camera transition steals control or hides a required anchor.

### Starting state

- T1 has a reviewed, validated, committed deliverable and T2 has produced a reproducible bootable foundation; either predecessor may remain `In Review` pending requester verification.
- Exact layout dimensions, loop geometry, street widths, anchors, safehouse boundary, actor movement tuning, and default camera framing remain T3 acceptance decisions; use only their recorded `OPEN-*` recommendations as reversible provisional layout/configuration data.
- The world is outdoor-only; no full interior is required.
- T3 begins from topology and measured greybox behavior. It must not shape the map around old 54×38, 96×72, four-block, nine-parcel, or existing sprite-collage assumptions.

### Complete player flow

1. New Level 0 initializes the protagonist inside the safehouse at 18:30 with a current-run autosave, no departure Retry snapshot, and the Lira objective.
2. The player reads available safehouse actions, moves directly with click or WASD, and interacts explicitly with Lira/contact/terminal/entrance placeholders through typed range, visibility, occlusion, ownership, and availability results.
3. After accepting the operation, the player may Wait in confirmed 30-minute steps or Rest for 30 minutes, Health 100, and Paranoia −40.
4. Explicit operation departure creates one immutable Retry snapshot and starts the active route.
5. The player can reach public and service entrances, all contact and terminal anchors, cache/manifest anchors, camera/device regions, hiding/blending anchors, and the return path across three connected loops without pathfinding.
6. Observation pauses clock, schedules, cameras, actors, drone placeholders, and movement while allowing camera pan/read-only inspection of known state.
7. Reload, failure Retry, and New Game rebuild the scene, camera, focus, time, and saved state without stale listeners or overlays.

### System rules and state transitions

`Level0LayoutContract` is authoritative for district bounds, zones, traversal loops, surfaces, building footprints, entrances, occluders, contacts, terminals, cameras, drone regions, hiding/blending contexts, objectives, interaction/audio anchors, semantic masks, art-layer IDs, and 64×32 2:1 projection metadata. Phaser and Blender consume the same versioned contract.

Click stores one direct world-space intent; WASD stores directional intent; any new input replaces the previous intent. Local collision sliding is allowed, but no A*, queue, safest-path calculation, threat-aware steering, or automatic door traversal exists. Invalid clicks return a typed reason and optional nearest reachable marker without routing there.

The world clock starts 18:30, advances at 30× only during unpaused exploration, enters curfew at 22:00, and reaches the operation deadline at 00:00. Pause is an additive owner set. Autosave and the once-per-attempt departure snapshot are separate versioned records.

Safehouse entry and action availability while directly observed, `Suspicious`, or `Pursuit` is an explicit unresolved domain seam under `OPEN-SAFE-001`. T3 may expose typed state and unavailable reasons, but it cannot assume that crossing the boundary clears surveillance or enables recovery/planning actions.

### Internal milestones and proof gates

1. **Layout draft:** define three loops, outdoor safehouse, public/service approaches, Lira/Naila/Brant, three terminals, cameras, drone regions, minimum hiding/blending contexts, cache, manifest, and return/validation anchors.
2. **Movement proof:** measure the outer loop at two to three minutes using approved tuning or the isolated reversible `OPEN-MOV-002` recommendation; prove click/WASD parity, immediate override, wall/corner/alley sliding, invalid-click feedback, and no path request.
3. **Interaction proof:** exercise every target type and every available/too-far/blocked/occluded/unavailable result through normal input.
4. **Pause/focus proof:** open/close every declared pause surface and Observation beside active autonomous state; prove zero clock/simulation leak and no sacrificial click.
5. **Persistence proof:** distinguish autosave from immutable departure Retry; prove compatible hydration, exact restoration, and honest retired-schema rejection.
6. **Projection proof:** compare runtime collision/debug geometry, markers, entrances, masks, and Blender input from one contract.

### Content requirements

Author the semantic layout record, zones, three loop identities, roads/sidewalks/alleys/crossings/plazas/service areas, footprints, entrances, safehouse/departure action, contact/device/objective anchors, minimum contexts from [[13 Level 0 Content and State Matrix]], schedule hooks, and diagnostic labels. Author typed interaction reasons, pause owners, world-clock boundaries, Wait/Rest/departure confirmations, save envelopes, and incompatibility copy keys without freezing unresolved narrative prose.

### World/UI/audio/George feedback

Greybox surfaces must distinguish walkable, blocked, entrance, interaction, and observation semantics without pretending to be final art. Destination markers show intent/rejection; world prompts name range/occlusion/availability; the camera follows the current protagonist after load/restart and restores follow after Observation. HUD time/curfew/deadline and safehouse previews reflect authoritative state. Audio events are semantic hooks only; T10 authors production cues. George can explain verified current objective, time, known blockers, and safehouse actions through T9 later, but T3 never routes or acts for the player.

### Failure and recovery

At 00:00, the domain issues deadline failure while either medkit return or transit validation remains incomplete; final mission content is integrated by T10. Retry restores identity/build payload, resources, exact departure time, facts/contacts/knowledge, mission/objectives, safehouse state, position, and deterministic generation while clearing all later runtime state. Incompatible rewrite saves explain New Game and never partially hydrate. A topology, anchor, or projection mismatch fails the gate and is fixed at the layout source rather than disguised in rendering. Safehouse arrival under active surveillance follows the approved or explicitly provisional `OPEN-SAFE-001` rule and cannot become an undocumented state reset.

### Explicit exclusions

- No A*, navigation mesh route execution, click queue, automatic route choice, threat-aware steering, or minimap movement.
- No final Hidzu art, actor production, surveillance-state mechanics, dialogue content, RPG balancing, or mission integration.
- No full interiors, decorative clutter, old compound geometry, or art-defined collision.
- No automatic pickup, proximity completion, background simulation under pause, silent save migration, or post-departure snapshot overwrite.

### Dependencies and OPEN blockers

Depends on T2. Blocks T4, T7, T8, T9, and T10. Critical acceptance blockers are `OPEN-NAR-007`, `OPEN-TIME-001`, `OPEN-MOV-001`, `OPEN-CIV-001`, `OPEN-SEC-001`, `OPEN-LAYOUT-001`, `OPEN-LAYOUT-002`, `OPEN-LAYOUT-003`, `OPEN-LAYOUT-005`, and `OPEN-SAFE-001`. High acceptance blockers are `OPEN-NAR-013`, `OPEN-MOV-002`, `OPEN-MOV-003`, and `OPEN-LAYOUT-004`. These items do not block ticket start after T2; any recorded recommendation encoded before approval is a reversible provisional trial documented with its seam, live proof, and rollback path.

### Canonical decisions/spec sections

Implements `GDR-PROD-004`, `GDR-SET-002`, `GDR-MIS-006`, `GDR-TIME-001` through `GDR-TIME-003`, `GDR-MOV-001` through `GDR-MOV-003`, `GDR-INT-001`, `GDR-OBS-001`, `GDR-OBS-002`, `GDR-STL-001`, `GDR-ART-002`, `GDR-ART-004`, `GDR-REM-003`, `GDR-REM-008`, `GDR-SUP-001`, and `GDR-SUP-002`.

Canonical detail is in [[11 Level 0 Vertical Slice Contract]] starting state, movement, observation, time, safehouse, and save sections; [[13 Level 0 Content and State Matrix]] sections 1–3, 7–8, 12–13; [[41 Movement, Interaction & Observation]]; [[44 Safehouse, Save & Retry]]; [[80 Day-Night Cycle]]; [[04 Engineering/Architecture]] sections 3–7 and 11–12; and [[04 Engineering/Roadmap]] Gate 3.

### Human-play acceptance

- Complete `AC-L0-001` through safehouse/Lira reachability with first meaningful decision under three minutes after content integration.
- Reach every mandatory anchor by both input methods without any pathfinding request.
- Traverse walls, corners, narrow alleys, entrances, and all three loops without sticking, tunneling, or stale intent.
- Open Observation and every available overlay next to active clock/schedule diagnostics; prove all simulation freezes and focus returns cleanly.
- Wait, Rest, depart, alter the run, fail through a diagnostic boundary, and Retry; prove exact departure restoration.
- Reach/cross the safehouse boundary while observed, Suspicious, and in Pursuit; prove typed unavailable reasons and the approved or explicitly provisional `OPEN-SAFE-001` behavior without an automatic clear (`AC-L0-019`). Provisional proof informs review but does not close final acceptance.
- Inspect debug geometry against collision, interaction, entrance, minimap, mask, and Blender coordinates; no edge disagreement or unreachable required target remains.

### Documentation and validation obligations

Update Architecture only for implemented ownership/data flow, the layout/content schema, Building Positioning Runbook inputs, MVP Readiness evidence states, and `progress/GET-203.md`. Add focused tests for layout validation, reachability without pathfinding, movement override/sliding, interaction results, pause ownership, clock boundaries, camera reset, save envelopes, snapshot immutability, and incompatibility. After live proof and requester acceptance, run relevant validators plus the AGENTS closeout suite and guided AI regression; record human evidence separately because automation cannot accept movement feel or layout readability.

## T4 — Unchanged-kit Tokyo Blender master scene

- **Label:** Improvement
- **Initial state:** Todo
- **Parent:** GET-139

### Why this ticket exists

The prior visual revamp failed at the city-assembly level: independent 2D building plates had inconsistent scale and angle, floated on flat roads, exposed seams when zoomed out, and read as isolated landmarks on a board. T4 proves the urban foundation before any Hidzu reskin. It composes the owned Neo Tokyo 2 geometry unchanged in one Blender master scene, aligned to the gameplay contract, so building mass, streets, loops, public realm, lighting, and projection are judged as a city rather than as an asset checklist.

### Player promise

At normal view and the 0.60 floor, the player sees a continuous, human-scale Tokyo district with street walls, crossings, sidewalks, alleys, service access, plazas, recognizable landmarks, and all three traversal loops. Buildings sit in the public realm instead of floating on slabs. Actors and entrances remain readable. Dusk, blue-hour, and curfew layers remain registered to the same geometry. Maximum normal zoom-out shows no repeated plates, clipping, voids, mismatched angles, or corruption.

### Starting state

- T3 has an accepted `Level0LayoutContract`, projection, mandatory anchors, semantic masks, and measured route geometry.
- Owned source pack: `/Volumes/Elements/Backup/Downloads/Game/Neo Tokyo 2`.
- Authoring environment: Blender 5.0.1; runtime projection: 64×32, 2:1 isometric; upper-left light direction.
- `OPEN-ART-002` must resolve exact asset selection, license, provenance, transformations, and prohibited committed geometry before master-scene production.
- This ticket starts with unchanged kit composition. Graphic treatment, propaganda, surveillance identity, and Hidzu reskin belong to T5.

### Complete player flow

The player is not asked to interact with Blender. The delivered environment must support the T3 flow visually: safehouse opening; route to Lira; optional Naila/Brant loops; public delivery approach; curfew service approach; camera/terminal/hiding/blending locations; cache and manifest area; escape/return path; and outbound validation. From each route, the player can identify the next spatial decision from street hierarchy and landmarks without permanent labels or a glowing path. The same world remains coherent as time moves from dusk through curfew and as the camera pans or reaches the 0.60 floor.

### System rules and state transitions

The art lifecycle is `LAYOUT_CONTRACT → UNCHANGED_KIT_COMPOSITION → TECHNICALLY_VALIDATED_COMMIT → REQUESTER_COMPOSITION_ACCEPTANCE`. A validated committed T4 deliverable unlocks a reversible T5 trial while T4 remains non-terminal pending requester judgment. Blender consumes gameplay-owned bounds, surfaces, footprints, entrances, occluders, and anchors; it may refine visual mass within the contract but cannot silently move required gameplay semantics. If composition reveals a genuine topology problem, reopen T3 through a documented layout decision rather than editing collision to fit a render.

One camera, scene, scale system, public-realm model, and upper-left light rig govern all geometry. Dusk, blue-hour, and curfew exports share camera, origin, layer boundaries, masks, anchors, and geometry. Raw licensed source and generated `.blend` files remain outside Git; only permitted flattened derivatives, manifests, recipes, metadata, and validators are versioned.

### Internal milestones and proof gates

1. Inventory selected source assets and record license/provenance, transformations, scene role, and commit boundary.
2. Establish one deterministic Blender scene recipe, 2:1 camera, world origin, unit/scale convention, public-realm materials, and upper-left light.
3. Compose safehouse, contacts, logistics site, three loops, public/service entrances, landmarks, and street walls without adding Hidzu treatment.
4. Measure architecture against actor placeholders, entrances, road/sidewalk widths, line-of-sight needs, and two-to-three-minute outer-loop geometry.
5. Export aligned ground, architecture-back/front, lighting foundation, semantic masks, and anchor metadata; validate against T3.
6. Capture 1280×720, 1440×900, and 1920×1080 at default framing and 0.60, including a full overview.
7. Obtain requester acceptance before T4 can be accepted, promoted, or treated as final. A technically validated committed T4 may unlock the reversible T5 trial, but signage, fog, grading, or post-processing cannot convert weak composition into accepted composition.

### Content requirements

The master scene must include authored roads, sidewalks, curbs, crossings, alleys, plazas, setbacks, entrance aprons, service/public spaces, skyline/massing, and enough gameplay-serving public furniture to make hiding/blending/device anchors credible. Maintain a source manifest, scene recipe, import transforms, camera settings, material/light setup, layer registry, semantic-mask mapping, anchor export, derivative inventory, fallback metadata, and reproduction instructions.

### World/UI/audio/George feedback

This ticket supplies world hierarchy, not final UI or audio. Ground/surface material separation, building bases, entrances, landmarks, and route transitions must remain visible behind the future four-lane HUD. Actor placeholders establish scale and occlusion without final assets. Lighting foundations preserve readable midtones and visible practical-source locations but do not yet add Hidzu-specific cyan/crimson semantics. Audio anchors and George references may be exported as semantics; production cues and prompts remain T10/T9 work.

### Failure and recovery

The visual gate fails on sparse-board composition, monumental scale that erases actors, angle mismatch, floating foundations, dead public space, unreadable entrances, blocked required sightlines, layer seams, upscaled blur, zoom-out corruption, or mask/anchor drift. Return to scene composition or export registration depending on the measured cause. Do not trim sprites or move collision opportunistically. Versioned recipe/manifests must reproduce the accepted export; fallback art is diagnostic resilience, not acceptance.

### Explicit exclusions

- No Hidzu reskin, propaganda, identity-scanner language, surveillance-noir grading, or final curfew atmosphere.
- No synthetic regeneration of the pack into unrelated architecture.
- No raw licensed geometry or generated `.blend` committed.
- No per-building Phaser collage, opaque parcel slabs, decorative perimeter, or filler clutter.
- No gameplay-rule, actor, dialogue, HUD, surveillance, or mission-content implementation.

### Dependencies and OPEN blockers

Depends on T3. Blocks T5. Critical acceptance blockers are `OPEN-ART-002`, `OPEN-NAR-015`, and `OPEN-LAYOUT-002`; source/license evidence must exist before any licensed derivative is committed. High acceptance blockers are `OPEN-NAR-013`, `OPEN-MOV-003`, `OPEN-LAYOUT-004`, `OPEN-ART-004`, and `OPEN-PERF-001`. The 0.60 normal floor is approved; exact default framing and diagnostic-overview behavior remain open under `OPEN-MOV-003`. Reversible composition/export recommendations may be trialed, but missing license authority is not provisional.

### Canonical decisions/spec sections

Implements `GDR-PROD-004`, `GDR-ART-002`, `GDR-ART-003`, `GDR-ART-004`, `GDR-SUP-001`, and `GDR-SUP-002`. Canonical detail is in [[30 Art Direction (MVP)]] sections 3–6 and 10–15, [[13 Level 0 Content and State Matrix]] section 13, [[41 Movement, Interaction & Observation]] camera requirements, [[04 Engineering/Architecture]] sections 5–7, and [[04 Engineering/Roadmap]] Gate 4.

### Human-play acceptance

At all three target viewports and both default/0.60 framing, a reviewer can trace all three loops, distinguish public and service routes, locate safehouse/contact/depot landmarks at the precision the player knows, and follow entrances without debug overlays. A normal-control traversal shows believable street scale, no blocked required anchor, and no art/collision disagreement. Overview captures show continuous urban mass, coherent angle/scale/light, no empty board, no repeated plate, and no corruption. Requester screenshot acceptance is mandatory before T4 final acceptance or runtime promotion; it is not a prerequisite for the explicitly provisional T5 trial.

### Documentation and validation obligations

Update the Art Direction production inventory, Architecture data flow only where implemented, Building Positioning Runbook evidence, MVP Readiness, and `progress/GET-204.md`. Validate source/license manifest, deterministic recipe, layer registration, projection, masks, anchors, footprint tolerance, route readability, asset budget after `OPEN-PERF-001`, and fixed captures. Run relevant art/layout validators and closeout commands only after live visual proof. Record the exact Blender version and export recipe; do not commit licensed source or generated scene files.

## T5 — Hidzu identity and graphic-surveillance-noir world art

- **Label:** Improvement
- **Initial state:** Todo
- **Parent:** GET-139

### Why this ticket exists

An unchanged asset kit can provide coherent architecture but cannot by itself express The Getaway's identity. T5 adds the second visual gate over the technically validated, committed T4 composition: a consistent Hidzu-controlled Tokyo where corporate safety, identity scoring, logistics, public information, and surveillance are understandable through repeated visual grammar. It corrects the previous drift into fantasy Neo, generic neon cyberpunk, broad cyan glow, darkness, and atmospheric clutter without representing T4 as requester-accepted.

### Player promise

The same technically validated city now receives a provisional Hidzu treatment. The player can read where identity is checked, which devices are active/connected, how cameras relate to terminals, where public service becomes controlled access, and when danger is merely ambient versus confirmed. Cold institutional surfaces and sodium practical light preserve readable midtones; cyan is scarce technology, crimson is real threat, and the protagonist/objective remain stronger than ambience. Dusk, blue hour, and curfew feel distinct but remain one city. This promise remains unaccepted until requester review.

### Starting state

- T4's unchanged-kit composition, projection, masks, anchors, and fixed captures are technically validated and committed. Requester acceptance remains required before T4 is final or Done.
- The original Direction B artifact is unavailable. A replacement artifact, source frame, hash, generation provenance, prompt, rubric, and rejection criteria must be registered under `OPEN-ART-001` before the provisional style trial is judged; it remains non-final until requester review.
- Hidzu's institutional role is canonical, but Takahiro's formal title, district name, Japanese diegetic language, safehouse exterior, and crossfade details remain explicit OPEN items.
- T5 may change materials, signage, lighting, civic/surveillance props, atmosphere, and flattened derivatives; it may not silently change topology, required anchors, device mechanics, or route viability.

### Complete player flow

The player leaves the safehouse into a district that first reads as ordered civic infrastructure. Lira's area communicates the human edge of identity exclusion. The route toward Naila, Brant, and the logistics site uses repeated Hidzu wayfinding and public-screen language. Before curfew, delivery activity and queues make public blending plausible while cameras remain legible. During blue hour and curfew, public messaging, practical lights, reduced activity, and verifier presence shift the mood without hiding walkable space. The camera terminal, cache terminal, transit terminal, cameras, hiding/blending structures, entrances, manifest/cache, and outbound path each read through their proper fiction and knowledge state.

### System rules and state transitions

The T5 lifecycle is `T4_TECHNICALLY_VALIDATED_COMMIT → PROVISIONAL_HIDZU_IDENTITY_PASS → LOCAL_STATE_LAYER_EXPORT → REQUESTER_VISUAL_ACCEPTANCE → ENTITLEMENT_BACKED_RUNTIME_PROMOTION`. T5 consumes but does not redefine T3/T4 gameplay semantics. Dusk, blue-hour, and curfew layers stay aligned; schedule state selects atmosphere and public treatment, never a second geometry. Active technology cyan appears only on declared Hidzu devices/connections. Amber carries objective/time/curfew. Crimson appears only for confirmed danger/Pursuit. Neutral information uses muted teal/bone. Lighting remains motivated by visible sources with consistent upper-left direction.

Every placed or modified object must support navigation, surveillance, hiding/blending, line-of-sight cover, hazard, entrance, contact, mission interaction, safehouse, objective readability, or required civic atmosphere. Public screens and feed surfaces communicate authored Hidzu claims but never leak undiscovered operational facts.

### Internal milestones and proof gates

1. Resolve/register the Direction B reference and convert it into explicit value, palette, material, silhouette, surveillance, UI-adjacency, and rejection criteria.
2. Define Hidzu environmental grammar: identity frames, cameras, connected-device markers, terminals, checkpoint language, public screens, propaganda, transit/service wayfinding, and warnings.
3. Apply material/value treatment while preserving the technically validated scale, street hierarchy, and midtone readability.
4. Author aligned dusk, blue-hour, and curfew lighting/atmosphere; measure crossfade and performance after the OPEN gates close.
5. Integrate gameplay-serving hiding/blending structures, contact spaces, terminal/entrance cues, and required hazards without clutter.
6. Inspect normal play, Observation, Suspicious/Pursuit presentation hooks, minimum zoom, and every fixed viewport.
7. Obtain requester acceptance that the city reads as coherent Hidzu Tokyo before T6/T10 final visual integration.

### Content requirements

Produce a visual reference board, palette/value guide, material set, practical-light inventory, Hidzu logo/wayfinding/device grammar, propaganda/public-screen content templates, camera/terminal state treatments, schedule-state export layers, atmosphere layers, semantic theme tokens, and asset provenance for all committed derivatives. Author enough public messaging to express safety, efficiency, transit, identity continuity, civic sentiment, suppression, and controlled access without implying unresolved facts.

### World/UI/audio/George feedback

World feedback must prioritize current objective/action, actor, observation/threat, traversal/entrance, architecture, then ambience. Camera coverage uses truthful restrained geometry and never paints buildings broadly cyan. The future HUD/overlays use matching matte ink, angular edges, fine bone/brass rules, restrained shadows, and semantic colors, but T9 owns their implementation. Audio anchors correspond to visible cameras, drone routes, terminals, screens, curfew sources, and entrances. George's AR presentation is subordinate, private, and nonphysical; T6/T9 own the asset and behavior.

### Failure and recovery

Visual acceptance fails on generic neon cyberpunk, fantasy ornament, crushed curfew blacks, impossible lights, broad glow, large translucent buildings, unmotivated fog, soft upscaled composites, slab bases, repeated plates, unreadable devices, hidden objectives, or decorative clutter. Correct treatment/lighting/export layers without reopening accepted topology unless measured gameplay evidence proves a real layout defect. Missing/invalid art may fall back with diagnostics, but fallback cannot satisfy production acceptance.

### Explicit exclusions

- No synthetic replacement of Neo Tokyo geometry or per-building collage.
- No gameplay detection, network transitions, dialogue, facts, or objective logic.
- No raw licensed geometry or untracked production truth.
- No fantasy-Neo costume/world language, generic neon abundance, broad cyan/crimson ambience, or city-wide transparency.
- No public-feed posting, messaging, social simulation, procedural propaganda, or hidden fact delivery.
- No clutter added solely to make the city look busy.

### Dependencies and OPEN blockers

Depends on a validated committed T4 composition. Blocks T6 and T10 visual integration. Critical acceptance blockers are `OPEN-ART-001` and `OPEN-NAR-015`; `OPEN-ART-002` separately blocks any kit-derived runtime promotion or committed flattened derivative while acquisition-specific entitlement is unavailable. High acceptance blockers are `OPEN-NAR-003`, `OPEN-NAR-013`, `OPEN-NAR-014`, `OPEN-LAYOUT-004`, `OPEN-ART-004`, and the color-independent visual-state portion of `OPEN-ACC-001`. Recorded recommendations may be trialed reversibly for live comparison; they remain non-final while open. T5 does not own `OPEN-PERF-001`, but its export must remain measurable against the T4/T10 provisional or approved budget.

### Canonical decisions/spec sections

Implements `GDR-SET-003`, `GDR-SET-005`, `GDR-SOC-001`, `GDR-ART-001`, `GDR-ART-002`, `GDR-ART-003`, `GDR-REM-011`, `GDR-SUP-004`, and the outdoor boundary in `GDR-PROD-004`. Canonical detail is in [[20 Setting & Worldbuilding]], [[30 Art Direction (MVP)]], [[35 Narrative Alignment]], [[47 Social Feed]], [[03 Lore/Plot Bible]] sections 3, 8, 11, and 12, and [[04 Engineering/Roadmap]] Gate 5.

### Human-play acceptance

Fixed captures at 1280×720, 1440×900, and 1920×1080 must cover safehouse, dusk street, each contact area, public route, curfew route, camera/terminal relationship, cache/manifest, Suspicious/Pursuit hooks, and 0.60. A reviewer can distinguish objective, neutral civic system, active technology, caution, and confirmed danger without relying on color alone. Dusk and curfew are visibly different yet geometrically identical. Actors/placeholders, entrances, roads, and device state remain readable. The requester must agree the scene is Hidzu-controlled Tokyo, not a kit demo or fantasy cyberpunk collage.

### Documentation and validation obligations

Update Art Direction with the registered reference/rubric and implemented conventions, the asset/art manifest, Architecture only for realized theme/layer data flow, MVP Readiness evidence, and `progress/GET-205.md`. Validate source/provenance, semantic tokens, layer registration, practical-light sources, color-independent cues after `OPEN-ACC-001`, fixed captures, minimum zoom, and runtime crossfade after `OPEN-ART-004`. Use live inspected frames as the gate; validators and image-generation counts are supporting evidence only.

## T6 — Grounded actors, portraits, and entry-flow presentation

- **Label:** Improvement
- **Initial state:** Todo
- **Parent:** GET-139

### Why this ticket exists

The prior characters were tiny or stiff against monumental buildings and drifted into fantasy-operative styling. Actor sheets, portraits, character creation, dialogue identity, and world scale also came from inconsistent sources. T6 establishes one grounded cast and one manifest contract so the protagonist, contacts, Hidzu security, civilians, Takahiro's broadcast image, and George's private AR presence belong to the same modern surveillance dystopia.

### Player promise

The player chooses one of four distinct contemporary protagonist appearances and recognizes that same person in the world and all approved identity surfaces. Lira, Naila, Brant, security, and civilian/service roles are readable without permanent labels. Bodies remain grounded, directional, and proportionate at default zoom and 0.60 through dusk and curfew. Portrait/world identity stays coherent, and nobody looks like a fantasy commando or tactical enemy token.

### Starting state

- T5 provides a technically validated, committed provisional graphic-surveillance-noir world-language pass; requester acceptance remains its final visual gate. T3 supplies authoritative actor anchors and T7 supplies identity/build state when integrated.
- Exactly twelve world actor sets are required: four protagonist presets, Lira, Naila, Brant, two Hidzu security archetypes, and three civilian archetypes.
- The matrix is 64×96 frames, eight directions, four frames, and `idle`/`move`/`interact`; attack is not required.
- The provisional `OPEN-ART-003` oracle uses `64×96`, origin `(0.50, 0.92)`, alpha height `54–64` px, and one replaceable shared scale for all twelve actors. Live greybox evidence rejected the initial `1.15` trial as too weak at the `0.60` floor, so the current reversible trial is `1.30`; it is judged at the current `0.78` default zoom and `0.60` floor, with no per-scene scaling.
- T6 owns reusable security/civilian visual archetypes, not names, biographies, counts, schedules, or authoritative placements. Lira's unresolved identity/relationship is outside T6; her art may communicate only the approved medical-supplies role.
- George hardware, Naila/Brant biography cues, entry-flow ownership, actor scale, and shipping budgets remain explicit OPEN items. `OPEN-PERF-001` has no numeric baseline, so T6 may record measurements but cannot pass shipping-performance acceptance.

### Complete player flow

New Game presents four authored grounded presets alongside callsign/build creation; selecting one persists the appearance ID. In the safehouse and district, the protagonist's idle, facing, movement, and interactions align with their ground anchor. Lira, Naila, and Brant appear as the same identities used in dialogue/debrief presentation. Civilians visually support delivery activity, queues, waiting, and service roles; security reads as institutional verification staff rather than a combat class. At curfew and during surveillance transitions, actor value and silhouettes remain legible. George appears as a private near-character AR companion and in his HUD identity without becoming a physical party member.

### System rules and state transitions

Each world actor has a stable actor ID, ownership (`player`, `contact`, `security`, or `civilian`), sprite-set ID, 64×96 frame contract, four frames per animation, eight direction keys, shared origin/foot anchor, runtime scale, portrait key, and explicit fallback. Presentation mirrors authoritative position, facing, locomotion, interaction, dialogue, and schedule state; it never owns collision, detection, mission state, or build effects.

The protagonist appearance transitions once from unselected to one authored preset at confirmation and persists through autosave, Retry, debrief, and compatible continuation. World actors display exactly one of `idle`, `move`, or `interact`. Portrait selection uses the same stable identity. Missing required matrices fail production acceptance rather than silently substituting fantasy/attack assets.

### Internal milestones and proof gates

1. Resolve biographies/hardware boundaries needed for visual references without authoring final dialogue.
2. Produce a shared scale, costume, silhouette, palette, portrait, and anchor reference tied to the current validated provisional world treatment.
3. Create four protagonist sets, then prove character-creation selection and world persistence with placeholder shell integration.
4. Create Lira/Naila/Brant; prove world/portrait identity continuity.
5. Create two security and three civilian sets; prove role readability in public/curfew contexts.
6. Create twelve matching `256×256` identity portraits, one `256×256` Takahiro broadcast portrait, and one separately registered `256×256` transparent George AR idle/base asset; validate crop/safe area, provenance/hash/bytes, and neutral fallback.
7. Validate every 8×3×4 matrix, direction order, origin, foot-anchor stability within two pixels, frame occupancy, depth, and fallback metadata.
8. Capture all identities and all twelve portraits plus Takahiro and George at `0.78`/`0.60` across dusk, blue hour, and curfew. T6 proves its neutral selection seam and live protagonist/contact anchors; Character, dialogue, Retry/debrief, schedules, and final entitlement-backed city context remain deferred/not checked for T7/T9/T10 or runtime promotion.

### Content requirements

Maintain actor/portrait manifests, stable preset/actor IDs, source references, asset-generation or painting recipes, frame normalization rules, direction/state/frame naming, anchors, scales, occupancy bounds, depth policy, neutral fallback policy, path safety, SHA-256, compressed/decoded byte metrics, and provenance. Identity portraits are `256×256`, contain one identity with face/shoulders inside the central 80% safe area, and bake no localized text. Clothing must reflect expatriates, contacts, service/public civilians, and corporate security without weapons, fantasy armor, package colors, or unexplained military competence.

### World/UI/audio/George feedback

Facing, foot contact, locomotion, and interaction must be readable against the current validated provisional city values without labels or x-ray effects. Character creation and Character screen show the selected appearance once T9's shell is integrated. Dialogue/debrief identity matches the world actor. Footsteps/interactions emit semantic hooks for T10 audio but do not drive state. George's T6 base art is private, restrained, and visually distinct from a physical actor; proof places it near the protagonist's upper-right at `28–36` screen pixels and suppresses it while a full overlay owns focus, but T9 owns final states, placement, prompts, and suppression. It never owns collision/occlusion/depth or implies that other characters see him.

### Failure and recovery

Production acceptance fails for missing matrices, anchor drift, sliding feet, mirrored/wrong direction, roof placement, scale mismatch, silhouette ambiguity, fantasy styling, portrait mismatch, unreadable curfew values, or stale appearance after Retry/New Game. Correct the asset/manifest/integration; do not move gameplay anchors or add labels. Retry restores authoritative actor state and keeps the selected protagonist identity without preserving post-departure dialogue, pursuit, or animation state.

### Explicit exclusions

- No attack animations, weapons, combat silhouettes, fixed Trace/Operative, backgrounds, packages, or appearance-based mechanics.
- No combinatorial body-part creator beyond four authored presets.
- No permanent labels, arbitrary per-scene scaling, giant sprites, or art-owned collision/detection.
- No final dialogue prose, schedules, surveillance mechanics, HUD shell, or mission integration.
- No invented Lira/Naila/Brant biography or George hardware before its OPEN decision.

### Dependencies and OPEN blockers

Depends on T5's validated committed visual-language pass; consumes T3 anchors and later T7/T9 identity state/surfaces. Blocks T10 final presentation. High acceptance blockers are `OPEN-NAR-009`, `OPEN-NAR-010`, `OPEN-NAR-011`, `OPEN-UI-002`, `OPEN-ART-003`, and `OPEN-PERF-001`. Their recommendations may be trialed provisionally through replaceable manifests/assets and cannot be called accepted while open. `OPEN-UI-002` must preserve the Roadmap split: T6 owns appearance/George assets; T9 owns shell/layout.

### Canonical decisions/spec sections

Implements `GDR-PC-002`, `GDR-GEO-001`, `GDR-ART-001`, `GDR-ART-005`, `GDR-REM-011`, and `GDR-SUP-003`. Canonical detail is in [[48 Actors & Portraits]], [[30 Art Direction (MVP)]] actor rules, [[40 George (AI Companion)]], [[92 Character & Progression]] appearance contract, [[04 Engineering/Architecture]] Art/Actors contract, and [[04 Engineering/Roadmap]] Gate 6.

### Human-play acceptance

For the current T6 gate, select every protagonist preset through the neutral appearance seam across fresh runs and verify it in the safehouse world; final Character/dialogue/Retry/debrief persistence remains deferred to T7/T9/T10. Meet Lira, Naila, and Brant and distinguish their world/portrait identities without labels. Inspect both reusable security and all three civilian visual archetypes without treating them as authoritative placed/scheduled actors. Inspect all twelve portraits, Takahiro, and George. At 1280×720, 1440×900, and 1920×1080, compare `0.78` and `0.60` across dusk, blue hour, and curfew for pixel-derived foot stability within two pixels, correct facing/state, human-scale proportions, no roof placement, and readable silhouettes. Missing/corrupt assets must produce an observable neutral diagnostic and fail the production gate; fallback never counts as the production matrix. Final entitlement-backed city-context acceptance remains deferred.

### Documentation and validation obligations

Update actor/portrait inventories, Art Direction, implemented manifest ownership in Architecture, MVP Readiness, and `progress/GET-206.md`. Run sprite-matrix, pixel-derived anchor/occupancy, direction, frame, scale, portrait, provenance/hash/path, fallback/fault-injection, and measured-load validators; run `yarn sprites:validate`; inspect live captures at every required state and viewport. Record exact counts, requests, compressed bytes, estimated decoded texture bytes, cold-load timing, and observed FPS without claiming a shipping ceiling while `OPEN-PERF-001` is open. After visual acceptance, run the AGENTS closeout suite and guided AI regression. Record that visual identity/scale acceptance is human evidence, not implied by validator success.

## T7 — Protagonist RPG identity, progression, Health, and Paranoia

- **Label:** Feature
- **Initial state:** Todo
- **Parent:** GET-139

### Why this ticket exists

The rewrite removed the RPG foundation the requester had invested in and replaced it with a fixed Operative plus route packages. T7 restores a focused, persistent protagonist build and the two consequential resources that support the game's themes. It owns identity/build payload, deterministic checks, Character screen, authored XP/level-up, Health, Paranoia, and their save/Retry behavior. It does not recreate a perk forest, equipment game, combat stats, or package selection.

### Player promise

In under two minutes, the player creates a callsign, selects one of four appearances, and makes a small set of meaningful capability choices. A Social/Mental protagonist and a Technical/Evasion protagonist see materially different dialogue, evidence, terminal, and escape options while both remain viable. Requirements are visible, results are deterministic and explained, stress changes the math honestly, injury matters, and one earned level-up at safehouse/debrief demonstrates that the character will continue into Miami.

### Starting state

- T3 supplies new-schema, autosave, Retry, safehouse, time, pause, and runtime foundations.
- T6 supplies final appearance assets when available, but T7 must preserve the four stable appearance IDs and may use validated temporary presentation until integration.
- New runs begin before Level 0 in character creation, then Health 100 and Paranoia 0 in the safehouse.
- Exact Level 0 check requirements, XP threshold/awards, derived-stat disposition, Health costs, Paranoia event amounts/rates, and smaller recovery amounts remain T7 acceptance decisions; their recorded `OPEN-*` recommendations may be trialed through replaceable authored data.

### Complete player flow

1. Enter callsign; choose one of four appearances.
2. Allocate four additional points across Physical, Mental, Social, and Technical, each starting at 1 with creation cap 3 and long-term cap 5.
3. Allocate six points across Stealth, Evasion, Awareness, Composure, Insight, Influence, Systems, and OpSec, each starting at 0 with creation cap 2 and long-term cap 5.
4. Review practical Level 0 meanings and confirm a valid build. Persist `PlayerIdentity` separately from `PlayerBuild`.
5. During dialogue, evidence, terminal, hiding/pursuit, and interception contexts, show the exact requirement and deterministic calculation before/after selection.
6. Apply visible authored Health or Paranoia effects; show current resources continuously and explain every change.
7. Award each authored XP milestone once. When the threshold is reached, hold progression pending until safehouse/debrief.
8. Allocate two skill points per level and one attribute point every third level; enforce caps and persist the result.

### System rules and state transitions

Check resolution is `attribute + skill − Paranoia penalty + authored situational modifier ≥ visible requirement`; each check names one attribute and one skill. A designated fact may reveal, lower, or guarantee only its declared outcome. No RNG, hidden percentage, reroll, critical result, or global fact bonus exists. Locked options remain visible with exact reasons unless their existence would itself leak unknown information.

Paranoia is 0–100 and always named `Paranoia`: 0–39 gives no penalty, 40–69 gives −1, 70–89 gives −2, 90–99 gives −3, and 100 causes fatal medical collapse. It never creates false clues/UI. Curfew causes no passive gain; walking/waiting outside causes no passive recovery. Health is 0–100, changes only through authored physical consequences, and fails at 0. Rest costs 30 minutes, restores Health to 100, and removes 40 Paranoia. Exact other effects use approved values or explicitly recorded provisional authored data until live review resolves them.

### Internal milestones and proof gates

1. Define/validate `PlayerIdentity`, `PlayerBuild`, creation draft states, persistence, and retired-save rejection.
2. Implement creation budgets/caps, callsign/preset validation, practical explanations, and summary.
3. Implement the pure check resolver, visible breakdown, fact rules, fail-forward contract, and duplicate/reroll protection using approved values or the explicitly recorded reversible recommendations from `OPEN-RPG-001` and `OPEN-RPG-004`.
4. Restore a Character screen containing only identity, level/XP, four attributes, eight skills, Health, Paranoia, unspent points, important facts, and long-term consequences.
5. Implement Health/Paranoia event ledgers, threshold feedback, fatal outcomes, Rest integration, and snapshot restoration with tuning values isolated in approved or provisional authored data.
6. Implement idempotent milestone XP and safehouse/debrief allocation using the approved or provisionally recorded `OPEN-RPG-002` table.
7. Prove two deliberately different viable builds across dialogue, manifest, terminal/trace, recovery, and interception seams.

### Content requirements

Provide localized callsign/allocation validation; four appearance IDs; concrete descriptions for all attributes/skills; two viable sample builds; a complete Level 0 check catalog; authored requirement, modifier, fact, success, and fail-forward data; Health/Paranoia source and recovery event records; milestone XP IDs/thresholds; Character-screen fact/consequence summaries; and new-schema persistence validation. Each resource change stores stable source, amount, time, before/after, feedback, localization, and Retry treatment.

### World/UI/audio/George feedback

The protagonist HUD lane always shows callsign where appropriate, level/XP compactly, Health, and Paranoia. Character creation and Character screen explain capability in practical language, not packages. Check UI lists attribute, skill, requirement, Paranoia penalty, fact/modifier, final total, and result. Threshold/resource/progression changes have concise world/HUD/text and semantic audio hooks. George may explain verified build/resource state and consequences but cannot recommend a canonical build, spend points, heal, lower stress, reveal hidden checks, or choose an option.

### Failure and recovery

Health 0 produces `failure.health`; Paranoia 100 produces `failure.paranoia`; both name the contributing authored source. Failed checks commit their declared fail-forward result and cannot be rerolled by reopening. Retry restores identity, build, level, XP, unspent points, Health, Paranoia, facts, and relevant state exactly as of departure. New Game clears them. Rewrite saves with fixed Operative/package fields are rejected rather than guessed into attributes/skills.

### Explicit exclusions

- No fixed Trace/Operative, backgrounds, Ghost/Wire/Force, perk tree, combat skill/stat, equipment grid, faction meter, crafting, encumbrance, or automatic allocation.
- No RNG, hidden roll, generic intel bonus, XP grinding, dialogue-exhaustion XP, kill XP, or repeatable milestone.
- No passive damage, passive Health regeneration, consumable healing, passive curfew Paranoia, outdoor decay, hallucination, or dishonest UI.
- No implementation of surveillance mechanics, dialogue graph/HUD shell, or final authored mission content owned by T8–T10.

### Dependencies and OPEN blockers

Depends on T3; blocks T8, T9, and T10. Critical acceptance blockers are `OPEN-NAR-001`, `OPEN-RPG-001`, `OPEN-RPG-002`, `OPEN-RPG-004`, `OPEN-HLT-001`, and `OPEN-PAR-001`. High acceptance blockers are `OPEN-RPG-003` and `OPEN-PAR-002`. Recorded recommendations may be trialed provisionally through authored data/constants with deterministic tests and rollback seams; unresolved values prevent final acceptance, not ticket start. T7 owns RPG/resource payload and behavior; T3 owns persistence infrastructure; T8 supplies surveillance/interception sources; T9 presents checks/HUD/facts; T10 authors final values/content and proves them.

### Canonical decisions/spec sections

Implements `GDR-PC-001` through `GDR-PC-003`, `GDR-MIS-008`, `GDR-RPG-001` through `GDR-RPG-006`, `GDR-HLT-001`, `GDR-HLT-002`, `GDR-PAR-001` through `GDR-PAR-004`, `GDR-TIME-003`, `GDR-SUR-005`, `GDR-ESC-001`, `GDR-FACT-001`, `GDR-REM-001`, `GDR-REM-002`, and `GDR-REM-006`.

Canonical detail is in [[92 Character & Progression]], [[43 Health, Failure & Recovery]], [[60 Paranoia]], [[50 Combat]], [[44 Safehouse, Save & Retry]], [[13 Level 0 Content and State Matrix]] sections 4–5 and 10–12, [[04 Engineering/Architecture]] sections 5, 10, and 12, and [[04 Engineering/Roadmap]] Gate 7.

### Human-play acceptance

- Create valid and invalid builds, confirm budgets/caps, and reach safehouse in at most two minutes without package knowledge.
- Run Social/Mental and Technical/Evasion builds; demonstrate different practical dialogue, recognition, terminal/trace, recovery, and interception options while both retain a completion route.
- Before/after checks, verify exact math and designated fact effects; Naila's fact guarantees only manifest recognition.
- Cross every Paranoia threshold and verify the exact all-check penalty and truthful feedback; curfew alone changes nothing.
- Reach Health 0 and Paranoia 100, verify exact failure causes, and Retry exact departure values.
- Earn the approved milestone once, allocate two skill points at safehouse/debrief, test third-level attribute logic, caps, save/reload, Retry, and New Game.

### Documentation and validation obligations

Update Character/Health/Paranoia specs only for approved resolved values, Architecture for implemented state/data flow, MVP Readiness, and `progress/GET-207.md`. Add unit tests for creation validation, pure checks, fact effects, penalties, Health/Paranoia events, fatal outcomes, XP idempotency, allocation/caps, save hydration, Retry, and retired-schema rejection; component tests for creation/Character/check explanations. After normal-control proof, run the AGENTS closeout suite and guided AI regression. Never treat a fixture-only alternate build as human-play evidence.

## T8 — Surveillance, security, civilians, hiding, drone, and noncombat escape

- **Label:** Feature
- **Initial state:** Todo
- **Parent:** GET-139

### Why this ticket exists

Surveillance, paranoia, hiding, and escape are the game rather than a prelude to combat. The existing work never produced a fair, recoverable network: detection jumped between states, visual cones did not reliably describe detection, pursuers could behave omnisciently, stealth became a toggle, and failure opened tactical combat or AutoBattle. T8 owns the complete noncombat pressure loop shared by cameras, one verifier drone, human security, authored civilian contexts, terminals, hiding, blending, last-known-position search, interception, and return to safety. T10 authors the mission encounters that use this loop; it does not redefine the mechanics.

### Player promise

The player can look at a street and understand who or what is watching, how concern is escalating, what the network last knows, and which credible place or social context might break confirmation. Exposure gives a correction opportunity; Suspicious creates tense but recoverable verification; Pursuit follows evidence rather than the player's hidden coordinates. Technical preparation can loop only connected cameras and may leave a trace. If caught, the player's build and facts support a short deterministic escape choice—not a second combat game.

### Starting state

- T3 provides layout anchors, shared geometry, observation, movement, interaction, time/pause, devices, schedules, and persistence infrastructure.
- T7 provides deterministic checks, Health, Paranoia, build state, facts seam, and failure payloads.
- T4/T5 provide technically validated, committed provisional visual geometry and surveillance grammar; requester acceptance remains their final visual gate. T6 provides security/civilian actors.
- Network starts `Clear`, with no last-known position and only discovered devices exposed to player knowledge.
- Exact camera rates, confirmation rules, search timings, loop duration, civilian/security schedules, Health costs, Paranoia events, and context placement remain T8 acceptance decisions; their recorded `OPEN-*` recommendations may be trialed through replaceable authored data.

### Complete player flow

1. Discover a camera through ordinary sight, contact knowledge, or authored interaction; its sweep and current coverage become readable and knowledge can persist.
2. Observe from safety or cross the lane. Sustained valid exposure builds visible concern rather than instantly confirming identity.
3. At the approved or explicitly provisional threshold, enter `Suspicious`, record source and last-known position, raise communicated Paranoia, focus nearby connected cameras, and dispatch the single verifier drone when appropriate.
4. Break current observation, move away from last-known position, and enter a credible authored hiding or blending context. Invalid entry explains direct observation, range, schedule, occupancy, or context requirements.
5. If exposure continues, an identity checkpoint confirms, or the drone verifies, enter `Pursuit`. Security and drone investigate network evidence and last-known positions, never secret live coordinates.
6. Break sight, change direction, and use an authored context. Successful escape transitions `Pursuit → Suspicious → Clear`; difficult recovery may grant its approved or explicitly provisional one-time Paranoia relief.
7. At the connected terminal, a qualified build may loop only its mapped camera group. Weak OpSec still succeeds but records a trace and may cause Suspicious.
8. If intercepted, present only supported Influence/Insight, Composure, Evasion, or Physical escape options with visible requirements/costs. Success returns to real-time escape; failure causes capture.
9. If the player reaches the safehouse boundary while observed, `Suspicious`, or in `Pursuit`, apply the approved or explicitly provisional `OPEN-SAFE-001` action/state rule. Boundary crossing never becomes an undocumented network reset.

### System rules and state transitions

`SurveillanceState` contains `level`, source device/actor, last-known position, timestamps, current search area, and trace/verification provenance. `Clear → Suspicious` requires authored valid observation or suspicious behavior; `Suspicious → Pursuit` requires continued evidence, an explicit checkpoint, or drone verification—never a hidden timer alone. `Pursuit → Suspicious` requires broken sight plus credible evasion; `Suspicious → Clear` requires completed context recovery. Render and detection use the same camera geometry and solid occlusion. Devices cannot see through buildings or across invalid elevation/masks.

Hiding and blending are authored IDs with geometry, availability schedule, capacity, prerequisites, invalid reasons, and recovery behavior. A context cannot be entered while directly observed. Civilian group size and schedules use the Approved rule or the explicit reversible `OPEN-CIV-001` baseline; when provisional, the trial uses small groups with arrival/hold/depart phases that support specific public blending rather than decorative crowds. Human-security roster and schedules likewise use Approved data or the explicit reversible `OPEN-SEC-001` baseline; security verifies, blocks, and intercepts but has no battle AI. The single drone announces approach, searches last-known areas and possible contexts, and cannot attack or be fought. Noise exists only as authored world events with known source and investigation consequence.

### Internal milestones and proof gates

1. Register each tuning/context/schedule value as Approved or as the queue's explicit reversible provisional baseline, exercise it through fixed greybox route tests, and lock it only after live acceptance.
2. Implement one authoritative surveillance/network reducer and an event ledger; no painter, actor, or HUD owns hidden state.
3. Prove camera render/detection/occlusion identity with visual debug overlays and edge cases.
4. Implement Suspicious, last-known position, drone dispatch, search, and recover-to-Clear without Pursuit.
5. Implement Pursuit evidence loss, direction change, discrete hiding/blending, and staged recovery.
6. Implement connected-terminal loop, Systems/OpSec result, trace provenance, and unrelated-device rejection.
7. Add authored security/civilian schedules, interception options/costs, capture failure, and Retry compatibility.
8. Run dusk blending and curfew hiding routes under normal controls, including failure and recovery, before mission integration.

### Content requirements

Author the camera inventory/group topology, exact coverage geometry, discovery rules, concern/confirmation data, one drone route and warning package, an Approved or explicitly provisional `OPEN-SEC-001` human-security roster, Approved or explicitly provisional `OPEN-CIV-001` civilian groups, hiding and blending context catalog, authored noise events, terminal/device mappings, interception option catalog, cost previews, fail-forward/success results, and localized invalid reasons. Every event stores source, timestamp, prior/new state, last-known data, world/HUD/audio feedback, Paranoia/Health effect, and outcome-ledger contribution. Content must support both primary timings and an uninformed route.

### World/UI/audio/George feedback

Known coverage is subtly visible and stronger during Observation; unknown devices are not revealed. Clear uses neutral restraint, Suspicious uses amber focus/last-known communication, and Pursuit reserves crimson for confirmed danger. Camera sweep/lock, drone approach/verification, state transitions, context entry/rejection, trace, and interception need distinct visual and semantic audio cues. HUD/George may state verified source, last-known area, route risk, and recovery condition; neither may reveal undiscovered devices, safe paths, live pursuer targets, or guaranteed outcomes. The minimap shows only discovered surveillance.

### Failure and recovery

Suspicious is always recoverable unless another explicit authored event confirms identity. Pursuit recovery first returns to Suspicious, not directly to Clear. Missing or invalid context data fails closed with a readable unavailable reason, never invisibility. Successful interception may cost approved or explicitly provisional Health, Paranoia, or time and must say so before selection. Failed interception produces `failure.capture` with the confirming source and restores the departure snapshot on Retry. Health 0 or Paranoia 100 routes through T7 failures. Saving/loading cannot erase concern, last-known state, trace, context occupancy, or drone/search provenance. Safehouse arrival cannot erase those states or enable unsafe actions unless the approved or explicitly provisional `OPEN-SAFE-001` rule permits them.

### Explicit exclusions

- No AP combat, AutoBattle, attack grid, weapons, enemy HP, takedown power, overwatch, suppression, EMP, noise lure, breach package, or armed drone.
- No stealth toggle, universal dark-tile hiding, permanent invisibility, passive crouch/noise simulation, omniscient pursuer, camera-through-wall detection, or mismatch between rendered and detected cones.
- No whole-district hack, remote unrelated-device action, erased identity, random check, or hidden confirmation timer.
- No simulated crowd, reputation/trust meter, procedural patrol generator, or T10-authored one-off bypass around these mechanics.

### Dependencies and OPEN blockers

Depends on validated committed T3 and T7 foundations; consumes T4–T6 geometry/presentation and blocks T9 contextual presentation plus T10 integration. Critical acceptance blockers are `OPEN-HLT-001`, `OPEN-PAR-001`, `OPEN-SUR-001`, `OPEN-SUR-002`, `OPEN-SUR-003`, `OPEN-CIV-001`, `OPEN-SEC-001`, `OPEN-LAYOUT-003`, and `OPEN-SAFE-001`. High acceptance blockers are `OPEN-RPG-003`, `OPEN-MOV-002`, `OPEN-SUR-004`, and `OPEN-NAR-012`. Recorded recommendations may be trialed provisionally through authored state-machine/content data with explicit live proof and rollback; unresolved behavior cannot be final. T8 owns mechanics and reusable content schemas; T10 owns final route encounter placement/pacing.

### Canonical decisions/spec sections

Implements `GDR-PAR-002`, `GDR-PAR-004`, `GDR-OBS-001`, `GDR-OBS-002`, `GDR-SUR-001` through `GDR-SUR-005`, `GDR-STL-001` through `GDR-STL-003`, `GDR-ESC-001`, `GDR-ESC-002`, `GDR-REM-004`, and `GDR-REM-005`.

Canonical detail is in [[42 Surveillance, Security & Civilian Behavior]], [[70 Stealth]], [[50 Combat]], [[60 Paranoia]], [[41 Movement, Interaction & Observation]], [[13 Level 0 Content and State Matrix]] sections 6–8 and 11, [[04 Engineering/Architecture]] surveillance ownership/contracts, and [[04 Engineering/Roadmap]] Gate 8.

### Human-play acceptance

- Complete `AC-L0-003`, `AC-L0-008` through `AC-L0-012`, and relevant parts of `AC-L0-018` under normal controls.
- Stand at camera-cone boundaries and behind every representative occluder; rendered coverage and detection agree exactly.
- Trigger Suspicious, watch the drone investigate the stored last-known area, recover through a valid context, and verify no combat or omniscient correction.
- Trigger Pursuit, break sight, change direction, hide/blend, observe search at the old position, and return through Suspicious to Clear.
- Loop one connected group cleanly and with weak-OpSec trace; prove unrelated devices remain unchanged.
- Enter invalid contexts and unsupported interception options; every rejection/cost/failure is explicit and Retry is deterministic.
- Complete `AC-L0-019` by attempting safehouse entry/actions in all network states and proving there is no boundary reset or magical recovery.

### Documentation and validation obligations

Update surveillance/stealth/combat specs only with approved tuning, Architecture for implemented event/state ownership, MVP Readiness, and `progress/GET-208.md`. Add pure geometry/occlusion, transition, last-known, search, context, schedule, trace, interception, persistence, and outcome-ledger tests. Provide live dusk/curfew captures with debug geometry plus player-facing captures without it. After human-control acceptance, run the AGENTS closeout suite and guided AI regression. Automated state reachability cannot accept fairness, warning quality, or tension.

## T9 — Dialogue, George, facts, dossier, social feed, and four-lane HUD

- **Label:** Feature
- **Initial state:** Todo
- **Parent:** GET-139

### Why this ticket exists

Dialogue and George previously existed as broad but weak surfaces: choices did not reliably alter play, free text implied powers the companion did not have, facts drifted toward generic currency, the journal exposed unrelated systems, and the HUD either consumed too much world or was compressed into the rejected three-lane rewrite. T9 builds the shared information and authored-conversation infrastructure through which the player understands identity, facts, surveillance, objectives, time, and consequence. T10 supplies the final Level 0 script and debrief content.

### Player promise

Conversation is gameplay. The player sees the exact line they will say, knows why a build/fact option is available or locked, and receives a practical change in knowledge, route clarity, time, resources, objective, or later reaction. George feels present as a private AR companion but remains honest, bounded, and non-agentic. A slim four-lane dock keeps the city primary while Health, Paranoia, verified knowledge, and the current beat remain readable. The dossier and minimap reveal only what the protagonist actually knows.

### Starting state

- T3 provides pause/focus, clock, layout anchors, interaction, discovered-world state, overlay ownership, and persistence.
- T7 provides identity/build/check/resource payloads; T8 provides network/context state and verified risk data; T6 provides portrait/George art.
- The canonical semantic dialogue graph is language-neutral; English and Ukrainian render identical IDs, requirements, effects, and order.
- Exact fiction, dialogue wireframes, lane allocation, accessibility baseline, localization ownership, and some George/contact identities remain T9 acceptance decisions; their recorded `OPEN-*` recommendations may be trialed through replaceable authored content and tokens.

### Complete player flow

1. The four-lane dock shows knowledge minimap, protagonist, George, and one current quest beat in 16–18% viewport height.
2. The player opens an anchored world-visible dialogue. Time/simulation pause; speaker portrait/name/line, history, and exact player lines remain legible.
3. Available and locked options show deterministic requirements/facts. Selection commits one authored effect bundle once and explains the relevant build or knowledge.
4. Acquired facts record stable key, provenance, time, source node, and designated uses; they update dossier, objective precision, minimap discovery, George prompts, checks, and future reactions only where authored.
5. The player opens dossier/Character/minimap/feed overlays without losing focus or time. The dossier presents current objective, completed beats, optional preparation, evidence, people/places, timeline, and established consequences.
6. George offers only authored prompts valid for the current context and verified ledger. His private floating avatar and HUD lane stay synchronized; insufficient evidence yields an honest bounded response.
7. Hidzu feed/screens provide read-only propaganda, notices, curated civic sentiment, suppression, or transit context without posting/messaging simulation.
8. Closing any surface returns input ownership without a sacrificial movement click; state remains equivalent in English and Ukrainian.

### System rules and state transitions

Dialogue nodes and choices use stable semantic IDs, localized text keys, visibility rules, `CheckRequirement`, fact requirements, cost preview, success/fail-forward effect bundles, history entries, and outcome-ledger writes. Effects are transactional and idempotent; reopening cannot reroll, re-award, or duplicate facts. Contacts have no generic trust meter. `FactLedger` entries are explicit knowledge with provenance, never currency or global bonus. Objective/minimap precision derives from facts and discovery, not hidden omniscience.

`GeorgePrompt` is authored for allowed context, required facts/mission state, exclusions, question/response keys, and `effect: none`. George cannot mutate the world. The HUD owns presentation only; domain state remains in its system. All overlays and dialogue own a named pause token and release it deterministically. Responsive layouts must preserve all four functions; collapsing may change arrangement, never remove critical Health/Paranoia/current-beat access.

### Internal milestones and proof gates

1. Register approved values or explicit reversible provisional baselines for dialogue/dossier wireframes, lane allocation, accessibility, localization, and core fiction `OPEN-*` items; lock them only after live acceptance.
2. Define/validate semantic dialogue, effect-bundle, fact/provenance, dossier, minimap-discovery, and George-prompt schemas.
3. Implement transaction-safe dialogue/check/history and bilingual state-equivalence harness.
4. Implement FactLedger propagation to objective precision, minimap, dossier, checks, George, and reactions without generic bonuses.
5. Implement George lane/private avatar synchronization and contextual prompts with explicit insufficiency behavior.
6. Implement the four-lane 16–18% dock plus Character, dossier, dialogue, feed, and related overlays across all target viewports.
7. Integrate T8 risk/context feedback and prove pause/focus/no-information-leak behavior before T10 scripts final content.

### Content requirements

Provide reusable nodes/choice/effect schemas; English/Ukrainian localization catalogs; portrait/name/history treatment; fact catalog and provenance labels; dossier sections; discovery/precision rules; George prompt catalog and insufficiency lines; current-beat/deadline models; social-feed cards/screens; overlay empty/error states; and semantic HUD tokens. T10 authors Lira/Naila/Brant mission lines, but T9 must provide representative vertical samples for every effect type and locked/fail-forward path. Accessibility content includes non-color risk labels, keyboard focus/order, scalable text, subtitles/captions, reduced motion/flash, and volume entry points once approved.

### World/UI/audio/George feedback

The world stays visible behind anchored overlays. Amber denotes objectives/time/curfew, crimson only Pursuit/immediate danger, cyan connected Hidzu technology, and muted teal/bone neutral knowledge. Matte ink/angular surfaces replace glass blur and broad glow. Every choice/fact/objective/state change gets concise text and restrained semantic audio without covering the city. George comments only on verified facts or current state; he cannot contradict the dossier, reveal unknown cameras, prescribe a hidden safe route, or act as a generic chat box.

### Failure and recovery

Missing localization or invalid node/effect data fails validation and cannot silently fall back to different semantics. A failed deterministic choice applies its authored fail-forward once and remains in history. Unavailable George prompts state insufficient evidence or remain absent according to authored visibility; they never fabricate. Unknown objectives/cameras remain imprecise/hidden. Overlay errors preserve world state and pause ownership, then offer a safe close/retry. Save/Retry restores dialogue commits, fact provenance, discoveries, dossier history, George state, and UI-relevant domain state exactly; UI transient state itself is not allowed to mutate outcomes. Safehouse controls and George planning prompts show the approved or explicitly provisional `OPEN-SAFE-001` unavailable reason instead of creating a UI-only escape from active surveillance.

### Explicit exclusions

- No procedural dialogue, runtime LLM/tone mixer, unrestricted free text, exposition XP, dialogue farming, hidden random roll, trust/reputation bar, storylet, witness/gossip, or generic intelligence currency.
- No George movement, hacking, interaction, surveillance change, invented fact, undiscovered reveal, automatic choice, or guaranteed uncertain prediction.
- No full-route minimap, undiscovered camera marker, minimap movement command, procedural contract list, inventory/equipment/perk/faction/crafting surface, posting, messaging, followers, or search-risk simulation.
- No glossy oversized HUD, permanent labels, three-lane dock, or T10-specific script logic embedded in shared UI components.

### Dependencies and OPEN blockers

Depends on validated committed T3 and T7 foundations; consumes T6 art and T8 verified system state; blocks T10. Critical acceptance blockers are `OPEN-NAR-002`, `OPEN-NAR-004`, `OPEN-NAR-005`, `OPEN-NAR-007`, `OPEN-NAR-008`, `OPEN-NAR-015`, `OPEN-RPG-001`, `OPEN-RPG-004`, and `OPEN-SAFE-001`. High acceptance blockers are `OPEN-NAR-006`, `OPEN-NAR-009` through `OPEN-NAR-011`, `OPEN-NAR-014`, `OPEN-PAR-002`, `OPEN-UI-001` through `OPEN-UI-003`, `OPEN-LOC-001`, and `OPEN-ACC-001`. Recorded recommendations may be trialed provisionally through authored content/layout tokens with semantic parity checks and rollback seams; they remain non-final while open.

### Canonical decisions/spec sections

Implements `GDR-MIS-003` through `GDR-MIS-008`, `GDR-PAR-003`, `GDR-TIME-002`, `GDR-OBS-002`, `GDR-STL-002`, `GDR-DLG-001` through `GDR-DLG-003`, `GDR-FACT-001`, `GDR-GEO-001` through `GDR-GEO-003`, `GDR-UI-001` through `GDR-UI-003`, `GDR-SOC-001`, `GDR-REM-009`, `GDR-REM-010`, and `GDR-REM-012`.

Canonical detail is in [[90 Dialogue]], [[40 George (AI Companion)]], [[46 Facts, Dossier, Minimap & Terminals]], [[45 HUD & Information Architecture]], [[47 Social Feed]], [[91 Quests & Objectives]], [[13 Level 0 Content and State Matrix]] sections 4, 9–10, and 14, [[04 Engineering/Architecture]] UI/content contracts, and [[04 Engineering/Roadmap]] Gate 9.

### Human-play acceptance

- Complete representative Lira, Naila, and Brant conversations with exact lines, visible requirements, one fail-forward, history, and practical fact propagation.
- Verify each contact changes at least one designated piece of knowledge and never a trust bar; skip both without soft lock.
- Ask every available George prompt in HUD, Observation, safehouse, and dossier; prove verified-only answers and zero world mutation.
- Discover and withhold cameras/locations/facts; verify minimap, objective precision, dossier, and George reveal exactly the known subset.
- At 1280×720, 1440×900, and 1920×1080, exercise all overlays, long English/Ukrainian strings, focus restoration, accessibility modes, and 16–18% four-lane dock.
- Repeat an equivalent semantic path in both languages and prove identical state, checks, facts, costs, objective, and ledger writes (`AC-L0-017`, `AC-L0-018`).
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

From New Game to debrief, the player experiences a 15–20 minute grounded Tokyo escape story: create a personal build, meet Lira, optionally learn from Naila/Brant, choose dusk public behavior or curfew service evasion, recover confiscated medkits, optionally understand Cold Iron evidence, escape a fair surveillance response, return the supplies, validate passage before midnight, recover/level up, and receive a debrief that names what actually happened. Both informed and uninformed runs remain possible, and the ending honestly stops before Miami.

### Starting state

- T2–T9 have passed their own live gates and expose stable contracts/content seams.
- No implementation child is accepted merely because its tests pass; T10 begins from a production-like preview and the canonical acceptance matrix.
- Every T10 `OPEN-*` item has either an approved rule or an explicitly recorded reversible provisional baseline. Unresolved Critical and High items block final acceptance of their affected surfaces, not T10 start.
- New Game uses the new schema only. The operation begins at 18:30 in the outdoor safehouse with Health 100, Paranoia 0, no mission facts, network Clear, and no fake Miami level.

### Complete player flow

1. Create callsign, appearance, attributes, and skills in at most two minutes; contextual onboarding teaches confirmation and Character access.
2. Enter the safehouse; George introduces immediate controls/situation only. Exit and meet Lira within the first three minutes.
3. Accept the medkit/passage exchange. Lira explains Hidzu logistics, midnight, and available preparation without forcing errands.
4. Consult Naila and/or Brant in either order or skip both. Facts alter objective precision, dialogue, terminal understanding, blending, evidence recognition, George, and debrief only where authored.
5. Depart, creating the deterministic Retry snapshot. Choose dusk/public delivery behavior or wait safely for curfew/service access; mixed adaptation remains recordable.
6. Observe and avoid/loop cameras, use public blending or curfew hiding, respond to Suspicious/Pursuit/drone/interception as play produces.
7. Explicitly open the cache-locker interaction and recover medkits. Inspect or skip the optional manifest; recognize through Naila fact, Awareness check, or miss without blocking.
8. Escape the site and fully resolve active surveillance state. Explicitly return medkits to Lira; receive route/fact/consequence-aware dialogue and transit credential.
9. Explicitly use the outbound terminal before 00:00. Return to safehouse for factual debrief, recovery, and earned level-up.
10. Choose `Continue Exploring` or `End Demo`; preserve Miami continuation data without loading a placeholder level.

### System rules and state transitions

The objective state machine, facts/check matrix, outcome ledger, failure IDs, snapshot, and acceptance IDs in [[13 Level 0 Content and State Matrix]] are authoritative. Every mission-object transition requires explicit input and is idempotent. Midnight causes `failure.deadline` while either medkits have not been returned or transit has not been validated. Completion requires both; active Suspicious/Pursuit must be resolved before invisible completion is allowed. The manifest is always optional. Contact facts change designated clarity/checks, not route permission. The debrief reads `Level0OutcomeLedger`; it never reconstructs truth from display logs or generic morality.

Onboarding is contextual and disappears once the action is demonstrated; no separate F1 codex exists. Audio and visual feedback use the same semantic events as gameplay. English and Ukrainian share semantic IDs. Performance, save, and viewport behavior are part of acceptance, not post-ship polish. Until `OPEN-TIME-001` is accepted, pacing trials use its recorded 1–2 / 2–3 / 0–4 / 6–8 / 3–4 / 2–3 minute segment bands, 19:15–19:45 dusk-departure window, and 60-world-minute return reserve; segment maxima do not stack and the total remains 15–20 minutes.

### Internal milestones and proof gates

1. Register approved or reversible provisional values for all T10 fiction, tuning, localization, accessibility, audio, and performance decisions; freeze the authored beat sheet and route budgets only after live acceptance.
2. Author/integrate creation opening, George introduction, Lira briefing, optional contact branches, both timing routes, cache/manifest, return, validation, debrief, failures, Retry, and ending.
3. Implement contextual onboarding and full semantic audio event map with licensed/original provenance and mixing priorities.
4. Prove the objective/fact/outcome ledger across informed, uninformed, recognized, missed, Suspicious, Pursuit, interception, failure, and completion variants.
5. Tune first decision, route pacing, return reserve, HUD/overlay/world readability, and audio warnings through normal-control sessions.
6. Run every `AC-L0-*` case in a stable preview at target viewports/languages; fix all in-scope findings and rerun affected routes.
7. Run automated closeout and guided AI regression only after live human/visual proof; prepare a requester-verifiable committed build only after explicit commit authorization.

### Content requirements

Deliver the complete English/Ukrainian semantic script; contact biographies/portraits/anchors; mission/objective/fact/check/effect data; both route schedules; civilian/security/device/context placement; three one-function terminals; cache/medkit/manifest interactions; contextual onboarding prompts; all failure/debrief/completion variants; XP milestones; Miami continuation payload; public Hidzu feed/signage excerpts; and the full audio cue/ambience/mix catalog. Every branch declares prerequisites, visible consequence, ledger write, localization, Retry behavior, and fallback. No mandatory content depends on a debug bridge, hidden state mutation, or unavailable interior.

### World/UI/audio/George feedback

The accepted continuous city, grounded actors, four-lane dock, overlays, and graphic surveillance-noir semantics remain coherent through dusk, blue hour, and curfew. Objectives outrank ambient art; characters/entrances/contexts remain readable without permanent labels. Audio covers city layers, footsteps, entrances, terminals, camera sweep/lock, drone approach/verification, Suspicious, Pursuit, curfew, safehouse, Health/Paranoia, objectives, failure, completion, and restrained UI; no voice acting is required. George teaches only immediate context, warns on verified time/risk, interprets acquired facts, and never solves the route.

### Failure and recovery

Health 0, Paranoia 100, capture, and deadline each state the exact authored cause and offer Retry from operation departure. Failure cannot silently preserve post-departure mutations. Save incompatibility explains New Game. Missing optional contacts/evidence never causes soft lock. Missing required content, localization, audio event mapping, anchor, or state transition fails validation/build rather than auto-completing. If live play finds an undecided behavior, record or update its `OPEN-*` entry and use the queue's documented recommendation as a reversible provisional trial when one exists. Stop at that seam only when no coherent reversible path exists or the choice would irreversibly alter scope, ownership, licensed assets, save compatibility, or core player behavior.

### Explicit exclusions

- No tactical combat, AutoBattle, fantasy gadgets, package selection, procedural dialogue/quests/storylets, runtime LLM, broad inventory/economy/crafting, reputation/trust, social simulation, complex interior, vehicle, or fake Level 1.
- No automatic pickup/handoff/completion, teleport, debug clock/state action, direct internal-role targeting, obscured DOM click, bridge-only operation, or hidden objective mutation in acceptance.
- No decorative clutter, synthetic replacement of Neo Tokyo geometry, permanent labels, oversized HUD, unsupported free text, or checklist/fixture claim standing in for live quality.
- No reopening approved mechanic ownership inside the integration ticket; required changes return to the owning ticket/spec.

### Dependencies and OPEN blockers

Depends on validated committed T3–T9 deliverables. Critical acceptance blockers are `OPEN-NAR-001`, `OPEN-NAR-002`, `OPEN-NAR-004`, `OPEN-NAR-005`, `OPEN-NAR-007`, `OPEN-NAR-008`, `OPEN-NAR-015`, `OPEN-RPG-001`, `OPEN-RPG-002`, `OPEN-RPG-004`, `OPEN-HLT-001`, `OPEN-PAR-001`, `OPEN-TIME-001`, `OPEN-CIV-001`, `OPEN-SEC-001`, `OPEN-LAYOUT-005`, and `OPEN-SAFE-001`. High acceptance blockers are `OPEN-NAR-003`, `OPEN-NAR-006`, `OPEN-NAR-010` through `OPEN-NAR-014`, `OPEN-PAR-002`, `OPEN-AUD-001`, `OPEN-LOC-001`, `OPEN-ACC-001`, and `OPEN-PERF-001`. Recorded recommendations may be integrated as explicitly provisional content/configuration for human review; GET-210 cannot move beyond `In Review` until every materially shipped provisional rule is accepted, changed, postponed, or removed.

### Canonical decisions/spec sections

Implements the end-to-end current contract, especially `GDR-PROD-001` through `GDR-PROD-003`, `GDR-SET-001` through `GDR-SET-006`, `GDR-PC-001`, `GDR-PC-004`, `GDR-CAMP-001`, `GDR-MIS-001` through `GDR-MIS-010`, `GDR-RPG-005`, `GDR-RPG-006`, `GDR-HLT-001`, `GDR-HLT-002`, `GDR-PAR-002`, `GDR-TIME-001`, `GDR-INT-001`, `GDR-STL-003`, `GDR-ESC-001`, `GDR-ESC-002`, `GDR-DLG-001`, `GDR-DLG-003`, `GDR-FACT-001`, `GDR-GEO-002`, `GDR-SOC-001`, `GDR-AUD-001`, `GDR-GOV-001`, and `GDR-GOV-006`.

Canonical detail is in [[Game Design]], [[10 MVP Spine]], [[11 Level 0 Vertical Slice Contract]], every system specification, [[13 Level 0 Content and State Matrix]], [[03 Lore/Plot Bible]], [[30 Art Direction (MVP)]], [[95 MVP Readiness Checklist]], [[04 Engineering/Architecture]], and [[04 Engineering/Roadmap]] Gate 10.

### Human-play acceptance

Run all `AC-L0-001` through `AC-L0-019` in a stable production-like preview. This includes dusk/public with Brant, curfew/camera with Naila, completion skipping both, manifest recognized by fact, recognized by Awareness, missed without blocking, Suspicious recovery, Pursuit escape, drone verification, successful interception, capture+Retry, Health failure, Paranoia collapse, midnight failure, full completion/debrief/level-up, both languages, every target viewport, and safehouse behavior under active surveillance. Each run uses only normal visible controls. Acceptance requires 15–20 minute pacing, first decision under three minutes, four-lane dock at 16–18%, continuous city, human-scale actors, readable risks/actions, exact outcomes, no magical safehouse reset, and no console/page/state/save/objective errors.

### Documentation and validation obligations

Update canonical specs only for approved final values, Plot Bible for final authored continuity, Architecture for implemented integration, MVP Readiness evidence states, Roadmap Feature progress, and `progress/GET-210.md`. Validate all content/state/localization/audio/art manifests and fixed screenshots. Run relevant validators, `yarn sprites:validate` if actor outputs changed, lint, build, tests, coverage above 80%, and `yarn playtest:agent -- --profile guided-level0 --max-steps 20 --codex`; inspect and resolve/defer every finding. Record human route evidence separately. Do not mark T10 or GET-139 Done until the requester verifies the explicitly authorized committed build.
