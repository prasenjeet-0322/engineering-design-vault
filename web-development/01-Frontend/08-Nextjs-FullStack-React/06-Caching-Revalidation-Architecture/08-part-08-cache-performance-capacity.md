# Level 08 — KPI 06 — Part 08

## Cache Performance, Capacity & Origin Load Architecture

---

## 1. Part Objective

Caching is usually introduced to reduce latency and database or API load.

But adding a cache does not automatically improve a system.

A poorly designed cache can create:

* memory pressure
* expensive serialization
* excessive invalidation
* cache churn
* stampedes
* network overhead
* origin overload
* latency spikes
* unpredictable performance

At SDE-2 level, caching must therefore be treated as a **performance architecture**, not simply a storage mechanism.

The governing question is:

> **How does the cache change latency, origin load, memory consumption, throughput, and failure behavior under realistic traffic?**

The core model is:

```text
Traffic
   ↓
Cache Key Design
   ↓
Hit / Miss Behavior
   ↓
Cache Capacity
   ↓
Origin Load
   ↓
Latency + Throughput
   ↓
Failure Behavior
```

---

# 2. Cache Performance Is a System Property

A cache is successful only if it improves the overall system.

Consider:

```text
Without cache:

1000 requests
      ↓
1000 database queries
```

With cache:

```text
1000 requests
      ↓
800 cache hits
200 cache misses
      ↓
200 database queries
```

The cache has reduced origin traffic.

But now add:

```text
cache network request
serialization
deserialization
cache lookup latency
invalidation work
memory cost
```

The actual performance benefit becomes:

```text
cache overhead
vs
origin work avoided
```

Therefore:

> A cache should be evaluated by the total system cost, not merely its hit rate.

---

# 3. Cache Hit Ratio

A fundamental metric is:

```text
hit ratio =
cache hits / total cache requests
```

Example:

```text
900 hits
100 misses

hit ratio = 90%
```

Miss ratio:

```text
100 / 1000 = 10%
```

A high hit ratio is generally desirable.

But it is not sufficient.

---

# 4. Why Hit Rate Can Mislead

Suppose:

```text
cache hit rate = 99%
```

but the remaining:

```text
1%
```

contains extremely expensive requests.

Example:

```text
9,900 cheap cache hits
100 expensive database queries
```

If each miss takes:

```text
500ms
```

the origin may still be heavily loaded.

Therefore measure:

```text
hit ratio
+
miss cost
+
origin load
+
latency
```

not hit ratio alone.

---

# 5. Weighted Cache Value

Consider two cache entries.

### Entry A

```text
100,000 requests/day
origin cost = 1ms
```

### Entry B

```text
1,000 requests/day
origin cost = 500ms
```

Caching Entry B may provide more meaningful system protection even though it has lower traffic volume.

Therefore cache prioritization should consider:

```text
request frequency
×
origin cost
```

A useful approximation is:

```text
cache value ≈ avoided origin work
```

---

# 6. Latency Model

A simplified request path:

```text
Cache hit:

request
 ↓
cache
 ↓
response
```

versus:

```text
Cache miss:

request
 ↓
cache
 ↓
origin
 ↓
database/API
 ↓
cache population
 ↓
response
```

Therefore:

```text
hit latency << miss latency
```

in many systems.

But this creates another requirement:

> Cache misses must be controlled because they are disproportionately expensive.

---

# 7. Tail Latency

Average latency can hide cache problems.

Suppose:

```text
P50 = 40ms
P95 = 70ms
P99 = 800ms
```

If most requests are cache hits but misses trigger expensive origin work, the P99 can become very high.

Senior engineers therefore inspect:

```text
P50
P90
P95
P99
```

separately for:

```text
cache hits
cache misses
cache regeneration
```

---

# 8. Cache Hit vs Miss Latency

A useful production dashboard:

| Metric |  Hit |   Miss |
| ------ | ---: | -----: |
| P50    | 20ms |  180ms |
| P95    | 40ms |  600ms |
| P99    | 80ms | 1200ms |

This immediately tells you:

```text
misses dominate tail latency
```

The optimization target is therefore not necessarily:

