# KPI 01 — Part 07: IPC & Cross-Process Communication

[⬅️ Part 06: Site Isolation & Security Boundaries](./06-site-isolation-security-boundaries.md) | [📚 KPI 01 Index](./README.md) | [🧪 Lab 01](./examples/01-main-thread-vs-compositor-lab.html) | [🧪 Lab 02](./examples/02-layout-thrashing-benchmark-lab.html) | [🧪 Lab 03](./examples/03-event-loop-microtask-starvation-lab.html) | [🧪 Lab 04](./examples/05-page-lifecycle-bfcache-lab.html) | [🧪 Lab 05](./examples/07-ipc-structured-clone-transfer-lab.html) | [📋 Runbook](./examples/04-process-inspection-runbook.md) | [Part 08: Browser ↔ Operating System ➡️](./08-browser-operating-system.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer \| Founding Engineer)

---

# 🧭 PART 07 — THE CORE PROBLEM

In Part 06 we established:

```text
Site A
   ↓
Renderer A

Site B
   ↓
Renderer B
```

These processes are isolated.

But the browser still needs them to cooperate.

For example:

```text
Renderer
   ↓
DOM operation
   ↓
Browser service
   ↓
Network
```

or:

```text
Parent iframe
   ↓
postMessage()
   ↓
Browser / IPC machinery
   ↓
Child iframe
```

So the fundamental question is:

> **How do independent processes exchange information and request operations while preserving isolation and security?**

The answer is **IPC — Inter-Process Communication**.

---

# ⚡ LAYER 1 — 30-SECOND EXECUTIVE CHEAT SHEET

## 1. IPC

**Inter-Process Communication** is the mechanism through which separate OS processes exchange messages, requests, responses, handles, and shared-memory references.

Conceptually:

```text
Process A
   │
   │ IPC
   ▼
Process B
```

---

# 2. Why Browser IPC Exists

Separate processes generally have separate virtual address spaces.

Therefore:

```text
Renderer A memory
       ≠
Renderer B memory
```

A pointer in Renderer A cannot simply be dereferenced by Renderer B.

IPC provides a controlled communication channel.

---

# 3. Chromium's Major IPC Technology: Mojo

Modern Chromium heavily uses **Mojo** for IPC.

Conceptually:

```text
Renderer
   │
   ▼
Mojo message
   │
   ▼
Browser / Service
   │
   ▼
Mojo interface
```

Mojo provides typed interfaces, message passing, handles, and capability-oriented communication patterns.

---

# 4. IPC Is Both a Communication AND Security Boundary

Never think of IPC merely as:

```text
"send data between processes"
```

A better model is:

```text
Untrusted renderer
       │
       ▼
     IPC
       │
       ▼
Privileged browser/service
```

The receiving side must treat the sender's input as potentially malicious.

---

# 5. Serialization

If Process A wants to send:

```javascript
{
  user: "Sunny",
  items: [1, 2, 3]
}
```

the receiving process cannot simply receive the original JavaScript object reference.

The data needs to cross a process boundary.

Conceptually:

```text
JS object
   ↓
serialization / encoding
   ↓
IPC message
   ↓
transport
   ↓
deserialization
   ↓
new representation
```

---

# 6. Structured Clone

Browser APIs such as:

```javascript
postMessage()
```

use structured cloning semantics for many values.

Important consequence:

```text
sender object
      ≠
receiver object
```

The receiver gets its own representation.

---

# 7. Transferables

Some objects can instead transfer ownership.

Examples include:

```text
ArrayBuffer
MessagePort
ReadableStream
```

where supported by the relevant API.

Conceptually:

```text
Process A
owns buffer
    │
    │ transfer
    ▼
Process B
owns buffer
```

This can avoid some expensive copying.

---

# 8. Shared Memory

For certain performance-sensitive scenarios, processes can use shared memory mechanisms.

Conceptually:

```text
Process A ──┐
            ├── Shared Memory
Process B ──┘
```

But shared memory introduces synchronization and security complexity.

---

# 9. Mojo Interfaces

Instead of arbitrary messages, Chromium commonly models communication as interfaces.

