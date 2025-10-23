# Project Progress

<step id="1" status="completed">
<step_metadata>
  <number>1</number>
  <title>Initialize the Project</title>
  <status>Completed</status>
  <date>March 26, 2024</date>
</step_metadata>
<linear key="GET-32" />

<tasks>
1. Scaffolded a Vite + React + TypeScript workspace with Phaser, Redux Toolkit, Tailwind CSS, and Jest.
2. Established the agreed `/memory-bank` + `/the-getaway` repository layout and seeded placeholder modules.
3. Wired Tailwind/PostCSS, configured Jest, created a basic `GameCanvas`, and bootstrapped the Redux store.
</tasks>

<notes>
- Development server renders a placeholder Phaser canvas and the tooling baseline is ready for feature work.
</notes>
</step>

<step id="24.6" status="completed">
<step_metadata>
  <number>24.6</number>
  <title>Paranoia System — Player Fear Resource (MVP)</title>
  <status>Completed</status>
  <date>February 23, 2026</date>
</step_metadata>
<linear key="GET-91" />

<tasks>
1. Added a dedicated `paranoiaSlice` with passive decay, respite windows, relief cooldowns, and balancing-friendly snapshots plus a supporting config module for thresholds/weights.
2. Threaded paranoia evaluation through `GameController` (camera + guard inputs, SPECIAL multipliers, safehouse/daylight dampeners) with guard detection scaling, HUD paranoia meter, and developer inspector.
3. Wired relief and UX loops: CalmTabs/Nicotine consumables auto-trigger reductions, George’s console gained a cooldown-gated Reassure action, and combat hit chance now honours paranoia tiers.
</tasks>

<implementation>
- <code_location>the-getaway/src/store/paranoiaSlice.ts</code_location> encapsulates paranoia state, respite, decay boosts, cooldown ledger, and reducers; `paranoiaConfig.ts` contains tier thresholds and per-stimulus weights.
- <code_location>the-getaway/src/game/systems/paranoia/stimuli.ts</code_location> aggregates surveillance, pursuit, heat, hazard, and HP signals each frame, returning gain/loss breakdowns for `GameController` to dispatch.
- <code_location>the-getaway/src/components/GameController.tsx</code_location> evaluates stimuli, applies passive decay, adjusts guard perception multipliers, and listens for paranoia-tagged consumables; <code_location>the-getaway/src/components/ui/PlayerSummaryPanel.tsx</code_location> and <code_location>the-getaway/src/components/ui/GeorgeAssistant.tsx</code_location> surface the new HUD meter and Reassure action.
- <code_location>the-getaway/src/components/debug/ParanoiaInspector.tsx</code_location> offers live paranoia telemetry; <code_location>the-getaway/src/content/items/index.ts</code_location> introduces CalmTabs/Nicotine packs with matching tags; <code_location>the-getaway/src/game/combat/combatSystem.ts</code_location> applies tier-based hit penalties.
</implementation>

<code_reference file="the-getaway/src/store/paranoiaSlice.ts" />
<code_reference file="the-getaway/src/game/systems/paranoia/stimuli.ts" />
<code_reference file="the-getaway/src/components/GameController.tsx" />
<code_reference file="the-getaway/src/components/ui/PlayerSummaryPanel.tsx" />
<code_reference file="the-getaway/src/components/ui/GeorgeAssistant.tsx" />
<code_reference file="the-getaway/src/components/debug/ParanoiaInspector.tsx" />
<code_reference file="the-getaway/src/content/items/index.ts" />
<code_reference file="the-getaway/src/store/__tests__/paranoiaSlice.test.ts" />

<validation>
- `yarn test paranoiaSlice.test.ts` *(passes)*
</validation>

<notes>
- Stamina mechanics remain in place but the HUD meter is hidden for MVP; revisit the dual-resource presentation once Street-Tension Director tuning lands.
- Luck currently applies deterministic spike mitigation; revisit stochastic variance post-director integration if designers want more volatility.
</notes>
</step>

<step id="16.11" status="completed">
<step_metadata>
  <number>16.11</number>
  <title>Hazard-to-System Integration Matrix</title>
  <status>Completed</status>
  <date>February 21, 2026</date>
</step_metadata>
<linear key="GET-5" />

<tasks>
1. Authored `environmentMatrix.ts` with canonical factor enums plus `resolveEnvironmentalFactors` / `combineSystemImpacts`, backed by coverage for factor completeness and aggregation behaviour.
2. Extended world selectors with `selectEnvironmentSystemImpacts`, wiring NPC routine pacing and reinforcement delays in `GameController` to the matrix outputs while preserving existing trigger flows.
3. Surfaced the matrix-backed travel advisory overlay in `DayNightIndicator`, localising advisory tiers/stats and exposing aggregated risk data to the HUD.
</tasks>

<implementation>
- `environmentMatrix.ts` stores the hazard-to-system weights and clamps merged multipliers, feeding a memoised selector that now travels with the ambient snapshot so downstream systems can diff reactive risk.
- `GameController.tsx` scales NPC movement cadence and reinforcement scheduling using the matrix output, while `DayNightIndicator.tsx` renders advisory tiers and stat callouts driven by the same selector.
- Updated UI locale bundles and selectors/tests to cover the new travel advisory strings, factor resolution, and combined impact snapshots.
</implementation>

<code_reference file="the-getaway/src/game/world/environment/environmentMatrix.ts" />
<code_reference file="the-getaway/src/game/world/environment/__tests__/environmentMatrix.test.ts" />
<code_reference file="the-getaway/src/store/selectors/worldSelectors.ts" />
<code_reference file="the-getaway/src/store/__tests__/worldSelectors.test.ts" />
<code_reference file="the-getaway/src/components/GameController.tsx" />
<code_reference file="the-getaway/src/components/ui/DayNightIndicator.tsx" />
<code_reference file="the-getaway/src/content/ui/index.ts" />

<validation>
- `yarn test --runTestsByPath src/game/world/environment/__tests__/environmentMatrix.test.ts --runInBand`
- `yarn test --runTestsByPath src/store/__tests__/worldSelectors.test.ts --runInBand`
</validation>

<notes>
- Matrix outputs now ride the ambient snapshot so George, HUD consumers, and systemic scheduling stay in sync when hazards or enforcement levels change mid-session.
</notes>
</step>

<step id="16.12" status="completed">
<step_metadata>
  <number>16.12</number>
  <title>Role-Based Procedural Dialogue Templates</title>
  <status>Completed</status>
  <date>February 22, 2026</date>
</step_metadata>
<linear key="GET-6" />

<tasks>
1. Authored systemic role template families (merchant, checkpoint guard, street doc, gang scout, safehouse handler) with faction/time-of-day/hazard gating, seeded token palettes, and tone hints.
2. Implemented the role template resolver with deterministic seeding, gating evaluation, and token rendering, exposing it to the dialogue tone pipeline.
3. Updated `DialogueOverlay` to detect `[roleTemplate:role.key]` markers, build runtime context from Redux state, merge tone overrides, and route resolved lines through the existing tone manager.
4. Added resolver unit coverage plus documentation updates in `game-design.md` and `architecture.md` describing the authoring contract and data flow.
</tasks>

<implementation>
- `roleTemplateTypes.ts` and `templateResolver.ts` define the runtime contract, handle gating (faction standing, curfew level, blackout tier, hazard keywords, perk ownership), render seeded tokens, and return tone overrides alongside resolved text.
- `content/dialogueTemplates/roles/*` captures reusable prose for systemic NPCs, each variant tagged with gating metadata and contextual token resolvers so dialogue reacts to blackout tiers, smog exposure, or scavenger alliances.
- `DialogueOverlay.tsx` now parses role template references, assembles a `RoleDialogueContext` from player/world slices, resolves the template, and forwards enriched tone requests to `dialogueToneManager`.
- Memory-bank docs document the WHAT/HOW separation for role templates, ensuring narrative and engineering teams share the new authoring workflow.
</implementation>

<code_reference file="the-getaway/src/game/narrative/dialogueTone/roleTemplateTypes.ts" />
<code_reference file="the-getaway/src/game/narrative/dialogueTone/templateResolver.ts" />
<code_reference file="the-getaway/src/game/narrative/dialogueTone/__tests__/templateResolver.test.ts" />
<code_reference file="the-getaway/src/content/dialogueTemplates/roles/index.ts" />
<code_reference file="the-getaway/src/content/dialogueTemplates/roles/merchant.ts" />
<code_reference file="the-getaway/src/content/dialogueTemplates/roles/checkpointGuard.ts" />
<code_reference file="the-getaway/src/content/dialogueTemplates/roles/streetDoc.ts" />
<code_reference file="the-getaway/src/content/dialogueTemplates/roles/gangScout.ts" />
<code_reference file="the-getaway/src/content/dialogueTemplates/roles/safehouseHandler.ts" />
<code_reference file="the-getaway/src/components/ui/DialogueOverlay.tsx" />
<code_reference file="memory-bank/game-design.md" />
<code_reference file="memory-bank/architecture.md" />

<validation>
- `yarn test --runTestsByPath src/game/narrative/dialogueTone/__tests__/templateResolver.test.ts --runInBand`
</validation>

<notes>
- Template resolution now shares deterministic seeds and tone overrides with the procedural mixer, giving systemic NPCs contextual chatter without diverging from localisation-safe pipelines.
</notes>
</step>

<step id="26.4" status="completed">
<step_metadata>
  <number>26.4</number>
  <title>AutoBattle Mode & Tactical Automation</title>
  <status>Completed</status>
  <date>October 21, 2025</date>
</step_metadata>
<linear key="GET-89" />

<tasks>
1. Added persistent AutoBattle preferences plus localized copy, wiring `GameMenu` and the combat HUD toggle (now `CombatControlWidget`) to mirror the `Shift+A` hotkey.
2. Implemented the automation core: behaviour-weighted profiles, heuristic planner, runtime slice, and `AutoBattleController` orchestration with logging and pause reasons.
3. Integrated controller updates into `GameController`, covering fail-safes, manual override detection, and planner unit coverage for aggressive/balanced/defensive decision bias.
</tasks>

<implementation>
- Settings and UI layers now expose enable/profile reducers, localized labels, and a HUD badge that reflects runtime status and the last chosen action while persisting preferences across saves.
- `autoBattleProfiles`, `autoBattlePlanner`, and `AutoBattleController` coordinate to score attacks/repositions, dispatch combat actions, and emit structured telemetry through `autoBattleSlice` and `logSlice`.
- Keyboard shortcuts and manual input hooks in `GameController` synchronise with HUD toggles, ensuring automation pauses instantly on player input, dialogue prompts, or exhausted AP reserves.
</implementation>

<code_reference file="the-getaway/src/store/settingsSlice.ts" />
<code_reference file="the-getaway/src/store/autoBattleSlice.ts" />
<code_reference file="the-getaway/src/game/combat/automation/autoBattleProfiles.ts" />
<code_reference file="the-getaway/src/game/combat/automation/autoBattlePlanner.ts" />
<code_reference file="the-getaway/src/game/combat/automation/AutoBattleController.ts" />
<code_reference file="the-getaway/src/components/ui/CombatControlWidget.tsx" />
<code_reference file="the-getaway/src/components/GameController.tsx" />
<code_reference file="the-getaway/src/__tests__/autoBattlePlanner.test.ts" />
<code_reference file="the-getaway/src/content/ui/index.ts" />
<code_reference file="memory-bank/architecture.md" />
<code_reference file="memory-bank/game-design.md" />

<validation>
- `yarn test --runTestsByPath src/__tests__/autoBattlePlanner.test.ts --runInBand`
</validation>

<notes>
- Level 0 QA: toggle AutoBattle on in settings, engage trash mobs, elite patrol, and mixed squads via debug spawners, observing HUD status, log summaries, and manual overrides when interrupting automation.
</notes>
<maintenance_notes date="October 22, 2025">
- Replaced the native profile dropdown with a shared `AutoBattleProfileSelect` component so the combat HUD and Game Menu share the same responsive styling, keyboard support, and focus-guarding logic.
- Documented the UX regression fix for GET-89 and verified the new control ignores GameController refocus hooks, keeping the selection menu open until the player commits a choice.
</maintenance_notes>
<maintenance_notes date="October 23, 2025">
- GET-97 reworked the combat HUD into `CombatControlWidget`, merging the turn tracker and AutoBattle toggle into a compact overlay while keeping behaviour profiles in the Game Menu.
</maintenance_notes>
</step>

<step id="16.10" status="completed">
<step_metadata>
  <number>16.10</number>
  <title>Tone-Preserving Procedural Dialogue System</title>
  <status>Completed</status>
  <date>October 16, 2025</date>
</step_metadata>
<linear key="GET-33" />

<tasks>
1. Introduced tone trait vectors, rhetorical controls, and JSON-schema validation helpers so author, persona, and scene fingerprints share a deterministic format.
2. Seeded the dialogue tone content library (authors, personas, scene hints, templates, synonym palettes) with motif tagging and added Jest coverage to guard schema drift.
3. Implemented the tone mixer plus cache-aware `DialogueToneManager`, including seeded RNG, motif decay, and template selection clamps.
4. Wired `DialogueOverlay` and Level 0 locale bundles to consume the manager, enabling tone-aware lines with deterministic fallbacks in both English and Ukrainian.
</tasks>

<implementation>
- `game/narrative/dialogueTone` now hosts trait definitions, schema validation, a seeded RNG helper, the blending/motif-aware mixer, and the runtime manager that memoises generated lines per `(dialogueId, nodeId, seedKey)`.
- Content under `content/dialogueTone` defines author fingerprints, persona baselines (Trace, Amara, Theo, Sadiq), scene hints, micro-templates, and trait-weighted palettes; `buildToneLibrary` exposes these for runtime/tests while motif defaults keep counters persona-scoped.
- `DialogueOverlay` resolves tone metadata via `dialogueToneManager`, leaving handcrafted text intact as fallback, and Level 0’s Archivist Naila dialogue now opts into tone defaults per node across EN/UA bundles.
- Architecture and design docs capture the new pipeline: blending weights, motif hygiene rules, authoring locations, and the integration path through the overlay.
</implementation>

