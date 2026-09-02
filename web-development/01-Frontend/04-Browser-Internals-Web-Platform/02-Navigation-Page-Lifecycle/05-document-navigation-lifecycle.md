# KPI 02 — Part 05: Resource Loading, Prioritization & The Critical Rendering Path

[⬅️ Part 04: HTTP Navigation & Response Processing](./04-http-navigation-response-processing.md) | [📚 KPI 02 Index](./README.md) | [🧪 Lab 01](./examples/01-navigation-lifecycle-timeline-lab.html) | [🧪 Lab 02](./examples/02-dns-connection-benchmark-lab.html) | [🧪 Lab 03](./examples/03-tls-handshake-certificate-lab.html) | [🧪 Lab 04](./examples/04-http-stream-cache-waterfall-lab.html) | [🧪 Lab 05](./examples/05-critical-rendering-path-priority-lab.html) | [Part 06: Page Lifecycle Events ➡️](./06-page-lifecycle-events.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer \| Founding Engineer)

---

# 🧭 PART POSITION

This is the point where we move from:

```text
HTTP response
     ↓
"Browser received HTML"
```

to the much more important Senior-level question:

> **"What does the browser do with that HTML, what resources does it discover, which ones block progress, which ones are prioritized, and why does the page become visually usable when it does?"**

---

# LAYER 1 — ⚡ 30-SECOND EXECUTIVE CHEAT SHEET

## The Resource-Loading Pipeline

```text
HTML bytes
   │
   ▼
HTML parser
   │
   ├── discovers CSS
   ├── discovers JS
   ├── discovers images
   ├── discovers fonts
   └── discovers other resources
          │
          ▼
   Resource scheduler
          │
          ├── priority
          ├── dependency
          ├── preload hints
          ├── connection availability
          └── browser heuristics
          │
          ▼
       Network
          │
          ▼
    Resource response
          │
          ▼
     Resource processing
```

---

# 1. THE PAGE IS NOT ONE REQUEST

A common beginner mental model:

```text
Browser
   ↓
GET /
   ↓
HTML
   ↓
Page loaded
```

A real page is closer to:

```text
                         HTML
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
       CSS               JS              Images
        │                 │                 │
        ▼                 ▼                 ▼
      Fonts          API/data          Media
        │
        ▼
   more resources
```

Therefore:

> **Navigation creates a resource dependency graph.**

The browser is continuously discovering additional work.

---

# 2. RESOURCE DISCOVERY

Suppose the browser receives:

```html
<link rel="stylesheet" href="/app.css">

<script src="/app.js"></script>

<img src="/hero.webp">

<link rel="preload"
      href="/font.woff2"
      as="font">
```

The HTML parser discovers four separate resources.

Conceptually:

```text
HTML
 │
 ├── app.css
 ├── app.js
 ├── hero.webp
 └── font.woff2
```

Each enters the browser's resource-loading machinery.

---

# 3. THE RESOURCE SCHEDULER

The browser does not blindly download everything in source order.

It considers factors including:

* resource type,
* parser state,
* priority,
* dependencies,
* viewport relevance,
* preload hints,
* connection state,
* caching,
* bandwidth,
* browser heuristics.

Think:

```text
Discovered resources
        │
        ▼
 Resource scheduler
        │
        ▼
"What should happen next?"
```

---

# 4. DISCOVERY ORDER ≠ DOWNLOAD ORDER

Suppose HTML contains:

```html
<img src="image-a.jpg">
<script src="critical.js"></script>
```

It does **not** mean:

```text
1. download image-a
2. then download critical.js
```

The browser has its own prioritization and scheduling system.

This is one of the first important distinctions:

```text
HTML order
   ≠
network scheduling order
```

---

# 5. RESOURCE PRIORITY

Browsers assign internal priorities to resources.

Conceptually:

```text
                 Resources
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
      Critical     Important     Low
        │            │            │
        ▼            ▼            ▼
       early        normal       deferred
```

The exact priority model is browser-specific and can change across versions.

Therefore, don't memorize simplistic tables like:

```text
CSS = highest
JS = second
image = third
```

Instead understand:

> **The browser uses resource type, dependency, context, and hints to determine scheduling priority.**

---

# 6. WHY PRIORITY EXISTS

Suppose a page needs:

```text
2 MB hero image
200 KB CSS
100 KB JS
```

If the browser spends bandwidth on low-value images while critical CSS is delayed:

```text
User sees:
blank / unstyled page
```

If critical resources are prioritized:

```text
CSS arrives
 ↓
style computation
 ↓
visual rendering can progress
```

The scheduler exists partly to optimize perceived and actual loading progress.

---

# 7. CSS IS RENDER-BLOCKING

Consider:

```html
<link rel="stylesheet" href="/app.css">
```

The browser generally needs CSS before producing the final styled rendering for the affected document.

Conceptually:

```text
HTML
 ↓
CSS discovered
 ↓
CSS download
 ↓
CSS parse
 ↓
style information
 ↓
rendering
```

This is why critical CSS delivery matters.

---

# 8. CSSOM

HTML produces:

```text
DOM
```

CSS produces:

```text
CSSOM
```

Conceptually:

```text
HTML
 ↓
DOM
```

and:

```text
CSS
 ↓
CSSOM
```

The browser combines style and document information to determine what should be rendered.

---

# 9. RENDER TREE CONCEPT

A simplified mental model:

```text
DOM + CSSOM
     │
     ▼
Render information
     │
     ▼
Layout
     │
     ▼
Paint
     │
     ▼
Composite
```

The exact internal architecture is more complex, but this is the correct conceptual progression.

---

# 10. CSS DOES NOT "BLOCK HTML PARSING" IN THE SAME WAY AS A NORMAL SCRIPT

This distinction matters.

A stylesheet generally doesn't simply stop the HTML parser from reading bytes.

Instead, CSS can block downstream rendering-related progress, and stylesheets interact with script execution because scripts may need CSS information.

So avoid saying:

> "CSS blocks the HTML parser."

A more accurate statement is:

> **Stylesheets can block rendering and can affect when scripts execute.**

---

# 11. JAVASCRIPT RESOURCE DISCOVERY

Consider:

```html
<script src="/app.js"></script>
```

The browser discovers the script.

What happens next depends heavily on the script's attributes.

The classic form:

```html
<script src="/app.js"></script>
```

has parser-blocking behavior.

Conceptually:

```text
HTML parser
     │
     ▼
<script>
     │
     ├── fetch script
     ├── wait
     ├── execute
     │
     ▼
continue parsing
```

---

# 12. WHY PARSER-BLOCKING SCRIPTS MATTER

Suppose:

```html
<h1>Hello</h1>

<script src="/large.js"></script>

<p>World</p>
```

A classic external script can cause:

```text
parse <h1>
      ↓
discover script
      ↓
pause parser
      ↓
fetch / execute script
      ↓
resume parser
```

Therefore:

> Large parser-blocking scripts can delay document construction.

---

# 13. `DEFER`

Consider:

```html
<script src="/app.js" defer></script>
```

The browser can fetch the script while continuing HTML parsing.

Conceptually:

```text
HTML parser ──────────────────────►
              │
              ├── fetch JS ──────►
              │
              ▼
         document parsed
              │
              ▼
         execute deferred JS
```

This is why `defer` is commonly useful for classic scripts that depend on the document being parsed.

---

# 14. `ASYNC`

Consider:

```html
<script src="/analytics.js" async></script>
```

The script can download independently.

When ready, execution occurs as soon as practical, potentially interrupting HTML parsing.

Conceptually:

```text
HTML parser ───────────────────────►
          │
          ├── async fetch
          │
          ▼
       JS ready
          │
          ▼
      execute now
```

Therefore:

```text
async
=
download independently + execute when ready
```

not:

```text
async = execute after DOMContentLoaded
```

---

# 15. `DEFER` VS `ASYNC`

