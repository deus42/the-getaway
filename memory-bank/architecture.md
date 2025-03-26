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

- **`worldSlice.ts`**: World state management:
  - Current map area and time tracking
  - Combat state handling
  - Entity management (enemies, NPCs, items)
  - Environmental state like day/night cycle

- **`questsSlice.ts`**: Quest and dialogue state:
  - Active and completed quests
  - Quest objectives and progress
  - Dialogue tracking and history
  - Active dialogue state for UI rendering

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

### Redux Store

The Redux store serves as the central state management system, with:
- Separate slices for different game aspects
- Actions and reducers for state updates
- Selectors for efficient state access

## Data Flow

1. User interactions (keyboard, mouse) are captured by React or directly by Phaser
2. Game logic in the `/src/game` modules processes these inputs
3. State changes are dispatched to the Redux store
4. UI components react to state changes and update accordingly
5. The game rendering is handled by Phaser through the GameCanvas component

## Implementation Patterns

The codebase follows several consistent patterns:

### Immutability

All state updates are performed immutably using object spreads and function returns rather than direct mutation. This enables:
- Predictable state management
- Easy undo/redo functionality in the future
- Better performance through reference equality checks

Example from `combat/combatSystem.ts`:
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

### Type Safety

Strong typing is used throughout the codebase to prevent runtime errors and provide better developer experience:
- All function parameters and return types are explicitly typed
- Unions and intersections are used to model complex relationships
- Generic types are employed where appropriate for reusability

### Pure Functions

Most game logic is implemented as pure functions that:
- Take inputs and return outputs without side effects
- Don't rely on external state outside their parameters
- Are easy to test in isolation
- Can be composed to create more complex behaviors

### React Component Structure

React components follow a consistent pattern:
- Functional components with hooks
- Props are explicitly typed
- Side effects are managed with useEffect
- Component responsibilities are clearly defined and focused

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

- Initializes and renders the Phaser game in a React component
- Maintains a reference to the game instance throughout component lifecycle
- Handles the creation and destruction of the Phaser game
- Displays a UI overlay with game state information from Redux
- Uses a responsive container to fit various screen sizes

#### GameController Component (`src/components/GameController.tsx`)

The GameController handles user input and dispatches appropriate actions:

- Listens for keyboard events (arrow keys and WASD)
- Translates user input into game actions via Redux
- Implements collision detection with the game world
- Manages action points during combat
- Follows React's event handling patterns with useEffect/useCallback

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

1. User input (e.g., keyboard press) is captured by `GameController`
2. `GameController` dispatches Redux actions (e.g., `movePlayer`)
3. Redux reducers update the store state
4. The `MainScene`, subscribed to the store, detects changes
5. `MainScene` updates the visual representation based on new state

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
