# Register: consumer-saas

The product is consumed primarily by individuals, creators, or small-team general professionals (not developers, not enterprise IT). Examples: note-taking, design tools (Canva-like), creator tools, productivity, lifestyle apps.

## Audience expectations

- Doesn't read design language fluently
- Responds to warmth, personality, and clear demonstrations
- Will abandon if onboarding is more than 3 screens
- Trusts testimonials with faces and names
- Wants to feel competent, not lectured
- Compares ~3 alternatives, picks based on vibe + first-task success

## Primary anchors

- [Notion](../companies/notion.md) — warm-minimal master
- [Apple HIG](../companies/apple-hig.md) — for app shells
- Linear can be a *secondary* anchor for "tool that respects power-user" surfaces

## Mandatory rules

### Typography
- **At least one serif on the page.** Headlines in serif (Fraunces, GT Walsheim, Domine, Source Serif). This is the single biggest signal of warmth.
- Body in friendly sans (Inter is acceptable here; GT Walsheim, Public Sans, Geist Sans elevate further)
- No mono unless there's a real reason (code, monospaced data)
- Display sizes can be large but never huge — 48-64px hero, not 96+

### Color
- Off-whites and warm greys (not pure white)
- Warm dark for text (not pure black)
- Accent color: warm OR muted (mustard, terracotta, sage, dusty blue) — saturated cool tones feel corporate
- Optional: a small palette of "tag colors" for user content (Notion's pattern)

### Spacing
- Generous. 24-32px between sections. Comfortable reading.
- Page margins: 24-32px at mobile, 96-160px at desktop
- Single-column for most content (multi-column is dense-feels-cold)

### Imagery
- Use real photography OR custom illustration. Never stock.
- If using illustration: pick a defined style (Notion's character illustrations, Mailchimp's playful figures, etc.) — never the generic "isometric vector people" library
- Hero can have product screenshots, but they should feel inviting (rounded corners 12-16px, slight tilt, drop shadow with brand tint)

### Microcopy
- Friendly but not childish ("Add a new note" not "Yay! Let's make a note!")
- First-person from the product is OK ("Save your progress" → "We'll save your progress" only sparingly)
- Empty states should help, not greet ("No notes yet. Start with a daily journal entry." > "Welcome!")
- No emojis in core UI unless the product is explicitly about emoji content (Notion uses emoji as user-content icons, never in nav)

## Required components

1. **Welcoming empty state** with illustration + one-sentence action
2. **Onboarding tour** that completes in ≤ 3 steps
3. **Settings panel** with grouped sections (Notion or Apple style)
4. **Editable inline content** (no edit-mode buttons where avoidable)
5. **Notification with avatar** (if collaborative)
6. **Soft-but-clear destructive confirmation** (full-page or sheet, not a tiny modal)

## Register-specific anti-patterns

- ❌ Pure white background and pure black text (the most-cited "AI made that" tell in consumer)
- ❌ All-sans typography (no warmth)
- ❌ "Bento grid" hero
- ❌ Saturated cool blues as accent (corporate clash)
- ❌ Stock photography
- ❌ Generic vector illustration of "people with laptops"
- ❌ Dark mode as the default — most consumer users want light. Offer it as a preference.
- ❌ Dense data tables (consumer tools rarely need them; if they do, use Stripe-style readable rows)
- ❌ Excessive shadows ("floating cards" pattern that says SaaS-template)
- ❌ Carousels in the hero (autoplaying or otherwise)

## Token starter

```css
--bg:           oklch(0.985 0.005 80);       /* off-white, warm tint */
--bg-elevated:  oklch(0.97 0.006 80);
--fg:           oklch(0.20 0.01 80);
--fg-muted:     oklch(0.55 0.015 80);
--border:       oklch(0.92 0.008 80);
--accent:       oklch(0.50 0.12 30);          /* warm earth tone */

--font-display: "Fraunces", "GT Walsheim", "Source Serif", Georgia, serif;
--font-body:    "GT Walsheim", "Public Sans", "Inter", system-ui, sans-serif;
--font-mono:    "iA Writer Mono", monospace;

--radius-1:     4px;
--radius-2:     8px;
--radius-3:     12px;
```
