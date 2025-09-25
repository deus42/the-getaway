## Progress Log

This log summarizes major delivery steps and keeps lightweight backlog notes for the team.

### Completed Milestones

| Step | Date | Highlights |
| --- | --- | --- |
| 1. Scaffold Application | 2024‑03‑26 | Vite + React + TypeScript + Phaser scaffolded, Jest/RTL and ESLint configured. |
| 2. Core Game Modules | 2024‑03‑26 | Established interfaces and systems for combat, inventory, quests, and Redux slices. |
| 3. Embed Game Engine | 2024‑03‑26 | Hooked Phaser `MainScene` into `GameCanvas`, wired `GameController` input, added store ↔ scene sync with tests. |
| 4. Grid Movement Polish | 2024‑03‑28 | Added walls/cover tiles, improved camera & resize behaviour, ensured pixel-perfect grid rendering. |
| 5. Combat Loop | 2024‑03‑30 | Implemented turn cycle, AP costs, hit/miss resolution, and baseline enemy AI. |
| 6. Cover Mechanics | 2024‑04‑02 | Integrated cover bonuses into combat calculations and enemy targeting logic. |
| 7. Explorable Map | 2025‑06‑07 | Introduced Slums ↔ Downtown areas, door transitions, map redraw on area swap. |
| 8. Day/Night & Curfew | 2024‑04‑05 | Drove cycle from Phaser, added curfew patrols/door lockdown, surfaced phase HUD overlay. |
| 9. Menu & Persistence | 2025‑03‑15 | Added main menu overlay, new/continue workflow, Redux persistence to `localStorage`. |
| 10. Curfew UX Refresh | 2025‑03‑18 | Highlighted cover tiles, added patrol warning/respawn rules, consolidated recon HUD, removed bottom indicator. |

### In Progress

* Document the ConPort (Context Portal) workflow for contributors.
* Investigate cloning `MapArea` definitions to avoid shared enemy mutation during transitions.

### Backlog

* Expand quest/content tooling and persist quest progress in saves.
* Prototype stealth/visibility rules that interact with curfew sweeps.
* Automate syncing `memory-bank` docs (including this log) into ConPort dashboards.