| Behavior                               | `defer`                                | `async`        |
| -------------------------------------- | -------------------------------------- | -------------- |
| Downloads while parsing                | Yes                                    | Yes            |
| Blocks parser during download          | No                                     | No             |
| Execution timing                       | After parsing                          | When ready     |
| Relative execution order               | Preserved for deferred classic scripts | Not guaranteed |
| Good for dependent application scripts | Often                                  | Usually not    |
| Good for independent scripts           | Sometimes                              | Often          |

A useful mental model:

```text
defer
→ "download now, execute later in order"

async
→ "download now, execute whenever ready"
```

---

# 16. MODULE SCRIPTS

Consider:

```html
<script type="module" src="/app.js"></script>
```

Module scripts have different loading and execution semantics from classic scripts.

They are deferred by default in the relevant sense, while their dependency graph is resolved and fetched.

Conceptually:

```text
module
  │
  ▼
module graph
  │
  ├── dependency A
  ├── dependency B
  └── dependency C
          │
          ▼
       execute
```

This is foundational for modern JavaScript applications.

---

# 17. SCRIPT DEPENDENCY GRAPH

Suppose:

```javascript
import React from "react";
import App from "./App.js";
```

The browser/bundler ecosystem deals with dependency graphs.

At runtime for native modules:

```text
app.js
 ├── react
 └── App.js
       ├── component-a.js
       └── component-b.js
```

Modern bundlers often transform this graph before deployment.

---

# 18. RESOURCE PRELOAD

You can explicitly tell the browser:

```html
<link
  rel="preload"
  href="/critical-font.woff2"
  as="font"
  crossorigin>
```

Conceptually:

```text
HTML
 ↓
preload hint
 ↓
browser scheduler
 ↓
fetch resource early
```

The purpose is:

> **Start fetching an important resource before normal discovery would happen.**

---

# 19. PRELOAD IS NOT "DOWNLOAD EVERYTHING EARLY"

Bad usage:

```html
<link rel="preload" href="/image1">
<link rel="preload" href="/image2">
<link rel="preload" href="/image3">
<link rel="preload" href="/image4">
<link rel="preload" href="/image5">
```

If everything is critical:

```text
Nothing is meaningfully prioritized.
```

Preload should be used for resources that are:

* important,
* discoverable too late,
* needed by the current navigation.

---

# 20. PRELOAD AS A PRIORITY SIGNAL

Think:

```text
Normal discovery
      │
      ▼
"Eventually I'll need this."
```

versus:

```text
Preload
      │
      ▼
"I know this is important; fetch it now."
```

But preload is still subject to browser scheduling and resource constraints.

---

# 21. PRECONNECT

Example:

```html
<link rel="preconnect" href="https://cdn.example.com">
```

This tells the browser:

> This origin is likely to be used soon; prepare the connection.

Conceptually:

```text
preconnect
   │
   ├── DNS-related work
   ├── transport setup
   └── TLS setup where applicable
```

Then the later request can potentially avoid paying the full connection setup latency.

---

# 22. PRELOAD VS PRECONNECT

### Preload

```text
"Fetch this resource early."
```

### Preconnect

```text
"Prepare a connection to this origin early."
```

So:

```text
preload → resource-level optimization
preconnect → origin/connection-level optimization
```

---

# 23. PREFETCH

`prefetch` is generally a lower-priority hint for resources that may be needed later.

Conceptually:

```text
Current page
    │
    ▼
Likely future navigation
    │
    ▼
prefetch resource
```

Example:

```html
<link rel="prefetch" href="/next-page-data.json">
```

The important distinction:

```text
preload
→ needed now

prefetch
→ may be needed later
```

---

# 24. PRELOAD / PREFETCH / PRECONNECT

| Hint         | Main idea                                   |
| ------------ | ------------------------------------------- |
| `preload`    | Fetch a current critical resource early     |
| `preconnect` | Establish connection readiness to an origin |
| `prefetch`   | Fetch something likely useful later         |

Using the wrong one can hurt performance.

---

# 25. IMAGE LOADING

Images can be loaded eagerly or lazily.

Example:

```html
<img
  src="/hero.webp"
  loading="eager">
```

versus:

```html
<img
  src="/below-fold.webp"
  loading="lazy">
```

Lazy loading allows the browser to defer resources unlikely to be needed immediately.

---

# 26. LAZY LOADING IS NOT "NEVER LOAD"

A lazy resource means:

> The browser can delay loading until it becomes sufficiently relevant.

Conceptually:

```text
Below viewport
     │
     ▼
delay
     │
     ▼
approaching viewport
     │
     ▼
fetch
```

The exact threshold is browser-controlled.

---

# 27. RESPONSIVE IMAGES

Consider:

```html
<img
  src="small.jpg"
  srcset="
    small.jpg 480w,
    medium.jpg 1000w,
    large.jpg 2000w
  ">
```

The browser can choose an appropriate resource based on:

* viewport,
* device characteristics,
* density,
* available candidates,
* network conditions and browser heuristics.

This prevents blindly shipping the largest asset.

---

# 28. `SIZES`

Example:

```html
<img
  srcset="..."
  sizes="(max-width: 768px) 100vw, 50vw">
```

The `sizes` attribute helps the browser understand the expected rendered width.

This allows more informed source selection.

---

# 29. FONT LOADING

Fonts can introduce another dependency:

```text
HTML
 ↓
CSS
 ↓
font discovered
 ↓
font fetch
 ↓
font processing
 ↓
text rendering
```

Poor font loading strategy can affect:

* text rendering,
* layout,
* perceived performance,
* Cumulative Layout Shift.

---

# 30. FONT-DISPLAY

CSS:

```css
@font-face {
  font-family: "Inter";
  src: url("/inter.woff2") format("woff2");
  font-display: swap;
}
```

`font-display` controls how text behaves while the web font is unavailable.

The browser's exact behavior depends on the selected value and timing.

Common values include:

```text
auto
block
swap
fallback
optional
```

---

# 31. THE CRITICAL RENDERING PATH

The **Critical Rendering Path (CRP)** is the sequence of work required to transform network-delivered resources into rendered pixels.

Simplified:

```text
HTML
 ↓
DOM
 ↓
CSS
 ↓
CSSOM
 ↓
render information
 ↓
layout
 ↓
paint
 ↓
composite
 ↓
pixels
```

JavaScript can modify the process at multiple points.

---

# 32. CRP IS NOT A SINGLE LINE

A more realistic view:

```text
                  HTML
                   │
                   ▼
                  DOM
                   │
             ┌─────┴─────┐
             │           │
            CSS          JS
             │           │
             ▼           ▼
           CSSOM      DOM mutations
             │           │
             └─────┬─────┘
                   ▼
             style calculation
                   │
                   ▼
                 layout
                   │
                   ▼
                  paint
                   │
                   ▼
               compositing
                   │
                   ▼
                 pixels
```

---

# 33. STYLE CALCULATION

The browser determines which CSS rules apply to elements.

Conceptually:

```text
DOM
 +
CSSOM
 ↓
computed styles
```

Example:

```html
<div class="card">
```

and:

```css
.card {
  width: 300px;
}
```

The browser calculates the relevant style information for that element.

---

# 34. LAYOUT

Layout determines geometry.

Questions include:

```text
Where is the element?
How large is it?
How do its children affect geometry?
How do siblings interact?
```

Conceptually:

```text
Styles
 ↓
Geometry
 ↓
positions + dimensions
```

---

# 35. PAINT

Painting turns visual information into drawing operations.

Conceptually:

```text
Layout
 ↓
paint instructions
 ↓
backgrounds
text
borders
images
shadows
etc.
```

Paint is not necessarily the final GPU presentation step.

---

# 36. COMPOSITING

The browser can divide visual content into composited layers.

Conceptually:

```text
Painted content
      │
      ▼
Compositor
      │
      ▼
GPU / display pipeline
```

Certain operations can be handled efficiently by compositing without requiring full repaint/layout work.

This is why properties such as transforms and opacity are often important in animation performance.

---

# 37. MAIN THREAD VS COMPOSITOR

