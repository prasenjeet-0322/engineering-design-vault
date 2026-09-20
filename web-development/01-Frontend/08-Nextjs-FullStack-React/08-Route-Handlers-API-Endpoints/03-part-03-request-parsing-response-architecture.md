# Level 08 — KPI 08 — Part 03: Request Parsing & Response Architecture

## 1. Part Objective

The objective of this part is to develop a precise mental model for how a Next.js Route Handler receives, interprets, validates, transforms, and responds to HTTP requests.

The key question is:

> **How does an HTTP request become a trusted application input, and how does application output become a stable HTTP response?**

A production API boundary should not treat request parsing as a trivial `await request.json()` operation.

The complete boundary is:

```text
HTTP Request
    ↓
Transport Parsing
    ↓
Input Normalization
    ↓
Schema Validation
    ↓
Trusted Input
    ↓
Application Service
    ↓
Domain Result
    ↓
Response Mapping
    ↓
HTTP Response
```

The central architectural distinction is:

```text
Parsing ≠ Validation ≠ Authorization ≠ Business Logic
```

Each is a separate responsibility.

---

# 2. The Route Handler as a Boundary

A Route Handler sits between an external protocol and the internal application.

```text
External HTTP World
        ↓
┌─────────────────────────┐
│      Route Handler      │
│                         │
│ parse                   │
│ normalize               │
│ validate                │
│ authenticate            │
│ authorize               │
│ call application        │
│ map response            │
└─────────────────────────┘
        ↓
Internal Application
```

The Route Handler understands HTTP.

The application service should generally understand application concepts rather than HTTP mechanics.

For example:

```text
HTTP:
POST /api/orders

↓

Route Handler:

{
    customerId,
    items,
    shippingAddress
}

↓

Application:

createOrder(command)

↓

Domain:

Order

↓

Route Handler:

201 Created

{
    id,
    status,
    createdAt
}
```

This separation prevents transport concerns from leaking throughout the application.

---

# 3. Request Anatomy

A request contains several independent input channels.

```text
Request
├── Method
├── URL
│   ├── pathname
│   └── search parameters
├── Headers
├── Cookies
├── Route parameters
└── Body
```

Each channel has different semantics.

### Example

```http
POST /api/users/42?notify=true
Authorization: Bearer ...
Content-Type: application/json
```

with:

```json
{
  "name": "John",
  "email": "john@example.com"
}
```

There are multiple distinct inputs:

```text
Route parameter:
42

Query parameter:
notify=true

Header:
Authorization

Body:
name
email
```

A common design mistake is treating all request input as one undifferentiated object.

Instead, identify where each value comes from.

---

# 4. Path Parameters

Dynamic route segments represent resource identity.

Example:

```text
app/api/users/[id]/route.ts
```

Request:

```text
GET /api/users/42
```

Conceptually:

```text
params.id = "42"
```

The important point is that route parameters are typically strings at the transport boundary.

Therefore:

```ts
const id = params.id;
```

does not mean:

```ts
id: number
```

automatically.

If the application requires a numeric ID:

```text
"42"
 ↓
parse
 ↓
42
 ↓
validate
 ↓
trusted numeric identifier
```

Parsing converts representation.

Validation establishes whether the converted value is acceptable.

---

# 5. Query Parameters

Query parameters represent request modifiers, filters, pagination, search criteria, sorting, or optional behavior.

Example:

```text
GET /api/products?page=2&limit=20&sort=price
```

Conceptually:

```ts
const url = new URL(request.url);

const page = url.searchParams.get("page");
const limit = url.searchParams.get("limit");
const sort = url.searchParams.get("sort");
```

The transport representation remains textual:

```text
"2"
"20"
"price"
```

The application may require:

```ts
page: number
limit: number
sort: "price" | "name"
```

Therefore the boundary performs:

```text
query string
    ↓
raw values
    ↓
normalization
    ↓
validation
    ↓
typed application input
```

---

# 6. Missing vs Empty vs Invalid

These are different states.

Consider:

```text
/api/products?page=
```

versus:

```text
/api/products
```

versus:

```text
/api/products?page=abc
```

They represent:

```text
missing
empty
invalid
```

Do not automatically collapse them.

For example:

```text
page missing
→ use default

page empty
→ potentially malformed input

page abc
→ invalid input
```

