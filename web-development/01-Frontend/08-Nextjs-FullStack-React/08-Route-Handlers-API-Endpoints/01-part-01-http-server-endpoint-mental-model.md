# Level 08 — KPI 08 — Part 01: HTTP & Server Endpoint Mental Model

## 1. Part Objective

Before learning Next.js Route Handlers, you need a strong mental model of what a server endpoint actually is.

A Route Handler is not fundamentally a Next.js concept.

It is a framework mechanism for implementing an **HTTP endpoint**.

The architecture is therefore:

```text
Client
   ↓
HTTP Request
   ↓
Server Endpoint
   ↓
Application Logic
   ↓
HTTP Response
   ↓
Client
```

The purpose of this part is to understand:

* HTTP request/response semantics
* HTTP methods
* safe vs unsafe operations
* idempotency
* status codes
* headers
* request bodies
* response bodies
* content types
* content negotiation
* endpoint boundaries
* resource-oriented API design
* synchronous request processing
* failure semantics
* retries
* why these concepts matter before implementing Route Handlers

The governing question is:

> **What contract does an HTTP endpoint establish between a client and a server?**

---

# 2. What Is an HTTP Endpoint?

An HTTP endpoint is a server-accessible interface that accepts an HTTP request and produces an HTTP response.

Conceptually:

```text
HTTP Request
     ↓
┌──────────────────────┐
│ Server Endpoint      │
│                      │
│ Validate             │
│ Authenticate         │
│ Authorize            │
│ Execute operation    │
│ Produce result       │
└──────────┬───────────┘
           ↓
     HTTP Response
```

For example:

```text
GET /api/products/42
```

might represent:

```text
Retrieve product 42
```

while:

```text
POST /api/products
```

might represent:

```text
Create a new product
```

The endpoint is therefore more than a URL.

Its behavior is determined by:

```text
Method
+
URL
+
Headers
+
Body
+
Authentication context
+
Server-side rules
```

---

# 3. Endpoint as a Contract

An API endpoint establishes a contract.

For example:

```text
GET /api/products/42
```

could define:

### Request

```text
Method:
GET

Path:
 /api/products/42

Headers:
 Authorization: ...
 Accept: application/json
```

### Response

```text
Status:
200

Content-Type:
application/json

Body:
{
  "id": 42,
  "name": "Keyboard",
  "price": 99
}
```

The client depends on this contract.

Therefore changing:

```text
field names
status semantics
error structure
authentication requirements
method semantics
```

can be a breaking change even if the server implementation remains internally correct.

---

# 4. HTTP Request Anatomy

An HTTP request can be modeled as:

```text
┌───────────────────────────────────┐
│ Method + Target                   │
├───────────────────────────────────┤
│ Headers                           │
├───────────────────────────────────┤
│                                   │
│ Body                              │
│                                   │
└───────────────────────────────────┘
```

For example:

```text
POST /api/orders HTTP/1.1

Host: example.com
Content-Type: application/json
Authorization: Bearer ...

{
  "productId": 42,
  "quantity": 2
}
```

Conceptually:

```text
Request =
    Method
  + Target
  + Headers
  + Body
```

---

# 5. HTTP Response Anatomy

A response follows the same fundamental model:

```text
┌───────────────────────────────────┐
│ Status                            │
├───────────────────────────────────┤
│ Headers                           │
├───────────────────────────────────┤
│                                   │
│ Body                              │
│                                   │
└───────────────────────────────────┘
```

Example:

```text
HTTP/1.1 201 Created

Content-Type: application/json

{
  "id": 123
}
```

Conceptually:

```text
Response =
    Status
  + Headers
  + Body
```

---

# 6. HTTP Method Semantics

HTTP methods communicate the intended operation.

Common methods:

```text
GET
POST
PUT
PATCH
DELETE
HEAD
OPTIONS
```

For application APIs, the most important are usually:

```text
GET
POST
PUT
PATCH
DELETE
```

The method is part of the endpoint contract.

Therefore:

```text
GET /api/orders
```

and:

```text
POST /api/orders
```

are different operations even though the URL is identical.

---

# 7. GET

