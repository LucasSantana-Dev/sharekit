---
name: harness-audit
description: Read-only security audit of YOUR OWN Claude Code harness config (~/.claude) as an attack surface — not app code, not usage. Scans hooks for shell-injection and curl|sh remote execution, settings.json permissions for over-broad allow entries and sandbox-disabling flags, configs/hooks/MCP for hardcoded secrets (masked, never echoed), credential-file permissions, MCP servers for broad-capability scope creep, and agent definitions for analysis agents granted Write/Edit (violating the read-only-by-construction rule). Outputs a severity-ranked markdown report; mutates nothing. Use after wiring new hooks/MCP servers/agents, when adopting external skills or marketplace plugins, or as a periodic harness-hygiene sweep. Complements (does not duplicate) mcp-audit/plugin-audit (usage), hook-effectiveness (firing/value), and security-audit (app code).
triggers:
  - harness audit
  - audit my harness
  - audit my .claude config
  - is my claude config secure
  - hook injection scan
  - harness security
  - agentshield
  - audit harness attack surface
user-invocable: true
auto-invoke: post-hook-wiring + post-mcp-add + post-external-skill-adoption
argument-hint: "[--strict] [path]"
metadata:
  owner: global-agents
  tier: contextual
  canonical_source: ~/.claude/skills/harness-audit
  origin: backport of ECC "AgentShield" concept (external-repo eval 2026-06-17)
---

# harness-audit

You harden app code and prune unused MCP servers, but the harness config that runs
on every session — hooks that exec shell, MCP servers with broad scope, secrets in
`settings.json`, agents with write grants — is itself an attack surface and nothing
audits it. This skill treats `~/.claude/` as the target.

## When to run

- After wiring or editing a hook (chain after `hook-effectiveness`)
- After adding an MCP server (pair with `mcp-audit` for the usage side)
- After adopting an external skill, plugin, or marketplace bundle (supply-chain check)
- Periodic harness-hygiene sweep (suggest monthly alongside `mcp-audit`/`plugin-audit`)
- Before publishing or sharing any part of your `~/.claude` config

## How

```
bash ~/.claude/skills/harness-audit/audit.sh [path]        # default path: ~/.claude
bash ~/.claude/skills/harness-audit/audit.sh --strict      # exit 2 if any HIGH finding (CI/gate use)
```

Read-only. No settings touched. Secret values are masked in output (`«redacted»`),
never printed — honoring the "do not echo secrets" rule.

## What it checks (severity model)

| Category | Severity | What it flags |
|---|---|---|
| **Secrets in config** | HIGH | Live keys/tokens hardcoded in `settings*.json`, hooks, MCP config, `*.env` (vs `$VAR`/`os.environ` references, which are fine) |
| **Hook injection** | HIGH/MED | `eval`, `curl\|sh` / `wget\|sh` remote exec, `bash -c "$…"`, `subprocess(…, shell=True)`, `os.system(`, `exec(` in hooks/skill scripts |
| **Permission posture** | HIGH/MED | Over-broad `permissions.allow` (`Bash(*)`, `*`, `Bash(rm:*)`), `dangerouslyDisableSandbox`, `bypassPermissions` default, `--dangerously-*` flags |
| **Credential file perms** | MED | `.credentials.json` / `*.env` readable by group/other (looser than `600`) |
| **MCP scope creep** | INFO/MED | Broad-capability servers (filesystem/computer-use/shell/exec) present — confirm least privilege |
| **Agent write grants** | MED | Analysis-role agents (review/audit/research/explore/critic/plan/spec) granted `Write`/`Edit` — violates read-only-by-construction |
| **Remote supply chain** | LOW/MED | Hooks/skills pulling unpinned remote code (`npx` remote, `pip install <url>`, `curl` of a script) |

## Output

Plain markdown to stdout, grouped by severity with `file:line` evidence. No mutations.
Pipe to keep history:

```
bash ~/.claude/skills/harness-audit/audit.sh > ~/.claude/plans/harness-audit-$(date +%Y-%m-%d).md
```

## Acting on results

- **HIGH secret** → move the value to an env var / secret store, rotate the leaked key,
  reference via `$VAR`. Never leave a live key in a tracked config.
- **HIGH hook injection** → quote interpolations, drop `eval`, pin remote code to a hash,
  replace `curl|sh` with a vendored script. Re-run after fixing.
- **MED permission** → tighten the `allow` glob to the narrowest command form that works.
- **MED agent grant** → switch the analysis agent's `agentType`/tools to a write-incapable set.
- **INFO/MED MCP** → confirm the broad server is still earning its scope (cross-ref `mcp-audit`).

## Limits

- **Heuristic, not a proof.** Grep-based static analysis: expect a few false positives
  (a comment containing `eval`, a placeholder that looks like a key) and possible false
  negatives (obfuscated injection). Triage, don't auto-act.
- **Scope, not usage.** It judges *risk/posture*, not whether a server/hook is used —
  that's `mcp-audit` / `plugin-audit` / `hook-effectiveness`.
- **Config only.** It does not audit application code in your repos — that's `security-audit`.
- Prunes large dirs (`projects/`, `plugins/*/node_modules`, `rag-index/`, `.git`) for speed.
