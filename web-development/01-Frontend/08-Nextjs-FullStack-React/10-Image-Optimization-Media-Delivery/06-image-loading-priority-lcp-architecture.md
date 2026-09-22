# Level 08 — Next.js & Full-Stack React

## KPI 10 — Image Optimization

# Part 06 — Image Loading, Priority, Lazy Loading & LCP Architecture

---

## 1. Part Objective

This part focuses on **when and how the browser should discover, request, download, decode, and render images**.

Part 05 established the delivery system:

```text
Image
  ↓
Transformation
  ↓
CDN
  ↓
Cache
  ↓
Browser
```

This part begins where the browser receives responsibility for deciding **when an image enters the critical rendering path**.

The central question is not:

> “Should images be lazy-loaded?”

The senior-level question is:

> **Which images are critical to the current user experience, and how should the browser prioritize each image without wasting bandwidth or delaying more important work?**

The image lifecycle can be modeled as:

```text
DOM / HTML Discovery
        ↓
Resource Selection
        ↓
Request Scheduling
        ↓
Network Transfer
        ↓
Decode
        ↓
Layout
        ↓
Paint
        ↓
Largest Contentful Paint / Visual Completion
```

Image performance therefore depends on much more than image file size.

---

# 2. Core Image Loading Mental Model

A browser does not simply execute:

```text
<img>
↓
download
↓
display
```

The real system is closer to:

```text
HTML / DOM
    ↓
Image discovered
    ↓
Candidate selected
    ↓
Request prioritized
    ↓
Network scheduling
    ↓
Bytes downloaded
    ↓
Image decoded
    ↓
Layout calculated
    ↓
Image painted
    ↓
Potentially becomes LCP
```

Each stage can become the bottleneck.

For example:

```text
small image
+
late discovery
=
slow LCP
```

while:

```text
large image
+
early discovery
+
excellent cache
```

may still be acceptable depending on the user's connection and rendering context.

Therefore:

```text
image performance
≠
file size alone
```

---

# 3. The Critical Rendering Path

A page may contain:

```text
Logo
Hero image
Navigation icons
Product thumbnails
Recommendations
Footer images
Decorative backgrounds
```

They do not all deserve equal priority.

A simplified priority model is:

```text
Critical
   ↓
Important
   ↓
Deferred
   ↓
Non-critical
```

For example:

```text
Hero image
    → critical

Above-the-fold product image
    → important

Below-the-fold product grid
    → deferred

Footer decoration
    → low priority
```

The objective is:

```text
critical resources
→ available early

non-critical resources
→ do not compete with critical work
```

---

# 4. What Is LCP?

**Largest Contentful Paint (LCP)** measures when the largest relevant content element becomes rendered in the viewport.

An image can become the LCP element.

For example:

```text
Page
 ├── Header
 ├── Hero Image  ← LCP
 ├── Text
 └── Product Grid
```

If the hero image is discovered late or downloaded too slowly:

```text
LCP ↑
```

Therefore image architecture frequently has a direct relationship with LCP.

---

# 5. LCP Is Not Simply Image Download Time

Suppose:

```text
Image request begins at 100ms
Download completes at 900ms
Decode completes at 950ms
Paint occurs at 1000ms
```

Then:

```text
request time
≠
download completion
≠
decode completion
≠
paint time
```

The user-visible result occurs later than network completion.

Therefore optimization must consider:

```text
discovery
+
network
+
decode
+
layout
+
paint
```

---

# 6. Image Discovery

A browser can only prioritize a resource after it discovers it.

This creates a critical distinction:

```text
high priority
```

is not equivalent to:

```text
early discovery
```

Consider:

```text
HTML
 ↓
JavaScript executes
 ↓
component mounts
 ↓
image element created
 ↓
browser discovers image
 ↓
request starts
```

The image may be important, but discovery itself was delayed.

Compare that with:

```text
HTML
 ↓
image discovered immediately
 ↓
request starts early
```

The second architecture gives the browser more time to fetch the image.

---

# 7. Early Discovery Matters

Suppose the hero image is hidden behind a client-side rendering path.

Timeline:

