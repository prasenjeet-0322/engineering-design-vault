# Level 08 — KPI 10 — Part 09

## Image Observability, Testing & Production Performance

---

# 1. Part Objective

A production image system cannot be considered complete merely because images render correctly.

At scale, you need to answer:

* Are images actually loading?
* Which images are slow?
* Which images affect LCP?
* Are users receiving unnecessarily large representations?
* Are cache hits working?
* Is the image optimizer consuming excessive CPU?
* Are remote sources failing?
* Are transformation requests exploding?
* Are image failures correlated with particular devices, routes, tenants, or regions?
* Did a deployment improve or regress image performance?

The central principle is:

> **Image optimization is successful only when the production system can measure whether its decisions actually improve user experience and infrastructure efficiency.**

The production model becomes:

```text
Image Architecture
       ↓
Instrumentation
       ↓
Telemetry
       ↓
Analysis
       ↓
Diagnosis
       ↓
Optimization
       ↓
Regression Prevention
```

---

# 2. The Image Observability Mental Model

Image observability should connect four layers:

```text
User Experience
      ↓
Browser Behavior
      ↓
Delivery Infrastructure
      ↓
Image Processing Pipeline
```

A useful end-to-end model is:

```text
Source Asset
    ↓
Transformation
    ↓
CDN / Cache
    ↓
HTTP Delivery
    ↓
Browser Request
    ↓
Decode
    ↓
Layout
    ↓
Paint
    ↓
LCP / Visual Experience
```

If you measure only one layer, you cannot reliably explain the complete outcome.

---

# 3. Four Pillars of Image Production Engineering

This part focuses on four dimensions:

```text
Correctness
Performance
Observability
Reliability
```

The system must answer:

```text
Did the correct image render?
        +
Did it render efficiently?
        +
Can we explain its behavior?
        +
Does the system remain reliable under production load?
```

---

# 4. Why Image Performance Must Be Measured in the Browser

Server-side metrics can tell you:

```text
image transformation = 120ms
```

but the user may experience:

```text
LCP = 3.8s
```

because additional time is spent on:

```text
network transfer
queueing
browser scheduling
image decode
layout
rendering
```

Therefore:

```text
server latency
≠
user-perceived image latency
```

Both must be observed.

---

# 5. Browser-Level Image Lifecycle

A browser image can be modeled as:

```text
HTML discovered
      ↓
request scheduled
      ↓
DNS / connection
      ↓
request sent
      ↓
response begins
      ↓
bytes transferred
      ↓
decode
      ↓
layout
      ↓
paint
```

Performance instrumentation should help identify where the delay occurs.

---

# 6. Resource Timing

Browser resource timing can provide information about image requests such as:

```text
request start
response start
response end
transfer size
encoded body size
decoded body size
```

These measurements help distinguish:

```text
network problem
```

from:

```text
image-size problem
```

from:

```text
server/transformation problem
```

---

# 7. Transfer Size vs Decoded Size

Consider:

```text
encoded size = 80 KB
decoded pixels = 3 MB
```

The network cost may look excellent.

But the browser still needs to decode the image into memory.

Therefore:

```text
network bytes
≠
browser memory cost
```

Both dimensions matter.

---

# 8. Image Intrinsic Size vs Rendered Size

Suppose:

```text
image source:
2400 × 1600

rendered:
400 × 267
```

The system may be delivering substantially more pixels than necessary.

A useful diagnostic relationship is:

```text
delivered pixels
----------------
rendered pixels
```

A large ratio may indicate:

```text
oversized source
incorrect sizes
missing responsive variants
poor transformation selection
```

---

# 9. DPR Complication

Suppose the image is rendered at:

```text
400 CSS pixels
```

on a device with:

```text
DPR = 3
```

The browser may legitimately request a representation around:

```text
1200 physical pixels
```

Therefore:

```text
rendered width
```

alone cannot determine whether an image is oversized.

You must consider:

```text
CSS dimensions
+
DPR
+
browser selection
+
available candidates
```

---

# 10. Core Image Performance Metrics

