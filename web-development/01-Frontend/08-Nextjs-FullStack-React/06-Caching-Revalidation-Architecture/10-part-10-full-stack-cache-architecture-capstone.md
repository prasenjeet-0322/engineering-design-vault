# Level 08 — Next.js / Full-Stack React

## KPI 06 — Caching & Revalidation Architecture

# Part 10: Full-Stack Cache & Revalidation Architecture Capstone

---

## 1. Part Objective

This part is the **integration layer** for KPI 06.

The goal is no longer to learn another individual caching API.

The goal is to demonstrate that you can design, explain, debug, and defend a complete Next.js application where:

* data comes from multiple sources,
* some data is globally reusable,
* some data is tenant-specific,
* some data is user-specific,
* some UI is static,
* some UI is dynamic,
* mutations happen through Server Actions,
* mutations invalidate the correct cached representations,
* stale data is an intentional architectural decision,
* cache failures do not automatically become application failures,
* cache capacity and origin load are controlled,
* and the resulting system remains observable.

The senior-level question is:

> **Given a full-stack application, how do you determine what should be cached, where it should be cached, how long it may remain stale, what invalidates it, and how the UI becomes consistent with the new state after a mutation?**

---

# 2. The Complete KPI 06 Mental Model

The entire KPI can now be reduced to this pipeline:

```text
Domain State
     ↓
Data Dependencies
     ↓
Cache Identity
     ↓
Cache Lifetime
     ↓
Rendering Boundary
     ↓
Cached Representation
     ↓
Mutation
     ↓
Invalidation
     ↓
Revalidation / Refresh
     ↓
UI Synchronization
     ↓
Observability
```

Every production caching decision should be explainable through this chain.

---

# 3. The Capstone Scenario

Assume you are building a SaaS analytics application.

The application contains:

```text
Dashboard
├── Organization information
├── Current user information
├── Subscription status
├── Revenue metrics
├── Recent transactions
├── Feature flags
├── Notifications
├── Team members
└── Billing settings
```

The system has:

* millions of users,
* thousands of organizations,
* multiple regions,
* authenticated access,
* role-based authorization,
* external payment APIs,
* an analytics database,
* a transactional database,
* and a CDN.

The application must support:

```text
Read-heavy dashboard traffic
+
Authenticated personalization
+
Frequent mutations
+
Near-real-time metrics
+
External API failures
+
Multi-tenant isolation
```

This is no longer a simple page-cache problem.

It is a **distributed representation-management problem**.

---

# 4. First Principle: Separate State From Representation

The database is the source of truth.

The cache is a representation of that state.

For example:

```text
Database:

organization:
    id = org_123
    plan = enterprise
```

Cached representation:

```text
organization:org_123
→
{
    id: "org_123",
    plan: "enterprise"
}
```

Rendered representation:

```text
/dashboard
→
HTML / RSC representation
```

Client representation:

```text
React UI
→
currently displayed dashboard
```

These are not the same thing.

Therefore:

```text
Database update
≠
automatic cache update
≠
automatic rendered UI update
```

The architecture must explicitly connect them.

---

# 5. Build the Dependency Graph First

Before deciding cache behavior, identify dependencies.

For example:

```text
Dashboard
│
├── Organization
│   └── organization:org_123
│
├── Subscription
│   └── subscription:org_123
│
├── Revenue Metrics
│   └── revenue:org_123:month
│
├── Transactions
│   └── transactions:org_123
│
├── Team
│   └── team:org_123
│
└── Current User
    └── user:user_456
```

This dependency graph determines invalidation.

For example:

```text
Update subscription
        ↓
subscription:org_123
        ↓
billing representation
        ↓
dashboard representation
```

But:

```text
Update subscription
```

should not necessarily invalidate:

```text
team:org_123
```

Unnecessary invalidation causes:

```text
cache churn
+
origin load
+
lower hit ratio
+
higher latency
```

---

# 6. Classify Every Data Dependency

Before caching anything, classify it.

| Data                    | Shared?            | Personalized?  | Freshness |
| ----------------------- | ------------------ | -------------- | --------- |
| Organization name       | Organization-wide  | No             | Moderate  |
| Subscription            | Organization-wide  | No             | High      |
| Revenue metrics         | Organization-wide  | No             | High      |
| Transactions            | Organization-wide  | Role-dependent | High      |
| Current user            | User-specific      | Yes            | Very high |
| Feature flags           | User/org dependent | Sometimes      | Moderate  |
| Notifications           | User-specific      | Yes            | Very high |
| Marketing configuration | Global             | No             | Low       |

The important question is not:

> "Can I cache this?"

Almost everything can technically be cached.

The correct question is:

> "Under what identity and freshness contract can this representation safely be reused?"

---

# 7. Cache Identity

A cache entry is only correct if its key represents every value that can change its output.

Consider:

```text
getDashboard(orgId)
```

versus:

```text
getDashboard(orgId, userId, locale, role)
```

If the rendered result depends on:

```text
organization
+
user
+
role
+
locale
```

then the cache identity must account for those dependencies.

Otherwise:

```text
User A
  ↓
cache entry
  ↓
User B
  ↓
receives User A representation
```

This is both:

* a correctness problem,
* and potentially a security problem.

---

# 8. Cache Key Cardinality

Cache identity also affects capacity.

Suppose:

```text
10,000 organizations
×
100 users/org
×
5 locales
×
3 roles
```

