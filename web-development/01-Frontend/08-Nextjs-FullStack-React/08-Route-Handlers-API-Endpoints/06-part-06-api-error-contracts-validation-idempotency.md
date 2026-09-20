# Level 08 — KPI 08 — Part 06: API Error Contracts, Validation & Idempotency

## 1. Part Objective

This part establishes how production APIs handle invalid input, domain failures, infrastructure failures, retries, duplicate requests, and idempotent mutations.

The governing question is:

> **When an API operation fails—or the client retries it—how does the system preserve semantic correctness and return a stable contract?**

The core architecture is:

```text
HTTP Request
     ↓
Parse
     ↓
Validate
     ↓
Authenticate
     ↓
Authorize
     ↓
Execute Use Case
     ↓
Domain / Infrastructure Result
     ↓
Classify Error
     ↓
Map to Stable API Contract
     ↓
HTTP Response
```

For retry-sensitive mutations:

```text
Request
  ↓
Idempotency Check
  ↓
Execute Once
  ↓
Persist Result
  ↓
Return Result
```

---

# 2. Why Error Architecture Matters

A naive API often starts with:

```ts
try {
  const result = await doSomething();

  return Response.json(result);
} catch {
  return Response.json(
    { error: "Something went wrong" },
    { status: 500 }
  );
}
```

This hides important distinctions.

These failures are not equivalent:

```text
invalid input
unauthenticated
forbidden
resource not found
business rule violation
duplicate resource
conflict
rate limited
dependency unavailable
database failure
unexpected programming error
```

A production API needs to preserve these semantic differences.

---

# 3. Error Handling Is Part of the API Contract

An API contract includes more than successful responses.

It includes:

```text
status code
error code
message
field errors
retry semantics
request identifier
```

For example:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The request contains invalid fields.",
    "fields": {
      "email": "Invalid email address"
    }
  }
}
```

The client can reason about:

```text
error.code
```

instead of parsing human-readable strings.

---

# 4. Error Taxonomy

A useful taxonomy is:

```text
Client / Contract Errors
├── malformed request
├── validation failure
├── authentication failure
├── authorization failure
├── not found
├── conflict
├── rate limit

Domain Errors
├── invalid state transition
├── business rule violation
├── insufficient inventory
├── operation not permitted

Infrastructure Errors
├── database unavailable
├── dependency timeout
├── provider failure
├── network failure

Unexpected Errors
├── programming bug
├── invariant violation
├── unknown failure
```

The API layer maps these categories into appropriate HTTP semantics.

---

# 5. Parsing Failure vs Validation Failure

These are different.

### Parsing

The server cannot understand the structure.

Example:

```text
invalid JSON
malformed multipart body
invalid content encoding
```

### Validation

The structure is understandable, but the values are invalid.

Example:

```json
{
  "email": "not-an-email",
  "age": -5
}
```

The server understood the JSON but rejected its semantic values.

---

# 6. Validation Pipeline

A robust request pipeline can be:

```text
Raw Request
     ↓
Content-Type check
     ↓
Parse
     ↓
Structural validation
     ↓
Semantic validation
     ↓
Normalization
     ↓
Application Command
```

Do not mix all of these responsibilities into one opaque function.

---

# 7. Structural Validation

Structural validation asks:

```text
Does the input have the expected shape?
```

For example:

```json
{
  "email": "user@example.com",
  "quantity": 2
}
```

Expected:

```text
email → string
quantity → number
```

Invalid:

```json
{
  "email": 42,
  "quantity": "two"
}
```

---

# 8. Semantic Validation

Semantic validation asks:

```text
Are the values meaningful?
```

Examples:

```text
quantity > 0
email is valid
date range is valid
plan exists
```

Some semantic validation belongs to the application/domain layer rather than the HTTP boundary.

---

# 9. Validation vs Business Rules

Consider:

```text
quantity = -1
```

This is clearly input validation.

Now consider:

```text
quantity = 100
```

but the product only permits:

```text
maximum purchase quantity = 10
```

This may be a business rule.

The distinction:

```text
Validation
→ Is the input structurally/semantically acceptable?

