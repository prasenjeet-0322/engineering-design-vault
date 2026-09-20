# Level 08 — KPI 10 — Part 03

## Responsive Images, `srcset`, `sizes` & Art Direction

---

## 1. Part Objective

This part isolates one of the most important image-delivery problems in modern frontend systems:

> **How does the browser decide which image representation to download?**

The previous part established that `<Image>` connects application intent to an optimized delivery pipeline.

This part goes deeper into the browser-facing representation-selection layer:

```text
Source Asset
    ↓
Available Representations
    ↓
srcset
    +
sizes
    ↓
Browser
    ↓
Viewport + DPR + Layout
    ↓
Candidate Selection
    ↓
Download
```

The senior-level goal is to understand why responsive images exist, how `srcset` and `sizes` interact, how device pixel ratio changes the required resource, and when responsive sizing is insufficient and **art direction** becomes necessary.

The core invariant is:

> **Responsive image optimization is about delivering enough pixels for the rendered image—not simply delivering the smallest available file.**

---

# 2. The Fundamental Problem

Consider a single image:

```text
hero.jpg
2000 × 1200
```

Suppose it is displayed on:

```text
Mobile:
360px wide

Tablet:
768px wide

Desktop:
1440px wide
```

Sending the original 2000px-wide image to every device is wasteful.

The browser does not necessarily need:

```text
2000px
```

for every viewport.

The desired architecture is:

```text
One source asset
        ↓
Multiple delivery representations
        ↓
Browser chooses appropriate representation
```

For example:

```text
320w
480w
640w
768w
1024w
1280w
1600w
2000w
```

The browser can then select an appropriate candidate.

---

# 3. Responsive Images Are a Resource-Selection Problem

The problem is not simply:

```text
"Make the image responsive."
```

The real problem is:

```text
Given:
    viewport
    device pixel ratio
    layout
    available candidates

Choose:
    a representation that provides sufficient visual resolution
    without unnecessary transfer cost.
```

Conceptually:

```text
Rendered Geometry
        +
Device Pixel Density
        +
Available Candidates
        ↓
Resource Selection
```

This is why responsive image architecture requires understanding both:

* CSS layout
* browser resource selection

---

# 4. CSS Width and Image Resource Width Are Different

Suppose CSS says:

```css
width: 400px;
```

That does not necessarily mean the browser should download a 400px-wide source.

Consider a device with:

```text
DPR = 2
```

The physical pixel density is higher.

A useful conceptual approximation is:

```text
required source width
≈
CSS rendered width × DPR
```

Therefore:

```text
400 CSS px × 2
≈
800 image pixels
```

This does not mean the browser blindly performs exactly this multiplication in every circumstance.

It means the engineer must understand:

```text
CSS pixels
        ≠
physical/device pixels
```

---

# 5. Device Pixel Ratio

Device Pixel Ratio, commonly represented as:

```text
DPR
```

describes the relationship between CSS pixels and device pixels.

Conceptually:

```text
DPR 1:
1 CSS px → 1 device pixel

DPR 2:
1 CSS px → 2 device pixels

DPR 3:
1 CSS px → 3 device pixels
```

For a 400px CSS image:

```text
DPR 1 → ~400 image pixels
DPR 2 → ~800 image pixels
DPR 3 → ~1200 image pixels
```

Therefore a single fixed image candidate is rarely optimal across all devices.

---

# 6. Why DPR Matters

Suppose the application delivers:

```text
400px image
```

to a:

```text
400px CSS image
```

on a DPR 2 device.

The browser may have only:

```text
400 physical pixels
```

of source information for approximately:

```text
800 physical pixels
```

of desired display density.

The result can appear less sharp.

Now suppose the application always delivers:

```text
1200px
```

to every device.

Sharpness improves, but bandwidth cost increases.

Responsive images attempt to balance:

```text
visual fidelity
        ↕
transfer cost
```

---

# 7. `srcset` — Available Candidates

The `srcset` attribute communicates available image candidates.

Conceptually:

```html
<img
  src="image.jpg"
  srcset="
    image-320.jpg 320w,
    image-640.jpg 640w,
    image-1280.jpg 1280w
  "
/>
```

The browser now knows that multiple representations exist.

The important information is:

```text
320w
640w
1280w
```

These are width descriptors.

They describe the intrinsic width of each candidate.

---

# 8. What `srcset` Does Not Mean

A common misconception is:

```text
320w
=
use on 320px viewport
```

That is incorrect.

The `w` descriptor describes the candidate's intrinsic image width.

It does not directly describe the viewport width at which the browser must use it.

Candidate selection also depends on:

```text
rendered image size
+
DPR
+
sizes
+
browser heuristics
```

Therefore:

```text
srcset
```

provides the candidate pool.

It does not completely define the selection decision.

---

# 9. `sizes` — Expected Rendered Width

The browser also needs to know:

> How wide will this image actually be rendered?

That is what `sizes` helps communicate.

For example:

```html
sizes="100vw"
```

means conceptually:

```text
image occupies approximately viewport width
```

Another example:

```html
sizes="(max-width: 768px) 100vw, 50vw"
```

means approximately:

```text
viewport <= 768px
    → image ≈ 100vw

otherwise
    → image ≈ 50vw
```

This gives the browser the missing layout information needed for candidate selection.

---

# 10. The Relationship Between `srcset` and `sizes`

The clean mental model is:

```text
srcset
=
"What image candidates are available?"

sizes
=
"How wide will the image probably render?"
```

Together:

```text
srcset
        +
sizes
        ↓
Browser candidate selection
```

This distinction is essential.

Without understanding both, it is easy to create responsive-image implementations that appear correct but waste bandwidth.

---

# 11. Candidate Selection Model

A useful conceptual model is:

```text
1. Determine rendered CSS width
2. Consider device pixel ratio
3. Determine required effective pixel width
4. Compare against available candidates
5. Choose an appropriate candidate
```

For example:

```text
Rendered width:
500px

DPR:
2

Approximate required image width:
1000px
```

Available:

```text
640w
768w
1024w
1280w
```

A candidate around:

```text
1024w
```

would generally be a reasonable fit.

The exact browser selection algorithm contains additional details and heuristics, but this model is sufficient for engineering reasoning.

---

# 12. Why `sizes` Is So Important

Suppose the actual layout is:

```text
desktop:
image = 33vw
```

At:

```text
1440px viewport
```

the image may render around:

```text
475px
```

If `sizes` incorrectly says:

```text
100vw
```

the browser may reason that the image occupies approximately:

```text
1440px
```

and select a much larger candidate.

The problem becomes:

```text
Actual:
475px

Declared:
1440px
```

Therefore:

```text
incorrect sizes
        ↓
incorrect resource estimation
        ↓
potentially oversized download
```

---

# 13. The Cost of Incorrect `sizes`

Incorrect `sizes` can create:

### Bandwidth waste

```text
download:
1200px

need:
500px
```

### Slower transfer

Larger files take longer to transfer.

### Increased cache pressure

Larger representations consume more cache storage.

### Increased image decode work

More pixels may need to be decoded.

### Increased memory usage

Decoded image surfaces can consume substantial memory.

Therefore `sizes` is not merely a markup detail.

It can affect the entire delivery pipeline.

---

# 14. `sizes` Should Follow Real Layout

Suppose the UI is:

```text
Mobile
┌──────────────────────┐
│        IMAGE         │
│       100vw          │
└──────────────────────┘

Desktop
┌──────────────┬──────────────┐
│              │              │
│    IMAGE     │    CONTENT   │
│     40vw     │              │
│              │              │
└──────────────┴──────────────┘
```

Then the `sizes` expression should describe that relationship.

For example:

```html
sizes="(max-width: 768px) 100vw, 40vw"
```

The important engineering principle is:

> **Derive `sizes` from the actual layout model, not from habit.**

---

# 15. Common `sizes` Failure

A developer may copy:

```text
sizes="100vw"
```

into every image component.

This is only correct when the image actually occupies approximately the viewport width.

