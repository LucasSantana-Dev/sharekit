# REST API Error Handling

## Error Response Structure

**Standard format (always consistent):**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {
      "field": "optional_context"
    },
    "timestamp": "2024-06-22T10:30:00Z",
    "trace_id": "abc123def456"
  }
}
```

**Why this structure:**
- `code`: Machine-readable error type (for programmatic handling)
- `message`: Clear, actionable human text
- `details`: Context-specific data (field name, resource ID, etc.)
- `timestamp`: When the error occurred (debugging)
- `trace_id`: Correlate error with server logs (request tracing)

## HTTP Status Codes (RFC 7231 + RFC 6585)

### 2xx Success

- `200 OK` — Successful GET, PUT, PATCH; request processed, returning content
- `201 Created` — Successful POST; resource created; MUST include `Location: /api/resource/{id}` header
- `202 Accepted` — Request accepted for async processing (e.g., background job)
- `204 No Content` — Successful DELETE, or response with no body

### 4xx Client Error

- `400 Bad Request` — Malformed request body, invalid JSON, missing required field
  - Example: `{"error": {"code": "INVALID_JSON", "message": "Request body is not valid JSON"}}`

- `401 Unauthorized` — Missing or invalid authentication
  - Example: `{"error": {"code": "MISSING_AUTH", "message": "Authorization header missing"}}`
  - Include `WWW-Authenticate` header to guide client on auth method

- `403 Forbidden` — Authenticated but not authorized for this resource
  - Example: `{"error": {"code": "INSUFFICIENT_PERMISSION", "message": "User cannot delete other users"}}`

- `404 Not Found` — Resource doesn't exist
  - Example: `{"error": {"code": "RESOURCE_NOT_FOUND", "message": "User with ID 999 not found"}}`

- `409 Conflict` — State conflict (e.g., duplicate unique field, race condition, invalid state transition)
  - Example: `{"error": {"code": "UNIQUE_CONSTRAINT_VIOLATION", "message": "Email already registered", "details": {"field": "email"}}}`

- `422 Unprocessable Entity` — Validation error; semantically malformed (fields understood but invalid)
  - Example: `{"error": {"code": "VALIDATION_ERROR", "message": "Request body validation failed", "details": {"errors": [...]}}}`

- `429 Too Many Requests` — Rate limit exceeded
  - Include rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### 5xx Server Error

- `500 Internal Server Error` — Unhandled exception; don't expose stack traces to client
  - Example: `{"error": {"code": "INTERNAL_ERROR", "message": "Internal server error", "trace_id": "xyz"}}`

- `503 Service Unavailable` — Intentional downtime, dependency failure, or overloaded
  - Include `Retry-After` header with seconds or HTTP date

## Common Error Patterns

### Validation Error (422)

**Request:**
```bash
POST /api/users
Content-Type: application/json

{
  "name": "",
  "age": 10
}
```

**Response (422 Unprocessable Entity):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "errors": [
        {
          "field": "name",
          "message": "Name must not be empty"
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

### Unique Constraint (409)

**Request:**
```bash
POST /api/users
Content-Type: application/json

{
  "email": "alice@example.com",
  "name": "Alice"
}
```

**Response (409 Conflict):**
```json
{
  "error": {
    "code": "UNIQUE_CONSTRAINT_VIOLATION",
    "message": "Email already registered",
    "details": {
      "field": "email",
      "existing_user_id": "user123"
    }
  }
}
```

### Not Found (404)

**Request:**
```bash
GET /api/users/999
```

**Response (404 Not Found):**
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User not found",
    "details": {
      "resource_type": "User",
      "resource_id": "999"
    }
  }
}
```

### Authentication Failed (401)

**Request:**
```bash
GET /api/users
Authorization: Bearer invalid_token
```

**Response (401 Unauthorized):**
```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="api.example.com", error="invalid_token"

{
  "error": {
    "code": "INVALID_AUTHENTICATION",
    "message": "Authentication token is invalid or expired"
  }
}
```

### Rate Limit (429)

