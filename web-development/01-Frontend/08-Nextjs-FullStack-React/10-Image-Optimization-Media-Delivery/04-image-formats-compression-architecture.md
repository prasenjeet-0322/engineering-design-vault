# Level 08 — KPI 10 — Part 04

## Image Formats, Compression, Quality & Transformation Architecture

---

# 1. Part Objective

Part 01 established the image optimization mental model.

Part 02 established the Next.js `<Image>` delivery and rendering architecture.

Part 03 established responsive representation selection:

```text
srcset
+
sizes
+
DPR
+
browser candidate selection
+
art direction
```

This part moves one layer deeper:

> **Once the system knows which representation it needs, how should that representation be encoded and transformed?**

The image pipeline becomes:

```text
Source Asset
    ↓
Transformation
    ↓
Resize
    ↓
Crop
    ↓
Format Selection
    ↓
Compression
    ↓
Quality Decision
    ↓
Encoded Representation
    ↓
Cache / CDN
    ↓
Browser
```

The objective is to understand the tradeoffs among:

* JPEG
* PNG
* WebP
* AVIF
* SVG
* raster vs vector
* lossy vs lossless compression
* quality settings
* resizing
* cropping
* format negotiation
* transformation pipelines
* cache identity
* visual quality
* bytes
* CPU cost
* decode cost
* operational complexity.

The goal is not:

> "Use the newest format."

The goal is:

> **Choose an image representation that satisfies visual quality, performance, compatibility, and operational constraints.**

---

# 2. The Core Image Encoding Model

An image representation can be modeled as:

```text
Logical Asset
     ↓
Transformation Parameters
     ↓
Pixel Representation
     ↓
Encoding Format
     ↓
Compression / Quality
     ↓
Encoded Bytes
```

For example:

```text
Product Image
     ↓
1200px width
     ↓
crop = product frame
     ↓
WebP
     ↓
quality = selected level
     ↓
encoded file
```

This means:

```text
same logical image
≠
same encoded representation
```

The representation depends on transformation decisions.

---

# 3. Source Asset vs Delivery Asset

A CMS may store:

```text
Original:
6000 × 4000
```

The application may display:

```text
800 × 533
```

The production system should generally avoid treating the original asset as the final browser representation.

Instead:

```text
Original
   ↓
Transformation
   ↓
Delivery Representation
```

The original is the source of truth.

The delivery representation is optimized for a particular use.

---

# 4. Why Original Assets Should Be Preserved

A production media system should usually preserve the original source independently from generated derivatives.

Why?

Because derivatives may later need to change.

For example:

```text
Today:
WebP 800px

Tomorrow:
AVIF 800px
```

If the original was discarded, generating the new representation may require lossy reprocessing of an already-compressed derivative.

The preferred model is:

```text
Original
 ├── WebP
 ├── AVIF
 ├── JPEG
 ├── thumbnail
 ├── card image
 └── hero image
```

rather than:

```text
JPEG derivative
    ↓
WebP derivative
    ↓
AVIF derivative
```

Repeated transcoding can accumulate quality loss.

---

# 5. Raster vs Vector

Before choosing JPEG, WebP, or AVIF, first ask:

> **Is this asset raster or vector?**

Raster images represent pixels.

Examples:

```text
photographs
screenshots
textures
complex illustrations
```

Vector images represent geometry.

Examples:

```text
logos
icons
simple illustrations
diagrams
```

The architecture differs.

```text
Raster
    ↓
pixel dimensions matter heavily

Vector
    ↓
geometry scales independently of raster resolution
```

---

# 6. SVG

SVG is a vector representation based on XML.

Conceptually:

```text
SVG
 ↓
paths
shapes
text
geometry
```

A logo such as:

```text
company-logo.svg
```

can often scale from:

```text
32px
```

to:

```text
320px
```

without requiring separate raster resolutions.

SVG is therefore particularly useful for:

* logos
* icons
* simple diagrams
* vector illustrations.

---

# 7. SVG Is Not Automatically Better

SVG is not appropriate for every image.

A photograph containing millions of pixels is fundamentally different from a geometric logo.

Attempting to encode photographic content as SVG can be impractical.

Therefore:

```text
asset characteristics
        ↓
format selection
```

should happen before optimization.

---

# 8. JPEG

JPEG is a widely used raster image format, particularly for photographic content.

It generally uses lossy compression.

Conceptually:

