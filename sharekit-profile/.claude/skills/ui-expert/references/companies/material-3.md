# Material 3 (m3.material.io)

The open design system for **data-dense, accessible, brand-forward surfaces** across Android and web. Where Material 2 was opinionated about shadows, Material 3 erases them in light mode and anchors everything to tonal elevation and semantic color.

## Aesthetic identity

- **Tone**: mathematical, expressive within bounds, accessible by default, motion-purposeful. Color drives meaning, not decoration.
- **One-sentence physical scene**: "Product manager reviewing analytics on a tablet at a standing desk, tapping surface-tinted buttons and watching micro-interactions respond instantly."

## Concrete tokens (observed from m3.material.io)

### Color — dynamic color system

Material 3's superpower: five tonal palettes derived from a single seed color. Each palette has light + dark mode tokens.

```css
/* Primary palette (core brand color) — seed color #6750A4 */
--primary:              oklch(0.57 0.15 265);   /* vivid */
--on-primary:           oklch(1.00 0.00 0);    /* text on primary */
--primary-container:    oklch(0.88 0.07 270);   /* light tint */
--on-primary-container: oklch(0.21 0.08 265);   /* text on container */

/* Secondary palette — supporting accent */
--secondary:            oklch(0.52 0.09 180);   /* teal */
--secondary-container:  oklch(0.84 0.05 185);

/* Tertiary palette — tertiary accent */
--tertiary:             oklch(0.57 0.10 25);    /* warm orange */
--tertiary-container:   oklch(0.90 0.04 35);

/* Neutral palette — grayscale for UI structure */
--surface:              oklch(0.98 0.00 0);     /* lightest background */
--surface-container-lowest:  oklch(1.00 0.00 0);
--surface-container-low:     oklch(0.97 0.00 0);
--surface-container:         oklch(0.96 0.00 0);
--surface-container-high:    oklch(0.95 0.00 0);
--surface-container-highest: oklch(0.94 0.00 0);

--on-surface:           oklch(0.20 0.00 0);     /* text on surface */
--on-surface-variant:   oklch(0.50 0.02 240);   /* secondary text */

/* Neutral variant — reserved for tints */
--outline:              oklch(0.50 0.05 240);
--outline-variant:      oklch(0.74 0.02 240);

/* Error semantic color */
--error:                oklch(0.63 0.26 30);
--on-error:             oklch(1.00 0.00 0);
--error-container:      oklch(0.93 0.06 40);
```

**Dark mode**: shift all lightness down 0.25-0.35, keep hue + chroma.

### Typography

- **Family**: Roboto (Material's original) or **Google Sans** (more friendly). For web, also acceptable: **Söhne**, **Manrope**, **Inter**.
- **Mono**: Roboto Mono or **Source Code Pro** for code blocks.
- **Type scale**:
  - Display Large: 57px / weight 400 / leading 1.12
  - Display Medium: 45px / weight 400 / leading 1.16
  - Display Small: 36px / weight 400 / leading 1.22
  - Headline Large: 32px / weight 400 / leading 1.25
  - Headline Medium: 28px / weight 400 / leading 1.29
  - Headline Small: 24px / weight 400 / leading 1.33
  - Title Large: 22px / weight 500 / leading 1.27
  - Title Medium: 16px / weight 500 / leading 1.50
  - Title Small: 14px / weight 500 / leading 1.43
  - Body Large: 16px / weight 400 / leading 1.50
  - Body Medium: 14px / weight 400 / leading 1.43
  - Body Small: 12px / weight 400 / leading 1.33
  - Label Large: 14px / weight 500 / leading 1.43
  - Label Medium: 12px / weight 500 / leading 1.33
  - Label Small: 11px / weight 500 / leading 1.45

### Spacing (8pt base)

- Steps: 0, 4, 8, 12, 16, 24, 32, 48, 56, 64, 80, 96
- Dialog padding: 24px
- Card padding: 12-16px
- List item: 16px horizontal, 12px vertical
- Icon + text gap: 8px

### Radius

- 2px (no rounding on text inputs in Material 3 strict mode)
- 4px (small surfaces, chips)
- 8px (cards, medium surfaces)
- 12px (large surfaces, bottom sheets)
- 28px (FABs, large pills)

### Motion

- Easing: Material design tokens use cubic-bezier curves, not spring.
  - Standard: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out dominant)
  - Decelerate: `cubic-bezier(0, 0, 0.2, 1)`
  - Accelerate: `cubic-bezier(0.4, 0, 1, 1)`
