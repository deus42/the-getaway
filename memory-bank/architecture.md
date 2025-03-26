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
- Combat initialization and state management
- Action Point (AP) system implementation
- Attack mechanics and damage calculations
- Cover system logic

#### `/the-getaway/src/game/world`

Manages the game world and environment:
- Grid-based movement system
- Map definition and rendering
- Collision detection
- Day-night cycle mechanics
- NPC movement and pathfinding

#### `/the-getaway/src/game/quests`

Quest and dialogue systems:
- Quest definitions and tracking
- Dialogue trees and conversation logic
- Skill checks and conditional dialogue options
- Reward management

#### `/the-getaway/src/game/inventory`

Inventory and item management:
- Weight-based inventory system
- Item definitions and properties
- Inventory UI interaction logic

#### `/the-getaway/src/game/interfaces`

Character attributes and core game interfaces:
- Player stats and attributes
- Leveling and progression systems
- Character skills and abilities

### `/the-getaway/src/store`

Redux state management:
- **`index.ts`**: Main Redux store configuration
- Will contain slices for different aspects of game state (player, world, inventory, quests, etc.)

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

## Future Considerations

- **Scalability**: The folder structure is designed to support expansion to Fallout 2 scale
- **Modularity**: Components and game logic are separated to allow for easier maintenance
- **Testing**: Jest configuration is in place to support testing as the codebase grows
- **Asset Management**: Structure accommodates the addition of many assets as they're created

This architecture provides a solid foundation for implementing the features outlined in the implementation plan while maintaining code organization and scalability.
