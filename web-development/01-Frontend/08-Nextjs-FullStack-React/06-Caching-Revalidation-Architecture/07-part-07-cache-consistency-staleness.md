# Level 08 — KPI 06 — Part 07

## Cache Consistency, Staleness & Distributed Failure Modes

---

## 1. Part Objective

Caching is not fundamentally a performance problem.

At senior engineering level, caching is a **consistency problem with a performance benefit**.

The important question is not:

> “How do I cache this data?”

It is:

> “What versions of this data are allowed to be observed, for how long, and what happens when multiple cache layers disagree?”

This part develops the ability to reason about:

* stale data
* consistency models
* read-after-write behavior
* eventual consistency
* cache races
* concurrent mutations
* stale cache fills
* cache stampedes
* request coalescing
* stale-while-revalidate behavior
* invalidation propagation
* multi-layer caching
* multi-region caching
* failure recovery
* observability

The governing mental model is:

```text
Source of Truth
      ↓
Cache Population
      ↓
Cache Storage
      ↓
Cache Read
      ↓
Rendered Result
      ↓
User Observation
```

Every layer can introduce a different version of reality.

---

# 2. Why Cache Consistency Is Hard

Consider:

```text
Database:
balance = $500

Cache:
balance = $500

User submits:
withdraw $100
```

The mutation succeeds:

```text
Database:
balance = $400
```

But the cache still contains:

```text
$500
```

The next request might therefore observe:

```text
$500
```

even though the authoritative state is:

```text
$400
```

Caching has created a temporary divergence:

```text
authoritative state ≠ observed state
```

That divergence may be acceptable.

Or it may be catastrophic.

The engineering problem is determining which.

---

# 3. Source of Truth vs Cached Representation

Always distinguish:

```text
Source of Truth
```

from:

```text
Cached Representation
```

For example:

```text
PostgreSQL
    ↓
Application
    ↓
Cache
    ↓
Next.js rendering
```

The database may be authoritative.

The cache is a representation.

Therefore:

```text
cache correctness
```

is not the same as:

```text
database correctness
```

A cache can be stale while the database remains completely correct.

---

# 4. Consistency Models

A senior engineer should explicitly identify the consistency model of every important cached resource.

---

## 4.1 Strong Consistency

The user expects reads to reflect the latest committed state.

Conceptually:

```text
write X
  ↓
commit
  ↓
read
  ↓
X
```

The system attempts to ensure that successful reads do not observe an older version after the write becomes visible.

Typical candidates:

* financial balances
* authorization state
* permission changes
* security configuration
* critical inventory constraints

Strong consistency is expensive because caches must be carefully coordinated with writes.

---

# 5. Read-After-Write Consistency

A more targeted requirement is:

> After this user successfully performs a mutation, their subsequent read should observe that mutation.

Example:

```text
POST /profile
name = "Srikar"

success

GET /profile
```

The user expects:

```text
name = "Srikar"
```

not:

```text
name = previousName
```

This is:

```text
read-after-write consistency
```

It is one of the most important requirements in mutation-driven UI systems.

---

# 6. Eventual Consistency

With eventual consistency:

```text
write
 ↓
authoritative state changes
 ↓
cache invalidation/propagation
 ↓
other readers converge
```

There may be a temporary period:

```text
t0 → old value
t1 → mutation succeeds
t2 → cache invalidated
t3 → new value observed
```

Between `t1` and `t2`, different requests may see different versions.

That is acceptable for many resources.

Examples:

* analytics
* social counters
* recommendation data
* public content
* search indexes
* activity feeds

The critical design question is:

> What is the maximum acceptable stale window?

---

# 7. Stale Windows

Suppose:

```text
cache TTL = 60 seconds
```

A mutation occurs immediately after cache population.

Potentially:

```text
t = 1s
write occurs

t = 2s
user reads cache

t = 60s
cache expires
```

The stale period could approach:

```text
~59 seconds
```

Therefore TTL is effectively a consistency policy.

You are saying:

> “This data may be up to approximately this old.”

That should be an intentional product/system decision.

