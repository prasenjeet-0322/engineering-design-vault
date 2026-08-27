# KPI 10 — Part 09: Frontend Observability & Signal-to-Noise

[⬅️ Part 08: Debugging Architecture & Production Postmortems](./08-debugging-architecture-postmortems-systemic-quality.md) | [📚 KPI 10 Index](./README.md) | [Part 10: Testing Error Paths & Debugging Skills in Practice ➡️](./10-testing-error-paths-debugging-practice.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Observability Component | Architectural Mechanism | Primary Metric / Signal | Senior Threshold Standard |
|---|---|---|---|
| **Real User Monitoring (RUM)**| SDK capturing actual user interaction latency, DOM crashes, and network requests. | Real-world P75/P95 latencies & Web Vitals. | 🟢 **Measure Real Users**: Synthetic tests test ideal hardware; RUM measures real low-end mobile networks. |
| **Error Fingerprinting** | SHA-256 hash of `[error.name, normalizedMessage, top3Frames]`. | Grouped Issue Counts in Sentry / Datadog. | 🟢 Avoids noise: 50,000 crashes from 1 bug collapse into 1 actionable issue. |
| **Breadcrumb Ring Buffer**| Fixed-size FIFO queue (e.g. 50 events) recording UI clicks, route changes, and API calls. | Chronological event trace prior to crash. | 🔴 **Bounded Memory**: Must be a ring buffer (max $N=50$) to avoid memory leaks. |
| **Release & Git Tagging** | `release: 'v4.2.1-hash'` injected into client bundle via CI/CD environment variables. | Version-correlated error spikes. | 🟢 Instantly isolates whether a bug was introduced in the latest deployment. |
| **P95 / P99 Latency** | Percentile distribution ranking of user response times ($95\text{th}$ percentile). | Latency distribution tail (P95/P99). | 🔴 **Never Rely on Averages**: An average of 2s can hide 10% of users suffering 25s timeouts. |
| **Actionable Alerting** | Alerts tied to user impact ($>2\%$ checkout failure rate for 5 min) with runbooks. | Paging triggers (PagerDuty / Slack). | 🔴 **Zero Alert Fatigue**: If an alert does not require immediate human action, downgrade it to a dashboard metric. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: Breadcrumb Memory Exhaustion & Alert Fatigue
> 
> #### Gotcha A: The Unbounded Breadcrumb Memory Leak
> *"Why did our custom frontend logger cause browser memory to climb to 1.5GB during long user sessions?"*  
> ```js
> // ❌ UNBOUNDED ARRAY MEMORY LEAK:
> const breadcrumbs = [];
> 
> window.addEventListener("click", (e) => {
>   // 💥 Pushing full DOM event objects and unbounded entries into an array!
>   // Over an 8-hour shift, this captures 100,000 DOM nodes in closure memory!
>   breadcrumbs.push({ type: "click", target: e.target, time: Date.now() });
> });
> ```
> **Deep Architectural Explanation:**  
> Retaining raw DOM event objects (`e.target`) inside global arrays holds direct heap references to active and detached DOM elements, prohibiting the Garbage Collector from freeing memory. Furthermore, an unbounded array grows indefinitely.  
> **The Senior Standard (Fixed-Capacity Ring Buffer):**  
> ```js
> // ✅ FIXED RING BUFFER WITH SANITIZED STRINGS:
> class BreadcrumbBuffer {
>   constructor(limit = 50) {
>     this.limit = limit;
>     this.buffer = [];
>   }
>   add(event) {
>     if (this.buffer.length >= this.limit) this.buffer.shift(); // Evict oldest
>     this.buffer.push({ name: event.name, targetTag: event.tagName, ts: Date.now() });
>   }
> }
> ```
> 
> ---
> 
> #### Gotcha B: Alert Fatigue Desensitization
> *"Why did our team miss a Sev-1 payment outage that lasted for 4 hours?"*  
> If an on-call team receives 200 non-critical Slack alerts every day for expected transient 401s, third-party ad-blocker drops, and minor styling warnings, engineers become desensitized and mute notification channels.  
> **The Senior Standard:** Alert strictly on **SLO-Impacting Business Metrics** (e.g. `PaymentSuccessRate < 98%` over a 5-minute rolling window) and require an attached runbook URL for every pager alert.

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / TypeScript Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Sentry Breadcrumbs, Release version tagging, RUM performance tracking, Unhandled rejection monitoring | Essential for monitoring deployed web applications and diagnosing issues that cannot be reproduced locally. |
| 🟡 **Moderate** | Used in ~40% of code | Dynamic telemetry sampling, Alert threshold tuning, Core Web Vitals (LCP/INP/CLS) attribution | Critical for high-traffic consumer applications where telemetry network bandwidth and APM SaaS billing must be optimized. |
| 🔵 **Foundational / Engine** | Runtime internals | Custom SHA-256 fingerprint hashing algorithms, PerformanceObserver Web APIs, Beacon API transports | Essential for platform infrastructure architecture, telemetry SDK development, and Staff/Principal evaluations. |

---

## Core Concepts (20 Subtopics)

### Part 1 — Frontend Observability as Post-Deployment Telemetry `🟢 [Daily Driver]`

Observability is the architectural ability to understand an application's internal runtime state solely from the structured telemetry signals it emits in real user browsers.

---

### Part 2 — The 6-Signal Production Telemetry Model `🟢 [Daily Driver]`

1. **Errors:** Runtime exceptions, unhandled promise rejections.
2. **Events:** Critical user actions (`CHECKOUT_SUBMITTED`).
3. **Performance:** Web Vitals (LCP, INP, CLS), long tasks ($>50\text{ms}$).
4. **Network:** Latency, status codes, payload failures.
5. **Release Context:** App version, git commit hash, environment.
6. **Session Context:** Browser, OS, device memory, viewport size.

---

### Part 3 — Runtime Exception Normalization `🟢 [Daily Driver]`

Normalize disparate errors (native `Error`, thrown strings, `DOMException`, HTTP 500s) into unified `AppError` payloads before dispatching to monitoring servers.

---

### Part 4 — Deterministic Error Fingerprinting `🟢 [Daily Driver]`

Generate deterministic hashes from `[error.name, normalizedMessage, top3StackFrames]` so identical crashes across 100,000 user browsers are aggregated into a single actionable issue.

---

### Part 5 — Error Frequency vs. Business Impact Triaging `🔴 [Production-Critical]`

- 10,000 errors on an optional recommendations widget $\implies$ **Low Severity** (Fix in regular sprint).
- 5 errors on payment checkout completion $\implies$ **Critical Sev-1** (Page on-call engineer immediately).

---

### Part 6 — Release & Git Commit Version Correlation `🟢 [Daily Driver]`

Tag every telemetry event with `release: 'v4.2.1'` and `commit: 'a1b2c3d'` to isolate whether an error spike was introduced by the most recent deployment.

---

### Part 7 — Deployments as Temporal Diagnostic Boundaries `🟢 [Daily Driver]`

When investigating an error spike, check whether the increase directly correlates with a release timestamp, backend deployment, or feature flag toggle.

---

### Part 8 — Breadcrumb Ring Buffers `🟢 [Daily Driver]`

Maintain a fixed-capacity queue (e.g. 50 items) recording recent clicks, route navigations, and API requests to recreate the exact sequence leading up to a crash.

---

### Part 9 — Breadcrumbs vs. Full Session Replay `🟢 [Daily Driver]`

- **Breadcrumbs:** Low-overhead metadata strings ($<5\text{KB}$); 100% capture rate.
- **Session Replay (rrweb):** Full DOM mutation recordings ($>500\text{KB}$); use sampled capture (e.g. 1% of sessions or errors only).

---

### Part 10 — Session Context Enrichment `🟢 [Daily Driver]`

Attach non-sensitive environment metadata: `navigator.userAgent`, `navigator.deviceMemory`, `navigator.connection.effectiveType`, route path, and active tenant ID.

---

### Part 11 — Privacy Boundaries: Zero-PII Invariants `🔴 [Production-Critical]`

Enforce automated regex masking and key filtering to ensure passwords, auth tokens, credit cards, and PII are never transmitted to telemetry aggregators.

---

### Part 12 — Real User Monitoring (RUM) vs. Synthetic Benchmarks `🟢 [Daily Driver]`

- **Synthetic (Lighthouse):** Clean lab environment testing ideal device speeds.
- **RUM:** Captures real-world variances: 3G mobile networks, low-RAM devices, background CPU throttling, and ad-blockers.

---

### Part 13 — Performance Latency Distributions (P75, P90, P99) `🟢 [Daily Driver]`

Evaluate performance using percentiles:
- **P50 (Median):** Typical user experience.
- **P95 / P99 (Tail):** The worst 5% / 1% of user experiences, where timeouts and dropoffs occur.

---

### Part 14 — Core Web Vitals (LCP, INP, CLS) `🟢 [Daily Driver]`

- **LCP (Largest Contentful Paint):** Loading speed ($<2.5\text{s}$).
- **INP (Interaction to Next Paint):** Responsiveness ($<200\text{ms}$).
- **CLS (Cumulative Layout Shift):** Visual stability ($<0.1$).

---

### Part 15 — Network Request Monitoring & Categorization `🟢 [Daily Driver]`

Track client API requests to separate frontend JavaScript bugs from backend 500 errors, gateway timeouts, and client offline drops.

---

### Part 16 — Error Rate vs. Conversion Availability `🟢 [Daily Driver]`

Calculate availability as successful business transactions divided by total attempts:
$$\text{Availability} = \frac{\text{Successful Checkouts}}{\text{Total Checkout Attempts}} \times 100\%$$

---

### Part 17 — Actionable Alert Design: Mitigating Alert Fatigue `🔴 [Production-Critical]`

Every alert must satisfy three criteria: **User Impacting**, **Actionable by On-Call**, and **Linked to a Runbook**. Non-urgent anomalies belong on dashboards, not pagers.

---

### Part 18 — Dynamic Telemetry Sampling `🟢 [Daily Driver]`

Capture 100% of uncaught errors and payment failures, but sample high-volume routine events (e.g. pageviews, scroll events) at 1% to 10% to reduce network and SaaS costs.

---

### Part 19 — Step-by-Step Frontend Incident Protocol `🔴 [Production-Critical]`

$$\text{Alert Fired} \to \text{Confirm Impact} \to \text{Mitigate (Rollback/Flag)} \to \text{Isolate via Breadcrumbs} \to \text{Root Cause Fix} \to \text{Postmortem}$$

---

### Part 20 — 10-Point Production Observability Checklist `🟢 [Daily Driver]`

```text
1. Are unhandled errors and promise rejections captured globally?
2. Are error reports deterministically fingerprinted to avoid noisy duplicates?
3. Are breadcrumbs bounded by a fixed-capacity ring buffer (max 50)?
4. Is all PII (passwords, tokens, emails) strictly scrubbed before transmission?
5. Are release versions, git commit hashes, and environments attached to events?
6. Are Web Vitals (LCP, INP, CLS) tracked with device and connection context?
7. Is performance analyzed using P95/P99 percentiles rather than misleading averages?
8. Are alerts configured strictly for actionable, user-impacting SLO breaches?
9. Is dynamic sampling applied to high-volume events to control bandwidth/cost?
10. Does every on-call alert link directly to an operational runbook?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Solution | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Sentry / Datadog RUM** | Enterprise applications requiring turnkey error tracking, symbolication, and alerts. | Highly air-gapped, zero-cloud private networks with strict local-only data laws. | Paid SaaS billing costs; vendor SDK bundle overhead ($\approx 25\text{KB}$). | OpenTelemetry, Self-hosted Sentry. |
| **OpenTelemetry (OTel) Web**| Vendor-neutral open standards; unified observability across frontend and backend. | Quick MVPs or small projects without dedicated observability infrastructure. | Complex setup; requires maintaining an OpenTelemetry Collector gateway. | Sentry, Datadog. |
| **Custom In-House Beacon Buffer** | Ultra-lightweight telemetry (e.g. embedded widgets, smart TV web apps). | Full-featured enterprise platforms needing advanced stack symbolication. | Requires building and maintaining in-house aggregation dashboards and databases. | Sentry SDK. |
| **Full Session Replay (rrweb)** | Debugging complex, rare visual regressions and multi-step user flow bugs. | High-throughput data-heavy pages (financial trading grids) where DOM is massive. | High network and storage payload ($500\text{KB}+$ per session); strict PII masking required. | Breadcrumbs Ring Buffer. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise RUM Telemetry Provider with Breadcrumbs & Web Vitals in TypeScript
```tsx
import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';

// ==========================================
// 1. DATA CONTRACTS & RING BUFFER
// ==========================================
export interface Breadcrumb {
  timestamp: string;
  category: 'ui.click' | 'navigation' | 'network' | 'custom';
  message: string;
  data?: Record<string, unknown>;
}

export interface TelemetryContextType {
  addBreadcrumb: (category: Breadcrumb['category'], message: string, data?: Record<string, unknown>) => void;
  captureException: (error: Error, extraContext?: Record<string, unknown>) => void;
}

class BreadcrumbRingBuffer {
  private buffer: Breadcrumb[] = [];
  constructor(private readonly limit = 30) {}

  public push(crumb: Breadcrumb) {
    if (this.buffer.length >= this.limit) {
      this.buffer.shift(); // Evict oldest
    }
    this.buffer.push(crumb);
  }

  public getSnapshot(): Breadcrumb[] {
    return [...this.buffer];
  }
}

const TelemetryContext = createContext<TelemetryContextType | null>(null);

// ==========================================
// 2. ENTERPRISE TELEMETRY PROVIDER
// ==========================================
export function EnterpriseTelemetryProvider({
  children,
  releaseVersion = 'v1.0.0',
  environment = 'production'
}: {
  children: ReactNode;
  releaseVersion?: string;
  environment?: string;
}) {
  const ringBufferRef = useRef(new BreadcrumbRingBuffer(30));

  const addBreadcrumb = (category: Breadcrumb['category'], message: string, data?: Record<string, unknown>) => {
    ringBufferRef.current.push({
      timestamp: new Date().toISOString(),
      category,
      message,
      data: sanitizeMetadata(data)
    });
  };

  const captureException = (error: Error, extraContext: Record<string, unknown> = {}) => {
    const payload = {
      timestamp: new Date().toISOString(),
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
      release: releaseVersion,
      environment,
      breadcrumbs: ringBufferRef.current.getSnapshot(),
      context: sanitizeMetadata(extraContext),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // 🟢 Send to APM server using Beacon API for reliability during unload
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/telemetry/errors', blob);
    } else {
      fetch('/api/telemetry/errors', { method: 'POST', body: blob, keepalive: true }).catch(() => {});
    }

    console.error('[APM Telemetry Dispatched]:', payload);
  };

  // Listen for global unhandled errors
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      captureException(event.error || new Error(event.message));
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      captureException(reason, { type: 'UNHANDLED_PROMISE_REJECTION' });
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <TelemetryContext.Provider value={{ addBreadcrumb, captureException }}>
      {children}
    </TelemetryContext.Provider>
  );
}

