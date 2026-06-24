---
name: release-cut
description: Composite skill — batch PRs accumulated on `release` branch, promote to `main`, cut a single version, tag, and clean stale branches. Use when shipping multiple changes as one release (not per-PR). Chains pr-merge-readiness (release→main) → version-bump → changelog-update → ship (tag + release notes) → branch cleanup → optional deploy. Manual fire only; nudged by next-priority when main..release ≥ 5.
user-invocable: true
auto-invoke: manual only, BUT nudged by next-priority / session-bootstrap when release..main has ≥5 commits
metadata:
  owner: global-agents
  tier: contextual
  canonical_source: ~/.claude/skills/release-cut
---

# Release Cut

Batch everything on `release` into a single, well-scoped version and promote to
`main`. Replaces the anti-pattern of shipping every fix individually.

**Flow:** PRs land on `release` via `/pr-to-release` → `/release-cut` batches
them into one version with tag + GitHub release → optional `/ship-it` to deploy.

**Not auto-fire.** Only manual invocation. Other workflows nudge readiness:
- `next-priority`, `session-bootstrap` surface nudge when
  `git rev-list --count main..release` ≥ 5
- `/pr-to-release` Phase 3 prints the same

## Preconditions (hard-fail if any miss)

1. `release` branch exists on origin
2. `main` fully merged into `release` (no divergence the other way)
3. CHANGELOG.md has `[Unreleased]` section with ≥ 1 entry
4. Working tree clean
5. No open release-train PR (`gh pr list --base main --head release`)

## Phases

### Phase 1 — Inventory (always)

```bash
git fetch origin --quiet
COMMITS=$(git rev-list --count main..release)
PRS=$(git log main..release --merges --pretty=%s | wc -l | tr -d ' ')
LAST_TAG=$(git tag --sort=-version:refname | head -1)
```

**Done when:** Show count of commits, merged PRs, last tag, PR titles,
current `[Unreleased]` entries.

**Stop condition:** If `COMMITS == 0`, halt: "Nothing to release."

### Phase 2 — Semver decision

Invoke `version-bump` (dry-run) to propose patch/minor/major from conventional
commits. See `standards/release-cadence.md` § "Version selection" for table.

**Done when:** Proposal surfaced to user; override only if BREAKING CHANGE
present and proposal ≠ major, or user explicitly requests different bump.

### Phase 3 — Promote changelog

Invoke `changelog-update` (promote mode): move `[Unreleased]` under new
`[X.Y.Z] - YYYY-MM-DD` header, re-add empty `[Unreleased]` skeleton on top.
Work on dedicated branch `chore/release-vX.Y.Z` forked from `release`.

**Done when:** CHANGELOG promotion committed to branch; version files updated.

### Phase 4 — Open release-train PR

**Base:** `main` | **Head:** `chore/release-vX.Y.Z`
**Title:** `chore(release): vX.Y.Z`
**Body:** Full `[X.Y.Z]` section + list of shipped PRs
(`git log main..HEAD --merges --pretty='- #%h %s'`).

**Done when:** PR opened; number logged.

**Stop condition:** If PR creation fails, surface error and halt.

### Phase 5 — Gate the train PR

Invoke `pr-merge-readiness` on release-train PR. Treat as any other PR:
CI green, automated reviewers OK, no human CHANGES_REQUESTED.

**Done when:** PR green or blocker surfaced.

**Stop condition:** On WAIT or FIX, hand to user — never auto-fix release PRs.

### Phase 6 — Merge to main

Method: **merge commit** (NOT squash) to preserve individual PR SHAs in main.

Confirm `main` now contains every release commit; `package.json` version
on `main` = X.Y.Z.

**Done when:** Merge commit SHA logged; version verified.

**Stop condition:** Merge conflict → surface files, halt.

### Phase 7 — Tag + GitHub release

Invoke `ship` (tag-only mode, against `main`):
- Annotated tag `vX.Y.Z` at merge commit
- Push tag
- GitHub release from `[X.Y.Z]` section; mark `--latest`

**Done when:** Tag pushed; release URL logged.

**Stop condition:** If tag `vX.Y.Z` exists, halt: "Tag already exists."

### Phase 8 — Sync release back to main

```bash
git switch release
git merge --ff-only origin/main || git merge --no-ff origin/main \
  -m "chore: sync release with main after vX.Y.Z"
git push origin release
```

`release` and `main` must end at same commit (clean base for next PR).

**Done when:** `release` fast-forward or merge-committed and pushed.

### Phase 9 — Cleanup stale branches

See `references/branch-cleanup-commands.md` for full commands (prune local gone
branches, delete merged branches, remote feature branch sweep).

Show count pruned locally and remotely. Never delete `main`, `master`,
`release`, `develop`, or `release/*`, `hotfix/*` branches.

**Done when:** Prune counts logged.

### Phase 10 — Deploy (optional, user-confirmed)

Ask: "Deploy vX.Y.Z now? (y/N)". On yes, invoke `/ship-it` Phase 3 (deploy).
Version + tag work already done.

**Done when:** Deploy confirmed or skipped; action logged.

## Stop / failure conditions (explicit)

- Release-train PR has failing check → **hand to user, do not auto-fix**
- main↔release divergence cannot fast-forward or merge conflicts →
  **surface files, halt**
- `[Unreleased]` is empty → **stop, nothing to ship**
- Tag `vX.Y.Z` already exists → **stop, half-cut detected**
- Working tree dirty → **halt before Phase 1**

## Reconciliation

```
RELEASE CUT — <repo> v<old> → v<new>
  Commits batched:   N (across M PRs) [OK] DONE
  Bump:              <patch|minor|major> [OK] DONE
  Train PR:          #<n> — base=main, head=chore/release-vX.Y.Z [OK] DONE
  Merge:             merge-commit at <SHA> [OK] DONE
  Tag:               vX.Y.Z pushed, GitHub release published [OK] DONE
  Sync:              release fast-forwarded to main [OK] DONE
  Cleanup:           K local pruned, J remote deleted [OK] DONE
  Deploy:            <deployed via /ship-it | skipped | scheduled> [OK] DONE
  Snapshot:          (none — release-cut is terminal)
  Open watch:        (none) | <e.g. "verify deploy health">
```

Lead with verdict + top-3 metrics inline (commit count, PR count, version).
If >3 branches pruned, list top 3 then: "X more — ask for full list."

## Outputs / Evidence

- New version + tag + GitHub release URL
- Merge commit SHA on `main`
- List of PRs shipped (for Slack / release notes)
- Branch cleanup count (local + remote)
- Deploy readiness nudge if not deployed

## Pairs with

- `/pr-to-release` — feeds work into `release`; this composite cuts the batch
- `/hotfix` — only acceptable bypass of cadence (see `standards/release-cadence.md` § "Hotfix policy")
- `/ship-it` — Phase 10 optional deploy

## Not this skill

- Not a hotfix → use `/hotfix` (main bypass)
- Not per-PR shipping → use `/pr-to-release` to land first
- Not deploy-only → use `/ship-it` after cut, if needed

## Cadence guidance

See `standards/release-cadence.md` § "When to cut a release" for decision tree:
≥5 commits, feature-complete, 2-week drift, or pre-deploy window cleared.

When nudge fires:

> "`release` is N commits ahead of `main` across M PRs. Worth running
> `/release-cut` to batch these into one version?"

Do NOT auto-cut. User controls cadence.
