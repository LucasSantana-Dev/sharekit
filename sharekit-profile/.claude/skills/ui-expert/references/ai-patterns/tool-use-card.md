# Pattern: Tool-Use Card

## What it is

When an AI calls a tool (function call, code execution, web fetch, or external API), the UI surfaces the call as a discrete card in the conversation flow — visible but collapsed by default, expandable for input/output detail. The card displays the tool name and arguments inline, with visual status indicators (running, success, error) and optional duration metadata.

## Anatomy

**Collapsed state (default)**:
- Collapse/expand chevron `▶` (right-pointing)
- Tool name (bold, monospace, e.g., `search_code()`, `file_upload()`)
- Short argument preview in parentheses (e.g., `"query=lighthouse-audit"`)
- Inline status pill with background color (running: amber shimmer, success: green, error: red)

**Expanded state**:
- Same header, chevron now `▼` (downward-pointing)
- **Input JSON** — pretty-printed, with collapsible sections for long payloads; "Copy" button on the code block
- **Output preview** — truncated to ~200 chars by default, inline "Expand" link if longer; JSON or plain text depending on return type
- **Status and timing** — "Completed in 342ms" or "Failed after 1.2s"
- **Error details** (if failed) — red background, error message and stack trace (if available) in monospace font; "Copy error" button

**Optional sections**:
- "Retry" button if the call failed
- "Copy output" button for successful results
- Duration timestamp (e.g., "2:15 PM") right-aligned in header

**States**:
- **pending** — chevron faded, amber spinner inside the status pill, label text muted
- **success** — green checkmark in pill, normal text weight
- **error** — red border around card, red pill, bold error message inline
- **expanded** — card grows height smoothly, sections stack vertically

## Reference implementations

- **Claude.ai** (claude.ai) — tool calls collapsed by default in the message stream, expand to show input/output JSON
- **Anthropic Console** (console.anthropic.com) — function-call playground with collapsible request/response panels
- **Cursor IDE** (cursor.com) — file-edit cards appear inline with diff preview, "Apply"/"Reject" actions
- **GitHub Copilot Chat** — terminal-command cards show the command and output; user can dismiss
- **Continue.dev** — inline code-execution cards with preview + edit + apply flow

## Anti-patterns

- **Auto-expand by default** — clutters the chat; users want a scannable flow first, details second.
- **Auto-scroll user to bottom on every tool call** — disruptive; let the user control scroll position.
- **Hide the tool name** — opacity / abbreviation / no-label approach. Transparency wins; users want to know what the AI is calling.
- **Inconsistent error display** — sometimes a toast, sometimes inline, sometimes a modal. Use the SAME card pattern for errors; just change the pill color and add error state.
- **No status indicator** — user cannot tell if a tool call is still running, succeeded, or failed without expanding.
- **Separate UI for each tool type** — file uploads look different from web fetches. Unified card anatomy across all tool types.

## Code skeleton

**HTML structure** (`<details>` native collapse):

```html
<div class="tool-card" data-state="success">
  <details>
    <summary>
      <span class="chevron">▶</span>
      <code class="tool-name">search_code()</code>
      <span class="args">query="lighthouse"</span>
      <span class="pill pill--success">✓</span>
      <time>2:15 PM</time>
    </summary>
    <div class="tool-card__body">
      <section><h4>Input</h4><pre>{JSON input}</pre></section>
      <section><h4>Output</h4><pre>{result}</pre></section>
    </div>
  </details>
</div>
```

**CSS essentials** (animate, status pills):

```css
.tool-card { border: 1px solid var(--border); border-radius: 8px; margin: 8px 0; }
.tool-card[data-state="error"] { border-color: oklch(0.60 0.15 25); }
.chevron { transition: transform 200ms ease; }
details[open] .chevron { transform: rotate(90deg); }
.pill--running { background: oklch(0.85 0.08 40); } /* amber */
.pill--success { background: oklch(0.85 0.08 130); } /* green */
.pill--error { background: oklch(0.85 0.15 25); } /* red */
.tool-card__body { border-top: 1px solid var(--border); padding: 12px 16px; }
```

## Sources

- Anthropic API Tool Use: https://docs.anthropic.com/en/docs/build-with-claude/tool-use
- OpenAI Function Calling: https://platform.openai.com/docs/guides/function-calling
- Cursor Documentation: https://docs.cursor.com/
- WAI-ARIA: Disclosure Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
