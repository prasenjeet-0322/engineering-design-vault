# KPI 22 — Part 02: Callbacks, Callback Hell & Promises Lifecycle

[⬅️ Part 01: The JavaScript Runtime, Call Stack, Web APIs & Event Loop](./01-runtime-call-stack-web-apis-event-loop.md) | [📚 KPI 22 Index](./README.md) | [Part 03: Promise Chaining & Promise Combinators ➡️](./03-promise-chaining-combinators-concurrency.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Asynchronous Pattern | Mechanism & Definition | Core Production Rule | Senior Architectural Standard |
|---|---|---|---|
| **Callback** | Function passed as an argument to be invoked at a later time. | Callbacks are **not** inherently async; depends on caller invocation. | 🟢 Use for synchronous higher-order functions (`.map()`); avoid for deep async I/O. |
| **Error-First Callback** | Convention: `callback(err, data)` where `err === null` on success. | Legacy Node.js standard; manual error bubbling at every nested level. | 🟡 Promisify using `util.promisify` or wrap in `new Promise` for legacy APIs. |
| **Promise State Machine** | 3 mutually exclusive states: `Pending` $\to$ `Fulfilled` OR `Rejected`. | Once a Promise settles, its state and value are **immutable forever**. | 🔵 Calling `resolve()` then `reject()` ignores the second settlement completely. |
| **Promise Executor** | Function `(resolve, reject) => {}` passed to `new Promise()`. | Runs **synchronously** immediately during constructor execution. | 🔴 Keep executors fast; only offload asynchronous operations (timers, sockets). |
| **`.then(onFulfilled)`** | Registers a reaction for successful resolution; returns a new Promise. | Always executes as an asynchronous **microtask**, even on resolved promises. | 🟢 Always explicitly `return` a value or Promise inside `.then()` to avoid `undefined`. |
| **`.catch(onRejected)`** | Syntactic sugar for `.then(undefined, onRejected)`; catches errors in chain. | Catches rejections from any preceding step in the Promise chain. | 🟢 Return a fallback value in `.catch()` to recover and continue the chain safely. |
| **`.finally(onFinally)`** | Executes cleanup callback regardless of fulfillment or rejection. | Does not receive arguments; passes through original settlement state. | 🟢 Use for UI cleanup (`setLoading(false)`), socket closing, and timer teardown. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: Forgotten `return` & The Synchronous `try/catch` Trap
> 
> #### Gotcha A: Forgotten `return` in `.then()` Chains (The Broken Promise Pipeline)
> *"Why did our second `.then()` receive `undefined` instead of waiting for the user's posts to finish loading?"*  
> ```js
> // ❌ BROKEN PROMISE CHAIN (FORGOTTEN RETURN):
> getUser(1)
>   .then((user) => {
>     // 💥 FORGOTTEN RETURN: getPosts returns a Promise, but we didn't return it!
>     getPosts(user.id);
>   })
>   .then((posts) => {
>     console.log("Posts:", posts); // 💥 Logs: "Posts: undefined" (Did NOT wait for getPosts!)
>   });
> ```
> **Deep Architectural Explanation:**  
> In JavaScript, a function without an explicit `return` statement returns `undefined` implicitly. When `.then(() => { getPosts(user.id); })` executes, the callback returns `undefined`. The Promise chaining algorithm sees a primitive `undefined` return, immediately fulfills the returned Promise with `undefined`, and schedules the next `.then()` microtask before `getPosts()` even finishes over the network.  
> **The Senior Standard:** Always explicitly `return` inner promises or use arrow function concise body returns (`(user) => getPosts(user.id)`):
> ```js
> // ✅ EXPLICIT CHAINED RETURN:
> getUser(1)
>   .then((user) => getPosts(user.id)) // 🟢 Returns Promise; next .then waits for resolution!
>   .then((posts) => {
>     console.log("Posts:", posts); // 🟢 Logs actual posts array!
>   });
> ```
> 
> ---
> 
> #### Gotcha B: Synchronous `try/catch` Cannot Catch Asynchronous Promise Rejections
> *"Why did our application crash with an `UnhandledPromiseRejection` even though the fetch call was wrapped in a `try/catch` block?"*  
> ```js
> // ❌ FATAL UNCAUGHT ASYNC REJECTION:
> try {
>   // 💥 new Promise begins execution, but rejection happens in a FUTURE event loop turn!
>   fetchUserData(-1); // Returns rejected Promise
> } catch (err) {
>   console.error("Caught error:", err); // 💥 NEVER RUNS! Synchronous try/catch exited long ago!
> }
> ```
> **Deep Architectural Explanation:**  
> A synchronous `try/catch` block only catches exceptions thrown synchronously on the current Call Stack execution frame. When an asynchronous operation fails in a Web API or microtask turn, the original `try/catch` frame has already been popped off the Call Stack. The rejection travels down the Promise rejection queue, triggering `UnhandledPromiseRejection` if not handled via `.catch()` or `await`.  
> **The Senior Standard:** Chain `.catch()` on promises or use `try/catch` with `await`:
> ```js
> // ✅ PROPER PROMISE REJECTION HANDLING:
> fetchUserData(-1).catch((err) => console.error("Caught via Promise .catch():", err.message));
> ```

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / Next.js / Vite Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Promises, `.then()`, `.catch()`, `.finally()`, Loading state toggles | Universal foundation for data fetching, custom hooks, and async utilities. |
| 🟡 **Moderate** | Used in ~45% of code | Promisification of legacy event emitters/callbacks, Settlement invariants | Essential for wrapping third-party SDKs, Node.js streams, and IndexedDB APIs. |
| 🔵 **Foundational / Engine** | Runtime internals | Promise Resolution Procedure (Promise unwrapping), Microtask reaction jobs | Mandatory for Staff/Principal engineering evaluations, async performance profiling, and SDK design. |

---

## Core Concepts (20 Subtopics)

### Part 1 — What Is a Callback? Inversion of Control `🟢 [Daily Driver]`

A callback is a function passed into another function, surrendering execution timing and parameters to the receiving function (Inversion of Control).

---

### Part 2 — Synchronous vs Asynchronous Callbacks `🟢 [Daily Driver]`

- **Synchronous:** `[1, 2].map(x => x * 2)` executes immediately on the current stack.
- **Asynchronous:** `setTimeout(cb, 100)` executes in a future task queue turn.

---

### Part 3 — Why Callbacks Were Used for Asynchronous Operations `🟢 [Daily Driver]`

Because JavaScript is single-threaded, asynchronous APIs required passing a callback to be executed once the Web API finished background I/O.

---

### Part 4 — Node.js Error-First Callback Pattern `🟢 [Daily Driver]`

```js
fs.readFile('/path', (err, data) => {
  if (err) return handleError(err);
  processData(data);
});
```

---

### Part 5 — The Anatomy of Callback Hell (Pyramid of Doom) `🔴 [Production-Critical]`

Deep nesting of dependent callbacks creates a rightward-drifting pyramid (`a(b(c(d())))`) that obscures control flow.

---

### Part 6 — Why Callback Hell Is an Architectural Hazard `🔴 [Production-Critical]`

1. **Repetitive Error Handling:** Every nested layer must re-implement error checks.  
2. **Brittle Scope Coupling:** Outer variables leak into all inner closures.  
3. **Difficult Concurrency:** Running 3 parallel callbacks and waiting for all 3 requires manual counters.

---

### Part 7 — Flattening Callbacks with Named Functions `🟢 [Daily Driver]`

Pre-Promise technique separating inline anonymous callbacks into standalone named functions to restore vertical code structure.

---

### Part 8 — What Is a Promise? `🟢 [Daily Driver]`

A Promise is a first-class JavaScript object representing the eventual completion (fulfillment) or failure (rejection) of an asynchronous operation.

---

### Part 9 — The 3 Promise States `🟢 [Daily Driver]`

1. **Pending:** Initial state; operation is ongoing.
2. **Fulfilled:** Operation succeeded; value is available.
3. **Rejected:** Operation failed; error/reason is available.

---

### Part 10 — The Settling Invariant `🔵 [Foundational / Engine]`

A Promise can transition from `Pending` to `Fulfilled` or `Rejected` exactly once. Subsequent calls to `resolve()` or `reject()` are silently ignored.

---

### Part 11 — Creating Promises with `new Promise()` `🟢 [Daily Driver]`

```js
const promise = new Promise((resolve, reject) => {
  // Synchronous executor
  if (success) resolve(data);
  else reject(new Error("Failed"));
});
```

---

### Part 12 — Synchronous Executor vs Asynchronous Reactions `🔵 [Foundational / Engine]`

The executor function passed to `new Promise(executor)` runs **synchronously** immediately. Only `.then()` / `.catch()` reactions are scheduled as asynchronous microtasks.

---

### Part 13 — Consuming Values with `.then()` `🟢 [Daily Driver]`

`.then(onFulfilled, onRejected)` registers reaction callbacks and returns a new Promise, enabling linear chaining.

---

### Part 14 — Why `.then()` Reactions Are Always Microtasks `🔵 [Foundational / Engine]`

Even if a Promise is already settled (`Promise.resolve("Done")`), its `.then()` callback is guaranteed to execute asynchronously in the Microtask Queue.

---

### Part 15 — Error Handling with `.catch()` `🟢 [Daily Driver]`

`.catch(onRejected)` catches rejections from anywhere upstream in the chain, enabling centralized error handling.

---

### Part 16 — Guaranteed Cleanup with `.finally()` `🟢 [Daily Driver]`

`.finally(() => {})` executes when the chain settles (success or failure). It does not receive arguments and passes the upstream value or error through to downstream consumers.

---

### Part 17 — The Promise Resolution Procedure `🔵 [Foundational / Engine]`

If `.then()` returns a Promise or "thenable", the outer Promise adopts the state and value of the returned inner Promise (recursive unwrapping).

---

### Part 18 — Realistic Architectural Example `🟢 [Daily Driver]`

```js
fetchUser(1)
  .then(user => fetchPosts(user.id))
  .then(posts => renderPosts(posts))
  .catch(err => showErrorBanner(err.message))
  .finally(() => setLoading(false));
```

---

### Part 19 — The 4 Common Promise Anti-Patterns `🔴 [Production-Critical]`

1. **Forgotten `return` in `.then()`:** Breaks downstream data flow.  
2. **Nested `.then()`:** Recreating callback hell inside Promise callbacks.  
3. **Synchronous `try/catch` on Promises:** Fails to catch asynchronous rejections.  
4. **Promise Constructor Anti-Pattern:** Wrapping already promisified functions in `new Promise()`.

---

### Part 20 — The 10-Point Senior Promise Architecture Audit Checklist `🟢 [Daily Driver]`

```text
1. Are all inner promises explicitly returned? ──► 2. Are nested .then() blocks flattened?
3. Is .finally() used for teardown (loading/cleanup)? ──► 4. Is the constructor anti-pattern avoided?
5. Are errors caught via .catch() or await? ──► 6. Is settlement immutability respected?
7. Are promise executors kept fast & synchronous? ──► 8. Are error-first callbacks promisified?
9. Is downstream fallback handled in .catch()? ──► 10. Are unhandled rejections tracked globally?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Async Handling Abstraction | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Promises (`.then` / `.catch`)** | Chaining pipelines, functional transformations, combinators (`Promise.all`). | Complex sequential workflows with multiple branching conditions. | Callback nesting if developers forget to return promises. | `async` / `await`. |
| **Callbacks** | Simple synchronous array iterations (`map`, `filter`) and DOM listeners. | Asynchronous sequential pipelines requiring error propagation. | Callback hell; no standardized error bubbling. | Promises / `async-await`. |
| **`async` / `await`** | Sequential async business logic, try/catch error handling, readability. | Independent parallel requests (without `Promise.all`). | Can cause accidental sequential request waterfalls. | Promise combinators. |
| **Event Emitters** | Streaming events or multiple recurring values over time (WebSockets). | Single-shot request/response operations. | Memory leaks if event listeners are not unsubscribed. | RxJS Observables / Async Generators. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Promise-Based Data Fetcher Hook & UI Dashboard in TypeScript
```tsx
import React, { useState, useEffect, useCallback } from 'react';

// ==========================================
// 1. PROMISE STATE INTERFACE
// ==========================================
export interface PromiseState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  status: 'IDLE' | 'PENDING' | 'FULFILLED' | 'REJECTED';
}

