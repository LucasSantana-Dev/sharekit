# Arc (arc.net)

The reference for **browser-as-workspace** philosophy. Arc argues that the browser itself should function like a well-designed operating system: sidebar is the focal point, command bar is the primary interaction, and traditional chrome gets out of the way to maximize content space.

## What this brand teaches

Arc proves that radical chrome reduction doesn't mean losing capability—it means reorganizing it. The sidebar becomes your filing system; the command bar (`Cmd+T`) handles 80% of actions; Spaces let you context-switch with a single keypress. Every visual decision asks: "Does this help me use the web faster, or am I just looking at the browser?" The lesson: in crowded product spaces, architecture-first navigation beats feature-first navigation.

## Signature patterns

### Sidebar with Pinned/Today/Auto-archive

```
- 240–280px fixed left edge, collapsible
- Three sections: Pinned (always visible), Today (auto-populated), Archive (aged, collapsed)
- Tab row height: 32px, 12px padding, no full-width highlights
- Hover: subtle background shift, no scale or underline
- Active tab: left-edge color accent (Space color varies per context)
- Right-click → archive or pin; no visible "delete" button (archive is the default end state)
- Archive auto-hides old tabs after 7 days unless explicitly pinned
```

### Command bar (Cmd+T) — does everything

```
- 44px tall input, centered ~16px from top, 8px rounded corners
- Instant results as you type: no debounce, no loading spinner
- Sections: "Go to tab", "Create new tab", "Boost", "Settings", "Help"
- Keyboard: Tab cycles sections, Enter commits, Esc closes
- No visual hierarchy between action and search — keeps decision space low
- Footer: 28px tall with keyboard hint (→ Enter to go, ⌘ to see more)
```

### Spaces — color-coded context switching

```
- 1–5 key toggles between Spaces (each Space is a complete browser context)
- Each Space has a custom brand color (pink, blue, orange, purple, etc.)
- Space color tints: sidebar background, accent underline on active tab, command bar border
- Space switcher: row of 4–6 small square buttons at top-left, OR via Cmd+number keys
- Switching Spaces instantly replaces sidebar; no loading, no state loss in background
```

### Easels — spatial organization canvas

```
- Right-click tab → "Create Easel" opens a spatial canvas
- Tiles are draggable, resizable pinboards for organizing related tabs
- Each Easel is a named view (e.g., "Design Audit", "Q2 Planning")
- Thumbnail grid view of all Easels in Space
- Not a replacement for sidebar; a power-user parallel for complex project work
```

### Boost — per-site CSS customizations

```
- Right-click site name → "Boost this site"
- Web UI for writing custom CSS that applies only to that domain
- Common uses: hide header, expand content width, dark-mode override
- Persists per-Space, so you can have Boosted sites looking different in "Work" vs "Personal"
```

## Approximate visual tokens

Arc doesn't publish a design system, so these are derived from release screenshots and public reviews:

```css
/* Arc sidebar background — very light gray, almost off-white */
--sidebar-bg:        oklch(0.98 0.002 0);      // approximate

/* Tab text and muted labels */
--text-primary:      oklch(0.20 0.002 0);      // approximate, almost black
--text-muted:        oklch(0.65 0.005 0);      // approximate

/* Space colors vary per user choice; typical primaries: */
--space-pink:        oklch(0.58 0.18 10);      // approximate
--space-blue:        oklch(0.60 0.15 250);     // approximate
--space-orange:      oklch(0.62 0.16 45);      // approximate

/* Typography: system font stack (San Francisco on macOS, Segoe on Windows) */
--font-body:         system-ui, -apple-system, sans-serif;
--font-mono:         "Menlo", "Monaco", monospace;    // for IDs, codes
--text-size-body:    13px;
--text-size-label:   11px;

/* Rounded corners — generous for a browser, minimal for components */
--radius-window:     12px;   // window chrome
--radius-input:      6px;    // input, buttons
--radius-tab:        4px;    // tab corners, subtle

/* Spacing — SaaS-app density (breathing room, not compact) */
--spacing-xs:        4px;
--spacing-sm:        8px;
--spacing-md:        12px;
--spacing-lg:        16px;
--spacing-xl:        24px;

/* Shadows — soft, no elevation theater */
--shadow-sm:         0 1px 3px rgba(0, 0, 0, 0.08);  // approximate
--shadow-md:         0 2px 8px rgba(0, 0, 0, 0.12);  // approximate
```

## When to study this brand

✅ **Workspace applications** — products that aggregate many sub-items (email, calendar aggregators, note collections, RSS readers).

✅ **Power-user keyboard-first tools** — anything where 70% of users live in the command bar.

✅ **Sidebar-led navigation** — when your IA naturally favors a persistent left panel.

✅ **Context-switching products** — work-life separation, project isolation, account switching.

❌ **Consumer apps without context switching** — Arc's Spaces concept is overkill for single-mode products.

❌ **Mobile-first products** — Arc's sidebar doesn't translate to narrow viewports; use bottom nav or drawer instead.

❌ **Marketing/onboarding flows** — Arc is utilitarian; it teaches nothing about welcome, conversion, or persuasion.

## Anti-patterns NOT to copy

- ❌ **Per-Space brand color customization on non-browser products**: Arc can do this because each Space is isolated and color is a signal. In a SaaS app with shared state, per-user theme colors create chaos.
- ❌ **Easels for every power-user feature**: Easels work because they're optional and deeply specialized. Don't give every feature a spatial mode; it's feature bloat.
- ❌ **Sidebar-only navigation with no fallback**: Arc's sidebar + command bar is a pair. If you remove the command bar to "simplify," the sidebar becomes a bottleneck.

## Sources

- https://arc.net/
- https://arc.net/release-notes
- https://www.thebrowsercompany.com/ (The Browser Company blog and public product updates)
