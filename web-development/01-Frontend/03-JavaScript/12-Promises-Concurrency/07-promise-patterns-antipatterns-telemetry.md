# KPI 12 — Part 07: Real-World Promise Patterns, Error Architecture, Anti-Patterns & Telemetry

[⬅️ Part 06: Promise Timing, Microtasks & Event Loop Scheduling](./06-promise-microtasks-scheduling-advanced-patterns.md) | [📚 KPI 12 Index](./README.md) | [KPI 13 — Async / Await ➡️](../13-Async-Await/README.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Error Architecture Dimension | Architectural Role | Propagation Rule | Senior Production Standard |
|---|---|---|---|
| **Rejection Bubbling** | Asynchronous failure cascade. | Skips all intermediate `.then(onFulfilled)` handlers until finding a `.catch()`. | 🟢 Use centralized tail `.catch()` for unified failure boundaries. |
| **`.catch()` Recovery** | Converts `REJECTED` $\to$ `FULFILLED`. | Returning any non-error value (or omitting `return` $\to$ `undefined`) fulfills the next Promise! | 🔴 **Danger**: Always return an explicit typed fallback or re-throw! |
| **Domain Transformation (`cause`)** | Translates low-level I/O into domain errors. | Wrap low-level errors: `throw new DomainError(msg, { cause: err })`. | 🟢 Preserves root cause call stack for Sentry/Datadog monitoring. |
| **Rethrowing (`throw err`)** | Allows local telemetry while propagating failure. | Preserves rejection state for upstream UI error handlers. | 🟢 Essential for service-layer logging without swallowing UI errors. |
| **`.finally()` Teardowns** | Guarantees resource cleanup. | Transparently passes through values & errors (unless it throws/rejects). | 🟢 Perfect for resetting loading spinners and releasing mutex locks. |
| **Fire-and-Forget (`void op()`)** | Un-awaited background work (analytics). | Unhandled rejections trigger process crashes or console warnings. | 🔴 Attach `.catch(logTelemetry)` to every un-awaited Promise! |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: Domain Error Wrapping with `Error.cause` & Fire-and-Forget Rejection Leaks
> 
> #### Gotcha A: Losing Root-Cause Context in Custom Domain Errors
> *"Why did our Sentry production dashboard show 10,000 generic `UserDataLoadError` entries without any file names, line numbers, or network status codes?"*  
> ```js
> // ❌ MASKED ROOT CAUSE (Destroys Debugging Context):
> function loadUserProfile(userId) {
>   return fetch(`/api/users/${userId}`)
>     .catch((networkErr) => {
>       // 💥 Destroys networkErr stack trace, HTTP status, and socket failure details!
>       throw new Error("UserDataLoadError: Failed to load user profile");
>     });
> }
> ```
> **Deep Architectural Explanation:**  
> Instantiating a new `Error` captures a brand-new call stack starting only from the `.catch()` handler, completely erasing the original network failure call stack, timeout metadata, and socket error codes.  
> **The Senior Standard:** Use ES2022 `Error.cause` to wrap the low-level failure inside an application-domain error while preserving the entire historical failure chain:
> ```js
> // ✅ PRESERVED ROOT CAUSE WITH ES2022 CAUSE:
> class UserDataLoadError extends Error {
>   constructor(message, cause) {
>     super(message, { cause });
>     this.name = "UserDataLoadError";
>   }
> }
> throw new UserDataLoadError("Failed to load user profile", networkErr);
> ```
> 
> ---
> 
> #### Gotcha B: The Fire-and-Forget Unhandled Rejection Leak
> *"Why did our Node.js microservice crash with `UnhandledPromiseRejection: This error originated either by throwing inside of an async function without a catch block`?"*  
> ```js
> // ❌ FATAL FIRE-AND-FORGET REJECTION LEAK:
> function trackUserClick(eventPayload) {
>   // We don't want to block the UI, so we don't await:
>   sendAnalyticsBeacon(eventPayload); // 💥 If this rejects, it's an UNHANDLED REJECTION!
> }
> ```
> **Deep Architectural Explanation:**  
> In modern Node.js and strict browser configurations, any Promise that rejects without an attached `.catch()` handler is flagged as an `UnhandledPromiseRejection`. In Node.js $\ge 15$, this terminates the process (`exit code 1`).  
> **The Senior Standard:** Explicitly mark and guard un-awaited Promises:
> ```js
> void sendAnalyticsBeacon(eventPayload).catch((err) => {
>   telemetryLogger.warn("Analytics beacon dropped:", err);
> });
> ```

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / TypeScript Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Layered error handling, typed fallbacks, `.finally()` spinner cleanup, `Error.cause` | Foundational for resilient enterprise frontend state machines and HTTP service layers. |
| 🟡 **Moderate** | Used in ~45% of code | Exponential backoff retry policies, global `unhandledrejection` listeners, Sentry breadcrumbs | Critical for fault-tolerant micro-frontend applications and production observability. |
| 🔵 **Foundational / Engine** | Runtime internals | ECMAScript rejection tracking, V8 Microtask queue error propagation, AST context retention | Essential for Staff/Principal architecture reviews, SDK design, and core platform infrastructure. |

---

## Core Concepts (20 Subtopics)

### Part 1 — The Dual Ingress Points of Rejection `🟢 [Daily Driver]`

1. **Explicit Rejections:** `Promise.reject(err)` or `reject(err)` in executors.
2. **Runtime Exceptions:** `throw new Error()` inside synchronous executors or `.then()` / `.catch()` handlers.

---

### Part 2 — Asynchronous Error Bubbling `🟢 [Daily Driver]`

When an error is thrown, the runtime skips all intermediate `.then(onFulfilled)` handlers in the chain until it encounters the first `.catch()` or `.then(null, onRejected)`.

---

### Part 3 — `.catch()` as a Branching Transformer `🟢 [Daily Driver]`

`.catch()` catches a rejection and returns a new Promise. If the handler returns a value, the new Promise is **FULFILLED** with that value, transitioning the chain back onto the success path.

---

### Part 4 — The Accidental `undefined` Recovery Bug `🔴 [Production-Critical]`

```js
fetchUser()
  .catch((err) => { console.error(err); }) // 💥 Omits return -> returns undefined (FULFILLED)!
  .then((user) => console.log(user.id));   // 💥 Crashes: TypeError: Cannot read properties of undefined!
```

---

### Part 5 — Re-throwing Rejections `🟢 [Daily Driver]`

To log or inspect an error locally while keeping the Promise in a `REJECTED` state for upstream consumers, re-throw the error:
```js
.catch((err) => {
  logMetrics(err);
  throw err; // 🟢 Re-throws to preserve downstream rejection!
});
```

---

### Part 6 — Domain Error Transformation with `Error.cause` `🟢 [Daily Driver]`

Wrap low-level HTTP/database errors into high-level business domain errors using ES2022 `{ cause }`:
```js
class PaymentGatewayError extends Error {
  constructor(message, cause) {
    super(message, { cause });
    this.name = "PaymentGatewayError";
  }
}
```

---

### Part 7 — Multi-Tier Error Boundaries `🟢 [Daily Driver]`

- **Tier 1 (HTTP Layer):** Normalizes status codes and maps to typed error instances.
- **Tier 2 (Service Layer):** Implements local caching fallbacks and retry logic.
- **Tier 3 (UI Layer):** Catches remaining fatal errors to render user-friendly Error Banners.

---

### Part 8 — Secondary Exceptions in `.catch()` Handlers `🔴 [Production-Critical]`

If code inside a `.catch()` handler throws an error, the returned Promise rejects with the *new* error, superseding the original error reason.

---

### Part 9 — `.finally()` Value Transparency `🔵 [Foundational / Engine]`

`.finally()` receives 0 arguments and does not modify the fulfillment value or rejection reason of the upstream Promise.

---

### Part 10 — `.finally()` Exception Overrides `🔴 [Production-Critical]`

If a `.finally()` handler throws an exception or returns a rejected Promise, that new rejection completely overrides and replaces the original outcome.

---

### Part 11 — Asynchronous Teardown in `.finally()` `🟢 [Daily Driver]`

When returning a Promise from `.finally()`, the chain pauses until the cleanup Promise settles before passing through the original upstream value.

---

### Part 12 — Global Unhandled Rejection Diagnostics `🔴 [Production-Critical]`

Listen to unhandled rejections to prevent silent data loss:
- **Browser:** `window.addEventListener("unhandledrejection", (e) => e.reason);`
- **Node.js:** `process.on("unhandledRejection", (reason, promise) => ...);`

---

### Part 13 — Fire-and-Forget Operations `🟢 [Daily Driver]`

Background tasks that are not awaited must attach `.catch()` handlers to avoid unhandled rejections:
```js
void trackTelemetry().catch(console.warn);
```

---

### Part 14 — Classified Error Hierarchies `🟢 [Daily Driver]`

```ts
export class NetworkError extends Error {}
export class AuthenticationError extends Error {}
export class ValidationError extends Error {}
export class BusinessLogicError extends Error {}
```

---

### Part 15 — Early Catching vs Late Catching: The `null` Swallowing Hazard `🔴 [Production-Critical]`

Catching errors too early and returning `null` converts explicit errors into silent missing-data bugs downstream.

---

### Part 16 — The Missing `return` in `.catch()` `🟢 [Daily Driver]`

Always guarantee that `.catch()` handlers either return a valid object matching the full TypeScript interface or explicitly re-throw.

---

### Part 17 — Enterprise Telemetry & Monitoring `🟢 [Daily Driver]`

Attach Sentry/Datadog breadcrumbs and error tags at each layer of the Promise pipeline.

---

### Part 18 — UI Error Boundary Integration `🟢 [Daily Driver]`

Translate Promise rejections into React Error Boundary triggers using state triggers (`const [, setError] = useState()`).

---

### Part 19 — Retry Resilience with Exponential Backoff & Jitter `🟢 [Daily Driver]`

```js
async function retryWithBackoff(fn, retries = 3, delay = 100) {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    const jitter = Math.random() * 50;
    await new Promise((r) => setTimeout(r, delay + jitter));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}
```

---

### Part 20 — 10-Point Enterprise Promise Error Checklist `🟢 [Daily Driver]`

```text
1. Are all rejection reasons passed as Error instances containing stack traces?
2. Is Error.cause used to preserve low-level context when wrapping domain errors?
3. Do .catch() handlers either return a valid fallback object or re-throw?
4. Are .finally() blocks used for guaranteed UI spinner and lock teardown?
5. Are all fire-and-forget promises guarded with .catch() handlers?
6. Is global unhandledrejection monitoring registered in both browser and Node.js?
7. Are errors classified into distinct typed subclasses (Network, Auth, Validation)?
8. Are retry loops configured with exponential backoff and randomized jitter?
9. Is early .catch(() => null) banned to prevent downstream null reference errors?
10. Is telemetry logged at the service layer before re-throwing to the UI?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Strategy | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Local Fallback `.catch()`** | Non-critical widgets (recommendations, banners) where a default object is acceptable. | Critical transactional data (checkout, authentication). | Masks failures if fallback is incomplete. | `Promise.allSettled()`. |
| **Centralized Tail `.catch()`** | Entire pipeline failure should invalidate the operation and display an error modal. | When individual steps have different fallback requirements. | First failure aborts downstream processing. | Layered error boundaries. |
| **Domain Transformation (`cause`)** | SDKs and Enterprise APIs where internal HTTP details must be abstracted. | Simple internal scripts with no external consumers. | Minor object allocation overhead. | Bare `throw new Error()`. |
| **Global Unhandled Rejection** | Safety-net telemetry and monitoring (Sentry) for uncaught fatal crashes. | Normal day-to-day business error handling. | Cannot recover application state; only logs. | Local `try/catch` & `.catch()`. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Async Boundary & Resilient Telemetry Dashboard in TypeScript
```tsx
import React, { useState, useCallback } from 'react';

// ==========================================
// 1. CUSTOM TYPED DOMAIN ERRORS
// ==========================================
export class ApiNetworkError extends Error {
  constructor(message: string, public statusCode: number, cause?: unknown) {
    super(message, { cause });
    this.name = 'ApiNetworkError';
  }
}

export class UserProfileError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = 'UserProfileError';
  }
}