- Duration: 150ms (state change), 200ms (container animation), 500ms (page transition)
- State layers: overlay opacity at 0.08 (hover), 0.12 (focus), 0.16 (pressed)

## Signature components

### Filled tonal button

```
- Background: primary-container color
- Text: primary color
- Height: 40px (recommended)
- Padding: 8px horizontal (icon), 24px (text), 12px (text + icon)
- Radius: 8px
- State layers: press = --on-primary overlay at 0.16 opacity
- No shadow in light mode; dark mode may add 0.5px surface elevation
```

### Floating action button (FAB)

```
- Diameter: 56px (extended: 56px height, min 112px width)
- Background: primary color
- Icon: white (on-primary)
- Shadow: 3px elevation (even in light mode)
- Radius: 16px (56px / 2 = pill for standard FAB)
- Extended variant: label on right, 16px gap to icon
- Hover: shadow lift to 4-6px, state layer at 0.12
```

### Top app bar (small/medium/large)

**Small** (56px tall):
- Title: 16px title-medium
- Padding: 16px horizontal, center vertically
- Icon on left (back/menu), action icons on right
- No elevation by default; scroll reveals 1px divider

**Medium** (88px tall):
- Title: 20px title-medium, down 4px from top in bottom third of bar
- Icon layout same as small
- Scrolling transitions to small variant

**Large** (152px tall):
- Title: 32px headline-large, positioned in bottom third
- Used on detail pages, full content width

### Material card

```
- Padding: 16px
- Radius: 12px
- Outline: 1px on-surface at 0.12 opacity (light mode), no outline in dark mode
- Background: surface or surface-container
- Elevated variant: 1px shadow + fill
- Filled variant: surface-container background, no shadow
```

### Navigation rail (vertical sidebar)

```
- Width: 80px (icon + label stacked), 256px (expanded with full text)
- Item height: 56-64px
- Icon: 24px centered
- Label: 12px label-small, optional when collapsed
- Active state: primary-colored icon + background tint to primary-container
- Hover: state layer at 0.08 opacity
- No separators — spacing is your structure
```

## Anti-patterns in Material 3's world

- ❌ Shadows in light mode (Material 3 uses tonal elevation, not shadows — shift surface tier instead)
- ❌ Vibrant/saturated colors for secondary surfaces (use -container variants instead)
- ❌ Skipping dynamic color (if the system has a seed color, generate tonal palettes, don't hardcode)
- ❌ Custom motion curves (stick to Material's 3 standard easing curves)
- ❌ Mixing fonts across hierarchy levels without a type scale
- ❌ Text over primary background without `on-primary` token (contrast fail)
- ❌ Dialog shadows > 6px elevation (Material 3 is understated)
- ❌ Keyboard shortcuts not visible or unsupported

## When to anchor here

✅ Android apps and Material Design consumers (material.io-aware users)
✅ Accessibility-critical surfaces (Material 3 defaults to WCAG AA+)
✅ Large design systems needing a published token spec
✅ Data-dense dashboards where elevation-via-color is preferred over shadow
✅ Multi-product platforms (design system coherence across org)

❌ Playful consumer brands (Material 3 is formal — try Notion or Arc)
❌ Legacy Material 2 environments (breaking changes in token structure)
❌ Surfaces where decorative shadows drive aesthetic (go Adobe Spectrum instead)

## Sources

- https://m3.material.io/foundations
- https://m3.material.io/styles/color/dynamic-color/overview
- https://m3.material.io/styles/typography/type-scale-tokens
- https://m3.material.io/styles/elevation/overview
- https://m3.material.io/styles/motion/easing-and-duration/tokens-specs