---

# 8. TTL Is Not Invalidation

These are different mechanisms.

### TTL

```text
wait until expiration
```

### Invalidation

```text
explicitly declare cached representation obsolete
```

Example:

```text
TTL:
cache for 60 seconds

Mutation:
update product

Invalidation:
invalidate product:123
```

The second approach can dramatically reduce stale windows.

A robust architecture often combines:

```text
TTL
+
explicit invalidation
```

TTL provides eventual recovery.

Invalidation provides faster convergence.

---

# 9. Stale-While-Revalidate

A common strategy is:

```text
serve stale value
+
refresh it in the background
```

Conceptually:

```text
request
  ↓
stale cached response available
  ↓
return immediately
  ↓
background refresh
  ↓
cache updated
```

This trades:

```text
freshness
```

for:

```text
latency
```

The important question becomes:

> Is serving a slightly stale value better than waiting for fresh data?

For many read-heavy workloads:

```text
yes
```

For some domains:

```text
absolutely not
```

---

# 10. Cache Stampede

Consider:

```text
cache entry expires
```

and suddenly:

```text
10,000 requests
```

arrive.

Without coordination:

```text
Request 1 → database
Request 2 → database
Request 3 → database
...
Request 10,000 → database
```

Instead of:

```text
cache miss → one regeneration → everyone receives result
```

you get:

```text
cache miss → massive origin load
```

This is a:

> cache stampede

or:

> thundering herd

---

# 11. Request Coalescing

One solution is request coalescing.

Conceptually:

```text
100 requests
     ↓
same cache miss
     ↓
one regeneration
     ↓
99 requests wait/share result
```

Architecture:

```text
              ┌─ Request A
              ├─ Request B
cache miss ───┼─ Request C
              ├─ Request D
              └─ Request E
                    ↓
              single origin fetch
                    ↓
              cache population
                    ↓
              shared result
```

This protects the origin.

---

# 12. Cache Regeneration Locking

Another approach is a regeneration lock.

Conceptually:

```text
lock(resource:123)
```

Only one worker is allowed to regenerate.

Other workers:

```text
wait
```

or:

```text
serve stale
```

or:

```text
retry later
```

depending on the consistency requirements.

---

# 13. Dogpile Prevention

A production cache should consider what happens near expiration.

Instead of:

```text
TTL expires
↓
everything misses simultaneously
```

you can use:

```text
refresh before expiration
```

or:

```text
serve stale temporarily
+
refresh asynchronously
```

or:

```text
jittered expiration
```

The objective is:

```text
avoid synchronized cache expiration
```

---

# 14. Race Condition: Old Data Arrives After New Data

This is one of the most dangerous cache bugs.

Imagine:

```text
Request A starts
    ↓
reads old database version
```

Then:

```text
Mutation B commits new version
```

Then:

```text
Request A finishes
```

If Request A populates the cache after the mutation:

```text
cache = old data
```

The cache has effectively moved backward.

Timeline:

```text
T1  Request A reads V1
T2  Mutation writes V2
T3  Cache invalidated
T4  Request A writes V1 into cache
```

Final state:

```text
Database = V2
Cache    = V1
```

This is a stale-fill race.

---

# 15. Versioned Cache Entries

One solution is versioning.

Instead of treating data as:

```text
value
```

treat it as:

```text
{
  version,
  value
}
```

Example:

```text
V1 → product price = 100
V2 → product price = 120
```

When writing to cache:

```text
only accept incoming version >= current version
```

Therefore:

```text
cache V2
incoming V1
```

becomes:

```text
reject V1
```

This protects against out-of-order writes.

---

# 16. Concurrent Writers

Consider:

```text
User A → update title
User B → update title
```

Both mutations execute concurrently.

Potential sequence:

```text
A reads V1
B reads V1

A writes V2
B writes V2
```

Now one update may overwrite another.

Caching does not solve this.

The system needs a concurrency strategy.

Possible approaches:

```text
optimistic concurrency
pessimistic locking
version checks
last-write-wins
conflict detection
domain-specific merge
```

