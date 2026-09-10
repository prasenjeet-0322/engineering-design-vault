# Level 06 — React Fundamentals
# KPI 16 — Error Handling, Boundaries & Resilience
## PART 03 — Error Recovery, Reset Semantics, Retry Policies & Resilient Fallback Architecture

[⬅️ Previous Part](./02-render-errors-vs-async-errors.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](./examples/03-fallback-ui-recovery-patterns.html) | [Next Part ➡️](./04-error-crucible-resilience-design.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)  
> **Co-Author:** Prasenjeet (Mid-Level Full Stack Developer)

---

# 0. 🧭 The Core Question: Moving Beyond Naïve "Try Again"

Part 01 established **Failure Containment** via React Fiber boundaries.  
Part 02 established **Failure-Surface Classification** (Render vs Event vs Async vs Macrotask Timers).  

This part answers the decisive production question that separates junior frontend developers from senior system architects:

> **Once a component subtree has failed and an Error Boundary has rendered its fallback, how does the system safely, deterministically, and gracefully become usable again?**

A fallback UI that simply renders:
```text
Something went wrong. [Try Again]
```
is **not** a recovery architecture. It is an unprincipled UI placeholder. 

Clicking that button initiates an explicit state transition and execution protocol. Every senior full-stack engineer must be able to answer with mathematical precision:

```text
                               UNEXPECTED COMPONENT FAILURE OCCURS
                                                │
                                                ▼
                                    CONTAINED BY ERROR BOUNDARY
                                                │
                                                ▼
                                   WHAT EXACTLY IS BEING RESET?
                                                │
             ┌──────────────────────────────────┼──────────────────────────────────┐
             ▼                                  ▼                                  ▼
      BOUNDARY STATE                     COMPONENT IDENTITY                 REMOTE / CACHE STATE
  (hasError: false flag)               (React Fiber remount)               (Query Cache Invalidation)
             │                                  │                                  │
             ▼                                  ▼                                  ▼
      IS RETRY SAFE?                     IS RETRY BOUNDED?                  WHAT STATE SURVIVES?
  (Transient vs Deterministic)        (Max Attempts / Backoff)           (Form Drafts, Scroll, Sibilings)
             │                                  │                                  │
             └──────────────────────────────────┼──────────────────────────────────┘
                                                │
                                                ▼
                                   EXECUTE RECOVERY PROTOCOL
                                                │
             ┌──────────────────────────────────┴──────────────────────────────────┐
             ▼                                                                     ▼
       SUCCESSFUL RESET                                                     RECOVERY EXHAUSTED
 (Subtree re-renders healthy)                                           (Terminal failure fallback)
             │                                                                     │
             ▼                                                                     ▼
   Emit Telemetry: RECOVERED                                             Emit Telemetry: FATAL_UNRECOVERABLE
```

The fundamental mental model of this part is:
$$\text{Failure} \longrightarrow \text{Contain} \longrightarrow \text{Classify} \longrightarrow \text{Select Strategy} \longrightarrow \text{Reset / Retry / Remount / Reload} \longrightarrow \text{Re-Enter Healthy State} \longrightarrow \text{Observe Outcome}$$

---

# 1. ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

