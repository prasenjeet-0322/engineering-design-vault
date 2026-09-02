# KPI 02 — Part 10: Navigation Timing & Measurement

[⬅️ Part 09: SPA / React / Next.js Navigation](./09-spa-react-nextjs-navigation.md) | [📚 KPI 02 Index](./README.md) | [🧪 Lab 01](./examples/01-navigation-lifecycle-timeline-lab.html) | [🧪 Lab 02](./examples/02-dns-connection-benchmark-lab.html) | [🧪 Lab 03](./examples/03-tls-handshake-certificate-lab.html) | [🧪 Lab 04](./examples/04-http-stream-cache-waterfall-lab.html) | [🧪 Lab 05](./examples/05-critical-rendering-path-priority-lab.html) | [🧪 Lab 06](./examples/06-event-loop-long-task-scheduler-lab.html) | [🧪 Lab 07](./examples/07-dom-event-propagation-delegation-lab.html) | [🧪 Lab 08](./examples/08-form-submission-validation-lab.html) | [🧪 Lab 10](./examples/10-navigation-timing-telemetry-lab.html) | [Part 11: Production Failure Traces & Crucible ➡️](./11-production-failure-traces-crucible.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer \| Founding Engineer)

---

# 🧭 PART POSITION

This part focuses on learning how to measure a browser navigation as an actual system rather than vaguely claiming "the page is slow":

> **"Which phase of the navigation consumed the time? Was it DNS, connection establishment, TLS negotiation, request transmission, server waiting time (TTFB), content download, DOM construction, deferred script execution, or load-event dispatch?"**

---

# LAYER 1 — ⚡ 30-SECOND EXECUTIVE CHEAT SHEET

When a browser navigates, don't think:

```text
click → page loaded
```

Think:

```text
Navigation
   │
   ├── Navigation start
   │
   ├── Redirect processing
   │
   ├── Request / connection work
   │
   ├── Response arrival
   │
   ├── Document processing
   │
   ├── DOM milestones
   │
   ├── DOMContentLoaded
   │
   ├── load
   │
   └── final navigation state
```

The browser exposes timing information through:

```javascript
performance.getEntriesByType("navigation")
```

which returns a:

```text
PerformanceNavigationTiming
```

entry.

The key Senior-level question is:

> **Which phase consumed the time?**

Not:

> "What is the page-load time?"

---

# 1. THE FUNDAMENTAL MODEL

A navigation has multiple phases.

A simplified model:

```text
┌─────────────────────────────────────────────────────────────┐
│                       NAVIGATION                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Navigation start                                          │
│       ↓                                                     │
│  Redirects                                                 │
│       ↓                                                     │
│  Request / connection                                      │
│       ↓                                                     │
│  Response                                                   │
│       ↓                                                     │
│  Document processing                                       │
│       ↓                                                     │
│  DOM construction                                          │
│       ↓                                                     │
│  DOMContentLoaded                                          │
│       ↓                                                     │
│  load                                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

The timing API allows us to put timestamps around these phases.

---

# 2. WHY NAVIGATION TIMING EXISTS

Suppose a user reports:

> "The dashboard takes five seconds to open."

That statement is almost useless diagnostically.

Five seconds could mean:

```text
DNS / connection:
4.2 s

Server response:
0.2 s

Document processing:
0.3 s

Everything else:
0.3 s
```

or:

```text
Network:
0.3 s

Server:
0.2 s

Browser/document processing:
4.5 s
```

The remediation is completely different.

Therefore:

```text
Perceived slowness
       ↓
Measurement
       ↓
Phase attribution
       ↓
Root cause
```

---

# 3. 🟢 [DAILY DRIVER] — PERFORMANCE NAVIGATION TIMING

The browser exposes navigation timing through the Performance Timeline.

Start with:

```javascript
const navigation =
  performance.getEntriesByType("navigation")[0];
