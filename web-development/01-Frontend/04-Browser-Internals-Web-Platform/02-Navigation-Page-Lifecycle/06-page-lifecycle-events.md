# KPI 02 — Part 06: JavaScript Execution, Event Loop & Task Scheduling

[⬅️ Part 05: Resource Loading & Critical Rendering Path](./05-document-navigation-lifecycle.md) | [📚 KPI 02 Index](./README.md) | [🧪 Lab 01](./examples/01-navigation-lifecycle-timeline-lab.html) | [🧪 Lab 02](./examples/02-dns-connection-benchmark-lab.html) | [🧪 Lab 03](./examples/03-tls-handshake-certificate-lab.html) | [🧪 Lab 04](./examples/04-http-stream-cache-waterfall-lab.html) | [🧪 Lab 05](./examples/05-critical-rendering-path-priority-lab.html) | [🧪 Lab 06](./examples/06-event-loop-long-task-scheduler-lab.html) | [Part 07: History & Session Navigation ➡️](./07-history-session-navigation.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer \| Founding Engineer)

---

# 🧭 PART POSITION

This part answers what happens after JavaScript is discovered and loaded:

> **"How does the browser schedule JavaScript, how do tasks and microtasks interact with rendering, why do long tasks create visual jank, and how do React/Next.js execution workloads compete for the browser's main-thread execution budget?"**

---

# LAYER 1 — ⚡ 30-SECOND EXECUTIVE CHEAT SHEET

## The Core Model

```text
                 BROWSER RUNTIME
                       │
                       ▼
                JavaScript Engine
                       │
                ┌──────┴──────┐
                │             │
             Call Stack    Heap/Memory
                │
                ▼
          synchronous JS
                │
                ▼
             finishes
                │
                ▼
          Browser Scheduler
                │
        ┌───────┴────────┐
        ▼                ▼
      Tasks           Microtasks
        │                │
        └───────┬────────┘
                ▼
             Rendering
                │
                ▼
              Paint
```

The critical Senior-level idea:

> **JavaScript does not simply "run whenever it wants." It participates in a browser scheduling system.**

---

# 1. JAVASCRIPT IS NOT THE ENTIRE BROWSER

A common misconception is:

```text
Browser
  ↓
JavaScript
```

A more accurate conceptual model:

```text
Browser
│
├── HTML parser
├── CSS engine
├── JavaScript engine
├── networking
├── rendering pipeline
├── compositor
├── timers
├── event dispatch
└── other browser services
```

JavaScript is one subsystem inside the browser.

And importantly:

> JavaScript can interfere with other work because much of application JavaScript executes on the main thread.

---

# 2. V8 IS NOT THE BROWSER

In Chromium:

```text
Renderer Process
│
├── Blink
│   ├── DOM
│   ├── CSS
│   ├── rendering
│   └── browser-facing web APIs
│
└── V8
    └── JavaScript execution
```

This distinction matters.

V8 provides the JavaScript engine.

Blink provides much of the browser platform around it.

For example:

```javascript
fetch("/api/users");
```

`fetch()` is a Web Platform API exposed to JavaScript.

The networking machinery itself is not implemented as ordinary JavaScript code inside V8.

---

# 3. CALL STACK

Consider:

```javascript
function a() {
  b();
}

function b() {
  c();
}

function c() {
  console.log("hello");
}

a();
```

Conceptually:

```text
a()
 ↓
b()
 ↓
c()
 ↓
console.log()
```

The call stack tracks active synchronous execution.

```text
┌──────────────┐
│ console.log  │
├──────────────┤
│ c            │
├──────────────┤
│ b            │
├──────────────┤
│ a            │
└──────────────┘
```

As functions return, stack frames disappear.

---

# 4. SINGLE JAVASCRIPT EXECUTION CONTEXT

For ordinary page JavaScript, the important mental model is:

```text
One execution stream
        │
        ▼
Call Stack
        │
        ▼
one synchronous operation at a time
```

This is why:

```javascript
while (true) {}
```

is catastrophic.

The JavaScript execution never yields.

