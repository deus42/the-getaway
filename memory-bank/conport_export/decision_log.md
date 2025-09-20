# Decision Log

## Decision
* [2024-03-26] Use Phaser embedded in a React shell for rendering tactical combat.
## Rationale
* Phaser provides deterministic grid rendering and camera control while React handles UI overlays.
## Implementation Details
* `GameCanvas.tsx` boots `BootScene` + `MainScene`; Redux store is passed through a shared singleton for scene updates.
---
## Decision
* [2024-03-26] Centralize long-lived game state in Redux Toolkit slices.
## Rationale
* Shared state between React components and Phaser scenes demands a predictable, serializable store with time-travel support.
## Implementation Details
* `store/index.ts` combines `player`, `world`, `quests`, and `log` reducers; slices expose typed actions for controllers/scenes.
---
## Decision
* [2025-06-07] Transition project memory from ad-hoc markdown banks to ConPort-managed context.
## Rationale
* ConPort offers structured storage, embeddings, and tool access, eliminating manual `yarn portal:build` maintenance.
## Implementation Details
* Added `memory-bank/conport_export/*` templates and `scripts/conport_import.py` to populate the ConPort SQLite database.
---
