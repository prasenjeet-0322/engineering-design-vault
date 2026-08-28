# KPI 25 — Part 04: Async Errors, Promise Rejections & `async/await`

[⬅️ Part 03: Error Propagation & Custom Errors](./03-error-propagation-custom-errors.md) | [📚 KPI 25 Index](./README.md) | [Part 05: API Failure Handling & Retry Strategies ➡️](./05-api-failure-handling-retry-strategies.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Async Error Concept | Underlying Mechanism | Failure Mode & Risk | Senior Engineering Standard |
|---|---|---|---|
| **Promise Rejection vs Sync Throw** | Rejections occur in the **Microtask Queue**, not in the synchronous call stack. | Wrapping a synchronous `try/catch` around an un-awaited Promise fails to catch the rejection. | 🟢 Always `await` Promises inside `try/catch`, or chain `.catch()`. |
| **`return await p` in `try/catch`** | `return await p` suspends execution inside the `try` block to catch rejections locally. | `return p` exits the `try` block immediately, allowing rejections to bypass the local `catch`. | 🔴 **CRITICAL:** Always write `return await promise;` when inside a `try/catch` block. |
| **The Missing `await` False Success** | Calling `saveUser()` without `await` immediately executes subsequent success logic. | UI displays "Saved!" while the un-awaited background request crashes with an error. | 🔴 **CRITICAL:** Never trigger side effects after an un-awaited asynchronous function. |
| **`Promise.all` Fail-Fast** | Rejects the microsecond the *first* Promise rejects. | Does NOT cancel running sibling Promises (they continue consuming network/CPU). | 🟢 Pair with `AbortController` to cancel sibling network requests when one fails. |
| **`Promise.allSettled`** | Resolves only after *all* Promises settle (`fulfilled` or `rejected`). | Fails to reject automatically if all operations are required. | 🟢 Use for dashboards with independent widgets where partial success is acceptable. |
| **Unhandled Rejections** | Rejections with no active `.catch()` or `await` error handler. | Crashes Node.js runtimes and triggers silent failure telemetry spikes in browsers. | 🟢 Implement global `window.onunhandledrejection` monitoring in production. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: `return await` Bypasses & Missing `await` Traps
> 
> #### Gotcha A: `return promise` vs `return await promise` Inside `try/catch`
> *"Why did our local try/catch block completely ignore a 500 error and let the app crash?"*  
> ```js
> // ❌ DISASTROUS RETURN WITHOUT AWAIT IN TRY/CATCH:
> async function loadUserProfile(userId) {
>   try {
>     // 💥 FATAL MISTAKE: Returning the raw Promise directly!
>     // 1. fetchUser(userId) returns a pending Promise.
>     // 2. loadUserProfile() immediately RETURNS the Promise and EXITS the try block.
>     // 3. 200ms later, the Promise REJECTS with an HTTP 500 error.
>     // 4. The local catch block is ALREADY GONE! The error bubbles to the caller!
>     return fetchUser(userId);
>   } catch (err) {
>     console.error("Local fallback executed:", err.message);
>     return { id: userId, name: "Guest User" }; // NEVER REACHED!
>   }
> }
> ```
> **Deep Architectural Explanation:**  
> When you write `return fetchUser(userId);` without `await`, the function immediately resolves its own outer Promise with the inner pending Promise and unwinds its execution context. Control exits the `try` block synchronously. When the inner Promise rejects in a future microtask turn, there is no active `try/catch` frame protecting it; the rejection bypasses the local `catch` block entirely.  
> **The Senior Standard:** Always use `return await` when returning a Promise from inside a `try/catch` block so the engine pauses execution *inside* the `try` scope:
> ```js
> // ✅ CORRECT: AWAIT SUSPENDS INSIDE TRY BLOCK:
> async function loadUserProfileSafe(userId) {
>   try {
>     // 🟢 Pauses execution INSIDE the try block. If it rejects, catch intercepts it locally!
>     return await fetchUser(userId);
>   } catch (err) {
>     console.warn("Local fallback activated:", err.message);
>     return { id: userId, name: "Guest User" }; // 🟢 Successfully handled!
>   }
> }
> ```
> 
> ---
> 
> #### Gotcha B: The "Floating Promise" Missing `await` False Success Trap
> *"Why did our payment checkout show 'Order Confirmed' even though the credit card transaction failed?"*  
> ```js
> // ❌ THE FLOATING PROMISE FALSE SUCCESS BUG:
> async function handleCheckout(cart) {
>   try {
>     // 💥 FATAL BUG: Forgot the `await` keyword!
>     processPaymentApi(cart); // Returns a Promise, but JavaScript continues synchronously!
>     
>     // 💥 Executes IMMEDIATELY on the current tick:
>     showSuccessModal("Order Confirmed! Your items are on the way.");
>   } catch (err) {
>     showErrorMessage("Payment Failed."); // NEVER TRIGGERED ON REJECTION!
>   }
> }
> ```
> **Deep Architectural Explanation:**  
> In JavaScript, invoking an `async` function without `await` launches a "floating Promise". The synchronous caller continues execution without pausing. In the snippet above, `showSuccessModal()` executes immediately while `processPaymentApi` is still communicating with Stripe. When Stripe rejects 800ms later with `INSUFFICIENT_FUNDS`, the user is already looking at a false "Order Confirmed" screen, and an `UnhandledPromiseRejection` is logged to the console.  
> **The Senior Standard:** Enable the ESLint rule `@typescript-eslint/no-floating-promises` and strictly `await` all asynchronous side effects:
> ```js
> // ✅ PROPERLY AWAITED PIPELINE:
> async function handleCheckoutSafe(cart) {
>   try {
>     const receipt = await processPaymentApi(cart); // 🟢 Pauses until payment settles!
>     showSuccessModal(`Order #${receipt.id} Confirmed!`);
>   } catch (err) {
>     showErrorMessage(`Payment Failed: ${err.message}`); // 🟢 Properly catches card decline!
>   }
> }
> ```

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / Next.js / Vite Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | `async/await` with `try/catch/finally`, `return await` in data hooks, `Promise.all` vs `Promise.allSettled` | Universal foundation for data fetching, API mutations, form submissions, and authentication. |
| 🟡 **Moderate** | Used in ~45% of code | `window.onunhandledrejection` monitoring, Promise timeout race vs `AbortController` cancellation | Critical for production telemetry, Sentry APM tracking, and building robust offline-first SPAs. |
| 🔵 **Foundational / Engine** | Runtime internals | Microtask queue rejection mechanics, Promise reaction jobs, V8 unhandled rejection tracking | Mandatory for Staff/Principal architecture reviews, framework internals, and asynchronous pipelines. |

---

## Core Concepts (20 Subtopics)

### Part 1 — Call Stack Exceptions vs Promise Rejections `🟢 [Daily Driver]`

Synchronous exceptions unwind the active call stack immediately; Promise rejections resolve asynchronously in the **Microtask Queue**.

---

### Part 2 — Anatomy of Promise Rejection: The 3 States `🟢 [Daily Driver]`

A Promise transitions from `Pending` $\to$ `Fulfilled` (with value) OR `Pending` $\to$ `Rejected` (with reason). State transitions are immutable.

---

### Part 3 — Why Synchronous `try/catch` Cannot Catch Detached Promises `🟢 [Daily Driver]`

A synchronous `try/catch` finishes executing before the microtask containing the Promise rejection runs.

---

### Part 4 — Handling Rejections via `.catch()` Chains `🟢 [Daily Driver]`

```js
fetchUser()
  .then(user => render(user))
  .catch(err => handleError(err));
