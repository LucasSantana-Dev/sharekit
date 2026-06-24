---
name: portfolio-anchors
description: Personal-portfolio register reference anchors and anti-slop rules sourced 2026-05-15 from 10 credible designer/engineer portfolios
created: 2026-05-15
sources: 10 portfolios researched via WebFetch (see Inventory section)
status: research-output (consumed by ui-expert deepening Phase 2-3)
---

# Personal-portfolio register: reference anchors + slop rules

## Inventory (10 portfolios researched)

| # | Portfolio | URL | Reached? | Year | Key signature |
| --- | --- | --- | --- | --- | --- |
| 1 | Brittany Chiang | https://brittanychiang.com | Yes | 2026 | Colophon with time-travel Easter egg; accessible, text-forward |
| 2 | Adam Wathan | https://adamwathan.me | Yes | 2026 | "Who the hell am I?" question-as-hero; zero buttons, pure curiosity |
| 3 | DHH | https://world.hey.com/dhh | Yes | 2026 | Verb-first bio paragraph; editorial river of posts, one CTA (Subscribe) |
| 4 | Frank Chimero | https://frankchimero.com | Yes | 2026 | Archive heading with question mark "2009–?"; sabbatical transparency |
| 5 | Lynn Fisher | https://lynnandtonic.com | Yes | 2026 | Roman-numeral version stamp (v. XIX); "Gifs" nav item; annual redesigns |
| 6 | Tobias van Schneider | https://vanschneider.com | Yes | 2026 | Artifacts grid between case studies; manifesto-as-hero; house metaphor |
| 7 | Bruno Simon | https://bruno-simon.com | Yes | 2026 | Drivable 3D physics world; "Whispers" visitor-messages feature |
| 8 | Steve Schoger | https://steveschoger.com | Yes | 2026 | Stack disclosure in closing (TailwindCSS + Nuxt); no hero image |
| 9 | Sarah Drasner | https://sarah.dev | Yes (fallback) | 2026 | "I Make Things" three-word hero; bio ends with "She likes cheese" |
| 10 | Josh W. Comeau | https://www.joshwcomeau.com | Yes | 2026 | Honeypot field as anti-bot; article index over card grid; topic emojis |

## Per-portfolio analysis

### 1. Brittany Chiang — https://brittanychiang.com

**Layout pattern:** Two-column sticky-left rail (identity + nav) + right-scroll content sections.

**Hero treatment:** Persistent left rail (H1 name + H2 role + tagline). No oversized banner or video. Text-forward and accessible by default.

**CTA count and discipline:** Three anchor links (About, Experience, Projects) + two contextual CTAs (View Full Résumé, View Full Project Archive). Highly disciplined — no stacks, no modals, no newsletter bait.

**Typography:** Inter (single typeface, variable weights). Hierarchy carried by size and weight alone, not by font family.

**Palette:** Dark navy/slate background, muted neutral body, single accent color for links.

**Section rhythm:** Five predictable sections (About → Experience → Projects → Writing → Colophon). Sections use consistent treatment: list for Experience (numbered, dated, role + tools), cards for Projects/Writing. Even spacing, no decorative dividers.

**Content register:** First-person, warm, plain-spoken with playful asides (running around Hyrule, cats, tennis, climbing). Professional substance softened by personality.

**Anti-patterns avoided:**
- No hero carousel or auto-rotating banner
- No modal/cookie nag
- No vague CTA stacks ("Let's connect," "Hire me," etc.)
- No buzzword soup; tools listed as discrete chips
- No stock photography or inflated metrics
- No testimonials wall
- No fake scarcity ("Available for 2 more projects")

**Signature move:** Colophon listing the tools used (Figma, VS Code, Next.js, Tailwind, Vercel, Inter) paired with a clickable spinning Tardis ("Click to time travel") linking to older portfolio versions. Signals craft pride + fandom + personal evolution archived.

---

### 2. Adam Wathan — https://adamwathan.me

**Layout pattern:** Single-column, vertically stacked, centered text. Minimalist — no grid, no cards, no columns.

**Hero treatment:** Circular GitHub avatar + H1 question: "Who the hell am I?" Conversational, disarming. Questions are rarely used in portfolio heros; this breaks expectation.

**CTA count and discipline:** Zero hard CTAs. No buttons, no "Subscribe," no "Hire me." Navigation links (Articles, Talks, Screencasts, Podcast, Courses, Projects, Journal) act as soft pathways. Trust in reader curiosity to do the work.

