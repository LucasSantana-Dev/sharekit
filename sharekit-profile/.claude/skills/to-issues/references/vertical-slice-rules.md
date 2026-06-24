# Vertical Slice Design Rules

A tracer-bullet slice is a thin vertical slice through all integration layers.

## Principles

- **Each slice delivers a narrow but COMPLETE path** through every layer (schema, API, UI, tests)
- **A completed slice is demoable or verifiable on its own**
- **Prefer many thin slices over few thick ones**

## Anatomy

A vertical slice includes:
1. **Database schema change** (if data model needed)
2. **API endpoint or backend logic** (the core computation)
3. **UI or user-facing output** (how users interact with it)
4. **Tests** (at least happy-path)

Not all slices touch all layers — a backend-only slice skips UI; a data-schema change skips API. But each *cuts through* its relevant layers end-to-end, not just one.

## Common anti-patterns

❌ **Horizontal slices** — "Add the database schema, then API, then UI" (3 separate issues). Instead: one slice per feature that happens to touch all 3.

❌ **Task-driven slices** — "Refactor the auth module" (not a feature). Instead: "Add OAuth social login" or "Support email + password" (each is a complete feature).

❌ **Massive slices** — "Build the entire checkout flow" (not demoable halfway). Instead: "Add cart display", "Add tax calculation", "Add payment form", "Add order confirmation" (each is a mini-vertical-slice).

## AFK vs. HITL

- **AFK (Autonomous)**: Can be implemented and merged without human gate. Example: "Add dark-mode toggle" (spec is clear, no architectural decision needed).
- **HITL (Human-in-the-Loop)**: Requires decision, review, or sign-off. Example: "Redesign auth flow" (UX/security decisions needed before code).

Prefer AFK. HITL slices should be few and explicit (architectural, security, or design gates).
