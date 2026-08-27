# KPI 10 — Part 02: Custom Errors, Error Taxonomy, Error Wrapping, `cause` & Rethrowing

[⬅️ Part 01: Error Mental Model, Taxonomy & try/catch/finally](./01-error-mental-model-taxonomy-try-catch-finally.md) | [📚 KPI 10 Index](./README.md) | [Part 03: Asynchronous Error Handling & Network Resilience ➡️](./03-async-error-handling-network-resilience.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Mechanism / Pattern | Operational Contract | Preserves Stack Trace? | `instanceof` Behavior | Senior Production Rule |
|---|---|---|---|---|
| **`class extends Error`** | Creates typed domain error classes with custom constructor metadata. | ✅ (Yes) | `err instanceof SubError && err instanceof Error` | 🟢 Subclass `AppError` to enforce consistent error codes and metadata across the team. |
| **`Object.setPrototypeOf`** | Fixes prototype chain in legacy/transpiled environments (`new.target.prototype`). | ✅ (Yes) | Restores broken `instanceof` | 🔵 **Engine Defensive**: Always include `Object.setPrototypeOf(this, new.target.prototype)` in custom error constructors. |
| **`Error.captureStackTrace`** | V8 engine API that trims boilerplate constructor frames from the stack trace string. | ✅ (Optimized) | N/A | 🔵 Omits internal helper functions from production stack traces for clean telemetry. |
| **`Error.cause` (ES2022)** | Chains low-level root causal errors inside high-level domain exceptions. | ✅ (Full Chain) | Chained on `.cause` | 🟢 **Never Lose Root Causes**: Always wrap with `new DomainError(msg, { cause: originalErr })`. |
| **Machine `code` Separation**| `error.code = 'INVALID_EMAIL'` instead of parsing string `error.message`. | N/A | N/A | 🔴 **Never Parse Message Strings**: Use stable machine-readable codes for UI branching and i18n. |
| **Rethrow vs. Wrap** | **Rethrow:** Unmodified bubbling. **Wrap:** Translate technical error to domain meaning. | Preserved / Chained | Type Preserved / Wrapped | 🟢 Rethrow when current layer cannot handle; Wrap when crossing architectural boundaries. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: Prototype Chain Breakage & Causal Severance
> 
> #### Gotcha A: The `instanceof` Transpilation Prototype Loss Trap
> *"Why did `error instanceof ValidationError` return `false` in production after compiling TypeScript down to ES5?"*  
> ```js
> // ❌ BROKEN IN TRANSPILATION / ES5 TARGETS:
> class ValidationError extends Error {
>   constructor(message) {
>     super(message);
>     this.name = "ValidationError";
>   }
> }
> 
> const err = new ValidationError("Email invalid");
> console.log(err instanceof ValidationError); // 💥 Returns false in transpiled ES5 environments!
> ```
> **Deep Architectural Explanation:**  
> When compiling ES6 classes extending built-in objects (`Error`, `Array`, `Map`) down to ES5, JavaScript engines use constructor function substitution (`Function.prototype.call(this)`). Because native `Error` constructors dynamically create a new object instance rather than mutating `this`, the prototype chain to `ValidationError.prototype` is severed, reverting the prototype back to base `Error.prototype`.  
> **The Senior Standard (Prototype & Stack Restoration):**  
> ```js
> // ✅ BATTLE-TESTED ENTERPRISE CUSTOM ERROR BASE:
> export class AppError extends Error {
>   constructor(message, options = {}) {
>     super(message, options);
>     this.name = this.constructor.name;
>     this.code = options.code ?? 'INTERNAL_APPLICATION_ERROR';
>     this.metadata = options.metadata ?? {};
> 
>     // 1. Restore Prototype Chain across all JS runtimes & transpilers
>     Object.setPrototypeOf(this, new.target.prototype);
> 
>     // 2. Trim custom error constructor frames in V8 (Node / Chrome)
>     if (Error.captureStackTrace) {
>       Error.captureStackTrace(this, this.constructor);
>     }
>   }
> }
> ```
> 
> ---
> 
> #### Gotcha B: The Causal Severance Trap (Losing Root Root Causes)
> *"Why did our Sentry telemetry show `DashboardLoadError: Failed to render dashboard` with zero information about why the backend failed?"*  
> ```js
> // ❌ FATAL CONTEXT DESTRUCTION:
> try {
>   await fetchBillingData();
> } catch (err) {
>   throw new Error("Dashboard failed to load"); // 💥 Root network/SQL error is permanently destroyed!
> }
> ```
> **The Senior Standard (ES2022 Error Chaining):**  
> ```js
> // ✅ PRESERVE ROOT CAUSAL CHAIN:
> try {
>   await fetchBillingData();
> } catch (err) {
>   throw new DashboardLoadError("Dashboard failed to load", { cause: err }); // ✅ Retains full causal tree!
> }
> ```

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / TypeScript Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Custom API errors, form validation field errors, HTTP 401/403/404 handling, error code matching | Essential for building scalable, maintainable error handling pipelines across API services and UI views. |
| 🟡 **Moderate** | Used in ~35% of code | `Error.cause` wrapping, centralized error telemetry serialization (`toJSON`), custom SDK errors | Critical for enterprise architectures, microservice gateways, and third-party developer platforms. |
| 🔵 **Foundational / Engine** | Runtime internals | Prototype inheritance mechanics, V8 `Error.captureStackTrace`, cross-realm `instanceof` caveats | Essential for framework authoring, performance profiling, and Staff/Principal evaluations. |

---

## Core Concepts (20 Subtopics)

### Part 1 — Semantic Failure Classification & Custom Error Hierarchies `🟢 [Daily Driver]`

Generic `new Error("msg")` fails in production because upstream handlers cannot distinguish validation bugs from authorization failures or network dropouts without parsing string messages.

---

### Part 2 — ES6+ Subclassing: `class AppError extends Error` Invariants `🟢 [Daily Driver]`

Subclassing `Error` ensures custom exceptions remain first-class citizen error objects while augmenting them with domain attributes:
```js
export class ValidationError extends AppError {
  constructor(message, fields = {}, options = {}) {
    super(message, { ...options, code: 'VALIDATION_FAILED' });
    this.fields = fields;
  }
}
```

---

### Part 3 — Prototype Chain Integrity & `Object.setPrototypeOf` `🔵 [Foundational / Engine]`

Always invoke `Object.setPrototypeOf(this, new.target.prototype)` inside custom error constructors to guarantee `instanceof` works reliably across all bundlers, Babel, and TypeScript targets.

---

### Part 4 — V8 Engine Optimization: `Error.captureStackTrace` `🔵 [Foundational / Engine]`

In Node.js and Chromium V8 engines, `Error.captureStackTrace(this, this.constructor)` trims the custom constructor call itself from the stack trace string, keeping traces focused on actual user code.

---

### Part 5 — The `instanceof` Polymorphic Matching Pattern `🟢 [Daily Driver]`

`instanceof` allows hierarchical error catching:
```js
if (err instanceof ValidationError) handleValidation(err.fields);
else if (err instanceof AuthError) handleLoginRedirect();
else throw err; // Re-throw unknown exceptions
```

---

### Part 6 — Machine-Readable `code` vs. Human `message` `🟢 [Daily Driver]`

- `error.code = 'USER_NOT_FOUND'`: Stable string constant used by UI logic, routing, and internationalization (i18n).
- `error.message = 'The user could not be found'`: Diagnostic human-readable string for logging.

---

### Part 7 — Structured Error Metadata Dictionaries `🟢 [Daily Driver]`

Attach structured metadata (`userId`, `orderId`, `attemptCount`) as an object property rather than interpolating values into strings:
```js
throw new PaymentError("Card declined", { code: 'PAYMENT_DECLINED', metadata: { last4: '4242', declineCode: 'insufficient_funds' } });
```

---

### Part 8 — Granular vs. Coarse Hierarchy: Avoiding Class Explosion `🔴 [Production-Critical]`

Do NOT create 50 distinct error classes for trivial variations (`InvalidEmailError`, `InvalidZipError`). Use a coarse class (`ValidationError`) with granular error codes (`INVALID_EMAIL`).

---

### Part 9 — Multi-Layered Domain Translation `🟢 [Daily Driver]`

Translate technical infrastructure codes into domain-meaningful abstractions:
- Network TCP Reset $\to$ `NetworkUnavailableError`
- HTTP 409 Conflict $\to$ `DuplicateEntityError`
- JSON Parse Failure $\to$ `InvalidServerPayloadError`

---

### Part 10 — Error Chaining Mechanics with ES2022 `Error.cause` `🟢 [Daily Driver]`

`new Error(msg, { cause: originalError })` binds the underlying root failure to `.cause`, allowing diagnostic telemetry to inspect the complete multi-tier execution history.

---

### Part 11 — Error Wrapping Patterns: Preserving Causal Evidence `🟢 [Daily Driver]`

When higher application layers catch low-level errors, wrap them in domain-specific errors while passing `{ cause: err }` so root causes are never severed.

---

### Part 12 — Sanitizing Error Metadata: Preventing PII Leaks `🔴 [Production-Critical]`

Never attach authentication tokens, plain-text passwords, credit card numbers, or sensitive PII to error metadata properties destined for telemetry logging.

---

### Part 13 — The Rethrow Discipline: When to Propagate `🟢 [Daily Driver]`

If the current architectural layer cannot fully recover or translate an exception, re-throw it (`throw err;`) so upstream global handlers can capture it.

---

### Part 14 — Rethrow vs. Wrap Decision Framework `🟢 [Daily Driver]`

- **Rethrow:** The error already possesses accurate domain semantics and requires higher-level action.
- **Wrap:** The error is a low-level technical failure that must be given contextual domain meaning.

---

### Part 15 — The Silent Error Swallow Antipattern `🔴 [Production-Critical]`

Catching an error and doing nothing (`catch(e) {}`) conceals broken state transitions, leaving users with frozen loading spinners and zero telemetry alerts.

---

### Part 16 — Selective Catching: Handling Knowns & Bubbling Unknowns `🟢 [Daily Driver]`

Only catch exceptions your current layer explicitly knows how to resolve. Re-throw everything else:
```js
try { await saveProfile(); } catch (err) {
  if (err instanceof StaleVersionError) return promptMergeConflict();
  throw err; // Bubbles unexpected syntax/network errors
}
```

---

### Part 17 — Defensive Handling of Non-Error Thrown Values `🟢 [Daily Driver]`

Because JavaScript allows `throw "fatal"` or `throw null`, always normalize caught values:
```js
const errorInstance = err instanceof Error ? err : new Error(String(err));
```

---

### Part 18 — Centralized Application Error Taxonomy Matrix `🟢 [Daily Driver]`

Standardize high-level categories across the engineering organization:
- `HttpError` (4xx, 5xx)
- `ValidationError` (422)
- `AuthenticationError` (401)
- `AuthorizationError` (403)
- `NotFoundError` (404)
- `TimeoutError` (408/504)

---

### Part 19 — Error Serialization for JSON Telemetry (`toJSON()`) `🟢 [Daily Driver]`

Native `Error` properties (`name`, `message`, `stack`) are non-enumerable and vanish during `JSON.stringify(error)`. Implement a custom `toJSON()` method on your base `AppError`.

---

### Part 20 — 10-Point Senior Custom Error Architecture Checklist `🟢 [Daily Driver]`

```text
1. Does the custom error extend AppError and invoke super(message, options)?
2. Is Object.setPrototypeOf(this, new.target.prototype) included to preserve instanceof?
3. Is Error.captureStackTrace leveraged in V8 environments to trim constructor frames?
4. Are machine-readable codes (error.code) strictly separated from human messages?
5. Are root causes preserved during wrapping via ES2022 { cause: originalError }?
6. Is error metadata sanitized to prevent leaking passwords, tokens, or PII into logs?
7. Is class explosion avoided by favoring coarse classes with granular code strings?
8. Are unknown/unrecoverable errors re-thrown instead of silently swallowed?
9. Is non-Error thrown values normalized defensively before property access?
10. Is a custom toJSON() method provided for seamless telemetry serialization?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Strategy | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Custom `AppError` Subclasses** | Domain-driven frontend applications, enterprise SDKs, clean business layer branching. | Tiny one-off scripts, simple utility functions where native `Error` suffices. | Requires maintaining class hierarchy boilerplate. | Error codes on plain `Error`. |
| **Plain `Error` with `code`** | Lightweight libraries, simple micro-services with minimal inheritance needs. | Complex applications requiring multi-branch `instanceof` polymorphic routing. | Lacks class-level type discrimination in TypeScript. | Custom Error classes. |
| **Result Tuple / Monad (`[err, data]`)** | High-frequency parsing pipelines, Go/Rust-style deterministic local error handling. | Idiomatic JS/TS codebases where team expects standard `try/catch/await` control flow. | Incompatible with standard promise chaining unless unwrapped everywhere. | Custom `AppError` + `try/catch`. |
| **Structured Error Dictionaries** | REST / GraphQL JSON responses sent over the wire to UI clients. | Internal in-memory engine execution state (lacks native stack traces). | Must be converted to `Error` instances if re-thrown in runtime. | Custom `AppError` with `toJSON()`. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Multi-Tier Domain Error Engine with `Error.cause` & Form Field Mapping
```tsx
import React, { useState } from 'react';

// ==========================================
// 1. ENTERPRISE BASE & DOMAIN ERROR CLASSES
// ==========================================
export class AppError extends Error {
  public readonly code: string;
  public readonly metadata: Record<string, unknown>;

  constructor(
    message: string,
    options: { code?: string; cause?: unknown; metadata?: Record<string, unknown> } = {}
  ) {
    super(message, { cause: options.cause });
    this.name = this.constructor.name;
    this.code = options.code ?? 'INTERNAL_APPLICATION_ERROR';
    this.metadata = options.metadata ?? {};

    // Restore prototype chain
    Object.setPrototypeOf(this, new.target.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      metadata: this.metadata,
      stack: this.stack,
      cause: this.cause instanceof Error ? (this.cause as any).toJSON?.() ?? this.cause.message : this.cause
    };
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly fieldErrors: Record<string, string>,
    options?: { cause?: unknown }
  ) {
    super(message, { ...options, code: 'VALIDATION_ERROR' });
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'User authentication required', options?: { cause?: unknown }) {
    super(message, { ...options, code: 'AUTH_REQUIRED' });
  }
}

// ==========================================
// 2. DOMAIN SERVICE WITH LAYERED TRANSLATION
// ==========================================
export async function registerUserAccount(payload: { email: string; pass: string }) {
  try {
    const res = await fetch('/api/v1/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.status === 400 || res.status === 422) {
      const data = await res.json();
      throw new ValidationError('Registration validation failed', data.errors ?? { email: 'Invalid format' });
    }

    if (res.status === 401) {
      throw new AuthenticationError('Session expired during registration');
    }

    if (!res.ok) {
      throw new AppError(`Server responded with status ${res.status}`, { code: 'HTTP_SERVER_ERROR' });
    }

    return await res.json();
  } catch (rawError: unknown) {
    // 🟢 Error Wrapping: If not already a domain AppError, wrap with cause
    if (rawError instanceof AppError) {
      throw rawError;
    }
    throw new AppError('Unexpected network failure during registration', {
      code: 'REGISTRATION_PIPELINE_FAILED',
      cause: rawError,
      metadata: { attemptedEmailDomain: payload.email.split('@')[1] ?? 'unknown' }
    });
  }
}

// ==========================================
// 3. REACT FORM REGISTRATION COMPONENT
// ==========================================
export function EnterpriseRegistrationForm() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [bannerError, setBannerError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setBannerError(null);

    try {
      await registerUserAccount({ email, pass });
      alert('Registration successful!');
    } catch (err: unknown) {
      // 🟢 Polymorphic Error Handling via instanceof
      if (err instanceof ValidationError) {
        setFieldErrors(err.fieldErrors);
        setBannerError(err.message);
      } else if (err instanceof AuthenticationError) {
        setBannerError('Authentication session invalid. Redirecting to login...');
      } else if (err instanceof AppError) {
        setBannerError(`System Error [${err.code}]: ${err.message}`);
        console.error('[Telemetry Dispatch]', err.toJSON());
      } else {
        setBannerError('A fatal runtime failure occurred.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="registration-form">
      <h3>Enterprise User Registration</h3>

      {bannerError && <div className="error-banner">⚠️ {bannerError}</div>}

      <div className="form-group">
        <label>Email Address</label>
        <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} />
        {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
      </div>

      <div className="form-group">
        <label>Password</label>
        <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
        {fieldErrors.pass && <span className="field-error">{fieldErrors.pass}</span>}
      </div>

      <button type="submit">Create Account</button>
    </form>
  );
}
```

---

## 🧠 Part 02 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: `instanceof` Polymorphism with Inheritance
```js
class AppError extends Error {}
class NetworkError extends AppError {}
class TimeoutError extends NetworkError {}

const err = new TimeoutError("Request timed out");

console.log("Is TimeoutError?:", err instanceof TimeoutError);
console.log("Is NetworkError?:", err instanceof NetworkError);
console.log("Is AppError?:", err instanceof AppError);
console.log("Is Error?:", err instanceof Error);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Is TimeoutError?: true
Is NetworkError?: true
Is AppError?: true
Is Error?: true
```
**Why:** Subclassing establishes prototype delegation through the complete prototype chain (`TimeoutError.prototype` $\to$ `NetworkError.prototype` $\to$ `AppError.prototype` $\to$ `Error.prototype`).
</details>

---

### Prediction Challenge 2: Error Chaining with `Error.cause`
```js
function lowLevelQuery() {
  throw new Error("Disk read I/O error");
}

function serviceLayer() {
  try {
    lowLevelQuery();
  } catch (err) {
    throw new Error("Service unavailable", { cause: err });
  }
}

try {
  serviceLayer();
} catch (e) {
  console.log("Top Message:", e.message);
  console.log("Root Cause Message:", e.cause.message);
}
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Top Message: Service unavailable
Root Cause Message: Disk read I/O error
```
**Why:** Passing `{ cause: err }` to `super()` preserves the low-level exception on the `.cause` property of the newly created error object.
</details>

---

### Prediction Challenge 3: JSON Non-Enumerability of Errors
```js
const rawErr = new Error("Something went wrong");
rawErr.code = "CRITICAL_FAILURE";

console.log("JSON.stringify output:", JSON.stringify(rawErr));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
JSON.stringify output: {"code":"CRITICAL_FAILURE"}
```
**Why:** The standard `name`, `message`, and `stack` properties of JavaScript `Error` instances are non-enumerable by default. `JSON.stringify` only serializes enumerable own properties (`code`). A custom `toJSON()` method is required for full serialization.
</details>

---

### Prediction Challenge 4: Selective Catching & Re-throwing
```js
class AuthError extends Error {}
class DbError extends Error {}

function runTask(failType) {
  try {
    if (failType === "AUTH") throw new AuthError("Unauthorized");
    if (failType === "DB") throw new DbError("Connection refused");
  } catch (err) {
    if (err instanceof AuthError) {
      return "Handled Auth locally";
    }
    throw err; // Re-throw DbError
  }
}

console.log("Auth:", runTask("AUTH"));

try {
  runTask("DB");
} catch (e) {
  console.log("Caught upstream:", e.name);
}
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Auth: Handled Auth locally
Caught upstream: DbError
```
**Why:** `AuthError` was intercepted and resolved. `DbError` was unrecognized and re-thrown to the outer caller.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** Why should an application use custom error classes extending `Error` instead of generic `new Error()`?  
<details>
<summary><strong>Answer</strong></summary>
Custom error classes provide distinct semantic types that can be matched cleanly with `instanceof` in `catch` blocks. They also allow attaching structured machine-readable metadata (`code`, `fields`, `status`) without polluting the human-readable `message` string.
</details>

**Q2:** How does the ES2022 `Error.cause` property work, and what problem does it solve?  
<details>
<summary><strong>Answer</strong></summary>
`Error.cause` enables error wrapping/chaining. When catching a low-level technical failure, a developer can throw a higher-level domain error while passing `{ cause: originalError }`. This preserves the original error and its stack trace on the `.cause` property, preventing the loss of diagnostic root-cause evidence.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** Why does `JSON.stringify(new Error("msg"))` return `{}` (an empty object)? How do you fix it?  
<details>
<summary><strong>Answer</strong></summary>
In JavaScript engines, the `name`, `message`, and `stack` properties of `Error` instances are defined as non-enumerable (`enumerable: false`). `JSON.stringify()` skips non-enumerable properties. To fix this, implement a custom `toJSON()` method on your base error class that explicitly returns an object containing `name`, `message`, `code`, `stack`, and `metadata`.
</details>

**Q4:** When should you re-throw an error versus wrap it with `Error.cause`?  
<details>
<summary><strong>Answer</strong></summary>
- **Re-throw:** When the error already possesses accurate domain semantics and the current layer cannot recover or add meaningful context (e.g. letting a `ValidationError` bubble straight to the form UI).  
- **Wrap:** When crossing architectural boundaries where a low-level technical failure (e.g. `ECONNRESET`, `TypeError`) must be translated into an application-level domain concept (`BillingServiceUnavailableError`) while preserving the underlying root cause.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** Why is `Object.setPrototypeOf(this, new.target.prototype)` critical in custom error constructors when targeting ES5 or older bundlers?  
<details>
<summary><strong>Answer</strong></summary>
When ES6 class inheritance is transpiled to ES5, calling `super()` inside constructor functions calls `Error.call(this)`. Because the native `Error` constructor ignores `this` and returns a newly constructed `Error` instance with `Error.prototype`, the prototype link to the custom error class (`ValidationError.prototype`) is broken. Manually setting `Object.setPrototypeOf(this, new.target.prototype)` explicitly re-links the prototype chain, guaranteeing `instanceof` evaluates to `true`.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How do you design an enterprise-wide error taxonomy for a micro-frontend distributed system that balances developer diagnostic granularity with end-user security and PII compliance?  
<details>
<summary><strong>Answer</strong></summary>
1. **Hierarchical Taxonomy:** Establish a shared core package (`@corp/errors`) defining a root `AppError` and coarse domain categories (`AuthError`, `ValidationError`, `NetworkError`, `InternalSystemError`) with standardized string union `ErrorCode` constants.  
2. **Metadata Sanitization:** Enforce strict metadata schema rules: allow only primitive IDs and sanitized operational context; actively filter out headers, bearer tokens, passwords, and PII before serialization.  
3. **Dual Serialization Interfaces:** Provide `toUserMessage()` (sanitized, localized, human-safe messages) for UI presentation, and `toTelemetryPayload()` (full causal tree, unmasked error codes, and V8 stack traces) for backend monitoring (Sentry/Datadog).
</details>

---

## 🛠️ Senior Architecture Challenge: Enterprise Multi-Tier Domain Error Engine with Cause Chaining & Sanitization

```js
// See runnable implementation in examples/02-error-objects-custom-errors-cause.js
```

---

## Key Takeaways
1. **Custom `AppError` Base:** Standardize `code`, `metadata`, `cause`, and prototype restoration.
2. **ES2022 `Error.cause`:** Always wrap technical errors into domain models with cause chaining.
3. **Machine `code` over Strings:** Drive UI logic and internationalization via `error.code`.
4. **Sanitize Telemetry:** Never leak authentication tokens or PII into error metadata.
5. **Polymorphic Catching:** Match known exceptions with `instanceof` and re-throw unknowns.

---

[⬅️ Part 01: Error Mental Model, Taxonomy & try/catch/finally](./01-error-mental-model-taxonomy-try-catch-finally.md) | [📚 KPI 10 Index](./README.md) | [Part 03: Asynchronous Error Handling & Network Resilience ➡️](./03-async-error-handling-network-resilience.md)