```

Then:

```javascript
console.log(navigation);
```

You will generally get a:

```text
PerformanceNavigationTiming
```

object.

---

# 4. THE NAVIGATION TIMING OBJECT

Conceptually:

```text
PerformanceNavigationTiming
│
├── startTime
├── duration
├── redirectStart
├── redirectEnd
├── fetchStart
├── domainLookupStart
├── domainLookupEnd
├── connectStart
├── connectEnd
├── secureConnectionStart
├── requestStart
├── responseStart
├── responseEnd
├── domInteractive
├── domContentLoadedEventStart
├── domContentLoadedEventEnd
├── domComplete
├── loadEventStart
├── loadEventEnd
│
└── navigation-specific information
```

Don't memorize these as random fields.

Understand their **position in the navigation timeline**.

---

# 5. THE MASTER TIMELINE

A simplified representation:

```text
time ─────────────────────────────────────────────────────────►

0
│
├── startTime
│
├──── redirectStart
│         │
│         └── redirectEnd
│
├──── fetchStart
│
├──── DNS ──────────────┐
│                       │
│                       └── domainLookupEnd
│
├──── connection ───────────────┐
│                              │
│                              └── connectEnd
│
├──── requestStart
│
├──────────────────── responseStart
│
├──────────────────────────── responseEnd
│
├──────────────────────────── domInteractive
│
├────────────────────────────── DOMContentLoaded
│
├──────────────────────────────── domComplete
│
└────────────────────────────────── load
```

This is a conceptual timeline, not a promise that every phase always incurs nonzero time.

---

# 6. `STARTTIME`

`startTime` represents the beginning of the performance entry's timeline.

For navigation timing, the navigation entry starts at:

```text
0
```

relative to the relevant performance time origin.

So:

```javascript
navigation.startTime
```

is commonly:

```text
0
```

for the navigation entry.

The important value is usually the **relative differences between timestamps**.

---

# 7. 🟡 `[MODERATE]` — TIME ORIGIN

Browser timing APIs use a performance time origin.

Conceptually:

```text
time origin
     │
     └── 0 ms
           ↓
      navigation
           ↓
      250 ms
      500 ms
      900 ms
```

This is different from treating every timestamp as a wall-clock date.

Performance timing is designed for measuring elapsed time.

---

# 8. `DURATION`

You can inspect:

```javascript
navigation.duration
```

Conceptually:

```text
duration =
time from navigation entry start
to the relevant completion point represented by the entry
```

Do not blindly interpret this as:

> "exactly how long the user perceived the page."

Perceived completion depends on:

```text
rendering
interactivity
data availability
layout
visual completion
application behavior
```

Those are broader performance concerns.

---

# 9. REDIRECT TIMING

A navigation may involve:

```text
/page
   ↓
301
   ↓
/login
   ↓
302
   ↓
/dashboard
```

Navigation timing can expose the redirect interval.

Conceptually:

```text
redirectStart
      ↓
redirect 1
      ↓
redirect 2
      ↓
redirectEnd
```

This lets you detect:

```text
unexpected redirect chains
```

---

# 10. PRODUCTION BUG — REDIRECT WATERFALL

Suppose:

```text
/user
 ↓
/auth-check
 ↓
/login
 ↓
/user
 ↓
/dashboard
```

A developer may blame:

```text
React rendering
```

when the actual problem is:

```text
navigation redirect chain
```

Navigation timing helps separate these.

---

# 11. `FETCHSTART`

`fetchStart` marks the point at which the browser begins the relevant fetch process for the resource/navigation.

Conceptually:

```text
navigation
   ↓
fetchStart
   ↓
connection/request processing
```

This is useful as a boundary when analyzing the early fetch portion of navigation.

---

# 12. DNS TIMING

Navigation timing can expose:

```javascript
navigation.domainLookupStart
navigation.domainLookupEnd
```

The difference:

```text
domainLookupEnd
-
domainLookupStart
```

gives the DNS lookup duration represented by the timing entry.

Example:

```text
domainLookupStart = 20 ms
domainLookupEnd   = 75 ms

