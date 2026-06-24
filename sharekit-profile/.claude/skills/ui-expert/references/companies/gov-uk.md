# GOV.UK Design System (design-system.service.gov.uk)

The reference for **government and public-sector services**, evidence-based form design, and accessibility-at-scale. GOV.UK prioritizes content over chrome, clarity over decoration, and evidence over taste.

## Aesthetic identity

- **Tone**: plain language, task-focused, no jargon, one-thing-per-page, designed by researchers not designers.
- **One-sentence physical scene**: "Pensioner filing tax return on a 6-year-old Android tablet over coffee, needs text large enough without glasses, no time to learn new paradigms."

## Concrete tokens

### Color (extremely limited palette)

```css
--govuk-black:      #0b0c0c;      /* foreground */
--govuk-blue:       #1d70b8;      /* links, secondary action */
--govuk-green:      #00703c;      /* primary button, success */
--govuk-red:        #d4351c;      /* error, warning */
--govuk-light-grey: #f3f2f1;      /* alt bg, light surfaces */
--govuk-grey-1:     #b1b4b6;      /* secondary text */
--govuk-grey-2:     #626a6e;      /* secondary text darker */
--govuk-grey-3:     #505a5f;      /* supporting text */
--govuk-grey-4:     #383f45;      /* borders, dividers */
--white:            #ffffff;
```

All contrast ratios ≥4.5:1 at AA; many reach AAA.

### Typography

- **Font**: GDS Transport (custom Helvetica-derived OpenType). Fallback chain: `system-ui, Arial, sans-serif`.
- **Weights**: 400 (regular), 700 (bold). No thinness, no weight variance.
- **Scale** (px, not rem — **yes, this is intentional**):
  - Heading XL: 48px / 700 / leading 1.1
  - Heading L: 36px / 700 / leading 1.1
  - Heading M: 24px / 700 / leading 1.15
  - Heading S: 19px / 700 / leading 1.2
  - Body: 19px / 400 / leading 1.5 — **baseline readability for non-tech users**
  - Caption: 16px / 400
- **Maximum readability target: reading age 9**; test every content change against this.

### Spacing (px scale, no fractional units)

- Grid: 5px base
- Used steps: 5, 10, 15, 20, 30, 40, 50, 60px
- Form field bottom margin: 20px
- Section gap: 30-50px
- Page padding: 30-40px

### Radius

- **0px everywhere** — square corners are deliberate. Professional, no-nonsense, accessible to visual-recognition-impaired users.

### Motion

- **Duration**: 200ms (transitions), no spring or bounce
- **Curve**: `ease-out`
- **Use sparingly**: focus ring outline appears instantly; state changes fade over 200ms

## Signature components

### Phase banner (alpha / beta / retired)

```
- Position: full-width banner, top-left corner
- Background: govuk-light-grey
- Content: "ALPHA" or "BETA" label (20px, bold), supporting text
- No close button; persistent to signal service maturity
```

### Error summary (validation failure)

```
- Appears at top of form after submission fails
- Red govuk-red left border (4px)
- Heading: "There is a problem" (24px)
- Bulleted list of field errors, each a link to the field
- Focus set to summary heading on appear
- Keyboard shortcut Alt+E to focus summary
```

### Inset text

```
- Light grey govuk-light-grey background
- Left border accent govuk-blue (4px)
- 20px padding
- Body font, 19px
- Used for legal disclaimers, definitions, warnings
```

### Buttons

```
- Primary action: govuk-green background, white text, 44px min height, 24px padding
- Secondary: govuk-blue outline (2px), white background, same dimensions
- Never shadow; never gradient
- Focus ring: 3px black outline, 1px offset
```

### Text input

```
- Minimum width: 30 characters visible (depends on font; aim for ~300px)
- Height: 40px
- Padding: 5px left/right, centered text
- Border: 2px govuk-grey-4
- Label above input, 19px, bold
- Hint text below label in govuk-grey-3, 16px
```

## Anti-patterns in GOV.UK's world

- ❌ Decorative shadows or elevation effects
- ❌ Rounded corners (use 0px)
- ❌ Color variation for visual interest — every color serves accessibility or semantic purpose
- ❌ Form fields inline or floating-label style (labels always **above**, 19px)
- ❌ Auto-advance/validation before user submits (proof of concept only)
- ❌ Anything requiring scrolling a form horizontally
- ❌ Three or more form fields on a single page without "one thing per page" justification
- ❌ Jargon or acronyms without definition (content audit as quality gate)
- ❌ Skip the skip link or focus management

## When to anchor here

✅ Government, public sector, tax, benefits, permits, licenses
✅ Accessibility-critical surfaces (medical, legal, civic)
✅ Forms aimed at non-technical audiences or multiple age groups
✅ Any service where trust and clarity outweigh brand expression
✅ Regulatory or compliance-heavy products

❌ High-fidelity consumer marketing (too minimal)
❌ Real-time collaboration or gaming (designed for deliberate interaction)
❌ B2C SaaS where brand personality is a differentiator

## Sources

- https://design-system.service.gov.uk/styles/typography/
- https://design-system.service.gov.uk/styles/colour/
- https://design-system.service.gov.uk/components/
- https://design-system.service.gov.uk/styles/page-template/
- https://www.gov.uk/service-manual/design
- https://www.gov.uk/service-manual/user-research/running-research-sessions-with-people-with-access-needs