A simplified browser rendering model:

```text
Main Thread
 ├── HTML parsing
 ├── CSS processing
 ├── JavaScript
 ├── style calculation
 ├── layout
 └── much of painting work

Compositor
 ├── layer management
 └── compositing work

Raster/GPU
 └── rasterization / graphics work
```

The exact implementation is browser-dependent.

But this distinction is critical when debugging jank.

---

# 38. WHY JAVASCRIPT CAN DESTROY PERFORMANCE

Suppose the browser needs:

```text
16.67ms
```

for a ~60Hz frame budget.

Now JavaScript executes:

```text
45ms
```

on the main thread.

Conceptually:

```text
Frame
│
├── JS: 45ms
│
└── rendering missed
```

Result:

```text
jank
```

Therefore frontend performance isn't simply:

> "How fast did the network load?"

It is:

```text
Network
+
parsing
+
JavaScript
+
style
+
layout
+
paint
+
compositing
```

---

# 39. RESOURCE PRIORITY + RENDERING

Imagine:

```text
Hero image
Critical CSS
Analytics JS
Below-fold image
```

The ideal scheduler behavior is not:

```text
"Download in HTML order."
```

It is closer to:

```text
What does the user need to see/interact with first?
```

This is why performance optimization is fundamentally about **critical-path management**.

---

# 40. HTML PRELOAD SCANNER

Modern browsers can discover certain resources ahead of the main parser's complete progression.

Conceptually:

```text
HTML bytes
    │
    ├──────────────► parser
    │
    └──────────────► speculative/preload discovery
                           │
                           ▼
                    resource requests
```

This helps discover external resources earlier.

Do not treat this as simply "another HTML parser."

It is better understood as a browser optimization mechanism for speculative resource discovery.

---

# 41. WHY THE PRELOAD SCANNER EXISTS

Consider:

```html
<body>
  ...
  <script src="/large.js"></script>
  ...
</body>
```

Without speculative discovery, some resources might not be discovered until the parser reaches their markup.

The browser can often discover external resources earlier and begin fetching them.

This reduces idle network time.

---

# 42. CRITICAL REQUEST CHAINS

A common performance problem:

```text
HTML
 ↓
CSS
 ↓
CSS discovers font
 ↓
font
 ↓
text renders
```

or:

```text
HTML
 ↓
JS
 ↓
JS discovers API
 ↓
API response
 ↓
UI data appears
```

This is a **request chain**.

Long dependency chains increase time-to-usable-content.

---

# 43. WATERFALL ANALYSIS

DevTools:

```text
Network
```

lets you visualize:

```text
HTML      ███████
CSS           ████
JS            ██████
Font                ███
Image               ███████
API                       ████
```

The question is not:

> "Which request is largest?"

The more important question is:

> **Which request sits on the critical dependency chain?**

---

# 44. CRITICAL PATH EXAMPLE

Suppose:

```text
HTML
 ↓
app.js
 ↓
API request
 ↓
data
 ↓
render
```

Even if:

```text
hero.jpg
```

is 5 MB, it may not be responsible for the first meaningful UI if it is independent of the critical chain.

This is why size alone is insufficient.

---

# 45. NEXT.JS CONNECTION

A modern Next.js application can alter the resource graph significantly.

For example:

```text
Browser
 ↓
HTML
 ↓
React Server Components payload
 ↓
client JS chunks
 ↓
hydration / client behavior
```

Next.js may also optimize:

* script loading,
* image delivery,
* font loading,
* code splitting,
* prefetching,
* route transitions.

The underlying browser resource scheduler still ultimately executes the resulting work.

---

# 46. CODE SPLITTING

Instead of:

```text
app.js
   ↓
5 MB JavaScript
```

the application may produce:

```text
initial.js
   +
dashboard.js
   +
editor.js
   +
settings.js
```

Only required chunks need to be loaded for the current route.

This reduces initial JavaScript work.

---

# 47. DYNAMIC IMPORT

Example:

```javascript
const Editor = await import("./Editor.js");
```

