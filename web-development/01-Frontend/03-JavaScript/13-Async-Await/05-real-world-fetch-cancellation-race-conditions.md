# KPI 13 — Part 05: Real-World `fetch`, HTTP Errors, `AbortController`, Cancellation, Timeouts & Race Conditions

[⬅️ Part 04: Async Iteration, Loops & `for await...of`](./04-async-iteration-loops.md) | [📚 KPI 13 Index](./README.md) | [Part 06: Advanced Async Patterns, Retries, Deduplication & Telemetry ➡️](./06-advanced-async-patterns-retries-deduplication.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Network Dimension | Core Problem / Mechanism | Production Impact | Senior Architectural Standard |
|---|---|---|---|
| **Dual-Stage Fetch** | `fetch()` $\to$ headers; `res.json()` $\to$ body stream. | Both are distinct async operations. | 🟢 Always check `response.ok` before calling `response.json()`. |
| **HTTP Error Trap** | HTTP 404/500 fulfills `fetch()`! | `.catch()` will NOT run on HTTP 500. | 🔴 Explicitly check `if (!res.ok) throw new ApiError(res.status)`. |
| **Cancellation** | `AbortController` + `AbortSignal`. | Cancels socket, saves bandwidth. | 🟢 Wire `signal` to `fetch()` and call `controller.abort()`. |
| **Cancellation Filter** | Aborting throws `AbortError`. | Could show accidental error alerts. | 🟢 Filter out `err.name === 'AbortError'` in UI catch blocks. |
| **True Timeout** | Stalled connection hang. | Sockets remain open indefinitely. | 🟢 Use `AbortSignal.timeout(ms)` to cancel TCP connection. |
| **Search Race Condition** | Fast query finishes before slower query. | Stale network data overwrites UI. | 🟢 Combine `AbortController` abort with monotonic Request IDs. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: `fetch()` HTTP 404/500 Fulfillment & Search Race Conditions
> 
> #### Gotcha A: `fetch()` Fulfills on HTTP 404 / 500 Responses
> *"Why did our React error boundary fail to render when the backend returned an HTTP 500 Internal Server Error?"*  
> ```js
> // ❌ BROKEN ERROR HANDLING:
> try {
>   const res = await fetch("/api/user/999");
>   // 💥 res fulfills on HTTP 500 with `{ ok: false, status: 500 }`!
>   const user = await res.json(); // May parse `{ error: "DB Failure" }`
>   renderUserProfile(user.name); // 💥 CRASH: TypeError (user.name is undefined)!
> } catch (err) {
>   // 💥 THIS CATCH BLOCK NEVER RUNS FOR HTTP 500!
>   showGlobalErrorModal(err);
> }
> ```
> **Deep Architectural Explanation:**  
> The W3C Fetch specification dictates that `fetch()` rejects **only on transport-level network failures** (DNS resolution failure, offline device, TCP connection reset). An HTTP `404 Not Found` or `500 Server Error` represents a successful HTTP transaction with the server, so `fetch()` fulfills with a `Response` object where `response.ok === false`.  
> **The Senior Standard:** Always validate `response.ok` before parsing JSON:
> ```js
> if (!response.ok) {
>   const errPayload = await response.json().catch(() => null);
>   throw new ApiError(`HTTP ${response.status}`, response.status, errPayload);
> }
> ```
> 
> ---
> 
> #### Gotcha B: Search-as-You-Type Race Conditions & Stale UI Overwrites
> *"Why does typing 'react' into our search input intermittently display stale search results for 'rea'?"*  
> ```text
> Timeline:
> User types "rea"   ──> Dispatch Req A (Takes 400ms) ───────────> Arrives at T=400ms (OVERWRITES UI!)
> User types "react" ──> Dispatch Req B (Takes 100ms) ──> Arrives at T=100ms (Shows "react")
> ```
> **Deep Architectural Explanation:**  
> Network latency is non-deterministic. If Request A takes longer to resolve than Request B, Request A's continuation will execute last, permanently overwriting the newer UI state with stale data.  
> **The Senior Standard:** Combine active `AbortController` cancellation with monotonic `requestId` sequence verification.

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / TypeScript Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | `fetch` abstractions, checking `response.ok`, canceling queries in `useEffect` cleanup | Fundamental building block of all modern frontend data-fetching architectures. |
| 🟡 **Moderate** | Used in ~45% of code | `AbortSignal.timeout(ms)`, `AbortSignal.any()`, defense-in-depth request ID versioning | Critical for search autocomplete typeaheads, tab-switching views, and resilient SDK clients. |
| 🔵 **Foundational / Engine** | Runtime internals | Fetch Stream piping, TCP connection pooling, `AbortSignal` event dispatching | Mandatory for Staff/Principal architecture reviews, SDK design, and systems engineering. |

---

## Core Concepts (20 Subtopics)

### Part 1 — The Dual-Stage `fetch()` Pipeline `🟢 [Daily Driver]`

1. `fetch(url)`: Fulfills when HTTP headers arrive ($\text{Promise}\langle\text{Response}\rangle$).
2. `response.json()`: Fulfills when the response stream body is fully downloaded and parsed ($\text{Promise}\langle\text{Data}\rangle$).

---

### Part 2 — Transport Rejections vs HTTP 4xx/5xx Non-Rejections `🟢 [Daily Driver]`

- **Rejections:** DNS failure, offline network, CORS block, SSL certificate error.
- **Fulfillments:** HTTP 200, 301, 400, 401, 403, 404, 500, 503.

---

### Part 3 — The `response.ok` Status Code Invariant `🟢 [Daily Driver]`

`response.ok` is `true` if `status >= 200 && status <= 299`. Always guard before parsing.

---

### Part 4 — Structured HTTP Error Normalization `🟢 [Daily Driver]`

```ts
export class ApiError extends Error {
  constructor(message: string, public status: number, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}
```

---

### Part 5 — HTTP Status-Driven UI Routing `🟢 [Daily Driver]`

- **401 Unauthorized:** Trigger token refresh or redirect to `/login`.
- **403 Forbidden:** Display "Access Denied" permissions banner.
- **404 Not Found:** Render custom `<NotFoundCard />`.
- **500 Server Error:** Display retry toast or error boundary.

---

### Part 6 — Request Cancellation Fundamentals with `AbortController` `🟢 [Daily Driver]`

```js
const controller = new AbortController();
fetch("/api/data", { signal: controller.signal });
controller.abort(); // Immediately cancels TCP socket
```

---

### Part 7 — `AbortSignal` State Propagation `🟢 [Daily Driver]`

Pass a single `controller.signal` to multiple concurrent queries (`Promise.all`) to abort all related queries simultaneously with one call to `abort()`.

---

### Part 8 — Cancellation vs Failure Semantics `🟢 [Daily Driver]`

```js
try {
  const data = await request(url, { signal });
} catch (err) {
  if (err.name === "AbortError") return; // 🟢 Expected user cancellation; do not alert!
  showErrorMessage(err);
}
```

---

### Part 9 — True Request Timeouts `🔴 [Production-Critical]`

`Promise.race` alone does NOT cancel platform network sockets! Use `AbortController` to abort the socket when the timer expires:
```js
function fetchWithTimeout(url, options, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}
```

---

### Part 10 — Native `AbortSignal.timeout(ms)` `🟢 [Daily Driver]`

```js
const res = await fetch("/api/data", { signal: AbortSignal.timeout(5000) });
```

---

### Part 11 — React Component Lifecycle Teardowns (`useEffect`) `🟢 [Daily Driver]`

```tsx
useEffect(() => {
  const controller = new AbortController();
  loadData(controller.signal);
  return () => controller.abort(); // 🟢 Cancels in-flight query on unmount!
}, []);
```

---

### Part 12 — The Search-as-You-Type Async Race Condition `🔴 [Production-Critical]`

Rapid typing creates out-of-order network settlements where stale older responses overwrite newer state.

---

### Part 13 — "Latest-Request-Wins" Pattern via Active Controller Abort `🟢 [Daily Driver]`

Store `activeController` in a closure or `useRef`. Abort previous controller before dispatching new query.

---

### Part 14 — Monotonic Request ID / Version Sequence Guarding `🟢 [Daily Driver]`

```js
let latestId = 0;
async function search(q) {
  const id = ++latestId;
  const data = await fetchSearch(q);
  if (id !== latestId) return; // 🟢 Discard stale response
  render(data);
}
```

---

### Part 15 — The Defense-in-Depth Strategy `🟢 [Daily Driver]`

Combine **`AbortController` cancellation** (to free bandwidth) with **Request ID versioning** (to guard downstream processing after network settlement).

---

### Part 16 — Stale Closure & Stale State Traps `🔴 [Production-Critical]`

State values captured at the start of an async function can become obsolete during an `await` pause. Always verify relevance before applying state updates.

---

### Part 17 — Loading-State Race Conditions `🟢 [Daily Driver]`

Guard loading spinners so only the latest active request is permitted to toggle `setLoading(false)`.

---

### Part 18 — Request Lifecycle State Machine `🟢 [Daily Driver]`

```text
[ IDLE ] ──> [ LOADING ] ──┬──> [ SUCCESS ]
                           ├──> [ HTTP_ERROR ]
                           ├──> [ NETWORK_ERROR ]
                           ├──> [ TIMEOUT ]
                           └──> [ CANCELLED ]
```

---

### Part 19 — Architectural Request Ownership `🟢 [Daily Driver]`

- **Search Query:** Owned by the search input interaction.
- **Route Data:** Owned by the Page / Route lifecycle.
- **Auth Session:** Owned by the root application context.

---

### Part 20 — 10-Point Enterprise Fetch & Cancellation Checklist `🟢 [Daily Driver]`

```text
1. Is response.ok explicitly validated before calling response.json()?
2. Are HTTP error status codes mapped into typed domain exceptions?
3. Are search typeaheads protected with AbortController cancellation?
4. Are monotonic Request IDs used as defense-in-depth against race conditions?
5. Are AbortError exceptions silently ignored in UI catch blocks?
6. Are component-level fetches aborted on React unmount?
7. Are network timeouts implemented with AbortSignal to close sockets?
8. Are loading indicators guarded against premature toggle by stale responses?
9. Is request state modeled as an explicit discriminated union?
10. Are critical dashboard requests separated from optional degrading widgets?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Strategy | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Raw `fetch()`** | Quick one-off scripts or simple isolated test mocks. | Enterprise frontend applications with auth, metrics, and error contracts. | Verbose; requires manual `response.ok` and error checking every time. | Centralized `apiClient`. |
| **Centralized `apiClient`** | Production SPAs requiring unified headers, auth interceptors, and error mapping. | Lightweight static sites making a single unauthenticated API call. | Centralized abstraction layer to maintain. | TanStack Query / Axios. |
| **`AbortController` Cancellation** | Search-as-you-type inputs, tab switching, and route transition teardowns. | Atomic fire-and-forget telemetry beacons that must complete. | Throws `AbortError` which must be caught and ignored in UI. | Request ID sequencing. |
| **Request ID Sequencing** | When underlying transport does not support `AbortController` or downstream async transforms exist. | Heavy file downloads where bandwidth must be saved immediately. | Network bandwidth is still consumed in the background. | `AbortController`. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Search Typeahead with Combined `AbortController` & Request ID State Machine in TypeScript
```tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';

// ==========================================
// 1. DATA TYPES & API CLIENT
// ==========================================
export interface SearchItem { id: string; title: string; category: string; }

export class HttpError extends Error {
  constructor(message: string, public status: number, public data?: any) {
    super(message);
    this.name = 'HttpError';
  }
}

async function searchApi(query: string, signal: AbortSignal): Promise<SearchItem[]> {
  const url = `https://jsonplaceholder.typicode.com/posts?userId=1&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, { signal });

  // 🟢 1. Validate response.ok
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new HttpError(`HTTP Error ${response.status}`, response.status, errorData);
  }

  const posts = (await response.json()) as any[];
  return posts.slice(0, 4).map((p) => ({
    id: String(p.id),
    title: p.title,
    category: 'Documentation',
  }));
}

// ==========================================
// 2. REACT SEARCH TYPEAHEAD COMPONENT
// ==========================================
export function EnterpriseSearchTypeahead() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [error, setError] = useState<string | null>(null);

  const activeControllerRef = useRef<AbortController | null>(null);
  const latestRequestIdRef = useRef<number>(0);

  const executeSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setStatus('IDLE');
      return;
    }

    // 🟢 2. Abort previous in-flight request to eliminate race conditions
    activeControllerRef.current?.abort();
    activeControllerRef.current = new AbortController();

    // 🟢 3. Monotonic Request ID tagging (Defense-in-depth)
    const requestId = ++latestRequestIdRef.current;

    setStatus('LOADING');
    setError(null);

    try {
      const data = await searchApi(searchQuery, activeControllerRef.current.signal);

      // 🟢 4. Discard result if newer request was dispatched
      if (requestId !== latestRequestIdRef.current) return;

      setResults(data);
      setStatus('SUCCESS');
    } catch (err: any) {
      // 🟢 5. Silently ignore intentional user cancellation
      if (err.name === 'AbortError') return;

      if (requestId === latestRequestIdRef.current) {
        setError(err.message || 'Search failed');
        setStatus('ERROR');
      }
    } finally {
      // 🟢 6. Only latest request can reset loading status
      if (requestId === latestRequestIdRef.current && status === 'LOADING') {
        // Handled in SUCCESS/ERROR branches
      }
    }
  }, [status]);

  useEffect(() => {
    executeSearch(query);

    // 🟢 7. Cleanup on unmount or input update
    return () => {
      activeControllerRef.current?.abort();
    };
  }, [query, executeSearch]);

  return (
    <div className="search-typeahead-card">
      <h3>Enterprise Typeahead Search</h3>
      <p>Demonstrates <code>AbortController</code> cancellation + Monotonic Request ID race condition guarding.</p>

      <input
        type="text"
        placeholder="Search documentation (e.g. 'react')..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-input"
      />

      <div className="status-badge">
        Status: <strong><code>{status}</code></strong>
      </div>

      {error && <div className="error-banner">⚠️ Search Error: {error}</div>}

      <ul className="results-list">
        {results.map((item) => (
          <li key={item.id}>
            <strong>{item.title}</strong> — <small>{item.category}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 🧠 Part 05 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: `fetch()` on HTTP 404
```js
async function loadItem() {
  try {
    const res = await fetch("/api/missing-item");
    console.log("Status:", res.status);
    console.log("Is OK?:", res.ok);
    const data = await res.json();
    return data;
  } catch (err) {
    console.log("Caught:", err.message);
  }
}
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Status: 404
Is OK?: false
(If response body is valid JSON, `.catch()` NEVER runs!)
```
**Why:** `fetch()` only rejects on network-level socket disconnects or DNS failures. HTTP 404 fulfills `fetch()` successfully with `response.ok === false`.
</details>

---

### Prediction Challenge 2: Search Race Condition Sequence
```js
let activeSequence = 0;

async function querySearch(term, delayMs) {
  const seq = ++activeSequence;
  const result = await new Promise((res) => setTimeout(() => res({ term, seq }), delayMs));
  if (result.seq !== activeSequence) {
    console.log(`Discarded Stale Result for: "${result.term}"`);
    return;
  }
  console.log(`Rendered Fresh Result for: "${result.term}"`);
}

querySearch("rea", 50);   // Dispatched 1st (Takes 50ms)
querySearch("react", 10); // Dispatched 2nd (Takes 10ms)
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Rendered Fresh Result for: "react"
Discarded Stale Result for: "rea"
```
**Why:** At $T=10\text{ms}$, `"react"` resolves with `seq = 2 === activeSequence` and renders. At $T=50\text{ms}$, `"rea"` resolves with `seq = 1 !== activeSequence` and is safely discarded.
</details>

---

### Prediction Challenge 3: Differentiating `AbortError` from Network Failures
```js
const controller = new AbortController();

async function run() {
  try {
    const p = fetch("https://jsonplaceholder.typicode.com/posts/1", { signal: controller.signal });
    controller.abort();
    await p;
  } catch (err) {
    if (err.name === "AbortError") {
      console.log("Silently Ignored Cancellation");
      return;
    }
    console.log("Fatal Error:", err.message);
  }
}

run();
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Silently Ignored Cancellation
```
**Why:** Calling `controller.abort()` causes `fetch()` to reject with a DOMException whose `name` is `"AbortError"`, which is caught and filtered out.
</details>

---

### Prediction Challenge 4: True Timeout Socket Cancellation
```js
async function testTimeout() {
  try {
    await fetch("https://httpbin.org/delay/5", {
      signal: AbortSignal.timeout(50)
    });
  } catch (err) {
    console.log("Timeout Threw:", err.name);
  }
}

testTimeout();
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Timeout Threw: TimeoutError (or AbortError)
```
**Why:** `AbortSignal.timeout(50)` automatically triggers signal abortion after 50ms, closing the underlying TCP socket and throwing a `TimeoutError`/`AbortError`.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** Why does `fetch('/api/missing')` not trigger a `catch` block when the server returns an HTTP 404 status?  
<details>
<summary><strong>Answer</strong></summary>
Because `fetch()` only rejects on **network transport failures** (e.g. no internet connection, DNS failure). An HTTP 404 response is a valid HTTP transaction from the server, so `fetch()` fulfills with a `Response` object. Engineers must manually check `if (!response.ok)` and throw an error to jump into `catch`.
</details>

**Q2:** How do you cancel an in-flight `fetch()` request in modern JavaScript?  
<details>
<summary><strong>Answer</strong></summary>
By using an `AbortController`. Instantiate `const controller = new AbortController()`, pass `controller.signal` into `fetch(url, { signal: controller.signal })`, and call `controller.abort()` when cancellation is desired.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** What is a race condition in a search-as-you-type input, and how do you resolve it?  
<details>
<summary><strong>Answer</strong></summary>
A search race condition occurs when a user types rapidly (Query A $\to$ Query B). If Query A takes longer on the network than Query B, Query A will resolve last and overwrite the newer Query B results on screen with stale data.  
**Resolution:**  
1. **`AbortController` Cancellation:** Abort the active controller before firing the new query.  
2. **Request ID Sequencing:** Track a monotonic `currentRequestId` and ignore results if `result.id !== currentRequestId`.
</details>

**Q4:** Why should you filter out `error.name === 'AbortError'` in your UI error handling logic?  
<details>
<summary><strong>Answer</strong></summary>
Because an `AbortError` is generated when a request is cancelled intentionally (e.g. user typed another search character, switched tabs, or component unmounted). Treating it as an application error would display confusing error banners/toasts to the user for normal expected interactions.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** Why is `Promise.race([fetch(url), timeout(5000)])` considered an anti-pattern for implementing request timeouts?  
<details>
<summary><strong>Answer</strong></summary>
`Promise.race()` only determines which Promise settles first in JavaScript control flow; it has **no control over the underlying platform socket**. If the timeout rejects at 5000ms, the original `fetch()` request continues running in the background, consuming socket connections and server bandwidth. To properly timeout a request, use `AbortSignal.timeout(5000)` or `controller.abort()` inside the timer callback.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How do you architect a unified enterprise data-fetching client in React that combines `AbortController` cancellation, monotonic request sequencing, in-flight request deduplication, and exponential backoff retry with jitter?  
<details>
<summary><strong>Answer</strong></summary>
1. **Request Deduplication:** Store active in-flight Promises in a `Map(queryKey, promise)`. Share the existing Promise for concurrent identical queries and remove it on settle (`.finally()`).  
2. **Cancellation & Lifecycle:** Bind an `AbortController` signal to the React component lifecycle (`useEffect` cleanup); abort pending requests on unmount.  
3. **Sequence Guarding:** Tag every query with a monotonic sequence counter (`currentId++`) to discard out-of-order responses.  
4. **Idempotent Retry:** If a transient HTTP 5xx occurs on idempotent `GET` methods, execute up to $N$ retries using exponential backoff with randomized jitter ($2^{\text{attempt}} \times 100\text{ms} + \text{jitter}$), while preserving the original `AbortSignal`.
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Cancellable & Versioned Search Client

```js
// See runnable implementation in examples/05-real-world-fetch-cancellation-race-conditions.js
```

---

## Key Takeaways
1. **`fetch()` Fulfills on 404/500:** Always check `if (!response.ok) throw`.
2. **Cancel Requests with `AbortController`:** Saves network bandwidth and server load.
3. **Ignore `AbortError` Silently:** Do not show error modals for intentional user cancellations.
4. **Eliminate Search Race Conditions:** Combine `AbortController` aborts with Request ID sequences.
5. **True Timeouts Abort Sockets:** Use `AbortSignal.timeout()` instead of bare `Promise.race`.

---

[⬅️ Part 04: Async Iteration, Loops & `for await...of`](./04-async-iteration-loops.md) | [📚 KPI 13 Index](./README.md) | [Part 06: Advanced Async Patterns, Retries, Deduplication & Telemetry ➡️](./06-advanced-async-patterns-retries-deduplication.md)
