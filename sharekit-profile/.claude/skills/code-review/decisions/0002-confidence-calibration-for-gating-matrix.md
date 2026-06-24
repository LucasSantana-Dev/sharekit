# ADR-0002: Confidence calibration for the severity × confidence gating matrix

- **Status:** Accepted
- **Date:** 2026-06-05
- **Deciders:** Lucas Santana (solo operator)
- **Supersedes:** (none)
- **Superseded by:** (none)

## Context

`SKILL.md` instructs the reviewing model to attach a `confidence` ∈ [0,1] to each finding.
`REFERENCE.md` uses that score in a gating matrix (severity × confidence → inline thread / summary / drop) designed to suppress noisy P2/P3 threads. In practice, LLMs default to 0.7–0.9 for virtually every finding, collapsing all findings into the ≥0.8 column and rendering the matrix's lower columns dead code. The root causes are:

1. No calibration guidance in `SKILL.md` — the field is defined but the model gets no instruction on *how* to set it.
2. The skill frames the reviewer as "senior QA," biasing toward confident output.
3. Evidence-type mis-tagging: models label behavioral findings `factual`, which then anchor incorrectly under any evidence-based calibration scheme.

A critic review (2026-06-05) flagged that naive evidence-anchoring propagates upstream mis-tagging and that P0/P1 findings can be wrongly demoted to "open questions" under the current matrix when tagged `speculative`.

## Decision

We will update `SKILL.md` and `REFERENCE.md` with three calibration rules, applied in order:

1. **P0/P1 always post inline** — remove evidence/confidence gating from blocker-tier findings. A real null-deref tagged `speculative` must still reach the author.
2. **Evidence-type verification before classification** — before tagging `factual`, the model must state the exact file:line and why no runtime context is needed; if it cannot, the finding is `behavioral` or `speculative`.
3. **Ordered calibration procedure** — evidence type is tagged first; confidence band is derived from it (`factual` → 0.8–1.0, `behavioral` → 0.5–0.8, `speculative` → 0.0–0.5); the model then asks "what fraction of independent senior reviewers would agree?" to pick the value within that band.

   The bands are aligned byte-for-byte with the existing `REFERENCE.md` matrix columns (`≥0.8` / `0.5–0.8` / `<0.5`) so every value in [0,1] maps to exactly one column and each evidence type lands in exactly one column. An earlier draft used narrower bands (`behavioral 0.5–0.7`, `speculative 0.0–0.4`); rejected during implementation because the buffer gaps (0.7–0.8, 0.4–0.5) were unreachable dead zones and capped a behavioral finding's expressible agreement below its true level.

A measurement audit (≥5 real PRs) is deferred until after the next review session where the skill is exercised under this guidance.

## Alternatives considered

- **Raw evidence-anchoring (Option A, naive)** — tie confidence mechanically to evidence type without a verification step. Rejected: propagates upstream mis-tagging; if the model incorrectly labeled a behavioral finding `factual`, anchoring raises its confidence instead of lowering it.
- **Rubric-based IF/THEN rules (Option B, standalone)** — "set ≥0.9 if you could write a failing test right now." Rejected: creates adversarial compliance — models can write plausible-sounding tests for speculative claims, replacing one weak signal with another.
- **Adversarial self-questioning per finding** — ask "what would make me wrong?", subtract 0.15 per valid counter-argument. Rejected for now: 2–3× token overhead per finding with no baseline measurement of benefit; revisit if audit shows systematic over-confidence survives the simpler fix.
- **Do nothing** — accept that the gating matrix's lower columns are dead code. Rejected: the matrix exists specifically to reduce P2/P3 thread noise, and the `--comment` mode is the skill's highest-value operation; leaving it uncalibrated defeats that goal.
- **Post-hoc threshold tuning** — pick a repo-specific threshold (e.g., ≥0.75 instead of ≥0.8). Rejected without measurement data: can't pick a threshold without knowing the actual FP rate distribution.

## Consequences

**Positive:**
- P0/P1 findings can no longer be demoted to "open questions" by an accidental `speculative` tag — safety regression risk closed.
- The gating matrix's 0.5–0.8 and <0.5 columns become reachable; P2/P3 thread volume should decrease.
- Evidence-type verification adds an auditable trail: a finding tagged `factual` must cite a specific line, making the classification inspectable.
- The calibration procedure is ordered and deterministic — two models reading the same instruction should behave consistently.

**Negative:**
- P0/P1 always-inline rule may surface a small number of P0/P1 threads that are genuinely speculative; the cost is one extra thread a reviewer must address, which is acceptable for blocker-tier findings.
- Evidence-type verification adds a modest reasoning step per finding (not material at the 1–15 findings per PR range).
- The `behavioral → 0.5–0.8` band may still cluster; the "independent reviewer agreement" question anchors the within-band value but its calibration remains untested.

**Neutral:**
- The gating matrix structure itself (the 3×4 table in `REFERENCE.md`) is unchanged; only the P0/P1 row gains an override note.
- `post_review.py` requires no code changes — all changes are prompt/documentation only.

## Revisit when

- A 5–10 PR audit shows P2/P3 inline thread volume did not decrease after this change (the calibration instructions are ineffective — try adversarial self-questioning or post-hoc threshold tuning).
- A real P0/P1 bug was missed because the model tagged it `speculative` and the always-inline override was not present (should not happen after this ADR; if it does, the verification step needs strengthening).
- The `evidence` field mis-tagging rate stays above ~30% in the audit (root cause is model prior, not instructions; consider adding calibration examples / few-shot prompts to SKILL.md).
- A second human contributor joins the repo (always-inline P0/P1 may need to be gated behind confidence again to prevent review spam at scale).
- Cubic (the existing always-on bot) starts surfacing the same calibration problem — that's signal that the issue is systemic across the AI reviewer stack.

## References

- ADR-0001: Reviewers and fixers — established the scoped architecture this calibration extends
- `REFERENCE.md` lines 196–212: current gating matrix
- `SKILL.md` lines 92–93: current (uncalibrated) confidence field definition
- Research: "When Can We Trust LLM Graders?" (arXiv:2603.29559) — self-reported confidence ECE 0.166
- Research: "Trust-Calibrated Code Review" (arXiv:2606.01969) — granular confidence surfacing in review workflows
- Critic review session: 2026-06-05 — identified P0/P1 safety hole and evidence propagation risk