Potential representations:

```text
10,000 × 100 × 5 × 3
=
15,000,000
```

That can produce severe cache fragmentation.

Therefore, avoid unnecessarily personalized cached representations.

Prefer:

```text
Shared organization data
+
uncached user-specific data
```

over:

```text
Entire personalized dashboard cached per user
```

when architecture permits.

---

# 9. Split Shared and Personalized Regions

A useful architecture is:

```text
Dashboard
│
├── Shared Region
│   ├── Organization
│   ├── Subscription
│   └── Aggregate Metrics
│
└── Dynamic Region
    ├── Current User
    ├── Notifications
    └── Permission-sensitive controls
```

This allows reusable information to remain reusable.

The principle is:

> **Do not make an entire page dynamic merely because one part of the page is personalized.**

Instead, identify the smallest necessary dynamic boundary.

---

# 10. Rendering Boundary vs Cache Boundary

These are different concepts.

A component boundary answers:

> Where does rendering logic live?

A cache boundary answers:

> Which result can be reused?

They may align, but they do not have to.

For example:

```text
DashboardPage
│
├── RevenueChart
│     └── cached data
│
├── TransactionList
│     └── cached data
│
└── NotificationPanel
      └── dynamic data
```

The page itself may contain both reusable and non-reusable dependencies.

Senior engineers reason about the **dependency graph**, not merely the component tree.

---

# 11. Static and Dynamic Rendering

A useful conceptual model:

```text
Static rendering
    ↓
computed ahead of request
    ↓
reusable representation
```

versus:

```text
Dynamic rendering
    ↓
computed in request context
    ↓
depends on runtime information
```

Runtime-dependent values often include:

```text
cookies
headers
session
user
request-specific authorization
```

But dynamic rendering should not automatically imply:

```text
every database read is uncached
```

Rendering strategy and data caching strategy are related but distinct decisions.

---

# 12. Cache Components / Partial Prerendering Mental Model

For complex pages, think in terms of:

```text
Stable shell
+
cached reusable regions
+
dynamic regions
+
streaming boundaries
```

Conceptually:

```text
┌──────────────────────────────┐
│ Static / reusable shell      │
│                              │
│ ┌────────────┐ ┌───────────┐ │
│ │ Cached KPI │ │ Cached    │ │
│ │            │ │ Revenue   │ │
│ └────────────┘ └───────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ Dynamic user information │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

The objective is not:

> "Make the whole page static."

The objective is:

> "Make every reusable part reusable while preserving dynamic correctness."

---

# 13. Server Actions Become the Mutation Boundary

Suppose the user changes the subscription.

The mutation flow becomes:

```text
Client
  ↓
Form
  ↓
Server Action
  ↓
Authorization
  ↓
Database / external service
  ↓
State changes
  ↓
Cache invalidation
  ↓
Refresh / navigation synchronization
  ↓
Updated UI
```

The important architectural transition is:

```text
Mutation
```

must be connected to:

```text
Invalidation
```

---

# 14. Mutation Must Not End at the Database

A weak mutation implementation:

```text
updateDatabase()
```

A production mutation should conceptually perform:

```text
validate input
      ↓
authorize
      ↓
perform transaction
      ↓
invalidate affected representations
      ↓
synchronize UI
```

Otherwise:

```text
Database = new state
Cache = old state
UI = old state
```

The system becomes internally inconsistent.

---

# 15. Mutation-to-Cache Mapping

Create explicit mappings.

Example:

```text
Mutation:
Change subscription

Affected:
subscription:org_123
billing:org_123
dashboard:org_123
```

Another:

```text
Mutation:
Rename organization

Affected:
organization:org_123
dashboard:org_123
organization settings
```

Another:

```text
Mutation:
Invite team member

Affected:
team:org_123
dashboard team summary
```

Do not invalidate everything after every mutation.

---

# 16. Tag-Oriented Invalidation

Domain-oriented tags provide a useful abstraction.

For example:

```text
organization:org_123
subscription:org_123
team:org_123
transactions:org_123
revenue:org_123
```

Then:

```text
revalidateTag("subscription:org_123")
```

can target the dependency associated with the subscription.

The benefit is that the mutation does not need to understand every route that happens to consume the data.

---

# 17. Path-Oriented Invalidation

Sometimes the rendered route itself is the right invalidation unit.

For example:

```text
revalidatePath("/dashboard")
```

is useful when a mutation affects the rendered representation of that route.

Path invalidation is therefore useful when reasoning in terms of:

```text
which UI route became obsolete?
```

Tag invalidation is useful when reasoning in terms of:

```text
which domain dependency became obsolete?
```

---

# 18. Tags and Paths Solve Different Problems

Use the following mental distinction:

```text
Tag
 ↓
Data dependency
```

versus:

```text
Path
 ↓
Rendered route
```

A mutation may require both.

For example:

```text
Update organization
        ↓
organization:org_123
        ↓
revalidateTag(...)
        ↓
dashboard representation
        ↓
revalidatePath("/dashboard")
```

The exact implementation depends on the application's cache architecture.

---

# 19. Immediate vs Eventual Consistency

Every cache architecture needs a freshness contract.

Three useful models:

### Strong consistency

```text
Write
 ↓
Read immediately sees new value
```

### Read-after-write consistency

```text
User writes
 ↓
same user's subsequent read
 ↓
sees new value
```

### Eventual consistency

```text
Write
 ↓
