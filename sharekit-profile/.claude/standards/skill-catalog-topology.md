# Skill Catalog Topology

Three tiers. Canonical is the only source of truth.

| Tier | Path | Role |
|------|------|------|
| **Canonical** | `~/.claude-env/` (`claude-env.git`) | Source of truth. Every *promoted* skill is tracked here. |
| **Working copy** | `~/.agents/skills/` (`skills.git`) | Live on-disk set. `~/.claude/skills` and `~/.codex/skills` are symlinks to it. Synced down from canonical via `sync pull`. |
| **Export** | `skills.git` HEAD (curated subset) | Portable "core kit". Regenerated from canonical — never hand-curated. |

## Rules
- **New skills are LOCAL-ONLY by default** — present in the working copy, absent from canonical. They are promoted to canonical only after deliberate per-skill review, never bulk-reconciled.
- **"Exists on disk" ≠ "ready for canonical."** Classify (canonical-ready / experimental / remove) before promoting.
- **Dead symlinks accumulate** in the working copy from plugin-cache churn. They are untracked and safe to delete: `find ~/.claude/skills -maxdepth 1 -xtype l`.
- Do not "reconcile" the downstream repo by committing the live set into it — that corrupts the curated export and is not the source of truth.

Decision record: `decisions/2026-05-28-skill-catalog-topology-governance.md`