DNS duration = 55 ms
```

### Important boundary

We are **not** learning DNS internals here.

KPI 12 will cover:

```text
DNS
TCP
TLS
HTTP
connection reuse
HTTP/2
HTTP/3
QUIC
```

Here we only learn:

> **How navigation timing exposes DNS as one measurable phase.**

---

# 13. CONNECTION TIMING

Similarly:

```javascript
navigation.connectStart
navigation.connectEnd
```

can help identify connection establishment time.

Conceptually:

```text
connectStart
      ↓
connection establishment
      ↓
connectEnd
```

Again:

**Measurement belongs here.**

**Networking mechanics belong to KPI 12.**

---

# 14. TLS TIMING

Where applicable:

```javascript
navigation.secureConnectionStart
```

can help identify the secure connection portion.

The important distinction:

```text
KPI 02:
"When did this phase occur and how long did it take?"

KPI 12:
"How does TLS actually work?"
```

This boundary prevents redundant learning.

---

# 15. REQUEST START

```javascript
navigation.requestStart
```

marks an important transition into the request phase.

Conceptually:

```text
connection preparation
       ↓
requestStart
       ↓
request transmitted / processed
       ↓
response begins
```

This lets us reason about server/network wait separately from earlier connection work.

---

# 16. `RESPONSESTART`

```javascript
navigation.responseStart
```

marks when the browser begins receiving the response represented by the navigation timing entry.

A useful approximation is:

```text
requestStart
       ↓
       waiting
       ↓
responseStart
```

This interval can reveal substantial latency.

But don't immediately label it:

```text
"server latency"
```

because network and transport behavior can contribute.

---

# 17. `RESPONSEEND`

```javascript
navigation.responseEnd
```

marks the end of receiving the response represented by the timing entry.

Conceptually:

```text
responseStart
       ↓
response bytes
       ↓
responseEnd
```

The interval:

```text
responseEnd - responseStart
```

helps characterize response transfer time.

---

# 18. 🟢 [DAILY DRIVER] — TTFB

A commonly discussed navigation metric is:

```text
TTFB
```

or:

> **Time To First Byte**

Conceptually, it measures the elapsed time until the browser receives the first byte of the response.

A simplified model:

```text
navigation start
       ↓
request
       ↓
waiting
       ↓
first response byte
```

Navigation Timing gives us the timestamps necessary to reason about this.

---

# 19. TTFB IS NOT "SERVER EXECUTION TIME"

This is a classic mistake.

Suppose TTFB is:

```text
900 ms
```

You cannot conclude:

```text
server took 900 ms to execute code
```

TTFB can include contributions from:

```text
request transmission
network latency
connection behavior
server processing
proxy/CDN behavior
queueing
response delivery
```

Therefore:

> TTFB is a **navigation/network timing measurement**, not a direct measurement of application server execution time.

---

# 20. DOM PROCESSING BEGINS

Once the response is available, browser document processing becomes increasingly important.

We then reach milestones such as:

```text
domInteractive
domContentLoadedEventStart
domContentLoadedEventEnd
domComplete
```

These belong to the document lifecycle.

---

# 21. `DOMINTERACTIVE`

```javascript
navigation.domInteractive
```

roughly identifies when the document reaches the interactive readiness milestone.

It is associated with the document having been parsed sufficiently to become interactive.

Don't interpret this as:

```text
"React has finished"
```

or:

```text
"the page is visually complete"
```

Those are different concepts.

---

# 22. `DOMCONTENTLOADEDEVENTSTART`

```javascript
navigation.domContentLoadedEventStart
```

marks the start of dispatching the `DOMContentLoaded` event.

Conceptually:

```text
HTML processing
       ↓