`GET` is generally used to retrieve a representation of a resource.

Example:

```text
GET /api/products/42
```

Conceptually:

```text
Client
  ↓
"Give me product 42"
  ↓
Server
  ↓
Representation
```

GET should be **safe**.

That means the intended semantics of the request do not ask the server to modify application state.

A GET endpoint should therefore not be designed around mutations such as:

```text
GET /api/delete-user?id=42
```

That creates dangerous semantics because systems such as crawlers, prefetchers, caches, or browsers may issue GET requests automatically.

---

# 8. Safe Methods

A method is called safe when the request is intended only to retrieve or inspect information rather than cause a requested state change.

Common safe methods:

```text
GET
HEAD
OPTIONS
```

Safe does not mean:

```text
"Nothing whatsoever can change on the server."
```

For example, a GET might cause:

```text
access logging
metrics
cache updates
```

The important distinction is that the **requested application semantics** are read-only.

---

# 9. POST

`POST` is commonly used when submitting data for server-side processing.

Examples:

```text
POST /api/orders
POST /api/login
POST /api/uploads
POST /api/search
```

POST can represent operations that:

* create resources
* trigger workflows
* execute commands
* submit data
* initiate processing

Example:

```text
POST /api/orders

{
  "productId": 42,
  "quantity": 2
}
```

The server might:

```text
validate
→ authorize
→ create order
→ return result
```

---

# 10. PUT

`PUT` generally represents replacing or creating the representation at a known target resource.

Example:

```text
PUT /api/users/42
```

with:

```json
{
  "name": "Alice",
  "email": "alice@example.com"
}
```

The conceptual semantics are:

```text
"Make resource 42 have this representation."
```

PUT is generally **idempotent**.

That property becomes extremely important when designing retries.

---

# 11. PATCH

`PATCH` is generally used for partial modification.

Example:

```text
PATCH /api/users/42
```

with:

```json
{
  "email": "new@example.com"
}
```

Conceptually:

```text
Existing User
      +
Patch
      ↓
Updated User
```

PATCH semantics depend on the patch format and application design.

Do not automatically assume that every PATCH implementation is safely retryable.

The API contract must define the behavior.

---

# 12. DELETE

`DELETE` requests removal of a target resource.

Example:

```text
DELETE /api/products/42
```

Conceptually:

```text
Resource 42
    ↓
Delete operation
```

DELETE is generally considered idempotent in HTTP semantics.

That does **not** mean the response must be identical on every request.

For example:

```text
First request:
204 No Content
```

followed by:

```text
Second request:
404 Not Found
```

may still be consistent with an idempotent operation because the intended state transition is:

```text
resource absent
```

after the operation.

---

# 13. Idempotency

Idempotency is one of the most important concepts for production API design.

An operation is idempotent when repeating the same request has the same intended effect on server state as performing it once.

Conceptually:

```text
Request
   ↓
State → State'
```

and:

```text
Request
Request
Request
   ↓
State → State'
```

The final intended state remains equivalent.

---

# 14. Why Idempotency Matters

Networks fail.

A client may send:

```text
POST /api/orders
```

and never receive the response.

The client now doesn't know:

```text
Did the server create the order?
```

It may retry.

Without an idempotency strategy:

```text
Request 1
   ↓
Order created

Response lost

Request 2
   ↓
Another order created
```

Now the user has duplicate orders.

This is why idempotency becomes a production architecture concern.

---

# 15. Idempotency Keys

For operations where duplicate execution would be harmful, clients can provide an idempotency key.

Example:

```text
POST /api/payments

Idempotency-Key: payment-attempt-abc123
```

The server can associate:

```text
idempotency key
      ↓
operation result
```

Conceptually:

```text
First request
     ↓
process operation
     ↓
store result against key

Retry
     ↓
same key
     ↓
return existing result
```

This pattern becomes particularly important for:

* payments
* order creation
* provisioning
* external side effects
* workflow initiation

---

# 16. HTTP Status Codes

HTTP status codes communicate the outcome category.

Major groups:

```text
1xx
Informational

2xx
Success

3xx
Redirection

4xx
Client/request-side failure

5xx
Server-side failure
```

