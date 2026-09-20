# Level 08 — KPI 08 — Part 10

## Production API Architecture Capstone

---

# 1. Part Objective

This is the integration and judgment layer for **KPI 08 — API Architecture & Route Handlers**.

The purpose is not to introduce another isolated API concept.

The purpose is to demonstrate that you can take everything from Parts 01–09 and design a coherent production API architecture.

You must be able to reason across:

```text
HTTP
↓
Route Handlers
↓
Request Parsing
↓
Authentication
↓
Authorization
↓
Validation
↓
Business Logic
↓
Data Access
↓
Caching
↓
Rate Limiting
↓
Resilience
↓
BFF / Aggregation
↓
External Integrations
↓
Observability
↓
Testing
↓
Production Operations
```

The central SDE-2 question is:

> **Can you design an API boundary that remains correct when requests are malformed, users are unauthorized, dependencies fail, traffic spikes, requests are duplicated, data becomes stale, contracts evolve, and production incidents occur?**

---

# 2. KPI 08 Complete Mental Model

The complete API architecture is:

```text
                         CLIENT
                           │
                           ▼
                    ┌─────────────┐
                    │ HTTP Request│
                    └──────┬──────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Route Handler    │
                  │ / API Boundary   │
                  └────────┬─────────┘
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
        Authentication  Validation   Rate Limit
             │             │             │
             └─────────────┼─────────────┘
                           ▼
                  ┌──────────────────┐
                  │ Business Logic   │
                  └────────┬─────────┘
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
          Database       Cache       Dependencies
             │             │             │
             └─────────────┼─────────────┘
                           ▼
                  ┌──────────────────┐
                  │ Error Mapping    │
                  │ Response Contract│
                  └────────┬─────────┘
                           │
                           ▼
                        RESPONSE

          ┌───────────────┼────────────────┐
          ▼               ▼                ▼
        Logs           Metrics           Traces
          └───────────────┼────────────────┘
                          ▼
                    OPERATIONS
```

This is the system you should be able to design without relying on memorized templates.

---

# 3. Layer 1 — HTTP Boundary

The API begins with HTTP.

You must understand:

```text
method
URL
headers
cookies
query parameters
path parameters
body
status code
response headers
```

The handler should establish the protocol boundary.

Example:

```text
POST /api/orders
```

The endpoint must answer:

```text
Who is calling?
What are they asking for?
Is the request structurally valid?
Are they allowed to perform this operation?
What business operation should execute?
What response contract should be returned?
```

---

# 4. Layer 2 — Route Handler

The Route Handler should generally be an adapter between HTTP and application capabilities.

Conceptually:

```text
HTTP
 ↓
Route Handler
 ↓
Application Service
 ↓
Domain / Data Access
```

Avoid allowing the handler to become:

```text
HTTP parsing
+
authorization
+
business logic
+
database queries
+
provider integration
+
response transformation
+
logging
```

all in one function.

A large handler becomes difficult to:

```text
test
reason about
reuse
evolve
observe
```

---

# 5. Layer 3 — Authentication

Authentication answers:

> **Who is making this request?**

Possible states:

```text
anonymous
authenticated
expired
invalid
```

The API should resolve identity before performing protected operations.

Conceptually:

```text
Request
 ↓
Session / credential resolution
 ↓
Principal
```

Example:

```ts
type Principal = {
  userId: string
  tenantId: string
}
```

The exact structure depends on the application.

---

# 6. Layer 4 — Authorization

Authentication is not authorization.

Authentication:

```text
Who are you?
```

Authorization:

```text
Are you allowed to do this?
```

For example:

```text
user = authenticated
```

does not imply:

```text
user may delete this order
```

A production authorization decision may depend on:

```text
principal
resource
tenant
action
role
ownership
policy
```

Conceptually:

```text
authorize(principal, action, resource)
```

---

# 7. Layer 5 — Tenant Isolation

For multi-tenant systems:

```text
Request
 ↓
Tenant resolution
 ↓
Authentication
 ↓
Tenant membership
 ↓
Authorization
```

