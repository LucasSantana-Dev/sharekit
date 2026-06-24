---
name: audit-deep
description: 'Composite health audit skill — runs test-health, config-drift-detect, hook-effectiveness, performance-audit, security-audit, mcp-audit, plugin-audit, socket-audit in parallel and reconciles into severity-ranked report. Use when: "is this project healthy", "audit this repo", "tech debt review", before releases, or weekly per active project.'
user-invocable: true
auto-invoke: 'weekly-per-repo + pre-release + tech-debt-review'
metadata:
  owner: global-agents
  tier: contextual
  canonical_source: ~/.claude/skills/audit-deep
mcp_servers: [rag-index]
---

# Audit Deep

Composite that runs every audit skill in parallel against one repo, reconciles findings
by severity, and proposes a prioritized remediation plan. Replaces the "run six audits
manually and try to remember what each said" pattern.

## When to use

- **Health check** — "is this repo healthy", "what's the debt level", "run a full audit"
- **Blocker triage** — before releasing, merging major PRs, or onboarding new team members
- **Scheduled sweep** — weekly diagnostic via launchd
- **Architecture review** — after significant refactors or tool migrations
- **Memory-gated fixes** — skip re-reporting findings already triaged as won't-fix (Phase 2.5)

## Workflow

## Preamble — RAG pre-flight

Before starting the audit, query prior audit runs for this repo:

```bash
graphify query "audit <repo-name> findings" --budget 300
```

- If result shows an audit for the same repo within 7 days → surface it, ask user to confirm whether to run fresh or review cached findings.
- If no recent match → proceed to Phase 1.

**Done when:** Cached audit surfaced or no match found (proceed to Phase 1).

---

### Phase 1 — Parallel audit dispatch
Dispatch in a single Agent tool call with independent subagents (NOT sequential Skill calls):
- `test-health` — suite proportionality, coverage, runtime
- `config-drift-detect` — gate compatibility
- `hook-effectiveness` — hooks fire/exit/latency stats
- `performance-audit` or `performance-test` — runtime perf
- `security-audit` — secrets, deps, OWASP
- `mcp-audit` — MCP server usage
- `plugin-audit` — plugin enabled-vs-used
- `socket-audit` — supply chain (npm only)
- `forge-audit` — if Forge ecosystem repo

Each returns a structured verdict + findings.

**Done when:** All parallel audits complete with verifiable verdicts (not timed-out or ERROR); each audit written to memory with timestamp; all verdicts + finding lists collected and sortable by audit source.

### Phase 2 — Reconcile by severity
Aggregate all findings into one ranked list:
- CRITICAL — blocks merge / release / production safety
- HIGH — degrades workflow significantly
- MEDIUM — measurable but not blocking
- INFO — track but no action

Cross-reference: a HIGH from `config-drift` that explains a HIGH from `test-health`
is reported as one root cause, not two findings.

**Done when:** All Phase 1 findings categorized into CRITICAL/HIGH/MEDIUM/INFO buckets; deduplicated findings list published with root-cause traceback (e.g., "Finding X (source: security-audit + test-health)"); findings ranked by impact-per-effort; ready for critic challenge.

### Critic gate (after findings are aggregated)

Dispatch ONE `Explore` agentType critic — read-only, never edits — with:

> "Challenge these audit findings: Which findings might be false positives? Which severity ratings are too high or too low? What attack vector or vulnerability class was NOT checked? What would a security engineer push back on?"

- If critic identifies ≥1 misclassified or missing finding → revise findings before proceeding to Phase 2.5.
- Minor concerns → log in findings with `[CRITIC NOTE]` tag, proceed.

**Done when:** Critic verdict returned; misclassified findings corrected or none found.

### Phase 2.5 — Recall vs historical exceptions (mandatory before remediation)

Audits do not know history. Memory does. Before drafting fixes, cross-check all
HIGH/MEDIUM findings against prior decisions. See `/recall` for full sources; this
phase uses the verified patterns from `standards/skill-quality-spec.md`.

**Mount guard** (cite `standards/knowledge-brain.md` §1): check External HD is mounted
before any recall/RAG:
```bash
mount | grep -q "/Volumes/External HD" || \
  { echo "BLOCKED: External HD unmounted — recall/RAG unreachable"; exit 0; }
```

**Per finding, run in parallel:**
1. RAG semantic query: `rag_query(query="<finding description>", scope_types=["memory","handoffs"], top=3)`
2. Knowledge-brain vault (preferred for decisions): `search_knowledge(query="<finding + repo context>", top=3)`
3. Claude-mem full-text (if RAG yields nothing): `mcp__plugin_claude-mem_mcp-search__search(query="<keywords>", limit=3)`

**Reconcile:** If recall surfaces a prior decision about that exact item (exception,
intentional pattern, "do not change X" memory):
- Tag the finding `NEEDS_REVIEW` instead of `AUTO_FIX`
- Proceed to Phase 3; user reconciles manually
- If the prior decision still holds: drop the finding + add an inline source comment
  defending the exception so the next audit cycle reconciles via comment
- If circumstances changed: proceed with fix and supersede the old memory

Findings with zero recall hits keep `AUTO_FIX` tag.