The API contract should use status codes intentionally.

---

# 17. Common 2xx Responses

### 200 OK

General successful response.

```text
GET /api/products/42
→ 200
```

### 201 Created

A resource was created.

```text
POST /api/products
→ 201
```

### 202 Accepted

The request has been accepted for processing but is not necessarily complete.

Useful for asynchronous work.

```text
POST /api/reports/generate
→ 202
```

### 204 No Content

Successful request with no response body.

Common example:

```text
DELETE /api/products/42
→ 204
```

The exact choice depends on the API contract.

---

# 18. 3xx Responses

3xx responses communicate redirection.

Examples include:

```text
301
302
303
307
308
```

These are particularly important in conjunction with the middleware architecture from KPI 07.

Remember:

```text
Middleware:
may decide to redirect

Route Handler:
may produce HTTP responses

HTTP:
defines the semantics of the response
```

Routing behavior and HTTP semantics must remain consistent.

---

# 19. 4xx Responses

4xx generally communicate that the request cannot be fulfilled because of client/request context.

Common examples:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
405 Method Not Allowed
409 Conflict
415 Unsupported Media Type
422 Unprocessable Content
429 Too Many Requests
```

The exact choice depends on the situation and API contract.

---

# 20. 400 Bad Request

Use when the request is malformed or otherwise cannot be processed as a valid request.

Examples:

```text
invalid JSON
invalid request structure
malformed parameters
```

Conceptually:

```text
Request
  ↓
Cannot be interpreted as a valid request
  ↓
400
```

Do not use 500 merely because parsing failed.

---

# 21. 401 Unauthorized

Despite the name, `401` generally concerns missing or invalid authentication credentials.

Conceptually:

```text
No valid authentication
        ↓
401
```

Examples:

```text
missing session
expired token
invalid credentials
```

This differs from authorization failure.

---

# 22. 403 Forbidden

`403` generally means the server understood the request and the requester is not permitted to perform the operation.

Conceptually:

```text
Authenticated
     ↓
Not permitted
     ↓
403
```

For example:

```text
User authenticated
+
User lacks admin permission
=
403
```

This distinction is foundational:

```text
401
=
authentication problem

403
=
authorization problem
```

---

# 23. 404 Not Found

`404` generally communicates that the requested resource cannot be found.

Example:

```text
GET /api/products/999999
```

when the resource does not exist.

However, security-sensitive applications sometimes intentionally avoid revealing whether a resource exists.

The response strategy must therefore consider both:

```text
HTTP semantics
+
information disclosure
```

---

# 24. 409 Conflict

`409` is useful when the request conflicts with the current state of the resource.

Examples:

```text
duplicate unique value
concurrent update conflict
invalid state transition
```

Example:

```text
User attempts to reserve a username
```

but another user has already claimed it.

That is conceptually different from:

```text
malformed request
```

---

# 25. 422 Unprocessable Content

`422` is commonly used when the request structure can be understood but the supplied content fails application-level validation.

Example:

```text
email:
valid syntax

age:
-5
```

The JSON is valid.

The request is structurally understandable.

But the supplied values violate application rules.

---

# 26. 429 Too Many Requests

`429` communicates that the requester has exceeded a rate limit.

Example:

```text
Request
   ↓
Rate policy
   ↓
Limit exceeded
   ↓
429
```

This connects directly to KPI 07's request-policy architecture.

The response may also communicate retry information using headers where appropriate.

---

# 27. 5xx Responses

5xx responses generally represent server-side failure.

Examples:

```text
500 Internal Server Error
502 Bad Gateway
503 Service Unavailable
504 Gateway Timeout
```

The important architectural distinction is:

```text
4xx
request cannot be fulfilled because of request/client context

5xx
server-side processing or dependency failure
```

This distinction matters for:

* retries
* monitoring
* alerting
* client behavior
* debugging

---

# 28. 500 Internal Server Error

500 should represent an unexpected server-side failure.

For example:

```text
Unexpected application exception
```

Do not intentionally use:

```text
500
```

for ordinary validation errors.

Bad:

```text
Invalid email
→ 500
```

Better:

```text
Invalid email
→ appropriate 4xx response
```

The API should distinguish expected domain/request failures from unexpected server failures.

---

# 29. 502 Bad Gateway

502 is particularly relevant for BFF architectures.

Suppose:

```text
Browser
   ↓
