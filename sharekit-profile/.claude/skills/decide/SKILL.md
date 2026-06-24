---
name: decide
description: 'Composite skill — two-phase decision pipeline with mode routing and decision brief checkpoint. Quick Mode: inline verdict for low-stakes choices (no ADR). Full Mode: chains research-and-decide → decision brief → adr-write for MED/HIGH stake architectural decisions. Stops after Phase 1 if research is inconclusive. Use when making an architectural or tooling decision that needs both a recommendation and a durable record. Triggers: pick between X and Y and record, research and decide before building, choose a tool/pattern and document it, evaluate options with critic challenge, decide between libraries/frameworks.'
user-invocable: true
auto-invoke: 'architectural-decisions-needing-documentation'
metadata:
  owner: global-agents
  tier: contextual
---

# Decide

Research options → reach a recommendation → document it as an ADR.

A workflow that scales to the stakes: low-stakes questions get a quick inline verdict, significant architectural choices get full research + critic + documented ADR. This ensures every decision is handled proportionally — not every choice needs a 30-minute process, but big decisions need a defensible paper trail.

## Mode routing (first step — always)

Before doing anything else, calibrate the stake level and route accordingly:

**Quick Decision Mode** — use when ALL of these are true:
- Choice is reversible within a sprint (swapping a utility function, picking a small helper library, implementation style)
- Only 2 clear options, no significant architectural coupling
- Decision affects a single component or file, not a cross-cutting concern
- No team alignment required, no durable record needed

→ Deliver an inline verdict in under 200 words: state the recommendation, the 1-2 key tradeoffs, and done. No ADR. No research-and-decide. No phases.

**Full Decision Mode** — use when ANY of these is true:
- Hard to reverse in <1 sprint (ORM choice, deploy target, caching strategy, framework)
- Affects ≥2 services/modules or sets a cross-team pattern
- User explicitly asked to "document", "record", or "write an ADR"
- Stake level is MED or HIGH (see calibration below)

→ Proceed through all phases below.

## Stake calibration (Full Mode only)

| Level | Research effort | Alternatives required |
|-------|----------------|----------------------|
| HIGH  | ≥3 alternatives, brainstorm + adr-research | ≥3 (brainstorm extra if needed) |
| MED   | ≥2 alternatives, surface tradeoffs | ≥2 |
| LOW   | Quick inline verdict (Quick Mode) | — |

HIGH indicators: cross-service coupling, team-wide pattern, security/compliance surface, hard lock-in, significant cost implications.

MED indicators: affects a single service, moderate reversibility cost, team will use this daily.

## Phase 0 — Guards (Full Mode only)

Before invoking research:

1. **Mount guard**: `mount | grep -q "${EXTERNAL_HD}"` — if unmounted, state plainly and continue without RAG; RAG pre-check is optional, not blocking.

2. **Duplicate ADR check**: search conventional ADR directories (`docs/adr/`, `docs/decisions/`, `adr/`) for an ADR covering the same decision question. If found → emit path in reconciliation, mark "already documented", stop. Do NOT create a duplicate.

## Phase 1 — Research and Recommend (Full Mode only)

Invoke `research-and-decide` on the decision question.

This skill chains internally: RAG pre-check (have we decided this before?) → research candidates → critic challenge → adoption plan → ADR template prep. See `research-and-decide/SKILL.md` for full orchestration.

**Evidence minimum**: research must surface ≥2 options with explicit tradeoffs before proceeding. If fewer than 2 alternatives are found → push back: "If there's no alternative, this isn't a decision worth recording — provide at least one competing option."

**Confidence gate**: after research completes, assess confidence:

- **HIGH**: ≥2 alternatives with tradeoffs, critic done, unverified claims listed, one option is clearly superior on the decision criteria → proceed to Phase 1.5
- **MED**: recommendation exists but 1-2 claims are unverified or the margin is narrow → proceed to Phase 1.5 with caveat flagged
- **LOW**: no clear winner, critic flipped the leading option, or research returned "requires more constraints" → emit "Phase 1 inconclusive: [reason]. Provide additional constraints before proceeding." Halt; do NOT write ADR.