A production API should explicitly define these semantics.

---

# 7. Query Parameter Multiplicity

Query parameters can appear multiple times.

Example:

```text
/api/products?tag=react&tag=nextjs
```

A consumer may expect:

```ts
["react", "nextjs"]
```

rather than:

```ts
"react"
```

Therefore API design must define whether a parameter is:

```text
scalar
array
optional scalar
optional array
```

This matters for:

```text
filters
tags
IDs
sorting
facets
permissions
batch operations
```

Do not let framework parsing behavior accidentally become your API contract.

---

# 8. Request Headers

Headers carry protocol and contextual metadata.

Examples:

```text
Content-Type
Accept
Authorization
If-Match
If-None-Match
Idempotency-Key
X-Request-ID
```

Headers should be treated differently from application body fields.

For example:

```text
Authorization
```

belongs to the transport/security layer.

Whereas:

```json
{
  "email": "user@example.com"
}
```

belongs to application input.

Do not unnecessarily duplicate transport metadata into request bodies.

---

# 9. Content-Type

The request body cannot be interpreted correctly without knowing its representation.

Common types include:

```text
application/json
multipart/form-data
application/x-www-form-urlencoded
text/plain
```

For JSON:

```ts
const body = await request.json();
```

For form data:

```ts
const formData = await request.formData();
```

These are not interchangeable.

The boundary should understand the expected representation.

---

# 10. Parsing Is Not Validation

This is one of the most important concepts in API architecture.

Consider:

```ts
const body = await request.json();
```

Successful parsing only means:

> The request body was syntactically interpretable as JSON.

It does **not** mean:

```text
required fields exist
types are correct
values are allowed
relationships are valid
business rules are satisfied
user is authorized
```

For example:

```json
{
  "age": "hello"
}
```

may be valid JSON.

But it may be invalid application input.

Therefore:

```text
JSON parsing
    ≠
schema validation
```

---

# 11. Schema Validation

Validation establishes an explicit input contract.

Example conceptual schema:

```ts
type CreateUserInput = {
  name: string;
  email: string;
  age: number;
};
```

The runtime request must still be checked.

The TypeScript type:

```ts
type CreateUserInput = ...
```

does not validate runtime HTTP input.

The boundary therefore needs:

```text
Unknown Runtime Data
        ↓
Validation
        ↓
Trusted Shape
```

This is a fundamental TypeScript + HTTP distinction:

```text
TypeScript protects development-time assumptions.

Runtime validation protects the application boundary.
```

---

# 12. Unknown Input Must Stay Unknown

A dangerous pattern is:

```ts
const body = (await request.json()) as CreateUserInput;
```

This does not validate anything.

It simply tells TypeScript:

> Trust me.

The runtime value remains uncontrolled.

The correct mental model is:

```text
request.json()
     ↓
unknown external data
     ↓
validate
     ↓
trusted application input
```

Never confuse type assertion with runtime validation.

---

# 13. Normalization

Validation and normalization often work together but are conceptually different.

Example:

```text
"  john@example.com  "
```

may be normalized to:

```text
"john@example.com"
```

Other examples:

```text
"TRUE"
→ true

"42"
→ 42

"ADMIN"
→ "admin"
```

The boundary can establish canonical representation.

The flow becomes:

```text
Raw Input
   ↓
Normalize
   ↓
Validate
   ↓
Trusted Input
```

However, normalization must be intentional.

Do not silently transform values when the API contract requires the original representation.

---

# 14. Validation Layers

A production request can require multiple validation layers.

```text
Transport validation
        ↓
Schema validation
        ↓
Authorization validation
        ↓
Domain validation
        ↓
Persistence constraints
```

Each answers a different question.

### Transport validation

Can this request be interpreted?

### Schema validation

Does the input have the expected structure and types?

### Authorization validation

Is this requester allowed to perform this operation?

### Domain validation

Is this operation meaningful according to business rules?

### Persistence validation

Can the resulting state be represented safely by the database?

Do not collapse all of these into one giant validation function.

---

# 15. Body Parsing and Body Consumption

Request bodies are streams conceptually.

Therefore request body handling should be deliberate.

A common mental model is:

```text
Request
   ↓
Body stream
   ↓
consume
   ↓
parsed representation
```