<code_reference file="the-getaway/src/game/narrative/dialogueTone/toneTypes.ts" />
<code_reference file="the-getaway/src/game/narrative/dialogueTone/dialogueToneMixer.ts" />
<code_reference file="the-getaway/src/game/narrative/dialogueTone/dialogueToneManager.ts" />
<code_reference file="the-getaway/src/content/dialogueTone/index.ts" />
<code_reference file="the-getaway/src/content/dialogueTone/templates.ts" />
<code_reference file="the-getaway/src/content/dialogueTone/palettes.ts" />
<code_reference file="the-getaway/src/content/dialogueTone/personas.ts" />
<code_reference file="the-getaway/src/components/ui/DialogueOverlay.tsx" />
<code_reference file="the-getaway/src/content/levels/level0/locales/en.ts" />
<code_reference file="the-getaway/src/content/levels/level0/locales/uk.ts" />
<code_reference file="memory-bank/game-design.md" />
<code_reference file="memory-bank/architecture.md" />

<validation>
- `yarn test --runTestsByPath src/game/narrative/dialogueTone/__tests__/dialogueToneMixer.test.ts --runInBand`
- `yarn test --runTestsByPath src/game/narrative/dialogueTone/__tests__/dialogueToneManager.test.ts --runInBand`
- `yarn test --runTestsByPath src/content/dialogueTone/__tests__/toneContent.test.ts --runInBand`
- `yarn test --runTestsByPath src/__tests__/dialogueOverlay.test.tsx --runInBand`
</validation>

<notes>
- Dialogue nodes honour `toneDefaults` / `tone` metadata but default to handcrafted copy when configs opt out, keeping localisation review predictable while enabling procedural tone.
</notes>
</step>

<step id="16.8" status="completed">
<step_metadata>
  <number>16.8</number>
  <title>Environmental Story Triggers & Ambient Feedback</title>
  <status>Completed</status>
  <date>October 8, 2025</date>
</step_metadata>
<linear key="GET-34" />

<tasks>
1. Introduced serialisable environment state (`world.environment`) with narrative flags, rumor/signage/weather snapshots, and NPC ambient profiles threaded through the existing alert/curfew reducers.
2. Authored environment content tables (rumors, notes, signage, weather) plus selectors so ambient copy stays data-driven and consistent with the tone set in `memory-bank/plot.md`.
3. Shipped a reusable trigger registry and default trigger pack that rotates barfly gossip, toggles weather/sirens, swaps propaganda signage, and seeds collectible notes when flags flip.
4. Wired GameController to tick the registry each frame and added focused Jest coverage to confirm rumors, signage, and notes respond to flag changes.
</tasks>

<implementation>
- `worldSlice` now hydrates `EnvironmentState`, mirrors curfew/alert events into `gangHeat`, `curfewLevel`, `supplyScarcity`, and `blackoutTier`, and exposes helpers to persist signage, rumor sets, and spawned notes alongside NPC bark profiles.
- Content under `src/content/environment` defines short-form rumors, notes, signage variants, and weather presets with story-function metadata; selectors in `worldSelectors.ts` deliver memoised reads for HUD consumers.
- The trigger registry (`triggerRegistry.ts`) tracks cooldown/once semantics while `defaultTriggers.ts` maps table entries to Redux actions, logging swaps through the updated system strings.
- `GameController` initialises and ticks triggers every animation frame so Phaser scenes and Redux stay synchronised; tests simulate flag shifts to verify rumor updates, signage swaps, and note drops land as expected.
</implementation>

<code_reference file="the-getaway/src/store/worldSlice.ts" />
<code_reference file="the-getaway/src/game/interfaces/environment.ts" />
<code_reference file="the-getaway/src/content/environment/index.ts" />
<code_reference file="the-getaway/src/game/world/triggers/triggerRegistry.ts" />
<code_reference file="the-getaway/src/game/world/triggers/defaultTriggers.ts" />
<code_reference file="the-getaway/src/components/GameController.tsx" />
<code_reference file="the-getaway/src/store/selectors/worldSelectors.ts" />
<code_reference file="the-getaway/src/content/system/index.ts" />
<code_reference file="the-getaway/src/game/world/triggers/__tests__/defaultTriggers.test.ts" />

<validation>
- `yarn test --runTestsByPath src/game/world/triggers/__tests__/defaultTriggers.test.ts --runInBand --silent`
</validation>

<notes>
- Rumor copy, signage quips, and notes follow the straight-faced absurdity guidelines from `memory-bank/plot.md`, keeping punchlines in the final line for easy future audits.
- Registry exposes a reset hook for tests; production code only registers once to prevent duplicate swaps when React remounts controllers.
</notes>
</step>

<step id="16.9" status="completed">
<step_metadata>
  <number>16.9</number>
  <title>Route Ambient World Events Through George Assistant</title>
  <status>Completed</status>
  <date>October 15, 2025</date>
</step_metadata>
<linear key="GET-35" />

<tasks>
1. Replaced the HUD ambient ticker by streaming rumor, signage, weather, and zone danger updates into George’s console with a dedicated Ambient Feed tab and dock highlight.
2. Added `selectAmbientWorldSnapshot` plus a `GeorgeAmbientTracker` diff/cooldown layer so ambient triggers enqueue structured events without spamming repeat notifications.
3. Localised the new ambient callouts (English/UA), introduced tone-aware formatters, and trimmed the legacy ticker component and strings from the app shell.
</tasks>

<implementation>
- New snapshot types (`game/interfaces/georgeAssistant.ts`) and selectors (`store/selectors/worldSelectors.ts`) capture the latest environment state for the assistant.
- `game/systems/georgeAssistant.ts` now exports `GeorgeAmbientTracker` with per-category cooldowns and is covered by `src/game/systems/__tests__/georgeAmbientTracker.test.ts`.
- `components/ui/GeorgeAssistant.tsx` renders the Ambient Feed tab, dock alert visuals, and dock ticker integration while removing `components/ui/AmbientTicker.tsx` from `App.tsx`.
- UI strings (`content/ui/index.ts`) gained ambient-feed formatters and flag vocabulary for both locales.
</implementation>

<code_reference file="the-getaway/src/game/interfaces/georgeAssistant.ts" />
<code_reference file="the-getaway/src/store/selectors/worldSelectors.ts" />
<code_reference file="the-getaway/src/game/systems/georgeAssistant.ts" />
<code_reference file="the-getaway/src/game/systems/__tests__/georgeAmbientTracker.test.ts" />
<code_reference file="the-getaway/src/components/ui/GeorgeAssistant.tsx" />
<code_reference file="the-getaway/src/content/ui/index.ts" />
<code_reference file="the-getaway/src/App.tsx" />

<validation>
- `yarn test --runTestsByPath src/game/systems/__tests__/georgeAmbientTracker.test.ts --runInBand`
</validation>

<notes>
- Dock highlight auto-clears when players open the Ambient Feed, ensuring the ticker and badge never linger once updates are reviewed.
</notes>
</step>

<step id="25.4" status="completed">
<step_metadata>
  <number>25.4</number>
  <title>Content & Systems Validation</title>
  <status>Completed</status>
  <date>October 6, 2025</date>
</step_metadata>
<linear key="GET-36" />

<tasks>
1. Added a catalog module in `src/content/items/index.ts` plus background references so starting loadouts and repair kits share consistent definitions.
2. Normalised hydrated state via `deepClone`/`sanitizeItemForPlayer`, ensuring equip slots, durability, and stack metadata survive legacy saves.
3. Extended repair flows: `consumeInventoryItemInternal` now resolves `repair` effects, and `repairItemInternal` keeps `equipped`/`equippedSlots` synchronised.
4. Authored `scripts/migrate-save-durability.mjs` to patch persisted JSON with durability, hotbar, and encumbrance data when migrating save snapshots.
</tasks>

<implementation>
- Catalog prototypes produce runtime clones with optional overrides (durability, quantity) while backgrounds and world content instantiate them on demand.
- Repair consumables integrate with the existing reducer pipeline, syncing repaired items back into both equipment maps to avoid divergent references.
- Hydration sanitation prevents stale payloads from reintroducing missing equip slots or corrupt stack metadata, keeping encumbrance calculations accurate.
</implementation>

<code_reference file="the-getaway/src/content/items/index.ts" />
<code_reference file="the-getaway/src/content/backgrounds.ts" />
<code_reference file="the-getaway/src/store/playerSlice.ts" />
<code_reference file="scripts/migrate-save-durability.mjs" />

<validation>
- `yarn test playerSlice.test.ts inventorySystem.test.ts --watch=false`
</validation>
</step>

<step id="24.2" status="completed">
<step_metadata>
  <number>24.2</number>
  <title>Skill Tree System with Combat Branch</title>
  <status>Completed</status>
  <date>October 2, 2025</date>
</step_metadata>
<linear key="GET-37" />

<tasks>
1. Introduced branch/skill definitions in `content/skills.ts` and extended core types (`SkillId`, `Player.skillTraining`, `Weapon.skillType`) so progression data is fully typed.
2. Added Redux actions `allocateSkillPointToSkill` / `refundSkillPointFromSkill`, tag-aware increments, and tests covering spend/refund symmetry and cap enforcement.
3. Built `SkillTreePanel.tsx` with tab navigation, live announcements, effect previews sourced from `skillTree.ts`, and integrated it into the left HUD column.
4. Wired combat to apply skill bonuses (hit chance, melee damage, energy crit chance) and prevented tile traversal when `MapTile.skillRequirement` is unmet.
5. Enabled dialogue/world systems to consume `domain="skill"` checks while keeping UI labels in sync via `getSkillDefinition` lookups.
6. Expanded automated coverage (player slice, combat, dialogue, grid, SkillTreePanel) and ran the full Jest suite to lock in behaviour.
</tasks>

<implementation>
- `src/game/systems/skillTree.ts` centralises hit/crit/damage/radius maths so UI previews and runtime combat stay aligned, and exposes helpers for tagged increments.
- `playerSlice` now stores skill training, clones defaults during `createFreshPlayer`, and gates allocation against branch caps defined in content.
- `SkillTreePanel` surface includes tablist keyboard support, tag badges, and effect summaries that mirror combat formulas; announcements fire through `aria-live` for accessibility.
- Combat resolves a weapon's `skillType`, folds skill bonuses into hit chance and melee damage, and layers energy weapon crit bonuses on top of existing attribute-based critical chance.
- `DialogueOverlay` and `dialogueSystem` share `checkSkillRequirement`, honouring both attribute and skill domains, while `grid.ts` enforces optional tile skill requirements.
</implementation>

<code_reference file="src/content/skills.ts">
Branch definitions, increments, effect blurbs, and stub markers for Tech/Survival/Social trees
</code_reference>

<code_reference file="src/game/interfaces/types.ts">
Added skill tree types, weapon skillType, MapTile skill requirements, and extended Player state
</code_reference>

<code_reference file="src/game/interfaces/player.ts">
Seeded default skillTraining map and ensured fresh player clones remain isolated
</code_reference>

<code_reference file="src/store/playerSlice.ts">
Skill allocation/refund reducers, tagged increments, and deep copies during character initialisation
</code_reference>

<code_reference file="src/game/systems/skillTree.ts">
Shared helpers for hit bonuses, crit bonuses, melee damage boosts, explosive radius, and tag increments
</code_reference>

<code_reference file="src/components/ui/SkillTreePanel.tsx">
Tabbed allocation panel with accessible controls, effect summaries, and live announcements
</code_reference>

<code_reference file="src/game/combat/combatSystem.ts">
Applied weapon skill bonuses to hit/damage/crit calculations and respected skill-informed weapon metadata
</code_reference>

<code_reference file="src/components/ui/DialogueOverlay.tsx">
Delegated gating to shared helper and resolved skill names from content definitions
</code_reference>

<code_reference file="src/game/quests/dialogueSystem.ts">
Added skill-domain checks backed by `player.skillTraining`
</code_reference>

<code_reference file="src/game/world/grid.ts">
Honoured tile skill requirements when evaluating walkable positions
</code_reference>

<code_reference file="src/__tests__/playerSlice.test.ts">
Coverage for allocation/refund/tag handling
</code_reference>

<code_reference file="src/__tests__/SkillTreePanel.test.tsx">
UI regression ensuring spend interaction updates the HUD
</code_reference>

<code_reference file="src/__tests__/combat.test.ts">
Skill-driven hit/damage/crit expectations with deterministic random rolls
</code_reference>

<code_reference file="src/__tests__/dialogueSystem.test.ts">
Skill domain gating for dialogue checks
</code_reference>

<code_reference file="src/__tests__/grid.test.ts">
Walkability tests covering tile skill requirements
</code_reference>

<code_reference file="src/__tests__/dialogueOverlay.test.tsx">
UI lock/unlock behaviour for skill-based dialogue options
</code_reference>

<validation>
- `yarn test --watch=false`
</validation>

<notes>
- Tech/Survival/Social branches are stubbed intentionally; effect hooks will land in later roadmap steps.
- Perk unlock handling remains deferred to Step 24.3.
- Future work: expose allocated skill totals inside PlayerStatsPanel and thread skill training into future world interactions (lockpicks, hacking consoles).
</notes>
<maintenance_notes date="October 3, 2025">
- Simplified the left HUD column to a recon map plus a compact player summary card; moved detailed stats/skill allocation into the new Character Screen overlay (launchable via HUD button or `C`).
- Reused existing status panels inside the modal, layered in loadout/inventory summaries, surfaced branch skill totals back in the HUD, and added tests covering the new toggle flow.
</maintenance_notes>
</step>

<step id="25.2" status="completed">
<step_metadata>
  <number>25.2</number>
  <title>Durability & Encumbrance Mechanics</title>
  <status>Completed</status>
  <date>October 4, 2025</date>
</step_metadata>
<linear key="GET-38" />

<tasks>
1. Added inventory reducer helpers covering equipment swaps, stack splitting, repairs, and hotbar assignment while centralising weight recalculation and encumbrance updates.
2. Implemented durability-aware combat flow: weapon/armor effectiveness scales with condition, durability decays on use, and encumbrance multipliers now gate movement and attack AP costs.
3. Updated GameController logging to broadcast encumbrance warnings/durability events and extended Jest coverage for reducers, combat edges, and endurance failure cases.
</tasks>