```text
0ms     HTML arrives
200ms   JS downloads
400ms   JS executes
450ms   image element appears
460ms   image request starts
900ms   image finishes
950ms   image paints
```

The image lost:

```text
0ms → 450ms
```

before the network request even began.

This is why rendering architecture and image loading strategy are connected.

---

# 8. Server Rendering and Image Discovery

Server-rendered HTML can allow the browser to discover important images earlier.

Conceptually:

```text
Server
 ↓
HTML containing image
 ↓
Browser discovers image
 ↓
Request starts
```

This can be advantageous for critical images.

A client-only architecture may instead require:

```text
HTML shell
 ↓
JavaScript
 ↓
component rendering
 ↓
image discovery
```

The important point is not:

> “Server rendering is always faster.”

The correct question is:

> **When can the browser discover the critical image?**

---

# 9. Streaming and Image Discovery

Streaming introduces another dimension.

Suppose a page streams:

```text
Shell
 ↓
Header
 ↓
Hero
 ↓
Recommendations
 ↓
Footer
```

If the hero image is in the streamed content, its discovery timing depends on when that portion of the HTML reaches the browser.

Therefore:

```text
streaming architecture
→
resource discovery timing
```

must be considered together.

A critical hero should not accidentally become dependent on a very late stream segment.

---

# 10. Critical Images

A critical image usually satisfies one or more of:

* visible immediately
* above the fold
* likely LCP
* essential to understanding the page
* required for immediate interaction
* part of primary content

Examples:

```text
Homepage hero
Product primary image
Article lead image
Dashboard visualization immediately visible
```

These deserve deliberate loading behavior.

---

# 11. Non-Critical Images

Examples:

```text
Footer logos
Below-the-fold cards
Recommendation carousels
Hidden tabs
Collapsed sections
Decorative illustrations
```

Loading all of them immediately can create competition for:

```text
bandwidth
connections
CPU
memory
decode work
```

Therefore:

```text
non-critical image
→
defer when practical
```

---

# 12. Lazy Loading

Lazy loading means postponing image loading until the image is likely to be needed.

Conceptually:

```text
Page loads
 ↓
Viewport contains hero
 ↓
Hero loads immediately

Below-fold image
 ↓
not yet needed
 ↓
defer

User scrolls
 ↓
image approaches viewport
 ↓
load image
```

This reduces unnecessary initial work.

---

# 13. Why Lazy Loading Exists

Imagine a page containing:

```text
100 images
```

but only:

```text
6 images
```

are visible initially.

Downloading all 100 immediately can waste:

```text
bandwidth
network requests
memory
CPU
decode time
```

Lazy loading lets the browser focus on the current viewport.

---

# 14. Lazy Loading Is Not a Universal Optimization

A common mistake is:

```text
lazy-load everything
```

This can hurt LCP.

If the hero image is lazy-loaded:

```text
critical image
 ↓
wait for lazy-loading condition
 ↓
request delayed
 ↓
LCP delayed
```

Therefore:

```text
critical image
→
do not treat like a distant below-fold image
```

The loading strategy must follow content importance.

---

# 15. Browser Scheduling

The browser manages many competing resources:

```text
HTML
CSS
JavaScript
fonts
images
analytics
XHR/fetch
videos
```

The browser decides how to schedule network work.

Your application can influence resource importance through appropriate HTML and framework behavior, but it does not fully control the browser's scheduler.

Therefore:

```text
developer intent
≠
guaranteed network ordering
```

The architecture should communicate priority correctly rather than trying to micromanage the browser.

---

# 16. Priority Is Relative

Priority should be understood comparatively.

For example:

```text
Hero image
   >
Below-fold thumbnail
```

does not mean:

```text
Hero image must block every other resource.
```

It means:

```text
hero image is more important to the immediate visual experience.
```

The browser still needs to download:

* HTML
* CSS
* required JavaScript
* fonts
* other critical resources

Therefore excessive prioritization can become counterproductive.

---

# 17. Over-Prioritization

Suppose a page has:

```text
20 images
```

and the application marks:

```text
all 20 as critical
```

The priority signal loses meaning.

You have effectively created:

```text
20 competing critical resources
```

This can produce:

```text
bandwidth contention
```

instead of better performance.

