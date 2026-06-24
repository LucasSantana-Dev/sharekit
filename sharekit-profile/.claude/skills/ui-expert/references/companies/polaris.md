# Polaris (Shopify) — polaris.shopify.com

The reference for **B2B admin surfaces** and merchant-empowering tools. If the interface helps a business operator manage operations, inventory, orders, or staff, Polaris is the anchor.

## Aesthetic identity

Admin-density without claustrophobia. Polaris is built for a Shopify merchant on their MacBook, running multiple browser tabs, triaging 50+ orders a day, switching between dashboard and email. Every pixel serves task completion. The visual language says "we respect your time" without feeling industrial.

**One-sentence physical scene**: "Merchant at a standing desk, 14-inch MacBook, reviewing inventory and fulfilling orders in parallel, needs to scan 8–10 data points per row and decide in seconds."

## Concrete tokens (observed from polaris.shopify.com published spec)

### Color

**Semantic structure** (Polaris tokens use a layered semantic system):

```
Interactive (actions, focus states):
  --color-interactive:        #0066ff    /* Primary CTA blue */
  --color-interactive-hover:  #005ac3
  --color-interactive-active: #003d99
  --color-interactive-disabled: #b8c8e8

Success:
  --color-success:            #008060    /* Shopify green */
  --color-success-text:       #0d6a4f

Critical/Error:
  --color-critical:           #ae3723    /* Merchant-sensitive red */
  --color-critical-hover:     #8b2c1e

Warning:
  --color-warning:            #c3a500    /* Amber for caution */
  --color-warning-text:       #7a6700

Info:
  --color-info:               #0066ff    /* Links + info states */

Backgrounds (admin density — tight spacing):
  --bg-primary:               #ffffff
  --bg-secondary:             #f3f3f3    /* Subtle row alternation */
  --bg-tertiary:              #e6e6e6    /* Cards, hover states */

Text:
  --text-primary:             #202020    /* Almost-black */
  --text-secondary:           #565656    /* Secondary info */
  --text-muted:               #8a8a8a    /* Disabled, metadata */
  --text-on-dark:             #ffffff

Borders:
  --border-primary:           #d0d0d0
  --border-secondary:         #eeeeee    /* Light dividers */
```

**Shopify's signature green** (#008060) appears on success states and brand moments. Interactive accent is a professional blue (#0066ff).

### Typography

- **Family**: Inter (clean, neutral, merchant-readable)
- **Mono**: SF Mono or Menlo for order IDs, SKUs, pricing
- **Type scale**:
  - Heading XS: 12px / weight 600 / leading 1.4
  - Heading SM: 14px / weight 600 / leading 1.4
  - Heading MD: 16px / weight 600 / leading 1.5
  - Heading LG: 20px / weight 600 / leading 1.5
  - Heading XL: 24px / weight 600 / leading 1.4
  - Heading 2XL: 28px / weight 600 / leading 1.3
  - Body SM: 12px / weight 400 / leading 1.5
  - Body MD: 14px / weight 400 / leading 1.5
  - Button: 14px / weight 500 / text-transform: capitalize
- **Weight hierarchy**: 600 (headings/labels) vs 400 (body). Polaris avoids 700 for density.

### Spacing (4px base scale)

```
Tokens: 4, 8, 12, 16, 20, 24, 32, 48, 64, 100+
Common groupings:
  Gutter (horizontal container):     16px / 20px
  Row/item internal:                 8px–12px
  Gap between items in a list:       4px–8px
  Card/section padding:              16px–24px
  Modal/large container:             24px–32px
```

ResourceList (Polaris's signature component) uses 12px item height + 4px gaps for density.

### Radius

```
Buttons, inputs, small surfaces:     4px
Cards, modals, dropdowns:            6px
Pills, avatars:                      999px (full pill)
```

Polaris avoids rounded corners on data rows — sharp 4px only on interactive surfaces.

### Motion

- **Duration**: 120ms (state changes), 200ms (panel transitions)
- **Curve**: cubic-bezier(0.4, 0, 0.2, 1) — standard ease-out
- **No spring, no bounce** — predictable, task-focused

## Signature components

### ResourceList

Polaris's flagship data table pattern. Optimized for scanning 30–100+ rows:

```
- Row height: 40–48px (admin density)
- Inline metadata: status badge + price + date + action button stacked horizontally
- Selection: checkbox left-aligned, bulk actions appear above table
- Hover: subtle bg-tertiary lift, right-side action menu reveals
- No column headers unless data is > 10 rows
- Pagination: footer shows X–Y of Z items, "Load more" preferred over page numbers
```

### Top bar with merchant chrome

The navigation container. Includes: logo, current shop selector (badge dropdown), search, plus user avatar + settings menu. **Not a standard navbar** — it's merchant-specific, task-aware.

```
Height: 56px
Left: logo + shop selector
Center: search bar (command-palette style, open Cmd+K)
Right: notifications bell, avatar, help menu
Background: white, 1px border-bottom
```

### ActionList (structured action menus)

Polaris organizes actions into semantic groups:

```
Section 1: Primary actions (Edit, View)
Section 2: Secondary (Duplicate, Archive)
Section 3: Destructive (Delete) — appears last, red text
Dividers: 1px border-secondary between sections
Item height: 36px, 12px padding
```

Never a flat list — always grouped by consequence.

### Banner (announcement pattern)

Persistent alert container for conversational error/success messages:

```
Height: 56px
Padding: 12px 16px
Icon left: 24px × 24px
Text: Body MD, 400 weight, merchant-friendly language
Action button (optional): right-aligned, ghost style
Background: color-tinted (success = #f0fdf4, critical = #fdf3f2)
No close button unless auto-dismisses (4–6 seconds)
```

Polaris's error messages avoid jargon: "We couldn't save that variant. Try again in a moment." Not "HTTP 409 Conflict".

### IndexTable (tabular data with inline editing)

Sortable, filter-friendly table. Rows are selectable; cells are read-only until activated.

```
Column header: 40px height, 12px padding, weight 600
Data row: 48px, 12px vertical padding, 8px horizontal
Cell content: truncate at 200px, tooltip on hover
Empty state: full-width, centered, illustrative icon + message
Pagination: bottom-right "Showing 1–25 of 347"
```

## Anti-patterns in Polaris's world

- ❌ Heavy drop shadows (Polaris uses 1px subtle borders instead)
- ❌ Floating action buttons (FABs) — Polaris uses action menus in the header or inline
- ❌ Dark mode as primary (Polaris is light-first; dark mode is optional)
- ❌ Jargon in error messages ("Validation failed" instead of "We couldn't save this. Check the quantity.")
- ❌ Modals for non-destructive actions (use slide-overs or inline forms)
- ❌ Unstructured action menus (actions must be grouped by consequence: primary, secondary, destructive)
- ❌ Decorative illustrations (Polaris uses functional, sparse iconography)
- ❌ Dense form labels without helper text (every form field has a description or context)

## When to anchor here

✅ Admin dashboard, merchant-facing SaaS
✅ Inventory, order, fulfillment, or staff management interfaces
✅ B2B internal tools for operations teams
✅ Any surface where a merchant/operator needs to process 50+ items per session

❌ Consumer-facing products or marketing sites
❌ Interfaces where visual delight is the primary goal
❌ Tools where conversational UX is more important than density

## Sources

- https://polaris.shopify.com/foundations/foundations
- https://polaris.shopify.com/design/typography
- https://polaris.shopify.com/design/colors
- https://polaris.shopify.com/components
- https://shopify.dev/docs/api/admin-rest — Polaris token semantics in Admin API context
