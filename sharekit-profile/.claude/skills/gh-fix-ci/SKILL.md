---
name: gh-fix-ci
description: "Diagnose and fix failing GitHub CI when: a PR's checks fail and need root-cause analysis; CI repeatedly flakes on a branch; GitHub Actions logs are unclear. Fetch logs, query prior gotchas from the repo, summarize failures, draft a plan, implement after approval. Does NOT automate fixes on another person's PR (CLAUDE.md hard rule)."
triggers:
  - "PR checks failed"
  - "CI is broken"
  - "GitHub Actions logs show X"
  - "debug a test failure"
  - "fix flaky CI"
metadata:
  owner: global-agents
  tier: contextual
---
















# gh-fix-ci

Diagnose and fix failing GitHub PR checks and flaky CI via log inspection, pattern matching, and repair planning.

## Overview

1. **Pre-flight: mount check & authz gate** — Verify external drive mounted (RAG access), gh authenticated, and PR is owned by you (NEVER automate on another person's PR).
2. **Query repo's CI history** — Search for prior gotchas and patterns that have hit this repo before.
3. **Inspect failing checks** — Fetch GitHub Actions logs and external check details.
4. **Summarize failures** — Extract actionable log snippets; highlight missing logs.
5. **Draft & approve a fix plan** — Request explicit approval before implementing.
6. **Implement and verify** — Apply the plan; run tests; re-check CI status.

Prereq: `gh` authenticated with repo + workflow scopes (run `gh auth login` if needed, confirm with `gh auth status`).

## Inputs

- `repo`: path inside the repo (default `.`)
- `pr`: PR number or URL (optional; defaults to current branch PR)
- `gh` authentication for the repo host

## Workflow

### 1. Pre-flight checks (Done when: all gates pass or first blocker surfaced)

**Mount guard** — Before querying RAG or knowledge-brain:
```bash
mount | grep -q "${EXTERNAL_HD}" || \
  { echo "BLOCKED: external drive unmounted — RAG/knowledge-brain unreachable." >&2; exit 0; }
```
See `standards/knowledge-brain.md` §1 for details.

**Verify gh authentication:**
```bash
gh auth status
```
Done when: `Logged in to github.com` and scopes include `repo` and `workflow`.
If unauthenticated: halt; ask user to run `gh auth login --scopes repo,workflow`.

**PR ownership & safety gate** (HARD RULE — CLAUDE.md):
```bash
gh pr view --json author,comments
```
 **STOP if ANY of:**
- PR author is NOT the current user (different GitHub login)
- PR has comments from any human reviewer (CodeRabbit, Sonar, Dependabot do not count)

Surface: *"Cannot auto-fix: PR authored by [author] or has comments from reviewer(s). Manual review required."* Then halt. (See `standards/pr-conventions.md`.)

### 2. Query repo's prior CI gotchas (Done when: pattern search complete or No Results)

Before wide investigation, search the repo's memory for CI patterns that have hit before:
```bash
mount | grep -q "${EXTERNAL_HD}" || { echo "BLOCKED: external drive unmounted"; exit 0; }
# If mounted, query RAG for repo-scoped CI patterns:
rag_query(query="CI failures on this project: formatter, CodeQL false positives, tag drift, flaky tests", 
          top=5, scope_types=["memory","handoffs"])
```
Done when: ≥1 prior pattern found and surfaced, OR "No prior gotchas recorded."

### 3. Resolve the PR (Done when: PR number and branch identified)

Prefer the current branch's PR:
```bash
gh pr view --json number,url,headRefName
```
If the user provided a PR number or URL, use that directly. Fallback to HEAD branch if no PR exists yet.

### 4. Inspect failing checks — GitHub Actions only (Done when: all check logs fetched or marked unavailable)

Use the bundled script (handles gh field drift and job-log fallbacks):
```bash
python "<path-to-skill>/scripts/inspect_pr_checks.py" --repo "." --pr "<number-or-url>" --json
```

Manual fallback if script errors:
```bash
gh pr checks <pr> --json name,state,link,startedAt,completedAt
```
For each failing check, extract run ID from `link` and fetch:
```bash
gh run view <run_id> --log
```
If still in progress, fetch job logs directly:
```bash
gh api "/repos/<owner>/<repo>/actions/jobs/<job_id>/logs" > /tmp/logs.txt
```
Done when: all available GitHub Actions logs collected. Mark any that are still in progress or unavailable.

### 5. Scope external checks (Done when: all non-GitHub-Actions checks labeled with source and URL)

If `link` is NOT a GitHub Actions run:
- **SonarCloud**: Report the quality-gate URL and hotspot count (lightweight API evidence only; do not block on full analysis).
- **Buildkite, others**: Report the details URL; do not attempt provider-specific log parsing.
- **Label each** as `[external: <provider>]`.

### 6. Summarize failures for the user (Done when: signal-first output posted)

**Signal-first**: top-3 failing checks + verdict.

Format:
```
## CI Status

**Verdict**: [FIX_READY | BLOCKED | IN_PROGRESS]

### Top Failures
1. **<check name>** [external: <provider> | GitHub Actions]
   - Run: <URL>
   - Snippet: <log excerpt, ≤200 chars>
   
2. [next failure...]

### Blockers
- [Missing logs | Auth required | Still in progress | ...]

### Prior Patterns (from repo memory)
- [Pattern 1: description]
- [Pattern 2: description]
```

Full log excerpts or pattern details go to `references/ci-patterns.md` if ≥3 findings (ask user for full list).

### 7. Draft & approve fix plan (Done when: user approves the plan OR plan is declined)

Draft a concise, numbered plan (3–7 steps). Example:
```
## Proposed Fix

1. Run `npx prettier --write <files>` to format the 5 flagged JS files
2. Run `npm test` locally to verify no regressions
3. Push the commit and re-run `gh pr checks` to confirm green
```

**Request explicit approval**: "Approve this plan before I implement?"

Stop here if the user declines or requests changes; do not auto-implement.

### 8. Implement after approval (Done when: changes committed and pushed)

Apply the approved plan. Example:
```bash
npx prettier --write <files>
npm test
git add <changed files>
git commit -m "ci: format code to pass Prettier check"
git push
```
Summarize: "Pushed commit <hash>. Re-run `gh pr checks` to verify green."

### 9. Verify CI status (Done when: all checks green OR new blocker surfaced)

```bash
gh pr checks <pr>
```
- If green: "CI checks now passing ✓"
- If still failing: surface new blocker and repeat step 6 (re-summarize).
- If new checks now running: suggest waiting 2–5 min and re-checking.

## Bundled Resources

### scripts/inspect_pr_checks.py

Fetch failing PR checks, pull GitHub Actions logs, and extract failure snippets. Exits non-zero when failures remain (useful for automation).

```bash
python "<path-to-skill>/scripts/inspect_pr_checks.py" --repo "." --pr "123"
python "<path-to-skill>/scripts/inspect_pr_checks.py" --repo "." --pr "<url>" --json
python "<path-to-skill>/scripts/inspect_pr_checks.py" --repo "." --max-lines 200 --context 40
```

### references/ci-patterns.md

Common CI failure patterns with symptom, root cause, and fix. Moved to reference file to keep SKILL.md under 150 lines. See file for:
- Formatter failures (Prettier, ruff)
- CodeQL false positives (request-forgery, path-injection suppressions)
- Tag-to-version drift in release workflows
- Flaky test isolation patterns
- Network timeout handling in Actions

## Hard rules & safeguards

**CLAUDE.md hard rule** (from main instructions):
> Never automate any action on a PR that has comments from another person, or on any open PR authored by another person. Halt and tell the user.

Applied in Step 1 (authz gate). If violated: surface blocker, do not proceed.

**Standards to follow:**
- `standards/pr-conventions.md` — branch naming, commit messages, required checks before merge
- `standards/knowledge-brain.md` §1 — mount guard protocol (external drive may unmount mid-session)

## Failure / Stop Conditions

Stop and surface the blocker if ANY of:
- external drive unmounted (mount guard fails in Step 1).
- `gh` unauthenticated or lacks repo/workflow scopes.
- PR authored by another person OR has comments from a human reviewer.
- GitHub Actions logs are unavailable and the failure reason is unclear (insufficient evidence to draft a plan).
- User declines the proposed fix plan (ask for direction; do not auto-implement).

## Memory hooks

- **Read**: Query repo's prior CI patterns (Step 2) before wide investigation.
- **Write**: After resolving a novel CI pattern, offer to sync the pattern to repo memory (e.g., "record this CodeQL suppression pattern for the team?") — only if the user agrees it's a durable decision worth remembering.
