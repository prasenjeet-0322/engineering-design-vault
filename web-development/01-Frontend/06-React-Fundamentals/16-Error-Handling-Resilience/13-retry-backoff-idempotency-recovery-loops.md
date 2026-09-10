# PART 13: Retry, Backoff, Idempotency & Preventing Recovery Loops

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Focus:** Designing resilient, bounded retry mechanisms, exponential backoff with full jitter, stable idempotency contracts, and preventing distributed recovery loops.  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)  
> **Co-Author:** Prasenjeet (Mid-Level Full Stack Developer)  
> **Companion Interactive Lab:** [`examples/13-retry-backoff-idempotency-recovery-loops.html`](./examples/13-retry-backoff-idempotency-recovery-loops.html)

---

## 1. ⚡ 30-Second Executive Cheat Sheet

### The Core Problem
When an asynchronous operation or UI rendering fails, the naive recovery strategy is:

```text
FAIL ──> RETRY ──> FAIL ──> RETRY ──> FAIL ──> RETRY ──> (System Meltdown)
```

That is not resilience. That is an **autonomous distributed recovery loop**.

A production-grade retry architecture must systematically evaluate:
```text
What failed? 
      │
      ▼
Is retry appropriate? 
      │
      ▼
Who owns retry? 
      │
      ▼
How many attempts? 
      │
      ▼
How long between attempts? 
      │
      ▼
Can duplicate execution be tolerated? 
      │
      ▼
Is the operation idempotent? 
      │
      ▼
What happens after exhaustion?
```

### The Architectural Equation of Safe Retry

$$\text{Safe Retry} = \text{Eligibility} \times \text{Bounded Attempts} \times \text{Controlled Delay} \times \text{Operation Safety} \times \text{Currentness} \times \text{Failure Escalation}$$

If any single factor is zero, retrying an operation becomes actively dangerous:
- **Zero Eligibility:** Retrying a deterministic `400 Bad Request` or a JavaScript `TypeError` produces 100% repeated failure.
- **Zero Bounded Attempts:** An unbounded retry loop causes client CPU lockups and server denial of service (DoS).
- **Zero Controlled Delay:** Immediate retries trigger thundering herd spikes on degraded infrastructure.
- **Zero Operation Safety:** Blindly retrying a non-idempotent `POST /payments` duplicates credit card charges ($50,000 $\rightarrow$ $100,000).
- **Zero Currentness:** Stale retries overwrite fresh user search queries.
- **Zero Failure Escalation:** The user is trapped forever watching a spinning loading wheel.

---

## 2. 🎯 Retry Is a Policy, Not a Button

In amateur React codebases, retry is implemented as a raw callback on a button:

```tsx
// ❌ NAIVE TRIGGER WITHOUT POLICY
<button onClick={retry}>Try again</button>
```

A button is merely an **interactive trigger**. The actual resilience architecture is a **multi-phase stateful policy**:

```text
User / System Trigger
         │
         ▼
    Retry Policy
         │
         ▼
  Eligibility Check (Transient 503 vs Deterministic 400)
         │
         ▼
   Attempt Execution (Idempotency Key: IDEM-9821)
         │
         ├─────────────────────────────────────────┐
         ▼                                         ▼
      Success                                   Failure
         │                                         │
         ▼                                         ▼
   Clear Timers                             Retry Allowed?
         │                                  (Attempts < Max)
         │                                         │
         │                               ┌─────────┴─────────┐
         │                               ▼                   ▼
         │                              YES                  NO
         │                               │                   │
         │                        Delay / Backoff     Terminal Failure
         │                        (Full Jitter)       (Render Fallback)
         │                               │                   │
         │                               ▼                   ▼
         └────────────────────────> Next Attempt      Escalate to User
```

Senior engineers strictly decouple:
1. **The Trigger:** User click, network reconnection, window focus, route transition.
2. **The Policy:** Eligibility evaluation, attempt budget, backoff formula, jitter coefficient.
3. **The Execution:** Stable operation ID, idempotency header injection, abort signal coordination.
4. **The Recovery:** State reset, cache revalidation, degraded fallback rendering, support escalation.

---

## 3. 🛑 Retry Does Not Mean "Try Again Forever"

Every retry mechanism must possess an unambiguous **termination condition**.

```ts
export interface RetryPolicy {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly backoffFactor: number;
  readonly jitter: 'none' | 'full' | 'decorrelated';
}

export const defaultApiRetryPolicy: RetryPolicy = {
  maxAttempts: 3,
  baseDelayMs: 500,
  maxDelayMs: 5000,
  backoffFactor: 2,
  jitter: 'full',
};
```

---

## 4. 🔢 Attempt Count Semantics Must Be Explicit

A pervasive source of off-by-one production bugs is semantic ambiguity between `attempt`, `retry`, `maxRetries`, and `maxAttempts`.

```text
Model A (maxAttempts = 3):
  Attempt 1 (Initial) ──> Attempt 2 (Retry 1) ──> Attempt 3 (Retry 2) ──> STOP (3 total HTTP requests)

Model B (maxRetries = 3):
  Initial Request ──> Retry 1 ──> Retry 2 ──> Retry 3 ──> STOP (4 total HTTP requests)
```

### The Enterprise Standard Definition:
$$\text{attemptNumber} = 1 \quad (\text{The Initial Execution})$$
$$\text{retryCount} = \text{attemptNumber} - 1$$
$$\text{Termination Condition: } \text{attemptNumber} \ge \text{maxAttempts}$$

---

## 5. 🔍 Retry Eligibility Matrix

Not all failures are candidates for retry. Retrying an ineligible failure wastes client battery, saturates cellular bandwidth, and corrupts backend audit logs.

| Failure Category | HTTP / Error Code | Root Cause | Should Frontend Auto-Retry? | Strategic Rationale |
| :--- | :--- | :--- | :---: | :--- |
| **Temporary Network** | `ECONNRESET`, `Failed to fetch` | Transient TCP drop | ✅ **YES** | Connection will likely succeed on immediate replay. |
| **Gateway Timeout** | `504 Gateway Timeout` | Upstream latency spike | ✅ **YES** | Upstream worker may recover after brief delay. |
| **Service Unavailable**| `503 Service Unavailable` | Server overloaded | ✅ **YES (With Backoff)** | Must respect `Retry-After` header if provided. |
| **Rate Limited** | `429 Too Many Requests` | Token bucket exhausted | ⚠️ **CONDITIONAL** | Only retry after server-specified cooldown period. |
| **Bad Request** | `400 Bad Request` | Malformed payload / schema | ❌ **NO** | Deterministic: Same payload will fail 100% of the time. |
| **Unauthorized** | `401 Unauthorized` | Missing or expired JWT | ❌ **NO (Auto-Auth First)**| Requires token refresh flow, not raw retry. |
| **Forbidden** | `403 Forbidden` | Insufficient RBAC roles | ❌ **NO** | Permission denied; repeating request is useless. |
| **Validation Failure**| `422 Unprocessable Entity` | Form field errors | ❌ **NO** | Requires user input correction before submission. |
| **Programming Bug** | `TypeError: cannot read 'map'`| JavaScript syntax / logic | ❌ **NO** | Code is broken; retry creates an infinite CPU loop. |
| **User Cancelled** | `AbortError: signal aborted` | User navigated away | ❌ **NO** | Intent no longer exists; cancel all pending timers. |

---

## 6. 🏷️ Retryability Must Be Classified Explicitly

Avoid binary boolean flags (`shouldRetry: boolean`). Model retry decisions as **Discriminated Unions**:

```ts
export type RetryDecision =
  | { readonly kind: 'retry'; readonly delayMs: number; readonly attempt: number }
  | { readonly kind: 'do-not-retry'; readonly reason: 'deterministic_error' | 'auth_required' | 'exhausted' | 'aborted' }
  | { readonly kind: 'reconcile_mutation'; readonly operationId: string; readonly reason: 'unknown_outcome' };
```

---

## 7. ⚖️ Expected vs Unexpected Failures (Component vs Operation)

A component rendering crash is fundamentally distinct from an asynchronous operation failure:

```text
Component Render Failure               Asynchronous Operation Failure
        │                                             │
  Render Exception                              Fetch Network Drop
        │                                             │
        ▼                                             ▼
Error Boundary Catch                         Promise Catch / TanStack Query
        │                                             │
        ▼                                             ▼
Replace DOM Fiber Tree                       Preserve DOM + Backoff Request
```

Never build a generic `retryEverything()` catch-all wrapper. Error boundaries handle **component containment**; retry policies handle **operation resiliency**.

## 8. 💥 Immediate Retry Amplification & Positive Feedback Loops

When a database or backend microservice experiences high load, an immediate retry strategy creates a **catastrophic positive feedback loop (Retry Storm)**:

```text
t=0ms:   10,000 Clients submit requests ──> Server Load 100% (Some drop)
t=50ms:  3,000 Failed clients retry IMMEDIATELY ──> Server Load 140%
t=100ms: 6,000 Failed clients retry IMMEDIATELY ──> Server Load 200%
t=150ms: COMPLETE SYSTEM OUTAGE (Cascading Backend Crash)
```

Immediate retries act as a distributed Denial of Service (DoS) attack orchestrated by your own frontend clients.

---

## 9. 📈 Exponential Backoff Formula

To allow degraded infrastructure to recover, the delay between consecutive retries must scale exponentially:

$$delay = \min\left(baseDelay \times backoffFactor^{attempt - 1}, \; maxDelay\right)$$

```text
Base Delay: 500ms, Backoff Factor: 2, Max Delay: 5000ms
  Attempt 1 (Initial): 0ms delay
  Attempt 2 (Retry 1): 500ms * (2^0) = 500ms
  Attempt 3 (Retry 2): 500ms * (2^1) = 1,000ms
  Attempt 4 (Retry 3): 500ms * (2^2) = 2,000ms
  Attempt 5 (Retry 4): 500ms * (2^3) = 4,000ms
  Attempt 6 (Retry 5): min(8000ms, 5000ms) = 5,000ms
```

---

## 10. 🎲 Jitter: Breaking Multi-Client Synchronization

Even with exponential backoff, thousands of clients that fail simultaneously at $t=0$ will all wake up together at $t=500\text{ms}$, $t=1000\text{ms}$, and $t=2000\text{ms}$. This creates rhythmic, pulsed waves of server load (**The Thundering Herd Problem**).

```text
WITHOUT JITTER (Pulsed Spikes):
Server Load
 │      ▲               ▲               ▲
 │      │               │               │
 └──────┴───────────────┴───────────────┴───────────> Time
     (t=500ms)      (t=1000ms)      (t=2000ms)

WITH FULL JITTER (Smooth Uniform Arrival):
Server Load
 │  ░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░
 └──────────────────────────────────────────────────> Time
```

### The Three Major Jitter Algorithms

#### 1. Full Jitter (AWS Recommended Standard)
$$delay_{\text{actual}} = \text{random}\left(0, \; \min(maxDelay, \; base \times 2^{attempt-1})\right)$$
- **Pros:** Maximum spread, lowest peak server load.
- **Recommended For:** General API requests, background sync.

#### 2. Equal Jitter
$$temp = \min(maxDelay, \; base \times 2^{attempt-1})$$
$$delay_{\text{actual}} = \frac{temp}{2} + \text{random}\left(0, \; \frac{temp}{2}\right)$$
- **Pros:** Guarantees a minimum sleep duration while preventing lockstep synchronization.

#### 3. Decorrelated Jitter
$$delay_{\text{actual}} = \min\left(maxDelay, \; \text{random}(base, \; previousDelay \times 3)\right)$$
- **Pros:** Adapts based on the previous sleep duration.

---

## 11. 📊 Mathematical Comparison of Jitter Strategies

| Strategy | Formula | Min Sleep | Max Sleep | Thundering Herd Elimination |
| :--- | :--- | :--- | :--- | :---: |
| **No Jitter (Fixed)** | $base \times 2^{n}$ | $base \times 2^n$ | $base \times 2^n$ | ❌ 0% (High spike risk) |
| **Full Jitter** | $random(0, base \times 2^n)$ | $0\text{ms}$ | $base \times 2^n$ | ✅ **100% (Optimal dispersion)** |
| **Equal Jitter** | $\frac{t}{2} + random(0, \frac{t}{2})$ | $\frac{base \times 2^n}{2}$ | $base \times 2^n$ | ✅ **90% (Good dispersion)** |

---

## 12. 📡 Server Guidance & `Retry-After` Header Parsing

Servers under heavy load communicate explicit backoff requirements using HTTP response headers:
1. `Retry-After: 120` (Integer number of seconds to wait).
2. `Retry-After: Fri, 31 Dec 2026 23:59:59 GMT` (HTTP Date).

```ts
export function parseRetryAfterHeader(headerValue: string | null): number | null {
  if (!headerValue) return null;

  // Check if it's a positive integer (seconds)
  const seconds = parseInt(headerValue, 10);
  if (!isNaN(seconds) && seconds >= 0) {
    return seconds * 1000; // Convert to ms
  }

  // Check if it's an HTTP Date string
  const targetDate = Date.parse(headerValue);
  if (!isNaN(targetDate)) {
    const diff = targetDate - Date.now();
    return Math.max(0, diff);
  }

  return null;
}
```

### Precedence Rule:
> **Server Guidance Always Trumps Client Policy.** If the server specifies `Retry-After: 30`, the client must wait 30,000ms regardless of whether its local exponential backoff formula calculated 1,000ms.

---

## 13. 🚦 Rate Limiting & HTTP 429 Protocols

When an API returns `429 Too Many Requests`:
1. Check for `Retry-After` or `X-RateLimit-Reset` headers.
2. If absent, apply exponential backoff with jitter and a minimum base delay of 2,000ms.
3. If consecutive 429s exceed 3 attempts, immediately trip the client-side circuit breaker and display a user-facing throttle warning.

---

## 14. 💳 HTTP Semantics & Safe Replay (GET vs POST)

HTTP methods possess strict RFC 7231 semantic guarantees:

| HTTP Method | Safe? | Idempotent? | Auto-Retry Eligible? | Rationale |
| :--- | :---: | :---: | :---: | :--- |
| **GET** | ✅ Yes | ✅ Yes | ✅ **YES** | Read-only; repeating does not alter server state. |
| **HEAD / OPTIONS** | ✅ Yes | ✅ Yes | ✅ **YES** | Metadata queries; safe to repeat. |
| **PUT** | ❌ No | ✅ Yes | ✅ **YES** | Replace semantics; setting $x=5$ twice still leaves $x=5$. |
| **DELETE** | ❌ No | ✅ Yes | ✅ **YES** | Deleting resource #10 twice leaves resource deleted. |
| **POST** | ❌ No | ❌ **NO** | ⚠️ **DANGEROUS** | Creates new entities; repeating without Idempotency Key duplicates records! |
| **PATCH** | ❌ No | ❌ **NO** | ⚠️ **DANGEROUS** | E.g. `{ balance: balance + 10 }` multiplies side effects on retry. |

## 15. ❓ The "Unknown Outcome" Problem

This is the most critical distributed systems concept in frontend engineering:

```text
Client                            Server / Database
  │                                      │
  ├─── 1. POST /orders ($50,000) ───────>│
  │                                      │ (Processes wire transfer)
  │                                      │ (Inserts order into DB)
  │                                      │ (Commits transaction)
  │    2. HTTP 200 Response Generated    │
  │               X                      │
  │    (DROPPED BY CELLULAR TOWER)       │
  │                                      │
  ▼ (Client encounters 5000ms TIMEOUT)   │
Client sees: "FAILURE / TIMEOUT"         │ Server committed: "SUCCESS"
```

### Axiom: Transport Failure $\neq$ Operation Failure
When a client encounters a network timeout or connection reset, **the client CANNOT assume the operation failed on the backend**. The server may have successfully committed the mutation.

If the client blindly retries `POST /orders`, the customer will be billed twice ($100,000).

---

## 16. 🔒 Idempotency: Definition & Mathematical Invariants

An operation $f$ is **idempotent** if applying it multiple times produces the exact same outcome as applying it once:

$$f(f(x)) = f(x)$$

```text
Non-Idempotent:  POST /bank/transfer  { amount: 50 }   ──> Billed $50 each time
Idempotent:      PUT  /bank/balance   { balance: 100 }  ──> Balance remains $100
Idempotent POST: POST /bank/transfer  + Idempotency-Key ──> Billed once, subsequent retries return cached receipt
```

---

## 17. 🔑 Idempotency Keys Architecture

To safely retry `POST` and `PATCH` mutations, the client must attach a unique **Idempotency Key** to the request header:

```http
POST /api/v2/checkout/orders HTTP/1.1
Host: api.enterprise.com
Idempotency-Key: 8d7c4a12-b903-4f91-884a-932810a9f042
Content-Type: application/json

{
  "cartId": "cart_99182",
  "amountCents": 5000000
}
```

### Backend Idempotency Workflow:
1. Server receives request with `Idempotency-Key`.
2. Checks Redis/PostgreSQL: Has this key been seen in the last 24 hours?
   - **No:** Process order, store result payload against key in Redis, return 200 OK.
   - **Yes (In-Flight):** Return `409 Conflict` or wait for the lock to release.
   - **Yes (Completed):** Return the **cached 200 OK response** without re-executing business logic.

---

## 18. 🚫 The Cardinal Sin: Never Generate a New Idempotency Key Per Retry

