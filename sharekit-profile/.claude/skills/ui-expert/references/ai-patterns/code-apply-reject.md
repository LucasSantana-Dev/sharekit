# Pattern: Code Apply/Reject Diff

## What it is

When an AI proposes a code change, the UI shows it as an inline diff with explicit "Apply" and "Reject" buttons—never auto-applies. The user sees the proposed change with line-by-line context before committing.

## Anatomy

**Card header**: file path and line range (e.g., "src/Button.tsx lines 42–58")

**Diff view**:
- Line numbers in left gutter
- Added lines: light green background (`--diffBlob.addition.bg`) with left border accent
- Removed lines: light red background (`--diffBlob.deletion.bg`) with strikethrough text (optional)
- Unchanged context lines: neutral gray background (`--diffBlob.neutral.bg`)
- Syntax highlighting matches the editor's theme

**Action row**: 
- "Apply" button (primary, accent color) — applies the change immediately
- "Reject" button (secondary, neutral) — dismisses without applying
- If multi-file change, "Apply All" button above individual hunks (allows granular per-file or per-hunk apply)

**States**:
- **Pending review** (default) — Apply/Reject visible, diff highlighted
- **Applied** — diff replaced with "Applied ✓ — Revert" link, card muted
- **Rejected** — card collapses or replaced with "Rejected — Restore" link
- **Conflict** — red banner if file has changed since proposal (e.g., "This file has been edited; the diff may not apply cleanly")

## Reference implementations

- **Cursor** (https://cursor.com/features) — code-first IDE with full diff preview before apply; "Apply All" for multi-file generations
- **Claude.ai project files** — applies diffs to uploaded files with explicit "Apply" step
- **GitHub Copilot Chat** — inline code suggestions with accept/reject in the suggestion itself
- **Bolt.new** (https://bolt.new) — generates full files with side-by-side diff preview
- **v0.dev** (https://v0.dev) — React component generation with apply/reject workflow
- **Continue.dev** (https://continue.dev) — IDE plugin with diff-based code edits

## Anti-patterns

- ❌ Auto-apply on Enter or any key press without explicit "Apply" button click
- ❌ Hide the diff before applying — user must SEE the change first
- ❌ Apply silently when user accepts without showing what changed
- ❌ Mix multiple file changes in one "Apply All" without per-file breakdown (confusing to undo one file)
- ❌ No "Reject" option — forces user to manually undo the change or revert the file
- ❌ Reject button less prominent than Apply (both actions equally discoverable)
- ❌ Forget to show file path or line range in the header (user loses context)
- ❌ Syntax highlighting does not match the editor's theme (jarring visual shift)

## Code skeleton

```html
<!-- Diff card structure -->
<div class="code-diff-card">
  <div class="diff-header">
    <span class="file-path">src/Button.tsx</span>
    <span class="line-range">lines 42–58</span>
  </div>
  
  <table class="diff-content">
    <tr class="line--unchanged">
      <td class="line-number">41</td>
      <td class="content">  return (</td>
    </tr>
    <tr class="line--removed">
      <td class="line-number">42</td>
      <td class="content"><span class="deleted">    {isLoading && <Spinner />}</span></td>
    </tr>
    <tr class="line--added">
      <td class="line-number">42</td>
      <td class="content"><span class="added">    {isLoading && <Spinner size="sm" />}</span></td>
    </tr>
    <tr class="line--unchanged">
      <td class="line-number">43</td>
      <td class="content">  );</td>
    </tr>
  </table>

  <div class="diff-actions">
    <button class="btn--primary" onclick="applyDiff()">Apply</button>
    <button class="btn--secondary" onclick="rejectDiff()">Reject</button>
  </div>
</div>
```

```css
.line--added {
  background-color: oklch(0.85 0.12 135); /* light green */
  border-left: 3px solid oklch(0.50 0.15 135);
}

.line--removed {
  background-color: oklch(0.92 0.11 10);  /* light red */
  border-left: 3px solid oklch(0.55 0.15 10);
  text-decoration: line-through;
}

.line--unchanged {
  background-color: oklch(0.88 0.02 260); /* neutral */
}

.deleted { color: oklch(0.35 0.15 10); }   /* red text */
.added   { color: oklch(0.35 0.15 135); }  /* green text */
```

```tsx
// React state machine
function CodeDiffCard({ file, hunk }) {
  const [state, setState] = useState("pending"); // pending | applying | applied | error
  
  const handleApply = async () => {
    setState("applying");
    try {
      await applyChange(file, hunk);
      setState("applied");
    } catch (e) {
      setState("error");
    }
  };

  if (state === "applied") {
    return <div>Applied ✓ <a onClick={revert}>Revert</a></div>;
  }

  return (
    <div>
      <DiffView lines={hunk} />
      <button onClick={handleApply} disabled={state === "applying"}>
        {state === "applying" ? "Applying…" : "Apply"}
      </button>
      <button onClick={() => setState("rejected")}>Reject</button>
    </div>
  );
}
```

## Sources

- https://cursor.com/features
- https://primer.style/foundations/color (diff token colors)
- https://docs.github.com/en/copilot/using-github-copilot/getting-started-with-github-copilot
- https://bolt.new/
- https://www.w3.org/WAI/ARIA/apg/patterns/button/