```text
Original pixels
      ↓
JPEG compression
      ↓
smaller representation
```

The tradeoff is:

```text
smaller bytes
↔
some information loss
```

JPEG remains relevant because of its:

* broad compatibility,
* mature tooling,
* strong photographic compression,
* established browser support.

---

# 9. JPEG and Photographs

Photographs often contain:

```text
continuous tones
complex textures
many colors
gradual gradients
```

These characteristics generally make photographic compression effective.

A simplified architecture is:

```text
Photo
 ↓
lossy encoding
 ↓
compressed JPEG
```

JPEG is therefore historically strong for:

```text
photos
product photography
editorial imagery
large photographic backgrounds
```

---

# 10. PNG

PNG is a lossless raster image format.

It is useful when exact pixel preservation matters.

Common cases include:

```text
transparent graphics
UI screenshots
logos
diagrams
images containing sharp edges
```

The conceptual tradeoff is:

```text
lossless fidelity
↔
potentially larger files
```

PNG is therefore not universally the best choice for photographs.

---

# 11. Lossy vs Lossless Compression

This distinction is fundamental.

## Lossless

```text
Original
   ↓
compression
   ↓
encoded representation
   ↓
decompression
   ↓
original information preserved
```

## Lossy

```text
Original
   ↓
compression
   ↓
some information discarded
   ↓
smaller representation
```

The engineering decision is:

```text
required fidelity
        vs
acceptable compression
```

---

# 12. WebP

WebP supports both lossy and lossless image compression and can support transparency.

It provides a modern alternative to older raster formats in many applications.

Conceptually:

```text
JPEG/PNG-era workflows
        ↓
WebP-capable delivery
```

WebP can provide good compression for many web image workloads.

But format choice should still depend on:

```text
asset
quality requirement
browser support requirements
transformation infrastructure
delivery architecture
```

---

# 13. AVIF

AVIF is another modern image format with strong compression characteristics.

It can produce substantially smaller representations for some image workloads.

But compression efficiency is not the only consideration.

The system should also consider:

```text
encoding CPU cost
decoding behavior
tooling
transformation latency
browser support requirements
cache strategy
```

Therefore:

```text
smaller file
≠
automatically better system
```

---

# 14. Format Selection Is a Multi-Variable Decision

A useful model is:

```text
Format Decision
    =
    visual quality
    +
    encoded bytes
    +
    encode cost
    +
    decode cost
    +
    browser compatibility
    +
    transparency requirements
    +
    transformation support
    +
    operational complexity
```

This is more accurate than:

```text
AVIF is newer
→
always use AVIF
```

---

# 15. Format Negotiation

A production system may support multiple representations.

Conceptually:

```text
Original Asset
      ↓
 ┌──────────────┐
 │              │
JPEG          WebP
 │              │
 └──────┬───────┘
        ↓
      AVIF
```

The client may receive an appropriate representation depending on supported formats.

The key architecture is:

```text
same logical asset
        ↓
multiple encoded representations
```

---

# 16. Content Negotiation

HTTP provides mechanisms that can communicate supported representations.

Conceptually:

```text
Browser
  ↓
request capabilities
  ↓
image service
  ↓
select supported representation
```

The image service may therefore decide:

```text
AVIF
or
WebP
or
JPEG
```

depending on the delivery architecture.

The exact negotiation mechanism belongs to the infrastructure layer.

---

# 17. Format Negotiation and Cache Identity

This creates an important cache consideration.

These are different representations:

```text
image/avif
image/webp
image/jpeg
```

Therefore:

```text
same source
+
different output format
=
different cache representation
```

The cache system must distinguish them correctly.

Otherwise a cached representation could be incorrectly served to an incompatible client.

---

# 18. Quality Is Not a Universal Number

A quality parameter such as:

```text
quality = 80
```

should not be interpreted as:

```text
80% visual quality
```

across all image formats.

Quality parameters are codec-specific.

Therefore:

```text
quality = 80
```

for one encoder does not necessarily mean the same output characteristics as:

```text
quality = 80
```

for another encoder.

This is why quality settings must be evaluated empirically.

---

# 19. Quality vs File Size

Increasing quality generally tends toward:

```text
higher visual fidelity
+
larger encoded output
```

Decreasing quality generally tends toward:

```text
smaller encoded output
+
greater visual degradation
```

Conceptually:

```text
Quality
   ↑
   │       visual fidelity
   │
   │
   └──────────────────→
        file size
```

