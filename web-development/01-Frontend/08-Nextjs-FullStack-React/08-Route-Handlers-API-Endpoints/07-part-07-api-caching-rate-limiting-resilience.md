# Level 08 — KPI 08 — Part 07: API Caching, Rate Limiting & Resilience

## 1. Part Objective

This part establishes how production APIs control **load, latency, repeated work, dependency pressure, and failure propagation**.

The governing question is:

> **How does an API remain correct and available when traffic increases, clients repeat requests, dependencies slow down, or parts of the system fail?**

The architecture expands from:

```text
Request
  ↓
Validate
  ↓
Authenticate
  ↓
Authorize
  ↓
Execute
  ↓
Response
```

into:

```text
Request
  ↓
Admission Control
  ↓
Authentication / Authorization
  ↓
Cache Decision
  ↓
Application Execution
  ↓
Dependency Protection
  ↓
Response
```

The major mechanisms are:

```text
Caching
Rate Limiting
Quotas
Timeouts
Retries
Backpressure
Concurrency Limits
Circuit Breaking
Load Shedding
Graceful Degradation
```

These mechanisms solve different problems and must not be treated as interchangeable.

---

# 2. Why API Resilience Matters

A healthy system may look like:

```text
Client
  ↓
API
  ↓
Database
```

But a production API often looks more like:

```text
Client
   ↓
CDN / Gateway
   ↓
API
   ↓
Cache
   ↓
Database
   ↓
External APIs
   ↓
Queues / Workers
```

Every additional dependency introduces another failure surface.

A single slow dependency can therefore affect the entire request path.

---

# 3. The Failure Amplification Problem

Suppose one API request performs:

```text
1 database query
2 external API calls
```

At:

```text
100 requests/sec
```

the external dependency may receive:

```text
200 calls/sec
```

If another layer retries twice:

```text
100 × 2 × 3
= 600 dependency calls/sec
```

This is why resilience architecture must consider **amplification**.

---

# 4. Caching

Caching answers:

> **Can this result be reused instead of recomputed or refetched?**

Conceptually:

```text
Request
  ↓
Cache Lookup
  ↓
┌───────────────┐
│ Cache Hit?    │
└───────┬───────┘
        │
   yes  │  no
    ↓   │   ↓
 return │ execute
        │   ↓
        │ store
        │   ↓
        └→ return
```

Caching primarily reduces:

```text
latency
origin load
database load
dependency calls
cost
```

---

# 5. API Cache vs Application Cache

There can be multiple cache layers:

```text
Browser Cache
     ↓
CDN Cache
     ↓
API Response Cache
     ↓
Application/Data Cache
     ↓
Database
```

These layers have different:

```text
ownership
TTL
invalidation
security
cache keys
consistency
```

A cache hit at one layer may mean the request never reaches the application.

---

# 6. Cacheability Is a Correctness Question

Do not ask only:

> "Can we cache this endpoint?"

Ask:

> **What determines the response representation?**

Potential dimensions include:

```text
URL
query parameters
headers
locale
tenant
authentication
authorization
feature flags
request body
resource version
```

If these dimensions affect the response, they may need to influence cache identity or prevent shared caching.

---

# 7. Personalized API Responses

Consider:

```http
GET /api/profile
```

User A receives:

```json
{
  "name": "Alice"
}
```

User B receives:

```json
{
  "name": "Bob"
}
```

A shared cache keyed only by:

```text
/api/profile
```

would be catastrophic.

The cache identity must account for the representation's personalization—or the response must not be shared.

---

# 8. Tenant-Aware Caching

Consider:

```text
tenant-a.example.com/api/products
tenant-b.example.com/api/products
```

If both resolve to:

```text
/api/products
```

at the cache layer, tenant data can collide.

A conceptual cache identity might be:

```text
tenantId + route + query + representation context
```

The exact implementation depends on where the cache exists.

---

# 9. Cache-Control

HTTP caching can communicate:

```text
public
private
max-age
s-maxage
no-store
no-cache
must-revalidate
```

The important distinction:

```text
private
→ response is associated with one user/browser context

public
→ response may be shared
```

Never make a response publicly cacheable merely because it is technically a `GET`.

---

# 10. `no-cache` vs `no-store`