Conceptually:

```text
interface NetworkService {
    GetResponse(...)
    OpenConnection(...)
}
```

One side exposes an interface.

Another side obtains a capability/handle to communicate with it.

---

# 10. IPC Request/Response

Typical flow:

```text
Renderer
   │
   │ Request
   ▼
Browser / Service
   │
   │ Work
   ▼
Browser / Service
   │
   │ Response
   ▼
Renderer
```

The browser can validate the request before performing privileged work.

---

# 11. The Security Rule

At every privileged IPC boundary:

```text
NEVER TRUST THE RENDERER
```

Treat incoming data as attacker-controlled.

This is crucial because a renderer may be compromised.

---

# 12. Performance Rule

IPC is not free.

Costs may include:

```text
serialization
copying
context switching
scheduling
synchronization
deserialization
memory allocation
```

Therefore high-frequency cross-process communication can become expensive.

---

# 🏛️ LAYER 2 — DEEP MECHANICAL BREAKDOWN

# 13. What Exactly Is a Process Boundary?

Suppose:

```text
Renderer A
```

has:

```text
Address:
0x7A000000
```

Renderer B cannot simply do:

```text
read(0x7A000000)
```

and expect to access Renderer A's object.

Each process has its own virtual address space.

Conceptually:

```text
┌─────────────────────┐
│ Process A            │
│ Virtual Address Space│
│                     │
│ JS Heap              │
│ DOM                  │
│ Native Objects       │
└─────────────────────┘

┌─────────────────────┐
│ Process B            │
│ Virtual Address Space│
│                     │
│ JS Heap              │
│ DOM                  │
│ Native Objects       │
└─────────────────────┘
```

The OS memory subsystem maintains the boundary.

---

# 14. So How Does Communication Happen?

Instead of sharing arbitrary pointers:

```text
A pointer
   ↓
❌ invalid across process boundary
```

the browser uses:

```text
structured data
+
IPC transport
+
handles
+
shared memory mechanisms
```

Conceptually:

```text
Process A
   │
   │ encode message
   ▼
IPC transport
   │
   │ kernel/browser mediation
   ▼
Process B
   │
   │ decode message
   ▼
local representation
```

---

# 15. Browser IPC Architecture

A simplified Chromium architecture:

```text
                  Browser Process
                /       |        \
               /        |         \
              ▼         ▼          ▼
        Renderer A  Renderer B   Network
             │          │
             │          │
             └──── Mojo ┘
```

There can also be dedicated services/processes:

```text
Audio
Network
GPU
Storage
Data Decoder
Utility
```

Communication between them can use IPC mechanisms.

---

# 16. Why Not One Giant Process?

Because a giant process would make security containment much weaker.

Instead:

```text
Browser
├── Renderer A
├── Renderer B
├── GPU
├── Network
└── Utility
```

provides fault and security isolation.

But now:

```text
Isolation
```

creates the requirement for:

```text
IPC
```

This is an architectural tradeoff.

---

# 17. Isolation Creates Communication Cost

You can think of the relationship as:

```text
More process isolation
        ↓
More boundaries
        ↓
More IPC
        ↓
Potential communication overhead
```

Browser architecture therefore balances:

```text
security
fault isolation
performance
memory usage
```

---

# 18. Mojo

**Mojo** is Chromium's modern IPC framework.

At a high level it provides:

```text
interfaces
messages
message pipes
handles
serialization
connection lifecycle
capability-oriented communication
```

The exact implementation contains considerably more machinery, but this is the conceptual model you should retain.

---

# 19. Mojo Interface Model

Imagine a conceptual interface:

```text
interface PaymentService {
    ProcessPayment(request);
}
```

A client can communicate with an implementation through a Mojo endpoint.

Conceptually:

```text
Client
  │
  │ PaymentService.ProcessPayment()
  ▼
Mojo pipe
  │
  ▼
Service implementation
```

The client doesn't need direct access to the service's memory.

---

# 20. Message Pipe

A simplified mental model:

```text
Endpoint A
    │
    │
════════════
   pipe
════════════
    │
Endpoint B
```

