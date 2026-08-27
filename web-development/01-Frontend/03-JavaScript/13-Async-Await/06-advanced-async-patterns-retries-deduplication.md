# KPI 13 — Part 06: Advanced Async Patterns, Retries, Deduplication & Telemetry Architecture

[⬅️ Part 05: Real-World `fetch`, Cancellation, Timeouts & Race Conditions](./05-real-world-fetch-cancellation-race-conditions.md) | [📚 KPI 13 Index](./README.md) | [KPI 14 — Modules & Architecture ➡️](../20-Modules-ESM/README.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Architecture Pattern | Problem Solved | Execution Mechanism | Senior Production Standard |
|---|---|---|---|
| **`Promise.all`** | Independent mandatory data. | Fulfills when all resolve; rejects on first failure. | 🟢 Use when every single data dependency is strictly required. |
| **`Promise.allSettled`** | Independent optional widgets. | Never rejects early; returns array of `{ status, value/reason }`. | 🟢 Use for resilient dashboards to prevent partial UI crashes. |
| **`Promise.any`** | Multi-server/CDN redundancy. | Fulfills on first success; rejects with `AggregateError` if all fail. | 🟢 Use for querying mirror CDNs or fallback data providers. |
| **In-Flight Deduplication** | Concurrent duplicate requests. | Caches pending `Promise<T>` in a `Map`. | 🔴 **Mandatory**: Always delete rejected Promises in `.catch()`/`.finally()`! |
| **Exponential Retry + Jitter** | Transient 5xx & connection drops. | Delay $= \text{base} \times 2^{\text{attempt}} + \text{randomJitter}$. | 🟢 Prevents synchronized "Thundering Herd" server overload storms. |
| **Idempotency Guard** | Duplicate mutation charges. | Attach `Idempotency-Key` UUID. | 🔴 Never auto-retry non-idempotent mutations (`POST /pay`) without keys! |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: The Poisoned In-Flight Cache & Blind Non-Idempotent Retries
> 
> #### Gotcha A: The Cached Rejected Promise Memory Poisoning Bug
> *"Why did our React app continue displaying 'User Fetch Failed' for 10 minutes after the user restored their Wi-Fi connection?"*  
> ```js
> // ❌ BROKEN PROMISE CACHE:
> const inFlightCache = new Map();
> function fetchUserProfile(id) {
>   if (inFlightCache.has(id)) return inFlightCache.get(id);
>   const p = fetch(`/api/user/${id}`).then(res => res.json());
>   inFlightCache.set(id, p); // 💥 Stored without rejection eviction!
>   return p;
> }
> ```
> **Deep Architectural Explanation:**  
> If the network hiccups on the initial request, `p` transitions into the `REJECTED` state and remains stored in the `Map`. All subsequent calls to `fetchUserProfile(id)` receive the cached rejected Promise immediately, permanently locking the UI in a failure state without ever attempting a new network fetch.  
> **The Senior Standard:** Always evict rejections from the in-flight cache:
> ```js
> const p = fetch(`/api/user/${id}`)
>   .then(res => res.json())
>   .finally(() => inFlightCache.delete(id)); // 🟢 Evict immediately on settle!
> inFlightCache.set(id, p);
> ```
> 
> ---
> 
> #### Gotcha B: Blindly Retrying Non-Idempotent Operations (`POST /pay`)
> *"Why did a temporary 504 Gateway Timeout charge a customer's credit card three separate times?"*  
> ```js
> // ❌ FATAL BLIND RETRY ANTI-PATTERN:
> await retry(() => fetch("/api/checkout/charge", { method: "POST", body: orderData }), 3);
> ```
> **Deep Architectural Explanation:**  
> A 504 Gateway Timeout or TCP socket drop often occurs *after* the payment gateway processed the charge but *before* the response reached the browser. Automatically retrying a non-idempotent `POST` mutation replays the credit card transaction, causing multiple charges.  
> **The Senior Standard:** Only retry safe, idempotent operations (`GET`, `PUT`, `DELETE`). For mutations, generate a unique `Idempotency-Key` header so the server deduplicates replayed attempts.

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / TypeScript Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | `Promise.all` vs `allSettled`, in-flight request sharing, structured API abstractions | Fundamental standard for building scalable, leak-free, production-grade applications. |
| 🟡 **Moderate** | Used in ~45% of code | Exponential backoff with jitter, `Promise.any` multi-CDN failover, TanStack Query internals | Critical for enterprise SDK design, resilient payment pipelines, and high-load platforms. |
| 🔵 **Foundational / Engine** | Runtime internals | Async Mutexes, V8 Microtask queue drain dynamics, `AggregateError` stack unwinding | Mandatory for Staff/Principal engineering evaluations, performance architecture, and core systems design. |

---

## Core Concepts (20 Subtopics)

### Part 1 — Promise Combinator Orchestration Policies `🟢 [Daily Driver]`

- **`Promise.all`:** All must succeed ($\cap$).
- **`Promise.allSettled`:** Inspect all outcomes regardless of failure ($\cup$).
- **`Promise.race`:** First settlement wins (Success OR Failure).
- **`Promise.any`:** First successful fulfillment wins (Ignores individual failures).

---

### Part 2 — `Promise.resolve` & `Promise.reject` Value Normalization `🟢 [Daily Driver]`

Normalize unknown return values (sync value vs Promise) into a uniform async contract:
```js
const val = await Promise.resolve(syncOrAsyncValue);
```

---

### Part 3 — `Promise.all`: Fail-Fast Semantics & Non-Cancellation `🟢 [Daily Driver]`

When one Promise in `Promise.all` rejects, the outer Promise rejects immediately. **The remaining pending operations continue executing in the background** unless explicitly cancelled via `AbortController`.

---

### Part 4 — `Promise.allSettled`: Resilient Multi-Widget Dashboards `🟢 [Daily Driver]`

```ts
const results = await Promise.allSettled([fetchUser(), fetchNotifications(), fetchAnalytics()]);
const [userRes, notifRes, analyticsRes] = results;
if (userRes.status === 'fulfilled') renderUser(userRes.value);
```

---

### Part 5 — `Promise.race` vs True Socket Cancellation `🔴 [Production-Critical]`

`Promise.race([fetch(url), timeout(5000)])` only stops waiting in JavaScript; it leaves the network socket open. Use `AbortSignal.timeout(5000)` to cancel the underlying TCP connection.

---

### Part 6 — `Promise.any` & `AggregateError` Multi-CDN Fallbacks `🟢 [Daily Driver]`

```js
try {
  const data = await Promise.any([fetch('https://cdn1.vault.com'), fetch('https://cdn2.vault.com')]);
} catch (err) {
  if (err instanceof AggregateError) console.error("All CDNs failed:", err.errors);
}
```

---

### Part 7 — Transient vs Permanent Failure Classification `🟢 [Daily Driver]`

- **Transient (Retryable):** HTTP 500, 502, 503, 504, network timeouts, offline drops.
- **Permanent (Non-Retryable):** HTTP 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found).

