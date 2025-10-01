# Implementation Plan for "The Getaway" (Base Game)

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
  - Every 3 levels (3, 6, 9...), grant 1 attribute point (player chooses which attribute to increase)
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
Award XP through various sources (complete quest, defeat enemy, discover location) and verify XP counter increases with toast notifications. Verify XP formula matches specification: reach 115 XP and confirm level-up to 2, reach 345 total XP and confirm level 3. Trigger level-up and verify modal appears with correct skill points awarded (test with different Intelligence values). Verify attribute points granted every 3 levels. Award 500 XP at once and confirm multiple sequential level-ups process correctly. Check XP progress bar updates in real-time.
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

<step id="25">
<step_metadata>
  <number>25</number>
  <title>Expand Inventory System with Equipment and Durability</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<prerequisites>
- Basic inventory interface already exists (check `src/content/ui/index.ts` for current implementation)
- Step 23.5 completed (equipment effects integration)
</prerequisites>

<instructions>
Expand the existing inventory system with equipment slots, durability mechanics, weight-based encumbrance, and comprehensive item categorization.
</instructions>

<details>
- **Audit existing inventory implementation**: Review current inventory interface in `src/content/ui/index.ts` and Redux state. Identify what's already implemented vs what needs to be added.
- **Add equipment slot system** to `inventorySlice`:
  - Define equipment slots: `primaryWeapon`, `secondaryWeapon`, `meleeWeapon`, `bodyArmor`, `helmet`, `accessory1`, `accessory2`
  - Implement `equipItem(itemId, slotType)` and `unequipItem(slotType)` actions
  - Add validation: weapons only in weapon slots, armor only in armor slots, one-handed/two-handed weapon restrictions
- **Expand item data structures** in `src/content/items/`:
  - Add properties: `weight` (kg), `value` (credits), `durability` (current/max), `equipSlot`, `statModifiers`, `stackable`, `stackSize`
  - Categorize items: Weapons (melee, ballistic, energy, thrown), Armor (light/medium/heavy), Consumables (medical, food, drugs), Ammo (by caliber), Tools (lockpicks, hacking devices), Crafting Materials, Quest Items
- **Implement durability system**:
  - Weapons/armor degrade with use: -1 durability per attack/hit taken
  - At 50% durability: -10% effectiveness (damage/protection)
  - At 25% durability: -25% effectiveness
  - At 0% durability: item breaks and becomes unusable until repaired
  - Add repair mechanics: use repair kits (consumable) or visit workshop (costs credits + materials)
- **Add weight-based encumbrance** using Strength-derived carry weight:
  - Calculate `totalWeight` = sum of all inventory item weights
  - Max carry weight from Step 23: `25 + (strength * 5)` kg
  - **Encumbrance penalties**:
    - 80-100% capacity: -1 AP (yellow warning in UI)
    - 100-120% capacity: -2 AP, movement speed halved (orange warning)
    - >120% capacity: cannot move, must drop items (red error)
  - Display weight fraction in inventory UI: "45/55 kg (82%)"
- **Build enhanced InventoryPanel.tsx**:
  - Left panel: Equipment slots (drag/drop items to equip, click to unequip)
  - Center panel: Item list with filters (All/Weapons/Armor/Consumables/Materials)
  - Right panel: Selected item details (stats, durability bar, weight, value, description)
  - Sorting options: by name, type, weight, value, durability
  - Color-code durability: green (75-100%), yellow (50-75%), orange (25-50%), red (0-25%)
- **Implement item stacking**:
  - Stackable items (ammo, consumables) combine into single inventory slot with quantity counter
  - Max stack size varies by item (ammo: 999, grenades: 10, medkits: 5)
  - Split stack functionality for distributing items
- **Add quick-use hotkeys**: Number keys 1-5 for hotbar slots (assign consumables for quick access in combat).
</details>

<accessibility>
- Equipment slots keyboard navigable (Tab to cycle, Enter to equip/unequip)
- Screen reader announces weight capacity changes: "Inventory weight 45 of 55 kilograms, 82% capacity"
- Durability warnings accessible: "Weapon durability low, 15 of 60 remaining"
</accessibility>

<test>
Open inventory and verify equipment slots display with drag-and-drop functionality. Equip weapon in primary slot and verify stat bonuses apply (check Step 23.5 integration). Equip armor and confirm weight increases, encumbrance percentage updates. Add items until reaching 80% capacity and verify AP penalty applies. Exceed 100% capacity and confirm movement is prevented with error message. Use equipped weapon repeatedly until durability drops below 50% and verify damage reduction. Break weapon (0 durability) and confirm it becomes unusable. Use repair kit to restore durability. Stack ammo types and verify quantities combine. Filter inventory by category (Weapons only) and verify only weapons display. Sort by weight and verify ordering. Assign consumable to hotbar and use hotkey in combat to consume instantly.
</test>
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

<step id="27.1">
<step_metadata>
  <number>27.1</number>
  <title>Vehicle Acquisition and Storage (Motorcycle Only, Basic Trunk)</title>
  <phase>Phase 9: Optional Expansions (POST-MVP)</phase>
</step_metadata>

<instructions>
⚠️ **POST-MVP - Defer to v1.1+**: This feature significantly expands scope and should only be implemented after the core game is stable and thoroughly tested.

Implement a simplified vehicle system focused on a single motorcycle type with basic storage functionality. NO combat integration, NO complex upgrades, NO multiple vehicle types.
</instructions>

<details>
**Scope Limitation**: Motorcycle-only system for mobility enhancement, not a full vehicle simulation.

- **Create motorcycle acquisition** in `src/game/vehicles/motorcycleSystem.ts`:
  - **Single acquisition method**: Quest reward from "Scavenger's Prize" quest (given by Scavenger faction at Friendly reputation)
  - **Quest objective**: Retrieve 3 Electronic Parts and 1 Fuel Tank from Industrial Wasteland, return to Scavenger mechanic
  - **Quest reward**: Functional motorcycle + basic riding tutorial
  - **No alternative methods**: No purchase, no theft, no other vehicle types

- **Implement motorcycle properties**:
  - **Speed multiplier**: 3x normal movement speed on roads (reduces tile-to-tile travel time by 66%)
  - **Storage capacity**: 15-slot trunk separate from player inventory (accessed via "V" hotkey or vehicle menu)
  - **Fuel system**: Consumes 1 Fuel Unit per 20 tiles traveled (Fuel Units are stackable inventory items, max stack 10)
  - **Durability**: NOT IMPLEMENTED - vehicle cannot be damaged or destroyed in this simplified version
  - **No upgrades**: No modification, no armor, no weapons - motorcycle functions as-is

- **Build trunk storage system**:
  - Create `VehicleTrunkPanel.tsx` in `src/components/ui/`
  - **Access condition**: Only accessible when player is within 2 tiles of parked motorcycle
  - **Trunk interface**: 15-slot grid (5×3), accepts all item types except quest items
  - **Weight limit**: 100 kg total (prevents over-stuffing, display weight counter)
  - **Use case**: Stash extra weapons, ammo, medical supplies, crafting materials for zone exploration
  - **Persistence**: Trunk contents saved with game state, survives zone transitions

- **Implement fuel management**:
  - **Fuel source**: Fuel Units purchased from traders (10 credits each) or looted from Industrial Wasteland (5-8 locations)
  - **Consumption display**: Show remaining fuel in vehicle UI (e.g., "Fuel: 7/10 units, ~140 tiles range")
  - **Out of fuel behavior**: Motorcycle stops moving, displays "Out of Fuel" warning, player must walk to motorcycle with Fuel Unit and refuel (interaction prompt)
  - **Refueling**: Opens inventory, select Fuel Unit, click "Refuel Motorcycle" - adds fuel instantly

