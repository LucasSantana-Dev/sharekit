---
name: brief-and-drill
description: "Brief a subagent with task context + constraints, then verify comprehension via drill before delegating real work. Use when: (1) delegating to an agent outside your context thread (independence risk), (2) the task is production-sensitive or security-critical (high-stakes), (3) complex constraints/stop-conditions that must not be missed (destructive-operation risk), or (4) previous agent runs on related work introduced scope-creep. Triggers: \"brief the agent\", \"prepare subagent\", \"verify agent understood\", \"brief-and-drill\", \"ensure agent got it\"."
metadata:
  owner: global-agents
  tier: ephemeral
  canonical_source: ~/.claude/skills/brief-and-drill
---

# Brief and Drill

Brief a subagent precisely, then drill to verify it absorbed the brief before delegating real work.

## Workflow

**1. Draft the brief** — write a focused handoff.
   - Include: Task (1-3 sentences), Context (why / which codebase), Constraints (what NOT to do, stop-conditions, quality gates), Done-When (observable output).
   - Done when: brief fits on one page; every constraint is a negation or bound, not a principle.

**2. Send the drill** — ask the agent: "Restate in your own words: (1) what you're doing and why, (2) at least two things you must NOT do, (3) what you'll do if you hit [blocker condition]. Then say how you know you're done."
   - Done when: agent responds with rephrasing (not echo), names ≥2 constraints by substance (not "stay focused"), explicitly states what to do if blocked.

**3. Evaluate the drill response** — check comprehension + constraint internalization.
   - ✓ All questions answered accurately, agent mentions ≥2 constraints without prompting → proceed to delegate real work.
   - [WARN] One question vague or constraint missed → correct the specific gap and re-drill (Attempt 2).
   - [WARN] Agent introduces scope not in brief → point out, restate the brief boundary, re-drill (Attempt 2).
   - ✗ Agent fails drill twice (Attempt 2 also misses constraints or adds scope) → escalate: pause delegation, rewrite brief for clarity, or split task (see Stop conditions).

## Brief Template

```
Task: [what to do in 1-3 sentences]
Context: [why / which repo / relevant history]
Constraints:
  - Do NOT [specific thing to avoid]
  - Stop if [blocking condition — surface the blocker, don't fallback]
  - [quality gate: test pass, linter clean, no secrets, etc.]
Done when: [concrete output — e.g., "all N tests passing", "no untracked .env files", "git status clean"]
```

## Drill Output Template — What Good Comprehension Looks Like

Agent passes if response includes:

**Question 1 (Task & why):** Agent restates the task in their own words and names ≥1 reason why it matters (e.g., "This unblocks shipping because...").

**Question 2 (Constraints):** Agent names ≥2 specific constraints WITHOUT prompting (e.g., "I won't use `git push --force`" and "I'll stop if I find uncommitted files") and explains a consequence of missing one (e.g., "if I skip the linter, the PR will fail CI").

**Question 3 (If blocked):** Agent states what they'll do if they hit the named stop-condition (e.g., "if the test suite fails, I'll surface the exact error and halt — I won't try to skip the test or modify the code to make it pass").

**Bonus (Completion):** Agent describes an observable way to verify they're done (e.g., "I'll run `git status` to confirm the repo is clean").

**Fail signal:** Agent echoes the brief verbatim, names only 1 constraint, or adds scope not in the brief.

## Stop Conditions & Escalation

**Halt delegation and escalate if:**
- Agent fails the drill twice (Attempt 2 comprehension miss) → rewrite the brief for clarity or split the task, do NOT retry drill again.
- Brief references External HD but mount-check not done → add guard: `mount | grep -q "/Volumes/External HD" || { echo "BLOCKED: External HD unmounted"; }` (see standards/knowledge-brain.md §1).
- Agent discovers a conflicting constraint during drill → surface it; resolve with the orchestrator before proceeding.

**Hard rules:**
- Never skip the drill for high-stakes tasks: production changes, security-sensitive code, destructive operations, multi-file edits on external paths (see CLAUDE.md parallel-execution + idempotency rules).
- Genuine rephrasing only: a drill response that echoes the brief verbatim ≠ comprehension. Require the agent to explain *why* and *when* the constraints apply.
- Two-strike limit: Attempt 1 + Attempt 2 are the budget. On Attempt 3, don't re-drill; either simplify the task, split it, or pause and consult the orchestrator.
