# Level 06 — React Fundamentals
# KPI 16 — Error Handling, Boundaries & Resilience
## PART 02 — Render Errors vs Async Errors, Event Errors & Failure-Surface Classification

[⬅️ Previous Part](./01-error-boundaries-isolation.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](./examples/02-render-errors-vs-async-errors.html) | [Next Part ➡️](./03-fallback-ui-recovery-patterns.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)  
> **Co-Author:** Prasenjeet (Mid-Level Full Stack Developer)

---

# 0. 🧭 What This Part Is Actually Teaching

The single most dangerous misconception originating from basic tutorials on React Error Boundaries is:
> ❌ *"Just wrap the component tree in an `<ErrorBoundary>` and all runtime errors inside that component will be caught and handled gracefully."*

In enterprise software engineering, that statement is fundamentally false and leads to catastrophic production failures, silent data corruption, unhandled promise rejections, and broken user interactions.

The correct senior architectural model is:

```text
                               UNEXPECTED RUNTIME FAILURE OCCURS
                                                │
                                                ▼
                                   CLASSIFY THE FAILURE SURFACE
                                                │
             ┌──────────────────────────────────┼──────────────────────────────────┐
             ▼                                  ▼                                  ▼
      REACT EXECUTION                    USER / EVENT                        ASYNC / EXTERNAL
      (Synchronous VDOM)             (Macrotask Queue)                      (Microtask / Timers)
             │                                  │                                  │
             ├─ Component Render Body           ├─ onClick / onSubmit Handlers     ├─ fetch() Promise Chains
             ├─ Constructor Execution           ├─ onKeyDown / onScroll Handlers   ├─ async / await Continuations
             ├─ Lifecycle Methods               ├─ Custom Synthetic Events         ├─ setTimeout / setInterval
             └─ useLayoutEffect Body            └─ Drag & Drop Event Callbacks     └─ WebSocket Message Callbacks
             │                                  │                                  │
             ▼                                  ▼                                  ▼
     CAN ERROR BOUNDARY                 CAN ERROR BOUNDARY                 CAN ERROR BOUNDARY
    INTERCEPT AUTOMATICALLY?           INTERCEPT AUTOMATICALLY?           INTERCEPT AUTOMATICALLY?
             │                                  │                                  │
          YES (✅)                           NO (❌)                            NO (❌)
             │                                  │                                  │
             ▼                                  ▼                                  ▼
   Nearest Ancestor Fiber             Local try/catch Block              Async State Machine
   Unwinds & Renders Fallback         Updates Mutation State             Updates Request State
```

The first question a senior engineer asks when seeing an error in production is **never**:
> *"Where is my ErrorBoundary?"*

It is always:
> **"What execution surface produced this failure, who owns that execution context, and is the component tree's current render state still trustworthy?"**

---

# 1. ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

### 1.1 The Failure-Surface Classification Model
React applications do not execute inside a single monolithic runtime loop. Execution is split across multiple disjoint browser execution surfaces:

```text
EXECUTION SURFACES IN A MODERN REACT APPLICATION:
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. RENDER PHASE (React Fiber WorkLoop)                                                 │
│    Component body evaluation, JSX transformation, Hook setup, pure calculations.       │
│    ──► CAUGHT AUTOMATICALLY by ErrorBoundary (getDerivedStateFromError).               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. COMMIT PHASE LIFECYCLES (React Host Mutations)                                      │
│    componentDidMount, componentDidUpdate, componentWillUnmount, useLayoutEffect.       │
│    ──► CAUGHT AUTOMATICALLY by ErrorBoundary.                                          │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. BROWSER EVENT HANDLERS (Macrotask Execution Queue)                                  │
│    onClick, onSubmit, onKeyDown, onScroll, onChange callbacks.                         │
│    ──► SILENTLY MISSED by ErrorBoundary (Requires local try/catch or async bridge).    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 4. ASYNCHRONOUS PROMISES & CONTINUATIONS (Microtask Execution Queue)                   │
│    fetch().then(), Axios calls, async/await continuations, Web Workers.                │
│    ──► SILENTLY MISSED by ErrorBoundary (Requires async state machine modeling).       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 5. BROWSER TIMERS & MACROTASK CALLBACKS                                                │
│    setTimeout, setInterval, requestAnimationFrame callbacks.                           │
│    ──► SILENTLY MISSED by ErrorBoundary (Requires explicit timer error handling).      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 6. SERVER-SIDE RENDERING & CLIENT HYDRATION                                            │
│    Server stream rendering, client HTML markup diffing and hydration mismatches.       │
│    ──► PARTIALLY MISSED / Requires Hydration Recovery Boundaries.                      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Master Execution-Zone Classification Matrix

| Failure Surface / Origin | Execution Context | Caught by `<ErrorBoundary>`? | Authoritative Architectural Strategy |
| :--- | :--- | :---: | :--- |
| **Component Render Body** | Synchronous Fiber WorkLoop | **YES ✅** | Nearest Component/Feature ErrorBoundary |
| **Hook Function Body** | Synchronous Fiber WorkLoop | **YES ✅** | Nearest Feature ErrorBoundary |
| **`useLayoutEffect`** | Synchronous Commit Phase | **YES ✅** | Nearest Feature ErrorBoundary |
| **`componentDidMount` / `Update`** | Synchronous Commit Phase | **YES ✅** | Nearest Feature ErrorBoundary |
| **`onClick` / Event Handler** | Browser Macrotask Callback | **NO ❌** | Local `try/catch` + Mutation State / Bridge Hook |
| **`fetch()` / Axios Network Call** | Microtask Queue (Async) | **NO ❌** | Explicit Async State Machine (`status: "error"`) |
| **`setTimeout` / `setInterval`** | Browser Timer Macrotask | **NO ❌** | Handler Guard + State Update / Cleanup |
| **`useEffect` Async Continuation** | Microtask after Commit | **NO ❌** | Local Async State Guard with Cancellation |
| **Form Validation Failure** | Synchronous/Async Validation | **NO ❌** | Form State / Inline Field Error Message |
| **HTTP 500 / 404 / 401** | Server API Response Payload | **NO ❌** | Normalized Request Error State |
| **Hydration Mismatch** | Client Initial Mount Diff | **PARTIAL ⚠️** | Two-pass rendering / Suppress Hydration Warning |

---

# 2. 🏛️ The Golden Rule & The Five Core Questions

### 2.1 The Golden Rule of Frontend Error Architecture
> **Classify the failure surface before choosing the recovery mechanism.**

Do not blindly reach for `try/catch`, `<ErrorBoundary>`, automated retry, or full-page reload until you have rigorously established:
1. **WHERE** did the failure originate?
2. **WHEN** did the execution occur relative to React's render lifecycle?
3. **WHO** is the authoritative owner of that execution context?
4. **CAN** React's Error Boundary mechanism observe the thrown exception?
5. **WHAT** state representation or recovery workflow should communicate this failure to the user?

```text
                  THE SYSTEMATIC ERROR TRIAGE PIPELINE
