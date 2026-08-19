<div align="center">

# The Getaway

**A browser-first surveillance RPG about escaping an occupied city before curfew.**

Read the cameras. Work your contacts. Keep your paranoia from making the decision for you.

<p>
  <a href="https://deus42.github.io/the-getaway/">
    <img alt="Play Level 0" src="https://img.shields.io/badge/PLAY_LEVEL_0-00C2FF?style=for-the-badge&logo=githubpages&logoColor=white">
  </a>
  <a href="memory-bank/04%20Engineering/Roadmap.md">
    <img alt="View the roadmap" src="https://img.shields.io/badge/VIEW_ROADMAP-202938?style=for-the-badge&logo=github&logoColor=white">
  </a>
  <a href="https://ko-fi.com/deus42">
    <img alt="Support development on Ko-fi" src="https://img.shields.io/badge/SUPPORT_ON_KO--FI-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white">
  </a>
</p>

<p>
  <img alt="Status: active prototype" src="https://img.shields.io/badge/status-active_prototype-F5A623?style=flat-square">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="Phaser 3" src="https://img.shields.io/badge/Phaser_3-211F1F?style=flat-square">
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-7BD88F?style=flat-square"></a>
</p>

</div>

> [!IMPORTANT]
> **The Getaway is an active vertical-slice prototype.** Level 0 is playable in the browser; content, balance, visual polish, and the complete mission arc are still in development.

## The city is always watching

Level 0 drops you into a four-block district of Hidzu-controlled Tokyo as an ordinary expatriate. You are trying to recover confiscated medical supplies for Lira and secure passage toward Miami before midnight, while cameras, a verifier drone, curfew, and your own paranoia narrow what you can still do.

| | Pillar | What it means in play |
| --- | --- | --- |
| 🎥 | **Legible surveillance** | Cameras, terminals, and verifiers are readable objects with real coverage, not invisible dice. You can see what watches you. |
| 💬 | **Choice-driven dialogue** | Contacts, cover identity, and the facts you have actually learned decide which routes through a conversation exist. |
| 🫥 | **Hiding and blending** | Break line of sight, use service seams and crowds, and pass as ordinary rather than fight your way out. |
| 😰 | **Paranoia and curfew pressure** | Paranoia moves through Calm, Uneasy, Shaken, and Breaking, and the city tightens as midnight approaches. |

## Play Level 0

The latest public build runs directly in a modern desktop browser:

### [Launch the playable demo →](https://deus42.github.io/the-getaway/)

| Action | Controls |
| --- | --- |
| Move | `WASD`, arrow keys, or click a destination |
| Interact | `E` near a valid target |
| Pause for observation | `O` |

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

## What is already online

- GET-204/205: a Neo Tokyo 2-derived, Hidzu-treated four-block production world is active in the Level 0 runtime.
- GET-206: twelve grounded actor sets, portraits, and the George AR presentation are committed.
- GET-216: the cover/ability/Paranoia/research version-3 runtime is being integrated and remains subject to live requester acceptance.
- English and Ukrainian content paths backed by structured narrative data.
- Surveillance causality, final dialogue/failure presentation, schedules/audio, and the complete mission route remain later tickets in the GET-139 program.

Do not infer vertical-slice completion from a bootable scene, green fixture, or generated report. Human play and fixed-viewport live evidence are acceptance gates.

## Run it locally

Requires **Node.js 20+** and **Yarn**.

```bash
git clone https://github.com/deus42/the-getaway.git
cd the-getaway/the-getaway
yarn install
yarn dev
```

Open [http://localhost:5174](http://localhost:5174). The production preview uses [http://localhost:4174](http://localhost:4174).

| Command | Purpose |
| --- | --- |
| `yarn dev` | Start the local Vite development server |
| `yarn build` | Type-check and create a production build |
| `yarn lint` | Run architecture checks and ESLint |
| `yarn test` | Run the Jest test suite |
| `yarn sprites:validate` | Validate character sprite manifests and sheets |

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

## How it is built

The browser shell and HUD live in **React**. The city, actors, cameras, and observable space render through **Phaser**. **Redux Toolkit** owns persistent game state and provides the boundary between both runtimes.

```text
the-getaway/src/
├── components/   React HUD, menus, dialogue, and player-facing flows
├── game/         Phaser scenes, world simulation, and rendering
├── store/        Player, world, quest, and progression state
└── content/      Levels, missions, dialogue, storylets, and localization
```

Additional workspace roots:

- `the-getaway/public/`: optimized runtime assets.
- `the-getaway/src/__tests__/`: Jest and Testing Library coverage.
- `memory-bank/`: canonical Markdown game-design, architecture, roadmap, and readiness vault.
- `progress/`: active Linear-task continuity notes.

## Canonical documentation

- [Game Design](memory-bank/01%20MVP/Game%20Design.md) — intended player experience and MVP systems.
- [MVP Spine](memory-bank/01%20MVP/10%20MVP%20Spine.md)
- [Level 0 Vertical Slice Contract](memory-bank/01%20MVP/11%20Level%200%20Vertical%20Slice%20Contract.md)
- [Decision Register](memory-bank/01%20MVP/12%20Game%20Design%20Decision%20Register.md)
- [Content and State Matrix](memory-bank/01%20MVP/13%20Level%200%20Content%20and%20State%20Matrix.md)
- [Architecture](memory-bank/04%20Engineering/Architecture.md) — runtime boundaries and engineering contracts.
- [Roadmap](memory-bank/04%20Engineering/Roadmap.md) — completed work, active milestones, and deferred scope.
- [MVP Readiness](memory-bank/01%20MVP/95%20MVP%20Readiness%20Checklist.md) — honest vertical-slice completion criteria and current risks.

## Legacy boundary

The repository still contains dormant pre-pivot combat, storylet, numeric-progression, and older scene code. Do not extend those systems for Level 0 or treat their tests and copy as current design. GET-208/GET-179 own the broader retirement and agent-harness modernization work.

## Feedback and support

Playing the build and sharing concrete feedback is the most useful contribution right now. Open an [issue](https://github.com/deus42/the-getaway/issues) for a reproducible bug or a focused gameplay observation; star or watch the repository if you want to follow new playable drops.

If you enjoy the direction and want to support continued development, you can buy Deus a coffee. Support is optional and does not gate access to the game or repository.

<p align="center">
  <a href="https://ko-fi.com/deus42">
    <img alt="Support The Getaway on Ko-fi" src="https://img.shields.io/badge/BUY_DEUS_A_COFFEE-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white">
  </a>
</p>

## License

The Getaway is available under the [MIT License](LICENSE).

**Vibe Clause**: contributions should respect the established all-AI workflow. If you introduce human-authored code, clearly document the deviation and ensure downstream users know how it diverges.