For a three-column desktop grid:

```text
┌──────┬──────┬──────┐
│  img │  img │  img │
└──────┴──────┴──────┘
```

each image might occupy roughly:

```text
33vw
```

not:

```text
100vw
```

Using:

```text
100vw
```

can therefore substantially overstate the required image width.

---

# 16. `srcset` Width Density

Imagine:

```text
srcset:
320w
640w
960w
1280w
1920w
```

and the image renders at:

```text
480 CSS px
```

on a:

```text
DPR 2
```

device.

Conceptually:

```text
480 × 2 = 960
```

The browser can select approximately:

```text
960w
```

rather than:

```text
320w
```

or:

```text
1920w
```

This is the core advantage of width-based responsive images.

---

# 17. Width Candidates Should Be Deliberate

An image platform should avoid generating every possible width.

For example, this is usually undesirable:

```text
1w
2w
3w
4w
...
2000w
```

Instead, define a bounded candidate set.

For example:

```text
320
480
640
750
828
1080
1200
1440
1920
```

The exact values depend on the application's traffic and layout distribution.

The architectural goal is:

```text
enough candidates
+
bounded variant count
```

---

# 18. Candidate Granularity Tradeoff

Too few candidates:

```text
320
1000
2000
```

can force browsers into oversized representations.

Too many candidates:

```text
320
321
322
323
...
2000
```

can create:

* cache fragmentation,
* transformation overhead,
* larger cache footprint,
* more operational complexity.

Therefore candidate generation is an optimization problem.

You want:

```text
reasonable granularity
```

rather than:

```text
maximum granularity
```

---

# 19. Width Selection Is Also a Cache Problem

Suppose an image CDN supports arbitrary widths.

Requests might become:

```text
width=401
width=402
width=403
width=404
...
```

Now the cache contains many nearly identical representations.

A better system normalizes requests to a supported width set.

Conceptually:

```text
requested:
403px

normalized:
480px
```

This gives:

```text
bounded cache variants
```

and improves cache reuse.

Therefore:

```text
responsive image selection
        ↔
cache architecture
```

are directly connected.

---

# 20. DPR and Cache Identity

Two users may request the same visual image at:

```text
400 CSS px
```

but with different DPRs.

User A:

```text
DPR 1
≈ 400px representation
```

User B:

```text
DPR 2
≈ 800px representation
```

The delivery system therefore needs to account for representation dimensions.

The important point is:

```text
same visual component
≠
same delivery representation
```

---

# 21. The Browser Owns Final Candidate Selection

The server can expose candidates.

The browser knows:

* current viewport,
* current DPR,
* layout context,
* network conditions,
* browser capabilities,
* resource priorities.

Therefore the browser is uniquely positioned to make the final choice.

This leads to the architecture:

```text
Server:
"Here are valid candidates."

Browser:
"Given my current environment, I'll choose one."
```

This is a powerful design principle behind responsive images.

---

# 22. Browser Choice Is Not a Simple Exact Formula

Do not think:

```text
candidate = renderedWidth × DPR
```

as a strict guarantee.

It is better treated as:

```text
target effective width
        ↓
choose suitable available candidate
        ↓
browser heuristics
```

Browsers may consider additional conditions and may not always choose the mathematically nearest candidate.

For engineering reasoning, distinguish:

```text
conceptual selection model
```

from:

```text
exact browser implementation algorithm
```

---

# 23. Network Conditions Can Influence Decisions

Browsers can make resource-selection decisions using more than geometry.

For example, the browser may account for network conditions or resource priorities.

This means the application should not attempt to reproduce the browser's complete selection algorithm in JavaScript.

Instead:

```text
provide accurate metadata
```

and let the browser make the final resource decision.

This is one reason responsive images are implemented declaratively.

---

# 24. Responsive Images and JavaScript

A poor architecture is:

```text
window.innerWidth
        ↓
React state
        ↓
choose image URL
        ↓
render
```

This introduces unnecessary application-level logic.

It can create:

* hydration concerns,
* resize listeners,
* duplicated browser logic,
* delayed image discovery,
* unnecessary React renders.

The browser already has native mechanisms for responsive resource selection.

Prefer:

```text
srcset
+
sizes
```

where the problem is simply selecting among differently sized representations of the same image.

---

# 25. Responsive Images vs CSS Background Images

CSS backgrounds and content images have different semantics.

Use content images when the image is meaningful content:

```text
product photo
article hero
author portrait
```

Use background images when the image is primarily part of presentation:

```text
decorative texture
visual background
presentation layer
```

Responsive background-image strategies differ from `<img>`/`<Image>` resource selection.

Therefore do not force every image problem into the same abstraction.

---

# 26. Responsive Sizing vs Art Direction

This is a critical distinction.

### Responsive sizing

The image content remains the same.

Only the resolution changes.

```text
Same composition
    ↓
different dimensions
```

Example:

```text
Desktop:
1200w

Mobile:
480w
```

The photograph is still the same photograph.

---

### Art direction

The image composition itself changes.

```text
Desktop:
wide landscape composition

Mobile:
tightly cropped portrait composition
```

This is not merely a resolution problem.

It is a **content representation problem**.

---

# 27. Example of Art Direction

Imagine a marketing hero:

Desktop:

```text
┌─────────────────────────────────────┐
│                                     │
│  Person              Product        │
│                                     │
└─────────────────────────────────────┘
```

Mobile:

```text
┌───────────────────┐
│                   │
│      Product      │
│                   │
└───────────────────┘
```

Simply shrinking the desktop image may make the product too small.

Instead, mobile may require a different crop or source.

Therefore:

```text
responsive sizing
```

is insufficient.

---

# 28. Art Direction Changes the Source

Responsive sizing:

```text
same source
+
different resolution
```

Art direction:

```text
different source/composition
```

Conceptually:

```text
Desktop
    ↓
hero-desktop.jpg

Mobile
    ↓
hero-mobile.jpg
```

The browser is not merely choosing a smaller version.

It is choosing a different visual representation.

---

# 29. `<picture>` and Art Direction

The native HTML mechanism for source switching is:

```html
<picture>
  <source media="(max-width: 768px)" srcset="hero-mobile.jpg" />
  <img src="hero-desktop.jpg" alt="..." />
</picture>
```

Conceptually:

```text
Viewport condition
        ↓
source selection
        ↓
appropriate composition
```

This is fundamentally different from merely changing image resolution.

---

# 30. Do Not Use Art Direction for Simple Resizing

If the composition is identical:

```text
desktop.jpg
mobile.jpg
```

may be unnecessary.

Instead use:

```text
srcset
+
sizes
```

to select appropriate resolutions.

Use art direction when the **content framing or composition needs to change**.

This distinction prevents unnecessary asset duplication.

---

# 31. Art Direction Can Reduce Transfer Too

Suppose the desktop image is:

```text
2000 × 1000
```

but the mobile design only needs a:

```text
600 × 900
```

portrait crop.

Sending the entire desktop composition and cropping it client-side may waste pixels.

A mobile-specific crop can reduce:

```text
transfer
+
decode
+
memory
```

while improving visual composition.

Therefore art direction can be both:

```text
design optimization
```

and:

```text
performance optimization
```

---

# 32. Art Direction Requires Product Intent

An engineer should not automatically create mobile-specific images.

Ask:

```text
Does the composition actually need to change?
```

If:

```text
same image
+
same focal point
```

then responsive sizing is usually enough.

If:

```text
different focal point
+
different composition
+
different crop
```

then art direction becomes justified.

This is an engineering decision involving both:

* design requirements,
* performance requirements.

---

# 33. Focal Point Preservation

Suppose an image contains:

```text
Person
Product
Background
```

A center crop might remove the important subject.

Art-directed variants can preserve the focal point:

```text
Desktop:
person + product

Mobile:
product centered
```

This means image architecture should sometimes carry metadata about:

```text
focal point
crop
aspect ratio
```

rather than treating images as generic files.

---