**Response (429 Too Many Requests):**
```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1624382400

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Rate limit reset at 2024-06-22T14:00:00Z"
  }
}
```

## Implementation Example (FastAPI)

```python
from fastapi import FastAPI, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field, validator
from typing import List, Optional
from datetime import datetime
import uuid

app = FastAPI()

class ErrorDetail(BaseModel):
    field: Optional[str] = None
    message: str
    code: Optional[str] = None

class ErrorResponse(BaseModel):
    code: str
    message: str
    details: Optional[dict] = None
    timestamp: str
    trace_id: str

class ValidationErrorResponse(BaseModel):
    code: str = "VALIDATION_ERROR"
    message: str = "Request validation failed"
    details: dict
    timestamp: str
    trace_id: str

# Validation models
class CreateUserRequest(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=255)
    age: int = Field(..., ge=18, le=150)

# Exception handlers
@app.exception_handler(ValueError)
async def value_error_exception_handler(request, exc):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": {
                "code": "INVALID_REQUEST",
                "message": str(exc),
                "timestamp": datetime.utcnow().isoformat(),
                "trace_id": str(uuid.uuid4())
            }
        }
    )

# Route with validation
@app.post("/api/users", status_code=status.HTTP_201_CREATED)
async def create_user(req: CreateUserRequest):
    """Create new user."""
    trace_id = str(uuid.uuid4())
    
    try:
        # Check unique constraint
        existing = await db.fetch_user_by_email(req.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error": {
                        "code": "UNIQUE_CONSTRAINT_VIOLATION",
                        "message": "Email already registered",
                        "details": {"field": "email"},
                        "timestamp": datetime.utcnow().isoformat(),
                        "trace_id": trace_id
                    }
                }
            )
        
        # Create user
        user = await db.create_user(
            email=req.email,
            name=req.name,
            age=req.age
        )
        
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "age": user.age,
            "created_at": user.created_at
        }
    
    except Exception as e:
        # Log exception internally
        logger.error(f"Failed to create user: {e}", extra={"trace_id": trace_id})
        
        # Return generic error to client (never expose stack trace)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Internal server error",
                    "timestamp": datetime.utcnow().isoformat(),
                    "trace_id": trace_id
                }
            }
        )

# Handle Pydantic validation errors
from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    trace_id = str(uuid.uuid4())
    errors = []
    
    for error in exc.errors():
        field = ".".join(str(x) for x in error["loc"][1:])  # Skip "body"
        errors.append({
            "field": field,
            "message": error["msg"]
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": {"errors": errors},
                "timestamp": datetime.utcnow().isoformat(),
                "trace_id": trace_id
            }
        }
    )
```

## Best Practices

- [ ] **Always include an error code** (for programmatic handling)
- [ ] **Never expose stack traces** to untrusted clients
- [ ] **Consistent error structure** across all endpoints
- [ ] **Include trace_id** for request correlation
- [ ] **Use correct HTTP status codes** (don't return 200 for errors)
- [ ] **Validate early** (400 for malformed input, 422 for semantic errors)
- [ ] **Document error codes** in API reference (OpenAPI)
- [ ] **Log errors server-side** with trace_id for debugging
- [ ] **Include retry guidance** for transient errors (429, 5xx with Retry-After)
- [ ] **Deprecate error codes slowly** (don't change error codes within a version)

## Error Code Registry (Define for Your API)

```
# Client Errors (4xx)
INVALID_JSON
INVALID_REQUEST_BODY
VALIDATION_ERROR
RESOURCE_NOT_FOUND
UNIQUE_CONSTRAINT_VIOLATION
INVALID_AUTHENTICATION
MISSING_AUTHENTICATION
INSUFFICIENT_PERMISSION
RESOURCE_CONFLICT
RATE_LIMIT_EXCEEDED
UNSUPPORTED_MEDIA_TYPE

# Server Errors (5xx)
INTERNAL_ERROR
SERVICE_UNAVAILABLE
DEPENDENCY_FAILURE
TIMEOUT
```

Maintain this registry and version it with your API to ensure clients can reliably interpret errors.