These are frequently confused.

Conceptually:

```text
no-store
→ do not store the response

no-cache
→ response may be stored but must be revalidated before reuse
```

The exact caching behavior also depends on the cache implementation and other directives.

---

# 11. TTL

A TTL answers:

> **How long may this cached representation remain valid before expiration?**

Example:

```text
product catalog
→ 60 seconds

marketing content
→ 10 minutes

static configuration
→ longer
```

TTL is a freshness policy.

It is not automatically a correctness mechanism.

---

# 12. Invalidation

A cache can also be invalidated when underlying state changes.

Conceptually:

```text
Mutation
   ↓
Database Commit
   ↓
Invalidate affected cache
   ↓
Future request regenerates representation
```

This connects directly to the cache dependency architecture established in KPI 06.

---

# 13. Cache Key Design

A cache key should contain every representation-affecting dimension.

Too little:

```text
/products
```

when the response depends on:

```text
tenant
locale
currency
```

can cause incorrect sharing.

Too much:

```text
tenant
locale
currency
user
session
requestId
timestamp
```

can create enormous fragmentation.

Therefore:

> **Cache identity should contain necessary dimensions, but not irrelevant dimensions.**

---

# 14. Cache Fragmentation

Suppose a response varies by:

```text
10,000 tenants
20 locales
5 currencies
```

Potential variants:

```text
10,000 × 20 × 5
= 1,000,000
```

The cache may become fragmented.

This reduces:

```text
hit ratio
memory efficiency
working-set locality
```

Cache design is therefore also a cardinality problem.

---

# 15. Cache Stampede

Suppose a popular cache entry expires.

At the same moment:

```text
10,000 requests
       ↓
cache miss
       ↓
10,000 origin computations
```

This can overwhelm the origin.

This is the classic:

```text
cache stampede
```

or:

```text
thundering herd
```

problem.

---

# 16. Stampede Protection

Possible techniques include:

```text
request coalescing
single-flight
regeneration locks
stale-while-revalidate
jittered expiration
prefetching
cache warming
```

The objective is:

```text
many callers
    ↓
one regeneration
    ↓
many callers receive result
```

---

# 17. Stale-While-Revalidate

A system may serve a slightly stale value while refreshing it.

Conceptually:

```text
Request
  ↓
stale cache entry
  ↓
return stale value
  +
background refresh
```

This trades some freshness for:

```text
lower latency
better availability
reduced origin load
```

The tradeoff must be appropriate to the data.

---

# 18. Cache Failure

What happens if the cache itself becomes unavailable?

A fragile system:

```text
cache unavailable
 ↓
every request fails
```

A resilient system may use:

```text
cache failure
 ↓
fall back to origin
```

But this introduces a new problem:

```text
cache outage
 ↓
all traffic reaches origin
 ↓
origin overload
```

Therefore cache fallback needs capacity analysis and protection.

---

# 19. Rate Limiting

Rate limiting answers:

> **How much traffic may a client generate within a defined policy?**

Examples:

```text
100 requests/minute
10 login attempts/minute
5 expensive exports/hour
```

Rate limiting protects:

```text
API
database
external dependencies
fairness
cost
abuse-sensitive operations
```

---

# 20. Rate Limiting Is Not Authentication

A request can be:

```text
authenticated
```

and still exceed:

```text
rate limit
```

Similarly:

```text
anonymous
```

traffic may also need rate limiting.

These are separate concerns.

---

# 21. Rate Limit Identity

A limit can be keyed by:

```text
IP
user
API key
tenant
organization
route
operation
combination
```

For example:

```text
anonymous:
IP + route

authenticated:
user + route

enterprise:
tenant + plan + operation
```

The identity should match the abuse/resource model.

---

# 22. Distributed Rate Limiting

With one server:

```text
Server
 └── local counter
```

is straightforward.

With:

```text
Server A
Server B
Server C
```

a local counter can be bypassed by distributing requests.

For a global policy, state may need to be shared through infrastructure such as:

```text
distributed key-value store
gateway
centralized rate limiter
```

This introduces its own consistency and availability tradeoffs.

---

# 23. Rate-Limit Algorithms

Common models include:

```text
fixed window
sliding window
token bucket
leaky bucket
```

