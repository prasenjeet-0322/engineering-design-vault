# KPI 12 — Part 04: Promise Creation, Static Methods, Thenables & Constructor Anti-Patterns

[⬅️ Part 03: `.catch()`, `finally()` & Error Recovery](./03-promise-error-handling-catch-finally.md) | [📚 KPI 12 Index](./README.md) | [Part 05: Promise Combinators & Concurrency Coordination ➡️](./05-promise-combinators-concurrency.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Creation Mechanism | Architectural Purpose | Execution Timing | Senior Production Standard |
|---|---|---|---|
| **`Promise.resolve(x)`** | Lifts values, thenables, or existing Promises into a standardized Promise. | Next microtask (or returns identical Promise if already native). | 🟢 Use to normalize polymorphic sync/async API return values. |
| **`Promise.reject(err)`** | Creates an immediately rejected Promise with a given error reason. | Next microtask rejection. | 🟢 Always pass an `Error` instance carrying stack traces, never bare strings. |
| **`new Promise(executor)`** | Bridges non-Promise asynchronous callback/event APIs into Promises. | **Synchronous on Call Stack!** | 🟢 Use ONLY when adapting callback or event-based legacy APIs. |
| **The Re-wrapping Anti-Pattern** | `new Promise((res, rej) => fetch().then(res).catch(rej))`. | Redundant allocation. | 🔴 **Anti-Pattern**: Simply `return fetch()` directly! |
| **The `async` Executor Trap** | `new Promise(async (resolve, reject) => { throw Error(); })`. | Leaked rejected Promise. | 🔴 **Anti-Pattern**: Rejections in async executors leave the outer Promise hanging in `PENDING` forever! |
| **Thenable Assimilation** | Any object with a `.then(resolve, reject)` method. | Duck-typed unwrapping. | 🔵 Native Promises automatically assimilate and flatten thenable objects. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: The `async` Executor Trap & The Re-wrapping Anti-Pattern
> 
> #### Gotcha A: The Dangerous `new Promise(async (resolve, reject) => ...)` Trap
> *"Why did our background data sync worker hang forever in `PENDING` without ever resolving or triggering `.catch()`?"*  
> ```js
> // ❌ FATAL ASYNC EXECUTOR ANTI-PATTERN:
> const syncWorker = new Promise(async (resolve, reject) => {
>   const auth = await authenticateUser();
>   // 💥 If parseConfig() throws, the async executor rejects its own internal hidden Promise!
>   // The outer `syncWorker` Promise NEVER rejects and remains PENDING forever!
>   const config = parseConfig(auth.token);
>   resolve(config);
> });
> 
> syncWorker.catch((err) => {
>   // This catch block NEVER runs!
>   console.error("Caught worker error:", err);
> });
> ```
> **Deep Architectural Explanation:**  
> The `Promise` constructor expects a synchronous executor. When passed an `async` function, the constructor executes it and receives an internal Promise created by the `async` keyword. If an exception occurs inside the async executor, the internal Promise rejects, triggering an `unhandledrejection` event, but the outer `syncWorker` Promise is left hanging in `PENDING` indefinitely because `reject()` was never called on the outer handle.  
> **The Senior Standard:** Never pass `async` functions to `new Promise()`. Write a standard `async function syncWorker()` instead.
> 
> ---
> 
> #### Gotcha B: The Promise Constructor Re-wrapping Anti-Pattern
> *"Why is `new Promise((resolve, reject) => fetch(url).then(resolve).catch(reject))` considered bad code in code reviews?"*  
> 1. **Redundant Allocation:** `fetch()` already returns a native Promise; wrapping it creates a useless second Promise and extra closure allocations.  
> 2. **Swallowed Errors:** If developers write `.then(res => res.json().then(resolve))` without `.catch()`, JSON parsing errors are permanently swallowed.  
> 3. **The Senior Standard:** Simply `return fetch(url).then(res => res.json())`.

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / TypeScript Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | `Promise.resolve()`, `Promise.reject()`, promisifying `setTimeout`, WebSockets, IndexedDB | Essential for writing clean, idiomatically sound asynchronous utility functions and custom hooks. |
| 🟡 **Moderate** | Used in ~45% of code | Promisifying Node.js callback APIs (`util.promisify`), wrapping DOM events with `{ once: true }` | Critical when bridging legacy SDKs, event listeners, and browser streaming interfaces. |
| 🔵 **Foundational / Engine** | Runtime internals | ECMAScript `ResolvePromise(p, x)` specification, Thenable duck-typing, Microtask scheduling | Essential for building framework libraries, custom build plugins, and Staff/Principal architecture reviews. |

---

## Core Concepts (20 Subtopics)

### Part 1 — The 3 Primary Sources of Promises `🟢 [Daily Driver]`

1. **Native Async APIs:** Built-in platform methods (`fetch()`, `crypto.subtle.digest()`, dynamic `import()`).
2. **Static Factory Methods:** `Promise.resolve(val)`, `Promise.reject(err)`.
3. **Manual Constructor:** `new Promise(executor)` for legacy callback/event adaptation.

---

### Part 2 — `Promise.resolve(x)`: Lifting Primitives & Normalizing Values `🟢 [Daily Driver]`

`Promise.resolve(x)` converts any synchronous value into a fulfilled Promise:
```js
const p = Promise.resolve(42); // Promise<number> fulfilled with 42
```

---

### Part 3 — Value Normalization: Polymorphic Sync/Async API Contracts `🟢 [Daily Driver]`

When designing functions that may return cached data synchronously or perform network fetching asynchronously, wrap returns in `Promise.resolve()` to ensure callers always receive a consistent Promise:
```js
function getUser(id) {
  if (cache.has(id)) return Promise.resolve(cache.get(id)); // 🟢 Normalized
  return fetchUserFromNetwork(id);
}
```

---

### Part 4 — `Promise.resolve()` with Existing Promises: Identity Preservation `🔵 [Foundational / Engine]`

If `p` is already a native ECMAScript Promise, `Promise.resolve(p)` returns `p` itself (preserving exact object identity `===`), avoiding redundant object allocations.

---

### Part 5 — `Promise.reject(reason)`: Explicit Failure Token Instantiation `🟢 [Daily Driver]`

Creates an immediately rejected Promise. Always supply an `Error` instance:
```js
function validateAge(age) {
  if (age < 0) return Promise.reject(new RangeError("Age cannot be negative"));
  return Promise.resolve(age);
}
```

---

### Part 6 — Rejection Reasons: `Error` Instances vs Primitives `🟢 [Daily Driver]`

| Rejection Payload | Stack Trace Available? | Error Name / Class Type? | Production Suitability |
|---|---|---|---|
| `new Error("msg")` | ✅ **YES** (Full call trace) | ✅ `Error`, `TypeError`, `CustomError` | 🟢 **Standard** |
| `"Network Failed"` | ❌ **NO** | ❌ Primitive `string` | 🔴 **Anti-Pattern** |
| `404` | ❌ **NO** | ❌ Primitive `number` | 🔴 **Anti-Pattern** |

---

### Part 7 — `Promise.reject(err)` vs `throw err` within Promise Chains `🟢 [Daily Driver]`

- **Inside `.then()` / `.catch()` handler:** Use `throw err` (cleaner and idiomatic).
- **Inside synchronous helper returning a Promise:** Use `return Promise.reject(err)`.

---

### Part 8 — Anatomy of `new Promise(executor)` `🟢 [Daily Driver]`

```js
const promise = new Promise(function executor(resolve, reject) {
  // Synchronous setup...
  setTimeout(() => resolve("Success"), 100);
});
```

---

### Part 9 — The Eager Execution Invariant `🔴 [Production-Critical]`

Promises are **eager**, not lazy. The moment `new Promise()` is evaluated, the executor runs immediately on the Call Stack. It does not wait for a `.then()` subscription.

---

### Part 10 — `return` inside Executors: The Ignored Return Value Trap `🔴 [Production-Critical]`

```js
const p = new Promise((resolve) => {
  return "Hello"; // 💥 Ignored by engine! Promise remains PENDING forever!
});
```
The return value of an executor is completely discarded. You must explicitly invoke `resolve(val)` or `reject(err)`.

---

### Part 11 — Automatic Rejection on Executor Exceptions `🟢 [Daily Driver]`

If synchronous code inside an executor throws an error, the constructor captures it and calls `reject(thrownError)` automatically.

---

### Part 12 — The Re-wrapping Anti-Pattern `🔴 [Production-Critical]`

```text
❌ BAD:  new Promise((res, rej) => api().then(res).catch(rej))
✅ GOOD: api()
```

---

### Part 13 — The Dangerous `new Promise(async ...)` Anti-Pattern `🔴 [Production-Critical]`

Async executor functions return a Promise that is ignored by the constructor. Thrown exceptions inside async executors do not reject the outer Promise, resulting in hung promises.

---

### Part 14 — Valid Use Case 1: Adapting Host Callback APIs `🟢 [Daily Driver]`

```js
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

---

### Part 15 — Valid Use Case 2: Promisifying DOM Events `🟢 [Daily Driver]`

```js
export function waitForDOMEvent<K extends keyof HTMLElementEventMap>(
  element: HTMLElement,
  type: K
): Promise<HTMLElementEventMap[K]> {
  return new Promise((resolve) => {
    element.addEventListener(type, resolve as EventListener, { once: true });
  });
}
```

---

### Part 16 — Promisification Mechanics `🟢 [Daily Driver]`

Higher-order adapter that converts Node.js error-first `(err, data) => void` callbacks into Promises:
```js
function promisify(fn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, data) => (err ? reject(err) : resolve(data)));
    });
  };
}
```

---

### Part 17 — Thenables: Duck-Typed Interoperability `🔵 [Foundational / Engine]`

Any object implementing a callable `.then(resolve, reject)` method is treated as a Thenable:
```js
const thenable = {
  then(resolve) { resolve("Interoperable Data"); }
};
Promise.resolve(thenable).then(console.log); // "Interoperable Data"
```

---

### Part 18 — The ECMAScript Promise Resolution Procedure `🔵 [Foundational / Engine]`

When `resolve(x)` is executed:
1. If `x === promise`, throw `TypeError` (Cycle detection).
2. If `x` is a native Promise, adopt its state directly.
3. If `x` is an Object/Function with a `.then` property, invoke `then.call(x, resolvePromise, rejectPromise)`.
4. Otherwise, fulfill `promise` with `x`.

---

### Part 19 — Resolving vs. Fulfilling: How `resolve(innerPromise)` Adopts State `🔵 [Foundational / Engine]`

`resolve(innerPromise)` resolves the outer Promise *with* the inner Promise, but the outer Promise remains in `PENDING` until the inner Promise settles!

---

### Part 20 — 10-Point Promise Creation Audit Checklist `🟢 [Daily Driver]`

```text
1. Are existing Promise APIs returned directly without wrapping in new Promise()?
2. Is new Promise(async () => {}) strictly banned across the codebase?
3. Are all rejection reasons passed as Error instances (with stack traces)?
4. Is Promise.resolve() used to normalize synchronous and cached values?
5. Do Promise-wrapped event listeners include { once: true } or explicit cleanup?
6. Are executor return values avoided in favor of explicit resolve() calls?
7. Is util.promisify used when converting Node.js callback modules?
8. Are thenables tested for proper multi-settlement guard protection?
9. Do you understand that Promises execute eagerly on instantiation?
10. Is resolve(innerPromise) understood as state adoption rather than immediate fulfillment?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Mechanism | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **`Promise.resolve(val)`** | Normalizing synchronous values or lifting static constants into a Promise pipeline. | Wrapping code that might throw synchronous exceptions. | Immediate allocation; does not defer computation. | `Promise.reject()`. |
| **`new Promise(executor)`** | Bridging callback APIs (`setTimeout`, IndexedDB, geolocation, WebSockets) into Promises. | Wrapping functions that already return Promises (`fetch`, `axios`). | Higher memory overhead; risks memory leaks if never resolved. | Direct Promise return. |
| **Direct `async` Function** | Standard day-to-day enterprise asynchronous application code. | Simple utility wrappers where `Promise.resolve` is more concise. | Async functions always wrap returns in Promises. | Arrow functions returning Promises. |
| **`util.promisify` Adapter** | Bulk converting legacy Node.js core libraries (`fs`, `child_process`, `crypto`). | Modern ES module APIs that already export `/promises`. | Only supports strict `(err, data)` error-first signatures. | Native `fs/promises`. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Event Promisifier & Legacy Bridge Hook in TypeScript
```tsx
import React, { useState, useCallback, useRef } from 'react';

// ==========================================
// 1. GENERIC PROMISE BRIDGE UTILITIES
// ==========================================

/**
 * Promisifies an HTMLMediaElement playback readiness event with timeout guard.
 */
export function waitForMediaPlayable(media: HTMLMediaElement, timeoutMs = 5000): Promise<void> {
  // 🟢 Legitimate use of new Promise(): Adapting DOM Event into Promise
  return new Promise((resolve, reject) => {
    if (media.readyState >= 3) {
      // Already playable (HAVE_FUTURE_DATA)
      return resolve();
    }

    let timeoutId: number;

    const onCanPlay = () => {
      clearTimeout(timeoutId);
      cleanup();
      resolve();
    };

    const onError = () => {
      clearTimeout(timeoutId);
      cleanup();
      reject(new Error(`Media loading failed with code: ${media.error?.code}`));
    };

    const cleanup = () => {
      media.removeEventListener('canplay', onCanPlay);
      media.removeEventListener('error', onError);
    };

    media.addEventListener('canplay', onCanPlay, { once: true });
    media.addEventListener('error', onError, { once: true });

    timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Media loading timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
}

// ==========================================
// 2. REACT MEDIA LOADER COMPONENT
// ==========================================
export function EnterpriseMediaBridgePlayer() {
  const [loadStatus, setLoadStatus] = useState<'IDLE' | 'LOADING' | 'READY' | 'ERROR'>('IDLE');
  const [statusMessage, setStatusMessage] = useState('Click to load and bridge audio element');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleLoadAndPlay = useCallback(async () => {
    if (!audioRef.current) return;
    setLoadStatus('LOADING');
    setStatusMessage('Bridging DOM events to Promise...');

    const audio = audioRef.current;
    audio.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    audio.load();

    try {
      // 🟢 Uses Promisified Event Bridge
      await waitForMediaPlayable(audio, 4000);
      setLoadStatus('READY');
      setStatusMessage('Media Ready! Starting playback...');
      await audio.play();
    } catch (err: any) {
      setLoadStatus('ERROR');
      setStatusMessage(`Bridge Failed: ${err.message}`);
    }
  }, []);

  return (
    <div className="media-bridge-card">
      <h3>Enterprise DOM Event-to-Promise Bridge</h3>
      <p>Adapts legacy HTML5 Audio DOM events into a clean async/await Promise contract.</p>

      <audio ref={audioRef} preload="none" />

      <p>Status: <strong><code>{loadStatus}</code></strong></p>
      <p><em>{statusMessage}</em></p>

      <button onClick={handleLoadAndPlay} disabled={loadStatus === 'LOADING'} className="primary-button">
        {loadStatus === 'LOADING' ? 'Bridging...' : 'Load & Play Audio'}
      </button>
    </div>
  );
}
```

