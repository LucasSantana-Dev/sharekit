# Playbook Patterns

## Triggered playbook

Use when a known event starts the workflow.

- trigger,
- ordered steps,
- expected evidence,
- failure escalation,
- owner.

## Scheduled sweep

Use when the value comes from regular cadence.

- cadence,
- scope,
- skip conditions,
- reporting format,
- follow-up owner.

## Gate wrapper

Use when a broader workflow should call narrower validation skills.

- entry condition,
- delegated execution skills,
- pass or fail criteria,
- output expected before the next phase.
