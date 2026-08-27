# KPI 01 — Part 05: Navigation, Document Lifecycle & Page Lifecycle

[⬅️ Part 04: Event Loop & Scheduling](./04-browser-event-loop-tasks-rendering.md) | [📚 KPI 01 Index](./README.md) | [🧪 Lab 01](./examples/01-main-thread-vs-compositor-lab.html) | [🧪 Lab 02](./examples/02-layout-thrashing-benchmark-lab.html) | [🧪 Lab 03](./examples/03-event-loop-microtask-starvation-lab.html) | [🧪 Lab 04](./examples/05-page-lifecycle-bfcache-lab.html) | [📋 Runbook](./examples/04-process-inspection-runbook.md) | [Part 06: Site Isolation & Security Boundaries ➡️](./06-site-isolation-security-boundaries.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer \| Founding Engineer)

---

# 🧭 PART POSITION

We have now established:

```text
PART 01
Browser as a System
        ↓
PART 02
Browser Processes
        ↓
PART 03
[Renderer / execution architecture]
        ↓
PART 04
Event Loop + Tasks + Microtasks + Rendering Scheduling
        ↓
PART 05  ← YOU ARE HERE
Navigation + Document + Page Lifecycle
        ↓
NEXT
HTML Parsing / DOM Construction
```

This part is intentionally about **navigation and lifecycle causality**.

We will not yet turn HTML parsing, CSS parsing, or the rendering pipeline into their full standalone topics.

---

# ⚡ LAYER 1 — 30-SECOND EXECUTIVE CHEAT SHEET

## 1. Core Lifecycle

| Concept            | Core Idea                                                             | Production Importance | Main Trap                                           |
| ------------------ | --------------------------------------------------------------------- | --------------------: | --------------------------------------------------- |
| Navigation         | Browser changes the active document/resource                          |               🔴 High | Thinking navigation = HTTP request only             |
| Origin             | Security identity of a document                                       |           🔴 Critical | Confusing URL with origin                           |
| Document           | Current parsed web document                                           |               🟢 High | Treating page/document/window as identical          |
| `DOMContentLoaded` | DOM is constructed and deferred module scripts have completed         |               🟢 High | Thinking all resources are loaded                   |
| `load`             | Document and its dependent resources have completed loading           |               🟢 High | Treating it as "page is ready for users"            |
| `pageshow`         | A document becomes visible in a session history traversal             |               🟢 High | Assuming it only means fresh navigation             |
| `pagehide`         | Document is being hidden during lifecycle transition                  |           🟡 Moderate | Assuming the document is immediately destroyed      |
| `visibilitychange` | Visibility state changes                                              |               🟢 High | Using `unload` for ordinary cleanup                 |
| BFCache            | Browser restores a previous page snapshot                             |               🔴 High | Assuming every back/forward is a fresh load         |
| Prerender          | Browser prepares a page before activation                             |           🟡 Moderate | Assuming activation behaves exactly like a new load |
| Redirect           | Navigation target changes before final document                       |               🟢 High | Counting only the final request                     |
| SPA navigation     | URL/document state changes without necessarily replacing the document |               🟢 High | Assuming every URL change creates a new document    |

---

## 2. The Big Picture

A traditional navigation can be reasoned about as:

```text
User / Script
     │
     ▼
Navigation Request
     │
     ▼
URL Resolution
     │
     ▼
Browser Navigation Machinery
     │
     ├── Cache?
     ├── Service Worker?
     ├── Existing connection?
     ├── Redirect?
     └── Network?
             │
             ▼
          Response
             │
             ▼
       Document Creation
             │
             ▼
       HTML Parsing
             │
             ▼
       Resource Discovery
             │
             ▼
       DOM / CSS / JS
             │
             ▼
       Rendering
             │
             ▼
        Interactive Page
```

But navigation does **not** always traverse this exact path.

A cached resource, BFCache restoration, prerender activation, service worker response, or SPA navigation can substantially change the path.

---

# 🧩 3. Required Prior Knowledge

```text
Browser Process
      ↓
Renderer Process
      ↓
Main Thread
      ↓
Tasks / Microtasks
      ↓
Rendering
      ↓
CURRENT PART
Navigation + Lifecycle
```

You should already understand:

* processes vs threads,
* renderer responsibility,
* browser event-loop concepts,
* asynchronous browser APIs,
* basic HTTP,
* URL structure.

---

# 🔓 4. Concepts Unlocked by This Part

```text
Navigation Lifecycle
       ↓
HTML Parsing
       ↓
DOM Construction
       ↓
CSSOM
       ↓
Rendering Pipeline
       ↓
Resource Loading
       ↓
Performance Metrics
       ↓
Hydration / SSR
       ↓
SPA Navigation
       ↓
BFCache / Prerender
       ↓
Production Page Lifecycle
```

---

# 🏛️ LAYER 2 — DEEP MECHANICAL BREAKDOWN

# 5. What Actually Is a Navigation?

### 🟢 [Daily Driver]

A **navigation** is the browser's process of changing what document/resource is associated with a browsing context.

That is broader than:

```text
URL changes
```

and broader than:

```text
HTTP request
```

For example:

```javascript
location.href = "/dashboard";
```

initiates navigation.

So can:

```html
<a href="/dashboard">Dashboard</a>
```

But:

```javascript
history.pushState({}, "", "/dashboard");
```

changes session history and URL state without necessarily performing a document navigation.

That distinction is foundational.

---

# 6. Navigation ≠ HTTP Request

This is one of the most important mental models.

A navigation can involve:

```text
Navigation
   │
   ├── Cache
   ├── Service Worker
   ├── HTTP
   ├── Redirect
   ├── Existing Document
   ├── BFCache
   ├── Prerender
   └── Other browser mechanisms
```

Therefore:

> **A navigation is a browser lifecycle operation; an HTTP request is only one possible component of that operation.**

---

# 7. Browsing Context

A **browsing context** is the environment in which a document is presented and navigated.

Examples include:

* a top-level browser tab,
* an iframe,
* certain embedded contexts.

Conceptually:

```text
Browser Window
      │
      ▼
Top-Level Browsing Context
      │
      ▼
Document
```

An iframe introduces another browsing context:

```text
Top-Level Document
       │
       └── iframe browsing context
                 │
                 └── child Document
```

This becomes important for:

* origins,
* navigation,
* security,
* process isolation,
* history.

---

# 8. URL vs Origin

These are not the same.

Example:

```text
https://example.com:443/products?id=10
```

The URL contains:

```text
scheme     = https
host       = example.com
port       = 443
path       = /products
query      = ?id=10
```

The origin is conceptually:

```text
scheme + host + port
```

So:

```text
https://example.com:443
```

is the origin.

The path:

```text
/products
```

does not change the origin.

---

# 9. Why Origin Matters During Navigation

The browser needs to establish security identity for the resulting document.

Consider:

```text
https://app.example.com
```

versus:

```text
https://evil.example.com
```

These are different origins even though they share:

```text
example.com
```

Likewise:

```text
https://example.com
http://example.com
```

are different origins.

This distinction becomes critical for:

* DOM access,
* storage,
* cookies,
* CORS,
* cross-origin isolation,
* iframe communication.

---

# 10. Navigation Initiation

Navigation can originate from:

### User interaction

```html
<a href="/profile">
```

### Script

```javascript
location.assign("/profile");
```

### Form submission

```html
<form action="/login" method="POST">
```

### Browser history

```text
Back
Forward
```

### Programmatic history traversal

```javascript
history.back();
```

### Browser startup / restoration

The browser may restore previously existing browsing state.

---

# 11. Navigation Request Is Not Necessarily Immediate Network Activity

Consider:

```javascript
location.href = "/dashboard";
```

The browser first has to reason about the navigation target.

Conceptually:

```text
Navigation
   ↓
Resolve URL
   ↓
Determine navigation type/context
   ↓
Check applicable browser mechanisms
   ↓
Potentially consult:
   ├── cache
   ├── service worker
   ├── network
   └── history-related state
```

Only then does the final resource retrieval path emerge.

---

# 12. URL Resolution

Relative URLs need to be resolved against a base URL.

Suppose:

```text
Current:
https://example.com/account/settings

Target:
../profile
```

The browser resolves the relative reference into an absolute URL.

Conceptually:

```text
Relative URL
     +
Base URL
     ↓
Resolved URL
```

This is why:

```html
<a href="../profile">
```

does not mean the browser sends `../profile` literally over the network.

---

# 13. Redirects

Suppose:

```text
GET /old
   ↓
301
Location: /new
   ↓
GET /new
   ↓
200
```

The navigation is not equivalent to a single request.

Conceptually:

```text
Navigation
   │
   ▼
Request A
   │
   ▼
Redirect
   │
   ▼
Request B
   │
   ▼
Final Response
   │
   ▼
Document
```

Redirects can affect:

* latency,
* cookies,
* caching,
* origin transitions,
* security policy,
* performance metrics.

---

# 14. Redirect Chains

A production problem:

```text
HTTP
 ↓
HTTPS
 ↓
www
 ↓
non-www
 ↓
locale
 ↓
application
```

Potentially:

```text
5 navigation hops
```

Each hop can introduce additional work.

Senior engineers should inspect the **entire redirect chain**, not merely the final `200`.

---

# 15. DNS

If network retrieval is required, the browser may need to resolve the hostname.

Conceptually:

```text
example.com
     ↓
DNS Resolution
     ↓
IP address
```

But modern browsers may already have relevant DNS information through:

* existing connections,
* DNS cache,
* connection reuse,
* browser/platform caches.

Therefore:

> A page load does not necessarily perform a fresh DNS lookup every time.

---

# 16. Connection Establishment

If the browser needs a new connection, additional protocol work may occur.

Conceptually:

```text
DNS
 ↓
Connection
 ↓
TLS
 ↓
HTTP
```

For modern HTTPS:

```text
DNS
 ↓
TCP / QUIC
 ↓
TLS / QUIC cryptographic setup
 ↓
HTTP
```

The exact mechanics depend on protocol/version.

---

# 17. Connection Reuse

Browsers aggressively reuse connections where possible.

Conceptually:

```text
Connection
      │
      ├── HTML
      ├── CSS
      ├── JS
      ├── Image
      └── API
```

Therefore:

> The browser does not establish a completely independent connection for every resource.

This is especially important when reasoning about:

* HTTP/2,
* HTTP/3,
* connection pools,
* latency,
* resource waterfalls.

---

# 18. TLS

For HTTPS navigation, cryptographic session establishment occurs before normal encrypted HTTP exchange.

Conceptually:

```text
Client
  │
  ▼
Secure connection establishment
  │
  ▼
Authenticated encrypted channel
  │
  ▼
HTTP request
```

Do not reduce TLS to:

> "It encrypts the request."

It also provides authentication properties and establishes cryptographic parameters for the secure channel.

---

# 19. HTTP Request

Once the browser has an appropriate retrieval path:

```text
GET /dashboard
Host: example.com
...
```

the server may respond with:

```text
200 OK
Content-Type: text/html
...
```

But even now, the browser is not finished.

The response becomes input to the document-loading pipeline.

---

# 20. Response Handling

Conceptually:

```text
HTTP Response
      │
      ├── Status
      ├── Headers
      ├── Content-Type
      ├── Cache directives
      ├── Security policies
      └── Body
             │
             ▼
       Browser processing
```

The response headers can influence what happens next.

Examples include:

* caching,
* content interpretation,
* security policies,
* cookies,
* redirects,
* content encoding.

---

# 21. Service Worker Interception

If a relevant service worker controls the request, the normal network path can change.

Conceptually:

```text
Navigation
    │
    ▼
Service Worker
    │
    ├──── Cache
    │
    ├──── Network
    │
    └──── Synthetic Response
```

This means:

```text
"Page navigation"
```

does not necessarily imply:

```text
"Request went to origin server."
```

A service worker can respond from Cache Storage or generate/return a response through its fetch handling.

---

# 22. Browser Cache vs Service Worker Cache

Do not confuse these.

### HTTP Cache

Browser-managed HTTP caching behavior:

```text
HTTP response
      ↓
HTTP cache
```

### Cache Storage

Script-accessible cache API commonly used by service workers:

```text
Service Worker
      ↓
Cache Storage
```

They are different mechanisms.

---

# 23. Document Creation

When the browser receives a new HTML document, the navigation transitions toward creating/activating a document in the relevant browsing context.

Conceptually:

```text
Navigation Response
       ↓
Document
       ↓
HTML Parsing
       ↓
DOM
```

