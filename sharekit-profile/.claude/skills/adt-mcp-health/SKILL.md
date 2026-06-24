---
name: mcp-health
description: Validate live MCP provider health — separate config issues from auth and connectivity failures
triggers:
  - mcp health
  - check mcp
  - mcp not working
  - mcp connection
  - mcp status
---

# MCP Health

Run a live health check on MCP servers to distinguish config, auth, and connectivity problems.

## Steps

1. **Check enabled servers** — list which MCP servers are configured and enabled
2. **Test connectivity** — attempt a live connection or status check per server
3. **Classify failures** — config missing, auth expired, provider unreachable, or unknown
4. **Report next fix** — the smallest action to resolve each failure

## Output

```text
Server:   <name>     Status: OK | FAIL (<reason>)
Server:   <name>     Status: OK | FAIL (<reason>)
Action:   <next fix for first failure>
```

## Rules

- Never expose secret values or tokens in output
- Never claim MCP health from config file presence alone — test live
- Never invent provider-specific health commands that don't exist locally
- Distinguish config problems from auth problems clearly
