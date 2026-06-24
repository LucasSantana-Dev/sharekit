---
name: harness-doctor
description: 'Diagnose Claude Code harness health and connectivity. Runs probes on MCP servers, file system mounts, git sync, graph freshness, hooks, and settings. Generates status table (OK/WARN/FAIL per subsystem) with actionable suggestions. Orchestrates harness-audit, hook-effectiveness, adt-mcp-health, and skill-security-scan for deeper analysis. Use when troubleshooting harness issues, verifying setup completeness, or checking system readiness.'
version: 1.0.0
---

# Harness Doctor

**Purpose**: One-call health-check probe for the claude-env harness. Orchestrates existing diagnostics to assess subsystem readiness and identify configuration gaps.

## Philosophy

This skill provides **rapid health assessment** through:
- **Single invocation** - One command probes all subsystems
- **Clear status reporting** - Table format (OK/WARN/FAIL) per subsystem
- **Actionable suggestions** - Ranked fixes by severity and impact
- **Orchestration, not reimplementation** - References existing tools (harness-audit, hook-effectiveness, adt-mcp-health, skill-security-scan)
- **Read-only** - Pure diagnostics, never modifies harness state

## Core Workflow

### Phase 1: Probe Subsystems

Execute diagnostics across key areas:

#### 1.1 MCP Servers Connectivity

Probe active MCP server connections.

**Command**: `claude mcp list`

**Check For**:
- Total servers connected (target: at least 3 active)
- Server status codes (looking for failures or offline)
- Recent connection health (timeouts, auth errors)

**Status Criteria**:
- **OK**: 3+ servers active, no error codes in past 24h
- **WARN**: 1-2 servers active or intermittent failures
- **FAIL**: 0 servers active, all offline, or recurring auth failures

**Output**: Display connected servers, status health, and any error patterns.

#### 1.2 external drive Mount

Verify external drive is mounted and accessible.

**Check For**:
- Mount point exists: `${EXTERNAL_HD}`
- Readable/writable: Can list files and test write
- Storage quota: Report available space vs. used

**Status Criteria**:
- **OK**: Mounted, readable/writable, >10GB free
- **WARN**: Mounted but low space (<5GB) or permission issues
- **FAIL**: Not mounted, unreachable, or permission denied

**Output**: Mount status, path accessibility, disk usage summary.

#### 1.3 Claude Env Git Sync

Check ~/.claude-env repository state.

**Command**: `git -C ~/.claude-env status --porcelain` and `git -C ~/.claude-env log --oneline -n 5`

**Check For**:
- Uncommitted changes (git status output)
- Unpushed commits (`git rev-list origin/main..HEAD`)
- Remote branch tracking and divergence
- Last commit freshness (within 30 days)

**Status Criteria**:
- **OK**: No uncommitted changes, all changes pushed, up-to-date with origin
- **WARN**: Uncommitted changes present or unpushed commits, but not stale
- **FAIL**: Conflicted merge state, remote unreachable, or stale (>30 days)

**Output**: Modified files, unpushed commit count, last commit age, remote status.

#### 1.4 Graph Freshness

Assess codebase-memory and graphify index state.

**Command**: Query codebase-memory MCP for index_status (if available)

**Check For**:
- Graph index existence and recency
- Last index update timestamp
- Graph query responsiveness (test with simple query)

**Status Criteria**:
- **OK**: Index present, updated within 7 days, queries respond quickly (<2s)
- **WARN**: Index stale (7-30 days) or slow responses (2-5s)
- **FAIL**: No index, not updated in >30 days, or query failures

**Output**: Index age, last update date, query performance note.

#### 1.5 Hooks & Automation

Verify pre-commit and custom hooks are present.

**Check For**:
- `.git/hooks/pre-commit` exists and executable
- Custom hooks in ~/.claude-env or project settings.json
- Hook configurations in settings.json
- Before-event/after-event automation rules

