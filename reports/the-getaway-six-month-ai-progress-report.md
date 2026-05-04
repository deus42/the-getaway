# The Getaway - Six-Month AI Development Report

Report date: 2026-05-02
Primary window: 2025-11-02 to 2026-05-02
Context window: 2025-03-10 to 2026-05-02
Scope: game progress, Vault intent, Linear state, logged asks, git history, and AI collaboration process

## Executive Verdict

The Getaway has made real progress, but it is not yet a complete MVP. The strongest achievement is not one feature. It is the operating system around the game: a documented MVP spine, Linear tracking, progress notes, readiness checklists, architecture guardrails, and a repeatable AI-assisted implementation loop. That process turned a broad "Fallout 2 in the browser" idea into a much more disciplined Level 0 vertical slice.

The game itself is now a credible technical foundation for a tactical stealth RPG. It has a React + Phaser + Redux architecture, a modular scene runtime, deterministic content pipelines, quest/objective systems, stealth/curfew/paranoia foundations, dialogue overlays, George as a diegetic guide, sprite-backed character presentation, and a developing environment-art pipeline.

The hard truth: as a player experience, Level 0 is still not locked. The readiness checklist shows most of the MVP-critical boxes are still unchecked. Stealth has the strongest readiness signal. Run closure, objective correctness, onboarding, paranoia tuning, combat cleanliness, signature authored content, audio, no-soft-lock confidence, and final visual acceptance are still the real blockers.

My rating of your AI collaboration over the last six months: 8.1 / 10. You worked effectively with AI because you pushed for evidence, rejected bad output, forced process improvements after failures, and converted repeated friction into durable workflow rules. The score is not higher because the process was often reactive: AI agents were allowed to build too much before visual acceptance, branch/worktree confusion mixed scopes, coverage gates drifted, and a lot of energy went into correcting context rot rather than shipping the playable fantasy.

My rating of the current game as a technical project: 8.0 / 10.
My rating of the current game as an MVP candidate: 6.4 / 10.
My rating of the current creative direction: 7.8 / 10.
My rating of current player-facing polish: 5.8 / 10.

The next decisive move is not another broad system. It is to lock one playable Level 0 run: start, clear objective, day dialogue, night stealth, paranoia pressure, failure/recovery, mission complete, and a short authored moment that proves the tone.

## Evidence Base

This report combines five inspected sources:

- Vault-Tec source conversations and workstream notes for original intent, narrative direction, AI workflow ideas, and process concerns.
- The Getaway memory-bank docs for current game design, architecture, MVP readiness, and Post-MVP boundaries.
- `progress/*.md` task notes for logged asks, stuck points, corrections, acceptance loops, and validation history.
- Git history for six-month change volume, commit rhythm, ticket references, and churn.
- Linear MCP data for current MVP and PostMVP project state.

Important limits:

- "All asks" means all asks available through repo progress logs, current task notes, and Vault conversation exports I could inspect. I cannot claim coverage of unsynced private chat messages that are not on disk.
- Git metrics cover committed history in the six-month window. They exclude current uncommitted changes.
- Linear was read for status and backlog context only. I did not create, mutate, or close any issues.
- I did not run gameplay, lint, build, or tests for this report-only task. The validation target is the report source and the rendered PDF.

## High-Level Numbers

| Area | Evidence | Meaning |
| --- | ---: | --- |
| Six-month commits | 118 | High activity, especially February |
| Human commits | 108 | Mostly hands-on AI-assisted implementation |
| Bot commits | 10 | Automation touched the repo, but did not dominate |
| Six-month churn | 46,143 insertions / 19,270 deletions | Large iteration footprint |
| Total churn | 65,413 changed lines | High rework and expansion |
| Logged asks in `progress/` | 236 | Strong traceability, also high correction load |
| TypeScript/TSX files | 412 | Mature codebase scale |
| Source LOC | 82,176 | Large for an MVP slice |
| Test files | 90+ | Good test culture, uneven threshold control |
| Character sprite sets | 12 | Pipeline exists, final art still pending |
| Environment atlases | 4 | Visual pipeline emerging |

