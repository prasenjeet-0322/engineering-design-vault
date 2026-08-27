# KPI 04 — Part 09: The Event Loop, Web APIs, Tasks, Microtasks & Async Execution

[⬅️ Part 08: Scope, Hoisting & TDZ Internals](./08-scope-hoisting-tdz-initialization-internals.md) | [📚 KPI 04 Index](./README.md) | [Part 10: Closures, Memory Retention & Lexical Lifetime ➡️](./10-closures-memory-retention-lexical-lifetime.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Mechanism | Scheduling Layer / Queue | Runs Before Next Macrotask? | Frame / React Relevance | Senior Production Default |
|---|---|---|---|---|
| **Synchronous JS** | Call Stack (LIFO) | **N/A** (Runs immediately) | Blocks all rendering & input. | 🟢 Keep synchronous execution $<16\text{ms}$ (INP). |
| **Promise `.then()`** | Microtask Queue | **Yes** (Drains immediately after stack empty) | React state updates & async chaining. | 🟢 **Universal Standard** for async workflows. |
| **`await` Continuation** | Microtask Scheduling | **Yes** (Resumes as microtask on resolve) | React data-fetching flows. | 🟢 Always wrap in `try/catch` with cancellation. |
| **`queueMicrotask()`** | Microtask Queue | **Yes** (Runs before task boundary) | Controlled post-sync flush. | 🟡 Use for batching without yielding to macrotask. |
| **`setTimeout(fn, 0)`** | Macrotask Queue (Timer Task) | **No** (Queued after timer eligibility) | Toast delays, deliberate task boundary. | 🟡 Never use as arbitrary async delay. |
| **DOM Event Listener** | Macrotask Queue (UI Task) | **No** (Dispatched by browser) | Clicks, typing, scrolling. | 🟢 Debounce high-frequency events. |
| **`requestAnimationFrame`** | Render Pipeline Step | Runs before next frame paint | Visual layout & DOM mutations. | 🟢 Preferred for smooth animations. |
| **`AbortController`** | Cancellation Signal | **N/A** (Synchronous signal) | Prevents stale async data overwrites. | 🟢 **Mandatory** for component lifecycle fetch. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotcha: Why Does `Promise.then()` Run Before `setTimeout(fn, 0)`?
> **Question:** *"Why does the microtask log before the timer task even when `setTimeout` is set to `0ms`?"*  
> ```js
> console.log("A");
> setTimeout(() => console.log("B"), 0);
> Promise.resolve().then(() => console.log("C"));
> console.log("D");
> ```
> **Deep Architectural Answer:**  
> 1. JavaScript executes synchronous code on the **Call Stack** first $\rightarrow$ Logs `A`, schedules timer, schedules Promise reaction, logs `D`.  
> 2. When the Call Stack empties, the Event Loop reaches a **Microtask Checkpoint**.  
> 3. The engine **drains the entire Microtask Queue** until empty $\rightarrow$ Executes `.then()` callback and logs `C`.  
> 4. Only after all microtasks are exhausted does the Event Loop check for rendering opportunities and then select the next eligible **Macrotask (Task)** $\rightarrow$ Executes timer callback and logs `B`.  
> 5. **The Senior Standard:** Microtasks have absolute priority over the next task! The event loop will never execute another macrotask while microtasks are queued!

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / TypeScript Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Async/await continuations, `AbortController` cancellation in `useEffect`, preventing UI race conditions | Essential for building resilient search autocomplete, fetching server data cleanly, and preventing out-of-order state overwrites. |
| 🟡 **Moderate** | Used in ~25% of code | `requestAnimationFrame` animation loops, Microtask starvation diagnosis, Node.js `process.nextTick` vs `setImmediate` | Critical for frontend performance tuning (INP metric), animation sync, and isomorphic backend scheduling. |
| 🔵 **Foundational / Engine** | Runtime internals | Libuv event loop phases, Browser task source scheduling, V8 Promise reaction jobs | Essential for compiler understanding, runtime performance profiling, and Staff/Principal technical evaluations. |

---

## Core Concepts (20 Subtopics)

### Part 1 — Single-Threaded Call Stack vs. Multi-Threaded Host Runtime `🟢 [Daily Driver]`

JavaScript executes on a single synchronous thread, while the host runtime (Browser/Node) runs background threads for networking, file I/O, timers, and rendering.

---

### Part 2 — The Event Loop Lifecycle Pipeline `🟢 [Daily Driver]`

```text
Execute Macrotask ──► Drain ALL Microtasks ──► Render Opportunity (rAF, Layout, Paint) ──► Repeat
```

---

### Part 3 — Macrotasks (Tasks): Timers & User Input `🟢 [Daily Driver]`

Macrotasks include `setTimeout`, `setInterval`, `setImmediate` (Node), DOM events, and I/O callbacks. Only one task executes per loop iteration.

---

### Part 4 — Microtasks: `Promise.then()`, `queueMicrotask()` `🟢 [Daily Driver]`

Microtasks execute immediately after the current synchronous stack completes and before the browser moves to the next task or repaint.

---

### Part 5 — `async` / `await` Suspension & Continuations `🟢 [Daily Driver]`

Encountering `await` suspends the async function, returns a pending Promise, and yields control back to the caller. When resolved, continuation resumes as a microtask.

---

### Part 6 — `setTimeout(fn, 0)` Minimum Eligibility Threshold `🟢 [Daily Driver]`

`setTimeout(fn, 0)` does not guarantee instant execution; it registers a timer that becomes eligible after $\ge 0\text{ms}$ (clamped to $\ge 4\text{ms}$ after 5 nested calls).

---

### Part 7 — Microtask Queue Starvation `🟡 [Moderate]`

Recursively scheduling microtasks (`function loop() { Promise.resolve().then(loop); }`) starves the Event Loop, freezing DOM updates and macrotasks.

---

### Part 8 — Rendering Opportunities & `requestAnimationFrame()` `🟡 [Moderate]`

`requestAnimationFrame(fn)` executes callbacks immediately before the browser computes styles, layout, and paints, synchronizing with the display refresh rate (e.g. 60Hz/120Hz).

---

### Part 9 — Event Loop vs. React Fiber Scheduler `🟢 [Daily Driver]`

The Event Loop is the runtime's engine; React's Fiber Scheduler is an application-level cooperative priority queue operating on top of it.

---

### Part 10 — React Concurrent Transitions (`startTransition`) `🟢 [Daily Driver]`

`startTransition` marks state updates as non-urgent, allowing React to yield execution back to the browser to process high-priority user input.

---

### Part 11 — Long Tasks & Interaction to Next Paint (INP) `🟢 [Daily Driver]`

Synchronous tasks taking $>50\text{ms}$ block user input, drop animation frames, and degrade Core Web Vitals (INP).

---

### Part 12 — Offloading CPU Work to Web Workers `🟢 [Daily Driver]`

Heavy data processing (cryptography, parsing megabytes of JSON) should be offloaded to Web Workers to keep the UI main thread responsive.

---

### Part 13 — Async Race Conditions & Out-of-Order Overwrites `🟢 [Daily Driver]`

Fast user typing can cause Request A (old) to resolve *after* Request B (new), overwriting current UI state with stale data.

---

### Part 14 — `AbortController` Signal Cancellation `🟢 [Daily Driver]`

```ts
const controller = new AbortController();
fetch(url, { signal: controller.signal });
// Clean up on component unmount or query change:
controller.abort();
```

---

### Part 15 — Monotonic Sequence Request ID Guards `🟢 [Daily Driver]`

```ts
let latestRequestId = 0;
async function search(q) {
  const reqId = ++latestRequestId;
  const res = await api(q);
  if (reqId === latestRequestId) setResults(res); // Ignores stale responses
}
```

---

### Part 16 — Memory Retention in Long-Lived Promise Chains `🔵 [Foundational / Engine]`

Pending Promises retain their resolve/reject callbacks and enclosing closures until settled, pinning captured variables in Heap memory.

---

### Part 17 — Browser vs. Node.js Event Loop (Libuv) `🔵 [Foundational / Engine]`

Node.js uses Libuv with explicit phases: Timers $\rightarrow$ Pending I/O $\rightarrow$ Idle/Prepare $\rightarrow$ Poll $\rightarrow$ Check (`setImmediate`) $\rightarrow$ Close callbacks.

---

### Part 18 — Multiple Task Sources in Browser Engines `🔵 [Foundational / Engine]`

Browsers maintain multiple internal task queues (User Interaction, Timer, Networking) and prioritize user input over background timers.

---

### Part 19 — Async Error Propagation Across Promise Boundaries `🟢 [Daily Driver]`

Unhandled rejections in async functions bubble up to `process.on('unhandledRejection')` or `window.addEventListener('unhandledrejection')`.

---

### Part 20 — 9-Step Senior Async Debugging Pipeline `🟢 [Daily Driver]`

1. **Trace Synchronous Execution:** What runs on the Call Stack first?
2. **Identify Async Initiators:** Timers, fetch, microtasks?
3. **Classify Queue Layer:** Task vs Microtask vs Render?
4. **Inspect Execution Interleaving:** What resolves first?
5. **Verify Cancellation Signal:** Is `AbortController` wired to cleanup?
6. **Check Request Sequence Ordering:** Can old responses overwrite new state?
7. **Audit Retained Closures:** Are closures holding large references?
8. **Measure Long Task Durations:** Does synchronous code exceed $50\text{ms}$?
9. **Verify Error Handlers:** Are all async rejections caught?

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Race-Condition-Free Auto-Aborting Search Autocomplete Pipeline
```tsx
import React, { useState, useEffect, useRef } from 'react';

export interface SearchResultDTO {
  id: string;
  title: string;
  category: string;
}

export function SearchAutocomplete() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Monotonic sequence counter to guarantee latest-request-wins
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    // ✅ Instantiate AbortController & Increment Request Sequence
    const abortController = new AbortController();
    const currentRequestId = ++requestIdRef.current;
    setIsLoading(true);

    async function executeSearch() {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: abortController.signal
        });
        const data: SearchResultDTO[] = await response.json();

        // ✅ Race Condition Guard: Only apply state if this request is still the newest
        if (currentRequestId === requestIdRef.current) {
          setResults(data);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && currentRequestId === requestIdRef.current) {
          console.error('Search error:', err);
          setIsLoading(false);
        }
      }
    }

    executeSearch();

    // ✅ Effect Cleanup: Immediately cancels in-flight request when user types next character
    return () => {
      abortController.abort();
    };
  }, [query]);

  return (
    <div className="search-container">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search enterprise records..."
      />
      {isLoading && <span className="spinner">Searching...</span>}
      <ul className="results-list">
        {results.map(item => (
          <li key={item.id}>{item.title} <em>({item.category})</em></li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 🧠 Part 9 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: Microtask vs. Task Execution Order
```js
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
queueMicrotask(() => console.log("4"));
console.log("5");
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:** `1, 5, 3, 4, 2`  
**Execution Trace:**  
1. Sync stack logs `1`, registers timer `2`, queues microtasks `3` and `4`, logs `5`.  
2. Stack empties $\rightarrow$ Microtask checkpoint drains `3` and `4`.  
3. Next macrotask runs timer $\rightarrow$ logs `2`.
</details>

---

### Prediction Challenge 2: Nested Microtasks Inside Macrotasks
```js
setTimeout(() => {
  console.log("A");
  Promise.resolve().then(() => console.log("B"));
}, 0);
setTimeout(() => {
  console.log("C");
}, 0);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:** `A, B, C`  
**Why:** The first timer task runs and logs `A`, scheduling microtask `B`. Before the second timer task (`C`) can execute, the Event Loop drains microtasks, logging `B` first.
</details>

---

### Prediction Challenge 3: `async` / `await` Synchronous Start vs. Continuation
```js
async function run() {
  console.log("X");
  await null;
  console.log("Y");
}
console.log("Start");
run();
console.log("End");
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:** `Start, X, End, Y`  
**Why:** `run()` executes synchronously up to `await null`, which logs `X`. The continuation (`Y`) is scheduled as a microtask. Sync code finishes logging `End`, then microtask logs `Y`.
</details>

---

### Prediction Challenge 4: Microtask Scheduling Another Microtask
```js
Promise.resolve().then(() => {
  console.log("P1");
  queueMicrotask(() => console.log("P2"));
});
Promise.resolve().then(() => console.log("P3"));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:** `P1, P3, P2`  
**Why:** Microtasks execute in FIFO order: `P1` runs, scheduling `P2` at the end of the microtask queue. Then `P3` (already in queue) runs, followed by `P2`.
</details>

---

### Prediction Challenge 5: Async Race Condition Simulation
```js
let result = "";
function request(val, delay) {
  setTimeout(() => { result = val; }, delay);
}
request("First", 100);
request("Second", 50);
setTimeout(() => console.log(result), 150);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:** `"First"`  
**Why:** Request "Second" resolves at 50ms setting `result = "Second"`. Request "First" resolves at 100ms, overwriting it with `"First"`.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is the difference between the Call Stack, Macrotask Queue, and Microtask Queue?  
<details>
<summary><strong>Answer</strong></summary>
- **Call Stack:** Executes synchronous JavaScript instructions sequentially (LIFO).  
- **Microtask Queue:** Holds high-priority jobs (`Promise.then`, `queueMicrotask`, `await` continuations) that are completely drained immediately after the Call Stack empties.  
- **Macrotask (Task) Queue:** Holds host-scheduled callbacks (`setTimeout`, DOM events, I/O); only one macrotask is processed per event loop turn before checking microtasks again.
</details>

**Q2:** Does `async/await` block the main JavaScript thread while waiting for a response?  
<details>
<summary><strong>Answer</strong></summary>
No. When execution hits `await`, the function suspends, returns a pending Promise, and yields the Call Stack back to the event loop. The main thread remains completely free to handle user interactions and other tasks while the asynchronous I/O runs in the background.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** How does `requestAnimationFrame` differ from `setTimeout(fn, 16)` for animations?  
<details>
<summary><strong>Answer</strong></summary>
- `setTimeout(fn, 16)`: Schedules a task that runs at an arbitrary point in the event loop after $\ge 16\text{ms}$, often firing mid-frame or drifting, causing dropped frames (jank).  
- `requestAnimationFrame(fn)`: Synchronizes with the browser's hardware display refresh rate (e.g. 60Hz/120Hz), executing callbacks right before style calculation and layout, guaranteeing smooth, tear-free animations.
</details>

**Q4:** How does `AbortController` prevent memory leaks and race conditions in React `useEffect` hooks?  
<details>
<summary><strong>Answer</strong></summary>
When a dependency changes or the component unmounts, the `useEffect` cleanup function triggers `controller.abort()`. This signals the browser's networking layer to immediately terminate the HTTP connection, preventing unnecessary data transfer and avoiding `setState` calls on unmounted or superseded component instances.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** What is Microtask Starvation, and how can it cause complete browser UI freezes?  
<details>
<summary><strong>Answer</strong></summary>
The HTML specification mandates that the event loop must continuously drain the Microtask Queue until it is completely empty before rendering or picking the next task. If microtasks continuously queue new microtasks (e.g. via recursive `queueMicrotask` or `Promise.resolve().then()`), the Call Stack never returns to the host, completely starving DOM rendering, user input events, and timers, resulting in an unrecoverable UI freeze.
</details>

**Q6:** How does the React 18/19 Concurrent Scheduler coordinate with the browser Event Loop?  
<details>
<summary><strong>Answer</strong></summary>
The React Scheduler uses a cooperative multitasking model built on top of `MessageChannel` (macrotasks) or `requestPostAnimationFrame`. It chunks render work into slices (typically $\le 5\text{ms}$). At each slice boundary, React checks `navigator.scheduling.isInputPending()` or yields execution back to the browser event loop so pending user input and paint tasks can execute before resuming work.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q7:** How does the V8 Engine optimize Promise Resolution Internals (`PromiseReactionJob`) and Avoid Microtask Trampoline Overhead?  
<details>
<summary><strong>Answer</strong></summary>
1. **PromiseReactionJob Inlining:** In older engines, resolving a Promise required allocating multiple intermediate microtask objects (`PromiseResolveThenableJob`). Modern V8 inlines Promise reaction processing directly into the `JSPromise` internal slots (`[[PromiseFulfillReactions]]`).  
2. **Ignition Bytecode Fast Paths:** For native `await`, Ignition compiles `SuspendGenerator` and `ResumeGenerator` bytecodes that bypass intermediate Promise allocations when awaiting already-resolved promises, transforming the operation into a lightweight direct microtask queue push without object allocation churn.
</details>

---

## 🛠️ Senior Architecture Challenge: Enterprise Race-Free Async Search Pipeline

```js
// See runnable implementation in examples/09-event-loop-microtasks-macro-tasks.js
```

---

## Key Takeaways
1. **Microtasks Run First:** Drain completely before the next task or frame paint.
2. **`await` Yields Execution:** Suspends function and resumes as a microtask.
3. **`setTimeout` is Minimum Delay:** Never guaranteed exact timing.
4. **Cancel Superseded Requests:** Use `AbortController` to prevent stale UI overwrites.
5. **Protect INP Metrics:** Offload synchronous computations $>50\text{ms}$ to Web Workers.

---

[⬅️ Part 08: Scope, Hoisting & TDZ Internals](./08-scope-hoisting-tdz-initialization-internals.md) | [📚 KPI 04 Index](./README.md) | [Part 10: Closures, Memory Retention & Lexical Lifetime ➡️](./10-closures-memory-retention-lexical-lifetime.md)