A critical invariant is:

> **A request must never access data outside its authorized tenant context.**

This must be enforced beyond routing.

For example:

```text
tenant context
 ↓
service
 ↓
repository
 ↓
query
```

The tenant boundary must survive the entire request lifecycle.

---

# 8. Layer 6 — Validation

Validation protects the API boundary.

Separate:

```text
shape validation
```

from:

```text
business validation
```

Example:

```text
email must be a string
```

is structural validation.

```text
email must not already belong to another account
```

is business validation.

The server remains authoritative.

Client validation improves UX.

It does not establish security.

---

# 9. Canonical Input

A mature API does not allow every internal layer to interpret raw HTTP differently.

Instead:

```text
Raw Request
    ↓
Parse
    ↓
Validate
    ↓
Normalize
    ↓
Canonical Input
    ↓
Business Logic
```

Example:

```text
"  user@example.com "
```

may become:

```text
"user@example.com"
```

if normalization is part of the API contract.

---

# 10. Layer 7 — Business Logic

The Route Handler should invoke an application capability.

Conceptually:

```ts
const result = await createOrder({
  principal,
  input
})
```

rather than:

```ts
// giant route handler
parse()
authorize()
query()
calculate()
callProvider()
invalidateCache()
formatResponse()
```

The application layer should represent business operations.

Examples:

```text
createOrder
cancelOrder
updateProfile
createSubscription
changeRole
```

---

# 11. Layer 8 — Data Access

Data access should have a clear boundary.

```text
Route Handler
    ↓
Application Service
    ↓
Repository / Data Access
    ↓
Database
```

This prevents HTTP concerns from leaking into persistence.

The database is the source of truth for durable state.

Cache is not automatically the source of truth.

---

# 12. Layer 9 — Cache

Caching should be introduced only after defining:

```text
What is being cached?
Who can share it?
What determines its identity?
How long may it remain stale?
What invalidates it?
```

For example:

```text
Product Catalog
```

may be shared.

But:

```text
User-specific dashboard
```

may require user-scoped representation.

The key question is:

> **Can this representation safely be reused by another request?**

---

# 13. Layer 10 — Idempotency

Mutation APIs must explicitly reason about retries and duplicate requests.

Example:

```text
POST /api/payments
Idempotency-Key: abc123
```

Conceptually:

```text
Request
 ↓
Idempotency lookup
 ↓
already completed?
 ├── yes → return previous result
 └── no
      ↓
execute mutation
      ↓
persist result
```

Critical invariant:

```text
same idempotency key
+
same operation
=
same logical effect
```

The system must also define behavior for:

```text
same key + different payload
```

---

# 14. Layer 11 — Error Contract

Errors should be deliberate.

Example:

```json
{
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Order was not found"
  }
}
```

The API should distinguish:

```text
400
401
403
404
409
422
429
500
502
503
504
```

according to the semantics established by the API contract.

The frontend should not need to parse arbitrary server error strings.

---

# 15. Error Mapping

Internal failures should not leak directly through the API.

Example internal failure:

```text
DatabaseUniqueConstraintError
```

could become:

```text
409 Conflict
```

with:

```text
EMAIL_ALREADY_EXISTS
```

External provider errors should also be mapped.

The public API should not expose:

```text
database stack traces
provider credentials
internal service topology
implementation-specific exceptions
```

---

# 16. Layer 12 — Rate Limiting

Rate limiting protects the system from excessive demand.

Possible scopes:

```text
IP
user
tenant
API key
endpoint
operation
```

The correct scope depends on the threat model and business semantics.

A production rate-limit response should be machine-readable and may include:

```text
429
Retry-After
error code
```

---

# 17. Layer 13 — Timeouts

Every external dependency should have a bounded timeout.

Without a timeout:

```text
dependency hangs
 ↓
API request waits
 ↓
connections remain occupied
 ↓
concurrency increases
 ↓
system saturates
```

Timeouts are therefore a resource-protection mechanism, not merely an error-handling detail.