```tsx
// ❌ CATASTROPHIC ANTI-PATTERN: New key generated on every retry attempt!
function retryCheckout() {
  const newKey = crypto.randomUUID(); // 🚨 BREAKS IDEMPOTENCY!
  return fetch('/api/orders', {
    method: 'POST',
    headers: { 'Idempotency-Key': newKey }, // Server treats this as a brand new order!
    body: JSON.stringify(cartData)
  });
}

// ✅ PRODUCTION STANDARD: Stable Logical Operation Identity
class CheckoutController {
  private readonly logicalOperationId = crypto.randomUUID(); // Stable across all retries!

  public executeAttempt(attemptNumber: number) {
    return fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Idempotency-Key': this.logicalOperationId, // SAME KEY across Attempt 1, 2, 3
        'X-Attempt-Number': String(attemptNumber)
      },
      body: JSON.stringify(cartData)
    });
  }
}
```

---

## 19. 🧩 The 5 Core Software Identities

Enterprise frontend systems must explicitly decouple five distinct identity layers:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. COMPONENT IDENTITY │ Fiber Node: <CheckoutForm key="checkout_tab" />      │
├───────────────────────┼─────────────────────────────────────────────────────┤
│ 2. BOUNDARY IDENTITY  │ Error Boundary: <ResilientBoundary name="Checkout"> │
├───────────────────────┼─────────────────────────────────────────────────────┤
│ 3. ENTITY IDENTITY    │ Domain Record: Order #ord_88192                     │
├───────────────────────┼─────────────────────────────────────────────────────┤
│ 4. OPERATION IDENTITY │ Logical Intent: OP-WIRE-TRANSFER-8d7c4a (STABLE)    │
├───────────────────────┼─────────────────────────────────────────────────────┤
│ 5. ATTEMPT IDENTITY   │ Transport Request: ATTEMPT-1, ATTEMPT-2, ATTEMPT-3  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 20. 🔄 Stable Operation ID vs Incremental Attempt ID

```text
Logical User Intent: "Submit Wire Transfer ($50,000)"
  │
  ├── Operation ID: "op_wire_883a9f0" (STABLE IDEMPOTENCY KEY)
  │
  ├── Attempt 1 (t=0ms):    ID: "op_wire_883a9f0:att-1" ──> TIMEOUT
  ├── Attempt 2 (t=1000ms): ID: "op_wire_883a9f0:att-2" ──> TIMEOUT
  └── Attempt 3 (t=3000ms): ID: "op_wire_883a9f0:att-3" ──> 200 OK (Server dedupes)
```

---

## 21. ⏱️ Operation Currentness & Preventing Out-of-Order Overwrites

If a user modifies search filters or navigates away while a retry is pending in the background, executing that retry can overwrite fresh UI state with stale data.

```text
t=0ms:  User types "rea" ──> Op-101 Dispatched ──> Network Fails ──> Schedules Retry for t=2000ms
t=500ms: User types "react" ──> Op-102 Dispatched ──> Returns 200 OK with 50 results (Displayed on screen)
t=2000ms: Op-101 Retry Fires ──> Returns 200 OK with 5 results for "rea"
          🚨 WITHOUT CURRENTNESS GUARD: Screen is overwritten with stale "rea" data!
          ✅ WITH CURRENTNESS GUARD: Op-101 rejected because current active operation is Op-102.
```

## 22. 🔎 Retry Does Not Solve Stale Responses

Retry mechanisms must be bound to the **active operation token**. When a new search query or navigation occurs, all prior pending retry timers must be explicitly invalidated.

---

## 23. 🛑 Cancellation + Retry Lifecycle Integration

Cancelling an in-flight fetch request via `AbortController` is insufficient if the retry scheduler's `setTimeout` is left running:

```tsx
// ❌ ANTI-PATTERN: Aborting fetch leaves scheduled retry timer alive (Zombie Resurrection)
function search(query: string) {
  const controller = new AbortController();
  
  fetch(`/api/search?q=${query}`, { signal: controller.signal }).catch(() => {
    setTimeout(() => {
      // 🚨 Timer still fires even if user closed modal or navigated away!
      search(query);
    }, 2000);
  });

  return () => controller.abort(); // Cleans up fetch, but timer is still pending!
}

// ✅ PRODUCTION STANDARD: Coordinated Resource Teardown
class ManagedRetryOperation {
  private controller: AbortController | null = null;
  private timerId: any = null;
  private isCancelled = false;

  public cancel(): void {
    this.isCancelled = true;
    if (this.controller) this.controller.abort();
    if (this.timerId) clearTimeout(this.timerId);
    console.log('[RetryOperation] Successfully purged timer and aborted in-flight connection.');
  }
}
```

---

## 24. ⚙️ Complete Retry State Machine

```text
                         ┌──────────────┐
                         │     IDLE     │
                         └──────┬───────┘
                                │ start(opId)
                                ▼
                         ┌──────────────┐
              ┌─────────>│  ATTEMPTING  │<─────────┐
              │          └──────┬───────┘          │
              │                 │                  │
              │         ┌───────┴───────┐          │
              │         ▼               ▼          │
              │    [ SUCCESS ]     [ FAILURE ]     │
              │         │               │          │
              │         ▼         Is Retryable?    │
              │      Terminal           │          │
              │      (Done)      ┌──────┴──────┐   │
              │                  ▼             ▼   │
              │                [ NO ]       [ YES ]│
              │                  │             │   │
              │                  ▼             ▼   │
              │               Terminal     Attempts│Exhausted?
              │               Failure          │   │
              │                            ┌───┴───┴───┐
              │                            ▼           ▼
              │                         [ YES ]     [ NO ]
              │                            │           │
              │                            ▼           ▼
              │                         Terminal  ┌─────────┐
              │                         Failure   │ WAITING │
              │                                   └────┬────┘
              │                                        │ Delay (Backoff+Jitter)
              └────────────────────────────────────────┘
```

---

## 25. 🚪 Retry Exhaustion & Terminal Failure States

When `attemptNumber >= maxAttempts`, the state machine transitions to `TERMINAL_FAILURE`. In this state:
1. All automated retry schedulers are terminated.
2. The failure is escalated to the user with a plain-English explanation.
3. Actionable recovery buttons are presented:
   - `[ ↻ Manual Retry ]` (Resets attempt counter to 0).
   - `[ 📋 Copy Diagnostic Incident ID ]`.
   - `[ 💬 Contact Support ]`.

---

## 26. 📜 TypeScript State Contract (Zero Booleans)

```ts
export type RetryMachineState =
  | { readonly status: 'IDLE' }
  | { readonly status: 'ATTEMPTING'; readonly operationId: string; readonly attempt: number }
  | { readonly status: 'WAITING'; readonly operationId: string; readonly attempt: number; readonly retryAt: number; readonly delayMs: number }
  | { readonly status: 'SUCCESS'; readonly operationId: string; readonly data: unknown }
  | { readonly status: 'TERMINAL_FAILURE'; readonly operationId: string; readonly attempts: number; readonly error: Error; readonly correlationId: string }
  | { readonly status: 'CANCELLED'; readonly operationId: string };
```

---

## 27. 🔄 Reducer State Transitions (`useRetryReducer`)

```ts
export type RetryAction =
  | { type: 'START'; operationId: string }
  | { type: 'ATTEMPT'; operationId: string; attempt: number }
  | { type: 'SCHEDULE_WAIT'; operationId: string; attempt: number; delayMs: number }
  | { type: 'RESOLVE_SUCCESS'; operationId: string; data: unknown }
  | { type: 'FAIL_TERMINAL'; operationId: string; error: Error; correlationId: string }
  | { type: 'CANCEL'; operationId: string };

export function retryReducer(state: RetryMachineState, action: RetryAction): RetryMachineState {
  // Reject actions from stale, non-matching operations
  if (state.status !== 'IDLE' && 'operationId' in state && state.operationId !== action.operationId) {
    console.warn(`[RetryReducer] Stale action ignored for ${action.operationId} (Current: ${state.operationId})`);
    return state;
  }

  switch (action.type) {
    case 'START':
      return { status: 'ATTEMPTING', operationId: action.operationId, attempt: 1 };
    case 'ATTEMPT':
      return { status: 'ATTEMPTING', operationId: action.operationId, attempt: action.attempt };
    case 'SCHEDULE_WAIT':
      return {
        status: 'WAITING',
        operationId: action.operationId,
        attempt: action.attempt,
        retryAt: Date.now() + action.delayMs,
        delayMs: action.delayMs,
      };
    case 'RESOLVE_SUCCESS':
      return { status: 'SUCCESS', operationId: action.operationId, data: action.data };
    case 'FAIL_TERMINAL':
      return {
        status: 'TERMINAL_FAILURE',
        operationId: action.operationId,
        attempts: state.status === 'ATTEMPTING' ? state.attempt : 1,
        error: action.error,
        correlationId: action.correlationId,
      };
    case 'CANCEL':
      return { status: 'CANCELLED', operationId: action.operationId };
    default:
      return state;
  }
}
```

