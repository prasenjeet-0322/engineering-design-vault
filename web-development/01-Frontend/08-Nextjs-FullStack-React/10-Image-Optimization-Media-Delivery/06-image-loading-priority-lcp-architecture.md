# Level 08 — KPI 10 — Part 06

## Image Loading, Priority, Lazy Loading & LCP Architecture

---

# 1. Part Objective

This part focuses on a different problem from CDN caching:

> **When should the browser request an image, how urgently should it request it, and how does that decision affect perceived page performance?**

The previous parts established:

```text
Part 01 → image delivery mental model
Part 02 → Next.js <Image> mechanics
Part 03 → responsive image selection
Part 04 → formats, compression & transformation
Part 05 → CDN, caching & delivery
```

This part establishes:

```text
Image discovery
      ↓
Request scheduling
      ↓
Priority
      ↓
Loading strategy
      ↓
Network transfer
      ↓
Decode
      ↓
Layout
      ↓
Paint
      ↓
LCP / visual completion
```

The central principle is:

> **An optimized image that is requested at the wrong time can still produce poor user experience.**

---

# 2. Image Performance Is a Scheduling Problem

Image performance is not only about:

```text
bytes
```

It is also about:

```text
when the browser discovers the resource
+
when it requests the resource
+
how it prioritizes the request
+
when it decodes the resource
+
when the image participates in layout and paint
```

Therefore:

```text
image performance
=
resource size
+
resource discovery
+
request scheduling
+
network priority
+
decode
+
layout
+
paint
```

This extends the earlier image-performance model:

```text
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

---

# 3. Critical vs Non-Critical Images

The first architectural decision is classification.

Not every image deserves the same loading strategy.

A page might contain:

```text
Hero image
Product images
Author avatar
Decorative background
Below-the-fold gallery
Footer logo
Analytics placeholder
```

These do not have equal importance.

A useful classification is:

```text
Critical
↓
visible and directly contributes to initial experience

Important
↓
likely to become visible shortly

Deferred
↓
below the fold or secondary

Decorative
↓
does not materially contribute to content
```

The loading strategy should follow the classification.

---

# 4. Above-the-Fold Does Not Automatically Mean Critical

A common mistake is:

```text
above the fold
→
high priority
```

This is too simplistic.

An image can be:

```text
above the fold
```

but:

```text
tiny
decorative
non-content
```

while another image slightly lower in the document may be:

```text
the primary visual
```

The correct question is:

> Does this image materially contribute to the initial user-visible experience?

---

# 5. The Hero Image

Consider:

```text
Product page
-------------------------
Product title
Hero product image
Price
Purchase controls
-------------------------
Reviews
Recommendations
Footer
```

The hero image may become the largest meaningful visual element.

If so:

```text
Hero image
→
potential LCP candidate
```

Therefore the browser may need to discover and request it early.

This creates a relationship:

```text
Hero importance
        ↓
Image request timing
        ↓
LCP timing
```

---

# 6. LCP Mental Model

Largest Contentful Paint measures when the largest qualifying content element becomes rendered in the viewport.

That element may be:

* an image
* text
* a video poster/image
* another qualifying content element

For image-driven pages, LCP commonly involves:

```text
HTML discovery
→
image request
→
network transfer
→
decode
→
render
```

Therefore:

```text
LCP ≠ image download time alone
```

It is the result of the full rendering chain.

---

# 7. Image LCP Timeline

Conceptually:

```text
HTML arrives
    ↓
Browser parses HTML
    ↓
Image discovered
    ↓
Request begins
    ↓
Response arrives
    ↓
Image decoded
    ↓
Layout
    ↓
Paint
    ↓
LCP candidate rendered
```

Any delay in this chain can move LCP later.

For example:

```text
slow HTML
→
late discovery
→
late request
→
late response
→
late decode
→
late paint
→
late LCP
```

---

# 8. Resource Discovery

The browser cannot request an image until it knows that the image exists.

This creates a fundamental distinction:

```text
image loading priority
```

versus:

```text
image discovery timing
```

If an image is discovered very late, giving it high priority later may not recover all the lost time.

Therefore:

> **Early discovery is often a prerequisite for effective prioritization.**

---

# 9. Direct HTML Image Discovery

Consider:

```html
<img src="/hero.webp" alt="Product">
```

The browser can discover this while parsing the document.

The image becomes part of the browser's resource scheduling process relatively early.

Compare this with an image whose URL only becomes known after:

```text
JavaScript executes
      ↓
