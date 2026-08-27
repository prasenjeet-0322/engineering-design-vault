# KPI 11 — Part 02: Timers, Scheduling, Repetition & Cancellation

[⬅️ Part 01: The Fundamental Model: Sync vs Async](./01-sync-vs-async-execution-model.md) | [📚 KPI 11 Index](./README.md) | [Part 03: Callbacks, Error-First Contracts & Inversion of Control ➡️](./03-callbacks-error-first-inversion-of-control.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Timer Primitive / Pattern | Architectural Mechanism | Primary Hazard | Senior Standard |
|---|---|---|---|
| **`setTimeout(fn, delay)`** | Requests host environment to enqueue `fn` into Macrotask Queue after $\ge \text{delay}$ ms. | Delay is minimum threshold; blocks if Call Stack is busy. | 🟢 Always store returned `timerId` handle to enable cancellation via `clearTimeout(timerId)`. |
| **`clearTimeout(timerId)`** | De-registers pending timer from the host scheduler prior to queue dispatch. | Forgetting cleanup on component unmount causes memory leaks. | 🔴 Clean up all active timers in component unmount / effect teardown functions. |
| **`setInterval(fn, delay)`** | Repeatedly enqueues `fn` into Macrotask Queue at fixed clock intervals. | 🔴 **Overlapping Requests**: Enqueues new task even if previous async fetch is still pending! | ⚠️ Avoid for async network I/O; use only for lightweight synchronous clock/UI ticks. |
| **Recursive `setTimeout()`** | Schedules next iteration only *after* the previous async task has fully resolved. | None (eliminates overlapping concurrency). | 🟢 **Senior Polling Standard**: Guarantees fixed pause *between* async request completions. |
| **Debounce** | Delays function invocation until a quiet period ($\Delta t$) with no new events has elapsed. | Stale closure capturing outdated state values. | 🟢 Essential for search inputs, auto-saving drafts, and window resize listeners. |
| **Throttle** | Limits maximum function invocation rate to at most once per fixed time interval ($\Delta t$). | Dropping intermediate critical business payloads. | 🟢 Ideal for continuous high-frequency streams (scroll position, mouse move, game loops). |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: `setInterval` Async Cascades & Unmounted Timer Leaks
> 
> #### Gotcha A: The `setInterval` Overlapping Concurrency Trap
> *"Why did our 5-second `setInterval` polling script trigger 10 simultaneous database queries and crash our backend API?"*  
> ```js
> // ❌ FATAL OVERLAPPING ASYNC HAZARD:
> setInterval(async () => {
>   // 💥 If network latency spikes to 15 seconds, setInterval keeps firing every 5 seconds!
>   // At T=15s, 3 overlapping HTTP requests are running concurrently on the server!
>   const data = await fetchNotifications();
>   updateUI(data); // Out-of-order arrival: older request (T=5s) can overwrite newer request (T=10s)!
> }, 5000);
> ```
> **Deep Architectural Explanation:**  
> `setInterval` schedules callbacks based on **clock ticks**, completely oblivious to whether the previous asynchronous task is pending, resolved, or rejected. When network latency exceeds the interval period, requests stack up in parallel, causing out-of-order UI state overwrites and server resource exhaustion.  
> **The Senior Standard (Recursive `setTimeout` Polling):**  
> ```js
> // ✅ SERIALIZED ASYNC POLLING (Guaranteed Zero Overlap):
> async function poll() {
>   try {
>     const data = await fetchNotifications();
>     updateUI(data);
>   } finally {
>     // 🟢 Schedule next run ONLY after current operation has completely settled!
>     setTimeout(poll, 5000);
>   }
> }
> poll();
> ```
> 
> ---
> 
> #### Gotcha B: The Uncleared Timer Memory Leak in Component Lifecycles
> *"Why does navigating between tabs 10 times result in 10 duplicate intervals running simultaneously in the background?"*  
> If an effect creates an interval via `setInterval` but fails to return a cleanup function (`clearInterval`), the timer handle remains active in the browser host's timer registry. Every time the component mounts, a new interval is registered, retaining the component's closure and memory in the heap forever.  
> **The Senior Standard:** Always return explicit cleanup functions in React `useEffect` / lifecycle hooks.

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / TypeScript Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | `clearTimeout` in search debouncing, `useEffect` interval cleanups, auto-dismiss toast alerts | Fundamental for maintaining clean component lifecycles, memory safety, and responsive user inputs. |
| 🟡 **Moderate** | Used in ~45% of code | Recursive polling with exponential backoff, animated countdown clocks, idle session timeouts | Critical for building resilient background sync engines, financial trading price pollers, and session guards. |
| 🔵 **Foundational / Engine** | Runtime internals | Timer drift compensation algorithms, background tab power clamping, V8 timer heap data structures | Essential for gaming physics loops, telemetry timing SDKs, and Staff/Principal frontend architecture. |

---

## Core Concepts (20 Subtopics)

### Part 1 — Anatomy of Browser Timers: Host Scheduler Registration `🟢 [Daily Driver]`

When JavaScript calls `setTimeout(fn, 1000)`, the V8 engine passes `fn` and `1000` across the C++ boundary to the Host Web API timer manager. The host tracks the expiration timestamp in an internal priority min-heap.

---

### Part 2 — `setTimeout()` Mechanics & Identifier Handles `🟢 [Daily Driver]`

`setTimeout()` returns an opaque integer identifier (in browsers) or a `Timeout` object (in Node.js). This identifier serves as the unique handle for future lifecycle control and cancellation.

```js
const timerId = setTimeout(() => console.log("Fired"), 1000);
console.log("Timer ID Handle:", timerId); // e.g. 1
```

---

### Part 3 — Minimum Delay vs Actual Execution Clock Discrepancies `🟢 [Daily Driver]`

$$\text{Actual Execution Time} = T_{\text{start}} + \text{Delay} + T_{\text{CallStackBusy}} + T_{\text{QueueLatency}}$$
The `delay` parameter is purely a lower bound. If the single JavaScript main thread is blocked by synchronous computation, the timer callback sits waiting in the Macrotask Queue until the stack is clear.

---

### Part 4 — `clearTimeout()` & Explicit Cancellation Lifecycles `🟢 [Daily Driver]`

Calling `clearTimeout(timerId)` removes the pending timer from the host scheduler's priority heap. If the timer has already expired and pushed its callback into the Macrotask Queue, the host marks the callback as cancelled so it is skipped during Event Loop dequeueing.

---

### Part 5 — The Debounce Pattern: Replacing Obsolete Work `🟢 [Daily Driver]`

Debouncing ensures that a function is not invoked until a specified delay has elapsed since the *last* time it was called.

```js
function debounce(fn, delayMs = 300) {
  let timerId = null;
  return function (...args) {
    if (timerId !== null) clearTimeout(timerId); // Cancel previous obsolete timer
    timerId = setTimeout(() => {
      fn.apply(this, args);
      timerId = null;
    }, delayMs);
  };
}
```

---

### Part 6 — `setInterval()` & Fixed Periodic Scheduling `🟢 [Daily Driver]`

`setInterval(fn, delay)` repeatedly registers `fn` to run every `delay` milliseconds. It is designed for synchronous, lightweight recurring UI state mutations (e.g. digital clock seconds tick).

---

### Part 7 — `clearInterval()` & Halting Task Loops `🟢 [Daily Driver]`

Failing to call `clearInterval(intervalId)` creates unbounded background execution that continues running even after the user has navigated to another route or closed a modal.

---

### Part 8 — The `setInterval` Overlapping Async Hazard `🔴 [Production-Critical]`

Because `setInterval` fires based on fixed timer intervals regardless of asynchronous resolution, slow network requests pile up concurrently, causing race conditions, out-of-order state mutations, and backend server congestion.

---

### Part 9 — Scheduling Frequency vs Asynchronous Completion Control `🔴 [Production-Critical]`

- **Scheduling Frequency (`setInterval`):** "Attempt to fire every $X$ ms, regardless of past task status."
- **Completion Control (Recursive `setTimeout`):** "Wait for the current async task to settle, then pause for $X$ ms before initiating the next task."

---

### Part 10 — Recursive `setTimeout()` as the Polling Standard `🟢 [Daily Driver]`

```js
function startResilientPolling(asyncTask, intervalMs) {
  let isCancelled = false;
  let timerId = null;

  async function loop() {
    if (isCancelled) return;
    try {
      await asyncTask();
    } finally {
      if (!isCancelled) {
        timerId = setTimeout(loop, intervalMs); // 🟢 Scheduled after completion
      }
    }
  }

  loop();
  return () => {
    isCancelled = true;
    if (timerId) clearTimeout(timerId);
  };
}
```

---

### Part 11 — Comparative Architecture: `setInterval` vs Recursive `setTimeout` `🟢 [Daily Driver]`

```text
setInterval(5s):
0s           5s          10s          15s
|--- Task A (takes 8s) ---|
             |--- Task B (takes 3s) ---|  <-- OVERLAPPING CONCURRENCY BUG!

Recursive setTimeout(5s):
0s                      8s          13s                 16s
|--- Task A (8s) ---|   |--Pause 5s--|   |--- Task B (3s) ---| (Zero Overlap!)
```

---

### Part 12 — Timer Drift: Accumulative Clock Inaccuracies `🔵 [Foundational / Engine]`

Due to main thread execution delays and task queue scheduling, a 1000ms timer might take 1004ms per tick. Over 100 ticks, `setInterval` will drift by 400ms. High-precision systems compensate for drift by comparing `Date.now() - startTime`.

---

### Part 13 — Background Tab Throttling & Power Clamping `🔵 [Foundational / Engine]`

Browsers throttle background and minimized tabs to save CPU and battery:
- Inactive tabs clamp timers to a minimum interval of **1000ms** (or pause them entirely).
- Timers in nested calls ($>5$ deep) clamp to a minimum of **4ms**.

---

### Part 14 — `setTimeout` Is NOT a Thread Sleep Function `🟢 [Daily Driver]`

Calling `setTimeout(fn, 1000)` does not pause or block the current thread. JavaScript immediately continues executing the remaining lines of the current function.

---

### Part 15 — Timer Lifecycle as a Finite State Machine `🟢 [Daily Driver]`

$$\text{REGISTERED} \xrightarrow{\text{clearTimeout}} \text{CANCELLED}$$
$$\text{REGISTERED} \longrightarrow \text{WAITING} \longrightarrow \text{ENQUEUED} \longrightarrow \text{EXECUTING} \longrightarrow \text{COMPLETED}$$

---

### Part 16 — Stale Timers in Single Page Applications (SPAs) `🔴 [Production-Critical]`

When a user closes a modal or navigates away, active timers associated with that view must be cancelled. Otherwise, when the timer fires, it will attempt to update unmounted component state or trigger unintended network calls.

---

### Part 17 — Debouncing vs. Throttling `🟢 [Daily Driver]`

```text
Raw Events:   ||||||||||||||||||||||||||||||||||||
Debounced:    -----------------------------------* (Runs once after silence)
Throttled:    *-----*-----*-----*-----*-----*-----* (Runs at regulated intervals)
```

---

### Part 18 — Exponential Backoff & Jittered Retry Scheduling `🟢 [Daily Driver]`

When retrying failed network requests, scale timer delays exponentially with random jitter to avoid the **Thundering Herd Problem**:
$$\text{Delay} = \min(\text{MaxDelay}, \text{InitialDelay} \times 2^{\text{attempt}}) + \text{randomJitter}$$

---

### Part 19 — React Lifecycle Timer Cleanup Invariants `🟢 [Daily Driver]`

```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    setNotification(null);
  }, 3000);

  return () => clearTimeout(timer); // 🟢 Mandatory Cleanup Invariant
}, [message]);
```

---

### Part 20 — 10-Point Production Timer Audit Checklist `🟢 [Daily Driver]`

```text
1. Is every setTimeout / setInterval call paired with a cancellation handle?
2. Are timer handles cleared during component unmount / teardown?
3. Is recursive setTimeout used instead of setInterval for asynchronous operations?
4. Are search inputs and window resize events debounced or throttled?
5. Does the application avoid assuming timers provide exact millisecond precision?
6. Are background tab throttling constraints (1000ms minimum) accounted for?
7. Is random jitter included in exponential backoff retry timers?
8. Are stale timer callbacks guarded against mutating unmounted state?
9. Is requestAnimationFrame used instead of setTimeout for visual 60fps animations?
10. Are high-frequency timer intervals tested for memory leaks under stress?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Mechanism | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Recursive `setTimeout()`** | Repeated asynchronous polling (fetching notifications, live status checks, retries). | High-frequency 60 FPS visual UI canvas rendering. | Incurs variable intervals depending on async network latency. | WebSockets / Server-Sent Events. |
| **`setInterval()`** | Purely synchronous, lightweight periodic ticks (digital clock seconds, countdown timer). | Any operation involving `async/await` or network requests. | Causes overlapping request pile-ups during network latency spikes. | Recursive `setTimeout()`. |
| **`requestAnimationFrame()` (rAF)** | DOM animations, canvas drawing, scroll position visual tracking. | Background data polling or long-interval recurring checks. | Pauses completely when tab is backgrounded or minimized. | CSS Animations / Web Workers. |
| **Web Worker Dedicated Timers** | Mission-critical background timing (audio playback, precision stopwatches). | Simple UI component timeouts or dropdown hover delays. | Requires inter-thread message serialization via `postMessage`. | Standard window timers. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Debounced Search & Resilient Auto-Polling Hook in TypeScript
```tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';

// ==========================================
// 1. PRODUCTION DEBOUNCE HOOK
// ==========================================
export function useDebounceValue<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 🟢 Set up timer to update debounced value after delay
    const timerId = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    // 🟢 Mandatory Cleanup: Cancel timer if value or delay changes before timeout
    return () => {
      clearTimeout(timerId);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

// ==========================================
// 2. RESILIENT RECURSIVE POLLING HOOK
// ==========================================
export interface PollingOptions {
  intervalMs: number;
  enabled?: boolean;
}

export function useResilientPolling<T>(
  asyncFetcher: () => Promise<T>,
  options: PollingOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const fetcherRef = useRef(asyncFetcher);
  fetcherRef.current = asyncFetcher;

  useEffect(() => {
    if (!options.enabled) return;

    let isCancelled = false;
    let timerHandle: ReturnType<typeof setTimeout> | null = null;

    async function executePoll() {
      if (isCancelled) return;
      setIsPolling(true);

      try {
        const result = await fetcherRef.current();
        if (!isCancelled) {
          setData(result);
          setError(null);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!isCancelled) {
          setIsPolling(false);
          // 🟢 Recursive Schedule: Guarantees pause happens AFTER async task completes
          timerHandle = setTimeout(executePoll, options.intervalMs);
        }
      }
    }

    executePoll();

    // 🟢 Mandatory Cleanup: Halts background loop on unmount
    return () => {
      isCancelled = true;
      if (timerHandle) clearTimeout(timerHandle);
    };
  }, [options.intervalMs, options.enabled]);

  return { data, error, isPolling };
}

// ==========================================
// 3. ENTERPRISE LIVE SEARCH & POLLER COMPONENT
// ==========================================
export function EnterpriseLiveSearchDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounceValue(searchTerm, 400);

  // Simulated resilient polling for server stats
  const { data: serverStatus, isPolling } = useResilientPolling(
    async () => {
      // Simulated API fetch
      return { activeUsers: Math.floor(Math.random() * 500) + 1000, status: 'HEALTHY' };
    },
    { intervalMs: 5000, enabled: true }
  );

  return (
    <div className="dashboard-card">
      <h3>Enterprise Live Search & Polling Monitor</h3>
      <div className="status-bar">
        Server Status: <strong>{serverStatus?.status || 'CONNECTING...'}</strong> |
        Active Users: <strong>{serverStatus?.activeUsers ?? '---'}</strong>
        {isPolling && <span className="pulse-indicator"> 🔄 Syncing...</span>}
      </div>

      <div className="input-group">
        <label htmlFor="search-input">Debounced Live Query (400ms):</label>
        <input
          id="search-input"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Type to test debounced execution..."
        />
      </div>

      <p>Immediate Value: <code>{searchTerm}</code></p>
      <p>Debounced Query: <strong><code>{debouncedSearch || '(waiting for pause...)'}</code></strong></p>
    </div>
  );
}
```

---

## 🧠 Part 02 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: `clearTimeout` Prior to Expiration
```js
let counter = 0;

const timerA = setTimeout(() => {
  counter += 10;
}, 50);

const timerB = setTimeout(() => {
  counter += 20;
}, 100);

clearTimeout(timerA); // Cancelled immediately

setTimeout(() => {
  console.log("Final Counter:", counter);
}, 150);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Final Counter: 20
```
**Why:** `clearTimeout(timerA)` cancelled Timer A before its 50ms delay elapsed. Timer B fired at 100ms adding 20. At 150ms, the final counter value logged is 20.
</details>

---

### Prediction Challenge 2: Debounce Execution Suppression
```js
function createDebounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const log = (msg) => console.log("Debounced Run:", msg);
const debouncedLog = createDebounce(log, 50);

debouncedLog("First");
setTimeout(() => debouncedLog("Second"), 20);
setTimeout(() => debouncedLog("Third"), 40);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Debounced Run: Third
```
**Why:** The calls at 20ms and 40ms cancelled the preceding pending timers before their 50ms delays could elapse. Only the final call ("Third") survived the quiet window and executed at $40\text{ms} + 50\text{ms} = 90\text{ms}$.
</details>

---

### Prediction Challenge 3: `setInterval` Overlap Simulation
```js
let activeCount = 0;
let maxConcurrent = 0;

const intervalId = setInterval(async () => {
  activeCount++;
  if (activeCount > maxConcurrent) maxConcurrent = activeCount;

  // Simulated slow operation (80ms) with fast interval (30ms)
  await new Promise((r) => setTimeout(r, 80));

  activeCount--;
}, 30);

setTimeout(() => {
  clearInterval(intervalId);
  console.log("Max Concurrent Operations Detected:", maxConcurrent);
}, 120);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Max Concurrent Operations Detected: 3
```
**Why:** Because each task takes 80ms while `setInterval` fires every 30ms, new executions begin before previous ones complete, causing 3 concurrent async tasks to run simultaneously.
</details>

---

### Prediction Challenge 4: Recursive `setTimeout` Serialization
```js
let activeCount = 0;
let maxConcurrent = 0;
let runs = 0;

async function recursivePoll() {
  if (runs >= 3) {
    console.log("Recursive Max Concurrent:", maxConcurrent);
    return;
  }
  runs++;
  activeCount++;
  if (activeCount > maxConcurrent) maxConcurrent = activeCount;

  // Simulate async work
  await new Promise((r) => setTimeout(r, 40));
  activeCount--;

  setTimeout(recursivePoll, 20);
}

recursivePoll();
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Recursive Max Concurrent: 1
```
**Why:** Recursive `setTimeout` schedules the next iteration only after `activeCount--` finishes, strictly guaranteeing that concurrency never exceeds 1.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is the difference between `setTimeout` and `setInterval`?  
<details>
<summary><strong>Answer</strong></summary>
`setTimeout(callback, delay)` schedules a single execution of the callback function after at least `delay` milliseconds have elapsed. `setInterval(callback, delay)` schedules repeated executions of the callback every `delay` milliseconds until explicitly cancelled using `clearInterval(intervalId)`.
</details>

**Q2:** How do you cancel a scheduled timer in JavaScript?  
<details>
<summary><strong>Answer</strong></summary>
When creating a timer, save the returned identifier (`const id = setTimeout(...)` or `const id = setInterval(...)`). To cancel it before it executes, pass the ID to `clearTimeout(id)` or `clearInterval(id)`.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** What is "Debouncing" and how is it implemented using `setTimeout`?  
<details>
<summary><strong>Answer</strong></summary>
Debouncing is a programming pattern that limits the rate at which a function is executed by delaying its invocation until a specified "quiet period" has elapsed without any new invocations. In JavaScript, it is implemented by clearing any previously scheduled timer with `clearTimeout(timerId)` every time the debounced function is invoked, and setting a new `setTimeout` timer for the latest invocation.
</details>

**Q4:** Why is `setInterval` dangerous when used with asynchronous tasks like `fetch()`?  
<details>
<summary><strong>Answer</strong></summary>
`setInterval` is unaware of Promise resolution or network latency. If an asynchronous network request takes longer than the interval duration (e.g. request takes 6 seconds on a 3-second interval), new requests will fire before the previous ones finish. This causes overlapping concurrent requests, race conditions, out-of-order state mutations, and server congestion.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** Why is Recursive `setTimeout()` preferred over `setInterval()` for background polling architecture?  
<details>
<summary><strong>Answer</strong></summary>
Recursive `setTimeout` guarantees that the timer for the next iteration is only scheduled inside the `finally` block *after* the previous asynchronous operation has completely finished. This eliminates overlapping concurrent executions, guarantees a consistent rest duration between requests regardless of network latency, and enables dynamic interval adjustments (such as exponential backoff on errors).
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How do browsers handle timer throttling in background tabs, and how do you architect high-precision background timing in enterprise applications?  
<details>
<summary><strong>Answer</strong></summary>
To save battery and CPU cycles, browser engines (Chromium, WebKit, Gecko) aggressively throttle timers in background/minimized tabs to fire at most once every **1000ms** (or clamp them completely). For applications requiring precision timing (e.g. real-time WebRTC audio sync, sports countdowns, trading telemetry):
1. **Web Workers:** Timers inside dedicated Web Workers (`Worker`) are generally exempt from aggressive background tab clamping because workers run on isolated OS threads.
2. **AudioContext Clock:** The Web Audio API hardware clock (`audioCtx.currentTime`) maintains continuous sub-millisecond precision even when the tab is backgrounded.
3. **Drift Compensators:** Calculate time delta against `performance.now()` on each tick to dynamically adjust the next timer delay.
</details>

---

## 🛠️ Senior Architecture Challenge: Resilient Recursive Poller with Drift Compensation

```js
// See runnable implementation in examples/02-timers-scheduling-cancellation.js
```

---

## Key Takeaways
1. **Always Clear Timers:** Uncleaned timers retain closures and cause memory leaks in single-page apps.
2. **Never Use `setInterval` for Async:** Use Recursive `setTimeout` to eliminate overlapping requests.
3. **Debounce vs Throttle:** Debounce waits for silence; Throttle regulates constant throughput.
4. **Timers Are Minimums:** Timers cannot interrupt running synchronous JavaScript code.
5. **Clean Up in Lifecycles:** Always cancel timers when components unmount to avoid stale state bugs.

---

[⬅️ Part 01: The Fundamental Model: Sync vs Async](./01-sync-vs-async-execution-model.md) | [📚 KPI 11 Index](./README.md) | [Part 03: Callbacks, Error-First Contracts & Inversion of Control ➡️](./03-callbacks-error-first-inversion-of-control.md)
