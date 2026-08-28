# KPI 17 — Part 04: Error Architecture, Performance-Oriented Design & Senior-Level Architecture Decisions

[⬅️ Part 03: State Architecture, State Machines, Reducers & Event-Driven Systems](./03-state-architecture-observability-performance.md) | [📚 KPI 17 Index](./README.md) | [KPI 18 — Browser Storage & Security ➡️](../18-Browser-Storage-Security/README.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Architectural Domain | Core Definition & Role | Primary Failure Mode | Senior Production Standard |
|---|---|---|---|
| **Error Normalization** | Converts raw heterogeneous errors into a uniform internal domain shape. | Leaking raw technical errors (`ECONNRESET`, `TypeError`) directly to UI toasts. | 🟢 Map external errors via `normalizeError()` to `{ userMessage, code, recoverable }`. |
| **Error Propagation** | Bubbling errors to the layer that possesses context to handle/recover. | Low-level data fetching functions directly triggering UI toasts and alerts. | 🔴 Keep data layer decoupled from UI; let feature/page layers decide UI response. |
| **Recoverability & Retries** | Classifying errors into transient/retryable vs fatal/unrecoverable. | Blindly retrying non-idempotent mutations (`POST /charge`) during network blips. | 🟢 Retry idempotent `GET` requests with jittered backoff; require user confirmation for mutations. |
| **Performance Profiling** | Measuring CPU time, render cycles, and memory before optimizing. | "Premature Memoization" wrapping cheap $O(1)$ operations in `useMemo`. | 🟢 Measure with Profiler first; establish strict Performance Budgets. |
| **Cache Invalidation** | Defining TTL and mutation purge policies for cached datasets. | Serving stale product prices after a successful update mutation. | 🟢 Implement automated cache invalidation / refetch triggers upon state mutations. |
| **Architecture Sizing** | Matching architectural abstraction depth to actual problem complexity. | Building 6-layer abstract factories and strategy providers for a 1-page CRUD form. | 🔴 Build for known variation first; refactor only under structural pressure. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: Raw Technical Leakage & Indiscriminate Memoization Thrashing
> 
> #### Gotcha A: Leaking Raw Infrastructure Errors into UI Toasts
> *"Why did our production banking app expose database connection strings and raw stack traces to users on network drops?"*  
> ```js
> // ❌ FATAL ERROR LEAKAGE IN DATA LAYER:
> async function transferFunds(payload) {
>   try {
>     return await api.post("/transfers", payload);
>   } catch (rawError) {
>     // 💥 Low-level function directly renders technical stack trace to user!
>     toast.error(`Transfer Failed: ${rawError.stack || rawError.message}`);
>   }
> }
> ```
> **Deep Architectural Explanation:**  
> Direct rendering of raw infrastructure errors violates **Security Information Disclosure** guidelines (OWASP) and breaks **Separation of Concerns**. Raw errors contain technical internal details (`ECONNRESET at pgsql://db:5432`, SQL schema names, null pointer traces) that confuse end users and expose internal architecture to attackers. Furthermore, having the data layer call `toast.error()` couples data fetching to a specific UI framework.  
> **The Senior Standard:** Separate telemetry diagnostics from sanitized, actionable user communication via an Error Normalizer:
> ```js
> // ✅ CLEAN ERROR NORMALIZATION & SEPARATION:
> async function transferFunds(payload) {
>   try {
>     return await api.post("/transfers", payload);
>   } catch (rawError) {
>     telemetry.logError(rawError, { context: 'transfer_funds' }); // 🟢 Full technical context for engineers
>     throw normalizeError(rawError); // 🟢 Sanitized, safe domain error for the UI layer
>   }
> }
> ```
> 
> ---
> 
> #### Gotcha B: Indiscriminate Memoization & Dependency Array Thrashing
> *"Why did adding `useMemo` and `useCallback` to every function make our React dashboard 20% slower?"*  
> ```tsx
> // ❌ PREMATURE MEMOIZATION ANTI-PATTERN:
> function UserCard({ user }: { user: User }) {
>   // 💥 Comparing dependencies and allocating closure memory costs more than computing `user.name.trim()`!
>   const formattedName = useMemo(() => user.name.trim().toUpperCase(), [user.name]);
>   const handleLog = useCallback(() => console.log(user.id), [user.id]);
>   return <div onClick={handleLog}>{formattedName}</div>;
> }
> ```
> **Deep Architectural Explanation:**  
> `useMemo` and `useCallback` are not free. On every render, React must allocate arrays, iterate over the dependency list, and perform shallow equality comparisons (`Object.is`) on every element. For trivial $O(1)$ operations (string formatting, simple additions), the memory overhead and comparison CPU cycles exceed the cost of recalculating the value directly.  
> **The Senior Standard:** Only memoize when:  
> 1. The calculation involves expensive transformations (e.g. filtering $>1,000$ items or running complex regex/cryptography).  
> 2. The object/function reference is passed to a memoized child component (`React.memo`) that relies on reference equality to prevent heavy sub-tree re-renders.

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / Next.js / Vite Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Error normalization, User vs Dev messages, Performance budgets, Purpose-driven refactoring | Foundational to building stable, production-grade applications that fail gracefully and perform fast. |
| 🟡 **Moderate** | Used in ~45% of code | Idempotent retry loops with backoff, Lazy computation / dynamic imports, Cache invalidation | Crucial for robust network resilience, large-scale bundle optimization, and offline caching. |
| 🔵 **Foundational / Engine** | Architectural governance | Sizing complexity budgets, System-level vs Local bottlenecks, Identifying overengineering | Mandatory for Staff/Principal engineering evaluations, system architecture reviews, and tech debt audits. |

---

## Core Concepts (20 Subtopics)

### Part 1 — Multi-Layered Error Architecture `🟢 [Daily Driver]`

Failures occur across multiple tiers (Network, API, Service, UI). Each layer must fulfill a distinct responsibility: describe failure, normalize shape, or decide recovery.

---

### Part 2 — Error Taxonomies: 401 vs 403 vs 500 `🟢 [Daily Driver]`

- **401 Unauthorized:** Authentication issue ("Who are you?"). Refresh token or redirect to login.  
- **403 Forbidden:** Authorization issue ("You are known, but not permitted"). Display permission upgrade prompt.  
- **500 / 503 Server Error:** Infrastructure failure. Display friendly error, preserve user inputs, and allow retry.

---

### Part 3 — Expected vs Unexpected Failures `🟢 [Daily Driver]`

- **Expected:** Normal domain outcomes (validation failures, duplicate email, rate limits) modeled explicitly as data.  
- **Unexpected:** Runtime bugs (null reference crashes, broken API contracts) that require APM alerting (Sentry).

---

### Part 4 — Centralized Error Normalization `🟢 [Daily Driver]`

Convert disparate error formats (Axios, Fetch, GraphQL, SDKs) into a unified internal model:
```ts
export interface AppError {
  userMessage: string;
  code: string;
  statusCode?: number;
  recoverable: boolean;
  raw?: unknown;
}
```

---

### Part 5 — Error Translation: Diagnostics vs User Messages `🟢 [Daily Driver]`

Never display raw technical error strings to end users. Log full stack traces to APM backends while displaying actionable, human-friendly guidance in the UI.

---

### Part 6 — Error Propagation Invariants `🟢 [Daily Driver]`

Pass normalized errors up the call chain. Handle the error only at the architectural layer that possesses sufficient context to display fallbacks or execute retries.

---

### Part 7 — Decoupling Data Layers from UI Toast Dispatchers `🔴 [Production-Critical]`

Never import `toast` or `alert` inside an API service. Low-level services must `throw` or return normalized errors, leaving UI presentation decisions to components.

---

### Part 8 — Recoverable vs Unrecoverable Failures `🟢 [Daily Driver]`

- **Recoverable:** Network timeouts, transient rate limits $\to$ Retry with exponential backoff & jitter.  
- **Unrecoverable:** Corrupt application state, unrecoverable 404s $\to$ Reset feature, navigate to safe fallback.

---

### Part 9 — Idempotency & Safe Mutation Retry Architectures `🔴 [Production-Critical]`

Never automatically retry non-idempotent operations (`POST /payments`). Only auto-retry idempotent requests (`GET`, `PUT`, `DELETE` or requests containing unique `Idempotency-Key` headers).

---

### Part 10 — Layered Error Boundaries & Granular Fallbacks `🟢 [Daily Driver]`

Wrap independent feature cards (Charts, User Tables, Widgets) in local Error Boundaries so a crash in one widget does not blank out the entire application.

---

### Part 11 — Production Telemetry & Structured Logging `🟢 [Daily Driver]`

Replace unstructured `console.log()` with structured JSON telemetry payloads containing timestamp, user ID, route, error code, and sanitized breadcrumbs.

---

### Part 12 — Performance Profiling: Measure Before Optimizing `🟢 [Daily Driver]`

Never optimize based on intuition. Use the Chrome DevTools Performance panel and React Profiler to pinpoint exact layout shifts, long tasks ($>50\text{ms}$), and re-render hotspots.

---

### Part 13 — Eliminating Unnecessary Work & Render Reconciliation `🟢 [Daily Driver]`

Before reaching for memoization, reduce work: colocate state to leaf components, hoist static JSX elements, and use component composition (`children` prop) to bypass sub-tree renders.

---

### Part 14 — Memoization Costs & When to Use `useMemo` `🟢 [Daily Driver]`

Memoize only when calculations involve heavy iterations ($>1,000$ items) or when passing object/callback references to memoized children (`React.memo`).

---

### Part 15 — Cache Architecture & Invalidation Lifecycles `🟢 [Daily Driver]`

Caching introduces staleness. Pair every cache store with a clear invalidation policy: TTL expiration, Stale-While-Revalidate background updates, and mutation purging.

---

### Part 16 — Lazy Computation, Dynamic Imports & Code Splitting `🟢 [Daily Driver]`

Load heavy routes and third-party libraries (charts, rich text editors) on demand using `React.lazy()` and dynamic `import()`.

---

### Part 17 — Single-Pass Data Normalization Pipelines `🟢 [Daily Driver]`

Transform raw API arrays into normalized entity maps (`{ byId: {}, allIds: [] }`) in a single pass at the service layer, avoiding repeated $O(N)$ filter operations in UI components.

---

### Part 18 — Performance Budgets as Engineering Constraints `🟢 [Daily Driver]`

Establish hard CI limits: Maximum initial JS bundle size ($<150\text{KB}$ gzipped), Largest Contentful Paint ($<2.5\text{s}$), and Interaction to Next Paint ($<200\text{ms}$).

---

### Part 19 — Spotting Overengineering & "Architecture Theater" `🔴 [Production-Critical]`

If adding a simple form field requires modifying 6 files, 3 interfaces, and 2 abstract factories, the architecture complexity exceeds the domain problem complexity.

---

### Part 20 — The Senior Architecture Decision Model `🟢 [Daily Driver]`

```text
Problem ──► Constraints ──► Known Variation ──► Smallest Working Design ──► Measure ──► Refactor on Pressure
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Strategy / Technique | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Centralized Error Normalizer** | Production apps consuming multiple external APIs/SDKs. | Tiny 10-line prototype scripts. | Adds a mapping layer to maintain. | Native `Error.cause`. |
| **Granular Error Boundaries** | Complex dashboards with independent widgets/cards. | Wrapping individual buttons or text spans. | Over-granularity creates UI visual clutter. | Route-level boundaries. |
| **`useMemo` / Memoization** | Expensive $O(N)$ calculations ($>1,000$ items), regex, cryptography. | Trivial $O(1)$ math, string concatenation, simple lookups. | Increases memory footprint & dependency comparison CPU time. | Direct computation / colocation. |
| **Code Splitting (`React.lazy`)** | Heavy secondary routes (Admin panel, Analytics, Rich Editor). | Critical above-the-fold landing page components. | Adds network loading delay on initial feature click. | Static bundling. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Error Normalization, Telemetry & Query Cache in TypeScript
```tsx
import React, { useState, useEffect, useCallback } from 'react';

// ==========================================
// 1. ERROR NORMALIZATION DOMAIN MODEL
// ==========================================
export interface AppError {
  userMessage: string;
  code: string;
  statusCode?: number;
  recoverable: boolean;
}

export function normalizeError(error: unknown): AppError {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as any).status;
    if (status === 401) {
      return { userMessage: 'Your session has expired. Please sign in again.', code: 'AUTH_EXPIRED', statusCode: 401, recoverable: false };
    }
    if (status === 403) {
      return { userMessage: 'You do not have permission to view this resource.', code: 'FORBIDDEN', statusCode: 403, recoverable: false };
    }
    if (status >= 500) {
      return { userMessage: 'Our servers are currently experiencing high load. Please retry.', code: 'SERVER_ERROR', statusCode: status, recoverable: true };
    }
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return { userMessage: 'Request was cancelled.', code: 'REQUEST_CANCELLED', recoverable: true };
  }

  return {
    userMessage: 'Unable to complete your request. Please check your connection.',
    code: 'NETWORK_OR_UNKNOWN',
    recoverable: true
  };
}