---

# 5. THE CLASSIC EVENT LOOP MENTAL MODEL

A simplified model:

```text
             ┌─────────────┐
             │    Tasks    │
             └──────┬──────┘
                    │
                    ▼
              ┌───────────┐
              │ Call Stack│
              └─────┬─────┘
                    │
                    ▼
             microtask checkpoint
                    │
                    ▼
                rendering
                    │
                    ▼
                  repeat
```

This is deliberately simplified.

The HTML Standard's event-loop model is considerably more nuanced.

For Senior-level reasoning, the important point is:

> **Task execution, microtask checkpoints, and rendering opportunities interact.**

---

# 6. WHAT IS A TASK?

A task is a unit of work scheduled onto an event loop.

Examples include work associated with:

* user interaction,
* timers,
* network-related events,
* parsing,
* certain DOM events,
* other browser scheduling sources.

Examples:

```javascript
setTimeout(() => {
  console.log("timer");
}, 0);
```

or:

```javascript
button.addEventListener("click", handler);
```

The event handler runs as part of scheduled browser work.

---

# 7. WHAT IS A MICROTASK?

Microtasks are higher-priority follow-up jobs processed at microtask checkpoints.

Common sources:

```javascript
Promise.then(...)
queueMicrotask(...)
MutationObserver
```

Example:

```javascript
Promise.resolve().then(() => {
  console.log("microtask");
});
```

---

# 8. TASK VS MICROTASK

Simplified:

```text
Task
 │
 ▼
run task
 │
 ▼
drain microtasks
 │
 ▼
possible rendering opportunity
 │
 ▼
next task
```

This produces a crucial rule:

> **A microtask can delay rendering because the browser must process the microtask queue before moving forward from the checkpoint.**

---

# 9. BASIC EXAMPLE

```javascript
console.log("A");

setTimeout(() => {
  console.log("B");
}, 0);

Promise.resolve().then(() => {
  console.log("C");
});

console.log("D");
```

Expected conceptual ordering:

```text
A
D
C
B
```

Why?

```text
synchronous JS
   ↓
A
D
   ↓
microtask
   ↓
C
   ↓
later task
   ↓
B
```

---

# 10. `setTimeout(..., 0)` DOES NOT MEAN "RUN NOW"

This:

```javascript
setTimeout(fn, 0);
```

doesn't mean:

```text
execute immediately
```

It means approximately:

> **Make the callback eligible after the minimum delay and scheduling constraints have been satisfied.**

The callback still needs the event loop to reach it.

If the main thread is busy:

```text
0ms timer
   ↓
waiting
   ↓
main thread busy
   ↓
eventually executes
```

---

# 11. LONG TASK

A **Long Task** is generally main-thread work that occupies the event loop for more than about **50 ms**.

Example:

```javascript
const start = performance.now();

while (performance.now() - start < 200) {}
```

The browser cannot freely perform other main-thread work during this execution.

Result:

```text
200ms JS
   ↓
input delayed
rendering delayed
events delayed
```

---

# 12. WHY 50 MS MATTERS

The 50 ms threshold is associated with responsiveness instrumentation and Long Tasks.

It is not:

```text
"Every frame must finish in 50ms."
```

For a 60 Hz display, the rough frame interval is:

```text
1000 / 60 ≈ 16.67ms
```

So:

```text
16.67ms
```

is a useful frame-budget mental model.

But:

```text
50ms
```

is the important Long Task threshold.

Don't confuse them.

---

# 13. JAVASCRIPT VS FRAME RENDERING

Imagine:

```text
Frame 1
   │
   ▼
JavaScript
   │
   │ 25ms
   ▼
Too late
   │
   ▼
next rendering opportunity
```

If the main thread is occupied when the browser needs to render, the frame may miss its opportunity.

This produces:

```text
jank
```

---

# 14. USER INPUT IS ALSO COMPETING FOR TIME

Suppose:

```text
User clicks button
        │
        ▼
main thread running 300ms task
        │
        ▼
click handler waits
```

The user experiences:

> "The page is frozen."

