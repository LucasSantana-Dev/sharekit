---
name: insights
description: Generate a productivity or usage insights report for Claude Code sessions
  from the available telemetry and history. Use when the user wants higher-level session
  analysis instead of raw counters.
disable-model-invocation: true
context: fork
agent: Explore
allowed-tools: Bash(*)
metadata:
  owner: global-agents
  tier: ephemeral
---














Generate a productivity insights report for the current Claude Code setup.

## Data collection

Gather data from these sources:

```bash
# Session history
cat ~/.claude/session.log 2>/dev/null | tail -20

# Skill inventory
find ~/.claude/skills -name "SKILL.md" 2>/dev/null | wc -l
find ~/.claude/commands -name "*.md" 2>/dev/null | wc -l

# Agent inventory
find ~/.claude/agents -name "*.md" -not -name "README.md" 2>/dev/null | wc -l

# Plugin count
jq '.enabledPlugins | to_entries | map(select(.value == true)) | length' ~/.claude/settings.json 2>/dev/null

# Hook count
jq '.hooks.PreToolUse | length' ~/.claude/settings.json 2>/dev/null

# MCP server count
jq '.mcpServers | length' ~/.claude/settings.json 2>/dev/null

# Memory files
ls ~/.claude/projects/*/memory/ 2>/dev/null | wc -l
```

## Report format

```
Claude Code Insights
════════════════════════════════
Setup
  Skills:    [N] (V2) + [N] (legacy commands)
  Agents:    [N] specialized subagents
  Plugins:   [N] enabled
  Hooks:     [N] PreToolUse guards
  MCP:       [N] servers
  Memory:    [N] persistent files

Recent Sessions
  Last 5 sessions with timestamps

Recommendations
  - [actionable optimization suggestions based on data]
════════════════════════════════
```

Focus on actionable recommendations: underused agents, missing skills for common tasks, hook gaps.

## Outputs / Evidence

- Return the concrete deliverable requested, the main decisions made, and any unresolved constraints.

## Failure / Stop Conditions

- Stop if key prerequisites are missing or the request changes scope enough that the current workflow no longer fits.
