# Level 08 — KPI 08 — Part 05: API Data Access & Business Logic Boundaries

## 1. Part Objective

This part establishes how a production Next.js API should separate:

* HTTP transport
* application orchestration
* business rules
* data access
* persistence
* transactions

The governing question is:

> **When a Route Handler needs to perform a real business operation, where should each piece of logic live?**

The core architecture is:

```text
HTTP Request
     ↓
Route Handler
     ↓
Application Service
     ↓
Domain / Business Logic
     ↓
Repository / Data Access
     ↓
Database / External Systems
```

The most important principle is:

```text
HTTP concerns stay at the HTTP boundary.

Business rules stay in the application/domain layer.

Persistence concerns stay in the data-access layer.
```

---

# 2. Why This Boundary Matters

A small API endpoint can begin as:

```ts
export async function POST(request: Request) {
  const body = await request.json();

  const user = await db.user.create({
    data: body
  });

  return Response.json(user);
}
```

This can work initially.

But production requirements accumulate:

```text
authentication
authorization
validation
business rules
transactions
multiple database queries
events
external APIs
cache invalidation
audit logging
notifications
```

The Route Handler can become:

```text
parse
validate
authorize
query
mutate
calculate
notify
log
serialize
```

all in one function.

That is a **fat Route Handler**.

The goal is not to create abstractions for their own sake.

The goal is to create boundaries where different kinds of reasoning belong.

---

# 3. The Core Layer Model

A useful model is:

```text
┌──────────────────────────────┐
│        HTTP Boundary         │
│                              │
│ Route Handler                │
│ Request / Response           │
│ Headers / Cookies            │
│ Status Codes                 │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│     Application Boundary     │
│                              │
│ Use Cases                    │
│ Commands / Queries           │
│ Orchestration                │
│ Transaction Coordination     │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│       Domain Boundary        │
│                              │
│ Business Rules               │
│ Invariants                   │
│ Policies                     │
│ Domain Decisions             │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│      Data Access Boundary    │
│                              │
│ Repositories                 │
│ Queries                      │
│ Persistence                  │
│ External Data Sources        │
└──────────────────────────────┘
```

Not every application needs every layer as a separate package.

But the **responsibilities** should remain distinguishable.

---

# 4. Route Handler Responsibility

The Route Handler should primarily translate HTTP into an application operation.

Conceptually:

```text
Request
 ↓
extract input
 ↓
validate
 ↓
authenticate
 ↓
authorize
 ↓
construct command
 ↓
call application service
 ↓
map result
 ↓
Response
```

It should understand:

```text
Request
Response
HTTP status
headers
cookies
URL
route parameters
```

It should not become the primary home for:

```text
pricing rules
order state transitions
complex SQL
subscription rules
inventory policy
billing calculations
```

---

# 5. Application Service

The application service represents a use case.

Examples:

```text
createOrder()
cancelOrder()
approveInvoice()
inviteMember()
changeSubscription()
publishArticle()
```

These are application operations.

A service may coordinate:

```text
authentication context
authorization
repositories
domain logic
transactions
events
external services
```

Conceptually:

```text
createOrder(command)
```

rather than:

```text
createOrder(request)
```

The application layer should receive semantic input.

---

# 6. Commands

A command represents an instruction.

Example:

```ts
type CreateOrderCommand = {
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
};
```

The command describes:

> What the application should do.

It does not contain:

```text
Request
Response
Headers
Cookies
URL
```

This allows the same use case to be invoked from different entry points.

---

# 7. Multiple Entry Points

A single application operation might be invoked through:

```text
HTTP Route Handler
        ↓
createOrder()

Server Action
        ↓
createOrder()

Background Job
        ↓
createOrder()

CLI
        ↓
createOrder()

Test
        ↓
createOrder()
```

This is a major benefit of separating the application layer from HTTP.

Without this separation:

```text
business logic
      ↓
Request object
      ↓
HTTP dependency
```

becomes unnecessarily coupled.

---

# 8. Application Service vs Domain Logic

These are related but different.

### Application service

Coordinates the use case.

```text
load customer
load products
authorize
start transaction
create order
publish event
```

### Domain logic

Defines business meaning.

```text
can order be cancelled?
what discount applies?
can invoice transition to paid?
is this subscription upgrade valid?
```

A useful distinction is:

```text
Application layer:
"What steps must happen?"

Domain layer:
"What is allowed according to the business?"
```

---

# 9. Example: Order Creation

Consider:

```text
POST /api/orders
```

The Route Handler:

```text
parse
validate
authenticate
authorize
create command
```

Application service:

```text
load products
calculate order
start transaction
create order
create order items
publish event
```

Domain logic:

```text
quantity must be positive
product must be orderable
order cannot contain incompatible items
discount must be valid
```

Repository:

```text
insert order
insert items
load product
```

The responsibilities are distinct.

---

# 10. Business Rules Should Not Depend on HTTP

Consider this:

```ts
function canCancelOrder(request: Request, order: Order) {
  ...
}
```

This is a poor domain boundary.

The business rule should instead be expressible in domain terms:

```ts
function canCancelOrder(
  order: Order,
  actor: Principal
) {
  ...
}
```

Or:

```ts
order.canBeCancelledBy(actor)
```

The business rule should not care whether the request came through:

```text
REST
Server Action
GraphQL
queue
CLI
```

---

# 11. Repository Responsibility

A repository provides a data-access abstraction around a persistence source.

Conceptually:

```ts
interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
}
```

The application layer can then reason about:

```text
find order
save order
```

rather than:

```text
SQL syntax
database driver
connection details
ORM query syntax
```

The exact repository abstraction should be proportional to the application's complexity.

---

# 12. Repository Is Not a Business Service

A repository should generally answer data-access questions:

```text
find
save
delete
list
query
```

It should not become:

```text
approveInvoice()
calculateDiscount()
cancelSubscription()
sendNotification()
```

Those are application/domain operations.

Otherwise the repository becomes a second business layer.

---

# 13. The Repository Anti-Pattern

A common pattern is:

```text
OrderRepository
├── findOrder
├── calculateDiscount
├── approveOrder
├── sendEmail
├── publishEvent
└── updateBilling
```

This is not merely a repository anymore.

It has become an application service disguised as a data-access abstraction.

The responsibility should remain:

```text
Repository
→ persistence

Service
→ orchestration

Domain
→ business rules
```

---

# 14. ORM Does Not Eliminate Data Access Architecture

Using an ORM does not mean the Route Handler should directly contain every database operation.

For example:

```ts
await prisma.order.findUnique(...)
await prisma.order.update(...)
await prisma.orderItem.create(...)
```

are still persistence operations.

The question remains:

> **Which layer owns these persistence decisions?**

For simple applications, direct access may be reasonable.

For complex domains, isolating persistence decisions can improve:

```text
testability
maintainability
transaction coordination
security
query consistency
```

---

# 15. Avoid Abstraction for Abstraction's Sake

A repository is not automatically better just because it exists.

This:

```text
Route Handler
 ↓
Service
 ↓
Repository
 ↓
ORM
 ↓
Database
```

can become unnecessary ceremony for a trivial CRUD endpoint.

The correct principle is:

> **Create boundaries where they reduce meaningful coupling or centralize important decisions.**

Do not build five layers around:

```text
SELECT * FROM users
```

just to satisfy a pattern.

---

# 16. Complexity Should Drive Boundaries

A simple endpoint:

```text
GET /api/profile
```

might reasonably do:

```text
authenticate
query user
map DTO
return
```

A complex operation:

```text
POST /api/subscriptions/change-plan
```

may involve:

```text
authorization
current subscription
plan rules
proration
billing provider
transaction
event
cache invalidation
audit
```

This strongly benefits from application/domain boundaries.

Architecture should respond to complexity.

---

# 17. Data Access and Authorization

Data access should respect security context.

Consider:

```text
tenantId
+
resourceId
```

A repository may expose:

```ts
findProject({
  tenantId,
  projectId
});
```

rather than:

```ts
findProject(projectId);
```

when tenant isolation is fundamental.

This reduces the risk of accidentally forgetting tenant scope.

---

# 18. Authorization Should Not Be Hidden Inside Arbitrary Queries

A repository can enforce data scoping.

But authorization policy should remain conceptually visible.

For example:

```text
Application Service
    ↓
authorize(principal, action, resource)
    ↓
Repository
    ↓
tenant-scoped query
```

The repository may provide defense in depth.

It should not silently become the only place where all authorization semantics live.

---

# 19. Data Access as a Trust Boundary

A repository can help enforce:

```text
tenant isolation
resource scope
allowed fields
query constraints
transaction boundaries
```

This is especially valuable when multiple application services access the same data.

The database should not be treated as:

```text
"just storage"
```

It is part of the system's integrity boundary.

---

# 20. Transactions

A transaction groups related database changes into an atomic unit.

Example:

```text
create order
+
create order items
+
decrement inventory
```

If inventory update fails:

```text
order creation
```

may need to roll back.

Conceptually:

```text
BEGIN
   create order
   create items
   update inventory
COMMIT
```

or:

```text
BEGIN
   ...
ROLLBACK
```

---

# 21. Transaction Boundary Ownership

A useful rule is:

> The application operation that defines the atomic business operation should generally coordinate the transaction boundary.

For example:

```text
createOrder()
```

may own:

```text
transaction
```

rather than individual repositories each opening unrelated transactions.

Why?

Because the business operation may require multiple persistence operations to succeed together.

---

# 22. Repository Calls Inside a Transaction

Conceptually:

```text
createOrder()
    ↓
transaction
    ├── orderRepository.create()
    ├── orderItemRepository.create()
    └── inventoryRepository.decrement()
```

The transaction groups these operations.

Without a shared transaction:

```text
order created
items created
inventory update fails
```

the system may be left inconsistent.

---

# 23. Transaction vs External API

A database transaction cannot automatically make an external API call atomic.

Consider:

```text
DB transaction
+
Stripe/payment provider
```

You cannot generally assume:

```text
database rollback
→ external API rollback
```

Therefore:

```text
database transaction
≠
distributed transaction
```

This becomes an important architecture problem.

---

# 24. Side Effects

Application operations often contain side effects:

```text
database mutation
email
webhook
notification
analytics event
cache invalidation
message publication
```

These have different failure characteristics.

For example:

```text
database commit succeeds
email send fails
```

What should happen?

You cannot simply roll back the database using a normal database transaction.

This requires explicit reliability architecture.

---

# 25. Transactional Outbox

A common pattern is:

```text
Database Transaction
├── business state
└── outbox event

COMMIT
     ↓
Outbox Worker
     ↓
External Side Effect
```

Example:

```text
create order
+
insert OrderCreated event
```

in the same transaction.

Then a worker processes:

```text
OrderCreated
```

and sends:

```text
email
webhook
message
```

This separates:

```text
atomic state change
```

from:

```text
eventual side effect
```

---

# 26. Idempotency

API operations may be retried.

For example:

```text
POST /api/payments
```

The client times out.

It does not know whether the server processed the request.

The client retries.

Without idempotency:

```text
payment
+
payment
```

may occur.

Therefore mutation endpoints with retry-sensitive side effects often require idempotency semantics.

---

# 27. Idempotency Key

Conceptually:

```http
Idempotency-Key: abc123
```

The application can associate:

```text
key
+
operation
+
result
```

Then a retry can return the original result rather than repeating the side effect.

The important architecture is:

```text
request
 ↓
idempotency check
 ↓
execute once
 ↓
persist result
 ↓
retry → same semantic result
```

Part 06 will go deeper into API idempotency.

---

# 28. Data Access and Concurrency

Two requests may execute concurrently.

Example:

```text
Current balance = 100
```

Two requests attempt:

```text
withdraw 80
withdraw 80
```

Naive logic:

```text
read 100
read 100
withdraw
withdraw
```

can produce an invalid state.

The application must reason about:

```text
transactions
locking
atomic updates
optimistic concurrency
versioning
constraints
```

Data access architecture therefore includes concurrency semantics.

---

# 29. Database Constraints

Business invariants should not always exist only in application code.

For example:

```text
email must be unique
```

The application can check:

```text
does email exist?
```

but two requests can race.

Both may observe:

```text
email doesn't exist
```

and then attempt insertion.

A database uniqueness constraint provides a final integrity boundary.

Therefore:

```text
application validation
+
database constraint
```

can provide stronger correctness.

---

# 30. Validation vs Database Integrity

These solve different problems.

Application validation:

```text
friendly feedback
early rejection
API contract
```

Database constraints:

```text
final integrity enforcement
concurrency safety
persistence invariant
```

Do not assume application validation eliminates the need for database constraints.

---

# 31. Query Composition

Complex APIs often require:

```text
filters
pagination
sorting
authorization scope
tenant scope
search
joins
projections
```

Do not let this become scattered across Route Handlers.

For example:

```text
GET /api/orders
```

may involve:

```text
tenant
customer
status
date range
pagination
sort
```

The application/query layer can construct an explicit query model.

---

# 32. Query Objects

Conceptually:

```ts
type OrderQuery = {
  tenantId: string;
  customerId?: string;
  status?: OrderStatus;
  page: number;
  limit: number;
};
```

Then:

```text
Route Handler
 ↓
parse query
 ↓
validate
 ↓
OrderQuery
 ↓
query service
 ↓
repository
```

This keeps URL syntax away from persistence logic.

---

# 33. Projection and DTO Efficiency

Do not always load the entire entity when the endpoint needs only:

```text
id
name
status
```

Instead, the data-access layer can request the required projection.

This can reduce:

```text
database work
memory
serialization
network transfer
```

It also reduces accidental exposure of internal fields.

---

# 34. N+1 Query Problems

Consider:

```text
GET /api/orders
```

The application loads:

```text
100 orders
```

and then performs:

```text
1 query per order
```

Result:

```text
101 queries
```

