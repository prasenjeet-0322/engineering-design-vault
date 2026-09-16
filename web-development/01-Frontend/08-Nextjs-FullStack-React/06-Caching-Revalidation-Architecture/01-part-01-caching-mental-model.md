# Level 08 — Next.js & Full-Stack React

# KPI 06 — Caching & Revalidation Architecture

## Part 01 — Next.js Caching Mental Model & Cache Architecture

---

# 1. Part Objective

This part establishes the **mental model for caching in Next.js**.

The goal is not to memorize APIs such as:

```ts
revalidate
revalidatePath
revalidateTag
cache
unstable_cache
```

The senior-level objective is to understand:

> **What exactly is being cached, where is it cached, what determines whether it is reusable, and what event makes that cached result invalid?**

A production Next.js application can contain several distinct forms of cached state:

```text
Browser
   ↓
CDN / Edge
   ↓
Next.js rendering/data infrastructure
   ↓
Application process
   ↓
Database / external API
```

Caching becomes difficult when engineers treat all of these layers as if they were one cache.

They are not.

---

# 2. Industry Frequency & Framework Relevance

| Concept | Frequency | Senior Importance |
|---|---|
| HTTP/browser caching | 🟢 Daily Driver | Very High |
| CDN caching | 🟢 Daily Driver | Very High |
| Server-side data reuse | 🟢 Daily Driver | Very High |
| Next.js route/data caching | 🟢 Daily Driver | Very High |
| Revalidation | 🟢 Daily Driver | Very High |
| Cache invalidation | 🟢 Daily Driver | Extremely High |
| Cache tags | 🟡 Moderate | High |
| Cache topology | 🟡 Moderate | Extremely High |
| Distributed cache consistency | 🟡 Moderate | High |
| Framework internals | 🔵 Foundational / Engine Internals | Medium–High |

The most important production concept is:

> **Caching is a correctness decision before it is a performance optimization.**

---

# 3. Why Caching Is an Architectural Problem

Suppose your application displays:

```text
Product
Name: MacBook Pro
Price: $2,000
Inventory: 3
```

The server retrieves:

```text
Product
    ↓
Database
```

Without caching:

```text
Request
   ↓
Server
   ↓
Database
   ↓
Response
```

With caching:

```text
Request
   ↓
Cache
   ├── HIT  → return cached result
   │
   └── MISS
        ↓
      Database
        ↓
      Store result
        ↓
      Return result
```

This improves performance.

But now introduce:

```text
Admin changes price
```

The database contains:

```text
$1,800
```

while the cache contains:

```text
$2,000
```

Now the system has two truths:

```text
Database
$1,800
    │
    │
    └────── conflict ──────┐
                           ↓
                        Cache
                        $2,000
```

Therefore:

> **Every cache introduces a consistency problem.**

That is the central idea of this KPI.

---

# 4. The Fundamental Cache Model

A cache can be modeled as:

```text
                 ┌─────────────────┐
Request ────────►│ Cache Lookup    │
                 └────────┬────────┘
                          │
                    ┌─────┴─────┐
                    │           │
                   HIT         MISS
                    │           │
                    ↓           ↓
               Cached Data    Source
                                │
                                ↓
                           Fresh Data
                                │
                                ↓
                           Cache Result
                                │
                    ┌───────────┘
                    ↓
                 Response
```

There are therefore several independent questions:

### Question 1

**What is the cache key?**

### Question 2

**What data does the cached value represent?**

### Question 3

**How long can that value be reused?**

### Question 4

**What invalidates it?**

### Question 5

**Who is allowed to observe the cached value?**

### Question 6

**What happens during a cache miss?**

### Question 7

**What happens when the underlying data changes?**

A senior engineer thinks about all seven.

---

# 5. Cache Key

A cache is only useful if the system can determine:

> "Have I already computed this exact thing?"

For example:

```text
/products/123
```

might represent:

```text
Product #123
```

The cache key could conceptually be:

```text
product:123
```

For localized content:

```text
product:123:en-US
product:123:fr-FR
```