Once consumed, the body should not be treated as an infinitely reusable value.

Architecturally:

```text
parse once
→ validate once
→ pass trusted representation inward
```

Avoid repeatedly parsing or reinterpreting the same body across layers.

---

# 16. Request Size

Request parsing also has resource implications.

Large inputs can consume:

```text
memory
CPU
network bandwidth
processing time
```

Potentially dangerous payloads include:

```text
large JSON documents
large arrays
multipart uploads
deeply nested objects
unexpectedly large strings
```

Therefore production APIs should define limits.

Conceptually:

```text
Request
 ↓
size constraints
 ↓
parse
 ↓
validate
```

Do not wait until expensive business logic to discover that the payload is unreasonable.

---

# 17. Response Architecture

The response side mirrors request processing.

```text
Domain Result
    ↓
Response Mapping
    ↓
HTTP Status
    ↓
Headers
    ↓
Body
    ↓
HTTP Response
```

The Route Handler should translate internal outcomes into explicit HTTP semantics.

For example:

```text
created resource
→ 201 Created

successful retrieval
→ 200 OK

invalid input
→ 400 Bad Request

unauthenticated
→ 401 Unauthorized

authenticated but forbidden
→ 403 Forbidden

resource missing
→ 404 Not Found

conflict
→ 409 Conflict

unexpected server failure
→ 500 Internal Server Error
```

The exact contract should be deliberate rather than accidental.

---

# 18. Response DTOs

Do not automatically return internal domain objects.

Suppose an internal entity contains:

```ts
{
  id,
  email,
  passwordHash,
  internalFlags,
  billingAccountId,
  createdAt
}
```

Returning the object directly can expose fields that should remain internal.

Instead:

```text
Domain Entity
      ↓
Response Mapper
      ↓
Public DTO
```

Example:

```json
{
  "id": "u_123",
  "email": "user@example.com",
  "createdAt": "2026-09-17T10:00:00Z"
}
```

This creates an explicit API boundary.

---

# 19. Internal Model vs API Contract

These should not automatically be identical.

```text
Database schema
      ↓
Domain model
      ↓
Application result
      ↓
API DTO
```

Each layer has different evolution requirements.

A database column may be renamed without wanting to break API consumers.

A domain concept may contain internal implementation details that should never leave the server.

Therefore:

```text
Persistence model ≠ API model
```

and:

```text
Domain model ≠ API contract
```

---

# 20. Stable Response Contracts

An API is a contract with consumers.

Suppose version 1 returns:

```json
{
  "id": "123",
  "name": "Alice"
}
```

A future implementation may internally change:

```text
database
service
domain object
query strategy
```

without necessarily changing the external response.

This is one reason response mapping exists.

The API boundary provides:

```text
implementation freedom
+
contract stability
```

---

# 21. Error Response Architecture

Errors should have a predictable structure.

Instead of returning arbitrary messages:

```json
{
  "error": "Something went wrong"
}
```

or:

```json
{
  "message": "invalid"
}
```

define a consistent error contract.

Conceptually:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request contains invalid fields.",
    "details": {
      "email": "Invalid email address"
    }
  }
}
```

The exact structure is an API design decision.

The important principle is consistency.

---

# 22. Machine-Readable Error Codes

Consumers should not have to parse human-readable messages.

Bad:

```text
if (response.message === "Email already exists")
```

Better:

```text
error.code === "EMAIL_ALREADY_EXISTS"
```

Human-readable text can change.

Machine-readable identifiers should be stable.

Therefore:

```text
Human message
→ for humans

Error code
→ for programs
```

---

# 23. Validation Error Granularity

Validation errors may occur at:

```text
request level
field level
nested object level
array item level
```

Example:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "fields": {
      "email": "Invalid email",
      "age": "Must be at least 18"
    }
  }
}
```

This is especially useful for frontend form integration.

The API can therefore provide structured information that UI code can map to fields.

---

# 24. HTTP Status vs Error Code

Do not use either one as a replacement for the other.

For example:

```text
HTTP status:
409 Conflict

Application error code:
EMAIL_ALREADY_EXISTS
```

The HTTP status communicates protocol-level semantics.

The application code communicates domain/application semantics.

Together:

```text
HTTP semantics
+
application semantics
produce a richer contract.
```

---

# 25. Response Headers

Response architecture also includes headers.

