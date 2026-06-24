# Register: ai-first

LLM chat surfaces, agent consoles, model playgrounds, prompt builders, AI feature UI. New category as of 2024-2026. Few mature anchors; high slop risk.

## Audience expectations

- Has used ChatGPT, Claude, Cursor, Anthropic Console — knows the genre
- Knows what good AI UX feels like (streaming, retries, model picker, system prompt)
- Will paste long content and expect handling
- Notices when token counts, model info, or generation state are hidden
- Wants control: temperature, system prompt, model, tools

## Primary anchors

- **Anthropic Console** (console.anthropic.com) — the cleanest model-playground UX
- **OpenAI Playground** — model picker, parameters, system prompt structure
- **Cursor** — IDE-embedded AI affordances
- **Linear** — for the surrounding app shell if AI is a feature, not the product

## Mandatory rules

### Streaming responses
- Show tokens arriving in real-time, character-by-character or word-by-word
- Cursor / pulse indicator at the leading edge while streaming
- "Stop" button replaces "Send" while generating
- Streaming state visible: subtle indicator, NOT a spinner

### Conversation structure
- Clear role separation: user vs assistant vs tool/system
- User messages: right-aligned OR distinct bg tint OR clear avatar
- Assistant messages: full-width with markdown rendering
- Tool calls: visible but collapsed by default; "view details" expands
- System messages: small, muted, separated from main flow

### Model picker
- Always show which model is responding
- Switching mid-conversation acceptable but warn if context will change
- Display: model name + capability hint (e.g. "Sonnet 4.6 - balanced")

### Parameters
- Temperature, max tokens, system prompt — visible in a side panel or expanded view
- Default to sensible values; expose for power users
- Token count visible during composition (live update)

### Error handling
- Rate limit, context overflow, model unavailable — specific messages, not "Error"
- Retry button on failure
- Partial responses preserved on disconnection

### Content rendering
- Markdown: code blocks with syntax highlight + copy button
- Math: LaTeX renderable
- Tables: scrollable, not breaking layout
- Long content: collapsible or "Show more"
- Links: clickable, external indicator

### Copy & share
- Each assistant message has: copy, regenerate, share, thumbs-up/down (optional)
- Conversation export: markdown or JSON
- Shareable link (read-only) for long conversations

## Required components

1. **Chat input** with auto-grow textarea, attach button, send/stop
2. **Message bubble** for user and assistant with consistent anatomy
3. **Streaming indicator** (cursor or shimmer at the leading edge)
4. **Tool-call card** (collapsible, with input/output)
5. **Model picker** in conversation context
6. **System-prompt editor** for playground surfaces
7. **Token meter** somewhere visible
8. **Error state** for rate limits, timeouts, model issues
9. **Empty-conversation state** ("Try one of these prompts" or just an input)

## Register-specific anti-patterns

- ❌ Generic chat-bubble UI that looks like iMessage
- ❌ Avatars on every message (clutters; use role headers instead)
- ❌ Loading spinner while streaming (use cursor instead)
- ❌ Animated typewriter that's slower than the actual tokens
- ❌ "Thinking…" with no progress for > 3 seconds (show what's happening)
- ❌ Saturated brand colors throughout (let content lead; brand in chrome only)
- ❌ Modal for settings (use a sheet, slide-over, or sidebar panel)
- ❌ Hiding the model name to make it feel like "your assistant" (transparency wins)
- ❌ Decorative gradients in the chat area
- ❌ Showing every tool call by default (collapse, give option to expand)

## Token starter (Anthropic-Console-leaning)

```css
--bg:           oklch(0.99 0.003 60);
--bg-elevated:  oklch(0.97 0.005 60);
--bg-user:      oklch(0.94 0.01 60);           /* user message tint */
--fg:           oklch(0.18 0.01 60);
--fg-muted:     oklch(0.55 0.012 60);
--border:       oklch(0.92 0.008 60);
--accent:       oklch(0.50 0.16 30);            /* warm brand accent — Anthropic-esque */
--code-bg:      oklch(0.96 0.005 60);

--font-display: "Söhne", "Aeonik", system-ui, sans-serif;
--font-body:    "Söhne", system-ui, sans-serif;
--font-mono:    "Söhne Mono", "JetBrains Mono", monospace;

--cursor-color: oklch(0.50 0.16 30);             /* streaming cursor */
```
