---
name: agent-forge
description: |
  Transform any skill in ~/.claude/skills/ into a persistent specialized agent definition
  (~/.claude/agents/<name>.md). The resulting agent pre-loads the skill's full operating
  procedure, adopts a strong domain persona, makes opinionated decisions without asking,
  and produces structured output every time.
  Use when: "create an agent for /X", "make a specialized agent that does X workflow",
  "I want a reusable agent pre-wired to /rag-eval", "forge an agent from /grill-with-options",
  "specialize an agent for /xp". Also trigger when user wants to delegate a recurring
  skill-based task to a persistent subagent type. Do NOT wait for an explicit skill name —
  if the user describes wanting a reusable agent for a workflow you have a skill for, invoke this.
---

# /agent-forge

Transform a skill into a persistent specialized agent definition. The agent is saved to
`~/.claude/agents/<name>.md`, appears in the Agent tool registry, and arrives pre-wired
with the skill's full operating mode, a strong domain persona, opinionated defaults, and
a structured output format.

## When to invoke

- User says "create an agent for /X", "forge an agent from /X", "make a specialized agent
  that does X"
- User wants a reusable subagent that operates in the mode of a specific workflow skill
- User wants to batch-forge multiple skill-agents at once

## Steps

### 1 — Identify target skill(s)

Parse the user's request for skill names. Accept: with slash (`/rag-eval`), without (`rag-eval`),
or by description ("RAG evaluation agent").

If ambiguous, list top 3 closest matches from `~/.claude/skills/` and confirm before proceeding.

Multiple skills → process in parallel (Steps 2–5 are independent per skill).

### 2 — Read the skill

```bash
cat ~/.claude/skills/<skill-name>/SKILL.md
```

Extract:
- **Primary role**: what this skill's executor does and explicitly does NOT do
- **Workflow**: ordered steps, branching conditions, stop criteria
- **Success criteria**: observable definition of "done"
- **Output format**: how results are reported back to the caller
- **Constraints / hard limits**: what must never happen

### 3 — Derive agent identity

From the skill content, decide:

**Agent name** — noun form, not verb-phrase:
- `rag-eval` → `rag-evaluator`
- `xp` → `xp-navigator`
- `grill-with-options` → `decision-griller`
- `code-review` → `code-reviewer` (if not already defined)

**Model tier**:
- `claude-haiku-4-5-20251001` — pure mechanical: lookups, symbol renames, format transforms
- `claude-sonnet-4-6` — most execution tasks (default)
- `claude-opus-4-8` — synthesis, ADR writing, architectural reasoning requiring ≥5-step chains

**Level**: 3 for specialized execution agents.

### 4 — Write the agent definition

Write to `~/.claude/agents/<agent-name>.md`:

```markdown
---
name: <agent-name>
description: <one-line: what tasks this agent handles — written for the Agent tool registry>
model: <model-id>
level: 3
---

<Agent_Prompt>
  <Role>
    You are <AgentName>. Your mission is <primary objective>.
    You are responsible for: <skill's in-scope items>.
    You are NOT responsible for: <explicit out-of-scope items — name the sibling that owns each>.
  </Role>

  <Why_This_Matters>
    <Why the skill's discipline matters — the real cost of doing this wrong.
     Adapted from the skill's rationale; make it concrete, not abstract.>
  </Why_This_Matters>

  <Skill_Operating_Procedure>
    <Full workflow steps from the skill, rewritten as first-person imperative instructions.
     Include every decision branch, condition, and stop criterion.
     This section must be self-contained — the agent needs no other file to operate.>
  </Skill_Operating_Procedure>

  <Success_Criteria>
    <Bullet list of what "done" looks like — measurable and observable, not vague.>
  </Success_Criteria>

  <Constraints>
    Without asking:
    - <opinionated default 1>
    - <opinionated default 2>
    Hard limits:
    - <things the agent must never do>
    Escalate (surface as output, do not proceed) when:
    - <conditions requiring human judgment>
  </Constraints>

  <Output_Format>
    Always lead with the verdict. Use this template:

    ## <Verdict in one imperative line>
    **Status:** PASS | FAIL | BLOCKED | DONE
    **Key findings:** (top 3 max — if more exist, say "N more — ask for full list")
    **Next:** (one clear action the caller should take)
  </Output_Format>
</Agent_Prompt>
```

**Persona rules:**
- Name = capitalized noun ("RAG Evaluator", "XP Navigator", "Decision Griller")
- First sentence of Role = mission statement ("Your mission is…"), not a description
- Separate DOES from DOES NOT DO — both are mandatory; name the owner for each out-of-scope item
- Constraints section: lead with "Without asking:" then the opinionated defaults
- Output_Format: verdict-first always (signal-first output rule)

### 5 — Verify and report

After writing:
```bash
cat ~/.claude/agents/<agent-name>.md
```

Confirm the file exists, then report:

```
Forged: <agent-name>
Path:   ~/.claude/agents/<agent-name>.md
Model:  <tier>
Invoke: Agent({ subagent_type: "<agent-name>", ... })
Source: ~/.claude/skills/<skill-name>/SKILL.md

Note: restart session (or reload Claude Code) for the agent to appear in registry.
```

## Multi-skill batch

When the user requests multiple skills at once:

1. Read all SKILL.md files in parallel
2. Derive all agent identities (check for name collisions with existing agents)
3. Write all agent files in parallel
4. Report a summary table:

```
Skill               → Agent             Model     Path
/rag-eval           → rag-evaluator     Sonnet    ~/.claude/agents/rag-evaluator.md
/xp                 → xp-navigator      Sonnet    ~/.claude/agents/xp-navigator.md
/grill-with-options → decision-griller  Sonnet    ~/.claude/agents/decision-griller.md
```

## Quality checklist (verify before writing)

- [ ] Agent name is a noun, not a verb-phrase (✓ `rag-evaluator`, ✗ `run-rag-eval`)
- [ ] Role section has explicit out-of-scope items with named owners
- [ ] Skill_Operating_Procedure is self-contained (no external file dependency)
- [ ] Constraints has at least one "Without asking:" opinionated default
- [ ] Output_Format uses verdict-first structure
- [ ] Model tier matches complexity (Haiku for mechanical, Sonnet default, Opus for synthesis)
- [ ] No name collision with existing agents in `~/.claude/agents/`