## Phase 1.5 — Decision Brief checkpoint

Before writing the ADR, emit this structured brief and pause for review (10 seconds without objection = proceed):

```
DECISION BRIEF — <decision question>
──────────────────────────────────────
Recommendation: <chosen option>
Confidence:     HIGH | MED — <why>
Stake level:    HIGH | MED
Evidence (top 3):
  1. <finding with source>
  2. <finding with source>
  3. <finding with source>
Alternatives considered:
  • <option A> — <tradeoff vs recommendation>
  • <option B> — <tradeoff vs recommendation>
Key unknowns:       <what would change this recommendation>
Switch triggers:    <specific concrete condition — not "when requirements change">
Unverified claims:  <from decision-critic's claims-to-verify list, or "none">
──────────────────────────────────────
Proceed to write ADR? (10s without objection = yes)
```

**Switch trigger quality gate**: triggers must be specific and observable. Examples:
- GOOD: "When date-fns releases v4 with native timezone support" / "When bundle size exceeds 500KB" / "When we need pub/sub (Redis) not just cache"
- BAD: "When requirements change" / "When the team grows" / "If performance becomes an issue"

If no specific trigger can be identified, write: "No anticipated trigger — revisit if [specific observable condition]."

## Phase 2 — Document the Decision (Full Mode only, after brief approval)

Invoke `adr-write` using Phase 1's output and the decision brief.

Pass to adr-write: decision title, context (the question + why it matters), chosen option + rationale, consequences, alternatives considered, and the switch triggers from the brief.

**ADR quality gate** before writing: the ADR must include:
- ≥2 alternatives with their tradeoffs
- ≥1 specific switch trigger (not vague)
If either is missing, loop back to Phase 1 to gather what's needed.

See `adr-write/SKILL.md` §3–5 for template, directory search, ADR numbering, and supersession handling.

**Done when:** ADR is staged (not auto-committed), and reconciliation block is emitted.

## Phase 3 — Memory capture (Full Mode only)

After ADR is staged, call `save_memory()` to record the decision for future recall:

```
save_memory({
  type: "project",
  name: "<decision-slug>",
  summary: "<chosen option> chosen for <decision question> — ADR at <path>",
  switch_trigger: "<the specific switch trigger from brief>"
})
```

## Reconciliation

Always output this block, even on stop/failure:

```
DECIDE — <decision question>
  Mode:            Quick | Full
  Stake:           HIGH | MED | LOW
  Confidence:      HIGH | MED | LOW — <reason>
  Phase 0 Guards:  passed | blocked (<reason>)
  Phase 1 Research: <recommendation X | inconclusive (stopped)>
                    Reason: <constraint needed | critic flipped | no alternatives>
  Brief:           emitted | skipped (quick mode) | user objected (<what changed>)
  Phase 2 ADR:     <docs/adr/NNNN-slug.md | skipped (inconclusive) | already exists at <path>>
  Memory:          saved | skipped (quick mode)

Decision: <one-line summary | "pending human input">
ADR path: <path | "N/A">
Next: <what to do next>
```

## Failure / Stop Conditions

**Phase 0 stop:**
- Duplicate ADR found → surface path, do not create duplicate, mark reconciliation "already documented"

**Phase 1 stop (LOW confidence):**
- Research returns no clear winner → emit "Phase 1 inconclusive", halt, await human input
- Critic flips leading option and no decision emerges → halt with reason
- Fewer than 2 alternatives surfaced → push back, halt

**Phase 1.5 stop:**
- User objects to Decision Brief → revise, do not proceed to Phase 2 without approval

**Never:**
- Write an ADR that just says "we haven't decided yet"
- Auto-commit ADR; stage it and await user confirmation
- Proceed past Phase 1 without a clear recommendation
- Accept "when requirements change" as a switch trigger — always push for specificity