**Typography:** Hierarchy clear (large H1, readable body prose, inline links); specific typefaces not identifiable from provided content.

**Palette:** Link-driven, low-chrome, content-first. No imagery beyond avatar.

**Section rhythm:** Four short paragraphs, each a doorway. Identity → what he shares → origin beat (2016) → current focus (Tailwind) → uses page reference. Every paragraph ends with an internal link.

**Content register:** Casual, slightly self-deprecating, founder-flavored. Calls himself "Justin's worst nightmare." Opens with a question rather than a statement.

**Anti-patterns avoided:**
- No newsletter modal or exit-intent popup
- No hero animation or video
- No "As seen in" logo wall
- No skills grid or resume dump
- No social proof theater
- No marketing-speak ("synergy," "passionate")
- No duplicate H1s competing for attention

**Signature move:** Opening with a question — "Who the hell am I?" — flips the genre. Reads like answering someone at a bar, not pitching at a landing page. The question frame signals confidence and self-awareness.

---

### 3. DHH — https://world.hey.com/dhh

**Layout pattern:** Single-column, reverse-chronological river of posts. No grid, no cards, no sidebar clutter. Pagination-based, not infinite scroll.

**Hero treatment:** Minimal. Avatar + name "David Heinemeier Hansson" + bio paragraph packed with hyperlinked credentials (Basecamp, HEY, Rails, Hotwire, Kamal, books, Le Mans). The credentials *are* the hero. No banner image, no parallax, no tagline animation.

**CTA count and discipline:** Exactly one primary CTA: "Subscribe" (with RSS inline). Per-post: one "Read more" link. No newsletter modal, no cookie banner, no social grid, no follow-me buttons.

**Typography:** Serif-forward editorial typeface (body and headings); generous line-height. Near-white background, dark text, understated link color. Reads like printed media ported online.

**Palette:** Editorial register — near-white background, near-black text. Color restraint preserves reading comfort.

**Section rhythm:** Metronome: date → H2 title → 3–4 sentence excerpt (truncated with ellipsis) → Read more. Consistent visual rag and curiosity hook. Each post occupies identical real-estate.

**Content register:** Punchy, opinionated, first-person, often contrarian. Topics swing wide (Linux, politics, AI, racing, parenting-of-companies). Voice is the through-line, not topic consistency.

**Anti-patterns avoided:**
- No cookie consent theater
- No newsletter popup
- No social proof badges or follower counts
- No featured-post hero card
- No tag cloud, category nav, or search-as-decoration
- No infinite scroll trickery (honest pagination instead)
- No author photo bigger than content
- No autoplay video or carousel
- No share buttons on index

**Signature move:** Bio as a list of completed actions, not titles. "Made," "Created," "Wrote," "Won at Le Mans," "Invested in" — verbs first. Tells you exactly who runs the page before you read a single post. Resumes are usually nouns (Senior Engineer, VP, Author); this is verbs (the things done).

---

### 4. Frank Chimero — https://frankchimero.com

**Layout pattern:** Vertically stacked, single-column document. Sections flow top-to-bottom: identity → newsletter → featured writing → book → full archive → about/CV. Reads like a well-paced essay, not a dashboard.

**Hero treatment:** Restrained and human. Short first-person intro ("Hi, I'm Frank Chimero, a designer from New York") + blurred portrait. Current activity volunteered as context (sabbatical, walking, researching Eno). No splashy animation, no oversized value-prop headline.

**CTA count and discipline:** Two primary actions: email link + About anchor. Book section adds four utility links (buy, indie, read, download). Notable discipline — no newsletter modal interrupting the read, no "Hire Me" button, no social proof badges.

**Typography & palette:** Specific typefaces not identifiable from provided content. Register suggests editorial serif or refined sans with generous leading. Palette neutral and quiet — a writerly canvas.

**Section rhythm:** Six titled movements: identity → activities → featured essays → book → archive → CV/bio. Featured essays precede full archive (curated first, then exhaustive). Each section titled with descriptive subheads.

**Content register:** Conversational, slightly dry, first-person. Personal asides land hard: "I have a big love for museums, beat-up pocket-edition paperbacks, ambient music, antique JRPGs, and Phil Collins. (Nobody's perfect.)"