cache may temporarily remain stale
 ↓
eventually converges
```

Do not treat these as implementation details.

They are product behavior.

---

# 20. Define a Consistency Budget

Instead of saying:

> "This data should be fresh."

define:

```text
Maximum acceptable staleness = X
```

Examples:

```text
Marketing content
→ minutes/hours acceptable

Revenue dashboard
→ seconds/minutes depending on product requirement

Subscription status
→ very small stale window

Security permissions
→ extremely low tolerance for stale authorization state
```

The business requirement determines the cache strategy.

---

# 21. TTL Is Not Invalidation

TTL answers:

> How long may this representation remain valid without another explicit invalidation?

Invalidation answers:

> What event makes this representation obsolete?

These are different mechanisms.

A system can use:

```text
TTL
+
event-driven invalidation
```

simultaneously.

For example:

```text
TTL = 10 minutes
```

but:

```text
subscription updated
→ immediate invalidation
```

This gives:

```text
bounded stale time
+
fast correction after known mutations
```

---

# 22. Stale-While-Revalidate

A stale representation may sometimes be acceptable if the system refreshes it asynchronously.

Conceptually:

```text
Request
 ↓
stale cache
 ↓
return stale value
 ↓
background regeneration
 ↓
new cache entry
```

This trades:

```text
freshness
```

for:

```text
latency + origin protection
```

This is appropriate only when the product tolerates temporary staleness.

---

# 23. Cache Stampede

Suppose an expensive cache entry expires.

Then:

```text
1,000 requests
      ↓
all miss
      ↓
1,000 origin computations
```

The cache has turned expiration into an origin overload event.

This is a cache stampede.

Mitigation strategies include:

```text
request coalescing
regeneration locking
stale-while-revalidate
TTL jitter
prefetching
rate limiting
origin shielding
```

---

# 24. TTL Jitter

Suppose one million entries all use:

```text
TTL = 60 minutes
```

and are populated around the same time.

They may expire together.

Instead:

```text
TTL = 60m ± random jitter
```

This spreads regeneration load.

The principle:

> Avoid synchronized cache expiration when synchronized regeneration can overload the origin.

---

# 25. Hot Keys

Some cache entries become disproportionately popular.

Example:

```text
global configuration
```

may receive millions of requests.

A single hot key can become a bottleneck.

Possible mitigations include:

```text
replication
local caching
CDN caching
request coalescing
precomputation
partitioning
```

The solution depends on where the bottleneck occurs.

---

# 26. Cache Capacity

A cache is finite.

Therefore:

```text
Working Set
+
Entry Size
+
Access Frequency
+
Eviction Policy
```

determine whether caching actually helps.

A cache with a theoretically high hit ratio can still fail if:

```text
entries churn constantly
```

or:

```text
large entries evict useful entries
```

or:

```text
key cardinality is too high
```

---

# 27. Cache Pollution

A cache can be filled with values that are rarely reused.

Example:

```text
millions of unique user-specific queries
```

can evict:

```text
high-value shared organization data
```

Therefore:

> Caching everything can reduce caching effectiveness.

Cache selectivity matters.

---

# 28. Origin Load Is a First-Class Metric

Do not optimize only:

```text
cache hit ratio
```

Measure:

```text
origin requests
origin CPU
origin DB queries
origin latency
origin error rate
regeneration rate
external API calls
```

A cache should protect the origin.

If:

```text
hit ratio = 95%
```

but:

```text
origin capacity = 10,000 req/s
origin traffic = 15,000 req/s
```

the architecture is still unhealthy.

---

# 29. Weighted Cache Value

Not every request has equal cost.

Consider:

```text
Request A
→ 1 DB query

Request B
→ 20 DB queries + external API call
```

A miss on B is much more expensive.

Therefore, evaluate:

```text
cache effectiveness
```

in terms of:

```text
avoided origin cost
```

not merely:

```text
number of hits
```

---

# 30. Multi-Layer Cache Architecture

A production system may contain:

```text
Browser
   ↓
CDN
   ↓
Next.js rendering/cache layer
   ↓
Data cache
   ↓
Application service
   ↓
Database / external API
```

Each layer has different:

* identity,
* lifetime,
* invalidation mechanism,
* failure behavior.

Therefore:

```text
"the cache"
```

is often an insufficient mental model.

Think:

```text
cache hierarchy
```

---

# 31. The Multi-Layer Invalidation Problem

Suppose:

```text
Database
    ↓
Next.js cache
    ↓
CDN
    ↓
Browser
```

A database mutation may invalidate the Next.js representation but leave:

```text
CDN = stale
Browser = stale
```

Therefore, the architecture must understand every reusable representation.

A correct mutation pipeline may need:

```text
database mutation
      ↓
application cache invalidation
      ↓
rendered representation invalidation
      ↓
CDN behavior
      ↓
client synchronization
```

---

# 32. Multi-Region Considerations

Suppose the application runs in:

```text
US
EU
APAC
```

and a mutation happens in:

```text
EU
```

but cached representations exist in:

```text
US + EU + APAC
```

Then invalidation propagation becomes part of consistency.

Conceptually:

```text
Mutation
   ↓
canonical state
   ↓
invalidation event
   ↓
regional caches
   ↓