Conceptually:

```text
Initial page
   │
   ├── core JS
   │
   ▼
User opens editor
   │
   ▼
fetch editor chunk
   │
   ▼
execute
```

This transforms a synchronous dependency into a deferred dependency.

---

# 48. PRELOADING DYNAMIC DEPENDENCIES

There is a tradeoff.

If a dynamically imported component is almost certainly needed immediately:

```text
delay due to late discovery
```

can be harmful.

Strategic preloading can reduce that latency.

But unnecessary preloading increases:

```text
bandwidth
contention
CPU work
cache pressure
```

Therefore:

> Optimization is about moving the right work earlier, not moving all work earlier.

---

# 49. RESOURCE HINTS ARE NOT MAGIC

Consider:

```html
<link rel="preload" href="/app.js">
```

This does not guarantee:

```text
"app.js will make the page faster."
```

If it competes with more important resources, you can make performance worse.

The browser's scheduler is already intelligent.

Hints should provide information the browser cannot otherwise infer efficiently.

---

# 50. 🧪 DIAGNOSTIC LAB — RESOURCE WATERFALL

Open:

```text
DevTools
→ Network
```

Reload a production-like page.

Record:

```text
Document
CSS
JS
Fonts
Images
API calls
```

For each ask:

```text
When was it discovered?
When did it start?
When did it finish?
What initiated it?
What blocked it?
Was it cached?
```

---

# 51. 🧪 DIAGNOSTIC LAB — INITIATOR

In DevTools Network, inspect the **Initiator** information.

You might discover:

```text
HTML
 ↓
CSS
 ↓
font
```

or:

```text
JS
 ↓
fetch()
 ↓
API
```

This lets you reconstruct dependency relationships.

The key question:

> **Who caused this network request?**

---

# 52. 🧪 DIAGNOSTIC LAB — PRELOAD

Add:

```html
<link
  rel="preload"
  href="/critical.css"
  as="style">
```

Observe the Network waterfall.

Then remove it.

Compare:

```text
discovery time
request start
response completion
rendering impact
```

Do not judge preload by "request started earlier."

Judge whether it improved the critical path.

---

# 53. 🧪 DIAGNOSTIC LAB — DEFER VS ASYNC

Create:

```html
<script src="/a.js"></script>
<script src="/b.js" defer></script>
<script src="/c.js" async></script>
```

Log execution:

```javascript
console.log("a");
console.log("b");
console.log("c");
```

Observe the execution order and relationship with document parsing.

You should be able to explain why:

```text
async ≠ defer
```

---

# 54. 🧪 DIAGNOSTIC LAB — LAZY IMAGE

Create:

```html
<img src="/large.jpg" loading="lazy">
```

Place it far below the viewport.

Observe when the request starts.

Then compare with:

```html
<img src="/large.jpg">
```

You should see the browser alter loading behavior.

---

# 55. 🧪 DIAGNOSTIC LAB — PRECONNECT

Suppose the page loads assets from:

```text
https://cdn.example.com
```

Compare:

```html
<link rel="preconnect"
      href="https://cdn.example.com">
```

against no preconnect.

Inspect timing.

Ask:

> Did connection establishment overlap with other browser work?

---

# 56. PRODUCTION RUNBOOK — SLOW FIRST PAINT

Symptom:

> HTML arrives quickly, but the user sees content late.

Investigate:

```text
HTML arrival
 ↓
CSS discovery
 ↓
CSS completion
 ↓
style calculation
 ↓
layout
 ↓
paint
```

Potential causes:

* CSS blocked,
* CSS too large,
* render-blocking resources,
* expensive style calculation,
* large DOM,
* main-thread contention.

---

# 57. PRODUCTION RUNBOOK — SLOW INTERACTIVITY

Symptom:

> Page looks visible quickly but isn't responsive.

Investigate:

```text
JS download
 ↓
JS parse
 ↓
JS execution
 ↓
main-thread tasks
 ↓
event handling
```

Potential causes:

* huge JavaScript bundles,
* hydration cost,
* long tasks,
* excessive client-side work,
* third-party scripts.

