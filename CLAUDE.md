# EUrouter OpenClaw Plugin

OpenClaw provider plugin for EUrouter, published from `packages/openclaw-plugin`.

## Commands

| Command | Description |
|---------|-------------|
| `cd packages/openclaw-plugin && npm test` | Run the Vitest suite |
| `cd packages/openclaw-plugin && npm run typecheck` | Type-check without emitting |
| `cd packages/openclaw-plugin && npm run build` | Rebuild `dist/` |
| `clawhub package inspect @eurouter/openclaw-eurouter --files` | Inspect the live ClawHub release |

## Architecture

- `README.md` is the repo-level quick start and release entrypoint.
- `packages/openclaw-plugin/` is the only publishable plugin package.
- `packages/openclaw-plugin/openclaw.plugin.json` holds OpenClaw manifest metadata.
- `packages/openclaw-plugin/SKILL.md` exists for ClawHub package evaluation and must declare `metadata.openclaw.requires.env` and `primaryEnv`.
- `packages/openclaw-plugin/.clawhubignore` defines the publishable artifact set.
- `packages/openclaw-plugin/tests/metadata-docs.test.ts` locks package metadata and docs expectations.

## Gotchas

- Keep credential setup wording consistent everywhere: `EUROUTER_API_KEY` must be set with `openclaw secrets set`, not shell exports.
- For ClawHub, provider-only auth metadata is not enough for the package evaluator. Keep `SKILL.md` published and declare `env: [EUROUTER_API_KEY]` plus `primaryEnv: EUROUTER_API_KEY`.
- Keep the published artifact minimal. `.clawhubignore` should exclude `src/`, `tests/`, `scripts/`, `package-lock.json`, `*.tgz`, and `dist/*.map`.
- Do not let dev artifacts end up in the package folder before publish; ClawHub will upload whatever is not ignored.
- Keep `package.json` publish metadata accurate: `displayName`, package-scoped `homepage`, `repository.directory`, and `openclaw.compat` / `openclaw.build` fields must stay current.
- If `agents.defaults.models` is documented, preserve the allowlist and add `eurouter/*` or explicit EUrouter models; never recommend removing the allowlist.

## Release Workflow

- Bump the version in `packages/openclaw-plugin/package.json` and `packages/openclaw-plugin/package-lock.json`.
- Run `npm test`, `npm run typecheck`, and `npm run build` in `packages/openclaw-plugin`.
- Publish from `packages/openclaw-plugin` with source metadata pointing at `EUrouter/eurouter-openclaw` and the package subpath.
- After publish, verify the live page and inspect the `llmAnalysis` verdict on ClawHub.
