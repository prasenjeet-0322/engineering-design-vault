# Level 08 — Next.js & Full-Stack React

# KPI 10 — Image Optimization & Media Delivery

## Part 01 — Image Optimization Mental Model & Delivery Architecture

---

# 1. Part Objective

Images are one of the most expensive resources a modern web application delivers.

They affect:

```text
Network transfer
Page weight
LCP
Bandwidth
CPU
Memory
Layout stability
Caching
CDN utilization
Mobile performance
User experience
```

At beginner level, image optimization often means:

```text
Use smaller images.
```

At senior level, the problem is much broader:

> **How should an application select, transform, cache, deliver, and render images so that the browser receives the right representation for the user's device, viewport, network, and rendering context?**

The architecture is:

```text
Original Asset
      ↓
Image Processing
      ↓
Representation Selection
      ↓
CDN / Cache
      ↓
HTTP Response
      ↓
Browser Decode
      ↓
Layout / Paint / Composite
```

The goal of this KPI is to understand that entire pipeline.

---

# 2. Why Image Optimization Is an Architecture Problem

An image is not just a file.

A production application may have:

```text
Original:
product-hero.jpg

Generated representations:
320w
640w
768w
1024w
1280w
1536w
1920w
```

Potential formats:

```text
JPEG
PNG
WebP
AVIF
SVG
```

The browser may ultimately receive only one representation.

Therefore:

```text
Original asset
      ↓
Transformation
      ↓
Candidate representations
      ↓
Browser selection
      ↓
Network transfer
```

The engineering question becomes:

> Which representation should be delivered?

---

# 3. The Core Mental Model

The complete image pipeline:

```text
                    IMAGE REQUEST
                         │
                         ▼
                 IMAGE URL / SOURCE
                         │
                         ▼
                RESOURCE RESOLUTION
                         │
                         ▼
              TRANSFORMATION POLICY
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
           FORMAT      WIDTH       QUALITY
              │          │          │
              └──────────┼──────────┘
                         ▼
                    CDN / CACHE
                         │
                         ▼
                     RESPONSE
                         │
                         ▼
                  BROWSER DECODE
                         │
                         ▼
                    LAYOUT / PAINT
```

Every layer has different performance characteristics.

---

# 4. Industry Frequency

| Concept                      | Frequency       | Senior Relevance  |
| ---------------------------- | --------------- | ----------------- |
| Responsive images            | 🟢 Daily Driver | Very High         |
| Image dimensions             | 🟢 Daily Driver | Very High         |
| `width` / `height`           | 🟢 Daily Driver | Very High         |
| Lazy loading                 | 🟢 Daily Driver | Very High         |
| `srcset` / `sizes`           | 🟢 Daily Driver | Very High         |
| Modern formats               | 🟢 Daily Driver | High              |
| CDN delivery                 | 🟢 Daily Driver | Very High         |
| Image transformation         | 🟢 Daily Driver | High              |
| Image caching                | 🟢 Daily Driver | Very High         |
| Image compression            | 🟢 Daily Driver | High              |
| Browser decode cost          | 🟡 Moderate     | High              |
| Art direction                | 🟡 Moderate     | High              |
| Image CDN architecture       | 🟡 Moderate     | Very High         |
| Next.js image optimization   | 🟢 Daily Driver | Very High         |
| Client-side image processing | 🟡 Moderate     | Context-dependent |

---

# 5. Image Performance Has Multiple Costs

Image optimization is not simply:

```text
file size
```

There are several costs.

## 5.1 Transfer Cost

How many bytes travel across the network?

```text
5 MB image
↓
network
↓
browser
```

Large transfer increases:

```text
download time
data usage
LCP risk
```

---

# 6. Decode Cost

After downloading, the browser must decode the image.

For example:

```text
4000 × 3000
```

contains:

```text
12 million pixels
```

Even if compression makes the file relatively small, decoding and storing the bitmap still has a memory cost.

Therefore:

```text
compressed file size
≠
decoded memory size
```

This is an important senior-level distinction.

---

# 7. Rendered Dimensions Matter

