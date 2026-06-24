# Primer (GitHub) — primer.style

The reference for **code-aware SaaS** and repository-centric interfaces. If the surface involves diffs, code review, file trees, or any Git-native workflow, Primer is the anchor.

## Aesthetic identity

Primer is GitHub's system—clean, accessible, code-first, built on dark-and-light symmetry. Repository interfaces demand clarity over decoration; every visual decision serves diff readability or navigation speed.

**One-sentence physical scene**: "Code review on Monday morning in a coffeeshop, dark mode, with a Terminal window next to the browser tab."

## Concrete tokens (from primer.style)

### Color (dark mode primary; light mode mirrors symmetrically)

```css
/* Light mode */
--canvas.default:      oklch(0.98 0.002 0);    /* page background */
--fg.default:          oklch(0.19 0.008 260);  /* body text */
--fg.muted:            oklch(0.48 0.008 260);  /* secondary text */
--border.default:      oklch(0.87 0.005 260);  /* dividers, subtle */
--accent.fg:           oklch(0.44 0.18 265);   /* #0969DA — GitHub blue */

/* Code-aware tokens (diff colors — universal across themes) */
--diffBlob.addition.bg:    oklch(0.85 0.12 135); /* soft green for adds */
--diffBlob.deletion.bg:    oklch(0.92 0.11 10);  /* soft red for deletes */
--diffBlob.neutral.bg:     oklch(0.88 0.02 260); /* unchanged lines */

/* Syntax highlighting uses named tokens, not hex */
--variable:      oklch(0.50 0.14 260);  /* e.g., function names */
--string:        oklch(0.52 0.15 90);   /* "strings" in green */
--function:      oklch(0.55 0.16 265);  /* function() in blue */
--number:        oklch(0.50 0.14 20);   /* numbers in orange */

/* Dark mode inverts but keeps saturation */
```

### Typography

- **Family**: -apple-system, "Segoe UI", "Helvetica Neue", sans-serif — **GitHub does not pin a font**. Uses system fonts intentionally for performance + familiarity.
- **Monospace**: "SF Mono" (macOS), Menlo, Consolas, monospace (fallback stack)
- **Scale**:
  - H1: 32px / weight 600 / leading 1.2
  - H2: 24px / weight 600 / leading 1.25
  - H3: 20px / weight 600 / leading 1.3
  - Body: 14px / weight 400 / leading 1.5
  - Small: 12px / weight 400 / leading 1.4
- **Code blocks**: 13px monospace, `font-feature-settings: 'tnum'` for aligned columns in tables

### Spacing (8px base, 4px micros)

- Primitive scale: 4, 8, 12, 16, 20, 24, 32, 40
- Sidebar item: 8px vertical padding, 12px horizontal
- Card padding: 16px
- Section gaps: 24px
- Code-heavy surfaces: tighter — 12px between elements

### Radius

- Inputs, buttons: 6px
- Cards: 6px (Primer uses subtle rounding)
- Avatars: 4px (not fully rounded — slightly squared)
- Pills: 12px (badges, labels)

### Motion

- Duration: 160ms (state changes), 200ms (transitions)
- Curve: ease-out
- No spring or bounce — matches Linear's precision

## Signature components

### Header (repository chrome)

```
- 48px tall on desktop, 56px on mobile
- Left: repo owner/name as breadcrumb + branch selector
- Center: tab bar (Code, Pull Requests, Issues, Projects, Wiki, Settings)
- Right: star/fork/watch buttons, user avatar menu
- Sticky on scroll; respects code-first UX (no scroll bounce, no decoration)
```

### IssueLabel / Badge

- 20-24px tall
- Pill-shaped (12px radius)
- Inline text (no weight shift on hover)
- Optional dot-prefix for semantic color
- Stacked horizontally in issue rows, never wrapped

### TreeView (file browser)

- Left sidebar, 240-260px wide by default
- Row height: 28px
- Expand/collapse caret: smooth 90° rotation on toggle
- File icon: 16×16px, semantic (code file icon ≠ folder icon)
- Keyboard: arrow up/down navigates, arrow right expands, arrow left collapses
- ARIA: tree role, aria-expanded, aria-label per item

### Timeline (commit/PR feed)

- Vertical spine on left with 3px avatar dots
- Each entry: avatar + timestamp + message
- Nested comments/replies indented 16px
- Message can contain inline code (monospace, 11px)
- Status badges (Approved, Changes Requested) align to the right

### Truncate (long text in narrow spaces)

- Text truncates with ellipsis (`text-overflow: ellipsis; white-space: nowrap`)
- Tooltip shows full text on hover (delay: 500ms)
- Used in: file paths, branch names, long commit messages

## Anti-patterns in Primer's world

- ❌ Serif fonts anywhere (Primer is all system sans-serif)
- ❌ High-saturation brand colors in code areas (diffs must remain readable)
- ❌ Animated transitions on expand/collapse (instant or 160ms only)
- ❌ Dense data tables without monospace alignment (tabular-nums essential)
- ❌ Custom scroll behavior (Primer respects native scrolling)
- ❌ Icons without alt-text or aria-label (accessibility first)
- ❌ Syntax highlighting without contrast verification (WCAG 4.5:1 minimum)

## When to anchor here

✅ Repository browser, file tree, issue tracker
✅ Code review interface, pull request detail
✅ Git-native SaaS (version control, deployment, CI/CD)
✅ Developer dashboards with code samples
✅ Any product serving engineers auditing code

❌ Consumer e-commerce (use Stripe)
❌ Media-heavy social product (use Notion)
❌ Marketing landing pages (use Vercel/Stripe)

## Sources

- https://primer.style/foundations/color
- https://primer.style/foundations/typography
- https://primer.style/foundations/spacing
- https://primer.style/components
