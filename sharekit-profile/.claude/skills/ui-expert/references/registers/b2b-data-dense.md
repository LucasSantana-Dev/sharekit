# Register: b2b-data-dense

Analytics, observability, BI, monitoring, log management, data-heavy operational tools. The interface IS the data.

## Audience expectations

- Has multiple monitors and uses all of them
- Will resize columns, rearrange dashboards, pin filters
- Will spot misalignment in tables instantly
- Has scripts that depend on the URL parameters of filtered views
- Cares about query performance more than animation
- Will export to CSV at least once per session

## Primary anchors

- [Carbon](../companies/carbon-ibm.md) — table density, sharp corners
- [Linear](../companies/linear.md) — shell + command palette
- [Stripe Dashboard](../companies/stripe.md) — KPI cards
- Supplement with **AG-Grid patterns** for advanced tables (column pinning, virtual scroll, grouping)

## Mandatory rules

### Tables (the centerpiece)

The single most important component. Must support:

- **Sticky header** always
- **Sticky first column** optional (toggle in column menu)
- **Resize columns** with drag-handle on the right edge of each header
- **Reorder columns** via header drag
- **Pin columns** left or right via column menu
- **Group by** at least one dimension
- **Filter per column** OR a global filter bar
- **Sort multi-column** (shift+click adds a secondary sort)
- **Virtual scrolling** if rows > 1000
- **Column visibility** toggle (hide/show columns)
- **Export to CSV** as a button or shortcut
- **Density toggle**: compact (28px) / regular (36px) / comfortable (48px)

Row hover: subtle bg-tint, no transform. Row click: opens slide-over detail OR navigates, never a modal.

### Numbers
- **`tabular-nums` everywhere**
- Locale-aware formatting (`1,234,567.89` vs `1.234.567,89`)
- Inline unit suffixes: `12.4K events`, `2h 34m`, `99.7%`
- Color-coded only when the color is meaningful (delta vs baseline) — never decorative

### Color
- Dark mode primary, light mode secondary (these users live in dark mode)
- One bright accent for selection/focus/sort
- Status colors for state (success/warning/danger/info)
- Chart colors: pick a defined ramp (e.g. ColorBrewer, Observable Plot defaults). Never random.

### Layout
- Sidebar collapsible (more screen for data)
- Top bar with filters that affect the whole page
- Multi-panel layouts: KPI strip on top, table+chart split below
- Modals are wrong here. Use slide-overs from the right.

### Charts
- One chart type per concept. Don't mix bar + line + pie randomly.
- Axes labeled with units
- Legends positioned to the right or below, not overlapping data
- Tooltips on hover with: x-value + every series value + delta vs baseline if relevant
- No 3D charts. Ever.
- No pie charts with > 5 slices

## Required components

1. **Data table** with full feature set (above)
2. **Time-range picker** with presets (1h, 24h, 7d, 30d, custom)
3. **Filter bar** with multi-facet, persistent in URL, "clear all" button
4. **KPI strip** of 4-6 cards across the top
5. **Chart components** with legend, tooltip, zoom, axis labels
6. **Saved views / dashboards** — users will save their setups
7. **Compare mode** — current period vs previous period overlay
8. **Search across data** with field-aware syntax (`status:error level:warn`)

## Register-specific anti-patterns

- ❌ Rounded corners on data surfaces
- ❌ Animations on number changes (instant, please)
- ❌ Marketing flourishes anywhere
- ❌ Tables without sort
- ❌ Charts without axis labels
- ❌ Hiding pagination controls "for cleanliness" — users need them
- ❌ Persistent banners taking 8% of the screen for "What's new"
- ❌ Modal "delete confirmation" for every row action
- ❌ Light mode as the default for monitoring/observability

## Token starter

```css
/* Dark mode primary */
--bg:           oklch(0.13 0.005 240);
--bg-elevated:  oklch(0.17 0.005 240);     /* tier 1 - cards */
--bg-modal:     oklch(0.21 0.006 240);     /* tier 2 - slide-overs */
--fg:           oklch(0.94 0.005 240);
--fg-muted:     oklch(0.62 0.01 240);
--border:       oklch(0.24 0.008 240);
--accent:       oklch(0.65 0.20 230);       /* electric blue or system */
--success:      oklch(0.65 0.18 145);
--warning:      oklch(0.78 0.15 75);
--danger:       oklch(0.58 0.22 25);
--info:         oklch(0.65 0.18 250);

/* Chart series ramp */
--chart-1:  oklch(0.65 0.18 230);
--chart-2:  oklch(0.68 0.17 145);
--chart-3:  oklch(0.72 0.16 60);
--chart-4:  oklch(0.62 0.20 320);
--chart-5:  oklch(0.66 0.18 30);

--font-display: "IBM Plex Sans", "Geist Sans", system-ui, sans-serif;
--font-body:    "IBM Plex Sans", system-ui, sans-serif;
--font-mono:    "JetBrains Mono", "IBM Plex Mono", monospace;

--radius:        2px;
--radius-2:      4px;
```
