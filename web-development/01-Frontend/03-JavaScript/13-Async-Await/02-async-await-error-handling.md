# KPI 13 — Part 02: Error Handling with `try` / `catch` / `finally` in `async` Functions

[⬅️ Part 01: The Mental Model, `async` Functions & `await`](./01-async-await-mental-model.md) | [📚 KPI 13 Index](./README.md) | [Part 03: Sequential vs Concurrent Execution & Waterfalls ➡️](./03-sequential-vs-concurrent-waterfalls.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Mechanism / Rule | Underlying Control Flow | Impact on Promise Return | Senior Production Standard |
|---|---|---|---|
| **`await` Error Translation** | Rejected Promise converts to a thrown exception at the `await` line. | Execution jumps to enclosing `catch` block. | 🟢 Wrap asynchronous I/O in structured `try/catch` boundaries. |
| **Dual Exception Capture** | Catches both async rejections and synchronous runtime `TypeError`/`ReferenceError`. | Unified error boundary. | 🟢 Distinguish expected network/API errors from developer bugs. |
| **`return await` inside `try`** | Awaits resolution *inside* the `try` block before returning. | Rejections are caught by the **local `catch`**! | 🔴 **Mandatory inside `try/catch`**: Omitting `await` bypasses local `catch`! |
| **Silent Error Swallowing** | `catch (e) { console.log(e); }` without `return` or `throw`. | Returns `Promise<undefined>` (Fulfilled). | 🔴 **Anti-Pattern**: Downstream code crashes with `Cannot read properties of undefined`! |
| **`finally` Cleanup** | Executes after `try` or `catch` completes (success or failure). | Preserves upstream value/error. | 🟢 Use to reset loading spinners, clear timers, and release mutexes. |
| **`finally` Override Trap** | Using `return` or `throw` inside a `finally` block. | **Permanently overrides** upstream value/error! | 🔴 **Anti-Pattern**: Never return or throw from inside a `finally` block. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: The `return await` inside `try/catch` Trap & Silent Error Swallowing
> 
> #### Gotcha A: Omitting `await` in `return promise` Inside `try/catch`
> *"Why did our local `catch` block fail to execute when `fetchUserData()` threw a network error?"*  
> ```js
> // ❌ FATAL ERROR BYPASS BUG:
> async function loadUserSafely() {
>   try {
>     // 💥 Missing `await`! Returns the pending Promise directly!
>     return fetchUserData(); 
>   } catch (err) {
>     // 💥 THIS CATCH BLOCK NEVER RUNS!
>     console.error("Caught locally:", err);
>     return { id: "GUEST", name: "Guest User" };
>   }
> }
> ```
> **Deep Architectural Explanation:**  
> When you write `return fetchUserData()` without `await`, `loadUserSafely` immediately exits the `try` block and returns the pending Promise to the caller. When that Promise rejects milliseconds later, the execution context of `loadUserSafely` has already popped off the Call Stack. The rejection bypasses the local `catch` block entirely and rejects the outer caller's Promise.  
> **The Senior Standard:** Always write `return await fetchUserData();` when inside a `try/catch` block.
> 
> ---
> 
> #### Gotcha B: The Silent `undefined` Error Swallowing Cascade
> *"Why did our checkout button produce `TypeError: Cannot read properties of undefined (reading 'totalPrice')`?"*  
> ```js
> // ❌ BROKEN ERROR RECOVERY:
> async function getOrderSummary(cartId) {
>   try {
>     return await fetchOrderSummary(cartId);
>   } catch (err) {
>     // 💥 Logs error but omits return statement -> implicitly returns undefined!
>     console.error("Order fetch failed:", err);
>   }
> }
> const summary = await getOrderSummary(101);
> console.log(summary.totalPrice); // 💥 CRASH: TypeError!
> ```
> **Deep Architectural Explanation:**  
> In JavaScript, a function that does not explicitly return a value returns `undefined`. In an `async` function, this fulfills the Promise with `undefined`. The caller assumes the operation succeeded, attempts to access properties on `summary`, and crashes.  
> **The Senior Standard:** Every `catch` block must either:
> 1. **Re-throw:** `throw new OrderLoadError("Failed to load order", { cause: err });`
> 2. **Return an explicit typed fallback:** `return { totalPrice: 0, items: [] };`

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / TypeScript Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | `try/catch/finally`, `return await` inside `try`, resetting loading states in `finally` | Fundamental standard for robust, non-crashing frontend state transitions. |
| 🟡 **Moderate** | Used in ~45% of code | Domain error normalization with `Error.cause`, Result tuple utilities (`[err, data]`) | Critical for enterprise API service layers, micro-frontend SDKs, and form submissions. |
| 🔵 **Foundational / Engine** | Runtime internals | V8 exception translation at `await` suspension points, `finally` completion records | Mandatory for Staff/Principal engineering evaluations, performance architecture, and core systems design. |

---

## Core Concepts (20 Subtopics)

### Part 1 — Rejection-to-Exception Translation at the `await` Boundary `🟢 [Daily Driver]`

When a Promise rejects, the `await` expression translates the rejection reason into a thrown exception on the current execution line.

---

### Part 2 — Dual Exception Capture `🟢 [Daily Driver]`

A single `try/catch` block seamlessly captures both:
1. **Asynchronous Rejections:** Network timeouts, HTTP 500 throws.
2. **Synchronous Runtime Exceptions:** `TypeError`, `ReferenceError`, `JSON.parse` syntax errors.

---

### Part 3 — Error Boundary Granularity: Catching Too Much vs Catching Too Little `🟢 [Daily Driver]`

- **Catching Too Much:** Wrapping the entire function in one monolithic `try/catch` that treats critical authentication failures and non-critical analytics failures identically.
- **Catching Too Little:** Wrapping only rendering logic while leaving the network fetch unguarded.

---

### Part 4 — Critical vs Non-Critical Failure Partitioning `🟢 [Daily Driver]`

Partition async workflows into separate `try/catch` blocks based on business criticality:
```js
// Critical boundary:
try { user = await fetchUser(); } catch (e) { showFatalError(); return; }
// Non-critical boundary:
try { await trackAnalytics(); } catch (e) { logTelemetryWarning(e); }
```

---

### Part 5 — Multi-Tier Error Boundaries: Graceful Degradation `🟢 [Daily Driver]`

Allow core UI features to render even when optional widgets (recommendations, notifications) fail.

---

### Part 6 — `throw` inside `async`: Instant Rejection Conversion `🟢 [Daily Driver]`

Throwing an error inside an `async` function automatically returns a rejected Promise:
```js
async function validate(age) {
  if (age < 0) throw new RangeError("Age cannot be negative");
  return age;
}
```

---

### Part 7 — Explicit Contract Recovery: Valid Fallbacks vs Re-throwing `🟢 [Daily Driver]`

A `catch` block must either return an object that strictly satisfies the expected return type or re-throw.

---

### Part 8 — The Fatal `undefined` Swallowing Anti-Pattern `🔴 [Production-Critical]`

Omitting `return` inside `catch` implicitly returns `undefined`, converting an error into an invalid fulfilled state.

---

### Part 9 — Result Wrapper Tuples: Go-Style `[err, data]` Pattern `🟢 [Daily Driver]`

```ts
export async function to<T, E = Error>(promise: Promise<T>): Promise<[E, null] | [null, T]> {
  try {
    const data = await promise;
    return [null, data];
  } catch (err) {
    return [err as E, null];
  }
}
// Usage: const [err, user] = await to(fetchUser());
```

---

### Part 10 — Domain Error Normalization with `Error.cause` `🟢 [Daily Driver]`

Translate low-level HTTP/transport errors into domain-specific business exceptions while preserving original stack traces via ES2022 `new DomainError(msg, { cause: err })`.

---

### Part 11 — Re-throwing with Enriched Telemetry Context `🟢 [Daily Driver]`

Catch locally to log metrics or Sentry breadcrumbs, then `throw err` to allow higher UI boundaries to display alerts.

---

### Part 12 — The `return await` Invariant inside `try` `🔴 [Production-Critical]`

- **Inside `try/catch`:** `return await promise;` (**MANDATORY** to catch local rejections).
- **Outside `try/catch`:** `return promise;` (**RECOMMENDED** to avoid extra microtask ticks).

---

### Part 13 — Guaranteed Teardown with `finally` `🟢 [Daily Driver]`

Guarantees execution for both success and failure paths. Ideal for:
1. Clearing loading spinners: `setLoading(false)`.
2. Clearing timer handles: `clearTimeout(timerId)`.
3. Evicting pending cache keys: `pendingRequests.delete(key)`.

---

### Part 14 — The `finally` Override Danger `🔴 [Production-Critical]`

A `return` or `throw` statement inside a `finally` block completely overrides and discards any return value or thrown error from the preceding `try` or `catch` blocks.

---

### Part 15 — Error Propagation Across Nested `async` Call Stacks `🟢 [Daily Driver]`

Unhandled rejections in nested `async` functions bubble upward through each `await` boundary until caught.

---

### Part 16 — The "Catch-and-Rethrow Nothing" Redundancy Anti-Pattern `🟢 [Daily Driver]`

Writing `try { return await fetch(); } catch (err) { throw err; }` with no logging or transformation adds useless boilerplate. Omit the `try/catch` and let the error propagate naturally.

---

### Part 17 — 4-Tier Error Ownership Architecture `🟢 [Daily Driver]`

```text
[ 1. Transport Layer ] ──> Maps HTTP status codes to typed ApiError.
             │
             ▼
[ 2. Service Layer ]   ──> Handles retries, fallback cache, and logs to Sentry.
             │
             ▼
[ 3. Feature Hook ]    ──> Controls retry state machines & optimistic rollbacks.
             │
             ▼
[ 4. UI Component ]    ──> Displays user-actionable toast / error boundary banner.
```

---

### Part 18 — Handling Errors in Parallel Workflows `🟢 [Daily Driver]`

- **`Promise.all`:** Fails fast on the first rejection; wrap individual promises in `try/catch` or `.catch()` if you need local fallback values.
- **`Promise.allSettled`:** Inspects `{ status: 'fulfilled' | 'rejected' }` per item without throwing.

---

### Part 19 — Safe Fallback Contracts & Null Object Patterns `🟢 [Daily Driver]`

When recovering in a `catch` block, return a complete Null Object that implements all required interface properties.

---

### Part 20 — 10-Point Enterprise Error Architecture Checklist `🟢 [Daily Driver]`

```text
1. Is `return await` used inside all `try/catch` blocks?
2. Are `catch` blocks prevented from implicitly returning `undefined`?
3. Are all domain errors wrapped using ES2022 `Error.cause`?
4. Are loading states always reset inside guaranteed `finally` blocks?
5. Are `return` and `throw` strictly banned inside `finally` blocks?
6. Are critical dependencies separated from optional degrading features?
7. Is redundant catch-and-rethrow without transformation eliminated?
8. Are HTTP 4xx/5xx responses validated via `response.ok` before `await res.json()`?
9. Is Sentry/Datadog telemetry logged at the service layer before re-throwing?
10. Are user-facing error messages separated from raw technical stack traces?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Strategy | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Local Granular `try/catch`** | Isolating optional widgets or specific recoverable API calls. | Wrapping every single line of code with separate `try/catch` blocks. | Can become verbose if overused. | Result Tuples (`[err, data]`). |
| **Top-Level Route Error Boundary** | Catching unrecoverable fatal application crashes in React / Next.js. | Recovering from transient network glitches that could be retried. | Tears down entire page/view tree on failure. | Component-level fallback UI. |
| **Result Wrapper Tuples (`toAsync`)**| Node.js backend controllers, Go-style explicit error checking without `try/catch` nesting. | Simple React components where standard `try/catch` is idiomatic. | Requires unpacking `[err, data]` tuple on every call. | Standard `try/catch`. |
| **`Promise.allSettled` Inspection**| Batch fetching dashboards with independent card failure requirements. | Atomic multi-step operations where any failure must abort the batch. | Requires manual filtering of `fulfilled` vs `rejected` arrays. | `Promise.all` with localized `.catch()`. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Resilient Dashboard with 3-Tier Error Boundaries in TypeScript
```tsx
import React, { useState, useEffect, useCallback } from 'react';

// ==========================================
// 1. CUSTOM DOMAIN ERROR HIERARCHY
// ==========================================
export class DomainApiError extends Error {
  constructor(message: string, public statusCode: number, cause?: unknown) {
    super(message, { cause });
    this.name = 'DomainApiError';
  }
}

// ==========================================
// 2. DATA MODELS & RESILIENT API SERVICE
// ==========================================
export interface UserProfile { id: string; name: string; email: string; }
export interface DashboardFeed { notifications: string[]; recommendations: string[]; }

async function fetchUserProfile(userId: string): Promise<UserProfile> {
  // Simulates critical network call
  return new Promise((resolve) =>
    setTimeout(() => resolve({ id: userId, name: 'Prasenjeet Architect', email: 'prasenjeet@vault.engineering' }), 40)
  );
}

async function fetchDashboardFeed(userId: string): Promise<DashboardFeed> {
  // Simulates partial failure in optional feed
  return new Promise((_, reject) =>
    setTimeout(() => reject(new DomainApiError('Feed Service 503 Unavailable', 503)), 50)
  );
}

// ==========================================
// 3. REACT RESILIENT DASHBOARD COMPONENT
// ==========================================
export function EnterpriseResilientDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [feed, setFeed] = useState<DashboardFeed | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [criticalError, setCriticalError] = useState<string | null>(null);
  const [feedWarning, setFeedWarning] = useState<string | null>(null);

  const loadDashboard = useCallback(async (userId: string) => {
    setIsLoading(true);
    setCriticalError(null);
    setFeedWarning(null);

    // 🟢 TIER 1: CRITICAL ERROR BOUNDARY (User Profile must succeed)
    try {
      // 🟢 Uses mandatory `return await` pattern internally
      const user = await fetchUserProfile(userId);
      setProfile(user);
    } catch (err: any) {
      setCriticalError(`Critical Auth Failure: ${err.message}`);
      setIsLoading(false);
      return; // Stop execution on critical failure
    }

    // 🟢 TIER 2: OPTIONAL ERROR BOUNDARY (Feed can gracefully degrade)
    try {
      const feedData = await fetchDashboardFeed(userId);
      setFeed(feedData);
    } catch (err: any) {
      // 🟢 Graceful fallback recovery: provide safe default contract
      setFeedWarning(`Feed unavailable: ${err.message}. Showing cached defaults.`);
      setFeed({ notifications: ['Welcome to the platform!'], recommendations: ['Explore Docs'] });
    } finally {
      // 🟢 TIER 3: GUARANTEED CLEANUP
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard('USR-101');
  }, [loadDashboard]);

  return (
    <div className="resilient-dashboard-card">
      <h3>Enterprise Resilient Dashboard</h3>
      <p>Demonstrates multi-tier error boundaries: Critical failure bailout vs Optional graceful degradation.</p>

      {isLoading && <p><em>⚡ Loading dashboard modules...</em></p>}
      {criticalError && <div className="error-banner">🚨 {criticalError}</div>}
      {feedWarning && <div className="warning-banner">⚠️ {feedWarning}</div>}

      {profile && (
        <div className="profile-section">
          <h4>User Profile (Critical):</h4>
          <p><strong>{profile.name}</strong> (<code>{profile.email}</code>)</p>
        </div>
      )}

      {feed && (
        <div className="feed-section">
          <h4>Feed & Recommendations (Graceful Degradation):</h4>
          <ul>
            {feed.notifications.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

## 🧠 Part 02 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: `return await` inside `try/catch`
```js
async function testReturnAwait() {
  try {
    return await Promise.reject(new Error("Error A"));
  } catch (err) {
    return "Caught Locally: " + err.message;
  }
}

testReturnAwait().then((res) => console.log("Result:", res));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Result: Caught Locally: Error A
```
**Why:** Because `return await` was used, the Promise rejection occurred *inside* the `try` block. The local `catch` caught it and returned the recovery string `"Caught Locally: Error A"`.
</details>

---

### Prediction Challenge 2: Returning Raw Promise without `await` inside `try/catch`
```js
async function testRawReturn() {
  try {
    return Promise.reject(new Error("Error B")); // Missing await!
  } catch (err) {
    return "Caught Locally: " + err.message;
  }
}

testRawReturn()
  .then((res) => console.log("Fulfilled:", res))
  .catch((err) => console.log("Bypassed Local Catch:", err.message));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Bypassed Local Catch: Error B
```
**Why:** Omitting `await` causes `testRawReturn` to immediately return the pending Promise and exit the `try` block. When the Promise rejects, it completely bypasses the local `catch` and rejects the outer Promise.
</details>

---

### Prediction Challenge 3: Synchronous Exception Captured alongside Async Rejection
```js
async function processData() {
  try {
    const data = await Promise.resolve(null);
    data.trim(); // 💥 Synchronous TypeError!
  } catch (err) {
    console.log("Caught Instance:", err.name);
  }
}

processData();
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Caught Instance: TypeError
```
**Why:** `try/catch` in `async` functions creates a unified error boundary that captures synchronous runtime exceptions (`null.trim()`) exactly like asynchronous Promise rejections.
</details>

---

### Prediction Challenge 4: `finally` Return Override Trap
```js
async function testFinallyOverride() {
  try {
    throw new Error("Original Error");
  } catch (err) {
    return "Caught in Catch";
  } finally {
    return "Overridden in Finally"; // 💥 Override!
  }
}

testFinallyOverride().then((val) => console.log("Final Outcome:", val));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Final Outcome: Overridden in Finally
```
**Why:** A `return` statement inside a `finally` block completely overrides and discards any value or error returned by `try` or `catch`.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** How do you catch errors produced by an `await` expression?  
<details>
<summary><strong>Answer</strong></summary>
By wrapping the `await` statement inside a standard `try { ... } catch (error) { ... }` block. When an awaited Promise rejects, JavaScript translates the rejection into a thrown exception at that exact line, jumping execution directly into the `catch` block.
</details>

**Q2:** When does code inside a `finally` block execute?  
<details>
<summary><strong>Answer</strong></summary>
Code inside a `finally` block **always executes**, regardless of whether the `try` block completed successfully or an error was caught/thrown in `catch`. It is primarily used for deterministic cleanup (e.g. resetting loading spinners, clearing timers).
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** What is the critical difference between `return promise;` and `return await promise;` inside an `async` function?  
<details>
<summary><strong>Answer</strong></summary>
- **Inside `try/catch`:** `return await promise;` is mandatory if you want any rejections to be caught by the *local* `catch` block. Writing `return promise;` immediately returns the unresolved Promise and exits the `try` block, bypassing local error handling and forwarding rejections to the caller.  
- **Outside `try/catch`:** `return promise;` is preferred because both behave identically for the caller, but `return promise` avoids allocating an extra microtask tick.
</details>

**Q4:** What is "Silent Error Swallowing" and how do you prevent it in `async` functions?  
<details>
<summary><strong>Answer</strong></summary>
Silent Error Swallowing happens when a `catch` block logs an error (e.g. `console.error(err)`) but omits a `return` or `throw` statement. Because JavaScript functions return `undefined` by default, this recovers the `async` function into a fulfilled `Promise<undefined>`. Downstream callers assuming valid data then crash with `TypeError: Cannot read properties of undefined`. It is prevented by either re-throwing (`throw err`) or returning an explicit typed fallback object.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** How do you structure a 4-tier error handling architecture in an enterprise TypeScript/React application using `async`/`await`?  
<details>
<summary><strong>Answer</strong></summary>
1. **Transport Tier (HTTP Client):** Validates `response.ok`, parses JSON, and maps raw HTTP status codes to typed `ApiNetworkError` instances.  
2. **Service Tier (Data Layer):** Uses ES2022 `Error.cause` to normalize transport errors into Domain Business Errors (`UserProfileError`), handles retry policies, and logs breadcrumbs to Sentry.  
3. **Feature Tier (Custom Hook):** Manages local state machines, distinguishes critical failures (bailing out) from non-critical failures (providing cached fallback contracts).  
4. **UI Tier (React Component / Error Boundary):** Renders user-actionable notifications or full fallback Error Boundary cards, ensuring loading spinners are reset via `.finally()`.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How does the ECMAScript specification handle the execution context stack and Completion Records when a `finally` block returns or throws during an asynchronous generator/coroutine suspension?  
<details>
<summary><strong>Answer</strong></summary>
Under ECMAScript §14.7.5.7 (`TryStatementEvaluation`):
1. **Completion Record Tracking:** The runtime tracks the `completion` of the `try` and `catch` blocks as a tuple `(type, value, target)` where `type` is `normal`, `return`, or `throw`.  
2. **Finally Evaluation:** The `finally` block is executed. If the `finally` block produces an abrupt completion (`return` or `throw`), its Completion Record **supersedes and discards** the prior completion record from `try`/`catch`.  
3. **Async Continuation:** In `async` functions, if `finally` completes abruptly with `return val`, the outer Promise fulfills with `val`; if it completes with `throw err`, the outer Promise rejects with `err`, permanently masking any previous errors or returns.
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Result Tuple Helper & Pipeline

```js
// See runnable implementation in examples/02-async-await-error-handling.js
```

---

## Key Takeaways
1. **Always `return await` inside `try/catch`:** Prevents bypassing local catch handlers.
2. **Never Swallow Errors with Empty Catch:** Return a valid typed fallback or re-throw.
3. **Partition Error Boundaries:** Separate critical dependencies from optional widgets.
4. **`finally` Runs Unconditionally:** Perfect for resetting UI spinners and clearing timers.
5. **Never Return/Throw inside `finally`:** Prevents overriding upstream outcomes.

---

[⬅️ Part 01: The Mental Model, `async` Functions & `await`](./01-async-await-mental-model.md) | [📚 KPI 13 Index](./README.md) | [Part 03: Sequential vs Concurrent Execution & Waterfalls ➡️](./03-sequential-vs-concurrent-waterfalls.md)
