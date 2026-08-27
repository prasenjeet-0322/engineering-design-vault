# KPI 25 — Part 01: Errors, Exceptions & the JavaScript Failure Model

[⬅️ KPI 24 — Performance Profiling](../24-Performance-Profiling/README.md) | [📚 KPI 25 Index](./README.md) | [Part 02: try / catch / finally Mechanics ➡️](./02-try-catch-finally-mechanics.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Failure Concept | Precise Definition | Key Properties & Mechanics | Senior Engineering Standard |
|---|---|---|---|
| **Bug vs Error vs Exception** | **Bug:** Defect in code logic. **Error:** Runtime failure state. **Exception:** Interruption caught by a handler. | Exceptions halt execution and unwind the call stack until a `catch` block is reached. | 🟢 Distinguish between code bugs (fix immediately) and operational failures (handle gracefully). |
| **`Error` Object** | Standard JavaScript class containing `name`, `message`, and `stack`. | `Error.prototype.stack` captures the exact call frame sequence in the V8 engine. | 🔴 **CRITICAL:** Always throw instances of `Error` (or derived subclasses), never strings or plain objects. |
| **Built-in Error Types** | Core V8 taxonomy: `TypeError`, `ReferenceError`, `SyntaxError`, `RangeError`, `URIError`. | Extends `Error.prototype`; represents distinct categories of language/runtime failure. | 🟢 Inspect `error.name` or `error instanceof TypeError` to perform targeted recovery. |
| **`throw` vs `return`** | `return` represents normal expected control flow; `throw` represents exceptional breakdown. | `throw` unwinds the call stack and must be intercepted by an error boundary or `try/catch`. | 🟢 Return `null` / `Result` tuples for expected missing items; `throw` when contracts are broken. |
| **Programmer vs Operational Errors** | **Programmer:** Code defects (e.g. `undefined.map()`). **Operational:** External failures (e.g. 500 API / offline). | Operational errors must offer user retry/fallback; programmer errors require logging and hotfixing. | 🔴 Never mask programmer syntax/type bugs behind generic user "Retry" notifications. |
| **Failure as UI State** | UI state is never binary (`Loading` $\to$ `Success`); it includes explicit recoverable failure states. | `Idle` $\to$ `Loading` $\to$ `Success` \| `RecoverableError` (with Retry) \| `FatalError` (with Fallback). | 🟢 Model domain failures explicitly in state machines (e.g. `Result<T, E>`). |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: Throwing Primitive Strings & Masking Programmer Bugs
> 
> #### Gotcha A: Throwing Primitive Strings (`throw 'User not found'` vs `throw new Error(...)`)
> *"Why did our production error tracking in Sentry group 10,000 completely different errors into a single useless event?"*  
> ```js
> // ❌ DISASTROUS PRIMITIVE THROWING:
> function fetchUserProfile(userId) {
>   if (!userId) {
>     // 💥 FATAL MISTAKE: Throwing a primitive string!
>     // 1. NO STACK TRACE: V8 does NOT capture the execution call stack!
>     // 2. BREAKS INSTANCEOF: (error instanceof Error) returns FALSE!
>     // 3. BREAKS SENTRY/DATADOG: Aggregators cannot group or symbolicate source lines!
>     throw "Invalid User ID";
>   }
> }
> ```
> **Deep Architectural Explanation:**  
> In JavaScript, the `throw` statement allows throwing any value (strings, numbers, booleans, objects). However, only instances of `Error` (or classes derived from `Error`) trigger the V8 engine's `Error.captureStackTrace()` mechanism to record the active call frames, file names, and line numbers. Throwing raw strings discards all debugging telemetry, makes type-safe catch blocks (`if (err instanceof ValidationError)`) fail, and prevents error observability tools from grouping issues.  
> **The Senior Standard:** Always throw instances of `Error` or domain-specific custom subclasses:
> ```js
> // ✅ THROWING STRUCTURED ERROR INSTANCE:
> class ValidationError extends Error {
>   constructor(message, public details: Record<string, unknown> = {}) {
>     super(message);
>     this.name = "ValidationError";
>   }
> }
> 
> function fetchUserProfileSafe(userId) {
>   if (!userId) {
>     // 🟢 Full stack trace captured, instanceof compatible, structured metadata attached!
>     throw new ValidationError("User ID is required", { field: "userId", received: userId });
>   }
> }
> ```
> 
> ---
> 
> #### Gotcha B: Masking Programmer Errors Behind Generic Operational Fallbacks
> *"Why did our checkout page silently fail to submit without any console errors?"*  
> ```js
> // ❌ DANGEROUS CATCH-ALL SILENCING:
> async function handleCheckout(cart) {
>   try {
>     // Developer typo: calculateDiscount is undefined!
>     const total = cart.calculateDiscount(); // 💥 Throws TypeError: cart.calculateDiscount is not a function
>     await submitPayment(total);
>   } catch (err) {
>     // 💥 FATAL SILENCING: Blindly assumes every error is an operational network glitch!
>     showToast("Payment failed. Please click Try Again."); // User repeatedly clicks but it NEVER works!
>   }
> }
> ```
> **Deep Architectural Explanation:**  
> A `TypeError` caused by a developer typo or missing method is a **Programmer Error** (a bug in the code). It is fundamentally different from an **Operational Error** (e.g. credit card declined or network timeout). Catching all errors indiscriminately and displaying a generic "Please Try Again" message traps the user in an unrecoverable loop while concealing the code defect from engineering logs.  
> **The Senior Standard:** Classify errors in the catch block: handle known operational errors gracefully with user retry buttons, and re-throw / report unexpected programmer errors directly to observability systems:
> ```js
> // ✅ TARGETED FAILURE CLASSIFICATION:
> async function handleCheckoutSafe(cart) {
>   try {
>     const total = cart.calculateTotal();
>     await submitPayment(total);
>   } catch (err) {
>     if (err instanceof PaymentDeclinedError) {
>       // Operational domain failure: User actionable!
>       showToast(err.message);
>     } else {
>       // Unexpected Programmer Error / System Crash: Log & escalate!
>       telemetry.captureException(err);
>       showFatalFallbackUI("An unexpected error occurred. Our engineering team has been notified.");
>     }
>   }
> }
> ```

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / Next.js / Vite Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Custom Error classes, `Error` object properties (`name`, `message`, `stack`), `throw` vs `return` | Universal foundation for reliable business logic, form validation, and domain service APIs. |
| 🟡 **Moderate** | Used in ~45% of code | Differentiating Programmer vs Operational errors, Safe `Result<T, E>` tuples | Mandatory for enterprise API clients, payment flows, and micro-frontend communication. |
| 🔵 **Foundational / Engine** | Runtime internals | V8 stack trace compilation, Error prototype inheritance, Error propagation mechanics | Required for Staff/Principal architecture reviews, Sentry SDK integrations, and platform reliability. |

---

## Core Concepts (20 Subtopics)

### Part 1 — What Is an Error? Execution Interruption & Invalid States `🟢 [Daily Driver]`

An error represents an abnormal condition where the runtime cannot continue normal execution along the expected program path.

---

### Part 2 — The Precise Taxonomy: Bug vs Error vs Exception `🟢 [Daily Driver]`

- **Bug:** Flaw in the program logic (e.g. subtraction instead of multiplication).
- **Error:** The runtime manifestation of failure (e.g. `new Error()`).
- **Exception:** An error that interrupts control flow and can be intercepted by a `catch` handler.

---

### Part 3 — Anatomy of the JavaScript `Error` Object `🟢 [Daily Driver]`

Every standard error object provides three core properties:
- `name`: The error classification string (defaults to `"Error"`).
- `message`: Human-readable technical description of the failure.
- `stack`: V8 execution stack trace string showing file names and line numbers.

---

### Part 4 — Crafting Meaningful Error Messages `🟢 [Daily Driver]`

Include exact context (parameters, received values, expected types). Avoid cryptic strings like `"Failed"` in favor of `"Failed to fetch user [ID: 402]: Server returned HTTP 503"`.

---

### Part 5 — Demystifying the V8 Stack Trace `🔵 [Foundational / Engine]`

The stack trace reveals the ordered chain of active execution call frames at the exact microsecond the error was instantiated.

---

### Part 6 — The Built-in Error Hierarchy `🟢 [Daily Driver]`

$$\text{Object} \implies \text{Error} \implies \{\text{TypeError}, \text{ReferenceError}, \text{SyntaxError}, \text{RangeError}, \text{URIError}\}$$

---

### Part 7 — `TypeError`: Type Mismatches & Incompatible Operations `🟢 [Daily Driver]`

Fires when accessing properties on `null`/`undefined`, calling non-functions (`val()`), or reassigning `const` variables.

---

### Part 8 — `ReferenceError`: Unscoped Identifiers & TDZ `🟢 [Daily Driver]`

Fires when referencing undeclared variables or accessing `let`/`const` variables inside their Temporal Dead Zone (TDZ).

---

### Part 9 — `SyntaxError`: Parsing Grammar Violations `🟢 [Daily Driver]`

Fires when source code grammar is invalid or when `JSON.parse("invalid json")` fails at runtime.

---

### Part 10 — `RangeError`: Numeric Limits & Call Stack Overflow `🟢 [Daily Driver]`

Fires when creating arrays with invalid lengths (`new Array(-1)`) or exceeding maximum call stack recursion depth.

---

### Part 11 — `URIError`: Malformed URI Encoded Strings `🟢 [Daily Driver]`

Fires when URI decoding functions receive invalid percent-encoded sequences (`decodeURIComponent("%")`).

---

### Part 12 — Errors as First-Class Structured Objects `🟢 [Daily Driver]`

Errors are dynamic JavaScript objects; custom properties (e.g. `err.statusCode = 404`, `err.retryable = true`) can be attached for structured logging.

---

### Part 13 — The `throw` Statement: Halting Normal Flow `🟢 [Daily Driver]`

Immediately terminates the current function execution and begins unwinding the call stack to find the nearest enclosing `catch` block.

---

### Part 14 — Error Propagation Mechanics `🔵 [Foundational / Engine]`

Uncaught errors propagate upward through every caller frame in the execution call stack until intercepted by a handler or reaching the global environment.

---

### Part 15 — `throw` vs `return`: Exceptional vs Normal Fallback `🟢 [Daily Driver]`

- `return null`: For expected, benign non-presence (e.g. search query yielded 0 results).
- `throw new Error()`: When a mandatory contract is violated (e.g. database connection dropped).

---

### Part 16 — The Anti-Pattern: Throwing Arbitrary Primitives `🔴 [Production-Critical]`

Never execute `throw "error"` or `throw 404`; always instantiate `new Error()` or custom subclasses to preserve stack traces.

---

### Part 17 — Failure Classification: Programmer Errors vs Operational Errors `🔴 [Production-Critical]`

- **Programmer Errors:** Bugs in code logic (`TypeError`, syntax defects) $\implies$ Fix code.
- **Operational Errors:** Runtime environment failures (Network drop, 500 API) $\implies$ Handle with retry/fallback.

---

### Part 18 — Expected Domain Failures vs Unexpected System Crashes `🟢 [Daily Driver]`

Model expected domain issues (validation failed, insufficient funds) as normal state objects; reserve exceptions for unexpected system crashes.

---

### Part 19 — Beyond the Happy Path: Multi-State Failure Modeling `🟢 [Daily Driver]`

Always design UI states for: `Idle` $\to$ `Loading` $\to$ `Success` $\to$ `OperationalError` $\to$ `FatalFallback`.

---

### Part 20 — The 10-Point Senior Frontend Failure Audit Checklist `🟢 [Daily Driver]`

```text
1. Are only Error subclasses thrown (no strings)? ──► 2. Are error messages actionable and contextual?
3. Are Programmer Errors separated from Operational? ──► 4. Is JSON.parse wrapped in try/catch?
5. Are UI states designed for network failure? ──► 6. Are retry buttons provided for operational errors?
7. Is custom error metadata attached? ──► 8. Are unhandled rejections tracked globally?
9. Is Sentry/Datadog grouping verified? ──► 10. Does component unmount cleanly on error?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Failure Handling Approach | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Throwing Exceptions (`throw new Error`)** | Unrecoverable failures, broken invariants, mandatory contractual violations. | Expected routine domain states (e.g. user not found in search). | Unwinds the call stack; creates non-local control flow jumps. | Result tuples / Sentinel returns. |
| **Result Tuples (`[err, data]`)** | Asynchronous operations, Go-style explicit error handling pipelines. | Deeply nested OOP inheritance hierarchies. | Requires callers to explicitly check `if (err)` on every step. | `try/catch` / Option types. |
| **Sentinel Returns (`null` / `undefined`)** | Optional lookups, cache misses, finding an item in an array (`find()`). | Operations where `null` is a valid return value or failure reason matters. | Loses technical context on *why* the operation failed. | Discriminated union Result types. |
| **Discriminated Union Results** | Complex domain operations (e.g. `{ ok: true, data } \| { ok: false, error }`). | Trivial one-line helper functions. | Minor object allocation overhead per execution. | Throwing custom errors. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Multi-State Resilient Action Handler in TypeScript
```tsx
import React, { useState, useCallback } from 'react';

// ==========================================
// 1. DOMAIN FAILURE TAXONOMY & TYPES
// ==========================================
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E; isOperational: boolean };

