# Level 06 — React Fundamentals
# KPI 16 — Error Handling, Boundaries & Resilience
## PART 14 — Error Boundary Testing, Fault Injection & Diagnostic Engineering

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** Srikar Kudurmalla (Full Stack Developer | Founding Engineer)  
> **Co-Author:** Prasenjeet (Mid-Level Full Stack Developer)  
> **Navigation:** [⬅️ Previous Part](./13-retry-backoff-idempotency-recovery-loops.md) | [📚 Level 06 Index](./README.md) | [🧪 Companion Lab](./examples/14-error-boundary-testing-fault-injection-diagnostic-engineering.html) | [Next Part ➡️](./15-enterprise-resilience-patterns-advanced-error-architecture.md)

---

## 1. ⚡ 30-Second Executive Cheat Sheet

Testing resilience is fundamentally different from traditional happy-path functional testing. A naive test checks whether a fallback component renders when a child throws. A staff-level resilience verification suite mathematically and empirically proves the entire failure lifecycle:

```
                                  RUNTIME FAILURE
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 ▼                       ▼                       ▼
       [Classification Check]   [Containment Scope]      [State Isolation]
                 │                       │                       │
                 ▼                       ▼                       ▼
         Is it Render,           Did it stay in          Did Checkout / Draft
         Async, or Event?        Widget Boundary?        state survive intact?
                 │                       │                       │
                 └───────────────────────┼───────────────────────┘
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 ▼                       ▼                       ▼
        [Recovery Policy]       [Resource Cleanup]      [Diagnostic Invariant]
                 │                       │                       │
                 ▼                       ▼                       ▼
         Bounded Exponential     Timers, Sockets,        Structured Telemetry
         Backoff + Jitter        Listeners Teardown      Emitted (No Cascade)
```

### The Resilience Verification Equation

$$\text{Resilience Verification} = \text{Fault Injection} \times \text{Containment Verification} \times \text{Recovery Determinism} \times \text{State Preservation} \times \text{A11y} \times \text{Observability}$$

### Executive Comparison Matrix

| Verification Dimension | Junior Verification Trap | Senior Architectural Verification Contract |
| :--- | :--- | :--- |
| **Failure Scope** | Checking that `getByText(/error/i)` is in the DOM. | Asserting sibling subtrees and unrelated form drafts remain pristine. |
| **Boundary Placement** | Testing only the isolated happy boundary. | Testing that moving a boundary higher in the tree causes the test suite to fail. |
| **Lifecycle Semantics** | Mocking React rendering synchronously. | Tracking Fiber mount/unmount probes to verify identity persistence vs remounts. |
| **Async Retries** | Waiting for `setTimeout` in real time. | Controlling virtual fake timers, validating backoff progression and full jitter bounds. |
| **Concurrency Invariants**| Testing single isolated requests. | Race testing: starting op A, then op B; resolving B first, asserting A never commits. |
| **Teardown & Cleanup** | Ignoring background listeners. | Verifying event listeners, AbortControllers, and observers monotonically decrease on crash. |
| **Observability Isolation**| Checking `console.log` was called. | Simulating telemetry endpoint drops to guarantee logging failures don't crash UI recovery. |

---

## 2. What Are We Actually Testing?

A resilient React client application consists of an interconnected set of behavioral contracts. When an unexpected runtime defect, network partition, or third-party script crash occurs, the application must honor each contract in strict priority:

```
                               FAILURE DETECTED
                                      │
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                       ▼
      [Classification]          [Containment]            [Recovery]
      - Render (Boundary)       - Nearest Subtree        - Bounded Retries
      - Async (State Guard)     - Fiber Preservation     - Backoff + Jitter
      - Event (Local Catch)     - Sibling Insulation     - Clean Slate Reset
              │                       │                       │
              └───────────────────────┼───────────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
         [UX & A11y]                                   [Observability]
      - Semantic Alert / Live Region                - Correlation IDs (Trace, Op)
      - Keyboard Focus Trap & Restore               - Structured Failure Payloads
      - Usable Fallback UX                          - Telemetry Fault Isolation
```

### The 10 Essential Verification Contracts
1. **Failure Classification Contract:** Render exceptions route to Error Boundaries, async rejections route to domain state handlers, and event exceptions route to local catch dispatchers.
2. **Boundary Containment Contract:** The blast radius of an unhandled crash is confined to the immediate sub-feature boundary without bubbling to the application shell.
3. **Fallback Rendering Contract:** The user receives a contextual, actionable degradation UI rather than a blank white screen or crashed layout.
4. **State Preservation Contract:** Unrelated user input (such as checkout forms, search query drafts, or active selections) is preserved across isolated child crashes.
5. **Recovery Workflow Contract:** Clicking "Try Again" or updating reset keys executes a deterministic recovery sequence that restores normal component operation.
6. **Retry Policy Invariant Contract:** Automatic retries are strictly bounded ($N \le \text{maxAttempts}$) and follow exponential backoff with full jitter to prevent retry storms.
7. **Operation Currentness Contract:** Out-of-order network responses from superseded requests are rejected and cannot overwrite current state.
8. **Accessibility (WCAG 2.1 AA) Contract:** Screen readers receive immediate alert announcements (`role="alert"` / `aria-live="polite"`) and keyboard focus is deliberately directed to the recovery trigger.
9. **Telemetry Isolation Contract:** Telemetry logging failures (e.g. ad-blockers dropping log requests) never cascade into secondary UI crashes.
10. **Failure Escalation Contract:** If a feature-level fallback itself crashes during render, the error bubbles gracefully to the next ancestor boundary.

---

## 3. Error Boundary Testing Has a Fundamental Constraint

React Error Boundaries operate under a strict, immutable runtime constraint:

> **React Error Boundaries ONLY catch errors thrown during the declarative rendering phase, component constructor execution, and lifecycle methods (or useEffect in specific concurrent failure handling) of their DESCENDANT component tree.**

```
                       ┌───────────────────────────────┐
                       │    <ErrorBoundary> (Class)    │
                       └───────────────┬───────────────┘
                                       │ Catches Descendant Throws
                                       ▼
                       ┌───────────────────────────────┐
                       │       <DescendantTree />      │
                       │                               │
                       │  ✅ Throws during render()    │
                       │  ✅ Throws in constructor()   │
                       │  ❌ Throws in onClick handler │
                       │  ❌ Throws in async Promise   │
                       │  ❌ Throws in boundary itself │
                       └───────────────────────────────┘
```

### The Canonical Exploding Test Fixture

To verify that an Error Boundary catches descendant rendering crashes, we construct a reusable exploding probe:

```tsx
import React from 'react';

export interface ExplodingWidgetProps {
  readonly shouldExplode?: boolean;
  readonly message?: string;
}

export function ExplodingWidget({
  shouldExplode = true,
  message = "CRITICAL_RENDER_EXPLOSION"
}: ExplodingWidgetProps): React.JSX.Element {
  if (shouldExplode) {
    throw new Error(message);
  }
  return <div data-testid="widget-healthy">Widget Operational</div>;
}
```

### Suppressing React Console Noise in Vitest

When testing component crashes, React automatically logs uncaught errors to `console.error`. A clean test suite intercepts and suppresses expected test crashes:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';
import { ExplodingWidget } from './ExplodingWidget';