// ==========================================
// 2. RESILIENT QUERY HOOK WITH CACHE & NORMALIZATION
// ==========================================
export function useResilientQuery<T>(fetcher: () => Promise<T>, queryKey: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
    } catch (rawErr) {
      // 🟢 1. Normalize error for safe UI presentation
      const normalized = normalizeError(rawErr);
      setError(normalized);
      // 🟢 2. Log structured telemetry for engineers
      console.warn(`[Telemetry Engine]: Query "${queryKey}" failed:`, { code: normalized.code, raw: rawErr });
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, queryKey]);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, error, isLoading, retry: execute };
}

// ==========================================
// 3. REACT DASHBOARD COMPONENT
// ==========================================
export function EnterpriseErrorResilienceDashboard() {
  const [simulateError, setSimulateError] = useState(true);

  const mockApiCall = useCallback(async () => {
    await new Promise((res) => setTimeout(res, 400));
    if (simulateError) {
      throw { status: 503, message: 'Upstream Database Timeout' };
    }
    return { serverTime: new Date().toLocaleTimeString(), activeNodes: 48, systemHealth: 'OPTIMAL' };
  }, [simulateError]);

  const { data, error, isLoading, retry } = useResilientQuery(mockApiCall, 'system-health');

  return (
    <div className="resilience-card">
      <header className="card-header">
        <h3>Enterprise Error Normalization & Resilience Engine</h3>
        <button onClick={() => setSimulateError((p) => !p)} className="toggle-btn">
          Toggle Simulation: <strong>{simulateError ? '503 Server Error' : 'Success 200'}</strong>
        </button>
      </header>

      {isLoading && <p className="loading-state">⏳ Querying cluster telemetry...</p>}

      {error && (
        <div className="error-box">
          <h4>⚠️ {error.userMessage}</h4>
          <p>Error Code: <code>{error.code}</code> (Status: {error.statusCode || 'N/A'})</p>
          {error.recoverable && (
            <button onClick={retry} className="retry-btn">
              🔄 Retry Operation
            </button>
          )}
        </div>
      )}

      {data && (
        <div className="data-box">
          <h4>✅ System Status: {data.systemHealth}</h4>
          <p>Active Cluster Nodes: <strong>{data.activeNodes}</strong></p>
          <p>Telemetry Timestamp: <code>{data.serverTime}</code></p>
        </div>
      )}
    </div>
  );
}
```

---

## 🧠 Part 04 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: Error Normalization Shape Consistency
```js
function normalize(err) {
  return {
    msg: err?.status === 404 ? "Resource Not Found" : "Internal Error",
    retryable: err?.status !== 404
  };
}

