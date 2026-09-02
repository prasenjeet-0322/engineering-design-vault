# KPI 02 — Part 07: Events, Input & User Interaction

[⬅️ Part 06: JavaScript Execution & Event Loop](./06-page-lifecycle-events.md) | [📚 KPI 02 Index](./README.md) | [🧪 Lab 01](./examples/01-navigation-lifecycle-timeline-lab.html) | [🧪 Lab 02](./examples/02-dns-connection-benchmark-lab.html) | [🧪 Lab 03](./examples/03-tls-handshake-certificate-lab.html) | [🧪 Lab 04](./examples/04-http-stream-cache-waterfall-lab.html) | [🧪 Lab 05](./examples/05-critical-rendering-path-priority-lab.html) | [🧪 Lab 06](./examples/06-event-loop-long-task-scheduler-lab.html) | [🧪 Lab 07](./examples/07-dom-event-propagation-delegation-lab.html) | [Part 08: BFCache Deep Mechanics ➡️](./08-bfcache-deep-mechanics.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer \| Founding Engineer)

---

# 🧭 PART POSITION

This part moves one layer outward from the browser's event loop:

> **"How does physical/user input become browser events, how are those events dispatched through the DOM tree, how do default actions interact with JavaScript, and how does event handling affect interaction responsiveness?"**

---

# LAYER 1 — ⚡ 30-SECOND EXECUTIVE CHEAT SHEET

## The Complete Mental Model

```text
Physical Input
     │
     ▼
OS / Input Subsystem
     │
     ▼
Browser
     │
     ▼
Input Routing / Hit Testing
     │
     ▼
DOM Event Creation
     │
     ▼
Capture Phase
     │
     ▼
Target Phase
     │
     ▼
Bubble Phase
     │
     ▼
Default Action
     │
     ▼
Rendering / Navigation / Other Browser Work
```

The central Senior-level idea:

> **An event is not merely a callback. It is the browser's mechanism for propagating an input occurrence through a DOM tree while coordinating JavaScript with browser-defined default behavior.**

---

# 1. 🟢 [DAILY DRIVER] — WHAT IS A DOM EVENT?

A DOM event represents something that happened which the browser exposes to application code.

Examples:

```text
click
pointerdown
pointerup
keydown
input
change
submit
focus
blur
scroll
```

A developer can register an event listener:

```javascript
button.addEventListener("click", handler);
```

But the important architecture is:

```text
User action
    ↓
Browser detects input
    ↓
Browser determines target
    ↓
Event object created
    ↓
Event dispatched
    ↓
Listeners invoked
    ↓
Default action may occur
```

The listener is only one stage in this pipeline.

---

# 2. INPUT IS NOT THE SAME AS AN EVENT

These concepts should not be conflated.

```text
Input
 ↓
Browser processing
 ↓
DOM Event
```

For example:

```text
physical mouse movement
```

is not literally the same thing as:

```javascript
new PointerEvent(...)
```

The browser receives and processes lower-level input before exposing a DOM-facing event.

This distinction becomes important when diagnosing:

* input latency,
* pointer behavior,
* touch interactions,
* event coalescing,
* browser gestures,
* main-thread contention.

---

# 3. 🟡 [MODERATE] — INPUT ROUTING

Consider:

```text
User clicks
   │
   ▼
Browser receives input
   │
   ▼
Which page/window?
   │
   ▼
Which document?
   │
   ▼
Which element?
   │
   ▼
Event target
```

The browser must determine where the interaction belongs.

For pointer input, this involves concepts such as **hit testing**.

Conceptually:

```text
Screen coordinate
      │
      ▼
Browser determines rendered object
      │
      ▼
DOM-associated target
```

This is why the DOM hierarchy alone isn't sufficient to explain pointer targeting.

The browser also has a rendered representation of the page.

---

# 4. EVENT TARGET

Suppose:

```html
<button id="save">
  <span>Save</span>
</button>
```

If the user clicks the `<span>`:

```text
Event target
    ↓
<span>
```

The event can then propagate through its ancestor chain.

Conceptually:

```text
document
   │
   ▼
body
   │
   ▼
button
   │
   ▼
span  ← target
```

This distinction is critical:

```javascript
event.target
```

is not necessarily:

```javascript
event.currentTarget
```

---

# 5. `TARGET` VS `CURRENTTARGET`

Consider:

```javascript
button.addEventListener("click", event => {
  console.log(event.target);
  console.log(event.currentTarget);
});
```

If the `<span>` inside the button was clicked:

```text
event.target
    ↓
<span>

event.currentTarget
    ↓
<button>
```

Mental model:

