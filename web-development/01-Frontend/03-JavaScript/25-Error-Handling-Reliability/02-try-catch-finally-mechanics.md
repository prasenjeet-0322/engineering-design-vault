# KPI 25 — Part 02: `try`, `catch`, `finally` & Synchronous Error Handling

[⬅️ Part 01: Errors, Exceptions & Failure Model](./01-errors-exceptions-failure-model.md) | [📚 KPI 25 Index](./README.md) | [Part 03: Error Propagation & Custom Errors ➡️](./03-error-propagation-custom-errors.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Mechanism | Execution Rule | Key Failure Mode & Risk | Senior Engineering Standard |
|---|---|---|---|
| **`try` Block** | Executes synchronous statements, halting immediately upon encountering a `throw`. | Remaining statements inside the `try` block are permanently abandoned. | 🟢 Scope `try` blocks narrowly around specific operations that can actually throw. |
| **`catch (err)` Block** | Intercepts any thrown value from the `try` block, binding it to the `err` variable. | Silently swallowing exceptions (`catch {}`) masks bugs and corrupts app state. | 🔴 **CRITICAL:** Always Handle, Log, Transform, or Re-throw. Never swallow errors silently. |
| **`finally` Block** | Guaranteed to execute after `try` (and `catch`), even when `return` or `throw` occurs. | Writing `return` inside `finally` silently suppresses thrown exceptions. | 🔴 **NEVER return or throw inside `finally`:** Use strictly for resource/state cleanup. |
| **Re-throwing (`throw err`)** | Passes unhandled exception types up the call stack to higher architectural boundaries. | Catching every error locally prevents global error telemetry from logging crashes. | 🟢 Catch selectively via `instanceof`; re-throw unexpected programmer/system errors. |
| **`Error.cause` Chaining** | Wraps low-level errors inside domain errors while preserving root cause (`{ cause: err }`). | Overwriting errors without `cause` destroys the original V8 stack trace. | 🟢 Use `new DomainError("High-level message", { cause: originalError })`. |
| **Synchronous Boundary** | `try/catch` cannot catch exceptions thrown in detached callbacks (`setTimeout`, events). | Unhandled exceptions in timer callbacks bypass surrounding synchronous `try/catch`. | 🔴 Wrap internal callback bodies in their own `try/catch` or use `async/await`. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: `finally` Return Masking & Asynchronous Catch Traps
> 
> #### Gotcha A: `return` Inside `finally` Overriding and Silently Suppressing Thrown Exceptions
> *"Why did our critical authentication failure never throw an error and return 'OK' instead?"*  
> ```js
> // ❌ DISASTROUS RETURN INSIDE FINALLY:
> function authenticateUser(credentials) {
>   try {
>     if (!credentials.token) {
>       // 1. Throws critical authentication exception:
>       throw new Error("UNAUTHORIZED: Invalid security token!");
>     }
>     return "AUTH_SUCCESS";
>   } catch (err) {
>     console.error("Auth failed:", err.message);
>     // 2. Re-throws error to halt user login:
>     throw err;
>   } finally {
>     // 3. 💥 FATAL FLAW: return inside finally OVERRIDES any pending exception or return!
>     // The thrown exception is SILENTLY DISCARDED, and the function returns "CLEANUP_DONE"!
>     return "CLEANUP_DONE";
>   }
> }
> 
> const result = authenticateUser({}); // Returns "CLEANUP_DONE" with NO error thrown!
> ```
> **Deep Architectural Explanation:**  
> In the ECMAScript specification, the completion record of a `finally` block takes absolute precedence over any pending abrupt completion (such as a `throw` or preceding `return`) in the `try` or `catch` blocks. If `finally` executes a `return`, `break`, `continue`, or `throw`, the engine immediately discards the original exception, permanently silencing the failure and returning the `finally` value.  
> **The Senior Standard:** Restrict `finally` blocks exclusively to pure cleanup actions (e.g. `setLoading(false)`, `socket.close()`, `timer.clear()`). Never include control flow statements (`return`, `throw`, `break`) inside `finally`:
> ```js
> // ✅ CLEAN FINALLY BLOCK (Exception propagates cleanly):
> function authenticateUserSafe(credentials) {
>   try {
>     if (!credentials.token) throw new Error("UNAUTHORIZED: Invalid token!");
>     return "AUTH_SUCCESS";
>   } finally {
>     resetAuthSpinner(); // 🟢 Pure cleanup! Pending return or throw is preserved!
>   }
> }
> ```
> 
> ---
> 
> #### Gotcha B: The "Asynchronous try/catch Trap" with Timers & Event Callbacks
> *"Why did our global try/catch block fail to catch a crash inside `setTimeout`?"*  
> ```js
> // ❌ ATTEMPTING TO CATCH DETACHED ASYNCHRONOUS ERRORS:
> function startBackgroundWorker() {
>   try {
>     // 💥 FATAL MISCONCEPTION: try/catch is purely SYNCHRONOUS!
>     setTimeout(() => {
>       // This callback executes 1000ms LATER in a brand new call stack!
>       throw new Error("Worker background calculation crashed!");
>     }, 1000);
>   } catch (err) {
>     // 💥 THIS CATCH BLOCK NEVER RUNS!
>     console.error("Caught worker crash:", err.message);
>   }
> }
> ```
> **Deep Architectural Explanation:**  
> A `try/catch` statement only protects the code that executes **synchronously on the call stack** while control is physically inside the `try` block. When `setTimeout` is called, it merely registers a timer in the browser Web APIs and immediately returns. The `try/catch` finishes and leaves the call stack. One second later, the timer callback executes in a completely separate macrotask with its own fresh call stack; there is no active `catch` block on the stack, resulting in an unhandled exception crash.  
> **The Senior Standard:** Place the `try/catch` directly inside the asynchronous callback, or convert the API to Promises / `async/await`:
> ```js
> // ✅ METHOD 1: LOCAL CATCH INSIDE CALLBACK
> setTimeout(() => {
>   try {
>     doHeavyWorkerTask();
>   } catch (err) {
>     logError(err); // 🟢 Correctly intercepted in active execution frame!
>   }
> }, 1000);
> 
> // ✅ METHOD 2: PROMISE + ASYNC/AWAIT (Senior Standard)
> async function runWorkerAsync() {
>   try {
>     await delay(1000);
>     doHeavyWorkerTask();
>   } catch (err) {
>     logError(err); // 🟢 Intercepted via async/await promise rejection!
>   }
> }
> ```

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / Next.js / Vite Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | `try/catch/finally` in `async/await`, resetting loading states in `finally`, selective catch blocks | Universal requirement for asynchronous data fetching, form submission, and local resource cleanup. |
| 🟡 **Moderate** | Used in ~45% of code | Error wrapping via `{ cause }`, Custom error type guards, `try...finally` without catch | Essential for building API clients, SDK middleware, transaction engines, and background tasks. |
| 🔵 **Foundational / Engine** | Runtime internals | ECMAScript completion records, Call stack unwinding mechanics, V8 de-optimization heuristics | Required for Staff/Principal architecture reviews, APM instrumentation, and platform resilience. |

---

## Core Concepts (20 Subtopics)

### Part 1 — What Is the `try` Block? Enclosing Protected Execution `🟢 [Daily Driver]`

Defines an execution scope watched by the runtime for thrown exceptions.

---

### Part 2 — Immediate Control Flow Abandonment on `throw` `🟢 [Daily Driver]`

The microsecond `throw` executes, all subsequent statements in the `try` block are skipped; control transfers to `catch`.

---

### Part 3 — Anatomy of `catch`: The Interception Boundary `🟢 [Daily Driver]`

Binds the thrown value to an identifier (`catch (err)`) or uses ES2019 optional catch binding (`catch {}`) when the error value is irrelevant.

---

### Part 4 — `catch` Receives Arbitrary Thrown Values `🟢 [Daily Driver]`

Always normalize unknown caught values using `err instanceof Error ? err.message : String(err)`.

---

### Part 5 — Why `catch` Is Not a Magic "Fix" `🟢 [Daily Driver]`

`catch` intercepts the failure; it does not repair invalid application state. You must explicitly recover or abort dependent workflows.

---

### Part 6 — The Anti-Pattern: Silently Swallowing Exceptions `🔴 [Production-Critical]`

Empty catch blocks (`catch (e) {}`) conceal bugs, corrupt data stores, and make production debugging impossible.

---

### Part 7 — Synchronous Call Stack Traversal `🟢 [Daily Driver]`

Exceptions unwind multiple nested function frames ($C \to B \to A$) until intercepted by the first enclosing `catch` block.

---

### Part 8 — Error Ownership Architecture `🟢 [Daily Driver]`

Place `try/catch` at the layer that owns the recovery strategy (e.g. data service normalizes errors; UI component renders fallback).

---

### Part 9 — The `finally` Guarantee `🟢 [Daily Driver]`

`finally` executes in all scenarios: normal completion, handled error, and unhandled propagated error.

---

### Part 10 — Common `finally` Use Cases: Cleanup & Teardowns `🟢 [Daily Driver]`

```js
try {
  setLoading(true);
  await fetchData();
} catch (err) {
  setError(err);
} finally {
  setLoading(false); // 🟢 Always runs!
}
```

---

### Part 11 — `finally` Execution Timing with `return` Statements `🔵 [Foundational / Engine]`

When a `return` is reached in `try`, the return value is evaluated, `finally` executes, and then the function returns.

---

### Part 12 — The Catastrophic `return` / `throw` Inside `finally` Override Bug `🔴 [Production-Critical]`

Never write `return` or `throw` in `finally`; it discards active exceptions from `try`/`catch`.

---

### Part 13 — `try...finally` Without `catch` `🟢 [Daily Driver]`

Used when a function must guarantee resource cleanup without intercepting or suppressing the error.

---

### Part 14 — Anti-Pattern: Using Exceptions as Normal Control Flow `🟢 [Daily Driver]`

Do not throw exceptions for routine expected outcomes (e.g. array lookup miss). Use `null` or `Result` objects.

---

### Part 15 — Selective Error Handling via `instanceof` `🟢 [Daily Driver]`

```js
try {
  processOrder();
} catch (err) {
  if (err instanceof PaymentDeclinedError) showPaymentPrompt();
  else throw err; // 🟢 Re-throw unexpected programmer/system errors!
}
```

---

### Part 16 — The 3 Actions in `catch`: Handle, Transform, Re-throw `🟢 [Daily Driver]`

1. **Handle:** Fully resolve failure with fallback UI.  
2. **Transform:** Wrap technical error into a domain error.  
3. **Re-throw:** Log telemetry and bubble up to global error boundary.

---

### Part 17 — Preserving Root Cause Context with `new Error(msg, { cause })` `🟢 [Daily Driver]`

```js
try {
  parseConfig();
} catch (err) {
  throw new Error("Failed to initialize application configuration", { cause: err });
}
```

---

### Part 18 — Coarse-Grained vs Fine-Grained `try/catch` Boundaries `🟢 [Daily Driver]`

Wrap cohesive transactional operations together; avoid wrapping every single line in individual `try/catch` blocks.

---

### Part 19 — The Synchronous Boundary Limit `🔴 [Production-Critical]`

`try/catch` cannot catch errors thrown inside detached asynchronous callbacks (`setTimeout`, DOM events).

---

### Part 20 — The 10-Point Senior `try/catch/finally` Audit Checklist `🟢 [Daily Driver]`

```text
1. Are empty catch blocks eliminated? ──► 2. Are return/throw avoided inside finally?
3. Is loading state reset inside finally? ──► 4. Are unexpected errors re-thrown?
5. Is { cause: err } used during re-throws? ──► 6. Are detached async callbacks protected?
7. Is instanceof used for selective catching? ──► 8. Are unknown caught errors normalized?
9. Is try/catch placed at recovery layer? ──► 10. Is dependent flow aborted on failure?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Error Handling Structure | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Fine-Grained `try/catch`** | Isolating optional/secondary operations (e.g. analytics, cache updates). | Large monolithic transactional workflows where all steps must succeed. | Can lead to verbose, fragmented code if overused. | Coarse boundary with rollback. |
| **`try...finally` (No `catch`)** | Guaranteeing cleanup (releasing locks, timers) while letting errors bubble. | When local error recovery or user notification is required. | Does not intercept or handle the failure; caller must catch. | `try/catch/finally`. |
| **Re-throwing with `{ cause }`** | Translating low-level technical errors into high-level business domain errors. | Simple single-layer utility functions. | Allocates an extra `Error` wrapper object. | Direct re-throw (`throw err`). |
| **Result Objects / Tuples** | High-throughput functional pipelines, Go-style explicit error checking. | Standard idiomatic TypeScript/JavaScript applications with exceptions. | Requires callers to check `if (result.error)` manually on every call. | Standard `try/catch`. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Multi-Layer Transaction Pipeline in TypeScript
```tsx
import React, { useState, useCallback } from 'react';

// ==========================================
// 1. DOMAIN ERROR TAXONOMY
// ==========================================
export class DatabaseLockError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'DatabaseLockError';
  }
}

