# Changelog

All notable changes to the code-review skill. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

## [0.2.0] — 2026-06-06

### Added
- **Confidence calibration** (ADR-0002): ordered procedure — tag evidence type → derive a
  confidence band (factual 0.8–1.0 / behavioral 0.5–0.8 / speculative 0.0–0.5, aligned to the
  gating-matrix columns) → pick the value via independent-reviewer agreement; cost-of-error
  framing that forbids inflating confidence; a factual-vs-behavioral counter-example.
- **Module deep-dive procedure** for the directory-argument mode: no-diff scoping (boundary
  mapping + bounding), dimension shift toward architecture/maintainability/scalability, and a
  module-health verdict instead of approve/changes-required.
- **GitHub App posting identity** (ADR-0004): `scripts/app_token.py` mints an installation
  token (stdlib + `openssl`) so reviews post as a `<app-slug>[bot]`, never a personal account.
- `allowed-tools` frontmatter on `SKILL.md`; README "Why a bundled script?" positioning (ADR-0003).
- `post_review.py` hardening: per-finding validation (`validate_finding`), renamed-file
  (`previous_filename`) diff mapping, self-authored-PR `REQUEST_CHANGES`/`APPROVE` → `COMMENT`
  auto-downgrade, `--paginate` on the baseline reviews fetch.
- More unit tests (25) and a standalone test runner with per-test monkeypatch teardown.

### Changed
- **P0/P1 findings always post inline**, regardless of confidence/evidence — no demotion to
  summary/"open questions" (ADR-0002). Evidence/confidence gating now applies to P2/P3 only.
- `factual` evidence must cite exact file:line + why no runtime context is needed (anchored to
  observable repo facts, not "a test you'd write").
- **Posting identity is bot-only:** `assert_post_identity` / `CODE_REVIEW_BOT_LOGIN` refuse to
  post/resolve/reply under any account but the configured bot — never a personal profile.
- **De-branded output:** posted reviews use a neutral `## Code review` header (no "Senior-QA"
  stamp); the skill persona is staff-engineer framing.

### Fixed
- Empty findings list no longer posts a blank review; thread bodies no longer truncated to
  200 chars in `threads` output; `gh`/`python3` missing now yields a clear error, not a traceback.
- `_last_baseline` extracts the last (most recent) baseline marker in a review body.
- `fmt_comment_body` skips whitespace-only suggestions (no empty ```suggestion block).
- `sync.sh` exits non-zero when no destination directories exist (was a silent success).

### Notes
- ADRs added under `decisions/`: 0002 (confidence calibration), 0003 (keep bundled-script
  packaging; reject MCP/CLI/Action), 0004 (GitHub App posting identity).

## [0.1.0] — 2026-06-05

### Added
- Size-gated reviewer **fan-out** (`--fan-out`): parallel per-dimension reviewers above a
  ~600-LOC / 15-file / 8k-token threshold; single strong reviewer by default.
- Human-gated, self-verifying **fixer mode** (`--fix`): one worktree-isolated fixer per
  finding; mechanical+factual+high-confidence auto-apply, logic propose-only, never `main`.
- `confidence` (0–1) and `evidence` (factual/behavioral/speculative) on findings, with a
  severity × confidence **gating matrix** (inline / summary / drop).
- Consensus-boost **dedup** keyed `(path, line, category)`.
- `post_review.py --body-file` so the review body carries verdict + summary + what's-good.
- Unit tests for `post_review.py` (`tests/`).

### Fixed
- `post_review.py diff_lines` read `f["path"]` but the GitHub *list-PR-files* API returns
  `filename` — every real post would `KeyError`. Now uses `filename`.

### Notes
- Documented that self-authored PRs must post with `--event COMMENT` (GitHub 422s
  `REQUEST_CHANGES`/`APPROVE` on your own PR).
- ADR 0001 records the scoped architecture decision and the deferred always-on/auto-fix
  build behind explicit evidence triggers.

<!-- Releases: tag commits with git tag v<N> and push with git push --tags -->