### 1.1 Recovery is NOT the Same Thing as Retry
One of the most damaging misconceptions in React development is treating **Reset**, **Retry**, **Remount**, and **Reload** as interchangeable synonyms. They represent fundamentally distinct operations with different execution contexts, blast radiuses, and lifecycle consequences:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              THE 4 RECOVERY OPERATIONS                                 │
├──────────┬──────────────────────────────────────────┬──────────────────────────────────┤
│ Operation│ Primary Architectural Meaning            │ Typical Mechanism                │
├──────────┼──────────────────────────────────────────┼──────────────────────────────────┤
│ RESET    │ Clear the failure state in the boundary  │ `this.setState({ hasError: false })`│
│          │ and allow the subtree to render again.   │ or `resetKeys` prop change.      │
├──────────┼──────────────────────────────────────────┼──────────────────────────────────┤
│ RETRY    │ Re-execute an asynchronous operation or  │ `query.refetch()` or             │
│          │ network request that previously failed.  │ `fetchData()` invocation.        │
├──────────┼──────────────────────────────────────────┼──────────────────────────────────┤
│ REMOUNT  │ Destroy the existing React Fiber and     │ Increment `key={instanceVersion}`│
│          │ create a fresh component identity.       │ to unmount and mount anew.       │
├──────────┼──────────────────────────────────────────┼──────────────────────────────────┤
│ RELOAD   │ Destroy the entire browser document, JS  │ `window.location.reload()`       │
│          │ heap, memory store, and re-bootstrap.    │ (Catastrophic last resort).      │
└──────────┴──────────────────────────────────────────┴──────────────────────────────────┘
```

### 1.2 The Master Recovery Equation
$$\text{Resilient Recovery} = \frac{\text{Failure Containment} \times \text{Recovery Ownership} \times \text{Safe Bounded Policy} \times \text{State Preservation}}{\text{Blast Radius} \times \text{Retry Storm Probability}}$$

If any factor in this equation collapses:
- **Unbounded Retry** $\longrightarrow$ Exponential retry storm that crashes backend API servers.
- **Wrong Component Identity** $\longrightarrow$ Stale state pollution or accidental destruction of user form drafts.
- **Unobservable Reset** $\longrightarrow$ Silent production degradation where users repeatedly click broken buttons.

---

# 2. 🔬 The Recovery State Machine

Do not model error recovery using an ad-hoc collection of independent boolean flags:
```typescript
// ❌ DANGEROUS: 2^4 = 16 states, allowing nonsensical combinations
// e.g., hasError = true, isRetrying = true, wasRecovered = true
interface NaiveRecoveryState {
  hasError: boolean;
  isRetrying: boolean;
  retryFailed: boolean;
  wasRecovered: boolean;
}
```

A production-grade architecture models recovery as a strict **Finite State Machine (FSM)** with well-defined transitions:

```text
                             RECOVERY STATE MACHINE
                        ┌─────────────────────────┐
                        │         HEALTHY         │
                        └────────────┬────────────┘
                                     │
                                     │ descendant throws
                                     ▼
                        ┌─────────────────────────┐
         ┌──────────────┤         FAILED          │◄─────────────┐
         │              └────────────┬────────────┘              │
         │                           │                           │
         │                           │ user clicks "Retry"       │ retry fails
         │                           ▼                           │
         │              ┌─────────────────────────┐              │
         │              │       RECOVERING        ├──────────────┘
         │              └────────────┬────────────┘
         │                           │
         │ max retries               │ render succeeds
         │ reached                   ▼
         │              ┌─────────────────────────┐
         └─────────────►│   RECOVERY_EXHAUSTED    │
                        └─────────────────────────┘
```

```typescript
export type RecoveryState<TData = unknown> =
  | { status: "healthy"; data?: TData }
  | { status: "failed"; error: Error; errorId: string; failedAt: number; retryCount: number }
  | { status: "recovering"; attempt: number; errorId: string; startedAt: number }
  | { status: "recovery-exhausted"; error: Error; errorId: string; totalAttempts: number; exhaustedAt: number };
```

---

# 3. 🔬 Boundary Reset Semantics: Class Lifecycle Mechanics

### 3.1 What Does `reset()` Actually Do?
When an Error Boundary catches an error, it transitions its internal state via `getDerivedStateFromError`:
```typescript
static getDerivedStateFromError(error: Error) {
  return { hasError: true, error };
}
```

When a user clicks a "Retry" button that invokes `this.reset()`, the boundary executes:
```typescript
public reset = (): void => {
  this.setState({ hasError: false, error: null });
};
```

### 3.2 The Fundamental Invariant: Reset $\neq$ Bug Fix
Resetting an Error Boundary **does not magically fix broken code**. 
If the child component contains a **deterministic rendering defect**:
```tsx
function BrokenWidget({ user }: { user: { name: string } | null }) {
  // 💥 Deterministic crash: Accessing .name on null will throw every single render!
  return <h1>{user.name}</h1>;
}
```

The execution loop becomes:
$$\text{Boundary Reset} \longrightarrow \text{Child Renders} \longrightarrow \text{Child Throws} \longrightarrow \text{Boundary Catches} \longrightarrow \text{Fallback Re-mounts}$$

```text
THE DETERMINISTIC CRASH LOOP:
[User clicks "Retry"]
       │
       ▼
1. Boundary sets `hasError: false`
       │
       ▼
2. React begins render pass for Child Component
       │
       ▼
3. Child executes `user.name` (user is still null!) ──► THROWS TypeError!
       │
       ▼
4. React catches error in performUnitOfWork
       │
       ▼
5. Boundary static getDerivedStateFromError() sets `hasError: true`
       │
       ▼