---

# 17. Optimistic Concurrency

A resource may carry:

```text
version = 42
```

Client submits:

```text
update where version = 42
```

If the server currently has:

```text
version = 43
```

the mutation fails.

Conceptually:

```text
Client version 42
       ↓
Server version 43
       ↓
CONFLICT
```

The user can then:

```text
reload
compare
merge
retry
```

This is much safer than silently overwriting newer data.

---

# 18. Cache Invalidation Race

Another race occurs when invalidation and population happen in the wrong order.

Bad sequence:

```text
fetch data
↓
mutation
↓
invalidate
↓
fetch result completes
↓
old data inserted
```

You intended:

```text
new state
```

but produced:

```text
old cached state
```

Therefore cache correctness depends on **operation ordering**, not merely calling invalidation APIs.

---

# 19. Mutation-to-Cache Ordering

A safer conceptual sequence is:

```text
1. Validate mutation
2. Authorize mutation
3. Commit authoritative state
4. Determine affected cache dependencies
5. Invalidate/update cache
6. Synchronize rendering/UI
```

The critical rule is:

```text
authoritative state first
```

Do not make the cache appear newer than the source of truth.

---

# 20. Cache Dependency Graph

A single database mutation may affect many cached representations.

Example:

```text
Product 123
   │
   ├── Product page
   ├── Category listing
   ├── Search result
   ├── Recommendation list
   └── User wishlist
```

Therefore:

```text
Product mutation
```

may require:

```text
invalidate product:123
invalidate category:electronics
invalidate search:iphone
invalidate wishlist:user:42
```

This is why domain-oriented cache tagging is valuable.

---

# 21. Dependency Graph Reasoning

Think in terms of:

```text
Domain entity
      ↓
Derived representations
      ↓
Cache dependencies
      ↓
Invalidation graph
```

For example:

```text
Order #100
    ↓
order:100
    ↓
customer:42/orders
    ↓
customer:42/dashboard
    ↓
admin:orders
```

A mutation must invalidate the appropriate representation set.

---

# 22. Over-Invalidation

You can also invalidate too much.

Example:

```text
Update Product 123
```

causes:

```text
invalidate entire product catalog
```

Now:

```text
10,000 cache entries
```

must regenerate.

Correctness may be preserved.

Performance is damaged.

Therefore:

```text
under-invalidation → stale data
over-invalidation → unnecessary work
```

Senior architecture seeks the smallest correct invalidation scope.

---

# 23. Under-Invalidation

The opposite problem:

```text
database changed
```

but only:

```text
product:123
```

was invalidated.

The category listing still contains:

```text
old product price
```

Result:

```text
Product page = $120
Category page = $100
```

The system is internally inconsistent from the user's perspective.

Therefore invalidation must follow **derived-data dependencies**, not only the mutated database row.

---

# 24. Multi-Layer Caching

Modern applications often have multiple cache layers:

```text
Browser
   ↓
CDN / Edge
   ↓
Framework cache
   ↓
Application cache
   ↓
Database
```

Now imagine:

```text
Database = V2
Framework cache = V2
CDN = V1
Browser = V1
```

Invalidating only one layer does not necessarily solve the problem.

The user may still observe:

```text
V1
```

---

# 25. Cache Hierarchy

A senior engineer should identify:

```text
L1 → browser/client
L2 → CDN/edge
L3 → application/framework
L4 → distributed cache
L5 → database
```

For each layer ask:

1. What is cached?
2. Who controls it?
3. What is its TTL?
4. How is it invalidated?
5. Can it serve stale data?
6. Can it be bypassed?
7. What happens when invalidation fails?

---

# 26. Browser Cache vs Application Cache

These are fundamentally different.

Application code may execute:

```text
revalidate
```

but the browser may still possess:

```text
cached HTTP response
```

Likewise, invalidating server-side application data does not automatically mean every client has instantly updated its local representation.

The complete system therefore includes:

```text
server consistency
+
transport/cache consistency
+
UI state consistency
```

---

# 27. Multi-Region Caching

Suppose:

```text
Region A
Region B
Region C
```

All contain cached representations.

A mutation occurs in Region A:

```text
DB updated
Region A cache invalidated
```

But:

```text
Region B cache = old
Region C cache = old
```

There is now an invalidation propagation problem.

Possible architecture:

```text
Mutation
   ↓
event
   ↓
invalidation bus
   ├── Region A
   ├── Region B
   └── Region C
```

The system converges as invalidation propagates.

---

# 28. Invalidation Propagation Delay

Distributed invalidation is rarely instantaneous.

Therefore:

```text
mutation at T0
```

does not necessarily mean:

```text
all caches updated at T0
```

Instead:

```text
T0 → mutation
T1 → invalidation generated
T2 → Region A receives
T3 → Region B receives
T4 → Region C receives
```

The system's effective stale window depends on this propagation time.

---

# 29. Cache Consistency Budget

A useful architectural concept is:

> consistency budget

For each resource define:

```text
Maximum acceptable stale duration
```

Examples:

```text
Security permission:
≈ zero tolerance

Account balance:
very low tolerance

Product description:
seconds/minutes may be acceptable

Analytics:
minutes/hours may be acceptable
```

This converts vague requirements into engineering constraints.

---

# 30. Cache Failure Modes

A production cache can fail in many ways.

### Failure 1 — Cache Miss

```text
cache unavailable
↓
origin request
```

Usually recoverable.

---

### Failure 2 — Stale Cache

```text
cache available
but old
```

Potential correctness issue.

---

### Failure 3 — Stampede

```text
cache miss
↓
massive origin load
```

Potential availability issue.

---

### Failure 4 — Stale Fill

```text
old request
↓
writes old data
```

Potential consistency issue.

---

### Failure 5 — Partial Invalidation

```text
some representations invalidated
others remain stale
```

Potential UX inconsistency.

---

### Failure 6 — Invalidation Failure

```text
mutation succeeds
cache invalidation fails
```

Now:

```text
source of truth = new
cache = old
```

The system needs recovery.

---

# 31. What If Invalidation Fails?

A mutation should not necessarily be rolled back simply because cache invalidation failed.

You need to distinguish:

```text
domain transaction
```

from:

```text
cache maintenance
```

For example:

```text
DB transaction succeeds
cache invalidation fails
```

The authoritative mutation may still be correct.

Possible recovery mechanisms:

```text
retry
event queue
outbox pattern
background invalidation
TTL fallback
manual repair
```

---

# 32. Transactional Outbox Pattern

For important distributed invalidation, the system can use an outbox.

Conceptually:

```text
Database transaction
    ├── update domain state
    └── record invalidation event
             ↓
        transaction commits
             ↓
        event processor
             ↓
        cache invalidation
```

This reduces the risk of:

```text
database updated
but invalidation event lost
```

The key idea is:

> persist the intent to invalidate alongside the authoritative mutation.

---

# 33. Idempotent Invalidation

Invalidation operations should ideally be safe to repeat.

Example:

```text
invalidate product:123
invalidate product:123
invalidate product:123
```

Repeated execution should not corrupt state.

This enables:

```text
retry
at-least-once delivery
queue redelivery
failure recovery
```

Idempotency is therefore a critical property of distributed cache maintenance.

---

# 34. Cache Warmup

After invalidation, you may either:

```text
wait for next request
```

or:

```text
actively repopulate cache
```

The second approach is cache warmup.

Example:

```text
deploy
↓
invalidate
↓
preload popular routes
↓
traffic arrives
```

This can prevent a cold-cache latency spike.

But prewarming creates additional origin load.

---

# 35. Cache Penetration

A system can also suffer from repeated requests for data that does not exist.

Example:

```text
GET /product/999999999
```

If nonexistent results are never cached:

```text
request
↓
cache miss
↓
database lookup
↓
not found
```

Repeated requests cause repeated database work.

Possible mitigation:

```text
negative caching
```

where the system temporarily caches:

```text
NOT_FOUND
```

---

# 36. Cache Key Design

Many consistency problems originate in poor cache keys.