Business rule
→ Is this operation allowed by the domain?
```

---

# 10. Normalization

Input may need normalization before entering the application layer.

Examples:

```text
trim whitespace
normalize case
canonicalize identifiers
normalize dates
normalize pagination parameters
```

For example:

```text
" USER@EXAMPLE.COM "
```

may become:

```text
"user@example.com"
```

The important point is to define normalization deliberately.

---

# 11. Stable Error Codes

Avoid APIs where clients depend on:

```text
message = "The user already exists"
```

Instead:

```json
{
  "error": {
    "code": "USER_ALREADY_EXISTS"
  }
}
```

Human-readable text can change.

Stable error codes provide machine-readable semantics.

---

# 12. HTTP Status Codes

The HTTP status should communicate broad failure semantics.

Examples:

```text
400 → malformed/invalid request
401 → authentication required/failed
403 → authenticated but not permitted
404 → resource not found
409 → state/resource conflict
422 → semantically invalid input, where used by the API contract
429 → rate limited
500 → unexpected server failure
502/503/504 → upstream/dependency/service failure where appropriate
```

The exact status policy should remain consistent across the API.

---

# 13. 400 vs 422

Different organizations use these differently.

The important requirement is consistency.

For example:

```text
400
→ request contract is invalid
```

and:

```text
422
→ request is syntactically valid but semantically unacceptable
```

can be a coherent policy.

But mixing meanings between endpoints creates client confusion.

---

# 14. 401 vs 403

This distinction is fundamental.

### 401

The server cannot establish an authenticated principal.

Conceptually:

```text
Who are you?
```

### 403

The principal is known but lacks permission.

Conceptually:

```text
You are authenticated.
You are not allowed to perform this operation.
```

Do not use these interchangeably.

---

# 15. 404 vs 403 and Resource Disclosure

Sometimes authorization systems deliberately avoid revealing whether a resource exists.

For example:

```text
GET /api/projects/123
```

If the project belongs to another tenant, returning:

```text
403
```

reveals that project `123` exists.

Some systems instead return:

```text
404
```

to avoid resource enumeration.

The correct choice depends on the security model.

The important point is:

> **HTTP semantics and information disclosure are separate considerations.**

---

# 16. Conflict Errors

`409 Conflict` can represent situations where the request conflicts with current state.

Examples:

```text
duplicate username
invalid state transition
concurrent modification
resource version conflict
already-processed operation
```

For example:

```text
Invoice = PAID
```

Request:

```text
cancel invoice
```

The request may be syntactically valid but conflict with the resource's current state.

---

# 17. Domain Error Mapping

Suppose the domain produces:

```ts
OrderAlreadyShipped
```

The API layer can map:

```text
OrderAlreadyShipped
        ↓
409 Conflict
        ↓
ORDER_ALREADY_SHIPPED
```

This preserves domain meaning without exposing implementation details.

---

# 18. Infrastructure Error Mapping

Suppose the database throws:

```text
connection timeout
```

The API should not return:

```json
{
  "error": {
    "code": "POSTGRES_CONNECTION_TIMEOUT"
  }
}
```

to a normal client.

Instead, map the infrastructure failure into an appropriate API-level failure.

For example:

```text
database unavailable
→ service temporarily unavailable
```

The internal cause should remain available to logs/observability.

---

# 19. Never Leak Internal Errors

Avoid returning:

```text
stack traces
SQL queries
database schema
provider credentials
internal filesystem paths
framework internals
```

to clients.

Bad:

```json
{
  "error": "PrismaClientKnownRequestError..."
}
```

Better:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred."
  }
}
```

The detailed error belongs in server-side diagnostics.

---

# 20. Correlation IDs