function sanitizeMetadata(obj?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!obj) return undefined;
  const sensitive = new Set(['password', 'token', 'auth', 'secret', 'card']);
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    clean[k] = sensitive.has(k.toLowerCase()) ? '[REDACTED]' : v;
  }
  return clean;
}

export function useTelemetry() {
  const ctx = useContext(TelemetryContext);
  if (!ctx) throw new Error('useTelemetry must be used within EnterpriseTelemetryProvider');
  return ctx;
}
```

---

## 🧠 Part 09 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: Breadcrumb Ring Buffer Bounded Eviction
```js
class RingBuffer {
  constructor(limit = 3) { this.limit = limit; this.items = []; }
  add(item) {
    if (this.items.length >= this.limit) this.items.shift();
    this.items.push(item);
  }
}

const rb = new RingBuffer(3);
rb.add("Click A");
rb.add("Nav to /checkout");
rb.add("Click Pay");
rb.add("Server 500");

console.log("Current Breadcrumbs:", rb.items);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Current Breadcrumbs: [ 'Nav to /checkout', 'Click Pay', 'Server 500' ]
```
**Why:** Reaching the limit of 3 evicted the oldest entry ("Click A"), keeping memory bounded to a strict constant footprint.
</details>

---

### Prediction Challenge 2: P95 Percentile Latency Calculation
```js
function calculateP95(latencies) {
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil(0.95 * sorted.length) - 1;
  return sorted[index];
}

