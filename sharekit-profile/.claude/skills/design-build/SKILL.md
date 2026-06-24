---
name: design-build
description: |
  Composite skill — design, scaffold, build, and verify a UI in one workflow. Chains four phases: design system audit → component scaffold → implementation → browser verification. Use when:
  - Task is "build this page/screen/component/modal" or "design and code X"
  - Work involves new UI surface or significant redesign (not edits to existing)
  - Visual direction is open (design system unknown) or tightly specified (reference brand provided)
user-invocable: true
auto-invoke: ui-build-requests
metadata:
  owner: global-agents
  tier: contextual
  canonical_source: ~/.claude-env/skills/design-build
---

# Design Build

End-to-end UI workflow: design system audit → component scaffold → implementation → browser verification.
Runs all four phases in one chained pass instead of four separate skill invocations.

## Auto-invocation triggers

- User asks to "build", "implement", "design and code", "create a page/screen/component/modal"
- Work involves new UI surface or significant redesign (not edits)
- Visual direction is open (system unknown) or specified (reference brand anchored)

## Workflow

### Phase 1 — Design audit
**Invoke `impeccable`.** Extract design system patterns, Web Interface Guidelines compliance, and art-direction guidance. Inputs: surface name, any aesthetic reference (brand name, screenshot, design file). Output: 1-paragraph design rationale + visual hierarchy + palette + typography + layout pattern choices.

**Done when:** Design brief covers {hierarchy, palette, typography, layout}, with sources cited (system or reference).

**Stop condition:** If no design system is detected AND user gave no aesthetic direction → ask one consolidated question ("visual style + reference brand") before proceeding.

### Phase 2 — Scaffold
**Route by project setup:**
- If `shadcn/components.json` present → invoke `shadcn` to add components
- Else if Tailwind config detected → invoke `tailwind-design-system` to generate primitives
- Else → scaffold from project conventions (detected via repo structure)

**Done when:** Component or primitive library is available + import paths confirmed.

**Stop condition:** No recognized scaffold pattern → surface blocker; ask user for scaffolding preference (shadcn / Tailwind / project template).

### Phase 3 — Build
**Route by quality target (read Phase 1 output for context):**
- **Market-credible brand-anchored work** (Stripe / Linear / Vercel / Notion / Raycast / Apple / Carbon, or user says "looks like [brand]", "market-credible", "saas landing", "developer-tool landing") → invoke `ui-expert` (industry 4-gate: register lock → reference anchor → token spec → slop audit)
- **General production UI** → invoke `impeccable`
- **Art-directed / experimental UI** → invoke `frontend-design`

Implement against Phase 1 design + Phase 2 scaffold using real project conventions (file layout, import paths, state library).

**Done when:** All files created/modified, no console errors, code matches Phase 1 design intent.

### Phase 4 — Verify
**Invoke `webapp-testing`.** Browser-level verification: accessibility audit (axe-core), console errors, responsive breakpoints, snapshot.

**Done when:** Accessibility report ≥ "no violations", console clean (only expected warnings), breakpoints ≥primary tested.

**Failure loop:** If blocking a11y violations or console errors → return report to Phase 3, fix, re-verify. Do not declare done.

**Fallback:** Browser/Playwright unavailable → mark verify as partial, recommend manual smoke test; skip snapshot generation.

## Reconciliation (signal-first output)

Output a summary block:
```
DESIGN BUILD — <surface name>
Design:    <patterns chosen, source skill> — <DONE|BLOCKED>
Scaffold:  <components added, pattern used> — <DONE|BLOCKED>
Built:     <files created/modified> — <DONE|BLOCKED>
Verified:  <a11y score, console clean Y/N, breakpoints tested> — <DONE|PARTIAL|BLOCKED>
Evidence:  screenshot <path>, accessibility report <path>, design rationale <1 sentence>
```

If any phase is BLOCKED or PARTIAL, state blocker + next action. If all DONE: link screenshot + handoff file (or "none — task complete").

## Key behaviors

- **Sequential phases by design:** Phase N output feeds Phase N+1 input (design → scaffold → build → verify). Cannot parallelize without violating contract.
- **Composite-contract compliance:** See `~/.claude/standards/composite-contract.md` — do not bail out mid-phase or silently skip to fallback; surface blocker as reconciliation output.
- **Parallel execution:** If ≥2 independent skill invocations needed (e.g., two build routes), invoke via `Agent()` in a single tool block per `~/.claude/standards/workflow.md §parallel-execution-mandatory`. Single-phase runs are inline.
- **RAG not applicable:** This skill is task-driven (build a UI), not decision-driven (what did we decide). No knowledge-brain query needed.

## Outputs / Evidence

- Design rationale (1 paragraph, from Phase 1)
- Files created/modified (from Phase 3)
- Browser screenshot at primary breakpoint (from Phase 4)
- Accessibility report (from Phase 4)
- Console clean confirmation (from Phase 4)
