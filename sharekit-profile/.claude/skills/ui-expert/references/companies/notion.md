# Notion (notion.so)

The reference for **consumer-SaaS, warm-minimal productivity** UI. Where Linear is cold-precise, Notion is warm-precise. Inviting without being childish.

## Aesthetic identity

- **Tone**: human, warm, unintimidating, with serif headings and soft surfaces. Personality without being playful.
- **One-sentence physical scene**: "Writer arranging weekly notes on a MacBook at a cafe Sunday morning, light beige walls, mild coffee buzz, music in the background."

## Concrete tokens

### Color

Notion's signature warmth comes from off-whites and warm greys, never pure white:

```css
--bg:          oklch(0.985 0.005 80);   /* off-white, warm tint */
--bg-elevated: oklch(0.97 0.006 80);    /* sidebar, hover */
--fg:          oklch(0.25 0.01 80);     /* warm dark, not black */
--fg-muted:    oklch(0.55 0.015 80);
--border:      oklch(0.92 0.008 80);
--accent:      oklch(0.45 0.02 30);     /* warm brown-grey */
```

Notion also assigns colors to user content (callouts, tags) using a defined palette of muted, warm hues — never saturated.

### Typography

- **Headlines**: serif. Notion uses **GT Walsheim** for the brand and **Lyon** for marketing display. Free alternatives: **Fraunces**, **Source Serif**, or **Domine**.
- **Body**: **Inter** is acceptable here because Notion has earned its restraint, but **GT Walsheim** or **Söhne** elevate further.
- **Mono**: **iA Writer Mono** or **JetBrains Mono** for inline code.
- **Scale**:
  - Page title: 40px / weight 700 / leading 1.15 — serif
  - H1: 30px / weight 600 / leading 1.2 — serif
  - H2: 24px / weight 600 — sans
  - Body: 16px / weight 400 / leading 1.55
  - Caption: 14px / weight 400 / muted
- The serif/sans mix is the signature. Headings = serif; everything else = sans.

### Spacing (8pt base)

- Used steps: 4, 8, 12, 16, 24, 32, 48
- Page padding: 96-120px left/right at desktop (very generous), 16-24px at mobile
- Inline gap: 8px
- Block gap: 12px

### Radius

- 3-4px (inputs)
- 6px (cards, callouts)
- 999px (avatars only)

Soft, not floofy. Notion stays under 8px for most surfaces.

## Signature components

### Callout / block

```
- Soft background tint matching block color (e.g. yellow → oklch(0.96 0.05 90))
- 1px tinted border, 6px radius
- 16px padding
- Optional emoji icon on left (custom user-set)
- Body text in default body style
```

### Toggle / collapsible

```
- 14px chevron icon left of label, rotates on expand
- Label inline at body size
- 4px spacing between chevron and label
- Hover: very subtle bg tint
- Press: 100ms ease-out rotation
```

### Inline edit / hover-to-edit

This is Notion's killer pattern. Anatomy:

```
- Default: looks like static text
- Hover: subtle outline or background highlight appears
- Click: becomes an input, preserving identical dimensions
- Save on blur or Enter — no save button needed
- ESC to cancel
```

The lack of distinct "edit mode" buttons is the entire vibe.

### Page header

```
- Optional cover image at 280-320px tall
- Emoji or custom icon at -16px from cover (overlapping)
- Title in serif at 40-48px
- 24px gap to first block
```

## Anti-patterns in Notion's world

- ❌ Pure white background (#fff)
- ❌ Hard black text (#000)
- ❌ Sharp 12px corners on everything
- ❌ "Edit" buttons for inline content
- ❌ Modals for editing anything
- ❌ Bright/saturated colors anywhere except user-tagged content
- ❌ All-sans-serif (the serif headlines are non-negotiable for the warmth)

## When to anchor here

✅ Productivity, note-taking, knowledge management
✅ Editorial-leaning SaaS
✅ Consumer-facing tools for individuals and small teams
✅ Any "warm minimal" brand
✅ Long-form-reading-friendly surfaces

❌ Developer tooling (go Linear)
❌ Fintech (too soft, low trust)
❌ Data-dense dashboards (too sparse)
