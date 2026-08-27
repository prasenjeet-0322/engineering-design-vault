# KPI 19 — Part 02: Fetch API, Request Construction & Error Handling

[⬅️ Part 01: HTTP, Requests, Responses & API Fundamentals](./01-http-requests-responses-fundamentals.md) | [📚 KPI 19 Index](./README.md) | [Part 03: AbortController, Cancellation & Race Conditions ➡️](./03-abortcontroller-cancellation-race-conditions.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Architectural Area | Core Definition & Role | Primary Failure Mode | Senior Production Standard |
|---|---|---|---|
| **Request Construction** | Combining URL, Method, Headers, and Serialized Body. | Attaching `Content-Type: application/json` to `GET` requests without bodies. | 🟢 Only attach body/content-type headers when a serialized payload is present. |
| **URL Query Builders** | Mapping JavaScript filter/pagination objects to query strings. | Building URLs with raw string interpolation (`/api?search=${query}`). | 🟢 Build query strings exclusively using `URLSearchParams` and dynamic filters. |
| **Response Sniffing** | Inspecting `Content-Type` and `status` before parsing. | Blindly calling `response.json()` when a reverse proxy (Cloudflare) returns HTML on 502. | 🔴 Sniff `response.headers.get('content-type')` before attempting JSON parsing. |
| **Error Normalization** | Wrapping raw HTTP/network failures into typed `APIError` classes. | Throwing raw generic `new Error('failed')` without status codes or error payloads. | 🟢 Attach `status`, `data`, and `cause` to custom `APIError` instances. |
| **Domain API Services** | Organizing endpoints by domain entity (`usersApi`, `ordersApi`). | Scattering raw `fetch()` calls directly inside React UI components. | 🟢 Maintain a 3-layer architecture: UI $\to$ Domain API Service $\to$ HTTP Client. |
| **UI vs Network Boundary** | Separating loading state and spinners from networking logic. | Having the HTTP client directly trigger global loading spinners or UI alerts. | 🔴 Let React component state / React Query control spinners, not the HTTP client. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: HTML Proxy Crashes & The "God Request Function" Trap
> 
> #### Gotcha A: Parsing Non-JSON Error Payloads (The HTML 502/504 Cloudflare Crash)
> *"Why did our React error handler throw an uncaught `SyntaxError: Unexpected token '<', '<!DOCTYPE '... is not valid JSON` when Nginx went down?"*  
> ```js
> // ❌ NAIVE ERROR PARSING BUG:
> async function request(url) {
>   const response = await fetch(url);
>   if (!response.ok) {
>     // 💥 When upstream proxy (Cloudflare/Nginx) returns 502 Bad Gateway with an HTML page,
>     // calling .json() crashes the app before your error handler can run!
>     const errorData = await response.json();
>     throw new Error(errorData.message);
>   }
>   return response.json();
> }
> ```
> **Deep Architectural Explanation:**  
> During outages, load balancers, reverse proxies (Nginx, HAProxy), and CDNs (Cloudflare, AWS CloudFront) return standard HTML error templates (e.g. `<html><body>502 Bad Gateway</body></html>`) with `Content-Type: text/html`. Calling `await response.json()` throws a fatal `SyntaxError`.  
> **The Senior Standard:** Inspect the `Content-Type` header and parse text as fallback:
> ```js
> // ✅ DEFENSIVE CONTENT-TYPE SNIFFING:
> async function parseResponseBody(response) {
>   if (response.status === 204) return null;
>   const contentType = response.headers.get("content-type") || "";
>   if (contentType.includes("application/json")) {
>     try {
>       return await response.json();
>     } catch {
>       return null;
>     }
>   }
>   return await response.text(); // 🟢 Safely returns HTML string without throwing SyntaxError!
> }
> ```
> 
> ---
> 
> #### Gotcha B: The "God Request Function" / UI Coupling Trap
> *"Why did adding a background heartbeat polling request start popping up intrusive full-screen loading spinners and alert modals?"*  
> ```js
> // ❌ ARCHITECTURAL COUPLING ANTI-PATTERN:
> async function request(url, options) {
>   showGlobalSpinner(); // 💥 Couples low-level HTTP client to UI rendering!
>   try {
>     const res = await fetch(url, options);
>     if (!res.ok) {
>       showGlobalAlertModal("API Error!"); // 💥 Data layer takes over presentation!
>     }
>     return res.json();
>   } finally {
>     hideGlobalSpinner();
>   }
> }
> ```
> **Deep Architectural Explanation:**  
> Low-level HTTP clients lack UI context. A request could be an initial page load, a silent background polling loop, an optimistic mutation, or an autocomplete search. Embedding UI spinner calls and alert modals inside the HTTP client couples networking to the UI, prevents silent background sync, and causes UI flicker.  
> **The Senior Standard:** Keep the HTTP client 100% UI-agnostic. Let calling components or data hooks manage local/global loading indicators.

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / Next.js / Vite Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Request construction, `URLSearchParams` query builders, Custom `APIError`, Status parsing | Essential for constructing clean, production-grade API clients and domain service modules. |
| 🟡 **Moderate** | Used in ~45% of code | Content-Type sniffing (JSON vs Text), Safe 204 handling, `credentials: 'include'` CORS | Crucial for enterprise apps dealing with multi-tenant proxies, auth cookies, and binary downloads. |
| 🔵 **Foundational / Engine** | Runtime internals | Stream body consumption (`ReadableStream`), Request cloning, Memory allocation during parsing | Mandatory for Staff/Principal engineering evaluations, network layer profiling, and SDK design. |

---

## Core Concepts (20 Subtopics)

### Part 1 — The Complete `fetch()` Signature `🟢 [Daily Driver]`

```ts
fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>
```
Takes a target URL/Request and an options dictionary (`method`, `headers`, `body`, `signal`, `credentials`, `mode`, `cache`).

---

### Part 2 — Constructing `GET` Requests `🟢 [Daily Driver]`

`GET` is the default method. It must never contain a `body` payload and typically does not require a `Content-Type` header.

---

### Part 3 — Constructing `POST` Requests & Headers `🟢 [Daily Driver]`

```js
fetch("/api/users", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Sunny" })
});
```

---

### Part 4 — In-Memory Objects vs Serialized Wire Payloads `🟢 [Daily Driver]`

JavaScript objects in memory must be serialized to JSON strings (`JSON.stringify`) before transmission over the HTTP socket.

---

### Part 5 — Request Headers as Protocol Metadata `🟢 [Daily Driver]`

Headers communicate metadata:
- **`Accept: application/json`:** Declares expected response type.
- **`Authorization: Bearer <token>`:** Attaches identity credentials.
- **`Cache-Control: no-cache`:** Instructs proxies to fetch fresh data.

---

### Part 6 — Dynamic URL Path Construction & Encoding `🟢 [Daily Driver]`

Always encode dynamic path parameters using `encodeURIComponent()` to avoid breaking URL structure with spaces or slashes (`/api/users/${encodeURIComponent(username)}`).

---

### Part 7 — Dynamic Query Parameters with `URLSearchParams` `🟢 [Daily Driver]`

```js
const params = new URLSearchParams({ search: "react hooks", page: "1" });
const url = `/api/products?${params.toString()}`;
```

---

### Part 8 — Building Optional Filter & Pagination URL Builders `🟢 [Daily Driver]`

```js
function buildUrl(base, filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      params.set(key, String(val));
    }
  });
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
```

---

### Part 9 — `response.ok` Status Inspection `🔴 [Production-Critical]`

`response.ok` returns `true` if `response.status` is between 200 and 299. It is `false` for 404, 500, etc.

---

### Part 10 — Network Errors vs HTTP Errors `🟢 [Daily Driver]`

- **Network Errors (DNS down, offline, timeout):** Cause the `fetch()` Promise to reject.  
- **HTTP Errors (401, 404, 500):** Fulfill the `fetch()` Promise with `response.ok === false`.

---

### Part 11 — The Fallacy of Naive `try...catch` `🔴 [Production-Critical]`

Wrapping `fetch()` in `try...catch` will **not** catch 404 or 500 errors unless you explicitly verify `if (!response.ok) throw ...`.

---

### Part 12 — Preserving Root Error Causes via `Error.cause` `🟢 [Daily Driver]`

```js
try {
  return await fetch(url);
} catch (networkError) {
  throw new APIError("Network transport failed", { cause: networkError });
}
```

---

### Part 13 — Defensive Error Body Parsing `🟢 [Daily Driver]`

Servers often return structured error payloads (`{ error: { code: 'INVALID_EMAIL', message: '...' } }`). Parse error bodies safely to expose domain error codes.

---

### Part 14 — Content-Type Sniffing: JSON vs HTML Templates `🔴 [Production-Critical]`

Check `response.headers.get('content-type')` to avoid calling `.json()` on HTML proxy error templates.

---

### Part 15 — Safe `204 No Content` & Zero-Byte Body Handling `🟢 [Daily Driver]`

Explicitly return `null` when `response.status === 204` to prevent `SyntaxError: Unexpected end of JSON input`.

---

### Part 16 — The Robust Unified `request()` Pipeline Abstraction `🟢 [Daily Driver]`

A single, reusable request function that orchestrates URL building, headers, status validation, content-type sniffing, and error normalization.

---

### Part 17 — Domain-Specific `APIError` Hierarchy `🟢 [Daily Driver]`

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

### Part 18 — Categorizing API Errors for UX Handling `🟢 [Daily Driver]`

Map HTTP status codes to tailored UI actions: 401 $\to$ auth redirect, 403 $\to$ permission banner, 422 $\to$ inline form field errors, 500 $\to$ toast banner.

---

### Part 19 — Resource-Specific Domain API Services `🟢 [Daily Driver]`

Encapsulate endpoints into cohesive domain services (`usersApi.js`, `productsApi.js`) rather than calling generic request functions directly in components.

---

### Part 20 — Separation of Concerns: HTTP Client vs API Service vs UI `🟢 [Daily Driver]`

```text
UI Component (React State & Spinners)
         ↓
Domain API Service (usersApi.getById)
         ↓
HTTP Client (request pipeline & error normalization)
         ↓
Fetch API (Browser Transport)
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Layer / Approach | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Unified `request()` Pipeline** | Production web apps with standard REST endpoints. | Simple 5-line static HTML scratchpads. | Requires maintaining internal utility. | TanStack Query / Axios. |
| **Domain Services (`usersApi`)** | Enterprise codebases with $>5$ domain entities. | Tiny apps with 1 single API endpoint. | Adds an extra layer of abstraction files. | Direct client calls. |
| **Custom `APIError` Hierarchy** | Apps requiring granular status-based error routing. | When throwing raw unhandled strings is acceptable (prototypes). | Slightly more boilerplate in error classes. | Native `Error`. |
| **Defensive Content-Type Sniffing** | Any app consuming public APIs, microservices, or CDNs. | Mock in-memory test environments with guaranteed JSON. | Adds small runtime check before body parsing. | Blind `response.json()`. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Request Pipeline, Domain Service & UI Component in TypeScript
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
// 2. UNIFIED RESILIENT REQUEST PIPELINE
// ==========================================
export interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

export async function request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
  const { params, headers, ...customOptions } = config;

  // 🟢 1. Build Query Parameters safely
  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.set(key, String(val));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += (url.includes('?') ? '&' : '?') + qs;
  }

  const defaultHeaders: HeadersInit = {
    Accept: 'application/json',
    ...(customOptions.body ? { 'Content-Type': 'application/json' } : {}),
    ...headers
  };

  let response: Response;
  try {
    response = await fetch(url, { ...customOptions, headers: defaultHeaders });
  } catch (netErr: any) {
    throw new APIError('Network connection failed. Please check your internet.', 0, null, { cause: netErr });
  }

  // 🟢 2. Safe Body Parsing & Content-Type Sniffing
  let responseData: any = null;
  if (response.status !== 204) {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }
    } else {
      responseData = await response.text();
    }
  }

  // 🟢 3. Status Validation & Error Normalization
  if (!response.ok) {
    const serverMessage = responseData?.message || (typeof responseData === 'string' ? responseData : 'Request failed');
    throw new APIError(serverMessage, response.status, responseData);
  }

  return responseData as T;
}

// ==========================================
// 3. DOMAIN API SERVICE (USERS API)
// ==========================================
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export const usersApi = {
  getUsers: (filters?: { search?: string; role?: string }) =>
    request<User[]>('https://jsonplaceholder.typicode.com/users', { params: filters }),

  getUserById: (id: number) =>
    request<User>(`https://jsonplaceholder.typicode.com/users/${encodeURIComponent(id)}`),

  createUser: (user: Omit<User, 'id'>) =>
    request<User>('https://jsonplaceholder.typicode.com/users', {
      method: 'POST',
      body: JSON.stringify(user)
    }),

  deleteUser: (id: number) =>
    request<null>(`https://jsonplaceholder.typicode.com/users/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    })
};

// ==========================================
// 4. REACT FEATURE CONSUMPTION COMPONENT
// ==========================================
export function EnterpriseUserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<APIError | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await usersApi.getUsers();
      setUsers(data);
    } catch (err: any) {
      if (err instanceof APIError) {
        setError(err);
      } else {
        setError(new APIError(err.message, 0));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return (
    <div className="user-manager-card">
      <header className="card-header">
        <h3>Enterprise User Directory Management</h3>
        <button onClick={loadUsers} disabled={isLoading} className="refresh-btn">
          {isLoading ? 'Fetching...' : '🔄 Refresh Data'}
        </button>
      </header>

      {error && (
        <div className="error-banner">
          <h4>⚠️ Error ({error.status || 'Network Error'}):</h4>
          <p>{error.message}</p>
        </div>
      )}

      {isLoading && <p className="loading-indicator">⏳ Loading user records...</p>}

      {!isLoading && !error && (
        <ul className="user-grid">
          {users.slice(0, 4).map((u) => (
            <li key={u.id} className="user-card-item">
              <strong>{u.name}</strong>
              <span><code>{u.email}</code></span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

## 🧠 Part 02 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: Error Cause Propagation
```js
class CustomError extends Error {
  constructor(msg, options) {
    super(msg, options);
  }
}

try {
  try {
    throw new TypeError("Failed to fetch");
  } catch (original) {
    throw new CustomError("API Request Failed", { cause: original });
  }
} catch (wrapped) {
  console.log("Wrapped Message:", wrapped.message);
  console.log("Root Cause Message:", wrapped.cause.message);
}
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Wrapped Message: API Request Failed
Root Cause Message: Failed to fetch
```
**Why:** The ES2022 `ErrorOptions.cause` property chains the low-level network failure to the higher-level domain exception without losing debugging stack context.
</details>

---

### Prediction Challenge 2: Optional Query Param Filtering
```js
function buildQuery(params) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, v);
  });
  return sp.toString();
}

