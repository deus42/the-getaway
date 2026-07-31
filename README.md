<div align="center">

# The Getaway

**A browser-first tactical stealth RPG about surviving an occupied city after curfew.**

Scout routes by day. Infiltrate by night. Talk, sneak, or fight your way through Level 0.

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

## The city changes after dark

Level 0 drops you into a divided megacity where the rules tighten when curfew begins. Read patrol routes, work your contacts, manage rising paranoia, and choose how much attention you are willing to attract.

| | Pillar | What it means in play |
| --- | --- | --- |
| 🥷 | **Stealth under surveillance** | Break sightlines, read vision cones, control noise, and move before suspicion becomes an alarm. |
| 💬 | **Choice-driven dialogue** | Use background, skills, and faction context to unlock different ways through a problem. |
| 🎯 | **Tactical fallback** | Spend action points, use cover, and fight when a quiet route collapses. |
| 👁️ | **Paranoia and curfew pressure** | The city becomes more dangerous at night, and exposure carries consequences beyond a single encounter. |

## Play Level 0

The latest public build runs directly in a modern desktop browser:

### [Launch the playable demo →](https://deus42.github.io/the-getaway/)

| Action | Controls |
| --- | --- |
| Move | `WASD`, arrow keys, or click a destination |
| Sprint | Hold `Shift` while moving |
| Toggle stealth | `X` or the Stealth control in the HUD |
| Interact / sabotage | `E` near a valid target |
| Combat action | `Space` |

## What is already online

- An isometric Level 0 city split between Downtown control and Slums resistance.
- Day/night simulation with curfew enforcement, patrols, cameras, readable vision, and suspicion states.
- Click-to-move navigation, grid movement, interiors, contacts, quests, and environmental interactions.
- Character creation, attributes, backgrounds, skill checks, progression, equipment, and inventory systems.
- Tactical combat with action points, cover, equipment modifiers, and optional AutoBattle assistance.
- English and Ukrainian content paths backed by structured narrative data.
- George, an in-world assistant that surfaces essential mission and system signals.

The next milestone is not “more systems.” It is a tighter, more coherent vertical slice: clearer onboarding, stronger authored encounters, finished presentation, and a reliable beginning-to-end Level 0 run.

## Run it locally

Requires **Node.js 20+** and **Yarn**.

```bash
git clone https://github.com/deus42/the-getaway.git
cd the-getaway/the-getaway
yarn install
yarn dev
```

Open [http://localhost:5174](http://localhost:5174).

| Command | Purpose |
| --- | --- |
| `yarn dev` | Start the local Vite development server |
| `yarn build` | Type-check and create a production build |
| `yarn lint` | Run architecture checks and ESLint |
| `yarn test` | Run the Jest test suite |
| `yarn sprites:validate` | Validate character sprite manifests and sheets |

## How it is built

The browser shell and HUD live in **React**. The city, actors, cameras, and tactical space render through **Phaser**. **Redux Toolkit** owns persistent game state and provides the boundary between both runtimes.

```text
the-getaway/src/
├── components/   React HUD, menus, dialogue, and player-facing flows
├── game/         Phaser scenes, world simulation, combat, and rendering
├── store/        Player, world, quest, combat, and progression state
└── content/      Levels, missions, dialogue, storylets, and localization
```

Canonical project docs:

- [Game Design](memory-bank/01%20MVP/Game%20Design.md) — intended player experience and MVP systems.
- [MVP Readiness](memory-bank/01%20MVP/95%20MVP%20Readiness%20Checklist.md) — honest vertical-slice completion criteria and current risks.
- [Architecture](memory-bank/04%20Engineering/Architecture.md) — runtime boundaries and engineering contracts.
- [Roadmap](memory-bank/04%20Engineering/Roadmap.md) — completed work, active milestones, and deferred scope.

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