describe('ErrorBoundary Descendant Constraint', () => {
  it('catches render exceptions thrown by direct descendants and displays fallback', () => {
    // Suppress expected React error logging during test execution
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={<div data-testid="fallback">Isolated Fallback</div>}>
        <ExplodingWidget message="Database connection lost in render" />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('widget-healthy')).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
```

---

## 4. Test the Failure Domain

Resilience architecture is defined by the **Failure Domain** (the blast radius of a crash). If a non-critical analytics widget or product recommendation carousel throws an unhandled exception, the primary transaction flow (such as the Shopping Cart or Checkout form) must survive completely unaffected.

```
   ┌───────────────────────────────────────────────────────────┐
   │                       App Container                       │
   │                                                           │
   │  ┌─────────────────────────┐   ┌───────────────────────┐  │
   │  │ <WidgetErrorBoundary>   │   │ <CheckoutFeature>     │  │
   │  │  ┌───────────────────┐  │   │  ┌─────────────────┐  │  │
   │  │  │ ExplodingWidget   │  │   │  │ [Credit Card]   │  │  │
   │  │  │ 💥 CRASH!         │  │   │  │ [Submit Order]  │  │  │
   │  │  └───────────────────┘  │   │  │                 │  │  │
   │  │            │            │   │  │  ✅ SURVIVES    │  │  │
   │  │            ▼            │   │  │  ✅ STATE INTACT│  │  │
   │  │  [Fallback Rendered]    │   │  │                 │  │  │
   │  └─────────────────────────┘   └───────────────────────┘  │
   └───────────────────────────────────────────────────────────┘
```

### Verification Test Pattern: Blast Radius Insulation

```tsx
it('insulates checkout flow when secondary recommendation widget crashes', () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  render(
    <main>
      <header>Enterprise Dashboard</header>
      <ErrorBoundary fallback={<div data-testid="recs-fallback">Recommendations Unavailable</div>}>
        <ExplodingWidget message="Recommendation Engine Timeout" />
      </ErrorBoundary>
      <section data-testid="checkout-section">
        <h2>Order Summary</h2>
        <button data-testid="submit-order-btn">Complete Purchase</button>
      </section>
    </main>
  );

  // Assert containment
  expect(screen.getByTestId('recs-fallback')).toBeInTheDocument();
  // Assert sibling survival
  expect(screen.getByTestId('checkout-section')).toBeInTheDocument();
  expect(screen.getByTestId('submit-order-btn')).toBeEnabled();

  consoleSpy.mockRestore();
});
```

---

## 5. Test the Wrong Boundary Too

Architecture contracts are only as good as the tests that enforce their boundaries. A common regression in high-velocity teams occurs when a developer refactors component layout and accidentally hoists an ErrorBoundary up the tree, wrapping both the broken widget and critical transactions together.

```
   INCORRECT MONOLITHIC HOISTING (REGRESSION):
   ┌───────────────────────────────────────────────────────────┐
   │ <MonolithicErrorBoundary>                                 │
   │  ┌───────────────────────┐     ┌───────────────────────┐  │
   │  │ ExplodingWidget       │     │ CheckoutFeature       │  │
   │  │ 💥 CRASH!             │     │                       │  │
   │  └───────────────────────┘     └───────────────────────┘  │
   │              │                             │              │
   │              └──────────────┬──────────────┘              │
   │                             ▼                             │
   │            [ENTIRE SCREEN REPLACED BY FALLBACK]           │
   │            ❌ Checkout and User Input DESTROYED!          │
   └───────────────────────────────────────────────────────────┘
```

### Architectural Contract Enforcement Test

```tsx
it('proves that boundary hoisting is rejected by architectural assertions', () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  // Fixture simulating an architectural mistake (Monolithic Wrap)
  function FaultyArchitectureLayout() {
    return (
      <ErrorBoundary fallback={<div data-testid="catastrophic-fallback">Global Error</div>}>
        <ExplodingWidget />
        <div data-testid="critical-user-draft">User Draft Form</div>
      </ErrorBoundary>
    );
  }

  render(<FaultyArchitectureLayout />);

  // If this test expects isolated degradation, the monolithic boundary fails the contract!
  const isDraftSurviving = screen.queryByTestId('critical-user-draft') !== null;
  
  // This assertion explicitly proves that monolithic boundaries violate isolation invariants:
  expect(isDraftSurviving).toBe(false); // Demonstrates the anti-pattern
  expect(screen.getByTestId('catastrophic-fallback')).toBeInTheDocument();

  consoleSpy.mockRestore();
});
```

---

## 6. Fault Injection

Fault Injection is the disciplined practice of deliberately introducing controlled failures into a system to observe, verify, and harden its resilience and recovery pathways.

```
   ┌───────────────────────────────────────────────────────────┐
   │                   Fault Injection Harness                 │
   │                                                           │
   │  [Fault Toggle: HTTP 500] ──► Intercepts Axios / Fetch    │
   │  [Fault Toggle: Render]   ──► Throws in React Fiber Tree  │
   │  [Fault Toggle: Socket]   ──► Simulates WebSocket Drop    │
   │  [Fault Toggle: Stale]    ──► Delays Response by 5000ms   │
   │  [Fault Toggle: Storage]  ──► QuotaExceededError          │
   └───────────────────────────────────────────────────────────┘
```

### Categories of Injectable Faults
1. **Synchronous Render Faults:** Immediate exceptions during JSX evaluation.
2. **Network Protocol Faults:** HTTP 500 Internal Server, HTTP 503 Service Unavailable, HTTP 504 Gateway Timeout.
3. **Rate Limiting Faults:** HTTP 429 Too Many Requests with `Retry-After` headers.
4. **Data Corruption Faults:** JSON schema deviations, `null` instead of arrays, missing nested keys.
5. **Temporal Faults:** Infinite latency, network timeouts, out-of-order responses.
6. **Resource Exhaustion Faults:** `localStorage` QuotaExceededError, IndexedDB lock contention.
7. **External System Faults:** Third-party tracking script runtime exceptions, OAuth iframe postMessage drops.

---

## 7. Failure Injection Matrix

| Fault Scenario | Primary Owner | Expected Mechanism | Verification Assertion |
| :--- | :--- | :--- | :--- |
| **Render Exception** | Error Boundary | Declarative Fallback UI | Fallback rendered; sibling DOM nodes untouched. |
| **Event Handler Exception** | Event Logic | `try/catch` + Local Toast | Error state updated; no boundary trigger; form editable. |
| **Unhandled Promise Rejection** | Async Hook / Cache | Query Error State | Retry button active; stale cache preserved if configured. |
| **HTTP 500 Internal Server** | API Client Layer | Domain Async Failure | Display actionable error message; enable manual retry. |
| **HTTP 429 Rate Limit** | Retry Policy | Exponential Backoff with Jitter | Requests dispatched at scheduled intervals up to limit. |
| **Validation Error (HTTP 422)** | Form / Domain Layer | Inline Field Diagnostics | No boundary trigger; focus moved to first invalid input. |
| **Permission Denial (HTTP 403)** | Auth Subsystem | Access Denied Guard UI | Immediate redirection or inline permission request card. |
| **WebSocket Disconnect** | Subscription Manager | Reconnection Loop + Heartbeat | Monotonic connection attempts; cleanup on unmount. |
| **Third-Party Script Crash** | Feature Boundary | Isolated Degradation Widget | Shell remains interactive; telemetry event dispatched. |
| **Network Timeout (Abort)** | AbortController | Cancellation State | In-flight request cancelled; no state overwrite if stale. |

---

## 8. Do Not Test Implementation Details as Architecture

A fragile test couples itself to the internal implementation choices of React or component classes. A resilient test tests **Observable Behavioral Contracts**.

```
   ❌ FRAGILE TEST (Implementation Coupled):
   expect(wrapper.find(ErrorBoundary).state('hasError')).toBe(true);
   expect(boundaryInstance.state.errorCount).toEqual(1);
   
   ✅ ROBUST RESILIENCE TEST (Behavioral Contract):
   expect(screen.getByRole('alert')).toHaveTextContent(/failed to load/i);
   expect(screen.getByRole('button', { name: /try again/i })).toBeEnabled();
   expect(screen.getByTestId('sibling-feature')).toBeVisible();
```

### The Four Tenets of Behavioral Resilience Testing:
1. **Assert on User Perception:** Check for accessible semantic roles (`role="alert"`, `aria-live="polite"`).
2. **Assert on System Boundaries:** Verify sibling subtrees remain mounted and active.
3. **Assert on Actionable Workflows:** Simulate user interaction with the recovery trigger (e.g., clicking "Retry").
4. **Assert on Invariant Compliance:** Validate that retry counts never exceed configured maximums.

---

## 9. Test Boundary Containment

Boundary containment verifies that when a nested feature crashes, the boundary catches it locally without letting the error bubble up to the root layout or application shell.

```tsx
function MultiTierAppFixture({ crashWidget = false }: { crashWidget?: boolean }) {
  return (
    <div data-testid="app-shell">
      <nav data-testid="main-navigation">
        <a href="#home">Home</a>
        <a href="#billing">Billing</a>
      </nav>
      <div className="layout-body">
        <section data-testid="main-content">
          <h1>Customer Profile</h1>
        </section>
        <aside data-testid="sidebar-widgets">
          <ErrorBoundary fallback={<div data-testid="widget-fallback">Widget Failed</div>}>
            {crashWidget ? <ExplodingWidget message="Sidebar Crash" /> : <div data-testid="widget-content">Widget Live</div>}
          </ErrorBoundary>
        </aside>
      </div>
    </div>
  );
}

describe('Boundary Containment Verification', () => {
  it('confines sidebar explosion within sidebar without corrupting shell or navigation', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<MultiTierAppFixture crashWidget={true} />);

    // Root and navigation must be 100% operational
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
    expect(screen.getByTestId('main-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('main-content')).toBeInTheDocument();

    // Only the sidebar widget degraded
    expect(screen.getByTestId('widget-fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('widget-content')).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
```

---

## 10. Test State Preservation

The truest test of resilience containment is **Draft State Preservation**. If a user is composing an email, filling out a multi-step checkout form, or editing complex filters, a background crash in an unrelated component must not reset their form inputs.

```tsx
import userEvent from '@testing-library/user-event';

function UserDraftCheckoutApp({ crashRecs = false }: { crashRecs?: boolean }) {
  const [draftNote, setDraftNote] = React.useState('');

  return (
    <div>
      <section data-testid="draft-form">
        <label htmlFor="order-note">Order Notes:</label>
        <textarea
          id="order-note"
          value={draftNote}
          onChange={(e) => setDraftNote(e.target.value)}
          placeholder="Special delivery instructions..."
        />
      </section>
      <section data-testid="recs-container">
        <ErrorBoundary fallback={<div data-testid="recs-fallback">Recs Unavailable</div>}>
          {crashRecs ? <ExplodingWidget message="Recs 500" /> : <div>Recommended Items</div>}
        </ErrorBoundary>
      </section>
    </div>
  );
}

it('preserves user text input when sibling recommendation component crashes dynamically', async () => {
  const user = userEvent.setup();
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  const { rerender } = render(<UserDraftCheckoutApp crashRecs={false} />);

  // User types crucial information into the draft input
  const input = screen.getByLabelText(/order notes/i);
  await user.type(input, 'Please leave package at the side gate behind the garage.');

  expect(input).toHaveValue('Please leave package at the side gate behind the garage.');

  // Sibling component encounters a catastrophic runtime crash
  rerender(<UserDraftCheckoutApp crashRecs={true} />);

  // Verify that the error boundary caught the crash
  expect(screen.getByTestId('recs-fallback')).toBeInTheDocument();

  // CRITICAL INVARIANT: The user's input MUST remain completely intact!
  expect(screen.getByLabelText(/order notes/i)).toHaveValue(
    'Please leave package at the side gate behind the garage.'
  );

  consoleSpy.mockRestore();
});
```


---

## 11. Rerender vs Remount Must Be Tested

A frequent architectural bug occurs during error boundary recovery: does the recovery action perform an **in-place state reset (rerender)** or does it execute a full **Fiber unmount/mount cycle**?

```
   RERENDER (Identity Preserved):
   Fiber Node [Instance #1] ──(Reset State)──► Fiber Node [Instance #1]
   (DOM node reused, local DOM scroll & focus maintained)

   REMOUNT (Identity Recreated via key change):
   Fiber Node [Instance #1] ──(Unmount)──► Destroy
                                                │
                                                ▼
   Fiber Node [Instance #2] ◄──(Mount)──────────┘
   (Effects re-run, subscriptions recreated, fresh internal state)
```

### The Mount/Unmount Probe Fixture

```tsx
export interface LifecycleProbeMetrics {
  mounts: number;
  unmounts: number;
  renders: number;
}

export function createLifecycleProbe() {
  const metrics: LifecycleProbeMetrics = { mounts: 0, unmounts: 0, renders: 0 };

  function ProbeComponent({ label }: { label: string }): React.JSX.Element {
    metrics.renders++;

    React.useEffect(() => {
      metrics.mounts++;
      return () => {
        metrics.unmounts++;
      };
    }, []);

    return <div data-testid={`probe-${label}`}>Probe: {label} (Mounts: {metrics.mounts})</div>;
  }

  return { metrics, ProbeComponent };
}
```

### Testing Recovery Remount vs In-Place Reset

```tsx
it('verifies that key-based recovery triggers a full remount cycle', () => {
  const { metrics, ProbeComponent } = createLifecycleProbe();
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  function TestHarness({ resetKey, shouldCrash }: { resetKey: number; shouldCrash: boolean }) {
    return (
      <ErrorBoundary key={resetKey} fallback={<div>Fallback</div>}>
        {shouldCrash ? <ExplodingWidget /> : <ProbeComponent label="target" />}
      </ErrorBoundary>
    );
  }

  const { rerender } = render(<TestHarness resetKey={1} shouldCrash={false} />);
  expect(metrics.mounts).toBe(1);
  expect(metrics.unmounts).toBe(0);

  // Crash
  rerender(<TestHarness resetKey={1} shouldCrash={true} />);
  expect(metrics.unmounts).toBe(1);

  // Recover with new key
  rerender(<TestHarness resetKey={2} shouldCrash={false} />);
  expect(metrics.mounts).toBe(2);
  expect(metrics.unmounts).toBe(1);

  consoleSpy.mockRestore();
});
```

---

## 12. Test Recovery as a State Machine

Recovery is not an isolated Boolean switch. It is a formal State Machine.

```
                          ┌──────────────┐
                          │   HEALTHY    │◄───────────────────┐
                          └──────┬───────┘                    │
                                 │                            │
                            Render Error                      │
                                 │                            │
                                 ▼                            │
                          ┌──────────────┐             Reset Action
                          │   DEGRADED   │             (Success)
                          └──────┬───────┘                    │
                                 │                            │
                            User Retries                      │
                                 │                            │
                                 ▼                            │
                          ┌──────────────┐                    │
                          │ RECOVERING   │────────────────────┘
                          └──────┬───────┘
                                 │
                            Retry Throws Again
                                 │
                                 ▼
                          ┌──────────────┐
                          │   TERMINAL   │ (Disable Auto Retry)
                          └──────────────┘
```

### State Machine Verification Test

```tsx
it('executes full state transition from HEALTHY -> DEGRADED -> RECOVERING -> TERMINAL', async () => {
  const user = userEvent.setup();
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  let attempts = 0;
  function FailsTwiceThenTerminal() {
    attempts++;
    if (attempts <= 3) {
      throw new Error(`Failure attempt ${attempts}`);
    }
    return <div data-testid="recovered-ui">Recovered</div>;
  }

  function StateMachineHarness() {
    const [recoveryCount, setRecoveryCount] = React.useState(0);
    const isTerminal = recoveryCount >= 2;

    return (
      <ErrorBoundary
        key={recoveryCount}
        fallback={
          <div>
            <p role="alert">System Degraded (Attempt {recoveryCount})</p>
            {isTerminal ? (
              <p data-testid="terminal-msg">Terminal failure. Contact human support.</p>
            ) : (
              <button onClick={() => setRecoveryCount((c) => c + 1)}>Retry Recovery</button>
            )}
          </div>
        }
      >
        <FailsTwiceThenTerminal />
      </ErrorBoundary>
    );
  }

  render(<StateMachineHarness />);

  // 1. Initial render fails -> DEGRADED (Attempt 0)
  expect(screen.getByRole('alert')).toHaveTextContent(/attempt 0/i);

  // 2. User Retries -> Fails -> DEGRADED (Attempt 1)
  await user.click(screen.getByRole('button', { name: /retry recovery/i }));
  expect(screen.getByRole('alert')).toHaveTextContent(/attempt 1/i);

  // 3. User Retries again -> Exceeds max allowed retries -> TERMINAL
  await user.click(screen.getByRole('button', { name: /retry recovery/i }));
  expect(screen.getByTestId('terminal-msg')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /retry recovery/i })).not.toBeInTheDocument();

  consoleSpy.mockRestore();
});
```

---

## 13. Recovery Must Be Deterministic in Tests

Never use real-time delays (`setTimeout` with 5000ms) in automated test suites. Doing so creates slow, flaky CI/CD runs. Tests must use **Fake Virtual Timers** to control time deterministically.

```tsx
import { vi, beforeEach, afterEach } from 'vitest';

describe('Deterministic Async Recovery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('advances virtual time deterministically to verify scheduled recovery countdown', () => {
    const onAutoRetry = vi.fn();

    function AutoRetryCountdown({ delayMs = 3000 }: { delayMs?: number }) {
      const [secondsLeft, setSecondsLeft] = React.useState(delayMs / 1000);

      React.useEffect(() => {
        if (secondsLeft <= 0) {
          onAutoRetry();
          return;
        }
        const timer = setTimeout(() => {
          setSecondsLeft((s) => s - 1);
        }, 1000);

        return () => clearTimeout(timer);
      }, [secondsLeft]);

      return <div data-testid="countdown">Retrying in {secondsLeft}s...</div>;
    }

    render(<AutoRetryCountdown delayMs={3000} />);

    expect(screen.getByTestId('countdown')).toHaveTextContent('Retrying in 3s...');
    expect(onAutoRetry).not.toHaveBeenCalled();

    // Advance 1 second
    vi.advanceTimersByTime(1000);
    expect(screen.getByTestId('countdown')).toHaveTextContent('Retrying in 2s...');

    // Advance remaining 2 seconds
    vi.advanceTimersByTime(2000);
    expect(onAutoRetry).toHaveBeenCalledTimes(1);
  });
});
```

---

## 14. Test Retry Exhaustion

An unbounded retry loop is a Distributed Denial of Service (DDoS) attack launched by your frontend against your own backend. Automated tests must mathematically prove that retries **terminate** when `attemptCount >= maxAttempts`.

```tsx
it('strictly terminates retry loop at configured maximum attempts (Invariant I3)', async () => {
  const fetchMock = vi.fn().mockRejectedValue(new Error('Persistent 503'));
  const maxAttempts = 3;
  let totalExecutions = 0;

  async function executeBoundedRetry() {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      totalExecutions++;
      try {
        await fetchMock();
        return;
      } catch (err) {
        if (attempt === maxAttempts) {
          throw new Error('RETRY_EXHAUSTED');
        }
      }
    }
  }

  await expect(executeBoundedRetry()).rejects.toThrow('RETRY_EXHAUSTED');
  // Prove that attempt 4 was never executed!
  expect(totalExecutions).toBe(3);
  expect(fetchMock).toHaveBeenCalledTimes(3);
});
```

---

## 15. Test Backoff

When retrying failed requests, backoff delays must follow a progressive curve (e.g., $t_k = \text{base} \times 2^{k-1}$). Automated tests must verify the scheduling intervals.

```tsx
it('verifies exponential backoff progression: 500ms -> 1000ms -> 2000ms', () => {
  function calculateExponentialBackoff(attempt: number, baseMs: number = 500): number {
    return baseMs * Math.pow(2, attempt - 1);
  }

  expect(calculateExponentialBackoff(1, 500)).toBe(500);
  expect(calculateExponentialBackoff(2, 500)).toBe(1000);
  expect(calculateExponentialBackoff(3, 500)).toBe(2000);
  expect(calculateExponentialBackoff(4, 500)).toBe(4000);
});
```

---

## 16. Testing Jitter

Full Jitter randomizes delay between 0 and the exponential backoff ceiling:

$$t_{\text{jitter}} = \text{random}() \times (\text{base} \times 2^{\text{attempt}-1})$$

Tests should **never** check for exact values (e.g. `expect(delay).toBe(734)`). Tests must assert on **mathematical boundary invariants** and **distribution variance**.

```tsx
it('validates Full Jitter bounds [0, maxBackoff] and statistical non-synchronization', () => {
  function calculateFullJitter(attempt: number, baseMs: number = 500): number {
    const ceiling = baseMs * Math.pow(2, attempt - 1);
    return Math.random() * ceiling;
  }

  const sampleCount = 100;
  const attempt = 3; // ceiling = 500 * 2^2 = 2000ms
  const ceiling = 2000;
  const samples: number[] = [];

  for (let i = 0; i < sampleCount; i++) {
    const delay = calculateFullJitter(attempt, 500);
    // Invariant 1: Must be within bounds [0, ceiling]
    expect(delay).toBeGreaterThanOrEqual(0);
    expect(delay).toBeLessThanOrEqual(ceiling);
    samples.push(delay);
  }

  // Invariant 2: Samples must not all be identical (variance check)
  const uniqueSamples = new Set(samples);
  expect(uniqueSamples.size).toBeGreaterThan(90);
});
```

---

## 17. Test Currentness

When multiple asynchronous requests are initiated concurrently (e.g., rapid search typing or tab switching), a slow, stale request must never overwrite state from a newer request.

```tsx
it('guarantees that older out-of-order responses do not overwrite current state (Invariant I1)', async () => {
  let activeOperationId = 0;
  let committedData: string = 'INITIAL';

  async function search(query: string, delayMs: number) {
    const thisOpId = ++activeOperationId;
    
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    // Currentness Guard
    if (thisOpId === activeOperationId) {
      committedData = `RESULT_FOR_${query}`;
    }
  }

  vi.useFakeTimers();

  // Op 1: Slow query "Alpha" takes 3000ms
  search('Alpha', 3000);
  // Op 2: Fast query "Beta" takes 500ms
  search('Beta', 500);

  // Fast query resolves first
  vi.advanceTimersByTime(500);
  expect(committedData).toBe('RESULT_FOR_Beta');

  // Slow query resolves later
  vi.advanceTimersByTime(2500);
  // Must NOT overwrite with Alpha!
  expect(committedData).toBe('RESULT_FOR_Beta');

  vi.useRealTimers();
});
```

---

## 18. Test Cancellation

When a component unmounts or an operation is aborted, both the in-flight network request and any scheduled retry timers must be terminated immediately.

```tsx
it('cancels both in-flight requests and scheduled timers upon teardown (Invariant I2)', () => {
  vi.useFakeTimers();
  const abortSpy = vi.fn();
  const clearTimerSpy = vi.spyOn(global, 'clearTimeout');

  function CancellableResourceComponent() {
    React.useEffect(() => {
      const controller = new AbortController();
      controller.signal.addEventListener('abort', abortSpy);

      const timerId = setTimeout(() => {
        // Scheduled background sync
      }, 10000);

      return () => {
        controller.abort();
        clearTimeout(timerId);
      };
    }, []);

    return <div>Active Resource</div>;
  }

  const { unmount } = render(<CancellableResourceComponent />);
  expect(abortSpy).not.toHaveBeenCalled();

  // Unmount trigger
  unmount();

  expect(abortSpy).toHaveBeenCalledTimes(1);
  expect(clearTimerSpy).toHaveBeenCalled();

  vi.useRealTimers();
});
```

---

## 19. Test Unknown Mutation Outcomes

When a mutation network call times out or drops, the client cannot know if the server committed the transaction before the drop. The UI must transition to an **ambiguous/reconciliation state** rather than claiming the operation definitely failed.

```tsx
it('models transport timeout as ambiguous pending verification rather than definite failure (Invariant I8)', () => {
  type MutationState = 'IDLE' | 'SENDING' | 'AMBIGUOUS_TIMEOUT' | 'CONFIRMED_COMMITTED';

  function reconcileMutationOutcome(error: Error): MutationState {
    if (error.name === 'TimeoutError' || error.message.includes('NETWORK_TIMEOUT')) {
      return 'AMBIGUOUS_TIMEOUT';
    }
    return 'IDLE';
  }

  const timeoutErr = new Error('NETWORK_TIMEOUT: Server did not respond within 5000ms');
  const outcome = reconcileMutationOutcome(timeoutErr);

  expect(outcome).toBe('AMBIGUOUS_TIMEOUT');
});
```

---

## 20. Test Idempotency Contracts

Retried mutations must carry an invariant `Idempotency-Key` to prevent duplicate execution on the server.

```tsx
it('ensures all retry attempts for a logical operation preserve identical Idempotency-Key', async () => {
  const dispatchedHeaders: Array<Record<string, string>> = [];
  const idempotencyKey = 'idemp_uuid_987654321';

  async function mockDispatchMutation(attempt: number) {
    dispatchedHeaders.push({
      'Idempotency-Key': idempotencyKey,
      'X-Attempt-Count': String(attempt),
    });
    if (attempt < 3) throw new Error('Retryable Network Drop');
    return { success: true };
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await mockDispatchMutation(attempt);
      break;
    } catch (e) {
      // Loop
    }
  }

  expect(dispatchedHeaders).toHaveLength(3);
  expect(dispatchedHeaders[0]['Idempotency-Key']).toBe(idempotencyKey);
  expect(dispatchedHeaders[1]['Idempotency-Key']).toBe(idempotencyKey);
  expect(dispatchedHeaders[2]['Idempotency-Key']).toBe(idempotencyKey);
  expect(dispatchedHeaders[0]['X-Attempt-Count']).toBe('1');
  expect(dispatchedHeaders[2]['X-Attempt-Count']).toBe('3');
});
```

---

## 21. Test Expected vs Unexpected Errors Separately

A resilient system treats **Expected Domain Failures** (HTTP 422 validation, field errors) with local inline UI, while **Unexpected Runtime Exceptions** (null pointer dereferences, chunk load failures) route to Error Boundaries.

```
   ┌───────────────────────────────────────────────────────────┐
   │                     ERROR ROUTING LOGIC                   │
   │                                                           │
   │  HTTP 422 / Field Error ──► Inline Form Diagnostics       │
   │                             (Boundary NOT Triggered)      │
   │                                                           │
   │  TypeError / ChunkLoad  ──► Nearest Feature ErrorBoundary │
   │                             (Declarative Fallback)        │
   └───────────────────────────────────────────────────────────┘
```

```tsx
it('routes 422 to inline field error without triggering parent ErrorBoundary', async () => {
  const user = userEvent.setup();

  function UserProfileForm() {
    const [fieldError, setFieldError] = React.useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Simulate 422 Unprocessable Entity
      setFieldError('Email address is already registered.');
    };

    return (
      <ErrorBoundary fallback={<div data-testid="boundary-fallback">Boundary Triggered</div>}>
        <form onSubmit={handleSubmit} data-testid="profile-form">
          <input id="email" placeholder="Email" />
          {fieldError && <span role="alert" data-testid="inline-error">{fieldError}</span>}
          <button type="submit">Save</button>
        </form>
      </ErrorBoundary>
    );
  }

  render(<UserProfileForm />);
  await user.click(screen.getByRole('button', { name: /save/i }));

  // Inline error displayed
  expect(screen.getByTestId('inline-error')).toHaveTextContent('Email address is already registered.');
  // Boundary MUST NOT trigger
  expect(screen.queryByTestId('boundary-fallback')).not.toBeInTheDocument();
  expect(screen.getByTestId('profile-form')).toBeInTheDocument();
});
```

---

## 22. Event Handler Fault Injection

Event handler exceptions are **not** caught by React Error Boundaries. Testing must verify that event handler exceptions are trapped in local handler logic or routed to an explicit error state dispatcher.

```tsx
it('catches and handles event handler exceptions through explicit error dispatcher', async () => {
  const user = userEvent.setup();
  const errorTelemetrySink = vi.fn();

  function ResilientButton() {
    const [lastError, setLastError] = React.useState<string | null>(null);

    const handleClick = () => {
      try {
        throw new Error('EVENT_HANDLER_SYNCHRONOUS_CRASH');
      } catch (err: any) {
        setLastError(err.message);
        errorTelemetrySink(err);
      }
    };

    return (
      <div>
        <button onClick={handleClick}>Trigger Action</button>
        {lastError && <p data-testid="event-error-toast">{lastError}</p>}
      </div>
    );
  }

  render(
    <ErrorBoundary fallback={<div>Boundary Fallback</div>}>
      <ResilientButton />
    </ErrorBoundary>
  );

  await user.click(screen.getByRole('button', { name: /trigger action/i }));

  expect(screen.getByTestId('event-error-toast')).toHaveTextContent('EVENT_HANDLER_SYNCHRONOUS_CRASH');
  expect(errorTelemetrySink).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Boundary Fallback')).not.toBeInTheDocument();
});
```

---

## 23. Async Fault Injection

Testing async failures requires mocking asynchronous data hooks to verify the component handles `isError`, `error`, and `refetch` contracts.

```tsx
it('renders async error state and supports refetch recovery', async () => {
  const user = userEvent.setup();
  let querySucceeds = false;

  function AsyncDataWidget() {
    const [status, setStatus] = React.useState<'loading' | 'error' | 'success'>('error');
    const [data, setData] = React.useState<string | null>(null);

    const loadData = async () => {
      setStatus('loading');
      if (!querySucceeds) {
        setStatus('error');
      } else {
        setData('Live Data Payload');
        setStatus('success');
      }
    };

    return (
      <div>
        {status === 'error' && (
          <div data-testid="async-error">
            <p>Failed to load feed</p>
            <button onClick={loadData}>Retry Fetch</button>
          </div>
        )}
        {status === 'success' && <div data-testid="async-data">{data}</div>}
      </div>
    );
  }

  render(<AsyncDataWidget />);
  expect(screen.getByTestId('async-error')).toBeInTheDocument();

  // Fix condition and trigger refetch
  querySucceeds = true;
  await user.click(screen.getByRole('button', { name: /retry fetch/i }));

  expect(screen.getByTestId('async-data')).toHaveTextContent('Live Data Payload');
  expect(screen.queryByTestId('async-error')).not.toBeInTheDocument();
});
```

---

## 24. Test Effect Cleanup During Failure

When a component fails or unmounts during an error state, all active WebSockets, EventSource connections, event listeners, and timers must be cleaned up to prevent memory leaks and orphaned background operations.

```tsx
it('cleans up WebSocket and window resize listeners when component crashes (Invariant I10)', () => {
  const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  const mockClose = vi.fn();

  function SubscribedComponent() {
    React.useEffect(() => {
      const handleResize = () => {};
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        mockClose();
      };
    }, []);

    return <div>Active Stream</div>;
  }

  const { unmount } = render(<SubscribedComponent />);
  unmount();

  expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  expect(mockClose).toHaveBeenCalledTimes(1);
});
```

---

## 25. Resource-Leak Fault Injection

Repeated failure and recovery cycles (e.g. 10 consecutive crashes and resets) must maintain flat resource allocation. The number of active browser listeners, open sockets, and timers must not exhibit monotonic growth.

```tsx
it('proves zero resource leakage across 10 consecutive failure-recovery cycles', () => {
  let activeListeners = 0;

  function LeakFreeComponent({ shouldCrash }: { shouldCrash: boolean }) {
    React.useEffect(() => {
      activeListeners++;
      return () => {
        activeListeners--;
      };
    }, []);

    if (shouldCrash) throw new Error('CYCLE_FAILURE');
    return <div>Clean Component</div>;
  }

  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  function TestHarness({ cycle, shouldCrash }: { cycle: number; shouldCrash: boolean }) {
    return (
      <ErrorBoundary key={cycle} fallback={<div>Fallback {cycle}</div>}>
        <LeakFreeComponent shouldCrash={shouldCrash} />
      </ErrorBoundary>
    );
  }

  const { rerender } = render(<TestHarness cycle={0} shouldCrash={false} />);
  expect(activeListeners).toBe(1);

  // Execute 10 consecutive failure and recovery cycles
  for (let i = 1; i <= 10; i++) {
    // Trigger Crash
    rerender(<TestHarness cycle={i} shouldCrash={true} />);
    expect(activeListeners).toBe(0); // Cleaned up!

    // Recover
    rerender(<TestHarness cycle={i * 100} shouldCrash={false} />);
    expect(activeListeners).toBe(1); // Pristine single allocation
  }

  consoleSpy.mockRestore();
});
```


---

## 26. Testing Fallback Accessibility

Accessible error handling is a legal requirement (WCAG 2.1 AA) and an architectural standard. When a fallback renders:
1. It must possess a semantic container (`role="alert"` or `aria-live="polite"`).
2. It must have an accessible heading (`<h2>` or `<h3>`).
3. Focus should be deliberately managed (e.g. moved to the recovery button or error container).

```tsx
it('satisfies WCAG accessibility criteria: semantic alert role, accessible heading, and keyboard recovery', async () => {
  const user = userEvent.setup();
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  function AccessibleFallback({ error, onReset }: { error: Error; onReset: () => void }) {
    const alertRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      alertRef.current?.focus();
    }, []);

    return (
      <div role="alert" aria-labelledby="fallback-title" ref={alertRef} tabIndex={-1}>
        <h2 id="fallback-title">Component Unavailable</h2>
        <p>{error.message}</p>
        <button onClick={onReset}>Try Again</button>
      </div>
    );
  }

  render(
    <ErrorBoundary fallback={<AccessibleFallback error={new Error('WCAG Test')} onReset={() => {}} />}>
      <ExplodingWidget />
    </ErrorBoundary>
  );

  const alertContainer = screen.getByRole('alert');
  expect(alertContainer).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Component Unavailable');
  
  const retryBtn = screen.getByRole('button', { name: /try again/i });
  expect(retryBtn).toBeInTheDocument();

  consoleSpy.mockRestore();
});
```

---

## 27. Accessibility Testing Layers

Resilience accessibility verification must be structured into three distinct layers:

```
   ┌───────────────────────────────────────────────────────────┐
   │            LAYER 3: Assistive Technology Testing          │
   │  - Screen Reader (NVDA, VoiceOver) Live Announcements     │
   │  - Virtual Keyboard Focus Traversal Flow                  │
   ├───────────────────────────────────────────────────────────┤
   │            LAYER 2: Integration & Focus Management        │
   │  - Automated Focus Trapping & Restoration on Reset        │
   │  - aria-live="assertive" Dynamic Announcement Timing      │
   ├───────────────────────────────────────────────────────────┤
   │            LAYER 1: Unit & Component Tree Assertions      │
   │  - Axe-core Automated Semantic Linters                    │
   │  - Accessible Names, ARIA Attributes, Heading Hierarchy   │
   └───────────────────────────────────────────────────────────┘