```text
make hits 5ms faster
```

It may instead be:

```text
reduce expensive misses
```

---

# 9. Cache Capacity

Every cache has finite capacity.

Conceptually:

```text
Cache
┌─────────────────────────┐
│ Entry A                  │
│ Entry B                  │
│ Entry C                  │
│ ...                      │
│ Entry N                  │
└─────────────────────────┘
```

When capacity is exhausted, entries must be removed.

This introduces an eviction policy.

---

# 10. Eviction Policies

Common policies include:

### LRU

```text
Least Recently Used
```

Remove entries that have not been accessed recently.

### LFU

```text
Least Frequently Used
```

Remove entries with low access frequency.

### TTL-based eviction

Remove entries after a specified lifetime.

### Size-based eviction

Remove entries to stay within memory constraints.

Real systems may combine multiple policies.

---

# 11. Why Eviction Matters

Suppose your workload contains:

```text
90% requests → 10 popular keys
10% requests → 1,000,000 unique keys
```

If the cache allows the long tail to consume all capacity:

```text
popular entries
↓
evicted
```

The cache becomes ineffective.

This is cache pollution.

---

# 12. Cache Pollution

A workload can contain low-value entries that displace high-value entries.

Example:

```text
GET /product/1
GET /product/2
GET /product/3
...
GET /product/1000000
```

If every key is cached equally:

```text
rare entries
```

may evict:

```text
high-value hot entries
```

A senior design should consider:

```text
Should every response be cached?
```

The answer is often:

```text
no
```

---

# 13. Cacheability Policy

Not every resource should automatically enter the cache.

A cache policy can consider:

```text
frequency
origin cost
response size
freshness requirement
personalization
security sensitivity
regeneration cost
```

Conceptually:

```text
if high_value && safe_to_cache:
    cache
else:
    bypass
```

---

# 14. Cache Size vs Entry Size

A cache with:

```text
10,000 entries
```

does not tell you how much memory it consumes.

Consider:

```text
Entry A = 1 KB
Entry B = 2 KB
Entry C = 20 MB
```

Large values can dominate memory.

Therefore monitor:

```text
entry count
+
total bytes
+
average entry size
+
P95/P99 entry size
```

---

# 15. Serialization Cost

Caches frequently require:

```text
application object
↓
serialization
↓
network/storage
↓
deserialization
↓
application object
```

For example:

```text
JSON.stringify()
```

and:

```text
JSON.parse()
```

are not free.

For large payloads:

```text
serialization CPU
+
network transfer
+
deserialization CPU
```

may become significant.

A cache can therefore trade:

```text
database CPU
```

for:

```text
application CPU
```

---

# 16. Cache Payload Size

Suppose:

```text
response = 5 MB
```

and:

```text
1000 cache hits/sec
```

The system may generate substantial:

```text
network bandwidth
memory pressure
serialization work
```

Often the better architecture is:

```text
cache only the data needed
```

rather than:

```text
cache entire domain object
```

---

# 17. Cache Granularity

Consider:

```text
User Dashboard
```

with:

```text
profile
orders
notifications
recommendations
analytics
```

Option A:

```text
cache entire dashboard
```

Option B:

```text
cache profile
cache orders
cache notifications
cache recommendations
cache analytics
```

Option A has simpler reads.

Option B enables more precise invalidation.

The tradeoff is:

```text
coarse cache
vs
fine-grained cache
```

---

# 18. Coarse-Grained Caching

Example:

```text
dashboard:user:42
```

Advantages:

* simple retrieval
* fewer cache lookups
* potentially lower assembly cost

Disadvantages:

* large payload
* broad invalidation
* one small change can invalidate everything
* potentially lower reuse

---

# 19. Fine-Grained Caching

Example:

```text
user:42:profile
user:42:orders
user:42:notifications
```

Advantages:

* precise invalidation
* better reuse
* independent freshness policies

Disadvantages:

* more cache lookups
* more keys
* more dependency management
* greater architectural complexity

---

# 20. Cache Churn

Cache churn occurs when entries are continuously inserted and evicted.

Example:

```text
insert A
evict B
insert C
evict D
insert E
evict A
insert B
...
```