Therefore:

> Priority is valuable precisely because it is selective.

---

# 18. Hero Image Architecture

A typical hero image pipeline is:

```text
Route
 ↓
Server-rendered HTML
 ↓
Hero <Image>
 ↓
Early browser discovery
 ↓
Responsive candidate selection
 ↓
High-priority request
 ↓
CDN
 ↓
Cached representation
 ↓
Download
 ↓
Decode
 ↓
Paint
 ↓
LCP
```

The system should minimize unnecessary work between:

```text
HTML arrival
```

and:

```text
image request
```

---

# 19. Hero Image and Responsive Images

A hero image still needs responsive behavior.

For example:

```text
Mobile
→ 640px representation

Tablet
→ 1024px representation

Desktop
→ 1440px representation
```

The goal is not:

```text
always download largest image
```

The goal is:

```text
download an appropriate representation
for the actual rendered size and device.
```

Therefore:

```text
priority
+
responsive selection
```

must work together.

---

# 20. Priority Does Not Mean Largest Image

A common misconception is:

> “The hero is important, so send the highest-resolution image.”

Incorrect.

A critical image can still be optimized for the user's actual display.

For example:

```text
Mobile viewport
+
hero rendered at 390 CSS px
+
DPR 2
```

does not necessarily justify sending:

```text
2400px-wide image
```

The correct strategy is:

```text
critical
+
appropriately sized
```

not:

```text
critical
+
maximum size
```

---

# 21. Image Preloading

Preloading can tell the browser that a resource is important and should be discovered early.

Conceptually:

```text
HTML
 ↓
preload signal
 ↓
image request
```

This can be useful when the browser would otherwise discover a critical resource too late.

But preloading introduces a cost:

```text
preload
→
network work begins earlier
```

If the resource is not actually critical, preload can steal bandwidth from more important work.

Therefore:

```text
preload
= deliberate critical-path decision
```

not a generic optimization.

---

# 22. Preload and Duplicate Requests

An incorrectly configured preload can cause redundant work.

For example:

```text
Preload URL
≠
Image URL
```

from the browser's perspective.

If the preload does not match the eventual image request correctly, the browser may not reuse it as intended.

Therefore preloading must be aligned with:

* exact resource identity
* responsive behavior
* relevant request characteristics
* eventual image request

The principle is:

```text
preload identity
=
eventual resource identity
```

---

# 23. Fetch Priority Concepts

Modern browsers can receive hints about resource importance.

Conceptually:

```text
high
medium
low
```

The important distinction is:

```text
priority hint
≠
hard scheduling command
```

The browser retains final control.

Therefore a senior engineer should treat priority as:

```text
browser scheduling guidance
```

rather than deterministic execution order.

---

# 24. Priority and HTTP/2 / HTTP/3

Network protocols also influence resource delivery.

Modern web delivery can multiplex resources over a connection.

Conceptually:

```text
Connection
 ├── HTML
 ├── CSS
 ├── JS
 ├── image A
 ├── image B
 └── font
```

The browser and networking stack coordinate resource delivery.

Therefore image priority must be considered alongside:

```text
connection reuse
multiplexing
bandwidth
latency
server behavior
```

The frontend engineer should not assume:

```text
one resource
=
one independent connection
```

---

# 25. Bandwidth Contention

Suppose:

```text
5 MB JavaScript
+
2 MB hero image
+
10 × 500 KB thumbnails
```

are all competing for limited bandwidth.

If all images load immediately:

```text
total bandwidth demand ↑
```

The hero may compete with resources needed to render the page itself.

Therefore image optimization includes **resource competition**.

A useful mental model is:

```text
Initial bandwidth budget
        ↓
Critical HTML/CSS/JS
        ↓
Critical images
        ↓
Secondary images
        ↓
Deferred content
```

---

# 26. Connection Latency Matters

A user on a high-latency network can experience a large delay even when the image itself is not large.

For example:

```text
request discovery
+
connection latency
+
server latency
+
CDN latency
+
transfer
```

Therefore:

```text
small image
```

does not automatically mean:

```text
fast image
```

If the request starts late, latency can dominate.

---

# 27. CDN Cache Hit and Critical Images

