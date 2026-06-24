# Anti-pattern catalogue

The slop dictionary. Each entry: name → why it's a tell → rewrite recipe.

This file is the source of truth that `ai-slop-audit` reads when linting output. Match-and-rewrite, never soften.

---

## 1. Generic purple-to-blue gradient

**Pattern**: `bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-500` or any cool-rainbow gradient as the hero background OR as decorative blobs floating behind content.

**Why it's a tell**: This is the single most common AI-generated UI gradient since 2023. Statistical-center output.

**Rewrite**:
- **Restrained**: solid bg with tinted neutrals + one ≤ 10% accent. No gradient.
- **Committed**: one saturated brand color carrying 30-60% of the surface.
- **Stripe-style**: ONE animated gradient at the top of the marketing hero, slowly cycling 5-7 colors over 15-30 seconds, with a defined palette tied to the brand. Never repeated elsewhere on the page.

---

## 2. Gradient text via `background-clip: text`

**Pattern**: `bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent` applied to headings.

**Why it's a tell**: Decorative, never meaningful, immediately recognizable as AI-default. Reduces legibility.

**Rewrite**: Solid color heading. For emphasis, use:
- Heavier weight (700 vs 400 body)
- Larger size (≥ 1.5× the surrounding text)
- A different family (serif heading on a sans page)
- An accent color (one of the design tokens, not a custom hex)

---

## 3. The bento grid hero

**Pattern**: 3×2 or 2×3 grid of colored tiles, each with a feature icon + title + 1-2 sentences, immediately below the hero headline. Often with one larger spanning tile.

**Why it's a tell**: SaaS landing-page cliché. The pattern came from Apple's "What's New" pages and spread via templates.

**Rewrite**:
- **Editorial split-screen**: one big hero image/product shot on one half, large type + single CTA on the other
- **Stripe-style code-as-content**: a real code sample showing the API, with brief framing copy
- **Single dominant proposition**: one H1, one supporting line, one CTA, and a product screenshot or short video below — full-bleed, single column
- **Feature list**: if features must be shown, use a vertical list with bigger spacing per item, not a grid

---

## 4. Hero-metric template card

**Pattern**: Large number (32-64px), small label above ("REVENUE"), arrow + percentage trend, sparkline, in a bordered card. Repeated 4× across the top of a dashboard, all the same weight.

**Why it's a tell**: SaaS-dashboard slop since ~2020.

**Rewrite**:
- **Asymmetric KPI** (Stripe-Dashboard pattern): one card carries the eye — bigger number, bigger card, sparkline. Other 2-3 are smaller, just number + trend, no sparkline. The hierarchy is the design.
- **Single hero metric**: one number that matters most, displayed at editorial scale (64-96px). Secondary metrics in a smaller strip below.
- **Comparison-driven**: instead of standalone numbers, show this period vs last period as the headline metric.

---

## 5. Identical card grid

**Pattern**: Pricing tiers as 3 identical cards. OR feature list as 6 identical cards. Same dimensions, same weight, same anatomy — only content differs.

**Why it's a tell**: The default Bootstrap/Tailwind pattern. Signals "templated" instantly.

**Rewrite**:
- **Emphasized middle card** (pricing pattern): one tier is visually heavier — larger size, accent border, "popular" badge, different bg. The eye lands there first.
- **Comparison table** (pricing pattern): rows are features, columns are tiers. Way more readable than card-stacks.
- **Asymmetric grid**: feature blocks of varying sizes, types, and treatments. Some are typography-only; some have images; one is a full-width quote. Variety = intentionality.

---

## 6. Glassmorphism by default

**Pattern**: `backdrop-filter: blur(20px); background: rgba(255,255,255,0.1);` on cards, modals, navbars by default. Often with a colorful gradient behind for the blur to "do something."

**Why it's a tell**: 2021 trend, now unmistakably stock. Genuine native-feeling glass (Apple materials) is rare and atmospheric; AI uses it as wallpaper.

**Rewrite**:
- **Solid surface** with tinted neutral background. The default for cards.
- **Real materials** only on chrome (sticky nav, sidebar) and only when there's something behind to translucently reveal — actual content, not a decorative gradient.
- If atmosphere is the goal, use: subtle noise texture, soft drop shadow with brand tint, OR a tinted-neutral bg shift.

---

## 7. Modal as first thought

**Pattern**: Click "Edit" → modal opens with form. Click "Delete" → modal opens with "Are you sure?". Click "Settings" → modal opens. Every action is a modal.

