# Component anatomy checklist

Every interactive component the skill builds must specify these states. Loading / Empty / Error are the three most-skipped — flag them explicitly.

---

## Button

| State | Required design |
|---|---|
| Default | Solid bg (primary) or border-only (secondary) or text-only (tertiary). 32-40px tall. 12-16px horizontal padding. |
| Hover | Specific change — darker bg (primary), bg-tint (secondary), opacity bump (tertiary). NOT just scale. |
| Focus | 2px accent ring, 2px offset from button. Visible against any bg. |
| Active / pressed | Translate-y(1px) OR slightly darker bg. Distinct from hover. |
| Loading | Spinner inside button (replaces label or sits left of it). Disable pointer events. Button width fixed (don't reflow). |
| Disabled | Reduced contrast (text + bg). NOT just opacity-50. No pointer cursor. No hover. |
| With icon | Icon 16px (in 32-36px button) or 18px (in 40px+ button). 6-8px gap to label. |
| Icon-only | Square button. 32-40px each side. Visible label via tooltip or aria-label. |

**Common mistakes**: `opacity-50` for disabled (reads as glitched); scaling on hover (looks consumer); no focus ring (a11y violation).

---

## Text input

| State | Required design |
|---|---|
| Default | 1px border, 4-6px radius, 38-44px tall, 12px horizontal padding. Body-size font. |
| Hover | Border slightly darker, NOT a fill change. |
| Focus | 2px accent ring (offset 0 or 2px). Border becomes accent OR stays neutral. Cursor visible. |
| Filled | Same as default; value visible in body color. |
| Disabled | Bg tinted neutral, fg-muted, no pointer. Show why it's disabled (helper text or icon). |
| Read-only | Different from disabled: copyable, selectable, just not editable. Bg-elevated, fg normal. |
| Loading (async validation) | Subtle spinner inside the right of the field. Don't block input. |
| Error | Red border + red helper text below + small icon in or below the field. |
| With label | Label above input, 13px muted weight 500, 4px gap. NOT a placeholder. |
| With prefix/suffix | Icon or unit (e.g. `$`) inside the field, distinguished by border-right or muted color. |
| With helper text | Below input, 12px muted, 4-6px gap. |

**Common mistakes**: label-as-placeholder (disappears when typing, a11y broken); error message in a tooltip (invisible); border-color-only error (red-blind users miss it).

---

## Card

| State | Required design |
|---|---|
| Default | 1px border OR no border + bg-elevated. 8-12px radius. 16-24px padding. NO default shadow. |
| Hover (if clickable) | Border darkens OR bg shifts slightly OR cursor changes. NOT lift-and-shadow. |
| Active (if clickable) | Slightly darker bg, no transform. |
| Selected | Accent left-border 2px OR accent-tinted bg OR checkmark indicator. |
| Loading | Skeleton with same dimensions and approximate content layout. Shimmer animation. |
| Empty (as a card showing "no data") | Illustration or icon + one sentence + one CTA. |
| Error (in a card) | Inline message with retry. NOT a full-card replacement unless the card is the whole feature. |

**Common mistakes**: `shadow-md` everywhere (immediate stock-template tell); rounded-full corners on data cards (looks consumer-cheap).

---

## Data table

| State | Required design |
|---|---|
| Default | Header row distinct (heavier weight or bg tint). Bottom border between rows only. Rows 32-56px depending on density. |
| Hover row | Subtle bg tint. NO transform. |
| Selected row | Checkbox checked + accent left-border 2px + bg-tint. |
| Sort active | Active column has visible sort arrow in accent color; inactive sortable columns have subtle arrow on header hover. |
| Loading | Skeleton rows with shimmer, same row height as default. Header stays static. |
| Empty | Centered illustration + sentence + action. Spans all columns. |
| Error | Inline banner above the table OR row-level error indicator if individual rows failed. |
| Filtered with 0 results | "No results match your filters. Clear filters." (specific to filter state) |
| Pagination | Visible page indicator + "Showing 1-50 of 1,247" + prev/next. NOT infinite scroll for reference data. |
| Resize column | Drag handle on right edge of header, visible on hover. |
| Pin column | Frozen left edge with subtle shadow indicating overflow. |

**Common mistakes**: full grid lines (Excel-feels); centered text in numeric columns (right-align always); no zebra striping AND no row hover (loses your place); spinners on row load.

---

## Dialog / Modal

Use sparingly. Default to slide-over or inline instead.

| State | Required design |
|---|---|
| Default | Centered, max-width 480-640px for forms, 800-960px for content. 16-24px radius. Backdrop tinted (not pure black). |
| Mount/unmount | 200ms fade + 8-12px translate-y. NOT scale-and-bounce. |
| Focus trap | Tab cycles inside the dialog only. ESC closes. |
| Loading | Skeleton inside the dialog OR disabled buttons during async action. |
| Error | Inline above the actions, not above the title. |
| Stacked dialog (if needed) | Second dialog 8-12px below the first, slight darker backdrop. Usually a sign you should redesign the flow. |

**Common mistakes**: opening a modal to ask "are you sure?" for non-destructive actions; modal that's wider than content; backdrop that's pure `rgba(0,0,0,0.5)` (untinted, harsh).

---

## Toast / inline notification

| State | Required design |
|---|---|
| Default | 1px border (success/warning/danger/info color) or left-border 4px. 8-12px radius. 12-16px padding. Icon + title + optional body + close. |
| Mount | Slide in from top-right or bottom-right, 200-300ms. |
| Auto-dismiss | 5-10s default. Pause on hover. Show a subtle progress bar OR don't show one (debatable). |
| Manual dismiss | Close button always present. |
| Action | Optional inline action button (e.g. "Undo"). |
| Stack | Multiple toasts stack with 8px gap. Oldest at bottom OR top, consistent. |

**Common mistakes**: full-page-blocking notification (use a banner instead); auto-dismiss < 3s (users can't read); no manual close (annoying).

---

## Tabs

| State | Required design |
|---|---|
| Default | Horizontal list, 40-48px tall. Bottom border on inactive, full border on active OR 2-3px bottom-border accent. |
| Inactive | Muted fg, hover = full fg. |
| Active | Full fg, accent indicator (bottom-border or pill bg). |
| Disabled | Muted, no hover, optional explanation tooltip. |
| Overflow (too many tabs) | Horizontal scroll with arrow indicators OR a "More" dropdown. NOT wrapping (wrapping loses the line). |
| Vertical tabs | For settings panels. 36-40px tall items, left-aligned, active = accent left-border or filled bg. |

**Common mistakes**: pill tabs in enterprise/admin contexts (looks consumer); tab labels too long (truncate or rewrite); no keyboard support (arrow keys must navigate).

---

## Dropdown / Select / Combobox

| State | Required design |
|---|---|
| Default | Input-like trigger with chevron-right. Same height as text input. |
| Open | Menu opens below, 4-6px gap. Same width as trigger or wider. 6-8px radius. Border + subtle shadow OR border-only. |
| Hover item | Bg-tinted. |
| Selected item | Accent indicator (checkmark left, accent text, OR accent bg). |
| Searchable (Combobox) | Input inside the menu, list filters as you type. |
| Empty (no results) | "No matches found" sentence. |
| Multiple selection | Selected items shown as pills in the trigger OR a count indicator. |
| Loading async options | Spinner or skeleton inside the menu. |
| Disabled | Reduced contrast, no chevron interaction. |

**Common mistakes**: native `<select>` styled to look custom but losing keyboard support; menu wider than the screen on mobile; no virtual scroll for >100 items.

---

## Avatar

| State | Required design |
|---|---|
| With image | Round (999px radius) or 6-8px rounded square. Object-fit: cover. |
| With initials | Same shape. Letters at 50% of avatar size. Tinted bg per user (hash → palette). |
| Loading | Skeleton circle same dimensions. |
| Online indicator | Small dot (8-10px) bottom-right, with 2px bg-colored ring to separate from avatar. |
| Group / stacked | Up to 3-5 avatars with -8 to -12px overlap. Last is "+N more". |
| With status (away, busy) | Colored dot bottom-right (green, yellow, red, grey). |

**Common mistakes**: no fallback (broken image icon); generic gradient bg for initials (use a defined palette); huge "+N more" pill in stacked avatars.

---

## Form (collection of inputs)

| Element | Required design |
|---|---|
| Section grouping | Visible heading + 8-12px gap to first input. Section gap 32-48px. |
| Field layout | Label above input. Helper text below. Error below helper. Required indicator (*) in label, not red text. |
| Field gap (between fields) | 16-24px vertical. |
| Submit button | Right-aligned at the bottom OR full-width on mobile. Primary action. Secondary "Cancel" on the left. |
| Validation timing | Validate on blur (not on every keystroke). Show success or error inline. |
| Submit loading | Button shows spinner, label changes to "Saving…" or similar. All fields disabled. |
| Submit success | Inline success state OR navigate away. NOT a popup. |
| Submit error | Banner at top of form summarizing errors + per-field inline errors. Scroll to first error. |
| Required vs optional | Mark required with (*); optional fields have "(optional)" inline. Pick one convention. |
| Auto-save | "Saved" timestamp in the bottom-right OR a subtle indicator. NO modal. |

**Common mistakes**: all-required-no-asterisk (users have to guess); validating on keystroke (annoying); error message in a tooltip (invisible); destructive action as the primary button (red as primary is rare and wrong unless the form IS the deletion).

---

## Empty state

| Slot | Required |
|---|---|
| Illustration or icon | One element. Custom illustration > stock; abstract shape > generic vector people. |
| Title | One sentence. Specific to the data type. "No invoices yet." not "Welcome!" |
| Body (optional) | One sentence explaining why this state exists or how to get out of it. |
| Primary action | One button. Specific verb. "Create your first invoice." |
| Secondary action (optional) | "Import from CSV" or "View example" — for users who want a head start. |

**Common mistakes**: just an icon and "No data" (uninformative); illustration takes 80% of the surface (over-decorated); no action button (dead end).

---

## Error state

| Slot | Required |
|---|---|
| Visual | Inline indicator (icon + colored text), not a full-page replacement unless the whole feature is unavailable. |
| Message | Specific. "Failed to load invoices. The server returned 500." > "Something went wrong." |
| Cause hint (if known) | "The connection timed out." or "Your session expired." |
| Action | Retry button. Visible. Same level as the error. |
| Secondary action (if useful) | "Contact support" or "View status page" — for genuine outages. |

**Common mistakes**: "Something went wrong." with no detail (frustrating); error state replaces the entire page (loses user context); no retry (forces refresh).

---

## Loading state (per surface)

| Surface | Loading treatment |
|---|---|
| Page | Skeleton matching the actual layout: header skeleton, content skeleton, sidebar skeleton. |
| Card | Skeleton matching card anatomy: title bar, body lines, optional image area. |
| Table | Skeleton rows, header stays static. Show ~5-10 rows. |
| List | Skeleton rows matching list item height. |
| Single value / KPI | Single skeleton bar at the expected dimensions of the value. |
| Button (submitting) | Spinner replaces or accompanies label. |
| Inline async validation | Tiny spinner inside the input. |
| Streaming text (AI) | Cursor or shimmer at the leading edge. NOT a spinner. |

**Common mistakes**: full-page spinner (signals "didn't think about it"); skeleton at the wrong dimensions (layout jumps when content arrives); shimmer too aggressive (anxiety-inducing — keep it subtle, 1.5-2s loop).

---

## Date picker

**Required states**: default, focus, active, disabled, error, loading

**Required ARIA**:
- `role="dialog"` or `role="application"` on the calendar grid
- `aria-label="Choose a date"` on the trigger input
- `aria-expanded="true"` when calendar is open
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/

**Required keyboard**:
- Tab — focus the input, then the calendar icon/trigger
- Enter — open calendar
- Arrow keys — navigate days within the month grid (left/right), weeks (up/down)
- PageUp/PageDown — previous/next month
- Esc — close calendar, focus returns to trigger

**Common slop**:
- No keyboard month navigation (PageUp/PageDown missing)
- Calendar opened in a modal instead of a popover (too formal)
- Non-locale-aware day ordering (Monday-first in some locales)

---

## Date range picker

**Required states**: default, focus, active, disabled, error, loading, hover-preview

**Required ARIA**:
- `aria-label="Select date range"` on trigger
- `role="dialog"` on the calendar container
- Both start and end date inputs labeled separately
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/

**Required keyboard**:
- Tab — cycle through start-date input, end-date input, calendar
- Arrow keys — navigate in calendar
- PageUp/PageDown — month navigation
- Esc — close calendar

**Common slop**:
- No visual hover preview of the range while dragging
- Start and end inputs not clearly paired (visual separation)
- Allowing end-date earlier than start-date (validation missing)

---

## Time picker

**Required states**: default, focus, active, disabled, error, loading

**Required ARIA**:
- `aria-label="Select time"` on the input or trigger
- `aria-live="polite"` on the value display during picker interaction
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/

**Required keyboard**:
- Arrow up/down — increment/decrement hours or minutes (context-dependent)
- Tab — move between hour and minute fields
- PageUp/PageDown — increment/decrement in 15-min or 1-hour steps
- Esc — close picker

**Common slop**:
- No 12/24-hour toggle affordance (forces one mode)
- Minute increment too granular (every 1 min; 15 min is better)
- No visual AM/PM indicator on 12-hour mode

---

## Drawer / Slide-over

**Required states**: closed, open, loading, error

**Required ARIA**:
- `role="dialog"` or `role="region"` on the drawer container
- `aria-label="Drawer title"` or `aria-labelledby="drawer-title"`
- `aria-modal="true"` if modal (blocks interaction outside)
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/

**Required keyboard**:
- Tab — focus trap inside the drawer (cycles)
- Esc — close the drawer, focus restores to trigger
- No trap if the drawer is a side-panel (non-modal)

**Common slop**:
- Content can scroll behind header (fixed header missing)
- Close button only in top-right (hard to reach on mobile)
- No focus management after close (focus lost)

---

## Slider (single-thumb range)

**Required states**: default, focus, focus-visible, active, disabled, loading

**Required ARIA**:
- `role="slider"` on the track or thumb
- `aria-valuemin`, `aria-valuemax`, `aria-valuenow` on the thumb
- `aria-label="Volume"` or similar on the slider container
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/slider/

**Required keyboard**:
- Arrow left/right — decrease/increase value by step (e.g. 1)
- Home/End — jump to min/max
- PageUp/PageDown — larger steps (e.g. 10)

**Common slop**:
- Value tooltip only visible on hover (hidden at rest)
- Step too coarse or too fine (UX friction)
- No disabled color contrast (looks glitched)

---

## Progress (determinate + indeterminate)

**Required states**: loading (indeterminate), active (0-100%), complete

**Required ARIA**:
- `role="progressbar"` on the container
- `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`
- `aria-label="Uploading file.pdf"` or similar context
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/meter/

**Required keyboard**:
- Not interactive (no keyboard control)

**Common slop**:
- Indeterminate progress styled as determinate (misleading)
- No label or context (what's loading? why?)
- Percentage text misaligned or invisible on light bars

---

## Tree view

**Required states**: expanded, collapsed, active, disabled, focus-visible

**Required ARIA**:
- `role="tree"` on the container
- `role="treeitem"` on each node
- `aria-expanded="true|false"` on expandable items
- `aria-level` if indicating depth
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/

**Required keyboard**:
- Arrow right — expand (or move into) a node
- Arrow left — collapse (or move out of) a node
- Arrow up/down — navigate between siblings
- Enter — activate/select item
- Spacebar — toggle expand on focused item

**Common slop**:
- Icon indent too subtle (depth hard to read)
- No focus visible ring (tree-nav requires it)
- Expand/collapse mixed with selection (two separate concerns)

---

## Breadcrumb

**Required states**: default, hover (on link), disabled (last item or unreachable)

**Required ARIA**:
- `role="navigation"` and `aria-label="Breadcrumb"` on container
- Links inside have descriptive text (not just " > ")
- `aria-current="page"` on the final/current item (not a link)
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/

**Required keyboard**:
- Tab — focus each link in sequence
- Enter — activate link

**Common slop**:
- Separators as focusable elements (they're not)
- Truncation in the middle with no tooltip (hard to see full path)
- No indication of current page (last item looks like a link)

---

## Pagination

**Required states**: default, hover, active (current page), disabled (prev/next at edges)

**Required ARIA**:
- `role="navigation"` and `aria-label="Pagination"` on container
- `aria-current="page"` on the current-page button
- `aria-label="Go to page N"` on numbered buttons
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/pagination/ (no official APG; follow button pattern)

**Required keyboard**:
- Tab — focus each page button
- Enter — navigate to page

**Common slop**:
- Ellipsis (…) not clickable or labeled (confusing)
- "Showing 1-50 of 1,247" text not updated on page change
- Page numbers too densely spaced on mobile (fat-finger issue)

---

## Command palette

**Required states**: closed, open, loading (search), focus, active (highlighted item)

**Required ARIA**:
- `role="combobox"` on the input
- `aria-expanded="true|false"` when open
- `role="listbox"` on the results list
- `aria-live="polite"` on the results (announce changes)
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/

**Required keyboard**:
- Cmd+K (or Ctrl+K) — toggle open/close
- Arrow up/down — navigate results
- Enter — execute command
- Esc — close palette
- Backspace — delete character and filter
- Type — filter in real time

**Common slop**:
- No keyboard shortcut hint shown (users don't know about Cmd+K)
- Results not sectioned (all results in one flat list, hard to scan)
- No visual indication of the currently highlighted item

---

## Multi-select / Tag input

**Required states**: default, focus, active, disabled, filled (with chips), error, loading

**Required ARIA**:
- `role="combobox"` on the input
- `role="listbox"` on the dropdown list
- Each selected tag has a unique ID and `aria-label="tag-name, press Backspace to delete"`
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/

**Required keyboard**:
- Tab — add focused item or move to next field
- Arrow down — open list (if closed)
- Arrow up/down — navigate suggestions
- Backspace — delete the last tag
- Comma (optional) — confirm and add a custom tag

**Common slop**:
- Tags take too much vertical space (overflow, wrapping breaks layout)
- No visual remove button on each tag (only keyboard delete)
- Backspace deletes the tag without confirmation (destructive)

---

## File upload

**Required states**: default, hover (drag-drop highlight), loading (progress), success, error, disabled

**Required ARIA**:
- `aria-label="Upload files"` on the drop zone
- `role="status"` on the progress indicator
- `aria-live="polite"` on individual file status updates
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/button/ (for upload trigger)

**Required keyboard**:
- Tab — focus the upload trigger or drop zone
- Enter/Space — open file picker
- No Escape on the file picker (OS-managed)

**Common slop**:
- No progress per file (only global progress)
- Drag-drop area too small or poorly labeled (users miss it)
- Errors not clearly shown per file (all grouped in one message)

---

## Color picker

**Required states**: default, focus, active, disabled, error

**Required ARIA**:
- `role="group"` on the picker container
- `aria-label="Select color"` on the main control
- Input fields labeled (`aria-label` or associated `<label>`)
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/ (for hex/RGB inputs)

**Required keyboard**:
- Arrow keys — navigate sliders or palette (context-dependent)
- Tab — cycle through hex input, RGB inputs, and swatches
- Enter — confirm and close

**Common slop**:
- Only hex input, no RGB/HSL option (users have different preferences)
- No recent-colors swatch (users repeat previous picks)
- Eyedropper button not clearly labeled or functional

---

## Stepper / Wizard

**Required states**: inactive (not-reached), active (current), complete, disabled, loading

**Required ARIA**:
- `role="group"` or `role="progressbar"` on the stepper
- `aria-current="step"` on the active step
- `aria-label="Step 1: Delivery address"` for each step
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/ (similar structure)

**Required keyboard**:
- Tab — focus the form on the current step
- Previous/Next buttons — traditional arrows, not keyboard shortcuts for the stepper itself
- Esc (optional) — cancel the wizard

**Common slop**:
- Step numbers without labels (confusing in multi-step flows)
- Skipped steps showing as unreachable (not always true; context-dependent)
- No save/continue logic (users lose progress if they navigate back)

---

## Accordion

**Required states**: expanded, collapsed, disabled, loading, error

**Required ARIA**:
- `role="region"` or implicit with `<details>` on each panel
- `aria-expanded="true|false"` on the trigger
- `aria-controls="panel-id"` linking trigger to panel
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/

**Required keyboard**:
- Enter/Space — toggle expand on focused trigger
- Tab — move to next accordion section or control

**Common slop**:
- Height transition too slow (feels sluggish; 200-300ms is right)
- Chevron not rotating with expand/collapse (confusing state)
- Multiple open sections when single-open mode is expected

---

## Disclosure

**Required states**: expanded, collapsed, disabled

**Required ARIA**:
- `role="button"` or implicit with `<summary>` on the trigger
- `aria-expanded="true|false"` on the trigger
- `aria-controls="content-id"` (optional, but helpful)
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/

**Required keyboard**:
- Enter/Space — toggle
- Tab — focus the trigger

**Common slop**:
- Lighter than accordion, but same slips apply (no chevron rotation)
- Used for multiple items in a list (use accordion instead)

---

## Tooltip

**Required states**: hidden, visible (on hover/focus), delayed, disabled

**Required ARIA**:
- `role="tooltip"` on the tooltip content
- `aria-describedby="tooltip-id"` on the trigger (not aria-label, which replaces the label)
- No interactive content inside the tooltip (buttons, links, inputs)
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/

**Required keyboard**:
- No Tab into the tooltip (it's passive)
- Tab to the trigger, then tooltip appears and is announced
- Esc — close (if the tooltip is still visible)

**Common slop**:
- Show delay too short (700ms is standard; <500ms is noisy)
- Hide delay inconsistent (shows quickly, hides slowly, or vice versa)
- Tooltip covers the trigger (position it above/below/side consistently)

---

## Popover

**Required states**: closed, open, focus, loading

**Required ARIA**:
- `role="dialog"` or `role="region"` on the popover
- `aria-label="Settings"` on the popover container
- `aria-modal="false"` (it does NOT trap focus, unlike a dialog)
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ (similar, but non-modal variant)

**Required keyboard**:
- Tab — move through popover content (not trapped)
- Esc — close popover, focus returns to trigger
- Arrow keys — navigate within popover (if a menu)

**Common slop**:
- Applying focus-trap (popovers should not trap focus)
- Dismissal only via outside click (no Esc key support)
- Placement not adaptive (can be cut off on mobile)

---

## Skeleton

**Required states**: loading (shimmer), complete

**Required ARIA**:
- `aria-busy="true"` on the container
- `aria-label="Loading content"` or similar (optional but helpful)
- No interactive elements inside (buttons, links)
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/alert/ (for loading announcements)

**Required keyboard**:
- Not interactive

**Common slop**:
- Dimensions don't match the final content (layout shift when real content arrives)
- Shimmer too aggressive (1.5-2s cycle, very subtle movement)
- Skeleton includes more detail than necessary (e.g., exact text line widths)

---

## Banner / Alert

**Required states**: info, success, warning, danger, dismissible, sticky (top-pinned)

**Required ARIA**:
- `role="alert"` on banners that require immediate attention (danger, warning)
- `role="status"` on non-urgent updates (info, success)
- `aria-live="assertive"` on alert, `aria-live="polite"` on status
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/alert/

**Required keyboard**:
- Tab — focus the close button (if present)
- Enter/Space — dismiss
- No automatic dismiss (user controls)

**Common slop**:
- Color only (red, yellow, green); icons required for color-blind users
- Stacked banners without spacing (hard to read)
- No dismiss option (user can't clear it if they read it)

---

## Toast queue

**Required states**: default, hover (pause auto-dismiss), multiple-stacked, auto-dismissing

**Required ARIA**:
- `role="status"` or `role="alert"` on each toast
- `aria-live="polite"` (status) or `aria-live="assertive"` (alert)
- `aria-atomic="true"` (announce the entire toast)
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/alert/

**Required keyboard**:
- Tab — focus the close button
- Enter/Space — dismiss
- Hover — pause auto-dismiss timer

**Common slop**:
- Toasts stack infinitely (cap at 3-5)
- Auto-dismiss < 5s (users don't have time to read)
- No visual queue position (newest at top or bottom, be consistent)

---

## Badge / Pill

**Required states**: default, disabled, count-variant (numeric), dot-variant (indicator)

**Required ARIA**:
- `aria-label="5 unread messages"` if conveying a count
- No role required (decorative text element)
- If interactive (clickable badge): `role="button"` or `<button>` tag

**Required keyboard**:
- Tab — focus if the badge is a button
- Enter/Space — activate if the badge is a button

**Common slop**:
- Badge text too long (use short numbers or icons)
- No visual distinction between states (hover, active)
- Color only (no text or icon for color-blind users)

---

## Chip

**Required states**: default, selected/active, disabled, loading, input-chip, filter-chip, action-chip

**Required ARIA**:
- `role="button"` or `role="checkbox"` (depends on use)
- `aria-pressed="true|false"` for toggle chips
- `aria-checked="true|false"` for filter chips
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/button/

**Required keyboard**:
- Enter/Space — activate or toggle
- Tab — focus

**Common slop**:
- Chips too large or small (ideally 24-32px tall)
- No remove button on input chips (only keyboard delete)
- Inconsistent state visual (selected not clearly different from default)

---

## Switch / Toggle

**Required states**: on, off, focus-visible, disabled, loading

**Required ARIA**:
- `role="switch"` on the control
- `aria-checked="true|false"` on the switch
- `aria-label="Enable notifications"` on the switch
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/switch/

**Required keyboard**:
- Space — toggle on/off
- Tab — focus the switch

**Common slop**:
- No label (only an icon; not clear what it controls)
- Disabled state not distinct (looks like off)
- Animation too slow or missing (toggle feels unresponsive)

---

## Radio group

**Required states**: selected, unselected, focus-visible, disabled, loading

**Required ARIA**:
- `role="radiogroup"` on the container
- `role="radio"` on each option
- `aria-checked="true|false"` on each radio
- `aria-labelledby="group-label"` on the group
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/radio/

**Required keyboard**:
- Tab — focus the currently-selected radio
- Arrow left/right or up/down — move selection to next/previous radio
- Space — select (if not already selected)

**Common slop**:
- Vertical vs horizontal layout inconsistent with other inputs
- No visual focus ring (arrow-key nav requires it)
- Labels not clickable (touch target too small)

---

## Checkbox tree

**Required states**: checked, unchecked, indeterminate (parent reflects children), disabled, focus-visible, loading

**Required ARIA**:
- `role="treeitem"` for each node
- `role="checkbox"` for the checkbox itself
- `aria-checked="true|false|mixed"` on parent (mixed = some children checked)
- `aria-expanded="true|false"` on expandable nodes
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/

**Required keyboard**:
- Space — toggle checkbox
- Arrow right — expand node (if collapsed)
- Arrow left — collapse node (if expanded)
- Arrow up/down — navigate between items

**Common slop**:
- Parent state not updating when children change (indeterminate state missing)
- Expand/collapse mixed with checkbox (two separate concerns)
- No visual feedback for mixed state (looks half-checked confusingly)

---

## Number input

**Required states**: default, focus, disabled, error, loading (async validation)

**Required ARIA**:
- `type="number"` or `inputmode="numeric"` on the input
- `aria-label="Quantity"` if no visible label
- `aria-valuemin`, `aria-valuemax`, `aria-valuenow` (optional, mirrors input attributes)
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/

**Required keyboard**:
- Arrow up/down — increment/decrement by step (e.g., 1)
- PageUp/PageDown — larger steps (e.g., 10)
- Backspace — delete character

**Common slop**:
- Spinner buttons present but no keyboard support (inconsistent)
- Min/max validation not shown (user enters invalid value, no feedback)
- Decimal places not constrained (floating-point surprises)

---

## Search input

**Required states**: default, focus, filled, clearing, disabled, loading (async), error

**Required ARIA**:
- `aria-label="Search"` on the input
- `aria-autocomplete="list"` if suggestions appear
- `aria-controls="search-results"` linking to result container
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/

**Required keyboard**:
- Tab — focus input, then move to first result (if any)
- Arrow down — move to next result
- Enter — search or select result
- Esc — clear results

**Common slop**:
- No clear button (users must select all and delete)
- Recent searches not visible (users repeat searches)
- Debounce delay inconsistent (searching feels laggy or over-responsive)

---

## Empty state (expanded)

**Required structure**: illustration, headline, supporting text, primary action, secondary action

**Required ARIA**:
- `role="region"` and `aria-label="No invoices"` on the empty state container
- Primary action is a `<button>` or `<a>` with descriptive text
- Link: (see Empty state above; add `aria-label` for clarity)

**Required keyboard**:
- Tab — focus primary action, then secondary action

**Common slop**:
- Illustration takes >30% of vertical space (over-decorated)
- No action button (dead end, user doesn't know what to do)
- Generic headline ("No data") instead of specific ("No invoices yet")

---

## Error state (expanded)

**Required structure**: icon, message (specific), cause or hint, primary action (retry), secondary action (support)

**Required ARIA**:
- `role="alert"` on the error container
- `aria-live="assertive"` to announce the error immediately
- `aria-label="Error: Failed to load invoices"` if the message alone is unclear
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/alert/

**Required keyboard**:
- Tab — focus the Retry button, then Support link (if present)
- Enter/Space — activate actions

**Common slop**:
- Generic message ("Something went wrong") instead of specific cause
- Error replaces entire page (user loses context)
- No retry button (user must refresh)

---

## Loading state (expanded)

**Required treatment**: skeleton > spinner; spinner only for <1s operations

**Required ARIA**:
- `aria-busy="true"` on the loading container
- `aria-label="Loading invoices"` on the skeleton or spinner
- Not aria-live (not typically announced, but aria-busy communicates "in progress")
- Link: https://www.w3.org/WAI/ARIA/apg/patterns/alert/

**Required keyboard**:
- Not interactive during loading

**Common slop**:
- Full-page spinner (use skeleton instead if possible)
- Skeleton dimensions don't match final content (layout shift)
- Spinner for operations >1s with no progress indication (feels stuck)
