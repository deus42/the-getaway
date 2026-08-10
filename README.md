# The Getaway

The Getaway is a grounded dystopian surveillance RPG about escape, paranoia, dialogue, hiding, compromised technology, and the social cost of living under institutional observation.

The current MVP target is a 15–20 minute outdoor Level 0 vertical slice in Hidzu-controlled Tokyo. The protagonist is an ordinary expatriate trying to recover confiscated medical supplies for Lira and secure passage toward Miami while cameras, one verifier drone, curfew, and their own Paranoia narrow the available options.

## Current product contract

- Isometric outdoor district built as a dense four-block mission envelope.
- Direct click-to-move and WASD movement; no player A*, automatic safest-path selection, or tactical route planner.
- Four authored civilian covers at New Game: one playable in Level 0 and three visibly disabled future choices.
- Binary named abilities, deterministic met/not-met gates, and exact reasons; no attributes, skills, XP, levels, or hidden rolls.
- One condition resource, Paranoia, presented as Calm, Uneasy, Shaken, and Breaking rather than a number.
- Safehouse research trades one declared fact plus world minutes for one ability, once per option.
- Dialogue, contacts, facts, George, cameras, hiding/blending, and escape are the core systems.
- No active combat loop, AutoBattle, weapons, EMP magic, deep inventory, procedural dialogue, or runtime LLM story generation.

The canonical design contract lives in [`memory-bank/01 MVP/Game Design.md`](memory-bank/01%20MVP/Game%20Design.md). Runtime or test code that contradicts the canonical specification is legacy evidence, not current product authority.

## Current implementation state

- GET-204/205: a Neo Tokyo 2-derived, Hidzu-treated four-block production world is active in the Level 0 runtime.
- GET-206: twelve grounded actor sets, portraits, and the George AR presentation are committed.
- GET-216: the cover/ability/Paranoia/research version-3 runtime is being integrated and remains subject to live requester acceptance.
- Surveillance causality, final dialogue/failure presentation, schedules/audio, and the complete mission route remain later tickets in the GET-139 program.

Do not infer vertical-slice completion from a bootable scene, green fixture, or generated report. Human play and fixed-viewport live evidence are acceptance gates.

## Stack and workspace

- `the-getaway/`: Vite, React, TypeScript, Redux Toolkit, and Phaser application.
- `the-getaway/src/`: application and runtime source.
- `the-getaway/public/`: optimized runtime assets.
- `the-getaway/src/__tests__/`: Jest and Testing Library coverage.
- `memory-bank/`: canonical Markdown game-design, architecture, roadmap, and readiness vault.
- `progress/`: active Linear-task continuity notes.

## Run locally

```bash
cd the-getaway
yarn install
yarn dev
```

The Vite development server uses `http://localhost:5174` with a strict port. The production preview uses `http://localhost:4174`.

## Verification

From `the-getaway/`:

```bash
yarn lint
yarn build
yarn test --runInBand
yarn test --coverage --runInBand
yarn playtest:agent -- --ticket GET-XXX --mode closeout
```

Sprite changes also require `yarn sprites:validate`. Visual or gameplay work additionally requires live normal-control inspection at the target desktop and mobile viewports; automated checks are regression evidence, not visual acceptance.

## Canonical documentation

- [Game Design](memory-bank/01%20MVP/Game%20Design.md)
- [MVP Spine](memory-bank/01%20MVP/10%20MVP%20Spine.md)
- [Level 0 Vertical Slice Contract](memory-bank/01%20MVP/11%20Level%200%20Vertical%20Slice%20Contract.md)
- [Decision Register](memory-bank/01%20MVP/12%20Game%20Design%20Decision%20Register.md)
- [Content and State Matrix](memory-bank/01%20MVP/13%20Level%200%20Content%20and%20State%20Matrix.md)
- [Architecture](memory-bank/04%20Engineering/Architecture.md)
- [Roadmap](memory-bank/04%20Engineering/Roadmap.md)
- [MVP Readiness](memory-bank/01%20MVP/95%20MVP%20Readiness%20Checklist.md)

## Legacy boundary

The repository still contains dormant pre-pivot combat, storylet, numeric-progression, and older scene code. Do not extend those systems for Level 0 or treat their tests and copy as current design. GET-208/GET-179 own the broader retirement and agent-harness modernization work.

## License – Vibe MIT

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, subject to the following conditions:

- The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
- **Vibe Clause**: Contributions should respect the established all-AI workflow. If you introduce human-authored code, clearly document the deviation and ensure downstream users know how it diverges.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