Bad:

```text
product
```

Better:

```text
product:123
```

For tenant-specific data:

```text
tenant:42:product:123
```

For locale-sensitive data:

```text
tenant:42:product:123:locale:en-IN
```

For permission-sensitive data:

```text
user:42:dashboard
```

A cache key must represent every dimension that changes the result.

---

# 37. Cache Key Collision

Suppose:

```text
GET /profile
```

returns different results for different users.

If the cache key is:

```text
profile
```

then:

```text
User A → cached response
User B → receives User A's response
```

This is not merely stale data.

It is a **security vulnerability**.

Personalization boundaries must therefore be explicit in cache identity.

---

# 38. Authorization and Cache Consistency

Consider:

```text
User loses admin access
```

but an admin-only cached response remains available.

The system may accidentally expose:

```text
previously authorized data
```

Therefore authorization-sensitive cache entries require special care.

Possible strategies:

```text
avoid caching sensitive responses
scope cache by authorization context
short TTL
explicit invalidation on permission changes
server-side authorization before serving data
```

The fundamental rule is:

> cache invalidation must not replace authorization.

---

# 39. Cache Consistency and Next.js

In a Next.js application, caching and rendering are related but distinct concerns.

A simplified model is:

```text
Data dependency
      ↓
Cache
      ↓
Rendering
      ↓
Route/UI
```

Mutation architecture must therefore reason about:

```text
what changed
↓
which cached dependency changed
↓
which rendered representation depends on it
↓
what must be invalidated/refreshed
```

The APIs discussed in earlier parts such as:

```text
cacheTag
revalidateTag
updateTag
revalidatePath
refresh
```

are mechanisms within this larger consistency architecture.

The API call itself is not the architecture.

---

# 40. The Mutation Consistency Pipeline

A production mutation can be modeled as:

```text
User Intent
    ↓
Validation
    ↓
Authorization
    ↓
Domain Mutation
    ↓
Commit
    ↓
Dependency Identification
    ↓
Cache Invalidation
    ↓
Rendering/UI Synchronization
    ↓
User Confirmation
```

If one stage is missing, users may observe contradictory states.

---

# 41. Read-After-Write Architecture

For a mutation where immediate consistency matters:

```text
mutation
  ↓
commit
  ↓
synchronously invalidate affected cache
  ↓
subsequent read observes new state
```

The objective is:

```text
write → read
```

without an observable stale interval.

For less critical resources:

```text
mutation
  ↓
commit
  ↓
asynchronous invalidation
  ↓
eventual convergence
```

The architecture should match the domain requirement.

---

# 42. Cache Consistency Matrix

A useful design tool:

| Resource        | Freshness Requirement | Stale Data Allowed? | Invalidation   |
| --------------- | --------------------- | ------------------- | -------------- |
| Account balance | Very high             | Minimal             | Immediate      |
| Permissions     | Very high             | Minimal             | Immediate      |
| User profile    | Medium                | Short               | Targeted       |
| Product details | Medium                | Short               | Targeted       |
| Search results  | Lower                 | Yes                 | Eventual       |
| Analytics       | Low                   | Yes                 | TTL/background |
| Recommendations | Low                   | Yes                 | Background     |

This is not a universal policy.

It is a way to force explicit architectural decisions.

---

# 43. Observability

Caching without observability becomes guesswork.

Important metrics include:

```text
cache hit rate
cache miss rate
stale response rate
origin request rate
cache regeneration count
regeneration latency
invalidation latency
invalidation failures
cache population failures
stampede frequency
request coalescing effectiveness
```

For distributed systems:

```text
invalidation propagation latency
region divergence
event queue lag
retry count
```

---

# 44. Correlation IDs

A production debugging request should be traceable across:

```text
user request
↓
mutation
↓
database transaction
↓
invalidation event
↓
cache operation
↓
render
```

A correlation identifier allows engineers to answer:

> “Why did this user see the old value?”

without guessing.

---

# 45. Cache Debugging Procedure

When users report:

> “I updated it, but I still see the old value.”

Do not immediately change TTL.