document ready for DOMContentLoaded
       ↓
DOMContentLoaded event starts
```

---

# 23. `DOMCONTENTLOADEDEVENTEND`

```javascript
navigation.domContentLoadedEventEnd
```

marks the end of the `DOMContentLoaded` event dispatch.

Therefore:

```text
DCL handler duration ≈

domContentLoadedEventEnd
-
domContentLoadedEventStart
```

This can be extremely useful.

---

# 24. PRODUCTION BUG — SLOW DOMCONTENTLOADED HANDLERS

Suppose:

```text
domContentLoadedEventStart = 1500 ms
domContentLoadedEventEnd   = 2100 ms
```

That suggests:

```text
~600 ms
```

was spent during the event dispatch interval represented by those timestamps.

Possible causes include:

```text
synchronous event handlers
heavy initialization
blocking JavaScript
application startup work
```

This becomes a bridge into later event-loop and performance KPIs without duplicating them.

---

# 25. `DOMCOMPLETE`

```javascript
navigation.domComplete
```

marks a later document lifecycle milestone after the document has completed parsing and related processing represented by this timing model.

It is later than:

```text
domInteractive
```

and generally associated with the document reaching a completed state before the final load event processing.

---

# 26. `LOADEVENTSTART`

```javascript
navigation.loadEventStart
```

marks the start of the `load` event processing.

Conceptually:

```text
document processing
      ↓
load event starts
```

---

# 27. `LOADEVENTEND`

```javascript
navigation.loadEventEnd
```

marks the end of the load event processing.

Therefore:

```text
load event duration ≈

loadEventEnd
-
loadEventStart
```

This can help identify expensive synchronous work performed by load handlers.

---

# 28. THE IMPORTANT DISTINCTION

Don't collapse these into one concept:

```text
DOMContentLoaded
load
visual completion
interactivity
user-perceived readiness
```

They represent different milestones.

For example:

```text
                 navigation
                     │
                     ▼
              DOMInteractive
                     │
                     ▼
          DOMContentLoaded
                     │
                     ▼
                DOMComplete
                     │
                     ▼
                   load
                     │
                     ▼
             visual completion
                     │
                     ▼
          meaningful interaction
```

The exact ordering and relationship can be affected by document/resource behavior, so this diagram is a mental model rather than a literal universal event trace.

---

# 29. WHY `LOAD` IS NOT "PAGE IS FAST"

A page can fire:

```text
load
```

and still have:

```text
large images decoding
client-side rendering work
late application data
long tasks
poor interaction responsiveness
layout instability
```

Therefore:

```text
load ≠ user experience score
```

This is why KPI 20 will later cover modern performance measurement.

---

# 30. 🧪 DIAGNOSTIC LAB — BASIC NAVIGATION TIMING

Run:

```javascript
const nav =
  performance.getEntriesByType("navigation")[0];

console.table({
  duration: nav.duration,
  redirect: nav.redirectEnd - nav.redirectStart,
  dns: nav.domainLookupEnd - nav.domainLookupStart,
  connection: nav.connectEnd - nav.connectStart,
  requestToResponse:
    nav.responseStart - nav.requestStart,
  response:
    nav.responseEnd - nav.responseStart,
  domInteractive: nav.domInteractive,
  domContentLoaded:
    nav.domContentLoadedEventEnd,
  load: nav.loadEventEnd
});
```

You have now converted the navigation into a measurable diagnostic object.

---

# 31. 🧪 DIAGNOSTIC LAB — BUILD A NAVIGATION WATERFALL

Try:

```javascript
const n =
  performance.getEntriesByType("navigation")[0];

const phases = {
  redirect: [
    n.redirectStart,
    n.redirectEnd
  ],

  dns: [
    n.domainLookupStart,
    n.domainLookupEnd
  ],

  connection: [
    n.connectStart,
    n.connectEnd
  ],

  request: [
    n.requestStart,
    n.responseStart
  ],

  response: [
    n.responseStart,
    n.responseEnd
  ],

  dom: [
    n.responseEnd,
    n.domContentLoadedEventStart
  ],

  load: [
    n.loadEventStart,
    n.loadEventEnd
  ]
};