component mounts
      ↓
data arrives
      ↓
image element appears
```

The second image may be discovered much later.

---

# 10. JavaScript-Delayed Discovery

Consider:

```text
HTML
 ↓
JavaScript
 ↓
fetch data
 ↓
render component
 ↓
create image
 ↓
request image
```

The image request is now dependent on several earlier steps.

If the image is the LCP candidate, this creates a waterfall.

Conceptually:

```text
HTML
  │
  ▼
JS download
  │
  ▼
JS execution
  │
  ▼
data fetch
  │
  ▼
image discovery
  │
  ▼
image request
```

This is generally worse than allowing the browser to discover a critical image earlier.

---

# 11. CSS Background Images

Images loaded through CSS can have different discovery characteristics.

For example:

```css
.hero {
  background-image: url("/hero.webp");
}
```

The browser may need to discover:

```text
HTML
→ CSS
→ CSS rule
→ background image
```

This can delay discovery compared with a directly represented content image.

This does not mean background images are always wrong.

They are appropriate for:

* decorative imagery
* visual backgrounds
* effects
* non-content visuals

But using a background image for the primary content image can complicate performance and semantics.

---

# 12. Critical Image Discovery Principle

For a critical image:

```text
critical resource
+
late discovery
=
avoidable latency
```

Therefore critical images should have a clear discovery path.

A useful architecture is:

```text
Server-rendered structure
        ↓
critical image URL known early
        ↓
browser discovers resource
        ↓
request starts early
```

---

# 13. Lazy Loading

Lazy loading means deferring the loading of resources until they are more likely to be needed.

For images below the fold:

```text
page starts
      ↓
critical images load
      ↓
user scrolls
      ↓
deferred image becomes relevant
      ↓
image loads
```

This prevents unnecessary initial network work.

The benefit is:

```text
less initial bandwidth
+
less connection contention
+
less decode work
+
less memory pressure
```

---

# 14. Why Lazy Loading Exists

Suppose a page contains:

```text
1 hero image
50 product images
20 recommendations
10 article thumbnails
```

If every image loads immediately:

```text
81 image requests
```

may compete for:

* network bandwidth
* browser scheduling
* decoding
* memory
* CPU

But if only the visible/near-visible images load:

```text
hero
+
visible content
+
near-viewport content
```

the initial workload becomes much smaller.

---

# 15. The Lazy-Loading Tradeoff

Lazy loading is not automatically good.

If an image is needed immediately but incorrectly marked for deferred loading:

```text
critical image
→
lazy
→
late request
→
late render
→
poor LCP
```

Therefore:

```text
lazy loading
```

should be applied to:

```text
non-critical resources
```

rather than indiscriminately.

---

# 16. Browser-Owned Lazy Loading

Modern browsers can support native lazy loading behavior through:

```html
<img loading="lazy">
```

The browser determines when to initiate the request based on its own heuristics and viewport context.

This is important because:

> Lazy loading is fundamentally a browser scheduling decision.

Application code should communicate intent rather than trying to manually recreate browser networking behavior.

---

# 17. Eager Loading

The opposite strategy is eager loading.

Conceptually:

```text
image needed now
→
request as soon as practical
```

This can be appropriate for:

* critical hero images
* important above-the-fold content
* known LCP candidates

But eager loading every image defeats the purpose of prioritization.

Therefore:

```text
eager ≠ universally better
```

---

# 18. Priority Is Not the Same as Eagerness

These concepts should not be collapsed.

### Eager loading

Controls whether loading is deferred.

### Priority

Communicates relative importance to the browser/network scheduler.

An image can be:

```text
eager + high importance
```

or:

```text
eager + lower importance
```

depending on the architecture.

The precise behavior depends on the browser and framework implementation.

---

# 19. Priority Is Relative

A browser is managing many resources:

```text
HTML
CSS
JavaScript
fonts
images
analytics
API requests
```

Image priority exists within this larger scheduling system.

Therefore:

```text
high image priority
```

does not mean:

```text
ignore everything else
```

It means the resource should receive stronger scheduling preference relative to competing resources.

---

# 20. Over-Prioritization

Suppose a page contains:

```text
10 images
```

and all are treated as critical.

Then:

```text
10 critical requests
```

compete for resources.

The result may be:

```text
priority inflation
```

where the system loses the benefit of distinguishing the truly important resource.

The correct principle is:

> **Priority should express scarcity.**

If everything is critical:

```text
nothing is meaningfully differentiated.
```

---

# 21. LCP and Priority

If the LCP element is an image, the architecture should answer:

```text
1. How is the image discovered?
2. When does its request start?
3. What representation is selected?
4. Is the request prioritized appropriately?
5. How quickly does the CDN respond?
6. How large is the response?
7. How expensive is decode?
8. When can the browser paint it?
```

This prevents the common mistake of treating LCP as merely:

```text
"make the image smaller"
```

---

# 22. LCP Request Waterfall

A slow LCP image can produce:

```text
Document
   ↓
