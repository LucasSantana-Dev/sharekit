---
name: mcp-care
description: Composite skill — full MCP server lifecycle audit and repair. Chains mcp-audit (usage stats) → mcp-health (live readiness) → mcp-doctor (fix broken servers) → suggest mcp-builder if a missing capability surfaces. Use monthly or when claude mcp list shows failures, after major MCP server updates, or when adding new MCP capabilities.
user-invocable: true
auto-invoke: mcp-list-failures + monthly-mcp-review + new-server-evaluation
metadata:
  owner: global-agents
  tier: contextual
---

# MCP Care

The MCP server full-lifecycle workflow. Replaces ad-hoc "this MCP is broken" /
"do I need this MCP" / "should I build a new MCP" with one chained workflow that
covers all three.

## Auto-invocation triggers

- User says "MCP audit", "fix MCP", "mcp servers broken"
- `claude mcp list` returns any "Failed to connect"
- Monthly MCP review (manual cadence)
- After upgrading an MCP server package
- When evaluating adding a new MCP capability

## Workflow

### Phase 1 — Usage audit (always)
Invoke `mcp-audit` to scan recent session JSONLs:
- Per-server tool call frequency (last 30 days)
- Zero-use servers (candidates for removal)
- High-cost servers (large tool definitions burning context tokens)

Output: ranked usage table.

### Phase 2 — Live health (always)
Invoke `mcp-health` (or `adt-mcp-health`) to validate connections:
- Each registered server: connect / handshake / list tools
- Auth state (tokens valid, expired, missing)
- Per-server response time

Output: per-server status (OK / DEGRADED / FAILED).

### Phase 3 — Repair failures (if any FAILED)
Invoke `mcp-doctor` for each failing server:
- Capture launch traceback
- Identify stale tool references / config issues
- Prune bad entries from settings.json
- Reconnect

If repair fails and the server is also low-usage from Phase 1: recommend removal.

### Phase 4 — Decision matrix (always)
Combine Phase 1 usage + Phase 2 health into action recommendations:

| State | Usage (last 30d) | Recommendation |
|---|---|---|
| OK | high | Keep, no action |
| OK | low | Consider removing — low value |
| OK | zero | Remove (`claude mcp remove <name>`) |
| DEGRADED | high | Repair via mcp-doctor; high priority |
| DEGRADED | low | Repair OR remove based on whether feature is wanted |
| FAILED | any | Phase 3 already attempted repair; if still failed, remove |

### Phase 5 — Capability gap detection (optional)
Scan recent session JSONLs for tasks where the user manually scripted what an MCP
server could have done (web fetches outside `WebFetch`, file ops outside the
filesystem MCP, etc.). If a recurring pattern emerges, suggest:
- An existing MCP server that fills the gap (search the catalog)
- OR invoke `mcp-builder` to scaffold a new one

### Phase 6 — Capture
Write report to `~/.claude/projects/<slug>/memory/mcp_care_<date>.md`.

If servers were removed: commit the settings.json change to claude-env so it
propagates.

## Reconciliation

```
MCP CARE — <date>

Servers registered: N <STATUS>
  ✓ OK:        X (M with high usage, L with low usage) <STATUS>
  [WARN] DEGRADED:  Y (repaired: A, removed: B) <STATUS>
  ✗ FAILED:    Z <STATUS>

Removed (zero-use or unrepairable):
  - <server> (last used: never / X days ago)

Repaired:
  - <server> (issue: <root cause>, fix: <action>)

Capability gaps:
  - <observed pattern> → recommend <existing server | mcp-builder for new>

Memory: <report path>
Settings change committed: <SHA if any>
Snapshot:  <path to health report | (none — task ongoing)>
Open watch: <future obligation | (none)>
```

## Outputs / Evidence

- Per-server usage + health table
- Repair actions taken
- Removal recommendations + actions
- Capability gap analysis
- Memory file for trend tracking

## Failure / Stop Conditions

- Cannot read session JSONLs → Phase 1 returns partial; continue with health-only
- Cannot run `claude mcp list` → Phase 2 fails; skill output limited to Phase 1
- mcp-doctor cannot repair AND server has high usage → escalate to user, do not
  silently remove

## Memory Hooks

- Read prior reports for trend (server X has been DEGRADED 3 months in a row →
  consider permanent removal)
- Write report as primary output
