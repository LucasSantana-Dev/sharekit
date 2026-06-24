---
name: ui-expert
description: Build production-grade frontend interfaces that look like they came from Linear, Vercel, Stripe, Notion, Raycast, or Apple — not from an LLM. Enforces four gates before any code lands - register lock, reference anchor, token spec, and post-generation slop audit. Use for any non-trivial UI work where the existing output reads as generic, templated, or "AI-made". Covers landing pages, dashboards, marketing sites, app shells, settings panels, onboarding flows, data tables, command palettes, empty states, and any surface where craft and credibility matter to the audience. Not for purely creative/experimental art-direction work — that's `frontend-design`.
version: 1.0.0
user-invocable: true
argument-hint: "[target | register | company-reference] e.g. 'pricing page', 'developer-tooling', 'linear-style sidebar'"
metadata:
  owner: lucas
  tier: durable
---

# ui-expert

A frontend skill grounded in named, market-proven patterns from 13 design systems, 6 brand exemplars, comprehensive accessibility law, performance baselines, AI-era UI patterns, UX research foundations, and a 32-entry anti-pattern catalogue. The goal isn't to be bold — it's to be **credible**. Output should pass the five-second test where an engineer or designer in tech can't say "AI made that."

## Why this skill exists

`impeccable` and `frontend-design` already enforce taste. They still produce generic results because the model interpolates from the statistical center of its training data unless **anchored to a specific named reference**.

This skill adds the missing anchors:

1. **Register lock** — the surface is classified into a fixed audience register (developer-tooling, fintech, consumer-saas, enterprise-admin, b2b-data-dense, editorial-marketing, ai-first). Each register has its own playbook.
2. **Reference anchor** — every screen is anchored to at least one *named* industry pattern (e.g. "Linear sidebar", "Stripe KPI card", "Vercel grid background", "Raycast command palette"). Anchors carry concrete token tables, not vibes.
3. **Token spec** — concrete numbers (font weights, spacing values, OKLCH triplets, radii) locked before any JSX/HTML is written. No code without a token table.
4. **Slop audit** — after generation, the output is linted against the named anti-pattern catalogue. Failed lints get rewrites, not warnings.

## When to invoke

Auto-invoke when the user asks to:

- Build or rebuild a page, screen, dashboard, or component
- "Make this look more professional" / "less AI-ish" / "more like Linear/Vercel/Stripe"
- Design a landing page, pricing page, settings panel, or admin surface
- Improve an interface that currently feels templated or stock

Skip and route elsewhere when:

- The task is experimental art direction, scroll-driven editorial, or brand-expression-heavy → `frontend-design`
- The task is backend-only or non-UI
- The task is a one-line CSS fix

## Phase 0 reading order

Before starting any surface, load these references in order:

**Always**:
- This SKILL.md
- The matching register from [references/registers/](references/registers/)
- At least one company reference from [references/companies/](references/companies/)

**For AI-surface work** (chat, console, playground, agent UI):
- [registers/ai-first.md](references/registers/ai-first.md)
- All files in [references/ai-patterns/](references/ai-patterns/)

**For accessibility-critical work**:
- [accessibility/wcag-2.2-checklist.md](references/accessibility/wcag-2.2-checklist.md)
- [accessibility/aria-patterns.md](references/accessibility/aria-patterns.md)

**For performance-critical work**:
- [performance.md](references/performance.md)

**For UX research grounding**:
- [ux-research/](references/ux-research/) files as needed (NN/g heuristics, Baymard findings, GOV.UK, Material 3)

---

## The four gates (mandatory order)

Every invocation runs these four phases. Skipping a gate produces the generic output this skill exists to prevent.

### Gate 0.5 — Register lock (mandatory; runs BEFORE reference anchor)

Classify the brief into exactly one of:
- `personal-portfolio` — identity-first surface for one person (engineer/designer/writer)
- `saas-landing` — product marketing page (Stripe/Linear/Vercel register)
- `product-app` — post-login app surface (Linear app, Notion editor, Figma canvas)
- `marketing` — blog post, launch page, manifesto, campaign page
- `docs` — developer docs / API ref / KB

**Detection rules** (see `references/research-2026-05-15/ui-registers.md` § "Register-detection signals from a brief" for the full table):
- "portfolio", "personal site", "about me", named person + role → `personal-portfolio`
- "landing page", "pricing", "homepage for our product", "convert visitors" → `saas-landing`
- "dashboard", "admin tool", "app surface", "workspace" → `product-app`
- "blog post", "launch", "manifesto", "campaign" → `marketing`
- "API reference", "SDK docs", "developer docs", "KB" → `docs`