---

## 28. ⏳ The Retry Timer Is an Active Resource

Every call to `setTimeout` creates an active timer handle in the browser's event loop. In high-frequency React dashboards, unmanaged timers cause **Memory Leaks, Unmounted Component State Updates, and Stale Fetch Race Conditions**.

## 29. 🧹 Component Lifetimes & Unmount Teardown Symmetry

When a component unmounts, its associated retry controller must clean up all in-flight connections and pending timers:

```tsx
export function useManagedRetry<T>() {
  const controllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      // Component unmount cleanup
      if (controllerRef.current) controllerRef.current.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
}
```

---

## 30. 🤖 Automatic Retry vs User-Initiated Retry vs Hybrid Escalation

```text
+-----------------------+-----------------------------+------------------------------------+
| Retry Strategy        | Execution Trigger           | Best Used For                      |
+-----------------------+-----------------------------+------------------------------------+
| **Automatic Retry**   | Internal backoff timer      | Transient 503s, WebGL loss, Idempotent reads |
| **User-Initiated**    | User clicks "Retry" button  | High-risk mutations, Form submissions |
| **Hybrid Escalation** | 2 Auto Retries ──> Fallback ──> User manual retry CTA | Mission-critical SaaS dashboards |
+-----------------------+-----------------------------+------------------------------------+
```

---

## 31. 🐛 Do Not Retry Deterministic Programming Bugs

If a component crashes due to `TypeError: Cannot read properties of undefined (reading 'map')`, retrying 10 times will execute the exact same buggy code 10 times, causing 10 identical crashes and freezing the browser main thread.

---

## 32. 📑 Deterministic vs Transient Failure Classification

```text
┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
│       TRANSIENT FAILURES (RETRY)     │  │   DETERMINISTIC FAILURES (NO RETRY)  │
├──────────────────────────────────────┤  ├──────────────────────────────────────┤
│ • TCP Connection Reset               │  │ • 400 Bad Request (Invalid JSON)     │
│ • 504 Gateway Timeout                │  │ • 401 Unauthorized (Expired JWT)     │
│ • 503 Service Unavailable            │  │ • 403 Forbidden (RBAC violation)     │
│ • 429 Too Many Requests              │  │ • 422 Unprocessable Entity           │
│ • WebGL GPU Context Loss             │  │ • TypeError: Cannot read property    │
└──────────────────────────────────────┘  └──────────────────────────────────────┘
```

---

## 33. 🔁 Retry and Error Boundary Fallback Loops

If an Error Boundary fallback automatically triggers `resetBoundary()` in a `useEffect`, a child with a deterministic rendering bug will create an **Infinite Render-Crash Loop**:

```text
Render Bug ──> Crash ──> Fallback Mounts ──> useEffect calls resetBoundary() ──> Render Bug ──> Crash (Loop!)
```

To eliminate this loop, boundaries must enforce a **3-Attempt Circuit Breaker**.

---

## 34. 🕸️ Multi-Layered Recovery Loops

Recovery loops can span multiple architectural layers:

```text
Component Crash ──> Boundary Resets ──> Cache Invalidates ──> Provider Refetches ──> Component Remounts (Loop!)
```

---

## 35. 📡 Global Telemetry Correlation Across Recovery Loops

To diagnose recovery storms in Datadog / Sentry, every attempt must log its **Operation ID**, **Attempt Number**, and **Causal Lineage**:

```json
{
  "correlationId": "ERR-9821-US",
  "operationId": "op_checkout_883a9",
  "attemptNumber": 3,
  "maxAttempts": 3,
  "delayAppliedMs": 2000,
  "errorType": "GatewayTimeout",
  "componentLineage": ["AppRoot", "Route:Checkout", "Pod:Payment", "Widget:StripeElements"],
  "idempotencyKey": "8d7c4a12-b903-4f91",
  "isTerminal": true
}
```

## 36. 🔥 Production Crucible #1 — The Infinite Boundary Loop

### Incident Post-Mortem
- **Incident Summary:** During a major deployment, users visiting `/analytics` experienced 100% CPU lockups and frozen browser tabs.
- **Root Cause:** A developer added an automated `useEffect(() => { reset(); }, [error])` in the route fallback. A missing prop in the analytics chart caused an immediate crash upon remount, resulting in 5,000 render cycles per second.
- **Remediation:** Banned automated `reset()` inside fallbacks; mandated `BoundedRetryPolicy` with circuit breaker tripping after 3 consecutive failures.

```tsx
// AST Lint Rule: eslint-rules/no-auto-boundary-reset.js
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow automated reset() calls inside Error Boundary fallback useEffect hooks' }
  },
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.name === 'useEffect') {
          const body = node.arguments[0]?.body;
          if (body && JSON.stringify(body).includes('reset(')) {
            context.report({
              node,
              message: 'Automated boundary reset inside useEffect causes infinite recovery loops. Must require user action or backoff.'
            });
          }
        }
      }
    };
  }
};
```

---

## 37. 🔥 Production Crucible #2 — The Duplicate Order Creation ($100,000 Double Charge)

### Incident Post-Mortem
- **Incident Summary:** An enterprise customer purchasing $50,000 in GPU compute was billed twice ($100,000).
- **Root Cause:** A gateway timeout occurred on the initial `POST /api/orders`. The frontend retry logic generated a brand new `crypto.randomUUID()` for the `Idempotency-Key` header on the retry. The backend treated the retry as a separate, distinct order.
- **Remediation:** Established the **Stable Operation Identity Invariant**: The idempotency key is tied to the lifecycle of the logical user intent, never generated dynamically inside the retry loop.

---

## 38. 🔥 Production Crucible #3 — The 10,000-Client Retry Storm

### Incident Post-Mortem
- **Incident Summary:** When a primary PostgreSQL database replica restarted, 10,000 active dashboard sessions encountered 503 errors and immediately retried every 500ms without jitter.
- **Root Cause:** Lockstep retry synchronization created massive 10,000-request traffic spikes every 500ms, preventing the database connection pool from stabilizing.
- **Remediation:** Implemented **Full Jitter** ($random(0, delay)$) across all API clients.

---

## 39. 🔥 Production Crucible #4 — The Resurrected Search Query

### Incident Post-Mortem
- **Incident Summary:** Users searching for confidential employee records saw outdated search results flash onto their screen after clearing the search box.
- **Root Cause:** An asynchronous retry timer scheduled for a previous search query fired after the user cleared their search bar. The retry completed and overwrote the clean search view.
- **Remediation:** Integrated `AbortController` cancellation with operation currentness validation.

---

## 40. 🔥 Production Crucible #5 — Broken Client Payload Amplification

### Incident Post-Mortem
- **Incident Summary:** A frontend bug serialized `NaN` into an order quantity payload, triggering `400 Bad Request` from the server.
- **Root Cause:** The client classified all HTTP errors as retryable, retrying the invalid `400 Bad Request` 5 times per client across 200,000 sessions.
- **Remediation:** Enforced strict HTTP status eligibility checks—only `502`, `503`, `504`, and network drops are retryable.

## 41. 📊 Complete Retry Decision Matrix

| HTTP Status / Condition | Automatic Retry? | User Retry? | Backoff Strategy |
| :--- | :---: | :---: | :--- |
| **Network Timeout (0 status)** | ✅ Yes | ✅ Yes | Exponential Backoff + Full Jitter |
| **503 Service Unavailable** | ✅ Yes | ✅ Yes | Respect `Retry-After` or Full Jitter |
| **429 Too Many Requests** | ⚠️ Conditional | ✅ Yes | Respect `Retry-After` + Min 2s Cooldown |
| **500 Internal Server Error** | ❌ No (Usually) | ✅ Yes | 1 Single Cautious Retry |
| **400 Bad Request** | ❌ **NO** | ❌ No | Fix client payload schema |
| **401 Unauthorized** | ❌ **NO** | ⚠️ Re-auth | Execute token refresh flow |
| **403 Forbidden** | ❌ **NO** | ❌ No | Display Access Denied View |
| **422 Unprocessable Entity** | ❌ **NO** | ⚠️ After Edit| Highlight field validation errors |
| **JavaScript TypeError** | ❌ **NO** | ⚠️ Limited (3x) | Bulkhead 2D Fallback + Sentry Log |

---

## 42. 📑 Complete Retry Policy Matrix by API Domain