This is an N+1 query pattern.

Possible strategies include:

```text
joins
batch queries
eager loading
data loaders
aggregated queries
```

The correct strategy depends on the data-access model.

---

# 35. API Aggregation

A Route Handler may need information from:

```text
orders
customer
inventory
recommendations
billing
```

Do not necessarily place all query orchestration directly in the Route Handler.

Instead:

```text
Route Handler
 ↓
DashboardQueryService
 ↓
repositories / external clients
```

This keeps HTTP transport separate from aggregation logic.

---

# 36. Read vs Write Operations

A useful architectural distinction is:

```text
Command
→ changes state

Query
→ reads state
```

For example:

```text
createOrder()
```

is a command.

```text
getOrderDashboard()
```

is a query.

The data-access patterns may differ substantially.

---

# 37. CQRS Concept

CQRS means:

```text
Command Query Responsibility Segregation
```

The basic idea is:

```text
Commands
→ mutation-oriented model

Queries
→ read-oriented model
```

This does not require separate databases.

It simply recognizes that:

```text
read optimization
```

and:

```text
write consistency
```

often have different requirements.

Use CQRS when the domain complexity justifies it.

---

# 38. Do Not Introduce CQRS Automatically

For:

```text
POST /api/users
GET /api/users/123
```

a conventional application service + repository architecture may be sufficient.

CQRS becomes more relevant when:

```text
complex read models
high read volume
event-driven architecture
different consistency requirements
complex aggregation
```

appear.

The principle remains:

> Architecture should solve an actual problem.

---

# 39. External Service Boundaries

Suppose an API calls:

```text
payment provider
email provider
analytics provider
shipping provider
```

These should generally have explicit client abstractions.

For example:

```text
PaymentService
    ↓
PaymentProviderClient
```

rather than:

```text
Route Handler
    ↓
raw fetch("https://...")
```

for every endpoint.

This creates a boundary for:

```text
authentication
timeouts
retries
error mapping
logging
provider-specific semantics
```

---

# 40. External API Failures

External systems fail differently from databases.

Possible states:

```text
timeout
rate limit
5xx
connection failure
partial success
duplicate request
provider outage
```

Application services should map these into meaningful application behavior.

For example:

```text
payment provider timeout
```

may produce:

```text
payment status = pending
```

rather than:

```text
entire order disappears
```

---

# 41. Timeout Ownership

Every external dependency should have explicit timeout expectations.

Conceptually:

```text
HTTP request timeout
        ↓
application timeout
        ↓
provider timeout
```

Do not allow an external dependency to hang indefinitely and consume server resources.

The application should know:

```text
how long can this operation reasonably wait?
```

---

# 42. Retry Ownership

Retries should have one deliberate owner.

Bad:

```text
Route Handler retries
+
Service retries
+
HTTP client retries
+
Provider SDK retries
```

This can multiply attempts.

For example:

```text
3 × 3 × 3 = 27 attempts
```

The resulting load can become catastrophic.

Retry policy should be centralized and bounded.

---

# 43. Data Access and Caching

Repositories and application services may interact with caching.

For example:

```text
getProduct()
```

could use:

```text
cache
 ↓
repository
 ↓
database
```

But cache semantics should remain explicit.

The architecture should answer:

```text
What is cached?
Who owns invalidation?
What is the cache key?
What happens after mutation?
```

These questions connect to KPI 06.

---

# 44. Mutation and Cache Invalidation

Consider:

```text
updateProduct()
```

The operation changes:

```text
database
```

but cached:

```text
product
product-list
category
search
```

representations may now be stale.

The application operation therefore needs an explicit invalidation strategy.

Conceptually:

```text
Mutation
 ↓
Commit
 ↓
Invalidate dependencies
 ↓
Refresh / revalidate
```

The application layer is often a natural coordination point.

---

# 45. Events and Cache Invalidation

In more distributed systems:

```text
ProductUpdated
```

can drive:

```text
cache invalidation
search indexing
analytics
notifications
```

This allows multiple consumers to react.

But it introduces:

```text
eventual consistency
ordering
duplicate delivery
failure recovery
```

These tradeoffs must be explicit.

---

# 46. Application Service as Orchestrator

A mature application service may coordinate:

```text
authenticate context
        ↓
authorize
        ↓
load state
        ↓
apply domain policy
        ↓
transaction
        ↓
persist
        ↓
publish event
        ↓
invalidate cache
        ↓
return result
```

The Route Handler does not need to know every implementation detail.

---

# 47. Example Architecture

Consider:

```text
POST /api/orders
```

A possible structure:

```text
app/api/orders/route.ts
        ↓
createOrder()
        ↓
OrderService
        ↓
OrderPolicy
        ↓
OrderRepository
        ↓
ProductRepository
        ↓
Transaction
        ↓
Database
```

