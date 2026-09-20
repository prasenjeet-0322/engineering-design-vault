# Level 08 — KPI 07 — Part 07

## Rate Limiting & Request Policies

---

## 1. Part Objective

This part establishes the production mental model for using middleware and request-layer controls to enforce **rate limits, request policies, abuse controls, and traffic admission rules**.

The goal is not merely to know how to write a rate limiter.

The goal is to be able to answer:

> **Given an incoming request, how do we decide whether it should be admitted, delayed, rejected, challenged, redirected, or allowed to continue—and where should that decision be enforced?**

A production request policy must account for:

* identity,
* IP address,
* tenant,
* endpoint,
* HTTP method,
* request cost,
* authentication state,
* geographic or regional context,
* traffic volume,
* concurrency,
* infrastructure topology,
* distributed state,
* failure behavior,
* and application semantics.

The central architecture is:

```text
Incoming Request
       ↓
Request Classification
       ↓
Identity / Client Resolution
       ↓
Policy Selection
       ↓
Rate / Quota Evaluation
       ↓
      ┌───────────────┐
      │               │
   Allowed         Rejected
      │               │
      ↓               ↓
 Continue          429 / Challenge /
 Request           Policy Response
```

---

# 2. Why Rate Limiting Belongs in Request Architecture

Rate limiting is often introduced as:

```text
if requests > limit:
    reject
```

That is insufficient for senior-level architecture.

A real system must answer:

```text
What is being limited?
Who is being limited?
Over what time window?
Where is the state stored?
Who evaluates the limit?
What happens across multiple instances?
What happens when the limiter fails?
What does the client receive?
What traffic is exempt?
What traffic has different costs?
```

Therefore rate limiting is fundamentally a **request policy problem**, not merely a counter problem.

---

# 3. The Core Distinction

Separate these concepts:

```text
Authentication
    ↓
Who is this requester?

Authorization
    ↓
What may this requester do?

Rate Limiting
    ↓
How frequently may this requester perform it?

Quota
    ↓
How much total usage may this requester consume?

Concurrency Control
    ↓
How many operations may be active simultaneously?

Request Policy
    ↓
Under what conditions should this request be admitted?
```

These mechanisms may interact, but they solve different problems.

---

# 4. Rate Limit vs Quota vs Concurrency

## Rate Limit

Controls activity over time.

Example:

```text
100 requests / minute
```

This limits request frequency.

---

## Quota

Controls cumulative consumption.

Example:

```text
10,000 API requests / month
```

A quota may span a much longer period than a rate limit.

---

## Concurrency Limit

Controls simultaneous work.

Example:

```text
Maximum 5 expensive exports running per tenant
```

This protects the system from resource exhaustion caused by long-running operations.

---

## Request Policy

Combines multiple admission rules.

Example:

```text
Authenticated tenant
AND
tenant is active
AND
endpoint is permitted
AND
rate limit not exceeded
AND
concurrency budget available
AND
request size acceptable
```

This is the broader production concept.

---

# 5. What Should Be Rate Limited?

Never automatically assume:

```text
one global request limit
```

Different operations have different costs.

Consider:

```text
GET /products
POST /login
POST /checkout
POST /export
POST /search
POST /password-reset
GET /dashboard
```

These operations have different:

* computational cost,
* database cost,
* security sensitivity,
* abuse potential,
* latency,
* external-service cost.

Therefore the policy should often be endpoint-sensitive.

Example:

```text
GET /products
1000 requests/minute

POST /search
100 requests/minute

POST /login
10 attempts/minute

POST /export
5 requests/hour
```

The numbers are illustrative.

The architectural principle is:

> **Rate limits should reflect resource cost and abuse risk, not merely URL structure.**

---

# 6. Identify the Limiting Subject

The limiter needs a key.

Possible dimensions include:

```text
IP address
User ID
Session ID
API key
Tenant ID
Device identity
Route
Endpoint
Region
Combination of dimensions
```

A naive implementation might use:

```text
rateLimit(IP)
```

But authenticated applications often need:

```text
rateLimit(userId)
```

Multi-tenant systems may need:

```text
rateLimit(tenantId)
```

Public APIs may use:

```text
rateLimit(apiKey)
```

Sensitive authentication endpoints may combine:

```text
IP + account identifier
```

---

# 7. Composite Rate-Limit Keys

A production key can be multidimensional.

For example:

```text
tenantId:userId:route
```

or:

```text
apiKey:endpoint
```

or:

```text
ip:route
```

The key determines the isolation boundary.

Consider:

```text
tenant:A
tenant:B
```

If both tenants share:

```text
global:POST:/search
```

then one tenant can consume another tenant's capacity.

Instead:

```text
tenant:A:POST:/search
tenant:B:POST:/search
```

provides tenant isolation.

---

# 8. Rate Limiting Is Also a Security Boundary

Rate limiting protects against:

* brute-force attacks,
* credential stuffing,
* password-reset abuse,
* scraping,
* API abuse,
* expensive query abuse,
* automated account creation,
* resource exhaustion.

For example:

```text
POST /login
```

should not necessarily use the same policy as:

```text
GET /static/logo.svg
```

The security sensitivity is different.

---

# 9. Rate Limiting Authentication Endpoints

Authentication endpoints deserve special treatment.

Example:

```text
POST /login
```

A policy may consider:

```text
IP
+
account identifier
+
device/session characteristics
```

Why?

Suppose the system only limits by IP:

```text
IP A → 10 attempts/minute
```

An attacker may distribute attempts across many IPs.

If it only limits by account:

```text
user@example.com → 10 attempts/minute
```

an attacker may target many accounts.

Therefore layered policies are often more resilient.

Conceptually:

```text
IP-level protection
        +
Account-level protection
        +
Global infrastructure protection
```

---

# 10. The Distributed-System Problem

A local in-memory limiter appears simple:

```text
Map<Key, Counter>
```

But production infrastructure usually has multiple instances.