```text
target
  =
where the event originated

currentTarget
  =
element whose listener is currently executing
```

This distinction is fundamental for event delegation.

---

# 6. THREE EVENT DISPATCH PHASES

DOM event propagation is commonly understood as:

```text
CAPTURE
   ↓
TARGET
   ↓
BUBBLE
```

For:

```text
document
   │
 body
   │
 div
   │
button
```

an event targeting `button` conceptually travels:

```text
document
   ↓
body
   ↓
div
   ↓
button
   ↑
div
   ↑
body
   ↑
document
```

The downward traversal is the **capture phase**.

The upward traversal is the **bubble phase**.

---

# 7. CAPTURE PHASE

Register:

```javascript
document.addEventListener(
  "click",
  handler,
  { capture: true }
);
```

The listener participates during the capture phase.

Conceptually:

```text
document
   │
   ▼
body
   │
   ▼
div
   │
   ▼
button
```

This is useful when an ancestor needs to observe events before they reach the target.

---

# 8. BUBBLING PHASE

Default event listeners generally participate in the bubbling phase.

```javascript
container.addEventListener("click", handler);
```

Conceptually:

```text
button
   │
   ▼
div
   │
   ▼
container
```

This property makes event delegation possible.

---

# 9. TARGET PHASE

Eventually the event reaches its target:

```text
document
 ↓
body
 ↓
container
 ↓
button ← TARGET
```

Listeners associated with the target are then processed according to the event dispatch rules.

The simplistic statement:

> "Capture happens, then the target listener, then bubbling."

is useful, but the exact listener invocation behavior has details around listener registration, phases, and event types that shouldn't be reduced to a cartoon model.

---

# 10. 🟢 [DAILY DRIVER] — EVENT DELEGATION

Instead of:

```javascript
for (const button of buttons) {
  button.addEventListener("click", handleClick);
}
```

you can attach one listener:

```javascript
list.addEventListener("click", event => {
  const button = event.target.closest("button");

  if (!button) return;

  handleClick(button);
});
```

Mental model:

```text
                <ul>
                 │
       ┌─────────┼─────────┐
       ▼         ▼         ▼
    <button>  <button>  <button>
       │
       └────── click
                │
                ▼
             <ul>
                │
                ▼
          delegated handler
```

---

# 11. WHY EVENT DELEGATION WORKS

Because many events bubble.

```text
button
   │
   │ bubble
   ▼
list
```

The parent can therefore observe interactions occurring within descendants.

This becomes especially useful for dynamically generated content.

---

# 12. DYNAMIC DOM BENEFIT

Suppose:

```javascript
list.innerHTML += `
  <button data-id="42">Delete</button>
`;
```

With per-button listeners, newly created buttons may require explicit listener registration.

With delegation:

```javascript
list.addEventListener("click", handler);
```

the parent listener can handle future descendants too, provided the relevant event bubbles and the delegation logic identifies the target correctly.

---

# 13. EVENT DELEGATION TRADEOFFS

Delegation isn't automatically superior.

Potential tradeoffs:

```text
Advantages
──────────
fewer listeners
dynamic-content friendly
centralized logic
potentially lower setup overhead

Costs
─────
target resolution
more complex handler
harder ownership boundaries
event-type limitations
```

A senior engineer chooses delegation based on event topology and component architecture rather than applying it mechanically.

---

# 14. `STOPPROPAGATION()`

Consider:

```javascript
button.addEventListener("click", event => {
  event.stopPropagation();
});
```

This prevents further propagation of the event.

Conceptually:

```text
button
  X
  │
  ✕
  │
parent
```

But don't interpret it as:

> "The browser stops doing everything associated with this click."

It primarily concerns **event propagation**.

---

# 15. `STOPIMMEDIATEPROPAGATION()`

There is a stronger mechanism:

```javascript
event.stopImmediatePropagation();
```

This additionally prevents other listeners from being invoked for the same event target as appropriate under the dispatch rules.

Think:

```text
stopPropagation
    ↓
stop moving through propagation path

stopImmediatePropagation
    ↓
stop propagation
+
stop subsequent listener invocation
```

Use this carefully.

It can make event systems difficult to reason about if used indiscriminately.

---

# 16. `PREVENTDEFAULT()` IS DIFFERENT

Consider:

```javascript
form.addEventListener("submit", event => {
  event.preventDefault();
});
```

This is not primarily about propagation.

It says:

> Prevent the event's associated cancelable default action.

Mental distinction:

```text
stopPropagation()
    ↓
event path

preventDefault()
    ↓
browser default action
```

This distinction is a frequent interview trap.

---