Then:

```text
OrderCreated
        ↓
Outbox
        ↓
Worker
        ↓
Email / Webhook / Analytics
```

This is a scalable application boundary.

---

# 48. Thin Route Handler

A strong Route Handler might conceptually look like:

```ts
export async function POST(request: Request) {
  const body = await parseAndValidate(request);

  const principal = await authenticate(request);

  await authorize(principal, "order:create");

  const result = await orderService.create({
    principal,
    input: body
  });

  return toHttpResponse(result);
}
```

Notice what it does not contain:

```text
SQL
business calculations
transaction implementation
email provider calls
complex state transitions
```

---

# 49. Fat Route Handler

A problematic implementation might look conceptually like:

```ts
export async function POST(request: Request) {
  const body = await request.json();

  // validation

  // authentication

  // authorization

  // query customer

  // query products

  // calculate discounts

  // query inventory

  // begin transaction

  // create order

  // update inventory

  // call payment provider

  // send email

  // invalidate cache

  // audit

  // format response
}
```

The problem is not the number of lines alone.

The problem is **responsibility concentration**.

---

# 50. Business Invariants

A domain invariant is a condition that must remain true.

Examples:

```text
order quantity > 0
invoice cannot be paid twice
subscription cannot have two active plans
account balance cannot become invalid
archived document cannot be edited
```

These rules should be protected independently of the transport mechanism.

---

# 51. Domain Invariant Example

Suppose:

```text
Invoice status = PAID
```

and a request attempts:

```text
mark invoice PAID
```

The domain should reject the invalid transition.

Conceptually:

```text
PENDING → PAID
```

may be allowed.

But:

```text
PAID → PAID
```

may be invalid depending on the business model.

This is domain logic.

It should not depend on:

```text
POST
PATCH
Route Handler
Next.js
```

---

# 52. State Transition Model

Many business objects are state machines.

Example:

```text
Draft
  ↓
Submitted
  ↓
Approved
  ↓
Completed
```

Invalid transitions:

```text
Completed → Draft
Approved → Draft
```

unless explicitly supported.

A domain model can centralize these transition rules.

---

# 53. Service Layer Should Not Become a God Object

After introducing an application service, another problem can appear:

```text
UserService
    ├── users
    ├── billing
    ├── orders
    ├── notifications
    ├── analytics
    ├── permissions
    └── everything
```

This recreates the same problem at another layer.

Instead, organize around meaningful capabilities/use cases.

For example:

```text
UserRegistrationService
OrderService
BillingService
MembershipService
```

where justified by domain boundaries.

---

# 54. Dependency Direction

A useful dependency direction is:

```text
HTTP
 ↓
Application
 ↓
Domain
 ↓
Infrastructure
```

Infrastructure should not force HTTP concepts upward.

For example:

```text
Database adapter
```

should not require:

```text
NextRequest
```

The dependency direction should preserve separation.

---

# 55. Dependency Injection

Application services may depend on abstractions:

```ts
class OrderService {
  constructor(
    private orders: OrderRepository,
    private products: ProductRepository
  ) {}
}
```

This can improve:

```text
testing
substitution
separation
```

But dependency injection should remain proportional to the system.

Do not construct a framework-heavy dependency container for a small application merely because the pattern exists.

---

# 56. Testing Boundaries

Different layers should support different tests.

### Route Handler tests

Test:

```text
HTTP request
→ HTTP response
```

### Application service tests

Test:

```text
use case
→ result
```

### Domain tests

Test:

```text
business invariant
→ decision
```

### Repository tests

Test:

```text
query
→ persistence behavior
```

This gives failures clearer ownership.

---

# 57. Unit Testing Domain Rules

Suppose:

```text
cancelOrder(order)
```

has complex business rules.

You should be able to test:

```text
cancel allowed
cancel denied
already cancelled
completed order
```

without constructing:

```text
HTTP Request
Next.js server
browser
```

That is a sign that the domain boundary is useful.

---

# 58. Integration Testing Data Access

Repositories should be tested against realistic persistence behavior when necessary.

This can catch:

```text
constraint failures
transaction behavior
query mistakes
index assumptions
serialization differences
concurrency behavior
```

Mocking every database call can hide these issues.

---

# 59. Contract Testing

API consumers care about:

```text
status
headers
response body
error shape
```

Therefore API contract tests can verify:

```text
Route Handler
→ expected HTTP contract
```

This protects external clients from accidental response changes.

---

# 60. Error Mapping Across Layers

A useful flow is:

```text
Database Error
      ↓
Infrastructure Error
      ↓
Application Error
      ↓
HTTP Error
```

For example:

```text
UniqueConstraintViolation
      ↓
EmailAlreadyExists
      ↓
409 Conflict
```

The Route Handler should not need to understand every database-specific error code.

---

# 61. Domain Error Example

Suppose:

```text
Order cannot be cancelled after shipment.
```

The domain may produce:

```text
OrderAlreadyShipped
```

The application layer can propagate it.

The HTTP layer maps it:

```text
409 Conflict
```

with:

```json
{
  "error": {
    "code": "ORDER_ALREADY_SHIPPED"
  }
}
```

This creates clean translation across boundaries.

---

# 62. Avoid Exception Leakage

Do not expose:

```text
Prisma error
Postgres error
Stripe SDK error
AWS SDK error
```

directly to the API client.

Instead:

```text
external error
 ↓
mapped application error
 ↓
stable API contract
```

This prevents infrastructure details from becoming accidental public APIs.

---

# 63. Data Access Failure

Suppose the database is unavailable.

The application should distinguish:

```text
resource not found
```

from:

```text
database unavailable
```

These are not the same.

Incorrect:

```text
database failure
→ 404
```

Correct reasoning:

```text
database failure
→ infrastructure failure
→ appropriate server/dependency handling
```

Error semantics must preserve meaning.

---

# 64. Read Consistency

After a mutation:

```text
POST /api/orders
```

the next request:

```text
GET /api/orders
```

may depend on:

```text
database consistency
cache invalidation
replica lag
eventual consistency
```

The application architecture must define the expected read-after-write behavior.

This connects API design to caching and distributed data architecture.

---

# 65. Database Transactions vs Request Lifetime

Do not automatically keep a database transaction open while performing:

```text
external HTTP call
email
slow computation
```

For example:

```text
BEGIN
 ↓
database update
 ↓
call payment provider
 ↓
wait 3 seconds
 ↓
COMMIT
```

may unnecessarily hold database resources.

A better design may separate:

```text
database transaction
```

from:

```text
external workflow
```

using state transitions and durable events.

---

# 66. Long-Running Operations

Some API operations cannot finish synchronously.

Example:

```text
POST /api/reports/generate
```

The operation may take:

```text
30 seconds
5 minutes
```

Instead:

```text
POST
 ↓
create job
 ↓
202 Accepted
 ↓
background worker
 ↓
GET /api/reports/jobs/123
```

This is an application architecture decision.

The Route Handler should not necessarily block until the entire workflow completes.

---

# 67. API Boundary and Background Jobs

The application service becomes particularly valuable here.

```text
HTTP Route
    ↓
generateReport()
```

and:

```text
Worker
    ↓
generateReport()
```

can share application/domain logic.

Only the orchestration mechanism differs.

---

# 68. Application Service and Server Actions

Next.js Server Actions and Route Handlers are different transport mechanisms.

But they can share application logic:

```text
Server Action
      ↓
Application Service

Route Handler
      ↓
Application Service
```

This avoids duplicating business logic.

The transport-specific layer handles:

```text
HTTP
form
cookies
redirects
serialization
```

while the application service handles the actual use case.

---

# 69. API Boundary and Server Components

Server Components can also call server-side application logic.

The important principle is:

```text
UI mechanism
≠
business logic boundary
```

You should avoid implementing a business rule once for:

```text
Route Handler
```

and again for:

```text
Server Action
```

and again for:

```text
Server Component
```

Centralize the business operation where appropriate.

---

# 70. Architecture Example: Subscription Upgrade

Request:

```text
POST /api/subscriptions/upgrade
```

### Route Handler

```text
parse
validate
authenticate
authorize
```

### Application Service

```text
load subscription
load requested plan
validate transition
calculate proration
start transaction
persist state
create billing instruction
publish event
```

### Domain

```text
is upgrade allowed?
is plan transition valid?
```

### Repository

```text
load subscription
save subscription
load plan
```

### External client

```text
billing provider
```

### Outbox

```text
SubscriptionUpgraded
```

### Response

```text
200 OK
```

This is a realistic SDE-2-level decomposition.

---

# 71. Architecture Example: Tenant-Scoped Project Update

Request:

```text
PATCH /api/projects/123
```

Pipeline:

```text
Request
 ↓
authenticate
 ↓
resolve tenant
 ↓
validate body
 ↓
application service
 ↓
load project scoped to tenant
 ↓
authorize project mutation
 ↓
apply domain rule
 ↓
transaction
 ↓
save
 ↓
invalidate project cache
 ↓
return DTO
```

Every layer has a specific responsibility.

---

# 72. Common Anti-Patterns

## Anti-pattern 1: Fat Route Handler

```text
Route Handler
→ everything
```

Problem:

```text
high coupling
hard testing
hard reuse
```