Production APIs benefit from request correlation.

Example:

```http
X-Request-ID: req_123
```

Then logs can contain:

```text
req_123
  ├── Route Handler
  ├── database query
  ├── external API call
  └── error
```

The response may return the identifier:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "requestId": "req_123"
  }
}
```

This lets support/debugging connect the client's failure to server-side telemetry.

---

# 21. Error Response Shape

A consistent contract might be:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The request contains invalid fields.",
    "fields": {
      "email": "Invalid email address"
    },
    "requestId": "req_123"
  }
}
```

Not every error needs every property.

For example:

```text
validation error
→ fields

internal error
→ requestId

rate limit
→ retry information
```

The schema should remain predictable.

---

# 22. Field-Level Errors

Form-heavy APIs often need:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "fields": {
      "name": "Name is required",
      "email": "Invalid email",
      "password": "Password is too short"
    }
  }
}
```

This allows clients to associate errors with controls.

It also connects directly with the form architecture from KPI 05.

---

# 23. Error Codes Should Be Domain-Oriented

Prefer:

```text
ORDER_ALREADY_SHIPPED
```

over:

```text
SERVICE_ERROR_17
```

Prefer:

```text
INSUFFICIENT_INVENTORY
```

over:

```text
DATABASE_ERROR
```

when the failure represents a domain-level condition.

The client needs semantic meaning, not implementation details.

---

# 24. Idempotency

Idempotency means:

> Repeating the same logical request does not produce an unintended additional effect.

For example:

```text
create payment
```

should not charge the customer twice merely because the client retried the request.

---

# 25. Why Retries Happen

Clients retry because of:

```text
network timeout
connection reset
mobile network transition
gateway timeout
load balancer failure
client-side uncertainty
```

The critical state is:

```text
Server may have succeeded
Client may not know
```

Example:

```text
Client
  ↓ POST /payments
Server
  ↓
charge succeeds
  ↓
response lost
  ↓
Client sees timeout
```

The client cannot distinguish:

```text
operation failed
```

from:

```text
operation succeeded but response was lost
```

---

# 26. Idempotency Key

The client can send:

```http
Idempotency-Key: pay_abc123
```

The server associates the key with the operation.

Conceptually:

```text
key
+
request fingerprint
+
operation result
```

are stored durably.

A retry using the same key can return the original result.

---

# 27. Idempotency Lifecycle

A robust model is:

```text
Request
   ↓
Extract idempotency key
   ↓
Look up existing operation
   ↓
┌─────────────────────────────┐
│ Existing completed result?  │
└──────────────┬──────────────┘
               │
         yes   │   no
          ↓    │    ↓
     return     │  create
     result     │  operation record
                ↓
             execute
                ↓
          persist result
                ↓
           return result
```

The operation record must be durable enough to survive process failure.

---

# 28. Idempotency Is Not Just Deduplication

Simple deduplication says:

```text
"I saw this key before."
```

Real idempotency requires answering:

```text
What operation did the key represent?

Did it finish?

What was the result?

Was the retry identical?

Is the operation still in progress?

Can the result safely be replayed?
```

This is an application state-management problem.

---

# 29. Request Fingerprinting

Suppose:

```text
Idempotency-Key: abc123
```

was first used for:

```json
{
  "amount": 100
}
```

Then the client retries:

```json
{
  "amount": 1000
}
```

with the same key.

The server should not silently treat these as the same operation.

The system can associate the key with a request fingerprint:

```text
key abc123
→ fingerprint X
```

and reject:

```text
same key
+
different fingerprint
```

as a conflict.

---

# 30. Idempotency Record States

A useful model:

```text
NEW
 ↓
PROCESSING
 ↓
SUCCEEDED
```

or:

```text
PROCESSING
 ↓
