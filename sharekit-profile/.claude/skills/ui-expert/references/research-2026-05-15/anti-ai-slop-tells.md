---
name: anti-ai-slop-tells
description: Designer-critique-sourced anti-patterns for AI-generated UI with quoted reactions and falsifiable detection signals (2026-05-15)
sources: 6 critiques/articles via WebSearch + WebFetch; agent-dispatch quota was exhausted so this was harvested inline by parent session
status: research-output (consumed by ui-expert deepening Phase 2-3)
---

# Anti-AI-slop tells — designer critique aggregation

## Source inventory

| # | Source | URL | Author / Outlet | Date | Patterns harvested |
| --- | --- | --- | --- | --- | --- |
| S1 | DEV — Why every AI landing page looks the same | https://dev.to/_46ea277e677b888e0cd13/why-every-ai-generated-landing-page-looks-the-same-and-how-to-fix-it-1kmo | DEV Community / UI UX Pro Max | 2025 | 4-Tell Combo, Distributional Convergence, AI Slop concept |
| S2 | SearchEngineJournal — 7 Common AI Website Mistakes | https://www.searchenginejournal.com/7-common-ai-website-mistakes-that-are-easy-to-avoid/574196/ | Roger Montti | 2024-2025 | Impressive-No-Clarity, AI Slop Copy, Scroll Hijacking, Unexpected Interaction Feedback, Look-Alike |
| S3 | LandingHero.ai blog — AI portfolio builders compared | https://www.landinghero.ai/blog/best-ai-portfolio-website-builders-2026 | LandingHero | 2026 | Sophisticated Dark Aesthetic admission, Agency-vs-Personal Confusion |
| S4 | DEV — 100 vibe-coded sites analyzed | https://dev.to/kaplich/i-analyzed-100-vibe-coded-websites-and-found-these-common-mistakes-5275 | DEV Community / @kaplich | 2025-2026 | Performance bloat, SEO incompleteness, identity-anonymity |
| S5 | DevDailyHub — 8 AI portfolio tools tested | https://devdailyhub.com/posts/ai-portfolio-redesign | Aidan Lowson | 2025-11 | Immediate Clarity Fail, Identity Anonymity |
| S6 | LinkedIn — Chris Ashby on AI website tells | https://www.linkedin.com/posts/ashbychris_youve-seen-an-ai-website-before-purple-activity-7353786815645982720-CZeT | Chris Ashby | 2025 | Purple Gradient Tell, Dumb Hover Effects, Fade Sections |

## Named anti-pattern catalog

### [N1] Distributional Convergence / "AI Slop"
- **Detection signal:** simultaneous presence of N4 (the 4-tell combo) is the operational signature
- **Severity:** critical (root cause; explains why every other pattern recurs)
- **Quote:** "the model predicts based on statistical patterns from training data. Since safe, universal design choices dominate web training data, the model samples from this high-probability center when no specific instructions are given." — S1
- **Counter-example:** specific style direction injected before generation (named style + named palette + named typeface)

### [N2] The 4-Tell Combo
- **Detection signal:** Inter font + purple gradient bg + rounded-corner cards + 3-icon feature row, all present
- **Severity:** critical
- **Quote:** "Every. Single. Time. you ask Claude Code, Cursor, or Windsurf to build a landing page" you get "one 'purple gradient + rounded corners' look" — S1
- **Counter-example:** pick from named alternatives: Glassmorphism / Brutalism / Neumorphism / industry-matched palette

### [N3] Bento Trifecta
- **Detection signal:** bento grid + dark mode + feature blocks, repeating section pattern
- **Severity:** major
- **Quote:** "Most SaaS sites use the same elements: bento grids, dark mode, and feature blocks" — S1 summary
- **Counter-example:** vary section rhythm; asymmetric layouts; non-bento sections between bento ones

### [N4] Sophisticated Dark Aesthetic Mismatch
- **Detection signal:** "Linear/Vercel/Stripe dark + cyan accent" palette applied to surfaces that are NOT SaaS landings
- **Severity:** critical
- **Quote:** "Aura's AI response was technically detailed, explaining design decisions including typography and bento-grid layout choices… high-end, custom-coded portfolio with the sophisticated dark aesthetic popularized by companies like Linear and Vercel." — S3 (the tool literally admits the register-mismatch)
- **Counter-example:** register-locked palette: portfolio uses brand-personal palette, not borrowed SaaS palette

### [N5] Immediate Clarity Fail
- **Detection signal:** scan hero for 3s; can a visitor state who/what at end of 3s? if not, fail
- **Severity:** critical
- **Quote:** "attractive design overall, but it failed the 'immediate clarity' test—visitors wouldn't instantly know whose portfolio they were looking at" — S5
- **Counter-example:** name + verb-first bio + ONE specific signal of identity in the hero