6. Fallback UI mounts again immediately (<16ms)
```

**Senior Takeaway:** Resetting only succeeds if the underlying invariant that caused the crash has changed (e.g., transient network data arrived, invalid props were corrected, or user navigated to a different entity).

---

# 4. 🔬 Identity-Driven Reset: `key` vs. `resetKeys`

### 4.1 React Component Identity via `key`
Changing a component's `key` instructs React to completely tear down the old Fiber node and mount a brand-new instance from scratch:

```tsx
export function DocumentWorkspace({ documentId }: { documentId: string }) {
  return (
    // When documentId changes from "doc_A" to "doc_B",
    // React unmounts Boundary[A] and mounts Boundary[B] cleanly!
    <ErrorBoundary key={documentId}>
      <DocumentEditor documentId={documentId} />
    </ErrorBoundary>
  );
}
```

```text
FIBER IDENTITY MIGRATION:
[documentId = "doc_A" Crashes]
┌──────────────────────────────────────────────┐
│ Fiber(ErrorBoundary, key="doc_A")            │
│ State: { hasError: true, error: Error }      │
│ Rendered Output: <FallbackUI />              │
└──────────────────────────────────────────────┘
                       │
                       │ User selects "doc_B" in sidebar
                       ▼
┌──────────────────────────────────────────────┐
│ 1. Unmount Fiber(key="doc_A") (Run cleanups) │
│ 2. Create Fiber(key="doc_B") (Fresh State)   │
│ State: { hasError: false, error: null }      │
│ Rendered Output: <DocumentEditor doc_B />    │
└──────────────────────────────────────────────┘
```

---

# 5. 🔬 `resetKeys` Pattern: Semantic Dependency Tracking

### 5.1 Mechanical Implementation of `resetKeys`
Because React does not provide a native `resetKeys` prop, production architectures implement shallow dependency comparison inside `componentDidUpdate`:

```typescript
import React, { Component, ReactNode, ErrorInfo } from "react";