---

## Anti-pattern 2: Business Logic in Repository

```text
Repository
→ domain decisions
```

Problem:

```text
persistence layer owns business policy
```

---

## Anti-pattern 3: HTTP in Domain

```text
Domain
→ Request
→ Response
```

Problem:

```text
domain coupled to transport
```

---

## Anti-pattern 4: ORM Everywhere

```text
every layer
→ directly calls ORM
```

Problem:

```text
persistence concerns spread across application
```

---

## Anti-pattern 5: Giant Service

```text
GodService
→ every use case
```

Problem:

```text
service layer becomes another monolith
```

---

## Anti-pattern 6: External API Inside Transaction

```text
DB transaction
→ slow provider call
```

Problem:

```text
long-lived transaction
resource contention
failure complexity
```

---

# 73. Debugging Method

When an API mutation behaves incorrectly, trace the operation by boundary.

```text
1. What HTTP input arrived?
2. What trusted command was constructed?
3. What principal was established?
4. What authorization decision occurred?
5. What application service executed?
6. What domain rules were applied?
7. What repositories were called?
8. Was a transaction used?
9. What database constraints applied?
10. What external side effects occurred?
11. What cache invalidation occurred?
12. What result was mapped to HTTP?
```

This prevents debugging everything inside `route.ts`.

---

# 74. SDE-2 Prediction Challenge

A Route Handler performs:

```text
create order
create items
update inventory
```

using three separate database calls.

The third operation fails.

What should you investigate?

```text
transaction boundary
atomicity
partial state
rollback behavior
database constraints
retry semantics
```

The key question is:

> Are these operations one business transaction?

---

# 75. SDE-2 Prediction Challenge

A database insert succeeds.

An email send fails.

Should the database insert automatically roll back?

Not with an ordinary database transaction.

The system must define:

```text
state transition
+
durable side effect
```

Possible architecture:

```text
DB transaction
→ business state + outbox event

worker
→ email
```

---

# 76. SDE-2 Prediction Challenge

Two users attempt to purchase the final inventory item simultaneously.

Both requests read:

```text
stock = 1
```

Both attempt:

```text
stock = 0
```

The architecture must reason about:

```text
concurrency
atomic updates
transactions
locking
constraints
optimistic concurrency
```

A simple application-level check is not sufficient by itself.

---

# 77. SDE-2 Prediction Challenge

A Route Handler calls:

```text
payment provider
```

inside a database transaction.

The provider takes five seconds.

What should you question?

```text
transaction duration
database connection occupancy
failure semantics
provider timeout
retry behavior
distributed atomicity
```

The correct architecture may separate the database state transition from the external workflow.

---

# 78. SDE-2 Interview Questions

### Layering

1. What should a Route Handler be responsible for?
2. What is an application service?
3. What belongs in a domain layer?
4. What is a repository?
5. Why separate HTTP from business logic?
6. When would you not create a repository?

### Transactions

7. Where should a transaction boundary live?
8. Why can't a database transaction automatically include an external API?
9. How would you handle a database success followed by an email failure?
10. What is the transactional outbox pattern?

### Data access

11. How would you prevent cross-tenant queries?
12. How would you prevent N+1 queries?
13. How would you design complex query filtering?
14. What role do database constraints play?

### Concurrency

15. How would you prevent two requests from overselling inventory?
16. When would you use optimistic concurrency?
17. When would you use a database lock?

### Architecture

18. How would you share business logic between Server Actions and Route Handlers?
19. How would you avoid a fat Route Handler?
20. How would you prevent a service layer from becoming a God object?
21. How would you structure a complex API mutation?

---

# 79. Architecture Decision Framework

When deciding where code belongs, ask:

### Is it about HTTP?

```text
Route Handler
```

### Is it coordinating a use case?

```text
Application Service
```

### Is it enforcing a business invariant?

```text
Domain
```

### Is it reading/writing persistence?

```text
Repository / Data Access
```

### Is it communicating with an external system?

```text
Infrastructure / External Client
```

### Is it maintaining atomicity?

```text
Transaction boundary
```

This simple classification resolves many architectural debates.

---

# 80. Complete Request-to-Database Pipeline

A mature API mutation can look like:

```text
                   HTTP Request
                        ↓
                 Route Handler
                        ↓
             Parse + Validate Input
                        ↓
                 Authentication
                        ↓
                  Authorization
                        ↓
                Application Command
                        ↓
               Application Service
                        ↓
                 Domain Policy
                        ↓
                  Transaction
             ┌──────────┼──────────┐
             ↓          ↓          ↓
        Repository  Repository  Repository
             └──────────┼──────────┘
                        ↓
                     Database
                        ↓
                     Commit
                        ↓
                  Domain Result
                        ↓
                  Response DTO
                        ↓
                   HTTP Response
```