The six-month commit rhythm is uneven. November had a strong push, January was quiet, February was an explosion, March and April shifted toward visual/art pipeline, process corrections, and MVP readiness.

| Month | Commits |
| --- | ---: |
| 2025-11 | 27 |
| 2025-12 | 0 |
| 2026-01 | 3 |
| 2026-02 | 67 |
| 2026-03 | 6 |
| 2026-04 | 15 |

The February spike is the inflection point. That is when the project moved from "many systems in a repo" toward the current Level 0 operating model: scene modularization, stealth readability, quest UX, visual/pathing work, and tighter task traceability.

## Original Game Intent From The Vault

The first clear intent was ambitious and broad: a browser-based story game with strong storytelling, dialogue, quests, Fallout 2 inspiration, turn-based logic, and some Heroes 3 / chess / Hearthstone influence. The early idea was not "make a small stealth slice." It was a modern browser RPG with classic CRPG density and tactical logic.

The Vault narrative work then expanded the setting into a 2036 dystopian United States under Chancellor Harrow and the Emergent Security Directorate. Operation Cold Iron became the main geopolitical threat. The protagonist, Trace, sits inside a resistance network with factions such as NARC, Shelterline, scavenger syndicates, and corporate collaborators. The setting has clear design power: occupation as everyday reality, trust as currency, tech versus ingenuity, and consequences that echo.

Your writing intent is also distinctive. You wanted a blend of dark dystopia, absurd humor, Richard Brautigan, Kurt Vonnegut, and your own Ukrainian-inflected prose style. That matters because it suggests The Getaway should not feel like generic cyberpunk or generic resistance fiction. Its best version is funny, bleak, local, specific, and a little sideways.

The Vault also shows that AI workflow became part of the project vision. You were not only building a game with AI. You were thinking toward AI agents that can play the game, remember prior feedback, compare against stronger games, and produce useful findings after every feature. That idea later explains why the repo became heavy on progress logs, validation loops, and browser test thinking.

## Current MVP Spine

The current design has been narrowed correctly. The authoritative MVP spine is:

- Day: simplified Disco-style dialogue, planning, and low-risk errands.
- Night: Commandos-inspired stealth under curfew pressure.
- Paranoia: the main pressure resource tying surveillance, curfew, safety, and rest together.
- Combat: present, but mainly an escalation path or fail-state after detection.

That is the right scope for a Level 0 vertical slice. It gives the game a distinct shape:

- Social navigation by day.
- Tactical stealth by night.
- Pressure resource connecting both.
- Combat as consequence, not the whole game.

The strongest product decision so far was deferring bloat. Vehicles, survival micromanagement, deep inventory economy, deep crafting, weapon-mod depth, full party companions, and full gossip/reputation propagation are marked Post-MVP. That prevents the game from collapsing under the original big-RPG ambition.

The risk is that the MVP is still more "systems scaffold" than "locked experience." The readiness checklist is honest about this. It asks whether Level 0 is a playable MVP matching the intended experience, and it currently leaves most boxes unchecked.

## What Has Actually Been Built

### Technical Foundation

The project is now a modern Vite + React + TypeScript game with Phaser rendering, Redux Toolkit state, Tailwind UI styling, and Jest tests. That is a reasonable architecture for a browser RPG with a DOM-heavy HUD and canvas-heavy game world.

The scene runtime has been modularized. `MainScene` is now an orchestration layer with module boundaries for world rendering, entity rendering, surveillance, camera, input, state sync, clock, minimap bridge, and day/night overlay. This was necessary. Without it, the Phaser scene would have become a long-lived god object.

The architecture also has useful guardrails:

- `MainScene.ts` line-count enforcement.
- Lifecycle contracts for scene modules.
- Disposable cleanup for listener/resource safety.
- Tests around scene registry, scene context, modules, and runtime resources.

That is not overkill for this project. AI-assisted game code tends to sprawl. The module runtime gives future agents a place to put work without silently increasing chaos.

### Gameplay Systems

