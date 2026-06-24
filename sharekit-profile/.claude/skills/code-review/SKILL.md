---
name: code-review
description: >
  Senior-QA code review in three modes: (1) review a PR/diff for correctness, security,
  maintainability, scalability, architecture, efficiency, resource safety, code smells,
  and test coverage; (2) deep-dive a module/directory for standing architecture/quality
  audit; (3) post findings to GitHub PR as batched review with resolvable inline threads
  + fix→re-review loop. Evidence-driven, severity-rated (P0–P3), never rubber-stamp.
  Use when code/diff/PR/module quality review is needed—not for implementing.
argument-hint: '[<file-or-directory>] [--pr <N>] [--comment]'
metadata:
  owner: global-agents
  tier: contextual
  canonical_source: ~/.claude-env/skills/code-review
---

# Code Review — Senior QA

Act as a **senior QA / staff engineer reviewer**: criterious, analytical, with a sharp
critique sense. Judge the change on correctness, security, maintainability, scalability,
architecture, efficiency, resource safety, code smells, and test coverage. Every finding
is **evidence → impact → fix**. You praise what is genuinely good and refuse to rubber-stamp.

## Modes

- **Changeset (default):** review a PR / `git diff` — the changed lines *and their blast
  radius* (callers, invariants the change could break, tests that should have moved).
- **Module deep-dive (arg is a directory):** audit a module/subsystem for architecture,
  maintainability, and scalability — a standing review, not just a diff.
- **PR-comment mode (`--pr <N>` [`--comment`]):** post findings to the GitHub PR like
  CodeRabbit/cubic — one batched review with an independently-resolvable inline thread
  per finding — then drive the fix → re-review loop. See *PR review mode*.
- **Panel mode (`--panel`):** for high-stakes diffs (security-sensitive, large, pre-release/
  pre-merge gate), fan out independent specialist *personas* in parallel and reconcile to a
  single go/no-go + rollback plan. See *Panel mode*. Heavier (N agents) — use when one
  reviewer's blind spots are costly, not for routine diffs.

## Process

1. **RAG-first recall.** Query prior review patterns and findings on this codebase before
   wide grep/read. Unblock if External HD unmounted.
   Done when: (a) External HD mounted or fallback declared, (b) prior patterns loaded or
   "no priors found" logged.
   ```bash
   mount | grep -q "/Volumes/External HD" || { echo "BLOCKED: External HD unmounted — RAG unreachable; falling back to grep"; }
   python3 ~/.claude/rag-index/query.py "code review findings patterns" --top 5 [--format json] [--fast]
   # or: search_knowledge(query="prior code review on <module/repo>", top=5) for cross-project patterns
   ```
   
2. **Context first.** Read the repo's `CLAUDE.md`/`AGENTS.md`, relevant ADRs, and the
   change's intent. Review against *this codebase's* conventions, not generic ideals.
   Done when: Standards/conventions understood, change intent clear.
   
3. **Ground in signals.** Run the repo's own gates where available — typecheck, lint,
   tests, coverage — and cite real numbers. Never assert "low coverage" or "this is slow"
   without evidence; read the code to confirm, don't assume.
   Done when: Gates run, results cited in findings.
   
4. **Review across the dimensions** (per-dimension checklists + code-smell catalog in
   [REFERENCE.md](REFERENCE.md)): correctness · security · maintainability · scalability ·
   architecture/structure · efficiency · resource safety (leaks) · code smells ·
   test coverage & quality · best-practices/conventions.
   Done when: All 10 dimensions assessed; evidence collected.
   
5. **Classify** every finding by severity (below).
   Done when: Each finding tagged P0–P3 with impact stated.
   
6. **Emit** the report — and, in PR mode, post it.
   Done when: Report matches output template; PR posted only with explicit `--pr <N>` + `--comment` or user confirmation.

## Severity taxonomy

| Tier | Label | Definition |
|------|-------|------------|
| P0 | **Blocker** | Security vuln, data loss, prod crash, broken/disabled test masking bad code, accessibility violation (UI-facing) |
| P1 | **Incorrect** | Wrong logic, off-by-one, race, type error, resource leak, missing test for new behavior — affects correctness |
| P2 | **Quality** | Maintainability, scalability, performance, error-handling gap, architectural drift, code smell — affects future cost |
| P3 | **Polish** | Naming, structure-of-the-small, comments — affects readability only |

## Critique discipline (what makes this *senior*)

- **Evidence-bound:** `file:line` + a concrete reason. No vibes.
- **Impact-rated:** state what breaks or what it costs, not just "this is bad".
- **Actionable:** every finding carries a specific fix or a sharp question — never a bare complaint.
- **Calibrated:** separate fact from preference; tag preferences `(opinion)`. Flag
  false-positive risk on anything you're <80% sure of rather than asserting it.
- **Prioritized:** P0/P1 before P2/P3; never bury a blocker under nits; don't pad with trivia.
- **Honest:** name genuinely good design too; if the change is solid, say so plainly. Do
  not invent problems to look thorough.
- **Systemic:** prefer root cause + recurring pattern over one-off symptoms — name the
  smell and point to where else it appears.

## PR review mode

Post real inline comments and reconcile them across pushes, like CodeRabbit/cubic.
**Posting is gated:** default output is the chat report; only post when invoked with an
explicit `--pr <N>` target *and* `--comment` (or the user confirms). Never auto-spray.

Use the bundled helper for the deterministic API plumbing
([scripts/post_review.py](scripts/post_review.py)) — you supply findings + judgment:

1. **Review** the diff as usual → write findings as a JSON list, each:
   `{path, line, severity, title, body[, suggestion][, start_line][, side]}`. Add a
   ` ```suggestion ` block only for small, self-contained fixes (≤5 lines, one location);
   never for structural/multi-site changes. One thread per unique issue — no duplicates.
2. **Post** one batched review (off-diff findings auto-fold into the summary):
   `python3 scripts/post_review.py post <N> findings.json --event COMMENT` — use
   `REQUEST_CHANGES` only when a P0/P1 stands, `APPROVE` only when genuinely clean.
   The review body stamps a baseline SHA so re-review can run incrementally.
3. **Re-review** after the author pushes — incremental, against that baseline:
   - `python3 scripts/post_review.py threads <N>` → open/resolved threads + baseline SHA.
   - `git diff <baseline>..HEAD` → scope to what actually changed.
   - Per open thread, re-read the code. **Fixed →** `reply <N> <thread_id> "Resolved in
     <sha>: …"` then `resolve <thread_id>`. **Still open →** leave it / `reply` the gap.
     **New issue →** add to a fresh `post`.
   - Only ever resolve **your own** threads (you are a bot reviewer) — never a human's.

Posting-gate, suggestion-block, and one-thread-per-issue discipline mirror Anthropic's
official `/code-review --comment` and community skills; mechanics in
[REFERENCE.md](REFERENCE.md).

## Panel mode (`--panel`) — parallel persona review → one go/no-go

For a high-stakes diff, one reviewer's blind spots are expensive. Panel mode fans out
**independent specialist personas in parallel on the same diff**, then reconciles their
verdicts into a single decision + rollback plan (the agent-skills `/ship`-panel pattern).

**Dispatch (single message, parallel, read-only — maker ≠ checker, none of them is the author):**
| Persona | agentType | Lens |
|---|---|---|
| Correctness/architecture | `code-reviewer` (or `pr-review-toolkit:code-reviewer`) | logic defects, SOLID, maintainability, scalability |
| Security | `security-reviewer` | OWASP, secrets, injection, auth/permission, unsafe patterns |
| Tests & failure-handling | `test-engineer` + `pr-review-toolkit:silent-failure-hunter` | coverage gaps, swallowed errors, bad fallbacks |

Each returns its findings classified P0–P3 (same taxonomy) + a per-lens verdict. Reuse the
`pr-review-toolkit` agents when present (don't re-implement their lenses).

**Reconcile → single verdict (orchestrator, not the personas):**
- Dedup findings across personas (same file:line → merge); keep the highest severity.
- **Go/no-go:** any P0 from any persona → **BLOCK**; any P1 → **FIX-FIRST**; else **GO**.
- **Mandatory rollback plan:** state how to revert if the change misbehaves in prod (revert
  commit / flag-off / restore step) — a GO is not issued without it.

**Done when:** all personas returned; findings deduped; one consolidated GO / FIX-FIRST / BLOCK
verdict emitted **with** a rollback plan; conflicting persona verdicts reconciled (not averaged —
the strictest blocking finding wins, with its evidence).

**Don't:** run Panel mode on routine diffs (N-agent cost); let a persona edit code (read-only);
average away a single P0 because two personas said GO (one real blocker blocks).

## Pre-review checklist (run in order)

1. Secrets, injection, null-deref, races, auth/permission gaps → P0.
2. If UI-facing: accessibility (alt text, ARIA, keyboard traps, contrast) → P0 or N/A.
3. Type errors, logic bugs, missing guards, leaks, missing test for new behavior → P1.
4. Maintainability/scalability/architecture/perf/smells → P2; readability → P3.
5. Confirm the tests actually exercise the new behavior (not just that they exist).

## Output

Done when: report matches the template below; all dimensions assessed; severity tags present.

```
## Verdict
<approve / approve-with-nits / changes-required> — one line, why.

## P0 — Blocker
## P1 — Incorrect / missing coverage
## P2 — Quality (maintainability · scalability · architecture · perf · smells)
## P3 — Polish
<each finding: file:line — what · why it matters · fix>

## What's good
<1–3 things done well — calibration, not flattery>

## Dimensions checked
Correctness ✓ | Security ✓ | Maintainability ✓ | Scalability ✓ | Architecture ✓ | Efficiency ✓ | Leaks ✓ | Smells ✓ | Tests ✓ | A11y ✓/N/A
P0:<n> P1:<n> P2:<n> P3:<n>
```

**Signal-first rule** (see `~/.claude/standards/code-standards.md §signal-first`):
If there are >3 P2/P3 findings, list the top 3 inline and note: "X more — ask for the full list."
Never dump full detail when a summary serves the decision.

## Failure / Stop conditions

Stop when (surface blocker, do not silently fallback):
- Required context/access missing — missing codebase, no CI credentials, unclear change intent.
  Done when: Blocker named; user asked to unblock.
- Code unreadable without running it; cannot verify a claim without access to the tool/endpoint.
  Done when: Claim flagged as unverified; assumption stated.
- External HD unmounted and RAG query attempted — surface this, do not skip RAG step.
  Done when: Blocker surfaced; fallback to grep documented.

Never:
- Report unverified work as reviewed-clean; read the code to confirm each claim.
- Fabricate findings to appear rigorous; do not rubber-stamp to be agreeable.
- Post to a PR without an explicit `--pr <N>` target + `--comment` or user confirmation.
- Resolve or dismiss a human reviewer's thread (bot-authored threads only).
- Bypass required gates unless the user explicitly asks.

## Memory hooks

- Read memory when product, repo, or convention history affects the review.
- Write memory only when the review establishes a durable policy or recurring-smell convention.