CSS
   ↓
JavaScript
   ↓
image discovery
   ↓
image request
   ↓
image download
   ↓
decode
   ↓
paint
```

The optimization objective is to remove unnecessary dependencies.

For example:

```text
HTML
   ↓
early image discovery
   ↓
CDN request
   ↓
small appropriate representation
   ↓
decode
   ↓
paint
```

---

# 23. LCP Optimization Has Multiple Levers

For an image LCP candidate:

```text
LCP
├── discovery
├── connection
├── CDN/cache
├── request priority
├── representation size
├── transfer
├── decode
├── layout
└── paint
```

This means an LCP problem can originate from:

* slow server response
* poor cache hit
* late image discovery
* wrong loading strategy
* wrong image size
* excessive image bytes
* decode cost
* layout dependencies

---

# 24. Connection Establishment

The image request itself may require network setup.

Conceptually:

```text
DNS
 ↓
connection
 ↓
TLS
 ↓
request
 ↓
response
```

If the image comes from a separate origin, there may be additional connection setup.

Therefore image delivery architecture should consider:

```text
same-origin delivery
vs
separate image CDN
```

A separate CDN can improve global delivery while also introducing another network relationship.

The tradeoff depends on the infrastructure.

---

# 25. CDN Cache Hit and LCP

Suppose the image CDN has:

```text
cache HIT
```

The image may be served quickly from a nearby edge.

If it has:

```text
cache MISS
```

the request may require:

```text
edge
→
shield
→
origin
→
transformation
→
response
```

That additional path can materially affect LCP.

Therefore:

```text
LCP performance
```

can depend on:

```text
image cache architecture
```

even though this part focuses on loading rather than caching.

---

# 26. Request Priority vs Cache State

Priority does not eliminate origin latency.

Consider:

```text
high priority image
+
CDN cache miss
+
slow transformation
```

The request may begin immediately but still finish slowly.

Therefore:

```text
priority
≠
server performance
```

Likewise:

```text
CDN HIT
+
late discovery
```

can still produce poor LCP.

Therefore:

```text
request timing
+
delivery latency
```

must be optimized together.

---

# 27. Responsive Selection and Loading

Part 03 established:

```text
srcset
+
sizes
```

as the browser's responsive representation-selection mechanism.

Now connect it to loading:

```text
early discovery
      ↓
browser evaluates sizes/srcset
      ↓
selects candidate
      ↓
