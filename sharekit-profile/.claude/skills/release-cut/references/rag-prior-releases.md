# RAG Query for Prior Release History

Optional Phase 1 enhancement — query prior release patterns before cutting.

## Mount guard (required)

```bash
mount | grep -q "/Volumes/External HD" || {
  echo "BLOCKED: External HD unmounted — RAG/vault unreachable"
  exit 1
}
```

If unmounted: skip RAG query, proceed with git commands only.

## Query pattern

```bash
python3 ~/.claude/rag-index/query.py \
  "prior releases in this repo: version bumps, cadence, merge patterns" \
  --top 5 --scope memory --format json
```

Or via search_knowledge (vault-only):

```bash
search_knowledge(
  query="when was last release cut, what was the version bump rationale",
  top=5
)
```

## When to use

- First release in a new repo (establish baseline cadence)
- Deciding between patch/minor/major when commits are ambiguous
- Checking if prior hotfixes need cherry-pick follow-up

## When to skip

- Normal release on established repo (commits tell the story)
- Vault/RAG unavailable (proceed with Phase 1 git inventory)