For user-specific data:

```text
user:42:orders
```

Now imagine incorrectly using:

```text
orders
```

for all users.

You have created a catastrophic isolation bug:

```text
User A
   ↓
orders
   ↓
cached result

User B
   ↓
orders
   ↓
receives User A's result
```

Therefore:

> **Cache-key design is also a data-isolation problem.**

---

# 6. Cache Key Dimensions

A cache key must contain every dimension that changes the result.

Suppose:

```ts
getProducts({
  category,
  locale,
  currency,
  page,
});
```

The result depends on:

```text
category
locale
currency
page
```

Therefore the logical cache key needs to distinguish:

```text
products:electronics:en-US:USD:1
products:electronics:en-US:USD:2
products:electronics:de-DE:EUR:1
```

If a meaningful input is missing:

```text
products:electronics
```

then unrelated requests may share a result incorrectly.

---

# 7. Cache Identity vs Data Identity

These are different concepts.

Consider:

```text
Product #42
```

The product identity is:

```text
42
```

But a rendered result may depend on:

```text
product
+
locale
+
currency
+
permissions
+
feature flags
```

Therefore:

```text
Entity identity
      ≠
Rendered-result identity
```

This distinction becomes extremely important in Next.js applications.

---

# 8. Cache Scope

A cache also has a scope.

Possible scopes include:

```text
Component
Request
Server process
Application
Region
CDN
Browser
User
Tenant
```

Visualize:

```text
                 Global
                   │
              ┌────┴────┐
              │   CDN   │
              └────┬────┘
                   │
             Application
                   │
            ┌──────┴──────┐
            │             │
         Request       Process
            │
         Component
```

A value cached globally has very different correctness requirements from a value cached only for one request.

---

# 9. Request-Level Reuse vs Persistent Caching

These concepts must not be confused.

## Request-level reuse

Multiple operations during one request can reuse work.

Conceptually:

```text
Request
 ├── Component A ──┐
 ├── Component B ──┼── same data
 └── Component C ──┘
```

The framework may avoid performing equivalent work repeatedly.

This is fundamentally different from storing a result for future requests.

---

## Persistent caching

The result survives beyond the current request:

```text
Request 1
   ↓
Compute
   ↓
Cache
   ↓
Request 2
   ↓
Reuse cached result
```

The distinction matters because:

```text
request deduplication
```

does not automatically mean:

```text
persistent application caching
```

---

# 10. Data Cache vs Full Render Result

A critical architectural distinction is:

```text
Data
```

versus:

```text
Rendered output
```

For example:

```text
Database
   ↓
Product data
   ↓
React rendering
   ↓
HTML / RSC payload
```

Caching the product data is not necessarily the same thing as caching the rendered page.

Conceptually:

```text
             Database
                 │
                 ↓
          ┌─────────────┐
          │ Data Cache  │
          └──────┬──────┘
                 │
                 ↓
             Rendering
                 │
                 ↓
          ┌─────────────┐
          │ Route/Page  │
          │   Result    │
          └─────────────┘
```

A senior engineer must ask:

> "Am I caching the underlying data, the rendered result, or both?"

---

# 11. Cache Layers

A realistic production architecture can contain:

```text
Browser Cache
      ↓
CDN Cache
      ↓
Framework Cache
      ↓
Application Cache
      ↓
Database
```

Each layer may have different:

* TTL
* invalidation
* consistency
* ownership
* geographic scope
* failure behavior

Therefore:

```text
"Clear the cache"
```

is not a sufficiently precise production statement.

The correct question is:

> **Which cache?**

---

# 12. TTL — Time-Based Expiration

A simple caching strategy is:

```text
Store result
   ↓
Reuse for 60 seconds
   ↓
Expire
   ↓
Fetch fresh result
```

This is TTL:

```text
Time To Live
```

Example:

```text
TTL = 60 seconds
```

means the system permits reuse for a bounded period.

But TTL does not answer:

> "What happens if the underlying data changes after 5 seconds?"