Current implemented or partially implemented systems include:

- Character creation and player state.
- World grid, map data, pathing, and building footprints.
- Dialogue overlay with speaker metadata and portrait placeholders.
- Quest/objective data, ops briefings, side quest progression, pickups, and logs.
- Day/night time, curfew windows, cameras, detection states, and surveillance visuals.
- Stealth toggle, HUD feedback, noise model, movement profile, and cooldown handling.
- Paranoia design and partial runtime hooks.
- Combat and AutoBattle as low-friction fallback/escalation.
- George as a diegetic assistant surface.
- Inventory and loadout surfaces, though deep economy is not MVP-critical.

The strongest gameplay area is stealth readability. The readiness checklist marks C1 complete: stealth toggle/HUD, guard/camera cones, noise legibility, and fair detection escalation. That is the closest thing to a locked signature system.

The weakest gameplay area is the full run loop. The checklist still does not mark a complete vertical-slice run, clear closure, objective correctness, recovery, no-soft-lock confidence, onboarding, authored signature content, or combat cleanliness.

### Visual and Art Pipeline

The visual direction moved through several stages:

- Initial vector/noir rendering.
- Generated environment clutter.
- Rejection of ugly additive objects.
- Surface-first corporate-noir repaint.
- Atlas-backed environment slice.
- Sprite-backed character pipeline.
- Blender source-art validation for isometric assets.

This is directionally good. The current art plan is more scalable: use atlas-backed semantic frames, manifest-driven character sprites, deterministic composition, and Blender-to-Phaser source-art workflow. That is better than relying on ad hoc vector drawing or one-off generated clutter.

But the visuals are not done. The readiness checklist says final hero/NPC sprite art is pending, street-level authored composition needs traversal review, and GET-155 proves the Blender-to-Phaser pipe rather than final production assets. Your own March Vault note also said the game had bad graphics and not many levels. That criticism is still mostly valid, even though the pipeline has improved.

### Documentation and Operating System

This is where the project is unusually strong.

The repo now has:

- `AGENTS.md` with detailed operating rules.
- `memory-bank/` as canonical project documentation.
- MVP spine, design docs, architecture docs, readiness checklist, Post-MVP index.
- Per-ticket progress logs.
- Ask Log discipline.
- Linear integration.
- Explicit validation and handoff rules.
- Source refresh gates after context compaction.

This is not normal for a solo indie browser game. It is heavier than most small projects, but it makes sense because the project is being built through AI agents. The documentation is not just documentation. It is the agent control plane.

The cost is context overhead. Some work likely slowed down because the process became large. But the alternative was worse: repeated context rot, wrong branches, missing acceptance state, and agents guessing from stale context.

## Linear State

The current Linear shape matches the repo docs: MVP is the live project, PostMVP is planned/backlog, and GET-139 is the parent readiness container for the playable Level 0 vertical slice.

Important current statuses:

- `GET-155` is In Progress: Blender scene template and source-art validation slice.
- `GET-139` is Backlog: MVP readiness parent for playable Level 0 vertical slice.
- Recent visual/pipeline work such as GET-156, GET-161, GET-173, and GET-174 is Done.
- Recent gameplay/process work such as GET-142, GET-144, GET-159, GET-170, GET-171, and GET-172 is Done.
- Core readiness children remain Backlog: run closure, objective gating, quest/debug visibility, curfew/camera pressure, paranoia tuning, onboarding, signature stealth set-piece, reset/no-soft-locks, smoke checklist, audio, lighting, parcel streaming, graphics constraints, atlas naming, licensing, portraits, music, audio settings, and SFX.

The Linear picture is clear: many enabling slices are complete, but the actual MVP readiness track is still open.

## Six-Month Timeline

### November 2025: UI, Testing, Context Rot, and Scope Friction

November started with UI polish and game surface work, but the deeper value was process learning. The Vault contains a context-rot discussion from 2025-11-13 where you identified large repos and long context tasks as a serious risk. That was not a side issue. It became one of the central constraints of the project.