Trace:

```text
1. Did the mutation commit?
2. What version is authoritative?
3. Which cache keys depend on it?
4. Were they invalidated?
5. Did invalidation succeed?
6. Did a stale request repopulate them?
7. Is another cache layer serving the old response?
8. Is the browser holding stale data?
9. Is the UI holding stale client state?
10. Did the user read from another region?
```

This turns debugging into a deterministic process.

---

# 46. Production Failure Matrix

| Failure              | Cause                       | Observable Symptom    | Mitigation               |
| -------------------- | --------------------------- | --------------------- | ------------------------ |
| stale response       | missing/late invalidation   | old data              | targeted invalidation    |
| stampede             | synchronized expiration     | origin overload       | coalescing/locking       |
| stale fill           | old request finishes late   | cache regresses       | versioning               |
| partial invalidation | incomplete dependency graph | inconsistent pages    | domain tags              |
| invalidation loss    | distributed failure         | prolonged staleness   | durable events           |
| cache collision      | poor key                    | wrong user's data     | scoped keys              |
| region divergence    | delayed propagation         | region-specific state | distributed invalidation |
| cold cache           | deploy/restart              | latency spike         | warmup                   |
| negative-cache miss  | nonexistent keys uncached   | repeated DB lookups   | negative caching         |

---

# 47. Prediction Challenge 1

Given:

```text
DB = V2
Cache = V1

Mutation succeeds.
Cache invalidation succeeds.

User still sees V1.
```

Possible explanations:

```text
browser cache
CDN cache
client state
different cache key
different region
stale rendering representation
```

The important lesson:

> server-side invalidation does not automatically imply end-to-end freshness.

---

# 48. Prediction Challenge 2

Given:

```text
T1: Request A reads V1
T2: Mutation writes V2
T3: cache invalidated
T4: Request A writes V1 into cache
```

Final state:

```text
DB = V2
Cache = V1
```

The bug is:

```text
stale-fill race
```

Not:

```text
missing invalidation
```

This distinction matters during debugging.

---

# 49. Prediction Challenge 3

Given:

```text
1,000 requests
cache entry expires
```

and all requests independently regenerate:

```text
1,000 origin requests
```

The issue is:

```text
cache stampede
```

A better architecture is:

```text
1 regeneration
+
shared result
```

or:

```text
serve stale
+
background regeneration
```

depending on freshness requirements.

---

# 50. Prediction Challenge 4

Given:

```text
User A → cached dashboard
User B → same cache key
```

and dashboards are personalized.

If User B receives User A's dashboard, the primary architectural problem is:

```text
cache identity/security boundary
```

not:

```text
TTL
```

Changing TTL does not solve incorrect cache partitioning.

---

# 51. SDE-2 Interview Gotchas

### Gotcha 1

> “We invalidate the cache after every write, so consistency is guaranteed.”

Not necessarily.

You still need to consider:

```text
stale fills
multiple cache layers
distributed invalidation
client state
concurrent writes
```

---

### Gotcha 2

> “A shorter TTL solves stale data.”

It reduces the maximum stale period but does not eliminate:

```text
race conditions
cache collisions
multi-layer inconsistencies
```

---

### Gotcha 3

> “Cache misses are harmless.”

A large synchronized miss can overload the origin.

---

### Gotcha 4

> “The database is correct, therefore the application is correct.”

Users observe:

```text
rendered representation
```

not directly:

```text
database state
```

---

### Gotcha 5

> “Invalidate everything after a mutation.”

This may preserve correctness but create severe performance costs.

Senior engineers seek:

```text
minimum sufficient invalidation
```

---

# 52. Production Architecture Example

Consider:

```text
E-commerce Product Update
```

Architecture:

```text
                ┌──────────────┐
                │   Database   │
                └──────┬───────┘
                       │
                 Product V42
                       │
                 Mutation commit
                       │
              ┌────────▼────────┐
              │ Invalidation     │
              │ Event            │
              └────────┬─────────┘
                       │
         ┌─────────────┼─────────────┐
         ↓             ↓             ↓
 product:123    category:phones   search:iphone
         │             │             │
         └─────────────┼─────────────┘
                       ↓
                Next.js rendering
                       ↓
                     UI
```

