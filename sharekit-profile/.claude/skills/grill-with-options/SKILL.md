---
name: grill-with-options
description: Structured decision interview using 2–4 bounded options per fork (AskUserQuestion). Use when the user says "help me decide", "grill me with options", "pick-path", or to stress-test a plan with explicit trade-offs fast. Stop at 95% predictive convergence.
---

**When to use vs siblings:** `/grill-with-options` = bounded AskUserQuestion forks (fast trade-off resolution when alternatives are known); `/grill-me` = open-ended interview (no pre-bound options); `/grill-with-docs` = interview against CONTEXT.md + ADRs (domain-governed term alignment).

# Grill With Options

Interview the user through a plan or design by surfacing decision forks as bounded multiple-choice questions. Present 2–4 concrete options per fork using the `AskUserQuestion` tool. Stop when you can predict the user's selection for the next three questions you would ask — that's convergence, not a vibe.

## When to Use

- A plan has forking decisions where the alternatives are knowable in advance
- The user says "help me decide", "grill me with options", "pick-path", or "walk me through the trade-offs"
- Bounded choices will resolve ambiguity faster than open text (architecture decisions, UX flows, deployment strategies, API contract choices)
- You want to stress-test a plan without burdening the user with blank-slate thinking

## When NOT to Use

- Non-interactive contexts (CI, `/loop`, autonomous runs) — see Failure Conditions instead
- Decisions where the user genuinely has free-form input that can't be bounded (naming things, writing copy)
- ≥95% confidence already exists — don't manufacture doubt
- Questions the codebase answers (`standards/workflow.md` — explore first, ask second)
- Mechanical operations with no real trade-off

## How to Run a Session

### 1. Map the decision tree first (silently)

Before asking anything, identify the top-level forks in the plan. A fork is a decision point where choosing one path forecloses others. Don't ask about leaf-level details until the trunk decisions are settled — later choices depend on earlier ones.

Explore the codebase if one exists. Don't ask what `git log`, `grep`, or a config file can answer.

**Done when:** You have identified ≥2 top-level forks and mapped their dependencies (which later decisions depend on which earlier choices).

### 2. Ask one fork at a time

Use `AskUserQuestion` for each fork. Present the decision as one question with 2–4 options. Then wait for the answer before moving to the next question.

**Why one at a time:** later questions depend on earlier answers. Batching locks in the wrong framing for downstream questions and prevents you from pruning branches the user just closed.

**Done when:** User has selected one option and you have mapped the next fork(s) that decision unlocks.

### 3. Design each question well

**Header (≤12 chars — hard UI limit):** The `AskUserQuestion` header renders as a small chip/tag in the interface; anything over 12 characters is clipped by the UI. **Before finalizing any header, count its characters.** If the count is ≥ 11, find a shorter synonym before writing it. `Orchestration` = 13 → `Delivery` (8). `Observability` = 13 → `Monitoring` (10). Examples that fit: `Storage` (7), `Auth` (4), `Deployment` (10), `API style` (9).

**Single-select** when options are mutually exclusive — picking one forecloses the others.

**Multi-select** when the user can pick several that apply — acceptable failure modes, desired features, constraints to honor.

**Option labels:** 1–5 words, the choice itself.

**Option descriptions:** explain the *consequence* of this choice, not a definition of it. "You'll own schema migrations; harder to change later" beats "A relational database." Surface the trade-off.

**Option previews** (optional): use for visual comparisons — ASCII architecture diagrams, contrasting code snippets, config examples. Only when seeing it side-by-side genuinely helps the decision; skip for preference questions where labels + descriptions suffice.

**Recommended option:** if one is clearly better given what you know, make it first and label it "(Recommended)".

**Done when:** Question is phrased, ≥2 options drafted with consequence-based descriptions, and UI constraints verified (header ≤12 chars, single/multi-select chosen).

### 4. Adapt the tree as selections arrive

Prune branches the selection forecloses. Promote questions whose context is now settled. Don't ask about a consequence you can infer from a prior answer.

### 5. Non-answer handling

Some selections don't count as convergence:

- User picks "Other" and types something vague → reframe with two concrete options derived from what they wrote
- User picks every option in a single-select → they're uncertain; split into two forks
- Selections plateau (you're looping the same fork) → something foundational is missing; see Floor Stop below

**Done when:** User's selection is unambiguous and you have adapted the remaining tree or identified the next fork to ask.

## Stop Conditions

### Primary stop (success)

The 95% predictive test: you can confidently predict which option the user would pick for the next three questions you'd ask. When that's true, **restate** the decisions made:

- **Outcome:** what success looks like
- **Key decisions:** list each fork resolved and what it forecloses
- **Constraint:** what must hold
- **Out of scope:** what you're explicitly not building

Get an explicit "yes" before moving on.

**Done when:** User confirms the restatement, the decision tree is fully resolved, or they indicate ready to proceed.

### Floor stop (failure to converge)

Several rounds without the decision tree narrowing → something foundational is missing. Pause:

> "I've asked N questions and the choices keep reopening. Something foundational is underspecified. Want to step back and define it?"

Don't grind on the same forks.

**Done when:** User either steps back to define foundation or confirms they want to proceed with ambiguity.

## Failure Conditions (Block and Surface)

Halt and surface the blocker if any of these occur:

- **Non-interactive context** (CI, `/loop`, autonomous agent run) — user cannot respond in real time. Surface: "This skill requires interactive user input (AskUserQuestion); not available in this context."
- **User declines to answer** (picks "Other", gives vague input, or refuses all options repeatedly) — divergence, not convergence. Surface: "Your responses suggest bounded options aren't framing this correctly. Want to restart with open-ended exploration instead?"
- **No clear forks exist** (the plan has no real trade-offs, or codebase already answers the decisions) — this skill is the wrong tool. Surface: "This doesn't appear to have decision forks; suggest [grep/ADR review/code read] instead."
- **external drive unmounted** (if skill later links to RAG/vault) — knowledge lookup fails silently. Check: `mount | grep -q "${EXTERNAL_HD}"` before any rag_query/search_knowledge. Surface: "external drive unmounted — knowledge lookup blocked; cannot proceed."

Do not silently fall back; halt and tell the user which condition blocks progress.

```
AskUserQuestion({
  questions: [{
    question: "Where should user sessions be stored?",
    header: "Sessions",
    multiSelect: false,
    options: [
      {
        label: "Database (Recommended)",
        description: "Survives restarts, works across replicas. You'll need a sessions table and cleanup job."
      },
      {
        label: "Redis",
        description: "Faster reads, lower DB load. Adds an infrastructure dependency and a failure mode."
      },
      {
        label: "JWT (stateless)",
        description: "No server-side state. Revocation is hard — a leaked token stays valid until expiry."
      }
    ]
  }]
})
```

For visual comparisons, add a `preview` field with an ASCII diagram or code snippet so the user can see the difference rather than read about it.

## Convergence Check (internal, every turn)

After each answer, ask yourself: *If I were to ask the next three questions, could I predict the answers?* If yes, restate and stop. If no, ask the next fork.

This is a checkable test, not a feeling.

---

## References

- `standards/skill-quality-spec.md` — 13-point checklist (this skill compliance).
- `standards/workflow.md` — explore-first discipline; when to defer user input.
- CLAUDE.md — signal-first output rule (verdict + top 3 findings inline).