FAILED
```

Potentially:

```text
PROCESSING
SUCCEEDED
FAILED
EXPIRED
```

The exact model depends on the operation.

---

# 31. Concurrent Duplicate Requests

Two requests can arrive simultaneously:

```text
Request A → key=abc
Request B → key=abc
```

A naive implementation:

```text
A checks → not found
B checks → not found
A executes
B executes
```

still duplicates the operation.

Therefore the idempotency mechanism itself needs concurrency protection.

Possible mechanisms include:

```text
unique database constraint
atomic insert
locking
compare-and-set
transaction
```

---

# 32. Unique Constraint

A database uniqueness constraint can enforce:

```text
idempotency_key UNIQUE
```

Then concurrent requests race at the database boundary.

Only one can successfully create the operation record.

This is a strong example of combining:

```text
application logic
+
database integrity
```

---

# 33. Idempotency and Transactions

Suppose:

```text
create payment record
```

and:

```text
idempotency record
```

must remain consistent.

They may need to be persisted within the same database transaction.

Conceptually:

```text
BEGIN
   create idempotency operation
   create payment state
COMMIT
```

The exact architecture depends on whether the external payment provider is involved.

---

# 34. Idempotency and External Providers

Consider:

```text
API
 ↓
Payment Provider
```

The API may itself be retried.

The payment provider may also support idempotency keys.

A robust architecture may propagate a controlled idempotency identity:

```text
Client key
    ↓
Application operation
    ↓
Provider idempotency key
```

But do not blindly reuse external identifiers across unrelated systems.

The mapping should be deliberate.

---

# 35. Exactly-Once vs At-Least-Once

Distributed systems rarely provide true exactly-once execution across all components.

A more realistic model is:

```text
delivery
→ at least once
```

combined with:

```text
processing
→ idempotent
```

Therefore:

```text
at-least-once delivery
+
idempotent consumer
```

can produce effectively-once business effects.

---

# 36. Retry Safety

Not every HTTP method has identical retry semantics.

For example:

```text
GET
```

is generally designed as a safe read.

A mutation such as:

```text
POST /payments
```

may require explicit idempotency.

The question is not simply:

> "Can this request be retried?"

It is:

> **What happens if this operation executes more than once?**

---

# 37. Idempotent vs Safe

These concepts are different.

### Safe

The operation does not intentionally modify state.

Example:

```text
GET
```

### Idempotent

Repeating the operation results in the same intended state.

An operation can be idempotent while still mutating state.

For example:

```text
PUT /users/123
```

setting the same email repeatedly can be idempotent.

---

# 38. POST Can Be Made Idempotent

`POST` does not automatically mean:

```text
every retry creates a new resource
```

An application can define idempotency semantics using:

```text
Idempotency-Key
```

This is common for payment-like operations and other retry-sensitive commands.

---

# 39. Retry Classification

Not every failure should be retried.

Potentially retryable:

```text
temporary network failure
503
gateway timeout
transient provider failure
```

Potentially non-retryable:

```text
validation error
authentication failure
authorization failure
business rule violation
invalid state
```

A client should not blindly retry every `4xx`.

---

# 40. Retry-After

For rate limiting or temporary service unavailability, the server may provide retry guidance.

Conceptually:

```http
Retry-After: 30
```

This tells the client to wait before retrying.

Retry policy should respect server-provided semantics when appropriate.

---

# 41. Backoff

A common retry strategy uses:

```text
exponential backoff
+
jitter
```

Conceptually:

```text
attempt 1 → wait short
attempt 2 → wait longer
attempt 3 → wait longer
```

Jitter prevents many clients from retrying simultaneously.

Without jitter:

```text
failure
 ↓
1000 clients retry together
 ↓
server overload
 ↓
failure
 ↓
1000 clients retry again
```

This can create a retry storm.

---

# 42. Retry Storms

A production failure pattern:

```text
dependency slows
 ↓
requests timeout
 ↓
clients retry
 ↓
load increases
 ↓
dependency becomes slower
 ↓
