---
name: agent-box-dispatch
description: Submit async jobs to the agent-box Docker container for background execution. Drop job files into the remote queue, check results asynchronously. Ideal for long-running codebase analysis, PR review, security scanning, and research tasks that don't need Mac-side tools. Supports priority levels and job tracking.
triggers:
  - "agent-box"
  - "submit job"
  - "background task"
  - "async agent"
  - "run on agent-box"
---

# Agent-box Job Queue

Submit async jobs to the agent-box Docker container (`ssh agent-box` from Mac) for background execution without blocking local work.

## Job Format

Job files dropped into `/workspace/job-queue/pending/` on agent-box follow this structure:

```markdown
# Job: <title>
Submitted: <ISO8601>
Priority: low|normal|high

<your prompt or task description here>
```

**Header fields:**
- `# Job: <title>` — Human-readable job name (e.g., "Audit Lucky deps")
- `Submitted: 2026-05-03T14:30:00Z` — ISO 8601 timestamp (auto-populated)
- `Priority: low|normal|high` — Job priority queue (default: normal)

## Submitting a Job

Use the provided `submit-job.sh` helper or SSH directly:

### Via Helper Script

```bash
submit-job.sh "audit-lucky" "Review Lucky bot dependencies for security issues and deprecations"
```

Output:
```
Job submitted: agent-box:/workspace/job-queue/pending/1714759800-audit-lucky.md
Job ID: 1714759800-audit-lucky
```

### Manual SSH (if helper unavailable)

```bash
ssh agent-box "cat > /workspace/job-queue/pending/$(date +%s)-job-name.md" << 'EOF'
# Job: Audit Lucky dependencies
Submitted: 2026-05-03T14:30:00Z
Priority: normal

Review Lucky bot npm dependencies for security issues, deprecations, and update readiness.
EOF
```

## Checking Results

List completed jobs:

```bash
ssh agent-box "ls -lt /workspace/job-queue/done/ 2>/dev/null | head -10"
```

Read a specific result:

```bash
ssh agent-box "cat /workspace/job-queue/done/1714759800-audit-lucky.md"
```

## Use Cases

- **Background research** — Analysis of remote repos without blocking local work
- **Codebase audits** — Security scans, dependency reviews on agent-box repos
- **PR reviews** — Detailed review of multiple PRs on remote projects
- **Long-running tasks** — Tasks taking >5 min that don't need Mac-side tools
- **Batch processing** — Analysis of multiple projects in parallel

## Queue Lifecycle

1. **Pending** — Job file in `/workspace/job-queue/pending/`
2. **Running** — Agent picks up job (file moved or locked)
3. **Done** — Result written to `/workspace/job-queue/done/<same-filename>.md`

## Job Result Format

Agent appends results to the original job file:

```markdown
# Job: Audit Lucky dependencies
Submitted: 2026-05-03T14:30:00Z
Priority: normal

Review Lucky bot npm dependencies for security issues, deprecations, and update readiness.

---

## Agent Result

**Status:** DONE  
**Completed:** 2026-05-03T14:35:22Z  
**Runtime:** 5m 22s

### Findings

[detailed analysis from agent-box]

### Recommendations

[actionable next steps]
```

## Tips

- **Timestamps** — Job filenames use Unix epoch for easy sorting (`ls -t`)
- **Priority** — Set `high` for urgent tasks; `low` for batch/background work
- **Large prompts** — For >2KB prompts, use a file upload to agent-box instead of SSH cat
- **Polling** — Check `/workspace/job-queue/done/` every 30-60 seconds; agent processes ~1 job per minute on average
