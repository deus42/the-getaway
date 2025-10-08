# The Getaway

A Phaser-powered tactics prototype built with React, Redux Toolkit, and Vite. The project now includes a fully automated CI/CD pipeline that tests, builds, and deploys the site to GitHub Pages for release snapshots.

## Local development

```bash
yarn dev
```

Runs the development server with hot module replacement. Additional helpful commands:

- `yarn lint` – ESLint validation.
- `yarn test` – Jest unit tests (jsdom environment).
- `yarn build` – Type-checks and generates a production bundle in `dist/`.
- `yarn preview` – Serves the built bundle locally.

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
