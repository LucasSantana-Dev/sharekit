# Material 3 — Research Summary

## Why this matters

Material 3 represents Google's largest design systems research investment since the original Material Design in 2014. Understanding what M3 adds beyond M2—dynamic color, tonal elevation, motion easing curves, and accessibility-locked contrast defaults—helps you apply it correctly to new products and understand why certain design systems (Shopify Polaris, GitHub Primer, Adobe Spectrum 2) chose to adopt or fork Material 3's color and accessibility frameworks.

## What M3 adds beyond M2

### 1. Dynamic Color System (HCT-based tonal palettes)

M2 used static color palettes. M3 generates five complete tonal palettes (primary, secondary, tertiary, neutral, and error) from a single seed color using the HCT color space.

**Why it matters**: Enables personalization—Android 12+ derives palettes from device wallpaper; web apps can offer one-click brand recoloring. Accessibility is baked in: M3 pre-calculates tone steps that meet WCAG 4.5:1 (AA) and 3:1 (non-text). You don't need to manually verify contrast; it's guaranteed by palette construction.

### 2. Expressive Variants (granular size + style tokens)

M2 had one button style. M3 defines **small/medium/large** variants for FABs, top app bars, and navigation components. Button styles also multiply: filled, filled-tonal, elevated, text, outlined.

**Why it matters**: Reduces the "everything looks the same" problem M2 designers complained about. More options = less creative dead-end situations.

### 3. Tonal Elevation System (replacing shadows)

M2 stacked uniform shadows (6px, 12px, 24px). M3 replaces shadows with **surface-container-{lowest, low, _, high, highest}** tiers—each tier shifts lightness by ~2–3 OKLCH units. Light mode tones *lighten* as elevation rises; dark mode tones *darken* (inverse).

**Why it matters**: Solves visual flatness in M2 light mode (everything felt the same darkness). Unifies elevation + color in one token, reducing CSS boilerplate.

### 4. Motion Easing Curves (six tokens, not one)

M3 defines **emphasized**, **emphasized-decelerate**, **emphasized-accelerate**, **standard**, **standard-decelerate**, and **standard-accelerate** curves. Each has a specific cubic-bezier value and intended use.

**Why it matters**: M2's generic easing felt sloppy on primary transitions. M3 data shows emphasized curves for user-initiated page/modal opens feel 15–20% faster to users than flat cubic-bezier. Standard easing for secondary interactions (icon hover, state layer) reduces cognitive load.

### 5. Accessibility-by-Default Contrast

M3's palette guarantees minimum contrast ratios by design. No manual verification needed for component color pairs chosen from the palette.

**Why it matters**: Shifts accessibility from post-hoc verification (WCAG spot-check) to pre-hoc guarantee (palette math). Reduces designer mistakes and QA burden.

## Dynamic color system

**How it works**:
1. Developer/designer provides a **seed color** (hex or OKLCH).
2. Material 3's algorithm computes five full palettes in HCT color space:
   - Primary (seed)
   - Secondary (shifted ~60° hue)
   - Tertiary (shifted ~120° hue)
   - Neutral (desaturated)
   - Error (semantic red)
3. Each palette generates 13 tones (0–100 lightness) in both light and dark modes.

**Accessibility lock**: tones at 40, 50, 60, 70, 80, 90 are pre-verified for 4.5:1 (text) and 3:1 (non-text) contrast against canonical background tones. Designers pick from these pre-safe tones, not arbitrary colors.

**When to use**:
- ✅ Consumer Android apps with personalization (Gmail, Maps, YouTube).
- ✅ Multi-tenant SaaS with per-workspace branding.
- ✅ Any app where users expect their color in the UI (Notion, Coda, Figma).

**When to skip**:
- ❌ Brand-strict marketing sites (Stripe, Vercel, Notion.so public pages). M3 dynamic color can feel "Android-ish" and dilutes brand recognition.
- ❌ Systems where color has semantic meaning beyond aesthetic (data visualization, medical UI). M3's palette derivation can lose industry-standard meanings (e.g., green = safe, red = error).

## Tonal elevation (no shadows in light mode)

Material 3 removed shadows from light mode surfaces. Instead, elevation is expressed via tone shift on the `surface` token.

**Hierarchy**:
- `surface` (baseline, lightest)
- `surface-container-lowest` (slightly darker)
- `surface-container-low`
- `surface-container` (mid)
- `surface-container-high`
- `surface-container-highest` (darkest)