**Why it's a tell**: Lazy interaction design. Modals are a 1995 pattern and rarely the right answer in 2026.

**Rewrite**:
- **Inline edit**: click the field, becomes editable in place, save on blur
- **Slide-over panel** from the right (Stripe/Linear): for "view detail" or "edit detail"
- **Sheet** (iOS/macOS): for short flows, settings, contextual actions
- **Full page navigation**: for long forms or multi-step flows
- **Reserve modals for**: destructive confirms (delete with consequences), and absolute focus moments (single critical action that blocks until resolved)

---

## 8. Side-stripe border on a card

**Pattern**: `border-left: 4px solid #orange` on a callout/alert card.

**Why it's a tell**: Bootstrap 3-era. Still seen in admin templates.

**Rewrite**:
- **Full border** in the semantic color, full opacity
- **Background tint** in the semantic color at low chroma (4-10% saturation)
- **Leading icon** at the top-left of the card, paired with a heading
- **Numbered prefix** if it's a list (1, 2, 3 …)
- **No special border at all** — let typography and bg carry the meaning

---

## 9. Em dashes in UI copy

**Pattern**: `Welcome — let's get started.` or `--` (double dash) in any UI string.

**Why it's a tell**: Em dashes are the single most common punctuation tic in AI-generated text. Designers and editors fluent in English notice immediately.

**Rewrite**: Use:
- Comma: `Welcome, let's get started.`
- Colon: `Welcome: here's what to do.`
- Period (split the sentence)
- Parens for asides: `Welcome (to the new look).`

Banned everywhere — UI strings, marketing copy, error messages, microcopy.

---

## 10. Default Tailwind shadow on cards

**Pattern**: `shadow-md`, `shadow-lg`, `shadow-xl` on every card by default.

**Why it's a tell**: It's *the* default. Reads as untouched stock.

**Rewrite**:
- **No shadow** + 1px tinted border + bg-elevated → 90% of cases
- **Tighter shadow with brand-tinted color**: `box-shadow: 0 1px 3px rgba(<brand-hue>, 0.08), 0 4px 12px rgba(<brand-hue>, 0.04);` — feels custom
- **Elevation via color** (Carbon pattern): elevated surfaces are lighter (dark mode) or darker (light mode) than base, no shadow needed
- **Specific shadow per surface**: card shadow is different from modal shadow is different from popover shadow

---

## 11. Inter / Roboto / Arial / system-stack as the default

**Pattern**: `font-family: 'Inter', system-ui, sans-serif;` or worse, `font-family: sans-serif;`

**Why it's a tell**: Inter is the most-trained-on font in the dataset. Roboto and Arial are stock-template tells.

**Rewrite**: Pick a font with character:

| Vibe | Choice |
|---|---|
| Technical, neutral | Geist Sans, ABC Diatype, Söhne |
| Warm, friendly | GT Walsheim, Public Sans, Geist Sans |
| Editorial, premium | Söhne, Aeonik, GT America |
| Serif headlines | Fraunces, GT Sectra, Domaine, Source Serif |
| Industrial / enterprise | IBM Plex Sans, Inter Tight (only if committed to it) |
| Brutalist / display | Pangram, Migra, ABC Whyte |

Mono:
- Geist Mono, JetBrains Mono, IBM Plex Mono, Berkeley Mono, Söhne Mono

Inter is acceptable as a *companion* to a stronger display face, never as the headline or primary body. System stack only as a fallback.

---

## 12. Centered single-column everything

**Pattern**: Every page has `max-width: 80ch; margin: 0 auto;`. Hero centered. Sections centered. CTAs centered.

**Why it's a tell**: Default doc/blog layout applied to product/marketing. Lacks composition.

**Rewrite**:
- **Asymmetric hero**: large type left-aligned, supporting visual right
- **Editorial sections**: alternating layouts (text-left, text-right, full-width quote)
- **Off-center grid**: 12-column grid where elements span 5 / 7 or 4 / 8
- **Generous left margin** (60-160px on desktop) with content flush-left
- Centered is acceptable for: single-purpose pages (404, success confirmation), and the lone hero of a focused-conversion page

---

## 13. Carousel as the hero

**Pattern**: Autoplay carousel with 3-5 marketing messages cycling every 4 seconds.

**Why it's a tell**: Visual indecision. Picked because the team couldn't decide on the message.

**Rewrite**: Pick ONE message. The most important one. Static.