// 20 requests: 19 take ~100ms, 1 takes 5000ms
const sample = [100, 105, 95, 102, 98, 110, 100, 99, 101, 104, 100, 98, 102, 100, 103, 99, 101, 100, 102, 5000];

console.log("Average:", sample.reduce((a, b) => a + b, 0) / sample.length);
console.log("P95 Latency:", calculateP95(sample));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Average: 346
P95 Latency: 5000
```
**Why:** The average (346ms) masks the severity of the tail latency. P95 (5000ms) accurately identifies that the slowest 5% of users are experiencing catastrophic 5-second delays.
</details>

---

### Prediction Challenge 3: Telemetry Sampling Decision
```js
function shouldSampleEvent(isError, sampleRate = 0.1) {
  if (isError) return true; // 100% capture for errors
  return Math.random() < sampleRate; // 10% sampling for normal events
}

console.log("Error Sampled?:", shouldSampleEvent(true)); // Always true
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Error Sampled?: true
```
**Why:** Production observability systems retain 100% of errors for diagnostic accuracy while sampling high-volume benign telemetry to control storage and network overhead.
</details>

---

### Prediction Challenge 4: Error Fingerprint Hashing
```js
function generateFingerprint(err) {
  // Deterministic signature
  return `${err.name}::${err.message.replace(/id=\d+/g, "id=:id")}`;
}