| Domain / API Endpoint | Idempotency Required? | Max Attempts | Base Delay | Jitter Strategy |
| :--- | :---: | :---: | :---: | :--- |
| **Read Queries (`GET /analytics`)** | ❌ No (Safe) | 3 | 500ms | Full Jitter |
| **Search Autocomplete (`GET /search`)** | ❌ No (Safe) | 2 | 250ms | Full Jitter + Currentness Guard |
| **Order Creation (`POST /orders`)** | ✅ **CRITICAL** | 3 | 1000ms | Full Jitter + Stable Operation ID |
| **Billing Wire (`POST /transfers`)** | ✅ **CRITICAL** | 2 | 2000ms | Full Jitter + Server Reconciliation |
| **User Profile Update (`PUT /user`)** | ❌ No (Idempotent) | 3 | 500ms | Full Jitter |
| **Telemetry Ingestion (`POST /logs`)** | ❌ No (Lossy OK) | 2 | 2000ms | Exponential Backoff (Drop on fail) |

---

## 43. 🚫 Comprehensive "When NOT to Retry" Catalog

Do **NOT** retry under any of the following 10 conditions:
1. When the request failed due to client-side input validation (`422`).
2. When the failure is a deterministic JavaScript syntax or rendering error (`TypeError`).
3. When the user explicitly clicked "Cancel" or closed the modal.
4. When the user has navigated to another URL route.
5. When the server explicitly returns `400 Bad Request` or `403 Forbidden`.
6. When repeating an unsafe mutation (`POST`) without an `Idempotency-Key`.
7. When the client-side circuit breaker is currently `OPEN`.
8. When the device is completely offline and `navigator.onLine === false`.
9. When the operation token is no longer current.
10. When the server response explicitly sends `Cache-Control: no-store, no-retry`.

---

## 44. 🧠 User Intent Precedence over Stale Operations

User intent changes dynamically. If a user triggers Intent A, then rapidly triggers Intent B:
$$\text{Intent } B \succ \text{Intent } A$$
Any scheduled retries or pending responses from Intent A must be rejected by an **Operation Currentness Guard**.

---

## 45. 🎨 Retry and Optimistic UI Reconciliation

When retrying an optimistic mutation:
1. Do not re-apply the optimistic delta on every attempt (prevents duplicate visual state).
2. If all retry attempts fail, execute a clean **Rollback** to the original authoritative server state.
3. Provide an accessible toast notification informing the user that the change could not be saved.

---

## 46. ⚖️ Retry vs Idempotency: The Dual Requirement

- **Retry answers:** *"Should we execute the network request again?"*
- **Idempotency answers:** *"What happens on the database when the request executes again?"*

Resilience requires **both** questions to be answered affirmatively.

---

## 47. 🏁 Termination & Communicating Progress to Users

Never show an indefinite "Retrying..." spinner. Provide explicit progress indicators:
- *"Attempting connection (1/3)..."*
- *"Retrying in 2 seconds (Attempt 2/3)..."*
- *"We couldn't connect after 3 attempts. [Try Again] [Work Offline]"*

---

## 48. 🪜 Recovery Escalation Hierarchy

```text
Level 1: Transparent Automatic Retry (1-2 attempts with Full Jitter)
         │ (Exhausted)
         ▼
Level 2: User-Visible Degraded Fallback (Tabular view + Retry CTA)
         │ (User Retries & Fails)
         ▼
Level 3: Alternative Workflow (Download CSV / Direct Invoice / Cache View)
         │ (Outage Persists)
         ▼
Level 4: Support Escalation (Render Incident Correlation ID + Diagnostic Log)
```

## 49. 🛠️ 8-Step Senior Diagnostic Runbook

When investigating a suspected recovery storm or duplicate billing incident:

1. **Step 1 (Identify Operation):** What logical operation is repeating? Inspect `operationId` in request logs.
2. **Step 2 (Count Attempts):** How many attempts occurred within the 10-second window?
3. **Step 3 (Identify Owner):** Who triggered each retry? (Query hook vs Boundary reset vs Button click).
4. **Step 4 (Inspect Delays):** Are requests arriving at 0ms, 500ms, or randomized jitter intervals?
5. **Step 5 (Verify Termination):** Did the system stop after max attempts, or did it loop infinitely?
6. **Step 6 (Check Idempotency):** Did all retry attempts share the exact same `Idempotency-Key`?
7. **Step 7 (Validate Currentness):** Did a late retry overwrite a newer user action?
8. **Step 8 (Inspect Server Ledger):** Were duplicate entity records created in the database?

---

## 50. 🌐 Chrome DevTools Network Diagnostic Protocol

1. Open **Chrome DevTools > Network tab**.
2. Enable **Preserve log**.
3. Trigger the failure and observe the waterfall.
4. Verify the time delta between consecutive failed requests:
   - `0ms, 50ms, 100ms` $\rightarrow$ 🚨 **CRITICAL: Uncontrolled loop!**
   - `500ms, 1000ms, 2000ms` $\rightarrow$ ⚠️ **Exponential without jitter.**
   - `420ms, 890ms, 1750ms` $\rightarrow$ ✅ **Healthy Exponential Backoff + Full Jitter.**
5. Inspect request headers: Confirm `Idempotency-Key` is identical across all retries.

---

## 51. 🔬 React DevTools Fiber Lifecycle Investigation

Inspect whether retries correspond to **Component Remounts** vs **Component Re-renders**:
- Repeated mount cycles (`Mount -> Effect -> Crash -> Fallback -> Reset -> Mount`) indicate an architectural boundary placement bug.

---

## 52. 🔮 Prediction Challenges (Staff Engineering Review)

### Prediction Challenge 1
```tsx
useEffect(() => {
  fetchData();
}, []);
```
*Scenario:* The component is repeatedly remounted by a parent error boundary.  
*Question:* Why do network requests repeat even though the dependency array is `[]`?  
*Answer:* The empty array `[]` only controls effect execution within a single component lifecycle. Unmounting and remounting creates a brand new Fiber lifecycle, executing the effect again.

### Prediction Challenge 2
*Scenario:* `POST /payment` times out after 5,000ms.  
*Question:* Can the frontend assume the payment failed?  
*Answer:* **No.** The outcome is **UNKNOWN**. The server may have processed the payment while the response was dropped. Recovery must use a stable `Idempotency-Key`.

### Prediction Challenge 3
*Scenario:* `maxAttempts = 3`, but the developer generates a new `crypto.randomUUID()` inside the retry loop.  
*Question:* Is this one operation with three attempts?  
*Answer:* **No.** The backend receives three distinct operation identities, creating three duplicate records.

### Prediction Challenge 4
*Scenario:* A search request is cancelled via `AbortController.abort()`. A `setTimeout` retry was scheduled for 2 seconds later.  
*Question:* Does cancelling the fetch prevent the retry?  
*Answer:* **No.** Unless the retry timer handle is explicitly cleared via `clearTimeout`, the timer will fire and resurrect the cancelled query.

## 57. 📋 50-Point Enterprise Production Readiness Checklist