November also includes Playwright/game-testing thinking. The key conclusion was correct: Playwright is useful as a browser driver, but canvas games need a game-aware layer, debug/test APIs, and a bot abstraction. This later maps cleanly onto your AI playtesting startup idea.

### December 2025: Low Committed Activity, Pipeline Thinking

Git shows no committed activity in the six-month window for December, but the Vault has a Phaser 2.5D pipeline conversation on 2025-12-24. That conversation helped frame the art pipeline in plain terms: art is produced outside the JS game, then imported as images, atlases, tilemaps, and structured assets.

December looks like concept/pipeline thinking more than committed implementation.

### January 2026: Design Consolidation

January was quiet in commits. The important signal is design consolidation. The project moved toward an explicit MVP rather than a constantly expanding RPG plan.

### February 2026: Major Implementation Push

February is the main build month. It contains 67 commits, including:

- MainScene architecture extraction.
- Surveillance and rendering lifecycle separation.
- Battle visibility hardening.
- Level 0 visual/pathing pass.
- Runtime recursion fixes.
- ESB footprint and door tuning.
- Stealth readability/fairness improvements.
- HUD simplification and clock/curfew alignment.
- Quest/objective surface improvements.
- Dialogue presentation improvements.

This is when the project became a structured game codebase rather than a pile of features.

### March 2026: Visual Direction, Sprite Pipeline, AI Playtest Vision

March was lower in commits but high in direction change. It includes:

- The AI game agent idea in the Vault.
- Sprite pipeline work.
- Branch/worktree confusion around GET-173/GET-174.
- Visual quality corrections.
- The beginning of a more serious production-art path.

March exposed a pattern: AI could build systems, but the user had to be the taste filter. The ugly-object rejection around visual passes is a useful example. The agent produced something technically plausible but aesthetically wrong. You rejected it, and the project pivoted toward surface hierarchy and corporate-noir composition.

### April 2026: Readiness Hardening and Art Pipeline Proofs

April focused on hardening:

- Pickup objective determinism.
- HUD bottom dock usability.
- Visual closeout and coverage issues.
- Atlas-backed environment slice.
- Character readability pass.
- Blender-to-Phaser source-art validation.
- AGENTS/execution policy clarity.

April shows the project moving from feature production to MVP readiness triage. That is the right late-stage posture, even though many readiness boxes remain unchecked.

## Stuck Points and Correction Loops

I would classify at least 9 distinct stuck/correction clusters from the inspected logs. This is not a count of every frustrated moment. It is a defensible count of repeated issue families with evidence in task notes and docs.

### 1. Black screens and boot/runtime render failures

Evidence appears around provider/runtime setup, battle overlays, and visual startup stability. These were serious because a browser game that boots to a black screen has no partial credit. The project responded by adding runtime guards, browser checks, and scene lifecycle hardening.

### 2. React maximum update depth loops

This appears repeatedly across GET-106, GET-137, and GET-170. The raw notes include many `Maximum update depth` mentions. These were classic AI-assisted UI/state bugs: selectors, effects, and dispatch loops interacting badly. The response was good: selector stabilization, debug gating, and more careful runtime boundaries.

### 3. Pickup and quest state determinism

GET-106 shows a long correction loop around pickups not disappearing, popup text/name mismatches, items appearing under buildings, map item removal, and quest artifact behavior. GET-142 later hardened collect objectives with a more deterministic reducer path. This was a painful but productive loop because it forced state ownership clarity.

### 4. Dialogue and quest activation mismatch

GET-123 exposed that Level 0 started with quests already in progress when the intended behavior was gated dialogue/quest activation. This is a product correctness issue, not only a bug. It matters because the player experience depends on clear cause and effect.

### 5. Curfew/camera timing mismatch

A camera/curfew rule used evening and night rather than the intended 22:00-06:00 night window. This is a small example of why game rules need explicit source-of-truth docs. The fix aligned runtime behavior with the design contract.

### 6. Coverage gate failures and threshold drift

