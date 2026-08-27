# KPI 10 — Part 03: Asynchronous Error Handling & Network Resilience

[⬅️ Part 02: Custom Errors, Taxonomy & cause](./02-error-objects-custom-errors-cause.md) | [📚 KPI 10 Index](./README.md) | [Part 04: Browser DevTools & Source Map Debugging ➡️](./04-devtools-breakpoints-logpoints-sourcemaps.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Mechanism / Problem | Operational Invariant | Rejects Promise? | Error Type / Handling | Senior Production Standard |
|---|---|---|---|---|
| **`fetch()` HTTP 4xx/5xx** | `fetch()` resolves normally on HTTP 400, 404, 500! Only network failures reject. | ❌ (Resolves!) | Check `response.ok` | 🔴 **Never rely on `try/catch` alone for HTTP errors**: Always assert `if (!res.ok) throw new HttpError()`. |
| **Network Failure** | DNS drop, offline, CORS block, TCP reset. | ✅ (Rejects) | `TypeError: Failed to fetch` | 🟢 Handle via `catch` block as an infrastructure transport failure; offer offline retry. |
| **`AbortController`** | Cancels in-flight requests via `signal`. | ✅ (Rejects) | `err.name === 'AbortError'` | 🟢 **Filter Out Aborts**: Do NOT display user-facing error banners when `err.name === 'AbortError'`. |
| **Search Race Condition**| Fast typing causes old async responses to overwrite fresh results. | N/A | Stale State Overwrite | 🔴 **Cancel or Sequence**: Abort previous controllers or check `requestId === currentId`. |
| **`Promise.all`** | Fails fast: the entire batch rejects if any single promise rejects. | ✅ (On first reject) | Aggregate Failure | 🟢 Use only when all sub-requests are strictly co-dependent (all-or-nothing). |
| **`Promise.allSettled`** | Resolves always: returns array of `{ status: 'fulfilled' | 'rejected' }`. | ❌ (Never rejects) | Partial Success | 🟢 **Partial UI Rendering**: Render loaded widgets; display retry buttons on failed widgets. |
| **Exponential Backoff** | $T_{\text{wait}} = \min(\text{cap}, \text{base} \times 2^{\text{attempt}}) + \text{jitter}$. | Retries on failure | Transient Errors (503/429) | 🟢 Never auto-retry non-idempotent mutations (`POST /payments`) without idempotency keys. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: The `fetch()` 404/500 Resolution Trap & Search Race Conditions
> 
> #### Gotcha A: The `fetch()` 404/500 Resolution Trap
> *"Why did our React error boundary fail to catch an HTTP 500 Internal Server Error when fetching user data?"*  
> ```js
> // ❌ BROKEN ASSUMPTION:
> try {
>   const response = await fetch("/api/users/999"); // Server responds with HTTP 500
>   const user = await response.json(); // 💥 Crashes on JSON parse or proceeds with error payload!
>   setUser(user);
> } catch (err) {
>   // 💥 NEVER REACHED for HTTP 500 because fetch() resolved successfully!
>   showErrorBanner("Server is down");
> }
> ```
> **Deep Architectural Explanation:**  
> The W3C Fetch Standard specifies that `fetch()` only rejects its Promise when a network-level failure occurs (DNS lookup failed, socket disconnected, CORS violation). If the server responds with valid HTTP headers—even `404 Not Found` or `500 Internal Server Error`—the network transport succeeded, so the Promise fulfills.  
> **The Senior Standard (Mandatory Status Normalization):**  
> ```js
> // ✅ CANONICAL HTTP FETCH WRAPPER:
> const response = await fetch("/api/users/999");
> if (!response.ok) { // response.ok checks status in range 200-299
>   throw new HttpError(`HTTP ${response.status} (${response.statusText})`, response.status);
> }
> const user = await response.json();
> ```
> 
> ---
> 
> #### Gotcha B: Search Input Race Conditions (Stale Overwrite)
> *"Why does typing 'react' quickly in our search box randomly display results for 're' instead of 'react'?"*  
> ```text
> User types "re"    -> Request A sent (slow network, takes 800ms)
> User types "react" -> Request B sent (fast network, takes 200ms)
> Request B completes at 200ms -> UI renders "react" results ✅
> Request A completes at 800ms -> UI renders "re" results 💥 (STALE OVERWRITE!)
> ```
> **The Senior Standard (AbortController Invalidation):**  
> ```js
> let activeController = null;
> 
> async function handleSearch(query) {
>   if (activeController) activeController.abort(); // Cancel previous request
>   activeController = new AbortController();
> 
>   try {
>     const results = await fetchSearch(query, activeController.signal);
>     renderResults(results);
>   } catch (err) {
>     if (err.name === "AbortError") return; // Ignore intentional cancellation
>     showError(err);
>   }
> }
> ```

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / TypeScript Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | TanStack Query / SWR patterns, `AbortController` in `useEffect`, `response.ok` checks, HTTP status mapping | Essential for writing rock-solid async data fetching hooks and UI state management. |
| 🟡 **Moderate** | Used in ~35% of code | Exponential backoff retry policies, `Promise.allSettled` dashboard aggregations, Idempotency keys | Critical for resilient network SDKs, payment checkout flows, and micro-frontend data aggregation. |
| 🔵 **Foundational / Engine** | Runtime internals | Microtask queue rejection tracking, unhandled rejection listeners, async stack traces in V8 | Essential for debugging memory leaks, race conditions, and Staff/Principal evaluations. |

---

## Core Concepts (20 Subtopics)

### Part 1 — Synchronous vs. Asynchronous Error Boundaries `🟢 [Daily Driver]`

Synchronous errors unwind the active call stack immediately. Asynchronous errors occur across future event loop ticks where the initiating call stack has already vanished.

---

### Part 2 — The 3 Promise States & Rejection Mechanics `🟢 [Daily Driver]`

- **Pending:** In-flight operation.
- **Fulfilled:** Resolved with value.
- **Rejected:** Settled with an error/reason. Rejections must be explicitly trapped via `.catch()` or `await` inside `try/catch`.

---

### Part 3 — Promise `.catch()` Chaining & Internal Bubble Propagation `🟢 [Daily Driver]`

Errors thrown anywhere inside `.then()` handlers bubble downstream until intercepted by the nearest `.catch()`. Handlers after the error are skipped.

---

### Part 4 — The Forgotten `return` in Promise Chains `🔴 [Production-Critical]`

Failing to `return` an inner Promise in `.then(user => { fetchPosts(user.id); })` severs the Promise chain, creating untracked async branches and silent unhandled rejections.

---

### Part 5 — `async/await` Microtask Rejection Dynamics `🔵 [Foundational / Engine]`

`await p` registers a microtask continuation. If `p` rejects, the JavaScript engine synthesizes a synchronous-like `throw` inside the async function body.

---

### Part 6 — `try/catch` with `await`: Trapping Rejections `🟢 [Daily Driver]`

Wrapping `await` calls inside standard `try/catch` restores clean linear exception control flow across asynchronous steps.

---

### Part 7 — The Un-Awaited Promise Escape Trap `🔴 [Production-Critical]`

`try { fetchUser(); } catch(e) {}` fails to catch rejections because `fetchUser()` is not awaited. The Promise rejects after `try/catch` exits.

---

### Part 8 — `fetch()` Resolution vs. HTTP Failures `🔴 [Production-Critical]`

`fetch()` fulfills successfully on HTTP 404, 500, 403, and 401. It only rejects on physical network failures, DNS dropouts, or aborted signals.

---

### Part 9 — Network Failures vs. HTTP Status Codes `🟢 [Daily Driver]`

- **Network Failure (`TypeError`):** Cable disconnected, DNS failure, CORS block.
- **HTTP Failure (`response.ok === false`):** Server responded with 4xx or 5xx application codes.

---

### Part 10 — HTTP Status Normalization via `response.ok` `🟢 [Daily Driver]`

```js
const res = await fetch(url);
if (!res.ok) throw new HttpError(`HTTP ${res.status}`, res.status);
```

---

### Part 11 — Body Parsing Failures (`response.json()`) `🟢 [Daily Driver]`

Even if `res.ok === true`, `await res.json()` can throw a `SyntaxError` if the server returns an empty body, HTML error page, or malformed JSON string.

---

### Part 12 — Transport Success vs. Schema Validity `🟢 [Daily Driver]`

An HTTP 200 response with valid JSON does not guarantee valid application data. Always validate payload contracts using runtime parsers (Zod / Valibot) before consuming in state.

---

### Part 13 — Unhandled Promise Rejections & Process Stability `🔵 [Foundational / Engine]`

Unhandled rejections in Node.js terminate the process (`--unhandled-rejections=strict`). In browsers, they trigger `window.addEventListener('unhandledrejection')`.

---

### Part 14 — `Promise.all()` vs. `Promise.allSettled()` `🟢 [Daily Driver]`

- `Promise.all([a, b])`: Fails fast if any promise rejects (all-or-nothing).
- `Promise.allSettled([a, b])`: Never rejects; returns `{ status, value/reason }` for partial UI rendering.

---

### Part 15 — Request Cancellation with `AbortController` `🟢 [Daily Driver]`

Pass `signal: controller.signal` to `fetch()`. Calling `controller.abort()` terminates the TCP request immediately, saving client/server bandwidth.

---

### Part 16 — Distinguishing `AbortError` from True Failures `🟢 [Daily Driver]`

```js
catch (err) {
  if (err.name === 'AbortError') return; // User navigated away; ignore
  showErrorBanner(err.message);
}
```

---

### Part 17 — Search UI Race Conditions: Stale Overwrite `🔴 [Production-Critical]`

When firing async requests on every keystroke, faster newer requests can complete *before* slower older requests, resulting in stale data overwriting the UI.

---

### Part 18 — Request Identity Sequencing (Latest-Request-Wins) `🟢 [Daily Driver]`

Maintain an incrementing sequence counter `currentRequestId`. Discard incoming responses if their `requestId !== currentRequestId`.

---

### Part 19 — Fault-Tolerant Exponential Backoff with Jitter `🟢 [Daily Driver]`

```js
const delay = (ms) => new Promise(res => setTimeout(res, ms));
async function retryWithBackoff(fn, retries = 3, baseDelay = 300) {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); }
    catch (err) {
      if (i === retries - 1 || !isRetryable(err)) throw err;
      const jitter = Math.random() * 100;
      await delay(baseDelay * Math.pow(2, i) + jitter);
    }
  }
}
```

---

### Part 20 — 10-Point Senior Async Error Resilience Checklist `🟢 [Daily Driver]`

```text
1. Is response.ok explicitly checked before attempting response.json()?
2. Is response.json() protected within try/catch to catch malformed payloads?
3. Are all fallible async function calls properly awaited inside try blocks?
4. Is AbortController used to cancel stale requests on component unmount / search changes?
5. Is err.name === 'AbortError' filtered out to prevent false user-facing error alerts?
6. Is Promise.allSettled used when partial widget failure is acceptable?
7. Is exponential backoff with jitter applied to transient failures (503, 429, network)?
8. Are non-idempotent operations (POST /payments) barred from blind automated retries?
9. Are search input race conditions prevented via aborts or sequence counters?
10. Is unhandledrejection monitored at the window/process root for telemetry capture?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Strategy | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **`fetch()` + `response.ok` + `try/catch`** | Standard REST API requests in lightweight apps or custom SDK layers. | High-frequency polling or complex caching with deduplication. | Requires manual cancellation, retry, and caching logic boilerplate. | TanStack Query, SWR. |
| **`AbortController`** | Search autocomplete inputs, tab switching, React component unmount cleanups. | Background jobs or fire-and-forget telemetry beacon transmissions. | Allocates controller memory; requires passing signal everywhere. | Sequence ID matching. |
| **`Promise.allSettled`** | Composite dashboards where widgets fail independently (e.g. Profile + News). | Strict multi-step transactions where all steps are mandatory. | Returns mixed status array requiring manual unwrapping and filtering. | `Promise.all`. |
| **TanStack Query / SWR** | Enterprise React/Next.js applications with complex caching, deduplication & retries. | Simple standalone NodeJS scripts or low-memory embedded runtimes. | Adds $\approx 12\text{KB}$ bundle size dependency to the client. | Native Fetch wrappers. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Search & Autocomplete Engine with `AbortController` & Request Sequencing
```tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';

// ==========================================
// 1. DATA CONTRACTS & CUSTOM ERRORS
// ==========================================
export interface SearchItem {
  id: string;
  title: string;
  category: string;
}

export class HttpError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'HttpError';
  }
}