export interface ResilientBoundaryProps {
  children: ReactNode;
  fallback: (error: Error, reset: () => void) => ReactNode;
  resetKeys?: unknown[];
  onReset?: (details: { prevKeys?: unknown[]; nextKeys?: unknown[] }) => void;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ResilientBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ResilientBoundary extends Component<ResilientBoundaryProps, ResilientBoundaryState> {
  public state: ResilientBoundaryState = { hasError: false, error: null };

  public static getDerivedStateFromError(error: unknown): ResilientBoundaryState {
    return {
      hasError: true,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    if (this.props.onError) {
      try {
        this.props.onError(error, info);
      } catch (loggingError) {
        console.error("[ResilientBoundary] Telemetry callback crashed:", loggingError);
      }
    }
  }

  public componentDidUpdate(prevProps: ResilientBoundaryProps): void {
    const { hasError } = this.state;
    const { resetKeys } = this.props;

    // Only inspect resetKeys if the boundary is currently in an error state!
    if (hasError && prevProps.resetKeys && resetKeys) {
      if (this.haveResetKeysChanged(prevProps.resetKeys, resetKeys)) {
        this.reset(prevProps.resetKeys, resetKeys);
      }
    }
  }

  private haveResetKeysChanged(prevKeys: unknown[], nextKeys: unknown[]): boolean {
    if (prevKeys.length !== nextKeys.length) return true;
    for (let i = 0; i < prevKeys.length; i++) {
      if (!Object.is(prevKeys[i], nextKeys[i])) {
        return true;
      }
    }
    return false;
  }

  public reset = (prevKeys?: unknown[], nextKeys?: unknown[]): void => {
    if (this.props.onReset) {
      try {
        this.props.onReset({ prevKeys, nextKeys });
      } catch (onResetError) {
        console.error("[ResilientBoundary] onReset callback failed:", onResetError);
      }
    }
    this.setState({ hasError: false, error: null });
  };

  public render(): ReactNode {
    const { hasError, error } = this.state;
    if (hasError && error) {
      return this.props.fallback(error, () => this.reset());
    }
    return this.props.children;
  }
}
```

### 5.2 Anti-Pattern: Unstable / Non-Semantic Reset Keys
```tsx
// ❌ CATASTROPHIC ANTI-PATTERN: Inline object or timestamp in resetKeys
// Creates a new reference every render, forcing an infinite crash loop!
<ResilientBoundary resetKeys={[{ userId: id }, Date.now()]}>
  <UserProfile userId={id} />
</ResilientBoundary>

// ✅ PRODUCTION BEST PRACTICE: Stable primitive semantic identifiers
<ResilientBoundary resetKeys={[id, tenantId, location.pathname]}>
  <UserProfile userId={id} />
</ResilientBoundary>
```

---

# 6. 🔬 Retry Policies: Preventing Retry Storms & Loops

### 6.1 Exponential Backoff with Randomized Jitter
When retrying recoverable operations (e.g., transient network failures, temporary rate limits), never retry immediately in a tight synchronous loop. Apply **Exponential Backoff with Full Jitter**:

$$\text{Delay}(n) = \min\left(\text{MaxDelay}, \text{BaseDelay} \times 2^n\right) \times \text{Random}(0.8, 1.2)$$

```typescript
export interface RetryPolicyConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterFactor: number;
}

export const DEFAULT_RETRY_POLICY: RetryPolicyConfig = {
  maxAttempts: 3,
  baseDelayMs: 500,
  maxDelayMs: 5000,
  jitterFactor: 0.2,
};

export function calculateBackoffDelay(attempt: number, config: RetryPolicyConfig = DEFAULT_RETRY_POLICY): number {
  const exponential = Math.min(config.maxDelayMs, config.baseDelayMs * Math.pow(2, attempt));
  const jitterRange = exponential * config.jitterFactor;
  const jitter = (Math.random() * 2 - 1) * jitterRange; // +/- jitter
  return Math.max(0, Math.floor(exponential + jitter));
}
```

### 6.2 Retryable vs. Non-Retryable Error Classification

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              RETRY CLASSIFICATION TAXONOMY                             │
├───────────────────────────────┬───────────────────┬────────────────────────────────────┤
│ Error Type                    │ Auto-Retry Safe?  │ Recommended Recovery Strategy      │
├───────────────────────────────┼───────────────────┼────────────────────────────────────┤
│ Network Connection Reset      │ ✅ YES (Bounded)  │ Exponential Backoff (3 attempts)   │
│ HTTP 503 Service Unavailable  │ ✅ YES (Bounded)  │ Backoff with Jitter                │
│ HTTP 429 Rate Limited         │ ✅ YES (With TTL) │ Read `Retry-After` Header          │
│ HTTP 401 Unauthorized         │ ❌ NO             │ Redirect to Login / Token Refresh  │
│ HTTP 403 Forbidden            │ ❌ NO             │ Render Access Denied Banner        │
│ HTTP 404 Not Found            │ ❌ NO             │ Render Empty / Not Found State     │
│ JSON Schema Validation Error  │ ❌ NO             │ Surface Bug / Contact Support      │
│ TypeError: Cannot read null   │ ❌ NO (Manual)    │ User Navigation / Bug Fix          │
└───────────────────────────────┴───────────────────┴────────────────────────────────────┘
```

---

# 7. 🧱 Multi-Tier Fallback Hierarchy & Zero-CLS Layout Matching

```text
                                  THE 4-TIER FALLBACK TAXONOMY
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ TIER 4: APPLICATION ROOT SHELL FALLBACK                                                     │
│ Scope: Fatal boot crash, broken root providers.                                             │
│ UX: Branded full-page crash screen with "Reload Application" and "Contact Support" links.   │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ TIER 3: ROUTE / PAGE-LEVEL FALLBACK                                                     │ │
│ │ Scope: Broken route parameters, missing page bundle.                                    │ │
│ │ UX: Page container with "Return to Dashboard" and "Retry Page Load". Nav & Header STAY!│ │
│ │ ┌─────────────────────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ TIER 2: FEATURE / WORKSPACE FALLBACK                                                │ │ │
│ │ │ Scope: Corrupted table data, broken filter pane.                                    │ │ │
│ │ │ UX: Inline card fallback with "Retry Feature". Sibling metrics and tools stay active! │ │
│ │ │ ┌─────────────────────────────────────────────────────────────────────────────────┐ │ │ │
│ │ │ │ TIER 1: MICRO LEAF / WIDGET FALLBACK                                            │ │ │ │
│ │ │ │ Scope: Broken avatar image, missing badge, corrupted single chart.              │ │ │ │
│ │ │ │ UX: Generic SVG placeholder icon, matching exact bounding height/width (0 CLS). │ │ │ │
│ │ │ └─────────────────────────────────────────────────────────────────────────────────┘ │ │ │
│ │ └─────────────────────────────────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.1 Zero Cumulative Layout Shift (CLS) Fallback Design
When a chart or table crashes and mounts a fallback, the fallback container **must match the exact bounding dimensions (min-height / min-width)** of the original component. If a 400px chart collapses into a 20px error text string, the surrounding UI layout jumps jarringly, degrading Core Web Vitals (CLS):

```tsx
// ✅ PRODUCTION PATTERN: Zero-CLS Bounded Fallback
export function ChartFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div 
      role="alert" 
      aria-live="assertive"
      className="min-h-[320px] w-full flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded-xl p-6 text-center space-y-3"
    >
      <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
        ⚠️
      </div>
      <div className="space-y-1">
        <h4 className="text-xs font-bold text-slate-200 font-mono">Revenue Chart Unavailable</h4>
        <p className="text-[11px] text-slate-400 font-mono max-w-sm">{error.message}</p>
      </div>
      <button
        onClick={reset}
        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-800/40 rounded-lg text-xs font-mono font-semibold transition shadow"
      >
        Retry Visualization
      </button>
    </div>
  );
}
```

---

# 8. 🔬 Production Crucible Incidents & Post-Mortems

```text
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             PRODUCTION CRUCIBLE INCIDENTS                                │
├─────────────────────────┬──────────────────────────────────┬─────────────────────────────┤
│ Incident                │ Root Cause                       │ Architectural Fix           │
├─────────────────────────┼──────────────────────────────────┼─────────────────────────────┤
│ 1. The Broken Reset Loop│ Child threw `null.map()`; reset  │ Classify deterministic vs   │
│                         │ re-rendered exact same error.    │ transient errors; disable   │
│                         │                                  │ infinite retry button.      │
├─────────────────────────┼──────────────────────────────────┼─────────────────────────────┤
│ 2. The Draft Data Loss  │ Single preview widget crashed;   │ Granular boundary around    │
│    Wipeout              │ root boundary reset wiped editor.│ preview only; preserve form.│
├─────────────────────────┼──────────────────────────────────┼─────────────────────────────┤
│ 3. The Sentry Telemetry │ `componentDidCatch` dispatched   │ Scrub auth headers, tokens, │
│    PII Leak Incident    │ raw localStorage tokens & emails.│ and form inputs at adapter. │
├─────────────────────────┼──────────────────────────────────┼─────────────────────────────┤
│ 4. The DDoS Retry Storm │ Auto-retry on 500 error had no   │ Exponential backoff + jitter│
│                         │ delay or max attempt bound.      │ capped at 3 attempts.       │
└─────────────────────────┴──────────────────────────────────┴─────────────────────────────┘
```

### Crucible Incident #1: The Unsaved Draft Data Loss Wipeout
* **The Incident:** A medical practitioner was entering 45 minutes worth of clinical notes into an electronic health record (EHR) form. A small sidebar widget displaying patient insurance history threw an uncaught render error. Because the application had only a single `<RootErrorBoundary>`, the entire application shell unmounted and displayed a global "Something went wrong [Reload]" screen. When the doctor clicked reload, all unsaved clinical notes were permanently obliterated.
* **The Root Cause:** Catastrophic failure containment blast radius. A non-critical leaf widget failure destroyed critical form state.
* **The Senior Remediation:**
  1. Isolated Feature Boundaries placed around each non-critical sidebar widget.
  2. Local state preservation: Form drafts autosaved to `sessionStorage` or held in a parent state boundary above leaf widgets.

---

# 9. 🛠️ Complete Senior Implementation: Production Auto-Reset Boundary

Here is the complete enterprise-ready `AutoResetErrorBoundary` component featuring bounded retries, exponential backoff, semantic reset keys, and defensive telemetry:

```typescript
import React, { Component, ErrorInfo, ReactNode } from "react";
import { calculateBackoffDelay, DEFAULT_RETRY_POLICY, RetryPolicyConfig } from "./retryUtils";