Suppose an image is displayed at:

```text
400 × 300
```

but the server sends:

```text
4000 × 3000
```

The browser receives significantly more pixel information than necessary.

The correct question is:

> What resolution does the browser actually need?

This leads to responsive image delivery.

---

# 8. Transfer Size vs Pixel Dimensions

Consider:

```text
Image A
4000 × 3000
2 MB
```

and:

```text
Image B
1200 × 900
500 KB
```

If both render at:

```text
600 × 450
```

Image B may be much more appropriate.

But there is another consideration:

```text
high-DPR device
```

A device with device pixel ratio 2 may benefit from a source around:

```text
1200 CSS pixels
```

for a:

```text
600 CSS-pixel
```

rendered image.

Therefore responsive image selection must account for:

```text
viewport
rendered size
device pixel ratio
```

---

# 9. Device Pixel Ratio

Suppose:

```text
CSS width = 400px
DPR = 2
```

The browser may need approximately:

```text
800 physical pixels
```

of horizontal image resolution.

Therefore:

```text
rendered CSS width
×
device pixel ratio
```

provides a useful conceptual target.

But the browser does not simply multiply blindly.

It chooses from available candidates.

---

# 10. Responsive Image Architecture

A modern application may provide:

```text
320w
480w
640w
768w
1024w
1280w
1536w
```

Then the browser determines which candidate best satisfies the rendering context.

Conceptually:

```text
Viewport
   ↓
Layout calculation
   ↓
Rendered image width
   ↓
DPR / network considerations
   ↓
Candidate selection
   ↓
Download
```

This is preferable to:

```text
always send 2000px image
```

---

# 11. `srcset`

The browser can receive multiple candidate widths:

```html
<img
  src="image-800.jpg"
  srcset="
    image-400.jpg 400w,
    image-800.jpg 800w,
    image-1200.jpg 1200w
  "
/>
```

The `w` descriptors communicate:

> This candidate represents an image resource approximately this many CSS pixels wide.

The browser combines this information with layout requirements.

---

# 12. `sizes`

`sizes` tells the browser how wide the image is expected to render under different viewport conditions.

Example:

```html
<img
  srcset="
    image-400.jpg 400w,
    image-800.jpg 800w,
    image-1200.jpg 1200w
  "
  sizes="
    (max-width: 768px) 100vw,
    50vw
  "
/>
```

The conceptual pipeline is:

```text
viewport
   ↓
sizes
   ↓
expected rendered width
   ↓
srcset candidate selection
```

This is one of the most important responsive-image concepts.

---

# 13. Why Incorrect `sizes` Matters

Suppose the image actually renders at:

```text
400px
```

but the browser is told:

```text
100vw
```

on a 1440px viewport.

The browser may select a much larger source than necessary.

Therefore:

```text
responsive image
+
incorrect sizes
=
unnecessary transfer
```

The optimization mechanism can exist while the architecture is still inefficient.

---

# 14. CSS Layout Is Part of Image Optimization

Image optimization cannot be designed independently from layout.

Consider:

```text
Image
  ↓
CSS Grid
  ↓
column width
  ↓
rendered image width
```

If you do not understand the actual layout width, you cannot correctly reason about the required image representation.

Therefore:

```text
image optimization
depends on
layout architecture
```

---

# 15. Image Formats

Different formats have different characteristics.

## JPEG

Traditionally useful for:

```text
photographs
continuous-tone images
```

Strength:

```text
good lossy compression
```

Weaknesses:

```text
no alpha transparency
less efficient for some modern workloads
```

---

# 16. PNG

Useful when you need:

```text
lossless representation
transparency
sharp graphics
```

But PNG can become expensive for photographic images.

Therefore:

```text
photographic content
→
often not ideal as PNG
```

---

# 17. WebP

WebP provides modern image compression and supports:

```text
lossy
lossless
transparency
```

It is broadly supported in modern browsers.

---

# 18. AVIF

AVIF can provide strong compression efficiency for many images.

Potential benefits:

```text
smaller transfer size
modern compression
```

But encoding cost and compatibility considerations may affect architectural decisions depending on the environment.