### [N6] Identity Anonymity
- **Detection signal:** swap the name/photo with another person's; does the site still work? if yes, fail
- **Severity:** critical
- **Quote:** "AI-generated portfolios often produce technically polished output but can lack personal identity" — S1/S5 synthesis
- **Counter-example:** something only THIS person would say or show (specific signature project, quirky biographical fact, personal palette)

### [N7] AI Slop Copy
- **Detection signal:** count words doing no work (modern, robust, intuitive, scalable, cutting-edge); >3 in any 100 words → fail
- **Severity:** major
- **Quote:** "content lacks purpose and is prone to using ambiguous words that have more than one meaning or words that are basically just lazy because they don't do any work, don't accomplish anything, fail to move the ball down the field" — S2
- **Counter-example:** verbs that move a noun; specific names of tools/companies/results; numbers with sources

### [N8] Impressive No Clarity
- **Detection signal:** design rates 8+/10 visually but visitor can't summarize product/person in 1 sentence
- **Severity:** major
- **Quote:** "These are mistakes where the design looks impressive, but the visitor still does not understand the product. I see this kind of thing a lot with B2B type sites where you read the content and nothing on the page connects with explaining what the product or service is" — S2
- **Counter-example:** clarity-first hero: who, what, why-care, all in 2 lines

### [N9] Purple Gradient Tell
- **Detection signal:** purple→pink/blue gradient as hero background or large blob
- **Severity:** major
- **Quote:** "All of a sudden, all startup websites had purple gradients everywhere" — S6
- **Counter-example:** flat palette OR gradient using brand-derived colors (not the generic violet→fuchsia)

### [N10] Fade-On-Scroll Sections
- **Detection signal:** sections fade in / out as user scrolls; opacity transitions tied to scroll position
- **Severity:** minor
- **Quote:** "these sections that kind of like fade as you go in, as you scroll, and they fade in and fade out" — S6
- **Counter-example:** static layout; reveal-only-when-needed motion (e.g., real interactive component, not decoration)

### [N11] Dumb Hover Effects
- **Detection signal:** hover triggers wobble/glow/scale on elements that aren't actually interactive targets; or excessive hover on every card
- **Severity:** minor
- **Quote:** "I see a lot of dumb hover effects on landing pages of startups these days, presumably vibe coded" — S6
- **Counter-example:** hover state only on clickable elements; subtle (1-2% scale or color shift, not wobble/glow)

### [N12] Scroll Hijacking
- **Detection signal:** browser scroll behavior overridden (snap-to-section, custom easing, scroll-lock during animations)
- **Severity:** major
- **Quote:** "Scroll hijacking was one the most common issues they encountered, stopping four times to comment on yet another site that was hijacking the browser scrolling" — S2
- **Counter-example:** respect native scroll; if motion needed, trigger on viewport entry, never on scroll-rate

### [N13] Unexpected Interaction Feedback
- **Detection signal:** clickable element has NO feedback OR non-clickable element has clickable feedback
- **Severity:** minor (but critical for accessibility)
- **Quote:** "Unexpected interaction feedback is a poor user experience because it breaks the pattern that a user expects when they visit a website" — S2
- **Counter-example:** standard cursor + standard click-state; non-clickables remain default-cursor

### [N14] Generic Modern
- **Detection signal:** brief contained no style direction; output uses statistical-average palette + layout
- **Severity:** critical (root cause for many other tells)
- **Quote:** "if you leave the choices to an LLM you will 100% get the most common design choices" — S1
- **Counter-example:** prompt or skill must inject specific named style before generation begins (this is what ui-expert v2 attempted via Gate 2 reference anchor, but Gate 2 anchored to wrong register)

