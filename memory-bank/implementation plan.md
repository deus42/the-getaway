# Implementation Plan for "The Getaway" (Base Game)

<phase id="1" name="Project Setup and Core Infrastructure">
<step id="1" status="completed">
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

<step id="2" status="completed">
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

<step id="3" status="completed">
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
<step id="4" status="completed">
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

<step id="5" status="completed">
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

<step id="6" status="completed">
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
<step id="7" status="completed">
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

<step id="8" status="completed">
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
<step id="9" status="completed">
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

<step id="10" status="completed">
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

<step id="11" status="completed">
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
</phase>

<phase id="5" name="Narrative and Quest Layer">
<step id="12" status="completed">
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

<step id="13" status="completed">
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

<step id="14" status="completed">
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

<step id="15" status="completed">
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

<step id="16" status="completed">
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
</phase>

<phase id="6" name="Visual and Navigation Upgrades">
<step id="17" status="completed">
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

<step id="18" status="completed">
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

<step id="19" status="completed">
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

<step id="20" status="completed">
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

<step id="21" status="completed">
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
<step id="22" status="pending">
<step_metadata>
  <number>22</number>
  <title>Define Player Stats</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<instructions>
Set up character attributes that suit the dystopian setting.
</instructions>

<details>
- Create a player profile in `src/game/interfaces` with appropriate stats (Strength, Perception, Endurance, etc. similar to Fallout's S.P.E.C.I.A.L. system).
- Display stats in a React component with a UI that matches the game's aesthetic.
</details>

<test>
Load the game and check the stats UI. Change a stat value and confirm the UI reflects the update.
</test>
</step>

<step id="23" status="pending">
<step_metadata>
  <number>23</number>
  <title>Add a Leveling System</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<instructions>
Implement XP-based leveling.
</instructions>

<details>
- Award XP for completing quests or defeating enemies.
- Level up at 100 XP, granting skill points to improve character abilities.
- Design the system to be expandable for higher levels and more complex progression.
</details>

<test>
Earn 100 XP through quests or combat. Confirm the player levels up and receives skill points that can be allocated.
</test>
</step>

<step id="24" status="pending">
<step_metadata>
  <number>24</number>
  <title>Build an Inventory System</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<instructions>
Create a weight-based inventory system.
</instructions>

<details>
- Define an inventory in `src/game/inventory` with a realistic weight limit.
- Add items appropriate to the setting (weapons, supplies, quest items).
- Implement item categories and sorting options for scalability.
</details>

<test>
Add items until reaching near the weight limit, then try adding a heavy item. Verify the addition fails due to the weight limit. Check the inventory UI updates correctly.
</test>
</step>
</phase>

<phase id="8" name="Testing and Final Touches">
<step id="25" status="pending">
<step_metadata>
  <number>25</number>
  <title>Test the Full Game</title>
  <phase>Phase 8: Testing and Final Touches</phase>
</step_metadata>

<instructions>
Playtest the base game to ensure all mechanics work together.
</instructions>

<details>
- Explore the map, engage in combat, complete quests, and level up.
- Focus on fixing gameplay issues and bugs as they appear rather than formal unit testing.
- Ensure the game runs smoothly in modern browsers.
</details>

<test>
Confirm combat, exploration, dialogue, and progression function without crashes or major performance issues.
</test>
</step>

<step id="26" status="pending">
<step_metadata>
  <number>26</number>
  <title>Expand Save Functionality</title>
  <phase>Phase 8: Testing and Final Touches</phase>
</step_metadata>

<instructions>
Upgrade the single-slot persistence into a full multi-slot save manager.
</instructions>

<details>
- Provide a save/load interface that lists available slots, timestamps, and key metadata (location, time of day).
- Support creating, overwriting, and deleting slots while reusing the Redux serialization logic established earlier.
- Ensure save operations capture player stats, inventory, quest progress, world state, and menu visibility.
</details>

<test>
Create several saves at different progression points, reload each, and confirm the restored state matches the recorded metadata.
</test>
</step>

<step id="27" status="pending">
<step_metadata>
  <number>27</number>
  <title>Polish the UI</title>
  <phase>Phase 8: Testing and Final Touches</phase>
</step_metadata>

<instructions>
Enhance the user interface for clarity and thematic consistency.
</instructions>

<details>
- Style all UI elements (dialogue box, quest log, inventory, status displays) with consistent visuals that fit the dystopian setting.
- Add tooltips to explain game mechanics and interface elements.
- Ensure UI is responsive and performs well on modern browsers.
</details>

<test>
Open each UI element. Ensure they look cohesive and tooltips appear when hovering over interactive elements.
</test>
</step>

<step id="28" status="pending">
<step_metadata>
  <number>28</number>
  <title>Surface Level & Objective HUD</title>
  <phase>Phase 8: Testing and Final Touches</phase>
</step_metadata>

<instructions>
Display the current level metadata and mission objectives directly in the game overlay.
</instructions>

<details>
- Extend `MapArea` definitions with `level` numbers and objective lists (starting with Level 0 for the Slums sector).
- Render a `LevelIndicator` panel in the HUD that mirrors the day/night widget placement, listing active tasks without blocking gameplay.
- Ensure all map entities respect their building boundaries so overlays and sprites do not intersect structures.
</details>

<test>
Load Level 0 and verify the panel shows the level number and objectives, and that NPCs/items appear outside building footprints.
</test>
</step>
</phase>

<summary>
## Summary

This plan now outlines 28 implementable steps to build the base version of "The Getaway." It focuses on:

<focus_areas>
- **Command & Atmosphere**: Establishing the resistance command hub UI, neon isometric presentation, and curfew pressure loops.
- **Living World & Narrative**: NPC routines, branching dialogue with skill checks, and quest scaffolding tied into Redux.
- **Combat & Navigation**: Turn-based encounters with cover awareness, guard perception loops, click-to-move traversal, and readable path previews.
- **City Layout & Access**: NYC-inspired district blocks with single-entry buildings, localized naming, and door placement aligned to streets for clarity.
- **Rendering & Visuals**: Shared isometric utilities, reusable object factories, and a dedicated 2.5-D rendering pipeline.
- **Progression Systems**: Player stats, leveling, inventory, and loot structures.
- **Stability & Polish**: Save/load expansion, holistic playtests, and UI refinement.
</focus_areas>

Each step includes a concrete validation target to keep development measurable. The architecture prioritizes modularity and scalability, drawing inspiration from Fallout 2 while focusing on a maintainable modern web stack. Iterative playtesting complements automated checks to preserve feel and performance.

The resulting foundation positions the project for future additions like advanced quest arcs, expanded districts, faction interplay, or even multiplayer while keeping the codebase approachable.
</summary>