# Level 08 — KPI 08 — Part 09

## API Observability, Testing & Production Operations

---

# 1. Part Objective

A production API is not complete when it returns the correct response in development.

At SDE-2 level, you must be able to answer:

* How do we know the API is healthy?
* How do we know when it is degrading?
* How do we identify which dependency caused the degradation?
* How do we trace one request across multiple services?
* How do we distinguish application errors from dependency failures?
* How do we verify that an API contract has not regressed?
* How do we test timeout, retry, rate-limit, and partial-failure behavior?
* How do we debug a production incident from incomplete evidence?
* What should be logged?
* What should never be logged?
* What metrics define the API's reliability?
* What does "healthy" actually mean?
* How do we safely deploy and roll back API changes?

The central objective is:

> **Turn the API from an opaque request/response mechanism into an observable, testable, operable production system.**

---

# 2. The Production API Mental Model

The development mental model is often:

```text
Request
   ↓
Handler
   ↓
Business Logic
   ↓
Response
```

The production mental model must be:

```text
Client
  ↓
Request
  ↓
Routing
  ↓
Authentication
  ↓
Validation
  ↓
Business Logic
  ↓
Data / Dependencies
  ↓
Response
  ↓
Logs
  ↓
Metrics
  ↓
Traces
  ↓
Alerts
  ↓
Operations
```

Testing surrounds the entire system:

```text
                    ┌─────────────────┐
                    │ Contract Tests  │
                    └────────┬────────┘
                             │
Client → API → Business Logic → Dependencies
                             │
                    ┌────────┴────────┐
                    │ Integration     │
                    │ Failure Tests   │
                    └─────────────────┘
```

Production operations then answer:

```text
Is it working?
    ↓
How well?
    ↓
For whom?
    ↓
Where is it failing?
    ↓
Why?
    ↓
What changed?
    ↓
How do we recover?
```

---

# 3. Observability vs Monitoring

These terms are related but not identical.

## Monitoring

Monitoring asks:

> "Is a known condition currently unhealthy?"

Examples:

```text
5xx > 5%
CPU > 80%
Latency p95 > 500ms
```

Monitoring generally depends on predefined signals and thresholds.

---

## Observability

Observability asks:

> "Can we understand the internal state of the system from its external outputs?"

The primary signals are:

```text
Logs
Metrics
Traces
```

But production observability also includes:

```text
Events
Profiles
Deployment metadata
Correlation identifiers
Request context
Dependency information
Audit records
```

The distinction matters.

A system can have many dashboards while still being difficult to debug.

---

# 4. The Three Pillars

## 4.1 Logs

Logs answer:

> **What happened?**

Example:

```text
request_started
request_completed
authorization_denied
database_timeout
external_provider_failed
payment_created
```

---

## 4.2 Metrics

Metrics answer:

> **How often and how badly is something happening?**

Examples:

```text
request_count
error_count
request_duration
5xx_rate
4xx_rate
dependency_latency
cache_hit_rate
rate_limit_rejections
```

---

## 4.3 Traces

Traces answer:

> **Where did the time go and where did the request fail?**

Example:

```text
API request
 ├── authentication       8ms
 ├── database query      40ms
 ├── inventory service    85ms
 ├── payment service     220ms
 └── response             5ms
```

Total:

```text
358ms
```

Without tracing, the API may simply appear to be "slow."

With tracing, the dependency responsible becomes visible.

---

# 5. Structured Logging

Production API logs should generally be structured.

Avoid:

```text
User failed to create order for user 123
```

Prefer a structured event:

```json
{
  "event": "order_creation_failed",
  "requestId": "req_123",
  "userId": "usr_456",
  "tenantId": "tenant_789",
  "errorCode": "INVENTORY_UNAVAILABLE",
  "durationMs": 240,
  "status": 503
}
```

Structured logging enables querying and aggregation.

For example:

```text
event = order_creation_failed
status = 503
tenantId = tenant_789
```

---

# 6. What Every API Request Should Carry

A production request should have a correlation identity.

Conceptually:

```text
Request
  ↓
requestId
  ↓
logs
  ↓
trace
  ↓
downstream calls
```

A useful context object might conceptually contain:

```ts
type RequestContext = {
  requestId: string
  traceId?: string
  userId?: string
  tenantId?: string
  route: string
  method: string
}
```

The exact implementation can differ.

The architectural requirement is:

> A production engineer should be able to connect related evidence across the request lifecycle.

---

# 7. Correlation IDs

Suppose a user reports:

> "Checkout failed."

You need to move from:

```text
User report
```

to:

```text
requestId
```

then:

```text
API logs
    ↓
trace
    ↓
database operation
    ↓
payment provider request
```

Without correlation:

```text
Millions of unrelated events
```

With correlation:

```text
req_abc
 ├── API
 ├── auth
 ├── order service
 ├── payment service
 └── database
```

This dramatically reduces debugging complexity.

---

# 8. Do Not Log Secrets

Observability must not become a security vulnerability.

Do not blindly log:

```text
passwords
access tokens
refresh tokens
session cookies
API keys
credit-card data
private keys
sensitive personal information
```

Dangerous:

```ts
logger.info({
  headers: request.headers,
  body: request.body
})
```

The request may contain secrets.

Instead, explicitly select safe fields:

```ts
logger.info({
  requestId,
  method,
  route,
  status,
  durationMs
})
```

---

# 9. Log Levels

A common conceptual hierarchy is:

```text
DEBUG
INFO
WARN
ERROR
```

### DEBUG

Detailed diagnostic information.

Usually not appropriate at high production volume.

### INFO

Normal important lifecycle events.

### WARN

Unexpected but recoverable behavior.

### ERROR

Failure requiring investigation or operational attention.

The important point is not memorizing levels.

The important question is:

> **What operational signal should this event represent?**

---

# 10. API Metrics

Useful API metrics include:

```text
Request rate
Error rate
Latency
Availability
Saturation
Dependency failures
Rate-limit rejections
Timeouts
```

A basic request metric can be conceptualized as:

```text
requests_total{route,method,status}
```

Latency:

```text
request_duration_ms{route,method}
```

Error rate:

```text
5xx requests / total requests
```

---

# 11. Cardinality Matters

This is a common production mistake.

Consider:

```text
request_count{userId}
```

If there are millions of users:

```text
millions of metric series
```

That can become extremely expensive or operationally dangerous.

Prefer bounded dimensions:

```text
route
method
status_class
region
service
```

Avoid unbounded labels such as:

```text
userId
requestId
email
sessionId
```

unless the telemetry system and use case explicitly support that design.

---

# 12. Route Normalization

A dangerous metric design is:

```text
/api/users/123
/api/users/456
/api/users/789
```

as three separate route dimensions.

Instead:

```text
/api/users/:id
```

should generally be represented as:

```text
/api/users/[id]
```

or another normalized route representation.

Otherwise:

```text
metric cardinality
    ↑
memory/storage cost
    ↑
query complexity
```

---

# 13. Latency Percentiles

Average latency is insufficient.

Suppose:

```text
99 requests = 50ms
1 request = 10 seconds
```

Average latency may still appear acceptable.

Production APIs care about tail latency.

Common measurements:

```text
p50
p90
p95
p99
```

Conceptually:

```text
p50 = typical request
p95 = slower tail
p99 = extreme tail
```

For user-facing APIs, tail behavior can dominate perceived reliability.

---

# 14. Error Rate

Do not treat every non-2xx response identically.

For example:

```text
4xx
```

may represent valid client behavior:

```text
401
403
404
409
422
429
```

while:

```text
5xx
```

generally represents server-side or dependency failure.

Therefore dashboards should distinguish:

```text
4xx rate
5xx rate
5xx by route
5xx by dependency
```

---

# 15. Error Taxonomy

A useful operational taxonomy:

```text
Validation
Authentication
Authorization
Not Found
Conflict
Rate Limited
Dependency Failure
Timeout
Infrastructure Failure
Unexpected Application Failure
```

This allows incidents to be classified rather than simply counted.

---

# 16. Distributed Tracing

A trace represents one logical operation across systems.

Example:

```text
Trace: checkout_abc

API
 ├── auth
 ├── cart
 ├── inventory
 ├── payment
 └── database
```