That is why time-based invalidation alone is often insufficient.

---

# 13. TTL Is a Freshness Policy

Suppose:

```text
Product price
```

has:

```text
TTL = 1 hour
```

A price update occurs after:

```text
5 minutes
```

The cache may still contain:

```text
old price
```

for the remaining:

```text
55 minutes
```

Therefore:

```text
TTL
```

is not equivalent to:

```text
correct freshness
```

It is a policy defining how stale the application is willing to be.

---

# 14. Freshness vs Correctness

These are related but different.

### Freshness

How recently was the data generated?

### Correctness

Does the data accurately represent the state the user is entitled to observe?

For public product descriptions:

```text
30-second staleness
```

may be acceptable.

For:

```text
bank balance
```

it may not be.

Therefore:

```text
Cacheability
=
business tolerance for staleness
+
data isolation
+
invalidation strategy
+
failure behavior
```

---

# 15. Cache Invalidation

The classic engineering problem:

> **How do you tell a cache that its value is no longer valid?**

Suppose:

```text
Product #42
```

is cached.

Then:

```text
Update Product #42
```

occurs.

The system must establish:

```text
Mutation
   ↓
Database update
   ↓
Invalidate affected cached representation
   ↓
Next read
   ↓
Fresh value
```

Without invalidation:

```text
Database = new
Cache = old
```

---

# 16. Invalidation Is a Dependency Problem

Suppose:

```text
Product #42
```

appears in:

```text
/product/42
/category/laptops
/search?q=macbook
/home
/recommendations
```

Changing Product #42 potentially affects multiple cached representations.

Therefore:

```text
Product #42
      │
      ├── /product/42
      ├── /category/laptops
      ├── /search?q=macbook
      ├── /home
      └── recommendations
```

The invalidation problem becomes:

> **Which cached outputs depend on this changed entity?**

This is why senior cache architecture resembles dependency-graph design.

---

# 17. Path-Based Invalidation

One strategy is:

```text
Invalidate:
 /products/42
```

The cache system associates the cached representation with a route/path.

Conceptually:

```text
Mutation
   ↓
Product #42 updated
   ↓
Invalidate /products/42
   ↓
Next request
   ↓
Recompute
```

This works well when the dependency is strongly associated with a route.

But it becomes harder when the same entity contributes to many routes.

---

# 18. Tag-Based Invalidation

Another strategy is to associate cached data with semantic tags.

Conceptually:

```text
Product #42
     │
     ├── tag: product:42
     │
     ├── tag: category:laptops
     │
     └── tag: catalog
```

Then:

```text
Update Product #42
       ↓
Invalidate product:42
       ↓
All associated cached entries
       ↓
become stale/revalidated
```

This is powerful because it separates:

```text
Where data appears
```

from:

```text
What data it represents
```

---

# 19. Path vs Tag

| Strategy            | Best For                                   | Weakness                               |
| ------------------- | ------------------------------------------ | -------------------------------------- |
| Path                | Route-specific invalidation                | Poor for shared data dependencies      |
| Tag                 | Entity/domain-based invalidation           | Requires disciplined tag design        |
| TTL                 | Data where bounded staleness is acceptable | Doesn't react immediately to mutations |
| Manual invalidation | Explicit business events                   | Can become difficult to maintain       |

A production architecture may use multiple strategies.

---

# 20. Mutation → Invalidation Architecture

The general architecture should look like:

```text
             USER ACTION
                  │
                  ↓
          Server-side mutation
                  │
                  ↓
          Authorization
                  │
                  ↓
          Database transaction
                  │
                  ↓
        ┌─────────────────────┐
        │ Successful mutation │
        └──────────┬──────────┘
                   ↓
          Cache invalidation
             ┌─────┴─────┐
             ↓           ↓
         Path-based   Tag-based
             │           │
             └─────┬─────┘
                   ↓
             Fresh future
               requests
```

The key ordering is:

```text
Persist
  ↓
Invalidate
```

not:

```text
Invalidate
  ↓
Persist
```

unless you intentionally design for a different consistency model.