```

---

### Part 5 — How `await` Translates Rejections into Catchable Control Flow `🟢 [Daily Driver]`

The `await` keyword halts execution of the `async` generator function until the Promise settles; if rejected, it throws the rejection value into the enclosing `try/catch`.

---

### Part 6 — Rule: `async` Functions Always Return Promises `🟢 [Daily Driver]`

Writing `return "data"` in an `async` function wraps the value in `Promise.resolve("data")`.

---

### Part 7 — Throwing Inside an `async` Function `🔵 [Foundational / Engine]`

Executing `throw new Error()` inside an `async` function converts the exception into a rejected Promise (`Promise.reject(err)`).

---

### Part 8 — `return promise` vs `return await promise` in `try/catch` `🔴 [Production-Critical]`

`return await p` ensures any rejection from `p` is caught by the surrounding `catch` block; `return p` causes the rejection to escape.

---

### Part 9 — Multi-Step Promise Chains & Linear Error Bubbling `🟢 [Daily Driver]`

A single `.catch()` at the end of a chain catches rejections from any preceding `.then()` step.

---

### Part 10 — Errors Thrown Inside `.then()` Callbacks `🟢 [Daily Driver]`

Exceptions thrown inside `.then(data => { throw new Error(); })` automatically reject the downstream Promise.

---

### Part 11 — The Catastrophic "Missing `await`" False Success Bug `🔴 [Production-Critical]`

Forgetting `await` causes code following the async call to execute immediately before the operation completes.

---

### Part 12 — Sequential Async Workflows with Single Error Boundaries `🟢 [Daily Driver]`

```js
try {
  const user = await fetchUser();
  const perms = await fetchPerms(user.id);
  const dashboard = await fetchDashboard(perms);
} catch (err) {
  handleInitError(err);
}
```

---

### Part 13 — Parallel Execution: `Promise.all` Fail-Fast Semantics `🟢 [Daily Driver]`

`Promise.all([p1, p2, p3])` rejects immediately when the *first* Promise rejects, discarding subsequent successful results.

---

### Part 14 — The Fail-Fast Leak: Running Siblings Are NOT Cancelled `🔴 [Production-Critical]`

When `Promise.all` rejects, other pending Promises continue running in the background unless explicitly aborted via `AbortController`.

---

### Part 15 — Partial Failure Resilience: `Promise.allSettled` `🟢 [Daily Driver]`

Returns an array of `{ status: "fulfilled", value }` and `{ status: "rejected", reason }`, allowing independent UI sections to render.

---

### Part 16 — `Promise.all` vs `Promise.allSettled` Decision Framework `🟢 [Daily Driver]`

- Use `Promise.all` when all operations are strictly interdependent (e.g. checkout transaction).
- Use `Promise.allSettled` when operations are independent (e.g. dashboard analytics widgets).

---

### Part 17 — `Promise.race` Timeouts vs `AbortController` Active Cancellation `🟢 [Daily Driver]`

`Promise.race` determines which Promise finishes first, but does **not** cancel the losing request. Use `AbortController.abort()` to terminate pending network buffers.

---

### Part 18 — Global Unhandled Rejection Tracking `🟢 [Daily Driver]`

```js
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled Rejection:", event.reason);
  telemetry.captureException(event.reason);
});
```

---

### Part 19 — The Promise `.catch()` Swallowing Trap `🔴 [Production-Critical]`

If `.catch()` returns a normal value without re-throwing, subsequent `.then()` blocks in the chain will execute as if nothing failed.

---

### Part 20 — The 10-Point Senior Asynchronous Reliability Checklist `🟢 [Daily Driver]`

```text
1. Are floating promises eliminated? ──► 2. Is return await used inside try/catch?
3. Is Promise.allSettled used for independent widgets? ──► 4. Are sibling requests aborted on failure?
5. Is window.onunhandledrejection monitored? ──► 6. Are catch blocks re-throwing unhandled errors?
7. Are async loading flags reset in finally? ──► 8. Are timeout races paired with AbortController?
9. Is ESLint no-floating-promises enabled? ──► 10. Does UI reflect partial success accurately?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Async Handling Paradigm | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **`async/await` with `try/catch`** | Linear multi-step async workflows, data fetching in components, mutation pipelines. | Simple single-expression callbacks where `.then()` is more concise. | Requires wrapping in an `async` function context. | Promise chaining. |
| **`Promise.all` (Fail-Fast)** | Batching strictly interdependent operations (e.g. database schema migrations). | Loading independent dashboard widgets where partial rendering is desired. | Abandons all results if a single minor operation fails. | `Promise.allSettled`. |
| **`Promise.allSettled` (Resilient)** | Multi-widget dashboards, bulk email dispatchers, telemetry batching. | Atomic all-or-nothing transactions (e.g. financial transfers). | Requires manual filtering of `fulfilled` vs `rejected` entries. | `Promise.all`. |
| **`Promise.race` + `AbortController`** | Enforcing strict SLA request timeouts with active network cancellation. | Operations that cannot be cancelled or where all results are needed. | `Promise.race` alone leaks running background promises without `AbortSignal`. | Native `fetch` with `{ signal }`. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Resilient Multi-Resource Async Loader in TypeScript
```tsx
import React, { useState, useCallback } from 'react';

// ==========================================
// 1. ASYNC RESOURCE CONTRACTS
// ==========================================
export interface ResourceResult<T> {
  name: string;
  status: 'SUCCESS' | 'ERROR';
  data?: T;
  errorMessage?: string;
}

export interface UserProfile { id: string; name: string }
export interface UserSettings { theme: 'DARK' | 'LIGHT'; notifications: boolean }
export interface UserAnalytics { views: number; clicks: number }

// ==========================================
// 2. RESILIENT ASYNC DASHBOARD
// ==========================================
export function EnterpriseAsyncReliabilityDashboard() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resources, setResources] = useState<ResourceResult<unknown>[]>([]);

  // 🟢 Resilient parallel data loading using Promise.allSettled with return await in try/catch
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setResources([]);

    try {
      // 🟢 1. Execute independent requests in parallel using Promise.allSettled
      const [profileSettled, settingsSettled, analyticsSettled] = await Promise.allSettled([
        fetchProfile(),
        fetchSettings(),
        fetchAnalytics() // Simulated failure!
      ]);

      // 🟢 2. Decompose settled results into structured UI states
      const parsedResults: ResourceResult<unknown>[] = [
        profileSettled.status === 'fulfilled'
          ? { name: 'User Profile', status: 'SUCCESS', data: profileSettled.value }
          : { name: 'User Profile', status: 'ERROR', errorMessage: profileSettled.reason?.message },

        settingsSettled.status === 'fulfilled'
          ? { name: 'User Settings', status: 'SUCCESS', data: settingsSettled.value }
          : { name: 'User Settings', status: 'ERROR', errorMessage: settingsSettled.reason?.message },

        analyticsSettled.status === 'fulfilled'
          ? { name: 'Analytics Telemetry', status: 'SUCCESS', data: analyticsSettled.value }
          : { name: 'Analytics Telemetry', status: 'ERROR', errorMessage: analyticsSettled.reason?.message }
      ];

      setResources(parsedResults);
    } catch (err: unknown) {
      // Top-level unexpected crash boundary
      console.error('Catastrophic failure in dashboard loader:', err);
    } finally {
      // 🟢 3. Guaranteed state reset
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="async-dashboard-card">
      <header className="card-header">
        <h3>Enterprise Async Reliability &amp; <code>allSettled</code> Engine</h3>
        <span className="badge">🛡️ Partial Failure Resilient</span>
      </header>

      <p className="architecture-description">
        Demonstrates resilient parallel data fetching with <code>Promise.allSettled</code>, eliminating single-point-of-failure crashes while rendering available data widgets.
      </p>

      <div className="controls-row">
        <button
          type="button"
          onClick={loadDashboardData}
          disabled={isLoading}
          className="btn-load"
        >
          {isLoading ? 'Fetching Resources...' : '⚡ Load Multi-Resource Dashboard'}
        </button>
      </div>

      <div className="resources-grid">
        {resources.map((res, idx) => (
          <div key={idx} className={`resource-card ${res.status.toLowerCase()}`}>
            <div className="resource-header">
              <span className="resource-name">{res.name}</span>
              <span className={`status-pill ${res.status.toLowerCase()}`}>
                {res.status === 'SUCCESS' ? '🟢 Ready' : '🔴 Failed'}
              </span>
            </div>
            <div className="resource-body">
              {res.status === 'SUCCESS' ? (
                <pre>{JSON.stringify(res.data, null, 2)}</pre>
              ) : (
                <div className="error-alert">
                  <span>⚠️ {res.errorMessage}</span>
                  <button type="button" className="retry-btn">Retry Widget</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Simulated API helpers
async function fetchProfile(): Promise<UserProfile> {
  return new Promise((resolve) => setTimeout(() => resolve({ id: 'usr_101', name: 'Sarah Connor' }), 300));
}

async function fetchSettings(): Promise<UserSettings> {
  return new Promise((resolve) => setTimeout(() => resolve({ theme: 'DARK', notifications: true }), 400));
}

async function fetchAnalytics(): Promise<UserAnalytics> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('Analytics microservice 503 unavailable')), 350));
}
```

