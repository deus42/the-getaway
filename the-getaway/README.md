# The Getaway

A tactical stealth RPG prototype built with Phaser, React, and Redux Toolkit. The project ships a fully automated CI/CD pipeline that tests, builds, and deploys nightly snapshots to GitHub Pages.

## Quickstart (5-minute run)

```bash
# install
yarn install
# dev
yarn dev
# tests
yarn test
# build
yarn build && yarn preview
```

## Architecture snapshot
- Rendering → Phaser 3 scenes with an isometric camera stack.
- HUD / UX → React (Vite) mounted over the Phaser canvas through a shared Redux store.
- State → Redux Toolkit slices persisted to `localStorage` with hydration guards.
- Interop → Event-driven bridge plus Redux actions keep Phaser and React in sync.

For the full breakdown, including the Mermaid data-flow diagram, read [`../memory-bank/architecture.md`](../memory-bank/architecture.md).

## Roadmap & design notes
- Roadmap → [`../memory-bank/mvp-plan.md`](../memory-bank/mvp-plan.md)
- Progress log → [`../memory-bank/progress.md`](../memory-bank/progress.md)
- Design notes → [`memory-bank/`](../memory-bank/) *(key: `plot.md`, `game-design.md`)*

## Continuous integration & deployment

The workflow in [`.github/workflows/ci-pages.yml`](.github/workflows/ci-pages.yml) performs the following on every push and pull request targeting `main`:

1. Installs dependencies with Yarn using Node.js 20.
2. Runs linting and unit tests to guard code quality.
3. Builds the production bundle.
4. When running on `main`, uploads the bundle as a Pages artifact and deploys it to the `github-pages` environment.

You can also trigger the workflow manually from the **Actions** tab via the "Run workflow" button (workflow dispatch).

## GitHub Pages

The Vite configuration automatically detects the repository name when running in GitHub Actions and sets the correct `base` path so assets resolve under `https://<your-username>.github.io/<repository>/`.

Once the workflow finishes successfully on `main`, GitHub Pages publishes the latest build at the URL reported in the workflow summary. This first deployment acts as the initial public release of the project.

If you fork the repository under a different name, the base path will update automatically without further changes.

## License

The project is released under the [MIT License](../LICENSE).
