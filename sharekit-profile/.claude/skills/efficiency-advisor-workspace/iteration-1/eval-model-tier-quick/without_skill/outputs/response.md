# Model Selection: Issue Triage (20 issues)

**Verdict: Sonnet**

## Reasoning

Triaging 20 GitHub issues by reading bodies and applying labels (bug/enhancement/wontfix) is a **single-phase, non-comparative, low-reasoning task**. It does not require:

- Multi-step reasoning chains (≥5 steps) — you're classifying each issue independently
- Architectural or strategic decisions — labeling is mechanical
- Cross-issue synthesis or trade-off analysis — each decision stands alone
- Critic role or synthesis across sessions

## Tier assignment per CLAUDE.md

From your standards:

- **Opus**: orchestration layer, composite entrypoints, critic role, cross-session synthesis, architectural decisions with ≥5-step reasoning, ADR writing
- **Sonnet**: execution layer (default), implementation, feature work, code review, test generation, single-phase sub-agent dispatch
- **Haiku**: formatting, symbol lookups, grep/regex, simple renames, transcription

Triage falls under **code review / single-phase execution** → **Sonnet is the tier**.

## Cost-quality trade-off

- **Sonnet**: fast, sufficient for classification logic, no reasoning bottleneck
- **Opus**: overkill; you'd pay 2× the token cost for reasoning capacity you don't use

**Recommendation: Use Sonnet. If the issues require domain expertise or cross-issue reconciliation (e.g., "these 5 are duplicates"), escalate to Opus for that synthesis phase only.**
