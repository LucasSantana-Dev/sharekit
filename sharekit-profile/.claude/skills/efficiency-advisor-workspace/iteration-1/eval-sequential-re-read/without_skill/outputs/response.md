# Evaluation: Sequential Agent Dispatch with Repeated File Reads

## Verdict
**No. This violates mandatory parallel execution rules and wastes context/tokens on redundant I/O.**

---

## Problem Statement
- 8 agents, each reads the same 400-line SKILL.md file, analyzes one section, writes findings to disk
- Section analysis is independent across agents
- Read pattern: sequential dispatch → each agent reads full file → narrow analysis → write output

---

## Violation: Parallel Execution is Mandatory

From CLAUDE.md (Hard Rules):

> **Parallel execution is mandatory for ≥2 independent tasks.** When the work decomposes into 2 or more independent units (parallel investigations, multi-repo sweeps, fan-out audits, independent file edits, batch fixes across PRs), you MUST dispatch one `Agent()` per unit in a single tool-use block — not sequentially in the main context.

**This workflow has 8 independent tasks.** Section A analysis does not depend on Section B, C, or any other. Sequential dispatch is a contract violation.

---

## Secondary Issues: Redundant I/O & Token Waste

### Issue 1: Repeated Full-File Reads
Each agent independently reads the full 400-line file. Cost per agent:
- Read overhead: file I/O latency × 8
- Token cost per read: ~100–150 tokens (conservative, 400 lines at ~0.5 tokens/line)
- Total read cost: 8 × 150 = **1200 tokens** for redundant identical reads

**Better approach:** Read once in the orchestrator, inject the file content (or just the relevant section for each agent) into the agent prompt. Cost: ~150 tokens once.

**Savings: ~1000 tokens.**

### Issue 2: Context Fragmentation
Sequential dispatch means each agent sees:
- The full conversation history up to its turn
- Its own section's analysis
- Growing diff/output from prior agents (if visible)

This bloats each agent's context window unnecessarily. Parallel dispatch with worktrees keeps context tight and isolated.

---

## Correct Approach

### Pattern A: Parallel Dispatch (Recommended)
```
Dispatch all 8 agents in ONE Agent() call, in parallel:
- Agent 1: Analyze section A
- Agent 2: Analyze section B
- ... (all in parallel)
- Agent 8: Analyze section H

Each agent runs in its own worktree (or isolated context).
Result: All 8 analyses complete ~1/8th the wall-clock time.
```

**Implementation:**
```python
# Pseudo-code
all_agents = []
for section in ["A", "B", "C", "D", "E", "F", "G", "H"]:
    all_agents.append(
        Agent(
            name=f"analyze-{section}",
            description=f"Analyze section {section}",
            prompt=f"Analyze section {section}. Context: <SKILL.md section {section} ONLY (not full file)>"
        )
    )
# Dispatch all in ONE message (single tool-use block)
```

### Pattern B: Shared Input Optimization
Pre-read the file once in the orchestrator (main context). Pass only the **relevant section** to each agent:

```python
# In orchestrator:
skill_content = read("SKILL.md")
sections = split_into_sections(skill_content)  # ["A", "B", "C", ...]

# For each agent:
agent_prompt = f"""
Analyze section {section_name}:
{sections[section_name]}

Output findings to: ./findings/{section_name}.md
"""
```

**Cost:** 1 file read (150 tokens) + 8 agent dispatches with trimmed context (each now ~50 tokens instead of 150 for re-reading).
**Savings: ~800 tokens.**

---

## Checklist: Parallel Execution

✅ **Independent tasks?** Yes — each section analysis stands alone.  
✅ **≥2 units?** Yes — 8 agents.  
✅ **Same file touched by all?** Yes — use worktrees (or file-level sharding).  
✅ **Must dispatch in one tool-use block?** YES. Not sequentially in the loop.

---

## Expected Outcome

| Approach | Wall Time | Token Cost | Compliance |
|----------|-----------|------------|------------|
| Sequential (current) | ~8× agent latency | ~2200 tokens | ❌ Violates rule |
| Parallel + re-read | ~1× agent latency | ~1200 tokens | ✅ Rule-compliant |
| Parallel + shared input | ~1× agent latency | ~400 tokens | ✅ Rule-compliant + optimized |

---

## Recommendation

**Refactor to parallel dispatch immediately:**

1. **Read the file once** in the orchestrator.
2. **Split into 8 sections** (or pass the full content if ≤8KB total).
3. **Dispatch all 8 agents in a single Agent() call** with section-specific prompts.
4. **Collect findings** from all 8 output files after all complete.

This satisfies the mandatory parallel execution rule, reduces token waste by ~75%, and completes in 1/8th the time.