Next.js BFF
   ↓
External API
```

and the upstream API returns an invalid or unusable response.

The BFF may need to distinguish:

```text
our application failed
```

from:

```text
upstream dependency failed
```

502 can represent an invalid response from an upstream server in an appropriate gateway architecture.

---

# 30. 503 Service Unavailable

503 can communicate temporary inability to serve the request.

Possible causes:

```text
dependency unavailable
overload
maintenance
temporary capacity issue
```

It is particularly relevant when designing resilient APIs.

---

# 31. 504 Gateway Timeout

504 is useful when a gateway/proxy does not receive a timely response from an upstream service.

Conceptually:

```text
BFF
 ↓
External API
 ↓
timeout
 ↓
504
```

This becomes important in Part 08 when we design BFF integrations.

---

# 32. Headers

Headers provide metadata about the request or response.

Examples:

```text
Content-Type
Accept
Authorization
Cache-Control
ETag
Location
Set-Cookie
Retry-After
```

Headers are part of the HTTP contract.

They are not simply incidental metadata.

---

# 33. Content-Type

`Content-Type` tells the receiver what representation format the body uses.

Example:

```text
Content-Type: application/json
```

means the body is JSON.

Other possibilities include:

```text
text/html
text/plain
multipart/form-data
application/octet-stream
```

Correct content typing matters because clients need to know how to interpret the payload.

---

# 34. Accept

The `Accept` header communicates which response representations the client can accept.

Example:

```text
Accept: application/json
```

The server can use this information when deciding the representation format.

This is part of **content negotiation**.

---

# 35. Content Negotiation

Conceptually:

```text
Client
  ↓
Accept: application/json
  ↓
Server
  ↓
JSON representation
```

The client and server negotiate the representation.

This becomes useful when an endpoint may support multiple formats.

However, do not introduce negotiation complexity unless the product actually needs multiple representations.

---

# 36. Request Body

The body carries data sent to the server.

Common body formats:

```text
JSON
FormData
text
binary
multipart
```

For example:

```json
{
  "name": "Keyboard",
  "price": 99
}
```

The server must:

```text
parse
→ validate
→ normalize
→ authorize
→ process
```

The body itself must never be treated as inherently trustworthy.

---

# 37. Query Parameters

Query parameters commonly represent filtering, pagination, searching, or optional modifiers.

Example:

```text
GET /api/products?category=keyboard&page=2
```

Conceptually:

```text
Path
=
resource identity

Query
=
request modifiers
```

This is a useful API design distinction.

---

# 38. Path Parameters

Path parameters commonly identify resources.

Example:

```text
/api/products/42
```

Here:

```text
42
```

identifies a particular resource.

A conceptual distinction is:

```text
/products/42
```

versus:

```text
/products?category=keyboard
```

The first identifies a specific resource.

The second modifies a collection query.

---

# 39. Resource-Oriented Design

An API should expose meaningful domain resources and operations.

Example:

```text
/products
/products/42
/orders
/orders/123
/users/42
```

rather than exposing internal implementation details:

```text
/runSqlQuery
/executeDatabaseProcedure
/internalFunction42
```

The API boundary should represent the application's domain contract.

---

# 40. Collection vs Individual Resource

Consider:

```text
/api/products
```

and:

```text
/api/products/42
```

The first can represent the collection.

The second represents a specific product.

This naturally leads to method semantics:

```text
GET /products
    → list products

POST /products
    → create product

GET /products/42
    → retrieve product

PATCH /products/42
    → partially update product

DELETE /products/42
    → delete product
```

This is a common resource-oriented pattern.

---

# 41. API Endpoint ≠ Database Endpoint

A common architectural mistake is directly mirroring database tables.

For example:

```text
Database:
users
orders
payments
```

does not automatically imply:

```text
/api/users
/api/orders
/api/payments
```

with direct CRUD behavior.

The API represents a **consumer contract**.

The database represents a **persistence model**.

They may align.

They do not have to.

---

# 42. Endpoint Boundary

A server endpoint should provide a controlled boundary:

```text
Client
  ↓
