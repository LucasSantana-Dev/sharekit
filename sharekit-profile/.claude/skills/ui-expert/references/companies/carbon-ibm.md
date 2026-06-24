# Carbon (IBM Carbon Design System)

The reference for **enterprise B2B, dense data, internal tools, admin panels**. Where Linear is opinionated about taste, Carbon is opinionated about *information density*.

## Aesthetic identity

- **Tone**: industrial, gridded, dense, data-first, no decoration that doesn't carry information.
- **One-sentence physical scene**: "Operations analyst with 6 browser tabs open at 9am Tuesday, 27-inch monitor, needs to reconcile 1,200 transactions before 11am."

## Concrete tokens

### Color (the Carbon palette — exact)

Carbon uses defined cool-blue grey neutrals with sharp ramps:

```css
/* Gray scale (cool, neutral) */
--gray-10:  #f4f4f4;
--gray-20:  #e0e0e0;
--gray-30:  #c6c6c6;
--gray-50:  #8d8d8d;
--gray-70:  #525252;
--gray-90:  #262626;
--gray-100: #161616;

/* Blue scale (Carbon blue is the standard accent) */
--blue-60:  #0f62fe;   /* Carbon's signature interactive blue */
--blue-70:  #0043ce;
--blue-80:  #002d9c;

/* Semantic */
--support-error:    #da1e28;
--support-success:  #24a148;
--support-warning:  #f1c21b;
--support-info:     #0043ce;
```

### Elevation by color (Carbon's signature)

In dark mode, surfaces get **lighter** as elevation increases. In light mode, they get *darker* (or use minimal shadow). This is opposite to most shadow-based systems.

```css
/* Dark mode example */
--ui-background:   #161616;  /* base */
--ui-01:           #262626;  /* tier 1: cards */
--ui-02:           #393939;  /* tier 2: modal */
--ui-03:           #525252;  /* tier 3: tooltips */
```

### Typography (IBM Plex)

- **Family**: **IBM Plex Sans** (free, open source)
- **Mono**: **IBM Plex Mono**
- **Serif** (optional, for editorial within Carbon): **IBM Plex Serif**
- **Scale** (Carbon "type ramp"):

| Token | Size | Weight | Line height |
|---|---|---|---|
| `display-04` | 84px | 300 | 1.0 |
| `display-03` | 64px | 300 | 1.0 |
| `productive-heading-07` | 54px | 300 | 1.07 |
| `productive-heading-05` | 32px | 400 | 1.25 |
| `productive-heading-03` | 20px | 400 | 1.4 |
| `productive-heading-02` | 16px | 600 | 1.375 |
| `body-long-01` | 14px | 400 | 1.43 |
| `body-short-01` | 14px | 400 | 1.29 |
| `caption-01` | 12px | 400 | 1.33 |
| `label-01` | 12px | 400 | 1.33 |

**Productive** vs **Expressive**: Carbon distinguishes two type modes. *Productive* is dense, in-app. *Expressive* is editorial, marketing. Use productive in dashboards.

### Spacing (the Carbon 2pt grid)

Used steps (Carbon tokens):

| Token | Value |
|---|---|
| `spacing-01` | 2px |
| `spacing-02` | 4px |
| `spacing-03` | 8px |
| `spacing-04` | 12px |
| `spacing-05` | 16px |
| `spacing-06` | 24px |
| `spacing-07` | 32px |
| `spacing-08` | 40px |
| `spacing-09` | 48px |
| `spacing-10` | 64px |
| `spacing-11` | 80px |
| `spacing-12` | 96px |
| `spacing-13` | 160px |

### Radius

Carbon historically uses **0** radius. Sharp corners are part of the industrial identity. Carbon 11+ allows 4px on rare surfaces but the default is `0`.

This is the strongest single signature of Carbon — pixel-sharp corners signal "enterprise serious tool".

### Motion

- Duration: `fast-01` 70ms, `fast-02` 110ms, `moderate-01` 150ms, `moderate-02` 240ms, `slow-01` 400ms
- Curve: `standard` `cubic-bezier(0.2, 0, 0.38, 0.9)`
- No bounce, no overshoot

## Signature components

### Data table (the Carbon DataTable)

This is THE reference for dense enterprise tables:

```
- Row height: 32px (compact), 40px (short), 48px (default), 64px (tall)
- Bottom border only between rows, 1px gray-20 (light) / gray-80 (dark)
- Header row: 32-48px, bg gray-10 / gray-90, label-01 weight 600
- Column alignment: text-left, numbers-right, status-center
- Sort indicators: subtle arrow on hover; current sort gets blue-60 arrow
- Row hover: bg gray-10 (light) / gray-80 (dark)
- Row selected: blue-60 left border 2px + bg blue-10 tint
- Sticky header always; optional sticky first column
- Batch actions: when ≥1 row checked, action bar slides over header (blue-60 bg)
```

### Tile (Carbon's card equivalent)

```
- 0px radius (sharp)
- 1px border gray-20 OR no border + bg-elevated
- 16-24px padding
- Heading: heading-02 (16px / weight 600)
- Body: body-01 (14px)
- Hover: 1px blue-60 border or bg shift
- NO shadows
```

### Form

Carbon forms are vertical, labeled-above, dense:

```
- Label: label-01 (12px), 8px above input
- Input height: 40px (default), 48px (large)
- Border: 1px gray-30 bottom-only (Carbon signature) OR full 1px in newer versions
- Focus: 2px blue-60 ring, no offset
- Helper text: caption-01 (12px) below input, 4px gap
- Error: red border + red helper + small red icon
- Field gap: 24px (spacing-06)
```

### Notification / Toast

Carbon's inline notification is recognizable:

```
- Sharp corners
- Left edge: 4px solid colored bar (success/info/warning/error)
- 16px padding
- Icon (24px) + Title (heading-02) + body (body-01)
- Close button top-right
- Toast variant: same anatomy, slides in from top-right, auto-dismiss 5-10s
```

### Tabs

```
- 40-48px tall
- Bottom 2px border, active tab has solid 3px blue-60
- Label: 14px weight 500
- Inactive: gray-70, hover gray-90
- Sharp corners (no pill tabs)
```

## Anti-patterns in Carbon's world

- ❌ Rounded corners on data surfaces
- ❌ Shadow-based elevation (use color tier)
- ❌ Decorative gradients
- ❌ Spacing not on the 2pt grid (no 14px, no 18px — must be 12/16/24)
- ❌ Color-only status (always include icon + label)
- ❌ Marketing-flavored microcopy ("Get started!") in admin contexts
- ❌ Helvetica/Inter as the primary family (Plex is non-negotiable for Carbon vibe)

## When to anchor here

✅ Internal admin tools, ops dashboards
✅ B2B SaaS for enterprise IT, security, compliance audiences
✅ Data-heavy interfaces: BI, analytics, observability, finance ops
✅ Workflow tools with complex forms
✅ Any product where "professional + dense + serious" is the brand

❌ Consumer products (too cold)
❌ Marketing pages (too sparse on warmth)
❌ Creative tools (too constrained)
