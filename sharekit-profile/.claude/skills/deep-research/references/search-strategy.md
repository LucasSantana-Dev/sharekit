# Search Strategy: Multi-Angle, Multi-Source

## The Four Angles (Step 2)

Every topic splits into these four orthogonal views. Hit ≥3 angles, 2+ sources each.

| Angle | Questions | Why | Sources |
|-------|-----------|-----|---------|
| **How it works** | Mechanism? Architecture? What does it do under the hood? | Needed to assess correctness, tradeoffs, fit. | Official docs, research papers, code, tutorials. |
| **Alternatives** | What else exists? When do you use A vs. B? Tradeoffs? | Needed to contextualize — is this the right tool for the job? | Comparisons, benchmarks, GitHub discussions, case studies. |
| **Failure modes** | Known issues? Edge cases? When does it break? | Needed to anticipate production risk. | GitHub issues, bug reports, StackOverflow, incident postmortems. |
| **Current state** | Is it mature? Abandoned? Recent changes? Popularity? | Needed to assess support & future viability. | Changelog, commit history, adoption stats, community size, latest version date. |

## Source Hierarchy (within each angle)

1. **Official/authoritative** — Docs, whitepapers, API references, author's own post
2. **Peer-reviewed** — Academic papers, O'Reilly books, established tech media
3. **Community** — GitHub issues, StackOverflow, blog posts, conference talks
4. **Summary** — News aggregators, list articles, Medium hot-takes (verify against #1–2)

## Query Variations (don't accept first result)

For each angle, use ≥2 query phrasings:

```
How it works:
  - "X architecture"
  - "how X works internally"
  - "X implementation details"

Alternatives:
  - "X vs. Y comparison"
  - "alternatives to X"
  - "when to use X"

Failure modes:
  - "X limitations"
  - "X known issues"
  - "X gotchas"

Current state:
  - "X latest version"
  - "X adoption 2024"
  - "X maintenance status"
```

## Search Order (per angle)

1. **Codebase** (if applicable)
   - Grep for symbol, test cases, examples
   - Read the README, CONTRIBUTING.md
   - Check the issue tracker (closed + open)

2. **Official docs** (Context7 MCP for libraries)
   - API reference, guides, FAQ
   - Release notes + changelog
   - Author's blog/talks

3. **Web search** (fresh data, adoption, comparison)
   - News + announcements
   - Benchmarks + performance studies
   - Case studies + production experiences

4. **GitHub** (details + workarounds)
   - Issues (esp. closed ones; learn what was hard)
   - Discussions (design rationale)
   - Stars/forks/contributor count (rough gauge of adoption)

## Date-Stamping Rules

- **Documentation:** note the version; if >3 years old and major release happened since,
  mark as potentially stale.
- **Blog posts:** note the date; articles >2 years old get footnoted unless explicitly
  about "history" or "fundamentals."
- **GitHub:** note the latest commit date; if inactive >12 months, mark "maintenance unclear."
- **News:** verify the date; breaking-news takes precedence over old summaries.

## Red Flags (source skepticism)

Downgrade a source if:
- [ ] Author is not the official maintainer AND claims to speak for the project
- [ ] Article/video title overstates the claims (clickbait)
- [ ] No date or version mentioned
- [ ] Entirely based on third-party summaries (not original research)
- [ ] Contradicts multiple authoritative sources without explaining why
- [ ] Language is vague ("some say", "allegedly", "it might be")

## Example: Researching "Should we use React Query?"

| Angle | Queries | Sources |
|-------|---------|---------|
| **How it works** | "React Query architecture", "how React Query manages cache" | Official docs (tanstack.com), YouTube tutorial by Tanner Linsley, read `src/` in repo |
| **Alternatives** | "React Query vs SWR", "React Query vs TanStack Query", "data fetching patterns React" | TanStack docs comparison section, Kent C. Dodds blog post, recent HN threads |
| **Failure modes** | "React Query common issues", "React Query gotchas", GitHub issues `label:bug` | GitHub issues (esp. closed), StackOverflow tagged [react-query], author's issue resolution patterns |
| **Current state** | "React Query latest version 2024", "React Query adoption stats", "React Query maintenance" | GitHub releases + dates, npm download trends, recent commits, community size (Discord, contributors) |

Result: 4 angles × ~3 queries × ~2 sources = ~24 pieces of data before synthesis.