**Anti-patterns avoided:**
- No cookie banner theater
- No autoplay hero video
- No "As seen in" logo wall (press is listed, not paraded)
- No testimonials carousel
- No newsletter interstitial popup
- No vague abstract nouns ("solutions," "experiences")
- No reverse-chronological tyranny (selected work precedes full archive)

**Signature move:** Archive heading reads "Entries 2009–?" — that single question mark in place of an end date. Quietly signals an ongoing, uncommercial practice. It's a personal cadence, not a corporate content calendar. Also communicates humility: "I don't know when I'll stop making things."

---

### 5. Lynn Fisher — https://lynnandtonic.com

**Layout pattern:** Minimal single-screen composition. Name, role tagline, compact numbered nav list. No multi-column grid, no scroll choreography.

**Hero treatment:** Name itself is the hero — "Lynn Fisher" as dominant block. Descriptor "Designer for the Web" follows. No imagery competes with the wordmark. Quiet confidence.

**CTA count and discipline:** Six navigation links (About, Work, Thoughts, Archive, RSS, Gifs) presented as a numbered list, not styled buttons. No conversion-style CTAs, no "Hire me" shout. Disciplined restraint.

**Typography & palette:** Not identifiable from provided content. Hierarchy is clearly tiered: oversized display name → smaller role line → list-styled nav.

**Section rhythm:** Effectively one zone. Identity → role → directory. No marketing sections, testimonials, or feature grids. Content lives on linked pages, not the homepage.

**Content register:** Plain-spoken, first-person-adjacent, professional but warm. Role declared as a quiet statement.

**Anti-patterns avoided:**
- No hero carousel or stock photography
- No newsletter modal or cookie wall
- No "Hello, I'm…" cliché preamble
- No skill bars, logo soup, or social proof clutter
- No redundant primary/secondary CTA stacks

**Signature move:** Roman-numeral version stamp ("v. XIX") treating the site itself as a long-running, iteratively redesigned project. Plus: inclusion of "Gifs" as a peer-level nav item alongside Work and Archive. Mix of craft seriousness and playfulness is the fingerprint. Also signals annual redesigns (a tradition, not a gimmick).

---

### 6. Tobias van Schneider — https://vanschneider.com

**Layout pattern:** Long-scroll single-column with alternating rhythm. Manifesto + studio statement → project → visual breather → repeat. Case study sliders interrupted by artifact mosaics and essay trios.

**Hero treatment:** Centered cherubic illustration paired with manifesto line "I CREATE; / THEREFORE / I AM" and tagline "DESIGN PRAXIS EST. 2000." No founder photo up top, no scroll cue beyond small downward arrow. Thesis, not a sell.

**CTA count and discipline:** Per project, typically one primary link ("View project details," "Visit mymind.com"). No sticky "Hire us," no newsletter popup, no contact-form button in hero. Footer adds quiet Newsletter link.

**Typography:** High-contrast serif for display/manifesto lines. Neutral sans for body/captions. Generous tracking on small-caps labels ("FOUNDER HOVS"). Uppercase used as decoration, not for emphasis fatigue.

**Palette:** Off-white/cream background, near-black text. Color carried entirely by project imagery (NASA reds, motorcycle chrome, mymind pastels). Chrome itself is monochrome to let content breathe.

**Section rhythm:** Cadence roughly one heavy case study (BMW, Europa Clipper, Mars 2020), then a visual breather (artifact grid, essay trio, product showcase). Rhythm prevents case-study fatigue.

**Content register:** First-person, plainspoken, lightly reverent toward craft. Lines like "HOVS believes in brands and products that have a point of view." Sign-off: "Thank you for visiting the house." Hospitality tone, not agency-pitch tone.

**Anti-patterns avoided:**
- No hero carousel or autoplaying video wall
- No client logo bar
- No testimonial section
- No "Services" pricing grid
- No sticky chat widget or exit-intent modal
- No vague "We craft experiences" copy (every project says what it is and what the role was)
- No infinite social proof counters

**Signature move:** Threading "artifacts" between case studies — a marble skateboard, hand-made sneakers, beard oil collab, drone shots of Venice Beach. Reframes the site as a cabinet of curiosities rather than a capabilities deck. Closing "Thank you for visiting the house" lands because the house metaphor has been furnished the whole way down. The site is a place, not a pitch.

---

### 7. Bruno Simon — https://bruno-simon.com

**Layout pattern:** Interactive 3D canvas as entire interface. No traditional scrolling page. Navigation via driving a physics-simulated car through a rendered world. Overlay panels (Home, Options, Controls, Achievements, Circuit, Whispers, Behind the Scene) summoned by icon buttons.