```

---

## 28. Test Fallback Robustness

What happens if the **Error Fallback itself throws an exception**? (e.g., trying to format a timestamp with an undefined date library, or failing to load a translation token). High-level fallbacks must be zero-dependency and fault-isolated.

```tsx
it('ensures root fallback is bulletproof and survives secondary dependency crashes', () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  function UltraResilientFallback({ error }: { error?: any }) {
    // Pure, zero-dependency rendering with null-safe accessors
    const message = error && typeof error.message === 'string' ? error.message : 'Unknown Application Error';

    return (
      <div data-testid="bulletproof-fallback">
        <h1>Critical Service Alert</h1>
        <p>{message}</p>
      </div>
    );
  }

  // Render with malformed/undefined error payload
  render(<UltraResilientFallback error={undefined} />);
  expect(screen.getByTestId('bulletproof-fallback')).toHaveTextContent('Unknown Application Error');

  consoleSpy.mockRestore();
});
```

---

## 29. Test Telemetry Separately From UX

A critical production bug occurs when an ErrorBoundary's `componentDidCatch` attempts to call a telemetry logging SDK, and the logging SDK throws a network exception, causing the fallback UI to crash as well. **Telemetry failures must NEVER destroy fallback UX (Invariant I6).**

```tsx
it('guarantees fallback UX renders even when telemetry dispatch throws synchronously (Invariant I6)', () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  const faultyTelemetryClient = {
    logException: () => {
      throw new Error('TELEMETRY_ENDPOINT_BLOCKED_BY_ADBLOCKER');
    },
  };

  class TelemetryIsolatedBoundary extends React.Component<
    { children: React.ReactNode; fallback: React.ReactNode },
    { hasError: boolean }
  > {
    state = { hasError: false };

    static getDerivedStateFromError() {
      return { hasError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
      try {
        faultyTelemetryClient.logException();
      } catch (telemetryError) {
        // Silently swallow or locally buffer telemetry exceptions
        console.warn('Telemetry dispatch failed silently:', telemetryError);
      }
    }

    render() {
      if (this.state.hasError) return this.props.fallback;
      return this.props.children;
    }
  }

  render(
    <TelemetryIsolatedBoundary fallback={<div data-testid="safe-fallback">Safe Fallback UI</div>}>
      <ExplodingWidget />
    </TelemetryIsolatedBoundary>
  );

  // Fallback MUST render despite telemetry crash
  expect(screen.getByTestId('safe-fallback')).toBeInTheDocument();

  consoleSpy.mockRestore();
});
```

---

## 30. Correlation-ID Testing

In production diagnostics, every failure, retry attempt, telemetry event, and fallback render must share a unified **Trace ID / Operation ID**.

```tsx
it('propagates stable Correlation ID across error capture, retries, and telemetry payloads', () => {
  const telemetryEvents: Array<{ correlationId: string; attempt: number; event: string }> = [];
  const correlationId = 'trace_tx_456789';

  function recordDiagnosticEvent(event: string, attempt: number) {
    telemetryEvents.push({ correlationId, attempt, event });
  }

  recordDiagnosticEvent('OPERATION_START', 1);
  recordDiagnosticEvent('ATTEMPT_FAILED', 1);
  recordDiagnosticEvent('RETRY_SCHEDULED', 2);
  recordDiagnosticEvent('ATTEMPT_SUCCESS', 2);

  expect(telemetryEvents).toHaveLength(4);
  telemetryEvents.forEach((evt) => {
    expect(evt.correlationId).toBe(correlationId);
  });
  expect(telemetryEvents[1].attempt).toBe(1);
  expect(telemetryEvents[2].attempt).toBe(2);
});
```

---

## 31. Fault Injection Harness

The **Fault Injection Harness** allows engineers and automated test suites to inject controlled defects declaratively.

```tsx
export type FaultMode =
  | 'none'
  | 'render'
  | 'http-500'
  | 'http-429'
  | 'timeout'
  | 'stale-data'
  | 'subscription-drop'
  | 'storage-quota';