requests appropriate representation
```

A poor `sizes` value can cause the browser to select an unnecessarily large resource.

Therefore:

```text
loading optimization
```

cannot be separated completely from:

```text
responsive image architecture
```

---

# 28. Why `sizes` Matters for Performance

Suppose an image actually renders at:

```text
400 CSS px
```

but `sizes` communicates:

```text
100vw
```

on a wide desktop viewport.

The browser may choose a much larger candidate than necessary.

Result:

```text
larger transfer
→
longer download
→
later decode
→
potentially later LCP
```

Therefore:

```text
sizes
```

is part of loading performance.

---

# 29. Above-the-Fold Image Strategy

A common production strategy is:

```text
Primary visual
→
early discovery
→
appropriate responsive candidate
→
high scheduling importance
→
CDN cache
→
small enough representation
→
fast decode
```

Secondary images:

```text
secondary
→
normal loading
```

Below-the-fold:

```text
deferred/lazy
```

Decorative:

```text
lower priority
```

This creates a deliberate loading hierarchy.

---

# 30. Near-Viewport Loading

Lazy loading does not necessarily mean:

```text
wait until image is literally visible
```

Browsers may begin loading images before they enter the viewport.

This provides a buffer for:

```text
scroll
→
request
→
download
→
decode
```

The exact distance and scheduling are browser-controlled.

The architectural principle is:

> Deferred loading should preserve enough lead time for content to be ready when the user reaches it.

---

# 31. Infinite Scroll

Infinite scrolling introduces a different image-loading problem.

Suppose:

```text
20 images
```

are currently visible.

The user scrolls rapidly.

New images continuously enter the viewport.

A good system needs:

```text
near-viewport loading
+
bounded concurrency
+
virtualization where appropriate
+
appropriate responsive variants
+
memory management
```

Otherwise:

```text
scroll
→
hundreds of image requests
→
network pressure
→
decode pressure
→
memory growth
```

---

# 32. Image Memory Is Also a Loading Concern

Even if compressed files are small:

```text
100 KB network image
```

does not necessarily mean:

```text
100 KB memory usage
```

Decoded images can consume substantially more memory.

A rough conceptual relationship for an uncompressed raster image is:

```text
memory ≈ width × height × bytes-per-pixel
```

For an RGBA image:

```text
4 bytes/pixel
```

is a useful mental model.

Therefore:

```text
large decoded image
+
many simultaneously loaded images
=
memory pressure
```

---

# 33. Why Display Size Matters

Consider:

```text
2000 × 2000
```

image displayed at:

```text
200 × 200
```

The browser may need to decode a much larger pixel buffer than the displayed dimensions require.

Therefore responsive delivery is not merely a network optimization.

It can also reduce:

```text
decode cost
+
memory usage
+
rendering work
```

---

# 34. Decode Work

After downloading an image, the browser must decode it.

Conceptually:

```text
compressed bytes
      ↓
codec decode
      ↓
pixel representation
      ↓