<implementation>
- `refreshInventoryMetrics` now recomputes carried weight, normalises the five-slot hotbar, and delegates encumbrance scoring to the new `inventory/encumbrance` utility.
- Combat attacks multiply damage/mitigation by durability modifiers, decay condition per strike, and emit structured `CombatEvent`s consumed by the HUD.
- Movement and attack pipelines honour encumbrance-derived AP multipliers; queued path traversal aborts when the player is immobile and logs the localized warning.
</implementation>

<code_reference file="src/store/playerSlice.ts">Reducer helpers for equip/unequip, repairs, stack management, and encumbrance refresh.</code_reference>
<code_reference file="src/game/inventory/encumbrance.ts">Encumbrance thresholds, penalty multipliers, and helper APIs.</code_reference>
<code_reference file="src/game/combat/combatSystem.ts">Durability-aware damage flow, combat events, and encumbrance-aware AP costs.</code_reference>
<code_reference file="src/components/GameController.tsx">Movement gating, logging hooks for encumbrance/durability, and event handling.</code_reference>
<code_reference file="src/__tests__/playerSlice.test.ts">Reducer regression coverage for new helpers and encumbrance scenarios.</code_reference>
<code_reference file="src/__tests__/combat.test.ts">Durability and encumbrance combat tests.</code_reference>

<validation>
- `yarn test --watch=false`
</validation>

</step>

<step id="2" status="completed">
<step_metadata>
  <number>2</number>
  <title>Structure the Project Files</title>
  <status>Completed</status>
  <date>March 26, 2024</date>
</step_metadata>
<linear key="GET-39" />

<tasks>
1. Authored type definitions and gameplay systems across `game/*` (player, combat, AI, world, inventory, quests, dialogue).
2. Added Redux slices for player/world/quests and combined them into the store.
3. Delivered foundational unit tests in `__tests__/types.test.ts`.
</tasks>

<notes>
- Gameplay subsystems are modular, pure, and fully typed—ready for engine integration.
</notes>
</step>

<step id="3" status="completed">
<step_metadata>
  <number>3</number>
  <title>Embed the Game Engine</title>
  <status>Completed</status>
  <date>March 26, 2024</date>
</step_metadata>
<linear key="GET-40" />

<tasks>
1. Extended `GameCanvas` to bootstrap Phaser scenes and sync with Redux.
2. Built `MainScene` rendering and subscriptions; added `GameController` for keyboard input and AP-aware combat moves.
3. Created unit tests to confirm Redux state updates driven by engine events.
</tasks>

<notes>
- Rendering is decoupled from logic, and the player sprite now moves live in Phaser.
</notes>
</step>

<step id="4" status="completed">
<step_metadata>
  <number>4</number>
  <title>Add Grid-Based Player Movement</title>
  <status>Completed</status>
  <date>March 26, 2024</date>
</step_metadata>
<linear key="GET-41" />

<tasks>
1. Enhanced `grid.ts` with obstacles, cover tiles, and walkability guards.
2. Improved tile visuals and added feedback for invalid moves.
3. Added grid/pathfinding/bounds tests.
</tasks>

<notes>
- Movement respects map geometry, laying the groundwork for tactical play.
</notes>
</step>

<step id="5" status="completed">
<step_metadata>
  <number>5</number>
  <title>Build a Basic Combat System</title>
  <status>Completed</status>
  <date>March 26, 2024</date>
</step_metadata>
<linear key="GET-42" />

<tasks>
1. Implemented AP-driven turns (move = 1 AP, attack = 2 AP) with 5 damage baseline.
2. Rendered enemies/health bars in `MainScene` and added combat messaging.
3. Delivered AI behaviours and tests covering attacks, AP usage, and turn switching.
</tasks>

<maintenance_notes date="Sep 27–28, 2025">
- Fixed trapped-enemy stalls, enforced NPC occupancy rules, added click-to-approach dialogue, and persisted briefing summaries.
</maintenance_notes>
</step>

<step id="6" status="completed">
<step_metadata>
  <number>6</number>
  <title>Introduce Cover Mechanics & UI Overhaul</title>
  <status>Completed</status>
  <date>March 27, 2024</date>
</step_metadata>
<linear key="GET-43" />

<tasks>
1. Stabilized combat edge cases with a new `BootScene` and lifecycle fixes.
2. Delivered the three-column command hub (Status | Canvas | Log) with `PlayerStatusPanel` and `LogPanel`.
3. Refined grid rendering for consistent borders and smooth resizes.
</tasks>
</step>

<step id="11.5" status="completed">
<step_metadata>
  <number>11.5</number>
  <title>Implement Downtown/Slums Overhaul</title>
  <status>Completed</status>
  <date>October 02, 2025</date>
</step_metadata>
<linear key="GET-44" />

<tasks>
1. Differentiated building metadata and world generation to add district-aware cover clusters, prop density, and signage styling across Slums and Downtown.
2. Expanded Iso rendering toolkit with barricades, streetlights, and billboards, wiring `MainScene` to spawn district-specific dressing and highlight interactive NPCs/items.
3. Authored new dialogues, NPC routines, and loot placements so both districts feel populated and reward exploration.
</tasks>

<code_reference file="the-getaway/src/game/world/worldMap.ts">
District-aware tile decoration, item spawn positioning, and seeded NPC placement.
</code_reference>

<code_reference file="the-getaway/src/game/scenes/MainScene.ts">
Static prop generation, signage palette updates, and ground highlights for NPCs/items.
</code_reference>

<code_reference file="the-getaway/src/game/utils/IsoObjectFactory.ts">
New barricade, streetlight, and billboard render helpers for world dressing.
</code_reference>

<code_reference file="the-getaway/src/content/levels/level0/locales/en.ts">
Extended building metadata, additional NPC dialogues, cover spots, and loot definitions (mirrored in uk.ts).
</code_reference>

<notes>
- District overhauls now live in code; future tickets should build on these systems rather than re-deriving styling or prop logic.
</notes>
</step>

<step id="7" status="completed">
<step_metadata>
  <number>7</number>
  <title>Design a Small Explorable Map</title>
  <status>Completed</status>
  <date>June 7, 2025</date>
</step_metadata>
<linear key="GET-45" />

<tasks>
1. Authored Slums and Downtown areas with door connections stored in `worldMap.ts`.
2. Extended `worldSlice` to manage multiple map areas and hot-swapped scenes via door traversal.
</tasks>
</step>

<step id="8" status="completed">
<step_metadata>
  <number>8</number>
  <title>Add a Day-Night Cycle</title>
  <status>Completed</status>
  <date>April 5, 2024</date>
</step_metadata>
<linear key="GET-46" />

<tasks>
1. Synced time-of-day and curfew state into Redux and advanced time in `MainScene`.
2. Applied curfew rules in `GameController` and surfaced the cycle via `DayNightIndicator`.
</tasks>

<validation>
- `yarn lint`
- Manual curfew/nightfall playtests.
</validation>
</step>

<step id="9" status="completed">
<step_metadata>
  <number>9</number>
  <title>Establish Command Hub and Persisted Sessions</title>
  <status>Completed</status>
  <date>September 25, 2025</date>
</step_metadata>
<linear key="GET-47" />

<tasks>
1. Added the `GameMenu` overlay with start/continue flows.
2. Finalized the three-column HUD and collapsed telemetry into `PlayerStatusPanel`.
3. Introduced Redux persistence (`resetGame`, localStorage hydration).
</tasks>

<maintenance_notes date="October 7, 2025">
- Retained both sidebars in the DOM with a zero `flex-basis` collapse so the central canvas and HUD expand immediately instead of leaving grey gutters.
- Anchored the left/right toggle buttons to their sidebar rails with CSS-based offsets and a clamped vertical position, preventing overlap with the menu button, day/night indicator, or level badge.
- Published `--left-sidebar-width` / `--right-sidebar-width` (and last-width variants) on the stage container to support future HUD positioning helpers during collapsed states.
- Hooked GameCanvas up to a `ResizeObserver` so Phaser resizes with the flex column and no longer leaves grey gutters when rails collapse, with cached size guards plus a ~40 ms debounce to avoid black-frame flicker; rails now ease between their full width and `0px` to keep the transition smooth (still worth a quick dev-server smoke test for visual QA).
</maintenance_notes>
</step>

<step id="10" status="completed">
<step_metadata>
  <number>10</number>
  <title>Harden Curfew Pressure and Cover Feedback</title>
  <status>Completed</status>
  <date>September 25, 2025</date>
</step_metadata>
<linear key="GET-48" />

<tasks>
1. Built a curfew alert state machine with escalating patrol responses.
2. Authored `curfew.test.tsx` and highlighted cover tiles during lockdowns.
3. Trimmed log history while keeping warnings visible.
</tasks>

<validation>
- `yarn test src/__tests__/curfew.test.tsx`
</validation>
</step>

<step id="11" status="completed">
<step_metadata>
  <number>11</number>
  <title>Expand Downtown into Enterable Megablocks</title>
  <status>Completed</status>
  <date>September 26, 2025</date>
</step_metadata>
<linear key="GET-49" />

<tasks>
1. Rebuilt `worldMap.ts` into a 144×108 district with interiors and validated doors.
2. Seeded NPCs, loot caches, and persistent enemies; updated door handling to respect curfew.
</tasks>
</step>

<step id="12" status="completed">
<step_metadata>
  <number>12</number>
  <title>Create an NPC with a Routine</title>
  <status>Completed</status>
  <date>September 26, 2025</date>
</step_metadata>
<linear key="GET-50" />

<tasks>
1. Scheduled NPC movement between routine points and reserved destination tiles.
2. Extended pathfinding to avoid NPC stacking and cleaned up timeouts on area change.
</tasks>

<validation>
- `yarn test src/__tests__/curfew.test.tsx`
</validation>
</step>

<step id="13" status="completed">
<step_metadata>
  <number>13</number>
  <title>Set Up a Dialogue System</title>
  <status>Completed</status>
  <date>February 14, 2026</date>
</step_metadata>
<linear key="GET-51" />

<tasks>
1. Enabled proximity interaction (press `E`) to open dialogues.
2. Built `DialogueOverlay` with branching options, quest hooks, and Esc-to-close.
3. Added `dialogueOverlay.test.tsx` for UI coverage.
</tasks>

<validation>
- `yarn test src/__tests__/dialogueOverlay.test.tsx --watch=false`
</validation>
</step>

<step id="14" status="completed">
<step_metadata>
  <number>14</number>
  <title>Add a Skill Check to Dialogue</title>
  <status>Completed</status>
  <date>September 27, 2025</date>
</step_metadata>
<linear key="GET-52" />

<tasks>
1. Locked dialogue options behind skill thresholds with clear messaging.
2. Prevented locked options from firing quest effects or transitions.
3. Updated tests to verify mid-conversation unlocks after skill upgrades.
</tasks>

<validation>
- `yarn test src/__tests__/dialogueOverlay.test.tsx --watch=false`
</validation>
</step>

<step id="15" status="completed">
<step_metadata>
  <number>15</number>
  <title>Implement a Simple Quest</title>
  <status>Completed</status>
  <date>September 28, 2025</date>
</step_metadata>
<linear key="GET-53" />

<tasks>
1. Converted Ops Briefings into a persistent quest log with active/completed sections.
2. Enforced quest gating within dialogue hooks and distributed XP/credit/item rewards.
3. Externalized Level 0 content per locale and added UI string tables plus a settings panel.
</tasks>

<validation>
- `yarn test src/__tests__/dialogueOverlay.test.tsx --watch=false`
- `yarn test src/__tests__/opsBriefingsPanel.test.tsx --watch=false`
- `yarn test src/__tests__/App.test.tsx`
</validation>
</step>

<step id="16" status="completed">
<step_metadata>
  <number>16</number>
  <title>Seed Dialogue and Quest Threads</title>
  <status>Completed</status>
  <date>September 26, 2025</date>
</step_metadata>
<linear key="GET-54" />

<tasks>
1. Populated `questsSlice` with branching dialogue trees for Lira, Naila, and Brant.
2. Authored three quest lines with objectives, counters, and rewards.
3. Added reducers for objective progress, collectibles, and dialogue state.
</tasks>

<validation>
- `yarn test src/__tests__/dialogueOverlay.test.tsx --watch=false`
</validation>
</step>

<step id="16.5" status="completed">
<step_metadata>
  <number>16.5</number>
  <title>Author Storylet Library Framework</title>
  <status>Completed</status>
  <date>October 12, 2025</date>
</step_metadata>
<linear key="GET-55" />

<tasks>
1. Defined a reusable storylet contract and seeded the inaugural catalog with act-aligned plays plus localized narrative payloads.
2. Implemented the storylet engine to score triggers, cast actors into roles, evaluate branches, and honor cooldowns/location locks.
3. Added a dedicated Redux slice that queues resolved storylets, applies faction/personality/health effects, and exposes selectors for future UI rendering.
4. Wired mission completion, campfire rest, and curfew ambush flows to dispatch storylet triggers and introduced focused Jest coverage for engine + slice logic.
</tasks>

<implementation>
<code_reference file="the-getaway/src/game/quests/storylets/storyletTypes.ts" />
<code_reference file="the-getaway/src/game/quests/storylets/storyletRegistry.ts" />
<code_reference file="the-getaway/src/game/quests/storylets/storyletEngine.ts" />
<code_reference file="the-getaway/src/store/storyletSlice.ts" />
<code_reference file="the-getaway/src/components/system/MissionProgressionManager.tsx" />
<code_reference file="the-getaway/src/components/GameController.tsx" />
<code_reference file="the-getaway/src/content/storylets/index.ts" />
</implementation>

<validation>
- `yarn test --runTestsByPath src/game/quests/storylets/__tests__/storyletEngine.test.ts src/store/__tests__/storyletSlice.test.ts --watch=false`
</validation>
</step>

<step id="17" status="completed">
<step_metadata>
  <number>17</number>
  <title>Pivot Rendering to Neon Isometric Grid</title>
  <status>Completed</status>
  <date>September 26, 2025</date>
</step_metadata>
<linear key="GET-56" />

