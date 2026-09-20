# Level 08 — KPI 10 — Part 05

## Image CDN, Caching, Invalidation & Delivery Architecture

---

## 1. Part Objective

This part establishes the production architecture for delivering optimized images through **CDNs, caches, and globally distributed delivery infrastructure**.

The central question is:

> Once an image representation has been selected and generated, how should that representation be delivered efficiently, safely, consistently, and predictably?

The focus is not primarily on choosing JPEG vs WebP vs AVIF, compression quality, or transformation algorithms. Those were established in Part 04.

The focus here is:

```text
Origin
   ↓
Image Processing / Delivery Service
   ↓
CDN / Edge Cache
   ↓
Browser Cache
   ↓
Rendered Image
```

The senior engineer must understand:

* where an image should be cached
* what makes two image requests the same cache object
* how cache keys are constructed
* how variants affect cache cardinality
* how image URLs become cache identities
* how immutable assets eliminate invalidation complexity
* how mutable assets require invalidation or revalidation
* how CDN caching affects origin load
* how cache misses behave
* how cache stampedes happen
* how multi-region delivery changes architecture
* how personalized images interact with caching
* how authorization interacts with shared caches
* how tenants must remain isolated
* how stale content is controlled
* how image delivery behaves during failures
* how to observe cache behavior in production

---

# 2. The Core Image Delivery Mental Model

A production image request is not simply:

```text
Browser → Server → Image
```

A more realistic architecture is:

```text
Browser
   ↓
Browser Cache
   ↓ miss
CDN / Edge
   ↓ miss
Origin / Image Service
   ↓
Transformation / Representation
   ↓
Origin Response
   ↓
CDN Stores Representation
   ↓
Browser Stores Representation
   ↓
Rendered Image
```

Every layer exists to prevent unnecessary work.

The objective is therefore:

```text
maximize cache reuse
+
minimize origin work
+
minimize network distance
+
preserve representation correctness
```

A useful abstraction is:

```text
Image Delivery =
Representation Identity
+
Cache Policy
+
Distribution
+
Invalidation Strategy
+
Security Boundary
+
Observability
```

---

# 3. CDN vs Origin Responsibilities

A common architectural mistake is treating the CDN as simply a faster HTTP server.

The CDN is primarily a **distribution and caching layer**.

The origin remains responsible for generating or retrieving the authoritative representation.

### Origin responsibilities

The origin/image service may be responsible for:

* retrieving the source image
* validating the requested representation
* transform the image
* selecting output format
* resizing
* cropping
* applying quality policy
* enforcing authorization
* generating response headers
* providing cacheable representations

### CDN responsibilities

The CDN may be responsible for:

* geographic distribution
* edge caching
* cache lookup
* cache revalidation
* request routing
* bandwidth delivery
* origin offload
* TLS termination
* edge-level security policies
* cache purge
* traffic absorption

Conceptually:

```text
Origin = authoritative computation/source

CDN = distributed delivery/cache layer
```

This distinction matters when debugging.

If the image is wrong:

```text
Could be origin generation.
```

If the image is correct but slow:

```text
Could be cache miss or CDN routing.
```

If the wrong tenant receives an image:

```text
Could be cache identity/security design.
```

---

# 4. The Three-Level Image Cache

A production image system commonly has multiple cache layers.

```text
             ┌───────────────────────┐
             │      Browser Cache    │
             └───────────┬───────────┘
                         │ miss
             ┌───────────▼───────────┐
             │      CDN / Edge       │
             └───────────┬───────────┘
                         │ miss
             ┌───────────▼───────────┐
             │ Origin / Image Cache  │
             └───────────┬───────────┘
                         │ miss
             ┌───────────▼───────────┐
             │ Source / Processing   │
             └───────────────────────┘
```

Each layer has different characteristics.

### Browser cache

Optimizes repeat requests from the same client.

### CDN cache

Optimizes reuse across many clients and geographic locations.

### Origin-side cache

Optimizes repeated transformation or source retrieval work before reaching the underlying storage or processing system.

The architectural goal is not simply:

> Cache everything.

The real question is:

> Which layer should own which cacheable representation?

---

# 5. Cache Identity Is the Central Problem

An image URL may look simple:

```text
/image/product-123
```

But the actual representation may depend on:

```text
source
width
height
format
quality
crop
DPR
tenant
locale
version
```

Therefore:

```text
same source
≠
same representation
```

For example:

```text
product-123
```

might produce:

```text
product-123?w=320
product-123?w=640
product-123?w=1280
```

Those are different representations.

Therefore the cache must distinguish them.

A useful model is:

```text
Cache Identity =
f(
  source identity,
  representation parameters,
  delivery policy
)
```

---

# 6. Cache Key Design

A cache key must include every dimension that can change the resulting representation.