Messages travel through the pipe.

The endpoints may exist in different processes.

---

# 21. Handles

Mojo can transfer handles representing capabilities to communicate with resources/interfaces.

Think:

```text
handle
   ↓
capability to interact with something
```

rather than:

```text
raw pointer
```

This is important because a process shouldn't automatically gain arbitrary access to another process's internals.

---

# 22. Capability-Oriented Thinking

A useful security model:

```text
Process A
   │
   │ receives capability
   ▼
specific service
```

rather than:

```text
Process A
   │
   ▼
entire Browser Process
```

The capability limits what the caller can request.

This supports least privilege.

---

# 23. Renderer → Browser

Consider JavaScript requesting:

```javascript
fetch("/api/data");
```

Your JavaScript doesn't directly manipulate:

```text
TCP socket
TLS state
NIC
```

Instead, browser internals handle privileged operations.

Simplified:

```text
JavaScript
   ↓
Blink / Fetch machinery
   ↓
IPC
   ↓
Network service
   ↓
Socket / TLS / HTTP
```

This is a key browser architecture pattern.

---

# 24. Renderer → GPU

Consider:

```css
transform: translateZ(0);
```

or:

```javascript
canvas.getContext("webgl");
```

The renderer may need graphics services.

Simplified architecture:

```text
Renderer
   ↓
graphics command
   ↓
IPC
   ↓
GPU process
   ↓
GPU driver
   ↓
Hardware
```

Again:

```text
Renderer
```

does not simply gain unrestricted access to the GPU driver.

---

# 25. Renderer → Storage

A renderer may execute:

```javascript
indexedDB.open("app-db");
```

But the renderer does not directly manipulate arbitrary disk sectors.

Conceptually:

```text
JavaScript
   ↓
Storage API
   ↓
Browser / storage machinery
   ↓
IPC
   ↓
storage subsystem
   ↓
disk
```

The browser mediates the privileged operation.

---

# 26. IPC and the Renderer Sandbox

This is one of the most important concepts.

A renderer is intentionally restricted.

Yet it still needs to perform useful browser operations.

Therefore:

```text
Renderer
   ↓
limited request
   ↓
IPC
   ↓
privileged service
```

becomes the controlled escape hatch for legitimate operations.

---

# 27. The Dangerous Side

Now imagine the renderer is compromised.

The attacker can potentially send malicious IPC requests.

Therefore the service must not assume:

```text
"Renderer asked for it, so it must be safe."
```

Instead:

```text
Renderer input
      ↓
validation
      ↓
authorization/capability checks
      ↓
operation
```

This is why IPC interfaces are high-value security surfaces.

---

# 28. IPC Attack Surface

A vulnerable privileged interface might accidentally allow:

```text
Renderer
   ↓
malformed request
   ↓
privileged service
   ↓
memory corruption
```

Potential consequence:

```text
renderer compromise
        ↓
IPC vulnerability
        ↓
privilege escalation
        ↓
sandbox escape
```

Therefore browser vendors aggressively audit IPC boundaries.

---

# 29. Serialization Cost

Suppose you send:

```javascript
const hugeData = {
  records: new Array(1_000_000)
};
```

If the communication path requires serialization/copying:

```text
huge object
   ↓
encode
   ↓
copy
   ↓
transport
   ↓
decode
```

you can create:

```text
CPU cost
memory pressure
GC pressure
latency
```

This matters in high-performance applications.

---

# 30. Why "Just Send JSON" Can Be Expensive

Imagine:

```javascript
postMessage(hugeObject);
```

Conceptually:

```text
JavaScript object
        ↓
structured clone
        ↓
serialized representation
        ↓
transport
        ↓
new object graph
```

For large/high-frequency payloads, this can become expensive.

Senior engineers therefore reason about:

```text
payload size
frequency
copy count
allocation
lifetime
```

---

# 31. Structured Clone

Structured cloning supports many JavaScript values beyond JSON.

For example:

```text
Array
Object
Map
Set
Date
ArrayBuffer
typed arrays
```

subject to the algorithm's supported types and restrictions.

