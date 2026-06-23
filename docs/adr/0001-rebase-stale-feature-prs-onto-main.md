# ADR-0001: Integrate stale feature PRs by rebasing onto main

- **Status:** Accepted
- **Date:** 2026-06-23
- **Deciders:** Lucas Santana

## Context

PR #35 (`feat/export-secret-guardrails`) was forked from `main` at `0a93ab7` (v0.2.1).
While it was in review, `main` advanced by two already-merged-and-pushed PRs — #34
(`search`, released v0.3.0) and #36 (static directory page) — leaving #35 two commits
behind. The branch had to be integrated with the new `main` before it could merge.

Measured facts at decision time:
- `src/sharekit.ts` merged cleanly and *semantically* safely (search added a standalone
  `search()`; guardrails added independent `scanForSecrets`/`scan`/`Finding` — no shared state).
- `src/index.ts` had one real conflict: both features register a new subcommand + USAGE
  line + flag parsing in the same CLI-dispatch block; `VERSION` also moved to `0.3.0`.
- The repo **enables all three merge methods** (`squash`, `merge`, `rebase`) — the method
  for any given PR is chosen by the maintainer at merge time and cannot be predicted.

## Decision

Rebase the feature branch onto `main` (with `git rerere` enabled to replay the single
`index.ts` resolution across the commits that touch it), resolve by keeping **both**
`search` and `scan`, take `main`'s `VERSION = 0.3.0`, then force-push.

## Alternatives considered

- **Merge `main` into the branch** — *rejected.* Its only edge ("resolve the conflict
  once") is negated by `rerere`, and its main benefit ("the merge commit vanishes at
  squash") is **conditional on the maintainer choosing squash**, which is not guaranteed
  here. A merge commit in the branch is a liability if the PR is later rebase-merged or
  merge-commit-merged.
- **Cherry-pick guardrails onto a fresh branch off main** — *rejected.* Unnecessary churn;
  rebase achieves the same linear result with less ceremony.
- **Treat it as a process problem and serialize parallel feature work** — *rejected as the
  primary fix.* Evidence showed this was a routine stale PR (two normally-merged PRs
  advancing main), not a workflow pathology. The lightweight norm "rebase before merge"
  suffices.

A `decision-critic` review returned NEEDS_REVISION on an initial lean toward merge-into-branch;
its load-bearing claim (unverified squash assumption) was verified false (all three methods
enabled), confirming rebase as the robust choice.

## Consequences

- **Positive:** A linear, merge-commit-free branch is compatible with *whichever* merge
  method the maintainer selects. The post-rebase test run caught a real behavioral break
  (a default-cwd `scan` test that assumed `./sharekit-profile` was absent, which main's
  newly-shipped example `sharekit-profile/` invalidated) — fixed by isolating the test in a
  temp cwd. Textual clean-merge ≠ behavioral correctness; always run the full suite after integrating.
- **Negative:** Rebase rewrites commit SHAs and requires a force-push. Acceptable here — the
  branch has no downstream dependents and was already force-pushed this session.
- **Neutral:** `git rerere` is now enabled in the local config.

## Revisit when

Reconsider (prefer merge-into-branch) **if** the repo standardizes on a single merge method
that makes a branch merge commit harmless (e.g. squash-only, with rebase/merge-commit
disabled in settings), **or if** a future feature PR accumulates conflicts across many
commits such that rebase requires more than ~3 manual `rerere` resolutions where a single
merge-resolution would be materially cheaper.