---

# 18. Layer 14 — Retries

Retries must be selective.

Safe candidates may include transient failures for idempotent operations.

Unsafe pattern:

```text
POST mutation
 ↓
timeout
 ↓
blind retry
```

without idempotency protection.

Retries should consider:

```text
error type
operation semantics
attempt count
backoff
jitter
deadline
idempotency
downstream capacity
```

---

# 19. Layer 15 — Circuit Breaking

A failing dependency can create a feedback loop:

```text
dependency slows
 ↓
API waits
 ↓
timeouts
 ↓
retries
 ↓
more dependency traffic
 ↓
dependency becomes slower
```

A circuit breaker can help prevent continued traffic to an unhealthy dependency.

Conceptually:

```text
CLOSED
  ↓ failure threshold
OPEN
  ↓ recovery probe
HALF-OPEN
  ↓
CLOSED
```

The implementation details can vary.

The architectural purpose is:

> **Prevent one unhealthy dependency from consuming the entire application's capacity.**

---

# 20. Layer 16 — Bulkheads

Bulkheads isolate resources.

Example:

```text
Checkout requests
        │
        ├── pool A
        │
Search requests
        │
        └── pool B
```

If search traffic becomes pathological:

```text
search overload
```

it should not necessarily consume every resource needed by:

```text
checkout
```

This is capacity isolation.

---

# 21. Layer 17 — BFF

The BFF is a frontend-oriented composition layer.

```text
Browser
   ↓
BFF
 ├── User Service
 ├── Inventory
 ├── Pricing
 └── Recommendations
```

The BFF may:

```text
aggregate
transform
filter
authorize
compose
```

responses for the frontend.

But:

```text
BFF ≠ domain service
BFF ≠ database
BFF ≠ API gateway
```

---

# 22. Fan-Out Architecture

Suppose the browser requires:

```text
user
orders
recommendations
```

Instead of:

```text
Browser → user
Browser → orders
Browser → recommendations
```

the BFF may provide:

```text
Browser
   ↓
GET /dashboard
   ↓
BFF
 ├── user
 ├── orders
 └── recommendations
```

This reduces client orchestration.

But the BFF now owns a dependency graph.

---

# 23. Bounded Parallelism

If dependencies are independent:

```text
user
orders
recommendations
```

they may be fetched concurrently.

But:

```text
parallelism ≠ unlimited fan-out
```

Ten browser requests that each fan out to ten services can produce:

```text
10 × 10 = 100 downstream calls
```

at the same moment.

Therefore fan-out requires capacity analysis.

---

# 24. Partial Failure

Suppose:

```text
user       ✓
orders     ✓
recommendations ✗
```

The system must explicitly decide whether recommendations are:

```text
critical
optional
fallbackable
```

A mature contract preserves failure semantics.

Avoid:

```text
recommendations = []
```

when the real state is:

```text
recommendations service unavailable
```

---

# 25. External Provider Boundary

External integrations should have their own client boundary.

```text
Application Service
       ↓
Provider Client
       ↓
External API
```

The provider client owns provider-specific details:

```text
authentication
headers
timeouts
retries
response parsing
provider errors
```

The business layer should not become coupled to provider-specific HTTP details.

---

# 26. Distributed Transaction Reality

Suppose:

```text
Create Order
 ↓
Charge Payment
 ↓
Reserve Inventory
```

These may involve different systems.

You cannot assume:

```text
one database transaction
```

will atomically cover everything.

Possible architecture:

```text
Order
 ↓
Payment
 ↓
Inventory
```

with explicit workflow state and compensation where required.

This leads toward:

```text
saga
workflow
outbox
compensation
```

rather than pretending distributed operations are one local transaction.

---

# 27. Observability Architecture

Every important request should produce correlated telemetry.

```text
Request
 ↓
requestId
 ↓
trace
 ├── auth
 ├── business operation
 ├── database
 ├── dependency A
 └── dependency B
```

Metrics provide aggregate behavior:

```text
rate
latency
errors
saturation
```