---

# 21. Why Invalidate Before the Database Update Can Be Dangerous

Suppose:

```text
Cache = $2,000
Database = $2,000
```

Mutation begins:

```text
Invalidate cache
```

Then:

```text
Database update fails
```

Now:

```text
Cache = missing
Database = $2,000
```

The next request can regenerate the correct value, so this may be recoverable.

But the reverse problem can be more dangerous:

```text
Database update succeeds
Cache invalidation fails
```

Now:

```text
Database = $1,800
Cache = $2,000
```

The application may serve stale data.

Therefore cache invalidation should be treated as part of the mutation's consistency design.

---

# 22. Cache Invalidation Failure

A senior engineer must explicitly ask:

> "What if the database mutation succeeds but cache invalidation fails?"

Possible strategies include:

```text
Mutation
   ↓
DB commit
   ↓
Invalidate
   ↓
Success
```

with:

```text
retry
event queue
background invalidation
version checks
short TTL
```

as resilience mechanisms.

A critical principle:

> **Cache is usually derived state; the database or authoritative domain store should remain the source of truth.**

---

# 23. Cache Stampede

Consider:

```text
Popular page
```

with:

```text
1,000 requests/second
```

The cached value expires.

Now all 1,000 requests see:

```text
MISS
```

and attempt:

```text
Database query
```

simultaneously.

Architecture:

```text
          Cache expires
                │
        ┌───────┼───────┐
        ↓       ↓       ↓
      Req 1   Req 2   Req 3 ... Req 1000
        │       │       │
        └───────┼───────┘
                ↓
           Database
          1000 queries
```

This is a cache stampede.

---

# 24. Cache Stampede Mitigation

Common approaches include:

### Request coalescing

Allow one request to populate the cache while others wait.

```text
1000 requests
      ↓
1 regeneration
      ↓
cached result
      ↓
1000 responses
```

### Stale-while-revalidate

Serve an existing stale value while refreshing it in the background.

```text
Request
  ↓
Stale cache
  ├── return stale value
  │
  └── refresh asynchronously
```

### Jittered expiration

Avoid synchronizing expirations across large populations.

### Prewarming

Populate frequently accessed cache entries before traffic arrives.

---

# 25. Cache Penetration

Another problem occurs when requests repeatedly ask for data that does not exist.

Example:

```text
/product/999999999
```

Database result:

```text
NOT FOUND
```

If `NOT FOUND` is never cached:

```text
Request
 ↓
Cache MISS
 ↓
Database
 ↓
NOT FOUND
```

repeats indefinitely.

This can create unnecessary load.

One mitigation is carefully caching negative results:

```text
product:999999999
      ↓
NOT FOUND
      ↓
short TTL
```

But this must be designed carefully because a resource could be created later.

---

# 26. Cache Poisoning

A cache can also become a security boundary.

Suppose a response depends on:

```text
Authorization
```

but the cache key does not.

Then:

```text
User A
   ↓
Authenticated response
   ↓
Cache
```

followed by:

```text
User B
   ↓
Cache HIT
   ↓
receives User A's response
```

This is a severe confidentiality failure.

Therefore:

> **Never cache a response globally unless you have proven that the cached representation is safe to share.**

---

# 27. Public vs Personalized Data

A useful first classification:

## Public data

Example:

```text
Marketing page
Public product description
Public documentation
```

Often highly cacheable.

## Personalized data

Example:

```text
User dashboard
Private notifications
Account balance
Private orders
```

Requires much stronger cache isolation.

Visual:

```text
                 DATA
                  │
          ┌───────┴────────┐
          ↓                ↓
        PUBLIC         PERSONALIZED
          │                │
     easy to share     isolate carefully
          │                │
          ↓                ↓
       CDN/cache      user/tenant scope
```

---

# 28. Tenant Isolation

Multi-tenant applications introduce another cache dimension.

Suppose:

```text
Tenant A
Tenant B
```

both have:

```text
settings
```

A dangerous key:

```text
settings
```

A safer conceptual key:

```text
tenant:A:settings
tenant:B:settings
```

The tenant boundary must be represented in cache identity whenever the result differs by tenant.

---

# 29. Cache Invalidation and Authorization

Suppose:

```text
User permissions
```

change.

Cached output may have been generated under old permissions.

Therefore authorization changes can become cache invalidation events.

Example:

```text
User promoted to admin
        ↓
Old cached dashboard
        ↓
Missing admin capabilities
```

Or worse:

```text
User loses access
        ↓
Old private data remains cached
        ↓
Unauthorized access
```

This is why:

```text
Authorization
+
Caching
```

must be designed together.

---

# 30. Next.js Relevance

Level 08 explicitly includes:

* data fetching architecture
* caching
* Server Components
* Server Actions
* server/client boundaries

as core Next.js concerns.

That means a senior Next.js engineer should not simply ask:

> "Does this request use `fetch()`?"

They should ask:

```text
Where does this data originate?
        ↓
Who owns it?
        ↓
Can it be shared?
        ↓
What is the cache scope?
        ↓
What is the freshness requirement?
        ↓
What invalidates it?
        ↓
What happens after a mutation?
```

---

# 31. React Relevance

React components consume data.

But React itself should not be confused with the authoritative cache layer.

Conceptually:

```text
Server/data layer
       ↓
cached data
       ↓
React Server Component
       ↓
rendered result
       ↓
Client UI
```

The component should not be responsible for inventing domain-wide cache consistency rules.

That belongs to the data/mutation architecture.

---

# 32. TypeScript Relevance

TypeScript can help make cache contracts explicit.

Conceptually:

```ts
type CachePolicy = {
  scope: "public" | "user" | "tenant";
  ttlSeconds?: number;
  tags: string[];
  invalidatedBy: string[];
};
```

The exact implementation will vary.

The important idea is that caching policy can be treated as architectural metadata rather than invisible behavior.

---

# 33. The Four-Pillar Engineering Decision Matrix

## A. When should you cache?

Use caching when:

* the data is expensive to retrieve or compute
* repeated requests are common
* bounded staleness is acceptable
* the result can safely be shared
* the invalidation model is understood
* performance requirements justify the complexity

---

## B. When should you NOT cache?

Avoid or minimize caching when:

* data is highly volatile
* correctness requires immediate freshness
* the result is strongly user-specific
* invalidation is impossible to model reliably
* the computation is already cheap
* cache complexity exceeds the performance benefit

---

## C. Bottlenecks / Tradeoffs

Caching introduces:

* stale data
* invalidation complexity
* memory/storage cost
* cache stampedes
* cache misses
* cache poisoning risks
* debugging difficulty
* distributed consistency problems

The fundamental tradeoff is:

```text
Freshness
   ↕
Performance
```

with:

```text
Complexity
```

in the middle.

---

## D. Modern Alternatives / Complementary Strategies

Depending on the workload:

```text
Cache
CDN
HTTP caching
Request deduplication
Database indexing
Materialized views
Precomputation
Streaming
Background jobs
Read replicas
```

Do not use caching to compensate for a fundamentally inefficient data model.

---

# 34. Production Scenario

Imagine an e-commerce application.

Requirements:

```text
Product description:
5-minute staleness acceptable

Inventory:
near-real-time

Price:
must update quickly

User cart:
private

Marketing banners:
globally cacheable
```

A weak architecture might use:

```text
One cache policy
for everything
```

A stronger architecture uses different policies:

```text
Product description
   ↓
cacheable
   ↓
TTL / tag invalidation

Inventory
   ↓
short-lived or fresh reads

Price
   ↓
strong invalidation requirements

Cart
   ↓
user-scoped
   ↓
never globally shared

Marketing banner
   ↓
highly cacheable
   ↓
CDN-friendly
```

This is the difference between:

> "We added caching."

and:

> "We designed a cache policy based on domain semantics."

---

# 35. Debugging Cache Problems

When production data appears wrong, do not immediately blame the database.

Use this sequence:

```text
User reports stale data
        ↓
What exact value was expected?
        ↓
What value was returned?
        ↓
Which request produced it?
        ↓
Was it a cache HIT or MISS?
        ↓
Which cache layer?
        ↓
What cache key?
        ↓
What TTL?
        ↓
What invalidation event?
        ↓
Did the mutation succeed?
        ↓
Did invalidation execute?
        ↓
Did invalidation succeed?
```

This creates a deterministic debugging process.

---

# 36. Cache Observability

Production caching should expose signals such as:

```text
cache_hit
cache_miss
cache_key
cache_layer
cache_age
cache_ttl
invalidation_event
invalidation_failure
regeneration_duration
stampede_detected
```

Useful metrics include:

```text
Hit rate
Miss rate
Eviction rate
Regeneration latency
Origin load
Invalidation latency
Cache storage utilization
```

A high hit rate is not automatically good.

You can have:

```text
99% hit rate
```

and still have a correctness bug because the cache is serving stale or unauthorized data.

---

# 37. Senior-Level Mental Model

Do not think:

```text
Caching = make things faster
```

Think:

```text
Authoritative State
        ↓
Derived Cached State
        ↓
Reuse
        ↓
Freshness Policy
        ↓
Invalidation
        ↓
Reconciliation
```

The cache is a **derived representation**.

Therefore the important invariant is:

```text
Cache may temporarily differ from source of truth
BUT
the system must have a defined path back to correctness.
```

---

# 38. Prediction Challenge #1

Suppose:

```text
Database:
price = $100

Cache:
price = $100
```

A Server Action changes the price to:

```text
$80
```

The database update succeeds.

Cache invalidation fails.

What should you expect?

<details>
<summary>Solution</summary>

The database is now authoritative at:

```text
$80
```

but the cache may still contain:

```text
$100
```

Future requests that hit that cache can observe stale data.

The key lesson is:

> Successful persistence does not automatically imply successful cache convergence.

</details>

---

# 39. Prediction Challenge #2

A dashboard response contains:

```text
User A's private billing information
```

The cache key is:

```text
/dashboard
```

User B requests:

```text
/dashboard
```

What is the architectural risk?

<details>
<summary>Solution</summary>

The response is personalized, but the cache key is not user-scoped.

Therefore the cache may return User A's representation to User B.

This is not merely a performance bug.

It is a **data confidentiality vulnerability**.

The cache identity must incorporate the relevant authorization/user/tenant boundary, or the response must not be globally cached.

</details>

---

# 40. Prediction Challenge #3

A page receives:

```text
5,000 requests/second
```

Its cached value expires.

What can happen?

<details>
<summary>Solution</summary>

A large number of requests can simultaneously observe:

```text
CACHE MISS
```

and independently regenerate the same resource.

This creates a cache stampede:

```text
5000 requests
      ↓
5000 expensive operations
      ↓
database overload
```

Request coalescing, stale-while-revalidate behavior, controlled regeneration, or other stampede protections can prevent this.

</details>

---

# 41. Prediction Challenge #4

A product appears on:

```text
/product/42
/category/laptops
/search?q=macbook
/home
```

The product is updated.

You invalidate only:

```text
/product/42
```

What can remain stale?

<details>
<summary>Solution</summary>

The other representations may remain cached:

```text
/category/laptops
/search?q=macbook
/home
```

This demonstrates why path invalidation alone can be insufficient for shared domain entities.

A semantic tag such as:

```text
product:42
```

can provide a better invalidation abstraction when multiple outputs depend on the same entity.

</details>

---

# 42. Senior Interview Gotchas

### Gotcha 1

**"Caching makes the application faster."**

Incomplete.

Caching trades:

```text
latency
```

for:

```text
freshness + consistency complexity
```

---

### Gotcha 2

**"TTL solves cache invalidation."**

No.

TTL provides bounded expiration.

It does not necessarily provide immediate invalidation after a mutation.

---

### Gotcha 3

**"The database is updated, so users see the new value."**

Not necessarily.