But the conceptual property remains:

```text
clone
≠
shared JavaScript object
```

---

# 32. Identity Changes

Suppose:

```javascript
const obj = { value: 10 };
```

You send it to another context.

The receiver doesn't get:

```text
same JS object identity
```

It gets another representation.

Therefore:

```javascript
receiverObj === senderObj
```

doesn't make sense across separate JavaScript realms/processes as "the same object."

This distinction matters when reasoning about message passing.

---

# 33. Transfer vs Clone

### Clone

```text
A owns data
     ↓
copy/clone
     ↓
B owns independent data
```

### Transfer

```text
A owns resource
     ↓
ownership transfer
     ↓
B owns resource
```

Transfer can avoid expensive duplication.

---

# 34. ArrayBuffer Transfer

Example:

```javascript
const buffer = new ArrayBuffer(1024);

worker.postMessage(buffer, [buffer]);
```

The buffer is transferred.

After transfer, the sender's access semantics change because ownership moved.

This is fundamentally different from simply copying the bytes.

---

# 35. SharedArrayBuffer

Shared memory is different:

```text
        Shared Memory
       /             \
      /               \
Process A             Process B
```

Both contexts can observe the same underlying memory.

That creates a new requirement:

```text
synchronization
```

and security considerations.

---

# 36. Atomics

When shared memory is used between JavaScript agents, `Atomics` provides synchronization primitives.

Conceptually:

```text
SharedArrayBuffer
       +
Atomics
       ↓
coordinated concurrent access
```

Without correct synchronization, race conditions can occur.

---

# 37. IPC vs Shared Memory

| Mechanism       | Main model                  |            Copying | Complexity  |
| --------------- | --------------------------- | -----------------: | ----------- |
| Message passing | Send data                   |              Often | Lower       |
| Transferable    | Transfer ownership          |            Reduced | Medium      |
| Shared memory   | Shared bytes                |            Minimal | High        |
| Mojo IPC        | Typed process communication | Depends on payload | Medium/High |

There is no universally best mechanism.

---

# 38. IPC and React

React developers usually think:

```text
Component
 ↓
State
 ↓
Props
 ↓
Event
```

But browser architecture underneath can look like:

```text
React
 ↓
DOM
 ↓
Blink
 ↓
Browser service
 ↓
IPC
 ↓
Network/GPU/etc.
```

Your React application is therefore sitting **on top of a distributed browser runtime**.

---

# 39. React Event Example

Consider:

```jsx
<button onClick={handleClick}>
  Pay
</button>
```

Simplified architecture:

```text
Physical input
      ↓
OS
      ↓
Browser
      ↓
Renderer
      ↓
DOM event machinery
      ↓
React event system
      ↓
handleClick()
```

If the action causes a network request:

```text
handleClick()
      ↓
fetch()
      ↓
browser networking
      ↓
Network service
      ↓
socket
```

Multiple boundaries can be crossed for one user action.

---

# 40. Next.js Example

Consider:

```text
Browser
  ↓
Next.js client
  ↓
fetch()
  ↓
Network service
  ↓
TLS
  ↓
Server
```

The browser process model is therefore relevant even when your application framework is Next.js.

---

# 🧪 LAYER 3 — DIAGNOSTIC LABS & RUNBOOKS

# 41. Lab 1 — Observe Process Separation

Open:

```text
chrome://process-internals
```

Load a page with multiple cross-site resources/iframes.

Build a table:

| Document  | Origin | Site | Process |
| --------- | ------ | ---- | ------- |
| Main page | ...    | ...  | ...     |
| iframe A  | ...    | ...  | ...     |
| iframe B  | ...    | ...  | ...     |

The objective is to correlate:

```text
URL
 ↓
origin
 ↓
site
 ↓
process
```

---

# 42. Lab 2 — Observe Network IPC Indirectly

Open:

```text
DevTools
 → Network
```

Execute:

```javascript
fetch("https://example.com");
```

Observe:

```text
request
response
timing
connection
protocol
```

You are not directly seeing Mojo packets here.

Instead, you're observing the **application-visible result of browser networking machinery**.

