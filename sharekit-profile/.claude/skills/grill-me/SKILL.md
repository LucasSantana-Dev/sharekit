---
name: grill-me
description: |
  Interview the user about a plan, design, or decision until shared understanding. 
  Use when: user says "grill me" or "interview me" / design has unresolved trade-offs / before a non-trivial commit you want explicit articulation of constraints.
  Trigger branches: stress-test a plan, surface hidden assumptions, resolve ambiguity before build.
triggers:
  - grill me
  - interview me
  - stress-test plan
  - surface hidden assumptions
  - resolve ambiguity before build
metadata:
  owner: default
  tier: sonnet
  canonical_source: session 2026-06-22, /research-and-decide Phase 2 (decision-critic contract)
---

**When to use vs siblings:** `/grill-me` = open-ended interview (no domain docs consulted); `/grill-with-docs` = interview against CONTEXT.md + ADRs (domain-governed); `/grill-with-options` = bounded AskUserQuestion forks (fast trade-off resolution).

# Grill Me

Interview the user one question at a time until shared understanding converges — defined as **being able to predict their reaction to the next three questions you would ask**. If you can predict, you're done. If you can't, ask the next question.

This is a checkable test, not a vibe.

## When to Use

- User says "grill me" or "interview me"
- User wants to stress-test a plan, design, or spec before build
- Design or plan has unresolved trade-offs the user hasn't named
- Before committing to a non-trivial implementation, you want explicit articulation of constraints

## When NOT to Use

- Non-interactive contexts (CI, `/loop`, autonomous loops) — flag the underspecified ask as a blocker instead of guessing
- Unambiguous self-contained asks
- User has explicitly prioritized speed over alignment
- ≥95% confidence already exists (don't manufacture doubt)
- Pure information questions ("what does X mean?")
- Mechanical operations (renames, formats, moves)
- Questions the codebase can answer — **explore the codebase first** (see Codebase-First section)

## Format

Every question uses this shape:

- **Q:** one focused question
- **GUESS:** your hypothesis for the answer + the reasoning behind it

Then wait for the user's reaction before asking the next question.

**Why one at a time:** users can't react to hypotheses buried in a list. Batches encourage skim-reading and lock in the wrong framing for later questions, since later questions depend on earlier answers.

**Why a guess:** users react faster to a wrong guess than they generate answers from scratch. A guess commits you to a falsifiable position and surfaces hidden assumptions. Be visibly willing to be wrong — occasionally guess against expectations to defeat polite-agreement bias.

## Codebase-First: Tool Routing

If a question can be answered by the codebase, explore before asking the user. Route based on question type:

- **Exact symbol / definition lookup** → `mcp__serena__find_symbol(name="<symbol>")` or `mcp__serena__find_referencing_symbols(name="<symbol>")`
- **Keyword / pattern search** → `grep -r "<pattern>" <path>` (Bash tool, fast)
- **Cross-project decisions / past grilling outcomes** → `search_knowledge(query="<question>", top=5)` if vault is mounted; otherwise `rag_query(query="<question>", top=5, scope_types=["memory","handoffs"])`
- **Codebase relationships** → graphify if `graphify-out/graph.json` exists (run `graphify query "<q>" --budget 500`)

Mount guard (before RAG/vault queries):
```bash
mount | grep -q "/Volumes/External HD" || { echo "BLOCKED: External HD unmounted — RAG/vault unreachable"; }
```

**Don't ask the user what the codebase can answer.** If the answer exists in code, commit history, or prior decisions, find it first.

## Stop Conditions

### Primary stop (success) — shared understanding reached

The 95% predictive test passes: you can confidently predict the user's reaction to the next 3 questions **and** have enough detail to move forward without guessing.

**Output contract** — restate in this shape to confirm convergence:

- **Outcome:** what success looks like (1-2 sentences)
- **User:** who this serves / what problem it solves
- **Why now:** what changed to make this the right time
- **Success criteria:** how we measure it worked (testable, not "feels good")
- **Constraint:** what must hold (e.g., no downtime, <2 week turnaround)
- **Out of scope:** what we explicitly are NOT building (hard boundary)

**Checkable completion:** you've restated AND received explicit "yes, that's right" (or explicit refinement, which restarts the loop). "Sounds good" or silence alone is NOT a "yes" — see Non-yes Answers below.

### Non-yes answers that do NOT count as convergence

- **"Whatever you think is best."** → delegation, not shared understanding. Re-ask with two concrete framed options and their trade-offs.
- **"Sounds good."** → ambiguous assent. Follow up: "Anything you'd refine before we commit?"
- **"Sure, let's go."** → often polite exit, not conviction. Confirm: "If I had to predict, I'd guess you're concerned about [X]. Right?"
- **Silence then "okay let's start."** → user gave up, not converged. Pause: "I notice we skipped past something. What's the gap?"

Restart the loop with a fresh question if user doesn't give explicit refinement or "yes."

### Floor stop (failure to converge) — escalate

After ≥4 rounds without rising confidence → something foundational is missing (e.g., user doesn't own the decision, hidden stakeholder, mismatched urgency).

Pause and surface explicitly:

> "I've asked ~[N] questions and I still can't predict your reactions. The gap isn't in detail—it's something more foundational. Options: (1) step back and re-scope, (2) you decide and we'll refine after launch, or (3) loop in [stakeholder]. Which?"

Don't grind on. Escalation is a valid outcome.
