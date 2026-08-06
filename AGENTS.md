# The Getaway Agent Guide

This file is the project-specific overlay for **The Getaway**. Shared execution, safety, evidence, review, rating, debug, and handoff policy lives in the Vault Agent Operating System; do not duplicate it here.

## Vault Preload

- Before repository work, read `/Users/deus/Projects/Vault-Tec/00 Agent Memory.md`.
- From that entrypoint, preload `/Users/deus/Projects/Vault-Tec/35 Context/Agent Operating System.md`.
- Then read this repo's Source Project overlay: `/Users/deus/Projects/Vault-Tec/90 Admin/Workstream Registry/Source Projects/local-the-getaway.md`.
- Then read this repo's Project Workspace record: `/Users/deus/Projects/Vault-Tec/90 Admin/Workstream Registry/Project Workspaces/the-getaway.md`.
- Before each new session or same-task resume in this workspace, re-open the Project Workspace record, this file, and the active `progress/<Linear-key>.md` note when one exists.
- After compaction or resume, also re-open the Agent Operating System and Source Project overlay before continuing.
- Treat this file as the repo-specific specialization after Vault defaults.

Intentional local overrides to Vault defaults:

- Work in the visible shared workspace on `main` unless the requester explicitly asks for a branch or worktree.
- For visual/gameplay work, prove the live behavior before running the full automated closeout block.
- Commit only when the requester explicitly authorizes a commit.
- Move Linear to `Done` only after the requester verifies the committed build.

## Execution Policy

- Shared execution, Never Guess, task continuity, reporting, and verification policy lives in the Vault Agent Operating System.
- During Superpowers brainstorming, treat the local visual companion as pre-approved. When upcoming choices would benefit from browser mockups, diagrams, or side-by-side comparisons, open and use it automatically without asking for consent or repeating token-cost or local-URL warnings. Keep text-only questions in text, and honor an explicit opt-out for the current ask.
- Before model-sensitive routing or claims, inspect current session/runtime metadata, the relevant local config or model-list command, and current official provider documentation. Treat model IDs, aliases, availability, context, pricing, reasoning controls, and tool support as volatile; mark stale or unavailable evidence explicitly and never silently substitute a different model.
- Treat `yarn playtest:agent -- --codex` as a harness selection flag, not proof of an exact backing model. Record the effective model from current runtime/session evidence when model identity affects cost, capability, privacy, or acceptance.
- Keep the existing player-visible evidence gate: live playtesting and rendered screenshots outrank fixture, synthetic, or configuration-only success.

## Commit Identity Hygiene

- Keep commit history human-only. Do not put AI, agent, or tool attribution in authors, committers, subjects, bodies, or trailers, including `Co-Authored-By`, `Generated-By`, or `Assisted-By` markers.
- Preserve the configured human Git identity. Before pushing, inspect the outgoing range with `git log '@{upstream}..HEAD' --format='%an%n%ae%n%cn%n%ce%n%B'`; rewriting already-pushed history requires explicit requester authorization.

## Workspace

- App root: `the-getaway/` (Vite, React, TypeScript, Redux Toolkit, Phaser).
- Source: `the-getaway/src/`; runtime assets: `the-getaway/public/`; tests: `the-getaway/src/__tests__/`; build output: `the-getaway/dist/`.
- Use Yarn. From `the-getaway/`: `yarn dev`, `yarn build`, `yarn preview`, `yarn lint`, `yarn test`, `yarn test:watch`.
- Vite dev: `http://localhost:5174`; preview: `http://localhost:4174`; both use strict ports.
- Runtime secrets belong in `.env.local` with `VITE_` prefixes. Large optimized assets belong in `public/`.
- Follow existing TypeScript/React conventions; keep shared exported APIs explicitly typed.

Canonical project documentation is the Markdown-only `memory-bank/` vault:

- Home: `memory-bank/00 Home.md`
- Game Design Bible entry point (WHAT): `memory-bank/01 MVP/Game Design.md`
- MVP spine: `memory-bank/01 MVP/10 MVP Spine.md`
- Level 0 contract: `memory-bank/01 MVP/11 Level 0 Vertical Slice Contract.md`
- Decision register: `memory-bank/01 MVP/12 Game Design Decision Register.md`
- Level 0 content/state matrix: `memory-bank/01 MVP/13 Level 0 Content and State Matrix.md`
- Specification review queue: `memory-bank/01 MVP/14 Specification Review Queue.md`
- Linear implementation program: `memory-bank/01 MVP/15 Linear Implementation Program.md`
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

