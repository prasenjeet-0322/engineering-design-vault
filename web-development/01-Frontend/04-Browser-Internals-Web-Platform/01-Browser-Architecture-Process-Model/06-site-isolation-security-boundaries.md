# KPI 01 — Part 06: Site Isolation & Security Boundaries

[⬅️ Part 05: Navigation & Page Lifecycle](./05-navigation-document-page-lifecycle.md) | [📚 KPI 01 Index](./README.md) | [🧪 Lab 01](./examples/01-main-thread-vs-compositor-lab.html) | [🧪 Lab 02](./examples/02-layout-thrashing-benchmark-lab.html) | [🧪 Lab 03](./examples/03-event-loop-microtask-starvation-lab.html) | [🧪 Lab 04](./examples/05-page-lifecycle-bfcache-lab.html) | [📋 Runbook](./examples/04-process-inspection-runbook.md) | [Part 07: IPC & Cross-Process Communication ➡️](./07-ipc-cross-process-communication.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer \| Founding Engineer)

---

# 🧭 PART 06 — WHAT YOU ARE LEARNING

```text
Origin
  ↓
Same-Origin Policy
  ↓
Site
  ↓
Site Isolation
  ↓
Renderer Process Boundaries
  ↓
OOPIF
  ↓
Sandbox
  ↓
Spectre Threat Model
  ↓
COOP / COEP / CORP
  ↓
Cross-Origin Isolation
```

The central idea:

> **The browser cannot treat every piece of JavaScript running in a tab as equally trusted.**

A page can embed:

* advertisements,
* analytics,
* payment providers,
* authentication providers,
* social widgets,
* malicious third-party content,

without giving that content unrestricted access to the embedding page.

Modern browser architecture therefore combines:

```text
Web security policies
+
process isolation
+
OS sandboxing
+
IPC validation
```

to contain compromise.

---

# ⚡ LAYER 1 — 30-SECOND EXECUTIVE CHEAT SHEET

## 1. The Most Important Distinction

### Origin

An origin is:

```text
scheme + host + port
```

Example:

```text
https://app.example.com:443
```

### Site

For the purposes relevant to Chromium's isolation model, a site is primarily based around the registrable domain plus scheme.

Example:

```text
https://a.example.com
https://b.example.com
```

are different **origins**, but can belong to the same **site**.

This distinction is foundational.

---

# 2. Origin vs Site

| Property                               | Origin                | Site                        |
| -------------------------------------- | --------------------- | --------------------------- |
| Main purpose                           | Web security identity | Process/isolation grouping  |
| Includes                               | Scheme + host + port  | Scheme + registrable domain |
| `app.example.com` vs `api.example.com` | Different origins     | Potentially same site       |
| Used by SOP                            | ✅                     | Not directly                |
| Important to Site Isolation            | Indirectly/directly   | ✅                           |
| Granularity                            | Finer                 | Coarser                     |

---

# 3. Same-Origin Policy

The **Same-Origin Policy (SOP)** restricts how a document or script from one origin can interact with resources from another origin.

Example:

```text
https://app.example.com
```

cannot arbitrarily read:

```text
https://bank.example
```

DOM state.

This is one of the foundational security mechanisms of the Web.

---

# 4. Site Isolation

**Site Isolation** is a browser architecture mechanism that places documents from different sites into different renderer processes where applicable.

Conceptually:

```text
Site A
  ↓
Renderer Process A

Site B
  ↓
Renderer Process B
```

The goal is to prevent a compromised renderer from directly exposing sensitive cross-site data through shared renderer memory.

---

# 5. OOPIF

**OOPIF = Out-of-Process iframe**

An iframe can visually appear inside another page while its document executes in a different renderer process.

```text
Browser Process
       │
       ├──────── Renderer A
       │          app.example
       │
       └──────── Renderer B
                  payment.example
                     ↑
                  iframe
```

This is one of the most important consequences of Site Isolation.

---

# 6. Sandbox

The renderer process is additionally sandboxed by the operating system.

Conceptually:

```text
Potentially compromised renderer
             ↓
       OS sandbox
             ↓
Limited privileges
```

Therefore:

```text
Web security
+
process isolation
+
OS sandbox
```

form multiple defensive layers.

---

# 7. Spectre