render
```

Different formats can have different decode characteristics.

Therefore:

```text
smaller transfer
```

does not necessarily guarantee:

```text
lower total rendering cost
```

The full pipeline matters.

---

# 35. Async Decode vs Render Readiness

Browsers can perform image decoding asynchronously in ways that avoid unnecessarily blocking other work.

The important conceptual distinction is:

```text
downloaded
≠
decoded
≠
painted
```

An image can be:

```text
network complete
```

but still not be:

```text
visible
```

because decoding/layout/painting remain.

---

# 36. Image Loading and Main-Thread Work

Heavy image workloads can create CPU and memory pressure.

A page with many high-resolution images may experience:

```text
network pressure
+
decode pressure
+
memory pressure
+
layout/paint pressure
```

Therefore image optimization should be evaluated as a browser-system problem rather than simply a network problem.

---

# 37. Preload

For certain critical resources, browsers can be explicitly informed that a resource is important and should be discovered early.

Conceptually:

```html
<link rel="preload" as="image" ...>
```

This can reduce discovery delay.

But preload is powerful and should be used carefully.

If a resource is preloaded unnecessarily:

```text
unused preload
→
bandwidth wasted
→
competition with truly critical resources
```

Therefore:

> Preload should correspond to a known critical resource.

---

# 38. Preload and Duplicate Requests

A poorly configured preload can create a mismatch between:

```text
preload URL
```

and:

```text
actual image URL
```

If the browser does not consider them the same resource, the expected reuse may not happen.

Therefore preload identity must align with the actual requested representation.

This is another instance of:

```text
resource identity consistency
```

---

# 39. Preload and Responsive Images

Responsive image loading complicates preload because the browser may need to select among candidates.

Conceptually:

```text
viewport
+
DPR
+
sizes
+
srcset
```

determine the appropriate representation.

A preload strategy must therefore avoid forcing a representation that contradicts responsive selection.

The architectural principle is:

> Preload should accelerate the correct representation, not bypass responsive intelligence.

---

# 40. Next.js `<Image>` and Loading Strategy

The framework component can communicate image-loading intent through its API.

The important architectural distinction is:

```text
<Image>
```

does not mean:

```text
always eager
```

or:

```text
always lazy
```

The framework can generate the appropriate image markup and resource behavior based on configuration and browser capabilities.

The engineer must understand what intent is being expressed rather than treating `<Image>` as a magic performance switch.

---

# 41. Critical Image Configuration

For a critical image, evaluate:

```text
source
width/height
responsive candidates
sizes
loading behavior
priority/fetch importance
CDN delivery
format
quality
cache state
```

Do not optimize only one property.

For example:

```text
high priority
+
huge image
```

can simply make a very large request happen sooner.

---

# 42. The "Make It Priority" Anti-Pattern

Suppose LCP is slow.

A developer changes:

```text
priority = high
```

and stops.

But the image is:

```text
2.5 MB
```

and the CDN cache misses.

The request now starts earlier but remains expensive.

The correct debugging model is:

```text
LCP problem
→
identify bottleneck
→
optimize bottleneck
```

rather than:

```text
LCP problem
→
increase priority
```

---

# 43. The "Make Everything Lazy" Anti-Pattern

Another common mistake:

```text
all images
→
lazy
```

This can reduce initial work.

But if the primary hero image becomes lazy:

```text
hero
→
deferred
→
late discovery/request
→
late LCP
```

The optimization becomes a regression.

The correct rule is:

```text
critical image → early
non-critical image → deferred
```

---

# 44. The "Load Everything Immediately" Anti-Pattern

The opposite mistake:

```text
all images
→
eager
```

This can cause:

```text
network contention
decode contention
memory pressure
slower critical resources
```

A page with 100 images does not benefit from treating all 100 as equally important.

---

# 45. Critical Resource Budget

A production page has finite resources.

Think in terms of:

```text
critical resource budget
```

The browser has to prioritize:

```text
HTML
CSS
JS
fonts
critical image
```

If the page declares:

```text
20 critical images
```

the system has effectively destroyed prioritization.

Therefore:

> Criticality should be scarce.

---

# 46. Loading Strategy by Image Class

| Image class             | Typical strategy                     |
| ----------------------- | ------------------------------------ |
| LCP hero                | Early discovery + high importance    |
| Above-fold content      | Early/normal depending on importance |
| Near-viewport           | Deferred with sufficient lead time   |
| Below-fold gallery      | Lazy/deferred                        |
| Recommendations         | Deferred                             |
| Footer imagery          | Deferred                             |
| Decorative imagery      | Low priority                         |
| Hidden tab content      | Deferred until needed                |
| Modal imagery           | Load when modal becomes relevant     |
| Infinite-scroll content | Near-viewport/deferred               |

These are architectural defaults, not absolute rules.

---

# 47. Modal Images

Suppose an image is inside a modal:

```text
Page loads
→ modal closed
→ user clicks "View image"
→ modal opens
```

Loading the full-resolution image during initial page load may waste bandwidth.

Instead:

```text
modal intent
→
request high-resolution image
```

This is an example of:

```text
interaction-driven loading
```

The correct strategy depends on whether the interaction is highly predictable and latency-sensitive.

---

# 48. Gallery Architecture

A product gallery may contain:

```text
hero
+
thumbnails
+
10 alternate images
```

The loading strategy can differ:

```text
hero
→
critical

visible thumbnails
→
normal

future thumbnails
→
deferred

full-resolution zoom
→
on interaction
```

This avoids downloading expensive representations before they are useful.

---

# 49. Placeholder Strategy

Images can reserve layout space before the full representation arrives.

This helps prevent layout instability.

Conceptually:

```text
reserved dimensions
      ↓
placeholder
      ↓
image loads
      ↓
