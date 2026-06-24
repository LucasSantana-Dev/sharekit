# Reflect (reflect.app)

The reference for **distraction-free note-taking with backlinks**, bridging Roam's knowledge-graph power and Things 3's polish. Teach daily-note patterns, calm typography, and the discipline of surfaces that get out of the way.

## What this brand teaches

Reflect is the anti-clutter notes app. It combines three powerful ideas:

1. **Daily-note loop as home**: Your today's date is the default entry point. You write, link to past notes, and the app suggests connections. No folder hunting.
2. **Backlink graph below the fold**: Write `[[note-title]]` and the app auto-collects references from other notes, surfaced in a "Linked references" panel. Serendipitous discovery without friction.
3. **Cmd+K everywhere**: Search, navigate, create, and execute any action via command palette. The surface recedes; the command layer is primary.

Aesthetically, it's Things 3 applied to notes — generous typography, breathing room, warm-tinted backgrounds (or pure dark mode), and voice notes with auto-transcription. The product is pro-calm.

## Signature patterns

### 1. Daily-note loop
- **Today** is always the home screen. When you open Reflect, you land on today's date-headed note.
- The daily note is pre-rendered as a container; you add text, links, and voice notes into it.
- Previous days remain in the sidebar or search; no friction to jump backward.
- **Teaching**: Use this if your product has a temporal or ritual element (journal, habit tracker, daily standup tool).

### 2. Backlink panel (auto-collected)
- Appears below the main note content.
- Header: "Linked references" with a count badge.
- Each reference is a preview card: source note title + 2-3 line excerpt.
- Clicking a card navigates to that note; no friction.
- **Teaching**: This pattern scales knowledge bases without requiring users to manually tag or categorize.

### 3. Cmd+K command palette (ubiquitous)
- Accessible from anywhere: typing `Cmd+K` opens a centered search/command modal.
- Sections: "Search" (fuzzy-match notes), "Create new note", "Jump to date", "Settings".
- First result is a pinned "Create daily note" if today's note doesn't exist yet.
- Results show icon + title + optional metadata (date, type).
- **Teaching**: Keyboard-first UX for power users; reduces clicks and context loss.

### 4. Side-by-side note views
- Click and hold a note reference → a second column opens on the right (like split-view in VS Code).
- Drag a note preview to open it in the right column permanently.
- Typing Cmd+] or Cmd+[ moves focus between panes.
- **Teaching**: Useful for writing products where users need to reference one note while editing another.

### 5. Voice notes with auto-transcription
- Microphone button in the note editor.
- Record → Reflect sends to an AI transcriber (probably Whisper-like) → inserts transcribed text inline.
- Transcribed note is editable; user can correct.
- **Teaching**: Lowers friction for capture (thinking aloud → text) without sacrificing searchability.

## Approximate visual tokens

```css
/* Warm-tinted light or dark mode */
--bg:          oklch(0.97 0.003 80);       /* Off-white, warm tint (light) or oklch(0.15 0.002 200) for dark */
--bg-elevated: oklch(0.99 0.002 80);       /* Cards, panels */
--fg:          oklch(0.25 0.008 80);       /* Warm dark, not black */
--fg-muted:    oklch(0.55 0.01 80);
--border:      oklch(0.94 0.005 80);       /* Subtle */
--accent:      oklch(0.52 0.12 30);        /* Warm brown or muted teal, context-dependent */

/* Typography */
/* Headlines: Serif (Domine, Source Serif, or Fraunces) */
/* Body: Sans (Inter acceptable, Söhne preferred) */
--font-headline: serif, weight 600, size 24-28px
--font-body:     sans, weight 400, size 16px, line-height 1.7
--font-mono:     monospace, size 14px               /* inline code */

/* Spacing: 8pt base; steps 4, 8, 12, 16, 24, 32 */
--gap-xs:        4px
--gap-sm:        8px
--gap-md:        16px
--gap-lg:        24px
--gap-xl:        32px

/* Radius: soft but not floofy */
--radius-sm:     3px
--radius-md:     6px
--radius-lg:     8px
```

## When to study this brand

✅ Note-taking and knowledge-management tools  
✅ Products with daily or temporal loops (habit trackers, journals, standup boards)  
✅ Calm-focus software (no notifications, no gamification)  
✅ Products built around atomic notes or thought fragments  
✅ Tools that benefit from backlinks or bidirectional references  
✅ Apps targeting writers, researchers, makers  

❌ Real-time collaboration tools (Reflect is single-user first)  
❌ High-density dashboards or data platforms  
❌ Synchronous communication (chat, video)  

## Anti-patterns NOT to copy

- **Don't copy the daily-note pattern if your product isn't temporal.** It only works if there's a natural "today" concept. Shoehorning it into a non-journal product feels forced.
- **Don't add backlinks to every product.** They're powerful in knowledge-graph contexts but add noise in transactional apps (e-commerce, CRM, accounting). Use them when notes/thoughts are primary.
- **Don't use voice transcription as the _only_ input method.** Transcription is best as a secondary capture channel, not a replacement for typing or pasting.
- **Don't hide the fact that it's using AI transcription.** Reflect is transparent. If it says "auto-transcribed" or shows a small "powered by Whisper" line, that builds trust.
- **Don't make Cmd+K _mandatory_ for basic actions.** Reflect still has a button bar for common actions. The palette is an accelerator for power users, not the only path.

## Sources

- **Reflect.app homepage and product design**: https://reflect.app/
- **Reflect founder (Alex MacCaw) essays**: Twitter/blog essays on product thinking, calm software, and backlink benefits (circa 2023–2025)
- **Cross-reference**: Notion brand anchor (long-form typography and warm minimal aesthetics)
- **Cross-reference**: Things 3 brand anchor (breathing space, hand-drawn delight without childish tone)