eventual convergence
```

You must understand the propagation delay.

---

# 33. Invalidation Is a Distributed-System Operation

A dangerous assumption is:

```text
revalidateTag()
```

means:

```text
every representation everywhere is instantly gone.
```

In distributed systems, invalidation can involve:

```text
propagation
+
ordering
+
retries
+
duplicates
+
delays
+
partial failure
```

Therefore invalidation should be designed as a reliable system behavior.

---

# 34. Idempotent Invalidation

An invalidation operation should ideally tolerate repetition.

For example:

```text
invalidate subscription:org_123
```

being executed twice should not corrupt state.

This matters because distributed systems often produce:

```text
duplicate events
```

or:

```text
retries
```

Therefore:

```text
invalidation should be idempotent
```

whenever possible.

---

# 35. Invalidation Ordering

Consider:

```text
Mutation
 ↓
invalidate cache
 ↓
database commit
```

A race can occur.

A request may regenerate the cache between invalidation and commit.

Safer conceptual ordering:

```text
database transaction
      ↓
commit
      ↓
invalidate affected representations
```

The exact implementation depends on the transaction and event architecture.

The principle is:

> Do not publish a representation invalidation that can cause regeneration from state that has not become authoritative yet.

---

# 36. Transactional Outbox Pattern

For more distributed systems, consider:

```text
Database transaction
│
├── business state update
└── outbox event
```

After commit:

```text
Outbox processor
      ↓
cache invalidation event
      ↓
regional consumers
      ↓
cache invalidation
```

This reduces the risk of:

```text
database committed
+
invalidation event lost
```

---

# 37. External API Caching

Suppose subscription information comes from a payment provider.

A request may be:

```text
Dashboard
 ↓
Next.js
 ↓
Payment API
```

Caching can reduce:

```text
latency
+
API cost
+
rate-limit pressure
```

But external data introduces another freshness dimension.

You must decide:

```text
How stale can the payment status be?
```

A cache is not merely a performance optimization when external API calls are expensive.

It can become a resilience mechanism.

---

# 38. Failure Strategy

What happens if the origin fails?

Possible strategies:

```text
Fail request
```

or:

```text
Serve stale representation
```

or:

```text
Serve degraded representation
```

or:

```text
Fallback to another source
```

The correct choice depends on domain criticality.

For example:

```text
Marketing content
→ stale content may be acceptable

Payment authorization
→ stale data may be dangerous
```

---

# 39. Stale-on-Failure

A resilience-oriented cache may use:

```text
fresh cache
   ↓
origin failure
   ↓
serve stale value
```

This can improve availability.

But the stale window must be bounded.

Otherwise:

```text
temporary fallback
```

can become:

```text
permanently stale production state
```

---

# 40. Cache Failure Must Be Observable

At minimum, track:

```text
cache hit
cache miss
stale serve
regeneration
invalidation
invalidation failure
origin fallback
cache latency
origin latency
entry age
```

For production debugging, correlate:

```text
request ID
+
mutation ID
+
cache key/tag
+
invalidation event
+
render
```

This lets you answer:

> "The user changed X, but still sees Y. Where did the old representation survive?"

---

# 41. Production Debugging Matrix

| Symptom                          | Likely area                 |
| -------------------------------- | --------------------------- |
| Database updated, UI stale       | invalidation                |
| Some routes stale                | incomplete dependency graph |
| Only one region stale            | propagation                 |
| Cache misses spike               | capacity/key churn          |
| Origin CPU spikes after expiry   | stampede                    |
| Wrong user's data appears        | cache identity/security     |
| External API rate limits         | insufficient caching        |
| UI updates only after navigation | refresh synchronization     |
| Cache always misses              | fragmented key              |
| Cache grows rapidly              | high cardinality            |
| Old data persists indefinitely   | broken invalidation/TTL     |
| Random stale results             | race/order issue            |

This matrix should become part of your debugging workflow.

---

# 42. End-to-End Architecture

A production architecture can conceptually look like:

```text
                         ┌───────────────────┐
                         │      Browser      │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │       CDN         │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │     Next.js       │
                         │ Rendering Layer   │
                         └─────────┬─────────┘
                                   │
                ┌──────────────────┼──────────────────┐
                │                  │                  │
                ▼                  ▼                  ▼
          Shared Data        Dynamic Data       Server Action
             Cache              Reads               Mutations
                │                  │                  │
                └──────────┬───────┘                  │
                           ▼                          ▼
                    Application Services       DB Transaction
                           │                          │
                           ▼                          ▼
                    Origin Systems              Commit State
                                                      │
                                                      ▼
                                             Cache Invalidation
                                                      │
                                                      ▼
                                            Revalidation / Refresh
                                                      │
                                                      ▼
                                                Updated UI
```

This is the architecture you should be able to explain verbally in an SDE-2 interview.

---

# 43. Full Mutation Example

Imagine:

```text
Admin changes subscription
from Pro → Enterprise
```

The complete flow:

```text
1. User submits form
        ↓
2. Server Action receives FormData
        ↓
3. Validate input
        ↓
4. Authenticate user
        ↓
5. Authorize organization admin role
        ↓
6. Update billing state
        ↓
7. Commit transaction
        ↓
8. Invalidate subscription dependency
        ↓
9. Invalidate affected dashboard representation
        ↓
10. Synchronize UI
        ↓
11. Dashboard reads new state
```

The architecture must prevent:

```text
DB = Enterprise
Cache = Pro
UI = Pro
```

from persisting beyond the allowed consistency window.

---

# 44. Full Read Example

User loads dashboard:

```text
Request
 ↓