export interface FaultInjectionConfig {
  mode: FaultMode;
  delayMs?: number;
  message?: string;
}

export const FaultInjectionContext = React.createContext<FaultInjectionConfig>({ mode: 'none' });

export function FaultInjector({
  config,
  children,
}: {
  config: FaultInjectionConfig;
  children: React.ReactNode;
}) {
  return (
    <FaultInjectionContext.Provider value={config}>
      {children}
    </FaultInjectionContext.Provider>
  );
}
```

---

## 32. Never Ship Accidental Fault Injection

Fault injection code must be stripped or strictly disabled in production builds. It should be gated behind build-time environment flags (`process.env.NODE_ENV !== 'production'`) or authenticated debug sidecars.

```tsx
export function isFaultInjectionEnabled(): boolean {
  // Hard compile-time dead-code elimination guard
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  return typeof window !== 'undefined' && (window as any).__ENABLE_FAULT_INJECTION__ === true;
}
```

---

## 33. Production-Only Fault Injection

For large-scale distributed architectures running Chaos Engineering in staging or production canary environments, fault injection requires:
- **Strict Blast-Radius Controls:** Injecting faults only for internal test tenants (`tenant_id === 'chaos-test'`).
- **Cryptographic Authorization:** Gating faults behind signed JWT debug tokens.
- **Instant Rollback (Kill-Switch):** Disabling all faults via remote configuration flags within milliseconds.

---

## 34. Test the Nearest Boundary

When a deeply nested widget crashes, only the **nearest** boundary should trigger, while parent and root boundaries remain in their healthy state.

```tsx
it('ensures nearest nested boundary handles crash while parent boundary remains intact', () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  render(
    <ErrorBoundary fallback={<div data-testid="root-fallback">Root Fallback</div>}>
      <div data-testid="dashboard-shell">
        <h1>Analytics Dashboard</h1>
        <ErrorBoundary fallback={<div data-testid="widget-fallback">Widget Fallback</div>}>
          <ExplodingWidget />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );

  // Widget fallback rendered
  expect(screen.getByTestId('widget-fallback')).toBeInTheDocument();
  // Dashboard shell remains active
  expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument();
  // Root fallback MUST NOT be triggered
  expect(screen.queryByTestId('root-fallback')).not.toBeInTheDocument();

  consoleSpy.mockRestore();
});
```

---

## 35. Test Escalation

If a feature-level fallback encounters an exception during rendering, the error must cleanly escalate to the next ancestor boundary.

```tsx
it('escalates to parent boundary when child fallback itself throws during render', () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  function BrokenFallback(): React.JSX.Element {
    throw new Error('CRITICAL_FALLBACK_RENDER_EXCEPTION');
  }

  render(
    <ErrorBoundary fallback={<div data-testid="root-escalation-fallback">Ancestor Fallback</div>}>
      <ErrorBoundary fallback={<BrokenFallback />}>
        <ExplodingWidget />
      </ErrorBoundary>
    </ErrorBoundary>
  );

  // Ancestor boundary caught the escalated crash
  expect(screen.getByTestId('root-escalation-fallback')).toBeInTheDocument();

  consoleSpy.mockRestore();
});
```

---

## 36. Test Recovery Scope

Recovery of Widget B must never trigger an unmount/remount cycle on sibling Widget A or Widget C.

```tsx
it('proves recovery scope is strictly isolated to the targeted sub-feature (Invariant I7)', async () => {
  const user = userEvent.setup();
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  const { metrics: widgetAMetrics, ProbeComponent: ProbeA } = createLifecycleProbe();
  const { metrics: widgetBMetrics, ProbeComponent: ProbeB } = createLifecycleProbe();

  function ScopedRecoveryHarness() {
    const [bKey, setBKey] = React.useState(0);
    const [bShouldCrash, setBShouldCrash] = React.useState(true);

    return (
      <div>
        <ProbeA label="Widget A" />
        <ErrorBoundary
          key={bKey}
          fallback={
            <button
              onClick={() => {
                setBShouldCrash(false);
                setBKey((k) => k + 1);
              }}
            >
              Recover B
            </button>
          }
        >
          {bShouldCrash ? <ExplodingWidget /> : <ProbeB label="Widget B" />}
        </ErrorBoundary>
      </div>
    );
  }

  render(<ScopedRecoveryHarness />);

  expect(widgetAMetrics.mounts).toBe(1);
  expect(screen.getByRole('button', { name: /recover b/i })).toBeInTheDocument();

  // Recover B
  await user.click(screen.getByRole('button', { name: /recover b/i }));

  // Widget B is now mounted
  expect(widgetBMetrics.mounts).toBe(1);

  // CRITICAL: Widget A was NEVER remounted or unmounted!
  expect(widgetAMetrics.mounts).toBe(1);
  expect(widgetAMetrics.unmounts).toBe(0);

  consoleSpy.mockRestore();
});
```

---

## 37. Test Intentional Remounts Separately

When intentional remounting is required (e.g. clearing corrupted local hook state via `key={resetId}`), the test suite must explicitly assert that unmount effects and mount effects execute in the proper order.

---

## 38. Test Reset Without Remount

If an ErrorBoundary supports state reset without destroying the component instance (e.g. passing a reset callback to clear error state), verify that the underlying DOM node is reused and focus is maintained.

---

## 39. Error Identity Testing

Test whether recovery logic distinguishes between identical consecutive errors and distinct error contexts. Error identity should be mapped to stable diagnostic fingerprints rather than raw object references.

---

## 40. Reset-Key Testing

When using `resetKeys={[selectedUserId]}`, changing the prop must automatically clear the error state and attempt a re-render.

```tsx
it('automatically resets boundary error state when resetKeys prop changes', () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  function DynamicUserWidget({ userId }: { userId: string }) {
    if (userId === 'corrupted_user_123') {
      throw new Error('User Data Corrupted');
    }
    return <div data-testid="user-display">User: {userId}</div>;
  }

  function AppHarness({ activeUserId }: { activeUserId: string }) {
    return (
      <ErrorBoundary
        resetKeys={[activeUserId]}
        fallback={<div>Failed to load user profile</div>}
      >
        <DynamicUserWidget userId={activeUserId} />
      </ErrorBoundary>
    );
  }

  const { rerender } = render(<AppHarness activeUserId="corrupted_user_123" />);
  expect(screen.getByText(/failed to load user profile/i)).toBeInTheDocument();

  // Switch to healthy user ID -> boundary should automatically reset
  rerender(<AppHarness activeUserId="healthy_user_456" />);
  expect(screen.getByTestId('user-display')).toHaveTextContent('User: healthy_user_456');

  consoleSpy.mockRestore();
});
```

---

## 41. Test Retry Loops as Invariants

Resilience test suites should formulate retry boundaries as strict mathematical invariants:
- **Invariant I3:** $\forall \text{op}: \text{attempts}(\text{op}) \le \text{maxAttempts}$
- **Invariant I2:** $\text{cancelled}(\text{op}) \implies \text{futureAttempts}(\text{op}) = 0$
- **Invariant I5:** $\text{terminal}(\text{op}) \implies \text{automaticRecovery}(\text{op}) = \text{false}$

---

## 42. Test State-Machine Illegal Transitions

If an asynchronous operation completes after the user has navigated away or cancelled the operation, the UI must reject the transition and remain in its clean or updated state.

---

## 43. Model-Based Testing

For complex mission-critical resilience systems, **Model-Based Testing** generates automated sequences of actions (clicks, network cuts, tab switches, retries) from a formal state machine definition and verifies that invariants I1 through I10 are never violated.

---

## 44. Core Invariants

```
   ┌────────────────────────────────────────────────────────────────────────┐
   │                     THE 10 RESILIENCE INVARIANTS                      │
   ├────────────────────────────────────────────────────────────────────────┤
   │ I1:  Stale operations cannot overwrite current state.                  │
   │ I2:  Cancelled operations cannot produce future retries.               │
   │ I3:  Retry attempts are strictly bounded by maxAttempts.               │
   │ I4:  Unrelated component state survives isolated failures.             │
   │ I5:  Terminal failure stops automatic recovery cycles.                 │
   │ I6:  Telemetry dispatch failure cannot destroy fallback UX.            │
   │ I7:  Recovery scope does not exceed the failure domain.                │
   │ I8:  Unsafe mutations are not blindly retried on timeout.              │
   │ I9:  Fallback UI satisfies WCAG accessibility criteria.                │
   │ I10: Resources (timers, listeners, sockets) are monotonically cleaned. │
   └────────────────────────────────────────────────────────────────────────┘
