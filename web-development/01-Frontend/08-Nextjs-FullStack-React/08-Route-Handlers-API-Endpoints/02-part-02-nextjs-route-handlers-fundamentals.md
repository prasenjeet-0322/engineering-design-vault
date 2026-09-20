# Level 08 — KPI 08 — Part 02: Next.js Route Handlers Fundamentals

## 1. Part Objective

Part 01 established the HTTP endpoint mental model.

This part maps that model onto **Next.js Route Handlers**.

The goal is to understand:

* what a Route Handler is
* where Route Handlers live
* how `route.ts` works
* how HTTP methods map to exported functions
* `Request` and `Response`
* `NextRequest` and `NextResponse`
* dynamic route parameters
* route-handler execution
* route conflicts
* API endpoint boundaries
* supported HTTP methods
* response construction
* cookies and headers at the endpoint boundary
* how Route Handlers differ from Server Actions
* how Route Handlers differ from Middleware

The governing question is:

> **How does Next.js turn an HTTP route into an explicit server-side endpoint while preserving HTTP semantics?**

---

# 2. What Is a Route Handler?

A Route Handler is Next.js's mechanism for defining custom request handlers inside the App Router.

Conceptually:

```text
HTTP Request
     ↓
Next.js Routing
     ↓
Route Handler
     ↓
Your server-side code
     ↓
HTTP Response
```

A Route Handler gives you an explicit HTTP endpoint.

For example:

```text
/api/products
```

can have server-side behavior for:

```text
GET
POST
```

while:

```text
/api/products/42
```

can have behavior for:

```text
GET
PATCH
DELETE
```

The key idea is:

> A Route Handler is an HTTP boundary implemented inside the Next.js application.

---

# 3. Route Handler Location

Route Handlers live inside the App Router using a:

```text
route.ts
```

or:

```text
route.js
```

file.

Example:

```text
app/
└── api/
    └── products/
        └── route.ts
```

This creates an endpoint conceptually corresponding to:

```text
/api/products
```

The filesystem therefore participates in endpoint routing.

---

# 4. Basic Route Handler

A minimal Route Handler can export an HTTP method function.

Example:

```ts
export async function GET() {
  return Response.json({
    message: "Products",
  });
}
```

The architecture is:

```text
GET /api/products
       ↓
GET()
       ↓
Response.json(...)
       ↓
HTTP response
```

The exported function name is meaningful.

It corresponds to the HTTP method.

---

# 5. HTTP Method Mapping

A Route Handler can export handlers for supported HTTP methods.

Conceptually:

```ts
export async function GET() {}

export async function POST() {}

export async function PUT() {}

export async function PATCH() {}

export async function DELETE() {}

export async function HEAD() {}

export async function OPTIONS() {}
```

This maps:

```text
HTTP
  ↓
Method
  ↓
Exported function
```

For example:

```text
GET /api/products
      ↓
GET()

POST /api/products
      ↓
POST()
```

The same URL can therefore expose different operations depending on the HTTP method.

---

# 6. Route Handler as HTTP Contract

Consider:

```text
app/
└── api/
    └── products/
        └── route.ts
```

The endpoint contract might be:

```text
GET /api/products
    → list products

POST /api/products
    → create product
```

This is not merely filesystem organization.

It represents two different HTTP operations at one resource endpoint.

---

# 7. Request Object

A Route Handler receives the incoming HTTP request.

Example:

```ts
export async function GET(request: Request) {
  // inspect request
}
```

The standard Web `Request` API provides access to things such as:

```text
method
headers
url
body
signal
```

The handler can therefore operate using standard Web Platform primitives.

This is important because the Route Handler is fundamentally an HTTP boundary rather than a framework-specific RPC function.

---

# 8. Request URL

The request URL can be inspected through:

```ts
request.url
```

Conceptually:

```text
GET https://example.com/api/products?page=2
```

gives the handler access to the complete URL.

You can then derive:

```text
protocol
host
pathname
query parameters
```

using URL APIs.

---

# 9. Query Parameters

Suppose the request is:

```text
GET /api/products?category=keyboard&page=2
```