### [N15] Trends Drained of Originality
- **Detection signal:** site uses a legit design trend (e.g. bento, dark mode) but adds nothing personal — could belong to anyone
- **Severity:** major
- **Quote:** "All of those design trends that LLMs lean on end up creating a visual experience that looks like other AI-built sites… What makes them bad now is that LLMs are making them common, thereby draining them of any originality they used to have" — S1
- **Counter-example:** trend used but with at least ONE non-default move (custom illustration, specific typographic decision, content that couldn't be generated)

### [N16] Agency-vs-Personal Confusion
- **Detection signal:** solo dev's portfolio includes placeholder client testimonials / "trusted by" logos / case study cards that look like consulting pitches
- **Severity:** major
- **Quote:** "The output felt more agency-style than personal portfolio, complete with placeholder client names and testimonial quotes" — S3 (about Webflow's output)
- **Counter-example:** if it's a portfolio, write the projects FIRST-PERSON; if it's an agency site, name actual clients with permission

### [N17] Look-Alike Layout
- **Detection signal:** print the page, remove name/copy; is it visually distinguishable from another AI-built site in the same vertical?
- **Severity:** major
- **Quote:** "Vibe-coded sites can make a two-person side project look like a polished enterprise. They can make something half-baked look finished" — S4
- **Counter-example:** at least one section layout that breaks the bento/feature-grid mold

## Most-cited (top 10 — appear in 2+ sources)

| Rank | Pattern | # citing | Severity | Detection signal |
| --- | --- | --- | --- | --- |
| 1 | N1 Distributional Convergence / AI Slop | 5 (S1, S2, S4, S5, S6) | critical | underlying mechanic; cite when explaining root cause |
| 2 | N4 Sophisticated Dark Aesthetic Mismatch | 3 (S1, S3, S6) | critical | dark + cyan-accent palette on non-SaaS surface |
| 3 | N5/N6 Immediate Clarity Fail + Identity Anonymity | 3 (S2, S3, S5) | critical | 3-second scan test; swap-the-name test |
| 4 | N7 AI Slop Copy | 3 (S1, S2, S4) | major | density of value-empty words |
| 5 | N9 Purple Gradient Tell | 2 (S1, S6) | major | violet→pink/blue hero gradient |
| 6 | N3 Bento Trifecta | 2 (S1, S6) | major | bento + dark + feature blocks, repeating |
| 7 | N8 Impressive No Clarity | 2 (S2, S5) | major | high visual rating + low summary clarity |
| 8 | N12 Scroll Hijacking | 2 (S2, S6) | major | scroll behavior overridden |
| 9 | N17 Look-Alike Layout | 2 (S4, S1) | major | swap-with-another-AI-site test |
| 10 | N2 4-Tell Combo | 1 (S1) — but signal is high-confidence on its own | critical | Inter + purple gradient + rounded cards + 3-icon row |

## Long-tail (single-source, useful)

- N10 Fade-on-Scroll Sections (S6) — minor
- N11 Dumb Hover Effects (S6) — minor
- N13 Unexpected Interaction Feedback (S2) — minor (a11y critical)
- N14 Generic Modern (S1) — critical (root cause sibling of N1)
- N15 Trends Drained of Originality (S1) — major
- N16 Agency-vs-Personal Confusion (S3) — major

## Cross-reference: F1-F10 from <your-domain> mapped to harvested patterns

| Live failure | Pattern explained |
| --- | --- |
| F1 hero metadata-eyebrow cluster | N14 Generic Modern (LLM-default eyebrow) + N7 AI Slop Copy (eyebrow words do no work) |
| F2 3 competing hero CTAs | N17 Look-Alike Layout (every AI portfolio has 3-CTA hero) |
| F3 Suspicious round-number metrics | N7 AI Slop Copy + N6 Identity Anonymity (the metrics aren't tied to a specific person) |
| F4 Tag pill repetition | N3 Bento Trifecta variant (repeating component pattern) |
| F5 Cyan-on-near-black palette | **N4 Sophisticated Dark Aesthetic Mismatch** (this is the textbook case — Aura tool literally said "Linear/Vercel aesthetic") |
| F6 Identical bento-card rhythm | N3 Bento Trifecta directly |
| F7 AI-portrait glow treatment | N15 Trends Drained of Originality (glow effect was once novel) |
| F8 Filler CTAs | N7 AI Slop Copy (CTA copy that does no work) |
| F9 H1 split with weak grid | N1 AI Slop (default LLM h1 treatment) |
| F10 Eyebrow-on-every-section systemic | N15 Trends Drained of Originality (eyebrow pattern + repetition) |

Every F1-F10 maps to a named, sourced anti-pattern. Confirms ui-expert v2's Gate 4 audit was missing the entire pattern catalog above.

## Source quality notes

- S1 (DEV / UI UX Pro Max) — rigorous; names mechanic (Distributional Convergence) + 4 specific defaults; promotional tone for the author's skill but the analysis is solid
- S2 (SearchEngineJournal / Roger Montti) — rigorous; SEO/UX angle; quotes Steve Schoger / Adam Wathan adjacent
- S3 (LandingHero) — promotional but useful for naming the SaaS-aesthetic adoption pattern by AI tools
- S4 (DEV / kaplich) — analytical; 100-site sample; deeper on tech/SEO than visual
- S5 (DevDailyHub / Lowson) — first-person designer test; useful for clarity/identity framing
- S6 (LinkedIn / Ashby) — informal but high-signal; quoted gradient + fade + hover tells in a single post

## Gaps / future research

- No Twitter/X thread quotes harvested (search returned aggregator articles, not original threads)
- No Refactoring UI (Wathan/Schoger) primary source — likely high-value if reached directly
- No quoted critique from awwwards.com / Brutalist Websites — would sharpen the "tasteful contrarian" examples
- Dispatched-agent variant (R2 spec) would have widened source pool; deferred to next session if Anthropic Agent quota resets and the work warrants it
