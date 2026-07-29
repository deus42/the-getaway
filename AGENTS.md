# The Getaway Agent Guide

This file is the project-specific overlay for **The Getaway**. Shared execution, safety, evidence, review, rating, debug, and handoff policy lives in the Vault Agent Operating System; do not duplicate it here.

## Preload and precedence

Before repository work, read in order:

1. `/Users/deus/Projects/Vault-Tec/00 Agent Memory.md`
2. `/Users/deus/Projects/Vault-Tec/35 Context/Agent Operating System.md`
3. `/Users/deus/Projects/Vault-Tec/90 Admin/Workstream Registry/Source Projects/local-the-getaway.md`
4. `/Users/deus/Projects/Vault-Tec/90 Admin/Workstream Registry/Project Workspaces/the-getaway.md`
5. This file and the active `progress/<Linear-key>.md` note, when one exists

Re-open the workspace record, this file, and the active task note after a session resume or context compaction.

Intentional local overrides to Vault defaults:

- Work in the visible shared workspace on `main` unless the requester explicitly asks for a branch or worktree.
- For visual/gameplay work, prove the live behavior before running the full automated closeout block.
- Commit only when the requester explicitly authorizes a commit.
- Move Linear to `Done` only after the requester verifies the committed build.

## Workspace

- App root: `the-getaway/` (Vite, React, TypeScript, Redux Toolkit, Phaser).
- Source: `the-getaway/src/`; runtime assets: `the-getaway/public/`; tests: `the-getaway/src/__tests__/`; build output: `the-getaway/dist/`.
- Use Yarn. From `the-getaway/`: `yarn dev`, `yarn build`, `yarn preview`, `yarn lint`, `yarn test`, `yarn test:watch`.
- Vite dev: `http://localhost:5174`; preview: `http://localhost:4174`; both use strict ports.
- Runtime secrets belong in `.env.local` with `VITE_` prefixes. Large optimized assets belong in `public/`.
- Follow existing TypeScript/React conventions; keep shared exported APIs explicitly typed.

Canonical project documentation is the Markdown-only `memory-bank/` vault:

- Home: `memory-bank/00 Home.md`
- Game design (WHAT): `memory-bank/01 MVP/Game Design.md`
- Art direction: `memory-bank/01 MVP/30 Art Direction (MVP).md`
- MVP readiness: `memory-bank/01 MVP/95 MVP Readiness Checklist.md`
- Lore/tone: `memory-bank/03 Lore/Plot Bible.md`
- Architecture (HOW): `memory-bank/04 Engineering/Architecture.md`
- Roadmap: `memory-bank/04 Engineering/Roadmap.md`
- Building runbook: `memory-bank/04 Engineering/Building Positioning Runbook.md`
- Post-MVP: `memory-bank/02 Post-MVP/00 Index.md`

## Task and Linear workflow

- Use the Linear MCP integration for all Linear reads and writes. The `MVP` and `PostMVP` projects are the live task index.
- Before roadmap/gameplay work, read the active issue and relevant design, architecture, lore, and roadmap sections.
- Create a ticket only when the requester asks or approves it. Apply exactly the relevant `Feature`, `Improvement`, or `Bug` label; new MVP work starts `Todo`, Post-MVP work stays `Backlog` until pulled in.
- Move a ticket to `In Progress` when implementation starts. `In Review` is optional. Add a concise implementation/validation comment before closure. Use `Done` only after implementation, docs, approved commit, and requester verification.
- Reuse the active issue for a direct follow-up when splitting it would add no ownership or scheduling value. Do not silently pull unrelated tickets into implementation.
- For meaningful Linear or multi-session work, maintain `progress/<Linear-key>.md` with scope, material directives, decisions, plan, validation evidence, and open risks. Update it when those facts change; do not log routine conversational noise.

## Implementation loop

1. Inspect current `main`, the dirty tree, active issue, task note, and relevant docs. Compare changes against current `HEAD` unless another baseline is requested.
2. Define proof targets and a short implementation plan. Proceed without a pause unless ambiguity materially changes scope, risk, ownership, or player behavior.
3. Make the smallest coherent change. Preserve unrelated staged, unstaged, untracked, and collaborator-owned work; never reset or overwrite it.
4. For gameplay/UX changes, run and inspect a concise Level 0 scenario after each meaningful pass. Fix safe in-scope review findings before handoff.
5. Before visual acceptance, use live playtesting, screenshots, visual inspection, and safe diagnostics. Do not represent fixtures or synthetic states as live proof.
6. After requester acceptance, or an explicit request to finalize/commit the current pass, run the required automated closeout checks below.
7. Commit only the intended coherent files with an authorized message, comment Linear, and leave the issue non-terminal until the requester verifies the committed build.