export class TransactionPipelineError extends Error {
  constructor(message: string, public readonly step: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'TransactionPipelineError';
  }
}

export interface TransactionRecord {
  txId: string;
  amount: number;
  status: 'PENDING' | 'COMMITTED' | 'ROLLED_BACK';
}

// ==========================================
// 2. TRANSACTION PIPELINE DASHBOARD
// ==========================================
export function EnterpriseTransactionDashboard() {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTx, setActiveTx] = useState<TransactionRecord | null>(null);

  const appendLog = (msg: string) => setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  // 🟢 Resilient multi-step pipeline with guaranteed finally cleanup and cause chaining
  const executeTransaction = useCallback(async (amount: number) => {
    setIsProcessing(true);
    appendLog(`▶️ Initiating transaction for $${amount}...`);

    let lockAcquired = false;

    try {
      // Step 1: Acquire Lock
      appendLog('Acquiring resource lock...');
      lockAcquired = true;

      // Step 2: Validate & Process
      if (amount > 5000) {
        throw new DatabaseLockError('Transaction limit exceeded: Maximum $5,000 per block');
      }

      // Step 3: Commit Transaction
      setActiveTx({
        txId: `tx_${Date.now()}`,
        amount,
        status: 'COMMITTED'
      });
      appendLog('✅ Transaction committed successfully.');
    } catch (err: unknown) {
      // 🟢 Selective Error Handling & Re-throwing with { cause }
      if (err instanceof DatabaseLockError) {
        appendLog(`⚠️ Operational Warning: ${err.message}`);
        setActiveTx({ txId: 'N/A', amount, status: 'ROLLED_BACK' });
      } else {
        // Transform low-level crash into contextual Domain Error
        const pipelineErr = new TransactionPipelineError(
          'Critical failure during transaction processing',
          'PAYMENT_STEP',
          { cause: err as Error }
        );
        appendLog(`🔴 ${pipelineErr.message} (Step: ${pipelineErr.step})`);
        setActiveTx({ txId: 'N/A', amount, status: 'ROLLED_BACK' });
      }
    } finally {
      // 🟢 GUARANTEED CLEANUP: Releases resource lock regardless of success or failure!
      if (lockAcquired) {
        appendLog('🧹 [Finally Cleanup]: Releasing resource lock and resetting spinner.');
      }
      setIsProcessing(false); // 🟢 Guaranteed state reset
    }
  }, []);

  return (
    <div className="transaction-dashboard-card">
      <header className="card-header">
        <h3>Enterprise Transaction Pipeline &amp; <code>finally</code> Engine</h3>
        <span className="badge">🛡️ Guaranteed Cleanup</span>
      </header>

      <p className="architecture-description">
        Demonstrates synchronous/asynchronous <code>try/catch/finally</code> execution flow, <code>Error.cause</code> context preservation, and guaranteed lock release in <code>finally</code>.
      </p>

      <div className="controls-row">
        <button
          type="button"
          onClick={() => executeTransaction(2500)}
          disabled={isProcessing}
          className="btn-success"
        >
          {isProcessing ? 'Processing...' : '💳 Execute Valid Tx ($2,500)'}
        </button>
        <button
          type="button"
          onClick={() => executeTransaction(9999)}
          disabled={isProcessing}
          className="btn-danger"
        >
          {isProcessing ? 'Processing...' : '💥 Trigger Failing Tx ($9,999)'}
        </button>
      </div>

      {activeTx && (
        <div className={`tx-status-banner ${activeTx.status.toLowerCase()}`}>
          <span>Tx ID: <strong>{activeTx.txId}</strong></span>
          <span>Status: <strong>{activeTx.status}</strong></span>
        </div>
      )}

      <div className="log-console">
        <h4>Execution Audit Log:</h4>
        {logs.map((log, i) => (
          <div key={i} className="log-line">{log}</div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🧠 Part 02 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: `finally` with `throw` and `catch` Flow
```js
try {
  console.log("1");
  throw new Error("Err");
  console.log("2");
} catch (e) {
  console.log("3");
} finally {
  console.log("4");
}
console.log("5");
```
**Question:** In what exact sequence do numbers output to the console?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:** `1`, `3`, `4`, `5`.  
**Why:**  
1. `try` outputs `"1"`.  
2. `throw` halts `try` (`"2"` is skipped) and jumps to `catch`, logging `"3"`.  
3. `finally` executes, logging `"4"`.  
4. Execution continues normally after the protected block, logging `"5"`.
</details>

---

### Prediction Challenge 2: Dangerous `return` Inside `finally`
```js
function testFinallyReturn() {
  try {
    throw new Error("Crash");
  } catch (err) {
    throw new Error("Secondary Crash");
  } finally {
    return "Suppressed!";
  }
}
console.log(testFinallyReturn());
```
**Question:** What happens when `testFinallyReturn()` is called?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:**  
The function outputs `"Suppressed!"` and **NO ERROR IS THROWN**.  
**Why:** The `return "Suppressed!"` statement inside `finally` completely overrides and discards the active `Secondary Crash` exception from `catch`.
</details>

---

### Prediction Challenge 3: `try...finally` Uncaught Propagation
```js
function processWork() {
  try {
    throw new TypeError("Invalid argument");
  } finally {
    console.log("Cleanup Executed");
  }
}
try {
  processWork();
} catch (err) {
  console.log("Outer Catch:", err.name);
}
```
**Question:** What is the console output order?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:**  
1. `"Cleanup Executed"` (The inner `finally` executes as the error begins unwinding the stack).  
2. `"Outer Catch: TypeError"` (The outer `catch` catches the unwound exception).
</details>

---

### Prediction Challenge 4: Error Chaining with `{ cause }`
```js
try {
  JSON.parse("invalid");
} catch (err) {
  const customErr = new Error("Config parsing failed", { cause: err });
  console.log(customErr.cause instanceof SyntaxError);
}
```
**Question:** What does the `console.log` statement output?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:** **`true`**.  
**Why:** Passing `{ cause: err }` attaches the original `SyntaxError` from `JSON.parse` directly to `customErr.cause`, preserving the root causal chain.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is the purpose of the `finally` block in JavaScript?  
<details>
<summary><strong>Answer</strong></summary>
The `finally` block contains cleanup code that is guaranteed to execute after the `try` block (and `catch` block, if an exception occurred), regardless of whether the operation succeeded, threw a handled error, or encountered an unhandled error. It is commonly used to reset loading spinners, clear intervals, close file handles, and release resource locks.
</details>

**Q2:** Why should you avoid putting a `return` statement inside a `finally` block?  
<details>
<summary><strong>Answer</strong></summary>
A `return` statement inside a `finally` block takes precedence over any pending `throw` or preceding `return` in `try`/`catch`. If an error was thrown, putting `return` in `finally` will silently swallow and discard the exception, masking critical bugs from developers.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** Why does wrapping `try/catch` around `setTimeout(() => { throw new Error() }, 1000)` fail to catch the error?  
<details>
<summary><strong>Answer</strong></summary>
`try/catch` is strictly synchronous; it only protects code executing in the current call stack while execution is physically inside the `try` block. `setTimeout` schedules the callback to run 1000ms later in a completely separate macrotask. When the callback throws, the synchronous `try/catch` has already completed and exited the call stack, resulting in an unhandled asynchronous exception.
</details>

**Q4:** What is the purpose of the `cause` property in modern JavaScript `Error` objects?  
<details>
<summary><strong>Answer</strong></summary>
The `cause` property (introduced in ES2022 via `new Error(message, { cause: originalError })`) allows developers to wrap low-level technical errors (e.g. `SyntaxError`, `NetworkError`) inside high-level business domain errors while maintaining a direct link to the original error and its V8 stack trace for observability tools.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** How do you structure error handling across application layers to avoid duplicating `try/catch` blocks in every React component?  
<details>
<summary><strong>Answer</strong></summary>
1. **API / Transport Layer:** Wraps low-level `fetch` calls, catches network failures, and normalizes HTTP status codes into typed `HttpError` subclasses.  
2. **Domain / Service Layer:** Implements business logic and wraps API errors with contextual `DomainError` instances using `{ cause: httpError }`.  
3. **Data Hooks (`useQuery`):** Exposes state (`isLoading`, `error`, `data`) and handles retry policies.  
4. **UI Layer:** React components simply read the hook state to display contextual error UI, while unhandled component render crashes bubble up to React **Error Boundaries**.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How does V8 handle Exception Unwinding and De-Optimization (`DeoptToBaseline` / `DeoptToInterpreter`) when a `throw` statement executes in optimized JIT (TurboFan) code?  
<details>
<summary><strong>Answer</strong></summary>
1. **TurboFan Speculative Optimization:** TurboFan optimizes functions assuming the "Happy Path" where no exceptions are thrown.  
2. **Abrupt De-Optimization:** When a `throw` statement executes, TurboFan cannot safely execute non-linear stack jumps; it triggers a **Bailout / De-optimization**, reverting the JIT-compiled machine code back to the Ignition Bytecode interpreter.  
3. **Staff Architecture:** Do not use `try/catch` or `throw` for high-frequency normal control flow (e.g. validating $100,000$ loop records). Reserve `throw` for exceptional failures to keep TurboFan JIT optimizations active in hot paths.
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Pipeline Runner with `finally` Tracking

```js
// See runnable implementation in examples/02-try-catch-finally-mechanics.js
```

---

## Key Takeaways
1. **Never Return or Throw in `finally`:** Protect active exceptions from being silently suppressed.
2. **`try/catch` Is Synchronous:** Wrap callback internals or use `async/await` for asynchronous code.
3. **Always Clean Up in `finally`:** Ensure loading spinners and resource locks reset unconditionally.
4. **Preserve Root Causes:** Use `new Error(msg, { cause: err })` when transforming exceptions.
5. **Catch Selectively:** Handle known domain errors; re-throw unexpected programmer bugs to telemetry.

---

[⬅️ Part 01: Errors, Exceptions & Failure Model](./01-errors-exceptions-failure-model.md) | [📚 KPI 25 Index](./README.md) | [Part 03: Error Propagation & Custom Errors ➡️](./03-error-propagation-custom-errors.md)
