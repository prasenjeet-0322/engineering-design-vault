# Level 08 — Next.js & Full-Stack React

## KPI 10 — Image Optimization

# Part 10 — Production Image Optimization Architecture Capstone

---

## 1. Capstone Objective

This part integrates the complete image-optimization architecture developed across Parts 01–09.

The goal is no longer to understand isolated techniques such as:

* `<Image>`
* `srcset`
* `sizes`
* AVIF/WebP
* CDN caching
* lazy loading
* LCP
* alt text
* SSRF protection
* RUM

The goal is to reason about the **entire production image system as one architecture**.

The complete model is:

```text
Asset
  ↓
Semantic Model
  ↓
Representation Policy
  ↓
Transformation
  ↓
Responsive Selection
  ↓
Cache
  ↓
CDN
  ↓
Browser Request
  ↓
Decode
  ↓
Layout
  ↓
Paint
  ↓
User Experience
  ↓
Observability
  ↓
Testing
  ↓
Operations
```

And the system must simultaneously satisfy:

```text
Correctness
+
Performance
+
Security
+
Operability
```

---

# 2. The Production Image System

A production image platform can be modeled as:

```text
                    CONTENT SOURCE
                         │
                         ↓
                  Semantic Asset
                         │
                         ↓
               Representation Policy
                         │
            ┌────────────┴────────────┐
            ↓                         ↓
       Accessibility              Delivery
          Metadata                Metadata
            │                         │
            └────────────┬────────────┘
                         ↓
                   Transformation
                         │
                         ↓
              Responsive Representation
                         │
                         ↓
                    CDN / Cache
                         │
                         ↓
                      Browser
                         │
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
        Decode         Layout         Paint
          │              │              │
          └──────────────┼──────────────┘
                         ↓
                       UX
                         │
                         ↓
                  Observability
                         │
                         ↓
                    Operations
```

The important architectural insight is:

> **The image is a resource with multiple representations, not merely a file.**

---

# 3. Resource Identity vs Representation Identity

A product image might have one logical identity:

```text
product-123-primary
```

but many delivery representations:

```text
320w WebP
640w WebP
1024w WebP
640w AVIF
1024w AVIF
```

Therefore:

```text
resource identity
≠
representation identity
```

A useful model is:

```text
Representation =
Resource
+
Width
+
Height
+
Format
+
Quality
+
Transformation Version
```

Potentially also:

```text
Tenant
+
Content Version
```

where required by the security and caching architecture.

---

# 4. Source Asset vs Delivery Representation

Never confuse:

```text
original asset
```

with:

```text
delivery image.
```

The source may be:

```text
4000 × 3000 JPEG
```

while the browser receives:

```text
768 × 576 AVIF
```

The source is the canonical content.

The delivery representation is an optimized projection.

Therefore:

```text
Source Asset
       ↓
Representation Pipeline
       ↓
Delivery Representation
```

---

# 5. Single Source of Truth

A production system should have one authoritative content model.

For example:

```text
Product
 ├── id
 ├── title
 ├── primaryImage
 │     ├── assetId
 │     ├── width
 │     ├── height
 │     ├── alt
 │     └── focalPoint
```

The application should derive:

```text
URL
alt
dimensions
responsive candidates
social image
structured-data image
```

from the appropriate source models rather than independently hardcoding them.

---

# 6. Two Distinct Image Pipelines

A mature system separates:

### Semantic pipeline

```text
Asset
 ↓
Meaning
 ↓
Role
 ↓
Alt
 ↓
Caption
 ↓
Accessibility
```

### Delivery pipeline

```text
Asset
 ↓
Resize
 ↓
Format
 ↓
Compression
 ↓
CDN
 ↓
Browser
```

These pipelines interact but should not be conflated.

This distinction prevents:

```text
performance optimization
```

from accidentally destroying:

```text
semantic correctness.
```

---

# 7. Image Component Contract

A design-system image component should establish explicit contracts.

For example:

```text
<ImageComponent
  asset
  role
  width
  height
  sizes
  priority
  loading
/>
```

The component should determine or validate:

* aspect ratio
* intrinsic dimensions
* accessibility semantics
* responsive behavior
* loading strategy
* allowed transformations