**Hero treatment:** The explorable 3D world itself is the hero. Home panel offers brief text intro: welcome, name, role ("creative developer"), invitation to "drive around to learn more."

**CTA count and discipline:** Highly disciplined — essentially one primary CTA: explore by driving. Secondary actions (Respawn, Reset, Submit whisper, Join Discord) are contextual, tucked inside panels, not competing for attention.

**Typography:** Amatic SC (display, hand-drawn) + Nunito (rounded sans for body/UI). Playful, not corporate.

**Palette & section rhythm:** Inferred playful palette from achievement rewards: red, orange, white, black, flames. Sections are modal overlays rather than vertical stacks. Rhythm is spatial (in-world discovery) rather than scroll-based.

**Content register:** Casual, warm, first-person. "And don't break anything!" and "have fun!" set hobbyist-maker tone over corporate polish.

**Anti-patterns avoided:**
- No cookie banner clutter or newsletter modal
- No long marketing copy or feature grids
- No testimonial wall or logo soup
- No autoplaying video hero with muted overlay text
- No aggressive CTA stacking
- No hidden contact info (Discord offered directly)
- Honest about limitations (server-offline warnings shown plainly)

**Signature move:** Replacing portfolio-as-document with drivable physics world where credits, contact, and projects are physical destinations. "Whispers" feature (visitor messages with flags, max 30) turns site into tiny living community rather than one-way pitch. Shows personality and humor.

---

### 8. Steve Schoger — https://steveschoger.com

**Layout pattern:** Single-column, minimal landing. Logo/name as masthead, horizontal nav row, social icon trio, then short prose bio. No grid, no cards, no scroll choreography.

**Hero treatment:** Name itself functions as H1; no oversized image or headline slab. Bio paragraph beginning "Hey! I'm Steve Schoger" carries intro work. Restraint over spectacle.

**CTA count and discipline:** Zero hard CTAs. Links exist (book, projects, interviews, speaking, contact), but nothing shouts "Buy Now" or "Subscribe." Book mention is soft inline reference, not banner. Highly disciplined.

**Typography & palette:** Not identifiable from supplied content; no CSS or color values visible. Hierarchy clearly tiered: display name → nav → bio prose.

**Section rhythm:** Three beats — identity (name + nav), social proof (icon links), conversational bio (two paragraphs + closing tech note). Each brief; whitespace does the pacing.

**Content register:** Casual, first-person, friendly. Opens with "Hey!" Describes himself as the person who shares design tips and "refactors UI's" on YouTube. Reads like a personal note, not marketing copy.

**Anti-patterns avoided:**
- No hero video or stock photography
- No newsletter modal
- No testimonial carousel
- No "As seen in" logo wall
- No aggressive conversion funnel
- No jargon-laden value proposition
- No cookie-banner-style interruptions
- No vague "I help brands tell their story" tagline

**Signature move:** Closing line credits the stack (TailwindCSS, Nuxt.js) as part of the introduction, not hidden in footer. Quiet wink: a designer showing his receipts. Treats colophon as peer to the bio, not an afterthought.

---

### 9. Sarah Drasner — https://sarah.dev

**Layout pattern:** Single-page vertical scroll with sticky/repeated nav. Three primary sections: hero ("I Make Things"), About Me (portrait + bio), Say Hello (contact form). Nav repeated top/bottom for symmetry.

**Hero treatment:** Minimalist text-first hero — punchy three-word declaration ("I Make Things") rather than imagery or video reel. Fern icon as only visual flourish in masthead.

**CTA count and discipline:** Effectively one primary CTA: "Send" button on contact form. Secondary actions limited to three nav links + social cluster repeated top/bottom. No popups, no newsletter bait, no button stacks.

**Typography & palette:** Typefaces not identifiable from provided content. Register suggests clean editorial pairing (display face for H1, humanist sans for body). Palette restrained/personal (implied from fern motif and single bio photo).

**Section rhythm:** Three distinct beats (identity → biography → conversation) with clear H2 anchors ("About Me," "Say Hello"). Predictable cadence without filler.

**Content register:** Professional but warm. Bio dense with credentials (Google Sr. Director, ex-Netlify VP, ex-Microsoft, author, Frontend Master, Concatenate co-organizer), then closes with "She likes cheese" — deliberate tonal pivot to humanize.

