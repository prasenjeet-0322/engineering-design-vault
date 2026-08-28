# KPI 19 — Part 04: Building a Reusable API Layer & Production Request Architecture

[⬅️ Part 03: AbortController, Cancellation & Race Conditions](./03-abortcontroller-cancellation-race-conditions.md) | [📚 KPI 19 Index](./README.md) | [KPI 20 — Modules & Modern Code Organization ➡️](../20-Modules-ESM/README.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| API Layer Dimension | Core Definition & Role | Primary Failure Mode | Senior Production Standard |
|---|---|---|---|
| **3-Tier Architecture** | UI $\to$ Domain Services (`usersApi`) $\to$ HTTP Client (`client.ts`). | Scattering raw `fetch()` calls across dozens of React components. | 🟢 Isolate transport concerns into a single reusable HTTP client. |
| **Response Sniffing** | Inspecting `status` and `Content-Type` before parsing. | Calling `.json()` on `204 No Content` or HTML 502/504 proxy errors. | 🟢 Return `null` on 204; sniff `application/json`; fallback to `.text()`. |
| **Error Normalization** | Wrapping raw errors in typed `APIError` classes. | Throwing raw strings or unhandled network exceptions into UI state. | 🟢 Attach `status`, `data`, and root `cause` to `APIError` instances. |
| **Signal Composition** | Merging caller cancellation signals with internal timeouts. | Discarding the caller's `AbortSignal` when creating a timeout controller. | 🔴 Use `AbortSignal.any([callerSignal, timeoutSignal])` or linked listeners. |
| **Auth 401 Refresh** | Intercepting 401, refreshing token, and replaying queued requests. | Triggering 10 simultaneous refresh calls when 10 parallel requests get 401. | 🔴 Implement a single in-memory Promise refresh lock queue. |
| **Abstraction Sizing** | Matching networking abstraction depth to application complexity. | Building a 12-class Abstract Factory for a 3-endpoint CRUD form. | 🟢 Build for known variation first; avoid "Architecture Theater". |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: Signal Clobbering & The 401 Refresh Deadlock
> 
> #### Gotcha A: Discarding Caller `AbortSignal` when Creating Timeouts (Signal Clobbering)
> *"Why did our search component fail to cancel previous in-flight requests after we added an automatic 5-second request timeout?"*  
> ```js
> // ❌ FATAL SIGNAL CLOBBERING BUG:
> async function request(url, options = {}) {
>   const timeoutController = new AbortController();
>   const timer = setTimeout(() => timeoutController.abort(), 5000);
> 
>   // 💥 Developers pass `timeoutController.signal`, completely DISCARDING `options.signal`!
>   // When the React component unmounts and calls `controller.abort()`, the fetch DOES NOT STOP!
>   const res = await fetch(url, { ...options, signal: timeoutController.signal });
>   clearTimeout(timer);
>   return res.json();
> }
> ```
> **Deep Architectural Explanation:**  
> If an HTTP client overrides `options.signal` with its internal timeout signal, caller cancellation (from user keystrokes, tab navigation, or React `useEffect` unmounts) is completely severed. The network socket continues downloading data in the background.  
> **The Senior Standard:** Compose caller signals with timeout signals using `AbortSignal.any()` (ES2024) or linked event listeners:
> ```js
> // ✅ COMPOSABLE SIGNAL ORCHESTRATION:
> function composeSignals(callerSignal, timeoutMs) {
>   const timeoutSignal = AbortSignal.timeout(timeoutMs);
>   if (!callerSignal) return timeoutSignal;
>   if (typeof AbortSignal.any === "function") {
>     return AbortSignal.any([callerSignal, timeoutSignal]); // 🟢 Aborts if EITHER triggers!
>   }
>   // Fallback for older runtimes
>   const controller = new AbortController();
>   const abort = () => controller.abort();
>   callerSignal.addEventListener("abort", abort);
>   timeoutSignal.addEventListener("abort", abort);
>   return controller.signal;
> }
> ```
> 
> ---
> 
> #### Gotcha B: Blind Auth Token Injection & 401 Refresh Stampedes
> *"Why did our authentication server crash when 8 dashboard widgets simultaneously received HTTP 401?"*  
> ```js
> // ❌ 401 REFRESH STAMPEDE (THUNDERING HERD):
> async function request(url, options) {
>   const response = await fetch(url, options);
>   if (response.status === 401) {
>     // 💥 If 8 requests fail simultaneously with 401, all 8 execute `/auth/refresh` at the same time!
>     // The refresh token is invalidated on the 1st request; the remaining 7 fail and log the user out!
>     const newToken = await refreshAuthToken();
>     return fetch(url, { ...options, headers: { Authorization: `Bearer ${newToken}` } });
>   }
> }
> ```
> **Deep Architectural Explanation:**  
> When multiple concurrent requests encounter an expired access token, all requests receive an HTTP 401 simultaneously. If the client does not synchronize token refreshing, multiple refresh requests flood the auth server. In systems with **Refresh Token Rotation**, the first refresh request succeeds and rotates the token; the remaining 7 requests arrive with the old rotated token, causing the auth server to suspect token theft and revoke the entire session.  
> **The Senior Standard:** Implement an in-memory **Single-Promise Lock Queue** that deduplicates concurrent refresh calls.

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / Next.js / Vite Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Centralized HTTP client, Domain resource modules, Custom `APIError`, Default headers | Core structural pattern for all professional frontend applications. |
| 🟡 **Moderate** | Used in ~45% of code | Automated 401 token refresh queues, Composed abort signals, In-flight request deduplication | Essential for enterprise SPAs, complex dashboards, and multi-tenant authentication systems. |
| 🔵 **Foundational / Engine** | Runtime internals | Fetch interceptor pipelines, Stream body consumption, Microtask execution queues | Mandatory for Staff/Principal engineering evaluations, SDK architecture, and performance audits. |

---

## Core Concepts (20 Subtopics)

### Part 1 — The 3-Tier Enterprise Frontend Networking Architecture `🟢 [Daily Driver]`

```text
UI Layer (React State & Spinners)
       ↓
Domain Resource Services (usersApi.getById)
       ↓
HTTP Client Layer (Base URLs, Headers, 401 Refresh, Error Normalization)
       ↓
Fetch API (Browser Transport)
```

---

### Part 2 — Centralized Base URL & Environment Configuration `🟢 [Daily Driver]`

Read environment variables once at the client layer (`const BASE_URL = import.meta.env.VITE_API_BASE_URL`).

---

### Part 3 — Core HTTP Client Interface & Request Execution Pipeline `🟢 [Daily Driver]`

A unified `request(path, options)` function orchestrating URL joining, header composition, socket execution, response parsing, and error normalization.

---

### Part 4 — Defensive Multi-Format Response Parsing `🟢 [Daily Driver]`

Handle 204 No Content (`return null`), JSON (`response.json()`), and fallback plain text/HTML (`response.text()`) safely.

---

### Part 5 — Unified `APIError` Hierarchy & Root-Cause Chaining `🟢 [Daily Driver]`

```ts
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "APIError";
  }
}
```

---

### Part 6 — Header Merging & Contextual Defaults `🟢 [Daily Driver]`

```js
const headers = {
  Accept: "application/json",
  ...(data ? { "Content-Type": "application/json" } : {}),
  ...customHeaders
};
```

---

### Part 7 — Dynamic Token Injection & Decoupled Credential Providers `🟢 [Daily Driver]`

Delegate credential resolution to an auth provider callback rather than hardcoding storage lookups inside the HTTP client.

---

### Part 8 — Automated 401 Token Refresh with In-Memory Concurrency Locking `🔴 [Production-Critical]`

When a 401 occurs, route all concurrent pending requests into an in-memory lock Promise, execute a single `/auth/refresh` call, update credentials, and replay the queue.

---

### Part 9 — Propagating `AbortSignal` Across Architectural Tiers `🟢 [Daily Driver]`

Forward `{ signal }` parameters from UI components down through domain service functions into `fetch()`.

---

### Part 10 — Composable Cancellation: Merging Caller Signals with Timeouts `🔴 [Production-Critical]`

Use `AbortSignal.any([callerSignal, AbortSignal.timeout(timeoutMs)])` so the request cancels if *either* the user aborts *or* the timeout expires.

---

### Part 11 — Reusable HTTP Helper Wrappers `🟢 [Daily Driver]`

Convenience helpers (`get`, `post`, `put`, `patch`, `del`) that automatically apply appropriate HTTP verbs, JSON serialization, and headers.

---

### Part 12 — Domain Resource API Modules `🟢 [Daily Driver]`

Encapsulate entity endpoints into cohesive domain services (`usersApi.ts`, `productsApi.ts`, `ordersApi.ts`).

---

### Part 13 — Predictable Function Contracts `🟢 [Daily Driver]`

Standardize on:
- **Success:** Returns data directly (`Promise<T>`).
- **Failure:** Throws normalized `APIError` (`Promise<never>`).

---

### Part 14 — Decoupling UI State from Low-Level HTTP Clients `🔴 [Production-Critical]`

Never import `toast`, `alert`, or global spinners inside the HTTP client. The client normalizes and throws; the UI component decides presentation.

---

### Part 15 — Idempotent Retry Policy Layer with Backoff & Jitter `🟢 [Daily Driver]`

Wrap idempotent requests (`GET`, `PUT`, `DELETE`) in exponential backoff retry loops with full random jitter for transient 503/429 errors.

---

### Part 16 — In-Flight Request Deduplication `🟢 [Daily Driver]`

Maintain a cache map of active Promises for identical concurrent `GET` requests (`${url}?${params}`), returning the existing in-flight Promise.

---

### Part 17 — Sizing Abstraction Depth: Avoiding Over-Engineering `🟢 [Daily Driver]`

Avoid 10-layer abstract factories for simple applications. Scale architecture based on team size and domain complexity.

---

### Part 18 — Scalable Production Directory Structures `🟢 [Daily Driver]`

```text
src/
├── api/
│   ├── client.ts
│   ├── users.ts
│   └── orders.ts
└── features/
    └── users/
        ├── components/
        └── hooks/
```

---

### Part 19 — Observability & APM Telemetry Hooks `🟢 [Daily Driver]`

Attach logging hooks in the client pipeline to record request durations, error rates, and status distributions to Sentry/Datadog.

---

### Part 20 — The 10-Point Senior API Architecture Audit Checklist `🟢 [Daily Driver]`

```text
1. Centralized Base URL? ──► 2. Defensive 204 Parsing? ──► 3. Content-Type Sniffing?
4. Typed APIError? ──► 5. Signal Propagation? ──► 6. Composed Timeouts?
7. 401 Refresh Lock? ──► 8. Jittered Retries? ──► 9. UI Decoupled? ──► 10. Domain Services?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Architectural Approach | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Custom Enterprise HTTP Client** | Enterprise web applications with custom auth, refresh locks & telemetry. | Simple 1-page static prototypes. | Requires maintaining internal utility code. | TanStack Query / Axios. |
| **Domain Resource Modules (`usersApi`)** | Medium-to-large apps with multiple domain entities. | Tiny projects with 1 single API call. | Adds small file organization overhead. | Direct client calls. |
| **Single-Promise 401 Refresh Lock** | Single Page Applications using rotating JWT auth tokens. | Public APIs or apps using stateless session cookies. | Slightly complex concurrency queue logic. | Cookie-based sessions. |
| **In-Flight Request Deduplication** | Heavy dashboards where multiple widgets request identical user data. | Fast mutating forms or non-idempotent operations. | Requires managing active promise maps. | TanStack Query caching. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Complete Enterprise API Client Layer & Domain Service in TypeScript
```tsx
import React, { useState, useEffect, useCallback } from 'react';

// ==========================================
// 1. CUSTOM API ERROR HIERARCHY
// ==========================================
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'APIError';
  }
}