const err1 = new TypeError("User id=101 not found");
const err2 = new TypeError("User id=999 not found");

console.log("FP 1:", generateFingerprint(err1));
console.log("FP 2:", generateFingerprint(err2));
console.log("Same Fingerprint?:", generateFingerprint(err1) === generateFingerprint(err2));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
FP 1: TypeError::User id=:id not found
FP 2: TypeError::User id=:id not found
Same Fingerprint?: true
```
**Why:** Normalizing dynamic ID parameters collapses thousands of individualized errors into a single grouped issue in telemetry databases.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What are "Breadcrumbs" in frontend error tracking systems like Sentry?  
<details>
<summary><strong>Answer</strong></summary>
Breadcrumbs are a chronological timeline of lightweight user actions, route transitions, console logs, and network requests recorded leading up to an error. When an exception occurs, the breadcrumb trail is attached to the error report, allowing developers to see the exact sequence of steps the user took before the application crashed.
</details>

**Q2:** What is the difference between Synthetic Monitoring and Real User Monitoring (RUM)?  
<details>
<summary><strong>Answer</strong></summary>
- **Synthetic Monitoring:** Automated scripts (e.g. Lighthouse, synthetic bots) running in controlled, clean environments at fixed intervals to benchmark performance and detect regressions.  
- **Real User Monitoring (RUM):** Telemetry SDKs embedded in the live application that capture performance, network latencies, and JavaScript errors experienced by actual users across real devices, operating systems, and varying network conditions.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** Why should engineering teams evaluate performance using P95/P99 percentiles rather than mean averages?  
<details>
<summary><strong>Answer</strong></summary>
Mathematical averages (means) hide extreme latency spikes. If 90% of users experience a 100ms load time and 10% experience a 15,000ms timeout, the average load time appears as ~1.5 seconds (which looks acceptable). The P95 percentile highlights the experience of the slowest 5% of users (15 seconds), exposing severe degradation that leads to user churn.
</details>

**Q4:** What is "Alert Fatigue" and how do you design actionable alerting rules?  
<details>
<summary><strong>Answer</strong></summary>
Alert fatigue occurs when on-call engineers are inundated with excessive, non-actionable, or noisy alerts, causing them to desensitize, ignore, or mute alert channels. To prevent alert fatigue, alerts should only be triggered by significant breaches of business Service Level Objectives (SLOs) (e.g. checkout failure rate $>2\%$), require an attached runbook, and route non-urgent anomalies to passive dashboards.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** How do you implement a zero-leak telemetry ingestion client using the `navigator.sendBeacon()` API?  
<details>
<summary><strong>Answer</strong></summary>
1. **Beacon API Reliability:** When a user navigates away or closes a tab, standard `fetch()` or `XMLHttpRequest` calls are often terminated by the browser before completion.  
2. **`navigator.sendBeacon` Mechanics:** `navigator.sendBeacon(url, data)` queues asynchronous HTTP POST requests directly to the browser's background network process, guaranteeing delivery without delaying page unmounts or consuming main-thread execution time.  
3. **Fallback:** If `sendBeacon` is unsupported or the payload exceeds quota ($\approx 64\text{KB}$), fall back to `fetch(url, { keepalive: true })`.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** Design an enterprise-scale Real User Monitoring (RUM) architecture for a web application serving 50 million daily active users with sub-dollar cost efficiency and strict GDPR compliance.  
<details>
<summary><strong>Answer</strong></summary>
1. **Dynamic Edge Sampling:** Ingest 100% of uncaught crashes and transactional write failures (checkout, payments), but sample read-only pageviews and performance traces at 1% using a deterministic client session hash.  
2. **Client-Side Data Masking & Ring Buffer:** Maintain a strictly bounded 30-item breadcrumb ring buffer. Execute recursive regex scrubbing on the client to redact emails, passwords, auth tokens, and credit card numbers before serialization.  
3. **Edge Ingestion Gateway:** Ingest telemetry at Cloudflare Workers / AWS CloudFront edge nodes. Aggregate metrics into Prometheus/ClickHouse time-series clusters to provide sub-second P95/P99 latency dashboards and anomaly alerting without expensive third-party SaaS pricing.
</details>

---

## 🛠️ Senior Architecture Challenge: Real-User Monitoring (RUM) & Breadcrumb Engine

```js
// See runnable implementation in examples/09-frontend-observability-breadcrumbs-alert-design.js
```

---

## Key Takeaways
1. **RUM over Lab Tests:** Measure actual user performance and real device latencies.
2. **Ring Buffer Breadcrumbs:** Use fixed-capacity queues to prevent memory leaks.
3. **P95 over Averages:** Evaluate performance distributions to catch tail degradation.
4. **Actionable Alerts Only:** Alert on SLO user impact with runbooks; eliminate noise.
5. **Zero-PII Invariant:** Scrub tokens and personal data before sending to telemetry.

---

[⬅️ Part 08: Debugging Architecture & Production Postmortems](./08-debugging-architecture-postmortems-systemic-quality.md) | [📚 KPI 10 Index](./README.md) | [Part 10: Testing Error Paths & Debugging Skills in Practice ➡️](./10-testing-error-paths-debugging-practice.md)