The cache spends substantial resources moving data without producing useful reuse.

Symptoms:

```text
high miss rate
high eviction rate
low reuse
high memory activity
```

This often indicates:

```text
cache too small
poor key distribution
poor TTL
cache pollution
```

---

# 21. Working Set

The **working set** is the subset of data actively accessed during a relevant period.

Example:

```text
1,000,000 total products
```

but:

```text
50,000 products
```

receive almost all traffic.

If cache capacity can hold the working set:

```text
high hit rate
```

is achievable.

If cache capacity is much smaller:

```text
frequent eviction
```

is expected.

Therefore capacity planning should consider the working set, not merely total dataset size.

---

# 22. Hot Keys

A hot key is an unusually popular cache entry.

Example:

```text
homepage
trending-products
popular-event
```

One key might receive:

```text
100,000 requests/sec
```

while most keys receive:

```text
1 request/sec
```

This creates a concentrated load problem.

---

# 23. Hot Key Failure

Suppose:

```text
hot-key
TTL = 60 seconds
```

At expiration:

```text
100,000 requests
```

may attempt regeneration.

This combines:

```text
hot key
+
expiration
+
stampede
```

The result can be severe origin load.

---

# 24. Hot Key Mitigation

Possible techniques include:

```text
request coalescing
stale serving
background refresh
replication
jittered TTL
prewarming
origin shielding
```

The right mechanism depends on the system.

---

# 25. Origin Shielding

Consider:

```text
             CDN
              ↓
        Shield cache
              ↓
           Origin
```

Instead of every edge directly hitting the origin:

```text
Edge A ─┐
Edge B ─┼→ Shield → Origin
Edge C ─┘
```

The shield reduces duplicate origin traffic.

Conceptually:

```text
many edge misses
      ↓
one shared intermediate cache
      ↓
fewer origin requests
```

---

# 26. Cache Hierarchy for Performance

A production system may look like:

```text
Browser
   ↓
CDN
   ↓
Framework cache
   ↓
Application cache
   ↓
Database
```

Each additional cache can reduce origin work.

But each also introduces:

```text
latency
complexity
invalidation boundaries
observability requirements
```

Therefore more cache layers do not automatically mean better architecture.

---

# 27. Cache Lookup Amplification

Suppose a request requires:

```text
profile
orders
notifications
recommendations
```

and each requires a separate remote cache lookup.

You may have:

```text
1 HTTP request
↓
4 cache network requests
```

The cache reduces database load but increases network activity.

This is cache lookup amplification.

---

# 28. Cache Locality

A cache is most effective when requests repeatedly access the same data.

Strong locality:

```text
A A A A B B A A
```

Weak locality:

```text
A B C D E F G H
```

Strong locality generally produces:

```text
high hit rate
```

Weak locality produces:

```text
high churn
```

Therefore workload characteristics matter as much as cache implementation.

---

# 29. TTL Selection

TTL should be derived from:

```text
freshness requirement
+
update frequency
+
origin cost
+
traffic pattern
+
cache capacity
```

Not:

```text
“60 seconds seems reasonable.”
```

For example:

```text
rapidly changing data
→ shorter TTL

expensive and slowly changing data
→ longer TTL
```

---

# 30. TTL Jitter

Suppose 1 million entries all have:

```text
TTL = 60 seconds
```

and are created simultaneously.

They may expire together.

Instead:

```text
TTL = 60s ± random jitter
```

causes expirations to spread out.

Conceptually:

```text
60s
58s
63s
61s
57s
65s
```

This reduces synchronized regeneration.

---

# 31. Prefetching

A system can predict likely future requests.

Example:

```text
User opens product page
↓
system predicts recommendation request
↓
prefetch recommendation
```

This can reduce perceived latency.

But prefetching can also:

```text
increase traffic
increase cache occupancy
waste origin work
```

Therefore prefetch only when prediction confidence justifies the cost.

---

# 32. Cache Warming

After:

```text
deployment
restart
mass invalidation
```

the cache may be cold.

Cold cache:

```text
many misses
↓
origin load spike
↓
latency increase
```

Warming can proactively populate important entries.

