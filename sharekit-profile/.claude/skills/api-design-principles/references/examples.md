# API Design Examples

## Example 1: E-Commerce Order API (REST)

### Endpoints

```
# Users
GET    /api/users                    # List users (paginated)
POST   /api/users                    # Create user
GET    /api/users/{id}               # Get user by ID
PATCH  /api/users/{id}               # Update user fields
DELETE /api/users/{id}               # Delete user

# Orders
GET    /api/users/{userId}/orders    # List user's orders
POST   /api/users/{userId}/orders    # Create order
GET    /api/orders/{id}              # Get order by ID
PATCH  /api/orders/{id}              # Update order (e.g., address)
DELETE /api/orders/{id}              # Cancel order

# Order Items
GET    /api/orders/{id}/items        # List order items
POST   /api/orders/{id}/items        # Add item to order
DELETE /api/orders/{id}/items/{itemId}  # Remove item from order

# Products
GET    /api/products                 # List products
GET    /api/products/{id}            # Get product
```

### Request Examples

**Create user:**
```http
POST /api/users HTTP/1.1
Content-Type: application/json

{
  "email": "alice@example.com",
  "name": "Alice Johnson",
  "password": "secure_password"
}
```

**Response:**
```http
HTTP/1.1 201 Created
Location: /api/users/user123
Content-Type: application/json

{
  "id": "user123",
  "email": "alice@example.com",
  "name": "Alice Johnson",
  "created_at": "2024-06-22T10:30:00Z"
}
```

**Create order:**
```http
POST /api/users/user123/orders HTTP/1.1
Content-Type: application/json

{
  "items": [
    { "product_id": "prod456", "quantity": 2 },
    { "product_id": "prod789", "quantity": 1 }
  ],
  "shipping_address": {
    "street": "123 Main St",
    "city": "San Francisco",
    "zip": "94105"
  }
}
```

**Response:**
```http
HTTP/1.1 201 Created
Location: /api/orders/order999
Content-Type: application/json

{
  "id": "order999",
  "user_id": "user123",
  "status": "PENDING",
  "items": [
    {
      "product_id": "prod456",
      "quantity": 2,
      "price_per_unit": 29.99,
      "subtotal": 59.98
    }
  ],
  "total": 89.97,
  "created_at": "2024-06-22T10:32:00Z"
}
```

**List user's orders (paginated):**
```http
GET /api/users/user123/orders?page=1&page_size=10&status=SHIPPED HTTP/1.1
```

**Response:**
```json
{
  "items": [
    {
      "id": "order999",
      "status": "SHIPPED",
      "total": 89.97,
      "created_at": "2024-06-22T10:32:00Z"
    },
    {
      "id": "order888",
      "status": "DELIVERED",
      "total": 149.50,
      "created_at": "2024-06-20T14:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 10,
    "total": 23,
    "has_next": true
  }
}
```

## Example 2: Social Media Feed API (GraphQL)

### Schema

```graphql
scalar DateTime

type User {
  id: ID!
  username: String!
  email: String!
  bio: String
  followers(first: Int = 20, after: String): UserConnection!
  following(first: Int = 20, after: String): UserConnection!
  posts(first: Int = 20, after: String): PostConnection!
  createdAt: DateTime!
}

type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
}

type UserEdge {
  node: User!
  cursor: String!
}

type Post {
  id: ID!
  author: User!
  content: String!
  likes: Int!
  comments(first: Int = 20, after: String): CommentConnection!
  createdAt: DateTime!
  updatedAt: DateTime!
  likedByMe: Boolean!
}

type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PostEdge {
  node: Post!
  cursor: String!
}

type Comment {
  id: ID!
  author: User!
  content: String!
  createdAt: DateTime!
}

type CommentConnection {
  edges: [CommentEdge!]!
  pageInfo: PageInfo!
}

type CommentEdge {
  node: Comment!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type Query {
  me: User
  user(id: ID!): User
  feed(first: Int = 20, after: String): PostConnection!
  post(id: ID!): Post
}

type Mutation {
  createPost(input: CreatePostInput!): CreatePostPayload!
  updatePost(input: UpdatePostInput!): UpdatePostPayload!
  deletePost(id: ID!): DeletePostPayload!
  likePost(id: ID!): LikePostPayload!
  unlikePost(id: ID!): UnlikePostPayload!
  createComment(input: CreateCommentInput!): CreateCommentPayload!
}

# Mutation payloads
type CreatePostPayload {
  post: Post
  errors: [Error!]
}

type UpdatePostPayload {
  post: Post
  errors: [Error!]
}

type DeletePostPayload {
  success: Boolean!
  errors: [Error!]
}

type LikePostPayload {
  post: Post
  errors: [Error!]
}

type UnlikePostPayload {
  post: Post
  errors: [Error!]
}

type CreateCommentPayload {
  comment: Comment
  errors: [Error!]
}

type Error {
  field: String
  message: String!
  code: String
}

input CreatePostInput {
  content: String!
}

input UpdatePostInput {
  id: ID!
  content: String!
}

input CreateCommentInput {
  postId: ID!
  content: String!
}
```