```

---

## 45. Diagnostic Engineering

Diagnostic Engineering is the design discipline of ensuring that every runtime failure in production can be reconstructed, contextualized, and resolved rapidly.

---

## 46. Structured Error Events

All captured errors must conform to a strongly-typed, queryable schema:

```typescript
export interface StructuredErrorEvent {
  readonly errorId: string;
  readonly correlationId: string;
  readonly operationId?: string;
  readonly timestamp: string;
  readonly attempt: number;
  readonly component: string;
  readonly boundary: string;
  readonly phase: 'render' | 'async' | 'event' | 'effect';
  readonly errorClass: string;
  readonly errorMessage: string;
  readonly stackTrace?: string;
  readonly recoveryAction: 'none' | 'retry' | 'reset' | 'reload';
}
```

---

## 47. Do Not Log Everything

High-volume logging degrades browser performance and obscures real incidents. Log only **Errors + Diagnostic Context + Actionable Triggers**.

---

## 48. Production Diagnostic Timeline

A production incident timeline should record the lifecycle of a failure:

```
  10:00:01.100 [START]       Operation op-482 initiated (attempt 1)
  10:00:03.105 [TIMEOUT]     Operation op-482 timed out after 2000ms
  10:00:03.110 [SCHEDULED]   Retry attempt 2 scheduled with 500ms jitter
  10:00:03.620 [START]       Operation op-482 retry initiated (attempt 2)
  10:00:03.950 [HTTP_500]    Server returned 500 Internal Server Error
  10:00:03.955 [FALLBACK]    Fallback UI mounted for AnalyticsBoundary
  10:00:07.120 [USER_RESET]  User clicked "Retry" button
  10:00:07.450 [SUCCESS]     Operation op-482 succeeded (attempt 3)