**Status Criteria**:
- **OK**: Pre-commit hook present, settings.json defines automation, no permission issues
- **WARN**: Hook present but no settings.json automation, or permission warnings
- **FAIL**: No pre-commit hook, settings.json unreadable, or hook disabled

**Output**: Hook presence status, configured automations, any permission warnings.

#### 1.6 Settings & Configuration

Verify harness configuration completeness.

**Check For**:
- settings.json exists and parses valid JSON
- settings.json defines model, permissions, hooks
- settings.local.json (if exists) valid and doesn't override critical settings
- env variables (DEBUG, CLAUDE_API_KEY if needed)

**Status Criteria**:
- **OK**: settings.json valid with model, permissions, hooks defined; no override conflicts
- **WARN**: Valid settings but missing non-critical configs, or local overrides detected
- **FAIL**: settings.json unreadable, unparseable, or critical configs missing

**Output**: Settings file validity, key configuration summary, any override warnings.

### Phase 2: Generate Status Report

After probing, format results as a diagnostic table.

**Table Format**:

```
HARNESS HEALTH REPORT
====================

Subsystem                  Status   Message
───────────────────────────────────────────────────────────
MCP Servers                OK       5 servers active, no errors
external drive Mount          OK       ${EXTERNAL_HD} (127GB, 95GB free)
Claude Env Git Sync        WARN     3 unpushed commits, branch tracking ok
Graph Freshness            OK       Index updated 2 days ago, queries <1s
Hooks & Automation         OK       Pre-commit enabled, 4 automations configured
Settings & Configuration   OK       Valid settings.json, model=claude-haiku-4.5
```

**Status Legend**:
- **OK**: Subsystem healthy, no action needed
- **WARN**: Minor issue detected, not blocking but review suggested
- **FAIL**: Critical issue, immediate action required

### Phase 3: Suggest Fixes

Generate ranked list of actionable suggestions based on status.

**Priority Ordering**:
1. **CRITICAL** - FAIL status items (blocks harness function)
2. **HIGH** - WARN status + known performance concerns
3. **MEDIUM** - Best practices and optimization opportunities
4. **LOW** - Enhancement suggestions

**For Each Issue, Provide**:
- **Problem Statement**: What is the issue
- **Impact**: How it affects harness operation
- **Suggested Fix**: Specific command or action
- **Reference**: Link to detailed diagnosis skill

**Example Suggestions**:

```
SUGGESTED FIXES
===============

CRITICAL:
1. MCP Servers Offline
   Impact: Cannot use MCP tools (blocking)
   Fix: Run 'claude mcp reconnect' or restart Claude Code
   Details: See /adt-mcp-health for deeper analysis

HIGH:
2. Unpushed Changes in ~/.claude-env
   Impact: Skills/config changes at risk of loss if device fails
   Fix: Run 'git -C ~/.claude-env push origin main'
   Details: Use 'git -C ~/.claude-env status' to review changes

MEDIUM:
3. Graph Index Stale (10 days old)
   Impact: Codebase search may return outdated results
   Fix: Run /graphify to rebuild index
   Details: Use /adt-rag-drift to assess impact
```

## Orchestration & References

This skill **does not reimplement** existing diagnostics. Instead, it orchestrates and references:

- **harness-audit**: For security-focused health checks (permissions, credential exposure)
- **hook-effectiveness**: For analyzing automation hook performance and coverage
- **adt-mcp-health**: For detailed MCP server diagnostics, connection logs, and recovery
- **skill-security-scan**: For skill-specific security vulnerabilities and misconfiguration
- **codebase-memory**: For graph index status and freshness queries

**Invocation Pattern**: After harness-doctor generates the status table, users can invoke these skills for deeper analysis of any WARN or FAIL status.

## Done-When Criterion

This skill is complete when:
1. All 6 subsystems are probed without error or timeout
2. Status table is generated with consistent OK/WARN/FAIL labels
3. At least 1 suggested fix is provided for each non-OK subsystem
4. Output references appropriate orchestrated skills for deeper analysis
5. No more than 30 seconds elapsed from invocation to report display