For example:

```text
/source/123?w=640&format=webp&q=75
```

could represent:

```text
source = 123
width = 640
format = webp
quality = 75
```

If changing a parameter changes the bytes returned to the client, that parameter potentially belongs in the representation identity.

This produces an important invariant:

> If two requests can produce different bytes, they must not accidentally resolve to the same cache object.

---

# 7. The Dangerous Cache-Key Bug

Imagine:

```text
/image/123?width=640&format=webp
```

and:

```text
/image/123?width=1280&format=webp
```

If the CDN ignores `width` when constructing the cache key:

```text
Cache Key = /image/123
```

then:

```text
640px request
      ↓
cache miss
      ↓
640px representation stored
      ↓
1280px request
      ↓
cache hit
      ↓
receives 640px image
```

The cache is fast.

The system is still incorrect.

This illustrates:

```text
cache hit rate ≠ correctness
```

---

# 8. Cache Cardinality

Every additional representation dimension can multiply the number of cache objects.

Suppose you have:

```text
5 widths
×
3 formats
×
3 quality levels
×
2 crop modes
```

That produces:

```text
5 × 3 × 3 × 2 = 90
```

potential representations per source image.

For:

```text
100,000 source images
```

the theoretical representation space becomes:

```text
9,000,000 cache objects
```

This does not mean all objects will actually be generated.

But it demonstrates the architectural problem:

> Flexible image transformation creates cache cardinality.

Therefore:

```text
more configurability
→
more representation variants
→
more cache objects
→
more cache churn
→
lower reuse probability
```

Senior architecture therefore controls the number of variants deliberately.

---

# 9. Variant Explosion

A poorly designed image API might permit arbitrary:

```text
width
height
quality
format
crop
position
blur
sharpen
background
rotation
```

This creates enormous cache cardinality.

Instead of allowing unlimited values:

```text
width = any integer
```

the system can define approved widths:

```text
320
480
640
768
1024
1280
1536
```

This creates a controlled representation space.

Therefore:

```text
arbitrary transformation
```

should generally be avoided when:

```text
predictable caching
```

is more valuable.

---

# 10. Canonical Image URLs

A production system should preferably generate deterministic image URLs.

For example:

```text
/images/product-123/640.webp
```

is often easier to reason about than:

```text
/image?id=123&w=640&fmt=webp&q=74&crop=auto
```

Both can work.

The important property is determinism.

A canonical representation should map:

```text
same source
+
same representation policy
```

to:

```text
same delivery identity
```

This improves:

* CDN reuse
* browser reuse
* observability
* debugging
* invalidation
* reproducibility

---

# 11. Immutable Image URLs

One of the strongest image caching strategies is **content/version-based identity**.

Instead of:

```text
/images/product-123.jpg
```

use something conceptually like:

```text
/images/product-123.v42.jpg
```

or:

```text
/images/abc123hash.jpg
```

The URL changes whenever the underlying representation changes.

This produces:

```text
URL identity
=
content/version identity
```

Then the system can use long-lived caching.

For example:

```text
Cache-Control: public, max-age=31536000, immutable
```

The exact policy depends on the infrastructure, but the architectural idea is:

> Never mutate an object behind an immutable URL.

---

# 12. Why Versioned URLs Reduce Invalidation Complexity

Suppose:

```text
/image/product-123
```

currently represents:

```text
old image
```

and the source image changes.

With a mutable URL:

```text
/image/product-123
```

you must consider:

* browser caches
* CDN caches
* origin caches
* stale clients
* purge propagation
* race conditions
* TTL expiration

With versioned identity:

```text
/image/product-123.v1
```

becomes:

```text
/image/product-123.v2
```

The old object can safely remain cached.

The new object has a different identity.

Therefore:

```text
versioning
→
new identity
→
no ambiguity
→
no global purge requirement
```

This is one of the most important cache architecture patterns in frontend infrastructure.

---

# 13. Mutable vs Immutable Assets

### Immutable

```text
URL changes when content changes
```

Advantages:

* long TTL
* high cache efficiency
* simple deployment
* simple rollback
* minimal purge requirements

### Mutable

```text
URL stays the same while content changes
```

Advantages:

* stable URLs
* easier external references

Costs:

* invalidation complexity
* stale content risk
* revalidation traffic
* race conditions
* more difficult debugging

The decision should be explicit.

---

# 14. TTL Architecture

A CDN needs to know how long a representation can remain fresh.

Conceptually:

```text
TTL = acceptable staleness window
```

A static versioned image may have:

```text
very long TTL
```

A frequently changing image may have:

```text
shorter TTL
```

A personalized image may require:

```text
private/no shared caching
```

The correct TTL depends on:

```text
content volatility
+
identity strategy
+
business freshness requirement
+
invalidation capability
```

---

