#!/usr/bin/env bash
# UserPromptSubmit hook: pattern-match user prompt against composite skill triggers
# and inject a one-line "consider this composite" hint when a strong match is found.
#
# Cheap (<50ms): pure bash regex against keyword sets. Never blocks. Outputs JSON
# systemMessage that biases Claude toward invoking the composite.
#
# Composites take precedence over individual skills (composite-first principle in
# ~/.claude/standards/skill-auto-invoke.md).
set -uo pipefail
command -v jq &>/dev/null || exit 0

INPUT=$(cat 2>/dev/null || true)
PROMPT=$(printf '%s' "$INPUT" | python3 -c '
import json, sys
try:
  d = json.loads(sys.stdin.read() or "{}")
  print(d.get("prompt") or d.get("user_prompt") or "")
except Exception:
  print("")
' 2>/dev/null)

# Skip very short or very long prompts (signal too noisy)
LEN=${#PROMPT}
[ "$LEN" -lt 12 ] && exit 0
[ "$LEN" -gt 4000 ] && exit 0

# Lowercase for matching
P=$(printf '%s' "$PROMPT" | tr '[:upper:]' '[:lower:]')

# Match a composite. Order matters: more specific matches first.
# Each line: regex pattern → composite name → why
match_composite() {
  # PRODUCTION-IMPACTING (must come before debug-deep)
  if echo "$P" | grep -qE '\bprod\b.{0,15}\bdown\b|production.{0,15}(down|broken)|users.{0,15}(are )?reporting|sentry.{0,15}firing|prod incident|outage|hotfix.{0,20}prod|503|504|5[0-9][0-9] error'; then
    echo "incident-response|prod-impacting language detected"
    return 0
  fi

  # SHIP-TO-PRODUCTION (post-merge)
  if echo "$P" | grep -qE 'deploy (to )?prod|ship to prod|cut a release|release this|push to production|go live'; then
    echo "ship-it|deploy-to-prod intent"
    return 0
  fi

  # HOTFIX (must come before generic merge / incident-response already returned above)
  if echo "$P" | grep -qE '\bhotfix\b|emergency (fix|patch)|\bp0\b|\bsev-?[12]\b|cant wait for release|cannot wait for release|users cant .{0,20}right now'; then
    echo "hotfix|hotfix-bypass intent"
    return 0
  fi

  # RELEASE CUT (promote release → main, tag, deploy)
  if echo "$P" | grep -qE 'cut (the |a )?release|promote release|release-train|tag a version|ship the batch|release branch .{0,15}(to|into) main'; then
    echo "release-cut|release-cut intent"
    return 0
  fi

  # DEP SWEEP (bot PRs piled up)
  if echo "$P" | grep -qE 'dependabot|renovate|pre-commit-ci|bot prs|dep(endency)? (queue|updates|bumps)|update (the )?deps|clean up bot'; then
    echo "dep-sweep|bot-pr-queue intent"
    return 0
  fi

  # INCIDENT POST-MORTEM (Phase 3 of incident-response)
  if echo "$P" | grep -qE 'postmortem|post-mortem|incident review|what did we learn|incident write-?up|write up (the )?incident'; then
    echo "incident-response|postmortem intent (Phase 3)"
    return 0
  fi

  # BRANCH HYGIENE (stale branches + worktrees)
  if echo "$P" | grep -qE 'branch hygiene|clean up .{0,15}branches|prune .{0,15}branches|stale (branches|worktrees)|dead worktrees|git is a mess|too many branches|delete merged branches'; then
    echo "branch-hygiene|branch-cleanup intent"
    return 0
  fi

  # REPO BOOTSTRAP (set up release-branch workflow on a fresh/under-configured repo)
  if echo "$P" | grep -qE 'bootstrap (this |the )?repo|set up (the |a )?release(-| )branch|new repo setup|configure release workflow|make this repo work with /pr-to-release|init.{0,15}release(-| )workflow'; then
    echo "repo-bootstrap|repo-setup intent"
    return 0
  fi

  # VERIFY-BEFORE-DONE (must come before merge/ship intents — "is this ready to merge" is a readiness CHECK, not a merge action)
  if echo "$P" | grep -qE 'is this ready (to|for) (ship|merge|release)|can i (ship|merge|release) (this|now|it|yet)|verify (everything |all gates )?before (ship|merge|done|release)|double[- ]check before (ship|merge|release)|pre-?ship check|pre-?merge check'; then
    echo "verify-before-done|pre-ship-verification intent"
    return 0
  fi

  # MERGE PR — branches on presence of `release` branch on origin
  if echo "$P" | grep -qE 'merge this|merge the pr|ship this pr|ready to merge|can i merge|open (a )?pr|land this'; then
    # If we're in a repo with a `release` branch on origin, prefer pr-to-release.
    # Cheap probe: 1s timeout, swallow all errors. Falls back to merge-confidently.
    if command -v git &>/dev/null && \
       timeout 1 git ls-remote --heads origin release 2>/dev/null | grep -q .; then
      echo "pr-to-release|merge intent + release branch detected"
    else
      echo "merge-confidently|merge-pr intent (no release branch)"
    fi
    return 0
  fi

  # GREENFIELD MEGA-COMPOSITE (scope > 2 days)
  if echo "$P" | grep -qE 'build .{0,30}feature .{0,30}(from scratch|end[- ]to[- ]end|from zero)|implement .{0,30}feature .{0,30}end[- ]to[- ]end|greenfield'; then
    echo "feature-from-zero|greenfield-feature intent"
    return 0
  fi

  # TEST SUITE PROBLEMS
  if echo "$P" | grep -qE 'test suite.{0,40}(bad|bloated|slow|too many|broken)|too many tests|tests are slow|cleanup .{0,20}tests|prune .{0,20}tests|fix .{0,20}suite'; then
    echo "fix-the-suite|test-suite-fix intent"
    return 0
  fi

  # SEO + A11Y AUDIT — REMOVED 2026-06-10 (skill does not exist)
  # Previous route: (seo|accessibility|a11y).{0,40}(audit|check|review)|audit (my |the )?(site|website)|pre-launch (check|audit)
  # Reason: seo-a11y-audit skill not found in ~/.claude/skills/

  # SECURITY AUDIT
  if echo "$P" | grep -qE 'security (audit|sweep|review|check)|check for vulns|is .{0,20}safe to (deploy|ship)|vulnerability scan'; then
    echo "security-sweep|security-audit intent"
    return 0
  fi

  # WHOLE-PROJECT HEALTH
  if echo "$P" | grep -qE '(audit|health check) (this |the |my )?(repo|project|codebase)|is (this |the )?(repo|project) healthy|tech debt review'; then
    echo "audit-deep|project-health intent"
    return 0
  fi

  # MCP LIFECYCLE
  if echo "$P" | grep -qE 'mcp .{0,20}(audit|broken|failing|review)|claude mcp list|fix mcp|mcp servers'; then
    echo "mcp-care|mcp-lifecycle intent"
    return 0
  fi

  # ONBOARDING NEW REPO
  if echo "$P" | grep -qE '(just )?cloned|new repo|unfamiliar (repo|codebase)|what is (this|the) (repo|codebase)|onboard'; then
    echo "onboard-new-repo|first-touch-repo intent"
    return 0
  fi

  # DEBUGGING (intermittent / recurring → debug-deep, not basic systematic-debugging)
  if echo "$P" | grep -qE 'intermittent|sometimes (fails|breaks|works)|flaky|works locally.{0,20}(fails|breaks) in (ci|prod)|cant figure out|already tried'; then
    echo "debug-deep|deep-debug intent"
    return 0
  fi

  # REFACTORING (cross-module / large)
  if echo "$P" | grep -qE 'refactor .{0,30}(module|across|whole|entire)|restructure|extract .{0,30}(into|module)|consolidate|reorganize'; then
    echo "refactor-pipeline|cross-module-refactor intent"
    return 0
  fi

  # UI BUILD (new page/screen/component)
  if echo "$P" | grep -qE 'build.{0,40}(page|screen|component|dashboard|form|modal|layout|landing|ui)|design and (implement|build|code)|create.{0,30}(page|screen|component|ui)|new ui surface|implement.{0,30}(ui|page|screen|component)'; then
    echo "design-build|ui-build intent"
    return 0
  fi

  # RESEARCH/DECISION
  if echo "$P" | grep -qE 'should (we|i) use|x or y|evaluate (using|adopting|switching)|is .{0,30} worth (adopting|using|switching)|library choice|framework choice'; then
    echo "research-and-decide|decision-evaluation intent"
    return 0
  fi

  # KNOWLEDGE / RECALL / CAPTURE
  if echo "$P" | grep -qE 'remember (this|that)|save (this|that|where we are)|what did we (decide|do) about|where did we (leave|hit)|catch me up on|recall'; then
    echo "knowledge-loop|knowledge-capture-or-recall intent"
    return 0
  fi

  # SESSION BOOTSTRAP (start-of-day, catch-up)
  if echo "$P" | grep -qE 'where are we|what.{0,20}next|catch me up|good morning|just (got here|woke up)|whats? (the )?status'; then
    echo "session-bootstrap|session-startup-brief intent"
    return 0
  fi

  # BACKLOG (audit + plan for a repo)
  if echo "$P" | grep -qE 'build (a |the )?backlog|generate (a )?backlog|find gaps|find .{0,15}opportunit|refactor.{0,15}opportunit|what should i work on|what.{0,20}missing|audit and plan|comprehensive backlog|project audit and plan'; then
    echo "backlog|backlog-builder intent"
    return 0
  fi

  # DECIDE (research question → recommendation → ADR)
  if echo "$P" | grep -qE '\bdecide\b|research and decide|make a decision with adr|evaluate options and document|pick between|choose between'; then
    echo "decide|decision-research-and-document intent"
    return 0
  fi

  # TEST SWEEP (end-to-end test quality)
  if echo "$P" | grep -qE 'test sweep|clean up tests end-to-end|improve test quality|test quality pipeline|run a full test pass'; then
    echo "test-sweep|test-quality-improvement intent"
    return 0
  fi

  # PLAN TO ISSUES (convert plan file to GitHub issues)
  if echo "$P" | grep -qE 'convert plan to issues|create issues from plan|open issues for each task|plan to issues|issues from backlog'; then
    echo "plan-to-issues|plan-file-to-github intent"
    return 0
  fi

  # REPO STATE SNAPSHOT (capture current repo state)
  if echo "$P" | grep -qE 'snapshot.{0,20}(repo|state)|what changed.{0,20}(this session|since)|state diff'; then
    echo "repo-state-snapshot|repo-state-capture intent"
    return 0
  fi

  # HOOK EFFECTIVENESS (audit wired hooks)
  if echo "$P" | grep -qE 'hook .{0,20}(effectiveness|audit|broken|failing|review)|check (my |the )?hooks|wired hooks'; then
    echo "hook-effectiveness|hook-audit intent"
    return 0
  fi

  # SKILL EFFECTIVENESS AUDIT (scan for skill bail-outs)
  if echo "$P" | grep -qE 'skill .{0,20}(effectiveness|audit|failing|didnt (work|deliver))|why did (the )?skill|skill.{0,20}(failed|bail|didnt)'; then
    echo "skill-effectiveness-audit|skill-health-audit intent"
    return 0
  fi

  # CODE REVIEW (individual skill — senior-QA reviewer). High-precision: must name
  # code/diff/pr/module as the review target so it never shadows "audit the repo"
  # (audit-deep), "review the plan/design" (not code), or merge/verify intents above.
  if echo "$P" | grep -qE '\bcode[- ]?review\b|review (this|my|the|these) (code|change|changes|diff|pr|pull request|module|file|files|function|class|component)|(can|could|would) you review (this|my|the)|critique (this|my|the) (code|change|changes|diff|module)|look over (this|my|the) (code|change|changes|diff)|review my (code|changes|work|diff)'; then
    echo "code-review|code-review intent"
    return 0
  fi

  # ── Individual skills (non-composite). High-precision triggers, kept AFTER all
  #    composite matchers and BEFORE the broad scope-and-execute / parallel-phases
  #    catch-alls below, so a composite always wins when both could fit. ──

  # SENTRY — read-only prod-error inspection (NOT the incident-response skill)
  if echo "$P" | grep -qE 'check sentry|sentry (issue|issues|error|errors|event|events)|(summari[sz]e|show|pull|inspect|look at) [a-z ]{0,20}sentry|recent (prod|production) errors'; then
    echo "sentry|sentry-inspection intent"; return 0
  fi

  # SONARCLOUD preflight
  if echo "$P" | grep -qE 'sonar ?cloud|sonar (gate|scan|check|issues|hotspots|coverage)|quality gate (fail|status|check|red)'; then
    echo "sonar-check|sonar-preflight intent"; return 0
  fi

  # DEAD CODE / ORPHANS
  if echo "$P" | grep -qE 'dead code|unused (file|files|export|exports|code|deps|dependencies)|orphan(ed)? (file|files|code|module)|find orphans'; then
    echo "orphan-hunt|dead-code-scan intent"; return 0
  fi

  # TEST GENERATION (write tests for specific code)
  if echo "$P" | grep -qE 'write (unit |integration |e2e )?tests? for|add tests? for|generate tests?|cover [a-z ]{0,20}with tests'; then
    echo "generate-tests|test-generation intent"; return 0
  fi

  # ADR / DECISION RECORD
  if echo "$P" | grep -qE 'write (an |the )?adr|create (an |the )?adr|document (this|the|our) decision|record (this|the|our) decision|capture [a-z ]{0,15}decision|architecture decision record'; then
    echo "adr-write|adr-capture intent"; return 0
  fi

  # CHANGELOG
  if echo "$P" | grep -qE 'update (the )?changelog|changelog entry|add [a-z ]{0,15}changelog'; then
    echo "changelog-update|changelog intent"; return 0
  fi

  # PRISMA MIGRATION
  if echo "$P" | grep -qE 'prisma migrat|create (a )?migration|new (db |database |schema )?migration|generate (a )?migration|migrate the (schema|db|database)'; then
    echo "prisma-migrate|prisma-migration intent"; return 0
  fi

  # PERFORMANCE
  if echo "$P" | grep -qE 'performance audit|profile (this|the)[a-z ]{0,20}(code|function|endpoint|query|route)|find [a-z ]{0,15}(bottleneck|hot path)|why is [a-z ]{0,20}slow|optimi[sz]e [a-z ]{0,15}performance'; then
    echo "performance-audit|performance intent"; return 0
  fi

  # NAMING CONSISTENCY
  if echo "$P" | grep -qE 'naming (consistency|convention)|inconsistent (naming|names)|standardi[sz]e [a-z ]{0,15}(names|naming)'; then
    echo "naming-consistency|naming intent"; return 0
  fi

  # COUPLING / DEPENDENCY MAP
  if echo "$P" | grep -qE 'coupling (map|graph|analysis)|module (dependency|dependencies) (map|graph)|what depends on|dependency graph'; then
    echo "coupling-map|coupling intent"; return 0
  fi

  # CONFIG DRIFT
  if echo "$P" | grep -qE 'config(uration)? drift|gates? (drift|mismatch|conflict)|coverage threshold (conflict|mismatch|drift)'; then
    echo "config-drift-detect|config-drift intent"; return 0
  fi

  # HANDOFF / SESSION WRAP
  if echo "$P" | grep -qE 'hand ?off|wrap up (the |this )?session|save [a-z ]{0,15}(context|state) for (next|later)|context for next session'; then
    echo "handoff|session-handoff intent"; return 0
  fi

  # PARALLEL PHASED EXECUTION (specific — must come before scope-and-execute)
  if echo "$P" | grep -qE 'execute (the |this )?(plan|backlog)|work through (all |the |these )?(tasks|phases|issues)|dispatch (agents|subagents) (per |for each )(task|phase|issue)|parallelize (this |the )(plan|backlog|tasks|phases)|fan out (per |for each )(task|issue|phase)|run (all |these )?phases (in parallel|simultaneously)|tackle (all |these )?phases in parallel|swarm (over|on)|smart(ly)? dispatch.{0,15}(agents|subagents)|phases and tasks .{0,20}(clearly|laid out)'; then
    echo "parallel-phases|phased-plan-execution intent"
    return 0
  fi

  # OPEN-ENDED FEATURE WORK / SCOPE-AND-EXECUTE
  if echo "$P" | grep -qE 'fix the .{0,30}(area|module|module|feature|code)|implement .{0,30}(end[- ]to[- ]end)|build out|finish (the|this) (feature|module)|tackle .{0,30}(area|module)'; then
    echo "scope-and-execute|open-ended-scope intent"
    return 0
  fi

  return 1
}

result=$(match_composite)
[ -z "$result" ] && exit 0

composite=$(printf '%s' "$result" | cut -d'|' -f1)
reason=$(printf '%s' "$result" | cut -d'|' -f2)

# Individual (non-composite) skills routed by this hook. They get a plain
# "invoke this skill" hint — not the composite "don't run sub-skills" phrasing.
case "$composite" in
  code-review)
    jq -n --arg c "$composite" --arg r "$reason" \
      '{"systemMessage": (" Skill match: /\($c) — \($r). Invoke the /\($c) skill (senior-QA reviewer). Default = chat report; only post to a PR with an explicit --pr N --comment.")}'
    exit 0
    ;;
  sentry|sonar-check|orphan-hunt|generate-tests|adr-write|changelog-update|prisma-migrate|performance-audit|naming-consistency|coupling-map|config-drift-detect|handoff)
    jq -n --arg c "$composite" --arg r "$reason" \
      '{"systemMessage": (" Skill match: /\($c) — \($r). Invoke the /\($c) skill.")}'
    exit 0
    ;;
esac

# Emit a systemMessage hint. Claude reads this and is biased toward invoking the composite.
jq -n --arg c "$composite" --arg r "$reason" \
  '{"systemMessage": (" Composite match: /\($c) — \($r). Per skill-auto-invoke standard (composite-first principle), invoke /\($c) instead of running its sub-skills individually.")}'

exit 0