# 17. DEFAULT ACTIONS

Many browser events have associated browser behavior.

Examples:

```text
click <a href>
      ↓
navigation

submit form
      ↓
form submission

keydown
      ↓
possible browser / control action

pointer interaction
      ↓
possible scrolling / gestures
```

Application JavaScript runs alongside these browser-defined behaviors.

---

# 18. EVENT + DEFAULT ACTION

Conceptual sequence:

```text
Input
  ↓
Event dispatched
  ↓
Listeners execute
  ↓
Was default prevented?
  │
 ┌┴──────────────┐
 │               │
YES              NO
 │               │
 ▼               ▼
cancel         default action
                  │
                  ▼
             browser behavior
```

The exact timing and relationship can vary by event and browser behavior, so don't reduce every event to a single universal sequence.

---

# 19. 🟢 [DAILY DRIVER] — PASSIVE LISTENERS

Example:

```javascript
element.addEventListener(
  "touchmove",
  handler,
  { passive: true }
);
```

A passive listener communicates that the listener will not cancel the event through:

```javascript
event.preventDefault();
```

This matters especially for interactions where the browser may need to determine whether scrolling can proceed.

---

# 20. WHY PASSIVE MATTERS

Consider scrolling:

```text
finger moves
   ↓
touch/pointer input
   ↓
browser wants to scroll
```

If JavaScript might cancel the interaction:

```text
"Should I scroll?"
```

the browser may need to account for the event listener's behavior.

Passive listeners provide a stronger guarantee:

```text
listener
   ↓
will not cancel
   ↓
browser can proceed with scrolling behavior
```

This can improve input responsiveness in appropriate scenarios.

---

# 21. PASSIVE DOES NOT MEAN "RUNS ON ANOTHER THREAD"

This is a common misconception.

```javascript
{ passive: true }
```

does **not** mean:

```text
listener → worker thread
```

It means:

```text
listener cannot cancel via preventDefault()
```

The listener can still execute JavaScript on the relevant execution context.

If the handler performs:

```javascript
expensiveCalculation();
```

it can still consume main-thread time.

---

# 22. POINTER EVENTS

Modern pointer interaction can be represented through the Pointer Events API:

```text
pointerdown
pointermove
pointerup
pointercancel
```

Pointer Events provide a unified model for multiple pointing devices.

Conceptually:

```text
Mouse
Touch
Pen
  │
  ▼
Pointer Events model
```

This reduces the need to build completely separate interaction models for each device type.

---

# 23. POINTER VS MOUSE EVENTS

Don't assume:

```text
pointerdown === mousedown
```

They are different event models.

Pointer Events provide additional information such as:

* pointer type,
* pointer ID,
* pressure,
* contact geometry in supported contexts.

Example:

```javascript
element.addEventListener("pointerdown", event => {
  console.log(event.pointerType);
});
```

Possible values can identify interaction sources such as:

```text
mouse
touch
pen
```

---

# 24. POINTER CAPTURE

A sophisticated pointer interaction may use:

```javascript
element.setPointerCapture(event.pointerId);
```

This is useful for interactions such as:

```text
dragging
resizing
sliders
drawing
```

Mental model:

```text
Pointer starts on element
       │
       ▼
setPointerCapture()
       │
       ▼
element continues receiving
relevant pointer events
even as pointer moves outside
```

This is particularly valuable for drag interactions.

---

# 25. 🟡 [MODERATE] — TOUCH AND SCROLLING

Touch interactions are more complex than:

```text
touch → JavaScript
```

They may interact with browser behaviors such as:

```text
scrolling
panning
zooming
gestures
```

Therefore CSS and event configuration can influence the interaction model.

For example:

```css
.slider {
  touch-action: pan-y;
}
```

This communicates which browser-managed touch behaviors are allowed.

---

# 26. `TOUCH-ACTION`

`touch-action` is important because it allows the page to declare how direct manipulation gestures should interact with browser behavior.

Example:

```css
.carousel {
  touch-action: pan-y;
}
```

Conceptually:

```text
horizontal interaction
      │
      ▼
application gesture

vertical movement
      │
      ▼
browser scrolling
```

The exact behavior depends on the declared values and gesture.

---

# 27. 🟢 [DAILY DRIVER] — KEYBOARD EVENTS

Important keyboard events include:

```text
keydown
keyup
```

Example:

```javascript
input.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    submit();
  }
});
```

Senior-level accessibility reasoning requires understanding that keyboard interaction is not simply a fallback for mouse interaction.

Keyboard events are fundamental to:

* forms,
* navigation,
* focus management,
* shortcuts,
* accessible controls.

---

