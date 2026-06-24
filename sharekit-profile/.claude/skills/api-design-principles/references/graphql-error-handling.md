# GraphQL Error Handling

## Error Handling Philosophy

GraphQL is **different** from REST: even a valid query can return partial success.

**Problem:** Query fails deep in resolution (e.g., permission denied on one field).
- REST: Would return 401 or 403 for the entire request.
- GraphQL: Returns the requested fields that resolved, `null` for ones that failed, and errors in the `errors` array.

**This means:** Client must always check both `data` and `errors` in the response.

## Response Structure

**Valid query, all fields resolved:**
```json
{
  "data": {
    "user": {
      "id": "123",
      "name": "Alice",
      "orders": [...]
    }
  }
}
```

**Valid query, partial success (permission denied on orders):**
```json
{
  "data": {
    "user": {
      "id": "123",
      "name": "Alice",
      "orders": null
    }
  },
  "errors": [
    {
      "message": "Not authorized to view orders",
      "extensions": {
        "code": "FORBIDDEN",
        "field": "User.orders"
      }
    }
  ]
}
```

**Mutation with field-level errors (validation failed):**
```json
{
  "data": {
    "createUser": {
      "user": null,
      "errors": [
        {
          "field": "email",
          "message": "Email already exists"
        },
        {
          "field": "age",
          "message": "Age must be >= 18"
        }
      ]
    }
  }
}
```

**Query parsing or validation error (malformed query):**
```json
{
  "errors": [
    {
      "message": "Expected Name, found }",
      "locations": [{ "line": 2, "column": 5 }]
    }
  ]
}
```

## Error Structure (GraphQL Spec)

```json
{
  "message": "Error message",
  "locations": [
    { "line": 1, "column": 3 }
  ],
  "path": ["user", "orders", 0],
  "extensions": {
    "code": "ERROR_CODE",
    "field": "Field.name",
    "details": {}
  }
}
```

- `message`: Human-readable error text
- `locations`: Position in the query where error occurred
- `path`: Resolver path (which field caused the error)
- `extensions`: Custom fields for error context
  - `code`: Machine-readable error type (BAD_REQUEST, FORBIDDEN, etc.)
  - `field`: Which field threw the error
  - `details`: Additional context (validation errors, resource IDs, etc.)

## Common Error Codes

```
# Input validation
BAD_REQUEST           — Malformed query/variables
VALIDATION_ERROR      — Semantic validation failed (e.g., age < 18)

# Authentication & authorization
UNAUTHENTICATED       — User not logged in
FORBIDDEN             — User not authorized for this resource

# Resource errors
NOT_FOUND             — Resource doesn't exist
CONFLICT              — State conflict (unique constraint, race condition)
INTERNAL_ERROR        — Server exception
```

## Mutation Error Pattern: Payload with Errors

**Schema:**
```graphql
type Mutation {
  createUser(input: CreateUserInput!): CreateUserPayload!
}

type CreateUserPayload {
  user: User
  errors: [UserError!]
}

type UserError {
  field: String!
  message: String!
  code: String!
}
```

**Resolver:**
```python
@mutation.field("createUser")
async def resolve_create_user(obj, info, input: dict) -> dict:
    """Create user with error handling."""
    errors = []
    
    # Validate email
    if not is_valid_email(input["email"]):
        errors.append({
            "field": "email",
            "message": "Invalid email format",
            "code": "INVALID_EMAIL"
        })
    
    # Check age
    if input.get("age", 0) < 18:
        errors.append({
            "field": "age",
            "message": "Age must be >= 18",
            "code": "INVALID_AGE"
        })
    
    # Check unique constraint
    if not errors:
        existing = await db.fetch_user_by_email(input["email"])
        if existing:
            errors.append({
                "field": "email",
                "message": "Email already registered",
                "code": "UNIQUE_CONSTRAINT"
            })
    
    if errors:
        return {
            "user": None,
            "errors": errors
        }
    
    try:
        user = await db.create_user(
            email=input["email"],
            name=input["name"],
            age=input["age"]
        )
        return {
            "user": user,
            "errors": []
        }
    except Exception as e:
        logger.error(f"Failed to create user: {e}")
        return {
            "user": None,
            "errors": [
                {
                    "field": None,
                    "message": "Internal server error",
                    "code": "INTERNAL_ERROR"
                }
            ]
        }
```