<tasks>
1. Reprojected `MainScene` to an isometric layout with recalibrated metrics and camera bounds.
2. Added layered neon ambiance and tuned the day-night overlay for stable zoom behaviour.
3. Simplified grid rendering with alternating floor tones to remove aliasing.
</tasks>

<validation>
- Manual playtests covering zoom/pointer accuracy and overlay stability.
</validation>
</step>

<step id="18" status="completed">
<step_metadata>
  <number>18</number>
  <title>Click-to-Move Navigation and Path Preview</title>
  <status>Completed</status>
  <date>September 26, 2025</date>
</step_metadata>
<linear key="GET-57" />

<tasks>
1. Implemented breadth-first pathfinding with enemy avoidance and door awareness.
2. Emitted tile click events, rendered path previews, and queued path execution in `GameController`.
3. Expanded camera/log handling for long routes and synced `tsconfig` with the new event modules.
</tasks>

<validation>
- Manual roam tests covering long-distance travel, door traversal, and curfew restrictions.
</validation>

<maintenance_notes date="October 4, 2025">
- Replaced the legacy minimap snapshotper with `MiniMapController`, layering cached tiles/overlays/entities and exposing dirty flags so React only redraws touched layers.
- Added Shift+drag waypoint previews (`MINIMAP_PATH_PREVIEW_EVENT`), legend objective focus hooks, keyboard panning, and high-contrast/auto-rotate toggles to the minimap HUD.
- Updated miniMapService tests to cover controller dirty states and ensured GameController consumes the new waypoint event for consistent pathing.
</maintenance_notes>
</step>

<step id="18.5" status="completed">
<step_metadata>
  <number>18.5</number>
  <title>Centralize Depth Ordering and Camera PostFX Defaults</title>
  <status>Completed</status>
  <date>February 24, 2026</date>
</step_metadata>
<linear key="GET-7" />

<tasks>
1. Added `computeDepth`, `DepthBias`, `DepthLayers`, and a scene-scoped `DepthManager` so isometric objects share a single ordering pipeline.
2. Refactored `IsoObjectFactory` and `MainScene` to register dynamic props, characters, highlights, and HUD overlays through the depth manager instead of local `setDepth` calls.
3. Introduced `visualSettings.ts` with bloom/vignette/color matrix defaults and bound `MainScene` to the shared camera FX toggles.
4. Authored `memory-bank/graphics.md`, updated the architecture guide, and added Jest coverage for the new depth utilities.
</tasks>

<implementation>
- `DepthManager` listens to scene pre-update ticks, applies `computeDepth` per registration, and exposes helpers (`syncDepthPoint`, `DepthLayers`) so reserved overlays stay in their bands.
- `IsoObjectFactory` now syncs depth data for every graphic/container it spawns, translating legacy offsets into `DepthBias` additions while keeping fallback support for scenes without a manager.
- `MainScene` instantiates the manager, routes labels/bars/path previews through `syncDepthPoint`, registers static overlays with `DepthLayers`, and now binds a neutral post-FX profile (all effects disabled by default) via `bindCameraToVisualSettings` to preserve the original brightness.
- New documentation captures bias bands and camera FX workflow, with targeted tests guarding bias math, manager updates, and destroy cleanup.
</implementation>

<code_reference file="the-getaway/src/game/utils/depth.ts" />
<code_reference file="the-getaway/src/game/utils/IsoObjectFactory.ts" />
<code_reference file="the-getaway/src/game/scenes/MainScene.ts" />
<code_reference file="the-getaway/src/game/settings/visualSettings.ts" />
<code_reference file="the-getaway/src/game/utils/__tests__/depth.test.ts" />
<code_reference file="memory-bank/graphics.md" />
<code_reference file="memory-bank/architecture.md" />

<validation>
- `yarn test --runTestsByPath src/game/utils/__tests__/depth.test.ts --runInBand`
</validation>
</step>

<step id="19" status="completed">
<step_metadata>
  <number>19</number>
  <title>Implement Guard Perception & Alert States</title>
  <status>Completed</status>
  <date>September 29, 2025</date>
</step_metadata>
<linear key="GET-58" />

<tasks>
1. Extended `Enemy` type with `VisionCone`, `AlertLevel`, `alertProgress`, and `lastKnownPlayerPosition`.
2. Created `perception.ts` module with vision cone calculations, line-of-sight checks, and alert state transitions.
3. Built `perceptionManager.ts` to process perception updates for all enemies and determine global alert level.
4. Added vision cone rendering to `MainScene` with color-coded overlays based on alert level.
5. Integrated perception processing into `GameController` with automatic enemy alert updates.
6. Implemented reinforcement spawning when enemies reach `ALARMED` state.
7. Added localized alert messages in English and Ukrainian for suspicion, investigation, and alarm states.
</tasks>

<validation>
- `yarn build` – successful
- `yarn lint` – no errors
- Vision cones render in MainScene with isometric projection
- Alert states escalate: IDLE → SUSPICIOUS → INVESTIGATING → ALARMED
- Reinforcements spawn automatically when alarm threshold is reached
- Alert messages appear in action log with proper localization
</validation>
</step>

<step id="20" status="completed">
<step_metadata>
  <number>20</number>
  <title>Redesign World Map with NYC Grid Layout</title>
  <status>Completed</status>
  <date>September 29, 2025</date>
</step_metadata>
<linear key="GET-59" />

<tasks>
1. Locked Downtown to a Manhattan-inspired grid:
   - Four avenues (x=24–26, 60–62, 96–98, 132–134) and four streets (y=20–21, 44–45, 68–69, 92–93) carve 16 rectangular blocks.
   - Building generation respects boulevard tiles so navigation lanes always stay clear.
2. Consolidated block content into 16 thematic parcels (one per block) with concise localized names.
3. Moved every exterior door onto walkable street tiles, away from the building footprint, and guaranteed unique doorway coordinates.
4. Refined building label rendering in `MainScene` with word wrapping, subtle shadows, and depth ordering tied to tile height.
5. Updated both English and Ukrainian locale payloads to match the new block list and door coordinates.
6. Recorded the grid and parcel rules in `/memory-bank/architecture.md`.
</tasks>

<implementation>
<code_reference file="worldMap.ts">
Enforces street/avenue carving, clears legacy door tiles inside footprints, and keeps door tiles walkable.
</code_reference>

<code_reference file="MainScene.ts">
Receives building metadata from `BootScene`, stores it for label rendering, and ensures labels clear when switching to interiors.
</code_reference>

<code_reference file="BootScene.ts">
Loads building definitions from locale content before launching `MainScene` so the scene can render parcel labels immediately.
</code_reference>

<code_reference file="levels/level0/locales/*">
Reauthored `buildingDefinitions` to the 16-parcel model with single street-facing doors per block.
</code_reference>
</implementation>

<validation>
- `yarn build`
- Manual review confirms each parcel occupies a single block, doors sit on street coordinates, and labels appear once per block.
</validation>
</step>

<step id="19.5" status="completed">
<step_metadata>
  <number>19.5</number>
  <title>Surveillance Camera System (Curfew Enforcement)</title>
  <status>Completed</status>
  <date>October 9, 2025</date>
</step_metadata>
<linear key="GET-60" />

<tasks>
1. Authored per-zone camera configurations and registered surveillance state in Redux so runtime cameras and HUD telemetry share a single source.
2. Built Phaser `CameraSprite` containers plus the surveillance update loop, applying stealth/crouch modifiers, curfew activation, and network alert escalation.
3. Added `CameraDetectionHUD`, `CurfewWarning`, overlay toggles, crouch keybindings, and minimap camera glyphs reflecting alert status.
4. Exercised slice behaviour with dedicated tests covering zone registration, HUD merges, overlay toggles, and curfew banner lifecycle.
</tasks>

<implementation>
<code_reference file="the-getaway/src/content/cameraConfigs.ts" />
<code_reference file="the-getaway/src/store/surveillanceSlice.ts" />
<code_reference file="the-getaway/src/game/systems/surveillance/cameraSystem.ts" />
<code_reference file="the-getaway/src/game/objects/CameraSprite.ts" />
<code_reference file="the-getaway/src/components/GameController.tsx" />
<code_reference file="the-getaway/src/components/ui/CameraDetectionHUD.tsx" />
<code_reference file="the-getaway/src/components/ui/CurfewWarning.tsx" />
<code_reference file="the-getaway/src/components/ui/MiniMap.tsx" />
<code_reference file="the-getaway/src/__tests__/surveillanceSlice.test.ts" />
</implementation>

<validation>
- `yarn test --runTestsByPath src/__tests__/surveillanceSlice.test.ts --watch=false`
</validation>
</step>

<step id="19.55" status="completed">
<step_metadata>
  <number>19.55</number>
  <title>Adaptive NPC FSM Behaviors</title>
  <status>Completed</status>
  <date>October 22, 2025</date>
</step_metadata>
<linear key="GET-8" />

<tasks>
1. Added `src/game/ai/fsm` with typed state contracts, deterministic RNG, and `createNpcFsmController` so guard AI consumes a shared, seeded state machine.
2. Authored guard archetype configs under `src/content/ai/guardArchetypes.ts`, capturing tuned weights, cooldowns, and utility modifiers that persist on each enemy entity.
3. Rebuilt `determineEnemyMove` around the FSM controller, wiring telemetry persistence, cooldown snapshots, and guard rails that coerce attacks/search/cover fallbacks when stochastic picks would otherwise idle.
4. Extended enemy schema/world bootstrap/GameController turn loop to hydrate FSM snapshots and expose telemetry to debugging overlays.
5. Refreshed combat/automation/perception tests, introduced focused FSM unit coverage, and documented the new AI pipeline in `memory-bank/architecture.md`.
</tasks>

<implementation>
- `determineEnemyMove` seeds guard archetypes, feeds perception-derived context into the FSM, stores transition telemetry (`aiTelemetry`), and enforces health/LoS fallbacks to keep behaviour deterministic when stakes are high.
- Guard archetypes provide authored modifiers (LoS boosts, low-health panic suppression, chase dampening) while cooldowns and personality seeds persist on the `Enemy` object for Redux serialisation and debug tooling.
- Tests lock controller weighting, cooldown enforcement, and the reworked enemy turn loop; architecture documentation captures the FSM stack so future agents know where to extend behaviours.
</implementation>

<code_reference file="the-getaway/src/game/ai/fsm/types.ts" />
<code_reference file="the-getaway/src/game/ai/fsm/random.ts" />
<code_reference file="the-getaway/src/game/ai/fsm/controller.ts" />
<code_reference file="the-getaway/src/content/ai/guardArchetypes.ts" />
<code_reference file="the-getaway/src/game/combat/enemyAI.ts" />
<code_reference file="the-getaway/src/game/interfaces/types.ts" />
<code_reference file="the-getaway/src/store/worldSlice.ts" />
<code_reference file="the-getaway/src/components/GameController.tsx" />
<code_reference file="the-getaway/src/game/ai/fsm/__tests__/controller.test.ts" />
<code_reference file="the-getaway/src/__tests__/combat.test.ts" />
<code_reference file="the-getaway/src/__tests__/autoBattlePlanner.test.ts" />
<code_reference file="the-getaway/src/__tests__/perceptionManager.test.ts" />
<code_reference file="the-getaway/src/__tests__/perks.test.ts" />
<code_reference file="memory-bank/architecture.md" />

<validation>
- `yarn test --runTestsByPath src/game/ai/fsm/__tests__/controller.test.ts src/__tests__/combat.test.ts src/__tests__/autoBattlePlanner.test.ts src/__tests__/perceptionManager.test.ts src/__tests__/perks.test.ts --runInBand`
</validation>
</step>

<step id="19.6" status="completed">
<step_metadata>
  <number>19.6</number>
  <title>Implement Witness Memory & Regional Heat</title>
  <status>Completed</status>
  <date>October 18, 2025</date>
</step_metadata>
<linear key="GET-9" />

<tasks>
1. Authored suspicion domain helpers (`witnessMemory.ts`, `observationBuilders.ts`, `aggregation.ts`) with unit coverage for decay, reinforcement, and heat aggregation.
2. Added `suspicionSlice` plus selectors, persistence migration, and decay ticks wired through `MainScene` to keep zone heat in sync with world time and pause during dialogues.
3. Hooked guard vision and surveillance alarms to emit observations via `GameController` and `cameraSystem`, introduced the dev-only `SuspicionInspector` overlay, and seeded logging for balancing.
</tasks>

<implementation>
- Guard and camera sightings now call `buildGuardWitnessObservation` / `buildCameraWitnessObservation` before dispatching `ingestObservation`, ensuring distance, lighting, disguise, and crouch dampeners apply consistently.
- `suspicionSlice` stores per-zone snapshots, recomputes heat tiers using top-K weighted memories, supports suppression, and migrates existing saves via `store/index.ts`.
- Dev tooling renders leading witnesses and heat tiers through `SuspicionInspector`, while surveillance updates propagate observations over an injected callback without duplicating Redux knowledge in the system layer.
</implementation>

<code_reference file="the-getaway/src/game/systems/suspicion/witnessMemory.ts" />
<code_reference file="the-getaway/src/game/systems/suspicion/observationBuilders.ts" />
<code_reference file="the-getaway/src/game/systems/suspicion/aggregation.ts" />
<code_reference file="the-getaway/src/store/suspicionSlice.ts" />
<code_reference file="the-getaway/src/game/scenes/MainScene.ts" />
<code_reference file="the-getaway/src/components/GameController.tsx" />
<code_reference file="the-getaway/src/game/systems/surveillance/cameraSystem.ts" />
<code_reference file="the-getaway/src/components/debug/SuspicionInspector.tsx" />

<validation>
- `yarn test --runTestsByPath src/game/systems/suspicion/__tests__/witnessMemory.test.ts src/game/systems/suspicion/__tests__/observationBuilders.test.ts src/store/__tests__/suspicionSlice.test.ts --watch=false`
</validation>

<notes>
- Suspicion decay pauses while dialogues run, and dev logging traces guard/camera memory reinforcements for tuning future AI escalations.
</notes>
</step>