Logs provide event detail.

Traces provide request-path causality.

---

# 28. Production Debugging

Suppose:

```text
POST /checkout
```

has increased latency.

Start with:

```text
request rate
```

Then:

```text
5xx / timeout rate
```

Then:

```text
latency percentile
```

Then:

```text
trace
```

Then:

```text
dependency spans
```

Then:

```text
structured logs
```

Then:

```text
recent deployments
```

This converts:

```text
"checkout is slow"
```

into an evidence-based diagnosis.

---

# 29. Testing Architecture

The full API should have multiple testing layers.

```text
                    E2E
                     │
              Integration
               /          \
          Contract      Failure
             │             │
             └─────┬───────┘
                   │
                 Unit
```

### Unit

Business behavior.

### Integration

Component boundaries.

### Contract

Consumer/provider compatibility.

### Failure

Timeouts, dependency errors, retries, partial failures.

### E2E

Complete user workflows.

---

# 30. Concurrency Testing

Production APIs must be tested under concurrency.

Examples:

```text
two updates at once
two identical mutations
same idempotency key
different users
different tenants
cache regeneration race
```

A test that only performs:

```text
request → response
```

may miss race conditions entirely.

---

# 31. API Contract Evolution

A production API must evolve without unexpectedly breaking consumers.

Potential changes:

```text
add optional field
remove field
rename field
change type
change error code
change status code
change semantics
```

These are not equally safe.

For example:

```text
adding optional field
```

is often less disruptive than:

```text
renaming existing field
```

The API contract must therefore be treated as a compatibility boundary.

---

# 32. Versioning

Possible approaches include:

```text
URL versioning
Header versioning
Content negotiation
Backward-compatible evolution
```

Do not introduce versioning mechanically.

First ask:

```text
Can the contract evolve compatibly?
```

If yes, an explicit new version may not be necessary.

---

# 33. API Security Boundary

A production API must defend against:

```text
authentication bypass
authorization bypass
tenant escape
input injection
SSRF
secret exposure
open redirects
mass assignment
excessive data exposure
replay
abuse
```

Security must be enforced server-side.

The browser is not a trusted security boundary.

---

# 34. Mass Assignment

Dangerous:

```ts
updateUser(request.body)
```

The client may send:

```json
{
  "name": "Alice",
  "role": "admin"
}
```

when only:

```text
name
```

was intended to be mutable.

Prefer explicit writable fields:

```ts
updateUser({
  name: input.name
})
```

The API contract should define what clients may change.

---

# 35. SSRF

A backend endpoint that accepts arbitrary URLs can become an SSRF vector.

Dangerous concept:

```text
POST /fetch
{
  "url": "..."
}
```

The server must not blindly fetch arbitrary destinations.

External URL fetching requires explicit security controls.

---

# 36. Caching + Security

One of the most dangerous API interactions is:

```text
personalized response
+
shared cache
```

Suppose:

```text
GET /api/profile
```

returns:

```text
User A
```

and the response is accidentally stored in a shared cache.

User B could receive:

```text
User A's profile
```

Therefore:

> **Cache identity must include every representation-affecting security context.**

---

# 37. Tenant Cache Isolation

Similarly:

```text
tenant=A
GET /api/products
```

must not collide with:

```text
tenant=B
GET /api/products
```

if the representations differ.

Conceptually:

```text
cacheKey =
route
+
tenant
+
locale
+
representation context
```

The exact key design depends on the architecture.

---

# 38. API + Next.js Integration

Within Next.js, the architecture may include:

```text
Server Components
        │
        ├── read data
        │
        ▼
Application capabilities
        │
        ├── Route Handlers
        ├── Server Actions
        └── shared services
```

The goal is to avoid creating unnecessary duplication:

```text
Server Action
   ↓
fetch internal API
   ↓
Route Handler
   ↓
Service
```

when both server-side entry points can safely share the application capability directly.

---

# 39. Route Handler vs Server Action

Use the abstraction based on the boundary.

