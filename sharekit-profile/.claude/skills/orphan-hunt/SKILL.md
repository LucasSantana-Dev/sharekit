---
name: orphan-hunt
description: 'Scan a codebase for dead code: files not imported anywhere, exports never used, dependencies declared but not called. Use before a cleanup pass to identify safe deletions. Triggers: "find dead code", "orphan hunt", "unused files", "dead code scan", "find orphans".'
metadata:
  owner: global-agents
  tier: ephemeral
  canonical_source: ~/.claude/skills/orphan-hunt
---

# Orphan Hunt

Find what's dead before deleting it.

## Workflow

1. **Orphaned files** — find files that are never imported and not entry points:
   ```bash
   # Example: find files not referenced in any other file
   find . -name "*.ts" | xargs grep -l "^export" | while read f; do
     name=$(basename "$f" .ts); grep -r "$name" --include="*.ts" -l | grep -v "$f" | head -1
   done
   ```

2. **Unused exports** — find symbols exported but never imported elsewhere:
   - Search for each `export function/class/const` declaration
   - Grep for the symbol name in all other files
   - Flag those with zero hits outside the declaring file

3. **Unused dependencies** — compare declared deps (package.json, go.mod, Cargo.toml, requirements.txt) against actual imports in source files

4. **Dangling references** — strings/paths/config keys that point to nonexistent things:
   - Route paths with no matching handler
   - Config keys read in code but missing from schema

5. **Output** categorized list

## Output

```
Orphan Hunt Results
────────────────────
Orphaned files (safe to delete):
  - path/to/file.ts — never imported

Unused exports (verify before removing):
  - MyClass in utils/legacy.ts — 0 external usages

Unused dependencies:
  - some-package — declared but never imported

Dangling references:
  - "GET /old-path" — referenced in docs but no handler found
```

## Rules

- "Safe to delete" = zero references found; always grep to confirm before deleting
- "Verify before removing" = low confidence; may be dynamically referenced
- Do not delete — report only. Deletion is a separate commit after human review.