A cached representation may still be stale.

---

### Gotcha 4

**"A high cache-hit ratio means the cache is healthy."**

Not necessarily.

You can have excellent hit rate and terrible correctness.

---

### Gotcha 5

**"Private data can be cached the same way as public data."**

No.

Cache sharing must respect:

```text
identity
authorization
tenant boundaries
```

---

### Gotcha 6

**"Invalidating a route invalidates all representations of the entity."**

Not necessarily.

An entity can participate in many cached representations.

---

### Gotcha 7

**"Caching is always a performance optimization."**

Caching can become part of the application's correctness architecture because it determines what data users observe.

---

# 43. Production Architecture Checklist

Before introducing a cache, answer:

```text
□ What exactly is being cached?

□ What is the authoritative source?

□ What is the cache key?

□ Which dimensions affect the result?

□ Is the result public, user-scoped, or tenant-scoped?

□ What is the cache scope?

□ What is the acceptable staleness?

□ What is the TTL?

□ What invalidates the entry?

□ What happens after a mutation?

□ What happens if invalidation fails?

□ Can cache stampede occur?

□ Can cache poisoning occur?

□ Can unauthorized data cross boundaries?

□ How is cache behavior observable?

□ How will production engineers debug stale data?
```

If these questions cannot be answered, the cache architecture is incomplete.

---

# 44. 30-Second Executive Cheat Sheet

```text
CACHE
  ↓
Derived reusable state

SOURCE OF TRUTH
  ↓
Authoritative domain state

CACHE KEY
  ↓
Determines which requests share a result

SCOPE
  ↓
Determines who/where can reuse it

TTL
  ↓
Controls time-based freshness

INVALIDATION
  ↓
Controls when derived state becomes stale

TAGS
  ↓
Associate cached results with domain entities

PATHS
  ↓
Associate cached results with routes

PERSONALIZED DATA
  ↓
Must respect identity and authorization boundaries

PRODUCTION RULE
  ↓
Persist authoritative state first
        ↓
Invalidate/revalidate derived state
        ↓
Observe failures
        ↓
Converge toward correctness
```

---

# 45. Senior Mental Model

A junior engineer often asks:

> "How do I cache this?"

A mid-level engineer asks:

> "How long should this be cached?"

A senior engineer asks:

> "What state does this cache represent, who is allowed to share it, what dependencies determine its value, and what exact domain event makes it invalid?"

That is the mental model this KPI is building.

---

# 46. Part Completion Criteria

You should consider this part understood only when you can explain, without documentation:

### Core

* What a cache actually represents
* Cache key vs entity identity
* Cache scope
* TTL
* Freshness vs correctness
* Data cache vs rendered result
* Cache invalidation
* Path-based invalidation
* Tag-based invalidation

### Production

* Cache stampede
* Cache penetration
* Cache poisoning
* Personalized-data caching
* Tenant isolation
* Mutation → invalidation flow
* Invalidation failure

### Architecture

You should be able to design:

```text
Database
   ↓
Authoritative state
   ↓
Cache
   ↓
Rendered application
```

and explain:

```text
what is cached
why it is safe
how it becomes stale
how it is invalidated
what happens if invalidation fails
```

### SDE-2 standard

You should be able to defend a caching strategy based on:

```text
Performance
+
Freshness
+
Correctness
+
Security
+
Operational complexity
```

—not merely based on "this API is faster."

---

# 47. Boundary of This Part

This part establishes the **cache mental model and architecture**.

It does **not yet attempt to exhaustively document every Next.js caching API or revalidation mechanism**.

The next parts should build on this foundation by moving from:

```text
WHAT caching means
```

to:

```text
HOW Next.js implements and controls caching
```

and then into:

```text
HOW data-fetching behavior
+
rendering behavior
+
revalidation
+
mutations
+
cache invalidation
```

interact in a production application.

---

# Final Principle

> **Never design a cache by asking only how long data should live. Design it by defining what the cached value means, who can share it, what makes it stale, and how the system returns to correctness after the source of truth changes.**