export interface AutoResetBoundaryProps {
  children: ReactNode;
  fallback: (error: Error, reset: () => void, isRecovering: boolean, attempts: number) => ReactNode;
  name?: string;
  resetKeys?: unknown[];
  maxRetries?: number;
  autoRetry?: boolean;
  retryPolicy?: RetryPolicyConfig;
  onError?: (error: Error, info: ErrorInfo, attempt: number) => void;
  onRecoveryExhausted?: (error: Error, totalAttempts: number) => void;
  onReset?: () => void;
}

interface AutoResetBoundaryState {
  hasError: boolean;
  error: Error | null;
  attempts: number;
  isRecovering: boolean;
}

export class AutoResetErrorBoundary extends Component<AutoResetBoundaryProps, AutoResetBoundaryState> {
  public state: AutoResetBoundaryState = {
    hasError: false,
    error: null,
    attempts: 0,
    isRecovering: false,
  };

  private retryTimerId: NodeJS.Timeout | null = null;
  private prevResetKeys: unknown[] | undefined = this.props.resetKeys;

  public static getDerivedStateFromError(error: unknown): Partial<AutoResetBoundaryState> {
    const normalized = error instanceof Error ? error : new Error(String(error));
    return {
      hasError: true,
      error: normalized,
      isRecovering: false,
    };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    const { attempts } = this.state;
    const { onError, autoRetry, maxRetries = 3 } = this.props;

    if (onError) {
      try {
        onError(error, info, attempts);
      } catch (loggingErr) {
        console.error("[AutoResetBoundary] Telemetry error:", loggingErr);
      }
    }

    // Schedule automated bounded retry if enabled
    if (autoRetry && attempts < maxRetries) {
      const nextAttempt = attempts + 1;
      const delay = calculateBackoffDelay(attempts, this.props.retryPolicy);

      this.setState({ attempts: nextAttempt, isRecovering: true });

      this.retryTimerId = setTimeout(() => {
        this.reset();
      }, delay);
    } else if (attempts >= maxRetries && this.props.onRecoveryExhausted) {
      this.props.onRecoveryExhausted(error, attempts);
    }
  }

