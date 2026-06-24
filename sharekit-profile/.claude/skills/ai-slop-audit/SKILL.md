---
name: ai-slop-audit
description: Standalone post-generation QA pass that lints any frontend output (HTML/JSX/Vue/Svelte/CSS) against the named anti-pattern catalogue and proposes specific rewrites with severity rating. Use after any UI generation that didn't pass through `ui-expert` (so existing `impeccable`, `frontend-design`, hand-written code, AI-pasted code, contractor work) to catch the "AI made that" tells. Use proactively when output reads as templated, generic, or stock. Returns a verdict — pass / warn / fail — plus a diff-style list of findings, each with diagnosis, evidence, and the specific rewrite from the catalogue. Not a full design critique — narrow lint against known-slop patterns.
version: 1.0.0
user-invocable: true
argument-hint: "[target file or pasted code]"
metadata:
  owner: lucas
  tier: durable
---

# ai-slop-audit

A narrow, opinionated post-generation lint. Reads a piece of frontend output and audits it against the 20 named anti-patterns in [`ui-expert/references/anti-patterns.md`](../ui-expert/references/anti-patterns.md). Returns specific findings, not vibes.

## When to invoke

Auto-invoke:

- Immediately after `ui-expert` writes code (Gate 4 of that skill)
- After `impeccable` or `frontend-design` produce a screen and the user says "still feels generic"
- When the user says any of: "audit this UI", "lint for AI slop", "does this look generic", "make this less AI-ish"
- After pasting code from another LLM or template into the repo

Do not invoke for:

- Full UX critique (that's `impeccable critique` or `impeccable audit`)
- Accessibility-only review (that's `impeccable audit`)
- Visual design audit beyond the named anti-patterns (that's `impeccable` with ui-audit reference)

## Inputs

Accepts one of:

1. **File path** — read the file and audit it
2. **Glob** — audit each match, aggregate by file
3. **Pasted snippet** — audit the snippet
4. **URL of a live preview** — open with playwright/agent-browser, screenshot, then audit screenshot + DOM
5. **No argument** — audit the most recent changes in the working directory (`git diff --name-only HEAD` filtered to UI files)

## The audit procedure

For each input:

### 1. Identify the surface type

Classify what's being audited:
- Marketing page (landing, pricing, docs)
- Product page (dashboard, settings, app surface)
- Component (button, card, table, etc.)
- Email or rich content

The surface affects which anti-patterns apply most heavily.

### 2. Lint pass — sweep all 20 patterns

Load [`anti-patterns.md`](../ui-expert/references/anti-patterns.md). For each pattern, check the input:

| # | Pattern | What to grep for |
|---|---|---|
| 1 | Purple-blue gradient | `gradient.*purple.*blue`, `from-purple-.*to-blue`, `from-violet-.*to-`, named hex pairs `#8b5cf6.*#3b82f6` |
| 2 | Gradient text | `bg-clip-text` + `bg-gradient`, `-webkit-background-clip: text` + gradient |
| 3 | Bento grid hero | 3×2 grid in `<main>` first viewport with `<h1>` above + tile array (5-6 elements with icon + heading + body each) |
| 4 | Hero-metric card template | 4× identical card with: large number + small label + arrow icon + small chart inside hero/dashboard top |
| 5 | Identical card grid | `.map(...)` rendering identical card components in a grid where the cards have no emphasized variant |
| 6 | Glassmorphism default | `backdrop-blur` + `bg-white/10` or `bg-black/10` on cards (not just chrome) |
| 7 | Modal as first thought | `<Dialog>` or `<Modal>` used for non-destructive actions like Edit, Settings, View |
| 8 | Side-stripe border | `border-l-[2-8]px` or `border-left.*solid.*\d+px` on cards/callouts |
| 9 | Em dashes | `—` or ` -- ` in user-facing strings (JSX text, string literals in copy props) |
| 10 | Default Tailwind shadow | `shadow-md`, `shadow-lg`, `shadow-xl` on cards (more than 2 instances) |
| 11 | Default font stack | `font-family.*Inter`, `font-family.*Roboto`, `font-family.*Arial`, `font-sans` with no custom config, OR Tailwind default `font-sans` |
| 12 | Centered single-column | `max-w-*` + `mx-auto` on every section, no asymmetric layout |
| 13 | Carousel hero | `<Carousel>`, `<Swiper>`, `<EmblaCarousel>` in hero region |
| 14 | Trusted-by color | "Trusted by" / "Used by" text near `<img>` logos > 48px tall with full color |
| 15 | Loading spinner | `<Spinner>`, `<Loader2 className="animate-spin">` etc. in full-page or main-content position |
| 16 | Generic CTAs | Button text matching `Get Started`, `Learn More`, `Click Here`, `Try Now`, `Sign Up` (alone) |
| 17 | Empty platitudes | UI strings: `Welcome back!`, `Let's get started!`, `Great choice!`, `Awesome!`, `You're crushing it!` |
| 18 | Equal-weight | Same heading weight throughout, same card sizes, uniform section padding |
| 19 | Stock illustration | `<img>` src matching `humaaans`, `undraw`, `openpeeps`, generic SVG silhouettes |
| 20 | Generic 3-tier pricing | Three identical card components in a pricing section, no emphasized variant |

### 3. Severity rating

Per [anti-patterns.md](../ui-expert/references/anti-patterns.md):

- **Critical** (blocks ship): #1, #2, #3, #4, #6, #11, #16, #20
- **Major** (rewrite required): #5, #7, #9, #10, #12, #15, #17, #18, #19
- **Minor** (recommend rewrite): #8, #13, #14

### 4. Output format

```
═══════════════════════════════════════════════
ai-slop-audit — <file or surface name>
═══════════════════════════════════════════════
Surface type: <marketing | product | component | email>
Verdict: <PASS | WARN | FAIL>
  • PASS: 0 critical, ≤ 2 minor
  • WARN: 0 critical, 1-3 major or > 2 minor
  • FAIL: ≥ 1 critical OR > 3 major

Findings: <N total>

──── CRITICAL ────
[#11] Default font stack
  Evidence: app/layout.tsx:14 — `font-family: 'Inter', system-ui, sans-serif`
  Diagnosis: Inter is the most-trained-on font in the training data; reads as default.
  Rewrite: Pick a font with character. For this register (developer-tooling):
    → Geist Sans, ABC Diatype, or Söhne for body
    → Geist Mono for code
  Suggested patch:
    - font-family: 'Inter', system-ui, sans-serif;
    + font-family: 'Geist Sans', system-ui, sans-serif;
  Reference: [companies/vercel.md](../ui-expert/references/companies/vercel.md)

──── MAJOR ────
[#7] Modal as first thought
  Evidence: app/settings/page.tsx:42 — <Dialog> used for "Edit profile"
  Diagnosis: Edit profile is a non-destructive multi-field action; modal is the lazy choice.
  Rewrite: Slide-over panel from the right (Stripe/Linear pattern) OR inline edit (Notion).
  Suggested replacement component: <Sheet side="right"> or <Drawer>
  Reference: anti-patterns.md #7

──── MINOR ────
[#14] Trusted-by logos in color
  Evidence: app/page.tsx:88 — 6 brand logos at 64px height, full color
  Diagnosis: Visual noise; clashes with Vercel-monochrome aesthetic that the rest of the page uses.
  Rewrite: Monochrome (filter: grayscale(1)) at 24-32px height with 60-70% opacity.

──── PASS NOTES ────
✓ #1 Generic gradient — none detected
✓ #2 Gradient text — none detected
✓ #3 Bento grid hero — hero uses single asymmetric split, good
✓ #4 Hero-metric template — KPIs use Stripe-asymmetric pattern, good
… (etc., abbreviated)
═══════════════════════════════════════════════

Next: 1 critical → must rewrite before shipping.
        2 major → recommended rewrite this iteration.
        1 minor → flag for later polish.
```

### 5. Apply rewrites (when authorized)

When user says "apply" or "fix" or "rewrite", apply the suggested patches inline using Edit tool. Re-audit after applying to confirm zero criticals.

When the user says "report only", stop after the verdict.

Default behavior: produce the verdict, ask "Apply rewrites?" before editing files.

## Calibration: false positives

The lint has known imperfections. Calibrate when:

- **#11 Inter is genuinely committed to**: if the project's `DESIGN.md` or `tailwind.config` explicitly commits to Inter as a brand choice (rare but valid), downgrade #11 to "verified intentional" and skip.
- **#9 Em dash in non-UI strings**: em dashes in JSDoc comments, README, or developer-facing code are fine. Only flag in user-facing strings.
- **#10 Default shadow used 1-2 times**: a single `shadow-lg` on a hero CTA might be intentional. Only flag when defaults are used as the *primary* elevation strategy (> 2 instances).
- **#15 Inline button spinner**: spinner inside a submit button while saving is fine. Only flag when spinner is the page-level loading treatment.

## Reading the catalogue

This skill is the *executor* of [`ui-expert/references/anti-patterns.md`](../ui-expert/references/anti-patterns.md). When the catalogue is updated (new patterns, refined rewrites), this skill picks up the change automatically — no skill code change needed.

If a new slop pattern is identified during real work that's not in the catalogue, add it to the catalogue first, then re-invoke this skill.

## Auto-chain pairs

- After `ui-expert` Gate 4 → this skill is the audit
- After `impeccable` `craft` / `bolder` / `polish` → this skill catches what impeccable misses
- After `frontend-design` → this skill is the slop check before declaring done
- This skill's "fix" mode → chain `docs-sync` if any skill/standard file was touched during rewrite

## Outputs / evidence

- Surface type classified
- 20-pattern lint result
- Findings list with file:line evidence, diagnosis, rewrite, reference link
- Verdict: PASS / WARN / FAIL
- Patch suggestions ready to apply
- Updated verdict after any applied rewrites

## Failure / stop conditions

- Stop and report if the input is not parseable as code (binary, image without DOM access).
- Stop if there are no UI patterns to lint (e.g. the file is pure server-side logic).
- Do not declare PASS while critical findings remain unfixed.
- Do not auto-apply rewrites without explicit user authorization unless invoked as Gate 4 of `ui-expert` (which authorizes the fix).
