# The Getaway - Architecture Documentation

## Project Structure

The Getaway is structured as a modern React application with TypeScript, using Vite as the build tool and development server. The architecture follows a modular design approach, separating game logic from UI components and state management.

### Project Layout

The project is organized as follows:

- `/memory-bank` - Documentation and design files (outside the actual game code)
- `/the-getaway` - The main game project folder
  - `/src` - Source code for the game
  - Configuration files (package.json, tsconfig.json, etc.)

### Core Technologies

- **TypeScript**: Used throughout the project for type safety and better development experience.
- **React**: Provides the UI layer and component architecture.
- **Vite**: Fast build tool and development server.
- **Phaser**: Game engine for rendering and game mechanics.
- **Redux Toolkit**: State management library for predictable state and separation of concerns.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Jest**: Testing framework for unit tests.

## Directory Structure

### `/the-getaway/src`

The main source directory containing all application code.

### `/the-getaway/src/assets`

Contains all static assets for the game including:
- Graphics (character sprites, environment tiles, UI elements)
- Audio (sound effects, music)
- Other media files

### `/the-getaway/src/components`

React components that make up the game's user interface:
- **`GameCanvas.tsx`**: The main component that integrates Phaser with React. It initializes the Phaser game instance and provides the canvas where the game is rendered.
- **`GameController.tsx`**: Bridges Redux state with Phaser events, handling player input, combat flow, click-to-move execution, curfew enforcement, NPC routine scheduling, and now prevents stepping onto NPC tiles while auto-pathing to conversation range when you click an NPC.

### `/the-getaway/src/components/ui`

Dedicated folder for reusable React UI components, separate from core game logic/controllers.

- **`PlayerStatusPanel.tsx`**: Displays player vitals, action points, hostile counts, and curfew state using Redux data.
- **`LogPanel.tsx`**: Displays a scrolling list of game events and messages, reading data from the Redux `logSlice`.
- **`PlayerSummaryPanel.tsx`**: Compact HUD card showing the operative's vitals, currency, and point pools with a CTA that opens the full character screen.
- **`CharacterScreen.tsx`**: Pip-boy style modal that presents the detailed profile (status panel, detailed stats, skill tree). Toggled via the HUD button or the `C` key and reuses existing components inside a scrollable shell; the layout now stacks the profile column (summary + core stats) alongside a systems column where inventory and loadout share the top row and the skill tree stretches beneath them.
- **`PlayerLoadoutPanel.tsx`**: Summarises equipped weapon/armor alongside perk badges inside the character screen.
- **`PlayerInventoryPanel.tsx`**: Full inventory console with filter tabs, encumbrance telemetry, equipment slot grid, hotbar management, and inline equip/repair/use actions that dispatch Redux inventory reducers.
- **Inventory data model**: `Player.inventory` now tracks `hotbar` slots alongside `items`, and `Player.equippedSlots`/`activeWeaponSlot` mirror the expanded slot framework (primary/secondary/melee weapons, body armor, helmet, accessories). `Player.encumbrance` persists the derived weight ratio so reducers and UI can apply penalties without recomputing totals each frame.
- **`MiniMap.tsx`**: Consumes the layered controller state to render cached tiles, animated waypoint paths, entity/objective markers, viewport reticle, and supports drag/zoom, Shift-waypoint previews, keyboard nudging, and high-contrast/auto-rotate toggles.
- **`DayNightIndicator.tsx`**: Surfaces the current time of day, phase transitions, and curfew countdown in the HUD.
- **`LevelIndicator.tsx`**: Floats level metadata and active objectives in the upper-left overlay, pulling data from the current `MapArea`.
- **`GeorgeAssistant.tsx`**: React HUD console that anchors top-center, presenting a compact status dock and an expandable chat feed while pulling quest, karma, reputation, and personality data straight from Redux.
- **`DialogueOverlay.tsx`**: Displays branching dialogue with NPCs, presenting options and triggering quest hooks while pausing player input.
- **`OpsBriefingsPanel.tsx`**: Serves as the quest log, surfacing active objectives with progress counters and listing recently closed missions with their payout summaries.

<architecture_section id="high_level_overview" category="summary">
<design_principles>
- Phaser scenes own simulation and rendering while React manages HUD overlays that subscribe to Redux selectors.
- Redux Toolkit slices centralise world, player, and quest data so both runtimes consume a single state graph.
- Persistence hydrates from `localStorage` with schema guards and version tags to keep older saves compatible.
- Content remains immutable under `src/content/levels/<level-id>/locales/{en,uk}.ts`, cloned into runtime stores before mutation.
</design_principles>

<technical_flow>
1. `GameCanvas` boots Phaser scenes, wiring scene lifecycle hooks into Redux dispatchers and DOM CustomEvents.
2. Bridge services in `src/game/services/*` proxy Phaser events to React HUD listeners while React components dispatch Redux actions that Phaser systems observe.
3. Persistence helpers serialise whitelisted slices with version metadata and rehydrate on boot, invoking migrators when the stored version lags.
4. Localisation helpers resolve bilingual content for both HUD strings and scene metadata, ensuring English remains the source of truth with Ukrainian kept in lockstep.

```mermaid
flowchart LR
  Input[Mouse/KB] --> Phaser[Phaser Scenes]
  Phaser <-->|events| Bridge[Custom Event Bridge]
  Bridge <--> Redux[Redux Toolkit Store]
  Redux <--> React[React HUD]
  Content[(Locales + Level Data)] --> Phaser
  LocalStorage[(localStorage)] <--> Redux
```
</technical_flow>
</architecture_section>

<architecture_section id="narrative_resource_hierarchy" category="content_pipeline">
<design_principles>
- Standardise narrative data around stable resource keys (`levels.*`, `missions.*`, `quests.*`, `npcs.*`) so structural definitions stay immutable and language-agnostic.
- Keep localisation bundles separate from structural content, letting writers update copy without touching TypeScript modules.
- Validate cross-references (level ↔ mission ↔ quest ↔ NPC) automatically so regressions surface during CI/testing instead of in gameplay.
</design_principles>

<technical_flow>
1. <code_location>the-getaway/src/game/narrative/structureTypes.ts</code_location> introduces canonical interfaces plus locale bundle contracts for levels, missions, quests, and NPC registrations.
2. Structural definitions live under `src/content/levels/*/levelDefinition.ts`, `src/content/missions/**/missionDefinition.ts`, and `src/content/quests/**/questDefinition.ts`, with registries in `src/content/levels/index.ts`, `src/content/missions/index.ts`, and `src/content/quests/index.ts`.
3. Localised strings consolidate into `src/content/locales/<locale>/{levels,missions,quests,npcs}.ts`, aggregated via <code_location>the-getaway/src/content/locales/index.ts</code_location>.
4. Runtime loaders (`src/content/missions.ts`, `src/content/levels/level0/index.ts`, and `src/content/quests/builders.ts`) merge structural data with locale bundles to emit `MissionLevelDefinition` and `Quest` instances for Redux slices.
5. <code_location>the-getaway/src/game/narrative/validateContent.ts</code_location> walks the hierarchy, confirming every reference resolves and every resource key has locale coverage; a Jest spec (`src/__tests__/narrativeValidation.test.ts`) keeps the check wired into the suite.
</technical_flow>

<pattern name="ResourceKeyLifecycle">
- Authors add or modify structural content via the definition modules, wire resource keys into locale bundles, and register associated NPCs in `src/content/npcs/index.ts`.
- Validation runs as part of the test suite, blocking commits that forget locale copy or miswire cross-resource keys.
- UI and Redux consumers never read raw locale files; instead they call the derived builders so future content (additional locales or metadata) continues to flow through the same pipeline.
</pattern>
</architecture_section>

<architecture_section id="narrative_scene_generation" category="world_generation">
<design_principles>
- Keep `(subject, relation, object)` triples as the single interface between narrative prompts and spatial generation, allowing either heuristic extraction or manual authoring to feed the same tooling.
- Resolve placement requests through existing grid utilities (`isPositionWalkable`, `findNearestWalkablePosition`) so generated props honour collision layers and cover metadata.
- Feed telemetry (collisions, missing assets) back into scene metadata so the CLI and future dashboards can surface author-facing diagnostics.
</design_principles>

<technical_flow>
1. <code_location>the-getaway/src/game/narrative/tripleExtraction.ts</code_location> tokenises mission copy, matches supported relations (`near`, `inside`, `left_of`, etc.), and emits ordered `SceneMoment` bundles; manual fallback bundles run through the same validators.
2. <code_location>the-getaway/src/game/world/generation/relationRules.ts</code_location> translates relations into placement strategies (directional offsets, adjacency searches, interior resolution) while guarding against occupied or non-walkable tiles.
3. <code_location>the-getaway/src/game/world/generation/worldGenerationPipeline.ts</code_location> instantiates a `MapArea`, seeds manual placements, resolves anchors, applies computed props, and annotates tiles (cover vs blocking) before recording any pipeline issues.
4. <code_location>the-getaway/scripts/generate-scene-from-story.ts</code_location> orchestrates extraction + generation, writing validated JSON under <code>src/content/levels/{level}/missions/{mission}/generatedScenes</code> and reporting validation errors in the CLI output.
5. <code_location>the-getaway/src/content/scenes/generatedScenes.ts</code_location> indexes emitted scene definitions so mission records (e.g., `level0RecoverCacheMission`) can reference `generatedSceneKeys` without manual filesystem lookups.
</technical_flow>
</architecture_section>

<architecture_section id="environment_story_triggers" category="narrative_systems">
<design_principles>
- Keep environment reactivity declarative: world-facing flags live under `world.environment.flags` and drive all swaps through a trigger registry rather than ad-hoc conditionals.
- Favour data tables over inline copy so rumors, signage, and notes remain tone-consistent with `memory-bank/plot.md` and can scale through content-only additions.
- Ensure triggers are idempotent and observable—every swap records the source ID and timestamp so reducers, HUD, and QA tooling can diff the current ambient state.
- Throttle weather shifts to once per recorded time-of-day so ambient logs surface meaningful beats instead of oscillating between severity presets.
</design_principles>

<technical_flow>
1. <code_location>the-getaway/src/game/interfaces/environment.ts</code_location> defines flag enums (`gangHeat`, `curfewLevel`, `supplyScarcity`, `blackoutTier`) plus serialized snapshots for rumors, signage, weather, and spawned notes.
2. <code_location>the-getaway/src/store/worldSlice.ts</code_location> seeds the environment state, exposes reducers (`setEnvironmentFlags`, `applyEnvironmentSignage`, `applyEnvironmentRumorSet`, `registerEnvironmentalNote`, `setNpcAmbientProfile`), and maps existing systems to the new flags (curfew to `curfewLevel`, alert level to `gangHeat`/`supplyScarcity`, reinforcements to blackout tiers).
3. <code_location>the-getaway/src/content/environment/</code_location> holds trigger tables (`rumors.ts`, `notes.ts`, `signage.ts`, `weather.ts`) with one-liner metadata so writers can add swaps without touching logic.
4. <code_location>the-getaway/src/game/world/triggers/triggerRegistry.ts</code_location> maintains registered triggers with cooldown/once semantics; <code_location>the-getaway/src/game/world/triggers/defaultTriggers.ts</code_location> now derives weather via a single daily updater that records the active `TimeOfDay`, preferring gang-heat overrides until curfew level 3 and logging at most one shift per phase, while keeping the remaining rumor, signage, and note triggers unchanged. A test-only reset helper exposes clean registration for specs.
5. <code_location>the-getaway/src/components/GameController.tsx</code_location> initialises the registry and ticks triggers each animation frame, feeding the Redux dispatch/getState pair so triggers stay in sync with the active scene.
6. <code_location>the-getaway/src/store/selectors/worldSelectors.ts</code_location> surfaces memoised selectors for flags, signage variants, rumor sets, weather snapshots (including last `TimeOfDay`), and spawned notes for HUD consumers.
7. <code_location>the-getaway/src/game/world/environment/environmentMatrix.ts</code_location> codifies the hazard-to-system matrix: `resolveEnvironmentalFactors` folds zone hazards and environment flags into canonical factors, while `combineSystemImpacts` emits aggregated behaviour/faction/travel weights. <code_location>the-getaway/src/store/selectors/worldSelectors.ts</code_location> exposes `selectEnvironmentSystemImpacts`, driving <code_location>the-getaway/src/components/GameController.tsx</code_location> (NPC routine pacing + reinforcement delays) and <code_location>the-getaway/src/components/ui/DayNightIndicator.tsx</code_location> (travel advisory overlay).
8. <code_location>the-getaway/src/game/world/triggers/__tests__/defaultTriggers.test.ts</code_location> drives the reducers through the registry, asserting rumor rotations, signage swaps, note spawns, and the daily weather gate when flags or time phases shift.
</technical_flow>
</architecture_section>

