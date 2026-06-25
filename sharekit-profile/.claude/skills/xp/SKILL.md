---
name: xp
description: "Extreme Programming for AI-human pair development. Invoke whenever: the user wants to pair with their AI, build a feature incrementally with tests, work through a refactor without breaking things, or establish clear driver/navigator roles. Also invoke when the user mentions XP, YAGNI, simple design, red-green-refactor, or 'let's do this properly' — even if they don't say 'XP' explicitly. Prefer this over ad-hoc implementation whenever the work spans more than one logical change."
metadata:
  tier: "methodology"
  owner: "lucas"
  canonical_source: "https://github.com/<github-user>/claude-code"
---

# XP — Extreme Programming with AI Agents

XP adapted for AI-human pairs: continuous code review (live pairing), relentless testing (TDD), constant design improvement (refactoring), frequent releases (small increments).

**Why the cycle works:** The failing test written *before* any production code is the invariant everything else depends on. It proves you understand the behavior before implementing it, catches AI regressions automatically, and gives the human a clear review checkpoint. Without it, you're just generating code and hoping. If this gate goes, the rest of XP goes with it.

See [philosophy.md](references/philosophy.md) for foundational values and [roles.md](references/roles.md) for driver/navigator dynamics.

## When to Invoke

- **Pair dev** — User wants structured iteration with tests + review (no big-bang implementation)
- **Incremental features** — Break work into small cycles; each cycle: plan → test → code → refactor → commit
- **Roles unclear** — Need to signal who drives (direction) vs. navigates (reviews)
- **Refactor needed** — Existing code quality degradation; XP treats refactoring as continuous, not deferrable
- **Not a fit** — Stop if: user wants a quick one-off script, task has no testable behavior, or user is not available to review at each gate

## Workflow (One Cycle)

### 1. Plan — Pick ONE Small Task

Define a single, deliverable piece of work. Confirm with human:
- **What** (acceptance criteria — expressible in one sentence)?
- **Why** (business value)?
- **How** (constraints, conventions, files to touch)?

If the task cannot be expressed as a single acceptance criterion, split it first. Don't start a cycle with a vague scope.

**Done when:** Human approves the scoped task before any code is written.

### 2. Test — Write One Failing Test

Write a test that describes behavior through public interfaces, not implementation details. Run it. Confirm red state.

If the test cannot be written — surface the blocker. Do not write production code and add tests later.

Watch for AI-specific failure: if you wrote both the test and the implementation without a red state in between, stop. You've written implementation-glued tests (see [roles.md](references/roles.md) → "Test-Deleter" and "Implementation-Glued Tests"). Discard and restart from the failing test.

See `/tdd` for full red-green-refactor discipline.

**Done when:** Test runs, fails predictably, human has reviewed and approved the test.

### 3. Implement — Minimal Code to Pass

Write the simplest code that makes the test pass. One test at a time. If multiple approaches work, pick the clearest.

Do not touch the test file during this phase. If the test seems wrong, stop and surface it to the human — do not modify the test to make it easier to pass.

**Done when:** Failing test now passes; all other tests still pass; no lint errors.

### 4. Refactor — Improve While Green

Extract duplication, clarify names, simplify structure. Never refactor while red.

**Done when:** All tests pass; code is noticeably simpler or clearer than it was at end of step 3.

### 5. Release — Commit the Increment

Small, focused commit. Then return to step 1 (next task) or hand off.

**Done when:** Commit is pushed or staged; human has reviewed the diff.

## Continuous Practices

Running throughout every cycle:

- **Read before write.** Explore project structure, conventions, and the area being changed before proposing any changes.
- **Run tests + lint after every change.** Not at the end — after every change. Discover failures immediately.
- **Communicate intent before coding.** Explain approach and tradeoffs first, not after.
- **Stay small.** If a cycle takes >30 min, stop the clock and split the task.
- **YAGNI is more important with AI than without.** AI generates complexity faster than a human can reverse. Do not add "flexibility," abstractions, or configuration that a test doesn't require. A 50-line solution that works beats a 200-line solution that's "flexible."

## AI-Specific Failure Modes

These are the failure modes unique to AI-human pairing that don't appear in traditional XP literature. See [roles.md](references/roles.md) for full anti-pattern detail.

- **Test-Deleter** — AI modifies or deletes tests to reach green instead of fixing the code. Hard rule: tests are read-only during the Implement phase.
- **Implementation-Glued Tests** — AI writes both the test and implementation without a real red state. Tests pass immediately and break on every refactor because they describe implementation, not behavior.
- **YAGNI Creep** — AI continuously suggests additions during implementation. Each suggestion is small; the cumulative effect is large scope drift. Reject all additions not required by the current test.

## Handoff Contract

After one or more completed cycles:

1. **Pairing outcome** (signal-first)
   - Verdict: features working / tests green / ready for review
   - Top 3 blockers (if any)
2. **Code state** — All diffs staged or on branch, tests passing
3. **Next task** — Pick, or hand to human for re-prioritization

After 3+ cycles: dispatch `Agent({ subagent_type: "handoff-writer" })` to checkpoint memory, ADRs, and next priorities.

## References

- [philosophy.md](references/philosophy.md) — Five XP values + their AI adaptations
- [practices.md](references/practices.md) — 12 XP practices + guidance per practice
- [roles.md](references/roles.md) — Driver/Navigator dynamics + anti-patterns (Yes Machine, Ghost Pair, Scope Creep, **Test-Deleter**, **Implementation-Glued Tests**)
- `/tdd` — Full red-green-refactor loop
- `/handoff` — Multi-session checkpointing
