# Safety Rules & Standards — pr-flow

Cross-linked from main SKILL.md. Never duplicate these inline.

## No AI co-author attribution

**CLAUDE.md rule — hard constraint.**

Commits authored by Lucas Santana (the operator); Claude is a tool, not a contributor.

- NEVER append `Co-Authored-By: Claude ...` to commit messages.
- NEVER add `🤖 Generated with [Claude Code](...)` to PR bodies or release notes.
- Commits and PRs reflect human authorship and decision-making.

**Verify before committing:**
```bash
git show --format=%B  # Must NOT contain "Co-Authored-By"
```

## Branch-first, no direct main push

Direct push to main is blocked by git hooks + CI gate. This skill enforces:

1. Always create a feature branch from base.
2. Commit to the branch, never main.
3. Push the branch to origin.
4. Open PR for review before merging.

**Never:**
- `git push origin <changes> --force`
- `git push origin HEAD:main`
- `git checkout main && git commit ...`

## Conventional commit format

Enforced per standards/pr-conventions.md §conventional-commits.

Reject non-conforming messages:

| Message | Valid? | Reason |
|---------|--------|--------|
| `fix: handle timeout` | ✓ | type + colon + subject |
| `fix handle timeout` | ✗ | missing colon |
| `FEATURE: add theme` | ✗ | type must be lowercase |
| `feat: Add theme` | ✗ | subject must start lowercase |
| `feat: add theme.` | ✗ | no period at end |

**Correct examples:**
```
fix: handle socket timeout
feat(auth): add OAuth2 flow
docs: update README with setup steps
refactor(parser): simplify token matching
test: add edge-case coverage for null inputs
```

## Stage-aware add

`git add -A` commits ALL changes. Ask user to verify before staging.

**Before Step 3:**

```bash
git status --short
# Output:
#  M src/index.ts
# ?? .env
# ?? node_modules/

# Prompt:
# "git add -A will stage: src/index.ts, .env, node_modules/ (3 items)
#  Continue? (y/n)"
```

**Exclude unintended:**
- Secrets (`.env`, `.aws/credentials`, etc.) → BLOCK, require selective add
- Large binaries / lock files checked into git → warn, verify
- Untracked cruft (node_modules, build artifacts) → warn

**Correct command:**
```bash
git add src/index.ts  # Explicit files
git commit -m "fix: handle timeout"
```

## Abort conditions

**Do NOT retry with `--force` or `--amend` after failure.**

| Failure | Next action |
|---------|-------------|
| Commit hook fails | Surface error, fix root cause, create NEW commit (not --amend). |
| Pre-push hook fails | Surface error, fix root cause, NEW push (not --force-push). |
| Branch exists | Suggest `git rebase <base>` or choose new branch name. |
| Base unreachable | Verify base exists: `git ls-remote origin <base>`. |
| Network timeout | Retry once; if persists, escalate. |
| gh auth missing | Direct to `gh auth login`. |

## Parallelism

This skill is single-thread (one PR at a time). If user has multiple independent PRs ready:

**Don't:** chain them sequentially in one skill invocation.

**Do:** invoke pr-flow once per PR (or batch via `/release-cut` if they're stacked on release branch).

See standards/workflow.md #parallel-execution for when to dispatch multiple independent agents.

## Related standards

- standards/pr-conventions.md §PR-creation-safety
- standards/pr-conventions.md §conventional-commits
- standards/workflow.md §parallel-execution
- CLAUDE.md §commit+PR-attribution