image replaces placeholder
```

Possible placeholder approaches include:

* solid color
* blurred preview
* low-resolution placeholder
* skeleton-like representation

The important principle is:

```text
loading experience
+
layout stability
```

are related but distinct concerns.

---

# 50. Placeholder Bytes Also Have a Cost

A placeholder is not free.

If every image receives a large placeholder:

```text
placeholder network traffic
+
actual image traffic
```

can increase total bytes.

Therefore placeholder strategy should consider:

```text
visual benefit
+
bytes
+
decode
+
cacheability
```

A tiny placeholder can sometimes provide most of the perceived benefit.

---

# 51. LCP and Placeholder Behavior

If the placeholder is painted first and the final image later:

```text
placeholder paint
→
final image paint
```

the final LCP timing still matters.

Do not assume:

```text
placeholder visible
=
LCP solved
```

The browser's LCP candidate semantics determine what ultimately counts.

The performance goal remains:

```text
meaningful final content
→
visible as early as practical
```

---

# 52. Image Loading Under Slow Networks

Consider a slow 3G-like environment.

A 2 MB image may take significantly longer to arrive.

A smaller responsive candidate:

```text
300 KB
```

may dramatically improve visual completion.

This demonstrates why:

```text
responsive selection
+
loading priority
```

must work together.

Priority cannot compensate indefinitely for excessive bytes.

---

# 53. Image Loading Under Fast Networks

On very fast networks:

```text
network transfer
```

may become less dominant.

Other bottlenecks can become more visible:

* decode
* JavaScript
* rendering
* layout
* main-thread contention
* server response

Therefore optimization should always be based on measurement.

---

# 54. Field Data vs Lab Data

Image loading should be evaluated using both:

### Lab data

Controlled conditions:

```text
Lighthouse
DevTools throttling
synthetic tests
```

Useful for:

* reproducibility
* regression testing
* controlled experiments

### Real-user data

Actual users:

```text
field performance
Core Web Vitals
real devices
real networks
real geographic conditions
```

Useful for:

* production reality
* device diversity
* network diversity
* regional behavior

A page that performs well in a desktop lab can behave differently on mobile networks.

---

# 55. Core Performance Metrics

Relevant image-loading metrics include:

```text
LCP
resource request start
resource response time
transfer size
decode time
image render timing
cache hit/miss
```

The exact instrumentation depends on the browser and observability stack.

The key is to correlate:

```text
image request
→
network
→
decode
→
paint
→
LCP
```

---

# 56. Production Debugging Workflow

When an image-based LCP is slow:

### Step 1 — Identify the LCP element

Is it actually an image?

### Step 2 — Identify discovery timing

When did the browser learn about the image?

### Step 3 — Identify request start

How long after navigation did the request begin?

### Step 4 — Identify cache status

Was it a browser/CDN hit or miss?

### Step 5 — Identify representation

What width/format/quality was selected?

### Step 6 — Identify response size

Was the image unnecessarily large?

### Step 7 — Identify decode

Was decoding expensive?

### Step 8 — Identify paint timing

When did the image actually become visible?

### Step 9 — Compare against other resources

Was CSS/JS/font work delaying the image?

---

# 57. Performance Waterfall Interpretation

A waterfall can reveal:

```text
late discovery
```

when the image request begins much later than navigation.

It can reveal:

```text
network contention
```

when many resources compete.

It can reveal:

```text
slow origin
```

when the response waits behind server processing.

It can reveal:

```text
large transfer
```

when download duration dominates.

It can reveal:

```text
decode/render delay
```

when network completion occurs significantly before visual completion.

---

# 58. Senior-Level Bottleneck Classification

When LCP is slow, classify the delay:

```text
LCP
├── TTFB/server delay
├── discovery delay
├── request scheduling delay
├── connection delay
├── CDN/origin delay
├── transfer delay
├── decode delay
├── render delay
└── layout/paint delay
```

Then optimize the dominant contributor.

This is much stronger than blindly changing image configuration.

---

# 59. Performance Architecture Matrix

| Problem                               | Primary lever                      |
| ------------------------------------- | ---------------------------------- |
| Image discovered late                 | Earlier representation/discovery   |
| Critical image deprioritized          | Loading priority                   |
| Non-critical images consume bandwidth | Lazy loading                       |
| Wrong candidate selected              | `sizes` / `srcset`                 |
| Image too large                       | Responsive sizing / transformation |
| CDN miss                              | Cache architecture                 |
| Origin transformation slow            | Delivery/cache strategy            |
| Decode expensive                      | Representation/size/format         |
| Too many simultaneous images          | Deferred loading                   |
| Memory pressure                       | Resolution/bounded loading         |
| Layout shift                          | Dimensions/aspect ratio            |
| LCP delayed                           | Optimize full image critical path  |

---

# 60. Four-Pillar Engineering Matrix

## Pillar 1 — Correctness

Ask:

* Is the intended image loaded?
* Is the correct responsive candidate selected?
* Is the LCP candidate identified correctly?
* Are placeholders replaced correctly?
* Is loading behavior consistent with user expectations?

---

## Pillar 2 — Performance

Ask:

* Is discovery early enough?
* Is the critical image prioritized appropriately?
* Are non-critical images deferred?
* Is the selected representation appropriately sized?
* Is CDN delivery fast?
* Is decode cost reasonable?

---

## Pillar 3 — Maintainability

Ask:

* Is loading strategy explicit?
* Can components communicate criticality?
* Are priority decisions centralized?
* Can engineers identify why an image is eager/lazy?
* Are image performance regressions testable?

---

## Pillar 4 — Scalability

Ask:

* What happens on pages with hundreds of images?
* What happens during infinite scrolling?
* What happens on low-memory devices?
* What happens when many images enter the viewport simultaneously?
* Does the architecture create excessive concurrent requests?

---

# 61. Prediction Challenges

### Challenge 1

A hero image is the LCP element.

It is marked lazy.

What happens?

**Expected reasoning:**

The browser may defer the image request, delaying the critical rendering path and potentially worsening LCP.

---

### Challenge 2

The hero image has high priority but is 3 MB.

What does priority solve?

**Expected reasoning:**

It can influence request scheduling, but it does not eliminate transfer, decode, or rendering cost.

---

### Challenge 3

The image CDN has a 99% cache hit rate.

The LCP image is still slow.

What should you investigate?

**Expected reasoning:**

Discovery timing, request priority, candidate size, network conditions, connection setup, decode, and paint—not merely CDN hit rate.

---

### Challenge 4

A page contains 80 images and every image is eager.

What can happen?

**Expected reasoning:**

The images can compete for network, decode, memory, and rendering resources, potentially harming critical content.

---

### Challenge 5

An image is discovered only after a client-side data fetch.

Why can this hurt LCP?

**Expected reasoning:**

The image request depends on earlier network and execution work, creating a waterfall before the browser can begin downloading the image.

---

### Challenge 6

An image is 400 CSS pixels wide but the browser downloads a 1600px candidate.

What should you investigate?

**Expected reasoning:**

The responsive image selection inputs, particularly `sizes`, `srcset`, DPR, and layout assumptions.

---

### Challenge 7

A placeholder appears instantly but the actual hero image takes two seconds.

Is LCP necessarily solved?

**Expected reasoning:**

No. The meaningful final content still needs to render, and LCP is based on qualifying content rather than simply the existence of a placeholder.

---

### Challenge 8

A below-the-fold gallery contains 100 images.

Should all 100 be loaded immediately?

**Expected reasoning:**

Usually no. Deferred loading and viewport-aware loading can reduce unnecessary initial network and rendering work.

---

# 62. Senior Interview Questions

### Question 1

> How would you optimize an image that is hurting LCP?

A strong answer should walk through:

```text
identify LCP
→
measure discovery
→
measure request start
→
check priority
→
check cache
→
check representation size
→
check transfer
→
check decode
→
check paint
```

---

### Question 2

> Why can lazy loading hurt performance?

Because the image may be important to the initial experience.

If a critical image is deferred:

```text
late request
→
late render
→
late LCP
```

---

### Question 3

> Why isn't image priority enough?

Because:

```text
priority
```

only affects scheduling.

It does not eliminate:

```text
large bytes
CDN misses
origin latency
decode
paint
```

---

### Question 4

> What is the relationship between `sizes` and performance?

`sizes` helps the browser estimate the rendered width and therefore select an appropriate responsive candidate.

Incorrect `sizes` can cause over-downloading.

---

### Question 5

> How do you handle pages with hundreds of images?

Discuss:

```text
lazy loading
near-viewport loading
responsive candidates
bounded concurrency
virtualization where appropriate
memory management
prioritization
interaction-driven loading
```

---

# 63. Anti-Patterns

## Anti-Pattern 1 — Everything Is Priority

```text
every image
→
high priority
```

Result:

```text
priority loses meaning
```

---

## Anti-Pattern 2 — Everything Is Lazy

Result:

```text
critical images are delayed
```

---

## Anti-Pattern 3 — Everything Is Eager

Result:

```text
network contention
memory pressure
decode contention
```

---

## Anti-Pattern 4 — Fixing LCP Only With Priority

Result:

```text
large image remains large
CDN miss remains a miss
decode remains expensive
```

---

## Anti-Pattern 5 — Ignoring Discovery

A critical image can have perfect priority configuration but still start late because the browser does not discover it early.

---

## Anti-Pattern 6 — Ignoring `sizes`

Incorrect responsive assumptions can cause unnecessary downloads.

---

## Anti-Pattern 7 — Loading Full-Resolution Images for Thumbnails

Result:

```text
excess bytes
excess decode
excess memory
```

---

## Anti-Pattern 8 — Loading Hidden Interaction Content Immediately

For example:

```text
closed modal
→
full-resolution image loaded anyway
```

This can waste bandwidth.

---

# 64. The Complete Image Loading Model

The browser's image lifecycle can be represented as:

```text
                 IMAGE INTENT
                      │
                      ▼
              Resource Discovery
                      │
                      ▼
             Candidate Selection
             srcset + sizes + DPR
                      │
                      ▼
               Load Strategy
             eager / lazy / deferred
                      │
                      ▼
                Scheduling
                      │
                      ▼
               Network Request
                      │
                      ▼
                 CDN / Origin
                      │
                      ▼
                 Transfer
                      │
                      ▼
                  Decode
                      │
                      ▼
                   Layout
                      │
                      ▼
                    Paint
                      │
                      ▼
               Visual Completion
                      │
                      ▼
                     LCP
