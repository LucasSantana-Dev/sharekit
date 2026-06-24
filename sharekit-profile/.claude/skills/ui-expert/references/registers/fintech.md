# Register: fintech

The product moves money or represents money. Examples: payment processors, banking, treasury, accounting, invoicing, payroll, lending.

## Audience expectations

- Reads carefully — money attracts attention
- Needs to trust the brand before clicking anything
- Notices when numbers are formatted wrong (`$1234.5` vs `$1,234.50`)
- Compares 3-5 alternatives before signing up
- Expects compliance signaling (SOC 2, PCI, etc.) visible
- Tests with real numbers — will spot edge cases in your UI

## Primary anchors

- [Stripe](../companies/stripe.md) — the gold standard
- [Linear](../companies/linear.md) — for the dashboard shell
- [Carbon](../companies/carbon-ibm.md) — for complex back-office surfaces

## Mandatory rules

### Numbers
- **`font-variant-numeric: tabular-nums` everywhere a number appears.** Non-negotiable.
- Currency: always show currency code OR symbol consistently. `$4.99` and `4.99 USD` are both fine, mixing is not.
- Decimals: always pad to expected precision (`$4.99` not `$4.99`, `$1,234.00` not `$1234`)
- Thousands separator: locale-aware, but consistent within the surface
- Negative amounts: parentheses `($4.99)` OR red color OR minus sign — pick one and stick
- Large numbers: never abbreviate user-facing money. `$1,247,832.50` not `$1.2M` in transaction lists

### Color
- **Commit to one accent.** Stripe purple, Mercury teal, Brex orange. Used for primary action + brand moments.
- Status semantics non-negotiable: success/warning/danger/info hues. Defined and used consistently.
- Tinted neutrals (warm grey, cool grey — match the accent's temperature).
- One Stripe-style hero gradient acceptable on marketing. Zero gradients on product.

### Typography
- Display sans with character (Söhne, ABC Diatype, Aeonik, Geist)
- Body sans (often the same family)
- Mono for IDs, transaction IDs, account numbers
- Hero size for marketing: 56-72px tight tracking
- Numbers in cards: 32-48px tabular weight 600

### Layout
- Marketing pages can be dense — code samples, comparison tables, FAQ
- Product pages are *not* dense in the Carbon sense — Stripe favors comfortable 56px table rows
- Sidebar + content area is the default shell
- Slide-over panels for transaction detail, not modals

### Trust signaling
- Compliance badges visible but tasteful (footer or "Security" section, not the hero)
- Real customer logos in monochrome at 24-32px (not the colorful logo wall)
- Specific numbers in social proof ("$2B processed", "12,000 businesses") not vague claims

## Required components

1. **KPI card** with tabular number + trend + optional sparkline
2. **Transaction table** with comfortable rows (56px), bottom-border-only, slide-over detail
3. **Status pill** for transaction state (Pending / Succeeded / Failed / Disputed)
4. **Money input** with currency selector, locale-aware formatting
5. **Date range picker** because every fintech screen filters by date
6. **Export button** because every fintech screen exports to CSV

## Register-specific anti-patterns

- ❌ Numbers in proportional font (looks wrong on every changed digit)
- ❌ Bright/saturated colors outside semantic roles
- ❌ Animated transitions on number changes (causes anxiety — money should be still)
- ❌ "Welcome back!" microcopy in financial dashboards (it's transactional, not social)
- ❌ Modal for "are you sure?" on every action (only for irreversible operations)
- ❌ Skeleton loaders that pulse aggressively (subtle shimmer is fine; fast pulse looks unstable)
- ❌ Multi-tier pricing as 3 identical cards
- ❌ Trust badges (PCI, SOC2) as decorative icons in the hero — put them in security/footer

## Token starter

```css
--bg:           oklch(1.00 0 0);
--bg-elevated:  oklch(0.985 0.003 280);
--fg:           oklch(0.12 0.01 280);
--fg-muted:     oklch(0.50 0.015 280);
--border:       oklch(0.93 0.008 280);

--accent:       oklch(0.55 0.20 270);        /* committed brand */
--success:      oklch(0.65 0.18 145);
--warning:      oklch(0.78 0.15 75);
--danger:       oklch(0.58 0.22 25);

--font-display: "Söhne", "ABC Diatype", "Aeonik", system-ui, sans-serif;
--font-body:    "Söhne", "Inter", system-ui, sans-serif;   /* Inter OK here */
--font-mono:    "Camera Mono", "IBM Plex Mono", monospace;
```
