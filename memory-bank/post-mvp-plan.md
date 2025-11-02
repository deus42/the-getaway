# Post-MVP Roadmap for "The Getaway"

This document catalogs Phase 9 optional expansions that were split out of `memory-bank/mvp-plan.md`. Step numbering is preserved to keep roadmap references intact, including Step 31 (Industrial Wasteland) which was moved here from the MVP scope.

<phase id="9" name="Optional Expansions (POST-MVP)">
<step id="26.1">
<step_metadata>
  <number>26.1</number>
  <title>Directional Cover and Flanking Mechanics</title>
  <phase>Phase 9: Optional Expansions (POST-MVP)</phase>
  <linear_issue key="GET-14" url="https://linear.app/the-getaway/issue/GET-14/step-261-directional-cover-and-flanking-mechanics">PostMVP</linear_issue>
</step_metadata>

<prerequisites>
- Step 26 completed (advanced combat foundations in place)
- Step 25.5 completed (equipment effects integrated with combat)
</prerequisites>

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

<step id="31">
<step_metadata>
  <number>31</number>
  <title>Build Industrial Wasteland Zone with Concrete Specifications</title>
  <phase>Phase 9: Optional Expansions (POST-MVP)</phase>
</step_metadata>

<instructions>
⚠️ **POST-MVP - Defer to v1.1+**: Stand up the Industrial Wasteland district only after the core city loop (Slums + Downtown) is stable. This zone introduces high-difficulty hazards, enemy types, and quest content that require mature combat, crafting, and narrative systems.
</instructions>

<details>
- **Design map structure** in `src/content/maps/industrialWasteland.ts`:
  - **Size**: 80×80 tiles (4× larger than Slums/Downtown starter zones)
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

<step id="40.2">
<step_metadata>
  <number>40.2</number>
  <title>LLM-driven Narrative Orchestrator (PANGeA-style)</title>
  <phase>Phase 9: Optional Expansions (POST-MVP)</phase>
  <linear_issue key="GET-83" url="https://linear.app/the-getaway/issue/GET-83/step-402-llm-driven-narrative-orchestrator">PostMVP</linear_issue>
</step_metadata>

<prerequisites>
- Core dialogue system complete (Steps 15.x or equivalent)
- Server infrastructure baseline deployed (auth, logging, rate limiting)
</prerequisites>

<instructions>
Integrate a guardrailed LLM service that generates adaptive NPC dialogue and encounters from designer-authored rules, using a validation loop to enforce canon and tone.
</instructions>

<details>
- Draft designer rule packs (`memory-bank/plot.md`, `memory-bank/game-design.md`) into machine-readable “Game Rules” fed to the service (allowed topics, banned actions, tone, fail conditions).
- Stand up a Node-based narrative service (`services/narrative/`) with REST endpoints for session init, player turn submission, validator feedback, and memory updates. Wire it to an embeddings-backed memory store (e.g., vector DB or bespoke cosine matcher) for short- and long-term recall per playthrough.
- Implement validation pipeline: rule checks, content filters, and structural validators (quest state alignment) that loop until responses meet constraints or escalate errors.
- Generate NPC profiles using Big Five traits and faction metadata; persist them so repeated encounters stay consistent. Provide hooks so designers can seed fixed archetypes before runtime variation kicks in.
- Bridge Phaser/React client to the narrative service via a lightweight HTTP client, handling conversational state, streaming outputs, and fallbacks when service is unavailable.
- Document the workflow in `memory-bank/architecture.md` and add a companion `memory-bank/narrative-ai.md` outlining prompt schemas, validation stages, and operational safeguards.
</details>

<test>
- Run service-level tests that feed sample player prompts through the validator to confirm tonal and rule compliance before dialogue is accepted.
- Simulate multi-turn conversations with NPCs to ensure memory recall, personality consistency, and quest-state alignment.
- Perform load and failure simulations (service unavailable, rate limits exceeded) so the client degrades gracefully to scripted dialogue.
- Security review: confirm prompts and responses are logged/audited per privacy guidelines and that abuse filters block disallowed content.
</test>
</step>

<step id="40.5">
<step_metadata>
  <number>40.5</number>
  <title>Dynamic Black Market Economy & Smuggling Missions</title>
  <phase>Phase 9: Optional Expansions (POST-MVP)</phase>
  <linear_issue key="GET-84" url="https://linear.app/the-getaway/issue/GET-84/step-405-dynamic-black-market-economy-and-smuggling-missions">PostMVP</linear_issue>
</step_metadata>

