---
name: skill-effectiveness-audit
description: Scan recent session JSONLs and PR descriptions for skills that bailed out, returned "out of scope", or reported diagnostics without action. Proposes structural fixes per skill so they actually solve their stated problem next time. Use weekly, automatically, or after a skill failed to deliver.
user-invocable: true
auto-invoke: scheduled-weekly
argument-hint: "[--days N] [--skill <name>]"
metadata:
  owner: global-agents
  tier: contextual
  canonical_source: ~/.claude/skills/skill-effectiveness-audit
---

# Skill Effectiveness Audit

Detects the test-cleanup-pass-1-only-deleted-16-tests failure mode across every skill.
A skill that "reports the gap" instead of fixing it is broken. This skill finds them.

## Auto-invocation

- **Scheduled:** weekly via `~/Library/LaunchAgents/com.lucas.skill-effectiveness.plist`
  (Sundays 03:00). Result written to `~/.claude/projects/<slug>/memory/skill_effectiveness.md`
  so the next session loads the report as context automatically.
- **Triggered:** Claude should auto-invoke when the user reports "skill X didn't fix Y"
  or after running any skill that produced a "no action taken / further work needed"
  outcome.

## Workflow

### 0. MCP manifest lint (static)

Before the behavioral scan, verify every skill's declared MCP dependencies are actually available — a skill that needs an MCP server that isn't configured will silently run degraded (the recall-without-rag-index class of failure). See `standards/skill-mcp-manifest.md`.

```bash
python3 ~/.claude/scripts/skill-mcp-check.py --all   # exit 1 + "MISSING: ..." for any unmet dependency
```

Treat any `MISSING` as a finding: either declare the right server, configure/enable the missing MCP, or remove a stale `mcp_servers` entry. (This is structural, not behavioral — it runs even with zero recent executions.)

### 1. Find recent skill executions

```bash
# Default: last 14 days. Override with --days N
DAYS=${1:-14}
find ~/.claude/projects -name "*.jsonl" -mtime -$DAYS \
  | xargs grep -lE "Skill\(" 2>/dev/null
```

### 2. Extract bail-out patterns

Per session, scan for these phrases in assistant messages and tool results:

| Phrase | Meaning | Severity |
|---|---|---|
| "out of scope", "separate scope", "not in scope" | bail-out | HIGH |
| "needs follow-up", "needs further work", "left for later" | deferral | MEDIUM |
| "stopped at", "halted because", "cannot proceed" | early-exit | HIGH |
| "reported the gap", "documented the issue" | report-only | HIGH |
| "no changes made", "diagnostic only" | no-action | check intent |
| "unable to", "could not" + "without" | structural blocker | HIGH |

```bash
# Phrase scan per skill
for jsonl in $(find ~/.claude/projects -name "*.jsonl" -mtime -14); do
  python3 - "$jsonl" <<'PY'
import json, sys, re
PHRASES = [
  ("out of scope", "bail-out"),
  ("separate scope", "bail-out"),
  ("needs follow-up", "deferral"),
  ("stopped at", "early-exit"),
  ("reported the gap", "report-only"),
  ("unable to .* without", "structural-blocker"),
]
current_skill = None
hits = []
for line in open(sys.argv[1]):
    try: d = json.loads(line)
    except: continue
    if d.get("type") == "tool_use" and d.get("name") == "Skill":
        current_skill = d.get("input", {}).get("skill")
    elif d.get("type") == "assistant" and current_skill:
        text = json.dumps(d.get("message", {}))
        for phrase, kind in PHRASES:
            if re.search(phrase, text, re.IGNORECASE):
                hits.append((current_skill, kind, phrase))
for h in hits: print("\t".join(h))
PY
done | sort | uniq -c | sort -rn | head -30
```

### 3. Classify each finding

For each (skill, bail-pattern) hit, determine root cause:

- **Structural blocker** — skill design assumed something the project violates
  (e.g., test-cleanup assumed coverage gates leave room for deletion)
- **Missing escalation** — skill should have surfaced a decision instead of stopping
- **Missing replacement step** — skill removes/reduces something but doesn't backfill
- **Threshold mismatch** — skill thresholds don't fit the project's actual scale
- **Stale assumption** — skill relies on a tool/state that has since changed

### 4. Propose structural fixes per skill

Write the report as actionable patches:

```
SKILL EFFECTIVENESS REPORT — last <N> days

Skills with bail-out patterns:
  test-cleanup     × 2 sessions: bailed at coverage gate without writing replacement
                   FIX: add Step 1.5 reality check + mandatory it.each phase
                   STATUS: applied 2026-05-08 (commit 37090b0)

  ship             × 1 session:  stopped because "CI yellow with unknown signal"
                   FIX: chain to /ci-watch automatically, don't make user re-invoke
                   PROPOSED PATCH: <one-line edit to ship/SKILL.md>

  refactor-plan    × 3 sessions: produced plan but never moved to execution
                   FIX: chain to /loop or /dispatch after plan written

Skills with no bail-outs (working as designed):
  pr-merge-readiness, sync-memories, adr-write, mutation-test, ...
```

### 5. Apply fixes

For each proposed patch:
- If small and obvious: apply directly via Edit, commit to claude-env, sync mirrors
  (use `/docs-sync` to ensure consistency)
- If large or risky: write the proposed patch into the report and surface for review
- Always update the canonical SKILL.md, never just the mirror

### 6. Write to memory

Final report goes to `~/.claude/projects/<project-slug>/memory/skill_effectiveness.md`
with frontmatter `type: project, auto-loaded: true` so the next session sees it as context.

## Auto-invocation hook

A scheduled launchd job runs this skill weekly. The output is a memory file that gets
loaded into every subsequent session via the existing autorecall infrastructure — so
even if you never invoke this skill manually, you'll see its findings.

## Outputs / Evidence

- One-page report with skills classified by bail-out frequency and pattern
- Proposed patches per skill (applied or surfaced)
- Memory file written for next-session context

## Failure / Stop Conditions

- No JSONL files found in the lookback window → report and exit clean
- All skills clean → write a "no findings" memory so the absence is visible

## Memory Hooks

- Read prior reports to surface trend (skill X has bailed out 4 weeks running)
- Write the report itself as the primary output