A Route Handler is appropriate when exposing an HTTP API boundary:

```text
external client
mobile client
webhook
integration
browser fetch
```

A Server Action is useful for framework-integrated mutations from the application UI.

The underlying business capability should not necessarily be duplicated.

Conceptually:

```text
             Application Capability
               /              \
              /                \
     Server Action        Route Handler
          │                     │
       UI mutation          HTTP boundary
```

---

# 40. Complete Example — Order API

Consider:

```text
POST /api/orders
```

Request:

```json
{
  "items": [
    {
      "productId": "p1",
      "quantity": 2
    }
  ]
}
```

Architecture:

```text
HTTP
 ↓
Route Handler
 ↓
Authenticate
 ↓
Resolve Tenant
 ↓
Validate Input
 ↓
Rate Limit
 ↓
Idempotency
 ↓
Create Order Service
 ↓
Inventory
 ↓
Database
 ↓
Cache Invalidation
 ↓
Response Mapping
 ↓
Telemetry
```

This is a complete request lifecycle.

---

# 41. Order API Failure Cases

### Anonymous

```text
401
```

### Invalid input

```text
400 / 422
```

according to the defined contract.

### Unauthorized tenant

```text
403
```

### Product unavailable

```text
domain-specific failure
```

### Duplicate idempotency key

```text
previous result
```

or explicit conflict if the payload differs.

### Inventory timeout

```text
bounded failure
```

not an indefinitely hanging request.

### Database outage

```text
controlled 5xx
```

with internal diagnostics.

---

# 42. Order API Cache Interaction

Suppose successful order creation changes:

```text
order history
inventory
dashboard
product availability
```

The mutation must define affected representations.

Conceptually:

```text
Order Mutation
      ↓
Source-of-truth update
      ↓
Invalidation
      ↓
Affected representations become stale
      ↓
Next read regenerates / refreshes
```

This connects KPI 08 with the caching architecture from KPI 06.

---

# 43. Order API Observability

Useful telemetry:

```text
order_creation_attempts
order_creation_success
order_creation_failure
order_creation_latency
inventory_dependency_latency
inventory_timeout_count
database_latency
idempotency_replay_count
rate_limit_rejection_count
```

A trace might show:

```text
POST /api/orders
 ├── auth           5ms
 ├── validation     1ms
 ├── inventory     90ms
 ├── database      30ms
 └── response       4ms
```

---

# 44. Production Architecture Diagram

The complete design:

```text
                           CLIENT
                              │
                              ▼
                       ┌─────────────┐
                       │ HTTP / TLS  │
                       └──────┬──────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Route Handler    │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        Authentication   Validation    Rate Limit
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                    ┌──────────────────┐
                    │ Application      │
                    │ Service          │
                    └────────┬─────────┘
                             │
              ┌──────────────┼───────────────┐
              ▼              ▼               ▼
          Database         Cache        External APIs
              │              │               │
              │              │        ┌──────┴──────┐
              │              │        │ timeout     │
              │              │        │ retry       │
              │              │        │ backoff     │
              │              │        │ circuit     │
              │              │        └─────────────┘
              │              │
              └──────────────┼───────────────┐
                             ▼               │
                       Response Contract     │
                             │               │
                             ▼               │
                          CLIENT             │
                                             │
                 ┌───────────────────────────┘
                 │
                 ▼
        ┌──────────────────────┐
        │ Observability        │
        │ Logs / Metrics /     │
        │ Traces               │
        └──────────┬───────────┘
                   ▼
        ┌──────────────────────┐
        │ Operations           │
        │ Alerts / SLO /       │
        │ Incident Response    │
        └──────────────────────┘
```

---

# 45. Architecture Decision Framework

When designing a new API, ask these questions in order.

## Boundary

```text
Who consumes this API?
```

## Protocol

```text
What HTTP semantics are required?
```

## Identity

```text
Who is calling?
```

## Authorization

```text
What may they do?
```

## Input

```text
What constitutes valid input?
```

## Business Operation

```text
What capability is being executed?
```