The senior-level principle is not:

> Always use AVIF.

It is:

> **Choose an image representation appropriate to the content, browser support, transformation pipeline, and operational cost.**

---

# 19. SVG

SVG is fundamentally different from raster images.

SVG represents graphics using vector instructions.

Useful for:

```text
logos
icons
simple illustrations
geometric graphics
```

It can scale without raster pixel enlargement.

But SVG introduces a different security and complexity model when untrusted content is involved.

---

# 20. Format Selection Is a Content Problem

A production image system should understand content types.

Example:

```text
Photograph
→ JPEG/WebP/AVIF

Logo
→ SVG

Transparent product image
→ WebP/AVIF/PNG depending on requirements

Icon
→ SVG
```

Do not apply one format blindly to every asset.

---

# 21. Compression

Compression attempts to reduce:

```text
transfer bytes
```

while preserving acceptable visual quality.

There is a tradeoff:

```text
quality
   ↕
file size
```

Increasing compression can reduce transfer size but may introduce visible artifacts.

---

# 22. Quality Is Context-Dependent

A thumbnail:

```text
120 × 120
```

may tolerate aggressive compression.

A hero photograph:

```text
1920 × 1080
```

may require higher quality.

Therefore:

```text
quality
=
function of
content + display size + visual importance
```

not a universal constant.

---

# 23. Image Transformation

A transformation pipeline can accept:

```text
original image
```

and generate:

```text
format
width
height
quality
crop
fit
```

Conceptually:

```text
/image.jpg
   ↓
?width=800
&format=webp
&quality=75
```

The actual URL syntax depends on the image infrastructure.

---

# 24. Why Transformation Should Be Server/CDN-Side

Client-side transformation means:

```text
download large original
       ↓
browser processes image
       ↓
display
```

This defeats much of the purpose of image optimization.

Better:

```text
original
   ↓
image service / CDN
   ↓
optimized representation
   ↓
browser
```

The browser receives the representation it needs.

---

# 25. Image CDN Architecture

A production architecture often looks like:

```text
                    ORIGINAL IMAGE
                          │
                          ▼
                   OBJECT STORAGE
                          │
                          ▼
                     IMAGE CDN
                          │
            ┌─────────────┼─────────────┐
            ▼             ▼             ▼
          400w          800w          1200w
            │             │             │
            └─────────────┼─────────────┘
                          ▼
                       BROWSER
```

The CDN can cache transformed representations.

---

# 26. Cache Key Design

Suppose:

```text
original = image123
width = 800
format = webp
quality = 75
```

The cache identity must distinguish this representation from:

```text
width = 1200
format = avif
quality = 70
```

Conceptually:

```text
cache key =
asset
+
transformation parameters
```

Therefore:

```text
image identity
≠
representation identity
```

This mirrors the architecture learned in the metadata KPI.

---

# 27. Image Cache Explosion

There is a tradeoff.

If arbitrary transformation parameters are allowed:

```text
width=401
width=402
width=403
...
```

the system can generate enormous numbers of cache variants.

Therefore production image systems often constrain:

```text
allowed widths
allowed formats
allowed quality values
allowed transformations
```

This makes caching predictable.

---

# 28. Next.js Image Optimization Mental Model

Next.js provides an image abstraction through:

```tsx
import Image from "next/image";
```

The important thing is not memorizing the component API.

Understand what the abstraction is trying to solve:

```text
responsive sizing
optimized formats
image dimensions
lazy loading
layout stability
image delivery
```

Conceptually:

```text
<Image>
    ↓
image configuration
    ↓
optimized representation
    ↓
browser
```

---

# 29. `next/image` Is an Optimization Layer

Do not think:

```text
<Image>
=
fancy <img>
```

Think:

```text
<Image>
=
image delivery policy
+
responsive representation
+
layout information
+
loading behavior
```

That is the architectural value.

---

# 30. Local vs Remote Images

Local assets are easier for the framework to reason about because metadata may be available during build time.

Remote images introduce:

```text
unknown dimensions
remote origin
security considerations
transformation requirements
availability risk
```