# 28. `KEY` VS `CODE`

These are different concepts.

```javascript
event.key
```

represents the logical key value.

```javascript
event.code
```

represents the physical key position/code.

This distinction matters for:

```text
localized keyboards
physical keyboard shortcuts
game controls
internationalization
```

Do not casually treat them as interchangeable.

---

# 29. FOCUS EVENTS

Focus is another important part of user interaction.

Relevant concepts:

```text
focus
blur
focusin
focusout
```

A crucial detail:

Some focus-related events differ in whether they participate in bubbling.

Therefore, if you're implementing event delegation for focus behavior, you need to choose the appropriate event model rather than assuming every focus event bubbles normally.

---

# 30. INPUT EVENTS

For text controls:

```javascript
input.addEventListener("input", handler);
```

The `input` event represents user-driven or programmatic value changes under the event's semantics, while `change` has different timing semantics depending on the control.

Don't treat:

```text
input
change
```

as synonyms.

For search boxes, live validation, and filtering:

```text
input
```

is often the relevant event.

---

# 31. 🟢 [DAILY DRIVER] — EVENT LISTENER LIFECYCLE

Register:

```javascript
element.addEventListener("click", handler);
```

Remove:

```javascript
element.removeEventListener("click", handler);
```

But this requires the same listener identity.

This works:

```javascript
function handler() {}

element.addEventListener("click", handler);
element.removeEventListener("click", handler);
```

This does not remove the original listener:

```javascript
element.addEventListener("click", () => {});
element.removeEventListener("click", () => {});
```

because those are different function objects.

---

# 32. ABORTABLE EVENT LISTENERS

Modern event listener registration can use an `AbortSignal`:

```javascript
const controller = new AbortController();

element.addEventListener("click", handler, {
  signal: controller.signal
});
```

Later:

```javascript
controller.abort();
```

This can remove the listener.

Mental model:

```text
Component lifecycle
       │
       ▼
AbortController
       │
       ├── event listener
       ├── fetch
       └── other abortable work
```

This is useful for lifecycle cleanup.

---

# 33. REACT CONNECTION — SYNTHETIC EVENTS

React historically provided a cross-browser event abstraction often referred to as its **SyntheticEvent** system.

Modern React's event handling should still be understood as:

```text
Browser event
    ↓
React event system
    ↓
React handler
```

Do not confuse:

```text
React's event abstraction
```

with:

```text
browser DOM event dispatch itself
```

React is sitting on top of the platform.

---

# 34. REACT EVENT DELEGATION

React has historically used centralized event handling/delegation strategies rather than attaching an independent native listener for every JSX handler.

The exact implementation has changed across React versions.

Therefore the correct senior-level statement is:

> **React provides an event system layered over browser events; its internal delegation details are implementation-specific and should not be confused with the DOM event propagation model.**

The browser fundamentals remain the foundation.

---

# 35. REACT EVENT FLOW

A useful conceptual model:

```text
User interaction
      ↓
Browser DOM event
      ↓
React event system
      ↓
React handler
      ↓
state update
      ↓
React scheduling
      ↓
render
      ↓
commit
      ↓
browser rendering
```

This connects today's topic with the event-loop model from Part 06.

---

# 36. INPUT → REACT → PIXELS

Consider:

```jsx
<input
  onChange={e => setQuery(e.target.value)}
/>
```

A simplified execution trace:

```text
Keyboard input
      ↓
Browser input event
      ↓
React event system
      ↓
onChange handler
      ↓
setQuery()
      ↓
React schedules update
      ↓
React render
      ↓
DOM commit
      ↓
Style/Layout/Paint as needed
      ↓
pixels
```

Now you can reason about the complete interaction chain.

---

# 37. INPUT LATENCY

Suppose:

```text
User types
   ↓
event arrives
   ↓
300ms JS task
   ↓
React update
   ↓
render
```

The user experiences:

```text
typing
  ↓
delay
  ↓
visual response
```

This is an **interaction responsiveness** problem.

The browser may receive the input promptly while the application is unable to process or visually reflect it promptly.

---

# 38. MAIN-THREAD CONTENTION

Imagine:

```text
Main Thread
───────────────────────────────────────────────

300ms JavaScript
██████████████████████████████████████████████

                      user click
                           ↓
                        waiting
```

The click isn't necessarily lost.

It may simply be waiting for the main-thread execution opportunity.

This is why:

> **Input responsiveness is fundamentally connected to main-thread availability.**

---

# 39. EVENT HANDLER COST

A handler such as:

```javascript
button.addEventListener("click", () => {
  expensiveCalculation();
});
```

can produce:

```text
Input
 ↓
Event dispatch
 ↓
handler
 ↓
expensive calculation
 ↓
rendering delayed
```

The event itself may be cheap.

The handler is the bottleneck.

This distinction matters during profiling.

---

# 40. EVENT HANDLER → LAYOUT

Suppose:

```javascript
button.addEventListener("click", () => {
  element.style.width = "500px";
  console.log(element.offsetWidth);
});
```

The interaction can cause:

```text
event
 ↓
JS
 ↓
style mutation
 ↓
geometry read
 ↓
potential synchronous layout
 ↓
handler continues
```

So event performance cannot be analyzed independently from rendering behavior.

---

# 41. EVENT HANDLER → NAVIGATION

Consider:

```html
<a href="/dashboard">Dashboard</a>
```

Clicking it can produce:

```text
pointer input
 ↓
click event
 ↓
listeners
 ↓
default action
 ↓
navigation
```

If JavaScript calls:

```javascript
event.preventDefault();
```

the default navigation can be cancelled, assuming the event is cancelable and the call occurs appropriately.

This directly connects:

```text
Events
```

to:

```text
Navigation lifecycle
```

---

# 42. NEXT.JS CONNECTION

In a Next.js application, navigation may instead be intercepted by application/framework logic.

Conceptually:

```text
User click
    ↓
Browser event
    ↓
React / Next.js handler
    ↓
client-side navigation logic
    ↓
route transition
    ↓
data / RSC work
    ↓
DOM update
```

This does **not** mean the browser's event system disappeared.

The framework is participating in the browser event pipeline.

---

# 43. EVENT DELEGATION IN COMPONENT SYSTEMS

Suppose you have:

```text
Table
├── Row
│   └── Button
├── Row
│   └── Button
└── Row
    └── Button
```

A native delegated handler might be:

```javascript
table.addEventListener("click", event => {
  const button = event.target.closest("[data-action]");

  if (!button) return;

  performAction(button.dataset.action);
});
```

This can be efficient for large/dynamic collections.

But in component architectures, you should also consider:

```text
component ownership
encapsulation
testing
accessibility
event semantics
```

Performance alone isn't sufficient justification.

---

# 44. 🧪 DIAGNOSTIC LAB — PROPAGATION

Create:

```html
<div id="outer">
  <div id="middle">
    <button id="inner">Click</button>
  </div>
</div>
```

Register:

```javascript
for (const id of ["outer", "middle", "inner"]) {
  document.getElementById(id).addEventListener(
    "click",
    event => {
      console.log("bubble:", id);
    }
  );
}

for (const id of ["outer", "middle", "inner"]) {
  document.getElementById(id).addEventListener(
    "click",
    event => {
      console.log("capture:", id);
    },
    { capture: true }
  );
}
```

Click the button.

Predict the sequence before running it.

---

# 45. 🧪 DIAGNOSTIC LAB — TARGET VS CURRENTTARGET

Use:

```html
<button id="button">
  <span>Save</span>
</button>
```

Then:

```javascript
button.addEventListener("click", event => {
  console.log("target:", event.target);
  console.log("currentTarget:", event.currentTarget);
});
```

Click the text.

Observe the difference.

This is one of the simplest ways to permanently internalize event delegation mechanics.

---

# 46. 🧪 DIAGNOSTIC LAB — STOP PROPAGATION

Try:

```javascript
inner.addEventListener("click", event => {
  console.log("inner");
  event.stopPropagation();
});

outer.addEventListener("click", () => {
  console.log("outer");
});
```

Observe that the event does not continue normally through the propagation path.

Then compare:

```javascript
event.preventDefault();
```

and notice that it solves a different problem.

---

# 47. 🧪 DIAGNOSTIC LAB — PASSIVE LISTENER

Use DevTools and experiment with:

```javascript
window.addEventListener(
  "touchmove",
  event => {
    // event.preventDefault();
  },
  { passive: true }
);
```

Then investigate what happens if you attempt to cancel the event.

The goal is to understand:

```text
passive
  ≠
faster JavaScript

passive
  =
listener promises not to cancel
```

---

# 48. 🧪 DIAGNOSTIC LAB — INPUT LATENCY

Create an expensive handler:

```javascript
button.addEventListener("click", () => {
  const start = performance.now();

  while (performance.now() - start < 200) {}
});
```

Open:

```text
DevTools
→ Performance
```

Record an interaction.

Inspect:

```text
Input
 ↓
Event Handler
 ↓
Long JavaScript
 ↓
Rendering
```

The objective is to connect user perception with actual timeline evidence.

---

