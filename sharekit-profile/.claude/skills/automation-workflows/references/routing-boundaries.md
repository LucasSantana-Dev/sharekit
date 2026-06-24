# Routing Boundaries

Use this reference to keep automation design separate from execution skills.

## Route to narrower skills when

- `quality-gates` should run the actual repo validation,
- `quality-assurance` should drive broader QA analysis,
- deployment skills should perform a real deploy,
- testing skills should execute framework-specific verification.

## Keep this skill responsible for

- deciding whether automation is warranted,
- composing the recurring workflow,
- defining evidence and escalation,
- documenting boundaries between the automation and the execution skills.
