# Repository Guidelines

## Project Structure & Module Organization
- Root app lives in `the-getaway/` (Vite + React + TypeScript).
- Source code in `the-getaway/src/`:
  - `components/` (UI like `GameCanvas.tsx`, `GameController.tsx`)
  - `game/` (core logic: `combat/`, `world/`, `quests/`, `interfaces/`, `scenes/`)
  - `store/` (Redux Toolkit slices: `playerSlice.ts`, `worldSlice.ts`)
  - `__tests__/` (unit/integration tests)
  - `assets/` and `public/` for static files
- Build output in `the-getaway/dist/`. Jest mocks in `the-getaway/__mocks__/`.

## Build, Test, and Development Commands
- Dev server: `cd the-getaway && yarn dev` (Vite on localhost)
- Build: `yarn build` (type-check + production bundle to `dist/`)
- Preview build: `yarn preview`
- Lint: `yarn lint` (ESLint per `eslint.config.js`)
- Tests: `yarn test` or `yarn test:watch` (Jest + jsdom)

## Coding Style & Naming Conventions
- TypeScript throughout; prefer explicit types on public APIs.
- Indentation: 2 spaces; single quotes; trailing semicolons.
- React components and files: PascalCase (e.g., `GameCanvas.tsx`).
- Functions, variables, and Redux slices: camelCase (e.g., `playerSlice.ts`).
- Avoid default exports for shared utilities; prefer named exports.
- Linting: ESLint with `react-hooks` and `react-refresh` rules. Fix warnings before PR.

## Testing Guidelines
- Framework: Jest (`ts-jest`, `jest-environment-jsdom`) with React Testing Library.
- Setup file: `src/setupTests.ts` (includes `@testing-library/jest-dom`).
- Test files live in `src/__tests__/` and end with `.test.ts` or `.test.tsx`.
- Aim to cover reducers, selectors, and core game logic (`game/*`). Optional coverage: `yarn test --coverage`.

## Roadmap Tracking
- The 24-step implementation roadmap lives in `memory-bank/implementation plan.md` (Phases 1–8). Keep numbering intact and update the plan whenever scope changes.
- Mirror completed work in `memory-bank/progress.md`; each new milestone should reference the matching step number and live in chronological order.
- Cross-check plan vs. progress before merging large features so documentation and code stay in sync.

## Reference Memory Bank
- `memory-bank/backstory.md` now folds in the story overview—review it whenever narrative beats, quests, or factions are touched.
- `memory-bank/game design.md` documents the agreed toolchain and gameplay pillars; align new systems with it or log deviations.
- `memory-bank/architecture.md` must reflect current code structure. Update it alongside architectural changes so docs never drift.

## Commit & Pull Request Guidelines
- Use imperative, concise commits. Conventional Commits are welcome (e.g., `fix(build): ...`).
- PRs should include:
  - Summary of changes and rationale
  - Linked issues (e.g., `Closes #123`)
  - Screenshots/GIFs for UI changes
  - Notes on tests added/updated and any breaking changes

## Security & Configuration Tips
- Do not commit secrets. For runtime config, prefer Vite envs prefixed with `VITE_` and keep local values in `.env.local` (gitignored).
- Large assets belong in `public/` and should be optimized.

## Agent-Specific Instructions
- Follow this AGENTS.md across the repo. Keep changes minimal and focused. Prefer `yarn` for scripts. When adding files, mirror existing naming and structure.
- At the start of any feature task, review `memory-bank/implementation plan.md`, `memory-bank/progress.md`, and related memory-bank docs to stay aligned with the roadmap.
- **Whenever implementing a roadmap step or major change that introduces new architectural patterns, refactors existing systems, or modifies core game structure (world map, grid systems, combat flow, etc.), you MUST update `memory-bank/architecture.md` in the same session.** Focus on documenting the high-level pattern and design decisions, not implementation details.
- After completing any roadmap step, update `memory-bank/progress.md` to reflect the new milestone with a brief summary of what was accomplished.