Part 05 established:

```text
CDN cache hit
→
faster delivery
```

For an LCP image this becomes particularly important.

A typical critical path might be:

```text
HTML
 ↓
hero discovered
 ↓
CDN cache HIT
 ↓
image downloaded
 ↓
decode
 ↓
paint
```

Compared with:

```text
HTML
 ↓
hero discovered
 ↓
CDN MISS
 ↓
origin
 ↓
transformation
 ↓
cache
 ↓
image
 ↓
decode
 ↓
paint
```

The second path contains additional latency.

---

# 28. Image Decode

Downloading bytes does not mean the image is immediately ready for display.

The browser may need to:

```text
download
 ↓
parse
 ↓
decode
 ↓
allocate memory
 ↓
render
```

Large images can therefore create CPU and memory costs.

A common optimization is:

```text
avoid downloading far more pixels
than the displayed image requires.
```

---

# 29. Pixel Cost

Suppose an image is:

```text
4000 × 3000
```

That is:

```text
12,000,000 pixels
```

If it is rendered at:

```text
400 × 300
```

the browser may be processing dramatically more pixel data than the UI needs.

Therefore:

```text
network optimization
+
pixel optimization
```

both matter.

This reinforces the Part 01 invariant:

```text
image performance
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

---

# 30. Memory Pressure

Images consume decoded memory.

A page with many large images can create:

```text
memory pressure
```

especially on mobile devices.

This can result in:

* slower rendering
* resource eviction
* browser memory pressure
* degraded scrolling
* crashes in extreme cases

Therefore lazy loading also acts as a memory-management strategy.

---

# 31. Viewport-Based Loading

A common strategy is:

```text
Viewport
   ↓
Current images
   ↓
Load

Near viewport
   ↓
Prepare/load soon

Far below viewport
   ↓
Defer
```

The exact threshold should account for:

* scroll velocity
* network speed
* image size
* user behavior
* device performance

The browser's native lazy-loading behavior can often handle much of this automatically.

---

# 32. Loading Too Late

There is a difference between:

```text
lazy
```

and:

```text
late
```

An image should not be deferred so aggressively that it becomes visible before its request has enough time to complete.

For a scrolling feed:

```text
user scrolls rapidly
 ↓
image becomes visible
 ↓
request begins too late
 ↓
blank/placeholder
 ↓
image arrives later
```

Therefore loading thresholds need to provide enough lead time.

---

# 33. Loading Too Early

The opposite problem:

```text
100 below-fold images
 ↓
all downloaded during initial page load
```

causes:

```text
bandwidth waste
CPU work
memory pressure
network competition
```

Therefore the system must balance:

```text
too early
```

against:

```text
too late.
```

---

# 34. Image Galleries

A gallery requires more deliberate scheduling.

Example:

```text
Main image
Thumbnail strip
10 additional images
Zoom images
Related products
```

A reasonable strategy may be:

```text
Current main image
→ highest importance

Nearby thumbnails
→ moderate

Next likely image
→ opportunistic preload

Far images
→ lazy

High-resolution zoom asset
→ load on interaction
```

The architecture should follow expected user behavior.

---

# 35. Image Carousels

For a carousel:

```text
Slide 1 → visible
Slide 2 → likely next
Slide 3 → possible
Slide 4 → unlikely
```

A sensible strategy may be:

```text
Slide 1
→ immediate

Slide 2
→ preload/lazy-nearby

Slide 3+
→ defer
```

This reduces initial work while preserving interaction responsiveness.

---

# 36. Interaction-Driven Images

Some images are only needed after an interaction:

```text
Open modal
 ↓
large image
```

or:

```text
Click zoom
 ↓
high-resolution image
```

There is no reason to download the full-resolution asset before the user asks for it unless analytics and UX requirements justify prefetching.

Therefore:

```text
interaction boundary
→
resource loading boundary
```

can be intentionally aligned.

---

# 37. Placeholder Strategy

Images may use placeholders while the final resource loads.

Examples include:

```text
solid placeholder
blur placeholder
low-resolution preview
skeleton
```

The goal is to reduce perceived instability.

However a placeholder does not eliminate the need to optimize:

```text
actual image discovery
actual image download
actual image decode
```

A beautiful placeholder with a slow LCP image is still a slow image architecture.

---

# 38. Placeholder and CLS

The image container should preserve the expected layout dimensions.

For example:

```text
Known aspect ratio
 ↓
