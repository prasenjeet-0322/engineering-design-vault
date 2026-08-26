# KPI 10 — Part 01: Error Mental Model, Failure Taxonomy & `try` / `catch` / `finally`

[📚 KPI 10 Index](./README.md) | [Part 02: Error Objects, Custom Errors & Error.cause ➡️](./02-error-objects-custom-errors-cause.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Core Construct / Concept | Operational Mechanism | Scope & Propagation | Modifies Call Stack? | Senior Production Standard |
|---|---|---|---|---|
| **`throw expr`** | Halts current block execution; initiates stack unwinding searching for nearest enclosing `catch`. | Moves upward through call stack | Unwinds Stack Frames | 🟢 **Throw Error Instances**: Always throw `new Error()`, never raw strings or numbers. |
| **`try { ... }`** | Establishes an execution boundary monitored by the JS runtime for synchronous thrown exceptions. | Block-scoped | Monitored Frame | 🟢 **Scope Tightness**: Wrap only the specific fallible operation, not the entire application. |
| **`catch (err)`** | Traps thrown error, halts unwinding, binds error object to parameter for recovery/logging. | Block-scoped | Halts Unwinding | 🔴 **Never Swallow**: Always log, report to telemetry, or re-throw unhandled error types. |
| **`finally { ... }`** | Guaranteed teardown execution after `try` and `catch` finish, regardless of success, failure, or `return`. | Block-scoped | Always Executes | 🟢 **Teardown Only**: Use for resetting flags (`setLoading(false)`), unlocking mutexes, closing sockets. |
| **`finally` Return Hazard**| A `return` or `throw` inside `finally` completely overwrites and suppresses any `return` or `throw` in `try`/`catch`! | Overrides Ancestors | Hijacks Control Flow | 🔴 **Fatal Antipattern**: Never place `return` or `throw` inside a `finally` block! |
| **Async Disconnect** | `try/catch` cannot catch errors thrown inside asynchronous callbacks (`setTimeout`, event listeners). | Event Loop Boundary | Call Stack Lost | 🔴 **Async Isolation**: Use Promise `.catch()` or `try/catch` with `await` across async boundaries. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: The Async `try/catch` Void & The `finally` Hijack
> 
> #### Gotcha A: The Asynchronous Callback Void Trap
> *"Why does the following `try/catch` fail to catch the error, crashing the process with an unhandled exception?"*  
> ```js
> // ❌ FATAL RUNTIME CRASH:
> try {
>   setTimeout(() => {
>     throw new Error("💥 Database connection timeout!");
>   }, 100);
> } catch (error) {
>   console.error("Caught error:", error.message); // NEVER REACHED!
> }
> ```
> **Deep Architectural Explanation:**  
> 1. `try/catch` operates strictly on the **synchronous call stack**.  
> 2. When `setTimeout` is called, it registers a timer with the host environment (Web APIs / libuv) and finishes immediately.  
> 3. The `try/catch` block exits, and its stack frame is popped off the JavaScript engine execution stack.  
> 4. 100ms later, the macrotask timer callback is pushed onto the Call Stack from the Task Queue. When it throws, the enclosing `try/catch` has been gone for 100ms. The error bubbles to the global top-level, crashing Node.js or triggering `window.onerror`.  
> 4. **The Senior Standard (Async/Await or Promise encapsulation):**  
> ```js
> // ✅ RESOLVED VIA ASYNC PROMISE BOUNDARY:
> const delay = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error("💥 Timeout!")), ms));
> 
> async function handleOperation() {
>   try {
>     await delay(100);
>   } catch (error) {
>     console.error("Successfully caught async error:", error.message); // ✅ Trapped cleanly!
>   }
> }
> ```
> 
> ---
> 
> #### Gotcha B: The `finally` Control-Flow Hijack Trap
> *"What does `testHijack()` return, and why does the thrown error disappear?"*  
> ```js
> function testHijack() {
>   try {
>     throw new Error("Fatal failure in database query");
>   } catch (err) {
>     throw err; // Re-throw fatal error
>   } finally {
>     return "Everything is fine! 😇"; // 💥 HIJACKS AND SUPPRESSES THE THROWN ERROR!
>   }
> }
> console.log(testHijack()); // Output: "Everything is fine! 😇" (Error is completely swallowed!)
> ```
> **Deep Architectural Explanation:**  
> The ECMAScript specification dictates that abrupt completions (`return`, `throw`, `break`, `continue`) in a `finally` block supersede any pending abrupt completions from `try` or `catch`. A `return` in `finally` discards the active exception object from the engine's internal execution state register.

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / TypeScript Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | API fetch error handling, form validation traps, loading cleanup in `finally`, React Error Boundaries | Essential for writing resilient, fault-tolerant production applications that recover gracefully. |
| 🟡 **Moderate** | Used in ~30% of code | Custom Error hierarchies, Domain translation layers, Circuit breaker retry loops | Critical for clean domain architecture, enterprise SDKs, and backend microservice communication. |
| 🔵 **Foundational / Engine** | Runtime internals | Call stack unwinding mechanics, V8 error capture, Event loop microtask rejection tracking | Essential for debugging memory leaks, unhandled promise rejections, and Staff/Principal reviews. |

---

## Core Concepts (20 Subtopics)

### Part 1 — The Senior Debugging Mental Model: Symptom vs. Root Cause `🟢 [Daily Driver]`

Junior debugging fixes symptoms (adding `user?.name ?? ""` to silence a `TypeError`). Senior debugging traces the root cause: *Why was `user` undefined in state? Did the API schema change? Did the Reducer drop relational state during normalisation?*

---

### Part 2 — The 3-Tier Failure Taxonomy `🟢 [Daily Driver]`

1. **Programmer Errors:** Syntax errors, logic bugs, unhandled nullish types. Prevent via TypeScript, linters, unit tests.
2. **Expected Runtime Failures:** Network timeouts, invalid user inputs, 404 missing resources. Model with typed domain results or standard error handlers.
3. **System / External Failures:** Service outages, out-of-memory, browser storage exhaustion. Implement fallback UIs and circuit breakers.

---

### Part 3 — Syntax Errors vs. Runtime Exceptions `🟢 [Daily Driver]`

- **Syntax Errors:** Occur during V8 engine parsing/compilation *before* execution begins. Cannot be caught by `try/catch`.
- **Runtime Exceptions:** Occur dynamically during execution when an invalid operation is attempted (`null.foo()`). Can be trapped with `try/catch`.

---

### Part 4 — Logic Errors: Silent State Corruption `🔴 [Production-Critical]`

Logic errors do not throw exceptions. The code runs to completion, returning incorrect business calculations (e.g. subtracting taxes instead of adding). Guard against logic errors with invariant assertions and property-based unit testing.

---

### Part 5 — The Anatomy of JavaScript `Error` Objects `🟢 [Daily Driver]`

A standard `Error` instance contains:
- `name`: Error constructor name (e.g. `'TypeError'`).
- `message`: Human-readable description.
- `stack`: V8 execution stack trace string showing exact file, line, and column numbers.

---

### Part 6 — Built-in Standard Error Types `🟢 [Daily Driver]`

- `TypeError`: Inappropriate type or invalid invocation (`123()`).
- `ReferenceError`: Non-existent variable lookup in lexical scope (`foo`).
- `RangeError`: Numeric value out of valid bounds (e.g. `new Array(-1)` or stack overflow recursion).
- `SyntaxError`: Code parsing violations (e.g. `JSON.parse("invalid")`).
- `URIError`: Malformed URI decoding (`decodeURIComponent("%")`).

---

### Part 7 — The `throw` Statement as Control Flow `🟢 [Daily Driver]`

`throw` immediately stops linear execution and initiates stack unwinding. Always throw concrete `Error` objects rather than primitives (`throw "error"`) so stack traces are captured:
```js
if (!orderId) throw new Error("Order ID is strictly required");
```

---

### Part 8 — Call Stack Unwinding & Propagation Dynamics `🔵 [Foundational / Engine]`

When an error is thrown, the engine traverses backward through active call stack frames until it finds an enclosing `try/catch`. If none is found, it terminates at the global environment as an uncaught exception.

---

### Part 9 — `try...catch` Scope Boundaries & Tightness `🟢 [Daily Driver]`

Keep `try` blocks narrowly scoped around fallible operations. Wrapping 200 lines of unrelated logic in a single `try` block conceals the exact failure point.

---

### Part 10 — The Async `try/catch` Event Loop Disconnect `🔴 [Production-Critical]`

`try/catch` cannot trap errors thrown inside asynchronous callbacks (`setTimeout`, DOM events, un-awaited Promises). Always use `await` with `try/catch` or wrap callback APIs in explicit Promise executors.

---

### Part 11 — The Silent Error Swallow Antipattern `🔴 [Production-Critical]`

```js
// ❌ SILENT CORRUPTION:
try { doCriticalMutation(); } catch (e) {} // Swallows bugs silently!
```
Never leave `catch` blocks empty. At minimum, log to console, dispatch to telemetry (Sentry), or re-throw.

---

### Part 12 — Architectural Layered Error Translation `🟢 [Daily Driver]`

Low-level technical errors (HTTP 409) should be caught and translated at domain boundaries into meaningful domain exceptions (`DuplicateEmailException`) before reaching UI presentation.

---

### Part 13 — `return` vs. `throw`: Contract Violations vs. Valid Absence `🟢 [Daily Driver]`

- **`return null / undefined`:** Expected domain outcomes (e.g., user not found in search query).
- **`throw Error`:** Contract violations or unrecoverable operational failures (e.g., database connection lost, invalid parameter types).

---

### Part 14 — `finally` Block Guarantees: Always-Executed Teardown `🟢 [Daily Driver]`

The `finally` block is guaranteed to execute whether `try` succeeds, `catch` handles an error, or an uncaught exception is thrown. Ideal for cleaning up loading spinners, canceling subscriptions, and unlocking mutexes.

---

### Part 15 — The `finally` Control-Flow Hijack Hazard `🔴 [Production-Critical]`

Never use `return`, `throw`, `break`, or `continue` inside `finally`. Doing so overrides and silently deletes active exceptions or returns from the preceding `try` and `catch` blocks.

---

### Part 16 — Resource Teardown Patterns `🟢 [Daily Driver]`

```js
const lock = acquireLock();
try {
  processTransaction();
} finally {
  lock.release(); // Guaranteed lock release
}
```

---

### Part 17 — Developer Telemetry vs. Sanitized User Messages `🟢 [Daily Driver]`

Log complete raw error names, messages, and stack traces to backend telemetry (Sentry, Datadog), but display clean, safe, actionable recovery instructions to end users.

---

### Part 18 — Conditional Catch Re-Throwing `🟢 [Daily Driver]`

Catch only errors you know how to handle; re-throw unknown or unexpected exceptions:
```js
try {
  saveDocument();
} catch (err) {
  if (err instanceof NetworkError) {
    showOfflineBanner();
  } else {
    throw err; // Re-throw unknown errors for global boundaries
  }
}
```

---

### Part 19 — React Error Boundaries vs. `try/catch` `🟢 [Daily Driver]`

`try/catch` works for imperative event handlers and async hooks. React Class Error Boundaries (`componentDidCatch`) are required to catch declarative rendering errors in JSX tree reconciliation.

---

### Part 20 — 10-Point Senior Error Handling Checklist `🟢 [Daily Driver]`

```text
1. Are only concrete Error instances thrown (never raw strings, numbers, or null)?
2. Are try blocks tightly scoped around only the specific fallible operations?
3. Are catch blocks free of empty swallowing (always logging, reporting, or re-throwing)?
4. Are async operations properly awaited inside try blocks to prevent unhandled rejections?
5. Is finally reserved exclusively for side-effect cleanups with ZERO return/throw statements?
6. Are technical exceptions translated into domain-meaningful errors at service boundaries?
7. Is return null used for expected domain absence instead of throwing exceptions?
8. Are raw stack traces hidden from end-user UI messages and forwarded to telemetry?
9. Are unknown exception types re-thrown in catch blocks for upstream boundaries?
10. Is defensive programming balanced to avoid masking genuine architectural bugs?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Mechanism | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **`try / catch / finally`** | Imperative synchronous or `async/await` operations with potential unrecoverable exceptions. | Functional data transformation chains; expected nullable domain searches. | Introduces V8 compiler de-optimization boundaries if over-used across millions of loops. | Result Tuple Pattern, Either Monad. |
| **Result Tuple Pattern (`[err, data]`)** | High-frequency domain services where expected failures are part of normal control flow. | Simple standard JavaScript scripts or third-party libraries designed to throw. | Requires manual unwrapping checks at every call site (`if (err) ...`). | `try/catch`. |
| **Global Error Traps (`window.onerror`)** | Last-resort telemetry logging and crash analytics before application unloads. | Normal local application error recovery and flow control. | Lacks granular execution context; cannot recover localized component state. | React Error Boundaries. |
| **React Error Boundaries** | Declarative JSX rendering failure containment and fallback UI presentation. | Event handlers (`onClick`), asynchronous `fetch` calls, timer callbacks. | Only catches errors thrown during React render, lifecycle, and constructor phases. | Hook-level `try/catch/finally`. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Resilient Async Data Fetching Hook with Guaranteed `finally` Cleanup
```tsx
import { useState, useCallback } from 'react';

// ==========================================
// 1. DOMAIN ERROR TYPES & CONTRACTS
// ==========================================
export class ApiNetworkError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'ApiNetworkError';
  }
}