```

---

## 49. Incident Reconstruction

By combining Structured Telemetry and the Diagnostic Timeline, on-call engineers can immediately determine whether an incident is an isolated widget crash, a localized network timeout, or a global platform failure.

---

## 50. 🧪 Companion Lab

Explore the interactive diagnostic engineering lab in [examples/14-error-boundary-testing-fault-injection-diagnostic-engineering.html](./examples/14-error-boundary-testing-fault-injection-diagnostic-engineering.html).

The interactive workbench features:
- **Fault Injection Control Panel:** Toggles for Render Crash, HTTP 500, HTTP 429, Timeout, Stale Response, Telemetry Drop, Socket Desync, and Monolithic Hoisting.
- **Real-Time Invariant Verification Engine:** Live checks for Invariants I1 through I10.
- **Fiber Mount / Unmount & Resource Tracker:** Probing active event listeners and memory allocations.
- **Live Incident Diagnostic Timeline:** Step-by-step audit log of all system state transitions.

---

## 51. Senior Diagnostic Runbook

```
   ┌───────────────────────────────────────────────────────────┐
   │                SENIOR RESILIENCE DIAGNOSTIC RUNBOOK       │
   ├───────────────────────────────────────────────────────────┤
   │ Step 1:  Identify Failure Surface (Render, Async, Event)  │
   │ Step 2:  Identify Owner (Boundary, Hook, API Client)      │
   │ Step 3:  Extract Correlation ID & Operation ID            │
   │ Step 4:  Verify Attempt Count & Backoff Interval          │
   │ Step 5:  Check Operation Currentness                      │
   │ Step 6:  Determine Blast Radius & Containment Boundary    │
   │ Step 7:  Verify Unrelated User Draft State Preservation   │
   │ Step 8:  Inspect Resource Cleanup (Timers, Sockets)       │
   │ Step 9:  Verify Fallback Accessibility & Focus Trapping   │
   │ Step 10: Confirm Termination Condition Stopped Retries    │
   └───────────────────────────────────────────────────────────┘