### Fixed Window

Example:

```text
100 requests
per minute
```

Simple, but boundary effects can create bursts.

---

# 24. Token Bucket

Conceptually:

```text
bucket capacity = N
refill rate = R
```

Each request consumes tokens.

This allows controlled bursts while maintaining an average rate.

Useful for APIs where:

```text
small bursts are acceptable
```

but sustained overload is not.

---

# 25. Rate Limit Response

A typical response is:

```http
429 Too Many Requests
```

The API can provide retry guidance such as:

```http
Retry-After: 30
```

The response body can contain a stable code:

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests."
  }
}
```

This connects directly to Part 06's error-contract architecture.

---

# 26. Quotas vs Rate Limits

These are related but different.

### Rate limit

Controls:

```text
how quickly
```

requests occur.

### Quota

Controls:

```text
how much total usage
```

is allowed over a larger period.

Example:

```text
rate limit:
100 requests/minute

quota:
1,000,000 requests/month
```

---

# 27. Backpressure

Backpressure answers:

> **What happens when downstream capacity cannot keep up with incoming work?**

Without backpressure:

```text
incoming traffic
     ↓
unbounded queue
     ↓
memory growth
     ↓
latency explosion
     ↓
failure
```

With backpressure:

```text
capacity exceeded
     ↓
slow/reject/defer work
```

---

# 28. Concurrency Limits

Rate limiting controls request frequency.

Concurrency limiting controls:

> **How many operations may execute simultaneously?**

For example:

```text
maximum 20 expensive report generations
```

Even if traffic is only:

```text
5 requests/sec
```

each operation could consume substantial resources.

Concurrency limits protect expensive resources.

---

# 29. Rate Limit vs Concurrency Limit

These are not interchangeable.

Example:

```text
100 requests/minute
```

could still result in:

```text
100 simultaneous expensive operations
```

if all arrive together.

Therefore:

```text
rate limit
+
concurrency limit
```

may be required.

---

# 30. Load Shedding

When capacity is exhausted, the system may deliberately reject work.

This is:

```text
load shedding
```

The goal is not:

```text
accept everything
```

The goal is:

> **Preserve the most important service behavior under constrained capacity.**

---

# 31. Priority

Requests may have different importance.

For example:

```text
health check
customer checkout
admin analytics
background report
```

If capacity is constrained, lower-priority operations may be rejected or deferred first.

This requires explicit product/system policy.

---

# 32. Timeouts

Every network dependency should have a bounded timeout.

Without a timeout:

```text
request
 ↓
dependency hangs
 ↓
API request remains occupied
 ↓
connection/thread/resource remains occupied
 ↓
capacity drains
```

Timeouts prevent indefinite resource consumption.

---

# 33. Timeout Budgets

Suppose the overall request budget is:

```text
2 seconds
```

and the request performs:

```text
database
external API A
external API B
```

Giving each dependency:

```text
2 seconds
```

is incorrect.

Potentially:

```text
2 sec total
≠
2 sec + 2 sec + 2 sec
```

Timeout budgets must be coordinated.

---

# 34. Retry Budget

Suppose:

```text
timeout = 1 second
retries = 3
```

A naive system may turn a one-second dependency call into several seconds of user-visible latency.

Retries should therefore have:

```text
attempt limit
time budget
backoff
jitter
```

---

# 35. Retry Amplification

Suppose:

```text
API traffic = 1,000 req/sec
```

and every request makes one dependency call.

At normal operation:

```text
1,000 dependency calls/sec
```

If each request retries once:

```text
up to 2,000 calls/sec
```

If retries are poorly coordinated:

```text
dependency overload
→ more failures
→ more retries
```

This can become a positive feedback loop.

---

# 36. Circuit Breaker

A circuit breaker protects an API from repeatedly calling a failing dependency.

Conceptually:

```text
CLOSED
  ↓ failures
OPEN
  ↓ wait
HALF-OPEN
  ↓ test
CLOSED
```

### Closed

Requests flow normally.

### Open

Calls are rejected/fallback immediately.

### Half-Open

A limited number of test calls determine whether recovery occurred.

---

# 37. Circuit Breaker Purpose

A circuit breaker does not magically fix a dependency.

It prevents:

```text
healthy application
      ↓