// ==========================================
// 2. RESILIENT FETCH CLIENT WITH BACKOFF (Core)
// ==========================================
async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retries = 2,
  baseDelay = 200
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);

      if (!res.ok) {
        // Only retry on transient 5xx server errors or 429 rate limits
        if ((res.status >= 500 || res.status === 429) && attempt < retries) {
          const jitter = Math.random() * 50;
          await new Promise((r) => setTimeout(r, baseDelay * Math.pow(2, attempt) + jitter));
          continue;
        }
        throw new HttpError(`API request failed with status ${res.status}`, res.status);
      }

      return await res.json();
    } catch (err: any) {
      if (err.name === 'AbortError') throw err; // Never retry aborted requests!
      if (attempt >= retries) throw err;
      const jitter = Math.random() * 50;
      await new Promise((r) => setTimeout(r, baseDelay * Math.pow(2, attempt) + jitter));
    }
  }
  throw new Error('Unreachable retry boundary');
}

// ==========================================
// 3. REACT SEARCH COMPONENT WITH RACE PREVENTION
// ==========================================
export function EnterpriseSearchAutocomplete() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const latestRequestIdRef = useRef<number>(0);

  const executeSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    // 🟢 1. Abort previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 🟢 2. Increment sequence counter
    const requestId = ++latestRequestIdRef.current;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await fetchWithRetry<SearchItem[]>(
        `/api/search?q=${encodeURIComponent(trimmed)}`,
        { signal: controller.signal }
      );

      // 🟢 3. Race Check: Ensure this response belongs to the latest query
      if (requestId === latestRequestIdRef.current) {
        setResults(data);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Intentional cancellation; do NOT show error UI
        return;
      }
      if (requestId === latestRequestIdRef.current) {
        setErrorMessage(err instanceof HttpError ? `Search error (${err.status}): ${err.message}` : err.message);
        setResults([]);
      }
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Trigger search on query change with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch(query);
    }, 250);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, executeSearch]);

  return (
    <div className="search-engine-container">
      <h3>Enterprise Resilient Search</h3>

      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder="Search products, documentation..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {isLoading && <span className="spinner">⏳</span>}
      </div>

      {errorMessage && <div className="error-alert">⚠️ {errorMessage}</div>}

      <ul className="results-dropdown">
        {results.map((item) => (
          <li key={item.id}>
            <strong>{item.title}</strong>
            <span>{item.category}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 🧠 Part 03 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: The `fetch()` 500 Resolution Trap
```js
async function testFetchBehavior(mockStatus) {
  const mockFetch = async () => ({
    ok: mockStatus >= 200 && mockStatus < 300,
    status: mockStatus,
    json: async () => ({ error: "Internal crash" })
  });

  try {
    const res = await mockFetch();
    console.log("1. Fetch resolved with status:", res.status);
    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}`);
    }
    console.log("2. Success payload");
  } catch (err) {
    console.log("3. Caught error:", err.message);
  }
}