console.table(phases);
```

The objective is to reason:

```text
Which phase dominates?
```

---

# 32. 🧪 DIAGNOSTIC LAB — DETECT REDIRECT COST

Run:

```javascript
const n =
  performance.getEntriesByType("navigation")[0];

const redirectTime =
  n.redirectEnd - n.redirectStart;

console.log({
  redirectTime
});
```

If you repeatedly observe:

```text
redirectTime = 700ms
```

then the correct investigation is not:

> "Why is React slow?"

Start with:

```text
navigation redirect chain
```

---

# 33. 🧪 DIAGNOSTIC LAB — DOMCONTENTLOADED COST

```javascript
const n =
  performance.getEntriesByType("navigation")[0];

const dclHandlerTime =
  n.domContentLoadedEventEnd -
  n.domContentLoadedEventStart;

console.log(dclHandlerTime);
```

A large value should trigger investigation into:

```text
synchronous startup work
event handlers
initialization code
```

not DNS.

---

# 34. 🧪 DIAGNOSTIC LAB — LOAD HANDLER COST

```javascript
const n =
  performance.getEntriesByType("navigation")[0];

const loadHandlerTime =
  n.loadEventEnd -
  n.loadEventStart;

console.log(loadHandlerTime);
```

Again:

```text
large number
   ↓
investigate synchronous load processing
```

---

# 35. 🧪 DEVTOOLS — NETWORK WATERFALL

Open:

```text
DevTools
→ Network
```

Reload the page.

You can correlate:

```text
Network waterfall
       ↕
PerformanceNavigationTiming
```

The goal is to understand the same navigation from two perspectives:

```text
DevTools:
visual diagnostic timeline

Performance API:
programmable timing data
```

---

# 36. 🧪 DEVTOOLS — PERFORMANCE PANEL

Open:

```text
DevTools
→ Performance
```

Record a navigation.

Now compare:

```text
Navigation Timing
```

against:

```text
main-thread activity
rendering
long tasks
```

Do not yet dive deeply into rendering internals—that belongs to later KPIs.

Here we are learning to correlate navigation milestones with browser execution.

---

# 37. 🟢 [DAILY DRIVER] — PROGRAMMATIC PRODUCTION TELEMETRY

A frontend application can collect navigation timing:

```javascript
const navigation =
  performance.getEntriesByType("navigation")[0];

