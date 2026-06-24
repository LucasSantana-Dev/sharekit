# WCAG 2.2 Component-Relevant Success Criteria

## Why this checklist

WCAG 2.2 is the minimum accessibility floor for any component shipped to users. This checklist covers the 19 Success Criteria that directly impact component design and interaction; AA level covers most public-facing surfaces and is the legal standard in many jurisdictions. The criteria here are new in 2.2 where marked; all others carry forward from WCAG 2.1.

---

## The 19 component-relevant SCs

### 1.3.1 Info and Relationships [A]

**Rule**: Semantic structure, relationships, and meaning must be programmatically determinable from markup. Use native HTML elements and ARIA roles to encode meaning.

**Common failures**:
- Visual hierarchy with color or font alone, no semantic markup (heading-like divs)
- Form labels not associated with inputs (`<label for>` missing)
- Table data without `<th>` headers or `scope` attributes
- Lists styled as divs without `<ul>` or `<ol>`

**Verification**:
- axe-core detects missing labelledby, missing table headers
- Lighthouse a11y category flags semantic issues
- Inspect Elements → Accessibility Tree view in browser DevTools


### 1.3.5 Identify Input Purpose [AA]

**Rule**: Inputs for common user data (name, email, phone, address, payment info) must have `autocomplete` attributes so browsers and password managers can identify and autofill them.

**Common failures**:
- `<input type="email">` without `autocomplete="email"`
- Custom search inputs without `autocomplete="off"` (when intentional) or proper purpose declaration
- Name fields split into parts without `autocomplete="given-name"` / `autocomplete="family-name"`

**Verification**:
- Axe-core checks for autocomplete attributes on typical input types
- Manual: type in a field, verify browser autofill suggestions appear correctly
- Test on iOS/Android with native keyboard


### 1.4.3 Contrast (Minimum) [AA]

**Rule**: Text and meaningful UI must achieve minimum 4.5:1 contrast ratio against background; large text (≥18px or ≥14px bold) may use 3:1.