---

# 58. PRODUCTION RUNBOOK — IMAGE DELAY

Symptom:

> Hero image appears late.

Investigate:

```text
Was it discovered late?
Was it lazy-loaded?
Was it correctly prioritized?
Was the correct image candidate selected?
Was CDN latency high?
Was it preloaded unnecessarily/appropriately?
```

Do not simply compress the image first.

First understand the dependency chain.

---

# 59. PRODUCTION RUNBOOK — FONT DELAY

Symptom:

> Text changes appearance after page load.

Investigate:

```text
CSS
 ↓
font discovery
 ↓
font request
 ↓
font response
 ↓
font rendering
```

Look at:

* font format,
* preload,
* cache,
* `font-display`,
* cross-origin behavior,
* font size.

---

# 60. 🔥 CRUCIBLE — DISCOVERY CHAIN

Given:

```html
<link rel="stylesheet" href="/app.css">
```

and inside CSS:

```css
@font-face {
  font-family: AppFont;
  src: url("/font.woff2");
}
```

Predict:

```text
HTML
 ↓
discover CSS
 ↓
fetch CSS
 ↓
parse CSS
 ↓
discover font
 ↓
fetch font
```

This is a dependency chain.

---

# 61. CRUCIBLE — WHY PRELOAD CAN HURT

Suppose:

```html
<link rel="preload" href="/huge-video.mp4">
```

but the actual critical resources are:

```text
critical.css
app.js
hero.webp
```

What can happen?

```text
Bandwidth contention
       ↓
critical resource delayed
       ↓
page becomes slower
```

Therefore:

> Preload is a priority hint, not a universal optimization.

---

# 62. CRUCIBLE — ASYNC

Question:

> Does `async` guarantee that a script executes after HTML parsing finishes?

No.

It executes as soon as the script is ready, so it can interrupt parsing.

---

# 63. CRUCIBLE — DEFER

Question:

> Why is `defer` often appropriate for classic application scripts?

Because the browser can fetch the script while parsing and then execute deferred scripts after document parsing, preserving their relative order under the applicable classic-script semantics.

---

# 64. CRUCIBLE — LAZY LOADING

Question:

> Does `loading="lazy"` guarantee an image won't load until the user scrolls to it?

No.

The browser decides when the resource should be fetched based on its heuristics and proximity/relevance.

---

# 65. CRUCIBLE — NETWORK WATERFALL

Suppose:

```text
HTML: 100ms
CSS: 100ms
Font: 500ms
Hero image: 1000ms
Analytics: 1000ms
```

Question:

> Which should you optimize first?

Not automatically the largest duration.

Determine:

```text
Which resource blocks the critical user-visible path?
```

If the hero is required for LCP, it may matter much more than analytics.

---

# 66. CRUCIBLE — REQUEST INITIATOR

You see:

```text
/api/products
```

in the Network panel.

Question:

> How do you determine what caused it?

Inspect the request's initiator/call-stack information.

It may be:

```text
HTML
JavaScript fetch()
XHR
framework runtime
service worker
```

You are reconstructing causality, not merely observing traffic.

---

# 67. CRUCIBLE — NEXT.JS

Question:

> If Next.js server-rendered HTML arrives quickly but the page remains sluggish, can the network be healthy?

Absolutely.

The bottleneck may be:

```text
HTML
 ↓
client JS
 ↓
parse
 ↓
execute
 ↓
hydrate
 ↓
main-thread work
```

Fast network ≠ fast application.

---

# 68. THE SENIOR ENGINEER MODEL

You should now see navigation as:

```text
                 NAVIGATION
                     │
                     ▼
                  HTML
                     │
                     ▼
             Resource Discovery
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
       CSS           JS         Images
        │            │            │
        ▼            ▼            ▼
      CSSOM       execution     decode
        │            │            │
        └──────┬─────┴────────────┘
               ▼
          Critical Path
               │
               ▼
         Style Calculation
               │
               ▼
             Layout
               │
               ▼
              Paint
               │
               ▼
          Compositing
               │
               ▼
             Pixels
```

