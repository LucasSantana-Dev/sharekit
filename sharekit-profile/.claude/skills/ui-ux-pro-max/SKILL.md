---
name: ui-ux-pro-max
description: Searchable UI/UX reference library for targeted pattern/palette/font/component lookup via Python search tool. 97 color palettes, 57 font pairings, 50+ UI styles, 9 tech stacks indexed by domain. Use when the user needs palette selection, typography research, style pattern lookup, or component recommendations. Not a replacement for impeccable/ui-expert design guidance — those handle end-to-end UI work; this wins for reference lookups.
metadata:
  owner: global-agents
  tier: contextual
  progressive_disclosure: split
---

# UI/UX Pro Max - Design Reference Library

Searchable reference for palette, typography, style, and component pattern lookup via Python search tool. Contains 97 color palettes, 57 font pairings, 50+ UI styles, 25 chart types, and UX guidelines indexed by domain and technology stack.

**Use for:** Targeted lookups like "show me color palettes for fintech SaaS", "font pairings for luxury brand", "chart types for real-time dashboard", "shadcn-style components".

**Don't use for:** End-to-end design work or UI strategy. See `/impeccable` or `/ui-expert` for page implementation, design validation, or comprehensive UX audits — those skills integrate this reference data but handle broader design strategy, token specification, and production validation.

---

## Prerequisites

Verify Python is installed:

```bash
python3 --version || python --version
```

If missing:
- **macOS:** `brew install python3`
- **Ubuntu/Debian:** `sudo apt update && sudo apt install python3`
- **Windows:** `winget install Python.Python.3.12`

Stop if Python is unavailable — the search tool requires it.

---

## Workflow

### Step 1: Analyze Requirements + Check Memory

Extract from user request:
- Product type (SaaS, e-commerce, portfolio, dashboard, landing page)
- Style keywords (minimal, playful, professional, elegant, dark mode)
- Industry (healthcare, fintech, gaming, education)
- Tech stack (React, Vue, Next.js, or default to `html-tailwind`)

**Optional:** Check memory or RAG for prior design decisions for the same project. See `/recall` for patterns.

### Step 2: Generate Design System (REQUIRED)

Start with `--design-system` to get comprehensive recommendations with reasoning:

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<product_type> <industry> <keywords>" --design-system [-p "Project Name"]
```

This searches 5 domains in parallel (product, style, color, landing, typography), applies reasoning rules, returns pattern + style + colors + typography + effects + anti-patterns.

**Example:**
```bash
python3 skills/ui-ux-pro-max/scripts/search.py "beauty spa wellness service elegant" --design-system -p "Serenity Spa"
```

**Persist for hierarchical retrieval (optional):**
```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "Project Name" [--page "dashboard"]
```

Creates `design-system/MASTER.md` + optional page-specific overrides in `design-system/pages/`.

**Done when:** Design system output shows pattern, style, color palette, typography, effects, and anti-patterns without gaps.

### Step 3: Supplement with Domain-Specific Searches (as needed)

After design system, query individual domains for additional details:

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain <domain> [-n <max_results>]
```

See `references/search-reference.md` for domain/stack table and when to use each.

**Done when:** You have clarity on the specific aspect (e.g., "which chart works for real-time data?" or "what's the best serif for luxury?").

### Step 4: Get Stack-Specific Best Practices (if needed)

For implementation-specific guidance, default to `html-tailwind` if user doesn't specify:

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<keyword>" --stack html-tailwind
```

**Done when:** You have stack-specific patterns (e.g., Tailwind utilities, React hooks, SSR considerations).

---

## Output Format Options

```bash
# ASCII box (default) — best for terminal display
python3 skills/ui-ux-pro-max/scripts/search.py "fintech crypto" --design-system

# Markdown — best for documentation
python3 skills/ui-ux-pro-max/scripts/search.py "fintech crypto" --design-system -f markdown
```

---

## Tips for Better Results

1. **Be specific with keywords** — "healthcare SaaS dashboard" > "app"
2. **Search multiple times** — Different keywords reveal different insights
3. **Combine domains** — Style + Typography + Color = Complete design system
4. **Check UX** — Always search "animation", "z-index", "accessibility" to catch common issues
5. **Use stack flag** — Get implementation-specific best practices
6. **Iterate** — If first search doesn't match, try different keywords

---

## Before Delivery

See `references/pre-delivery-checklist.md` for final verification (visual quality, interaction, light/dark mode, layout, accessibility).

---

## Key References

- `references/ux-guidelines.md` — 8-tier rule hierarchy, professional UI anti-patterns
- `references/search-reference.md` — Domain/stack tables, when to use each
- `references/pre-delivery-checklist.md` — Final verification checklist
- `references/example-workflow.md` — Worked example (beauty spa landing page)

For end-to-end design work or strategy, see `/impeccable` or `/ui-expert`.

---

## Memory Hooks

- Read memory when product, repo, or workflow history affects correctness.
- Write memory only if this work establishes a durable policy or convention.