Coverage-below signals appear repeatedly. Some work passed lint/build/tests but failed the >80% expectation. In at least one accepted visual pass, the coverage gate was waived or deferred. This is process debt: the project has strong validation ideals, but enforcement drifted under delivery pressure.

### 7. Visual direction rejection

GET-159 is one of the most important loops. The user rejected the visual result as ugly additive objects. The project then pivoted away from freestanding clutter toward surface hierarchy, value separation, district materials, and a calmer corporate-noir read.

This is a good failure. Bad art direction was caught before it became locked.

### 8. ESB footprint, dominance, and walkability mismatch

Multiple logs mention ESB scale, collision footprint, door anchoring, and pathing. This is a sign that one landmark became too central and too fragile. The later Building Positioning Workflow in AGENTS is a direct process response: baseline, isolate variables, measure edge mismatches, stop trim-chasing.

### 9. Branch/worktree confusion and mixed scopes

GET-173/GET-174 surfaced a serious AI workflow mistake: dirty unfinished work and sprite work became confusing across branches/worktrees. The user had to ask why the agent did not raise the issue. This led to stronger main-first/shared-workspace and ask-first rules.

This is the clearest process failure in the six-month period. It was also corrected in the operating guide.

## Direction Changes

The project changed direction several times. Most changes were healthy scope correction rather than random drift.

### Direction Change 1: Broad browser RPG -> Level 0 vertical slice

The original concept wanted Fallout 2-style storytelling, tactical turn-based gameplay, quests, market fit research, and broad implementation. The current MVP is narrower: one playable Level 0 loop, day dialogue, night stealth, paranoia pressure, and combat as escalation.

This was the most important product correction.

### Direction Change 2: Deep systems -> Post-MVP containment

Vehicles, survival, deep inventory economy, deep crafting, weapon mod depth, advanced reputation, and party companions were pushed out of MVP. This saved the project. Without that deferral, the repo would keep growing while the core run remained unfinished.

### Direction Change 3: Vector/noir runtime -> manifest-driven sprite and atlas pipeline

The project moved toward sprite-backed heroes/NPCs, semantic atlas frames, and Blender source-art validation while preserving vector fallback. This is the right technical direction because it allows art replacement without rewriting gameplay.

### Direction Change 4: Generated clutter -> surface-first visual design

The rejected visual pass led to a better principle: the map should read through road/sidewalk/plaza/material hierarchy before adding props. This is especially important in isometric/tactical games where readability beats decoration.

### Direction Change 5: Hidden isolation -> visible shared workspace rules

Branch/worktree confusion changed the workflow. The current guide now defaults to `main`, visible shared workspace, explicit approval for separate branches/worktrees, and careful dirty-state handling.

### Direction Change 6: Manual playtests -> instrumented AI playtest ambition

The Vault shows a growing idea: Playwright plus a game-specific API plus persistent memory could become a playtest agent. The Getaway is both the game and the proving ground for that workflow.

## AI Collaboration Assessment

### What You Did Well

You were unusually good at correcting the AI when outputs were technically plausible but product-wrong. The visual rejection is the cleanest example. Many users accept mediocre AI output because it compiles. You did not.

You also converted pain into process. Context rot became progress notes and source-refresh rules. Mixed branch confusion became main-first and visible-workspace guidance. Visual trim-chasing became a building positioning workflow. Coverage drift became explicit acceptance-to-commit checks.

You kept asking for operational truth: exact commands, exact files, exact status, exact validation, exact Linear state. That is the right instinct for AI-assisted development because agents tend to produce polished abstraction when they lack evidence.

You also showed good scope discipline later. Early ambitions included many systems, but the current MVP spine is much more realistic. The project did not abandon the bigger game; it parked the right parts in Post-MVP.

### Where You Made It Harder

The biggest mistake was allowing too many systems and process layers to exist before one unforgettable Level 0 run was locked. The repo has a lot of machinery for a game whose core player experience is still not proven.

The second mistake was accepting implementation momentum before visual acceptance. AI can generate a lot of environment logic quickly, but taste and readability need earlier checkpoints. GET-159 shows this clearly.