Examples:

```text
Content-Type
Cache-Control
ETag
Location
Retry-After
Set-Cookie
```

Different outcomes may require different headers.

For example:

```text
201 Created
+
Location: /api/users/123
```

or:

```text
429 Too Many Requests
+
Retry-After: ...
```

Headers are part of the API contract, not merely implementation details.

---

# 26. Created Resource Responses

For creation:

```http
POST /api/users
```

a common semantic response is:

```http
201 Created
```

with the resulting resource or representation.

Conceptually:

```text
POST
 ↓
create
 ↓
resource identity established
 ↓
201
 ↓
representation
```

The important point is that the response communicates the operation's semantics rather than simply returning:

```text
200
```

for every successful operation.

---

# 27. Empty Responses

Not every successful operation needs a JSON body.

For example:

```text
DELETE /api/users/123
```

may return:

```http
204 No Content
```

The contract should define whether consumers should expect:

```text
JSON
empty body
redirect
stream
file
```

Do not make clients infer behavior from accidental implementation details.

---

# 28. Content Negotiation

HTTP can communicate representation preferences.

For example:

```text
Accept: application/json
```

The server can use this information when multiple representations are supported.

Similarly:

```text
Content-Type
```

describes what the request body contains.

The distinction is:

```text
Content-Type
→ representation being sent

Accept
→ representation the consumer prefers
```

This distinction is useful when designing more general HTTP APIs.

---

# 29. Response Serialization

Serialization converts application data into a transport representation.

```text
Domain Result
    ↓
DTO
    ↓
Serialization
    ↓
JSON
    ↓
HTTP Response
```

Potential serialization issues include:

```text
Date
BigInt
undefined
custom classes
circular references
binary data
```

The Route Handler should therefore have an explicit representation strategy.

---

# 30. Never Leak Internal Errors

Suppose the database throws:

```text
UniqueConstraintViolation
```

The client does not necessarily need the database's raw message.

Instead:

```text
Database Error
      ↓
Application Error
      ↓
HTTP Error Contract
```

Example:

```json
{
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "An account with this email already exists."
  }
}
```

This protects:

```text
internal schema
database details
stack traces
implementation information
security-sensitive information
```

---

# 31. Error Classification

A useful architecture distinguishes:

```text
Expected application errors
        ↓
Known HTTP mapping

Unexpected infrastructure/programming errors
        ↓
Generic server response
        +
server-side logging
```

Example:

```text
ResourceNotFound
→ 404

ValidationError
→ 400

Unauthorized
→ 401

Forbidden
→ 403

Conflict
→ 409

Unexpected exception
→ 500
```

This keeps the response contract predictable.

---

# 32. Route Handler Boundary Pattern

A strong structure is:

```text
route.ts
   ↓
parseRequest()
   ↓
validateInput()
   ↓
authenticate()
   ↓
authorize()
   ↓
applicationService()
   ↓
mapResult()
   ↓
createResponse()
```

For example:

```ts
export async function POST(request: Request) {
  const rawBody = await request.json();

  const input = validateCreateUser(rawBody);

  const session = await authenticate(request);

  await authorizeCreateUser(session, input);

  const user = await createUser(input);

  return Response.json(
    toUserResponse(user),
    { status: 201 }
  );
}
```

The exact implementation may vary.

The architecture should remain recognizable.

---

# 33. Keep Transport Logic at the Edge

Prefer:

```text
Route Handler
→ HTTP concerns

Application Service
→ application concerns

Domain
→ business invariants

Repository
→ persistence concerns
```

Avoid:

```text
Route Handler
→ HTTP
→ SQL
→ business rules
→ external API calls
→ response formatting
→ authorization
→ caching
→ everything
```

A giant Route Handler becomes difficult to test and reason about.

---

# 34. Application Service Boundary

A useful application service might expose:

```ts
createUser(command)
```

rather than:

```ts
createUser(request)
```

The difference is architectural.

Bad coupling:

```text
application layer
depends on Request
```

Better:

```text
HTTP Request
    ↓
Route Handler
    ↓
Command
    ↓
Application Service
```

Now the application can potentially be invoked from:

```text
HTTP API
Server Action
background job
CLI
test
message consumer
```

without importing HTTP-specific objects.

---

# 35. Request Context