Each operation becomes a span.

```text
Trace
 ├── API span
 │
 ├── DB span
 │
 ├── inventory span
 │
 └── payment span
```

This enables:

```text
latency breakdown
dependency failure identification
critical path analysis
```

---

# 17. Sequential vs Parallel Tracing

Suppose an endpoint calls:

```text
inventory
pricing
recommendations
```

Sequential:

```text
API
 ↓
inventory 100ms
 ↓
pricing 100ms
 ↓
recommendations 100ms

≈ 300ms
```

Parallel:

```text
API
 ├── inventory 100ms
 ├── pricing 100ms
 └── recommendations 100ms

≈ 100ms
```

Tracing exposes this difference.

This is especially important for BFF architecture from Part 08.

---

# 18. Critical Path

A request may have many dependencies, but only some determine response latency.

Example:

```text
API
 ├── user      20ms
 ├── inventory 100ms
 ├── pricing   80ms
 └── analytics 500ms
```

If analytics is asynchronous:

```text
critical path ≈ 100ms
```

If analytics blocks the response:

```text
critical path ≈ 500ms
```

Observability should help identify this distinction.

---

# 19. API Contract Testing

An API contract is the agreement between producer and consumer.

For example:

```json
{
  "id": "123",
  "name": "Product",
  "price": 99
}
```

A breaking change could be:

```json
{
  "productId": "123",
  "name": "Product",
  "price": 99
}
```

The producer may consider this a small refactor.

The consumer may consider it a production-breaking change.

Contract testing protects the boundary.

---

# 20. Contract Tests vs Unit Tests

Unit test:

```text
Does this function behave correctly?
```

Contract test:

```text
Does this API still satisfy the consumer-facing contract?
```

Integration test:

```text
Do these components work correctly together?
```

End-to-end test:

```text
Does the complete user workflow work?
```

These are different testing layers.

---

# 21. Testing Pyramid for APIs

A reasonable conceptual structure:

```text
             E2E
            /   \
      Integration
        /       \
   Contract     Contract
       \         /
          Unit
```

There should generally be many fast tests and fewer expensive environment-dependent tests.

---

# 22. API Unit Testing

Unit tests should cover deterministic business logic.

Examples:

```text
price calculation
authorization policy
validation rules
state transitions
error mapping
idempotency decisions
```

Example:

```ts
expect(calculateTotal(items)).toBe(120)
```

The goal is not to test the framework.

The goal is to test behavior.

---

# 23. API Integration Testing

Integration tests verify boundaries.

Examples:

```text
Route Handler
   ↓
Service
   ↓
Database
```

Or:

```text
API
 ↓
Provider client
 ↓
Mock provider
```

These tests catch wiring errors that isolated unit tests cannot.

---

# 24. Testing Authentication

Test at least:

```text
anonymous request
valid session
expired session
invalid session
wrong tenant
missing role
insufficient permission
```

Example matrix:

| Request state               | Expected              |
| --------------------------- | --------------------- |
| Anonymous                   | 401                   |
| Authenticated               | success if authorized |
| Authenticated, unauthorized | 403                   |
| Wrong tenant                | rejected              |
| Expired session             | 401                   |

---

# 25. Testing Validation

Test:

```text
missing field
wrong type
empty value
boundary value
malformed value
extra field
unexpected format
```

Also test normalization:

```text
"  john@example.com  "
```

may become:

```text
"john@example.com"
```

if the API contract defines that behavior.

---

# 26. Testing Idempotency

From Part 06, idempotency is especially important for mutation APIs.

Test:

```text
same key + same request
```

Expected:

```text
same logical operation
```

Also test:

```text
same key + different request
```

Expected:

```text
conflict/rejection
```

And:

```text
two concurrent requests
same idempotency key
```

Expected:

```text
only one mutation
```

This race condition is critical.

---

# 27. Timeout Testing

Do not only test successful dependencies.

Simulate:

```text
dependency timeout
```

Then verify:

```text
API does not hang indefinitely
```

Expected behavior may include:

```text
504
fallback
partial response
retry
failure
```

depending on the endpoint contract.

---

# 28. Retry Testing

If an operation retries:

```text
attempt 1
   ↓
failure
   ↓
attempt 2
   ↓
success
```

Test:

```text
retry count
backoff
timeout budget
error classification
idempotency
```

Never assume:

```text
retry = harmless
```

For mutations:

```text
retry + non-idempotent operation
```

can create duplicate side effects.

---

# 29. Rate-Limit Testing

Test:

```text
under limit
at limit
above limit
window reset
different users
different tenants
different endpoints
```

Verify:

```text
429
Retry-After
stable error code
```

Also verify that rate limiting does not accidentally create cross-tenant interference.

---

# 30. Dependency Failure Testing

For an endpoint:

```text
API
 ├── database
 ├── inventory
 └── recommendations
```

Test:

```text
database failure
inventory failure
recommendation failure
timeout
slow response
malformed dependency response
```

The API's behavior should be deliberate.

---

# 31. Partial Failure Testing

Suppose:

```text
inventory = success
pricing = success
recommendations = failure
```

If recommendations are optional:

```json
{
  "products": [...],
  "recommendations": null,
  "degraded": true
}
```

may be appropriate.

But the exact contract must be explicit.

Never let:

```text
dependency failure
```

silently become:

```text
empty valid-looking data
```

because that destroys observability and correctness.

---

# 32. Failure Injection

Production-grade systems should test controlled failure.

Examples:

```text
latency injection
dependency outage
database failure
network failure
invalid response
rate limiting
resource exhaustion
```

The objective is to verify:

```text
failure
 ↓
containment
 ↓
fallback
 ↓
observability
 ↓
recovery
```

---

# 33. Health Checks

A health endpoint commonly exists to answer whether the application can operate.

But there is an important distinction.

### Liveness

> Is the process alive?

### Readiness

> Is the instance ready to receive traffic?

These should not automatically mean the same thing.

---

# 34. Liveness

A liveness check might answer:

```text
Is the application process running?
```

If liveness depends on every external service:

```text
database down
 ↓
liveness fails
 ↓
orchestrator restarts application
 ↓
all instances restart
```

This can amplify an outage.

Therefore liveness should be designed carefully.

---

# 35. Readiness

Readiness can include:

```text
database connectivity
required configuration
critical dependency availability
startup completion
```

If an instance is not ready:

```text
remove from traffic
```

rather than necessarily restarting it.

---

# 36. Health Is Not Business Correctness

An API can be:

```text
healthy
```

while:

```text
checkout is broken
```

Therefore operational health should include business-level signals.

Examples:

```text
orders_created
payments_succeeded
checkout_conversion
inventory_sync_failures
```

Technical health alone is insufficient.

---

# 37. SLIs

Service Level Indicators measure actual service behavior.

Examples:

```text
availability
latency
successful requests
correctness
```

For example:

```text
successful_requests / eligible_requests
```

---

# 38. SLOs

A Service Level Objective defines a target.

Example:

```text
99.9% successful API requests
```

or:

```text
95% of requests under 300ms
```

The exact target is an organizational decision.

The architectural lesson is:

> Observability becomes meaningful when signals map to user-visible service objectives.

---

# 39. Error Budgets

If the SLO is:

```text
99.9%
```

then the allowed unreliability is:

```text
0.1%
```

This is the error budget.

The concept helps teams reason about:

```text
feature velocity
reliability work
release risk
operational investment
```

rather than treating reliability as an abstract aspiration.

---

# 40. Alerting

Not every error should page an engineer.

Bad alert:

```text
404 occurred
```

Potentially useful alert:

```text
5xx rate exceeded SLO threshold
```

Alerts should represent:

```text
actionable conditions
```

A useful alert should answer:

```text
What is wrong?
How severe is it?
Who needs to act?
What evidence should they inspect?
```

---

# 41. Alert Fatigue

If engineers receive:

```text
100 alerts/day
```

many of which are irrelevant, eventually alerts become background noise.

This creates:

```text
alert fatigue
 ↓
missed incidents
```

Therefore alert quality matters more than alert quantity.

---

# 42. Production Debugging Workflow

When an incident occurs:

```text
1. Identify symptom
2. Determine scope
3. Check recent changes
4. Inspect metrics
5. Find affected route
6. Inspect traces
7. Inspect structured logs
8. Identify dependency
9. Confirm hypothesis
10. Mitigate
11. Verify recovery
12. Perform root-cause analysis
```

Do not immediately change code.

First establish evidence.

---

# 43. Example Incident

Suppose:

```text
Checkout latency increased from 300ms → 2s
```

Start with metrics:

```text
Which routes?
Which region?
Which percentage of traffic?
```

Then tracing:

```text
payment provider = 1.6s
```

Then logs:

```text
provider_timeout
```

Then deployment history:

```text
payment client timeout changed 30s ago
```

Now the investigation has moved from:

```text
"checkout is slow"
```

to:

```text
specific dependency + specific behavior + recent change
```

---

# 44. Deployment Metadata

Observability should connect telemetry to deployments.

Useful metadata:

```text
service version
commit SHA
environment
region
deployment ID
feature flag version
```

Then engineers can ask:

```text
Did errors increase after deployment X?
```

rather than manually guessing.

---

# 45. Rollback

A production API needs a recovery strategy.

Possible mechanisms:

```text
rollback deployment
disable feature flag
route traffic elsewhere
disable optional dependency
reduce load
activate fallback
```

Rollback should be considered during design, not after failure.

---

# 46. Feature Flags and APIs

Suppose a new endpoint behavior is behind:

```text
feature_flag = checkout_v2
```

Telemetry should ideally allow comparison:

```text
checkout_v1
checkout_v2
```

Otherwise an error increase may be difficult to attribute.

Feature flags therefore become part of observability context.

---

# 47. Synthetic Monitoring

Synthetic checks execute predefined requests.

Example:

```text
POST /login
GET /dashboard
POST /checkout
```

These can detect:

```text
routing failures
authentication failures
dependency failures
deployment regressions
```

before a user reports them.

---

# 48. Security Observability

Some events require audit-level tracking.

Examples:

```text
login
logout
permission changes
role changes
API key creation
sensitive resource access
administrative actions
```

Audit logs have different requirements from ordinary debugging logs.

They should be:

```text
structured
controlled
tamper-resistant where required
appropriately retained
access-controlled
```

---

# 49. Do Not Confuse Audit Logs and Debug Logs

Debug log:

```text
database query took 40ms
```

Audit event:

```text
admin_changed_user_role
```

They have different purposes.

```text
Debugging → understand system behavior
Audit → establish security/business activity history
```

---

# 50. API Production Test Matrix

A mature API should be tested across multiple dimensions.

| Dimension     | Examples                  |
| ------------- | ------------------------- |
| Input         | valid, invalid, boundary  |
| Auth          | anonymous, valid, expired |
| Authorization | allowed, denied           |
| Tenant        | correct, wrong, missing   |
| Dependency    | healthy, slow, failed     |
| Concurrency   | duplicate, racing         |
| Network       | timeout, disconnect       |
| Rate limit    | below, at, above          |
| Cache         | hit, miss, stale          |
| Deployment    | old, new, rollback        |
| Contract      | compatible, breaking      |
| Observability | logs, metrics, traces     |

---

# 51. Testing the Error Contract

Do not only test:

```text
status === 400
```

Also verify:

```json
{
  "error": {
    "code": "INVALID_EMAIL",
    "message": "Invalid email address",
    "field": "email"
  }
}
```

The error contract is part of the API.

Consumers may depend on:

```text
status
code
field
retryability
```

---

# 52. Contract Regression

Suppose the frontend expects:

```text
error.code = "EMAIL_TAKEN"
```

A backend developer changes it to:

```text
EMAIL_ALREADY_EXISTS
```

The HTTP status remains:

```text
409
```

but the consumer breaks.

Therefore:

> Machine-readable API contracts must be tested, not just HTTP status codes.

---

# 53. Testing the BFF

From Part 08:

```text
Browser
   ↓
BFF
 ├── service A
 ├── service B
 └── service C
```

Test:

```text
all dependencies succeed
A fails
B fails
C fails
A times out
B returns malformed data
multiple dependencies fail
```

Also test:

```text
fan-out concurrency
partial response
timeout budget
fallback behavior
```