┌─────────────────────────┐
│ 1. Failure Occurs       │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ 2. Classify Surface     │ ──► Is it Render, Event, Promise, Timer, or Network?
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ 3. Identify Owner       │ ──► Component tree, Form layer, Query Cache, or Worker?
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ 4. Choose Mechanism     │ ──► ErrorBoundary, Async State, Inline Alert, or Toast?
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ 5. Define Recovery      │ ──► Reset boundary, Retry query, Fix field, or Re-auth?
└─────────────────────────┘
```

---

# 3. 🔬 Render-Time Failures: Fiber Mechanics & Timeline

### 3.1 What Constitutes a Render-Time Failure?
A render-time failure is any unhandled JavaScript exception thrown synchronously while React is executing a component function or evaluating JSX expressions inside the Fiber reconciliation work loop.

```tsx
// Example of a fatal Render-Time Failure:
export function UserProfileHeader({ user }: { user: User | null }) {
  // 💥 FATAL: If user is null, accessing user.name throws TypeError synchronously during render!
  return (
    <header className="profile-header">
      <h1>Welcome back, {user.name}</h1>
      <span className="badge">{user.role.toUpperCase()}</span>
    </header>
  );
}
```

### 3.2 Mechanical Execution Timeline
When `user.name` throws:
1. The JavaScript engine halts execution of `UserProfileHeader`.
2. React's internal `renderWithHooks` function catches the thrown exception inside its `try/catch` block within `performUnitOfWork`.
3. React's work loop enters `handleThrow(root, thrownValue)`.
4. React walks upward along the Fiber `return` pointers until it discovers a parent `ClassComponent` with `getDerivedStateFromError`.
5. The Fiber work loop marks that boundary with the `ShouldCapture` effect tag, discards the uncommitted work on the crashed subtree, and schedules a new render pass for the boundary to render its fallback UI.

```text
RENDER FAILURE SEQUENCE:
t0: React begins render pass (renderRootSync)
t1: begins unit of work for <App>
t2: begins unit of work for <Dashboard>
t3: begins unit of work for <UserProfileHeader>
t4: Expression `user.name` evaluates on null ──► Throws TypeError!
t5: React catches exception in performUnitOfWork
t6: React invokes throwException() to find nearest ancestor ErrorBoundary
t7: ErrorBoundary found at <DashboardBoundary>
t8: React sets ShouldCapture flag on <DashboardBoundary> Fiber
t9: Subtree below <DashboardBoundary> is discarded
t10: getDerivedStateFromError({ hasError: true }) executes
t11: Fallback UI renders and commits to DOM
t12: componentDidCatch() fires with componentStack telemetry
```

---

# 4. 🔬 Constructor & Lifecycle Failures

### 4.1 Class Component Constructor Failures
When using legacy class components or third-party React component libraries that rely on class inheritance, errors can occur during instance instantiation:

```typescript
class ThirdPartyChartWidget extends React.Component<ChartProps> {
  constructor(props: ChartProps) {
    super(props);
    if (!props.data || props.data.length === 0) {
      // 💥 Throws inside constructor during Fiber mounting
      throw new Error("InvalidChartData: Data series cannot be empty.");
    }
  }