<architecture_section id="command_shell_layout" category="ui_shell">
<design_principles>
- Maintain the three-column command shell while letting each sidebar collapse without removing it from the flex context so the world view can immediately claim the freed space.
- Anchor interactive toggles to the sidebar rails instead of the overall stage to keep them flush with panel edges and out of the top-right HUD stack.
- Surface live sidebar measurements through CSS custom properties so auxiliary overlays can reference actual widths when positioning future elements.
</design_principles>

<technical_flow>
1. <code_location>the-getaway/src/App.tsx</code_location> wraps the left and right panels in rail containers that own the `flex-basis` sizing (`min(26rem, 24vw)`), easing between their expanded width and `0px` via a cubic-bezier transition, and expose `--sidebar-width` / `--sidebar-last-width` variables sourced from `ResizeObserver` readings.
2. Collapsing a panel drives the rail basis to `0px` while the panel stays mounted with `visibility: hidden`, `pointer-events: none`, and `max-width: 0px`, ensuring ResizeObserver retains the last visible width for smooth reopening.
3. Toggle buttons now live inside each rail, positioned with `calc(100% - 1.1rem)` (left) and `-1.1rem` (right) offsets plus a clamped vertical anchor (`clamp(6rem, 50%, calc(100% - 6rem))`) so they never overlap the menu, level, or day/night overlays; the stage exports `--left-sidebar-width` / `--right-sidebar-width` and their `--*-last-width` counterparts for downstream layout logic.
4. <code_location>the-getaway/src/components/GameCanvas.tsx</code_location> subscribes to the center column via `ResizeObserver`, debounces updates (~40 ms), caches the last applied canvas size, and only calls `game.scale.resize` when dimensions change so the Phaser world stretches instantly during rail transitions without black-frame flicker.
</technical_flow>
</architecture_section>

<architecture_section id="george_assistant_overlay" category="hud_ai">
<design_principles>
- Keep George docked to the left Pip-Boy rail so guidance lives alongside other command UI without occluding the playfield.
- Source hints and tone entirely from Redux selectors and content tables, ensuring HUD logic stays declarative and dialogue copy remains data-driven for localisation.
- Respect player agency with a collapsible conversation shell, keyboard shortcut, and cooldown-gated interjections so the assistant never spams the log or steals focus during combat.
</design_principles>

<technical_flow>
1. <code_location>the-getaway/src/components/ui/GeorgeAssistant.tsx</code_location> subscribes to `selectObjectiveQueue`, `selectMissionProgress`, `selectNextPrimaryObjective`, `selectPlayerKarma`, `selectPlayerFactionReputation`, and `selectPlayerPersonalityProfile`, renders the center-aligned console dock with CSS tokens, and binds the global `G` shortcut alongside pointer interaction.
2. <code_location>the-getaway/src/App.tsx</code_location> positions the level card and the George console within the same HUD layer while keeping the console centered along the top edge.
3. <code_location>the-getaway/src/game/systems/georgeAssistant.ts</code_location> consolidates intelligence by formatting primary/secondary hints, karma summaries, and conversation payloads, pulling tone-specific templates from <code_location>the-getaway/src/content/assistants/george.ts</code_location>.
4. Interjection hooks cache quest completion sets, faction deltas, mission-complete signals (`missionAccomplished`), and hostile-state transitions; when thresholds are crossed the assistant queues a guideline-tagged line, throttled by `INTERJECTION_COOLDOWN_MS` so alerts surface once and then cool off.
5. <code_location>the-getaway/src/store/selectors/worldSelectors.ts</code_location> delivers a memoised `selectAmbientWorldSnapshot` bundling environment flags, rumor/signage/weather snapshots, and zone hazard metadata; <code_location>the-getaway/src/game/systems/georgeAssistant.ts</code_location> diff-checks successive snapshots via `GeorgeAmbientTracker`, enforcing per-category cooldowns before returning structured ambient events.
6. <code_location>the-getaway/src/components/ui/GeorgeAssistant.tsx</code_location> merges mission guidance, ambient events, and interjections into a single notification stream, highlights the dock when unseen entries queue up, and promotes the freshest line into the collapsed ticker so world changes surface even with the console closed while the Level Indicator remains lightweight.
</technical_flow>

<pattern name="ObjectiveSync">
- George assistant treats the Level Objectives selector set as source of truth, mirroring cross-out state and surfacing the highest-priority incomplete objective as the default guidance line.
- Mission-complete dispatches route through the same event contract as the Level Objectives panel, allowing George to deliver celebration copy only after the HUD updates.
</pattern>
</architecture_section>

<architecture_section id="level_objectives_panel" category="hud_systems">
<design_principles>
- Keep the level card and objectives list anchored to the top-center HUD rail so mission metadata is always visible without crowding the playfield.
- Drive all content from structured selectors (`selectMissionProgress`, `selectPrimaryObjectives`, `selectSideObjectives`) so the React panel remains declarative and mirrors Redux truth without local bookkeeping.
- Treat mission completion as a formal state transition that can be observed by cinematics, reward flows, and save-game checkpoints rather than ad-hoc UI toggles.
</design_principles>

<technical_flow>
1. <code_location>the-getaway/src/components/ui/LevelIndicator.tsx</code_location> renders the level badge plus two ordered lists: primary objectives and optional side quests. Each entry receives `isComplete` from selector output and toggles a `objective-item--complete` class that applies the cross-out/checkbox styling.
2. <code_location>the-getaway/src/store/selectors/missionSelectors.ts</code_location> resolves mission progress by combining objective definitions with quest completion state, exposing memoised primary/side arrays, `allPrimaryComplete`, and helper selectors for HUD/assistant consumers.
3. <code_location>the-getaway/src/store/missionSlice.ts</code_location> stores the manifest, tracks `pendingAdvance`, and flips `missionAccomplished()` when selectors report that all primary objectives are complete.
4. <code_location>the-getaway/src/game/systems/missionProgression.ts</code_location> exports DOM event helpers used by HUD components to broadcast mission completion and level advance requests to Phaser scenes and the assistant.
5. Confirmation flows call `advanceToNextLevel()` which increments `currentLevel`, hydrates the next level's objective bundles, and resets the panel lists while leaving incomplete side quests in the log until dismissed.
6. <code_location>the-getaway/src/components/system/MissionProgressionManager.tsx</code_location> watches mission selectors, dispatches `missionAccomplished` once per completion, and emits `MISSION_ACCOMPLISHED` DOM events for HUD consumers.
7. <code_location>the-getaway/src/components/ui/MissionCompletionOverlay.tsx</code_location> shows the Mission Accomplished modal, allows deferral, presents a mission-ready toast, and fires `LEVEL_ADVANCE_REQUESTED` via `emitLevelAdvanceRequestedEvent` when the player opts to continue.
</technical_flow>

<pattern name="ObjectiveCrossOut">
- Cross-out effect leverages a `::after` pseudo-element with a 200 ms width transition so objectives animate cleanly when their quests resolve.
- Checkbox state is purely cosmetic; assistive text announces "Completed" via `aria-live` for screen-reader parity.
</pattern>

<pattern name="MissionAdvancementContract">
- Redux action contract: `missionAccomplished` → middleware `missionProgressionListener` → `LEVEL_ADVANCE_REQUESTED` custom event for Phaser scenes → `advanceToNextLevel` reducer.
- The contract ensures George assistant, minimap, and save systems can subscribe to a single signal instead of duplicating mission-complete checks.
- George listens for the same `LEVEL_ADVANCE_REQUESTED` emit to stage "Mission Accomplished" callouts only after the confirmation modal resolves, keeping guidance synchronized with HUD state.
- `MISSION_ACCOMPLISHED` DOM events fan out when primary objectives resolve, letting HUD systems celebrate immediately while the toast/overlay keeps player control.
</pattern>
</architecture_section>

<architecture_section id="storylet_framework" category="narrative_systems">
<design_principles>
- Keep story-driven vignettes fully data-driven so designers can add new plays by extending a registry and localization files without touching reducers.
- Evaluate eligibility with a pure engine that inspects state snapshots (actors, triggers, cooldowns) to keep Redux mutations isolated to a single slice.
- Surface resolved storylets through a queue abstractions so UI layers can render comic/dialogue panels asynchronously while side effects (logs, faction deltas, personality shifts) apply immediately.
</design_principles>

<technical_flow>
1. <code_location>the-getaway/src/game/quests/storylets/storyletTypes.ts</code_location> defines the canonical structures for plays, roles, triggers, branches, outcomes, and runtime bookkeeping used across the system.
2. <code_location>the-getaway/src/game/quests/storylets/storyletRegistry.ts</code_location> enumerates act-aligned plays (ambush, rest, omen) with cooldown windows, role definitions, and branch metadata that reference localized keys.
3. <code_location>the-getaway/src/game/quests/storylets/storyletEngine.ts</code_location> assembles an actor pool (player, contacts, nearby NPCs), scores eligible plays against the incoming trigger, casts roles, resolves branch conditions, and returns a `StoryletResolution`.
4. <code_location>the-getaway/src/content/storylets/index.ts</code_location> plus locale files (`en.ts`, `uk.ts`) supply titles, synopses, narrative text, and log copy keyed to each outcome/variant.
5. <code_location>the-getaway/src/store/storyletSlice.ts</code_location> hosts the runtime slice/thunk: it snapshots state, calls the engine, applies outcome effects (log messages, faction deltas, personality adjustments, health changes), and enqueues resolved storylets for UI consumption.
6. <code_location>the-getaway/src/components/system/MissionProgressionManager.tsx</code_location> fires a mission-completion trigger, while <code_location>the-getaway/src/components/GameController.tsx</code_location> raises campfire-rest and curfew-ambush triggers so the system reacts to exploration and combat beats.
</technical_flow>

<pattern name="StoryletTriggering">
- Trigger payloads carry semantic tags (`resistance`, `rest`, `corpsec`, `injury`) so the engine can filter plays and match variance without peeking into Redux internals.
- Cooldowns are enforced both globally and per-location via `storylets.entries` and `lastSeenByLocation`, preventing repeat vignettes from spamming the player while still allowing act progression to surface fresh content.
- Queue entries persist localization keys alongside rendered text, letting future UI layers rehydrate narrative panels in the current locale while maintaining audit trails for what fired when.
</pattern>
</architecture_section>

<architecture_section id="level_up_flow" category="progression_ui">
##### Level-Up Flow Orchestration

<design_principles>
- Surface level advancement as a guided, multi-step funnel so players can review rewards, select perks, and allocate points without leaving the flow.
- Avoid dead-ends: if no perks remain or none are currently eligible, allow the player to continue while preserving outstanding selections for later.
- Keep Redux as the single source of truth for pending perk selections, attribute/skill points, and level-up events while the UI orchestrates presentation.
</design_principles>