The optimal point is application-specific.

---

# 20. Quality Should Be Perceptual

A mature optimization system does not ask only:

```text
"What is the smallest file?"
```

It asks:

```text
"What is the smallest file that still satisfies
the visual quality requirement?"
```

This is a perceptual optimization problem.

For example:

```text
hero image
```

may require higher quality than:

```text
small avatar
```

Therefore a single global quality level may not be ideal.

---

# 21. Quality Profiles

A production system may define profiles such as:

```text
Thumbnail
    ↓
lower quality

Card
    ↓
medium quality

Hero
    ↓
higher quality

Original/download
    ↓
maximum fidelity
```

Conceptually:

```text
asset purpose
     ↓
quality policy
```

This is preferable to arbitrary per-component numbers.

---

# 22. Compression Artifacts

Excessive lossy compression can produce:

```text
blocking
ringing
banding
blur
loss of texture
edge degradation
```

These artifacts may be especially visible around:

```text
text
faces
logos
high-contrast edges
fine details
```

Therefore quality tuning should use representative images rather than only aggregate file-size metrics.

---

# 23. The Importance of Image Content

Different images compress differently.

Consider:

```text
Image A:
blue sky + smooth gradients

Image B:
dense forest + fine texture
```

At the same nominal quality setting, the resulting compression behavior can differ significantly.

Therefore:

```text
quality parameter
```

does not imply:

```text
fixed visual result
```

across all assets.

---

# 24. Resizing Before Compression

Suppose the original is:

```text
4000 × 3000
```

but the browser needs:

```text
800 × 600
```

It is generally more efficient to create the appropriately sized representation rather than compressing a 4000px source and sending it to the browser.

Conceptually:

```text
Original
  ↓
Resize
  ↓
800 × 600
  ↓
Encode
  ↓
Compress
```

rather than:

```text
Original
  ↓
Compress
  ↓
huge file
  ↓
browser downloads
  ↓
browser scales down
```

---

# 25. Resize and Compression Order

A useful conceptual pipeline is:

```text
Source
   ↓
decode/source processing
   ↓
crop
   ↓
resize
   ↓
color/profile processing
   ↓
encode
   ↓
compress
```

The exact internal implementation can vary.

The important principle is:

> **Generate the delivery representation before transferring it to the browser.**

---

# 26. Cropping

Cropping changes the visible composition.

For example:

```text
Original
┌──────────────────────────┐
│                          │
│          PERSON          │
│                          │
└──────────────────────────┘
```

may become:

```text
Mobile crop
┌──────────────┐
│    PERSON    │
└──────────────┘
```

Cropping therefore affects:

```text
composition
aspect ratio
pixel count
visual meaning
```

It is not merely compression.

---

# 27. Aspect Ratio Transformation

A transformation service may generate:

```text
16:9
4:3
1:1
3:4
```

versions of the same source.

This is especially useful for:

```text
cards
avatars
social previews
hero sections
product tiles
```

A transformation request can therefore be modeled as:

```text
source
+
target dimensions
+
crop strategy
+
format
+
quality
```

---

# 28. Smart Cropping

Simple center cropping assumes the important content is near the center.

But that may fail.

Example:

```text
person positioned on the left
```

A center crop may remove the subject.

A smarter system can use:

```text
focal point
face detection
object detection
editorial crop metadata
```

to preserve important content.

---

# 29. Transformation Ownership

There should be a clearly defined owner for image transformation.

Possible owners include:

```text
CMS
image CDN
Next.js optimizer
edge transformation service
build pipeline
```

Avoid ambiguous architectures such as:

```text
CMS transforms
   ↓
Next.js transforms again
   ↓
CDN transforms again
```

Instead define:

```text
canonical source
        ↓
single primary transformation owner
        ↓
delivery cache
```

unless multiple stages have explicit responsibilities.

---

# 30. Build-Time vs Request-Time Transformation

There are two broad strategies.

## Build-time

```text
build
 ↓
generate image variants
 ↓
store artifacts
 ↓
serve
```

Advantages:

```text
predictable runtime cost
fast delivery
```

Tradeoffs:

```text
larger build work
more pre-generated variants
potentially stale derivatives
```

---

## Request-time

```text
request
 ↓
generate representation
 ↓
cache
 ↓
serve
```

Advantages:

```text
on-demand generation
less unnecessary precomputation
flexible variants
```

