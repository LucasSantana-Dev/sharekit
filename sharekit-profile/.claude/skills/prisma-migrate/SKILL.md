---
name: prisma-migrate
description: 'Safely manage Prisma schema migrations. Covers the correct operation sequence (status → generate → migrate/deploy), destructive-operation gates (reset, db push), shadow database configuration, production-safe deploy vs dev migrate distinction, and common migration failure recovery. Use when schema.prisma changes, a migration must be applied or rolled forward, or a dev database needs to be reset. Triggers: "prisma migrate", "apply migration", "schema change", "db generate", "prisma reset", "migration failed", "shadow database", "prisma deploy", "migration drift", "prisma client out of sync".'
user-invocable: true
auto-invoke: '"prisma migrate", "apply migration", "schema change", "db generate", "prisma reset", "migration failed", "shadow database", "prisma deploy", "migration drift"'
metadata:
  owner: global-agents
  tier: contextual
  canonical_source: ~/.claude/skills/prisma-migrate
---

# Prisma Migrate

Safe migration management for Prisma projects. Applies to Prisma 5, 6, and 7.

## Command Reference

| Command | When to use |
|---|---|
| `prisma migrate status` | **Before any migration** — check pending migrations and drift |
| `prisma generate` | After `schema.prisma` changes — regenerates the client |
| `prisma migrate dev` | Development: create + apply a new migration interactively |
| `prisma migrate deploy` | Production/CI: apply pending migrations non-interactively |
| `prisma migrate reset` | **DESTRUCTIVE** — dev only: drop DB, re-run all migrations, seed |
| `prisma db push` | Prototype: sync schema without creating a migration file |
| `prisma db seed` | Populate dev data (after reset or on first setup) |
| `prisma studio` | GUI browser for dev data inspection |

---

## Safe Operation Sequence

### Schema changed (new model, field, or relation)

```bash
# 1. Check current state before touching anything
npx prisma migrate status

# 2. Regenerate the client
npx prisma generate

# 3. Create and apply a dev migration
npx prisma migrate dev --name add_user_roles
```

Commit both `prisma/migrations/<timestamp>_<name>/migration.sql` and `schema.prisma` together in the same commit.

### Production / CI deploy (apply pending migrations)

```bash
# Non-interactive; safe for automated pipelines
npx prisma migrate deploy
```

Never run `prisma migrate dev` in production — it is interactive and may generate new migration files.

### Client out of sync (no schema change)

```bash
npx prisma generate
```

Run after a fresh `npm ci`, branch switch, or any time TypeScript reports missing generated types.

---

## Destructive Operations

### migrate reset

**DESTRUCTIVE** — drops and recreates the entire database, re-runs all migrations, then seeds.

```bash
npx prisma migrate reset
# Prisma prompts: "Are you sure? All data will be lost."
```

- Only for local dev databases — never point `DATABASE_URL` at staging or production before running this.
- After reset: run `prisma db seed` if seed data is needed.

### db push (prototype mode)

```bash
npx prisma db push
```

Syncs schema directly without a migration file. Safe for rapid iteration on an isolated dev DB. Do not use on any shared, staging, or production database — changes are unversioned and cannot be rolled back via migration history.

---

## Shadow Database

`prisma migrate dev` requires a shadow database to detect schema drift and generate safe migrations. Configure it in your datasource block or environment:

```prisma
// schema.prisma
datasource db {
  provider          = "postgresql"
  url               = env("DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}
```

The shadow database must be a separate, empty database with the same provider. Prisma creates and destroys it automatically during `migrate dev`. If `SHADOW_DATABASE_URL` is missing, `migrate dev` fails with `shadowDatabaseUrl is required`.

For Prisma 7, connection strings moved to `prisma.config.ts`:
```ts
import { defineConfig } from 'prisma/config'

export default defineConfig({
  migrations: {
    connectionString: process.env.DATABASE_URL,
    shadowConnectionString: process.env.SHADOW_DATABASE_URL,
  },
})
```

---

## Migration File Conventions

```
prisma/migrations/
  20260522120000_add_user_roles/
    migration.sql
  20260523090000_add_reaction_roles/
    migration.sql
```

- Name: `<timestamp>_<snake_case_description>`
- Never manually edit a migration that has been applied to any environment — it breaks the migration checksum.
- To undo an applied migration: create a new forward migration that reverses the change.

---

## Common Failures

| Error | Cause | Fix |
|---|---|---|
| `P3006: Shadow DB failed` | `SHADOW_DATABASE_URL` missing or unreachable | Set env var; verify DB is accessible |
| `P3009: Migration failed to apply` | SQL error in migration file | Fix the SQL, `migrate reset` on dev, re-run `migrate dev` |
| `Drift detected` on `migrate status` | DB has schema changes not in migration history | Run `migrate dev` to reconcile (adds a new migration) |
| `@prisma/client` type errors after merge | Generated client stale | `prisma generate` |
| `PrismaClientInitializationError` at startup | `DATABASE_URL` not set or DB unreachable | Check env vars and DB connectivity |
| `migration already applied` on reset | Attempting reset on non-dev DB | Confirm `DATABASE_URL` points to dev only |

---

## Outputs / Evidence

After any migration operation, report:
```
Prisma Migrate
  Operation:  <generate | migrate dev | deploy | reset | db push>
  Status:     <N pending before / N applied after>
  Drift:      <none | detected — resolved | detected — unresolved>
  Verdict:    APPLIED | SKIPPED (already up-to-date) | FAILED: <reason>
```

---

## Do Not Use When

- Only inspecting data — use `prisma studio` or a direct DB client.
- Running tests — test suites typically manage their own DB state via jest setup files or Docker Compose.
- Evaluating whether a schema change is safe — review the generated `migration.sql` manually before applying to staging/production.
