# KPI 10 — Part 05: Production Error Architecture & Telemetry

[⬅️ Part 04: Browser DevTools & Systematic Debugging](./04-devtools-breakpoints-logpoints-sourcemaps.md) | [📚 KPI 10 Index](./README.md) | [Part 06: Testing Error Paths & Master KPI Architecture ➡️](./06-testing-error-paths-complete-architecture.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Architecture Component | Operational Responsibility | Scope / Boundary | Failsafe Mechanism | Senior Production Standard |
|---|---|---|---|---|
| **Error Boundary** | Contains declarative rendering crashes in JSX component trees; renders fallback UI. | Component Tree Subtree | `componentDidCatch` | 🟢 Place around independent failure domains (Widgets, Routes, Third-party plugins). |
| **Centralized Dispatcher** | Single pipeline (`reportError(err, context)`) for normalizing, enriching, and dispatching errors. | Application-Wide | Defensive `try/catch` | 🔴 **Defensive Dispatch**: Telemetry dispatcher must *never* throw or crash the main app. |
| **Error Fingerprinting** | Groups identical stack traces and error codes into single actionable clusters in APM. | APM Ingestion | MD5 / Hash Hash | 🟢 Avoids noise: 10,000 users hitting the same bug produces 1 grouped issue, not 10,000 alerts. |
| **Release & Env Tagging** | Attaches `release: 'v2.4.1'` and `environment: 'production'` to every telemetry event. | Sentry / Datadog | Build Injection | 🟢 Correlates error spikes directly with specific deployment git commits. |
| **PII Sanitizer** | Automatically redacts emails, passwords, auth tokens, and credit cards before network dispatch. | Telemetry Serializer | Regex / Key Masking | 🔴 **Zero PII**: Strictly scrub sensitive customer data before sending to third-party logs. |
| **Circuit Breaker** | Automatically trips from `CLOSED` $\to$ `OPEN` after $N$ consecutive failures to prevent service hammering. | API Service Client | State Machine | 🔵 Fast-fails immediate requests; tests recovery in `HALF-OPEN` state after cooldown. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: Telemetry Storms & Recursive Logging Loops
> 
> #### Gotcha A: The Recursive Telemetry Loop Crash
> *"Why did our global error handler cause the browser tab to freeze with 100% CPU usage and crash with an Out-of-Memory error?"*  
> ```js
> // ❌ FATAL RECURSIVE CRASH:
> window.addEventListener("error", (event) => {
>   // 💥 If sendTelemetryToServer throws an error (e.g. network offline or JSON serialise bug),
>   // it triggers window.onerror again, creating an infinite recursive logging explosion!
>   sendTelemetryToServer(event.error);
> });
> ```
> **Deep Architectural Explanation:**  
> If an error occurs *inside* the global error handler or within the HTTP telemetry logger, it fires the global `error` or `unhandledrejection` event again. This infinite synchronous microtask loop exhausts call stack and heap memory, locking the browser thread.  
> **The Senior Standard (Defensive Non-Recursive Dispatch):**  
> ```js
> // ✅ NON-RECURSIVE DEFENSIVE DISPATCHER:
> let isReporting = false;
> 
> window.addEventListener("error", (event) => {
>   if (isReporting) return; // Prevent re-entrant loops
>   isReporting = true;
>   try {
>     reportToTelemetry(event.error);
>   } catch (telemetryErr) {
>     console.warn("Failed to dispatch telemetry:", telemetryErr);
>   } finally {
>     isReporting = false;
>   }
> });
> ```
> 
> ---
> 
> #### Gotcha B: Telemetry Quota Exhaustion via Expected Failures
> *"Why did our company receive a $15,000 unexpected Sentry invoice after shipping form validation?"*  
> Logging expected domain events (HTTP 401 Unauthorized, HTTP 422 Form Validation errors, `AbortError`) as high-severity exceptions floods Sentry with millions of normal user interactions, exhausting APM quotas within hours.  
> **The Senior Standard:** Filter telemetry events at the ingestion boundary: only report unhandled exceptions, 5xx server crashes, and invariant violations.

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / TypeScript Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Sentry / Datadog SDK integration, React Error Boundaries, Sanitized user messages, Release correlation | Essential for running reliable, observable production frontend applications that recover gracefully. |
| 🟡 **Moderate** | Used in ~35% of code | Circuit breaker patterns for microservices, Client-side error deduplication, Partial UI fallbacks | Critical for enterprise dashboards, real-time collaboration tools, and financial checkout systems. |
| 🔵 **Foundational / Engine** | Runtime internals | Custom Error fingerprinting algorithms, Breadcrumb recording queues, Unhandled rejection safety nets | Essential for SDK development, enterprise infrastructure governance, and Staff/Principal reviews. |

---

## Core Concepts (20 Subtopics)

### Part 1 — Production Error Architecture as System Design `🟢 [Daily Driver]`

In production, errors must be handled simultaneously across two distinct dimensions: **User Experience** (graceful fallback, recovery) and **Engineering Visibility** (structured telemetry, stack traces).

---

### Part 2 — The 4 Core Questions of Production Failure `🟢 [Daily Driver]`

1. **What failed?** (Network, Render, Logic, Auth)
2. **Where did it fail?** (Feature, Component, API route)
3. **Can the app recover?** (Retry, Fallback, State reset)
4. **What should the user see?** (Localized alert, Retry button, Fallback UI)

---

### Part 3 — Failure Containment Domains & Error Boundaries `🟢 [Daily Driver]`

Isolate failures to their local domain. An unhandled render crash in a sidebar widget must never unmount the primary document editor.

---

### Part 4 — What Error Boundaries Catch vs. Miss `🔴 [Production-Critical]`

- **Caught:** Declarative rendering errors, lifecycle methods, constructor exceptions.
- **Missed:** Event handlers (`onClick`), async requests (`fetch`), `setTimeout` callbacks, server-side rendering (SSR).

---

### Part 5 — Boundary Granularity & Placement `🟢 [Daily Driver]`

Place boundaries hierarchically:
```text
Root App Boundary (Fatal Fallback)
└── Route / Page Boundary (Page Unavailable)
    └── Feature Widget Boundary (Widget Fallback)
```

---

### Part 6 — Global Safety Nets: `window.onerror` & `unhandledrejection` `🟢 [Daily Driver]`

Catch all uncaught exceptions that escape local handlers:
```js
window.addEventListener('unhandledrejection', (e) => reportError(e.reason, { type: 'UNHANDLED_PROMISE' }));
```

---

### Part 7 — Expected Domain Outcomes vs. Unexpected Exceptions `🟢 [Daily Driver]`

- **Expected:** Invalid password, out of stock, 404 search (Handle in UI state; do NOT send to Sentry).
- **Unexpected:** `TypeError: Cannot read properties of undefined`, 500 DB crash (Report to Sentry).

---

### Part 8 — Centralized Telemetry Dispatcher `🟢 [Daily Driver]`

```js
export function reportError(error, context = {}) {
  try {
    const payload = sanitizeAndEnrich(error, context);
    Sentry.captureException(error, { extra: payload });
  } catch (err) {
    console.warn('Telemetry dispatch failed:', err);
  }
}
```

---

### Part 9 — Structured Context vs. PII Leakage `🔴 [Production-Critical]`

Attach diagnostic metadata (`route`, `component`, `userId`, `action`), but strictly scrub passwords, auth tokens, credit cards, and PII via regex filters before transmission.

---

### Part 10 — Structured JSON Logging for APM `🟢 [Daily Driver]`

Format logs as key-value JSON records (`{ level: 'ERROR', event: 'ORDER_FAILED', orderId, latencyMs }`) so log aggregation tools (Datadog, CloudWatch) can query and graph failure rates.

---

### Part 11 — The 3 Pillars of Observability `🟢 [Daily Driver]`

1. **Errors:** Uncaught crashes, stack traces, severity.
2. **Logs:** Chronological event breadcrumbs leading to the crash.
3. **Metrics:** Error rates, P95 network latencies, Web Vitals (LCP, INP, CLS).

---

### Part 12 — The Production Error Lifecycle `🟢 [Daily Driver]`

$$\text{Error} \to \text{Normalize} \to \text{Classify} \to \text{Enrich Context} \to \text{Recover/Fallback} \to \text{Telemetry}$$

---

### Part 13 — Recovery Strategies `🟢 [Daily Driver]`

- **Retry:** For transient network drops.
- **Fallback:** Render placeholder or simplified static chart.
- **Graceful Degradation:** Hide non-critical widget and continue.
- **Hard Reload:** Clear corrupted local state cache as last resort.

---

### Part 14 — Graceful Degradation in Practice `🟢 [Daily Driver]`

If an e-commerce "Recommended Products" API fails, render the rest of the cart normally without the recommendations section instead of crashing the checkout page.

---

### Part 15 — User-Facing Error UX: Problem + Impact + Action `🟢 [Daily Driver]`

- ❌ "TypeError: undefined is not a function"
- ✅ "We couldn't save your profile changes. Your previous settings remain unchanged. [Try Again]"

---

### Part 16 — Severity Classification `🟢 [Daily Driver]`

- `INFO`: Normal operational events (user logout).
- `WARNING`: Recoverable degradation (fallback image used).
- `ERROR`: Feature failure (checkout failed).
- `FATAL`: Complete app unmount (routing engine crashed).

---

### Part 17 — Error Fingerprinting & Deduplication `🟢 [Daily Driver]`

Hash the error name and top 3 stack frames to generate a unique fingerprint (`hash('TypeError|Cart.tsx:42')`). Debounce identical errors to avoid spamming telemetry.

---

### Part 18 — Release Tracking & Sentry Breadcrumbs `🟢 [Daily Driver]`

Attach user interaction history (clicks, route changes, network calls) as chronological **breadcrumbs** to the error report to recreate user steps.

---

### Part 19 — The Circuit Breaker Pattern `🔵 [Foundational / Engine]`

When a downstream API fails 5 times consecutively, the circuit breaker opens for 30 seconds, immediately returning cached/fallback data and preventing network overload.

---

### Part 20 — 10-Point Senior Production Error Architecture Checklist `🟢 [Daily Driver]`

```text
1. Are Error Boundaries placed around distinct failure domains (Routes, Widgets)?
2. Is the telemetry dispatcher non-recursive and wrapped in defensive try/catch?
3. Are passwords, auth tokens, and sensitive PII actively scrubbed from metadata?
4. Are expected domain failures (401, 422, AbortError) filtered out of APM quotas?
5. Are release versions, environments, and commit hashes attached to error reports?
6. Are chronological user breadcrumbs captured to reproduce production failures?
7. Is user-facing error copy structured with Problem + Impact + Actionable Recovery?
8. Are non-critical widget failures degraded gracefully without unmounting the page?
9. Is client-side error deduplication implemented to mitigate telemetry spam?
10. Is unhandledrejection monitored globally as a secondary safety net?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Strategy | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **React Error Boundaries** | Declarative JSX rendering failure containment and localized fallback UI. | Event handlers, async fetch calls, server-side Node execution. | Only catches rendering and lifecycle errors in React component trees. | Hook `try/catch`, Global safety nets. |
| **Centralized Telemetry (Sentry)** | Production error tracking, stack trace symbolication, release regression alerts. | High-frequency hot debug loops during local active development. | Network payload overhead; potential third-party SaaS subscription costs. | In-memory loggers. |
| **Circuit Breakers** | Flaky third-party APIs (e.g. payment gateways, AI services, recommendation engines). | Reliable first-party static asset CDNs or local cache reads. | Adds state machine complexity and caching layers. | Simple exponential retry. |
| **Graceful UI Fallbacks** | Non-critical widgets (recommendations, avatars, related articles). | Critical transactional workflows (checkout payment confirmation). | May hide partial data degradation if not monitored in telemetry. | Error Boundaries. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Multi-Boundary Resilient Dashboard with Sentry & Circuit Breaker
```tsx
import React, { Component, ErrorInfo, ReactNode, useState, useEffect } from 'react';

// ==========================================
// 1. PRODUCTION REACT ERROR BOUNDARY
// ==========================================
interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ProductionErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 🟢 Centralized Telemetry Dispatch
    console.error('[APM Telemetry Captured]', {
      name: error.name,
      message: error.message,
      componentStack: errorInfo.componentStack
    });
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback-card">
          <h4>⚠️ {this.props.fallbackTitle ?? 'This widget encountered a problem.'}</h4>
          <p>The rest of the dashboard remains fully functional.</p>
          <button onClick={this.handleReset}>Try Again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// 2. CLIENT-SIDE CIRCUIT BREAKER
// ==========================================
export class CircuitBreaker {
  private failures = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private nextAttempt = 0;

  constructor(
    private readonly threshold = 3,
    private readonly cooldownMs = 10000
  ) {}

  public async execute<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    const now = Date.now();

    if (this.state === 'OPEN') {
      if (now > this.nextAttempt) {
        this.state = 'HALF_OPEN';
      } else {
        console.warn('[Circuit Breaker: OPEN] Returning fallback immediately.');
        return fallback;
      }
    }

    try {
      const result = await fn();
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
      }
      return result;
    } catch (err) {
      this.failures++;
      if (this.failures >= this.threshold) {
        this.state = 'OPEN';
        this.nextAttempt = now + this.cooldownMs;
        console.error(`[Circuit Breaker: TRIPPED TO OPEN] Cooldown for ${this.cooldownMs}ms`);
      }
      return fallback;
    }
  }
}