CDN?
 ↓
Next.js rendering
 ↓
organization cache
 ↓
subscription cache
 ↓
metrics cache
 ↓
dynamic user data
 ↓
compose response
 ↓
stream/render
 ↓
browser
```

Each dependency may have a different policy.

For example:

```text
Organization:
shared + moderately cached

Subscription:
shared within organization + short freshness

Metrics:
shared + short freshness

User:
dynamic

Notifications:
dynamic / frequently refreshed
```

This is better than one blanket:

```text
cache = 60 seconds
```

policy.

---

# 45. Architecture Decision Framework

For every piece of data ask:

### Question 1 — Is it reusable?

```text
No
→ do not share the representation.

Yes
→ continue.
```

### Question 2 — What is its identity?

```text
global
organization
user
role
locale
region
feature configuration
```

### Question 3 — How fresh must it be?

```text
seconds
minutes
hours
indefinite until invalidation
```

### Question 4 — What invalidates it?

```text
mutation
deployment
content change
time
external event
```

### Question 5 — What happens if origin fails?

```text
error
stale
degraded
fallback
```

### Question 6 — How expensive is regeneration?

```text
cheap
moderate
expensive
external API
```

### Question 7 — What is the capacity impact?

```text
key cardinality
entry size
working set
eviction
hot keys
```

### Question 8 — How will we observe it?

```text
hit/miss
latency
age
regeneration
invalidation
origin load
```

---

# 46. Scenario Exercise 1 — Organization Name

Requirement:

> Organization name may be stale for up to five minutes.

Architecture:

```text
Key:
organization:{orgId}

TTL:
≈ 5 minutes

Invalidation:
organization mutation
```

The representation can be shared across users in the organization.

---

# 47. Scenario Exercise 2 — Current User

Requirement:

> User-specific profile information must never be served to another user.

Architecture:

```text
Identity:
userId

Scope:
user-specific

Security:
strict isolation
```

Do not accidentally use:

```text
"profile"
```

as a globally reusable cache identity.

---

# 48. Scenario Exercise 3 — Revenue Metrics

Requirement:

> Dashboard metrics may be up to 60 seconds stale.

Architecture:

```text
Key:
revenue:{orgId}:{period}

TTL:
≈ 60 seconds

Optional invalidation:
metric-producing events
```

Because metrics may be expensive to compute, caching can protect the analytics origin.

---

# 49. Scenario Exercise 4 — Subscription Status

Requirement:

> After a successful plan change, the initiating user should see the new plan immediately.

This introduces:

```text
read-after-write
```

requirements.

Therefore:

```text
mutation
 ↓
commit
 ↓
invalidate subscription
 ↓
refresh affected UI
```

A generic five-minute TTL alone is insufficient.

---

# 50. Scenario Exercise 5 — Notifications

Requirement:

> Notifications should appear quickly and are user-specific.

This may justify:

```text
dynamic reads
```

rather than aggressive shared caching.

The architecture should not force caching merely because caching is available.

---

# 51. Scenario Exercise 6 — Global Configuration

Requirement:

> Configuration is identical for every user and changes infrequently.

This is a strong caching candidate.

Possible layers:

```text
CDN
+
application cache
+
data cache
```

But invalidation should still exist:

```text
configuration changed
 ↓
invalidate configuration
 ↓
new representation
```

---

# 52. Scenario Exercise 7 — Personalized Dashboard

Requirement:

> Dashboard contains 90% shared information and 10% user-specific information.

Bad architecture:

```text
Cache entire dashboard per user
```

Potential consequences:

```text
huge cardinality
cache fragmentation
memory pressure
low reuse
```

Better conceptual architecture:

```text
shared cached regions
+
dynamic personalized region
```

---

# 53. Scenario Exercise 8 — Cache Stampede

Requirement:

> A report takes 4 seconds to generate and 10,000 users request it simultaneously.

Naive behavior:

```text
cache expires
 ↓
10,000 misses
 ↓
10,000 report computations
```

Production architecture should consider:

```text
single regeneration
+
request coalescing
+
stale-while-revalidate
```

The goal is:

```text
10,000 requests
→
1 expensive regeneration
+
many consumers
```

---

# 54. Scenario Exercise 9 — Multi-Region Invalidation

Requirement:

> A mutation in Europe must eventually invalidate representations in US and APAC.

Architecture:

```text
Mutation
 ↓
canonical commit
 ↓
invalidation event
 ↓
regional consumers
 ↓
