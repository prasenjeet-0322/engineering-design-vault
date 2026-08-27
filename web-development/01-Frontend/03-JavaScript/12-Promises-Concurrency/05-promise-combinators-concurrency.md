# KPI 12 — Part 05: Promise Combinators & Concurrency Coordination

[⬅️ Part 04: Promise Creation, Static Methods & Anti-Patterns](./04-promise-creation-static-methods.md) | [📚 KPI 12 Index](./README.md) | [Part 06: Advanced Patterns, Microtasks & Scheduling ➡️](./06-promise-microtasks-scheduling-advanced-patterns.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Combinator | Settlement Condition | Rejection Condition | Returned Result | Primary Senior Standard |
|---|---|---|---|---|
| **`Promise.all(iterable)`** | When **ALL** fulfill. | **Fail-Fast**: Rejects on the **FIRST** rejection. | Array of values `[v1, v2, ...]`. | 🟢 Use when **all** operations are strictly required (critical dashboard state). |
| **`Promise.allSettled(iterable)`**| When **ALL** settle (fulfill or reject). | **Never rejects**. | Array of `{ status, value \| reason }`. | 🟢 Use for resilient partial-failure UI rendering (optional widgets, telemetry). |
| **`Promise.race(iterable)`** | When the **FIRST** settles (fulfill or reject). | If the **first** settled promise rejects. | Value or Error of the winner. | 🟡 Use for timeout races (must pair with `AbortController` to avoid leaks). |
| **`Promise.any(iterable)`** | When the **FIRST** fulfills. | Rejects ONLY if **ALL** reject (`AggregateError`). | Value of first fulfilled promise. | 🟢 Use for multi-source failover (redundant CDNs, multi-region API fallback). |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: `Promise.all` Fail-Fast Leakage & The `forEach(async ...)` Trap
> 
> #### Gotcha A: `Promise.all()` Fail-Fast Does NOT Cancel In-Flight Requests
> *"Why did our backend receive 100 heavy database query hits even though `Promise.all()` rejected in 5 milliseconds?"*  
> ```js
> // ❌ UNGUARDED CONCURRENT FAIL-FAST:
> Promise.all([
>   fetchCriticalAuth(), // Fails in 5ms!
>   ...hundredHeavyQueries() // 💥 Continues running in the background for 10 seconds!
> ]).catch((err) => console.error("Failed fast:", err));
> ```
> **Deep Architectural Explanation:**  
> `Promise.all()` immediately rejects as soon as the first input Promise rejects. However, JavaScript Promises do **not** possess cancellation semantics. The other 99 network requests continue executing to completion in the background, consuming socket pool connections, client RAM, and backend database compute.  
> **The Senior Standard:** Pair `Promise.all()` with `AbortController` signals to cancel peer in-flight requests when one rejects.
> 
> ---
> 
> #### Gotcha B: The `forEach(async ...)` Silent Race Bug
> *"Why did our database migration script print `Done!` before any records were actually updated?"*  
> ```js
> // ❌ BROKEN ASYNC ITERATION:
> records.forEach(async (record) => {
>   // 💥 forEach does NOT await or return promises!
>   await updateDatabase(record);
> });
> console.log("Done!"); // 💥 Prints IMMEDIATELY before updates finish!
> ```
> **Deep Architectural Explanation:**  
> `Array.prototype.forEach()` is completely oblivious to Promises returned by its callback. It fires all iterations synchronously and immediately returns `undefined`.  
> **The Senior Standard:**  
> - For **concurrent execution**: `await Promise.all(records.map(r => updateDatabase(r)))`  
> - For **sequential execution**: `for (const record of records) { await updateDatabase(record); }`

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / TypeScript Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | `Promise.all` for multi-fetching, `allSettled` for optional dashboard cards, `Promise.all(items.map)` | Fundamental primitive for orchestrating parallel I/O and coordinating multi-endpoint queries. |
| 🟡 **Moderate** | Used in ~45% of code | `Promise.any` for multi-CDN fallback, `Promise.race` for network timeout limits, Concurrency pools | Critical for resilient network architectures, asset pre-loaders, and rate-limited batch processing. |
| 🔵 **Foundational / Engine** | Runtime internals | ECMAScript Promise Combinator algorithms, Microtask scheduling during combinator resolutions | Essential for building data-fetching libraries (TanStack Query, SWR), RPC frameworks, and Staff interviews. |

---

## Core Concepts (20 Subtopics)

### Part 1 — Asynchronous Dependency Graphs `🟢 [Daily Driver]`

Before writing async code, map operations into a directed graph:
- **Sequential Edge ($A \to B$):** Step B strictly requires the output of Step A.
- **Concurrent Nodes ($B \parallel C$):** Independent operations that can execute in parallel.

```text
       fetchUser(id)
             │
      ┌──────┴──────┐
      ▼             ▼
  fetchPosts   fetchProfile   (Concurrent via Promise.all)
      │             │
      └──────┬──────┘
             ▼
        renderDashboard
```

---

### Part 2 — Input Preservation Invariant `🔵 [Foundational / Engine]`

`Promise.all` and `Promise.allSettled` **always guarantee that the output array matches the input iterable order**, regardless of which Promise finished first in time.

---

### Part 3 — `Promise.all()`: Fail-Fast All-or-Nothing `🟢 [Daily Driver]`

Waits for all Promises to fulfill. If any single Promise rejects, the entire `Promise.all` rejects immediately with that error reason.

---

### Part 4 — The Fail-Fast Non-Cancellation Trap `🔴 [Production-Critical]`

`Promise.all` rejecting does **not** stop peer promises from running. Use `AbortController` to abort sibling tasks explicitly.

---

### Part 5 — `Promise.allSettled()`: Resilient Partial Failure Inspection `🟢 [Daily Driver]`

Never rejects. Waits for all input Promises to settle, returning an array of settlement descriptor objects.

---

### Part 6 — Discriminated Result Tuples `🟢 [Daily Driver]`

```ts
type PromiseSettledResult<T> =
  | { status: 'fulfilled'; value: T }
  | { status: 'rejected'; reason: any };
```

---

### Part 7 — Decoupling Critical vs Optional UI Boundaries `🟢 [Daily Driver]`

Use `Promise.all` for critical required dependencies (user auth) and `Promise.allSettled` for optional non-critical widgets (recommendations, ads).

---

### Part 8 — `Promise.race()`: First-Settled Winner `🟢 [Daily Driver]`

Settles as soon as the **first** Promise settles (whether fulfilled or rejected).

---

### Part 9 — The `Promise.race()` Timeout Anti-Pattern `🔴 [Production-Critical]`

Racing `fetch()` against a `timeout(5000)` promise rejects the race on timeout, but leaves the underlying network request running unless cancelled with `AbortSignal`.

---

### Part 10 — `Promise.any()`: First-Fulfilled Winner `🟢 [Daily Driver]`

Ignores rejections and fulfills as soon as the **first** Promise fulfills.

---

### Part 11 — `AggregateError` Mechanics `🟢 [Daily Driver]`

If all Promises passed to `Promise.any()` reject, it rejects with an `AggregateError` containing an `.errors` array:
```js
Promise.any([Promise.reject("E1"), Promise.reject("E2")])
  .catch((err) => console.log(err.errors)); // ['E1', 'E2']
```

---

### Part 12 — `Promise.race()` vs `Promise.any()` Dissected `🟢 [Daily Driver]`

| Attribute | `Promise.race()` | `Promise.any()` |
|---|---|---|
| **Winner Criteria** | First to **settle** (Fulfill or Reject) | First to **fulfill** (Success only) |
| **Rejection Handling** | Rejects if first settler rejects | Ignores rejections until **all** fail |
| **All Fail Outcome** | Rejects with the 1st error | Rejects with `AggregateError` |

---

### Part 13 — The 4-Combinator Decision Matrix `🟢 [Daily Driver]`

$$\text{Need All? } \begin{cases} \text{Must All Succeed?} \implies \mathbf{Promise.all()} \\ \text{Allow Partial Failure?} \implies \mathbf{Promise.allSettled()} \end{cases}$$
$$\text{Need First? } \begin{cases} \text{First to Settle (Timer/Race)?} \implies \mathbf{Promise.race()} \\ \text{First Successful (Failover)?} \implies \mathbf{Promise.any()} \end{cases}$$

---

### Part 14 — The Accidental Sequential `await` Trap `🔴 [Production-Critical]`

Writing `const a = await f1(); const b = await f2();` serializes independent requests. Use `await Promise.all([f1(), f2()])`.

---

### Part 15 — The `forEach(async ...)` Silent Concurrency Bug `🔴 [Production-Critical]`

`forEach` does not await async callbacks. Always use `Promise.all(items.map(...))` for concurrent iteration.

---

### Part 16 — Concurrency Saturation & Overload `🔴 [Production-Critical]`

Firing `Promise.all(10000Requests)` saturates browser HTTP/1.1 socket limits (max 6 per domain), spikes server load, and exhausts memory.

---

### Part 17 — Enterprise Concurrency Throttling & Pool Limiting `🟢 [Daily Driver]`

Implement a worker pool (e.g. `p-limit`) to restrict concurrency to $N$ active tasks at any time:
```js
const pool = new ConcurrencyPool(5); // Max 5 parallel tasks
await Promise.all(urls.map(url => pool.run(() => fetch(url))));
```

---

### Part 18 — Heterogeneous Dependency Graph Orchestration `🟢 [Daily Driver]`

Combine sequential steps and parallel batches to match exact business data flow.

---

### Part 19 — Error Boundaries in Multi-Request Aggregations `🟢 [Daily Driver]`

Catch errors at the individual promise level before passing to `Promise.all` if you want local default values.

---

### Part 20 — 10-Point Promise Concurrency Audit Checklist `🟢 [Daily Driver]`

```text
1. Are independent network requests batched concurrently rather than serialized?
2. Is Promise.allSettled used whenever partial failure can still yield a functional UI?
3. Is Promise.all paired with AbortController to cancel orphaned peer requests?
4. Are async callbacks in forEach replaced with Promise.all(items.map(...))?
5. Is Promise.any used for multi-region or multi-CDN asset failovers?
6. Are Promise.race timeouts accompanied by explicit socket/timer cleanup?
7. Is concurrency throttled when processing large collections (>50 items)?
8. Are AggregateError.errors inspected when debugging Promise.any rejections?
9. Does Promise.all output mapping rely on input index preservation?
10. Are critical dependency errors caught and displayed with actionable recovery?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Combinator | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **`Promise.all`** | Fetching strictly interdependent data where any failure invalidates the entire view. | Optional UI widgets or high-risk third-party APIs. | Fails fast; does not abort peer requests automatically. | `Promise.allSettled`. |
| **`Promise.allSettled`** | Dashboards with decoupled widgets (notifications, profile, stats). | Atomic transactional pipelines (e.g. payment processing). | Requires manual unpacking of `{ status, value/reason }` objects. | `Promise.all`. |
| **`Promise.race`** | Enforcing strict network timeout thresholds or racing against cancellation tokens. | Multi-source data redundancy (rejections trigger early exit). | Leaks un-aborted network connections on timeout. | `Promise.any` / `AbortSignal.timeout()`. |
| **`Promise.any`** | Multi-CDN asset loading, multi-region database reads, fallback mirrors. | Scenarios where the first error must be surfaced to the user. | Allocates `AggregateError` when all reject; newer API (ES2021). | `Promise.race`. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Dashboard Aggregator with Concurrency Throttling in TypeScript
```tsx
import React, { useState, useCallback } from 'react';

// ==========================================
// 1. CONCURRENCY POOL THROTTLER
// ==========================================
export class ConcurrencyThrottler {
  private activeCount = 0;
  private queue: (() => void)[] = [];

  constructor(private maxConcurrency: number) {}

  public run<T>(taskFn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const execute = () => {
        this.activeCount++;
        taskFn()
          .then(resolve)
          .catch(reject)
          .finally(() => {
            this.activeCount--;
            if (this.queue.length > 0) {
              const next = this.queue.shift();
              next?.();
            }
          });
      };

      if (this.activeCount < this.maxConcurrency) {
        execute();
      } else {
        this.queue.push(execute);
      }
    });
  }
}