At this stage, the browser begins transitioning from:

```text
network-oriented work
```

toward:

```text
document-oriented work
```

---

# 24. Document vs Window

These concepts are related but distinct.

```text
Window
  │
  ├── Document
  ├── location
  ├── history
  └── browser-facing APIs
```

The `Document` represents the document itself.

The `Window` represents the global browsing-context interface associated with the document.

This distinction matters when debugging lifecycle behavior.

---

# 25. Old Document vs New Document

Traditional navigation generally involves replacing the active document:

```text
Old Document
     │
     ▼
Navigation
     │
     ▼
New Document
```

But the browser may retain or restore documents under certain lifecycle mechanisms.

This is where BFCache becomes important later.

---

# 26. `DOMContentLoaded`

### 🟢 [Daily Driver]

`DOMContentLoaded` indicates that the document has been parsed and the DOM has been constructed, with relevant deferred/module script execution having completed according to the platform's loading semantics.

A useful mental model:

```text
HTML
 ↓
DOM construction
 ↓
Required parser/defer/module execution
 ↓
DOMContentLoaded
```

It does **not** mean:

```text
All images loaded
All resources loaded
Everything visually complete
```

---

# 27. `DOMContentLoaded` Example

```javascript
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM ready");
});
```

This is useful when your code needs the DOM structure to exist.

But it should not be interpreted as:

> "The user now sees the fully loaded page."

Those are different concepts.

---

# 28. `load`

The `load` event occurs later than `DOMContentLoaded` in the ordinary document-loading path.

A simplified model:

```text
HTML parsing
     ↓
DOM construction
     ↓
DOMContentLoaded
     ↓
Required load completion
     ↓
load
```

The `load` event concerns completion of loading of the document and its dependent resources according to the platform's loading rules.

It is therefore generally later than DOM readiness.

---

# 29. `DOMContentLoaded` vs `load`

| Event              | Rough Meaning                                                            | Does It Mean Images Are Done?                       |
| ------------------ | ------------------------------------------------------------------------ | --------------------------------------------------- |
| `DOMContentLoaded` | DOM construction and relevant deferred/module script execution completed | ❌ Not necessarily                                   |
| `load`             | Document's load process has completed                                    | ✅ Generally includes applicable dependent resources |
| `pageshow`         | Document becomes visible/active in a browsing-context lifecycle          | ❌ Not simply a network-loading signal               |
| `visibilitychange` | Visibility state changed                                                 | ❌ Unrelated to resource completion                  |

The exact semantics should be understood from the lifecycle rather than memorized as timestamps.

---

# 30. `pageshow`

### 🟢 [Daily Driver]

`pageshow` fires when a document becomes visible in its browsing context.

Critically, this can happen during:

```text
Fresh navigation
```

and:

```text
History restoration
```

including BFCache restoration.

That makes it more useful than thinking:

```text
pageshow = page loaded
```

---

# 31. BFCache

### 🔴 [Production-Critical]

The **back-forward cache (BFCache)** allows browsers to preserve a previous page state so that history navigation can restore it much faster than performing a complete new navigation.

Conceptually:

```text
Page A
  │
  ▼
Navigate to B
  │
  ▼
Page B active

Back
  │
  ▼
Restore Page A
```

Potentially:

```text
A's previous document state
        ↓
BFCache
        ↓
Restore
```

This can make:

```text
Back
Forward
```

feel nearly instantaneous.

---

# 32. BFCache Changes Your Mental Model

Without BFCache, you might think:

```text
Back
 ↓
GET page
 ↓
Parse
 ↓
Render
```

But with BFCache:

```text
Back
 ↓
Restore existing page state
 ↓
pageshow
```

This means initialization code that assumes a fresh document can behave incorrectly.

---

# 33. `pageshow` and `persisted`

The event provides information that can help distinguish restoration scenarios.

Conceptually:

```javascript
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    console.log("Restored from persisted page state");
  }
});
```

The exact interpretation should follow current platform semantics, but the engineering idea is:

> **A page becoming visible again does not necessarily mean it was freshly created.**

---

# 34. `pagehide`

`pagehide` signals that a document is being hidden as its browsing context transitions away.

This is important because:

```text
pagehide
≠
document immediately destroyed
```

A document can potentially be entering BFCache.

Therefore:

```text
pagehide
   ↓
Maybe discarded
Maybe persisted/restored later
```

---

# 35. Why `unload` Is a Poor Lifecycle Foundation

Historically developers used:

```javascript
window.addEventListener("unload", ...)
```

for cleanup and analytics.

Modern browsers strongly favor lifecycle-aware mechanisms such as:

```text
visibilitychange
pagehide
pageshow
```

because pages may be:

* cached,
* frozen,
* restored,
* discarded,
* terminated without a normal unload sequence.

A senior engineer should not design critical correctness logic around assuming `unload` always runs.

---

# 36. `visibilitychange`

### 🟢 [Daily Driver]

The document has a visibility state.

Typical states include:

```text
visible
hidden
```

You can observe changes:

```javascript
document.addEventListener("visibilitychange", () => {
  console.log(document.visibilityState);
});
```

This is useful for:

* pausing nonessential activity,
* reducing polling,
* stopping visual work,
* analytics lifecycle handling,
* background resource management.

---

# 37. Visibility vs Page Lifecycle

These are related but not identical.

```text
Visibility
    ↓
Is the document currently visible?
```

Whereas lifecycle encompasses broader states/transitions such as:

```text
Active
Hidden
Frozen
Restored
Discarded
```

A browser can apply lifecycle policies beyond simply changing a boolean visibility flag.

---

# 38. Page Freezing

Browsers can freeze pages to reduce resource consumption.

Conceptually:

```text
Active
  ↓
Hidden
  ↓
Frozen
```

While frozen, certain execution activities may be suspended.

This is especially relevant to:

* background tabs,
* mobile browsers,
* resource conservation,
* timers,
* background JavaScript.

Therefore:

> A hidden page should not be treated as a normal foreground page running continuously.

---

# 39. Page Discarding

Under memory/resource pressure, a browser may discard a background page.

Conceptually:

```text
Active Page
    ↓
Hidden
    ↓
Resource pressure
    ↓
Discarded
```

Later:

```text
User returns
    ↓
Page may need to be recreated
```

This has important implications for state management.

---

# 40. BFCache vs Discarding

