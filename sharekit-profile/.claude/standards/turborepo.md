# Turborepo & Monorepo Build Caching

## What Turborepo does

Turborepo is a high-performance build system for JavaScript/TypeScript monorepos. It caches task outputs (build artifacts, test results, lint output) locally and remotely so unchanged packages never rebuild.

```
turbo run build   # builds only what changed since last run
turbo run test    # skips tests for packages with no file changes
```

## Pipeline definition (`turbo.json`)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],   // build deps first (topological)
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,            // dev servers are not cacheable
      "persistent": true
    }
  }
}
```

- `^build` means "wait for all upstream packages' `build` task to finish first"
- `outputs` tells Turbo what to cache — omit files that change every run (timestamps, logs)
- `cache: false` disables caching for tasks where output is non-deterministic

## Cache hits

A cache hit requires that **inputs** are identical to a prior run:
- Source files in the package
- Environment variables listed in `globalEnv` or `env`
- `turbo.json` pipeline definition

If any input changes, the task re-runs and the new output is cached.

## Remote caching

```bash
# Link to Vercel Remote Cache (free for personal accounts)
npx turbo login
npx turbo link

# CI: set TURBO_TOKEN and TURBO_TEAM env vars
# Then `turbo run build` automatically reads/writes the remote cache
```

Remote caching shares hits across machines and CI runs — a build that passed on a PR branch won't rebuild on merge to main.

## Common cache misses (and fixes)

| Cause | Fix |
|-------|-----|
| Timestamp written to output | Exclude from `outputs` or don't write it |
| Non-deterministic env var not declared | Add to `globalEnv` in turbo.json |
| `node_modules` hash changes on lockfile bump | Expected — not a bug |
| `cache: false` on a task that could be cached | Remove the flag and add `outputs` |

## Filtering

```bash
turbo run build --filter=web          # only the `web` package
turbo run build --filter=...web       # web + everything it depends on
turbo run build --filter=[HEAD^1]     # packages changed since last commit
```

## Workspace layout (pnpm)

```
apps/
  web/
  api/
packages/
  ui/
  catalog/
pnpm-workspace.yaml
turbo.json
package.json   ← root scripts call turbo
```

Each package needs its own `package.json` with a `name` field — Turbo uses package names for graph resolution.

## forgekit usage

This repo uses pnpm workspaces. Run tasks from the root:

```bash
pnpm build        # runs turbo build across all packages
pnpm --filter web dev   # run dev server for apps/web only
```

Cache is local-only (no remote cache configured). Add `TURBO_TOKEN` + `TURBO_TEAM` to CI secrets to enable remote caching across PR builds.
