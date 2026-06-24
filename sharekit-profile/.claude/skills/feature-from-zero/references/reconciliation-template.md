# Reconciliation Template

Output after all 8 phases complete:

```
FEATURE FROM ZERO — <feature name>

Phase 1 Decide:      ADR-NNNN <decision> ✅ DONE
Phase 2 Plan:        <plan path, N phases, M files in scope> ✅ DONE
Phase 3 Implement:   <commits, files changed> ✅ DONE
Phase 4 UI:          <surfaces built / SKIPPED if no UI> ✅ DONE
Phase 5 Tests:       <test-health verdict, fix-the-suite if applied> ✅ DONE
Phase 6 Merge:       PR #N at <SHA> ✅ DONE
Phase 7 Ship:        v<X.Y.Z> deployed to <target>, verified ✅ DONE
Phase 8 Captured:    memory + RAG indexed, handoff if session-ending ✅ DONE

Total commits: N
Total time: H hours wall-clock
Snapshot:            <handoff path | (none — feature shipped and live)>
Open watch:          (none) | <e.g. "monitor feature metrics in production">
```

Use this to summarize across all phases; one artifact per feature.
