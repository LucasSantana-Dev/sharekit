# Coordination Patterns

## Handoff contract

Each agent should return:

- what they changed or concluded,
- what remains unresolved,
- what another agent must verify next,
- what evidence supports the result.

## Sync cadence

- Sync only at dependency boundaries.
- Use one shared task board owned by the lead agent.
- Escalate blockers to the lead instead of letting agents negotiate indefinitely.

## Integration rules

- The lead agent owns conflict resolution.
- The lead agent reruns the required validation after synthesis.
- No result is final until the integrated outcome is checked as one system.