const errA = { status: 404, detail: "User missing" };
const errB = { status: 500, detail: "DB down" };

console.log("Error A:", normalize(errA));
console.log("Error B:", normalize(errB));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Error A: { msg: 'Resource Not Found', retryable: false }
Error B: { msg: 'Internal Error', retryable: true }
```
**Why:** The normalizer safely maps disparate external status codes into predictable internal shapes with explicit retryability semantics.
</details>

---

### Prediction Challenge 2: Cache Invalidation on Mutation
```js
class QueryCache {
  constructor() { this.cache = new Map(); }
  set(key, val) { this.cache.set(key, val); }
  get(key) { return this.cache.get(key); }
  invalidate(key) { this.cache.delete(key); }
}

const qCache = new QueryCache();
qCache.set("user_1", { name: "Alice" });
console.log("Before Mutation:", qCache.get("user_1").name);

// User updates profile:
qCache.invalidate("user_1");
console.log("After Mutation (Cache Cleared for Refetch):", qCache.get("user_1"));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Before Mutation: Alice
After Mutation (Cache Cleared for Refetch): undefined
```
**Why:** Invalidating the cache key immediately upon state mutation guarantees that subsequent reads fetch fresh data from the server rather than stale cached data.
</details>

---

### Prediction Challenge 3: Exponential Backoff Retry Delay Math
```js
function getBackoffDelay(attempt, baseMs = 100) {
  return baseMs * Math.pow(2, attempt);
}