Spectre demonstrated that:

> **Process boundaries alone are not sufficient if sensitive data from different security contexts can be inferred through CPU microarchitectural side channels.**

This dramatically increased the importance of browser process isolation.

---

# 8. Cross-Origin Isolation

Modern web applications can opt into stronger isolation using mechanisms such as:

```text
COOP
COEP
```

which can establish a **cross-origin isolated** environment when their requirements are satisfied.

This enables powerful capabilities such as:

```text
SharedArrayBuffer
```

under appropriate conditions.

---

# 9. The Security Stack

Memorize this:

```text
                    WEB PAGE
                       │
              ┌────────┴────────┐
              │ Web Security    │
              │ SOP/CORS/etc.   │
              └────────┬────────┘
                       ↓
                Renderer Process
                       │
                 Site Isolation
                       │
                       ↓
                  OS Sandbox
                       │
                       ↓
                  OS Kernel
                       │
                       ↓
                    Hardware
```

Each layer addresses different threats.

---

# 🏛️ LAYER 2 — DEEP MECHANICAL BREAKDOWN

# 10. Why Do Browsers Need Security Boundaries?

Imagine:

```text
your-app.com
```

embeds:

```text
ads.example
```

and:

```text
payments.example
```

and:

```text
analytics.example
```

The browser executes JavaScript from all of these sources.

If all content shared unrestricted access to one memory space:

```text
Renderer Memory
├── your-app data
├── payment data
├── ad data
└── analytics data
```

then a renderer compromise could potentially expose data belonging to unrelated sites.

The browser therefore needs boundaries.

---

# 11. Web Security vs Process Security

These are different.

### Web security

Controls what web content is allowed to access.

Examples:

```text
Same-Origin Policy
CORS
CSP
CORP
COEP
COOP
```

### Process security

Controls what compromised code can access at the operating-system level.

Examples:

```text
renderer process isolation
OS sandbox
IPC permissions
process privileges
```

You need both.

---

# 12. The Same-Origin Policy

Suppose:

```text
https://app.example
```

loads:

```text
https://api.example
```

These are potentially different origins depending on host/scheme/port.

A script running in one origin does not automatically gain unrestricted DOM access to another origin.

This prevents attacks such as:

```text
evil.example
   ↓
attempts to read
   ↓
bank.example DOM
```

---

# 13. Origin Definition

For normal HTTP(S) URLs:

```text
Origin =
scheme + host + port
```

Example:

```text
https://example.com:443
```

versus:

```text
http://example.com:80
```

Different schemes mean different origins.

Likewise:

```text
https://app.example.com
https://api.example.com
```

have different hosts and therefore different origins.

---

# 14. Same Site but Different Origin

Consider:

```text
https://app.example.com
https://api.example.com
```

They are:

```text
Different origins
```

but may be:

```text
Same site
```

This is the distinction you must understand before studying Site Isolation.

---

# 15. Why Site Is Coarser Than Origin

Suppose:

```text
shop.example.com
account.example.com
```

Both are controlled by the same registrable domain:

```text
example.com
```

but each is a distinct origin.

Historically, browsers had concepts such as:

```text
document.domain
```

that allowed certain same-site subdomains to relax DOM isolation.

Modern browser security architecture increasingly discourages such legacy relaxation mechanisms.

---

# 16. Site Isolation's Core Objective

Consider:

```text
Main Page
https://bank.example
```

containing:

```html
<iframe src="https://evil.example"></iframe>
```

Without strong process isolation, both documents might execute within one renderer process.

With Site Isolation:

```text
Browser Process
       │
       ├──────── Renderer A
       │            │
       │       bank.example
       │
       └──────── Renderer B
                    │
                evil.example
```

Now the browser has a stronger architectural boundary.

---

# 17. The Critical Security Property

Suppose:

```text
evil.example
```

has a memory-safety vulnerability in its renderer.

The attacker may gain control of:

```text
Renderer B
```

But Site Isolation attempts to prevent the attacker from simply reading:

```text
Renderer A memory
```

where sensitive cross-site data may exist.

This is the concept of **blast-radius reduction**.

---

# 18. Why Process Isolation Matters

A process normally has its own virtual address space.

Conceptually:

```text
Process A
Virtual Memory
├── page data
├── JS heap
└── DOM state

Process B
Virtual Memory
├── iframe data
├── JS heap
└── DOM state
```

Process B cannot simply dereference an address belonging to Process A.

The OS memory-management system enforces that boundary.

---

# 19. But Processes Don't Make You Automatically Secure

This is critical.

A renderer process can still have:

```text
memory corruption
logic bugs
sandbox escapes
IPC vulnerabilities
side-channel vulnerabilities
```

Therefore the security model is layered.

```text
Site Isolation
      +
Sandbox
      +
IPC validation
      +
OS security
      +
Web security policies
```

---

# 20. OOPIF — The Important Mental Model

Consider:

```html
<iframe src="https://payments.example"></iframe>
```

The iframe is visually inside the page.

But architecturally:

```text
Browser
│
├── Renderer A
│    └── shop.example
│
└── Renderer B
     └── payments.example
```

The iframe's DOM is therefore not necessarily inside the same renderer process as the embedding document.

That is:

```text
Visual containment
≠
Process containment
```

This is a **very important Senior-level concept**.

---

# 21. Why OOPIF Is Necessary

Imagine a banking page:

```text
bank.example
```

contains:

```text
ads.example
```

If the advertisement renderer is compromised:

```text
ads.example exploit
      ↓
renderer compromise
```

the attacker should not automatically receive direct memory access to:

```text
bank.example
```

OOPIF helps establish this process separation.

---

# 22. Cross-Process DOM Interaction

Now a difficult question:

> If the iframe is in another process, how can JavaScript interact with it?

Through browser-mediated mechanisms.

Conceptually:

```text
Renderer A
   │
   │ request
   ↓
Browser / IPC
   │
   ↓
Renderer B
```

The browser and IPC system enforce the security rules.

This leads directly into **Part 07 — IPC & Cross-Process Communication**.

---

# 23. `window.postMessage()`

Cross-origin frames can communicate using:

```javascript
iframe.contentWindow.postMessage(
  {
    type: "PAYMENT_COMPLETE"
  },
  "https://payments.example"
);
```

The receiver can listen:

```javascript
window.addEventListener("message", event => {
  console.log(event.origin);
  console.log(event.data);
});
```

But the receiver must validate:

```javascript
if (event.origin !== "https://payments.example") {
  return;
}
```

This is an important production security practice.

---

# 24. SOP Does Not Mean "No Communication"

A common misconception:

> "Cross-origin pages cannot communicate."

Incorrect.

They can communicate through explicitly designed mechanisms.

Examples include:

```text
postMessage
CORS
Fetch with appropriate policy
BroadcastChannel under origin rules
credential mechanisms
server-mediated APIs
```

The key is:

> **Cross-origin communication is controlled, not universally prohibited.**

---

# 25. SOP vs CORS

These are frequently confused.

### SOP

A browser security restriction.

It limits what scripts from one origin can access from another origin.

### CORS

A mechanism through which a server explicitly communicates which cross-origin requests may be allowed.

Conceptually:

```text
Script
 ↓
Cross-origin request
 ↓
Browser security checks
 ↓
Server response headers
 ↓
Browser decides whether response is exposed
```

CORS does not mean:

> "Turn off SOP."

It is a controlled mechanism within the browser security model.

---

# 26. Site Isolation vs SOP

These solve different problems.

### SOP

```text
Web-content access policy
```

### Site Isolation

```text
Process-level architectural isolation
```

You can have:

```text
SOP
+
Site Isolation
```

working simultaneously.

---

# 27. CORP

**Cross-Origin Resource Policy (CORP)** allows a resource to declare restrictions on which origins can load it in certain contexts.

Example:

```http
Cross-Origin-Resource-Policy: same-origin
```

Conceptually:

```text
Resource
   ↓
"Only my origin should load me in applicable contexts"
```

It helps defend against unwanted cross-origin resource inclusion.

---

# 28. COEP

**Cross-Origin-Embedder-Policy (COEP)** controls how a document can load cross-origin resources.

A common configuration is:

```http
Cross-Origin-Embedder-Policy: require-corp
```

This requires embedded cross-origin resources to satisfy appropriate cross-origin loading requirements.

---

# 29. COOP