regional invalidation
```

Now measure:

```text
invalidation propagation latency
```

because that becomes part of the consistency contract.

---

# 55. Scenario Exercise 10 — External API Failure

Requirement:

> Payment provider is temporarily unavailable.

Question:

> Should the application serve cached subscription state?

Answer depends on the operation.

For:

```text
displaying historical billing information
```

stale data may be acceptable.

For:

```text
authorizing a sensitive billing operation
```

stale information may be unsafe.

Therefore:

> Cache policy is domain-specific, not merely performance-specific.

---

# 56. Cache Architecture Anti-Patterns

## Anti-Pattern 1 — Cache Everything

Why it fails:

```text
high cardinality
+
memory pressure
+
stale data
+
complex invalidation
```

---

## Anti-Pattern 2 — Invalidate Everything

Example:

```text
every mutation
→
revalidate entire application
```

Why it fails:

```text
cache churn
+
origin load
+
poor hit ratio
```

---

## Anti-Pattern 3 — TTL Only

Why it fails:

A known mutation may make data stale immediately, while TTL allows it to remain stale.

---

## Anti-Pattern 4 — No TTL, Invalidation Only

Why it fails:

If invalidation fails, stale entries may persist indefinitely.

---

## Anti-Pattern 5 — User Data in Shared Cache

Why it fails:

Potential cross-user data exposure.

---

## Anti-Pattern 6 — Treating Rendering and Caching as Identical

Why it fails:

A dynamic route can still contain reusable cached dependencies.

---

## Anti-Pattern 7 — Optimizing Hit Ratio Alone

Why it fails:

A hit ratio says nothing directly about:

```text
origin cost
+
latency
+
entry size
+
business importance
```

---

## Anti-Pattern 8 — No Invalidation Observability

Why it fails:

When users report stale data, the team cannot determine:

```text
which representation survived
```

or:

```text
which invalidation failed
```

---

# 57. Production Invariants

A senior engineer should define invariants.

### Invariant 1

```text
No user-specific representation may be served to another user.
```

### Invariant 2

```text
Successful mutations eventually invalidate all affected reusable representations.
```

### Invariant 3

```text
Cache invalidation must not expose uncommitted state.
```

### Invariant 4

```text
Origin load remains within operational capacity.
```

### Invariant 5

```text
Known mutation events reduce stale windows according to the product contract.
```

### Invariant 6

```text
Cache failures degrade according to domain-specific availability rules.
```

### Invariant 7

```text
Cache behavior is observable.
```

---

# 58. Testing Strategy

Caching architecture requires more than unit tests.

Test:

```text
cache hit
cache miss
TTL expiration
explicit invalidation
mutation → invalidation
mutation → UI synchronization
concurrent requests
stampede protection
multi-user isolation
multi-tenant isolation
regional propagation
origin failure
stale fallback
external API failure
```

---

# 59. Mutation Integration Test

A critical test:

```text
1. Seed old state
2. Populate cache
3. Perform mutation
4. Verify database
5. Verify invalidation
6. Request representation
7. Verify new state
```

This catches:

```text
database updated
but cache remained stale
```

---

# 60. Security Test

Create:

```text
User A
User B
```

Populate:

```text
User A representation
```

Then request through:

```text
User B
```

Verify:

```text
User B never receives User A data.
```

This should be an explicit automated test for security-sensitive cached data.

---

# 61. Load Test

Measure:

```text
baseline origin load
cache enabled origin load
cache disabled origin load
expiration spike
concurrent regeneration
hot-key traffic
```

You want to understand:

```text
cache → origin protection
```

rather than merely:

```text
cache → faster response
```

---

# 62. Observability Dashboard

A production dashboard should expose:

```text
Cache Hit Ratio
Cache Miss Ratio
Origin Request Rate
Origin Latency
Cache Latency
Regeneration Rate
Invalidation Rate
Invalidation Failures
Average Entry Age
Stale Serve Rate
Hot Keys
Eviction Rate
Cache Memory Utilization
External API Call Reduction
```

For critical systems also expose:

```text
Mutation → Invalidation latency
Invalidation → Fresh Read latency
```

These measure the actual consistency pipeline.

---

# 63. The Most Important Debugging Question

When someone says:

> "I updated the data, but the page still shows the old value."

Do not immediately change random caching configuration.

Trace:

```text
1. Did the mutation commit?
        ↓
2. Which data dependency changed?
        ↓
3. Which cache entries depend on it?
        ↓
4. Which tags identify those entries?
        ↓
5. Which paths render them?
        ↓
6. Was invalidation triggered?
        ↓
7. Did invalidation propagate?
        ↓
8. Did the UI refresh/re-render?
        ↓
9. Is another cache layer still serving old data?
```

This is the senior debugging model.

---

# 64. SDE-2 Prediction Challenge 1

### Situation

A dashboard cache hit ratio is 98%.

Yet database CPU remains extremely high.

### Predict the likely explanations.

Possible reasoning:

```text
98% hit ratio
```

does not necessarily mean:

```text
98% of database cost disappeared.
```

Potential causes:

```text
misses are extremely expensive
+
uncached requests are concentrated on expensive queries
+
one cache entry avoids cheap requests
+
another expensive dependency is uncached
```

---

# 65. SDE-2 Prediction Challenge 2

### Situation

After a deployment, cache hit ratio drops dramatically.

### What should you investigate?

```text
cache key changes
+
serialization changes
+
cache namespace/version changes
+
rendering changes
+
dependency changes
+
cold cache population
```

Do not assume the cache infrastructure itself failed.

---

# 66. SDE-2 Prediction Challenge 3

### Situation

After a subscription mutation:

```text
Database = Enterprise
UI = Pro
```

What is the first architectural question?

Not:

> "Should we reduce the TTL?"

Instead:

```text
What representation is still serving Pro?
```

Then trace:

```text
subscription cache
+
dashboard cache
+
rendered route
+
CDN
+
client state
```

---

# 67. SDE-2 Prediction Challenge 4

### Situation

Only some users see stale data.

This strongly suggests investigating:

```text
cache identity
+
key cardinality
+
request context
+
regional routing
+
authorization context
```

rather than assuming global invalidation failure.

---

# 68. SDE-2 Prediction Challenge 5

### Situation

Origin traffic spikes every hour at exactly the same minute.

Potential clue:

```text
synchronized TTL expiration
```

Investigate:

```text
TTL synchronization
+
regeneration
+
cache warming
```

TTL jitter may reduce the synchronized load.

---

# 69. SDE-2 Prediction Challenge 6

### Situation

Memory usage grows after introducing per-user caching.

Likely investigation:

```text
key cardinality
+
entry size
+
working set
+
eviction behavior
+
low reuse
```

The first response should not simply be:

```text
increase cache memory
```

---

# 70. Senior Interview Gotcha 1

### Question

> Is caching a page the same as caching its data?

Correct conceptual answer:

No.

You can cache:

```text
data
```

without caching:

```text
rendered page
```

and you can have:

```text
dynamic rendering
```

while still reusing:

```text
cached data dependencies
```

---

# 71. Senior Interview Gotcha 2

### Question

> Why not use a five-minute TTL for everything?

Because freshness requirements differ.

Examples:

```text
marketing content
→ 5 minutes may be fine

