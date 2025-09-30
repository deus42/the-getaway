# Project Progress

<step id="1" status="completed">
<step_metadata>
  <number>1</number>
  <title>Initialize the Project</title>
  <status>Completed</status>
  <date>March 26, 2024</date>
</step_metadata>

<tasks>
1. Scaffolded a Vite + React + TypeScript workspace with Phaser, Redux Toolkit, Tailwind CSS, and Jest.
2. Established the agreed `/memory-bank` + `/the-getaway` repository layout and seeded placeholder modules.
3. Wired Tailwind/PostCSS, configured Jest, created a basic `GameCanvas`, and bootstrapped the Redux store.
</tasks>

<notes>
- Development server renders a placeholder Phaser canvas and the tooling baseline is ready for feature work.
</notes>
</step>

<step id="2" status="completed">
<step_metadata>
  <number>2</number>
  <title>Structure the Project Files</title>
  <status>Completed</status>
  <date>March 26, 2024</date>
</step_metadata>

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

<tasks>
1. Stabilized combat edge cases with a new `BootScene` and lifecycle fixes.
2. Delivered the three-column command hub (Status | Canvas | Log) with `PlayerStatusPanel` and `LogPanel`.
3. Refined grid rendering for consistent borders and smooth resizes.
</tasks>
</step>

<step id="7" status="completed">
<step_metadata>
  <number>7</number>
  <title>Design a Small Explorable Map</title>
  <status>Completed</status>
  <date>June 7, 2025</date>
</step_metadata>

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

<tasks>
1. Added the `GameMenu` overlay with start/continue flows.
2. Finalized the three-column HUD and collapsed telemetry into `PlayerStatusPanel`.
3. Introduced Redux persistence (`resetGame`, localStorage hydration).
</tasks>
</step>

<step id="10" status="completed">
<step_metadata>
  <number>10</number>
  <title>Harden Curfew Pressure and Cover Feedback</title>
  <status>Completed</status>
  <date>September 25, 2025</date>
</step_metadata>

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

<tasks>
1. Populated `questsSlice` with branching dialogue trees for Lira, Naila, and Brant.
2. Authored three quest lines with objectives, counters, and rewards.
3. Added reducers for objective progress, collectibles, and dialogue state.
</tasks>

<validation>
- `yarn test src/__tests__/dialogueOverlay.test.tsx --watch=false`
</validation>
</step>

<step id="17" status="completed">
<step_metadata>
  <number>17</number>
  <title>Pivot Rendering to Neon Isometric Grid</title>
  <status>Completed</status>
  <date>September 26, 2025</date>
</step_metadata>

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

<tasks>
1. Implemented breadth-first pathfinding with enemy avoidance and door awareness.
2. Emitted tile click events, rendered path previews, and queued path execution in `GameController`.
3. Expanded camera/log handling for long routes and synced `tsconfig` with the new event modules.
</tasks>

<validation>
- Manual roam tests covering long-distance travel, door traversal, and curfew restrictions.
</validation>
</step>

<step id="19" status="completed">
<step_metadata>
  <number>19</number>
  <title>Implement Guard Perception & Alert States</title>
  <status>Completed</status>
  <date>September 29, 2025</date>
</step_metadata>

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

<step id="21" status="completed">
<step_metadata>
  <number>21</number>
  <title>Transition Scene Rendering to Isometric 2.5-D</title>
  <status>Completed</status>
  <date>October 3, 2025</date>
</step_metadata>

<tasks>
1. Centralised isometric helpers (`getIsoMetrics`, `toPixel`, `getDiamondPoints`, `adjustColor`) in `src/game/utils/iso.ts` and added `iso.test.ts` to cover projection and colour math.
2. Introduced `IsoObjectFactory` for reusable props (e.g., crates, highlight diamonds) and refactored `MainScene` to consume the shared helpers, ensuring depth sorting and iso origins stay consistent.
3. Wired the turn-tracker HUD into the centre stage, added sample decorative props via the factory, and verified rendering uses uniform 2:1 assets with intact collision hotspots.
4. Elevated wall and cover tiles into full 2.5-D prisms with dynamic shadows, neon facade bands, and door overlays that project onto the front face.
</tasks>

<maintenance_notes date="October 3, 2025">
- Reworked `MainScene.renderTile` to apply elevation profiles, extruded faces, and updated door treatments for the isometric layout overhaul.
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