---

## 🧠 Part 04 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: The Ignored Executor `return`
```js
const p = new Promise((resolve) => {
  return "Direct Return"; // 💥 Ignored!
});

p.then((val) => {
  console.log("Value:", val);
});

console.log("State check completed");
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
State check completed
(No further output; `.then()` never executes!)
```
**Why:** The `return "Direct Return"` statement inside the executor is ignored by the `Promise` constructor. Because `resolve()` was never invoked, the Promise remains in `PENDING` indefinitely.
</details>

---

### Prediction Challenge 2: `Promise.resolve()` with Existing Promise
```js
const original = Promise.resolve("Data 1");
const wrapped = Promise.resolve(original);

console.log("Identity Match:", original === wrapped);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Identity Match: true
```
**Why:** When passed an existing native Promise, `Promise.resolve()` returns the exact same Promise instance without creating a new wrapper object.
</details>

---

### Prediction Challenge 3: Synchronous Error in Executor
```js
const p = new Promise((resolve, reject) => {
  JSON.parse("INVALID_JSON_SYNTAX");
  resolve("Success");
});

p.catch((err) => {
  console.log("Caught Error Name:", err.name);
});
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Caught Error Name: SyntaxError
```
**Why:** The `Promise` constructor wraps the executor in an implicit `try/catch`. When `JSON.parse` throws a `SyntaxError`, the constructor catches it and transitions the Promise to `REJECTED`.
</details>