repeated calls
      ↓
broken dependency
      ↓
resource exhaustion
      ↓
healthy application becomes broken
```

The goal is **failure containment**.

---

# 38. Circuit Breaker vs Rate Limiting

Rate limiting protects against:

```text
too much incoming work
```

Circuit breaking protects against:

```text
an unhealthy downstream dependency
```

They solve different failure modes.

---

# 39. Circuit Breaker vs Timeout

Timeout:

```text
stop waiting too long
```

Circuit breaker:

```text
stop repeatedly making calls to a known-failing dependency
```

They often work together:

```text
timeout
 ↓
failure signal
 ↓
circuit breaker
 ↓
short-circuit future calls
```

---

# 40. Graceful Degradation

When a dependency fails, the entire API does not always need to fail.

Example:

```text
product page
```

depends on:

```text
catalog
recommendations
reviews
```

If recommendations fail:

```text
catalog still renders
reviews still render
recommendations omitted
```

This is graceful degradation.

---

# 41. Critical vs Optional Dependencies

A useful architecture classification:

```text
Critical
→ operation cannot succeed without it

Important
→ operation can partially succeed

Optional
→ operation can degrade gracefully
```

This classification drives:

```text
timeouts
fallbacks
retry policies
circuit breakers
response behavior
```

---

# 42. Dependency Budget

For each dependency, define:

```text
timeout
retry count
concurrency limit
fallback
circuit-breaker policy
criticality
```

Example:

```text
Recommendations API
timeout: 150ms
retries: 0
fallback: omit
criticality: optional
```

This is more robust than having one global retry policy.

---

# 43. API Resilience Matrix

A useful design artifact:

| Dependency       | Criticality |    Timeout |                Retry | Fallback       |
| ---------------- | ----------- | ---------: | -------------------: | -------------- |
| Database         | Critical    |    bounded |              limited | fail operation |
| Payment provider | Critical    |    bounded | carefully controlled | pending/retry  |
| Recommendations  | Optional    |      short |             low/none | omit           |
| Analytics        | Optional    | very short |                async | drop/defer     |
| Search provider  | Important   |    bounded |              limited | alternate path |

The actual values depend on workload and SLOs.

---

# 44. Asynchronous Work

Not every operation needs to remain inside the HTTP request.

Instead:

```text
POST /exports
```

can produce:

```text
202 Accepted
```

and:

```text
jobId
```

Then:

```text
HTTP
 ↓
enqueue job
 ↓
worker
 ↓
long-running processing
```

This removes long-running work from the synchronous request budget.

---

# 45. Queues as Shock Absorbers

A queue can absorb temporary traffic spikes:

```text
Incoming
  ↓
Queue
  ↓
Workers
```

Instead of:

```text
Incoming
  ↓
100,000 simultaneous jobs
  ↓
resource exhaustion
```

Workers process according to available capacity.

But queues introduce:

```text
latency
delivery semantics
duplicate processing
dead letters
backpressure
```

They are not free.

---

# 46. Queue Backpressure

Suppose:

```text
producer = 10,000 jobs/sec
consumer = 1,000 jobs/sec
```

The queue grows by:

```text
9,000 jobs/sec
```

indefinitely.

Therefore a queue does not eliminate overload.

It changes:

```text
immediate overload
```

into:

```text
accumulated backlog
```

Capacity must still be managed.

---

# 47. Cache + Rate Limit Interaction

Consider:

```text
GET /products
```

If the request is cacheable:

```text
cache hit
```

may prevent origin work.

Should rate limiting happen before or after the cache?

The answer depends on the protection goal.

If the goal is:

```text
protect CDN/API infrastructure
```

rate limiting may happen early.

If the goal is:

```text
protect expensive origin computation
```

origin-level controls may differ.

There is no universal placement.

---

# 48. Authentication + Rate Limiting

A useful policy can be:

```text
anonymous
→ IP-based limit

authenticated user
→ user-based limit

tenant
→ tenant quota

