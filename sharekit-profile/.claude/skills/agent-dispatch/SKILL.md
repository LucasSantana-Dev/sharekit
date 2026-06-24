---
name: agent-dispatch
description: |
  Dispatch ad-hoc tasks to remote agent-box (agent-box scripts or free-form claude prompts).
  Maps named aliases (ci-watch, health, security, etc.) to shell scripts on homelab; routes
  free-form prompts to agent-box via SSH. Use when (1) running a named agent-box task script (health check, CI watch),
  (2) running a one-time claude prompt on agent-box (remote investigation), (3) accessing homelab-only state.
metadata:
  owner: agent-box-bridge
  tier: integration
triggers:
  - agent dispatch
  - run agent task
  - ci-watch
  - health check
  - homelab script
  - remote claude

---

# agent-dispatch

Invoke any agent-box task script from this Mac session, or run an ad-hoc claude prompt on agent-box.

## Usage

```
/agent-dispatch <task>
/agent-dispatch lucky-health
/agent-dispatch "check if Lucky CI is green right now"
```

## Named tasks

| Alias         | Script                       |
|---------------|------------------------------|
| ci-watch      | ci-watch.sh                  |
| pr-triage     | pr-triage.sh                 |
| release-check | lucky-release-check.sh       |
| dependabot    | dependabot-report.sh         |
| health        | lucky-health.sh              |
| drift         | homelab-drift.sh             |
| security      | security-hygiene.sh          |
| sync          | workspace-sync.sh            |
| self-update   | agent-self-update.sh         |
| weekly        | weekly-health-score.sh       |

## Steps

1. If `<task>` matches a named alias above, run the mapped script directly on homelab:
   ```bash
   ssh homelab "${HOMELAB_ROOT}/scripts/agent-tasks/<script>"
   ```

2. If `<task>` is a free-form prompt, dispatch to agent-box via claude -p:
   ```bash
   ssh agent-box "
     source /etc/profile.d/agent-env.sh
     unset ANTHROPIC_API_KEY CLAUDE_API_KEY
     claude -p '<task>' --dangerously-skip-permissions --allowedTools 'Bash,Read' 2>&1
   "
   ```

3. Stream output to terminal in real time. On completion summarize what was found.

## Notes
- Always unset ANTHROPIC_API_KEY and CLAUDE_API_KEY inside the agent-box SSH session.
- Task scripts source agent-env.sh themselves; no need to pass secrets.
- For free-form prompts, add context about which repo to operate in if not obvious.
