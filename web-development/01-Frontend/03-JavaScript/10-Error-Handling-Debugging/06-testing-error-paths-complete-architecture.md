# KPI 10 — Part 06: Testing Error Paths & Failure Scenarios

[⬅️ Part 05: Production Error Architecture & Telemetry](./05-production-monitoring-telemetry-sentry.md) | [📚 KPI 10 Index](./README.md) | [Part 07: Advanced Debugging Scenarios & Stale State ➡️](./07-advanced-debugging-race-conditions-closures.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Testing Scenario | Operational Assertion Mechanism | Async Required? | Failure Mode Caught | Senior Production Standard |
|---|---|---|---|---|
| **Sync Thrown Error** | `expect(() => fn()).toThrow(ValidationError)` | ❌ (Sync) | Missing parameter validation, invalid mathematical operations. | 🟢 Always assert on specific error classes or codes, not just generic `.toThrow()`. |
| **Async Rejection** | `await expect(asyncFn()).rejects.toThrow(HttpError)` | ✅ (Must `await`) | Network drops, 4xx/5xx responses, unhandled promise rejections. | 🔴 **Always `await` Rejections**: Omitting `await` causes tests to pass false-positively without executing! |
| **Controlled Mock Failure** | `api.get.mockRejectedValueOnce(new NetworkError())` | ✅ (Async) | Flaky third-party APIs, transient 503 errors, rate limits. | 🟢 Use deterministic mocks instead of hitting live network endpoints in unit/integration tests. |
| **State Reset Verification** | Assert `state.isLoading === false` after error settlement. | ✅ (Async) | Permanent loading spinners, frozen buttons after API crashes. | 🔴 **Never Leave Stuck Spinners**: Always verify loading flags reset in `finally` blocks during test runs. |
| **Race Condition Timing** | Stagger mock delays: Request A (100ms), Request B (20ms). | ✅ (Async) | Stale search responses overwriting fresh UI state. | 🟢 Test out-of-order response resolutions to ensure newest request wins. |
| **Regression Test Loop** | Bug $\to$ Write failing test $\to$ Fix code $\to$ Verify test passes. | Sync / Async | Recurring regressions after refactoring. | 🟢 Every production bugfix must be accompanied by an automated regression test. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: The Unawaited Rejection False-Positive Trap
> 
> #### Gotcha A: The Unawaited Async Assertion Trap (The Phantom Green Test)
> *"Why did our CI pipeline pass with 100% green tests even though our payment failure handler was completely broken?"*  
> ```js
> // ❌ DANGEROUS FALSE-POSITIVE TEST (Never checks anything!):
> test("should reject when card is declined", () => {
>   // 💥 FORGOTTEN await! The test runner finishes immediately before the promise rejects!
>   // The assertion is never evaluated, and the test reports GREEN!
>   expect(processPayment({ amount: -50 })).rejects.toThrow("Invalid card");
> });
> ```
> **Deep Architectural Explanation:**  
> In test frameworks (Vitest, Jest), `expect(promise).rejects` returns an un-settled Promise. If you omit the `await` keyword, the test function exits synchronously with a return value of `undefined`. The test runner marks the test as passing immediately, while the rejection evaluates later in a detached microtask, completely unmonitored.  
> **The Senior Standard (Mandatory Awaited Assertions):**  
> ```js
> // ✅ BATTLE-TESTED ASYNC ASSERTION:
> test("should reject when card is declined", async () => {
>   await expect(processPayment({ amount: -50 })).rejects.toThrow(PaymentValidationError);
> });
> ```
> 
> ---
> 
> #### Gotcha B: The "Stuck Loading Flag" Omission Bug
> *"Why did users report that clicking 'Save' on a failed network request permanently locked the form with a spinning icon?"*  
> Developers often test that an error message renders (`expect(screen.getByText(/failed/i)).toBeVisible()`), but completely forget to test that `isLoading` resets to `false`. If `setIsLoading(false)` was placed in the `try` block rather than `finally`, the UI freezes permanently on failure.  
> **The Senior Standard:** Always assert the complete post-failure state tuple: `{ isLoading: false, hasError: true, data: previousState }`.

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / TypeScript Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Vitest / Jest assertions, Mock Service Worker (MSW), React Testing Library error states, Retry testing | Essential for building rock-solid test suites that guarantee application resilience under failure. |
| 🟡 **Moderate** | Used in ~40% of code | Async race condition simulation, Invariant fuzz testing, Chaos network fault injection | Critical for payment gateways, financial trading platforms, and enterprise data synchronizers. |
| 🔵 **Foundational / Engine** | Runtime internals | Microtask rejection lifecycle in test runners, Fake timer clock synchronization, Unhandled rejections in CI | Essential for test infrastructure architecture, CI/CD reliability, and Staff/Principal evaluations. |

---

## Core Concepts (20 Subtopics)

### Part 1 — Failure Paths as First-Class System Contracts `🟢 [Daily Driver]`

A function's contract is not just its happy path. The contract specifies what exceptions it throws, what rejection reasons it emits, and what fallback state it returns.

---

### Part 2 — Testing Synchronous Thrown Exceptions `🟢 [Daily Driver]`

Wrap the invoking function inside a lambda to prevent the test runner from crashing before assertion:
```js
expect(() => calculateDiscount(-10)).toThrow(RangeError);
```

---

### Part 3 — Testing Asynchronous Promise Rejections `🟢 [Daily Driver]`

Always `await` the rejection assertion:
```js
await expect(fetchUser("invalid-id")).rejects.toThrow(NotFoundError);
```

---

### Part 4 — Testing `try/catch` Fallbacks & Recovery States `🟢 [Daily Driver]`

When a service catches an error internally and returns a fallback value, test that the fallback matches the expected schema:
```js
const result = await getNewsWithFallback();
expect(result.isFallback).toBe(true);
```

---

### Part 5 — Deterministic Dependency Mocking `🟢 [Daily Driver]`

Use `mockRejectedValueOnce` or Mock Service Worker (MSW) to inject controlled failures (500 Server Error, 403 Forbidden) without requiring a live backend.

---

### Part 6 — Testing Observable User Behavior vs. Implementation Details `🟢 [Daily Driver]`

Assert that the user sees "Network Connection Failed" and a "Retry" button rather than asserting that `component.state.errorCounter === 1`.

---

### Part 7 — Comprehensive Error UI State Verification `🟢 [Daily Driver]`

Test the entire state lifecycle:
$$\text{IDLE} \xrightarrow{\text{click}} \text{LOADING} \xrightarrow{\text{500 error}} \text{ERROR} \text{ (loading resets to false)}$$

---

### Part 8 — Testing Retry Recovery Workflows `🟢 [Daily Driver]`

Mock failure on attempt 1 and success on attempt 2:
```js
api.fetchData
  .mockRejectedValueOnce(new Error("Transient Drop"))
  .mockResolvedValueOnce({ data: "Success" });
```

---

### Part 9 — Testing Secondary Retry Failures `🔴 [Production-Critical]`

Verify that if all retry attempts fail, the system does not crash or loop infinitely, but instead displays a persistent, actionable fallback error UI.

---

### Part 10 — Testing Error Boundary Containment `🟢 [Daily Driver]`

Render a broken child component inside an Error Boundary and assert that sibling navigation and headers remain fully interactive while the broken component renders fallback UI.

---

### Part 11 — Testing HTTP Status Classification to Domain Errors `🟢 [Daily Driver]`

Verify mapping contracts:
- HTTP 401 $\implies$ `AuthenticationError`
- HTTP 404 $\implies$ `NotFoundError`
- HTTP 422 $\implies$ `ValidationError`

---

### Part 12 — Testing Schema Violation & Corrupted Response Resilience `🟢 [Daily Driver]`

Simulate the backend returning malformed JSON or an object missing required keys, asserting that the runtime schema parser (Zod) throws a clean `PayloadSchemaError`.

---

### Part 13 — Testing Physical Network Drops vs. HTTP Failures `🟢 [Daily Driver]`

Simulate physical network drops (`TypeError: Failed to fetch`) and verify that the UI renders an offline banner rather than a generic server error.

---

### Part 14 — Testing Request Timeouts Without Flaky `setTimeout` `🟢 [Daily Driver]`

Use fake timers (`vi.useFakeTimers()`) and advance the clock (`vi.advanceTimersByTime(5000)`) to trigger timeout rejections deterministically without slowing down CI runs.

---

### Part 15 — Testing Cancellation & Stale Race Conditions `🔴 [Production-Critical]`

Simulate two overlapping search requests where the first request finishes *after* the second request, asserting that the final UI renders results from query 2.

---

### Part 16 — Testing State Cleanup After Failure `🔴 [Production-Critical]`

Assert that in-flight flags (`isSubmitting = false`, `disabled = false`) are properly reset in `finally` blocks when an exception is thrown.

---

### Part 17 — Testing Partial Dashboard Failures (Graceful Degradation) `🟢 [Daily Driver]`

Mock failure on an optional recommendations widget while keeping user profile data successful, asserting that the page renders with a localized widget placeholder.

---

### Part 18 — Testing Telemetry Dispatch & Over-Reporting Prevention `🟢 [Daily Driver]`

Assert that `telemetry.reportError` was called for unexpected 500 errors, but was *never* called for expected 422 validation errors.

---

### Part 19 — The Bug $\to$ Failing Regression Test $\to$ Fix Workflow `🟢 [Daily Driver]`

1. Reproduce the production defect.
2. Write a minimal failing test that reproduces the defect.
3. Confirm the test fails in CI.
4. Implement the bugfix.
5. Confirm the test passes and commit to git as a permanent regression guard.

---

### Part 20 — 10-Point Senior Error Testing & Regression Checklist `🟢 [Daily Driver]`

```text
1. Are all async rejection assertions strictly awaited (await expect().rejects)?
2. Are specific error classes/codes asserted rather than generic truthy checks?
3. Is isLoading/isSubmitting verified to reset to false after every failure?
4. Are transient retry flows tested with multi-step mock resolution sequences?
5. Are secondary retry exhaustion paths tested for infinite loop prevention?
6. Are fake timers (vi.useFakeTimers) used for timeout testing instead of real delays?
7. Are race conditions tested by resolving asynchronous responses out-of-order?
8. Are Error Boundaries tested to ensure sibling components remain functional?
9. Is telemetry verified to report unexpected exceptions while ignoring 422 validation?
10. Is every production bug accompanied by an automated regression test in git?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Test Level | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Unit Failure Tests** | Validation algorithms, custom error subclasses, status code mappers, reducer invariants. | Full end-to-end user navigation flows across multiple views. | Fast execution (1ms), but does not verify UI rendering. | Integration tests. |
| **Integration Error Tests (RTL + MSW)** | Form validation error messages, retry button triggers, widget fallback rendering. | Testing low-level V8 memory leaks or CSS layout shifts. | Moderate speed; mocks network boundaries cleanly. | End-to-End tests. |
| **End-to-End Chaos Tests (Playwright)** | Complete offline mode verification, payment gateway timeout simulations. | Testing individual utility function edge cases (too slow). | Slow execution (seconds); requires running test servers. | Unit / Integration tests. |
| **Contract Schema Tests (Zod / Pact)** | Validating API response payload contracts against backend schemas. | Simple static mock data where schemas never change. | Requires maintaining shared TypeScript schema definitions. | Manual TS interfaces. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Comprehensive Test Suite for Enterprise Form with Vitest & RTL Patterns
```tsx
import React, { useState } from 'react';

// ==========================================
// 1. DATA CONTRACTS & DOMAIN ERROR
// ==========================================
export class PaymentError extends Error {
  constructor(message: string, public readonly code: 'CARD_DECLINED' | 'NETWORK_TIMEOUT' | 'INVALID_AMOUNT') {
    super(message);
    this.name = 'PaymentError';
  }
}

export interface PaymentService {
  processPayment: (payload: { amount: number; cardLast4: string }) => Promise<{ txId: string }>;
}

// ==========================================
// 2. CHECKOUT COMPONENT UNDER TEST
// ==========================================
export function EnterpriseCheckoutForm({ paymentService }: { paymentService: PaymentService }) {
  const [amount, setAmount] = useState<number>(100);
  const [cardLast4, setCardLast4] = useState<string>('4242');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successTxId, setSuccessTxId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessTxId(null);

    try {
      if (amount <= 0) {
        throw new PaymentError('Payment amount must be greater than zero', 'INVALID_AMOUNT');
      }

      const res = await paymentService.processPayment({ amount, cardLast4 });
      setSuccessTxId(res.txId);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected payment failure occurred.');
    } finally {
      // 🟢 Mandatory state cleanup: loading must reset on both success and failure!
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <h3>Secure Checkout</h3>

      {errorMessage && <div role="alert" className="error-banner">⚠️ {errorMessage}</div>}
      {successTxId && <div className="success-banner">✅ Transaction Approved: {successTxId}</div>}

      <div className="form-field">
        <label htmlFor="amount">Amount ($)</label>
        <input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          disabled={isLoading}
        />
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Processing Payment...' : 'Pay Now'}
      </button>
    </form>
  );
}
```

---

## 🧠 Part 06 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: Unawaited Async Test Rejection
```js
// Scenario: What is the exact execution outcome of this test block?
async function brokenService() {
  throw new Error("💥 Catastrophic Database Crash");
}

function runTestSync() {
  // Test without await:
  const testPromise = brokenService();
  console.log("1. Test finished synchronously");
  return testPromise;
}

runTestSync().catch(err => console.log("2. Async rejection caught later:", err.message));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
1. Test finished synchronously
2. Async rejection caught later: 💥 Catastrophic Database Crash
```
**Why:** Step 1 executes immediately because `runTestSync` did not wait for the promise to settle. This proves why omitting `await` in test runners causes false-positive test passes.
</details>

---

### Prediction Challenge 2: State Reset Invariant Verification
```js
let state = { loading: false, error: null, data: null };

async function executeAction(shouldFail) {
  state.loading = true;
  state.error = null;

  try {
    if (shouldFail) throw new Error("API Failure");
    state.data = "Payload";
  } catch (err) {
    state.error = err.message;
  } finally {
    state.loading = false;
  }
}

executeAction(true).then(() => {
  console.log("Is Loading?:", state.loading);
  console.log("Has Error?:", state.error);
});
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Is Loading?: false
Has Error?: API Failure
```
**Why:** The `finally` block guarantees `loading` resets to `false` even when an exception is thrown inside `try`.
</details>

---

### Prediction Challenge 3: Retry Sequence Simulation
```js
let attempts = 0;
const flakyFn = async () => {
  attempts++;
  if (attempts < 2) throw new Error("Attempt 1 Failed");
  return "Attempt 2 Succeeded";
};

async function testRetry() {
  let result = null;
  for (let i = 0; i < 2; i++) {
    try {
      result = await flakyFn();
      break;
    } catch (e) {
      // Continue to attempt 2
    }
  }
  console.log("Final Result:", result);
  console.log("Total Attempts:", attempts);
}

testRetry();
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Final Result: Attempt 2 Succeeded
Total Attempts: 2
```
**Why:** The loop catches the first failure and successfully recovers on attempt 2.
</details>

---

### Prediction Challenge 4: Race Condition Out-of-Order Resolution
```js
let finalRenderedText = "";

function mockSearch(query, delayMs) {
  setTimeout(() => {
    finalRenderedText = `Results for: ${query}`;
  }, delayMs);
}

// User types "re" (slow, 50ms), then types "react" (fast, 10ms)
mockSearch("re", 50);
mockSearch("react", 10);

setTimeout(() => {
  console.log("UI at 20ms:", finalRenderedText);
}, 20);

setTimeout(() => {
  console.log("UI at 60ms (Stale Overwrite!):", finalRenderedText);
}, 60);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
UI at 20ms: Results for: react
UI at 60ms (Stale Overwrite!): Results for: re
```
**Why:** Without cancellation or request sequencing, the slower older request finishes last, overwriting the fresh query results.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** Why must you write `await expect(asyncFunction()).rejects.toThrow()` instead of omitting the `await`?  
<details>
<summary><strong>Answer</strong></summary>
`expect().rejects` returns an un-settled Promise. If you omit `await`, the test function finishes synchronously and the test runner marks the test as passed immediately, without ever waiting for or evaluating the rejection. If the function fails to reject as expected, the test will pass as a false positive.
</details>

**Q2:** What is the difference between testing synchronous errors and asynchronous rejections?  
<details>
<summary><strong>Answer</strong></summary>
Synchronous functions throw immediately and must be wrapped in a callback function (`expect(() => fn()).toThrow()`) so the exception is captured inside the test assertion. Asynchronous functions return a rejected Promise and must be asserted using `await expect(asyncFn()).rejects.toThrow()`.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** What is the "Stuck Loading Flag" bug, and how do you write tests to prevent it?  
<details>
<summary><strong>Answer</strong></summary>
The "Stuck Loading Flag" bug occurs when an asynchronous operation sets `isLoading = true`, throws an exception, and fails to reset `isLoading = false` because the reset call was placed in the `try` block instead of a `finally` block. To prevent this, write tests that simulate network failure and explicitly assert that `state.isLoading === false` and form submit buttons are re-enabled.
</details>

**Q4:** How do you test retry mechanisms with exponential backoff without slowing down CI pipelines?  
<details>
<summary><strong>Answer</strong></summary>
Use fake timers (`vi.useFakeTimers()`) provided by Vitest/Jest. Rather than waiting for real wall-clock delays ($1\text{s}, 2\text{s}, 4\text{s}$), advance the fake timer clock programmatically using `vi.advanceTimersByTimeAsync(ms)` to execute retries instantly in milliseconds while verifying backoff timing.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** How do you write an integration test to detect search input race conditions where out-of-order network responses overwrite UI state?  
<details>
<summary><strong>Answer</strong></summary>
1. Mock the API search endpoint using Mock Service Worker (MSW) or Vitest spies with manual deferred Promises (`let resolveFirst, resolveSecond`).  
2. Trigger the first search query ("re").  
3. Trigger the second search query ("react").  
4. Resolve the second query's Promise first (`resolveSecond(['React Hooks', 'React Router'])`), and assert the UI renders "React Hooks".  
5. Resolve the first query's Promise second (`resolveFirst(['Regex Tutorial'])`).  
6. Assert that the UI still displays "React Hooks" and that the stale "Regex Tutorial" response was discarded or aborted.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How do you design a comprehensive Chaos Engineering & Resilience Testing Pipeline for mission-critical enterprise SPAs (e.g. Banking, Healthcare)?  
<details>
<summary><strong>Answer</strong></summary>
1. **Contract & Schema Fuzzing:** Automated integration tests that inject corrupted, partial, and unexpected JSON payloads into client state parsers to guarantee Zod schema assertions trigger graceful fallbacks.  
2. **Network Chaos Injection:** Intercept network requests via Service Workers or Playwright proxying to randomly inject HTTP 500s, 429 rate limits, DNS failures, and $10\text{s}$ latency spikes.  
3. **State Machine Invariant Verification:** Automated model-based testing that traverses every possible state transition (`IDLE \to LOADING \to ERROR \to RETRY \to RECOVERY`) and asserts that invariant rules (e.g. zero PII leakage, zero stuck spinners, zero duplicate billing IDs) hold across 100% of paths.
</details>

---

## 🛠️ Senior Architecture Challenge: Automated Error Assertion & State Machine Test Runner

```js
// See runnable implementation in examples/06-testing-error-paths-complete-architecture.js
```

---

## Key Takeaways
1. **Always Await Rejections:** Never omit `await` on `.rejects.toThrow()`.
2. **Test Post-Failure State:** Verify `isLoading === false` and form controls re-enable.
3. **Mock Controlled Failures:** Use deterministic mock rejection sequences for retry testing.
4. **Simulate Out-of-Order Races:** Ensure slower older requests never overwrite fresh state.
5. **Bug-to-Test-to-Fix Loop:** Guard every production fix with a permanent regression test.

---

[⬅️ Part 05: Production Error Architecture & Telemetry](./05-production-monitoring-telemetry-sentry.md) | [📚 KPI 10 Index](./README.md) | [Part 07: Advanced Debugging Scenarios & Stale State ➡️](./07-advanced-debugging-race-conditions-closures.md)