**Ambiguous brief handling:** if the brief matches 2+ registers (e.g. "consulting site" could be portfolio OR saas; "open-source homepage" could be saas-OSS OR portfolio), SURFACE the ambiguity to the user. Ask one disambiguation question, lock register, proceed. See `ui-registers.md` § "Ambiguous prompts (and disambiguation tells)" for handling patterns.

**Default-DENY rule** (from R3's strongest insight): SaaS-landing patterns must NOT be applied by default. If the brief is `personal-portfolio`, `product-app`, `marketing`, or `docs`, the SaaS-anchor pool is OFF-LIMITS to Gate 2. Choosing SaaS register requires affirmative user intent or explicit brief language.

**Output of this gate:** locked register name (write to "register: <name>" line in the working DESIGN.md / context that downstream gates read).

### Gate 2 — Reference anchor

Use anchors from `references/registers/<register>/anchors.md` where `<register>` is the value locked by Gate 0.5.

Pick **at least one** named industry pattern that the surface will explicitly reference. Two or three is better.

**Design systems** from [references/companies/](references/companies/) (when register=saas-landing, candidates include Linear, Vercel, Stripe, Notion, Raycast, Apple, Carbon; consult `references/registers/<register>/anchors.md` for other registers):

- `linear.md` — sidebar density, command palette, status pills, dark-first tone
- `vercel.md` — Geist typography, blueprint grid, monochrome with one accent
- `stripe.md` — KPI density without clutter, code-as-marketing, gradient meshes used sparingly
- `notion.md` — warm-minimal, serif headings, soft surfaces, Inter-with-personality
- `raycast.md` — command palette UX, dense list rows, system-tinted accents
- `apple-hig.md` — 44pt targets, dynamic type, system materials
- `carbon-ibm.md` — dense enterprise grid, elevation-by-color, 8pt rhythm
- `material-3.md` — dynamic color, tonal elevation, state layers, international layout
- `polaris.md` — admin-density tokens, structured action bars, conversational errors
- `atlassian.md` — design tokens spec, Jira-style icons, token-driven components
- `primer.md` — code-aware UI, diff colors, repository chrome patterns
- `mantine.md` — component-first React tokens, hover/focus rings, overlay patterns
- `spectrum-2.md` — RTL/LTR, expressive density, status-light patterns
- `gov-uk.md` — content-first, one-thing-per-page forms, no-decoration error pages

**Brand exemplars** (no published token spec, but aesthetic anchors) from [references/brands/](references/brands/):

- `arc.md` — sidebar-first, command bar everywhere, spaces concept
- `notion-calendar.md` — keyboard-first calendar, quick-event-add, multi-account chips
- `things-3.md` — touch-friendly density, breathing space, hand-drawn delight
- `reflect.md` — distraction-free note UI, backlink graph, daily-note loop
- `superhuman.md` — keyboard-shortcut overlay, zero-state inbox, snippets surface
- `airtable.md` — grid/calendar/kanban view switch, formula bar, expand-record overlay

If none fit, use [companies/_picking.md](references/companies/_picking.md) to choose by attribute. Brand anchors carry approximate tokens marked `// approximate` — pair with a design system from `companies/` for token specs.

**The anchor is a contract.** When you write "anchored to Linear sidebar", the sidebar must use Linear's 36px row height, 12px horizontal padding, monospace-flavored sans, hover-on-press-no-bg behavior. Not "in the spirit of" — the actual tokens.

State the anchor(s) in one sentence: *"Sidebar anchored to Linear; KPI cards anchored to Stripe Dashboard; grid background anchored to Vercel; modal anchored to Arc."*

### Gate 3 — Token spec

Before any markup, lock the concrete tokens for this surface. Output as a small table in the response (and into the project's `DESIGN.md` if one exists).

Required token rows:

| Category | Must specify |
|---|---|
| **Color** | OKLCH triplets for `bg`, `fg`, `muted`, `border`, one `accent`. Tint every neutral toward the accent hue. No `#000`/`#fff`. |
| **Type** | Display family + weight, body family + weight, mono family. Weight contrast ≥ 400 between display and body (e.g. 200 vs 700, not 500 vs 600). Scale ratio ≥ 1.25 per step. |
| **Spacing** | Base unit (4pt or 8pt). Six steps max. State which steps are used where. |
| **Radius** | Three values max (e.g. 4 / 8 / 999). State per-component which radius. |
| **Elevation** | If used, ≤ 3 levels. Prefer color contrast over shadow for hierarchy (Carbon pattern). |
| **Motion** | Duration tokens (e.g. 120ms / 200ms / 320ms). Ease curve (`ease-out-quart` or similar). No bounce. |
| **Accessibility** | WCAG 2.2 compliance: contrast 4.5:1 (normal text), 3:1 (large text + UI components). Cite [accessibility/wcag-2.2-checklist.md](references/accessibility/wcag-2.2-checklist.md) for all SCs applied. |
| **Performance** | Web Vitals target per surface type from [performance.md](references/performance.md). LCP / INP / CLS targets stated. For AI surfaces, include TTFT / TPOT targets. |

Forbidden in this phase:

- `Inter`, `Roboto`, `Open Sans`, `Lato`, `Arial`, `Helvetica`, system stacks as the *default* body face. Pick something with identity (Geist, Söhne, ABC Diatype, Bricolage Grotesque, Fraunces, IBM Plex, JetBrains Mono, etc.) and only fall back to Inter if the project's `DESIGN.md` already commits to it.
- Pure black/white. Always tint.
- "Theme: light/dark" without committing — write one sentence describing the physical scene (who, where, ambient light, mood) and let it force the answer.



### Register-scoped token rules (overlays on top of the base token spec)

**personal-portfolio register forbids:**
- Default "cyan-on-dark" (Linear/Vercel) palette unless brief explicitly requests it. Reason: this palette is the Sophisticated Dark Aesthetic Mismatch (anti-ai-slop-tells.md § N4); credible portfolios use brand-personal palettes.
- Bento-grid as the dominant section pattern. Use varied / asymmetric rhythm per ui-registers.md.
- More than 1 CTA in hero. Portfolio CTAs are 0-1 in hero, 1-3 total on page.
- Eyebrow tags on every section ("NOW", "ABOUT", "REACH ME", "MORE DETAILS" — the <your-domain> failure mode).
- Unsourced round-number metrics ("40% faster", "100k MAU"). If a portfolio claims a metric, it must be tied to a specific named project or company.

**saas-landing register requires:**
- Hero with primary + secondary CTA (1-2 in hero; 5-15 across page is allowed)
- Bento grid OR feature row IS the canonical pattern
- Repeated section rhythm is expected

**product-app register forbids:**
- Marketing CTAs (no "Upgrade to Pro!" buttons in the dashboard)
- Hero treatment (app shells have no hero)
- Decorative motion (motion must be functional: state transitions, drag feedback)

**marketing register prefers:**
- Single-column longform
- Editorial typography (serif body or generous sans)
- 1-3 CTAs total

**docs register prefers:**
- Sidebar nav + content layout
- Search-first
- No marketing hero


### Gate 4 — Generate, then audit

Write the code. Then **chain to `ai-slop-audit`** on the output. The audit catches the 70% of mistakes the model makes on its own (font-size collapse, padding inconsistency, decorative shadow, etc.) and rewrites them inline.

### Slop audit catalog (sourced 2026-05-15)

For the full source-quoted catalog see `references/research-2026-05-15/anti-ai-slop-tells.md`. Top 10 most-cited (the core audit):

| Rank | Pattern | Severity | Detection signal |
| --- | --- | --- | --- |
| 1 | N1 Distributional Convergence / AI Slop | critical | All 4 of N2 (Inter + purple gradient + rounded cards + 3-icon row) present simultaneously |
| 2 | N4 Sophisticated Dark Aesthetic Mismatch | critical | dark + cyan/accent palette applied to non-SaaS register surface |
| 3 | N5/N6 Immediate Clarity Fail + Identity Anonymity | critical | 3-second scan test fails OR name-swap test fails for portfolios |
| 4 | N7 AI Slop Copy | major | >3 value-empty words per 100 words (modern, robust, scalable, cutting-edge, etc.) |
| 5 | N9 Purple Gradient Tell | major | violet→pink/blue hero gradient or blob |
| 6 | N3 Bento Trifecta | major | bento + dark + feature blocks, repeated section pattern |
| 7 | N8 Impressive No Clarity | major | high visual rating + low summary clarity |
| 8 | N12 Scroll Hijacking | major | browser scroll overridden |
| 9 | N17 Look-Alike Layout | major | swap-with-another-AI-site test passes |
| 10 | N2 4-Tell Combo | critical | Inter + purple gradient + rounded cards + 3-icon row |

Long-tail (severity major or minor; cite `anti-ai-slop-tells.md` for detection signals):
- N10 Fade-on-Scroll Sections (minor)
- N11 Dumb Hover Effects (minor)
- N13 Unexpected Interaction Feedback (minor, a11y critical)
- N14 Generic Modern (critical — root-cause sibling of N1)
- N15 Trends Drained of Originality (major)
- N16 Agency-vs-Personal Confusion (major)

### Register-mismatch pre-check (NEW; runs BEFORE the slop catalog)

If the locked register (Gate 0.5) is NOT `saas-landing` AND the output uses ≥2 of:
- Cyan/violet accent on dark palette
- Bento-grid as primary section pattern
- 2+ stacked hero CTAs
- Eyebrow tags on 3+ sections
- Suspicious round-number metrics

→ Flag as CRITICAL register-mismatch. Cite N4 (Sophisticated Dark Aesthetic Mismatch). Refuse to ship; loop back to Gate 0.5 confirmation.

### Identity-anonymity check (NEW, portfolio register only)

For `personal-portfolio` output: mentally swap the person's name with another name and photo with another photo. If the output still works (no copy or design changes break), flag CRITICAL N6 (Identity Anonymity). Portfolios must have at least ONE detail only THIS person would write/show.

### Standard audit checks

The audit also runs these checks:

- **Hard bans** from SKILL.md (purple/blue gradient, generic bento grid, glassmorphism, etc.)
- **ARIA anti-patterns** from [accessibility/aria-anti-patterns.md](references/accessibility/aria-anti-patterns.md) — redundant roles, missing focus traps, inaccessible custom controls
- **Performance regressions** from [performance.md](references/performance.md) — unoptimized images, 3rd-party script blocking, font swap CLS
- **AI-surface checks** from [ai-patterns/](references/ai-patterns/) if the surface is a chat, console, playground, or agent UI — streaming cursor, tool-use card, code apply/reject, artifact panel, model picker, error states

If the audit returns ≥ 1 critical finding, fix and re-audit before declaring done. The chain is not optional.

## Hard bans (industry-wide, not register-specific)

These produce instant "AI made that" recognition. Match-and-rewrite, don't soften.

| Ban | Why | Rewrite recipe |
|---|---|---|
| Purple/blue gradient on white | The single most common AI-UI tell since 2023 | Pick a *committed* color (one saturated hue carrying 30-60% of surface) or a *restrained* palette (tinted neutrals + one ≤ 10% accent). Never the gradient. |
| `bg-gradient-to-r from-purple-500 to-pink-500` text | Decorative, never meaningful | Solid color; emphasis via weight or size. |
| Generic bento grid hero (3×2 colored tiles) | SaaS landing cliché since 2022 | Either editorial split-screen (large image left, type right), Stripe-style code-as-marketing block, or a single dominant hero with one CTA. |
| Hero-metric card template (huge number + tiny label + arrow + sparkline, repeated 4×) | Pure SaaS slop | If you need KPIs, anchor to Stripe Dashboard pattern (asymmetric weights, one card carries the eye, others step down). |
| Identical card grid (icon + heading + 2 lines, ×N) | Pricing-page slop | Asymmetric layout: lead card emphasized, others sparser. Or use a comparison table. |
| Glassmorphism by default | 2021 trend, now unmistakably stock | Solid surface with tinted neutral background. Glass only when atmosphere is the explicit goal. |
| Modal as first thought | Lazy interaction design | Inline edit, progressive disclosure, slide-over panel. Modal only for destructive confirms. |
| Side-stripe borders (`border-left: 4px solid …`) | Bootstrap-era callout | Full border, background tint, leading icon/number, or nothing. |
| Em dashes in UI copy (`—` or `--`) | Tells immediately | Use comma, colon, semicolon, period, or parens. |
| Decorative `box-shadow: 0 4px 6px rgba(0,0,0,0.1)` on cards | The default "elevation" that signals nothing | Tighter shadow with brand-tinted color, or elevation via background contrast (Carbon pattern). |

## Component anatomy contract

Every interactive component the skill builds must specify these states, even if some are no-ops:

| State | Required design |
|---|---|
| **Default** | The happy path. |
| **Hover** | A specific change (not just opacity). Behavior should match register: dev-tooling → subtle bg tint; consumer-saas → slight elevation; editorial → underline reveal. |
| **Focus** | Visible ring using accent hue, ≥ 2px, ≥ 3:1 contrast against bg. |
| **Active/pressed** | Distinct from hover (translate-y, darker bg, or scale-95). |
| **Loading** | Skeleton matching the component's shape. Shimmer animation, not spinner. Same dimensions as final content. |
| **Empty** | Illustration or icon + one sentence + one CTA. Specific to the data type. ("No invoices yet. Create your first invoice.") |
| **Error** | Inline message, retry action, not a full-page replacement. Use accent-error hue (not pure red). |
| **Disabled** | Reduced contrast (not opacity-50), no pointer cursor, no hover state. |

The component is not done until all eight states are designed. Loading/empty/error are the three most-skipped — flag them explicitly.

See [components/anatomy-checklist.md](references/components/anatomy-checklist.md) for per-component tables (Button, Input, Card, Table, Dialog, Toast, Tabs, Combobox).

## Copy rules

- One H1 per page. Period.
- The brand or product name must be a hero-level signal on brand pages, not just nav text. If you can remove the nav and the first viewport could belong to another brand, branding is too weak.
- No restated headings ("Welcome to your dashboard" above "Dashboard").
- No empty-platitude microcopy ("Let's get started!", "Welcome back!", "Great choice!").
- No em dashes.
- Number formatting matches data type: `$4.99` ≠ `$12,847.32` in space requirements — design with realistic content, never `Lorem ipsum` or `Item 1`.

## The five-second test

Before declaring done, run this test on the output:

> "If I removed every brand name and logo and showed this to an engineer who reads design language fluently (someone who works at Linear, Vercel, Stripe, Notion, Apple, or a similar company), would they say 'AI made that' within five seconds?"

If yes, return to Gate 2 and pick a stronger anchor. Iterate until no.

The most common reasons a screen fails this test:

1. Font is Inter or system stack
2. Color palette is "blue + grey + one purple accent"
3. All cards are the same size
4. Hero is "headline → subhead → CTA → bento grid"
5. Shadows are default Tailwind `shadow-md` or `shadow-lg`
6. Padding/spacing varies by ad-hoc values (12px here, 14px there, 18px elsewhere)
7. Loading state is a centered spinner
8. The brand is invisible until you read the nav

## Outputs / evidence

For every invocation, the response must include:

1. **Register**: chosen register, one-sentence justification
2. **Anchor(s)**: named industry references with the specific patterns being borrowed
3. **Token table**: concrete values for color/type/spacing/radius/motion
4. **Component anatomy**: list of states designed for each interactive component
5. **Code**: production-grade implementation (the project's framework — React/Vue/HTML/CSS — using its existing conventions)
6. **Slop audit verdict**: pass/fail + any rewrites applied

## Failure / stop conditions

- Stop if the four gates cannot be satisfied (e.g. register is ambiguous, no anchor fits).
- Stop if the project's existing `DESIGN.md` or design tokens conflict with the chosen anchor — surface the conflict, don't override silently.
- Stop if the user provides reference imagery and the chosen anchor contradicts it — re-anchor.
- Do not declare done while the slop audit is failing on a critical finding.

## Auto-chain pairs

- Before this skill fires: if `DESIGN.md` exists in the project, load it. Its tokens are non-negotiable.
- After this skill generates code: ALWAYS chain `ai-slop-audit` for the QA pass.
- After audit applies rewrites: chain `docs-sync` if any skill/standard file was touched.
- If the surface is brand-new and the project has no `DESIGN.md`: queue `design-spec` (or impeccable's `/impeccable teach`) to author one.

## Reference library

- **Registers** (7 audience playbooks): [references/registers/](references/registers/) — `developer-tooling`, `fintech`, `consumer-saas`, `enterprise-admin`, `b2b-data-dense`, `editorial-marketing`, `ai-first`
- **Companies** (13 design systems): [references/companies/](references/companies/) — Linear, Vercel, Stripe, Notion, Raycast, Apple HIG, Carbon, Material 3, Polaris, Atlassian, Primer, Mantine, Spectrum 2, GOV.UK
- **Brands** (6 exemplar products): [references/brands/](references/brands/) — Arc, Notion Calendar, Things 3, Reflect, Superhuman, Airtable
- **Accessibility** (5 chapters): [references/accessibility/](references/accessibility/) — WCAG 2.2 checklist, ARIA patterns, ARIA anti-patterns, keyboard shortcuts, focus management
- **AI patterns** (8 patterns): [references/ai-patterns/](references/ai-patterns/) — streaming text, tool-use card, code apply/reject, artifact panel, reasoning display, model picker, system prompt editor, error states
- **UX research** (4 foundations): [references/ux-research/](references/ux-research/) — NN/g heuristics, Baymard findings, GOV.UK content-first, Material 3 research
- **Components** (44 component anatomy entries): [references/components/anatomy-checklist.md](references/components/anatomy-checklist.md)
- **Performance**: [references/performance.md](references/performance.md) — Web Vitals baselines per surface type + LLM streaming metrics
- **Anti-patterns** (32 entries): [references/anti-patterns.md](references/anti-patterns.md) — includes hard bans, AI-specific patterns, research-backed findings
