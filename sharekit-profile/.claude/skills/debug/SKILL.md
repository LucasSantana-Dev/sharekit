---
name: debug
description: Quick root-cause debugging. Systematic trace-before-fix workflow for bugs, test failures, and unexpected behavior. When you need to investigate fast—why is this failing, root cause, debug this, ultradebug—run the 7-step frame inline or dispatch to systematic-debugging for full workflow.
metadata:
  owner: global-agents
  tier: alias
---

# Debug

Quick 7-step debugging workflow. For full turn-efficiency budgets, architecture questioning, and subagent escalation triggers, see `systematic-debugging`.

**Core principle: Find root cause before fixing.** Symptom fixes are failure.

## Phase 0 — RAG Pre-flight

Before tracing, query prior knowledge: have we hit this class of failure before?

- Run: `graphify query "<symptom class>" --budget 300` (e.g., "NullPointerException in event handlers", "i18n rendering race condition")
- Or: codebase-memory-mcp for structural patterns (e.g., circular imports, mock/real service mismatches)
- Skip if fresh (within 24h debug session on this codebase)

Done when: cached match surfaced + linked ADR/incident log + prior fix notes, OR no match (proceed to trace).

## Quick 7-Step Frame

1. **Reproduce** — get a minimal, reliable reproduction
   - Done when: single command or test case reliably triggers the failure ≥2/3 times

2. **Locate** — find the exact file, line, and call path where it breaks
   - Done when: file + line number + function name pinpointed; error stack traced to source (not library boundary)

3. **Hypothesize** — list 2-3 competing explanations
   - Done when: 2-3 testable explanations written (each with a "if true" prediction)

4. **Evidence** — for each hypothesis: what would confirm or rule it out
   - Done when: per hypothesis, one confirming test + one ruling-out test specified

5. **Test** — run the fastest confirming/ruling test first
   - Done when: test result(s) narrow hypotheses to 1 survivor; if multiple survive, run next test

6. **Fix** — change exactly what the evidence points to
   - Done when: only the root-cause code changed (not symptom patches); fix is minimal and localized

7. **Verify** — confirm fix resolves the issue, run full test suite
   - Done when: original repro passes + full test suite passes + no regressions in related tests

## Inline Rules

- Never change code before you know the root cause
- Read the actual error message — don't skim it
- Check assumptions: is the value what you think it is? Add a log
- Distinguish "symptom" from "cause" — fix the cause
- If stuck after 3 hypotheses, add instrumentation before guessing more

## When to Escalate

For turn-efficiency budgets, architecture questioning (3+ failed fixes), subagent escalation triggers, red flags, and debugging churn prevention, invoke `/systematic-debugging` instead. Both workflows share the same non-negotiable: root cause FIRST, fixes SECOND.

## Output

```text
Root cause: <one sentence>
Location:   <file>:<line>
Fix:        <what to change and why>
```
