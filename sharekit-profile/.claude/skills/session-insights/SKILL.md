---
name: session-insights
description: Multi-agent token + session analytics via agentsview (Claude Code, Codex, Cursor, …). Token cost (daily / statusline), workspace stats with git+GitHub outcomes, cross-session FTS search, project session counts, health signals, and secret-leak scan over your local agent session archive. Use for "how much have I spent", "token usage this week", "which sessions shipped", "find the session where I did X", "scan my sessions for leaked secrets". Replaces /token-audit (Claude-Code-only, ephemeral).
user-invocable: true
auto-invoke: on-token-cost-question + weekly-spend-review
metadata:
  owner: global-agents
  tier: contextual
  canonical_source: ~/.claude-env/skills/session-insights
  adr: ADR-0035
---

# session-insights

Thin wrapper over **agentsview** (local-first analytics for AI coding agents — Go binary,
`/opt/homebrew/bin/agentsview`, pre-indexed SQLite at `~/.agentsview/`). Adopted per ADR-0035
to replace `/token-audit` (which is Claude-Code-only, re-parses JSONL each run, no multi-agent
view). agentsview reads `~/.claude/projects/*` plus Codex/Cursor/etc.

## When to use

- "How much have I spent today / this week / on project X" → `usage daily` / `stats`
- "Which sessions shipped vs were abandoned" → `stats --include-github-outcomes`
- "Find the session where I did X / touched file Y" → `session search --fts`
- "How many sessions per project" → `projects`
- "Are any sessions unhealthy / stuck" → `health`
- "Did I leak a secret in a session transcript" → `secrets scan`
- Statusline / one-glance cost → `usage statusline`

Not for: live code navigation (use codebase-memory-mcp / graphify per [[ADR-0036]]), or
editing sessions. Read-only analytics.

## Freshness first (skip-if-fresh)

agentsview serves a pre-indexed SQLite snapshot. Before any analytics query, ensure it is
current — `sync` is incremental (only new/changed sessions):

```bash
agentsview sync 2>/dev/null | tail -1   # incremental; ~seconds if already fresh
```

Skip the sync if you synced this session already (it is idempotent but not free on 3000+
sessions). The first ever sync indexes the full archive (one-time, ~minutes).

## Verified command map (agentsview v0.34.x)

| Intent | Command |
|---|---|
| Daily token cost | `agentsview usage daily` |
| One-line cost (today) | `agentsview usage statusline` |
| Workspace analytics (28d default) | `agentsview stats --since 28d` |
| …as JSON for parsing | `agentsview stats --since 7d --format json` |
| …with ship/merge outcomes | `agentsview stats --include-github-outcomes` (needs `gh`) |
| …scoped to one project | `agentsview stats --include-project Lucky` |
| …one agent only | `agentsview stats --agent claude` |
| Project session counts | `agentsview projects` |
| Session health/signals | `agentsview health` |
| Full-text search sessions | `agentsview session search --fts "<query>" --limit 20` |
| …scope sources | `agentsview session search "<q>" --in messages,tool_input` |
| …include subagents | `agentsview session search "<q>" --include-children` |
| Session metadata | `agentsview session get <id>` |
| Message window | `agentsview session messages <id>` |
| Secret-leak scan | `agentsview secrets scan` then `agentsview secrets list` |
| Interactive web UI | `agentsview serve` → open the printed localhost URL |
| Server status / stop | `agentsview serve status` / `agentsview serve stop` |

`--since` accepts a duration (`7d`, `28d`) or `YYYY-MM-DD`. `--format json` is available on
`stats` for programmatic use — prefer it when you need to compute on the numbers.

## Recipe: "what did I spend and ship this week"

```bash
agentsview sync 2>/dev/null | tail -1
agentsview usage daily
agentsview stats --since 7d --include-github-outcomes --format json
```
Then summarize: total cost, cost-by-agent, sessions shipped/merged vs abandoned, top projects.

## Exploratory → hand off to the UI

If the question is open-ended ("let me browse"), do NOT dump huge tables — start the UI and
hand off: `agentsview serve` then give the user the localhost URL. The web UI has the full
interactive session browser + FTS.

## Done when

- The specific question is answered with **real numbers from agentsview** (not estimated),
  after a freshness `sync`.
- For cost questions: a figure with its window stated (e.g. "$X over 7d, $Y/day avg").
- For "find the session": the session id(s) + project + date returned, or an explicit
  "no match" — never a guess.
- For exploratory asks: the `serve` URL handed to the user.

## Pair with / supersedes

- **Supersedes** `/token-audit` for multi-agent + persistent analytics. Keep `/token-audit`
  only for a Claude-Code-only quick check with no agentsview dependency.
- [[ADR-0035]] (adoption decision), [[ADR-0036]] (cmm/graphify code-nav — different lane).