```text
[x] 1.  Retry is modeled as an explicit stateful policy, not a naked button callback.
[x] 2.  Attempt count semantics explicitly define attemptNumber=1 as initial execution.
[x] 3.  Maximum attempt budget is bounded (Default: 3 attempts).
[x] 4.  Terminal failure state exists and halts all automated retry loops.
[x] 5.  Deterministic errors (400, 401, 403, 422, TypeErrors) are strictly non-retryable.
[x] 6.  Transient errors (503, 504, connection drops) are classified as retryable.
[x] 7.  Exponential backoff formula delay = min(base * 2^(n-1), maxDelay) is enforced.
[x] 8.  Full Jitter random(0, delay) is applied to eliminate thundering herd spikes.
[x] 9.  Server Retry-After headers always override client-side backoff calculations.
[x] 10. HTTP 429 Too Many Requests enforces a minimum 2,000ms cooldown.
[x] 11. GET, HEAD, PUT, DELETE requests are treated as safe idempotent replays.
[x] 12. POST and PATCH mutations require stable Idempotency-Key headers for retry.
[x] 13. Idempotency Key is NEVER re-generated inside a retry loop.
[x] 14. Operation Identity is decoupled from Attempt Identity.
[x] 15. The "Unknown Outcome" problem is documented in payment and checkout runbooks.
[x] 16. Client-side Circuit Breakers trip to OPEN after 3 consecutive failures.
[x] 17. Circuit Breaker cooldown timer is set between 5,000ms and 15,000ms.
[x] 18. Operation Currentness Guards reject responses from stale, superseded intents.
[x] 19. AbortController cancellation explicitly clears scheduled setTimeout retry timers.
[x] 20. Component unmount hooks abort in-flight requests and purge retry timer handles.
[x] 21. Error Boundaries enforce a 3-attempt circuit breaker to prevent render crash loops.
[x] 22. Automated resetBoundary() calls inside useEffect hooks are forbidden.
[x] 23. Form drafts are synced to sessionStorage to prevent data loss during retry resets.
[x] 24. Structured telemetry logs capture operationId, attemptNumber, and correlationId.
[x] 25. Telemetry logging failures are wrapped defensively to prevent secondary crashes.
[x] 26. User-facing error messages adhere to the 3-part structure (WHAT + IMPACT + NEXT).
[x] 27. Raw JavaScript stack traces and database SQL syntax are stripped from prod UI.
[x] 28. Unique alphanumeric Correlation IDs (ERR-XXXX) are displayed on all fallbacks.
[x] 29. Copy Diagnostic Report button allows users to export telemetry payload to clipboard.
[x] 30. Retry buttons declare explicit semantic labels (e.g. "↻ Retry Revenue Chart").
[x] 31. Fallback containers declare role="region" or role="alert" for WCAG 2.1 AA.
[x] 32. Screen reader live regions utilize aria-live="polite" for non-disruptive retries.
[x] 33. Programmatic focus shifts to <h2 tabIndex="-1"> on route-level outages.
[x] 34. Focus is NOT stolen from active input fields during minor leaf widget retries.
[x] 35. High-contrast focus rings meet minimum 3:1 contrast against backgrounds.
[x] 36. Fallback color contrast ratios meet minimum 4.5:1 for standard text.
[x] 37. Fallback layouts preserve container min-height to eliminate CLS (Cumulative Layout Shift).
[x] 38. AST ESLint rules enforce bulkhead boundaries on high-risk widgets.
[x] 39. AST ESLint rules forbid automated boundary resets inside useEffect.
[x] 40. Unit tests verify exponential backoff delay progression across attempts.
[x] 41. Unit tests verify full jitter random distribution across multiple mock clients.
[x] 42. Unit tests verify circuit breaker trips to OPEN after 3 consecutive failures.
[x] 43. Unit tests verify Idempotency-Key remains stable across all retry attempts.
[x] 44. Unit tests verify AbortController aborts in-flight request and clears timers.
[x] 45. Unit tests verify stale operation retries cannot overwrite newer search queries.
[x] 46. Unit tests verify form input state survives sibling widget retry resets.
[x] 47. Sentry / Datadog release tags are attached to all retry telemetry events.
[x] 48. Distributed tracing headers (traceparent, baggage) are propagated on retries.
[x] 49. End-to-end Cypress/Playwright tests verify recovery under simulated 503 outages.
[x] 50. Post-mortem runbook established with MTTD < 5m and MTTR < 15m for recovery loops.
```

## 58. 💻 Production-Grade TypeScript Reference Implementation

Here is the complete reference implementation containing the `IdempotentRetryClient`, `useRetryableOperation`, `CircuitBreakerPolicy`, and `A11yRetryFallback`.

```tsx
// ============================================================================
// 1. IdempotentRetryClient.ts
// ============================================================================
export interface RetryConfig {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  jitter?: 'none' | 'full' | 'equal';
}

export class IdempotentRetryClient {
  constructor(private readonly config: RetryConfig = {}) {}

  public async execute<T>(
    operationFn: (attempt: number, signal: AbortSignal, idempotencyKey: string) => Promise<T>,
    options: {
      operationId?: string;
      signal?: AbortSignal;
      onAttempt?: (attempt: number, delayMs: number) => void;
    } = {}
  ): Promise<T> {
    const maxAttempts = this.config.maxAttempts || 3;
    const baseDelay = this.config.baseDelayMs || 500;
    const maxDelay = this.config.maxDelayMs || 5000;
    const factor = this.config.backoffFactor || 2;
    const jitter = this.config.jitter || 'full';

    // Stable Logical Operation ID across all retries!
    const logicalOperationId = options.operationId || `OP-${Math.random().toString(36).substring(2, 9)}`;
    const idempotencyKey = `IDEM-${logicalOperationId}`;

    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt += 1;

      if (options.signal?.aborted) {
        throw new DOMException('Operation aborted by user', 'AbortError');
      }

      try {
        const result = await operationFn(attempt, options.signal || new AbortController().signal, idempotencyKey);
        return result;
      } catch (err: any) {
        // Check Eligibility
        if (err.name === 'AbortError' || err.status === 400 || err.status === 401 || err.status === 403 || err.status === 422) {
          throw err; // Non-retryable deterministic error!
        }

        if (attempt >= maxAttempts) {
          throw new Error(`[RetryExhaustion] Operation ${logicalOperationId} failed after ${maxAttempts} attempts. Last error: ${err.message}`);
        }

        // Calculate Exponential Backoff with Jitter
        const rawDelay = Math.min(maxDelay, baseDelay * Math.pow(factor, attempt - 1));
        let actualDelay = rawDelay;

        if (jitter === 'full') {
          actualDelay = Math.floor(Math.random() * rawDelay);
        } else if (jitter === 'equal') {
          actualDelay = Math.floor(rawDelay / 2 + Math.random() * (rawDelay / 2));
        }

        options.onAttempt?.(attempt, actualDelay);
        await new Promise((resolve) => setTimeout(resolve, actualDelay));
      }
    }

    throw new Error('Unexpected retry loop termination');
  }
}

// ============================================================================
// 2. useRetryableOperation.ts (React Hook with Currentness Guard)
// ============================================================================
import { useState, useRef, useEffect, useCallback } from 'react';

export function useRetryableOperation<TData, TVariables>(
  mutationFn: (variables: TVariables, attempt: number, signal: AbortSignal, idempotencyKey: string) => Promise<TData>,
  config: RetryConfig = {}
) {
  const [state, setState] = useState<{
    isLoading: boolean;
    data: TData | null;
    error: Error | null;
    attempt: number;
    delayMs: number;
  }>({
    isLoading: false,
    data: null,
    error: null,
    attempt: 0,
    delayMs: 0,
  });

  const activeOpIdRef = useRef<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const clientRef = useRef(new IdempotentRetryClient(config));

  const mutate = useCallback(async (variables: TVariables) => {
    // 1. Invalidate previous operation
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();

    const currentOpId = `OP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    activeOpIdRef.current = currentOpId;

    setState({ isLoading: true, data: null, error: null, attempt: 1, delayMs: 0 });

    try {
      const result = await clientRef.current.execute(
        (attempt, signal, idempotencyKey) => mutationFn(variables, attempt, signal, idempotencyKey),
        {
          operationId: currentOpId,
          signal: controllerRef.current.signal,
          onAttempt: (attempt, delayMs) => {
            if (activeOpIdRef.current === currentOpId) {
              setState((prev) => ({ ...prev, attempt, delayMs }));
            }
          },
        }
      );

      // Currentness Guard Check
      if (activeOpIdRef.current === currentOpId) {
        setState({ isLoading: false, data: result, error: null, attempt: 0, delayMs: 0 });
      }
      return result;
    } catch (err: any) {
      if (activeOpIdRef.current === currentOpId) {
        setState({ isLoading: false, data: null, error: err, attempt: 0, delayMs: 0 });
      }
      throw err;
    }
  }, [mutationFn]);

  const cancel = useCallback(() => {
    if (controllerRef.current) controllerRef.current.abort();
    activeOpIdRef.current = null;
    setState((prev) => ({ ...prev, isLoading: false }));
  }, []);

  useEffect(() => {
    return () => cancel();
  }, [cancel]);

  return { mutate, cancel, ...state };
}

// ============================================================================
// 3. A11yRetryFallback.tsx (Accessible Fallback Card)
// ============================================================================
import React, { FC } from 'react';

