# KPI 12 — Part 06: Promise Timing, Microtasks, the Event Loop & Execution Order

[⬅️ Part 05: Promise Combinators & Concurrency Coordination](./05-promise-combinators-concurrency.md) | [📚 KPI 12 Index](./README.md) | [Part 07: Real-World Patterns, Anti-Patterns & Telemetry ➡️](./07-promise-patterns-antipatterns-telemetry.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Execution Tier | Queue / Mechanism | Execution Timing | Scheduling Semantics |
|---|---|---|---|
| **1. Synchronous Code** | Call Stack | Immediate execution. | Runs to completion; cannot be preempted or interrupted. |
| **2. Microtasks (Jobs)** | Microtask Queue (`Promise`, `queueMicrotask`, `MutationObserver`) | **Immediately after Call Stack drains**. | **Drains to complete exhaustion** before any macrotask or render! |
| **3. UI Rendering** | Render Steps (Style $\to$ Layout $\to$ Paint) | After microtasks drain, before next task. | Only occurs if frame budget ($16.6\text{ms}$) permits and thread is free. |
| **4. Tasks (Macrotasks)**| Task Queue (`setTimeout`, DOM events, network I/O) | **One task per loop iteration**. | Executes 1 task $\to$ Drains all microtasks $\to$ Renders $\to$ Repeats. |
| **`async` Function Entry**| Call Stack $\to$ Microtask Queue | Synchronous until first `await`. | Code *before* `await` runs immediately; code *after* `await` runs in microtask. |
| **Microtask Starvation** | Unbounded recursive microtasks | Permanently blocks loop. | 🔴 Recursive `Promise.resolve().then(loop)` freezes UI and macrotasks! |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: Microtask Starvation & The `async` Synchronous Boundary
> 
> #### Gotcha A: Microtask Starvation (The Silent Browser Freeze)
> *"Why did our browser window completely freeze and stop responding to clicks without throwing a `RangeError: Maximum call stack size exceeded`?"*  
> ```js
> // ❌ FATAL MICROTASK STARVATION LOOP:
> function scheduleInfiniteMicrotask() {
>   Promise.resolve().then(() => {
>     scheduleInfiniteMicrotask(); // 💥 Enqueues microtask during microtask drain!
>   });
> }
> scheduleInfiniteMicrotask();
> setTimeout(() => console.log("Timeout"), 0); // 💥 NEVER RUNS!
> ```
> **Deep Architectural Explanation:**  
> The HTML5 Event Loop specification dictates that when the Call Stack empties, the engine **drains the Microtask Queue to complete exhaustion**. If a microtask schedules another microtask, the new microtask is appended to the active queue and executed in the *same* turn. Because each microtask executes on a fresh, emptied stack, no stack overflow occurs. However, the Task Queue (timers, user clicks) and the UI rendering pipeline are completely starved, permanently locking the browser tab.  
> **The Senior Standard:** Use `setTimeout(fn, 0)` or `scheduler.yield()` to yield control back to the macrotask/rendering loop when chunking work.
> 
> ---
> 
> #### Gotcha B: The `async` Function Synchronous Evaluation Boundary
> *"In what exact sequence do statements inside and outside an `async` function execute?"*  
> ```js
> async function evaluateFlow() {
>   console.log("2. Inside Async (Before Await)"); // 💥 SYNCHRONOUS!
>   await Promise.resolve();
>   console.log("4. Inside Async (After Await)");  // 💥 MICROTASK!
> }
> console.log("1. Main Script Start");
> evaluateFlow();
> console.log("3. Main Script End");
> // Output: 1 -> 2 -> 3 -> 4 (Never 1 -> 3 -> 2 -> 4!)
> ```
> **Deep Architectural Explanation:**  
> Calling an `async` function invokes it **immediately and synchronously** on the active Call Stack. It executes line-by-line just like a standard function until it encounters the first `await` keyword. At the `await`, the expression is evaluated, the rest of the function is packaged as a microtask continuation, and execution immediately returns to the caller (`console.log("3")`).

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / TypeScript Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Predicting async execution order, debugging state race conditions, understanding React 18 automatic batching | Essential for understanding how state updates, microtasks, and UI renders interleave in production. |
| 🟡 **Moderate** | Used in ~45% of code | `queueMicrotask()` for DOM consistency, avoiding layout thrashing, profiling Long Tasks ($>50\text{ms}$) | Critical for optimizing Interaction to Next Paint (INP) and achieving 60 FPS UI responsiveness. |
| 🔵 **Foundational / Engine** | Runtime internals | HTML5 Event Loop specification, V8 Promise reaction record microtask scheduling, Task prioritization | Mandatory for Staff/Principal architecture interviews, runtime compiler development, and core infra design. |

---

## Core Concepts (20 Subtopics)

### Part 1 — The Priority Order: Synchronous $\to$ Microtasks $\to$ Rendering $\to$ Macrotasks `🟢 [Daily Driver]`

```text
[ CALL STACK ] ──(Drains)──> [ MICROTASKS ] ──(Exhausts)──> [ RENDERING ] ──> [ MACROTASK ]
(Synchronous)                 (Promise/queueMicrotask)        (Style/Layout/Paint)  (setTimeout/Events)
```

---

### Part 2 — Why Promise Handlers Are NEVER Synchronous `🔵 [Foundational / Engine]`

Even if a Promise is pre-settled (`Promise.resolve("data")`), `.then()` callbacks are always deferred to the Microtask Queue to eliminate Zalgo-style timing unpredictability.

---

### Part 3 — The Microtask Queue Checkpoint: Drain-to-Exhaustion `🔵 [Foundational / Engine]`

At every microtask checkpoint, the engine processes all microtasks currently in the queue, plus any new microtasks enqueued while processing, until the queue is completely empty (`length === 0`).

---

### Part 4 — Nested Microtask Cascades `🟢 [Daily Driver]`

When a microtask returns a Promise or enqueues a new microtask, that new task executes in the current microtask turn *before* any timer macrotasks can run:
```js
Promise.resolve().then(() => {
  console.log("Micro 1");
  Promise.resolve().then(() => console.log("Micro 2")); // Runs before setTimeout!
});
setTimeout(() => console.log("Macro"), 0);
// Output: Micro 1 -> Micro 2 -> Macro
```

---

### Part 5 — Microtask Starvation `🔴 [Production-Critical]`

Creating an infinite chain of microtasks starves user inputs, network events, timers, and browser rendering, hanging the thread without triggering stack overflows.

---

### Part 6 — `queueMicrotask()` vs. `Promise.resolve().then()` `🟢 [Daily Driver]`

- `Promise.resolve().then(fn)`: Allocates a `Promise` instance and reaction records.
- `queueMicrotask(fn)`: Lightweight platform API that schedules `fn` directly to the microtask queue without Promise object allocation overhead.

---

### Part 7 — V8 Engine Promise Reaction Records & Microtask Dispatch `🔵 [Foundational / Engine]`

V8 enqueues `PromiseReactionJob` structs into the engine's internal `MicrotaskQueue`.

---

### Part 8 — Microtasks vs `setTimeout(0)` Macrotasks Trace Mechanics `🟢 [Daily Driver]`

```js
console.log("A");
setTimeout(() => console.log("D"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("B");
// Output: A -> B -> C -> D
```

---

### Part 9 — The `async` Function Synchronous Beginning Boundary `🟢 [Daily Driver]`

Statements in an `async` function execute synchronously on the active Call Stack until the first `await` is encountered.

---

### Part 10 — `await` with Primitives vs Promises (`await 42`) `🟢 [Daily Driver]`

`await 42` wraps `42` in `Promise.resolve(42)` and yields to the microtask queue, creating an asynchronous boundary even for non-Promise values.

---

### Part 11 — Rendering Opportunities & Frame Budgets ($16.6\text{ms}$) `🔴 [Production-Critical]`

Browsers render at 60 FPS ($16.6\text{ms}/\text{frame}$). Heavy computation in microtasks delays the rendering step, causing dropped frames and UI jank.

---

### Part 12 — The "Async Means Non-Blocking" Fallacy inside Microtasks `🔴 [Production-Critical]`

Once a microtask callback dequeues onto the Call Stack, its body runs 100% synchronously. If it runs a heavy CPU loop for 2 seconds, it blocks the main thread completely.

---

### Part 13 — Async Does NOT Mean Parallel `🔴 [Production-Critical]`

JavaScript executes on a single main thread. Asynchronous scheduling defers execution timing; it does not distribute work across CPU cores without Web Workers.

---

### Part 14 — Systematic 6-Step Execution Order Tracing Algorithm `🟢 [Daily Driver]`

```text
STEP 1: Execute all Synchronous statements on Call Stack until empty.
STEP 2: Collect all enqueued Microtasks (Promises, queueMicrotask).
STEP 3: Drain Microtask Queue completely (including microtasks spawned by microtasks).
STEP 4: Perform Rendering Updates (if eligible/needed).
STEP 5: Dequeue and execute exactly ONE Macrotask from Task Queue.
STEP 6: Repeat from Step 2.
```

---

### Part 15 — Complex Multi-Queue Trace Scenarios `🟢 [Daily Driver]`

```js
setTimeout(() => {
  console.log("Timer 1");
  Promise.resolve().then(() => console.log("Micro inside Timer 1"));
}, 0);
Promise.resolve().then(() => {
  console.log("Micro 1");
  setTimeout(() => console.log("Timer 2"), 0);
});
// Output: Micro 1 -> Timer 1 -> Micro inside Timer 1 -> Timer 2
```

---

### Part 16 — Batching DOM Updates & State Mutations via Microtasks `🟢 [Daily Driver]`

Queueing state mutations to the microtask queue allows multiple synchronous changes to be batched before applying a single combined DOM update before the paint step.

---

### Part 17 — Memory Lifecycle & Retainer Contexts `🔴 [Production-Critical]`

Promise closures capture outer lexical variables. Long-lived unsettled Promises retain closed-over memory in the heap, causing memory leaks.

---

### Part 18 — React Automatic Batching & Microtask Coordination `🟢 [Daily Driver]`

React 18 uses microtask-level scheduling to batch multiple `setState` calls inside promises and timeouts into a single re-render.

---

### Part 19 — Telemetry: Measuring Microtask Queue Latency `🟢 [Daily Driver]`

```js
const start = performance.now();
queueMicrotask(() => {
  const latency = performance.now() - start;
  if (latency > 50) console.warn("Long microtask delay detected:", latency);
});
```

---

### Part 20 — 10-Point Promise Timing & Event Loop Checklist `🟢 [Daily Driver]`

```text
1. Do you know that microtasks always drain before macrotasks execute?
2. Do you understand that code before the first await runs synchronously?
3. Can you trace nested microtasks vs peer setTimeout callbacks?
4. Do you avoid recursive microtask loops to prevent microtask starvation?
5. Do you use queueMicrotask() for lightweight microtask scheduling?
6. Are heavy CPU tasks offloaded to Web Workers rather than microtasks?
7. Do you understand that await 42 creates an asynchronous microtask tick?
8. Are multiple synchronous state updates batched before the render step?
9. Do you know that browser rendering occurs between microtask drain and macrotasks?
10. Can you calculate the exact execution order of mixed async/await and timers?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Mechanism | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Synchronous Stack** | Pure computations ($<5\text{ms}$), state initialization, variable mapping. | Heavy CPU loops ($>50\text{ms}$) or asynchronous I/O. | Blocks main thread completely while active. | Time-slicing / Web Workers. |
| **`queueMicrotask()`** | Deferring state updates to run immediately after current stack, before paint. | Long-running iterative loops or continuous scheduling. | Unbounded scheduling causes microtask starvation. | `setTimeout(fn, 0)`. |
| **`setTimeout(fn, 0)`** | Yielding execution to the browser to allow rendering and user input processing. | High-priority promise continuations needed before render. | Incurs minimum clamping delay ($\approx 1\text{ms}-4\text{ms}$). | `scheduler.yield()`. |
| **`requestAnimationFrame()`** | Visual DOM mutations, CSS transitions, canvas rendering synchronized with display refresh. | Pure data processing or non-visual asynchronous calculations. | Pauses when browser tab is in background/minimized. | `queueMicrotask()`. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Microtask State Batcher & Frame Profiler in TypeScript
```tsx
import React, { useState, useCallback, useRef } from 'react';

// ==========================================
// 1. MICROTASK BATCHING ENGINE
// ==========================================
export class MicrotaskStateBatcher<T> {
  private pendingUpdates: T[] = [];
  private isScheduled = false;

  constructor(private onFlush: (updates: T[]) => void) {}

  public queue(update: T) {
    this.pendingUpdates.push(update);

    if (!this.isScheduled) {
      this.isScheduled = true;
      // 🟢 Defers flush to Microtask Queue (Batches all synchronous updates)
      queueMicrotask(() => {
        const batch = [...this.pendingUpdates];
        this.pendingUpdates = [];
        this.isScheduled = false;
        this.onFlush(batch);
      });
    }
  }
}

// ==========================================
// 2. REACT BATCH PROFILER COMPONENT
// ==========================================
export function EnterpriseMicrotaskProfiler() {
  const [renderCount, setRenderCount] = useState(0);
  const [eventsLogged, setEventsLogged] = useState<string[]>([]);
  const batcherRef = useRef<MicrotaskStateBatcher<string> | null>(null);

  if (!batcherRef.current) {
    batcherRef.current = new MicrotaskStateBatcher<string>((batch) => {
      setEventsLogged((prev) => [...prev, `[Microtask Flushed Batch]: ${batch.join(', ')}`]);
      setRenderCount((c) => c + 1);
    });
  }

  const handleSimulateSyncSpam = useCallback(() => {
    // 💥 5 Synchronous Calls: Batched into EXACTLY 1 Microtask Flush!
    batcherRef.current?.queue('Event-1');
    batcherRef.current?.queue('Event-2');
    batcherRef.current?.queue('Event-3');
    batcherRef.current?.queue('Event-4');
    batcherRef.current?.queue('Event-5');
  }, []);

  return (
    <div className="profiler-card">
      <h3>Enterprise Microtask Batcher & Profiler</h3>
      <p>Demonstrates how microtasks batch multiple synchronous state mutations before rendering.</p>

      <p>Component Render Count: <strong>{renderCount}</strong></p>

      <button onClick={handleSimulateSyncSpam} className="primary-button">
        Dispatch 5 Synchronous Mutations
      </button>

      <h4>Batched Event Log:</h4>
      <ul>
        {eventsLogged.map((log, i) => (
          <li key={i}><code>{log}</code></li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 🧠 Part 06 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: Microtask Queue Drain before Macrotask
```js
console.log("1");

setTimeout(() => console.log("5"), 0);

Promise.resolve()
  .then(() => {
    console.log("3");
    Promise.resolve().then(() => console.log("4"));
  });

console.log("2");
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
1
2
3
4
5
```
**Why:**
1. Synchronous `"1"` and `"2"` execute first.
2. The Microtask Queue runs: logs `"3"`, and enqueues `"4"`.
3. Because microtasks drain to exhaustion, `"4"` runs in the same microtask checkpoint *before* the `"5"` timer macrotask.
</details>

---

### Prediction Challenge 2: `async` Function Synchronous Start vs `await`
```js
async function test() {
  console.log("A");
  await null;
  console.log("B");
}

console.log("Start");
test();
console.log("End");
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Start
A
End
B
```
**Why:** `test()` begins executing synchronously (`"A"`). At `await null`, execution yields, printing `"End"` from the main script. The continuation `"B"` executes in the subsequent microtask turn.
</details>

---

### Prediction Challenge 3: Mixed Tasks & Microtasks Interleaving
```js
console.log("Start");

setTimeout(() => {
  console.log("Timeout 1");
  Promise.resolve().then(() => console.log("Micro inside Timeout 1"));
}, 0);

Promise.resolve().then(() => {
  console.log("Micro 1");
  setTimeout(() => console.log("Timeout 2"), 0);
});

console.log("End");
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Start
End
Micro 1
Timeout 1
Micro inside Timeout 1
Timeout 2
```
**Why:**
1. Synchronous: `"Start"`, `"End"`.
2. Microtask Queue: `"Micro 1"` (schedules `"Timeout 2"` to Task Queue).
3. First Macrotask: `"Timeout 1"` (schedules `"Micro inside Timeout 1"`).
4. Microtasks drain immediately after Macrotask 1: `"Micro inside Timeout 1"`.
5. Second Macrotask: `"Timeout 2"`.
</details>

---

### Prediction Challenge 4: `queueMicrotask()` vs `Promise.then()`
```js
queueMicrotask(() => console.log("QueueMicrotask 1"));
Promise.resolve().then(() => console.log("Promise.then 1"));
queueMicrotask(() => console.log("QueueMicrotask 2"));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
QueueMicrotask 1
Promise.then 1
QueueMicrotask 2
```
**Why:** Both `queueMicrotask` and `Promise.resolve().then()` share the **exact same Microtask Queue**, executing strictly in FIFO (First-In, First-Out) enqueue order.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is the difference between the Task Queue (Macrotasks) and the Microtask Queue?  
<details>
<summary><strong>Answer</strong></summary>
- **Microtask Queue (`Promise.then`, `queueMicrotask`, `MutationObserver`):** Executes immediately after the synchronous Call Stack empties, draining completely to exhaustion before any other task or rendering occurs.  
- **Task Queue (`setTimeout`, `setInterval`, DOM events):** Executes one task at a time per Event Loop turn, yielding to microtasks and rendering between iterations.
</details>

**Q2:** When does an `async` function start running asynchronously?  
<details>
<summary><strong>Answer</strong></summary>
An `async` function runs **synchronously** from its invocation up until it reaches its first `await` keyword. At the `await`, the function pauses and yields control back to the caller; only the code *after* the `await` runs asynchronously in the Microtask Queue.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** What is "Microtask Starvation" and why doesn't it trigger a Call Stack Overflow error?  
<details>
<summary><strong>Answer</strong></summary>
Microtask Starvation occurs when microtasks repeatedly enqueue new microtasks (e.g. `Promise.resolve().then(loop)`). Because the engine must drain the microtask queue to exhaustion before executing macrotasks or rendering, the event loop remains trapped in the microtask phase. It does not cause a Call Stack Overflow because each microtask executes on an emptied stack, popping its frame before the next microtask runs.
</details>

**Q4:** Why do Promise `.then()` callbacks execute before `setTimeout(fn, 0)` callbacks even if `setTimeout` was written earlier in the code?  
<details>
<summary><strong>Answer</strong></summary>
Because the Event Loop gives strict priority to the Microtask Queue over the Task Queue (Macrotasks). When synchronous code finishes, the engine always drains all pending microtasks before picking up the next macrotask from the Task Queue.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** Why does wrapping an expensive CPU calculation in `Promise.resolve().then(() => heavyCalc())` fail to prevent UI freezing and dropped frames?  
<details>
<summary><strong>Answer</strong></summary>
Promise scheduling only controls *when* the callback enters the Call Stack (in the microtask phase). Once `heavyCalc()` starts executing on the stack, it runs on the single JavaScript main thread. Because browser rendering occurs *after* microtasks drain, a heavy synchronous loop inside a microtask blocks rendering and user interactions just as if it were top-level code. Heavy CPU work must be moved to a **Web Worker** or sliced across macrotasks via `scheduler.yield()`.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How does the HTML5 Event Loop specification define the exact boundary between Microtask Draining, the "Update the Rendering" step, and Prioritized Task Scheduling?  
<details>
<summary><strong>Answer</strong></summary>
Under the HTML5 Event Loop Specification (§8.1.7.3):
1. **Task Execution:** Dequeue and run oldest task from Task Queue.
2. **Microtask Checkpoint:** Perform microtask checkpoint: drain Microtask Queue to exhaustion.
3. **Update the Rendering:** If the top-level browsing context is eligible for rendering (display refresh pulse / vsync aligned):
   - Run `requestAnimationFrame` callbacks.
   - Run Style Recalculation, Layout, and Paint steps.
4. **Idle Period:** If queues are empty and frame budget remains, run `requestIdleCallback`.
5. **Next Iteration:** Select next task based on prioritized task queues (`scheduler.postTask` priority lanes).
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Event Loop Simulator

```js
// See runnable implementation in examples/06-promise-microtasks-scheduling-advanced-patterns.js
```

---

## Key Takeaways
1. **Microtasks Drain to Exhaustion:** All microtasks run before any timer macrotask.
2. **`async` Starts Synchronously:** Code before the first `await` runs immediately.
3. **Avoid Microtask Starvation:** Recursive microtasks permanently lock the UI.
4. **Async Is Not Parallel:** Promises execute on the single main thread.
5. **Shared Microtask Queue:** `queueMicrotask` and `Promise.then` share FIFO ordering.

---

[⬅️ Part 05: Promise Combinators & Concurrency Coordination](./05-promise-combinators-concurrency.md) | [📚 KPI 12 Index](./README.md) | [Part 07: Real-World Patterns, Anti-Patterns & Telemetry ➡️](./07-promise-patterns-antipatterns-telemetry.md)
