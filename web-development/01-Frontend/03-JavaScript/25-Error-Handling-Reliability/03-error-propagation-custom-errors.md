# KPI 25 — Part 03: Error Propagation, Custom Errors & Error Taxonomy

[⬅️ Part 02: try / catch / finally Mechanics](./02-try-catch-finally-mechanics.md) | [📚 KPI 25 Index](./README.md) | [Part 04: Async Errors & Promise Rejections ➡️](./04-async-errors-promise-rejections.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Taxonomy / Concept | Mechanism & Purpose | Key Properties | Senior Engineering Standard |
|---|---|---|---|
| **Error Propagation** | Uncaught exceptions unwind the active call stack upward until intercepted. | Traverses function frames transparently ($C \to B \to A$) without manual forwarding. | 🟢 Allow errors to bubble to the layer capable of making a meaningful recovery decision. |
| **Premature Catching** | Catching an error too early and returning `null` or hiding the failure. | Causes catastrophic **Information Loss** (caller cannot differentiate 404, 401, or 500). | 🔴 **NEVER catch at the transport layer just to return `null`:** Propagate or transform with `{ cause }`. |
| **Custom Error Classes** | Subclassing `Error` (`class AppError extends Error`) to model domain failures. | Provides `name`, `code`, `statusCode`, and `metadata` for type-safe handling. | 🟢 Set `this.name = this.constructor.name` and maintain prototype chains. |
| **Error Taxonomy** | Standardized 9-category failure matrix (Validation, Auth, Network, NotFound, etc.). | Maps technical exceptions directly to user recovery strategies (Retry, Login, Input). | 🟢 Use stable machine codes (`USER_NOT_FOUND`), never fragile human strings (`"User not found"`). |
| **Causal Error Chains** | Wrapping technical errors in domain errors via `new DomainError(msg, { cause: err })`. | Preserves the root-cause stack trace while providing high-level business context. | 🟢 Always attach `{ cause: lowLevelError }` when translating errors across layers. |
| **Transport Normalization** | Converting heterogeneous API formats (Fetch, Axios, GraphQL) to domain errors. | Isolates transport details from business services and UI components. | 🟢 Normalize external payloads at the API boundary into unified `AppError` subclasses. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: Premature Information Loss & Fragile String Checks
> 
> #### Gotcha A: The Premature Catch "Information Loss" Trap (`try { ... } catch { return null }`)
> *"Why did our mobile app show 'No products available' when our API server was actually down?"*  
> ```js
> // ❌ DISASTROUS PREMATURE INFORMATION LOSS:
> async function fetchProductById(productId) {
>   try {
>     const response = await fetch(`/api/products/${productId}`);
>     if (!response.ok) throw new Error(`HTTP ${response.status}`);
>     return await response.json();
>   } catch (err) {
>     // 💥 FATAL MISTAKE: Converting all errors to null at the lowest layer!
>     // The caller cannot tell if:
>     // 1. Product doesn't exist (404) -> Show "Not Found"
>     // 2. Token expired (401) -> Redirect to Login
>     // 3. Server crashed (500) -> Show "Retry"
>     // 4. Developer typo (TypeError) -> Code Bug!
>     return null;
>   }
> }
> ```
> **Deep Architectural Explanation:**  
> Swallowing errors at the transport layer and returning `null` destroys all diagnostic and domain context. The UI receives `null` and assumes the product list is legitimately empty, rendering a misleading "No products in store" message instead of triggering an authentication redirect or network retry prompt.  
> **The Senior Standard:** Propagate the error upward, or wrap it in a typed domain error that preserves the original cause:
> ```js
> // ✅ PRESERVING CONTEXTUAL CAUSE & PROPAGATION:
> async function fetchProductByIdSafe(productId) {
>   try {
>     const res = await fetch(`/api/products/${productId}`);
>     if (res.status === 404) throw new NotFoundError(`Product [${productId}] does not exist`, "PRODUCT_NOT_FOUND");
>     if (res.status === 401) throw new AuthenticationError("Session expired", "SESSION_EXPIRED");
>     if (!res.ok) throw new HttpError(`API Server Error (${res.status})`, res.status);
>     return await res.json();
>   } catch (err) {
>     // 🟢 Preserves root cause while providing high-level context!
>     if (err instanceof AppError) throw err;
>     throw new ProductLoadError(`Failed to load product ${productId}`, { cause: err });
>   }
> }
> ```
> 
> ---
> 
> #### Gotcha B: Fragile String Matching vs Machine-Readable Error Codes
> *"Why did our checkout validation break in production when marketing updated the copy?"*  
> ```js
> // ❌ FRAGILE STRING MATCHING:
> try {
>   await processPayment(card);
> } catch (err) {
>   // 💥 FATAL FRAGILITY: Relying on human-readable English strings!
>   // When the backend changes "Card declined" to "Your credit card was declined" or localizes to Spanish,
>   // this check SILENTLY FAILS and falls through to the generic crash boundary!
>   if (err.message === "Card declined") {
>     promptForNewCard();
>   } else {
>     crashEntireApp(err);
>   }
> }
> ```
> **Deep Architectural Explanation:**  
> Error messages (`error.message`) are designed exclusively for human readability and debugging logs. They frequently change during copy refactors, localization (i18n), and library updates. Building programmatic control flow around string equality checks results in brittle, breakable code.  
> **The Senior Standard:** Use strongly typed custom Error classes and stable machine-readable error codes:
> ```js
> // ✅ TYPE-SAFE INSTANCEOF & ERROR CODE SWITCHING:
> try {
>   await processPayment(card);
> } catch (err) {
>   if (err instanceof PaymentDeclinedError || err.code === "CARD_DECLINED") {
>     // 🟢 Guaranteed stable across localization and copy changes!
>     promptForNewCard();
>   } else {
>     reportToSentryAndFallback(err);
>   }
> }
> ```

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / Next.js / Vite Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Custom Error classes (`class AppError extends Error`), Error codes, `instanceof` switching | Universal requirement for building API services, React Query mutation handlers, and form validation. |
| 🟡 **Moderate** | Used in ~45% of code | Error translation pipelines, Preserving `{ cause }`, Transport normalization | Critical for enterprise SDKs, micro-frontends, payment gateways, and backend-for-frontend (BFF) clients. |
| 🔵 **Foundational / Engine** | Runtime internals | Prototype chain restoration (`Object.setPrototypeOf`), V8 stack trace capture, Realm boundaries | Required for Staff/Principal architecture reviews, SDK open-source packages, and telemetry engines. |

---

## Core Concepts (20 Subtopics)

### Part 1 — What Is Error Propagation? Unwinding Active Call Frames `🟢 [Daily Driver]`

When an exception is thrown, the JavaScript runtime automatically unwinds the execution call stack frame by frame until a matching `catch` block is reached.

---

### Part 2 — Function Boundary Transparency `🟢 [Daily Driver]`

Errors propagate effortlessly across function boundaries without requiring intermediate callers to write boilerplate forwarding code.

---

### Part 3 — Error Creation vs Propagation vs Boundary Handling `🟢 [Daily Driver]`

- **Creation:** Low-level function detects contract violation and throws (`throw new HttpError()`).
- **Propagation:** Intermediate layers let the exception bubble upward.
- **Handling:** Architectural boundary intercepts the error to recover, render fallback UI, or notify users.

---

### Part 4 — The Anti-Pattern: Premature Catching & Information Loss `🔴 [Production-Critical]`

Catching errors at lower layers only to return `null` or generic strings destroys diagnostic context and leads to misleading UI states.

---

### Part 5 — Multi-Layer Error Translation: Infrastructure $\to$ Domain $\to$ UI `🟢 [Daily Driver]`

$$\text{Fetch / Network (HTTP 401)} \implies \text{API Client (AuthenticationError)} \implies \text{Domain Service (SessionExpired)} \implies \text{UI (Redirect to Login)}$$

---

### Part 6 — What Is a Custom Error Class? Subclassing `Error` `🟢 [Daily Driver]`

```ts
export class AppError extends Error {
  public readonly timestamp: number = Date.now();
  constructor(message: string, public readonly code: string, options?: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype); // Restores prototype chain
  }
}
```

---

### Part 7 — Prototype Inheritance & `instanceof` Switching `🟢 [Daily Driver]`

Subclasses of `Error` inherit `Error.prototype`, allowing clean polymorphic recovery via `if (err instanceof ValidationError)`.

---

### Part 8 — Structuring an Enterprise Error Hierarchy `🔵 [Foundational / Engine]`

$$\text{Error} \implies \text{AppError} \implies \{\text{ValidationError}, \text{HttpError}, \text{AuthError}, \text{NotFoundError}, \text{ConflictError}\}$$

---

### Part 9 — The Granularity Antipattern: Excessive Micro-Classes `🟢 [Daily Driver]`

Do not create 50 hyper-specific classes (`InvalidEmailError`, `EmailTooShortError`). Use a single `ValidationError` with structured `fields` metadata.

---

### Part 10 — What Is an Error Taxonomy? The 9 Core Frontend Failure Categories `🟢 [Daily Driver]`

1. **Validation:** Invalid user input $\implies$ Highlight input fields.
2. **Authentication:** Missing or expired session $\implies$ Redirect to login.
3. **Authorization:** Insufficient permissions $\implies$ Show 403 Forbidden screen.
4. **Not Found:** Missing resource $\implies$ Show 404 empty state.
5. **Conflict:** State mismatch (e.g. edit collision) $\implies$ Prompt user to rebase/reload.
6. **Network:** Offline or connection drop $\implies$ Show retry button.
7. **Timeout:** Slow gateway $\implies$ Retry request.
8. **Server:** 500 internal server error $\implies$ Show fallback widget.
9. **Unexpected:** Uncaught bug / TypeError $\implies$ Log to Sentry & render Error Boundary.

---

### Part 11 — Stable Machine Error Codes vs Fragile Human Messages `🔴 [Production-Critical]`

Always attach a machine-readable string (e.g. `code: "INVALID_CREDENTIALS"`); never match against `err.message === "Invalid credentials"`.

---

### Part 12 — The Complete Enterprise `AppError` Contract `🟢 [Daily Driver]`

Includes `name`, `message`, `code`, `statusCode`, `cause`, and contextual `metadata`.

---

### Part 13 — Error Chaining & Causal Traceability with `{ cause }` `🟢 [Daily Driver]`

Preserves the complete diagnostic trace from low-level network errors up to high-level UI actions:
```js
throw new OrderProcessingError("Order #992 failed to process", { cause: apiError });
```

---

### Part 14 — Adding Context at the Appropriate Architectural Layer `🟢 [Daily Driver]`

The API layer adds endpoint information; the Domain layer adds entity IDs; the UI layer adds user action context.

---

### Part 15 — The "Meaningless Wrapper" Anti-Pattern `🟢 [Daily Driver]`

Do not wrap errors if you are not adding new domain meaning or recovery metadata. Re-throw directly instead of nesting generic `new Error("Error", { cause })`.

---

### Part 16 — Observing vs Owning: When to Re-Throw Unhandled Errors `🟢 [Daily Driver]`

If an intermediate layer catches an error solely for logging, it **must re-throw** (`throw err`) so higher boundaries can execute recovery.

---

### Part 17 — Handling Known Errors while Propagating Unknown Crashes `🟢 [Daily Driver]`

```js
try {
  await submitForm();
} catch (err) {
  if (err instanceof ValidationError) showFieldErrors(err.fields);
  else throw err; // 🟢 Let unexpected bugs bubble to global APM!
}
```

---

### Part 18 — Transport Error Normalization `🟢 [Daily Driver]`

Convert heterogeneous error responses from REST (`res.status`), Axios (`err.response`), and GraphQL (`err.errors`) into unified `AppError` subclasses at the repository boundary.

---

### Part 19 — End-to-End Walkthrough: Product Loading Error Translation `🟢 [Daily Driver]`

Trace an HTTP 404 from `fetch()` $\to$ `NotFoundError` $\to$ React UI rendering `<EmptyState />`.

---

### Part 20 — The 10-Point Senior Error Hierarchy & Taxonomy Audit Checklist `🟢 [Daily Driver]`

```text
1. Are custom errors derived from AppError? ──► 2. Are prototype chains restored?
3. Are stable machine codes attached? ──► 4. Is fragile string matching eliminated?
5. Is { cause } preserved across layers? ──► 6. Are excessive micro-classes avoided?
7. Is transport data normalized at API boundary? ──► 8. Are unknown errors re-thrown?
9. Is sensitive user data scrubbed from metadata? ──► 10. Does UI match the 9 taxonomy categories?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Error Representation Pattern | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Class-Based Custom Errors (`AppError`)** | Enterprise domain models, layered backend/frontend architectures, type-safe switching. | Small 50-line utility scripts or simple synchronous pure functions. | Requires class definitions and prototype restoration. | Discriminated union Result types. |
| **Error Code Enums with Metadata** | Microservices, REST/GraphQL API boundaries, cross-language SDKs. | Deeply polymorphic object-oriented domain engines. | Lacks native `instanceof` ergonomics without custom type guards. | Custom Error classes. |
| **Discriminated Union Results (`Result<T, E>`)** | High-throughput functional pipelines, async workflows where exceptions are costly. | Deep nested call stacks where bubbling via exceptions is cleaner. | Requires callers to handle errors at every single step explicitly. | Standard `try/catch`. |
| **Sentinel Returns (`null` / `-1`)** | Expected benign non-presence (e.g. finding an element in a cache or array). | Operations where failure causes must be distinguished (401 vs 404 vs 500). | Destroys all failure context (Information Loss). | Custom Errors / `Result<T, E>`. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Domain Error Hierarchy & Normalizer in TypeScript
```tsx
import React, { useState, useCallback } from 'react';

// ==========================================
// 1. ENTERPRISE ERROR TAXONOMY HIERARCHY
// ==========================================
export abstract class AppError extends Error {
  public readonly timestamp: number = Date.now();

  constructor(
    message: string,
    public readonly code: string,
    public readonly metadata: Record<string, unknown> = {},
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public readonly fields: Record<string, string>, options?: ErrorOptions) {
    super(message, 'VALIDATION_FAILED', { fields }, options);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, public readonly resourceName: string, options?: ErrorOptions) {
    super(message, 'RESOURCE_NOT_FOUND', { resourceName }, options);
  }
}

export class HttpTransportError extends AppError {
  constructor(message: string, public readonly statusCode: number, options?: ErrorOptions) {
    super(message, 'HTTP_TRANSPORT_ERROR', { statusCode }, options);
  }
}

// ==========================================
// 2. ERROR NORMALIZATION GATEWAY
// ==========================================
export class ErrorNormalizer {
  static normalize(error: unknown): AppError {
    if (error instanceof AppError) return error;

    if (error instanceof TypeError) {
      return new HttpTransportError('Network connection failed or host unreachable', 0, { cause: error });
    }

    if (error instanceof Error) {
      return new HttpTransportError(error.message, 500, { cause: error });
    }

    return new HttpTransportError('An unexpected unknown error occurred', 500, {
      cause: new Error(String(error))
    });
  }
}

// ==========================================
// 3. ENTERPRISE ERROR TAXONOMY DASHBOARD
// ==========================================
export function EnterpriseErrorTaxonomyDashboard() {
  const [activeError, setActiveError] = useState<AppError | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('System Ready');

  const triggerFailure = useCallback((type: 'VALIDATION' | 'NOT_FOUND' | 'NETWORK' | 'UNKNOWN') => {
    try {
      if (type === 'VALIDATION') {
        throw new ValidationError('User submission failed validation rules', {
          email: 'Invalid domain',
          age: 'Must be 18+'
        });
      } else if (type === 'NOT_FOUND') {
        throw new NotFoundError('Customer record #4089 does not exist', 'CustomerProfile');
      } else if (type === 'NETWORK') {
        throw new TypeError('Failed to fetch (Simulated CORS / Offline error)');
      } else {
        throw 'Raw string exception thrown by legacy code';
      }
    } catch (rawErr) {
      // 🟢 Central Normalization Layer
      const normalized = ErrorNormalizer.normalize(rawErr);
      setActiveError(normalized);
      setStatusMessage(`Handled [${normalized.code}]`);
    }
  }, []);

  return (
    <div className="taxonomy-dashboard-card">
      <header className="card-header">
        <h3>Enterprise Error Taxonomy &amp; Normalization Engine</h3>
        <span className="badge">🛡️ Structured Error Taxonomy</span>
      </header>

      <p className="architecture-description">
        Demonstrates custom <code>AppError</code> hierarchy, prototype chain restoration, machine-readable error codes, and automatic legacy error normalization.
      </p>

      <div className="controls-row">
        <button type="button" onClick={() => triggerFailure('VALIDATION')} className="btn-validation">
          Trigger Validation Error
        </button>
        <button type="button" onClick={() => triggerFailure('NOT_FOUND')} className="btn-notfound">
          Trigger NotFound Error
        </button>
        <button type="button" onClick={() => triggerFailure('NETWORK')} className="btn-network">
          Trigger Network TypeError
        </button>
        <button type="button" onClick={() => triggerFailure('UNKNOWN')} className="btn-unknown">
          Trigger Raw String Error
        </button>
      </div>

      <div className="status-banner">
        <span>Current Status: <strong>{statusMessage}</strong></span>
      </div>

      {activeError && (
        <div className="error-details-panel">
          <h4>Active Normalized Error:</h4>
          <div className="error-property"><span>Class Name:</span> <strong>{activeError.name}</strong></div>
          <div className="error-property"><span>Error Code:</span> <code>{activeError.code}</code></div>
          <div className="error-property"><span>Message:</span> {activeError.message}</div>
          <div className="error-property"><span>Has Root Cause:</span> {activeError.cause ? '✅ Yes' : '❌ None'}</div>
          <div className="error-property"><span>Metadata:</span> <code>{JSON.stringify(activeError.metadata)}</code></div>
        </div>
      )}
    </div>
  );
}
```

---

## 🧠 Part 03 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: Error Propagation & Layered Catching
```js
function queryDb() { throw new Error("Connection Timeout"); }
function getUser() {
  try { queryDb(); }
  catch (e) { throw new Error("User Service Unavailable", { cause: e }); }
}
function renderPage() {
  try { getUser(); }
  catch (e) {
    console.log(e.message);
    console.log(e.cause.message);
  }
}
renderPage();
```
**Question:** What will the two `console.log` statements output?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:**  
1. `"User Service Unavailable"` (The high-level domain error message).  
2. `"Connection Timeout"` (The root causal error message preserved via `{ cause }`).
</details>

---

### Prediction Challenge 2: Custom Error Prototype Chain & `instanceof`
```js
class AppError extends Error {}
class ValidationError extends AppError {}
const err = new ValidationError("Email invalid");

console.log(err instanceof ValidationError);
console.log(err instanceof AppError);
console.log(err instanceof Error);
```
**Question:** What will the three `console.log` statements output?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:** **`true`**, **`true`**, **`true`**.  
**Why:** `ValidationError` inherits from `AppError`, which inherits from `Error.prototype`. The JavaScript prototype chain verifies that `err` is an instance of all three classes.
</details>

---

### Prediction Challenge 3: The Premature Catch Information Loss Trap
```js
async function getData() {
  try { throw new Error("HTTP 401 Unauthorized"); }
  catch { return null; }
}
const result = await getData();
```
**Question:** What is the value of `result`, and what critical architectural flaw occurred?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:**  
- `result` is `null`.  
- **Flaw:** **Information Loss.** The caller cannot distinguish between an unauthorized session (which requires a login redirect) and an empty database record.
</details>

---

### Prediction Challenge 4: Error Code vs Message Matching
```js
class PaymentError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}
const err = new PaymentError("Your credit card expired", "CARD_EXPIRED");
```
**Question:** Should business recovery logic switch on `err.message` or `err.code`?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:** **`err.code`**.  
**Why:** Error codes (`"CARD_EXPIRED"`) are permanent, machine-readable contracts unaffected by marketing copy updates or multilingual localization (i18n).
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is Error Propagation in JavaScript?  
<details>
<summary><strong>Answer</strong></summary>
Error Propagation is the automatic process where an unhandled exception travels upward through the active execution call stack, exiting current function scopes until an enclosing `try/catch` block intercepts it. If no handler exists, it reaches the global environment as an unhandled error crash.
</details>

**Q2:** How do you create a custom Error class in JavaScript?  
<details>
<summary><strong>Answer</strong></summary>
Create a class that `extends Error`, invoke `super(message, options)` in the constructor, assign `this.name = this.constructor.name`, and optionally attach custom properties like `code` or `metadata`.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** Why is matching against `error.message` considered an antipattern, and what should be used instead?  
<details>
<summary><strong>Answer</strong></summary>
`error.message` is meant for human debugging logs and frequently changes during copy refactoring, API revisions, and localization (i18n). Switching on string messages creates brittle code that silently breaks when wording changes. Senior engineers use **custom Error classes with `instanceof`** or **stable machine-readable error codes (`error.code`)**.
</details>

**Q4:** What is "Information Loss" in error handling, and how do you prevent it?  
<details>
<summary><strong>Answer</strong></summary>
Information Loss occurs when a lower architectural layer prematurely catches an exception and converts it into a generic `null`, `false`, or generic string. This deprives higher layers of knowing whether the operation failed due to a network drop, an authentication expiration, or a 404. It is prevented by letting errors bubble to appropriate boundaries or wrapping them using `new Error(msg, { cause: originalError })`.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** How do you design a 9-category frontend error taxonomy that maps directly to UI states?  
<details>
<summary><strong>Answer</strong></summary>
Structure an abstract `AppError` base class with 9 derived domain categories:  
1. `ValidationError` $\to$ Highlight invalid form fields.  
2. `AuthenticationError` $\to$ Trigger OAuth / Login modal.  
3. `AuthorizationError` $\to$ Render 403 Forbidden screen.  
4. `NotFoundError` $\to$ Display contextual Empty State.  
5. `ConflictError` $\to$ Show version diff / reload prompt.  
6. `NetworkError` $\to$ Display toast with "Retry" action.  
7. `TimeoutError` $\to$ Offer automatic retry with exponential backoff.  
8. `ServerError` $\to$ Render isolated fallback widget.  
9. `UnexpectedError` $\to$ Report to Sentry and trigger React Error Boundary.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** Why can `instanceof CustomError` fail across JavaScript Realm / Iframe boundaries, and how do you architect a bulletproof cross-realm error serialization protocol?  
<details>
<summary><strong>Answer</strong></summary>
1. **Cross-Realm Prototype Incompatibility:** Each browser realm (window, iframe, web worker) possesses its own separate `window.Error` prototype memory address. An error instantiated inside an iframe will return `false` for `err instanceof parentWindow.CustomError` because prototype identities differ.  
2. **Discriminant Property Protocol:** Equip all custom error classes with a non-enumerable, readonly discriminant symbol or string property: `readonly _brand = 'AppError'` and `readonly code: ErrorCode`.  
3. **Type Guard Architecture:** Implement custom type guards (`isAppError(err): err is AppError`) that check `err?._brand === 'AppError'` or `typeof err?.code === 'string'`, ensuring 100% reliable error classification across iframes, Web Workers, and serialized JSON boundary layers.
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Error Hierarchy & Normalization Engine

```js
// See runnable implementation in examples/03-error-propagation-custom-errors.js
```

---

## Key Takeaways
1. **Never Prematurely Swallow Errors:** Avoid `catch { return null }` to prevent information loss.
2. **Use Machine-Readable Codes:** Switch on `err.code`, never fragile `err.message` strings.
3. **Chain Roots with `{ cause }`:** Maintain full diagnostic traceability across architectural layers.
4. **Normalize at the API Boundary:** Translate REST/GraphQL errors into cohesive domain subclasses.
5. **Classify by Recovery:** Group errors into taxonomy categories that dictate explicit UI actions.

---

[⬅️ Part 02: try / catch / finally Mechanics](./02-try-catch-finally-mechanics.md) | [📚 KPI 25 Index](./README.md) | [Part 04: Async Errors & Promise Rejections ➡️](./04-async-errors-promise-rejections.md)
