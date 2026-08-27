# KPI 25 — Part 06: React Error Boundaries, Recovery & Resilient UI Architecture

[⬅️ Part 05: API Failure Handling & Retries](./05-api-failure-handling-retry-strategies.md) | [📚 KPI 25 Index](./README.md) | [Part 07: Structured Logging & Observability ➡️](./07-logging-observability-production-tracing.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| React Error Mechanism | Execution & Lifecycle Rule | Key Failure Mode & Risk | Senior Engineering Standard |
|---|---|---|---|
| **React Error Boundary** | Catches rendering, lifecycle, and constructor errors in child component trees. | Unhandled render errors crash and unmount the **entire React root tree** (blank screen). | 🟢 Wrap independent feature widgets and route segments in localized Error Boundaries. |
| **`getDerivedStateFromError`** | Static pure lifecycle method called during the render phase to transition state to `{ hasError: true }`. | Performing side effects (network logging) here throws errors in React Concurrent Mode. | 🔵 Keep pure: strictly compute fallback state without invoking side effects. |
| **`componentDidCatch`** | Commit phase lifecycle method called with `(error, errorInfo)` containing `componentStack`. | Swallowing errors to `console.log` without sending telemetry to Sentry/Datadog. | 🟢 Transmit sanitized error objects and component stacks to remote APM services. |
| **What Boundaries Miss** | Does **NOT** catch: Event handlers (`onClick`), async callbacks (`setTimeout`, `fetch`), or SSR errors. | Assuming Error Boundaries replace `try/catch` in event handlers causes silent uncaught drops. | 🔴 **CRITICAL:** Use local `try/catch` or `useMutation` error callbacks for event handlers. |
| **Hierarchical Granularity** | $\text{Global Boundary} \implies \text{Route Boundary} \implies \text{Feature Widget Boundary}$. | A monolithic single root boundary replaces the entire application with a massive crash screen. | 🟢 Isolate widgets (Analytics, Feeds, Chat) so sibling components remain fully interactive. |
| **Reset Keys (`resetKeys`)** | Automatically resets the boundary's error state when monitored props/routes change. | Clicking "Retry" on a deterministic `undefined.prop` bug creates an **Infinite Retry Loop**. | 🟢 Use `resetKeys={[route, entityId]}` to auto-recover when user navigates away. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: Event Handler Boundary Escapes & Infinite Retry Loops
> 
> #### Gotcha A: The Event Handler Error Boundary Escape Trap
> *"Why did an uncaught error in our button click handler crash Sentry without showing our Error Boundary fallback?"*  
> ```jsx
> // ❌ FATAL MISCONCEPTION: Error Boundaries catching event handler errors:
> function CheckoutButton({ cart }) {
>   const handlePay = () => {
>     // 💥 FATAL MISCONCEPTION: Error Boundaries DO NOT catch event handler errors!
>     // Event handlers run outside the React rendering commit phase in a native browser event tick.
>     // This error bubbles directly to window.onerror without triggering <ErrorBoundary />!
>     throw new Error("Payment Gateway Unavailable");
>   };
> 
>   return <button onClick={handlePay}>Submit Payment</button>;
> }
> 
> // Parent tree:
> <ErrorBoundary fallback={<PaymentErrorFallback />}>
>   <CheckoutButton />
> </ErrorBoundary>
> ```
> **Deep Architectural Explanation:**  
> React Error Boundaries only catch errors that occur during the **React Rendering Phase**, **Lifecycle Methods** (`componentDidMount`, `componentDidUpdate`), and **Constructors** of child components. Event handlers (`onClick`, `onChange`, `onSubmit`) do not execute during rendering; they execute in a detached browser event loop task. Consequently, React does not know how to associate the event handler exception with the component fiber tree.  
> **The Senior Standard:** Use local `try/catch` blocks inside event handlers to set local error state, or use React 18/19 `useErrorBoundary()` hooks to manually forward event exceptions into the nearest boundary:
> ```jsx
> // ✅ EXPLICIT EVENT HANDLER CATCHING:
> function CheckoutButtonSafe({ cart }) {
>   const [error, setError] = useState(null);
> 
>   const handlePay = async () => {
>     try {
>       await submitPayment(cart);
>     } catch (err) {
>       // 🟢 Explicitly updates component state to render domain error UI!
>       setError(err instanceof Error ? err.message : "Payment failed");
>     }
>   };
> 
>   if (error) return <div className="error-alert">{error}</div>;
>   return <button onClick={handlePay}>Submit Payment</button>;
> }
> ```
> 
> ---
> 
> #### Gotcha B: The Deterministic Infinite Retry Crash Loop
> *"Why did clicking 'Try Again' freeze the browser tab and send 500 error logs to Sentry in 2 seconds?"*  
> ```jsx
> // ❌ INFINITE RETRY LOOP ON DETERMINISTIC RENDER BUG:
> function FaultyWidget({ data }) {
>   // 💥 Deterministic bug: data.items is undefined for new users!
>   return <ul>{data.items.map(item => <li key={item.id}>{item.name}</li>)}</ul>;
> }
> 
> function App() {
>   return (
>     <ErrorBoundary fallback={({ resetErrorBoundary }) => (
>       // 💥 User clicks "Try Again" -> React resets hasError -> Rerenders <FaultyWidget /> ->
>       // Immediately throws TypeError again -> Sets hasError -> Loops forever!
>       <button onClick={resetErrorBoundary}>Try Again</button>
>     )}>
>       <FaultyWidget data={{}} />
>     </ErrorBoundary>
>   );
> }
> ```
> **Deep Architectural Explanation:**  
> When an Error Boundary resets its state (`hasError = false`), React immediately re-mounts and renders the child component tree. If the underlying error is a **deterministic programming bug** (e.g. accessing properties of `undefined`), the child will throw the exact same `TypeError` instantaneously on the new render pass. If the user repeatedly clicks "Try Again" or if the reset is tied to an automatic timer, the application enters an infinite crash-and-render loop, thrashing V8 and flooding telemetry backends.  
> **The Senior Standard:** Bind error boundary resets to **Input Changes (`resetKeys`)** so the boundary only resets when the user navigates, changes the entity ID, or updates the data payload:
> ```jsx
> // ✅ RESET-KEYS BOUNDARY (Only resets when entity ID changes):
> <ErrorBoundary
>   resetKeys={[selectedUserId]} // 🟢 Automatically resets when user selects a different record!
>   fallback={({ resetErrorBoundary }) => (
>     <div className="error-card">
>       <p>Unable to load user widget.</p>
>       <button onClick={() => { refetchUser(); resetErrorBoundary(); }}>
>         Refetch &amp; Try Again
>       </button>
>     </div>
>   )}
> >
>   <FaultyWidget userId={selectedUserId} />
> </ErrorBoundary>
> ```

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / Next.js / Vite Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Class-based `ErrorBoundary`, `react-error-boundary` package, Next.js `error.tsx` | Universal architectural requirement to prevent fatal white-screen-of-death crashes in production SPAs. |
| 🟡 **Moderate** | Used in ~45% of code | Resetting boundaries on route navigation, Sentry `componentStack` breadcrumbs | Critical for multi-tab enterprise dashboards, e-commerce checkouts, and micro-frontends. |
| 🔵 **Foundational / Engine** | Runtime internals | React Fiber unwinding, Concurrent Mode error recovery, `getDerivedStateFromError` purity | Required for Staff/Principal architecture reviews, design system infrastructure, and APM tools. |

---

## Core Concepts (20 Subtopics)

### Part 1 — What Is a React Error Boundary? `🟢 [Daily Driver]`

A specialized React component that intercepts JavaScript exceptions in its descendant component tree during rendering, preventing the entire DOM tree from being unmounted.

---

### Part 2 — The Fundamental Problem: White Screen of Death `🟢 [Daily Driver]`

In React 16+, an unhandled exception in any component render phase completely unmounts the root React DOM tree, leaving the user with an empty white screen.

---

### Part 3 — Why Error Boundaries Are Not Native `try/catch` `🟢 [Daily Driver]`

React manages asynchronous rendering across a virtual Fiber graph; native synchronous `try/catch` cannot wrap JSX elements declared outside the immediate execution frame.

---

### Part 4 — Anatomy of a Production Class-Based Error Boundary `🟢 [Daily Driver]`

```tsx
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo): void { logToSentry(error, info.componentStack); }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}
```

---

### Part 5 — `static getDerivedStateFromError`: Pure State Transition `🔵 [Foundational / Engine]`

Must remain a pure function with no side effects; returns the new state object to trigger fallback rendering in the Fiber work loop.

---

### Part 6 — `componentDidCatch`: Telemetry & `componentStack` `🟢 [Daily Driver]`

Executes during the commit phase; captures the complete React virtual DOM component hierarchy (`info.componentStack`) for APM logging.

---

### Part 7 — What Error Boundaries DO Catch `🟢 [Daily Driver]`

- Component `render()` body execution.
- Lifecycle methods (`componentDidMount`, `componentDidUpdate`, `componentWillUnmount`).
- Class component constructors and hook initialization bodies.

---

### Part 8 — What Error Boundaries DO NOT Catch `🔴 [Production-Critical]`

- Event handlers (`onClick`, `onSubmit`).
- Asynchronous callbacks (`setTimeout`, `requestAnimationFrame`).
- Server-Side Rendering (SSR) streaming execution.
- Errors thrown inside the Error Boundary component itself.

---

### Part 9 — Expected API Failure States vs Unexpected Render Crashes `🟢 [Daily Driver]`

- **Expected API Errors:** Model via state (`isLoading`, `isError`, `data`) and render conditional alerts.
- **Unexpected Render Crashes:** Let throw into the nearest `<ErrorBoundary />`.

---

### Part 10 — Hierarchical Placement: Global $\to$ Route $\to$ Feature `🟢 [Daily Driver]`

Nest boundaries at 3 strategic tiers to maximize application resilience and user containment.

---

### Part 11 — The Monolithic Root Boundary Antipattern `🔴 [Production-Critical]`

Wrapping only the `<App />` root causes a crash in a tiny footer link to destroy the user's active form inputs and navigation bar.

---

### Part 12 — The Over-Granular Antipattern `🟢 [Daily Driver]`

Wrapping every `<Button />` or `<Avatar />` in individual boundaries creates visual noise, layout fragmentation, and maintenance overhead.

---

### Part 13 — Designing Actionable Fallback UIs `🟢 [Daily Driver]`

Provide clear explanations, a "Try Again" retry button, a "Go Back" link, and a diagnostic reference ID for customer support.

---

### Part 14 — The Recovery Lifecycle: Resetting via `onReset` `🟢 [Daily Driver]`

Pass `resetErrorBoundary = () => this.setState({ hasError: false, error: null })` into the fallback UI so users can trigger re-mounting.

---

### Part 15 — Preventing Infinite Retry Loops `🔴 [Production-Critical]`

Distinguish transient operational crashes (which can be retried) from deterministic code bugs (which require code fixes).

---

### Part 16 — Resetting on Navigation: The `resetKeys` Pattern `🟢 [Daily Driver]`

Automatically clear error state when URL pathname or entity IDs change (`componentDidUpdate(prevProps)`).

---

### Part 17 — Catching Event Errors with `useErrorBoundary()` `🟢 [Daily Driver]`

Use library hooks like `const { showBoundary } = useErrorBoundary()` to explicitly forward asynchronous/event exceptions into the nearest boundary.

---

### Part 18 — Error Boundaries vs React Suspense `🟢 [Daily Driver]`

- **`<Suspense fallback={<Spinner />}>`:** Renders during pending async resource loading.
- **`<ErrorBoundary fallback={<ErrorUI />}>`:** Renders when a component throws an unexpected exception.

---

### Part 19 — Next.js App Router Error Handling (`error.tsx` & `global-error.tsx`) `🟢 [Daily Driver]`

Next.js App Router automatically wraps route segments in React Error Boundaries via `app/dashboard/error.tsx`.

---

### Part 20 — The 10-Point Senior Error Boundary & Resilience Audit Checklist `🟢 [Daily Driver]`

```text
1. Are feature widgets isolated with boundaries? ──► 2. Is getDerivedStateFromError kept pure?
3. Is componentDidCatch transmitting componentStack? ──► 4. Are event handlers protected with try/catch?
5. Are resetKeys configured on route boundaries? ──► 6. Is infinite retry loop prevented?
7. Is sensitive user data scrubbed from logs? ──► 8. Are expected API errors handled via state?
9. Is Suspense separated from Error Boundaries? ──► 10. Does fallback UI provide recovery actions?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Error Boundary Pattern | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Custom Class `ErrorBoundary`** | Design systems, custom telemetry integrations, zero-dependency vanilla React apps. | Quick prototyping where ready-made hooks and reset key logic are needed. | Requires maintaining class boilerplate and lifecycle methods. | `react-error-boundary`. |
| **`react-error-boundary` (NPM)** | Production enterprise React SPAs, functional components needing `useErrorBoundary()`. | Simple projects where a 20-line class boundary is sufficient. | External dependency addition ($<2\text{KB}$). | Custom Class Boundary. |
| **Next.js `error.tsx` Route Boundaries** | Next.js App Router applications, nested segment route isolation. | Client-only Vite/CRA single-page applications. | Bound to framework filesystem routing conventions. | Component-level boundaries. |
| **Conditional State (`if (isError)`)** | Expected business logic errors (404 Not Found, Form Validation, Empty Search). | Unexpected rendering crashes, broken object property accesses (`undefined.name`). | Does not catch synchronous rendering runtime exceptions. | React Error Boundaries. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Hierarchical Error Boundary Suite in TypeScript
```tsx
import React, { Component, ErrorInfo, ReactNode, useState } from 'react';

// ==========================================
// 1. ERROR BOUNDARY TYPES & CONTRACTS
// ==========================================
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  resetKeys?: unknown[];
  onReset?: () => void;
  onError?: (error: Error, info: ErrorInfo) => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ==========================================
// 2. PRODUCTION-GRADE REUSABLE ERROR BOUNDARY
// ==========================================
export class EnterpriseErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  // 🟢 1. Pure state computation for fallback rendering
  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  // 🟢 2. Side-effects & telemetry in commit phase
  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[EnterpriseErrorBoundary caught crash]:', error, errorInfo.componentStack);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  // 🟢 3. Automatic reset on resetKey change (e.g. route navigation)
  public componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys } = this.props;
    if (this.state.hasError && resetKeys && prevProps.resetKeys) {
      const hasKeyChanged = resetKeys.some((key, idx) => key !== prevProps.resetKeys?.[idx]);
      if (hasKeyChanged) {
        this.reset();
      }
    }
  }

  public reset = (): void => {
    if (this.props.onReset) this.props.onReset();
    this.setState({ hasError: false, error: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback">
          <div className="error-card">
            <h4>⚠️ {this.props.fallbackTitle ?? 'Component Unavailable'}</h4>
            <p className="error-message">
              {this.state.error?.message ?? 'An unexpected rendering failure occurred.'}
            </p>
            <div className="actions-row">
              <button type="button" onClick={this.reset} className="btn-retry">
                🔄 Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ==========================================
// 3. ENTERPRISE RESILIENT DASHBOARD
// ==========================================
export function EnterpriseResilientDashboard() {
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'SETTINGS'>('ANALYTICS');
  const [shouldCrash, setShouldCrash] = useState<boolean>(false);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h3>Enterprise Multi-Level Error Boundary Architecture</h3>
        <span className="badge">🛡️ Fault-Isolated Fibers</span>
      </header>

      <nav className="tab-navigation">
        <button
          type="button"
          onClick={() => { setShouldCrash(false); setActiveTab('ANALYTICS'); }}
          className={activeTab === 'ANALYTICS' ? 'active' : ''}
        >
          📊 Analytics Widget
        </button>
        <button
          type="button"
          onClick={() => { setShouldCrash(false); setActiveTab('SETTINGS'); }}
          className={activeTab === 'SETTINGS' ? 'active' : ''}
        >
          ⚙️ Settings Widget
        </button>
      </nav>

      <main className="dashboard-main-content">
        {activeTab === 'ANALYTICS' ? (
          // 🟢 Localized Feature Boundary with Reset Keys
          <EnterpriseErrorBoundary
            fallbackTitle="Analytics Widget Failed"
            resetKeys={[activeTab, shouldCrash]}
            onReset={() => setShouldCrash(false)}
          >
            <div className="widget-card">
              <h4>Live Telemetry Stream</h4>
              <p>Header and navigation survive even if this widget throws!</p>
              <button
                type="button"
                onClick={() => setShouldCrash(true)}
                className="btn-trigger-crash"
              >
                💥 Trigger Render Crash (undefined.prop)
              </button>
              {shouldCrash && <FaultyRenderComponent />}
            </div>
          </EnterpriseErrorBoundary>
        ) : (
          <div className="widget-card">
            <h4>Settings &amp; Configuration</h4>
            <p>Settings panel is operational and completely unaffected by Analytics crashes.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function FaultyRenderComponent(): JSX.Element {
  const uninitializedObject: { profile?: { name: string } } = {};
  // 💥 Throws TypeError during rendering
  return <div>User: {uninitializedObject.profile!.name}</div>;
}
```

---

## 🧠 Part 06 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: Event Handler Crash vs Error Boundary
```jsx
function BuggyButton() {
  const handleClick = () => { throw new Error("Button Crash"); };
  return <button onClick={handleClick}>Click Me</button>;
}
// Rendered inside: <ErrorBoundary><BuggyButton /></ErrorBoundary>
```
**Question:** When the user clicks the button, does the Error Boundary catch the error and render its fallback?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:** **No.**  
**Why:** Event handlers execute in a native DOM event task outside the React rendering loop. The Error Boundary only catches errors thrown during component rendering, lifecycle methods, and constructors.
</details>

---

### Prediction Challenge 2: `getDerivedStateFromError` vs `componentDidCatch`
```text
Task A: Updating component state to { hasError: true } to display fallback UI.
Task B: Transmitting the error and componentStack to Sentry or Datadog.
```
**Question:** Which lifecycle method owns Task A and which owns Task B?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:**  
- **Task A:** `static getDerivedStateFromError(error)` (Pure state computation during render).  
- **Task B:** `componentDidCatch(error, info)` (Side-effects and APM telemetry during commit).
</details>

---

### Prediction Challenge 3: Hierarchical Boundary Fallback Resolution
```jsx
<GlobalErrorBoundary fallback={<GlobalFallback />}>
  <Navbar />
  <FeatureErrorBoundary fallback={<WidgetFallback />}>
    <CrashingChart />
  </FeatureErrorBoundary>
</GlobalErrorBoundary>
```
**Question:** When `<CrashingChart />` crashes during render, which fallback is rendered and does `<Navbar />` survive?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:**  
- `<WidgetFallback />` is rendered.  
- **Yes, `<Navbar />` survives completely** because the nearest enclosing boundary (`<FeatureErrorBoundary />`) caught and contained the crash.
</details>

---

### Prediction Challenge 4: Automatic Boundary Reset on Navigation
```jsx
<ErrorBoundary resetKeys={[currentUserId]}>
  <UserProfile userId={currentUserId} />
</ErrorBoundary>
```
**Question:** If `<UserProfile userId="usr_1" />` crashes, what happens when the user clicks a link that changes `currentUserId` to `"usr_2"`?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:**  
The Error Boundary automatically resets its state (`hasError: false`) in `componentDidUpdate` because its `resetKeys` dependency changed, attempting a clean render for `"usr_2"` without requiring a full page refresh.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is a React Error Boundary and what problem does it solve?  
<details>
<summary><strong>Answer</strong></summary>
An Error Boundary is a React class component that catches JavaScript errors thrown anywhere in its child component tree during rendering, lifecycle methods, and constructors. It prevents the entire application from crashing into a blank white screen by displaying a fallback UI.
</details>

**Q2:** Name 3 things that React Error Boundaries do NOT catch.  
<details>
<summary><strong>Answer</strong></summary>
1. Event handlers (e.g. `onClick`, `onSubmit`).  
2. Asynchronous callbacks (e.g. `setTimeout`, `fetch` promise rejections).  
3. Server-Side Rendering (SSR) errors.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** What is the difference between `static getDerivedStateFromError` and `componentDidCatch`?  
<details>
<summary><strong>Answer</strong></summary>
- **`static getDerivedStateFromError(error)`:** Invoked during the "render" phase. It is a pure static function that returns the updated state (`{ hasError: true }`) to render the fallback UI. Side effects must not be executed here.  
- **`componentDidCatch(error, info)`:** Invoked during the "commit" phase. It receives the error and `info.componentStack`, making it the designated place to execute side effects like logging diagnostics to Sentry or Datadog.
</details>

**Q4:** Why is placing a single global Error Boundary at the root of an app considered an antipattern?  
<details>
<summary><strong>Answer</strong></summary>
A single root Error Boundary acts as an all-or-nothing switch: if any non-critical child component (e.g. a broken footer link or avatar widget) crashes during render, the entire application—including navigation, sidebars, and active form inputs—is unmounted and replaced with a full-page crash screen. Senior engineers use **granular boundaries** around independent feature modules so the rest of the application remains functional.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** How do you prevent Infinite Retry Crash Loops when implementing Error Boundary reset mechanisms?  
<details>
<summary><strong>Answer</strong></summary>
1. **Differentiate Bug Types:** Recognize that resetting cannot fix deterministic code bugs (e.g. `undefined.name`).  
2. **Implement `resetKeys`:** Track changing parameters (URL routes, record IDs, query filters); only reset the boundary when monitored inputs change.  
3. **Actionable Retries:** Ensure the "Try Again" button triggers a data refetch or state invalidation before calling `resetErrorBoundary()`.  
4. **Retry Thresholds:** Maintain a local retry counter and permanently display a "Contact Support" fallback if the component crashes 3 times consecutively within 5 seconds.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How does React's Fiber Reconciler unwind the component tree during an uncaught render phase error in Concurrent Mode, and how does `Suspense` integrate with Error Boundaries?  
<details>
<summary><strong>Answer</strong></summary>
1. **Fiber Tree Unwinding:** When a render phase throws an exception, React catches it in the work loop, marks the crashing Fiber with the `Incomplete` flag, and begins unwinding the Fiber return stack to find the nearest parent Fiber with `HostRoot` or `ClassComponent` implementing `getDerivedStateFromError`. React discards unfinished child work and schedules a new render pass for the boundary with the fallback UI.  
2. **Suspense vs Error Boundaries:** When a component suspends (throws a Promise), React yields to the nearest `<Suspense />` boundary to display a loading fallback. If that Promise rejects, React throws the rejection value into the nearest enclosing `<ErrorBoundary />`.  
3. **Staff Architecture:** Nest `<Suspense />` *inside* `<ErrorBoundary />` at every route segment (`<ErrorBoundary><Suspense><Page /></Suspense></ErrorBoundary>`) to cleanly decouple loading states from fatal rendering failures.
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone React Fiber Boundary Simulator

```js
// See runnable implementation in examples/06-react-error-boundaries-recovery.js
```

---

## Key Takeaways
1. **Boundaries Catch Render Exceptions:** Event handlers and async callbacks require local `try/catch`.
2. **Use Granular Boundaries:** Isolate independent feature widgets so sibling UI survives.
3. **Separate State from Side Effects:** Use `getDerivedStateFromError` for UI and `componentDidCatch` for Sentry.
4. **Prevent Infinite Loops with `resetKeys`:** Auto-reset boundaries on route navigation.
5. **Decouple Loading from Errors:** Pair `<Suspense>` inside `<ErrorBoundary>` for resilient UX.

---

[⬅️ Part 05: API Failure Handling & Retries](./05-api-failure-handling-retry-strategies.md) | [📚 KPI 25 Index](./README.md) | [Part 07: Structured Logging & Observability ➡️](./07-logging-observability-production-tracing.md)