The query parameters can be parsed from the request URL.

Conceptually:

```text
Request
   ↓
URL
   ↓
searchParams
   ↓
category = keyboard
page = 2
```

Example:

```ts
export async function GET(request: Request) {
  const url = new URL(request.url);

  const category = url.searchParams.get("category");
  const page = url.searchParams.get("page");

  return Response.json({
    category,
    page,
  });
}
```

The important principle is:

> Query parameters are input and must be validated like every other client-controlled value.

---

# 10. Headers

The request exposes HTTP headers.

Example:

```ts
export async function GET(request: Request) {
  const authorization =
    request.headers.get("authorization");

  // ...
}
```

Common headers include:

```text
Authorization
Accept
Content-Type
Cookie
User-Agent
```

The server should distinguish between:

```text
header exists
```

and:

```text
header contains trustworthy information
```

Client-controlled headers are not automatically trusted.

---

# 11. Request Body

Methods such as:

```text
POST
PUT
PATCH
```

often carry request bodies.

For JSON:

```ts
export async function POST(request: Request) {
  const body = await request.json();

  // validate body
}
```

Conceptually:

```text
HTTP Request
      ↓
request.json()
      ↓
JavaScript value
      ↓
Validation
      ↓
Application logic
```

Parsing is not validation.

That distinction is critical.

---

# 12. Parsing vs Validation

Suppose the client sends:

```json
{
  "quantity": "hello"
}
```

JSON parsing may succeed.

But the application may require:

```text
quantity = positive integer
```

Therefore:

```text
Parsing
    ↓
"What format is this?"
```

while:

```text
Validation
    ↓
"Is this acceptable according to the contract?"
```

The endpoint needs both.

---

# 13. FormData

Route Handlers can also process form-based request bodies.

Conceptually:

```ts
const formData = await request.formData();
```

This is useful for:

* HTML forms
* multipart form submissions
* file uploads

The endpoint should still validate:

```text
field presence
field types
field size
file type
file size
authorization
```

Parsing the multipart payload does not make the content trustworthy.

---

# 14. Response Construction

A Route Handler must return an HTTP response.

Example:

```ts
return Response.json({
  message: "Hello",
});
```

Conceptually:

```text
Application result
      ↓
Representation
      ↓
HTTP Response
```

The response can also explicitly define:

```text
status
headers
body
```

---

# 15. Status Codes

A Route Handler should communicate appropriate HTTP semantics.

Example:

```ts
return Response.json(
  { id: 123 },
  { status: 201 }
);
```

This represents:

```text
201 Created
```

rather than the generic:

```text
200 OK
```

The status code is part of the API contract.

---

# 16. Response Headers

Response headers can communicate metadata.

Conceptually:

```ts
return new Response(body, {
  status: 200,
  headers: {
    "Content-Type": "application/json",
  },
});
```

Headers can communicate:

```text
content type
cache behavior
location
cookies
retry information
security metadata
```

The exact header set depends on the endpoint.

---

# 17. JSON Response

For JSON APIs, the response can use:

```ts
Response.json(...)
```

Example:

```ts
export async function GET() {
  return Response.json({
    products: [
      { id: 1, name: "Keyboard" },
      { id: 2, name: "Mouse" },
    ],
  });
}
```

The important architectural boundary is:

```text
Domain data
      ↓
API representation
      ↓
JSON response
```

Do not automatically expose internal objects as public API contracts.

---

# 18. Dynamic Route Segments

Route Handlers can use dynamic segments.

Example:

```text
app/
└── api/
    └── products/
        └── [id]/
            └── route.ts
```

This corresponds conceptually to:

```text
/api/products/42
/api/products/99
/api/products/123
```

The dynamic segment represents a variable route parameter.

---

# 19. Route Parameters

A Route Handler can receive route parameters through its handler context.

Conceptually:

```ts
export async function GET(
  request: Request,
  context: ...
) {
  // access dynamic route params
}
```

The exact framework typing and parameter shape should follow the current Next.js API for the version being used.

The architectural idea is stable:

```text
/api/products/42
        ↓
id = 42
```

---

# 20. Path Parameters vs Query Parameters