// ==========================================
// 2. COMPOSE ABORT SIGNALS (CALLER + TIMEOUT)
// ==========================================
function composeSignals(callerSignal?: AbortSignal, timeoutMs?: number): AbortSignal | undefined {
  if (!timeoutMs) return callerSignal;
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  if (!callerSignal) return timeoutSignal;

  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([callerSignal, timeoutSignal]);
  }

  const controller = new AbortController();
  const onAbort = () => controller.abort();
  callerSignal.addEventListener('abort', onAbort);
  timeoutSignal.addEventListener('abort', onAbort);
  return controller.signal;
}

// ==========================================
// 3. ENTERPRISE HTTP CLIENT WITH 401 REFRESH LOCK
// ==========================================
export interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
  skipAuth?: boolean;
}

class HttpClient {
  private baseUrl: string;
  private refreshPromise: Promise<string> | null = null;
  private accessToken: string | null = 'INITIAL_MOCK_TOKEN';

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  public setToken(token: string | null) {
    this.accessToken = token;
  }

  private async refreshAccessToken(): Promise<string> {
    // 🟢 401 Concurrency Lock: If already refreshing, return the existing Promise!
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        console.log('    🔐 [Auth Lock]: Refreshing expired access token...');
        await new Promise((res) => setTimeout(res, 400));
        const refreshedToken = 'REFRESHED_MOCK_TOKEN_' + Date.now();
        this.accessToken = refreshedToken;
        return refreshedToken;
      } finally {
        this.refreshPromise = null; // Release lock
      }
    })();

    return this.refreshPromise;
  }

  public async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { params, headers, timeoutMs = 8000, signal, skipAuth, ...customOptions } = config;

    // 1. Build Query String
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') searchParams.set(k, String(v));
      });
      const qs = searchParams.toString();
      if (qs) url += (url.includes('?') ? '&' : '?') + qs;
    }

    // 2. Compose Signals
    const activeSignal = composeSignals(signal, timeoutMs);

    // 3. Compose Headers
    const requestHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...(customOptions.body ? { 'Content-Type': 'application/json' } : {}),
      ...(this.accessToken && !skipAuth ? { Authorization: `Bearer ${this.accessToken}` } : {}),
      ...(headers as Record<string, string>)
    };

    let response: Response;
    try {
      response = await fetch(url, { ...customOptions, headers: requestHeaders, signal: activeSignal });
    } catch (err: any) {
      if (err.name === 'AbortError' || err.name === 'TimeoutError') throw err;
      throw new APIError('Network transport failed', 0, null, { cause: err });
    }

    // 4. Handle 401 Unauthorized with Refresh Lock & Retry
    if (response.status === 401 && !skipAuth) {
      console.warn('    ⚠️ [HTTP 401]: Token expired; queuing refresh...');
      await this.refreshAccessToken();
      // Replay request with new token
      return this.request<T>(endpoint, { ...config, skipAuth: false });
    }

    // 5. Parse Response Safely
    let data: any = null;
    if (response.status !== 204) {
      const contentType = response.headers.get('content-type') || '';
      data = contentType.includes('application/json') ? await response.json() : await response.text();
    }

    // 6. Validate Status
    if (!response.ok) {
      throw new APIError(data?.message || `HTTP ${response.status}`, response.status, data);
    }

    return data as T;
  }
}

