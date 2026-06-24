# Pattern: Model Picker

Multi-model AI surfaces let users switch between different models mid-conversation. Transparency about which model is responding, clear capability hints, and explicit warnings on mid-conversation switches are non-negotiable.

---

## What it is

A UI element that displays the currently active model and allows users to switch to another model. The picker must always show which model is in use, explain what each model is good for, persist the selection per-conversation, and warn if switching might lose context.

---

## Anatomy

**Trigger in header/chrome**:
- Button showing current model: `<button aria-expanded aria-controls="model-menu">Claude Opus 4.7 — best for complex tasks</button>`
- Icon indicator (chevron or dropdown arrow)
- Capability hint inline or in hover tooltip

**Dropdown menu**:
- `<ul role="listbox">` containing one `<li role="option">` per model
- Each option shows: model name + 1-line capability description (e.g., "Sonnet — balanced speed and reasoning")
- One option marked with a `role="option" aria-selected="true"` + visual "current" indicator (checkmark or filled bg)
- Optional recommended/default badge on one option (usually the highest-capability or best-value tier)
- Keyboard navigation: arrow up/down to move focus, Enter to select, Escape to close

**Per-conversation persistence**:
- Selected model persists across messages in that conversation
- Starting a new conversation resets to the default/recommended model

**Mid-conversation switch warning**:
- When user selects a different model from the dropdown, a dismissible warning toast or inline banner appears
- Message: "Switching to <new-model> — context will be preserved" OR "May shift output style" if capability tier changes significantly
- Include a brief grace period (show toast for 5-6s, or until user clicks dismiss)

---

## Reference implementations

- **Anthropic Console** (<https://console.anthropic.com>) — model dropdown with capability tier label in the header
- **Claude.ai** (<https://claude.ai>) — model picker in the top-right or in settings, shows current + lists available
- **OpenAI Playground** (<https://platform.openai.com/playground>) — model selector on the right panel with usage info
- **Cursor IDE** (<https://www.cursor.com>) — per-chat model selection, persisted per conversation

---

## States

| State | Visual | Interaction |
|-------|--------|-------------|
| **Default (closed)** | Button showing current model name + hint, closed chevron | Click to open menu |
| **Open (menu visible)** | Dropdown menu displayed, chevron rotated, all options visible | Arrow keys to navigate, Enter to select, Esc to close |
| **Switching (brief loading state)** | Selected option briefly shows a spinner or checkmark, menu closes | Context preserved; no interruption to user |
| **Warning banner** | Toast or inline banner: "Switching to <model> — context preserved" | Auto-dismiss after 5s or on click |

---

## Anti-patterns

1. **Hidden model name to feel "magical"** — Never. Users need to know which model is responding. Transparency always wins.
2. **No capability hint** — Cryptic model names ("davinci", "sonnet", "gpt-4o") are useless. Add one sentence: "best for reasoning" or "fastest".
3. **No per-conversation persistence** — Resetting the model choice every message is frustrating. Store it in the conversation state.
4. **No warning on mid-conversation switch** — If the user switches to a weaker model mid-flow, they should be told it might affect output.
5. **Multi-step selection** — Don't hide the picker behind settings or a "more options" menu. Use a single dropdown in the main chrome.
6. **Avatar-per-message instead of model indicator** — Don't clutter by changing avatars when the model changes. Keep the model name visible in one place.

---

## Code skeleton

**HTML**:
```html
<div class="model-picker">
  <button
    aria-expanded="false"
    aria-controls="model-menu"
    aria-label="Switch model (Cmd+.)"
    class="model-button"
  >
    <span class="model-name">Claude Opus 4.7</span>
    <span class="model-hint">best for complex</span>
    <svg aria-hidden="true" class="chevron">...</svg>
  </button>

  <ul
    id="model-menu"
    role="listbox"
    class="model-menu"
    hidden
  >
    <li role="option" aria-selected="true" class="model-option current">
      <span class="option-name">Claude Opus 4.7</span>
      <span class="option-hint">best for complex reasoning</span>
      <span class="badge">recommended</span>
    </li>
    <li role="option" aria-selected="false" class="model-option">
      <span class="option-name">Claude Sonnet</span>
      <span class="option-hint">balanced speed and capability</span>
    </li>
  </ul>
</div>
```

**CSS**: Flex layout for button, absolute positioning for menu. Option rows use `flex-direction: column` to stack name + hint. Current option gets `background: var(--surface-container-highest)`.

**React**: Track `currentModel`, `isOpen`, `warning`. On select, update model, show warning toast (auto-dismiss 5s), close menu.

---

## Sources

- <https://console.anthropic.com>
- <https://platform.openai.com/playground>
- <https://www.cursor.com>
- <https://claude.ai>
