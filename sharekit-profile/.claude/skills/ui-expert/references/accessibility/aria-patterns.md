# WAI-ARIA Authoring Practices Patterns

These are the W3C-recommended interaction patterns for accessible web components. If you build a custom control, match the pattern or use a library like Radix UI or React Aria that already implements it. Each pattern defines the minimum ARIA attributes and keyboard behaviors required for accessibility compliance.

## How to use this

When building a component, find its pattern below and implement the required ARIA roles, properties, and states. Then verify keyboard navigation matches the spec. Do not invent ARIA attributes — the W3C APG lists exactly which ones a pattern needs. For production work, prefer a component library that has already implemented these (Radix, React Aria, Headless UI, etc.) rather than building from scratch.

## The 30 patterns

### 1. Accordion

**Required ARIA**:
- `role="button"` on header (if not native `<button>`)
- `aria-expanded="true" | false` on trigger
- `aria-controls="<id>"` pointing to panel

**Required keyboard**:
- Tab — move focus to next trigger
- Enter/Space — toggle expanded state
- Arrow Down/Up — move focus between triggers (optional; not required)

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/

---

### 2. Alert

**Required ARIA**:
- `role="alert"` on container
- `aria-live="assertive"` (implicit with role)
- `aria-label` or text content describing the message

**Required keyboard**:
- Tab — focus alert if it contains focusable elements; screen reader announces immediately

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/alert/

---

### 3. Alert Dialog

**Required ARIA**:
- `role="alertdialog"` (or `role="dialog"` + `aria-label`)
- `aria-modal="true"`
- `aria-labelledby="<heading-id>"` pointing to heading