---

## 🧠 Part 04 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: `try/catch` on Un-Awaited Async Function
```js
async function doTask() { throw new Error("Task Failed"); }
try {
  doTask();
  console.log("Success A");
} catch (err) {
  console.log("Caught B");
}
```
**Question:** What will output to the console?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:**  
1. `"Success A"` outputs immediately.  
2. An `UnhandledPromiseRejection` is logged to the runtime console.  
**Why:** `doTask()` is not awaited; it returns a pending/rejected Promise. The synchronous `try` block finishes before the Promise rejection is processed in the microtask queue.
</details>

---

### Prediction Challenge 2: `return promise` vs `return await promise`
```js
async function stepOne() {
  try {
    return Promise.reject(new Error("Step 1 Rejection"));
  } catch (e) {
    return "Handled Locally";
  }
}
async function stepTwo() {
  try {
    return await Promise.reject(new Error("Step 2 Rejection"));
  } catch (e) {
    return "Handled Locally";
  }
}
```
**Question:** What will `await stepOne()` and `await stepTwo()` return?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:**  
- `stepOne()`: **Rejects** with `"Step 1 Rejection"` (bypasses the local `catch` block!).  
- `stepTwo()`: **Resolves** with `"Handled Locally"` (paused inside `try`, caught by `catch`).
</details>

