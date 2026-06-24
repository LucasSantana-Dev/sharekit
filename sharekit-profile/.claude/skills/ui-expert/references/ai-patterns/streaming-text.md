# Pattern: Streaming Text

## What it is

AI responses arrive token-by-token from the model; the UI should reveal them at network speed (typically 20–50 tokens/sec) with a visible cursor at the leading edge. The user sees content materialize in real time rather than waiting for a complete response.

## Anatomy

### Visual elements
- **Streaming cursor** — block (`▍`) or thin pulse animation at the leading edge of the text
- **Fixed-position text container** — grows downward without shifting previous lines (no layout shift on long text)
- **Stop button** — replaces Send button during streaming; immediately halts generation
- **Completion indicator** — cursor disappears and Send button returns when response finishes

### States
1. **Idle** — Send button visible, no cursor, text container ready for next message
2. **Streaming** — Stop button visible, cursor blinking at leading edge, tokens appear character by character
3. **Complete** — cursor removed, content locked, Send button returns, user can interact with the response (copy, regenerate, etc.)
4. **Error** — partial content preserved (never deleted mid-stream), Stop button replaced with Retry, error message below the partial text

### Interactions
- **Tab key** — no auto-focus away from the input during streaming
- **Escape** — optional; if supported, stops streaming (equivalent to Stop button)
- **Scroll** — does NOT auto-scroll on each token (user reads at their own pace; only auto-scroll to cursor if user scrolled away and new tokens arrive)
- **Copy during streaming** — copies only what's arrived so far

## Reference implementations

- **Anthropic Console** — https://console.anthropic.com (best-in-class streaming UX: clean cursor, no jank)
- **Claude.ai** — https://claude.ai (conversational context + streaming)
- **OpenAI Playground** — https://platform.openai.com/playground (model parameter + streaming preview)
- **Cursor IDE** — https://cursor.com (embedded code generation streaming)

## Anti-patterns

- **Spinner instead of streaming cursor** — animated spinner implies loading, not generation. The cursor IS the indicator; no spinner needed.
- **Fake typewriter slower than tokens** — if tokens arrive at 30/sec but the UI reveals them at 10/sec, it feels artificially delayed.
- **Auto-scroll on every token** — breaks user reading. Scroll only if cursor is off-screen and new tokens arrive.
- **Layout shift on long lines** — text container must reserve space; use `min-height` or `overflow-anchor: auto` to prevent jank.
- **Hiding token count during stream** — show live token count (e.g., "42 tokens so far") so users see progress.
- **Cursor without contrast** — cursor must be visible against the text color; use a contrasting color or thicker weight if needed.
- **Removing partial content on error** — always preserve what streamed before the error; let user copy or retry from there.

## Code skeleton

### CSS for streaming cursor

```css
.streaming-cursor::after {
  content: "▍";
  animation: blink 1s infinite;
  margin-left: 0.1em;
  color: var(--cursor-color, oklch(0.50 0.16 30));
  font-weight: 600;
}

@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0.5; }
}
```

### React pseudocode

```javascript
export function StreamingChat() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentResponse, setCurrentResponse] = useState("");

  async function handleSend(userMessage) {
    setIsStreaming(true);
    setCurrentResponse("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      const stream = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [...messages, { role: "user", content: userMessage }] }),
      });

      const reader = stream.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setCurrentResponse(prev => prev + chunk);
      }

      // Finalize response in message history
      setMessages(prev => [...prev, { role: "assistant", content: currentResponse }]);
      setCurrentResponse("");
    } catch (error) {
      // Preserve partial response; show error + retry button
      setCurrentResponse(prev => prev + `\n\n[Error: ${error.message}]`);
    } finally {
      setIsStreaming(false);
    }
  }

  function handleStop() {
    setIsStreaming(false);
    // Finalize partial response
    setMessages(prev => [...prev, { role: "assistant", content: currentResponse }]);
    setCurrentResponse("");
  }

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message message-${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {currentResponse && (
          <div className="message message-assistant">
            <span className="streaming-cursor">{currentResponse}</span>
          </div>
        )}
      </div>
      <div className="input-area">
        <textarea placeholder="Type your message…" />
        <button onClick={() => handleSend(...)} disabled={isStreaming}>
          {isStreaming ? "Stop" : "Send"}
        </button>
      </div>
    </div>
  );
}
```

## Sources

- https://docs.anthropic.com/en/api/streaming
- https://platform.openai.com/docs/api-reference/streaming
- https://www.anthropic.com/research
- Web.dev: Interaction to Next Paint (INP) — <https://web.dev/articles/inp>