---

### Part 8 — Exponential Backoff Formula `🟢 [Daily Driver]`

$$\text{Backoff Delay} = \text{baseDelay} \times 2^{\text{attempt}}$$

---

### Part 9 — Randomized Full Jitter Algorithm `🔴 [Production-Critical]`

$$\text{Sleep Delay} = \text{random}(0, \text{baseDelay} \times 2^{\text{attempt}})$$
Introduces random variance to spread out client retries and eliminate synchronized "Thundering Herd" server crashes.

---

### Part 10 — Idempotency & Safe Mutation Policies `🔴 [Production-Critical]`

Never auto-retry state-mutating requests (`POST /orders`) without an `Idempotency-Key: <UUID>` header.

---

### Part 11 — In-Flight Request Deduplication via Promise Sharing `🟢 [Daily Driver]`

Share the single active pending `Promise` across multiple components querying the same endpoint simultaneously.

---

### Part 12 — Poisoned Cache Prevention `🔴 [Production-Critical]`

Always remove pending Promises from the in-flight deduplication `Map` inside `.finally()` to allow future retries after failure.

---

### Part 13 — In-Flight Promise Caching vs Settled Data Caching `🟢 [Daily Driver]`

- **In-Flight Caching:** Lifecycle lasts only until request settles (0–500ms).
- **Data Caching:** Lifecycle lasts for a configured Time-To-Live (TTL) (e.g. 5 minutes).