export interface UserRecord {
  id: number;
  name: string;
  email: string;
}

// Mock API Returning a Promise
function fetchUserData(id: number): Promise<UserRecord> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id <= 0) reject(new Error(`Invalid User ID: ${id}. Must be > 0`));
      else resolve({ id, name: `User #${id}`, email: `user${id}@vault.com` });
    }, 500);
  });
}

// ==========================================
// 2. REUSABLE PROMISE HOOK
// ==========================================
export function usePromise<T>(promiseFactory: () => Promise<T>, deps: any[] = []) {
  const [state, setState] = useState<PromiseState<T>>({
    data: null,
    error: null,
    isLoading: true,
    status: 'PENDING'
  });

  const execute = useCallback(() => {
    setState({ data: null, error: null, isLoading: true, status: 'PENDING' });

    promiseFactory()
      .then((data) => {
        setState({ data, error: null, isLoading: false, status: 'FULFILLED' });
      })
      .catch((error: Error) => {
        setState({ data: null, error, isLoading: false, status: 'REJECTED' });
      })
      .finally(() => {
        console.log('[usePromise]: Execution pipeline settled.');
      });
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { ...state, retry: execute };
}

// ==========================================
// 3. REACT CONSUMER DASHBOARD
// ==========================================
export function EnterprisePromiseDataDashboard() {
  const [userId, setUserId] = useState<number>(1);
  const { data, error, isLoading, status, retry } = usePromise(() => fetchUserData(userId), [userId]);

  return (
    <div className="promise-dashboard-card">
      <header className="card-header">
        <h3>Enterprise Promise Lifecycle Dashboard</h3>
        <span className={`status-pill pill-${status.toLowerCase()}`}>State: {status}</span>
      </header>

      <div className="controls">
        <button onClick={() => setUserId((id) => id + 1)} className="action-btn">
          Next User (ID: {userId + 1})
        </button>
        <button onClick={() => setUserId(-1)} className="error-btn">
          Trigger Rejection (ID: -1)
        </button>
        <button onClick={retry} className="retry-btn">
          🔄 Retry Current
        </button>
      </div>

      {isLoading && <p className="loading-state">⏳ Promise is PENDING (Microtask reactions queued)...</p>}

      {error && (
        <div className="error-banner">
          ⚠️ <strong>Promise REJECTED:</strong> {error.message}
        </div>
      )}

      {data && !isLoading && (
        <div className="data-card">
          <h4>✅ Promise FULFILLED</h4>
          <p><strong>Name:</strong> {data.name}</p>
          <p><strong>Email:</strong> <code>{data.email}</code></p>
        </div>
      )}
    </div>
  );
}
```

---

## 🧠 Part 02 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: Synchronous Executor vs Microtask Timing
```js
console.log("1");

new Promise((resolve) => {
  console.log("2");
  resolve("3");
  console.log("4");
}).then((val) => {
  console.log(val);
});

console.log("5");
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
1
2
4
5
3
```
**Step-by-Step Breakdown:**  
1. `1` logs synchronously on the Call Stack.  
2. `new Promise(executor)` begins: `2` logs synchronously, `resolve("3")` queues the `.then()` reaction in the Microtask Queue, and `4` logs synchronously.  
3. `5` logs synchronously as the script completes.  
4. The Call Stack is empty $\to$ Microtask Queue executes $\to$ `3` logs.
</details>

---

### Prediction Challenge 2: The Settling Invariant (Resolve then Reject)
```js
const p = new Promise((resolve, reject) => {
  resolve("FIRST_RESOLUTION");
  reject(new Error("SECOND_REJECTION"));
  resolve("THIRD_RESOLUTION");
});

p.then((val) => console.log("Fulfilled with:", val))
 .catch((err) => console.log("Caught Error:", err.message));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Fulfilled with: FIRST_RESOLUTION
```
**Why:** A Promise settles exactly once. The first call to `resolve()` transitions the state from `Pending` to `Fulfilled`. Subsequent calls to `reject()` or `resolve()` are completely ignored.
</details>

---

### Prediction Challenge 3: Return Value Propagation through `.then()` Chain
```js
Promise.resolve(10)
  .then((x) => x * 2)
  .then((x) => {
    // Omitting return
    const y = x + 5;
  })
  .then((x) => console.log("Final Value:", x));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Final Value: undefined
```
**Why:** The second `.then()` callback does not explicitly `return` a value, returning `undefined` implicitly. The third `.then()` receives that `undefined` value.
</details>

---

### Prediction Challenge 4: Error Recovery via `.catch()`
```js
Promise.reject(new Error("Initial Failure"))
  .catch((err) => {
    console.log("Recovered from:", err.message);
    return "FALLBACK_VALUE"; // Returning normal value from .catch()
  })
  .then((val) => {
    console.log("Chained Value after Catch:", val);
  });
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Recovered from: Initial Failure
Chained Value after Catch: FALLBACK_VALUE
```
**Why:** Returning a non-rejected value from a `.catch()` handler fulfills the returned Promise, allowing subsequent `.then()` callbacks to execute normally.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What are the three states of a JavaScript Promise?  
<details>
<summary><strong>Answer</strong></summary>
1. **Pending:** The asynchronous operation is currently ongoing.  
2. **Fulfilled:** The operation completed successfully, and a resolved value is available.  
3. **Rejected:** The operation failed, and an error/rejection reason is available.
</details>

**Q2:** What is "Callback Hell" and how do Promises solve it?  
<details>
<summary><strong>Answer</strong></summary>
Callback Hell (or the Pyramid of Doom) refers to deeply nested callback functions resulting from dependent asynchronous operations. Promises solve this by flattening nested callbacks into linear `.then()` chains where each step returns a new Promise and errors can be caught at the end with a single `.catch()`.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** Does the function passed into `new Promise((resolve, reject) => {})` run synchronously or asynchronously?  
<details>
<summary><strong>Answer</strong></summary>
The executor function runs **synchronously** immediately upon constructor invocation on the current Call Stack. Only the reaction callbacks registered via `.then()`, `.catch()`, or `.finally()` are scheduled asynchronously in the Microtask Queue.
</details>

**Q4:** What is the difference between `.catch(fn)` and passing a second callback to `.then(onFulfilled, onRejected)`?  
<details>
<summary><strong>Answer</strong></summary>
- `.then(onFulfilled, onRejected)`: `onRejected` only catches errors thrown in the *preceding* Promise, but **cannot** catch errors thrown inside the adjacent `onFulfilled` handler in the same statement.  
- `.catch(fn)`: Placed downstream in the chain, it catches rejections from the preceding Promise *as well as* errors thrown inside previous `.then()` handlers.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** What is the Promise Constructor Anti-Pattern, and why is it problematic in production?  
<details>
<summary><strong>Answer</strong></summary>
The Promise Constructor Anti-Pattern occurs when a developer wraps an already Promisified API (like `fetch()`) inside `new Promise((resolve, reject) => { fetch().then(resolve).catch(reject); })`.  
**Problems:**  
1. Unnecessary object allocation in memory.  
2. Redundant indirection.  
3. High risk of forgetting error forwarding or swallowing uncaught exceptions.  
**Fix:** Return the inner Promise directly (`return fetch('/api')`).
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How does the ECMAScript specification define the Promise Resolution Procedure when a Promise is resolved with another Promise (Thenable unwrapping)?  
<details>
<summary><strong>Answer</strong></summary>
When `resolve(x)` is called:  
1. **Self-Resolution Check:** If `x === promise`, reject with a `TypeError` (prevents circular promise deadlock).  
2. **If `x` is a Promise:** The outer Promise adopts the state of `x`. It queues a microtask job to subscribe to `x.then()`, remaining in the `Pending` state until `x` settles.  
3. **If `x` is an Object/Function with a `.then` property (Thenable):** The engine retrieves `x.then` and invokes `then.call(x, resolvePromise, rejectPromise)`. It protects against multiple invocations using an internal `called` boolean flag.  
4. **If `x` is a non-thenable primitive or object:** The Promise fulfills immediately with `x` as its value.
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Promise Lifecycle Pipeline

```js
// See runnable implementation in examples/02-callbacks-promises-then-catch-finally.js
```

---

## Key Takeaways
1. **Promises Settle Exactly Once:** Immutable resolution prevents race conditions.
2. **Promise Executors Run Synchronously:** Only reactions are asynchronous microtasks.
3. **Always Return in `.then()`:** Prevents `undefined` values from breaking downstream chains.
4. **`.finally()` Cleans Up State:** Executes regardless of fulfillment or rejection.
5. **Avoid the Constructor Anti-Pattern:** Return native Promises directly without redundant wrappers.

---

[⬅️ Part 01: The JavaScript Runtime, Call Stack, Web APIs & Event Loop](./01-runtime-call-stack-web-apis-event-loop.md) | [📚 KPI 22 Index](./README.md) | [Part 03: Promise Chaining & Promise Combinators ➡️](./03-promise-chaining-combinators-concurrency.md)
