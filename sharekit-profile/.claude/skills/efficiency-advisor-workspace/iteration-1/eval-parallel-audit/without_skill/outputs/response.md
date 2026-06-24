# Audit Plan Efficiency Analysis

## Verdict: Not efficient. Plan is sequential when it should be parallel.

---

## Three critical inefficiencies

### 1. **Sequential blocking with no dependencies**

Steps 1–3 (security audit → test health → config drift) are **independent**. None depends on the output of the previous. Sequential execution wastes the runtime of steps 2 and 3 waiting idle.

**Current flow:**
- Step 1: Security audit runs (assume 5–10 min) | Steps 2–3: blocked
- Step 2: Test health runs (assume 5–10 min) | Steps 3: blocked  
- Step 3: Config drift runs (assume 5–10 min)

**Total time:** ~20–30 min

### 2. **Parallel execution cuts time by ~66%**

All three audits can run concurrently in separate agents/worktrees:

**Optimized flow:**
- Steps 1–3: All three agents run in parallel
- Step 4: Synthesis + ADR after all three are done

**Total time:** ~5–10 min (the slowest single audit) + synthesis time

**Time saved:** ~15 min per audit cycle.

### 3. **Model tier is wrong for steps 1–3**

Opus is overkill for mechanical audits. Security-audit, test-health, and config-drift-detect are **read-only analysis tasks** that should use read-only agent types (e.g., `Explore`, `security-reviewer`, `scientist`). Opus is for:
- Orchestration (routing decisions across independent phases)
- Architectural synthesis requiring 5+ step reasoning chains
- ADR writing (step 4 is Opus-appropriate)

Steps 1–3 waste Opus capacity. Use Sonnet or read-only agent type per audit.

---

## Recommended structure

```
1. Launch 3 parallel agents (no blocking):
   - Agent A: Security audit (security-reviewer or explore type)
   - Agent B: Test health audit (test-engineer or scientist type)  
   - Agent C: Config drift check (explore type)
   Each runs in its own worktree.

2. Collect all three results.

3. Synthesis + ADR (Opus agent) — now you have all input.
```

**Expected efficiency:**
- Parallel execution: ~66% time reduction
- Correct model tier: ~40% cost reduction (Sonnet/Haiku for steps 1–3, Opus only for 4)
- Combined: faster + cheaper

---

## Why your plan has sequential wait gates

The `wait for it to finish` pattern between steps assumes dependencies that don't exist. This is a common trap when mentally modeling agent workflows — it feels natural to "wait" because you're thinking linearly. But agents can fork; use that.

The **only** true dependency is step 4 waiting for steps 1–3 (synthesis needs input). Everything else is artificial blocking.