The goal is to prevent every product team from inventing its own image architecture.

---

# 8. Representation Selection

The browser ultimately needs a representation appropriate for:

```text
viewport
container
DPR
network
format support
```

The conceptual pipeline is:

```text
Source
 ↓
Candidate Generation
 ↓
srcset
 ↓
sizes
 ↓
Browser Selection
 ↓
Downloaded Representation
```

The application should provide accurate candidates.

The browser decides which candidate to fetch.

---

# 9. `srcset` and `sizes`

Remember:

```text
srcset
=
available candidates
```

while:

```text
sizes
=
expected rendered width
```

The browser combines these with:

```text
viewport
+
DPR
+
network/browser heuristics
```

to choose a resource.

Therefore:

```text
viewport width
≠
rendered image width
```

and:

```text
CSS width
≠
network candidate width
```

unless the architecture makes them equivalent.

---

# 10. Responsive Image Failure

Consider:

```text
Image rendered:
400px

sizes says:
100vw

viewport:
1440px
```

The browser may reasonably select a much larger resource than necessary.

The page may therefore experience:

```text
unnecessary bytes
+
higher decode cost
+
higher memory use
```

The image itself is not necessarily broken.

The responsive contract is broken.

---

# 11. Art Direction

Resolution switching asks:

> “How large should this image representation be?”

Art direction asks:

> “Which visual composition should be shown?”

For example:

```text
Desktop:
wide landscape crop

Mobile:
portrait crop
```

The architecture may require:

```text
<picture>
```

or equivalent image-CDN logic.

This is different from simply requesting a smaller image.

---

# 12. Image Transformation Pipeline

A production transformation system can be modeled as:

```text
Source Asset
     ↓
Decode
     ↓
Resize
     ↓
Crop
     ↓
Color / Processing
     ↓
Encode
     ↓
Cache
```

The exact order can vary by implementation.

The important principle is that transformation is a **compute workload**.

Therefore:

```text
cache miss
→
potential CPU + memory cost.
```

---

# 13. Transformation Policy

Do not expose unlimited transformation combinations.

Prefer a controlled representation space.

For example:

```text
Widths:
320
640
960
1280
1536

Formats:
AVIF
WebP
JPEG

Quality:
controlled values
```

This gives predictable:

```text
cache cardinality
+
compute demand
+
storage requirements.
```

---

# 14. Why Unlimited Variants Are Dangerous

Suppose a system accepts:

```text
width = any integer
quality = any integer
height = any integer
crop = arbitrary
```

An attacker or buggy client can generate:

```text
millions of representations.
```

Consequences:

```text
cache fragmentation
+
storage growth
+
CPU growth
+
origin traffic
```

Therefore representation space should be intentionally bounded.

---

# 15. Image Format Architecture

Format selection depends on:

```text
content type
browser support
transparency
animation
quality
encoding cost
file size
delivery requirements
```

A modern production architecture might support:

```text
AVIF
WebP
JPEG
PNG
SVG
```

but does not assume:

```text
modern format
=
always optimal.
```

---

# 16. Quality Architecture

Quality is not a universal percentage across codecs.

Instead think:

```text
source
+
codec
+
content
+
quality target
```

determines:

```text
visual result
+
encoded size.
```

A photographic image and a flat illustration may respond very differently to the same compression strategy.

---

# 17. Cache Architecture

A typical flow is:

```text
Browser
  ↓
CDN
  ↓
Edge Cache
  ↓
Origin / Transformer
  ↓
Source Asset
```

Cache identity must reflect the representation.

For example:

```text
/image/123?w=640&format=avif
```

should not collide with:

```text
/image/123?w=1280&format=avif
```

---

# 18. Immutable Image URLs

A powerful architecture is versioned image identity.

For example:

```text
/image/asset-123-v7/640.avif
```

When the source changes:

```text
v7 → v8
```

the URL changes.

This provides:

```text
new identity
+
old cache remains valid
+
no global purge dependency.
```

---

# 19. Cache Invalidation

There are three broad strategies:

### TTL

```text
wait until expiration
```

### Purge

```text
invalidate cached representation
```

### Versioning

```text
change resource identity
```

Immutable/versioned URLs are often easier to reason about because:

```text
old URL
→
old representation

new URL
→
new representation
```

---

# 20. CDN Delivery

The CDN should handle:

```text
edge caching
regional proximity
bandwidth delivery
origin shielding
TLS termination
```

where appropriate.

The application should not perform responsibilities that the CDN can execute more efficiently.

---

# 21. Public vs Private Image Architecture

Public images:

```text
Browser
 ↓
CDN
 ↓
Public cache
```

Private images:

```text
Browser
 ↓
Authorization / Signed Request
 ↓
Private CDN / Storage
 ↓
Resource
```

Do not allow private images to accidentally enter a shared public cache.

---

# 22. Multi-Tenant Image Architecture

For a SaaS platform:

```text
Tenant A
 └── asset-123

Tenant B
 └── asset-123
```

Even if the local asset IDs overlap, the resource identities must remain isolated.

A secure identity could conceptually be:

```text
Tenant
+
Asset ID
+
Version
+
Representation
```

This protects:

```text
authorization
+
storage
+
cache
```

boundaries.

---

# 23. Security Architecture

Remote image processing should be treated as an untrusted-input pipeline:

```text
URL
 ↓
Scheme Validation
 ↓
Host Policy
 ↓
DNS/IP Validation
 ↓
Redirect Validation
 ↓
Network Isolation
 ↓
Timeout
 ↓
Size Limit
 ↓
Dimension Limit
 ↓
Content Validation
 ↓
Transformation
```

This prevents the optimizer from becoming:

```text
arbitrary proxy
```

or:

```text
resource-exhaustion endpoint.
```

---

# 24. Resource Limits

A production image processor should bound:

```text
request count
download size
pixel count
dimensions
CPU
memory
concurrency
transformation variants
storage
bandwidth
```

Think:

```text
image request
=
resource budget.
```

---

# 25. Image Loading Architecture

Not all images have the same priority.

Classify them:

```text
Critical
Important
Deferred
Decorative
```

A page may contain:

```text
Hero image       → critical
Product images   → important
Below-fold cards → deferred
Decorative icon  → low priority
```

The loading strategy should follow the role.

---

# 26. LCP Image Architecture

If the hero image becomes LCP:

```text
HTML / RSC output
        ↓
Early discovery
        ↓
Appropriate priority
        ↓
Correct responsive candidate
        ↓
CDN hit
        ↓
Fast transfer
        ↓
Decode
        ↓
Paint
```

Every stage can affect LCP.

Therefore:

```text
LCP optimization
≠
just compression.
```

---

# 27. Lazy Loading Architecture

Below-the-fold images can usually be deferred.

Conceptually:

```text
Viewport
 ↓
Relevant image
 ↓
Request
```

while critical images should not be unnecessarily delayed.

The system must avoid both:

```text
everything eager
```

and:

```text
everything lazy.
```

---

# 28. Layout Stability

Image dimensions should be known whenever practical.

For example:

```text
width
+
height
```

or a stable aspect ratio.

This allows the browser to reserve space.

Without dimensions:

```text
Image loads
 ↓
layout changes
 ↓
content moves
```

which can increase CLS.

---

# 29. Accessibility Architecture

Every image needs a semantic role.

Examples:

```text
Informative
Decorative
Functional
Complex
```

The correct `alt` behavior follows the role.

For example:

```text
decorative image
→
empty alt
```

while:

```text
informative image
→
meaningful alternative text.
```

---

# 30. Image + Link Semantics

Suppose an image is inside a link.

The image may contribute to the link's accessible name.

Therefore:

```text
image alt
+
visible link text
```

must not accidentally create redundant or confusing accessible names.

This is a semantic architecture concern, not just an HTML detail.

---

# 31. Complex Images

Charts, diagrams, and infographics may contain information that cannot reasonably fit in short alt text.

A better architecture can provide:

```text
short alternative
+
long description / equivalent data
```

The objective is:

```text
information equivalence
```

rather than merely:

```text
alt attribute exists.
```

---

# 32. CMS Integration

A CMS image model should ideally contain:

```text
asset ID
source URL
width
height
format
alt text
caption
focal point
content role
version
```

The application then derives delivery representations.

This separates:

```text
content ownership
```

from:

```text
delivery optimization.
```

---

# 33. Image Observability Architecture

A mature image platform measures:

```text
Browser
 ├── Resource timing
 ├── LCP
 ├── transfer size
 └── device/network

CDN
 ├── hit ratio
 ├── latency
 ├── bandwidth
 └── origin requests

Transformer
 ├── CPU
 ├── memory
 ├── transformation latency
 └── failures

Origin
 ├── source fetch latency
 ├── errors
 └── availability
```

---

# 34. Performance Budgets

Define explicit budgets for:

```text
hero bytes
initial image bytes
image count
transformation latency
LCP
CLS
CDN origin traffic
```

Budgets turn:

```text
“images should be fast”
```

into:

```text
measurable engineering constraints.
```

---

# 35. Testing Architecture

A mature test strategy includes:

```text
Unit
 ↓
Component
 ↓
Integration
 ↓
E2E
 ↓
Visual Regression
 ↓
Synthetic Performance
 ↓
RUM
```

Different layers validate different properties.

---

# 36. Image Contract Testing

For a shared component:

```text
ResponsiveImage
```

the contract can specify:

```text
must have stable dimensions
must provide appropriate alt semantics
must generate responsive candidates
must obey loading policy
must use allowed transformations
```

This prevents regressions across teams.

---

# 37. Deployment Architecture

Image behavior should be part of deployment verification.

A production rollout can use:

```text
Build
 ↓
Automated image tests
 ↓
Synthetic performance
 ↓
Canary
 ↓
RUM
 ↓
Compare
 ↓
Promote
```

Monitor:

```text
LCP
image bytes
cache hit ratio
5xx
transformation latency
origin load
```

---

# 38. Production Reference Architecture

A complete architecture could look like:

```text
                    ┌─────────────────┐
                    │      CMS        │
                    │ Asset + Semantics│
                    └────────┬────────┘
                             │
                             ↓
                    ┌─────────────────┐
                    │ Representation  │
                    │     Policy      │
                    └────────┬────────┘
                             │
                             ↓
                    ┌─────────────────┐
                    │ Image Transform │
                    │  + Validation   │
                    └────────┬────────┘
                             │
                             ↓
                    ┌─────────────────┐
                    │ CDN / Edge Cache│
                    └────────┬────────┘
                             │
                             ↓
                    ┌─────────────────┐
                    │    Browser      │
                    │ srcset / sizes  │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    ↓                 ↓
                  Decode            Layout
                    │                 │
                    └────────┬────────┘
                             ↓
                          Paint
                             ↓
                            UX
                             ↓
                     RUM / Monitoring
                             ↓
                     Alerts / Analysis
```

---

# 39. Scenario — Product Catalog

Suppose a product catalog contains:

```text
100,000 products
```

and each product has:

```text
5 images
```

That is:

```text
500,000 source images.
```

Each source may produce:

```text
5 widths
×
2 modern formats
```

Potentially:

```text
5,000,000 representations.
```

This demonstrates why:

```text
representation cardinality
```

is an architectural concern.

You cannot casually create unlimited variants.

---

# 40. Scenario — Global SaaS

Suppose the application serves:

```text
North America
Europe
Asia
```

The architecture should consider:

```text
regional CDN
origin location
cache warming
tenant isolation
image source latency
```

A centralized origin may create:

```text
high origin latency
```

even when application HTML is fast.

Therefore image delivery needs its own global strategy.

---

# 41. Scenario — Personalized Image

Suppose the image contains:

```text
user-specific information.
```

It cannot safely be treated as a generic public asset.

The system must determine:

```text
public?
private?
session-bound?
signed?
tenant-scoped?
```

before selecting:

```text
cache policy.
```

---

# 42. Scenario — Image Changes Frequently

Suppose a CMS image is updated frequently.

If the URL remains:

```text
/image/product-123
```

and the CDN caches aggressively, stale content may persist.

Versioning can solve this:

```text
/image/product-123-v8
```

rather than requiring broad cache purges.

---

# 43. Scenario — Third-Party Image Source

Suppose a product imports images from partner CDNs.

The architecture should include:

```text
source allowlist
+
timeout
+
response-size limit
+
content validation
+
transformation limit
+
cache
+
failure fallback
```