testFetchBehavior(500);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
1. Fetch resolved with status: 500
3. Caught error: HTTP Error 500
```
**Why:** Step 1 runs because `fetch()` resolved without throwing. Step 3 runs only because `!res.ok` explicitly threw an `Error`.
</details>

---

### Prediction Challenge 2: `Promise.all` vs. `Promise.allSettled`
```js
const p1 = Promise.resolve("Data A");
const p2 = Promise.reject(new Error("Failed B"));

// Promise.all rejects immediately:
Promise.all([p1, p2])
  .then(() => console.log("Promise.all success"))
  .catch((e) => console.log("Promise.all caught:", e.message));

// Promise.allSettled never rejects:
Promise.allSettled([p1, p2]).then((results) => {
  console.log("Promise.allSettled count:", results.length);
  console.log("p1 status:", results[0].status);
  console.log("p2 status:", results[1].status);
});
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Promise.all caught: Failed B
Promise.allSettled count: 2
p1 status: fulfilled
p2 status: rejected
```
**Why:** `Promise.all` rejects on the first failure. `Promise.allSettled` waits for all promises to settle and returns an inspection array.
</details>

---

### Prediction Challenge 3: `AbortController` Error Filtering
```js
const controller = new AbortController();

async function performTask(signal) {
  try {
    controller.abort(); // Immediately cancel
    if (signal.aborted) {
      const err = new Error("This operation was aborted");
      err.name = "AbortError";
      throw err;
    }
  } catch (err) {
    if (err.name === "AbortError") {
      console.log("Filtered: Intentional cancellation ignored");
      return;
    }
    console.log("User Error Alert:", err.message);
  }
}