The network may be perfect.

The server may be perfect.

React may have already rendered the page.

The problem is simply:

```text
main-thread contention
```

---

# 15. MICROTASK STARVATION

Consider:

```javascript
function loop() {
  queueMicrotask(loop);
}

loop();
```

Conceptually:

```text
task
 ↓
microtask
 ↓
microtask
 ↓
microtask
 ↓
microtask
 ↓
...
```

If microtasks continually schedule more microtasks, the browser can be prevented from reaching useful rendering or other work.

This is called **microtask starvation** in the general diagnostic sense.

---

# 16. PROMISES DO NOT CREATE NEW THREADS

Consider:

```javascript
fetch("/api")
  .then(data => {
    // ...
  });
```

A Promise does not mean:

```text
new thread
```

Instead:

```text
network/browser machinery
        │
        ▼
response becomes available
        │
        ▼
Promise continuation scheduled
        │
        ▼
JavaScript executes on its execution thread
```

This distinction is fundamental.

---

# 17. `ASYNC/AWAIT`

Example:

```javascript
async function load() {
  const response = await fetch("/api");
  const data = await response.json();
  return data;
}
```

`await` does not block the entire JavaScript thread waiting for the network response.

Conceptually:

```text
load()
 │
 ▼
fetch()
 │
 ▼
await
 │
 └────────► JavaScript function suspends
                 │
                 ▼
              network
                 │
                 ▼
           promise settles
                 │
                 ▼
        continuation scheduled
                 │
                 ▼
        function resumes
```

This is why asynchronous I/O can coexist with responsive JavaScript—provided the subsequent CPU work is not excessive.

---

# 18. ASYNC I/O VS CPU WORK

Important distinction:

### Waiting for I/O

```text
fetch()
 ↓
await
 ↓
browser/network handles waiting
```

Usually does not occupy the JS execution stack continuously.

### CPU-intensive work

```javascript
for (...) {
   expensiveCalculation();
}
```

occupies the execution thread.

Therefore:

```text
I/O waiting
≠
CPU waiting
```

---

# 19. JSON PARSING CAN BE EXPENSIVE

Consider:

```javascript
const data = await response.json();
```

The network wait itself isn't necessarily the expensive portion.

Processing a huge response can require:

```text
bytes
 ↓
decode
 ↓
JSON parse
 ↓
object creation
 ↓
application processing
```

That CPU work can consume main-thread time.

---

# 20. DOM WORK ALSO COSTS CPU

Consider:

```javascript
for (let i = 0; i < 10000; i++) {
  document.body.appendChild(createElement());
}
```

Potential costs include:

```text
DOM mutation
+
style invalidation
+
layout
+
paint
```

depending on what the application does and when rendering work is required.

The important idea:

> JavaScript can indirectly trigger rendering work.

---

# 21. FORCED SYNCHRONOUS LAYOUT

Consider:

```javascript
element.style.width = "500px";

console.log(element.offsetWidth);
```

The browser may need to ensure layout information is up to date before returning geometry.

Conceptually:

```text
write
 ↓
style/layout invalidation
 ↓
read geometry
 ↓
browser may need layout
 ↓
return value
```

This pattern can create expensive layout synchronization when repeated.

---

# 22. LAYOUT THRASHING

Bad pattern:

```javascript
for (const element of elements) {
  element.style.width = calculateWidth(element);
  console.log(element.offsetWidth);
}
```

Potential conceptual cycle:

```text
write
 ↓
read
 ↓
layout
 ↓
write
 ↓
read
 ↓
layout
 ↓
...
```

Better strategies often separate:

```text
reads
```

from:

```text
writes
```

to reduce unnecessary synchronization.

---

# 23. REQUESTANIMATIONFRAME

For visual updates:

```javascript
requestAnimationFrame(() => {
  element.style.transform = "translateX(100px)";
});
```

The browser schedules the callback in relation to a rendering opportunity.

Mental model:

```text
JavaScript
   ↓
requestAnimationFrame()
   ↓
browser prepares rendering opportunity
   ↓
callback
   ↓
rendering pipeline
```

