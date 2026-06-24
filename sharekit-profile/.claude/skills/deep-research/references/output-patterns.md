# Output Patterns

## Signal-First Report (standard 5-part form)

Use this template when all synthesis gates pass:

```markdown
# Research Report: <topic>

## Verdict
<1-2 sentence summary of the answer — what's true, what's unclear>

## Top 3 Findings
1. [Key fact] — [Source: Author/URL, date]
2. [Key fact] — [Source: Author/URL, date]
3. [Key fact] — [Source: Author/URL, date]

For full findings, ask: "What else did the research uncover?"

## Contradictions & Reconciliation
[Include only if contradictions were found. Use template from Step 4 in SKILL.md]

## Uncertainties
- [What remains unclear or unverified]
- [Gaps that would require further investigation]
- [Claims that depend on out-of-scope info]

## Recommendation
<Actionable next steps based on findings — who should do what, with what constraints>

## Source Index
- "[Article Title](https://...)" — Author/org, publication date, authority level
- "[Documentation](https://...)" — Official, dated, section reference
- "[GitHub Issue #123](https://...)" — Community/author, date, resolution status
```

## Blocker Output (when gates fail)

Use this format — do NOT emit a report:

```
BLOCKED: <Gate failure — e.g., "Synthesis gate: fewer than 3 angles explored">

Missing: 
  - [What would resolve it]
  - [Any other gaps]

Next:
  - [If user clarifies scope: ...]
  - [If mounting External HD: ...]
  - [Fallback: ...]
```

## Minimal Report (when time/scope is tight)

If the user asks for a "quick" or "snapshot" research pass:

```markdown
# Quick Research: <topic>

**Verdict:** [1 sentence]

**Key Finding:** [1-2 facts with inline source]

**Ask for:** Full report + uncertainties (if needed)
```

Still verify contradictions and hit the synthesis gate—just emit fewer dimensions.

## Citing Sources Inline

Preferred format for facts in any section:

```markdown
- [Fact about X] — [Author/Org](https://url), [date/version]
- [Fact about Y] — [Official Docs](https://url), Section 3.2, v2.1+
- [Fact about Z] — [GitHub Issue #42](https://url), resolved in v1.5.0
```

Never: "According to the internet, X is true." Always: URL + author + date.
