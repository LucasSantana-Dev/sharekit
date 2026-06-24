---
name: metrics
description: Show concrete productivity metrics and session analytics such as tokens,
  trends, efficiency, or usage breakdowns. Use when the user asks for raw or summarized
  Claude Code metrics.
disable-model-invocation: true
argument-hint: '[tokens|sessions|efficiency|trends]'
metadata:
  owner: global-agents
  tier: contextual
  canonical_source: ~/.agents/skills/metrics
---














Analyze and display productivity metrics for Claude Code usage.

## What to report

### Session stats
- Current session: estimated tokens used, tools called, files modified
- Recent sessions from `~/.claude/session.log`

### Tool usage
- Most frequently used tools this session
- Agent delegations count
- MCP server calls

### Efficiency indicators
- Are we using subagents for parallel work? (should be for 3+ independent tasks)
- Are we using @file references vs full reads?
- Context compression events

## Output format

Present as a concise dashboard:

```
Session Metrics
───────────────────────────
Tools called:      [N]
Files modified:    [N]
Agent delegations: [N]
MCP calls:         [N]
Est. context:      [low/med/high]

Efficiency
───────────────────────────
Parallel agents:   [yes/no]
@file refs:        [yes/no]
Compactions:       [N]

Recommendation: [actionable suggestion]
```

## Failure / Stop Conditions

- Stop if key prerequisites are missing or the request changes scope enough that the current workflow no longer fits.

## Memory Hooks

- Read memory when product, repo, or workflow history affects correctness.
- Write memory only if this work establishes a durable policy or convention.