Some request metadata legitimately belongs in an application command.

For example:

```ts
{
  actorId,
  tenantId,
  input
}
```

But the application should receive normalized semantic context rather than raw transport objects.

Prefer:

```text
Request
 ↓
extract actor
 ↓
extract tenant
 ↓
construct command
 ↓
application service
```

rather than:

```text
applicationService(request)
```

This preserves the boundary.

---

# 36. Validation and Authorization Ordering

A typical sequence is:

```text
Parse
 ↓
Validate structure
 ↓
Authenticate
 ↓
Authorize
 ↓
Execute
```

But exact ordering can depend on the operation.

For example, systems sometimes intentionally avoid revealing whether a resource exists to unauthorized users.

Therefore:

```text
technical ordering
+
information disclosure requirements
```

must both be considered.

This is a senior-level security consideration.

---

# 37. Avoid Over-Validation at the Wrong Layer

Not every business rule belongs in the Route Handler.

Example:

```text
email must be syntactically valid
```

is appropriate boundary validation.

But:

```text
user cannot create another active subscription while an existing subscription is pending
```

is a domain/application rule.

The distinction:

```text
Shape validation
→ boundary

Business invariant
→ domain/application
```

---

# 38. Input Validation Is Not Security Authorization

A request can be perfectly valid and still unauthorized.

Example:

```json
{
  "userId": "123",
  "role": "admin"
}
```

The JSON may be valid.

The schema may be valid.

But the requester may not be allowed to change roles.

Therefore:

```text
Valid input
≠
Authorized operation
```

This distinction becomes central in the next KPI 08 part covering API authentication and authorization.

---

# 39. API Contract Example

A complete endpoint can be modeled as:

```text
POST /api/users
```

### Request

```json
{
  "name": "Alice",
  "email": "alice@example.com"
}
```

### Processing

```text
HTTP request
    ↓
parse JSON
    ↓
validate schema
    ↓
authenticate
    ↓
authorize
    ↓
create user
    ↓
map entity → DTO
```

### Response

```http
201 Created
Content-Type: application/json
```

```json
{
  "id": "usr_123",
  "name": "Alice",
  "email": "alice@example.com"
}
```

### Failure

```http
400 Bad Request
```

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Invalid request.",
    "fields": {
      "email": "Invalid email address"
    }
  }
}
```

This is an explicit HTTP contract.

---

# 40. Parsing + Validation Architecture

A reusable architecture can look like:

```text
                    HTTP Request
                         │
            ┌────────────┴────────────┐
            │                         │
        Transport                 Context
        parsing                  extraction
            │                         │
            └────────────┬────────────┘
                         ↓
                    Normalization
                         ↓
                    Validation
                         ↓
                  Trusted Input
                         ↓
                Application Service
                         ↓
                    Domain Result
                         ↓
                   Response DTO
                         ↓
                 HTTP Serialization
                         ↓
                    HTTP Response
```

This architecture makes the trust boundary explicit.

---

# 41. The Trust Boundary

Everything entering from HTTP should initially be considered:

```text
untrusted
```

After successful validation:

```text
trusted according to schema
```

After authentication:

```text
trusted identity
```

After authorization:

```text
trusted operation context
```

After domain validation:

```text
valid business operation
```

Therefore trust is progressively established.

```text
Untrusted Request
       ↓
Parsed
       ↓
Schema-valid
       ↓
Authenticated
       ↓
Authorized
       ↓
Domain-valid
       ↓
Executable Operation
```

This is a powerful way to reason about API security.

---

# 42. Caching Implications

Request parsing and response construction also influence caching.

For example:

```text
GET /api/products?category=books
```

and:

```text
GET /api/products?category=electronics
```

are different representations.

Similarly:

```text
Authorization
Cookie
Tenant
Locale
Feature Flag
```

may affect the response.

Therefore:

```text
request input
        ↓
representation dependencies
        ↓
