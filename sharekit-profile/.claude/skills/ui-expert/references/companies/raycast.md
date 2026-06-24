# Raycast (raycast.com, the app)

The reference for **command-driven UIs** and **dense-list-with-actions** patterns. Best command palette in the industry.

## Aesthetic identity

- **Tone**: keyboard-native, instant, dark-first, accent-tinted-everything.
- **One-sentence physical scene**: "Power user invoking 6 commands a minute on a laptop, cmd+space muscle memory, no mouse for 20 minutes at a time."

## Concrete tokens

### Color

Raycast is dark-first with system-accent tinting:

```css
--bg:          oklch(0.13 0.005 270);
--bg-elevated: oklch(0.17 0.006 270);
--fg:          oklch(0.94 0.005 270);
--fg-muted:    oklch(0.62 0.01 270);
--border:      oklch(0.24 0.008 270);
--accent:      oklch(0.65 0.20 25);    /* Raycast red, OR user-customizable */
```

Raycast lets users pick the accent (system blue, red, purple, etc.). The design respects whatever accent is chosen, tinting:
- Selected row background (low chroma version, ~5% saturation)
- Selected row left-edge indicator (full chroma, 2px)
- Action icons (full chroma)

### Typography

- **Family**: **Inter** (Raycast uses it well — sized down with strong weight contrast)
- **Mono**: **SF Mono** / **JetBrains Mono**
- **Scale** (dense, optimized for in-app density):
  - Header: 16px / weight 600
  - List item: 13-14px / weight 500
  - Subtitle: 12px / weight 400 / muted
  - Keyboard shortcut hints: 11px / weight 500 / muted / mono

### Spacing

- Used steps: 2, 4, 8, 12, 16
- Window padding: 8px outer, 12-16px content
- Row vertical: 6-8px (very dense)
- Row horizontal: 12px

### Radius

- 6px (window itself, list rows when selected)
- 4px (input fields, badges)
- 999px (pills, where used)

## Signature components

### Command palette / root list

```
- Window: 750px wide, dynamic height (max ~530px)
- Input: 44px tall, no border, icon-left (16px), placeholder muted
- List rows: 36-40px tall
  - Left: icon (16px) + label (13px weight 500) + subtitle (12px muted)
  - Right: keyboard shortcut hint OR action group indicator
- Selected row: bg-elevated + accent-left-edge (2px) OR full-row accent-tint
- Footer: 32px bar with current action shortcuts (Tab, Return, Cmd+K for actions menu)
- No scrollbars visible; arrow keys navigate
```

### Action panel (Cmd+K within a list)

Raycast's secondary trick: every item has a contextual action menu.

```
- Slides up from the bottom (or right) over the current list
- Same list anatomy as root
- Closes on ESC or action select
- Shows keyboard shortcut for each action inline
```

### List with detail view

For commands that show more info:

```
- Master/detail split: 40% left list, 60% right detail
- Detail pane scrollable, list pinned
- Selected list item bg-elevated + left accent
- Detail header: title 16px + metadata pills + 24px content gap
```

### Status pill / tag

```
- 18-20px tall
- 6-8px horizontal padding
- 4px radius
- 11px label weight 500
- Tinted bg at ~10% accent chroma
```

## Signature interactions

- **Sub-200ms response on every input.** Filter is instant, no debounce.
- **Cmd+K always opens contextual actions.** Universal pattern.
- **Up/Down/Return covers 90% of operation.** Mouse is a fallback.
- **Cmd+Enter is "alternate primary action" everywhere.**
- **ESC always exits a layer**, never the whole app.

## Anti-patterns in Raycast's world

- ❌ Buttons in the middle of list rows (actions go in action panel)
- ❌ Modals (use slide-overs or action panels)
- ❌ Decorative animations on hover
- ❌ Tooltips (everything has a keyboard shortcut hint already)
- ❌ Loading spinners (use shimmer or "Searching…" inline text)

## When to anchor here

✅ Command palette / Cmd+K UIs
✅ Any list-heavy interface (search, results, browsing)
✅ Keyboard-first power-user tools
✅ Settings panels with searchable options
✅ Action-heavy admin tools

❌ Marketing pages (Raycast's own marketing site uses different rules)
❌ Long-form reading
❌ Consumer-facing low-tech audience