Useful metrics include:

### User Experience

```text
LCP
CLS
INP context
image load delay
image render timing
```

### Network

```text
request duration
TTFB
transfer bytes
response size
connection reuse
```

### Image Processing

```text
transformation latency
transformation errors
CPU time
queue time
```

### Cache

```text
hit rate
miss rate
stale responses
evictions
```

### Infrastructure

```text
origin requests
bandwidth
CPU
memory
concurrency
```

---

# 11. LCP and Images

Images are frequently responsible for the Largest Contentful Paint element.

For an image-based LCP:

```text
HTML discovery
    ↓
request scheduling
    ↓
network
    ↓
download
    ↓
decode
    ↓
render
    ↓
LCP
```

Improving any relevant stage may improve LCP.

But the optimization must target the actual bottleneck.

---

# 12. LCP Request Delay

An image may be slow because the browser discovers it late.

For example:

```text
JavaScript executes
      ↓
component appears
      ↓
image discovered
      ↓
image request
```

The image itself may download quickly.

The problem is:

```text
late discovery
```

This is different from:

```text
slow image server
```

---

# 13. LCP Download Time

Another case:

```text
image discovered early
      ↓
request starts
      ↓
huge response
      ↓
long transfer
```

Here the bottleneck is representation size or network conditions.

Potential causes:

```text
oversized image
poor compression
wrong format
incorrect responsive selection
slow connection
```

---

# 14. LCP Render Delay

A third case:

```text
image downloaded
      ↓
browser processing
      ↓
render delayed
```

Potential contributors include:

```text
decode
main-thread contention
layout work
rendering dependencies
```

Therefore an image optimization investigation should not assume:

```text
slow LCP
=
large image
```

---

# 15. Image Error Rate

A production image pipeline should measure failures.

Useful dimensions:

```text
HTTP errors
fetch failures
decode failures
transformation failures
timeout failures
authorization failures
source failures
```

A single aggregate error rate is often insufficient.

---

# 16. Error Taxonomy

A useful taxonomy is:

```text
4xx
5xx
timeout
source unavailable
unsupported format
decode failure
transformation failure
authorization failure
configuration failure
```

This allows operators to distinguish:

```text
application bug
```

from:

```text
upstream problem
```

from:

```text
user/content problem
```

---

# 17. Observability Dimensions

Image metrics should be sliced by relevant dimensions:

```text
route
image type
format
width
DPR
device class
browser
region
CDN POP
tenant
source domain
cache status
```

However, excessive cardinality can itself create observability problems.

---

# 18. Cardinality Tradeoff

Consider:

```text
image URL
```

as a metric label.

If every image URL is unique:

```text
millions of unique labels
```

can create a telemetry explosion.

Therefore avoid blindly using:

```text
full URL
user ID
request ID
asset ID
```

as high-cardinality metric dimensions.

Prefer bounded dimensions such as:

```text
format
width bucket
route family
status class
cache outcome
device class
```

---

# 19. Logs vs Metrics vs Traces

Each telemetry type serves a different purpose.

## Metrics

Best for:

```text
trends
rates
percentiles
alerts
dashboards
```

## Logs

Best for:

```text
individual failures
configuration details
specific source errors
```

## Traces

Best for:

```text
end-to-end request causality
```

The architecture should use all three intentionally.

---

# 20. Image Request Tracing

A trace can conceptually look like:

```text
Page Request
   │
   ├── HTML generation
   │
   └── Image Request
          │
          ├── CDN lookup
          │
          ├── Origin request
          │
          └── Transformation
```

This helps connect:

```text
page performance
```

to:

```text
image infrastructure behavior
```

---

# 21. Cache Observability

Image delivery depends heavily on caching.

Important measurements include:

```text
cache hit ratio
cache miss ratio
stale ratio
revalidation rate
origin fetch rate
eviction rate
```

But:

```text
high cache hit rate
```

does not automatically mean:

```text
good image performance
```

because the cached representation itself may be oversized.

---

# 22. Cache Hit Rate vs User Performance