**Anti-patterns avoided:**
- No carousel or rotating hero
- No cookie/newsletter modal
- No vanity metrics ("10M readers!")
- No autoplay media
- No bloated nav (just three links)
- No duplicate/competing CTAs
- Uses honeypot field instead of CAPTCHA friction

**Signature move:** Ending executive-grade bio with four-word non sequitur about cheese. Collapses distance between résumé and human in one line. Detail-level signal that page is authored, not templated.

---

### 10. Josh W. Comeau — https://www.joshwcomeau.com

**Layout pattern:** Single-column article index. No grid of cards, no hero image dominating fold. Clean list where each entry gets room to breathe: title, subtitle, descriptive paragraph, "Read more" link.

**Hero treatment:** Minimal to nonexistent. Page opens with H1 "Josh W Comeau homepage," then dives into "Articles and Tutorials." No splashy banner, no carousel, no value-prop headline. Content *is* the hero.

**CTA count and discipline:** Primary repeated CTA is single "Read more" link per article. Secondary CTAs only in supporting zones: newsletter signup ("Want to know when I publish new content?"), category navigation, "Show more" expander. No competing buttons within a section.

**Typography:** Hierarchy clear (large titled article links, italicized/lighter subtitles with emojis, body prose in comfortable reading size). Specific typefaces not identifiable from CSS in provided content.

**Palette:** Not directly visible from markup, but dark-mode toggle offered ("Activate dark mode"), implying dual-theme system with light/dark portrait assets. Suggests thoughtful theme consideration.

**Section rhythm:** Articles → Browse By Category → Popular Content (numbered top-10 list) → footer nav repeating categories, courses, general links. Rhythm: fresh content → evergreen → wayfinding.

**Content register:** Warm, conversational, confessional. Phrases like "It's honestly a very lovely API" and "completely blew my mind" land like a friend explaining something exciting. Sparkle emojis (✨) and 🤯 punctuate technical topics without feeling unprofessional.