The third mistake was letting coverage and Definition of Done standards be aspirational at times. If >80% coverage is the rule, then allowing accepted work below that creates process ambiguity. If the rule is too strict for art-heavy passes, split the rule by task type rather than waiving it ad hoc.

The fourth mistake was tolerating context-heavy workflows longer than necessary. The current operating guide is valuable, but it is also large. It should be treated as a control surface, not a shrine. If agents spend too much time reciting process, trim and route instructions more aggressively.

### Where AI Helped Most

AI helped most in architecture, boilerplate-heavy implementation, test scaffolding, documentation synthesis, and repeated UI/system corrections. It is good at turning a clear rule into consistent changes across many files.

AI also helped create continuity infrastructure: progress files, readiness docs, architecture updates, and traceable handoffs.

### Where AI Hurt Most

AI hurt most when taste, visual judgment, and scope ownership were underspecified. It can implement an art pipeline before the art is good. It can generate a "complete" system that is not yet fun. It can produce branch/worktree plans that are locally rational but operationally confusing in a shared workspace.

The lesson is clear: use AI aggressively for execution, but keep human control over player experience, visual acceptance, scope boundaries, and final taste.

## Game State Scorecard

| Dimension | Score |
| --- | ---: |
| Core concept | 8.5 |
| MVP scope clarity | 8.0 |
| Current MVP readiness | 6.4 |
| Architecture | 8.2 |
| Gameplay system cohesion | 6.7 |
| Quest/objective reliability | 6.6 |
| Stealth readability | 8.0 |
| Visual direction | 6.5 |
| Final art quality | 5.2 |
| AI development process | 8.1 |

### Why the Concept Scores High

The game has a strong identity when described correctly: dystopian occupation, day dialogue, night stealth, paranoia as pressure, George as a companion/guide, and dark absurdist writing. That is more distinct than "browser RPG."

### Why MVP Readiness Scores Lower

The readiness checklist still leaves too much unchecked. The project has a lot of systems, but the final player loop is not yet proven as a complete, repeatable, emotionally clear experience.

### Why Architecture Scores High

The codebase has modular boundaries, content pipelines, validation hooks, and test coverage. It is large, but not shapeless.

### Why Visual Direction Is Mid

The direction is improving, but final visuals are not accepted. The pipeline is promising; the art result still needs proof.

## Where The Game Has A Good Direction

The Day/Night split is strong. It gives the player a rhythm and prevents the game from becoming a generic tactical RPG. Day lets the game express writing, choices, and planning. Night lets the game express stealth, pressure, and consequences.

Paranoia is the right central resource. It is more interesting than only HP, ammo, or money because it can connect world state, player risk, surveillance, rest, stealth, and dialogue pressure.

Combat as escalation is the right call for MVP. If combat becomes the core, The Getaway competes with much more mature tactical games. If stealth and dialogue are the core, combat can stay simpler and still matter.

George is a good diegetic solution to guidance. The game needs "what do I do next?" clarity without becoming a tutorial overlay. A companion/assistant can carry objective hints, world interpretation, humor, and player-state reactions.

The current art pipeline direction is sane. Manifest-driven sprites and semantic atlas frames are better than hand-coded vector doodles or uncontrolled generated clutter. The Blender POC is especially useful because it gives you source-art ownership instead of only final PNGs.

The docs/Linear/progress system is a competitive advantage for AI-assisted development. It is not glamorous, but it means future agents can recover context and avoid repeating old mistakes.

## Where The Game Sucks Right Now

The full Level 0 run is not proven. This is the main issue. If a player cannot start, understand what to do, experience day planning, execute night stealth, recover from mistakes, and reach closure, the game is still pre-MVP.

The presentation is not good enough yet. The project has improved from ugly clutter, but final character art, environment art, audio, and authored composition are not locked. "Pipeline exists" is not the same as "the game looks good."

The game still risks feeling like systems instead of a designed encounter. There are quests, cameras, paranoia, stealth, combat, inventory, UI panels, and logs. But the player needs one strong authored sequence that makes all of this feel intentional.

