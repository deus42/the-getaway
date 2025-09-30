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
  <title>Implement Character Creation System</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<instructions>
Build a comprehensive character creation screen that allows players to customize their starting character with attributes, skills, and background.
</instructions>

<details>
- Create a character creation interface in `src/components/ui` that appears on new game start.
- Implement attribute allocation system with a point pool: Strength (melee damage, carry weight), Agility (AP, stealth), Endurance (health, resistances), Intelligence (skill points, hacking), Perception (aim, critical chance, trap detection), and Charisma (influence, barter).
- Add background selection system (Ex-Cop, Street Urchin, Corporate Tech) with each providing unique starting perks and reputation modifiers.
- Include "tag skills" selection where players choose 2-3 skills to specialize in from the start (Small Guns, Energy Weapons, Lockpicking, Hacking, First Aid, Stealth, Persuasion, etc.).
- Calculate derived stats from attributes (max HP from Endurance, base AP from Agility, carry capacity from Strength).
- Store character creation choices in Redux state and apply them to the player entity.
</details>

<test>
Start a new game and verify the character creation screen appears. Allocate attribute points, select a background, and tag skills. Confirm the character spawns with correct stats, starting equipment, and faction reputations matching the selected background.
</test>
</step>

<step id="23" status="pending">
<step_metadata>
  <number>23</number>
  <title>Define Player Stats and Attributes System</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<instructions>
Set up the complete character attributes and derived stats system that integrates with combat, dialogue, and skill checks.
</instructions>

<details>
- Create a player profile interface in `src/game/interfaces/playerStats.ts` with primary attributes (Strength, Agility, Endurance, Intelligence, Perception, Charisma) and derived stats (HP, AP, carry weight, critical chance, stealth modifier).
- Implement stat calculation functions that compute derived values from base attributes and equipped gear modifiers.
- Build a character sheet React component in `src/components/ui` displaying all stats with tooltips explaining what each attribute affects.
- Add attribute increase system for level-ups (every few levels, player can increase one attribute by 1 point).
- Integrate attributes with existing systems: Perception affects aim in combat, Charisma unlocks dialogue options, Intelligence provides bonus skill points per level, Agility determines base AP.
</details>

<test>
Load the game and open the character sheet. Verify all stats display correctly. Equip different armor or weapons and confirm derived stats update (carry weight changes with Strength-boosting gear, AP changes with heavy armor penalty). Level up and increase an attribute, then verify dependent stats recalculate.
</test>
</step>

<step id="24" status="pending">
<step_metadata>
  <number>24</number>
  <title>Add a Leveling System with Skill Trees</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<instructions>
Implement XP-based leveling with skill trees and perk selection.
</instructions>

<details>
- Award XP for completing quests, defeating enemies, successful skill checks, and discovering new locations.
- Implement leveling thresholds with increasing XP requirements (100 XP for level 2, 200 for level 3, etc.).
- Create skill tree system with branches: Combat (Guns, Melee, Explosives), Tech (Hacking, Engineering, Science), Survival (Medicine, Stealth, Scavenging), and Social (Persuasion, Intimidation, Barter).
- Grant skill points on level-up that can be allocated to any skill (bonus points if high Intelligence).
- Every few levels, allow player to choose a perk from available options based on their skill levels and prerequisites.
- Design capstone perks for each tree that require deep specialization (e.g., "Gun Fu: first shot each turn costs 0 AP").
- Store progression data in Redux and display level-up notifications in the HUD.
</details>

<test>
Earn XP through various activities and confirm level-up occurs at the correct threshold. Allocate skill points and select a perk. Verify skills affect gameplay (higher Hacking skill lets you hack advanced terminals, higher Persuasion unlocks new dialogue options). Reach a high skill level and confirm capstone perks become available.
</test>
</step>

<step id="25" status="pending">
<step_metadata>
  <number>25</number>
  <title>Build an Inventory System</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<instructions>
Create a comprehensive weight-based inventory system with equipment slots and categorization.
</instructions>