```text
             Load Balancer
           /       |       \
          ↓        ↓        ↓
       Server A Server B Server C
          ↓        ↓        ↓
       Counter   Counter   Counter
```

Suppose the limit is:

```text
10 requests/minute
```

and each instance maintains its own counter.

The client sends:

```text
4 → Server A
4 → Server B
4 → Server C
```

The client has effectively performed:

```text
12 requests
```

while each server sees:

```text
4
```

The distributed system has violated the intended global limit.

Therefore:

> **A rate limit is only as globally correct as the state and coordination model behind it.**

---

# 11. Shared Rate-Limit State

Distributed rate limiting often requires shared state.

Conceptually:

```text
                 Application Servers
                  /      |      \
                 ↓       ↓       ↓
                     Shared
                   Limiter State
                        ↓
                  Atomic Update
```

Possible infrastructure includes:

* Redis-like distributed stores,
* edge/provider-native rate limiting,
* gateway/API-management infrastructure,
* database-backed counters for lower-frequency policies.

The exact technology is secondary.

The important questions are:

```text
Is state shared?
Is the update atomic?
What is the consistency model?
What happens during failure?
What is the latency cost?
```

---

# 12. Atomicity Matters

Consider:

```text
current = counter[key]
current += 1
save(counter[key])
```

Two requests can race.

Request A:

```text
read 9
```

Request B:

```text
read 9
```

Both increment:

```text
10
```

The system may record:

```text
10
```

instead of:

```text
11
```

This is a lost update.

Therefore distributed rate limiting generally requires an atomic operation or equivalent coordination.

The principle is:

> **Read-modify-write must be atomic when multiple requests can update the same limiter state concurrently.**

---

# 13. Common Rate-Limiting Algorithms

Several algorithms exist.

## Fixed Window

Example:

```text
00:00–00:59 → 100 requests
01:00–01:59 → 100 requests
```

Simple and inexpensive.

But it has boundary bursts.

A client can send:

```text
100 requests at 00:59
100 requests at 01:00
```

Potentially producing:

```text
200 requests
```

within a very short interval.

---

# 14. Sliding Window

Instead of fixed calendar windows, the system evaluates a moving period.

Example:

```text
last 60 seconds
```

This reduces boundary artifacts.

Tradeoff:

* more state,
* more computation,
* potentially greater implementation complexity.

---

# 15. Token Bucket

Imagine a bucket containing tokens.

```text
Bucket capacity = 100
Refill = 10 tokens/sec
```

Each request consumes tokens.

```text
Request
   ↓
Need token?
   ↓
Yes → consume → allow
No  → reject / delay
```

This naturally supports controlled bursts.

Example:

```text
capacity = 100
refill = 10/sec
```

A client can temporarily burst if tokens accumulated, while long-term traffic is bounded.

---

# 16. Leaky Bucket

Conceptually:

```text
Incoming Requests
       ↓
     Queue
       ↓
Fixed Processing Rate
       ↓
     Backend
```

This smooths traffic.

It is particularly useful when the system wants controlled processing rather than simply rejecting requests.

However, queueing introduces:

* memory usage,
* waiting time,
* queue overflow,
* backpressure complexity.

---

# 17. Rate Limiting vs Queueing

Do not confuse:

```text
rate limiting
```

with:

```text
queueing
```

Rate limiting answers:

> Should this request be admitted?

Queueing answers:

> If admitted, when should this work execute?

A system may combine them:

```text
Admission Control
       ↓
Queue
       ↓
Worker
```

But they solve different problems.

---

# 18. Middleware as an Admission-Control Layer

Middleware is useful because it can evaluate policies before expensive application work.

Conceptually:

```text
Request
   ↓
Middleware
   ↓
Rate Policy
   ↓
Allowed?
   ├── No → 429
   ↓
Application
```

This can prevent unnecessary:

* database work,
* rendering,
* external API calls,
* server action execution,
* application computation.

The closer the rejection is to the traffic edge, the less downstream work is consumed.

---

# 19. But Middleware Is Not Always the Best Location

A rate policy may belong at different layers.

```text
CDN / Edge
    ↓
API Gateway
    ↓
Middleware
    ↓
Application
    ↓
Database
```

Each layer protects a different resource.

For example:

### Edge

Protects:

```text
network / infrastructure / broad traffic
```

### Gateway

Protects:

```text
API surface
```

### Middleware

Protects:

```text
application request routing
```

### Application

Protects:

```text
business operations
```

### Database

Protects:

```text
data-layer resources
```

A mature architecture may use multiple layers.

---

# 20. Layered Request Protection

Example:

```text
Internet
   ↓
Global edge protection
   ↓
IP-level policy
   ↓
Application middleware
   ↓
Authentication
   ↓
Tenant policy
   ↓
Endpoint rate limit
   ↓
Business operation
```

This prevents relying on one mechanism for every failure mode.

---

# 21. The 429 Response

When a request exceeds a rate limit, HTTP commonly uses:

```text
429 Too Many Requests
```

The response communicates:

```text
request understood
but request cannot currently be served due to rate policy
```

A useful response may include:

```text
Retry-After
```

when the server can provide a meaningful retry interval.

The client can then implement:

```text
wait
→ retry
```

instead of:

```text
immediately retry
→ immediately retry
→ immediately retry
```

---

# 22. Why Retry Behavior Matters

Suppose 10,000 clients receive:

```text
429
```

and all retry after exactly:

```text
10 seconds
```

At:

```text
T + 10 seconds
```

the system may receive another synchronized traffic spike.

This is a retry storm.

Therefore clients should often use:

```text
exponential backoff
+
jitter
```

rather than synchronized fixed retries.

---

# 23. Rate Limit Headers

APIs may communicate rate-limit metadata through headers.

Conceptually:

```text
limit
remaining
reset
```

The exact header conventions depend on the API design.

The architectural purpose is:

```text
Server policy
      ↓
Client visibility
      ↓
Better retry behavior
```

