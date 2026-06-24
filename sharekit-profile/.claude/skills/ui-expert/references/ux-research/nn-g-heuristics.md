# Nielsen Norman Group — 10 Usability Heuristics

## Why this matters

These ten heuristics, published by Nielsen and Molich in 1990 and refined in 1994, remain the bedrock of usability evaluation after 30+ years because they capture universal patterns in human-computer interaction. AI-generated UI frequently violates multiple heuristics simultaneously—trading clarity for assumed "elegance," ignoring user control for aggressive automation, or violating consistency to chase novelty. Understanding these principles makes slop obvious and recovery patterns actionable.

---

## The 10 Heuristics

### 1. Visibility of System Status

**Definition**: Design keeps users informed about what is happening through timely feedback.

**Common violation in AI-generated UI**: A "Processing..." spinner with no indication of progress for 15+ seconds, or a save operation that vanishes from view with no confirmation, leaving users uncertain whether the action succeeded.

**Recovery pattern**: Expose every state transition with status labels, progress indicators, or disable-state feedback. Use toast notifications for async operations; never hide completed actions.

---

### 2. Match Between System and the Real World

**Definition**: Design uses the user's language, words, and concepts familiar to them, following real-world conventions.

**Common violation in AI-generated UI**: A save button labeled "Persist State," a delete button labeled "Terminate Record," or a form field called "Payload Envelope" instead of "Message" or "Email Body."

**Recovery pattern**: Replace internal jargon with user-facing terminology. Test labels and action names against the actual audience; when in doubt, use the simplest, most literal phrasing.

---

### 3. User Control and Freedom

**Definition**: Users need a clearly marked emergency exit to leave unwanted actions without extended process.

**Common violation in AI-generated UI**: A multi-step wizard with no "Back" button; a dialog that dismisses only on "Confirm" with no "Cancel"; a deleted item that cannot be undone within 30 seconds.

**Recovery pattern**: Always offer undo, back buttons, or cancel actions. Make exits as visible as primary actions. Pair destructive operations with reversibility or explicit confirmation.

---

### 4. Consistency and Standards

**Definition**: Users should not wonder whether different words, situations, or actions mean the same thing; follow platform and industry conventions.

**Common violation in AI-generated UI**: A form where some buttons are rounded pills and others are sharp rectangles; icons used inconsistently for the same action across pages; a "Save" action that closes the page in one context but not another.

**Recovery pattern**: Establish a token set (button styles, icon usage, spacing) and enforce it across every screen. Reference platform conventions (Apple, Material, WCAG) as the baseline, not the exception.

---

### 5. Error Prevention

**Definition**: Good error messages matter, but the best designs prevent problems before they occur—eliminate error-prone conditions or present confirmation dialogs.

**Common violation in AI-generated UI**: A "Delete all items" button that triggers immediately without confirmation; a form submit that doesn't validate required fields until after submission; a critical action (publish, transfer funds) without a review step.

**Recovery pattern**: Validate inputs in-context (inline error messages). Gate destructive or irreversible actions with confirmation dialogs. Use disabled states to prevent invalid operations before the user attempts them.

---

### 6. Recognition Rather than Recall

**Definition**: Minimize memory load by making elements, actions, and options visible; the user should not have to remember information from one part of the interface to another.

**Common violation in AI-generated UI**: Hidden navigation requiring users to remember menu structure; form field labels that disappear when the user starts typing (placeholder-only labels); filter choices not displayed after selection.

**Recovery pattern**: Show all relevant options, selections, and context on every screen. Use persistent labels, chips for selected filters, and breadcrumbs for navigation state. Avoid forcing users to hold information in working memory.

---

### 7. Flexibility and Efficiency of Use

**Definition**: Shortcuts hidden from novice users speed up expert interactions; allow users to customize frequent actions.

**Common violation in AI-generated UI**: No keyboard shortcuts for common operations; a modal that forces mouse navigation when Cmd+K or Tab should work; no bulk-action options for repeated tasks.

**Recovery pattern**: Support keyboard navigation and shortcuts (Cmd+K, Cmd+/, Esc, arrows). Expose power-user features like batch operations or customizable toolbars without cluttering the default interface.

---

### 8. Aesthetic and Minimalist Design

**Definition**: Interfaces should not contain irrelevant or rarely needed information; every extra unit competes with relevant units and diminishes visibility.

**Common violation in AI-generated UI**: A header with 12 icons and three gradient overlays; lengthy explanatory text in every button; decorative animations that block interaction; a dashboard featuring unused metrics alongside critical KPIs.

**Recovery pattern**: Ruthlessly remove decorative elements that don't serve the user's primary goal. Prioritize content; secondary features go behind progressive disclosure (dropdowns, expandable panels). Test with real users to confirm every visual element earns its space.

---

### 9. Help Users Recognize, Diagnose, and Recover from Errors

**Definition**: Error messages should be in plain language, precisely indicate the problem, and constructively suggest a solution.

**Common violation in AI-generated UI**: "Error 422" with no explanation; "Invalid input" without stating which field or why; error text in light gray on white background (invisible).

**Recovery pattern**: Write error messages in plain language (e.g., "Password must be at least 12 characters"). Highlight the problematic field in context. Offer a concrete next step ("Resend code" button, "Update payment method" link). Use high-contrast color and icons.

---

### 10. Help and Documentation

**Definition**: Provide documentation to help users understand how to complete tasks; keep it concise and focused on user tasks, not system features.

**Common violation in AI-generated UI**: No help content at all; dense multi-page FAQs hidden three clicks deep; help text that explains the UI instead of user workflows.

**Recovery pattern**: Surface help in context (tooltips, "?" icons, popovers). Keep it task-focused and scannable. Link to detailed docs only for advanced workflows; provide just-in-time guides for critical paths.

---

## How to use this in practice

- **During Gate 1 (register lock)**: Check that the chosen register (e.g., `developer-tooling`, `consumer-saas`) naturally supports the interaction model you're building. Heuristic violations often indicate misalignment between the product's needs and the chosen register.

- **During Gate 2 (reference anchor)**: Cross-reference your chosen company anchor (Linear, Notion, Stripe) against heuristics 4 (consistency) and 8 (minimalism). Does the anchor demonstrate those principles consistently? If not, adjust your anchoring or create a hybrid pattern.

- **During Gate 4 (slop audit)**: Use this file as a checklist. For each heuristic, ask: "Did the AI violate this?" If yes, flag it and apply the recovery pattern. Heuristic violations are the most common form of AI slop.

- **When users report friction**: Map reported friction to a heuristic violation. "I can't undo that" → heuristic 3. "I don't know what that button does" → heuristic 2. Root-cause diagnosis accelerates fixes.

---

## Sources

- Nielsen Norman Group: https://www.nngroup.com/articles/ten-usability-heuristics/
- Nielsen, J., & Molich, R. (1990). Heuristic evaluation of user interfaces. *Proceedings of the SIGCHI Conference on Human Factors in Computing Systems*.