---

### Prediction Challenge 3: `Promise.all` Fail-Fast Execution
```js
const p1 = new Promise(res => setTimeout(() => res("P1 Success"), 500));
const p2 = Promise.reject(new Error("P2 Immediate Failure"));
try {
  await Promise.all([p1, p2]);
} catch (err) {
  console.log("Caught:", err.message);
}
```
**Question:** How many milliseconds before the catch block executes, and does `p1` stop executing?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:**  
- **$0\text{ms}$** (immediately on the next microtask tick because `p2` is already rejected).  
- **No, `p1` does not stop.** `p1`'s timer continues in the background until it completes at 500ms.
</details>

---

### Prediction Challenge 4: Promise `.catch()` Swallowing and Trailing `.then()`
```js
Promise.reject(new Error("API Timeout"))
  .catch((err) => {
    console.log("Caught Error");
    return "Default Fallback";
  })
  .then((data) => {
    console.log("Next Then:", data);
  });
```
**Question:** What is the console output order?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:**  
1. `"Caught Error"`  
2. `"Next Then: Default Fallback"`  
**Why:** The `.catch()` block returned a normal value (`"Default Fallback"`), resolving the Promise and allowing downstream `.then()` callbacks to execute.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is the difference between a synchronous throw and a Promise rejection?  
<details>
<summary><strong>Answer</strong></summary>
A synchronous `throw` immediately halts execution in the current call stack frame and unwinds to the nearest `try/catch`. A Promise rejection represents an asynchronous failure stored in a Promise object and evaluated in the **Microtask Queue**; it can only be intercepted via `.catch()` or `await` inside a `try/catch` block.
</details>

