# The Getaway · Level 0 Foundation

## Overview
- **Genre**: Tactical stealth RPG set inside an occupied futurist city.
- **Perspective**: Grid-based command shell with Phaser-rendered districts.
- **Goal**: Build a living foundation where every system can scale by swapping level resource packs rather than rewriting code.

## Approach & Design Pillars
1. **Vibe Coding Mandate** – Every asset, quest, and byte must be authored by AI agents. Human edits break the vibe and void the license.
2. **Level-Centric Governance** – Narrative, NPCs, items, and cover layouts live under `src/content/levels`. Runtime systems clone those structures so authoring data stays immutable and auditable.
3. **Three-Column Command UI** – Status, canvas, and logs stay visible at all times so players never lose critical intel.
4. **Quest-Driven Dialogue** – Conversations gate objectives, rewards, and state transitions directly through Redux slices.
5. **Safety-First Movement** – Click-to-move navigation, NPC collision checks, and curfew logic form the baseline feel.

## Architecture Snapshot
- **React + Vite** host the HUD and game shell.
- **Phaser** renders grid scenes, path previews, and entity sprites.
- **Redux Toolkit** manages player/world/quest slices with persistence.
- **Content Pipeline**: `src/content/levels/level0` exports quests, dialogues, NPC & item blueprints, building footprints, and cover placements. Future levels drop into sibling folders and plug in via slice registries.

## Gameplay Loop (Level 0)
1. Scout the Slums hub, meet faction contacts, and accept AI-authored quests.
2. Navigate interior megablocks, respecting curfew patrols and cover spots.
3. Resolve encounters, turn in objectives, and review the Quest Log sidebar for status + rewards.

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
I'm vibe coding this game 100%