Do not make client behavior dependent on undocumented internal implementation details.

---

# 24. Fail-Open vs Fail-Closed

One of the most important production decisions is:

> What happens if the rate-limit infrastructure fails?

Suppose:

```text
Application
    ↓
Rate limiter
    ↓
Redis unavailable
```

Possible behaviors:

### Fail Open

```text
Limiter unavailable
       ↓
Allow request
```

Advantage:

* availability preserved.

Risk:

* abuse protection disappears.

---

### Fail Closed

```text
Limiter unavailable
       ↓
Reject request
```

Advantage:

* protection preserved.

Risk:

* legitimate traffic may be blocked.

There is no universal answer.

The correct decision depends on the protected resource.

---

# 25. Risk-Based Failure Policy

Consider:

```text
GET /public-content
```

Fail-open may be acceptable.

Compare:

```text
POST /password-reset
```

or:

```text
POST /expensive-export
```

A stricter policy may be appropriate.

Therefore:

> **Failure behavior should be determined by the risk and cost of the protected operation.**

---

# 26. Request Cost Is Not Uniform

Suppose:

```text
GET /health
```

costs:

```text
1 unit
```

while:

```text
POST /generate-report
```

costs:

```text
100 units
```

Then:

```text
100 requests/minute
```

is not an equivalent resource policy.

A better abstraction is:

```text
request → cost units → budget
```

Example:

```text
health check = 1
search = 5
report = 50
export = 100
```

The user or tenant receives a budget.

This moves the design from:

```text
request count
```

toward:

```text
resource consumption
```

---

# 27. Tenant-Level Rate Limits

Multi-tenant applications often need tenant-level protection.

Example:

```text
Tenant A → 10,000 units/minute
Tenant B → 2,000 units/minute
Tenant C → 50,000 units/minute
```

This can reflect:

* subscription plan,
* contract,
* resource allocation,
* infrastructure capacity.

But remember:

```text
tenant quota
```

does not replace:

```text
user-level abuse protection
```

A single compromised account could still consume the tenant budget.

Therefore layered policies may look like:

```text
IP
 ↓
User
 ↓
Tenant
 ↓
Endpoint
 ↓
Global infrastructure
```

---

# 28. Fairness vs Efficiency

Rate limiting is partly a resource-allocation problem.

Suppose one tenant generates:

```text
90% of all traffic
```

and other tenants generate:

```text
10%
```

A global limiter may protect the infrastructure but provide poor fairness.

Tenant-aware limits can enforce:

```text
fair-share allocation
```

This is especially important for SaaS platforms.

---

# 29. Burst Capacity

A good policy should distinguish:

```text
steady-state rate
```

from:

```text
short-term burst
```

For example:

```text
10 requests/sec
burst capacity = 50
```

This means a client may temporarily exceed the steady-state rate without immediately being rejected.

This is useful because legitimate traffic is often bursty.

Examples:

* page navigation,
* dashboard loading,
* application startup,
* batch interactions.

---

# 30. Avoiding False Positives

A naive IP-based limiter can punish legitimate users.

Examples:

```text
Corporate NAT
University network
Mobile carrier
Public Wi-Fi
```

Hundreds or thousands of legitimate users may share one public IP.

Therefore:

```text
IP == person
```

is often false.

IP-based limits are useful, but should not automatically be treated as precise user identity.

---

# 31. IPv6 and Address Identity

Address-based policies must account for modern network behavior.

Potential issues include:

* IPv6 addressing,
* rotating client addresses,
* proxies,
* NAT,
* carrier networks,
* load balancers.

Therefore the system must understand:

```text
Observed IP
        ↓
Trusted proxy chain
        ↓
Canonical client identity
```

Do not blindly trust an arbitrary forwarded header.

---

# 32. Trusted Proxy Configuration

A request may contain headers representing the originating address.

But if an attacker can directly supply:

```text
X-Forwarded-For
```

the value may be spoofed.

The application should only trust forwarding metadata when the infrastructure topology guarantees that the header was inserted or sanitized by a trusted proxy.

The security model is:

```text
Trusted infrastructure
       ↓
canonical client identity
       ↓
rate-limit key
```

not:

```text
arbitrary client header
       ↓
rate-limit key
```

---

# 33. Route-Specific Policies

Different routes can have different policies.

Example:

```text
/public
    generous

/search
    moderate

/login
    strict

/password-reset
    strict

/export
    very strict

/internal-webhook
    authenticated policy
```

This is more realistic than:

```text
all routes → 100 requests/minute
```

---

# 34. HTTP Method Matters

The same path may represent different operations.

Example:

```text
GET /orders
POST /orders
DELETE /orders/:id
```

These should not necessarily share one policy.

A policy key may include:

```text
HTTP method + route
```

Example:

```text
POST:/orders
GET:/orders
DELETE:/orders/:id
```

This aligns request policy with operation semantics.

---

# 35. Authentication State Matters

A request policy may distinguish:

```text
anonymous
authenticated
privileged
service-to-service
```

Example:

```text
Anonymous search:
100/minute

Authenticated search:
500/minute

Enterprise API key:
5000/minute
```

This demonstrates why policy selection should happen after enough request context has been established.

---

# 36. Policy Evaluation Ordering

The order of checks matters.

A possible request flow:

```text
Request
   ↓
Normalize request
   ↓
Identify client
   ↓
Resolve tenant
   ↓
Resolve authentication
   ↓
Classify route
   ↓
Select policy
   ↓
Check rate limit
   ↓
Check authorization
   ↓
Execute application
```

But the exact ordering may differ.

For example, expensive identity resolution should not always happen before a cheap global abuse check.

Therefore:

> **Policy ordering should optimize both security and resource consumption.**

---

# 37. Cheap Checks Before Expensive Checks

Suppose:

```text
IP-level global protection
```

is extremely cheap.

And:

```text
database-backed tenant resolution
```

is expensive.

Then:

```text
cheap rejection
      ↓
expensive resolution
```

may be preferable.

This is an admission-control principle:

> Reject obviously unacceptable traffic as early and cheaply as practical.

---

# 38. Middleware Matcher Design

Middleware should not necessarily run for every resource.

Avoid unnecessarily processing:

```text
static assets
favicon
images
internal framework resources
```

when they do not require the policy.

Instead define an appropriate matcher scope.

Conceptually:

```text
Protected application routes
        ↓
Middleware
```

rather than:

```text
Every request
        ↓
Expensive policy resolution
```

This reduces:

* CPU usage,
* latency,
* policy-store traffic,
* accidental interference.

---

# 39. Rate Limiting Static Assets

Static assets may still need infrastructure-level protection, but application middleware is not necessarily the right place.

For example:

```text
images
CSS
JS
fonts
```

may be better protected by:

```text
CDN / edge caching / edge traffic controls
```

while:

```text
POST /api/export
```

belongs to application/API policy.

This is a layer-selection problem.

---

# 40. Request Body Size Policies

Rate limiting is only one request policy.

Another is:

```text
maximum request body size
```

For example:

```text
JSON API → 1 MB
file upload → 20 MB
internal batch → 100 MB
```

Rejecting oversized requests early prevents expensive processing.

The broader pattern is:

```text
Request Policy
├── Rate
├── Size
├── Method
├── Origin
├── Content type
├── Authentication
├── Tenant
├── Concurrency
└── Resource cost
```

---

# 41. Method Restrictions

A route may only support:

```text
GET
POST
```

A request using:

```text
DELETE
```

should not reach the business logic.

Request policy can therefore include:

```text
allowed methods
```

This should complement—not replace—application-level validation.

---

# 42. Content-Type Policies

An endpoint expecting JSON should not blindly accept:

```text
multipart/form-data
text/plain
application/octet-stream
```

unless intentionally supported.

Request policy can reject incompatible representations early.

This reduces:

* parsing work,
* attack surface,
* unexpected execution paths.

---

# 43. Origin and Cross-Site Request Policies

Depending on the architecture, request policy may evaluate:

* Origin,
* Referer,
* CORS context,
* CSRF protections,
* trusted application origins.

However:

```text
Origin check
```

is not equivalent to:

```text
authentication
```

and:

```text
CORS
```

is not an authorization mechanism.

These controls should remain conceptually separate.

---

# 44. Abuse Detection vs Rate Limiting

Rate limiting is deterministic.

Example:

```text
> 100 requests/minute
→ reject
```

Abuse detection can be behavioral.

Example:

```text
many failed logins
+
many accounts
+
rapid IP rotation
+
suspicious request pattern
```

→ stronger policy.

Therefore:

```text
Rate Limiting
```

can be one signal inside a broader:

```text
Abuse Prevention System
```

---

# 45. Request Policy State Machine

A useful model:

```text
                ┌─────────────┐
                │   Request   │
                └──────┬──────┘
                       ↓
                ┌─────────────┐
                │ Classifying │
                └──────┬──────┘
                       ↓
                ┌─────────────┐
                │ Policy      │
                │ Selection   │
                └──────┬──────┘
                       ↓
                ┌─────────────┐
                │ Evaluation  │
                └──────┬──────┘
                  ┌────┴────┐
                  ↓         ↓
               Allow      Deny
                  ↓         ↓
             Application   429/
                          403/etc.
```

The key is that:

```text
policy selection
```

and:

```text
policy evaluation
```

are separate concepts.

---

# 46. Policy Configuration vs Policy Engine

Avoid embedding every policy directly into middleware code.

Bad architecture:

```text
if route === "/login":
    if count > 10:
       ...
elif route === "/search":
    if count > 100:
       ...
```

This becomes difficult to evolve.

Prefer:

```text
Request
   ↓
Policy Resolver
   ↓
Policy Definition
   ↓
Rate Evaluator
   ↓
Decision
```

Example conceptual policy:

```text
Policy:
    route: POST /login
    subject: IP + account
    limit: 10
    window: 60s
    failure: reject
```

---

# 47. Policy as Data

Policies can often be represented as configuration:

```text
{
  route,
  method,
  subject,
  limit,
  window,
  burst,
  cost,
  failureMode
}
```

This allows:

* central management,
* testing,
* auditing,
* controlled rollout,
* plan-based policies.

But dynamic configuration introduces its own concerns:

* stale configuration,
* synchronization,
* invalid configuration,
* configuration security.

---

# 48. Dynamic Policy Changes

Suppose a tenant changes plan:

```text
Starter → Enterprise
```

The rate policy may change:

```text
100/min → 5000/min
```

Questions arise:

```text
How quickly does the new policy propagate?
What happens to existing counters?
Does the new policy apply immediately?
What happens during partial propagation?
```

This is a distributed configuration problem.

---

# 49. Rate Limiter Clock Semantics

Time-window algorithms depend on time.

Distributed servers may have small clock differences.

Therefore distributed systems should avoid assuming:

```text
every server has perfectly identical time
```

The implementation should use a consistent time source or an algorithm/infrastructure designed to tolerate clock differences.

This becomes particularly important for:

* fixed windows,
* sliding windows,
* token refill calculations.

---

# 50. Rate Limiting and Caching

Caching can reduce origin load.

But caching can also change the meaning of request counts.

Suppose:

```text
GET /products
```

is served entirely from the CDN.

Then the application middleware may never see the request.

Therefore:

```text
application rate limit
```

may not represent:

```text
actual edge traffic
```

This is another reason to place policies at the appropriate infrastructure layer.

---

# 51. Rate Limiting and Authentication Caching

Suppose authentication state is cached incorrectly.

Then the rate-limit subject might be wrong.

For example:

```text
User A
```

could accidentally inherit:

```text
User B's cache-derived identity
```

A security-sensitive cache must therefore include the relevant identity dimensions or avoid caching personalized policy decisions entirely.

---