// ==========================================
// 2. DASHBOARD DATA TYPES & AGGREGATOR
// ==========================================
export interface UserProfile { id: string; name: string; }
export interface UserNotification { id: string; text: string; }
export interface DashboardData {
  profile: UserProfile;
  notifications: UserNotification[];
  recommendations: string[];
}

export function loadEnterpriseDashboard(userId: string): Promise<DashboardData> {
  const throttler = new ConcurrencyThrottler(2); // Throttled to max 2 concurrent requests

  const fetchProfile = () =>
    throttler.run(() =>
      Promise.resolve({ id: userId, name: 'Alice Engineer' } as UserProfile)
    );

  const fetchNotifications = () =>
    throttler.run(() =>
      Promise.resolve([{ id: 'N1', text: 'Deployment Successful' } as UserNotification])
    );

  const fetchRecommendations = () =>
    throttler.run(() =>
      new Promise<string[]>((_, reject) =>
        setTimeout(() => reject(new Error('Recommendation Engine Offline')), 50)
      )
    );

  // 🟢 Critical (all) + Optional (allSettled) Composition Strategy
  return Promise.all([fetchProfile(), fetchNotifications()]).then(([profile, notifications]) => {
    return Promise.allSettled([fetchRecommendations()]).then(([recResult]) => {
      const recommendations = recResult.status === 'fulfilled' ? recResult.value : ['Default Fallback Topic'];
      return { profile, notifications, recommendations };
    });
  });
}