Compare:

```text
/api/products/42
```

with:

```text
/api/products?id=42
```

The first naturally represents:

```text
specific resource identity
```

while the second represents:

```text
querying a collection with a parameter
```

Neither is universally mandatory, but they communicate different API semantics.

A resource-oriented API often uses:

```text
/products/:id
```

for a specific resource.

---

# 21. Catch-All Routes

Next.js routing also supports catch-all route structures.

Conceptually:

```text
app/api/files/[...path]/route.ts
```

can represent multiple nested paths.

For example:

```text
/api/files/a
/api/files/a/b
/api/files/a/b/c
```

The architectural question is whether such flexibility is actually required.

Do not use catch-all routes simply because they are convenient.

Explicit endpoint boundaries are generally easier to reason about.

---

# 22. Route Resolution

A request passes through Next.js routing before reaching the handler.

Conceptually:

```text
Incoming Request
      ↓
Next.js Router
      ↓
Route Matching
      ↓
route.ts
      ↓
HTTP Method
      ↓
GET()/POST()/...
```

This differs from middleware.

Middleware can influence request processing before application execution.

A Route Handler is the endpoint that actually implements the HTTP operation.

---

# 23. Middleware vs Route Handler

This distinction should now be precise.

### Middleware

```text
Request
   ↓
Should this request:
   redirect?
   rewrite?
   continue?
   be rejected?
```

### Route Handler

```text
Request
   ↓
What server-side operation
should this endpoint perform?
   ↓
Response
```

Conceptually:

```text
Middleware
=
request-control plane
```

```text
Route Handler
=
HTTP application endpoint
```

---

# 24. Route Handler vs Server Component

A Server Component primarily produces UI.

Conceptually:

```text
Server Component
    ↓
UI representation
```

A Route Handler produces an HTTP response.

```text
Route Handler
    ↓
HTTP representation
```

A Route Handler is therefore useful when another HTTP consumer needs an explicit server endpoint.

---

# 25. Route Handler vs Server Action

KPI 04 established Server Actions.

The distinction is:

```text
Server Action
=
framework-oriented server invocation
```

while:

```text
Route Handler
=
explicit HTTP endpoint
```

Use an explicit Route Handler when the HTTP boundary itself matters.

Examples:

```text
mobile application
third-party client
webhook
external integration
BFF endpoint
public/internal API
```

---

# 26. Route Handler vs Middleware vs Server Action

Keep this matrix in mind:

| Capability             | Middleware          | Route Handler        | Server Action       |
| ---------------------- | ------------------- | -------------------- | ------------------- |
| Request interception   | Yes                 | Endpoint itself      | No                  |
| Redirect/rewrite       | Yes                 | Can return responses | Can redirect        |
| Explicit HTTP API      | No                  | Yes                  | No                  |
| UI mutation            | Possible indirectly | Yes                  | Strong fit          |
| External clients       | No                  | Yes                  | Not primary purpose |
| Webhooks               | No                  | Yes                  | No                  |
| Authentication gate    | Yes                 | Yes                  | Yes                 |
| Resource authorization | Boundary            | Yes                  | Yes                 |
| Response contract      | Limited             | Core responsibility  | Framework-managed   |
| HTTP method semantics  | Routing context     | Core                 | Abstracted          |

The key is not memorizing the table.

The key is understanding the boundary each mechanism represents.

---

# 27. Method Not Supported

Suppose the endpoint implements:

```text
GET
POST
```

but receives:

```text
DELETE
```

The API should have deliberate behavior for unsupported methods.

The framework can provide appropriate handling depending on the Route Handler configuration.

The architectural principle is:

> An endpoint should have an explicit method contract.

Do not accidentally expose operations simply because the route exists.

---

# 28. Route Conflict: `page.tsx` and `route.ts`

A common App Router boundary is that a route segment cannot simultaneously behave as both a UI page and a Route Handler at the exact same segment.

Conceptually, do not assume:

```text
app/products/
├── page.tsx
└── route.ts
```

can represent two independent meanings at the same URL.

Instead separate concerns through appropriate route structure.

For example:

```text
app/
├── products/
│   └── page.tsx
└── api/
    └── products/
        └── route.ts
```

gives a clean separation:

```text
/products
/api/products
```

---

# 29. API Namespace

A common architecture is:

```text
app/
├── api/
│   ├── products/
│   ├── orders/
│   └── users/
├── dashboard/
├── settings/
└── login/
```

This makes the conceptual boundary explicit:

```text
UI routes
=
application navigation
```

```text
/api/*
=
HTTP API surface
```

The exact URL convention is an application decision.

---

# 30. Route Handler and Authentication

A Route Handler must not assume that middleware authentication means the endpoint is automatically secure.

The endpoint should establish the security context required for its operation.

Conceptually:

```text
Request
  ↓
Authenticate
  ↓
Principal
  ↓
Authorize
  ↓
Operation
```

This is particularly important because API consumers can call endpoints directly.

They do not have to navigate through your UI.

---

# 31. Cookie Access

Route Handlers may need access to request cookies.

Conceptually:

```text
Request
   ↓
Cookie
   ↓
Session identifier
   ↓
Authentication
```

Cookies can be used for:

```text
session
preferences
CSRF-related state
routing context
```

But a cookie value is still input.

Do not confuse:

```text
cookie exists
```

with:

```text
request is authorized
```

The server must validate the associated session/authentication state.

---

# 32. Setting Cookies

A Route Handler can also produce responses that set cookies.

Conceptually:

```text
Response
   ↓
Set-Cookie
   ↓
Browser stores cookie
```

Cookie security attributes are important.

Depending on the use case, considerations include:

```text
HttpOnly
Secure
SameSite
Path
Domain
Expiration
```

Cookie architecture should be treated as a security boundary, not merely browser storage.

---

# 33. Headers and Authentication

An API might use:

```text
Authorization: Bearer <token>
```

Conceptually:

```text
Request
   ↓
Authorization header
   ↓
Credential verification
   ↓
Principal
```

The endpoint must:

```text
parse
→ validate
→ verify
→ establish identity
```

A syntactically valid header is not equivalent to a valid credential.

---

# 34. Request Validation

A production Route Handler should generally follow:

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
Respond
```

Not:

```text
Request
   ↓
Database mutation
```

Validation belongs at the boundary because the endpoint is receiving untrusted external input.

---

# 35. Response Contract

Suppose:

```text
GET /api/products/42
```

returns:

```json
{
  "id": 42,
  "name": "Keyboard",
  "price": 99
}
```

That shape becomes part of the endpoint contract.

The handler should deliberately decide:

```text
which fields
which names
which types
which status
which errors
```

rather than exposing arbitrary internal state.

---

# 36. Route Handler and Domain Logic

A Route Handler should generally coordinate the request.

Conceptually:

```text
Route Handler
      ↓
Application / Domain Service
      ↓
Repository
      ↓
Database
```

For example:

```ts
export async function POST(request: Request) {
  const input = await request.json();

  const validated = validateCreateOrder(input);

  const order = await createOrder(validated);

  return Response.json(order, {
    status: 201,
  });
}
```

The handler coordinates.

The domain service should own substantial business rules.

Part 05 will explore this boundary deeply.

---

# 37. Avoid Fat Route Handlers

Bad architecture:

```text
route.ts
 ├── parse
 ├── validate
 ├── authenticate
 ├── 700 lines business rules
 ├── database queries
 ├── payment integration
 ├── email sending
 ├── cache logic
 └── response
```

This creates:

```text
high coupling
poor testability
duplicated logic
difficult maintenance
```

A better architecture separates responsibilities.

---

# 38. Thin Endpoint Pattern

Conceptually:

```text
Route Handler
     ↓
Input Validation
     ↓
Application Service
     ↓
Domain Logic
     ↓
Persistence / External Services
     ↓