---

# 54. Dependency-Level Metrics

For every important dependency, measure:

```text
request count
success rate
error rate
latency
timeouts
retries
circuit state
```

Example:

```text
payment_service
  success: 99.2%
  p95: 240ms
  timeout: 0.4%
  retries: 1.1%
```

This is much more useful than:

```text
API latency = 400ms
```

alone.

---

# 55. Timeout Budget

Suppose API SLO:

```text
500ms
```

Dependencies:

```text
DB        100ms
Inventory 150ms
Payment   200ms
```

If they are sequential:

```text
450ms
```

Leaving little overhead.

If one dependency unexpectedly consumes:

```text
500ms
```

the API cannot meet the target.

Timeouts should therefore be designed from the end-to-end latency budget.

---

# 56. Operational Backpressure

Observability should reveal overload.

Signals include:

```text
queue depth
concurrent requests
connection pool usage
CPU
memory
dependency saturation
timeout rate
```

If traffic exceeds capacity:

```text
load
 ↓
queue
 ↓
latency
 ↓
timeouts
 ↓
retries
 ↓
more load
 ↓
failure amplification
```

This is a classic production feedback loop.

---

# 57. Retry Amplification

Suppose:

```text
1,000 requests
```

Each retries twice.

Potential downstream attempts:

```text
3,000
```

A failing dependency can therefore receive more traffic precisely when it is least able to handle it.

Observability should track:

```text
original requests
retry attempts
total dependency requests
```

---

# 58. Production Failure Scenario: Silent 200

Bad architecture:

```text
Provider fails
   ↓
BFF catches error
   ↓
returns []
   ↓
HTTP 200
```

Now:

```text
technical failure
```

has become:

```text
apparently successful response
```

This can produce silent data corruption.

Correct behavior depends on contract, but the system must preserve the distinction between:

```text
empty result
```

and:

```text
failed dependency
```

---

# 59. Production Failure Scenario: Missing Trace Context

Suppose:

```text
Frontend request
 ↓
API
 ↓
BFF
 ↓
Payment service
```

but trace context is not propagated.

Now the payment service logs:

```text
payment timeout
```

but cannot be connected to:

```text
checkout request
```

This dramatically increases incident-debugging cost.

---

# 60. Production Failure Scenario: High Cardinality

An engineer adds:

```text
metric{requestId}
```

Traffic increases.

Metric series explode.

The telemetry platform becomes expensive or unstable.

The API itself may be healthy while observability infrastructure becomes the bottleneck.

This is why observability is itself production architecture.

---

# 61. Production Failure Scenario: Health Check Cascade

Suppose:

```text
database outage
```

and liveness depends on DB:

```text
DB failure
 ↓
liveness failure
 ↓
instances restart
 ↓
connection storm
 ↓
DB recovery becomes harder
```

This is an operational feedback loop.

Health checks must be designed to avoid amplifying failures.

---

# 62. Production Failure Scenario: Contract Drift

Frontend expects:

```text
user.name
```

Backend deploys:

```text
user.displayName
```

No backend unit test fails.

But production frontend requests now fail.

Contract tests should catch this before deployment.

---

# 63. Production Failure Scenario: Retry + Mutation

Suppose:

```text
POST /payments
```

The provider succeeds, but the response times out.

The client retries.

Without idempotency:

```text
Payment #1 created
Payment #2 created
```

From the client's perspective:

```text
"the first request failed"
```

From the provider's perspective:

```text
both succeeded
```

Observability alone does not solve this.

The API requires correct idempotency architecture plus observability.

---

# 64. Production Debugging Decision Tree

When users report failure:

```text
Is traffic reaching the API?
        │
        ├── No → routing / network / deployment
        │
        └── Yes
             ↓
Are requests returning errors?
             │
             ├── 4xx → client/auth/authorization/contract
             │
             └── 5xx
                  ↓
             Application or dependency?
                  │
                  ├── Application
                  │
                  └── Dependency
                       ↓
                  timeout?
                  error?
                  saturation?
                  malformed response?
```

This should become instinctive.

---

# 65. API Operations Checklist

Before declaring an API production-ready:

### Observability