expensive operation
→ operation-specific concurrency limit
```

This allows different protection models for different actors.

---

# 49. Abuse Resistance

Rate limiting can also protect:

```text
login
password reset
OTP generation
search
file generation
expensive queries
```

These endpoints may need much stricter policies than ordinary reads.

---

# 50. Distributed Cache Failure

Suppose:

```text
cache cluster unavailable
```

and all API nodes fall back to:

```text
database
```

Database traffic suddenly increases.

This is:

```text
cache failure amplification
```

Therefore resilience planning must include:

```text
cache outage
```

not only:

```text
application outage
```

---

# 51. Cache + Database Protection

A robust architecture can combine:

```text
cache
+
request coalescing
+
database connection limits
+
timeouts
+
circuit breakers
```

so a cache miss does not automatically become an uncontrolled database storm.

---

# 52. Stale-on-Failure

For appropriate read-heavy data:

```text
dependency fails
 ↓
serve previously cached representation
```

This can preserve availability.

But it is only valid when:

```text
staleness is acceptable
```

Never use stale data blindly for correctness-critical operations.

---

# 53. Fail Open vs Fail Closed

Security-sensitive systems must explicitly decide:

### Fail closed

```text
dependency unavailable
→ deny operation
```

Useful for authorization/security decisions.

### Fail open

```text
dependency unavailable
→ allow operation
```

May be appropriate for some non-critical optional features.

This is a policy decision, not a generic resilience rule.

---

# 54. Example: Authorization Dependency

Suppose authorization requires:

```text
policy service
```

The policy service is unavailable.

Automatically allowing access:

```text
policy unavailable
→ allow
```

may create a security failure.

For security-critical authorization, the architecture often needs a fail-closed strategy.

---

# 55. Example: Analytics Dependency

Suppose analytics is:

```text
optional
```

and the analytics service is unavailable.

The application may:

```text
continue user operation
```

and:

```text
drop/defer analytics event
```

This is graceful degradation.

---

# 56. Bulkheads

A bulkhead isolates resource pools.

For example:

```text
Checkout requests
→ pool A

Analytics requests
→ pool B

Report generation
→ pool C
```

If reports become expensive:

```text
pool C exhausted
```

while:

```text
checkout pool A
```

remains healthy.

This prevents one workload from consuming all resources.

---

# 57. Connection Pool Exhaustion

Suppose the database allows:

```text
100 connections
```

and an API creates:

```text
unbounded concurrent queries
```

Eventually:

```text
connection pool exhausted
```

Requests queue or fail.

Concurrency limits at the application layer can therefore protect the database.

---

# 58. Resilience Is a Capacity Problem

A useful mental model is:

```text
Arrival Rate
      ↓
Admission Control
      ↓
Concurrent Work
      ↓
Resource Capacity
      ↓
Completion Rate
```

If:

```text
arrival rate > sustainable completion rate
```

indefinitely, the system cannot remain healthy without:

```text
shedding
queuing
scaling
degradation
```

---

# 59. SLO-Aware Resilience

Resilience mechanisms should support measurable objectives.

For example:

```text
availability target
latency target
error budget
dependency budget
```

A 5-second retry strategy may technically increase success rate while violating latency objectives.

Therefore:

> **Success rate without latency context is not sufficient.**

---

# 60. API Resilience Budget

For a request with:

```text
2-second total budget
```

you might conceptually allocate:

```text
validation/auth: 100ms
database: 500ms
external dependency: 300ms
fallback/retry reserve: remaining budget
```

The exact values require production measurement.

The important principle is:

> **Every dependency consumes part of the request's latency and failure budget.**

---

# 61. Production Failure Scenario: Slow Database

```text
database slows
 ↓
API requests wait
 ↓
connections remain occupied
 ↓
pool exhausts
 ↓
API latency increases
 ↓
clients retry
 ↓
load increases
```

Mitigations can include:

```text
query optimization
timeouts
connection limits
concurrency limits
load shedding
caching
backpressure
```

---

# 62. Production Failure Scenario: External API Outage

```text
external API fails
 ↓
API retries
 ↓
more dependency calls
 ↓
latency rises
 ↓
request resources consumed
```

Better:

```text
timeout
+
bounded retry
+
circuit breaker
+
fallback
```

where appropriate.

---

# 63. Production Failure Scenario: Cache Expiration

```text
popular key expires
 ↓
10,000 cache misses
 ↓
