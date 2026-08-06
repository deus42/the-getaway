---
status: MVP
type: system-specification
tags: [hud, information-architecture, ui, george]
canonical: true
---

# HUD & Information Architecture

## 1. Player fantasy and purpose

The HUD gives the player one stable operational read without shrinking the district into a dashboard. It keeps only current, truthful, actionable state persistent—known world information, protagonist condition, George, and the current mission beat—while deeper reading surfaces pause the simulation. The complete in-game Game Design Bible is the optional long-form reference for understanding the finalized game before or during play; it complements contextual onboarding instead of replacing it. This implements `GDR-UI-001` through `GDR-UI-004`, `GDR-GEO-001` through `GDR-GEO-003`, and the world-first acceptance rule `GDR-GOV-001`.

## 2. Player-visible verbs

- Read the four persistent bottom-dock lanes.
- Read Health and Paranoia at all times.
- Inspect the highest-priority incomplete mission beat and its known deadline or optional indicators.
- Open the knowledge minimap, Character, dossier, social feed, dialogue history, George prompts, debrief, failure, and completion surfaces.
- Open the full Game Design Bible from the start menu or paused menu, or press `F1` during eligible play; search, change chapter/section, switch locale with the game, and resume the exact prior state.
- Select an authored George prompt rather than entering unrestricted text.
- Close any reading or decision surface and return to world control without an input leak or sacrificial click.

## 3. Starting state and prerequisites

- On valid Level 0 initialization, the bottom dock is present with four lanes in this order: knowledge minimap, protagonist, George, current quest beat.
- Health begins at `100`, Paranoia at `0`, and both are visible in the protagonist lane.
- The quest lane begins with `l0.meet_lira`; it shows only the highest-priority incomplete primary objective.
- The minimap initially knows the safehouse and Lira meeting point plus only devices physically visible from the starting context.
- George initially exposes only authored opening context, controls, and current verified state.
- Before New Game, the start menu exposes `Game Design Bible` with an `F1` hint. Opening it creates no run and no pause state.
- During an active run, the paused menu exposes the same action. Direct `F1` entry is eligible only when no higher-priority creation, Character, safehouse confirmation, dialogue, terminal, debrief, failure, completion, or other modal owner is active.

## 4. Complete happy-path behavior

1. The player enters the safehouse with the world occupying the dominant viewport and the four-lane dock occupying only its approved height.
2. The minimap updates as facts and physical discovery add legitimate knowledge; it never expands into a movement planner.
3. The protagonist lane keeps Health and Paranoia visible through exploration, surveillance, overlays, failure risk, and recovery.
4. George presents verified current context and authored questions in his lane while his private AR avatar remains a world presence near the protagonist.
5. The quest lane advances one beat at a time from Lira through preparation, recovery, escape, return, transit, and debrief. Optional contact/evidence status remains compact or moves into the dossier.
6. Opening the Game Design Bible from the start menu shows the finalized sixteen-chapter bilingual reference without constructing a run. Opening it from the paused menu retains the menu pause owner and adds the Bible owner. Eligible `F1` during play adds the Bible owner exactly once.
7. The player navigates a responsive reference manual: chapter rail, readable article, on-page outline, localized search results, and previous/next navigation. At `840px` and below, the rail becomes a focus-contained drawer and tables scroll only inside bounded regions.
8. Opening dialogue, Character, dossier, social feed, George consultation, terminal, debrief, failure, or completion gives that surface focus and pauses simulation where required.
9. Closing any surface restores the previous HUD/world state and input ownership without advancing time or issuing world movement. Closing the Bible releases only its own pause owner and restores focus to the invoking button or gameplay shell.

## 5. State model and transitions

- The persistent dock remains visible during normal world play and reflects canonical state rather than maintaining a second mission or resource model.
- The knowledge minimap transitions only when a stable known-location, known-device, known-context, or objective-precision fact is acquired or removed by a valid new run/Retry restoration.
- The protagonist lane reflects current callsign/appearance context where authored and always reflects current Health and Paranoia.
- The George lane selects only authored prompts whose prerequisites are satisfied; unavailable knowledge produces a bounded unknown/insufficient-evidence response.
- The quest lane selects the highest-priority incomplete primary objective; completed and optional content does not displace the current beat.
- Reading and decision overlays own focus and shared pause. Closing one returns to the prior running or otherwise-paused ownership state.
- The Bible's UI state—open/closed, locale, chapter, section, query, visible results, and narrow drawer—is local to the React overlay. It never enters mission state, autosave, or Retry. Only the transient `bible` pause owner composes with runtime pause ownership and is stripped from persistence.
- Opening is idempotent. Repeated `F1` does not toggle or double-acquire. Close, unmount, run replacement, New Game, and shell teardown release only the Bible owner acquired by that overlay instance and never release `menu` or another owner.
- Failure, debrief, and completion replace normal action focus but do not mutate their source state merely by rendering.