```text
[ ] Structured logs
[ ] Request correlation
[ ] Metrics
[ ] Latency percentiles
[ ] Distributed tracing where needed
[ ] Dependency telemetry
[ ] Deployment metadata
```

### Security

```text
[ ] Secrets are not logged
[ ] Sensitive data is controlled
[ ] Audit events are defined
[ ] Access to telemetry is restricted
```

### Testing

```text
[ ] Unit tests
[ ] Integration tests
[ ] Contract tests
[ ] Authentication tests
[ ] Authorization tests
[ ] Validation tests
[ ] Idempotency tests
[ ] Timeout tests
[ ] Retry tests
[ ] Rate-limit tests
[ ] Dependency failure tests
```

### Operations

```text
[ ] Health checks
[ ] Readiness
[ ] Alerting
[ ] SLOs
[ ] Incident runbook
[ ] Rollback strategy
[ ] Synthetic monitoring
```

---

# 66. SDE-2 Prediction Challenges

You should be able to predict the consequences before implementing the architecture.

### Challenge 1

```text
Every API request logs the entire request body.
```

Predict:

* security risks
* storage growth
* sensitive-data exposure
* logging cost
* performance impact

---

### Challenge 2

```text
Metric labels include userId.
```

Predict:

* cardinality explosion
* telemetry cost
* query degradation

---

### Challenge 3

```text
BFF calls five services sequentially.
```

Predict:

```text
latency ≈ sum(dependency latency)
```

Then redesign using bounded parallelism where safe.

---

### Challenge 4

```text
Payment request retries automatically.
```

Ask:

> Is the mutation idempotent?

If not, identify the duplicate-side-effect risk.

---

### Challenge 5

```text
Liveness depends on database availability.
```

Predict:

```text
DB outage
→ restart storm
→ connection storm
→ recovery amplification
```

---

### Challenge 6

```text
BFF returns 200 with empty data whenever a dependency fails.
```

Predict:

```text
silent data loss
```

and explain how to represent degraded state.

---

# 67. SDE-2 Interview Questions

You should be able to answer these without memorized definitions.

### Observability

1. What makes an API observable?
2. When would you use logs vs metrics vs traces?
3. What should a request ID accomplish?
4. How do you prevent logs from leaking secrets?
5. What is metric cardinality?
6. Why are user IDs dangerous metric dimensions?
7. Why are p95/p99 often more useful than averages?

### Testing

8. Unit test vs integration test vs contract test?
9. What should API contract tests protect?
10. How would you test idempotency under concurrent requests?
11. How would you test dependency timeouts?
12. How would you test partial failure?
13. How would you test rate limiting?
14. How would you test retry behavior?

### Operations

15. Liveness vs readiness?
16. Why shouldn't liveness necessarily depend on the database?
17. What makes an alert actionable?
18. What is an SLI?
19. What is an SLO?
20. What is an error budget?
21. How would you debug an API that suddenly became slow?
22. How would you identify the dependency responsible for latency?
23. How would you roll back a problematic API deployment?

### Architecture

24. How would you instrument a BFF?
25. How do you propagate trace context?
26. How do you observe fan-out requests?
27. How do you distinguish an empty response from degraded data?
28. How do retries affect downstream load?
29. How do you design observability for multi-tenant systems?
30. What belongs in audit logs versus application logs?

---

# 68. The SDE-2 Production Mental Model

You should now think about an API as:

```text
                    ┌──────────────┐
                    │   Clients    │
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │     API      │
                    └──────┬───────┘
                           ↓
              ┌────────────────────────┐
              │ Auth / Validation      │
              │ Business Logic         │
              │ Error Contracts        │
              └───────────┬────────────┘
                          ↓
              ┌────────────────────────┐
              │ Data / Dependencies    │
              └───────────┬────────────┘
                          ↓
                    ┌──────────────┐
                    │   Response   │
                    └──────────────┘

          ┌────────────┬────────────┬────────────┐
          ↓            ↓            ↓
        Logs        Metrics       Traces
          └────────────┬────────────┘
                       ↓
                Operations
                       ↓
            Alerts / Incident Response
```

This is the production API system.

---

# 69. Core Distinctions

Memorize the distinctions, not isolated definitions.

