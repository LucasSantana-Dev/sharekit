# Issue Template for Vertical Slices

Use this template for each approved slice when creating an issue on the tracker.

## Template

```
## Parent

[Reference to the parent issue, epic, or plan — omit if this is a standalone issue]

## What to build

[Concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation.]

[Avoid generic file paths or code snippets — they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it here and note briefly that it came from a prototype. Trim to the decision-rich parts — not a working demo, just the important bits.]

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Blocked by

- [Issue reference to the blocking ticket]

Or "None - can start immediately" if no blockers.

## Type

AFK / HITL

[Explain why HITL if applicable: "Requires UX sign-off", "Depends on arch review", etc.]
```

## Writing guidance

- **What to build**: Lead with the user-facing outcome, then implementation scope if non-obvious.
- **Acceptance criteria**: Make each criterion independently verifiable (not "looks good", but "dark mode toggle persists across page reload").
- **Blocked by**: If a slice depends on another, reference it explicitly. This is how you encode the vertical-slice dependency graph.
- **Type**: Mark HITL *only* if the slice requires a gate (decision, review, stakeholder approval). Everything else is AFK.

## Exceptions

- If the source was an existing issue (parent), always add the Parent section pointing to it.
- If the prototype is small enough to encode the decision (e.g., a type shape for a new API field), inline it under "What to build" with a note.
- If no blockers exist, say "None - can start immediately" rather than omitting the section.
