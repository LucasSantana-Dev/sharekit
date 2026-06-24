# Spectrum 2 (Adobe) — spectrum.adobe.com

The reference for **pro-creative and expressive enterprise UIs**. Spectrum is Adobe's second-generation design system, rebuilt for international-first design, three-theme density, and accessibility as a load-bearing foundation. Use when the surface requires densely-packed controls, localization (RTL/LTR symmetry), or a breadth of component states.

## Aesthetic identity

Spectrum 2 is engineered for the creative professional: keyboard shortcuts on every surface, three theme levels (light/dark/darkest), every interaction metered to pixels. No decoration — the UI gets out of the way so the canvas matters.

**One-sentence physical scene**: "A designer in Photoshop with the tool panel docked, watching adjustments ripple across the canvas in real time, UI so dense it's almost abstract until you need it."

## Concrete tokens (from spectrum.adobe.com/design-tokens)

### Color

Spectrum 2 uses **named palettes** derived from a neutral anchor. Neutral grays form the foundation:

```css
/* Neutral grays (50 = lightest, 900 = darkest) */
--gray-50:   oklch(0.98 0.002 270);
--gray-100:  oklch(0.96 0.002 270);
--gray-200:  oklch(0.93 0.004 270);
--gray-400:  oklch(0.85 0.004 270);
--gray-600:  oklch(0.73 0.006 270);
--gray-700:  oklch(0.67 0.006 270);
--gray-800:  oklch(0.54 0.008 270);
--gray-900:  oklch(0.30 0.010 270);

/* Semantic tokens (three modes: light, dark, darkest) */
--bg-base:         var(--gray-50);      /* light */
--bg-base-dark:    var(--gray-900);     /* dark */
--bg-base-darkest: oklch(0.12 0.005 270); /* darkest */

--fg-base:         var(--gray-900);
--fg-base-dark:    var(--gray-50);
--fg-muted:        var(--gray-600);

--accent-color:    oklch(0.58 0.18 270); /* blue-400 */
--negative-color:  oklch(0.54 0.16 18);  /* red-500 */
--positive-color:  oklch(0.62 0.14 140); /* green-500 */
--notice-color:    oklch(0.72 0.16 53);  /* yellow-400 */
--informative-color: oklch(0.58 0.16 270); /* blue-400 */
```

Spectrum 2 uses **three theme levels**, not just light/dark:
- **Light**: bg-gray-50, fg-gray-900 (office/bright environments)
- **Dark**: bg-gray-900, fg-gray-50 (studio/default)
- **Darkest**: bg-[12% gray], fg-white (creative pros who live in darkest mode)

### Typography

- **Font family**: Adobe Clean (default), with localized variants (Adobe Clean Sans Hebrew, Arabic, Japanese).
- **Scale** (heading = 600 weight, body = 400 weight):
  - Heading XXL: 28px / 36px leading / 600 weight
  - Heading XL: 22px / 28px leading / 600 weight
  - Heading L: 18px / 23px leading / 600 weight
  - Heading M: 16px / 20px leading / 600 weight
  - Heading S: 14px / 18px leading / 600 weight
  - Body: 14px / 16px leading / 400 weight
  - Detail: 12px / 14px leading / 400 weight

### Spacing (4px base)

```css
--size-100: 8px;    /* smallest gap, icon spacing */
--size-200: 16px;   /* standard button padding, card gap */
--size-300: 24px;   /* section separation */
--size-400: 32px;   /* major layout gap */
```

### Radius

- 4px (default for buttons, inputs, small containers)
- 6px (cards, dropdowns)
- 999px (pills, badge indicators)

### Motion

- **Duration**: 100ms (state change), 150ms (panel open), 200ms (major transition)
- **Curve**: `cubic-bezier(0.4, 0, 0.2, 1)` (standard easing)
- **Delay**: Never auto-delay; user action → immediate motion

## Signature components

### ActionButton

Spectrum's primary toolbar button: square icon with optional label, compact (24px or 32px), no fill in default state, accent fill on selected.

```
ActionButton(icon="eye", variant="primary")
- 24px × 24px icon-only default
- 32px × 32px with label
- No background until :hover (then bg-elevated)
- On :active or [aria-selected="true"]: bg + accent tint
- Padding: 8px (icon-only), 12px L/R (labeled)
```

### StatusLight

Named status indicator (a dot + optional label). Shows state without words: notice (yellow), positive (green), negative (red), informative (blue), or neutral (gray).

```
StatusLight(status="positive")
- Circle: 8px diameter
- Color matches semantic token (--positive-color, etc.)
- Label optional: 11px, left-margin 4px
- No background — dot only
```

### Tabs

Compact list-selection pattern. Underline or pill variant, keyboard-navigable with arrow keys.

```
Tabs
- Each tab: 44px tall, 12px L/R padding
- Underline variant: accent underline on active, no bg
- Pill variant: rounded pill bg on active, gray on inactive
- Separators optional; keyboard nav required (arrow left/right)
```

### Picker (combobox)

Spectrum's autocomplete/select. Searchable dropdown with optional grouped results.

```
Picker
- Trigger button: 32px tall, chevron icon on right
- Dropdown: 320px wide typical, scroll if >6 items
- Each item: 32px tall, 12px padding, checkmark on selected
- Search input at top if items > 5
- Keyboard: arrow nav, Enter to select, Esc to close
```

### HelpText

Light descriptive text below form fields. Semantic tint (notice/negative/informative).

```
HelpText(variant="notice")
- 12px size, --fg-muted color
- Tint changes based on variant (yellow for notice, red for error)
- Above or below input; below is default
- ARIA describedby relationship to input required
```

## Anti-patterns in Spectrum's world

- ❌ Ignoring the three-theme system (darkest mode is not a one-off)
- ❌ RTL support as an afterthought — build symmetrically from day 1
- ❌ Form labels only above on desktop (must be consistent at all breakpoints)
- ❌ Missing semantic tokens — use --positive-color not custom green
- ❌ ActionButton with background fill in default state (no visual weight)
- ❌ Text label on standalone icon (use title attribute or tooltip)
- ❌ Mixed color naming (blue-400 + custom #2563eb in same file)

## When to anchor here

✅ Creative pro tools (DAWs, design apps, video editors)
✅ Enterprise admin surfaces with high control density
✅ Internationalized B2B SaaS (RTL, CJK, Arabic locales)
✅ Any surface requiring darkest-mode support
✅ Accessibility-critical enterprise work (Spectrum's a11y is leading-edge)

❌ Consumer-first, marketing-forward surfaces (use Notion or Stripe instead)
❌ Mobile-first design (Spectrum is heavy, desktop-tuned)
❌ Single-locale, light-mode-only products

## Sources

- https://spectrum.adobe.com/page/design-tokens/
- https://spectrum.adobe.com/page/color-system/
- https://spectrum.adobe.com/page/typography/
- https://spectrum.adobe.com/page/components/
- React Aria Spectrum adapter: https://react-spectrum.adobe.com/