export class OperationalNetworkError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'OperationalNetworkError';
  }
}

export class BusinessValidationError extends Error {
  constructor(message: string, public readonly invalidField: string) {
    super(message);
    this.name = 'BusinessValidationError';
  }
}

export interface UserAccount {
  id: string;
  email: string;
  role: 'ADMIN' | 'ENGINEER';
}

// ==========================================
// 2. RESILIENT AUTHENTICATION DASHBOARD
// ==========================================
export function EnterpriseResilientAuthDashboard() {
  const [emailInput, setEmailInput] = useState<string>('');
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [activeUser, setActiveUser] = useState<UserAccount | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRetryable, setIsRetryable] = useState<boolean>(false);

  // 🟢 Resilient execution pipeline with failure classification
  const handleAuthenticate = useCallback(async (email: string) => {
    setStatus('LOADING');
    setErrorMessage(null);
    setIsRetryable(false);

    try {
      // 1. Validation check (Expected domain rule)
      if (!email || !email.includes('@')) {
        throw new BusinessValidationError('Please enter a valid corporate email address', 'email');
      }

      // 2. Simulated Network Request
      const response = await simulateAuthApi(email);

      if (!response.ok) {
        throw new OperationalNetworkError('Authentication server temporarily unavailable', response.status);
      }

      const userData: UserAccount = await response.json();
      setActiveUser(userData);
      setStatus('SUCCESS');
    } catch (err: unknown) {
      setStatus('ERROR');

      // 🟢 Classification: Operational vs Programmer Error
      if (err instanceof BusinessValidationError) {
        setErrorMessage(`Validation Error: ${err.message} (${err.invalidField})`);
        setIsRetryable(false);
      } else if (err instanceof OperationalNetworkError) {
        setErrorMessage(`Network Error (${err.statusCode}): ${err.message}`);
        setIsRetryable(true); // Allow user retry for operational network drops
      } else if (err instanceof Error) {
        // Unexpected programmer/system crash
        setErrorMessage(`Unexpected Failure: ${err.message}`);
        setIsRetryable(false);
      } else {
        // Fallback for non-Error thrown values
        setErrorMessage('An unknown system error occurred');
        setIsRetryable(false);
      }
    }
  }, []);

  return (
    <div className="resilient-auth-card">
      <header className="card-header">
        <h3>Enterprise Failure-Resilient Authentication Engine</h3>
        <span className="badge">🛡️ Multi-State Failure Model</span>
      </header>

      <p className="architecture-description">
        Demonstrates failure classification (Operational vs Programmer Errors), typed Error subclasses, and contextual UI recovery states.
      </p>

      <div className="form-group">
        <input
          type="email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder="engineer@enterprise.io"
          className="email-input"
          disabled={status === 'LOADING'}
        />
        <button
          type="button"
          onClick={() => handleAuthenticate(emailInput)}
          disabled={status === 'LOADING'}
          className="auth-btn"
        >
          {status === 'LOADING' ? 'Authenticating...' : 'Sign In Securely'}
        </button>
      </div>

      {status === 'SUCCESS' && activeUser && (
        <div className="success-banner">
          <span>✅ Authenticated as <strong>{activeUser.email}</strong> ({activeUser.role})</span>
        </div>
      )}

      {status === 'ERROR' && errorMessage && (
        <div className="error-banner">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <span>{errorMessage}</span>
          </div>
          {isRetryable && (
            <button
              type="button"
              onClick={() => handleAuthenticate(emailInput)}
              className="retry-btn"
            >
              🔄 Retry Connection
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Mock API simulation helper
async function simulateAuthApi(email: string): Promise<{ ok: boolean; status: number; json: () => Promise<UserAccount> }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (email.includes('offline')) {
        resolve({ ok: false, status: 503, json: async () => ({} as UserAccount) });
      } else {
        resolve({
          ok: true,
          status: 200,
          json: async () => ({ id: 'usr_882', email, role: 'ENGINEER' })
        });
      }
    }, 400);
  });
}
```

---

## 🧠 Part 01 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: Call Stack Propagation Unwinding
```js
function levelA() { levelB(); }
function levelB() { levelC(); }
function levelC() { throw new TypeError("Invalid parameter type"); }
try {
  levelA();
} catch (err) {
  console.log(err.name);
  console.log(err instanceof Error);
}
```
**Question:** What will the two `console.log` statements output?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:**  
1. `TypeError` (The specific error class name).  
2. `true` (`TypeError` inherits from `Error.prototype` via the prototype chain).
</details>

---

### Prediction Challenge 2: Throwing Strings vs Error Instances
```js
function testThrowString() {
  try {
    throw "Fatal connection lost";
  } catch (err) {
    console.log(err.stack);
    console.log(err instanceof Error);
  }
}
testThrowString();
```
**Question:** What will be output to the console?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:**  
1. `undefined` (Primitive strings do NOT possess a `.stack` property in V8).  
2. `false` (Primitive strings are not instances of `Error`).
</details>

---

### Prediction Challenge 3: Built-in Error Type Classification
```js
// Scenario A: decodeURIComponent("%")
// Scenario B: const x = (undefined).value
// Scenario C: new Array(-5)
```
**Question:** Which built-in Error type is thrown by Scenario A, Scenario B, and Scenario C?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:**  
- **Scenario A:** `URIError` (Malformed URI sequence).  
- **Scenario B:** `TypeError` (Cannot read properties of undefined).  
- **Scenario C:** `RangeError` (Invalid array length).
</details>

---

### Prediction Challenge 4: Programmer Error vs Operational Error
```text
Case 1: User enters an invalid password on login.
Case 2: Engineer writes `items.filterr(...)` (typo).
Case 3: AWS S3 bucket returns 500 Internal Server Error.
```
**Question:** Classify each case as an **Expected Domain Failure**, a **Programmer Error**, or an **Operational Error**.
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:**  
- **Case 1:** **Expected Domain Failure** (Model as normal UI validation state).  
- **Case 2:** **Programmer Error** (Code defect; requires code fix).  
- **Case 3:** **Operational Error** (External system failure; requires retry/fallback handling).
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is the difference between an Error, a Bug, and an Exception?  
<details>
<summary><strong>Answer</strong></summary>
- **Bug:** A defect or mistake in the code logic written by a programmer.  
- **Error:** An abnormal condition or object representing a runtime failure.  
- **Exception:** An error condition that actively breaks normal execution flow and can be intercepted by a `try/catch` block.
</details>

**Q2:** Why should you always throw `new Error("...")` instead of `throw "..."`?  
<details>
<summary><strong>Answer</strong></summary>
Throwing an `Error` instance automatically captures the **V8 execution stack trace** (`err.stack`), preserves prototype inheritance for `instanceof` checks, and allows monitoring tools (Sentry, Datadog) to group and symbolicate error events accurately. Throwing raw strings discards all stack telemetry and breaks error handling contracts.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** What is the difference between a Programmer Error and an Operational Error?  
<details>
<summary><strong>Answer</strong></summary>
- **Programmer Errors:** Bugs within the codebase itself (e.g. `TypeError`, accessing properties of `undefined`, syntax errors). They indicate broken code assumptions and must be resolved by fixing the code.  
- **Operational Errors:** Runtime failures that occur in correct code due to external environmental factors (e.g. 503 API outages, network drops, malformed external payloads). They must be anticipated and handled gracefully with user retry buttons or fallbacks.
</details>

**Q4:** What are the 5 major built-in JavaScript error classes and what causes them?  
<details>
<summary><strong>Answer</strong></summary>
1. `TypeError`: Incompatible operations (e.g. `null.prop`, `42()`).  
2. `ReferenceError`: Accessing an undeclared variable or accessing variables in TDZ.  
3. `SyntaxError`: Invalid language grammar or malformed `JSON.parse()`.  
4. `RangeError`: Numbers outside legal bounds (e.g. `new Array(-1)`).  
5. `URIError`: Malformed percent-encoded sequences in `decodeURIComponent()`.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** How do you design an enterprise-grade error taxonomy using custom TypeScript Error classes?  
<details>
<summary><strong>Answer</strong></summary>
Create an abstract `BaseApplicationError` inheriting from `Error` that sets `this.name = this.constructor.name` and captures the stack trace. Then derive domain-specific subclasses:  
- `ValidationError`: For client-side form and DTO validation with structured `fields` metadata.  
- `HttpError`: For API transport failures containing `statusCode`, `endpoint`, and `isRetryable` flags.  
- `AuthError`: For session expiration with automatic refresh triggers.  
This enables consumers to perform clean, type-safe error recovery via `instanceof` switching without parsing fragile string messages.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How does V8 compile and manage Stack Trace Frame Arrays via `Error.prepareStackTrace` under the hood, and how do you prevent performance degradation during high-frequency error instantiations?  
<details>
<summary><strong>Answer</strong></summary>
1. **Stack Trace Capture Cost:** In V8, instantiating `new Error()` synchronously captures the current C++ execution stack frame pointers. When `.stack` is first accessed, V8 formats these pointers into a formatted string, incurring substantial CPU overhead in hot paths.  
2. **`Error.prepareStackTrace` API:** V8 exposes `Error.prepareStackTrace(err, structuredStackTrace)` allowing custom formatting of CallSite objects (inspecting `getFileName()`, `getLineNumber()`, `getFunctionName()`) for custom APM tracers.  
3. **Staff Optimization:** Never use exceptions for normal control flow in high-frequency loops ($>10,000\text{ ops/sec}$). Use Result objects (`{ ok: true, val } \| { ok: false, err }`) to avoid expensive stack trace captures on expected domain branches.
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Failure Classifier Engine

```js
// See runnable implementation in examples/01-errors-exceptions-failure-model.js
```

---

## Key Takeaways
1. **Always Throw `Error` Subclasses:** Preserve the V8 stack trace and `instanceof` contracts.
2. **Classify Programmer vs Operational Errors:** Fix code bugs; provide retries for operational drops.
3. **Failure Is Application State:** Model `Idle` $\to$ `Loading` $\to$ `Success` $\to$ `Error` explicitly in UI.
4. **Never Use Exceptions for Control Flow:** Return `null` or `Result` objects for expected non-presence.
5. **Contextual Error Messages:** Provide actionable technical details for logs and clear guidance for users.

---

[⬅️ KPI 24 — Performance Profiling](../24-Performance-Profiling/README.md) | [📚 KPI 25 Index](./README.md) | [Part 02: try / catch / finally Mechanics ➡️](./02-try-catch-finally-mechanics.md)
