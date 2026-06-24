---
name: parallel-investigate
description: Fan out N independent investigations as parallel agents in a single tool-use block, then roll up the results. Use whenever the same question must be answered against multiple repos, PRs, or services.
triggers:
  - check all open prs
  - investigate across repos
  - parallel investigate
  - audit each
  - status of every
---

# parallel-investigate

Default mode when the same diagnostic question applies to ≥3 independent targets.

## When to use

- "Check status of all open PRs" → 1 agent per repo
- "Which of these N services is failing?" → 1 agent per service
- "Audit X across the workspace" → 1 agent per dir
- Any question of shape "for each Y, tell me Z"

## When NOT to use

- Targets share state (e.g. monorepo packages with cross-deps) — sequential investigation finds cascades
- N < 3 — overhead of agent spawning exceeds the wall-clock saving
- The investigation needs human-in-the-loop decision between steps — sequential

## Recipe

1. Identify the targets list (PRs, repos, services).
2. In a SINGLE message, fire one `Agent` call per target, all in the same tool-use block. Use the `explore` agent for read-only investigations.
3. Each agent gets a tight prompt: "Report X about target Y. Return: <fixed schema>."
4. Roll up results into a single table.

## Example prompt for each agent

```
Target: <repo or PR identifier>
Task: <one specific question>
Return format:
  - State: <enum>
  - Top finding: <one line>
  - Smallest next step: <one line>
Time budget: 2 minutes. Bail if you can't answer in that.
```

## Output

Single table or bulleted list per target. Then one summary line: "N/M green, K need action, J blocked."

## Stop conditions

- One agent returning takes >5 min while others returned → cut it, surface partial table
- Parallel fan-out exceeds 8 agents → batch into 8-at-a-time waves

## Anti-pattern

Sequential `gh pr view PR1 && gh pr view PR2 && gh pr view PR3 ...` — this is the workflow this skill replaces.