Therefore remote images require more explicit architecture.

---

# 31. Remote Image Security

A production application should not blindly allow arbitrary remote URLs.

Dangerous conceptual architecture:

```text
<Image src={userProvidedUrl} />
```

where any external domain can be requested.

This can create:

```text
untrusted resource fetching
bandwidth abuse
unexpected external dependencies
cache pollution
security risks
```

Therefore image origins should be controlled.

---

# 32. Image Dimensions

Knowing dimensions allows the application to reserve layout space.

Example:

```text
width = 1200
height = 800
```

The browser can establish the image's aspect ratio before the image finishes downloading.

This reduces layout instability.

---

# 33. Cumulative Layout Shift

Without known dimensions:

```text
Text
Image placeholder
```

may initially occupy:

```text
0px
```

Then the image loads:

```text
400px
```

and pushes the content downward.

Conceptually:

```text
Initial:
A
B
C

Image loads:

A
IMAGE
B
C
```

The layout shifts.

Providing intrinsic dimensions or aspect-ratio information helps reserve the correct space.

---

# 34. LCP and Images

The largest contentful paint is often an image.

Typical examples:

```text
hero image
banner
product image
article cover
```

Therefore image architecture directly influences LCP.

The critical path can look like:

```text
HTML
 ↓
discover image
 ↓
request image
 ↓
download
 ↓
decode
 ↓
paint
 ↓
LCP
```

Reducing image latency can materially improve the critical rendering path.

---

# 35. Lazy Loading

Images below the initial viewport often do not need to be downloaded immediately.

Conceptually:

```text
Above viewport
→ prioritize

Below viewport
→ defer
```

This reduces initial network work.

But lazy loading should not be applied blindly.

---

# 36. Do Not Lazy-Load the Critical Hero

Suppose the main hero image is the LCP element.

If it is unnecessarily lazy-loaded:

```text
page starts
 ↓
browser delays image request
 ↓
hero arrives later
 ↓
LCP increases
```

Therefore:

> **Loading strategy should follow visual importance, not simply image existence.**

---

# 37. Image Priority

Critical images may require higher loading priority.

The architectural question is:

```text
Which images are on the critical rendering path?
```

Examples:

```text
hero
primary product image
above-the-fold article image
```

versus:

```text
footer logos
below-the-fold recommendations
carousel slides not currently visible
```

---

# 38. Image Optimization and Server Rendering

Next.js server rendering can determine:

```text
image source
dimensions
responsive candidates
```

before the browser receives the page.

This can improve discoverability and reduce client-side work.

But server rendering does not automatically make images fast.

The actual image bytes still need to be:

```text
generated
cached
transferred
decoded
painted
```

---

# 39. Image Optimization and Streaming

With streaming:

```text
HTML shell
 ↓
content
 ↓
image references
```

the browser may discover image resources progressively.

This makes resource prioritization important.

A poorly designed image system can still overwhelm the network even when HTML streaming is optimized.

---

# 40. Image Optimization and CDN

A high-scale architecture often looks like:

```text
Next.js
   ↓
Image URL
   ↓
CDN
   ↓
Transformation Service
   ↓
Object Storage
```

The application should ideally avoid processing every image request directly through application servers if the architecture can offload this work.

---

# 41. Origin Load

Suppose:

```text
10,000 users
```

request the same image.

Without caching:

```text
10,000 requests
→ origin
```

With effective CDN caching:

```text
10,000 users
      ↓
     CDN
      ↓
one/few origin fetches
```

This reduces origin load.

---

# 42. Cache-Control

Images are often highly cacheable.

But cache policy depends on asset mutability.

Immutable asset:

```text
/product-123-v42.webp
```

can have aggressive caching.

Mutable URL:

```text
/product-123.webp
```

requires stronger invalidation/versioning semantics.

---

# 43. Content Hashing

A common strategy is:

```text
product-123.abcd1234.webp
```

When the content changes:

```text
product-123.xyz9876.webp
```

The URL changes.

This allows aggressive caching because the old URL remains immutable.

The conceptual model:

```text
content
   ↓
hash
   ↓
unique URL
   ↓
long-lived cache
```

---

# 44. Image URL Identity

An image system should distinguish:

```text
asset identity
```

from:

```text
transformation identity
```

For example:

```text
asset:
product-123

representation:
product-123
+ width 800
+ WebP
+ quality 75
```

This matters for:

```text
cache
invalidation
CDN
observability
storage
```

---

# 45. Responsive Images Are Not Just Mobile Optimization

Responsive images are useful across:

```text
mobile
tablet
desktop
large desktop
high-DPR displays
```

The goal is:

> Deliver approximately the amount of image data required by the actual rendering context.

Therefore:

```text
responsive images
=
bandwidth efficiency
```

not simply:

```text
mobile support
```

---

# 46. Art Direction

Sometimes the correct mobile representation is not simply a smaller version.

Example:

Desktop:

```text
wide landscape hero
```

Mobile:

```text
portrait crop
```

A simple responsive width change may still produce poor composition.

Art direction means:

```text
same conceptual content
different visual crop
```

This is different from merely resizing.

---

# 47. Image Semantics

Optimization must not remove semantic correctness.

For meaningful content:

```html
<img alt="Red running shoes" />
```

The `alt` text communicates meaning.

A visually optimized image can still be inaccessible if its semantics are wrong.

Therefore:

```text
performance
+
accessibility
```

must be designed together.

---

# 48. Decorative Images

Purely decorative images may require different semantics.

The architectural question is:

> Does the image communicate information?

If not, assistive technologies may need it treated as decorative.

This is not an image-performance problem alone.

It is a representation problem.

---

# 49. Image Loading Strategy Matrix

| Image Type               | Typical Strategy             |
| ------------------------ | ---------------------------- |
| LCP hero                 | High priority                |
| Above-fold product image | High priority                |
| Below-fold content image | Lazy                         |
| Footer decoration        | Lazy/deferred                |
| Critical logo            | Early                        |
| Hidden carousel slide    | Usually deferred             |
| Avatar list              | Responsive + lazy            |
| Background decoration    | CSS / optimized asset        |
| Large article image      | Responsive + dimension-aware |

These are architectural defaults, not absolute rules.

---

# 50. Common Failure Modes

## Failure 1 — Sending Original Images

```text
4 MB original
↓
browser
```

### Problem

Unnecessary transfer.

### Better

Generate appropriate responsive representations.

---

# 51. Failure 2 — Incorrect `sizes`

```text
actual width = 400px

sizes = 100vw
```

### Problem

Browser may choose unnecessarily large candidates.

### Lesson

Responsive image configuration must reflect actual layout.

---

# 52. Failure 3 — Lazy Loading LCP

```text
hero image
↓
lazy
```

### Problem

Critical resource delayed.

### Lesson

Prioritize by rendering importance.

---

# 53. Failure 4 — Missing Dimensions

```text
image
↓
unknown dimensions
```

### Problem

Potential layout shift.

### Lesson

Provide intrinsic dimensions or equivalent aspect-ratio information.

---

# 54. Failure 5 — Unlimited Transformations

```text
width=401
width=402
width=403
...
```

### Problem

Cache fragmentation and transformation explosion.

### Lesson

Use controlled transformation variants.

---

# 55. Failure 6 — Unrestricted Remote Sources

```text
<Image src={arbitraryUrl} />
```

### Problem

Uncontrolled external resource access and caching.

### Lesson

Define trusted remote image origins.

---

# 56. Failure 7 — Optimizing Only File Size

An engineer reduces:

```text
2 MB
→
200 KB
```

but ignores:

```text
LCP
decode cost
layout shift
priority
responsive sizing
cache behavior
```

Image performance is multidimensional.

---

# 57. Failure 8 — One Image for Every Viewport

```text
2000px image
→
mobile
tablet
desktop
```

### Problem

Smaller devices receive unnecessary pixels.

### Lesson

Use responsive representations.

---

# 58. Failure 9 — Client-Side Resizing After Download

```text
download 3000px
↓
CSS width 300px
```