cache identity
```

The API cannot safely cache a response without understanding which request dimensions affect that response.

This connects directly to the caching architecture covered in KPI 06.

---

# 43. Authentication and Personalized Responses

Suppose:

```text
GET /api/me
```

returns:

```json
{
  "id": "123",
  "name": "Alice"
}
```

The response depends on:

```text
authenticated principal
```

Therefore it cannot generally be treated like a globally shared public representation.

The important question is:

> What request context determines the response?

If identity determines it, the cache strategy must account for identity.

---

# 44. Tenant-Aware Responses

Consider:

```text
GET /api/products
```

where the hostname determines tenant:

```text
acme.example.com
globex.example.com
```

The URL path is identical.

But the response differs.

Therefore:

```text
same path
≠
same representation
```

The tenant context must be included in the representation model and any relevant cache identity.

---

# 45. Response Contract Versioning

APIs evolve.

Potential strategies include:

```text
additive evolution
versioned endpoints
versioned media types
explicit API versions
```

A stable contract generally favors additive changes.

For example:

```json
{
  "id": "123",
  "name": "Alice",
  "avatarUrl": "..."
}
```

Adding a field may be backward compatible for consumers that ignore unknown fields.

But changing:

```text
name
→ displayName
```

can break existing consumers.

Therefore response DTOs act as a compatibility boundary.

---

# 46. Backward Compatibility

Before changing a response, ask:

```text
Who consumes this endpoint?
What assumptions do they make?
Are fields optional or required?
Are enum values exhaustive?
Are status codes relied upon?
Are error codes relied upon?
Are headers part of the contract?
```

An API contract includes more than JSON shape.

It can include:

```text
method
path
query semantics
headers
status codes
response body
error codes
pagination behavior
caching behavior
idempotency semantics
```

---

# 47. API Boundary Anti-Patterns

## Anti-pattern 1: Type Assertion Instead of Validation

```ts
const input = await request.json() as Input;
```

Problem:

```text
compile-time assertion
≠
runtime validation
```

---

## Anti-pattern 2: Returning Database Entities Directly

```ts
return Response.json(userFromDatabase);
```

Problem:

```text
internal representation becomes public contract
```

---

## Anti-pattern 3: Generic 200 for Everything

```text
every successful operation → 200
every failure → 500
```

Problem:

```text
HTTP semantics become meaningless
```

---

## Anti-pattern 4: Parsing in the Domain Layer

```text
domainService(request.json())
```

Problem:

```text
HTTP concerns leak inward
```

---

## Anti-pattern 5: Business Rules in Query Parsing

```text
if (status === "pending" && ...)
```

inside URL parsing logic.

Problem:

```text
transport concerns
+
domain concerns
```

become coupled.

---

## Anti-pattern 6: Returning Raw Exceptions

```ts
return Response.json(error);
```

Problem:

```text
internal implementation details may leak
```

---

## Anti-pattern 7: Message-Based Client Logic

```text
if (error.message === "Email exists")
```

Problem:

```text
human text becomes machine contract
```

---

# 48. Debugging Method

When an API returns an unexpected result, inspect the pipeline.

```text
1. What HTTP request arrived?
2. What route matched?
3. What parameters were extracted?
4. What headers were received?
5. What body representation was used?
6. What normalization occurred?
7. What validation occurred?
8. What trusted input reached the application?
9. What application result was produced?
10. How was it mapped to HTTP?
```

This avoids debugging only the final response.

---

# 49. Production Failure Scenario

## Scenario

A frontend sends:

```json
{
  "limit": "20"
}
```

The backend expects:

```ts
limit: number
```

The developer uses:

```ts
const input = requestBody as SearchInput;
```

The application later performs:

```ts
items.slice(0, input.limit);
```

Unexpected behavior occurs.

### Root cause

The problem is not necessarily in the search logic.

The real failure is:

```text
unvalidated external input
        ↓
false type assumption
        ↓
incorrect application behavior
```

The correct architecture catches the issue at the boundary.

---

# 50. Production Failure Scenario: Response Leak

Suppose the database entity contains:

```text
passwordHash
internalRole
billingProviderId
```

A developer returns:

```ts
Response.json(user);
```

The API unintentionally exposes internal fields.

Root cause:

```text
persistence model
        ↓
direct public serialization
```

Correct:

```text
persistence model
        ↓
domain/application result
        ↓
public DTO mapper
        ↓