Typical targets:

```text
homepage
popular products
high-traffic routes
critical configuration
```

---

# 33. Cache Warming Tradeoff

Warming too aggressively:

```text
cache warmup
↓
massive origin traffic
```

can create the same problem the cache was supposed to prevent.

Therefore warm gradually:

```text
high-value entries first
↓
observe origin load
↓
expand
```

---

# 34. Cache Efficiency

A useful conceptual metric is:

```text
cache efficiency =
useful origin work avoided
/
total cache cost
```

Cache cost can include:

```text
memory
network
CPU
serialization
invalidation
operational complexity
```

This reminds us:

> A cache should earn its complexity.

---

# 35. Cache Cost Model

For a cache decision, estimate:

```text
Benefit:
origin work avoided
latency reduced
database load reduced

Cost:
cache storage
network traffic
CPU
invalidation
operational complexity
failure modes
```

A cache is justified when:

```text
benefit > total system cost
```

---

# 36. Expensive Origin Operations

Caching is especially valuable when origin work is expensive:

```text
complex SQL joins
aggregation queries
external APIs
large computations
ML inference
heavy rendering
```

Example:

```text
DB query = 300ms
cache lookup = 5ms
```

Avoiding the DB query can produce substantial benefit.

---

# 37. Cheap Origin Operations

Caching may provide little benefit when:

```text
DB query = 1ms
cache lookup = 5ms
```

The cache may actually increase latency.

Therefore:

> Do not cache purely because something is data.

Cache because caching provides measurable system value.

---

# 38. Cache + Database Load

Suppose:

```text
1000 req/s
```

without cache:

```text
1000 DB queries/s
```

With:

```text
90% hit rate
```

the origin sees approximately:

```text
100 DB queries/s
```

This can dramatically improve:

```text
database CPU
connection usage
query contention
latency
capacity headroom
```

---

# 39. Cache Headroom

A useful architectural goal is not merely:

```text
database currently survives
```

but:

```text
database has capacity headroom
```

Caching can create that headroom.

Example:

```text
normal origin load = 200 req/s
peak = 500 req/s
database capacity = 600 req/s
```

This leaves little safety margin.

A cache reducing normal origin load to:

```text
50 req/s
```

creates substantial resilience.

---

# 40. Cache Failure Should Not Automatically Become System Failure

A resilient system considers:

```text
cache unavailable
```

as a possible event.

Possible strategy:

```text
cache unavailable
      ↓
bypass cache
      ↓
origin
```

But only if:

```text
origin has sufficient capacity
```

Otherwise cache failure can become:

```text
cache outage
↓
origin overload
↓
database failure
↓
system outage
```

This is cache-induced cascading failure.

---

# 41. Circuit Breaking

When the origin becomes unhealthy:

```text
cache miss
↓
origin overloaded
```

the system may need:

```text
circuit breaker
rate limiting
stale serving
load shedding
```

The goal is to prevent:

```text
cache failure
→ origin overload
→ complete outage
```

---

# 42. Stale-on-Failure

For non-critical content:

```text
fresh cache unavailable
```

the system may serve:

```text
slightly stale cache
```

instead of failing the request.

Conceptually:

```text
fresh → preferred
stale → acceptable fallback
origin → expensive fallback
error → final fallback
```

This can improve availability.

---

# 43. Availability vs Freshness

Caching introduces a fundamental tradeoff:

```text
freshness
      ↕
availability
```

During an origin failure:

```text
strict freshness
→ fail request

stale tolerance
→ serve cached value
```

For many read-heavy experiences:

```text
stale + available
```

is preferable to:

```text
fresh + unavailable
```

But that is a domain decision.

---

# 44. Backpressure

If regeneration becomes expensive:

```text
100,000 cache misses
```

the system should not necessarily allow:

```text
100,000 origin operations
```

Instead:

```text
requests
 ↓
bounded regeneration
 ↓
queue/coalesce
 ↓
origin
```

This creates backpressure.

---

# 45. Rate Limiting Cache Regeneration

A useful protection is limiting how many cache rebuilds can execute concurrently.

For example:

```text
maximum regeneration concurrency = N
```

This protects:

```text
database
external API
CPU
memory
```

during cache churn.

---

# 46. External API Caching

Suppose:

```text
Next.js
 ↓
Third-party API
```

The API has:

```text
rate limit = 100 req/s
```

Without caching:

```text
1000 user requests
↓
1000 API requests
```

Caching can transform this into:

```text
1000 user requests
↓
cache
↓
10 API requests
```

This protects both:

```text
your application
+
third-party dependency
```

---

# 47. Cache and Rate Limits

A cache can act as a form of load shaping.

Instead of:

```text
user traffic
→ dependency traffic
```

you get:

```text
user traffic
→ cache
→ controlled dependency traffic
```

This is particularly valuable when external systems have:

```text
quotas
rate limits
cost per request
strict latency
```

---

# 48. Cost-Aware Caching

Some APIs charge per request.

Example:

```text
API cost = $0.01/request
```

If caching avoids:

```text
1,000,000 requests
```

the financial value may be significant.

Therefore caching can optimize:

```text
latency
+
capacity
+
money
```

---

# 49. Performance Testing

Do not evaluate caching only with unit tests.

Use workload tests that model:

```text
cold cache
warm cache
cache expiration
high concurrency
hot keys
mass invalidation
origin slowdown
cache outage
```

Measure:

```text
latency
throughput
origin load
cache hit ratio
eviction
memory
CPU
```

---

# 50. Load-Test Scenario

A useful experiment:

```text
Phase 1:
cold cache

Phase 2:
warm cache

Phase 3:
expire 10% of keys

Phase 4:
expire hot keys

Phase 5:
disable cache

Phase 6:
restore cache
```

Compare system behavior.

This reveals whether the cache is actually providing resilience.

---

# 51. Observability Dashboard

A strong cache dashboard should include:

```text
Requests/sec
Cache hit %
Cache miss %
P50 hit latency
P95 hit latency
P99 hit latency
P50 miss latency
P95 miss latency
P99 miss latency
Origin requests/sec
Eviction rate
Cache memory
Average entry size
Hot keys
Regeneration rate
Invalidation failures
```

The objective is to connect:

```text
cache behavior
```

to:

```text
system behavior
```

---

# 52. Production Debugging Example

Suppose latency suddenly increases.

Dashboard:

```text
P99 latency ↑
Cache hit rate ↓
Origin traffic ↑
Database CPU ↑
```

Likely chain:

```text
cache effectiveness decreased
↓
more misses
↓
more origin work
↓
database pressure
↓
tail latency increased
```

The correct investigation is not simply:

> “Why is the database slow?”

The database may only be the downstream symptom.

---

# 53. Production Debugging Example 2

Suppose:

```text
hit rate = 95%
latency still high
```

Investigate:

```text
cache network latency
payload size
serialization
deserialization
remote cache saturation
large hot values
```

A high hit rate does not prove the cache is fast.

---

# 54. Production Debugging Example 3

Suppose:

```text
hit rate suddenly drops from 90% → 30%
```

Potential causes:

```text
deployment changed keys
TTL changed
cache capacity reduced
working set increased
mass invalidation
cache unavailable
traffic distribution changed
```

Use metrics and traces to distinguish them.

---

# 55. SDE-2 Prediction Challenge

Given:

```text
Cache capacity = 1 GB
Average entry = 100 KB
```

Approximate maximum entries:

```text
~10,000
```

ignoring metadata and overhead.

If the working set is:

```text
100,000 entries
```

a very high hit ratio should not be assumed.

Capacity and workload distribution matter.

---

# 56. SDE-2 Prediction Challenge

Given:

```text
Cache hit rate = 95%
Origin query = 200ms
Cache lookup = 5ms
```

Most requests are approximately:

```text
5ms
```

while misses may approach:

```text
200ms+
```

Therefore a small miss-rate increase can disproportionately affect tail latency.

---

# 57. SDE-2 Prediction Challenge

Given:

```text
10,000 requests
99% hit rate
```

there are approximately:

```text
100 misses
```

If each miss causes:

```text
50 DB queries
```

then:

```text
100 × 50 = 5,000 DB queries
```