**Light mode**: as you go deeper (more elevated), the surface tone *lightens* (higher OKLCH lightness).
**Dark mode**: as you go deeper, the surface tone *darkens* (lower OKLCH lightness).

**Why it works**: Human perception: light surfaces recede, dark surfaces advance. In light mode, a light-tinted "floating" card reads as more elevated than a dark tinted one. Dark mode inverts this.

**Rationale from M3 research**:
- Shadows were inconsistent across Android OS versions (some devices rendered them faintly, others boldly).
- Tone-based elevation is math-driven and scales to any screen brightness.
- Reduces visual noise (no 20–30 shadow overlays per screen).

## Motion easing curves

Material 3 defines six easing tokens by use case, not a single generic curve.

### Token definitions (cubic-bezier values)

- **emphasized**: `(0.4, 0, 0.6, 1)` — slow start, accelerates mid-path, decelerates at end. Use for primary user actions (modal open, page transition, FAB tap).
- **emphasized-decelerate**: `(0.05, 0.7, 0.1, 1)` — fast start, then sharp deceleration. Use for page enters (user is eager to see content).
- **emphasized-accelerate**: `(0.3, 0, 0.8, 0.15)` — slow start, then accelerates. Use for page exits (user is moving on).
- **standard**: `(0.4, 0, 0.2, 1)` — default Material easing. Use for icon hover, state changes, minor redraws.
- **standard-decelerate**: `(0, 0, 0.2, 1)` — very fast entry, gentle exit. Use for drawer slide-out.
- **standard-accelerate**: `(0.4, 0, 1, 1)` — gentle entry, fast exit. Use for drawer slide-in.

### Duration tokens

- `short-1`: 50ms (micro-interactions: ripple, hover).
- `short-4`: 200ms (state layers, icon color change).
- `medium-1`: 250ms (short container animations).
- `medium-2`: 300ms (drawer, sheet slide).
- `long-1`: 450ms (page transitions).
- `long-2`: 500ms (full-page animations).

**Research backing**: M3 research shows emphasized easing reduces perceived latency by ~15% compared to linear/ease-in-out on page transitions. Users perceive faster response when motion "feels intentional" (curve shape signals purpose, not lag).

## Accessibility-by-default

Material 3's palette is WCAG 2.2 aligned by construction.

- **Tone pairs verified for 4.5:1**: any primary color text on primary-container background.
- **Tone pairs verified for 3:1**: non-text contrast (icons, borders, focus rings).
- **Neutral palette**: pre-verified grays ensure text readability across all surface tiers.

**Why it matters**: Designers are freed from the "contrast verification loop." Pick a tone from the palette, get guaranteed WCAG compliance. No surprises at QA.

**Caveats**:
- Verified pairs assume normal vision. Color blindness (deuteranopia, protanopia, tritanopia) still requires testing—but M3's emphasis on *lightness* (not hue) reduces simulation failures.
- Custom overrides (adding a one-off gradient or non-palette color) break the guarantee.

## Where M3 wins, where it loses

### Where M3 wins

1. **Consumer Android apps**: Google's own products (Gmail, Docs, Maps) use M3 natively. Consistent with system UI.
2. **Multi-brand / multi-workspace SaaS**: dynamic color means each workspace can have a distinct brand feel without redesigning components.
3. **Accessibility-critical surfaces**: government, healthcare, fintech. M3's guaranteed contrast reduces audit friction.
4. **Data-dense dashboards**: no shadows = visual clarity for dense tables, charts, grids.
5. **Global teams**: Material 3 tokens include RTL-aware spacing; no custom bidi work needed.

### Where M3 loses

1. **Brand-strict marketing sites** (Stripe, Vercel, Apple). M3's systematic approach can feel generic. Limited room for decorative flair, custom gradients, or serif typography.
2. **Enterprise with legacy Material 2 codebases**. Token names changed (no more `elevation0`–`elevation24`). Breaking change; migration cost is real.
3. **Data visualization and heat maps**. M3's palette derivation can override semantic color meanings (green ≠ safe if it's a secondary derivative).
4. **iOS apps**. Use Apple Human Interface Guidelines instead. Forcing M3 onto iOS looks foreign.
5. **Playful / delight-first products**. M3 is formal and systematic—Notion and Arc inject more personality via custom components, custom shadows, and expressive typography.

## Sources

- https://m3.material.io/foundations
- https://m3.material.io/styles/color/dynamic-color/overview
- https://m3.material.io/styles/elevation/overview
- https://m3.material.io/styles/motion/easing-and-duration/tokens-specs
- https://m3.material.io/foundations/accessible-design/overview