If multiple messages are essential, scroll them as sequential sections (each its own hero treatment), don't cycle them.

---

## 14. "Trusted by" logo strip in color, full-resolution, large

**Pattern**: Section showing customer logos in full color at 64-80px tall.

**Why it's a tell**: Clashes visually, looks like a logo wall.

**Rewrite**:
- **Monochrome logos** at 24-32px tall
- One row or a wrapping inline arrangement
- Subtle opacity (60-70%) on light bg
- "Used by" + count > display of logos (e.g. "Trusted by 12,000 teams" + 5 logos)

---

## 15. Loading spinner in 2026

**Pattern**: Centered spinner over a blank background while data loads.

**Why it's a tell**: Skeleton screens have been industry standard since ~2018. Spinners signal "we didn't think about it."

**Rewrite**: **Skeleton screens** matching the actual layout that will appear. Animate via shimmer (subtle linear-gradient that translates across the skeleton on a 1.5-2s loop). Match exact dimensions of the final content.

Exception: very short operations (< 500ms) can use a small spinner inline (e.g. in a button while submitting). Never a full-screen spinner.

---

## 16. Vague generic CTAs

**Pattern**: "Get Started", "Learn More", "Click Here", "Try Now"

**Why it's a tell**: Says nothing about what happens next. Defaults the model picks.

**Rewrite**: Specific actions:
- "Start a free 14-day trial" (commits to specific outcome)
- "Read the architecture guide" (commits to specific destination)
- "See the dashboard demo" (commits to specific content)
- "Create your workspace" (commits to specific action)

The CTA should pass a "what happens when I click?" check — if a generic verb is all that's left, rewrite.

---

## 17. "Welcome back!" / "Let's get started!" / "Great choice!"

**Pattern**: Empty-platitude microcopy in onboarding, dashboards, success states.

**Why it's a tell**: Adds no information, fills space, reads as auto-generated.

**Rewrite**:
- Empty state: describe the empty state + action. "No invoices yet. Create your first invoice."
- Success: describe the result + next step. "Workspace created. Invite teammates →"
- Onboarding: explain what to do, with the user's specific context. "Connect Slack to receive deploy alerts."

---

## 18. Equal-weight everything

**Pattern**: All headings same weight. All cards same size. All sections same vertical padding. All gaps the same.

**Why it's a tell**: Mechanical, lacks hierarchy. Looks generated by a function, not designed.

**Rewrite**:
- **Vary spacing intentionally**: section vertical padding 96px / 128px / 64px depending on importance
- **Vary type weight**: 300 vs 700, not 400 vs 600 (need ≥ 300 weight delta for visual contrast)
- **Vary card emphasis**: one card is larger, has accent border, or carries a sparkline; others are smaller and sparser
- **Vary alignment**: section A left-aligned, section B asymmetric, section C centered for the single-action moment

Hierarchy is not optional — it's the difference between "designed" and "rendered."

---

## 19. Pastel illustration of people with laptops

**Pattern**: Generic vector illustration of figures (often legless, simplified) holding phones/laptops/coffee, with pastel skin tones and abstract floating shapes.

**Why it's a tell**: The Humaaans / unDraw / openpeeps library. Designers and stylish viewers spot it in 2 seconds.

**Rewrite**:
- **Custom illustration** in a defined style — invest in an illustrator OR pick a *specific* unique library and stick to it
- **Photography** — real product shots, real people, real environments
- **Diagrammatic illustration** (Stripe style) — explains a concept, not decorative
- **Type-as-image** — let large bold typography be the visual
- **3D renders** of products (Apple, Vercel, Apple Vision Pro pages)
- **No illustration** — many great pages have none

---

## 20. Generic "Pricing Plans" with 3 tiers, "Most Popular" middle

**Pattern**: Free / Pro / Enterprise, three identical-ish cards, middle one with a "Most Popular" badge.

**Why it's a tell**: Default SaaS pattern. Pricing pages have been clichéd for a decade.

**Rewrite**:
- **Comparison table**: features as rows, plans as columns. Way more informative.
- **Calculator**: user inputs usage, sees price. Works for usage-based products.
- **Two-tier with implicit Enterprise**: most products only really have two tiers; "contact us" replaces the third card for big customers.
- **Single tier with toggle**: "$X / month or $Y / year" — for products with one obvious package.
- **Stripe-style sliding metric** for usage-based pricing