The architecture is dependency-driven.

Not route-driven alone.

---

# 53. Senior-Level Mental Model

A junior implementation often thinks:

```text
fetch
cache
invalidate
```

A senior implementation thinks:

```text
source of truth
    ↓
version
    ↓
derived representations
    ↓
dependency graph
    ↓
cache identity
    ↓
freshness policy
    ↓
invalidation mechanism
    ↓
concurrency behavior
    ↓
failure recovery
    ↓
observability
```

That is the actual caching architecture.

---

# 54. The Five Questions Every Cache Must Answer

For every production cache, answer:

### 1. Identity

```text
What uniquely identifies this representation?
```

### 2. Freshness

```text
How stale may it be?
```

### 3. Dependency

```text
What source state determines its value?
```

### 4. Invalidation

```text
What event makes it obsolete?
```

### 5. Failure

```text
What happens if cache population or invalidation fails?
```

If these cannot be answered, the cache is not fully designed.

---

# 55. Executive Cheat Sheet

```text
Cache = derived representation

TTL ≠ invalidation

Staleness = consistency tradeoff

Read-after-write = important mutation requirement

Stampede = many requests regenerate simultaneously

Coalescing = one regeneration shared by many requests

Stale fill = old request repopulates newer cache

Versioning = protects against out-of-order writes

Under-invalidation = stale representations

Over-invalidation = unnecessary work

Multi-layer cache = multiple consistency boundaries

Multi-region cache = invalidation propagation problem

Durable invalidation = better failure recovery

Cache key = correctness + security boundary

Observability = necessary for production debugging
```

---

# 56. Final Mental Model

The complete caching lifecycle is:

```text
                 ┌─────────────────┐
                 │ Source of Truth │
                 └────────┬────────┘
                          ↓
                    Domain Mutation
                          ↓
                       Commit
                          ↓
                  Dependency Graph
                          ↓
              ┌───────────┴───────────┐
              ↓                       ↓
        Cache Identity          Invalidation
              ↓                       ↓
        Cache Population       Propagation
              ↓                       ↓
              └───────────┬───────────┘
                          ↓
                     Cache Read
                          ↓
                    Rendering/UI
                          ↓
                      User View
```

At every point ask:

```text
Which version exists?

Who considers it authoritative?

Who can observe it?

How long can it remain stale?

What invalidates it?

What happens if operations race?

What happens if invalidation fails?
```

That is the SDE-2 caching mindset.

---

# 57. Completion Checklist

You should now be able to:

* [ ] distinguish source of truth from cached representation
* [ ] explain strong vs eventual consistency
* [ ] define read-after-write consistency
* [ ] reason about stale windows
* [ ] distinguish TTL from invalidation
* [ ] explain stale-while-revalidate
* [ ] identify cache stampedes
* [ ] explain request coalescing
* [ ] identify stale-fill races
* [ ] explain versioned cache entries
* [ ] reason about concurrent writers
* [ ] design dependency-driven invalidation
* [ ] identify under-invalidation
* [ ] identify over-invalidation
* [ ] reason about browser/CDN/application cache layers
* [ ] reason about multi-region invalidation
* [ ] design invalidation recovery
* [ ] understand durable invalidation patterns
* [ ] design safe cache keys
* [ ] recognize cache-related security failures
* [ ] define a consistency budget
* [ ] instrument cache behavior
* [ ] debug stale-data reports systematically
* [ ] defend cache architecture in an SDE-2 interview

---

# 58. Part Boundary

This part establishes **cache consistency and failure reasoning**.

It does not yet focus on:

* complete end-to-end cache architecture implementation
* cache performance optimization
* advanced production cache economics
* cache observability systems in depth
* full Next.js caching capstone design

Those belong to subsequent integration work.

The core principle to retain is:

> **Caching is controlled divergence from the source of truth. Senior engineering is the discipline of controlling that divergence.**