It is therefore preferable to arbitrary timers for animation-related coordination.

---

# 24. `REQUESTANIMATIONFRAME` IS NOT A GUARANTEED 16.67 MS TIMER

This is another interview trap.

Do not say:

> "rAF runs every 16.67 ms."

That is only a rough 60 Hz mental model.

Actual scheduling depends on:

* display refresh rate,
* browser state,
* throttling,
* page visibility,
* rendering load,
* device conditions.

---

# 25. `REQUESTIDLECALLBACK`

Browsers can expose:

```javascript
requestIdleCallback(() => {
  // non-urgent work
});
```

The intent is:

> Perform lower-priority work when the browser has idle time.

Good conceptual use cases:

```text
analytics preparation
non-critical computation
background bookkeeping
```

But availability and scheduling behavior must be treated according to the browser's actual semantics.

---

# 26. PRIORITY OF WORK

A useful engineering classification:

```text
                Work
                 │
       ┌─────────┼─────────┐
       ▼         ▼         ▼
   User-critical Visual   Background
       │         │         │
       ▼         ▼         ▼
    input      frames    analytics
```

The goal is not:

> "Make everything fast."

The goal is:

> **Keep critical work responsive and move/defer non-critical work away from critical moments.**

---

# 27. BROWSER EVENT LOOP ≠ NODE.JS EVENT LOOP

Do not blindly transfer Node.js event-loop explanations to browsers.

Both environments use asynchronous scheduling concepts, but their event-loop architectures and APIs differ.

Browser scheduling is defined through the Web Platform and browser implementation.

Node.js has its own event-loop/runtime architecture.

For frontend engineering:

> Learn the browser's event loop as a browser scheduling model.

---

# 28. WEB WORKERS

If computation is genuinely CPU-heavy:

```javascript
const worker = new Worker("worker.js");
```

the computation can execute in a separate worker context.

Conceptually:

```text
Main Thread                 Worker
     │                         │
     │──── message ───────────►│
     │                         │
     │                         ▼
     │                    heavy computation
     │                         │
     │◄──── message ───────────│
     │
     ▼
continue UI work
```

This can protect main-thread responsiveness.

---

# 29. WORKERS DO NOT SHARE THE DOM

A common mistake:

> "Put React rendering inside a Web Worker."

Ordinary Web Workers do not have direct access to the page DOM.

They communicate through messaging.

```text
Main thread
   │
   │ postMessage()
   ▼
Worker
   │
   │ postMessage()
   ▼
Main thread
```

---

# 30. STRUCTURED CLONE

Messages between contexts are commonly transferred using structured cloning semantics.

Example:

```javascript
worker.postMessage({
  users,
  settings
});
```

Conceptually:

```text
Main memory
    │
    ▼
serialization / cloning semantics
    │
    ▼
Worker memory
```

This can itself have cost for large object graphs.

---

# 31. TRANSFERABLE OBJECTS

Some objects can be transferred rather than copied.

For example:

```javascript
worker.postMessage(buffer, [buffer]);
```

For a transferable `ArrayBuffer`, ownership can move between contexts.

Conceptually:

```text
Main
 │
 │ ownership transfer
 ▼
Worker
```

This can reduce copying overhead for large binary data.

---

# 32. REACT CONNECTION

React does not escape browser scheduling.

Your React application ultimately performs:

```text
JavaScript
 ↓
browser main thread
 ↓
DOM / rendering-related work
```

If you perform:

```javascript
for (let i = 0; i < 10_000_000; i++) {
  expensiveWork();
}
```

inside a React event handler:

```text
React
 ↓
JavaScript
 ↓
main-thread occupation
 ↓
input/rendering delayed
```

---

# 33. REACT CONCURRENT RENDERING

Modern React introduces scheduling concepts that allow React to prioritize and interrupt certain rendering work.

But don't misunderstand this as:

```text
React created a new CPU thread.
```

It didn't.

React scheduling is still constrained by the JavaScript runtime and browser main-thread execution model.

---