# 15. TTL Is Not the Same as Invalidation

These mechanisms solve different problems.

### TTL

Answers:

> How long may this cached representation remain fresh?

### Invalidation

Answers:

> How do we remove or supersede this representation before its normal expiry?

For example:

```text
TTL = 7 days
```

does not mean:

```text
content cannot change for 7 days
```

It means the cache may continue serving the object according to its caching policy unless another mechanism causes revalidation or invalidation.

---

# 16. Revalidation

Instead of immediately downloading the complete representation again, a cache can sometimes ask the origin whether the object changed.

Conceptually:

```text
Cache
  ↓
"Has this representation changed?"
  ↓
Origin
  ↓
"No"
```

The origin can indicate that the cached object remains valid.

This reduces:

* response bytes
* transformation work
* origin bandwidth

The key concept is:

```text
freshness validation
≠
full object regeneration
```

---

# 17. Stale-While-Revalidate

A useful caching pattern is:

```text
serve stale object
+
refresh in background
```

Conceptually:

```text
Client request
      ↓
stale cache object exists
      ↓
serve existing object immediately
      ↓
background revalidation
      ↓
new object stored
```

This can reduce latency while allowing eventual freshness.

The tradeoff is explicit:

```text
lower latency
vs
temporary staleness
```

It is appropriate only when the product can tolerate that staleness.

---

# 18. Stale-If-Error

Another useful resilience strategy is allowing an already cached representation to remain usable when the origin becomes unavailable.

Conceptually:

```text
Origin healthy
    ↓
fresh object

Origin failure
    ↓
serve stale cached object
```

For static or semi-static images, this can provide significant resilience.

An image that is slightly stale is often more useful than:

```text
broken image
```

during an origin outage.

Again, this is a product decision rather than a universal rule.

---

# 19. Cache Hit and Miss Architecture

A request can follow:

```text
Browser HIT
```

or:

```text
Browser MISS
      ↓
CDN HIT
```

or:

```text
Browser MISS
      ↓
CDN MISS
      ↓
Origin HIT
```

or:

```text
Browser MISS
      ↓
CDN MISS
      ↓
Origin MISS
      ↓
Transformation
      ↓
Storage
```

These paths have dramatically different performance characteristics.

A senior engineer should always ask:

> Which layer is actually missing?

---

# 20. Cache Hit Ratio

A useful metric is:

```text
Cache Hit Ratio =
cache hits / total cache requests
```

For example:

```text
900,000 hits
100,000 misses
```

gives:

```text
90% hit ratio
```

But a single global hit ratio can be misleading.

You may need:

```text
browser hit ratio
CDN hit ratio
origin cache hit ratio
per-region hit ratio
per-image-class hit ratio
per-variant hit ratio
```

A 95% global hit ratio may hide:

```text
99% for thumbnails
40% for hero images
```

which could create substantial origin load.

---

# 21. Origin Offload

The CDN's primary operational value is often reducing origin work.

Suppose:

```text
10 million image requests
```

reach the CDN.

If:

```text
95%
```

are cache hits, then approximately:

```text
9.5 million
```

requests do not require origin retrieval.

Only:

```text
500,000
```

reach the origin layer.

This reduces:

* origin CPU
* image transformation work
* database/storage reads
* network egress from origin
* latency
* infrastructure cost

---

# 22. Cache Stampede

A dangerous failure mode occurs when many requests simultaneously encounter an expired object.

For example:

```text
popular-image
```

expires at:

```text
12:00:00
```

At:

```text
12:00:01
```

10,000 clients request it.

Without coordination:

```text
10,000 cache misses
→
10,000 origin requests
→
10,000 transformations
```

This is a cache stampede.

The cache did not merely miss.

It amplified load.

---

# 23. Request Coalescing / Single Flight

A better architecture can coordinate concurrent misses.

Instead of:

```text
Request A → origin
Request B → origin
Request C → origin
Request D → origin
```

the system can perform:

```text
Request A ─┐
Request B ─┤
Request C ─┼→ one origin generation
Request D ─┘
                ↓
             response
                ↓
        shared cache object
```

This is commonly called:

* request coalescing
* single flight
* collapsed forwarding

The principle is:

> Concurrent requests for the same missing representation should ideally share one generation operation.

---

# 24. Cache Warming

For predictable traffic, caches can sometimes be warmed before users request an object.

For example:

```text
new product launch
```

may be expected to receive:

```text
millions of requests
```

The system can pre-generate or prefetch high-value representations.

Conceptually:

```text
Deploy
  ↓
Generate important image variants
  ↓
Populate CDN
  ↓
Traffic arrives
  ↓
High cache hit rate
```

This is useful when demand is predictable.

It is not always worth doing.

Cache warming itself consumes:

* bandwidth
* compute
* storage
* origin capacity