  render() {
    return <div className="chart-canvas" />;
  }
}
```

Because component instantiation occurs under React's direct supervision during the `beginWork` phase, an Error Boundary wrapped around `<ThirdPartyChartWidget />` will successfully intercept constructor exceptions and render fallback UI.

### 4.2 Lifecycle Method Failures
Errors thrown in class component lifecycle methods (`componentDidMount`, `componentDidUpdate`, `componentWillUnmount`) or React 18/19 `useLayoutEffect` hooks execute synchronously during the **Commit Phase**.

```tsx
export function AutoFocusInput() {
  useLayoutEffect(() => {
    // 💥 Throws synchronously in commit phase layout queue
    document.querySelector("#critical-element")!.focus();
  }, []);

  return <input type="text" placeholder="Search..." />;
}
```

Because `useLayoutEffect` and commit lifecycles execute before the browser paints, an error thrown here will immediately trigger React's commit-phase error handler, causing the nearest ancestor Error Boundary to catch the error and replace the component before any partially updated DOM is painted.

---

# 5. 🔬 Event Handler Failures: The Macrotask Reality

### 5.1 Why Error Boundaries CANNOT Catch Event Errors
This is the single most tested concept in staff-level frontend system architecture interviews.

```text
THE EVENT LOOP DISCONNECT:

[PHASE 1: RENDER TIME (t = 0ms)]
JavaScript Main Thread:
┌────────────────────────────────────────────────────────┐
│ React WorkLoop ──► Render <App> ──► Render <Button>    │
│ (ErrorBoundary is actively on the call stack)          │
└────────────────────────────────────────────────────────┘
                    │
                    ▼ (Call stack completely clears, thread goes idle)

[PHASE 2: USER INTERACTION (t = 4500ms)]
Browser User clicks mouse on button:
┌────────────────────────────────────────────────────────┐
│ Browser Macrotask Queue:                               │
│ ──► Dispatches Native MouseEvent                       │
│ ──► Invokes SyntheticEvent Handler                     │
│ ──► Executes `handleClick()` Callback                  │
│                                                        │
│ 💥 Exception Thrown inside `handleClick()`             │
│    Where is React's Reconciler? NOWHERE ON THE STACK!  │
│    Where is ErrorBoundary?      NOWHERE ON THE STACK!  │
│    Result: Uncaught Error bubbles to `window.onerror`  │
└────────────────────────────────────────────────────────┘
```

When an event handler executes:
1. React is **not rendering**.
2. React's Fiber reconciler is **not on the call stack**.
3. The exception originates from the browser's native event dispatcher macrotask.
4. If uncaught, the error bubbles directly up to the global JavaScript execution environment (`window.onerror` / `window.addEventListener('error')`).
5. **The React component tree remains mounted and completely unaffected!**

### 5.2 Production Implementation: Handling Event Errors Gracefully
Never rely on an Error Boundary for event handlers. Model event mutations as explicit state machines:

```tsx
import React, { useState } from "react";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

