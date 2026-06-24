# Focus Management

Focus is the spatial coordinate of the keyboard user — the element that receives keyboard input right now. Breaking focus management breaks the entire UX for screen reader users and power users alike. When focus gets lost, disappears, or cycles unpredictably, keyboard navigation becomes impossible and AT users are stranded.

## Why focus management matters

Focus is not a visual concern — it's a cognitive and operational one. A sighted mouse user doesn't think about focus at all; they click where they want to go. A keyboard user (whether using the Tab key, arrow keys, voice control, or a switch device) **relies entirely on focus** to know where they are and what will happen when they press a key. When focus vanishes after an action, when focus traps you in a dialog you can't escape, or when focus jumps to an unexpected location (like reloading the page on form submission), you've broken the contract. The AT user has no fallback — they can't just grab the mouse. For sighted power users (developers, designers) who live in the keyboard, the same rules apply: consistent, predictable focus behavior is not optional.

## Focus trap (when to use)

**Use a focus trap when opening a modal, dialog, or sheet.** A focus trap ensures that Tab and Shift+Tab cycle within the open overlay, preventing the user from tabbing into the background content (which is still there visually but should not be interactive). Without a focus trap:
- Tab from the close button → jumps behind the dialog into the background
- User is now navigating in the invisible, unreachable content
- User has no way to know what happened or how to get back

**Required behavior for a focus trap:**
- Tab from the last focusable element → wraps to first focusable element
- Shift+Tab from the first focusable element → wraps to last focusable element
- Pressing Escape closes the dialog (always provide this escape hatch)

**Implementation options:**

1. **Library route** — Use `focus-trap` npm package or React Aria's `<FocusScope>`:
   ```jsx
   import { FocusScope } from 'react-aria';
   
   <FocusScope contain>
     <dialog open>
       <h2>Confirm action</h2>
       <button>Cancel</button>
       <button>Delete</button>
     </dialog>
   </FocusScope>
   ```
   Or with native `<dialog>` + `showModal()`:
   ```js
   const dialog = document.querySelector('dialog');
   dialog.showModal(); // Built-in focus trap
   ```

