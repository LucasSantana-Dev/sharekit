---
name: smart-commands
description: Decision guide for when to proactively use Claude Code slash commands — /think, /model, /compact, /clear. Use this skill when choosing whether to invoke a command before or during a task, or when the complexity-classifier has flagged a task as high or critical.
triggers:
  - smart commands
  - when to use /think
  - when to compact
  - should I switch models
  - use extended thinking
---

# smart-commands

When to invoke Claude Code slash commands — and when not to.

## /think — Extended reasoning

**Use before:**
- Designing something you'll have to live with (API contracts, schema, auth flow)
- Debugging a non-obvious issue where first guess is likely wrong
- Security-sensitive decisions (anything touching auth, secrets, permissions)
- When the complexity-classifier fires `[AUTO] CRITICAL`

**Skip when:**
- The task is mechanical (rename, format, add field)
- You already know the answer with high confidence
- It's a lookup or grep task

**How:** Type `/think` before your first action on the task.

---

## /model — Switch model

| Switch to | When |
|-----------|------|
| `/model claude-opus-4-7` | Sustained security/architecture work (>5 turns), incident response, risky migrations |
| `/model claude-sonnet-4-6` | Normal coding work (default) |
| `/model claude-haiku-4-5` | Repetitive formatting, bulk triage, quick lookups across many files |

**Rules:**
- Switch back to Sonnet after finishing a critical section — Opus is expensive
- For Agent tool calls, always set `model:` explicitly; the session model is independent
- `CLAUDE_CODE_SUBAGENT_MODEL=claude-haiku-4-5-20251001` is the default for subagents (free to override)

---

## /compact — Context compression

**Use when:**
- Switching to a different feature or codebase area
- Context is at 50%+ and the current task is logically complete
- You're about to start a long phase and want a clean baseline

**Don't use when:**
- Mid-task — compaction may lose intermediate reasoning you need
- The previous turns contain decisions you'll need to defend in the next turn

**Auto-trigger:** The `message-counter.sh` hook suggests `/compact` at 70% context fill and auto-generates a handoff at 85%.

---

## /clear — Full reset

**Rarely needed.** Use only when:
- Starting a completely unrelated task after a compact is insufficient
- The session has persistent tool failures and state is corrupt

**Never use mid-task** — you'll lose all accumulated context.

---

## Decision tree (quick)

```
Is this security/arch/migration/production?
  YES → /think first, consider /model opus
  NO  → Is this >3 phases or complex debugging?
         YES → /think at key decision points
         NO  → Is context >50% and task is done?
                YES → /compact before next task
                NO  → proceed normally
```

---

## Hook integration

The `complexity-classifier.sh` hook already fires on every prompt and injects guidance:
- `[AUTO] LOW` → concise, haiku subagents
- `[AUTO] HIGH` → thorough, consider `/think`
- `[AUTO] CRITICAL` → use `/think`, consider `/model opus`

You don't need to invoke this skill for routine routing — use it when you want to reason about a non-obvious command decision.