<details>
- Define an inventory system in `src/game/inventory` with weight-based capacity determined by Strength attribute.
- Implement equipment slots: primary weapon, secondary weapon, melee weapon, armor (body, helmet), and accessory slots.
- Add item categories: Weapons (melee, pistols, rifles, shotguns, heavy weapons, energy weapons, thrown/explosives), Armor (light, heavy, special), Consumables (health items, food, water, drugs), Ammo (various calibers), Gadgets (lockpicks, hacking tools, binoculars), Crafting Materials (metal, electronics, chemicals, textiles), and Quest Items.
- Create item data structures with properties: name, weight, value, category, stats/effects, durability, special properties.
- Build inventory UI with grid/list view, sorting options (by type, weight, value), and quick-filter buttons.
- Implement item stacking for ammo and consumables, and durability tracking for weapons and armor.
- Add encumbrance penalties: moving above 80% capacity reduces AP by 1, above 100% prevents movement.
</details>

<test>
Add various items to inventory and confirm weight calculation updates. Equip weapons and armor, verify stat bonuses apply. Add items until exceeding capacity and confirm movement restrictions. Stack identical ammo types and verify they combine. Use a weapon until durability drops and confirm damage output decreases.
</test>
</step>

<step id="26" status="pending">
<step_metadata>
  <number>26</number>
  <title>Implement Advanced Combat Mechanics</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<instructions>
Expand combat system with tactical depth: overwatch mode, targeted shots, flanking bonuses, area-of-effect attacks, and combat consumables.
</instructions>

<details>
- Implement Overwatch Mode: Allow characters to reserve remaining AP to automatically shoot at enemies who move within line-of-sight during enemy turns. Add overwatch UI indicator and trigger system in `src/game/combat`.
- Add Targeted Shots: Enable aiming at specific body parts (head, torso, arms, legs) with different effects - legs slow movement, arms reduce accuracy/disarm, head has high critical chance but lower hit chance. Costs extra AP and requires skill thresholds.
- Implement Flanking System: Calculate whether attacker is outside defender's cover arc. Flanking negates cover bonuses and provides +20% hit chance. Update cover calculations to be directional.
- Add Area-of-Effect Attacks: Create grenade/explosive system that damages all units within blast radius. Include friendly fire mechanics and cover providing damage reduction from AoE.
- Integrate Combat Consumables: Allow using medkits (heal HP, costs 2 AP), stim packs (boost AP for 1 turn), combat drugs (temporary stat buffs with side effects), grenades (thrown weapons with blast radius), and smoke grenades (create obscuring cover).
- Extend enemy AI to use these new mechanics: seek flanking positions, use overwatch when defending, throw grenades at clustered players.
</details>

<test>
Enter combat and activate overwatch mode with remaining AP. Move an enemy through line-of-sight and verify automatic reaction shot. Use targeted shot on enemy limbs and confirm status effects apply (slowed movement from leg shot). Flank an enemy behind cover and verify hit chance bonus. Throw a grenade at enemy cluster and confirm splash damage affects all units in radius. Use a stim pack and verify AP increases for that turn.
</test>
</step>

<step id="27" status="pending">
<step_metadata>
  <number>27</number>
  <title>Build Vehicle Systems for Exploration and Combat</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<instructions>
Create a comprehensive vehicle system that integrates with both exploration and combat, supporting acquisition, upgrades, fuel management, and tactical usage.
</instructions>

<details>
- Implement vehicle acquisition system in `src/game/vehicles`: players can obtain vehicles through quests, purchase, or theft. Create vehicle types: motorcycle (fast, low capacity), car (balanced), armored truck (slow, high durability, large storage).
- Add vehicle properties: speed (affects travel time), durability (vehicle HP), storage capacity (trunk inventory), fuel consumption rate, and mounted weapons slots.
- Create fuel management system: vehicles require gasoline/diesel stored as inventory items. Track fuel consumption during travel and combat. Running out of fuel immobilizes the vehicle until refueled.
- Implement vehicle storage: Add trunk/storage compartment accessible from vehicle interface. Players can stash weapons, ammo, supplies separate from personal inventory.
- Build vehicle upgrade system at garages: armor plating (increases durability), engine upgrades (faster travel, better acceleration), mounted weapons (machine gun turret operable in combat), reinforced bumpers (ramming damage), improved storage racks.
- Integrate vehicles into combat: If combat triggers while in vehicle, spawn vehicle on combat grid as controllable unit. Vehicle can move multiple tiles per AP, ram enemies for damage, provide mobile cover, and use mounted weapons. Enemies can target and damage vehicles.
- Add vehicle damage/repair mechanics: Vehicles can be damaged in combat or accidents. Requires repair kits or workshop visit. Heavily damaged vehicles have reduced speed and may break down.
- Create fast-travel system using vehicles: Once a location is discovered, can fast-travel there if you have a functional vehicle with sufficient fuel.
</details>