# 34. CMS Image Architecture

Large applications often use a media CMS.

A mature model may look like:

```text
Asset
 ├── original
 ├── focal point
 ├── alt text
 ├── width
 ├── height
 ├── crop variants
 └── delivery metadata
```

Then:

```text
Application
    ↓
Image intent
    ↓
CMS / image service
    ↓
responsive representations
```

This is more scalable than manually managing dozens of image files.

---

# 35. Responsive Images and Next.js `<Image>`

The `<Image>` component can participate in responsive image delivery.

The developer's responsibility remains to communicate:

```text
source
+
layout dimensions
+
sizes
+
loading intent
+
semantic meaning
```

The framework can then help produce the delivery machinery around those inputs.

The important mental model is:

```text
<Image>
    ↓
application intent
```

not:

```text
<Image>
    ↓
framework guesses everything
```

---

# 36. A Practical Responsive Grid Example

Suppose a product grid behaves like:

```text
< 640px:
1 column

640–1024px:
2 columns

> 1024px:
4 columns
```

Assume:

```text
page horizontal padding = 32px
gap = 16px
```

A four-column desktop layout approximately gives:

```text
available width
≈ viewport - horizontal padding

column width
≈ available width / 4
```

The `sizes` expression should describe the resulting image width rather than simply using:

```text
100vw
```

A good engineering workflow is:

```text
CSS layout
    ↓
calculate approximate rendered width
    ↓
express it with sizes
    ↓
verify selected candidates
```

---

# 37. Do Not Guess `sizes`

A common anti-pattern is:

```text
"Use 50vw; it seems about right."
```

Instead inspect:

* grid columns,
* container max-width,
* gaps,
* padding,
* breakpoints,
* image width constraints.

Then derive the approximation.

For example:

```text
container max-width = 1280px
4 columns
24px gaps
```

gives a substantially different image width from:

```text
4 × 25vw
```

at large viewport sizes.

The goal is not mathematical perfection.

The goal is a sufficiently accurate resource-selection hint.

---

# 38. Testing Responsive Image Selection

A senior engineer should verify actual browser behavior.

Inspect the rendered HTML and network requests.

Check:

```text
src
srcset
sizes
```

Then inspect:

```text
requested URL
requested width
response size
response format
```

Compare that with:

```text
actual rendered width
DPR
viewport
```

This lets you determine whether the system is behaving as intended.

---

# 39. Debugging Oversized Requests

Suppose:

```text
rendered width = 360px
DPR = 1
```

but:

```text
requested image = 1200px
```

Investigate:

```text
1. Is sizes correct?
2. Is the actual CSS width really 360px?
3. Is the browser using another candidate?
4. Is the image inside a fill container?
5. Is the candidate set too coarse?
6. Is the framework generating larger supported widths?
```

Do not assume the optimizer is broken.

First validate the inputs.

---

# 40. Debugging Blurry Images

Suppose:

```text
rendered width = 500px
DPR = 2
```

but the delivered image is:

```text
320px
```

Potential causes include:

```text
undersized candidate
+
incorrect sizes
+
insufficient source candidates
+
transformation configuration
```

The solution is not automatically:

```text
increase quality
```

First determine whether the image has enough source pixels.

---

# 41. Quality vs Resolution

These are different dimensions.

Suppose:

```text
source = 320px
quality = 100
```

and:

```text
source = 800px
quality = 75
```

The second can still appear substantially sharper because it contains more spatial information.

Therefore:

```text
quality
≠
resolution
```

An image can have:

```text
high quality setting
```

but still be too small.

---

# 42. Resolution vs Compression

Similarly:

```text
high resolution
```

does not guarantee:

```text
good performance
```

A huge image with mild compression may still be expensive.

The complete optimization space is:

```text
dimensions
+
compression
+
format
+
loading
+
cache
```

---

# 43. Responsive Images and LCP

Suppose the LCP image is:

```text
desktop rendered width = 900px
DPR = 2
```

A representation around:

```text
1800px
```

may be relevant.

But if the image is requested as:

```text
400px
```