---

### Prediction Challenge 4: Thenable Assimilation Procedure
```js
const customThenable = {
  then(resolve, reject) {
    resolve("Unwrapped Thenable String");
  }
};

Promise.resolve(customThenable).then((res) => {
  console.log("Result:", res);
});
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Result: Unwrapped Thenable String
```
**Why:** Under the ECMAScript Promise Resolution Procedure, `Promise.resolve()` detects the `.then()` method on `customThenable` and assimilates it, resolving with `"Unwrapped Thenable String"`.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What does `Promise.resolve(value)` do when passed a primitive value vs an existing Promise?  
<details>
<summary><strong>Answer</strong></summary>
- **Primitive Value (e.g. `42`):** Wraps and returns a new Promise fulfilled with `42`.  
- **Existing Native Promise:** Returns the exact same Promise instance directly without re-wrapping, preserving object identity (`p === Promise.resolve(p)`).
</details>

**Q2:** Why should you always pass an `Error` object to `Promise.reject()` instead of a string?  
<details>
<summary><strong>Answer</strong></summary>
`Error` instances capture a snapshot of the **Call Stack** (`error.stack`) at the exact point of instantiation, providing crucial line numbers and file traces for debugging. Rejecting with a string (`Promise.reject("Error")`) destroys stack trace visibility in production monitoring tools (Sentry, Datadog).
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** What is the "Promise Constructor Anti-Pattern" and why is it harmful?  
<details>
<summary><strong>Answer</strong></summary>
The Promise Constructor Anti-Pattern occurs when an engineer manually wraps an already-promisified API inside `new Promise()`:
```js
// ❌ Anti-pattern:
function getUser() {
  return new Promise((resolve, reject) => {
    fetch('/api/user').then(resolve).catch(reject);
  });
}
```
It is harmful because it adds redundant code, creates extra Promise allocations in the V8 heap, and easily introduces bugs where errors are swallowed if inner chained promises fail.
</details>