### Problem

The network already transferred the expensive representation.

CSS resizing does not recover bandwidth.

---

# 59. Four-Pillar Engineering Matrix

| Decision                      | Correctness | Performance | Reliability | Maintainability |
| ----------------------------- | ----------- | ----------- | ----------- | --------------- |
| Responsive candidates         | High        | High        | High        | High            |
| Fixed huge source             | Medium      | Low         | High        | High            |
| CDN transformation            | High        | High        | High        | Medium          |
| Unlimited transformations     | Medium      | Low         | Low         | Low             |
| Explicit dimensions           | High        | High        | High        | High            |
| Lazy loading everything       | Low         | Mixed       | Medium      | High            |
| Critical-image prioritization | High        | High        | High        | High            |

---

# 60. React Relevance

In React applications, image decisions interact with:

```text
component rendering
conditional rendering
lists
virtualization
Suspense
lazy loading
route transitions
```

A reusable image component should not simply wrap `<img>`.

It should establish consistent policies for:

```text
dimensions
alt text
loading
priority
responsive sizes
fallbacks
```

---

# 61. Next.js Relevance

In Next.js, image architecture intersects with:

```text
Server Components
Client Components
<Image>
remote image configuration
routing
CDN
caching
SSR
SSG
ISR
deployment
```

The key principle:

> The framework can automate image optimization, but the developer still has to provide correct image semantics and layout information.

---

# 62. TypeScript Relevance

A typed image model can prevent inconsistent image usage.

Conceptually:

```ts
type ImageAsset = {
  src: string;
  width: number;
  height: number;
  alt: string;
};
```

More advanced systems can model:

```ts
type ImageRole =
  | "hero"
  | "thumbnail"
  | "avatar"
  | "gallery"
  | "decorative";
```

Then image rendering policies can depend on role.

For example:

```text
hero
→ high priority

thumbnail
→ lazy

decorative
→ different accessibility semantics
```

This moves performance policy closer to architecture.

---

# 63. Production Image Architecture

A mature system might look like:

```text
                    CMS / Upload
                         │
                         ▼
                   Original Asset
                         │
                         ▼
                 Object Storage
                         │
                         ▼
                 Image Processing
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
      WebP              AVIF             JPEG
        │                │                │
        └────────────────┼────────────────┘
                         ▼
                    Image CDN
                         │
                         ▼
                    Next.js URL
                         │
                         ▼
                     Browser
                         │
                         ▼
                 Decode / Render
```

---

# 64. Production Decision Sequence

When adding an image to a production application, reason in this order:

```text
1. What does this image represent?
        ↓
2. What are its intrinsic dimensions?
        ↓
3. Where will it render?
        ↓
4. What width will it actually occupy?
        ↓
5. Is it critical to initial rendering?
        ↓
6. Which format is appropriate?
        ↓
7. Which responsive candidates are needed?
        ↓
8. How should it be cached?
        ↓
9. Where should transformation occur?
        ↓
10. What accessibility semantics does it require?
```

---

# 65. Prediction Challenges

## Challenge 1

An image renders at `400px`, but the browser downloads a `2000px` source.

What part of the responsive image architecture should you inspect first?

---

## Challenge 2

A hero image is the LCP element, but the request starts several seconds after HTML parsing.

What loading decision may be wrong?

---

## Challenge 3

An image is only `200 KB`, but memory usage is still high.

Why can compressed file size fail to represent runtime memory cost?

---

## Challenge 4

A page's image cache contains thousands of nearly identical variants:

```text
width=401
width=402
width=403
...
```

What architectural problem exists?

---

## Challenge 5

A mobile device downloads the same 2000px image as desktop.

What information might be missing or incorrect?

---

## Challenge 6

A remote image component accepts arbitrary user-provided URLs.

What production concerns should you investigate?

---

# 66. Senior Interview Gotchas

### Gotcha 1

**“If CSS displays an image at 300px, why can't the browser just download a 300px image?”**

Because the server must provide an appropriate candidate and the browser needs information about the intended rendered size and device context.

---

### Gotcha 2