---

# 69. THE MOST IMPORTANT PERFORMANCE QUESTION

Don't ask only:

> "How big is this resource?"

Ask:

> **"Where does this resource sit in the dependency graph?"**

A 2 MB resource that is completely off the critical path may be less important than a 30 KB resource that blocks rendering.

---

# 70. PART 05 — COMPLETION CHECKLIST

### Resource discovery

* [x] Resource dependency graph
* [x] Resource discovery
* [x] HTML parser
* [x] Speculative/preload scanner
* [x] Resource initiators
* [x] Request prioritization
* [x] Scheduler heuristics

### CSS

* [x] Render-blocking behavior
* [x] DOM
* [x] CSSOM
* [x] Style calculation
* [x] Critical CSS

### JavaScript

* [x] Parser-blocking scripts
* [x] `defer`
* [x] `async`
* [x] Module scripts
* [x] Module dependency graph
* [x] Dynamic imports
* [x] Code splitting

### Resource hints

* [x] `preload`
* [x] `preconnect`
* [x] `prefetch`
* [x] When each is appropriate
* [x] When hints can hurt

### Media

* [x] Lazy loading
* [x] Responsive images
* [x] `srcset`
* [x] `sizes`
* [x] Font loading
* [x] `font-display`

### Rendering

* [x] Critical Rendering Path
* [x] Style calculation
* [x] Layout
* [x] Paint
* [x] Compositing
* [x] Main thread
* [x] Compositor

### Performance debugging

* [x] Network waterfall
* [x] Initiator
* [x] Critical request chains
* [x] TTFB vs resource download
* [x] Critical path analysis
* [x] Main-thread bottlenecks

---

# 🔥 FINAL MENTAL MODEL

At this point, your KPI 02 navigation model should be:

```text
┌──────────────────────────────────────────────────────────────┐
│                         NAVIGATION                           │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
                             URL
                              │
                              ▼
                             DNS
                              │
                              ▼
                        TCP / QUIC
                              │
                              ▼
                           TLS 1.3
                              │
                              ▼
                        HTTP REQUEST
                              │
                              ▼
                      HTTP RESPONSE
                              │
                              ▼
                         HTML BYTES
                              │
                              ▼
                       HTML PARSER
                              │
              ┌───────────────┼────────────────┐
              │               │                │
              ▼               ▼                ▼
             CSS             JS             Images
              │               │                │
              ▼               ▼                ▼
            CSSOM          Execution         Decode
              │               │                │
              └───────────────┼────────────────┘
                              ▼
                    RESOURCE SCHEDULER
                              │
                  ┌───────────┼───────────┐
                  ▼           ▼           ▼
               Priority     Cache       Hints
                              │
                              ▼
                     CRITICAL PATH
                              │
                              ▼
                     Style Calculation
                              │
                              ▼
                           Layout
                              │
                              ▼
                            Paint
                              │
                              ▼
                        Compositing
                              │
                              ▼
                           PIXELS
```

### The Senior-Level Takeaway

> **Browser performance is fundamentally dependency-graph management.**

You are not optimizing isolated files.

You are optimizing:

```text
discovery
   ↓
priority
   ↓
dependency
   ↓
network
   ↓
CPU
   ↓
rendering
   ↓
pixels
```

---

[⬅️ Part 04: HTTP Navigation & Response Processing](./04-http-navigation-response-processing.md) | [📚 KPI 02 Index](./README.md) | [🧪 Lab 01](./examples/01-navigation-lifecycle-timeline-lab.html) | [🧪 Lab 02](./examples/02-dns-connection-benchmark-lab.html) | [🧪 Lab 03](./examples/03-tls-handshake-certificate-lab.html) | [🧪 Lab 04](./examples/04-http-stream-cache-waterfall-lab.html) | [🧪 Lab 05](./examples/05-critical-rendering-path-priority-lab.html) | [Part 06: Page Lifecycle Events ➡️](./06-page-lifecycle-events.md)