<technical_flow>
1. <code_location>src/App.tsx</code_location> listens for `pendingLevelUpEvents`. When a `LevelUpModal` is dismissed it inspects `player.data` to decide whether to open the perk selector or point allocation panel first, skipping the character screen entirely during the guided sequence.
2. <code_location>src/components/ui/LevelUpModal.tsx</code_location> presents the promotion banner with reward cards (skill points, attribute points, perk picks, and recovery) plus next-step guidance before the flow begins.
3. <code_location>src/components/ui/PerkSelectionPanel.tsx</code_location> now distinguishes between “have pending picks” and “have eligible picks”, allowing players to continue if every perk is already owned or temporarily locked while still showing requirement callouts.
4. <code_location>src/components/ui/LevelUpPointAllocationPanel.tsx</code_location> handles attribute and skill point spending with enforced completion before returning control. When the panel closes, `App` re-checks Redux; if perk picks remain and new perks are now eligible, the selection panel reopens.
5. A new reducer, <code_location>src/store/playerSlice.ts</code_location> → `clearPendingPerkSelections`, zeroes out pending perk tokens only when no unowned perks remain, preventing players from getting stuck at high levels.
6. Each level grants one manual SPECIAL point (tracked in `player.attributePoints`), surfaced through <code_location>src/components/ui/LevelUpPointAllocationPanel.tsx</code_location> so players choose their own boosts without automatic allocation.
</technical_flow>
</architecture_section>

<architecture_section id="minimap_controller" category="ui_systems">
### Mini-Map Controller & Rendering Stack

<design_principles>
- Derive all minimap state once per frame from Redux selectors and camera viewport, then fan out through a pure render pipeline.
- Cache tiles/overlays/entities separately so zooming, panning, or entity updates only redraw the necessary layers.
- Keep UI presentation declarative: React renders canvases from `MiniMapRenderState`, while `MiniMapController` owns transforms and dirty-flag logic.
</design_principles>

<technical_flow>
1. <code_location>src/game/controllers/MiniMapController.ts</code_location> ingests the active `MapArea`, viewport, and path preview to produce a `MiniMapRenderState` with tile/entity/objective signatures and `dirtyLayers` flags.
2. <code_location>src/game/services/miniMapService.ts</code_location> subscribes to Redux, throttles broadcasts with `requestAnimationFrame`, and dispatches `MINIMAP_STATE_EVENT` snapshots plus zoom updates.
3. <code_location>src/components/ui/MiniMap.tsx</code_location> stacks five canvases (tiles, overlays, entities, path, viewport). Each canvas only redraws when its matching dirty flag flips, keeping zoom/drag interactions responsive.
4. Shift-drag emits `MINIMAP_PATH_PREVIEW_EVENT`; <code_location>GameController.tsx</code_location> resolves the path via `findPath`, dispatching `PATH_PREVIEW_EVENT` so both Phaser and the minimap display the queued route.
5. Legend clicks post `MINIMAP_OBJECTIVE_FOCUS_EVENT`, which `miniMapService` proxies to `MainScene.focusCameraOnGridPosition`, keeping map navigation consistent with core camera controls.
</technical_flow>

<pattern name="Layered Rendering">
- Tiles render into a dedicated canvas using cached gradients; overlays add curfew tint + neon border; entities/objectives draw glowing shapes; paths animate via a dashed canvas; viewport reticle sits topmost.
- High-contrast mode swaps tile palette, while auto-rotate rotates the canvas stack around the center and the pointer math in `MiniMap.tsx` compensates so drag targets remain accurate.
- Keyboard arrow keys nudge the camera by emitting viewport focus events, matching accessibility expectations and enabling keyboard-only navigation.
</pattern>

<pattern name="Event Contract">
- `MINIMAP_STATE_EVENT` → React HUD updates (tiles/entities/path/viewport).
- `MINIMAP_ZOOM_EVENT` → syncs slider + button states on the HUD.
- `MINIMAP_PATH_PREVIEW_EVENT` → GameController pathfinding for Shift-drag waypoints.
- `MINIMAP_OBJECTIVE_FOCUS_EVENT` → camera snap-to-objective for legend shortcuts.
</pattern>
</architecture_section>

<architecture_section id="surveillance_network" category="gameplay_systems">
<design_principles>
- Author surveillance configuration outside runtime logic so curfew coverage can scale with new zones.
- Keep camera alert state in Redux to synchronize Phaser rendering, HUD, and minimap overlays.
- Treat observation cones as optional guidance: players explicitly toggle them so the base render stays uncluttered.
</design_principles>

<technical_flow>
1. `src/content/cameraConfigs.ts` declares static, motion, and drone camera blueprints per zone; `cameraTypes.ts` converts them into runtime state with sweep metadata.
2. `surveillanceSlice` stores zone cameras, HUD metrics, overlay toggles, and curfew banner visibility so React components can subscribe to a single source of truth.
3. `GameController` loads zone surveillance on area transitions, throttles crouch movement, and drives `updateSurveillance` every frame while binding `Tab`/`C` hotkeys through `setOverlayEnabled` and `setCrouching`.
4. `game/systems/surveillance/cameraSystem.ts` advances sweeps/patrols, applies stealth + crouch modifiers, raises network alerts, schedules reinforcements, and snapshots HUD values for the slice.
5. `MainScene` listens to store changes and instantiates `CameraSprite` containers that animate LEDs and cones, respecting the overlay flag on each update.
6. React HUD layers (`CameraDetectionHUD.tsx`, `CurfewWarning.tsx`) surface detection progress and curfew activation, while `MiniMap.tsx` renders camera glyphs with alert-state colors.
</technical_flow>

<code_location>the-getaway/src/game/systems/surveillance/cameraSystem.ts</code_location>
<code_location>the-getaway/src/game/objects/CameraSprite.ts</code_location>
<code_location>the-getaway/src/store/surveillanceSlice.ts</code_location>
<code_location>the-getaway/src/components/GameController.tsx</code_location>
<code_location>the-getaway/src/components/ui/CameraDetectionHUD.tsx</code_location>
<code_location>the-getaway/src/components/ui/CurfewWarning.tsx</code_location>
<code_location>the-getaway/src/components/ui/MiniMap.tsx</code_location>
</architecture_section>

<architecture_section id="witness_memory_heat" category="gameplay_systems">
<design_principles>
- Model suspicion as decaying eyewitness memory so stealth pressure emerges from elapsed time and behaviour rather than scripted cooldowns.
- Keep per-witness data local to observers while exposing aggregated heat via memoised selectors that HUD, AI, and content systems can share.
- Synchronise decay with world time controls (pause, cutscenes, dialogue) to avoid double ticks or skipped updates during freezes.
</design_principles>

<technical_flow>
1. <code_location>the-getaway/src/game/systems/suspicion/witnessMemory.ts</code_location> defines the `WitnessMemory` model plus `decayWitnessMemory`, `reinforceWitnessMemory`, and pruning helpers parameterised by half-life and certainty floor.
2. <code_location>the-getaway/src/game/systems/suspicion/suspicionSystem.ts</code_location> listens to guard vision cone events (Step 19) and surveillance detections (Step 19.5), applies disguise/lighting/crowd modifiers, and creates or reinforces memories per witness and recognition channel.
3. <code_location>the-getaway/src/store/suspicionSlice.ts</code_location> (or an extended `worldSlice`) stores memories keyed by zone, exposes `selectHeatByZone`, `selectLeadingWitnesses`, and derives alert tiers from the top-K weighted memories (certainty × proximity × report status).
4. <code_location>the-getaway/src/game/systems/ai/guardResponseCoordinator.ts</code_location> consumes heat tiers to escalate patrol density, checkpoint lockdowns, and combat readiness, reverting to calm behaviour as heat cools.
5. <code_location>the-getaway/src/components/debug/SuspicionInspector.tsx</code_location> and <code_location>the-getaway/src/components/ui/GeorgeAssistant.tsx</code_location> surface developer-facing heat telemetry and witness breakdowns gated behind feature flags.
</technical_flow>

<pattern name="WitnessDecayScheduler">
- `GameController` advances suspicion ticks alongside world time pulses, skipping decay when `time.isFrozen` (menus, dialogue) and clamping certainty within [0,1].
- Memories below the configured floor (default 0.05) are pruned immediately; suppressed memories remain stored but excluded from aggregation until reactivated.
- Save/load serialises witness snapshots `{ witnessId, recognitionChannel, certainty, lastSeenAt, halfLife, reported, suppressed }` with schema version guards.
</pattern>

<pattern name="HeatTierThresholds">
- Zone heat tiers map to enumerated guard states (`calm`, `tracking`, `crackdown`) so AI, HUD, and quests share a single source of truth instead of hard-coded floats.
- Aggregation sums the top-K certainty scores (default 5) multiplied by proximity and report multipliers, preventing dozens of faint memories from dwarfing primary witnesses.
- Designers override half-life and tier thresholds per district via `src/content/suspicion/heatProfiles.ts` to support paranoid corporate sectors versus sleepy outskirts without code edits.
</pattern>
</architecture_section>

<architecture_section id="localized_reputation_network" category="gameplay_systems">
<design_principles>
- Scope notoriety updates to the smallest meaningful audience first (witness → faction → neighborhood) so systemic reactions stay believable and performant.
- Keep event sensing, witness evaluation, interpretation, propagation, and reaction decoupled through message contracts to minimize feedback loops between UI, AI, and data layers.
- Budget rumor spread and decay inside the system itself so designers tweak pacing without touching consuming systems.
</design_principles>

<technical_flow>
1. <code_location>the-getaway/src/game/systems/reputation/events.ts</code_location> exposes `emitReputationEvent` which game actions call with trait tags, intensity, and location metadata. Events fan out through an in-memory queue managed by `reputationSystem`.
2. <code_location>the-getaway/src/game/systems/reputation/witnessService.ts</code_location> samples NPCs from the active `MapCell`, computes `visibilityScore = los * distanceFalloff * lighting * disguise * noise`, and yields `WitnessCandidate` objects. Candidates below threshold τ are flagged as rumor-only observers.
3. <code_location>the-getaway/src/game/systems/reputation/interpretation.ts</code_location> merges candidate data with faction value tables and personal bias traits to generate `WitnessRecord` entries containing trait deltas, confidence, and perceived alignment. Records persist to <code_location>the-getaway/src/store/reputationSlice.ts</code_location> for auditing.
4. <code_location>the-getaway/src/store/reputationSlice.ts</code_location> maintains layered `ReputationProfile` maps keyed by witness ID, faction ID, and `cellId`. Reducers apply weighted deltas, schedule decay ticks, and expose selectors for scoped lookups (e.g., `selectCellReputation(cellId, trait)`).
5. <code_location>the-getaway/src/game/systems/reputation/propagationService.ts</code_location> advances bounded gossip edges once per heartbeat using NPC social graphs pulled from `npcDirectory`. Each edge stores strength, latency, and remaining gossip energy to cap daily rumor spread.
6. Consumers pull scoped data through selectors: `DialogueController` adjusts available lines, `PricingService` modifies price multipliers, `GuardAIController` escalates alertness, and `QuestGatingService` unlocks/locks missions based on the relevant audience’s perception.
7. Developer tooling lives in <code_location>the-getaway/src/debug/reputationInspector.tsx</code_location> and <code_location>the-getaway/src/debug/reputationHeatmapLayer.tsx</code_location>, rendering overlays that visualize trait intensity by cell and witness breakdowns for tuning.
</technical_flow>

<pattern name="RumorPropagationBudget">
- Each NPC carries a `gossipEnergy` counter replenished daily; propagation edges consume energy per hop, enforcing slow spread without bespoke timers in consumers.
- Latency offsets ensure rumors resolve after a delay rather than instantly applying deltas, enabling designers to stage delayed reactions.
- Intensity gates allow catastrophic events to bypass normal caps by flagging `allowCrossCell` when thresholds exceed configured bounds.
</pattern>

