# Level 08 — Next.js & Full-Stack React

## KPI 10 — Image Optimization

# Part 05 — Image CDN, Caching, Invalidation & Delivery Architecture

---

## 1. Part Objective

The objective of this part is to understand image delivery as a **distributed caching and content-delivery system**, rather than treating an image CDN as merely a faster URL.

At senior frontend/SDE-2 level, the important question is not:

> “Are our images behind a CDN?”

The important questions are:

* What is the image's origin?
* Where is transformation performed?
* What representation is being cached?
* What makes two image requests the same or different?
* How large can the cache become?
* How are changed images invalidated?
* What happens during a cache miss?
* What happens when many users request the same uncached image?
* Which images are public?
* Which images are private or personalized?
* Can one tenant receive another tenant's representation?
* What happens when the origin is unavailable?
* How do we know whether the CDN is actually reducing origin load?

The central model is:

```text
Original Asset
      ↓
Image Transformation
      ↓
Delivery Representation
      ↓
Origin / Object Storage
      ↓
CDN Edge
      ↓
Browser Cache
      ↓
Decoded Image
```

The CDN is therefore one layer in a larger image-delivery architecture.

---

# 2. The Core Image Delivery Mental Model

A production image request can be modeled as:

```text
Browser
   ↓
CDN / Edge
   ↓
Cache Lookup
   ↓
 ┌───────────────┐
 │ Cache Hit?    │
 └───────┬───────┘
         │
    ┌────┴────┐
    │         │
   YES        NO
    │         │
    ↓         ↓
Response   Origin
              ↓
        Transformation
              ↓
          Response
              ↓
          CDN Cache
              ↓
           Browser
```

The most important distinction is:

```text
cache hit
≠
image exists somewhere

cache hit
=
the requested representation exists
under the relevant cache identity
and can be served from that cache layer.
```

Therefore:

```text
same source asset
≠
same cached representation
```

For example:

```text
/product.jpg?w=400
/product.jpg?w=800
/product.jpg?w=1200
```

may represent the same logical image while being three different delivery representations.

---

# 3. CDN vs Origin Responsibilities

A senior engineer must understand which component owns which responsibility.

## Origin

The origin may be responsible for:

* storing original assets
* generating transformed images
* authenticating private image access
* validating image requests
* returning cache headers
* managing content versions
* enforcing transformation constraints

## CDN

The CDN may be responsible for:

* geographic distribution
* edge caching
* request routing
* bandwidth offload
* reducing origin latency
* absorbing repeated traffic
* cache revalidation
* stale serving policies
* TLS termination
* traffic protection

## Browser

The browser may provide another cache layer:

```text
Browser Cache
      ↓
CDN Cache
      ↓
Origin Cache
      ↓
Object Storage
```

This means image delivery can have multiple cache layers.

---

# 4. Cache Hierarchy

A simplified production hierarchy is:

```text
User
 ↓
Browser Cache
 ↓
CDN Edge Cache
 ↓
CDN Regional / Shield Layer
 ↓
Image Service
 ↓
Object Storage / Origin
```

Each layer can reduce load on the next.

The desired behavior is generally:

```text
Browser hit
    ↓
no network request

CDN hit
    ↓
no origin request

Origin cache hit
    ↓
no expensive transformation

Origin miss
    ↓
transformation / storage access
```

The further upstream a request is satisfied, the less infrastructure work is required.

---

# 5. Cache Identity Is Critical

A cache needs a key.

Conceptually:

```text
Cache Key =
    URL
    + dimensions
    + format
    + quality
    + transformation parameters
    + relevant representation context
```

For example:

```text
/image/product-123?w=800&format=webp&q=75
```

may identify a different representation from:

```text
/image/product-123?w=1200&format=webp&q=75
```

And:

```text
/image/product-123?w=800&format=avif&q=75
```

is also different.

Therefore:

```text
logical resource identity
```

and:

```text
delivery representation identity
```

must remain distinct.

---

# 6. Cache Cardinality

One of the most important production concepts is **cache cardinality**.

Suppose an image supports:

```text
10 widths
3 formats
3 quality levels
2 DPR variants
```

A theoretical upper bound is:

```text
10 × 3 × 3 × 2
= 180 representations
```

for one logical asset.

If a system has:

```text
100,000 source images
```

the representation space can become enormous.

Therefore:

> Image optimization can accidentally become a cache-cardinality problem.

---

# 7. More Variants Are Not Automatically Better

A naive architecture might generate arbitrary combinations:

```text
width = any value
quality = any value
format = any value
crop = any value
DPR = any value
```

This can create a huge number of representations.

Instead, production systems usually constrain the representation space.

For example:

```text
Allowed widths:
320
480
640
768
1024
1280
1536
1920
```

Rather than:

```text
every possible width from 1 → 5000
```

The goal is:

```text
sufficient visual fidelity
+
reasonable cache cardinality
+
predictable origin workload
```

---

# 8. Immutable Image URLs

One of the strongest caching strategies is content-addressed or versioned URLs.

Example:

```text
/images/product-123.v7.webp
```

or:

```text
/images/8f3a1c/product-123.webp
```

The important property is:

```text
new content
→
new URL
```

rather than:

```text
same URL
→
different content
```

This allows aggressive caching.

Conceptually:

```text
URL v1
  ↓
immutable
  ↓
cache for long duration
```

When the asset changes:

```text
URL v2
  ↓
new representation
```

No global purge is necessarily required.

---

# 9. Why Content Versioning Helps

Consider:

```text
/logo.png
```

If the content changes but the URL remains:

```text
/logo.png
```

different cache layers may disagree about the current representation.

Possible state:

```text
Browser → old logo
CDN     → old logo
Origin  → new logo
```

This creates cache inconsistency.

With versioned identity:

```text
/logo.v1.png
/logo.v2.png
```

the application explicitly moves to the new representation.

This is often easier to reason about than invalidating every cache layer.

---

# 10. Cache-Control

HTTP cache policy determines how downstream caches treat the response.

Conceptually:

```text
Cache-Control
    ↓
how long may this response be reused?
```

Important concepts include:

* `max-age`
* `s-maxage`
* `public`
* `private`
* `no-store`
* `stale-while-revalidate`
* `stale-if-error`

The exact policy depends on whether the representation is:

* immutable
* frequently changing
* public
* personalized
* security-sensitive

---

# 11. Public vs Private Images

Not every image should be publicly cacheable.

### Public image

Examples:

```text
marketing hero
product catalog image
blog thumbnail
public avatar
documentation image
```

These may often be safely cached at CDN scale.

### Private image

Examples:

```text
private invoice PDF preview
medical document preview
private dashboard screenshot
organization-internal asset
user-private upload
```

These require stronger cache isolation.

The critical invariant is:

```text
private representation
must never become a publicly reusable cache object.
```

---

# 12. Personalized Images

Personalization creates additional cache dimensions.

Suppose:

```text
/image/avatar
```

depends on:

```text
user identity
```

Then:

```text
User A → personalized image A
User B → personalized image B
```

A shared CDN cache can become dangerous if the cache key does not include the required identity boundary.

Therefore:

```text
personalization
+
shared cache
```

requires deliberate architecture.

Often the safer design is:

```text
private image
→ private delivery
```

rather than attempting to make the CDN understand arbitrary user identity.

---

# 13. Multi-Tenant Image Delivery

Consider:

```text
Tenant A
    /logo.png

Tenant B
    /logo.png
```

If the CDN cache key is only:

```text
/logo.png
```

then the representations may collide.

A safer identity might include:

```text
tenant-a/logo.png
tenant-b/logo.png
```

or an equivalent tenant-specific immutable asset identity.

The core invariant is:

```text
tenant identity
must participate in representation identity
when the representation differs by tenant.
```

---

# 14. Cache Invalidation

There are three major strategies.

## Strategy 1 — TTL expiration

Allow the cached object to expire.

```text
cache
 ↓
TTL expires
 ↓
next request
 ↓
origin
```

Simple, but potentially stale.

---

## Strategy 2 — Explicit purge

Invalidate cached representations.

```text
asset updated
   ↓
purge CDN cache
   ↓
new request
   ↓
origin
```

Useful when immediate propagation is required.

But purging at large scale can become operationally expensive.

---

## Strategy 3 — Versioned URLs

Change the resource identity.

```text
asset-v1
   ↓
asset-v2
```

This avoids dependence on immediate global cache invalidation.

For immutable assets, this is often highly predictable.