HTTP Contract
  ↓
Endpoint
  ↓
Application/Domain
  ↓
Persistence / External Services
```

The client should not need to know:

```text
which database
which ORM
which internal service
which table
which cache
```

is used behind the endpoint.

This creates implementation freedom.

---

# 43. Endpoint Responsibility

An endpoint commonly coordinates:

```text
Request parsing
      ↓
Validation
      ↓
Authentication
      ↓
Authorization
      ↓
Domain operation
      ↓
Response mapping
```

It should not necessarily contain all the underlying business logic.

That distinction becomes the focus of KPI 08 Part 05.

---

# 44. HTTP Is Stateless by Default

HTTP request processing is fundamentally request-oriented.

Conceptually:

```text
Request A
   ↓
Response A

Request B
   ↓
Response B
```

The server should not assume that the network connection itself represents durable application state.

Application state can exist in:

```text
database
session
cache
token
external service
```

but HTTP itself does not provide application session semantics automatically.

---

# 45. Authentication Context

An endpoint may derive authentication context from:

```text
Cookie
Authorization header
session token
API key
other trusted mechanisms
```

Conceptually:

```text
HTTP Request
      ↓
Authentication Resolution
      ↓
Principal
      ↓
Authorization
      ↓
Operation
```

The endpoint should never treat:

```text
userId
```

sent in arbitrary request data as proof of identity.

For example:

```json
{
  "userId": 42,
  "action": "delete"
}
```

does not establish:

```text
requester = user 42
```

Authentication must come from the appropriate trust mechanism.

---

# 46. Authentication vs Request Data

This distinction is fundamental.

Request body:

```text
{
  "userId": 42
}
```

means:

```text
"The client claims this value."
```

Authenticated principal:

```text
session → user 17
```

means:

```text
"The server has established this identity."
```

Authorization should be based on the authenticated principal and trusted context, not arbitrary client-provided identity fields.

---

# 47. Synchronous Endpoint Lifecycle

A simplified endpoint lifecycle:

```text
Request
   ↓
Parse
   ↓
Validate
   ↓
Authenticate
   ↓
Authorize
   ↓
Execute
   ↓
Map result
   ↓
Respond
```

For a simple endpoint:

```text
GET /api/products/42
```

this might become:

```text
Request
 ↓
Parse ID = 42
 ↓
Validate ID
 ↓
Authenticate if required
 ↓
Authorize access
 ↓
Load product
 ↓
Map product representation
 ↓
200 JSON
```

---

# 48. Mutation Lifecycle

For:

```text
POST /api/orders
```

a more complete lifecycle is:

```text
Request
 ↓
Parse body
 ↓
Validate input
 ↓
Authenticate
 ↓
Authorize
 ↓
Execute transaction
 ↓
Persist state
 ↓
Invalidate/update cache
 ↓
Produce response
```

Notice the connection to KPI 06:

```text
Mutation
→ state change
→ cache consequences
```

API architecture therefore cannot be isolated from the caching architecture.

---

# 49. Response Mapping

Never assume your internal domain object should automatically become your public API response.

Internal object:

```json
{
  "id": 42,
  "internalStatus": "ACTIVE_INTERNAL",
  "databaseVersion": 19,
  "secretMetadata": "...",
  "createdAt": "..."
}
```

Public representation might be:

```json
{
  "id": 42,
  "status": "active",
  "createdAt": "..."
}
```

The endpoint controls the public contract.

---

# 50. Serialization Boundary

Serialization converts internal values into a transport representation.

Conceptually:

```text
Domain Object
      ↓
Response DTO
      ↓
JSON
      ↓