Tradeoffs:

```text
first-request latency
runtime compute
cache misses
```

---

# 31. Hybrid Image Transformation

A mature system may use both.

For example:

```text
Build-time:
logos
static marketing assets

Request-time:
CMS images
user uploads
dynamic content
```

The correct strategy depends on asset lifecycle.

---

# 32. Image Transformation and Caching

Transformation is often expensive enough that repeated work should be avoided.

Therefore:

```text
Request
   ↓
cache lookup
   ↓
HIT → return
MISS
   ↓
transform
   ↓
cache
   ↓
return
```

This is one of the most important production image patterns.

---

# 33. Cache Key Design

A transformation cache key should distinguish meaningful representation parameters.

Conceptually:

```text
cacheKey =
    sourceIdentity
    +
    width
    +
    height
    +
    crop
    +
    format
    +
    quality
```

Not every system needs every parameter encoded directly, but the representation identity must be deterministic.

---

# 34. Deterministic Transformations

For a given:

```text
source
+
transformation parameters
```

the output should ideally be deterministic.

For example:

```text
source = product123
width = 800
format = webp
quality = profile-card
```

should consistently map to the same representation.

Determinism improves:

```text
cacheability
debugging
reproducibility
observability
```

---

# 35. Cache Invalidation

Suppose:

```text
product123.jpg
```

is replaced.

Existing cached derivatives may still contain the old image.

Therefore source updates require an invalidation strategy.

Possible strategies include:

```text
content-hashed source identity
versioned URLs
cache invalidation
short TTL
purging
```

A strong architecture makes source versioning explicit.

---

# 36. Content Hashing

A source asset can be represented by a stable content identity:

```text
product123-v7
```

or:

```text
hash(source bytes)
```

Then:

```text
new source
    ↓
new identity
    ↓
new derivative URLs
```

This reduces stale-content ambiguity.

---

# 37. Transformation URLs

A transformation URL might conceptually represent:

```text
/image/product123
    ?width=800
    &format=webp
    &quality=card
```

The exact syntax does not matter.

The architectural property is:

```text
URL
    ↓
deterministic representation identity
```

That enables:

```text
cache reuse
debugging
CDN distribution
```

---

# 38. Format Selection vs Quality Selection

These are separate decisions.

For example:

```text
Format:
AVIF

Quality:
medium
```

is different from:

```text
Format:
WebP

Quality:
high
```

The system should not collapse both decisions into:

```text
"optimize image"
```

Instead model them separately.

---

# 39. Transformation Cost

Image transformation consumes compute.

A request can involve:

```text
source retrieval
+
decode
+
resize
+
crop
+
encode
+
cache write
```

For large images, this can be expensive.

Therefore:

```text
image optimization
```

is also an infrastructure workload.

---

# 40. Origin CPU Pressure

Imagine a high-traffic page containing:

```text
50 images
```

and the image cache is cold.

If each image requires transformation:

```text
50 × transformation cost
```

can create substantial origin pressure.

Therefore production systems should monitor:

```text
transformation requests
cache HIT rate
CPU usage
queue depth
latency
```

---

# 41. Cache Stampede

Suppose an expensive representation expires.

Thousands of requests arrive simultaneously:

```text
Request 1 → MISS
Request 2 → MISS
Request 3 → MISS
...
Request 5000 → MISS
```

If every request independently performs transformation, the system can experience a cache stampede.

Possible mitigation strategies include:

```text
request coalescing
single-flight generation
stale-while-revalidate
prewarming
distributed locking
```

The exact strategy depends on the infrastructure.

---

# 42. Image Quality and LCP

Higher quality generally increases bytes.

Therefore:

```text
quality ↑
    ↓
transfer ↑
    ↓
potential LCP impact ↑
```

But excessively low quality can damage visual experience.

The correct optimization target is:

```text
minimum acceptable visual quality
+
minimum practical transfer cost
```

---

# 43. Image Quality and Device Context

The ideal representation can vary with:

```text
image role
display size
DPR
network conditions
device capability
```

However, quality policies should remain bounded and predictable.

Avoid creating an uncontrolled matrix such as:

```text
every width
×
every quality
×
every format
×
every crop
```

because cache cardinality can explode.

---

# 44. Format Fallback Strategy

A robust system should have a fallback path.

Conceptually:

```text
Preferred modern format
        ↓
supported?
        ↓
yes → serve
no
 ↓
fallback format
```