export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

// ==========================================
// 2. PRODUCTION RESILIENT FETCH HOOK (Core)
// ==========================================
export function useResilientFetch<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: false,
    error: null
  });

  const execute = useCallback(async (fetcher: () => Promise<T>): Promise<T | null> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // 🟢 Fallible Async Execution
      const result = await fetcher();
      setState({ data: result, isLoading: false, error: null });
      return result;
    } catch (err: unknown) {
      // 🟢 Layered Domain Error Translation & Telemetry
      let userFriendlyMessage = 'An unexpected system error occurred. Please try again.';

      if (err instanceof ApiNetworkError) {
        userFriendlyMessage = `Network Error (${err.statusCode}): ${err.message}`;
      } else if (err instanceof Error) {
        userFriendlyMessage = err.message;
      }

      // Dispatch to telemetry logger
      console.error('[Telemetry Log]', { error: err, timestamp: new Date().toISOString() });

      setState({ data: null, isLoading: false, error: userFriendlyMessage });
      return null;
    } finally {
      // 🟢 GUARANTEED TEARDOWN: Clean up loading indicators even on fatal crashes
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  return { ...state, execute };
}

// ==========================================
// 3. REACT USER PROFILE COMPONENT
// ==========================================
export function UserProfileCard({ userId }: { userId: string }) {
  const { data, isLoading, error, execute } = useResilientFetch<{ id: string; name: string; email: string }>();

  const handleLoadUser = () => {
    execute(async () => {
      if (!userId) throw new Error('User ID is strictly required');

      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new ApiNetworkError('Failed to fetch user profile', response.status);
      }
      return response.json();
    });
  };

  return (
    <div className="profile-card">
      <button onClick={handleLoadUser} disabled={isLoading}>
        {isLoading ? 'Loading Profile...' : 'Fetch User'}
      </button>

      {error && <div className="error-alert">⚠️ {error}</div>}
      {data && (
        <div className="user-details">
          <h4>{data.name}</h4>
          <p>{data.email}</p>
        </div>
      )}
    </div>
  );
}
```

---

## 🧠 Part 01 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: The `finally` Execution Guarantee
```js
function testFinally() {
  try {
    console.log("1. Inside try");
    throw new Error("💥 Boom!");
  } catch (err) {
    console.log("2. Inside catch");
    return "RESULT_CATCH";
  } finally {
    console.log("3. Inside finally");
  }
}

