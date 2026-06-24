---
name: plugin-audit
description: Read-only diagnostic that scans installed Claude Code plugins, their enabled/disabled state, and actual Skill-tool usage from session transcripts to flag (a) enabled plugins with zero usage in the last N days (remove candidates), (b) installed-but-unregistered plugins drifting from settings.json's `enabledPlugins` map (decision-needed), and (c) disabled-but-still-installed plugins that can be uninstalled to free disk + reduce marketplace pull surface. Use when planning a plugin cleanup sweep, after a marketplace refresh, when settings.json `enabledPlugins` and the installed set fall out of sync, or as a periodic monthly hygiene check. Outputs a markdown report (default 30-day window). Pair with `mcp-audit` for MCP-side coverage.
triggers:
  - plugin audit
  - audit my plugins
  - which plugins do I use
  - find unused plugins
  - plugin cleanup
  - plugin removal candidates
---

# plugin-audit

Read-only inventory + usage scan over `~/.claude/plugins/installed_plugins.json`, `~/.claude/settings.json` (`enabledPlugins`), and Claude Code session JSONLs.

## When to run

- Before removing a plugin (confirm zero use)
- After a marketplace refresh or bulk install
- Monthly hygiene sweep (suggest scheduling alongside `mcp-audit`)
- When 39 plugins are installed but only 15 are enabled and you can't remember why

## How

```
python3 ~/.claude/skills/plugin-audit/audit.py [days]
```

Default `days=30`. Walks each installed plugin's directory to harvest the skills it ships, then scans `~/.claude/projects/*/*.jsonl` for `Skill` tool invocations whose `skill` argument matches a plugin-namespaced skill (`plugin:skill` or bare skill name). Aggregates by plugin.

## Output sections

1. **By usage** — counts per plugin, sorted desc. Shows enabled/disabled flag and install age.
2. **Zero-use enabled plugins** — strong remove candidates if old.
3. **Installed but never registered in `enabledPlugins`** — decision drift; settings.json never picked a side. Decide intentionally.
4. **Disabled but still installed** — cleanup candidates. Run `claude plugins remove <key>`.

## Acting on results

- Zero-use, ≥30d enabled → `claude plugins remove <key>` after confirming you don't rely on its commands or hooks (audit can miss those — see Limits).
- Unregistered → set `true`/`false` in `settings.json`'s `enabledPlugins` to make the choice durable.
- Disabled+installed → `claude plugins remove <key>` to free the marketplace pull surface.

## Limits

- **Counts only Skill-tool invocations of plugin-namespaced skills.** Plugins that ship only slash commands (`/commit`, `/security-review`), hooks, agents, or MCP servers will read as zero-use even when they're indispensable. Cross-check before removing:
  - Slash commands: grep `~/.claude/projects/*/*.jsonl` for the command name.
  - MCP servers: pair with `mcp-audit`.
  - Hooks: check if anything in `settings.json` references the plugin's hook scripts.
- **Skill-name matching is best-effort.** Some plugin skills are invoked bare (`commit`, not `commit-commands:commit`); the script tries both forms but unusual namespacing may slip through.
- **Doesn't infer intent** — a plugin may be unused because the workflow it supports hasn't come up recently, not because it's redundant.

## Pair with

- `mcp-audit` — same diagnostic for MCP servers.
- `skill-maintainer` — once you know which plugins to keep, audit/normalize the skill catalog they contribute.