## GET-139 documentation-first governance

- For GET-139 and its descendants, resolve authority in this order: current explicit requester directive → Game Design Decision Register → canonical Game Design/MVP Spine/Level 0 Contract/per-system specification → owning Linear ticket → Architecture → tests and runtime code. Lower layers implement higher layers and cannot silently redefine them.
- Do not modify gameplay, runtime behavior, production art, or player-facing content until the canonical specification package has passed contradiction and traceability review and has been committed separately with requester authorization. After that entry gate, execute one child at a time in Roadmap dependency order.
- A validated committed deliverable unlocks the next child even when the predecessor remains `In Review` pending requester verification. Keep closure blocker relations and terminal-state policy intact; do not use them to force idle time between otherwise satisfied delivery gates.
- Create or materially rewrite an implementation ticket only after its owning specification exists. Every ticket must embed its player promise, starting state, complete flow, state transitions, tuning, cross-system effects, world/UI/audio/George feedback, failure and recovery, exclusions, content requirements, and human-play acceptance. A documentation link is supporting context, never a substitute for the ticket specification.
- Every canonical per-system specification uses the shared 16-section template documented in `memory-bank/01 MVP/00 Index.md`. If a required value is unresolved, record a stable `OPEN-*` decision in the review queue and name the affected acceptance gate instead of inventing an untracked value.
- Maintain bidirectional traceability: every current design rule has a stable decision ID, canonical system document, and owning Linear ticket; every implementation ticket cites the decision IDs and specification sections it implements.
- Treat `memory-bank/01 MVP/15 Linear Implementation Program.md` as the canonical copy source for GET-201 through GET-210. After any specification change that affects a child, rewrite the complete affected Linear description from that source and read it back; compare semantic content while allowing only Linear's automatic bullet and issue-link normalization. A partial comment or link does not restore parity.
- Resolve an `OPEN-*` item as one atomic governance change: record the requester decision and provenance in the Decision Register, replace the recommendation with the approved rule in every affected system/contract/matrix/interface, update every blocking Linear description, update readiness/progress, and rerun ID/link/contradiction/readback checks. Removing the queue row alone is not resolution.
- `OPEN-*` items are acceptance/freeze blockers, not a blanket prohibition on starting their owning ticket. A Critical item may use its recorded recommended baseline as a reversible provisional trial only when the active progress note and Linear comment name the assumption, implementation seam, live proof, and rollback path. A High item may remain provisional until the affected surface is reviewed. Neither is `Approved`, and a ticket cannot move beyond `In Review` while a materially implemented provisional rule remains unaccepted.
- Before moving a child to `In Progress`, verify that its Linear description semantically matches the canonical ticket section, predecessor delivery gates have committed evidence, the documentation commit exists, and a progress note names live proof targets plus any provisional `OPEN-*` assumptions. Linear's automatic Markdown/entity normalization is allowed; missing or rewritten requirements are not. A status change or existing experimental code is not evidence that the gate opened.
- During specification polish, review decisions system by system and preserve unresolved questions in the queue. Do not silently promote a recommended baseline, example, proposed requirement, or historical rating into an approved rule.
- If implementation exposes an undecided behavior or conflicts with the specification, update the review queue before encoding it. Continue with a reversible provisional trial when the queue provides a coherent baseline and the choice can be judged through live evidence; stop only when no safe reversible path exists or the choice would irreversibly change scope, ownership, licensed assets, save compatibility, or core player behavior.
- Removed or superseded behavior may be summarized only in the Decision Register, each system specification's required `13. Removed behavior` section, clearly historical progress entries, and recoverable source archives. Those references must label it rejected; it must not appear as current MVP intent in Architecture, Roadmap planning, active ticket requirements, tests presented as acceptance, or player-facing copy.
- Verify the protected rewrite recovery archive before resetting, deleting, restoring, or replacing rewrite-owned files. Record the archive path, checksums, baseline SHA, salvage map, and restoration proof in `progress/GET-139.md`.
- GET-139 explicitly replaces the rejected Level 0 topology, movement contract, HUD architecture, and production-art path. Generic preservation guidance in this file applies only after the new specification has locked the replacement contract; the Building Positioning Runbook governs measured alignment inside that contract and does not preserve the rejected sparse/fenced four-block compound, nine-block board, or oversized full-district experiments. The later approved dense four-block mission envelope is current and distinct.

