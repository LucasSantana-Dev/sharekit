# Vercel (vercel.com)

The reference for **developer-tooling marketing + admin** in 2026. Geist design system. Setting the visual standard for any company adjacent to Next.js / deployment / infra.

## Aesthetic identity

- **Tone**: Swiss-grid precision, monochrome with one accent, technical credibility through restraint.
- **One-sentence physical scene**: "Founder of a Series-A infra company on a Studio Display at 10am, evaluating a competitor's product page in a side-by-side window."

## Concrete tokens

### Color

Vercel uses near-pure monochrome with brand-tinted neutrals:

```css
/* Light */
--bg:          oklch(1.00 0 0);           /* effectively white but written as token */
--bg-elevated: oklch(0.985 0.002 240);
--fg:          oklch(0.15 0.005 240);     /* not #000 — tinted */
--fg-muted:    oklch(0.55 0.008 240);
--border:      oklch(0.92 0.005 240);
--accent:      oklch(0.18 0 0);           /* black IS the accent — committed */

/* Dark */
--bg:          oklch(0.10 0.005 240);
--bg-elevated: oklch(0.14 0.005 240);
--fg:          oklch(0.98 0.005 240);
--fg-muted:    oklch(0.65 0.008 240);
--border:      oklch(0.25 0.008 240);
--accent:      oklch(0.95 0 0);           /* white IS the accent in dark mode */
```

When a brand accent is needed (rare), use a saturated single hue. Vercel uses cyan and magenta as deploy/branding accents — *never* together.

### Typography

- **Family**: Geist Sans (free, open source, ships via Next.js font system)
- **Mono**: Geist Mono
- **Scale**:
  - Hero: 72-96px / weight 600 / leading 0.95 / tracking -0.04em
  - Heading: 32-48px / weight 600 / leading 1.1 / tracking -0.02em
  - Sub: 18-20px / weight 400 / muted
  - Body: 14-16px / weight 400 / leading 1.5
  - Mono: 13-14px / weight 400 / leading 1.4
- **Tracking is negative** at large sizes. This is what makes Vercel headlines feel sharp.

### Spacing (4pt base, but visually feels 8pt due to large sections)

- Used steps: 4, 8, 12, 16, 24, 32, 48, 64, 96
- Hero section vertical padding: 96-128px
- Card padding: 24px
- Inline element gap: 8-12px

### Grid background (the signature)

```css
.grid-bg {
  background-image:
    linear-gradient(to right, oklch(0.92 0.005 240 / 0.4) 1px, transparent 1px),
    linear-gradient(to bottom, oklch(0.92 0.005 240 / 0.4) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

**Critical**: opacity 0.3-0.4 max. If you can read the grid before the content, it's too strong. Vercel's grid is subliminal — you feel structure without seeing lines.

Dot grid alternative:
```css
background-image: radial-gradient(oklch(0.92 0.005 240 / 0.5) 1px, transparent 1px);
background-size: 16px 16px;
```

## Signature components

### Hero

```
- Single H1 at 72-96px, tight tracking
- One-line description, 18-20px, muted color
- Two CTAs: primary (solid black) + secondary (border outline)
- Background: grid (above) OR a single product screenshot floating to the side
- NO decorative gradient blobs
- NO scrolling marquee logos in the first viewport
```

### Code-as-marketing block

Vercel embeds code samples on marketing pages. Anatomy:

```
- Container: bg-elevated with 1px border, 8px radius
- Padded 16-20px
- Header: tiny tab bar OR file name in mono, muted
- Code: Geist Mono 13px, syntax-highlighted with restraint (3-4 colors max)
- Optional: copy button top-right, only on hover
```

### Card (deploy / project tile)

```
- 1px border, no shadow, 8px radius
- 16-20px padding
- Title: 14-16px weight 600
- Meta: 12-13px muted (e.g. "Last deployed 2h ago")
- Right side: status dot or chip
- Hover: border darkens, no scale, no shadow
```

### Stat / metric

When numbers must be shown:
```
- Number: 32-48px weight 600
- Label: 12-13px muted uppercase tracking 0.04em ABOVE the number (label-first reading)
- Trend: small chip with arrow, NOT a sparkline
- No "vs last month" microcopy unless it's part of the number's meaning
```

## Anti-patterns in Vercel's world

- ❌ Glassmorphism (zero presence)
- ❌ Multi-color gradients (cyan-to-magenta is the *only* signature gradient, used sparingly)
- ❌ Rounded corners > 12px on data surfaces
- ❌ Drop shadows for elevation (border + bg shift instead)
- ❌ Decorative illustrations (Vercel uses 3D renders or product screenshots only)
- ❌ Bento grids in the hero
- ❌ Inter, system fonts, or any default stack

## When to anchor here

✅ Developer tool marketing pages
✅ Pricing pages for technical products
✅ Documentation sites
✅ Deploy/infra/observability dashboards
✅ Anywhere "technical credibility through restraint" is the goal

❌ Consumer products (too cold)
❌ Editorial/long-form content (Vercel marketing is short-form)
❌ Surfaces where warmth or play matter
