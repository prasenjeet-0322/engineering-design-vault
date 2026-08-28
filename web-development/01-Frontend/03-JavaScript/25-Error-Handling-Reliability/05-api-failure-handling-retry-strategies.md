# KPI 25 — Part 05: API Failure Handling, Retries, Timeouts, Cancellation & Production-Safe Requests

[⬅️ Part 04: Async Errors & Promise Rejections](./04-async-errors-promise-rejections.md) | [📚 KPI 25 Index](./README.md) | [Part 06: React Error Boundaries & Component Recovery ➡️](./06-react-error-boundaries-recovery.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| API Reliability Concept | Underlying Mechanism | Failure Mode & Risk | Senior Engineering Standard |
|---|---|---|---|
| **`fetch()` `response.ok` Check** | `fetch()` only rejects on network/transport loss; HTTP 404 and 500 resolve normally. | Wrapping `fetch()` in `try/catch` misses 4xx/5xx errors entirely without manual inspection. | 🔴 **CRITICAL:** Always check `if (!response.ok)` and throw structured `HttpError`. |
| **Idempotency in Retries** | Repeating an idempotent operation ($f(f(x)) = f(x)$) produces the same side effect. | Retrying non-idempotent `POST /payments` on timeout causes catastrophic duplicate charges. | 🔴 **NEVER blindly retry non-idempotent mutations:** Enforce `Idempotency-Key` headers. |
| **Exponential Backoff + Jitter** | Delay increases exponentially ($t = \text{base} \times 2^{\text{attempt}} + \text{rand}$), scattering retry attempts. | Fixed retry delays from 10,000 clients cause synchronized **Retry Storms** that crash servers. | 🔵 Always add random jitter ($\pm 25\%$) to exponential backoff delays. |
| **Selective Retry Matrix** | Retrying transient network drops (503, 504, connection drops) vs failing fast on 4xx. | Retrying 400 Bad Request, 401 Unauthorized, or 404 Not Found wastes CPU and bandwidth. | 🟢 Never retry 4xx errors (except 429 with `Retry-After`); retry transient 5xx & network drops. |
| **`AbortController` Cancellation** | Signals hardware/browser sockets to terminate active network buffers. | `Promise.race` alone leaks active background HTTP sockets even when the timeout wins. | 🟢 Pass `{ signal: controller.signal }` to `fetch()` and call `controller.abort()`. |
| **Defensive JSON Parsing** | Handling non-JSON 500 error responses (HTML proxy crash pages, NGINX 502s). | `await res.json()` on HTML error pages throws a `SyntaxError`, masking the root HTTP error. | 🟢 Parse error bodies inside a fallback `try/catch` to preserve the original status code. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: `response.ok` Traps & Duplicate Mutation Retries
> 
> #### Gotcha A: `fetch()` Resolves on HTTP 404/500 (The `response.ok` Trap)
> *"Why did our React component render blank and log 'Success' when the backend returned 500 Internal Server Error?"*  
> ```js
> // ❌ DISASTROUS FETCH MISSING RESPONSE.OK CHECK:
> async function loadUserData(userId) {
>   try {
>     const response = await fetch(`/api/users/${userId}`);
>     // 💥 FATAL FLAW: fetch() does NOT reject on HTTP 404 or 500!
>     // The response is a valid Response object with response.ok === false.
>     // The catch block is BYPASSED, and response.json() tries to parse the 500 HTML error page!
>     const data = await response.json();
>     console.log("Success:", data);
>     return data;
>   } catch (err) {
>     console.error("Caught error:", err.message); // Only catches offline/DNS drops!
>   }
> }
> ```
> **Deep Architectural Explanation:**  
> The native Fetch API strictly models network transport completion. From the browser's perspective, if the HTTP handshake, TLS negotiation, and TCP packet exchange succeeded, the network request was successful, even if the application server replied with `500 Internal Server Error` or `404 Not Found`. `fetch()` only rejects its Promise on physical transport failures (e.g. offline, DNS lookup failure, CORS blockage, or request abortion).  
> **The Senior Standard:** Always verify `response.ok` (which checks `status >= 200 && status < 300`) and throw a structured `HttpError`:
> ```js
> // ✅ RESILIENT PRODUCTION REQUEST HANDLER:
> async function loadUserDataSafe(userId) {
>   const response = await fetch(`/api/users/${userId}`);
>   if (!response.ok) {
>     // 🟢 Explicitly normalize HTTP status codes into domain-catchable errors!
>     throw new HttpError(`HTTP ${response.status}: Failed to load user [${userId}]`, response.status);
>   }
>   return await response.json();
> }
> ```
> 
> ---
> 
> #### Gotcha B: Blind Retries on Non-Idempotent Mutations (The Duplicate Charge Trap)
> *"Why was a customer charged 3 times for a single purchase during a network timeout?"*  
> ```js
> // ❌ DANGEROUS BLIND RETRY ON NON-IDEMPOTENT WRITE:
> async function submitPayment(paymentDetails) {
>   // 💥 FATAL BUG: Retrying POST /charges without an Idempotency-Key!
>   // 1. Attempt 1 is received by Stripe and charges the card.
>   // 2. Network connection drops BEFORE the 200 OK response reaches the client.
>   // 3. Frontend assumes the request failed and RETRIES!
>   // 4. Stripe charges the card a SECOND time!
>   return retryWithBackoff(() => fetch("/api/charges", {
>     method: "POST",
>     body: JSON.stringify(paymentDetails)
>   }));
> }
> ```
> **Deep Architectural Explanation:**  
> A timeout or network drop does not mean the server did not execute the mutation. In distributed systems, a request often succeeds on the server, but the return response packet is lost in transit. If the client blindly re-transmits a non-idempotent `POST` request, the server executes a second distinct transaction.  
> **The Senior Standard:** Only retry idempotent reads (`GET`), or attach a persistent client-generated `Idempotency-Key` UUID header on mutating `POST`/`PUT` requests so the backend recognizes duplicates:
> ```js
> // ✅ IDEMPOTENT PRODUCTION MUTATION RETRY:
> async function submitPaymentSafe(paymentDetails, idempotencyKey = crypto.randomUUID()) {
>   return retryWithBackoff(() => fetch("/api/charges", {
>     method: "POST",
>     headers: {
>       "Content-Type": "application/json",
>       "Idempotency-Key": idempotencyKey // 🟢 Backend deduplicates identical keys!
>     },
>     body: JSON.stringify(paymentDetails)
>   }), { maxAttempts: 3, shouldRetry: (err) => err.status >= 500 || err.name === "NetworkError" });
> }
> ```

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / Next.js / Vite Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | `response.ok` checks, `AbortController` cleanup in `useEffect`, `HttpError` normalization | Universal requirement for any data-fetching application communicating with REST/GraphQL APIs. |
| 🟡 **Moderate** | Used in ~45% of code | Exponential backoff with jitter, `Idempotency-Key` headers, Rate-limit (429) backoffs | Critical for high-traffic e-commerce checkouts, payment processing, file uploaders, and SaaS apps. |
| 🔵 **Foundational / Engine** | Runtime internals | TCP socket teardowns via `AbortSignal`, Circuit breaker state machines, SWR cache policies | Required for Staff/Principal architecture reviews, SDK client design, and API gateway engineering. |

---

## Core Concepts (20 Subtopics)

### Part 1 — The Multi-Layer API Failure Model `🟢 [Daily Driver]`

Failures stem from 4 distinct tiers: Client Runtime (pre-request), Network/Transport (DNS/CORS/Offline), HTTP Protocol (4xx/5xx), and Application Schema (JSON parsing).

---

### Part 2 — The `response.ok` Imperative `🔴 [Production-Critical]`

`fetch()` resolves on 4xx/5xx; manual validation via `if (!response.ok)` is mandatory to convert HTTP status codes into JavaScript exceptions.

---

### Part 3 — Anatomy of a Production-Grade `HttpError` Class `🟢 [Daily Driver]`

```ts
export class HttpError extends Error {
  constructor(message: string, public readonly status: number, public readonly data?: unknown, options?: ErrorOptions) {
    super(message, options);
    this.name = 'HttpError';
  }
}
```

---

### Part 4 — HTTP Status Code Taxonomy & Frontend Decisions `🟢 [Daily Driver]`

- **400 / 422:** Validation defect $\implies$ Do not retry; highlight form inputs.
- **401:** Unauthorized $\implies$ Trigger token refresh or redirect to login.
- **403:** Forbidden $\implies$ Render 403 screen; do not retry.
- **404:** Not Found $\implies$ Render empty state; do not retry.
- **409:** Conflict $\implies$ Prompt user to reload/merge state.
- **429:** Rate Limited $\implies$ Respect `Retry-After` header before retrying.
- **500 / 502 / 503 / 504:** Gateway/Server drop $\implies$ Retry with backoff.

---

### Part 5 — Distinguishing Network Drops from HTTP Responses `🟢 [Daily Driver]`

- `TypeError: Failed to fetch`: Physical network loss or CORS denial (Promise rejects).
- `response.ok === false`: Server responded with HTTP failure code (Promise resolved).

---

### Part 6 — Normalizing Heterogeneous Backend Payloads `🟢 [Daily Driver]`

Shield UI components from backend inconsistency by mapping raw backend payloads to unified domain error models.

---

### Part 7 — Parsing Error Responses Defensively `🟢 [Daily Driver]`

Never assume a failed response is JSON. Use a safe parsing helper:
```js
async function parseErrorData(res) {
  try { return await res.json(); } catch { return await res.text().catch(() => null); }
}
```

---

### Part 8 — The Transient vs Permanent Failure Matrix `🟢 [Daily Driver]`

Only retry **transient** operational failures (network drops, 503 Service Unavailable, 429); fail fast on **permanent** failures (400, 401, 403, 404).

---

### Part 9 — The Law of Idempotency in Retries `🔴 [Production-Critical]`

`GET`, `PUT`, `DELETE` are idempotent ($f(f(x)) = f(x)$); `POST` is non-idempotent by default and must not be retried without idempotency guards.

---

### Part 10 — `Idempotency-Key` Request Headers `🔵 [Foundational / Engine]`

Generate a unique UUID per mutation; pass `"Idempotency-Key": uuid` so servers deduplicate repeated submissions.

---

### Part 11 — Fixed Delay vs Exponential Backoff `🟢 [Daily Driver]`

$$\text{Fixed: } t = 1000\text{ms} \implies 1000\text{ms} \implies 1000\text{ms}$$
$$\text{Exponential: } t = 1000\text{ms} \implies 2000\text{ms} \implies 4000\text{ms} \implies 8000\text{ms}$$

---

### Part 12 — Preventing Retry Storms: Full Jitter Formula `🔵 [Foundational / Engine]`

$$\text{Sleep} = \text{Math.random}() \times (\text{Base} \times 2^{\text{attempt}})$$
Scatters retry waves across a time window, preventing synchronized server spikes.

---

### Part 13 — Selective Retries: The `shouldRetry` Filter `🔴 [Production-Critical]`

```js
function shouldRetry(err) {
  if (err.name === 'AbortError') return false; // Never retry user cancellations
  if (err instanceof HttpError) return err.status >= 500 || err.status === 429;
  return err instanceof NetworkError;
}
```

---

### Part 14 — The Timeout Dilemma: Why `Promise.race` Leaks `🔴 [Production-Critical]`

`Promise.race([fetch(), timeout(5000)])` resolves the race, but the underlying HTTP TCP connection remains open in the browser.

---

### Part 15 — Active Cancellation with `AbortController` `🟢 [Daily Driver]`

```js
const controller = new AbortController();
fetch(url, { signal: controller.signal });
controller.abort(); // 🟢 Physically closes the network socket!
```

---

### Part 16 — Modern `AbortSignal.timeout(ms)` API `🟢 [Daily Driver]`

```js
fetch('/api/data', { signal: AbortSignal.timeout(5000) }); // Built-in 5s timeout!
```

---

### Part 17 — User Cancellation & Stale Response Elimination `🟢 [Daily Driver]`

Abort previous in-flight search requests when the user types a new character to eliminate out-of-order response overwrites.

---

### Part 18 — Handling `AbortError` Cleanly `🟢 [Daily Driver]`

```js
catch (err) {
  if (err.name === 'AbortError') return; // 🟢 Silently ignore intentional aborts!
  showErrorToast(err.message);
}
```

---

### Part 19 — The Request State Machine `🟢 [Daily Driver]`

$$\text{Idle} \implies \text{Loading} \iff \text{Retrying (Attempt } N) \implies \text{Success} \mid \text{Error} \mid \text{Aborted}$$

---

### Part 20 — The 10-Point Senior API Reliability Audit Checklist `🟢 [Daily Driver]`

```text
1. Is response.ok checked on every fetch? ──► 2. Are 4xx errors excluded from retries?
3. Is exponential backoff + jitter used? ──► 4. Are POST mutations guarded with Idempotency-Key?
5. Are AbortControllers used for timeouts? ──► 6. Are AbortErrors ignored in UI alerts?
7. Is response.json() parsed defensively? ──► 8. Is a max retry budget (e.g. 3) enforced?
9. Are previous search requests aborted? ──► 10. Does UI display active retry attempts?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| API Resilience Pattern | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Exponential Backoff + Jitter** | Transient 5xx server errors, 429 rate limits, mobile network reconnections. | 400 Bad Request, 401 Unauthorized, 404 Not Found, non-idempotent writes without keys. | Increases total latency before ultimate failure is reported to the user. | Immediate fail-fast. |
| **`AbortController` Active Cancellation** | Request timeouts, component unmounting, typeahead search autocomplete. | Critical background mutations that must complete even if user navigates away. | Requires passing `signal` across all network layers. | `Promise.race` (leaky). |
| **`Idempotency-Key` Headers** | Mutating `POST`/`PUT` requests (Payments, Order Creation, Batch Inserts). | Read-only `GET` requests that are naturally idempotent. | Requires backend database support for key deduplication. | Disabling UI buttons. |
| **Circuit Breakers** | Microservices, third-party integrations (e.g. Maps, Analytics, Search APIs). | Simple CRUD SPAs with a single primary backend API. | Adds memory and state-tracking complexity to frontend client. | Simple retry with max budget. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Resilient HTTP Client with Backoff, Jitter & AbortController in TypeScript
```tsx
import React, { useState, useCallback, useRef } from 'react';

// ==========================================
// 1. HTTP ERROR TAXONOMY & CONTRACTS
// ==========================================
export class HttpError extends Error {
  constructor(message: string, public readonly status: number, public readonly data?: unknown) {
    super(message);
    this.name = 'HttpError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'NetworkError';
  }
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  maxRetries?: number;
  baseDelayMs?: number;
  idempotencyKey?: string;
}

// ==========================================
// 2. PRODUCTION-GRADE RESILIENT FETCH ENGINE
// ==========================================
export async function resilientFetch<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const {
    timeoutMs = 8000,
    maxRetries = 3,
    baseDelayMs = 500,
    idempotencyKey,
    headers = {},
    ...fetchInit
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(headers as Record<string, string>)
      };

      if (idempotencyKey) {
        requestHeaders['Idempotency-Key'] = idempotencyKey;
      }

      const response = await fetch(url, {
        ...fetchInit,
        headers: requestHeaders,
        signal: controller.signal
      });

      if (!response.ok) {
        let errorBody: unknown = null;
        try { errorBody = await response.json(); } catch { errorBody = await response.text().catch(() => null); }
        throw new HttpError(`HTTP ${response.status}: Request failed`, response.status, errorBody);
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      const isAbort = (err as Error)?.name === 'AbortError';
      const isHttp = err instanceof HttpError;
      const isTransient = !isHttp || (isHttp && (err.status >= 500 || err.status === 429));

      lastError = isHttp ? err : new NetworkError(isAbort ? 'Request timed out' : 'Network unreachable', { cause: err as Error });

      // 🔴 Fail Fast on non-transient errors or last attempt
      if (attempt === maxRetries || !isTransient || isAbort) {
        throw lastError;
      }

      // 🔵 Exponential Backoff with Full Jitter: Sleep = rand(0, base * 2^attempt)
      const maxBackoff = baseDelayMs * Math.pow(2, attempt);
      const jitterDelay = Math.floor(Math.random() * maxBackoff);
      await new Promise((resolve) => setTimeout(resolve, jitterDelay));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError ?? new Error('Unknown network failure');
}

// ==========================================
// 3. ENTERPRISE API RELIABILITY DASHBOARD
// ==========================================
export function EnterpriseApiReliabilityDashboard() {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const activeSearchController = useRef<AbortController | null>(null);

  const appendLog = (msg: string) => setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  // Demonstration: Resilient Mutation with Idempotency Key
  const handleExecutePayment = useCallback(async () => {
    setStatus('LOADING');
    const paymentIdempotencyKey = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    appendLog(`💳 Initiating Payment with Idempotency-Key: ${paymentIdempotencyKey}`);

    try {
      // Simulate calling resilientFetch
      appendLog('Attempting transmission with 3 retries, exponential backoff, and full jitter...');
      await new Promise((res) => setTimeout(res, 600)); // simulated call
      appendLog('✅ Payment transaction committed successfully.');
      setStatus('SUCCESS');
    } catch (err: unknown) {
      appendLog(`🔴 Payment failed: ${(err as Error).message}`);
      setStatus('ERROR');
    }
  }, []);

  return (
    <div className="api-reliability-card">
      <header className="card-header">
        <h3>Enterprise API Reliability &amp; Idempotency Engine</h3>
        <span className="badge">🛡️ Backoff, Jitter &amp; Cancellation</span>
      </header>

      <p className="architecture-description">
        Demonstrates resilient HTTP operations featuring <code>response.ok</code> verification, <code>Idempotency-Key</code> deduplication, full jitter backoff, and <code>AbortController</code> timeouts.
      </p>

      <div className="controls-row">
        <button
          type="button"
          onClick={handleExecutePayment}
          disabled={status === 'LOADING'}
          className="btn-pay"
        >
          {status === 'LOADING' ? 'Processing...' : '💳 Submit Idempotent Payment ($150)'}
        </button>
      </div>

      <div className="console-panel">
        <h4>Telemetry Audit Logs:</h4>
        {logs.map((log, i) => (
          <div key={i} className="log-entry">{log}</div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🧠 Part 05 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: `fetch()` on HTTP 503 Service Unavailable
```js
try {
  const res = await fetch("/api/status"); // Returns 503
  console.log("A");
} catch (e) {
  console.log("B");
}
```
**Question:** What will be output to the console?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:** `"A"`.  
**Why:** `fetch()` only rejects on network loss or CORS failures. Since the server replied with an HTTP 503 response packet, `fetch()` resolves successfully. To catch it, you must check `if (!res.ok) throw new Error(...)`.
</details>

---

### Prediction Challenge 2: Exponential Backoff with Jitter Calculation
```text
Base Delay: 1000ms
Attempt: 2 (3rd attempt: 0, 1, 2)
Formula: Math.random() * (1000 * 2^2)
```
**Question:** What is the theoretical minimum and maximum sleep duration for this attempt?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:**  
- **Minimum:** $0\text{ms}$  
- **Maximum:** $4,000\text{ms}$ ($1000 \times 2^2 = 4000\text{ms}$).  
**Senior Takeaway:** Full Jitter uniformly distributes retry requests between $0$ and $\text{maxBackoff}$, completely eliminating synchronized server traffic spikes.
</details>

---

### Prediction Challenge 3: Timeout Race vs Socket Leak
```js
const controller = new AbortController();
const fetchPromise = fetch("/api/heavy-data", { signal: controller.signal });
const timeoutPromise = new Promise((_, reject) => setTimeout(() => {
  controller.abort();
  reject(new Error("Timeout"));
}, 2000));
await Promise.race([fetchPromise, timeoutPromise]);
```
**Question:** Does the underlying HTTP socket close when the timeout timer fires?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:** **Yes.**  
**Why:** Because `controller.abort()` was invoked inside the timer callback, the browser physically terminates the TCP socket and frees the associated network memory buffers.
</details>

---

### Prediction Challenge 4: Retrying 401 Unauthorized
```js
function shouldRetry(error) {
  return error.status === 401;
}
```
**Question:** Why is blindly retrying a 401 Unauthorized request considered an architectural antipattern?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:**  
A 401 error means authentication credentials are missing or expired. Retrying the exact same request with the exact same expired token will fail 100% of the time, wasting bandwidth and triggering server rate limits. The client must first execute a token refresh mutation before retrying.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** Why doesn't `fetch()` throw an error when a server returns HTTP 404 or 500?  
<details>
<summary><strong>Answer</strong></summary>
The native `fetch()` API strictly models network transport status. As long as the browser was able to contact the server and receive an HTTP response packet, the network transport succeeded, so `fetch()` resolves with a `Response` object. Developers must check `if (!response.ok)` to manually detect HTTP 4xx and 5xx error status codes.
</details>

**Q2:** How do you cancel an in-flight `fetch()` request in JavaScript?  
<details>
<summary><strong>Answer</strong></summary>
Instantiate an `AbortController`, pass its signal to the request options (`fetch(url, { signal: controller.signal })`), and call `controller.abort()` when cancellation is needed (e.g. component unmounting or user typing a new search query).
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** What is Exponential Backoff with Jitter, and why is it superior to fixed-delay retries?  
<details>
<summary><strong>Answer</strong></summary>
- **Fixed Delay ($1\text{s}, 1\text{s}, 1\text{s}$):** When a backend service recovers from an outage, thousands of clients retry at the exact same millisecond intervals, creating a **Retry Storm (Thundering Herd Problem)** that immediately crashes the server again.  
- **Exponential Backoff + Jitter ($t = \text{random}() \times (\text{base} \times 2^{\text{attempt}})$):** Exponentially increases delay while adding randomness to scatter client retry requests evenly over time, allowing the backend to recover gracefully.
</details>

**Q4:** What is Idempotency, and why is it critical when implementing retry policies?  
<details>
<summary><strong>Answer</strong></summary>
An operation is idempotent if executing it multiple times produces the exact same outcome as executing it once ($f(f(x)) = f(x)$). `GET`, `PUT`, and `DELETE` are typically idempotent. `POST` requests (e.g. creating orders or charging credit cards) are non-idempotent; blindly retrying a timed-out `POST` request can result in duplicate payments. To retry safely, clients must attach an `Idempotency-Key` header so the server recognizes and deduplicates identical requests.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** How do you design an enterprise-grade resilient HTTP client in TypeScript that handles timeouts, selective retries, idempotency, and defensive JSON parsing?  
<details>
<summary><strong>Answer</strong></summary>
1. **Unified Options Interface:** Accept `timeoutMs`, `maxRetries`, `idempotencyKey`, and `shouldRetry` predicates.  
2. **Defensive Parsing:** Wrap `res.json()` in a fallback handler to safely extract text from non-JSON 500 proxy error pages.  
3. **Status Classification:** Normalize failures into typed `HttpError` and `NetworkError` classes.  
4. **Selective Backoff Loop:** Retry only transient errors (network drops, 503, 429) using exponential backoff with full jitter; fail-fast on 4xx validation/auth errors.  
5. **Abort Signal Management:** Attach `AbortController` timeouts to cancel physical network sockets and ignore `AbortError` in UI notifications.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How do you implement a Client-Side Circuit Breaker Pattern (`Closed` $\to$ `Open` $\to$ `Half-Open`) to protect degrading microservices in high-throughput frontend SPAs?  
<details>
<summary><strong>Answer</strong></summary>
1. **Closed State (Normal):** All requests pass through. If the rolling failure rate exceeds a threshold (e.g. 50% failures over 20 requests), trip the breaker to **Open**.  
2. **Open State (Tripped):** Immediately fail-fast all subsequent requests locally without hitting the network for a cooldown period (e.g. 30 seconds), instantly returning cached data or fallback UI to prevent server overload.  
3. **Half-Open State (Trial):** After cooldown, allow a single canary probe request through. If it succeeds, reset the breaker to **Closed**; if it fails, reset the timer and return to **Open**.  
4. **Staff Architecture:** Implement the circuit breaker at the API gateway client level, exposing telemetry metrics to monitor service health in real-time.
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Resilient Fetch Engine

```js
// See runnable implementation in examples/05-api-failure-handling-retry-strategies.js
```

---

## Key Takeaways
1. **Always Check `response.ok`:** `fetch()` resolves on 404/500; convert them to `HttpError`.
2. **Never Blindly Retry Mutations:** Protect `POST` writes with `Idempotency-Key` headers.
3. **Use Exponential Backoff + Jitter:** Eliminate synchronized retry storms on recovering servers.
4. **`AbortController` Closes Sockets:** Actively terminate network buffers on timeouts and unmounts.
5. **Parse Error Responses Defensively:** Prevent secondary JSON syntax crashes on HTML 500 error pages.

---

[⬅️ Part 04: Async Errors & Promise Rejections](./04-async-errors-promise-rejections.md) | [📚 KPI 25 Index](./README.md) | [Part 06: React Error Boundaries & Component Recovery ➡️](./06-react-error-boundaries-recovery.md)
