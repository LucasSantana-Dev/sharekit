# sharekit

CLI (`@lucassantana/sharekit`) that installs, previews and rolls back a shared AI coding setup
from a `sharekit-profile` repo. TypeScript, Node >= 20, sources in `src/`, tests in `test/`.

## Commands

| Task         | Command                |
| ------------ | ---------------------- |
| Install deps | `npm ci`               |
| Type-check   | `npm run typecheck`    |
| Test         | `npm test`             |
| Format check | `npm run format:check` |
| Build        | `npm run build`        |

Run type-check, tests and format check before opening a PR.

## Rules

The operator rules live in the `sharekit-profile` repo: `claude/CLAUDE.md`, `RULES.md` and
`claude/standards/`. Follow them. The ones most often missed:

- No AI attribution anywhere: no `Co-Authored-By`, `Claude-Session`, "Generated with" lines or
  session links in commits, PRs, issues, comments or releases.
- Never write the em-dash or en-dash. Use a period, comma, colon or parentheses.
- Conventional commits. Never push to `main`; every change goes through a PR.
- Never automate any action on a PR opened or commented on by another person (bots do not count).
