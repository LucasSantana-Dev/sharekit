# Airtable (airtable.com)

**Aesthetic identity**: Airtable proved that non-technical teams would adopt relational databases if the interface looked like a spreadsheet they already knew. The aesthetic is "structured but approachable" — grid, form, kanban, calendar, gallery, all in one app. Physical scene: a shared notebook that grows into a business system without anyone noticing the moment it happened.

## What this brand teaches

Airtable's core contribution is the **multi-view paradigm for data**: the same underlying records can be rendered as a grid (spreadsheet-style), calendar (events on dates), kanban (drag cards across columns), gallery (image-rich cards), or form (single-record edit). Users switch views without losing filters, sorts, or state. The **expand-record pattern** (click a row, side-panel slides in with all fields) eliminates modals for detail. The **formula bar** (spreadsheet-style `= SUM()` input above the grid) invites non-technical users to build without coding. The **field type diversity** (single/multi-select, checkbox, linked records, attachments) and **per-field chip rendering** show how to make structured data feel friendly.

## Signature patterns

1. **View switcher tabs** — Grid / Calendar / Kanban / Gallery / Form tabs at the top of a base, persisting view settings and filters per tab without page load.
2. **Expand-record overlay** — Click any row or cell → a right-side slide-over (not modal) opens with the record's full detail form; closing refocuses the parent grid.
3. **Formula bar** — Spreadsheet-style formula input above the grid (e.g. `= CONCAT({First Name}, " ", {Last Name})`); appears only if the column is a formula field.
4. **Multi-select chips** — Select fields render as rounded-corner pills with inline editing; removing a tag with backspace is instant, no confirm.
5. **Filter/Group/Sort persistent toolbar** — Collapsible bar below the tab switcher; filters are stackable, groups nest, sorts chain (shift+click for secondary); state persists in URL.

## Approximate visual tokens

```css
/* Airtable brand direction */
--font-primary:    "Inter", system-ui, sans-serif;           // approximate
--font-mono:       "Monaco", monospace;                       // approximate

/* Grid density — tight rows encourage scanning */
--grid-row-height: 28px;        // compact default; expandable to 36px/48px
--cell-padding:    4px 8px;

/* Soft-pastel field backgrounds — not harsh or clinical */
--field-bg-select:      #f0f8ff;        // very light blue for multi-select
--field-bg-linked:      #f5f0ff;        // very light purple for linked records
--field-bg-attachment: #fffaf0;        // very light orange for attachment fields
--field-bg-formula:     #f0fff0;        // very light green for formula fields (read-only)

/* Chip rendering — rounded, soft borders */
--chip-radius:         16px;            // half-height; typically 24px tall
--chip-bg:             oklch(0.85 0.08 270);      // muted purple-ish
--chip-border:         1px solid oklch(0.70 0.10 270);
--chip-gap:            4px;

/* Per-base brand color customization — Airtable's signature */
--base-accent-hsl:     "hsl(270, 100%, 50%)";     // purple default; user-swappable
--brand-rainbow:       ["#6e40aa", "#1f77e0", "#52b788", "#fdb81e", "#ff6b6b"];

/* Soft tinting for view backgrounds */
--grid-bg:             oklch(0.99 0.002 240);
--kanban-bg:           oklch(0.98 0.003 240);
--calendar-bg:         oklch(0.99 0.001 240);
```

## When to study this brand

- **Multi-view data apps**: Products where users need grid AND calendar AND kanban AND gallery views of the same data (CRM, project management, event scheduling).
- **Spreadsheet-migration UX**: Moving power users from Excel/Sheets to a relational database while preserving formula-like mental model.
- **Non-technical user empowerment**: B2B SaaS for small teams (solopreneurs, small agencies, community groups) who need structure but don't have IT.
- **Field-level UX diversity**: Apps with many data types (text, number, select, linked, attachments) and want accessible inline editors.

DO NOT anchor here if:
- Your product only has ONE legitimate view type (a calendar app doesn't need grid + kanban unless it genuinely serves both use cases).
- Your data model is NOT relational or row-based (graphs, networks, unstructured content).
- Your users are technical and expect SQL/query-builder; Airtable's approachability becomes perceived oversimplification.
- Pastel chip aesthetics signal low trust in fintech (use darker, sharper tokens).

## Anti-patterns NOT to copy

- ❌ **Multi-view without clear semantics**: Do not offer Grid / Calendar / Kanban if only one view legitimately serves the data. Airtable works because each view is optimal for its use case; forcing a view switcher on a single-view product adds complexity without value.
- ❌ **Formula bar for non-formula-shaped data**: Airtable's formula bar works because the data model is column-based and composable. If your records are trees, graphs, or documents, a spreadsheet formula syntax is confusing.
- ❌ **Pastel colors in financial or trust-critical contexts**: Airtable's soft pastel chip backgrounds and rainbow base customization work for collaborative note-taking but undermine trust in banking, healthcare, or compliance tools. Use darker, sharper tokens there.

## Sources

- https://airtable.com/
- https://airtable.com/templates
- Airtable API docs: https://airtable.com/developers
- Community templates and case studies: https://airtable.com/universe