response
```

---

# 51. Production Failure Scenario: Inconsistent Errors

Endpoint A returns:

```json
{
  "error": "Invalid email"
}
```

Endpoint B returns:

```json
{
  "message": "email invalid"
}
```

Endpoint C returns:

```json
{
  "errors": [
    "Invalid email"
  ]
}
```

The frontend now requires endpoint-specific parsing.

This is a contract architecture failure.

A shared error contract reduces this complexity.

---

# 52. Production Failure Scenario: Incorrect Status

A resource creation endpoint returns:

```http
200 OK
```

even though a new resource was created.

The frontend works.

But:

```text
HTTP semantics
observability
API documentation
client expectations
integration behavior
```

become less precise.

SDE-2 reasoning requires recognizing that protocol semantics are part of architecture, not cosmetic details.

---

# 53. Production Failure Scenario: Query Ambiguity

Suppose:

```text
/api/products?page=
```

is silently interpreted as:

```text
page = 1
```

while:

```text
/api/products?page=abc
```

causes:

```text
500 Internal Server Error
```

The API has accidentally mixed:

```text
missing
empty
invalid
```

with inconsistent semantics.

The boundary should define these cases explicitly.

---

# 54. Production Failure Scenario: Duplicate Query Values

Request:

```text
/api/search?tag=react&tag=nextjs
```

One implementation reads:

```ts
searchParams.get("tag")
```

and only receives one value.

The API documentation says multiple tags are supported.

The implementation and contract disagree.

Therefore:

```text
API contract
        ↕
framework extraction
        ↕
application semantics
```

must remain aligned.

---

# 55. Production Architecture

A mature Route Handler can follow:

```text
┌───────────────────────────────────────────────┐
│                 HTTP Boundary                 │
│                                               │
│  Route Resolution                             │
│       ↓                                       │
│  Parse Request                                │
│       ↓                                       │
│  Normalize                                    │
│       ↓                                       │
│  Validate                                     │
│       ↓                                       │
│  Authenticate                                 │
│       ↓                                       │
│  Authorize                                    │
└───────────────────────┬───────────────────────┘
                        ↓
              Application Service
                        ↓
                 Domain Logic
                        ↓
                 Persistence
                        ↓
              Application Result
                        ↓
                 Response DTO
                        ↓
              HTTP Status/Headers
                        ↓
                  HTTP Response
```

This creates a clean boundary between:

```text
transport
security
application
domain
persistence
representation
```

---

# 56. SDE-2 Prediction Challenges

## Challenge 1

Request:

```text
POST /api/orders
```

contains:

```json
{
  "quantity": "10"
}
```

The TypeScript type says:

```ts
quantity: number
```

What happens if no runtime validation exists?

Expected reasoning:

```text
TypeScript does not transform runtime data.
The value remains a string.
The type assertion/type declaration does not establish runtime truth.
```

---

## Challenge 2

Why should an API return a DTO instead of a database entity?

Expected reasoning:

```text
security
contract stability
decoupling
backward compatibility
implementation freedom
```

---

## Challenge 3

What is the difference between:

```text
400
401
403
404
409
500
```

Expected reasoning should focus on HTTP semantics rather than memorization alone.

---

## Challenge 4

Why is:

```ts
request.json() as Input
```

not validation?

Expected reasoning:

```text
`as` affects TypeScript's static understanding only.
It does not inspect the runtime value.
```

---

## Challenge 5

A response depends on:

```text
tenant
user
locale
feature flag
```

What should you ask before caching it?

Expected reasoning:

> Which of these dimensions affect representation identity?

---

# 57. SDE-2 Interview Questions

### Architecture

1. How would you structure a complex Route Handler?
2. Where should request parsing occur?
3. Where should validation occur?
4. Why should application services avoid depending on `Request`?
5. Why separate domain models from API DTOs?

### HTTP

6. When would you return 201 instead of 200?
7. What is the distinction between 401 and 403?
8. When is 204 appropriate?
9. Why are status codes part of the API contract?
10. How should response headers participate in API design?

### TypeScript

11. Why does a TypeScript interface not validate HTTP input?
12. What is the difference between type assertion and runtime validation?
13. How would you safely turn `unknown` JSON into a typed object?

### Errors

14. Why use machine-readable error codes?
15. How would you prevent database errors from leaking?
16. How would you design validation errors for frontend forms?

### Caching

17. What request properties can affect response cache identity?
18. Why can authentication make shared caching dangerous?
19. How does tenant context affect API caching?

### Production

20. How would you debug an endpoint that returns the wrong representation?
21. How would you evolve an API without breaking existing clients?
22. What belongs in the Route Handler versus the application service?
23. How would you design consistent errors across 100 endpoints?
24. How would you handle large or malformed request bodies?

---

# 58. Core Mental Model

The entire part can be compressed into:

```text
                 EXTERNAL
                    │
                    ▼
              HTTP Request
                    │
                    ▼
                Parse
                    │
                    ▼
              Normalize
                    │
                    ▼
              Validate
                    │
                    ▼
             Trusted Input
                    │
                    ▼
          Authenticate / Authorize
                    │
                    ▼
         Application / Domain Logic
                    │
                    ▼
             Domain Result
                    │
                    ▼
              Response DTO
                    │
                    ▼
          Status + Headers + Body
                    │
                    ▼
              HTTP Response