---

### Part 14 — 8-State Semantic Async Lifecycle Machine `🟢 [Daily Driver]`

```text
[ IDLE ] ──> [ LOADING ] ──┬──> [ SUCCESS ]
                           ├──> [ RETRYING ] ──> [ LOADING ]
                           ├──> [ REFRESHING_STALE ]
                           ├──> [ HTTP_ERROR ]
                           ├──> [ NETWORK_ERROR ]
                           └──> [ CANCELLED ]
```

---

### Part 15 — The 4-Tier Enterprise Data Access Architecture `🟢 [Daily Driver]`

```text
[ 1. React Component ]   ──> Consumes declarative hook ({ data, loading, error }).
             │
             ▼
[ 2. Custom Data Hook ]  ──> Manages state machine & binds AbortController lifecycle.
             │
             ▼
[ 3. Service Client ]    ──> Implements retry with jitter, in-flight deduplication & telemetry.
             │
             ▼
[ 4. Fetch HTTP Client ] ──> Validates response.ok, parses JSON, normalizes ApiError.
```

---

### Part 16 — Adaptive Throttling & `Retry-After` Header Adherence `🟢 [Daily Driver]`

Inspect `response.headers.get("Retry-After")` on HTTP 429 responses and pause client requests accordingly.

---

### Part 17 — Async Mutex / Lock Queues for Critical Sections `🔵 [Foundational / Engine]`

Ensure that atomic operations (such as token refresh handshakes) execute sequentially across concurrent asynchronous callers.

---

### Part 18 — Request Profiling & Telemetry Tracing `🟢 [Daily Driver]`

Attach `traceId`, `operationName`, and `durationMs` to all async requests for Sentry/Datadog APM monitoring.

---

### Part 19 — Zero-Dependency Production Resilient Client `🟢 [Daily Driver]`

A pure TypeScript wrapper unifying timeouts, deduplication, retries with jitter, and error normalization.

---

### Part 20 — 10-Point Enterprise Async Architecture Checklist `🟢 [Daily Driver]`

```text
1. Are combinations of mandatory queries orchestrated via Promise.all?
2. Are independent optional widgets isolated with Promise.allSettled?
3. Are multi-CDN fallbacks handled via Promise.any with AggregateError catching?
4. Are in-flight duplicate queries deduplicated via Promise sharing?
5. Are rejected promises immediately evicted from in-flight cache maps?
6. Are retries strictly restricted to idempotent HTTP methods and transient errors?
7. Do retry delays implement Exponential Backoff with Randomized Jitter?
8. Are network timeouts implemented with AbortSignal.timeout() to cancel sockets?
9. Is request state modeled as an explicit discriminated union state machine?
10. Is technical transport behavior separated from UI rendering decisions?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Combinator / Tool | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **`Promise.all`** | All-or-nothing dependent batches (e.g. User + Auth Permissions). | Dashboards with optional independent cards. | One failure immediately fails aggregate. | `Promise.allSettled`. |
| **`Promise.allSettled`** | Multi-widget pages where cards can fail independently without crashing view. | Transactional atomic operations where all must succeed. | Returns wrapper objects `{ status, value/reason }`. | `Promise.all`. |
| **`Promise.any`** | Multi-server mirror fetching, fastest CDN resolution, or DNS racing. | Operations where all results are required. | Rejects with `AggregateError` only if all fail. | `Promise.race`. |
| **In-Flight Deduplication** | High-traffic components querying identical resources concurrently. | Real-time volatile streams where every call must hit the network. | Small in-memory cache `Map` overhead. | TanStack Query `queryClient`. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Resilient HTTP Client with Deduplication, Jittered Retries & Telemetry in TypeScript
```tsx
import React, { useState, useCallback, useRef } from 'react';