10,000 database queries
```

Mitigation:

```text
single-flight regeneration
stale-while-revalidate
jitter
warming
```

---

# 64. Production Failure Scenario: Rate Limit Bypass

Suppose the limit is:

```text
100 req/min/server
```

with:

```text
10 API servers
```

An attacker may effectively generate:

```text
100 × 10
```

if limits are purely local.

The solution depends on whether the policy is intended to be:

```text
per-instance
```

or:

```text
globally enforced
```

---

# 65. Production Failure Scenario: Retry Storm

```text
dependency timeout
 ↓
10,000 clients retry
 ↓
dependency receives 20,000 requests
 ↓
dependency becomes even slower
 ↓
more retries
```

Mitigations:

```text
bounded retry
exponential backoff
jitter
circuit breaker
rate limiting
load shedding
```

---

# 66. Production Failure Scenario: Queue Growth

```text
producer = 5,000 jobs/sec
worker capacity = 1,000 jobs/sec
```

Backlog increases:

```text
4,000 jobs/sec
```

A resilient system must determine:

```text
maximum queue depth
acceptable delay
scaling policy
rejection policy
dead-letter strategy
priority
```

---

# 67. Testing Resilience

Normal unit tests are insufficient.

Test:

```text
cache unavailable
database slow
dependency timeout
dependency 500
rate limit exceeded
concurrent requests
cache stampede
retry behavior
circuit opening
circuit recovery
queue backlog
```

---

# 68. Load Testing

Load testing should measure:

```text
throughput
p50 latency
p95 latency
p99 latency
error rate
CPU
memory
database connections
cache hit ratio
dependency calls
queue depth
```

Do not judge resilience only from average latency.

Tail latency matters.

---

# 69. Failure Injection

Production-like systems benefit from controlled failure testing.

Examples:

```text
inject 500s
inject latency
drop network calls
disable cache
reduce database capacity
increase traffic
```

The goal is to verify:

```text
failure containment
```

rather than merely nominal correctness.

---

# 70. Observability

A resilient API needs visibility into:

```text
request rate
cache hit/miss
rate-limit rejections
queue depth
dependency latency
dependency errors
timeouts
retries
circuit state
concurrency saturation
connection pool usage
```

Without these signals, resilience mechanisms become difficult to tune.

---

# 71. Core Architecture

A production API request can be modeled as:

```text
                         Request
                            ↓
                    Admission Control
                            ↓
                 Rate / Quota Evaluation
                            ↓
                 Authentication / AuthZ
                            ↓
                      Cache Lookup
                       ↙        ↘
                   HIT           MISS
                    ↓              ↓
                 Response     Application
                                  ↓
                           Resource Limits
                                  ↓
                            Dependencies
                                  ↓
                      Timeout / Retry Policy
                                  ↓
                         Circuit Protection
                                  ↓
                             Result
                                  ↓
                           Cache Update
                                  ↓
                              Response
```

---

# 72. Resilience Control Matrix

| Mechanism         | Primary Problem                  |
| ----------------- | -------------------------------- |
| Cache             | repeated computation/data access |
| TTL               | freshness window                 |
| Invalidation      | stale representation             |
| Rate limit        | excessive request rate           |
| Quota             | excessive aggregate usage        |
| Concurrency limit | too much simultaneous work       |
| Timeout           | indefinite waiting               |
| Retry             | transient failure                |
| Backoff           | retry pressure                   |
| Jitter            | synchronized retries             |
| Circuit breaker   | repeated downstream failure      |
| Load shedding     | capacity exhaustion              |
| Queue             | asynchronous buffering           |
| Bulkhead          | failure isolation                |
| Fallback          | graceful degradation             |

The mechanisms complement one another.

---

# 73. Do Not Stack Mechanisms Blindly

A common anti-pattern is:

```text
retry × retry × retry
```

across:

```text
client
gateway
API
SDK
dependency
```

This can multiply attempts.

For example:

```text
client retries 3x
API retries 3x
dependency client retries 3x
```

Potentially:

```text
3 × 3 × 3 = 27
```

attempts.

Retry ownership must be explicit.

---

# 74. Retry Ownership

For every dependency ask:

```text
Who retries?

Client?
Gateway?
API?
SDK?
Worker?
Provider?
```

Prefer a deliberate policy rather than accidental stacked retries.

---

# 75. Cache Ownership

Likewise:

```text
Who owns caching?

