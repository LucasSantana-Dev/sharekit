# Team Topologies

Use these patterns when deciding how many agents to run and what roles they should hold.

## Lead + Specialists

Use for most engineering work.

- 1 lead agent owns plan, synthesis, and validation.
- 2-4 specialists own bounded implementation or review tracks.
- Best when the files or concerns can be partitioned cleanly.

## Competing Hypotheses

Use when the main uncertainty is approach, not throughput.

- 1 lead agent frames the question and comparison rubric.
- 2 agents explore alternative designs or fixes.
- 1 reviewer compares tradeoffs and recommends the winner.

## Build + Review

Use when the implementation is straightforward but quality risk is high.

- 1 implementer changes code.
- 1 reviewer checks regressions, tests, and missing edge cases.
- 1 lead agent integrates the result and reports the final state.