When hero or named Level 0 actor presentation changes, use the manifest-driven pipeline in `the-getaway/src/content/characters/spriteManifest.ts` and `the-getaway/public/characters/<spriteSetId>/`. `SpriteCharacterRigFactory` is primary; noir-vector rigs are fallback only for missing/invalid matrices or actors outside the rollout.

For HUD/theme work:

- Audit every Level 0-visible surface for consistency.
- Preserve layout and behavior before changing treatment.
- Keep each HUD component's CSS surface owned by that component; do not create a new bundled style blob.
- Use semantic theme tokens rather than branching painters/components on theme IDs or scattering hardcoded colors.

## Building and city placement

Treat placement as measured geometry, not open-ended visual tuning.

1. Before a corrective pass, record the constants, comparison screenshot, and edge-by-edge mismatch in the active progress note.
2. Change one variable class per pass: footprint geometry, render scale/origin/offset, door anchor, or depth/opacity/readability.
3. Do not mix footprint and sprite-fit tuning in one pass. Fix the source-of-truth problem first and compare against the saved baseline.
4. Keep collision footprint, debug outline, visual base, door anchor, and gameplay reachability aligned.
5. Apply the tolerance rubric in the Building Positioning Runbook. If a measured parallelogram pass still misses by more than one tile, stop trim chasing and use a custom polygon or multi-region footprint.
6. If a pass moves the wrong edge or reopens a correct edge, restore the recorded baseline before the next attempt.

City structure must serve gameplay or spatial readability. Do not add decorative clutter; valid additions include traversable urban mass, cover, hazards, cameras, entrances, pickups, safehouses, active contacts, and semantic surface treatment.

## Acceptance and validation

For gameplay/UX work, provide a 3-6 step Level 0 playtest that exercises the changed behavior. Before commit, inspect the relevant fixed viewports and states rather than relying only on automated success.

After visual/behavior acceptance or an explicit finalize/commit instruction, run from `the-getaway/`:

- Relevant asset/content validators, including `yarn sprites:validate` when sprites changed
- `yarn lint`
- `yarn build`
- `yarn test --runInBand`
- `yarn test --coverage --runInBand`

Total Jest statement and line coverage must remain above 80%. Resolve regressions before committing.

For every `Feature` or `Improvement`, also run:

`yarn playtest:agent -- --profile guided-level0 --max-steps 20 --codex`

Inspect the newest report under `reports/ai-playtests/`, address or explicitly defer each actionable in-scope finding, rerun when a fix changes behavior, and record the report path. `Bug` tasks run the AI gamer only when its scope needs it or the requester asks.

The Definition of Done is implementation + documentation + accepted live evidence + clean required checks + authorized commit + Linear summary + requester verification. A green fixture, contract matrix, or simulated agent state is not a substitute for live proof.

## Documentation

- Update Game Design for mechanics, balance, and player-experience rules (WHAT).
- Update Architecture for modules, interfaces, ownership, and data flow (HOW).
- Update Art Direction for visual-system rules and asset conventions.
- Update MVP Readiness after gameplay or UX work and include a short readiness summary in the handoff.
- Consult the Plot Bible for dialogue, quests, factions, or narrative tone.
- Add a Roadmap progress entry only for a completed `Feature`; skip Improvements and Bugs. Change roadmap plan sections only when scope or ordering changes.
- Preserve existing XML structure in memory-bank documents; do not invent a parallel schema.

## Commits and handoff

- Commit message: `type(GET-XXX): imperative summary`, where `type` is `feat`, `fix`, `improvement`, `docs`, `refactor`, `test`, or `perf`.
- The Linear key appears exactly once in parentheses; keep the summary imperative and at most 72 characters.
- Do not commit secrets or generated playtest reports unless the requester explicitly curates them.
- Lead the handoff with the result. State live evidence, automated checks, coverage, AI-gamer report, Linear state, MVP readiness impact, and residual risks. Inherit Review, Rating, and Debug formatting from the Vault Agent Operating System.