the browser may have to render an insufficiently detailed source.

Conversely, requesting:

```text
4000px
```

could create unnecessary transfer.

The goal is not:

```text
maximum resolution
```

but:

```text
appropriate resolution for the rendered context
```

---

# 44. Responsive Images and Memory

Large images also have decoded memory costs.

For example:

```text
2000 × 1500
```

contains:

```text
3,000,000 pixels
```

If decoded into an RGBA surface, the memory footprint can be substantially larger than the compressed network file size.

This is why:

```text
file size
```

and:

```text
decoded memory
```

must be considered separately.

A 200KB compressed image can still require significant memory when decoded.

---

# 45. Mobile Devices Make This More Important

Mobile devices may have:

* constrained bandwidth,
* constrained memory,
* lower CPU budgets,
* thermal constraints,
* more variable networks.

Therefore oversized responsive images can cause:

```text
network cost
+
decode cost
+
memory pressure
```

simultaneously.

Responsive image selection is consequently especially important for mobile performance.

---

# 46. Responsive Image Architecture

A mature system can be modeled as:

```text
                 Application Layout
                        │
                        ▼
                 Rendered Width
                        │
                        ▼
                     sizes
                        │
                        ▼
Source Asset ───────► srcset
                        │
                        ▼
                Browser Selection
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
          Viewport               DPR
              │                   │
              └─────────┬─────────┘
                        ▼
                Selected Candidate
                        │
                        ▼
                    CDN/Cache
                        │
                        ▼
                     Browser
```

For art direction:

```text
Viewport condition
        ↓
Source selection
        ↓
Different composition
```

This is a separate branch of the architecture.

---

# 47. Four-Pillar Engineering Matrix

## Correctness

Verify:

```text
candidate represents correct asset
sizes matches actual layout
art direction preserves intended composition
DPR behavior is acceptable
```

---

## Performance

Verify:

```text
no unnecessary oversized candidates
reasonable candidate granularity
appropriate formats
appropriate loading priority
```

---

## Reliability

Verify:

```text
missing candidate fallback
CDN failures
remote source failures
broken transformation paths
```

---

## Operability

Measure:

```text
selected image widths
response sizes
cache hit ratio
variant count
oversized-image frequency
LCP image behavior
```

---

# 48. Production Anti-Patterns

Avoid:

### Anti-pattern 1

```text
sizes="100vw"
```

for every image.

### Anti-pattern 2

Using JavaScript viewport detection to select image URLs when native responsive images are sufficient.

### Anti-pattern 3

Generating hundreds of nearly identical width variants.

### Anti-pattern 4

Using a desktop composition on mobile when the focal point becomes unusable.

### Anti-pattern 5

Treating DPR as the only input.

### Anti-pattern 6

Assuming `srcset` alone communicates rendered image width.

### Anti-pattern 7

Treating compression quality as a substitute for correct dimensions.

### Anti-pattern 8

Ignoring cache cardinality created by responsive transformations.

---

# 49. Prediction Challenges

## Challenge 1

Image renders at:

```text
500px CSS width
DPR = 2
```

Candidates:

```text
320w
640w
1024w
```

Which candidate is conceptually appropriate?

Think:

```text
500 × 2 ≈ 1000
```

Therefore the browser needs a candidate around that effective width and may choose:

```text
1024w
```

---

## Challenge 2

Image renders at:

```text
400px
```

but:

```text
sizes="100vw"
```

and viewport is:

```text
1440px
```

What is suspicious?

The declared rendered width is substantially larger than the actual layout width.

Investigate:

```text
sizes
```

first.

---

## Challenge 3

Desktop and mobile need completely different crops.

Should you simply add more `srcset` widths?

No.

The problem is not resolution.

It is:

```text
art direction
```

---

## Challenge 4

A site generates:

```text
1,000 width variants
```

for a single image.

What system property is likely problematic?

```text
cache cardinality
```

and potentially:

```text
transformation/storage/CPU cost
```

---

## Challenge 5

An image is sharp on desktop but blurry on a high-DPR mobile device.

