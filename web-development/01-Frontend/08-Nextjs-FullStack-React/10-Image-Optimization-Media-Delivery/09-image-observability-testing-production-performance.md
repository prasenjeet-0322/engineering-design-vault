# Level 08 — Next.js & Full-Stack React

## KPI 10 — Image Optimization

# Part 09 — Image Observability, Testing & Production Performance

---

## 1. Part Objective

A production image system is not complete when the images are optimized.

It is complete when the team can answer:

* Are the right image representations being delivered?
* Are critical images discovered early?
* Are images affecting LCP?
* Are CDN caches behaving correctly?
* Are transformations consuming excessive CPU?
* Are image failures increasing?
* Are responsive candidates correct?
* Are accessibility regressions occurring?
* Are security controls rejecting malicious inputs?
* Did a deployment make image performance worse?

The core production model is:

```text
Image System
    ↓
Measure
    ↓
Detect
    ↓
Diagnose
    ↓
Remediate
    ↓
Verify
    ↓
Prevent Regression
```

The central senior-level principle is:

> **Image optimization is an operational system, not a one-time configuration exercise.**

---

# 2. Image Observability Mental Model

The image pipeline established in previous parts is:

```text
Asset
 ↓
Representation
 ↓
Transformation
 ↓
Responsive Selection
 ↓
CDN
 ↓
Browser
 ↓
Decode
 ↓
Paint
 ↓
User Experience
```

Observability should exist across the same pipeline:

```text
Asset
 ↓
Transformation Metrics
 ↓
CDN Metrics
 ↓
Browser Resource Timing
 ↓
LCP / UX Metrics
 ↓
RUM
```

This allows engineering teams to correlate:

```text
backend behavior
```

with:

```text
frontend user experience.
```

---

# 3. Three Observability Layers

A useful production model is:

```text
1. Browser
2. CDN / Edge
3. Origin / Image Processing
```

### Browser

Measures:

* request timing
* selected resource
* transfer size
* LCP
* layout behavior
* device/network context

### CDN

Measures:

* cache hits
* cache misses
* edge latency
* response status
* bandwidth
* origin fetches

### Origin / Transformer

Measures:

* transformation latency
* CPU
* memory
* source fetch latency
* failures
* queue depth
* concurrency

The senior engineer connects these layers rather than looking at only one dashboard.

---

# 4. Browser Resource Timing

The browser exposes timing information for resources.

Conceptually:

```text
Navigation
   ↓
Image request
   ↓
DNS
   ↓
Connection
   ↓
Request
   ↓
Response
   ↓
Transfer
```

This can help answer:

```text
When was the image requested?
How long did it take?
How large was the response?
```

This is particularly useful when diagnosing real-user performance.

---

# 5. Discovery Time vs Request Time

One important distinction is:

```text
Image exists in DOM
```

versus:

```text
Image request starts
```

A performance investigation should determine:

```text
image discovery
→
request start
→
response
→
render
```

If request start is unexpectedly late, the problem may be:

* rendering architecture
* JavaScript execution
* streaming order
* resource priority
* lazy-loading configuration
* client-side data dependency

rather than image compression.

---

# 6. Transfer Size

Measure:

```text
encoded response size
```

for important images.

This allows teams to identify:

```text
oversized hero
oversized thumbnail
unexpected high-resolution candidate
wrong format
missing transformation
```

But transfer size must not be treated as the only performance metric.

Remember:

```text
small bytes
≠
fast LCP
```

---

# 7. Selected Image Representation

Responsive image systems can select different candidates depending on:

```text
viewport
DPR
network conditions
sizes
browser behavior
```

Production observability should therefore help identify which representation was actually delivered.

For example:

```text
Expected:
640px

Actual:
2048px
```

This may indicate a problem with:

```text
sizes
layout assumptions
candidate generation
browser selection
```

---

# 8. Image Request Failure Taxonomy

Do not collapse all image failures into:

```text
image failed
```

Classify failures.

For example:

```text
4xx
→ invalid / unavailable resource

5xx
→ server / infrastructure failure

timeout
→ dependency / network failure

transformation error
→ processing failure

validation rejection
→ security / input policy

cache failure
→ delivery issue

decode failure
→ invalid image representation
```