- **Add motorcycle parking/retrieval system**:
  - **Parking**: Right-click motorcycle sprite → "Park Motorcycle Here" - vehicle becomes stationary map object at current tile
  - **Zone transitions**: Motorcycle automatically follows player between zones (teleports to zone entry point)
  - **Visual indicator**: Parked motorcycle shows as motorcycle sprite on map, displays interaction prompt when player approaches
  - **Mounting**: Press "M" key or click motorcycle → player mounts, movement speed increases, trunk becomes accessible

**Formulas**:
- Travel time reduction: `baseTravelTime / 3` when mounted on roads
- Fuel consumption: `Math.ceil(tilesTraveled / 20)` Fuel Units consumed
- Trunk weight check: `sum(item.weight * item.quantity) <= 100`

**NO Combat Integration**: If combat triggers while mounted, player automatically dismounts, motorcycle disappears from combat grid. Vehicle system is exploration-only.

**NO Fast-Travel**: Fast-travel system deferred to v1.2+ (requires additional map infrastructure).
</details>

<prerequisites>
- Step 23 (Expanded Inventory System) must be completed for trunk interface integration
- Step 29 (Faction Reputation System) must be completed for quest prerequisite
- Step 31 (Industrial Wasteland Zone) must be completed for fuel/parts loot locations
</prerequisites>

<test>
Complete "Scavenger's Prize" quest by collecting 3 Electronic Parts and 1 Fuel Tank from Industrial Wasteland. Return to Scavenger mechanic and verify motorcycle reward. Press "M" to mount motorcycle and confirm 3x movement speed on roads (measure tile-to-tile time). Travel 20+ tiles and verify 1 Fuel Unit consumed. Press "V" to open trunk, store 10 different items (weapons, ammo, supplies), close trunk and move away. Return to motorcycle, reopen trunk, verify all items persist. Fill trunk to 100 kg and attempt to add more, verify weight limit warning. Deplete all fuel by traveling 200+ tiles, verify motorcycle stops and "Out of Fuel" message appears. Walk to motorcycle with Fuel Unit, interact and refuel, verify fuel counter increases and motorcycle functions again. Transition between zones (Downtown → Slums) and confirm motorcycle follows player to new zone. Enter combat while mounted and verify automatic dismount (motorcycle not present on combat grid).
</test>
</step>

<step id="27.2">
<step_metadata>
  <number>27.2</number>
  <title>Vehicle Travel Movement (Fuel Consumption, 3x Movement Speed)</title>
  <phase>Phase 9: Optional Expansions (POST-MVP)</phase>
</step_metadata>

<instructions>
⚠️ **POST-MVP - Defer to v1.1+**: This feature significantly expands scope and should only be implemented after the core game is stable and thoroughly tested.

Implement the movement mechanics for the motorcycle system, focusing on speed enhancement and fuel consumption tracking during exploration.
</instructions>

<details>
**Scope**: Movement enhancement only - no combat, no upgrades, no complex interactions.

- **Implement speed multiplier system** in `src/game/world/movementSystem.ts`:
  - **Road detection**: Tag road tiles in map data with `terrain: "road"` property (modify Downtown, Slums, Industrial Wasteland map files)
  - **Speed calculation**: When mounted, check tile type → if `terrain === "road"`, apply 3x speed multiplier
  - **Off-road penalty**: Non-road tiles (dirt, rubble, indoor) → 1.5x speed multiplier (still faster than walking, but reduced)
  - **Formula**: `movementTime = baseTileTime / (isRoad ? 3 : 1.5)` where baseTileTime = 500ms per tile
  - **Example**: Normal walking = 500ms/tile, motorcycle on road = 167ms/tile, motorcycle off-road = 333ms/tile

- **Build fuel consumption tracker**:
  - Create `fuelTracker.ts` in `src/game/vehicles/`
  - **Tracking mechanism**: Increment tile counter each time player moves while mounted, check `tilesMovedSinceLastConsumption`
  - **Consumption trigger**: When `tilesMovedSinceLastConsumption >= 20`, deduct 1 Fuel Unit from motorcycle fuel pool, reset counter
  - **Fuel pool**: Separate from inventory, max 10 Fuel Units stored in vehicle tank (refueling transfers from inventory to tank)
  - **Display**: Show fuel gauge in HUD when mounted ("Fuel: ⛽ 7/10 | Range: ~140 tiles")

- **Implement low fuel warnings**:
  - **Warning thresholds**:
    - 3 Fuel Units remaining (60 tiles range): Yellow warning icon in HUD, message "Low Fuel - Refuel Soon"
    - 1 Fuel Unit remaining (20 tiles range): Red warning icon, message "Critical Fuel - Find Fuel Immediately"
    - 0 Fuel Units: Motorcycle immobilized, message "Out of Fuel - Cannot Move Until Refueled"
  - **Audio cue**: Play warning sound at each threshold (optional, low priority)

- **Add refueling interaction**:
  - **Refuel while mounted**: Open inventory ("I" key), select Fuel Unit item → "Refuel" button appears → click to add to tank (max 10 total)
  - **Refuel while parked**: Approach parked motorcycle, interaction prompt "Refuel Motorcycle [E]" → opens inventory → select Fuel Units → transfer to tank
  - **Bulk refueling**: If player has 5 Fuel Units and tank has 3/10 capacity, allow "Refuel Max" button to transfer 7 units (filling to 10/10)

- **Create road tile tagging**:
  - **Downtown map**: Tag main streets (vertical/horizontal thoroughfares) as `terrain: "road"` - approximately 30% of explorable tiles
  - **Slums map**: Tag 2 main roads connecting entry points as `terrain: "road"` - approximately 15% of tiles (mostly dirt/rubble)
  - **Industrial Wasteland map**: Tag access roads between factory complexes as `terrain: "road"` - approximately 20% of tiles
  - **Visual indicator**: Darker asphalt texture for road tiles (optional, low priority - can use existing tiles)

- **Integrate with movement input**:
  - Modify `handlePlayerMovement()` in `src/game/world/playerController.ts`:
    - Check if player has motorcycle equipped: `playerState.hasMotorcycle && playerState.isMounted`
    - If mounted, apply speed multiplier based on target tile terrain
    - After movement, call `fuelTracker.recordMovement(targetTile)` to update fuel consumption
  - **Dismount conditions**: Player can manually dismount ("M" key toggle), or auto-dismount when entering building interiors

**Formulas**:
- Movement speed: `tileTime = 500 / (isMounted ? (isRoad ? 3 : 1.5) : 1)` ms
- Fuel consumption: `fuelUnitsConsumed = Math.floor(totalTilesMoved / 20)`
- Range calculation: `remainingRange = remainingFuel * 20` tiles

