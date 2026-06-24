# Stripe (stripe.com, dashboard.stripe.com)

The reference for **fintech / payments / money-movement** UI in 2026. Set the standard a decade ago and keeps refining rather than chasing trends.

## Aesthetic identity

- **Tone**: information-dense but legible, "we know more than you" through controlled depth, marketing reads like documentation.
- **One-sentence physical scene**: "CTO at a Series-B startup choosing between three payment providers, reading API docs and pricing side-by-side at 3pm in a co-working space."

## Concrete tokens

### Color

```css
--bg:          oklch(1.00 0 0);
--bg-elevated: oklch(0.985 0.002 280);
--fg:          oklch(0.12 0.01 280);
--fg-muted:    oklch(0.50 0.02 280);
--border:      oklch(0.93 0.008 280);
--accent:      oklch(0.55 0.20 270);   /* Stripe purple — committed */
--success:     oklch(0.65 0.18 145);
--warning:     oklch(0.78 0.15 75);
--danger:      oklch(0.58 0.22 25);
```

The accent is **one** purple. Used purposefully — for primary CTAs, key data points, brand moments. Not as a gradient.

### The Stripe gradient (only one, used at the top of marketing pages)

```css
background: linear-gradient(
  135deg,
  oklch(0.85 0.15 200) 0%,
  oklch(0.80 0.18 230) 25%,
  oklch(0.70 0.22 270) 50%,
  oklch(0.65 0.24 310) 75%,
  oklch(0.78 0.20 350) 100%
);
```

This is animated, slow (15-30s loop), and only appears in the **hero** of marketing pages. Never on dashboards. Never on cards.

### Typography

- **Family**: Sohne (custom, paid). Free alternatives: **ABC Diatype**, **Aeonik**, or **Geist Sans** if dev-leaning.
- **Mono**: Camera Mono (custom) or **IBM Plex Mono**, **JetBrains Mono**.
- **Scale**:
  - Hero: 56-72px / weight 600 / leading 1.05 / tracking -0.02em
  - Section heading: 28-40px / weight 600 / leading 1.15
  - Card heading: 16px / weight 600
  - Body: 15-16px / weight 400 / leading 1.55
  - Caption: 13px / weight 400 / muted
  - Mono (numbers, codes): tabular-nums variant always on
- **Numbers**: always tabular-nums on dashboards. Always.

### Spacing (4pt base, marketing uses larger sections)

- Used steps: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128
- Card padding: 24px
- Section vertical: 96-128px on marketing, 32-48px in dashboard
- Inline gap: 8-12px

### Radius

- 4-6px (inputs, small surfaces)
- 8px (cards)
- 12px (large containers, modals)
- Never 16+ unless it's a pill (999px)

## Signature components

### KPI card (the Stripe Dashboard standard)

This is the most-copied pattern in fintech. Anatomy:

```
- 1px border, 8px radius, NO shadow
- 20-24px padding
- Top row: label (13px muted) + optional info icon
- Middle: amount in tabular-nums (32-48px weight 600)
- Symbol/unit suffix (24px weight 500, muted) inline with the number
- Bottom row: trend chip (arrow + percentage) + sparkline OR just the chip
- Sparkline: 40-50px tall, single line color (accent for positive, muted for neutral)
```

**Critical**: not all KPI cards on a page should weigh equally. The most important number is bigger or has the sparkline; secondary KPIs are just number + trend.

### Code block (marketing)

Stripe's marketing pages are filled with API examples. Anatomy:

```
- Container: dark bg even in light mode (#0a0a0a-ish, slightly tinted)
- 12px radius
- Padding: 20px
- Header: language selector tabs (subtle, monospace), copy button
- Code: 13-14px mono, syntax-highlighted with 4-5 colors max
- Output: separated by a divider, lighter bg, prefix indicator
```

### Data table (Dashboard)

```
- Row height: 56px (comfortable) — Stripe doesn't go dense, they go readable
- Borders: bottom border only, not full grid
- First column: optional avatar or icon (32px)
- Numbers: tabular-nums, right-aligned
- Status: pill at 22px, dot+label
- Hover: bg tint (very subtle), no transform
- Row click: opens a slide-over panel from the right, not a modal
```

### Form input

```
- Height: 40px (forms have breathing room)
- 1px border, 6px radius
- Label above input, 13px muted weight 500
- Helper text below, 12px muted
- Focus: accent ring at 2px with offset, not just border-color
- Error: red border + red helper text + small icon
- Always show what currency / format is expected (suffix or placeholder example)
```

### Pricing page pattern

Stripe almost never uses a card grid. They use:

```
- A single comparison table OR
- A "calculator" block where the user inputs volume and sees their price OR
- Three tiered cards with the MIDDLE one emphasized (larger, accent border, "popular" badge — used sparingly)
```

If your fintech product is showing pricing as 3 identical cards, it's slop.

## Marketing-specific patterns

- Hero gradient as the *only* gradient on the page
- 2-3 sentence intro, then code examples
- "Used by X, Y, Z" logo strip — but logos are *monochrome* and at 24-32px height, not a big colorful row
- Section transitions via background color shifts (white → off-white → tinted)
- Footer is dense, multi-column, with sitemap-style links

## Anti-patterns in Stripe's world

- ❌ Multiple gradients per page
- ❌ Bento grid hero
- ❌ Equal-weight card grids
- ❌ Sparklines on every metric (only the important ones)
- ❌ Decorative shadows on cards
- ❌ Sans-serif numbers without tabular-nums
- ❌ Bright colors outside accent/success/warning/danger semantics
- ❌ Modals for editing — always slide-over or inline

## When to anchor here

✅ Payments, banking, treasury, accounting, invoicing
✅ Any product where trust + technical credibility matters
✅ B2B with a developer audience but consumed by finance teams
✅ Dashboards with money/volume metrics
✅ Marketing pages where the value is "we are reliable + well-engineered"

❌ Consumer-only products (Stripe is B2B coded)
❌ Pure dev tools (go Vercel/Linear)
❌ Editorial/content sites