## 6. Rules and tuning values

- The persistent bottom dock has exactly four functional lanes: knowledge minimap, protagonist, George, and current quest beat.
- Dock height is `16–18%` of the viewport at 1280x720, 1440x900, and 1920x1080.
- Health and Paranoia are always visible; Paranoia is never renamed `Pressure`.
- The quest lane shows one current beat. Optional preparation and evidence use compact indicators and the dossier rather than a competing objective list.
- The minimap shows only discovered locations and cameras and never issues movement or displays a hidden safest route.
- George uses authored contextual prompts and verified information; there is no generic chat box.
- Dialogue, Character, dossier, social feed, terminal, debrief, failure, and completion surfaces share one visual language and pause simulation according to their owning contract.
- The complete Game Design Bible has exactly sixteen finalized-content chapters with equivalent English/Ukrainian chapter and section IDs, order, semantic block shapes, gameplay meaning, and shared approved numeric/state data.
- The Bible is available from the start menu and paused menu with an `F1` hint. Eligible `F1` opens it during gameplay, prevents browser help, and stops propagation before world input. Ineligible modal/editable contexts retain authority.
- Wide layout (`>=1200px`) uses a `264px` chapter rail, centered article no wider than `820px`/`76ch`, and `196px` on-page outline. Medium layout (`841–1199px`) uses a `224px` rail and inline section list. Narrow layout (`<=840px`) uses one column, a modal navigation drawer, an expandable on-page list, bounded table scrolling, and targets at least `44px`.
- The player-visible copy contains finalized end-state design only. It exposes no `OPEN-*`, decision/ticket identifiers, tracker/dependency state, provisional/recommended/unresolved language, historical alternatives, implementation ownership, repository paths, raw wiki links, or test/build/coverage/commit state.
- Search indexes localized chapter titles, summaries, section titles, body text, and keywords. Results preserve deterministic order and show chapter, section, and localized excerpt.
- Exact lane widths are unresolved in `OPEN-UI-001`; character-creation/menu visual ownership in `OPEN-UI-002`; and dialogue/dossier wireframes in `OPEN-UI-003`.
- Accessibility behavior remains an acceptance decision under `OPEN-ACC-001`; semantic localization ownership and equivalence remain acceptance decisions under `OPEN-LOC-001`, and the fiction language policy under `OPEN-NAR-014`. Recorded recommendations may be implemented provisionally through replaceable tokens and localized content.

## 7. Inputs from other systems

- [[91 Quests & Objectives]] supplies the single current primary beat, optional indicators, deadline, and completion/failure state.
- [[46 Facts, Dossier, Minimap & Terminals]] supplies known locations, cameras, contexts, objective precision, dossier entries, and terminal surfaces.
- [[43 Health, Failure & Recovery]] and [[60 Paranoia]] supply visible protagonist values, causes, and failure state.
- [[40 George (AI Companion)]] supplies verified summaries, authored prompts, bounded answers, and AR-avatar state.
- [[42 Surveillance, Security & Civilian Behavior]] supplies the current network state, source, last-known feedback, and known coverage.
- [[80 Day-Night Cycle]] supplies current time, curfew/deadline context, and shared pause ownership.
- Dialogue, Character, feed, terminal, debrief, failure, and completion systems supply their semantic overlay models.
- The curated typed Bible catalog supplies finalized English/Ukrainian chapters and semantic blocks. Non-rendered source/decision references supply auditability, and an independent coverage inventory accounts for every current Approved decision and required topic without entering the renderer or search index.

## 8. Effects on other systems

- Opening an owning reading/decision overlay pauses world time and autonomous simulation; closing it releases only that surface's pause ownership.
- HUD controls may request authored actions, but rendering or selecting a lane does not itself move the protagonist, reveal unknown facts, operate a device, or complete an objective.
- The minimap and quest lane make legitimately known route/objective precision visible without changing world state.
- George prompts may explain verified state but never execute the player's choice.
- Correct focus restoration returns WASD/click control without consuming a movement input.
- Opening, navigating, searching, changing locale, and closing the Bible never mutate mission, clock, position, facts, outcome ledger, autosave, or Retry state. With an active run it affects only composable pause ownership and player input routing.
- While the Bible owns pause, the clock, schedules, cameras, surveillance accumulation, drone, autonomous actors, movement, interaction, pointer, keyboard, and controller world input remain frozen or blocked.

