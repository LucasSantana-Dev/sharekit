# Example Workflow

Full worked example: beauty spa landing page design system.

## User Request

"Làm landing page cho dịch vụ chăm sóc da chuyên nghiệp"

## Step 1: Extract Requirements

- **Product type:** Beauty/Spa service
- **Style keywords:** elegant, professional, soft
- **Industry:** Beauty/Wellness
- **Stack:** html-tailwind (default)

## Step 2: Generate Design System

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "beauty spa wellness service elegant" --design-system -p "Serenity Spa"
```

Output: Complete design system with pattern, style, colors, typography, effects, and anti-patterns.

### Step 2b: Persist Design System (Optional)

To save for hierarchical retrieval across sessions:

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "beauty spa wellness service elegant" --design-system --persist -p "Serenity Spa"
```

This creates:
- `design-system/MASTER.md` — Global source of truth
- `design-system/pages/` — Folder for page-specific overrides

With page-specific override:

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "beauty spa wellness service elegant" --design-system --persist -p "Serenity Spa" --page "dashboard"
```

This also creates:
- `design-system/pages/dashboard.md` — Page-specific deviations from Master

## Step 3: Supplement with Detailed Searches

After design system, use domain searches for additional details:

```bash
# Get UX guidelines for animation and accessibility
python3 skills/ui-ux-pro-max/scripts/search.py "animation accessibility" --domain ux

# Get alternative typography options if needed
python3 skills/ui-ux-pro-max/scripts/search.py "elegant luxury serif" --domain typography
```

## Step 4: Get Stack-Specific Implementation Guidance

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "layout responsive form" --stack html-tailwind
```

## Finalize

Synthesize design system + detailed searches and implement the design. Verify against `references/pre-delivery-checklist.md` before delivery.

## Hierarchical Design System Retrieval

When building a specific page (e.g., "Checkout"):

1. Check if `design-system/pages/checkout.md` exists
2. If it exists, its rules **override** the Master file
3. If not, use `design-system/MASTER.md` exclusively

Use this prompt when retrieving hierarchically:

```
I am building the [Page Name] page. Please read design-system/MASTER.md.
Also check if design-system/pages/[page-name].md exists.
If the page file exists, prioritize its rules.
If not, use the Master rules exclusively.
Now, generate the code...
```