HTTP Response
```

This creates an explicit boundary between:

```text
internal model
```

and:

```text
external contract
```

That boundary becomes important for long-term API evolution.

---

# 51. Error Contract

A production API should have predictable error responses.

Instead of arbitrary:

```text
"Something went wrong"
```

or framework-specific stack traces, establish a structured contract.

For example:

```json
{
  "error": {
    "code": "INVALID_EMAIL",
    "message": "Email address is invalid"
  }
}
```

The exact schema is an application decision.

The principle is:

> **Clients should be able to reason about failures programmatically.**

---

# 52. Never Leak Internal Errors

Bad production response:

```json
{
  "error": "PostgresError: relation users_secret_table does not exist..."
}
```

This leaks implementation details.

Better:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred."
  }
}
```

while detailed information is captured in server-side observability.

---

# 53. Retry Semantics

Clients and infrastructure may retry requests.

Therefore endpoint design must consider:

```text
Can this operation be retried?
What happens if it is retried?
Can it be duplicated?
Can the server distinguish retries?
```

A useful classification:

```text
GET
→ generally retry-friendly

PUT
→ generally idempotent

DELETE
→ generally idempotent

POST
→ potentially non-idempotent
```

But actual application behavior matters more than merely memorizing the method.

---

# 54. Timeouts

An endpoint should not assume dependencies respond instantly.

Consider:

```text
Client
 ↓
BFF
 ↓
Payment API
 ↓
Database
```

If the payment API hangs:

```text
request
   ↓
waiting
   ↓
waiting
   ↓
waiting
```

resources can accumulate.

Production APIs therefore require explicit timeout and failure policies.

Detailed resilience architecture comes later.

---

# 55. Partial Failure

A server endpoint may depend on several systems:

```text
Database
External API
Cache
Authentication service
Feature service
```

Any dependency can fail.

The endpoint must define what happens when:

```text
dependency A succeeds
dependency B fails
dependency C times out
```

This becomes especially important in BFF architectures.

---

# 56. API as a Contract Boundary

Think of the API as:

```text
┌─────────────────────────────────┐
│         PUBLIC CONTRACT         │
│                                 │
│ Methods                         │
│ URLs                            │
│ Request schema                  │
│ Authentication                 │
│ Status codes                    │
│ Response schema                 │
│ Error semantics                 │
│ Retry semantics                 │
└───────────────┬─────────────────┘
                ↓
        Internal Architecture
```

The internal architecture can evolve without necessarily changing the external contract.

---

# 57. Common API Anti-Pattern: Everything Is POST

An API sometimes degenerates into:

```text
POST /getUser
POST /createUser
POST /deleteUser
POST /updateUser
```

This can work technically, but it discards useful HTTP semantics.

A resource-oriented design might instead use:

```text
GET    /users/42
POST   /users
PATCH  /users/42
DELETE /users/42
```

The goal is not REST purity.

The goal is to create clear, predictable contracts.

---

# 58. Common API Anti-Pattern: GET Mutations

Dangerous:

```text
GET /api/deleteAccount?id=42
```

Problems include:

```text
prefetching
crawlers
browser behavior
cache semantics
unexpected execution
```

State-changing operations should use appropriate non-safe methods.

---

# 59. Common API Anti-Pattern: Status Code Everything as 200

Bad:

```json
HTTP 200

{
  "success": false,
  "error": "Unauthorized"
}
```

This forces clients to inspect application-level fields before understanding HTTP failure semantics.

Prefer meaningful HTTP status codes when appropriate:

```text
401
403
404
409
422
429
5xx
```

The body can then provide structured details.

---

# 60. Common API Anti-Pattern: Exposing Database Models

Bad:

```text
Database model
      ↓
JSON.stringify()
      ↓
Public API
```

This couples the public contract to persistence implementation.

Better:

```text
Database
   ↓
Domain model
   ↓
Response DTO
   ↓
Public API
```

---

# 61. Common API Anti-Pattern: Trusting Client Identity

Bad:

```text
POST /api/delete-account

{
  "userId": 42
}
```

and then:

```text
deleteUser(userId)
```

without establishing who made the request.

Correct architecture:

```text
Request
 ↓
Authenticate principal
 ↓
Authorize principal against user 42
 ↓
Perform operation
```

---

# 62. Common API Anti-Pattern: No Error Taxonomy

If every failure becomes:

```text
500
```

clients cannot distinguish:

```text
validation failure
authentication failure
authorization failure
resource missing
conflict
rate limit
dependency failure
unexpected server failure
```