# 52. Rate Limiting and Multi-Tenant Routing

The request flow can become:

```text
Request
   ↓
Host
   ↓
Tenant
   ↓
Authentication
   ↓
Route
   ↓
Policy
   ↓
Rate Limit
```

A key might be:

```text
tenantId:userId:method:route
```

This prevents policies from unintentionally crossing tenant boundaries.

The isolation invariant is:

> **Traffic from one tenant must not consume another tenant's tenant-scoped policy budget unless explicitly intended.**

---

# 53. Tenant + Plan-Based Policies

A SaaS system might define:

```text
Starter:
    100 requests/minute

Business:
    1,000 requests/minute

Enterprise:
    custom
```

But do not treat the plan as the only protection.

You may still require:

```text
per-user limit
per-IP limit
per-endpoint limit
tenant global limit
```

The plan determines capacity.

The abuse controls determine safety.

---

# 54. Background Jobs Are Different

Do not automatically apply HTTP request limits to background jobs.

For example:

```text
HTTP request
   ↓
enqueue export
```

The HTTP request may be rate-limited.

But the worker processing the export needs:

```text
concurrency limit
queue depth
worker capacity
tenant fairness
job quotas
```

Thus:

```text
HTTP admission
```

and:

```text
work execution policy
```

are related but distinct.

---

# 55. Server Actions and Request Policies

Server Actions represent server-side mutations invoked from the application UI.

They still need:

```text
authentication
authorization
validation
abuse protection
```

A user should not assume:

```text
Server Action
```

means:

```text
trusted request
```

The server must treat the invocation as an untrusted request boundary.

---

# 56. API vs Browser Navigation

A rate-limited browser page may receive:

```text
429
```

while an API client may receive:

```text
429 JSON response
```

Do not blindly redirect API traffic to an HTML page.

For example:

```text
POST /api/search
```

should not become:

```text
302 → /login
```

merely because some request policy failed.

The response contract should match the client type.

---

# 57. Rate Limit Response Design

A useful API response might conceptually contain:

```text
status: 429

{
  "error": "rate_limit_exceeded",
  "retryAfter": 12
}
```

The exact schema depends on the API contract.

Important properties:

* machine-readable error identity,
* retry guidance when available,
* no sensitive internal information.

Avoid exposing:

```text
internal limiter keys
Redis identifiers
tenant infrastructure details
```

---

# 58. Avoid Information Leakage

Consider:

```text
"User A has exceeded their tenant quota."
```

This may expose account information in contexts where the requester is not authorized to know it.

Request policy responses should reveal only information appropriate to the requester's security context.

---

# 59. Observability

A rate limiter that simply returns:

```text
429
```

is difficult to operate.

Useful telemetry includes:

```text
policy_id
route
method
tenant
subject type
decision
limit
remaining
retry duration
region
limiter latency
limiter errors
```

Do not necessarily log raw sensitive identifiers.

Use safe identifiers or hashes where appropriate.

---

# 60. Important Metrics

Track:

### Request volume

```text
requests/sec
```

### Rejection rate

```text
429/sec
```

### Policy distribution

```text
requests by policy
```

### Limiter latency

```text
p50
p95
p99
```

### Limiter failures

```text
error rate
timeout rate
```

### Hot keys

Identify subjects consuming disproportionate capacity.

---

# 61. The 429 Rate Alone Is Not Enough

A high 429 rate could mean:

```text
attack
```

or:

```text
legitimate traffic exceeds incorrectly configured capacity
```

or:

```text
a client has a retry bug
```

or:

```text
a new deployment changed request volume
```

Therefore observability must connect:

```text
policy
+
request volume
+
client
+
route
+
deployment
+
infrastructure
```

---

# 62. Correlation IDs

When debugging a rejected request, connect:

```text
incoming request
      ↓
policy evaluation
      ↓
limiter state
      ↓
response
```

using a request/correlation identifier.

This helps answer:

> Why was this particular request rejected?

---

# 63. Debugging Matrix

When legitimate requests receive `429`, investigate:

```text
Wrong client identity?
Wrong proxy configuration?
Wrong tenant?
Wrong route normalization?
Wrong policy?
Shared IP?
Counter corruption?
Clock issue?
Distributed state lag?
Retry storm?
Incorrect cache?
Configuration propagation?
```

Do not immediately increase the limit.

First determine whether the policy decision is correct.

---

# 64. Route Normalization Matters

Suppose the application treats:

```text
/products/123
/products/456
/products/789
```

as the same route pattern:

```text
/products/:id
```

If the limiter keys directly on the raw URL, it may create huge cardinality.

Instead use a normalized route identity where appropriate:

```text
GET:/products/:id
```

This produces a stable policy dimension.

---

# 65. Query Parameters and Rate Limits

Consider:

```text
/search?q=apple
/search?q=banana
/search?q=orange
```

Should these count as:

```text
one endpoint
```

or:

```text
three independent resources
```

Usually the policy concerns:

```text
/search
```

rather than every query string.

However, query-specific resource costs may sometimes matter.

The key must therefore be designed deliberately.

---

# 66. Cardinality Explosion

A dangerous key might be:

```text
IP:user:tenant:route:query:device:locale
```

This can create enormous key cardinality.

Consequences:

* memory growth,
* distributed-store pressure,
* poor cache locality,
* operational complexity.

The goal is not maximum dimensions.

The goal is:

> **Minimum dimensions necessary to represent the policy boundary.**

---

# 67. Policy Hierarchies

A production system may have:

```text
Global limit
    ↓
IP limit
    ↓
Tenant limit
    ↓
User limit
    ↓
Endpoint limit
    ↓
Operation-specific cost limit
```

A request can pass one policy and fail another.

Example:

```text
IP budget:       allowed
Tenant budget:   allowed
User budget:     allowed
Endpoint budget: rejected
```

Final result:

```text
429
```

---

# 68. Which Limit Should Be Checked First?

A practical strategy is:

```text
cheapest / broadest
        ↓
more specific
        ↓
more expensive
```

For example:

```text
global edge protection
    ↓
IP protection
    ↓
tenant lookup
    ↓
user policy
    ↓
expensive endpoint policy
```

But if a later check is significantly more security-critical, ordering may change.

The architecture should document the reasoning.

---

# 69. Race Conditions at the Limit Boundary

Suppose:

```text
limit = 100
remaining = 1
```

Two requests arrive concurrently.

Both see:

```text
remaining = 1
```

If the check and increment are not atomic, both may pass.

Result:

```text
101 requests
```

This is another reason atomic admission matters.

---

# 70. Distributed Limit Accuracy

Not every system needs mathematically perfect global enforcement.

There is a tradeoff between:

```text
strict global accuracy
```

and:

```text
availability + latency + simplicity
```

A high-volume public system may intentionally tolerate small enforcement variance.

A security-sensitive authentication system may require stricter controls.

Therefore:

> **Rate-limit precision should be proportional to the consequence of exceeding the limit.**

---

# 71. Local + Global Limiting

A hybrid design can reduce latency.

Conceptually:

```text
Local fast check
       ↓
Global shared check
       ↓
Decision
```

or use:

```text
edge limit
+
application limit
```

This can reduce load on centralized state.

But it introduces another architectural question:

```text
What happens when local and global counters disagree?
```

Again, exactness vs efficiency must be explicit.

---

# 72. Protecting the Limiter Itself

The limiter can become a bottleneck.

Suppose:

```text
100,000 requests/sec
```

and every request performs:

```text
remote limiter operation
```

The limiter infrastructure itself now receives:

```text
100,000 operations/sec
```

Therefore request-policy architecture must consider:

* latency,
* throughput,
* connection pooling,
* key distribution,
* hot keys,
* storage capacity,
* regional topology.

---

# 73. Hot Keys

Suppose one tenant becomes extremely active:

```text
tenant:enterprise-A
```

All traffic updates one logical limiter key.

This can create a hot key.

The problem is not only total traffic.

It is concentrated traffic against one piece of state.

Potential mitigations include:

* hierarchical limits,
* sharded state,
* edge enforcement,
* local admission controls,
* workload-specific concurrency controls.

---

# 74. Regional Rate Limiting

Consider:

```text
US region
EU region
APAC region
```

If each region independently enforces:

```text
1000 requests/minute
```

the effective global capacity could become:

```text
3000/minute
```

unless that is intentional.

A global limit requires a global coordination model.

But globally shared state can increase:

* latency,
* cross-region traffic,
* failure coupling.

This is a classic distributed-systems tradeoff.

---

# 75. Region-Local vs Global Policy

### Region-local

Advantages:

* low latency,
* high availability,
* regional independence.

Disadvantage:

* weaker global enforcement.

### Globally coordinated

Advantages:

* stronger global correctness.

Disadvantages:

* coordination latency,
* cross-region dependency,
* larger failure domain.

Choose according to policy requirements.

---

# 76. Backpressure

When the system is overloaded, simply allowing every request until downstream failure is poor architecture.

A better model:

```text
Traffic
  ↓
Admission Control
  ↓
Capacity
  ↓
Queue / Work
```

Backpressure prevents the system from accepting work it cannot safely process.

This is broader than rate limiting.

---

# 77. Rate Limiting vs Circuit Breaking

Rate limiting controls:

```text
incoming request volume
```

Circuit breaking controls:

```text
calls to an unhealthy dependency
```

Example:

```text
Application
    ↓
Payment Service
```

If payment is failing:

```text
Circuit Breaker
    ↓
stop sending requests
```

A rate limiter would not solve the same problem.

---

# 78. Rate Limiting vs Retry Policy

Rate limiting says:

```text
you may not send more right now
```

Retry policy says:

```text
when/how should the client try again?
```

The two must work together.

A server returning:

```text
429
```

without retry guidance can lead to poor client behavior.

---

# 79. Request Policy Composition

A mature policy can be modeled as:

```text
Request
  │
  ├── Method allowed?
  │
  ├── Request size allowed?
  │
  ├── Client identity valid?
  │
  ├── Tenant active?
  │
  ├── Authentication state valid?
  │
  ├── Route allowed?
  │
  ├── Rate budget available?
  │
  ├── Concurrency available?
  │
  └── Resource cost acceptable?
       │
       ↓
    Admission
```

This is the broader request-policy architecture.

---

# 80. Security Invariant

A useful production invariant is:

> **No request may consume protected application resources without first passing the request policies applicable to that resource.**

This does not mean every policy must execute in middleware.

It means the architecture must have a clearly defined enforcement point.

---

# 81. Common Anti-Patterns

## Anti-Pattern 1 — One Global Limit

```text
100 requests/minute for everything
```

Problem:

* ignores resource cost,
* poor UX,
* poor abuse modeling.

---

## Anti-Pattern 2 — IP Is Identity

```text
rateLimit(IP)
```

Problem:

* shared networks,
* proxies,
* mobile carriers,
* attackers rotating IPs.

---

## Anti-Pattern 3 — In-Memory Limiter in Multi-Instance Production

```text
Map()
```

per server.

Problem:

* inconsistent global enforcement.

---

## Anti-Pattern 4 — Non-Atomic Counter Updates

```text
read
increment
write
```

Problem:

* race conditions.

---

## Anti-Pattern 5 — Blindly Trusting Forwarded IP

Problem:

* spoofing,
* incorrect limiter keys.

---

## Anti-Pattern 6 — Middleware on Everything

Problem:

* unnecessary latency,
* static asset overhead,
* infrastructure traffic mixed with application traffic.

---

## Anti-Pattern 7 — Redirecting Rate-Limited APIs

Problem:

```text
API → HTML login page
```

instead of a machine-readable:

```text
429
```

---

## Anti-Pattern 8 — Ignoring Limiter Failure

Problem:

```text
limiter unavailable
```

becomes an undefined production behavior.

---

## Anti-Pattern 9 — Unlimited Retries

```text
429
→ retry immediately
→ retry immediately
→ retry immediately
```

Problem:

* retry storm.

---

## Anti-Pattern 10 — Excessive Key Dimensions

Problem:

* cardinality explosion,
* expensive distributed state.

---

# 82. Production Request Flow

A mature architecture may look like:

```text
                    Incoming Request
                           ↓
                  Request Normalization
                           ↓
                   Cheap Edge Checks
                           ↓
                  Client Identification
                           ↓
                     Tenant Resolution
                           ↓
                  Authentication State
                           ↓
                     Route Matching
                           ↓
                    Policy Selection
                           ↓
             ┌─────────────┴─────────────┐
             ↓                           ↓
       Policy Allowed              Policy Denied
             ↓                           ↓
       Rate Evaluation                 429
             ↓
       Concurrency Check
             ↓
       Authorization
             ↓
       Application Work
             ↓
          Response
```

The exact ordering can vary by system.

The important point is that request admission is deliberate.

---

# 83. Production Scenario — Brute-Force Login

Requirement:

```text
Protect login from automated attacks.
```

Potential architecture:

```text
IP-level protection
        ↓
Account-level protection
        ↓
Authentication attempt
        ↓
Failure tracking
        ↓
Stronger challenge / temporary denial
```

Questions:

* What identifies the client?
* How are shared IPs handled?
* How are distributed attacks handled?
* What happens after repeated failures?
* How are legitimate users protected from lockout abuse?

This is an abuse-control problem, not merely a counter.

---

# 84. Production Scenario — Expensive Export

Requirement:

```text
POST /reports/export
```

is computationally expensive.

A better policy may be:

```text
per-user rate limit
+
per-tenant concurrency limit
+
queue
+
maximum export size
```

Architecture:

```text
Request
   ↓
Rate policy
   ↓
Concurrency policy
   ↓
Queue
   ↓
Worker
```

This demonstrates why rate limiting alone may not protect an expensive workload.

---

# 85. Production Scenario — SaaS Search API

Requirement:

```text
Every tenant receives fair access.
```

Possible policy:

```text
Global infrastructure limit
        ↓
Tenant budget
        ↓
User budget
        ↓
Search endpoint limit
        ↓
Query cost
```

A large enterprise tenant can receive more capacity without allowing a single user to monopolize it.

---

# 86. Production Scenario — Public API

Requirement:

```text
API keys receive controlled usage.
```

Possible identity:

```text
API key
```

Possible policy:

```text
API key → tenant → endpoint → cost
```

The API key should not itself be treated as proof of unlimited authorization.

It is simply one identity credential used by the policy system.

---

# 87. Production Scenario — Traffic Spike

Suppose:

```text
normal = 10k req/s
spike = 100k req/s
```

A mature system may respond:

```text
Edge admission control
        ↓
Cache hits
        ↓
Application rate limits
        ↓
Selective rejection
        ↓
Origin remains within capacity
```

The goal is not:

```text
serve every request
```

at any cost.

The goal is:

```text
protect system integrity while serving acceptable traffic
```

---

# 88. Prediction Challenge 1

### Scenario

Three application instances each maintain an in-memory counter:

```text
limit = 100/minute
```

A client distributes requests evenly across all three instances.

### Predict

Can the system reliably enforce a global limit of 100 requests/minute?

### Expected reasoning

No.

Each instance has independent state.

The effective aggregate allowance can approach:

```text
300 requests/minute
```

depending on routing and implementation.

### Lesson

Distributed enforcement requires shared or coordinated state.

---

# 89. Prediction Challenge 2

### Scenario

A client receives:

```text
429
Retry-After: 10
```

One million clients all retry exactly 10 seconds later.

### Predict

What happens?

### Expected reasoning

A synchronized retry spike can recreate the original overload.

### Lesson

Rate limiting should be paired with resilient retry semantics such as backoff and jitter.

---

# 90. Prediction Challenge 3

### Scenario

A limiter uses:

```text
IP address
```

as the only identity.

Ten thousand users are behind one corporate NAT.

### Predict

What can happen?

### Expected reasoning

Legitimate users may share one budget and trigger each other's limits.

### Lesson

IP is a network identity, not necessarily a user identity.

---

# 91. Prediction Challenge 4

### Scenario

The rate limiter fails closed for every endpoint.

The limiter experiences a 30-second outage.

### Predict

What happens?

### Expected reasoning

The application may become broadly unavailable even though the application itself is healthy.

### Lesson

Failure mode must reflect the criticality of the protected resource.

---

# 92. Prediction Challenge 5

### Scenario

A CDN serves cached responses for:

```text
GET /products
```

The application middleware contains the rate limiter.

### Predict

Does the middleware necessarily see every product request?

### Expected reasoning

No.

Requests served before reaching the application may bypass application middleware.

### Lesson

Enforcement location determines what traffic the policy actually observes.

---

# 93. SDE-2 Interview Questions

### Q1

Why is an in-memory rate limiter unreliable in a horizontally scaled application?

### Q2

How would you choose between fixed window, sliding window, and token bucket?

### Q3

How would you design rate limiting for a multi-tenant SaaS platform?

### Q4

What should happen if the rate-limit store becomes unavailable?

### Q5

Why is IP-based rate limiting insufficient for authenticated applications?

### Q6

How do you prevent race conditions in distributed counters?

### Q7

Where would you enforce rate limits: CDN, gateway, middleware, or application?

### Q8

How would you protect an expensive export endpoint?

### Q9

What is the difference between rate limiting, quota, concurrency limiting, and backpressure?

### Q10

How can retry behavior make a rate-limiting system worse?

### Q11

How would you prevent one tenant from consuming another tenant's capacity?

### Q12

How would you design rate limits across multiple regions?

### Q13

How would you debug unexpected 429 responses?

### Q14

