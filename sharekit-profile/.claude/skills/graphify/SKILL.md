---
name: graphify
description: "any input (code, docs, papers, images, videos) to knowledge graph. Query graphs with /graphify query. Ingest URLs and auto-update. Use when user asks any question about a codebase, documents, or project content — especially if graphify-out/ exists, treat the question as a /graphify query first."
trigger: /graphify
---

# /graphify

Turn any folder of files into a navigable knowledge graph with community detection, audit trail, and three outputs: interactive HTML, GraphRAG-ready JSON, and a plain-language GRAPH_REPORT.md.

## When to use /graphify

- **Query existing graph** (`--fast-path`): If `graphify-out/graph.json` exists and user asks a codebase question → run `/graphify query` directly.
- **Full build**: User provides a path or URL → run the 9-step pipeline (Steps 1–9).
- **Incremental update**: User wants to re-scan after code changes → run `/graphify --update`.
- **Clustering re-run**: User wants to re-label communities → run `/graphify --cluster-only`.
- **Subcommands**: Query, path-finding, node explanation, URL ingestion → `/graphify query|path|explain|add`.

## Graph-first context: query before wide reads

**[WARN] [standards/graphify-discipline.md](../../standards/graphify-discipline.md) - Graph-first token discipline:**
If `graphify-out/graph.json` exists, query it BEFORE running grep/read sweeps. A graph query costs ~500 tokens; file reads it replaces cost 10-50k. Do not re-derive graph context by reading files — rely on the graph.

## Usage examples

See [references/usage.md](references/usage.md) for all command syntax.

## Core workflow

### Step 0: Handle GitHub URLs
If user provided a GitHub URL, clone it first. See [references/steps/step-0-clone.md](references/steps/step-0-clone.md).

### Step 1: Ensure graphify installed
Detect Python interpreter, install if needed. See [references/steps/step-1-install.md](references/steps/step-1-install.md).

### Step 2: Detect corpus
Scan for code, docs, papers, images, video. Handle large corpora. See [references/steps/step-2-detect.md](references/steps/step-2-detect.md).

### Step 2.5: Transcribe video (if found)
Converts video/audio to text for semantic extraction. See [references/steps/step-2-5-transcribe.md](references/steps/step-2-5-transcribe.md).

### Step 3: Extract entities and relationships
Run AST (code) and semantic (docs/papers/images) extraction in parallel. See [references/steps/step-3-extract.md](references/steps/step-3-extract.md).

### Step 4: Build graph, cluster, analyze
Construct graph, detect communities, compute cohesion. See [references/steps/step-4-build.md](references/steps/step-4-build.md).

### Step 5: Label communities
Name each community in plain language. See [references/steps/step-5-label.md](references/steps/step-5-label.md).

### Step 6: Generate outputs
Obsidian vault, HTML viz, exports. See [references/steps/step-6-visualize.md](references/steps/step-6-visualize.md).

### Step 8: Token benchmark
Show compression value (if corpus > 5k words). See [references/steps/step-8-benchmark.md](references/steps/step-8-benchmark.md).

### Step 9: Cleanup, cost, report
Save manifest, update cost tracker, push snapshot to knowledge-brain. See [references/steps/step-9-cleanup.md](references/steps/step-9-cleanup.md).

## Subcommands & modes

| Mode | Trigger | Reference |
|------|---------|-----------|
| Fast path (query existing graph) | `graphify-out/graph.json` exists + question | [references/fast-path.md](references/fast-path.md) |
| Query | `/graphify query "<question>"` | [references/subcommands/query.md](references/subcommands/query.md) |
| Path-find | `/graphify path "A" "B"` | [references/subcommands/path.md](references/subcommands/path.md) |
| Explain node | `/graphify explain "X"` | [references/subcommands/explain.md](references/subcommands/explain.md) |
| Ingest URL | `/graphify add <url>` | [references/subcommands/add.md](references/subcommands/add.md) |
| Incremental update | `/graphify --update` | [references/subcommands/update.md](references/subcommands/update.md) |
| Cluster re-run | `/graphify --cluster-only` | [references/subcommands/cluster-only.md](references/subcommands/cluster-only.md) |
| Watch folder | `/graphify --watch` | [references/subcommands/watch.md](references/subcommands/watch.md) |
| Git hook | `graphify hook install` | [references/subcommands/hook.md](references/subcommands/hook.md) |
| CLAUDE.md integration | `graphify claude install` | [references/subcommands/claude-integration.md](references/subcommands/claude-integration.md) |

## Special behaviors

**Help message**: If user invokes `/graphify --help` or `/graphify -h` (no other args), print the Usage section from [references/usage.md](references/usage.md) verbatim and stop. No commands, no detection, just the help text.

**Interpreter guard for subcommands**: Before running `--update`, `--cluster-only`, `query`, etc., check [references/interpreter-guard.md](references/interpreter-guard.md) to ensure `.graphify_python` exists.

**No path provided**: If no path is given, use `.` (current directory).

## Honesty rules

See [references/honesty-rules.md](references/honesty-rules.md):
- Never invent an edge. If unsure, use AMBIGUOUS.
- Never skip corpus warning.
- Always show token cost.
- Never hide cohesion scores.
- Warn before viz on >5000-node graphs.

## Stop conditions

- **No supported files found**: Stop immediately. Do not proceed.
- **Graph is empty** (Step 4): Stop. Extraction produced no nodes. Tell user the likely cause.
- **More than half extraction chunks failed** (Step 3B3): Stop. Ask user to re-run with `subagent_type="general-purpose"`.

## What graphify is for

Drop any folder of code, docs, papers, images, or video and get a queryable knowledge graph. Persistent across sessions, honest audit trail (EXTRACTED/INFERRED/AMBIGUOUS), community detection surfaces cross-document connections you wouldn't think to ask about.