// ==========================================
// 1. PRODUCTION RESILIENT HTTP CLIENT
// ==========================================
export interface RequestTelemetry {
  traceId: string;
  url: string;
  attempts: number;
  durationMs: number;
  status: 'SUCCESS' | 'ERROR';
}

export class ResilientHttpClient {
  private inFlightMap = new Map<string, Promise<any>>();

  public async get<T>(
    url: string,
    options: { attempts?: number; baseDelay?: number; signal?: AbortSignal } = {}
  ): Promise<{ data: T; telemetry: RequestTelemetry }> {
    const { attempts = 3, baseDelay = 50, signal } = options;

    // 🟢 1. In-Flight Request Deduplication
    if (this.inFlightMap.has(url)) {
      console.log(`📦 [In-Flight Hit]: Sharing active Promise for ${url}`);
      return this.inFlightMap.get(url)!;
    }

    const traceId = `TR-${Math.random().toString(36).substring(2, 6)}`;
    const startTime = performance.now();

    const requestPromise = this.executeWithRetry<T>(url, attempts, baseDelay, signal)
      .then((data) => ({
        data,
        telemetry: {
          traceId,
          url,
          attempts,
          durationMs: Math.round(performance.now() - startTime),
          status: 'SUCCESS' as const,
        },
      }))
      .catch((err) => {
        throw {
          error: err,
          telemetry: {
            traceId,
            url,
            attempts,
            durationMs: Math.round(performance.now() - startTime),
            status: 'ERROR' as const,
          },
        };
      })
      .finally(() => {
        // 🟢 2. Prevent Poisoned Cache: Evict on settle!
        this.inFlightMap.delete(url);
      });

    this.inFlightMap.set(url, requestPromise);
    return requestPromise;
  }

  private async executeWithRetry<T>(
    url: string,
    maxAttempts: number,
    baseDelay: number,
    signal?: AbortSignal
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        if (signal?.aborted) throw new Error('Request Aborted');

        // Simulating network fetch with intermittent failure
        const response = await fetch(url, { signal });
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
        return (await response.json()) as T;
      } catch (err: any) {
        lastError = err;
        if (err.name === 'AbortError' || attempt === maxAttempts - 1) break;

        // 🟢 3. Exponential Backoff with Randomized Jitter
        const expDelay = baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * expDelay;
        const sleepMs = expDelay + jitter;
        console.log(`⚠️ [Retry Attempt ${attempt + 1}/${maxAttempts}]: Sleeping ${Math.round(sleepMs)}ms...`);
        await new Promise((res) => setTimeout(res, sleepMs));
      }
    }

    throw lastError;
  }
}

export const resilientClient = new ResilientHttpClient();