## Implementation loop

1. Inspect current `main`, the dirty tree, active issue, task note, and relevant docs. Compare changes against current `HEAD` unless another baseline is requested.
2. Define proof targets and a short implementation plan. Proceed without a pause unless ambiguity materially changes scope, risk, ownership, or player behavior.
3. Make the smallest coherent change. Preserve unrelated staged, unstaged, untracked, and collaborator-owned work; never reset or overwrite it.
4. For gameplay/UX changes, run and inspect a concise Level 0 scenario after each meaningful pass. Fix safe in-scope review findings before handoff.
5. Before visual acceptance, use live playtesting, screenshots, visual inspection, and safe diagnostics. Do not represent fixtures or synthetic states as live proof.
6. After requester acceptance, or an explicit request to finalize/commit the current pass, run the required automated closeout checks below.
7. Commit only the intended coherent files with an authorized message, comment Linear, and leave the issue non-terminal until the requester verifies the committed build.

When any required Level 0 actor presentation changes, use the manifest-driven pipeline in `the-getaway/src/content/characters/spriteManifest.ts` and `the-getaway/public/characters/<spriteSetId>/`. In the canonical `Level0RuntimeShell`, `Level0Scene` plus its typed per-sheet loader is the primary runtime path for the twelve grounded actor sets, and a neutral diagnostic human is the only permitted missing-asset fallback. `SpriteCharacterRigFactory` and its vector rig belong to the dormant legacy `MainScene`; do not use that path to reintroduce fantasy/role presentation into Level 0. GET-208 owns broader retirement of the legacy combat-era scene path.

For HUD/theme work:

- Audit every Level 0-visible surface for consistency.
- Preserve the approved information and behavior contracts before changing treatment; do not preserve a superseded layout merely because it exists in code.
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

City structure must serve gameplay, human scale, or spatial readability. Curated lived-in detail is valid when it strengthens place, navigation, scale, surveillance, hiding/blending, or route identity; examples include awnings, planters, bins, civic signs, kiosks, utilities, and parked service vehicles. Reject random filler, repeated noise, and detail that obscures movement or interaction.

When a visual direction depends on a licensed source pack, every production building or source-derived prop must retain named provenance to the selected pack asset. AI-assisted concepts may define composition, camera, value, lighting, or treatment, but they cannot satisfy source-identity acceptance and may not replace the source geometry. Prove the actual authored source scene in rendered close and overview frames before promoting it into the live runtime.

For a materially visual ticket, use the acceptance topology defined by its current canonical specification. Internal composition, look-development, export, and QA stages are production controls, not automatically requester-facing milestones or commit points. Before presenting any visual candidate:

- read the complete live Linear description and comments plus the current canonical specification;
- name the exact reference frames, comparison viewport, camera relationship, and player-scale target in `progress/<Linear-key>.md`;
- keep only that ticket active and leave downstream tickets parked;
- integrate the full specified candidate into the live player-visible runtime;
- inspect and reject weak intermediate frames internally instead of asking the requester to approve unfinished fragments;
- show the required clean-world, current-HUD, and overview evidence defined by the ticket;
- stop for requester visual acceptance before full closeout checks or any acceptance commit.

Offline renders, manifests, asset counts, validators, internal stages, and internal ratings are supporting evidence only. They never substitute for the requested live result, and a visually rejected candidate must not unlock downstream work.

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
- Preserve the established Markdown frontmatter, headings, and wiki-link conventions. Extend the canonical package instead of creating a parallel design archive or a second source of truth.

## Commits and handoff

- Commit message: `type(GET-XXX): imperative summary`, where `type` is `feat`, `fix`, `improvement`, `docs`, `refactor`, `test`, or `perf`.
- The Linear key appears exactly once in parentheses; keep the summary imperative and at most 72 characters.
- Do not commit secrets or generated playtest reports unless the requester explicitly curates them.
- Lead the handoff with the result. State live evidence, automated checks, coverage, AI-gamer report, Linear state, MVP readiness impact, and residual risks. Inherit Review, Rating, and Debug formatting from the Vault Agent Operating System.