export const A11yRetryFallback: FC<{
  name: string;
  error: Error;
  correlationId: string;
  onRetry: () => void;
  isRetrying: boolean;
  attempt?: number;
  maxAttempts?: number;
}> = ({ name, error, correlationId, onRetry, isRetrying, attempt = 1, maxAttempts = 3 }) => {
  return (
    <section
      role="region"
      aria-labelledby={`heading-${correlationId}`}
      className="p-5 border border-rose-900/50 bg-rose-950/20 rounded-xl flex flex-col justify-between"
    >
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-800/40">
            RESILIENCE BULKHEAD
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Ref: <strong className="text-slate-200">{correlationId}</strong>
          </span>
        </div>

        <h3 id={`heading-${correlationId}`} className="text-sm font-bold text-rose-200 mb-1">
          {name} encountered a temporary issue
        </h3>
        <p className="text-xs text-slate-300 mb-3 leading-relaxed">
          {error.message || 'Operation failed.'} Your unsaved session data is safe.
        </p>
      </div>

      <div className="pt-3 border-t border-rose-900/30 flex items-center justify-between">
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
        >
          {isRetrying ? (
            <>
              <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Attempting ({attempt}/{maxAttempts})...</span>
            </>
          ) : (
            <span>↻ Retry {name}</span>
        </button>
        <span className="text-[10px] text-slate-500 font-mono">Preserved State: OK</span>
      </div>
    </section>
  );
};

// ============================================================================
// 4. CircuitBreakerPolicy.ts (Distributed Circuit Breaker with Half-Open Probe)
// ============================================================================
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold?: number;
  cooldownMs?: number;
  probeSuccessThreshold?: number;
}

export class CircuitBreakerPolicy {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private consecutiveSuccessCount = 0;
  private lastFailureTime = 0;

  constructor(
    private readonly name: string,
    private readonly config: CircuitBreakerConfig = {}
  ) {}

  public canExecute(): boolean {
    const threshold = this.config.failureThreshold || 3;
    const cooldown = this.config.cooldownMs || 8000;
    const now = Date.now();

    if (this.state === 'OPEN') {
      if (now - this.lastFailureTime >= cooldown) {
        this.state = 'HALF_OPEN';
        this.consecutiveSuccessCount = 0;
        console.log(`[CircuitBreaker:${this.name}] 🟡 Cooldown elapsed. Transitioning to HALF_OPEN probe state.`);
        return true;
      }
      return false; // Circuit remains open
    }

    return true; // CLOSED or HALF_OPEN
  }

  public recordSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.consecutiveSuccessCount += 1;
      const target = this.config.probeSuccessThreshold || 2;
      if (this.consecutiveSuccessCount >= target) {
        this.state = 'CLOSED';
        this.failureCount = 0;
        console.log(`[CircuitBreaker:${this.name}] 🟢 Probes succeeded. Circuit returned to CLOSED state.`);
      }
    } else {
      this.failureCount = 0;
    }
  }

  public recordFailure(): void {
    const threshold = this.config.failureThreshold || 3;
    this.failureCount += 1;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN' || this.failureCount >= threshold) {
      this.state = 'OPEN';
      console.warn(`[CircuitBreaker:${this.name}] 🚨 Tripped to OPEN! Next retry allowed in ${this.config.cooldownMs || 8000}ms`);
    }
  }

  public getState(): CircuitState {
    return this.state;
  }

  public getCooldownRemainingMs(): number {
    if (this.state !== 'OPEN') return 0;
    const cooldown = this.config.cooldownMs || 8000;
    const elapsed = Date.now() - this.lastFailureTime;
    return Math.max(0, cooldown - elapsed);
  }
}

// ============================================================================
// 5. IdempotencyStorageAdapter.ts (Client-Side Key Persistence)
// ============================================================================
export interface CachedMutationResponse<T = unknown> {
  idempotencyKey: string;
  response: T;
  timestamp: number;
}

export class IdempotencyStorageAdapter {
  private static readonly STORAGE_PREFIX = 'idempotency_cache_';

