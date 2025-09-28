# Implementation Plan for "The Getaway" (Base Game)

## Phase 1: Project Setup and Core Infrastructure

### Step 1: Initialize the Project
- **Instructions**: Set up a new project using TypeScript, React, and Vite for a browser-based game. Use Yarn for package management.
- **Details**: 
  - Create the project with the Vite CLI and configure Yarn workspace.
  - Install essential libraries: Phaser for game rendering, Redux for state management, Tailwind CSS for styling, and Jest for testing.
- **Test**: Run the project locally. Verify that a basic webpage loads in the browser without errors, showing a default template or blank screen.

### Step 2: Structure the Project Files
- **Instructions**: Organize the project into a clear, modular folder structure to separate game logic, UI, and assets.
- **Details**: 
  - Create top-level folders: `src/assets` (for images, sounds), `src/components` (React UI), `src/game` (game logic), `src/store` (state management), and `src/styles` (CSS).
  - Inside `src/game`, add subfolders: `combat`, `world`, `quests`, `inventory`, and `interfaces`.
  - Design the structure with scalability in mind, following Fallout 2 as a reference for game scale and complexity.
- **Test**: Create a dummy file in each folder (e.g., `test.ts`) and import it into the main entry file. Ensure no import errors occur when the project runs.

### Step 3: Embed the Game Engine
- **Instructions**: Integrate Phaser into a React component to display the game canvas.
- **Details**: 
  - Create a `GameCanvas` component in `src/components`.
  - Set up Phaser to render a blank scene (e.g., a solid color background) inside a `div`.
  - Establish the communication layer between Phaser and React/Redux.
- **Test**: Add the `GameCanvas` component to the main app. Verify that a blank game canvas appears in the browser, and check the console for Phaser initialization messages.

---

## Phase 2: Core Game Mechanics

