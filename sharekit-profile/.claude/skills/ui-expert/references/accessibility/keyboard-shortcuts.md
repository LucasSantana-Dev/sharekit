# Keyboard Shortcuts — Standard Map

## The contract

Every interactive surface in an app must be fully operable without a mouse. Keyboard shortcuts should match platform conventions (Cmd on macOS, Ctrl on Windows/Linux) to remain discoverable. Shortcuts that override browser defaults (Cmd+T, Cmd+W, Ctrl+S) are forbidden — they create user frustration and accessibility failures.

## Global navigation

These shortcuts are expected on every modern desktop app and web product:

| Shortcut | Platform | Function | Notes |
|---|---|---|---|
| `Cmd+K` / `Ctrl+K` | macOS / Win+Linux | Command palette, search | Primary app navigation |
| `Cmd+/` / `Ctrl+/` | macOS / Win+Linux | Help or keyboard shortcut overlay | Opens cheat-sheet modal |
| `Esc` | All | Dismiss modal, popover, menu | Focus returns to trigger |
| `Tab` | All | Move focus forward | Respects focus order |
| `Shift+Tab` | All | Move focus backward | Cycles in reverse |
| `Enter` / `Return` | All | Activate focused element | Button, link, accept choice |
| `Space` | All | Activate button, toggle checkbox/radio | Not valid in textarea |
| `Arrow Up/Down` | All | Navigate within modal, list, menu | Component-specific behavior |
| `Arrow Left/Right` | All | Cycle tabs, expand/collapse tree | Rarely used for linear lists |
| `Home` / `End` | All | Jump to first / last item | In lists, menus, tables |

## Per-component conventions

### Dialog / Modal