Therefore it should be targeted.

---

# 25. Origin Shielding

Large CDN architectures may introduce an additional shielding layer between edge locations and the origin.

Conceptually:

```text
Users
  ↓
Edge POPs
  ↓
Shield Layer
  ↓
Origin
```

Without shielding:

```text
many edge locations
→
origin
```

With shielding:

```text
many edge locations
→
smaller set of shield locations
→
origin
```

This can reduce origin request fan-out.

The important mental model is:

```text
edge distribution
≠
origin protection
```

A globally distributed CDN can still create substantial origin load if cache misses propagate independently from many locations.

---

# 26. Geographic Distribution

A CDN can place image representations close to users.

Conceptually:

```text
India user
   ↓
regional edge

US user
   ↓
US edge

Europe user
   ↓
European edge
```

This reduces network distance.

However, global distribution creates additional considerations:

* regional cache populations
* cache fill duplication
* invalidation propagation
* routing
* origin geography
* consistency
* regional outages

A cache hit in one region does not necessarily imply a cache hit in another.

---

# 27. Global Cache Warmth

Consider:

```text
Image A
```

with:

```text
10 million requests in US
1,000 requests in India
```

The US cache may be extremely warm.

The India edge may remain cold.

Therefore:

```text
global popularity
≠
regional cache popularity
```

Observability must account for geographic distribution.

---

# 28. Browser Cache vs CDN Cache

These are different scopes.

### Browser cache

Typically:

```text
one user/device
```

### CDN cache

Typically:

```text
many users
```

Therefore a browser hit can hide CDN behavior.

For example:

```text
User refreshes page
```

and sees:

```text
browser HIT
```

The CDN was never contacted.

To diagnose CDN performance correctly, test with:

* cache-busting where appropriate
* controlled requests
* DevTools cache settings
* CDN response headers
* repeated requests from multiple clients/regions

---

# 29. Cache-Control Architecture

HTTP caching policy should communicate intended cache behavior.

Conceptually:

```text
public
```

means the representation may be shared by caches where appropriate.

```text
private
```

means the representation should be treated as user-specific.

```text
max-age
```

defines a freshness lifetime.

```text
s-maxage
```

can define shared-cache freshness separately from browser freshness.

The important architectural principle is:

> Browser caching and shared-cache caching can have different requirements.

---

# 30. Public vs Personalized Images

This is one of the most important boundaries in image delivery.

A public image:

```text
/logo.png
```

may be safely shared.

A personalized image:

```text
/avatar/generated-for-user-123
```

may contain user-specific information.

The caching policy must therefore reflect representation privacy.

A dangerous design is:

```text
personalized response
+
public shared cache
```

because another user could receive the cached representation.

---

# 31. The Personalized Image Leakage Failure

Imagine:

```text
GET /profile/header
```

for:

```text
User A
```

returns:

```text
Image containing User A's private information
```

If the CDN cache key is only:

```text
/profile/header
```

then:

```text
User A
→ cache stores response

User B
→ same URL
→ cache HIT
→ receives User A's image
```

This is a catastrophic cache-boundary failure.

The problem is not merely performance.

It is:

```text
authorization failure
+
cache identity failure
```

---

# 32. Authentication and Shared Image Caches

Authentication does not automatically mean:

```text
never cache
```

Instead ask:

> Is the representation identical for all authorized users?

If yes:

```text
public/shared cache may be possible
```

If no:

```text
representation identity must account for the user boundary
```

or the response should remain private.

The key distinction is:

```text
authenticated request
≠
personalized representation
```

---

# 33. Tenant Isolation

Multi-tenant systems require the same discipline.

Suppose:

```text
Tenant A
/image/logo
```

and:

```text
Tenant B
/image/logo
```

produce different images.

If the CDN key is:

```text
/image/logo
```

then the representations collide.

A safer identity might conceptually be:

```text
tenant-A/image/logo
tenant-B/image/logo
```

or use a tenant-specific hostname:

```text
tenant-a.example.com/image/logo
tenant-b.example.com/image/logo
```

The important invariant is:

> Cache identity must preserve tenant representation boundaries.

---

# 34. Cache Poisoning

A cache poisoning scenario occurs when an attacker causes an incorrect response to become cached and subsequently served to other users.

Potential causes include:

* untrusted cache-key parameters
* host/header confusion
* incorrect normalization
* attacker-controlled transformation options
* inconsistent origin/CDN cache interpretation

The security model must therefore consider:

```text
request normalization
+
cache key construction
+
origin authorization
+
response caching policy
```

Caching is part of the security architecture.

---

# 35. Signed Image URLs

Private image delivery may use signed URLs.

Conceptually:

```text
/image/private/123
   +
expiration
   +
signature
```

The server/CDN verifies:

```text
signature valid?
not expired?
allowed resource?
allowed transformation?
```

This can allow controlled CDN delivery without making the underlying image publicly accessible.

The architectural tradeoff is that signatures introduce another dimension into request authorization.

The system must decide whether the signature itself belongs in the cache identity or can be normalized away safely.

---

# 36. Tokenized URLs and Cache Efficiency

Consider:

```text
/image/123?token=ABC
/image/123?token=XYZ
```

If the CDN treats the entire query string as the cache key:

```text
different token
→
different cache object
```

This can destroy cache reuse.

Therefore secure delivery requires careful separation between:

```text
authorization identity
```

and:

```text
representation identity
```

The CDN must not accidentally turn every authorization token into a unique representation unless that is intentional.

---

# 37. Cache Invalidation

Sometimes content must change immediately.

For example:

```text
copyrighted image removed
security-sensitive image removed
incorrect image published
tenant deleted
content revoked
```

If the URL remains unchanged, the system may need explicit invalidation.

Possible strategies include:

```text
purge by URL
purge by prefix
purge by tag
short TTL
revalidation
versioned URL
```

The preferred mechanism depends on the architecture.

---

# 38. Versioning vs Purging

A useful decision framework:

### Versioning

```text
content changes
→
new URL
```

Best when:

* assets are immutable
* URL changes are acceptable
* long-lived caching is valuable

### Purging

```text
content changes
→
same URL
→
remove cached representation
```

Best when:

* stable URLs are required
* content must be replaced immediately
* CDN supports reliable purge semantics

### Short TTL

```text
content changes
→
wait for expiration
```

Best when:

* some staleness is acceptable
* operational simplicity matters

---

# 39. Invalidation Race Conditions

Suppose:

```text
Version A
```

is cached.

The source changes to:

```text
Version B
```

An invalidation request is issued.

But before all CDN regions receive the purge:

```text
Region 1 → B
Region 2 → A
Region 3 → A
```

Users can temporarily see different versions.

This illustrates:

```text
invalidation is distributed
```

and therefore:

```text
purge request
≠
instantaneous global consistency
```

For systems requiring strict identity consistency, versioned URLs are often easier to reason about.

---

# 40. Deployment and Image Cache Identity

Application deployments can introduce new image processing behavior.

For example:

```text
Deployment V1
→ quality profile A
```

then:

```text
Deployment V2
→ quality profile B
```

If the URL remains:

```text
/image/123?w=640
```

the CDN may continue serving the representation generated under V1.

This may be correct or incorrect depending on the architecture.

If the representation policy changes materially, consider versioning:

```text
/image/v2/123/640.webp
```

This makes representation policy changes explicit.

---

# 41. Cache Invalidation Should Follow Ownership

A useful architecture is:

```text
Source mutation
      ↓
Resource version change
      ↓
Representation identity changes
      ↓
New URL
      ↓
New cache object
```

rather than:

```text
Source mutation
      ↓
search every CDN
      ↓
purge every possible variant
      ↓
hope no stale representation survives
```

The second approach becomes difficult as systems scale.

---

# 42. Failure Mode: Stale Image

Symptoms:

```text
CMS shows new image
but
frontend shows old image
```

Possible causes:

* browser cache
* CDN cache
* origin cache
* missing invalidation
* long TTL
* immutable URL incorrectly reused
* stale-while-revalidate behavior

Debugging should trace:

```text
URL
→ browser cache
→ CDN status
→ origin response
→ source asset
```

Do not immediately blame the CDN.

---

# 43. Failure Mode: Wrong Variant

Symptoms:

```text
mobile receives desktop-sized image
```

Possible causes:

* incorrect `sizes`
* incorrect `srcset`
* CDN cache-key collision
* transformation parameter dropped
* URL normalization bug

Part 03 focused on responsive selection.

Here the cache-specific question is:

> Did different representation requests collapse into the same cache object?

---

# 44. Failure Mode: Cache Miss Storm

Symptoms:

```text
origin CPU spikes
image transformation latency spikes
CDN hit ratio falls
```

Potential causes:

* mass expiration
* deployment
* cache purge
* cache-key change
* new image variant rollout
* traffic surge
* regional cache cold start

A senior engineer should investigate the relationship:

```text
traffic
+
cache hit ratio
+
origin request rate
+
transformation rate
```

rather than looking at latency alone.

---

# 45. Failure Mode: Origin Outage

Suppose:

```text
origin unavailable
```

If the CDN has valid cached images:

```text
users may continue receiving cached content
```

If everything is uncached:

```text
images fail immediately
```

Therefore caching can act as a resilience layer.

This is why:

```text
cache architecture
```

is also:

```text
availability architecture
```

---

# 46. Failure Mode: CDN Outage

A CDN is itself an infrastructure dependency.