These are not equivalent.

### BFCache

```text
Document state preserved
       ↓
Fast restoration
```

### Discarding

```text
Document terminated/discarded
       ↓
State may need reconstruction
```

This distinction matters when building resilient applications.

---

# 41. Full Navigation Timeline

A conceptual traditional navigation:

```text
User clicks link
       │
       ▼
Navigation initiated
       │
       ▼
Resolve URL
       │
       ▼
Navigation processing
       │
       ├── Cache?
       ├── Service Worker?
       ├── Redirect?
       └── Network?
              │
              ▼
        Response received
              │
              ▼
        Document created
              │
              ▼
        HTML parsing
              │
       ┌──────┴─────────┐
       │                │
       ▼                ▼
    DOM build      Resource discovery
       │                │
       └──────┬─────────┘
              ▼
        Script / CSS
              │
              ▼
       DOMContentLoaded
              │
              ▼
          Rendering
              │
              ▼
             load
              │
              ▼
        Interactive page
```

This is a **conceptual timeline**, not a promise that every browser executes every stage strictly serially.

---

# 42. Important Correction: Loading Is Not One Linear Pipeline

A naive model says:

```text
DNS
 ↓
HTTP
 ↓
HTML
 ↓
CSS
 ↓
JS
 ↓
Render
```

Real browsers overlap work.

For example:

```text
HTML parser
   │
   ├── discover CSS ──────► network
   │
   ├── discover JS ───────► network
   │
   └── continue parsing
```

Meanwhile:

```text
Network
 ├── CSS response
 ├── JS response
 └── image response
```

can happen concurrently with other browser activities.

This is why network waterfalls are so useful.

---

# 43. Resource Discovery

While parsing HTML, the browser discovers subresources:

```html
<link rel="stylesheet" href="/app.css">
<script src="/app.js"></script>
<img src="/hero.webp">
```

Conceptually:

```text
HTML Parser
    │
    ├── CSS ──────► Resource loading
    ├── JS ───────► Resource loading
    └── Image ────► Resource loading
```

This means navigation and parsing interact strongly with networking.

---

# 44. Navigation and Rendering Are Interdependent

The browser cannot simply:

```text
download everything
 ↓
then start rendering
```

Modern browsers try to make useful progress as early as possible.

Therefore:

```text
Parsing
  ↕
Resource discovery
  ↕
Network
  ↕
DOM/CSS processing
  ↕
Rendering
```

These systems overlap.

---

# 45. SPA Navigation Is Different

Consider:

```javascript
history.pushState({}, "", "/dashboard");
```

The URL changes.

But:

```text
New Document?
```

Not necessarily.

A React/Next.js client-side navigation can instead look conceptually like:

```text
Existing Document
      │
      ▼
Router state changes
      │
      ▼
Fetch / retrieve application data/code
      │
      ▼
React update
      │
      ▼
DOM changes
      │
      ▼
Browser rendering
```

The browsing context may retain the same document.

---

# 46. Traditional Navigation vs SPA Navigation

| Traditional Navigation                | SPA / Client Navigation                |
| ------------------------------------- | -------------------------------------- |
| New document commonly created         | Existing document may remain           |
| Browser navigation lifecycle involved | Application router lifecycle involved  |
| HTML document fetched/processed       | Data/code may be fetched instead       |
| New JS environment                    | Existing JS environment often retained |
| Document lifecycle restarts           | Application state may survive          |
| Browser page events occur             | Framework/router events may dominate   |

This distinction is essential when debugging React/Next.js applications.

---

# 47. React Connection

A full document navigation can look roughly like:

```text
Browser Navigation
      ↓
HTML Response
      ↓
HTML Parsing
      ↓
JavaScript
      ↓
React bootstrapping
      ↓
Hydration
      ↓
Application becomes interactive
```

A client navigation may instead be:

```text
Existing React Application
      ↓
Router transition
      ↓
Data / RSC / code retrieval
      ↓
React rendering
      ↓
DOM commit
      ↓
Browser rendering
```

The browser lifecycle and React lifecycle are therefore **not interchangeable**.

---

# 48. Next.js Connection

In a modern Next.js application, you may have:

```text
Initial request
     ↓
Server-side response
     ↓
HTML
     +
React Server Component payload / framework data
     ↓
Browser
     ↓
Hydration / client activation
```

Then subsequent navigation may happen without replacing the entire document.

Conceptually:

```text
Initial Load
     ↓
Document Navigation

Later Navigation
     ↓
Application Router Navigation
```

This is why a Next.js application can exhibit different behavior on:

```text
Initial page load
```

versus:

```text
Client-side navigation
```

---

# 49. Initial Load vs Client Navigation

A production performance investigation must first ask:

> **Are we measuring a full document navigation or an in-app navigation?**

Because these can involve very different costs.

### Initial load

```text
DNS
 ↓
Connection
 ↓
HTML
 ↓
Parse
 ↓
JS
 ↓
Hydration
 ↓
Render
```

### Client navigation

```text
Existing runtime
 ↓
Router
 ↓
Data/code
 ↓
React update
 ↓
DOM update
 ↓
Render
```

---

# 50. `DOMContentLoaded` in an SPA

This creates an important trap.

If you have:

```text
Initial document
```

then:

```text
DOMContentLoaded
```

occurs for that document.

If React later navigates:

```text
/dashboard
→
/settings
```

you generally do **not** get another document-level `DOMContentLoaded` simply because the application's route changed.

The document remains the same.

---

# 51. Same Document Navigation

Browser history APIs can modify session history without replacing the document.

Examples:

```javascript
history.pushState(...)
history.replaceState(...)
```

Then:

```text
URL
 ↓
History state
```

can change while:

```text
Document
 ↓
remains active
```

This is fundamental to client-side routers.

---

# 52. `popstate`

When the active history entry changes in ways that invoke history traversal, applications can observe relevant state through:

```javascript
window.addEventListener("popstate", ...)
```

But again:

```text
popstate
≠
new document
```

This distinction is critical.

---

# 53. History Model

Conceptually:

```text
Session History

[A] /home
      │
      ▼
[B] /products
      │
      ▼
[C] /checkout
```

Back:

```text
[C]
 ↓
[B]
```

Forward:

```text
[B]
 ↓
[C]
```

The browser may restore a previous document or state rather than perform a fresh network navigation.

---