reserve space
 ↓
image arrives
 ↓
content remains positioned
```

Without reserved space:

```text
placeholder
 ↓
image loads
 ↓
layout expands
 ↓
content shifts
```

This can contribute to layout instability.

Therefore:

```text
loading strategy
+
layout reservation
```

must work together.

---

# 39. LCP and CLS Are Different Problems

An image can cause:

```text
LCP problem
```

because it loads too slowly.

Another image can cause:

```text
layout shift
```

because its dimensions were not reserved.

A single image can cause both.

Therefore image performance must evaluate multiple user-experience dimensions.

---

# 40. Priority + Cache + Responsive Images

The complete critical image model is:

```text
Critical image
      ↓
Early discovery
      ↓
Correct candidate selection
      ↓
Appropriate priority
      ↓
CDN cache
      ↓
Efficient transfer
      ↓
Decode
      ↓
Paint
      ↓
LCP
```

Every stage matters.

A failure at any stage can dominate the final result.

---

# 41. Next.js `<Image>` and Loading Architecture

Next.js `<Image>` participates in the image delivery architecture established in earlier parts.

The application controls concepts such as:

```text
source
dimensions
fill
sizes
loading strategy
priority-related behavior
```

while the browser ultimately controls:

```text
resource scheduling
candidate selection
network behavior
decode
paint
```

Therefore:

```text
Next.js configuration
+
HTML semantics
+
browser behavior
```

must be understood as one system.

---

# 42. Server Components and Image Loading

A Server Component can produce the HTML needed for an image.

But the Server Component does not:

```text
download image
decode image
paint image
```

The browser does that.

The server's role is primarily:

```text
generate representation
→
send image information
→
allow browser discovery
```

This distinction is important when debugging performance.

---

# 43. Streaming and Critical Images

Suppose:

```text
Hero
```

is placed inside a slow asynchronous subtree.

Even though it is visually critical, it may not be sent early.

Therefore:

```text
criticality
```

must influence:

```text
component placement
streaming boundaries
data dependencies
```

A critical image should not accidentally inherit an unnecessary server-side delay.

---

# 44. Data Dependency and Image Delay

Suppose a hero image URL requires:

```text
database request
+
CMS request
+
user profile request
```

before it can be generated.

Then:

```text
data waterfall
 ↓
image discovery delay
 ↓
image request delay
 ↓
LCP delay
```

Therefore image performance can be affected by application data architecture.

The correct optimization may not be:

```text
compress image more
```

It may be:

```text
remove the data dependency delaying image discovery.
```

---

# 45. Critical Image Architecture

For a high-value landing page:

```text
Request
 ↓
Server rendering
 ↓
Critical HTML
 ↓
Hero image discovered early
 ↓
Correct responsive candidate
 ↓
CDN cache
 ↓
High relative priority
 ↓
Transfer
 ↓
Decode
 ↓
Paint
```

The page should avoid:

```text
critical hero
 ↓
client JS
 ↓
API request
 ↓
component mount
 ↓