Failure taxonomy makes debugging actionable.

---

# 9. HTTP Status Monitoring

Track image response status by category:

```text
2xx
3xx
4xx
5xx
```

A sudden increase in:

```text
404
```

may indicate:

* broken asset references
* deployment mismatch
* deleted content
* stale CMS data

A sudden increase in:

```text
5xx
```

may indicate:

* transformer failure
* origin outage
* CDN/origin connectivity
* resource exhaustion

---

# 10. CDN Cache Hit Ratio

Part 05 established cache architecture.

Now observability must verify it.

Track:

```text
cache hits
cache misses
hit ratio
origin fetches
```

For example:

```text
Requests = 1,000,000
Hits = 950,000
Misses = 50,000
```

Then:

```text
Hit Ratio = 95%
```

But aggregate hit ratio is not sufficient.

Break it down by:

* image family
* route
* tenant where appropriate
* region
* format
* transformation
* cache key version

---

# 11. Cache Hit Ratio Can Hide Problems

Suppose overall hit ratio is:

```text
99%
```

but the hero image has:

```text
50%
```

hit ratio.

The aggregate metric hides a critical-path problem.

Therefore metrics should be segmented by important resource classes.

A senior dashboard might include:

```text
LCP images
Product images
User avatars
Generated thumbnails
Other assets
```

---

# 12. Cache Miss Latency

A cache miss is not simply:

```text
MISS = bad
```

The important question is:

```text
What does a miss cost?
```

For example:

```text
Cache hit:
50ms

Cache miss:
900ms
```

Then misses are materially affecting UX.

Track:

```text
hit latency
miss latency
origin latency
transformation latency
```

---

# 13. Transformation Latency

Image transformations can involve:

```text
decode
resize
crop
encode
```

Measure transformation duration.

For example:

```text
p50 = 20ms
p95 = 80ms
p99 = 600ms
```

A high tail may indicate:

* unusually large source images
* expensive codecs
* uncommon dimensions
* resource contention
* malformed inputs
* cache misses

---

# 14. Percentiles Matter

Average latency can hide tail behavior.

Consider:

```text
Requests:
20ms
20ms
20ms
20ms
1000ms
```

Average:

```text
216ms
```

but most requests are actually fast.

Therefore production image systems should use:

```text
p50
p75
p90
p95
p99
```

where useful.

This is particularly important for:

```text
transformation latency
origin latency
CDN latency
image request latency
```

---

# 15. Origin Load

Track how much image traffic reaches the origin.

For example:

```text
Total image requests
        ↓
CDN
 ├── cache hit
 └── origin request
```

A healthy caching system should reduce origin load significantly.

Unexpected origin growth can indicate:

```text
cache invalidation
cache-key explosion
TTL changes
URL changes
deployment behavior
new transformation variants
```

---

# 16. Cache Cardinality Observability

A system can have a high cache hit ratio while still creating too many unique objects.

Monitor:

```text
unique image URLs
unique transformation variants
unique dimensions
unique quality settings
unique format combinations
```

If cardinality grows unexpectedly:

```text
cache storage ↑
misses ↑
transformation work ↑
```

This is a strong signal of architecture or abuse problems.

---

# 17. Cache Key Diagnostics

When debugging cache behavior, record a safe representation of:

```text
source identity
width
height
format
quality
tenant
version
```

Avoid logging sensitive raw URLs unnecessarily.

The objective is to determine:

```text
Why did two requests produce different cache keys?
```

---

# 18. Correlation IDs

A production request may pass through:

```text
Browser
 ↓
CDN
 ↓
Image service
 ↓
Remote origin
```

A correlation identifier can help connect the stages.

Conceptually:

```text
Request ID: abc123

Browser
  ↓
CDN
  ↓
Transformer
  ↓
Origin
```

This makes distributed debugging substantially easier.

---

# 19. Logging Strategy

Useful structured fields can include:

```text
request_id
route
image_family
source_type
status
cache_status
transform_duration
source_fetch_duration
output_bytes
width
height
format
error_code
```

Avoid excessive raw URL logging.

Logs should be:

```text
structured
searchable
privacy-aware
bounded
```

---

# 20. Avoid High-Cardinality Explosions

A dangerous logging pattern is:

```text
logger.info({
  fullImageUrl
})
```

for every request.

If URLs contain unique IDs and query parameters:

```text
cardinality ↑
storage ↑
query cost ↑
```

and sensitive information may leak.

Prefer normalized dimensions such as:

```text
image_type=product
width_bucket=1024
format=avif
cache_status=hit
```

when exact URL identity is unnecessary.

---

# 21. RUM — Real User Monitoring

Synthetic performance tests are controlled.

RUM measures actual users.

This allows segmentation by:

```text
device
browser
network
region
viewport
DPR
connection quality
```

For image performance, this is extremely valuable.

A desktop lab test may report:

```text
LCP = 1.5s
```

while real mobile users may experience:

```text
LCP = 3.8s
```

RUM exposes the difference.

---

# 22. LCP Monitoring

Track LCP distributions rather than only averages.

For example:

```text
p50 LCP
p75 LCP
p90 LCP
```

Segment by:

```text
page
route
device
region
connection
LCP element type
```

If the LCP element is an image, image architecture becomes a direct investigation area.

---

# 23. LCP Element Identification

A useful RUM system should help identify:

```text
Which element became LCP?
```

If:

```text
LCP = hero image
```

investigate:

```text
hero discovery
hero request
hero transfer
hero decode
hero rendering
```

If:

```text
LCP = heading
```

then the image may not be the dominant LCP bottleneck.

---

# 24. Image-Specific Performance Budgets

Define budgets appropriate to your application.

For example:

```text
Hero:
maximum encoded bytes

Thumbnail:
maximum encoded bytes

Initial image payload:
maximum aggregate bytes

LCP image:
maximum request latency

Transformation:
maximum p95 latency
```

The actual thresholds should be determined from product requirements and user populations.

The important principle is:

```text
budget
→
explicit constraint
```

---

# 25. Automated Performance Regression Testing

A deployment should not silently increase:

```text
hero image bytes
```

by 3×.

Automated tests can compare:

```text
baseline
vs
current build
```

for:

* image transfer size
* number of images
* selected candidate
* LCP
* layout stability
* image format
* image dimensions

---

# 26. Golden Image Tests

For important components, maintain expected rendering cases.

Example:

```text
ProductCard
 ├── mobile
 ├── tablet
 ├── desktop
 ├── DPR 1
 └── DPR 2
```

Verify:

```text
correct image candidate
correct dimensions
correct aspect ratio
correct alt
```

This prevents regressions when layout changes.

---

# 27. Responsive Image Tests

A responsive image component should be tested across:

```text
viewport widths
DPR values
container widths
```

For example:

```text
320px
768px
1024px
1440px
```

The test should validate:

```text
candidate set
+
sizes
+
actual rendered dimensions
```

---

# 28. `sizes` Regression

Suppose a component originally renders:

```text
50vw
```

but a design change makes it:

```text
33vw
```

If `sizes` remains:

```text
50vw
```

the browser may select larger candidates than necessary.

This can silently increase:

```text
transfer size
```

without causing a functional test failure.

Therefore image performance tests should include responsive sizing assumptions.

---

# 29. Art Direction Tests

For art-directed images:

```text
Desktop
→ wide crop

Mobile
→ portrait crop
```

tests should verify:

```text
correct source
correct breakpoint
correct crop
correct focal point
```

This is especially important for CMS-driven content.

---

# 30. Accessibility Regression Testing

Image tests should also verify:

```text
alt behavior
accessible names
decorative image semantics
link/button semantics
captions
```

A visually correct image can still be an accessibility regression.

Therefore:

```text
visual correctness
≠
semantic correctness
```

---

# 31. Security Regression Testing

Security tests should include:

```text
disallowed host
private IP
invalid scheme
oversized file
oversized dimensions
invalid format
malicious SVG
invalid transformation
rate-limit behavior
```

The objective is to verify that security controls remain active after deployments.

---

# 32. Synthetic vs RUM

