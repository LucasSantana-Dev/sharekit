# Dependency Scout — Reference

## Boilerplate category catalog

Grep heuristics → the ecosystem-standard package(s) to consider. These are *candidates to
vet*, not blanket recommendations — always run `scripts/vet-package.sh` and check fit.

| Category | Grep / smell signals | Candidates to vet |
|---|---|---|
| Retry / backoff | `for.*attempt`, `setTimeout.*retry`, `maxRetries`, manual exponential delay | `p-retry`, `async-retry`, `cockatiel` |
| Rate limiting | hand-rolled token bucket, `Map<ip, timestamps>` | `express-rate-limit`, `bottleneck`, `rate-limiter-flexible` |
| Schema / input validation | manual `typeof`/`if (!x)` gauntlets, regex type checks | `zod`, `valibot`, `@sinclair/typebox` |
| Multipart / file upload | manual `busboy`, boundary parsing | `multer` (2.x), `formidable`, `@fastify/multipart` |
| CSV / spreadsheet | manual `split(',')`, quote handling | `papaparse`, `csv-parse`, `fast-csv` |
| Date / time | manual ms math, `getTime()` arithmetic, custom format | `date-fns`, `dayjs`, `luxon` |
| Env parsing / config | `process.env.X ?? default` scattered, ad-hoc coercion | `zod` + `dotenv`, `envalid`, `@t3-oss/env-core` |
| HTTP client / fetch wrap | repeated `fetch` + retry + timeout + JSON glue | `ky`, `axios`, `undici`, `got` |
| Caching / memo | hand-rolled `Map` TTL cache | `lru-cache`, `quick-lru`, `@isaacs/ttlcache` |
| Queue / concurrency | manual promise pool, `Promise.all` chunking | `p-limit`, `p-queue`, `piscina` |
| Deep merge / clone | recursive merge/clone helpers | `deepmerge`, `klona`, native `structuredClone` |
| Debounce / throttle | custom timer closures | `just-debounce-it`, `throttle-debounce` (or framework hooks) |
| String utils | custom slugify, kebab/camel case | `slugify`, `change-case`, `nanoid`/`ulid` for ids |
| Object/array utils | reimplemented groupBy/pick/omit/uniq | native (`Object.groupBy`, `Map.groupBy`), `remeda`, `radash` |
| Logging | `console.*` wrappers with levels/redaction | `pino`, `winston` |
| Discord/Express/Prisma adapters | bespoke REST glue duplicated across files | a shared internal adapter first; library only if it fits |

Native-first: before adding a lib, check if a modern runtime built-in covers it
(`structuredClone`, `Object.groupBy`, `Array.prototype.at`, `crypto.randomUUID`,
`AbortSignal.timeout`, `URL`/`URLSearchParams`). No dependency beats no dependency.

## Vetting rubric (what the script measures + how to read it)

| Signal | Source | Healthy | Disqualify |
|---|---|---|---|
| Last publish | `npm view <p> time.modified` | < 12 mo | > ~18 mo (abandoned) |
| Deprecated | `npm view <p> deprecated` | empty | any value → reject |
| Adoption | npm downloads API (last-week) | category-relative high | trivial / near-zero |
| License | `npm view <p> license` | MIT/ISC/Apache-2.0/BSD | unknown / copyleft if it matters |
| Maintenance | release cadence, open-issue ratio (manual) | active | stale, unanswered security issues |
| Security | `osv-scanner` / `npm audit` post-trial | no high/critical | unpatched high/critical |
| Dep weight | `npm view <p> dependencies` | few/zero | heavy transitive tree |

Security note: cheap pre-install signals are *deprecation* + *recency* + *adoption*. True
advisory data needs `osv-scanner` or `npm audit` against an installed tree — recommend it
as a follow-up gate before merge, not a blocker on the proposal.

## ROI scoring

```
roi = (loc_removed + risk_offloaded) / (adoption_cost + dep_weight + lock_in)
```
- `loc_removed`: lines of hand-rolled code the lib retires (proxy for maintenance burden).
- `risk_offloaded`: high if the boilerplate handles security/edge-cases poorly (e.g. naive
  multipart, custom crypto, hand-rolled rate-limit).
- `adoption_cost`: migration churn + test rewrites.
- `dep_weight`: transitive footprint + bundle/runtime cost (matters more on frontend).
- `lock_in`: how hard to swap out later.

Rank desc; surface top 3 inline.

## Interplay with other skills / standards

- Adoption that is also an architectural decision → `/research-and-decide` (don't decide here).
- Version bumps of already-adopted deps follow the dependabot/Renovate split policy.
- This skill is read-only on application code AND on manifests — it never installs.
