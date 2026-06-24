# Things 3 (Cultured Code) — culturedcode.com/things

**The benchmark for calm productivity.** Things 3 (Apple Design Award winner 2017) teaches the art of generous whitespace paired with subtle delight. It proves that a single accent color (blue), careful breathing room, and intelligent defaults create both power and serenity. No fussy decoration; only surfaces that respect the user's time and attention.

## What this brand teaches

Consumer productivity apps do not need maximalist ornamentation to delight. Things 3's genius is restraint: white-on-white density that feels generous instead of cramped, micro-interactions (the magic checkbox fill) that reward tapping, and a single-blue palette that signals calm and trust without ever shouting. It's the platonic ideal of an Apple HIG application for the consumer market.

## Signature patterns

1. **The magic checkbox** — A 24px hollow circle that fills with blue and scales slightly on tap, with a fade-in checkmark. No bounce, minimal delay. The entire interaction takes 300ms and communicates completion without any sound or secondary feedback. This is the pattern that made Things 3 famous.

2. **Quick Entry (Cmd+space)** — A floating composer that drops in from the top edge, docked to a specific area of the screen. Accepts text, auto-parses time/date hints, and animates away on submit. No modal fullscreen; stays contextual to the current view.

3. **Filter-based navigation** — Rather than a rigid taxonomy tree, users see: Today / Upcoming / Anytime / Someday / Logbook. Each is a smart filter, not a folder. Drag-to-reschedule across any view. Simplicity through constraint, not through hiding complexity.

4. **Headings within projects** — A lightweight structure layer (not a rigid category system). Users can add headings to group related tasks, and they're styled subtly (small caps, semi-bold, 32% opacity text) so they guide without dominating the list.

5. **Drag-to-reschedule with calendar peek** — Drag any task and see a mini calendar appear. Release over a date to reschedule. No separate date-picker interface; the affordance is embedded in the drag gesture itself.

## Approximate visual tokens

```css
/* Things 3 aesthetic (from app screenshots) */
--bg:            oklch(0.98 0 0);              /* pure white, no warmth */
--bg-elevated:   oklch(0.985 0 0);             /* imperceptibly warmer */
--fg:            oklch(0.20 0.01 240);         /* warm dark grey, not pure black */
--fg-secondary:  oklch(0.65 0.01 240);

--accent:        oklch(0.50 0.20 260);         /* system blue, ~#3478f6 equivalent */
--success:       oklch(0.68 0.20 150);         /* green for completion */

--font-family:   -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
--font-size-body:       16px;
--font-size-headline:   20px;
--font-weight-headline: 600;

--spacing-xs:    4px;
--spacing-sm:    8px;
--spacing-md:    16px;
--spacing-lg:    24px;
--spacing-xl:    32px;

--radius:        8px;                          /* subtle, not aggressive */
--radius-pill:   999px;
```

## When to study this brand

**✅ Study Things 3 when**:
- Building a consumer productivity app (notes, tasks, planning, journaling)
- You want iOS/macOS aesthetic on web
- Your app rewards a single accent color (not multi-brand or multi-user color-coding)
- Your users want calmness + power, not visual playfulness
- Touch-first is important (the app is iOS-native; all gestures feel native)
- You need a reference for "delight without childish decoration"

**❌ Do not study Things 3 when**:
- Your product is data-dense (spreadsheets, dashboards, admin panels) — Things 3 optimizes for scanning task lists, not reading tables
- Your users are enterprise IT / B2B admins — its aesthetic signals consumer, not authority
- You need a multi-color palette (Things 3's restraint would feel monotonous for analytics or multi-team contexts)
- Your product competes on "power user" features — Things 3 hides options and defaults, which alienates advanced users who want visibility

## Anti-patterns NOT to copy

- ❌ **Monochrome + minimal to the point of hiding functionality** — Things 3 simplifies *intentionally*; copying the visual minimalism without the underlying smart defaults creates a broken product
- ❌ **Blue-on-white everywhere** — Things 3's restraint works because the entire OS (iOS) enforces it. On web, without platform support, a single-blue palette risks feeling limited. Introduce a *secondary* muted color (e.g., a warm grey) for status or metadata
- ❌ **Large touch targets without density** — Things 3 achieves generosity through whitespace, not oversized buttons. Copy the spacing, not by making buttons huge

## Sources

- https://culturedcode.com/things/
- https://culturedcode.com/things/blog/
- Apple Design Award 2017: https://developer.apple.com/design/awards/
- Apple HIG (reference anchor for Things 3's aesthetic foundation): https://developer.apple.com/design/human-interface-guidelines/