const filters = { search: "laptop", category: null, page: 2, tag: undefined };
console.log("Filtered Query:", buildQuery(filters));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Filtered Query: search=laptop&page=2
```
**Why:** Defensive URL builders strip out `null`, `undefined`, and empty strings, preventing malformed queries like `?category=null&tag=undefined`.
</details>

---

### Prediction Challenge 3: Content-Type Sniffing Fallback
```js
function getBodyParser(contentType) {
  if (contentType.includes("application/json")) return "JSON_PARSER";
  if (contentType.includes("text/html")) return "HTML_TEXT_PARSER";
  return "RAW_TEXT_PARSER";
}

console.log("API Header:", getBodyParser("application/json; charset=utf-8"));
console.log("Proxy Header:", getBodyParser("text/html"));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
API Header: JSON_PARSER
Proxy Header: HTML_TEXT_PARSER
```
**Why:** Checking `contentType.includes('application/json')` correctly routes JSON responses to `.json()` and proxy error templates to `.text()`.
</details>

---

### Prediction Challenge 4: Safe 204 Empty Body Detection
```js
async function parseResponse(status, hasJson) {
  if (status === 204) return null;
  return hasJson ? { success: true } : "text";
}

parseResponse(204, false).then(res => console.log("204 Output:", res));
parseResponse(200, true).then(res => console.log("200 Output:", res));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
204 Output: null
200 Output: { success: true }
```
**Why:** Short-circuiting status 204 directly to `null` bypasses stream parsing, avoiding empty body syntax errors.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** When should you attach the `Content-Type: application/json` header in a `fetch()` request?  
<details>
<summary><strong>Answer</strong></summary>
You should only attach `Content-Type: application/json` when sending a serialized JSON string in the request `body` (typically on `POST`, `PUT`, or `PATCH` requests). Attaching it to `GET` or `DELETE` requests with no body is unnecessary and can trigger superfluous CORS preflight `OPTIONS` requests.
</details>

**Q2:** Why does `encodeURIComponent()` need to be used when interpolating dynamic values into a URL path?  
<details>
<summary><strong>Answer</strong></summary>
If a user input contains special URL characters (e.g. spaces, `/`, `?`, `&`, `#`), raw interpolation will corrupt the URL routing structure (e.g. `/api/users/sunny/yadav` looks like 2 path segments instead of 1 username). `encodeURIComponent` converts special characters into safe percent-encoded tokens (`sunny%2Fyadav`).
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** What happens when an upstream proxy returns an HTML 502 Bad Gateway and the client calls `response.json()`? How do you prevent it?  
<details>
<summary><strong>Answer</strong></summary>
`response.json()` attempts to parse the HTML string (`<html>...`) as JSON, throwing an unhandled `SyntaxError: Unexpected token '<'...`. To prevent this, inspect `response.headers.get('content-type')`: only invoke `.json()` if it contains `application/json`; otherwise, call `.text()` to preserve the raw error string safely.
</details>