<test>
Acquire a vehicle through quest or purchase. Drive it across the map and verify fuel consumption. Access vehicle trunk and store items, then retrieve them later. Visit a garage and install upgrades (armor, mounted weapon). Enter combat while in vehicle and confirm vehicle appears on grid. Use vehicle to ram an enemy and fire mounted weapon. Take damage to vehicle and verify speed reduction. Repair vehicle at workshop and confirm functionality restored. Fast-travel to a discovered location and confirm fuel is consumed.
</test>
</step>

<step id="28" status="pending">
<step_metadata>
  <number>28</number>
  <title>Implement Survival Mechanics System</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<instructions>
Add survival mechanics including hunger, thirst, fatigue, radiation exposure, and medical treatment to enhance immersion and challenge.
</instructions>

<details>
- Create survival meters in `src/game/interfaces`: Hunger (decreases over time, penalties at low levels), Thirst (faster depletion than hunger), Fatigue (increases from activity, combat, heavy loads), and Radiation (from exposure to contaminated zones).
- Implement Hunger System: Character needs 2 meals per day. Low hunger reduces Strength and health regen. Starvation causes HP loss. Different foods provide varying satiation (canned food, fresh food, cooked meat).
- Implement Thirst System: Need water 1-2 times per day. Contaminated water requires purification (boiling, tablets) or causes disease. Dehydration reduces max AP and causes damage.
- Implement Fatigue System: Fills during activity, combat, and carrying heavy loads. High fatigue reduces max AP, aim accuracy, and movement speed. Rest/sleep required to recover. Can sleep at safehouses or use caffeine for temporary relief.
- Add Radiation System: Certain zones (Industrial Wasteland outskirts, contaminated buildings) have radiation. Exposure increases radiation meter. High radiation reduces max HP and causes sickness. Requires anti-rad medicine or decontamination.
- Create Injury System: Specific injuries beyond HP loss - bleeding (lose HP over time, requires bandaging), broken bones (movement penalty, needs splint/doctor), poison (stat debuffs, needs antidote). Different medical items treat different conditions.
- Implement Disease Mechanics: Contaminated food/water or enemy attacks can cause disease with lasting stat penalties. Requires antibiotics or rest to cure.
- Build survival UI elements: Small icons showing meter status with color coding (green/yellow/red). Status screen with detailed effects and remedies.
- Integrate with difficulty settings: Allow players to adjust survival pressure (easy mode: slow depletion, hard mode: realistic needs).
</details>

<test>
Play for extended in-game time without eating and verify hunger penalties apply (reduced Strength, damage over time if starving). Drink contaminated water and confirm disease occurs unless purified. Engage in prolonged activity without rest and verify fatigue effects (reduced AP, accuracy). Enter a radiation zone without protection and confirm radiation accumulates. Use anti-rad medicine and verify reduction. Get injured in combat causing bleeding, use bandage to stop it. Break a limb from fall damage, use splint to treat. Adjust difficulty settings and confirm survival meter depletion rates change.
</test>
</step>

<step id="29" status="pending">
<step_metadata>
  <number>29</number>
  <title>Implement Karma and Reputation Systems</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<instructions>
Create karma system tracking player morality and faction reputation system managing relationships with various groups in the city.
</instructions>