more retries
```

This feedback loop can amplify an outage.

Therefore:

```text
timeouts
+
bounded retries
+
backoff
+
jitter
+
circuit breaking/rate limiting
```

must be considered together.

---

# 43. Error Handling and Timeouts

An external timeout should not necessarily become:

```text
500 INTERNAL_ERROR
```

The system may classify it as:

```text
dependency unavailable
```

and potentially return:

```text
503
```

or another appropriate status based on the API's contract.

Internally, the original timeout should remain observable.

---

# 44. Partial Failure

Consider:

```text
create order
 ↓
payment succeeds
 ↓
inventory update fails
```

This is not merely an HTTP error.

It is a distributed consistency problem.

The system needs explicit state modeling.

For example:

```text
ORDER_PENDING
PAYMENT_CONFIRMED
INVENTORY_PENDING
```

rather than pretending the entire operation is a single atomic transaction.

---

# 45. Error Handling as State Modeling

A mature system does not always think:

```text
success / failure
```

It may need:

```text
pending
processing
succeeded
failed
cancelled
partially_completed
retrying
```

This is especially important for asynchronous operations.

---

# 46. Error Recovery

A useful recovery model:

```text
Failure
 ↓
Classify
 ↓
Can retry?
 ├── no → return stable error
 └── yes
       ↓
bounded retry
       ↓
success?
 ├── yes → return success
 └── no → durable failure state
```

The key is that retry behavior should be deliberate rather than accidental.

---

# 47. Error Mapping Across Layers

The complete model is:

```text
Infrastructure
      ↓
Infrastructure Error
      ↓
Application Error
      ↓
Domain / Contract Meaning
      ↓
HTTP Status + Error Code
```

For example:

```text
Unique database constraint
        ↓
DuplicateEmail
        ↓
USER_ALREADY_EXISTS
        ↓
409 Conflict
```

Another:

```text
Payment provider timeout
        ↓
PaymentProviderUnavailable
        ↓
PAYMENT_TEMPORARILY_UNAVAILABLE
        ↓
503
```

---

# 48. Do Not Convert Everything to 500

This is a common anti-pattern:

```text
catch(error) {
  return Response.json(
    { error: "Internal error" },
    { status: 500 }
  );
}
```

It destroys useful semantics.

For example:

```text
invalid input
→ 500
```

is misleading.

```text
not found
→ 500
```

is misleading.

```text
duplicate resource
→ 500
```

is misleading.

Error classification matters.

---

# 49. Do Not Expose Everything

The opposite anti-pattern is:

```text
catch(error) {
  return Response.json(error);
}
```

This may expose:

```text
database internals
stack traces
provider errors
sensitive information
```

The API boundary should sanitize and map errors.

---

# 50. Error Handling Pipeline

A strong Route Handler architecture:

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
Idempotency Check
 ↓
Application Service
 ↓
Domain / Infrastructure
 ↓
Classify Result
 ↓
Map Error
 ↓
HTTP Response
```

This makes error behavior predictable.

---

# 51. Idempotency Placement

Idempotency generally belongs around the application mutation boundary.

Conceptually:

```text
HTTP
 ↓
validate
 ↓
authenticate
 ↓
authorize
 ↓
idempotency
 ↓
application command
```

Authentication and authorization should generally occur before accepting a replayable operation into the protected application workflow.

The exact placement can vary depending on the API contract.

---

# 52. Idempotency and Authorization

A dangerous mistake would be:

```text
key abc
→ previous successful result
→ return it to anyone
```

Idempotency records must respect authorization and resource ownership.

A replay should not allow:

```text
User B
→ reuse User A's idempotency key
→ obtain User A's result
```

Therefore idempotency identity may need to include trusted context such as:

```text
principal
tenant
endpoint
operation
```

depending on the security model.

---

# 53. Idempotency Scope

An idempotency key should have a defined scope.

Possible dimensions:

```text
user
tenant
endpoint
operation type
time window
```

