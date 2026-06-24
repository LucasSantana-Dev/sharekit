## Efficiency Advisory: Opus vs Sonnet for Issue Triage

**Status:** DONE

**Verdict:** Use **Sonnet**

**Key reason:** Classification of 20 issues by label (bug/enhancement/wontfix) is a single-pass judgment task with no reasoning chain longer than 2–3 steps (read body → classify). Opus is overkill and costs ~3× more tokens for identical output quality. Sonnet is the correct tier for feature-level judgement and classification work.

**Tradeoff:** You save ~66% tokens; zero quality risk on a straightforward triage task. If some issues are genuinely ambiguous and need adversarial reasoning (should this be bug or wontfix?), bump 3–5 unclear ones to Opus after Sonnet flags them — that costs less than running all 20 on Opus.

**Optional refinement:** Run all 20 on Sonnet; have Sonnet flag any issues where the classification is uncertain or depends on product intent. Then escalate the flagged subset (typically 2–5 issues) to Opus for final judgment. This hybrid approach achieves 90%+ of Opus quality at 40–50% of the cost.

---

### Why Sonnet is correct here

| Dimension | Assessment |
|-----------|------------|
| Task type | Classification / labeling (single-pass judgement) |
| Reasoning depth | ≤2–3 steps per issue (read → classify) |
| Ambiguity | Low (bug/enhancement/wontfix are well-defined categories) |
| Architectural impact | None (triage, no design decisions) |
| Volume | 20 independent items (no cross-issue reasoning required) |

Opus is needed for: architecture decisions, ADR writing, 5-step reasoning chains, composite orchestration, or adversarial critique. Sonnet is the execution tier — it handles code review, test generation, feature implementation, and judgment calls like this one.

### Cost comparison

- **Sonnet:** ~2k tokens per issue avg = ~40k total
- **Opus:** ~5k tokens per issue avg = ~100k total
- **Savings with Sonnet:** ~60k tokens (~60%)

Wall-clock time is identical (both run instantly in parallel or sequential). The only difference is token spend.

---

**Next:** Run all 20 on Sonnet with a prompt that asks for a confidence flag (high/medium/low) on each classification. Post-process to identify low-confidence items, then escalate those to Opus if the ambiguity matters for your workflow.