Consider:

```text
cache hit rate = 99%
```

but:

```text
average image = 4 MB
```

The CDN may be efficient from an infrastructure perspective while the user still receives excessive bytes.

Therefore measure both:

```text
cache efficiency
```

and:

```text
representation efficiency
```

---

# 23. Representation Efficiency

Useful metrics include:

```text
bytes per rendered pixel
bytes per image
delivered width / rendered width
delivered height / rendered height
format distribution
```

The goal is not:

```text
smallest possible file
```

but:

```text
appropriate representation for actual use
```

---

# 24. Transformation Observability

An image transformation pipeline should expose metrics such as:

```text
transform requests
transform latency
transform failures
transform cache hits
transform cache misses
CPU time
memory usage
```

These metrics help identify whether:

```text
image optimization
```

is itself becoming:

```text
application bottleneck
```

---

# 25. Transformation Cache Misses

Consider:

```text
100 requests
```

for the same image representation.

Ideal behavior:

```text
1 transformation
99 cache hits
```

Poor behavior:

```text
100 transformations
```

This indicates:

```text
cache-key instability
cache eviction
poor cacheability
variant explosion
```

---

# 26. Single-Flight / Request Coalescing

A particularly important production optimization is preventing simultaneous cache misses from triggering duplicate work.

Without coalescing:

```text
Request A ─┐
Request B ─┼→ transformation
Request C ─┤
Request D ─┘
```

With request coalescing:

```text
Request A ─┐
Request B ─┼→ one transformation → shared result
Request C ─┤
Request D ─┘
```

This protects transformation infrastructure during traffic spikes.

---

# 27. Hot Image Detection

Some assets receive enormous traffic:

```text
logo
hero image
popular product
viral article
campaign image
```

These are hot objects.

Metrics should identify:

```text
request frequency
cache hit rate
origin fetches
bandwidth
regions
```

A hot image should generally be highly cacheable.

---

# 28. Thundering Herd

Suppose a popular image expires from cache:

```text
10:00:00
cache expires
```

Thousands of requests arrive immediately.

Without protection:

```text
thousands of origin requests
```

With:

```text
request coalescing
stale serving
origin shielding
```

the system can substantially reduce the burst.

---

# 29. Image Availability SLO

A production system can define an availability objective such as:

```text
successful image delivery rate
```

rather than relying only on page availability.

This matters because:

```text
HTML success
≠
complete visual experience
```

A page can return HTTP 200 while important images fail.

---

# 30. Image Performance SLOs

Possible service objectives include:

```text
image request success rate
p95 image TTFB
p95 image transfer duration
p95 LCP image delay
cache hit ratio
transformation error rate
```

The exact thresholds depend on system requirements.

The important architectural point is:

> **Performance should be expressed as measurable service behavior rather than vague goals.**

---

# 31. Synthetic Monitoring

Real-user monitoring tells you:

```text
what users actually experience
```

Synthetic monitoring tells you:

```text
what controlled environments experience
```

A useful system may test:

```text
desktop
mobile
slow network
different regions
different routes
```

This helps identify regressions before they become widespread.

---

# 32. Real User Monitoring

RUM can capture:

```text
actual device
actual network
actual geography
actual browser
actual page
actual LCP
```

This reveals distributions rather than a single laboratory environment.

For example:

```text
desktop p75 LCP = 1.8s
mobile p75 LCP = 3.4s
```

may reveal a problem hidden by desktop-only testing.

---

# 33. Lab vs Field Data

Lab data:

```text
controlled
repeatable
diagnostic
```

Field data:

```text
real-world
variable
representative
production-specific
```

Neither fully replaces the other.

A senior engineer uses:

```text
lab
+
synthetic
+
RUM
+
server telemetry
```

to build the complete picture.

---

# 34. Testing Strategy

Image systems require multiple test layers.

```text
Unit Tests
Integration Tests
Component Tests
Browser Tests
Performance Tests
Production Monitoring
```

Each catches different classes of failure.

---

# 35. Unit Testing

Unit tests can verify:

```text
image URL generation
transformation parameters
source policy
alt-text generation
canonical image identity
variant selection logic
```

Example conceptual assertion:

```text
given source X
and width 640
and format WebP

produce deterministic representation Y
```

---

# 36. Integration Testing

Integration tests should validate:

```text
application
→ image optimizer
→ cache
→ source
```

Important scenarios:

```text
remote image
invalid source
missing image
unsupported format
cache miss
cache hit
transformation failure
```

---

# 37. Component Testing

Image components should test contracts such as:

```text
alt
dimensions
fill behavior
responsive sizes
priority behavior
loading behavior
fallback
```

The objective is not to test the framework itself.

It is to test:

```text
application-level image contracts
```

---

# 38. Browser Testing

Browser tests should verify actual behavior:

```text
correct image rendered
correct candidate requested
no layout shift
hero image loads appropriately
lazy images are not unnecessarily eager
broken image behavior works
```

This is especially important for responsive image architecture.

---

# 39. Responsive Image Regression Testing

A change to:

```text
sizes
```

can dramatically alter network behavior.

Therefore test across:

```text
mobile
tablet
desktop
high-DPR
low-DPR
```

The goal is to ensure the browser selects appropriate candidates.

---

# 40. Accessibility Regression Testing

Image testing must also preserve:

```text
alt text
accessible names
decorative semantics
figure/caption relationships
functional image semantics
```

Performance optimization must never silently remove accessibility semantics.

---

# 41. Visual Regression Testing

Visual tests can detect:

```text
cropping changes
aspect-ratio changes
unexpected stretching
layout shifts
broken placeholders
wrong art direction
```

This is especially useful after modifying:

```text
image transformation
CSS
responsive breakpoints
design-system components
```

---

# 42. Performance Regression Testing

A performance test should establish a baseline.

Example:

```text
Before:
LCP = 2.1s

After:
LCP = 2.8s
```

This should trigger investigation.

Similarly:

```text
average image bytes
cache hit rate
transform latency
```

should be tracked over releases.

---

# 43. Performance Budgets

A team may establish budgets for:

```text
hero image bytes
page image bytes
image count
largest image dimensions
LCP
CLS
```

Budgets turn performance expectations into engineering constraints.

---

# 44. Image Budget by Context

Not every page needs the same budget.

For example:

```text
marketing landing page
product listing
article page
dashboard
admin application
```

may have different image requirements.

Therefore budgets should be contextual rather than blindly global.

---

# 45. Deployment Regression Detection

A deployment may accidentally change:

```text
format
quality
sizes
image URL generation
cache headers
transformation behavior
```

The resulting regression may appear as:

```text
higher bytes
lower cache hit rate
higher origin traffic
higher LCP
```

Observability should make these changes visible.

---

# 46. Canary Releases

For high-scale image infrastructure, changes can be gradually exposed:

```text
1%
 ↓
5%
 ↓
25%
 ↓
50%
 ↓
100%
```

Monitor:

```text
error rate
latency
cache behavior
origin load
user performance
```

before full rollout.

---

# 47. Correlating Frontend and Backend Metrics

Suppose:

```text
LCP worsened
```

at the same time as:

```text
image transformation latency increased
```

That correlation is useful.

But correlation alone does not prove causation.

A complete investigation should examine:

```text
deployment
route
device
region
image size
cache state
network conditions
```

---

# 48. Production Debugging Workflow

A useful sequence is:

```text
1. Identify affected user population
2. Identify affected routes
3. Identify image/LCP relationship
4. Check browser request timing
5. Check image representation size
6. Check CDN cache behavior
7. Check transformation latency
8. Check origin load
9. Compare deployment versions
10. Reproduce under controlled conditions
```

This prevents random optimization.

---

# 49. Debugging Oversized Images

If users receive oversized images:

```text
Check:
```

```text
rendered CSS width
DPR
sizes
srcset candidates
selected resource
transformation width
format
quality
```

Do not immediately assume the image optimizer is broken.

Often the problem is:

```text
incorrect layout information
```