The onboarding is weak. The readiness checklist leaves first-three-minute learning unchecked: movement/path preview, stealth toggle, curfew/cameras, paranoia, dialogue tone, and contextual tooltips.

Combat is not yet a strength. It exists, but the checklist still asks whether combat can start/end cleanly, logs are readable, AutoBattle works without breaking story beats, and combat is viable fallback rather than required path.

The process can be too heavy. The current operating guide prevents mistakes, but every added rule has a cost. The best version is not "more instructions forever." It is sharper routing: read only what matters, log only what matters, validate the actual behavior.

## What I Think You Learned

You learned that AI can build volume, but not taste. It can implement dozens of files. It cannot reliably decide whether the scene looks good, whether a player understands the goal, or whether the tone lands.

You learned that context is a real engineering resource. The project improved when you stopped treating AI context as infinite and started using Vault docs, progress notes, Linear issues, and source-refresh rules.

You learned that "done" has to be operational. A task is not done because the agent says it is done. It is done when the behavior is accepted, validation passes, docs align, and the issue state reflects reality.

You learned that process failures are useful if they become system changes. GET-173/GET-174 was bad, but the resulting workflow rule is much better. GET-159 was bad, but it clarified the visual direction.

You learned that the MVP must be smaller than the dream. The dream can stay in the Vault and Post-MVP docs. The MVP has to be one excellent slice.

## Recommended Next 30 Days

### Week 1: Lock The MVP Run Contract

Write one no-escape Level 0 run contract:

- Starting state.
- Primary objective.
- Required day interaction.
- Required night stealth action.
- One paranoia pressure moment.
- One failure/recovery path.
- Mission Complete / Fail closure.
- Exact acceptance playtest steps.

Do not add new systems during this week. The goal is to decide the run.

### Week 2: Build The Signature Set-Piece

Implement one authored night stealth set-piece:

- Guards.
- Camera.
- Curfew pressure.
- Meaningful choice.
- George hint.
- Clear consequence.

This is the most important missing proof. If this set-piece works, the game has a spine. If it does not, more systems will not save it.

### Week 3: Finish Onboarding and Closure

Add only the onboarding needed for Level 0:

- Movement/path preview prompt.
- Stealth/camera/curfew cue.
- Paranoia cue.
- Objective clarity.
- Mission recap.

Keep it short. The player should learn by doing.

### Week 4: Visual and Audio Acceptance Pass

Pick the smallest acceptable art target:

- One hero look.
- Two named NPCs.
- One street block.
- One landmark.
- One alarm/curfew audio sting.
- Footstep/UI confirms.

This should be judged by screenshots and a short playthrough, not by pipeline completeness.

## Recommended Process Changes

1. Keep Linear and progress logs, but classify every task as one of three modes: Build, Fix, or Accept. Build means implement. Fix means resolve a known defect. Accept means visual/playtest review only.

2. Split validation policy by task type. Code/system changes should keep lint/build/test/coverage discipline. Visual acceptance passes should require screenshot/playtest approval first, then tests only if code changed.

3. Keep the readiness checklist as the north star. Do not let Done tickets create false confidence. A ticket being Done only matters if it moves a readiness risk.

4. Use AI agents for evidence gathering and implementation, not final taste. For visual work, force early screenshot checkpoints.

5. For every future feature, write the player-visible proof before the implementation plan. Example: "Player can sneak past the camera, get warned by George, panic when paranoia hits tier 2, recover in safehouse, and see the objective update."

6. Reduce instruction overhead after this report. The AGENTS guide is strong but large. Keep the top operating rules active and route detailed runbooks only when the task touches that area.

## Bottom Line

You were effective with AI. Not perfectly efficient, but effective. You made the project materially better, learned from failures, and built a serious operating layer around the game.

The game has a good direction when it stays focused: day dialogue, night stealth, paranoia, dystopian absurdist writing, and a tight Level 0 run. It gets weaker when it sprawls into broad RPG systems, visual pipelines without accepted visuals, or process without player proof.

The next milestone should not be "more progress." It should be: one complete Level 0 run that a new player can finish, remember, and describe in one sentence.

