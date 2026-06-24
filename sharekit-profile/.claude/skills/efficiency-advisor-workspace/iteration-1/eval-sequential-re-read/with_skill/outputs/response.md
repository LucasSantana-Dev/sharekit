# Efficiency Advisor Analysis: Sequential 8-Agent Workflow

## Summary

Your workflow is **EXPENSIVE** on both time and tokens. Sequential dispatch + full re-reads waste ~7× wall-clock time and 48k–64k redundant input tokens. Two targeted changes unlock ~7× speedup and ~85% token savings.

---

## Analysis

**Analyzing: planned workflow**

### Step 2 — Work structure

- **Input**: One SKILL.md file (~400 lines)
- **Tasks**: 8 agents, each reads the entire file, analyzes one independent section, writes findings
- **Dependencies**: None — each agent's work is independent
- **Structure type**: **Fan-out** (1 input → 8 independent analyses)

### Step 3 — Model tier fit

Assuming Sonnet (standard for analysis): appropriate. No tier mismatch detected.

### Step 4 — Parallelism check

**Finding: Sequential dispatch is a bottleneck**

- Current approach: Agents dispatched one at a time, each waits for prior to complete
- Runtime impact: 8 × (per-agent runtime) = wall-clock time 7× longer than necessary
- Root cause: Sequential wait pattern blocks all agents until the first completes
- Fix: Dispatch all 8 in a single parallel message (one tool block, 8 Agent calls)

### Step 5 — Re-read waste

**Finding: Severe redundant file reads**

- Each of 8 agents independently reads the full 400-line SKILL.md file into its own fresh context
- Per-agent input cost: ~6k–8k tokens (full context + file content)
- Total redundant cost: 8 × (6k–8k) = **48k–64k tokens of wasted input**
- Root cause: Fresh agents have zero shared cache; no inheritance of prior reads

**Three mitigation strategies:**

1. **Fork (recommended for simplicity):**
   - Orchestrator reads file once (6k–8k tokens, cached)
   - Spawn 8 forks via `subagent_type: "fork"`
   - Each fork inherits the cached read + conversation history
   - Cost per fork: ~200–400 tokens (only analysis context, file already cached)
   - Total cost: ~8k + 8×300 ≈ **11k tokens** (vs. 56k–64k baseline)
   - Savings: ~85%
   - Tradeoff: All agents locked to same model tier as orchestrator

2. **Content slicing (most flexible):**
   - Orchestrator reads file once (6k–8k tokens)
   - Extract 8 sections (~50 lines each, ~200–300 tokens each after summary)
   - Dispatch 8 fresh agents, each injected only its section (section + analysis prompt)
   - Cost per agent: ~200–300 tokens (slice only, not full file)
   - Total cost: ~8k + 8×250 ≈ **10k tokens**
   - Savings: ~85%
   - Tradeoff: More setup; gain model-tier flexibility per agent

3. **No optimization (current plan):**
   - Cost: ~56k–64k input tokens
   - Time: 7× longer than parallel baseline

### Step 6 — Findings ranked by impact

| Priority | Finding | Current | Recommended | Saves | Tradeoff |
|----------|---------|---------|-------------|-------|----------|
| **HIGH** | Sequential dispatch | 8 agents one-at-a-time | Parallel (one message, 8 Agent calls) | ~7× wall-clock time | None |
| **HIGH** | Redundant file reads | 8 × full-file reads (48k–64k tokens) | Fork or slicing | ~85% input tokens (~8k baseline + small slice) | Fork = same tier only; slicing = setup cost |
| **LOW** | Output consolidation | 8 separate files | Orchestrator merges to 1 | Negligible I/O | Slightly more logic |

### Step 7 — Output

```
## Efficiency [EXPENSIVE] — Sequential dispatch with full re-reads

**Status:** FIXABLE
**Savings available:** ~7× faster (wall-clock) | ~85% fewer input tokens
**Key findings:**
  1. Dispatch all 8 agents in parallel (one message), not sequentially
  2. Use fork or slicing to avoid 48k–64k tokens of redundant file reads
  3. [Optional] Consolidate outputs in orchestrator instead of 8 separate files

**Next:** Convert to parallel dispatch + adopt fork (simplest) or slicing (most flexible).
```

---

## Recommended Workflow (Code Sketch)

### Option A: Fork (simplest)
```python
# Orchestrator reads once
skill_content = read("SKILL.md")  # ~6k–8k tokens, cached

# Dispatch 8 child agents via fork (one message)
for section_num in range(1, 9):
  Agent(
    subagent_type="fork",
    prompt=f"Analyze section {section_num} of the loaded SKILL.md file. Write findings to file."
    # Fork inherits skill_content from orchestrator's cache
  )
```

### Option B: Slicing (most flexible)
```python
# Orchestrator reads once
skill_content = read("SKILL.md")  # ~6k–8k tokens

# Extract 8 sections, summarize each
sections = extract_sections(skill_content, count=8)
summaries = [summarize(s) for s in sections]  # ~200–300 tokens each

# Dispatch 8 fresh agents with injected summaries (one message)
for i, summary in enumerate(summaries):
  Agent(
    model="sonnet",  # Or tier-specific per agent
    prompt=f"Analyze this section: {summary}. Write findings to file."
  )
```

---

## Key Takeaways

1. **Sequential is the killer** — Parallelism is free here (no dependencies). One message, 8 Agent calls = 7× speedup with zero added complexity.
2. **Re-reads are expensive** — Fresh agents don't share context. Fork (cache-aware) or slicing (content-aware) both cut waste to ~15% of the baseline.
3. **Pick fork if agents are identical, slicing if you need flexibility** — Fork is ~3 lines per agent, no briefing cost. Slicing takes more setup but unlocks per-agent model-tier tuning.

---

## No Changes Needed If:

- Wall-clock time doesn't matter (e.g., offline batch)
- Token cost is unconstrained
- The 8 analyses must run sequentially for business logic reasons (clarify if so)

Otherwise: **Apply finding #1 and #2. Parallel + fork cuts time by 7× and tokens by 85%.**