## Data

```text
What is the source of truth?
```

## Caching

```text
What can safely be reused?
```

## Mutation

```text
Can this request be duplicated?
```

## Resilience

```text
What happens when dependencies fail?
```

## Performance

```text
What is the latency and capacity budget?
```

## Observability

```text
How will we know it is failing?
```

## Testing

```text
How will we prove the contract and failure behavior?
```

## Operations

```text
How will we deploy, monitor, debug, and recover it?
```

---

# 46. The Most Important SDE-2 Tradeoffs

You should be able to defend decisions such as:

```text
Route Handler vs Server Action
```

```text
BFF vs direct service access
```

```text
Sequential vs parallel downstream calls
```

```text
Cache vs fresh read
```

```text
Retry vs fail fast
```

```text
Partial response vs total failure
```

```text
Shared cache vs personalized response
```

```text
Synchronous vs asynchronous work
```

```text
Single API vs multiple specialized APIs
```

```text
Backward compatibility vs versioning
```

```text
Strict consistency vs eventual consistency
```

There is no universal answer.

The SDE-2 skill is understanding:

```text
requirements
constraints
failure modes
operational cost
security implications
```

before selecting the architecture.

---

# 47. Production API Anti-Patterns

Avoid:

```text
giant Route Handlers
```

```text
client-only authorization
```

```text
database queries directly inside every handler
```

```text
blind retries
```

```text
unbounded fan-out
```

```text
shared caching of personalized data
```

```text
returning 200 for failures
```

```text
logging entire requests
```

```text
high-cardinality metrics
```

```text
liveness coupled to every dependency
```

```text
provider-specific errors leaking into public contracts
```

```text
business logic duplicated between Route Handlers and Server Actions
```

```text
assuming distributed operations are one transaction
```

---

# 48. Final SDE-2 Scenario

You are asked:

> "Build a multi-tenant dashboard API in Next.js."

The dashboard requires:

```text
user
orders
inventory
recommendations
```

You should immediately reason:

```text
1. Resolve tenant.
2. Authenticate user.
3. Verify tenant membership.
4. Authorize dashboard access.
5. Validate query parameters.
6. Rate-limit requests.
7. Identify cacheable vs personalized data.
8. Fan out to independent dependencies carefully.
9. Bound total latency.
10. Apply dependency timeouts.
11. Retry only safe operations.
12. Define partial-failure semantics.
13. Shape the response into a frontend DTO.
14. Preserve error semantics.
15. Instrument every dependency.
16. Test contracts.
17. Test dependency failures.
18. Test tenant isolation.
19. Test cache isolation.
20. Define health and operational signals.
```

That is the reasoning expected at SDE-2 level.

---

# 49. Prediction Challenge — Full System

Predict what happens if:

```text
dashboard request
 ↓
BFF
 ↓
5 services
```

and:

```text
each service = 200ms
```

with sequential execution.

Approximate latency:

```text
5 × 200ms = 1000ms
```

If parallel:

```text
≈ max(service latency)
≈ 200ms
```

before overhead.

Now introduce:

```text
10 concurrent dashboard requests
```

and:

```text
each dashboard fans out to 5 services
```

Potential downstream request count:

```text
10 × 5 = 50
```

Now introduce automatic retries.

The actual downstream load can become significantly higher.

This is why architecture must be reasoned about as a system rather than endpoint-by-endpoint.

---

# 50. Final KPI 08 Mental Model

The complete model is:

```text
HTTP
 ↓
Endpoint Boundary
 ↓
Identity
 ↓
Authorization
 ↓
Validation
 ↓
Application Capability
 ↓
Data / Dependencies
 ↓
Consistency
 ↓
Caching
 ↓
Idempotency
 ↓
Resilience
 ↓
Response Contract
 ↓
Observability
 ↓
Testing
 ↓
Operations
```

And for composed systems:

```text
                BFF
                 │
       ┌─────────┼─────────┐
       ▼         ▼         ▼
   Service A Service B Service C
       │         │         │
       └─────────┼─────────┘
                 ▼
        Resilience Boundary
                 │
                 ▼
          Observability
```