A cache miss can therefore amplify origin work significantly.

This is why the true unit of analysis is:

```text
miss → downstream work
```

not simply:

```text
miss count
```

---

# 58. SDE-2 Interview Gotchas

### Gotcha 1

> “Our cache hit rate is 95%, so the cache is working well.”

Ask:

```text
What is the miss cost?
What is the origin load?
What is P99?
What is the cache lookup latency?
```

---

### Gotcha 2

> “Increase cache size.”

Before doing so:

```text
Why is the cache missing?
What is the working set?
Are keys polluted?
Are TTLs too short?
```

---

### Gotcha 3

> “Cache everything.”

This can create:

```text
memory pressure
security issues
pollution
invalidation complexity
```

---

### Gotcha 4

> “More cache layers always improve performance.”

More layers also mean:

```text
more latency boundaries
more invalidation boundaries
more failure modes
```

---

# 59. Production Architecture Pattern

A performance-oriented architecture may look like:

```text
                  Users
                    ↓
                  CDN
                    ↓
             Next.js / App
                    ↓
              Framework Cache
                    ↓
             Distributed Cache
                    ↓
             Origin Services
                    ↓
                 Database
```

With:

```text
hot data
→ long-lived cache

volatile data
→ short-lived cache

critical mutations
→ targeted invalidation

expensive regeneration
→ coalescing

cache failure
→ controlled fallback
```

The architecture is workload-specific.

---

# 60. Cache Performance Checklist

For every cache, determine:

### Workload

* [ ] request frequency
* [ ] access locality
* [ ] working set
* [ ] hot keys
* [ ] payload distribution

### Performance

* [ ] hit latency
* [ ] miss latency
* [ ] P95
* [ ] P99
* [ ] origin load

### Capacity

* [ ] cache memory
* [ ] entry count
* [ ] average size
* [ ] large entries
* [ ] eviction rate

### Correctness

* [ ] freshness policy
* [ ] invalidation
* [ ] race handling
* [ ] cache key isolation

### Resilience

* [ ] cache outage behavior
* [ ] stampede protection
* [ ] regeneration limits
* [ ] origin protection
* [ ] stale fallback

---

# 61. Senior Mental Model

A junior cache design asks:

```text
“What can I cache?”
```

A stronger engineer asks:

```text
“What should I cache?”
```

An SDE-2 engineer asks:

```text
“What workload does this cache transform?”
```

and:

```text
“What happens when the cache is cold, full, stale, unavailable, or under extreme concurrency?”
```

That is the difference between:

```text
cache implementation
```

and:

```text
cache architecture
```

---

# 62. Executive Summary

```text
Cache performance ≠ hit rate alone.

Measure:
    hit ratio
    miss cost
    origin load
    latency
    tail latency
    memory
    eviction
    regeneration

Optimize:
    working-set coverage
    expensive misses
    hot keys
    payload size
    cache lookup cost
    regeneration concurrency

Protect:
    origin
    database
    external APIs
    memory
    availability

Design for:
    cold cache
    hot cache
    cache churn
    stampedes
    cache outages
    mass invalidation
```

---

# 63. Final Principle

The purpose of caching is not:

> “Store data somewhere faster.”

The purpose is:

> **Transform an expensive, high-volume workload into a cheaper, lower-latency, more resilient workload without violating the system's consistency and security requirements.**

The complete performance model is:

```text
Traffic
   ↓
Cacheability
   ↓
Key Distribution
   ↓
Working Set
   ↓
Hit/Miss Behavior
   ↓
Origin Work
   ↓
Latency
   ↓
Capacity
   ↓
Failure Behavior
```

That is the SDE-2 level way to evaluate caching.

---

# 64. Part Boundary

This part establishes **cache performance, capacity, and origin-load reasoning**.

It does not yet focus on the complete integration of:

* Next.js rendering
* data cache
* request memoization
* cache components
* client-side data/state
* Server Actions
* mutation invalidation
* end-to-end production caching architecture

Those concepts should ultimately converge in the KPI's integration layer.

**Core principle:**

> **A cache is valuable when it removes expensive work without creating greater correctness, capacity, or operational problems elsewhere.**