export function OrderSubmissionPanel({ orderId }: { orderId: string }) {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/orders/${orderId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Checkout rejected by server (HTTP ${response.status})`);
      }

      const payload = await response.json();
      setStatus("success");
    } catch (err: any) {
      // ✅ Handled explicitly within local interaction state
      setStatus("error");
      setErrorMessage(err.message || "An unexpected error occurred during checkout.");
    }
  };

  return (
    <form onSubmit={handleOrderSubmit} className="space-y-4 p-6 bg-slate-900 rounded-xl border border-slate-800">
      <h3 className="font-bold text-white">Order Checkout (#{orderId})</h3>

      {status === "error" && (
        <div role="alert" className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded text-xs">
          ⚠️ {errorMessage}
        </div>
      )}

      {status === "success" && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded text-xs">
          ✓ Order submitted successfully!
        </div>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded font-semibold text-xs transition"
      >
        {status === "submitting" ? "Processing Payment..." : "Confirm & Pay"}
      </button>
    </form>
  );
}
```

---

# 6. 🔬 Asynchronous Microtasks, Promises & `async/await`

### 6.1 Promise Rejections in JavaScript
When a Promise rejects, the rejection callback executes as an **asynchronous microtask** when the current call stack clears:

```tsx
// ❌ DANGEROUS ANTI-PATTERN:
export function BrokenAsyncComponent() {
  useEffect(() => {
    // This Promise runs in a background microtask:
    fetch("/api/unstable-resource")
      .then((res) => {
        if (!res.ok) {
          // 💥 Throws inside microtask callback!
          // ErrorBoundary CANNOT catch this! Leaks as UnhandledPromiseRejection!
          throw new Error("Async fetch failed");
        }
        return res.json();
      });
  }, []);

  return <div>Loading data...</div>;
}
```

### 6.2 The `useAsyncErrorBridge` Architectural Pattern
What if an asynchronous background process (like an unrecoverable WebSocket stream disconnect or corrupted IndexedDB cache) **should** trigger an Error Boundary fallback?

Because Error Boundaries only catch errors thrown during synchronous render passes, we can build a bridge Hook that stores the asynchronous error in React state and throws it inside the subsequent synchronous render pass:

```typescript
import { useState, useCallback } from "react";

/**
 * useAsyncErrorBridge
 * 
 * Bridges asynchronous promise rejections, WebSocket crashes,
 * and event errors into the nearest ancestor React ErrorBoundary.
 */
export function useAsyncErrorBridge() {
  const [, setError] = useState();

  return useCallback((error: unknown) => {
    const normalized = error instanceof Error ? error : new Error(String(error));
    
    // Passing a function to setState forces React to execute the function
    // during the next synchronous render pass, throwing the error where
    // the ErrorBoundary can intercept it!
    setError(() => {
      throw normalized;
    });
  }, []);
}
```

#### Complete Architectural Usage:
```tsx
export function LiveStockTickerWebSocket({ symbol }: { symbol: string }) {
  const throwToBoundary = useAsyncErrorBridge();
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    const socket = new WebSocket(`wss://marketdata.example.com/stream/${symbol}`);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (typeof data.price !== "number") {
          throw new Error(`Corrupted market data payload for symbol: ${symbol}`);
        }
        setPrice(data.price);
      } catch (err) {
        // Bridge fatal payload corruption to nearest ErrorBoundary:
        throwToBoundary(err);
      }
    };

    socket.onerror = (err) => {
      // Bridge fatal transport crash to ErrorBoundary:
      throwToBoundary(new Error(`Fatal WebSocket stream disconnected for ${symbol}`));
    };

    return () => socket.close();
  }, [symbol, throwToBoundary]);

  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
      <span className="text-slate-400 text-xs font-mono">{symbol}</span>
      <div className="text-2xl font-bold text-emerald-400 font-mono">
        {price !== null ? `$${price.toFixed(2)}` : "Connecting..."}
      </div>
    </div>
  );
}
```

---

# 7. 🔬 Network Failures vs. Component Render Errors

### 7.1 The Fundamental Distinction: HTTP 500 $\neq$ JavaScript Exception
In modern HTTP clients (native `fetch`, Axios), an HTTP `404 Not Found`, `401 Unauthorized`, `403 Forbidden`, or `500 Internal Server Error` is **a valid HTTP response payload, not a network transport failure!**

```typescript
// native fetch() ONLY rejects on physical network failures (DNS failure, offline, TCP reset).
// It RESOLVES successfully for HTTP 500 Internal Server Error!
const response = await fetch("/api/reports"); 
console.log(response.ok);     // false
console.log(response.status); // 500
```

### 7.2 The Anti-Pattern: Converting HTTP Status Codes to Fatal Render Crashes
```tsx
// ❌ WRONG: Crashing the entire component tree over an expected 404/500 API response
function UserReportCard() {
  const { data, error } = useQuery(["report"], fetchReport);

  if (error) {
    // 💥 DESTROYS UI: Crashing the component tree forces the ErrorBoundary to unmount
    // the card, destroying surrounding sidebar filters and header navigation!
    throw error;
  }

  return <div>{data.title}</div>;
}
```

```tsx
// ✅ PRODUCTION RESILIENT ARCHITECTURE: Model API status in domain UI
export function UserReportCard() {
  const { data, status, error, refetch } = useReportQuery();

  if (status === "loading") {
    return <ReportSkeleton />;
  }

  if (status === "error") {
    return (
      <div className="p-4 bg-amber-950/40 border border-amber-800 rounded-xl space-y-2">
        <div className="flex justify-between items-center text-xs text-amber-300 font-semibold">
          <span>⚠️ Unable to load report ({error.message})</span>
          <button onClick={() => refetch()} className="px-2.5 py-1 bg-amber-700 hover:bg-amber-600 rounded text-white font-mono">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <ReportView data={data} />;
}
```

---

# 8. 🔬 Expected vs. Unexpected Failures: The Senior Taxonomy

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              THE 3 TIERS OF APPLICATION FAILURE                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ TIER 1: EXPECTED DOMAIN / BUSINESS FAILURES                                           │
│ Examples: Invalid password, form validation error, 404 not found, coupon expired.      │
│ Handling: Local state machines, form error messages, inline warning banners.           │
│ ErrorBoundary Role: ZERO (Should NEVER reach an ErrorBoundary).                       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ TIER 2: RECOVERABLE INFRASTRUCTURE FAILURES                                            │
│ Examples: API 503 Service Unavailable, network timeout, rate limit exceeded.           │
│ Handling: Asynchronous query retry backoff, stale-while-revalidate, offline banners.   │
│ ErrorBoundary Role: ZERO (Handled by Async Data Coordinator from KPI 15).             │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ TIER 3: UNEXPECTED COMPONENT / PROGRAMMING DEFECTS                                     │
│ Examples: `TypeError: Cannot read properties of undefined`, invalid invariant,        │
│           corrupted state store, crashed third-party WebGL canvas.                     │
│ Handling: Declarative `<ErrorBoundary>` with isolated fallback UI and telemetry.       │
│ ErrorBoundary Role: PRIMARY CONTAINMENT LAYER.                                         │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 9. 🔬 Effect Failures & Timer Callbacks

### 9.1 Synchronous Effect Body vs. Asynchronous Effect Callback
```tsx
export function LifecycleExperiment() {
  useEffect(() => {
    // Execution Zone 1: Synchronous Effect Setup Body
    // 💥 Thrown synchronously during React's commit phase!
    // React's reconciler catches this and routes to nearest ErrorBoundary.
    throw new Error("Synchronous effect setup failed!");
  }, []);

  useEffect(() => {
    // Execution Zone 2: Scheduled Macrotask Timer
    const timerId = setTimeout(() => {
      // 💥 Thrown 1000ms later in browser macrotask queue!
      // ErrorBoundary CANNOT catch this! Escapes to window.onerror!
      throw new Error("Timer callback failed!");
    }, 1000);

    return () => clearTimeout(timerId);
  }, []);

  return <div>Lifecycle Experiment</div>;
}
```

### 9.2 Defensive Timer Guarding
Always wrap timer callbacks and external event subscriptions in local defensive boundaries:

```typescript
export function useSafeInterval(callback: () => void, delayMs: number | null) {
  useEffect(() => {
    if (delayMs === null) return;

    const intervalId = setInterval(() => {
      try {
        callback();
      } catch (err) {
        console.error("[SafeInterval] Callback threw uncaught exception:", err);
        // Dispatch to telemetry service defensively
      }
    }, delayMs);

    return () => clearInterval(intervalId);
  }, [callback, delayMs]);
}
```

---

# 10. 🔬 Third-Party Integration Bulkheads (D3, WebGL, Ads)

Third-party visualization libraries (such as D3.js, Three.js, Monaco Editor, Google Maps, or Chart.js) frequently perform direct DOM manipulation outside React's virtual DOM tree. If an external script throws during initialization or data binding, it will crash React's render loop unless isolated behind a dedicated **Feature Bulkhead Boundary**.

```tsx
import React from "react";
import { ResilientErrorBoundary } from "./ResilientErrorBoundary";

export function IsolatedTradingChart({ symbol, data }: { symbol: string; data: any }) {
  return (
    <ResilientErrorBoundary
      boundaryName={`TradingChart-${symbol}`}
      resetKeys={[symbol, data]}
      fallback={(error, reset) => (
        <div className="h-64 flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded-xl p-6 text-center space-y-3">
          <div className="text-amber-400 font-mono text-xs font-bold">
            ⚠️ WebGL Chart Rendering Fault ({symbol})
          </div>
          <p className="text-slate-400 text-xs max-w-sm font-mono">
            {error.message || "An isolated graphics hardware error occurred."}
          </p>
          <button
            onClick={reset}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-800/40 rounded text-xs font-mono transition"
          >
            Re-initialize Canvas Engine
          </button>
        </div>
      )}
    >
      <RawD3ChartCanvas symbol={symbol} data={data} />
    </ResilientErrorBoundary>
  );
}
```

---

# 11. 📊 Master Failure-Surface Decision Matrix

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              MASTER FAILURE-SURFACE MATRIX                             │
├──────────────────────────┬───────────────────┬─────────────────────────────────────────┤
│ Failure Surface          │ ErrorBoundary?    │ Authoritative Architecture              │
├──────────────────────────┼───────────────────┼─────────────────────────────────────────┤
│ Render Expression Crash  │ ✅ YES (Primary)  │ Isolated Feature Boundary               │
│ Component Constructor    │ ✅ YES (Primary)  │ Feature Boundary                        │
│ useLayoutEffect Sync Hook│ ✅ YES (Primary)  │ Feature Boundary                        │
│ componentDidMount Hook   │ ✅ YES (Primary)  │ Feature Boundary                        │
│ onClick / Button Event   │ ❌ NO             │ `try/catch` + Interaction State Machine │
│ onSubmit / Form Event    │ ❌ NO             │ Form Validation State + Inline Errors   │
│ fetch() / Axios Network  │ ❌ NO             │ SWR / React Query Async State Machine   │
│ setTimeout / setInterval │ ❌ NO             │ Defensive `try/catch` inside Callback   │
│ WebSocket onmessage      │ ❌ NO             │ `useAsyncErrorBridge` or Stream State   │
│ External Store Subscribe │ ❌ NO             │ `useSyncExternalStore` error boundary   │
│ Third-Party Canvas Crash │ ✅ YES (Primary)  │ Isolated Bulkhead ErrorBoundary         │
│ Boundary Fallback Crash  │ ❌ NO (Escalates) │ Parent Ancestor Error Boundary          │
└──────────────────────────┴───────────────────┴─────────────────────────────────────────┘
```

---

# 12. 🔬 5 Prediction Challenges with Full Explanations

### Challenge 1: The Null Property Access
```tsx
function Widget() {
  const user = null;
  return <div>{user.profile.bio}</div>;
}
// Wrapped in <ErrorBoundary fallback={<Fallback />}>
```
* **Prediction**: What happens when `<Widget />` mounts?
* **Answer**: `user.profile` throws `TypeError: Cannot read properties of null` synchronously during the render phase. React catches it in `performUnitOfWork`, walks up to the `<ErrorBoundary>`, derives `{ hasError: true }`, and renders `<Fallback />`. The surrounding application survives.

### Challenge 2: The Async Button Click
```tsx
function Checkout() {
  const handlePay = async () => {
    throw new Error("Card Declined");
  };
  return <button onClick={handlePay}>Pay</button>;
}
// Wrapped in <ErrorBoundary fallback={<Fallback />}>
```
* **Prediction**: When the user clicks the button, does `<Fallback />` render?
* **Answer**: **NO.** The exception occurs inside the browser's native click event dispatcher macrotask. The Error Boundary is not on the call stack. The error logs as an unhandled promise rejection in the browser console, and `<Checkout />` remains mounted and visible.

### Challenge 3: The Effect Microtask
```tsx
function Analytics() {
  useEffect(() => {
    Promise.resolve().then(() => {
      throw new Error("Telemetry socket dropped");
    });
  }, []);
  return <div>Analytics Active</div>;
}
// Wrapped in <ErrorBoundary fallback={<Fallback />}>
```
* **Prediction**: Does the ErrorBoundary catch this error?
* **Answer**: **NO.** The throw occurs inside a Promise microtask continuation after `useEffect` setup has completed. The ErrorBoundary cannot catch background microtask rejections.

### Challenge 4: The Synchronous Effect Setup
```tsx
function DeviceTracker() {
  useEffect(() => {
    throw new Error("Hardware sensor not supported");
  }, []);
  return <div>Tracking...</div>;
}
// Wrapped in <ErrorBoundary fallback={<Fallback />}>
```
* **Prediction**: Does the ErrorBoundary catch this error?
* **Answer**: **YES.** The error is thrown synchronously during the execution of the effect setup function in React's commit phase. React catches it and invokes the nearest Error Boundary.

### Challenge 5: The HTTP 500 API Call
```tsx
function OrdersList() {
  useEffect(() => {
    fetch("/api/orders").then(res => {
      if (!res.ok) throw new Error("HTTP 500");
    });
  }, []);
  return <div>Orders</div>;
}
// Wrapped in <ErrorBoundary fallback={<Fallback />}>
```
* **Prediction**: Does the ErrorBoundary catch this error?
* **Answer**: **NO.** The throw occurs inside an asynchronous Promise continuation. The component must handle it via async state (`setError(err)`).

---

# 13. 🔬 4 Production Crucibles with Code & Post-Mortems

```text
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             PRODUCTION CRUCIBLE POST-MORTEMS                             │
├─────────────────────────┬──────────────────────────────────┬─────────────────────────────┤
│ Incident                │ Root Cause                       │ Architectural Fix           │
├─────────────────────────┼──────────────────────────────────┼─────────────────────────────┤
│ 1. The Broken Checkout  │ Dev assumed boundary catches     │ Local `try/catch` with      │
│    Payment Button       │ `onClick`; payment failed silently│ explicit error banner state │
├─────────────────────────┼──────────────────────────────────┼─────────────────────────────┤
│ 2. The 500 Dashboard    │ Fetch 500 re-thrown to render;   │ Keep HTTP errors in SWR     │
│    Wipeout              │ wiped working sidebar/header.    │ query state machine         │
├─────────────────────────┼──────────────────────────────────┼─────────────────────────────┤
│ 3. WebSocket Disconnect │ WebSocket `onerror` leaked;      │ `useAsyncErrorBridge` hook  │
│    Crash                │ no UI indication of stream loss. │ for unrecoverable streams   │
├─────────────────────────┼──────────────────────────────────┼─────────────────────────────┤
│ 4. Deterministic Crash  │ `resetKeys={[Date.now()]}`       │ Bind `resetKeys` to stable  │
│    Infinite Loop        │ caused main-thread lockup.       │ domain entity IDs           │
└─────────────────────────┴──────────────────────────────────┴─────────────────────────────┘
```

### Crucible Incident #1: The Broken Checkout Button
* **The Incident:** An e-commerce customer clicked "Place Order". Due to an invalid credit card expiration format, the client validation threw an error inside the `onClick` handler. Because the engineering team believed the surrounding `<RootErrorBoundary>` would catch all errors, the button silently froze without any user feedback. The customer repeatedly clicked the button 14 times, submitting duplicate charges.
* **The Root Cause:** Confusing render-phase error catching with asynchronous event handler error handling.
* **The Senior Remediation:**

```tsx
// ❌ VULNERABLE IMPLEMENTATION
export function FragileOrderButton({ cartId }: { cartId: string }) {
  const handleClick = async () => {
    // 💥 Throws in event handler; ErrorBoundary does NOT catch this!
    const result = await submitOrder(cartId);
  };

  return <button onClick={handleClick}>Place Order</button>;
}

// ✅ RESILIENT SENIOR IMPLEMENTATION
export function ResilientOrderButton({ cartId }: { cartId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await submitOrder(cartId);
    } catch (err: any) {
      setError(err.message || "Failed to process order. Please verify your payment details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={isSubmitting}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded font-bold text-xs"
      >
        {isSubmitting ? "Authorizing Payment..." : "Place Order ($149.00)"}
      </button>
      {error && (
        <div role="alert" className="text-red-400 text-xs font-mono">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
```

---

# 14. 🛠️ Complete Senior Implementation: Hybrid Resilience Architecture

Here is the complete production architecture uniting **Render Boundaries**, **Async Error Bridges**, and **Event Handlers**:

```typescript
import React, { Component, ErrorInfo, ReactNode, useState, useCallback } from "react";

// ==========================================
// 1. ASYNC ERROR BRIDGE HOOK
// ==========================================
export function useAsyncErrorBridge() {
  const [, setAsyncError] = useState();
  return useCallback((error: unknown) => {
    const normalized = error instanceof Error ? error : new Error(String(error));
    setAsyncError(() => {
      throw normalized;
    });
  }, []);
}

// ==========================================
// 2. PRODUCTION ERROR BOUNDARY
// ==========================================
export interface HybridBoundaryProps {
  children: ReactNode;
  fallback: (error: Error, reset: () => void) => ReactNode;
  name?: string;
  onError?: (error: Error, info: ErrorInfo) => void;
  resetKeys?: unknown[];
}

interface HybridBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class HybridErrorBoundary extends Component<HybridBoundaryProps, HybridBoundaryState> {
  public state: HybridBoundaryState = { hasError: false, error: null };

  public static getDerivedStateFromError(error: unknown): HybridBoundaryState {
    const normalized = error instanceof Error ? error : new Error(String(error));
    return { hasError: true, error: normalized };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    if (this.props.onError) {
      try {
        this.props.onError(error, info);
      } catch (loggingErr) {
        console.error("[HybridErrorBoundary] Logging failed:", loggingErr);
      }
    }
  }

  public componentDidUpdate(prevProps: HybridBoundaryProps): void {
    const { hasError } = this.state;
    const { resetKeys } = this.props;

    if (hasError && prevProps.resetKeys && resetKeys) {
      const changed = resetKeys.some((k, i) => !Object.is(k, prevProps.resetKeys![i]));
      if (changed) {
        this.reset();
      }
    }
  }

  public reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  public render(): ReactNode {
    const { hasError, error } = this.state;
    if (hasError && error) {
      return this.props.fallback(error, this.reset);
    }
    return this.props.children;
  }
}
```

---

# 15. 🧠 10 Staff-Level Interview Questions & Authoritative Answers

### Q1: Why do React Error Boundaries intentionally ignore errors in event handlers?
**Answer:** Event handlers execute in response to native browser events outside React's Fiber reconciliation work loop. Because React does not need the result of an event handler to compute the next visual element tree, an error in an event handler does not corrupt the currently rendered DOM or leave React in an inconsistent intermediate render state. Therefore, React leaves event-handler error handling to standard JavaScript `try/catch` and local interaction state.

### Q2: How does an Error Boundary behave differently between Development mode and Production mode?
**Answer:** In Development mode, React logs full detailed component stacks to the browser console and surfaces the unhandled error through the React Error Overlay (in frameworks like Next.js or Vite). In Production mode, React suppresses the overlay, invokes `getDerivedStateFromError` to swap in the fallback UI, and calls `componentDidCatch` for telemetry, guaranteeing that customers see branded fallback interfaces without raw stack traces.

### Q3: What happens when an error is thrown inside `getDerivedStateFromError`?
**Answer:** If `getDerivedStateFromError` itself throws an error, the current Error Boundary cannot handle the failure. React's Fiber reconciler immediately escalates the error upward along the Fiber parent return chain, seeking the **next higher ancestor Error Boundary**. If no parent boundary exists, the entire application root unmounts.

### Q4: Explain how Server-Side Rendering (SSR) interacts with Error Boundaries.
**Answer:** Traditional React Error Boundaries do not catch errors during server-side string rendering (`renderToString` / `renderToPipeableStream`) in the same interactive way as the client. On the server, an unhandled render error in a component tree will abort the stream or fallback to the nearest Suspense/Error boundary configured for server rendering. Client-side hydration will then attempt to reconcile or re-render the subtree.

### Q5: How do you differentiate between an HTTP 404 (Not Found) and a runtime `TypeError` in application architecture?
**Answer:** An HTTP 404 is an expected domain state representing resource absence; it should be modeled as `{ status: "not-found" }` in the async data layer and rendered via an intentional `<EmptyState />` or `<NotFoundCard />`. A runtime `TypeError` is an unexpected programming defect (e.g., accessing properties on `undefined`) that should be caught by an `<ErrorBoundary>` and dispatched to monitoring telemetry.

### Q6: Why is `try/catch` around JSX elements like `try { return <Table />; } catch (e) {}` completely useless?
**Answer:** In React, evaluating `<Table />` only creates an immutable lightweight JavaScript descriptor object (`{ type: Table, props: {} }`). The actual execution of the `Table` function component body does not happen inside the `try` block; it occurs later when React's internal reconciler processes the Fiber queue. Thus, the `try` block exits successfully before the component code ever runs.

### Q7: How should transient network errors be distinguished from permanent schema validation errors in automated retries?
**Answer:** Transient network errors (HTTP 502/503/504, connection timeouts, socket hang-ups) represent temporary infrastructure degradation and are safe to retry using exponential backoff with randomized jitter. Permanent schema validation errors (HTTP 400, 422, JSON syntax errors, invariant violations) are deterministic; automated retries will always fail identically and must be surfaced directly to the user or telemetry without retrying.

### Q8: What is the risk of using `Date.now()` inside the `resetKeys` prop of an Error Boundary?
**Answer:** `resetKeys` triggers an Error Boundary reset whenever any value in the array changes referentially between renders. If `Date.now()` or an inline newly allocated object is passed, the key changes on every single render pass. If the child component contains a deterministic render defect, this forces an infinite re-render crash loop that freezes the browser main thread.

### Q9: What data must be scrubbed from error payloads before sending them to third-party telemetry services (Sentry/Datadog)?
**Answer:** Personally Identifiable Information (PII) such as customer names, email addresses, credit card numbers, passwords, auth tokens (JWTs), and sensitive API payload bodies. Scrubbing should occur at the normalization adapter layer before network dispatch.

### Q10: How does React 19 handle actions and async error boundaries with `useActionState`?
**Answer:** In React 19, Server Actions and client transitions manage asynchronous mutation lifecycles natively. Uncaught errors in actions automatically bubble into the nearest Error Boundary or can be caught via the error property returned by `useActionState`, uniting async error states with declarative boundary structures.

---

# 16. ✅ 50-Point Failure Surface Classification Mastery Checklist

```text
┌────────────────────────────────────────────────────────────────────────┐
│             50-POINT ERROR CLASSIFICATION & RESILIENCE AUDIT           │
├────────────────────────────────────────────────────────────────────────┤
│ [ ] 01. Render errors identified as synchronous Fiber work loop errors │
│ [ ] 02. Event handler errors identified as browser macrotask errors    │
│ [ ] 03. Async promise errors identified as microtask queue errors      │
│ [ ] 04. No raw `try/catch` wrapped around JSX element declarations     │
│ [ ] 05. Event handler errors caught via local `try/catch`              │
│ [ ] 06. Event mutation errors represented in explicit status states    │
│ [ ] 07. Async fetch errors handled via `try/catch` + state updates     │
│ [ ] 08. `useAsyncErrorBridge` utilized for fatal stream/async failures │
│ [ ] 09. HTTP 4xx/5xx status codes segregated from transport drops      │
│ [ ] 10. JSON parsing errors caught and classified as parse failures    │
│ [ ] 11. Schema validation failures modeled as domain states            │
│ [ ] 12. Component render defects isolated behind Feature Boundaries    │
│ [ ] 13. Third-party visualization widgets isolated in Bulkheads        │
│ [ ] 14. Fallback components verify zero dependencies on failing context│
│ [ ] 15. Fallback UI matches bounding dimensions to prevent layout shift│
│ [ ] 16. `resetKeys` bound to stable semantic domain entity IDs         │
│ [ ] 17. No `Date.now()` or inline objects used in `resetKeys`          │
│ [ ] 18. Maximum retry attempts enforced on fallback retry buttons      │
│ [ ] 19. Bounded exponential backoff applied to network retries         │
│ [ ] 20. Deterministic render crash loop detection implemented         │
│ [ ] 21. `componentDidCatch` used exclusively for logging side effects  │
│ [ ] 22. `getDerivedStateFromError` maintained 100% pure without effects│
│ [ ] 23. Telemetry network calls never block fallback UI substitution   │
│ [ ] 24. React `componentStack` captured in telemetry error events      │
│ [ ] 25. JavaScript runtime stack trace captured in telemetry events    │
│ [ ] 26. PII, passwords, and tokens scrubbed from error payloads        │
│ [ ] 27. Application release SHA attached to all error reports          │
│ [ ] 28. Environment tags (dev, staging, prod) attached to telemetry   │
│ [ ] 29. Error deduplication / fingerprinting configured in monitoring  │
│ [ ] 30. Unhandled promise rejections monitored via window listeners    │
│ [ ] 31. Global `window.onerror` handler installed as last safety net   │
│ [ ] 32. Root Error Boundary contains zero design system dependencies   │
│ [ ] 33. Root fallback offers manual page reload and support ticket link│
│ [ ] 34. Sibling widgets remain operational when one widget crashes     │
│ [ ] 35. Navigation shell remains operational during route-level crashes│
│ [ ] 36. Form inputs preserve unsaved user drafts during sibling crash  │
│ [ ] 37. Modal dialogs wrapped in isolated Error Boundaries             │
│ [ ] 38. Rich text editor crashes isolated from document view mode      │
│ [ ] 39. Websocket reconnections governed by bounded backoff            │
│ [ ] 40. Offline network state communicated via non-fatal banner        │
│ [ ] 41. Hydration mismatches handled via client-only render boundaries │
│ [ ] 42. User-facing error messages written in clear, non-technical copy│
│ [ ] 43. Internal error codes provided for customer support correlation │
│ [ ] 44. Synthetic failure injector available in development tooling    │
│ [ ] 45. Automated unit tests verify Error Boundary fallback mounting   │
│ [ ] 46. Automated unit tests verify `componentDidCatch` telemetry call │
│ [ ] 47. Automated tests verify `useAsyncErrorBridge` propagation       │
│ [ ] 48. Performance overhead of boundary layers measured negligible    │
│ [ ] 49. Production error budget monitored against boundary activations │
│ [ ] 50. Senior code review checklist mandates failure-surface audit    │
└────────────────────────────────────────────────────────────────────────┘
```

---

# 17. 🏁 Graduation Gate: The Multi-Zone Failure Challenge

To demonstrate senior-level mastery of **KPI 16 Part 02**, analyze the following production scenario:

```tsx
export function FinancialReportPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/reports/q3").then(res => res.json()).then(setData);
  }, []);

  const handleExportCSV = async () => {
    const csv = await generateCSV(data);
    downloadFile(csv);
  };

  return (
    <FeatureBoundary feature="FINANCIAL_REPORT">
      <ReportHeader onExport={handleExportCSV} />
      <ReportTable data={data} />
    </FeatureBoundary>
  );
}
```

### Senior Architectural Diagnosis:
1. If the server returns a `500 Internal Server Error`, **does `FeatureBoundary` catch it? What happens to the UI?**
2. If `generateCSV` throws `TypeError: Cannot read properties of null`, **does `FeatureBoundary` catch it? What appears on screen?**
3. If `ReportTable` attempts to execute `data.rows.map(...)` before `data` is fetched, **does `FeatureBoundary` catch it? What is the blast radius?**
4. Refactor this component to achieve **100% fault-isolated resilience** across all 3 failure surfaces (async fetch, event handler, and render phase).

---

[⬅️ Previous Part](./01-error-boundaries-isolation.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](./examples/02-render-errors-vs-async-errors.html) | [Next Part ➡️](./03-fallback-ui-recovery-patterns.md)