**Client query:**
```graphql
mutation {
  createUser(input: { email: "alice@example.com", name: "Alice", age: 16 }) {
    user {
      id
      email
      name
    }
    errors {
      field
      message
      code
    }
  }
}
```

**Response (validation succeeded, but business logic failed):**
```json
{
  "data": {
    "createUser": {
      "user": null,
      "errors": [
        {
          "field": "age",
          "message": "Age must be >= 18",
          "code": "INVALID_AGE"
        }
      ]
    }
  }
}
```

## Field-Level Resolver Errors

**Schema:**
```graphql
type User {
  id: ID!
  name: String!
  email: String!
  orders: [Order!]!  # Throws on permission denied
}
```

**Resolver (throws exception if not authorized):**
```python
@user_type.field("orders")
async def resolve_user_orders(user: dict, info) -> List[dict]:
    """Fetch user's orders."""
    # Check permission
    current_user_id = get_current_user_id(info)
    if current_user_id != user["id"]:
        # Raise GraphQL error with custom code
        raise GraphQLError(
            message="Not authorized to view orders",
            extensions={
                "code": "FORBIDDEN",
                "field": "User.orders"
            }
        )
    
    return await db.fetch_orders_by_user(user["id"])
```

**Response (user field succeeds, orders field fails):**
```json
{
  "data": {
    "user": {
      "id": "123",
      "name": "Alice",
      "email": "alice@example.com",
      "orders": null
    }
  },
  "errors": [
    {
      "message": "Not authorized to view orders",
      "path": ["user", "orders"],
      "extensions": {
        "code": "FORBIDDEN",
        "field": "User.orders"
      }
    }
  ]
}
```

## Implementation (Ariadne + Python)

```python
from ariadne import graphql_sync, make_executable_schema, QueryType, MutationType
from ariadne.graphql import GraphQLError

query = QueryType()
mutation = MutationType()

@mutation.field("createUser")
async def resolve_create_user(obj, info, input: dict):
    """Validate input and create user."""
    errors = []
    
    # Validation
    if not input.get("email"):
        errors.append({"field": "email", "message": "Email required", "code": "REQUIRED"})
    
    if input.get("age", 0) < 18:
        errors.append({"field": "age", "message": "Age >= 18", "code": "TOO_YOUNG"})
    
    if errors:
        return {"user": None, "errors": errors}
    
    try:
        user = await db.create_user(**input)
        return {"user": user, "errors": []}
    except IntegrityError as e:
        return {
            "user": None,
            "errors": [{"field": "email", "message": "Already exists", "code": "CONFLICT"}]
        }

# Bind resolvers to schema
type_defs = """..."""
executable_schema = make_executable_schema(type_defs, [query, mutation])

# Server handler (FastAPI)
from fastapi import FastAPI

app = FastAPI()

@app.post("/graphql")
async def graphql_endpoint(query_data: dict):
    success, result = await graphql_sync(
        executable_schema,
        query_data,
        context_value={"request": request}
    )
    return result
```

## Best Practices

- [ ] **Always return payload type for mutations** (with errors array, not top-level errors)
- [ ] **Use custom error codes** in `extensions` (not just generic messages)
- [ ] **Distinguish between query errors and resolver errors:**
  - Query/parse errors → top-level `errors` array
  - Resolver errors → `errors` in mutation payload or field returns `null`
- [ ] **Never expose stack traces** in production (log server-side)
- [ ] **Validate early** (in resolver, not at GraphQL boundary)
- [ ] **Include path info** so client knows which field failed
- [ ] **Document error codes** in schema comments or API reference
- [ ] **Use `@deprecated`** to phase out old error codes

## Anti-Patterns to Avoid

- **Throwing errors in queries:** Partial success is expected; use payload types instead
- **Generic error messages:** "Error" or "Something went wrong" → include code + context
- **Exposing implementation details:** "Database unique constraint violated" → use error codes
- **Ignoring partial failures:** Client must check `data` AND `errors` in response