# 49. PRODUCTION RUNBOOK — "BUTTON FEELS SLOW"

User report:

> "The button takes a second to respond."

Do not immediately change the button.

Trace:

```text
Input
 ↓
event dispatch
 ↓
event handler
 ↓
synchronous JS
 ↓
React update?
 ↓
render?
 ↓
layout?
 ↓
paint?
```

Then determine where the delay actually occurs.

---

# 50. PRODUCTION RUNBOOK — "SCROLL IS JANKY"

Investigate:

```text
Scroll / pointer input
       ↓
event handlers
       ↓
JavaScript
       ↓
style/layout
       ↓
paint/composite
```

Look for:

* expensive handlers,
* unnecessary synchronous work,
* layout reads/writes,
* excessive DOM updates,
* third-party listeners.

Do not blindly add:

```javascript
throttle(...)
```

before understanding the bottleneck.

---

# 51. PRODUCTION RUNBOOK — "CLICK DOESN'T NAVIGATE"

Trace:

```text
click
 ↓
event listener
 ↓
preventDefault?
 ↓
framework interception?
 ↓
router logic?
 ↓
navigation?
```

Potential causes include:

```text
preventDefault()
event propagation issue
disabled control
overlay intercepting pointer input
framework routing logic
application exception
```

The correct debugging process starts at the browser event.

---

# 52. PRODUCTION RUNBOOK — "DYNAMIC BUTTON DOESN'T WORK"

If a dynamically created button doesn't respond:

```text
button created
 ↓
listener attached?
```

If using direct listeners:

```text
new node
 ↓
did registration happen?
```

If using delegation:

```text
event
 ↓
bubbles?
 ↓
parent listener exists?
 ↓
target matching logic correct?
```

This is why understanding propagation is more valuable than memorizing delegation snippets.

---

# 53. ENGINEERING DECISION MATRIX — EVENT DELEGATION

| Dimension      | Guidance                                                          |
| -------------- | ----------------------------------------------------------------- |
| Use when       | Many similar/dynamic descendants share interaction logic          |
| Avoid when     | Component ownership or event semantics become confusing           |
| Performance    | Can reduce listener setup and management overhead                 |
| Main tradeoff  | More target-resolution logic and less local ownership             |
| Key dependency | Event must propagate in a usable way                              |
| Debugging      | Inspect `target`, `currentTarget`, and propagation                |
| Framework      | Understand framework abstraction before relying on native details |

---

# 54. ENGINEERING DECISION MATRIX — PASSIVE LISTENERS

| Dimension      | Guidance                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------ |
| Use when       | Listener should observe interaction without cancelling it                                        |
| Avoid when     | Handler legitimately needs `preventDefault()`                                                    |
| Performance    | Can help browser proceed with scroll/gesture behavior without waiting for cancellation decisions |
| Tradeoff       | Removes ability to cancel through that listener                                                  |
| Common mistake | Assuming passive means off-main-thread                                                           |
| Debugging      | Inspect listener options and browser warnings                                                    |

---

# 55. ENGINEERING DECISION MATRIX — `PREVENTDEFAULT`

| Dimension      | Guidance                                                               |
| -------------- | ---------------------------------------------------------------------- |
| Use when       | Application intentionally replaces a cancelable browser default action |
| Avoid when     | You merely want to stop propagation                                    |
| Performance    | Can affect browser-managed interaction behavior                        |
| Security       | Must consider whether suppressing browser behavior creates unsafe UX   |
| Tradeoff       | You assume responsibility for replacement behavior                     |
| Common mistake | Using it as a generic event-control mechanism                          |

---

# 56. 🔥 CRUCIBLE — PREDICTION CHALLENGE #1

Given:

```html
<div id="parent">
  <button id="child">Click</button>
</div>
```

and:

```javascript
parent.addEventListener("click", () => {
  console.log("parent");
});

child.addEventListener("click", () => {
  console.log("child");
});
```

Click the button.

### Answer

```text
child
parent
```

because the event reaches the target and then bubbles to the ancestor.

---

# 57. 🔥 CRUCIBLE — PREDICTION CHALLENGE #2

What happens?

```javascript
parent.addEventListener(
  "click",
  () => console.log("parent capture"),
  { capture: true }
);

child.addEventListener("click", () => {
  console.log("child");
});

parent.addEventListener("click", () => {
  console.log("parent bubble");
});
```

### Conceptual result

```text
parent capture
child
parent bubble
```

This demonstrates:

```text
capture
 ↓
target
 ↓
bubble
```

---

# 58. 🔥 CRUCIBLE — PREDICTION CHALLENGE #3

What does this do?