## Hard Rules & Stop Conditions

**Never Modify State**:
- Do not commit, push, or reset git state
- Do not create/delete hooks or modify settings
- Do not restart services or MCP servers
- Do not regenerate graphs or indexes

**Stop If**:
- Any subsystem probe takes >10s (timeout and mark as unknown)
- Two or more critical systems are down (git unreachable + MCP offline)
- Settings.json is corrupted or unreadable (cannot assess other configs safely)
- User explicitly cancels the probe

**Avoid Assuming**:
- Do not assume external drive always exists or is mounted
- Do not assume ~/.claude-env is a git repo (check first)
- Do not assume MCP servers are critical if some are offline
- Do not assume git is configured or user has push access

## Common Rationalizations & Pitfalls

**Pitfall 1**: "Hooks are slow, so they are broken"
- **Reality**: Hooks may run background tasks; slow =/= broken
- **Fix**: Mark as WARN, reference hook-effectiveness for analysis

**Pitfall 2**: "Graph is 3 days old, must rebuild"
- **Reality**: Depends on project activity; 3 days may be fine
- **Fix**: Mark as OK if within 7 days, WARN if 7-30, FAIL if >30

**Pitfall 3**: "One MCP server offline means harness is broken"
- **Reality**: Harness has many MCP servers; 1 offline is recoverable
- **Fix**: Mark as WARN if 1-2 offline, FAIL only if 3+ or core servers down

**Pitfall 4**: "Always suggest 'restart Claude Code' as fix"
- **Reality**: Restart is last resort after diagnostics
- **Fix**: Suggest specific commands (mcp reconnect, git push) first

## Usage Examples

### Typical Invocation

User: "Check harness health"

Claude: Runs harness-doctor, generates table, lists suggested fixes.

```
HARNESS HEALTH REPORT
Subsystem                  Status   Message
MCP Servers                OK       5 servers active
external drive Mount          OK       127GB mounted
Claude Env Git Sync        WARN     3 unpushed commits
Graph Freshness            OK       2 days old
Hooks & Automation         OK       4 automations active
Settings & Configuration   OK       Valid

SUGGESTED FIXES
HIGH: 3 unpushed changes in ~/.claude-env
  > git -C ~/.claude-env push origin main

See /harness-audit for security check, /hook-effectiveness for automation analysis.
```

### Troubleshooting Scenario

User: "Harness feels slow and MCP tools are not responding"

Claude: Runs harness-doctor, detects MCP offline + graph stale.

```
CRITICAL: 1 server offline (codebase-memory)
  > Run /adt-mcp-health for detailed MCP diagnostics
  
MEDIUM: Graph index 15 days old, may slow searches
  > Run /graphify to rebuild
  > Use /adt-rag-drift to assess search quality
```

## Integration with Harness Ecosystem

**Works With**:
- **harness-audit**: Security verification of harness setup
- **hook-effectiveness**: Automation performance analysis
- **adt-mcp-health**: MCP server and connection debugging
- **skill-security-scan**: Skill-specific security review
- **codebase-memory**: Graph/index health and queries

**Typical Flow**:
1. User runs harness-doctor for quick health check
2. Harness-doctor identifies issues and suggests deeper skills
3. User invokes specific skill (e.g., harness-audit, adt-mcp-health) for remediation
4. User confirms fixes work, then re-runs harness-doctor to verify

## Performance Notes

**Expected Runtime**: <30 seconds for complete probe

**Timeouts Per Subsystem**:
- MCP list: 5s
- File system: 2s
- Git status: 3s
- Graph query: 5s
- Hook check: 2s
- Settings validation: 1s

**Optimization**:
- Run probes in parallel where possible
- Cache MCP list result (refreshes each call)
- Skip external drive probe if not available (known optional)