<prerequisites>
- Core crafting and inventory loops completed (Steps 30.1, 30.2)
- Faction reputation/heat systems live (Steps 29.x)
- Save migration tooling established (Step 33)
</prerequisites>

<instructions>
Introduce a reactive black-market economy that mirrors citywide scarcity and enforcement pressure. Prices, inventory, and smuggling contracts should ebb and flow based on regional heat, uprisings, and faction control, giving players strategic reasons to manage supply lines and take risks for profit.
</instructions>

<details>
- Extend `economySlice` (or create `blackMarketSlice`) to track commodity demand (`ammo`, `meds`, `contraband`, `intel`), enforcement pressure, and faction ownership per district. Persist rolling averages so trends feel lived-in rather than spiky.
- Author `blackMarketDirector.ts` that ticks daily: ingests district heat/uprising data, populates vendor inventories, sets price multipliers, and spawns limited-time smuggling contracts. Provide hooks for player actions (sabotage, propaganda, supply drops) to influence indices.
- Build merchant UI expansions (`BlackMarketPanel.tsx`) showing fluctuating prices, scarcity badges, and risk indicators (e.g., high surveillance, undercover stings). Support bulk trades, haggle rolls, and intel-based forecasts.
- Create contract templates in `src/content/economy/contracts.ts` (e.g., deliver meds during crackdown, smuggle hacked chips past CorpSec) with branching outcomes that adjust reputation and economy metrics. Integrate contract selection into safehouses/contacts.
- Implement risk mechanics: covert runs roll against patrol density; failure triggers ambush encounters or confiscation. Allow equipment/perks to mitigate risk (e.g., forged permits, stealth vehicles).
- Update `memory-bank/game-design.md` with economy formulas (WHAT) and `memory-bank/architecture.md` with data flow and director integration (HOW) when implemented.
</details>

<test>
- Simulate high heat in Downtown and confirm ammo/med prices spike, legal vendors lock inventory, and black-market traders offer inflated rates with added risk warnings.
- Complete a smuggling contract under varying patrol pressure to verify risk calculations, reward distribution, and economy deltas behave as expected.
- Use Intel perks or crew missions to manipulate supply; ensure the director reflects the change on the next tick and UI surfaces trend updates.
- Save/load mid-contract and post-transaction to confirm economy indices and limited-time offers persist accurately.
</test>
</step>

<step id="26.4">
<step_metadata>
  <number>26.4</number>
  <title>Advanced Stamina - Day/Night, Fatigue & Environmental Systems</title>
  <phase>Phase 9: Optional Expansions (POST-MVP)</phase>
  <linear_issue key="GET-85" url="https://linear.app/the-getaway/issue/GET-85/step-261-advanced-stamina-systems">PostMVP</linear_issue>
</step_metadata>

<prerequisites>
- Step 24.5 completed (core stamina system MVP)
- Step 8 completed (day/night cycle functional)
</prerequisites>

<instructions>
Expand the core stamina system with day/night modifiers, circadian fatigue, environmental effects, advanced perks, and rest mechanics.
</instructions>

<details>
**Day/Night Stamina Modifiers:**
- Day (6AM-10PM): Normal stamina costs, normal regen
- Night (10PM-6AM): +25% stamina costs, -2 regen (exhaustion, stress, poor visibility)
- Curfew zones at night: Additional -3 stamina per turn (paranoia drain)
- Display time-of-day modifier in `DayNightIndicator` component

**Circadian Fatigue System:**
- Track `hoursAwake` in player state (increments with in-game time)
- After 8 hours awake: Max stamina -10% per additional hour
- Sleep at safehouse: Reset fatigue, restore full stamina
- Consumables (Coffee, Stims): Delay fatigue 2 hours, then accelerate accumulation
- All-nighter penalty: After 16 hours awake, permanent exhaustion state until rest

**Environmental Effects:**
- Industrial zones: -2 stamina per turn (pollution exposure)
- Heat/weather events: +20% stamina costs during active weather
- Rough terrain tiles: Double movement stamina cost (4 instead of 2)
- Toxic areas: -1 stamina regen while exposed

**Advanced Perks & Abilities:**
- **Conditioning** skill (Survival tree, 0-100): Reduce stamina costs by 0.5% per point (max 50% at 100)
- **Second Wind** perk (Survival, Medicine 40): Auto-restore 40 stamina when dropping below 10 (once per combat)
- **Battle Trance** ability (Level 15+, Combat tree): Ignore stamina costs for 3 turns, then crash to 10 stamina with -3 regen for 2 turns
- **Iron Lungs** perk (Survival, Endurance 7): +25% stamina regeneration rate

