---
name: decide
description: 'Composite skill — mode-routed decision pipeline. Quick Mode: verdict-in-text for low-stakes choices (<5 min, no ADR). Full Mode: research-and-decide → decision brief checkpoint → adr-write → memory capture for architectural decisions. Stops after Phase 1 if research is inconclusive. Triggers: decide between X and Y, pick a tool/approach and document it, research and choose, evaluate options with critic, what should we use for X.'
user-invocable: true
auto-invoke: 'architectural-decisions-needing-documentation'
metadata:
  owner: global-agents
  tier: contextual
  canonical_source: ~/.claude/skills/decide
---

# Decide

Research options → reach a recommendation → document it as an ADR.

A three-part workflow: research candidates, challenge the recommendation with critic review, and capture the decision durably. Ensures decisions are defensible and revisitable.

## Auto-invocation triggers

- User asks to "decide between X and Y", "research and decide", "pick a tool/approach and document it"
- After `adr-gap` flags an undocumented decision that needs retroactive capture
- When starting a significant architectural choice (ORM, framework, deploy target, caching strategy)

---

## Mode routing (run before anything else)

**Quick Decision Mode** — for low-stakes implementation choices that don't need a durable record:
- Signals: "should I use X or Y for this one task", utility-library choices, micro-patterns, choices easily reversed in <30 min, choices with no downstream consumers
- Output: 3–5 sentence verdict inline. Reasoning + key tradeoff + recommendation. No ADR. No research-and-decide.
- When in doubt: ask "does a wrong answer here cost you more than 1 hour to undo?" If no → Quick Mode.

**Full Decision Mode** — for architectural, tooling, or infrastructure decisions that need durability:
- Signals: framework choice, data layer, caching strategy, auth approach, deploy target, any decision that will outlive the current PR or affect ≥3 files
- Output: research brief + decision brief checkpoint + ADR file + memory capture
- Proceed with this mode for everything below.

---

## Stake calibration

Before invoking research-and-decide, classify stake level:

| Level | Signals | Alternatives required | ADR required |
|---|---|---|---|
| **HIGH** | Framework, data layer, infra dependency, security model | ≥3 with tradeoffs | Yes |
| **MED** | Library choice, pattern selection, API design | ≥2 with tradeoffs | Yes |
| **LOW** | Implementation detail, micro-pattern, reversible choice | 1 alternative sufficient | No (Quick Mode) |

HIGH-stake decisions: invoke `brainstorming` AND `adt-research` before recommending. MED-stake: `adt-research` alone is sufficient.

---

## Workflow

### Phase 0 — Mount guard + duplicate check

```bash
mount | grep -q "/Volumes/External HD" || echo "[WARN] External HD unmounted — RAG pre-check skipped"
```

Check whether an ADR for this decision already exists **before** invoking research-and-decide:
```bash
grep -r "<decision-keyword>" docs/adr/ docs/architecture/ adr/ 2>/dev/null | head -5
```

If a matching ADR exists → surface it immediately: "ADR already exists at [path]. Re-open only if [specific condition] changed." Skip to reconciliation. Do not duplicate.

### Phase 1 — Research and Recommend

Invoke `research-and-decide` on the decision question.

This phase chains internally: RAG pre-check → research candidates → decision-critic challenge → adoption plan. See `research-and-decide/SKILL.md` for full orchestration.

**Evidence minimum** (enforce before proceeding):
- ≥2 alternatives with explicit tradeoffs documented (not just named)
- Each alternative compared on: cost, migration friction, lock-in risk, failure modes specific to this stack
- Fewer than 2 alternatives → push back: "if there's only one option, this is a constraint, not a decision worth recording."

**Confidence gate** — classify before proceeding to Phase 1.5:
- **HIGH confidence**: ≥2 alternatives researched, critic challenge completed, claims-to-verify list verified, one option clearly superior on ≥3 dimensions
- **MED confidence**: ≥2 alternatives, critic completed, 1–2 unverified claims remain — surface them and proceed with caveat
- **LOW confidence**: fewer than 2 alternatives, critic flipped leading option without resolution, or critical unknowns block the decision → emit inconclusive, STOP

**Proceed to Phase 1.5:** confidence is HIGH or MED.
**Stop:** confidence is LOW → emit `Phase 1 inconclusive: [reason]. Provide [specific missing input] before proceeding.` Do NOT write an ADR for a LOW-confidence decision.

### Phase 1.5 — Decision brief checkpoint

Before writing the ADR, emit a Decision Brief for human review:

```
DECISION BRIEF — <decision question>
──────────────────────────────────────
Recommendation: <chosen option>
Confidence:     HIGH | MED — <why>
Stake level:    HIGH | MED

Evidence (top 3):
1. <strongest evidence point>
2. <second evidence point>
3. <third evidence point>

Alternatives considered:
- <option A>: <tradeoff in one sentence>
- <option B>: <tradeoff in one sentence>
- <option C if exists>: <tradeoff>

Key unknowns:       <what could change this if verified false>
Switch triggers:    <specific, concrete condition that would make us rechoose — not "if requirements change">
Unverified claims:  <from decision-critic's claims-to-verify list — if any>
──────────────────────────────────────
Proceed to write ADR? (10s without objection = yes)
```

**Switch triggers must be concrete**, e.g.:
- "When <library> releases v3 breaking the current adapter"
- "When monthly cost exceeds $X at current growth rate"
- "When team grows past N engineers and the shared config becomes a bottleneck"

Vague triggers ("when requirements change", "when we scale") are rejected — push back for a specific condition.

Wait 10 seconds. If user objects or requests changes, revise the brief. If user confirms (or 10s passes), proceed to Phase 2.

### Phase 2 — Document the Decision

Invoke `adr-write` using the Decision Brief's output.

Pass to adr-write:
- Decision title
- Context (the question + why it matters + stake level)
- Chosen option + rationale (use evidence points from brief)
- Confidence level + unverified claims (if MED)
- Alternatives considered with tradeoffs
- Consequences (positive + negative)
- Switch triggers (specific, from the brief — not vague)

**ADR quality gate** — the ADR must include:
- [ ] ≥2 alternatives with explicit tradeoffs (not just listed)
- [ ] At least 1 specific switch trigger (not "when requirements change")
- [ ] If MED confidence: unverified claims section noting what to verify post-ADR

See `adr-write/SKILL.md` §3–5 for template, directory search, ADR numbering, and supersession handling.

**Completion criteria:** ADR file staged (not committed) with all sections; superseded ADRs marked if applicable.

### Phase 3 — Memory capture

After ADR is staged, capture the decision for future session recall:

```
save_memory(
  key: "decision-<slug>",
  content: "<decision question> → chose <option>. ADR: <path>. Switch when: <trigger>.",
  type: "project"
)
```

This ensures future sessions can answer "have we decided X" without reading the ADR file.

---

## Reconciliation

Always output this block, even on stop/failure:

```
DECIDE — <decision question>
  Mode:            Quick | Full
  Stake:           HIGH | MED | LOW
  Phase 0 Check:   Duplicate found at <path> | No duplicate
  Phase 1 Research: <recommendation X | inconclusive (stopped)>
                    Confidence: HIGH | MED | LOW
                    Reason: <evidence summary | constraint needed | critic flipped | too few alternatives>
  Phase 1.5 Brief: Approved | Revised | Blocked
  Phase 2 ADR:     <docs/adr/NNNN-slug.md | skipped (inconclusive) | already exists at <path>>
  Phase 3 Memory:  Captured | Skipped (LOW confidence)

Decision: <one-line summary | pending human input>
ADR path: <path | "N/A — Phase 1 blocked">
Switch trigger: <specific trigger | "N/A">
Next: <provide constraints / re-run research / stage + commit ADR>
```

---

## Failure / Stop Conditions

**Phase 0 stop:**
- Duplicate ADR exists → surface path, skip all phases, mark in reconciliation

**Phase 1 stop / hold:**
- Confidence is LOW → emit "Phase 1 inconclusive: [specific reason]. Need [specific missing input]." Halt. Await human input.
- Critic flips leading option and no new option emerges → add the flipped dimension to the research brief; invoke `research-and-decide` once more with that dimension; if still inconclusive → halt
- Fewer than 2 alternatives with tradeoffs → push back: "this is a constraint, not a decision"

**Phase 1.5 stop:**
- User explicitly objects to the brief → revise and re-emit before proceeding to Phase 2
- Switch triggers are vague → push back for specific conditions before continuing

**Phase 2 stop:**
- ADR quality gate fails (missing alternatives or vague triggers) → fix before staging

**Never:**
- Write an ADR that says "we haven't decided yet" or "this needs more research"
- Auto-commit ADR — stage only, await user confirmation
- Proceed to Phase 2 without HIGH or MED confidence
- Skip the Decision Brief checkpoint (Phase 1.5) — it is the human review gate
- Accept vague switch triggers ("when scale changes", "when requirements evolve")