```

Every stage can become the bottleneck.

---

# 65. The Most Important Invariants

### Invariant 1

```text
discovered late ≠ fixed by priority alone
```

### Invariant 2

```text
downloaded ≠ decoded
```

### Invariant 3

```text
decoded ≠ painted
```

### Invariant 4

```text
priority ≠ smaller image
```

### Invariant 5

```text
lazy loading ≠ universally better
```

### Invariant 6

```text
eager loading ≠ universally better
```

### Invariant 7

```text
criticality should be scarce
```

### Invariant 8

```text
LCP ≠ image download time alone
```

### Invariant 9

```text
responsive selection affects loading cost
```

### Invariant 10

```text
cache performance and loading performance interact
```

### Invariant 11

```text
above-the-fold ≠ automatically critical
```

### Invariant 12

```text
small network bytes ≠ zero rendering cost
```

---

# 66. Completion Checklist

You should be able to explain:

### Loading Fundamentals

* [ ] critical vs non-critical images
* [ ] image discovery
* [ ] eager loading
* [ ] lazy loading
* [ ] deferred loading
* [ ] browser scheduling

### Priority

* [ ] relative request priority
* [ ] priority scarcity
* [ ] over-prioritization
* [ ] relationship between priority and network contention

### LCP

* [ ] LCP mental model
* [ ] image LCP lifecycle
* [ ] discovery delay
* [ ] request delay
* [ ] transfer delay
* [ ] decode delay
* [ ] paint delay

### Responsive Loading

* [ ] `srcset`
* [ ] `sizes`
* [ ] DPR
* [ ] candidate selection
* [ ] avoiding oversized downloads

### Browser Cost

* [ ] decode
* [ ] memory
* [ ] CPU
* [ ] layout
* [ ] paint
* [ ] large image concurrency

### Production

* [ ] CDN interaction
* [ ] cache hit/miss impact
* [ ] preload
* [ ] critical image strategy
* [ ] infinite-scroll loading
* [ ] modal/interaction-driven loading
* [ ] field vs lab performance
* [ ] waterfall debugging

---

# 67. Final Mental Model

The senior-level model is:

```text
                 USER EXPERIENCE
                       │
                       ▼
                    LCP
                       │
                       ▼
                 IMAGE PAINT
                       │
                       ▼
                    DECODE
                       │
                       ▼
                   TRANSFER
                       │
                       ▼
                REQUEST START
                       │
                       ▼
              RESOURCE DISCOVERY
                       │
                       ▼
                 PAGE ARCHITECTURE
```

The optimization strategy is therefore:

```text
1. Identify whether the image is critical.
2. Make critical images discoverable early.
3. Give critical resources appropriate priority.
4. Defer non-critical images.
5. Select the correct responsive representation.
6. Deliver through an efficient cache/CDN path.
7. Minimize unnecessary bytes.
8. Control decode and memory cost.
9. Measure actual rendering and LCP.
10. Optimize the measured bottleneck.
```

The deepest principle is:

> **Image loading performance is a scheduling problem across the browser, network, CDN, rendering pipeline, and application architecture—not simply a problem of reducing image file size.**

And the complete invariant is:

```text
Critical image
      ↓
Early discovery
      ↓
Correct candidate
      ↓
Appropriate priority
      ↓
Fast delivery
      ↓
Efficient decode
      ↓
Stable layout
      ↓
Fast meaningful paint
      ↓
Good LCP
```

**Part 06 complete.**