console.log("Attempt 0:", getBackoffDelay(0), "ms");
console.log("Attempt 1:", getBackoffDelay(1), "ms");
console.log("Attempt 2:", getBackoffDelay(2), "ms");
console.log("Attempt 3:", getBackoffDelay(3), "ms");
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Attempt 0: 100 ms
Attempt 1: 200 ms
Attempt 2: 400 ms
Attempt 3: 800 ms
```
**Why:** Exponential backoff doubles the wait duration on each successive retry ($100 \to 200 \to 400 \to 800\text{ms}$), reducing pressure on struggling backend services.
</details>

---

### Prediction Challenge 4: Pure Function Transformation Pipeline
```js
const sanitizeProducts = (products) =>
  products.map((p) => ({
    id: p.id,
    title: p.raw_title.trim(),
    price: Number(p.price_cents / 100).toFixed(2)
  }));

const raw = [{ id: "P1", raw_title: "  Headphones  ", price_cents: 4999 }];
console.log("Sanitized Entity:", sanitizeProducts(raw)[0]);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Sanitized Entity: { id: 'P1', title: 'Headphones', price: '49.99' }
```
**Why:** Normalizing raw API shapes into clean domain entities at the service layer prevents duplicated formatting logic across UI components.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is an Error Normalization layer and why is it needed?  
<details>
<summary><strong>Answer</strong></summary>
An Error Normalization layer is a centralized utility function that receives raw, inconsistent errors from various sources (Fetch, Axios, GraphQL, 3rd-party SDKs) and transforms them into a single predictable internal data structure (e.g. `{ userMessage, code, recoverable }`). It ensures components don't have to guess how to extract error messages.
</details>

**Q2:** What is the difference between an HTTP 401 Unauthorized and an HTTP 403 Forbidden error?  
<details>
<summary><strong>Answer</strong></summary>
- **401 Unauthorized:** Authentication failure ("Who are you?"). The user is not signed in or their session token has expired.  
- **403 Forbidden:** Authorization failure ("You are known, but not permitted"). The user is signed in, but their account lacks the necessary permissions/roles to perform the action.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** Why should low-level data fetching services never directly trigger UI toasts or alerts?  
<details>
<summary><strong>Answer</strong></summary>
Coupling low-level services to UI toasts creates tight coupling between the data layer and a specific UI framework. Low-level services do not know the user context (e.g. is this a background sync or an active user submit?). The service should normalize and re-throw the error, allowing the calling UI component to decide whether to show a toast, inline banner, or retry button.
</details>

**Q4:** When should you use `useMemo` in React, and when is it an anti-pattern?  
<details>
<summary><strong>Answer</strong></summary>
- **Use `useMemo` when:** Performing computationally expensive calculations (filtering/sorting $>1,000$ items, complex regex, matrix math) or when creating an object/array reference passed as a prop to a memoized child component (`React.memo`).  
- **Anti-pattern when:** Used for simple $O(1)$ operations (string formatting, basic math). The overhead of dependency array allocation and shallow comparison exceeds the cost of direct recomputation.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** How do you design an idempotent retry strategy for transient network failures?  
<details>
<summary><strong>Answer</strong></summary>
1. **Idempotency Verification:** Only auto-retry inherently idempotent HTTP methods (`GET`, `PUT`, `DELETE`) or `POST` requests accompanied by a client-generated UUID `Idempotency-Key` header.  
2. **Error Filter:** Only retry transient network/server errors (e.g. network disconnect, HTTP 429 Rate Limit, HTTP 503 Unavailable). Never auto-retry 4xx client errors (400 Bad Request, 401, 403, 404).  
3. **Exponential Backoff with Full Jitter:** Calculate wait time as $\text{Delay} = \min(\text{base} \times 2^{\text{attempt}}, \text{max}) + \text{randomJitter}$ to avoid synchronization retry storms.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How do you establish an architectural governance framework to eliminate overengineering and technical debt across a large frontend organization?  
<details>
<summary><strong>Answer</strong></summary>
1. **The "Complexity Budget" Standard:** Require RFCs for any architectural abstraction introducing $>3$ layers of indirection. Enforce building for known requirements first before speculative flexibility.  
2. **Performance Budgets in CI:** Gate pull requests on strict metrics: Max bundle size increase ($<5\text{KB}$/PR), Lighthouse Performance score $>90$, and zero Long Tasks ($>50\text{ms}$) on key landing routes.  
3. **Observability & Error SLOs:** Track Error-Free User Sessions ($>99.9\%$) in Sentry/Datadog; enforce that all uncaught exceptions trigger automated triage tickets.  
4. **Purpose-Driven Refactoring:** Only approve refactors that solve concrete structural pressure (e.g. circular dependency cycles, $>3$ duplicate domain implementations), rejecting aesthetic refactoring.
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Error Normalizer & Resilient Query Cache Engine

```js
// See runnable implementation in examples/04-error-architecture-performance-senior-decisions.js
```

---

## Key Takeaways
1. **Normalize All Errors at the Boundary:** Convert raw errors to `{ userMessage, code, recoverable }`.
2. **Decouple Data Layer from UI Alerts:** Let calling components decide user presentation.
3. **Measure Before Memoizing:** Profiling must precede optimization.
4. **Cache Invalidation is Mandatory:** Always purge or revalidate on mutation.
5. **Simplicity Over Speculative Flexibility:** Build for known variation first.

---

[⬅️ Part 03: State Architecture, State Machines, Reducers & Event-Driven Systems](./03-state-architecture-observability-performance.md) | [📚 KPI 17 Index](./README.md) | [KPI 18 — Browser Storage & Security ➡️](../18-Browser-Storage-Security/README.md)