# 54. BFCache + History

This produces:

```text
History
   │
   ├── previous document
   │
   └── current document
```

When moving backward:

```text
Back
 ↓
BFCache restoration
 ↓
pageshow
```

Potentially without:

```text
DNS
TLS
HTTP
HTML parsing
```

This is one of the biggest reasons lifecycle assumptions based purely on network requests fail.

---

# 🧪 LAYER 3 — DIAGNOSTIC LABS & DEVTOOLS RUNBOOKS

# 55. Lab 1 — Observe Navigation Timing

Open:

```text
Chrome DevTools
 → Network
```

Reload a page.

Inspect the main document request.

Look at timing information such as:

```text
Queueing
Stalled
DNS
Initial connection
SSL
Request sent
Waiting
Content download
```

Your goal is not to memorize labels.

Ask:

```text
Where did the latency occur?
```

---

# 56. Lab 2 — Observe the Navigation Waterfall

Look at:

```text
Document
CSS
JS
Fonts
Images
API requests
```

You should be able to reason:

```text
HTML
 │
 ├── discovers CSS
 ├── discovers JS
 └── discovers image
```

and compare this against the actual waterfall.

### Senior question

> Why did resource B start later than resource A?

Don't answer:

> "Because the browser loads things sequentially."

Investigate:

* discovery timing,
* parser behavior,
* priority,
* connection availability,
* cache,
* dependency relationships.

---

# 57. Lab 3 — Observe `DOMContentLoaded` vs `load`

Run:

```javascript
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded", performance.now());
});

window.addEventListener("load", () => {
  console.log("load", performance.now());
});
```

Reload the page.

You should observe:

```text
DOMContentLoaded
      ↓
load
```

typically in that order for a normal navigation.

Then introduce a slow resource and observe how the relationship changes.

---

# 58. Lab 4 — Observe Visibility

Run:

```javascript
document.addEventListener("visibilitychange", () => {
  console.log(
    "visibility:",
    document.visibilityState
  );
});
```

Then:

1. Open the page.
2. Switch to another tab.
3. Return.
4. Minimize the browser where applicable.
5. Observe state changes.

Think:

```text
Visible
  ↓
Hidden
  ↓
Visible
```

This is a lifecycle signal, not a network event.

---

# 59. Lab 5 — Observe `pageshow` / `pagehide`

Run:

```javascript
window.addEventListener("pageshow", (event) => {
  console.log("pageshow", {
    persisted: event.persisted
  });
});

window.addEventListener("pagehide", (event) => {
  console.log("pagehide", {
    persisted: event.persisted
  });
});
```

Navigate:

```text
A → B → Back to A
```

Observe whether the browser restored a persisted page state.

---

# 60. Lab 6 — Test BFCache

A useful diagnostic sequence:

```text
Page A
 ↓
Page B
 ↓
Back
```

Use:

```text
Chrome DevTools
 → Application
 → Back/forward cache
```

where supported.

The browser can report reasons a page was not eligible for BFCache.

This is extremely valuable in production performance work.

---

# 61. What to Investigate in BFCache Diagnostics

If BFCache is not used, ask:

```text
Why?
```

Potential blockers can include browser/platform constraints and page behaviors such as certain lifecycle/event patterns or resources that prevent safe freezing/restoration.

Do not memorize a static blocker list as universal truth.

Instead use:

```text
Browser diagnostic
 ↓
Eligibility reason
 ↓
Specific page behavior
 ↓
Fix
 ↓
Re-test
```

---

# 62. Lab 7 — Observe Full Navigation vs SPA Navigation

Take a React/Next.js application.

Perform:

```text
Hard reload
```

and then:

```text
Client-side route navigation
```

Compare:

```text
Network
Performance
Document requests
JS execution
React work
DOM changes
```

You should see that the two operations can have very different execution paths.

---

# 63. Lab 8 — Navigation Timing API

Run:

```javascript
const navigation =
  performance.getEntriesByType("navigation")[0];

console.table({
  type: navigation.type,
  startTime: navigation.startTime,
  responseStart: navigation.responseStart,
  responseEnd: navigation.responseEnd,
  domInteractive: navigation.domInteractive,
  domContentLoaded:
    navigation.domContentLoadedEventEnd,
  loadEventEnd:
    navigation.loadEventEnd
});
```

This provides a browser-observable view of navigation timing.

---

# 64. `PerformanceNavigationTiming`

The Navigation Timing API exposes structured timing information for the document navigation.

Conceptually:

```text
Navigation
   │
   ├── requestStart
   ├── responseStart
   ├── responseEnd
   ├── domInteractive
   ├── DOMContentLoaded
   └── loadEventEnd
```

These measurements allow you to move from:

> "The page feels slow."

to:

> "The document response arrived quickly, but DOM processing completed much later."

---

# 65. Important Diagnostic Rule

Never treat:

```text
loadEventEnd
```

as:

```text
"user can use the application now"
```

Modern applications can involve:

```text
Hydration
React work
data fetching
client-side initialization
fonts
lazy content
third-party scripts
```

after or around traditional load milestones.

User-perceived readiness is a separate concern.

---

# 🎯 LAYER 4 — THE CRUCIBLE

# 66. Prediction Challenge #1

Given:

```javascript
console.log("A");

window.addEventListener("load", () => {
  console.log("B");
});

document.addEventListener("DOMContentLoaded", () => {
  console.log("C");
});

console.log("D");
```

What ordering should you expect?

### Solution

For a normal document lifecycle:

```text
A
D
C
B
```

The initial script executes first.

Then the document reaches DOM readiness before the later load event.

The exact broader timeline depends on document/resource conditions, but `DOMContentLoaded` is conceptually earlier than `load`.

---

# 67. Prediction Challenge #2

Suppose a user performs:

```text
/products
→
/checkout
→
Back
```

Does Back necessarily mean:

```text
GET /products
```

?

### Solution

No.

The browser may restore `/products` from BFCache.

That can avoid a new network/document-loading pipeline.

This is precisely why lifecycle-aware code should not assume:

```text
Back = fresh navigation
```

---

# 68. Prediction Challenge #3

Does this:

```javascript
history.pushState({}, "", "/dashboard");
```

necessarily create a new `Document`?

### Solution

No.

It can modify the session history and URL while retaining the existing document.

This is a fundamental mechanism behind many SPA routers.

---

