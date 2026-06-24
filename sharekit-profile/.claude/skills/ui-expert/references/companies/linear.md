# Linear (linear.app)

The reference for **developer-tooling SaaS** in 2026. If the surface is an internal tool, project tracker, dev console, or any "tool engineers use daily", Linear is the default anchor.

## Aesthetic identity

- **Tone**: precision-engineered, dark-first, monospace-adjacent, no decoration that doesn't pay rent.
- **One-sentence physical scene**: "Engineer triaging issues on a 14-inch laptop at 11pm, ambient room light, switching between this and the terminal every 30 seconds."

## Concrete tokens (observed from the product)

### Color (dark mode — the canonical Linear theme)

```css
--bg:          oklch(0.18 0.005 270);  /* near-black, slight blue tint */
--bg-elevated: oklch(0.22 0.005 270);  /* sidebar, cards */
--fg:          oklch(0.96 0.005 270);  /* not white — tinted */
--fg-muted:    oklch(0.66 0.008 270);
--border:      oklch(0.30 0.008 270);
--accent:      oklch(0.62 0.18 265);   /* Linear's signature blurple */
```

In light mode, invert lightness, keep the tint hue.

### Typography

- **Family**: Inter Display (custom-tuned), but for non-Linear builds use **Geist Sans**, **ABC Diatype**, or **Söhne**. Never plain Inter — it's the slop default.
- **Mono**: Geist Mono or Berkeley Mono for IDs, codes, hashes.
- **Scale**:
  - Display: 32px / weight 600 / leading 1.1
  - Heading: 18px / weight 600 / leading 1.3
  - Body: 13px / weight 400 / leading 1.45
  - Label: 11px / weight 500 / uppercase / tracking 0.04em
- **Weight contrast**: 600 vs 400. The 600 is *just* heavy enough.

### Spacing (4pt base)

- Used steps: 4, 8, 12, 16, 24, 32, 48
- Sidebar item: 12px horizontal padding, 8px vertical, 4px gap to icon
- Card: 16px padding, 12px between elements
- Section: 24-32px gap

### Radius

- 4px (inputs, buttons, small surfaces)
- 6px (cards, dropdowns)
- 999px (pills, avatars)

### Motion

- Duration: 120ms (hover/focus state changes), 200ms (panel transitions), 320ms only for major state changes
- Curve: `cubic-bezier(0.2, 0, 0, 1)` — sharp ease-out
- No spring, no bounce

## Signature components

### Sidebar

```
- 240px wide collapsed, 280px expanded
- Row height: 28px (tight), 36px on hover
- Group label: 11px uppercase muted, 8px left padding
- Item: 12px L-padding, 4px icon gap, 13px label
- Hover: bg shifts to --bg-elevated, NO scale, NO underline
- Active: bg + 2px left-edge accent OR bg only — pick one and stick to it
- Selected item icon: tinted with accent; unselected: muted
```

### Command palette (Cmd+K)

This is Linear's most-copied pattern. Anatomy:

```
- Modal: 640px wide, 16px from top of viewport, fades in 150ms
- Input: 44px tall, 16px padding, no border, just an icon-left
- List rows: 36px tall, 12px padding, instant filter (no debounce)
- Group separators: 11px muted label, NOT a divider line
- Selected row: bg-elevated, no left-accent
- Keyboard hint on right: 11px monospace, muted
- Footer: 32px tall with arrow-key + return hints, optional
```

### Issue/list row

- 36-40px tall
- 4-6 inline metadata pills (status, priority, assignee, labels) — *not* stacked
- Each pill is monospace-flavored for IDs
- Hover reveals row-level actions on the right; no hover means no clutter

### Status pill

- 22-24px tall
- 6-8px horizontal padding
- 4px radius (not pill-shaped — that's Notion's style)
- Dot indicator left of label (8px circle)
- Label is `11px` weight 500

### Buttons

- Primary: filled with accent, 32px tall, 12px padding, no shadow, no gradient
- Secondary: ghost with border, same dimensions
- Tertiary: text-only, no background even on hover (just opacity)
- Never use `shadow-md` on a button

## Anti-patterns in Linear's world

- ❌ Heavy shadows or elevation drops
- ❌ Decorative gradients (Linear has zero)
- ❌ Animated icons that move on hover
- ❌ Tooltips that take > 200ms to appear
- ❌ Modals for non-destructive actions (Linear uses slide-overs or inline)
- ❌ Inline color emoji (uses custom monochrome icons)
- ❌ Border radii > 8px on data surfaces

## When to anchor here

✅ Issue tracker, task manager, project tracker
✅ Developer dashboard, deploy console
✅ Any tool with a sidebar + list-detail layout
✅ Any tool where a command palette is the primary navigation
✅ Internal admin surfaces for engineering teams

❌ Consumer-facing marketing
❌ Anything where warmth/welcome is the priority — go to Notion instead