| Dimension            | Synthetic     | RUM                 |
| -------------------- | ------------- | ------------------- |
| Environment          | Controlled    | Real users          |
| Repeatability        | High          | Lower               |
| Regression detection | Excellent     | Moderate            |
| Device diversity     | Limited       | High                |
| Network diversity    | Limited       | High                |
| Production reality   | Approximation | Direct              |
| Debugging            | Easier        | More representative |

The production strategy should generally use both.

---

# 33. CDN Monitoring

Important CDN metrics include:

```text
cache hit ratio
origin request rate
edge latency
response status
bandwidth
regional performance
cache eviction
```

Break down by:

```text
asset class
region
format
transformation
```

when useful.

---

# 34. Regional Performance

A global application can show:

```text
Region A
LCP = 1.8s

Region B
LCP = 3.9s
```

Possible causes:

```text
CDN coverage
origin distance
cache state
routing
network quality
image source location
```

Therefore image performance should sometimes be geographically segmented.

---

# 35. Device Segmentation

Mobile devices may differ substantially from desktops.

Segment by:

```text
device class
CPU capability
memory
viewport
DPR
network
```

A high-resolution image that works well on desktop may be expensive to decode on a low-end mobile device.

---

# 36. Error Budgets

Image systems can have service-level objectives such as:

```text
image request success rate
transformation success rate
critical image availability
CDN availability
```

An error budget allows teams to balance:

```text
reliability
```

against:

```text
feature velocity
```

without relying on subjective judgments.

---

# 37. Image SLO Example

A production system might define:

```text
Critical image availability
≥ target

Transformation p95 latency
≤ target

Image 5xx rate
≤ target

LCP for key routes
≤ target
```

The exact values should come from the product's requirements.

The important principle is:

```text
performance
+
reliability
→
measurable operational objectives
```

---

# 38. Alerting

Good alerts should identify meaningful degradation.

Examples:

```text
LCP p75 exceeds threshold
```

```text
Image 5xx rate increases
```

```text
Transformation p95 doubles
```

```text
CDN hit ratio drops sharply
```

```text
Origin image traffic spikes
```

```text
Image bandwidth exceeds budget
```

Alerts should avoid excessive noise.

---

# 39. Deployment Correlation

When an image metric changes, correlate it with:

```text
deployment
configuration change
CDN rule change
image pipeline change
CMS migration
design-system release
```

For example:

```text
10:00 deployment
10:07 hero bytes ↑ 40%
```

This correlation can dramatically shorten diagnosis time.

---

# 40. Observability During Rollouts

During a canary deployment:

```text
Old version
    ↓
95% traffic

New version
    ↓
5% traffic
```

Compare:

```text
image bytes
LCP
cache hit ratio
error rate
transformation latency
```

between versions.

This makes image regressions detectable before broad rollout.

---

# 41. Production Incident — LCP Regression

### Observation

```text
LCP:
2.0s → 3.4s
```

### Investigation

```text
LCP element
→ hero image

Discovery time
→ unchanged

Candidate
→ 2× larger

sizes
→ stale after layout change
```

Root cause:

```text
responsive image contract regression
```

Not:

```text
CDN outage.
```

This is why multiple observability layers matter.

---

# 42. Production Incident — Cache Hit Drop

Observation:

```text
Image cache hit:
96% → 72%
```

Investigate:

```text
URL changes
cache-key changes
format changes
query parameters
version changes
TTL
purges
```

Possible root cause:

```text
new transformation dimension
```

creating cache fragmentation.

---

# 43. Production Incident — Transformation CPU Spike

Observation:

```text
CPU ↑
transformation p99 ↑
```

Investigate:

```text
new format
new dimensions
new quality
new source image sizes
cache misses
traffic pattern
abuse
```

The correct response is not automatically:

```text
add more servers.
```

First identify why transformation demand changed.

---

# 44. Production Incident — Broken Images After Deployment

Symptoms:

```text
4xx ↑
```

Potential causes:

```text
asset path changed
image URL builder changed
CDN origin path changed
static asset missing
CMS IDs changed
deployment artifact mismatch
```

A good observability system should make the failure class obvious.

---

# 45. Production Incident — Security Rejections Increase

Suppose:

```text
SSRF rejection rate ↑
```

Possible explanations:

```text
attack
misconfigured partner
new legitimate image host
proxy/DNS change
application bug
```

Do not immediately classify all rejections as attacks.

Use:

```text
source
pattern
tenant
time
request shape
```

to investigate.

---

# 46. Testing Pyramid for Images

A useful test architecture is:

```text
                 E2E / RUM
                    ↑
              Integration
                    ↑
           Component Tests
                    ↑
           Transformation Tests
                    ↑
              Unit Tests
```

Different layers answer different questions.

---

# 47. Unit Tests

Test deterministic logic such as:

```text
URL construction
variant generation
sizes calculation
alt generation
transformation normalization
cache-key generation
```

These should be fast.

---

# 48. Integration Tests

Test:

```text
image optimizer
CDN behavior
remote source validation
transformation pipeline
authorization
cache policy
```

Integration tests verify component boundaries.

---

# 49. End-to-End Tests

E2E tests verify user-visible behavior:

```text
page loads
image appears
responsive representation works
layout remains stable
critical image is available
```

These are more expensive but validate the entire system.

---

# 50. Visual Regression Testing

Visual snapshots can detect:

```text
incorrect crop
aspect-ratio changes
broken object-fit
missing images
layout shifts
wrong art direction
```

However visual tests alone cannot measure:

```text
network cost
cache efficiency
RUM LCP
```

Therefore combine visual and performance testing.

---

# 51. Image Contract Testing

Design-system components should define contracts.

For example:

```text
ProductImage
```

may guarantee:

```text
aspect ratio
responsive sizes
alt requirement
allowed variants
loading behavior
```

A component contract prevents each feature team from independently inventing image behavior.

---

# 52. Production Performance Architecture

A mature system can look like:

```text
                ┌───────────────┐
                │   Browser     │
                │ RUM + Timing  │
                └───────┬───────┘
                        │
                        ↓
                ┌───────────────┐
                │     CDN       │
                │ Cache Metrics │
                └───────┬───────┘
                        │
                        ↓
              ┌───────────────────┐
              │ Image Transformer │
              │ CPU / Memory      │
              │ Transform Latency │
              └─────────┬─────────┘
                        │
                        ↓
                ┌───────────────┐
                │ Image Origin  │
                │ Fetch Metrics │
                └───────────────┘
```

All layers should be correlated.

---

# 53. Performance Regression Workflow

A mature workflow is:

```text
Change
 ↓
Build
 ↓
Automated tests
 ↓
Synthetic performance
 ↓
Canary
 ↓
RUM
 ↓
Compare against baseline
 ↓
Promote / rollback
```

This converts performance into a deployment discipline.

---

# 54. Four-Pillar Engineering Matrix

| Dimension    | Core Concern                         | Senior-Level Question                                         |
| ------------ | ------------------------------------ | ------------------------------------------------------------- |
| Mental Model | Measure the full image lifecycle     | Which stage is actually slow?                                 |
| Mechanics    | Timing, bytes, cache, transformation | Can the bottleneck be localized to a layer?                   |
| Architecture | Testing + observability contracts    | Can regressions be detected before broad rollout?             |
| Operations   | RUM, SLOs, alerts, incident response | Can production degradation be detected and diagnosed quickly? |

---

# 55. Prediction Challenges

### Challenge 1

CDN hit ratio remains constant, but LCP increases.

What browser-side metrics should you inspect?

---

### Challenge 2

Image transfer bytes increase by 40% after a design-system change.

What should you investigate?

---

### Challenge 3

Transformation p95 remains stable but p99 increases dramatically.

What does that suggest about the workload?

---

### Challenge 4

Only one geographic region shows image latency regression.

Which infrastructure dimensions should you investigate?

---

### Challenge 5

Image 5xx rate is normal, but images visually appear too large.

Which layer may be wrong?

---

### Challenge 6

The selected image candidate is consistently much larger than the rendered width.

Which responsive-image contract should you inspect?

---

### Challenge 7

RUM LCP worsens but synthetic tests remain unchanged.

What does that tell you?

---

# 56. Senior Interview Gotchas

### Gotcha 1