**Q4:** What is a "Thenable" in JavaScript and how do Promises interact with it?  
<details>
<summary><strong>Answer</strong></summary>
A Thenable is any JavaScript object or function that defines a `.then(onFulfilled, onRejected)` method. Native Promises interact with Thenables via **Thenable Assimilation**: when a Thenable is passed to `Promise.resolve()` or returned from a `.then()` handler, the native Promise engine automatically executes its `.then()` method and adopts its eventual settlement state.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** Why is passing an `async` function as the executor to `new Promise(async (resolve, reject) => ...)` dangerous?  
<details>
<summary><strong>Answer</strong></summary>
`async` functions implicitly return a Promise. When passed to `new Promise()`, the constructor executes the async function but **ignores the Promise it returns**. If an unhandled exception or rejection occurs inside the `async` executor, that error rejects the hidden inner Promise, triggering an `unhandledrejection` warning. The outer `new Promise()` instance never receives the error, remaining stuck in `PENDING` forever and leaking memory.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** Explain the ECMAScript specification algorithm for `ResolvePromise(promise, x)` when `x` is a Thenable with a malicious or throwing getter on `.then`.  
<details>
<summary><strong>Answer</strong></summary>
Under ECMAScript §27.2.1.3.2 (`PromiseResolveThenableJob`):
1. **Property Access Guard:** To prevent race conditions from mutating getters, the engine retrieves `x.then` **exactly once** into a local reference: `let then = x.then`. If accessing `x.then` throws an exception `e`, the engine immediately calls `reject(e)`.  
2. **Callable Verification:** If `typeof then === 'function'`, the engine queues a microtask job to execute `then.call(x, resolvePromise, rejectPromise)`.  
3. **Single Settlement Flag:** The engine wraps `resolvePromise` and `rejectPromise` with an internal boolean flag (`hasBeenCalled`) to ensure that if a non-conformant thenable calls `resolve` or `reject` multiple times, only the first call is honored and subsequent calls are silently ignored.
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Promisifier & Thenable Assimilator

```js
// See runnable implementation in examples/04-promise-creation-static-methods.js
```

---

## Key Takeaways
1. **Do Not Re-wrap Promises:** If an API returns a Promise, return it directly.
2. **Never Use `async` Executors:** `new Promise(async () => {})` causes permanent hangs.
3. **Always Reject with `Error` Objects:** Preserve call stacks and debugging metadata.
4. **Executor Returns Are Discarded:** Always call `resolve()` or `reject()` explicitly.
5. **Thenable Assimilation:** Native Promises automatically unwrap duck-typed `.then()` objects.

---

[⬅️ Part 03: `.catch()`, `finally()` & Error Recovery](./03-promise-error-handling-catch-finally.md) | [📚 KPI 12 Index](./README.md) | [Part 05: Promise Combinators & Concurrency Coordination ➡️](./05-promise-combinators-concurrency.md)