2. **Manual outline** (if libraries aren't available):
   - Track all focusable elements inside the dialog: `querySelectorAll('[tabindex], button, input, select, textarea, a[href], area[href], [contenteditable]')`
   - On keydown Tab: if currentFocus === lastElement, focus firstElement
   - On keydown Shift+Tab: if currentFocus === firstElement, focus lastElement
   - On keydown Escape: call dialog.close() or your dismiss handler

**Common mistake:** Using `tabindex="0"` on non-focusable elements or `tabindex > 0` to "fix" focus order. This breaks the DOM order and confuses AT. Never use `tabindex > 0`; stick to DOM order or `tabindex="-1"` for programmatic focus.

## Focus restore (when to use)

**Use focus restore when dismissing a dialog, after an action completes (like submitting a form), or after deleting an item from a list.** When focus vanishes from the viewport, the keyboard user becomes lost. The standard pattern:

1. **Store the trigger element** before opening the dialog:
   ```js
   const triggerButton = document.activeElement;
   dialog.showModal();
   ```

2. **Restore focus when dismissing:**
   ```js
   dialog.addEventListener('close', () => {
     triggerButton.focus(); // Restore
   });
   ```

3. **Fallback gracefully** — the trigger element may have disappeared (deleted from the list, page unloaded, etc.):
   ```js
   dialog.addEventListener('close', () => {
     if (triggerButton && document.contains(triggerButton)) {
       triggerButton.focus();
     } else {
       // Fall back to a sensible parent (main heading, page title)
       document.querySelector('h1')?.focus();
     }
   });
   ```

**After an action completes** (form submission, item creation):
- If staying on the same page: focus a confirmation message, the new item, or back to the form
- If navigating away: don't restore — let the new page set focus to its main content (usually `h1`)
- If in-page confirmation (toast/banner): move focus to the confirmation element so AT users hear it

## `inert` attribute

**The modern way to make background content non-interactive when a dialog is open.** Before `inert`, developers used the combo of `aria-hidden="true"` + manually disabling tabindex + hiding from pointer events. Now you can use a single attribute:

```html
<div inert>
  <!-- Everything inside: not focusable, not interactive, skipped by screen readers -->
  <button>This is invisible to AT</button>
  <a href="#">Pressing Tab skips this</a>
</div>

<dialog open>
  <h2>Modal dialog</h2>
  <button>Close</button>
</dialog>
```

**What `inert` does:**
- Removes all elements inside from the focus order (Tab skips them)
- Removes them from the accessibility tree (screen readers skip them)
- Prevents pointer events from reaching them
- Is inherited by children (marking a parent inerts all descendants)

**Browser support (as of 2026):**
- Chrome/Edge: 102+
- Firefox: 112+
- Safari: 15.5+

**For older browsers:** Use the `inert` polyfill from WICG: `npm i inert`. It patches `HTMLElement.prototype` to implement the behavior.

**Do NOT combine** `inert` with `aria-hidden="true"` — `inert` is sufficient. Using both is redundant and can confuse AT.

## `:focus-visible` vs `:focus`

This is the single most important CSS distinction for modern keyboard UX. Understanding it separates accessible from broken focus rings.

**`:focus`** applies when an element receives focus **by any means** (click, Tab, programmatic `.focus()`). It's always on.

**`:focus-visible`** applies when an element receives focus **via keyboard navigation or other non-pointer input.** It does NOT apply when the user clicks with the mouse (because a mouse click already shows where you are).

**Why this matters:** Most people use the mouse most of the time. If you style both `:focus` and `:focus-visible` the same way, every mouse click shows a thick ring around the button — visual noise for the 90% using a mouse, and essential information for the 10% using a keyboard.

**The modern pattern:**
```css
/* Show the focus ring only for keyboard users */
button:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* Do NOT use ':focus' or 'outline: none' without a replacement */
/* Never do this: button:focus { outline: none; } ← BREAKS KEYBOARD UX
```

**Fallback for older browsers** (IE 11, older Safari):
```css
button:focus {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

button:focus:not(:focus-visible) {
  outline: none; /* Hide ring on mouse click in browsers that support :focus-visible */
}
```

This way, older browsers that don't understand `:focus-visible` still get a focus ring (safe fallback), and newer browsers respect the intent (keyboard-only ring).

## Focus rings

A focus ring is the visual indicator of keyboard focus — usually an outline or border. Good focus rings have these properties:

**Contrast:** At least 3:1 ratio between the ring and adjacent colors (WCAG 1.4.11 + 2.4.7). Common failure: light gray ring on white background.

**Width:** At least 2px. Common failure: 1px ring that's too fine to see on smaller screens.

**Offset:** At least 2px outline-offset to separate the ring from the element. This prevents the ring from blending visually with the element itself.

**Example of a good focus ring:**
```css
button:focus-visible {
  outline: 3px solid #0066cc;     /* 3px for visibility */
  outline-offset: 2px;             /* Breathing room */
  border-radius: 4px;              /* Round corners if the button is rounded */
}
```

**Contrast tools:**
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Adobe Leonardo: `npm i -D @adobe/leonardo-contrast-colors` (programmatic color scaling)

**Avoid these:**
- `outline: 2px dotted` (looks "broken" in browser defaults — if you must use it, pick an explicit color)
- `box-shadow: 0 0 0 3px rgba(...)` without testing on various backgrounds
- Removing the outline entirely (outline: none) — this is a critical failure; replace it with something, never remove it

## Code patterns

### React Aria FocusScope (library approach)

```jsx
import { FocusScope } from 'react-aria';
import { useState } from 'react';

function ConfirmDialog({ isOpen, onDismiss }) {
  const [triggerRef, setTriggerRef] = useState(null);

  return (
    <>
      <button ref={setTriggerRef} onClick={() => setOpen(true)}>
        Delete item
      </button>

      {isOpen && (
        <FocusScope contain restoreFocus>
          <div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <h2 id="dialog-title">Confirm deletion</h2>
            <button onClick={onDismiss}>Cancel</button>
            <button onClick={onDismiss}>Delete</button>
          </div>
        </FocusScope>
      )}
    </>
  );
}
```

The `contain` prop traps focus; the `restoreFocus` prop automatically restores focus when the scope unmounts.

### Native HTML5 dialog with showModal()

```html
<button onclick="document.getElementById('confirm').showModal()">
  Delete item
</button>

<dialog id="confirm">
  <h2>Confirm deletion</h2>
  <form method="dialog">
    <button type="submit" value="cancel">Cancel</button>
    <button type="submit" value="confirm">Delete</button>
  </form>
</dialog>

<script>
  const dialog = document.getElementById('confirm');
  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'confirm') {
      // Handle deletion
    }
  });
</script>
```

Built-in focus trap + focus restore + Escape handling.

### CSS focus-visible block (no framework)

```css
/* Base focus behavior (keyboard-only) */
button:focus-visible,
input:focus-visible,
a:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* Fallback for browsers without :focus-visible */
button:focus,
input:focus,
a:focus {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* Remove outline on mouse click (modern browsers only) */
button:focus:not(:focus-visible),
input:focus:not(:focus-visible),
a:focus:not(:focus-visible) {
  outline: none;
}
```

## Common bugs

**Bug 1: Focus loss on route change**

When the user navigates to a new page via a link or form submission, focus stays on the old element (which no longer exists). The keyboard user is now in a void.

**Fix:** After navigation, focus the main page heading:
```js
// In your router or page component
useEffect(() => {
  const main = document.querySelector('main') || document.querySelector('h1');
  if (main) {
    main.tabIndex = -1; // Make it focusable programmatically
    main.focus();
    main.tabIndex = -1; // Restore to normal
  }
}, [location]);
```

**Bug 2: Focus restore fails because element disappeared**

You stored a reference to the delete button, but the dialog was for deleting that item, so the button no longer exists when you try to restore.

**Fix:** Fall back to a parent landmark:
```js
function restore(preferredElement) {
  if (preferredElement && document.contains(preferredElement)) {
    preferredElement.focus();
  } else {
    // Fall back to main content
    const fallback = document.querySelector('main')
      || document.querySelector('h1')
      || document.body;
    fallback.focus();
  }
}
```

**Bug 3: Focus rings styled away**

Designer says "the focus ring looks ugly, remove it." You do: `button:focus { outline: none; }`. Now keyboard users can't see where they are.

**Fix:** Designers and engineers: never remove focus indicators without replacing them. Swap for a custom ring:
```css
button:focus-visible {
  outline: none; /* Remove browser default */
  background: #e6f2ff; /* Subtle background highlight instead */
  box-shadow: inset 0 0 0 2px #0066cc; /* Custom inset border */
}
```

## Sources

- https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible
- https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert
- https://react-spectrum.adobe.com/react-aria/FocusScope.html
- https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html
- https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- https://webaim.org/articles/keyboard/
