# Picking an anchor

A quick decision grid. Pick ONE primary anchor; you may layer a second for a specific component.

## Anchor types

**Design systems** (in `companies/`): published token specifications with formal design systems — Material 3, Polaris, Atlassian, Primer, Mantine, Spectrum 2, GOV.UK, Linear, Vercel, Stripe, Notion, Raycast, Apple HIG, Carbon IBM.

**Brand exemplars** (in `brands/`): outstanding UI/UX products without published token specs, studied as design inspiration — Arc, Notion Calendar, Things 3, Reflect, Superhuman, Airtable.

Both are valid anchors. Use a design system when you need token primitives and consistency at scale; use a brand exemplar when you need to solve a specific UX problem or capture an aesthetic.

## Decision tree

1. **Is it a marketing/landing page?** → see "Marketing" below.
2. **Is it an in-app surface?** → see "Product" below.
3. **Is the user a developer or technical buyer?** → lean **Vercel / Linear / Stripe**.
4. **Is the user a consumer / general professional?** → lean **Notion / Apple**.
5. **Is the product enterprise/ops/data-heavy?** → lean **Carbon / Linear**.
6. **Is it a command-driven or list-heavy surface?** → **Raycast** for sure.

## Marketing surfaces

| Surface | Primary anchor | Secondary option | Why |
|---|---|---|---|
| Landing page, technical product | Vercel | Linear | Geist grid + monochrome credibility; or Linear sidebar metaphor |
| Landing page, fintech/payments | Stripe | Spectrum 2 | Information density + trust signaling; or international RTL/LTR readiness |
| Landing page, consumer SaaS | Notion | Reflect | Warm minimal + serif personality; or distraction-free minimalism |
| Pricing page, B2B technical | Stripe | Polaris | Tier comparison patterns; or Shopify admin density |
| Pricing page, consumer | Notion | Arc | Soft cards, one emphasized tier; or sidebar-first layout |
| Docs site | Vercel | Material 3 | Geist + grid + code-as-content; or dynamic color + semantic tokens |
| Government/public service | GOV.UK | — | Content-first, plain language, accessibility at scale |
| Enterprise product marketing | Carbon | Polaris | Sharp corners + density + trust signaling; or admin UX familiarity |

## Product surfaces

| Surface | Primary anchor | Secondary option | Why |
|---|---|---|---|
| Dashboard, dev tool | Linear | Primer | Sidebar + command palette + dense pills; or code-aware UI |
| Dashboard, fintech | Stripe | Spectrum 2 | KPI cards + readable table + tabular nums; or international density |
| Dashboard, enterprise admin | Carbon | Polaris | Sharp corners + density + Plex; or admin-density tokens |
| Dashboard, data/analytics | Carbon + Linear | Mantine | Carbon table inside Linear shell; or component-first React theming |
| Settings panel | Apple HIG | Material 3 | Inline edit + section grouping; or semantic color elevation |
| Empty state | Notion (warm) or Reflect | Linear (terse) | Match parent register — warm/distraction-free vs. terse/professional |
| Modal / sheet | Apple HIG | Material 3 | Sheet, not modal; native materials; or tonal elevation |
| Form (simple) | Notion | Reflect | Inline edit, no save button; or keyboard-first UX |
| Form (complex) | Carbon | Polaris | Label-above + 40px height + 24px gap; or conversational errors |
| Form (gov/public) | GOV.UK | — | One thing per page, plain language, reading age 9 |
| Data table (dense) | Carbon | Material 3 | 32-40px rows, sharp, sticky header; or elevation via color, not shadow |
| Data table (readable) | Stripe | Spectrum 2 | 56px rows, tabular nums, slide-over detail; or expressive density |
| Data table (filtering) | Airtable | Linear | Multi-view switching (grid/calendar); or sidebar filter nav |
| Command palette | Raycast | Superhuman | Best-in-class anatomy; or keyboard shortcut hint overlay |
| Sidebar nav | Linear | Arc | 36px rows, hover tint, collapsible groups; or spaces + command bar |
| Toast / inline notification | Carbon | Material 3 | Left-edge colored bar + icon; or state-layer overlays |
| Onboarding flow | Notion (warm) or Reflect | Linear (terse) | Match parent register — warm/distraction-free vs. terse/professional |
| Calendar UI | Notion Calendar | Things 3 | Keyboard-first, quick-event-add; or touch-friendly breathing space |
| Note-taking | Reflect | Things 3 | Distraction-free, backlink graph, daily-note pattern; or hand-drawn delight |
| Task/project board | Linear | Airtable | Command-driven sidebar; or kanban + list views |

## When multiple anchors are correct

You can — and should — layer design-system anchors and borrow patterns from brand exemplars:

- "Linear sidebar + Stripe KPI cards + Carbon data table" is a valid blend for an analytics dashboard built for engineers.
- "Vercel marketing hero + Stripe code-as-content blocks + Notion serif callouts" is a valid blend for a developer tool's landing page that wants warmth.
- "Material 3 tokens + Superhuman command palette anatomy + Notion warm card styling" works for an AI chat surface.
- "Arc sidebar-first navigation + Airtable multi-view switching + Polaris error messages" works for a content-management product.

The constraint is **token coherence**. If you blend, the *tokens* must reconcile — pick one type family, one color system, one spacing scale for the whole page even if the patterns come from different sources.

**Brand exemplars as pattern libraries**: use brand exemplars (Arc, Notion Calendar, Things 3, Reflect, Superhuman, Airtable) to solve *specific component problems*, not as whole-page anchors. For example, "steal the command-bar anatomy from Superhuman but token it with Material 3 primitives."

## Anti-blends (don't do)

- ❌ Linear sidebar + Notion serif everything (cold/warm clash)
- ❌ Carbon sharp corners + Stripe gradient hero (industrial vs. fluid)
- ❌ Apple materials + Vercel grid (translucency vs. flat-Swiss)
- ❌ Raycast accent-tinting + Notion warm-greys (system-blue clashes with warm-grey)
- ❌ Material 3 tonal elevation + Carbon sharp corners (color-vs-shadow elevation model mismatch)
- ❌ GOV.UK plain-language forms + Stripe financial density (accessibility scope conflict)
- ❌ Polaris admin density + Things 3 breathing space (information density inverse)
- ❌ Arc sidebar-first + Linear command-palette-primary (navigation paradigm clash)
- ❌ Airtable multi-view + Superhuman keyboard-only (mouse vs. keyboard priority conflict)