---

# 50. Debugging High Origin Load

If origin image traffic suddenly increases:

```text
Check:
```

```text
cache hit rate
cache-key changes
URL versioning
variant cardinality
TTL changes
purges
deployment changes
request coalescing
hot objects
```

A high origin load event is often a cache architecture problem.

---

# 51. Debugging High Transformation CPU

If image-processing CPU rises:

```text
Investigate:
```

```text
new formats
quality settings
new dimensions
variant explosion
cache misses
uncached transformations
traffic growth
large source images
```

The goal is to determine whether the workload increase is:

```text
legitimate traffic
```

or:

```text
architectural inefficiency
```

or:

```text
abuse
```

---

# 52. Debugging Image Failures

A useful decision tree:

```text
Image failed
    ↓
Did request leave browser?
    ↓
Did CDN receive it?
    ↓
Did CDN hit cache?
    ↓
Did origin respond?
    ↓
Was transformation successful?
    ↓
Did browser decode?
    ↓
Did layout/render occur?
```

This narrows the failure domain.

---

# 53. Image Observability Dashboard

A production dashboard might contain:

## User Experience

```text
LCP
image load delay
image render delay
CLS
```

## Delivery

```text
request count
bytes
TTFB
latency
error rate
```

## Cache

```text
hit ratio
miss ratio
stale responses
origin fetches
```

## Processing

```text
transform count
transform latency
CPU
memory
failures
```

## Security

```text
blocked sources
rejected transformations
rate-limit events
authorization failures
```

---

# 54. Alerts

Alerts should target meaningful failures.

Examples:

```text
image error rate > threshold
```

```text
LCP regression > threshold
```

```text
origin image traffic unexpectedly increases
```

```text
transformation CPU saturates
```

```text
cache hit ratio collapses
```

```text
remote source failures spike
```

Avoid alerting on every individual image failure.

The objective is:

```text
actionable signal
```

rather than:

```text
alert noise
```

---

# 55. Observability and Cardinality

A dangerous telemetry design might record:

```text
metric:
image_request{url="<unique URL>"}
```

This can create unbounded cardinality.

Prefer dimensions such as:

```text
image_request{
  format="avif",
  width_bucket="768-1024",
  route="/products/[id]",
  cache="hit"
}
```

The principle is:

> **Observe enough dimensions to diagnose the system without turning telemetry itself into an unbounded data system.**

---

# 56. Image Performance Scorecards

A team can maintain a production scorecard:

| Dimension      | Measurement                  |
| -------------- | ---------------------------- |
| UX             | LCP / image render delay     |
| Network        | bytes / latency              |
| Representation | rendered vs delivered pixels |
| Cache          | hit ratio                    |
| Processing     | transform latency            |
| Reliability    | image success rate           |
| Security       | blocked/invalid requests     |
| Cost           | bandwidth / compute          |

The scorecard should be used for diagnosis, not as a simplistic single-number ranking.

---

# 57. Cost Observability

Image systems can create significant infrastructure costs through:

```text
bandwidth
storage
transformation CPU
CDN requests
origin requests
observability
```

A useful model is:

```text
Image Cost
=
Delivery
+
Storage
+
Transformation
+
Origin
+
Operational Overhead
```

Optimization should consider total system cost, not only browser bytes.

---

# 58. Cost vs Performance Tradeoff

For example:

```text
more pre-generated variants
```

may reduce transformation latency but increase:

```text
storage
```

While:

```text
on-demand transformation
```

may reduce storage but increase:

```text
compute
```

Therefore:

```text
precompute vs on-demand
```

is a workload decision.

---

# 59. Production Experimentation

Image changes should ideally be measurable.

For example:

```text
Experiment:
AVIF quality profile A
vs
AVIF quality profile B
```

Measure:

```text
bytes
LCP
visual quality
decode behavior
conversion cost
cache behavior
```

Do not optimize one metric while silently degrading another.

---

# 60. Image Quality Validation

A smaller image is not automatically better.

Quality evaluation may consider:

```text
visual artifacts
text readability
faces
fine detail
edges
gradients
transparency
```

For automated pipelines, objective image-quality metrics can be useful, but visual validation remains important for perceptually sensitive assets.

---

# 61. Regression Prevention in Design Systems

If an application has a shared image component:

```text
<AppImage />
```

it should encode production defaults.

Possible responsibilities:

```text
sizes
alt requirements
loading behavior
aspect-ratio behavior
allowed variants
observability hooks
```

This prevents each feature team from independently reinventing image architecture.

---

# 62. Image Component as a Platform Boundary

A mature design system can treat image rendering as:

```text
application primitive
```

rather than:

```text
ordinary HTML element
```

The component can establish:

```text
semantic contract
delivery contract
performance contract
security contract
```

---

# 63. Production Image Contract

A reusable image component may conceptually require:

```text
ImageInput
├── source
├── semantic role
├── rendered dimensions
├── responsive behavior
├── loading priority
├── transformation profile
└── accessibility metadata
```

This produces predictable behavior across the application.

---

# 64. End-to-End Observability Model

The complete pipeline becomes:

```text
                 USER EXPERIENCE
                       │
                       ▼
                     LCP
                       │
                       ▼
                Browser Request
                       │
                       ▼
                 CDN / Cache
                       │
              ┌────────┴────────┐
              ▼                 ▼
           Cache Hit         Cache Miss
                                │
                                ▼
                         Transformation
                                │
                                ▼
                              Origin
```

Telemetry should connect all these layers.

---

# 65. Production Incident Example

Imagine:

```text
09:00 deployment
```

At:

```text
09:10
```

you observe:

```text
LCP +600ms
origin traffic +300%
transform CPU +250%
```

A useful investigation is:

```text
Deployment
   ↓
image URL generation changed
   ↓
cache keys changed
   ↓
cache hit rate collapsed
   ↓
more transformations
   ↓
origin/CPU load increased
   ↓
image latency increased
   ↓
LCP degraded
```

This is the type of causal chain observability should make discoverable.

---

# 66. Another Production Incident

Suppose:

```text
image error rate = 5%
```

but only in:

```text
one region
```

and only for:

```text
one remote image provider
```

The likely investigation path becomes:

```text
region
+
source domain
+
status code
+
fetch latency
+
DNS/connectivity
```

This is much more actionable than:

```text
"images are broken."
```

---

# 67. Production Architecture Principles

### Principle 1

Measure the user's experience.

### Principle 2

Measure infrastructure behavior.

### Principle 3

Connect browser and server telemetry.

### Principle 4

Track representation efficiency.

### Principle 5

Track cache efficiency separately.

### Principle 6

Bound metric cardinality.

### Principle 7

Test responsive behavior.

### Principle 8

Test accessibility semantics.

### Principle 9

Monitor image failures independently from page failures.

### Principle 10

Treat image performance as a release-quality concern.

---

# 68. Senior Prediction Challenges

### Challenge 1

A CDN has a 99% cache hit ratio, but LCP worsened.

What should you investigate?

Expected reasoning:

```text
representation size
selected image width
DPR
format
quality
network
decode
late discovery
```

Cache efficiency alone does not guarantee good UX.

---

### Challenge 2

Origin traffic increased 5× after a frontend deployment.

What image-specific causes would you inspect?

Expected reasoning:

```text
cache-key changes
URL changes
variant explosion
TTL changes
purge behavior
responsive candidate changes
```

---

### Challenge 3

Transformation CPU increased while traffic remained constant.

What could explain it?

Expected reasoning:

```text
cache hit-rate regression
larger transformations
new format
higher quality
new dimensions
variant explosion
```

---

### Challenge 4

Mobile LCP regressed but desktop did not.

What should you inspect first?

Expected reasoning:

```text
mobile sizes
DPR
selected candidate
mobile art direction
network conditions
mobile image priority
```

---

### Challenge 5

The image server reports low latency but users still experience slow image rendering.

What could be happening?

Expected reasoning:

```text
late discovery
network transfer
large representation
browser decode
main-thread contention
render delay
```