**Anti-patterns avoided:**
- No cookie banner clutter in visible content
- No newsletter modal popup (signup sits inline)
- No fake urgency, countdowns, or social-proof badges
- No buzzword marketing copy on index
- No vague titles (every article name tells you what you'll learn)
- No infinite scroll (explicit "Show more" control instead)

**Signature move:** Honeypot field labeled "Are you a human? If so, please ignore this checkbox" — self-aware, slightly cheeky anti-spam touch. Talks to readers like peers, not targets. Tiny microcopy that signals author is a person, not a content farm.

---

## Patterns common to credible portfolios

1. **Text-first hero, not imagery-first.** All 10 open with text as the primary hook (a name, a question, a thesis, a tagline, a three-word declaration). When imagery appears, it's secondary or absent entirely. The hero is *identity-as-prose*, not a banner photo or video.

2. **Extreme CTA discipline.** Credible portfolios have 0–3 primary CTAs total, often just one. Secondary CTAs are contextual (anchor links, "Read more") not stacked buttons ("Hire me," "Subscribe," "Download resume"). No newsletter modals, cookie nags, or exit-intent popups obscure the content.

3. **Monocolor or understated palette.** No cyan-on-dark cyan, no rainbow gradient chaos. Either restrained (navy + muted neutral + single accent), or let project imagery carry color. Chrome itself is monochrome or white/cream background + dark text. Palette signals reading-first, not design-show-off-first.

4. **First-person voice, warm not corporate.** Every portfolio uses "I," speaks in complete sentences, includes a personality tell (Frank: "Phil Collins"; Sarah: "cheese"; Josh: emojis; Bruno: "have fun!"). Professional credibility comes from substance, not formality.

5. **Predictable section rhythm with visual rest.** Sections are titled and numbered or clearly visually separated. Case studies or projects don't blur into one another. Rhythm is: content → breather (visual or spacing). No identical bento-card repetition fatigue.

6. **Honest limitations and constraints.** Bruno shows server-offline warnings plainly. Frank uses a question mark in the archive ("2009–?"). Sarah opens with sabbatical. Honesty about current state signals maturity and confidence, not marketing speak.

7. **Content register matches domain.** Essay-portfolio (DHH, Frank, Sarah) uses serif, generous line-height, longer prose. Code-portfolio (Brittany, Josh, Adam) uses clean sans, shorter paragraphs, inline links. Case-study portfolio (Tobias) uses high-contrast typography and white-space rhythm. No one mixes all three and confuses the reader.

---

## Anti-patterns avoided

1. **Eyebrow-tag inflation.** Credible portfolios do NOT prefix every section with metadata eyebrows like "NOW," "ABOUT/IDENTITY," "REACH ME," "CAPABILITY MAP." When tags appear, they're used once per context, not systemically. (The failed <github-user>.tech output had eyebrows on every section — anti-pattern.)

2. **CTA button stacks.** Portfolio rarely has 3+ competing buttons in the hero ("Join Discord," "View Projects," "Download Resume," "Contact Me"). Credible portfolios choose one primary action or zero. Stacks signal desperation, not clarity.

3. **Unsourced round-number metrics.** "40% faster," "100k+ users," "25% improvement" with no source. Credible portfolios cite projects specifically or stay silent. No vanity metrics. (The failed output had "Measured delivery outcomes: 40% / 40% / 25% / 100k+ MAU" — fabricated numbers.)

4. **Repetitive component abuse.** Tag pills (TypeScript, React, Node) repeated in subtitle, tag cluster, AND skills section. Credible portfolios mention tools once, in context, or in a colophon. No duplication.

5. **AI-portrait treatment.** Circular crop + cyan glow + dotted boundary + soft-focus. Credible portfolios use blurred portraits (Frank), no portrait (DHH, Adam), simple avatar (Adam, Sarah's fern icon), or in-world 3D (Bruno). Never the "glowing sphere" effect.

6. **Identical bento-card rhythm.** Every section ("What I am building," "Selected builds," "Reach me") using the same card treatment, same text hierarchy, same spacing. Credible portfolios vary: lists, cards, prose, grids, in-world exploration. Rhythm prevents visual monotony.

7. **Filler CTAs pointing to the same page.** "Show more details," "View relevant projects" that scroll to an anchor within the page. Credible portfolios have external CTAs (read post, view project repo, download resume) or zero CTAs. No local-scroll bait.

8. **H1 confusion.** Splitting H1 across multiple lines without semantic intention ("LUCAS / SANTANA" when it's one name, not two concepts). Credible portfolios use one clear H1, or none in hero. Typography hierarchy is carried by weight/size, not HTML element confusion.

9. **Newsletter-first revenue model on portfolio.** Pop-up signup, sticky footer form, inline "Subscribe" pressure. Credible portfolios mention newsletter once (DHH: "Subscribe" top-nav, Frank: soft link, Sarah: contact form). Newsletter is not the hero pitch.

10. **Buzzword copy:** "We craft experiences," "synergy," "passionate about," "help brands tell their story," "forward-thinking." Credible portfolios use specific language (Brittany: "I build accessible, pixel-perfect experiences"; Frank: "A short book for new designers"; Bruno: "drive around and learn"). Specificity signals expertise, buzzwords signal template.

---

## Register signature: personal-portfolio vs SaaS-landing

| Dimension | Personal portfolio | SaaS landing | Visible-difference example |
| --- | --- | --- | --- |
| **Hero treatment** | Text-first, identity-forward; no video; minimal or absent imagery | Hero image or video dominating fold; motion-cue (scroll animation) | Portfolio: "I Make Things" or name. SaaS: 3-sec video loop + "Start your free trial" |
| **CTA count** | 0–2 primary, disciplined + contextual secondaries | 2–4+ primary (Sign up, Start free, Contact, Demo) | Portfolio: one anchor nav. SaaS: sticky header + sidebar + multiple "Try now" buttons |
| **Eyebrow usage** | 0–1 per page (if any) | 1+ per section ("PRICING," "FOR ENGINEERS," "CASE STUDIES") | Portfolio: no eyebrows or one intro meta-tag. SaaS: eyebrows on every section |
| **Copy register** | First-person ("I build," "I like," "I made"); warm, lightly playful | Second-person or corporate ("You get," "Your team," "Enterprise-grade") | Portfolio: "I spend my time on…" SaaS: "Streamline your workflow with…" |
| **Social proof** | None, or one quote/testimonial buried on a deep page | 5–10+ testimonials, client logos, "1M+ users," star counts | Portfolio: silence or one person's story. SaaS: hero section with logo wall + "Trusted by" |
| **Section rhythm** | Varied (prose, list, cards, grids, in-world exploration); intentional breathers | Standardized (card grid, feature carousel, testimonial cards); visual sameness | Portfolio: essay → list → case study → interactive. SaaS: feature cards → testimonial cards → pricing cards |
| **Typeface approach** | Single typeface (Inter, Nutico) or editorial pair (serif + sans); minimal weight variation | Multiple typefaces; bold display face + regular sans + script; high contrast | Portfolio: one font, varied weights. SaaS: three fonts, three weights each |
| **Palette** | Monochrome or restrained (navy + one accent); content carries color | Branded primary + secondary + accent + white/light background; saturation-heavy | Portfolio: dark background + white text + one link color. SaaS: brand blue hero + cyan accents + neon buttons |
| **Contact/CTA destination** | Simple email link, contact form, or external link (repo, repo) | Form submission, popup, modal, or "Book a demo" (CRM integration) | Portfolio: `mailto:` or lean form. SaaS: Calendly integration or form w/ Hubspot backend |
| **Trust signal** | Personality, archive, colophon, transparency (sabbatical, limitations) | Certifications, case study numbers, uptime guarantees, security badges | Portfolio: "designed this in 2014" + link to old version. SaaS: "SOC 2 Type II" badge + "99.99% uptime" |

---

## Recommended reference anchors (5)

### 1. Brittany Chiang — https://brittanychiang.com
**Register sub-niche:** Engineer-portfolio, accessibility-first, industry-credible.
**When to use:** Personal portfolio where the primary goal is employment/visibility in the engineering market. Strong CTA discipline model. Colophon as a trust signal.
**Key insight:** Two-column sticky-rail design keeps identity constant while content scrolls — a sophisticated UX choice that signals comfort with layout complexity, not template defaults.

### 2. DHH — https://world.hey.com/dhh
**Register sub-niche:** Executive/founder portfolio, editorial, content-driven.
**When to use:** Personal portfolio where the person *is* the output (writer, thinker, leader). No portfolio pieces needed; thought pieces ARE the portfolio. Founder-grade credibility model.
**Key insight:** Verb-first bio and single-CTA discipline are founder trademarks. RSS as a first-class citizen (not an afterthought) signals respect for reader autonomy.

### 3. Lynn Fisher — https://lynnandtonic.com
**Register sub-niche:** Designer-portfolio, minimal, annually redesigned.
**When to use:** Designer portfolio where the site itself is a portfolio piece. Very constrained surface area forces intentionality. Versioning as a transparency signal.
**Key insight:** Roman-numeral version stamps and "Gifs" as a nav peer to "Work" signal a person, not a company. Annual redesigns are a tradition, making the site itself a living project.

### 4. Frank Chimero — https://frankchimero.com
**Register sub-niche:** Designer-writer, essayist, vulnerable transparency.
**When to use:** Designer or writer portfolio where craft and process matter as much as output. Honesty about sabbatical/rest is a trust signal. Archive-with-question-mark signals ongoing practice.
**Key insight:** Blurred portrait, no glamour shots. Essay register (serif, generous leading) signals the person writes and thinks, not just designs pixels. Cheese comment signals humanity.

### 5. Tobias van Schneider — https://vanschneider.com
**Register sub-niche:** Studio/independent designer, case-study-heavy, brand-conscious.
**When to use:** Design agency or independent designer portfolio where major case studies are the hero. Artifacts grid as a personality signal. Manifesto-as-hero for strong brand positioning.
**Key insight:** "Cabinet of curiosities" (artifacts between case studies) breaks the case-study fatigue that plagues design portfolios. "Thank you for visiting the house" closes with hospitality, not salesmanship.

---

## New slop-audit rules (10+)

All rules in format: `[severity] If <observable condition>, flag: <one-sentence explanation>`

### Structural / Content

1. **[MAJOR]** If every section (or >3 consecutive sections) has a metadata eyebrow tag (e.g., "NOW," "ABOUT," "REACH ME," "CAPABILITY MAP"), flag: Eyebrow inflation is a systemic AI tell; credible portfolios use 0–1 eyebrow per page, never per-section.

2. **[MAJOR]** If hero contains 3+ primary CTAs (e.g., "Join Discord," "View Projects," "Download Resume," "Contact Me") with equal visual weight, flag: CTA button stacks signal desperation or template defaults; credible portfolios choose one or zero.

3. **[MAJOR]** If metrics are cited without source context (e.g., "40% faster," "100k+ MAU," "25% improvement" with no linked project or case study), flag: Unsourced round-number metrics are fabrication red flag; either cite projects specifically or omit.

4. **[MINOR]** If a tag, skill, or tool is repeated in 3+ distinct locations on the same page (e.g., TypeScript in subtitle, tag cluster, skills section), flag: Repetitive component abuse suggests copy-paste, not intentional curation; mention tools once per context.

5. **[MAJOR]** If a portrait or headshot has: circular crop + glowing aura/border + soft-focus + shadow halo, flag: AI-portrait treatment (common in generative outputs); credible portfolios use blurred, natural, or avatar-only portraits.

6. **[MAJOR]** If every major section uses identical visual treatment (same card height, text hierarchy, spacing, divider) across 4+ sections, flag: Identical bento-card rhythm prevents visual rest; vary section types (prose, list, grid, in-world, carousel).

7. **[MINOR]** If a CTA button points to an in-page anchor and the link text is vague (e.g., "Show more details," "View relevant projects," "Learn more"), flag: Filler CTAs that scroll within the same page signal padding, not navigation; external CTAs or zero CTAs are credible.

8. **[MINOR]** If the H1 is split across multiple lines without semantic justification (e.g., "LUCAS / SANTANA" as one name rather than two concepts), flag: H1 confusion suggests typography cargo-cult (using HTML hierarchy without intent); one clear H1 or none in hero.

9. **[MAJOR]** If a newsletter signup or subscription form appears as a modal, sticky footer, or hero-competing section on a non-media portfolio, flag: Newsletter-first revenue model on personal portfolios signals template defaults, not intentional CTA strategy.

10. **[MAJOR]** If copy uses unqualified buzzwords (e.g., "We craft experiences," "synergy," "passionate about," "help brands tell their story," "forward-thinking") without specific context, flag: Buzzword soup is a 1:1 AI-generation tell; replace with specific language (e.g., "I build accessible, pixel-perfect interfaces" or "A short book for new designers").

11. **[MINOR]** If the palette includes bright cyan, neon green, or saturated secondary colors on a dark background (common SaaS-landing palette), and the portfolio register is personal (not SaaS/product), flag: Register mismatch; personal portfolios use monochrome, restrained, or editorial palettes, not SaaS accent colors.

12. **[MINOR]** If the page includes autoplay video in hero, rotating image carousel, or infinite scroll without explicit load-more control, flag: Motion-as-engagement (carousel, autoplay) is SaaS-landing pattern, not personal-portfolio standard; personal portfolios favor static prose or user-initiated navigation.

---

## Source notes

**Reachability:** 9 of 10 direct URLs reachable; 1 fallback via WebSearch (Sarah Drasner: sarahdrasner.com returned ECONNREFUSED; found current site at sarah.dev via search).

**Limitations encountered:**
- Most sites do not expose CSS in the fetched content, so specific typeface and color hex values are inferred from visual register or explicitly stated in colophons (e.g., Brittany: Inter; Bruno: Amatic SC + Nunito). For ui-expert anchor reference, note that "palette" and "typography" are visual, not code-extracted.
- Bruno Simon's 3D-canvas portfolio is an outlier (upper bound of complexity); most credible portfolios are text/grid-based. Included because it signals personality + interactivity can be credible without being AI-feeling.
- Lynn Fisher and Frank Chimero are designers; the others are engineer-first or engineer-designer hybrids. No pure "creative director" or "illustrator" portfolio in this set, so the register may skew toward text/code-first. Future work could add illustrator/visual-artist references.

**Key synthesis insight:**
Credible personal portfolios are *under-designed*, not over-designed. The default SaaS-landing register (cyan accents, eyebrow tags, hero carousel, CTA stacks, testimonial walls, skill charts) applied to a personal portfolio *adds* elements, not removes them. The anti-pattern is not "missing" design; it's *excess* design applied to the wrong register. ui-expert v2 was trained on SaaS landing pages as the default and over-fitted to that register. Phase 2 decision (deepen vs. split) hinges on whether personal-portfolio patterns are distinct enough to warrant a new register chapter or a sibling skill.

**Recommended next steps for Phase 2–3:**
- Run `/research-and-decide` over the Option A (deepen unified ui-expert) vs. Option B (split into per-register skills) using this inventory.
- Phase 4 re-test should apply improved Gate 4 to the original <github-user>.tech brief and verify each of the 10 F1–F10 failures are caught and flagged.
- If Phase 2 chooses Option B (split), these 5 anchors should become the "personal-portfolio" skill's reference chapter; the 6-10 portfolio links can populate secondary examples.
