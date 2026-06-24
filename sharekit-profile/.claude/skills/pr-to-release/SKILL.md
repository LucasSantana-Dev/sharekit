---
name: pr-to-release
description: Composite skill — take a working change all the way from "code is done on a branch" to "merged into the long-lived `release` branch with changelog entry". Chains pr-flow (branch + commit + push + open PR) → pr-merge-readiness → CodeRabbit/Greptile/Sonar auto-review wait → ci-watch / gh-fix-ci (if blockers) → gh-address-comments (if review feedback) → changelog-update ([Unreleased] entry) → merge into `release` (NOT main). Use as the one-call workflow for "open a PR and get it merged to release" so individual fixes do not each cut a version.
user-invocable: true
auto-invoke: pr-creation-requests + "merge to release" + "open a PR" when release branch exists
metadata:
  owner: global-agents
  tier: contextual
  canonical_source: ~/.claude/skills/pr-to-release
---

# PR → Release Branch

Replaces "I'll open the PR, then come back later to merge it" with one workflow
that lands the change on the long-lived `release` integration branch, with a
[Unreleased] changelog entry, and stops cleanly when human input is required.

The base branch is **`release`**, never `main`. Cutting a version is a separate
step handled by `/release-cut`. This composite must not tag, must not bump
versions, and must not deploy.

## Auto-invocation triggers

- User says "open a PR", "ship this change", "merge this", "is this ready" — AND a
  `release` branch exists on origin.
- After a commit-push workflow completes and the user implies merge intent.
- Any PR-creation skill request when the active repo follows the release-branch
  model (detected by `git ls-remote --heads origin release` returning a SHA).

## Release-branch detection

```bash
git fetch origin --quiet
RELEASE_BRANCH=$(git ls-remote --heads origin release | awk '{print $2}' | sed 's|refs/heads/||')
if [ -z "$RELEASE_BRANCH" ]; then
  # Fall back to project-configured release branch if package.json declares one
  RELEASE_BRANCH=$(jq -r '.release.branch // empty' package.json 2>/dev/null)
fi
```

If no release branch exists, **bail out** with a one-line message:
"No `release` branch on origin. Use `/merge-confidently` for direct-to-main repos
or create the release branch first."

## Workflow

### Phase 1 — Pre-flight (always)
- Verify working tree state (`git status --short`)
- Verify `release` is reachable on origin (see detection above)
- Verify there is something to commit OR a feature branch already exists locally
- Refuse if current branch is `main`, `master`, or `release` itself

### Phase 2 — Branch + commit + push + open PR
Invoke `pr-flow` with `--base release`. Conventional commit subject required.
The PR's base branch MUST be `release` — never `main`.

Title PR with conventional commit prefix; body must include:
- What changed (1–3 lines)
- Why (link the issue / discussion when applicable)
- `[Unreleased]` changelog line preview (the literal line that will land in CHANGELOG.md)

### Phase 3 — Wait for automated reviewers
Wait up to 5 minutes for these to enqueue (whichever subset the repo uses):
- CodeRabbit
- Greptile
- SonarCloud / SonarQube
- Sentry PR review
- CI pipeline checks

Use `pr-merge-readiness` to collect the combined signal once any of them reports.

### Phase 4 — Resolve blockers
Verdict drives:
- **MERGE** → skip to Phase 6
- **WAIT** with CI in progress → invoke `ci-watch`, then re-verdict
- **WAIT** with bot suggestions → invoke `gh-address-comments` (apply mechanical
  fixes; surface judgment calls to user)
- **FIX** with CI failure → invoke `gh-fix-ci` (one autonomous attempt), then re-verdict
- **FIX** with CHANGES_REQUESTED human review → STOP. Surface comments to user.
- **FIX** with conflicts → rebase onto `release`, resolve, push, re-verdict

Loop max 3 cycles before escalating. Do not silently retry on the same failure.

### Phase 5 — Re-verify
Re-invoke `pr-merge-readiness`. Continue only when verdict is MERGE for the
`release` base.

### Phase 6 — Changelog entry (always, before merge)
Invoke `changelog-update` in **append-only mode**: add a single line under the
existing `[Unreleased]` section with conventional category (Added/Changed/Fixed/
Removed/Security/Deprecated). Do **NOT** promote `[Unreleased]` to a version —
that is `/release-cut`'s job.

Commit the CHANGELOG change to the PR branch with message
`docs(changelog): record <subject>`. Push. Wait for CI on this final commit.

### Phase 7 — Merge to release
- Method: **squash merge** by default (one PR → one entry in release history).
  Repos that declare `"mergeMethod": "merge"` or `"rebase"` in `.claude/release-config.json` override.
- Refuse `--admin` and `--no-verify`.
- Confirm the merge SHA is on `origin/release`.

### Phase 8 — Cleanup (always after merge)
- Delete the merged feature branch locally and on origin (GitHub usually
  auto-deletes; verify).
- Update local `release` (`git fetch origin && git switch release && git pull --ff-only`).
- Do **not** touch tags. Do **not** trigger deploy.

## Stop / escalation conditions

Stop and surface to user when:
- Release branch does not exist (bail out at detection)
- Human reviewer left CHANGES_REQUESTED
- 3 fix cycles failed to clear CI
- Merge would require admin bypass
- CHANGELOG already contains the exact line being added (suggests duplicate work)

## Reconciliation

```
PR → RELEASE — <repo> #<PR>
  Branch:        <feature-branch> → release
  Reviewers:     CodeRabbit ✓ | Greptile ✓ | SonarCloud ✓ | CI ✓
  Cycles:        Cycle 1 → ci-watch green; Cycle 2 → CodeRabbit suggestions applied
  Changelog:     [Unreleased] entry added (Fixed: <subject>)
  Merge:         squash → origin/release@<SHA>
  Cleanup:       feature branch deleted, local release fast-forwarded
  Released?:     No — accumulating on release branch. Run /release-cut when batch is large enough.
```

## Outputs / Evidence

- PR number + merge SHA on `release`
- Final pr-merge-readiness verdict
- `[Unreleased]` line as it now appears in CHANGELOG.md
- One-line nudge if `release..main` count is now ≥ 5 commits, suggesting `/release-cut`

## What this composite is NOT

- Not for direct-to-main flows → use `/merge-confidently`
- Not a release cut → use `/release-cut`
- Not a hotfix → use `/hotfix`
- Not for deploys → use `/ship-it`

## Pairs with

- `/release-cut` — when enough PRs have piled up on `release`
- `/hotfix` — when the change cannot wait for the release cycle
- `/dep-sweep` — when the change is a bot dependency update