**Cross-Origin-Opener-Policy (COOP)** controls the relationship between a document and cross-origin documents opened through browsing contexts.

Example:

```http
Cross-Origin-Opener-Policy: same-origin
```

This helps isolate a document from cross-origin opener relationships.

---

# 30. Cross-Origin Isolation

A document can become:

```javascript
crossOriginIsolated === true
```

when the required isolation policies are satisfied.

Check:

```javascript
console.log(window.crossOriginIsolated);
```

If:

```text
true
```

the page is operating under stronger cross-origin isolation semantics.

---

# 31. Why `SharedArrayBuffer` Matters

`SharedArrayBuffer` allows memory to be shared between JavaScript execution contexts in ways that can enable highly efficient communication.

But shared memory creates security concerns, particularly in the context of high-resolution timing and microarchitectural side channels.

Therefore modern browsers impose stronger security requirements around its use.

Conceptually:

```text
Shared memory
      ↓
Potential timing channels
      ↓
Need stronger isolation
```

This is one reason cross-origin isolation matters.

---

# 32. Spectre Changed the Threat Model

Before Spectre, a simplified security model might look like:

```text
Process A
   ≠
Process B
```

Therefore:

```text
memory isolation
=
security isolation
```

Spectre demonstrated that CPU speculation can create observable side effects that may leak information across security boundaries.

The security model became:

```text
Process isolation
       +
microarchitectural isolation considerations
```

---

# 33. Speculative Execution

Modern CPUs perform speculative execution.

Conceptually:

```text
CPU predicts branch
      ↓
executes instructions speculatively
      ↓
prediction may be wrong
      ↓
architectural state rolled back
```

But microarchitectural side effects can remain observable.

These can potentially be exploited as side channels.

---

# 34. Why Browsers Were Especially Vulnerable

A browser runs attacker-controlled JavaScript.

That is unusual.

An attacker can intentionally provide code such as:

```javascript
// malicious computation
```

and attempt to exploit CPU behavior.

The browser therefore has to assume:

> **The JavaScript itself may be adversarial.**

This is why browser security architecture is substantially more complex than many application developers realize.

---

# 35. Site Isolation as Spectre Mitigation

Suppose:

```text
Renderer A
bank.example
```

contains sensitive data.

And:

```text
Renderer B
evil.example
```

contains attacker-controlled JavaScript.

If they share a process:

```text
same renderer memory
```

then a renderer-level side channel may have a larger blast radius.

If they are separated:

```text
Renderer A
bank.example

Renderer B
evil.example
```

the attacker is denied direct access to the other renderer's address space.

This significantly strengthens containment.

---

# 36. The Browser Process as Security Coordinator

The browser process generally has greater privileges than renderers.

Conceptually:

```text
              Browser Process
             /       |       \
            /        |        \
     Renderer A  Renderer B   GPU
```

The renderer requests privileged operations through browser-mediated interfaces.

For example:

```text
Renderer
   ↓
IPC request
   ↓
Browser / privileged service
   ↓
permission/security checks
   ↓
operation
```

This architecture reduces the privileges available to web content.

---

# 37. Renderer Sandbox

The renderer is intentionally constrained.

Conceptually:

```text
JavaScript
    ↓
Blink/V8
    ↓
Renderer Process
    ↓
Sandbox
    ↓
Limited OS capabilities
```

If JavaScript exploits a renderer memory-safety bug, the attacker ideally remains trapped inside a restricted environment.

---

# 38. Sandbox Escape

A particularly dangerous attack chain is:

```text
Web content
   ↓
Renderer vulnerability
   ↓
Renderer code execution
   ↓
Sandbox escape
   ↓
Higher OS privileges
   ↓
System compromise
```

Security engineering therefore treats:

```text
renderer exploit
```

and:

```text
sandbox escape
```

as separate stages.

---

# 39. Defense in Depth

Modern browser security can be visualized as:

```text
             Attacker JavaScript
                     ↓
              Web security
                     ↓
             Renderer process
                     ↓
             Site isolation
                     ↓
              OS sandbox
                     ↓
              IPC validation
                     ↓
                 OS kernel
                     ↓
                 Hardware
```

Breaking one layer should ideally not mean complete compromise.

---

# 40. Browser Security Boundary Hierarchy

A useful mental model:

```text
Origin
  ↓
Web security policy
  ↓
Site
  ↓
Renderer process
  ↓
Sandbox
  ↓
OS process boundary
  ↓
Kernel
```

But don't treat these as interchangeable concepts.

Each represents a different layer.

---

# 🧪 LAYER 3 — DIAGNOSTIC LABS & DEVTOOLS RUNBOOKS

# 41. Lab 1 — Observe Origins

Open DevTools Console and run:

```javascript
location.origin
```

Example:

```text
https://example.com
```

Then inspect:

```javascript
location.protocol
location.hostname
location.port
```

Build the origin manually:

```text
scheme + host + port
```

---

# 42. Lab 2 — Inspect an iframe

Create:

```html
<iframe
  src="https://example.com"
  width="500"
  height="300">
</iframe>
```

Then inspect the page using:

```text
DevTools
 → Elements
```

Notice:

```text
iframe
```

is a DOM node in the embedding document.

But the iframe's document may execute in a different renderer process.

This demonstrates:

```text
DOM representation
≠
process topology
```

---

# 43. Lab 3 — Verify Process Topology

Open:

```text
chrome://process-internals
```

Then create a page with:

```text
main-site.example
```

and cross-site iframe:

```text
third-party.example
```

Inspect the process topology.

Look for separate renderer processes where Chromium's current process model assigns them separately.

The important lesson is not memorizing a PID.

It is learning to answer:

> **Which document is executing in which process, and why?**

---

# 44. Lab 4 — Verify Cross-Origin Identity

Create:

```javascript
console.log(location.origin);
```

inside the main page.

Then execute equivalent code inside the iframe where same-origin access is permitted.

For cross-origin frames, direct DOM access will be restricted by SOP.

This is a live demonstration of:

```text
origin boundary
```

---

# 45. Lab 5 — `postMessage`

Parent:

```javascript
const iframe = document.querySelector("iframe");

iframe.contentWindow.postMessage(
  { type: "HELLO" },
  "https://example.com"
);
```

Receiver:

```javascript
window.addEventListener("message", event => {
  console.log({
    origin: event.origin,
    data: event.data
  });
});
```

Then intentionally test an unexpected origin.

Your security check should reject it.

---

# 46. Lab 6 — Cross-Origin Isolation

Run:

```javascript
window.crossOriginIsolated
```

Observe:

```text
true
```

or:

```text
false
```

Then inspect the response headers.

You are learning to connect:

```text
HTTP headers
      ↓
Document security state
      ↓
Browser capabilities
```

---

# 47. Lab 7 — Inspect COOP / COEP

Use:

```text
DevTools
 → Network
 → Document request
 → Headers
```

Look for:

```text
Cross-Origin-Opener-Policy
Cross-Origin-Embedder-Policy
```

Then compare:

```javascript
crossOriginIsolated
```

This establishes the relationship between HTTP response policy and runtime browser state.

---

# 48. Lab 8 — DevTools Security Panel

Open:

```text
DevTools
 → Security
```

Inspect:

* HTTPS,
* certificate,
* origin/security information,
* connection details.

This is useful for connecting application behavior to browser security state.

---

# 49. Lab 9 — Process Crash Experiment

Use a controlled test environment rather than production.

The goal is to understand that a renderer failure can have a smaller blast radius than a browser-process failure.

Observe:

```text
Renderer failure
      ↓
Affected document/process
```

versus:

```text
Browser process failure
      ↓
Much larger browser-wide impact
```

Do not attempt arbitrary crash payloads against production browsers.

---

# 50. Lab 10 — Process Tree Exercise

Create a test page containing:

```text
Main document
├── same-site iframe
├── cross-site iframe
├── another cross-site iframe
└── nested iframe
```

Then inspect:

```text
chrome://process-internals
```

Draw the resulting process graph.

Your objective:

```text
URL
 ↓
Origin
 ↓
Site
 ↓
Process
```

for every document.

---

# 🎯 LAYER 4 — THE CRUCIBLE

# 51. Prediction Challenge #1

Are these the same origin?

```text
https://example.com
https://example.com:443
```

### Answer

For standard HTTPS, these resolve to the same origin because HTTPS's default port is 443.

---

# 52. Prediction Challenge #2

Are these the same origin?

