---
name: api-design-principles
description: |
  Design intuitive, scalable REST or GraphQL APIs by mastering core principles,
  versioning strategies, and error-handling patterns. Use when designing new APIs,
  reviewing API specs, establishing API standards, or migrating between paradigms.
metadata:
  owner: global-agents
  tier: contextual
  progressive_disclosure: split
---

# API Design Principles

Build APIs that delight developers: intuitive contract, scalable, version-safe, and well-documented.

## When to Use This Skill

- Designing new REST or GraphQL APIs from scratch
- Refactoring or auditing existing API contracts
- Establishing API design standards for a team
- Reviewing API specifications before implementation
- Migrating between API paradigms (REST ↔ GraphQL)
- Creating developer-friendly API documentation
- Optimizing for specific use cases (mobile, third-party integrations, real-time)

## Workflow

### Step 1: Clarify API Requirements

Define scope before designing:
- **Data model**: What entities/resources does the API expose?
- **Operations**: CRUD only, or complex state transitions (e.g., order fulfillment)?
- **Clients**: Mobile, browser, server-to-server, third-party integrations?
- **Scale**: Expected QPS, data volume, latency SLAs?
- **Real-time needs**: Polling, subscriptions, webhooks, or fetch-on-demand?

**Done when:** Requirements documented and API paradigm (REST / GraphQL / hybrid) chosen.

### Step 2: Choose Paradigm & Reference Patterns

**REST** (resource-oriented, stateless, simple caching):
- Load `references/rest-patterns.md` for endpoint naming, HTTP method semantics, pagination, filtering.
- Load `references/rest-error-handling.md` for status code strategy.

**GraphQL** (graph-structured, single endpoint, client-driven):
- Load `references/graphql-patterns.md` for schema design, resolver architecture, N+1 prevention via DataLoaders, cursor-based pagination.

**Hybrid** (REST + GraphQL, gRPC, etc.):
- Load paradigm-specific references; coordinate versioning via `references/api-versioning.md`.

**Done when:** Paradigm selected and relevant references reviewed.

### Step 3: Design API Contract

Apply patterns from Step 2:

**For REST:**
- Name resources (plurals: `/users`, `/orders`), not actions.
- Nest resources only 1–2 levels deep (`/users/{id}/orders`, not `/users/{id}/orders/{id}/items/{id}/comments`).
- Use HTTP methods per RFC 7231 semantics (GET = safe + idempotent, POST = create, PUT = replace, PATCH = partial, DELETE).
- Plan pagination defaults (page size, cursor format) from `references/rest-patterns.md` Pattern 2.

**For GraphQL:**
- Define types before resolvers (`references/graphql-patterns.md` Schema Design).
- Use Relay-style cursor pagination for large result sets.
- Plan DataLoaders to prevent N+1 (resolve multiple relationships per query).

**For versioning:**
- Choose strategy (URL, header, query param) from `references/api-versioning.md`.
- Document deprecation timeline (e.g., v1 sunset in 12 months).

**For errors:**
- Use consistent structure (error code, message, optional context).
- Load paradigm-specific error payload examples from `references/rest-error-handling.md` or `references/graphql-error-handling.md`.

**Done when:** API contract documented (endpoint list + request/response shapes for REST; full schema for GraphQL).

### Step 4: Review Against Checklist

Run pre-implementation audit via `assets/api-design-checklist.md`:
- Naming consistency?
- Versioning strategy clear?
- Error payloads standardized?
- Pagination limits set?
- Rate limiting policy defined?
- Documentation plan (OpenAPI, Swagger, schema introspection)?

**Done when:** Checklist passing or blockers surfaced explicitly.

### Step 5: Document & Communicate

- **REST**: Generate OpenAPI 3.0 spec (Swagger UI for interactive docs).
- **GraphQL**: Publish schema + link to GraphQL Playground or Apollo Studio.
- Include example requests/responses (from `references/examples.md` for common patterns).
- Publish deprecation & versioning policy.

**Done when:** Documentation live and developers can onboard without asking questions.

## Core Principles (Reference Summary)

**REST Foundation** — See `references/rest-patterns.md`:
- Resource-oriented: nouns, not verbs.
- HTTP methods respect RFC semantics.
- Stateless: each request self-contained.

**GraphQL Foundation** — See `references/graphql-patterns.md`:
- Schema-first design.
- Single endpoint, multiple operations.
- Client specifies exactly what it needs.

**Shared Concerns** — See `references/api-versioning.md`:
- Versioning strategy baked in from day one.
- Consistent error formats.
- Pagination for large datasets.

## Outputs / Evidence

Return:
- API contract (endpoint list + schemas, or GraphQL schema).
- Versioning strategy & deprecation timeline.
- Error handling specification.
- OpenAPI spec or schema artifact.
- Blockers (if requirements unclear or design conflicts detected).

## Failure / Stop Conditions

- Stop if data model is not defined — return blocker and ask for requirements.
- Stop if API paradigm choice is ambiguous (HATEOAS vs. pure REST, Federation vs. single graph) — return decision tree from relevant reference and ask which constraint matters most.
- Stop if no documentation tool (OpenAPI, GraphQL SDL) is chosen — surface and halt.
- Do not proceed if external drive is unmounted (references cached there); verify via `mount | grep -q "${EXTERNAL_HD}"`.

## Auto-Chain Guidance

After Step 5 (documentation):
- If API is public-facing or team-critical: chain `/code-review` for specification audit.
- If implementing immediately: chain `/tdd` or `/test-engineer` to design tests before code.
