# The Getaway · Level 0 Foundation

## Overview
The Getaway is an AI-authored tactical stealth RPG unfolding across an occupied futurist city. Level 0 lays the groundwork for a living world: every system is data-driven, every district carries a distinct vibe, and the HUD keeps critical intel front-and-center.

- **Perspective**: Grid-based command shell rendered through Phaser.
- **Core Loop**: Explore, infiltrate, converse, and survive curfew sweeps while quests, dialogue, combat, and world state stay in sync.
- **Latest Drop (Oct 2025)**: Downtown and Slums now broadcast unique ambience—building metadata powers street props, signage palettes, NPC highlights, and loot placement. The HUD sports a neon facelift with a compact recon panel and holo-style character dossier.

## What’s Inside
- **React + Vite Shell**: Hosts the HUD, overlays, and Mini-map services.
- **Phaser District Renderer**: Draws isometric tiles, encounter props, path previews, and entity tokens.
- **Redux Toolkit State**: Tracks player stats, quests, encounters, world transitions, and curfew timers with persistence to `localStorage`.
- **Content-First Pipeline**: All narrative, quests, NPC routines, item drops, cover spots, and building definitions live under `src/content/levels/<id>/locales`. Runtime code clones this data so authoring files stay immutable.
- **Bilingual Delivery**: English and Ukrainian locales ship in sync—HUD copy, dialogue trees, quests, and world metadata swap instantly at runtime.

## Current Gameplay Loop (Level 0 Sandbox)
1. Brief with faction contacts in the Slums, accept procedurally-authored quests.
2. Traverse interior megablocks, using district-specific cover (scrap barricades vs. corporate planters) while staying ahead of curfew patrols.
3. Complete objectives, resolve combat, and monitor the neon three-column HUD (Status, Canvas, Log) for live intel and rewards.

## Development Workflow
1. Author or tweak data in `src/content/levels/<level-id>` (dialogues, quests, NPCs, loot, signage, cover).
2. If systems evolve, update slices (`playerSlice`, `worldSlice`, etc.) or services to consume the cloned data—never mutate source exports directly.
3. Document scope changes or completions in `memory-bank/implementation-plan.md` and `memory-bank/progress.md`.
4. Run `yarn test` (or targeted files) and `yarn build` before committing.

## FAQ
**What is Level 0?**  
It’s the proving ground—every mechanic, UI experiment, and content pattern ships here before new districts are added.

**How do I add new quests or NPCs?**  
Expand the relevant locale file, hook it through the level index, and ensure slices or systems reference the new IDs. Runtime cloning keeps authoring files pristine.

**Can I push manual code edits?**  
The project embraces AI-led development. If you introduce manual changes, keep them consistent with the existing architecture, document them, and ensure tests/builds pass.

**Does the game support saves?**  
Yes. Redux state persists to `localStorage`, so reloading resumes in-place.

## License – Vibe MIT
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, subject to the following conditions:

- The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
- **Vibe Clause**: Contributions should respect the established all-AI workflow. If you introduce human-authored code, clearly document the deviation and ensure downstream users know how it diverges.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Architecture Snapshot
- **React + Vite** host the HUD and game shell.
- **Phaser** renders grid scenes, path previews, and entity sprites.
- **Redux Toolkit** manages player/world/quest slices with persistence.
- **Content Pipeline**: `src/content/levels/level0/locales` exports quests, dialogues, NPC & item blueprints, building footprints, and cover placements per locale. Future levels drop into sibling folders and plug in via slice registries.

## Gameplay Loop (Level 0)
1. Scout the Slums hub, meet faction contacts, and accept AI-authored quests.
2. Navigate interior megablocks, respecting curfew patrols, scrap barricades, and corporate streetlights spawned per district.
3. Resolve encounters, turn in objectives, and review the Quest Log sidebar for status + rewards while the neon HUD keeps stats, loadouts, and recon intel always-on.

## Development Workflow
1. Spawn new content under `src/content/levels/<level-id>`.
2. Update slices or loaders to consume the cloned data (never mutate source exports).
3. Keep documentation synced under `memory-bank/` to track roadmap progress.
4. Run `yarn test` subsets (`dialogueOverlay`, `opsBriefingsPanel`, etc.) after each feature pass.

## FAQ
**Q: Why “Level 0”?**  
It is the sandbox where every mechanic is proven before new districts arrive.

**Q: Can I add human-written code?**  
Only if you are prepared to violate the license. Vibe coding means 100% AI-generated contributions.

**Q: How do I extend the quest roster?**  
Add quest definitions to the relevant level content file, expose them through the registry, and ensure slices clone them on load.

**Q: Does the game support saves?**  
Yes. Redux state persists to `localStorage` for quick resumes.

## License – Vibe MIT
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, subject to the following conditions:

- The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
- **Vibe Clause**: Any derivative or contribution must be produced entirely by AI agents. If a human writes even a single line, the license automatically terminates for that work.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
