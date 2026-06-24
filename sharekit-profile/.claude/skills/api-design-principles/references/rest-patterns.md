# REST API Patterns

## Pattern 1: Resource Collection Design

**Core principle:** Use resource nouns; let HTTP methods handle actions.

```python
# Good: Resource-oriented endpoints
GET    /api/users              # List users (with pagination)
POST   /api/users              # Create user
GET    /api/users/{id}         # Get specific user
PUT    /api/users/{id}         # Replace user
PATCH  /api/users/{id}         # Update user fields
DELETE /api/users/{id}         # Delete user

# Nested resources (1–2 levels max)
GET    /api/users/{id}/orders  # Get user's orders
POST   /api/users/{id}/orders  # Create order for user
GET    /api/users/{id}/orders/{orderId}  # Get specific order

# Bad: Action-oriented (avoid — HTTP methods are the verbs)
POST   /api/createUser
POST   /api/getUserById
POST   /api/deleteUser
GET    /api/getUserOrders
```

**HTTP Method Semantics (RFC 7231):**
- `GET`: Retrieve resources (idempotent, safe, cacheable)
- `POST`: Create new resources (not idempotent, not safe)
- `PUT`: Replace entire resource (idempotent, not safe)
- `PATCH`: Partial updates (not idempotent, not safe; use `If-Match` for conflicts)
- `DELETE`: Remove resources (idempotent, not safe)
- `HEAD`: Like GET but no body (for cache/freshness checks)

## Pattern 2: Pagination and Filtering

**Offset-based pagination (simple, stateless):**
```python
GET /api/users?page=1&page_size=20
GET /api/users?offset=0&limit=20
```

**Cursor-based pagination (scalable, handles deletions):**
```python
GET /api/users?after=<cursor>&limit=20
GET /api/users?before=<cursor>&limit=20
```

**Response structure:**
```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 250,
    "total_pages": 13,
    "has_next": true,
    "has_prev": false,
    "next_cursor": "eyJpZCI6IDEyMH0="
  }
}
```

**Filtering & search:**
```python
GET /api/users?status=active&created_after=2024-01-01&search=john
```

**OpenAPI definition (Swagger):**
```yaml
/api/users:
  get:
    parameters:
      - name: page
        in: query
        schema: { type: integer, minimum: 1, default: 1 }
      - name: page_size
        in: query
        schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
      - name: status
        in: query
        schema: { type: string, enum: [active, inactive] }
    responses:
      '200':
        content:
          application/json:
            schema: { $ref: '#/components/schemas/PaginatedUsers' }
```

## Pattern 3: Error Handling and Status Codes

**Consistent error response structure:**
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User with ID 123 not found",
    "details": {
      "resource_type": "User",
      "resource_id": "123"
    },
    "timestamp": "2024-06-22T10:30:00Z",
    "trace_id": "abc123def456"
  }
}
```

**Status code strategy:**
- `200 OK` — successful GET, PUT, PATCH
- `201 Created` — successful POST (include `Location` header with resource URL)
- `204 No Content` — successful DELETE or PATCH with no body
- `400 Bad Request` — validation error (malformed request body, invalid query params)
- `401 Unauthorized` — authentication missing/invalid
- `403 Forbidden` — authenticated but not authorized for this resource
- `404 Not Found` — resource doesn't exist
- `409 Conflict` — state conflict (e.g., duplicate unique field, race condition)
- `422 Unprocessable Entity` — semantic error (e.g., invalid state transition)
- `429 Too Many Requests` — rate limit exceeded
- `500 Internal Server Error` — unhandled exception
- `503 Service Unavailable` — intentional downtime or dependency failure

**Validation error response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request body validation failed",
    "details": {
      "errors": [
        { "field": "email", "message": "must be a valid email" },
        { "field": "age", "message": "must be >= 18" }
      ]
    }
  }
}
```

## Pattern 4: HATEOAS (Hypermedia As The Engine Of Application State)

**Links in responses guide client actions:**
```json
{
  "id": "user123",
  "name": "Alice",
  "email": "alice@example.com",
  "_links": {
    "self": {
      "href": "/api/users/user123",
      "method": "GET"
    },
    "orders": {
      "href": "/api/users/user123/orders",
      "method": "GET"
    },
    "update": {
      "href": "/api/users/user123",
      "method": "PATCH"
    },
    "delete": {
      "href": "/api/users/user123",
      "method": "DELETE"
    }
  }
}
```

**Benefits:** Clients discover endpoints dynamically; API can evolve URL structure without breaking clients.

**Downside:** Larger payloads, more complex parsing. Use when hypermedia discovery is valuable (public APIs, evolving contracts).

## Pattern 5: Content Negotiation

**Request (client specifies desired format):**
```
GET /api/users/123
Accept: application/json
```

**Response:**
```
Content-Type: application/json
Content-Language: en-US
```

**Versioning via Accept header (media-type versioning):**
```
Accept: application/vnd.api+json; version=2
Accept: application/vnd.company.v2+json
```

## Pattern 6: Idempotency

**Problem:** Retries on transient failures (network timeout, 5xx) can cause duplicate creates.

**Solution:** Idempotency key header (client-generated UUID, persisted server-side):
```
POST /api/users
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000

# Retry with same key → same response (cached), no duplicate
```

**Common for:** Payment processing, order creation, fund transfers.

## Best Practices Checklist

- [ ] Use plurals for collections (`/users`, not `/user`)
- [ ] Nest resources ≤2 levels deep
- [ ] Use HTTP verbs per RFC semantics
- [ ] Implement pagination for large lists (default page_size 20–50)
- [ ] Consistent error response format
- [ ] Version your API from day one (URL, header, or query param)
- [ ] Document all endpoints in OpenAPI/Swagger
- [ ] Support filtering, sorting, searching on common fields
- [ ] Return `201 Created` + `Location` header on POST
- [ ] Use `If-Match` (ETag) for optimistic concurrency control
- [ ] Implement rate limiting (X-RateLimit-* headers)
- [ ] Require HTTPS for all endpoints
- [ ] Use snake_case or camelCase consistently (never mix)

## Anti-Patterns to Avoid

- Verb-based endpoints (`/api/getUserById` → use `GET /api/users/{id}`)
- Inconsistent status codes (200 for errors, 201 for success-but-also-errors)
- Ignoring idempotence (POST, PUT should be idempotent if client retries)
- Tight coupling to database schema (API structure ≠ DB table structure)
- Missing rate limits (APIs without limits invite abuse)
- Vague error messages ("Error" → include code + context)