# 34. `startTransition`

Conceptually:

```javascript
startTransition(() => {
  setSearchResults(results);
});
```

This tells React that the update can be treated as lower priority than urgent interaction work.

Mental model:

```text
User input
   │
   ├── urgent update
   │
   └── transition update
           │
           ▼
       lower priority
```

This helps React schedule rendering work more intelligently.

But:

> It cannot make intrinsically expensive JavaScript disappear.

---

# 35. SERVER COMPONENTS CONNECTION

React Server Components can reduce the amount of client JavaScript required for some application logic.

Conceptually:

```text
Server
 ↓
component work
 ↓
serialized result
 ↓
browser
 ↓
less client-side JS
```

This can reduce:

```text
download
+
parse
+
compile
+
execute
```

on the client.

Again, the browser's JavaScript execution model remains underneath.

---

# 36. HYDRATION

For server-rendered React:

```text
HTML arrives
 ↓
user sees structure
 ↓
client JS downloads
 ↓
JS executes
 ↓
React hydrates
 ↓
interactive behavior
```

The important performance distinction:

```text
visible
≠
interactive
```

A page can appear quickly while still spending substantial main-thread time becoming interactive.

---

# 37. LONG HYDRATION

Suppose:

```text
HTML: 500ms
JS download: 300ms
JS execution: 800ms
hydration: 700ms
```

The user might see content before the application is fully interactive.

The bottleneck is not necessarily server response.

It may be:

```text
client CPU
```

This is one reason reducing client JavaScript can be so valuable.

---

# 38. 🧪 DIAGNOSTIC LAB — CALL STACK

Open:

```text
DevTools
→ Sources
→ JavaScript debugger
```

Create:

```javascript
function a() {
  b();
}

function b() {
  debugger;
}

a();
```

Inspect:

```text
Call Stack
```

You should see:

```text
b
a
global context
```

Understand exactly how synchronous execution builds the stack.

---

# 39. 🧪 DIAGNOSTIC LAB — TASK VS MICROTASK

Run:

```javascript
console.log("1");

setTimeout(() => {
  console.log("2");
}, 0);

queueMicrotask(() => {
  console.log("3");
});

console.log("4");
```

Predict first:

```text
1
4
3
2
```

Then verify.

The goal is not memorizing the output.

The goal is explaining:

```text
synchronous
→ microtask
→ later task
```

---

# 40. 🧪 DIAGNOSTIC LAB — LONG TASK

Run:

```javascript
const start = performance.now();

while (performance.now() - start < 300) {}

console.log("done");
```

Open:

```text
DevTools
→ Performance
```

Record the page.

You should observe a large block of main-thread activity.

Now click the page during execution.

Ask:

> Why can't the browser immediately respond?

Because the main execution thread is occupied.

---

# 41. 🧪 DIAGNOSTIC LAB — PERFORMANCE OBSERVER

You can observe Long Tasks programmatically where supported:

```javascript
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log("Long task:", entry.duration);
  }
}).observe({
  type: "longtask",
  buffered: true
});
```

This turns a vague symptom:

```text
"the page feels slow"
```

into measurable evidence.

---

# 42. 🧪 DIAGNOSTIC LAB — RENDERING FRAMES

Open:

```text
DevTools
→ Performance
```

Look for:

```text
Frames
Main
Rendering
Paint
```

Correlate:

```text
long JS task
       ↓
missed frame
       ↓
visual jank
```

You are learning to establish causality.

---

# 43. 🧪 DIAGNOSTIC LAB — LAYOUT THRASHING

Create:

```javascript
for (const element of document.querySelectorAll(".item")) {
  element.style.width = "500px";
  console.log(element.offsetWidth);
}
```

Profile it.

Then restructure the operation so reads and writes are separated.

Compare the performance traces.

---

# 44. PRODUCTION RUNBOOK — "CLICK FEELS DELAYED"

Symptom:

> User clicks a button and nothing happens for 300 ms.

Do not immediately blame:

```text
React
```

Trace:

```text
Input
 ↓
main-thread task
 ↓
JavaScript
 ↓
event handler
 ↓
React update
 ↓
render
```

Look for:

* Long Tasks
* event-handler duration
* synchronous computation
* forced layout
* React render cost
* third-party code

---

# 45. PRODUCTION RUNBOOK — "PAGE LOADS BUT FEELS FROZEN"

Investigate:

```text
JS download
 ↓
parse
 ↓
compile
 ↓
execute
 ↓
hydration
 ↓
long tasks
```

A common mistake is to look only at:

```text
TTFB
```

when the actual problem is:

```text
client-side CPU
```

---

# 46. PRODUCTION RUNBOOK — "SCROLL JANK"

Investigate:

```text
scroll/input
 ↓
event handlers
 ↓
JavaScript
 ↓
style/layout
 ↓
paint/composite
```

Potential causes:

* expensive event handlers,
* synchronous layout,
* excessive DOM updates,
* expensive paint,
* main-thread contention.

Also investigate whether event listeners and rendering behavior can be optimized rather than simply adding throttling everywhere.

---

# 47. PRODUCTION RUNBOOK — "CPU 100%"

First determine:

```text
Who owns the CPU?
```

Potential sources:

```text
application JS
React rendering
hydration
JSON processing
layout
paint
third-party scripts
browser internals
```

Use:

```text
DevTools Performance
```

rather than guessing.

---

# 48. 🔥 CRUCIBLE — OUTPUT PREDICTION

What prints?

```javascript
console.log("A");

Promise.resolve().then(() => {
  console.log("B");
});

setTimeout(() => {
  console.log("C");
}, 0);

console.log("D");
```

Expected:

```text
A
D
B
C
```

Explain the scheduling model rather than simply memorizing the sequence.

---

# 49. 🔥 CRUCIBLE — MICROTASK STARVATION

What is wrong with:

```javascript
function forever() {
  queueMicrotask(forever);
}

forever();
```

Answer:

The continuously replenished microtask queue can prevent the event loop from reaching later work and rendering opportunities.

The problem isn't that microtasks are "slow."

The problem is:

```text
no meaningful yield
```

---

# 50. 🔥 CRUCIBLE — ZERO-MILLISECOND TIMER

Question:

> Why can this execute hundreds of milliseconds later?

```javascript
setTimeout(fn, 0);
```

Because:

```text
0ms delay
≠
0ms execution latency
```

The callback must wait for:

* the timer's eligibility,
* scheduling,
* currently executing work,
* event-loop progression.

---

# 51. 🔥 CRUCIBLE — PROMISE

Question:

> Does this make computation asynchronous?

```javascript
Promise.resolve().then(() => {
  expensiveCalculation();
});
```

No.

The callback is asynchronous in scheduling semantics, but once it executes:

```text
expensiveCalculation()
```

still consumes the JavaScript execution thread.

Promises do not make CPU work free.

---

# 52. 🔥 CRUCIBLE — `ASYNC/AWAIT`

Question:

> Does `await fetch()` block the browser main thread until the server responds?

No.

The async function suspends its continuation while the asynchronous operation progresses.

When the Promise settles, the continuation is scheduled.

However:

```javascript
const response = await fetch(...);
const data = await response.json();
```

can still perform substantial CPU work after the response arrives.

---

# 53. 🔥 CRUCIBLE — WEB WORKER

Question:

> If a Web Worker is available, should every expensive operation move there?

No.

Workers introduce:

```text
message passing
+
data transfer
+
serialization/transfer costs
+
architectural complexity
```

They're valuable when CPU work is sufficiently expensive and parallelizable to justify those costs.

---

# 54. 🔥 CRUCIBLE — REACT

Question:

> Does React's concurrent rendering mean React rendering runs on another thread?

No.

React's scheduling and interruptibility mechanisms do not imply that ordinary React rendering has moved to a separate CPU thread.

The browser's JavaScript execution constraints still apply.

---

# 55. 🔥 CRUCIBLE — HYDRATION

Question:

> Why can a server-rendered page look fast but still feel slow?

Because:

```text
HTML visible
```