**Q2:** Why should you avoid un-awaited "Floating Promises" in JavaScript?  
<details>
<summary><strong>Answer</strong></summary>
When an `async` function is invoked without `await`, subsequent code executes immediately without waiting for the asynchronous operation to finish. If the operation fails, the error will bypass local error handlers, trigger `unhandledrejection` events, and cause false success UI state anomalies.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** When should you choose `Promise.allSettled` over `Promise.all`?  
<details>
<summary><strong>Answer</strong></summary>
- **`Promise.all`:** Ideal for atomic, interdependent operations where if one fails, all must fail (e.g. creating an order, updating inventory, processing payment).  
- **`Promise.allSettled`:** Ideal for composite dashboards or batch operations where operations are independent and partial success is desired (e.g. loading profile, notifications, and analytics widgets independently).
</details>

**Q4:** Why is `return await promise;` necessary inside a `try/catch` block?  
<details>
<summary><strong>Answer</strong></summary>
Inside a `try/catch` block, writing `return promise;` returns the pending Promise immediately and exits the `try` block before the Promise settles, causing any future rejection to bypass the local `catch`. Writing `return await promise;` pauses execution inside the `try` block until the Promise resolves or rejects, ensuring rejections are caught locally.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** How do you prevent resource leaks when using `Promise.race` for network request timeouts?  
<details>
<summary><strong>Answer</strong></summary>
`Promise.race([fetch(url), timeout(5000)])` rejects when the timeout finishes first, but the underlying HTTP network socket for `fetch` remains open in the background. To prevent resource leaks, pass an `AbortController.signal` to `fetch()` and call `controller.abort()` when the timeout timer fires, terminating the physical network socket and freeing browser buffer memory.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How does V8's Promise Reaction Job queue handle Unhandled Rejections under the hood, and how do you architect a global Zero-Unhandled-Rejection enforcement pipeline in an enterprise SPA?  
<details>
<summary><strong>Answer</strong></summary>
1. **V8 Promise Reaction Lifecycle:** When a Promise rejects with no attached handler, V8 marks the Promise as `kUnhandledRejection` and schedules an unhandled rejection check in the next event loop turn. If no `.catch()` is added before that turn, V8 emits `window.onunhandledrejection` / `process.emit('unhandledRejection')`.  
2. **Global Telemetry Listener:** Attach a top-level `window.addEventListener('unhandledrejection', handler)` that extracts `event.reason`, sanitizes PII, attaches navigation breadcrumbs, and beacons the error to Datadog/Sentry.  
3. **CI/CD Build Enforcement:** Enable ESLint `@typescript-eslint/no-floating-promises` and run automated Cypress/Playwright integration suites that fail CI builds if any `unhandledrejection` console event is triggered during automated end-to-end user journeys.
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Async Concurrency & Timeout Engine

```js
// See runnable implementation in examples/04-async-errors-promise-rejections.js
```

---

## Key Takeaways
1. **Always Await Inside `try/catch`:** Use `return await p;` to intercept rejections locally.
2. **Never Forget `await`:** Eliminate floating promises to prevent false success states.
3. **Choose the Right Concurrency Tool:** Use `Promise.all` for all-or-nothing; `Promise.allSettled` for partial success.
4. **`Promise.race` Does Not Abort:** Pair timeouts with `AbortController` to cancel losing network buffers.
5. **Monitor Unhandled Rejections:** Implement global `window.onunhandledrejection` telemetry in production.

---

[⬅️ Part 03: Error Propagation & Custom Errors](./03-error-propagation-custom-errors.md) | [📚 KPI 25 Index](./README.md) | [Part 05: API Failure Handling & Retry Strategies ➡️](./05-api-failure-handling-retry-strategies.md)
