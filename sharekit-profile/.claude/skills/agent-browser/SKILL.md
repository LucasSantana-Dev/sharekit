---
name: agent-browser
description: Run ref-based browser automation with `agent-browser` for quick navigation,
  form interaction, screenshots, and scripted web flows. Use when the task is quick
  scripted interaction rather than profile-heavy browsing or Playwright verification.
  Route profile-heavy or cloud browser-use tasks to `browser-use` and app verification
  to `webapp-testing`.
allowed-tools: Bash(npx agent-browser:*), Bash(agent-browser:*)
metadata:
  owner: global-agents
  tier: contextual
  canonical_source: ~/.agents/skills/agent-browser
  progressive_disclosure: split
---









# Browser Automation with agent-browser

## Use When

- The task needs quick browser interaction using `@e*` element refs.
- The flow is local, scripted, and easier to express as open, snapshot, interact, and verify steps.
- You need repeatable browser automation without Playwright test harness setup.

## Do Not Use When

- Use `browser-use` when the task depends on browser-use sessions, local Chrome profiles, or remote cloud-task workflows.
- Use `webapp-testing` when the task is browser-level verification of a local app with Playwright scripts, route assertions, or console and page-error capture.

## Inputs / Prereqs

- Confirm `agent-browser` is installed and reachable.
- Know the target URL and whether a persistent saved state is needed.
- Decide whether you need one interactive loop or a longer stateful session.

## Workflow

1. Open the target page.
2. Snapshot with `-i` and collect fresh refs.
3. Interact with the refs, then wait for the next stable state.
4. Re-snapshot after DOM changes.
5. Capture screenshots, diffs, or extracted text as evidence.

## Outputs / Evidence

- Commands run and the evidence captured.
- Saved state, session, or selector assumptions that matter for reproducibility.
- Any blocker that prevented navigation, interaction, or verification.

## Failure / Stop Conditions

- Stop if the CLI is unavailable or the page cannot be reached.
- Stop if the task clearly requires `browser-use` profile workflows or `webapp-testing` Playwright coverage instead.
- Stop if the workflow would claim UI success without refreshed refs or evidence after DOM changes.

## Load These Resources

- `snapshot`, `fill`, `click`, `wait`, `screenshot`, `diff`, and state-persistence command help as needed.

## Memory Hooks

- Read memory when auth state or product-specific flows are known to be fragile.
- Write memory only if this work establishes a durable browser automation convention.