```

The governing principle is:

> **The Route Handler converts untrusted transport data into trusted application input and converts application results into an explicit, stable HTTP contract.**

---

# 59. Critical Distinctions

Remember these distinctions:

```text
Parsing ≠ Validation

Validation ≠ Authorization

Authentication ≠ Authorization

Type assertion ≠ Runtime validation

Domain entity ≠ API DTO

Database model ≠ API contract

HTTP status ≠ Application error code

Human error message ≠ Machine error identifier

Request representation ≠ Application command

Application result ≠ HTTP response

Same URL ≠ Same representation
```

These distinctions prevent a large class of production API bugs.

---

# 60. Completion Checklist

You should be able to explain and implement:

### Request parsing

* [ ] Path parameters
* [ ] Query parameters
* [ ] Repeated query parameters
* [ ] Headers
* [ ] Cookies
* [ ] JSON bodies
* [ ] FormData bodies
* [ ] Content-Type handling
* [ ] Body consumption
* [ ] Request-size considerations

### Validation

* [ ] Parsing vs validation
* [ ] Runtime validation
* [ ] Normalization
* [ ] `unknown` external input
* [ ] Schema validation
* [ ] Field-level validation
* [ ] Domain validation boundaries

### Responses

* [ ] HTTP status semantics
* [ ] Response headers
* [ ] JSON responses
* [ ] Empty responses
* [ ] Response DTOs
* [ ] Serialization
* [ ] Error contracts
* [ ] Machine-readable error codes

### Architecture

* [ ] Route Handler boundary
* [ ] Application-service boundary
* [ ] Domain boundary
* [ ] Persistence boundary
* [ ] Error mapping
* [ ] Response mapping
* [ ] Contract evolution

### SDE-2 reasoning

* [ ] Identify trust boundaries
* [ ] Predict malformed-input behavior
* [ ] Identify contract violations
* [ ] Diagnose response leaks
* [ ] Reason about HTTP semantics
* [ ] Reason about cache identity
* [ ] Design stable API contracts

---

# 61. Part Boundary

### Part 01 — HTTP & Server Endpoint Mental Model

Established:

```text
HTTP
request/response
server endpoints
protocol semantics
```

### Part 02 — Next.js Route Handlers Fundamentals

Established:

```text
route.ts
HTTP method handlers
Next.js endpoint structure
Route Handler execution model
```

### Part 03 — Request Parsing & Response Architecture

Established:

```text
request extraction
normalization
validation
trust boundaries
response DTOs
HTTP status semantics
error contracts
application boundaries
```

### Part 04 — API Authentication & Authorization

Next:

```text
identity
sessions
tokens
cookies
API authentication
authorization
resource ownership
401 vs 403
security boundaries
```

The next part should therefore **not repeat request parsing fundamentals**. It should build directly on the trusted-input boundary established here.

---

# KPI 08 Progress

```text
Part 01  HTTP & Server Endpoint Mental Model        ✓
Part 02  Next.js Route Handlers Fundamentals       ✓
Part 03  Request Parsing & Response Architecture   ✓
Part 04  API Authentication & Authorization        → NEXT
Part 05  API Data Access & Business Logic
Part 06  API Error Contracts, Validation & Idempotency
Part 07  API Caching, Rate Limiting & Resilience
Part 08  BFF, Aggregation & External Integrations
Part 09  API Observability, Testing & Operations
Part 10  Production API Architecture Capstone
```

**Part 03 complete.**

Next canonical part is **KPI 08 — Part 04: API Authentication & Authorization**.