---

# 15. Stale-While-Revalidate

A stale-while-revalidate strategy allows a cached representation to be served while a background refresh occurs.

Conceptually:

```text
Request
  ↓
stale-but-servable cache
  ↓
serve existing representation
  +
refresh asynchronously
```

This can reduce latency and prevent users from waiting for regeneration.

The tradeoff is:

```text
lower latency
+
temporary staleness
```

The architecture must decide whether that tradeoff is acceptable.

---

# 16. Stale-If-Error

Another useful resilience mechanism is serving stale content when the origin fails.

Conceptually:

```text
CDN has stale image
        ↓
origin unavailable
        ↓
serve stale representation
```

For public content this can provide graceful degradation.

For sensitive or correctness-critical content, stale serving may be inappropriate.

The decision is therefore a product and correctness decision, not merely a performance optimization.

---

# 17. Cache Warming

Some images are known to be highly popular.

Examples:

```text
homepage hero
top products
campaign banners
popular article images
```

A deployment or campaign launch can cause an enormous request spike.

Instead of waiting for the first users to generate the cache:

```text
deployment
   ↓
prewarm critical image URLs
   ↓
CDN populated
   ↓
traffic arrives
```

This is useful when transformation is expensive.

---

# 18. Request Coalescing / Single Flight

Consider a cache miss for an expensive image.

At the same moment:

```text
10,000 users
      ↓
same uncached image
```

Without coordination:

```text
10,000 cache misses
      ↓
10,000 origin requests
      ↓
10,000 transformations
```

This can overload the origin.

A better architecture can coalesce requests:

```text
10,000 requests
      ↓
one origin generation
      ↓
shared result
      ↓
CDN
      ↓
10,000 responses
```

This pattern is commonly called:

```text
request coalescing
single-flight
cache stampede protection
```

---

# 19. Cache Stampede

A cache stampede occurs when many requests simultaneously encounter an expired or missing representation.

Example:

```text
popular-image.webp
```

expires.

Then:

```text
User 1 → miss
User 2 → miss
User 3 → miss
...
User 50,000 → miss
```

If all requests regenerate independently:

```text
origin CPU ↑
transformation workload ↑
latency ↑
errors ↑
```

Mitigation strategies include:

* request coalescing
* stale-while-revalidate
* prewarming
* jittered expiration
* background regeneration
* bounded concurrency

---

# 20. Origin Shielding

A CDN architecture may use an intermediate shield layer.

Conceptually:

```text
Edge 1 ─┐
Edge 2 ─┤
Edge 3 ─┼→ Origin Shield → Origin
Edge 4 ─┤
Edge 5 ─┘
```

Instead of many geographically distributed edges independently hitting the origin, the shield absorbs some duplication.

Benefits can include:

* lower origin request volume
* better cache consolidation
* reduced origin bandwidth
* protection against distributed misses

---

# 21. Global Delivery

For globally distributed users:

```text
User
 ↓
Nearest edge
 ↓
Regional cache
 ↓
Origin
```

The CDN can reduce:

```text
network distance
```

between user and cached representation.

But a CDN does not automatically solve all latency problems.

You still need to consider:

* origin location
* cache hit rate
* image transformation latency
* cold cache behavior
* network routing
* payload size
* browser decoding
* connection characteristics

Therefore:

```text
CDN ≠ automatically fast
```

The CDN must actually serve the relevant representation from an appropriate cache layer.

---

# 22. Image CDN Transformation Architecture

A common architecture is:

```text
Request
   ↓
CDN
   ↓
Transformation Service
   ↓
Original Asset
   ↓
Resize / Crop / Format / Quality
   ↓
Generated Representation
   ↓
CDN Cache
```

The important observation is:

> The transformation itself is a compute workload.

Therefore cache misses can become expensive.

For example:

```text
AVIF encoding
+
large source image
+
high resolution
```

may consume considerably more compute than serving an already-generated cached representation.

---

# 23. Cache the Transformation Result

A useful architecture is:

```text
source
+
transformation parameters
        ↓
deterministic representation
        ↓
cache
```

For example:

```text
source = product-123
width = 800
format = avif
quality = 70
crop = center
```

produces a representation identity.

Repeated requests should reuse the same representation.

This converts:

```text
expensive transformation
```

