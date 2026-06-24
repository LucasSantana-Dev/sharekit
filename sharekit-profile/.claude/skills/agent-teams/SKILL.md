---
name: agent-teams
description: Coordinate multiple agent sessions for parallel implementation, review,
  and synthesis. Use when the task can be safely decomposed into concurrent workstreams
  with clear handoffs and one integrator.
metadata:
  owner: global-agents
  tier: contextual
  canonical_source: ~/.agents/skills/agent-teams
---









# Agent Teams

Use this skill to plan and run multi-agent work without losing integration quality.

## Use When

- The task is large enough that parallel work will save time or add confidence.
- Independent workstreams can be defined with clear inputs, outputs, and ownership.
- One lead agent can own synthesis, integration, and final verification.

## Do Not Use When

- The task is small, tightly coupled, or faster to complete in one session.
- Multiple agents would fight over the same files or the same mutable context.
- The user wants one narrow implementation rather than orchestration.

## Inputs / Prereqs

- The goal, success criteria, and integration owner.
- Candidate workstreams and the dependencies between them.
- The quality gates or review checkpoints that must run after synthesis.
- `references/team-topologies.md`, `references/coordination-patterns.md`, or `references/example-team-boards.md` only when needed.

## Workflow

1. Decide whether parallelism buys time, confidence, or separation of concerns.
2. Split the work into independent tracks with an owner, expected output, and handoff condition.
3. Pick a lead agent to maintain the task board, resolve blockers, and synthesize results.
4. Give each agent a bounded prompt with files, constraints, and stop conditions.
5. Run sync points only at dependency boundaries, not continuously.
6. Recombine the work, rerun the required validation, and report the integrated outcome.

## Outputs / Evidence

- A team plan with workstreams, owners, handoffs, and the integration lead.
- The sync or escalation points that matter for this task.
- Final synthesis evidence showing how the parallel outputs were validated together.

## Failure / Stop Conditions

- Stop if the task cannot be decomposed without heavy coordination overhead.
- Stop if no agent can own final integration and verification.
- Do not use parallel agents as a substitute for a missing implementation plan.

## Load These Resources

- `references/team-topologies.md`
- `references/coordination-patterns.md`
- `references/example-team-boards.md`

## Memory Hooks

- Read memory only when existing team conventions or repo workflows affect decomposition.
- Write memory only if the session establishes a durable orchestration pattern worth reusing.