# 69. Prediction Challenge #4

If a React router navigates:

```text
/products
→
/settings
```

does `DOMContentLoaded` fire again?

### Solution

Normally no.

If the existing document remains active, this is an application-level navigation rather than a new document lifecycle.

The browser's document-level `DOMContentLoaded` event is not re-fired simply because React changed the route.

---

# 70. Prediction Challenge #5

Which is more accurate?

### A

```text
DOMContentLoaded
=
page completely loaded
```

### B

```text
DOMContentLoaded
=
DOM has reached the corresponding readiness point
```

### Solution

**B.**

`DOMContentLoaded` does not mean every resource is loaded or that the application is fully usable.

---

# 71. Prediction Challenge #6

A page registers:

```javascript
window.addEventListener("pagehide", () => {
  saveEverythingToServer();
});
```

Is this guaranteed to run whenever the user leaves the page?

### Solution

No.

Page lifecycle transitions are more complex than assuming a normal unload sequence.

Critical persistence should not depend solely on a last-moment lifecycle callback.

Use appropriate persistence strategies earlier in the user flow and lifecycle-aware APIs.

---

# 72. Prediction Challenge #7

Which can happen without a fresh HTTP request?

```text
A. BFCache restoration
B. Some same-document history navigation
C. Service-worker cache response
D. All of the above
```

### Solution

**D**, with an important distinction:

* BFCache restoration can restore an existing document.
* Same-document navigation can change URL/history without fetching a new document.
* A service worker can satisfy a request without contacting the origin server.

The mechanisms are different even though they can all alter the naive "every navigation = origin request" model.

---

# 73. Production Trace #1 — "Back Button Is Slow"

## Symptom

Users report:

> "Going back from checkout to the product page takes two seconds."

### Initial assumption

```text
Backend API is slow.
```

### Investigation

Check:

```text
DevTools
 → Application
 → Back/forward cache
```

Suppose:

```text
BFCache not used
Reason:
page not eligible
```

Then inspect lifecycle blockers.

### Better reasoning

```text
Back navigation
      ↓
Expected BFCache restoration
      ↓
Not eligible
      ↓
Fresh document navigation
      ↓
Network + parse + JS + render
      ↓
2-second delay
```

The problem is not necessarily the backend.

It may be:

> **The page lost a browser optimization opportunity because its lifecycle architecture prevented BFCache restoration.**

---

# 74. Production Trace #2 — "`DOMContentLoaded` Is Fast but Page Feels Slow"

## Metrics

```text
DOMContentLoaded = 700ms
load              = 1.2s
User interaction  = 3.5s
```

A developer says:

> "Our page loads in 700ms."

That's an invalid conclusion.

Possible architecture:

```text
DOMContentLoaded
       ↓
React hydration
       ↓
Large JS execution
       ↓
API requests
       ↓
State initialization
       ↓
Long task
       ↓
Interactive experience
```

The traditional lifecycle event does not capture the entire user experience.

---

# 75. Production Trace #3 — "Analytics Fires Twice"

## Symptom

An analytics event fires twice when users navigate back to a page.

### Initial implementation

```javascript
window.addEventListener("pageshow", () => {
  sendAnalytics("page_view");
});
```

### Problem

The page can become visible through:

```text
Fresh navigation
```

and:

```text
BFCache restoration
```

Therefore `pageshow` should not automatically be interpreted as:

```text
"brand-new document created"
```

The analytics model needs to distinguish:

```text
initial page view
```

from:

```text
restored page visibility
```

depending on the business requirement.

---

# 76. Production Trace #4 — "Polling Continues While Tab Is Hidden"

## Code

```javascript
setInterval(() => {
  fetch("/api/status");
}, 5000);
```

### Problem

The page becomes hidden.

Browser lifecycle policies may throttle background activity, but the application still conceptually treats the page as permanently active.

### Better architecture

Use lifecycle/visibility signals:

```text
visible
   ↓
normal polling

hidden
   ↓
reduce / pause nonessential polling
```

Then refresh state appropriately when the page becomes visible again.

---

# 77. Senior Interview Gotcha #1

> **"Every navigation creates a new page."**

Incorrect.

A browser can perform:

```text
New Document Navigation
```

but also:

```text
Same-document navigation
BFCache restoration
Prerender activation
History restoration
```

These have materially different lifecycle behavior.

---

# 78. Senior Interview Gotcha #2

> **"`load` means the page is ready for the user."**

Incorrect.

`load` is a browser document-loading milestone.

It does not directly represent:

```text
application interactive
```

or:

```text
excellent user experience
```

Modern applications can continue substantial work afterward.

---

# 79. Senior Interview Gotcha #3

> **"`DOMContentLoaded` means all JavaScript has finished."**

Incorrect/incomplete.

It relates to DOM readiness and the loading/execution semantics of relevant scripts, particularly parser/defer/module behavior.

It does not mean:

```text
all asynchronous application JavaScript
```

has completed.

---

# 80. Senior Interview Gotcha #4

> **"Back navigation always reloads the page."**

Incorrect.

BFCache can restore an existing page state.

This can skip:

```text
DNS
connection
HTTP
HTML parsing
```

entirely.

---

# 81. Senior Interview Gotcha #5

> **"`history.pushState()` navigates to a new document."**

Incorrect.

It can update the URL and session history without replacing the current document.

That distinction is foundational to SPA routing.

---

# 82. Senior Engineering Decision Matrix

| Mechanism          | Rely on It For                            | Don't Rely on It For         | Key Tradeoff                            |
| ------------------ | ----------------------------------------- | ---------------------------- | --------------------------------------- |
| `DOMContentLoaded` | DOM readiness milestone                   | User-perceived readiness     | Too early for many app-level operations |
| `load`             | Traditional document/resource completion  | UX readiness                 | Can be much later than useful UI        |
| `visibilitychange` | Visibility-aware background work          | Complete lifecycle model     | Visibility ≠ destruction                |
| `pagehide`         | Lifecycle-aware transition handling       | Guaranteed final persistence | Page may be cached                      |
| `pageshow`         | Detecting document visibility/restoration | Fresh-load detection alone   | Can fire on restoration                 |
| BFCache            | Fast history restoration                  | Application-controlled cache | Eligibility constraints                 |
| History API        | Same-document URL/history changes         | Full document replacement    | Application must manage state           |
| Service Worker     | Offline/interception architecture         | Universal network bypass     | Cache correctness complexity            |