If the CDN fails:

```text
Browser
  ↓
CDN unavailable
```

Possible architecture responses include:

* alternate CDN
* origin fallback
* multi-CDN routing
* regional failover
* degraded image behavior
* cached browser representations

However, redundancy adds operational complexity.

The correct architecture depends on business requirements.

---

# 47. Multi-CDN Architecture

Large systems may use:

```text
Users
  ↓
Global routing
  ↓
CDN A / CDN B
  ↓
Origin
```

Benefits:

* provider redundancy
* geographic optimization
* traffic steering
* resilience

Costs:

* duplicated configuration
* inconsistent cache behavior
* invalidation complexity
* observability fragmentation
* URL/signing differences
* operational overhead

Multi-CDN should solve a real requirement rather than exist merely because redundancy sounds valuable.

---

# 48. Image Delivery Observability

A production system should expose enough information to answer:

> Why was this image slow?

Useful dimensions include:

```text
request URL
image ID
variant
width
format
quality
CDN region
cache status
cache age
origin latency
transformation latency
response size
status code
```

Useful metrics:

```text
CDN hit ratio
origin request rate
origin bandwidth
transformation count
transformation latency
image response latency
error rate
cache object count
cache eviction rate
regional hit ratio
```

---

# 49. Cache Headers as Debugging Evidence

Response headers can reveal important information.

Conceptually:

```text
Cache-Control
Age
ETag
Last-Modified
CDN-Cache-Status
X-Cache
```

The exact header names depend on infrastructure.

The point is that cache behavior should be observable.

A senior engineer should be able to inspect:

```text
request
→ response headers
→ cache status
→ origin path
```

and form a hypothesis.

---

# 50. Image Cache Architecture Matrix

| Concern             | Decision                                     |
| ------------------- | -------------------------------------------- |
| Image identity      | What uniquely identifies the representation? |
| Variant identity    | Which parameters affect bytes?               |
| Cache key           | How are variants separated?                  |
| Browser cache       | What should clients retain?                  |
| CDN cache           | What can be shared globally?                 |
| Origin cache        | What computation can be reused?              |
| TTL                 | How long is staleness acceptable?            |
| Revalidation        | How is freshness checked?                    |
| Invalidation        | How are urgent changes propagated?           |
| Versioning          | Can URL identity represent content identity? |
| Personalization     | Is the representation user-specific?         |
| Tenant isolation    | Can tenants share cache objects?             |
| Security            | Can untrusted requests poison shared caches? |
| Stampede protection | What happens during concurrent misses?       |
| Geographic delivery | Where should representations be cached?      |
| Observability       | How is cache behavior measured?              |

---

# 51. Four-Pillar Engineering Matrix

Every image CDN decision should be evaluated across four dimensions.

## Pillar 1 — Correctness

Ask:

* Can the wrong image be served?
* Can the wrong variant be served?
* Can stale content violate product requirements?
* Can tenants receive each other's images?
* Can personalized content leak?

---

## Pillar 2 — Performance

Ask:

* What is the browser hit rate?
* What is the CDN hit rate?
* How many requests reach origin?
* How expensive are cache misses?
* How much bandwidth is saved?
* How close are users to the serving edge?

---

## Pillar 3 — Maintainability

Ask:

* Is cache identity deterministic?
* Can engineers reason about invalidation?
* Are variants bounded?
* Can deployments change representation safely?
* Can cache failures be debugged?

---

## Pillar 4 — Scalability

Ask:

* What happens with millions of assets?
* What happens with millions of variants?
* What happens during traffic spikes?
* What happens when a popular image expires?
* What happens during regional failure?
* Can the origin survive a cold-cache event?

---

# 52. Production Image Delivery Architecture

A mature architecture can look like:

```text
                    ┌───────────────────┐
                    │      Browser      │
                    └─────────┬─────────┘
                              │
                       Browser Cache
                              │ miss
                              ▼
                    ┌───────────────────┐
                    │    CDN / Edge     │
                    └─────────┬─────────┘
                              │ miss
                              ▼
                    ┌───────────────────┐
                    │  Origin Shield    │
                    └─────────┬─────────┘
                              │ miss
                              ▼
                    ┌───────────────────┐
                    │ Image Delivery    │
                    │     Service       │
                    └─────────┬─────────┘
                              │
                       Origin Cache
                              │ miss
                              ▼
                    ┌───────────────────┐
                    │ Source / Storage  │
                    └───────────────────┘
```

The representation identity flows through the entire system:

```text
Source Identity
      ↓
Representation Identity
      ↓
Cache Key
      ↓
CDN Object
      ↓
Browser Cache Object
```

That alignment is critical.

---

# 53. The Most Important Invariants

Memorize these.

### Invariant 1

```text
same source ≠ same representation
```