<pattern name="ScopedReputationLookup">
- Selector priority order: direct witness override → social graph aggregate → faction aggregate → cell aggregate → fallback to global faction standing (Step 29).
- Each selector returns both score and confidence so UI and AI can present uncertain reactions (“I heard…” vs “I saw…”).
- Hooks expose subscription APIs for React HUD (discount banners, dialogue hints) without leaking Redux internals into Phaser systems.
</pattern>
</architecture_section>
### `/the-getaway/src/content`

Authorial data that defines the playable world, separated from runtime systems so levels can be versioned and reviewed independently.

- **`levels/level0`**: The foundation sandbox (Level 0) that aggregates quests, dialogues, NPC/item blueprints, building footprints, and cover positions. Each file exports immutable baselines that slices/scenes clone before mutating, giving us clean governance for future levels.
- **`levels/level0/locales`**: Locale-specific payloads (`en.ts`, `uk.ts`) containing the fully translated dialogue, quest metadata, blueprint names, and world objectives. The locale loader deep-clones the requested locale every time so runtime mutations never touch the authoring source.
- **`ui/index.ts`**: Centralised HUD copy (menu strings, quest log headings, etc.) with per-locale lookup tables consumed by React components.
- **`skills.ts`**: Declares branch/skill metadata (increments, effect blurbs, stub flags) used by the skill tree UI and runtime systems to keep XP progression data-driven.
- **`levels/index.ts`** (future): Intended as the registry once additional districts come online, enabling per-level loading without touching game logic.

### `/the-getaway/src/game`

Contains all game logic, separated into modules:

#### `/the-getaway/src/game/combat`

Handles the turn-based combat system:

- **`combatSystem.ts`**: Core combat mechanics including:
  - Damage calculations with hit chance modifiers
  - Distance and range calculations for targeting
  - Action Point (AP) costs for different actions
  - Cover mechanics that reduce hit chances
  - Turn management for player and enemies
  - Functions for checking valid moves and attacks

- **`enemyAI.ts`**: Artificial intelligence for enemies:
  - Decision-making for optimal enemy actions
  - Tactical behaviors like seeking cover when damaged
  - Movement algorithms for approaching the player
  - Combat strategies for different enemy types
  - Utility functions for evaluating positions and threats

#### `/the-getaway/src/game/world`

Manages the game world and environment:

- **`grid.ts`**: Grid-based world system:
  - Creating and managing the game map grid
  - Detecting walkable tiles and obstacles
  - Adding and removing walls and cover
  - Utility functions for converting between grid coordinates and pixel positions
  - Boundary checking and position validation

- **`dayNightCycle.ts`**: Day-night cycle implementation:
  - Time of day tracking (morning, day, evening, night)
  - Light level calculations for rendering
  - Visual effects through color overlays
  - Curfew mechanics for gameplay restrictions
  - Time progression based on real elapsed time
- **`pathfinding.ts`**: Breadth-first pathfinder supporting enemy avoidance and reserved tiles used by both player click-to-move and NPC routines.
- **`worldMap.ts`**: Generates large districts, interior connections, and seeds NPCs, enemies, and items with routines and dialogue IDs.

<architecture_section id="world_map_grid_pattern" category="world_generation">
##### World Map Grid Pattern

<pattern name="Manhattan Grid System">
The world map uses a **Manhattan-style grid system** inspired by urban planning principles:

**Core Pattern:**
- Wide vertical avenues and horizontal streets create a regular city block grid
- Buildings occupy rectangular footprints within blocks, separated by navigable streets
- Door tiles exist in street space (outside building footprints) to create clear separation between structure and navigation
- Each building connects bidirectionally to a procedurally generated interior space
</pattern>

<design_principles>
**Key Design Principles:**
- **Geometric Clarity**: All buildings are axis-aligned rectangles; no irregular shapes or overlapping footprints
- **Single-Parcel Blocks**: Each of the 16 Downtown blocks maps to one named parcel to keep overlays and doorways uncluttered
- **Street-Door Separation**: Doors must be positioned in street tiles adjacent to buildings, never on the building edge itself
- **Unique Positioning**: No two buildings share the same door coordinate
- **Parcel Signage**: Rooftop marquees were removed to keep skylines readable; exterior labeling now relies on environmental cues and quest UI copy
- **Spawn Sanitization**: Blueprint positions snap to the nearest walkable street tile during world generation so nothing spawns atop a roofline
</design_principles>
<pattern name="Elevation Profiles & Facades">
- `getTileElevation` and `getElevationProfile` convert tile metadata into height offsets so walls extrude into full prisms while cover uses half-height braces.
- `renderElevationPrism` draws right/front faces with tuned shadows, then caps the roof plane; `renderWallDetails` layers neon bands and ledges, and `renderCoverDetails` adds lips plus bracing lines for tactical readability.
- Door tiles stay flat at ground level but `drawDoorTile` projects a doorway panel onto the extruded facade using the same interpolation helpers, keeping entries visually aligned with building volumes.
- `drawBuildingLabels` now only clears previously spawned containers; marquee-style signage was retired to declutter the outdoor view.
</pattern>
<pattern name="Character Tokens & Labels">
- `IsoObjectFactory.createCharacterToken` builds reusable player/NPC/enemy markers composed of a halo, base diamond, extruded column, and beacon cap with configurable palettes.
- `positionCharacterToken` and `createCharacterNameLabel` coordinate container depth and neon nameplates so tokens stay legible from any camera offset.
- Character overlays (health bars, combat indicators, name labels) update alongside tokens, preserving 2.5-D depth sorting while surfacing combat data.
</pattern>

<pattern name="District Dressing">
- Building definitions carry `district`, `signageStyle`, `propDensity`, and `encounterProfile` hints (see `level0/locales/*`).
- `worldMap.applyDistrictDecorations` clones street tiles and promotes slum doors into scrap cover clusters while downtown doors gain planter-style cover to shape chokepoints.
- `IsoObjectFactory` now exposes `createBarricade`, `createStreetLight`, and `createBillboard` so scene code can spawn bespoke dressing without duplicating geometry math.
- `MainScene.renderStaticProps` reads district metadata to place props/highlights; `signageStyle` remains in content for future styling hooks but no longer drives neon marquees.
- Item blueprints receive explicit street coordinates; `MainScene` highlights both loot and interactive NPC tiles for readability.
</pattern>

<technical_flow>
**Technical Flow:**
1. <code_location>worldMap.ts</code_location> defines avenue/street boundaries via `isAvenue()` and `isStreet()` functions
2. Building definitions in <code_location>locale files</code_location> specify footprint bounds, door position, and interior dimensions
3. `applyDistrictDecorations()` promotes door-adjacent tiles into district-specific cover and queues item spawn seeds before interiors are linked
4. `applyBuildingConnections()` converts footprint tiles to walls, then explicitly marks door tiles as walkable
5. <code_location>MainScene</code_location> renders building name labels using building definitions passed from <code_location>BootScene</code_location>
6. Bidirectional connections enable seamless indoor/outdoor transitions
</technical_flow>
</architecture_section>

<architecture_section id="skill-tree-system" category="progression">
## Skill Tree System

<design_principles>
- Keep branch metadata declarative so designers can extend trees without touching reducers or combat formulas.
- Share the same math helpers between UI previews and runtime logic to avoid divergence.
- Preserve tag behaviour (+10 increments, symmetric refunds) wherever skill points are spent.
- Route dialogue/world gating through a single helper so XP investments have visible payoffs beyond combat.
</design_principles>

<pattern name="Skill Data Definitions">
- <code_location>src/content/skills.ts</code_location> defines Combat/Tech/Survival/Social branches with increments, descriptions, and stub markers for future specialisations.
- <code_location>src/game/interfaces/types.ts</code_location> introduces `SkillId`, `SkillBranchId`, `Player.skillTraining`, and `Weapon.skillType`, wiring the skill tree into player state and equipment definitions.
- <code_location>src/game/interfaces/player.ts</code_location> seeds zeroed training values while `playerSlice.createFreshPlayer` deep clones them so per-run changes never mutate defaults.
</pattern>

<pattern name="Allocation Flow">
- <code_location>src/store/playerSlice.ts</code_location> exposes `allocateSkillPointToSkill` / `refundSkillPointFromSkill`, using `getSkillDefinition` to determine increments and max caps; tagged skills simply swap to the +10 increment.
- <code_location>src/components/ui/SkillTreePanel.tsx</code_location> renders the tabbed UI, dispatches those actions, and pulls effect previews from <code_location>src/game/systems/skillTree.ts</code_location> while announcing updates via `aria-live` for screen readers.
- <code_location>src/components/ui/CharacterScreen.tsx</code_location> wraps the panel in a modal overlay (���� toggled by the HUD button or `C`) so detailed allocation lives off the main HUD while reusing `PlayerStatusPanel` and `PlayerStatsPanel` within the same layout.
- Regression tests in <code_location>src/__tests__/playerSlice.test.ts</code_location> and <code_location>src/__tests__/SkillTreePanel.test.tsx</code_location> lock down spend/refund behaviour and UI wiring.
</pattern>

<pattern name="Runtime Integrations">
- <code_location>src/game/combat/combatSystem.ts</code_location> now resolves a weapon's `skillType`, folds skill bonuses into hit chance, melee damage, and energy crit chance, and recognises `Weapon.skillType` on starting gear.
- <code_location>src/game/systems/skillTree.ts</code_location> centralises hit/damage/crit/radius math so combat and UI stay synchronised.
- <code_location>src/game/quests/dialogueSystem.ts</code_location> honours `skillCheck.domain === 'skill'`, checking `player.skillTraining` for thresholds like `[Hacking 50]` while still applying charisma dialogue bonuses for attribute checks.
- <code_location>src/components/ui/DialogueOverlay.tsx</code_location> delegates locking to `checkSkillRequirement` and resolves skill names through `getSkillDefinition` so the HUD mirrors backend gating.
- <code_location>src/game/world/grid.ts</code_location> enforces optional `MapTile.skillRequirement`, preventing players from entering locked tiles until their training crosses the defined threshold.
</pattern>

</architecture_section>

<architecture_section id="faction_reputation_system" category="progression">
## Faction Reputation System

<design_principles>
- Keep faction definitions declarative so content updates never require reducer rewrites.
- Treat rival penalties and allied hostilities as systemic rules living in one helper so Redux, UI, and content stay in sync.
- Surface every reputation change through a dedicated event queue so HUD, toast, and accessibility layers consume a single source of truth.
</design_principles>

<pattern name="Faction Definitions & Math">
- <code_location>the-getaway/src/game/systems/factions.ts</code_location> enumerates Resistance/CorpSec/Scavengers metadata, standing thresholds, and defaults, and exports helpers to clamp values, derive standings, and localise standing labels.
- Rival logic lives in `applyFactionDelta`, applying the 50% cross-faction penalty and forcing the opposing faction to at least Hostile (-70) when a side reaches Allied (≥60).
- `resolveReputationAction` maps roadmap actions (sabotage, reporting crimes, trading, etc.) to faction deltas so quests and events can request adjustments without hardcoding numbers.
</pattern>

<pattern name="State Management & Events">
- <code_location>the-getaway/src/store/playerSlice.ts</code_location> introduces `pendingFactionEvents` plus reducers `adjustFactionReputation`, `setFactionReputation`, and `consumeFactionReputationEvents`; each update records deltas, rival impacts, and standing changes with timestamps for downstream consumers.
- Background seeding now clones default faction standings from the metadata and clamps background adjustments via `clampFactionReputation`.
- Selectors in <code_location>the-getaway/src/store/selectors/factionSelectors.ts</code_location> expose structured standing summaries (value, localised standing, effects, next thresholds) so UI components stay presentation-only.
</pattern>

