# ADR 2026-06-05 — Evolving /code-review toward reviewers + fixers

**Status:** Accepted (scoped). Supersedes nothing; extends the existing `code-review` skill.
**Decision owner:** Lucas (solo operator). **Driver:** "get to CodeRabbit/Copilot level, with subagents as BOTH reviewers and fixers."

## Context

The `code-review` skill already has: dimension checklists, P0–P3 severity taxonomy,
`post_review.py` (batched inline threads, committable suggestion blocks, baseline-SHA
incremental re-review, GraphQL thread resolve/reply, off-diff folding). The ask was a
CodeRabbit/Copilot-class system: parallel reviewer fan-out + auto-dispatched fixers +
smart commenting.

Two constraints dominate and are non-negotiable:
- **Solo operator**, main-as-trunk, squash-only, **merge auto-arms a ~30-min prod deploy**
  (no human gate between merge and deploy).
- **`cubic` already auto-runs on every PR** (plus CodeQL + SonarCloud gates).
- Subagents here have **repeatedly misreported** (this session: 2 of 4 fixer agents
  misreported — one shipped a red suite, two carried large unrelated reformat churn; a
  third introduced unreachable dead code). Verifying their output is mandatory.

A critic (Opus) **rejected** the full speculative build: redundant with cubic if always-on;
auto-fix + deploy-on-merge is a silent-corruption vector; per-dimension fan-out +
refute-verify is unmeasured gold-plating for a 1-person repo.

## Decision

**Adopt a scoped first increment; defer the full architecture behind measured triggers.**

Build now (the ~20% with proven ROI):
1. **On-demand only.** No composite-router auto-invoke — that would double-post against
   cubic. Position `/code-review` as the *deep, on-demand, fix-capable* complement to
   cubic's always-on shallow pass, not a second always-on bot.
2. **Single strong reviewer by default.** Reviewer **fan-out (per-dimension, or per-file
   cluster) only when the diff exceeds a size threshold** — the one regime where fan-out
   pays its token + worktree cost. Driven by the `Workflow` primitive when invoked;
   small-PR path stays a plain skill call (no orchestration overhead).
3. **Human-gated fixer dispatch (`--fix`).** Per confirmed finding, a fixer subagent runs
   in **its own git worktree** (parallel mandate). **Mechanical/P3 fixes** may auto-apply;
   **logic changes are proposed-only and require explicit approval**. Fixers push to the
   **PR branch only** — never main, never bypassing the human pre-merge review (the one
   gate that catches subagent error before the 30-min deploy). **Every fixer's output is
   self-verified** (run the affected suite + diff the branch) before its thread is
   resolved. This verification layer is the part with hard demonstrated demand.
4. **Reuse `post_review.py`** for posting + incremental reconciliation (baseline SHA,
   resolve-on-fix, reply). **Bots-only resolve** — never resolve a human's thread.
5. Orchestrator keeps: synthesis, dedup (plain code by file+line+overlap), posting, and
   the merge-gate (`pr-merge-readiness`).

Defer (the ~80%, unproven for this repo): always-on auto-trigger, refute-verification of
*review* findings, unbounded auto-fix → re-review loops, semantic repo-graph indexing.

## Alternatives considered

- **Full Workflow-orchestrated fan-out + refute-verify + auto-fix loop (original proposal)**
  — rejected: redundant with cubic if always-on; auto-fix-to-main is a silent-corruption
  vector under deploy-on-merge; fan-out + refute unmeasured for a solo repo.
- **Do nothing / tune cubic only** — rejected: cubic can't dispatch fixes or run the deep,
  self-verified fixer loop the operator wants; today's manual version delivered real value.
- **Single-reviewer-only, no fixers** — rejected as the *end state*: drops the explicit
  "fixers" half of the ask. Kept as the *default path* within the scoped decision.

## Consequences

- **+** Delivers the "reviewers + fixers" vision in a safe, on-demand form; low net-new
  code (reuses post_review.py, critic/security-reviewer agents, the worktree mandate,
  Workflow engine). No redundant always-on bot.
- **+** Fixer self-verification directly attacks the proven failure mode (misreporting
  subagents) — the one place evidence already exists.
- **−** Not "CodeRabbit-level" on day one (no always-on, no graph indexing). Intentional:
  earns scope with evidence.
- **~** Fan-out + fixer coordination on squash-only flow must be **sequential per finding**
  (no parallel pushes to one PR branch) until a rebase/coordination story is proven.

## Revisit when (→ expand toward the deferred 80%)

- A **2-week cubic findings audit** shows FP rate >40% or it misses ≥1 critical/merged bug
  → justify refute-verification of review findings.
- A typical PR review **exceeds a single reviewer's token/context budget** → make fan-out
  the default, not size-gated.
- The repo gains a **second human contributor** (no longer solo) → always-on auto-trigger
  and stricter merge-gating become worth it.
- **Deploy-on-merge gains a human approval gate** → the auto-fix risk calculus changes;
  reconsider broader auto-apply.

Pairs with the "no infra without demonstrated demand" and "verify subagent claims" rules.
