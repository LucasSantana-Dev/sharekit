# Atlassian Design System (atlassian.design)

The design language for **collaboration and work management at enterprise scale**. Anchor here for Jira-style interfaces, issue trackers with deeper team features, or any surface where transparency and shared context across distributed teams is paramount.

## Aesthetic identity

- **Tone**: approachable-but-professional, slightly more decorative than Polaris or Primer, iconic mascots and illustrations welcome, "the sticky note went digital but kept its personality."
- **One-sentence physical scene**: "Team leads planning a sprint on a conference-room monitor, post-it notes on the whiteboard beside it, then five team members viewing the same board from home."

## Concrete tokens (from atlassian.design)

### Color (semantic-first design tokens)

Atlassian uses a **semantic token layer** on top of a numeric palette. The key tokens:

```css
/* Semantic background tokens */
--color-background-neutral: oklch(0.98 0.001 270);        /* default light bg */
--color-background-neutral-subtle: oklch(0.95 0.002 270); /* hover state */
--color-background-selected: oklch(0.88 0.008 240);       /* light blue */

/* Semantic text tokens */
--color-text: oklch(0.25 0.005 270);                     /* primary text */
--color-text-subtle: oklch(0.58 0.005 270);              /* secondary text */
--color-text-subtlest: oklch(0.75 0.005 270);            /* tertiary */

/* Brand blue (Jira signature) */
--color-icon-brand: oklch(0.46 0.17 265);               /* #0052CC range */

/* Semantic status tokens (used widely in Jira) */
--color-background-success-subtle: oklch(0.92 0.03 140); /* success bg */
--color-background-warning-subtle: oklch(0.92 0.05 80);  /* warning bg */
--color-background-danger-subtle: oklch(0.92 0.06 20);   /* danger bg */
--color-background-discovery-subtle: oklch(0.92 0.06 290); /* discovery (purple) */
--color-background-information-subtle: oklch(0.88 0.08 240); /* info blue */
```

Atlassian publishes a **master token taxonomy** at `atlassian.design/tokens`. Use it directly — do not invent shorthand.

### Typography

- **Font families**: Confluence and Jira ship with **Charlie Sans** (Atlassian's custom face), but production can substitute **Inter** or **IBM Plex Sans**.
- **Scale** (standard design tokens):
  - Display: 35px / weight 600 / leading 1.1
  - Heading XL: 24px / weight 600 / leading 1.3
  - Heading L: 20px / weight 600 / leading 1.3
  - Heading M: 16px / weight 600 / leading 1.4
  - Body: 14px / weight 400 / leading 1.5
  - Body small: 12px / weight 400 / leading 1.4
- **Mono** (for technical UI, e.g., code review): Monospace, 13px / weight 400

### Spacing

Atlassian's scale is **2/4/6/8/12/16/24/32/40/48**. Common usage:

- Compact section (components): 8px
- Card padding: 12-16px
- Section separation: 24px
- Page-level spacing: 32-40px

### Border radius

- Small surfaces (buttons, inputs, badges): 3px
- Cards and panels: 4px
- Large rounded surfaces: 6px
- Badges/lozenges: 2px (very subtle)

### Motion

- Hover/focus transitions: 100ms
- Panel expansions: 150ms
- Modal/drawer: 250ms
- **Curve**: `ease-out` (not a named cubic-bezier; use `ease-out` primitive)

## Signature components

### Lozenge (badge/status pill)

ADG's most distinctive small component. Anatomy:

```
- 20-24px tall
- 4-8px horizontal padding (tighter than Linear's status pill)
- 2px radius (very subtle rounding)
- 12px monospace weight 400 label
- Dot indicator optional (can be left-aligned or omitted)
- Variants: default (gray), success, warning, danger, discovery, information
```

The lozenge is slightly more playful than a pure rectangular badge — it rounds just enough to feel approachable.

### Inline message (banner + SectionMessage)

```
- Full-width container, 12px L-padding
- Icon (left-aligned, 16×16 or 24×24)
- Content block (headline + optional body text)
- Optional dismiss button (right, faint)
- Variants by severity: info (blue), warning (orange), danger (red), success (green), discovery (purple)
- Background uses semantic -subtle tokens; border optional but light
```

### Issue card (Jira-native)

```
- 40-48px tall row in lists or grids
- Key + summary left-aligned (13px body, monospace for key)
- Type icon (e.g., bug, feature, task)
- Status lozenge
- Assignee avatar (24×24, initials if no image)
- Priority indicator (dot or label)
- Optional secondary metadata (e.g., due date, estimate)
```

### SectionMessage

Lighter-weight inline alert (used in Confluence and admin screens):

```
- 36px tall minimum
- Icon + headline + body (optional)
- No dismiss button
- Thin left-edge accent color (4-8px)
- Pairs: info, warning, danger, success, confirmation
```

### Empty state with mascot illustration

Atlassian frequently pairs empty states with branded illustrations (e.g., Jira's "no issues" cat). Anatomy:

```
- Centered vertical stack
- Illustration (80-120px max dimension, aligned-center)
- Headline (20px, weight 600)
- Supporting text (14px, muted)
- Primary action button (optional)
```

## Anti-patterns in Atlassian's world

- ❌ Unlabeled icons without tooltips in dense UIs (Jira icons need context)
- ❌ Overuse of lozenges (they're badges, not pill-buttons — use buttons for actions)
- ❌ Mixed visual hierarchy in inline lists (keep metadata consistent: key, status, assignee, priority — in that order)
- ❌ SectionMessage without an icon (the icon carries semantic meaning)
- ❌ Disabled state styled as a lighter version of the enabled state (use the `disabled` token explicitly)
- ❌ Attempt to match Atlassian's mascot illustration style without brand asset access (use solid, simple illustrations instead)

## When to anchor here

✅ Issue tracker or project-planning surface (esp. if team-centric, not individual-task centric)
✅ Confluence-like wiki or knowledge-base UI
✅ Any admin console for multi-user environments (permissions, team management, billing)
✅ Jira-native integrations or embedded issue pickers
✅ Enterprise dashboards where transparency and shared context matter

❌ Minimal, one-person note-taking (use Notion or Reflect instead)
❌ Animated, delightful consumer experiences (ADG is professional-first)
❌ Design systems where custom mascots or illustrations are out of brand

## Sources

- https://atlassian.design/foundations
- https://atlassian.design/tokens
- https://atlassian.design/components
- https://atlassian.design/foundations/typography