**Q4:** Why is it considered an architectural anti-pattern to return errors as normal resolved data objects (`return { error: true, message }`)?  
<details>
<summary><strong>Answer</strong></summary>
Returning error objects instead of throwing creates inconsistent function contracts. Callers are forced to write repetitive `if (result.error)` guards after every call, error boundaries cannot automatically catch unhandled failures, and TypeScript cannot cleanly discriminate between success payloads and error shapes. Standardizing on `Success -> Return Data | Failure -> Throw APIError` creates predictable call sites.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** How do you structure the separation of concerns between an HTTP Client, a Domain Service, and a React UI Component?  
<details>
<summary><strong>Answer</strong></summary>
1. **HTTP Client (`request.ts`):** Handles transport-level concerns: base URLs, header injection, query parameter serialization, content-type sniffing, status code validation, and error normalization.  
2. **Domain Service (`usersApi.ts`):** Exposes typed entity-specific operations (`getUser(id)`, `createUser(payload)`) without knowing anything about React state or UI components.  
3. **React UI Component (`UserManager.tsx`):** Consumes domain service methods and manages UI-specific concerns (loading spinners, error banners, optimistic state updates).
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How do you architect a unified, type-safe API client layer that enforces strict schema validation (via Zod) on both request payloads and response bodies while supporting dynamic tenant-based headers and custom serializers?  
<details>
<summary><strong>Answer</strong></summary>
1. **Schema-Driven Pipeline:** Define endpoint contracts pairing TypeScript types with Zod schemas (`RequestSchema` and `ResponseSchema`).  
2. **Pre-flight Validation:** Before dispatching `fetch`, validate outgoing payloads against `RequestSchema.parse(payload)`; throw validation errors before hitting the wire.  
3. **Contextual Header Injectors:** Use a provider pattern to dynamically inject tenant IDs, auth tokens, and correlation trace IDs (`X-Correlation-ID`) into outgoing headers.  
4. **Post-fetch Validation & Sniffing:** After verifying `response.ok` and sniffing `Content-Type`, parse JSON and validate against `ResponseSchema.safeParse(data)`. If the backend returns an unexpected contract shape, log an APM schema mismatch warning and return safe fallback data or a normalized `SchemaValidationError`.
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Unified `request()` Engine

```js
// See runnable implementation in examples/02-fetch-request-construction-error-handling.js
```

---

## Key Takeaways
1. **Never Assume Error Bodies are JSON:** Sniff `Content-Type` to avoid HTML proxy crashes.
2. **Keep Networking Decoupled from UI:** Do not trigger spinners inside HTTP clients.
3. **Use `URLSearchParams` for Query Building:** Strip `null`/`undefined` parameters cleanly.
4. **Preserve Root Error Causes:** Use `Error.cause` for full stack telemetry.
5. **Establish Clean 3-Layer Boundaries:** UI $\to$ Domain Service $\to$ HTTP Client.

---

[⬅️ Part 01: HTTP, Requests, Responses & API Fundamentals](./01-http-requests-responses-fundamentals.md) | [📚 KPI 19 Index](./README.md) | [Part 03: AbortController, Cancellation & Race Conditions ➡️](./03-abortcontroller-cancellation-race-conditions.md)