- **Esc**: closes dialog; returns focus to trigger button
- **Focus trap**: Tab cycles within dialog, does not escape to background
- **Tab order**: Start at the primary action (OK, Save, etc.), then secondary, then close button
- **Focus visible**: 2px+ ring on all focusable elements
- Required ARIA: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="<heading>"`

### Menu (dropdown, context, top-level)

- **Arrow Up/Down**: move selection without activating
- **Enter**: activate selected item
- **Esc**: close menu, focus returns to trigger
- **Home/End**: jump to first/last item
- **Type-ahead (optional)**: type a letter to jump to next item starting with that letter
- Required ARIA: `role="menu"`, `aria-expanded` on trigger

### Combobox (searchable select)

- **Arrow Up/Down**: move through options; does not open list automatically
- **Enter**: select focused option, close dropdown
- **Esc**: close dropdown without selection
- **Type**: filter options in real time
- **Backspace**: clear input (combobox with tags only)
- Required ARIA: `aria-owns`, `aria-expanded`, `aria-controls`

### Tabs

APG recommends **Manual activation**: Arrow keys move focus but do NOT automatically activate the tab.

- **Arrow Left/Right**: move focus between tabs
- **Enter** (manual mode only): activate the focused tab
- **Automatic activation** (not recommended): Arrow keys move focus AND activate the tab immediately
- **Home/End**: jump to first/last tab
- Required ARIA: `role="tablist"`, each tab `role="tab"` with `aria-selected`, `aria-controls`

### Table

- **Arrow keys**: move between cells (up/down rows, left/right columns)
- **Tab**: move between rows (not cells within a row, unless editing)
- **Enter**: edit focused cell or activate row action
- **Space**: select row (checkbox column)
- **Ctrl+A**: select all rows (when checkbox column present)
- Required ARIA: `role="table"`, `<thead>`, `<tbody>`, header labels in `<th>`

### Tree View

- **Arrow Down**: move to next visible node
- **Arrow Up**: move to previous visible node
- **Arrow Right**: expand node (if collapsed); move to first child (if expanded)
- **Arrow Left**: collapse node (if expanded); move to parent (if collapsed)
- **Home/End**: jump to first/last visible node
- **Enter**: activate (e.g., navigate to, open file)
- Required ARIA: `role="tree"`, `role="treeitem"`, `aria-expanded`, `aria-level`

### Dropdown (legacy select)

- **Arrow Up/Down**: cycle through options
- **Enter**: select option, close dropdown
- **Esc**: close dropdown without selection
- **Type-ahead**: jump to next option starting with typed letter
- Alternative: use native `<select>` or combobox pattern instead

### List / Listbox

- **Arrow Up/Down**: move selection
- **Enter**: activate selected item
- **Ctrl+A**: select all (multi-select only)
- **Space**: toggle selection (multi-select only)
- **Type-ahead**: jump to first match (optional, single-letter only)
- Required ARIA: `role="listbox"`, `role="option"`, `aria-selected`

## Platform contrasts

macOS and Windows/Linux have different modifier key conventions. Web apps must detect the platform and map shortcuts accordingly.

| Intent | macOS | Windows/Linux | Detection |
|---|---|---|---|
| **Command palette** | Cmd+K | Ctrl+K | `navigator.platform` or UA |
| **Find in page** | Cmd+F | Ctrl+F | Browser default (do not override) |
| **Preferences** | Cmd+, | Ctrl+, | Platform-aware app settings |
| **Save** | Cmd+S | Ctrl+S | Browser default (do not override) |
| **Close window** | Cmd+W | Ctrl+W | Browser default (do not override) |
| **Undo/Redo** | Cmd+Z / Cmd+Shift+Z | Ctrl+Z / Ctrl+Y | Rich editors only, not browser |

**Detection code (vanilla JavaScript)**:

```javascript
const isMacOS = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
const modKey = isMacOS ? 'Cmd' : 'Ctrl';
```

**Never test for `navigator.userAgent` alone** — the Platform API is more reliable.

## Linear's shortcut map

Linear (linear.app) uses **single-key shortcuts when focus is on a list**. These are discoverable via Cmd+? overlay:

| Shortcut | Function | Context |
|---|---|---|
| `j` | Next issue | Focus on issue list |
| `k` | Previous issue | Focus on issue list |
| `c` | Create new issue | Global |
| `o` | Open issue detail | From list (selected row) |
| `e` | Edit assignee | From issue detail |
| `s` | Cycle status | From issue detail |
| `m` | Toggle notification | From issue detail or list |
| `p` | Set priority | From issue detail |
| `l` | Add label | From issue detail |

**Pattern**: single letters for rapid triage when power users are in a "flow state" on a data-dense list. Never enable these globally — they break text input. Always show the overlay at app launch and behind Cmd+?.

## Material Design 3 + Apple HIG positions

### Material Design 3

Material 3 focuses on **Intent over keys**. Keyboard nav follows WCAG 2.2 2.1.1 (Keyboard) and 2.1.2 (No Keyboard Trap):

- Command palette is *not* mandated (but recommended for dense surfaces)
- Focus ring: 3px outline at `primary` or `on-surface` color
- Arrow keys for navigation within components (Menu, Tabs, Table)
- Tab only moves between discrete component groups, not within them
- Motion respects `prefers-reduced-motion`

### Apple HIG

Apple HIG is the **accessibility floor**:

- Focus visible: 2px minimum ring, high contrast
- Tab key: moves focus through the document in logical order
- Escape: dismisses popovers and modals
- Space: activates buttons and toggles
- Arrow keys: navigate within component scope only
- No custom key bindings for system functions (Cmd+Q, etc.)

Both systems converge on: **Tab between component groups, arrow keys within groups, Esc to escape modal state.**

## Sources

- W3C WCAG 2.2 (Keyboard & Keyboard Trap): https://www.w3.org/TR/WCAG22/
- WAI-ARIA Authoring Practices Guide (APG), keyboard sections per pattern: https://www.w3.org/WAI/ARIA/apg/patterns/
- Apple Human Interface Guidelines (Keyboards): https://developer.apple.com/design/human-interface-guidelines/keyboards
- Material Design 3 (Interaction → Inputs → Keyboard): https://m3.material.io/foundations/interaction/inputs/keyboard
- Linear Design Method (Keyboard Shortcuts): https://linear.app/method/keyboard-shortcuts (or public docs)
