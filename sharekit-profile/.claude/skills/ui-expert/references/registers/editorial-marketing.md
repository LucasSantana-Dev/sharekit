# Register: editorial-marketing

Content-first surfaces: marketing sites, brand pages, campaign landing, long-form articles, magazines, portfolios. Design IS the product on these pages.

## Audience expectations

- Lands cold and decides in 5-10 seconds
- Will scroll if they're interested, leave if they're not
- Reads design as a credibility signal for the company
- Notices when the brand voice is generic
- Won't click the CTA without first feeling the brand

## Primary anchors

- [Vercel marketing](../companies/vercel.md) — for technical brands
- [Stripe marketing](../companies/stripe.md) — for fintech brands
- [Notion marketing](../companies/notion.md) — for consumer brands
- Apple's marketing pages (apple.com/airpods, apple.com/iphone) — for premium consumer brands

## Mandatory rules

### Typography (the centerpiece)

Editorial typography is the single biggest opportunity:

- **Display face**: pick something with character. Fraunces, ABC Diatype, Söhne, GT Sectra, Domaine. NOT Inter, NOT system stack.
- **Body face**: a complementary one. If display is serif → body sans. If display is sans → body sans variant with weight contrast.
- **Mono** for technical content if applicable
- **Hero size**: 64-128px depending on viewport. Smaller is for product, bigger is for editorial.
- **Tracking**: negative on large display (-0.02 to -0.04em). Default on body.
- **Hierarchy via scale**: 3-4 levels, each ≥ 1.5× the previous
- **Weight contrast**: huge — 300 vs 700, or 200 vs 800

### Color
- Choose a color strategy (per `impeccable`):
  - **Restrained**: tinted neutrals + one ≤ 10% accent
  - **Committed**: one color carries 30-60% of the surface
  - **Full palette**: 3-4 deliberate roles
  - **Drenched**: the surface IS the color
- Pick before designing. Most editorial work goes Committed or Drenched.

### Layout
- Asymmetric. Editorial is the one place where centered-everything is wrong.
- Generous whitespace — 128-192px between sections is acceptable
- Multi-column where the content suits it (long-form, magazine-style)
- Pull-quotes, sidebars, captions are first-class layout elements
- One H1 per page

### Imagery
- High-quality, intentional. Either custom photography, custom illustration, or product renders.
- NEVER stock photography
- NEVER generic vector "people" illustrations
- Editorial brands often use:
  - Bold photography (Apple, Stripe gradient pages)
  - Diagrammatic illustration (Stripe)
  - Custom characters (Mailchimp, Notion)
  - Type-as-image (Vercel hero, Linear changelog)

### Motion
- Reserved for moments. Hero entrance, scroll-triggered reveals at section breakpoints, image parallax (subtle).
- Easing: refined exponential (`ease-out-quart`). No bounce.
- Duration: 400-800ms for major reveals
- Respect `prefers-reduced-motion`

## Required components

1. **Hero** that earns the first viewport
2. **Section break** that signals "new chapter"
3. **Pull-quote** at editorial weight
4. **Image with caption** properly aligned
5. **Call-to-action** that's *one* primary, optional secondary
6. **Footer** that's a sitemap, not just legal links

## Register-specific anti-patterns

- ❌ Bento grid hero
- ❌ "Trusted by" logo strip in the first 600px
- ❌ Centered single-column everything
- ❌ Carousels (autoplaying or not)
- ❌ Hero with > 30 words of body copy
- ❌ Customer testimonials with stock-photo portraits
- ❌ Mid-page sticky popups offering newsletter signup
- ❌ Two equally-weighted CTAs ("Sign up FREE" + "Watch demo" side-by-side)
- ❌ Inter as the display face
- ❌ Default Tailwind shadow on every section divider

## Token starter (Committed strategy example)

```css
--bg:           oklch(0.97 0.008 60);         /* warm off-white */
--bg-deep:      oklch(0.20 0.04 40);          /* the committed brand color */
--fg:           oklch(0.18 0.01 60);
--fg-on-deep:   oklch(0.97 0.008 60);
--fg-muted:     oklch(0.50 0.012 60);
--border:       oklch(0.90 0.01 60);
--accent:       oklch(0.55 0.22 30);           /* terracotta accent */

--font-display: "Fraunces", "GT Sectra", Georgia, serif;
--font-body:    "Söhne", "ABC Diatype", system-ui, sans-serif;
--font-mono:    "Söhne Mono", "JetBrains Mono", monospace;

--display-1:    clamp(64px, 9vw, 128px);
--display-2:    clamp(48px, 6vw, 88px);
--display-3:    clamp(32px, 4vw, 56px);
```