into:

```text
cheap cache lookup
```

for subsequent requests.

---

# 24. Cache Key Design

A robust cache key must include every parameter that changes the representation.

If:

```text
width
format
quality
crop
```

change the output, they belong in the representation identity.

Otherwise:

```text
Request A
→ representation A

Request B
→ representation B

but both map to same cache key
```

which can return incorrect content.

The inverse problem also exists:

```text
parameters included unnecessarily
```

which can create excessive cache fragmentation.

Therefore:

```text
cache key must be:
complete enough for correctness
+
minimal enough for efficient reuse.
```

---

# 25. Cache Fragmentation

Suppose these requests are semantically equivalent:

```text
?w=800
?w=0800
?width=800
```

If the system treats them as different identities, the cache can fragment.

A normalization layer can canonicalize representation parameters.

Conceptually:

```text
Raw Request
   ↓
Normalize
   ↓
Canonical Representation Identity
   ↓
Cache
```

This reduces unnecessary cache duplication.

---

# 26. Cache Poisoning Risks

Image caches can also become security boundaries.

Suppose user-controlled parameters influence cache identity incorrectly.

An attacker may attempt to create:

```text
malicious representation
```

under a cache key that later users receive.

Therefore the image pipeline must validate:

* source URLs
* transformation parameters
* allowed formats
* dimensions
* tenant identity
* authorization state
* cacheability

Security becomes part of cache architecture.

---

# 27. Image URL Design

A strong image URL should communicate stable representation identity.

For example:

```text
/images/product-123/800x600/webp-q75-v4
```

Conceptually:

```text
resource
+
transformation
+
format
+
quality
+
version
```

The exact URL syntax is less important than deterministic identity.

The key requirement is:

```text
same representation
→ same cache identity

different representation
→ different cache identity
```

---

# 28. Deployment and Image Caching

Deployment can create image consistency problems.

Suppose deployment A references:

```text
hero-v1.webp
```

and deployment B references:

```text
hero-v2.webp
```

With immutable URLs:

```text
old deployment → v1
new deployment → v2
```

both can safely coexist.

This is particularly useful during:

* rolling deployments
* canary releases
* blue-green deployments
* rollback

Avoid coupling deployment correctness to a fragile global image-cache purge.

---

# 29. Rollback Behavior

Suppose:

```text
Release A
  ↓
image-v1

Release B
  ↓
image-v2
```

Release B fails.

Rollback:

```text
Release B
   ↓
rollback
   ↓
Release A
   ↓
image-v1
```

If `image-v1` remains cached, rollback can happen without regenerating the asset.

This is one reason immutable asset URLs are operationally powerful.

---

# 30. Observability

A production image CDN should expose at least:

```text
CDN cache hit rate
CDN cache miss rate
origin request rate
transformation latency
transformation error rate
image response latency
bandwidth
cache object count
cache eviction rate
```

Additional dimensions may include:

```text
format
width bucket
tenant
region
route
device category
status code
```

But high-cardinality dimensions must be handled carefully.

---

# 31. Important Metrics

### Cache Hit Ratio

Conceptually:

```text
cache hits
──────────────
total cache requests
```

Higher is often desirable, but not universally.

A high hit ratio can still hide:

```text
wrong image
stale content
oversized representation
poor LCP
```

Therefore:

```text
cache hit ratio
≠
complete image performance metric
```

---

## Origin Offload

Measure:

```text
requests reaching origin
```

before and after CDN caching.

The goal is often:

```text
more traffic served at edge
→
less origin work
```

---

## Transformation Cost

Measure:

```text
transformations / second
CPU time
memory
encoding latency
failure rate
```

This tells you whether cache misses are creating expensive workloads.

---

# 32. Production Failure Scenario: CDN Outage

Suppose the CDN becomes unavailable.

Possible architecture:

```text
Browser
 ↓
CDN ❌
```

Potential consequences:

* image requests fail
* LCP images disappear
* layouts may degrade
* origin may suddenly receive direct traffic
* bandwidth requirements may spike

A resilient architecture considers:

```text
CDN failure
→ origin protection
→ fallback strategy
→ stale serving where appropriate
→ graceful UI behavior
```

---

# 33. Production Failure Scenario: Origin Overload

Suppose cache hit ratio falls dramatically after a deployment.