performTask(controller.signal);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Filtered: Intentional cancellation ignored
```
**Why:** Checking `err.name === 'AbortError'` prevents intentional component unmounts or search cancellations from triggering false error alerts.
</details>

---

### Prediction Challenge 4: The Un-Awaited Promise Escape
```js
async function dangerousFunction() {
  try {
    // Un-awaited promise!
    Promise.reject(new Error("💥 Escaped Error!"));
    return "FINISHED_TRY";
  } catch (err) {
    return "CAUGHT_LOCALLY";
  }
}

dangerousFunction().then((res) => console.log("Result:", res));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Result: FINISHED_TRY
```
**Why:** Because the rejected promise was not awaited with `await`, the `try` block returned immediately and the rejection escaped local handling, becoming an unhandled rejection.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** Why doesn't `fetch()` reject when the server returns a 404 Not Found error?  
<details>
<summary><strong>Answer</strong></summary>
The Fetch API standard dictates that `fetch()` only rejects on physical network failures (DNS errors, connection drops, CORS blocks). If the server responds with valid HTTP headers—even 4xx or 5xx codes—the network transaction completed successfully, so the Promise fulfills. Developers must check `response.ok` (or `response.status`) to detect HTTP errors.
</details>

**Q2:** What is `AbortController` and how do you use it with `fetch()`?  
<details>
<summary><strong>Answer</strong></summary>
`AbortController` is a standard browser API for canceling asynchronous operations. You create an instance (`const controller = new AbortController()`), pass its signal to `fetch(url, { signal: controller.signal })`, and call `controller.abort()` when the request is no longer needed (e.g. on component unmount or rapid keystrokes).
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** What is a search query race condition in frontend applications and how do you prevent it?  
<details>
<summary><strong>Answer</strong></summary>
A search race condition occurs when rapid keystrokes initiate multiple asynchronous requests where an older, slower request completes *after* a newer, faster request, overwriting the UI with stale data. It is prevented by:  
1. Aborting the previous request with `AbortController.abort()` before initiating a new one, or  
2. Tracking an incrementing `requestId` sequence and discarding incoming responses if their ID does not match the latest request ID.
</details>

**Q4:** When should you use `Promise.allSettled()` instead of `Promise.all()`?  
<details>
<summary><strong>Answer</strong></summary>
Use `Promise.all()` when all operations are co-dependent and failure of one invalidates the entire batch (all-or-nothing). Use `Promise.allSettled()` when operations are independent and partial success is acceptable (e.g. rendering a multi-widget dashboard where some widgets can succeed while others display localized error/retry buttons).
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** How do you implement exponential backoff with jitter, and why is jitter critical in high-scale systems?  
<details>
<summary><strong>Answer</strong></summary>
Exponential backoff increases delay geometrically between retries ($2^0, 2^1, 2^2\dots$). **Jitter** adds a randomized interval to the delay. Jitter is critical to prevent the **Thundering Herd Problem**: when an API service temporarily degrades and recovers, thousands of clients retrying at identical mathematical intervals will simultaneously bombard the server, causing cyclic crashing. Jitter distributes retry spikes across a smooth time continuum.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** Why is automatic retry dangerous for non-idempotent HTTP operations (`POST`, `PATCH`), and how do you architect distributed idempotency across frontend and backend?  
<details>
<summary><strong>Answer</strong></summary>
1. **The In-Flight Timeout Hazard:** If a network timeout occurs during `POST /checkout`, the frontend cannot know if the packet failed *before* reaching the server or *after* the server processed payment but before the response returned. Blind retrying can cause duplicate payments or inventory deductions.  
2. **Distributed Idempotency Architecture:** The frontend generates a unique UUID `Idempotency-Key` (e.g. in headers) before the first attempt. The backend stores this key with the operation result in Redis/Postgres. On any subsequent retry with the same key, the backend returns the cached original result without re-executing the transaction, guaranteeing strict at-most-once semantics.
</details>

---

## 🛠️ Senior Architecture Challenge: Resilient Fetch Client with Exponential Backoff & Jitter

```js
// See runnable implementation in examples/03-async-error-handling-network-resilience.js
```

---

## Key Takeaways
1. **`fetch()` Resolves 4xx/5xx:** Always verify `response.ok` before reading `.json()`.
2. **Cancel In-Flight Requests:** Use `AbortController` to eliminate stale search races.
3. **Filter `AbortError`:** Never show user alerts for intentional cancellations.
4. **Partial UI with `allSettled`:** Do not let optional widget failures destroy the page.
5. **Backoff with Jitter:** Protect recovering backends by randomizing retry delays.

---

[⬅️ Part 02: Custom Errors, Taxonomy & cause](./02-error-objects-custom-errors-cause.md) | [📚 KPI 10 Index](./README.md) | [Part 04: Browser DevTools & Source Map Debugging ➡️](./04-devtools-breakpoints-logpoints-sourcemaps.md)
