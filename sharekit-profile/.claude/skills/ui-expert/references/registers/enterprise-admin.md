# Register: enterprise-admin

Internal tools, admin panels, IT-adjacent surfaces, control planes. The user has a job to finish and the tool is in their way until it isn't.

## Audience expectations

- Uses the tool daily for hours
- Will not be charmed by personality
- Cares about: discoverability, speed, bulk operations, keyboard support, exports
- Will demand information density
- Will not see your animations because they've turned off motion
- Has accessibility needs (large user base, edge cases, compliance)

## Primary anchors

- [Carbon (IBM)](../companies/carbon-ibm.md) — the dense-enterprise master
- [Linear](../companies/linear.md) — for the shell and command palette
- [Apple HIG](../companies/apple-hig.md) — for accessibility floor

## Mandatory rules

### Density
- 32-40px row heights in tables (Carbon's "short" and "default")
- 28-32px in lists with frequent interaction
- Forms: 40-48px input height
- Section gap: 16-24px (not the 96px of marketing)

### Color
- Cool, neutral, professional. Carbon palette is the default.
- Sharp semantic colors for status (success/warning/danger/info)
- No decorative colors anywhere

### Typography
- **IBM Plex Sans** or another technical-but-readable sans
- IBM Plex Mono for IDs, codes, references
- 14px body, 12px label, 16-20px headings — keep it tight
- Tabular-nums on every number

### Layout
- Sidebar + content area (Carbon or Linear-style). Multi-level nav with collapsible groups.
- Sticky headers in tables
- Optional sticky first column for wide tables
- Full-screen by default. Use the screen.

### Density signals
- Show counts everywhere ("Showing 1–50 of 12,847")
- Show "last updated" timestamps on data
- Show user/owner attribution where relevant
- Show "last saved" / "auto-saved" state on forms

### Interactions
- Bulk selection with checkboxes
- Bulk action bar that appears when ≥1 selected
- Keyboard navigation: arrow keys move row, Space toggles, Return opens
- Right-click context menu acceptable (rare in modern web; standard in enterprise)
- Filters: persistent in the URL so users can share/bookmark filtered views

## Required components

1. **Data table** with sort, filter, paginate, export, bulk-select, sticky header
2. **Multi-step form** with side-stepper or top-progress
3. **Detail page** with action bar (Edit / Duplicate / Delete) and "last modified" meta
4. **Search/filter bar** with multi-facet support
5. **Audit log / activity feed** somewhere accessible
6. **Empty state with role-aware action** (admins see "Create"; viewers see "Ask your admin to create")

## Register-specific anti-patterns

- ❌ Rounded corners > 4px on data surfaces (looks consumer)
- ❌ Marketing-flavored microcopy ("Looking good!", "You're crushing it!")
- ❌ Animations that delay interaction
- ❌ Hover-required actions (must be keyboard-accessible)
- ❌ Decorative shadows
- ❌ Sparse layouts (admin users will be furious about wasted screen space)
- ❌ Carousels, swiper components
- ❌ Gradients anywhere
- ❌ Single-row tables with one row per page

## Token starter

```css
/* Light mode (Carbon defaults) */
--bg:           #f4f4f4;          /* gray-10 */
--bg-elevated:  #ffffff;
--fg:           #161616;          /* gray-100 */
--fg-muted:     #525252;          /* gray-70 */
--border:       #e0e0e0;          /* gray-20 */
--accent:       #0f62fe;          /* blue-60 */
--success:      #24a148;
--warning:      #f1c21b;
--danger:       #da1e28;

/* Dark mode */
--bg-dark:           #161616;
--bg-elevated-dark:  #262626;     /* tier 1 */
--bg-modal-dark:     #393939;     /* tier 2 */
--fg-dark:           #f4f4f4;

--font-display: "IBM Plex Sans", system-ui, sans-serif;
--font-body:    "IBM Plex Sans", system-ui, sans-serif;
--font-mono:    "IBM Plex Mono", "Consolas", monospace;

--radius:        0;               /* Carbon is sharp by default */
--radius-1:      2px;             /* the rare exception */
```
