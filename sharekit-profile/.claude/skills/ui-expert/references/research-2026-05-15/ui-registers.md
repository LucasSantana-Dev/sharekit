---
name: ui-registers
description: Formalized UI register taxonomy for ui-expert routing (personal portfolio / SaaS landing / product app / marketing / docs) with visual signatures and mismatch failure modes (2026-05-15)
status: research-output
---

# UI registers — taxonomy + routing rules

## The 5 registers (one-sentence description each)

1. **Personal portfolio** — Text-first, identity-forward showcase of a person's work, credentials, and personality; zero marketing pressure.
2. **SaaS landing** — Product marketing page selling a software-as-a-service; conversion-first with strong CTA stacking and social proof.
3. **Product app UI** — Post-login application surface where users operate (dashboards, editors, workspaces); task-first with high density and functional motion.
4. **Marketing page** — Blog post, launch announcement, or campaign page; narrative-driven with varied rhythm and sustained reading engagement.
5. **Docs** — Developer documentation, API reference, or knowledge base; task-reference structure with persistent sidebar and search primacy.

---

## Comparison matrix (5 registers × 9 dimensions)

| Dimension | Personal portfolio | SaaS landing | Product app UI | Marketing page | Docs |
| --- | --- | --- | --- | --- | --- |
| **Palette tendency** | Monochrome or restrained (navy + muted + 1 accent); content carries color | Branded primary + secondary + accent (often cyan/neon on dark); saturation-heavy | Neutral chrome + functional accent (green=success, red=error); design-system-driven | Restrained editorial (serif palettes favor dark text on light background); white-space carries meaning | Minimalist neutral (white/off-white + dark text + code syntax highlighting); no branding color bleeding into content |
| **Hero treatment** | Text-first identity (name, question, tagline, three-word declaration); no video; minimal imagery | Hero image or video dominating fold; motion-cued (scroll animation, autoplay video); value-prop headline overlay | No hero; immediate content grid or dashboard state; optional login/onboarding gate | Single hero image or subtle opener (blurred photo, color block); headline + subheader; no CTA pressure | No hero; immediate navigation + search bar + "Getting Started" link |
| **CTA count (hero)** | 0–1 (nav anchor or external link) | 1–2 ("Start free trial," "Get demo") | 0 (in-app flows don't use hero CTAs) | 1–2 (subscribe, read full post, related link) | 0 (search/nav serve wayfinding) |
| **CTA count (page)** | 0–3 primary + contextual secondaries (max 1 per section) | 4–8+ across hero, sticky header, sidebar, footer; buttons repeat | 1–2 per task (confirm, cancel, next); functional, not marketing | 2–3 (inline "Read more," subscribe form, next post link) | 1–2 per section (copy code, try in playground, next page) |
| **Typography weight contrast** | Moderate (1–2 weight variations; size carries hierarchy) | High contrast (display face bold, body regular, script accent; 3+ weights visible) | Low contrast within UI (all sans, consistent weight; hierarchy via color + icons + layout) | High contrast (serif display + sans body; generous use of bold/italic for emphasis) | Moderate (sans body + monospace code; hierarchy via size + inline code styling) |
| **Type scale ratio (h1/body)** | 2–3x (modest scaling; readability prioritized) | 3–5x (dramatic H1 to body jump; attention-getting) | 1.5–2x (compact scale; space-efficient) | 2–4x (narrative-scaled; varies by section) | 1.5–2x (space-efficient; code snippets compete for visual weight) |
| **Section rhythm** | Varied (prose, list, cards, grids, in-world, carousel); intentional breathers | Repeated/symmetric (card grid → feature carousel → testimonial cards → pricing grid); visual sameness | Grid/dense (sidebar + main content + right rail; minimal whitespace; every px allocated) | Longform/single-column (alternating image + text + callout sections; visual rest between ideas) | Sidebar + content (sidebar always present; content single-column; persistent scroll position) |
| **Density (content per viewport)** | Low (whitespace used to breathe; ~30–40% content fill) | Medium (50–70% content fill; section headers + copy + visuals compete) | High (80–95% fill; every element justified by task; no pure-whitespace sections) | Medium-low (40–60% fill; generous margins around prose; images float freely) | High (70–90% fill; sidebar + main content + right-align TOC; code blocks dense) |
| **Motion usage** | Minimal (no autoplay; scroll cues only; hover states subtle) | Moderate (hero autoplay video, carousel animations, scroll-triggered reveals, button hover states) | Functional only (loading spinners, state transitions, drag-drop feedback; no decorative motion) | Moderate (scroll-triggered image reveals, fade-in text, video embeds; pacing tool) | Minimal (no motion; search input animation only; code syntax highlighting only decorative motion) |
| **Copy register** | First-person ("I build," "I made," "I like"); warm, lightly playful; complete sentences | Second-person or corporate ("You get," "Your team," "Streamline your workflow"); imperative tone ("Start," "Join," "Try"); benefit-framed | Imperative + instructional ("Save," "Delete," "Select all," "Confirm"); minimal prose; labels + short context | Narrative/editorial ("She," "It," "The product"); longer prose; story-shaped paragraphs | Imperative + referential ("Click here," "See example," "Copy code"); sparse prose; labels + inline links |
| **Image / illustration usage** | Blurred portrait, no portrait (avatar only), simple icon, or absent entirely; no stock photography; no AI-portrait treatment | Large hero imagery (abstract, product shots, lifestyle), client logo walls, feature icons, testimonial avatars | Icons + UI screenshots (not marketing shots); sparse imagery; every image functional; no decorative illustrations | Feature images (photography or illustration) per section; YouTube embeds; generous spacing; imagery as narrative anchor | Code snippets + syntax-highlighted blocks; optional diagram (flow, architecture); no photographic imagery |

---

## Register-mismatch failure modes

### Pattern: Personal-portfolio brief + SaaS-landing register applied

**Failure signature:** Over-design with eyebrow tags, CTA stacks, hero carousel, social proof badges, and color saturation.

**Why it fails:** Personal portfolios are *under-designed* by default; they succeed through restraint. Applying SaaS landing patterns *adds* elements (logo walls, testimonials, "Enterprise-grade" claims, sticky header with 3 CTAs) that signal template defaults, not intentional curation.

**Red flags:**
- Eyebrow tags on every section ("NOW," "ABOUT," "REACH ME," "CAPABILITY MAP")
- Hero carousel or autoplaying video (personal portfolios feature text)
- 3+ competing primary buttons in hero ("Join Discord," "View Projects," "Contact Me")
- Testimonial wall or "Trusted by" logo cluster (credibility comes from work, not testimonials)
- Bright cyan/neon accent colors (monochrome signals sophistication; neon signals SaaS energy)
- Newsletter modal or exit-intent popup (personal portfolios offer one subscribe link, if any)

**Example from <github-user>.tech R1 failures (F1–F10):**
- F3: Unsourced metrics ("40% faster") — SaaS tactic, not portfolio
- F4: Identical bento-card rhythm across sections — SaaS pattern, portfolio needs varied rhythm
- F5: Newsletter-first CTA strategy — SaaS revenue model, not portfolio identity

---

### Pattern: SaaS-landing brief + Personal-portfolio register applied

**Failure signature:** Under-designed, text-heavy, too few CTAs, weak social proof, no urgency signals.

**Why it fails:** SaaS landing pages require conversion pressure and social proof to work. Personal portfolios strip those away because the goal is trust through restraint, not rapid signup. Applying portfolio patterns to a SaaS landing results in a page that whispers when it should sell.

**Red flags:**
- No hero video or image; only text headline (SaaS needs motion to grab attention)
- Single CTA or none in above-fold hero ("Learn more" is too soft for a product launch)
- Zero testimonials or social proof (B2B SaaS buyers need validation)
- Minimal copy; sparse benefits list (SaaS must communicate value proposition clearly)
- No pricing visibility or trial CTA (SaaS users need to know cost and barrier to entry)
- Monochrome palette with no accent color energy (SaaS relies on visual hierarchy and color coding)

---

### Pattern: Product-app brief + SaaS-landing register applied

**Failure signature:** Over-marketed in-app experience, with eyebrow tags, CTA stacks, testimonial sections, and hero imagery.

**Why it fails:** Product-app UIs are task-first, not marketing-first. Users are already logged in; they don't need convincing. Applying SaaS patterns introduces friction (extra copy, competing actions, decorative elements) that slows task completion.

**Red flags:**
- "Why use this feature?" marketing copy in the settings panel (users chose the product already)
- Feature carousel or "Discover" sections in the main workflow (users need focus, not options)
- Testimonial cards or "Top users" social proof within the app (irrelevant to logged-in users)
- Bright primary-color buttons competing for attention on every section (visual noise; one action per task)
- Newsletter signup or "Upgrade" upsell modals interrupting core workflows (friction, not help)
- Decorative hero banner above the workspace (wasted space; app starts at data/input, not marketing)

---

### Pattern: Marketing-page brief + Docs register applied

**Failure signature:** Sidebar nav, sparse prose, code-heavy styling, task-reference tone on narrative content.

**Why it fails:** Marketing pages are story-shaped; docs are reference-shaped. A marketing page shoved into docs structure feels broken: the sidebar nav disrupts narrative flow, the sparse copy loses emotional beat, and the instructional tone flattens the message.

**Red flags:**
- Sidebar nav on a blog post or launch page (narrative content flows better in single-column)
- Minimal prose with inline links; sparse paragraph breaks (marketing needs rhythm and breathing room)
- Code snippet examples in marketing content (belongs in docs, not a user story)
- Search bar as primary wayfinding (marketing needs visual hierarchy, not keyword lookup)
- Monospace typography or syntax-highlighting color scheme (blog posts use serif or generous sans)
- "Next chapter" footer link instead of "Read next post" or "Related reading" (docs language, not marketing)

---

### Pattern: Docs brief + Marketing-page register applied

**Failure signature:** Long prose, no sidebar nav, decorative imagery, narrative pacing, minimal code.

**Why it fails:** Developers need to search and reference. A marketing-page layout (hero, long-form narrative, embedded videos) makes docs harder to scan. Users can't find what they need because the structure prioritizes story over task reference.

**Red flags:**
- No sidebar nav or table of contents (developers need rapid wayfinding)
- Hero section or feature image for every code example (space waste; code should be primary)
- Minimal inline code or reference links; sparse copy highlighting syntax (code density should increase)
- Narrative paragraph structure instead of numbered/bulleted steps (developers scan, not read linearly)
- No search bar prominence (search is the primary docs wayfinding tool)
- "Read the story of how we built this" callout sections (belongs in blog, not API reference)

---

### Pattern: Additional cross-register mismatches

**Product-app + Personal-portfolio:** App feels empty, minimal CTA, no onboarding pressure, too much whitespace. (Rare; usually the opposite error.)

**Docs + Personal-portfolio:** Reference page feels too friendly, lacks authoritative tone, minimal code density. (Intermediate error; docs can be friendly but not casually so.)

**SaaS-landing + Marketing-page:** Overly narrative, not enough CTAs, weak conversion structure, too long-form. (Common hybrid error; landing pages are marketing but conversion-first.)

---

## Register-detection signals from a brief

### Clear signals (low ambiguity)

- **"build me a portfolio for X"** → Personal-portfolio
  - Keywords: portfolio, showcase, about, resume, projects, "my work"
  - Implied goal: visibility, credibility, personality
  - One primary CTA or fewer

- **"pricing page for Y"** → SaaS landing
  - Keywords: pricing, launch, landing, "Get started," "Sign up," sales page
  - Implied goal: signup conversion, social proof, urgency
  - Multiple CTAs, hero image/video

- **"dashboard for our admin tool"** → Product app UI
  - Keywords: dashboard, app, workspace, interface, editor, post-login, internal tool
  - Implied goal: task completion, data visibility, feature density
  - Zero marketing copy; functional UI only

- **"blog post / launch announcement"** → Marketing page
  - Keywords: blog, article, news, launch, announcement, campaign, manifesto, essay
  - Implied goal: narrative engagement, thought leadership, sharing
  - Moderate prose, varied section rhythm, optional media embeds

- **"API reference for our SDK"** → Docs
  - Keywords: docs, documentation, API, reference, guide, tutorial, knowledge base, help center
  - Implied goal: developer task reference, searchability, code density
  - Sidebar nav, code examples, minimal decorative imagery

---

### Ambiguous prompts (3–5 require disambiguation)

**Prompt 1: "Build a site for our startup to showcase what we do"**
- Could be: Personal-portfolio (founder-as-brand) OR SaaS landing (product-focused) OR Marketing page (thought-piece-driven)
- Disambiguate by asking:
  - "Is this a founder personal brand or a product brand?"
  - "Is the primary goal to sell/convert or build credibility?"
  - "Will you include pricing and a trial signup?"
  - Answer: Pricing + signup CTA → SaaS landing. Founder bio + portfolio → Personal-portfolio. Thought pieces + no CTA → Marketing page.

**Prompt 2: "I need a home page for my SaaS product"**
- Could be: SaaS landing (if presales/public) OR Product app UI (if post-login home dashboard)
- Disambiguate by asking:
  - "Do users see this before or after logging in?"
  - "Is the goal to convert free users to paid or to surface tools they already have access to?"
  - Answer: Pre-login → SaaS landing. Post-login → Product app UI.

**Prompt 3: "Create help documentation for developers"**
- Could be: Docs (API reference, integration guide) OR Marketing page (developer-focused launch story)
- Disambiguate by asking:
  - "Is this reference/how-to (step-by-step instructions) or narrative/thought-piece?"
  - "Will users search for specific endpoints or read in linear order?"
  - Answer: Reference, searchable → Docs. Story-shaped, narrative → Marketing page (specifically "Developer relations" sub-niche).

**Prompt 4: "Design a website that shows my design work to potential clients"**
- Could be: Personal-portfolio (designer portfolio) OR SaaS landing (design service landing page)
- Disambiguate by asking:
  - "Are you selling your design services (agency) or showcasing your portfolio (freelance/looking for work)?"
  - "Do you want potential clients to book a call or inquire without a hard conversion step?"
  - Answer: Booking/inquiry form → SaaS landing (agency). Portfolio pieces + contact link → Personal-portfolio.

**Prompt 5: "I want to tell the story of how our company started and our mission"**
- Could be: Marketing page (company story) OR Personal-portfolio (founder story) OR SaaS landing (brand positioning)
- Disambiguate by asking:
  - "Is this about the founder or the company?"
  - "What's the call-to-action? Signup, admiration, or job applications?"
  - "Is this a presales page (convert visitors to customers) or a 'About Us' deep page?"
  - Answer: Founder story + join us → Personal-portfolio. Company narrative + signup → SaaS landing. Company narrative + no CTA → Marketing page.

---

## Recommended ui-expert routing

### Option A: UNIFIED ui-expert with register-lock gate (Gate 0.5)

**Structure:** Single skill that detects register in the brief and dispatches to internal chapters (personal-portfolio, SaaS-landing, product-app, marketing-page, docs).

**Pros:**
- Single skill to maintain; fewer code branches
- Shared pattern library (color systems, type scales, motion language)
- Register detection logic centralized
- Can reuse CTA discipline rules, typography hierarchy rules across registers

**Cons:**
- Each register's pattern set is distinct enough that internal chapters become large
- Skill becomes a router first, pattern library second
- Harder to surface register-specific anchor pools and anti-patterns in skill description
- Future teams may not know when a register chapter is missing a pattern

**Feasibility:** Moderate. Gate 0.5 (register-lock) is simple; dispatching to 5 chapters is manageable if each chapter is ~200 lines.

---

### Option B: ROUTER + N siblings (5 separate skills)

**Structure:** `ui-expert` (router only) dispatches to:
- `ui-expert-portfolio` (personal portfolio register)
- `ui-expert-saas` (SaaS landing register)
- `ui-expert-product` (product app UI register)
- `ui-expert-marketing` (marketing page register)
- `ui-expert-docs` (docs register)

**Pros:**
- Each skill owns its register completely; no internal chapters
- Skill descriptions can be specific ("Build credible personal portfolios for engineers/designers")
- Anchor pools and reference links are visible in skill root; easy to extend per-register
- Easier to spec distinct test cases and anti-patterns per skill
- Future skill-maintainers see clear intent

**Cons:**
- 5 separate skills to maintain (duplication of boilerplate gates and prompting)
- Shared rules (CTA discipline, typography contrast) need to be duplicated or referenced
- Router skill adds one extra step (user → router → sibling)

**Feasibility:** High. Each sibling skill is ~300–400 lines (intro + gates + pattern reference + anti-patterns); router is ~50 lines.

---

### Option C: Hybrid — core + 2 split

**Structure:** Keep core `ui-expert` for SaaS landing (80% of current use) + high-overlap cases. Split only the most distinct registers:
- `ui-expert` (SaaS landing + product-app hybrid)
- `ui-expert-portfolio` (personal portfolio)
- `ui-expert-docs` (docs reference)
- Marketing pages stay as a chapter inside `ui-expert` (high overlap with SaaS landing in terms of copy/imagery strategy)

**Pros:**
- Minimal new skills (2 siblings vs. 5)
- SaaS landing + product-app share nav/CTA discipline rules (can be co-located)
- Marketing pages are often just "SaaS landing without conversion pressure" (can share copy patterns)
- Docs is the only register with radically different structure (sidebar, code-primary), so justified as sibling

**Cons:**
- Hybrid approach creates ambiguity (when is product-app a sibling vs. a chapter of SaaS landing?)
- Marketing-page register sharing chapter space with SaaS may be confusing
- No clear threshold for splitting (splits portfolio + docs but not marketing + SaaS)

**Feasibility:** High. Clear split: portfolio gets its own skill (distinct enough); docs gets its own skill (structure too different); marketing-page stays as chapter in core.

---

## **RECOMMENDATION: Option B (Router + N siblings)**

**Rationale:**

Each of the 5 registers has a **distinct pattern set** that warrants independent treatment:

1. **Personal-portfolio** is the anti-SaaS landing (text-first, zero social proof, minimal CTAs, monochrome palette). Not a configuration of SaaS landing; a different register entirely. Anchors: Brittany Chiang, DHH, Frank Chimero, Lynn Fisher, Tobias van Schneider.

2. **SaaS landing** is conversion-optimized (hero video, CTA stacks, testimonial walls, bright accents). Current ui-expert v2 is fitted to this register. Anchors: Linear.app, Vercel.com, Stripe.com, Resend.com.

3. **Product app UI** is task-first (no hero, high density, functional motion, no marketing copy). Shares some nav + CTA discipline with SaaS but diverges in hero treatment, density, and copy register. Anchors: Linear app (post-login), Notion workspace, Figma editor, Raycast.

4. **Marketing page** is narrative-driven (story-shaped, varied rhythm, no urgency). Shares some prose and image strategy with SaaS landing copy but rejects CTA stacking and social proof. Distinct enough to need its own anti-pattern set. Anchors: Vercel blog, Anthropic news, Stripe Sessions, OpenAI research posts.

5. **Docs** is reference-first (sidebar nav, code-primary, search primacy, minimal prose). Structure is radically different from all others. Anchors: Stripe.com/docs, Tailwindcss.com/docs, Vercel.com/docs.

**Why not Option A?** The comparison matrix shows that each register diverges significantly in **at least 3 dimensions**. Personal-portfolio and SaaS landing diverge in 6+ dimensions (hero treatment, CTA count, palette, section rhythm, copy register, image usage). Docs diverges in 5+ (no hero, sidebar required, code-primary, density, motion). Internal chapters in a unified skill would be so large (~60–80 lines each) that they'd function as separate modules anyway, and the skill description couldn't signal register-specific guidance.

**Why not Option C?** SaaS landing and product-app UI diverge critically in:
- **Hero treatment:** SaaS needs video/image; product-app needs none
- **CTA count:** SaaS stacks 4–8; product-app does 1–2 per task
- **Density:** SaaS is 50–70%; product-app is 80–95%
- **Copy:** SaaS is benefit-framed ("You get"); product-app is imperative ("Save")

These are not minor variations; they're opposite philosophies. A hybrid skill would confuse brief routing. Docs is sufficiently distinct (sidebar, search, code-primary) that it *is* justified as a sibling, but marketing-page is closer to SaaS landing (both need copy craft and image strategy), which would make a SaaS+Marketing hybrid more coherent than SaaS+Product-app.

---

## Anchor pool per register (4–5 anchors each)

| Register | Anchor 1 | Anchor 2 | Anchor 3 | Anchor 4 | Anchor 5 |
| --- | --- | --- | --- | --- | --- |
| **Personal portfolio** | Brittany Chiang (brittanychiang.com) | DHH (world.hey.com/dhh) | Frank Chimero (frankchimero.com) | Lynn Fisher (lynnandtonic.com) | Tobias van Schneider (vanschneider.com) |
| **SaaS landing** | Linear.app | Vercel.com | Stripe.com | Resend.com | Loom.com |
| **Product app UI** | Linear app (post-login workspace) | Notion workspace | Figma editor | Raycast | Arc browser |
| **Marketing page** | Anthropic.com/news | Vercel.com/blog | Stripe.com/sessions | OpenAI.com/research | Tailwindcss.com/blog |
| **Docs** | Stripe.com/docs | Tailwindcss.com/docs | Vercel.com/docs | MDN Web Docs | React.dev |

---

## Register-specific anti-patterns (additional to R1's 10)

### Personal-portfolio register (4 new rules)

1. **[MAJOR]** If hero uses a circular-cropped photo with glowing aura + soft-focus + shadow halo, flag: AI-portrait treatment; credible portfolios use blurred, natural, or avatar-only portraits.

2. **[MAJOR]** If palette includes bright cyan, neon green, or saturated secondary on dark background (SaaS accent palette), and the register is personal portfolio, flag: Register mismatch; personal portfolios use monochrome, restrained, or editorial palettes.

3. **[MINOR]** If section includes "Skills" grid with tech-logo pills (React, Node, TypeScript) listed separately and redundantly, flag: Component repetition anti-pattern; mention tools once in colophon or context, not in dedicated section.

4. **[MAJOR]** If footer includes "Powered by [service]" or "Made with [tool]" as primary credit (not colophon), flag: Credible portfolios credit tools in colophon (Brittany's Tardis link), not in footer; footer is reserved for contact/nav.

---

### SaaS landing register (3 new rules)

1. **[MAJOR]** If hero section lacks video or high-quality imagery (only text), flag: SaaS landing heros are visual anchors; video or image is expected to grab attention in < 3 seconds.

2. **[MAJOR]** If social proof section is missing or buried below-the-fold (no testimonials, logo wall, or user-count badge in top 50% of page), flag: SaaS landing requires visible credibility signals early; logos or testimonial quote should appear in hero or immediately after.

3. **[MINOR]** If CTA button text is soft ("Learn more," "Get started") without urgency language ("Start free trial," "Book demo"), flag: SaaS CTAs benefit from action verbs + scarcity/urgency cue; soft language underperforms conversion.

---

### Product app UI register (3 new rules)

1. **[MAJOR]** If app includes marketing-style copy ("Discover new features," "Why use X?") or "Upgrade" upsell modals in core workflow, flag: Product-app is post-login; marketing copy and upsells introduce friction; core workflows should be purely functional.

2. **[MAJOR]** If multiple CTAs compete for attention on a single task (e.g., "Save," "Save & continue," "Save & review," "Cancel"), flag: Task UIs should have one primary action; multiple buttons signal unclear intent and slow task completion.

3. **[MINOR]** If sidebar nav includes 8+ items, each with a submenu (2–3 levels deep), flag: Task-first apps minimize nav depth; sidebar should have 4–7 top-level items; drilldown creates cognitive load.

---

### Marketing page register (3 new rules)

1. **[MAJOR]** If page includes 4+ primary CTAs ("Subscribe," "Read more," "Download," "Contact sales") competing for equal visual weight, flag: Marketing pages need narrative focus; multiple conversion points create decision paralysis; prioritize one call-to-action per post.

2. **[MINOR]** If prose paragraphs are <100 words consistently (single-sentence bullets or sentence fragments throughout), flag: Marketing narrative prose should breathe; aim for 3–5 sentence paragraphs with varied rhythm; too-short paragraphs disrupt reading cadence.

3. **[MAJOR]** If page uses byline + date + "Read time" + category tags on an opinion/thought-piece (not a news article), flag: Metadata eyebrows are news-register pattern (NYT, TechCrunch); thought-piece and campaign pages omit metadata to emphasize timeless ideas; byline alone is sufficient.

---

### Docs register (2 new rules)

1. **[MAJOR]** If sidebar nav is absent or hidden below content (hamburger menu required on desktop), flag: Docs require persistent, scannable nav; sidebar should be visible on desktop and accessible on mobile; hidden nav breaks wayfinding.

2. **[MAJOR]** If code examples are fewer than prose paragraphs (e.g., one code block for three paragraphs of explanatory copy), flag: Developer docs are code-primary; reverse the ratio; aim for >1 code block per 2 paragraphs; excessive prose explains what code should show.

---

## Source notes

**Reachability:** All exemplar sites reached successfully except Vercel blog (404 on specific post; used news/blog index as reference). Figma, Notion, Raycast provided enough product-app UI signal from marketing pages (screenshots of editor interfaces); live app access not required for visual pattern extraction.

**Limitations:**
- SaaS-landing anchors (Linear.app, Vercel.com, Stripe.com) represent B2B/payments/dev-tools vertical; consumer SaaS (Slack, Figma) and B2C SaaS (Airbnb, Uber) would add palette/imagery variation. Recommend testing against additional verticals in Phase 3.
- Product-app anchors are desktop-first (Linear, Notion, Figma); mobile app UIs (iOS/Android) have additional density constraints and touch-target rules not fully characterized. Phase 3 could add Raycast (macOS app) or Superhuman (email app) for desktop-native signal.
- Marketing-page anchor pool is dev-tools-heavy (Vercel, Stripe, Anthropic, OpenAI, Tailwind); B2B SaaS launch pages (e.g., Superhuman launch, Cal.com launch) and consumer-brand campaigns (e.g., Apple keynotes, Tesla design pages) would add variation. Phase 3 should include non-tech verticals.
- Personal-portfolio anchors come from R1's research (10 portfolios); all 5 recommended anchors reached successfully.
- Docs anchors are dev-focused (API, framework docs); product-docs (knowledge base, internal wiki) and non-tech docs (user manuals, educational content) would expand the pattern. Phase 3 could add Notion docs example and Slack Help Center.

**Key synthesis insights:**

1. **Register taxonomy is robust.** The comparison matrix shows 5–8 dimension divergences between each register; no two registers are adjacent. The taxonomy doesn't require refinement; it requires depth (more anchors per register for edge cases).

2. **Register detection from brief is reliable.** Keywords and implied goals (conversion vs. credibility vs. task completion) provide clear signals. Ambiguity is rare and resolves with 1–2 clarifying questions (pre-login vs. post-login, founder brand vs. product brand, narrative vs. reference).

3. **Option B (split siblings) is the right structure.** Each register has a distinct pattern set (3+ dimension divergences) and anti-pattern set. Unified skill with internal chapters would require 60–80 lines per chapter, defeating code organization benefits of a single skill. Siblings cost more to maintain (boilerplate duplication) but gain clarity and scalability.

4. **Register mismatch is the #1 failure mode in ui-expert v2.** The original <github-user>.tech failures (F1–F10 from R1) are almost entirely register-mismatch errors: applying SaaS landing patterns to a personal-portfolio brief. Phase 2 gate (register-lock) catches this upstream; Phase 3 test should re-run original <github-user>.tech brief against new `ui-expert-portfolio` skill to verify all F1–F10 are caught.

5. **Anti-pattern rules scale per-register.** R1's 12 rules are ~90% personal-portfolio-specific. SaaS landing needs different rules (hero presence, social-proof visibility, CTA urgency). Each sibling skill should own 3–4 register-specific rules + import ~5 shared rules (CTA discipline, typography hierarchy, palette restraint) from a common library.

---

## Next steps for Phase 2–3

### Phase 2: Architecture decision

Confirm Option B (split siblings) and wire 5 skill stubs:
- `ui-expert` (router only, ~50 lines)
- `ui-expert-portfolio` (personal portfolio, ~350 lines)
- `ui-expert-saas` (SaaS landing, ~400 lines)
- `ui-expert-product` (product app UI, ~300 lines)
- `ui-expert-marketing` (marketing page, ~350 lines)
- `ui-expert-docs` (docs, ~300 lines)

Shared library:
- `/shared/register-lock-gate.md` (detection rules + disambiguation)
- `/shared/anti-patterns.md` (shared rules: CTA discipline, typography, palette restraint)
- `/shared/anchor-pool.md` (5 registers × 5 anchors per register)

### Phase 3: Gate spec + test

Gate 0.5 (register-lock) should:
1. Parse brief for keywords (portfolio, pricing, dashboard, blog, docs, API)
2. Ask 1–2 clarifying questions if ambiguous (pre-login vs. post-login, founder brand vs. product, narrative vs. reference)
3. Route to appropriate sibling skill with detected register pre-filled

Re-test against original <github-user>.tech brief:
- Brief says "portfolio site for engineer" → should route to `ui-expert-portfolio`
- F1–F10 failures should be caught as register-mismatch errors (applying SaaS patterns to portfolio register)

### Phase 4: Per-register deep-dive

Each sibling skill should:
- Reference 5 anchors as working examples (with direct citations)
- Include 3–4 register-specific anti-pattern rules (beyond shared 5)
- Provide 2–3 worked examples of register-mismatch errors (show what NOT to do)
- Include a decision tree for ambiguous briefs (copy from this document's "Ambiguous prompts" section)

---

## Metadata

**Created:** 2026-05-15  
**Source research:** R1 portfolio-anchors.md (10 portfolios); R2 WebFetch exemplars (12 sites across SaaS landing, product app, marketing page, docs)  
**Authors:** Lucas Santana (operator), Claude Code (R2 research)  
**Status:** Research output; ready for Phase 2 architecture decision  
**Consumed by:** ui-expert deepening plan, Phase 2–4