What request properties should form a rate-limit key?

### Q15

What happens if the rate limiter's state becomes stale or inconsistent?

---

# 94. Senior-Level Design Exercise

Design request protection for:

```text
Multi-tenant SaaS
```

Requirements:

```text
1. Public landing pages
2. Authenticated dashboards
3. Search API
4. Login endpoint
5. Password reset
6. Expensive exports
7. Server Actions
8. Multiple application instances
9. Multiple regions
10. CDN caching
```

You should be able to produce:

```text
Layer
   ↓
Identity
   ↓
Policy
   ↓
State
   ↓
Algorithm
   ↓
Failure behavior
   ↓
Response
   ↓
Observability
```

for every major traffic class.

---

# 95. Architecture Decision Framework

For every rate-limited resource, answer:

## 1. What resource am I protecting?

```text
CPU?
DB?
API dependency?
Queue?
Authentication system?
Tenant capacity?
```

## 2. Who should share the budget?

```text
IP?
User?
Tenant?
API key?
Global?
```

## 3. How much burst is acceptable?

```text
None?
Small?
Large?
```

## 4. How accurate must the limit be?

```text
Approximate?
Strong?
Globally coordinated?
```

## 5. Where should enforcement occur?

```text
Edge?
Gateway?
Middleware?
Application?
Worker?
```

## 6. What happens when the limiter fails?

```text
Open?
Closed?
Degraded?
```

## 7. How does the client recover?

```text
Retry-After?
Backoff?
Jitter?
No retry?
```

## 8. How will operators understand the decision?

```text
Metrics?
Logs?
Tracing?
Policy identifiers?
```

---

# 96. The Core Mental Model

Do not memorize:

```text
"Use Redis for rate limiting."
```

Instead remember:

```text
Resource
   ↓
Identity
   ↓
Policy
   ↓
State
   ↓
Atomic Admission
   ↓
Decision
   ↓
Response
   ↓
Observability
```

Technology follows the architecture.

---

# 97. The Most Important Distinctions

| Concept         | Question                                        |
| --------------- | ----------------------------------------------- |
| Authentication  | Who is requesting?                              |
| Authorization   | What may they do?                               |
| Rate limit      | How frequently may they request?                |
| Quota           | How much may they consume overall?              |
| Concurrency     | How much simultaneous work is allowed?          |
| Backpressure    | How do we prevent overload propagation?         |
| Circuit breaker | Should we stop calling an unhealthy dependency? |
| Request policy  | Should this request be admitted at all?         |

A senior engineer must keep these boundaries clear.

---

# 98. KPI 07 Integration Model So Far

The routing/middleware architecture now builds progressively:

```text
Part 01
Middleware Mental Model
        ↓
Part 02
Request Matching & Execution
        ↓
Part 03
Redirects & Rewrites
        ↓
Part 04
Authentication-Aware Routing
        ↓
Part 05
Authorization Boundaries & Security
        ↓
Part 06
Multi-Tenant / Locale / Host Routing
        ↓
Part 07
Rate Limiting & Request Policies
```

The system has progressed from:

```text
Where does the request go?
```

to:

```text
Who is requesting?
```

to:

```text
Which tenant/context applies?
```

to:

```text
Should this request be admitted at all?
```

---

# 99. Part Boundary

This part covers:

* rate limiting,
* request admission,
* request policies,
* rate-limit identities,
* distributed limiter state,
* limiter algorithms,
* burst handling,
* quotas,
* concurrency concepts,
* layered protection,
* failure modes,
* 429 behavior,
* tenant policies,
* abuse controls,
* policy selection,
* request-policy observability,
* middleware placement,
* production architecture.

This part does **not** deeply cover:

* middleware performance engineering,
* runtime constraints,
* middleware execution-cost optimization,
* edge-vs-node runtime implementation details,
* middleware caching interactions,
* rendering integration,
* end-to-end middleware performance architecture.

Those belong to subsequent parts.

---

# 100. Completion Criteria

You have completed this part when you can independently explain and design:

* [ ] Why rate limiting is a request-admission problem
* [ ] Rate limit vs quota vs concurrency
* [ ] How to select the limiting identity
* [ ] Composite rate-limit keys
* [ ] IP vs user vs tenant vs API-key limits
* [ ] Fixed-window limiting
* [ ] Sliding-window limiting
* [ ] Token-bucket limiting
* [ ] Leaky-bucket concepts
* [ ] Distributed limiter state
* [ ] Atomic counter updates
* [ ] Burst capacity
* [ ] 429 responses
* [ ] Retry behavior
* [ ] Retry storms
* [ ] Fail-open vs fail-closed
* [ ] Layered request protection
* [ ] Tenant-aware rate limiting
* [ ] Endpoint-specific policies
* [ ] Request-cost-based policies
* [ ] Middleware matcher scope
* [ ] Trusted proxy considerations
* [ ] CDN vs middleware enforcement
* [ ] Policy selection vs policy evaluation
* [ ] Limiter observability
* [ ] Hot keys
* [ ] Regional rate limiting
* [ ] Policy configuration
* [ ] Request normalization
* [ ] Debugging unexpected 429s
* [ ] Designing production request admission control

---

# 101. Executive Cheat Sheet

```text
RATE LIMITING

Protect:
    resource

Identify:
    subject

Define:
    budget

Choose:
    algorithm

Coordinate:
    distributed state

Enforce:
    appropriate layer

Handle:
    bursts

Decide:
    fail-open / fail-closed

Respond:
    429 + retry semantics

Observe:
    policy + decision + latency + failures

Validate:
    tenant/user isolation

Remember:
    IP ≠ user
    rate ≠ quota
    rate ≠ concurrency
    middleware ≠ entire security boundary
```

The governing principle is:

> **Request policy is an admission-control system: identify the requester and resource, evaluate the applicable budget and constraints at the appropriate enforcement layer, and make a deliberate allow/reject decision before unnecessary downstream work is consumed.**
