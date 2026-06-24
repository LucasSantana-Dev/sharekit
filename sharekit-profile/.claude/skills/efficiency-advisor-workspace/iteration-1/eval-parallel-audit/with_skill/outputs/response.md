# Efficiency Advisor: Codebase Audit Plan Evaluation

## Input Analysis

**Analyzing:** Planned workflow (4-phase audit + synthesis)

---

## Step 2 — Map the work structure

```
Step 1: Security audit (Opus agent) ✓
  ↓ (blocks)
Step 2: Test health audit (Opus agent)
  ↓ (blocks)
Step 3: Config drift check (Opus agent)
  ↓ (blocks)
Step 4: Synthesize + write ADR (Opus agent)
```

**Structure type:** Pipeline with unnecessary barriers. Steps 1, 2, 3 are **independent** (no data flow between them), but forced sequential. Step 4 depends on 1+2+3.

---

## Step 3 — Check model tier fit

| Step | Task | Current tier | Fit? | Issue |
|------|------|--------------|------|-------|
| 1–3 | Audit/discovery (read-only) | Opus | ❌ | Overspecified; Sonnet or Explore sufficient |
| 4 | Synthesize + write ADR | Opus | ✓ | Correct; architecture/decision reasoning |

**Mismatches found:** Steps 1–3 each get an Opus agent when Sonnet would handle audits correctly and cost ~6× less per phase.

---

## Step 4 — Check parallelism

**Critical inefficiency:** Steps 1, 2, 3 wait sequentially. They are **independent** — each runs a different audit with no cross-dependencies. They should dispatch in parallel (single message, three Agent calls).

**Time impact:**
- Current: ~T + T + T + T_synthesize = ~4T wall-clock
- Proposed: ~T + T_synthesize (concurrent) = ~2T wall-clock
- **Savings:** ~50% wall-clock time

---

## Step 5 — Check re-read waste

Each agent independently reads the codebase. Parallel dispatch means each restarts from zero — but this is unavoidable for independent fresh audits. **Not a waste here**, because synthesis (Step 4) genuinely needs all three outputs before executing.

---

## Step 6 — Score and prioritize

### [HIGH] Parallelize independent audits (Steps 1–3)

```
Current:  Step 1 → wait → Step 2 → wait → Step 3 → wait → Step 4
          (sequential pipeline; 4 total agents)

Better:   Dispatch Steps 1, 2, 3 in parallel in a single message;
          Step 4 runs after all three complete

Saves:    ~50% wall-clock time
Tradeoff: Tokens increase ~2–2.5x (parallel ≠ faster when concurrent agents 
          all read full codebase; wall-clock speed is the win here)
```

### [HIGH] Downgrade Steps 1–3 from Opus to Sonnet

```
Current:  Security audit (Opus) + Test audit (Opus) + Config audit (Opus)
          = 3 Opus passes over full codebase context (~3× full input cost)

Better:   Security audit (Sonnet/Explore) + Test audit (Sonnet/Explore) + Config audit (Sonnet/Explore)
          = 3 Sonnet passes (Sonnet is correctly tiered for read-only analysis)

Saves:    ~60% tokens for audit phases (Opus ≈ 6× cost of Sonnet, downgrade saves 5 ratios × 3 phases)
Tradeoff: NONE — audits are read-only discovery; Sonnet is the right tier
```

### [MED] Consider fork for Step 4 if findings are large

```
Current:  Step 4 agent receives 3 audit findings as fresh context injection

Better:   If combined findings exceed ~5k tokens, use fork (inherits orchestrator context + cache)
          instead of fresh Opus agent

Saves:    ~20–30% tokens on Step 4's input re-read (context cache hit)
Tradeoff: Minimal; fork adds negligible wall-clock time and shares prompt cache
```

---

## Step 7 — Output

```
## Efficiency [FIXABLE] — Codebase audit plan (4-phase workflow)

**Status:** BLOCKED on parallelization + tier structure
**Savings available:** 
  - ~50% wall-clock time (parallel Steps 1–3)
  - ~60% tokens (downgrade audit tiers to Sonnet)
  - Combined: ~40% total tokens + ~50% time

**Key findings:**
1. Parallelize independent audits (Steps 1–3) in a single dispatch — currently sequential
2. Downgrade Steps 1–3 from Opus to Sonnet — audits don't need Opus reasoning
3. Use fork for Step 4 if findings are large — inherits cache, saves input re-reads

**Next:** Restructure as:
  1. Dispatch 3 Sonnet agents in parallel (security, test, config) in a single message
  2. Wait for all three to complete
  3. Dispatch single Opus agent for synthesis + ADR with all findings injected
```

---

## Verdict

**Your plan is FIXABLE — not optimal yet.**

Two structural changes get you 50% faster + 40% cheaper:
1. **Parallelize audits** (not sequential)
2. **Downgrade audit tiers** from Opus to Sonnet

The third (fork for synthesis) is a nice-to-have if findings are large.

Apply findings #1 and #2 before dispatching.
