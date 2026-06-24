# ARIA Anti-Patterns

## Why ARIA is harder than it looks

The first rule of ARIA: don't use ARIA. Use native HTML elements when they exist. Most ARIA mistakes come from adding attributes to already-correct native elements (e.g., `role="button"` on a `<button>`) or substituting ARIA attributes for actual keyboard behavior—ARIA announces intent to screen readers, but it does not create interactive behavior or keyboard support.

---

## The 10 anti-patterns

### 1. Redundant role on native element

**Why it's wrong**: Native HTML elements already have implicit semantics. Adding a redundant role attribute creates confusion for assistive technology and wastes maintenance effort.

**Wrong**:
```html
<button role="button">Click me</button>
<a role="link" href="/docs">Documentation</a>
<input type="checkbox" role="checkbox" />
```

**Right**:
```html
<button>Click me</button>
<a href="/docs">Documentation</a>
<input type="checkbox" />
```

**Verification**: axe-core rule `aria-allowed-role` flags redundant roles. Lighthouse a11y audit also catches these. Manual test: remove the role attribute; if the element still works, the role was redundant.

---

### 2. `aria-label` overriding visible text

**Why it's wrong**: Screen reader users lose the context of the visible label when `aria-label` differs from visible text. This creates a confusing mismatch where visual and non-visual experiences contradict each other.

**Wrong**:
```html
<button aria-label="Menu navigation">≡</button>
<a href="/home" aria-label="Go back to homepage">Home</a>
```

**Right**:
```html
<button aria-label="Toggle navigation menu">≡</button>
<a href="/home">Home</a>
```

**Verification**: axe-core rule `label-content-name-mismatch` flags visible text that differs substantially from `aria-label`. Manual test: enable a screen reader (VoiceOver on macOS, NVDA on Windows) and verify the announced text matches the visible text or provides appropriate context.

---

### 3. `role="alert"` for non-urgent updates

**Why it's wrong**: `role="alert"` forces screen readers to interrupt the user immediately with every update, breaking focus and workflow. Reserve it only for genuinely urgent messages (errors, timeouts, security warnings).

**Wrong**:
```html
<!-- Announcement every time a comment is added -->
<div role="alert" aria-live="assertive">
  New comment by @alice: "Great work!"
</div>

<!-- Form validation after typing -->
<div role="alert">Please enter a valid email address</div>
```

**Right**:
```html
<!-- Use aria-live="polite" for passive updates -->
<div aria-live="polite" aria-atomic="true">
  New comment by @alice: "Great work!"
</div>

<!-- Validation errors should be aria-describedby on the input -->
<input
  id="email"
  type="email"
  aria-describedby="email-error"
/>
<span id="email-error" class="error">
  Please enter a valid email address
</span>
```

**Verification**: axe-core rules `aria-live-direct-descendant` and `aria-required-children` help flag misuse. Manual test: enable a screen reader and verify alerts interrupt only for genuinely critical messages.

---

### 4. Missing `aria-modal="true"` on dialog

**Why it's wrong**: Screen readers do not know a dialog is modal without the attribute, so they allow users to tab out of the dialog to the page behind it, breaking the expected modal behavior.

**Wrong**:
```html
<div role="dialog" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Confirm action</h2>
  <p>Are you sure?</p>
  <button>Cancel</button>
  <button>Confirm</button>
</div>
```

**Right**:
```html
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Confirm action</h2>
  <p>Are you sure?</p>
  <button>Cancel</button>
  <button>Confirm</button>
</div>
```

**Verification**: axe-core rule `aria-modal-field` (WAI-ARIA 1.2 compliance). Manual test: keyboard-navigate to the dialog; verify Tab does not leave the dialog bounds, and Escape closes it. Use VoiceOver to confirm "modal" is announced.

---

### 5. `tabindex` > 0 (breaks natural focus order)

**Why it's wrong**: Positive `tabindex` values (1, 2, 3, etc.) override the natural DOM tab order and create an ad-hoc order that is hard to maintain and confusing for keyboard users. Only `tabindex="0"` and `tabindex="-1"` are safe.

**Wrong**:
```html
<button tabindex="2">Second in this order</button>
<input tabindex="1" />
<a href="/docs" tabindex="3">Third</a>
```

**Right**:
```html
<!-- Reorder in DOM if possible -->
<input />
<button>Second</button>
<a href="/docs">Third</a>

<!-- Or use tabindex="0" to include focusable elements in the natural order -->
<div role="group">
  <button tabindex="0">Button</button>
</div>
```

**Verification**: axe-core rule `tabindex` flags all positive `tabindex` values. Manual test: keyboard-navigate (Tab key) through the page; verify order follows DOM, left-to-right, top-to-bottom.

---

### 6. `aria-expanded` without `aria-controls` relationship

**Why it's wrong**: `aria-expanded` announces that something is expanded or collapsed, but without `aria-controls` (or a clear DOM relationship), the screen reader user does not know what is being expanded—rendering the announcement useless.

**Wrong**:
```html
<button aria-expanded="false">Show more</button>
<ul id="details" hidden>
  <li>Detail 1</li>
  <li>Detail 2</li>
</ul>
```

**Right**:
```html
<button aria-expanded="false" aria-controls="details">
  Show more
</button>
<ul id="details" hidden>
  <li>Detail 1</li>
  <li>Detail 2</li>
</ul>
```

**Verification**: axe-core rule `aria-required-attr` for `aria-expanded` elements. Manual test: use a screen reader to verify the button announces "Show more, collapsed, button" and that focusing the button reads "controls details list".

---

### 7. `aria-hidden="true"` on focusable elements