The partner becomes a controlled dependency rather than an unrestricted network source.

---

# 44. Scenario — Mobile Performance Regression

After deployment:

```text
desktop LCP:
stable

mobile LCP:
+800ms
```

Investigate:

```text
DPR
candidate selection
sizes
transfer size
decode cost
network
CPU
```

The issue may be that mobile users are downloading unnecessarily large images.

---

# 45. Scenario — Cache Hit Collapse

After changing image URLs:

```text
CDN hit ratio:
97% → 74%
```

Investigate:

```text
URL normalization
query parameters
versioning
format negotiation
responsive variants
cache-key changes
```

A URL architecture change can become a performance incident.

---

# 46. Scenario — Image Security Incident

Suppose the optimizer receives thousands of requests targeting internal IPs.

The correct architecture should allow:

```text
validation
→
rejection
→
rate limiting
→
observability
```

without allowing those requests to reach internal services.

The incident response system should be able to answer:

```text
Which source?
Which tenant?
Which endpoint?
Which policy failed?
How many attempts?
```

---

# 47. Senior Tradeoff — Precompute vs Runtime

### Precompute

```text
Upload
 ↓
Generate variants
 ↓
Store
 ↓
Serve
```

Advantages:

* predictable serving latency
* predictable compute
* easier warm cache

Costs:

* storage
* preprocessing time
* potentially unused variants

### Runtime

```text
Request
 ↓
Transform
 ↓
Cache
 ↓
Serve
```

Advantages:

* demand-driven
* fewer unused variants

Costs:

* cold-request latency
* runtime compute
* abuse risk
* cache-miss cost

---

# 48. Senior Tradeoff — One Image Service vs Platform CDN

A dedicated image service gives:

```text
custom control
```

but creates:

```text
operational complexity.
```

A managed image/CDN platform may provide:

```text
transformation
+
optimization
+
delivery
```

with less infrastructure ownership.

The decision should consider:

```text
scale
control
security
cost
vendor dependency
feature requirements
```

---

# 49. Senior Tradeoff — Quality vs Bytes

Reducing quality can reduce:

```text
transfer size
```

but can also reduce:

```text
visual fidelity.
```

The correct target is not:

```text
smallest possible image.
```

It is:

```text
small enough
+
visually acceptable
+
fast enough
```

for the product context.

---

# 50. Senior Tradeoff — Cache Aggressiveness

Aggressive caching provides:

```text
high hit ratio
low origin load
```

but can increase:

```text
staleness
```

if content changes.

Versioned immutable URLs can often provide:

```text
long cache lifetime
+
strong freshness guarantees.
```

---

# 51. Senior Tradeoff — Responsive Candidate Count

More candidates can improve selection granularity.

But:

```text
more candidates
→
more cache objects
→
more storage
→
more complexity.
```

Therefore choose candidate widths based on actual layout distributions rather than arbitrary precision.

---

# 52. Senior Tradeoff — Security vs Open Remote Sources

Allowing arbitrary remote image sources:

```text
more flexibility
```

but creates:

```text
larger SSRF surface
+
larger failure domain
+
larger abuse surface.
```

Restricting sources:

```text
smaller attack surface
```

but reduces integration flexibility.

---

# 53. Four-Pillar Architecture Matrix

| Pillar       | Image Optimization Concern          | Senior Question                                              |
| ------------ | ----------------------------------- | ------------------------------------------------------------ |
| Mental Model | Resource vs representation          | What exactly is being optimized?                             |
| Mechanics    | Browser/CDN/transformation behavior | Why did this representation get delivered?                   |
| Architecture | End-to-end image platform           | Where should transformation, caching and authorization live? |
| Operations   | Monitoring/testing/incidents        | How do we know the system remains correct at scale?          |

---

# 54. Prediction Challenge — Full Pipeline

A product page contains:

```text
Hero
Product gallery
Reviews
Recommendations
Footer
```

The hero is LCP.

The browser downloads:

```text
Hero: 1.8 MB
Gallery: 400 KB
Recommendations: 1.2 MB
```

CDN hit ratio is 98%.

Yet LCP is poor.

What should you investigate first?

A senior investigation should trace:

```text
LCP element
 ↓
discovery
 ↓
priority
 ↓
candidate selection
 ↓
transfer
 ↓
decode
 ↓
paint
```

rather than assuming:

```text
CDN hit ratio
=
good image performance.
```

---

# 55. Prediction Challenge — Cache vs Security

A private tenant image is being served from a shared CDN.

Two tenants use:

```text
/logo
```

What must you inspect?

```text
resource identity
cache key
authorization
tenant context
CDN cache policy
URL versioning
```

The critical question is:

> Can two security contexts produce the same cache representation?

---

# 56. Prediction Challenge — Transformation Cost

A sudden traffic spike causes:

```text
CPU ↑
memory ↑
p99 ↑
```

while cache hit ratio falls.

The likely investigation path is:

```text
traffic
 ↓
cache misses
 ↓
new representation cardinality
 ↓
transformation demand
 ↓
CPU/memory
```

This is more informative than simply scaling the transformer.

---

# 57. Prediction Challenge — Mobile Only

Suppose:

```text
Desktop LCP:
1.8s

Mobile LCP:
4.2s
```

Check:

```text
responsive candidate
sizes
DPR
transfer bytes
decode
CPU
network
```

A common architectural error is treating:

```text
desktop image configuration
```

as sufficient for:

```text
mobile performance.
```

---

# 58. Senior Interview Exercise

### Design an Image Platform

You are building a global e-commerce platform with:

```text
50 million images
100 million monthly users
multiple regions
multi-tenant seller accounts
user-uploaded images
product images
private seller assets
public product assets
```

Requirements:

* responsive images
* modern formats
* CDN delivery
* strong cacheability
* tenant isolation
* secure uploads
* LCP optimization
* observability
* production rollback

Explain:

### A. Asset Model

How do you model:

```text
asset
resource
representation
version?
```

### B. Transformation

Where does transformation occur?

```text
build
upload
request
CDN edge
```

Why?

### C. Cache

What is the cache key?

### D. Security

How do you prevent:

```text
SSRF
malicious uploads
resource exhaustion
cross-tenant leakage?
```

### E. Browser Delivery

How do you determine:

```text
srcset
sizes
priority
lazy loading?
```

### F. Operations

Which metrics and SLOs do you monitor?

### G. Deployment

How do you detect image-performance regressions before full rollout?

A senior answer should connect all seven rather than solving each independently.

---

# 59. Production Readiness Checklist

### Asset Architecture

* [ ] Source assets have stable identity
* [ ] Asset versions are defined
* [ ] Semantic metadata is separated from delivery metadata
* [ ] Dimensions are known
* [ ] Focal points are supported where necessary

### Responsive Delivery

* [ ] Candidate widths are intentional
* [ ] `srcset` is correct
* [ ] `sizes` matches layout
* [ ] Art direction is handled separately
* [ ] Candidate cardinality is bounded

### Transformation

* [ ] Formats are intentionally selected
* [ ] Quality is bounded
* [ ] Dimensions are bounded
* [ ] Pixel counts are bounded
* [ ] Transformation compute is controlled

### Caching

* [ ] Cache keys represent delivery identity
* [ ] Immutable URLs/versioning are considered
* [ ] Public/private caching is explicit
* [ ] Tenant boundaries are protected
* [ ] Cache cardinality is monitored

### Performance

* [ ] Critical images are discovered early
* [ ] LCP images are prioritized appropriately
* [ ] Below-fold images are deferred
* [ ] Layout dimensions are stable
* [ ] Performance budgets exist

### Accessibility

* [ ] Image roles are explicit
* [ ] Alt semantics are correct
* [ ] Functional images have correct accessible names
* [ ] Complex images have equivalent information
* [ ] CMS content supports semantic ownership

### Security

* [ ] Remote sources are controlled
* [ ] SSRF protections exist
* [ ] Redirects are validated
* [ ] Network access is restricted
* [ ] Response size is bounded
* [ ] Pixel dimensions are bounded
* [ ] SVG policy is explicit
* [ ] Private resources are authorized
* [ ] Rate limiting exists
* [ ] Transformation abuse is controlled

### Observability

