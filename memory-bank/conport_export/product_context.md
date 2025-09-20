# Product Context

## Project Overview
* "The Getaway" is a browser-based tactical RPG built with React, Vite, and TypeScript that embeds a Phaser scene for grid combat.
* The core narrative follows a 2036 dystopian Miami uprising inspired by the memory-bank backstory.

## Architecture Snapshot
* React renders shell UI panels while Phaser's `MainScene` draws the grid, player, and enemies, keeping rendering decoupled from logic.
* Redux Toolkit slices (`player`, `world`, `quests`, `log`) hold all authoritative game state for both UI components and Phaser.
* Grid utilities (`game/world/grid.ts`) generate map tiles, cover, and walkability helpers consumed across systems.

## Key Systems
* Combat subsystem (`game/combat`) provides AP-based attacks, cover-aware hit logic, and the tactical enemy AI used by `GameController`.
* World subsystem (`game/world`) now includes `worldMap.ts` which defines the Slums and Downtown zones plus door-based connections.
* Quest, dialogue, and inventory modules exist with scaffolding ready for future feature steps.

## Tooling & Workflows
* Yarn 4 manages dependencies; Vite powers dev server/build; Jest covers unit tests with jsdom.
* Context management is migrating to ConPort using markdown exports under `memory-bank/conport_export/` and the helper importer script.
* `.portal` artifacts from the legacy Node CLI remain gitignored but will be phased out once ConPort adoption is complete.

## Recent Changes
* Step 7 introduced `worldMap.ts`, map transition logic in `GameController`, and Phaser updates for map redrawing on area swaps.
* Cover tiles were restored to walkable so combat tests and AI logic align with expectations.
* ConPort import helper (`scripts/conport_import.py`) and structured markdown exports were added to replace the manual context portal build.