// ==========================================
// 3. REACT DASHBOARD WITH ISOLATED BOUNDARIES
// ==========================================
const newsCircuitBreaker = new CircuitBreaker(2, 5000);

function FlakyNewsWidget() {
  const [news, setNews] = useState<string[]>([]);
  const [hasCrashed, setHasCrashed] = useState(false);

  useEffect(() => {
    newsCircuitBreaker
      .execute(
        async () => {
          // Simulate flaky service
          if (Math.random() < 0.5) throw new Error('News API Gateway Timeout');
          return ['Tech: React 19 Released', 'Finance: Markets Rally'];
        },
        ['Cached: Welcome to the Platform'] // Graceful Fallback
      )
      .then(setNews);
  }, []);

  if (hasCrashed) {
    throw new Error('💥 Render crash inside News Widget!');
  }

  return (
    <div className="news-widget">
      <h4>Latest Headlines</h4>
      <ul>
        {news.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      <button onClick={() => setHasCrashed(true)} className="danger-btn">
        Simulate Render Crash
      </button>
    </div>
  );
}

export function EnterpriseResilientDashboard() {
  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <h3>Enterprise Resilient Workspace</h3>
      </header>

      <div className="dashboard-grid">
        {/* Core Widget */}
        <div className="widget-card">
          <h4>Core Analytics</h4>
          <p>Workload: 94% Operational</p>
        </div>

        {/* Isolated Flaky Widget with Error Boundary */}
        <ProductionErrorBoundary fallbackTitle="News Feed Temporarily Unavailable">
          <FlakyNewsWidget />
        </ProductionErrorBoundary>
      </div>
    </div>
  );
}
```

---

## 🧠 Part 05 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: Error Boundary Execution Scope
```js
// Which of the following errors will be caught by a React Error Boundary?
// 1. Error in render(): return <div>{user.name.toUpperCase()}</div> (user is null)
// 2. Error in button onClick: () => { throw new Error("Click fail"); }
// 3. Error in useEffect: fetch('/api').then(() => { throw new Error("Async fail"); })
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
Only **Error #1** (Render failure) is caught by the React Error Boundary.  
**Why:** React Error Boundaries only catch errors thrown during rendering, lifecycle methods (`componentDidMount`), and class constructors. Event handler errors (#2) and asynchronous errors (#3) require `try/catch` or global unhandled rejection handlers.
</details>

---

### Prediction Challenge 2: Telemetry PII Sanitization
```js
function sanitizeErrorPayload(metadata) {
  const sensitiveKeys = new Set(["password", "token", "auth", "creditCard"]);
  const sanitized = { ...metadata };

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    }
  }
  return sanitized;
}

const rawMetadata = { userId: "U-1", password: "Secret123!", token: "eyJhb..." };
console.log("Sanitized Payload:", sanitizeErrorPayload(rawMetadata));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Sanitized Payload: { userId: 'U-1', password: '[REDACTED]', token: '[REDACTED]' }
```
**Why:** The sanitizer redacts sensitive authentication credentials before serialization to third-party telemetry servers.
</details>

---

### Prediction Challenge 3: Circuit Breaker State Transitions
```js
class SimpleBreaker {
  constructor() { this.fails = 0; this.isOpen = false; }
  recordFail() {
    this.fails++;
    if (this.fails >= 2) this.isOpen = true;
  }
}

const breaker = new SimpleBreaker();
breaker.recordFail();
console.log("Fail 1 -> Is Open?:", breaker.isOpen);
breaker.recordFail();
console.log("Fail 2 -> Is Open?:", breaker.isOpen);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Fail 1 -> Is Open?: false
Fail 2 -> Is Open?: true
```
**Why:** Reaching the failure threshold (2) trips the circuit breaker to `OPEN`, immediately fast-failing subsequent calls without hammering the dying service.
</details>

---

### Prediction Challenge 4: Client-Side Deduplication Hashing
```js
const seenFingerprints = new Set();

function shouldReport(errorSignature) {
  if (seenFingerprints.has(errorSignature)) {
    return false; // Suppress duplicate
  }
  seenFingerprints.add(errorSignature);
  return true; // First occurrence: report
}

console.log("Report 1:", shouldReport("TypeError|App.js:10"));
console.log("Report 2:", shouldReport("TypeError|App.js:10"));
console.log("Report 3:", shouldReport("RangeError|Utils.js:40"));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Report 1: true
Report 2: false
Report 3: true
```
**Why:** The deduplicator tracks unique fingerprints, allowing the first instance through while suppressing subsequent identical spam.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is a React Error Boundary and what errors does it catch?  
<details>
<summary><strong>Answer</strong></summary>
A React Error Boundary is a class component implementing `static getDerivedStateFromError()` and `componentDidCatch()`. It catches JavaScript errors thrown anywhere in its child component tree during rendering, lifecycle methods, and constructors, rendering a fallback UI instead of unmounting the entire application.
</details>

**Q2:** Why shouldn't you log every validation error to production Sentry?  
<details>
<summary><strong>Answer</strong></summary>
Form validation errors (e.g. invalid email format) are expected domain outcomes caused by user input, not application bugs. Logging them to Sentry creates massive noise, obscures real operational crashes, and exhausts monthly APM billing quotas.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** How do you prevent a global error logger (`window.onerror`) from causing an infinite recursive crash loop?  
<details>
<summary><strong>Answer</strong></summary>
By wrapping the telemetry dispatch logic in a `try...catch` block, maintaining an `isReporting` boolean lock flag to prevent re-entrant calls, and falling back to a passive `console.warn` if the telemetry network call fails.
</details>

**Q4:** What is "Graceful Degradation" in frontend error architecture?  
<details>
<summary><strong>Answer</strong></summary>
Graceful degradation is the design practice where an application remains usable even when secondary or non-critical features fail. For example, if a recommendation widget crashes, the application hides the widget or renders a static fallback while keeping the core dashboard, checkout, and navigation fully operational.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** How does the Circuit Breaker pattern improve frontend resilience when interacting with flaky backend microservices?  
<details>
<summary><strong>Answer</strong></summary>
A circuit breaker monitors request failure rates across three states:  
1. **Closed:** Requests execute normally.  
2. **Open:** When consecutive failures exceed a threshold (e.g. 5 errors), the breaker trips to `OPEN`, immediately returning cached fallbacks without hitting the network, saving user wait time and allowing the backend service to recover.  
3. **Half-Open:** After a cooldown period (e.g. 30s), it allows a single test request through. If it succeeds, the breaker resets to `CLOSED`; if it fails, it trips back to `OPEN`.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** Design an enterprise-grade client telemetry ingestion pipeline that ensures compliance with GDPR/HIPAA (Zero PII), provides intelligent error fingerprinting, and handles network offline telemetry caching.  
<details>
<summary><strong>Answer</strong></summary>
1. **PII Sanitization Pipeline:** Intercept all error payloads via a recursive serializer that scrubs keys matching sensitive dictionaries (`token`, `auth`, `password`, `ssn`, `email`) and redacts credit card / email regex patterns from message strings.  
2. **Deterministic Fingerprinting:** Generate an SHA-256 fingerprint from `[ErrorName, NormalizedMessage, Top3StackFrames]` to aggregate identical crashes into single issues regardless of varying memory addresses.  
3. **Offline Telemetry Queue:** Store failed telemetry dispatches in `IndexedDB`. When the browser fires `window.addEventListener('online')`, drain the queue with an exponential backoff worker using `navigator.sendBeacon()` on page unload.
</details>

---

## 🛠️ Senior Architecture Challenge: Centralized Error Telemetry & Circuit Breaker Engine

```js
// See runnable implementation in examples/05-production-monitoring-telemetry-sentry.js
```

---

## Key Takeaways
1. **Containment Boundaries:** Isolate rendering crashes to local widgets via Error Boundaries.
2. **Non-Recursive Dispatch:** Protect global loggers from infinite error crash loops.
3. **Filter Expected Failures:** Keep APM clean by only reporting unexpected 5xx crashes.
4. **Sanitize Metadata:** Always strip auth tokens, passwords, and PII before logging.
5. **Circuit Breakers for Flaky APIs:** Fast-fail broken microservices to protect UX.

---

[⬅️ Part 04: Browser DevTools & Systematic Debugging](./04-devtools-breakpoints-logpoints-sourcemaps.md) | [📚 KPI 10 Index](./README.md) | [Part 06: Testing Error Paths & Master KPI Architecture ➡️](./06-testing-error-paths-complete-architecture.md)