* [ ] Browser metrics exist
* [ ] CDN metrics exist
* [ ] Transformer metrics exist
* [ ] Origin metrics exist
* [ ] Cache hit ratio is monitored
* [ ] Transformation latency is monitored
* [ ] LCP is monitored
* [ ] Errors are classified
* [ ] Deployment correlation exists

### Testing

* [ ] Unit tests
* [ ] Component tests
* [ ] Integration tests
* [ ] E2E tests
* [ ] Responsive image tests
* [ ] Accessibility tests
* [ ] Security tests
* [ ] Visual regression tests
* [ ] Synthetic performance tests
* [ ] RUM verification

---

# 60. Core Invariants

These are the invariants you should be able to recall during an SDE-2 interview.

```text
image resource
≠
image representation
```

```text
source asset
≠
delivery asset
```

```text
resource identity
≠
representation identity
```

```text
srcset
=
candidate representations
```

```text
sizes
=
expected rendered width
```

```text
browser
=
final responsive candidate selector
```

```text
resolution switching
≠
art direction
```

```text
resize
≠
compression
```

```text
format selection
≠
quality selection
```

```text
cache hit
≠
complete performance
```

```text
CDN latency
≠
browser rendering latency
```

```text
compressed bytes
≠
decoded memory
```

```text
HTTPS
≠
trusted remote destination
```

```text
private image
→
authorization + cache isolation
```

```text
more variants
→
more cache cardinality
```

```text
transformation
=
compute workload
```

```text
image security
=
network security
+
content security
+
resource security
```

```text
visual correctness
≠
semantic correctness
```

```text
synthetic performance
≠
real-user performance
```

```text
optimization
without observability
=
unverified optimization
```

---

# 61. Final Senior-Level Mental Model

The entire KPI can now be represented as:

```text
                         IMAGE ASSET
                              │
                              ↓
                       SEMANTIC MODEL
                              │
              ┌───────────────┴───────────────┐
              ↓                               ↓
       ACCESSIBILITY                     DELIVERY
          SEMANTICS                       POLICY
              │                               │
              └───────────────┬───────────────┘
                              ↓
                        REPRESENTATION
                              │
                              ↓
                       TRANSFORMATION
                              │
                ┌─────────────┴─────────────┐
                ↓                           ↓
           FORMAT/QUALITY              DIMENSIONS
                │                           │
                └─────────────┬─────────────┘
                              ↓
                      RESPONSIVE SYSTEM
                       srcset + sizes
                              │
                              ↓
                         CACHE / CDN
                              │
                              ↓
                           BROWSER
                              │
                 ┌────────────┼────────────┐
                 ↓            ↓            ↓
              REQUEST       DECODE       LAYOUT
                 │            │            │
                 └────────────┼────────────┘
                              ↓
                            PAINT
                              │
                              ↓
                         USER EXPERIENCE
                              │
              ┌───────────────┼───────────────┐
              ↓               ↓               ↓
          PERFORMANCE      SECURITY      ACCESSIBILITY
              │               │               │
              └───────────────┼───────────────┘
                              ↓
                       OBSERVABILITY
                              │
                              ↓
                           TESTING
                              │
                              ↓
                         OPERATIONS
```

The senior-level abstraction is:

> **An image system is a representation platform that transforms canonical assets into context-appropriate, secure, cacheable, accessible and performant delivery representations, while providing enough observability and testing to continuously verify that those representations remain correct in production.**

---

# 62. KPI 10 Completion

With this capstone, the complete KPI 10 architecture is:

```text
Part 01
Image Optimization Mental Model & Delivery Architecture
        ↓
Part 02
Next.js <Image> Architecture & Rendering Mechanics
        ↓
Part 03
Responsive Images, srcset, sizes & Art Direction
        ↓
Part 04
Image Formats, Compression, Quality & Transformation
        ↓
Part 05
Image CDN, Caching, Invalidation & Delivery
        ↓
Part 06
Image Loading, Priority, Lazy Loading & LCP
        ↓
Part 07
Image Accessibility, Semantics & Content Architecture
        ↓
Part 08
Image Security, Remote Sources & Abuse Prevention
        ↓
Part 09
Image Observability, Testing & Production Performance
        ↓
Part 10
Production Image Optimization Architecture Capstone
```

**KPI 10 is now complete.**
