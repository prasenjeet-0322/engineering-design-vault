# KPI 10 — Part 10: Testing Error Paths & Debugging Practice

[⬅️ Part 09: Frontend Observability & Signal-to-Noise](./09-frontend-observability-breadcrumbs-alert-design.md) | [📚 KPI 10 Index](./README.md) | [KPI 11 — Asynchronous Foundations & Event Loop ➡️](../11-Async-Foundations/README.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Testing / Debugging Concept | Operational Invariant | Common Failure Caught | Senior Verification Standard |
|---|---|---|---|---|
| **Failure Contract Testing** | Assert both return values *and* thrown/rejected error classes. | Missing error codes, uncaught promise rejections. | 🟢 Test the complete 9-scenario failure matrix (Network, 500, 401, 422, Timeout, Abort, Stale). |
| **Post-Failure State Invariant** | Assert `isLoading === false` and `data === fallback` after failure. | **Stuck Loading Spinners**, frozen submit buttons. | 🔴 **Never Stop at `.toThrow()`**: Always assert the resulting UI state is interactive and clean. |
| **Deferred Promises** | Manually resolve promises via `deferred.resolve()` in tests. | Race conditions, stale async response overwrites. | 🟢 Control asynchronous completion order deterministically in concurrency unit tests. |
| **State Machine Testing** | Test all transition edges: `IDLE -> LOADING -> ERROR -> RETRY -> SUCCESS`. | Impossible state combinations (`isLoading: true && isSuccess: true`). | 🟢 Model application state with finite state machines; assert illegal transitions throw. |
| **Teardown Cleanup Testing** | Mount $\to$ Unmount $\to$ Mount $\to$ Assert single listener execution. | Memory leaks, duplicate event listener execution. | 🔴 Test component unmounting to guarantee `clearInterval` and `removeEventListener` execute. |
| **5-Level Competency Model** | Level 1 (Symptom) $\to$ 2 (Repro) $\to$ 3 (Causal) $\to$ 4 (Experiment) $\to$ 5 (Systemic). | Treating bugs as one-off typos rather than systemic defects. | 🔵 Convert every production incident into automated regression tests and architectural guards. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: The Unasserted Post-Failure State Trap & The Phantom Promise
> 
> #### Gotcha A: The Unasserted Post-Failure State Trap
> *"Why did our unit tests pass with 100% code coverage while our production checkout button froze permanently on network drops?"*  
> ```js
> // ❌ SUPERFICIAL TEST (Passes, but misses production UI freeze!):
> test("handles payment failure", async () => {
>   api.processPayment.mockRejectedValue(new Error("503"));
>   // Test only asserts that the API rejected:
>   await expect(submitCheckoutForm()).rejects.toThrow("503");
>   // 💥 FORGOT TO ASSERT UI STATE: isLoading remained true, locking the user out!
> });
> ```
> **Deep Architectural Explanation:**  
> Catching an error or asserting that an async function rejects verifies only the transport boundary. If the component's `finally` block failed to reset `setIsLoading(false)` or re-enable the submit button, the UI remains permanently frozen in production.  
> **The Senior Standard (Complete State Tuple Assertion):**  
> ```js
> // ✅ BATTLE-TESTED POST-FAILURE INVARIANT ASSERTION:
> test("handles payment failure and restores interactive state", async () => {
>   api.processPayment.mockRejectedValue(new NetworkError("503"));
>   await submitCheckoutForm();
> 
>   expect(screen.getByRole("button", { name: /pay now/i })).toBeEnabled();
>   expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
>   expect(screen.getByRole("alert")).toHaveTextContent(/payment failed/i);
> });
> ```
> 
> ---
> 
> #### Gotcha B: The Phantom Promise Race Trap in Search Tests
> *"Why did our test suite fail to catch a stale search race condition where typing 're' overwrote 'react'?"*  
> If unit tests mock API delays using arbitrary `setTimeout(10)` calls, both requests resolve in the order they were initiated, masking concurrency bugs.  
> **The Senior Standard:** Use **Manual Deferred Promises** (`createDeferred()`) to explicitly force the older request ("re") to resolve *after* the newer request ("react"), verifying that the older response is safely discarded.

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / TypeScript Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Vitest / Jest failure tests, React Testing Library error assertions, Fake timers (`vi.useFakeTimers`) | Essential for validating that applications degrade gracefully and recover cleanly from failures. |
| 🟡 **Moderate** | Used in ~45% of code | Deferred promise concurrency harnesses, State machine transition testing, MSW network fault injection | Critical for high-concurrency search engines, financial transactions, and multi-tenant platforms. |
| 🔵 **Foundational / Engine** | Runtime internals | V8 Garbage Collection reachability testing, Microtask queue ordering in test runners, Systemic quality | Essential for engineering leadership, test infrastructure architecture, and Staff/Principal reviews. |

---

## Core Concepts (20 Subtopics)

### Part 1 — Failure Paths as First-Class System Contracts `🟢 [Daily Driver]`

A function's contract defines both its successful return shape and its exact failure behavior (thrown error classes, status codes, and fallback states).

---

### Part 2 — The 9-Scenario Production Failure Matrix `🟢 [Daily Driver]`

For any critical feature, test:
1. **Happy Path:** Expected data returned.
2. **Physical Network Drop:** `TypeError: Failed to fetch`.
3. **HTTP 500 / 503:** Server crash recovery.
4. **HTTP 401 Unauthorized:** Session expiration & login prompt.
5. **HTTP 422 Validation:** Form field error mapping.
6. **Request Timeout:** Aborting after threshold without stuck spinners.
7. **Intentional Cancellation:** Navigating away without false error banners.
8. **Stale Response Race:** Out-of-order resolution discarded.
9. **Corrupted Schema:** Zod parsing failure with fallback rendering.

---

### Part 3 — Post-Failure Application State Invariant Verification `🔴 [Production-Critical]`

Always assert the post-failure state tuple:
$$\{ \text{isLoading: false}, \text{error: 'Message'}, \text{data: fallback}, \text{controls: enabled} \}$$

---

### Part 4 — Testing Contracts vs. Implementation Details `🟢 [Daily Driver]`

Test observable user outcomes ("Retry button visible") rather than private component implementation details (`component.state._errorFlag === true`).

---

### Part 5 — Expected Domain Failures vs. Unexpected System Exceptions `🟢 [Daily Driver]`

- **Expected (422/401):** Assert that user receives actionable inline guidance; verify error is *not* sent to APM.
- **Unexpected (500/TypeError):** Assert that error boundary renders fallback; verify telemetry dispatcher *is* called.

---

### Part 6 — Deterministic Dependency Doubles & Fault Injection `🟢 [Daily Driver]`

Use Mock Service Worker (MSW) or Vitest spies to inject deterministic HTTP 500s, 429 rate limits, and network drops into test suites.

---

### Part 7 — Controlling Asynchronous Timing without Wall-Clock Delays `🟢 [Daily Driver]`

Never use `setTimeout(() => {}, 1000)` in tests. Use `vi.useFakeTimers()` and `vi.advanceTimersByTime(1000)` to execute time-based logic instantly in milliseconds.

---

### Part 8 — Complete Lifecycle State Machine Testing `🟢 [Daily Driver]`

```text
IDLE (initial) -> LOADING (on click) -> ERROR (on 500) -> RETRY (on click) -> SUCCESS (on recover)
```

---

### Part 9 — Exhaustive Retry Recovery & Failure Loop Prevention `🟢 [Daily Driver]`

Test both recovery on attempt 2 *and* failure exhaustion when all retries fail, ensuring no infinite retry loops lock up client CPU.

---

### Part 10 — Timeout Testing with Fake Timer Clocks `🟢 [Daily Driver]`

Advance fake timers past the timeout threshold (e.g. 5000ms) and verify that the `AbortController.abort()` signal fires and cancels the request.

---

### Part 11 — Testing Request Cancellation & Cleanup Invariants `🟢 [Daily Driver]`

Simulate component unmount while an API request is pending, asserting that `AbortController.abort()` executes and no React memory leak warnings occur.

---

### Part 12 — Controlled Concurrency Testing via Deferred Promises `🔴 [Production-Critical]`

```js
function createDeferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
```

---

### Part 13 — Stale Response Invalidation & Out-of-Order Overwrites `🔴 [Production-Critical]`

Initiate Request A (query: "re") with Deferred A. Initiate Request B (query: "react") with Deferred B. Resolve B first, then resolve A second. Assert UI displays "react".

---

### Part 14 — Component Error Boundary Containment Testing `🟢 [Daily Driver]`

Render a broken child component inside an Error Boundary and assert that sibling navigation headers remain fully interactive while the broken component renders fallback UI.

---

### Part 15 — Lifecycle Teardown Verification: Eliminating Memory Leaks `🔴 [Production-Critical]`

Mount the component, unmount it, and mount it again. Trigger a global window event and assert that the listener callback executes exactly once, proving the old listener was removed.

---

### Part 16 — Impossible State Elimination via State Machines `🟢 [Daily Driver]`

Assert that invalid state transitions (e.g. `COMPLETED \to LOADING` without re-initialization) throw an explicit error.

---

### Part 17 — Production Scenario 1: Intermittent Project State Overwrite `🟢 [Daily Driver]`

**Problem:** Fast tab switching caused old project data to overwrite current project data.  
**Fix:** Attached `AbortController` to tab switch effects and asserted response sequence IDs.

---

### Part 18 — Production Scenario 2: Offline Disconnect Stuck Loading Spinner `🔴 [Production-Critical]`

**Problem:** Network disconnect caused loading spinners to spin forever.  
**Fix:** Moved `setIsLoading(false)` into a mandatory `finally` block and added automated offline unit tests.

---

### Part 19 — Production Scenario 3: Duplicate Event Listeners from Missing Cleanup `🔴 [Production-Critical]`

**Problem:** Navigating to and from a chat page doubled WebSocket notification sounds.  
**Fix:** Returned explicit `socket.unsubscribe()` cleanup in `useEffect` and added mount/unmount unit tests.

---

### Part 20 — The 5-Level Senior Debugging Competency Framework `🟢 [Daily Driver]`

```text
Level 1 (Symptom Fixing): Editing code until red squigglies disappear.
Level 2 (Reproduction): Finding deterministic reproduction steps.
Level 3 (Causal Analysis): Identifying the first moment state became invalid.
Level 4 (Experimental Debugging): Formulating hypotheses and conducting controlled tests.
Level 5 (Systemic Engineering): Transforming bugs into automated regression tests and architectural guards.
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Test Strategy | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Deferred Promise Concurrency Testing** | Search autocomplete, live filtering, tab switching, and out-of-order async races. | Simple synchronous data transformation algorithms. | Requires manual promise lifecycle management in test blocks. | MSW delayed responses. |
| **Mock Service Worker (MSW)** | Integration testing REST/GraphQL endpoints with realistic HTTP headers and status codes. | Pure isolated mathematical unit tests. | Adds service worker interception layer setup. | Simple Vitest mock spies. |
| **Vitest Fake Timers (`vi.useFakeTimers`)** | Testing debouncing, polling intervals, timeouts, and exponential backoff. | Asynchronous code relying on real Node file system I/O. | Must remember to call `vi.useRealTimers()` in teardown. | Real `setTimeout` (flaky). |
| **Playwright Chaos Network Tests** | Full end-to-end testing of offline mode, service workers, and payment gateway dropouts. | Unit testing localized state edge cases (too slow). | Slower test execution (seconds per test); requires browser automation. | MSW integration tests. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Concurrency Test Harness with Deferred Promises & MSW Patterns
```tsx
import React, { useState, useRef, useCallback } from 'react';

// ==========================================
// 1. DATA CONTRACTS & SEARCH ENGINE
// ==========================================
export interface SearchItem {
  id: string;
  title: string;
}

export interface SearchService {
  search: (query: string, signal?: AbortSignal) => Promise<SearchItem[]>;
}

export function EnterpriseSearchEngine({ searchService }: { searchService: SearchService }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const latestSequenceIdRef = useRef<number>(0);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      setQuery(searchQuery);

      if (!searchQuery.trim()) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      // 🟢 1. Abort previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const seqId = ++latestSequenceIdRef.current;
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const data = await searchService.search(searchQuery, controller.signal);

        // 🟢 2. Concurrency Invariant: Only update state if this is the latest request!
        if (seqId === latestSequenceIdRef.current) {
          setResults(data);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return; // Ignore intentional aborts

        if (seqId === latestSequenceIdRef.current) {
          setErrorMessage(err.message || 'Search failed');
          setResults([]);
        }
      } finally {
        if (seqId === latestSequenceIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [searchService]
  );

  return (
    <div className="search-box">
      <input
        type="text"
        placeholder="Search documentation..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        aria-label="Search"
      />
      {isLoading && <span data-testid="search-spinner">⏳ Loading...</span>}
      {errorMessage && <div role="alert" className="error-banner">⚠️ {errorMessage}</div>}

      <ul className="results-list">
        {results.map((item) => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 🧠 Part 10 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: Manual Deferred Promise Concurrency Order
```js
function createDeferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

let latestId = 0;
let displayed = "";

function search(query, deferred) {
  const current = ++latestId;
  deferred.promise.then(() => {
    if (current === latestId) {
      displayed = query;
      console.log("Displayed:", displayed);
    } else {
      console.log("Discarded stale query:", query);
    }
  });
}

const defA = createDeferred();
const defB = createDeferred();

search("Query A", defA); // Request 1
search("Query B", defB); // Request 2

// Resolve in reverse order (B first, A second):
defB.resolve();
defA.resolve();
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Displayed: Query B
Discarded stale query: Query A
```
**Why:** Because Request 2 incremented `latestId` to 2, when Request 1 resolves later, its `current` (1) does not match `latestId` (2), so its stale payload is safely discarded.
</details>

---

### Prediction Challenge 2: Post-Failure Loading Reset Invariant
```js
let state = { loading: false, error: null };

async function executeAction(shouldThrow) {
  state.loading = true;
  state.error = null;
  try {
    if (shouldThrow) throw new Error("Server Crash");
  } catch (err) {
    state.error = err.message;
  } finally {
    state.loading = false;
  }
}

executeAction(true).then(() => {
  console.log("Loading Reset?:", state.loading === false);
  console.log("Error Recorded?:", state.error === "Server Crash");
});
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Loading Reset?: true
Error Recorded?: true
```
**Why:** The `finally` block guarantees that `loading` resets to `false` even on exception throwing, eliminating stuck UI loading spinners.
</details>

---

### Prediction Challenge 3: Mount/Unmount Event Listener Leak Detection
```js
let activeListeners = 0;

function mountComponent() {
  activeListeners++;
  return function unmount() {
    activeListeners--;
  };
}

const unmount1 = mountComponent();
console.log("Active after mount 1:", activeListeners); // 1

unmount1(); // Cleanup executed
console.log("Active after unmount 1:", activeListeners); // 0

const unmount2 = mountComponent();
console.log("Active after mount 2:", activeListeners); // 1
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Active after mount 1: 1
Active after unmount 1: 0
Active after mount 2: 1
```
**Why:** Explicit teardown functions guarantee that event listener counters decrement on unmount, preventing duplicate listener memory leaks.
</details>

---

### Prediction Challenge 4: Error Boundary Sibling Stability
```js
const appState = {
  headerInteractive: true,
  widgetA: "FALLBACK_RENDERED",
  widgetB: "NORMAL_RENDER"
};

console.log("Is Header Interactive?:", appState.headerInteractive);
console.log("Widget A State:", appState.widgetA);
console.log("Widget B State:", appState.widgetB);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Is Header Interactive?: true
Widget A State: FALLBACK_RENDERED
Widget B State: NORMAL_RENDER
```
**Why:** Error boundaries contain crashes strictly within the local widget boundary, leaving parent headers and sibling widgets fully functional.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** Why is it dangerous to only test the "Happy Path" of an application?  
<details>
<summary><strong>Answer</strong></summary>
In production, applications frequently encounter network disconnects, server 500 errors, rate limits, timeouts, and malformed data. If only the happy path is tested, the application's failure behavior is undefined, leading to unhandled runtime crashes, stuck loading spinners, and permanent UI lockups for users.
</details>

**Q2:** How do you test that an asynchronous function throws an expected error using modern test runners (Vitest/Jest)?  
<details>
<summary><strong>Answer</strong></summary>
Use `await expect(asyncFunction()).rejects.toThrow(ExpectedErrorClass)`. You must `await` the assertion; otherwise, the test function will finish synchronously and pass as a false positive without evaluating the rejection.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** What are "Deferred Promises" and how do they enable deterministic race condition testing?  
<details>
<summary><strong>Answer</strong></summary>
A Deferred Promise is a utility that exposes the `resolve` and `reject` functions of a Promise outside of its constructor closure. In tests, developers can initiate two overlapping asynchronous operations (e.g. Search Request A and Search Request B) and manually trigger `deferredB.resolve()` *before* `deferredA.resolve()`, deterministically reproducing out-of-order network response arrivals and proving that stale responses do not overwrite fresh state.
</details>

**Q4:** How do you test that component cleanup (e.g. `removeEventListener`, `clearInterval`) executed properly during unmounting?  
<details>
<summary><strong>Answer</strong></summary>
Render the component, spy on `window.removeEventListener` or `clearInterval`, unmount the component using `unmount()`, and assert that `expect(window.removeEventListener).toHaveBeenCalledWith('eventName', expect.any(Function))` was called. Additionally, trigger the global event after unmounting and verify that the component's internal handler does not execute.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** How do you test complex state machine lifecycles (`IDLE \to LOADING \to ERROR \to RETRY \to SUCCESS`) ensuring zero impossible state combinations?  
<details>
<summary><strong>Answer</strong></summary>
1. **Edge Transition Tests:** Test every allowed transition edge in the state machine matrix, verifying that valid events advance the state to the exact expected target.  
2. **Illegal Transition Guards:** Attempt to execute illegal transitions (e.g. sending a `SUCCESS` event while in the `IDLE` state) and assert that the state machine throws an `IllegalTransitionError` or rejects the event.  
3. **State Invariant Assertions:** Assert that multi-boolean bugs (`isLoading === true && isSuccess === true`) are mathematically impossible by modeling state as a single tagged union (`status: 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'`).
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How do you establish an organization-wide "Failure-First Engineering Culture" across 50+ frontend micro-frontend teams?  
<details>
<summary><strong>Answer</strong></summary>
1. **Automated Chaos Testing in CI:** Enforce automated network chaos injection (MSW / Playwright) in CI pipelines that randomly drops 5% of API calls and asserts that zero unhandled rejections or uncontained screen crashes occur.  
2. **Mandatory Regression Test Policy:** Require every bugfix PR to include a failing-to-passing regression test that directly encodes the production incident scenario.  
3. **5-Whys Blameless Postmortem Guild:** Facilitate monthly architecture review guilds where postmortems convert isolated developer fixes into systemic platform protections (shared SDK adapters, lint rules, and framework boundaries).
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Chaos & Concurrency Test Runner

```js
// See runnable implementation in examples/10-testing-error-paths-debugging-practice.js
```

---

## Key Takeaways
1. **Test the 9-Scenario Matrix:** Test network drops, 500s, 401s, 422s, timeouts, aborts, and stale races.
2. **Assert Post-Failure State:** Verify `isLoading === false` and form fields re-enable.
3. **Deferred Promises for Races:** Deterministically resolve async operations out-of-order in unit tests.
4. **Guaranteed Teardown Cleanups:** Verify event listeners and timers unbind on unmount.
5. **Systemic Debugging Maturity:** Turn every production incident into a permanent regression test.

---

[⬅️ Part 09: Frontend Observability & Signal-to-Noise](./09-frontend-observability-breadcrumbs-alert-design.md) | [📚 KPI 10 Index](./README.md) | [KPI 11 — Asynchronous Foundations & Event Loop ➡️](../11-Async-Foundations/README.md)