// ==========================================
// 3. REACT DASHBOARD COMPONENT
// ==========================================
export function EnterpriseDashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loadEnterpriseDashboard('USR-100');
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="dashboard-card">
      <h3>Enterprise Dashboard Aggregator</h3>
      <p>Demonstrates mixed Critical <code>Promise.all</code> + Optional <code>Promise.allSettled</code> coordination.</p>

      <button onClick={handleLoad} disabled={isLoading} className="primary-button">
        {isLoading ? 'Aggregating Feeds...' : 'Load Dashboard Feeds'}
      </button>

      {error && <div className="error-banner">⚠️ Critical Load Failure: {error}</div>}

      {data && (
        <div className="feed-grid">
          <div className="feed-col">
            <h4>User Profile:</h4>
            <p><strong>{data.profile.name}</strong> (ID: {data.profile.id})</p>
          </div>

          <div className="feed-col">
            <h4>Notifications:</h4>
            <ul>
              {data.notifications.map((n) => <li key={n.id}>{n.text}</li>)}
            </ul>
          </div>

          <div className="feed-col">
            <h4>Recommendations (Resilient Fallback):</h4>
            <ul>
              {data.recommendations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🧠 Part 05 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: `Promise.all()` Result Index Preservation
```js
const slow = new Promise((resolve) => setTimeout(() => resolve("Slow (30ms)"), 30));
const fast = new Promise((resolve) => setTimeout(() => resolve("Fast (10ms)"), 10));

Promise.all([slow, fast]).then((results) => {
  console.log("Index 0:", results[0]);
  console.log("Index 1:", results[1]);
});
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Index 0: Slow (30ms)
Index 1: Fast (10ms)
```
**Why:** `Promise.all()` preserves input array order, placing each resolved value at its corresponding input index regardless of completion timing.
</details>

---

### Prediction Challenge 2: `Promise.race()` vs `Promise.any()` on Fast Rejection
```js
const fastFail = new Promise((_, reject) => setTimeout(() => reject("Fast Error"), 10));
const slowSuccess = new Promise((resolve) => setTimeout(() => resolve("Slow Success"), 30));

Promise.race([fastFail, slowSuccess])
  .catch((err) => console.log("Race Result:", err));

Promise.any([fastFail, slowSuccess])
  .then((val) => console.log("Any Result:", val));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Race Result: Fast Error
Any Result: Slow Success
```
**Why:** `Promise.race()` settles on the very first settlement (rejection wins at 10ms). `Promise.any()` ignores rejections and waits for the first fulfillment (success wins at 30ms).
</details>

---

### Prediction Challenge 3: `Promise.allSettled()` Structure
```js
Promise.allSettled([
  Promise.resolve("Data A"),
  Promise.reject(new Error("Network Down"))
]).then((results) => {
  console.log("Result 0 Status:", results[0].status);
  console.log("Result 1 Status:", results[1].status);
});
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Result 0 Status: fulfilled
Result 1 Status: rejected
```
**Why:** `Promise.allSettled()` resolves an array of `{ status: 'fulfilled', value }` and `{ status: 'rejected', reason }` descriptors, never rejecting.
</details>

---

### Prediction Challenge 4: `Promise.any()` with All Rejections (`AggregateError`)
```js
Promise.any([
  Promise.reject("Err 1"),
  Promise.reject("Err 2")
]).catch((err) => {
  console.log("Caught Instance:", err.name);
  console.log("Errors Array:", err.errors);
});
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Caught Instance: AggregateError
Errors Array: [ 'Err 1', 'Err 2' ]
```
**Why:** When all inputs to `Promise.any()` reject, it rejects with an `AggregateError` containing the individual rejection reasons inside `.errors`.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is the primary difference between `Promise.all()` and `Promise.allSettled()`?  
<details>
<summary><strong>Answer</strong></summary>
`Promise.all()` is fail-fast: if any promise rejects, it rejects immediately and discards all other results. In contrast, `Promise.allSettled()` waits for all promises to finish (whether they fulfill or reject) and returns an array of status descriptor objects, never rejecting.
</details>

**Q2:** Does `Promise.all()` return results in the order they were resolved or the order they were passed in?  
<details>
<summary><strong>Answer</strong></summary>
`Promise.all()` **always preserves input array order**. If the first promise takes 5 seconds and the second takes 1 second, the resulting array will still have the 5-second result at index 0 and the 1-second result at index 1.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** What happens when all promises passed to `Promise.any()` reject?  
<details>
<summary><strong>Answer</strong></summary>
When all input promises reject, `Promise.any()` rejects with an `AggregateError` object. This error groups all individual rejection reasons into an array accessible via `error.errors`.
</details>

**Q4:** Why is using `Array.prototype.forEach()` with an `async` callback an anti-pattern, and what should you use instead?  
<details>
<summary><strong>Answer</strong></summary>
`forEach` does not await or return the Promises generated by its `async` callback; it runs synchronously and exits immediately, causing subsequent code to execute before the async tasks finish. For concurrent execution, use `await Promise.all(items.map(async fn))`; for sequential execution, use a standard `for (const item of items) { await fn(item); }` loop.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** Why is using `Promise.all()` without concurrency limits dangerous when processing large datasets ($>1000$ items) in a browser?  
<details>
<summary><strong>Answer</strong></summary>
Browsers enforce a strict limit on simultaneous HTTP connections per domain (typically 6 connections for HTTP/1.1). Firing 1000 requests via `Promise.all()` saturates the browser socket pool, causes extreme connection queuing, spikes memory allocations on the V8 heap, and can trigger 429 Rate Limit HTTP errors on backend servers. Production code should use a **Concurrency Pool / Throttle** (e.g. `p-limit`) to limit active in-flight requests to $N$ (e.g. 5–10).
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How do you design an enterprise resilient multi-region read-failover architecture combining `Promise.any()`, `AbortController`, and Exponential Backoff?  
<details>
<summary><strong>Answer</strong></summary>
1. **Multi-Region Race with `Promise.any()`:** Dispatch read requests simultaneously to primary (US-East), secondary (US-West), and tertiary (EU-Central) endpoints.  
2. **First-Success Winner:** `Promise.any()` fulfills on the fastest successful region response, ignoring transient timeouts from degraded regions.  
3. **Coordinated Abort Teardown:** Once the fastest region fulfills, pass its signal to an `AbortController` to immediately abort the remaining in-flight requests to the slower regions, freeing socket bandwidth and reducing cloud egress costs.  
4. **Aggregate Error Fallback:** If all regions fail (`AggregateError`), catch the error and fall back to local IndexedDB/ServiceWorker offline storage.
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Concurrency Pool & Throttled Combinator

```js
// See runnable implementation in examples/05-promise-combinators-concurrency.js
```

---

## Key Takeaways
1. **`Promise.all` Preserves Input Order:** Result indices strictly match input indices.
2. **Fail-Fast Does NOT Cancel I/O:** Always pair `Promise.all` with `AbortController`.
3. **Use `allSettled` for Optional UI:** Prevent one broken widget from taking down the page.
4. **`race` is First Settled, `any` is First Success:** `any` rejects only on all failures (`AggregateError`).
5. **Throttle Concurrency:** Use a pool limiter to avoid exhausting browser socket limits.

---

[⬅️ Part 04: Promise Creation, Static Methods & Anti-Patterns](./04-promise-creation-static-methods.md) | [📚 KPI 12 Index](./README.md) | [Part 06: Advanced Patterns, Microtasks & Scheduling ➡️](./06-promise-microtasks-scheduling-advanced-patterns.md)
