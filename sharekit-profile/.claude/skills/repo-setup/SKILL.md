---
name: repo-setup
description: 'Composite skill — configure a fresh or under-configured repo for release-branch + pre-commit workflow in one pass. Chains repo-bootstrap (release branch, CHANGELOG, config files) → setup-pre-commit (Husky + lint-staged + typecheck + tests). Use when setting up a new repo for production-ready development, or adding release workflow + commit-time quality gates to an existing repo in one shot. Idempotent.'
user-invocable: true
auto-invoke: '"set up this repo", "configure repo for release workflow", "bootstrap repo + hooks", first session in a repo with no `release` branch, no `.claude/` directory, and no `.husky/` directory'
metadata:
  owner: global-agents
  tier: contextual
  canonical_source: ~/.claude/skills/repo-setup
---

# Repo Setup

The one-call configuration for a repo ready to ship. Combines release-branch workflow
(long-lived `release` branch, CHANGELOG, dep/hygiene rules) with commit-time quality
gates (Husky pre-commit: lint, typecheck, test). Without both, either you lack the
release discipline or code quality drifts at commit time.

This composite runs both setup phases in sequence — idempotent, state-checked before
each phase, user-gated before pushing any changes.

## Distinct from onboard-new-repo and repo-bootstrap

- **onboard-new-repo**: First-touch *understanding* workflow. Reads a repo you just
  cloned to answer "what is this?" (stack, health, gates). Never writes.
- **repo-bootstrap**: Configures *release-branch workflow only* (release branch,
  CHANGELOG, `.claude/` config files for dep-sweep + branch-hygiene).
  Returns a PR for manual review.
- **repo-setup**: Configures *both release-branch + pre-commit workflow* (everything
  from repo-bootstrap, then Husky + lint-staged). One composite, two phases, one
  mindset.

Use **repo-setup** when you want the full release-ready stack in one invocation.

## When this fires

- User says "set up this repo", "configure repo for release workflow",
  "bootstrap repo + hooks", "get this repo ready to ship"
- Auto-suggest on first session in a repo with:
  - `git ls-remote --heads origin release` returns empty AND
  - `.claude/` directory is missing OR has no config files AND
  - `.husky/` directory is missing

If the repo is not a git repo: exit with
`repo-setup skipped: not a git repository`.

If the repo has no `origin` remote: surface as a blocker and refuse — release
workflow requires a remote.

## Workflow

### Phase 1 — Repo Bootstrap (always)

Invoke `/repo-bootstrap` to configure release-branch workflow:

**Done when:**
- `git ls-remote --heads origin release` returns a commit SHA
- `CHANGELOG.md` exists with literal `## [Unreleased]` section
- `.claude/dep-sweep-config.json` exists and parses as valid JSON
- `.claude/branch-hygiene-config.json` exists and parses as valid JSON
- `.claude/standards/release-cadence.md` exists
- A `chore/repo-bootstrap` PR is either open on origin or was skipped (all
  artifacts pre-existed)

See `~/.claude/skills/repo-bootstrap/SKILL.md` for full phase 1 internals.

**Idempotency:** Phase 1 skips any artifact that already exists. Running Phase 1
twice produces a no-op on the second run. This is safe to auto-suggest.

**Blocker:** If Phase 1 surfaces a hard error (no origin remote, default branch
has zero commits), halt and surface the blocker — do not proceed to Phase 2.

### Phase 2 — Pre-Commit Hooks (always, if phase 1 succeeds)

Invoke `/setup-pre-commit` to add Husky + lint-staged:

**Done when:**
- `.husky/` directory exists with executable `pre-commit` script
- `.lintstagedrc` exists and parses as valid JSON
- `prettier` config exists (`.prettierrc`, `.prettierignore`, or package.json `"prettier"`)
- Package manager detected (npm/pnpm/yarn/bun lockfile) and Husky, lint-staged,
  prettier installed as devDependencies
- Pre-commit hook runs without errors (smoke test: `npx lint-staged` succeeds)
- A commit with staged changes passes all hooks without blocking

See `~/.claude/skills/setup-pre-commit/SKILL.md` for full phase 2 internals.

**Idempotency:** Phase 2 skips Prettier config if one already exists. It overwrites
`.husky/pre-commit` (to pick up any missing lint/typecheck/test steps). This is
safe on repos with partial Husky setup.

**Blocker:** If Phase 2 detects no `package.json`: surface as
`(blocked: no package.json found — not a Node.js project, setup-pre-commit does not apply)`.
Halt and surface in reconciliation; do not proceed to Phase 3.

### Phase 3 — Consolidate & Verify (always)

After both phases:

1. **State check:** re-probe for all artifacts from Phase 1 + Phase 2.
2. **Consistency check:** if Phase 1 created a `chore/repo-bootstrap` PR and Phase 2
   added hook changes, note that the PR will trigger pre-commit hooks when it's
   rebased/updated on the local branch (informational, no action needed).
3. **Verify release + hooks together:** run a smoke test:
   ```bash
   git status                                     # no uncommitted changes
   git ls-remote --heads origin release           # release branch exists on origin
   test -f .husky/pre-commit && echo "hooks OK"  # pre-commit hook exists
   ```

**Done when:** all state checks pass and smoke tests succeed.

**Stop condition:** If any verification fails, surface as a hard error in the
reconciliation block — the repo is half-configured. Do not claim success.

## Pre-flight checks (always, before Phase 1)

Before invoking Phase 1:

1. Check that the working directory is a git repo:
   ```bash
   git rev-parse --git-dir >/dev/null 2>&1 || { echo "not a git repo"; exit 1; }
   ```
