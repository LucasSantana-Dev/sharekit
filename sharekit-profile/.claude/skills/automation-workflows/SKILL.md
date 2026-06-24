---
name: automation-workflows
description: Design reusable automation for repetitive development loops. Use when
  the user wants to standardize or automate recurring review, testing, documentation,
  deployment, or maintenance work rather than execute one check immediately.
metadata:
  owner: global-agents
  tier: stateful
---









# Automation Workflows

Use this skill to design or consolidate recurring development automation.

## Use When

- A manual workflow repeats often enough to justify automation.
- The user wants a reusable trigger, playbook, or guardrail for recurring engineering work.
- Multiple execution skills need one higher-level automation design around them.

## Do Not Use When

- The task is to run one concrete verification step right now. Use the specific execution skill.
- The task is already covered by a narrow skill such as `quality-gates`, deployment, or testing.
- The automation would be speculative instead of grounded in an actual recurring workflow.

## Inputs / Prereqs

- The recurring workflow, trigger, and success criteria.
- Existing skills or commands that should remain the execution primitives.
- The acceptable failure behavior and escalation path.
- `references/automation-catalog.md`, `references/playbook-patterns.md`, and `references/routing-boundaries.md` when needed.

## Workflow

1. Identify the recurring task, trigger, and business value of automation.
2. Decide which parts should stay manual and which can be standardized safely.
3. Reuse existing execution skills for checks, deploys, tests, or review steps instead of duplicating them here.
4. Define the automation contract: trigger, steps, evidence, failure path, and owner.
5. Capture the workflow as a reusable playbook and report the boundaries to the narrower skills it depends on.

## Outputs / Evidence

- A reusable automation design with trigger, steps, evidence, and failure path.
- The execution skills or commands the automation should call.
- The reasons automation is justified for this workflow.

## Failure / Stop Conditions

- Stop if the workflow is too one-off to justify automation.
- Stop if the design duplicates a narrower execution skill instead of composing it.
- Do not propose self-modifying or opaque automation without clear evidence and rollback behavior.

## Load These Resources

- `references/automation-catalog.md`
- `references/playbook-patterns.md`
- `references/routing-boundaries.md`

## Memory Hooks

- Read memory when existing repo workflows or recurring operational patterns affect the design.
- Write memory only if the automation contract becomes a durable workspace convention.