---

# 83. Production Architecture Pattern

## ❌ Naive Architecture

```text
Page Load
   ↓
Initialize everything

Unload
   ↓
Save everything
   ↓
Destroy everything
```

This assumes:

```text
load → use → unload
```

is the universal lifecycle.

It isn't.

---

## ✅ Better Architecture

```text
Initial document
      │
      ▼
Initialize
      │
      ▼
Active
      │
      ├──── visibilitychange ────► hidden
      │                              │
      │                              ▼
      │                         Reduce work
      │
      ├──── pagehide ───────────► lifecycle transition
      │
      └──── pageshow ───────────► active/restored
                                     │
                                     ▼
                                Revalidate state
```

This architecture treats lifecycle as dynamic.

---

# 84. State Ownership Implication

Ask:

> Where does important application state live?

If state exists only in memory:

```text
JavaScript heap
     ↓
Document discarded
     ↓
State gone
```

If state is persisted appropriately:

```text
Application state
      ↓
Durable storage / server
      ↓
Document recreation
      ↓
State restoration
```

This becomes especially important for:

* mobile browsers,
* tab discarding,
* crashes,
* BFCache transitions,
* offline applications.

---

# 85. React Lifecycle vs Browser Lifecycle

Never collapse these into one thing.

```text
BROWSER
│
├── Navigation
├── Document lifecycle
├── Visibility
├── BFCache
└── Page lifecycle
       │
       ▼
REACT
│
├── Render
├── Commit
├── Effects
└── Component lifecycle
```

They interact:

```text
Browser lifecycle
      ↓
React runtime remains / is recreated
      ↓
React components respond accordingly
```

But they are separate systems.

---

# 86. Next.js Mental Model

For Next.js, think:

```text
BROWSER DOCUMENT
       │
       ├── Initial navigation
       │       ↓
       │    HTML + framework payload
       │       ↓
       │    React activation
       │
       └── Client navigation
               ↓
           Router
               ↓
          Framework data
               ↓
          React update
               ↓
          DOM update
```

This explains why:

```text
full reload
```

and:

```text
router navigation
```

can have completely different performance profiles.

---

# 87. Diagnostic Workflow

When someone reports:

> "Navigation is slow."

Do **not** immediately modify React code.

Use:

```text
SYMPTOM
  ↓
What type of navigation?
  ↓
Full document?
Same-document?
History traversal?
BFCache restoration?
SPA route transition?
  ↓
Network involved?
  ↓
Cache?
Service Worker?
Redirect?
  ↓
Document processing?
  ↓
JavaScript?
  ↓
React?
  ↓
Rendering?
  ↓
Root cause
```

This prevents framework-first debugging.

---

# 88. Senior Navigation Debugging Checklist

When diagnosing navigation:

```text
[ ] What initiated the navigation?
[ ] Is it a new document?
[ ] Is it same-document?
[ ] Is it history traversal?
[ ] Is BFCache involved?
[ ] Is a service worker involved?
[ ] Was there a redirect?
[ ] Was DNS required?
[ ] Was a connection reused?
[ ] Was the response cached?
[ ] When did responseStart occur?
[ ] When did responseEnd occur?
[ ] When did DOM become interactive?
[ ] When did DOMContentLoaded occur?
[ ] When did load occur?
[ ] Was hydration expensive?
[ ] Was client-side initialization expensive?
[ ] Were there long tasks?
[ ] Did rendering become the bottleneck?
```

---

# 89. The Complete Mental Model

You should now be able to visualize a page transition as:

```text
                         USER
                          │
                          ▼
                  Navigation Initiation
                          │
                          ▼
                    URL Resolution
                          │
                          ▼
                Browser Navigation System
                          │
             ┌────────────┼────────────┐
             │            │            │
             ▼            ▼            ▼
           Cache      Service Worker  History
             │            │            │
             └────────────┼────────────┘
                          ▼
                    Retrieval Path
                          │
                    ┌─────┴─────┐
                    │           │
                  Cache      Network
                                │
                       ┌────────┼────────┐
                       ▼        ▼        ▼
                      DNS   Connection  TLS
                                │
                                ▼
                              HTTP
                                │
                                ▼
                            Response
                                │
                                ▼
                            Document
                                │
                                ▼
                         HTML Processing
                                │
                       ┌────────┴────────┐
                       ▼                 ▼
                      DOM          Resource Discovery
                       │                 │
                       └────────┬────────┘
                                ▼
                         JS / CSS / Assets
                                │
                                ▼
                      DOMContentLoaded
                                │
                                ▼
                           Rendering
                                │
                                ▼
                              load
                                │
                                ▼
                         Active Document
```

And when leaving:

```text
Active
  │
  ▼
Hidden
  │
  ├── Frozen
  │
  ├── BFCache
  │
  └── Discarded
```

Later:

```text
BFCache
   ↓
pageshow
   ↓
Restored Document
```

or:

```text
Discarded
   ↓
New Navigation / Recreation
   ↓
New Document
```

---

# 90. 🔬 Advanced: Navigation Types

The browser can expose navigation information such as:

```javascript
performance.getEntriesByType("navigation")[0].type
```

Conceptually useful categories include:

```text
navigate
reload
back_forward
prerender
```

The exact available values and semantics should be checked against the current platform API documentation.

The important engineering principle is:

> **Do not assume every page entry into your application represents the same navigation mechanism.**

---

# 91. 🔬 Advanced: Prerendering

Modern browsers can sometimes prepare a page before the user activates it.

Conceptually:

```text
Prediction
    ↓
Browser prepares page
    ↓
Prerendered document
    ↓
User navigates
    ↓
Activation
```

This can dramatically change perceived navigation latency.

But it introduces another important distinction:

```text
Prepared
≠
Activated
```

Application code should understand that the browser may execute preparatory work before the user actually views the page.

This is particularly relevant to:

* analytics,
* network requests,
* expensive initialization,
* side effects.

---

# 92. 🔬 Advanced: Navigation Observability

At senior level, don't rely on one metric.

Build a timeline:

```text
Navigation Start
       │
       ▼
Request
       │
       ▼
Response
       │
       ▼
DOM Interactive
       │
       ▼
DOMContentLoaded
       │
       ▼
First useful rendering
       │
       ▼
Application interactive
       │
       ▼
User interaction
```