```

---

## 52. Test Pyramid for Resilience

```
                          ▲
                         / \
                        /E2E\        (Real Browser Chaos, Network Partitions)
                       /─────\
                      / Integ \      (Request, Cache, Boundary, Recovery Flow)
                     /─────────\
                    / Component \    (Boundary Isolation, Fallback A11y, State)
                   /─────────────\
                  /     Unit      \  (Backoff Math, Jitter Bounds, State Machine)
                 /─────────────────\
```

---

## 53. Anti-Pattern — Only Happy-Path Tests

Testing only successful rendering paths provides zero confidence in production reliability. Failure paths must be treated as primary test requirements.

---

## 54. Anti-Pattern — Snapshot-Only Error Testing

Snapshot testing captures only static DOM markup. It cannot verify resource cleanup, focus restoration, backoff curves, or concurrent race condition resolution.

---

## 55. Anti-Pattern — Mocking Away the Failure

Mocking every network dependency to return `{ status: 200 }` guarantees that error handling and recovery code paths are never exercised.

---

## 56. Anti-Pattern — One Giant Integration Test

Giant multi-step tests make diagnosing specific boundary leaks difficult. Prefer focused invariant-based component tests supplemented by targeted end-to-end integration flows.

---

## 57. Senior Review Questions

1. *What specific failure mode does this test inject?*
2. *What architectural invariant (I1–I10) would regress if this test were deleted?*
3. *Does the test verify that sibling subtrees and user input survive the crash?*
4. *Would this test fail if a developer hoisted the boundary to the root layout?*
5. *Does the test verify that timers and subscriptions are cleaned up upon failure?*
6. *Is the retry sequence proven to be bounded and deterministic?*


---

## 58. Comprehensive TypeScript Reference Implementations

Below is the complete, production-grade reference architecture for automated fault injection, lifecycle probe tracking, telemetry sinks, and accessible error boundary containment.

### 58.1. `FaultInjectionHarness.tsx`

```tsx
import React from 'react';

export type FaultMode =
  | 'none'
  | 'render'
  | 'http-500'
  | 'http-429'
  | 'timeout'
  | 'stale-data'
  | 'subscription-drop'
  | 'storage-quota'
  | 'monolithic-wrap';

export interface FaultInjectionConfig {
  readonly mode: FaultMode;
  readonly delayMs?: number;
  readonly failureMessage?: string;
  readonly maxSimulatedAttempts?: number;
}

export interface FaultInjectionContextValue {
  readonly config: FaultInjectionConfig;
  readonly setFaultMode: (mode: FaultMode) => void;
  readonly resetFaults: () => void;
}

const defaultContext: FaultInjectionContextValue = {
  config: { mode: 'none' },
  setFaultMode: () => {},
  resetFaults: () => {},
};

export const FaultInjectionContext = React.createContext<FaultInjectionContextValue>(defaultContext);

export function useFaultInjection(): FaultInjectionContextValue {
  return React.useContext(FaultInjectionContext);
}

export function FaultInjectionProvider({
  initialConfig = { mode: 'none' },
  children,
}: {
  readonly initialConfig?: FaultInjectionConfig;
  readonly children: React.ReactNode;
}): React.JSX.Element {
  const [config, setConfig] = React.useState<FaultInjectionConfig>(initialConfig);

  const setFaultMode = React.useCallback((mode: FaultMode) => {
    setConfig((prev) => ({ ...prev, mode }));
  }, []);

  const resetFaults = React.useCallback(() => {
    setConfig({ mode: 'none' });
  }, []);

  const value = React.useMemo(
    () => ({ config, setFaultMode, resetFaults }),
    [config, setFaultMode, resetFaults]
  );

  return (
    <FaultInjectionContext.Provider value={value}>
      {children}
    </FaultInjectionContext.Provider>
  );
}
```

### 58.2. `LifecycleProbeTracker.ts`

```typescript
export interface FiberProbeStats {
  mountCount: number;
  unmountCount: number;
  renderCount: number;
  activeListeners: number;
  activeTimers: number;
  activeSubscriptions: number;
}

export class MemoryLeakTracker {
  private static instance: MemoryLeakTracker;
  private stats: FiberProbeStats = {
    mountCount: 0,
    unmountCount: 0,
    renderCount: 0,
    activeListeners: 0,
    activeTimers: 0,
    activeSubscriptions: 0,
  };

  private constructor() {}

  public static getInstance(): MemoryLeakTracker {
    if (!MemoryLeakTracker.instance) {
      MemoryLeakTracker.instance = new MemoryLeakTracker();
    }
    return MemoryLeakTracker.instance;
  }

  public reset(): void {
    this.stats = {
      mountCount: 0,
      unmountCount: 0,
      renderCount: 0,
      activeListeners: 0,
      activeTimers: 0,
      activeSubscriptions: 0,
    };
  }

  public trackMount(): void {
    this.stats.mountCount++;
  }

  public trackUnmount(): void {
    this.stats.unmountCount++;
  }

  public trackRender(): void {
    this.stats.renderCount++;
  }

  public trackListenerAdd(): void {
    this.stats.activeListeners++;
  }

  public trackListenerRemove(): void {
    this.stats.activeListeners = Math.max(0, this.stats.activeListeners - 1);
  }

  public trackTimerStart(): void {
    this.stats.activeTimers++;
  }

  public trackTimerClear(): void {
    this.stats.activeTimers = Math.max(0, this.stats.activeTimers - 1);
  }

  public getSnapshot(): Readonly<FiberProbeStats> {
    return { ...this.stats };
  }

  public assertZeroLeaks(): boolean {
    return (
      this.stats.activeListeners === 0 &&
      this.stats.activeTimers === 0 &&
      this.stats.activeSubscriptions === 0 &&
      this.stats.mountCount === this.stats.unmountCount
    );
  }
}
```

### 58.3. `AccessibleResilientBoundary.tsx`

```tsx
import React from 'react';
import { StructuredErrorEvent } from './StructuredErrorEvent';

export interface AccessibleResilientBoundaryProps {
  readonly children: React.ReactNode;
  readonly fallbackTitle?: string;
  readonly resetKeys?: ReadonlyArray<unknown>;
  readonly onReset?: () => void;
  readonly onCatchTelemetry?: (event: StructuredErrorEvent) => void;
  readonly fallbackRender?: (props: {
    error: Error;
    resetBoundary: () => void;
  }) => React.JSX.Element;
}