```text
https://app.example.com
https://api.example.com
```

### Answer

No.

Different hosts mean different origins.

They may nevertheless be considered the same **site** for relevant site-isolation concepts.

---

# 53. Prediction Challenge #3

Does Site Isolation mean every origin gets its own process?

### Answer

No.

This is a classic gotcha.

Chromium's process model has allocation rules and optimizations. Site Isolation primarily establishes stronger process separation between different sites where required; it is not equivalent to a universal one-origin-one-process rule.

---

# 54. Prediction Challenge #4

Does an iframe always execute in the same process as its parent?

### Answer

No.

A cross-site iframe can become an **OOPIF** and execute in another renderer process.

---

# 55. Prediction Challenge #5

If two pages are in different renderer processes, can they never communicate?

### Answer

Incorrect.

They can communicate through browser-mediated mechanisms such as:

```text
postMessage
IPC
browser APIs
network communication
```

Security policies determine what operations are permitted.

---

# 56. Prediction Challenge #6

Does CORS remove the Same-Origin Policy?

### Answer

No.

CORS provides controlled permission for certain cross-origin resource interactions.

It does not eliminate SOP.

---

# 57. Prediction Challenge #7

Does `postMessage()` make cross-origin communication unrestricted?

### Answer

No.

The receiver should validate:

```javascript
event.origin
```

and ideally the expected message structure.

For example:

```javascript
if (event.origin !== "https://trusted.example") {
  return;
}
```

---

# 58. Prediction Challenge #8

If a renderer process is compromised, does that automatically mean the entire operating system is compromised?

### Answer

No.

The renderer is sandboxed specifically to reduce the impact of renderer compromise.

A successful sandbox escape would be a separate escalation.

---

# 59. Prediction Challenge #9

Is Site Isolation the same thing as the Same-Origin Policy?

### Answer

No.

```text
SOP
=
web-access security policy
```

while:

```text
Site Isolation
=
browser process architecture
```

They reinforce each other but solve different problems.

---

# 60. Prediction Challenge #10

Why did Spectre increase the importance of Site Isolation?

### Answer

Because Spectre demonstrated that speculative execution and microarchitectural side channels can potentially leak information across conventional security boundaries.

Browser architecture therefore needed stronger separation between sensitive and attacker-controlled web content.

---

# 61. Production Scenario #1 — Payment iframe

Architecture:

```text
shop.example
     │
     └── iframe
           ↓
       payments.example
```

Questions:

1. Same origin?
2. Same site?
3. Same renderer process?
4. Can parent directly read iframe DOM?
5. How should communication occur?

### Answer

1. Generally different origins.
2. Potentially different sites depending on domains.
3. A cross-site iframe may be an OOPIF.
4. SOP prevents unrestricted direct DOM access.
5. Use an explicit mechanism such as `postMessage()` with strict origin validation.

---

# 62. Production Scenario #2 — Malicious Advertisement

```text
news.example
   │
   └── iframe
         ↓
      ads.example
```

Suppose the advertisement renderer has a vulnerability.

Desired architecture:

```text
ads compromise
      ↓
ads renderer
      ↓
sandbox containment
      ↓
limited privileges
```

and:

```text
news.example renderer
```

remains isolated.

This is the security value of process isolation + sandboxing.

---

# 63. Production Scenario #3 — OAuth

Imagine:

```text
your-app.example
        ↓
auth-provider.example
```

The application must not assume:

```text
cross-origin
=
trusted
```

Instead, explicitly validate:

```text
origin
message type
payload structure
state/nonce where applicable
```

Security is based on explicit trust relationships.

---

# 64. Production Scenario #4 — `SharedArrayBuffer`

A team says:

> "Let's enable SharedArrayBuffer because it's faster."

Senior response:

```text
Why?
 ↓
What communication pattern requires shared memory?
 ↓
Is the document cross-origin isolated?
 ↓
Are COOP/COEP requirements satisfied?
 ↓
What cross-origin resources must change?
 ↓
What deployment/security implications follow?
```

This is architecture-level thinking.

---

# 65. Production Scenario #5 — Third-Party Widget

You embed:

```text
thirdparty-widget.example
```

The widget requests:

```text
access to parent DOM
cookies
storage
network resources
postMessage communication
```