External effects can then continue through:

```text
Commit
  ↓
Outbox
  ↓
Worker
  ↓
External systems
```

---

# 81. Core Mental Model

The entire part can be compressed to:

```text
HTTP
 ↓
Use Case
 ↓
Business Rules
 ↓
Persistence
```

Or more precisely:

```text
Route Handler
     ↓
Application Service
     ↓
Domain
     ↓
Repository
     ↓
Database
```

With external effects:

```text
Database Commit
     ↓
Outbox
     ↓
External Side Effects
```

The governing principle is:

> **A Route Handler should translate HTTP into a meaningful application operation, while application/domain layers own business behavior and data-access layers own persistence concerns.**

---

# 82. Critical Distinctions

Remember:

```text
Route Handler ≠ Application Service

Application Service ≠ Domain Model

Domain Logic ≠ Persistence Logic

Repository ≠ Business Service

ORM ≠ Architecture

Authentication ≠ Authorization

Application Validation ≠ Database Integrity

Database Transaction ≠ Distributed Transaction

Database Commit ≠ External Side Effect

Client Retry ≠ Safe Retry

HTTP Request ≠ Application Command

Database Entity ≠ API DTO

Cache Invalidation ≠ Database Transaction
```

These distinctions are fundamental to scalable full-stack architecture.

---

# 83. Completion Checklist

You should be able to:

### Route Handler

* [ ] Keep HTTP concerns at the boundary
* [ ] Parse and validate requests
* [ ] Authenticate
* [ ] Authorize
* [ ] Construct application commands
* [ ] Map application results to HTTP

### Application Layer

* [ ] Define use cases
* [ ] Design application commands
* [ ] Coordinate repositories
* [ ] Coordinate transactions
* [ ] Coordinate external services
* [ ] Handle application-level orchestration

### Domain

* [ ] Identify business invariants
* [ ] Model state transitions
* [ ] Separate business rules from HTTP
* [ ] Handle domain decisions

### Data Access

* [ ] Design repositories where useful
* [ ] Scope queries by tenant/resource
* [ ] Understand ORM boundaries
* [ ] Avoid N+1 queries
* [ ] Use projections appropriately
* [ ] Understand database constraints

### Transactions

* [ ] Identify atomic operations
* [ ] Choose transaction boundaries
* [ ] Understand rollback
* [ ] Handle concurrency
* [ ] Understand transactional outbox
* [ ] Separate DB transactions from external effects

### External Systems

* [ ] Define external clients
* [ ] Handle timeouts
* [ ] Handle retries
* [ ] Handle provider failures
* [ ] Understand idempotency

### SDE-2 reasoning

* [ ] Diagnose fat Route Handlers
* [ ] Identify incorrect responsibility placement
* [ ] Design transaction boundaries
* [ ] Reason about concurrency
* [ ] Reason about distributed side effects
* [ ] Defend architecture tradeoffs

---

# 84. Part Boundary

### Part 01 — HTTP & Server Endpoint Mental Model

```text
HTTP protocol
request/response
endpoint semantics
```

### Part 02 — Next.js Route Handlers Fundamentals

```text
route.ts
HTTP methods
Route Handler execution
```

### Part 03 — Request Parsing & Response Architecture

```text
request parsing
normalization
validation
response DTOs
error contracts
```

### Part 04 — API Authentication & Authorization

```text
credentials
principal
authentication
authorization
RBAC
resource ownership
tenant authorization
security boundaries
```

### Part 05 — API Data Access & Business Logic Boundaries

```text
Route Handler
Application Service
Domain
Repository
Database
Transactions
Business invariants
External service boundaries
Outbox architecture
Concurrency
```

### Part 06 — API Error Contracts, Validation & Idempotency

Next:

```text
Validation contracts
error taxonomy
domain errors
HTTP error mapping
idempotency
safe retries
duplicate requests
conflict semantics
failure recovery
```

The next part should build on the boundaries established here rather than re-teaching request parsing or authentication.

---

# KPI 08 Progress

```text
Part 01  HTTP & Server Endpoint Mental Model             ✓
Part 02  Next.js Route Handlers Fundamentals            ✓
Part 03  Request Parsing & Response Architecture        ✓
Part 04  API Authentication & Authorization             ✓
Part 05  API Data Access & Business Logic Boundaries    ✓
Part 06  API Error Contracts, Validation & Idempotency  → NEXT
Part 07  API Caching, Rate Limiting & Resilience
Part 08  BFF, Aggregation & External Integrations
Part 09  API Observability, Testing & Operations
Part 10  Production API Architecture Capstone
```

**Part 05 complete.**