const metrics = {
  ttfb:
    navigation.responseStart -
    navigation.requestStart,

  domContentLoaded:
    navigation.domContentLoadedEventEnd,

  load:
    navigation.loadEventEnd,

  duration:
    navigation.duration
};
```

These values can be sent to an observability pipeline.

But production telemetry needs:

```text
sampling
privacy controls
aggregation
route dimensions
device dimensions
connection dimensions
```

Those broader concerns belong to the performance/observability material later.

---

# 38. PRODUCTION TRACE — "BACKEND IS SLOW"

User report:

> "Dashboard is taking 4 seconds."

Telemetry:

```text
DNS       = 20ms
connect   = 30ms
TTFB      = 2500ms
response  = 300ms
DOM       = 500ms
load      = 100ms
```

Correct first hypothesis:

```text
The dominant delay occurs before the first response byte.
```

Possible investigation areas:

```text
server processing
proxy
CDN
upstream dependency
queueing
network path
```

Do not immediately blame:

```text
React
```

---

# 39. PRODUCTION TRACE — "FRONTEND IS SLOW"

Another page:

```text
DNS       = 20ms
connect   = 30ms
TTFB      = 100ms
response  = 100ms
DCL       = 3200ms
load      = 3300ms
```

Now:

```text
network is relatively fast
document/application processing dominates
```

The investigation should move toward:

```text
document parsing
JavaScript execution
initialization
blocking work
```

Later KPIs will provide the deep mechanics.

---

# 40. PRODUCTION TRACE — REDIRECT PROBLEM

Observed:

```text
redirect = 1800ms
TTFB     = 200ms
```

The page is slow, but the backend of the final request isn't necessarily the main problem.

Instead:

```text
navigation redirect chain
```

is consuming most of the time.

Potential fixes could involve:

```text
removing unnecessary redirects
canonical URL correction
authentication flow redesign
HTTP→HTTPS normalization
locale redirect reduction
```

---

# 41. 🔥 CRUCIBLE — QUESTION 1

A page has:

```text
TTFB = 100ms
DCL = 3500ms
```

Is the network necessarily slow?

**No.**

The dominant delay occurs after the early response phase and before/around DOM readiness.

Investigate:

```text
document processing
JavaScript
parsing
initialization
blocking work
```

---

# 42. 🔥 CRUCIBLE — QUESTION 2

A page has:

```text
TTFB = 3000ms
DCL = 3200ms
```

What is your first suspicion?

Not:

```text
CSS is slow
```

The dominant delay occurs before response delivery begins.

Investigate:

```text
request path
server
proxy/CDN
upstream systems
network latency
```

---

# 43. 🔥 CRUCIBLE — QUESTION 3

Does:

```text
loadEventEnd = 5000ms
```

mean the user saw the page at exactly 5000ms?

**No.**

`load` is a lifecycle milestone.

It is not a universal measurement of:

```text
visual completion
perceived readiness
interaction readiness
Core Web Vitals
```

---

# 44. 🔥 CRUCIBLE — QUESTION 4

You see:

```text
redirect = 1200ms
TTFB = 150ms
```

Where do you investigate first?

```text
redirect chain
```

not React rendering.

---

# 45. 🔥 CRUCIBLE — QUESTION 5

Why might this be misleading?

```javascript
const pageLoad =
  navigation.loadEventEnd;
```

Because a raw timestamp is meaningless without context.

You need to know:

```text
what the timestamp represents
what the time origin is
what phase it belongs to
what it does NOT measure
```

Senior engineers reason from semantics, not field names.

---

# 46. 🔥 INTERVIEW GOTCHA — "PAGE LOAD TIME"

If an interviewer asks:

> "What is page load time?"

Do not give a simplistic:

```text
loadEventEnd - navigationStart
```

and stop.

A better answer:

> "There isn't one universally meaningful page-load metric. Navigation Timing provides lifecycle milestones such as response timing, DOM readiness, and load-event timing. I would identify the relevant phase and correlate it with the user experience metric I'm investigating."

That demonstrates systems thinking.

---

# 47. 🔥 INTERVIEW GOTCHA — TTFB

Bad answer:

> "TTFB tells me how long the server took."

Better:

> "TTFB measures the time until the browser receives the first response byte. It includes more than application server execution, so I use it as an end-to-end early-response timing signal rather than a direct server-runtime metric."

---

# 48. 🔥 INTERVIEW GOTCHA — DCL

Bad:

> "`DOMContentLoaded` means everything on the page has loaded."

Wrong.

Better:

> "`DOMContentLoaded` is a document lifecycle milestone associated with DOM parsing and deferred script processing; it does not mean all resources have completed or that the page is visually complete."

---

# 49. 🔥 INTERVIEW GOTCHA — LOAD

Bad:

> "`load` means the user can interact with the page."

Not necessarily.

Better:

> "`load` is a browser lifecycle event. It is not equivalent to application readiness, visual completion, or good interaction responsiveness."

---

# 50. ADVANCED MENTAL MODEL — TIME IS A GRAPH, NOT ONE NUMBER

A Senior engineer should stop thinking:

```text
Page = 3.4 seconds
```

and instead think:

```text
                    Navigation
                        │
       ┌────────────────┼────────────────┐
       ↓                ↓                ↓
   Redirect          Network           Document
       │                │                │
    800ms           500ms            2100ms
                                        │
                           ┌────────────┴────────────┐
                           ↓                         ↓
                         DCL                       load
                       3200ms                     3400ms
