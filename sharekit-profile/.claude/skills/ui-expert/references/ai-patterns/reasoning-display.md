# Pattern: Reasoning / Thinking Display

Modern reasoning models (Claude extended thinking, OpenAI o1/o3, DeepSeek R1) surface internal reasoning before the final answer. The UI should display this transparently but keep it collapsed by default to avoid cluttering the conversation and burying the main response users wanted.

## What it is

A collapsible disclosure element showing the model's reasoning process. Users expand to inspect how the model arrived at its answer; reasoning is visually distinct from the final response and always starts collapsed for clean visual hierarchy.

---

## Anatomy

**Collapsed state** (default):
- Indicator line: `▶ Thought for 2.3 seconds` or `▶ Thinking...` with elapsed time updating in real-time
- Optional summary: "Considered 3 approaches, picked recursive solution" in small muted text
- Minimal visual footprint; eye goes to the answer

**Expanded state**:
- Arrow points down: `▼ Thought for 2.3 seconds`
- Reasoning in monospace font, muted color (60-70% opacity), italicized
- Paragraph breaks if reasoning >200 words; scrollable if exceeds viewport
- Visual separation from response (border, bg tint, or spacing)
- Copy-to-clipboard button

**Streaming state**:
- `▶ Thinking...` with elapsed time counter; tokens appear live if expanded
- Auto-collapse when reasoning ends

---

## Reference implementations

- **Claude.ai**: `▶ Thought for X seconds` below user message, collapsed by default, expands to gray italic monospace
- **ChatGPT (o1)**: `"Thought for X seconds"` pill above answer, expandable for full reasoning text
- **DeepSeek**: Reasoning block with toggle, summary line, monospace body
- **Perplexity**: Collapsed reasoning section before final answer, expandable

---

## Anti-patterns

- ❌ Auto-expand by default — clutters, buries the answer
- ❌ Hide reasoning entirely — loses transparency value
- ❌ Style identically to final answer — visual distinction required
- ❌ `"Thinking..."` with no timeout >3 seconds — feels broken
- ❌ Monolithic block >500 words — unreadable without paragraphs/bullets
- ❌ Show on every message — only when model actually used extended thinking

---

## Code skeleton

### HTML

```html
<details class="reasoning-toggle">
  <summary>
    <span class="icon">▶</span>
    <span class="label">Thought for <span class="time">1.2</span>s</span>
    <span class="summary">(Weighed 4 approaches)</span>
  </summary>
  <div class="reasoning-body">
    <p>First, I considered...</p>
    <p>However, this approach would...</p>
  </div>
  <button class="copy-btn">Copy thinking</button>
</details>
```

### CSS

```css
.reasoning-toggle {
  border: 1px solid oklch(0.85 0.008 270);
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
}
.reasoning-toggle summary {
  display: flex;
  gap: 8px;
  cursor: pointer;
  font-size: 12px;
  color: oklch(0.50 0.008 270);
}
.reasoning-toggle[open] .icon {
  transform: rotate(90deg);
}
.reasoning-body {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid oklch(0.85 0.008 270);
  font-family: monospace;
  font-size: 11px;
  line-height: 1.5;
  color: oklch(0.58 0.007 270);
  opacity: 0.8;
  font-style: italic;
  max-height: 300px;
  overflow-y: auto;
}
```

### React

```jsx
function ReasoningDisplay({ thinking, duration, expanded }) {
  if (!thinking) return null;
  return (
    <details className="reasoning-toggle" open={expanded}>
      <summary><span className="icon">▶</span> Thought for {duration.toFixed(1)}s</summary>
      <div className="reasoning-body">
        {thinking.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
      </div>
    </details>
  );
}
```

---

## Sources

- Anthropic extended thinking: https://www.anthropic.com/news/3-7-sonnet
- Anthropic API docs: https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking
- OpenAI o1 introduction: https://openai.com/index/introducing-openai-o1/
- DeepSeek API: https://api-docs.deepseek.com/
