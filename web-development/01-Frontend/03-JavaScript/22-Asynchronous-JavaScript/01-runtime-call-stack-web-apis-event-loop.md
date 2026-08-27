# KPI 22 — Part 01: The JavaScript Runtime, Call Stack, Web APIs & Event Loop

[⬅️ KPI 21 — Classes & OOP](../21-Classes-OOP/README.md) | [📚 KPI 22 Index](./README.md) | [Part 02: Callbacks, Promises, `.then()`, `.catch()`, `.finally()` ➡️](./02-callbacks-promises-then-catch-finally.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Runtime Component | Definition & Role | Processing Priority | Senior Production Standard |
|---|---|---|---|
| **Call Stack** | LIFO execution stack tracking active synchronous function frames. | **Priority 1**: Synchronous code always runs to completion without interruption. | 🟢 Keep stack frames shallow; avoid deep un-trampolined recursion to prevent stack overflows. |
| **Web / Host APIs** | Browser/Node runtime environments handling timers, network I/O, and DOM events. | Offloaded asynchronously outside the single JavaScript thread. | 🟢 Never block the thread waiting for I/O; delegate work to Web APIs. |
| **Microtask Queue** | High-priority queue for Promise reactions (`.then()`, `await`) and `queueMicrotask()`. | **Priority 2**: Fully drained to zero *after every stack execution* before next task. | 🔴 Avoid microtask starvation (infinite recursive microtasks freeze UI rendering). |
| **Task (Macrotask) Queue** | Queue for timers (`setTimeout`, `setInterval`), I/O callbacks, and UI events. | **Priority 4**: Executed one task at a time after microtasks and render opportunities. | 🟢 Use for slicing long CPU-bound operations to yield control back to the browser. |
| **`requestAnimationFrame`** | Dedicated callback queue executed immediately before browser layout and paint. | **Priority 3**: Synchronized directly with the monitor's display refresh rate (60/120Hz). | 🟢 Use exclusively for DOM visual animations and geometric layout measurement. |
| **Event Loop** | Continuous coordinator monitoring Call Stack, Microtasks, Render, and Tasks. | Orchestrates execution turns cooperatively. | 🔵 Understand exact turn order: Sync $\to$ Microtasks $\to$ Render $\to$ Single Task. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: Microtask Starvation & The `setTimeout(0)` Misconception
> 
> #### Gotcha A: Microtask Starvation (Freezing Browser Rendering and User Input)
> *"Why did recursively queueing `queueMicrotask()` or chaining resolved Promises cause the browser tab to completely freeze and stop responding to mouse clicks?"*  
> ```js
> // ❌ FATAL MICROTASK STARVATION LOOP:
> function starveEventLoop() {
>   queueMicrotask(() => {
>     starveEventLoop(); // 💥 Continuously schedules more microtasks!
>   });
> }
> starveEventLoop();
> // 💥 The browser CANNOT render frames, CANNOT process user clicks, CANNOT fire setTimeout!
> ```
> **Deep Architectural Explanation:**  
> The HTML event loop specification dictates that once the Call Stack is empty, the JavaScript engine must **drain the entire Microtask Queue until it is completely empty** before yielding to the browser rendering pipeline or picking up the next task from the Task Queue. If microtasks continuously schedule more microtasks, the engine is trapped in an infinite microtask draining loop, starving all UI paints, animations, and user input events.  
> **The Senior Standard:** For long-running or recursive background processing, yield control to the Task Queue using `setTimeout(fn, 0)` or `scheduler.yield()`:
> ```js
> // ✅ NON-BLOCKING TASK QUEUE YIELD:
> function nonBlockingLoop() {
>   setTimeout(() => {
>     // 🟢 Yields to Event Loop; allows browser rendering and user clicks between turns!
>     nonBlockingLoop();
>   }, 0);
> }
> ```
> 
> ---
> 
> #### Gotcha B: The `setTimeout(fn, 0)` Misconception (Zero Does Not Mean Immediate)
> *"Why did a `setTimeout(fn, 0)` timer fire 500ms after a heavy synchronous loop, instead of running immediately after 0ms?"*  
> ```js
> setTimeout(() => {
>   console.log("Timer Callback Executed");
> }, 0);
> 
> // Synchronous blocking work:
> const start = Date.now();
> while (Date.now() - start < 500) {
>   // 💥 Occupies the call stack for 500ms!
> }
> ```
> **Deep Architectural Explanation:**  
> `setTimeout(fn, 0)` does **not** mean "execute immediately". It means "register a timer with the host environment with a minimum delay of 0ms (clamped to 4ms after nested depth $\ge 5$); once expired, place the callback into the Task Queue". The callback cannot run until:  
> 1. The Call Stack is 100% empty.  
> 2. All pending microtasks are completely drained.  
> 3. The Event Loop picks this task from the Task Queue.  
> Any synchronous code running on the main thread delays timer execution indefinitely.

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / Next.js / Vite Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Event Loop mental model, Microtasks vs Tasks, `setTimeout`, Non-blocking async execution | Fundamental foundation for debugging async state updates, network calls, and UI stuttering. |
| 🟡 **Moderate** | Used in ~45% of code | `queueMicrotask`, `requestAnimationFrame`, Task slicing, Yielding main-thread control | Crucial for building virtualized lists, custom canvas animations, and heavy data table processing. |
| 🔵 **Foundational / Engine** | Runtime internals | HTML Event Loop specification, V8 Isolate thread model, Microtask checkpoint semantics | Mandatory for Staff/Principal engineering evaluations, performance profiling, and browser engine internals. |

---

## Core Concepts (20 Subtopics)

### Part 1 — The Single-Threaded JavaScript Execution Model `🔵 [Foundational / Engine]`

JavaScript executes code on a single main thread with one call stack and one memory heap. Only one JavaScript instruction executes at any given millisecond.

---

### Part 2 — The Call Stack: LIFO Execution Frames `🟢 [Daily Driver]`

The call stack is a Last-In, First-Out (LIFO) data structure that pushes execution context frames when functions are invoked and pops them when functions return.

---

### Part 3 — Stack Overflow Anatomy `🔴 [Production-Critical]`

Unbounded recursion pushes frames continuously until V8's call stack memory limit (~10,000–16,000 frames) is exceeded, throwing `RangeError: Maximum call stack size exceeded`.

---

### Part 4 — Main-Thread Blocking: CPU-Intensive Loops `🔴 [Production-Critical]`

Synchronous loops block the main thread. While synchronous code occupies the stack, all UI updates, clicks, inputs, and timers are completely frozen.

---

### Part 5 — Why Asynchronous APIs Exist `🟢 [Daily Driver]`

Asynchronous APIs offload time-consuming operations (timers, network requests, disk I/O) to the browser host environment without blocking the JavaScript thread.

---

### Part 6 — What Are Web / Host APIs? `🟢 [Daily Driver]`

Web APIs (`setTimeout`, `fetch`, `addEventListener`, `IntersectionObserver`) are browser-provided capabilities outside the core ECMAScript engine.

---

### Part 7 — The `setTimeout` Reality: Clamping & Minimum Delays `🟢 [Daily Driver]`

`setTimeout(fn, delay)` guarantees that the callback will not run *before* `delay` milliseconds, but execution can be delayed much longer if the stack is occupied. Browsers enforce a 4ms minimum clamp for nested timers ($\ge 5$ levels).

---

### Part 8 — The Task (Macrotask) Queue `🟢 [Daily Driver]`

The Task Queue stores callbacks from completed timers, network events, and user interactions waiting for an execution turn on the call stack.

---

### Part 9 — The Event Loop: Continuous Coordination `🔵 [Foundational / Engine]`

```text
1. Execute synchronous script on Call Stack until empty.
2. Microtask Checkpoint: Drain ALL microtasks until Microtask Queue is empty.
3. Render Opportunity: Execute requestAnimationFrame, layout, and repaint if needed.
4. Pick and execute the OLDEST task from the Task Queue.
5. Repeat.
```

---

### Part 10 — The Microtask Queue: Promise Reactions `🟢 [Daily Driver]`

Callbacks attached to Promises (`.then()`, `.catch()`, `.finally()`, `await`) are queued in the high-priority Microtask Queue, not the Task Queue.

---

### Part 11 — Microtask Processing Cycle: Draining to Zero `🔵 [Foundational / Engine]`

Microtasks are processed immediately after the current synchronous execution context empties. The engine drains the microtask queue to zero before touching the Task Queue.

---

### Part 12 — Microtask Starvation `🔴 [Production-Critical]`

If microtasks continually queue additional microtasks, the event loop never exits the microtask draining phase, permanently starving the Task Queue and UI paints.

---

### Part 13 — `queueMicrotask()`: Explicit Microtask Scheduling `🟢 [Daily Driver]`

Standardized API to schedule an asynchronous microtask without creating intermediate Promise objects:
```js
queueMicrotask(() => { console.log("Microtask executed"); });
```

---

### Part 14 — `requestAnimationFrame()` (rAF) `🟢 [Daily Driver]`

Schedules a callback to execute right before the browser calculates styles and paints the next display frame (~16.6ms at 60Hz), ideal for smooth animations.

---

### Part 15 — The Complete Runtime Architecture Diagram `🔵 [Foundational / Engine]`

```text
┌─────────────────────────────────────────────────────────────┐
│                    JAVASCRIPT ENGINE (V8)                   │
│  ┌──────────────────────┐        ┌────────────────────────┐ │
│  │     MEMORY HEAP      │        │       CALL STACK       │ │
│  │ Objects / Variables  │        │ console.log, fn calls  │ │
│  └──────────────────────┘        └───────────┬────────────┘ │
└──────────────────────────────────────────────┼──────────────┘
                                               │ Offloads
                                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   BROWSER HOST / WEB APIS                   │
│  ├── Timers (setTimeout)          ├── Network (fetch)       │
│  ├── DOM Events (click)           ├── Storage (IndexedDB)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Completion Events
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       QUEUES PIPELINE                       │
│  1. MICROTASK QUEUE:  Promise.then, queueMicrotask, await   │
│  2. RENDER PIPELINE:  requestAnimationFrame, Style, Paint   │
│  3. TASK QUEUE:       setTimeout, setInterval, postMessage  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Coordinates
                               ▼
                        EVENT LOOP TURN
```

---

### Part 16 — Common Asynchronous Misconceptions `🟢 [Daily Driver]`

- *Misconception:* Promise executor runs asynchronously. (*Fact:* `new Promise((res) => { ... })` runs **synchronously**; only reactions are asynchronous).
- *Misconception:* `async/await` runs on a background thread. (*Fact:* `await` yields to the microtask queue; execution resumes on the single main thread).

---

### Part 17 — Event Loop Execution Step Tracing `🟢 [Daily Driver]`

Trace output order for mixed synchronous, microtask, and task execution:
```js
console.log(1);
setTimeout(() => console.log(2), 0);
Promise.resolve().then(() => console.log(3));
console.log(4);
// Output: 1 -> 4 -> 3 -> 2
```

---

### Part 18 — UI Responsiveness & Frame Budget (16.6ms) `🟢 [Daily Driver]`

At 60 FPS, the browser has 16.6ms per frame to execute JavaScript, update styles, perform layout, and paint pixels. JavaScript tasks taking $> 50\text{ms}$ are classified as **Long Tasks**.

---

### Part 19 — Long Task Slicing & Main-Thread Chunking `🟢 [Daily Driver]`

Slice heavy loops across event loop turns using `setTimeout(slice, 0)` or `scheduler.yield()` to keep the UI responsive during 100,000-item array processing.

---

### Part 20 — The 10-Point Senior Event Loop & Async Runtime Checklist `🟢 [Daily Driver]`

```text
1. No blocking loops on main thread? ──► 2. Long tasks sliced via tasks?
3. Zero recursive microtask loops? ──► 4. setTimeout(0) understood as >= 4ms task?
5. Promise executor kept synchronous? ──► 6. Animations use rAF, not setTimeout?
7. Frame budget (< 16.6ms) respected? ──► 8. Heavy CPU moved to Web Workers?
9. UI clicks processed without lag? ──► 10. Execution order predictable across teams?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Async Scheduling API | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Microtask (`queueMicrotask`)** | Executing state normalization or batching before browser repaint. | Heavy CPU loops or background chunking. | Blocks rendering if queued recursively (Starvation). | `setTimeout(fn, 0)`. |
| **Task Queue (`setTimeout(0)`)** | Slicing heavy CPU work across multiple event loop turns. | High-frequency 60fps animations. | Subject to 4ms minimum clamping delay. | `scheduler.yield()`. |
| **`requestAnimationFrame`** | DOM layout measurements, smooth 60/120fps canvas animations. | Non-visual asynchronous business logic. | Pauses when browser tab is in the background. | CSS Animations / Web Workers. |
| **Web Workers** | Heavy CPU computation (image processing, encryption, big data). | Simple DOM mutations or lightweight calculations. | Overhead of structured cloning data serialization across threads. | WebAssembly / Worklets. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Non-Blocking Task Chunking Engine & Event Loop Visualizer in TypeScript
```tsx
import React, { useState, useCallback, useRef } from 'react';

// ==========================================
// 1. NON-BLOCKING TASK CHUNKING ENGINE
// ==========================================
export interface ProcessingMetrics {
  totalItems: number;
  processedItems: number;
  progressPercent: number;
  isProcessing: boolean;
}

export function useNonBlockingProcessor<T, R>(
  processItem: (item: T) => R,
  chunkSize: number = 200
) {
  const [metrics, setMetrics] = useState<ProcessingMetrics>({
    totalItems: 0,
    processedItems: 0,
    progressPercent: 0,
    isProcessing: false
  });

  const isCancelledRef = useRef(false);

  const processLargeDataset = useCallback(
    async (items: T[]): Promise<R[]> => {
      isCancelledRef.current = false;
      const results: R[] = [];
      const total = items.length;
      let currentIndex = 0;

      setMetrics({ totalItems: total, processedItems: 0, progressPercent: 0, isProcessing: true });

      return new Promise((resolve, reject) => {
        function processNextChunk() {
          if (isCancelledRef.current) {
            setMetrics((prev) => ({ ...prev, isProcessing: false }));
            return reject(new Error('Processing cancelled by user'));
          }

          const chunkEnd = Math.min(currentIndex + chunkSize, total);

          // 🟢 Process chunk synchronously within frame budget
          for (; currentIndex < chunkEnd; currentIndex++) {
            results.push(processItem(items[currentIndex]));
          }

          const percent = Math.round((currentIndex / total) * 100);
          setMetrics({
            totalItems: total,
            processedItems: currentIndex,
            progressPercent: percent,
            isProcessing: currentIndex < total
          });

          if (currentIndex < total) {
            // 🟢 Yield control to the Task Queue to allow UI rendering and clicks!
            setTimeout(processNextChunk, 0);
          } else {
            resolve(results);
          }
        }

        // Start initial chunk
        processNextChunk();
      });
    },
    [processItem, chunkSize]
  );

  const cancel = useCallback(() => {
    isCancelledRef.current = true;
  }, []);

  return { processLargeDataset, metrics, cancel };
}

// ==========================================
// 2. REACT DASHBOARD VISUALIZING EVENT LOOP CHUNKING
// ==========================================
export function EnterpriseEventLoopVisualizer() {
  const [clickCount, setClickCount] = useState(0);

  const heavyCalculation = useCallback((item: number) => {
    // Simulating CPU work
    let x = item;
    for (let i = 0; i < 5000; i++) x = (x * 16807) % 2147483647;
    return x;
  }, []);

  const { processLargeDataset, metrics, cancel } = useNonBlockingProcessor(heavyCalculation, 250);

  const startProcessing = () => {
    const data = Array.from({ length: 10000 }, (_, i) => i);
    processLargeDataset(data)
      .then(() => console.log('Processing completed!'))
      .catch((err) => console.warn(err.message));
  };

  return (
    <div className="event-loop-card">
      <header className="card-header">
        <h3>Enterprise Event Loop Non-Blocking Processor</h3>
        <span className="badge">⏱️ Task Queue Sliced</span>
      </header>

      <p className="architecture-description">
        Demonstrates non-blocking chunk processing yielding control to the Task Queue via <code>setTimeout(0)</code>, preserving UI responsiveness for clicks and frame renders during 10,000-item batch computations.
      </p>

      <div className="ui-responsiveness-test">
        <button onClick={() => setClickCount((c) => c + 1)} className="click-counter-btn">
          👆 Click Me Rapidly! Click Count: <strong>{clickCount}</strong>
        </button>
        <p className="hint">If the main thread is NOT blocked, this button increments instantly during computation!</p>
      </div>

      <div className="processing-controls">
        <button onClick={startProcessing} disabled={metrics.isProcessing} className="start-btn">
          {metrics.isProcessing ? 'Processing 10,000 Items...' : '🚀 Start Heavy Batch (10K Items)'}
        </button>
        <button onClick={cancel} disabled={!metrics.isProcessing} className="cancel-btn">
          🛑 Cancel
        </button>
      </div>

      {metrics.isProcessing && (
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${metrics.progressPercent}%` }} />
          <span>{metrics.progressPercent}% ({metrics.processedItems} / {metrics.totalItems})</span>
        </div>
      )}
    </div>
  );
}
```

---

## 🧠 Part 01 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: The Classic Event Loop Execution Order
```js
console.log("1: Synchronous");

setTimeout(() => {
  console.log("2: Timeout 0ms");
}, 0);

Promise.resolve()
  .then(() => {
    console.log("3: Microtask 1");
  })
  .then(() => {
    console.log("4: Microtask 2");
  });

queueMicrotask(() => {
  console.log("5: QueueMicrotask");
});

console.log("6: Synchronous End");
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
1: Synchronous
6: Synchronous End
3: Microtask 1
5: QueueMicrotask
4: Microtask 2
2: Timeout 0ms
```
**Step-by-Step Breakdown:**  
1. Synchronous statements `1` and `6` log immediately on the Call Stack.  
2. Microtask Queue contains `[Promise 1, QueueMicrotask]`.  
3. `Promise 1` executes $\to$ logs `3`, queues `Microtask 2` onto the end of the Microtask Queue.  
4. `QueueMicrotask` executes $\to$ logs `5`.  
5. `Microtask 2` executes $\to$ logs `4`.  
6. Microtask queue is now empty. Event Loop takes the oldest task from Task Queue $\to$ logs `2`.
</details>

---

### Prediction Challenge 2: Promise Executor vs Reaction Timing
```js
console.log("A");

new Promise((resolve) => {
  console.log("B (Inside Executor)");
  resolve("C");
}).then((val) => {
  console.log("D (Inside .then):", val);
});

console.log("E");
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
A
B (Inside Executor)
E
D (Inside .then): C
```
**Why:** The function passed into `new Promise(...)` executes **synchronously** on the Call Stack during construction. Only the `.then()` reaction is scheduled as an asynchronous microtask.
</details>

---

### Prediction Challenge 3: Chained Timers vs Microtasks
```js
setTimeout(() => {
  console.log("Timer 1");
  Promise.resolve().then(() => console.log("Microtask inside Timer 1"));
}, 0);

setTimeout(() => {
  console.log("Timer 2");
}, 0);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Timer 1
Microtask inside Timer 1
Timer 2
```
**Why:** After `Timer 1` executes, the Call Stack becomes empty. The Event Loop performs a Microtask Checkpoint and drains the microtask queued during `Timer 1` *before* picking `Timer 2` from the Task Queue.
</details>

---

### Prediction Challenge 4: Blocking Synchronous Delay of Timers
```js
console.log("Start");

setTimeout(() => {
  console.log("Timer Callback");
}, 20);

const start = Date.now();
while (Date.now() - start < 100) {
  // Synchronously blocking thread for 100ms
}

console.log("Synchronous Loop Finished");
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Start
Synchronous Loop Finished
Timer Callback
```
**Why:** Even though the timer expired after 20ms, it cannot interrupt the synchronous `while` loop occupying the Call Stack. The callback executes only after the 100ms loop finishes.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is the Call Stack in JavaScript and what does "Single-Threaded" mean?  
<details>
<summary><strong>Answer</strong></summary>
The Call Stack is a LIFO (Last-In, First-Out) data structure that keeps track of where the program is in its execution. "Single-Threaded" means that the JavaScript runtime has only one call stack and can execute exactly one statement at any single point in time.
</details>

**Q2:** What is the difference between the Microtask Queue and the Task (Macrotask) Queue?  
<details>
<summary><strong>Answer</strong></summary>
- **Microtask Queue:** High-priority queue for Promise reactions (`.then()`, `await`) and `queueMicrotask()`. It is drained completely to zero after every synchronous script execution and after every task.  
- **Task Queue:** Lower-priority queue for timers (`setTimeout`), I/O, and DOM events. The Event Loop picks and executes only one task per turn before performing a microtask checkpoint and rendering check.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** What happens if `setTimeout(callback, 0)` is called inside a running function?  
<details>
<summary><strong>Answer</strong></summary>
The browser Web API registers the timer and immediately places `callback` into the Task Queue. However, `callback` does not run immediately. It must wait until the current synchronous function finishes, the call stack empties, and all queued microtasks are drained before the Event Loop dequeues it.
</details>

**Q4:** What is "Microtask Starvation" and how does it affect browser responsiveness?  
<details>
<summary><strong>Answer</strong></summary>
Microtask Starvation occurs when microtasks continuously schedule new microtasks (e.g. infinite `queueMicrotask()` loops or unresolved Promise recursive chains). Because the engine must empty the microtask queue before moving on, it gets trapped in an endless draining loop, preventing the Event Loop from processing Task Queue callbacks, user inputs, or browser layout/paint passes, freezing the web page.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** How do you break up a long-running CPU-bound JavaScript task to prevent blocking the main thread and dropping frames?  
<details>
<summary><strong>Answer</strong></summary>
1. **Time-Slicing via Task Queue:** Split the heavy array into chunks (e.g. 200 items). Process one chunk synchronously, then schedule the next chunk using `setTimeout(processNextChunk, 0)` or `scheduler.yield()`, yielding control to the Event Loop for rendering and input handling.  
2. **Web Workers:** Offload the computation entirely to a background Web Worker thread, keeping the main thread 100% free for UI interactions.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** Walk through the exact step-by-step turn sequence of the HTML5 Event Loop specification including the Rendering Opportunity and Animation Frame Callbacks.  
<details>
<summary><strong>Answer</strong></summary>
1. **Task Selection:** The Event Loop selects and executes the oldest runnable task from one of the Task Queues on the Call Stack.  
2. **Microtask Checkpoint:** The Call Stack empties; the engine executes the *Perform a Microtask Checkpoint* algorithm, draining the Microtask Queue until it is completely empty (including newly queued microtasks).  
3. **Update the Rendering (Rendering Opportunity):** If the display refresh interval is due (~16.6ms at 60Hz):  
   - Dispatch `resize` / `scroll` UI events.  
   - Evaluate media queries and execute `requestAnimationFrame()` callbacks.  
   - Run Intersection Observer callbacks.  
   - Execute Style Recalculation, Layout (Reflow), and Paint/Compositing.  
4. **Idle Period:** If queues are empty and time remains before the next frame, execute `requestIdleCallback()`.  
5. **Repeat:** Return to Step 1.
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Event Loop Step Tracer & Task Chunker

```js
// See runnable implementation in examples/01-runtime-call-stack-web-apis-event-loop.js
```

---

## Key Takeaways
1. **JavaScript Is Single-Threaded:** Synchronous code blocks the stack until completion.
2. **Microtasks Have Absolute Priority:** Drained to zero before any subsequent Task runs.
3. **`setTimeout(0)` Is a Task:** Runs after stack completion and all microtasks drain.
4. **Avoid Microtask Starvation:** Never loop recursively inside microtasks.
5. **Slice Long CPU Tasks:** Yield control to the Task Queue to maintain 60 FPS UI rendering.

---

[⬅️ KPI 21 — Classes & OOP](../21-Classes-OOP/README.md) | [📚 KPI 22 Index](./README.md) | [Part 02: Callbacks, Promises, `.then()`, `.catch()`, `.finally()` ➡️](./02-callbacks-promises-then-catch-finally.md)
