# Pattern: System Prompt Editor

## What it is

Playgrounds and power-user AI surfaces expose the system prompt as editable text without modal takeover. The UI surfaces the prompt in a persistent, non-blocking panel with live token count and easy reset/save affordances. Designed for developers and researchers iterating on custom instructions.

## Anatomy

- **Collapsible side panel** (not modal — conversation remains visible at left during edit)
- **Monospace textarea** with auto-grow height, full text visibility
- **Live token count** in the corner (color-coded: green ≤70%, yellow 70-90%, red >90% of limit)
- **"Reset to default" button** (restores initial system prompt, shows confirmation modal)
- **"Save as preset" button** (opens preset library modal, allows naming and reusing saved prompts)
- **Preset library** (shows saved prompts with name + first-line preview, load/delete actions)
- **Optional: "/" slash-command shortcut** (e.g., typing `/system` in chat input opens the panel)
- **Collapsed state**: Small "System prompt" link or icon in chrome; expanded state shows full editor panel

## States

- **Collapsed** — header link/icon visible; no panel shown
- **Expanded** — side panel slides in from right or left edge; textarea focused, token count live
- **Editing** — textarea focused; keystroke-by-keystroke token count updating
- **Saved confirmation** — transient toast or inline message ("Saved as 'Code review assistant'")
- **Reset confirmation** — modal dialog: "Reset to default? Your changes will be lost." with Cancel/Confirm buttons

## Reference implementations

- **Anthropic Console** — system prompt above the playground input area; collapsible section; no preset library yet
- **OpenAI Playground** — system message in left panel; editable textarea; model dropdown above; preset library via "Templates"
- **Cursor IDE** — Settings → Custom Instructions; textarea with character count; no token count shown
- **Claude.ai Custom Instructions** — account-level settings; browser-native textarea; no live token visualization

## Anti-patterns

- **Modal for the prompt editor** — blocks conversation context; forces user to finish editing before returning to chat
- **No token count** — users don't know they're approaching the limit; hit ceiling unexpectedly
- **Single shared default** — every user starts with blank prompt; no sensible starter instructions
- **Opaque preset library** — "Load preset" without showing contents first; user must guess what each preset does
- **Auto-save without explicit save action** — browser tab close and the custom prompt is lost; no confirmation
- **Hidden model name** — users edit prompt for the wrong model without knowing

## Code skeleton

**HTML structure:**
```html
<aside aria-label="System prompt editor" data-state="expanded">
  <textarea class="system-prompt-editor" aria-label="System prompt text"></textarea>
  <div class="token-count" aria-live="polite">
    <span class="token-number">524</span> / 2000 tokens
  </div>
  <button id="reset-btn">Reset to default</button>
  <button id="save-btn">Save as preset</button>
  <details class="preset-library">
    <summary>Saved presets</summary>
    <ul role="list"><!-- Loaded presets --></ul>
  </details>
</aside>
```

**Essential CSS:**
```css
.system-prompt-editor {
  font-family: var(--font-mono);
  resize: none;
  border: 1px solid var(--border-color);
}

.token-count {
  font-size: 12px;
  color: var(--text-secondary);
}
```

**React state (pseudocode):**
Token count: debounced POST to `/api/tokens` endpoint with `{ prompt }` body. Save: open preset library modal with `{ prompt, name }` form. Reset: show confirmation modal before restoring `defaultPrompt`.

## Sources

- Anthropic Console: <https://console.anthropic.com>
- OpenAI Playground: <https://platform.openai.com/playground>
- Cursor IDE documentation: <https://docs.cursor.com/settings/cursor-tab>
- Anthropic prompt engineering: <https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering>