const res = testFinally();
console.log("4. Function returned:", res);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
1. Inside try
2. Inside catch
3. Inside finally
4. Function returned: RESULT_CATCH
```
**Why:** The `finally` block executes *after* the `catch` block finishes preparing its return value, but *before* control returns to the outer caller.
</details>

---

### Prediction Challenge 2: The `finally` Return Hijack
```js
function testHijack() {
  try {
    throw new Error("Fatal crash");
  } catch (err) {
    return "FROM_CATCH";
  } finally {
    return "FROM_FINALLY"; // 💥 Overrides previous return!
  }
}

console.log("Output:", testHijack());
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Output: FROM_FINALLY
```
**Why:** Placing a `return` in `finally` hijacks the engine's completion record and discards the return value generated in `catch`.
</details>

---

### Prediction Challenge 3: Synchronous vs. Asynchronous `try/catch`
```js
let status = "START";

try {
  setTimeout(() => {
    try {
      throw new Error("Timer Error");
    } catch (innerErr) {
      status = "CAUGHT_INNER";
    }
  }, 10);
} catch (outerErr) {
  status = "CAUGHT_OUTER";
}

setTimeout(() => {
  console.log("Final status:", status);
}, 20);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Final status: CAUGHT_INNER
```
**Why:** The `outerErr` block never catches the timer error because the outer `try/catch` finished 10ms prior. The inner `try/catch` inside the timer callback successfully traps it.
</details>

---

### Prediction Challenge 4: Conditional Re-Throwing
```js
class CustomAuthError extends Error {}