### Invariant 2

```text
if bytes can differ, cache identity must be able to differ
```

### Invariant 3

```text
cache hit ≠ correctness
```

### Invariant 4

```text
TTL ≠ invalidation
```

### Invariant 5

```text
immutable URL → simpler invalidation
```

### Invariant 6

```text
personalized representation ≠ automatically shared cacheable
```

### Invariant 7

```text
authenticated request ≠ automatically private representation
```

### Invariant 8

```text
more variants → larger cache cardinality
```

### Invariant 9

```text
cache miss can become origin amplification
```

### Invariant 10

```text
cache architecture is part of security architecture
```

### Invariant 11

```text
global CDN ≠ globally warm cache
```

### Invariant 12

```text
cache architecture is also availability architecture
```

---

# 54. Prediction Challenges

Before reading the answers, predict what should happen.

### Challenge 1

A 640px WebP image is cached.

A request arrives for:

```text
1280px WebP
```

but the CDN cache key ignores width.

What happens?

**Expected reasoning:**

The 1280px request can incorrectly receive the cached 640px representation.

---

### Challenge 2

A product image uses:

```text
/image/product-123
```

The source changes but the URL does not.

CDN TTL is:

```text
30 days
```

What can happen?

**Expected reasoning:**

The old representation can remain cached until expiration or explicit revalidation/invalidation.

---

### Challenge 3

A source image is versioned:

```text
/image/product-123.v1
```

It changes to:

```text
/image/product-123.v2
```

Does the CDN need to purge v1 before serving v2?

**Expected reasoning:**

No. The new URL creates a new cache identity.

---

### Challenge 4

100,000 clients request the same uncached image simultaneously.

What should a robust image architecture avoid?

**Expected reasoning:**

100,000 independent origin transformations.

Request coalescing/single-flight behavior should ideally collapse the work.

---

### Challenge 5

Tenant A and Tenant B both request:

```text
/logo
```

but receive different logos.

What must the cache architecture guarantee?

**Expected reasoning:**

The tenant dimension must be represented in the resource/cache identity or the assets must have tenant-isolated URLs/hosts.

---

### Challenge 6

A private user-specific image is cached publicly using only its path as the cache key.

What is the risk?

**Expected reasoning:**

Cross-user data leakage.

---

### Challenge 7

CDN hit ratio is 98%.

Origin CPU is still extremely high.

Is that impossible?

**Expected reasoning:**

No.

The remaining 2% can still represent enormous absolute traffic, expensive transformations, or high-cardinality variants.

---

### Challenge 8

The CDN is healthy but users in one region experience slow image delivery.

What should you investigate?

**Expected reasoning:**

Regional cache warmth, edge routing, regional hit ratio, origin distance, cache misses, and regional CDN behavior.

---

# 55. Senior Interview Questions

### Question 1

> How would you design caching for a global image platform?

A strong answer should discuss:

```text
browser cache
CDN
origin cache
representation identity
cache keys
variant control
TTL
versioning
invalidation
origin protection
regional distribution
observability
```

---

### Question 2

> Why are immutable image URLs useful?

Expected concepts:

```text
URL = identity
content change = new identity
long TTL
minimal invalidation
better cache reuse
simpler rollback
```

---

### Question 3

> How can an image CDN accidentally serve the wrong image?

Discuss:

* cache-key collision
* missing variant parameters
* tenant collision
* host normalization
* authorization boundaries
* stale representations

---

### Question 4

> How would you protect an image service from a cache stampede?

Discuss:

```text
request coalescing
single-flight
TTL jitter
stale-while-revalidate
cache warming
origin shielding
bounded concurrency
```

---

### Question 5

> How do you cache private images?

Discuss:

```text
private caching
signed URLs
authorization
cache identity
token normalization
expiration
tenant isolation
```

---

### Question 6

> Why isn't a high CDN hit ratio enough?

Because:

```text
hit ratio alone
does not reveal
variant correctness,
regional behavior,
origin cost,
transformation cost,
or security boundaries.
```

---

# 56. Production Debugging Sequence

When an image is slow:

```text
1. Identify the exact image URL.
2. Identify the requested representation.
3. Check browser cache behavior.
4. Inspect CDN cache status.
5. Determine cache HIT/MISS.
6. Inspect response headers.
7. Check CDN region.
8. Check origin request rate.
9. Check transformation latency.
10. Check cache-key dimensions.
11. Check whether a new variant was introduced.
12. Check whether invalidation recently occurred.
```

When an image is wrong:

```text
1. Identify expected representation.
2. Identify actual representation.
3. Compare source identity.
4. Compare transformation parameters.
5. Compare cache key.
6. Check tenant/user identity.
7. Check stale cache state.
8. Check deployment/version.
9. Check CDN normalization.
10. Verify origin output independently.
```