export const httpClient = new HttpClient('https://jsonplaceholder.typicode.com');

// ==========================================
// 4. DOMAIN USERS RESOURCE MODULE
// ==========================================
export interface UserRecord {
  id: number;
  name: string;
  email: string;
}

export const usersApi = {
  getUsers: (filters?: { search?: string }, signal?: AbortSignal) =>
    httpClient.request<UserRecord[]>('/users', { params: filters, signal }),

  getUserById: (id: number, signal?: AbortSignal) =>
    httpClient.request<UserRecord>(`/users/${encodeURIComponent(id)}`, { signal })
};

// ==========================================
// 5. REACT UI DASHBOARD COMPONENT
// ==========================================
export function EnterpriseApiDashboard() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const data = await usersApi.getUsers(undefined, controller.signal);
      setUsers(data);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err instanceof APIError ? `Error ${err.status}: ${err.message}` : err.message);
    } finally {
      setIsLoading(false);
    }

    return () => controller.abort();
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="api-client-card">
      <header className="card-header">
        <h3>Enterprise Reusable API Layer Architecture</h3>
        <button onClick={loadData} disabled={isLoading} className="refresh-btn">
          {isLoading ? 'Loading...' : '🔄 Re-fetch Users'}
        </button>
      </header>

      {error && <div className="error-banner">⚠️ {error}</div>}

      {isLoading && <p className="loading-state">⏳ Querying API client pipeline...</p>}

      {!isLoading && !error && (
        <ul className="user-list">
          {users.slice(0, 3).map((u) => (
            <li key={u.id} className="user-item">
              <strong>{u.name}</strong> <code>({u.email})</code>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

## 🧠 Part 04 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: Header Precedence Merging
```js
const DEFAULT_HEADERS = { Accept: "application/json", "X-App": "Vault" };
const customHeaders = { Accept: "text/plain", Authorization: "Bearer 123" };

const merged = { ...DEFAULT_HEADERS, ...customHeaders };
console.log("Merged Accept Header:", merged.Accept);
console.log("Preserved X-App Header:", merged["X-App"]);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Merged Accept Header: text/plain
Preserved X-App Header: Vault
```
**Why:** Spreading `...customHeaders` after `...DEFAULT_HEADERS` allows request-specific headers to intentionally override defaults while preserving untouched default entries.
</details>

---

### Prediction Challenge 2: In-Memory 401 Refresh Promise Locking
```js
let refreshPromise = null;
let refreshExecutionCount = 0;

function refresh() {
  if (refreshPromise) return refreshPromise;
  refreshExecutionCount++;
  refreshPromise = new Promise(r => setTimeout(() => {
    refreshPromise = null;
    r("NEW_TOKEN");
  }, 30));
  return refreshPromise;
}

// 3 concurrent requests encounter 401
Promise.all([refresh(), refresh(), refresh()]).then(() => {
  console.log("Total Refresh API Executions:", refreshExecutionCount);
});
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Total Refresh API Executions: 1
```
**Why:** Because `refreshPromise` stores the active in-flight Promise, all 3 requests subscribe to the same single promise, preventing duplicate token refreshes.
</details>

---

### Prediction Challenge 3: Safe 204 Empty Body Return
```js
async function parseBody(status, stream) {
  if (status === 204) return null;
  return "Parsed Body";
}

parseBody(204).then(res => console.log("204 Body Result:", res));
parseBody(200).then(res => console.log("200 Body Result:", res));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
204 Body Result: null
200 Body Result: Parsed Body
```
**Why:** Status 204 returns `null` immediately without touching body streams.
</details>

---

### Prediction Challenge 4: Composed Signal Cancellation
```js
const callerCtrl = new AbortController();
const timeoutSignal = AbortSignal.timeout(100);

let cancelledReason = "";
const composedSignal = AbortSignal.any([callerCtrl.signal, timeoutSignal]);

composedSignal.addEventListener("abort", () => {
  cancelledReason = composedSignal.reason.name;
  console.log("Composed Signal Cancelled via:", cancelledReason);
});

callerCtrl.abort(); // User cancels at T=0ms
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Composed Signal Cancelled via: AbortError
```
**Why:** `AbortSignal.any()` aborts as soon as the first constituent signal fires (here, the caller's immediate manual abort).
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** Why is scattering raw `fetch()` calls across components an architectural problem?  
<details>
<summary><strong>Answer</strong></summary>
Scattering raw `fetch()` calls duplicates base URLs, headers, and parsing logic in every component. A change to an API endpoint or authentication scheme requires modifying dozens of UI files. Centralizing networking into a 3-tier architecture (UI $\to$ Domain Service $\to$ HTTP Client) decouples UI rendering from transport logic.
</details>

**Q2:** How should an API layer handle HTTP `204 No Content` responses?  
<details>
<summary><strong>Answer</strong></summary>
The HTTP client should inspect `if (response.status === 204) return null;` before attempting to read the response stream. This prevents throwing an unhandled `SyntaxError: Unexpected end of JSON input`.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** How do you handle authentication headers across an entire application without passing tokens to every function?  
<details>
<summary><strong>Answer</strong></summary>
Centralize token resolution in the HTTP client wrapper. The client can maintain a private in-memory token reference or query a decoupled `getAccessToken()` provider during request construction, injecting `Authorization: Bearer <token>` into outgoing request headers automatically.
</details>

**Q4:** What is the risk of creating a new `AbortController` for timeouts inside an HTTP client?  
<details>
<summary><strong>Answer</strong></summary>
If the HTTP client attaches its internal timeout signal to `fetch({ signal: timeoutCtrl.signal })`, it clobbers any `AbortSignal` passed by the caller (e.g. from a React component unmount or search query change). The client must compose both signals using `AbortSignal.any([callerSignal, timeoutSignal])`.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** How do you solve the 401 Refresh Stampede problem when multiple concurrent requests encounter an expired JWT access token?  
<details>
<summary><strong>Answer</strong></summary>
Implement an in-memory **Single-Promise Lock Queue**. When the first request receives a 401, it initializes a `refreshPromise` and triggers the `/auth/refresh` endpoint. All subsequent concurrent 401 requests check if `refreshPromise` exists; if so, they wait on the same Promise. Once resolved, the access token is updated, the lock is released (`refreshPromise = null`), and all queued requests replay with the new token.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How do you design an enterprise-grade API SDK layer that unifies request deduplication, distributed OpenTelemetry trace propagation (`traceparent`), and schema validation across a large micro-frontend ecosystem?  
<details>
<summary><strong>Answer</strong></summary>
1. **Middleware Pipeline:** Implement an extensible interceptor pipeline (`Pipeline = RequestInterceptors -> FetchTransport -> ResponseInterceptors`).  
2. **Distributed Tracing Injection:** Automatically generate and inject W3C Trace Context headers (`traceparent`, `tracestate`) and correlation IDs into outgoing request headers.  
3. **In-Flight Request Deduplication:** For idempotent `GET` calls, maintain a Map of active promises (`key = method + url + sortedParams`). Multiple concurrent components requesting the same data receive the same shared Promise.  
4. **Schema Validation & Telemetry:** Validate parsed responses against Zod/TypeBox schemas. On schema mismatches, emit warning telemetry to Datadog/Sentry while returning safe fallback data.  
5. **Composed Lifecycle Governance:** Enforce that all micro-frontend apps pass their local feature `AbortSignal` into the shared SDK, ensuring that unmounting a micro-frontend immediately tears down all active network sockets.
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Enterprise API Client Layer

```js
// See runnable implementation in examples/04-production-api-client-architecture.js
```

---

## Key Takeaways
1. **Never Scatter `fetch()` Across UI:** Establish UI $\to$ Domain Service $\to$ HTTP Client tiers.
2. **Compose Cancellation Signals:** Combine caller `AbortSignal` with internal timeouts via `AbortSignal.any()`.
3. **Lock 401 Refresh Queues:** Deduplicate concurrent token refresh calls with a single Promise.
4. **Sniff Content-Type Defensively:** Handle 204, JSON, and HTML proxy templates cleanly.
5. **Decouple UI from Networking:** Keep loading spinners and alerts out of the HTTP client.

---

[⬅️ Part 03: AbortController, Cancellation & Race Conditions](./03-abortcontroller-cancellation-race-conditions.md) | [📚 KPI 19 Index](./README.md) | [KPI 20 — Modules & Modern Code Organization ➡️](../20-Modules-ESM/README.md)