<details>
- Build Karma System in `src/game/systems/karma.ts`: Track overall morality on scale from -100 (Wicked) to +100 (Saintly). Define karma tiers with titles (Wicked, Ruthless, Neutral, Kindhearted, Saintly).
- Define karma-affecting actions: Positive karma from saving innocents, showing mercy, helping without reward, keeping promises. Negative karma from murdering non-hostiles, betrayal, extortion, cruel decisions, theft. Quest choices can have karma impacts.
- Implement Reputation System: Each major faction tracks separate reputation value (Hostile, Unfriendly, Neutral, Friendly, Allied). Actions for/against factions modify their reputation.
- Create reputation effects: Hostile factions attack on sight, send hit squads. Unfriendly have high prices, won't offer quests. Friendly give discounts, allow access to restricted areas, offer backup in combat. Allied may offer leadership roles and best equipment.
- Integrate karma/reputation into gameplay: Some NPCs only interact with certain karma levels. Quests may unlock/lock based on karma. High karma players get approached by those needing help, low karma attracts criminal contacts. Dialogue options change based on reputation ("Friend of the Resistance", "Enemy of CorpSec").
- Build UI elements: Karma meter on character sheet with current title. Faction reputation screen listing all factions with bars showing standing and threshold effects. Notifications when karma/reputation changes significantly.
- Implement world reactions: NPCs greet/flee based on karma. Guards scrutinize low-karma players more. Some areas become accessible/restricted based on faction reputation.
- Tie into ending system: Karma and faction allegiances determine available endings and epilogue slides.
</details>

<test>
Perform good deeds (save civilians, complete altruistic quests) and verify karma increases with positive title changes. Commit negative acts (kill innocents, betray allies) and confirm karma decreases. Complete quests for a faction and verify reputation increases while rival faction rep decreases. Reach Hostile status with a faction and confirm they attack on sight and send assassins. Reach Allied status and confirm access to special areas, discounts, and backup assistance. Check that karma/reputation-locked dialogue options appear/disappear appropriately. Verify karma and reputation influence ending options.
</test>
</step>

<step id="30" status="pending">
<step_metadata>
  <number>30</number>
  <title>Implement Crafting and Upgrade Systems</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<instructions>
Build comprehensive crafting system allowing players to create items, ammunition, medical supplies, and upgrade equipment using gathered resources.
</instructions>

<details>
- Create resource gathering system in `src/game/crafting`: Define resource types (Metal Parts, Electronic Components, Chemicals, Textiles, Biological Materials). Resources found while scavenging, looting containers, or harvesting defeated enemies/robots.
- Implement crafting station system: Basic crafting available from inventory for simple items. Advanced recipes require workbenches (weapon mods), chemistry stations (drugs, medicine), or garages (vehicle upgrades). Safehouses have all stations.
- Build recipe system: Recipes stored as data in `src/content/recipes`. Each recipe defines inputs (resources + quantities), required skill level, station requirement, crafting time, and outputs.
- Create craftable item categories:
  - Ammunition: craft bullets, energy cells, arrows from components
  - Medical Supplies: bandages, medkits, antidotes, stim packs, anti-rad meds
  - Food/Drink: cook raw meat, purify water, brew coffee for fatigue reduction
  - Weapon Mods: scopes, suppressors, extended magazines, damage upgrades
  - Explosives: grenades, molotovs, mines, EMP devices
  - Armor Upgrades: reinforced plating, pocketed vests for carry capacity
  - Tools: lockpicks, hacking modules, repair kits
  - Vehicle Upgrades: armor plating, engine parts, mounted weapons
- Implement recipe learning: Start with basic recipes. Learn advanced recipes from skill books (loot/purchase), NPC trainers, or by reaching skill thresholds (Hacking 50 unlocks advanced hacking tools recipe).
- Add upgrade system: Allow improving existing weapons/armor quality through resource investment. Each upgrade increases damage/protection but requires increasingly rare materials. Limit maximum upgrade level per item.
- Create crafting UI: Show known recipes, highlight craftable ones (have all materials). Display required materials, skill level, and station. Confirm button initiates crafting with time passage.
- Integrate crafting skills: Engineering affects weapon/vehicle crafting, Chemistry affects medicine/explosives, Survival affects food/scavenging efficiency. Higher skills unlock recipes, reduce material costs, or provide bonus output.
</details>