doesn't imply:

```text
JavaScript executed
+
hydration completed
+
event handlers attached
+
main thread available
```

Therefore:

```text
visual readiness
≠
interaction readiness
```

---

# 56. SENIOR DEBUGGING MODEL

When something feels slow, classify the bottleneck:

```text
                    SLOWNESS
                       │
       ┌───────────────┼────────────────┐
       ▼               ▼                ▼
    Network            CPU          Rendering
       │               │                │
       ▼               ▼                ▼
    request          JS            style/layout
    latency          parse         paint
    transfer         compile       composite
                     execute
                       │
                       ▼
                    React
                   hydration
                   rendering
```

Don't jump straight to framework-level explanations.

---

# 57. THE MAIN-THREAD QUESTION

For any frontend performance issue, ask:

> **"What is occupying the main thread at the moment the user is waiting?"**

Then identify:

```text
task
duration
initiator
CPU work
rendering consequence
```

This question is far more useful than:

> "Which framework is slow?"

---

# 58. KPI 02 PART 06 — COMPLETION CHECKLIST

### JavaScript runtime

* [x] V8 vs browser runtime
* [x] Call stack
* [x] Synchronous execution
* [x] Heap vs stack conceptual model
* [x] Browser APIs

### Event loop

* [x] Tasks
* [x] Microtasks
* [x] Microtask checkpoints
* [x] Timers
* [x] Promise callbacks
* [x] Event dispatch
* [x] Rendering opportunities

### Performance

* [x] Long Tasks
* [x] 50 ms threshold
* [x] 16.67 ms / 60 Hz frame model
* [x] Main-thread contention
* [x] Input latency
* [x] Jank
* [x] Microtask starvation

### Async programming

* [x] Promise scheduling
* [x] `async/await`
* [x] Asynchronous I/O
* [x] CPU-bound work
* [x] JSON parsing

### Rendering interaction

* [x] Forced synchronous layout
* [x] Layout thrashing
* [x] `requestAnimationFrame`
* [x] Idle work
* [x] Main-thread rendering

### Parallelism

* [x] Web Workers
* [x] Worker communication
* [x] Structured clone
* [x] Transferable objects
* [x] Worker tradeoffs

### React / Next.js

* [x] React scheduling
* [x] Transitions
* [x] Hydration
* [x] Client JavaScript cost
* [x] Server Components
* [x] Interaction readiness

### Diagnostics

* [x] DevTools Performance
* [x] Long Task observation
* [x] Call-stack inspection
* [x] Frame analysis
* [x] CPU attribution
* [x] Input-latency investigation

---

# FINAL SENIOR-LEVEL MENTAL MODEL

Don't think:

```text
JavaScript
   ↓
runs
```

Think:

```text
                    BROWSER
                       │
                       ▼
                  EVENT LOOP
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
        TASKS                   MICROTASKS
          │                         │
          └────────────┬────────────┘
                       ▼
                MAIN THREAD WORK
                       │
            ┌──────────┼──────────┐
            ▼          ▼          ▼
           JS        DOM       Browser APIs
            │          │
            └────┬─────┘
                 ▼
          Style / Layout
                 │
                 ▼
               Paint
                 │
                 ▼
             Composite
                 │
                 ▼
               Frame
```

---

[⬅️ Part 05: Resource Loading & Critical Rendering Path](./05-document-navigation-lifecycle.md) | [📚 KPI 02 Index](./README.md) | [🧪 Lab 01](./examples/01-navigation-lifecycle-timeline-lab.html) | [🧪 Lab 02](./examples/02-dns-connection-benchmark-lab.html) | [🧪 Lab 03](./examples/03-tls-handshake-certificate-lab.html) | [🧪 Lab 04](./examples/04-http-stream-cache-waterfall-lab.html) | [🧪 Lab 05](./examples/05-critical-rendering-path-priority-lab.html) | [🧪 Lab 06](./examples/06-event-loop-long-task-scheduler-lab.html) | [Part 07: History & Session Navigation ➡️](./07-history-session-navigation.md)