**Common failures**:
- Muted gray text (#666 on #fafafa) measuring <4.5:1
- Brand colors (purple, orange) over white without sufficient adjustment
- Placeholder text or disabled states not meeting 3:1 for large text

**Verification**:
- https://webaim.org/resources/contrastchecker/
- Chrome DevTools → Elements → Styles → color swatch
- axe-core / Lighthouse a11y section
- `npm i -D @adobe/leonardo-contrast-colors` for token generation


### 1.4.10 Reflow [AA]

**Rule**: Content must remain readable and usable when zoomed to 200% or when browser text size is increased. No fixed-width containers that cause horizontal scroll.

**Common failures**:
- Fixed-width sidebars; no responsive reflow at 200% zoom
- Absolute positioning preventing text zoom
- Sticky headers that don't reflow

**Verification**:
- Browser DevTools → zoom to 200%, test all breakpoints
- Browser text-size setting (Settings → Zoom), verify no horizontal scroll
- Mobile: pinch-zoom on iOS/Android


### 1.4.11 Non-text Contrast [AA]

**Rule**: UI components and meaningful graphics must have 3:1 contrast ratio between adjacent colors (excluding logos/flags).

**Common failures**:
- Buttons with only text color change, no outline or background contrast change
- Disabled state gray (<3:1 vs background)
- Icon-only buttons without sufficient contrast between icon color and background
- Focus indicators with insufficient contrast

**Verification**:
- webaim.org/resources/contrastchecker/
- axe-core's color-contrast checks
- Manual: screenshot and use eyedropper tools to measure


### 1.4.13 Content on Hover or Focus [AA]

**Rule**: Content revealed on hover or focus (tooltips, dropdowns, additional text) must be dismissible without moving mouse, readable without obscuring other content, and remain visible until dismissed or blur.

**Common failures**:
- Tooltip that disappears immediately on mouse move away
- Hover content covering the trigger element with no way to dismiss it
- Dropdown that only appears on hover (not keyboard focus)

**Verification**:
- Manual keyboard-only test: Tab to every control, verify hover/focus states appear and dismiss correctly
- Test on touch: hover states must have a programmatic equivalent (focus state, tap to expand)


### 2.1.1 Keyboard [A]

**Rule**: All functionality must be operable using keyboard alone (no mouse required).

**Common failures**:
- Button or link only clickable with mouse; no Tab or Enter support
- Drag-and-drop without keyboard alternative (e.g., cut/paste, arrow keys)
- Canvas drawing without keyboard input method

**Verification**:
- Manual keyboard-only test: unplug mouse, Tab/Enter/Arrow/Space through entire UI
- axe-core's keyboard-only checks
- Screen reader test: Tab into every control


### 2.1.2 No Keyboard Trap [A]

**Rule**: Keyboard focus must not become trapped in a subsection of content. User can always Tab out or use Escape to exit any region.

**Common failures**:
- Modal dialog without focus trap *implementation* (focus wraps; Escape closes)
- Web app embedded in an iframe that traps focus
- Keyboard nav that cycles forever without escape

**Verification**:
- Manual: Tab through entire interface; confirm you can reach every element and exit every region
- axe-core detects some trap patterns
- Test with screen readers (NVDA, JAWS, VoiceOver)


### 2.4.3 Focus Order [A]

**Rule**: Tab order must follow logical document flow or be deliberately managed via positive `tabindex`. No confusing jumps.

**Common failures**:
- Positive `tabindex` values (breaks natural order)
- Absolutely positioned elements that visually appear first but Tab order is last
- Dynamic content inserted out of DOM order

**Verification**:
- Manual: trace Tab key through the page; verify order is logical
- Browser DevTools: use Tab-order debugger (or watch the tab-indicator)
- axe-core checks for positive `tabindex` abuse


### 2.4.7 Focus Visible [AA]

**Rule**: Every focusable element must have a visible focus indicator (outline, ring, underline). Default browser outline is acceptable; custom `:focus-visible` is preferred over `:focus`.

**Common failures**:
- `outline: none` without a replacement focus style
- Focus visible removed with `*:focus { outline: 0; }`
- Focus indicator only visible in certain states or browsers

**Verification**:
- Manual: Tab through page, verify every focusable element has a visible ring/outline
- axe-core detects missing :focus styles
- Test in multiple browsers (Firefox, Chrome, Safari, Edge)


### 2.4.11 Focus Not Obscured (Minimum) [AA] (NEW in 2.2)

**Rule**: Focused elements must not be completely hidden by other content. At least part of the element or focus indicator must be visible. Sticky headers may partially obscure if the element remains operable.

**Common failures**:
- Sticky header covering entire focused input in a modal
- Focus indicator outside the viewport with no scroll-into-view
- Auto-scrolling that hides the focus indicator

**Verification**:
- Manual: Tab through page, verify focused elements are not completely obscured
- Test with sticky headers, modals, popovers
- Lighthouse a11y section (new check in 2.2)


### 2.5.7 Dragging Movements [AA] (NEW in 2.2)

**Rule**: Dragging must have a keyboard alternative. Drag-and-drop functionality must be operable via arrow keys or similar input method; single-pointer activation alternatives permitted.

**Common failures**:
- Drag-to-reorder list with no keyboard arrow-key alternative
- Drag-to-upload with no click-to-upload fallback
- Touch-drag without keyboard support (e.g., calendar range picker)

**Verification**:
- Manual: test drag interactions via keyboard (arrows, cut/paste, etc.)
- Verify pointer-down + move + up can be simulated with keyboard
- Test on screen readers (keyboard equivalent must be announced)


### 2.5.8 Target Size (Minimum) [AA] (NEW in 2.2)

**Rule**: Clickable targets must be at least 24×24 CSS pixels. Inline links and targets with ample spacing are exceptions.

**Common failures**:
- Small icon buttons (16×16) without padding
- Checkboxes or radio buttons smaller than 24×24 without increased touch target
- Buttons with visual size <24×24

**Verification**:
- DevTools → Inspect element, check computed width/height
- Manual: tap on mobile, verify comfort in clicking
- axe-core includes target-size checks (as of recent versions)
- `npm i -D axe-core`


### 3.2.6 Consistent Help [A] (NEW in 2.2)

**Rule**: Help mechanisms (contact, support, documentation links) must be in a consistent location and accessible from every page in a set of web pages.

**Common failures**:
- Help link on some pages but not others
- Support contact information changes location or format across pages
- Documentation link appears in different positions

**Verification**:
- Manual: browse multiple pages in the app, check that help/support location is consistent
- Verify help mechanisms are always reachable (e.g., in footer or header)


### 3.3.7 Redundant Entry [A] (NEW in 2.2)

**Rule**: Information previously entered by the user must not be re-requested unless required by law or security. Pre-fill or allow skipping of redundant fields.

**Common failures**:
- Multi-step checkout asking for address twice
- Form resets and re-asks for the same information
- Payment info requested again in a single session

**Verification**:
- Manual: fill a form, navigate away and back; verify fields retain values or are not re-requested
- Test multi-step flows for redundancy
- Review confirmation pages: pre-fill should show previously entered data


### 3.3.8 Accessible Authentication (Minimum) [AA] (NEW in 2.2)

**Rule**: Authentication must not rely on recognition of images or object identification alone. Passwords, SMS codes, biometric, or cognitive testing are acceptable; visual puzzles (CAPTCHAs) must have alternatives.

**Common failures**:
- Image recognition CAPTCHA without text alternative
- "Click the cat" puzzle without text-based fallback
- WebAuthn without a password fallback

**Verification**:
- Manual: attempt login; verify a non-visual authentication path exists
- Test CAPTCHA alternatives (text, audio, logic-based)
- Verify screen-reader announces authentication method


### 4.1.2 Name, Role, Value [A]

**Rule**: Every component must have a programmatically determinable name (label), role (what it is), and value (state). Use native HTML or ARIA.

**Common failures**:
- Icon button without `aria-label` or title
- Custom dropdown without `role="listbox"` and proper ARIA attributes
- Input without associated label or `aria-label`
- Slider without `role="slider"` and `aria-valuemin`, `aria-valuemax`, `aria-valuenow`

**Verification**:
- Browser DevTools → Accessibility Inspector, check Name / Role / Value fields
- axe-core detects missing names and roles
- Screen reader test: Verify component is announced correctly


### 4.1.3 Status Messages [AA]

**Rule**: Status messages (errors, confirmations, updates) must be programmatically associated with a container marked with `role="status"` or `aria-live="polite"` so screen readers announce them without requiring focus.

**Common failures**:
- Form validation error message not marked with `role="status"` or `aria-live`
- Toast notification that disappears before screen reader can announce it
- Status update in a `<div>` with no live-region role

**Verification**:
- Inspect element: verify parent has `role="status"` or `aria-live="polite"` / `aria-live="assertive"`
- Screen reader test (NVDA, JAWS, VoiceOver): alert/validation message must be announced
- axe-core checks for missing live regions on status updates

---

## Verification tooling

- **axe-core** — `npm i -D axe-core`; integrated in DevTools or via CLI
- **Lighthouse** — Chrome DevTools → Lighthouse → Accessibility category
- **WAVE** — https://wave.webaim.org/
- **Pa11y** — `npm i -D pa11y`; CLI tool for automated checks
- **Manual keyboard-only test** — unplug mouse or disable trackpad, Tab/Enter/Space through entire UI
- **Screen reader test** — NVDA (Windows), JAWS (Windows), VoiceOver (macOS/iOS), TalkBack (Android)
- **Contrast checker** — https://webaim.org/resources/contrastchecker/

---

## Sources

- https://www.w3.org/TR/WCAG22/
- https://www.w3.org/WAI/WCAG22/Understanding/
- https://www.w3.org/WAI/WCAG22/quickref/