<test>
Gather crafting materials from scavenging and looting. Open crafting interface and verify recipes show with material requirements. Craft ammunition and confirm resources consumed and ammo added to inventory. Attempt advanced recipe without required station and verify it's blocked. Visit workbench and craft weapon mod, then apply it to weapon and confirm stat improvement. Learn new recipe from skill book and verify it appears in crafting menu. Craft medical supplies and use them to heal. Upgrade a weapon multiple times and confirm progressive stat increases. Craft vehicle parts at garage and install them.
</test>
</step>

<step id="31" status="pending">
<step_metadata>
  <number>31</number>
  <title>Build Industrial Wasteland Zone</title>
  <phase>Phase 7: Character Progression and Inventory</phase>
</step_metadata>

<instructions>
Create the Industrial Wasteland zone as an additional high-danger area with unique environmental hazards, enemies, and loot opportunities.
</instructions>

<details>
- Design Industrial Wasteland map in `src/content/maps`: Large area with abandoned factories, toxic refineries, chemical spills, and crumbling industrial structures. Mix of outdoor yards and interior factory floors.
- Implement environmental hazards: Toxic gas clouds (damage over time without gas mask), chemical spills (acid damage), unstable structures (collapse risk), low visibility from smog (reduced perception range), and radiation pockets.
- Create zone-specific enemies: Industrial robots (high armor, weak to EMP), mutated workers (aggressive, poison attacks), automated turrets (stationary, high damage), hazmat-suited scavengers (hostile NPCs with gas protection), and toxic creatures.
- Add unique loot opportunities: Advanced technology components, industrial-grade weapons, factory equipment for crafting, chemical resources, hazmat suits, and gas masks.
- Implement smog visibility system: Reduce visual range in outdoor areas. Requires special lighting or equipment to see clearly. Enemies using thermal vision aren't affected.
- Create Industrial Wasteland faction: Scattered survivors or scavenger gangs controlling key buildings. Potential quest givers for clearing areas or retrieving technology.
- Build zone connection: Accessible from Downtown or Slums via specific map connections. Initially appears dangerous with warnings from NPCs, encouraging preparation before entry.
- Design zone-specific quests: Investigate abandoned facility, secure safe passage through toxic areas, rescue trapped survivors, disable rogue industrial systems, recover valuable tech for factions.
- Integrate with survival systems: Radiation and toxins more prevalent, requiring proper equipment and supplies. Gas mask essential for prolonged exploration.
</details>

<test>
Travel to Industrial Wasteland from existing zones and confirm zone transition. Enter toxic gas area without gas mask and verify damage over time. Equip gas mask and confirm protection. Encounter zone-specific enemies (industrial robots, mutants) and verify their unique behaviors and resistances. Navigate low-visibility smog areas and confirm reduced perception. Find and loot advanced technology components. Accept and complete zone-specific quest. Take radiation damage in contaminated factory and use anti-rad medicine. Verify environmental hazards (collapsing structures) can trigger during exploration.
</test>
</step>
</phase>

<phase id="8" name="Testing and Final Touches">
<step id="32" status="pending">
<step_metadata>
  <number>32</number>
  <title>Test the Full Game</title>
  <phase>Phase 8: Testing and Final Touches</phase>
</step_metadata>

<instructions>
Playtest the complete game with all integrated systems to ensure cohesive gameplay.
</instructions>

<details>
- Perform full playthroughs testing all major systems: character creation, combat (basic + advanced mechanics), exploration with vehicles, survival mechanics, crafting, karma/reputation, quests, and dialogue.
- Test system integration: verify survival meters affect combat performance, karma influences dialogue options, vehicle systems work in both exploration and combat, crafting integrates with inventory and upgrades.
- Focus on fixing gameplay issues and bugs as they appear rather than formal unit testing.
- Test in multiple browsers (Chrome, Firefox, Edge, Safari) to ensure compatibility.
- Verify performance remains smooth with all systems active, especially in the Industrial Wasteland with environmental hazards.
- Test edge cases: what happens if player is hated by all factions, runs out of food in dangerous area, vehicle breaks down during combat, etc.
</details>