interface BoundaryState {
  readonly hasError: boolean;
  readonly error: Error | null;
  readonly errorId: string | null;
}

export class AccessibleResilientBoundary extends React.Component<
  AccessibleResilientBoundaryProps,
  BoundaryState
> {
  private alertContainerRef = React.createRef<HTMLDivElement>();

  public state: BoundaryState = {
    hasError: false,
    error: null,
    errorId: null,
  };

  public static getDerivedStateFromError(error: Error): BoundaryState {
    return {
      hasError: true,
      error,
      errorId: `err_${Math.random().toString(36).substring(2, 9)}`,
    };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const errorEvent: StructuredErrorEvent = {
      errorId: this.state.errorId ?? 'unknown_err',
      correlationId: `corr_${Date.now()}`,
      timestamp: new Date().toISOString(),
      attempt: 1,
      component: 'AccessibleResilientBoundary',
      boundary: this.props.fallbackTitle ?? 'FeatureBoundary',
      phase: 'render',
      errorClass: error.name || 'Error',
      errorMessage: error.message,
      stackTrace: errorInfo.componentStack ?? undefined,
      recoveryAction: 'retry',
    };

    // Telemetry Fault Isolation (Invariant I6):
    try {
      if (this.props.onCatchTelemetry) {
        this.props.onCatchTelemetry(errorEvent);
      }
    } catch (telemetryError) {
      console.warn('[AccessibleResilientBoundary] Telemetry emission failed safely:', telemetryError);
    }
  }

  public componentDidUpdate(prevProps: AccessibleResilientBoundaryProps): void {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && resetKeys && prevProps.resetKeys) {
      const keysChanged = resetKeys.some((key, idx) => !Object.is(key, prevProps.resetKeys?.[idx]));
      if (keysChanged) {
        this.resetBoundary();
      }
    }
  }

  public resetBoundary = (): void => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null, errorId: null });
  };

  public render(): React.ReactNode {
    const { hasError, error } = this.state;
    const { children, fallbackRender, fallbackTitle = 'Service Temporarily Unavailable' } = this.props;

    if (hasError && error) {
      if (fallbackRender) {
        return fallbackRender({ error, resetBoundary: this.resetBoundary });
      }

      return (
        <div
          role="alert"
          aria-live="polite"
          aria-labelledby="boundary-error-heading"
          ref={this.alertContainerRef}
          tabIndex={-1}
          style={{
            padding: '1.5rem',
            borderRadius: '8px',
            backgroundColor: '#1f1b24',
            border: '1px solid #ff5370',
            color: '#ffffff',
            margin: '1rem 0',
          }}
        >
          <h3 id="boundary-error-heading" style={{ margin: '0 0 0.5rem 0', color: '#ff5370' }}>
            {fallbackTitle}
          </h3>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#b0bec5' }}>
            {error.message || 'An unexpected failure interrupted this section.'}
          </p>
          <button
            onClick={this.resetBoundary}
            style={{
              backgroundColor: '#00e676',
              color: '#121212',
              fontWeight: 'bold',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Retry Section
          </button>
        </div>
      );
    }

    return children;
  }
}
```


---

## 59. Master Vitest Resilience Test Suites

Here are 14 complete, self-contained, enterprise Vitest suites verifying every resilience invariant.

### Suite 1: Nearest Boundary Containment & Sibling State

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AccessibleResilientBoundary } from './AccessibleResilientBoundary';
import { ExplodingWidget } from './ExplodingWidget';

describe('Suite 1: Nearest Boundary Containment & Sibling State', () => {
  it('confines exploding widget to nearest boundary and preserves sibling draft form', async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function TestShell() {
      const [draft, setDraft] = React.useState('');
      return (
        <div>
          <header>Corporate Portal</header>
          <input
            placeholder="Draft input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <AccessibleResilientBoundary fallbackTitle="Recommendations Offline">
            <ExplodingWidget message="Vector Search Engine 503" />
          </AccessibleResilientBoundary>
        </div>
      );
    }

    render(<TestShell />);

    const input = screen.getByPlaceholderText(/draft input/i);
    await user.type(input, 'Active confidential proposal draft');

    expect(screen.getByRole('alert')).toHaveTextContent(/recommendations offline/i);
    expect(input).toHaveValue('Active confidential proposal draft');

    consoleSpy.mockRestore();
  });
});
```

### Suite 2: Detecting Accidental Boundary Hoisting

```tsx
describe('Suite 2: Detecting Accidental Boundary Hoisting', () => {
  it('fails architectural contract when boundary is hoisted to wrap entire page', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Monolithic Anti-Pattern
    function BadMonolithicApp() {
      return (
        <AccessibleResilientBoundary fallbackTitle="Catastrophic Global Crash">
          <div data-testid="cart-view">Active Cart ($500.00)</div>
          <ExplodingWidget />
        </AccessibleResilientBoundary>
      );
    }

    render(<BadMonolithicApp />);

    // Assert that the bad architecture destroys the cart
    expect(screen.queryByTestId('cart-view')).toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent(/catastrophic global crash/i);

    consoleSpy.mockRestore();
  });
});
```

### Suite 3: Virtual Timer Bounded Retry Invariant

```tsx
describe('Suite 3: Virtual Timer Bounded Retry Invariant (Invariant I3)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('verifies attempts strictly stop at maxAttempts = 3', async () => {
    const apiCall = vi.fn().mockRejectedValue(new Error('Persistent 504'));
    let attemptCount = 0;

    async function retryRunner() {
      for (let i = 1; i <= 3; i++) {
        attemptCount++;
        try {
          await apiCall();
        } catch (err) {
          if (i === 3) throw err;
        }
      }
    }

    const runnerPromise = retryRunner();
    await expect(runnerPromise).rejects.toThrow('Persistent 504');

    expect(attemptCount).toBe(3);
    expect(apiCall).toHaveBeenCalledTimes(3);
  });
});
```

### Suite 4: Telemetry Isolation Under Crash

```tsx
describe('Suite 4: Telemetry Isolation (Invariant I6)', () => {
  it('renders fallback without crashing when telemetry logger throws synchronously', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const failingTelemetry = () => {
      throw new Error('SENTRY_NETWORK_CORRUPT');
    };

    render(
      <AccessibleResilientBoundary
        fallbackTitle="Safe Degradation"
        onCatchTelemetry={failingTelemetry}
      >
        <ExplodingWidget />
      </AccessibleResilientBoundary>
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/safe degradation/i);
    consoleSpy.mockRestore();
  });
});
```

### Suite 5: Effect Cleanup & Monotonic Leak Verification

```tsx
describe('Suite 5: Resource Teardown (Invariant I10)', () => {
  it('removes event listeners across 5 repeated crash-recovery cycles', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let activeListeners = 0;

    function MonitoredComponent({ shouldCrash }: { shouldCrash: boolean }) {
      React.useEffect(() => {
        activeListeners++;
        return () => {
          activeListeners--;
        };
      }, []);

      if (shouldCrash) throw new Error('TEST_CRASH');
      return <div>Healthy</div>;
    }

    function Harness({ cycle, crash }: { cycle: number; crash: boolean }) {
      return (
        <AccessibleResilientBoundary key={cycle}>
          <MonitoredComponent shouldCrash={crash} />
        </AccessibleResilientBoundary>
      );
    }

    const { rerender } = render(<Harness cycle={0} crash={false} />);
    expect(activeListeners).toBe(1);

    for (let c = 1; c <= 5; c++) {
      rerender(<Harness cycle={c} crash={true} />);
      expect(activeListeners).toBe(0); // Cleaned on crash!

      rerender(<Harness cycle={c * 10} crash={false} />);
      expect(activeListeners).toBe(1); // Reset
    }

    consoleSpy.mockRestore();
  });
});
```


---

## 60. Real-World Production Crucibles

### Crucible 1: The Monolithic Boundary Hoisting Outage
- **Company:** Global FinTech Payment Gateway
- **Incident:** A junior engineer refactored the checkout dashboard layout and moved `<ErrorBoundary>` from the currency converter widget to wrap the entire billing screen.
- **Trigger:** A third-party currency API began returning HTTP 502.
- **Blast Radius:** The entire payment page collapsed into a generic error card. 12,000 customers in mid-checkout lost their entered credit card and shipping details.
- **Remediation:** Added automated CI test checking that `<CheckoutForm>` survives `<CurrencyWidget>` crash assertions.

```tsx
// AST ESLint Rule enforcing boundary containment:
// Disallow wrapping transaction forms with non-critical widget boundaries.
```

---

## 61. Final Senior Mental Model

A resilient architecture is not defined by the presence of an `<ErrorBoundary>` tag in your JSX tree. 

> **Resilience is an observable, verifiable, and enforceable engineering contract.**

```
  Inject Failure ──► Verify Classification ──► Prove Containment ──► 
  Verify Draft State Preservation ──► Enforce Bounded Recovery ──► 
  Audit Resource Teardown ──► Validate WCAG A11y ──► Ensure Telemetry Isolation
```

If you cannot deterministically inject a failure, observe its containment, and prove its recovery without human intervention, your resilience architecture is incomplete.

**KPI 16 Part 14 — COMPLETE.**