// ==========================================
// 2. REACT TELEMETRY DASHBOARD COMPONENT
// ==========================================
export function EnterpriseResilientClientDashboard() {
  const [logs, setLogs] = useState<RequestTelemetry[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const handleFetchBatch = useCallback(async () => {
    setIsFetching(true);
    setLogs([]);

    const url = 'https://jsonplaceholder.typicode.com/todos/1';

    // 🟢 Fire 3 simultaneous requests to demonstrate in-flight deduplication
    const [req1, req2, req3] = await Promise.allSettled([
      resilientClient.get(url),
      resilientClient.get(url),
      resilientClient.get(url),
    ]);

    const collected: RequestTelemetry[] = [];
    if (req1.status === 'fulfilled') collected.push(req1.value.telemetry);
    if (req2.status === 'fulfilled') collected.push(req2.value.telemetry);
    if (req3.status === 'fulfilled') collected.push(req3.value.telemetry);

    setLogs(collected);
    setIsFetching(false);
  }, []);

  return (
    <div className="resilient-dashboard-card">
      <h3>Enterprise Resilient Client & Telemetry Profiler</h3>
      <p>Demonstrates in-flight request deduplication, jittered retry backoff, and APM telemetry tracking.</p>

      <button onClick={handleFetchBatch} disabled={isFetching} className="primary-button">
        {isFetching ? 'Executing Throttled Batch...' : 'Dispatch 3 Concurrent Queries'}
      </button>

      <h4>APM Request Traces:</h4>
      <div className="trace-list">
        {logs.map((log, i) => (
          <div key={i} className="trace-badge">
            Trace <code>{log.traceId}</code>: <strong>{log.url}</strong> — {log.durationMs}ms ({log.status})
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🧠 Part 06 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: `Promise.any` vs `Promise.race`
```js
const p1 = new Promise((_, rej) => setTimeout(() => rej("Fail A"), 20));
const p2 = new Promise((res) => setTimeout(() => res("Success B"), 50));

Promise.race([p1, p2]).catch((err) => console.log("Race Result:", err));
Promise.any([p1, p2]).then((val) => console.log("Any Result:", val));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Race Result: Fail A
Any Result: Success B
```
**Why:** `Promise.race` settles as soon as `p1` rejects at 20ms. `Promise.any` ignores `p1`'s rejection and fulfills when `p2` succeeds at 50ms.
</details>

---

### Prediction Challenge 2: In-Flight Promise Sharing Execution
```js
const cache = new Map();

function getDeduplicated(key) {
  if (cache.has(key)) {
    console.log("Cache Hit");
    return cache.get(key);
  }
  console.log("Network Dispatch");
  const p = Promise.resolve(`Data-${key}`).finally(() => cache.delete(key));
  cache.set(key, p);
  return p;
}

getDeduplicated("item1");
getDeduplicated("item1");
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Network Dispatch
Cache Hit
```
**Why:** Both synchronous invocations share the single in-flight Promise instance stored in the `Map`.
</details>

---

### Prediction Challenge 3: `Promise.any` All-Reject `AggregateError`
```js
const p1 = Promise.reject("Error 1");
const p2 = Promise.reject("Error 2");

Promise.any([p1, p2]).catch((err) => {
  console.log("Is AggregateError?:", err instanceof AggregateError);
  console.log("Errors Array:", err.errors);
});
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Is AggregateError?: true
Errors Array: [ 'Error 1', 'Error 2' ]
```
**Why:** When every Promise in `Promise.any()` rejects, it throws an `AggregateError` containing the array of all rejection reasons.
</details>

---

### Prediction Challenge 4: Value Normalization with `Promise.resolve`
```js
async function normalize(input) {
  const result = await Promise.resolve(input);
  console.log("Normalized:", result);
}

normalize(42);
normalize(Promise.resolve(99));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Normalized: 42
Normalized: 99
```
**Why:** `Promise.resolve()` normalizes both raw values and Promises into a uniform Promise interface.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is the difference between `Promise.all()` and `Promise.allSettled()`?  
<details>
<summary><strong>Answer</strong></summary>
- **`Promise.all()`:** Fails fast. If any single input Promise rejects, the aggregate Promise immediately rejects with that error.  
- **`Promise.allSettled()`:** Resilient. It waits for all input Promises to settle (either fulfilled or rejected) and returns an array of outcome objects `{ status: 'fulfilled', value }` or `{ status: 'rejected', reason }`.
</details>

**Q2:** When should you use `Promise.any()` instead of `Promise.race()`?  
<details>
<summary><strong>Answer</strong></summary>
Use `Promise.any()` when you want the **first successful fulfillment** and want to ignore individual failures (e.g. querying mirror CDNs). Use `Promise.race()` when you want the **first settlement of any kind** (e.g. racing an operation against a cancellation timeout).
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** What is "In-Flight Request Deduplication" and why must rejected Promises be evicted from the cache?  
<details>
<summary><strong>Answer</strong></summary>
In-flight request deduplication prevents multiple components from dispatching redundant HTTP requests for the same resource simultaneously by sharing a pending `Promise` in a `Map`. If a request fails and the rejected Promise is not evicted via `.finally()`, all subsequent callers will receive the cached rejection indefinitely, permanently breaking the data flow ("Poisoned Cache").
</details>

**Q4:** Why is adding randomized "Jitter" critical when implementing Exponential Backoff retries?  
<details>
<summary><strong>Answer</strong></summary>
Without jitter, all failing clients calculate identical retry delays ($1\text{s}, 2\text{s}, 4\text{s}$), causing thousands of clients to retry simultaneously in synchronized waves ("Thundering Herd" problem). Adding randomized jitter spreads retry attempts evenly across time, smoothing server load.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** Why is auto-retrying non-idempotent operations like `POST /checkout/charge` dangerous, and how do you make mutations retry-safe?  
<details>
<summary><strong>Answer</strong></summary>
If a network timeout occurs after the server processed the payment but before the response reached the client, retrying `POST /checkout/charge` will execute a second charge, duplicating transactions. To make mutations retry-safe, the client generates a unique `Idempotency-Key` (UUID) in the request header. If the server receives a retry with the same key, it returns the cached result of the original transaction without re-executing the charge.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How do you architect a multi-tier resilient data client in a high-scale React/TypeScript application that unifies in-flight deduplication, stale-while-revalidate caching, adaptive rate limiting, and telemetry profiling?  
<details>
<summary><strong>Answer</strong></summary>
1. **Transport Layer:** Encapsulates `fetch`, status normalization into `ApiError`, and `AbortSignal` timeout handling.  
2. **Resilient Middleware:**  
   - **In-Flight Registry:** `Map<string, Promise<T>>` with auto-eviction on settle.  
   - **Retry Engine:** Idempotent method filter (`GET`, `PUT`, `DELETE`), exponential backoff with full jitter, and `Retry-After` header parsing for HTTP 429.  
3. **Cache Storage (SWR):** Normalized key storage with TTL expiration. Serves stale cache instantly while triggering background revalidation.  
4. **Telemetry & Tracing:** Emits `traceId`, duration metrics, and error causes to APM endpoints (Sentry / Datadog).  
5. **React Hook Boundary:** Manages 8-state discriminated union machine, binding `AbortController` to the component lifecycle to prevent leaks on unmount.
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Resilient API Client

```js
// See runnable implementation in examples/06-advanced-async-patterns-retries-deduplication.js
```

---

## Key Takeaways
1. **Select Combinator by Failure Policy:** `Promise.all` (mandatory), `allSettled` (resilient), `any` (first success).
2. **Prevent Poisoned In-Flight Caches:** Always delete pending Promises in `.finally()`.
3. **Always Add Jitter to Retries:** Prevents synchronized server retry storms.
4. **Only Retry Idempotent Operations:** Never blindly retry mutations (`POST /pay`).
5. **Separate Transport from UI:** Centralize retries, deduplication, and error mapping in an `apiClient`.

---

[⬅️ Part 05: Real-World `fetch`, Cancellation, Timeouts & Race Conditions](./05-real-world-fetch-cancellation-race-conditions.md) | [📚 KPI 13 Index](./README.md) | [KPI 14 — Modules & Architecture ➡️](../20-Modules-ESM/README.md)