Browser?
CDN?
API gateway?
Next.js?
Application?
Database?
```

Each layer should have a clear purpose.

Otherwise invalidation and freshness become unpredictable.

---

# 76. Resilience Ownership

For every failure control, ask:

```text
Who protects the resource?
```

Example:

```text
CDN → protects origin traffic
API rate limiter → protects API capacity
concurrency limiter → protects expensive operation
DB pool → protects database connections
circuit breaker → protects application from dependency
queue → buffers asynchronous work
```

---

# 77. SDE-2 Prediction Challenge

A cached endpoint normally receives:

```text
1,000 req/sec
```

with:

```text
95% cache hit ratio
```

Origin receives approximately:

```text
50 req/sec
```

If the cache fails:

```text
origin may suddenly receive ≈ 1,000 req/sec
```

Question:

> Is the cache merely a performance optimization?

No.

In this architecture, cache availability affects origin capacity.

Therefore cache behavior is part of resilience planning.

---

# 78. SDE-2 Prediction Challenge

An API allows:

```text
100 req/sec
```

but each request performs:

```text
5 database queries
```

The database therefore experiences roughly:

```text
500 queries/sec
```

If a new feature adds:

```text
3 additional queries
```

without changing API traffic, database load can become:

```text
800 queries/sec
```

This demonstrates:

> **API request rate is not the same as resource load.**

---

# 79. SDE-2 Prediction Challenge

A dependency has:

```text
500ms latency
```

and API timeout is:

```text
1 second
```

The API retries twice.

Potentially:

```text
500ms × 3
= 1.5 seconds
```

before considering additional overhead.

The request budget is already violated.

Retries must be constrained by the overall latency budget.

---

# 80. SDE-2 Prediction Challenge

A circuit breaker opens for a failing dependency.

The API now immediately returns:

```text
503
```

Is that necessarily a failure of resilience?

Not necessarily.

If the alternative was:

```text
every request waits 5 seconds
```

then:

```text
fast failure
```

may preserve system-wide availability and capacity.

Resilience often means:

> **Fail predictably rather than fail catastrophically.**

---

# 81. SDE-2 Interview Questions

### Caching

1. How do you determine whether an API response is safe to cache?
2. What belongs in a cache key?
3. How do tenant and user context affect cache identity?
4. How do you prevent cache stampedes?
5. What happens to origin load when the cache fails?

### Rate Limiting

6. How would you design distributed rate limiting?
7. Token bucket vs fixed window?
8. How would you rate-limit anonymous and authenticated users differently?
9. What is the difference between rate limiting and quotas?
10. How would you prevent expensive operations from exhausting capacity?

### Resilience

11. When should an API retry?
12. Why do retries amplify failures?
13. How do timeouts and retries interact?
14. What is a circuit breaker?
15. What is a bulkhead?
16. When should an API fail open vs fail closed?
17. How would you gracefully degrade an API?
18. How would you protect a database from API overload?

### System Design

19. Design an API that survives a 10× traffic spike.
20. Design a rate limiter across multiple application instances.
21. Design a cache strategy for tenant-aware API responses.
22. Design resilience for a payment-provider integration.
23. Design an API that remains available when a non-critical dependency fails.

---

# 82. Architecture Decision Framework

When designing an API, ask:

### 1. What resource are we protecting?

```text
CPU
memory
database
external provider
network
queue
```

### 2. What is the overload mechanism?

```text
too many requests
too much concurrency
too much data
too many dependency calls
```

### 3. Can the work be cached?

```text
yes / no
```

### 4. Can it be degraded?

```text
yes / no
```

### 5. Can it be asynchronous?

```text
yes / no
```

### 6. Can it be retried?

```text
yes / no
```

### 7. What happens during dependency failure?

```text
fail
fallback
queue
serve stale
short-circuit
```

### 8. What is the capacity limit?

```text
requests/sec
concurrent operations
database connections
queue depth
```

### 9. What happens after capacity is reached?

```text
queue
reject
shed
degrade
```

---

# 83. Complete Production Mental Model

```text
Traffic
  ↓
Admission
  ↓
Rate Limit / Quota
  ↓