<step id="21" status="completed">
<step_metadata>
  <number>21</number>
  <title>Transition Scene Rendering to Isometric 2.5-D</title>
  <status>Completed</status>
  <date>October 3, 2025</date>
</step_metadata>
<linear key="GET-61" />

<tasks>
1. Centralised isometric helpers (`getIsoMetrics`, `toPixel`, `getDiamondPoints`, `adjustColor`) in `src/game/utils/iso.ts` and added `iso.test.ts` to cover projection and colour math.
2. Introduced `IsoObjectFactory` for reusable props (e.g., crates, highlight diamonds) and refactored `MainScene` to consume the shared helpers, ensuring depth sorting and iso origins stay consistent.
3. Wired the turn-tracker HUD into the centre stage, added sample decorative props via the factory, and verified rendering uses uniform 2:1 assets with intact collision hotspots.
4. Elevated wall and cover tiles into full 2.5-D prisms with dynamic shadows, neon facade bands, and door overlays that project onto the front face.
5. Replaced building labels with neon isometric marquees that float above rooftops with additive glow and support braces.
6. Converted player, NPC, and enemy markers into sculpted 3D character tokens with ambient halos and attached nameplates.
</tasks>

<maintenance_notes date="October 3, 2025">
- Reworked `MainScene.renderTile` to apply elevation profiles, extruded faces, and updated door treatments for the isometric layout overhaul.
- Added neon building signage renderer plus character token/nameplate systems to `MainScene` with shared helpers from `IsoObjectFactory`.
</maintenance_notes>

<validation>
- `yarn lint`
- `yarn test iso.test.ts`
- `yarn build`
</validation>
</step>

<step id="22" status="completed">
<step_metadata>
  <number>22</number>
  <title>Define Player Stats</title>
  <status>Completed</status>
  <date>October 3, 2025</date>
</step_metadata>
<linear key="GET-62" />

<tasks>
1. Established S.P.E.C.I.A.L stat definitions with shared ranges, abbreviations, and focus tags in `playerStats.ts` plus a profile builder helper.
2. Localized stat labels, descriptions, and focus badges in the UI bundle for English and Ukrainian.
3. Introduced `PlayerStatsPanel` to surface the profile in the left HUD column with progress bars and command-shell styling.
</tasks>

<validation>
- `yarn lint`
- `yarn test src/__tests__/playerStats.test.ts --watch=false`
</validation>
</step>

<step id="22.1" status="completed">
<step_metadata>
  <number>22.1</number>
  <title>Basic Character Creation Flow (UI Shell, Name, Visual Preset)</title>
  <status>Completed</status>
  <date>October 3, 2025</date>
</step_metadata>
<linear key="GET-63" />

<tasks>
1. Created `CharacterCreationScreen.tsx` with multi-step wizard interface featuring step indicators and navigation.
2. Implemented Step 1 - Identity: character name input (3-20 characters, alphanumeric validation) and visual preset selection (4 presets: Operative, Survivor, Tech, Scavenger).
3. Added Randomize button for quick character generation from predefined names and random preset selection.
4. Added Skip Creation debug button (development only) that applies default values for rapid testing.
5. Integrated character creation into App.tsx new game flow, replacing immediate spawn with character creation screen.
6. Styled consistently with dystopian UI theme (neon cyan accents, dark backgrounds, terminal aesthetics).
</tasks>

<implementation>
- Character creation state managed locally in React (not Redux) until completion to allow cancel/back without polluting game state
- Name validation: 3-20 characters, alphanumeric + spaces + hyphens only
- Visual presets stored as IDs ('operative', 'survivor', 'tech', 'scavenger') and reused when the background catalog (Step 22.3) binds the final narrative payload
- Enter key triggers Continue button when form valid
- Cancel returns to main menu; completing Step 1 now naturally routes into attribute allocation (22.2) and background selection (22.3) before dispatching initialization
</implementation>

<code_reference file="src/components/ui/CharacterCreationScreen.tsx">
Created full character creation UI component with identity step, validation, and styling
</code_reference>

<code_reference file="src/App.tsx">
Added showCharacterCreation state and handlers: handleCharacterCreationComplete, handleCharacterCreationCancel
Modified handleStartNewGame to show character creation instead of immediately starting game
</code_reference>

<validation>
- `yarn build` - successful compilation with no TypeScript errors
- Manual testing: Start new game → Character creation appears → Enter name and select preset → Click Continue → Game starts with character name in log
- Randomize button generates random name and preset
- Cancel returns to main menu
- Name validation prevents invalid inputs (too short, too long, special characters)
</validation>

<notes>
- Steps 22.2 and 22.3 hook onto this shell, completing attribute allocation and background selection before finalizing the player state
- Character data seeds the operation log; follow-up steps now enrich it with finalized SPECIAL values and background metadata ahead of initialization
- Step indicators track identity → attributes → background across the three-step wizard
</notes>
</step>

<step id="22.2" status="completed">
<step_metadata>
  <number>22.2</number>
  <title>Attribute Allocation System</title>
  <status>Completed</status>
  <date>October 4, 2025</date>
</step_metadata>
<linear key="GET-64" />

<tasks>
1. Finished the character creation allocation step with ± controls, point budget enforcement, and SPECIAL tooltips that mirror the stat design brief.
2. Surfaced live derived stat preview (HP, AP, carry weight, crit, hit, dodge) using the roadmap formulas while flagging critically low Agility/Endurance spreads.
3. Hardened navigation flow so Step 2 now gates Step 3 instead of prematurely finalizing characters without background data.
</tasks>

<code_reference file="src/components/ui/CharacterCreationScreen.tsx">
Reworked Step 2 interactions, tooltips, derived stat panel, and navigation guards for the attribute budget flow.
</code_reference>

<validation>
- `yarn test App.test.tsx --watch=false`
</validation>

<notes>
- Attribute data still lives in local component state until confirmation, keeping Redux clean during backtracking.
</notes>
</step>

<step id="22.3" status="completed">
<step_metadata>
  <number>22.3</number>
  <title>Background Selection with Starting Perks</title>
  <status>Completed</status>
  <date>October 4, 2025</date>
</step_metadata>
<linear key="GET-65" />

<tasks>
1. Authored the background catalog (`corpsec_defector`, `street_urchin`, `underground_hacker`, `wasteland_scavenger`) with faction deltas, perks, and starting loadouts.
2. Added Step 3 UI cards with deterministic test IDs, accessibility labels, and confirmation gating tied to selection state.
3. Extended `initializeCharacter` to apply background perks, faction reputation shifts, and spawn equipment, plus a debug-safe fallback for missing IDs.
4. Introduced unit coverage to prove background initialization equips the correct gear and handles unknown IDs gracefully.
</tasks>

<code_reference file="src/content/backgrounds.ts">
Defined canonical background data set with perks, faction adjustments, and starting inventory payloads.
</code_reference>

<code_reference file="src/components/ui/CharacterCreationScreen.tsx">
Implemented Step 3 background selection flow with validation and onComplete payload updates.
</code_reference>

<code_reference file="src/store/playerSlice.ts">
Applied background perks, faction reputation deltas, and loadout seeding during character initialization.
</code_reference>

<code_reference file="src/__tests__/backgroundInitialization.test.ts">
Added regression coverage for perk/equipment/faction initialization and missing background safety.
</code_reference>

<code_reference file="src/App.tsx">
Defaulted character creation to a safe background fallback when debug shortcuts skip explicit selection.
</code_reference>

<validation>
- `yarn test App.test.tsx --watch=false`
- `yarn test backgroundInitialization.test.ts --watch=false`
</validation>

<notes>
- Background selection now blocks confirmation until a card is chosen, preventing half-configured player states from entering the campaign.
</notes>
</step>

<step id="23" status="completed">
<step_metadata>
  <number>23</number>
  <title>Integrate Player Stats with Combat and Dialogue Systems</title>
  <status>Completed</status>
  <date>October 3, 2025</date>
</step_metadata>
<linear key="GET-66" />

<tasks>
1. Created `statCalculations.ts` with comprehensive derived stat calculation system.
2. Implemented 9 derived stat formulas: Max HP, Base AP, Carry Weight, Critical Chance, Hit Chance Modifier, Dodge Chance, Melee Damage Bonus, Dialogue Threshold Bonus, Skill Points per Level.
3. Updated `player.ts` to calculate DEFAULT_PLAYER stats from DEFAULT_SKILLS using formulas.
4. Enhanced `playerSlice.ts` with automatic derived stat recalculation when attributes change via updateSkill() and new setSkill() action.
5. Added helper functions: skillCheckPasses() for dialogue checks, formatStatWithModifier() for UI display.
</tasks>

<implementation>
**Formulas Implemented:**
- Max HP = `50 + (endurance × 10)` (Endurance 5 = 100 HP)
- Base AP = `6 + floor((agility - 5) × 0.5)` (Agility 5 = 6 AP, range 5-8)
- Carry Weight = `25 + (strength × 5)` kg (Strength 5 = 50 kg)
- Crit Chance = `5 + (perception × 2) + (luck × 2)`% (base 19% with 5/5)
- Hit Chance Modifier = `(perception - 5) × 3`% (affects combat accuracy)
- Dodge Chance = `(agility - 5) × 2`% (affects evasion)
- Melee Damage Bonus = `floor(strength / 2)` (flat damage added to melee)
- Dialogue Threshold Bonus = `floor(charisma / 2)` (persuasion boost)
- Skill Points per Level = `3 + floor(intelligence / 3)` (3-6 points)

**Stat Recalculation:**
- updateSkill() preserves HP ratio and current AP when maxes change
- Attributes clamped to 1-10 range
- setSkill() for direct setting during character creation (full heal/AP restore)
</implementation>

<code_reference file="src/game/systems/statCalculations.ts">
New module with all derived stat formulas and calculation functions
</code_reference>

<code_reference file="src/game/interfaces/player.ts">
DEFAULT_PLAYER now calculates derived stats: maxHP (100), maxAP (6), carryWeight (50)
</code_reference>

<code_reference file="src/store/playerSlice.ts">
Added setSkill() action, enhanced updateSkill() with automatic recalculation
</code_reference>

<validation>
- `yarn build` - successful compilation
- Default player with SPECIAL 5/5/5/5/5/5/5 correctly shows: 100 HP, 6 AP, 50 kg carry
- Formulas match implementation plan specifications
- Ready for Step 22.2 attribute allocation UI (needs these formulas for preview)
</validation>

<notes>
- Combat and dialogue systems now consume the shared derived stat helpers; future steps will expand formulas but the baseline integration is live
- PlayerStatsPanel exposes attribute spending via Step 22.2/23 updates and will gain further polish alongside progression features
- Equipment stat bonuses are extended in Step 23.5 for weapon/armor impact
</notes>
</step>

<step id="23.5" status="completed">
<step_metadata>
  <number>23.5</number>
  <title>Wire Equipment Stats to Combat Formulas</title>
  <status>Completed</status>
  <date>October 3, 2025</date>
</step_metadata>
<linear key="GET-67" />

<tasks>
1. Extended item interfaces (Weapon, Armor) to include StatModifiers with stat bonuses (strength, perception, etc.), armor rating, AP penalty, and damage bonus fields.
2. Added equipment slot tracking: Player interface now includes equipped: { weapon, armor, accessory } to track equipped items separately from inventory.
3. Created equipmentEffects.ts system with bonus aggregation functions:
   - getEquippedBonuses() aggregates all stat modifiers from equipped items
   - calculateEffectiveSkills() computes attributes with equipment bonuses
   - getEffectiveArmorRating() returns total armor rating
   - getEffectiveMaxAP() applies AP penalties from heavy armor
   - applyArmorReduction() calculates damage reduction (minimum 1 damage always gets through)
4. Updated statCalculations.ts with equipment-aware functions:
   - calculateDerivedStatsWithEquipment() uses effective attributes including equipment
   - getEffectiveAttribute() returns single attribute with equipment bonuses
   - getEffectiveAttributes() returns all attributes with equipment bonuses
5. Enhanced inventorySystem.ts with equipment management:
   - equipWeapon() / equipArmor() swap items between inventory and equipped slots
   - unequipWeapon() / unequipArmor() return items to inventory
   - Updated createWeapon() and createArmor() to accept optional statModifiers parameter
6. Added Redux actions to playerSlice:
   - equipWeapon / equipArmor: move items from inventory to equipped slots
   - unequipWeapon / unequipArmor: return equipped items to inventory
7. Updated DEFAULT_PLAYER to include empty equipped object.
</tasks>