---

# 69. Senior Interview Questions

### Question 1

> How would you monitor a production image optimization system?

Discuss:

```text
RUM
resource timing
LCP
CDN metrics
cache metrics
transformation metrics
origin metrics
errors
tracing
```

---

### Question 2

> Why isn't cache hit rate enough?

Because a cache hit can still return:

```text
oversized
wrong
slow-to-decode
inefficient
```

representations.

---

### Question 3

> How would you diagnose an LCP regression caused by images?

Trace:

```text
discovery
→ request scheduling
→ network
→ transfer
→ decode
→ render
```

and correlate browser telemetry with delivery infrastructure.

---

### Question 4

> How do you prevent image telemetry from creating a cardinality problem?

Avoid unbounded identifiers in metric dimensions and use bounded categories/buckets.

---

### Question 5

> What should be tested when changing responsive image behavior?

Test:

```text
viewport
DPR
candidate selection
rendered dimensions
bytes
LCP
visual correctness
```

---

# 70. Core Invariants

```text
user experience ≠ server latency
```

```text
cache hit rate ≠ image efficiency
```

```text
small bytes ≠ low total processing cost
```

```text
HTML success ≠ image success
```

```text
image request success ≠ image render success
```

```text
rendered width ≠ delivered width
```

```text
desktop behavior ≠ mobile behavior
```

```text
synthetic performance ≠ field performance
```

```text
metrics without dimensions ≠ diagnosis
```

```text
unbounded dimensions ≠ safe observability
```

```text
optimization without measurement ≠ reliable optimization
```

---

# 71. Completion Checklist

You should now be able to:

### Browser Performance

* [ ] Explain image request lifecycle
* [ ] Understand Resource Timing
* [ ] Connect images to LCP
* [ ] Distinguish discovery delay from download delay
* [ ] Distinguish download delay from render delay
* [ ] Understand encoded vs decoded size

### Delivery

* [ ] Measure CDN performance
* [ ] Measure cache hit/miss behavior
* [ ] Measure origin load
* [ ] Measure transformation latency
* [ ] Detect cache-key regressions
* [ ] Identify hot objects
* [ ] Understand request coalescing

### Testing

* [ ] Unit test image contracts
* [ ] Integration test image pipelines
* [ ] Browser test responsive selection
* [ ] Visual regression test image rendering
* [ ] Accessibility regression test semantics
* [ ] Performance regression test budgets

### Production

* [ ] Use RUM
* [ ] Use synthetic monitoring
* [ ] Use metrics
* [ ] Use logs
* [ ] Use traces
* [ ] Design useful alerts
* [ ] Avoid high-cardinality telemetry
* [ ] Correlate deployments with regressions

### Senior-Level Reasoning

* [ ] Diagnose image-related LCP regressions
* [ ] Diagnose cache regressions
* [ ] Diagnose transformation CPU spikes
* [ ] Diagnose regional image failures
* [ ] Connect frontend and backend telemetry
* [ ] Define meaningful image SLOs

---

# 72. Final Mental Model

The production image system should now be understood as:

```text
                    USER
                     │
                     ▼
              Browser Experience
                     │
            ┌────────┴────────┐
            ▼                 ▼
          LCP              Resource
            │               Timing
            └────────┬────────┘
                     ▼
                 CDN / Cache
                     │
            ┌────────┴────────┐
            ▼                 ▼
        Cache Hit          Cache Miss
                                │
                                ▼
                         Transformation
                                │
                                ▼
                              Origin
```

Every important transition should be observable.

The senior-level mental model is:

> **Image optimization is not complete when an image is technically delivered. It is complete when the system can continuously demonstrate that the correct representation is delivered, efficiently, reliably, securely, and with measurable user impact.**

The final engineering loop is:

```text
Measure
  ↓
Diagnose
  ↓
Change
  ↓
Validate
  ↓
Observe
  ↓
Prevent Regression
```

That is what turns image optimization from a framework feature into a production engineering discipline.

**Part 09 complete.**