**Required keyboard**:
- Tab — cycle focus within dialog; last element → first element
- Esc — dismiss (optional; not required if there's a close button)
- Enter/Space — activate primary action

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/

---

### 4. Breadcrumb

**Required ARIA**:
- `role="navigation"` on container
- `aria-label="Breadcrumb"` or similar
- Current page (last item) has `aria-current="page"`
- Links are native `<a>` tags or `role="link"` + `tabindex="0"`

**Required keyboard**:
- Tab — move focus to next link
- Enter — navigate

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/

---

### 5. Button

**Required ARIA**:
- Native `<button>` element (preferred) or `role="button"` + `tabindex="0"`
- `aria-pressed="true" | false"` if toggle button
- `aria-label` if button contains only icon

**Required keyboard**:
- Tab — focus button
- Enter/Space — activate

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/button/

---

### 6. Carousel

**Required ARIA**:
- `role="region"` on container
- `aria-label="Carousel"` or `aria-labelledby`
- `aria-live="polite"` if auto-rotating (announce slide changes)
- Previous/Next buttons have clear labels

**Required keyboard**:
- Tab — focus buttons; arrow keys move slides (or button press)
- Enter/Space — activate button

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/carousel/

---

### 7. Checkbox

**Required ARIA**:
- Native `<input type="checkbox">` (preferred) or `role="checkbox"` + `tabindex="0"`
- `aria-checked="true" | false | mixed"` if custom
- `aria-label` if not associated with visible `<label>`

**Required keyboard**:
- Tab — focus checkbox
- Space — toggle checked state

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/

---

### 8. Combobox

**Required ARIA**:
- `role="combobox"` on input
- `aria-expanded="true | false"` reflecting listbox visibility
- `aria-controls="<listbox-id>"` pointing to listbox
- `role="listbox"` on options container
- `role="option"` on each option

**Required keyboard**:
- Tab — move to next element; close listbox
- Arrow Down — open listbox or move to next option
- Arrow Up — move to previous option
- Enter — select option
- Esc — close listbox

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/

---

### 9. Dialog (Modal)

**Required ARIA**:
- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby="<heading-id>"` pointing to title
- Focus trap: Tab from last focusable → first focusable

**Required keyboard**:
- Tab — cycle focus within dialog
- Esc — close (optional; close button recommended)
- Enter — confirm/submit

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/dialogmodal/

---

### 10. Disclosure

**Required ARIA**:
- `role="button"` on trigger (if not native button)
- `aria-expanded="true | false"`
- `aria-controls="<panel-id>"` pointing to hidden content

**Required keyboard**:
- Tab — focus trigger
- Enter/Space — toggle expanded state

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/

---

### 11. Feed

**Required ARIA**:
- `role="feed"` on container
- `role="article"` on each item
- `aria-label` on feed
- `aria-posinset` and `aria-setsize` on items (for pagination/infinite scroll)

**Required keyboard**:
- Arrow Down — move to next article
- Arrow Up — move to previous article
- Page Down/Up — scroll within feed
- Tab — focus interactive elements within article

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/feed/

---

### 12. Grid

**Required ARIA**:
- `role="grid"` on container
- `role="row"` on rows
- `role="gridcell"` on cells
- `aria-colcount` and `aria-rowcount` if large (optional)
- `aria-selected="true | false"` for selectable cells

**Required keyboard**:
- Tab — focus first cell or selected cell
- Arrow keys — navigate within grid
- Enter/Space — activate/select cell
- Ctrl+Space — toggle selection (if multi-select)

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/grid/

---

### 13. Link

**Required ARIA**:
- Native `<a href="...">` (preferred) or `role="link"` + `tabindex="0"`
- `aria-label` if text is unclear (e.g., "More" button should be "More about X")
- `aria-current="page"` if pointing to current page

**Required keyboard**:
- Tab — focus link
- Enter — navigate

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/link/

---

### 14. Listbox

**Required ARIA**:
- `role="listbox"` on container
- `aria-label` or `aria-labelledby`
- `role="option"` on each item
- `aria-selected="true | false"` on options

**Required keyboard**:
- Tab — move focus to listbox or selected option
- Arrow Down/Up — move selection
- Enter/Space — select (on selected option)
- Home/End — move to first/last option

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/

---

### 15. Menu

**Required ARIA**:
- `role="menu"` on container
- `role="menuitem"` (or `menuitemcheckbox`, `menuitemradio`) on items
- `aria-label` on menu
- `aria-expanded="true | false"` on trigger button

**Required keyboard**:
- Tab — focus trigger; close menu if open
- Enter/Space — open menu or activate item
- Arrow Down/Up — move focus within menu
- Esc — close menu

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/menu/

---

### 16. Menubar

**Required ARIA**:
- `role="menubar"` on container
- `role="menuitem"` on top-level items
- `role="menu"` on submenus
- `aria-expanded="true | false"` on expandable items

**Required keyboard**:
- Tab — focus first menubar item; exit menubar
- Arrow Right/Left — move between top-level items
- Arrow Down — open submenu
- Arrow Up — close submenu
- Enter/Space — activate item
- Esc — close any open submenu

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/menubar/

---

### 17. Meter

**Required ARIA**:
- `role="meter"` (or native `<meter>`)
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- `aria-label` describing what is measured

**Required keyboard**:
- Not focusable (read-only; display only)

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/meter/

---

### 18. Radio Group

**Required ARIA**:
- `role="radiogroup"` on container
- `aria-label` or `aria-labelledby` on group
- `role="radio"` on each option
- `aria-checked="true | false"` on radios

**Required keyboard**:
- Tab — focus first or selected radio
- Arrow Down/Right — select next radio
- Arrow Up/Left — select previous radio
- Space — activate (on focused radio)

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/radio/

---

### 19. Slider (single thumb)

**Required ARIA**:
- `role="slider"` on input
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- `aria-label` describing slider purpose

**Required keyboard**:
- Tab — focus slider
- Arrow Right/Up — increase value
- Arrow Left/Down — decrease value
- Home/End — move to min/max
- Page Up/Down — larger increments

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/slider-multi-thumb/

---

### 20. Slider (multi-thumb)

**Required ARIA**:
- `role="slider"` on each thumb
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax` per thumb
- `aria-label="Lower bound"` / `"Upper bound"` or similar
- Distinguish thumbs for screen readers

**Required keyboard**:
- Tab — focus each thumb separately
- Arrow Right/Up (lower bound) — increase lower value
- Arrow Right/Up (upper bound) — increase upper value
- Arrow Left/Down — decrease respective value
- Home/End — move thumb to min/max

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/slider-multi-thumb/

---

### 21. Spinbutton

**Required ARIA**:
- `role="spinbutton"` on input (or native `<input type="number">`)
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- `aria-label` describing the field

**Required keyboard**:
- Tab — focus spinbutton
- Arrow Up — increment value
- Arrow Down — decrement value
- Home/End — jump to min/max

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/

---

### 22. Switch

**Required ARIA**:
- `role="switch"` on toggle (or native checkbox with label)
- `aria-checked="true | false"`
- `aria-label` if no visible text

**Required keyboard**:
- Tab — focus switch
- Space — toggle on/off

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/switch/

---

### 23. Tabs

**Required ARIA**:
- `role="tablist"` on container
- `role="tab"` on each tab
- `aria-selected="true | false"` on tabs
- `aria-controls="<panel-id>"` on tabs pointing to panels
- `role="tabpanel"` on panels
- `aria-labelledby="<tab-id>"` on panels pointing back to tab

**Required keyboard**:
- Tab — move focus to active tab or tabpanel
- Arrow Right/Down — select next tab
- Arrow Left/Up — select previous tab
- Home/End — select first/last tab

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/

---

### 24. Table

**Required ARIA**:
- `<table>` element (native semantics preferred)
- `<caption>` for table title
- `<thead>`, `<tbody>`, `<tfoot>` for structure
- `scope="col"` or `scope="row"` on header cells
- `aria-label` or `aria-describedby` if complex header structure

**Required keyboard**:
- Tab — move through interactive elements in cells
- Arrow keys — not required for table itself; data cells are not focusable by default

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/table/

---

### 25. Toolbar

**Required ARIA**:
- `role="toolbar"` on container
- `aria-label` or `aria-labelledby` on toolbar
- `aria-pressed="true | false"` on toggle buttons
- `tabindex="0"` on one focusable item; others have `tabindex="-1"` (roving tabindex pattern)

**Required keyboard**:
- Tab — focus toolbar; exit to next element
- Arrow Right/Down — move to next button
- Arrow Left/Up — move to previous button
- Space/Enter — activate button

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/

---

### 26. Tooltip

**Required ARIA**:
- `role="tooltip"` on tooltip container
- `aria-describedby="<tooltip-id>"` on trigger element
- Tooltip should not receive focus; information is supplementary

**Required keyboard**:
- Tab — no tooltip-specific behavior; native elements show tooltip on hover/focus
- Esc — dismiss (optional; auto-dismiss on blur is standard)

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/

---

### 27. Tree

**Required ARIA**:
- `role="tree"` on container
- `role="treeitem"` on items
- `aria-expanded="true | false"` on expandable items
- `aria-level`, `aria-posinset`, `aria-setsize` (optional; aids large trees)

**Required keyboard**:
- Tab — focus first treeitem; collapse full tree on exit
- Arrow Right — expand collapsed item or move to first child
- Arrow Left — collapse expanded item or move to parent
- Arrow Down/Up — move to next/previous treeitem
- Home/End — move to first/last treeitem at same level
- Enter/Space — activate item

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/tree/

---

### 28. Treegrid

**Required ARIA**:
- `role="treegrid"` on container
- `role="row"` on rows
- `role="gridcell"` on cells
- `aria-expanded="true | false"` on expandable rows
- `aria-level` on rows (depth in tree)

**Required keyboard**:
- Tab — move focus to gridcell or first cell in row
- Arrow Right — expand row or move to next cell; collapse on left
- Arrow Left — collapse row or move to previous cell
- Arrow Down/Up — move to next/previous row
- Enter/Space — activate cell or expand/collapse

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/

---

### 29. Window Splitter

**Required ARIA**:
- `role="separator"` on splitter/divider
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax` reflecting pane sizes
- `aria-label="Resize <pane-a> | <pane-b>"` or similar

**Required keyboard**:
- Tab — focus splitter
- Arrow Right/Down — move splitter to increase right/bottom pane
- Arrow Left/Up — move splitter to increase left/top pane
- Home/End — move splitter to minimum/maximum position

**APG link**: https://www.w3.org/WAI/ARIA/apg/patterns/window-splitter/

---

### 30. Landmark Roles

Landmark roles structure page layout. Use one per landmark type per page.

**Banner** (`role="banner"` or `<header>` at top level)
- Site-wide header, logo, site search. Use once per page at very top.

**Main** (`role="main"` or `<main>`)
- Primary page content. Use once per page; skip repetitive content (nav, ads).

**Complementary** (`role="complementary"` or `<aside>`)
- Content related to main but not primary (sidebar, related links, ads).

**Contentinfo** (`role="contentinfo"` or `<footer>` at top level)
- Copyright, privacy, contact info. Use once per page at very bottom.

**Navigation** (`role="navigation"` or `<nav>`)
- Major navigation collection (main nav, breadcrumbs, pagination). Label with `aria-label` if multiple (`aria-label="Main navigation"`, `aria-label="Breadcrumb"`).

**Search** (`role="search"`)
- Site search form. Use when search is main landmark feature; otherwise treat as region.

**Form** (semantic `<form>` or `role="region"` + `aria-label="<form-name>"`)
- Named form regions for landmark identification. Prefer `aria-label` + semantic form element.

**Region** (`role="region"` + `aria-label`)
- Generic content sections needing a name. Always pair with `aria-label`; otherwise use semantic element (e.g., `<section>`).

**APG link**: https://www.w3.org/WAI/ARIA/apg/landmarks/

---

## Reference libraries

**Radix UI Primitives** (headless, ARIA built-in)
- https://www.radix-ui.com/primitives/docs/components/
- Button, Dialog, Dropdown Menu, Tabs, Slider, Combobox, and 20+ more components with full APG compliance.

**React Aria** (hooks for accessible components)
- https://react-spectrum.adobe.com/react-aria/components.html
- Provides hooks for Button, Link, Dialog, Listbox, Select, Tabs, Table, Calendar, and APG-compliant patterns.

**Headless UI** (Vue/React)
- https://headlessui.com/
- Menu, Tabs, Dialog, Listbox, Popover, Disclosure, and others with keyboard and ARIA baked in.

---

## Sources

- W3C WAI-ARIA Authoring Practices Guide: https://www.w3.org/WAI/ARIA/apg/patterns/
- WAI-ARIA 1.2 Specification: https://www.w3.org/TR/wai-aria-1.2/
- Radix UI Primitives: https://www.radix-ui.com/
- React Aria: https://react-spectrum.adobe.com/react-aria/