## Evidence Appendix

### Vault Intent

- `/Users/deus/Projects/Vault-Tec/40 Conversations/2025/2025-03/2025-03-10 - The Getaway Game Concept.md:112-158` - original browser RPG intent, Fallout 2 / Heroes / chess / Hearthstone references, storytelling/dialogue/quests.
- `/Users/deus/Projects/Vault-Tec/40 Conversations/2025/2025-10/2025-10-01 - The Getaway (Narrative Style).md:85-160` - plot bible, Harrow/ESD, Operation Cold Iron, factions, writing-style request.
- `/Users/deus/Projects/Vault-Tec/40 Conversations/2025/2025-11/2025-11-13 - Analyze context rot issue.md:160-169` - context rot concern that later shaped task-note and source-refresh rules.
- `/Users/deus/Projects/Vault-Tec/40 Conversations/2025/2025-11/2025-11-22 - Playwright for game testing.md:200-402` - Playwright plus game-specific test API and AI game bot direction.
- `/Users/deus/Projects/Vault-Tec/40 Conversations/2026/2026-03/2026-03-14 - AI Game Agent Feedback.md:94-101` - autonomous game-playtest agent idea and self-critique of graphics, levels, and system alignment.

### Current Game Contract

- `memory-bank/01 MVP/10 MVP Spine.md:8-19` - authoritative MVP slice, day/night/paranoia/combat spine.
- `memory-bank/01 MVP/10 MVP Spine.md:21-33` - explicit Post-MVP non-goals.
- `memory-bank/01 MVP/95 MVP Readiness Checklist.md:20-30` - current estimate/risk summary.
- `memory-bank/01 MVP/95 MVP Readiness Checklist.md:34-132` - readiness criteria and unchecked areas.
- `memory-bank/01 MVP/95 MVP Readiness Checklist.md:137-168` - recent progress log and risk reductions.
- `memory-bank/04 Engineering/Architecture.md:71-83` - runtime design principles and technical flow.
- `memory-bank/04 Engineering/Architecture.md:95-121` - current Level 0 visual revamp pipeline.
- `memory-bank/04 Engineering/Architecture.md:123-155` - MainScene module runtime and guardrails.

### Progress Logs

- `progress/GET-106.md` - pickup/objective loop, disappearance bugs, popup/text issues, map item removal, final closeout.
- `progress/GET-123.md` - dialogue presentation, portrait corrections, quest auto-start correction, curfew timing correction.
- `progress/GET-137.md` - scene architecture extraction and black-screen/runtime correction loops.
- `progress/GET-144.md` - stealth fairness/readability, HUD simplification, C1 readiness closeout.
- `progress/GET-159.md` - rejected visual pass, reset, ESB revert, coverage waiver/friction.
- `progress/GET-170.md` - visual/pathing, ESB tuning, maximum update depth fixes, console audits.
- `progress/GET-173.md` and `progress/GET-174.md` - sprite pipeline work and branch/worktree confusion.

### Git and Repo Metrics

- `git log --since=2025-11-02 --until=2026-05-02` - 118 commits in the six-month window.
- `git log --numstat --since=2025-11-02 --until=2026-05-02` - 46,143 insertions and 19,270 deletions.
- `find the-getaway/src -type f` - 412 TS/TSX files and 82,176 source LOC at inspection time.
- `rg -o "Ask:" progress/*.md` - 236 logged asks in progress notes at inspection time.

### Linear

- MVP project: In Progress.
- PostMVP project: Planned.
- `GET-155`: In Progress, Blender scene template / source-art validation slice.
- `GET-139`: Backlog, MVP readiness parent for playable Level 0 vertical slice.
- Backlog readiness children include run closure, objective gating, quest/debug visibility, curfew/camera pressure, paranoia tuning, onboarding, signature stealth set-piece, reset/no-soft-locks, smoke checklist, audio, lighting, and graphics constraints.

## Report Validation

Report source was written as a durable repo artifact. PDF generation and page rendering are validated separately in the task note and handoff.
