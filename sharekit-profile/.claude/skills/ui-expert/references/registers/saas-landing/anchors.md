---
name: saas-landing-anchors
description: Register-scoped reference anchors for ui-expert Gate 2 (register=saas-landing); sourced 2026-05-15
register: saas-landing
status: full
---

# SaaS landing — reference anchors

## Anchors (5)

### 1. Linear — https://linear.app
- **Sub-niche:** Developer-tooling SaaS, precision-engineered, dark-first, monospace-adjacent.
- **When to use this anchor:** SaaS landing where the product is an internal tool (issue tracker, project manager, dev console) targeted at engineers. Use for products designed to be *used daily* by technical founders and teams, not one-time purchasers.
- **Visual signature (1-2 sentences):** Dark-first interface (near-black background with blue tint), monospace-adjacent typography (Geist Sans, not plain Inter), blurple accent (oklch 0.62 0.18 265), minimal decoration. 36px command palette rows, tight sidebar row height (28px idle, 36px hover), zero spring animation.
- **What it does that other SaaS landings DON'T:** Hero sells the product's *speed* and *precision* through dark interface and tight spacing, not through motivational copy. Command palette (Cmd+K) is the navigation hero, not a feature callout. CTA discipline: no button stacks, one primary action per section. Colophon-style tech credits signal engineering credibility.

### 2. Vercel — https://vercel.com
- **Sub-niche:** Developer-tooling marketing + infrastructure, Swiss-grid precision, monochrome with one accent.
- **When to use this anchor:** SaaS landing where the target is infrastructure, deployment, or next-gen tooling aimed at technical founders and CTOs evaluating competitors. Clean, credible visual language over trend-chasing. Suitable for free-tier or freemium product launches.
- **Visual signature (1-2 sentences):** Pure monochrome (near-white or near-black with brand-tinted neutrals), negative tracking on large headlines (-0.04em at 72-96px), signature 24px grid background at opacity 0.3-0.4 (subliminal structure, not visible lines). Geist Sans typography with sharp ease-out motion (120-200ms, no bounce).
- **What it does that other SaaS landings DON'T:** Grid background acts as visual architecture without competing with content. Typography uses negative tracking to feel sharp and engineered, not soft. Hero section vertical padding is generous (96-128px), not squeezed. CTA is minimal: one accent color used purposefully, never as a gradient.

### 3. Stripe — https://stripe.com, https://dashboard.stripe.com
- **Sub-niche:** Fintech / payments / money-movement, information-dense, legible depth.
- **When to use this anchor:** SaaS landing targeting CTO/CFO personas evaluating payment or fintech tooling. Product sells credibility and *precision*, not innovation theater. API-heavy or documentation-heavy product marketing (shows code examples as confidence signal).
- **Visual signature (1-2 sentences):** One purple accent (oklch 0.55 0.20 270, committed and restrained), off-white background with subtle gradient hero (only on marketing page hero, never on dashboard), generous typography scale (56-72px hero, tabular-nums on numbers). 8-12px spacing, 8px card radius, 1px borders on cards (no shadows).
- **What it does that other SaaS landings DON'T:** Animated gradient appears *only* in hero of marketing page as a confidence signal, never on product dashboard. Code examples are formatted as credibility props, not feature callouts. KPI cards use asymmetric visual weight (one leads the eye, others step down), not identical bento grids. Numbers always use tabular-nums variant for alignment signal.

### 4. Resend — https://resend.com
- **Sub-niche:** Developer-tooling SaaS, email API, code-first marketing.
- **When to use this anchor:** SaaS landing targeting engineers and technical founders for code-first products (APIs, SDKs, libraries). Product marketing emphasizes developer experience and shipping speed over enterprise features.
- **Visual signature (1-2 sentences):** Clean minimalist typography, code examples embedded directly in prose (not isolated blocks), subtle accent color for links and CTAs, generous whitespace. Dark or light mode available, each internally consistent. Prose-heavy marketing copy paired with short code snippets showing real usage.
- **What it does that other SaaS landings DON'T:** Marketing narrative stays close to developer workflow — copy talks about "shipping faster," "fewer API calls," tangible developer wins. Code examples are real, working samples, not pseudo-code. No marketing jargon ("solutions," "synergy," "leverage") — every claim is code-backed or metric-linked.

### 5. Loom — https://loom.com
- **Sub-niche:** Creator-tools SaaS, visual-first, motion as feature.
- **When to use this anchor:** SaaS landing where the product's core value is *motion* or *video* (screen recording, animation, async communication tools). Product targets both technical and non-technical users (engineers + PMs + marketers).
- **Visual signature (1-2 sentences):** Hero features video or animated examples of the product in action. Typography is warm and welcoming (generous line height, serif or rounded sans), single bold accent color. Sections feature embedded videos or animated GIFs showing product workflow, not static screenshots.
- **What it does that other SaaS landings DON'T:** Video *is* the marketing material, not just a decoration. Testimonials or case studies use video clips, not static quotes. Motion and animation demonstrate the product's core value, not add polish. Copy is conversational ("Watch this 30-second video") rather than features-list-first.

## When to use this register

SaaS-landing register applies when: the brief calls for a marketing page, product landing page, or public-facing homepage for a SaaS product. The goal is conversion (free trial signup, contact sales, API key signup). Register assumes a pre-login surface where the audience is evaluating whether to try the product. Does NOT apply to post-login product UI, documentation sites, or internal dashboards.

## What this register forbids

- No hero section with only text and no video or high-quality imagery (SaaS hero is a visual anchor).
- No social proof section buried below the fold (testimonials, logo wall, or user-count badge should appear in top 50% of page).
- No soft CTA button text ("Learn more") without urgency language ("Start free trial," "Book demo").
- No 4+ primary CTAs competing for equal visual weight (marketing pages need narrative focus, one conversion point per section).
- No marketing copy with buzzword soup ("We craft experiences," "synergy," "passionate about," "forward-thinking").
- No identical card grid (icon + heading + 2 lines repeated ×N); use asymmetric layout or comparison table.
- No generic bento-grid hero (3×2 colored tiles); use editorial split-screen, code-as-marketing, or single dominant hero.
- No autoplay video without explicit user control or mute default.
- No exit-intent modal or newsletter popup interrupting the narrative flow.