Authentication
  ↓
Authorization
  ↓
Cache
  ↓
Application
  ↓
Concurrency Control
  ↓
Dependency
  ↓
Timeout
  ↓
Retry
  ↓
Circuit Breaker
  ↓
Fallback / Failure
  ↓
Response
```

And for asynchronous work:

```text
Request
  ↓
Validate
  ↓
Authorize
  ↓
Enqueue
  ↓
202 Accepted
  ↓
Worker
  ↓
Dependency
  ↓
Retry / Backoff
  ↓
Result
```

---

# 84. Critical Distinctions

Remember:

```text
Caching ≠ Rate Limiting

Rate Limiting ≠ Quota

Rate Limiting ≠ Concurrency Limiting

Retry ≠ Timeout

Timeout ≠ Circuit Breaker

Circuit Breaker ≠ Retry

Queue ≠ Unlimited Capacity

Cache ≠ Source of Truth

TTL ≠ Invalidation

Cache Hit ≠ Origin Capacity

Authentication ≠ Rate Limiting

Authorization ≠ Resilience

Graceful Degradation ≠ Silent Data Loss

Fail Fast ≠ Fail Incorrectly

High Throughput ≠ Infinite Capacity
```

---

# 85. Completion Checklist

You should be able to:

### Caching

* [ ] Explain API caching
* [ ] Identify representation-affecting cache dimensions
* [ ] Design cache keys
* [ ] Understand TTL
* [ ] Understand invalidation
* [ ] Handle personalized responses
* [ ] Handle tenant-aware responses
* [ ] Prevent cache stampedes
* [ ] Reason about cache failure

### Rate Limiting

* [ ] Explain rate limiting
* [ ] Distinguish rate limits from quotas
* [ ] Choose an appropriate rate-limit identity
* [ ] Explain fixed windows
* [ ] Explain token buckets
* [ ] Understand distributed rate limiting
* [ ] Design 429 responses

### Resilience

* [ ] Design timeouts
* [ ] Design retry budgets
* [ ] Use exponential backoff
* [ ] Use jitter
* [ ] Explain circuit breakers
* [ ] Explain bulkheads
* [ ] Implement concurrency limits conceptually
* [ ] Understand backpressure
* [ ] Understand load shedding
* [ ] Design graceful degradation
* [ ] Distinguish critical and optional dependencies

### Production Reasoning

* [ ] Predict cache failure amplification
* [ ] Predict retry storms
* [ ] Predict database saturation
* [ ] Reason about queue growth
* [ ] Design dependency budgets
* [ ] Design failure-injection tests
* [ ] Explain resilience tradeoffs in an SDE-2 interview

---

# 86. Part Boundary

### Part 06 — API Error Contracts, Validation & Idempotency

Focused on:

```text
validation
error taxonomy
HTTP error semantics
domain error mapping
stable error contracts
retry semantics
idempotency
duplicate requests
failure recovery
```

### Part 07 — API Caching, Rate Limiting & Resilience

Focused on:

```text
API caching
cache identity
TTL
invalidation
rate limiting
quotas
concurrency
backpressure
timeouts
retries
circuit breakers
bulkheads
load shedding
graceful degradation
```

### Part 08 — BFF, Aggregation & External Integrations

Next:

```text
Backend-for-Frontend architecture
API composition
aggregation
fan-out/fan-in
external service clients
provider boundaries
response shaping
partial failure
dependency orchestration
API-to-API integration
```

The next part moves from **protecting individual API operations** to **composing multiple APIs and external systems into a coherent frontend-facing backend architecture**.

---

# KPI 08 Progress

```text
Part 01  HTTP & Server Endpoint Mental Model             ✓
Part 02  Next.js Route Handlers Fundamentals            ✓
Part 03  Request Parsing & Response Architecture        ✓
Part 04  API Authentication & Authorization             ✓
Part 05  API Data Access & Business Logic Boundaries    ✓
Part 06  API Error Contracts, Validation & Idempotency  ✓
Part 07  API Caching, Rate Limiting & Resilience        ✓
Part 08  BFF, Aggregation & External Integrations       → NEXT
Part 09  API Observability, Testing & Operations
Part 10  Production API Architecture Capstone
```

**Part 07 complete.**
