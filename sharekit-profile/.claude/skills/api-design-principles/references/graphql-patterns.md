# GraphQL API Patterns

## Pattern 1: Schema Design (Schema-First Development)

**Core principle:** Define your domain model via types before writing resolvers.

```graphql
# types.graphql

"""Clear type definitions with relationships."""
type User {
  id: ID!
  email: String!
  name: String!
  createdAt: DateTime!
  
  # Relationships
  orders(first: Int = 20, after: String, status: OrderStatus): OrderConnection!
  profile: UserProfile
  role: UserRole!
}

type Order {
  id: ID!
  status: OrderStatus!
  total: Money!
  items: [OrderItem!]!
  createdAt: DateTime!
  updatedAt: DateTime!
  
  # Back-reference to user
  user: User!
}

type OrderItem {
  id: ID!
  product: Product!
  quantity: Int!
  pricePerUnit: Money!
}

type Product {
  id: ID!
  name: String!
  price: Money!
  inStock: Boolean!
}

type UserProfile {
  bio: String
  avatar: String
  company: String
}

"""Pagination pattern (Relay-style)."""
type OrderConnection {
  edges: [OrderEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type OrderEdge {
  node: Order!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

"""Enums for type safety."""
enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum UserRole {
  USER
  ADMIN
  MODERATOR
}

"""Custom scalars for domain types."""
scalar DateTime
scalar Money

# Query root
type Query {
  user(id: ID!): User
  users(first: Int = 20, after: String, search: String): UserConnection!
  order(id: ID!): Order
  orders(first: Int = 20, after: String, status: OrderStatus): OrderConnection!
}

# Mutation root
type Mutation {
  createUser(input: CreateUserInput!): CreateUserPayload!
  updateUser(input: UpdateUserInput!): UpdateUserPayload!
  deleteUser(id: ID!): DeleteUserPayload!
  
  createOrder(input: CreateOrderInput!): CreateOrderPayload!
  cancelOrder(id: ID!): CancelOrderPayload!
}

# Input types for mutations
input CreateUserInput {
  email: String!
  name: String!
  password: String!
}

input UpdateUserInput {
  id: ID!
  name: String
  bio: String
}

input CreateOrderInput {
  items: [OrderItemInput!]!
}

input OrderItemInput {
  productId: ID!
  quantity: Int!
}

# Payload types for mutations (always include errors)
type CreateUserPayload {
  user: User
  errors: [Error!]
}

type UpdateUserPayload {
  user: User
  errors: [Error!]
}

type DeleteUserPayload {
  success: Boolean!
  errors: [Error!]
}

type CreateOrderPayload {
  order: Order
  errors: [Error!]
}

type CancelOrderPayload {
  order: Order
  errors: [Error!]
}

type Error {
  field: String
  message: String!
  code: String
}
```

**Design principles:**
- Use `!` (non-null) to express required fields and invariants.
- Enums for closed sets (status, role); never bare strings.
- Input types for mutations (separate from output types).
- Payload types always include `errors` array (handle failure gracefully).
- Cursor-based pagination for large result sets (Relay Connection pattern).
- Custom scalars for domain types (Money, DateTime, Email) — encourage validation at schema level.

## Pattern 2: Resolver Design

**Fetch a single resource:**
```python
from typing import Optional
from ariadne import QueryType

query = QueryType()

@query.field("user")
async def resolve_user(obj, info, id: str) -> Optional[dict]:
    """Resolve single user by ID."""
    user = await db.fetch_user_by_id(id)
    if not user:
        return None  # GraphQL returns null for missing resolvers
    return user
```

**Fetch paginated list (Relay-style):**
```python
@query.field("users")
async def resolve_users(
    obj,
    info,
    first: int = 20,
    after: Optional[str] = None,
    search: Optional[str] = None
) -> dict:
    """Resolve paginated user list."""
    # Decode cursor (if provided)
    offset = decode_cursor(after) if after else 0
    
    # Fetch one extra to determine hasNextPage
    users = await db.fetch_users(
        limit=first + 1,
        offset=offset,
        search=search
    )
    
    has_next = len(users) > first
    if has_next:
        users = users[:first]  # Return exactly `first` results
    
    # Build edges with cursors
    edges = [
        {
            "node": user,
            "cursor": encode_cursor(offset + i)
        }
        for i, user in enumerate(users)
    ]
    
    return {
        "edges": edges,
        "pageInfo": {
            "hasNextPage": has_next,
            "hasPreviousPage": offset > 0,
            "startCursor": edges[0]["cursor"] if edges else None,
            "endCursor": edges[-1]["cursor"] if edges else None
        },
        "totalCount": await db.count_users(search=search)
    }
```