```

Now the investigation becomes targeted.

---

# 51. NAVIGATION TIMING + EARLIER PARTS

You should now connect:

```text
Navigation
    ↓
History / URL
    ↓
Navigation processing
    ↓
Timing instrumentation
    ↓
Document lifecycle
    ↓
DOMContentLoaded
    ↓
load
```

Timing APIs don't create navigation behavior.

They **observe and measure it**.

---

# 52. NAVIGATION TIMING + LATER KPIs

This is our boundary map:

```text
KPI 02
Navigation Timing
       │
       ├── measure navigation phases
       │
       ├── measure lifecycle milestones
       │
       └── identify dominant phase
              │
              ├──► KPI 12
              │    Networking mechanics
              │
              ├──► KPI 13
              │    Cache mechanics
              │
              ├──► KPI 14
              │    Resource prioritization
              │
              ├──► KPI 20
              │    Performance methodology
              │
              └──► KPI 21
                   DevTools deep diagnostics
```

This is deliberate.

---

# 53. 🧠 SENIOR-LEVEL DIAGNOSTIC WORKFLOW

When someone says:

> "Navigation is slow."

Use:

```text
1. Capture navigation timing
          ↓
2. Segment into phases
          ↓
3. Find dominant interval
          ↓
4. Form a hypothesis
          ↓
5. Correlate with DevTools
          ↓
6. Inspect the owning subsystem
          ↓
7. Validate with another trace
```

Never jump directly from:

```text
symptom
```

to:

```text
fix
```

---

# 54. THE NAVIGATION TRIANGULATION MODEL

For difficult production problems, combine:

```text
               NAVIGATION
                   │
        ┌──────────┼──────────┐
        ↓          ↓          ↓
 Performance    Network     Application
    API         waterfall      logs
        │          │          │
        └──────────┼──────────┘
                   ↓
             Root cause
```

Each source answers a different question.

### Performance API

```text
"When did the phase occur?"
```

### Network waterfall

```text
"What requests happened?"
```

### Application telemetry

```text
"What was the application doing?"
```

This is a production-grade debugging model.

---

# 55. 🧪 FINAL LAB — BUILD A NAVIGATION REPORT

Run:

```javascript
const n =
  performance.getEntriesByType("navigation")[0];

const report = {
  navigationDuration: n.duration,

  redirectDuration:
    n.redirectEnd - n.redirectStart,

  dnsDuration:
    n.domainLookupEnd -
    n.domainLookupStart,

  connectionDuration:
    n.connectEnd -
    n.connectStart,

  requestToResponse:
    n.responseStart -
    n.requestStart,

  responseDuration:
    n.responseEnd -
    n.responseStart,

  domInteractive:
    n.domInteractive,

  domContentLoaded:
    n.domContentLoadedEventEnd,

  domComplete:
    n.domComplete,

  loadStart:
    n.loadEventStart,

  loadEnd:
    n.loadEventEnd,

  loadHandlerDuration:
    n.loadEventEnd -
    n.loadEventStart
};