For example:

```text
tenant + endpoint + key
```

may be the uniqueness boundary.

The correct scope depends on the application's semantics.

---

# 54. Idempotency Retention

Idempotency records cannot necessarily remain forever.

A system may use:

```text
TTL
expiration
archival
cleanup
```

But the retention period must align with expected retry behavior.

If the record expires too quickly:

```text
original request
→ succeeds

late retry
→ key no longer exists
→ operation executes again
```

Therefore TTL is a correctness decision, not merely a storage optimization.

---

# 55. Idempotency and Cached Responses

Be careful not to confuse:

```text
cache
```

with:

```text
idempotency record
```

A cache answers:

> Can this representation be reused?

An idempotency record answers:

> Has this logical mutation already been processed, and what was its result?

They have different semantics.

---

# 56. Idempotency and Database State

Suppose the response was lost after:

```text
database commit
```

but before:

```text
HTTP response
```

A retry can use the idempotency record to recover the already-completed result.

This is the central value of durable idempotency.

---

# 57. Example: Payment Endpoint

```text
POST /api/payments
Idempotency-Key: payment_123
```

Pipeline:

```text
Request
 ↓
Validate
 ↓
Authenticate
 ↓
Authorize
 ↓
Check idempotency key
 ↓
Existing result?
 ├── yes → replay result
 └── no
      ↓
Create operation
      ↓
Process payment
      ↓
Persist final state
      ↓
Persist result
      ↓
Return
```

If the response is lost:

```text
Client retries
 ↓
same key
 ↓
existing result
 ↓
return same semantic outcome
```

---

# 58. Example: Duplicate Order Request

First request:

```text
POST /orders
key = order_123
```

Server:

```text
order created
```

Response is lost.

Retry:

```text
POST /orders
key = order_123
```

Correct behavior:

```text
do not create a second order
return original result
```

This is the practical meaning of idempotent mutation handling.

---

# 59. Example: Same Key, Different Payload

First:

```json
{
  "productId": "A",
  "quantity": 1
}
```

Second:

```json
{
  "productId": "B",
  "quantity": 10
}
```

Same:

```text
Idempotency-Key: order_123
```

The server should reject the second request as a key/payload conflict rather than silently treating it as the original operation.

---

# 60. Error Contract Versioning

Error contracts are APIs too.

Changing:

```text
ORDER_ALREADY_SHIPPED
```

to:

```text
ORDER_CANNOT_BE_CANCELLED
```

may affect clients.

Therefore error codes should be treated as stable public contracts.

Avoid unnecessarily changing:

```text
code
status
field structure
```

once external clients depend on them.

---

# 61. Client Behavior

A well-designed API lets clients make decisions:

```text
VALIDATION_FAILED
→ show field errors

UNAUTHORIZED
→ authenticate

FORBIDDEN
→ show permission state

NOT_FOUND
→ show missing resource

CONFLICT
→ refresh/reconcile state

RATE_LIMITED
→ back off

SERVICE_UNAVAILABLE
→ retry according to policy
```

This is why semantic error contracts matter.

---

# 62. Production Observability

For every significant error, capture:

```text
request ID
timestamp
endpoint
HTTP method
status
error code
principal identifier where appropriate
tenant context where appropriate
latency
dependency
retry count
idempotency key hash/reference where safe
```

Do not log secrets or sensitive payloads unnecessarily.

---

# 63. Sensitive Idempotency Data

An idempotency key can itself be sensitive depending on the system.

Avoid blindly logging:

```text
Authorization
cookies
payment data
full request bodies
raw credentials
```

Prefer:

```text
hashed/truncated identifiers
safe operation IDs
correlation IDs
```

where appropriate.

---

# 64. Error Metrics

Useful metrics include:

```text
4xx rate
5xx rate
validation failures
conflict rate
429 rate
dependency failures
timeout rate
retry count
idempotency replay count
idempotency conflict count
```