Then:

```text
CDN misses ↑
       ↓
origin requests ↑
       ↓
transformations ↑
       ↓
CPU ↑
       ↓
latency ↑
       ↓
timeouts ↑
```

This is a feedback loop.

Observability should allow engineers to detect:

```text
cache hit degradation
```

before it becomes:

```text
origin outage.
```

---

# 34. Production Failure Scenario: Wrong Variant Served

Suppose:

```text
800px request
```

receives:

```text
1200px representation
```

because the cache key ignored width.

The CDN reports:

```text
cache HIT
```

but the system is still incorrect.

This demonstrates an important principle:

> Cache correctness matters more than cache hit rate.

---

# 35. Production Failure Scenario: Cross-Tenant Leakage

Suppose:

```text
Tenant A → /logo.png
Tenant B → /logo.png
```

and both map to:

```text
/logo.png
```

in the CDN cache.

Tenant A's image can be cached and returned to Tenant B.

This is not merely a performance bug.

It is:

```text
data isolation failure
```

Therefore:

```text
cache identity
must respect security boundaries.
```

---

# 36. Production Failure Scenario: Cache Invalidation Race

Suppose:

```text
Asset v1
 ↓
CDN cache
```

Then:

```text
asset updated
 ↓
purge requested
```

But one CDN region has not yet processed the purge.

Users can temporarily see:

```text
Region A → v2
Region B → v1
```

Therefore global cache invalidation is often eventually consistent.

Versioned URLs reduce dependence on instantaneous global invalidation.

---

# 37. Production Reference Architecture

A robust public image architecture can look like:

```text
                    ┌────────────────────┐
                    │    Application     │
                    └─────────┬──────────┘
                              │
                              ↓
                    ┌────────────────────┐
                    │ Image URL Builder  │
                    └─────────┬──────────┘
                              │
                              ↓
                    ┌────────────────────┐
                    │ CDN / Edge Cache   │
                    └─────────┬──────────┘
                              │
                       cache miss
                              ↓
                    ┌────────────────────┐
                    │ Image Transformer  │
                    └─────────┬──────────┘
                              │
                              ↓
                    ┌────────────────────┐
                    │ Original Storage   │
                    └────────────────────┘
```

With observability surrounding:

```text
CDN
Transformer
Origin
Browser performance
```

---

# 38. Senior-Level Architecture Decisions

When designing an image CDN architecture, evaluate:

### 1. Representation identity

What uniquely identifies the delivered image?

### 2. Cache cardinality

How many representations can one source asset produce?

### 3. Cache lifetime

How long can each representation safely remain cached?

### 4. Invalidation

How does updated content become visible?

### 5. Security

Can private or tenant-specific images cross cache boundaries?

### 6. Transformation cost

How expensive is a cache miss?

### 7. Origin protection

What happens during a traffic spike?

### 8. Failure behavior

What happens if the CDN, transformer, or origin fails?

### 9. Deployment

Can releases and rollbacks coexist safely with cached assets?

### 10. Observability

Can engineers distinguish:

```text
browser cache issue
CDN cache issue
origin issue
transformation issue
network issue
```

---

# 39. Four-Pillar Engineering Matrix

| Dimension    | Core Concern                  | Senior-Level Question                                  |
| ------------ | ----------------------------- | ------------------------------------------------------ |
| Mental Model | CDN + origin + browser cache  | Where is this representation actually served from?     |
| Mechanics    | Cache keys, TTL, revalidation | What determines whether this request is a hit?         |
| Architecture | Distribution + invalidation   | How does this scale globally and remain correct?       |
| Operations   | Metrics + failures            | How do we detect cache degradation or origin overload? |

---

# 40. Prediction Challenges

Before seeing the result, predict what will happen.

### Challenge 1

A product image changes but keeps the same URL.

What can users see across browser/CDN/origin caches?

---

### Challenge 2

You increase supported widths from:

```text
6 → 30
```

What happens to cache cardinality?

---

### Challenge 3

A CDN cache key ignores image width.

Two requests ask for:

```text
400px
1200px
```

What failure can occur?

---

### Challenge 4

A popular image expires at exactly the same time for thousands of users.

What happens to the origin?

---

### Challenge 5

Tenant ID is not part of a tenant-specific image cache key.