If you must do 3 cards, emphasize the recommended one *visibly*: bigger, accent border, "recommended" copy (not "popular"). Don't pretend all are equal.

---

## 21. Spinner instead of streaming cursor

**Pattern**: Animated loading spinner while AI is generating a response, instead of revealing tokens at the leading edge as they arrive.

**Why it's a tell**: Spinners imply indeterminate loading. A streaming cursor signals "tokens are arriving live"; it's more honest and feels faster.

**Rewrite**: Use a **streaming cursor** (block `▍` or thin pulse) at the leading edge of the text, advancing at network speed. No spinner. The cursor IS the progress indicator. See [`ai-patterns/streaming-text.md`](ai-patterns/streaming-text.md) for anatomy and code skeleton.

---

## 22. Avatar on every message

**Pattern**: Small circular avatar image on every conversational message (user + AI), taking up space in the message row.

**Why it's a tell**: Clutters the chat flow; avatars are common in messaging apps but unnecessary when role is clear via other means.

**Rewrite**: Use **role headers** instead: "You" and "Assistant" (or "Claude") labels above each message block, or a role-colored left border. Reserve avatars for multi-user collaborative chats only.

---

## 23. Thinking with no progress indicator

**Pattern**: Display "Thinking..." for >3 seconds with no visual indication that processing is actually happening (no ETA, no partial output, no token count).

**Why it's a tell**: Makes the user wonder if the UI froze or if the request failed.

**Rewrite**: For reasoning/thinking phases, show:
- **Elapsed timer** (e.g., "Thinking... 2.3 seconds")
- **Partial output** (reasoning summary or token count so far)
- **Stop button** so the user can interrupt if it takes too long
- Keep the thinking section **collapsed by default** with a "Show thinking" toggle; only expand on user request.

See [`ai-patterns/reasoning-display.md`](ai-patterns/reasoning-display.md) for the full pattern.

---

## 24. Auto-apply code without explicit confirmation

**Pattern**: AI-generated code edits (file modifications, diffs, code blocks) are automatically applied to the user's codebase without a confirmation step.

**Why it's a tell**: Critical safety issue. Code changes should always require explicit user approval (button click, drag-accept, etc.) before touching the filesystem.

**Rewrite**: **Inline diff card** with "Apply" / "Reject" buttons. For multi-file edits, include "Apply All" / "Reject All". Show file path and line range in the header. Never auto-apply, not even if confidence is high. See [`ai-patterns/code-apply-reject.md`](ai-patterns/code-apply-reject.md).

---

## 25. Hidden model name to feel magical

**Pattern**: Not displaying which AI model is responding, or hiding it in a small footer, to make the UI feel "magical" or to avoid exposing the underlying system.

**Why it's a tell**: Transparency is a feature, not a liability. Users appreciate knowing which model they're talking to so they can calibrate expectations.

**Rewrite**: **Display the model name prominently** (e.g., "Claude Opus 4.7" in the input area or above the response). Include a **model picker** if the user can select different models. Add a short **capability hint** (e.g., "Best for complex reasoning") so users make informed choices. See [`ai-patterns/model-picker.md`](ai-patterns/model-picker.md).

---

## 26. Decorative gradients in the chat area

**Pattern**: Animated or static gradients (purple-to-blue, rainbow, etc.) used as the background of the chat container or message bubbles, purely for visual decoration.

**Why it's a tell**: Brand decoration should not overshadow content. Gradients in the chat area reduce text contrast and clutter the focus area.

**Rewrite**: Use **solid, neutral backgrounds** for chat (light mode: `oklch(0.99 0 0)`; dark mode: `oklch(0.12 0 0)` or similar). Reserve accent colors for **interactive elements** (buttons, links) or **system indicators** (status pills, badges). Gradients, if used at all, belong only in non-content chrome (hero section, login screen) and only when fully intentional and on-brand.

---

## 27. Modal for system prompt or settings

**Pattern**: System prompt editor, model settings, or conversation settings open in a modal dialog that overlays the entire chat.

**Why it's a tell**: Modals block the chat behind them. Settings and system prompts are infrequent edits and don't need modal focus.

**Rewrite**: Use a **side panel** (sheet) that slides in from the right, keeping the chat visible. Alternatively, use a **slash command** (e.g., `/prompt`) that opens an inline editor without modal overlay. For settings, a **collapsible section** in the input area is even better. See [`ai-patterns/system-prompt-editor.md`](ai-patterns/system-prompt-editor.md).

---

## 28. Every tool call expanded by default