---

# 57. Anti-Patterns

## Anti-Pattern 1 — One Mutable URL Forever

```text
/image/product-123
```

with:

```text
very long TTL
```

and:

```text
no invalidation strategy
```

creates stale-content problems.

---

## Anti-Pattern 2 — Unlimited Variant Parameters

```text
width = arbitrary
quality = arbitrary
crop = arbitrary
```

creates cache explosion.

---

## Anti-Pattern 3 — Ignoring Tenant Identity

```text
tenant + same path
→
same CDN key
```

can cause cross-tenant leakage.

---

## Anti-Pattern 4 — Treating Authentication as Sufficient Cache Isolation

```text
authenticated request
→
public CDN cache
```

is unsafe when the response is personalized.

---

## Anti-Pattern 5 — Assuming Purge Is Instantaneous

Distributed invalidation can have propagation delays.

---

## Anti-Pattern 6 — Looking Only at Global Hit Ratio

Regional and variant-level behavior may be completely different.

---

## Anti-Pattern 7 — No Stampede Protection

A popular image expiration event can overwhelm the origin.

---

## Anti-Pattern 8 — Making CDN Behavior Invisible

If engineers cannot determine:

```text
HIT?
MISS?
which region?
which variant?
which cache key?
```

production debugging becomes unnecessarily difficult.

---

# 58. Part Boundary

This part established:

```text
Image CDN
Cache Identity
Cache Keys
Cache Cardinality
TTL
Revalidation
Invalidation
Versioning
Origin Offload
Stampede Protection
Geographic Delivery
Security Boundaries
Observability
```

The next part moves from **where and how images are cached** to **when images should be requested and how loading priority affects user-perceived performance**.

Therefore:

```text
Part 05
Image CDN, Caching & Delivery
        ↓
Part 06
Image Loading, Priority, Lazy Loading & LCP
```

Do not duplicate Part 05 into Part 06.

Part 06 should focus on:

```text
request timing
+
loading priority
+
lazy loading
+
eager loading
+
preload
+
LCP
+
critical image discovery
+
browser scheduling
+
loading behavior
```

---

# 59. Completion Checklist

You should be able to explain all of the following without notes:

### CDN Architecture

* [ ] CDN vs origin responsibilities
* [ ] edge caching
* [ ] origin shielding
* [ ] geographic distribution
* [ ] browser vs CDN cache

### Cache Identity

* [ ] cache keys
* [ ] representation identity
* [ ] variant dimensions
* [ ] cache cardinality
* [ ] variant explosion

### Freshness

* [ ] TTL
* [ ] revalidation
* [ ] stale-while-revalidate
* [ ] stale-if-error
* [ ] invalidation

### Immutability

* [ ] versioned URLs
* [ ] content identity
* [ ] immutable assets
* [ ] deployment-safe image URLs

### Scalability

* [ ] cache hit ratio
* [ ] origin offload
* [ ] cache warming
* [ ] request coalescing
* [ ] cache stampede
* [ ] regional cache behavior

### Security

* [ ] public vs private images
* [ ] personalized representations
* [ ] tenant isolation
* [ ] signed URLs
* [ ] cache poisoning
* [ ] authorization boundaries

### Operations

* [ ] CDN observability
* [ ] cache status debugging
* [ ] regional metrics
* [ ] origin load monitoring
* [ ] transformation monitoring
* [ ] invalidation debugging
* [ ] CDN failure handling

---

# 60. Final Mental Model

The complete image delivery model is:

```text
                    SOURCE
                      │
                      ▼
              Representation
                   Identity
                      │
                      ▼
                Cache Key
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
 Browser Cache                 CDN / Edge
        │                           │
        │                     cache HIT?
        │                           │
        │                    ┌──────┴──────┐
        │                    │             │
        │                   YES            NO
        │                    │             │
        │                    │             ▼
        │                    │       Origin / Image
        │                    │          Service
        │                    │             │
        │                    │        transform/
        │                    │        retrieve
        │                    │             │
        │                    │             ▼
        │                    │       Cache response
        │                    │             │
        └────────────────────┴─────────────┘
                             │
                             ▼
                       Browser Decode
```

The senior-level principle is:

> **An image CDN is not merely a faster place to store files. It is a distributed representation system whose correctness depends on identity, whose performance depends on cache reuse, whose scalability depends on bounded variants and origin protection, and whose security depends on separating shared representation identity from private authorization context.**

The deepest invariant is:

```text
Representation Identity
        ↓
Cache Identity
        ↓
Delivery Identity
```

When these three disagree, the system can become:

```text
slow
stale
incorrect
expensive
or insecure
```

When they align, image delivery becomes:

```text
predictable
cache-efficient
globally scalable
debuggable
and resilient
```

**Part 05 complete.**