Do not reason:

> "It's an iframe, therefore it's safe."

Instead ask:

```text
What origin?
What site?
What process?
What sandbox?
What permissions?
What storage partition?
What communication channel?
What browser policy?
```

---

# 66. Interview Gotcha — "Origin Is Domain"

Wrong.

Origin is:

```text
scheme + host + port
```

Not merely:

```text
domain
```

---

# 67. Interview Gotcha — "Site Isolation Prevents XSS"

Not directly.

XSS is primarily a web application/content security problem.

Site Isolation limits the process-level blast radius of compromised web content.

They address different layers.

---

# 68. Interview Gotcha — "CORS Protects the Server"

CORS is primarily enforced by browsers to control whether cross-origin responses are exposed to requesting web content.

It is not an authentication or authorization mechanism.

Your server must still enforce authorization independently.

---

# 69. Interview Gotcha — "Sandbox = iframe sandbox attribute"

Not necessarily.

There are two distinct ideas:

```text
HTML iframe sandboxing
```

and:

```text
browser/OS renderer sandbox
```

They operate at different architectural layers.

Do not conflate them.

---

# 70. Interview Gotcha — "OOPIF Means Separate Tab"

Wrong.

An OOPIF is an iframe whose document executes in a different renderer process from its embedding document.

Visually:

```text
same page
```

Architecturally:

```text
multiple processes
```

---

# 71. Interview Gotcha — "Different Process Means No Relationship"

Wrong.

The browser coordinates processes through IPC.

For example:

```text
Renderer A
    │
    │ IPC
    ↓
Browser
    │
    │ IPC
    ↓
Renderer B
```

This is exactly why **IPC** becomes the next topic.

---

# 🔬 72. Advanced: Site Isolation and React/Next.js

Consider a Next.js application:

```text
app.example
```

embedding:

```text
Stripe iframe
```

or:

```text
Auth0 iframe
```

or:

```text
analytics iframe
```

Your React component tree might look conceptually like:

```text
React App
 └── PaymentComponent
       └── iframe
```

But the browser architecture may be:

```text
React
  ↓
DOM
  ↓
iframe element
  │
  ├── Renderer A
  │    React/Next application
  │
  └── Renderer B
       Third-party origin
```

React's component tree is therefore **not equivalent to the browser's process tree**.

This is a critical architectural distinction.

---

# 🔬 73. Advanced: React DevTools vs Browser Process Model

React DevTools shows:

```text
React component hierarchy
```

Chrome process tools show:

```text
browser process hierarchy
```

These answer completely different questions.

```text
React:
"What components exist?"

Browser:
"What execution contexts/processes exist?"
```

Senior engineers need both models.

---

# 🔬 74. Advanced: Next.js Server vs Browser Security

Next.js can execute code in:

```text
Server
```

and:

```text
Browser
```

These have fundamentally different security boundaries.

A server-side secret:

```text
DATABASE_PASSWORD
```

must never be assumed accessible to client JavaScript.

Client code ultimately runs in an attacker-controlled environment.

The browser's process/security model reinforces this fundamental principle:

> **Never place secrets in browser-executable code.**

---

# 🧠 75. The Complete Security Architecture

Memorize this architecture:

```text
                         INTERNET
                            │
                            ▼
                    Browser Process
                  /        |        \
                 /         |         \
                ▼          ▼          ▼
         Renderer A   Renderer B    GPU/etc.
         Site A       Site B
            │            │
            │            │
        Sandbox      Sandbox
            │            │
            └──────┬─────┘
                   │
                  IPC
                   │
                   ▼
               OS Kernel
                   │
                   ▼
                Hardware
```

And at the web layer:

```text
Origin
  ↓
SOP
  ↓
CORS / CORP
  ↓
COEP
  ↓
COOP
  ↓
Cross-Origin Isolation
```

These aren't a single hierarchy; they are overlapping defensive mechanisms.

---

# 🧠 76. THE SENIOR ENGINEER MODEL

When you encounter an unfamiliar third-party integration, ask:

```text
┌───────────────────────────────────────┐
│ 1. What is its ORIGIN?                │
├───────────────────────────────────────┤
│ 2. What is its SITE?                  │
├───────────────────────────────────────┤
│ 3. What PROCESS runs it?              │
├───────────────────────────────────────┤
│ 4. Is it an OOPIF?                    │
├───────────────────────────────────────┤
│ 5. What SANDBOX applies?              │
├───────────────────────────────────────┤
│ 6. What IPC/API boundary exists?      │
├───────────────────────────────────────┤
│ 7. What DATA can cross the boundary?  │
├───────────────────────────────────────┤
│ 8. What policies control access?      │
├───────────────────────────────────────┤
│ 9. What happens if it is compromised? │
├───────────────────────────────────────┤
│ 10. What is the BLAST RADIUS?         │
└───────────────────────────────────────┘
```

That is the mindset this part is designed to develop.

---

# 🎯 77. PART 06 — MASTER CHECKLIST

```text
[x] Origin
[x] Origin = scheme + host + port
[x] Site
[x] Origin vs Site
[x] Same-Origin Policy
[x] Cross-origin access
[x] Site Isolation
[x] Why Site Isolation exists
[x] Process-level isolation
[x] OOPIF
[x] Cross-origin iframe architecture
[x] Visual containment vs process containment
[x] Renderer sandbox
[x] Sandbox vs iframe sandbox attribute
[x] Sandbox escape threat model
[x] Blast-radius containment
[x] Browser process security role
[x] IPC security boundary
[x] postMessage
[x] SOP vs CORS
[x] CORP
[x] COEP
[x] COOP
[x] Cross-origin isolation
[x] crossOriginIsolated
[x] SharedArrayBuffer security context
[x] Spectre
[x] Speculative execution
[x] Microarchitectural side channels
[x] Defense in depth
[x] chrome://process-internals
[x] DevTools Security
[x] Network header inspection
[x] Process topology exercises
[x] React relationship
[x] Next.js relationship
[x] Production scenarios
[x] Prediction challenges
[x] Senior interview gotchas
```

---

# 🔥 THE ONE DIAGRAM YOU SHOULD REMEMBER

```text
                         WEB
                          │
                    ┌─────┴─────┐
                    │   Origin  │
                    └─────┬─────┘
                          │
                    SOP / CORS
                          │
                          ▼
                      Site A
                          │
                   Renderer A
                          │
                       Sandbox
                          │
                          │
                         IPC
                          │
                          │
                      Renderer B
                          │
                       Sandbox
                          │
                      Site B
                          │
                    Different
                      origin
```

And when Spectre enters the threat model:

```text
                    Attacker JS
                         │
                         ▼
                 Renderer B exploit
                         │
                  ┌──────┴──────┐
                  │             │
             Site Isolation   Sandbox
                  │             │
                  └──────┬──────┘
                         ▼
                  Reduced Blast Radius
```

---

# 🔗 HOW PART 06 CONNECTS TO THE NEXT PART

You now have the problem:

```text
Site A
   ↓
Renderer A

Site B
   ↓
Renderer B
```

But now comes the obvious question:

> **How do these isolated processes actually communicate?**

That is **Part 07 — IPC & Cross-Process Communication**.

We'll go from:

```text
Renderer A
     │
     │
     ?
     │
Renderer B
```

to:

```text
Renderer A
     │
     ▼
 Mojo IPC
     │
     ▼
Browser / Service
     │
     ▼
 Mojo IPC
     │
     ▼
Renderer B
```

including **Mojo interfaces, message serialization, structured cloning, transferable objects, shared memory, validation at privilege boundaries, IPC attack surfaces, performance costs, and real OOPIF communication traces**.

**That is the correct Part 07 for KPI 01.**

---

[⬅️ Part 05: Navigation & Page Lifecycle](./05-navigation-document-page-lifecycle.md) | [📚 KPI 01 Index](./README.md) | [🧪 Lab 01](./examples/01-main-thread-vs-compositor-lab.html) | [🧪 Lab 02](./examples/02-layout-thrashing-benchmark-lab.html) | [🧪 Lab 03](./examples/03-event-loop-microtask-starvation-lab.html) | [🧪 Lab 04](./examples/05-page-lifecycle-bfcache-lab.html) | [📋 Runbook](./examples/04-process-inspection-runbook.md) | [Part 07: IPC & Cross-Process Communication ➡️](./07-ipc-cross-process-communication.md)