**Pattern**: All tool-call cards in the conversation stream are displayed in expanded state (showing full input JSON + output), taking up significant vertical space.

**Why it's a tell**: Makes the chat unreadable. The expanded state should be opt-in, not the default.

**Rewrite**: **Collapse by default** with a `▶ <tool_name>(args)` label and status pill inline. User toggles expand via the chevron. Expanded state shows input JSON + output preview. Never auto-expand; never auto-scroll the user to an expanded tool card. See [`ai-patterns/tool-use-card.md`](ai-patterns/tool-use-card.md).

---

## 29. Carousel as primary navigation

**Pattern**: Carousel component (auto-play or manual pagination) used for primary feature navigation, showing 3–5 items cycling every 4–5 seconds.

**Why it's a tell**: NN/g research shows carousel engagement is <1% per item shown. Users miss items; carousels create decision paralysis.

**Rewrite**: **Static list** or **sequential sections** instead. If there are multiple equal-weight items to showcase, use:
- Vertical list (stacked sections, full-width)
- Grid (if each item is truly independent)
- Tabbed interface (explicit selection via tabs)
- Scroll-snap horizontal list (explicit user control, no auto-play)

See [`ux-research/nn-g-heuristics.md`](ux-research/nn-g-heuristics.md) for the research backing.

---

## 30. Hover-only actions on touch surfaces

**Pattern**: Interactive elements (edit, delete, share buttons) appear only on `:hover`, making them inaccessible on touch devices (tablets, phones, mobile browsers).

**Why it's a tell**: Violates WCAG 2.5.7 (Target Size). Touch users have no way to trigger the action.

**Rewrite**: **Always visible** action buttons or a **context menu** (long-press / right-click). Alternatively, use a **trailing action button** or **leading checkbox** that is always present. If space is tight, reveal via a **more menu** (⋯) that's always tappable, not on hover. See [`accessibility/wcag-2.2-checklist.md`](accessibility/wcag-2.2-checklist.md) (WCAG 2.5.7 & 2.5.8).

---

## 31. Auto-playing video with sound

**Pattern**: Video embedded on a page or in a slide/carousel that auto-plays with sound unmuted or auto-enabled.

**Why it's a tell**: NN/g and Baymard research agree: auto-play video is universally disliked. Users are startled, lose focus, and immediately mute or close.

**Rewrite**: **No auto-play**, ever. Let the user click to play. If video is important, use a:
- **Static thumbnail** with a big play button overlay
- **GIF or animated still** (muted) to convey motion without sound
- **Muted auto-play** only if absolutely necessary, with an explicit pause button and volume toggle always visible

For loop/background video in hero sections, mute by default; only allow sound if the user clicks an unmute button.

See [`ux-research/baymard-findings.md`](ux-research/baymard-findings.md).

---

## 32. Inconsistent form label position

**Pattern**: Form labels appear **above the input** on desktop but **inside the input** (placeholder-style) on mobile, or vice versa. Inconsistent across different forms on the same product.

**Why it's a tell**: Creates cognitive load; users expect consistent behavior. Label-inside on mobile causes usability issues (disappears on focus, reduces visible input area).

**Rewrite**: **Pick one strategy and stick with it across all forms**:
- **Label above input** (recommended) — works on all screen sizes, always visible, best for accessibility and completion rates per Baymard research.
- **Label as floating placeholder** (if must vary) — label floats above the input as the user types; requires careful CSS and works well on desktop but can feel cramped on mobile.
- **Inline helper text** — small muted text below or inside the input for longer explanations; separate from the label.

Baymard research shows label-above performs best for form completion rates across all devices.

See [`ux-research/baymard-findings.md`](ux-research/baymard-findings.md).

---

## How to use this catalogue

When the user invokes `ui-expert`, the post-generation audit checks the output against this list. For each match:

1. **Diagnose** — name the pattern (e.g. "matches anti-pattern #4: hero-metric template")
2. **Justify** — quote the specific tell ("4 identical KPI cards across the top")
3. **Rewrite** — propose the specific replacement from this file
4. **Apply** — modify the code

Severity:
- **Critical** (block ship): #1, #2, #3, #4, #6, #11, #16, #20
- **Major** (rewrite required): #5, #7, #9, #10, #12, #15, #17, #18, #19
- **Minor** (recommend rewrite): #8, #13, #14

Critical findings block the response from declaring "done" — the chain to `ai-slop-audit` must complete with zero criticals.