```text
Logging ≠ Monitoring

Monitoring ≠ Observability

Logs ≠ Metrics ≠ Traces

Unit Test ≠ Integration Test

Integration Test ≠ Contract Test

Liveness ≠ Readiness

Health ≠ Business Correctness

4xx ≠ 5xx

Average Latency ≠ Tail Latency

Request ID ≠ Trace ID

Debug Log ≠ Audit Log

Retry ≠ Safe Retry

Timeout ≠ Failure Handling

Dependency Failure ≠ Empty Data

API Contract ≠ Internal Implementation

Alert ≠ Dashboard

Rollback ≠ Root-Cause Fix

Technical Health ≠ User-Visible Success
```

---

# 70. Complete Production API Architecture

A mature API request lifecycle now looks like:

```text
Request
  ↓
Request ID / Trace Context
  ↓
Routing
  ↓
Authentication
  ↓
Authorization
  ↓
Validation
  ↓
Rate Limiting
  ↓
Business Logic
  ↓
Cache / Database / Dependencies
  ↓
Timeout / Retry / Resilience Policies
  ↓
Error Mapping
  ↓
Response Contract
  ↓
Structured Telemetry
  ↓
Metrics / Traces / Logs
  ↓
SLO / Alerting
  ↓
Operational Response
```

Testing surrounds each layer:

```text
Unit
Integration
Contract
Failure
Concurrency
Security
Load
Synthetic
```

---

# 71. Part Completion Criteria

You have completed this part when you can independently:

* design structured API logging
* define safe log fields
* propagate request correlation
* explain distributed tracing
* design useful API metrics
* control metric cardinality
* reason about p95/p99 latency
* create an API error taxonomy
* design contract tests
* distinguish unit, integration, contract, and E2E tests
* test authentication and authorization
* test idempotency under concurrency
* test timeouts and retries
* test dependency failures
* test partial failures
* test rate limiting
* explain liveness vs readiness
* define meaningful health signals
* design SLIs/SLOs
* design actionable alerts
* debug production incidents using telemetry
* connect deployments to observability
* reason about rollback
* design synthetic monitoring
* distinguish audit logging from debugging logs
* identify observability failure modes
* instrument BFF fan-out
* reason about retry amplification
* explain production API operational tradeoffs

---

# 72. KPI 08 — Progress

```text
Part 01  ✓  HTTP & Server Endpoint Mental Model
Part 02  ✓  Next.js Route Handlers Fundamentals
Part 03  ✓  Request Parsing & Response Architecture
Part 04  ✓  API Authentication & Authorization
Part 05  ✓  API Data Access & Business Logic Boundaries
Part 06  ✓  API Error Contracts, Validation & Idempotency
Part 07  ✓  API Caching, Rate Limiting & Resilience
Part 08  ✓  BFF, Aggregation & External Integrations
Part 09  ✓  API Observability, Testing & Production Operations
Part 10  →  Production API Architecture Capstone
```

---

# 73. Boundary of This Part

This part establishes **how APIs are observed, tested, diagnosed, and operated in production**.

It does not yet serve as the final KPI integration.

The remaining part must integrate:

```text
HTTP
Route Handlers
Request/Response
Authentication
Authorization
Validation
Business Logic
Error Contracts
Idempotency
Caching
Rate Limiting
Resilience
BFF
Aggregation
External Integrations
Observability
Testing
Production Operations
```

into one complete architecture.

That is **Part 10 — Production API Architecture Capstone**.

---

# Final Mental Model

The API is not merely:

```text
Request → Response
```

At SDE-2 level, it is:

```text
Request
  ↓
Policy
  ↓
Validation
  ↓
Business Operation
  ↓
Dependencies
  ↓
Consistency / Resilience
  ↓
Response Contract
  ↓
Observability
  ↓
Testing
  ↓
Operations
```

And the engineering question is no longer:

> "Does this endpoint work?"

It becomes:

> **"Can this endpoint remain correct, observable, testable, secure, resilient, and operable when the system is under real production conditions?"**

**Next:** **Level 08 — KPI 08 — Part 10: Production API Architecture Capstone** — the final integration part for KPI 08.