**“Cache hit ratio is the image performance metric.”**

No. It is one delivery metric.

---

### Gotcha 2

**“Average image latency is sufficient.”**

Tail latency can be much more important.

---

### Gotcha 3

**“Synthetic tests represent production users.”**

They provide controlled measurements, not complete production representation.

---

### Gotcha 4

**“If an image is visually correct, the component is correct.”**

Not necessarily.

It may still have:

* incorrect alt
* oversized candidate
* poor LCP
* cache fragmentation
* security issues

---

### Gotcha 5

**“A CDN dashboard tells you why LCP is slow.”**

It tells you about delivery, not necessarily browser discovery, decode, layout, or paint.

---

### Gotcha 6

**“RUM replaces synthetic testing.”**

No. The two systems solve different problems.

---

# 57. Core Invariants

```text
observability
=
browser
+
edge
+
origin
```

```text
cache hit ratio
≠
complete image performance
```

```text
average latency
≠
tail latency
```

```text
transfer completion
≠
visual completion
```

```text
synthetic testing
≠
real-user experience
```

```text
visual correctness
≠
performance correctness
```

```text
performance metric
without segmentation
→
can hide critical regressions
```

```text
deployment
→
must be observable as a performance event
```

---

# 58. Completion Checklist

You should be able to explain:

* [ ] Image observability architecture
* [ ] Browser metrics
* [ ] CDN metrics
* [ ] Origin metrics
* [ ] Resource Timing
* [ ] Image discovery timing
* [ ] Transfer size
* [ ] Candidate observability
* [ ] Error taxonomy
* [ ] HTTP status monitoring
* [ ] Cache hit ratio
* [ ] Cache miss latency
* [ ] Transformation latency
* [ ] Percentiles
* [ ] Origin load
* [ ] Cache cardinality
* [ ] Cache-key diagnostics
* [ ] Correlation IDs
* [ ] Structured image logging
* [ ] High-cardinality logging risks
* [ ] RUM
* [ ] LCP monitoring
* [ ] LCP element identification
* [ ] Performance budgets
* [ ] Regression testing
* [ ] Responsive image testing
* [ ] Art-direction testing
* [ ] Accessibility regression testing
* [ ] Security regression testing
* [ ] Synthetic testing
* [ ] CDN monitoring
* [ ] Regional segmentation
* [ ] Device segmentation
* [ ] Image SLOs
* [ ] Alerting
* [ ] Deployment correlation
* [ ] Canary verification
* [ ] Incident diagnosis
* [ ] Unit testing
* [ ] Integration testing
* [ ] E2E testing
* [ ] Visual regression testing
* [ ] Image contracts
* [ ] Production verification

---

# 59. Part Boundary

This part establishes:

```text
Image Observability
+
Testing
+
Performance Budgets
+
RUM
+
Synthetic Testing
+
Production Verification
```

The next and final part of KPI 10 is:

> **Part 10 — Production Image Optimization Architecture Capstone**

Part 10 will integrate:

```text
Part 01 → Mental Model
Part 02 → <Image> Mechanics
Part 03 → Responsive Images
Part 04 → Formats / Compression / Transformation
Part 05 → CDN / Cache / Delivery
Part 06 → Loading / Priority / LCP
Part 07 → Accessibility / Semantics
Part 08 → Security / Abuse Prevention
Part 09 → Observability / Testing
```

into one production-grade architecture.

---

# Final Mental Model

A senior engineer should view image optimization as:

```text
                    IMAGE SYSTEM
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
    Correctness      Performance       Security
        │                │                │
        ↓                ↓                ↓
 Responsive          LCP/RUM          SSRF
 Formats             CDN              Limits
 Semantics            Decode           Isolation
 Accessibility        Cache            Authorization
        │                │                │
        └────────────────┼────────────────┘
                         ↓
                   Observability
                         ↓
                     Testing
                         ↓
                 Production Ops
```

The objective is not merely:

> **“Serve optimized images.”**

It is:

> **Build an image delivery system whose representations are correct, whose critical resources arrive efficiently, whose untrusted inputs are bounded and isolated, and whose production behavior can be measured, tested, diagnosed, and continuously improved.**
