---
name: rtk-health
description: |
  Checks that no probe command returns EC=3 (ask-rule) from `rtk rewrite` after an rtk update.
  In bypassPermissions mode, EC=3 causes commands to silently drop rather than prompt — a
  regression that loses token savings without any visible error. Run this after every `rtk`
  version bump. Exits 0 if all 25 probes return EC=0/1/2. Exits 1 and lists affected commands
  if any return EC=3.

  TRIGGER when: rtk is updated or upgraded; "check rtk health"; "rtk ec=3"; "rtk silent drop";
  "after rtk update"; verifying rtk still works correctly.
type: local
---

# rtk-health

Verifies that a `rtk` version update hasn't introduced new EC=3 "ask-rule" rewrites that would
silently misbehave in `bypassPermissions` mode.

## Usage

```bash
bash ~/.claude/skills/rtk-health/check.sh
```

## What it checks

Runs `rtk rewrite "<cmd>"` on 25 representative probe commands across:
- File read operations (find, cat, grep, ls, head, stat)
- Git read + write operations
- GitHub CLI (gh pr/run commands)
- npm lifecycle commands
- Shell utilities (curl, jq)

| Exit code | Meaning | Health |
|---|---|---|
| 0 | Rewrite found, auto-allow | [OK] OK |
| 1 | No match, pass-through | [OK] OK |
| 2 | Deny rule, pass-through | [OK] OK |
| 3 | Ask rule — **silent-drop in bypassPermissions** | [FAIL] WARN |

## When to run

- After `rtk update` or `rtk upgrade`
- If `bypassPermissions` is enabled and commands seem to silently not execute
- Monthly as a sanity check

## If EC=3 is found

Two options:

1. **Bypass in `bash-prefilter.sh`**: add the command pattern to the pre-filter that
   skips rtk-rewrite for specific command shapes.

2. **Pin rtk version**: `rtk pin 0.34.1` (or whichever last-good version) until upstream
   removes the ask-rule for that command category.

The script exits 1 and lists all affected commands so the fix is targeted.