**“Does compression solve image performance?”**

No.

You must also consider:

```text
dimensions
format
loading priority
responsive candidates
CDN
cache
decode
layout
```

---

### Gotcha 3

**“Should every image be lazy-loaded?”**

No.

Critical above-the-fold images may need early loading.

---

### Gotcha 4

**“Is a small file always cheap?”**

No.

Decoded dimensions can still create substantial memory and processing costs.

---

### Gotcha 5

**“Does resizing with CSS optimize network performance?”**

No.

CSS resizing changes display size, not the bytes already transferred.

---

### Gotcha 6

**“Should you generate unlimited image widths?”**

Usually no.

A controlled candidate set avoids cache fragmentation and transformation explosion.

---

# 67. 30-Second Executive Cheat Sheet

Remember:

```text
Image performance
=
bytes
+
pixels
+
decode
+
priority
+
layout
+
cache
```

Responsive image architecture:

```text
layout width
      +
device context
      ↓
candidate selection
      ↓
optimized representation
      ↓
CDN/cache
      ↓
browser
```

Critical rules:

```text
Do not send huge originals unnecessarily.

Do not rely on CSS resizing for network optimization.

Do not lazy-load every image.

Do not omit dimensions.

Do not allow uncontrolled remote sources.

Do not generate unlimited transformation variants.

Do not optimize file size while ignoring rendering behavior.
```

---

# 68. Part Completion Checklist

You should now be able to explain:

### Fundamentals

* [ ] Why image optimization is an architectural concern
* [ ] Transfer cost
* [ ] Decode cost
* [ ] Memory cost
* [ ] Pixel dimensions
* [ ] Device pixel ratio

### Responsive Images

* [ ] `srcset`
* [ ] `sizes`
* [ ] responsive candidate selection
* [ ] actual rendered width
* [ ] art direction

### Formats

* [ ] JPEG
* [ ] PNG
* [ ] WebP
* [ ] AVIF
* [ ] SVG

### Loading

* [ ] lazy loading
* [ ] critical image priority
* [ ] LCP image behavior
* [ ] above-the-fold strategy

### Layout

* [ ] intrinsic dimensions
* [ ] aspect ratio
* [ ] layout stability
* [ ] CLS relationship

### Delivery

* [ ] CDN
* [ ] transformation
* [ ] caching
* [ ] cache keys
* [ ] origin load
* [ ] content hashing

### Next.js

* [ ] `<Image>`
* [ ] local vs remote images
* [ ] remote-origin control
* [ ] responsive delivery
* [ ] image optimization architecture

### Senior Reasoning

* [ ] Diagnose oversized image downloads
* [ ] Diagnose LCP image delays
* [ ] reason about cache explosion
* [ ] reason about image CDN architecture
* [ ] reason about accessibility and performance together
* [ ] design a production image pipeline

---

# 69. Final Mental Model

The most important model from this part is:

```text
                     ORIGINAL IMAGE
                           │
                           ▼
                   IMAGE REPRESENTATION
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
           WIDTH         FORMAT        QUALITY
             │             │             │
             └─────────────┼─────────────┘
                           ▼
                        CACHE/CDN
                           │
                           ▼
                     BROWSER REQUEST
                           │
                           ▼
                    DOWNLOAD BYTES
                           │
                           ▼
                       DECODE
                           │
                           ▼
                     LAYOUT / PAINT
                           │
                           ▼
                    USER EXPERIENCE
```

The senior-level insight is:

> **Image optimization is not primarily about shrinking files. It is about delivering the correct image representation at the correct time, size, quality, and cache boundary for the actual rendering context.**

---

# 70. Part Boundary

This part establishes the **mental model and architecture of image optimization**.

It intentionally does not yet go deeply into:

* Next.js `<Image>` API mechanics
* responsive image configuration
* `sizes` strategy
* remote image configuration
* image loaders
* custom image CDNs
* advanced image caching
* dynamic image generation
* production image architecture

Those belong to the following parts.

**Next:** KPI 10 — Part 02: **Next.js `<Image>` Architecture & Rendering Mechanics**.