A stable error taxonomy improves:

```text
client behavior
debugging
observability
support
API evolution
```

---

# 63. API Contract Versioning

Once clients depend on an API, changing it can become expensive.

Potential strategies include:

```text
backward-compatible evolution
versioned endpoints
content negotiation
versioned schemas
```

The best strategy depends on the product.

The important principle:

> API contracts should evolve deliberately rather than accidentally.

---

# 64. Contract Stability

Suppose clients expect:

```json
{
  "id": 42,
  "name": "Keyboard"
}
```

Changing:

```text
name
```

to:

```text
productName
```

may break clients.

Adding an optional field:

```json
{
  "id": 42,
  "name": "Keyboard",
  "category": "hardware"
}
```

is often easier to evolve safely.

API design therefore requires thinking about:

```text
today's implementation
+
tomorrow's clients
```

---

# 65. API and Frontend Architecture

In a Next.js application, the browser may communicate with:

```text
Browser
   ↓
Next.js API / BFF
   ↓
Domain services
   ↓
Database / external services
```

This differs from:

```text
Browser
   ↓
Direct external API
```

The BFF can provide:

```text
credential protection
response shaping
aggregation
authorization
server-only integrations
```

KPI 08 will progressively build this architecture.

---

# 66. Endpoint vs Server Action

This distinction is important because KPI 04 already covered Server Actions.

### Server Action

Primarily models:

```text
application mutation invoked through
framework-managed server execution
```

### HTTP API endpoint

Primarily models:

```text
explicit HTTP contract
```

Conceptually:

```text
Server Action
=
framework-oriented mutation interface
```

```text
Route Handler/API
=
HTTP-oriented server interface
```

There can be overlap, but they solve different architectural problems.

---

# 67. Endpoint Decision Framework

Before creating an API endpoint, ask:

```text
1. Who consumes this endpoint?

2. Is an explicit HTTP contract required?

3. Is this browser-only mutation better represented
   as a Server Action?

4. Is this consumed by mobile/native clients?

5. Is this consumed by third parties?

6. Does the endpoint aggregate multiple services?

7. Does it require server-only credentials?

8. What authentication mechanism is appropriate?

9. What is the resource being represented?

10. What happens when the request is retried?
```

These questions prevent unnecessary APIs.

---

# 68. Production Request Model

The complete Part 01 model is:

```text
                HTTP REQUEST
                     ↓
        ┌────────────────────────┐
        │ Method                 │
        │ URL                    │
        │ Headers                │
        │ Query Parameters       │
        │ Body                   │
        └───────────┬────────────┘
                    ↓
              Endpoint
                    ↓
             Parse / Validate
                    ↓
             Authenticate
                    ↓
              Authorize
                    ↓
             Domain Action
                    ↓
          State / Dependencies
                    ↓
            Response Mapping
                    ↓
        ┌────────────────────────┐
        │ Status                 │
        │ Headers                │
        │ Body                   │
        └───────────┬────────────┘
                    ↓
              HTTP RESPONSE
```

---

# 69. SDE-2 Prediction Challenge 1

You build:

```text
POST /api/orders
```

The server successfully creates an order.

The network connection fails before the client receives the response.

The client retries.

What can go wrong?

### Expected reasoning

The server may create two orders.

The issue is not primarily frontend state management.

It is an **API idempotency problem**.

Possible solutions include:

```text
idempotency keys
client-generated operation IDs
deduplication records
transactional guarantees
```

depending on the operation.

---

# 70. SDE-2 Prediction Challenge 2

You implement:

```text
GET /api/delete-user?id=42
```

What architectural problems can this create?

### Expected reasoning

GET is intended to be safe.

Infrastructure may:

```text
prefetch
cache
crawl
repeat
```

the request.

A mutation encoded as GET therefore creates dangerous semantics.

---

# 71. SDE-2 Prediction Challenge 3

An endpoint returns:

```text
200
```

for every failure.

The body contains:

```json
{
  "success": false
}
```

What problems arise?

### Expected reasoning

HTTP-aware clients and infrastructure cannot reliably distinguish:

```text
success
validation failure
authentication failure
rate limit
server failure
```