---

# 43. Lab 3 — Performance of Message Passing

Create a worker:

```javascript
const worker = new Worker("worker.js");

worker.postMessage({
  numbers: Array.from({ length: 100000 }, (_, i) => i)
});
```

Measure:

```javascript
performance.now()
```

around the operation.

Then experiment with:

```text
small payload
large payload
many small messages
one large message
transferable buffer
```

Compare behavior.

---

# 44. Lab 4 — Clone vs Transfer

Create:

```javascript
const buffer = new ArrayBuffer(10 * 1024 * 1024);
```

Compare:

```javascript
worker.postMessage(buffer);
```

with:

```javascript
worker.postMessage(buffer, [buffer]);
```

Observe the ownership semantics and performance characteristics.

This demonstrates an important principle:

```text
copy
vs
transfer
```

---

# 45. Lab 5 — Shared Memory

In an appropriate worker-based experiment:

```javascript
const sab = new SharedArrayBuffer(1024);
```

Use:

```javascript
new Int32Array(sab);
```

and synchronization through:

```javascript
Atomics
```

Study:

```text
shared memory
race conditions
synchronization
```

Do not assume SharedArrayBuffer availability in every browser context; modern browser security requirements apply.

---

# 46. Lab 6 — `postMessage()` Origin Validation

Parent:

```javascript
window.addEventListener("message", event => {
  console.log(event.origin);
});
```

Then send messages from different origins in a controlled environment.

Build:

```text
origin
message type
payload
accepted/rejected
```

This turns an abstract security rule into an observable system.

---

# 47. Lab 7 — Performance Trace

Open:

```text
DevTools
 → Performance
```

Record an interaction involving:

```text
click
 ↓
JS
 ↓
fetch
 ↓
render
```

Study the timing.

Then correlate the visible browser behavior with the conceptual architecture:

```text
Renderer
   ↓
browser/network subsystem
   ↓
response
   ↓
Renderer
   ↓
render
```

---

# 48. Lab 8 — Perfetto

For deeper browser internals:

```text
https://ui.perfetto.dev
```

Load an appropriate Chromium trace.

Look for:

```text
renderer threads
browser threads
GPU activity
scheduler activity
IPC-related events
```

The objective is not to memorize trace labels.

The objective is to learn:

> **Which thread/process did the work, and when?**

---

# 49. Lab 9 — DevTools Protocol

CDP allows external tooling to communicate with Chromium.

Conceptually:

```text
Playwright / Puppeteer
        ↓
Chrome DevTools Protocol
        ↓
Chromium
        ↓
Browser internals
```

Common domains include:

```text
Page
Network
Runtime
DOM
Emulation
Performance
HeapProfiler
```

CDP itself is an important automation/debugging communication layer, although it should not be confused with Chromium's internal Mojo IPC architecture.

---

# 50. Lab 10 — Network Debugging

Use:

```text
DevTools
 → Network
```

and optionally:

```text
chrome://net-export
```

for deeper network diagnostics.

Correlate:

```text
JavaScript fetch()
       ↓
network request
       ↓
network service
       ↓
socket/TLS/HTTP
       ↓
response
       ↓
renderer
```

---

# 🎯 LAYER 4 — THE CRUCIBLE

# 51. Prediction Challenge #1

Can Renderer A directly dereference a pointer from Renderer B?

### Answer

No.

Their address spaces are isolated.

Communication requires controlled mechanisms.

---

# 52. Prediction Challenge #2

Does IPC mean data is always copied?

### Answer

No.

Depending on the IPC/API and data type, communication may involve:

```text
serialization
copying
transfer
shared memory
handles
```

You must identify the specific mechanism.

---

# 53. Prediction Challenge #3

Why not let renderers directly access the network socket?

### Answer

Because network access is privileged browser functionality.

Direct unrestricted socket access would greatly weaken the renderer sandbox and security model.

Instead:

```text
Renderer
   ↓
browser-controlled interface
   ↓
network service
```

---

# 54. Prediction Challenge #4

If a renderer is compromised, can it send malicious IPC messages?

### Answer

