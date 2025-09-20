# System Patterns

## Redux-Orchestrated Phaser Scenes
Phaser scenes subscribe to the Redux store and redraw sprites or tiles whenever the world slice changes. This keeps rendering deterministic without pushing Phaser state back into React.

## Tile-Based World Helpers
Helper functions in `game/world/grid.ts` create map areas, validate walkability, and expose adjacent tile lookups. Every system that needs spatial reasoning uses these helpers to avoid duplicating boundary logic.

## Door-Driven Area Transitions
Door tiles are tagged in map data and resolved through `mapConnections`. `GameController` intercepts player movement onto a door, switches the Redux `currentMapArea`, and teleports the player to the linked entrance.