What should you investigate?

```text
effective rendered width
+
DPR
+
selected candidate
+
sizes
```

before changing compression quality.

---

# 50. Senior Interview Questions

### Question 1

**What is the difference between `srcset` and `sizes`?**

Expected answer:

```text
srcset describes available image candidates.

sizes describes the expected rendered width of the image under different layout conditions.

The browser combines these signals with viewport/DPR and other conditions to select a candidate.
```

---

### Question 2

**Why is `sizes="100vw"` often wrong?**

Because many images do not actually occupy the full viewport width.

Using it for a multi-column grid can cause oversized image downloads.

---

### Question 3

**Why can't DPR alone determine the correct image?**

Because the browser also needs to know how large the image is rendered in CSS pixels.

```text
required effective resolution
≈
rendered CSS width × DPR
```

---

### Question 4

**What is art direction?**

Providing different image compositions or crops for different presentation contexts rather than merely changing resolution.

---

### Question 5

**When should you use art direction instead of `srcset`?**

When the same source composition cannot adequately serve different layout contexts.

---

### Question 6

**Why shouldn't responsive image selection usually be implemented with React state?**

Because the browser already provides native declarative mechanisms and can make the selection with information that application JavaScript does not need to duplicate.

---

# 51. Core Invariants

Remember:

```text
srcset
=
available representations
```

```text
sizes
=
expected rendered width
```

```text
DPR
=
pixel-density factor
```

```text
srcset + sizes
=
responsive candidate selection
```

```text
responsive sizing
≠
art direction
```

```text
same source
+
different resolution
=
responsive sizing
```

```text
different composition
=
art direction
```

And the most important invariant:

```text
CSS layout
    ↓
rendered image width
    ↓
resource selection
```

If you do not understand the layout, you cannot reliably optimize responsive image delivery.

---

# 52. SDE-2 Mental Model

At SDE-2 level, when you see:

```tsx
<Image ... />
```

you should mentally ask:

```text
What is the actual rendered width?
        ↓
What is the DPR?
        ↓
What candidates exist?
        ↓
What does sizes communicate?
        ↓
Which candidate will the browser likely select?
        ↓
Is that candidate appropriately sized?
        ↓
Is the composition correct for this viewport?
        ↓
How many cache variants does this create?
```

That reasoning chain is more valuable than memorizing individual image props.

---

# 53. Part Completion Checklist

You should now be able to:

* [ ] Explain why responsive images exist.
* [ ] Distinguish CSS pixels from image pixels.
* [ ] Explain device pixel ratio.
* [ ] Explain `srcset`.
* [ ] Explain width descriptors.
* [ ] Explain `sizes`.
* [ ] Explain how `srcset` and `sizes` work together.
* [ ] Predict approximate candidate selection.
* [ ] Identify incorrect `sizes`.
* [ ] Explain why candidate granularity matters.
* [ ] Connect candidate selection to cache cardinality.
* [ ] Explain why JavaScript viewport detection is often unnecessary.
* [ ] Distinguish responsive sizing from art direction.
* [ ] Explain `<picture>` conceptually.
* [ ] Explain focal-point preservation.
* [ ] Explain CMS-driven image representations.
* [ ] Debug oversized image requests.
* [ ] Debug blurry images.
* [ ] Explain resolution vs compression.
* [ ] Explain image memory implications.
* [ ] Connect responsive images to LCP.
* [ ] Design a bounded responsive-image architecture.
* [ ] Explain the tradeoffs at SDE-2 interview depth.

---

# 54. Boundary of This Part

This part established:

```text
Responsive Image System
        ↓
srcset
+
sizes
+
DPR
+
browser selection
+
art direction
```

The next part moves deeper into the **image transformation and format layer**:

```text
Source Image
    ↓
Resize
    ↓
Crop
    ↓
Compression
    ↓
Format Selection
    ↓
Quality
    ↓
Generated Representation
```

The next boundary is therefore:

**KPI 10 — Part 04: Image Formats, Compression, Quality & Transformation Architecture.**