Potentially yes.

Therefore privileged IPC endpoints must validate all untrusted input.

This is one of the most important browser-security principles.

---

# 55. Prediction Challenge #5

Is Mojo the same thing as `postMessage()`?

### Answer

No.

They operate at different layers.

```text
postMessage()
=
Web platform API
```

while:

```text
Mojo
=
Chromium's internal IPC framework
```

A web API can ultimately cause browser-internal IPC activity, but the two concepts should not be conflated.

---

# 56. Prediction Challenge #6

Does `postMessage()` require the two windows to be same-origin?

### Answer

No.

Its primary purpose includes controlled cross-origin communication.

But the receiver must validate:

```javascript
event.origin
```

---

# 57. Prediction Challenge #7

Why is sending 10 MB every frame potentially dangerous for performance?

Because you may introduce:

```text
large serialization
+
memory allocation
+
copying
+
IPC transport
+
deserialization
+
GC pressure
```

especially when repeated at high frequency.

---

# 58. Prediction Challenge #8

Why might transferring an `ArrayBuffer` outperform cloning it?

Because transfer can move ownership rather than duplicating the underlying bytes.

Conceptually:

```text
Clone:
A → copy → B

Transfer:
A → ownership → B
```

---

# 59. Prediction Challenge #9

Why is shared memory dangerous?

Because now multiple execution contexts can access the same memory.

That introduces:

```text
race conditions
synchronization complexity
timing behavior
security considerations
```

---

# 60. Prediction Challenge #10

Why is IPC itself a security boundary?

Because it connects:

```text
less-trusted process
```

to:

```text
more-privileged process/service
```

A vulnerable interface can become a privilege-escalation path.

---

# 61. Production Scenario — Renderer → Network

A developer says:

> "Our `fetch()` call is slow, so React is blocking the network."

Don't immediately accept this.

Investigate:

```text
React event
 ↓
JS execution
 ↓
Fetch API
 ↓
browser networking
 ↓
DNS
 ↓
connection
 ↓
TLS
 ↓
HTTP
 ↓
server
 ↓
response
 ↓
browser
 ↓
renderer
```

There are many potential bottlenecks.

This is systems-level debugging.

---

# 62. Production Scenario — Huge `postMessage`

An application sends:

```text
5 MB
```

of data through `postMessage()` every 100 ms.

Symptoms:

```text
jank
GC spikes
CPU usage
latency
```

Possible root cause:

```text
excessive structured cloning
```

Better architecture might involve:

```text
smaller messages
batching
transferables
shared memory
reduced frequency
```

depending on requirements.

---

# 63. Production Scenario — Third-Party iframe

Architecture:

```text
App
 │
 └── iframe
       ↓
 Third-party
```

The team asks:

> "Why can't our React code directly modify the iframe DOM?"

Reason:

```text
cross-origin boundary
        +
SOP
```

And potentially:

```text
different renderer process
```

Communication should use an explicit protocol:

```text
postMessage
```

with strict validation.

---

# 64. Production Scenario — Browser Security Bug

Imagine:

```text
Renderer
   ↓
malformed IPC request
   ↓
privileged service
   ↓
memory corruption
```

The vulnerability can potentially turn:

```text
renderer compromise
```

into:

```text
sandbox escape / privilege escalation
```

This demonstrates why Chromium's IPC surfaces receive significant security scrutiny.

---

# 65. Senior Interview Question

> Why does browser architecture become more complicated when you isolate processes?

Strong answer:

> Process isolation improves security and fault containment by giving different security contexts separate address spaces and privileges. However, isolated processes still need to cooperate, so the browser requires IPC mechanisms. IPC introduces serialization, scheduling, synchronization, and security-validation costs. Therefore browser architecture continuously balances process isolation against performance, memory consumption, and communication overhead.

That is a **Senior-level answer**.

---

# 66. Staff-Level Question

> Why can't you simply maximize the number of processes for maximum security?

Because process isolation has costs:

```text
more processes
 ↓
more memory
 ↓
more scheduling overhead
 ↓
more IPC
 ↓
more communication complexity
```