<test>
Complete a full playthrough from character creation to an ending. Confirm combat (basic and advanced), exploration, dialogue, progression, vehicles, survival, crafting, and all zone transitions function without crashes or major performance issues. Verify integrated systems interact correctly (e.g., high fatigue reduces combat effectiveness, vehicle fuel management affects exploration range).
</test>
</step>

<step id="33" status="pending">
<step_metadata>
  <number>33</number>
  <title>Expand Save Functionality</title>
  <phase>Phase 8: Testing and Final Touches</phase>
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

<step id="34" status="pending">
<step_metadata>
  <number>34</number>
  <title>Polish the UI</title>
  <phase>Phase 8: Testing and Final Touches</phase>
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

<step id="35" status="pending">
<step_metadata>
  <number>35</number>
  <title>Surface Level & Objective HUD</title>
  <phase>Phase 8: Testing and Final Touches</phase>
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

This plan now outlines 35 implementable steps to build the base version of "The Getaway." It focuses on:

<focus_areas>
- **Command & Atmosphere**: Establishing the resistance command hub UI, neon isometric presentation, and curfew pressure loops.
- **Living World & Narrative**: NPC routines, branching dialogue with skill checks, and quest scaffolding tied into Redux.
- **Combat & Navigation**: Turn-based encounters with cover awareness, guard perception loops, click-to-move traversal, and readable path previews.
- **Advanced Combat Systems**: Overwatch mode, targeted shots, flanking mechanics, area-of-effect attacks, and combat consumables for deeper tactical gameplay.
- **City Layout & Access**: NYC-inspired district blocks with single-entry buildings, localized naming, and door placement aligned to streets for clarity.
- **Rendering & Visuals**: Shared isometric utilities, reusable object factories, and a dedicated 2.5-D rendering pipeline.
- **Character Creation & Progression**: Comprehensive character creation with backgrounds, full attribute/skill systems, leveling with skill trees, and perk selection.
- **Inventory & Equipment**: Weight-based inventory with equipment slots, diverse weapon and armor categories, and durability tracking.
- **Vehicle Systems**: Complete vehicle integration for exploration and combat including acquisition, upgrades, fuel management, storage, and tactical combat usage.
- **Survival Mechanics**: Hunger, thirst, fatigue, radiation, injury, and disease systems that create meaningful resource management challenges.
- **Karma & Reputation**: Morality tracking and faction reputation systems that influence NPC interactions, quest availability, and endings.
- **Crafting & Upgrades**: Resource gathering, recipe learning, crafting stations, and equipment upgrade systems for ammunition, medicine, weapons, armor, and vehicles.
- **Expanded World**: Industrial Wasteland zone with unique environmental hazards, enemies, loot, and zone-specific quests.
- **Stability & Polish**: Multi-slot save system with auto-save, comprehensive playtests, and UI refinement across all systems.
</focus_areas>

Each step includes a concrete validation target to keep development measurable. The architecture prioritizes modularity and scalability, drawing inspiration from Fallout 2 while focusing on a maintainable modern web stack. Iterative playtesting complements automated checks to preserve feel and performance.

The new steps (22-31) add critical gameplay depth identified in the gap analysis:
- **Steps 22-23**: Character creation and stats systems establish player identity and progression foundation
- **Steps 24-25**: Leveling with skill trees and comprehensive inventory provide RPG depth
- **Step 26**: Advanced combat mechanics (overwatch, targeted shots, flanking, AoE) add tactical complexity
- **Step 27**: Vehicle systems become a major gameplay pillar affecting exploration and combat
- **Step 28**: Survival mechanics create tension and resource management challenges
- **Step 29**: Karma and reputation systems drive narrative consequences and faction dynamics
- **Step 30**: Crafting and upgrades enable player agency and equipment customization
- **Step 31**: Industrial Wasteland expands the world with high-risk, high-reward content

The resulting foundation positions the project for future additions like advanced quest arcs, additional zones (Outskirts/Deadlands), expanded faction conflicts, or even multiplayer while keeping the codebase approachable and maintainable.
</summary>