## 9. UI, world, audio, and George feedback

- The dock uses the locked graphic surveillance-noir language: world-first composition, readable midtones, strong silhouettes, restrained cyan technology, and crimson danger without broad fantasy glow.
- The minimap distinguishes knowledge from unknown space and strengthens only discovered surveillance information.
- Health, Paranoia, current beat, network risk, deadlines, blockers, and failure causes use their approved readable text and semantic state; exact color-independent companion treatment follows the recorded `OPEN-ACC-001` recommendation provisionally until accepted.
- The private George AR avatar remains near the protagonist while the George lane carries authored prompts and verified summaries; neither may occlude required world interaction.
- Overlay, dialogue, terminal, objective, network, failure, and completion audio families come from [[49 Audio]] and remain secondary to readable state.
- The Bible uses the same graphic-surveillance-noir semantic tokens but favors quiet long-form readability: warm practical gold for selected reading context, restrained cyan for supporting actions, and crimson only inside genuine danger/failure examples. Its dialog name, close action, chapter/section current state, result count, tables, headings, and drawer are exposed semantically; no meaning depends on color or sound.
- The reference produces no critical audio-only meaning. A restrained open/close/navigation confirmation may use UI cues, while George and world feedback remain exactly as they were before the overlay opened.
- Exact accessibility treatments, lane widths, and overlay wireframes remain non-final under their `OPEN-*` items. Their recorded recommendations may be implemented as reversible trials and must not be improvised or promoted to canonical values.

## 10. Failure, recovery, and retry behavior

- Failure replaces normal action focus with the exact cause, factual summary, Retry, and New Game actions while time and autonomous simulation remain paused.
- Retry restores HUD, known minimap state, current objective, resources, George context, and overlays from the operation-departure snapshot; no stale post-departure badge, route, alert, or dialogue remains.
- Incompatible saves show the exact New Game requirement and never render a partial HUD from default-filled state.
- After transit validation, completion/debrief offers only `Continue Exploring` and `End Demo`; it does not display a fake next level.
- Closing any nonterminal overlay returns focus cleanly without a movement click or simulation-time leak.
- Closing the Bible during a run resumes only when no other pause owner remains. Closing above the paused menu returns to the still-paused menu; closing from the start menu returns to the same no-run menu.
- A missing invocation target falls back to the correct start-menu, paused-menu, or gameplay-shell focus target. Close-button/Escape races and teardown are idempotent.
- Bible reading position is current-session UI memory only. Autosave, hydration, New Game, and Retry neither serialize it nor retain a stale `bible` owner; stale stored chapter/section IDs fall back to the first valid target without affecting game state.

## 11. Content-authoring requirements

- Author one semantic model for each lane and each overlay; English and Ukrainian render identical state, requirements, and transitions.
- Give every quest beat, fact, prompt, blocker, resource change, network transition, failure, and completion action stable semantic content rather than presentation-derived logic.
- Produce target-viewport wireframes for dialogue and dossier under `OPEN-UI-003`; provisional wireframes may drive a reversible implementation pass, but approval is required before final surface acceptance.
- Resolve and document exact desktop/collapse lane allocations under `OPEN-UI-001` without dropping any of the four functions.
- Implement text scaling, reduced motion/flash, volume controls, color-independent risk cues, keyboard parity, and subtitle requirements from the approved or provisionally recorded `OPEN-ACC-001` baseline; resolve it before final accessibility acceptance.
- Character creation and main-menu presentation may use the provisionally recorded `OPEN-UI-002` ownership split and must join the same accepted visual system before closeout.
- Author the Bible as typed semantic data, not raw Markdown or component-specific JSX: paragraphs, bullets, steps, callouts, tables with captions/headers, and state flows. Every section carries stable topic IDs plus non-rendered source/decision references.
- Cover all sixteen chapters defined in [[Game Design]]. Every chapter must explain purpose, player flow, rules and examples, cross-system inputs/effects, world/HUD/dialogue/audio/George feedback, failure/recovery/persistence/Retry, and related chapters.
- Maintain an independent required-topic and Approved-decision inventory. Every player-facing Approved rule maps to a rendered section; delivery/repository governance may be classified non-player-facing only with a bounded reason. Every source reference must resolve.
- Record bilingual semantic review for every chapter, including examples, tables, state flows, keywords, numbers, cause/effect direction, and one back-translation spot-check. Structural parity alone is insufficient.

## 12. Edge cases and prohibited shortcuts

