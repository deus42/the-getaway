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
- The 24-step implementation roadmap lives in `memory-bank/implementation-plan.md` (Phases 1–8). Keep numbering intact and update the plan whenever scope changes.
- Treat `memory-bank/implementation-plan.md` as the authoritative scope document only—do not record completion status there.
- Mirror completed work in `memory-bank/progress.md`; each new milestone should reference the matching step number and live in chronological order.
- Cross-check plan vs. progress before merging large features so documentation and code stay in sync.

## Reference Memory Bank
- `memory-bank/plot.md` now folds in the story overview—review it whenever narrative beats, quests, or factions are touched.
- `memory-bank/game-design.md` documents the agreed toolchain and gameplay pillars; align new systems with it or log deviations.
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
- At the start of any feature task, review `memory-bank/implementation-plan.md`, `memory-bank/progress.md`, and related memory-bank docs to stay aligned with the roadmap.
- **Whenever implementing a roadmap step or major change that introduces new architectural patterns, refactors existing systems, or modifies core game structure (world map, grid systems, combat flow, etc.), you MUST update `memory-bank/architecture.md` in the same session.** Focus on documenting the high-level pattern and design decisions, not implementation details.
- After completing any roadmap step, update `memory-bank/progress.md` to reflect the new milestone with a brief summary of what was accomplished.

## Separation of Concerns: Design vs Architecture

**CRITICAL:** Understand the difference before making changes.

- **game-design.md = WHAT** (gameplay mechanics, rules, balance numbers, player experience)
- **architecture.md = HOW** (code patterns, modules, file paths, technical implementation)

### Decision Guide:
- Player mechanics, AP costs, damage? → **game-design.md**
- Code organization, Redux slices, file paths? → **architecture.md**
- Game rules and formulas? → **game-design.md**
- Design patterns, data flow? → **architecture.md**

### Two-Way Sync:
1. **Design → Implementation**: Update game-design.md (WHAT) → Implement → Document in architecture.md (HOW) → Log in progress.md
2. **Technical Constraint → Design**: Note in architecture.md → Adjust game-design.md if needed → Document compromise

### Common Mistakes:
- ❌ Putting code paths in game-design.md
- ❌ Putting balance numbers in architecture.md
- ✅ Keep WHAT and HOW separate

---

## XML Tagging in Documentation
The memory-bank documentation uses XML tags to improve LLM agent parsing and information retrieval. When reading or updating documentation:

### progress.md Structure
- `<step id="N" status="completed|pending">` - Wraps each completed implementation step
- `<step_metadata>` - Contains step number, title, status, and completion date
- `<tasks>` - Lists concrete tasks accomplished in the step
- `<implementation>` - Technical implementation details (optional)
- `<code_reference file="path">` - References specific files modified
- `<validation>` - Test commands and validation procedures
- `<notes>` or `<maintenance_notes date="...">` - Additional context

### implementation-plan.md Structure
- `<phase id="N" name="...">` - Groups related steps by implementation phase
- `<step id="N">` - Individual implementation steps (no status attribute; track status only in progress.md)
- `<step_metadata>` - Step metadata including phase assignment
- `<instructions>` - High-level task description
- `<details>` - Detailed implementation requirements
- `<test>` - Validation and testing procedures

### Benefits of XML Structure
- **Quick Navigation**: Agents can extract specific steps by ID or status
- **Structured Queries**: Easy to find all pending tasks or completed work
- **Hierarchical Context**: Phase grouping provides implementation context
- **Validation Tracking**: Test procedures are explicitly tagged for reference

### architecture.md Structure
- `<architecture_section id="..." category="...">` - Major architectural patterns and systems
- `<pattern name="...">` - Named design patterns (e.g., "Manhattan Grid System", "Unidirectional Data Flow")
- `<design_principles>` - Key design decisions and principles
- `<technical_flow>` - Step-by-step technical implementation flows
- `<code_location>` - File paths and module references

### game-design.md Structure (Optional Tags)
- `<game_system id status>` - Major gameplay systems (status: implemented|partial|not_implemented)
- `<mechanic name>` - Individual game mechanics
- `<rule type>` - Game rules (type: formula|constraint|condition)
- `<balance_values system>` - Numerical tuning values
- `<implementation_status>` - Current state (✅ IMPLEMENTED | ⚠️ PARTIAL | ❌ NOT IMPLEMENTED)

### When Updating Documentation
- Maintain existing XML structure and tag hierarchy
- Record completion status exclusively in `memory-bank/progress.md`; update the plan only when scope or requirements change
- Keep tags well-formed (properly opened and closed)
- Use appropriate category attributes

### Validation Before/After Implementation
- **Before:** Check game-design.md for feature spec (WHAT), check architecture.md for patterns (HOW)
- **After:** Update both documents with what changed, log completion in progress.md
- Tag XML sections incrementally as they're referenced/updated (not required for all content immediately)