Then determine where the actual delay lives.

---

# 93. 🔬 Advanced: Navigation Timing ≠ User Experience

This distinction should become automatic:

```text
Browser milestone
        ≠
Application milestone
        ≠
User-perceived milestone
```

For example:

```text
load = 1.0s
```

while:

```text
React hydration = 2.0s
```

and:

```text
first meaningful interaction = 2.8s
```

A single lifecycle event cannot describe the whole experience.

---

# 94. 🧠 FIVE RULES TO MEMORIZE

### Rule 1

```text
Navigation ≠ HTTP request
```

### Rule 2

```text
DOMContentLoaded ≠ everything loaded
```

### Rule 3

```text
load ≠ application ready
```

### Rule 4

```text
Back/Forward ≠ guaranteed fresh navigation
```

### Rule 5

```text
Browser lifecycle ≠ React lifecycle
```

These five distinctions eliminate a surprising amount of senior-level confusion.

---

# ⚡ FINAL EXECUTIVE CHEAT SHEET

| Concept            | Why It Exists                                        | Mental Model                                       | Most Common Mistake                 |
| ------------------ | ---------------------------------------------------- | -------------------------------------------------- | ----------------------------------- |
| Navigation         | Move a browsing context to another resource/document | Browser lifecycle operation                        | Equating it to HTTP                 |
| URL                | Identifies a resource/location                       | Scheme + authority + path + etc.                   | Confusing URL with origin           |
| Origin             | Security identity                                    | Scheme + host + port                               | Treating subdomains as same-origin  |
| Redirect           | Changes navigation target                            | Request A → response → Request B                   | Looking only at final request       |
| `DOMContentLoaded` | DOM readiness milestone                              | Parsed DOM + relevant script semantics             | Calling it "fully loaded"           |
| `load`             | Traditional document load completion                 | Later loading milestone                            | Calling it "interactive"            |
| `pageshow`         | Document becomes visible/active                      | Fresh load or restoration                          | Assuming fresh navigation           |
| `pagehide`         | Document becomes hidden                              | Lifecycle transition                               | Assuming destruction                |
| Visibility         | Tells whether page is visible                        | visible ↔ hidden                                   | Treating it as full lifecycle       |
| BFCache            | Fast history restoration                             | Existing document state restored                   | Assuming back reloads               |
| History API        | Same-document navigation/state                       | URL/history without necessarily replacing document | Expecting DOMContentLoaded          |
| SPA Navigation     | Application-level route transition                   | Existing document + router                         | Treating it as browser navigation   |
| Service Worker     | Intercept/handle requests                            | Page → SW → cache/network                          | Assuming origin is always contacted |

---

# 🧩 PREVIOUS KNOWLEDGE CONNECTION

You now connect:

```text
PART 01
Browser Architecture
        ↓
PART 02
Processes
        ↓
PART 03
Renderer/Main Thread
        ↓
PART 04
Scheduling
        ↓
PART 05
Navigation Lifecycle
```

The important relationship is:

```text
Navigation
    ↓
Browser Process
    ↓
Renderer Process
    ↓
Document
    ↓
Main Thread
    ↓
Tasks / Microtasks
    ↓
Parsing / Script / Rendering
```

---

# 🔭 FORWARD CONNECTION

This part directly unlocks:

```text
Navigation
    ↓
HTML Parsing
    ↓
Tokenization
    ↓
DOM Construction
    ↓
Parser Blocking
    ↓
Resource Discovery
    ↓
CSSOM
    ↓
Rendering Pipeline
```

Later:

```text
Navigation
    ↓
Performance Timing
    ↓
Core Web Vitals
    ↓
React Hydration
    ↓
Next.js Rendering Architecture
```

And:

```text
Navigation
    ↓
BFCache
    ↓
Page Lifecycle
    ↓
State Persistence
    ↓
Production Resilience
```

---

# 🎯 PART 05 COMPLETION CHECKLIST

```text
[x] Navigation mental model
[x] Browsing context
[x] URL vs origin
[x] Navigation initiation
[x] URL resolution
[x] Redirects
[x] DNS relationship
[x] Connection establishment
[x] TLS relationship
[x] HTTP retrieval
[x] Response handling
[x] Browser cache relationship
[x] Service Worker relationship
[x] Document creation
[x] Document vs Window
[x] DOMContentLoaded
[x] load
[x] pageshow
[x] pagehide
[x] visibilitychange
[x] Page freezing concept
[x] Page discarding concept
[x] BFCache
[x] History API
[x] popstate relationship
[x] Same-document navigation
[x] SPA navigation
[x] React relationship
[x] Next.js relationship
[x] Navigation Timing
[x] DevTools navigation diagnostics
[x] BFCache diagnostics
[x] Production scenarios
[x] Prediction challenges
[x] Senior interview gotchas
[x] Engineering decision matrix
[x] 4-layer architecture
```

---

# 🧠 SENIOR-LEVEL TAKEAWAY

The most important mental shift from this part is:

> **A web page is not simply "loaded" or "unloaded." It moves through a browser-managed lifecycle, and the browser may create, activate, hide, freeze, preserve, restore, or discard document state through several different mechanisms.**

So when someone says:

> **"The page navigated."**

your Senior Engineer brain should immediately ask:

```text
What kind of navigation?
        ↓
New document?
Same document?
History traversal?
BFCache restoration?
Prerender activation?
SPA transition?
        ↓
Was the network involved?
        ↓
Was a document created?
        ↓
Which lifecycle signals fired?
        ↓
What work actually consumed the time?
```

That is the difference between **knowing browser events** and actually understanding the **browser navigation system**.

---

[⬅️ Part 04: Event Loop & Scheduling](./04-browser-event-loop-tasks-rendering.md) | [📚 KPI 01 Index](./README.md) | [🧪 Lab 01](./examples/01-main-thread-vs-compositor-lab.html) | [🧪 Lab 02](./examples/02-layout-thrashing-benchmark-lab.html) | [🧪 Lab 03](./examples/03-event-loop-microtask-starvation-lab.html) | [🧪 Lab 04](./examples/05-page-lifecycle-bfcache-lab.html) | [📋 Runbook](./examples/04-process-inspection-runbook.md) | [Part 06: Site Isolation & Security Boundaries ➡️](./06-site-isolation-security-boundaries.md)