<pattern name="UI & Feedback Loop">
- <code_location>the-getaway/src/components/ui/FactionReputationPanel.tsx</code_location> renders the character-screen panel with colour-coded bars, standing badges, and effect summaries, pulling copy from `UIStrings.factionPanel` and selector data.
- <code_location>the-getaway/src/components/system/FactionReputationManager.tsx</code_location> watches the pending event queue, pushes log lines, and raises toast notifications with rival notes and standing shifts before clearing the queue.
- <code_location>the-getaway/src/App.tsx</code_location> mounts both the mission manager and the new faction manager so HUD feedback persists regardless of scene.
</pattern>

<pattern name="Gameplay Gating">
- <code_location>the-getaway/src/game/quests/dialogueSystem.ts</code_location> now honours `DialogueOption.factionRequirement`, blocking dialogue paths unless reputation or standing thresholds are met.
- <code_location>the-getaway/src/game/interfaces/types.ts</code_location> extends `DialogueOption`, `MapArea`, and `Player` definitions with faction-aware metadata and requirements.
- <code_location>the-getaway/src/components/GameController.tsx</code_location> evaluates `MapArea.factionRequirement` before changing scenes, logging `factionAccessDenied` when the player lacks the required standing or raw reputation.
- <code_location>the-getaway/src/content/system/index.ts</code_location> supplies the new localisation strings so denial messages and toast summaries respect the active locale.
</pattern>

</architecture_section>

#### `/the-getaway/src/game/quests`

Quest and dialogue systems:

- **`questSystem.ts`**: Quest management functionality:
  - Creating quests with objectives and rewards
  - Tracking quest status and progress
  - Updating objectives and checking completion
  - Distributing rewards upon quest completion
  - Managing active and completed quest lists

- **`dialogueSystem.ts`**: Conversation and interaction system:
  - Dialogue tree structure with nodes and options
  - Skill check integration for conditional dialogue paths
  - Quest-related dialogue options for starting/completing quests
  - Dialogue navigation and branching conversations
  - Helper functions for creating common dialogue patterns

<architecture_section id="dialogue_tone_pipeline" category="narrative_systems">
<design_principles>
- Procedural dialogue lines stay anchored to the plot bible influences (dry wit, surreal melancholy) and remain locale agnostic by sampling from data-driven templates.
- Persona, author, and scene vectors blend deterministically so regenerated lines are reproducible during tests or localisation review; fallback copy remains intact if tone configs are missing or explicitly opt out.
- Motif counters live per persona to prevent repeating signature imagery in adjacent lines while decaying across conversations so motifs can resurface over longer arcs.
</design_principles>

<technical_flow>
1. <code_location>the-getaway/src/content/dialogueTone/index.ts</code_location> composes the tone library by merging author fingerprints, persona baselines, scene hints, micro-templates, and synonym palettes. Entries encode trait weighting, motif tags (`motif.streetlight`, `motif.compass`, `motif.rain_hum`, `motif.glowsticks`), and optional lexicon overrides.
2. <code_location>the-getaway/src/game/narrative/dialogueTone/dialogueToneMixer.ts</code_location> blends author/persona/scene vectors with normalised weights, clamps conflicts (e.g., fragment preference on templates that forbid fragments), selects compatible templates, and samples palettes via seeded RNG so identical `(dialogueId, nodeId, seedKey)` inputs yield identical prose.
3. <code_location>the-getaway/src/game/narrative/dialogueTone/dialogueToneManager.ts</code_location> wraps the mixer with caching and persona-scoped motif tracking. It merges dialogue-level defaults with node overrides, resolves seed keys, and memoises results so repeated React renders do not mutate motif state or reshuffle generated text.
4. <code_location>the-getaway/src/components/ui/DialogueOverlay.tsx</code_location> requests generated copy through the manager. When `Dialogue.toneDefaults` / `DialogueNode.tone` metadata is present, the overlay renders the generated line; otherwise it falls back to the handcrafted `node.text`.
5. Locale bundles such as <code_location>the-getaway/src/content/levels/level0/locales/en.ts</code_location> opt in node-by-node. Archivist Naila now routes intro/mission/complete beats through the mixer, blending the Vonnegut-Brautigan author fingerprint with the Amara persona while retaining translated fallback text.
</technical_flow>
</architecture_section>

#### `/the-getaway/src/game/inventory`

Inventory and item management:

- **`inventorySystem.ts`**: Inventory functionality:
  - Weight-based inventory limitation system
  - Item management (adding, removing, using)
  - Item creation for different types (weapons, armor, consumables)
  - Item effects on player stats and attributes
  - Inventory organization and sorting capabilities

#### `/the-getaway/src/game/interfaces`

Character attributes and core game interfaces:

- **`types.ts`**: Core type definitions:
  - Base Entity interface for all game entities
  - Player, Enemy, and NPC interfaces
  - Item, Weapon, Armor, and Consumable type definitions
  - Quest and objective structures
  - Dialogue system interfaces
  - Map and tile definitions
  - Game state interface for state management

- **`player.ts`**: Player-specific functionality:
  - Default player configuration with balanced attributes
  - Functions for modifying player state
  - Health and action point management
  - Experience and leveling system
  - Character skill manipulation

#### `/the-getaway/src/game/scenes`

Contains Phaser Scene classes.

- **`BootScene.ts`**: A preliminary Phaser scene that runs first. Its primary role is to read the initial game state (map, player position) from the Redux store and then start the `MainScene`, passing the necessary data via the scene's `init` method. This ensures `MainScene` has the data it needs before its `create` method runs.
- **`MainScene.ts`**: The main Phaser scene rendering the world in an isometric projection (tiles, enemies, player, cover highlights, overlays). It subscribes to Redux (`worldSlice`, `playerSlice`, `logSlice`), reacts to state changes, and emits pointer events that power click-to-move path previews.

### `/the-getaway/src/store`

Redux state management:

- **`index.ts`**: Main Redux store configuration:
  - Combines all reducers into a single store
  - Exports typed hooks for accessing state
  - Configures middleware and devtools

- **`playerSlice.ts`**: Player state management:
  - Player position, health, and attributes
  - Inventory management
  - Experience and leveling actions
  - Action point manipulation for combat
- **`settingsSlice.ts`**: Stores user-configurable preferences (currently language locale) and exposes a `setLocale` reducer used by the menu UI.

- **`worldSlice.ts`**: World state management:
  - Current map area and time tracking
  - Combat state handling
  - Entity management (enemies, NPCs, items)
  - Environmental state like day/night cycle
  - Rebuilds map areas and door connections when the locale switches, keeping `mapConnections` in Redux so React components can resolve door transitions without touching the content layer directly.

- **`questsSlice.ts`**: Quest and dialogue state:
  - Active and completed quests
  - Quest objectives and progress
  - Active dialogue state for UI rendering
  - Seeds Redux state by cloning Level 0 resources from `/content/levels/level0`, keeping authoring data immutable
  - Seeds Redux state by cloning Level 0 resources from `/content/levels/level0` and re-clones whenever the locale changes, keeping authoring data immutable
  - Persistent `lastBriefing` pointer kept for audit trails even though quest intel now lives in the HUD log

- **`logSlice.ts`**: Manages a list of log messages for display in the UI. Provides an `addLogMessage` action to push new messages (e.g., combat events, warnings) onto the log stack.

### `/the-getaway/src/styles`

CSS and styling resources:
- Tailwind CSS configuration
- Custom CSS styles
- Theme definitions

## Key Components

### GameCanvas Component

`GameCanvas.tsx` is the bridge between React and Phaser. It:
1. Creates a container div for the Phaser canvas
2. Initializes a Phaser game instance when the component mounts
3. Configures Phaser with appropriate settings
4. Handles cleanup on component unmount
5. Provides an interface for React components to interact with the Phaser game

### SkillTreePanel Component

`SkillTreePanel.tsx` exposes the progression UI for character skills:
1. Renders Combat, Tech, Survival, and Social branches with an accessible tablist (arrow keys rotate branches, tab cycles controls).
2. Surfaces available skill points, tag indicators, and branch blurbs sourced from <code_location>src/content/skills.ts</code_location>.
3. Provides increment/decrement controls that dispatch `allocateSkillPointToSkill` and `refundSkillPointFromSkill`, honoring tag bonuses (+10 per spend) vs. standard (+5) increments.
4. Announces value changes via an `aria-live` region so screen readers receive updates like “Small Guns increased to 45, hit chance bonus now +22.5%”.
5. Mirrors combat formulas by calling <code_location>src/game/systems/skillTree.ts</code_location> to show real-time effect summaries (hit chance, crit bonus, melee damage, explosive radius).

### Redux Store

The Redux store serves as the central state management system, with:
- Separate slices for different game aspects
- Actions and reducers for state updates
- Selectors for efficient state access
- Local storage persistence (`store/index.ts`) so the command hub menu can resume prior sessions.
- `worldSlice` coordinates map directories, time-of-day/curfew state, NPC/enemy collections, and exposes helpers (`updateNPC`, `updateEnemy`, `setMapArea`) used by controllers and scenes.

<architecture_section id="data_flow" category="state_management">
## Data Flow

<pattern name="Unidirectional Data Flow">
1. User interactions (keyboard, mouse) are captured by React or directly by Phaser
2. Game logic in the <code_location>/src/game</code_location> modules processes these inputs
3. State changes are dispatched to the Redux store
4. UI components react to state changes and update accordingly
5. The game rendering is handled by Phaser through the <code_location>GameCanvas</code_location> component
</pattern>
</architecture_section>

<architecture_section id="implementation_patterns" category="code_standards">
## Implementation Patterns

<pattern name="Immutability">
### Immutability

All state updates are performed immutably using object spreads and function returns rather than direct mutation. This enables:
- Predictable state management
- Easy undo/redo functionality in the future
- Better performance through reference equality checks

Example from <code_location>combat/combatSystem.ts</code_location>:
```typescript
// Execute a move
export const executeMove = (
  entity: Player | Enemy,
  targetPosition: Position
): Player | Enemy => {
  // Update position and AP without mutation
  return {
    ...entity,
    position: targetPosition,
    actionPoints: entity.actionPoints - DEFAULT_MOVEMENT_COST
  };
};
```
</pattern>

<pattern name="Type Safety">
### Type Safety

Strong typing is used throughout the codebase to prevent runtime errors and provide better developer experience:
- All function parameters and return types are explicitly typed
- Unions and intersections are used to model complex relationships
- Generic types are employed where appropriate for reusability
</pattern>

<pattern name="Pure Functions">
### Pure Functions

Most game logic is implemented as pure functions that:
- Take inputs and return outputs without side effects
- Don't rely on external state outside their parameters
- Are easy to test in isolation
- Can be composed to create more complex behaviors
</pattern>

<pattern name="React Component Structure">
### React Component Structure

React components follow a consistent pattern:
- Functional components with hooks
- Props are explicitly typed
- Side effects are managed with useEffect
- Component responsibilities are clearly defined and focused
</pattern>
</architecture_section>

<architecture_section id="player_stats_profile" category="character_progression">
<pattern name="S.P.E.C.I.A.L Attribute Profile">
The player attribute system follows a Fallout-inspired S.P.E.C.I.A.L spread that flows from immutable definitions into UI rendering.

<design_principles>
- Keep stat metadata (abbreviations, min/max ranges, focus tags) centralised in <code_location>src/game/interfaces/playerStats.ts</code_location> so that gameplay systems and UI share a single source of truth.
- Represent stat values inside Redux as plain numbers on the `skills` object (<code_location>playerSlice.ts</code_location>) to keep persistence lightweight while helper utilities compute presentation data on demand.
- Treat locale-sensitive strings (labels, descriptions, focus badges) as content data in <code_location>src/content/ui/index.ts</code_location>; UI components never bake in raw text.
</design_principles>