**Resolve nested fields (with N+1 prevention via DataLoader — see Pattern 3):**
```python
from ariadne import ObjectType

user_type = ObjectType("User")

@user_type.field("orders")
async def resolve_user_orders(user: dict, info, first: int = 20, **kwargs) -> dict:
    """Resolve user's orders (batched via DataLoader)."""
    # Info context includes loaders (set up at server init)
    loader = info.context["loaders"]["orders_by_user"]
    orders = await loader.load(user["id"])
    
    # Paginate the orders list
    return paginate_orders(orders[:first], first)
```

**Mutation (create with error handling):**
```python
from ariadne import MutationType

mutation = MutationType()

@mutation.field("createUser")
async def resolve_create_user(obj, info, input: dict) -> dict:
    """Create new user."""
    try:
        # Validate
        if not is_valid_email(input["email"]):
            return {
                "user": None,
                "errors": [
                    {"field": "email", "message": "Invalid email format", "code": "INVALID_EMAIL"}
                ]
            }
        
        # Check unique constraint
        existing = await db.fetch_user_by_email(input["email"])
        if existing:
            return {
                "user": None,
                "errors": [
                    {"field": "email", "message": "Email already exists", "code": "UNIQUE_CONSTRAINT"}
                ]
            }
        
        # Create
        user = await db.create_user(
            email=input["email"],
            name=input["name"],
            password=hash_password(input["password"])
        )
        
        return {
            "user": user,
            "errors": []
        }
    
    except Exception as e:
        return {
            "user": None,
            "errors": [
                {"field": None, "message": "Internal server error", "code": "INTERNAL_ERROR"}
            ]
        }
```

## Pattern 3: DataLoader (N+1 Problem Prevention)

**Problem:** Querying `users { orders { id } }` can fetch users (1 query), then for each user fetch orders (N queries) = N+1 total.

**Solution:** Batch-load orders for all users in a single query:

```python
from aiodataloader import DataLoader
from typing import List, Optional

class OrdersByUserLoader(DataLoader):
    """Batch-load orders grouped by user ID."""
    
    async def batch_load_fn(self, user_ids: List[str]) -> List[List[dict]]:
        """Fetch all orders for multiple users in one query."""
        # Single DB call for all user IDs
        orders = await db.fetch_orders_by_user_ids(user_ids)
        
        # Group by user_id
        orders_by_user = {}
        for order in orders:
            uid = order["user_id"]
            if uid not in orders_by_user:
                orders_by_user[uid] = []
            orders_by_user[uid].append(order)
        
        # Return in same order as input (required by DataLoader contract)
        return [orders_by_user.get(uid, []) for uid in user_ids]

class UserLoader(DataLoader):
    """Batch-load users by ID."""
    
    async def batch_load_fn(self, user_ids: List[str]) -> List[Optional[dict]]:
        users = await db.fetch_users_by_ids(user_ids)
        user_map = {u["id"]: u for u in users}
        return [user_map.get(uid) for uid in user_ids]

# Server setup
def create_context():
    return {
        "loaders": {
            "user": UserLoader(),
            "orders_by_user": OrdersByUserLoader()
        }
    }

# Usage in resolver
@user_type.field("orders")
async def resolve_user_orders(user: dict, info, **kwargs) -> List[dict]:
    loader = info.context["loaders"]["orders_by_user"]
    return await loader.load(user["id"])
```

## Best Practices Checklist

- [ ] Schema-first: design types and queries before resolvers
- [ ] Use `!` to express non-null invariants (not just optional everything)
- [ ] Input types separate from output types
- [ ] Mutation payloads always include `errors` array
- [ ] Cursor-based pagination (Relay Connection pattern) for large lists
- [ ] DataLoaders for all N+1-prone relationships
- [ ] Custom scalars for domain types (DateTime, Money, ID formats)
- [ ] Use `@deprecated` directive for breaking changes (gradual migration)
- [ ] Validate at both schema level (non-null, enums) and resolver level (business logic)
- [ ] Document via SDL comments ("""...""") and introspection
- [ ] Monitor query complexity (prevent malicious deeply-nested queries)
- [ ] Implement rate limiting per query complexity, not just per-request

## Anti-Patterns to Avoid

- **Under-typing:** `String` fields instead of `Email`, `Money`, custom scalars (lose validation)
- **Over-fetching prevention broken:** Clients still fetch fields they don't need (poor schema design — expose only what's needed)
- **N+1 queries:** Resolver fetches one object, then 1 query per child (use DataLoaders)
- **Tight coupling to DB:** Schema mirrors table structure (evolve schema, not DB, for clients)
- **Silent failures in mutations:** Return bare `Boolean` instead of payload with errors
- **Unbounded queries:** Allow client to fetch unlimited nested depth (implement query complexity budget)
- **No deprecation path:** Breaking changes → client breakage; use `@deprecated` + sunset window