These metrics reveal different classes of problems.

---

# 65. Prediction Challenge

An API receives:

```text
POST /api/orders
```

The client times out.

The server logs:

```text
order created successfully
```

The client retries without an idempotency key.

What is the risk?

```text
duplicate order creation
```

The architecture must address the uncertainty:

```text
client did not receive response
≠
server did not execute
```

---

# 66. Prediction Challenge

Two requests arrive:

```text
A → key=abc
B → key=abc
```

Both see:

```text
no existing key
```

before either inserts.

What went wrong?

The idempotency lookup and creation were not concurrency-safe.

Potential fixes:

```text
unique constraint
atomic insert
transaction
locking
```

---

# 67. Prediction Challenge

A client retries:

```text
key=abc
```

with a different request body.

What should happen?

Do not silently reuse the original result.

The API should detect:

```text
same key
+
different operation
```

and return a conflict/error according to the contract.

---

# 68. Prediction Challenge

A Route Handler catches:

```text
DatabaseUnavailable
```

and returns:

```text
404
```

Why is this dangerous?

Because:

```text
resource not found
```

and:

```text
database unavailable
```

have completely different semantics.

The client may incorrectly conclude that the resource does not exist.

---

# 69. Prediction Challenge

A service returns:

```text
500
```

for every domain error.

What happens?

Clients cannot distinguish:

```text
validation
conflict
permission
business rule
infrastructure failure
```

This damages:

```text
client behavior
observability
retry decisions
debugging
API evolution
```

---

# 70. SDE-2 Interview Questions

### Error Architecture

1. How do you design a consistent API error contract?
2. What is the difference between parsing and validation?
3. How do you map domain errors to HTTP errors?
4. How do you avoid leaking infrastructure errors?
5. When would you use 400, 401, 403, 404, 409, 422, 429, and 503?

### Idempotency

6. What problem does an idempotency key solve?
7. Why isn't checking a key before processing sufficient?
8. How do you make concurrent duplicate requests safe?
9. How do you handle the same key with different payloads?
10. How long should idempotency records live?
11. How does idempotency interact with database transactions?
12. How does idempotency interact with an external payment provider?

### Reliability

13. Which failures are safe to retry?
14. Why are retries dangerous during an outage?
15. Why do exponential backoff and jitter matter?
16. How do you handle partial success across multiple systems?
17. How would you design an API when the client may never know whether a mutation succeeded?

---

# 71. Architecture Decision Framework

When an API operation fails, ask:

### What failed?

```text
Parsing?
Validation?
Authentication?
Authorization?
Domain?
Database?
External dependency?
Unknown?
```

### Can it be retried?

```text
No
Yes immediately
Yes with backoff
Yes only after state reconciliation
```

### Can duplicate execution cause harm?

```text
No
Potentially
Definitely
```

### Does the operation need idempotency?

```text
yes/no
```

### What should the client know?

```text
status
error code
field errors
retry guidance
request ID
```

### What should the server know?

```text
root cause
stack trace
dependency
timing
correlation
operation state
```

---

# 72. Complete Production Error Pipeline

```text
                     Request
                        ↓
                  Parse Request
                        ↓
                   Validate
                        ↓
                 Authenticate
                        ↓
                  Authorize
                        ↓
               Idempotency Check
                        ↓
                Application Use Case
                        ↓
              ┌─────────┴─────────┐
              ↓                   ↓
          Domain Result      Infrastructure
              ↓                   ↓
              └─────────┬─────────┘
                        ↓
                  Error Classifier
                        ↓
                  API Error Mapper
                        ↓
              Status + Error Contract
                        ↓
                     Response
```

For successful mutations:

```text
Application Operation
       ↓
Commit State
       ↓
Persist Idempotency Result
       ↓
Return Response
```

---

# 73. Core Mental Model

The entire part can be compressed to:

```text
Validate early.
Classify failures.
Expose stable semantics.
Hide implementation details.
Design retries deliberately.
Make dangerous mutations idempotent.
```

And:

```text
Unknown client outcome
        ↓
Idempotency
        ↓
Durable operation state
        ↓
Safe replay
```

The central principle is:

> **An API must make failure semantics explicit and must prevent transport-level uncertainty from becoming duplicate business effects.**

---

# 74. Critical Distinctions

Remember:

```text
Parsing ≠ Validation

Validation ≠ Business Rule

Authentication ≠ Authorization

Domain Error ≠ Infrastructure Error

HTTP Error ≠ Internal Exception

500 ≠ Universal Error Status

Retry ≠ Replay

Idempotency ≠ Caching

Idempotency Key ≠ Request ID

At-Least-Once Delivery ≠ Exactly-Once Execution

Database Transaction ≠ Distributed Transaction

Successful Server Execution ≠ Successful Client Receipt

Same Idempotency Key ≠ Automatically Same Request
```

These distinctions are essential for production API design.

---

# 75. Completion Checklist

You should be able to:

### Validation

* [ ] Distinguish parsing from validation
* [ ] Design structural validation
* [ ] Design semantic validation
* [ ] Normalize input deliberately
* [ ] Separate validation from domain rules

### Error Contracts

* [ ] Define stable error codes
* [ ] Design consistent error shapes
* [ ] Map domain errors to HTTP semantics
* [ ] Map infrastructure failures safely
* [ ] Avoid leaking implementation details
* [ ] Support field-level validation errors
* [ ] Use request/correlation IDs

### HTTP Semantics

* [ ] Distinguish 400 / 401 / 403 / 404 / 409 / 422
* [ ] Understand 429
* [ ] Understand temporary service failures
* [ ] Design consistent status-code policy

### Idempotency

* [ ] Explain why retries create uncertainty
* [ ] Design idempotency keys
* [ ] Persist operation state
* [ ] Handle concurrent duplicate requests
* [ ] Detect payload mismatch
* [ ] Define key scope
* [ ] Define retention/expiration
* [ ] Protect idempotency records with authorization

### Reliability

* [ ] Classify retryable failures
* [ ] Use bounded retries
* [ ] Understand exponential backoff
* [ ] Understand jitter
* [ ] Prevent retry storms
* [ ] Handle partial failure
* [ ] Understand distributed side effects

### SDE-2 reasoning

* [ ] Design an error taxonomy
* [ ] Design an idempotent mutation
* [ ] Reason about concurrent duplicate requests
* [ ] Design failure recovery
* [ ] Explain tradeoffs between retry, idempotency, and transactions

---

# 76. Part Boundary

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
```

### Part 06 — API Error Contracts, Validation & Idempotency

```text
Validation
Error taxonomy
HTTP error semantics
Domain error mapping
Infrastructure error mapping
Stable error contracts
Retry behavior
Idempotency
Duplicate request handling
Failure recovery
```

### Part 07 — API Caching, Rate Limiting & Resilience

Next:

```text
API cache semantics
request-level caching
response caching
rate limiting
quotas
backpressure
timeouts
circuit breaking
dependency protection
resilience architecture
```

This next part will connect the API layer to the caching architecture from **KPI 06** and the reliability concepts established here.

---

# KPI 08 Progress

```text
Part 01  HTTP & Server Endpoint Mental Model             ✓
Part 02  Next.js Route Handlers Fundamentals            ✓
Part 03  Request Parsing & Response Architecture        ✓
Part 04  API Authentication & Authorization             ✓
Part 05  API Data Access & Business Logic Boundaries    ✓
Part 06  API Error Contracts, Validation & Idempotency  ✓
Part 07  API Caching, Rate Limiting & Resilience        → NEXT
Part 08  BFF, Aggregation & External Integrations
Part 09  API Observability, Testing & Operations
Part 10  Production API Architecture Capstone
```

**Part 06 complete.**
