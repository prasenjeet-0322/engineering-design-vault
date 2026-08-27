# KPI 11 — Part 03: Callbacks, Error-First Contracts & Inversion of Control

[⬅️ Part 02: Timers, Scheduling, Repetition & Cancellation](./02-timers-callback-scheduling-cancellation.md) | [📚 KPI 11 Index](./README.md) | [Part 04: Callback Queues, Task Readiness & Returning to Execution ➡️](./04-callback-queues-task-readiness-execution.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Architecture Concept | Definition / Mechanism | Primary Failure Mode | Senior Production Standard |
|---|---|---|---|
| **Continuation** | Passing a function representing "what to execute next" when an async operation finishes. | Inversion of control, lost stack traces. | 🟢 Understand callbacks as explicit continuation values representing future control flow. |
| **Error-First Protocol** | Standardized signature: `callback(error, result)` where `error` is `null` on success. | Forgetting to `return` after calling `callback(err)`, causing dual execution! | 🔴 Always `return callback(err)` to prevent accidental execution of subsequent success branches. |
| **"Releasing Zalgo"** | An API invoking a callback synchronously under cached conditions and asynchronously on cache miss. | Breaks caller execution assumptions; causes race conditions. | 🔴 **Never Release Zalgo**: Normalize all branches to be 100% asynchronous using `queueMicrotask()`. |
| **Inversion of Control** | Handing your callback to external/3rd-party code, trusting them to invoke it properly. | Callback called 0 times (hangs) or $>1$ times (double charges). | 🔵 Promises eliminate this by enforcing the **Immutable Exactly-Once Settlement Invariant**. |
| **Callback Hell** | Deep horizontal nesting ("Pyramid of Doom") of sequential async callbacks. | Repetitive manual error checking, unhandled rejections, cognitive overload. | 🟢 Solved by Promises (`.then()` chaining) and `async/await` flat linear syntax. |
| **Parallel Callback Barrier** | Manually tracking $N$ concurrent callbacks via an integer counter or latch boolean. | Race conditions, memory leaks if 1 callback never returns. | 🟢 Use `Promise.all()` / `Promise.allSettled()` instead of manual counter state. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: "Releasing Zalgo" & The Inversion of Control Trap
> 
> #### Gotcha A: "Releasing Zalgo" (Unpredictable Sync/Async Timing)
> *"Why did our user profile component randomly render stale data when clicking fast, but work perfectly on slow network throttles?"*  
> ```js
> // ❌ FATAL ZALGO ANTI-PATTERN:
> const cache = new Map();
> function fetchUserData(userId, callback) {
>   if (cache.has(userId)) {
>     // 💥 Synchronous invocation on cache hit!
>     callback(null, cache.get(userId));
>   } else {
>     // 💥 Asynchronous invocation on network fetch!
>     api.get(`/users/${userId}`, (err, data) => {
>       cache.set(userId, data);
>       callback(err, data);
>     });
>   }
> }
> ```
> **Deep Architectural Explanation:**  
> An API that is sometimes synchronous (cache hit) and sometimes asynchronous (network miss) violates the principle of predictable execution semantics. If the caller sets up state *after* the function call assuming asynchronous deferral, the synchronous branch executes *before* caller variables are initialized, causing subtle race conditions and Heisenbugs.  
> **The Senior Standard (Enforcing 100% Asynchrony):**  
> ```js
> // ✅ 100% PREDICTABLE ASYNC EXECUTION (Zalgo Contained):
> function fetchUserDataSafe(userId, callback) {
>   if (cache.has(userId)) {
>     // 🟢 Defensively defer cached results to the microtask queue!
>     queueMicrotask(() => callback(null, cache.get(userId)));
>   } else {
>     api.get(`/users/${userId}`, (err, data) => {
>       cache.set(userId, data);
>       callback(err, data);
>     });
>   }
> }
> ```
> 
> ---
> 
> #### Gotcha B: Inversion of Control & The Dual-Invocation Payment Bug
> *"Why did our customer's credit card get charged twice during checkout when using an old payment analytics SDK?"*  
> When you pass a callback to an external SDK (`analytics.track('purchase', onComplete)`), you relinquish control of execution. If the third-party library has a bug, network retry, or exception handler that invokes `onComplete()` twice, your callback executes twice.  
> **The Senior Standard (Defensive Once Wrapper):**  
> ```js
> // ✅ GUARANTEE EXACTLY-ONCE EXECUTION:
> function once(fn) {
>   let called = false;
>   return function (...args) {
>     if (called) return;
>     called = true;
>     return fn.apply(this, args);
>   };
> }
> chargeCard(once((err, res) => processReceipt(res)));
> ```

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / TypeScript Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Understanding `promisify`, legacy Node.js SDK interop, event handler continuations | Essential for understanding why modern JavaScript evolved toward Promises and `async/await`. |
| 🟡 **Moderate** | Used in ~40% of code | Defensive `once()` guards, Zalgo normalization, bridge adapters from callback to Promise APIs | Critical when integrating legacy C++/Node addons, browser DOM event bridges, or stream sinks. |
| 🔵 **Foundational / Engine** | Runtime internals | Continuation-Passing Style (CPS), Microtask queue scheduling for Zalgo prevention, V8 closure retainers | Essential for platform infrastructure architecture, compiler internals, and Staff/Principal evaluations. |

---

## Core Concepts (20 Subtopics)

### Part 1 — Continuations: "What Happens Next" as First-Class Values `🟢 [Daily Driver]`

In computer science, a **Continuation** represents the remaining execution steps of a computation. In JavaScript, passing a callback function as a continuation transforms implicit sequential execution into explicit first-class values.

---

### Part 2 — Anatomy of Callback-Based API Contracts `🟢 [Daily Driver]`

A robust callback contract must explicitly define:
1. **Invocation Timing:** Guaranteed 100% asynchronous (or 100% synchronous).
2. **Cardinality:** Exactly once, at most once, or $0 \dots N$ times (events).
3. **Signature:** Positional arguments (e.g. `(error, result)`).
4. **Exception Handling:** How internal synchronous exceptions are caught and reported.

---

### Part 3 — The Zalgo Danger: Predictable Asynchronous Semantics `🔴 [Production-Critical]`

"Releasing Zalgo" refers to an API that exhibits non-deterministic execution timing (synchronous in some branches, asynchronous in others). This unpredictability introduces subtle race conditions into caller code.

---

### Part 4 — Defensive Async Normalization (`queueMicrotask`) `🟢 [Daily Driver]`

To prevent Zalgo, normalize immediate/cached synchronous paths by wrapping callback invocations inside `queueMicrotask()` or `Promise.resolve().then()`:
```js
function getResource(id, cb) {
  if (isCached(id)) {
    queueMicrotask(() => cb(null, getFromCache(id))); // 🟢 Always Async
    return;
  }
  fetchFromNetwork(id, cb);
}
```

---

### Part 5 — Node.js Error-First Protocol (`callback(err, data)`) `🟢 [Daily Driver]`

The universal convention in early JavaScript:
- First parameter is reserved for an `Error` object (or `null` on success).
- Second parameter holds the successful return data.
- **Rule:** If `err` is truthy, the caller must immediately halt further execution.

---

### Part 6 — The Fragility of Manual Error Propagation `🔴 [Production-Critical]`

In deeply nested callback trees, every single layer must manually check `if (err) return cb(err)`. A single missed `if (err)` check silently swallows the error, causing the application to proceed with corrupted or undefined state.

---

### Part 7 — Why Synchronous `try/catch` Fails with Async Callbacks `🔴 [Production-Critical]`

```js
// ❌ FAILS: The try/catch block pops off the Call Stack immediately!
try {
  setTimeout(() => {
    throw new Error("Fatal Crash!"); // Uncaught Exception!
  }, 100);
} catch (e) {
  console.log("Will NEVER be caught here!");
}
```
When the asynchronous timer callback executes 100ms later, the original `try/catch` stack frame no longer exists.

---

### Part 8 — Inversion of Control: The Trust Deficit `🔴 [Production-Critical]`

When passing a callback to third-party code, you lose control over:
- Will it be called too early (synchronously)?
- Will it be called too late?
- Will it never be called at all?
- Will it be called multiple times?
- Will it swallow uncaught exceptions?

---

### Part 9 — Callback Contract Violations (0 vs Multiple Calls) `🔴 [Production-Critical]`

Third-party libraries with unhandled edge cases can invoke callbacks multiple times (triggering duplicate database writes) or fail to invoke them entirely (leaving UI spinners hanging indefinitely).

---

### Part 10 — The Exactly-Once Settlement Invariant `🔵 [Foundational / Engine]`

The foundational breakthrough of Promises was enforcing the **Immutable Exactly-Once Settlement Invariant**: a Promise transitions from `PENDING` to either `FULFILLED` or `REJECTED` exactly once. Any subsequent attempts to resolve or reject are silently ignored.

---

### Part 11 — Callback Hell & The Pyramid of Doom `🟢 [Daily Driver]`

When multiple dependent asynchronous operations are sequenced, nested callbacks cause code to indent further to the right on each step, creating the unmaintainable "Pyramid of Doom".

```text
a(function() {
  b(function() {
    c(function() {
      d(function() {
        // Deeply nested Pyramid of Doom
      });
    });
  });
});
```

---

### Part 12 — Sequential Callback Composition `🟢 [Daily Driver]`

To chain $N$ asynchronous operations sequentially with callbacks, each step must nest inside the preceding step's success block, mixing business logic with boilerplate error propagation.

---

### Part 13 — Parallel Callback Coordination via Barriers `🟢 [Daily Driver]`

Running $N$ asynchronous tasks in parallel requires manually managing a completion barrier (a counter integer) and an array of collected results:
```js
let completed = 0;
const results = [];
let hasError = false;

items.forEach((item, index) => {
  fetchItem(item, (err, res) => {
    if (hasError) return;
    if (err) { hasError = true; return finalCallback(err); }
    results[index] = res;
    if (++completed === items.length) finalCallback(null, results);
  });
});
```

---

### Part 14 — State Inconsistencies & Partial Failures in Parallel Barriers `🔴 [Production-Critical]`

In manual parallel callback gates, handling partial failures, cancellation, and thread-safe error reporting is error-prone. If 1 of 5 requests hangs indefinitely, the barrier never unlocks.

---

### Part 15 — One-Shot Completion vs. Recurring Event Callbacks `🟢 [Daily Driver]`

- **One-Shot:** Fetches, timers, file reads $\implies$ Expects exactly one invocation.
- **Recurring Events:** DOM clicks, WebSockets, Streams $\implies$ Expects zero to infinite invocations over time.

---

### Part 16 — Lifecycle & Cancellation Deficits `🟢 [Daily Driver]`

Callback APIs do not possess a standardized cancellation protocol. Every library invented ad-hoc cancellation mechanisms (returning cancel functions, passing tokens, or providing no cancellation at all).

---

### Part 17 — Refactoring Callback Trees: Named Functions `🟢 [Daily Driver]`

Extracting inline anonymous functions into named modular handlers flattens the visual indentation, but preserves the underlying coupling and manual error forwarding.

---

### Part 18 — Stale Closures & Outdated Lexical Scopes `🔴 [Production-Critical]`

Callbacks capture references to variables in their enclosing lexical scope. If external state mutates before the asynchronous callback executes, the callback operates on stale data unless mutable references are maintained.

---

### Part 19 — The Evolutionary Imperative: Why Promises Were Standardized `🟢 [Daily Driver]`

$$\text{Callbacks (Inversion of Control, Nesting)} \xrightarrow{\text{ES6 (2015)}} \text{Promises (Uninverted Control, Chainable)} \xrightarrow{\text{ES2017}} \text{Async/Await}$$
Promises solved Callback Hell by turning the future result into a first-class, immutable value that the consumer controls.

---

### Part 20 — 10-Point Callback Architecture Checklist `🟢 [Daily Driver]`

```text
1. Is the callback API guaranteed to be 100% asynchronous across all execution paths?
2. Are immediate cached results wrapped in queueMicrotask() to prevent releasing Zalgo?
3. Does every error branch explicitly return (e.g. return callback(err))?
4. Are third-party callback consumers wrapped in defensive once() guards?
5. Is the error-first signature (error, data) strictly adhered to?
6. Are surrounding synchronous try/catch traps avoided for asynchronous callbacks?
7. Is a timeout safeguard attached to prevent operations from hanging indefinitely?
8. Are parallel callback counters guarded against race conditions on error?
9. Is promisify() used to convert legacy callback APIs into modern Promises?
10. Are event listeners paired with explicit removal teardowns to prevent memory leaks?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Mechanism | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Error-First Callbacks** | Interfacing with legacy Node.js core modules (`fs`, `crypto`) or micro-libraries. | New enterprise greenfield applications, complex async workflows. | Heavy boilerplate; prone to forgotten `return` and callback hell. | Promises (`fs/promises`), Async/Await. |
| **Defensive `once()` Wrapper** | Wrapping callbacks passed to untrusted third-party SDKs or event listeners. | High-frequency continuous event streams (e.g. `onMouseMove`). | Minimal runtime overhead; drops subsequent duplicate invocations. | Native Promise settlement. |
| **Native Promises (`new Promise`)** | Standard asynchronous contract; chaining sequential tasks and composing parallel I/O. | Synchronous utility functions with zero I/O or future completion. | Allocates Promise instance and microtask queue frames. | Async/Await syntax. |
| **Async / Await** | Standard day-to-day enterprise asynchronous application code. | Simple functional pipeline transformations where synchronous flow is desired. | Requires transpilation for very old ES5 runtime targets. | Promise `.then()` chains. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Defensive Async Guard & Promisifier Adapter in TypeScript
```tsx
import React, { useState, useCallback } from 'react';

// ==========================================
// 1. DEFENSIVE ONCE & PROMISIFY UTILITIES
// ==========================================
export type ErrorFirstCallback<T> = (error: Error | null, result?: T) => void;

/**
 * Wraps a callback to guarantee it executes EXACTLY ONCE,
 * protecting against third-party double-invocation bugs.
 */
export function createOnceCallback<T>(cb: ErrorFirstCallback<T>): ErrorFirstCallback<T> {
  let called = false;
  return function (error: Error | null, result?: T) {
    if (called) {
      console.warn('[Defensive Callback Guard]: Blocked duplicate callback invocation attempt!');
      return;
    }
    called = true;
    cb(error, result);
  };
}

/**
 * Converts any legacy error-first callback API into a modern Promise.
 */
export function promisify<T, A extends any[]>(
  fn: (...args: [...A, ErrorFirstCallback<T>]) => void
): (...args: A) => Promise<T> {
  return (...args: A) => {
    return new Promise<T>((resolve, reject) => {
      const safeCallback = createOnceCallback<T>((err, data) => {
        if (err) return reject(err);
        resolve(data as T);
      });
      fn(...args, safeCallback);
    });
  };
}

// ==========================================
// 2. ENTERPRISE LEGACY ADAPTER COMPONENT
// ==========================================
// Simulated legacy SDK with an untrusted error-first callback
function legacyThirdPartyBillingSDK(orderId: string, callback: ErrorFirstCallback<{ txId: string }>) {
  setTimeout(() => {
    // 💥 Buggy SDK invokes callback TWICE!
    callback(null, { txId: `TX_${orderId}_881` });
    callback(null, { txId: `TX_${orderId}_DUPLICATE` });
  }, 100);
}

// Wrap legacy SDK in promisified adapter
const chargeCustomerAsync = promisify(legacyThirdPartyBillingSDK);

export function EnterpriseLegacyCallbackAdapter() {
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'CHARGING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [chargeCount, setChargeCount] = useState(0);

  const handleExecutePayment = useCallback(async () => {
    setStatus('CHARGING');
    try {
      // 🟢 Uses Promisified Adapter with Exactly-Once Invariant Guarantee
      const result = await chargeCustomerAsync('ORD-5501');
      setTransactionId(result.txId);
      setChargeCount((prev) => prev + 1);
      setStatus('SUCCESS');
    } catch (err: any) {
      setStatus('ERROR');
    }
  }, []);

  return (
    <div className="adapter-card">
      <h3>Enterprise Callback Inversion-of-Control Guard</h3>
      <p>Guarantees third-party legacy callbacks cannot trigger duplicate charges.</p>

      <p>Status: <strong><code>{status}</code></strong></p>
      <p>Charges Processed: <strong>{chargeCount}</strong> (Guaranteed exactly 1)</p>
      {transactionId && <p>Transaction ID: <code>{transactionId}</code></p>}

      <button
        onClick={handleExecutePayment}
        disabled={status === 'CHARGING'}
        className="primary-button"
      >
        {status === 'CHARGING' ? 'Processing...' : 'Execute Protected Payment'}
      </button>
    </div>
  );
}
```

---

## 🧠 Part 03 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: The Dual-Invocation Bug (Missing `return`)
```js
function fetchUser(id, callback) {
  if (!id) {
    callback(new Error("ID required"), null);
    // 💥 Missing `return` keyword here!
  }
  callback(null, { id, name: "Sunny" });
}

fetchUser(null, (err, user) => {
  if (err) console.log("Caught Error:", err.message);
  else console.log("User Loaded:", user.name);
});
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Caught Error: ID required
User Loaded: Sunny
```
**Why:** Because the producer omitted `return` after `callback(err, null)`, JavaScript continued sequential execution, invoking the callback a second time with the success payload. Always write `return callback(err)`.
</details>

---

### Prediction Challenge 2: "Releasing Zalgo" (Unpredictable Sync vs Async)
```js
const cache = { 10: "Sunny" };

function getUser(id, cb) {
  if (cache[id]) cb(cache[id]); // Synchronous
  else setTimeout(() => cb("Fetched " + id), 10); // Asynchronous
}

console.log("Start");
getUser(10, (name) => console.log("Result 1:", name));
console.log("Middle");
getUser(20, (name) => console.log("Result 2:", name));
console.log("End");
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Start
Result 1: Sunny
Middle
End
Result 2: Fetched 20
```
**Why:** Request 1 hits the cache and executes synchronously *before* `"Middle"` is printed. Request 2 misses the cache and executes asynchronously *after* `"End"` is printed. This inconsistency is Zalgo.
</details>

---

### Prediction Challenge 3: Synchronous `try/catch` with Async Callback
```js
try {
  setTimeout(() => {
    throw new Error("Asynchronous Explosion!");
  }, 10);
  console.log("Timer registered successfully");
} catch (e) {
  console.log("Caught in catch block:", e.message);
}
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Timer registered successfully
(Followed by an Uncaught Error 10ms later that crashes the runtime)
```
**Why:** The `try/catch` block popped off the Call Stack synchronously after registering the timer. When the timer callback executed 10ms later, there was no active `try/catch` frame on the stack.
</details>

---

### Prediction Challenge 4: Parallel Callback Completion Gate
```js
let count = 0;
const results = [];

function done(index, value) {
  results[index] = value;
  if (++count === 2) {
    console.log("Parallel Gate Finished:", results);
  }
}

setTimeout(() => done(0, "A"), 50);
setTimeout(() => done(1, "B"), 20);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Parallel Gate Finished: [ 'A', 'B' ]
```
**Why:** Request 1 (index 1, "B") completes at 20ms. Request 0 (index 0, "A") completes at 50ms. When `count === 2`, the gate unlocks and logs the preserved positional array `['A', 'B']`.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is an "Error-First Callback" in JavaScript?  
<details>
<summary><strong>Answer</strong></summary>
An error-first callback is a standardized callback signature `(error, result) => {}` popularized by Node.js. If an operation fails, the first argument is passed an `Error` instance and the second is `null`/`undefined`. If the operation succeeds, the first argument is `null` and the second is the result data.
</details>

**Q2:** Why can't a synchronous `try...catch` block catch an error thrown inside a `setTimeout()` callback?  
<details>
<summary><strong>Answer</strong></summary>
Because JavaScript is asynchronous and single-threaded. By the time the `setTimeout` timer expires and its callback executes in a future turn of the Event Loop, the synchronous `try...catch` block has already finished executing and popped off the Call Stack.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** What is "Inversion of Control" in the context of asynchronous callbacks, and why is it problematic?  
<details>
<summary><strong>Answer</strong></summary>
Inversion of Control occurs when your code passes a continuation callback to a third-party function or external library, giving that external code total control over when, how many times, and under what conditions your callback is invoked. If the external library has a bug, it might invoke your callback multiple times (causing duplicate side effects like charging a card twice) or never invoke it at all (causing the app to hang).
</details>

**Q4:** What is "Releasing Zalgo" in JavaScript API design, and how do you prevent it?  
<details>
<summary><strong>Answer</strong></summary>
"Releasing Zalgo" occurs when an asynchronous function sometimes executes its callback synchronously (e.g. on a cache hit) and sometimes asynchronously (e.g. on a network miss). This creates unpredictable execution order for the caller. It is prevented by ensuring that all code paths are 100% asynchronous, using `queueMicrotask(() => callback(...))` to defer synchronous cached results.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** What is the "Pyramid of Doom" (Callback Hell) and what fundamental architectural problems does it cause beyond visual nesting?  
<details>
<summary><strong>Answer</strong></summary>
1. **Coupled Error Handling:** Every nested layer must manually inspect and re-forward errors, which frequently leads to swallowed exceptions.  
2. **Inverted Control Flow:** Sequential logic is scattered across disjointed closures, making cancellation, retries, and cleanup difficult.  
3. **Fragile Parallel Coordination:** Coordinating multiple parallel operations requires manual counters and latch variables, which are prone to race conditions if one branch hangs or fails.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How does the Promise specification (Promises/A+) mathematically solve the Inversion of Control and Zalgo problems present in callbacks?  
<details>
<summary><strong>Answer</strong></summary>
1. **Uninverted Control:** Instead of passing a callback into a black box, a Promise *returns* an immutable value object representing the future outcome to the caller.  
2. **Immutable Exactly-Once Settlement:** A Promise transitions from `PENDING` to `FULFILLED` or `REJECTED` exactly once. Any duplicate resolutions or rejections are mathematically ignored by the engine.  
3. **Mandatory Asynchrony (Zalgo Immune):** The Promises/A+ spec mandates that `.then()` and `.catch()` callbacks are *always* executed asynchronously on the Microtask Queue, even if the Promise was already resolved synchronously before `.then()` was attached.
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Parallel Callback Barrier Engine

```js
// See runnable implementation in examples/03-callbacks-error-first-inversion-of-control.js
```

---

## Key Takeaways
1. **Continuations Describe Future Flow:** Callbacks define what executes next when an async task completes.
2. **Never Release Zalgo:** Always ensure callback APIs are 100% asynchronous across all branches.
3. **Always `return callback(err)`:** Prevent dual execution by terminating functions immediately on error.
4. **Guard Untrusted Callbacks:** Use `once()` wrappers to defend against third-party double-invocations.
5. **Promises Uninvert Control:** Promises evolved to replace callbacks with immutable, exactly-once guarantees.

---

[⬅️ Part 02: Timers, Scheduling, Repetition & Cancellation](./02-timers-callback-scheduling-cancellation.md) | [📚 KPI 11 Index](./README.md) | [Part 04: Callback Queues, Task Readiness & Returning to Execution ➡️](./04-callback-queues-task-readiness-execution.md)
