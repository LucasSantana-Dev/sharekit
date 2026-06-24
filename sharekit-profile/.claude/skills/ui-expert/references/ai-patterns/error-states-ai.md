# Pattern: AI Error States

## What it is

AI surfaces surface failure modes absent from traditional apps: rate limits with reset times, context window overflow requiring truncation or new sessions, model unavailability with fallback options, network disconnection mid-stream, content policy refusals, and tool-call failures mid-conversation. Each demands specific messaging, recovery actions, and preserved user state.

## The 6 AI-specific errors

### 1. Rate limit hit
Show reset time exactly: "Limit reset in 47 minutes." Link to upgrade. Preserve partial response. Disable send with "Upgrade to continue."

### 2. Context window overflow
Show "Conversation too long." Offer: (a) "Summarize and start new chat", (b) "Truncate older messages" — user chooses, never silent truncate.

### 3. Model unavailable
Show "Claude Opus unavailable." Fallback: "Try Sonnet instead?" Preserve typed input. Preserve input field contents always.

### 4. Network disconnection during stream
Show "Connection lost — partial response saved." Action: "Retry from here" (skips received tokens, merges results). Timestamp: "Lost at 14:23." Never lose typed prompt.

### 5. Content policy refusal
Show refusal text exactly. Suggest: "Try: [1-2 rephrasings]." No generic "violates policy." User rephrases and resubmits.

### 6. Tool-call failure
Surface in tool-use card (not modal). Red border. Inline: "API returned 403: Unauthorized." Action: "Edit and retry" — user modifies prompt without losing conversation.

## Reference implementations

- **Anthropic Console**: Rate limit messaging with reset time (https://console.anthropic.com)
- **Claude.ai**: Context overflow with "Start new chat" action; network disconnect with "Retry"; streaming stops cleanly (https://claude.ai)
- **OpenAI Playground**: Model unavailability with fallback picker (https://platform.openai.com/playground)
- **GitHub Copilot Chat**: Policy refusal with suggested rewrites
- **Cursor IDE**: Tool-call failure surfaced inline in code-generation card

## Anti-patterns

- Bare "Error" message with no specifics — **specific > generic**.
- Silent retry without telling user they're waiting — users think app froze.
- Losing typed input on any error — **always preserve user input**.
- Dismissing error without offering recovery path — users feel stuck.
- Blocking modal for recoverable errors — use inline banner + toast instead.
- "An error occurred" in logs but not shown to user — surface the actual error.
- Hiding refusal reason behind "Can't help" — transparency builds trust.

## Code skeleton

```html
<div role="alert" class="error-banner error-banner--rate-limit">
  <div class="error-banner__message">
    Limit reset in 47 minutes. <a href="/pricing">Upgrade</a>
  </div>
  <button class="error-banner__close" aria-label="Dismiss">×</button>
</div>

<div class="tool-card tool-card--error">
  <span class="tool-card__label">fetch_data()</span>
  <span class="tool-card__status--error">Error</span>
  <div class="error-message">API 403: Check API key.</div>
  <button>Edit and retry</button>
</div>
```

CSS:

```css
.error-banner {
  display: flex; padding: 12px 16px;
  border-left: 4px solid var(--color-warning);
  background: var(--bg-warning);
}
.error-banner--context-overflow { border-left-color: var(--color-info); }
.error-banner--model-unavailable { border-left-color: var(--color-error); }
.tool-card--error { border: 2px solid var(--color-error); }
.tool-card__error-message { color: var(--text-error); }
```

React map:

```jsx
const errorMap = {
  RATE_LIMIT: { msg: "Limit reset in N min", actions: ["Upgrade"] },
  CONTEXT_OVERFLOW: { msg: "Chat too long", actions: ["Summarize", "Truncate"] },
  MODEL_UNAVAIL: { msg: "Unavailable", actions: ["Switch model"] },
  NETWORK_LOST: { msg: "Partial saved", actions: ["Retry"], preserve: true },
  POLICY_REFUSAL: { msg: refusalText, examples: [...], preserve: true },
  TOOL_ERROR: { msg: errorMsg, surface: "inline", preserve: true },
};
```

## Sources

- https://docs.anthropic.com/en/api/errors (Anthropic API error codes and rate limits)
- https://platform.openai.com/docs/guides/error-codes (OpenAI error reference)
- https://www.anthropic.com/usage-policy (Content policy guidance)
- WAI-ARIA Alert Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/alert/ (screen reader announce semantics)