### Step 4: Add Grid-Based Player Movement
- **Instructions**: Implement a scalable grid system for player movement in the game world.
- **Details**: 
  - Define an initial 10x10 grid in `src/game/world` for prototyping, but architect the system to support much larger maps (similar to Fallout 2's expansive areas).
  - Add a placeholder player sprite to the canvas and enable movement with arrow keys (up, down, left, right), shifting one tile per press.
  - Include basic obstacles (e.g., walls) on the grid.
- **Test**: Use arrow keys to move the player across the grid. Ensure the player stops at obstacles and cannot pass through them.

### Step 5: Build a Basic Combat System
- **Instructions**: Create a turn-based combat system with a player and one enemy.
- **Details**: 
  - Set up a combat manager in `src/game/combat`.
  - Give each entity (player and enemy) 6 Action Points (AP) per turn. Moving costs 1 AP per tile; attacking costs 2 AP and deals 5 damage.
  - Implement a simple enemy AI that can make basic decisions (approach player if far, attack if within range).
  - Alternate turns between player and enemy.
- **Test**: Trigger combat. Move the player (spending 1 AP per tile) and attack (spending 2 AP). Verify AP decreases correctly, damage is applied, and turns switch after AP is spent. Observe enemy AI behavior.

### Step 6: Introduce Cover Mechanics
- **Instructions**: Add a cover system to enhance combat strategy.
- **Details**: 
  - Mark specific grid tiles as "cover" (e.g., walls, barricades) that fit the dystopian setting.
  - Reduce attack hit chance by 50% if the target is behind cover.
  - Allow enemy AI to recognize and seek cover when at low health.
- **Test**: Position the player and enemy with a cover tile between them. Attack the enemy and confirm the hit chance is reduced. Move the enemy out of cover and verify the hit chance returns to normal.

---

## Phase 3: Exploration and World Interaction

### Step 7: Design a Small Explorable Map
- **Instructions**: Create a basic open world with multiple connected areas.
- **Details**: 
  - Use a tilemap to build an initial map with two distinct zones (e.g., "Slums" and "Downtown"), each at least 20x20 tiles to provide more exploration space.
  - Design the map architecture to support eventual expansion to Fallout 2-scale environments with multiple districts.
  - Add collision tiles (e.g., buildings, barriers) that match the dystopian setting from the backstory.
- **Test**: Walk the player from one zone to another. Ensure collision tiles stop movement and the transition between zones is seamless.

### Step 8: Add a Day-Night Cycle
- **Instructions**: Implement a day-night cycle affecting visibility and game mechanics.
- **Details**: 
  - Set a 5-minute cycle (2.5 minutes day, 2.5 minutes night).
  - Dim the screen (e.g., add a semi-transparent overlay) during night.
  - Incorporate elements from the backstory - like curfew mechanics or increased security at night.
- **Test**: Start the game and wait 5 minutes. Confirm the screen brightens at the start, dims after 2.5 minutes, and repeats the cycle. Verify that any time-based game mechanics activate appropriately.

## Phase 4: Command & City Systems

### Step 9: Establish Command Hub and Persisted Sessions
- **Instructions**: Build the command-center UI shell and wire up lightweight persistence for returning players.
- **Details**: 
  - Introduce a full-screen game menu that can start a new campaign, continue an existing run, and surface future options.
  - Restructure `App.tsx` into the three-column recon layout (status, game canvas, action log) to ground the HUD in resistance fiction.
  - Persist Redux state to localStorage, expose a `resetGame` action, and hydrate the store on load so the menu accurately reflects save availability.
- **Test**: Launch the app, start a game, reopen the menu, refresh the page, and confirm the continue button remains enabled and resumes state.

### Step 10: Harden Curfew Pressure and Cover Feedback
- **Instructions**: Make the curfew mechanic readable and enforceable while guiding players to safety.
- **Details**: 
  - Add a curfew alert state machine to `GameController` that issues a warning, spawns a single patrol if the player lingers exposed, and resets when cover is reached.
  - Highlight available cover tiles during curfew inside `MainScene` with animated overlays that coordinate with the day-night tint.
  - Cap log history and inject default curfew warnings so critical messages are visible even if the player has not acted yet.
- **Test**: With world time set to night, move the player in the open, verify a warning then one patrol spawn, and confirm re-entering cover clears the alert.

### Step 11: Expand Downtown into Enterable Megablocks
- **Instructions**: Scale the city into a contiguous grid with explorable interiors and richer population data.
- **Details**: 
  - Regenerate the world map as a larger combined district with neon infrastructure, cover placements, and door connections between streets and building interiors.
  - Auto-generate interior maps per building and register two-way `MapConnection`s so door traversal requires no bespoke code.
  - Seed NPC and item blueprints (with routines, dialogue ids, and loot tables) and ensure Redux world state keeps them consistent across area swaps.
- **Test**: Walk from the Slums into multiple interiors and back, verifying map redraws, player repositioning, and enemy persistence without scene restarts.

---

## Phase 5: Narrative and Quest Layer

### Step 12: Create an NPC with a Routine
- **Instructions**: Add a non-player character (NPC) that moves between locations.
- **Details**: 
  - Define an NPC in `src/game/world` with a schedule (e.g., moves from one location to another during the day).
  - Use basic pathfinding to guide the NPC.
  - Implement simple AI behavior reflecting the dystopian setting (e.g., a merchant, guard patrol, or civilian with routines).
- **Test**: Watch the NPC during the day phase. Verify it moves smoothly from start to end point without getting stuck.

### Step 13: Set Up a Dialogue System
- **Instructions**: Build a text-based dialogue system with choices that can reflect the game's backstory.
- **Details**: 
  - Create a dialogue manager in `src/game/quests`.
  - Define a simple dialogue tree with options that reflect the dystopian setting (e.g., NPC discusses curfew or regime authorities).
  - Display dialogue in a React overlay above the game canvas with a visually appropriate UI for the setting.
- **Test**: Interact with an NPC. Confirm the dialogue appears, choices are selectable, and the NPC's response changes based on the selection.

### Step 14: Add a Skill Check to Dialogue
- **Instructions**: Integrate a skill-based condition into dialogue options.
- **Details**: 
  - Define player skills relevant to the setting (e.g., Charisma, Intelligence, Stealth) with default values.
  - Add dialogue options that require skill checks (e.g., "Persuade" requiring Charisma > 5).
- **Test**: Set the required skill to a level below the threshold; the option should be locked. Increase it above the threshold; the option should unlock and work when selected.

### Step 15: Implement a Simple Quest
- **Instructions**: Create a basic quest with an objective and reward that fits the game's setting.
- **Details**: 
  - Define a quest in `src/game/quests` that reflects the game's backstory (e.g., "Deliver a message to a resistance member").
  - Track progress in state and show it in a React-based quest log.
  - Reward XP and possibly an item upon completion.
- **Status**: Completed — the Quest Log panel tracks active/closed quests, dialogue hooks award XP/credits/items, and rewards surface directly in the HUD.
- **Test**: Accept the quest, complete the objective, and turn it in. Verify the quest log updates and rewards are awarded correctly.

### Step 16: Seed Dialogue and Quest Threads
- **Instructions**: Stand up the narrative data layer that ties NPCs, quests, and rewards together.
- **Details**: 
  - Populate `questsSlice` with dialogue trees for key NPCs, including quest-triggering options and terminal nodes.
  - Author quest configurations with collect/talk objectives, reward payloads, and helper reducers for objective counters and completion state.
  - Keep dialogue state in Redux so UI components can drive conversations without local component state.
- **Test**: Dispatch dialogue and quest reducer actions (e.g., `startDialogue`, `startQuest`, `updateObjectiveCounter`) in Redux devtools and confirm quest state updates as expected.

## Phase 6: Visual and Navigation Upgrades

### Step 17: Pivot Rendering to a Neon Isometric Grid
- **Instructions**: Rebuild the scene renderer around an isometric projection that reinforces the game's style.
- **Details**: 
  - Recalculate tile metrics, camera bounds, and pointer hit detection to operate in isometric space while keeping movement/auth checks grid-based.
  - Layer in neon ambiance (gradients, canal strips, additive cover markers) and ensure overlays respect zoom and window resize events.
  - Synchronize the day-night tint with the new projection and eliminate flicker when visibility changes or the browser tab regains focus.
- **Test**: Playtest with aggressive zooming/resizing, verifying player movement, tile selection accuracy, and smooth overlay transitions through day/night.

### Step 18: Click-to-Move Navigation and Path Preview
- **Instructions**: Modernize free-roam navigation with click targeting and visual path confirmation.
- **Details**: 
  - Implement a breadth-first pathfinder that respects obstacles, enemies, and map bounds while allowing door traversal when applicable.
  - Emit pointer events from `MainScene`, preview the candidate route as isometric diamonds, and clear previews on map changes.
  - Extend `GameController` to execute queued paths, bridge door transitions automatically, and abort paths when combat or curfew restrictions intervene.
- **Test**: Click long-distance destinations across multiple doors, confirm the preview matches the executed path, and ensure curfew-locked doors cancel movement.

## Phase 7: Character Progression and Inventory

### Step 19: Define Player Stats
- **Instructions**: Set up character attributes that suit the dystopian setting.
- **Details**: 
  - Create a player profile in `src/game/interfaces` with appropriate stats (Strength, Perception, Endurance, etc. similar to Fallout's S.P.E.C.I.A.L. system).
  - Display stats in a React component with a UI that matches the game's aesthetic.
- **Test**: Load the game and check the stats UI. Change a stat value and confirm the UI reflects the update.

### Step 20: Add a Leveling System
- **Instructions**: Implement XP-based leveling.
- **Details**: 
  - Award XP for completing quests or defeating enemies.
  - Level up at 100 XP, granting skill points to improve character abilities.
  - Design the system to be expandable for higher levels and more complex progression.
- **Test**: Earn 100 XP through quests or combat. Confirm the player levels up and receives skill points that can be allocated.

### Step 21: Build an Inventory System
- **Instructions**: Create a weight-based inventory system.
- **Details**: 
  - Define an inventory in `src/game/inventory` with a realistic weight limit.
  - Add items appropriate to the setting (weapons, supplies, quest items).
  - Implement item categories and sorting options for scalability.
- **Test**: Add items until reaching near the weight limit, then try adding a heavy item. Verify the addition fails due to the weight limit. Check the inventory UI updates correctly.

## Phase 8: Testing and Final Touches

### Step 22: Test the Full Game
- **Instructions**: Playtest the base game to ensure all mechanics work together.
- **Details**: 
  - Explore the map, engage in combat, complete quests, and level up.
  - Focus on fixing gameplay issues and bugs as they appear rather than formal unit testing.
  - Ensure the game runs smoothly in modern browsers.
- **Test**: Confirm combat, exploration, dialogue, and progression function without crashes or major performance issues.

### Step 23: Expand Save Functionality
- **Instructions**: Upgrade the single-slot persistence into a full multi-slot save manager.
- **Details**: 
  - Provide a save/load interface that lists available slots, timestamps, and key metadata (location, time of day).
  - Support creating, overwriting, and deleting slots while reusing the Redux serialization logic established earlier.
  - Ensure save operations capture player stats, inventory, quest progress, world state, and menu visibility.
- **Test**: Create several saves at different progression points, reload each, and confirm the restored state matches the recorded metadata.

### Step 24: Polish the UI
- **Instructions**: Enhance the user interface for clarity and thematic consistency.
- **Details**: 
  - Style all UI elements (dialogue box, quest log, inventory, status displays) with consistent visuals that fit the dystopian setting.
  - Add tooltips to explain game mechanics and interface elements.
  - Ensure UI is responsive and performs well on modern browsers.
- **Test**: Open each UI element. Ensure they look cohesive and tooltips appear when hovering over interactive elements.

### Step 25: Surface Level & Objective HUD
- **Instructions**: Display the current level metadata and mission objectives directly in the game overlay.
- **Details**: 
  - Extend `MapArea` definitions with `level` numbers and objective lists (starting with Level 0 for the Slums sector).
  - Render a `LevelIndicator` panel in the HUD that mirrors the day/night widget placement, listing active tasks without blocking gameplay.
  - Ensure all map entities respect their building boundaries so overlays and sprites do not intersect structures.
- **Test**: Load Level 0 and verify the panel shows the level number and objectives, and that NPCs/items appear outside building footprints.

---

## Summary
This plan now outlines 25 implementable steps to build the base version of "The Getaway." It focuses on:
- **Command & Atmosphere**: Establishing the resistance command hub UI, neon isometric presentation, and curfew pressure loops.
- **Living World & Narrative**: NPC routines, branching dialogue with skill checks, and quest scaffolding tied into Redux.
- **Combat & Navigation**: Turn-based encounters with cover awareness, click-to-move traversal, and readable path previews.
- **Progression Systems**: Player stats, leveling, inventory, and loot structures.
- **Stability & Polish**: Save/load expansion, holistic playtests, and UI refinement.

Each step includes a concrete validation target to keep development measurable. The architecture prioritizes modularity and scalability, drawing inspiration from Fallout 2 while focusing on a maintainable modern web stack. Iterative playtesting complements automated checks to preserve feel and performance.

The resulting foundation positions the project for future additions like advanced quest arcs, expanded districts, faction interplay, or even multiplayer while keeping the codebase approachable.