**Rest & Recovery System:**
- Create `src/game/world/rest.ts` for sleep mechanics
- Safehouse sleep options:
  - **Quick Rest** (1 hour in-game): Restore 50% stamina, remove minor fatigue
  - **Full Sleep** (6 hours): Restore 100% stamina, reset circadian fatigue, advance time to morning
  - **Catnap** (30 min): Restore 25% stamina, slight fatigue reduction
- **Sleeping Bag** item (craftable): Rest anywhere with 25% random encounter risk per hour
- Build `RestMenuPanel.tsx` showing rest options with time/stamina trade-offs

**Food/Water Integration:**
- Well-fed status (ate within 2 hours): +2 stamina regen
- Hungry (6+ hours no food): -1 regen
- Dehydrated (4+ hours no water): -2 regen, all costs +10%
- Meal quality tiers: Rations (basic), Cooked (+5 instant, well-fed), Gourmet (+10 instant, +3 regen for 1 hour)

**Redux State Extensions (`playerSlice.ts`):**
- New fields: `hoursAwake: number`, `fatigueLevel: number`, `lastMealTime: number`, `lastDrinkTime: number`
- New reducers:
  - `applyTimeOfDayStaminaModifier(state)`
  - `incrementFatigue(state, hoursElapsed)`
  - `resetFatigue(state)`
  - `updateHungerThirst(state)`
- Hook into world time updates to track hours awake and hunger/thirst

**UI Enhancements:**
- Add `CircadianFatigueTracker` widget showing hours awake with warning at 8+ hours
- Update `DayNightIndicator` to show current stamina cost modifier ("+25% costs" at night)
- Create `RestMenuPanel` with visual time/stamina previews
- Show environmental stamina effects in status panel (pollution icon, terrain icon)

**Implementation Files:**
- `src/game/world/rest.ts`: Sleep/rest mechanics and encounter checks
- `src/content/consumables.ts`: Coffee, stims, meals with stamina effects
- `src/content/perks.ts`: Conditioning, Second Wind, Iron Lungs, Battle Trance
- `src/components/ui/CircadianFatigueTracker.tsx`: Hours awake display
- `src/components/ui/RestMenuPanel.tsx`: Sleep options interface
</details>

<test>
**Day/Night Integration:**
- Fight same enemy at day vs night → verify night costs 25% more stamina per action
- Enter curfew zone at night → stamina drains 3/turn passively
- Sunrise transition → verify stamina costs return to normal and regen increases by 2

**Fatigue System:**
- Play for 8 in-game hours without rest → verify max stamina reduced by 10%
- Continue to 12 hours awake → verify max stamina reduced by 40%
- Sleep at safehouse (Full Sleep) → fatigue resets, stamina fully restored
- Drink Coffee → fatigue delayed 2 hours, then accelerates

**Environmental Effects:**
- Enter Industrial Wasteland → -2 stamina drain per turn from pollution
- Move through rough terrain → movement costs 4 stamina instead of 2
- Heat wave event triggers → all actions cost +20% stamina

**Advanced Abilities:**
- Allocate 50 Conditioning skill points → verify 25% stamina cost reduction
- Drop below 10 stamina with Second Wind perk → auto-restore 40 stamina (once per combat)
- Activate Battle Trance at 15 stamina → spend 60 stamina over 3 turns (costs ignored) → crash to 10 stamina with -3 regen penalty

**Rest System:**
- Open Rest Menu at safehouse → see Quick Rest, Full Sleep, Catnap options
- Choose Full Sleep → 6 hours pass, stamina restored, fatigue reset, time advances to morning
- Use Sleeping Bag in wilderness → 25% chance encounter interrupts sleep with partial restore

**Food/Water:**
- Eat cooked meal → gain Well-Fed buff (+2 regen for 2 hours)
- Go 6 hours without food → Hungry debuff (-1 regen)
- Go 4 hours without water → Dehydrated (-2 regen, +10% costs)

yarn build && yarn test
</test>
</step>

<step id="27.1">
<step_metadata>
  <number>27.1</number>
  <title>Vehicle Acquisition and Storage (Motorcycle Only, Basic Trunk)</title>
  <phase>Phase 9: Optional Expansions (POST-MVP)</phase>
  <linear_issue key="GET-86" url="https://linear.app/the-getaway/issue/GET-86/step-271-motorcycle-acquisition-and-storage">PostMVP</linear_issue>
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
  <linear_issue key="GET-87" url="https://linear.app/the-getaway/issue/GET-87/step-281-hunger-and-thirst-survival-mode">PostMVP</linear_issue>
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
</phase>