Response Mapping
```

The Route Handler remains an adapter between:

```text
HTTP
```

and:

```text
application architecture
```

---

# 39. Response Mapping

Suppose your domain returns:

```ts
{
  id: 42,
  internalStatus: "ACTIVE_INTERNAL",
  secretMetadata: "...",
}
```

The API may expose:

```json
{
  "id": 42,
  "status": "active"
}
```

The Route Handler or presentation layer should deliberately map the domain result.

This prevents internal implementation details from leaking into the public contract.

---

# 40. Error Handling

Route Handlers must distinguish expected failures from unexpected failures.

Example categories:

```text
Validation failure
Authentication failure
Authorization failure
Not found
Conflict
Rate limit
Dependency failure
Unexpected application failure
```

Each should map to appropriate HTTP semantics.

Conceptually:

```text
Domain failure
      ↓
Error classification
      ↓
HTTP response
```

---

# 41. Do Not Leak Stack Traces

Never intentionally return:

```text
database connection failed
SQL statement...
internal file path...
stack trace...
```

to an external client.

Instead:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred."
  }
}
```

Detailed diagnostics belong in server-side observability.

---

# 42. Route Handler and Caching

Route Handlers participate in the caching architecture established in KPI 06.

The important question is not:

```text
"Is this API cached?"
```

Instead ask:

```text
What representation is being cached?
What determines its identity?
How long is it valid?
What invalidates it?
Is it personalized?
```

For example:

```text
GET /api/products
```

may be cacheable.

But:

```text
GET /api/me
```

may depend on the authenticated principal.

Therefore caching must respect representation context.

---

# 43. Dynamic Request Context

An endpoint may depend on:

```text
cookies
headers
authentication
tenant
locale
request URL
```

These dependencies can influence:

```text
response
cacheability
cache identity
rendering
authorization
```

This connects KPI 08 directly with:

```text
KPI 06 — caching
KPI 07 — middleware
```

---

# 44. Route Handler and Middleware Context

The full request path can look like:

```text
Request
  ↓
Middleware
  ↓
Tenant / Locale / Auth Context
  ↓
Route Handler
  ↓
Application Service
  ↓
Response
```

But the Route Handler must not blindly trust arbitrary middleware-derived values.

The security architecture should make trust explicit.

---

# 45. API Route and BFF

A Route Handler can act as a Backend-for-Frontend endpoint.

Example:

```text
Browser
   ↓
GET /api/dashboard
   ↓
Next.js Route Handler
   ↓
 ┌───────────────┐
 │ Orders API    │
 │ Profile API   │
 │ Notification  │
 └───────────────┘
   ↓
Aggregated response
   ↓
Browser
```

This is useful when the frontend needs a representation tailored to its UI rather than the raw representation of individual backend services.

Part 08 will cover BFF architecture deeply.

---

# 46. Route Handler and External Clients

A Route Handler can be consumed by:

```text
browser
mobile application
server-side application
third-party integration
webhook provider
internal service
```

This is one of the major reasons an explicit HTTP contract matters.

The API should therefore avoid assumptions such as:

```text
"Only our React components will call this."
```

unless the endpoint is genuinely internal to that architecture.

---

# 47. Webhooks

Route Handlers are also appropriate for receiving webhook requests.

Conceptually:

```text
External Provider
       ↓
POST /api/webhooks/payment
       ↓
Route Handler
       ↓
Verify signature
       ↓
Validate event
       ↓
Process event
       ↓
Respond
```

Important concerns include:

```text
signature verification
replay protection
idempotency
payload validation
fast acknowledgement
retry behavior
```

These become production concerns in later KPI parts.

---

# 48. Method Semantics Still Matter

A Route Handler does not remove HTTP semantics.

For example:

```text
GET /api/orders/123
should not unexpectedly delete or mutate state.
```

Likewise:

```text
DELETE /api/orders/123
```

should communicate deletion semantics.

The framework provides the mechanism.

You remain responsible for the HTTP contract.

---

# 49. Explicit Endpoint Design

Before creating:

```text
app/api/orders/route.ts
```

write the contract first.

Example:

```text
GET /api/orders
```

Questions:

```text
Who can call it?
What does it return?
What query parameters exist?
What is the pagination model?
What happens when authentication is missing?
What happens when authorization fails?
Is it cacheable?
```

For:

```text
POST /api/orders
```

ask:

```text
What is the request schema?
What validation exists?
Is it idempotent?
What happens on retry?
What transaction occurs?
What status is returned?
```

---

# 50. Endpoint Lifecycle

The production mental model is now:

```text
                   REQUEST
                      ↓
              Route Resolution
                      ↓
                Route Handler
                      ↓
              Parse Input
                      ↓
             Validate Input
                      ↓
             Authenticate
                      ↓
              Authorize
                      ↓
          Application / Domain
                      ↓
           Persistence / APIs
                      ↓
             Response Mapping
                      ↓
                 HTTP Response
```

This is the central model for KPI 08.

---

# 51. Example — GET Endpoint

Architecture:

```text
GET /api/products/42
```

Flow:

```text
Request
 ↓
Route matching
 ↓
Extract id = 42
 ↓
Validate id
 ↓
Authenticate if required
 ↓
Authorize access
 ↓
Load product
 ↓
Map representation
 ↓
200 JSON
```

The handler should remain focused on coordinating these boundaries.

---

# 52. Example — POST Endpoint

Architecture:

```text
POST /api/products
```

Body:

```json
{
  "name": "Keyboard",
  "price": 99
}
```

Flow:

```text
Request
 ↓
Parse JSON
 ↓
Validate schema
 ↓
Authenticate
 ↓
Authorize create operation
 ↓
Domain operation
 ↓
Database transaction
 ↓
Cache invalidation if required
 ↓
Response DTO
 ↓
201 Created
```

Notice the complete full-stack lifecycle.

---

# 53. Example — Protected Endpoint

Request:

```text
GET /api/account
```

Flow:

```text
Request
 ↓
Resolve authentication
 ↓
No valid session?
      ↓
     401
```

If authenticated:

```text
Authenticated
 ↓
Authorize
 ↓
Load account
 ↓
Return representation
```

If authenticated but not permitted:

```text
403
```

The endpoint should preserve the distinction between:

```text
authentication
```

and:

```text
authorization
```

---

# 54. Example — Resource Not Found

Request:

```text
GET /api/products/999999
```

Suppose the resource does not exist.

Possible flow:

```text
Request
 ↓
Parse id
 ↓
Authorize
 ↓
Repository lookup
 ↓
Not found
 ↓
404
```

Do not convert an ordinary missing resource into an unexpected:

```text
500
```

---

# 55. Example — Conflict

Request:

```text
POST /api/users
```

Body:

```json
{
  "email": "existing@example.com"
}
```

Suppose the email must be unique.

Possible result:

```text
409 Conflict
```

The key concept is:

```text
valid request
+
current state conflict
=
conflict semantics
```

---

# 56. Example — Unsupported Method

Suppose:

```text
/api/products
```

supports:

```text
GET
POST
```

A client sends:

```text
DELETE /api/products
```

The endpoint contract should clearly communicate that the operation is not supported rather than accidentally executing unrelated behavior.

HTTP method semantics remain part of the API contract.

---

# 57. Route Handler Security Checklist

Before shipping an endpoint:

```text
□ Validate all external input
□ Authenticate when required
□ Authorize the operation
□ Validate resource ownership
□ Validate tenant membership
□ Avoid trusting client-provided identity
□ Avoid exposing internal errors
□ Limit payload sizes where appropriate
□ Validate uploaded content
□ Protect sensitive operations against replay/duplication
□ Define rate-limit requirements
```

Security should be designed into the endpoint rather than added after implementation.

---

# 58. Route Handler Performance Checklist

Ask:

```text
□ How many database queries occur?
□ Are they sequential unnecessarily?
□ Are external API calls required?
□ What is the timeout behavior?
□ Is the response payload unnecessarily large?
□ Is caching possible?
□ Is serialization expensive?
□ Are repeated requests deduplicated where appropriate?
□ Does middleware add additional latency?
```

An endpoint is part of the critical request path.

---

# 59. Route Handler Observability

A production endpoint should be observable.

Useful information includes:

```text
request ID
trace ID
route
HTTP method
status code
latency
tenant
principal
dependency latency
error code
cache outcome
```

Do not log secrets such as:

```text
passwords
access tokens
session secrets
raw credentials
```

The goal is:

> Make endpoint behavior explainable without exposing sensitive data.

---

# 60. Common Anti-Pattern: Route Handler as Entire Application

Bad:

```text
route.ts
    ↓
parse
    ↓
validate
    ↓
business rules
    ↓
database
    ↓
payment
    ↓
email
    ↓
cache
    ↓
analytics
    ↓
response
```

This makes the endpoint difficult to:

```text
test
reuse
evolve
reason about
```

A better architecture separates:

```text
HTTP adapter
Application service
Domain logic
Infrastructure
```

---

# 61. Common Anti-Pattern: No Explicit Contract

Bad development process:

```text
write route
→ see what response happens
→ frontend adapts
→ add random fields
→ change status codes
→ clients break
```

Better:

```text
define contract
→ define security
→ define failure semantics
→ implement
→ test contract
```

The endpoint contract should be intentional.

---

# 62. Common Anti-Pattern: Trusting Middleware Alone

Bad assumption:

```text
middleware protected /admin
therefore /api/admin/delete is secure
```

Incorrect.

An API endpoint can be called directly.

The endpoint must enforce the authorization required for its operation.

---

# 63. Common Anti-Pattern: Client-Defined User Identity

Bad:

```json
{
  "userId": 42
}
```

followed by:

```text
perform operation as user 42
```

without authentication context.

Correct:

```text
authenticated principal
        ↓
authorization
        ↓
target resource
```

The client can request an operation.

It does not get to define its own security identity.

---

# 64. Common Anti-Pattern: Catch Everything as 500

Bad:

```text
try {
   ...
} catch {
   return 500;
}
```

for every expected failure.

This destroys semantic distinctions.

Instead classify:

```text
validation → 4xx
authentication → 401
authorization → 403
missing resource → 404
conflict → 409
rate limit → 429
upstream failure → appropriate 5xx
unexpected failure → 500
```

---

# 65. Common Anti-Pattern: Return Huge Internal Objects

Bad:

```text
return databaseRecord
```

Better:

```text
databaseRecord
   ↓
response DTO
   ↓
HTTP JSON
```

The public API should expose only what the contract requires.

---

# 66. SDE-2 Prediction Challenge 1

You have:

```text
app/api/products/[id]/route.ts
```

A request arrives:

```text
GET /api/products/42
```

What conceptual steps happen before the final response?

### Expected reasoning

```text
route matching
→ extract parameter
→ validate parameter
→ authenticate if required
→ authorize resource
→ execute application logic
→ map result
→ return HTTP response
```

The Route Handler is an adapter around this lifecycle.

---

# 67. SDE-2 Prediction Challenge 2

A Route Handler parses JSON successfully.

The payload is:

```json
{
  "quantity": -100
}
```

What should happen?

### Expected reasoning

Parsing succeeded.

Validation failed.

Therefore the endpoint should not proceed to the domain mutation.

The endpoint should return an appropriate validation error according to the API contract.

---

# 68. SDE-2 Prediction Challenge 3

Middleware protects:

```text
/admin
```

A malicious client directly calls:

```text
POST /api/admin/delete-user
```

What should protect the operation?

### Expected reasoning

The API endpoint itself must authenticate and authorize the operation.

UI navigation protection is not sufficient resource security.

---

# 69. SDE-2 Prediction Challenge 4

A Route Handler returns a database object containing:

```text
internalRole
internalFlags
databaseVersion
privateMetadata
```

What architectural problem exists?

### Expected reasoning

The public API contract is coupled to internal persistence state and may leak implementation details.

Introduce an explicit response representation/DTO boundary.

---

# 70. SDE-2 Prediction Challenge 5

A Route Handler calls:

```text
Payment API
```

The payment API takes 20 seconds.

What architectural concern appears?

### Expected reasoning

The Route Handler is synchronously blocked by an upstream dependency.

Questions now include:

```text
timeout
retry
failure mapping
client experience
resource consumption
idempotency
asynchronous processing
```

These become deeper topics later in KPI 08.

---

# 71. SDE-2 Interview Questions

### Q1