  public componentDidUpdate(prevProps: AutoResetBoundaryProps): void {
    const { hasError } = this.state;
    const { resetKeys } = this.props;

    if (hasError && prevProps.resetKeys && resetKeys) {
      const changed = resetKeys.some((k, i) => !Object.is(k, prevProps.resetKeys![i]));
      if (changed) {
        this.reset();
      }
    }
  }

  public componentWillUnmount(): void {
    if (this.retryTimerId) {
      clearTimeout(this.retryTimerId);
    }
  }

  public reset = (): void => {
    if (this.retryTimerId) {
      clearTimeout(this.retryTimerId);
      this.retryTimerId = null;
    }

    if (this.props.onReset) {
      this.props.onReset();
    }

    this.setState({
      hasError: false,
      error: null,
      isRecovering: false,
    });
  };

  public render(): ReactNode {
    const { hasError, error, isRecovering, attempts } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      return fallback(error, this.reset, isRecovering, attempts);
    }

    return children;
  }
}
```

---

# 10. 🧠 10 Staff-Level Interview Questions & Authoritative Answers

### Q1: What is the mechanical difference between resetting an Error Boundary and remounting its child subtree?
**Answer:** Resetting an Error Boundary (`this.setState({ hasError: false })`) clears the error state on the boundary Fiber and instructs React to re-evaluate the existing child subtree. If the child component's React identity (`key` and component position) has not changed, React attempts to reconcile against the existing Fiber nodes. Remounting (e.g., via `key={version}`) forces React to execute the full unmount lifecycle (firing `useEffect` and `componentWillUnmount` cleanups, deleting DOM nodes, purging local Hook states) and constructing completely new Fiber nodes from scratch.

### Q2: Why does an Error Boundary reset fail to recover when a child component throws a deterministic `TypeError`?
**Answer:** A deterministic `TypeError` (e.g., accessing properties on `undefined`) occurs during synchronous render evaluation whenever identical props or state are passed. Resetting the boundary causes React to re-render the child component immediately. Because the underlying data or bug has not been altered, the child throws the exact same exception in the work loop, and the boundary re-enters its error state within the same frame (<16ms). Recovery requires modifying the input state, altering the route parameters, or providing fallback data.

### Q3: How do `resetKeys` prevent stale error states during client-side route navigation?
**Answer:** When a user navigates between routes (e.g., from `/users/1` to `/users/2`), route-level Error Boundaries observing `resetKeys={[location.pathname]}` detect referential inequality in `componentDidUpdate`. If the boundary was previously displaying a fallback due to an error on `/users/1`, the key change automatically triggers `this.reset()`, allowing the new page `/users/2` to render fresh without requiring the user to manually click a "Try Again" button.

### Q4: Why is it critical to apply randomized jitter to automated exponential backoff retries?
**Answer:** If a centralized backend service or database experiences a brief 2-second outage, thousands of active client web applications will fail simultaneously. If all clients retry using strict exponential backoff (e.g., exactly at 1s, 2s, 4s), their requests will arrive at the server in synchronized wave pulses, creating a **Thundering Herd / Retry Storm** that knocks the recovering backend offline again. Jitter randomly distributes retry timestamps across time, smoothing the load curve.

### Q5: How should sensitive Personally Identifiable Information (PII) be scrubbed from Error Boundary telemetry payloads?
**Answer:** Telemetry adapters in `componentDidCatch` must pass errors through a sanitization pipeline before network dispatch. This pipeline scrubs:
1. Form input values (passwords, credit card numbers, SSNs) via regex patterns.
2. Query parameters (e.g., `?token=...`, `?auth=...`) from URLs in error messages.
3. JWT tokens and Authorization headers from network error attachments.
4. User email addresses and names from component stack frames.

### Q6: What is a "Terminal Recovery State" and why must every error architecture define one?
**Answer:** A terminal recovery state (`status: "recovery-exhausted"`) is an unrecoverable failure state reached when automated and manual retry limits are exhausted. It prevents infinite UI retry loops and provides actionable terminal workflows to the user (e.g., "This feature cannot be recovered. Download diagnostic log or Contact Support").

### Q7: Explain why React Context hooks (`useContext`) should never be used inside an Error Boundary's Fallback component.
**Answer:** If the error that triggered the boundary was caused by a corrupted, missing, or unmounted Context Provider upstream, evaluating `useContext(MyContext)` inside the fallback will throw a secondary exception during the fallback's render pass. This causes the Error Boundary itself to fail, escalating the error up to the parent ancestor boundary and blowing out the blast radius. Fallbacks must be zero-dependency pure components.

### Q8: How does Cumulative Layout Shift (CLS) relate to Error Boundary fallback design?
**Answer:** If a large visual component (e.g., a 600px analytics grid) crashes and renders an unstyled, single-line text fallback (`<div>Error</div>`), the page height collapses by 580px, causing all content below it to jump upwards violently. To maintain excellent Core Web Vitals (CLS < 0.1), fallback cards must specify matching `min-height` and container bounding dimensions.

### Q9: How can an application distinguish between a transient network error and a fatal schema mismatch during recovery?
**Answer:** By inspecting the normalized error classification. Transient network errors have transport status codes (`503 Service Unavailable`, `504 Gateway Timeout`, socket drop) and are safe for automated retry backoff. Schema validation errors (`ZodError`, `SyntaxError`, `TypeError`) indicate structural contract incompatibility between frontend and backend; automated retries will deterministically fail and must be blocked from retrying.

### Q10: What is the relationship between Error Boundary recovery and React 19 Server Actions?
**Answer:** In React 19, Server Actions integrate with `useActionState` and form boundaries. When a server action throws, React can either expose the error token directly to `useActionState` for inline form recovery, or bubble unexpected fatal crashes into the nearest `<ErrorBoundary>`, where standard `reset` semantics allow re-submitting the action transition.

---

# 11. ✅ 50-Point Senior Error Recovery & Fallback Mastery Checklist

```text
┌────────────────────────────────────────────────────────────────────────┐
│               50-POINT ERROR RECOVERY & RESILIENCE AUDIT               │
├────────────────────────────────────────────────────────────────────────┤
│ [ ] 01. Distinguish Reset from Retry, Remount, and Reload              │
│ [ ] 02. Model recovery as an explicit Finite State Machine (FSM)       │
│ [ ] 03. Implement `this.reset()` inside class Error Boundaries         │
│ [ ] 04. Implement semantic `resetKeys` shallow dependency tracking     │
│ [ ] 05. Prevent inline objects or timestamps in `resetKeys`            │
│ [ ] 06. Bind route location to `resetKeys` for auto-navigation reset   │
│ [ ] 07. Recognize deterministic render crashes that reset cannot fix   │
│ [ ] 08. Enforce bounded maximum retry limits (e.g., max 3 attempts)    │
│ [ ] 09. Implement exponential backoff formula for auto-retries         │
│ [ ] 10. Add randomized jitter to backoff delays to prevent retry storms│
│ [ ] 11. Distinguish retryable transport errors from fatal schema bugs  │
│ [ ] 12. Block automatic retries on HTTP 400, 401, 403, and 422 errors  │
│ [ ] 13. Support manual user-initiated "Retry" button on fallbacks      │
│ [ ] 14. Support "Go to Dashboard" route fallback navigation buttons    │
│ [ ] 15. Define explicit `RECOVERY_EXHAUSTED` terminal state            │
│ [ ] 16. Preserve surviving sibling component state during widget reset │
│ [ ] 17. Preserve unsaved user form drafts in parent state containers   │
│ [ ] 18. Build 4-tier fallback hierarchy (Root -> Route -> Card -> Leaf)│
│ [ ] 19. Ensure Fallback UI components are pure and zero-dependency     │
│ [ ] 20. Never invoke complex React Context hooks inside fallbacks      │
│ [ ] 21. Enforce zero Cumulative Layout Shift (CLS) bounding dimensions │
│ [ ] 22. Include accessible ARIA roles (`role="alert"`) on all fallbacks│
│ [ ] 23. Ensure keyboard focus automatically shifts to recovery buttons │
│ [ ] 24. Capture and log `errorInfo.componentStack` in `componentDidCatch`│
│ [ ] 25. Scrub PII, tokens, and credentials from telemetry error events │
│ [ ] 26. Correlate error events with unique `errorId` and user sessions │
│ [ ] 27. Record total retry attempt counts in telemetry payloads        │
│ [ ] 28. Wrap telemetry network dispatches in defensive `try/catch`     │
│ [ ] 29. Clear active retry timer timeouts on `componentWillUnmount`    │
│ [ ] 30. Prevent memory leaks on asynchronous recovery continuations    │
│ [ ] 31. Support fallback render props (`fallback={(err, reset) => ...}`│
│ [ ] 32. Support custom `FallbackComponent` React component props       │
│ [ ] 33. Decouple Error Boundary reset from remote cache invalidation   │
│ [ ] 34. Invalidate React Query / SWR cache on manual query refetch     │
│ [ ] 35. Implement component remounting via `key={version}` when needed │
│ [ ] 36. Understand unmount side effects and effect cleanup on remount  │
│ [ ] 37. Test nested boundary escalation when fallback component crashes│
│ [ ] 38. Verify fallback UI gracefully supports dark and light modes    │
│ [ ] 39. Implement copy-to-clipboard action for technical error details │
│ [ ] 40. Provide support ticket correlation ID for enterprise end-users │
│ [ ] 41. Design offline-mode non-fatal revalidation banners             │
│ [ ] 42. Test boundary recovery using React Testing Library (RTL)       │
│ [ ] 43. Verify simulated retry storms in synthetic load tests          │
│ [ ] 44. Isolate third-party canvas widgets behind dedicated Bulkheads  │
│ [ ] 45. Implement async-to-render bridge via `useAsyncErrorBridge`     │
│ [ ] 46. Ensure strict TypeScript types on all boundary props and state │
│ [ ] 47. Monitor error budget metrics against boundary activation rates │
│ [ ] 48. Conduct Failure Modes and Effects Analysis (FMEA) on routes    │
│ [ ] 49. Document disaster recovery runbooks for customer support teams │
│ [ ] 50. Defend error recovery and retry policies in staff code reviews │
└────────────────────────────────────────────────────────────────────────┘
```

---

# 12. 🏁 Graduation Gate: The Resilient EHR Architecture Challenge

To graduate from **KPI 16 Part 03**, analyze this mission-critical Electronic Health Record (EHR) clinical dashboard:

```text
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ [Header: Active Patient: Jane Doe (DOB: 1984-03-12) | Dr. Smith | Emergency Alert]     │
├───────────────────┬─────────────────────────────────────────────────────────────────────┤
│ [Patient Nav]     │ [Clinical Workspace]                                                │
│ - Vitals          │ ┌─────────────────────────────────┐ ┌─────────────────────────────┐ │
│ - Prescriptions   │ │ [Live ECG Heart Telemetry]      │ │ [Clinical Notes Editor]     │ │
│ - Lab Results     │ │ (WebSocket Stream)              │ │ (Active Unsaved Draft)      │ │
│ - Imaging         │ └─────────────────────────────────┘ └─────────────────────────────┘ │
│                   │ ┌─────────────────────────────────────────────────────────────────┐ │
│                   │ │ [Drug-Drug Interaction Checker] (3rd Party AI Cloud Service)    │ │
│                   │ └─────────────────────────────────────────────────────────────────┘ │
└───────────────────┴─────────────────────────────────────────────────────────────────────┘
```

### Architectural Challenge Questions:
1. **If the `Live ECG Heart Telemetry` WebSocket disconnects with an unrecoverable parity fault, what is the recovery protocol?**
2. **If the third-party `Drug-Drug Interaction Checker` throws an HTTP 500 error, how do you prevent the `Clinical Notes Editor` draft from being lost?**
3. **If the doctor switches patients from `Jane Doe` to `John Smith`, how does declarative identity reset work across all feature boundaries?**
4. **Design the exact component tree hierarchy with declarative boundary placements, bounded retry backoff, and zero-CLS fallback layouts.**

---

[⬅️ Previous Part](./02-render-errors-vs-async-errors.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](./examples/03-fallback-ui-recovery-patterns.html) | [Next Part ➡️](./04-error-crucible-resilience-design.md)
