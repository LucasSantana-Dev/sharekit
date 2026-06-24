# Superhuman (superhuman.com)

The reference for **power-user email and productivity tools** that prioritize speed and keyboard mastery. If the surface is a tool for professionals who measure productivity in seconds-per-action and treat the keyboard as the primary interface, Superhuman is the canonical anchor.

## What this brand teaches

Superhuman proved that email—widely considered a chore—could become a power-user tool through three design principles:

1. **Keyboard-first everywhere**: Every action (archive, reply, schedule, snooze) has a single-key shortcut. The keyboard-shortcut overlay (Cmd+K) surfaces all commands with categories and mnemonics.
2. **Zero-state inbox as aspirational goal**: The product celebrates inbox zero as a state worth reaching, with achievement-tier illustrations and subtle positional messaging. This reframes email from "endless burden" to "completable task."
3. **Speed is visible**: Feedback on every action is instant (no spinners). Snippets, smart reply suggestions, and template expansion all execute with zero perceptible lag.

Superhuman targets high-velocity professionals (executives, investors, analysts) who process 100+ emails/day and refuse to sacrifice efficiency for visual polish.

## Signature patterns

### Keyboard shortcut overlay (Cmd+K or Cmd+/)

A floating panel that surfaces **all keyboard shortcuts categorized by action type**:

```
Composition | Navigation | Triage | Collaboration
————————————————————————————————————————————————
a → Assign   ↑ / j → Next    d → Delete      x → Share
r → Reply    ↓ / k → Prev    e → Archive     c → Comment
rf → Reply all ←  → Go back   m → Mark unread @ → Mention
ff → Forward Tab → Expand     s → Snooze
—— → Draft    Esc → Close     l → Label
```

- Panel width: 480–560px
- 16px padding, monospace labels
- Never auto-closes on selection; user must press Esc or click outside
- Four-column grid (categories determined by usage)
- No search within overlay — it's a reference, not a command palette

### Zero-state inbox illustration

When inbox count reaches 0:

```
🎉 Inbox Zero
—————————————
You have processed all your messages.
Take a moment to celebrate.
```

- Full-screen or card-sized depending on context
- Subtle gradient background (not garish)
- Celebration tone without gamification (one illustration, no point badges)
- Primary action links to "Compose" or "Schedule task"
- Does NOT auto-hide after N seconds (stays until user navigates away)

### Split-pane layout (list + reading pane)

```
[List 240px]  [Divider]  [Reading pane 1fr]
————————————  ————————  —————————————————
Inbox (12)                
  [row 1]     ───────   From: Chris...
  [row 2]                Subject: Q2 planning
  [row 3]                Body...
  [row ...]               
```

- List: 32–36px row height, compact metadata (sender, time, snippet, 1–2 label pills)
- Divider: 1px, draggable; persists width preference
- Reading pane: 14px body font, generous line-height (1.6+), max-width 680px
- Hover on list row: subtle bg-shift, right-aligned quick actions appear (reply, archive, snooze icons)

### Snippets and templates surface

Accessible via Cmd+1–9 or / prefix in compose:

```
/meeting → [inserts scheduled-meeting template]
/thanks  → [inserts thank-you template with tone options]
/1-1     → [inserts 1:1 meeting request template]
```

- Shown inline as the user types
- Selection via arrow keys or number
- No modal — expands inline in the compose box
- Templates can include variable slots: `[RECIPIENT_NAME]`, `[DATE]` (auto-filled from context)

### Smart reply / AI suggestions

Appears as a row of 2–3 gray pill buttons below the compose box:

```
[Suggest time] [Confirm receipt] [Add context]
```

- Non-intrusive color (muted gray, not primary)
- One-click to insert; user can edit before sending
- Never auto-applies
- Disappears when user starts typing their own response

## Approximate visual tokens

```css
/* Superhuman uses a proprietary sans-serif but the structure is:
   [estimate from product observation] */

--font-family:     "SuperSans" or system sans fallback (not Inter)
--font-mono:       "Courier New" or system mono for IDs and code blocks

--bg:              oklch(0.10 0.008 280);   /* dark navy, not pure black */
--bg-elevated:     oklch(0.15 0.008 280);   /* cards, list rows on hover */
--bg-hover:        oklch(0.12 0.008 280);   /* subtle shift, no animation */

--fg:              oklch(0.95 0.005 0);     /* off-white */
--fg-muted:        oklch(0.65 0.008 0);     /* secondary text */
--fg-subtle:       oklch(0.50 0.008 0);     /* timestamps, hints */

--accent-primary:  oklch(0.55 0.18 260);    /* Superhuman's signature purple */
--accent-success:  oklch(0.60 0.15 130);    /* green for archive/complete */
--accent-warning:  oklch(0.70 0.12 50);     /* orange for snooze/defer */

--border:          oklch(0.22 0.008 280);   /* subtle separation */

--radius-sm:       4px   /* pill buttons, tight UI */
--radius-md:       6px   /* cards, modals */

/* Motion: speed matters */
--duration-instant: 0ms      /* keyboard shortcuts, instant feedback */
--duration-fast:    80ms     /* hover states, list transitions */
--duration-normal:  160ms    /* panel slides, expand animations */

--letter-spacing:  -0.01em  /* tight, professional */
--line-height:     1.5      /* body text; generous in reading pane */
```

## When to study this brand

**✅ Study Superhuman when:**
- The product is **email, messaging, or inbox-style tools** (Slack, Discord mods, customer support queues)
- **Keyboard shortcuts are a primary value** — users will memorize 20+ shortcuts
- The audience is **high-velocity professionals** or power users who measure productivity in seconds/action
- **Speed and feedback are primary design values** (no 300ms waits, no load states)
- The product has a **goal-state** that users aspire to (inbox zero, all TODOs resolved, all messages triaged)
- **Density and compactness** are required — more data per row, less whitespace

**❌ Don't study Superhuman for:**
- Consumer-facing, first-time-user products (go to Notion or Arc instead)
- Surfaces where discovery matters more than speed (onboarding, marketing, educational)
- Products without a clear "power user" audience or goal state
- Any tool where mouse/touch is the primary input (mobile-first apps)

## Anti-patterns NOT to copy

- ❌ **Keyboard-shortcut overlay if you have <15 shortcuts**: Superhuman's overlay works because the product has 100+ discoverable actions. If your product has 5 shortcuts, bury them in a simple help menu instead.
- ❌ **Achievement celebration if your product isn't goal-shaped**: Zero-inbox only resonates because email is inherently triageable. Don't copy the "you did it!" pattern for open-ended tools (writing apps, design tools, databases).
- ❌ **Purple accent if it doesn't match your brand**: Superhuman's purple is iconic to Superhuman. Don't copy the hue; find your own.
- ❌ **Density without affordance**: Superhuman's 32px rows work because every action is keyboard-accessible. If your UI requires mouse hovering to discover actions, loosen the density.
- ❌ **Speed theater without actual speed**: Superhuman's "instant" feedback is real (network latency is hidden). Don't add fake instant feedback on slow operations (spinners masked as buttons, skeleton screens where data is loading).

## Sources

- https://superhuman.com/ — product marketing, zero-state celebration messaging
- https://superhuman.com/shortcuts — keyboard-shortcut reference (official)
- Superhuman founding interviews (Rauch & Vohra) — positioning around speed and keyboard-first design