This weakens:

```text
retry logic
monitoring
caching
client behavior
observability
```

---

# 72. SDE-2 Prediction Challenge 4

An endpoint directly returns a database object.

Six months later, the database schema changes.

What risk exists?

### Expected reasoning

The public API contract is coupled to the persistence model.

Database changes can unintentionally become API breaking changes.

A response DTO/representation boundary reduces this coupling.

---

# 73. SDE-2 Prediction Challenge 5

A client sends:

```json
{
  "userId": 999
}
```

The authenticated session belongs to user 42.

The endpoint deletes user 999 because the body says so.

What failed?

### Expected reasoning

The endpoint confused:

```text
client-provided data
```

with:

```text
authenticated identity
```

Authentication establishes the principal.

Authorization determines whether that principal can operate on user 999.

---

# 74. SDE-2 Interview Questions

### Q1

What makes an HTTP method idempotent?

### Q2

Why should GET be safe?

### Q3

What's the difference between 401 and 403?

### Q4

When would you use 201 instead of 200?

### Q5

When is 409 appropriate?

### Q6

Why does API idempotency matter even if the frontend prevents double-clicks?

### Q7

Why shouldn't API responses directly expose database models?

### Q8

What's the difference between query parameters and path parameters?

### Q9

Why are status codes part of the API contract?

### Q10

When would a Server Action be preferable to an explicit API endpoint?

### Q11

Why can retries create duplicate mutations?

### Q12

What should happen when an upstream dependency times out?

---

# 75. Architecture Drill

Design an API for:

```text
E-commerce application
```

Resources:

```text
Products
Orders
Users
Payments
```

Start with:

```text
GET    /api/products
GET    /api/products/:id

POST   /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id

POST   /api/payments
GET    /api/users/me
```

For each endpoint define:

```text
HTTP method
resource
authentication
authorization
request schema
response schema
success status
failure statuses
idempotency requirement
cache behavior
retry behavior
```

Do not start by writing the Route Handler.

First define the HTTP contract.

---

# 76. Completion Checklist

You should now be able to explain:

```text
□ What an HTTP endpoint is
□ HTTP request anatomy
□ HTTP response anatomy
□ HTTP method semantics
□ GET
□ POST
□ PUT
□ PATCH
□ DELETE
□ Safe methods
□ Idempotency
□ Idempotency keys
□ HTTP status-code classes
□ 2xx semantics
□ 3xx semantics
□ 4xx semantics
□ 5xx semantics
□ Headers
□ Content-Type
□ Accept
□ Content negotiation
□ Request bodies
□ Query parameters
□ Path parameters
□ Resource-oriented API design
□ Collection vs individual resources
□ Authentication context
□ Authorization context
□ Response mapping
□ Serialization boundaries
□ Error contracts
□ Retry semantics
□ Timeout implications
□ Partial failure
□ API contract stability
□ API vs database boundaries
□ API endpoint vs Server Action
```

---

# 77. Core Mental Model

Remember:

```text
HTTP Endpoint
=
Method
+
Resource
+
Request Contract
+
Security Context
+
Operation
+
Response Contract
+
Failure Semantics
```

And:

```text
Request
   ↓
Parse
   ↓
Validate
   ↓
Authenticate
   ↓
Authorize
   ↓
Execute
   ↓
Map
   ↓
Respond
```

The most important SDE-2 principle is:

> **An API endpoint is a durable contract, not merely a function exposed through a URL.**

Its method, status codes, schemas, authentication rules, idempotency behavior, failure semantics, and response representation all form part of that contract.

---

# 78. Part Boundary

This part intentionally does **not** deeply implement Next.js Route Handlers.

That begins in:

**Part 02 — Next.js Route Handlers Fundamentals**

This part establishes the protocol and architectural mental model required to understand why a Route Handler exists and how it should behave.

The progression is therefore:

```text
Part 01
HTTP semantics
       ↓
Part 02
Next.js Route Handlers
       ↓
Part 03
Request parsing & responses
       ↓
Part 04
Authentication & authorization
       ↓
Part 05
Business/domain boundaries
```

**Part 01 complete.**
