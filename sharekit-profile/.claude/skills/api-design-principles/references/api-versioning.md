# API Versioning Strategies

## Strategy 1: URL Path Versioning

**Format:** `/api/v1/...`, `/api/v2/...`

**Advantages:**
- Explicit, easy to read
- Cache-friendly (different URLs = different cache entries)
- Client clearly knows which version they're using
- Easy to route to different code paths

**Disadvantages:**
- Duplicate code (both v1 and v2 handlers in codebase)
- URL bloat (all v1 docs are separate from v2 docs)
- Migration burden (clients must change URLs)

**Example:**
```
GET /api/v1/users              # v1 endpoint
GET /api/v2/users              # v2 endpoint (perhaps different response shape)
```

**Use when:** Backward compatibility is critical and you can afford to host multiple versions.

## Strategy 2: Header Versioning

**Format:** Custom HTTP header specifies version.

```
GET /api/users
Accept: application/vnd.api+json; version=1
Accept: application/vnd.company.v2+json

OR

X-API-Version: 2
```

**Advantages:**
- Single URL for all versions (cleaner URI space)
- Explicit negotiation (like content negotiation)
- Version lives in HTTP metadata, not URL path

**Disadvantages:**
- Not cacheable by default (headers vary per request)
- Less obvious (client must know to set header)
- Hard to test in browser (can't put header in address bar)

**Example:**
```http
GET /api/users HTTP/1.1
Host: api.example.com
Accept: application/vnd.api+json; version=2

# Response
HTTP/1.1 200 OK
Content-Type: application/vnd.api+json; version=2
```

**Use when:** You have many versions and want a clean URL surface.

## Strategy 3: Query Parameter Versioning

**Format:** `/api/users?version=2`

**Advantages:**
- Single URL
- Cacheable (version is part of query, which can be cached)
- Client can upgrade without URL change
- Easy to test

**Disadvantages:**
- Can be overlooked (might request /users and not realize version)
- Pollutes query namespace

**Example:**
```
GET /api/users?version=2&page=1
```

**Use when:** You want flexibility and simpler client experience.

## Strategy 4: No Explicit Versioning (Hypermedia + Deprecation)

**Approach:** Single `/api/users` endpoint; use `@deprecated` in GraphQL or deprecation headers in REST; clients discover changes via hypermedia or schema introspection.

**Advantages:**
- No version proliferation
- Clients self-discover new fields / deprecations
- Forces API to evolve gracefully

**Disadvantages:**
- Requires client smarts (introspection, link following)
- Harder for third-party integrations
- Deprecation must be handled explicitly

**Example (REST hypermedia):**
```json
{
  "id": "123",
  "name": "Alice",
  "_links": {
    "self": { "href": "/api/users/123" },
    "orders": { "href": "/api/users/123/orders" }
  }
}
```

**Example (GraphQL deprecation):**
```graphql
type User {
  id: ID!
  name: String!
  email: String! @deprecated(reason: "Use emailAddress instead")
  emailAddress: String!
}
```

**Use when:** Building an internal or highly-evolved public API where clients can adapt quickly.

## Deprecation & Sunset Timeline

Once versioning strategy is chosen, define a clear sunset window:

**Example timeline (REST):**
```
v1 released: Jan 2024
v2 released: Jun 2024
v1 deprecated: Dec 2024 (announce: v1 sunset in 6 months)
v1 sunset: Jun 2025 (v1 endpoints return 410 Gone or 400 BadRequest with redirect)
```

**Deprecation header (REST):**
```
HTTP/1.1 200 OK
Content-Type: application/json
Deprecation: true
Sunset: Wed, 21 Jun 2025 00:00:00 GMT
Link: </api/v2/users>; rel="successor-version"

[response body]
```

**GraphQL deprecation directive:**
```graphql
type User {
  legacyEmail: String @deprecated(reason: "Use email instead. Sunset: 2025-06-21")
  email: String!
}
```

## Backward Compatibility (Within a Version)

Even within v1, maintain backward compatibility by:
- Adding new fields instead of removing old ones
- Adding new query parameters (don't break existing queries)
- Using deprecation directives before removing anything
- Documenting the sunset date clearly

**Example (adding a field):**
```json
{
  "id": "123",
  "name": "Alice",
  "newField": "value"  # Safe addition (old clients ignore it)
}
```

**Example (deprecating a field):**
```json
{
  "id": "123",
  "name": "Alice",
  "oldField": "value",  # Keep for now, marked deprecated in docs
  "newField": "value"   # Recommended replacement
}
```

## Implementation Pattern: Version Router

**REST (FastAPI):**
```python
from fastapi import FastAPI, APIRouter, Header
from typing import Optional

v1_router = APIRouter(prefix="/api/v1")
v2_router = APIRouter(prefix="/api/v2")

@v1_router.get("/users/{user_id}")
async def get_user_v1(user_id: str):
    """v1 response format."""
    user = await fetch_user(user_id)
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email
    }

@v2_router.get("/users/{user_id}")
async def get_user_v2(user_id: str):
    """v2 response format (different schema)."""
    user = await fetch_user(user_id)
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "emailVerified": user.email_verified_at is not None,
        "role": user.role  # New field in v2
    }

app = FastAPI()
app.include_router(v1_router)
app.include_router(v2_router)
```

**GraphQL (with schema stitching):**
```python
from ariadne import make_executable_schema, QueryType

# Define separate schemas for each version
v1_schema = """
type Query {
  user(id: ID!): User
}
type User {
  id: ID!
  name: String!
  email: String!
}
"""

v2_schema = """
type Query {
  user(id: ID!): User
}
type User {
  id: ID!
  name: String!
  email: String!
  emailVerified: Boolean!
  role: String!
}
"""

# Route requests based on version header
def version_from_request(request):
    return request.headers.get("X-API-Version", "1")

# Build schema at request time or serve separate endpoints
```

## Decision Tree

```
Question: How often do you break backward compatibility?
├─ Rarely (< 1 breaking change/year)
│  └─ Use URL versioning (/api/v1, /api/v2) — explicit, easy
├─ Occasionally (1–2/year)
│  └─ Use Header versioning — cleaner URLs, explicit negotiation
├─ Frequently (> 2/year) OR all clients are internal
│  └─ Use Query param versioning OR no versioning with deprecation
└─ API is GraphQL
   └─ Use schema-level deprecation (@deprecated) + no explicit version
```

## Best Practices

- [ ] **Commit to a versioning strategy from day one** (don't add versioning after breaking changes)
- [ ] **Define sunset window explicitly** (12–24 months for public APIs is standard)
- [ ] **Maintain backward compatibility within a version** (add new fields, don't remove old ones)
- [ ] **Document the version** in all communications (API reference, SDK READMEs, changelog)
- [ ] **Test both versions** if supporting multiple versions simultaneously
- [ ] **Use deprecation headers/directives** before removing any field or endpoint
- [ ] **Communicate deprecation early** (email, changelog, in-app notices)