subscription authorization
→ 5 minutes may be unacceptable

notifications
→ 5 minutes may be poor UX

analytics
→ 5 minutes may be acceptable
```

TTL is a product/system decision.

---

# 72. Senior Interview Gotcha 3

### Question

> Why isn't a high cache hit ratio enough?

Because:

```text
hit ratio
```

does not capture:

```text
cost avoided
+
origin load
+
latency
+
tail latency
+
entry size
+
cache churn
```

---

# 73. Senior Interview Gotcha 4

### Question

> What should happen after a successful mutation?

The answer should include:

```text
commit authoritative state
+
invalidate affected representations
+
synchronize the UI
```

not simply:

```text
update database
```

---

# 74. Senior Interview Gotcha 5

### Question

> When should you not cache?

Examples:

```text
highly sensitive information
+
extremely low reuse
+
very high cardinality
+
freshness requirements too strict
+
security-sensitive authorization state
+
cheap origin computation
```

Caching is an optimization, not a requirement.

---

# 75. Capstone Architecture Exercise

Design the following application:

```text
Multi-tenant SaaS dashboard
```

Requirements:

```text
1. Organization data shared within tenant
2. User data private to user
3. Revenue metrics can be 60 seconds stale
4. Subscription updates must appear immediately after mutation
5. Team membership changes invalidate team views
6. External billing API has rate limits
7. Dashboard must survive temporary analytics-origin failure
8. Application runs in multiple regions
9. Expensive reports must avoid stampedes
10. Cache behavior must be observable
```

Your architecture should explicitly specify:

```text
Cache identity
Cache lifetime
Invalidation mechanism
Rendering strategy
Mutation flow
Failure strategy
Consistency model
Capacity strategy
Observability
```

---

# 76. Expected Architecture

A reasonable conceptual design:

```text
Organization
→ organization:{orgId}
→ shared cache
→ mutation-driven invalidation

Subscription
→ subscription:{orgId}
→ short freshness
→ immediate invalidation after mutation

Revenue
→ revenue:{orgId}:{period}
→ ~60s freshness
→ expensive computation protected by caching

Team
→ team:{orgId}
→ organization-scoped
→ invalidated after membership mutation

Current User
→ user-specific dynamic representation

Notifications
→ dynamic / short-lived user-specific data

Reports
→ cache expensive results
→ regeneration protection
→ stale-while-revalidate where acceptable
```

---

# 77. Complete Mutation Architecture

For subscription:

```text
Form
 ↓
Server Action
 ↓
Validate
 ↓
Authenticate
 ↓
Authorize
 ↓
Billing mutation
 ↓
DB commit
 ↓
Invalidate subscription
 ↓
Invalidate affected dashboard representations
 ↓
Refresh/navigation synchronization
 ↓
New UI
```

For team membership:

```text
Server Action
 ↓
DB transaction
 ↓
Invalidate team:{orgId}
 ↓
Invalidate affected views
 ↓
UI synchronization
```

---

# 78. Complete Read Architecture

```text
Request
 ↓
Rendering boundary
 ↓
Shared cached dependencies
 ├── organization
 ├── subscription
 ├── revenue
 └── team
 ↓
Dynamic dependencies
 ├── current user
 └── notifications
 ↓
Compose representation
 ↓
Stream/render
 ↓
Browser
```

---

# 79. Failure Architecture

For analytics:

```text
Analytics origin failure
        ↓
cached metrics available?
        │
       YES
        ↓
serve stale metrics
        ↓
record stale-serving metric
```

For billing authorization:

```text
Billing origin failure
        ↓
do not blindly trust stale state
        ↓