```javascript
child.addEventListener("click", event => {
  event.stopPropagation();
});
```

It prevents the event from continuing through the propagation path.

It does **not** mean:

```text
"Undo the click."
```

It does not automatically cancel a browser default action.

For that, you reason about:

```javascript
event.preventDefault();
```

---

# 59. 🔥 CRUCIBLE — PREDICTION CHALLENGE #4

What is the difference?

```javascript
event.target
```

vs

```javascript
event.currentTarget
```

Answer:

```text
target
    → original event target

currentTarget
    → element whose listener is currently executing
```

This is fundamental to delegation.

---

# 60. 🔥 CRUCIBLE — PREDICTION CHALLENGE #5

Does:

```javascript
{ passive: true }
```

make this run on a worker?

```javascript
element.addEventListener(
  "touchmove",
  expensiveHandler,
  { passive: true }
);
```

### No.

Passive controls cancellation semantics.

It does not move execution to another thread.

---

# 61. 🔥 CRUCIBLE — PREDICTION CHALLENGE #6

Why can this still cause interaction delay?

```javascript
button.addEventListener("click", () => {
  expensiveCalculation();
});
```

Because:

```text
event
 ↓
handler
 ↓
expensiveCalculation()
 ↓
main-thread occupation
 ↓
other work waits
```

The event mechanism is not the bottleneck.

The handler's execution is.

---

# 62. SENIOR INTERVIEW GOTCHAS

### Q1. Does every event bubble?

**No.**

Event behavior differs by event type. You must know the relevant event's propagation semantics.

---

### Q2. Is `preventDefault()` the same as `stopPropagation()`?

**No.**

```text
preventDefault
 → default browser action

stopPropagation
 → event propagation path
```

---

### Q3. Does event delegation improve performance automatically?

**No.**

It can reduce listener management overhead, but introduces target matching and architectural tradeoffs.

---

### Q4. Is passive equivalent to asynchronous?

**No.**

Passive concerns cancellation.

---

### Q5. Does an event handler run on the browser process?

Don't use such a simplistic model.

DOM event handlers for page JavaScript execute in the page's JavaScript execution context, while the browser itself contains multiple processes and threads coordinating input, rendering, and other services.

---

### Q6. Does React replace the DOM event system?

**No.**

React layers its own event handling abstractions over the browser platform.

---

### Q7. Why can a tiny click handler still produce a large delay?

Because the handler may trigger:

```text
state update
 ↓
large React render
 ↓
DOM mutations
 ↓
style/layout
```

The callback itself may be tiny while its consequences are expensive.

---

# 63. PRODUCTION FAILURE PATTERN

One of the most important Senior-level traces:

```text
User clicks
    ↓
Browser dispatches event
    ↓
React handler executes
    ↓
setState()
    ↓
large component subtree renders
    ↓
DOM commit
    ↓
style recalculation
    ↓
layout
    ↓
paint
    ↓
user finally sees result
```

If the user says:

> "The click handler is slow."

the actual problem could be anywhere downstream.

You need a trace, not an assumption.

---

# 64. THE COMPLETE INPUT PERFORMANCE MODEL

Combine Parts 06 and 07:

```text
                 USER INPUT
                     │
                     ▼
              Browser receives
                     │
                     ▼
                Targeting
                     │
                     ▼
              Event dispatch
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
       Capture                Target
                                │
                                ▼
                             Bubble
                                │
                                ▼
                          JS event handler
                                │
                                ▼
                         State / DOM work
                                │
                                ▼
                       Browser rendering
                                │
                                ▼
                              Pixels
```

At every stage ask:

```text
How long did it take?
What blocked it?
What caused the next stage?
```

---

# 65. CONNECTION TO KPI 01 — PROCESS ARCHITECTURE

From KPI 01:

```text
Browser
├── Browser process
├── Renderer process
├── GPU process
└── other services
```

Now connect input:

```text
OS Input
   ↓
Browser architecture
   ↓
Renderer/page
   ↓
DOM event
   ↓
JavaScript
```

This demonstrates why understanding processes is useful but insufficient.

A browser's process architecture tells you **where isolation and coordination occur**.

The event model tells you **how application code participates in user interaction**.

---

# 66. CONNECTION TO KPI 02 — PAGE LIFECYCLE

Events can initiate or affect lifecycle transitions.

Example:

```text
click <a>
   ↓
click event
   ↓
default action
   ↓
navigation
   ↓
new document
   ↓
DOMContentLoaded
   ↓
load
   ↓
pageshow
```

Or:

```text
click
 ↓
preventDefault()
 ↓
no normal navigation
```

Therefore:

> **Navigation and event handling are not separate worlds. User interaction is one of the major ways navigation begins.**

---

# 67. CONNECTION TO KPI 06 — EVENT LOOP

From Part 06:

```text
Task
 ↓
JavaScript
 ↓
microtask checkpoint
 ↓
rendering opportunity
```

Now add input:

```text
User Input
    ↓
Input Event
    ↓
Task / browser scheduling
    ↓
JavaScript handler
    ↓
Microtasks
    ↓
Rendering opportunity
```

This is why a large event handler can increase interaction latency.

---

# 68. CONNECTION TO REACT / NEXT.JS

A complete modern frontend interaction:

```text
Physical interaction
       ↓
Browser input
       ↓
DOM event
       ↓
React event system
       ↓
Component handler
       ↓
State update
       ↓
React scheduling
       ↓
Render
       ↓
Commit
       ↓
Browser style/layout/paint
       ↓
Screen
```

This is one of the most important bridges between browser fundamentals and framework engineering.

---

# 69. 🧠 SENIOR ENGINEER REASONING FRAMEWORK

When debugging an interaction problem, ask these questions **in order**:

### 1. Did the browser receive the input?

```text
Input?
```

### 2. Did it target the expected element?

```text
target?
```

### 3. Did propagation reach the listener?

```text
capture?
target?
bubble?
```

### 4. Was propagation intentionally stopped?

```text
stopPropagation?
```

### 5. Was default behavior cancelled?

```text
preventDefault?
```

### 6. Is the listener expensive?

```text
handler duration?
```

### 7. Did the handler trigger framework work?

```text
React render?
```

### 8. Did that trigger browser rendering work?

```text
style?
layout?
paint?
```

### 9. Was the main thread already busy?

```text
long task?
```

This is a much stronger debugging model than:

> "The click isn't working."

---

# 70. PART 07 COMPLETION CHECKLIST

## Browser input

* [x] Input vs event distinction
* [x] Input routing
* [x] Targeting
* [x] Hit-testing concept

## Event propagation

* [x] Event target
* [x] Current target
* [x] Capture phase
* [x] Target phase
* [x] Bubble phase
* [x] `stopPropagation`
* [x] `stopImmediatePropagation`
* [x] `preventDefault`

## Event architecture

* [x] Default actions
* [x] Event delegation
* [x] Dynamic DOM interaction
* [x] Listener lifecycle
* [x] Abortable listeners

## Input systems

* [x] Pointer Events
* [x] Pointer capture
* [x] Touch interaction
* [x] `touch-action`
* [x] Passive listeners
* [x] Keyboard events
* [x] Focus
* [x] Input/change semantics

## Performance

* [x] Input latency
* [x] Main-thread contention
* [x] Expensive event handlers
* [x] Event → layout interaction
* [x] Event → React → rendering chain

## Framework connection

* [x] React event system
* [x] React delegation concepts
* [x] React state update chain
* [x] Next.js navigation interaction

## Senior diagnostics

* [x] Propagation debugging
* [x] Target/currentTarget debugging
* [x] Input latency investigation
* [x] Scroll-jank investigation
* [x] Navigation debugging
* [x] Dynamic event debugging

---

# ⚡ 30-SECOND EXECUTIVE SUMMARY

Remember this:

```text
INPUT
  ↓
BROWSER TARGETING
  ↓
EVENT
  ↓
CAPTURE
  ↓
TARGET
  ↓
BUBBLE
  ↓
HANDLER
  ↓
DEFAULT ACTION
  ↓
RENDERING / NAVIGATION
```

And remember the four distinctions:

```text
target
    ≠
currentTarget

stopPropagation()
    ≠
preventDefault()

passive
    ≠
asynchronous

React event system
    ≠
browser event system
```

---

[⬅️ Part 06: JavaScript Execution & Event Loop](./06-page-lifecycle-events.md) | [📚 KPI 02 Index](./README.md) | [🧪 Lab 01](./examples/01-navigation-lifecycle-timeline-lab.html) | [🧪 Lab 02](./examples/02-dns-connection-benchmark-lab.html) | [🧪 Lab 03](./examples/03-tls-handshake-certificate-lab.html) | [🧪 Lab 04](./examples/04-http-stream-cache-waterfall-lab.html) | [🧪 Lab 05](./examples/05-critical-rendering-path-priority-lab.html) | [🧪 Lab 06](./examples/06-event-loop-long-task-scheduler-lab.html) | [🧪 Lab 07](./examples/07-dom-event-propagation-delegation-lab.html) | [Part 08: BFCache Deep Mechanics ➡️](./08-bfcache-deep-mechanics.md)