- No oversized three-lane HUD, duplicate objective panels, permanent world labels, generic log wall, or dashboard that obscures the world.
- No minimap path execution, hidden full-map knowledge, undiscovered camera reveal, threat-aware route, or automatic protagonist movement.
- No unrestricted George input, invented answer, or UI action that mutates world state without the player's explicit authored action.
- No reading/decision overlay may allow the clock, patrol, cameras, drone, movement, or deadline to leak forward while it owns pause.
- No stale focus requiring a sacrificial click and no overlay click issuing movement beneath it.
- No debug bridge, fixture-only state, or generated screenshot may substitute for target-viewport human acceptance.
- No direct rendering of canonical Markdown, runtime regex filtering, governance metadata in DOM/search/text bridge, or invented value for an unresolved constant.
- No Bible action may dispatch a gameplay/domain effect, create a run, reveal an unknown fact, complete an objective, write an outcome, trigger autosave, or change Retry.
- No `F1` theft from editable inputs or higher-priority modals; no double pause acquisition, leaked owner on teardown, premature release of `menu`, or input propagation to Phaser.
- No permanently visible three-column layout below `1200px`, page-level horizontal overflow, clipped Ukrainian heading, unbounded table, inaccessible drawer, broken focus trap, or unreachable close action.

## 13. Removed behavior

- `GDR-REM-011`: the oversized three-lane HUD, broad glow, permanent labels, and fantasy-Neo presentation.
- Generic assistant chat input, objectives-card-only George, and absent near-character presence.
- Full route planning, hidden safest-route display, and automatic movement from the minimap.
- Broad available-quest lists replacing the single current Level 0 beat.
- `GDR-REM-012`: a short F1 tutorial/help page as a substitute for contextual onboarding. The full finalized reference under `GDR-UI-004` is current and separate.

## 14. Post-MVP extensions

- No additional persistent HUD lane, deep inventory/equipment panel, reputation meter, combat UI, or social-simulation dashboard is approved for Level 0.
- Postponed inventory, reputation, social, confrontation, and campaign systems may add future reading surfaces only through new decisions that preserve the world-first four-lane contract for this slice.

## 15. Human-play acceptance examples

- `AC-L0-001`: enter Level 0 and understand movement, Lira, Health, Paranoia, George, and the current beat without opening a help screen.
- Trigger `Suspicious`, `Pursuit`, resource changes, a blocked action, and a deadline warning; each must remain attributable without overwhelming the world.
- Open and close dialogue, Character, dossier, social feed, George, a terminal, failure, and debrief while active simulation is nearby; nothing advances and focus returns cleanly.
- `AC-L0-016`: complete return, terminal validation, progression, and debrief with the actual facts/outcomes shown and only `Continue Exploring` / `End Demo` terminal choices.
- `AC-L0-017`: repeat an equivalent path in English and Ukrainian and confirm identical state, requirements, and layout viability.
- `AC-L0-018`: at every target viewport, confirm dock height `16–18%`, all four functions remain present, Health/Paranoia are readable, and the district/actors dominate the frame.
- From the no-run start menu, open the Bible through both the visible button and `F1`; confirm no run/pause state is created and close restores the invoker.
- During active play, note time and position, open with `F1`, navigate/search in both languages, and confirm world time, movement, surveillance, actors, mission/outcomes, autosave, and Retry remain unchanged. Close and confirm exact state resumes.
- Open above the paused menu; confirm both `menu` and `bible` owners coexist, then close the Bible and prove the menu remains paused. Repeated `F1`, Escape/close races, unmount, run replacement, New Game, and shell teardown never leak or double-release ownership.
- Inspect at `1920×1080`, `1440×900`, `1280×720`, `1200`, `1199`, `841`, `840`, and `390×844`, including long Ukrainian headings, search results, a table, deep scroll, and the narrow drawer. Confirm keyboard/pointer/controller blocking, focus containment/restoration, semantic headings/tables, ≥44px narrow targets, and no horizontal page overflow.
- Search independent matches in chapter title, summary, section title, body, and keywords in English and Ukrainian. Select results and on-page targets and confirm the correct focused section/current state/excerpt with no governance or unresolved content visible.

## 16. Owning Linear ticket

`T1` (`GET-201`) owns the complete player-facing Game Design Bible, its finalized bilingual catalog, start/pause/`F1` access, responsive reference-manual layout, search/navigation, focus/input/pause lifecycle, traceability, and live acceptance. `T9` (`GET-209`) owns the broader HUD, minimap/dossier presentation, George lane, overlays, focus, and localization infrastructure. `T6` (`GET-206`) owns protagonist/George visual assets used by entry and HUD; `T7` (`GET-207`) owns RPG/resource state; `T8` (`GET-208`) owns network feedback; `T10` (`GET-210`) owns authored mission content, audio, localization completion, and end-to-end acceptance.