**Performance Considerations**:
- Cache terrain type checks to avoid repeated map lookups
- Update fuel display only when fuel value changes (not every frame)
- Throttle warning messages to once per threshold crossing (don't spam)

**NO Combat Integration**: This step is purely exploration movement - combat interactions explicitly excluded.
</details>

<prerequisites>
- Step 27.1 (Vehicle Acquisition and Storage) must be completed first
- Step 4 (Grid-Based Player Movement) provides foundation for movement system extension
- Step 12 (Day/Night Cycle) provides HUD integration reference for fuel gauge
</prerequisites>

<test>
Mount motorcycle and travel across Downtown on main roads, measure tile-to-tile time and verify 167ms per tile (3x speed). Travel off-road (dirt, rubble tiles) and verify 333ms per tile (1.5x speed). Move exactly 20 tiles and verify 1 Fuel Unit consumed, fuel gauge updates to 9/10. Continue traveling and verify fuel consumption occurs every 20 tiles consistently. Reduce fuel to 3 units and verify yellow warning appears with "Low Fuel" message. Reduce to 1 unit and verify red warning appears with "Critical Fuel" message. Deplete fuel completely and verify motorcycle stops moving, "Out of Fuel" message displays. Open inventory while mounted, select Fuel Unit item, click "Refuel" and verify fuel gauge increases to 1/10, motorcycle can move again. Travel 10 more tiles (0.5 fuel units worth) and refuel to verify partial consumption tracked correctly. Dismount and re-mount motorcycle, verify fuel state persists. Transition zones and verify fuel level carries over. Enter building interior and verify auto-dismount occurs. Test "Refuel Max" button with multiple Fuel Units and verify bulk transfer to tank works correctly (fills to 10 max).
</test>
</step>

<step id="28.1">
<step_metadata>
  <number>28.1</number>
  <title>Hunger and Thirst Meters (Optional Survival Mode Toggle)</title>
  <phase>Phase 9: Optional Expansions (POST-MVP)</phase>
</step_metadata>

<instructions>
⚠️ **POST-MVP - Defer to v1.1+**: This feature significantly expands scope and should only be implemented after the core game is stable and thoroughly tested.

Add optional survival mechanics with ONLY hunger and thirst meters. NO disease, NO injuries, NO radiation, NO fatigue. Implemented as a toggleable "Survival Mode" in difficulty settings.
</instructions>

<details>
**Scope Limitation**: Simple hunger/thirst system only, disabled by default. NOT a full survival simulation.

- **Create survival mode toggle** in `src/game/settings/gameSettings.ts`:
  - **Settings screen**: Add checkbox "Enable Survival Mode (Hunger & Thirst)" under Gameplay settings
  - **Default**: Disabled (survival mode is opt-in for players who want extra challenge)
  - **Cannot toggle mid-game**: Setting locked once character is created (prevents exploit/confusion)
  - **Warning message**: "Survival Mode adds hunger and thirst requirements. This cannot be changed after starting."

- **Implement hunger meter** in `src/game/interfaces/survivalSystem.ts`:
  - **Meter range**: 0-100 (100 = fully fed, 0 = starving)
  - **Depletion rate**: -1 point per 5 real-time minutes of play (20 points per 100 minutes = ~1.5 hours gameplay per "day")
  - **Threshold penalties**:
    - 70-100 (Well Fed): No penalties
    - 40-69 (Hungry): -1 Strength, health regen disabled
    - 15-39 (Very Hungry): -2 Strength, -1 Perception, -5% max HP
    - 0-14 (Starving): -3 Strength, -2 Perception, -10% max HP, -5 HP per 5 minutes (starvation damage)
  - **Formula**: `newHunger = max(0, currentHunger - (timePassed / 300000) * 1)` (timePassed in milliseconds)

- **Implement thirst meter** in same system file:
  - **Meter range**: 0-100 (100 = fully hydrated, 0 = dehydrated)
  - **Depletion rate**: -1 point per 3 real-time minutes of play (faster than hunger, 20 points per 60 minutes)
  - **Threshold penalties**:
    - 70-100 (Hydrated): No penalties
    - 40-69 (Thirsty): -1 max AP, -5% max HP
    - 15-39 (Very Thirsty): -2 max AP, -10% max HP, movement speed -20%
    - 0-14 (Dehydrated): -3 max AP, -15% max HP, -10 HP per 3 minutes (dehydration damage)
  - **Formula**: `newThirst = max(0, currentThirst - (timePassed / 180000) * 1)` (timePassed in milliseconds)

- **Add food consumption system**:
  - **Food items** (add to existing item definitions in `src/content/items/consumables.ts`):
    - Canned Food: +30 hunger, common loot (50 credits purchase, 0.5 kg weight)
    - Dried Rations: +25 hunger, common loot (30 credits, 0.3 kg)
    - Cooked Meat: +40 hunger, crafted or rare loot (not sold, 0.4 kg)
    - Candy Bar: +10 hunger, common loot (10 credits, 0.1 kg)
  - **Consumption**: Open inventory, right-click food item → "Eat" → hunger increases, item consumed
  - **Cap at 100**: Cannot overfeed (eating at 85 hunger with +30 food = 100, +15 wasted)
  - **No spoilage**: Food items don't expire (complexity removed)

- **Add water consumption system**:
  - **Water items**:
    - Bottled Water: +40 thirst, common loot (20 credits, 0.5 kg)
    - Purified Water: +50 thirst, crafted from Contaminated Water + Purification Tablet (30 credits for tablet, 0.5 kg)
    - Contaminated Water: +30 thirst BUT -10 HP damage (not recommended, free loot in Industrial Wasteland)
  - **Consumption**: Right-click water item → "Drink" → thirst increases, item consumed
  - **Cap at 100**: Cannot over-hydrate
  - **NO disease system**: Contaminated Water only does flat HP damage, no complex disease mechanics

- **Build survival UI** in `src/components/ui/SurvivalHUD.tsx`:
  - **HUD placement**: Small panel in top-right corner (next to time/karma displays), only visible when Survival Mode enabled
  - **Hunger icon**: Fork/knife icon with colored bar (green = 70+, yellow = 40-69, red = <40)
  - **Thirst icon**: Water droplet icon with colored bar (same color coding)
  - **Hover tooltip**: Shows exact values (e.g., "Hunger: 45/100 - Hungry (-1 STR, no regen)")
  - **Warning messages**: When crossing thresholds, brief message appears: "You are getting hungry" / "You are very thirsty"

- **Integrate penalties with stat system**:
  - Modify `calculateDerivedStats()` in `src/game/interfaces/playerStats.ts`:
    - Check `survivalMode.enabled && survivalMode.hunger < 70` → apply Strength penalty
    - Check `survivalMode.thirst < 70` → apply AP penalty
    - Adjust max HP calculations based on thresholds
  - Apply damage over time in game loop when starving/dehydrated

**Formulas Summary**:
- Hunger depletion: `1 point per 5 minutes = 0.2 per minute`
- Thirst depletion: `1 point per 3 minutes = 0.333 per minute`
- Starvation damage: `5 HP per 5 minutes when hunger < 15`
- Dehydration damage: `10 HP per 3 minutes when thirst < 15`

**Excluded Features** (explicitly NOT implemented):
- NO Fatigue system
- NO Radiation system
- NO Injury system (bleeding, broken bones)
- NO Disease system beyond Contaminated Water direct damage
- NO cooking/preparation mechanics (just consume items)
- NO food spoilage
- NO difficulty scaling of depletion rates (fixed rates only)

**Balance Note**: System designed for players who want light survival challenge, not hardcore simulation. Penalties are noticeable but not punishing. Food/water items common enough in loot that survival is manageable with basic resource management.
</details>

<prerequisites>
- Step 23 (Expanded Inventory System) must be completed for food/water item integration
- Step 12 (Day/Night Cycle) provides timing reference for real-time meter depletion
- Existing playerStats.ts interface (from Steps 22-23) for stat penalty integration
</prerequisites>

<performance>
- Update survival meters maximum once per second (not every frame) to reduce computation
- Cache penalty calculations, only recalculate when meter values cross thresholds
- Survival HUD only renders when Survival Mode enabled (zero overhead when disabled)
</performance>

<test>
Create new character with "Enable Survival Mode" checked and verify hunger/thirst meters appear in HUD at 100/100. Play for 15 real-time minutes and verify hunger drops to ~97 and thirst drops to ~95. Wait until hunger reaches 65 and verify "Hungry" status appears in tooltip, -1 Strength penalty applies to character sheet. Eat Canned Food (+30) and verify hunger increases to 95, penalty removed. Wait until thirst reaches 35 and verify "Very Thirsty" status, -2 max AP penalty applies. Drink Bottled Water (+40) and verify thirst increases to 75, penalties removed. Deplete hunger to 10 (starving) and verify -3 STR, -2 PER, -10% max HP, and 5 HP damage per 5 minutes occurs. Eat Cooked Meat and verify full recovery. Drink Contaminated Water and verify +30 thirst but -10 HP damage. Test with Survival Mode disabled and verify no meters appear, no depletion occurs. Attempt to enable Survival Mode mid-game and verify setting is locked with warning message. Save game with Survival Mode enabled, reload, and verify meter states persist correctly.
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
  <title>Build Industrial Wasteland Zone with Concrete Specifications</title>
  <phase>Phase 8: World Expansion</phase>
</step_metadata>

<instructions>
Create the Industrial Wasteland as an 80×80 tile high-danger zone with specific environmental hazards, 5 enemy types, and 3 zone-specific quests.
</instructions>

<details>
- **Design map structure** in `src/content/maps/industrialWasteland.ts`:
  - **Size**: 80×80 tiles (4x larger than Slums/Downtown starter zones)
  - **Layout**: 3 major factory complexes (north, center, south), outdoor toxic yards connecting them, underground tunnels network (15×15 tile subsection)
  - **Key landmarks**: Refinery (north), Assembly Plant (center), Chemical Storage (south), Scavenger Camp (northeast safe zone), Collapsed Bridge (western boundary)
  - **Entry points**: 2 connections from Downtown (eastern gate, requires no reputation), 1 from Slums (southern border, requires Scavengers Neutral or better)
- **Implement 4 specific environmental hazards**:
  - **Toxic Gas Clouds** (yellow-green overlay): 10 HP/turn damage without Gas Mask. 40% of outdoor areas affected. Gas Mask (equipment slot) provides immunity.
  - **Radiation Pockets** (purple glow effect): +2 radiation/turn exposure. 15% of factory interiors affected. Hazmat Suit or Anti-Rad Meds required.
  - **Chemical Spills** (orange puddles): 15 HP acid damage on entering tile, corrodes armor (-5 durability/turn standing in it). 8-10 spill locations scattered across map.
  - **Smog (Low Visibility)**: Reduce perception range from 12 tiles to 6 tiles in outdoor areas. Flashlight item extends to 9 tiles. Always active in outdoor Industrial Wasteland.
- **Create 5 zone-specific enemy types**:
  - **Industrial Robots** (Level 8-10): 120 HP, 8 armor rating. Weak to EMP (-50% HP from EMP grenades). Drop: Electronic Parts (×3-5).
  - **Mutated Workers** (Level 7-9): 80 HP, 3 armor. Poison attacks (5 damage/turn for 3 turns). Aggressive behavior (always pursue). Drop: Bio Materials (×2-3).
  - **Automated Turrets** (Level 9-11): 100 HP, 10 armor. Stationary, high damage (25 damage/shot). Can be hacked (Hacking 50) to turn friendly. Drop: Metal Scrap (×5-7).
  - **Hazmat Scavengers** (Level 8-10): 90 HP, 5 armor. Immune to gas/radiation. Use shotguns and molotovs. Drop: Chemical Compounds (×2-4), Gas Mask (10% chance).
  - **Toxic Sludge Creature** (Level 10-12, mini-boss): 200 HP, 2 armor. Creates chemical spills on movement. Explodes on death (3-tile AoE, 20 damage). Drop: Rare Bio Materials (×5), Advanced Tech Component (guaranteed).
- **Add 6 unique loot types**:
  - **Advanced Tech Component** (rare crafting material): Used for high-tier weapon mods, energy weapons. 5 guaranteed locations + random drops from robots.
  - **Industrial-Grade Weapons**: Heavy Machine Gun (requires Strength 7), Plasma Cutter (energy melee weapon), Nail Gun (cheap ammo, high durability).
  - **Factory Schematic** (quest item/recipe book): Teaches advanced crafting recipes (EMP Grenade, Heavy Armor Plating). 3 schematics hidden in map.
  - **Gas Mask** (equipment): Essential for zone exploration. 2 guaranteed loot locations, drops from Hazmat Scavengers.
  - **Hazmat Suit** (armor): Immunity to gas and radiation, 4 armor rating, -1 AP penalty. 1 guaranteed location (Chemical Storage vault).
  - **Experimental Stim Pack** (consumable): Heals 50 HP, +3 AP for 2 turns, no withdrawal. 4 doses scattered in labs.
- **Design 3 zone-specific quests**:
  - **Quest 1: "Clear the Refinery"** (given by Scavenger Camp leader, requires Scavengers Neutral):
    - Objective: Eliminate 15 enemies in Refinery building, disable automated defense system (Hacking 40 or destroy 3 control nodes)
    - Reward: 150 XP, 500 credits, Scavengers +20 reputation, access to Refinery safe zone (crafting station available)
  - **Quest 2: "Toxic Rescue"** (given by Resistance operative, requires Resistance Friendly):
    - Objective: Locate and rescue 3 trapped Resistance scouts in Chemical Storage. Navigate toxic areas, provide Gas Masks (quest items provided).
    - Reward: 200 XP, Advanced Tech Component (×2), Resistance +25 reputation, unlock Hazmat Suit location
  - **Quest 3: "Rogue AI Shutdown"** (triggered by exploring Assembly Plant, no prerequisite):
    - Objective: Reach Assembly Plant control room (fight through 20+ Industrial Robots), hack central AI (Hacking 60) or destroy it (boss fight: AI Defense Drones, 3× Level 12 robots)
    - Reward: 250 XP, Factory Schematic (×2), Heavy Machine Gun, deactivates 50% of turrets across zone permanently
- **Implement smog visibility system**:
  - Outdoor tiles: reduce `perceptionRange` from 12 to 6
  - Flashlight item (equipped in accessory slot): increase range to 9 while active, consumes batteries (stackable item, 1 battery per 10 minutes use)
  - Indoor factories: normal vision (no smog)
  - Enemies with "Thermal Vision" trait (robots, turrets): unaffected by smog, always detect player at 12 tiles
- **Build zone access and warnings**:
  - NPC in Downtown (near eastern gate) warns: "Industrial Wasteland is death without gas mask. Only Scavengers and madmen go there."
  - First entry triggers warning modal: "Toxic Zone Ahead: Gas Mask required. Radiation present. Recommend Level 8+"
  - If player <Level 6: additional warning: "You are under-leveled for this zone. Retreat advised."
</details>

<error_handling>
- Prevent soft-locks: If player enters without Gas Mask, place 1 emergency mask at entry point (one-time pickup)
- If player dies in toxic area, respawn at nearest safe zone (Scavenger Camp or entry point) with warning message
</error_handling>

<test>
Travel to Industrial Wasteland via Downtown eastern gate and verify entry warning appears. Enter without Gas Mask and confirm 10 HP/turn damage from toxic gas. Find and equip Gas Mask, verify damage stops. Navigate outdoor smog area and confirm perception range reduced to 6 tiles. Equip flashlight and verify range increases to 9. Enter Refinery factory interior and confirm normal vision restored. Encounter Industrial Robot and verify 8 armor rating, high durability. Use EMP grenade and confirm -50% HP bonus damage. Fight Mutated Worker and verify poison DoT effect (5 damage/turn for 3 turns). Encounter Automated Turret and attempt hack with Hacking 50+, verify turret turns friendly. Step on Chemical Spill and verify 15 HP damage, armor durability loss. Fight Toxic Sludge Creature mini-boss, verify explosion on death (3-tile AoE). Loot Advanced Tech Components and verify rare status. Find Gas Mask in guaranteed location. Accept "Clear the Refinery" quest, complete objectives (15 kills, disable defense), verify rewards and safe zone unlocked. Accept "Toxic Rescue", navigate to Chemical Storage, rescue 3 scouts, verify Hazmat Suit location unlocked. Trigger "Rogue AI Shutdown" quest, reach control room, attempt hack (or fight drones), verify turret deactivation upon completion. Confirm zone is fully explorable with all landmarks accessible.
</test>
</step>
</phase>

<phase id="9" name="Optional Expansions (POST-MVP)">
<!-- NOTE: Steps 27.1, 27.2, and 28.1 are located earlier in the document (after Step 26.3) but belong to Phase 9 conceptually. They are marked POST-MVP and should be deferred to v1.1+ after core game is stable. -->
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

<step id="32.3">
<step_metadata>
  <number>32.3</number>
  <title>Manual QA Playtest Checklist (Multi-Browser Testing)</title>
  <phase>Phase 10: Testing, Polish, and Release</phase>
</step_metadata>

<instructions>
Conduct comprehensive manual quality assurance playtests using a structured checklist to identify bugs, usability issues, and edge cases that automated tests cannot catch. Test across multiple browsers and devices.
</instructions>

<details>
**Manual QA Playtest Checklist** (detailed test scenarios for human testers):

**1. Character Creation (15-20 minutes)**:
- [ ] Create character with minimum name length (1 character), verify accepted
- [ ] Create character with maximum name length (30 characters), verify accepted
- [ ] Try to create character with invalid characters (emojis, special symbols), verify validation
- [ ] Allocate all 40 SPECIAL points, verify cannot proceed without full allocation
- [ ] Try to allocate more than 10 points to single stat, verify capped at 10
- [ ] Tag 3 skills, verify cannot proceed with <3 or >3 skills tagged
- [ ] Hover over each background trait and verify tooltips explain bonuses/penalties
- [ ] Complete character creation and verify starting location is Slums safe zone
- [ ] Verify character sheet displays correct starting stats derived from SPECIAL

**2. Movement and World Exploration (20-25 minutes)**:
- [ ] Use arrow keys to move player in 4 directions, verify smooth movement
- [ ] Try to walk through wall/obstacle, verify blocked movement
- [ ] Click on tile 10+ tiles away, verify pathfinding calculates route
- [ ] Walk to zone boundary (Downtown → Slums), verify transition prompt appears
- [ ] Transition between all 3 zones (Slums, Downtown, Industrial Wasteland) and verify no crashes
- [ ] Enter building interior, verify indoor tileset loads, NPCs present
- [ ] Exit building, verify outdoor environment restored correctly
- [ ] Save game, reload, verify player position persists correctly

**3. Combat System (30-40 minutes)**:
- [ ] Engage enemy in Slums, verify combat grid appears with correct turn order
- [ ] Attack enemy with pistol, verify attack animation, damage numbers, HP decreases
- [ ] Move player 5 tiles, verify AP cost deducts correctly (5 AP)
- [ ] Run out of AP, end turn, verify enemy takes turn automatically
- [ ] Reload weapon, verify reload animation plays, magazine refilled, 3 AP cost
- [ ] Use cover (wall/crate), verify cover icon appears, verify enemy misses more often
- [ ] Get flanked by enemy, verify player takes increased damage (flanking bonus)
- [ ] Use targeted shot (leg), verify reduced hit chance, verify enemy movement penalty on hit
- [ ] Throw grenade at 2+ enemies, verify AoE damage applies to all in radius
- [ ] Defeat all enemies, verify combat ends, XP notification appears, loot drops
- [ ] Open loot containers, verify items lootable, added to inventory
- [ ] Die in combat, verify death screen appears, "Load Game" option present

**4. Dialogue and NPC Interactions (20-25 minutes)**:
- [ ] Talk to quest-giver NPC, verify dialogue box opens with options
- [ ] Read through all dialogue branches for main quest, verify text readable, no typos
- [ ] Choose dialogue option with [Speech 50] check, verify success/failure based on skill
- [ ] Attempt [Hacking 40] check with low skill, verify failure message, negative outcome
- [ ] Talk to NPC with Good Karma requirement, verify option unavailable if karma <500
- [ ] Gain Good Karma (>500), talk to same NPC, verify option now available
- [ ] Choose aggressive dialogue option, verify NPC turns hostile, combat starts
- [ ] Choose peaceful dialogue option, verify quest accepted without combat
- [ ] Talk to NPC after completing quest, verify dialogue changes to post-quest lines

**5. Inventory and Equipment (20-25 minutes)**:
- [ ] Open inventory (I key), verify all carried items display with icons
- [ ] Equip pistol, verify weapon appears in character sheet, attack stat increases
- [ ] Equip leather armor, verify armor appears in character sheet, defense stat increases
- [ ] Unequip weapon, verify attack stat decreases to base unarmed damage
- [ ] Pick up 10+ items until over weight limit (50 kg), verify encumbered warning
- [ ] Verify movement speed reduced when over-encumbered
- [ ] Drop items to reduce weight below limit, verify normal movement restored
- [ ] Stack items (ammo, stim packs), verify stack count increases correctly
- [ ] Use consumable (stim pack), verify HP heals, item removed from inventory
- [ ] Compare two weapons (hover over second weapon while one equipped), verify stat comparison tooltip

**6. Quests and Progression (30-40 minutes)**:
- [ ] Accept quest from NPC, verify quest added to Quest Log with description
- [ ] Open Quest Log, verify objectives listed with checkboxes
- [ ] Complete first objective (e.g., talk to NPC), verify checkbox marked complete
- [ ] Complete final objective, return to quest giver, verify reward options appear
- [ ] Choose credit reward (500 credits), verify credits added to inventory
- [ ] Complete another quest, choose item reward, verify item added to inventory
- [ ] Complete another quest, choose XP reward, verify extra XP awarded
- [ ] Accept side quest with branching paths, choose one path, verify other path closes
- [ ] Fail quest by killing quest-critical NPC, verify quest marked FAILED in log
- [ ] Gain enough XP to level up (100 XP for level 2), verify level-up notification
- [ ] Open character sheet, allocate 10 skill points across skills, verify increases
- [ ] Reach level 3, verify perk selection screen appears with 5 perk choices
- [ ] Select perk (e.g., "Better Criticals"), verify perk bonus applies immediately

**7. Faction Reputation and Karma (15-20 minutes)**:
- [ ] Complete quest for Resistance faction, verify Resistance reputation increases (+20)
- [ ] Check faction status screen, verify Resistance shows "Friendly" at 250+ rep
- [ ] Kill Resistance NPC, verify reputation decreases (-50), status changes to "Neutral" or "Hostile"
- [ ] Complete quest for CorpSec, verify CorpSec reputation increases, Resistance decreases (opposed factions)
- [ ] Perform good action (help civilian), verify karma increases (+10), notification appears
- [ ] Perform bad action (kill civilian), verify karma decreases (-20), notification appears
- [ ] Check karma level: verify Good (>500), Neutral (0-500), or Evil (<0) classification

**8. Crafting and Upgrades (20-25 minutes)**:
- [ ] Gather crafting materials: Metal Scrap (×10), Gunpowder (×5), Electronic Parts (×3)
- [ ] Open crafting panel, verify recipes display with material requirements
- [ ] Craft 9mm Ammo (requires Gunpowder ×2), verify materials deducted, ammo added
- [ ] Attempt to craft Stim Pack without Medicine 30 skill, verify recipe grayed out
- [ ] Read medical textbook to gain Medicine skill, reach 30, verify recipe now craftable
- [ ] Craft Stim Pack, verify 15-second craft time elapses with progress bar
- [ ] Travel to Resistance safe house, interact with workbench, verify weapon mod panel opens
- [ ] Craft Reflex Sight mod (requires Engineering 15, Electronic Parts ×2)
- [ ] Open weapon modification panel, drag Reflex Sight to Optics slot
- [ ] Verify stat preview shows +10% accuracy before confirming
- [ ] Apply mod, verify accuracy stat increases, mod consumed from inventory

**9. Day/Night Cycle and Environmental Hazards (15-20 minutes)**:
- [ ] Wait for day/night transition (6 AM, 6 PM), verify lighting changes from day to night
- [ ] Verify curfew enforcement: patrol NPCs hostile at night if not in safe zone
- [ ] Enter Industrial Wasteland without Gas Mask, verify toxic gas damage (10 HP/turn)
- [ ] Equip Gas Mask, verify damage stops, breathing sound effect plays
- [ ] Step on Chemical Spill, verify 15 HP damage, armor durability decreases
- [ ] Stand in Radiation Pocket without Hazmat Suit, verify radiation accumulates (+2/turn)
- [ ] Navigate smog area, verify perception range reduced to 6 tiles
- [ ] Equip flashlight, verify perception range increases to 9 tiles

**10. Save/Load System (10-15 minutes)**:
- [ ] Save game in Slot 1, verify save appears with timestamp, location, level
- [ ] Save game in Slot 2, verify both saves coexist independently
- [ ] Load Slot 1, verify all state restores: player position, inventory, quests, stats
- [ ] Load Slot 2, verify different state loads correctly
- [ ] Delete Slot 1, verify save removed from list
- [ ] Trigger auto-save by leveling up, verify auto-save slot appears with "Auto-Save" label
- [ ] Quit game, relaunch, verify save slots persist across sessions

**11. UI/UX and Accessibility (15-20 minutes)**:
- [ ] Hover over all UI elements (buttons, icons), verify tooltips appear with helpful text
- [ ] Test keyboard shortcuts: I (inventory), C (character sheet), Q (quest log), ESC (menu)
- [ ] Verify all modals/panels can be closed with ESC key or X button
- [ ] Test UI responsiveness: resize browser window, verify UI scales/reflows correctly
- [ ] Verify text is readable at minimum supported resolution (1280×720)
- [ ] Check colorblind mode (if implemented): verify UI distinguishes colors for red-green colorblindness
- [ ] Test tab navigation: verify can navigate UI with Tab key, Enter to activate buttons

**12. Multi-Browser Testing (30-40 minutes per browser)**:
- **Chrome (Latest)**: Run full playtest checklist (1-11), document any issues
- **Firefox (Latest)**: Run full playtest checklist, compare performance vs Chrome
- **Edge (Latest)**: Run full playtest checklist, verify compatibility
- **Safari (Latest macOS)**: Run full playtest checklist, verify WebGL/Canvas rendering correct
- **Mobile Safari (iOS)**: Test touch controls, verify UI scales for mobile, performance acceptable
- **Chrome Android**: Test touch controls, verify no major UI issues on smaller screens

**Bug Documentation Process**:
- Use issue tracker (GitHub Issues, Jira, Linear) to log all bugs
- For each bug, document:
  - **Title**: Concise description (e.g., "Character sheet not updating after level-up")
  - **Severity**: Critical (blocks gameplay), High (major feature broken), Medium (minor issue), Low (cosmetic)
  - **Steps to reproduce**: Exact steps to trigger bug
  - **Expected behavior**: What should happen
  - **Actual behavior**: What actually happens
  - **Browser/Device**: Where bug occurs (e.g., "Chrome 120, Windows 11")
  - **Screenshots/Video**: Attach visual evidence if applicable
- Assign priority: P0 (fix before launch), P1 (fix soon), P2 (fix eventually), P3 (nice to have)

**Acceptance Criteria**:
- Complete full playtest checklist (1-12) with at least 2 testers
- Test in all 4 major browsers (Chrome, Firefox, Edge, Safari)
- Document all bugs found in issue tracker with severity/priority
- Zero P0 (critical) bugs remaining before launch
- <5 P1 (high) bugs remaining before launch (with plan to fix in v1.1)
</details>

<prerequisites>
- Steps 32.1 and 32.2 (Unit and E2E tests) should be completed first
- Game fully implemented and deployed to staging environment
- Multiple human testers available (ideally 2-3 for comprehensive coverage)
</prerequisites>

<test>
Assign 2-3 testers to complete full playtest checklist independently. Verify each tester logs bugs in issue tracker with detailed repro steps. Review bug reports and categorize by severity (Critical, High, Medium, Low) and priority (P0, P1, P2, P3). Fix all P0 bugs and verify fixes with re-testing. Verify game tested in Chrome, Firefox, Edge, and Safari with results documented. Verify mobile testing completed on iOS Safari and Chrome Android. Confirm all sections of checklist completed (checkboxes marked). Review any recurring bugs reported by multiple testers and prioritize fixes. Verify edge cases tested: character with all stats at 1, character with 10 STR vs 1 STR, inventory at exactly 50 kg weight limit, quest with all paths explored. Confirm game playable start-to-finish without game-breaking bugs across all tested browsers.
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

<step id="34.5">
<step_metadata>
  <number>34.5</number>
  <title>Accessibility Audit and Fixes (WCAG 2.1 AA Compliance)</title>
  <phase>Phase 10: Testing, Polish, and Release</phase>
</step_metadata>

<instructions>
Conduct comprehensive accessibility audit and implement fixes to ensure the game meets WCAG 2.1 Level AA standards, making it playable for users with disabilities.
</instructions>

<details>
**Accessibility Standards Goal**: WCAG 2.1 Level AA compliance for:
- Visual impairments (low vision, colorblindness)
- Motor disabilities (keyboard-only navigation)
- Cognitive disabilities (clear language, consistent UI)
- Screen reader compatibility (ARIA labels, semantic HTML)

**1. Keyboard Navigation (WCAG 2.1.1, 2.1.3)**:
- **Full keyboard accessibility**: Ensure ALL interactive elements (buttons, inputs, NPCs, loot containers, enemies) are keyboard-accessible without requiring mouse
- **Focus indicators**: Add visible focus rings (2px solid outline) to all focusable elements with high contrast (yellow/cyan on dark backgrounds)
- **Tab order**: Implement logical tab order for UI panels (left-to-right, top-to-bottom), skip decorative elements
- **Keyboard shortcuts** (already in Step 34, verify functionality):
  - I: Inventory
  - C: Character Sheet
  - Q: Quest Log
  - M: Map/Minimap
  - K: Crafting Panel
  - ESC: Close current panel/pause menu
  - Tab: Cycle through interactive elements
  - Enter/Space: Activate focused element
  - Arrow keys: Navigate world AND navigate within UI lists/grids
- **Focus trapping**: When modal opens (dialogue, inventory), trap focus within modal, ESC to close
- **Skip links**: Add "Skip to main content" link at top of page for screen reader users

**2. Screen Reader Support (WCAG 1.3.1, 4.1.2)**:
- **Semantic HTML**: Use proper HTML elements (`<button>`, `<input>`, `<nav>`) instead of divs with onClick
- **ARIA labels**: Add `aria-label` or `aria-labelledby` to all interactive elements
  - Example: `<button aria-label="Equip pistol">Equip</button>`
  - Example: `<div role="region" aria-label="Combat grid">...</div>`
- **Live regions**: Use `aria-live="polite"` for status updates (HP changes, XP gains, notifications)
  - Example: `<div aria-live="polite" aria-atomic="true">{notificationMessage}</div>`
- **State announcements**: Use `aria-pressed`, `aria-expanded`, `aria-selected` for interactive elements
- **Image alt text**: Add descriptive alt text to all images (character portraits, item icons, zone images)
  - Example: `<img src="pistol.png" alt="9mm pistol, ranged weapon" />`
- **Screen reader testing**: Test with NVDA (Windows) or VoiceOver (macOS) to ensure all UI navigable and comprehensible

**3. Color Contrast (WCAG 1.4.3, 1.4.11)**:
- **Text contrast ratio**: Ensure 4.5:1 minimum contrast for normal text, 3:1 for large text (18pt+)
  - Check all UI text: dialogue, stats, tooltips, quest descriptions
  - Tool: Use WebAIM Contrast Checker or Chrome DevTools Accessibility panel
- **UI element contrast**: Ensure 3:1 minimum contrast for interactive elements (buttons, inputs, icons)
- **Focus indicator contrast**: Ensure focus rings have 3:1 contrast against background
- **Status indicators**: Use BOTH color AND icon/text to convey information
  - Example: HP bar uses red color BUT also displays "25/100 HP" text
  - Example: Karma uses color (green/gray/red) BUT also displays "Good" / "Neutral" / "Evil" text
- **Fix common issues**:
  - Light gray text on white backgrounds (increase contrast)
  - Subtle hover states (make more obvious)
  - Red-only error messages (add icons and text labels)

**4. Colorblind Modes (WCAG 1.4.1)**:
- **Implement colorblind mode toggle** in settings (`src/game/settings/accessibilitySettings.ts`):
  - **Protanopia** (red-green colorblindness, ~8% of males): Use blue/yellow palette instead of red/green
  - **Deuteranopia** (green-red colorblindness): Similar to protanopia
  - **Tritanopia** (blue-yellow colorblindness, rare): Use red/green palette
- **Pattern overlays**: Add patterns/textures to color-coded elements
  - HP bar: Green with horizontal lines, Red with diagonal lines
  - Karma: Good has checkmark pattern, Evil has X pattern
  - Loot rarity: Common (solid), Rare (dots), Epic (stripes)
- **Icon shapes**: Use different shapes for different item types (not just colors)
  - Weapons: Pentagon icon
  - Armor: Shield icon
  - Consumables: Circle icon
  - Quest items: Star icon
- **Color palette**: Use colorblind-safe palettes for UI elements
  - Avoid red/green combinations for critical information
  - Use blue/orange, yellow/purple instead

**5. Font Size and Readability (WCAG 1.4.4, 1.4.12)**:
- **Font size settings**: Add font size slider in settings (Small 14px, Medium 16px, Large 18px, Extra Large 20px)
- **Text scaling**: Ensure UI scales correctly when font size increases (don't break layouts at 200% zoom)
- **Font choice**: Use sans-serif fonts (Arial, Roboto, Open Sans) for better readability
- **Line height**: Set line-height to 1.5x font size minimum for better readability
- **Paragraph width**: Limit text width to 80 characters maximum (use max-width on dialogue boxes)
- **Dyslexia support**: Offer dyslexia-friendly font option (OpenDyslexic or similar)

**6. Reduced Motion (WCAG 2.3.3)**:
- **Detect prefers-reduced-motion**: Check `window.matchMedia('(prefers-reduced-motion: reduce)')`
- **Disable animations**: When reduced motion enabled:
  - Remove combat attack animations (instant damage application)
  - Remove zone transition animations (instant fade in/out)
  - Remove UI panel sliding animations (instant show/hide)
  - Keep essential feedback (damage numbers, tooltips) but without motion
- **Settings toggle**: Add "Reduce Animations" checkbox in accessibility settings

**7. Audio Accessibility (WCAG 1.4.2)**:
- **Subtitles/Captions**: If audio dialogue is added, provide text captions
- **Visual cues**: Ensure all audio cues have visual equivalents
  - Low HP warning: Audio beep AND red screen border pulsing
  - Enemy approaching: Audio footsteps AND minimap indicator
  - Quest complete: Audio chime AND notification banner
- **Volume controls**: Separate volume sliders for music, SFX, and UI sounds

**8. Form Input Accessibility (WCAG 3.3.1, 3.3.2)**:
- **Label all inputs**: Every form field has associated `<label>` element
  - Example: `<label for="char-name">Character Name:</label><input id="char-name" />`
- **Error messages**: Display clear error messages near input fields with suggestions
  - Example: "Character name must be 1-30 characters" (not just "Invalid")
- **Required field indicators**: Mark required fields with asterisk AND aria-required="true"
- **Input validation**: Provide real-time feedback on input validity (green checkmark / red X)

**Testing Tools and Process**:
- **Automated testing**:
  - Install axe DevTools Chrome extension: scan each page for WCAG violations
  - Install WAVE Chrome extension: visual feedback on accessibility issues
  - Run Lighthouse accessibility audit in Chrome DevTools
  - Target score: 90+ accessibility score in Lighthouse
- **Manual testing**:
  - Navigate entire game using ONLY keyboard (no mouse), verify all features accessible
  - Test with screen reader (NVDA or VoiceOver), verify all elements announced correctly
  - Test with 200% browser zoom, verify UI remains usable
  - Test with colorblind simulator (Chrome extension "Colorblindly"), verify information distinguishable
  - Test with reduced motion preference enabled, verify animations disabled
- **Accessibility checklist**:
  - [ ] All interactive elements keyboard-accessible (Tab, Enter, Arrow keys)
  - [ ] Visible focus indicators on all focusable elements (2px solid outline)
  - [ ] Screen reader announces all UI elements correctly (tested with NVDA/VoiceOver)
  - [ ] All text meets 4.5:1 contrast ratio minimum (checked with contrast tool)
  - [ ] All status information uses color + icon/text (not color alone)
  - [ ] Colorblind mode available in settings (protanopia, deuteranopia, tritanopia)
  - [ ] Font size adjustable (14px-20px range)
  - [ ] Reduced motion mode available and functional
  - [ ] All images have alt text
  - [ ] All form inputs have labels
  - [ ] Lighthouse accessibility score ≥90

**Common Fixes**:
- Replace `<div onClick>` with `<button>` for interactive elements
- Add `tabIndex="0"` to focusable custom elements (NPCs, loot containers)
- Add `role="button"` and `onKeyPress` handler to clickable divs (if button not possible)
- Add `aria-label` to icon-only buttons (e.g., close X button)
- Add `alt=""` (empty) to decorative images (don't announce in screen reader)
- Add `aria-hidden="true"` to decorative elements (background graphics, flourishes)
- Use `<h1>`, `<h2>`, `<h3>` for headings in proper hierarchy (not just styled divs)
- Add `role="dialog"` and `aria-modal="true"` to modal windows

**Acceptance Criteria**:
- Pass axe DevTools scan with zero critical/serious violations
- Pass WAVE scan with zero errors (warnings acceptable if justified)
- Lighthouse accessibility score ≥90 on all major pages
- Entire game completable using keyboard only (no mouse required)
- Screen reader announces all UI elements and game state correctly
- All text meets WCAG AA contrast requirements (4.5:1)
- Colorblind mode functional for 3 types of colorblindness
- Reduced motion mode disables all non-essential animations
</details>

<prerequisites>
- Step 34 (Polish the UI) should be completed first for baseline UI quality
- All game systems implemented for comprehensive accessibility testing
</prerequisites>

<accessibility>
This step IS the accessibility implementation - all features here are accessibility-focused.
</accessibility>

<test>
Run axe DevTools scan on game homepage, character creation, main game screen, and verify zero critical/serious violations. Run WAVE scan and verify zero errors. Run Lighthouse accessibility audit and verify score ≥90. Attempt to play entire game using ONLY keyboard: create character (Tab/Enter to allocate stats, select background), navigate world (arrow keys), engage in combat (Tab to select target, Enter to attack), open inventory (I key), equip weapon (Tab to weapon, Enter to equip), accept and complete quest, level up and allocate skill points - all without touching mouse. Enable screen reader (NVDA or VoiceOver), navigate through character creation and verify all elements announced correctly. Open inventory and verify item names, stats, and actions announced. Enter combat and verify turn announcements, damage numbers, and enemy information announced. Check all text in UI with contrast checker tool and verify 4.5:1 minimum ratio. Enable colorblind mode (protanopia) and verify HP bar, karma display, and item rarity distinguishable without color. Test with deuteranopia and tritanopia modes. Increase font size to Extra Large (20px) and verify UI doesn't break, text remains readable. Zoom browser to 200% and verify game still playable. Enable reduced motion setting and verify animations disabled (combat, transitions) but essential feedback (damage numbers, tooltips) still visible. Test all form inputs (character name, stat allocation) have labels and error messages. Verify focus indicators visible on all interactive elements (buttons, NPCs, containers). Test with "Colorblindly" Chrome extension (simulate protanopia) and verify all information distinguishable.
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
- Step 34.5 (Accessibility) completed to ensure help system is accessible
</prerequisites>

<test>
Press F1 and verify HelpPanel modal opens with 8 tabs. Click through each tab (Combat, Character, Inventory, Quests, World, Crafting, Factions, Controls) and verify content is present and readable. Use search box to search "skill check" and verify Combat and Quests tabs highlighted. Close help with F1, ESC, or X button and verify modal closes. Open character creation screen and verify "?" icon present near SPECIAL stats. Click "?" icon and verify HelpPanel opens to Character Development tab. Open crafting panel and verify "?" icon present, click and verify opens to Crafting tab. Check README.md and verify installation instructions (yarn install, yarn dev), build instructions (yarn build), and test instructions (yarn test) are present. Check ARCHITECTURE.md exists and verify system architecture overview, core systems descriptions, and file organization sections present. Check CONTRIBUTING.md exists and verify code style guide, git workflow, and PR process documented. Verify all help content accurate (no outdated information from earlier development). Test help system with keyboard only (Tab to navigate tabs, Enter to select, ESC to close) and verify accessible.
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
</phase>

<summary>
## Summary

This plan now outlines **49 implementable steps** organized into **10 phases** to build "The Getaway." The structure separates core MVP features (Phases 1-8) from optional expansions (Phase 9) and final polish (Phase 10).

<phase_structure>
- **Phases 1-6 (Steps 1-21)**: Foundation, combat, exploration, narrative, and visual systems - COMPLETED (21 steps)
- **Phase 7 (Steps 22.1-30.2)**: Character progression, inventory, advanced combat, reputation, and crafting systems - CORE MVP (18 steps: 22.1/22.2/22.3, 23/23.5, 24.1/24.2/24.3, 25/25.5, 26.1/26.2/26.3, 29, 30.1/30.2)
  - NOTE: Steps 27.1, 27.2, 28.1 are physically located after Step 26.3 but are marked as Phase 9 (POST-MVP)
- **Phase 8 (Step 31)**: Industrial Wasteland zone expansion - CORE MVP (1 step)
- **Phase 9 (Steps 27.1, 27.2, 28.1)**: Optional expansions (vehicle and survival mechanics) - POST-MVP, deferred to v1.1+ (3 steps)
  - Steps physically located after Step 26.3 in document but conceptually belong to Phase 9
- **Phase 10 (Steps 32.1-35)**: Testing, polish, accessibility, and documentation - FINAL RELEASE PREP (11 steps: 32.1/32.2/32.3, 33, 34, 34.5, 34.7, 35)
</phase_structure>

<focus_areas>
- **Command & Atmosphere**: Resistance command hub UI, neon isometric presentation, and curfew pressure loops.
- **Living World & Narrative**: NPC routines, branching dialogue with skill checks, and quest scaffolding tied into Redux.
- **Combat & Navigation**: Turn-based encounters with cover awareness, guard perception loops, click-to-move traversal, and readable path previews.
- **Character Progression**: Modular character creation flow, existing playerStats.ts integration, XP/leveling foundation, skill tree system, and perk selection with capstones.
- **Equipment & Inventory**: Expanded inventory system building on existing interfaces, equipment effects, durability mechanics, and weight penalties.
- **Advanced Combat Systems**: Directional cover and flanking, overwatch mode, targeted shots, area-of-effect attacks, and combat consumables for deeper tactical gameplay.
- **Reputation & Influence**: Concrete faction system (Resistance, CorpSec, Scavengers) with numerical thresholds and gameplay consequences.
- **Crafting & Upgrades**: Basic crafting for ammo and medical supplies, weapon modification system with concrete recipes.
- **Expanded World**: Industrial Wasteland zone (80×80 tiles) with specific environmental hazards and zone-specific quests.
- **Optional Expansions (Phase 9)**: Vehicle systems (motorcycle-only, simplified) and optional survival mode (hunger/thirst only) - marked for v1.1+ deferral.
- **Testing & Quality**: Unit test suite (70% coverage target), integration test scenarios, manual QA playtest checklist.
- **Accessibility & Documentation**: WCAG 2.1 AA compliance, keyboard navigation, screen readers, in-game help system, and external documentation.
- **Stability & Polish**: Multi-slot save system with auto-save, comprehensive playtests, and UI refinement across all systems.
</focus_areas>

<key_improvements>
This revised plan addresses critical quality issues identified in the analysis:

**Step Granularity**: Complex steps split into focused substeps:
- Step 22 → 22.1 (UI shell), 22.2 (attributes - after 23), 22.3 (backgrounds - after 24.3)
- Step 24 → 24.1 (XP/leveling), 24.2 (skill trees), 24.3 (perk selection)
- Step 26 → 26.1 (flanking), 26.2 (overwatch/targeted shots), 26.3 (AoE/consumables)
- Step 30 → 30.1 (basic crafting), 30.2 (weapon mods)
- Step 32 → 32.1 (unit tests), 32.2 (integration tests), 32.3 (manual QA)

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
- Industrial Wasteland: 80×80 tile map, 3 zone-specific quests

**Quality Assurance**: New steps for comprehensive testing and accessibility:
- Step 34.5: Accessibility audit and WCAG 2.1 AA compliance
- Step 34.7: In-game help system and external documentation
</key_improvements>

Each step includes concrete validation targets to keep development measurable. The architecture prioritizes modularity and scalability, drawing inspiration from Fallout 2 while focusing on a maintainable modern web stack. Iterative playtesting complements automated checks to preserve feel and performance.

The resulting foundation positions the project for a solid v1.0 release with a clear roadmap for future additions in v1.1+ (vehicles, expanded survival, additional zones, expanded faction conflicts).
</summary>