This ensures format optimization does not become a compatibility failure.

---

# 45. Transparency Considerations

Some images require transparency.

Examples:

```text
logos
product cutouts
UI assets
overlays
```

Format selection must therefore consider:

```text
Does this representation support the required alpha/transparency semantics?
```

A format decision cannot be based solely on photographic compression efficiency.

---

# 46. Animated Images

Animated assets introduce another category.

Examples include:

```text
animated GIF
animated WebP
animated AVIF
video alternatives
```

Large animations may be significantly more expensive than static images.

For animation-heavy content, evaluate whether:

```text
video
```

is more appropriate than an animated image.

This is a media-delivery decision rather than simply an image-format decision.

---

# 47. Images vs Video

A large animated hero can create:

```text
large download
decode work
memory pressure
continuous rendering
```

A video may offer better compression and playback semantics for motion content.

Therefore:

```text
motion asset
    ↓
image or video?
```

should be decided based on content behavior.

---

# 48. Color and Visual Fidelity

Compression is not only about dimensions.

Color handling can affect visual output.

Production pipelines may need to consider:

```text
color profile
color space
HDR content
conversion behavior
```

These concerns become increasingly relevant for high-fidelity media platforms.

The key principle is:

> **Optimization must preserve the visual semantics required by the product.**

---

# 49. Transformation Pipelines Should Be Observable

For every transformation class, production systems should ideally expose:

```text
source
requested width
requested height
format
quality profile
crop mode
cache status
transformation latency
output bytes
```

This enables questions such as:

```text
Why is this image 900KB?
Why is this variant generated repeatedly?
Why is the cache HIT rate low?
Why is AVIF generation consuming CPU?
```

Without observability, image optimization becomes guesswork.

---

# 50. Four-Pillar Engineering Matrix

## Pillar 1 — Correctness

Verify:

```text
format compatibility
correct dimensions
correct crop
correct transparency
correct visual content
correct fallback
```

---

## Pillar 2 — Performance

Optimize:

```text
encoded bytes
pixel dimensions
quality
format
transformation cost
cache reuse
```

---

## Pillar 3 — Reliability

Handle:

```text
encoder failure
source failure
transformation failure
unsupported formats
cache MISS spikes
large-image abuse
```

---

## Pillar 4 — Operability

Measure:

```text
transformation latency
output size
format distribution
cache HIT ratio
CPU consumption
variant cardinality
quality failures
```

---

# 51. Senior Prediction Challenge

You have:

```text
Original:
4000 × 3000

Displayed:
400 × 300
```

Would lowering JPEG quality alone solve the problem?

Not necessarily.

The source may still contain:

```text
12 million pixels
```

when only a much smaller representation is required.

A better architecture is:

```text
resize
    ↓
appropriate representation
    ↓
compress
```

---

# 52. Senior Prediction Challenge

Two images both use:

```text
quality = 80
```

but one is much larger.

Does that mean one encoder is broken?

No.

Quality parameters are codec-specific and image-content-dependent.

Compression efficiency depends on:

```text
format
content
dimensions
encoder
settings
```

---

# 53. Senior Prediction Challenge

A team switches every image from WebP to AVIF.

Their bandwidth decreases, but image-processing CPU increases dramatically.

Is the migration automatically successful?

No.

The architecture must consider:

```text
delivery savings
vs
transformation cost
```

The correct decision depends on total system economics and user-facing performance.

---

# 54. Senior Prediction Challenge

A cache contains:

```text
product.jpg → WebP
```

A client that requires another representation receives an incompatible cached object.

What architectural problem does this indicate?

The cache identity or content-negotiation strategy does not correctly distinguish representation variants.

---

# 55. Senior Prediction Challenge

A source image changes, but users continue seeing the previous image.

What should you investigate?

```text
source versioning
cache identity
CDN TTL
browser cache
invalidation
stale derivatives
```

Do not assume the transformation service itself is broken.

---

# 56. Senior Interview Questions

### Q1. When would you use JPEG?

For broad-compatibility photographic raster content where its compression characteristics are appropriate.

### Q2. When would PNG be useful?

When lossless fidelity or transparency is important.

### Q3. What problem do WebP and AVIF solve?

They provide modern image encodings that can reduce representation size for many workloads.

### Q4. Is AVIF always better?

No. Format selection also includes encoding cost, decoding behavior, compatibility, infrastructure support, and operational complexity.