What class of failure can result?

---

### Challenge 6

The CDN hit ratio rises from:

```text
70% → 98%
```

but LCP becomes worse.

Does that prove the image architecture improved?

Why or why not?

---

### Challenge 7

An image transformer becomes slow while CDN hit ratio remains high.

What should you investigate?

---

# 41. Senior Interview Gotchas

### Gotcha 1

**“CDN caching makes images immutable.”**

Incorrect.

Caching policy and resource identity are separate concerns.

---

### Gotcha 2

**“A cache hit means the system is correct.”**

Incorrect.

The cache can return the wrong representation.

---

### Gotcha 3

**“Higher cache hit ratio always means better performance.”**

Incorrect.

Representation size, browser decoding, LCP, latency, and correctness still matter.

---

### Gotcha 4

**“Purging the CDN solves image versioning.”**

Not necessarily.

Global invalidation may be delayed or operationally expensive.

---

### Gotcha 5

**“Private images can use the same public CDN cache.”**

Only if the architecture provides strict authorization-aware isolation. Otherwise this can become a data leakage vulnerability.

---

### Gotcha 6

**“An image URL identifies the source asset.”**

Not necessarily.

A delivery URL may identify:

```text
source
+
transformation
+
format
+
quality
+
version
```

---

# 42. Core Invariants

Memorize these:

```text
same source asset
≠
same delivery representation
```

```text
cache hit
≠
correct representation
```

```text
higher cache hit rate
≠
automatically better UX
```

```text
immutable URL
→
simpler cache invalidation
```

```text
cache miss
→
potential transformation workload
```

```text
more variants
→
higher cache cardinality
```

```text
private representation
→
must respect authorization boundaries
```

```text
tenant-specific representation
→
tenant identity must participate in representation identity
```

```text
deployment safety
→
should not depend on fragile cache state
```

---

# 43. Completion Checklist

You should be able to explain:

* [ ] What an image CDN actually does
* [ ] CDN vs origin responsibilities
* [ ] Browser cache vs CDN cache
* [ ] Cache hierarchy
* [ ] Representation identity
* [ ] Cache-key design
* [ ] Cache cardinality
* [ ] Cache fragmentation
* [ ] Immutable image URLs
* [ ] Versioned assets
* [ ] TTL-based invalidation
* [ ] Explicit purge
* [ ] Stale-while-revalidate
* [ ] Stale-if-error
* [ ] Cache warming
* [ ] Request coalescing
* [ ] Cache stampede
* [ ] Origin shielding
* [ ] Global image delivery
* [ ] Transformation caching
* [ ] Public vs private image caching
* [ ] Personalized image risks
* [ ] Multi-tenant cache isolation
* [ ] Cache poisoning risks
* [ ] CDN observability
* [ ] Origin protection
* [ ] Deployment and rollback interaction
* [ ] CDN failure behavior
* [ ] Cache invalidation races
* [ ] Cache correctness vs cache hit rate

---

# 44. Part Boundary

This part establishes:

```text
Image CDN
+
Caching
+
Invalidation
+
Delivery
```

It does **not** deeply cover:

```text
image loading priority
lazy loading
LCP optimization
browser scheduling
preloading
critical image discovery
```

Those belong to:

> **KPI 10 — Part 06: Image Loading, Priority, Lazy Loading & LCP Architecture**

The progression is therefore:

```text
Part 01
Image Optimization Mental Model
        ↓
Part 02
Next.js <Image>
        ↓
Part 03
Responsive Images
        ↓
Part 04
Formats / Compression / Transformation
        ↓
Part 05
CDN / Caching / Invalidation / Delivery
        ↓
Part 06
Loading / Priority / Lazy Loading / LCP
```

---

# Final Mental Model

At senior level, think of image delivery as:

```text
Logical Asset
      ↓
Representation Identity
      ↓
Transformation
      ↓
Cache Identity
      ↓
CDN Distribution
      ↓
Browser Cache
      ↓
Network Transfer
      ↓
Decode
      ↓
Render
```

The central engineering problem is:

```text
Deliver the correct representation
to the correct user
from the closest appropriate cache
with bounded cache cardinality
without excessive origin computation
while preserving security,
freshness,
deployment safety,
and observability.
```

That is the actual image-CDN architecture problem.