  public static set<T>(key: string, response: T, ttlMs = 86400000): void {
    try {
      const payload: CachedMutationResponse<T> = {
        idempotencyKey: key,
        response,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(`${this.STORAGE_PREFIX}${key}`, JSON.stringify(payload));
    } catch (e) {
      console.warn('[IdempotencyStorage] Quota exceeded or storage unavailable:', e);
    }
  }

  public static get<T>(key: string, ttlMs = 86400000): T | null {
    try {
      const item = sessionStorage.getItem(`${this.STORAGE_PREFIX}${key}`);
      if (!item) return null;
      const parsed: CachedMutationResponse<T> = JSON.parse(item);
      if (Date.now() - parsed.timestamp > ttlMs) {
        sessionStorage.removeItem(`${this.STORAGE_PREFIX}${key}`);
        return null;
      }
      return parsed.response;
    } catch {
      return null;
    }
  }
}

// ============================================================================
// 6. withRetryBoundary.tsx (Higher-Order Component with Bounded Recovery)
// ============================================================================
import React, { ComponentType, FC } from 'react';

export function withRetryBoundary<P extends object>(
  ComponentToWrap: ComponentType<P>,
  fallbackProps: { name: string; maxAttempts?: number }
) {
  const Wrapped: FC<P> = (props) => {
    return (
      <A11yRetryFallback
        name={fallbackProps.name}
        error={new Error('Simulated Component Crash')}
        correlationId="ERR-HOC-9918"
        onRetry={() => window.location.reload()}
        isRetrying={false}
        maxAttempts={fallbackProps.maxAttempts || 3}
      />
    );
  };

  Wrapped.displayName = `withRetryBoundary(${ComponentToWrap.displayName || ComponentToWrap.name || 'Component'})`;
  return Wrapped;
}

// ============================================================================
// 7. useNetworkStatusRetry.ts (Reconnection Auto-Retry Hook)
// ============================================================================
export function useNetworkStatusRetry(onReconnect: () => void) {
  useEffect(() => {
    const handleOnline = () => {
      console.log('[NetworkStatus] Device back online. Triggering bounded background revalidation.');
      onReconnect();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [onReconnect]);
}
```

## 59. 🧪 Complete Vitest & React Testing Library Suite (10 Test Suites)

```tsx
// IdempotentRetryClient.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IdempotentRetryClient } from './IdempotentRetryClient';

describe('IdempotentRetryClient & Resilience Test Suite', () => {
  let client: IdempotentRetryClient;

  beforeEach(() => {
    vi.useFakeTimers();
    client = new IdempotentRetryClient({
      maxAttempts: 3,
      baseDelayMs: 200,
      maxDelayMs: 2000,
      jitter: 'none', // Deterministic delays for unit testing
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Suite 1: Single attempt success
  it('returns data immediately on first attempt without retrying', async () => {
    const mockFn = vi.fn().mockResolvedValue('SUCCESS_DATA');

    const resultPromise = client.execute(mockFn);
    const result = await resultPromise;

    expect(result).toBe('SUCCESS_DATA');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  // Suite 2: Exponential backoff recovery
  it('retries with exponential delay and resolves on attempt 3', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('503 Service Unavailable'))
      .mockRejectedValueOnce(new Error('504 Gateway Timeout'))
      .mockResolvedValueOnce('RECOVERED_DATA');

    const onAttemptSpy = vi.fn();
    const resultPromise = client.execute(mockFn, { onAttempt: onAttemptSpy });

    // Advance Attempt 1 -> 2 (200ms)
    await vi.advanceTimersByTimeAsync(200);
    // Advance Attempt 2 -> 3 (400ms)
    await vi.advanceTimersByTimeAsync(400);

    const result = await resultPromise;

    expect(result).toBe('RECOVERED_DATA');
    expect(mockFn).toHaveBeenCalledTimes(3);
    expect(onAttemptSpy).toHaveBeenCalledWith(1, 200);
    expect(onAttemptSpy).toHaveBeenCalledWith(2, 400);
  });

  // Suite 3: Retry Exhaustion
  it('throws RetryExhaustion error after 3 failed attempts', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Persistent Database Outage'));

    const resultPromise = client.execute(mockFn);
    resultPromise.catch(() => {}); // Catch unhandled rejection in test runner

    await vi.advanceTimersByTimeAsync(200);
    await vi.advanceTimersByTimeAsync(400);

    await expect(resultPromise).rejects.toThrow(/[RetryExhaustion]/);
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  // Suite 4: Non-Retryable 400 Bad Request
  it('immediately throws on 400 Bad Request without retrying', async () => {
    const badRequestErr: any = new Error('Invalid JSON schema');
    badRequestErr.status = 400;

    const mockFn = vi.fn().mockRejectedValue(badRequestErr);

    await expect(client.execute(mockFn)).rejects.toThrow('Invalid JSON schema');
    expect(mockFn).toHaveBeenCalledTimes(1); // Zero retries!
  });

  // Suite 5: Stable Idempotency Key Preservation
  it('passes the exact same Idempotency-Key across all retry attempts', async () => {
    const capturedKeys: string[] = [];

    const mockFn = vi.fn().mockImplementation((attempt, signal, idempotencyKey) => {
      capturedKeys.push(idempotencyKey);
      if (attempt < 3) throw new Error('503 Server Error');
      return Promise.resolve('ORDER_CREATED');
    });

    const resultPromise = client.execute(mockFn, { operationId: 'WIRE-9921' });

    await vi.advanceTimersByTimeAsync(200);
    await vi.advanceTimersByTimeAsync(400);

    await resultPromise;

    expect(capturedKeys).toHaveLength(3);
    expect(capturedKeys[0]).toBe('IDEM-WIRE-9921');
    expect(capturedKeys[1]).toBe('IDEM-WIRE-9921');
    expect(capturedKeys[2]).toBe('IDEM-WIRE-9921');
  });

  // Suite 6: AbortController Immediate Cancellation
  it('halts pending retries immediately when AbortSignal fires', async () => {
    const controller = new AbortController();
    const mockFn = vi.fn().mockRejectedValue(new Error('503 Server Error'));

    const resultPromise = client.execute(mockFn, { signal: controller.signal });
    resultPromise.catch(() => {});

    // Abort after attempt 1
    controller.abort();
    await vi.advanceTimersByTimeAsync(500);

    await expect(resultPromise).rejects.toThrow(/aborted/);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  // Suite 7: Jitter Randomness Range
  it('ensures Full Jitter generates delays strictly between 0 and raw backoff', async () => {
    const jitterClient = new IdempotentRetryClient({
      maxAttempts: 2,
      baseDelayMs: 1000,
      jitter: 'full',
    });

    let observedDelay = 0;
    const mockFn = vi.fn().mockRejectedValueOnce(new Error('503 Error')).mockResolvedValue('OK');

    const promise = jitterClient.execute(mockFn, {
      onAttempt: (att, delay) => {
        observedDelay = delay;
      },
    });

    await vi.advanceTimersByTimeAsync(1000);
    await promise;

    expect(observedDelay).toBeGreaterThanOrEqual(0);
    expect(observedDelay).toBeLessThanOrEqual(1000);
  });

  // Suite 8: Non-Retryable 403 Forbidden
  it('does not retry 403 Forbidden responses', async () => {
    const forbiddenErr: any = new Error('Access Denied');
    forbiddenErr.status = 403;

    const mockFn = vi.fn().mockRejectedValue(forbiddenErr);
    await expect(client.execute(mockFn)).rejects.toThrow('Access Denied');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  // Suite 9: Non-Retryable 422 Unprocessable Entity
  it('does not retry 422 Validation Errors', async () => {
    const validationErr: any = new Error('Email format invalid');
    validationErr.status = 422;

    const mockFn = vi.fn().mockRejectedValue(validationErr);
    await expect(client.execute(mockFn)).rejects.toThrow('Email format invalid');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  // Suite 10: Custom Operation ID Passthrough
  it('preserves user-provided operation IDs in telemetry payload', async () => {
    const mockFn = vi.fn().mockResolvedValue('OK');
    await client.execute(mockFn, { operationId: 'CUSTOM-OP-123' });
    expect(mockFn).toHaveBeenCalledWith(1, expect.any(Object), 'IDEM-CUSTOM-OP-123');
  });

  // Suite 11: CircuitBreakerPolicy state transitions
  it('trips CircuitBreakerPolicy to OPEN after 3 consecutive failures', () => {
    const breaker = new CircuitBreakerPolicy('TestBreaker', { failureThreshold: 3, cooldownMs: 5000 });
    expect(breaker.getState()).toBe('CLOSED');
    expect(breaker.canExecute()).toBe(true);

    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordFailure();

    expect(breaker.getState()).toBe('OPEN');
    expect(breaker.canExecute()).toBe(false);
  });

  // Suite 12: CircuitBreaker cooldown expiration to HALF_OPEN
  it('transitions CircuitBreaker from OPEN to HALF_OPEN after cooldown expires', () => {
    const breaker = new CircuitBreakerPolicy('TestBreaker', { failureThreshold: 3, cooldownMs: 5000 });
    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.getState()).toBe('OPEN');

    vi.advanceTimersByTime(5100);
    expect(breaker.canExecute()).toBe(true);
    expect(breaker.getState()).toBe('HALF_OPEN');
  });

  // Suite 13: CircuitBreaker HALF_OPEN probe recovery to CLOSED
  it('resets CircuitBreaker to CLOSED after consecutive probe successes in HALF_OPEN', () => {
    const breaker = new CircuitBreakerPolicy('TestBreaker', { failureThreshold: 3, cooldownMs: 5000, probeSuccessThreshold: 2 });
    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordFailure();

    vi.advanceTimersByTime(5100);
    expect(breaker.getState()).toBe('HALF_OPEN');

    breaker.recordSuccess();
    expect(breaker.getState()).toBe('HALF_OPEN');

    breaker.recordSuccess();
    expect(breaker.getState()).toBe('CLOSED');
  });

  // Suite 14: IdempotencyStorageAdapter TTL expiration
  it('expires cached idempotency response when TTL is exceeded', () => {
    IdempotencyStorageAdapter.set('TEST-KEY-1', { amount: 500 }, 1000);
    expect(IdempotencyStorageAdapter.get('TEST-KEY-1', 1000)).toEqual({ amount: 500 });

    vi.advanceTimersByTime(1500);
    expect(IdempotencyStorageAdapter.get('TEST-KEY-1', 1000)).toBeNull();
  });
});
```

## 60. 🥋 10 Staff-Level Interview Questions & Architectural Answers

### 1. Why isn't retry simply `fetch()` again in a catch block?
> **Staff Answer:** Because a naked `fetch()` retry ignores **eligibility classification, backoff timing, multi-client jitter, attempt budgets, idempotency guarantees, operation currentness, timer lifecycle teardown, and terminal failure escalation**.

### 2. Why is exponential backoff essential for distributed systems?
> **Staff Answer:** It progressively relieves pressure on degraded services by expanding the time window between attempts, allowing connection pools and database buffers to drain and recover.

### 3. Why must Full Jitter be added to exponential backoff?
> **Staff Answer:** Exponential backoff alone causes thousands of clients to retry in lockstep at fixed intervals ($500\text{ms}, 1000\text{ms}, 2000\text{ms}$), generating rhythmic waves of high traffic. Full Jitter ($random(0, delay)$) flattens these spikes into a uniform arrival distribution.

### 4. Why is blindly retrying a `POST` mutation dangerous?
> **Staff Answer:** Due to the **Unknown Outcome Problem**: A network timeout means the response was lost, but the server may have successfully committed the transaction. Blindly repeating a `POST` duplicates financial charges or database records.

### 5. What exact contract does an `Idempotency-Key` enforce?
> **Staff Answer:** It assigns a stable, unique identifier to a single logical user intent. The backend caches the response of the first completed execution and returns it for subsequent duplicate requests without re-executing business logic.

### 6. Does `AbortController` alone guarantee complete retry safety?
> **Staff Answer:** **No.** `AbortController` cancels in-flight HTTP sockets, but complete safety also requires clearing active `setTimeout` retry timers and asserting operation currentness so stale retries do not overwrite newer UI state.

### 7. Why can `useEffect(..., [])` still produce repeated network requests?
> **Staff Answer:** The dependency array `[]` applies only to a single Fiber instance lifecycle. If an Error Boundary catches an exception and remounts the component, React creates a new Fiber, triggering the effect again.

### 8. What is the difference between Operation Identity and Attempt Identity?
> **Staff Answer:** An **Operation Identity** represents the persistent logical user intent (e.g. `WIRE-TX-998`), while an **Attempt Identity** represents an individual network execution (e.g. `Attempt #3`). The Operation Identity remains identical across all retries.

### 9. How do you diagnose a multi-layered distributed recovery loop?
> **Staff Answer:** Reconstruct the telemetry trace across: Operation ID, Attempt Count, Initiating Owner (Boundary vs Hook vs User), Interval Delta (0ms vs Jittered), and Component Mount/Unmount count.

### 10. What is the governing axiom of resilient retry engineering?
> **Staff Answer:**
> **"A failed attempt is not automatically a failed operation, and a failed operation is not automatically safe to repeat. Retry only when repeating is safe, relevant, bounded, and provably idempotent."**

---

## 61. 🏁 Graduation Gate & Final Senior Mental Model

You pass this masterclass only when you can evaluate this production sequence:
```text
User clicks "Pay" ──> POST /payment ──> Timeout ──> Frontend retries ──> Timeout ──> Boundary resets ──> Component remounts ──> Effect fires ──> POST /payment
```

and mechanically determine:
1. **How many logical operations occurred?** (Exactly 1).
2. **How many transport attempts occurred?** (3 attempts).
3. **Was the payment outcome known?** (No, it was UNKNOWN).
4. **Could the mutation have been duplicated?** (Yes, if Idempotency-Key was missing).
5. **Who owns each retry?** (Transport client owns retries 1 & 2; Boundary reset owned attempt 3).
6. **Where is retry state stored?** (In a dedicated `useRetryableOperation` state machine).
7. **Is operation identity stable?** (Yes, `IDEM-OP-WIRE-XXX` preserved).
8. **Is there an idempotency mechanism?** (Yes, verified via Redis/DB ledger).
9. **Is the operation still current?** (Yes, active operation token matches).
10. **Can the recovery loop terminate?** (Yes, circuit breaker trips after 3 attempts).
11. **What should the user see?** (A11y fallback card with Correlation ID and manual retry CTA).
12. **What telemetry proves what happened?** (Dual stack trace + Operation lineage payload).

---

### The Ultimate Senior Principle:
> **The mature system does not ask: "Can we retry?" It asks: "Under what precise conditions is another attempt both safe and useful, and what guarantees prevent recovery itself from becoming the next failure?"**

**KPI 16 Part 13 — COMPLETE.**