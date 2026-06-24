# Pattern: Artifact Panel

## What it is

When AI produces a substantial standalone output (rendered preview, code, document, image), the UI slides in a panel from the right edge — preserving the conversation at left while displaying the artifact. Fixed at 40-50% width on desktop, full-width on mobile. User can read what they asked while viewing the output.

## Anatomy

**Visual structure:**
- Slide-over panel fixed to right edge (`position: fixed; right: 0`)
- Width 40-50% desktop (typically 45%), 100% mobile
- Header bar with artifact title + close button (× or arrow)
- Tab row ("Preview" / "Code" / "Versions") for multi-view artifacts
- Body fills remaining space, scrollable independently from chat
- Resize handle on left edge (optional; drag to adjust width)
- Conversation remains visible and scrollable at left

**States:**
- **Closed** — panel off-screen (`transform: translateX(100%)`), chat full-width
- **Open** — slides in from right with 200ms ease-out transition
- **Editing** — content updates as AI streams; body scrolls to top on substantial change (optional)
- **Versioned** — dropdown to select previous versions of artifact
- **Full-screen** — Cmd+\ or button to expand panel to full-screen (user cancels to return)

**Interactions:**
- Close: ✕ button OR Esc key
- Open in new tab: icon button (opens artifact URL in browser tab)
- Copy: icon button (copies artifact content to clipboard)
- Download: icon button (downloads as .html/.json/.txt depending on type)
- Resize (if handle present): drag left edge to adjust width

## Reference implementations

- **Claude.ai Artifacts** — https://claude.ai (canonical example; slides from right, preserves chat context)
- **ChatGPT Canvas** — https://chatgpt.com (Canvas mode; side panel with preview + code tabs)
- **v0.dev** — https://v0.dev (preview panel; component code + rendered output)
- **Bolt.new** — https://bolt.new (editor + preview; real-time updates)
- **Replit Agent** — https://replit.com (agent output in side panel; code + execution)

## Anti-patterns

- ❌ **Modal overlay instead of side-panel** — full-screen modal loses conversation context; user can't re-read what they asked while viewing output
- ❌ **Forcing full-screen takeover** — removes ability to compare artifact with request side-by-side
- ❌ **No version history** — artifact evolves through conversation; should be able to see prior versions
- ❌ **Close-button-only dismissal** — power users expect Esc key to work; always support both
- ❌ **Auto-scroll within artifact on every update** — jarring and disorienting during streaming; let user control scroll
- ❌ **Tabs that don't preserve scroll position** — switching Preview ↔ Code shouldn't reset vertical scroll
- ❌ **Panel narrower than 33% or wider than 60%** — too narrow: content unreadable; too wide: chat becomes marginal

## Code skeleton

```html
<!-- HTML structure -->
<aside class="artifact-panel" 
       data-open="true" 
       aria-label="Code artifact: React Button component">
  <header class="artifact-panel__header">
    <h2 class="artifact-panel__title">React Button component</h2>
    <div class="artifact-panel__actions">
      <button aria-label="Open in new tab" class="icon-btn">⧉</button>
      <button aria-label="Copy to clipboard" class="icon-btn">⎘</button>
      <button aria-label="Download" class="icon-btn">↓</button>
      <button aria-label="Close panel" class="icon-btn">✕</button>
    </div>
  </header>
  
  <nav class="artifact-panel__tabs">
    <button class="tab" data-tab="preview">Preview</button>
    <button class="tab active" data-tab="code">Code</button>
    <button class="tab" data-tab="versions">Versions</button>
  </nav>
  
  <div class="artifact-panel__body">
    <!-- Tab content fills here, scrollable -->
    <div class="tab-pane active" id="code-pane">
      <pre><code>/* Artifact content */</code></pre>
    </div>
  </div>
  
  <!-- Optional: left-edge resize handle -->
  <div class="artifact-panel__resize-handle"></div>
</aside>

<!-- CSS snippet (critical properties) -->
<style>
.artifact-panel {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 45%;
  background: var(--bg-panel);
  border-left: 1px solid var(--border);
  transform: translateX(100%);
  transition: transform 200ms ease-out;
  display: flex;
  flex-direction: column;
  z-index: 100;
}

.artifact-panel[data-open="true"] {
  transform: translateX(0);
}

.artifact-panel__body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem;
}

/* Mobile: full-width */
@media (max-width: 768px) {
  .artifact-panel {
    width: 100%;
  }
}
</style>

<!-- React state machine shape -->
const [panel, setPanel] = useState({
  open: false,
  type: 'code', // or 'preview', 'document'
  content: '',
  versions: [],
  currentVersionIdx: 0,
  activeTab: 'preview'
});

const handleEsc = (e) => {
  if (e.key === 'Escape' && panel.open) {
    setPanel(p => ({ ...p, open: false }));
  }
};

useEffect(() => {
  window.addEventListener('keydown', handleEsc);
  return () => window.removeEventListener('keydown', handleEsc);
}, [panel.open]);
```

## Sources

- Anthropic Artifacts announcement: https://www.anthropic.com/news/artifacts
- OpenAI Canvas intro: https://openai.com/index/introducing-canvas/
- v0.dev UI reference: https://v0.dev/
- Bolt.new architecture: https://bolt.new/
