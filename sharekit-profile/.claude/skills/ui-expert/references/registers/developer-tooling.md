# Register: developer-tooling

The product is consumed primarily by software engineers and technical buyers. Examples: deploy platforms, CI/CD, observability, DB tools, AI coding assistants, dev environments.

## Audience expectations

- Reads design language fluently in five seconds
- Notices typography choices and judges them
- Expects keyboard-first workflows
- Treats marketing copy as untrustworthy when it's vague
- Trusts a screenshot of the actual product more than a hero illustration
- Will probably open DevTools and inspect your CSS

## Primary anchors

- [Linear](../companies/linear.md) — for in-app surfaces
- [Vercel](../companies/vercel.md) — for marketing surfaces
- [Raycast](../companies/raycast.md) — for command palettes / dense lists
- [Stripe](../companies/stripe.md) — for code-as-content marketing blocks

## Mandatory rules

### Typography
- **Pick a mono.** Geist Mono, JetBrains Mono, IBM Plex Mono, Berkeley Mono. Use it for:
  - All code samples
  - All IDs, hashes, tokens, env-var names
  - Section labels (uppercased, letterspaced)
  - Keyboard shortcut hints
- **Pick a non-default sans.** Geist Sans, ABC Diatype, Söhne. Inter only if the project already commits to it.
- **Numbers use tabular-nums.** Always.

### Color
- Default to dark mode for product surfaces. Light mode is the alternate, not the inverse.
- Use OKLCH. Tint neutrals toward the brand hue.
- One saturated accent for primary CTA + brand moments. Use sparingly.
- Marketing CAN go monochrome (Vercel pattern); product MUST have at least one accent (status, focus, selection).

### Layout
- Sidebar + content area is the default product shell. Cards inside.
- Generous whitespace on marketing (96-128px section padding). Dense on product (24-48px).
- Marketing hero: single dominant proposition, not a bento grid.

### Motion
- Sharp ease-out (`cubic-bezier(0.2, 0, 0, 1)` or `expo.out`)
- 120-200ms for state changes
- No bounce, no spring
- Animated marquees: only for "trusted by X companies" logo strips, monochrome at 24-32px height

### Copy
- Concrete claims with numbers. "Deploy in 90 seconds" beats "Deploy fast".
- Code samples in marketing > prose explanations
- No "Get started in seconds!" microcopy. "Get started" is enough.
- Brand name appears in the H1 of the home page OR is implied through dominant visual identity

## Required components

Every developer-tooling product needs:

1. **Command palette** (Cmd+K) on at least one surface
2. **Code block component** with copy button, language tabs if multi-language
3. **Keyboard shortcut hints** visible somewhere (footer of palette, in tooltips, etc.)
4. **Empty state with concrete action** ("Create your first project" not "Welcome!")
5. **Status pills** with dot + label (not just colored bg)
6. **Toast / inline notification** for async operation feedback

## Register-specific anti-patterns

- ❌ Pastel illustrations on marketing pages
- ❌ Stock photography
- ❌ "Bento grid" hero (3×2 colored tiles)
- ❌ Decorative gradient blobs floating behind content
- ❌ Marketing testimonials with portrait photos (engineers don't trust them — use company logos + quotes instead)
- ❌ "Trusted by" logo strips in COLOR
- ❌ Hero with > 50 words of body copy
- ❌ Modals for non-destructive actions
- ❌ Loading spinners (use shimmer or progress percentages)

## Token starter (paste into the design spec)

```css
--bg:          oklch(0.18 0.005 270);     /* dark default */
--bg-elevated: oklch(0.22 0.005 270);
--fg:          oklch(0.96 0.005 270);
--fg-muted:    oklch(0.66 0.008 270);
--border:      oklch(0.30 0.008 270);
--accent:      oklch(0.62 0.20 250);       /* pick one — blurple, cyan, electric green */

--font-display: "Geist Sans", "ABC Diatype", system-ui, sans-serif;
--font-body:    "Geist Sans", system-ui, sans-serif;
--font-mono:    "Geist Mono", "JetBrains Mono", monospace;

--ease:         cubic-bezier(0.2, 0, 0, 1);
--duration-1:   120ms;
--duration-2:   200ms;
--duration-3:   320ms;

--radius-1:     4px;
--radius-2:     6px;
--radius-3:     8px;
```