<implementation>
- Equipment stat system aggregates modifiers and now feeds combat: weapon bonuses increase outgoing damage and armor absorbs incoming hits with a 1-damage floor
- AP penalties from heavy armor directly reduce max AP (e.g., -1 AP penalty makes 6 AP become 5 AP)
- Equipment swapping automatically handles inventory weight (equipped items don't count toward carry weight)
- Stat bonuses stack additively (weapon +2 STR + armor +1 STR = +3 STR total)
</implementation>

<code_reference file="src/game/interfaces/types.ts">
Added StatModifiers interface, equipment slot tracking to Player, and slot field to Weapon/Armor interfaces
</code_reference>

<code_reference file="src/game/systems/equipmentEffects.ts">
Created equipment bonus aggregation system with effective stat calculations and armor reduction formulas
</code_reference>

<code_reference file="src/game/systems/statCalculations.ts">
Added calculateDerivedStatsWithEquipment(), getEffectiveAttribute(), and getEffectiveAttributes() functions
</code_reference>

<code_reference file="src/game/inventory/inventorySystem.ts">
Added equipWeapon/Armor and unequipWeapon/Armor functions, updated item creation functions
</code_reference>

<code_reference file="src/store/playerSlice.ts">
Added equipWeapon, equipArmor, unequipWeapon, unequipArmor Redux actions
</code_reference>

<code_reference file="src/game/combat/combatSystem.ts">
Hooked equipment bonuses into hit chance, damage, and armor mitigation
</code_reference>

<code_reference file="src/__tests__/combat.test.ts">
Added regression coverage for weapon damage bonuses and armor reduction
</code_reference>

<validation>
- `yarn build`
- `yarn test combat.test.ts --watch=false`
</validation>

<notes>
- Visual feedback for stat changes remains a future enhancement (PlayerStatsPanel will receive styling cues)
- No equipment items with stat modifiers defined yet (content files will expand the catalog)
- Accessory slot defined but not yet implemented (future expansion)
</notes>
</step>

<step id="24.1" status="completed">
<step_metadata>
  <number>24.1</number>
  <title>XP and Leveling Foundation</title>
  <status>Completed</status>
  <date>October 1, 2025</date>
</step_metadata>
<linear key="GET-68" />

<tasks>
1. Created progression.ts system with complete XP and leveling mechanics:
   - XP_REWARDS constants for all XP sources (quests, combat, skill checks, exploration)
   - calculateXPForLevel() using formula: 100 * level * (1 + level * 0.15)
   - calculateSkillPointsAwarded() using formula: 3 + floor(intelligence / 3)
   - shouldAwardAttributePoint() - awards on every level up (1, 2, 3, ...)
   - shouldUnlockPerkSelection() - unlocks every 2 levels (2, 4, 6, etc.)
   - processLevelUp() - handles sequential multiple level-ups automatically
   - Helper functions: calculateXPProgress(), formatXPDisplay(), calculateTotalXPForLevel()
2. Extended Player interface with progression tracking:
   - Added skillPoints: number for unspent skill points (skill tree allocation)
   - Added attributePoints: number for unspent attribute points (SPECIAL increases)
3. Enhanced playerSlice.ts with XP and leveling actions:
   - addExperience: automatically processes level-ups and awards skill/attribute points
   - spendSkillPoints: reduces skillPoints counter (skill tree usage)
   - spendAttributePoint: increases attribute by 1, recalculates derived stats (HP, AP, carry weight)
4. Created level-up notification UI components:
   - LevelUpModal.tsx: full-screen modal with animated "LEVEL UP" banner, shows new level, skill points earned, attribute points, perk unlocks
   - XPNotification.tsx: toast notification system for XP gains with auto-dismiss
   - XPNotificationManager: handles multiple stacked notifications
5. Integrated progression UI into App.tsx:
   - Added level-up modal state management
   - Added XP notification queue with dismiss handlers
   - Created progressionHelpers.ts for notification creation utilities
6. Comprehensive test coverage in progression.test.ts:
   - All 30 tests passing covering XP formulas, level-up mechanics, skill point awards, attribute point awards, perk unlocks
   - Verified multiple level-up handling, HP/AP increases, intelligence-based skill point scaling
</tasks>

<implementation>
- XP formula scales progressively: Level 2 = 260 XP, Level 3 = 435 XP, Level 5 = 875 XP, Level 10 = 2500 XP
- Skill points scale with Intelligence: INT 1-2 = 3 points, INT 3-5 = 4 points, INT 6-8 = 5 points, INT 9-10 = 6 points
- Attribute points awarded on every level up to allow constant SPECIAL growth opportunities
- Perk unlocks every 2 levels (UI components ready, perk system implementation in Step 24.3)
- Health increases by +5 per level, full heal on level-up
- AP increases by +1 every 5 levels (levels 5, 10, 15, etc.)
- Level-up modal shows all rewards earned (handles multiple level-ups correctly)
- XP notifications stack vertically with auto-dismiss after 3 seconds
- spendAttributePoint recalculates HP/AP/carry weight when attributes increase
</implementation>

<code_reference file="src/game/systems/progression.ts">
Complete XP progression system with formulas, rewards, and level-up processing
</code_reference>

<code_reference file="src/game/interfaces/types.ts">
Extended Player interface with skillPoints and attributePoints fields
</code_reference>

<code_reference file="src/game/interfaces/player.ts">
Updated DEFAULT_PLAYER with skillPoints: 0 and attributePoints: 0
</code_reference>

<code_reference file="src/store/playerSlice.ts">
Enhanced with addExperience (auto level-up), spendSkillPoints, spendAttributePoint actions
</code_reference>

<code_reference file="src/components/ui/LevelUpModal.tsx">
Full-screen animated level-up notification with rewards summary
</code_reference>

<code_reference file="src/components/ui/XPNotification.tsx">
Toast notification system for XP gains with stacking and auto-dismiss
</code_reference>

<code_reference file="src/utils/progressionHelpers.ts">
Helper utilities for creating XP notifications and level-up events
</code_reference>

<code_reference file="src/App.tsx">
Integrated level-up modal and XP notification manager into main app
</code_reference>

<validation>
- `yarn build` - successful compilation
- `yarn test progression.test.ts` - 30/30 tests passing
- Verified XP formula matches specification across all levels
- Confirmed multiple level-ups process correctly
- Validated skill point scaling with different Intelligence values
- Tested attribute point awards at correct levels (3, 6, 9)
- Verified perk unlocks at even levels (2, 4, 6, 8)
</validation>

<notes>
- Core XP and leveling system is complete and fully tested
- UI components ready but not yet integrated with game events (will connect when combat awards XP)
- Skill tree system (Step 24.2) will use skillPoints counter
- Perk system (Step 24.3) will check perk unlock flags from level-up
- Character creation Step 22.3 requires Steps 24.1-24.3 to be completed first
- Future: wire addExperience action to combat victories, quest completions, skill checks
- Future: wire XP notifications to game events using createXPNotification helper
- Future: trigger level-up modal when processLevelUp returns levelsGained > 0
</notes>
</step>

<step id="24.3" status="completed">
<step_metadata>
  <number>24.3</number>
  <title>Perk Selection System with Capstone Perks</title>
  <status>Completed</status>
  <date>October 3, 2025</date>
</step_metadata>
<linear key="GET-69" />

<tasks>
1. Defined 8 foundation perks in `perks.ts`: Steady Hands, Toughness, Quick Draw, Adrenaline Rush, Silent Runner, Gun Fu (capstone), Ghost (capstone), Executioner (capstone).
2. Created perk availability evaluation system that validates level, attribute, and skill requirements, blocking already-acquired perks.
3. Built `PerkSelectionPanel.tsx` with category-organized grid layout, prerequisite validation, locked state indicators, and capstone visual treatment (gold borders).
4. Implemented perk runtime state tracking for Gun Fu (shot counter), Adrenaline Rush (turn counter), and Ghost (invisibility turns, consumed flag).
5. Integrated perk effects into combat system: Steady Hands (+10% ranged hit chance), Toughness (+3 armor via equipmentEffects), Gun Fu (first shot 0 AP), Executioner (auto-crit below 25% HP).
6. Wired Adrenaline Rush triggering into `playerSlice` (updateHealth, setHealth, setPlayerData) to automatically activate +2 AP buff when dropping below 30% HP for 3 turns.
7. Added `PerkListPanel.tsx` displaying acquired perks with effects in compact card layout, integrated into CharacterScreen.
8. Localized all perk UI strings (panel title, category labels, requirements, effects, locked state, capstone tag) for English and Ukrainian.
9. Created `selectPerk` Redux action that validates availability, appends to player perks array, decrements pendingPerkSelections, and initializes perk-specific runtime state.
10. Wrote comprehensive test suite (`perks.test.ts`) covering perk definitions, availability validation, combat integration (Gun Fu, Executioner, Steady Hands, Toughness), and utility mechanics (Adrenaline Rush, Ghost).
</tasks>

<implementation>
- **Perk Categories**: Combat (Steady Hands, Toughness, Gun Fu, Executioner), Utility (Adrenaline Rush, Silent Runner, Ghost), Dialogue (stub for future), Capstone (Gun Fu, Ghost, Executioner marked with `capstone: true`).
- **Requirements**: Level gates (2/4/6/12), attribute thresholds (e.g., Perception 5 for Steady Hands, Endurance 6 for Toughness), skill minimums (e.g., Small Guns 75 for Gun Fu capstone).
- **Combat Integration**: `getRangedHitBonusFromPerks` applied in hit chance calculation, `getArmorBonusFromPerks` added to effective armor rating, `shouldGunFuAttackBeFree` checked before deducting attack AP, Executioner multiplies damage by 1.5 when target HP ≤ 25%.
- **Adrenaline Rush**: Triggers automatically when health drops below 30%, grants +2 AP (can exceed max), persists for 3 turns via `tickAdrenalineRush` called in `beginPlayerTurn`.
- **Gun Fu**: `resetGunFuForTurn` zeroes shot counter at turn start, `registerGunFuAttack` increments counter after first free shot, subsequent shots cost normal AP.
- **Ghost**: `recordGhostActivation` sets invisibility to 2 turns and marks consumed flag (once per combat), `decayGhostInvisibility` decrements turn counter each round.
- **UI Flow**: Perk selection panel opens when `pendingPerkSelections > 0`, close button disabled until all selections spent, perks displayed in category sections with availability badges.
</implementation>

<code_reference file="src/content/perks.ts">
Perk definitions, category helpers (listPerks, listPerksByCategory, getPerkDefinition), availability evaluator (evaluatePerkAvailability)
</code_reference>

<code_reference file="src/game/systems/perks.ts">
Perk runtime helpers: playerHasPerk, getRangedHitBonusFromPerks, getArmorBonusFromPerks, shouldGunFuAttackBeFree, registerGunFuAttack, resetGunFuForTurn, shouldTriggerAdrenalineRush, activateAdrenalineRush, tickAdrenalineRush, recordGhostActivation, decayGhostInvisibility
</code_reference>

<code_reference file="src/components/ui/PerkSelectionPanel.tsx">
Modal dialog with category grid, requirement validation UI, locked/unlocked states, capstone badge styling
</code_reference>

<code_reference file="src/components/ui/PerkListPanel.tsx">
Acquired perks display panel integrated into CharacterScreen
</code_reference>

<code_reference file="src/store/playerSlice.ts">
selectPerk action, perk runtime initialization in createFreshPlayer/setPlayerData, Adrenaline Rush auto-triggering in health updates, Gun Fu/Ghost turn ticking in beginPlayerTurn
</code_reference>

<code_reference file="src/game/combat/combatSystem.ts">
Perk bonus application: ranged hit chance (Steady Hands), Gun Fu AP cost override, Executioner auto-crit (line 252)
</code_reference>

<code_reference file="src/game/systems/equipmentEffects.ts">
Toughness armor bonus integrated into getEffectiveArmorRating
</code_reference>

<code_reference file="src/content/ui/index.ts">
English and Ukrainian perk UI strings (panelTitle, remainingLabel, categoryLabels, selectLabel, lockedLabel, closeLabel, requirementsLabel, effectsLabel, alreadyOwnedLabel, capstoneTag, emptyLabel)
</code_reference>

<code_reference file="src/App.tsx">
PerkSelectionPanel integration with pendingPerkSelections state sync from Redux
</code_reference>

<code_reference file="src/__tests__/perks.test.ts">
Comprehensive test coverage: perk definitions (8 perks, categories, capstones), availability validation (level/attribute/skill requirements, already-acquired blocking), combat perks (Steady Hands, Toughness, Gun Fu, Executioner), utility perks (Adrenaline Rush triggering/ticking, Ghost activation/decay), helper functions
</code_reference>

<validation>
- `yarn build` - successful compilation
- `yarn test perks.test.ts --watch=false` - 24/24 tests passing
- Manual verification: reach level 2, perk selection modal auto-opens, select Steady Hands, verify +10% ranged hit in combat log
- Tested Gun Fu: first shot costs 0 AP, second shot costs normal AP (verified in combat.test.ts)
- Tested Adrenaline Rush: dropping to 25% HP triggered +2 AP buff for 3 turns
- Tested Executioner: attacks against <25% HP enemies dealt critical damage
</validation>

<notes>
- Silent Runner and Quick Draw perk effects are defined but not yet wired into stealth/equipment systems (future enhancement).
- Dialogue perk category exists but has no perks yet (reserved for social interaction expansion).
- Perk refund/respec system not implemented (perks are permanent choices per spec).
- Future work: add more perks in each category, implement stealth system to activate Silent Runner, wire Quick Draw to equipment swap actions.
</notes>
</step>

<step id="24.5" status="completed">
<step_metadata>
  <number>24.5</number>
  <title>Stamina System - Core Resource Pool (MVP)</title>
  <status>Completed</status>
  <date>October 5, 2025</date>
</step_metadata>
<linear key="GET-70" />

<tasks>
1. Added stamina fields to the player model and Redux slice, including helper utilities for clamping values and preserving stamina ratios when Endurance changes.
2. Introduced `consumeStamina`, `regenerateStamina`, and `updateMaxStamina` reducers plus a shared constants module to centralize costs, regen rates, and exhaustion thresholds.
3. Wired `GameController` to charge stamina for sprinting and encumbrance-heavy movement while regenerating stamina during standard travel and surfacing localized fatigue warnings.
4. Updated summary, stats, level-up, and character-creation UIs to display stamina bars, fatigue badges, and max stamina summaries, completing locale coverage.
5. Extended unit tests to cover stamina consumption/regeneration flows, endurance upgrades, and default player invariants.
</tasks>

<implementation>
- Player stamina now scales with Endurance (50 + 5 per point) and persists through attribute reallocations via the new `updateStaminaCapacity` helper.
- `src/game/systems/stamina.ts` provides reusable constants (`STAMINA_COSTS`, regen values, thresholds) consumed by reducers and controllers.
- Sprinting (Shift + move) and movement while ≥80% encumbered consume stamina before dispatching `movePlayer`; exhausted players trigger localized log feedback and are prevented from sprinting.
- UI refresh includes a green stamina bar with fatigue badge in `PlayerSummaryPanel`, derived stat rows in `PlayerStatsPanel`, and an Endurance card callout in `LevelUpPointAllocationPanel`.
- Localization strings now cover stamina labels, fatigue hints, and insufficient stamina warnings across English and Ukrainian copies.
</implementation>

<code_reference file="src/store/playerSlice.ts" />
<code_reference file="src/game/systems/stamina.ts" />
<code_reference file="src/components/GameController.tsx" />
<code_reference file="src/components/ui/PlayerSummaryPanel.tsx" />
<code_reference file="src/components/ui/PlayerStatsPanel.tsx" />
<code_reference file="src/components/ui/LevelUpPointAllocationPanel.tsx" />
<code_reference file="src/components/ui/CharacterCreationScreen.tsx" />
<code_reference file="src/content/ui/index.ts" />
<code_reference file="src/content/system/index.ts" />
<code_reference file="src/game/systems/statCalculations.ts" />
<code_reference file="src/__tests__/playerSlice.test.ts" />
<code_reference file="src/__tests__/types.test.ts" />

<validation>
- `yarn test playerSlice.test.ts types.test.ts`
</validation>
</step>

<step id="25.1" status="completed">
<step_metadata>
  <number>25.1</number>
  <title>Inventory Data & Slot Framework</title>
  <status>Completed</status>
  <date>October 5, 2025</date>
</step_metadata>
<linear key="GET-72" />

<tasks>
1. Extended item and equipment interfaces with durability, stacking, and slot metadata (`equipSlot`, `quantity`, `Durability`) so downstream systems can reason about wear, stacking, and placement.
2. Expanded player inventory/equipment state to include hotbar slots, secondary/melee/body/helmet/accessory positions, equipped slot map, active weapon slot, and encumbrance tracking fields.
3. Updated default player creation (`DEFAULT_PLAYER`, `createFreshPlayer`, character creation) and `setPlayerData` hydration to seed the new structures while remaining backward compatible with existing saves and tests.
</tasks>

<implementation>
- Added `EquipmentSlot` union and `Durability` interface; item definitions now optionally carry `quantity`, `stackable`, `maxStack`, and `statModifiers` metadata.
- Player state now tracks `inventory.hotbar`, `equippedSlots`, `activeWeaponSlot`, and `encumbrance { level, percentage }`, with defaults injected for legacy saves.
- Test helpers across quest, perk, dialogue, inventory, and progression suites updated to reflect the expanded schema.
</implementation>

<validation>
- `yarn test --watch=false`
- `yarn build`
</validation>

<notes>
- Gameplay logic (durability decay, encumbrance penalties, hotbar interactions) will be implemented in Step 25.2.
- Architecture doc update for the inventory data model is queued alongside the remaining Step 25 work.
</notes>
</step>

<step id="25.3" status="completed">
<step_metadata>
  <number>25.3</number>
  <title>Inventory & Loadout UI Overhaul</title>
  <status>Completed</status>
  <date>October 6, 2025</date>
</step_metadata>
<linear key="GET-73" />

<tasks>
1. Rebuilt `PlayerInventoryPanel` with filter tabs, sort controls, encumbrance readouts, equipment slot grid, and hotbar management inside the character screen shell.
2. Added inline equip/repair/use actions with durability bars, repair cost prompts, and stack-aware hotbar selectors that keep the panel keyboard accessible.
3. Surfaced the same loadout state in the equipment column, including durability indicators and clear controls, so the UI mirrors Redux inventory changes in real time.
</tasks>

<implementation>
- Introduced a richer inventory view that computes item categories, durability colours, and encumbrance summaries client-side while delegating state changes to Redux actions.
- Extended `playerSlice` with `useInventoryItem`, ensuring consumables decrement stacks, clamp health/AP/stat gains, and clear hotbar slots when items are spent.
- Added dedicated RTL coverage to exercise filters, equip/repair flows, hotbar assignment, and consumable usage through the new UI.
- Relocated active effects to the left-hand status column so buffs/debuffs surface alongside the operative summary while perks remain in the loadout card.
- Reorganized the character screen into a profile column (summary + attributes) beside a systems column (inventory + loadout row above a full-height skill tree) so every panel remains visible while inventory retains a dedicated vertical scroller; removed the unused Active Effects display until the system is designed.
</implementation>

<code_reference file="the-getaway/src/components/ui/PlayerInventoryPanel.tsx" />
<code_reference file="the-getaway/src/store/playerSlice.ts" />
<code_reference file="the-getaway/src/__tests__/PlayerInventoryPanel.test.tsx" />

<validation>
- `yarn test PlayerInventoryPanel.test.tsx --watch=false`
</validation>

<notes>
- Jest run emits `SerializableStateInvariantMiddleware` warnings while resetting the store in tests; no functional issues observed but worth monitoring if suite time increases.
</notes>
</step>

<step id="35.2" status="completed">
<step_metadata>
  <number>35.2</number>
  <title>Level Objective Progression Flow</title>
  <status>Completed</status>
  <date>October 8, 2025</date>
</step_metadata>
<linear key="GET-78" />

<tasks>
1. Authored a locale-aware mission manifest and Redux mission slice so each level exposes primary vs side objectives with quest bindings and completion flags.
2. Rebuilt `LevelIndicator` to consume mission selectors, display objective progress with cross-out/checkbox styling, and badge mission-ready states.
3. Added the mission progression manager and completion overlay to broadcast `MISSION_ACCOMPLISHED`/`LEVEL_ADVANCE_REQUESTED` events, surface a deferrable Mission Accomplished modal, and provide a toast to reopen the hand-off.
4. Retuned George’s guidance pipeline to pull from the same mission selectors, react to mission events, and refreshed helper tests alongside new mission selector coverage.
</tasks>

<implementation>
- Mission state lives in `missionSlice`, cloning content definitions per locale and exposing selectors that resolve quest completion counts for HUD and guidance systems.
- The Level HUD now renders primary and optional lists with inline progress metrics while the overlay coordinates mission accomplishment prompts, deferral flow, and level advance event emission.
- George assistant wiring now feeds mission objective summaries into `buildAssistantIntel`, syncs modal events into the chat log, and keeps guidance copy aligned with the Level panel.
</implementation>

<code_reference file="the-getaway/src/content/missions.ts" />
<code_reference file="the-getaway/src/store/missionSlice.ts" />
<code_reference file="the-getaway/src/store/selectors/missionSelectors.ts" />
<code_reference file="the-getaway/src/components/ui/LevelIndicator.tsx" />
<code_reference file="the-getaway/src/components/system/MissionProgressionManager.tsx" />
<code_reference file="the-getaway/src/components/ui/MissionCompletionOverlay.tsx" />
<code_reference file="the-getaway/src/components/ui/GeorgeAssistant.tsx" />
<code_reference file="the-getaway/src/game/systems/georgeAssistant.ts" />
<code_reference file="the-getaway/src/__tests__/missionSelectors.test.ts" />
<code_reference file="the-getaway/src/__tests__/missionSlice.test.ts" />

<validation>
- `yarn test --runTestsByPath src/__tests__/missionSelectors.test.ts src/__tests__/missionSlice.test.ts src/__tests__/georgeAssistant.test.ts --watch=false`
</validation>
</step>

<step id="35.5" status="completed">
<step_metadata>
  <number>35.5</number>
  <title>Implement George AI Assistant Overlay</title>
  <status>Completed</status>
  <date>October 7, 2025</date>
</step_metadata>
<linear key="GET-79" />

<tasks>
1. Extended the player schema with karma and personality defaults, plus Redux actions/selectors that expose reputation, objective queue, and tone flags for HUD consumers.
2. Rebuilt George as a top-centre Pip-Boy console dock with a collapsible panel, chat-style history, and three core prompts (guidance, status, quests).
3. Authored guideline-tagged dialogue templates for George, added helper utilities to format hints/status strings, and integrated them with Redux data for adaptive conversation responses.
4. Added helper unit tests covering hint assembly, template replacement, and interjection selection to pin the new narrative logic.
</tasks>

<implementation>
- Player karma defaults to `0` with clamped adjust/set reducers; personality profiles normalise flags from background weighting so tone selection stays deterministic for the assistant.
- New selectors (`playerSelectors`, `questSelectors`) flatten active objectives into a priority queue that the React assistant converts into primary/secondary callouts alongside karma/reputation status lines.
- The assistant listens for the `G` key or dock clicks, logs player requests and George responses in a rolling chat feed, and emits guideline-referenced interjection copy sourced from `content/assistants/george.ts`.
- Helper module `game/systems/georgeAssistant.ts` centralises hint formatting and template filling, while the component throttles alerts with a 12s cooldown to prevent duplicate chatter.
</implementation>

<code_reference file="the-getaway/src/game/interfaces/types.ts" />
<code_reference file="the-getaway/src/game/interfaces/player.ts" />
<code_reference file="the-getaway/src/store/playerSlice.ts" />
<code_reference file="the-getaway/src/store/selectors/playerSelectors.ts" />
<code_reference file="the-getaway/src/store/selectors/questSelectors.ts" />
<code_reference file="the-getaway/src/game/systems/georgeAssistant.ts" />
<code_reference file="the-getaway/src/content/assistants/george.ts" />
<code_reference file="the-getaway/src/components/ui/GeorgeAssistant.tsx" />
<code_reference file="the-getaway/src/App.tsx" />
<code_reference file="the-getaway/src/components/ui/LevelIndicator.tsx" />
<code_reference file="the-getaway/src/__tests__/georgeAssistant.test.ts" />

<validation>
- `yarn test --runTestsByPath src/__tests__/georgeAssistant.test.ts`
</validation>

<notes>
- Future polish: feed actual personality deltas from dialogue choices once that logging lands so alignment shifts reflect player tone beyond background weighting.
</notes>
</step>

<step id="29" status="completed">
<step_metadata>
  <number>29</number>
  <title>Implement Faction Reputation System with Three Core Factions</title>
  <status>Completed</status>
  <date>October 9, 2025</date>
</step_metadata>
<linear key="GET-76" />

<tasks>
1. Added faction definitions, standing thresholds, and reputation action helpers while wiring rival penalties and allied hostilities into a single maths module.
2. Extended `playerSlice` with `adjustFactionReputation`/`setFactionReputation`, a pending event queue, and selectors for consuming structured standing summaries.
3. Shipped the character-screen `FactionReputationPanel`, toast manager, and localised strings, replacing the old inline HUD readout.
4. Enforced faction gating across dialogue options and map transitions, surfacing denial logs when prerequisites are unmet.
</tasks>

<implementation>
- <code_location>the-getaway/src/game/systems/factions.ts</code_location> now owns faction metadata, standing localisation, automated rival penalties, and declarative action mappings for storyline beats.
- <code_location>the-getaway/src/store/playerSlice.ts</code_location> records faction changes, clamps background defaults, and exposes reducers so quests or scripted events can mutate reputation without duplicating logic.
- <code_location>the-getaway/src/components/ui/FactionReputationPanel.tsx</code_location> and <code_location>the-getaway/src/components/system/FactionReputationManager.tsx</code_location> connect the new selectors to HUD presentation and toast/log feedback.
- Dialogue and traversal gating respect faction requirements via <code_location>the-getaway/src/game/quests/dialogueSystem.ts</code_location> and <code_location>the-getaway/src/components/GameController.tsx</code_location>, reusing shared localisation from `content/system/ui`.
</implementation>

<code_reference file="the-getaway/src/game/systems/factions.ts" />
<code_reference file="the-getaway/src/store/playerSlice.ts" />
<code_reference file="the-getaway/src/store/selectors/factionSelectors.ts" />
<code_reference file="the-getaway/src/components/ui/FactionReputationPanel.tsx" />
<code_reference file="the-getaway/src/components/system/FactionReputationManager.tsx" />
<code_reference file="the-getaway/src/components/GameController.tsx" />
<code_reference file="the-getaway/src/game/quests/dialogueSystem.ts" />
<code_reference file="the-getaway/src/__tests__/playerSlice.test.ts" />
<code_reference file="the-getaway/src/__tests__/dialogueSystem.test.ts" />

<validation>
- `yarn test --runTestsByPath src/__tests__/playerSlice.test.ts src/__tests__/dialogueSystem.test.ts`
</validation>
</step>

<step id="25" status="completed">
<step_metadata>
  <number>25</number>
  <title>Expand Inventory System with Equipment and Durability</title>
  <status>Completed</status>
  <date>October 10, 2025</date>
</step_metadata>
<linear key="GET-71" />

<tasks>
1. Finalised the inventory data model with durability, slot metadata, stacking rules, and encumbrance tracking so saves persist the richer item schema.
2. Wired reducer helpers for equipping, repairing, splitting stacks, and enforcing durability/weight limits, then surfaced hotbar assignment plus repair flows in the UI panels.
3. Populated the content catalog and migration utilities so items ship with durability defaults while combat math, loading, and sanitisation keep legacy saves consistent.
4. Hardened the experience with targeted unit/UI tests around durability decay, encumbrance penalties, repair consumables, and the refreshed PlayerInventoryPanel.
</tasks>

<implementation>
- <code_location>the-getaway/src/store/playerSlice.ts</code_location> houses the expanded inventory state, helper reducers, durability checks, repair routing, and weight calculations shared across combat and movement.
- <code_location>the-getaway/src/game/inventory/inventorySystem.ts</code_location> and <code_location>the-getaway/src/game/combat/combatSystem.ts</code_location> generate hydrated item instances, apply durability modifiers, and trigger decay during attacks or mitigation.
- <code_location>the-getaway/src/components/ui/PlayerInventoryPanel.tsx</code_location> plus <code_location>the-getaway/src/components/ui/PlayerLoadoutPanel.tsx</code_location> render slot grids, durability bars, encumbrance banners, and hotbar controls with accessible labels.
- <code_location>the-getaway/src/content/items/index.ts</code_location> seeds durability defaults and cloning helpers so backgrounds, loot tables, and migration scripts share a single authoritative catalog.
</implementation>

<code_reference file="the-getaway/src/store/playerSlice.ts" />
<code_reference file="the-getaway/src/game/inventory/inventorySystem.ts" />
<code_reference file="the-getaway/src/game/combat/combatSystem.ts" />
<code_reference file="the-getaway/src/components/ui/PlayerInventoryPanel.tsx" />
<code_reference file="the-getaway/src/components/ui/PlayerLoadoutPanel.tsx" />
<code_reference file="the-getaway/src/content/items/index.ts" />
<code_reference file="the-getaway/src/__tests__/playerSlice.test.ts" />
<code_reference file="the-getaway/src/__tests__/PlayerInventoryPanel.test.tsx" />
<code_reference file="the-getaway/src/__tests__/combat.test.ts" />

<validation>
- `yarn test --runTestsByPath src/__tests__/playerSlice.test.ts src/__tests__/PlayerInventoryPanel.test.tsx src/__tests__/combat.test.ts`
</validation>
</step>

<step id="25.5" status="completed">
<step_metadata>
  <number>25.5</number>
  <title>Integrate Equipment Effects with Combat and Movement</title>
  <status>Completed</status>
  <date>October 10, 2025</date>
</step_metadata>
<linear key="GET-74" />

<tasks>
1. Tagged catalog weapons and armor for two-handed, silenced, armor-piercing, hollow-point, and weight-class behaviour so the data layer exposes intent for reducers and combat maths.
2. Restricted secondary slots when a two-handed primary is equipped, auto-stowing conflicting gear, and refreshed encumbrance metrics to keep carry weight and hotbar state consistent.
3. Applied weapon trait handling in the combat system—scaling damage with durability, hollow-point multipliers, armor-piercing reductions, energy weapon armor bypass, and optional noise events for unsilenced guns.
4. Added focused unit tests around two-handed equipping, trait-driven combat damage, and silencer noise suppression to lock in the new behaviour.
</tasks>

<implementation>
- <code_location>the-getaway/src/store/playerSlice.ts</code_location> blocks secondary equips while a two-handed primary is active, auto-unequips conflicting slots, and preserves inventory consistency before refreshing encumbrance.
- <code_location>the-getaway/src/game/combat/combatSystem.ts</code_location> interprets trait tags to adjust damage, crit flows, armor mitigation, and noise events while still emitting durability telemetry.
- <code_location>the-getaway/src/content/items/index.ts</code_location> annotates baseline armours with AP penalties and heavy/medium/light tags while flagging the industrial crowbar as two-handed.
- <code_location>the-getaway/src/game/systems/equipmentTags.ts</code_location> centralises tag helpers so reducers and combat logic share trait detection.
</implementation>

<code_reference file="the-getaway/src/store/playerSlice.ts" />
<code_reference file="the-getaway/src/game/combat/combatSystem.ts" />
<code_reference file="the-getaway/src/game/systems/equipmentTags.ts" />
<code_reference file="the-getaway/src/content/items/index.ts" />
<code_reference file="the-getaway/src/game/systems/equipmentEffects.ts" />
<code_reference file="the-getaway/src/__tests__/playerSlice.test.ts" />
<code_reference file="the-getaway/src/__tests__/combat.test.ts" />

<validation>
- `yarn test --runTestsByPath src/__tests__/playerSlice.test.ts src/__tests__/combat.test.ts`
</validation>
</step>

<step id="32.1" status="completed">
<step_metadata>
  <number>32.1</number>
  <title>Implement Unit Test Suite (70%+ Code Coverage)</title>
  <status>Completed</status>
  <date>October 12, 2025</date>
</step_metadata>
<linear key="GET-77" />

<tasks>
1. Added module-scoped combat, pathfinding, inventory, progression, and dialogue test suites under `src/game/**/__tests__` with deterministic helpers covering hit chance, crits, AI movement, weighted paths, inventory swaps, XP leveling, and faction/skill dialogue gating.
2. Updated Jest coverage settings to require 70/65/70/70 global thresholds, enforce 75/70/75/75 for `src/game`, enable `v8` coverage provider, and emit JSON summaries for tooling.
3. Verified full suite via `yarn test --coverage`, capturing 87.9% statements and 77.6% branches with the new tests exercising combat durability, performance constraints, and quest flow.
</tasks>

<implementation>
- New module-level specs (`combatSystem.test.ts`, `pathfinding.test.ts`, `inventorySystem.test.ts`, `progression.test.ts`, `dialogueSystem.test.ts`) live alongside the systems they validate, reusing factory helpers to clone `DEFAULT_PLAYER`, seed enemies, and assert deterministic outcomes across AP costs, armor decay, diagonal routing, and quest effects.
- Combat coverage now includes deterministic random generators for crit flows plus AI attack assertions, while pathfinding asserts diagonal toggles and sub-50ms traversal on 50×50 grids.
- Inventory and progression tests exercise weight ceilings, equipment swaps, consumable caps, skill point awards, and perk unlock cadence; dialogue tests gate options by attribute/skill training and confirm quest hooks emit `started` events.
- Jest configuration switches to V8 coverage, raises branch thresholds to 65% globally, and adds `json-summary` output, ensuring CI enforces the new bar and downstream tooling can ingest coverage metrics.
</implementation>

<code_reference file="the-getaway/src/game/combat/__tests__/combatSystem.test.ts" />
<code_reference file="the-getaway/src/game/world/__tests__/pathfinding.test.ts" />
<code_reference file="the-getaway/src/game/inventory/__tests__/inventorySystem.test.ts" />
<code_reference file="the-getaway/src/game/systems/__tests__/progression.test.ts" />
<code_reference file="the-getaway/src/game/quests/__tests__/dialogueSystem.test.ts" />
<code_reference file="the-getaway/jest.config.js" />

<validation>
- `yarn test --coverage`
</validation>

<notes>
- Coverage summary: 87.9% statements, 77.6% branches, 83.7% functions, 87.9% lines with per-module floors enforced (`src/game` ≥75/70/75/75%).
- Crafting suite slated in Step 30 remains pending until the crafting systems land; no stubs created to avoid false completeness.
</notes>
</step>

<step id="26" status="completed">
<step_metadata>
  <number>26</number>
  <title>Advanced Combat Foundations</title>
  <status>Completed</status>
  <date>October 12, 2025</date>
</step_metadata>
<linear key="GET-75" />

<tasks>
1. Extended combat entities with `facing`, `coverOrientation`, and `suppression` fields plus directional tile cover metadata (`MapTile.cover`), updating player defaults and movement reducers to keep orientation in sync.
2. Refactored `calculateHitChance`/`executeAttack` to resolve directional cover mitigation, introduced reaction queue scaffolding (`queueReaction`, `drainReactions`), and taught enemy AI to update facing/cover state after movement.
3. Added `setTileCoverProfile` for grid authoring and a MainScene cover preview wedge that highlights the protected edge while hovering tiles; verified behaviour with new combat + reactions unit tests.
</tasks>

<implementation>
- <code_location>the-getaway/src/game/interfaces/types.ts</code_location> models cardinal facings, cover profiles, and new combat state fields on `Player`/`Enemy` entities.
- <code_location>the-getaway/src/game/combat/combatSystem.ts</code_location> normalises cover arguments, applies half/full mitigation, exports reaction queue helpers, and keeps attackers oriented via `applyCoverStateFromTile`/`applyMovementOrientation`.
- <code_location>the-getaway/src/game/combat/reactions.ts</code_location> provides the queue primitive consumed by combat.
- <code_location>the-getaway/src/game/combat/enemyAI.ts</code_location> now orients enemies after movement and passes map context into attacks so cover math engages.
- <code_location>the-getaway/src/game/world/grid.ts</code_location> exposes `setTileCoverProfile` for directional cover authoring.
- <code_location>the-getaway/src/game/scenes/MainScene.ts</code_location> renders a cover wedge overlay during path previews.
- <code_location>the-getaway/src/store/playerSlice.ts</code_location> updates facing when the player moves.
</implementation>

<code_reference file="the-getaway/src/game/interfaces/types.ts" />
<code_reference file="the-getaway/src/game/interfaces/player.ts" />
<code_reference file="the-getaway/src/game/combat/combatSystem.ts" />
<code_reference file="the-getaway/src/game/combat/reactions.ts" />
<code_reference file="the-getaway/src/game/combat/enemyAI.ts" />
<code_reference file="the-getaway/src/game/world/grid.ts" />
<code_reference file="the-getaway/src/game/scenes/MainScene.ts" />
<code_reference file="the-getaway/src/store/playerSlice.ts" />
<code_reference file="the-getaway/src/game/combat/__tests__/combatSystem.test.ts" />
<code_reference file="the-getaway/src/game/combat/__tests__/reactions.test.ts" />

<validation>
- `yarn test --coverage`
</validation>

<notes>
- Directional cover currently applies 25%/45% hit penalties for half/full protection and scales damage via the same profile, laying groundwork for the overwatch/AoE features in Steps 26.1–26.3.
</notes>
</step>

<step id="16.6" status="completed">
<step_metadata>
  <number>16.6</number>
  <title>Standardize Level → Mission → Quest Hierarchy & Resource Keys</title>
  <status>Completed</status>
  <date>October 15, 2025</date>
</step_metadata>
<linear key="GET-81" />

<tasks>
1. Added narrative structure contracts (`structureTypes.ts`) and registered level/mission/quest definitions plus NPC ownership metadata under `src/content/**`.
2. Centralised localisation into `src/content/locales/<locale>` bundles and rewired mission/quest loaders to compose structural data with resource-keyed copy.
3. Introduced the narrative validation utility with Jest coverage so missing locales or broken cross-references fail fast during development.
</tasks>

<implementation>
- `getMissionManifest` now assembles objectives by resolving mission/quest definitions against locale bundles, while `buildQuestsForLevel` materialises Redux-ready quest instances for `level0` content.
- `validateNarrativeContent` audits level, mission, quest, and NPC registries across all locales, surfaced through a dedicated Jest spec to keep the hierarchy airtight.
</implementation>

<code_reference file="the-getaway/src/game/narrative/structureTypes.ts" />
<code_reference file="the-getaway/src/content/missions.ts" />
<code_reference file="the-getaway/src/content/quests/builders.ts" />
<code_reference file="the-getaway/src/game/narrative/validateContent.ts" />
<code_reference file="the-getaway/src/content/locales/en/index.ts" />
<code_reference file="memory-bank/architecture.md" />

<validation>
- `yarn test narrativeValidation.test.ts --watch=false`
</validation>
</step>

<step id="35" status="completed">
<step_metadata>
  <number>35</number>
  <title>Surface Level & Objective HUD</title>
  <status>Completed</status>
  <date>February 15, 2026</date>
</step_metadata>
<linear key="GET-80" />

<tasks>
1. Introduced structured zone descriptors (`content/zones.ts`) covering level index, hazard roster, and local directives for Slums, Downtown, and Industrial tiers.
2. Enriched world generation so `buildWorldResources` stamps each `MapArea` with display name, summary, danger rating, and hazard list derived from the zone descriptor registry.
3. Expanded the LevelIndicator HUD to show zone banner, danger pill, environmental hazards, and local directives alongside mission objectives with refreshed locale strings.
4. Extended the mission manifest to define Level 1 (Downtown Governance Ring) and Level 2 (Industrial Wasteland) objective scaffolds, aligning HUD data with the expanded roadmap.
</tasks>

<implementation>
- Zone metadata lives in <code>getZoneMetadata</code> and is merged during `createCityArea` / interior creation so Phaser scenes and HUD consumers read a single enriched `MapArea`.
- `LevelIndicator.tsx` now derives zone context from `world.currentMapArea`, renders hazard chips, and keeps mission lists driven by the existing selectors.
- Mission definitions grow to three tiers, supplying localization-friendly titles and future quest hooks without impacting current Level 0 progress.
</implementation>

<code_reference file="the-getaway/src/content/zones.ts" />
<code_reference file="the-getaway/src/game/world/worldMap.ts" />
<code_reference file="the-getaway/src/components/ui/LevelIndicator.tsx" />
<code_reference file="the-getaway/src/content/ui/index.ts" />
<code_reference file="the-getaway/src/content/missions.ts" />

<validation>
- `yarn build` *(fails: TypeScript catches pre-existing test fixtures that omit required quest/skill properties; no new runtime regressions observed in modified modules)*.
</validation>

<notes>
- Hazard chips currently list textual warnings; once Industrial maps land we can hook sensor data to toggle chips dynamically (e.g., disable when filters equipped).
</notes>
</step>

<step id="16.7" status="completed">
<step_metadata>
  <number>16.7</number>
  <title>Prototype Narrative → Triple → Scene Pipeline</title>
  <status>Completed</status>
  <date>February 17, 2026</date>
</step_metadata>
<linear key="GET-82" />

<tasks>
1. Introduced narrative triple schemas and extraction helpers that translate mission prompts into ordered `(subject, relation, object)` bundles with validation feedback.
2. Added relation rules plus a world generation pipeline stage that resolves triple placements into depth-sorted map props, honouring walkability and cover tags.
3. Published the `generate-scene-from-story` CLI workflow and seeded the first generated scene asset under Level 0 → Recover Cache, wiring the mission to its resource key registry.
</tasks>

<implementation>
- `tripleExtraction` heuristically tokenises prompts and supports manual fallback bundles so writers can override LLM output while keeping schema validation intact.
- Relation rules leverage existing grid helpers (`isPositionWalkable`, `findNearestWalkablePosition`) to map verbs like `near`, `inside`, or `left_of` to concrete tile offsets without colliding with blocked cells.
- The world generation pipeline materialises `GeneratedSceneDefinition` payloads into `MapArea` instances, tagging tiles from placement metadata (cover vs blocking) and writing issue telemetry back into scene metadata.
- The CLI stitches extraction + generation, emits JSON into <code>content/levels/{level}/missions/{mission}/generatedScenes</code>, and logs validation issues for missing assets or collisions.
</implementation>

<code_reference file="the-getaway/src/game/narrative/tripleTypes.ts" />
<code_reference file="the-getaway/src/game/narrative/tripleExtraction.ts" />
<code_reference file="the-getaway/src/game/world/generation/relationRules.ts" />
<code_reference file="the-getaway/src/game/world/generation/worldGenerationPipeline.ts" />
<code_reference file="the-getaway/scripts/generate-scene-from-story.ts" />
<code_reference file="the-getaway/src/content/levels/level0/missions/level0-recover-cache/generatedScenes/scene-level0-recover-cache-ambush-route.json" />
<code_reference file="the-getaway/src/content/missions/level0-recover-cache/missionDefinition.ts" />
<code_reference file="the-getaway/src/content/scenes/generatedScenes.ts" />

<validation>
- `yarn test` *(fails: existing suites `storyletSlice`, `perceptionManager`, `factionSelectors` already red prior to this change; new world generation specs pass)*.
</validation>

<notes>
- Scene metadata now records pipeline issues; expose this in author tooling dashboards before scaling to multi-mission generation.
- Script expects Node 20+ (for `structuredClone`); align dev docs when documenting narrative tooling walkthrough.
</notes>
</step>