<technical_flow>
1. <code_location>buildPlayerStatProfile()</code_location> converts the Redux `skills` payload into range-clamped entries with normalised percentages.
2. <code_location>PlayerStatsPanel.tsx</code_location> derives labels/descriptions from the locale bundle, renders stat cards with progress bars, and surfaces focus tags for quick readability.
3. Card gradients are keyed off stat focus values, giving the HUD a consistent neon aesthetic while keeping styling data-driven.
</technical_flow>

<code_location>src/game/interfaces/playerStats.ts</code_location>
<code_location>src/components/ui/PlayerStatsPanel.tsx</code_location>
<code_location>src/content/ui/index.ts</code_location>
</pattern>
</architecture_section>

<architecture_section id="character_creation_flow" category="character_progression">
<pattern name="Three-Step Character Creation Wizard">
The onboarding flow lives entirely in <code_location>src/components/ui/CharacterCreationScreen.tsx</code_location> and stages player setup before any Redux mutations occur.

<design_principles>
- Keep identity, attribute, and background selections in local React state until the user confirms, preventing half-built payloads from leaking into persistence.
- Drive mechanical previews (derived stats, tooltips, warnings) off shared helpers like <code_location>src/game/systems/statCalculations.ts</code_location> so UI mirrors combat/dialogue math.
- Source authorial metadata from <code_location>src/content/backgrounds.ts</code_location> to keep narrative blurbs, perks, and loadouts editable without touching component logic.
</design_principles>

<technical_flow>
1. Step 1 captures `name` + `visualPreset`; the wizard exposes randomize/cancel affordances and validates length + allowed glyphs.
2. Step 2 manages SPECIAL values in local state, enforces the point-buy budget, and streams live derived stats via `calculateDerivedStats`.
3. Step 3 renders background cards generated from `BACKGROUNDS`, tagging each with `data-testid` for deterministic tests and ARIA labels for accessibility.
4. On confirmation the component emits `CharacterCreationData` with name, preset, attributes, and `backgroundId` to <code_location>src/App.tsx</code_location>.
5. `App` dispatches `initializeCharacter` in <code_location>src/store/playerSlice.ts</code_location>, which clamps attributes, applies derived stats, seeds faction reputation, grants perks, and equips loadout items using inventory factories.
</technical_flow>

<code_location>src/components/ui/CharacterCreationScreen.tsx</code_location>
<code_location>src/content/backgrounds.ts</code_location>
<code_location>src/store/playerSlice.ts</code_location>
<code_location>src/__tests__/backgroundInitialization.test.ts</code_location>
</pattern>
</architecture_section>

## Testing Strategy

The testing approach includes:
- Unit tests for core game mechanics
- Component tests for UI elements
- Comprehensive type testing to ensure interface compatibility
- Test mocks for external dependencies

Example test in `__tests__/types.test.ts`:
```typescript
test('calculateHitChance should return lower value when behind cover', () => {
  const attacker = { x: 0, y: 0 };
  const target = { x: 1, y: 1 };
  
  const normalHitChance = calculateHitChance(attacker, target, false);
  const coverHitChance = calculateHitChance(attacker, target, true);
  
  expect(coverHitChance).toBeLessThan(normalHitChance);
});
```

## Future Considerations

- **Scalability**: The folder structure is designed to support expansion to Fallout 2 scale
- **Modularity**: Components and game logic are separated to allow for easier maintenance
- **Testing**: Jest configuration is in place to support testing as the codebase grows
- **Asset Management**: Structure accommodates the addition of many assets as they're created
- **Performance Optimization**: The current architecture allows for future optimizations like:
  - Memoization of expensive calculations
  - Selective rendering of game elements
  - Chunking of large game maps

## Integration Points

### React <-> Phaser Integration

The integration between React and Phaser is managed through the GameCanvas component, which:
- Initializes Phaser in a React-managed div
- Provides lifecycle management for the Phaser instance
- Will handle communication between Redux state and Phaser's internal state

### Redux <-> Game Logic Integration

Game logic functions are pure and don't directly interact with Redux. Instead:
- Redux actions call game logic functions with current state
- Functions return new state that is then stored in Redux
- React components subscribe to relevant parts of the Redux state
- This separation allows for easier testing and maintenance

This architecture provides a solid foundation for implementing the features outlined in the implementation plan while maintaining code organization and scalability.

## Game Engine Integration

The game engine integration connects Phaser with React and Redux to handle game rendering and state management.

### Components

#### GameCanvas Component (`src/components/GameCanvas.tsx`)

This component serves as the primary connection between React and Phaser:

- Initializes and renders the Phaser game within a dedicated `div` container.
- Uses `BootScene` as the initial scene to ensure proper data loading before `MainScene` starts.
- Manages the Phaser game instance lifecycle (creation/destruction).
- Can include UI overlays (like player position) positioned absolutely over the canvas.

#### GameController Component (`src/components/GameController.tsx`)

The GameController acts as the central hub for handling user input and orchestrating game flow, especially combat turns:

- Listens for keyboard events (movement, attack, end turn).
- Dispatches Redux actions based on input (e.g., `movePlayer`, `executeAttack`, `switchTurn`).
- Validates player actions against game rules (walkable tiles, AP cost).
- Manages the enemy turn sequence using `useEffect` hooks, state variables (`currentEnemyTurnIndex`, `isProcessingEnemyAction`), and `setTimeout` for delays.
- Calls enemy AI (`determineEnemyMove`) and dispatches resulting enemy actions.
- Dispatches messages to the `logSlice` for display in the `LogPanel`.
- Displays a minimal turn indicator UI.
- Treats NPC coordinates as hard blockers, queues conversation approach paths on tile clicks, and records the most recent dialogue node for Ops Briefings.

### Game Engine

#### MainScene Class (`src/game/scenes/MainScene.ts`)

This is the central Phaser scene that renders the game world:

- Subscribes to the Redux store to reflect state changes
- Renders the grid-based map with different tile types
- Handles player sprite positioning and movement
- Manages rendering updates when game state changes
- Implements proper cleanup on scene shutdown

### State Management

The Redux store serves as the single source of truth for game state:

- Player state (position, health, inventory) is managed in `playerSlice.ts`
- World state (map, entities, time) is managed in `worldSlice.ts`
- Game actions are dispatched through Redux actions
- Phaser subscribes to state changes and updates visuals accordingly

### Data Flow

1. User input captured by `GameController`.
2. `GameController` validates input and dispatches Redux actions (`playerSlice`, `worldSlice`, `logSlice`).
3. Redux reducers update the store state.
4. `MainScene` (subscribed to `worldSlice`, `playerSlice`) detects changes and updates Phaser visuals (player/enemy position, health text).
5. React UI components (`PlayerStatusPanel`, `LogPanel`, subscribed to `playerSlice`, `logSlice`) detect changes and re-render.

This architecture creates a clean separation of concerns:
- Game logic and state are managed in Redux
- Rendering and graphics are handled by Phaser
- UI components are built with React
- Communication between layers is handled through Redux state

This approach provides several benefits:
- Game state can be easily saved/loaded
- Time travel debugging is possible with Redux DevTools
- Components can be tested independently
- Game logic is decoupled from rendering details

## Grid-Based Movement System

The grid-based movement system is a core component of the game, providing the foundation for player navigation, combat positioning, and interaction with the environment.

### Key Components

#### Grid System (`/src/game/world/grid.ts`)

This file defines the core grid functionality:

- **Grid Creation**: Functions to create empty grids, basic map areas, and test maps with obstacles
  - `createEmptyGrid`: Creates a 2D array of MapTile objects with default properties
  - `createBasicMapArea`: Generates a map area with walls around the edges
  - `createTestMapArea`: Creates a more complex map with internal walls and cover for testing

- **Position Validation**:
  - `isPositionInBounds`: Checks if a position is within the map boundaries
  - `isPositionWalkable`: Determines if a position can be moved to (not a wall or out of bounds)
  - `getAdjacentWalkablePositions`: Returns all valid positions that can be reached in one step

- **Map Manipulation**:
  - `addWalls`: Adds walls to specific positions in a map area
  - `addCover`: Adds cover elements that provide tactical advantages during combat

- **Coordinate Conversion**:
  - `gridToPixel`: Converts grid coordinates to pixel positions for rendering
  - `pixelToGrid`: Converts pixel coordinates to grid positions for input handling

#### Movement Controller (`/src/components/GameController.tsx`)

Manages player input and movement:

- Captures keyboard input (arrow keys and WASD)
- Validates movement against the grid before updating position
- Handles action point costs for movement during combat
- Provides visual feedback when movement is blocked
- Prevents movement during combat if it's not the player's turn

#### Visual Rendering (`/src/game/scenes/MainScene.ts`)

Renders the grid and player:

- Draws the grid with visual elements for different tile types
- Updates player sprite position based on grid coordinates
- Uses distinctive visual indicators for walls, cover, and floor tiles
- Subscribes to Redux state changes to refresh rendering when needed

### Movement Workflow

1. **Input**: Player presses movement key (arrow or WASD)
2. **Validation**: GameController checks if the new position is walkable
3. **State Update**: If valid, Redux action updates player position
4. **Rendering**: MainScene responds to state change and updates visual position
5. **Feedback**: If invalid, feedback message appears to indicate blocked movement

### Map Structure

Maps use a 2D array of MapTile objects with properties:
- **type**: The tile type (FLOOR, WALL, COVER, etc.)
- **position**: Grid coordinates
- **isWalkable**: Whether the player can move onto this tile
- **provideCover**: Whether the tile offers combat advantages

### Integration with Redux

The grid system integrates with Redux through:
- **worldSlice**: Stores the current map area and handles map state changes
- **playerSlice**: Manages player position and movement-related actions
- **Subscription**: MainScene subscribes to state changes to update rendering

### Testing

The movement system is thoroughly tested with unit tests that verify:
- Grid creation with correct dimensions
- Wall and cover placement
- Pathfinding and adjacency calculation
- Position validation and boundary checking

This grid-based system provides a foundation for future enhancements like combat, NPC movement, and more complex environments.

## Combat System

The combat system is a turn-based framework that manages interactions between the player and enemies, providing a tactical experience with elements like action points, attack mechanics, and enemy AI.

### Key Components

#### Combat Mechanics (`/src/game/combat/combatSystem.ts`)

This module provides the core combat functionality:

- **Action Point System**: Both player and enemies have action points (AP) that limit actions per turn
  - Movement costs 1 AP per tile
  - Attacks cost 2 AP and deal configurable damage
  - When an entity runs out of AP, their turn ends

- **Attack Mechanics**:
  - `executeAttack`: Handles attack logic including hit chance calculation and damage application
  - `calculateHitChance`: Determines probability of hitting based on distance and cover
  - Damage system that reduces target health while respecting constraints like minimum health (0)

- **Movement During Combat**:
  - `canMoveToPosition`: Validates if an entity can move to a position based on adjacency and obstacles
  - `executeMove`: Updates entity position and deducts the appropriate AP cost

- **Turn Management**:
  - `initializeCombat`: Prepares entities for combat by resetting action points
  - `endCombatTurn`: Switches turn between player and enemies, refreshing AP for the next active entity

#### Enemy AI (`/src/game/combat/enemyAI.ts`)

The AI module governs enemy behavior during combat:

- **Decision Making**:
  - `determineEnemyMove`: Core function that decides the best action based on current state
  - Prioritizes attacking if player is in range
  - Seeks cover when health is low
  - Moves toward player when out of range

- **Tactical Positioning**:
  - `moveTowardPlayer`: Calculates optimal move to approach the player
  - `seekCover`: Finds and moves toward cover positions
  - `findNearestCover`: Locates the closest cover element

- **Position Evaluation**:
  - `getAdjacentPositions`: Identifies all possible move options
  - Distance calculations to determine optimal positioning

### Integration with Redux

The combat system integrates with Redux through:

- **World State**:
  - `inCombat` flag indicates when combat is active
  - `isPlayerTurn` tracks whose turn it is
  - `createEnemy` and `spawnEnemy` functions create enemy entities

- **Player State**:
  - Tracks health, action points, and position
  - `updateActionPoints` and `updateHealth` actions modify player state during combat

### Visual Representation

The combat is visualized through:

- **MainScene**:
  - Renders enemies as red squares with health indicators
  - Displays player and enemy positions on the grid
  - Shows combat status and current turn

- **Game Controller**:
  - Handles player input for combat (spacebar to attack)
  - Provides feedback for combat actions
  - Shows information about the current combat state

### Combat Flow

1. **Initiation**: Combat begins when the player moves adjacent to an enemy or attacks using spacebar
2. **Player Turn**: Player spends AP on movement and attacks until AP is depleted or turn is ended
3. **Enemy Turn**: Each enemy uses AI to make decisions and spend their AP
4. **Turn Cycling**: Turns alternate until combat ends (all enemies defeated or player disengages)

### Test Coverage

The combat system is thoroughly tested with:

- Unit tests for attack mechanics and hit calculation
- Tests for movement validation during combat
- Verification of turn management and AP system
- Tests for enemy AI decision-making logic

This combat architecture provides a foundation for tactical gameplay and can be extended with additional features like different weapon types, special abilities, and more complex enemy behaviors.

<architecture_section id="stamina_system" category="resource_management">
## Stamina System

<design_principles>
- Keep action points focused on tactical turns; use stamina strictly for exploration pressure
- Derive stamina capacity from Endurance so the attribute has visible moment-to-moment impact
- Surface fatigue state prominently in UI so players know when to rest or change pace
- Centralize stamina constants/helpers in a shared module to avoid magic numbers across slices and components
</design_principles>

<pattern name="Core Stamina Resource (MVP - Step 24.5)">
### State Management
- Extend `Player` interface in <code_location>src/game/interfaces/types.ts</code_location> with `stamina`, `maxStamina`, and `isExhausted` fields.
- Redux logic in <code_location>src/store/playerSlice.ts</code_location>:
  - Helper utilities `ensureStaminaFields()` and `updateStaminaCapacity()` keep values clamped and ratios preserved.
  - Reducers `consumeStamina(amount)`, `regenerateStamina(amount?)`, and `updateMaxStamina()` manage the resource without tying it to combat turns.
  - `addExperience` and `levelUp` now restore stamina to full when a level is gained.
  - `spendAttributePoint('endurance')` and other attribute mutations recalculate stamina capacity alongside HP/AP.
- Shared constants live in <code_location>src/game/systems/stamina.ts</code_location> (`STAMINA_COSTS`, `STAMINA_REGEN_OUT_OF_COMBAT`, thresholds, helpers).

### Overworld Integration
- <code_location>src/components/GameController.tsx</code_location> introduces `attemptMovementStamina()`:
  - Shift+movement triggers a sprint cost (`STAMINA_COSTS.sprintTile`).
  - Encumbrance at ≥80% capacity adds a 1-point drain per tile.
  - Combat ignores stamina entirely—movement and attacks remain AP-driven.
  - When costs are zero (walking, light load) the controller calls `regenerateStamina()` for passive recovery.
  - If the player lacks stamina or is exhausted, the controller logs localized warnings and blocks the sprint.
- Additional interactions (lockpicking, climbing) will hook into the same reducers in future steps.

### Derived Stats
- <code_location>src/game/systems/statCalculations.ts</code_location> exports `maxStamina` as part of `DerivedStats`, computed as `50 + endurance * 5`.
- All attribute updates reuse this calculation so stamina capacity stays in sync with Endurance changes.

### UI Components
- <code_location>src/components/ui/PlayerSummaryPanel.tsx</code_location> shows a green stamina bar with a "Fatigued" badge when `isExhausted` is true.
- <code_location>src/components/ui/PlayerStatsPanel.tsx</code_location> lists "Max Stamina" alongside other derived metrics.
- <code_location>src/components/ui/LevelUpPointAllocationPanel.tsx</code_location> highlights stamina gains when boosting Endurance (`Max Stamina: {player.maxStamina} (+5 per point)`).
</pattern>
</pattern>

<pattern name="Advanced Stamina Features (POST-MVP - Step 26.1)">
### Time-of-Day Integration
- <code_location>src/store/worldSlice.ts</code_location>:
  - Subscribe to `timeOfDay` changes (morning/day/evening/night)
  - Dispatch `applyTimeOfDayStaminaModifier()` on time transitions
  - Night (10PM-6AM): Multiply stamina costs by 1.25, reduce regen by 2
  - Curfew zones: Additional -3 stamina drain per turn

### Circadian Fatigue
- Extend `Player` state:
  ```typescript
  interface Player {
    // ... existing fields
    hoursAwake: number;
    fatigueLevel: number; // 0-100, calculated from hoursAwake
  }
  ```
- <code_location>src/store/playerSlice.ts</code_location>:
  - `incrementFatigue(hoursElapsed)`: Increase `hoursAwake`, recalculate `fatigueLevel`
  - After 8 hours: `maxStamina *= (1 - (hoursAwake - 8) * 0.1)`
  - `resetFatigue()`: Set `hoursAwake = 0`, restore `maxStamina` to base

### Environmental Effects
- <code_location>src/game/world/grid.ts</code_location>:
  - Extend `MapTile` interface with `staminaDrain?: number` and `staminaCostMultiplier?: number`
  - Industrial tiles: `staminaDrain: 2` (passive drain per turn)
  - Rough terrain tiles: `staminaCostMultiplier: 2` (double movement cost)
- <code_location>src/store/worldSlice.ts</code_location>:
  - Track active weather events (heat wave, toxic fog) with stamina modifiers
  - Apply global stamina cost multipliers during active events

### Rest & Recovery
- <code_location>src/game/world/rest.ts</code_location>:
  ```typescript
  export interface RestOption {
    id: 'quickRest' | 'fullSleep' | 'catnap';
    duration: number; // in-game hours
    staminaRestore: number; // percentage or absolute
    resetsFatigue: boolean;
    encounterRisk?: number; // 0-100, for sleeping bag
  }

  export function executeRest(option: RestOption, location: 'safehouse' | 'wilderness'): RestResult;
  ```
- <code_location>src/components/ui/RestMenuPanel.tsx</code_location>:
  - Display rest options with time cost and stamina preview
  - Show warning if using Sleeping Bag (encounter risk)
  - Update world time and trigger fatigue reset on completion

### Advanced Perks
- <code_location>src/content/perks.ts</code_location>:
  - Conditioning (reduces all stamina costs by skill level * 0.5%)
  - Second Wind (auto-restore 40 stamina when < 10, once per combat)
  - Battle Trance (ignore costs for 3 turns, then crash)
  - Iron Lungs (+25% stamina regen)
- Runtime checks in combat system and perk activation handlers
</pattern>

<technical_flow>
**MVP Flow (Step 24.5):**
1. Player presses movement key or clicks a path.
2. `GameController` determines sprint state (Shift) and encumbrance drain, then calls `consumeStamina` when costs exist.
3. If stamina is insufficient or the player is exhausted, the move is cancelled and a warning is logged.
4. Successful moves dispatch `movePlayer` and, when costs are zero, `regenerateStamina` to model passive recovery.
5. Level ups recalc stamina capacity and restore the bar to full.

**Advanced Flow (Step 26.1):** *(planned)*
1. Time-of-day or environmental events adjust cost multipliers before movement.
2. Rest menu interactions call `regenerateStamina` with large values and reset exhaustion flags.
3. Perks (Conditioning, Second Wind, Iron Lungs) modify costs or regen rates via shared helpers.
</technical_flow>

<code_location>src/game/systems/stamina.ts</code_location>
<code_location>src/store/playerSlice.ts</code_location>
<code_location>src/game/systems/statCalculations.ts</code_location>
<code_location>src/components/ui/PlayerSummaryPanel.tsx</code_location>
<code_location>src/components/ui/CircadianFatigueTracker.tsx</code_location>
<code_location>src/game/world/rest.ts</code_location>
</architecture_section>

## Grid Rendering System

The grid rendering system is a core visual component that displays the game map, which serves as the foundation for player movement, enemy positioning, and tactical gameplay.

### Grid Rendering Techniques

The grid rendering system in `MainScene.ts` uses several techniques to create a clean, consistent visual representation:

#### Pixel-Perfect Rendering

- **Whole Pixel Alignment**: Uses `Math.floor()` for all pixel coordinates to avoid sub-pixel rendering issues that could cause inconsistent border thickness.
- **Grid Cell Drawing**: Each cell is drawn with precise dimensions, with inset filling that leaves exactly 1px for borders.
- **Consistent Border Approach**: Rather than relying on gaps between cells or overlapping borders, explicitly draws uniform 1px borders around each cell.

#### Visual Styling

- **Alternating Floor Patterns**: Floor tiles use a checkerboard pattern (alternating between `0x333333` and `0x3a3a3a`) for improved visual clarity.
- **Color Coding**: Different tile types (wall, floor, cover, door) have distinct colors for easy identification.
- **Visual Indicators**: Uses symbols like X marks for walls and circles for cover positions to enhance readability.
- **Background Fill**: Sets a consistent dark background (`0x1a1a1a`) that serves as the grid line color.

#### Render Process

The rendering follows a two-step process:
1. **Background Fill**: Fills the entire map area with the background color.
2. **Cell Drawing**: For each cell:
   - Determines the appropriate color based on tile type
   - Draws the cell with a 1px offset from all sides
   - Explicitly draws 1px border lines with consistent styling

### Responsive Handling

The grid system handles screen resizing through several mechanisms:

#### Camera System

- **Dynamic Zoom**: Calculates optimal zoom level based on available screen space and map dimensions.
- **Padding**: Maintains a small padding (5% of available space) to ensure edge cells remain visible.
- **Centered View**: Positions the camera to center the map in the available space.

#### Resize Management

- **Event Handling**: Listens for resize events from the Phaser scale manager.
- **Simplified Handling**: Uses direct camera and rendering updates rather than complex debouncing to prevent visual artifacts.
- **Consistent Updates**: Ensures the grid rendering is refreshed properly after resize.

#### Phaser Configuration

- **Scaling Mode**: Uses `Phaser.Scale.FIT` for consistent dimensions during resizing.
- **Pixel Art Optimization**: Enables `pixelArt: true` and `roundPixels: true` to maintain crisp grid lines at different zoom levels.

This rendering approach ensures the game grid maintains consistent visual quality across different screen sizes and resizing operations, providing a solid foundation for the tactical grid-based gameplay.

<architecture_section id="isometric_rendering" category="graphics">
## Isometric 2.5-D Graphics Guidelines

<pattern name="2:1 Isometric Projection">
### Grid & Projection Fundamentals
- Maintain a strict 2:1 isometric projection: every tile (e.g., 64×32 px) must be twice as wide as it is tall so that the diamond grid rendered by <code_location>MainScene.renderTile</code_location> stays aligned.
- Pixel art diagonals should follow a "two-step" pattern (two pixels across, one pixel down). Perfect 30° lines often look jagged; the two-step approach gives smoother edges while respecting the projection.
- All map tiles, props, UI overlays, and collision footprints should honour this ratio to keep depth sorting predictable across the entire scene.
</pattern>

<design_principles>
### Shading & Lighting
- Shade objects with three tonal values: light on the top plane, mid-tone on the light-facing side, and dark on the shadow side. This sells the illusion of a single baked light source (we currently imply light from the upper-left).
- When painting texture overlays (metal grain, fabric weave, decals), keep them on a separate layer and multiply blend them over the base shading so the underlying gradient remains visible.
- Ensure every imported or custom-rendered sprite bakes in the same light direction and contrast so mixed asset packs still feel cohesive.

