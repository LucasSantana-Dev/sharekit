---
name: research-and-decide
description: Composite skill — evaluate library/pattern/architecture choices by chaining research → critic challenge → adoption plan → ADR record → vault index. Use when comparing options, assessing vendor fit, or designing specs; forces research-to-ADR pairing that usually slips.
user-invocable: true
auto-invoke: choice-questions + library-evaluations
metadata:
  owner: global-agents
  tier: contextual
---

# Research and Decide

Evaluate library/pattern/architecture choices end-to-end: research candidates, challenge the leading option, plan rollout, record in ADR, index for future discovery. Ensures decisions are captured and revisitable.

## Auto-invocation triggers

- User asks "should we use X or Y", "is X worth adopting", "what's the right pattern for"
- Comparing libraries, frameworks, services, or architecture options
- Evaluating a vendor / API / SaaS adoption
- Spec-driven design questions before implementation

## Workflow

## Preamble — RAG pre-flight

Before starting research, query prior decisions on this exact question:

```bash
graphify query "<decision-question>" --budget 300
```

- If result shows an ADR or prior research for the same question within 30 days → surface it, ask user to confirm whether to reuse or start fresh.
- If no recent match → proceed directly to Phase 1.

Done when: either cached decision surfaced, or no match found (proceed).

---

### Phase 1 — Research (always)

**1a. Pre-check: Have we decided this before?**
Before researching, query the knowledge vault for prior decisions:
```bash
search_knowledge(query="<your question>", top=5)
```
If a prior ADR answers the question with high confidence → surface it ("we already decided this in ADR-NNNN; re-open only if <specific condition> changed") and STOP. Skip to Phase 4 (record the decision to keep the prior choice active).

**Mount guard** (`standards/knowledge-brain.md` §1 — fail loud, never silent): before the pre-check, run `mount | grep -q "${EXTERNAL_HD}"`. If unmounted, do NOT silently skip — state plainly: "[WARN] external drive unmounted — prior-decision RAG pre-check skipped; a duplicate ADR may already exist." Then continue to 1b (offline research is fine; the pre-check is an optimization, not a gate).

**1b. Explore candidates**
- Open-ended exploration: invoke `brainstorming` to surface options and constraints
- Specific tech evaluation: invoke `adt-research` for web + docs + repo evidence
- Output: 5-10 candidates with one-line tradeoff per candidate

**Done when Phase 1:** summary includes ≥3 candidates ranked by fit, tradeoff per candidate documented (not just listed), top 2 ready for Phase 2 critique.

### Phase 2 — Challenge (always — this is what makes the decision durable)
Invoke the **`decision-critic`** agent (Opus, artifact-only) on the leading 1-2 options.

**Use `decision-critic`, NOT `critic`, for this phase.** `decision-critic` has NO
evidence-gathering tools by construction, so it reasons only on the artifact and
*cannot* run an eval / read a log and assert a fabricated fact as a finding (this
happened: a tool-equipped `critic` ran an eval, misread the log, and inverted a
verdict on a false "zero gain" claim). `critic` remains the right reviewer for
CODE/plan reviews that must verify the codebase — but a decision review must not.

Apply the `decision-discipline.md` standard's 5-step scaffold
(CLAIM → EXTRACT → DOUBT → RECONCILE → STOP) on the leading artifact —
`decision-critic` invocations pass ARTIFACT + CONTRACT only, never the CLAIM
or your reasoning (that biases the reviewer toward agreement).

Review dimensions: cost over 12 months, migration friction, lock-in risk, failure modes specific to your stack, revisit triggers (what changes the answer).

**Reconcile, don't rubber-stamp the verdict.** `decision-critic` surfaces a
**Claims To Verify** list — facts the decision rests on that it could not check.
The orchestrator MUST verify those (it has the tools) before acting on the verdict;
treat the critic's reasoning as load-bearing, its unverifiable factual assertions as
hypotheses. A verdict built on an unverified claim is not yet actionable.

**Done when:** critic produces final verdict + claims-to-verify list, and you have re-checked each claim against your tools/logs.

If `decision-critic` flips the leading option → loop back to Phase 1 with the new
dimension to evaluate.

### Phase 2b — Critic gate (after recommendation is formed)

If Phase 2 recommendation was consensus/unopposed (critic found no material gaps), dispatch ONE read-only `Explore` agentType to challenge it:

> "Challenge this recommendation: What evidence was NOT considered? What alternative was dismissed too quickly? What assumption, if wrong, would reverse this recommendation?"

- If challenger surfaces a material gap → revise recommendation, resurface to `decision-critic`, loop back to Phase 2.
- If challenger finds only minor issues → log them in the ADR's "Risks" or "Alternatives" section, proceed to Phase 3.
- If challenger confirms no gaps → proceed to Phase 3 with confidence.

**Why:** Single-pass reviews miss blind spots. A second hostile reading catches over-optimistic assumptions before they become technical debt.

Done when: challenger verdict logged; material gaps resolved or none found.

### Phase 3 — Plan adoption (only if a decision is made)
Invoke `plan` to sequence pilot scope, success criteria, rollback path, and full-rollout steps.

**Done when:** plan artifact includes pilot scope (1 module/feature), success criteria, rollback plan, and full-rollout sequencing.

Skip Phase 3 if the decision is "no change" or "defer".

### Phase 4 — Record (always — even no-decision is a decision)
Invoke `adr-write` with the full template: context, decision (or "deferred" + trigger), alternatives + rejection reasons, consequences (positive/negative/neutral), revisit when.

**Done when:** ADR file created with all sections filled, including a specific revisit-when condition (refuse to record without one).

### Phase 5 — Capture for future search
Invoke `knowledge-loop` to ensure the ADR is indexed and surfaceable from RAG.

**Done when:** RAG indexing confirmed (rag chunks added) and ADR is queryable via `search_knowledge`.

## Reconciliation

```
RESEARCH AND DECIDE — <question>
  Phase 1 Research:      N candidates explored, top 2: <X> vs <Y> [OK] DONE
  Phase 2 Critique:      <flipped winner Y/N>, key risks identified [OK] DONE
  Phase 3 Plan:          <pilot path / deferred / no-change> [OK] DONE
  Phase 4 ADR:           ADR-NNNN <title> [OK] DONE
  Phase 5 Indexed:       RAG chunks added [OK] DONE
  Snapshot:              (none — decision is recorded in ADR)
  Open watch:            (none) | <e.g. "pilot <option> in <scope>, revisit when <trigger>">
```

## Outputs / Evidence

- Research summary (Phase 1)
- Critic assessment (Phase 2)
- Adoption plan if applicable (Phase 3)
- ADR file (Phase 4)
- RAG indexing confirmation (Phase 5)

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I already know which option is best — research is a formality" | The point of research is to find what you don't know you don't know. Skip-rate here predicts ADR quality worse than any other factor |
| "The critic is being too conservative" | Conservative critic concerns become production incidents. Resolve them in the ADR, not by dismissing them |
| "This decision is reversible so it doesn't need a full ADR" | Reversibility assessments are almost always overoptimistic. If you're writing an ADR, write it completely |
| "The deadline is too tight for proper research" | Rushed decisions produce technical debt. An underdocumented ADR is worse than a delayed one |

## Failure / Stop Conditions

- Phase 2 critic identifies a blocker the research missed → loop, do not push the
  weaker option through
- User cannot articulate at least one alternative considered → push back
  ("if there was no alternative, this isn't a decision worth recording")
- Refuse to write Phase 4 ADR without a revisit-when condition; permanent
  decisions tend to outlive their value

Snapshot:
Open watch:            (none)