// ==========================================
// 2. RESILIENT DATA FETCHING WITH RETRY & JITTER
// ==========================================
export interface UserData {
  id: string;
  name: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
}

async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  retries = 2,
  baseDelayMs = 50
): Promise<T> {
  try {
    return await fetchFn();
  } catch (err) {
    if (retries <= 0) throw err;
    const jitter = Math.random() * 30;
    await new Promise((r) => setTimeout(r, baseDelayMs + jitter));
    return fetchWithRetry(fetchFn, retries - 1, baseDelayMs * 2);
  }
}

export function loadUserProfileWithResilience(userId: string): Promise<UserData> {
  let attempt = 0;

  const primaryFetch = () =>
    new Promise<UserData>((resolve, reject) => {
      attempt++;
      if (attempt <= 1) {
        reject(new ApiNetworkError(`HTTP 503 Service Unavailable (Attempt ${attempt})`, 503));
      } else {
        resolve({ id: userId, name: 'Prasenjeet Architect', plan: 'ENTERPRISE' });
      }
    });

  return fetchWithRetry(primaryFetch, 2, 40)
    .catch((networkErr) => {
      // 🟢 Wrap in Domain Error preserving root cause
      throw new UserProfileError('Failed to load user profile after retries', networkErr);
    });
}

// ==========================================
// 3. REACT DASHBOARD VIEW
// ==========================================
export function EnterpriseResilientUserProfile() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rootCause, setRootCause] = useState<string | null>(null);

  const handleFetch = useCallback(() => {
    setIsLoading(true);
    setErrorMessage(null);
    setRootCause(null);

    loadUserProfileWithResilience('USR-777')
      .then((data) => {
        setUser(data);
      })
      .catch((err: UserProfileError) => {
        setErrorMessage(err.message);
        // 🟢 Inspects ES2022 cause
        const underlying = err.cause as Error;
        setRootCause(underlying ? `${underlying.name}: ${underlying.message}` : 'None');
      })
      .finally(() => {
        // 🟢 Guaranteed Spinner Cleanup
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="resilient-user-card">
      <h3>Enterprise Resilient Profile Loader</h3>
      <p>Demonstrates automatic retry with jitter, ES2022 <code>Error.cause</code> wrapping, and <code>.finally()</code> cleanup.</p>

      <button onClick={handleFetch} disabled={isLoading} className="primary-button">
        {isLoading ? 'Executing Retries...' : 'Load Profile with Retry'}
      </button>

      {errorMessage && (
        <div className="error-banner">
          <p><strong>Application Error:</strong> {errorMessage}</p>
          <p><strong>Root Cause (Preserved):</strong> <code>{rootCause}</code></p>
        </div>
      )}

      {user && (
        <div className="user-details">
          <p>Name: <strong>{user.name}</strong></p>
          <p>Plan: <code>{user.plan}</code></p>
        </div>
      )}
    </div>
  );
}
```

---

## 🧠 Part 07 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: Intermediate Rethrowing vs Terminal Catch
```js
Promise.reject(new Error("Database Read Timeout"))
  .catch((err) => {
    console.log("Tier 1 Logged:", err.message);
    throw err; // Re-throw
  })
  .then(() => {
    console.log("Step 2 (Skipped)");
  })
  .catch((err) => {
    console.log("Tier 2 Caught:", err.message);
  });
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Tier 1 Logged: Database Read Timeout
Tier 2 Caught: Database Read Timeout
```
**Why:** The Tier 1 `.catch()` handler logs the error and explicitly re-throws it (`throw err`). This causes the next Promise to reject, skipping the intermediate `.then()` and allowing the Tier 2 `.catch()` to handle it.
</details>

---

### Prediction Challenge 2: Accidental `undefined` State Recovery
```js
Promise.reject(new Error("Auth Expired"))
  .catch((err) => {
    console.log("Caught:", err.message);
    // Omitting return statement!
  })
  .then((val) => {
    console.log("Downstream Value:", val);
  });
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Caught: Auth Expired
Downstream Value: undefined
```
**Why:** Because the `.catch()` handler did not throw or return a value, JavaScript implicitly returns `undefined`. The chain recovers to `FULFILLED` with `undefined`.
</details>

---

### Prediction Challenge 3: `.finally()` Value Transparency vs Throw Override
```js
Promise.resolve("Master Payload")
  .finally(() => {
    return "Ignored Return Value";
  })
  .then((data) => {
    console.log("Data 1:", data);
  });

Promise.resolve("Master Payload")
  .finally(() => {
    throw new Error("Teardown Lock Error");
  })
  .catch((err) => {
    console.log("Data 2 (Overridden):", err.message);
  });
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Data 1: Master Payload
Data 2 (Overridden): Teardown Lock Error
```
**Why:** `.finally()` returns are ignored to preserve upstream values (`"Master Payload"`). However, exceptions thrown inside `.finally()` override and destroy the upstream outcome.
</details>

---

### Prediction Challenge 4: Error Wrapping with `Error.cause`
```js
class AppError extends Error {
  constructor(msg, cause) {
    super(msg, { cause });
    this.name = "AppError";
  }
}

Promise.reject(new TypeError("Null pointer in parser"))
  .catch((rawErr) => {
    throw new AppError("Configuration parse failed", rawErr);
  })
  .catch((wrappedErr) => {
    console.log("App Error:", wrappedErr.message);
    console.log("Root Cause:", wrappedErr.cause.message);
  });
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
App Error: Configuration parse failed
Root Cause: Null pointer in parser
```
**Why:** The custom `AppError` retains the underlying `TypeError` inside the standard `cause` property, preserving full diagnostic traces.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What happens if a `.catch()` block catches an error and does not re-throw or return anything?  
<details>
<summary><strong>Answer</strong></summary>
The `.catch()` block returns `undefined` by default. This causes the returned Promise to transition back into the **FULFILLED** state with `value = undefined`. Any downstream `.then()` fulfillment handlers will execute receiving `undefined`.
</details>

**Q2:** Does `.finally()` receive the resolved value or rejected error of the Promise?  
<details>
<summary><strong>Answer</strong></summary>
**No.** `.finally()` receives 0 arguments. It is designed purely for side-effect cleanups (closing file descriptors, stopping loading spinners) rather than transforming data or inspecting errors.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** What is the difference between `throw err` and `return Promise.reject(err)` inside a `.then()` handler?  
<details>
<summary><strong>Answer</strong></summary>
Functionally, both reject the downstream Promise in the chain. However, `throw err` is standard, synchronous JavaScript syntax that cleanly expresses an unexpected exception or validation failure. `return Promise.reject(err)` explicitly allocates and returns a rejected Promise object. In `.then()` handlers, `throw err` is generally preferred for readability.
</details>

**Q4:** Why is `void someAsyncOperation()` dangerous without a `.catch()` handler?  
<details>
<summary><strong>Answer</strong></summary>
Using `void` only discards the return value; it does **not** catch rejections. If `someAsyncOperation()` rejects, it becomes an **Unhandled Promise Rejection**, which will trigger runtime warnings in browsers and terminate Node.js processes. All fire-and-forget operations must attach `.catch(logError)` to handle background failures safely.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** How do you structure a 3-tier enterprise Promise error-handling architecture in a production frontend application?  
<details>
<summary><strong>Answer</strong></summary>
1. **Tier 1 (HTTP/Transport Layer):** Normalizes network errors, parses HTTP 4xx/5xx status codes, and translates them into typed domain errors (e.g. `ApiNetworkError`, `AuthenticationError`) preserving root causes via `Error.cause`.  
2. **Tier 2 (Service/Domain Layer):** Catches recoverable errors (e.g. cache misses, retryable network glitches with exponential backoff) and returns typed fallback objects. If unrecoverable, logs telemetry to Sentry and re-throws.  
3. **Tier 3 (UI/React Layer):** Catches remaining fatal rejections in local component state or React Error Boundaries to render user-actionable Error Banners, while `.finally()` guaranteed teardown hooks stop loading spinners.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How do you design an enterprise-wide Unhandled Rejection Telemetry Pipeline that prevents memory leaks and correlates client-side error traces with distributed backend traces?  
<details>
<summary><strong>Answer</strong></summary>
1. **Global Interceptors:** Attach global listeners to `window.addEventListener('unhandledrejection')` and `process.on('unhandledRejection')`.  
2. **Trace Correlation:** Extract unique `traceId` / `correlationId` headers from the rejected error's metadata and attach active session IDs, user IDs, and client breadcrumbs.  
3. **Memory & Retainer Cleanup:** Ensure the global error handler does not retain references to the rejected Promise or its closure scope in long-lived arrays to prevent heap memory leaks.  
4. **Resilient Beacon Transport:** Dispatch error telemetry payloads using `navigator.sendBeacon()` or lightweight, non-blocking HTTP POST requests that do not themselves generate nested unhandled rejections.
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Resilient Retry Pipeline with Jitter & Telemetry

```js
// See runnable implementation in examples/07-promise-patterns-antipatterns-telemetry.js
```

---

## Key Takeaways
1. **`.catch()` Recovers to Fulfilled:** Always return an explicit typed fallback or re-throw.
2. **Preserve Root Causes:** Use ES2022 `new Error(msg, { cause: err })`.
3. **Guard Fire-and-Forget:** Attach `.catch()` to all un-awaited background promises.
4. **`.finally()` is Value-Neutral:** Preserves outcomes unless cleanup throws.
5. **Layered Error Architecture:** Separate transport, domain, and UI error boundaries.

---

[⬅️ Part 06: Promise Timing, Microtasks & Event Loop Scheduling](./06-promise-microtasks-scheduling-advanced-patterns.md) | [📚 KPI 12 Index](./README.md) | [KPI 13 — Async / Await ➡️](../13-Async-Await/README.md)
