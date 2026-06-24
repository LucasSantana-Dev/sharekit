# Mantine (mantine.dev)

The reference for **React component library with native dark mode and a polymorphic component pattern**. Use Mantine when you're building a dashboard, admin tool, or SaaS product that needs flexible, accessible components out of the box.

## Aesthetic identity

- **Tone**: accessible, open-source-friendly, no opinions about your brand, just solid foundations and extensible tokens.
- **One-sentence physical scene**: "A React developer at midday, shipping a data dashboard inside a corporate intranet, relying on unstyled-first components + theme tokens to match brand guidelines without reinventing Button."

## Concrete tokens (from Mantine 7+)

### Color (open-color baseline, 10 steps per swatch)

Mantine's default includes blue, red, teal, violet, yellow, orange, lime, cyan, grape, and gray. Each has 10 shades (index 0–9):

```
blue[0]  = oklch(97.2% 0.014 250)   // lightest
blue[5]  = oklch(76.2% 0.083 250)   // primary default
blue[9]  = oklch(14.1% 0.032 250)   // darkest

theme.primaryColor = 'blue'  (key reference, not hardcoded hex)
theme.primaryShade = 6       (in filled variant, use colors[6])
```

Virtual colors in dark mode via `virtualColor()` — same palette key, different shade per scheme.

### Typography

- **Headline font**: Greycliff CF (Mantine default); fallback Inter or system sans
- **Body font**: Inter (or system sans); explicitly NOT Helvetica
- **Scale** (theme.fontSizes, default md breakpoint):
  - h1: 34px / weight 700
  - h2: 26px / weight 700
  - h3: 22px / weight 700
  - h4: 18px / weight 700
  - h5: 16px / weight 700
  - h6: 14px / weight 700
  - Body: 16px / weight 400
  - Small: 14px / weight 400
- **Weights**: regular 400, medium 600, bold 700

### Spacing (numeric scale, no base unit — apply as px then convert to rem in CSS)

```
xs: 10px
sm: 12px
md: 16px
lg: 20px
xl: 32px
```

Used for padding, margin, gaps inside cards, between sections.

### Radius

```
xs: 2px
sm: 4px
md: 8px
lg: 16px
xl: 32px
```

Default for Button, TextInput, Card = `md` (8px). Avatar and pills use `xl` (32px).

### Motion

- **Transitions**: 150ms fade for modals/dropdowns, 200ms for significant state change
- **Curve**: `cubic-bezier(0.4, 0, 0.2, 1)` (material-standard)
- **Loading overlay**: Loader component with overlay div (color inherits from button color)

## Signature components

### Button (variant system: filled, light, outline, subtle, default, gradient, loading state)

```
- Supports leftSection / rightSection for icons (not just left/right prop)
- loading={true} overlay with Loader, disables interaction
- Compact size: xs-xl standard, compact-xs to compact-xl with reduced padding
- Polymorphic: component="a" | "button" | custom
- autoContrast: true by default in filled variant — auto text color based on bg luminance
```

### Modal + Modals Manager

```
- useModals hook for imperative modal open/close (stacked)
- Mantine 7: focus trap built-in, FocusScope wrapper
- transition: fade 150ms, centered on screen
- Confirm modal: openConfirmModal({ title, labels, onCancel, onConfirm })
```

### Notification / Toast

```
- Notification component: standalone component with color/title/message/icon
- NotificationCenter (within useNotifications hook) for toast queue
- Auto-dismiss in 5s by default, optional close button, stack position (top-right typical)
```

### Combobox (Mantine 7+ unstyled-first)

```
- Composable API: Combobox, Combobox.Target, Combobox.Dropdown, Combobox.Options, Combobox.Option
- Keyboard nav: arrow keys, enter to select, escape to close
- Async search support via onSearchChange callback
- Polymorphic children: render custom option templates
```

### Card (section-based grouping)

```
- Card + Card.Section layout pattern
- Section: padding inherited from Card, or custom padding per section
- Useful for vertically stacked content with internal dividers
- shadow="md" (default), padding="md"
```

## Anti-patterns in Mantine's world

- ❌ Ignoring `theme.other` for custom non-standard tokens — use it for brand colors outside the 10-step palette
- ❌ Hardcoding Greycliff CF without checking if the font is loaded (use system fallback)
- ❌ Using `component` prop for routing without verifying accessibility (test focus management)
- ❌ Overriding Modal focus behavior without FocusScope — trap focus explicitly
- ❌ Relying on Modal's built-in animations without reducing motion support — check `prefers-reduced-motion`
- ❌ Neglecting `autoContrast` in filled buttons on custom colors — can fail WCAG 1.4.3 if luminance is mid-range

## When to anchor here

✅ React dashboard, admin panel, internal SaaS product
✅ Component library that needs dark mode out of the box
✅ Team shipping fast and willing to customize via Styles API
✅ Products requiring RTL layout support (Mantine has it built-in)
✅ Accessible form-heavy applications (Checkbox, Radio, Select all ARIA-ready)

❌ Consumer-facing marketing site (use Notion or Vercel design systems instead)
❌ Brand that needs completely custom component look-and-feel (use Radix+headless pattern instead)
❌ Static content site (Mantine is for interactive apps)

## Sources

- https://mantine.dev/theming/theme-object/
- https://mantine.dev/theming/colors/
- https://mantine.dev/core/button/
- https://mantine.dev/core/modal/
- https://mantine.dev/core/combobox/
- https://mantine.dev/styles/css-variables/
