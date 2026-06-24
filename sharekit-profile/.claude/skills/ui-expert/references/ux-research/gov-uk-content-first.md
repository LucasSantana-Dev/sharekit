# GOV.UK — Content-First Methodology

## Why this matters

GOV.UK pioneered a fundamental shift in public-sector digital design: start with user needs and written content, then design the interface *to support* that content — never the reverse. This "content-first" principle emerged from decades of research with diverse, often non-technical audiences filing taxes, applying for benefits, or renewing licenses. The insight applies far beyond government: any service where clarity, accessibility, and completion rates matter (healthcare, legal, financial, education) benefits from this methodology.

## The 10 design principles

GOV.UK's published 10 principles (from https://www.gov.uk/guidance/government-design-principles):

1. **Start with user needs** — Research and understand what users are actually trying to do; the service exists to meet their need, not the organisation's need to publish.
2. **Do less** — Do not build what people can do without; government should get out of the way.
3. **Design with data** — Measure, observe, and test with real users; never rely on opinion or assumption.
4. **Do the hard work to make it simple** — Simplicity is the result of ruthless editing and iteration, not laziness.
5. **Iterate. Then iterate again.** — Release a minimum viable service, measure, improve, repeat. Perfectionism delays delivery.
6. **This is for everyone** — Accessibility is not a feature; it is the default. Support users with disabilities, older devices, low bandwidth, low literacy.
7. **Understand context** — A form on desktop ≠ the same form on mobile. Test in the user's actual environment.
8. **Build digital services, not websites** — A service has a transaction, a goal, a completion state. A website is passive.
9. **Be consistent, not uniform** — Reuse patterns and language across the service; but do not apply a pattern where context demands a different approach.
10. **Make things open: it makes things better** — Publish code, design decisions, and research findings; invite scrutiny and contribution.

## One thing per page (forms)

GOV.UK's most controversial but research-backed pattern: each logical question or task occupies its own page.

**Why:**
- Reduces cognitive load; users focus on one decision at a time.
- Each page has a single heading, single button action, single error state.
- Mobile-first: a full multi-field form becomes nine mobile screens; nine single-field pages feel the same.
- Completion rates improve measurably (GDS data: ~7% higher submission rates than multi-field equivalents).
- Keyboard and screen-reader navigation becomes linear and predictable.

**Objection**: "This creates more pages; users will abandon."
**Response**: Testing shows the opposite. Users prefer 15 simple pages to 3 dense pages. The key is progress indication (page 3 of 15) and a save-and-return mechanism so users can pause.

**When not to apply:**
- Sign-in (username + password on one page, social login flows aside).
- Multi-select filters on a search results page (all filters on the left or in a side panel).
- Checkout for e-commerce (different UX register; "make it fast" trumps "make it one thing").

## Plain language rules

GOV.UK's style guide enforces a reading age of **9** for general public services; medical or legal services target reading age 12. This applies to headings, labels, error messages, and help text.

**Key rules:**
- Use common words: "buy" not "purchase", "help" not "assistance", "before" not "prior to".
- No acronyms without expansion on first use (e.g., "Self-Assessment (SA)").
- Avoid passive voice: "You will be asked" → "We will ask you".
- One idea per sentence; prefer 12–15 words.
- Never assume prior knowledge of the service or domain.
- Error messages name the problem and suggest a fix: "Account number must be 8 digits" not "Invalid input".

**Example readability test (Hemingway Editor or similar):**
- "In accordance with the provisions of the aforementioned legislation, applicants are required to furnish proof of residency." (reading age 16)
- "You need to show proof you live here." (reading age 8)

**Contrast check:** All text ≥ 4.5:1 ratio. Decorative text exempted; functional text is mandatory. GOV.UK tests color-blind users.

## Evidence-based design culture

GDS standard requires **user research at every major iteration**. This is not optional:

**Research panel:**
- Multi-generational (18–75+); diverse ability, literacy, tech comfort.
- ~6–8 participants per round of usability testing (law of diminishing returns).
- Mix of lab sessions (controlled) and in-the-wild sessions (user's home, library, post office).

**Lab observation:**
- Think-aloud protocol: users narrate their actions while completing a task.
- Observers note: where users stumble, where they need reassurance, where labels mislead.
- No leading questions; observe, do not coach.
- Session recorded (audio + screen); transcript searchable.

**Statistical UX testing:**
- A/B tests for label changes, button color, form layout.
- Completion rate is the primary metric; secondary metrics include time-on-task, error rate per field.
- Minimum sample size: 200–500 users per variant (depends on baseline completion rate).
- Results published as open data; design decision is traced to research.

**Stop criteria:**
- Design is not approved until research confirms users can complete the task without help.
- "Feels right" is not sufficient; data must show the change improves or maintains completion rates.

## When this applies beyond government

1. **High-stakes transactional services** (financial applications, medical consent forms, legal document signing): Users are anxious, not browsing for fun. One-thing-per-page and plain language remove friction and risk of error.

2. **Multi-locale or multilingual services** (international e-commerce, customer support): Plain language written for reading age 9 translates clearer. Short sentences are easier to localize without cost explosion. Forms designed one field per page are easier to test in 12 languages.

3. **Accessibility-critical surfaces** (healthcare, insurance, voting): Evidence-based design with diverse users (including older adults, users with disabilities) catches issues no design review can anticipate. The 10 principles are accessibility principles.

4. **Public trust or civic services** (voter registration, utility payment, nonprofit donations): Users feel the difference between "we built this for you" (content-first) and "we built this for us" (form-heavy). Completion rates and user sentiment both improve.

5. **Enterprise or B2B2C workflows** (HR self-service, expense reporting, supply-chain portals): Employees will use the system because they must. Plain language and one-thing-per-page reduce support volume and training burden.

**Do NOT apply:**
- Consumer marketing where emotional persuasion or brand personality is the goal.
- Real-time collaboration tools (Figma, Notion, Slack); context-switching adds complexity that sequential pages cannot support.
- Admin dashboards for expert users; these users want density and power, not simplification.

## Sources

- https://www.gov.uk/guidance/government-design-principles
- https://design-system.service.gov.uk/community/
- https://www.gov.uk/service-manual/design
- https://www.gov.uk/guidance/style-guide