---

# 51. KPI 08 Completion Checklist

You should now be independently capable of:

### HTTP

```text
[ ] Explain HTTP endpoint semantics
[ ] Choose appropriate methods
[ ] Choose status codes
[ ] Design request/response contracts
```

### Next.js

```text
[ ] Build Route Handlers
[ ] Parse requests
[ ] Produce responses
[ ] Understand Route Handler boundaries
```

### Security

```text
[ ] Authenticate requests
[ ] Authorize resources
[ ] Enforce tenant isolation
[ ] Prevent mass assignment
[ ] Reason about SSRF
[ ] Protect sensitive telemetry
```

### Business Logic

```text
[ ] Separate transport from business logic
[ ] Establish service boundaries
[ ] Establish data-access boundaries
```

### Validation

```text
[ ] Validate structure
[ ] Validate semantics
[ ] Normalize input
[ ] Produce stable validation errors
```

### Mutation

```text
[ ] Understand idempotency
[ ] Handle duplicate requests
[ ] Handle concurrent requests
[ ] Reason about retries
```

### Caching

```text
[ ] Identify cacheable representations
[ ] Design cache identity
[ ] Prevent tenant collisions
[ ] Prevent personalized-data leaks
[ ] Invalidate affected representations
```

### Resilience

```text
[ ] Configure timeouts
[ ] Design safe retries
[ ] Use backoff
[ ] Reason about circuit breakers
[ ] Apply bulkheads
[ ] Handle partial failures
[ ] Apply backpressure
```

### BFF

```text
[ ] Explain BFF architecture
[ ] Aggregate dependencies
[ ] Control fan-out
[ ] Shape frontend DTOs
[ ] Handle partial failure
```

### External Integrations

```text
[ ] Isolate provider clients
[ ] Map provider errors
[ ] Protect secrets
[ ] Handle provider timeouts
[ ] Reason about distributed transactions
```

### Observability

```text
[ ] Structured logging
[ ] Correlation IDs
[ ] Metrics
[ ] Tracing
[ ] Dependency telemetry
[ ] SLOs
[ ] Alerting
```

### Testing

```text
[ ] Unit tests
[ ] Integration tests
[ ] Contract tests
[ ] Failure tests
[ ] Concurrency tests
[ ] Security tests
[ ] E2E tests
```

### Operations

```text
[ ] Health checks
[ ] Readiness
[ ] Incident debugging
[ ] Deployment metadata
[ ] Rollback
[ ] Synthetic monitoring
```

---

# 52. KPI 08 — LOCKED COMPLETE

```text
KPI 08 — API Architecture & Route Handlers

Part 01 ✓ HTTP & Server Endpoint Mental Model
Part 02 ✓ Next.js Route Handlers Fundamentals
Part 03 ✓ Request Parsing & Response Architecture
Part 04 ✓ API Authentication & Authorization
Part 05 ✓ API Data Access & Business Logic Boundaries
Part 06 ✓ API Error Contracts, Validation & Idempotency
Part 07 ✓ API Caching, Rate Limiting & Resilience
Part 08 ✓ BFF, Aggregation & External Integrations
Part 09 ✓ API Observability, Testing & Production Operations
Part 10 ✓ Production API Architecture Capstone
```

**KPI 08 is now complete.**

The next work should move to the **next KPI in the locked Level 08 curriculum**, rather than extending API knowledge indefinitely.

---

# Final Principle

An SDE-2 does not merely know how to create an endpoint.

They can reason about the endpoint as a production system:

```text
                CORRECTNESS
                     │
                     ▼
SECURITY ───────► API ◄─────── PERFORMANCE
                     │
                     ▼
               RESILIENCE
                     │
                     ▼
             OBSERVABILITY
                     │
                     ▼
                 TESTING
                     │
                     ▼
                OPERATIONS
```

The endpoint is only the entry point.

The engineering responsibility is the entire lifecycle.
