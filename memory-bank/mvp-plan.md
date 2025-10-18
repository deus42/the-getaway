# Implementation Plan for "The Getaway" (Base Game)

<workflow_reminder>
- After completing any roadmap step, record it in `memory-bank/progress.md` with matching step metadata before continuing.
- Keep the corresponding Linear issue in sync: move it to `In Progress` while implementing, add a completion comment with validation commands, then mark it `Done`.
</workflow_reminder>

<phase id="1" name="Project Setup and Core Infrastructure">
<step id="1">
<step_metadata>
  <number>1</number>
  <title>Initialize the Project</title>
  <phase>Phase 1: Project Setup and Core Infrastructure</phase>
</step_metadata>

<instructions>
Set up a new project using TypeScript, React, and Vite for a browser-based game. Use Yarn for package management.
</instructions>

<details>
- Create the project with the Vite CLI and configure Yarn workspace.
- Install essential libraries: Phaser for game rendering, Redux for state management, Tailwind CSS for styling, and Jest for testing.
</details>

<test>
Run the project locally. Verify that a basic webpage loads in the browser without errors, showing a default template or blank screen.
</test>
</step>

<step id="2">
<step_metadata>
  <number>2</number>
  <title>Structure the Project Files</title>
  <phase>Phase 1: Project Setup and Core Infrastructure</phase>
</step_metadata>

<instructions>
Organize the project into a clear, modular folder structure to separate game logic, UI, and assets.
</instructions>

<details>
- Create top-level folders: `src/assets` (for images, sounds), `src/components` (React UI), `src/game` (game logic), `src/store` (state management), and `src/styles` (CSS).
- Inside `src/game`, add subfolders: `combat`, `world`, `quests`, `inventory`, and `interfaces`.
- Design the structure with scalability in mind, following Fallout 2 as a reference for game scale and complexity.
</details>

<test>
Create a dummy file in each folder (e.g., `test.ts`) and import it into the main entry file. Ensure no import errors occur when the project runs.
</test>
</step>

<step id="3">
<step_metadata>
  <number>3</number>
  <title>Embed the Game Engine</title>
  <phase>Phase 1: Project Setup and Core Infrastructure</phase>
</step_metadata>

<instructions>
Integrate Phaser into a React component to display the game canvas.
</instructions>

<details>
- Create a `GameCanvas` component in `src/components`.
- Set up Phaser to render a blank scene (e.g., a solid color background) inside a `div`.
- Establish the communication layer between Phaser and React/Redux.
</details>

<test>
Add the `GameCanvas` component to the main app. Verify that a blank game canvas appears in the browser, and check the console for Phaser initialization messages.
</test>
</step>
</phase>

<phase id="2" name="Core Game Mechanics">
<step id="4">
<step_metadata>
  <number>4</number>
  <title>Add Grid-Based Player Movement</title>
  <phase>Phase 2: Core Game Mechanics</phase>
</step_metadata>

<instructions>
Implement a scalable grid system for player movement in the game world.
</instructions>