image discovery
```

unless that architecture is actually necessary.

---

# 46. Production Scenario — Slow LCP

Suppose RUM reports:

```text
LCP = 4.2s
```

and the LCP element is the hero image.

Do not immediately assume:

```text
image too large
```

Investigate:

```text
1. When was the image discovered?
2. When did the request start?
3. Was the CDN a hit?
4. Which candidate was selected?
5. How many bytes were transferred?
6. Was the image transformed?
7. How long did transfer take?
8. How long did decode take?
9. Was the image blocked by other resources?
10. Was the hero behind a rendering/data waterfall?
```

This is the senior debugging model.

---

# 47. Production Scenario — Hero Is Lazy-Loaded

Symptoms:

```text
HTML fast
CSS fast
JS fast
LCP slow
```

DevTools shows:

```text
hero request starts late
```

Likely investigation:

```text
hero marked lazy
```

or:

```text
hero discovered only after client rendering
```

The solution is not necessarily to make the image larger or smaller.

The first issue is:

```text
critical-path scheduling.
```

---

# 48. Production Scenario — Everything Is High Priority

Suppose engineers mark:

```text
20 images
```

as critical.

Metrics worsen.

Why?

Because:

```text
priority signal
```

is no longer selective.

Possible result:

```text
critical image
+
critical image
+
critical image
+
...
```

competing for limited bandwidth.

The solution is to classify resources by actual user-visible importance.

---

# 49. Production Scenario — Fast CDN, Slow LCP

Suppose:

```text
CDN latency = low
cache hit rate = 99%
```

but:

```text
LCP = poor
```

Investigate:

```text
image discovery
candidate selection
image dimensions
decoded pixel count
browser scheduling
main-thread contention
layout
paint
```

This demonstrates:

```text
CDN performance
≠
complete browser performance.
```

---

# 50. Production Scenario — Mobile Regression

Desktop:

```text
LCP = 1.8s
```

Mobile:

```text
LCP = 4.8s
```

Potential causes:

```text
desktop candidate selected appropriately
mobile receives oversized candidate
```

or:

```text
mobile network bandwidth
```

or:

```text
mobile CPU decode cost
```

or:

```text
late discovery
```

Therefore always inspect the actual selected image representation.

---

# 51. Performance Budget

A production image strategy should define budgets.

Examples:

```text
Hero image:
maximum transfer budget

Above-the-fold images:
maximum aggregate transfer

Below-the-fold:
lazy-load policy

LCP:
target threshold

Image dimensions:
reasonable pixel budget
```

The exact numbers depend on the product and user population.

The important principle is:

```text
performance
→
measurable engineering constraint
```

rather than an informal goal.

---

# 52. RUM Is Essential

Synthetic testing is useful, but image performance varies by:

```text
device
network
region
cache state
viewport
DPR
browser
```

Real User Monitoring can expose:

```text
LCP distribution
image load timing
connection conditions
device categories
regional differences
```

Therefore production image optimization should use real-user data.

---

# 53. Synthetic Testing

Synthetic tests are useful for:

```text
repeatability
regression detection
controlled comparison
CI checks
```

For example:

```text
Before:
LCP = 2.1s

After:
LCP = 1.7s
```

But synthetic tests may not represent all production users.

Therefore:

```text
Synthetic
+
RUM
```

is stronger than either alone.

---

# 54. Debugging Workflow

When an image is slow:

```text
Step 1
Identify whether image is LCP.

Step 2
Check discovery time.

Step 3
Check request start time.

Step 4
Check selected candidate.

Step 5
Check CDN cache status.

Step 6
Check transfer size.

Step 7
Check transformation latency.

Step 8
Check decode/render timing.

Step 9
Check layout stability.

