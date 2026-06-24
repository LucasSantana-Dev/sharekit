---
name: repaint
description: 'Single entry point for ALL frontend building and restyling — any page, component, dashboard, landing page, app shell, modal, settings panel, onboarding flow, hero, pricing section, data table, command palette, or chat/AI surface. Reach for this FIRST, before writing component code by hand, whenever the user wants to build, create, design, implement, redesign, or "make X look better / less generic / less AI-made / more like Linear/Vercel/Stripe" — even when the request sounds simple ("add a pricing section", "build a settings page", "make the hero bolder"). It routes internally between production-credible and art-directed modes and runs the full pipeline (register lock → brand anchor → token spec → scaffold → build → slop audit → browser verify), so do NOT separately invoke ui-expert, frontend-design, design-build, shadcn, or tailwind-design-system — this skill calls them for you. NOT for: frontend build/bundler/Vite errors, writing or fixing tests, bundle or performance optimization, CI/deploy, debugging an event handler''s logic, dependency or styling migrations, or CSS concept questions — those are other tools.'
user-invocable: true
argument-hint: "[surface or task] e.g. 'pricing page', 'settings panel', 'dark dashboard', 'bold hero section'"
metadata:
  owner: lucas
  tier: durable
  supersedes: [design-build]
  dispatches: [repaint-builder]
---

# repaint

Thin **router** for ALL frontend building/restyling. This skill owns **classification + the human checkpoints**; the heavy pipeline (scaffold → build → slop audit → browser verify) lives in the **`repaint-builder` agent**, which runs in its own context. That keeps this conversation clean and lets multi-surface jobs fan out in parallel. (See ADR-0034 for the rationale.)

## Why the split
A frontend build reads big files (globals.css, design references) and iterates a lot — that floods the main context and blocks parallelism. The agent absorbs that I/O and returns only a reconciliation + screenshot paths. The skill stays here because it is the user-invocable handle AND because **subagents can't pause to ask you** — so every human checkpoint lives in this skill, in the main context.

## Route: inline vs dispatch
- **Inline (here):** tiny single-surface tweaks; exploratory "show me / make it bolder / iterate" work where live screenshots + AskUserQuestion checkpoints are the point.
- **Dispatch `repaint-builder`:** any non-trivial single surface (autonomous build-to-spec). For multi-surface / whole-site jobs, dispatch **N-parallel — one agent per surface, each in its own git worktree** (shared-token edits done ONCE, up front, before the fan-out).

## Phase 0/1 — classify + lock (cheap; do this here, in main context)
1. Detect stack (package.json) + check for a **DESIGN.md / design system** (shadcn `components.json`, Tailwind config). If present, it OVERRIDES — pass its path to the builder; do NOT invent tokens.
2. **Mode**: art-direction (bold/editorial/experimental/unforgettable/motion-heavy) vs production (default).
3. **Register lock** — one of {personal-portfolio, saas-landing, product-app, marketing, docs}. If the brief matches 2+ registers, **ask ONE disambiguation question now** (the agent can't ask later). Two reflexes to pre-empt in the brief you hand off: **marketing ≠ saas-landing** (launch/announcement pages get a narrative/editorial layout + an editorial anchor, not a feature-card grid (and NOT a .map() loop over identical feature cards: fold highlights into the narrative prose, or give each a distinct, varied treatment — alternating sides, different sizes)), and **no Inter/Roboto anywhere in the font stack** (even as a fallback).
4. For **exploratory/creative** briefs ("explore a new look"): lock direction (anchor/mode) WITH the user — or dispatch with an explicit "return after Phase 1 for direction approval" checkpoint — before committing a big build.

## Dispatch
Hand the builder a tight brief: `{ surface(s), register, mode, DESIGN.md path, anchor(s), framework, constraints, screenshot output dir }`. Multi-surface → one agent per surface in its own worktree. Bump `model: opus` at dispatch for art-direction-heavy / "kill the cliché" briefs.

## Reconcile (here)
Collect each agent's reconciliation block + screenshot paths → **Read the screenshots** → show the user. Loop on any FLAGGED defaults or audit/a11y failures. Never declare done on a BLOCKED phase.

## Human checkpoints (live here — agents can't ask)
register disambiguation · direction approval for creative briefs · screenshot review · **deploy confirmation** (the builder never deploys).

## Reference library (shared with the agent)
- [references/context-anchors.md](references/context-anchors.md) — §A context anchors · §B art-direction directions · §C 2026 tokens · §D slop catalog · §E type-by-role. **Open first for any non-dev-tool brief.**
- `~/.claude/skills/ui-expert/` · `~/.claude/skills/frontend-design/` · `~/.claude/skills/shadcn/rules/` · `~/.claude/skills/tailwind-design-system/`.

## Reconciliation output (signal-first)
```
FRONTEND — <surface(s)>
Mode/Register/Anchor/Tokens/DESIGN.md/Scaffold/Built/Audit/Verified — <DONE|PARTIAL|BLOCKED>
Path: <repaint-builder ×N | inline> · screenshots: <paths> · console errors: <n>
```

Evals: `evals/evals.json` (9 cases) test this skill's end-to-end behavior; run them through both the inline and agent paths when changing either (ADR-0034 gate).