console.table(report);
```

Now answer:

```text
1. Which phase is longest?
2. Is the delay before response?
3. Is the delay after response?
4. Is DOMContentLoaded expensive?
5. Is load-event processing expensive?
6. Is a redirect chain involved?
```

If you can answer those from the data, you understand the purpose of Navigation Timing.

---

# 56. 🧠 PART 10 — MASTER MENTAL MODEL

The most important model from this Part:

```text
                     USER NAVIGATES
                           │
                           ▼
                    NAVIGATION START
                           │
                           ▼
                     REDIRECTS?
                           │
                           ▼
                       FETCH START
                           │
             ┌─────────────┴─────────────┐
             ↓                           ↓
          DNS /                     Connection
       measurement                  measurement
             └─────────────┬─────────────┘
                           ↓
                     REQUEST START
                           │
                           ▼
                    RESPONSE START
                           │
                           ▼
                     RESPONSE END
                           │
                           ▼
                    DOCUMENT WORK
                           │
                           ▼
                    DOM INTERACTIVE
                           │
                           ▼
                 DOMContentLoaded
                           │
                           ▼
                      DOM COMPLETE
                           │
                           ▼
                        LOAD
                           │
                           ▼
                  NAVIGATION ANALYSIS
```

The Senior engineer's job is not to memorize this waterfall.

It is to look at a real navigation and answer:

> **Where did the time actually go?**

---

# 57. PART 10 COMPLETION CHECKLIST

### Navigation Timing

* [x] Performance Timeline
* [x] `PerformanceNavigationTiming`
* [x] Navigation start
* [x] Navigation duration
* [x] Redirect timing
* [x] Fetch timing
* [x] DNS timing
* [x] Connection timing
* [x] TLS timing boundary
* [x] Request timing
* [x] Response timing
* [x] TTFB interpretation

### Document lifecycle measurement

* [x] `domInteractive`
* [x] `DOMContentLoaded` start/end
* [x] `domComplete`
* [x] `loadEventStart`
* [x] `loadEventEnd`
* [x] Event-handler duration measurement

### Diagnostics

* [x] Performance API
* [x] Network waterfall correlation
* [x] Performance panel correlation
* [x] Redirect diagnosis
* [x] Network-vs-document diagnosis
* [x] Production telemetry concept

### Senior reasoning

* [x] Phase attribution
* [x] TTFB interpretation
* [x] DCL vs load
* [x] Navigation vs perceived performance
* [x] Cross-KPI boundaries
* [x] Production debugging workflow
* [x] Prediction challenges
* [x] Interview gotchas

---

# ⚡ FINAL REVISION CARD

```text
PerformanceNavigationTiming
        │
        ├── Redirect
        ├── DNS
        ├── Connection
        ├── Request
        ├── Response
        │
        ├── DOMInteractive
        ├── DOMContentLoaded
        ├── DOMComplete
        └── load
```

Remember:

```text
1. Measure phases, not just "page load".

2. TTFB ≠ server execution time.

3. DOMContentLoaded ≠ everything loaded.

4. load ≠ visual completion.

5. A slow navigation must be decomposed before diagnosing it.

6. Navigation Timing measures navigation; it does not explain
   the underlying subsystem by itself.

7. Use Performance API + Network waterfall + application
   telemetry to triangulate production failures.
```

---

[⬅️ Part 09: SPA / React / Next.js Navigation](./09-spa-react-nextjs-navigation.md) | [📚 KPI 02 Index](./README.md) | [🧪 Lab 01](./examples/01-navigation-lifecycle-timeline-lab.html) | [🧪 Lab 02](./examples/02-dns-connection-benchmark-lab.html) | [🧪 Lab 03](./examples/03-tls-handshake-certificate-lab.html) | [🧪 Lab 04](./examples/04-http-stream-cache-waterfall-lab.html) | [🧪 Lab 05](./examples/05-critical-rendering-path-priority-lab.html) | [🧪 Lab 06](./examples/06-event-loop-long-task-scheduler-lab.html) | [🧪 Lab 07](./examples/07-dom-event-propagation-delegation-lab.html) | [🧪 Lab 08](./examples/08-form-submission-validation-lab.html) | [🧪 Lab 10](./examples/10-navigation-timing-telemetry-lab.html) | [Part 11: Production Failure Traces & Crucible ➡️](./11-production-failure-traces-crucible.md)