<details>
- Define an initial 10x10 grid in `src/game/world` for prototyping, but architect the system to support much larger maps (similar to Fallout 2's expansive areas).
- Add a placeholder player sprite to the canvas and enable movement with arrow keys (up, down, left, right), shifting one tile per press.
- Include basic obstacles (e.g., walls) on the grid.
</details>

<test>
Use arrow keys to move the player across the grid. Ensure the player stops at obstacles and cannot pass through them.
</test>
</step>

<step id="5">
<step_metadata>
  <number>5</number>
  <title>Build a Basic Combat System</title>
  <phase>Phase 2: Core Game Mechanics</phase>
</step_metadata>

<instructions>
Create a turn-based combat system with a player and one enemy.
</instructions>

<details>
- Set up a combat manager in `src/game/combat`.
- Give each entity (player and enemy) 6 Action Points (AP) per turn. Moving costs 1 AP per tile; attacking costs 2 AP and deals 5 damage.
- Implement a simple enemy AI that can make basic decisions (approach player if far, attack if within range).
- Alternate turns between player and enemy.
</details>

<test>
Trigger combat. Move the player (spending 1 AP per tile) and attack (spending 2 AP). Verify AP decreases correctly, damage is applied, and turns switch after AP is spent. Observe enemy AI behavior.
</test>
</step>

<step id="6">
<step_metadata>
  <number>6</number>
  <title>Introduce Cover Mechanics</title>
  <phase>Phase 2: Core Game Mechanics</phase>
</step_metadata>

<instructions>
Add a cover system to enhance combat strategy.
</instructions>

<details>
- Mark specific grid tiles as "cover" (e.g., walls, barricades) that fit the dystopian setting.
- Reduce attack hit chance by 50% if the target is behind cover.
- Allow enemy AI to recognize and seek cover when at low health.
</details>

<test>
Position the player and enemy with a cover tile between them. Attack the enemy and confirm the hit chance is reduced. Move the enemy out of cover and verify the hit chance returns to normal.
</test>
</step>
</phase>

<phase id="3" name="Exploration and World Interaction">
<step id="7">
<step_metadata>
  <number>7</number>
  <title>Design a Small Explorable Map</title>
  <phase>Phase 3: Exploration and World Interaction</phase>
</step_metadata>

<instructions>
Create a basic open world with multiple connected areas.
</instructions>

<details>
- Use a tilemap to build an initial map with two distinct zones (e.g., "Slums" and "Downtown"), each at least 20x20 tiles to provide more exploration space.
- Design the map architecture to support eventual expansion to Fallout 2-scale environments with multiple districts.
- Add collision tiles (e.g., buildings, barriers) that match the dystopian setting from the backstory.
</details>

<test>
Walk the player from one zone to another. Ensure collision tiles stop movement and the transition between zones is seamless.
</test>
</step>

<step id="8">
<step_metadata>
  <number>8</number>
  <title>Add a Day-Night Cycle</title>
  <phase>Phase 3: Exploration and World Interaction</phase>
</step_metadata>

<instructions>
Implement a day-night cycle affecting visibility and game mechanics.
</instructions>

<details>
- Set a 5-minute cycle (2.5 minutes day, 2.5 minutes night).
- Dim the screen (e.g., add a semi-transparent overlay) during night.
- Incorporate elements from the backstory - like curfew mechanics or increased security at night.
</details>

<test>
Start the game and wait 5 minutes. Confirm the screen brightens at the start, dims after 2.5 minutes, and repeats the cycle. Verify that any time-based game mechanics activate appropriately.
</test>
</step>
</phase>

<phase id="4" name="Command & City Systems">
<step id="9">
<step_metadata>
  <number>9</number>
  <title>Establish Command Hub and Persisted Sessions</title>
  <phase>Phase 4: Command & City Systems</phase>
</step_metadata>

<instructions>
Build the command-center UI shell and wire up lightweight persistence for returning players.
</instructions>

<details>
- Introduce a full-screen game menu that can start a new campaign, continue an existing run, and surface future options.
- Restructure `App.tsx` into the three-column recon layout (status, game canvas, action log) to ground the HUD in resistance fiction.
- Persist Redux state to localStorage, expose a `resetGame` action, and hydrate the store on load so the menu accurately reflects save availability.
</details>

<test>
Launch the app, start a game, reopen the menu, refresh the page, and confirm the continue button remains enabled and resumes state.
</test>
</step>

<step id="10">
<step_metadata>
  <number>10</number>
  <title>Harden Curfew Pressure and Cover Feedback</title>
  <phase>Phase 4: Command & City Systems</phase>
</step_metadata>

<instructions>
Make the curfew mechanic readable and enforceable while guiding players to safety.
</instructions>

<details>
- Add a curfew alert state machine to `GameController` that issues a warning, spawns a single patrol if the player lingers exposed, and resets when cover is reached.
- Highlight available cover tiles during curfew inside `MainScene` with animated overlays that coordinate with the day-night tint.
- Cap log history and inject default curfew warnings so critical messages are visible even if the player has not acted yet.
</details>

<test>
With world time set to night, move the player in the open, verify a warning then one patrol spawn, and confirm re-entering cover clears the alert.
</test>
</step>

<step id="11">
<step_metadata>
  <number>11</number>
  <title>Expand Downtown into Enterable Megablocks</title>
  <phase>Phase 4: Command & City Systems</phase>
</step_metadata>

<instructions>
Scale the city into a contiguous grid with explorable interiors and richer population data.
</instructions>

<details>
- Regenerate the world map as a larger combined district with neon infrastructure, cover placements, and door connections between streets and building interiors.
- Auto-generate interior maps per building and register two-way `MapConnection`s so door traversal requires no bespoke code.
- Seed NPC and item blueprints (with routines, dialogue ids, and loot tables) and ensure Redux world state keeps them consistent across area swaps.
</details>

<test>
Walk from the Slums into multiple interiors and back, verifying map redraws, player repositioning, and enemy persistence without scene restarts.
</test>
</step>

<step id="11.5">
<step_metadata>
  <number>11.5</number>
  <title>Implement Downtown/Slums Overhaul</title>
  <phase>Phase 4: Command & City Systems</phase>
</step_metadata>

<instructions>
Implement the Downtown/Slums world-area overhaul so the city plays and reads differently per district.
</instructions>

<details>
- **District differentiation**
  - Extend `LevelBuildingDefinition` metadata with district, signage style, prop density, and encounter profile hints; regenerate the map to drop reclaimed cover clusters around slum doors and planter-style cover on downtown boulevards.
- **Environmental dressing**
  - Expand `IsoObjectFactory` with barricades, streetlights, and billboard props, then spawn them per building density while adding neon sidewalk overlays and signage palettes driven by style tags.
- **Population & loot**
  - Seed new interactive NPCs (Firebrand Juno, Seraph Warden, Drone Handler Kesh) with routines and dialogue, and place new lootables with explicit street coordinates so players see physical pickups.
- **Traversal & readability tuning**
  - Refresh cover spot data, highlight interactive NPCs/items in `MainScene`, and ensure new environmental dressing keeps pathfinding intact while strengthening combat sightlines.
</details>

<test>
Walk both districts and confirm signage palettes change per building, new props occupy streets without blocking traversal, additional NPCs spawn with dialogue, and seeded items display ground highlights while remaining reachable.
</test>
</step>
</phase>

<phase id="5" name="Narrative and Quest Layer">
<step id="12">
<step_metadata>
  <number>12</number>
  <title>Create an NPC with a Routine</title>
  <phase>Phase 5: Narrative and Quest Layer</phase>
</step_metadata>

<instructions>
Add a non-player character (NPC) that moves between locations.
</instructions>

<details>
- Define an NPC in `src/game/world` with a schedule (e.g., moves from one location to another during the day).
- Use basic pathfinding to guide the NPC.
- Implement simple AI behavior reflecting the dystopian setting (e.g., a merchant, guard patrol, or civilian with routines).
</details>

<test>
Watch the NPC during the day phase. Verify it moves smoothly from start to end point without getting stuck.
</test>
</step>

<step id="13">
<step_metadata>
  <number>13</number>
  <title>Set Up a Dialogue System</title>
  <phase>Phase 5: Narrative and Quest Layer</phase>
</step_metadata>

<instructions>
Build a text-based dialogue system with choices that can reflect the game's backstory.
</instructions>

<details>
- Create a dialogue manager in `src/game/quests`.
- Define a simple dialogue tree with options that reflect the dystopian setting (e.g., NPC discusses curfew or regime authorities).
- Display dialogue in a React overlay above the game canvas with a visually appropriate UI for the setting.
</details>

<test>
Interact with an NPC. Confirm the dialogue appears, choices are selectable, and the NPC's response changes based on the selection.
</test>
</step>

<step id="14">
<step_metadata>
  <number>14</number>
  <title>Add a Skill Check to Dialogue</title>
  <phase>Phase 5: Narrative and Quest Layer</phase>
</step_metadata>

<instructions>
Integrate a skill-based condition into dialogue options.
</instructions>

<details>
- Define player skills relevant to the setting (e.g., Charisma, Intelligence, Stealth) with default values.
- Add dialogue options that require skill checks (e.g., "Persuade" requiring Charisma > 5).
</details>

<test>
Set the required skill to a level below the threshold; the option should be locked. Increase it above the threshold; the option should unlock and work when selected.
</test>
</step>

<step id="15">
<step_metadata>
  <number>15</number>
  <title>Implement a Simple Quest</title>
  <phase>Phase 5: Narrative and Quest Layer</phase>
</step_metadata>

<instructions>
Create a basic quest with an objective and reward that fits the game's setting.
</instructions>

<details>
- Define a quest in `src/game/quests` that reflects the game's backstory (e.g., "Deliver a message to a resistance member").
- Track progress in state and show it in a React-based quest log.
- Reward XP and possibly an item upon completion.
</details>

<status>
Completed — the Quest Log panel tracks active/closed quests, dialogue hooks award XP/credits/items, rewards surface directly in the HUD, and Level 0 quest/dialogue data now lives under `/src/content/levels/level0/locales` with English/Ukrainian variants.
</status>

<test>
Accept the quest, complete the objective, and turn it in. Verify the quest log updates and rewards are awarded correctly.
</test>
</step>

<step id="16">
<step_metadata>
  <number>16</number>
  <title>Seed Dialogue and Quest Threads</title>
  <phase>Phase 5: Narrative and Quest Layer</phase>
</step_metadata>

<instructions>
Stand up the narrative data layer that ties NPCs, quests, and rewards together.
</instructions>

<details>
- Populate `questsSlice` with dialogue trees for key NPCs, including quest-triggering options and terminal nodes.
- Author quest configurations with collect/talk objectives, reward payloads, and helper reducers for objective counters and completion state.
- Keep dialogue state in Redux so UI components can drive conversations without local component state.
</details>

<test>
Dispatch dialogue and quest reducer actions (e.g., `startDialogue`, `startQuest`, `updateObjectiveCounter`) in Redux devtools and confirm quest state updates as expected.
</test>
</step>

<step id="16.5">
<step_metadata>
  <number>16.5</number>
  <title>Author Storylet Library Framework</title>
  <phase>Phase 5: Narrative and Quest Layer</phase>
</step_metadata>

<prerequisites>
- Step 16 completed (narrative data layer in questsSlice)
</prerequisites>

<instructions>
Implement a “Library of Plays” style storylet system so modular narrative beats slot into the campaign spine while reacting to character state.
</instructions>

<details>
- Create `src/game/quests/storylets/storyletTypes.ts` defining contracts for `StoryletPlay`, `StoryRole`, `Trigger`, `Branch`, and `Outcome`, including villain arc alignment, tags, cooldown windows, and required character traits.
- Add `src/game/quests/storylets/storyletRegistry.ts` exporting curated storylets grouped by villain arc phase (Act I setup, Act II escalation, Act III finale) with sample plays (ambush vignette, relationship beat, transformation aftermath). Each play lists eligible roles (`protagonist`, `foil`, `witness`) and trait-driven variant lines.
- Build `src/game/quests/storylets/storyletEngine.ts` with helpers to score available storylets, cast party members into roles based on tags/traits, and emit structured outcomes that Redux reducers can apply to quests, reputation, injuries, or boons.
- Extend `questsSlice` (or new `storyletSlice`) to track storylet cooldowns, last-seen plays per location, and queue selected storylets for UI rendering via dialogue/comic panels.
- Wire exploration/combat hooks (mission completion, patrol ambush, campfire rest) to call the engine, filter by current campaign beat, and dispatch the selected storylet payload.
- Provide starter localization entries under `src/content/storylets/` for at least three plays covering villain spine alignment, relationship-driven variation, and injury/trait-driven consequences.
</details>

<test>
Trigger the engine with mocked party state (injured stealth specialist, bonded partners, rival NPC) and assert it casts roles correctly, respects cooldowns, and returns variant text keyed to traits. Simulate exploration loop dispatching `storyletTriggered` and verify state prevents immediate repeats. Snapshot a rendered vignette to ensure placeholders populate with assigned character names/traits.
</test>
</step>

<step id="16.6">
<step_metadata>
  <number>16.6</number>
  <title>Standardize Level → Mission → Quest Hierarchy & Resource Keys</title>
  <phase>Phase 5: Narrative and Quest Layer</phase>
</step_metadata>

<prerequisites>
- Step 15 completed (basic quest implementation)
- Step 16 completed (narrative data layer in questsSlice)
</prerequisites>

<instructions>
Establish a canonical Level → Mission → Quest content hierarchy backed by stable resource keys. Centralize localization into shared key/value maps while keeping structural data in dedicated modules so every NPC, asset, and narrative element references its owner via keys instead of ad-hoc embeds.
</instructions>

<details>
- Create `src/game/narrative/structureTypes.ts` defining `LevelDefinition`, `MissionDefinition`, and `QuestDefinition` interfaces with `resourceKey` naming conventions and helpers to flag mission quests versus `missionId: null` side quests.
- Restructure content folders to mirror the hierarchy (`src/content/levels/{levelId}/levelDefinition.ts`, `missions/{missionId}/missionDefinition.ts`, `quests/{questId}/questDefinition.ts`), ensuring definitions reference assets/NPCs via resource keys rather than inline data.
- Move localization into shared `src/content/locales/{lang}/` bundles keyed by these resource identifiers (e.g., `levels`, `missions`, `quests`, `npcs` maps) so strings are maintained centrally and imported via lookup helpers.
- Update aggregate registries (`src/content/levels/index.ts`, `src/content/missions.ts`, `src/content/quests.ts`) to compose the hierarchy, enforcing that missions register under their level key, quests declare a valid `missionKey` or `null`, and NPC registries store owning `levelKey`/`missionKey` pairs.
- Introduce a validation utility (`src/game/narrative/validateContent.ts`) to assert key format compliance, resolve cross-references, and confirm locale entries exist for every registered resource key.
- Document the hierarchy and authoring workflow in `memory-bank/architecture.md`, covering how to add new levels, missions, quests, NPCs, assets, and localization entries using the standardized keys.
</details>

<test>
Add automated content validation that runs `validateContent` across all definitions, failing on missing keys, invalid references, or locale gaps. Smoke test a sample level to verify NPCs, quests, and UI strings resolve via the centralized locale helpers while respecting the new hierarchical imports.
</test>
</step>

<step id="16.7">
<step_metadata>
  <number>16.7</number>
  <title>Prototype Narrative → Triple → Scene Pipeline</title>
  <phase>Phase 5: Narrative and Quest Layer</phase>
</step_metadata>

<prerequisites>
- Step 16.5 completed (storylet library framework)
- Step 16.6 completed (Level → Mission → Quest hierarchy & resource keys)
</prerequisites>

<instructions>
Build a tooling pipeline that converts short narrative prompts into 2D tilemap blueprints by extracting `(object, relation, object)` triples, mapping them to placement rules, and emitting Phaser-ready scene definitions aligned with the level/mission hierarchy.
</instructions>

<details>
- Define JSON schemas in `src/game/narrative/tripleTypes.ts` for `NarrativeTriple`, `SceneMoment`, and `GeneratedSceneDefinition`, including fields for `resourceKey`, `priority`, `relation`, and optional spatial hints.
- Add `src/game/narrative/tripleExtraction.ts` with an adapter that accepts mission/quest text, runs an LLM prompt (tooling-only), and returns validated triple bundles per moment (time frame), with a manual authoring fallback.
- Create relation-to-placement mappings under `src/game/world/generation/relationRules.ts`, implementing functions for `on`, `near`, `inside`, `left_of`, and similar relations using existing grid helpers and respecting collision layers.
- Extend the map generation pipeline (`worldGenerationPipeline.ts`) to accept `GeneratedSceneDefinition` payloads: generate base terrain first, then apply prop placements and depth sorting based on rule outputs.
- Store generated scenes under `src/content/levels/{levelId}/missions/{missionId}/generatedScenes/` and register them via resource keys so missions can reference auto-generated layouts.
- Provide a CLI script `scripts/generate-scene-from-story.ts` that orchestrates extraction, invokes relation rules, writes the resulting scene JSON, and reports validation issues for missing assets or collisions.
- Document the workflow in `memory-bank/architecture.md`, covering how writers supply prompts, review triples, and integrate generated tilemaps.
</details>

<test>
- Unit test `relationRules` to ensure each relation produces valid tile placements without overlapping blocked cells.
- Add integration tests that feed sample triple bundles into the generator and assert the emitted scene references known resource keys and passes collision validation.
- Run the CLI on a sample mission narrative, load the generated scene in Phaser, and verify props appear in the correct locations with proper depth sorting.
</test>
</step>

<step id="16.8">
<step_metadata>
  <number>16.8</number>
  <title>Environmental Story Triggers & Ambient Feedback</title>
  <phase>Phase 5: Narrative and Quest Layer</phase>
</step_metadata>

<prerequisites>
- Step 7 completed (explorable map scaffolding establishes world entities to decorate)
- Step 16 completed (narrative data layer provides quest/dialogue context for trigger payoffs)
</prerequisites>

<instructions>
Implement a lightweight environmental trigger framework that reacts to world-state flags and surfaces diegetic hints (rumors, notes, ambient shifts) without new cutscenes.
</instructions>

<details>
- Extend `worldSlice` with narrative-facing flags (`gangHeat`, `curfewLevel`, `supplyScarcity`, `blackoutTier`) plus selectors and actions so narrative systems can drive environmental changes.
- Add `src/game/world/triggers/triggerRegistry.ts` to register trigger definitions (`when`, `fire`, `once`) and expose `tickEnvironmentalTriggers` for scene/game-loop integration.
- Create content tables (TS/JSON) under `src/content/environment/` for rumor rotations, notes, signage variants, and weather/power presets, each keyed by flag/value with one-line story function metadata.
- Wire NPC bark updates, ambient weather toggles, signage swaps, and collectible notes into existing entity managers (NPC dialogue hooks, weather service, poster/sign registries, map item spawners) so triggers mutate live state.
- Ensure triggers de-duplicate via `once` or cooldown tracking and log events to the HUD/action log for debugging.
- Document the authoring workflow in `memory-bank/architecture.md`, covering flag additions, trigger registration, and content authoring, and reference tone rules from `memory-bank/plot.md`.
</details>

<test>
- Use Redux DevTools or scripted actions to bump each flag and verify matching triggers fire exactly once (unless configured to repeat) and update NPC barks, weather, signage, or spawned notes accordingly.
- Load a scene, call `tickEnvironmentalTriggers` per frame/turn, and confirm idle triggers do nothing until conditions are met.
- Snapshot rumor and note content to confirm flag-conditioned variants appear and log entries match the expected tone.
</test>
</step>

<step id="16.9">
<step_metadata>
  <number>16.9</number>
  <title>Route Ambient World Events Through George Assistant</title>
  <phase>Phase 5: Narrative and Quest Layer</phase>
</step_metadata>

<prerequisites>
- Step 16.8 completed (environment trigger framework in place)
- George assistant overlay (HUD AI) active and emitting quest/objective updates
</prerequisites>

<instructions>
Promote George to the sole narrator for environmental changes by piping ambient triggers and zone hazard updates into his AI console instead of the HUD ticker.
</instructions>

<details>
- Extend George’s system module and selectors to monitor environment flags, trigger events, and zone metadata while caching previous values for comparison.
- Emit structured ambient events (`rumor`, `signage`, `weather`, `zoneDanger`, `hazardChange`) whenever trigger reducers fire; queue them in a new assistant event log with per-category cooldowns to avoid spam.
- Add a dedicated “Ambient Feed” tab in George’s console plus dock highlights so the latest world change surfaces even when the panel is collapsed.
- Remove the standalone HUD ambient ticker and migrate zone hazard/danger copy so George announces changes (“Zone danger elevated to Hazardous”, “New graffiti campaign spotted”) following the straight-faced absurdity tone.
- Update localization to cover the new callouts and ensure assistant personality/tone controls apply to ambient chatter.
- Document the assistant-driven ambient workflow in `memory-bank/architecture.md` and note the HUD change in `memory-bank/progress.md`.
</details>

<test>
- Simulate flag flips and zone transitions in Redux DevTools; confirm George queues a single notification per change type and respects cooldowns.
- Toggle assistant quiet mode/personality variants to verify ambient entries appear (or silence) appropriately.
- Play through a scenario with multiple trigger firings and ensure the assistant feed lists each change chronologically while the HUD no longer shows the removed ticker.
</test>
</step>
<step id="16.10">
<step_metadata>
  <number>16.10</number>
  <title>Tone-Preserving Procedural Dialogue System</title>
  <phase>Phase 5: Narrative and Quest Layer</phase>
</step_metadata>

<prerequisites>
- Step 16 completed (dialogue and quest threads seeded in Redux)
- Step 16.5 completed (storylet framework routes modular narrative beats)
- Review `memory-bank/plot.md` voice guidelines to align tone axes
</prerequisites>

<instructions>
Design a reusable tone-tagging pipeline that keeps the game’s authorial “voice” while generating replayable character dialogue.
</instructions>

<details>
- **Define Style Space**: Stand up `src/game/narrative/dialogueTone/` with TypeScript types describing tone trait axes (e.g., sarcasm, melancholy, warmth, surrealism) plus optional rhetorical knobs (sentence length mean, metaphor rate). Author a JSON schema so tools can validate tone configs.
- **Author & Persona Fingerprints**: Seed `src/content/dialogueTone/authors.ts` with the agreed influence vectors (e.g., Vonnegutish, Brautiganish) and `personas.ts` with stable character personas (Mara, Eli, etc.) capturing trait baselines, verbal tics, and lexicon overrides. Ensure data stays locale-agnostic.
- **Scene Style Hints**: Add `scenes.ts` entries tagged by narrative intent (`share_scarce_food`, `post_ambush_reassurance`) so quest/dialogue nodes can declare a target mood without hard-coding copy.
- **Templates & Palettes**: Define micro-templates (`templates.ts`) and trait-weighted synonym palettes (`palettes.ts`) that map style traits to concrete phrasing choices (e.g., deadpan prefers fragments, surreal adds unexpected imagery). Track lightweight motifs with counters keyed per character.
- **Runtime Mixer**: Implement `dialogueToneMixer.ts` that blends author, persona, and scene vectors (e.g., 0.4/0.4/0.2 weighting), clamps conflicting traits (terse vs. sentence length), selects a compatible template, chooses palette variants via weighted sampling, and applies persona tics/motifs.
- **Integration Layer**: Update `DialogueManager` (or dedicated helper) so dialogue nodes can reference style hints and request generated lines while preserving existing handcrafted copy as fallback. Provide deterministic seeds for regression tests and content tooling.
- **Documentation**: Capture the system architecture in `memory-bank/architecture.md` and refresh `memory-bank/game-design.md` with the narrative “voice” axis definitions and blending rules. Note tooling expectations in `memory-bank/progress.md` once implemented.
</details>

<test>
- Author sample configs and run schema validation to ensure tone payloads pass structural checks.
- Unit test the mixer: verify trait blending produces expected weights, clamp rules respect terse limits, and template selection honors constraints.
- Generate lines for contrasting personas (e.g., Mara vs. Eli) against the same scene hint and confirm style distances exceed the distinctness threshold while cosine similarity to the author fingerprint remains within tolerance.
- Trigger dialogue/storylet nodes that use procedural lines; ensure deterministic seed reproduction, lexicon palettes map correctly, and handcrafted fallback copy appears if configs are missing.
</test>
</step>
<step id="16.11">
<step_metadata>
  <number>16.11</number>
  <title>Hazard-to-System Integration Matrix</title>
  <phase>Phase 5: Narrative and Quest Layer</phase>
</step_metadata>

<prerequisites>
- Step 7 completed (baseline zones and hazards defined on the overworld map)
- Step 16.8 completed (environmental trigger flags and ambient feedback loop live in `worldSlice`)
</prerequisites>

<instructions>
Codify how district hazards propagate into AI behavior, faction pressure, and traversal safety through a shared integration matrix and accompanying documentation.
</instructions>

<details>
- Introduce `EnvironmentalFactor`, `SystemImpact`, and matrix helper types in `src/game/world/environment/environmentMatrix.ts` with entries for smog, blackout tiers, surveillance density, radiation pockets, and curfew status.
- Populate `environmentMatrix` so each hazard lists AI modifiers (sight cones, chase persistence, weapon loadouts), faction economy effects (shop markup, patrol strength, safe house availability), and travel risks (stamina drain, vehicle reliability, encounter tables). Provide numeric weights or script hooks that downstream systems can consume.
- Extend `worldSlice` selectors (or create `selectEffectiveEnvironmentImpacts`) to fuse live hazard flags with the matrix, emitting derived summaries for AI planners, encounter generation, and navigation warnings.
- Wire existing systems to the selectors: adjust NPC schedule weights, faction reinforcement budgeting, and travel advisory overlays to read matrix outputs instead of ad-hoc constants.
- Document the matrix in `memory-bank/game-design.md` (worldbuilding section) and summarize the data flow in `memory-bank/architecture.md`, including guidance for adding new hazards.
</details>

<test>
- Add unit tests in `environmentMatrix.test.ts` that validate every hazard enumerated in `EnvironmentalFactor` has matrix coverage and that selectors emit merged impacts when multiple hazards stack.
- Snapshot the derived selector output for representative districts (Industrial Wasteland, Downtown blackout, curfew escalation) to guard against regressions.
- Run an integration test or scripted simulation that toggles hazard flags and confirms AI patrol weights, faction pricing, and travel warnings update according to the matrix entries.
</test>
</step>
<step id="16.12">
<step_metadata>
  <number>16.12</number>
  <title>Role-Based Procedural Dialogue Templates</title>
  <phase>Phase 5: Narrative and Quest Layer</phase>
</step_metadata>

<prerequisites>
- Step 16.5 completed (storylet library available for systemic narrative beats)
- Step 16.10 completed (tone-preserving procedural dialogue pipeline and mixer)
</prerequisites>

<instructions>
Author reusable dialogue templates for systemic NPC roles so merchants, guards, medics, and gang lieutenants can speak consistently across dynamic encounters.
</instructions>

<details>
- Stand up `src/content/dialogueTemplates/roles/` with JSON/TS modules that define template families per role (`merchant`, `checkpoint_guard`, `street_doc`, `gang_scout`, etc.) referencing tone traits, required world-state flags, and failover copy.
- Add template metadata for gating (reputation thresholds, faction alignment, time-of-day, hazard context) so the dialogue mixer can filter candidates before sampling.
- Implement a `resolveRoleDialogueTemplate` helper in `src/game/narrative/dialogueTone/templateResolver.ts` that merges role metadata with the tone mixer output, fills placeholder tokens (item of the day, faction slang), and returns deterministic seeds for localization/testing.
- Expose role templates to the dialogue system by updating `DialogueManager` (or quest dialogue nodes) to allow `[roleTemplate:merchant.default_greeting]` references alongside existing handcrafted keys.
- Document authoring guidance in `memory-bank/game-design.md` (narrative systems section) and log the new tooling in `memory-bank/progress.md` once implemented.
</details>

<test>
- Add unit tests for `resolveRoleDialogueTemplate` that verify role gating respects reputation and hazard filters, returns seeded results, and falls back to default copy when requirements fail.
- Author snapshot tests that render sample role dialogues for contrasting personas (e.g., cautious vs. flamboyant merchant) to confirm tone modulation works with the new templates.
- Trigger in-game conversations with at least three systemic NPC roles and confirm dialogue pulls from the new template library, honors gating, and reports deterministic IDs for localization.
</test>
</step>
</phase>

<phase id="6" name="Visual and Navigation Upgrades">
<step id="17">
<step_metadata>
  <number>17</number>
  <title>Pivot Rendering to a Neon Isometric Grid</title>
  <phase>Phase 6: Visual and Navigation Upgrades</phase>
</step_metadata>

<instructions>
Rebuild the scene renderer around an isometric projection that reinforces the game's style.
</instructions>

<details>
- Recalculate tile metrics, camera bounds, and pointer hit detection to operate in isometric space while keeping movement/auth checks grid-based.
- Layer in neon ambiance (gradients, canal strips, additive cover markers) and ensure overlays respect zoom and window resize events.
- Synchronize the day-night tint with the new projection and eliminate flicker when visibility changes or the browser tab regains focus.
</details>

<test>
Playtest with aggressive zooming/resizing, verifying player movement, tile selection accuracy, and smooth overlay transitions through day/night.
</test>
</step>

<step id="18">
<step_metadata>
  <number>18</number>
  <title>Click-to-Move Navigation and Path Preview</title>
  <phase>Phase 6: Visual and Navigation Upgrades</phase>
</step_metadata>

<instructions>
Modernize free-roam navigation with click targeting and visual path confirmation.
</instructions>

<details>
- Implement a breadth-first pathfinder that respects obstacles, enemies, and map bounds while allowing door traversal when applicable.
- Emit pointer events from `MainScene`, preview the candidate route as isometric diamonds, and clear previews on map changes.
- Extend `GameController` to execute queued paths, bridge door transitions automatically, and abort paths when combat or curfew restrictions intervene.
</details>

<test>
Click long-distance destinations across multiple doors, confirm the preview matches the executed path, and ensure curfew-locked doors cancel movement.
</test>
</step>

<step id="18.5">
<step_metadata>
  <number>18.5</number>
  <title>Centralize Depth Ordering and Camera PostFX Defaults</title>
  <phase>Phase 6: Visual and Navigation Upgrades</phase>
</step_metadata>

<prerequisites>
- Step 17 completed (baseline isometric projection in place)
- Step 18 completed (click-to-move path previews wired through MainScene)
</prerequisites>

<instructions>
Unify draw-order determinism and camera-wide post-processing so every scene renders through a single, documented pipeline.
</instructions>

<details>
- Stand up `src/game/utils/depth.ts` with a `computeDepth(sx, sy, bias = 0)` helper that returns `(sy << 10) + (sx & 0x3ff) + bias` and export bias constants for UI overlays, tall props, and debug layers.
- Add a `DepthManager` (or equivalent service) that registers dynamic game objects from `MainScene` and performs a single pre-update pass each frame to assign depth via `computeDepth`, removing ad-hoc `setDepth` calls from factories and entity classes. Provide override hooks for objects that must pin to reserved bands (e.g., day/night overlay, path previews).
- Refactor `IsoObjectFactory`, `CameraSprite`, combat markers, and other render helpers to rely on the centralized manager for depth, keeping any remaining offsets in one `DepthBiasConfig`.
- Move default visual FX (bloom, vignette, color grading) onto the primary camera with toggles exposed through `src/game/settings/visualSettings.ts`, and ensure object-level FX are limited to unique cases.
- Author `memory-bank/graphics.md` that captures the depth rule, bias bands, camera FX order, and guidelines for introducing new FX or overlays. Link to this doc from `memory-bank/architecture.md` once implemented.
</details>

<test>
- Spawn a representative scene (player, enemies, tall props, overlays) and confirm depth remains stable while moving, zooming, and panning without per-entity overrides.
- Verify reserved bands keep the day-night overlay, HUD bridges, and debug paths clamped above/below dynamic actors.
- Toggle camera FX defaults on/off to confirm they apply globally and avoid duplicating shaders on individual sprites.
- Run unit coverage on `computeDepth` to ensure the helper respects clamped ranges and bias handling.
</test>
</step>

<step id="19">
<step_metadata>
  <number>19</number>
  <title>Implement Guard Perception & Alert States</title>
  <phase>Phase 6: Visual and Navigation Upgrades</phase>
</step_metadata>

<instructions>
Build stealth readability so patrols react believably to the player.
</instructions>

<details>
- Add patrol vision cones with suspicion → investigation → alarm escalation and expose tuning hooks for designers.
- Surface alert levels in the HUD/log so players get instant feedback on stealth status.
- Trigger reinforcements or combat when alarms peak, and localize all new prompts in English and Ukrainian.
</details>

<test>
Linger inside and outside patrol vision cones to trigger each alert phase, confirm HUD/log updates, and verify alarms escalate to reinforcements before resetting when line of sight is broken.
</test>
</step>

<step id="19.5">
<step_metadata>
  <number>19.5</number>
  <title>Surveillance Camera System (Curfew Enforcement)</title>
  <phase>Phase 6: Visual and Navigation Upgrades</phase>
</step_metadata>

<prerequisites>
- Step 19 completed (Guard perception with vision cones and alert states)
- Step 5 completed (Combat system with enemy spawning)
- Step 8 completed (Day-night cycle system functional)
</prerequisites>

<instructions>
Implement surveillance cameras that activate during nighttime curfew, creating detection zones that trigger ESD alerts and reinforcements. Cameras are dormant during daytime, making curfew violations meaningful and dangerous.
</instructions>

<details>
**Camera Sprite (Phaser Primitives)**
- Create `CameraSprite` class in `src/game/objects/CameraSprite.ts` extending `Phaser.GameObjects.Container`
- Components: Rectangle body (16x12px, 0x333333), Ellipse lens (8x6px, 0x000000), Circle LED (3px, 0xff0000), Graphics vision cone
- `setActive(active: boolean)` method: If active → LED alpha tween (1→0.3, 1s yoyo, infinite), draw 90° cone; If inactive → LED alpha 0, clear cone, angle 0
- Vision cone drawing: Arc from -45° to +45°, range = 8 tiles * 32px, blue translucent fill (0x3b82f6, 0.15 alpha)

**3 Camera Types** (`src/game/systems/surveillance/cameraTypes.ts`)
- **Static Camera**: Wall-mounted, sweeps 90° cone between 2-4 preset angles in 3s cycles, 8-tile range, activates at curfew (Evening/Night)
- **Motion Sensor**: Small box sprite, 4-tile radius circle, triggers only on movement (standing still = invisible), crouch-walk at 50% speed bypasses detection
- **Drone Camera**: Circular body + cone searchlight, follows patrol path, 90° cone, 10-tile range, searchlight only on at night (day = passive patrol)

**Curfew Activation System** (`src/game/systems/surveillance/cameraSystem.ts`)
- Subscribe to `worldSlice` Redux selector for timeOfDay changes
- On "evening" or "night": Set `camera.isActive = true`, call `camera.sprite.setActive(true)`, dispatch notification
- On "morning" or "day": Set `camera.isActive = false`, call `camera.sprite.setActive(false)`
- Display "CURFEW ACTIVE - SURVEILLANCE ENGAGED" banner at dusk (3s auto-dismiss)

**Detection & Alert System** (integrates with Step 19)
- **Detection calc**: Each frame, check player in cone (angle + distance < range) && LOS clear (raycast no walls)
- **Stealth modifier**: `effectiveRange = baseRange * (1 - stealthSkill / 200)` (Stealth 50 = -25%, 100 = -50%)
- **Crouch mode**: Press C to toggle, -50% detection range, -50% movement speed
- **States**: Idle (blue cone) → Suspicious (yellow, detectionProgress 0→100 over 3s) → Alarmed (red, 100%)
- **Yellow Alert**: Show "CAMERA DETECTING" timer, player can break LOS to reset
- **Red Alert**: Spawn 2-4 ESD guards at nearest entry point, 10-15s countdown, lock doors 30s
- **Network Alert**: 3+ cameras triggered within 60s → all patrols hostile, 2x patrol density for 5min

**Countermeasures**
- **Hacking** (Hacking ≥40, ≤3 tiles, 5 AP, 5s): Loop footage (60s invisible), Disable (permanent off), Redirect (guards go wrong way 30s)
- **Destruction**: Shoot (1 bullet, 2 AP, triggers Yellow Alert), EMP grenade (5-tile radius, 30s disable, silent), Melee (1 tile, 3 AP, loud noise)
- **Avoidance**: TAB toggles vision overlay, timing rotation gaps, use cover for LOS break, wait until dawn

**UI Components**
- `CameraDetectionHUD.tsx` (top-right): "Cameras Nearby: X", detection bar 0-100%, "TAB - Toggle Camera Vision"
- `CurfewWarning.tsx` (full-screen): "CURFEW ACTIVE" banner, "SURVEILLANCE ENGAGED" subtitle, 3s auto-dismiss, alarm sound
- Minimap: Triangle icons, color-coded (Gray=dormant, Blue=idle, Yellow=suspicious, Red=alarmed, Dark gray=disabled), pulse when rotating toward player

**Map Integration** (`src/content/cameraConfigs.ts`)
- Per-zone config: `{ zoneId, cameras: [{ type, position, sweepAngles }] }`
- **ESD zones**: Downtown checkpoints (4 cams), Gov buildings (6 cams), Corporate plazas (3-5 cams)
- **Neutral**: Commercial (1-2 cams), Industrial (2-3 cams)
- **Resistance**: Slums/safe houses/tunnels (0 cams, destroyed/looted)
- Act progression: I=1-2/zone, II=rusted/nonfunctional, III=4-6/zone high-tech

**Quest Hooks**
- **"Eyes Everywhere"**: Hack 3 terminals in ESD data center without triggering cameras → +100 XP, Stealth +10, "Ghost" perk
- **"Signal Choke"**: Hack 5 cams in 10min to create blind corridor for refugee convoy → +150 XP, NARC rep +20
- **"False Flag"**: Hack cams to upload fake ESD brutality footage (Hacking 60 + INT 7) → ESD paranoia up, internal investigations slow ops

**Performance**
- Object pool vision cone Graphics (reuse, clear() + redraw vs destroy/create)
- Only detect for cameras in player's current zone
- Batch rotation updates (max 20/frame, stagger if >20)
- Cache LOS raycast 3 frames unless player moved
</details>

<accessibility>
- TAB key toggles camera vision overlay (keyboard accessible)
- Color-coded patterns for colorblind mode (diagonal lines, dots, solid)
- Audio cues: Soft beep (camera range), louder beep + alarm (Yellow Alert), klaxon siren (Red Alert)
- Screen reader announces: "Camera facing east, detection range 8 tiles, status idle/active/alarmed"
</accessibility>

<performance>
- Use object pooling for vision cone Graphics (reuse, don't recreate each frame)
- Calculate detection only for cameras in player's current zone
- Batch camera updates per frame (max 20 cameras active simultaneously)
</performance>

<test>
Wait until nighttime and verify "CURFEW ACTIVE" notification appears with all cameras powering on (red LEDs). Walk past dormant camera during day and confirm no detection. During curfew, walk through checkpoint with 4 cameras, time movement to rotation gaps, verify no detection. Let camera detect player at night, verify Yellow Alert → 3-second timer → Red Alert → reinforcements arrive in 10-15s. Hack camera with Hacking 50, verify loop footage lasts 60 seconds. Shoot camera at night, verify Yellow Alert triggers. Trigger 3 cameras within 60 seconds, verify Network Alert activates all patrols. Crouch-walk past motion sensor, verify bypass when moving slowly. Throw EMP grenade, verify all cameras in radius go offline for 30s. Stand near camera at dawn transition, verify camera powers down mid-rotation. Press TAB and verify camera vision overlay toggles on/off. Complete "Eyes Everywhere" mission without triggering cameras during curfew, verify XP reward. Verify camera sprites render correctly using Phaser primitives (no external assets).
</test>
</step>

<step id="19.55">
<step_metadata>
  <number>19.55</number>
  <title>Adaptive NPC FSM Behaviors</title>
  <phase>Phase 6: Visual and Navigation Upgrades</phase>
</step_metadata>

<prerequisites>
- Step 5 completed (baseline combat loop and enemy turns)
- Step 19 completed (guard perception + alert states)
- Step 19.5 completed (surveillance escalation hooks)
</prerequisites>

<instructions>
Replace the brittle guard/hostile decision flow with a deterministic-yet-varied finite-state machine that layers weighted randomness and lightweight utility nudges so patrols feel reactive without incurring heavy CPU cost.
</instructions>

<details>
- **State Model**: Define `NpcAiState`, `NpcTransitionWeights`, and `NpcContext` interfaces in `src/game/ai/fsm/types.ts`, modelling canonical states (`Idle`, `Patrol`, `Chase`, `Search`, `Flee`, `Panic`, `InspectNoise`, etc.), cooldown data, and situational signals (HP, stamina, line of sight, recent hits, squad influences).
- **Controller Core**: Implement `createNpcFsmController` in `src/game/ai/fsm/controller.ts` that stores current state, applies base weights per state, applies utility modifiers (HP thresholds, LOS, morale, leader influence), zeroes transitions on cooldown, and selects the next state via weighted sampling with pluggable RNG.
- **Seeded Personalities**: Introduce a deterministic RNG helper (`src/game/ai/fsm/random.ts`) that seeds from NPC id so replays remain stable. Expose optional entropy injection for director-driven variance (Step 19.7).
- **Action Hooks**: Map each state to action callbacks (`NpcStateHandlers`) that drive existing movement/pathfinding, cover seeking, pursuit, or flee routes via injected services. Panic transitions should set flee burst duration and respect cooldown windows before the next panic roll.
- **Integration**: Thread the FSM controller through guard/patrol entity classes, reading perception data from Step 19 vision cones and Step 19.5 surveillance pings, and emitting telemetry (state transitions, utility adjustments) for debugging overlays.
- **Configuration Surface**: Provide archetype configs in `src/content/ai/guardArchetypes.ts` where designers can tune base weights, modifiers, and cooldowns. Document authoring workflow in `memory-bank/architecture.md` when implemented.
</details>

<test>
- Unit-test controller helpers: weight normalization, cooldown clamping, seed-stable transition selection, panic cooldown enforcement, and utility modifiers reacting to HP/LOS inputs.
- Write an integration test (headless scene or mocked loop) that simulates 60 seconds of patrol behavior with deterministic RNG; assert patrol cycles between Idle/Patrol with occasional Search/Panic according to configured weights.
- Script a chase scenario where LOS is lost; confirm FSM transitions to `Search`, times out to `Patrol`, and only re-enters `Panic` when cooldown expires and stimuli warrant it.
- Run performance profiling (e.g., 200 NPCs stepping through the controller) to confirm budget fits within frame targets (<0.5 ms/frame on baseline hardware) and no garbage spikes occur.
</test>
</step>

<step id="19.6">
<step_metadata>
  <number>19.6</number>
  <title>Implement Witness Memory & Regional Heat</title>
  <phase>Phase 6: Visual and Navigation Upgrades</phase>
</step_metadata>

<instructions>
Model NPC suspicion as decaying eyewitness memory that aggregates into zone heat instead of binary wanted flags.
</instructions>

<details>
- **Suspicion Module**: Stand up `src/game/systems/suspicion/` with `WitnessMemory` models, decay/reinforce helpers, and pruning thresholds (`certainty < 0.05`). Expose utilities for half-life tuned decay, reinforcement payloads, and serialization.
- **Guard Perception Hooks**: When Step 19 vision cones or Step 19.5 surveillance calls flag the player, emit `WitnessMemory` entries tagged by observer, recognition channel (`face | outfit | vehicle`), certainty score, and `lastSeenAt` game time. Reinforcement events (repeat sighting, guard briefings, poster scans) reset decay timers and boost certainty.
- **Regional Heat Aggregation**: Extend `worldSlice` (or dedicated `suspicionSlice`) with per-zone memory registries, selectors for `selectHeatByZone`, and derived alert tiers (calm, tracking, crackdown) keyed to the sum of top-K memories × proximity factors. Route heat thresholds into existing alert escalation instead of binary `isWanted`.
- **Dampeners & Disguises**: Introduce modifiers sourced from disguise items, lighting conditions, distance, and player stance so stealth actions reduce certainty ceilings; intimidation/bribery actions can mark memories as `suppressed`.
- **UI & Debugging**: Surface aggregate heat and the top suspect memories to George’s debug tab or a dev-only overlay for tuning. Provide logging hooks so designers can inspect decay rates live.
- **Persistence & Performance**: Ensure memories pause decay when `worldSlice.time.isFrozen`, cull expired entries to avoid list bloat, and persist minimal witness snapshots in save data with version guards.
</details>

<test>
- Unit test decay and reinforcement helpers with multiple half-life configurations to confirm certainty halves over time and clamps within [0,1].
- Simulate guard sightings in a headless test scene: confirm memories spawn, reinforce on repeat sightings, decay after lying low, and drop once certainty < 0.05.
- Drive region heat above configured tiers via scripted sightings and verify guard AI escalates responses, then allow time to pass and ensure heat cools naturally without manual resets.
- Toggle disguises/lighting modifiers in integration tests to confirm certainty gains shrink appropriately and suppressed memories stop contributing to heat.
</test>
</step>

<step id="19.7">
<step_metadata>
  <number>19.7</number>
  <title>Street-Tension Director</title>
  <phase>Phase 6: Visual and Navigation Upgrades</phase>
</step_metadata>

<instructions>
Introduce a pacing director that reads suspicion pressure, recent encounters, and player stress to modulate patrol density, encounter frequency, and ambient presentation.
</instructions>

<details>
- **Director State Machine**: Create `src/game/systems/director/` with a `DirectorState` (`pressure`, `respite`, `noise`, `intensityTier`) derived from witness heat (Step 19.6), alert flags, and elapsed downtime. Persist state in `worldSlice` (or a dedicated slice) and expose selectors for HUD/debug consumers.
- **Signal Inputs**: Listen for guard alerts, combat outcomes, alarm triggers, and resource telemetry (ammo/medkit thresholds) so the director detects stress spikes or recovery streaks. Provide an action for George Assistant (Step 16.9) to request respite that temporarily caps pressure gain.
- **Dials & Outputs**: Map director tiers to tunable knobs: patrol spawn cadence, roaming route variance, spontaneous street encounter probability, ambient VFX/SFX intensity, and merchant caution dialogue. Apply adjustments via existing spawners/controllers rather than bespoke logic.
- **Integration Hooks**: Update `GameController` (or the scene orchestrator) to tick the director each world step, lerp knob deltas over configurable windows, and dispatch Redux actions so UI/audio react declaratively. Author per-district profiles under `src/content/director/directorProfiles.ts`.
- **Debug & Overrides**: Add dev-only inspector controls to freeze tiers, tweak thresholds, and log transitions. Emit telemetry events so balancing sessions can review escalation/cooldown timelines.
</details>

<test>
- Unit test director reducers/helpers to confirm pressure/respite accumulation, tier transitions, and cooldown behaviour across multiple profiles.
- Script repeated alerts in a headless simulation to push the director into crackdown, then grant downtime and verify it cools back to calm while patrol density and ambient audio follow suit.
- Disable the director profile and confirm baseline spawn logic remains unchanged (regression guard).
- Trigger the George respite request and ensure the director honours the cooldown window without blocking future escalations.
</test>
</step>

<step id="19.8">
<step_metadata>
  <number>19.8</number>
  <title>Establish Atlas-Driven Noir Lighting Pipeline</title>
  <phase>Phase 6: Visual and Navigation Upgrades</phase>
</step_metadata>

<prerequisites>
- Step 17 completed (isometric renderer scaffolding in place)
- Step 18 completed (click-to-move path previews respect tile metadata)
- Step 19 completed (alert systems consume consistent entity depth sorting)
</prerequisites>

<instructions>
Replace key procedural `Graphics` primitives with atlas-driven sprites and enable Phaser Light2D + post-processing so the painterly noir art direction carries through gameplay.
</instructions>

<details>
- Stand up an art-export pipeline: define painterly diffuse + normal map pairs per district prop under `src/assets/sprites/`, create a `config/texture-atlas.noir.json` (TexturePacker or equivalent), and add `scripts/pack-noir-atlas.mjs` to emit `noir-environment.json/png` + `noir-environment-n.json/png`.
- In `BootScene`, load the new atlases via `this.load.multiatlas('noir-environment', json, path)` and a matching call for normal maps; version atlases so runtime caches can detect updates.
- Extend `MapTile`/`MapArea` data to expose an optional `spriteFrame` and `normalFrame`, and add authoring helpers under `src/content/environment/atlasFrames.ts` that map tile biome + condition → atlas frame IDs.
- Refactor `IsoObjectFactory`: keep existing `Graphics` helpers for fallback, but introduce sprite-based creators (`createSpriteTile`, `createSpriteProp`, `createSpriteCharacter`) that position atlas frames, apply `setPipeline('Light2D')`, and assign normal textures.
- Update `MainScene.drawMap` to prefer sprite frames when `spriteFrame` is defined, maintain depth sorting via `setDepth(pixelY)`, and batch static layers into `Phaser.GameObjects.Layer` or `RenderTexture` for fewer draw calls.
- Enable the Light2D system once sprite assets exist: call `this.lights.enable().setAmbientColor(0x16202a)` in `MainScene.create`, register rim, sodium, and emergency lights keyed to world triggers, and gate light creation behind a feature flag until the atlas rollout is complete.
- Add camera post FX helpers (`camera.postFX.addBloom`, `addColorMatrix`) with noir-friendly defaults, but expose tunable settings in `src/game/settings/visualSettings.ts` for QA to adjust brightness/contrast per district.
- Document asset naming (e.g., `district_propName_variant_v###.png`), normal-map conventions, and Light2D integration steps in `memory-bank/architecture.md`, linking back to the painterly noir guidance in `memory-bank/game-design.md`.
</details>

<test>
- Run `yarn pack:noir-atlas` (wrapper for `pack-noir-atlas.mjs`) and confirm atlases build without orphaned frames or duplicate keys.
- Load BootScene and verify atlases/normal maps register; inspect DevTools to ensure sprite counts drop vs. equivalent Graphics-heavy scene.
- Walk Downtown at night and confirm Light2D rim, sodium, and beacon lights affect atlas sprites while legacy Graphics fallback continues to render without artifacts.
- Toggle the bloom/color-matrix settings via the visual settings module and validate render output against style sheets (maintain readable silhouettes, avoid blown highlights).
- Profile the scene (Phaser inspector/SpectorJS) to confirm draw calls remain within target budget after Light2D activation and that normal maps respond as expected when lights move.
</test>
</step>

<step id="20">
<step_metadata>
  <number>20</number>
  <title>Redesign Downtown Grid & Building Layout</title>
  <phase>Phase 6: Visual and Navigation Upgrades</phase>
</step_metadata>

<instructions>
Rebuild Downtown into a readable NYC-inspired grid with consistent building parcels.
</instructions>

<details>
- Lay out four avenues (3 tiles wide) and four streets (2 tiles wide) to create 16 uniform blocks with clear pedestrian lanes.
- Replace legacy building footprints with rectangular parcels (one per block face) and assign a single, streetside door per structure.
- Ensure door coordinates land on walkable street tiles, keep footprints free of door tiles, and standardize block-themed naming for localization.
</details>

<test>
Inspect the generated map to verify doors sit on street tiles, no buildings overlap boulevards, and each block renders exactly one label/door pairing.
</test>
</step>

<step id="20.5">
<step_metadata>
  <number>20.5</number>
  <title>Streamable World Parcel Infrastructure</title>
  <phase>Phase 6: Visual and Navigation Upgrades</phase>
</step_metadata>

<prerequisites>
- Step 20 completed (Downtown grid standardized into predictable parcels)
- Step 18 completed (click-to-move + path previews functional)
</prerequisites>

<instructions>
Introduce an on-demand parcel streaming layer so large districts can load and unload map chunks without blowing memory. Ensure scene streaming integrates with existing world map connections, NPC schedules, and ambient triggers.
</instructions>

<details>
- Refactor `buildWorldResources` to emit parcel manifests (`ParcelDescriptor`) and defer tile/entity hydration to a new `parcelLoader` in `src/game/world/streaming/`.
- Implement `ParcelStreamManager` that tracks active parcels around the player, preloads neighbors (configurable radius), and dispatches load/unload events to scenes, Redux slices, and trigger registries. Provide hooks for manual pinning (e.g., cinematics, boss fights).
- Update pathfinding/grid systems to stitch parcel edges seamlessly—cache nav meshes per parcel, and rebuild adjacency when new chunks load. Include fallbacks when requested tiles belong to unloaded parcels (auto-request or return safe alternative).
- Thread streaming events through `GameController`/Phaser scenes so entities spawn/despawn cleanly, loot persists, and lighting/FX layers rehydrate with minimal churn.
- Extend save/load routines to serialize parcel cache metadata (loaded set, seed data) so reloads resume without full world regeneration.
- Document the streaming architecture and authoring expectations in `memory-bank/architecture.md`, covering parcel sizing guidelines and performance targets.
</details>

<test>
- Profiling pass: traverse multiple districts and confirm parcel load/unload stays under target budget (e.g., <50 ms spikes) with memory plateauing once cache warms.
- Regression: run automated walk cycles that cross parcel boundaries; verify NPCs, triggers, and signage persist correctly and no duplicates spawn.
- Save mid-transition with parcels loading; reload to ensure the active parcel set and entity states match pre-save conditions.
- Stress test by teleporting between far-flung parcels; confirm manager handles rapid swaps without leaking references or crashing.
</test>
</step>

<step id="21">
<step_metadata>
  <number>21</number>
  <title>Transition Scene Rendering to Isometric 2.5-D</title>
  <phase>Phase 6: Visual and Navigation Upgrades</phase>
</step_metadata>

<instructions>
Convert the current orthographic render routines to a reusable 2.5-D isometric pipeline.
</instructions>

<details>
- Extract `getIsoMetrics`, `calculatePixelPosition`, `getDiamondPoints`, and `adjustColor` into `src/game/utils/iso.ts` so scenes and factories share identical projection math.
- Refactor `MainScene` tile/object drawing to use the shared helpers, add an `IsoObjectFactory` for crates/doors/props, and introduce a turn-tracker HUD for combat readability.
- Align art assets to a 2:1 tile ratio, bake a consistent light direction, and verify depth sorting uses `pixelY` offsets so lower objects appear in front.
</details>

<test>
Render a representative block with floors, walls, props, and characters; confirm all assets align to the diamond grid, respect draw order, and retain correct collision hotspots.
</test>
</step>
</phase>

<phase id="7" name="Character Progression and Inventory">
<step id="22.1">
<step_metadata>
  <number>22.1</number>
  <title>Basic Character Creation Flow (UI Shell, Name, Visual Preset)</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<instructions>
Build the character creation UI shell and implement basic identity customization (name and visual preset selection).
</instructions>

<details>
- Create `CharacterCreationScreen.tsx` in `src/components/ui` that displays on new game start, replacing direct spawn.
- Implement multi-step wizard interface with navigation (Back/Next buttons, step indicators showing progress).
- **Step 1 - Identity**: Text input for character name (3-20 characters, alphanumeric validation), visual preset selection (4-6 preset avatar styles representing different backgrounds).
- Add "Randomize" button that generates random name and preset for quick start.
- Store selections in temporary React state (not Redux yet) to allow Back/Cancel without polluting game state.
- Style consistently with existing dystopian UI theme (neon accents, terminal aesthetics).
- Add "Skip Creation" debug button (development only) that applies default values for rapid testing.
</details>

<test>
Start new game and verify character creation screen appears instead of spawning immediately. Enter character name and select visual preset. Use Back button to verify state persists. Click Randomize and confirm name/preset change. Complete Step 1 and confirm navigation to next step placeholder. Verify Skip Creation button applies defaults and starts game.
</test>
</step>

<step id="22.2">
<step_metadata>
  <number>22.2</number>
  <title>Attribute Allocation System</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<prerequisites>
- Step 23 must be completed (player stats integration establishes attribute effects)
- `playerStats.ts` interfaces define attribute structure
</prerequisites>

<instructions>
Implement the attribute allocation step of character creation with point-buy system and derived stat preview.
</instructions>

<details>
- **Step 2 - Attributes**: Create attribute allocation interface displaying 6 primary attributes with descriptions.
- Attributes (each starts at 5, range 1-10): **Strength** (melee damage, carry weight), **Agility** (AP, dodge, stealth), **Endurance** (max HP, resistances), **Intelligence** (skill points per level, hacking bonus), **Perception** (aim accuracy, critical chance, trap detection), **Charisma** (dialogue options, barter prices).
- Implement point-buy system: 5 additional points to allocate (total budget: 30 base + 5 = 35 points across 6 attributes). Use +/- buttons with visual constraints (can't reduce below 1 or increase above 10).
- Display derived stats preview panel showing real-time calculations as attributes change:
  - Max HP = `50 + (endurance * 10)`
  - Base AP = `6 + floor((agility - 5) * 0.5)`
  - Carry Weight = `25 + (strength * 5)` kg
  - Crit Chance = `5 + (perception * 2)`%
- Add attribute tooltips explaining gameplay effects (e.g., "Strength 8: +15kg carry weight, +20% melee damage").
- Validate minimum viable build (warn if critical attributes like Endurance are too low).
</details>

<test>
Reach Step 2 of character creation. Verify all attributes start at 5 with 5 points remaining. Allocate points using +/- buttons and confirm counter decrements. Attempt to exceed point budget or attribute limits and verify prevention. Watch derived stats preview update in real-time. Hover over attributes to see tooltips. Try to proceed with unspent points and verify warning/prevention. Complete allocation and proceed to next step.
</test>
</step>

<step id="22.3">
<step_metadata>
  <number>22.3</number>
  <title>Background Selection with Starting Perks</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<prerequisites>
- Step 24.3 must be completed (perk system establishes perk mechanics and data structures)
- Faction reputation system defined (for background-based reputation modifiers)
</prerequisites>

<instructions>
Implement background selection with unique starting perks, equipment, and faction reputations.
</instructions>

<details>
- **Step 3 - Background**: Create background selection interface displaying 3-4 origin stories with narrative descriptions.
- Define backgrounds in `src/content/backgrounds.ts`:
  - **Ex-CorpSec Defector**: +10 Resistance reputation, -20 CorpSec reputation. Starting perk: "Tactical Training" (ranged weapons +10%). Starting equipment: pistol, kevlar vest, CorpSec badge (quest item).
  - **Street Urchin**: +10 Scavengers reputation, neutral factions. Starting perk: "Street Smarts" (stealth +15%, barter +10%). Starting equipment: knife, leather jacket, lockpicks.
  - **Underground Hacker**: +15 Resistance reputation, -10 CorpSec reputation. Starting perk: "Code Breaker" (hacking +20%). Starting equipment: hacking deck, EMP grenade, worn clothing.
  - **Wasteland Scavenger**: +10 Scavengers reputation, +5 Resistance. Starting perk: "Survivalist" (crafting costs -25%). Starting equipment: crowbar, gas mask, first aid kit.
- Display background details: narrative blurb (2-3 sentences), stat modifiers, starting perk description, faction impacts, equipment preview.
- Implement "Confirm & Start" button that commits all choices to Redux state via `initializeCharacter` action.
- Apply character creation data: spawn player at starting location, equip starting items, set faction reputations, apply background perk, update HUD.
</details>

<test>
Reach Step 3 of character creation. View all backgrounds with full descriptions and mechanical effects. Select a background and verify preview highlights starting perk and equipment. Click Confirm & Start and verify game initializes with correct character name, attributes, background perk active, starting equipment in inventory, and faction reputations set. Check character sheet to confirm all values match selections. Start new games with different backgrounds to verify unique starting conditions.
</test>
</step>

<step id="23">
<step_metadata>
  <number>23</number>
  <title>Integrate Player Stats with Combat and Dialogue Systems</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<instructions>
Integrate the existing `playerStats.ts` interfaces with combat, dialogue, and movement systems using concrete formulas for derived stats.
</instructions>

<details>
- **Leverage existing implementation**: `src/game/interfaces/playerStats.ts` already defines `PlayerAttributes` and `PlayerStats` interfaces. Build on this foundation rather than recreating.
- **Implement derived stat calculation functions** in `src/game/systems/statCalculations.ts`:
  - **Max HP** = `50 + (endurance * 10)` (e.g., Endurance 7 = 120 HP)
  - **Base AP** = `6 + floor((agility - 5) * 0.5)` (e.g., Agility 8 = 7 AP, Agility 4 = 5 AP)
  - **Carry Weight** = `25 + (strength * 5)` kg (e.g., Strength 6 = 55 kg capacity)
  - **Critical Chance** = `5 + (perception * 2)`% (e.g., Perception 7 = 19% base crit)
  - **Dialogue Threshold Bonus** = `floor(charisma / 2)` (Charisma 8 gives +4 to persuasion checks)
  - **Skill Points per Level** = `3 + floor(intelligence / 3)` (Intelligence 9 gives 6 points/level)
- **Wire attributes into combat system** (`src/game/combat`):
  - Perception modifies hit chance: `baseHitChance + (perception - 5) * 3`%
  - Agility affects dodge chance: `(agility - 5) * 2`%
  - Strength adds melee damage bonus: `floor(strength / 2)`
- **Integrate with dialogue system** (`src/game/quests/DialogueManager.ts`):
  - Check Charisma thresholds for persuasion options: `playerCharisma >= requiredCharisma + dialogueThresholdBonus`
  - Intelligence unlocks technical/analytical dialogue branches
- **Build `PlayerStatsPanel.tsx`** in `src/components/ui`:
  - Display primary attributes (STR, AGI, END, INT, PER, CHA) with current values
  - Show derived stats (HP, AP, Carry Weight, Crit %, Skill Points) with tooltips explaining formulas
  - Add attribute increase UI for level-ups (appears when attribute points available, allows selecting one attribute to increase by 1, maximum 10 per attribute)
- **Add stat recalculation triggers**: When attributes change (level-up, equipment, buffs/debuffs), dispatch Redux action to recompute all derived stats.
</details>

<accessibility>
- Ensure PlayerStatsPanel is keyboard navigable (Tab through attributes, Enter to increase on level-up)
- Add ARIA labels to stat displays: "Strength: 7, affects carry weight and melee damage"
- Use sufficient color contrast for stat values and change indicators
</accessibility>

<test>
Open the character sheet (PlayerStatsPanel) and verify all attributes and derived stats display correctly using the formulas above. Manually modify an attribute in Redux devtools and confirm derived stats recalculate immediately. Enter combat and verify Perception affects displayed hit chance, Agility provides dodge rolls, Strength adds melee damage bonus. Trigger a dialogue with a Charisma check and confirm threshold calculation uses formula. Level up and allocate an attribute point, then verify dependent stats update (increasing Agility from 6 to 7 should increase AP if crossing threshold).
</test>
</step>

<step id="23.5">
<step_metadata>
  <number>23.5</number>
  <title>Wire Equipment Stats to Combat Formulas</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<prerequisites>
- Step 23 completed (stat calculation functions exist)
- Basic inventory system exists (from earlier steps)
</prerequisites>

<instructions>
Bridge the gap between base attributes and equipment by implementing equipment stat bonuses that flow into combat calculations.
</instructions>

<details>
- **Extend item interfaces** to include stat modifiers: `strengthBonus`, `agilityBonus`, `armorRating`, `apPenalty`, etc.
- **Create equipment effect aggregation** in `src/game/systems/equipmentEffects.ts`:
  - Function `getEquippedBonuses()` iterates all equipped items and sums stat modifiers
  - Returns `EquipmentBonuses` object with aggregate values
- **Update derived stat calculations** to include equipment:
  - Effective Strength = `baseStrength + equipmentStrengthBonus`
  - Effective Carry Weight = `25 + (effectiveStrength * 5)`
  - Effective AP = `baseAP - equipmentAPPenalty` (heavy armor reduces AP)
  - Damage Reduction = `armorRating` (flat reduction before HP loss)
- **Wire into combat system**:
  - When calculating hit chance, use effective Perception (base + equipment bonuses)
  - When calculating damage dealt, apply Strength bonuses from equipped melee weapons
  - When receiving damage, subtract armor rating before applying to HP
- **Add visual feedback**: When equipment changes, briefly highlight affected stats in PlayerStatsPanel (green for increases, red for decreases).
</details>

<performance>
- Cache equipped item list in Redux selector to avoid recalculating on every render
- Only recalculate equipment bonuses when inventory changes, not on every frame
</performance>

<test>
Equip armor with +2 Strength bonus and verify carry weight increases by 10kg in character sheet. Equip heavy armor with -1 AP penalty and confirm max AP decreases. Enter combat wearing armor and verify damage reduction applies (take 10 damage attack with 3 armor rating, should lose 7 HP). Equip weapon with +3 damage and verify combat damage output increases. Unequip all items and confirm stats return to base values. Check PlayerStatsPanel shows stat changes when equipping/unequipping.
</test>
</step>

<step id="24.1">
<step_metadata>
  <number>24.1</number>
  <title>XP and Leveling Foundation</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<instructions>
Implement core XP earning and level-up system with concrete progression formula.
</instructions>

<details>
- **Create progression system** in `src/game/systems/progression.ts`:
  - Track `currentXP`, `currentLevel`, `xpToNextLevel` in Redux `playerSlice`
  - XP requirement formula: `xpRequired = 100 * level * (1 + level * 0.15)`
    - Level 2: 115 XP
    - Level 3: 345 XP (230 more)
    - Level 5: 1,150 XP
    - Level 10: 2,150 XP
- **Define XP sources** with concrete values:
  - Quest completion: 50-200 XP (scales with difficulty)
  - Enemy defeated: 10 XP (weak) to 50 XP (boss)
  - Successful skill check: 5-15 XP (first time per unique check)
  - Location discovered: 10 XP (first visit)
  - Peaceful quest resolution: +25% bonus XP
- **Implement level-up mechanics**:
  - When XP >= threshold, trigger level-up automatically
  - Award skill points: `3 + floor(intelligence / 3)` (Intelligence 6 = 5 points, Intelligence 9 = 6 points)
  - Every level up grants 1 attribute point (player chooses which attribute to increase)
  - Every 2 levels (2, 4, 6...), unlock perk selection (implemented in Step 24.3)
- **Build level-up notification UI**:
  - Full-screen modal with "LEVEL UP" banner
  - Display new level, skill points earned, attribute point availability
  - Summary of unlocked features (e.g., "New perks available!")
  - "Continue" button to dismiss and proceed to allocation screens
- **Add XP gain feedback**: Toast notification showing "+50 XP: Quest Completed", progress bar in HUD showing XP toward next level.
</details>

<error_handling>
- Prevent XP underflow (can't go negative)
- Handle edge case of earning enough XP for multiple levels at once (sequential level-ups)
- Validate level caps (if implementing max level 20, prevent exceeding)
</error_handling>

<test>
Award XP through various sources (complete quest, defeat enemy, discover location) and verify XP counter increases with toast notifications. Verify XP formula matches specification: reach 115 XP and confirm level-up to 2, reach 345 total XP and confirm level 3. Trigger level-up and verify modal appears with correct skill points awarded (test with different Intelligence values). Verify attribute points granted every level. Award 500 XP at once and confirm multiple sequential level-ups process correctly. Check XP progress bar updates in real-time.
</test>
</step>

<step id="24.2">
<step_metadata>
  <number>24.2</number>
  <title>Skill Tree System with Combat Branch</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<prerequisites>
- Step 24.1 completed (skill points awarded on level-up)
</prerequisites>

<instructions>
Build the skill allocation system with multiple skill trees, starting with the Combat branch as the primary implementation.
</instructions>

<details>
- **Define skill tree structure** in `src/content/skills.ts`:
  - Four main branches: **Combat**, **Tech**, **Survival**, **Social**
  - Each skill ranges 0-100 (starts at 0 unless tagged in character creation)
  - Skills increase in increments of 5 per point spent (1 skill point = +5 skill value)
- **Combat Branch** (implement first as reference):
  - **Small Guns** (pistols, SMGs, rifles): Affects hit chance with ballistic weapons. Formula: `baseHitChance + (skillValue * 0.5)`%. At 60 skill: +30% hit chance.
  - **Energy Weapons** (lasers, plasma): Affects hit chance and critical chance with energy weapons. Formula: `baseHitChance + (skillValue * 0.4)`%, `baseCrit + (skillValue * 0.3)`%.
  - **Melee Combat** (knives, clubs, unarmed): Affects hit chance and damage with melee weapons. Damage: `baseDamage + floor(skillValue / 10)`.
  - **Explosives** (grenades, mines): Affects throwing accuracy and blast radius. Radius: `baseRadius + floor(skillValue / 25)` tiles.
- **Stub other branches** (detailed implementation in future):
  - Tech: Hacking, Engineering, Science
  - Survival: Medicine, Stealth, Scavenging
  - Social: Persuasion, Intimidation, Barter
- **Build SkillTreePanel.tsx** in `src/components/ui`:
  - Tab interface for four branches
  - Each skill shows: name, current value (0-100), effect description, +/- buttons (spend/refund points)
  - Display available skill points remaining at top
  - Show "Tag Skill" indicator for skills tagged during character creation (Tag skills cost 1 point for +10 instead of +5)
- **Integrate skills into combat**:
  - When calculating hit chance, check equipped weapon type and apply relevant skill bonus
  - When dealing damage with melee, add skill-based damage bonus
  - When throwing grenade, use Explosives skill to determine accuracy and radius
- **Wire skills into dialogue/world systems**:
  - Dialogue options can check skill thresholds (e.g., [Hacking 50] hack the terminal)
  - World interactions check skills (locked door requires Lockpicking skill check)
</details>

<accessibility>
- Skill tree tabs keyboard navigable (Arrow keys to switch tabs, Tab to navigate skills within branch)
- Screen reader announces skill value changes: "Small Guns increased to 45, hit chance bonus now +22.5%"
</accessibility>

<test>
Level up and receive skill points. Open SkillTreePanel and verify all branches appear with skills listed. Spend points on Small Guns and confirm skill value increases by 5 per point. Enter combat with pistol and verify hit chance calculation includes Small Guns skill bonus (skill 40 should give +20% hit chance). Spend points on Melee Combat and verify melee attacks deal increased damage according to formula. Spend points on Explosives and throw grenade, confirm blast radius increases at thresholds (25, 50, 75 skill). Attempt to spend more points than available and verify prevention. Test tag skill bonus (tagged skills increase by 10 per point instead of 5). Refund a skill point and verify it returns to pool.
</test>
</step>

<step id="24.3">
<step_metadata>
  <number>24.3</number>
  <title>Perk Selection System with Capstone Perks</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<prerequisites>
- Step 24.2 completed (skill tree system defines skill values for prerequisites)
</prerequisites>

<instructions>
Implement the perk selection system allowing players to choose powerful abilities every 2 levels, including capstone perks for specialized builds.
</instructions>

<details>
- **Define perk system** in `src/content/perks.ts`:
  - Perks unlock every 2 levels (2, 4, 6, 8...)
  - Each perk has: name, description, prerequisites (level, skill requirements, attribute requirements), effects (stat modifiers, special abilities)
  - Player chooses 1 perk per unlock (permanent choice, cannot respec)
- **Create perk categories**:
  - **Combat Perks**: Improve fighting capabilities
  - **Utility Perks**: Quality of life improvements
  - **Dialogue Perks**: Social interaction bonuses
  - **Capstone Perks**: Require level 12+ and skill 75+ in one tree
- **Example perks (implement these 8-10 as foundation)**:
  - **Steady Hands** (Level 2, Perception 5): +10% hit chance with all ranged weapons
  - **Toughness** (Level 2, Endurance 6): +3 damage resistance
  - **Quick Draw** (Level 4, Agility 6, Small Guns 40): Equipping weapons costs 0 AP
  - **Adrenaline Rush** (Level 4, Endurance 5): When below 30% HP, gain +2 AP for 3 turns
  - **Silent Runner** (Level 6, Agility 7, Stealth 50): Running doesn't reduce stealth
  - **Gun Fu** (Level 12, Agility 8, Small Guns 75): **CAPSTONE** - First shot each turn costs 0 AP
  - **Ghost** (Level 12, Agility 8, Stealth 75): **CAPSTONE** - Become invisible for 2 turns when entering stealth (once per combat)
  - **Executioner** (Level 12, Perception 8, Energy Weapons 75): **CAPSTONE** - Attacks against enemies below 25% HP automatically critical hit
- **Build PerkSelectionPanel.tsx**:
  - Triggered automatically when reaching perk unlock level
  - Display available perks (gray out those not meeting prerequisites)
  - Show detailed perk effects and requirements
  - Highlight capstone perks with special visual treatment (gold border, "CAPSTONE" label)
  - Confirm selection (irreversible choice)
- **Implement perk effects**:
  - Store active perks in Redux `playerSlice.perks[]`
  - Combat system checks active perks when calculating hit chance, damage, AP costs
  - Movement system checks perks like Silent Runner
  - Add perk-specific logic for triggered abilities (Adrenaline Rush activates when HP threshold crossed)
- **Add perk display in character sheet**: List all acquired perks with icons and descriptions.
</details>

<accessibility>
- Perk selection modal keyboard navigable (Arrow keys to browse perks, Enter to select)
- Clear visual distinction for available vs locked perks
- Screen reader describes perk effects and prerequisites clearly
</accessibility>

<test>
Reach level 2 and verify perk selection modal appears automatically. View available perks and confirm prerequisite validation (perks requiring Perception 6 should be locked if player has Perception 5). Select "Steady Hands" perk and confirm it applies to character. Enter combat and verify +10% hit chance bonus from perk. Reach level 4 and select "Quick Draw", then verify weapon switching costs 0 AP. Reach level 12 with Small Guns 75 and verify "Gun Fu" capstone perk becomes available. Select Gun Fu and confirm first shot each turn costs 0 AP in combat. Get below 30% HP with "Adrenaline Rush" perk and verify +2 AP buff activates. Check character sheet displays all acquired perks correctly.
</test>
</step>

<step id="24.4">
<step_metadata>
  <number>24.4</number>
  <title>Rumor Cabinet Intel Perk Branch</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<prerequisites>
- Step 24.3 completed (perk selection infrastructure)
- Step 19.6 completed (witness memory & regional heat supplies telemetry)
</prerequisites>

<instructions>
Add an Intel-focused perk branch—“Rumor Cabinet”—that lets players reshape rumor spread, witness decay, and information control through specialized perks.
</instructions>

<details>
- **Content Definitions**: Extend `src/content/perks.ts` with a new `intel` (or `rumorCabinet`) category containing at least five perks: Whistle-Friendly, Folk Hero, Shadow Broker, Panic Whisper, and False Lead. Each defines level/attribute/skill prerequisites (e.g., high Speech, Stealth, or Intelligence), effect payloads, and mutually exclusive choices where appropriate.
- **Effect Plumbing**: Update the perk evaluation layer (`src/game/systems/perks/` or equivalent) to expose hooks consumed by the rumor/suspicion systems—e.g., modifiers for rumor TTL/decay, share fan-out, confidence multipliers, and access to “plant rumor” social actions at bars/markets. Ensure effects stack predictably with existing modifiers from disguises or faction standing.
- **Redux & Selectors**: Add derived selectors (`selectRumorPerkModifiers`) that aggregate active Intel perks and feed them into gossip propagation (Step 29.6) and witness decay (Step 19.6). Persist any new perk runtime state (e.g., Shadow Broker cooldowns) in `playerSlice`.
- **UI/UX Updates**: Update `PerkSelectionPanel.tsx` to surface the Intel category with bespoke iconography and copy referencing the Thought Cabinet inspiration. Include tooltips that explain how each perk manipulates rumor mechanics and call out any faction biases (e.g., Folk Hero stronger in worker districts).
- **New Actions**: Unlock contextual “plant rumor”/“suppress rumor” interactions in applicable social hubs (bars, markets, safehouses) once Shadow Broker (or similar) is learned. Stub dialogue hooks so Step 16.9 George prompts reflect available Intel maneuvers.
- **Documentation**: Note the new perk branch and data flow in `memory-bank/game-design.md` (Rumor systems) and `memory-bank/architecture.md` (perks-to-gossip integration) during implementation.
</details>

<test>
- Unit test perk modifiers to ensure Intel perks adjust rumor TTL, decay, and spread multipliers according to spec and clamp within safe bounds.
- Integration test gossip propagation with and without Intel perks: confirm Whistle-Friendly speeds rumor spread for player-sourced tips, while Folk Hero biases positive rumors in worker districts and dampens elite neighborhoods.
- Verify Shadow Broker unlocks the “plant rumor” interaction in bar dialogue once prerequisites are met and enforces any cooldowns.
- Run regression on non-Intel perks to confirm existing combat/utility perks still evaluate correctly and UI category navigation remains accessible.
</test>
</step>

<step id="24.5">
<step_metadata>
  <number>24.5</number>
  <title>Stamina System - Core Resource Pool (MVP)</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<prerequisites>
- Step 24.2 completed (skill tree system with derived stats)
- Step 23 completed (S.P.E.C.I.A.L attributes defined)
</prerequisites>

<instructions>
Add stamina as a third core resource (alongside Health and AP) that governs physical exertion, with basic costs, regeneration, and exhaustion penalties.
</instructions>

<details>
**Core Stamina Mechanics:**
- Add `stamina`, `maxStamina`, `isExhausted` to `Player` in `src/game/interfaces/types.ts` alongside helpers for updating them.
- Base calculation: `maxStamina = 50 + (attributes.endurance * 5)`.
- Passive regeneration: +3 stamina per overworld tick when the player is idle or walking; no automatic regen during combat turns.
- Recovery actions: using a rest interaction, sleeping in a safehouse bed, or consuming stamina-restoring items immediately restores a configured amount (rest restores to full).
- Exhaustion threshold: stamina < 30% of max triggers `isExhausted = true`; clear the flag automatically once stamina climbs back above 40%.

**Stamina Usage (Out of Combat):**
- Sprinting or dashing on the overworld grid consumes 2 stamina per tile; normal walking is free.
- Climbing, vaulting, or forcing locked doors consumes 6 stamina.
- Carrying weight above 80% of capacity drains 1 stamina per tile while moving until weight returns to safe limits.
- Lockpicking, hacking, or crafting multiple attempts in a row costs 1 stamina after the first attempt to model sustained effort.
- Stamina remains fixed while combat is active; all combat actions are AP-only and do not consume or restore stamina.

**Exhaustion Penalties (when `isExhausted = true`):**
- Reduce overworld movement speed by 25% and disable sprinting/climbing interactions.
- Dialogue and exploration skill checks suffer a -10% success penalty until stamina recovers above the threshold.
- Strenuous interactions (lockpick, hack, craft) cost an additional 1 stamina while fatigued and can fail outright if stamina drops to 0.

**Level-Up Integration:**
- Restore stamina to full when the player levels up (extend `addExperience` reducer).
- Update `LevelUpPointAllocationPanel` to show the projected stamina increase when hovering or assigning Endurance points (+5 max stamina per point).

**Systems Integration:**
- Extend overworld movement handlers (e.g., `src/game/world/worldMovementSystem.ts`) to call `consumeStamina` when sprinting or moving while encumbered.
- Update interaction reducers (`attemptLockpick`, `attemptHack`, `performClimb`) to spend stamina and block the action when not enough remains.
- Provide an `endOfTurnOutOfCombat` hook that triggers passive regeneration when the player is idle.
- When combat starts, freeze stamina consumption/regeneration until the encounter ends to keep the resource strictly tied to exploration pacing.

**UI Components:**
- Add a stamina bar to `PlayerSummaryPanel` using the green palette (#22c55e) and display a "Fatigued" icon when exhausted.
- Surface stamina costs in exploration tooltips (sprint, climb, lockpick) and in any contextual action modals.
- Show rest prompts (camp, safehouse bed) with the stamina amount they restore.
- Update `LevelUpPointAllocationPanel` previews to reflect stamina changes from Endurance investments.

**Redux State (`playerSlice.ts`):**
- New fields: `stamina: number`, `maxStamina: number`, `isExhausted: boolean`.
- New reducers:
  - `consumeStamina(state, action: PayloadAction<number>)` guarded to prevent negative values.
  - `regenerateStamina(state, action: PayloadAction<number | undefined>)` with a default of `STAMINA_REGEN_OUT_OF_COMBAT` and a cap at `maxStamina`.
  - `updateMaxStamina(state)` invoked whenever Endurance changes or derived stats recompute.
- Modified reducers: `addExperience` (full restore on level-up) and exploration interactions (`attemptLockpick`, `sprint`, etc.) to call the new helpers.

**Content Files:**
- Create `src/game/systems/stamina.ts` with shared constants and helpers:
  ```typescript
  export const STAMINA_COSTS = {
    sprintTile: 2,
    climbObstacle: 6,
    strenuousInteraction: 1, // lockpick/hack attempts after the first
  };

  export const STAMINA_REGEN_OUT_OF_COMBAT = 3;
  export const EXHAUSTION_THRESHOLD = 0.3;
  export const EXHAUSTION_RECOVERY = 0.4;
  ```
- Reference the module from reducers, movement systems, and UI components to avoid duplicated literals.

**Derived Stats Update:**
- Adjust `calculateDerivedStats` in `src/game/systems/statCalculations.ts`:
  ```typescript
  maxStamina: 50 + (attributes.endurance * 5),
  ```

**Locale Strings:**
- Add to `content/ui/index.ts` (en/uk):
  - "Stamina"
  - "Fatigued"
  - Tooltip: "Not enough stamina"
  - Exploration prompt: "You are too tired to sprint"
  - Interaction warning: "Fatigue makes this harder"
</details>

<test>
**Unit Tests:**
- `playerSlice.test.ts`:
  - Endurance 5 produces `maxStamina` 75 (50 + 25).
  - `consumeStamina(10)` lowers stamina by 10 and never below 0.
  - `regenerateStamina()` raises stamina by default 3 and caps at `maxStamina`.
  - Exhaustion toggles to true below 30% and clears once stamina exceeds 40%.
  - Level-up path fully restores stamina.

- `worldMovementSystem.test.ts`:
  - Sprinting consumes 2 stamina per tile; walking leaves stamina unchanged.
  - Moving while encumbered drains an extra point per tile until load is reduced.
  - Attempting to sprint without enough stamina surfaces a blocking error and keeps position unchanged.

- `interactionReducers.test.ts`:
  - Lockpick attempts beyond the first spend stamina; lack of stamina blocks the attempt with a tooltip message.
  - Climb interaction enforces the 6 stamina cost and fails gracefully when fatigued.

- `statCalculations.test.ts`:
  - Derived stats include the correct stamina formula and respond to Endurance changes.

**Integration Tests:**
- Create player with Endurance 8 → `maxStamina = 90`.
- Sprint 10 tiles → stamina drops by 20 → confirm 70 remaining.
- Carry weight above 80% capacity and move 5 tiles → verify additional 5 stamina drain.
- Trigger exhaustion (<30%), start a combat encounter, and confirm stamina neither regenerates nor decreases while the fight is active.
- Rest at a safehouse → stamina returns to full and exhaustion clears.
- Allocate +1 Endurance during level-up → preview displays `+5 max stamina` and state updates accordingly.

**Visual Tests:**
- Overworld HUD shows the green stamina bar beneath health and AP bars.
- Stamina bar shifts to yellow and displays the "Fatigued" icon when below 30%.
- Sprint button tooltip updates to "Not enough stamina" when attempting to sprint while fatigued.
- Rest interaction panel communicates the stamina restored and animates the bar back to max.

**Gameplay Balance:**
- Typical patrol loop (travel → stealth infiltration → post-combat regroup) spends ~40 stamina from movement and interactions, nudging rest stops every 2-3 missions while combat itself leaves stamina untouched.
- High Endurance build (Endurance 10) reaches `maxStamina 100`, enabling longer sprint chains and easier encumbrance management.
- Low Endurance build (Endurance 3) caps at 65 stamina, making rest and inventory discipline essential.
- Passive regen while idle keeps walking routes comfortable without forcing constant rest micromanagement.

yarn build && yarn test
</test>
</step>

<step id="25">
<step_metadata>
  <number>25</number>
  <title>Expand Inventory System with Equipment and Durability</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<substeps>
  <step id="25.1">
    <title>Inventory Data & Slot Framework</title>
    <summary>
      Reshape item definitions and player state to support durability, stacking, hotbar assignments, and expanded equipment slots. Lay the groundwork for encumbrance tracking.
    </summary>
    <details>
      - Extend `Item`/`Weapon`/`Armor` interfaces with durability metadata, stackable fields, and explicit `equipSlot` values.
      - Update `Player` inventory/equipment structures to cover primary/secondary/melee weapons, body armor, helmets, accessories, and a 5-slot hotbar.
      - Add encumbrance tracking fields (`level`, `percentage`) and helper utilities to compute them from weight totals.
      - Normalize existing content (starter items/background equipment) to the new schema and ensure persistence handles missing fields from older saves.
    </details>
    <test>
      Verify TypeScript compiles with no structural errors and that a new game session boots with the expanded default state (inventory hotbar present, encumbrance defaults to normal).
    </test>
  </step>

  <step id="25.2">
    <title>Durability & Encumbrance Mechanics</title>
    <summary>
      Wire gameplay logic for durability degradation, repairs, stacking, and encumbrance penalties across reducers, combat, and movement systems.
    </summary>
    <details>
      - Implement reducer helpers (`equipItem`, `unequipItem`, `repairItem`, `splitStack`, `assignHotbarSlot`) with validation.
      - Apply durability decay on attacks/hits and adjust effectiveness at 50%/25% thresholds; gate unusable items at 0 durability.
      - Apply encumbrance penalties (AP cost multipliers, movement restrictions) based on weight ratios and integrate warnings into state.
      - Surface durability warnings in the HUD/loadout panels so players see critical condition states without opening logs.
      - Ensure XP/combat logging reflects durability changes and over-capacity prevention.
    </details>
    <test>
      Unit tests cover reducer flows (stacking, repairs, encumbrance updates) and combat/movement integration for durability penalties and encumbrance lockout.
    </test>
  </step>

  <step id="25.3">
    <title>Inventory & Loadout UI Overhaul</title>
    <summary>
      Rebuild the inventory experience around slot grids, filters, durability indicators, and hotbar controls.
    </summary>
    <details>
      - Update `PlayerInventoryPanel` with filter tabs, sorting, durability color bars, and encumbrance readouts.
      - Create equipment slot grid (drag/click to equip/unequip) covering all slot types; surface stacking counts and durability warnings.
      - Add hotbar assignment UI and quick repair/use actions; show repair cost prompts.
      - Ensure accessibility (keyboard navigation, screen reader labels for durability/encumbrance warnings).
    </details>
    <test>
      Cypress/Jest integration tests simulate equipping, stacking, and hotbar assignment; visual regression to confirm durability bars and encumbrance banner updates.
    </test>
  </step>

  <step id="25.4">
    <title>Content & Systems Validation</title>
    <summary>
      Populate the item catalog with durability/stack metadata, update combat balancing, and validate the full flow end-to-end.
    </summary>
    <details>
      - Update content files (`items`, background gear) with slot/durability/stacking data and introduce a baseline repair kit.
      - Adjust combat math to respect durability effectiveness multipliers and hotbar quick use.
      - Produce migration script for existing save data to backfill durability and encumbrance fields.
      - Expand documentation (architecture, progress) to capture the new inventory architecture and usage.
    </details>
    <test>
      Manual QA scenario covering equip → degrade → repair, over-encumbrance → drop items, and hotbar usage during combat; automated regression for persistence migration.
    </test>
  </step>
</substeps>

</step>

<step id="25.5">
<step_metadata>
  <number>25.5</number>
  <title>Integrate Equipment Effects with Combat and Movement</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<prerequisites>
- Step 25 completed (equipment slots and durability system exist)
- Step 23.5 completed (equipment stat aggregation functions exist)
</prerequisites>

<instructions>
Wire equipment durability, weight penalties, and special properties into combat and movement systems for complete integration.
</instructions>

<details>
- **Connect durability to combat effectiveness**:
  - Before calculating weapon damage in combat, check weapon durability percentage
  - Apply effectiveness multiplier: `effectiveDamage = baseDamage * (durabilityPercent / 100) * durabilityModifier`
  - durabilityModifier: 1.0 at 100-51%, 0.9 at 50-26%, 0.75 at 25-1%, 0.0 at 0%
  - For armor, apply similar logic to damage reduction: `effectiveDR = armorRating * durabilityModifier`
- **Integrate encumbrance into movement**:
  - Update `GameController` movement logic to check encumbrance level before allowing movement
  - At 80-100% capacity: display yellow weight indicator, apply -1 AP from Step 23.5 calculations
  - At 100-120%: display orange indicator, halve movement speed (2 AP per tile instead of 1)
  - Above 120%: prevent movement entirely, show "Overencumbered! Drop items to move" message
- **Apply equipment-specific movement penalties**:
  - Heavy armor: -1 AP (defined in item stats, applied via Step 23.5 aggregation)
  - Medium armor: -0.5 AP penalty (round down)
  - Light armor: no penalty
  - Two-handed weapons: cannot use secondary weapon slot
- **Wire special weapon properties into combat**:
  - Silenced weapons: don't alert nearby enemies when used
  - Energy weapons: ignore partial armor, deal full damage vs shields
  - Armor-piercing rounds: reduce target armor rating by 50%
  - Hollow-point rounds: +25% damage vs unarmored, -50% vs armor
- **Add equipment condition warnings**:
  - When weapon drops below 25% durability during combat, show warning toast: "Weapon condition critical!"
  - When armor breaks (0% durability) during combat, show alert: "Armor destroyed! No protection!"
  - Update HUD to show equipped weapon/armor durability bars during combat
- **Implement automatic durability loss**:
  - After each attack with equipped weapon, reduce durability by 1
  - After taking damage with equipped armor, reduce armor durability by 1
  - Dispatch Redux action to trigger UI updates
</details>

<performance>
- Cache equipment effectiveness calculations per turn, not per frame
- Only recalculate when equipment changes or durability updates
</performance>

<test>
Equip weapon at 100% durability and note damage output. Use weapon until durability drops to 50%, verify damage decreases by ~10%. Continue use to 25% durability and verify ~25% damage reduction. Break weapon and confirm 0 damage / unusable. Equip armor and take damage repeatedly, verify armor durability decreases. When armor breaks, verify next hit deals full damage to HP. Fill inventory to 85% capacity and verify movement costs +1 AP per tile. Add more weight to exceed 100% and verify movement requires 2 AP per tile. Exceed 120% and verify movement blocked completely. Equip heavy armor and verify AP penalty stacks with encumbrance. Use silenced weapon in combat and verify nearby enemies don't alert. Use armor-piercing rounds against armored enemy and verify increased damage.
</test>
</step>

<step id="26">
<step_metadata>
  <number>26</number>
  <title>Advanced Combat Foundations</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<prerequisites>
- Step 25.5 completed (equipment effects integrated with combat)
</prerequisites>

<instructions>
Refactor combat state and systems to support directional cover, queued reactions, and facing-aware calculations needed for Steps 26.1–26.3.
</instructions>

<details>
**Data Model Updates:**
- Extend `Player` and `Enemy` combat state with `facing`, `coverOrientation`, and `suppression` fields.
- Annotate `MapArea` tiles with directional cover metadata (`tileCover` map noting half/full cover per compass direction).
- Introduce a shared `ReactionQueue` structure in `src/game/combat/reactions.ts` for pending overwatch or delayed actions.

**Engine Changes:**
- Update `combatSystem.ts` to compute mitigation using attacker vs. defender facing and tile cover orientation.
- Ensure `determineEnemyMove` (and any player-facing move helpers) track and update entity facing whenever positions change.
- Add scaffolding to enqueue and resolve reaction actions without yet implementing overwatch logic.

**Grid & Scene Integration:**
- Propagate cover metadata through `grid.ts` / pathfinding helpers so movement previews can surface directional cover.
- In `MainScene` combat overlays, render indicators that show the defender’s cover direction relative to the attacker.

**Persistence & State:**
- Migrate Redux slices / save data to include the new combat fields with backward-compatible defaults.
- Provide selectors/utilities for reading facing/cover state so upcoming features can consume them cleanly.

**Developer Tooling:**
- Add debug logging or overlay toggles to visualize cover vectors, facings, and reaction queue contents during playtests.

</details>

<test>
- Unit: Verify cover orientation math and reaction queue enqueue/dequeue behavior in `combatSystem` and `reactions` tests.
- Integration: Simulate a combat round on a mocked map and assert defenders receive different mitigation when hit from front vs. flank.
- Manual: Use a debug build to step through tiles with varying cover directions, rotate attacker facings, and confirm UI indicators and damage adjustments respond accordingly.
</test>
</step>

<step id="26.1">
<step_metadata>
  <number>26.1</number>
  <title>Directional Cover and Flanking Mechanics</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<prerequisites>
- Step 26 completed (advanced combat foundations in place)
- Step 25.5 completed (equipment effects integrated with combat)
</prerequisites>

<step id="26.1">
<step_metadata>
  <number>26.1</number>
  <title>Directional Cover and Flanking Mechanics</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<instructions>
Upgrade the basic cover system to directional cover with flanking mechanics that reward tactical positioning.
</instructions>

<details>
- **Convert cover to directional system** in `src/game/combat/coverSystem.ts`:
  - Each cover tile has a `facing` direction (north, south, east, west, or omnidirectional for full cover)
  - Cover only protects from attacks coming from the covered direction ±45° arc
  - Full cover (crates, pillars) provides 360° protection
- **Implement flanking calculation**:
  - Function `isFlanking(attackerPos, defenderPos, coverFacing)` returns boolean
  - Flanking occurs when: (1) attacker is outside defender's cover arc, OR (2) attacker is adjacent to defender
  - Calculate angle between attacker-to-defender vector and cover facing direction
  - If angle > 90°, attacker is flanking
- **Update hit chance formula** to include flanking bonus:
  - Normal attack vs cover: `hitChance = baseHitChance * 0.5` (50% cover penalty)
  - Flanking attack vs cover: `hitChance = baseHitChance * 1.2` (120%, negates cover + bonus)
  - Flanking attack without cover: `hitChance = baseHitChance * 1.2` (120%, pure flanking bonus)
- **Add cover direction indicators** in `MainScene`:
  - Render directional arrows on cover tiles showing protection direction
  - Highlight cover tiles in different colors during combat:
    - Green: provides protection from selected enemy
    - Yellow: partial cover from selected enemy
    - Red: exposed to selected enemy (flanked position)
- **Implement tactical AI improvements**:
  - Enemy AI prioritizes flanking positions when calculating moves
  - If player is behind cover, enemies attempt to move to flanking angles
  - If flanking not possible, enemies seek their own cover
- **Add flanking feedback to UI**:
  - When targeting enemy, show "FLANKED" indicator if positioned correctly
  - Display +20% hit chance bonus in combat UI
  - Show warning to player if AI is flanking them: "Flanked! Cover ineffective!"
</details>

<test>
Enter combat and position player behind directional cover (e.g., low wall facing north). Verify cover indicator shows protection direction. Attack enemy from behind cover facing them and verify cover provides 50% hit penalty reduction. Move enemy to side of cover (flanking position) and attack, verify cover doesn't apply and hit chance shows +20% bonus. Position player to flank enemy behind cover and verify "FLANKED" indicator appears with +20% bonus. Use full cover (crate) and verify it provides 360° protection regardless of attacker position. Watch enemy AI seek flanking positions when player is behind cover. Verify UI highlights cover tiles green/yellow/red based on selected enemy's position.
</test>
</step>

<step id="26.2">
<step_metadata>
  <number>26.2</number>
  <title>Overwatch Mode and Targeted Shots</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<instructions>
Add overwatch mode for reaction shots and targeted shot system for precise tactical choices.
</instructions>

<details>
- **Implement Overwatch Mode** in `src/game/combat/overwatchSystem.ts`:
  - New combat action: "Enter Overwatch" - costs 0 AP but requires 2+ AP remaining
  - Reserves remaining AP for reaction shots during enemy turns
  - When enemy moves within line of sight and weapon range: automatically trigger attack
  - Each reaction shot costs normal AP (2 AP for rifle, 1 AP for pistol)
  - Overwatch ends when: AP depleted, turn ends, or player cancels
  - Visual indicator: character sprite shows "OVERWATCH" badge, cone of fire displayed
- **Add overwatch UI**:
  - New combat button: "Overwatch Mode" (hotkey: O)
  - Shows reserved AP count and potential targets in range
  - Red cone overlay showing covered area during overwatch
  - Toast notification: "Overwatch triggered! Engaging enemy"
- **Implement Targeted Shots** in `src/game/combat/targetedShots.ts`:
  - New targeting interface: right-click enemy to open body part selector
  - Four body parts: Head, Torso, Arms, Legs
  - Each part has: hit chance modifier, AP cost modifier, special effect
  - **Head**: -30% hit chance, +3 AP cost, 2x critical chance, max damage on crit
  - **Torso**: normal hit chance, normal AP cost, no special effect (standard shot)
  - **Arms**: -10% hit chance, +1 AP cost, 25% chance to disarm (enemy drops weapon, loses 1 turn picking up)
  - **Legs**: -15% hit chance, +1 AP cost, reduces target movement by 50% for 2 turns (crippled)
- **Display targeted shot UI**:
  - Body part diagram overlay when right-clicking enemy
  - Show: hit chance %, AP cost, special effect description
  - Highlight available body parts (gray out if insufficient AP)
  - Confirm selection to execute targeted shot
- **Add skill requirements**:
  - Targeted shots require minimum weapon skill (Small Guns 25, Energy Weapons 30, etc.)
  - Below threshold: targeted shots unavailable, only torso shots possible
  - Display skill requirement warning if player attempts targeted shot without skill
- **Wire into combat log**: "You shoot Raider in the leg for 8 damage! Raider's movement crippled."
</details>

<accessibility>
- Overwatch mode keyboard accessible (O key to toggle)
- Targeted shot body part selector keyboard navigable (Arrow keys + Enter)
- Screen reader announces reaction shots: "Overwatch reaction shot! Targeting enemy"
</accessibility>

<test>
Enter combat with 6 AP. Activate overwatch mode and verify 6 AP reserved, character shows OVERWATCH indicator. Move enemy within line of sight during enemy turn and verify automatic reaction shot fires. Confirm AP depletes with each reaction shot until exhausted. Right-click enemy and verify body part selector appears. Attempt head shot and verify -30% hit chance, +3 AP cost displayed. Execute head shot and verify increased critical chance. Shoot enemy in leg and verify movement speed reduced by 50% for 2 turns (enemy moves half as far). Shoot enemy in arm and verify 25% disarm chance, if triggered enemy drops weapon and loses turn. Attempt targeted shot with low weapon skill (<25) and verify prevention with skill requirement warning. Cancel overwatch mode and verify AP returns for manual use.
</test>
</step>

<step id="26.3">
<step_metadata>
  <number>26.3</number>
  <title>Area-of-Effect Attacks and Combat Consumables</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<instructions>
Add AoE explosion system and combat consumable mechanics for tactical variety.
</instructions>

<details>
- **Implement AoE Explosion System** in `src/game/combat/aoeSystem.ts`:
  - Grenades/explosives affect all units within blast radius (3-tile radius default)
  - Damage calculation: `damage = baseDamage * (1 - distance / radius)` (center takes full damage, edge takes partial)
  - Include friendly fire: player grenades can damage player, enemy grenades can damage enemies
  - Cover provides damage reduction: 50% reduction if behind cover from explosion center
  - Walls block explosions (no damage through walls)
- **Add grenade throwing mechanics**:
  - Throwing action: select grenade from inventory, click target tile
  - Show blast radius preview (red circle) before throwing
  - AP cost: 3 AP to throw
  - Accuracy based on Explosives skill: `hitTile = targetTile + randomOffset(inversely proportional to skill)`
  - Low skill can cause misthrows landing off-target
- **Define grenade types** in item database:
  - **Frag Grenade**: 3-tile radius, 20-30 damage, no special effects
  - **Molotov Cocktail**: 2-tile radius, 10-15 damage + 5 damage/turn for 3 turns (fire DoT), creates fire terrain
  - **Smoke Grenade**: 4-tile radius, no damage, creates obscuring smoke for 3 turns (blocks line of sight, +50% miss chance through smoke)
  - **EMP Grenade**: 3-tile radius, 5 damage, disables electronic enemies for 2 turns, disrupts energy weapons
  - **Flashbang**: 3-tile radius, 2 damage, stuns all units for 1 turn (lose next turn)
- **Implement Combat Consumables**:
  - **Medkit** (hotkey or inventory use): 4 AP, heals 30 HP instantly, can use in combat
  - **Stim Pack** (combat drug): 2 AP, +2 AP for next 2 turns, then -1 AP for 1 turn (withdrawal)
  - **Combat Drug "Fury"**: 3 AP, +20% damage, -10% accuracy for 3 turns, addiction risk
  - **Antidote**: 2 AP, removes poison/status effects immediately
  - **Adrenaline Shot**: 3 AP, instantly recover 3 AP (can exceed max AP for 1 turn), then -2 AP next turn
- **Wire consumables into combat UI**:
  - Hotbar slots 1-5 at bottom of combat screen
  - Drag consumables from inventory to hotbar for quick access
  - Press number key to use assigned consumable
  - Show AP cost and cooldown timers
- **Update enemy AI**:
  - Enemies throw grenades at clustered players (2+ units in 3-tile radius)
  - Enemies use medkits when below 30% HP
  - Enemies throw smoke grenades when retreating
</details>

<error_handling>
- Prevent grenade throws outside valid range (8 tiles)
- Validate consumable use (can't use medkit at full HP)
- Handle edge cases: grenade lands in wall (explodes at last valid tile)
</error_handling>

<test>
Equip frag grenade and throw at clustered enemies (2+ units within 3 tiles). Verify blast radius preview shows before throwing. Confirm all units in radius take damage scaled by distance. Position player behind cover from explosion center and verify 50% damage reduction. Throw grenade near wall and verify explosion doesn't penetrate. Use low Explosives skill and verify grenade lands off-target sometimes. Throw smoke grenade and verify obscuring smoke blocks line of sight for 3 turns. Throw EMP grenade at robot and verify 2-turn disable. Use medkit mid-combat and verify 30 HP heal with 4 AP cost. Use stim pack and verify +2 AP for 2 turns, then -1 AP withdrawal. Assign consumables to hotbar and use number keys to quick-use. Watch enemy AI throw grenade at clustered players and use medkit when injured.
</test>
</step>

<step id="29">
<step_metadata>
  <number>29</number>
  <title>Implement Faction Reputation System with Three Core Factions</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<instructions>
Build a concrete faction reputation system with three defined factions (Resistance, CorpSec, Scavengers) and numerical thresholds that drive gameplay consequences.
</instructions>

<details>
- **Define three core factions** in `src/game/systems/factions.ts`:
  - **The Resistance**: Anti-regime freedom fighters operating from hidden cells. Offer stealth gear, hacking tools, intelligence on CorpSec movements. Allied with player by default (starts neutral-positive).
  - **CorpSec (Corporate Security)**: Regime enforcement arm. Control checkpoints, patrol Downtown, enforce curfew. Hostile to Resistance. Offer heavy weapons, armor, credits for turning in dissidents.
  - **Scavengers**: Opportunistic survivors controlling black markets in Slums. Neutral third party. Offer rare items, vehicle parts, crafting materials at varying prices based on reputation.
- **Implement numerical reputation scale** (-100 to +100 per faction):
  - **Reputation thresholds and effects**:
    - **<-60 (Hostile)**: Faction attacks on sight, sends hit squads, blocks access to faction areas. NPCs refuse dialogue.
    - **-60 to -20 (Unfriendly)**: Faction suspicious, prices +50%, no quests offered, guards follow player. Some dialogue locked.
    - **-19 to +19 (Neutral)**: Standard interactions, normal prices, basic quests available.
    - **+20 to +59 (Friendly)**: Discounts (-25%), access to restricted areas, faction backup in nearby combat, special quests unlocked.
    - **+60 to +100 (Allied)**: Best equipment available, faction safe houses accessible, leadership/influence quests, faction will aid in final mission.
- **Define reputation-changing actions**:
  - **Resistance**: +10 for rescuing civilians, +15 for sabotaging CorpSec, +20 for completing Resistance quests. -20 for betraying Resistance members, -30 for turning in Resistance contacts to CorpSec.
  - **CorpSec**: +10 for reporting crimes, +15 for eliminating Resistance members, +20 for completing CorpSec contracts. -20 for attacking CorpSec patrols, -30 for sabotaging checkpoints.
  - **Scavengers**: +5 for trading (cumulative), +15 for completing salvage contracts, +10 for sharing discovered loot locations. -15 for stealing from Scavenger caches, -20 for killing Scavenger merchants.
- **Implement rival faction mechanics**:
  - Gaining reputation with Resistance decreases CorpSec reputation (and vice versa) at 50% rate
  - Scavengers remain independent (reputation not affected by Resistance/CorpSec actions)
  - Reaching Allied (+60) with one side automatically sets rival to Hostile (<-60)
- **Build FactionReputationPanel.tsx** in `src/components/ui`:
  - Display all three factions with reputation bars (-100 to +100)
  - Color-code thresholds: red (Hostile), orange (Unfriendly), gray (Neutral), green (Friendly), gold (Allied)
  - Show current standing label and next threshold
  - List active effects for each faction (e.g., "Resistance: Friendly - 25% discount at safe houses, backup available")
- **Integrate into gameplay**:
  - NPCs check player faction reputation before offering quests or services
  - Faction-aligned NPCs (Resistance operatives, CorpSec guards, Scavenger traders) have different dialogues based on standing
  - Dialogue options tagged with faction requirements: "[Resistance Allied] Ask for intel on CorpSec HQ"
  - Faction areas (Resistance safe houses, CorpSec HQ, Scavenger markets) have access restrictions based on reputation
- **Add reputation change notifications**: Toast notifications showing reputation shifts: "+15 Resistance reputation: Civilian rescued", "-20 CorpSec reputation: Patrol eliminated"
- **Wire into ending system**: Final mission outcome influenced by faction allegiances. Allied factions provide support (reinforcements, equipment, intelligence).
</details>

<accessibility>
- Faction reputation bars keyboard accessible with clear ARIA labels
- Screen reader announces reputation changes: "Resistance reputation increased to 45, now Friendly status"
- Color-coding supplemented with icons for colorblind accessibility
</accessibility>

<test>
Complete Resistance quest and verify +20 Resistance reputation, -10 CorpSec reputation (50% penalty). Verify toast notification appears. Check FactionReputationPanel shows updated values with correct color-coding. Reach Friendly (+20) with Resistance and verify discount applies at Resistance safe house, special quests unlock. Attack CorpSec patrol and verify reputation drops to Hostile (<-60). Confirm CorpSec guards now attack on sight, send hit squads. Trade repeatedly with Scavengers and verify cumulative +5 reputation per transaction. Reach Allied (+60) with Resistance and verify CorpSec automatically becomes Hostile. Attempt to enter CorpSec HQ with Hostile reputation and verify access denied. Check dialogue options show/hide based on faction standing. Complete game and verify Allied factions provide support in final mission.
</test>
</step>

<step id="29.2">
<step_metadata>
  <number>29.2</number>
  <title>Establish Trust/Fear Ethics Layer</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<instructions>
Create a lightweight ethics model that augments faction reputation by tracking trust and fear scores per faction/location, logging contextual action records, and surfacing immediate systemic effects (pricing, encounters, dialogue tone) without yet implementing full witness propagation.
</instructions>

<details>
- **Ethics service module** (`src/game/systems/ethics/ethicsService.ts`): Define `EthicsProfile` with `trust` (-100..100) and `fear` (0..100) axes per faction and active location cell. Provide helpers to apply deltas, clamp ranges, decay values, and broadcast updates.
- **Redux integration** (`src/store/ethicsSlice.ts`): Persist trust/fear state, last three `ActionRecord` entries, and computed modifiers (price multiplier, encounter weight, dialogue mood). Expose selectors wired into UI/components.
- **Action capture**: Emit `ActionRecord` objects (`{ actor, verb, target, locationId, tags: string[], witnesses: string[], timestamp }`) from existing combat/quest/economy reducers. Seed core tags: `scarcity_high`, `aid_given`, `threat_displayed`, `resource_hoarding`, `lawless_zone`.
- **Contextual adjustments**: Map tags to trust/fear deltas with SPECIAL-aware scaling (e.g., Charisma > 6 boosts trust gains by 10%, Strength > 7 increases fear impact). Convert existing barter pricing and encounter generation to consult combined faction reputation + trust/fear modifiers.
- **Rumor hooks**: When actions exceed configured thresholds, enqueue a simplified rumor payload (`src/game/systems/rumors/simpleRumorQueue.ts`) with faction/location scope for Step 29.5 to expand. Include accuracy defaults and spread timers but keep propagation local.
- **Developer HUD**: Add dev-only overlay (`EthicsDebugPanel`) showing current trust/fear per faction, recent action tags, and resulting modifiers to support balancing sessions.
</details>

<prerequisites>
- Step 29 (Implement Faction Reputation System with Three Core Factions)
</prerequisites>

<test>
Trigger representative actions: donate water during `scarcity_high`, extort a vendor, and fire warning shots in a neutral zone. Verify trust/fear meters update independently of base reputation, barter prices and encounter rolls reflect new modifiers, rumors are queued for qualifying acts, and the debug overlay lists the latest three action records with correct tag-derived deltas.
</test>
</step>

<step id="29.5">
<step_metadata>
  <number>29.5</number>
  <title>Implement Localized Witness Reputation Propagation</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<instructions>
Layer a witness-and-gossip reputation network on top of the faction standings so notoriety spreads through observers and their close contacts rather than globally.
</instructions>

<details>
- **Event capture pipeline** (`src/game/systems/reputation/events.ts`): Emit structured `ReputationEvent` payloads whenever the player performs a notable act (combat finisher, theft, rescue) with tags for trait deltas (heroic, cruel, sneaky, competent) and intensity.
- **Witness sampling service** (`src/game/systems/reputation/witnessService.ts`): Query nearby NPCs within the active map cell, evaluate line of sight, distance falloff, lighting, disguise, and noise to produce a `visibilityScore`; discard witnesses below threshold τ.
- **Interpretation model** (`src/game/systems/reputation/interpretation.ts`): Combine each witness’s faction values, personal biases, and event tags to derive trait adjustments and confidence. Persist `WitnessRecord` entries keyed by event.
- **Reputation scopes** (`src/store/reputationSlice.ts`): Track layered reputation buckets for (a) individual witnesses, (b) their faction, and (c) the local neighborhood cell. Apply weighted deltas using confidence to adjust `ReputationProfile` traits (heroic, cruel, sneaky, intimidating, competent) with decay timestamps.
- **Propagation graph** (`src/game/systems/reputation/propagationService.ts`): Maintain bounded gossip edges between NPC social links. Each tick, spend limited "gossip energy" to advance rumors with latency falloff and strength decay. Prevent cross-cell spread unless events exceed intensity threshold.
- **NPC reactions integration**: Update dialogue controllers, shop pricing hooks, guard AI alertness, and quest availability checks to query scoped reputation rather than global faction standing when determining responses.
- **Debug overlays**: Add a developer-only heatmap toggle and NPC inspector panel showing top perceived traits, confidence, and rumor sources for troubleshooting.
</details>

<prerequisites>
- Step 29 (Implement Faction Reputation System with Three Core Factions)
- Step 23.5 (Dynamic NPC Scheduling) for routine-aware witness sampling
</prerequisites>

<test>
Trigger three contrasting events in the Slums: rescue civilians (heroic), intimidate a ganger (scary), and pickpocket a vendor (sneaky). Verify only NPCs within line of sight update immediately, nearby contacts learn over time, and Downtown NPCs remain unaware. Check discounts apply only with witnesses and their friends, guards in the same cell escalate hostility, and dialogue lines reference observed deeds with confidence qualifiers. Advance time and confirm scores decay without reinforcement.
</test>
</step>

<step id="29.6">
<step_metadata>
  <number>29.6</number>
  <title>Gossip Heat Rumor Propagation</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<prerequisites>
- Step 19.6 completed (witness memory & regional heat)
- Step 29.5 completed (localized witness reputation propagation)
</prerequisites>

<instructions>
Implement a lightweight rumor propagation layer that fans out short-lived gossip flags across social graphs, influences regional heat, and exposes player counterplay via safehouses, disguises, and Intel perks.
</instructions>

<details>
- **Rumor Model**: Define `Rumor` contracts in `src/game/systems/rumors/gossipHeat.ts` with `{ rumorId, topic, sentiment, sourceFaction, originCell, confidence, ttl, decayRate, lastSharedAt, plantedByPlayer? }`. Persist per-NPC rumor buffers with tight caps (e.g., max 5 active rumors).
- **Propagation Tick**: Each world tick (or configurable cadence), eligible NPCs share up to two rumors to neighbors sampled from the social graph (Step 29.5). Decrease `ttl`/`confidence` on send, drop rumors when `ttl <= 0` or confidence falls below threshold. Apply faction bias weights (e.g., CorpSec forwards negative player rumors faster).
- **Heat Integration**: Feed rumor sentiment into the heat system (Step 19.6) by raising or lowering zone pressure proportional to aggregated rumor confidence, ensuring direct eyewitness reports still override gossip. Surface rumor-driven modifiers so the Street-Tension Director (Step 19.7) can react to rising chatter even without new sightings.
- **Player Counterplay**: Hook safehouse interactions and bribery/disguise actions into rumor buffers—safehouses purge or flag `plantedByPlayer` rumors for decay, bribes reduce confidence for specific factions, disguises slow rumor acceptance outside their origin cell.
- **Intel Perk Hooks**: Integrate `selectRumorPerkModifiers` from Step 24.4 so perks like Whistle-Friendly, Folk Hero, and Shadow Broker adjust decay, fan-out, or unlock “plant rumor” actions. Respect cooldowns and prevent stacking exploits.
- **UX Touchpoints**: Add an optional “Ask Around” prompt (HUD or dialogue) that surfaces the top three rumors in the current block with confidence icons, reinforcing diegetic feedback. Expose dev-only logging/visualization to inspect rumor spread for tuning.
</details>

<test>
- Unit test rumor decay and propagation helpers to confirm TTL, confidence, and fan-out obey configured caps and faction biases.
- Simulate a run where a negative rumor originates in Slums and ensure it spreads to adjacent cells over several ticks, raising local heat, while distant districts remain unaffected until contacts connect.
- Verify safehouse usage clears or dampens rumors as specified and that disguised travel slows uptake in new zones.
- Acquire Intel perks and confirm their effects (e.g., Whistle-Friendly accelerates player-planted rumors, Folk Hero boosts positive sentiment in worker districts) without breaking baseline propagation.
</test>
</step>

<step id="29.7">
<step_metadata>
  <number>29.7</number>
  <title>Dynamic District Uprisings & Resistance Simulation</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<prerequisites>
- Step 29.5 completed (localized witness reputation propagation supplies neighborhood notoriety)
- Step 29.6 completed (gossip heat propagation exposes cross-district sentiment)
- Step 16.9 completed (George assistant ambient feed ready to broadcast citywide events)
</prerequisites>

<instructions>
Stand up a systemic uprising simulation that tracks morale, supplies, and corporate pressure per district, allowing uprisings to ignite, escalate, or be crushed based on player and systemic actions. Ensure each stage drives tangible gameplay changes—patrol patterns, vendor inventory, quest hooks—and that George, signage, and NPCs surface the shifting resistance state.
</instructions>

<details>
- Extend `worldSlice` with `districtState` records `{ morale, supply, securityPresence, uprisingStage, pendingEvents }` plus selectors summarizing pressure trends, liberation odds, and countdown timers. Persist state to saves and expose dev tooling for inspection.
- Author `uprisingDirector.ts` in `src/game/world/directors/` that ticks each in-game hour. It should read witness heat (Step 29.5), gossip sentiment (Step 29.6), faction reputation deltas, resource shipments, and recent mission outcomes to adjust district metrics. Apply designer-tunable thresholds to transition stages: Calm → Tension → Spark → Siege → Liberation or Crackdown.
- When stages change, enqueue systemic responses: patrol spawn tables, curfew intensity, and surveillance loadouts shift; vendors adjust stock/discounts; safehouses grant temporary buffs or go dark; random encounter tables unlock escort/sabotage opportunities. Emit structured events consumed by George, signage packs, and quest generators.
- Seed authoring data in `src/content/world/uprisings.ts` describing per-district modifiers (e.g., corp stronghold vs. worker slum), escalation pacing, morale boosts for key story beats, and narrative flavor text for each stage.
- Provide player counterplay hooks: sabotage missions reduce securityPresence, supply raids boost morale, propaganda runs raise supply while risking crackdown. Ensure Intel perks from Step 24.4 interact (e.g., reveal impending crackdowns, unlock negotiation options).
- Document the director flow and authoring expectations in `memory-bank/architecture.md` (HOW) and note tonal guidelines for uprising messaging in `memory-bank/plot.md` (WHAT) during implementation.
</details>

<test>
- Scripted scenario: intentionally raise morale and drop security to trigger Spark, verify George announces it, signage swaps, and patrol density changes. Continue actions to reach Liberation and confirm safehouses upgrade perks while corp presence retreats.
- Stress test: allow corp pressure to outweigh morale leading to Crackdown; ensure curfew escalates, vendors restrict access, and NPC dialogue reflects fear. Confirm the simulation cools back to Tension when players counteract pressure.
- Multi-district regression: run parallel simulations in Downtown and Slums to confirm events remain scoped; George should interleave updates without duplication, and stage timers respect per-district cooldowns.
- Persistence check: save mid-Siege, reload, and confirm director resumes correctly with queued events intact and timers continuing from the saved state.
</test>
</step>
<step id="29.8">
<step_metadata>
  <number>29.8</number>
  <title>Compile World-State Variable Atlas</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<prerequisites>
- Step 19.6 completed (witness memory & regional heat scaffolds localized notoriety)
- Step 29 completed (core faction reputation system online)
- Step 29.5 completed (localized witness reputation propagation feeding district sentiment)
</prerequisites>

<instructions>
Create a centralized atlas that inventories every persistent world-state variable, its owner system, ranges, and downstream consumers so quests, AI, and narrative logic stay synchronized.
</instructions>

<details>
- Audit Redux slices (`worldSlice`, `playerSlice`, `questsSlice`, `factionsSlice`, `reputationSlice`, etc.) and catalog each persistent variable that gates content or drives systemic reactions (e.g., `curfewLevel`, `supplyScarcity`, `corpSecAlert`, `resistanceIntel`, `districtHeat`).
- Implement `src/game/state/stateAtlas.ts` exporting strongly typed descriptors `{ key, slice, datatype, range, description, consumers[] }` alongside helpers for retrieving current values plus normalized percentages.
- Add an automated validation script (`yarn atlas:verify`) that diff-checks live Redux state keys against the atlas, emitting actionable errors when a slice introduces a new variable without documentation or range metadata.
- Extend `memory-bank/game-design.md` with an XML-tagged appendix mirroring the atlas for designers, and update `memory-bank/architecture.md` to map each variable to its data flow, persistence requirements, and key listeners.
- Generate machine-readable output (`memory-bank/exports/state-atlas.json`) during the validation script so tooling, analytics, and narrative planners can ingest the canonical sheet.
</details>

<test>
- Add unit tests for `stateAtlas.ts` ensuring descriptors cover all registered keys, consumer arrays reference implemented systems, and range metadata matches runtime bounds.
- Run `yarn atlas:verify` against mocked state snapshots to confirm it fails when variables lack atlas entries or when range docs fall out of sync.
- Trigger gameplay scenarios (curfew escalation, faction swing, blackout chain) and verify the exported `state-atlas.json` reflects updated values/timestamps, demonstrating the atlas stays wired to live data.
</test>
</step>

<step id="30.1">
<step_metadata>
  <number>30.1</number>
  <title>Basic Crafting System (Ammo and Medical Supplies)</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<instructions>
Implement foundational crafting system for ammunition and medical supplies with resource gathering and recipe management.
</instructions>

<details>
- **Create resource system** in `src/game/systems/crafting.ts`:
  - Define 5 base resource types: **Metal Scrap** (common), **Electronic Parts** (uncommon), **Chemical Compounds** (uncommon), **Textile Fiber** (common), **Bio Materials** (rare)
  - Resources obtained from: looting containers (random drops), scavenging defeated enemies/robots (specific drops), dismantling items (break down unwanted gear for components)
  - Add resources to inventory as stackable items (max stack: 99)
- **Define core recipe structure** in `src/content/recipes/`:
  - Recipe interface: `{ id, name, category, inputs: [{resourceId, quantity}], outputs: [{itemId, quantity}], skillRequired, stationRequired, craftTime }`
  - **Ammunition recipes** (craftable from inventory, no station required):
    - **9mm Ammo** (×10): 2 Metal Scrap, 1 Chemical Compound. No skill required. Craft time: 5 seconds.
    - **Shotgun Shells** (×5): 3 Metal Scrap, 2 Chemical Compound. Science 15 required. Craft time: 8 seconds.
    - **Energy Cells** (×5): 2 Electronic Parts, 1 Chemical Compound. Science 25 required. Craft time: 10 seconds.
  - **Medical supplies recipes** (craftable from inventory):
    - **Bandage** (×2): 2 Textile Fiber. No skill required. Craft time: 3 seconds.
    - **Medkit**: 3 Textile Fiber, 2 Bio Materials, 1 Chemical Compound. Medicine 20 required. Craft time: 15 seconds.
    - **Stim Pack**: 2 Chemical Compound, 1 Bio Material. Medicine 30 required. Craft time: 12 seconds.
    - **Anti-Rad Meds**: 3 Chemical Compound, 1 Electronic Parts (for dispenser). Science 35 required. Craft time: 20 seconds.
- **Build CraftingPanel.tsx** in `src/components/ui`:
  - Tabbed interface: Ammunition, Medical, Tools (future), Explosives (future)
  - Left side: list of known recipes (filtered by tab)
  - Right side: selected recipe details (description, required materials with "have/need" counts, skill requirement, output preview)
  - Highlight craftable recipes in green (have all materials and skill)
  - Gray out unavailable recipes (missing materials or skill)
  - "Craft" button (disabled if requirements not met)
  - Show crafting progress bar when crafting (blocks other actions for craft time duration)
- **Implement crafting execution**:
  - Click "Craft" button: validate materials/skill, deduct resources from inventory, start craft timer
  - After craft time elapses: add output items to inventory, play sound effect, show toast: "Crafted: 10× 9mm Ammo"
  - Pass in-game time equal to craft time (time advances during crafting)
- **Add recipe discovery**:
  - Player starts with basic recipes: Bandage, 9mm Ammo
  - Discover new recipes by: reading skill books (loot), reaching skill thresholds (Medicine 20 unlocks Medkit recipe), talking to NPC trainers
  - Display "New Recipe Learned!" notification when discovered
- **Implement resource scavenging**:
  - Add "Scavenge" interaction to containers, debris, corpses
  - Random resource drops based on location type (Slums: more Textile/Metal, Downtown: more Electronics)
  - Enemy-specific drops: robots drop Electronic Parts, humans drop Bio Materials/Textiles
</details>

<performance>
- Debounce crafting button clicks to prevent double-crafting
- Batch recipe filtering calculations, don't recalculate every frame
</performance>

<test>
Loot containers and defeat enemies to gather resources (Metal Scrap, Electronic Parts, etc.). Open CraftingPanel and verify known recipes display with material requirements. Attempt to craft 9mm Ammo with insufficient materials and verify button disabled. Gather required materials and craft successfully, confirm resources deducted and ammo added to inventory. Try to craft Stim Pack without Medicine 30 skill and verify grayed out with skill requirement warning. Read skill book and verify new recipe appears with "New Recipe Learned!" notification. Craft Medkit and verify 15-second craft time elapses with progress bar. Dismantle unwanted weapon and confirm resources recovered. Scavenge container in Slums vs Downtown and verify different resource drop rates.
</test>
</step>

<step id="30.2">
<step_metadata>
  <number>30.2</number>
  <title>Weapon Modification System</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<prerequisites>
- Step 30.1 completed (crafting system and resources exist)
- Equipment system from Step 25 exists (weapons have modification slots)
</prerequisites>

<instructions>
Implement weapon modification system allowing players to craft and attach mods that enhance weapon performance.
</instructions>

<details>
- **Define weapon mod structure** in `src/content/items/weaponMods.ts`:
  - Each weapon has 2-3 mod slots: **Barrel**, **Magazine**, **Optics**
  - Mods are inventory items that can be attached/detached from compatible weapons
  - Mods provide stat bonuses: damage, accuracy, capacity, special properties
- **Create weapon mod recipes** (require Workbench station):
  - **Reflex Sight** (Optics): 2 Electronic Parts, 1 Metal Scrap. Engineering 15. Craft time: 20s. Effect: +10% accuracy.
  - **Extended Magazine** (Magazine): 3 Metal Scrap, 1 Electronic Parts. Engineering 20. Craft time: 25s. Effect: +50% magazine capacity.
  - **Suppressor** (Barrel): 4 Metal Scrap, 1 Textile Fiber. Engineering 25. Craft time: 30s. Effect: Silenced (no alert), -5% damage.
  - **Long Barrel** (Barrel): 3 Metal Scrap. Engineering 15. Craft time: 15s. Effect: +15% damage, -5% accuracy.
  - **Laser Sight** (Optics): 3 Electronic Parts. Engineering 30. Craft time: 35s. Effect: +15% accuracy, +5% crit chance.
  - **Armor-Piercing Barrel** (Barrel): 5 Metal Scrap, 2 Chemical Compound. Engineering 35. Craft time: 40s. Effect: Ignore 50% target armor.
- **Implement mod attachment system**:
  - In InventoryPanel, right-click weapon → "Modify Weapon"
  - Opens WeaponModificationPanel showing weapon's 3 mod slots
  - Drag-and-drop compatible mods from inventory to slots
  - Display stat changes preview (green +damage, +accuracy)
  - "Apply" button confirms changes, mods become attached to weapon
  - Detaching mod returns it to inventory (free action)
- **Wire mods into combat calculations**:
  - When calculating weapon stats (damage, accuracy, capacity), include attached mod bonuses
  - Suppressor mod: attacks don't trigger enemy alerts
  - Armor-piercing mod: reduce target armor rating before damage calculation
  - Extended magazine: increase ammo capacity (e.g., 10 rounds → 15 rounds)
- **Add mod compatibility**:
  - Not all mods fit all weapons (can't put Long Barrel on pistol, only rifles/shotguns)
  - Check weapon type before allowing mod attachment
  - Display compatibility warning: "This mod is not compatible with pistols"
- **Create Workbench locations**:
  - Resistance safe houses have workbenches
  - Scavenger market has workbench (fee required if reputation <Friendly)
  - Industrial Wasteland has abandoned workshop (free, but dangerous to reach)
- **Build crafting station UI**:
  - When near workbench, "Use Workbench" interaction appears
  - Opens CraftingPanel filtered to Weapon Mods tab
  - Show only recipes requiring workbench
  - Cannot craft without being at workbench
</details>

<accessibility>
- Weapon mod slots keyboard navigable (Tab to cycle, Enter to attach/detach)
- Screen reader describes mod effects: "Reflex Sight attached, accuracy increased by 10 percent"
- Visual preview of stat changes with clear +/- indicators
</accessibility>

<test>
Gather resources and reach Engineering 15 skill. Travel to Resistance safe house and interact with workbench. Open crafting panel and verify Weapon Mods tab shows available recipes. Craft Reflex Sight and confirm mod added to inventory. Right-click weapon and select "Modify Weapon", verify WeaponModificationPanel opens with 3 slots. Drag Reflex Sight to Optics slot and confirm +10% accuracy preview appears. Apply mod and confirm stat bonus active in character sheet. Enter combat and verify improved accuracy. Craft Suppressor and attach to weapon, verify attacks no longer alert nearby enemies. Attempt to attach Long Barrel to pistol and verify compatibility warning. Craft Extended Magazine, attach to rifle, and verify magazine capacity increases from 10 to 15 rounds. Detach mod and confirm it returns to inventory. Try to craft weapon mod without workbench and verify prevention.
</test>
</step>
</phase>

<phase id="8" name="World Expansion">
<step id="31">
<step_metadata>
  <number>31</number>
  <title>Industrial Wasteland Zone (Deferred to Post-MVP)</title>
  <phase>Phase 8: World Expansion</phase>
</step_metadata>

<instructions>
This step was moved out of the MVP build. Refer to `memory-bank/post-mvp-plan.md` for the full Industrial Wasteland scope, milestone tests, and authoring guidance.
</instructions>

<notes>
- Preserve dependency references in other steps, but execute the zone build only when tackling the post-MVP roadmap.
- Keep the associated Linear issue in the PostMVP project; update its status when planning the expansion.
</notes>
</step>

<step id="31.5">
<step_metadata>
  <number>31.5</number>
  <title>Seasonal Narrative Arc Episodes</title>
  <phase>Phase 8: World Expansion</phase>
</step_metadata>

<prerequisites>
- Step 16.9 completed (George assistant ambient feed)
- Step 29.7 completed (Dynamic District Uprisings & Resistance Simulation)
- Step 33 completed (save system resilience)
</prerequisites>

<instructions>
Create a seasonal episode framework that schedules limited-time citywide arcs. Each episode layers bespoke ambient dressing, missions, and rewards on top of the uprising/heat systems so returning players see fresh stakes without fragmenting saves.
</instructions>

<details>
- Extend `worldSlice` with a `seasonState` record storing `currentEpisodeId`, phase progression, timestamps, and active modifiers. Provide selectors and persistence hooks so mid-episode saves restore safely.
- Add `seasonDirector.ts` in `src/game/world/directors/` that loads episode configs from `src/content/seasons/<episodeId>.ts`, ticks phases (`Prelude`, `Escalation`, `Climax`, `Aftermath`), and dispatches structured events for George, signage, quest generators, and ambient triggers.
- Author baseline episode templates (e.g., CorpSec Crackdown, Resistance Festival, Blackout Amnesty) defining prop swaps, lighting presets, patrol modifiers, vendor adjustments, limited-time missions, and reward tables. Ensure localization keys and narration blurbs live alongside content.
- Update George assistant with a “Season Briefing” tab describing the active episode, remaining time, and recommended actions. Mirror high-level summaries in the quest log/planning board and broadcast milestone changes through ambient systems.
- Provide player agency: episodic missions, donation drives, or sabotage tasks that influence episode outcomes and tie back into uprising metrics. Rewards should include cosmetics, schematics, and faction perks that persist post-episode.
- Document the episode authoring workflow in `memory-bank/architecture.md` (director flow, save considerations) and record tone/style rules per episode type in `memory-bank/plot.md`.
</details>

<test>
- Fast-forward through an episode in a dev harness; confirm each phase activates the correct ambient assets, missions, and George briefings, even across reloads.
- Trigger liberation and crackdown scenarios during an episode to ensure modifiers stack cleanly with uprising effects and revert when the episode ends.
- Accept and complete limited-time missions; verify rewards grant persistent perks/schematics and that failure paths adjust future phase modifiers.
- Save/quit in each episode phase; on reload ensure `seasonDirector` resumes timers, pending events, and UI with no duplication or desync.
</test>
</step>
</phase>

<phase id="10" name="Testing, Polish, and Release">
<step id="32.1">
<step_metadata>
  <number>32.1</number>
  <title>Implement Unit Test Suite (70%+ Code Coverage)</title>
  <phase>Phase 10: Testing, Polish, and Release</phase>
</step_metadata>

<instructions>
Create a comprehensive unit test suite using Jest to verify individual game systems function correctly in isolation. Target 70%+ code coverage for core game logic.
</instructions>

<details>
**Testing Framework Setup**:
- Use existing Jest configuration from Step 1 project initialization
- Add `@testing-library/react` for UI component testing
- Configure coverage reporting: `yarn test --coverage` generates HTML coverage report in `/coverage` directory
- Set up test file structure: mirror `src/` directory in `src/__tests__/` for organization

**Priority Test Files** (implement these core system tests):

1. **combatSystem.test.ts** (`src/game/combat/__tests__/combatSystem.test.ts`):
   - Test hit chance calculation: verify formula `baseAccuracy + weaponAccuracy - (distance * 5) - (targetCover * 20)` with various inputs
   - Test damage calculation: verify formula `weaponDamage * (1 - targetArmor / 100) * critMultiplier`
   - Test critical hits: verify 10% base crit chance, double damage application
   - Test cover mechanics: verify 20% cover bonus reduces hit chance correctly
   - Test AP costs: verify weapon actions consume correct AP (shoot, reload, move)
   - Mock enemy AI behavior and verify target selection logic
   - **Expected coverage**: 80%+ of combat system files

2. **pathfinding.test.ts** (`src/game/world/__tests__/pathfinding.test.ts`):
   - Test A* pathfinding algorithm: verify shortest path calculated between two points on grid
   - Test obstacle avoidance: verify paths route around impassable tiles (walls, buildings)
   - Test diagonal movement costs: verify diagonal = 1.4x straight movement cost
   - Test edge cases: no valid path, already at destination, blocked destination
   - Performance test: verify pathfinding completes <50ms for 50×50 grid
   - **Expected coverage**: 85%+ of pathfinding module

3. **inventory.test.ts** (`src/game/interfaces/__tests__/inventory.test.ts`):
   - Test item addition: verify items added to inventory array, stack correctly if stackable
   - Test weight calculations: verify total weight = sum(item.weight * item.quantity)
   - Test weight limits: verify over-weight prevents adding items, shows warning
   - Test item removal: verify items removed correctly, stack quantities decrease
   - Test equipped items: verify equipping removes from inventory, unequipping returns it
   - Test item swapping: verify swapping equipped weapon updates stats correctly
   - **Expected coverage**: 75%+ of inventory system

4. **leveling.test.ts** (`src/game/interfaces/__tests__/leveling.test.ts`):
   - Test XP gain: verify killing enemy awards correct XP based on enemy level
   - Test level-up triggers: verify level increases when XP reaches threshold (100 * level²)
   - Test skill point allocation: verify player receives 10 skill points per level
   - Test stat increases: verify allocating points increases stats correctly
   - Test skill caps: verify skills cannot exceed 100 maximum
   - Test level cap: verify max level 20 enforcement
   - **Expected coverage**: 80%+ of leveling system

5. **dialogue.test.ts** (`src/game/dialogue/__tests__/dialogue.test.ts`):
   - Test dialogue tree traversal: verify correct dialogue nodes displayed based on choices
   - Test skill checks: verify Speech 50 requirement locks/unlocks correct dialogue options
   - Test karma checks: verify Good Karma (>500) enables/disables specific branches
   - Test quest flag checks: verify completed quests affect available dialogue
   - Mock NPC data and verify dialogue state management
   - **Expected coverage**: 70%+ of dialogue system

6. **crafting.test.ts** (`src/content/__tests__/crafting.test.ts`):
   - Test recipe validation: verify material requirements checked correctly
   - Test crafting execution: verify materials deducted, item added to inventory
   - Test skill requirements: verify Medicine 30 blocks crafting Stim Pack if insufficient
   - Test craft time: verify crafting takes specified duration (mock timer)
   - Test dismantling: verify 50% material recovery calculation
   - **Expected coverage**: 75%+ of crafting system

**Additional Test Coverage**:
- **UI Components**: Test critical React components (InventoryPanel, CharacterSheet, DialogueBox) for rendering and user interactions
- **Redux Store**: Test state management actions and reducers for player stats, inventory, quest progress
- **Utility Functions**: Test helper functions in `src/utils/` (calculations, formatters, validators)

**Coverage Thresholds** (configure in `jest.config.js`):
```javascript
coverageThresholds: {
  global: {
    statements: 70,
    branches: 65,
    functions: 70,
    lines: 70
  },
  './src/game/': {
    statements: 75,
    branches: 70,
    functions: 75,
    lines: 75
  }
}
```

**Test Execution Commands**:
- `yarn test` - Run all unit tests
- `yarn test --coverage` - Run tests with coverage report
- `yarn test --watch` - Run tests in watch mode during development
- `yarn test combatSystem` - Run specific test file

**Acceptance Criteria**:
- All 6 priority test files implemented with specified coverage
- Overall code coverage ≥70% (statement, branch, function, line coverage)
- Zero failing tests in CI/CD pipeline
- Coverage report HTML viewable at `/coverage/lcov-report/index.html`
</details>

<prerequisites>
- All core game systems (Steps 1-31) must be implemented before comprehensive testing
- Jest and testing-library dependencies installed from Step 1
</prerequisites>

<test>
Run `yarn test --coverage` and verify all 6 test files execute successfully. Check coverage report and confirm overall coverage ≥70%. Verify combatSystem.test.ts covers hit chance, damage, crits, cover, and AP costs. Verify pathfinding.test.ts covers A* algorithm, obstacles, diagonal movement. Verify inventory.test.ts covers adding, removing, weight limits, equipping. Verify leveling.test.ts covers XP gain, level-up, skill points, caps. Verify dialogue.test.ts covers tree traversal, skill checks, karma checks. Verify crafting.test.ts covers recipes, materials, skill requirements, dismantling. Check that coverage thresholds are enforced - intentionally break a test and verify CI fails. View HTML coverage report and confirm critical files (combatSystem.ts, inventory.ts, etc.) show green (70%+) coverage.
</test>
</step>

<step id="32.2">
<step_metadata>
  <number>32.2</number>
  <title>Create Integration Test Scenarios (E2E Testing)</title>
  <phase>Phase 10: Testing, Polish, and Release</phase>
</step_metadata>

<instructions>
Implement end-to-end (E2E) integration tests using Playwright or Cypress to verify complete user workflows function correctly across the entire game.
</instructions>

<details>
**E2E Testing Framework Setup**:
- Install Playwright: `yarn add -D @playwright/test` (recommended for modern React/Vite apps)
- Alternative: Cypress (`yarn add -D cypress`) if team prefers
- Configure test runner: create `playwright.config.ts` with base URL `http://localhost:5173` (Vite dev server)
- Set up test environment: ensure game runs in local dev server before tests execute
- Create test directory: `e2e/` at project root for integration test files

**Priority Integration Test Scenarios** (20-30 tests covering major workflows):

1. **Character Creation Flow** (`e2e/character-creation.spec.ts`):
   - Test 1: Create character with custom name, verify name appears in character sheet
   - Test 2: Allocate SPECIAL stats (7/7/5/5/5/5/5), verify totals correct, "Confirm" enabled
   - Test 3: Tag 3 skills (Combat, Hacking, Medicine), verify skills start at 35 (base 20 + 15 tag bonus)
   - Test 4: Select background trait, verify stat modifiers apply (e.g., "Ex-Soldier" +1 Combat)
   - Test 5: Complete character creation, verify game world loads with player character visible

2. **Combat Flow** (`e2e/combat.spec.ts`):
   - Test 6: Enter combat by approaching enemy, verify combat grid appears with turn order
   - Test 7: Select weapon, click enemy tile, verify attack animation plays, damage dealt
   - Test 8: Move player 3 tiles, verify AP decreases by 3 (1 AP per tile)
   - Test 9: Use cover (click behind wall), verify cover icon appears, enemy hit chance reduces
   - Test 10: Reload weapon mid-combat, verify reload animation, magazine refilled, 3 AP consumed
   - Test 11: Defeat all enemies, verify combat ends, XP awarded, loot drops appear
   - Test 12: Test flanking: attack enemy from behind cover, verify hit chance bonus applied

3. **Quest Progression** (`e2e/quests.spec.ts`):
   - Test 13: Accept quest from NPC, verify quest added to Quest Log with objectives
   - Test 14: Complete quest objective (e.g., collect 3 items), verify objective marked complete
   - Test 15: Return to quest giver, verify reward options appear (credits, item, or XP bonus)
   - Test 16: Choose reward, verify credits/item added to inventory, quest marked complete
   - Test 17: Test branching quest: make choice in dialogue, verify different quest outcome
   - Test 18: Test failed quest: kill quest-critical NPC, verify quest fails, consequences apply

4. **Dialogue and Skill Checks** (`e2e/dialogue.spec.ts`):
   - Test 19: Start dialogue with NPC, verify dialogue box opens with options
   - Test 20: Choose dialogue option without skill check, verify next dialogue node appears
   - Test 21: Attempt Speech 50 check with Speech 30, verify option shows "[Speech 50] FAILED", negative outcome
   - Test 22: Attempt Speech 50 check with Speech 50+, verify option shows "[Speech 50] SUCCESS", positive outcome
   - Test 23: Verify karma-locked option: Good Karma dialogue unavailable if karma <500
   - Test 24: Test dialogue that starts combat, verify smooth transition from dialogue to combat grid

5. **Inventory and Equipment** (`e2e/inventory.spec.ts`):
   - Test 25: Open inventory (I key), verify inventory panel appears with all items
   - Test 26: Equip weapon, verify weapon appears in character sheet, stats update
   - Test 27: Unequip armor, verify armor removed from character sheet, defense decreases
   - Test 28: Pick up item from loot container, verify item added to inventory, weight increases
   - Test 29: Drop item from inventory, verify item removed, weight decreases
   - Test 30: Attempt to pick up item when over weight limit, verify warning message, item not added

6. **Zone Transitions** (`e2e/world-exploration.spec.ts`):
   - Test 31: Move player to zone transition tile (e.g., Downtown → Slums border)
   - Test 32: Verify transition prompt appears: "Travel to Slums? [Yes/No]"
   - Test 33: Confirm transition, verify loading screen, new zone loads correctly
   - Test 34: Return to previous zone, verify zone state persists (NPCs, loot containers)

7. **Leveling and Progression** (`e2e/progression.spec.ts`):
   - Test 35: Gain enough XP to level up, verify level-up notification appears
   - Test 36: Open character sheet, allocate 10 skill points, verify skills increase
   - Test 37: Select perk at level 3, verify perk bonus applies (e.g., +10% crit chance)
   - Test 38: Verify skill point allocation cannot exceed 100 skill cap

8. **Crafting System** (`e2e/crafting.spec.ts`):
   - Test 39: Gather crafting materials (Metal Scrap, Gunpowder), verify inventory contains materials
   - Test 40: Open crafting panel, select recipe (9mm Ammo), verify materials required shown
   - Test 41: Craft item, verify crafting progress bar appears, item added after completion
   - Test 42: Attempt to craft without sufficient materials, verify "Craft" button disabled

**Test Execution Setup**:
- Configure Playwright to run tests in headless mode for CI/CD: `yarn test:e2e --headless`
- Configure test artifacts: screenshots on failure, video recording for debugging
- Set up parallel execution: run tests in parallel to reduce total test time
- Create GitHub Actions workflow: run E2E tests on every PR to main branch

**Test Commands**:
- `yarn test:e2e` - Run all E2E tests with UI
- `yarn test:e2e --headless` - Run tests in headless mode (CI)
- `yarn test:e2e --ui` - Open Playwright test UI for debugging
- `yarn test:e2e combat.spec.ts` - Run specific test file

**Acceptance Criteria**:
- 20-30 E2E tests implemented covering all major workflows
- All tests pass consistently (no flaky tests)
- Tests run in CI/CD pipeline on every commit
- Test execution time <5 minutes total (with parallelization)
</details>

<prerequisites>
- Step 32.1 (Unit Test Suite) should be completed first for foundation
- All game systems implemented and functional in local dev environment
- Playwright or Cypress installed and configured
</prerequisites>

<performance>
- Use Playwright's auto-waiting to reduce flaky tests
- Set reasonable timeouts: 30s for page loads, 10s for element interactions
- Run tests in parallel (4-6 workers) to reduce total execution time
- Cache browser binaries in CI to speed up pipeline
</performance>

<test>
Run `yarn test:e2e` and verify all 20-30 tests execute successfully. Verify character creation flow tests cover name input, SPECIAL allocation, skill tagging, background selection. Verify combat tests cover attacking, movement, cover, reloading, enemy defeat. Verify quest tests cover accepting, completing objectives, choosing rewards, branching paths. Verify dialogue tests cover skill checks (success/failure), karma checks, combat transition. Verify inventory tests cover equipping, unequipping, picking up, dropping, weight limits. Verify zone transition tests cover movement between zones, state persistence. Verify progression tests cover XP gain, level-up, skill allocation, perk selection. Verify crafting tests cover material gathering, recipe selection, crafting execution, insufficient materials. Run tests in headless mode (`--headless`) and verify all pass. Intentionally break a feature (e.g., disable weapon equipping) and verify corresponding E2E test fails. Check CI/CD pipeline and confirm E2E tests run automatically on PR.
</test>
</step>

<step id="33">
<step_metadata>
  <number>33</number>
  <title>Expand Save Functionality</title>
  <phase>Phase 10: Testing, Polish, and Release</phase>
</step_metadata>

<instructions>
Upgrade the single-slot persistence into a full multi-slot save manager with comprehensive state capture.
</instructions>

<details>
- Provide a save/load interface that lists available slots, timestamps, and key metadata (location, time of day, character level, current quest).
- Support creating, overwriting, and deleting slots while reusing the Redux serialization logic established earlier.
- Ensure save operations capture all game state: player stats, inventory (including vehicle storage), quest progress, world state, faction reputations, karma, survival meters, NPC states, discovered locations, crafting recipes, and menu visibility.
- Add auto-save functionality that triggers at key moments (level up, quest completion, zone transition) with configurable frequency.
- Implement save data versioning to handle updates that add new features without breaking old saves.
</details>

<test>
Create several saves at different progression points (early game, mid-game with vehicle, late game with multiple factions). Reload each save and confirm all state restores correctly: character stats, inventory contents, quest progress, faction standings, karma level, survival meters, and vehicle condition. Delete a save and verify it's removed. Test auto-save by completing a quest and confirming a new auto-save appears. Load an auto-save and verify full state restoration.
</test>
</step>

<step id="34">
<step_metadata>
  <number>34</number>
  <title>Polish the UI</title>
  <phase>Phase 10: Testing, Polish, and Release</phase>
</step_metadata>

<instructions>
Enhance the user interface for clarity, thematic consistency, and usability across all new systems.
</instructions>

<details>
- Style all UI elements (dialogue box, quest log, inventory, character sheet, crafting interface, vehicle management, survival meters, karma/reputation screens) with consistent visuals that fit the dystopian setting.
- Add comprehensive tooltips to explain game mechanics, stats, status effects, crafting requirements, and interface elements.
- Implement context-sensitive help for complex systems (crafting, vehicle upgrades, targeted shots).
- Add visual feedback for all player actions: AP costs, hit chances, crafting progress, survival warnings, reputation changes.
- Ensure UI is responsive and performs well on modern browsers at various resolutions.
- Polish animations and transitions for smoother experience (menu opening, combat actions, zone transitions).
- Implement keyboard shortcuts for common actions (inventory, character sheet, quick save, crafting menu).
</details>

<test>
Open each UI element (character sheet, inventory, crafting, vehicle management, karma/reputation screen, quest log, dialogue system). Ensure they look cohesive with consistent styling. Hover over various elements and confirm tooltips appear with helpful information. Test keyboard shortcuts work correctly. Verify animations are smooth. Check UI responsiveness at different browser window sizes.
</test>
</step>

<step id="34.7">
<step_metadata>
  <number>34.7</number>
  <title>Create In-Game Help System and External Documentation</title>
  <phase>Phase 10: Testing, Polish, and Release</phase>
</step_metadata>

<instructions>
Build a comprehensive in-game help system and update external documentation (README, ARCHITECTURE, CONTRIBUTING) to ensure players and developers can understand and navigate the game effectively.
</instructions>

<details>
**In-Game Help System**:

**1. HelpPanel Component** (`src/components/ui/HelpPanel.tsx`):
- **Access**: Press F1 key or click "?" icon in main menu → opens help modal overlay
- **Dismissal**: Press F1 again, ESC key, or click X button to close
- **Structure**: Tabbed interface with 8 sections (Combat, Character, Inventory, Quests, World, Crafting, Factions, Controls)
- **Search functionality**: Input field at top to search help topics by keyword
- **Persistent state**: Remember last viewed tab across sessions (localStorage)

**2. Help Section Content**:

**Tab 1: Combat Basics**
- Turn-based combat explanation (AP system, turn order)
- Attack mechanics: hit chance formula, damage calculation, critical hits
- Cover system: full cover vs partial cover, flanking mechanics
- Targeted shots: body parts, accuracy penalties, special effects
- Weapon types: pistols, rifles, shotguns, melee weapons - pros/cons of each
- Grenade usage: AoE, blast radius, friendly fire warning
- Combat tips: "Use cover to reduce enemy hit chance by 20%", "Flank enemies for +15% hit chance"

**Tab 2: Character Development**
- SPECIAL stats explained (Strength, Perception, Endurance, Charisma, Intelligence, Agility, Luck)
- Skill system: 12 skills, how they're used, skill check thresholds (20/40/60/80/100)
- Leveling: XP gain, level-up process, skill point allocation (10 per level)
- Perks: unlock at levels 3/6/9/12/15/18, examples of each tier
- Background traits: list all traits with bonuses/penalties
- Build examples: "Combat Specialist" (high STR/PER/Combat), "Diplomat" (high CHA/Speech), "Technician" (high INT/Hacking/Engineering)

**Tab 3: Inventory & Equipment**
- Inventory interface: how to open (I key), grid layout, weight system
- Equipment slots: weapon, armor, accessory - how to equip/unequip
- Weight limit: 50 kg base + (Strength * 5), over-encumbered penalties
- Item types: weapons, armor, consumables, crafting materials, quest items
- Item rarity: Common (white), Rare (blue), Epic (purple) - affects stats
- Stacking: which items stack (ammo, stims), which don't (weapons, armor)

**Tab 4: Quests & Dialogue**
- Quest log: how to open (Q key), active vs completed quests
- Quest types: main quests, side quests, faction quests
- Objectives: how to track, checkboxes, waypoint markers
- Dialogue system: branching choices, skill checks, karma checks
- Skill check format: "[Speech 50]" means requires Speech ≥50 to succeed
- Quest rewards: credits, items, XP bonus, reputation changes
- Failed quests: consequences of killing quest-critical NPCs

**Tab 5: World & Exploration**
- Zone map: Slums, Downtown, Industrial Wasteland - danger levels
- Movement: arrow keys or click-to-move, pathfinding
- Zone transitions: how to travel between zones, loading screens
- Day/night cycle: time passes automatically, curfew at night (6 PM - 6 AM)
- Safe zones: areas with no combat, fast-travel points
- Environmental hazards: Industrial Wasteland toxic gas (requires Gas Mask), radiation, chemical spills
- NPCs: hostile vs friendly, guards, traders, quest givers

**Tab 6: Crafting & Upgrades**
- Crafting system: how to open (K key), recipe list, material requirements
- Recipes: ammunition, medical supplies, explosives - unlock with skill books
- Skill requirements: Medicine 30 for Stim Pack, Engineering 15 for weapon mods
- Crafting materials: where to find (loot, dismantle items, purchase)
- Weapon mods: optics, barrels, magazines - how to craft and attach
- Workbenches: required for weapon modification, located in safe houses
- Dismantling: recover 50% of crafting materials from unwanted items

**Tab 7: Factions & Reputation**
- Three factions: Resistance (rebels), CorpSec (enforcers), Scavengers (traders)
- Reputation levels: Hostile (-100 to -50), Neutral (-49 to 249), Friendly (250 to 499), Allied (500+)
- Gaining reputation: complete faction quests, make aligned dialogue choices
- Losing reputation: kill faction members, make opposed choices
- Opposed factions: helping Resistance hurts CorpSec reputation (and vice versa)
- Reputation benefits: access to faction vendors, faction-specific quests, safe passage
- Karma vs reputation: karma is personal morality (good/evil), reputation is faction standing

**Tab 8: Controls & Shortcuts**
- Movement: Arrow keys or WASD (if implemented), click on tile to move
- Combat: Click enemy to attack, click tile to move, number keys for item hotbar
- UI shortcuts: I (Inventory), C (Character), Q (Quest Log), M (Map), K (Crafting), ESC (Menu)
- Interaction: E key or click to interact with NPCs, loot containers, doors
- Save/Load: ESC menu → Save Game, auto-save on level-up and quest completion
- Help: F1 to open this help panel
- Accessibility: Tab to navigate UI, Enter to activate, ESC to close modals

**3. Contextual Help Tooltips**:
- Add "?" icons next to complex UI elements that open specific help section when clicked
  - Example: Character creation SPECIAL screen has "?" icon → opens Help Tab 2 (Character Development)
  - Example: Combat grid has "?" icon in corner → opens Help Tab 1 (Combat Basics)
  - Example: Crafting panel has "?" icon → opens Help Tab 6 (Crafting & Upgrades)

**External Documentation**:

**1. README.md** (update at project root):
- **Project overview**: Brief description of "The Getaway" game concept
- **Tech stack**: TypeScript, React, Vite, Phaser, Redux, Tailwind CSS
- **Installation instructions**:
  ```bash
  yarn install
  yarn dev  # Runs dev server at http://localhost:5173
  ```
- **Build instructions**:
  ```bash
  yarn build  # Production build to dist/
  yarn preview  # Preview production build
  ```
- **Testing instructions**:
  ```bash
  yarn test  # Unit tests with Jest
  yarn test --coverage  # With coverage report
  yarn test:e2e  # E2E tests with Playwright
  ```
- **Project structure**: High-level folder overview (src/game, src/components, src/content)
- **Contributing**: Link to CONTRIBUTING.md for development guidelines
- **License**: Specify license (MIT, GPL, proprietary, etc.)

**2. ARCHITECTURE.md** (create in /memory-bank/ or project root):
- **System architecture overview**: High-level diagram showing React UI layer, Phaser game layer, Redux state management
- **Core systems**:
  - Combat system: turn-based, AP costs, hit chance formula
  - World system: grid-based movement, pathfinding, zone transitions
  - Dialogue system: branching trees, skill checks, karma checks
  - Inventory system: weight limits, equipment slots, item types
  - Progression system: XP, leveling, skill points, perks
  - Faction system: reputation tracking, opposed factions
  - Crafting system: recipes, materials, skill requirements
- **Data flow**: How player actions flow from React UI → Redux actions → Phaser game state → back to UI
- **File organization**: Explanation of src/game, src/components, src/content structure
- **Key interfaces**: PlayerStats, Inventory, DialogueNode, Quest, Faction definitions
- **Performance considerations**: Pathfinding optimization, render batching, state serialization for saves

**3. CONTRIBUTING.md** (create at project root):
- **Development setup**: Same as README installation, plus recommended VS Code extensions
- **Code style guide**: TypeScript best practices, React component patterns, naming conventions
  - Use PascalCase for components (InventoryPanel.tsx)
  - Use camelCase for functions and variables (calculateDamage, playerStats)
  - Use UPPER_SNAKE_CASE for constants (MAX_INVENTORY_SLOTS)
- **Git workflow**: Branch naming (feature/add-inventory, bugfix/combat-ap), commit message format
- **Testing requirements**: All new features require unit tests, aim for 70%+ coverage
- **Pull request process**: Create PR with description, link related issues, request review
- **Issue reporting**: Bug report template (steps to reproduce, expected vs actual behavior, screenshots)
- **Feature requests**: Template for suggesting new features (problem statement, proposed solution, alternatives considered)
- **Documentation requirements**: Update ARCHITECTURE.md if adding new system, update README.md if changing build process

**Acceptance Criteria**:
- HelpPanel component accessible via F1 key with 8 tabbed sections
- All help content written clearly with examples and screenshots/diagrams
- Search functionality finds relevant help topics by keyword
- Contextual "?" icons present on complex UI screens linking to relevant help
- README.md updated with installation, build, test instructions
- ARCHITECTURE.md created with system overviews and data flow explanation
- CONTRIBUTING.md created with development guidelines and PR process
</details>

<prerequisites>
- All game systems implemented for complete help documentation
- Step 34 (Polish the UI) completed for UI consistency
</prerequisites>

<test>
Press F1 and verify HelpPanel modal opens with 8 tabs. Click through each tab (Combat, Character, Inventory, Quests, World, Crafting, Factions, Controls) and verify content is present and readable. Use search box to search "skill check" and verify Combat and Quests tabs highlighted. Close help with F1, ESC, or X button and verify modal closes. Open character creation screen and verify "?" icon present near SPECIAL stats. Click "?" icon and verify HelpPanel opens to Character Development tab. Open crafting panel and verify "?" icon present, click and verify opens to Crafting tab. Check README.md and verify installation instructions (yarn install, yarn dev), build instructions (yarn build), and test instructions (yarn test) are present. Check ARCHITECTURE.md exists and verify system architecture overview, core systems descriptions, and file organization sections present. Check CONTRIBUTING.md exists and verify code style guide, git workflow, and PR process documented. Verify all help content accurate (no outdated information from earlier development). Test help system with keyboard only (Tab to navigate tabs, Enter to select, ESC to close) and verify accessible.
</test>
</step>

<step id="34.8">
<step_metadata>
  <number>34.8</number>
  <title>Implement WebGL Context Loss Recovery</title>
  <phase>Phase 10: Testing, Polish, and Release</phase>
</step_metadata>

<instructions>
Add robust WebGL context loss handling so Phaser scenes pause gracefully, rebuild GPU resources, and resume without forcing a full page reload.
</instructions>

<details>
- Register `webglcontextlost` and `webglcontextrestored` listeners on the game canvas during boot. Prevent default behavior so the browser does not attempt an automatic reload loop.
- Detect loss inside the main render loop (`MainScene` update hook or a shared game manager) and short-circuit draw logic while the context is unavailable.
- On restore, rebuild Phaser-managed render textures, custom `Graphics` primitives from `IsoObjectFactory`, and any post-processing pipelines. Centralize the recreation code so future renderable objects can opt-in.
- Expose a lightweight scene callback (`onContextRestore`) that rehydrates shaders, repopulates static prop containers, and repositions dynamic tokens from Redux state.
- Hook the recovery path into the existing mini-map, day/night overlay, and HUD widgets to ensure their textures and gradient fills refresh correctly.
- Add a developer toggle (e.g., hidden debug key) that calls `gl.getExtension('WEBGL_lose_context').loseContext()` while running in development to validate the recovery flow without manual tab throttling.
</details>

<test>
- In development mode, trigger a deliberate context loss via `WEBGL_lose_context` and verify the game stops rendering without crashing.
- Confirm Redux-driven state (player position, quests, HUD selections) persists through context loss and that the scene resumes once the context is restored.
- Inspect the rebuilt scene for missing textures, blank `Graphics`, or misordered depths after recovery.
- Repeat the test on Chrome and Firefox to ensure cross-browser stability.
</test>
</step>

<step id="34.9">
<step_metadata>
  <number>34.9</number>
  <title>Document SpectorJS Profiling Workflow</title>
  <phase>Phase 10: Testing, Polish, and Release</phase>
</step_metadata>

<instructions>
Create a repeatable WebGL profiling guide using SpectorJS so developers can diagnose draw-call spikes, shader bottlenecks, and texture churn.
</instructions>

<details>
- Add `docs/perf-playbook.md` (or update an existing performance section) outlining prerequisites, how to install the SpectorJS extension/app, and steps to capture a representative frame.
- Document capture triage: sorting by program/texture, spotting redundant binds, identifying excessive draw calls, and correlating them with Phaser objects (sprites, graphics, pipelines).
- Include a checklist for perf regressions: verify batching, texture atlas usage, shader complexity, and overdraw from large `Graphics` fills.
- Describe how to export captures and attach them to bug reports for cross-team review.
- Reference the guide from `memory-bank/architecture.md` under the rendering/diagnostics section so team members know where to find it.
- Add an action item to integrate the profiling checklist into milestone playtests (e.g., run SpectorJS once per release candidate).
</details>

<test>
- Follow the new playbook to capture a SpectorJS frame in a busy downtown scene and confirm every step produces the expected screenshots/logs.
- Validate that another developer can repeat the process using only the documentation and share an exported capture linked to a sample issue.
- Verify the memory bank reference resolves correctly and that the docs build (if applicable) without broken links.
</test>
</step>

<step id="35">
<step_metadata>
  <number>35</number>
  <title>Surface Level & Objective HUD</title>
  <phase>Phase 10: Testing, Polish, and Release</phase>
</step_metadata>

<instructions>
Display the current level metadata and mission objectives directly in the game overlay with integration for all zones.
</instructions>

<details>
- Extend `MapArea` definitions with `level` numbers and objective lists for all zones (Level 0 for Slums, Level 1 for Downtown, Level 2 for Industrial Wasteland).
- Render a `LevelIndicator` panel in the HUD that mirrors the day/night widget placement, listing active tasks without blocking gameplay.
- Show zone-specific information: current zone name, danger level, environmental hazards present, and active quests for that area.
- Ensure all map entities respect their building boundaries so overlays and sprites do not intersect structures.
- Add minimap or zone overview showing key locations, vehicle position if applicable, and discovered points of interest.
</details>

<test>
Load each level (Slums, Downtown, Industrial Wasteland) and verify the panel shows the correct level number, zone name, and objectives. Confirm environmental hazard warnings appear in Industrial Wasteland. Verify NPCs/items appear outside building footprints. Test that zone transitions update the HUD information correctly. Check that quest objectives for the current zone are highlighted.
</test>
</step>

<step id="35.2">
<step_metadata>
  <number>35.2</number>
  <title>Level Objective Progression Flow</title>
  <phase>Phase 10: Testing, Polish, and Release</phase>
</step_metadata>

<instructions>
Tie the HUD objectives state to formal mission progression so completed objectives cross out, trigger a Mission Accomplished celebration, and advance the campaign to the next level when confirmed.
</instructions>

<details>
- Extend mission data in `worldSlice` (or dedicated mission slice) to mark objectives as primary vs side, persist quest IDs, and expose an `isComplete` flag once all child quests resolve.
- Update Level & Objectives panel to animate cross-outs and show completion checkboxes while leaving side quests in an optional section that never blocks main progression.
- Dispatch a `missionAccomplished` action when every primary objective completes. Surface a confirmation modal bannering rewards, allow players to defer the transition to finish side quests, and fire an advancement event that loads the next level when accepted.
- Wire George assistant to the same selectors and mission-complete event so its guidance line, celebration copy, and defer/continue prompts stay synchronized with the Level & Objectives panel.
- Inform auxiliary systems (assistant, minimap focus, save checkpoints) by broadcasting mission completion through a shared event so they refresh guidance without polling quest internals.
</details>

<prerequisites>
- Step 35 (Surface Level & Objective HUD)
</prerequisites>

<test>
Complete all quests inside a level's primary objectives and verify each line crosses out in the HUD with a checked state. Confirm the Mission Accomplished prompt appears, offers defer and continue options, and that choosing continue loads the next level with fresh objectives. Ensure optional side quests remain visible and can still be finished after the banner appears until the player confirms advancement. Attempt to progress before all objectives are complete and confirm the confirmation is blocked.
</test>
</step>

<step id="35.5">
<step_metadata>
  <number>35.5</number>
  <title>Implement George AI Assistant Overlay</title>
  <phase>Phase 10: Testing, Polish, and Release</phase>
</step_metadata>

<instructions>
Deliver the George AI assistant overlay that anchors to the Level 0 objectives hub, providing contextual guidance, adaptive banter, and a lightweight dialogue interface.
</instructions>

<details>
- Build a `GeorgeAssistant` React component that nests inside the Level 0 objectives HUD container without obscuring existing mission data.
- Connect the assistant to Redux selectors for current objective queue, active quests, karma, faction reputation, and player personality flags (derived from dialogue choices/background traits).
- Implement hint generation rules: surface top-priority main quest hints by default, optionally rotate in relevant side quest or dynamic event prompts when player intent matches (use existing tagging on quests/events).
- Add a collapsible conversation widget (keyboard shortcut `G` and clickable entry point) offering quick options like "What should I do?", "How are we doing?", and a rotating banter hook. Responses should pull tone variants keyed to the player’s personality alignment (sarcastic, earnest, ruthless, etc.).
- Author initial dialogue lines following plot bible tone guidelines; include JSON/script entries with references to source guideline IDs for later expansion.
- Queue assistant interjections tied to major state changes (quest completion, reputation swing thresholds, entering hostile territory). Ensure timings respect cooldowns to avoid chat spam.
</details>

<test>
Launch the HUD and confirm George appears within the Level 0 objectives area without overlapping other controls. Trigger `G` and verify conversation options render, can be navigated via mouse and keyboard, and dispatch responses matching the player’s current personality alignment. Change karma/reputation values and confirm George updates commentary tone within two subsequent interactions. Complete a quest and enter a hostile zone to ensure contextual alerts fire once, respect cooldowns, and reference the correct objectives. Toggle the overlay collapsed/expanded state and confirm persistence across scene reloads.
</test>
</step>
<step id="35.7">
<step_metadata>
  <number>35.7</number>
  <title>Generate Narrative Ledger Epilogue</title>
  <phase>Phase 10: Testing, Polish, and Release</phase>
</step_metadata>

<prerequisites>
- Step 33 completed (multi-slot save manager captures full world state)
- Step 35.2 completed (mission progression flow signals campaign completion)
- Step 29 completed (faction reputation data available for endings)
</prerequisites>

<instructions>
Deliver an end-of-campaign narrative ledger that summarizes the player’s key decisions, faction standings, karmic trajectory, and district outcomes before the epilogue slideshow or free roam.
</instructions>

<details>
- Implement `buildNarrativeLedger` in `src/game/narrative/ledger/ledgerBuilder.ts` to collate core variables: karma track, faction reputation, trust/fear axes, district uprising outcomes, signature quest resolutions, companion status, vehicle condition, and standout rumors/actions.
- Create a `NarrativeLedgerPanel` React component surfaced during the Mission Accomplished banner (Step 35.2) and accessible from the pause menu post-credits. Present sections with short prose summaries plus bullet callouts, and include an export/share option for QA or community sharing.
- Author copy templates under `src/content/ledger/` that map ledger facts to tone-appropriate blurbs, citing references to `memory-bank/plot.md` for consistency. Provide localization IDs for each template.
- Persist the generated ledger snapshot into campaign saves so post-game free roam or epilogue slides reuse the same decisions without recomputation. Store a hash/timestamp to detect stale ledgers when reloading older saves.
- Document ledger data sources and authoring rules in `memory-bank/game-design.md` (narrative systems appendix) and summarize the technical pipeline in `memory-bank/architecture.md`. Log completion in `memory-bank/progress.md`.
</details>

<test>
- Add unit tests for `buildNarrativeLedger` verifying deterministic output across scripted endgame states (Resistance victory, CorpSec crackdown, neutral broker outcome).
- Run an end-to-end test script that reaches campaign completion, opens the ledger panel, navigates sections via keyboard, triggers export, and confirms the file/string reflects the expected decisions.
- Reload a post-game save and confirm the persisted ledger matches the original run, updates if new significant actions occur, and gracefully handles missing data or DLC variables.
</test>
</step>
</phase>

<summary>
## Summary

This plan now outlines **56 implementable steps** organized into **10 phases** to build "The Getaway." The structure separates core MVP features (Phases 1-8) from optional expansions (Phase 9) and final polish (Phase 10).

<phase_structure>
- **Phases 1-6 (Steps 1-21)**: Foundation, combat, exploration, narrative, and visual systems - COMPLETED (21 steps)
- **Phase 7 (Steps 22.1-30.2)**: Character progression, inventory, advanced combat, reputation, and crafting systems - CORE MVP (21 steps: 22.1/22.2/22.3, 23/23.5, 24.1/24.2/24.3, 25/25.5, 26, 26.1/26.2/26.3, 29/29.5/29.6/29.7/29.8, 30.1/30.2)
- **Phase 8 (Step 31 deferred, Step 31.5)**: Seasonal narrative arc framework remains in MVP; Industrial Wasteland zone moves to Post-MVP scope.
- **Phase 9 (Post-MVP Optional Expansions)**: See `memory-bank/post-mvp-plan.md` for Steps 26.1, 27.1, 27.2, 28.1 covering advanced stamina systems, vehicle travel, and survival mode - POST-MVP, deferred to v1.1+.
- **Phase 10 (Steps 32.1-35.7)**: Testing, polish, and documentation - FINAL RELEASE PREP (11 steps: 32.1/32.2, 33, 34, 34.7, 34.8, 34.9, 35, 35.2, 35.5, 35.7)
</phase_structure>

<focus_areas>
- **Command & Atmosphere**: Resistance command hub UI, neon isometric presentation, and curfew pressure loops.
- **Living World & Narrative**: NPC routines, branching dialogue with skill checks, and quest scaffolding tied into Redux.
- **Hazard Integration**: Environment matrix tying smog, surveillance, radiation, and curfew states into AI, faction economies, and travel safety.
- **Combat & Navigation**: Turn-based encounters with cover awareness, guard perception loops, click-to-move traversal, and readable path previews.
- **Character Progression**: Modular character creation flow, existing playerStats.ts integration, XP/leveling foundation, skill tree system, and perk selection with capstones.
- **Equipment & Inventory**: Expanded inventory system building on existing interfaces, equipment effects, durability mechanics, and weight penalties.
- **Advanced Combat Systems**: Directional cover and flanking, overwatch mode, targeted shots, area-of-effect attacks, and combat consumables for deeper tactical gameplay.
- **Reputation & Influence**: Concrete faction system (Resistance, CorpSec, Scavengers) with numerical thresholds and gameplay consequences.
- **Crafting & Upgrades**: Basic crafting for ammo and medical supplies, weapon modification system with concrete recipes.
- **Expanded World**: Downtown/Slums enhancements remain core; Industrial Wasteland zone migrated to the post-MVP roadmap.
- **Optional Expansions (Phase 9)**: Vehicle systems (motorcycle-only, simplified) and optional survival mode (hunger/thirst only) - marked for v1.1+ deferral.
- **Testing & Quality**: Unit test suite (70% coverage target) and integration test scenarios.
- **Documentation & Support**: In-game help system, state atlas exports, narrative ledger epilogue, and external documentation updates.
- **Stability & Polish**: Multi-slot save system with auto-save, comprehensive playtests, WebGL context loss recovery, SpectorJS profiling playbook, and UI refinement across all systems.
</focus_areas>

<key_improvements>
This revised plan addresses critical quality issues identified in the analysis:

**Step Granularity**: Complex steps split into focused substeps:
- Step 22 → 22.1 (UI shell), 22.2 (attributes - after 23), 22.3 (backgrounds - after 24.3)
- Step 24 → 24.1 (XP/leveling), 24.2 (skill trees), 24.3 (perk selection)
- Step 26 → 26.1 (flanking), 26.2 (overwatch/targeted shots), 26.3 (AoE/consumables)
- Step 30 → 30.1 (basic crafting), 30.2 (weapon mods)
- Step 32 → 32.1 (unit tests), 32.2 (integration tests)

**Bridge Steps Added**:
- Step 23.5: Wire equipment stats to combat formulas
- Step 25.5: Integrate equipment effects with combat and movement

**Prerequisite Dependencies**: Steps now acknowledge existing implementations and specify integration points with proper ordering.

**Scope Management**: Ambitious features deferred to Phase 9 (POST-MVP):
- Step 27.1: Vehicle systems simplified to motorcycle-only
- Step 28.1: Survival mechanics reduced to hunger/thirst only
- Clear warnings: "⚠️ POST-MVP - Defer to v1.1+"

**Concrete Specifications**: Vague descriptions replaced with formulas, thresholds, and examples:
- XP formula: `xpRequired = 100 * level * (1 + level * 0.15)`
- AP formula: `6 + floor((agility-5)*0.5)`
- Faction thresholds: <-60 Hostile, -60 to -20 Unfriendly, etc.
  - Industrial Wasteland scope documented in `memory-bank/post-mvp-plan.md` for the post-release expansion

**Quality Assurance**: New steps for comprehensive testing and accessibility:
- Step 34.7: In-game help system and external documentation

**System Transparency**: Simulation bookkeeping steps make systemic consequences observable and maintainable:
- Step 16.11: Hazard-to-system integration matrix aligns environmental threats with AI, faction pressure, and travel loops.
- Step 29.8: World-state variable atlas catalogs persistent flags for designers, tooling, and validation scripts.
- Step 35.7: Narrative ledger epilogue records player choices and world outcomes for coherent endings and regression tracking.
</key_improvements>

Each step includes concrete validation targets to keep development measurable. The architecture prioritizes modularity and scalability, drawing inspiration from Fallout 2 while focusing on a maintainable modern web stack. Iterative playtesting complements automated checks to preserve feel and performance.

The resulting foundation positions the project for a solid v1.0 release with a clear roadmap for future additions in v1.1+ (vehicles, expanded survival, additional zones, expanded faction conflicts).
</summary>