function authenticate(role) {
  try {
    if (role === "GUEST") throw new CustomAuthError("Guest not allowed");
    if (role === "UNKNOWN") throw new RangeError("Invalid role value");
  } catch (err) {
    if (err instanceof CustomAuthError) {
      return "Handled Auth Error";
    }
    throw err; // Re-throw unknown RangeError
  }
}

console.log("Guest:", authenticate("GUEST"));

try {
  authenticate("UNKNOWN");
} catch (e) {
  console.log("Caught upstream:", e.name);
}
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Guest: Handled Auth Error
Caught upstream: RangeError
```
**Why:** `CustomAuthError` was handled locally in catch. The unhandled `RangeError` was re-thrown to the upstream caller.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is the difference between `throw new Error("msg")` and `throw "msg"`?  
<details>
<summary><strong>Answer</strong></summary>
Throwing `new Error("msg")` creates a full JavaScript Error object containing standard properties (`name`, `message`) and captures a complete V8 call stack trace (`stack`). Throwing a primitive string (`throw "msg"`) does not capture a stack trace, making debugging in production telemetry nearly impossible.
</details>

**Q2:** When does the `finally` block execute in a `try...catch...finally` statement?  
<details>
<summary><strong>Answer</strong></summary>
The `finally` block is guaranteed to execute immediately after `try` completes (if no error occurred) or immediately after `catch` completes (if an error occurred and was handled), even if `try` or `catch` contains a `return` statement.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** Why can't a synchronous `try...catch` block catch an error thrown inside a `setTimeout` callback?  
<details>
<summary><strong>Answer</strong></summary>
`try...catch` only monitors the active synchronous call stack. When `setTimeout` is invoked, it schedules a timer in the browser/Node.js host environment and returns immediately; the `try` block finishes and its stack frame is popped. The callback executes in a completely new call stack on a future tick of the Event Loop, long after the `try...catch` block has exited.
</details>

**Q4:** What happens if you execute a `return` statement inside a `finally` block?  
<details>
<summary><strong>Answer</strong></summary>
A `return` statement in a `finally` block overrides and discards any previous `return` value or pending thrown exception from the `try` or `catch` blocks, causing errors to be silently swallowed.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** How do you implement architectural layered error handling across Network, Domain, and UI layers?  
<details>
<summary><strong>Answer</strong></summary>
By catching low-level technical errors (e.g. HTTP status codes, JSON parse errors) at infrastructure boundaries and mapping them into domain-specific error classes (e.g. `UserNotFoundError`, `InsufficientFundsError`). The domain/application layer evaluates business recovery (retry, fallback), while the UI layer traps domain errors to render localized, user-friendly notices without leaking technical details.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** Compare the performance and architectural trade-offs of JavaScript Exception Handling (`try/catch/throw`) vs. the Result Tuple Pattern (`[error, result]`) in high-throughput engines.  
<details>
<summary><strong>Answer</strong></summary>
1. **Exception Handling (`throw`):** Constructing `new Error()` and capturing stack traces (`Error.captureStackTrace`) is CPU and memory intensive because the V8 engine must inspect and serialize current stack frames. `throw` also triggers stack unwinding, which disrupts inline JIT optimization pipelines. Best reserved for exceptional, unrecoverable failures.  
2. **Result Tuple Pattern (`[err, data]`):** Returns plain values without stack unwinding or exception allocation overhead. It forces explicit local error handling at every call site (Go/Rust style). Best for high-frequency domain workflows, parsing pipelines, and tight loops where failure is an expected outcome.
</details>

---

## 🛠️ Senior Architecture Challenge: Enterprise Resilient HTTP Client with Layered Failure Translation

```js
// See runnable implementation in examples/01-error-mental-model-taxonomy-try-catch-finally.js
```

---

## Key Takeaways
1. **Failure Taxonomy:** Distinguish programmer bugs, expected runtime failures, and system outages.
2. **Concrete Error Instances:** Always throw `new Error()` with captured stack traces.
3. **Async Awareness:** Use `await` within `try/catch` across async boundaries.
4. **Clean `finally` Discipline:** Teardown resources only; never `return` or `throw` in `finally`.
5. **Layered Translation:** Convert technical network/database errors into clean domain models.

---

[📚 KPI 10 Index](./README.md) | [Part 02: Error Objects, Custom Errors & Error.cause ➡️](./02-error-objects-custom-errors-cause.md)