### Q5. Why resize before delivery?

Because sending unnecessarily large pixel dimensions increases network, decode, and memory cost.

### Q6. Why preserve original assets?

To allow future transformations without repeatedly transcoding already-compressed derivatives.

### Q7. What belongs in a transformation cache key?

All parameters that materially change the resulting representation.

### Q8. Why can image transformation overload a server?

Large images require CPU and memory for decoding, resizing, cropping, and encoding.

### Q9. What is cache stampede?

Multiple concurrent requests independently regenerating the same expensive uncached representation.

### Q10. Why is quality not a universal percentage?

Because quality parameters are codec-specific and do not map to a universal perceptual scale.

---

# 57. Core Invariants

Memorize:

```text
original asset
    ≠
delivery representation
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
smaller bytes
    ≠
automatically better system
```

```text
higher quality
    ≠
automatically better UX
```

```text
same source
    ≠
same cache representation
```

```text
modern format
    ≠
universally optimal format
```

```text
transformation
    =
compute workload
```

```text
cache miss
    =
potential transformation cost
```

---

# 58. SDE-2 Mental Model

When you receive an image optimization problem, reason in this order:

```text
1. What is the source asset?
        ↓
2. Is it raster or vector?
        ↓
3. What dimensions are actually required?
        ↓
4. Does the image need cropping?
        ↓
5. What visual quality is required?
        ↓
6. Which encoding formats are appropriate?
        ↓
7. What transformation parameters define the representation?
        ↓
8. What is the cache identity?
        ↓
9. Where does transformation occur?
        ↓
10. What is the compute cost?
        ↓
11. What is the delivery cost?
        ↓
12. How is the result observed and invalidated?
```

This is the production-level image transformation mental model.

---

# 59. Production Image Architecture

A mature architecture can be modeled as:

```text
                  Canonical Asset
                        │
                        ▼
                Asset Metadata
                        │
          ┌─────────────┼─────────────┐
          │             │             │
       Purpose        Crop          Size
          │             │             │
          └─────────────┼─────────────┘
                        ▼
               Transformation Policy
                        │
             ┌──────────┼──────────┐
             │          │          │
           Format     Quality    Dimensions
             │          │          │
             └──────────┼──────────┘
                        ▼
                  Encoded Variant
                        │
                        ▼
                    Cache/CDN
                        │
                        ▼
                    Browser
```

Every stage has a clear responsibility.

---

# 60. Part Completion Checklist

You should now be able to explain:

* [ ] Raster vs vector.
* [ ] SVG use cases.
* [ ] JPEG characteristics.
* [ ] PNG characteristics.
* [ ] WebP characteristics.
* [ ] AVIF characteristics.
* [ ] Lossy vs lossless compression.
* [ ] Format selection tradeoffs.
* [ ] Format negotiation.
* [ ] Format-aware cache identity.
* [ ] Quality settings.
* [ ] Why quality is codec-specific.
* [ ] Perceptual quality.
* [ ] Compression artifacts.
* [ ] Why image content affects compression.
* [ ] Why resizing matters.
* [ ] Crop transformations.
* [ ] Aspect-ratio transformations.
* [ ] Smart/focal-point cropping.
* [ ] Transformation ownership.
* [ ] Build-time transformation.
* [ ] Request-time transformation.
* [ ] Hybrid transformation architectures.
* [ ] Transformation caching.
* [ ] Deterministic transformation identity.
* [ ] Source versioning.
* [ ] Cache invalidation.
* [ ] Transformation compute cost.
* [ ] Origin CPU pressure.
* [ ] Cache stampedes.
* [ ] Format fallbacks.
* [ ] Transparency considerations.
* [ ] Animated image considerations.
* [ ] Image vs video decisions.
* [ ] Production transformation observability.

---

# 61. Boundary of Part 04

Part 04 established how a selected image representation is **generated and encoded**:

```text
Source Asset
     ↓
Resize / Crop
     ↓
Format
     ↓
Quality
     ↓
Compression
     ↓
Encoded Representation
     ↓
Cache / CDN
```

Part 03 answered:

```text
Which representation should the browser request?
```

Part 04 answered:

```text
How should that representation be generated?
```

The next architectural concern is:

```text
How should images be cached, invalidated,
distributed, and served at scale?
```

Therefore the next part is:

**KPI 10 — Part 05: Image CDN, Caching, Invalidation & Delivery Architecture**
