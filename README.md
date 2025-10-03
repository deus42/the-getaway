# The Getaway · Neon Resistance Sandbox

> Tactical stealth RPG authored by AI agents. Level 0 is our living lab: one occupied megacity, two distinct districts, and a HUD that never sleeps.

## Table of Contents
- [Snapshot](#snapshot)
- [Latest Transmission](#latest-transmission)
- [Gameplay Pillars](#gameplay-pillars)
- [Systems Online](#systems-online)
- [Tech Stack & Architecture](#tech-stack--architecture)
- [Working With The Game](#working-with-the-game)
- [Content Authoring Pipeline](#content-authoring-pipeline)
- [Testing & QA](#testing--qa)
- [Roadmap Signal](#roadmap-signal)
- [License – Vibe MIT](#license--vibe-mit)

## Snapshot
- **Perspective**: Isometric Phaser rendering with neon 2.5-D dressing and tactical overlays.
- **Loop**: Brief in Slums safehouses, navigate Downtown megablocks, battle curfew patrols, and thread dialogue/quest outcomes into the resistance story.
- **State of Level 0**: District-aware props, bilingual content parity, click-to-move traversal, stealth perception, and a fully AI-generated narrative pipeline.

## Latest Transmission
| Date | Drop | Highlights |
| --- | --- | --- |
| Oct 2025 | Mini-Map Overhaul | Layered controller with drag/zoom, waypoint previews, objective focus, and performance throttling. |
| Oct 2025 | Cyberpunk HUD Revamp | Tactical HUD with holo dossier, minimap navigation boosts, reactive curfew alerts. |
| Oct 2025 | District Atmospherics | Slums vs. Downtown prop palettes, neon signage, seeded NPC routines, loot glows, isometric object factory upgrades. |
| Oct 2025 | Skill Tree & Progression | SkillTreePanel with combat bonuses, XP/level-up flow, character creation wizard (identity → attributes → background). |
| Sep 2025 | Surveillance & Perception | Guard cones, alert escalations, patrol reinforcements, curfew state machine, click-to-move with path previews. |

## Gameplay Pillars
- **Infiltration Under Curfew**: Nightfall flips the city into lockdown; curfew alerts, patrol reinforcements, and cover callouts keep players hustling between safe zones.
- **Choice-Driven Narrative**: Dialogue trees, faction alignments, and quest hooks respond to skill checks, backgrounds, and bilingual localization.
- **Tactical Combat**: AP economy, cover mechanics, and equipment bonuses blend with skill-driven hit/dodge/crit maths for crunchy encounters.
- **Living Districts**: District metadata drives props, signage, loot, and NPC routines so Slums feel reclaimed while Downtown stays corporate sterile.
- **AI-Led Production**: Content, code, and roadmap execution flow from AI agents—human edits must explicitly document deviations per the license.

## Systems Online
### City & Atmosphere
- **District Overhaul (Step 11.5)**: Procedurally dressed Slums/Downtown blocks with barricades, streetlights, billboards, and neon overlays sourced from `IsoObjectFactory`.
- **NYC Grid Layout (Step 20)**: Four avenues × four streets carve 16 parcels; each door sits on a walkable tile for seamless interior transitions.
- **Day/Night & Curfew (Steps 8, 10)**: Five-minute cycle triggers curfew enforcement, animated cover highlights, and patrol spawns.

### Tactical Layer
- **Movement**: Grid-based keyboard controls plus breadth-first click-to-move with door traversal and path previews (Step 18).
- **Combat Core**: Turn-based AP system, cover penalties, skill-informed accuracy, equipment bonuses, and reinforcement hooks (Steps 5, 6, 19, 23.5).
- **Stealth Readability**: Vision cones, suspicion escalation, and network alerts telegraph when stealth is compromised (Step 19).

### Narrative & Progression
- **Dialogue & Quests (Steps 13–16)**: Branching conversations with skill gates, quest log integration, bilingual strings, and localized HUD feedback.
- **Character Creation (Steps 22.1–22.3)**: Three-step wizard for identity, SPECIAL allocation, and background perks/equipment.
- **Skills & Progression (Steps 23–24.2)**: Derived stat formulas, XP/level-up modal, skill tree branches with combat bonuses, and future perk hooks.

### UX & Accessibility
- Neon HUD arranged in a recon tri-column with minimap, status readouts, and action log.
- Character sheets, skill trees, and overlays support keyboard navigation, ARIA live regions, and bilingual toggles.
- Toast notifications and modal flows surface XP, curfew warnings, and skill gate feedback.
- Layered minimap controller delivers cached tiles, enemy/objective markers, Shift-drag waypoint previews, keyboard panning, and high-contrast/auto-rotate options.

## Tech Stack & Architecture
- **React + Vite** host the HUD, overlays, character creation flow, and modal systems.
- **Phaser** renders isometric districts, token sprites, vision cones, and path previews.
- **Redux Toolkit** persists player/world/quest slices (with `localStorage` hydration and reset hooks).
- **Content Pipeline** keeps authoring data immutable under `src/content/levels/<level-id>/locales/{en,uk}.ts`, cloned into runtime stores.
- **Memory Bank** (implementation-plan, progress, architecture, plot) records roadmap scope, shipping milestones, and narrative canon.

## Working With The Game
```bash
cd the-getaway
yarn install      # first-time setup
yarn dev          # Vite dev server + Phaser canvas
yarn build        # type-check + production bundle
yarn lint         # ESLint across the mono-neon codebase
yarn test         # Jest + Testing Library suites
```

## Content Authoring Pipeline
1. Draft quests, dialogue branches, NPC routines, loot tables, and signage metadata inside `src/content/levels/<level-id>/locales`.
2. Register new IDs through slice loaders—never mutate source exports directly; runtime clones keep authoring files pristine.
3. Update relevant Redux selectors/services (`playerSlice`, `worldSlice`, `questsSlice`, etc.) if systems evolve.
4. Mirror roadmap updates in `memory-bank/implementation-plan.md` and log completions in `memory-bank/progress.md`.

## Testing & QA
- Jest suites cover combat maths, dialogue gating, skill allocation, curfew flows, and UI regression (`src/__tests__`).
- `yarn test` for full coverage; target files (e.g., `dialogueOverlay.test.tsx`, `combat.test.ts`) when iterating fast.
- `yarn build` validates TypeScript + bundler health before every commit.
- Manual smoke: roam both districts, trigger curfew, engage patrols, and validate bilingual toggles.

## Roadmap Signal
- **Perk System (Step 24.3)**: Capstone perks and perk-aware combat hooks on deck.
- **Equipment Durability & Encumbrance (Step 25+)**: Extend stat aggregation into movement penalties and maintenance loops.
- **Directional Cover & Overwatch (Step 26+)**: Deepen tactical positioning with flanking, overwatch cones, and targeted shots.
- Track the full 24-step roadmap inside `memory-bank/implementation-plan.md`—Level 0 continues to expand toward full campaign readiness.

## License – Vibe MIT
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, subject to the following conditions:

- The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
- **Vibe Clause**: Contributions should respect the established all-AI workflow. If you introduce human-authored code, clearly document the deviation and ensure downstream users know how it diverges.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## License – Vibe MIT
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, subject to the following conditions:

- The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
- **Vibe Clause**: Any derivative or contribution must be produced entirely by AI agents. If a human writes even a single line, the license automatically terminates for that work.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
