---
name: task-start
description: Bootstrap session state via 3 parallel agents at task start. Dispatch handoff reader (reads plan + last handoff), git state (status/log/branch), and project context (CLAUDE.md). Returns consolidated state in 1 turn instead of 8–10 sequential reads. Use when (1) starting a new task, (2) resuming after context switch, (3) clarifying what's blocked or in-flight.
metadata:
  owner: global-agents
  tier: contextual
triggers:
  - start task
  - task start
  - bootstrap
  - what's the current state
  - what should I work on
  - resume session
  - session start
---

## What It Does

Instead of running 8–10 tool calls sequentially to gather state:

```
Turn 1: Read CLAUDE.md
Turn 2: Read latest handoff
Turn 3: Read active plan
Turn 4: git status
Turn 5: git log
Turn 6: git branch
Turn 7: ls plans
Turn 8: summarize state
```

This skill dispatches **3 parallel Haiku agents** and consolidates their output in a single turn:

### Agent 1: Handoff & Plan Reader
- Reads: `~/.claude/handoffs/latest.md` (if exists)
- Reads: `ls ~/.claude/plans/*.md | tail -1` (most recent plan)
- Outputs: summary of last handoff (phase, blocker, next steps) + active plan title

### Agent 2: Git State
- Runs: `git status`
- Runs: `git log --oneline -5`
- Runs: `git branch --show-current`
- Outputs: current branch, 5 most recent commits, working tree status

### Agent 3: Project Context
- Reads: `CLAUDE.md` (project-level if exists in cwd, else project-wide)
- Outputs: key constraints, storage policy, branch naming, test priorities, etc.

---

## Result: Consolidated State Output

A single human-readable summary containing:

- [OK] **Active Branch**: e.g., `feature/guild-config`
- [OK] **Last Handoff**: Phase completed, blocker if any, recommended next step
- [OK] **Open Tasks**: from active plan
- [OK] **Progress**: last 5 commits on current branch
- [OK] **Working Tree**: clean / dirty (files changed)
- [OK] **Project Rules**: from CLAUDE.md (storage, branch naming, CI policy)

**Cost**: 3 agents (haiku, cheap) in parallel. **Benefit**: -7 turns at session start.

---

## Use Case

Typical session flow:

1. User: "start task"
2. task-start skill: dispatch 3 agents
3. (agents run in parallel ~2–3 sec)
4. Skill returns: consolidated state in 1 turn
5. User (or Claude): "continue with phase 2" / "fix the test" / etc.

**Before**: 8–10 turns of sequential reads + manual synthesis.  
**After**: 1 turn with full context.

---

## Implementation Detail

The skill itself does NOT read files or run commands. It dispatches 3 micro-agents (Haiku model, cheap) via `/dispatch` or `/agent` and consolidates their STDOUT into a single markdown block.

```bash
# Pseudocode for the skill dispatcher:

agent dispatch --model haiku --prompt "Read ~/.claude/handoffs/latest.md and the most recent .md in ~/.claude/plans/. Output summary of phase, blockers, and next steps."

agent dispatch --model haiku --prompt "Run: git status, git log --oneline -5, git branch --show-current. Output concise summary."

agent dispatch --model haiku --prompt "Read CLAUDE.md from current directory. Output key constraints, storage policy, branch naming rules, test priorities."

# Wait for all 3 → synthesize → return to user
```

---

## Triggers & Invocation

Automatically or on-demand:

- User says any variant of "start task", "bootstrap", "what's the current state", "resume session"
- Skill intercepts and runs 3-agent dispatch
- Returns state summary
- Ready for next action

---

## Integration Notes

- Assumes `~/.claude/handoffs/latest.md` and `~/.claude/plans/` exist (gracefully handles missing files)
- Runs from project root (respects git cwd)
- CLAUDE.md can be project-level or inferred from parent
- Agent 3 can skip CLAUDE.md read if project has none
- Consolidation should highlight: what's done, what's blocked, what's next