### Layering & Depth Perception
- Depth is driven by draw order. Continue setting each `GameObject` depth to its pixel y-coordinate (plus a small offset) so lower objects render on top of those higher up the screen.
- Reinforce depth by slightly scaling down props placed "farther back" (higher y) and reducing their saturation/brightness while increasing contrast on foreground items.
- Use subtle atmospheric effects—soft tints, fog sprites, or gradient overlays—to imply distance without adding real 3-D geometry.

### Variation & Texture Use
- Generate variety by scaling, rotating 90°/180°, or skewing base primitives. Combine multiple material palettes (wood, stone, metal) on the same primitive to avoid repetitive visuals.
- Introduce micro-details (cracks, chipped corners, moss streaks, grime passes) so repeated tiles still feel organic.

### Building Complex Objects from Primitives
- Reuse the primitives already in <code_location>MainScene</code_location>: diamonds, prisms, ellipses, and accent polygons. Functions such as `renderTile` and `drawDoorTile` illustrate how to layer frames, panels, glows, and handles—treat them as blueprints for crates, consoles, or machinery.
- Create helper functions (e.g., `drawCrate`, `drawBarrel`) that call a shared shading routine and use `adjustColor` to compute highlight/shadow variants automatically.
</design_principles>

<pattern name="Isometric Utilities & Factory">
## Reusable Isometric Utilities & Object Factory

### Coordinate & Metric Helpers
- Extract `getIsoMetrics`, `calculatePixelPosition`, and `getDiamondPoints` from <code_location>MainScene.ts</code_location> into <code_location>src/game/utils/iso.ts</code_location>. Export them as `getIsoMetrics()`, `toPixel(gridX, gridY)`, and `getDiamondPoints(centerX, centerY, width, height)` so any scene or factory can place assets accurately on the diamond grid.
- Import these helpers wherever you spawn props, draw UI outlines, or calculate interaction hotspots to guarantee alignment without duplicating math.

### Colour Manipulation
- Move `adjustColor` into the same utility module. Document the convention: positive factors lighten towards white while negative factors darken towards black. Centralising the helper ensures shading stays consistent across tiles, props, and UI highlights.

### Object Factory Pattern
- Implement an <code_location>IsoObjectFactory</code_location> (class or module) exposing methods like `createFloor(x, y, type)`, `createWall(x, y, palette)`, `createCrate(x, y)`, or `createTree(x, y)`.
- Each factory method should:
  - Convert grid coordinates to pixels with `toPixel`.
  - Generate base geometry via `getDiamondPoints` (or ellipses/polygons for round objects).
  - Apply shading by calling `adjustColor` and a shared drop-shadow/highlight routine.
  - Return a `Phaser.GameObjects.Graphics` or `Container` ready to add to a scene, leaving Redux state untouched.
- Keep factory functions stateless and testable; they should only build visuals, not mutate gameplay state.
</pattern>
</architecture_section>

## Recommended Libraries & Tools
- **phaser3-plugin-isometric** – Adds isometric projection helpers, isoSprites with x/y/z coordinates, and simple 3-D physics when you need vertical stacking or z-based collisions.
- **Isomer (npm)** – Lightweight canvas engine providing `Shape`, `Point`, and `Color` classes for programmatically drawing prisms; great for rapid prototyping or generating reference art.
- **obelisk.js** – Outputs pixel-perfect cubes, pyramids, and slopes using a strict 1:2 pixel ratio; ideal for voxel-style props that match our grid.
- **@elchininet/isometric** – Supplies `IsometricCanvas` (Canvas/SVG) and primitive shapes (rectangles, circles) for UI diagrams or supplemental toolchains.
- **MagicaVoxel / Blender** – Model complex props or characters, render them from a 2:1 angle, and export sprite sheets with baked lighting for high-fidelity assets.

## Asset Sources & Object Banks
- **Kenney.nl (Free, CC0)** – Multiple modular isometric packs (miniature bases, buildings, roads, farms) suitable for rapid iteration and recolouring.
- **OpenGameArt – 1,049 Isometric Floor Tiles (Free, CC0)** – Extensive 2:1 tile collection covering water, autotiles, interiors, and decorative patterns.
- **GDevelop Isometric Interiors Pack (Free, CC0)** – 122 interior props (furniture, decor) already aligned with our projection.
- **Isometric Library by Monogon (Paid)** – ~47 high-quality sprites (architecture, props, characters) for premium scene dressing.
- **PVGames Packs (Paid)** – Large 2.5-D tilesets (Nature, Medieval, Interiors) with hundreds of modular pieces and matching characters; licences allow commercial projects with attribution.

Record licence and attribution requirements for every imported pack in `/src/assets/README.md` (or a dedicated manifesto) before distribution.

<architecture_section id="inventory_durability_system" category="inventory">
##### Inventory Durability & Encumbrance System

<design_principles>
- Centralise mutating logic inside Redux reducers so React components stay declarative.
- Keep encumbrance as a derived signal: recompute from inventory weight rather than persisting redundant values.
- Surface durability changes through combat events so HUD logging and reducers react without tight coupling.
</design_principles>

<technical_flow>
1. <code_location>src/store/playerSlice.ts</code_location> adds `equipItem`, `unequipItem`, `repairItem`, `splitStack`, and `assignHotbarSlot` reducers. Each validates payloads, clones nested structures, and finishes by calling `refreshInventoryMetrics`.
2. `refreshInventoryMetrics` recalculates carried weight, normalises the five-slot hotbar, and feeds those numbers to <code_location>src/game/inventory/encumbrance.ts</code_location>, which maps weight ratios to encumbrance levels, AP multipliers, and optional warning copy.
3. <code_location>src/game/combat/combatSystem.ts</code_location> now multiplies weapon/armor effectiveness by durability modifiers, decays durability after every attack, and emits structured combat events (`weaponDamaged`, `armorBroken`, etc.).
4. <code_location>src/components/GameController.tsx</code_location> watches encumbrance warnings and combat events, logging them through `logSlice` and halting queued movement when the player is immobile.
5. <code_location>src/store/playerSlice.ts</code_location> also exposes `useInventoryItem`, consuming stackable consumables, updating health/AP/stat effects, normalising hotbar slots when items vanish, and rerunning `refreshInventoryMetrics` so UI panels stay in sync.
6. Weapon/armor trait tags live in <code_location>src/game/systems/equipmentTags.ts</code_location>; two-handed locking and trait-aware combat adjustments (armor-piercing, hollow-point, silenced, energy) are enforced by <code_location>src/store/playerSlice.ts</code_location> and <code_location>src/game/combat/combatSystem.ts</code_location> to keep behaviour declarative.
</technical_flow>

<code_location>src/store/playerSlice.ts</code_location>
<code_location>src/game/inventory/encumbrance.ts</code_location>
<code_location>src/game/combat/combatSystem.ts</code_location>
<code_location>src/components/GameController.tsx</code_location>
<code_location>src/components/ui/PlayerInventoryPanel.tsx</code_location>
</architecture_section>

<architecture_section id="inventory_item_catalog" category="inventory">
##### Item Catalog & Save Sanitization

<design_principles>
- Centralise item blueprints so UI/content stay in sync with mechanics.
- Instantiate fresh item instances for runtime state; never pass catalog prototypes directly into reducers.
- Normalise legacy save payloads on load so durability, equip slots, and stack metadata conform to the latest expectations.
</design_principles>

<technical_flow>
1. <code_location>src/content/items/index.ts</code_location> defines weapon/armor/consumable prototypes and exports `instantiateItem` to clone them with fresh UUIDs, overriding durability or stack counts when needed.
2. Background loadouts now rely on catalog identifiers; <code_location>src/content/backgrounds.ts</code_location> stores `type="catalog"` entries so starting gear benefits from shared definitions (including the baseline repair kit consumable).
3. <code_location>src/store/playerSlice.ts</code_location> introduces `sanitizeItemForPlayer` + `deepClone` utilities invoked from `setPlayerData` and `refreshInventoryMetrics` to backfill equip slots, clamp durability, and enforce stack metadata when hydrating persisted state.
4. `repairItemInternal` synchronises `equipped` and `equippedSlots` after durability updates so perk/stack consumers read the same instance; repair consumables now resolve targets via `selectRepairTarget` and fold into the existing reducer pipeline.
5. For localStorage migrations, <code_location>scripts/migrate-save-durability.mjs</code_location> rewrites JSON blobs, ensuring hotbars reach capacity, equip slots populate correctly, and weight/encumbrance fields recompute before deserialisation.
</technical_flow>

<code_location>src/content/items/index.ts</code_location>
<code_location>src/content/backgrounds.ts</code_location>
<code_location>src/store/playerSlice.ts</code_location>
<code_location>scripts/migrate-save-durability.mjs</code_location>
</architecture_section>

## Integration with Current Architecture
- **State & Rendering Separation** – Keep isometric drawing confined to Phaser scenes (`MainScene` and any descendant scenes). Game logic, AI, and progress live in Redux slices; scenes should only read from selectors and render the resulting state.
- **Extensibility** – Organise new asset categories under `/src/assets` (e.g., `iso_tiles`, `iso_props`, `iso_characters`). Version-control derivatives separately and document licence obligations alongside the assets.
- **Localization** – Any user-facing asset name or description must be added to the locale files (e.g., `/src/content/levels/level0/locales/en.ts`, `/uk.ts`).
- **Testing** – Add unit tests for the shared utilities (`iso.ts`) and `IsoObjectFactory`. Create integration tests (Jest + Phaser headless) to verify depth ordering and hitbox accuracy when new factories are introduced.
- **Documentation** – Update this architecture guide and inline JSDoc whenever new primitives or factories land so future contributors understand expected shading, depth, and alignment conventions.

## Phaser Setup & Performance Considerations

Phaser configuration lives alongside our scenes; keep these settings scoped to `BootScene`, `MainScene`, or any future scene entry points so React/Redux layers stay renderer-agnostic.

### Renderer Selection
- Set `type: Phaser.AUTO` in the game configuration so Phaser prefers WebGL when available and falls back to Canvas on devices without GPU support.
- Favor WebGL for large sprite counts, shader-driven effects, and high-resolution scenes because it leverages GPU parallelism; Canvas uses CPU rasterization and can feel snappier on low-end or older hardware.

### Core Optimization Practices
- Pool frequently spawned objects (bullets, enemies, particles) instead of creating/destroying them each frame.
- Cache references to textures, animations, and lookup results so tight loops avoid repeated scene or registry queries.
- Update and render only visible entities—deactivate off-screen sprites and remove dormant objects from update loops.
- Texture-pack and compress art, then lazy-load bundles as scenes demand them to conserve memory.
- When targeting low-resolution art, render to a smaller internal canvas and scale via CSS, and batch draw calls (especially under WebGL) to reduce state changes.

### Canvas-Specific Guidance
- Use offscreen canvases for expensive blits, round draw coordinates to whole numbers to dodge sub-pixel blurring, and layer static/ dynamic content across multiple canvases when Canvas is active.
- Disable transparency with `{ alpha: false }` when compositing over an opaque background so browsers can optimize canvas buffers.

### GPU Usage & Future APIs
- WebGL remains the portable standard for GPU acceleration, enabling shader pipelines and large sprite batches today.
- WebGPU offers deeper GPU access but lacks universal browser support; continue shipping WebGL defaults with graceful Canvas fallbacks.

### Renderer Flexibility
- Expose a settings toggle or automated hardware probe that can swap between WebGL and Canvas at runtime.
- Abstract drawing helpers so gameplay logic never depends on the active renderer, keeping Redux reducers and React components oblivious to rendering details.

### Architectural Integration
- Confine renderer configuration and performance tricks to Phaser scenes and their supporting utilities—never bleed these concerns into Redux slices, thunks, or React components.
- Add inline documentation within Phaser config files to explain chosen settings, helping future contributors maintain consistent performance practices.