### Query Examples

**Get user profile with recent posts:**
```graphql
query {
  user(id: "user123") {
    id
    username
    bio
    followers(first: 10) {
      totalCount
      edges {
        node { username }
      }
    }
    posts(first: 5) {
      edges {
        node {
          id
          content
          likes
          createdAt
        }
      }
    }
  }
}
```

**Get feed with comments (cursor-based pagination):**
```graphql
query {
  feed(first: 10, after: "cursor123") {
    edges {
      node {
        id
        author { username }
        content
        likes
        likedByMe
        comments(first: 3) {
          edges {
            node {
              author { username }
              content
            }
          }
        }
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

**Mutation with error handling:**
```graphql
mutation {
  createPost(input: { content: "Hello world!" }) {
    post {
      id
      content
      createdAt
    }
    errors {
      field
      message
      code
    }
  }
}
```

**Response (success):**
```json
{
  "data": {
    "createPost": {
      "post": {
        "id": "post999",
        "content": "Hello world!",
        "createdAt": "2024-06-22T10:35:00Z"
      },
      "errors": []
    }
  }
}
```

**Response (validation failed):**
```json
{
  "data": {
    "createPost": {
      "post": null,
      "errors": [
        {
          "field": "content",
          "message": "Content must not be empty",
          "code": "REQUIRED"
        }
      ]
    }
  }
}
```

## Example 3: File Upload API (Multipart REST)

**Upload file:**
```http
POST /api/files HTTP/1.1
Authorization: Bearer token123
Content-Type: multipart/form-data; boundary=----FormBoundary

------FormBoundary
Content-Disposition: form-data; name="file"; filename="document.pdf"
Content-Type: application/pdf

[binary file data]
------FormBoundary
Content-Disposition: form-data; name="folder_id"

folder456
------FormBoundary--
```

**Response:**
```json
{
  "id": "file789",
  "name": "document.pdf",
  "size_bytes": 45230,
  "mime_type": "application/pdf",
  "url": "https://api.example.com/files/file789",
  "created_at": "2024-06-22T10:40:00Z"
}
```

## Example 4: API Versioning in Practice

### URL Versioning (v1 → v2)

**v1 (deprecated):**
```
GET /api/v1/users/user123
{
  "id": "user123",
  "name": "Alice",
  "email": "alice@example.com"
}
```

**v2 (current):**
```
GET /api/v2/users/user123
{
  "id": "user123",
  "name": "Alice",
  "email": "alice@example.com",
  "emailVerified": true,
  "role": "user",
  "lastLogin": "2024-06-22T09:15:00Z"
}
```

**v1 sunset (returns error):**
```http
HTTP/1.1 410 Gone
Link: </api/v2/users/user123>; rel="successor-version"

{
  "error": {
    "code": "API_VERSION_DEPRECATED",
    "message": "API v1 is no longer supported. Use v2 instead.",
    "details": { "successor_version": "v2" }
  }
}
```

## Example 5: Webhook Delivery (Async Events)

**Webhook definition:**
```
POST https://client.example.com/webhooks/orders
Authorization: Bearer webhook_secret_123
Content-Type: application/json
X-Webhook-Signature: sha256=abc123...

{
  "event": "order.shipped",
  "timestamp": "2024-06-22T11:00:00Z",
  "id": "event456",
  "data": {
    "order_id": "order999",
    "status": "SHIPPED",
    "tracking_number": "1Z999AA10123456784"
  }
}
```

**Webhook retry policy:**
- Retry on 5xx or timeout
- Exponential backoff: 1s, 2s, 4s, 8s, 16s
- Max 5 attempts over ~30 minutes
- Include `X-Webhook-Attempt` header (0, 1, 2, ...)
- Sign all payloads (client verifies signature)

## Best Practices Summary

- **REST:** Resource nouns, HTTP verbs, stateless, paginated, versioned
- **GraphQL:** Schema-first, single endpoint, client-driven queries, DataLoaders for N+1
- **Errors:** Consistent structure, meaningful codes, client-actionable messages
- **Versioning:** URL, header, or query param; sunset window clearly communicated
- **Pagination:** Offset for simple, cursor for scale; always limit results
- **Documentation:** OpenAPI (REST) or schema introspection (GraphQL); examples required