Step 10
Compare RUM against synthetic data.
```

This avoids random optimization.

---

# 55. Four-Pillar Engineering Matrix

| Dimension    | Core Concern                         | Senior-Level Question                              |
| ------------ | ------------------------------------ | -------------------------------------------------- |
| Mental Model | Discovery → request → decode → paint | Where is the critical-path delay?                  |
| Mechanics    | Loading, priority, lazy behavior     | When does the browser actually request this image? |
| Architecture | Critical vs deferred resources       | Which images deserve bandwidth first?              |
| Operations   | LCP/RUM/performance budgets          | Is the strategy improving real users' experience?  |

---

# 56. Prediction Challenges

### Challenge 1

A hero image is:

```text
5 KB
```

but its request starts:

```text
2 seconds after navigation
```

Can it still produce poor LCP?

---

### Challenge 2

A hero image is:

```text
2 MB
```

but is discovered immediately and served from a nearby CDN cache.

Is it automatically acceptable?

---

### Challenge 3

You lazy-load every image on the page.

What happens if the LCP image is below the lazy-loading threshold?

---

### Challenge 4

You preload five images.

What happens to bandwidth competition?

---

### Challenge 5

The CDN reports:

```text
99% cache hit
```

but mobile LCP worsens.

Which browser-side factors would you inspect?

---

### Challenge 6

The correct responsive image is selected, but decode time is very high.

What does that tell you?

---

### Challenge 7

A critical image is rendered only after a slow Server Component data dependency resolves.

Is image compression the first thing you should optimize?

---

# 57. Senior Interview Gotchas

### Gotcha 1

**“Lazy loading improves image performance.”**

Only when applied to images that are actually appropriate to defer.

---

### Gotcha 2

**“Priority guarantees the image loads first.”**

No. Priority is guidance to the browser.

---

### Gotcha 3

**“Preload every important image.”**

Over-preloading can create bandwidth competition.

---

### Gotcha 4

**“LCP is image download time.”**

No.

LCP is a rendering milestone. Image download is only one component.

---

### Gotcha 5

**“A smaller image always produces better LCP.”**

Not necessarily.

Late discovery or poor scheduling can dominate.

---

### Gotcha 6

**“CDN hit means LCP is solved.”**

No.

Browser discovery, candidate selection, transfer, decode, layout, and paint still matter.

---

### Gotcha 7

**“Server Components render the image.”**

The server generates the page representation; the browser downloads, decodes, and paints the image.

---

# 58. Core Invariants

Memorize these:

```text
image discovery time
≠
image download time
```

```text
download completion
≠
decode completion
```

```text
decode completion
≠
paint completion
```

```text
lazy loading
≠
always better
```

```text
priority
≠
guaranteed ordering
```

```text
critical image
→
early discovery
+
appropriate representation
+
appropriate priority
```

```text
CDN hit
≠
complete image performance
```

```text
smaller bytes
≠
automatically better LCP
```

```text
critical path
→
must be designed as a system
```

---

# 59. Completion Checklist

You should be able to explain:

* [ ] Image loading lifecycle
* [ ] Critical rendering path
* [ ] Image discovery
* [ ] LCP
* [ ] Critical vs non-critical images
* [ ] Lazy loading
* [ ] Risks of over-lazy-loading
* [ ] Browser scheduling
* [ ] Resource priority
* [ ] Priority vs guaranteed ordering
* [ ] Image preloading
* [ ] Preload identity
* [ ] Fetch-priority concepts
* [ ] Bandwidth contention
* [ ] CDN cache interaction with LCP
* [ ] Image decode cost
* [ ] Pixel cost
* [ ] Memory pressure
* [ ] Viewport-based loading
* [ ] Gallery loading
* [ ] Carousel loading
* [ ] Interaction-driven loading
* [ ] Placeholder strategy
* [ ] CLS relationship
* [ ] Streaming and image discovery
* [ ] Server rendering and image discovery
* [ ] Data waterfalls delaying image discovery
* [ ] Performance budgets
* [ ] RUM
* [ ] Synthetic testing
* [ ] Image performance debugging
* [ ] LCP production diagnosis

---

# 60. Part Boundary

This part establishes:

```text
Image Loading
+
Critical Path
+
Priority
+
Lazy Loading
+
LCP
+
Browser Scheduling
```

It does **not** deeply cover:

```text
image accessibility
alt semantics
complex image descriptions
captions
CMS accessibility metadata
SVG semantics
```

Those belong to:

> **KPI 10 — Part 07: Image Accessibility, Semantics & Content Architecture**

It also does not replace Part 05's CDN/cache architecture.

The progression remains:

```text
Part 04
Formats / Compression / Transformation
        ↓
Part 05
CDN / Caching / Invalidation / Delivery
        ↓
Part 06
Loading / Priority / Lazy Loading / LCP
        ↓
Part 07
Accessibility / Semantics / Content
        ↓
Part 08
Security / Remote Sources / Abuse Prevention
```

---

# Final Mental Model

At senior level, image loading should be understood as:

```text
Page Architecture
      ↓
Image Discovery
      ↓
Candidate Selection
      ↓
Priority
      ↓
Network Scheduling
      ↓
CDN / Cache
      ↓
Transfer
      ↓
Decode
      ↓
Layout
      ↓
Paint
      ↓
LCP / User Experience
```

The objective is not:

> Load every image as quickly as possible.

The objective is:

> **Load the right image, at the right representation, at the right time, with the right priority, while preventing non-critical images from competing with the critical rendering path.**