The browser must optimize across:

```text
security
performance
memory
startup
battery
fault isolation
```

Architecture is therefore a multi-objective optimization problem.

---

# 67. THE COMPLETE IPC MENTAL MODEL

```text
                  BROWSER
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
   Renderer A   Renderer B      GPU
        │            │            │
        └──────┬─────┘            │
               │                  │
               ▼                  ▼
             Mojo              Mojo
               │                  │
               ▼                  ▼
        Browser Services     GPU Service
               │
       ┌───────┼────────┐
       ▼       ▼        ▼
   Network   Storage   Other
   Service   Service   Services
```

The important principle:

```text
Processes are isolated.
IPC connects them.
IPC is controlled.
IPC is expensive.
IPC is security-sensitive.
```

---

# 🧠 68. THE FIVE QUESTIONS TO ASK IN ANY BROWSER TRACE

Whenever you encounter a browser performance/security issue, ask:

### 1. Who owns the work?

```text
Browser?
Renderer?
GPU?
Network?
Utility?
```

### 2. Which process is executing it?

```text
PID / process
```

### 3. Does communication cross a process boundary?

```text
same process?
different process?
```

### 4. What crosses the boundary?

```text
small message?
large object?
handle?
buffer?
shared memory?
```

### 5. What security privilege is being crossed?

```text
untrusted → privileged?
```

These five questions are extremely powerful for production debugging.

---

# 🔥 69. PART 07 MASTER CHECKLIST

```text
[x] Inter-Process Communication
[x] Process address-space isolation
[x] Why IPC is necessary
[x] Chromium IPC architecture
[x] Mojo
[x] Mojo interfaces
[x] Message pipes
[x] Handles
[x] Capability-oriented communication
[x] Renderer → Browser communication
[x] Renderer → Network communication
[x] Renderer → GPU communication
[x] Renderer → Storage communication
[x] Renderer sandbox relationship
[x] IPC as security boundary
[x] Untrusted renderer model
[x] IPC attack surface
[x] Input validation
[x] Serialization
[x] Structured Clone
[x] Copy vs transfer
[x] Transferables
[x] ArrayBuffer transfer
[x] SharedArrayBuffer
[x] Atomics
[x] Shared memory tradeoffs
[x] IPC performance costs
[x] Context/process boundaries
[x] React relationship
[x] Next.js relationship
[x] DevTools diagnostics
[x] chrome://process-internals
[x] Performance traces
[x] Perfetto
[x] CDP distinction
[x] Network debugging
[x] Production scenarios
[x] Senior interview questions
[x] Staff-level architectural reasoning
```

---

# 🔗 PART 07 → PART 08

We now have:

```text
PART 06
Security Boundaries
        ↓
"Processes must be isolated."
        ↓
PART 07
IPC
        ↓
"Processes need controlled communication."
```

The next question is:

> **Who actually creates, schedules, isolates, and provides resources to these processes?**

That takes us below the browser architecture into the operating system:

```text
Browser
   ↓
OS Process
   ↓
OS Threads
   ↓
Virtual Memory
   ↓
File Descriptors / Handles
   ↓
Network Sockets
   ↓
GPU Drivers
   ↓
Permissions
   ↓
Kernel
   ↓
Hardware
```

That is **KPI 01 — Part 08: Browser ↔ Operating System**.

---

[⬅️ Part 06: Site Isolation & Security Boundaries](./06-site-isolation-security-boundaries.md) | [📚 KPI 01 Index](./README.md) | [🧪 Lab 01](./examples/01-main-thread-vs-compositor-lab.html) | [🧪 Lab 02](./examples/02-layout-thrashing-benchmark-lab.html) | [🧪 Lab 03](./examples/03-event-loop-microtask-starvation-lab.html) | [🧪 Lab 04](./examples/05-page-lifecycle-bfcache-lab.html) | [🧪 Lab 05](./examples/07-ipc-structured-clone-transfer-lab.html) | [📋 Runbook](./examples/04-process-inspection-runbook.md) | [Part 08: Browser ↔ Operating System ➡️](./08-browser-operating-system.md)