2. Check that `origin` remote exists:
   ```bash
   git remote get-url origin >/dev/null 2>&1 || { echo "no origin remote"; exit 1; }
   ```
3. Check External HD mounted (see standards/knowledge-brain.md §1):
   ```bash
   mount | grep -q "/Volumes/External HD" || echo "WARNING: External HD unmounted — RAG/vault operations may degrade"
   ```
   This is informational; do not block on it.

If any pre-flight check fails: exit immediately and surface the blocker.

## User Gate — Push to origin (before Phase 1 creates remote artifacts)

Before Phase 1 invokes `git push origin ... :refs/heads/release`:

Surface a summary of what will happen:
```
REPO-SETUP will:
  1. Create a long-lived `release` branch on origin (based on default branch)
  2. Add CHANGELOG.md, .claude/config files, and release-cadence standard
  3. Open a PR to review and merge these setup changes
  4. Add Husky pre-commit hooks (lint, typecheck, test)

Continue? [y/n]
```

If the user declines: exit without writing anything. If the user approves: proceed
to Phase 1.

## Reconciliation block (mandatory output)

```
REPO-SETUP — <repo>

Pre-flight:
  Git repo:        ✓ | (blocked: not a git repository)
  origin remote:   ✓ | (blocked: no origin remote)
  External HD:     ✓ | (warning: unmounted)

Phase 1 — Repo Bootstrap:
  Release branch:  created | (skipped: already exists) | (blocked: <reason>)
  CHANGELOG.md:    created | (skipped: exists) | (flagged: exists, no [Unreleased])
  dep-sweep config: created | (skipped: exists)
  hygiene config:  created | (skipped: exists)
  release-cadence: created | (skipped: exists)
  Bootstrap PR:    <url> | (skipped: no changes) | (manual: <command>)

Phase 2 — Pre-Commit Hooks:
  package manager: <npm|pnpm|yarn|bun|none>
  Husky install:   ✓ installed | (blocked: no package.json)
  .husky/pre-commit: created | (skipped: exists)
  .lintstagedrc:   created | (skipped: exists)
  Prettier config: created | (skipped: exists)
  Dependencies:    husky, lint-staged, prettier installed ✓ | (failed: <error>)
  Hook smoke test: ✓ passed | (blocked: <error>)

Phase 3 — Verify:
  All artifacts:   ✓ present | (failed: <missing>)
  Release on origin: ✓ | (failed)
  Hooks executable: ✓ | (failed)
  Consistency:     ✓ OK | (warning: <note>)

Status:            [OK] DONE | [WARN]  PARTIAL (one or more phases skipped — see above) | [FAIL] BLOCKED

Snapshot:          (none — repo-setup is terminal)
Open watch:        Review and merge the Bootstrap PR when ready. Hooks will enforce quality on next commit.
Next:              Use /pr-to-release to land features on the release branch.
```

## Stop conditions (explicit)

- **Pre-flight failure** (not a git repo, no origin remote) → exit immediately,
  surface blocker
- **User declines the gate** → exit without writing, no changes
- **Phase 1 hard error** (default branch has zero commits, CHANGELOG conflict,
  config parse error) → surface in reconciliation, halt before Phase 2
- **Phase 2 hard error** (no package.json, npm/pnpm install failed) → surface in
  reconciliation, halt
- **Phase 3 verification failure** → surface hard error, do not claim success

When halted: the repo may be partially configured. Leave it in that state and
surface the exact remediation step needed.

## Idempotency contract

Running `repo-setup` twice on the same repo must:
- Not duplicate any file, branch, or PR
- Not error on existing artifacts
- Produce a reconciliation block showing every phase as `(skipped: exists)` or
  `(created)` as appropriate
- Exit clean with no changes if all artifacts pre-exist

This property is what makes the composite safe to auto-suggest at session start.

## Negative rules

- Do NOT overwrite an existing CHANGELOG, config, standard, or pre-commit hook.
  Skip and flag instead. User's existing content is canonical.
- Do NOT auto-merge either the bootstrap PR or any hook changes. Both are
  setup-time changes that benefit from human review even when mechanical.
- Do NOT check out `release` locally. The model is push-only via `/pr-to-release`.
- Do NOT touch `.gitignore`, package.json source code, or app logic. Repo-setup
  is workflow configuration only — it configures, never modifies the app.
- Do NOT auto-queue another composite after either phase succeeds. Repo-setup is
  a one-shot setup; cascading would surprise the user.
- Do NOT run pre-commit hooks during the setup phase itself (Phase 2 install + config
  changes). Only after the user merges and makes their first real commit should the
  hooks run. This is why Phase 3 smoke-tests without staging new changes.

## Auto-chain (after repo-setup)

After both phases complete successfully:
- Suggest `/pr-to-release` next time the user has a feature branch ready
- Suggest `/branch-hygiene` on the next session in the repo to confirm hook
  install and review any orphaned worktrees
- If Phase 1 opened a bootstrap PR: remind user to review and merge it before
  opening real PRs to the release branch

## Cross-link

- Sub-skills: `repo-bootstrap` (Phase 1), `setup-pre-commit` (Phase 2)
- Release workflow family: `/pr-to-release`, `/release-cut`, `/hotfix`,
  `/dep-sweep`, `/branch-hygiene`
- Standards: `~/.claude/standards/workflow.md` (parallel-execution rule),
  `~/.claude/standards/knowledge-brain.md` (RAG guard), `~/.claude/standards/release-cadence.md`
  (release model)
- See `~/.claude/skills/repo-bootstrap/SKILL.md` and `~/.claude/skills/setup-pre-commit/SKILL.md`
  for implementation details