**Why it's wrong**: A focusable element (button, link, input) with `aria-hidden="true"` is hidden from screen readers but remains visible and reachable via keyboard. Users reach an invisible element and do not hear what it does.

**Wrong**:
```html
<button aria-hidden="true" onclick="doSomething()">
  Decorative button
</button>

<a href="/settings" aria-hidden="true" tabindex="0">
  Settings
</a>
```

**Right**:
```html
<!-- If it's truly decorative, remove aria-hidden and make it non-focusable -->
<span aria-hidden="true">❤</span>

<!-- If it's interactive, remove aria-hidden -->
<button onclick="doSomething()">Open menu</button>

<!-- Or use aria-label if the element is visual-only -->
<button aria-label="Add to favorites">
  <svg aria-hidden="true"><!-- icon --></svg>
</button>
```

**Verification**: axe-core rule `aria-hidden-focus` flags focusable elements with `aria-hidden="true"`. Manual test: Tab to the element; verify it is reachable and announced by screen reader.

---

### 8. Decorative SVG missing `aria-hidden="true"` and not focusable

**Why it's wrong**: Decorative SVGs are read as generic images by screen readers, polluting the accessibility tree with meaningless content. Interactive or linked SVGs must have a proper accessible name.

**Wrong**:
```html
<!-- Decorative SVG announced as "image" -->
<svg>
  <circle cx="50" cy="50" r="40" fill="blue" />
</svg>

<!-- Icon in a button with no label -->
<button>
  <svg>
    <path d="..." />
  </svg>
</button>
```

**Right**:
```html
<!-- Decorative SVG, hidden from screen readers -->
<svg aria-hidden="true">
  <circle cx="50" cy="50" r="40" fill="blue" />
</svg>

<!-- Icon in a button with accessible name -->
<button aria-label="Close dialog">
  <svg aria-hidden="true">
    <path d="..." />
  </svg>
</button>

<!-- Or use a title inside the SVG -->
<svg>
  <title>Favorite Star Icon</title>
  <path d="..." />
</svg>
```

**Verification**: axe-core rules `image-alt` (for meaningful SVGs) and `aria-hidden-focus` (for focusable decorative SVGs). Manual test: use a screen reader; verify decorative SVGs are not announced and interactive ones have clear names.

---

### 9. Custom controls without keyboard support (mouse-only `onClick`)

**Why it's wrong**: Users who cannot use a mouse (keyboard-only, voice control, switch devices) cannot operate the control. WCAG 2.1.1 (Keyboard) is the foundational requirement.

**Wrong**:
```html
<!-- Div with click handler, not keyboard-reachable -->
<div onclick="toggleMenu()">Menu</div>

<!-- Span that looks like a button but has no keyboard support -->
<span style="cursor: pointer" onclick="openDialog()">
  Open dialog
</span>
```

**Right**:
```html
<!-- Use a real button element -->
<button onclick="toggleMenu()">Menu</button>

<!-- Or add role, tabindex, and keyboard handlers -->
<div
  role="button"
  tabindex="0"
  onclick="openDialog()"
  onkeydown="if (event.key === 'Enter' || event.key === ' ') openDialog()"
>
  Open dialog
</div>
```

**Verification**: axe-core rule `button-name` for missing button labels; `WCAG 2.1.1 Keyboard` via Lighthouse a11y. Manual test: navigate with only the Tab key and arrow keys; verify every interactive element is reachable and operable.

---

### 10. Focus-visible state missing or styled identically to default

**Why it's wrong**: Keyboard users rely on a visible focus indicator to know where they are. If focus is invisible or indistinguishable from the default state, keyboard navigation becomes unusable.

**Wrong**:
```css
button {
  padding: 10px;
  border: none;
}

button:focus {
  /* No visible change */
}
```

```html
<!-- No focus outline -->
<input type="text" style="outline: none" />
```

**Right**:
```css
button {
  padding: 10px;
  border: 2px solid transparent;
  border-radius: 4px;
}

button:focus-visible {
  border-color: #0066cc;
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}
```

```html
<!-- Inherit default outline or add custom one -->
<input type="text" />

<!-- Or explicitly style focus-visible -->
<style>
  input:focus-visible {
    outline: 2px solid #0066cc;
    outline-offset: 2px;
  }
</style>
```

**Verification**: axe-core rule `focus-visible-handled` flags missing focus styles. Lighthouse a11y tests for visible focus. Manual test: navigate with Tab key; verify a clear, high-contrast ring appears on every focusable element.

---

## Tools to catch these

- **axe-core** — npm `@axe-core/react` or browser extension; catches redundant roles, missing labels, aria-hidden on focusable, tabindex > 0, missing aria-modal, aria-expanded without controls.
- **eslint-plugin-jsx-a11y** — npm `eslint-plugin-jsx-a11y`; static analysis for React; flags aria misuse, missing alt text, click handlers without keyboard support.
- **Lighthouse** — built-in to Chrome DevTools; a11y audit tab checks contrast, labels, focus visibility, and ARIA compliance.
- **Manual screen reader tests** — VoiceOver (macOS, iOS), NVDA (Windows, free), JAWS (Windows, paid). Spend 10 minutes navigating your UI with SR only; you'll find issues automated tools miss.

---

## Sources

- W3C "Using ARIA": https://www.w3.org/TR/using-aria/
- W3C WAI-ARIA Authoring Practices Guide (APG): https://www.w3.org/WAI/ARIA/apg/patterns/
- Deque axe-core Rules: https://dequeuniversity.com/rules/axe/
- Smashing Magazine "The Complete Guide to Accessible HTML": https://www.smashingmagazine.com/2021/03/complete-guide-html-accessibility/
