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
- **`CharacterScreen.tsx`**: Pip-boy style modal that presents the detailed profile (status panel, detailed stats, skill tree). Toggled via the HUD button or the `C` key and reuses existing components inside a scrollable shell.
- **`PlayerLoadoutPanel.tsx`**: Summarises equipped weapon/armor alongside perk badges; used inside the character screen.
- **`PlayerInventoryPanel.tsx`**: Displays carried items, weight totals, and overflow count within the character screen without introducing additional scroll containers.
- **`MiniMap.tsx`**: Renders a tactical overview of the current map with player/enemy markers, cover overlays, and curfew perimeter glow.
- **`DayNightIndicator.tsx`**: Surfaces the current time of day, phase transitions, and curfew countdown in the HUD.
- **`LevelIndicator.tsx`**: Floats level metadata and active objectives in the upper-left overlay, pulling data from the current `MapArea`.
- **`DialogueOverlay.tsx`**: Displays branching dialogue with NPCs, presenting options and triggering quest hooks while pausing player input.
- **`OpsBriefingsPanel.tsx`**: Serves as the quest log, surfacing active objectives with progress counters and listing recently closed missions with their payout summaries.

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
- **Visual Labeling**: Building names render once per parcel with word-wrapped, shadowed text for legibility on the outdoor map
- **Spawn Sanitization**: Blueprint positions snap to the nearest walkable street tile during world generation so nothing spawns atop a roofline
</design_principles>
<pattern name="Elevation Profiles & Facades">
- `getTileElevation` and `getElevationProfile` convert tile metadata into height offsets so walls extrude into full prisms while cover uses half-height braces.
- `renderElevationPrism` draws right/front faces with tuned shadows, then caps the roof plane; `renderWallDetails` layers neon bands and ledges, and `renderCoverDetails` adds lips plus bracing lines for tactical readability.
- Door tiles stay flat at ground level but `drawDoorTile` projects a doorway panel onto the extruded facade using the same interpolation helpers, keeping entries visually aligned with building volumes.
- `drawBuildingLabels` renders parcel names as floating neon marquees with additive glow and bracket supports so signage feels anchored to rooftops.
</pattern>
<pattern name="Character Tokens & Labels">
- `IsoObjectFactory.createCharacterToken` builds reusable player/NPC/enemy markers composed of a halo, base diamond, extruded column, and beacon cap with configurable palettes.
- `positionCharacterToken` and `createCharacterNameLabel` coordinate container depth and neon nameplates so tokens stay legible from any camera offset.
- Character overlays (health bars, combat indicators, name labels) update alongside tokens, preserving 2.5-D depth sorting while surfacing combat data.
</pattern>

<technical_flow>
**Technical Flow:**
1. <code_location>worldMap.ts</code_location> defines avenue/street boundaries via `isAvenue()` and `isStreet()` functions
2. Building definitions in <code_location>locale files</code_location> specify footprint bounds, door position, and interior dimensions
3. `applyBuildingConnections()` converts footprint tiles to walls, then explicitly marks door tiles as walkable
4. <code_location>MainScene</code_location> renders building name labels using building definitions passed from <code_location>BootScene</code_location>
5. Bidirectional connections enable seamless indoor/outdoor transitions
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