**Why this phase exists** (cited: homelab PR #100, 2026-05-14): a subagent acted on
a config-drift finding without checking memory, causing a revert before merge.

**Done when:** All HIGH/MEDIUM findings tagged `AUTO_FIX` or `NEEDS_REVIEW` with traceability (memory reference or empty recall result logged); every suppressed finding logged with prior decision citation; audit trail verifiable.

### Phase 3 — Remediation plan
For each `AUTO_FIX`-tagged CRITICAL + HIGH (Phase 2.5 filters out `NEEDS_REVIEW`):
- Recommend the specific composite skill to fix it (`/fix-the-suite`,
  `/secrets-rotate`, `/gate-relax`, etc.)
- Estimate effort
- Sort by impact-per-effort (highest-impact lowest-effort first)

`NEEDS_REVIEW` findings list separately with their conflicting memory reference
so the user can reconcile manually.

**Done when:** Ranked plan includes all `AUTO_FIX` CRITICAL/HIGH findings; each finding has a linked composite skill, effort estimate (hours), and impact metric (e.g., "affects 40% of test suite"); NEEDS_REVIEW section lists conflicting memory citations; plan is sortable by impact-per-hour.

### Phase 4 — Memory + handoff
Write the report to `$HOME/.claude/projects/-Volumes-External-HD-Desenvolvimento/memory/audit_deep_<repo>_<date>.md`
(symlinked to knowledge-brain; see `standards/knowledge-brain.md` §2 for write path).
Update MEMORY.md index so trends are visible across audits.

**Done when:** Memory file committed to `audit_deep_<repo>_<date>.md` with all phases logged; MEMORY.md index updated with link + date + verdict; prior audits for same repo cross-linked showing trend (e.g., "SCORE/100 improved from X to Y" or "same 3 findings, 2nd audit cycle").

## Output format (signal-first)

Lead with verdict + top 3 findings. Full output format in `references/output-patterns.md`.

Single report (inline summary):
```
AUDIT DEEP — <repo> — <date>

VERDICT: <SCORE/100> <STATUS> — e.g., "72/100 DEGRADED"

TOP ISSUES (of N total):
  1. [CRITICAL] Test suite 37x ceiling (1467 vs target 150)
     Root: config-drift HIGH (99% functions gated)
     Fix: /fix-the-suite (~2–4h)

  2. [HIGH] 2 transitive vulns (CVSS ≥7)
     Fix: /dependency-update-batch (~30min)

  3. [HIGH] Hook spam every 10 turns
     Fix: applied 2026-05-08 (commit 04ec576)

Full findings: <path to memory file | "ask for full list">

REMEDIATION PLAN:
  1. /fix-the-suite (resolves 1 CRITICAL + 2 MEDIUM)
  2. /dependency-update-batch (resolves 1 HIGH)

NEEDS_REVIEW (manual reconciliation):
  • Finding X conflicts with memory #3415; user to decide

Snapshot: <path to audit_deep_<repo>_<date>.md>
```

## Evidence + Artifacts

- Per-audit raw verdicts (Phase 1)
- Reconciled severity-ranked findings (Phase 2)
- Recalled prior decisions + AUTO_FIX vs NEEDS_REVIEW tags (Phase 2.5)
- Effort-sorted remediation plan (Phase 3)
- Memory file + index update for trend tracking (Phase 4)
- If PARTIAL: list which audits errored; surface blockers

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "This finding is low severity so I'll skip the full trace" | Severity ratings change when you see the full exploit path. Trace every finding |
| "The repo is too large to audit completely in one pass" | Partial coverage is fine — but the reconciliation must say what was NOT covered. Silent partial audits are worse than no audit |
| "The critic is too cautious about this finding" | Critic caution is signal, not noise. A finding the critic doubts needs more evidence, not dismissal |
| "I'll skip the RAG pre-flight — this audit is definitely fresh" | The pre-flight costs 300 tokens. Re-running a completed audit costs 10-50K tokens |

## Pair with

- `/recall` — full recall sources (RAG, knowledge-brain, claude-mem, Serena) when Phase 2.5 needs deep history
- `/fix-the-suite`, `/secrets-rotate`, `/dependency-update-batch` — remediation composites
- `standards/knowledge-brain.md` — mount guard + memory write paths
- `standards/skill-quality-spec.md` — verified RAG patterns + checklist

## Stop/Failure Conditions

**Mount guard (Phase 2.5 — cite `standards/knowledge-brain.md` §1):**
If External HD is unmounted before Phase 2.5, surface the blocker loudly, then skip the
memory cross-check and downgrade EVERY finding to NEEDS_REVIEW. The audit report still
completes; what halts is auto-remediation — never emit an AUTO_FIX tag without the memory
check (applying a fix that was previously triaged won't-fix is the risk this guards).

**Phase errors:**
- Any audit skill errors → mark that skill PARTIAL, continue with the rest
- All audits error → report UNABLE_TO_AUDIT, halt

**Early exits (no further phases needed):**
- All audits return CLEAN → write a "no findings" memory; a clean baseline is
  itself valuable evidence
- User invokes during active development → defer non-blocking audits; run only
  the ones gating immediate work (e.g., security-audit before release)

## Cross-skill dedup & memory precedent

Phase 2.5 already deduplicates via recall. Additionally:
- If the same finding repeats across 3+ consecutive audit cycles with a NEEDS_REVIEW
  tag and no manual reconciliation, escalate to the user: "Finding suppressed 3 times
  — requires ADR or comment-based exception."
- Link to `/recall` for full recall sources and decision guide (which source to query
  for different question shapes)