apply domain-specific safety policy
```

This demonstrates that cache fallback is not universally appropriate.

---

# 80. Architecture Review Checklist

Before shipping, ask:

### Identity

* What uniquely identifies the cached representation?
* Could two users receive the same cache entry?
* Are tenant boundaries encoded?

### Freshness

* What is the maximum acceptable staleness?
* Is TTL sufficient?
* What events require immediate invalidation?

### Invalidation

* Which mutations affect this data?
* Are tags domain-oriented?
* Which routes depend on the data?
* Is path invalidation necessary?

### Rendering

* What is static?
* What is dynamic?
* Which regions are reusable?
* Which dependencies require request context?

### Performance

* What is the hit ratio?
* What is origin load?
* Are there hot keys?
* Can expiration cause a stampede?

### Capacity

* What is cache cardinality?
* How large are entries?
* What is the working set?
* What eviction behavior occurs?

### Reliability

* What happens if cache infrastructure fails?
* What happens if origin fails?
* Can stale data be served safely?

### Distributed Systems

* How does invalidation propagate?
* Can invalidation be duplicated?
* What happens if an event is lost?
* What is the propagation delay?

### Observability

* Can you see hits and misses?
* Can you trace invalidation?
* Can you correlate mutation → invalidation → read?
* Can you identify stale-serving events?

---

# 81. KPI 06 Unified Mental Model

You should now be able to reason through the entire system as:

```text
                    ┌───────────────┐
                    │ Domain State  │
                    └───────┬───────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │ Dependencies     │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Cache Identity   │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Lifetime / TTL   │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Rendering        │
                  │ Boundary         │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Cached           │
                  │ Representation   │
                  └────────┬─────────┘
                           │
                           ▼
                      ┌─────────┐
                      │Mutation │
                      └────┬────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Commit State     │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Invalidation     │
                  │ Tags / Paths     │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Revalidation /   │
                  │ Refresh          │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Updated UI       │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Observability    │
                  └──────────────────┘
```

---

# 82. What You Must Be Able to Explain Without Documentation

For SDE-2-level independence, you should be able to answer these from first principles:

1. What exactly is being cached?
2. Where is it cached?
3. What makes two requests equivalent?
4. What is the cache identity?
5. What makes the representation stale?
6. What is the maximum acceptable stale window?
7. What invalidates it?
8. Why use tags versus paths?
9. What happens after a Server Action mutation?
10. How does the UI learn about the new state?
11. What happens when invalidation fails?
12. What happens when the origin fails?
13. How do you prevent a cache stampede?
14. How do you prevent cache fragmentation?
15. How do you prevent cross-user data leakage?
16. How does multi-region invalidation work?
17. How do you measure cache effectiveness?
18. How do you debug stale UI?
19. How do you test cache correctness?
20. How do you defend the architecture under load?

If you cannot answer these, you do not yet own the caching architecture.

---

# 83. KPI 06 Completion Criteria

KPI 06 is complete when you can independently:

### Caching Fundamentals

* Explain cache identity.
* Explain cache lifetime.
* Explain invalidation.
* Explain staleness.
* Distinguish memoization from persistent caching.

### Next.js Architecture

* Reason about Next.js cache layers.
* Reason about static and dynamic rendering.
* Reason about Server Components and Client Components.
* Reason about Cache Components / partial prerendering concepts.
* Use cache tags and paths intentionally.

### Mutation Integration

* Connect Server Actions to cache invalidation.
* Model mutation-to-cache dependencies.
* Preserve read-after-write requirements.
* Synchronize UI after mutations.

### Distributed Systems

* Explain eventual consistency.
* Handle invalidation propagation.
* Handle cache stampedes.
* Handle hot keys.
* Handle cache failure.
* Reason about multi-region behavior.

### Performance

* Analyze cache hit/miss behavior.
* Analyze origin load.
* Analyze cache capacity.
* Analyze key cardinality.
* Control regeneration pressure.

### Security

* Prevent cross-user cache leakage.
* Preserve tenant isolation.
* Avoid caching unsafe authorization state.
* Include security-relevant identity in cache boundaries.

### Observability

* Instrument cache behavior.
* Trace invalidation.
* Measure stale windows.
* Correlate mutation and subsequent reads.
* Debug stale representations systematically.

### Architecture

* Design a complete cache hierarchy.
* Explain why each data dependency is cached or not cached.
* Defend TTL choices.
* Defend invalidation choices.
* Explain failure behavior.
* Explain consistency guarantees.

---

# 84. KPI 06 Final Principle

The most important principle of this KPI is:

> **Caching is not the act of storing data somewhere faster. It is the controlled reuse of a representation under an explicit identity, freshness, consistency, invalidation, capacity, and failure contract.**

At SDE-2 level, you should stop asking:

```text
"How do I cache this?"
```

and start asking:

```text
"What representation is reusable?"

"Under what identity?"

"For how long?"

"Which dependencies make it valid?"

"What event makes it obsolete?"

"How does invalidation propagate?"

"What happens if the cache is wrong?"

"What happens if the origin is unavailable?"

"How much origin load does this architecture actually remove?"
```

That is the transition from **using caching APIs** to **designing caching architecture**.

---

# 85. KPI 06 Locked Boundary

This KPI has now moved from individual mechanisms to complete architecture.

The conceptual progression is:

```text
Cache Fundamentals
        ↓
Cache Control
        ↓
Explicit Revalidation
        ↓
Rendering / Cache Boundaries
        ↓
Mutation Integration
        ↓
Invalidation Architecture
        ↓
Consistency
        ↓
Performance / Capacity
        ↓
Cache Layers / Rendering Architecture
        ↓
Full-Stack Cache Architecture
```

The next KPI should therefore build on the completed caching architecture rather than repeat cache mechanics.

---

# KPI 06 STATUS

**Caching & Revalidation Architecture — COMPLETE**

You should now be able to treat caching as a **full-stack distributed-system concern** spanning:

```text
Data
+
Rendering
+
Mutations
+
Invalidation
+
Consistency
+
Performance
+
Reliability
+
Security
+
Observability
```

**End of KPI 06.**