What is a Next.js Route Handler?

### Q2

How does `route.ts` map to an HTTP endpoint?

### Q3

How do HTTP methods map to exported functions?

### Q4

What is the difference between `Request` and framework-specific request helpers?

### Q5

How do you access query parameters?

### Q6

How do you access dynamic route parameters?

### Q7

What's the difference between parsing and validation?

### Q8

Why shouldn't a Route Handler contain all business logic?

### Q9

How is a Route Handler different from Middleware?

### Q10

How is a Route Handler different from a Server Action?

### Q11

Why must API endpoints enforce authorization independently?

### Q12

Why are response DTOs useful?

### Q13

What happens when an endpoint receives an unsupported method?

### Q14

How does caching affect Route Handler design?

### Q15

How would you design a Route Handler that calls three upstream APIs?

---

# 72. Production Route Handler Template

A useful conceptual template is:

```text
HTTP Request
      ↓
Route Matching
      ↓
Request Parsing
      ↓
Input Validation
      ↓
Authentication
      ↓
Authorization
      ↓
Application Service
      ↓
Domain Operation
      ↓
Infrastructure
      ↓
Result Mapping
      ↓
HTTP Response
```

Keep this model independent of any particular implementation library.

---

# 73. Route Handler Design Rules

Use these rules when designing endpoints:

### Rule 1

> The HTTP method should communicate the operation.

### Rule 2

> Validate every external input.

### Rule 3

> Authentication establishes identity.

### Rule 4

> Authorization establishes permission.

### Rule 5

> The endpoint should not trust client-provided identity.

### Rule 6

> Keep HTTP concerns separate from domain logic.

### Rule 7

> Return meaningful HTTP status codes.

### Rule 8

> Keep the response contract explicit.

### Rule 9

> Do not leak internal implementation details.

### Rule 10

> Design retry and failure behavior deliberately.

---

# 74. Completion Checklist

You should now be able to explain:

```text
□ What a Route Handler is
□ Where route.ts lives
□ How App Router maps files to endpoints
□ HTTP method exports
□ GET
□ POST
□ PUT
□ PATCH
□ DELETE
□ Request
□ Response
□ Request URL
□ Query parameters
□ Headers
□ Request body
□ JSON parsing
□ FormData
□ Response construction
□ Status codes
□ Response headers
□ Dynamic route segments
□ Route parameters
□ Catch-all routes
□ Route resolution
□ Middleware vs Route Handler
□ Server Component vs Route Handler
□ Server Action vs Route Handler
□ Authentication at the endpoint
□ Authorization at the endpoint
□ Cookies
□ API contracts
□ Response mapping
□ Error handling
□ Route Handler caching
□ BFF role
□ Webhook role
□ Endpoint security
□ Endpoint performance
□ Endpoint observability
□ Thin Route Handler architecture
```

---

# 75. Core Mental Model

Remember:

```text
route.ts
   ↓
HTTP endpoint
   ↓
method
   ↓
request
   ↓
parse
   ↓
validate
   ↓
authenticate
   ↓
authorize
   ↓
application logic
   ↓
response
```

And remember the three-way distinction:

```text
Middleware
=
control the request
```

```text
Route Handler
=
implement the HTTP operation
```

```text
Server Action
=
framework-managed server invocation
```

These are related mechanisms, but they should not be collapsed into one conceptual abstraction.

---

# 76. Part Boundary

This part establishes the fundamental Next.js Route Handler mechanism.

It intentionally does not deeply cover:

* advanced request parsing
* multipart/file-upload architecture
* comprehensive validation schemas
* API error taxonomy
* authentication architecture
* authorization models
* cache strategy
* idempotency
* BFF orchestration
* resilience
* API performance architecture

Those belong to later KPI 08 parts.

The canonical progression remains:

```text
Part 01
HTTP & Server Endpoint Mental Model
        ↓
Part 02
Next.js Route Handlers Fundamentals
        ↓
Part 03
Request Parsing & Response Architecture
        ↓
Part 04
API Authentication & Authorization
        ↓
Part 05
API Data Access & Business Logic Boundaries
```

**Part 02 complete.**
