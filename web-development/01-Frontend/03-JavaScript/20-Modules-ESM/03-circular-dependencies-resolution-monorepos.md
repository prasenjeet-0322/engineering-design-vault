# KPI 14 (ESM) — Part 03: Circular Dependencies, Module Resolution, Dependency Direction & Stable Boundaries

[⬅️ Part 02: Dynamic `import()`, Code Splitting & Tree Shaking](./02-module-loading-dynamic-imports-tree-shaking.md) | [📚 KPI 20/14 Index](./README.md) | [KPI 10/15 — Error Handling & Resilient JavaScript ➡️](../10-Error-Handling-Debugging/README.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Architectural Concept | Core Mechanism | Critical Production Risk | Senior Production Standard |
|---|---|---|---|
| **Circular Dependency** | Module A imports Module B; Module B imports Module A. | Top-level TDZ crash / `undefined` bindings. | 🔴 Break cycles by extracting shared abstractions or adding orchestrators. |
| **Partial Initialization** | Engine links live bindings before evaluating code. | Evaluating cyclic `const` variables crashes at runtime. | 🟢 Avoid accessing imported bindings in top-level module scope during evaluation. |
| **Dependency Direction** | Dependencies strictly flow downward ($\text{UI} \to \text{Feature} \to \text{Domain} \to \text{Infra}$). | Low-level modules importing UI components. | 🔴 Low-level infrastructure must **never** import UI layer code. |
| **Module Resolution** | Resolves specifiers via path aliases (`@/`) or relative paths. | Clean path aliases masking architectural rot. | 🟢 Use aliases for ergonomics, but enforce layer boundaries via ESLint. |
| **Public API Facade** | `index.ts` exposes small, intentional capability surfaces. | Deep private imports coupling external features. | 🟢 External modules consume only the root `features/*/index.ts`. |
| **Workflow Orchestrator** | High-level coordinator managing multi-feature workflows. | Features directly importing each other ($A \leftrightarrow B$). | 🟢 Introduce a coordinator (e.g. `CheckoutOrchestrator`) above `Cart` & `Payment`. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: Circular TDZ Evaluation Crashes & Infrastructure Layer Inversion
> 
> #### Gotcha A: Temporal Dead Zone (TDZ) Runtime Crash in Circular ESM Imports
> *"Why did adding a circular import cause a `ReferenceError: Cannot access 'TaxCalculator' before initialization` crash on application startup?"*  
> ```js
> // ❌ DANGEROUS TOP-LEVEL ACCESS IN CIRCULAR MODULES:
> // order.mjs
> import { calculateTax } from "./tax.mjs";
> export const ORDER_BASE_FEE = 10;
> export const DEFAULT_ORDER_TAX = calculateTax(ORDER_BASE_FEE); // 💥 TDZ CRASH!
> 
> // tax.mjs
> import { ORDER_BASE_FEE } from "./order.mjs";
> export function calculateTax(amount) {
>   return amount * 0.15 + ORDER_BASE_FEE; // 💥 ORDER_BASE_FEE is uninitialized!
> }
> ```
> **Deep Architectural Explanation:**  
> In ES Modules, module evaluation traverses the graph in post-order depth-first search. When `order.mjs` imports `tax.mjs`, evaluation switches to `tax.mjs`. When `tax.mjs` imports `order.mjs`, the engine returns `order.mjs`'s uninitialized module record to prevent an infinite loop. When `order.mjs` calls `calculateTax()` at top-level evaluation time, `ORDER_BASE_FEE` is still in the Temporal Dead Zone (TDZ), throwing a fatal `ReferenceError`.  
> **The Senior Standard:** Never execute functions that access imported bindings in top-level module scope. Defer execution to runtime function calls or extract `ORDER_BASE_FEE` into a low-level `orderConstants.mjs` file.
> 
> ---
> 
> #### Gotcha B: Infrastructure Layer Inversion (HTTP Client Importing UI Components)
> *"Why did importing our generic `httpClient.ts` inside a background Web Worker or Node.js test suite fail with `Cannot find module '../components/LoginModal'`?"*  
> ```js
> // ❌ FATAL ARCHITECTURAL INVERSION:
> // infrastructure/httpClient.ts
> import { showLoginModal } from "../components/LoginModal"; // 💥 Infrastructure depends on UI!
> export async function apiRequest(url: string) {
>   const res = await fetch(url);
>   if (res.status === 401) showLoginModal(); // 💥 Coupled to DOM UI!
>   return res;
> }
> ```
> **Deep Architectural Explanation:**  
> Infrastructure modules (HTTP clients, crypto utilities, storage drivers) must be completely decoupled from presentation logic. Importing a React UI component into an HTTP client creates inverted dependency direction, circular dependency hazards, and breaks reusability across non-DOM contexts (React Native, Web Workers, Node.js SSR).  
> **The Senior Standard:** Infrastructure must emit typed domain errors (`throw new UnauthorizedError()`) or event signals. The UI/Application layer catches the error and decides whether to display a modal.

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / Next.js / Vite Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Unidirectional dependency flow, path aliases (`@/features`), public `index.ts` facades | Fundamental to keeping codebases scalable, maintainable, and free of mysterious initialization bugs. |
| 🟡 **Moderate** | Used in ~45% of code | Decoupling circular dependencies via layer extraction, workflow orchestrators | Essential for multi-feature platforms (e.g. e-commerce cart + checkout + inventory). |
| 🔵 **Foundational / Engine** | Runtime internals | ECMAScript cyclic module record evaluation, DAG topological sorting, TDZ semantics | Mandatory for Staff/Principal architecture reviews, monorepo design, and bundler tooling. |

---

## Core Concepts (20 Subtopics)

### Part 1 — Anatomy of Direct & Indirect Circular Dependencies `🟢 [Daily Driver]`

- **Direct Cycle ($A \leftrightarrow B$):** `a.ts` imports `b.ts` and `b.ts` imports `a.ts`.
- **Indirect Cycle ($A \to B \to C \to A$):** Cascading multi-file cycle, often obscured across barrel files.

---

### Part 2 — ESM 3-Phase Linking & Instantiation `🔵 [Foundational / Engine]`

1. **Construction:** Parse AST and discover dependency specifiers.
2. **Instantiation:** Allocate live binding memory references across all modules.
3. **Evaluation:** Execute top-level JavaScript statements in post-order depth-first traversal.

---

### Part 3 — Partially Initialized Modules & Top-Level TDZ Crashes `🔴 [Production-Critical]`

If module A accesses a `const` or `let` from module B before module B has evaluated, the engine throws a `ReferenceError` (Temporal Dead Zone).

---

### Part 4 — Deferred Function Calls vs Immediate Evaluation in Cycles `🟢 [Daily Driver]`

Cycles containing only functions that execute *after* application startup often run without crashing, but remain an architectural code smell.

---

### Part 5 — Circular Dependency vs Call-Stack Recursion `🟢 [Daily Driver]`

- **Circular Module Dependency:** Static module graph coupling at load time.
- **Recursive Function Call:** Dynamic runtime call stack execution with base-case termination.

---

### Part 6 — Real-World Authentication Cycle Analysis `🟢 [Daily Driver]`

```text
[ authService ] ──► [ authStore ] ──► [ authApi ] ──► [ authService ] (💥 Cycle!)
```

---

### Part 7 — Decoupling Cycles via Layer Extraction `🟢 [Daily Driver]`

Extract the shared low-level dependency (`tokenStorage.ts`) so that both `authService` and `authApi` depend downward on `tokenStorage`.

---

### Part 8 — Strict Unidirectional Dependency Direction `🟢 [Daily Driver]`

```text
[ UI Components ] ──► [ Feature Hooks ] ──► [ Domain Services ] ──► [ Infrastructure ]
```
Dependencies must strictly flow downward. Lower layers must **never** import upper layers.

---

### Part 9 — High-Level Domain/UI vs Low-Level Infrastructure `🟢 [Daily Driver]`

- **High-Level:** Cart calculation, Checkout flow, User profile UI.
- **Low-Level:** HTTP client, Token storage, Date formatting, Logging.

---

### Part 10 — Infrastructure Inversion Pitfall `🔴 [Production-Critical]`

Never allow `httpClient.ts` to import React UI components (`<LoginModal />`).

---

### Part 11 — Error-Driven Layer Decoupling `🟢 [Daily Driver]`

Let infrastructure throw typed domain exceptions (`throw new UnauthorizedError()`); let UI catch and handle presentation.

---

### Part 12 — Node & Browser Module Resolution Algorithms `🔵 [Foundational / Engine]`

Resolution maps specifiers (`./utils`, `@/features`, `lodash-es`) through `node_modules`, `exports` maps in `package.json`, and `tsconfig.json` paths.

---

### Part 13 — Relative (`./`, `../`) vs Absolute Path Aliases (`@/`) `🟢 [Daily Driver]`

Path aliases (`@/components/Button`) eliminate brittle `../../../../` relative traversal paths during file refactoring.

---

### Part 14 — The Path Alias Illusion `🟢 [Daily Driver]`

A clean `@/features/auth` import path does not fix circular dependencies or bad dependency direction.

---

### Part 15 — Feature-Sliced Module Boundaries `🟢 [Daily Driver]`

Encapsulate feature internals (`features/cart/internal/*`); expose capabilities through `features/cart/index.ts`.

---

### Part 16 — Designing Minimal Public API Surfaces `🟢 [Daily Driver]`

Export only high-level capabilities (`addToCart`, `useCart`), keeping helper functions and internal state private.

---

### Part 17 — The Monolithic `shared/` Dumping Ground Trap `🟢 [Daily Driver]`

Do not dump domain-specific logic into `shared/`. Only generic, reusable infrastructure belongs in `shared/`.

---

### Part 18 — Cross-Feature Coupling vs Workflow Orchestrators `🟢 [Daily Driver]`

```text
               ┌─────────────────────────┐
               │   CheckoutCoordinator   │
               └────────────┬────────────┘
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
        [ CartFeature ]          [ PaymentFeature ]
```
Use an orchestrator to coordinate multi-feature flows instead of letting features import each other.

---

### Part 19 — Automated Circular Dependency Detection in CI `🟢 [Daily Driver]`

Enforce zero cycles in CI pipelines using tools like `madge --circular src/` or `eslint-plugin-import`.

---

### Part 20 — 10-Point Enterprise Module Architecture Checklist `🟢 [Daily Driver]`

```text
1. Are circular dependencies checked and blocked in CI via `madge` or `dpdm`?
2. Do all dependencies strictly flow downward (UI -> Feature -> Domain -> Infra)?
3. Are infrastructure utilities free of UI component imports?
4. Are cross-feature interactions coordinated via higher-level Orchestrators?
5. Are feature internals encapsulated behind a minimal public `index.ts` facade?
6. Are deep internal subpath imports forbidden across feature boundaries?
7. Is domain logic kept in its owning feature rather than dumped into `shared/`?
8. Are path aliases (`@/`) configured for clean, stable imports?
9. Are top-level module statements free of immediate function execution?
10. Can individual features be tested in isolation without importing the whole app?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Decoupling Pattern | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Layer Extraction** | Two services depend on shared constants, types, or token storage. | When the two modules are actually part of the same single cohesive function. | Adds a small extra file (`tokenStorage.ts`). | Inlining logic. |
| **Workflow Orchestrator** | Multi-feature business flows (e.g. Checkout coordinating Cart + Payment + Inventory). | Simple 1-step direct function calls. | Adds an orchestrator layer. | Event bus. |
| **Custom Domain Errors** | Infrastructure communicating status (401 Auth, 403 Forbidden) to UI layer. | Trivial internal helper error strings. | Requires typed error classes. | Return status codes. |
| **Event Bus / PubSub** | Completely decoupled cross-cutting notifications (analytics, global toasts). | Direct request-response workflows requiring return values. | Harder to trace statically. | React Context / Orchestrator. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Decoupled Auth & HTTP Architecture in TypeScript
```tsx
import React, { useState, useCallback } from 'react';

// ==========================================
// 1. LOW-LEVEL INFRASTRUCTURE: TOKEN STORAGE
// (Independent: Zero upward dependencies!)
// ==========================================
export class TokenStorageService {
  private static token: string | null = 'INITIAL_JWT_TOKEN_123';

  public static getToken(): string | null { return this.token; }
  public static setToken(newToken: string | null): void { this.token = newToken; }
}

// ==========================================
// 2. INFRASTRUCTURE: HTTP CLIENT & CUSTOM ERROR
// (Depends downward on TokenStorageService; ZERO UI dependencies!)
// ==========================================
export class UnauthorizedError extends Error {
  constructor(message = 'Session expired. Please log in again.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export async function secureApiRequest<T>(url: string): Promise<T> {
  const token = TokenStorageService.getToken();

  // Simulating 401 Unauthorized if token is empty
  if (!token) {
    throw new UnauthorizedError();
  }

  return { status: 200, data: 'Secure Vault Data Payload' } as unknown as T;
}

// ==========================================
// 3. FEATURE WORKFLOW ORCHESTRATOR
// (Coordinates Auth state and UI modal display)
// ==========================================
export function useSecureDataOrchestrator() {
  const [data, setData] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeFetch = useCallback(async () => {
    setError(null);
    try {
      const result = await secureApiRequest<{ data: string }>('/api/protected/resource');
      setData(result.data);
    } catch (err: any) {
      if (err instanceof UnauthorizedError) {
        // 🟢 High-level orchestrator decides to open UI login modal!
        setIsLoginModalOpen(true);
      } else {
        setError(err.message || 'Request failed');
      }
    }
  }, []);

  const handleLoginSuccess = useCallback((newToken: string) => {
    TokenStorageService.setToken(newToken);
    setIsLoginModalOpen(false);
    executeFetch(); // Retry fetch after login!
  }, [executeFetch]);

  return { data, isLoginModalOpen, error, executeFetch, handleLoginSuccess };
}

// ==========================================
// 4. REACT UI CONSUMER
// ==========================================
export function EnterpriseDecoupledAuthDashboard() {
  const { data, isLoginModalOpen, error, executeFetch, handleLoginSuccess } =
    useSecureDataOrchestrator();

  return (
    <div className="decoupled-dashboard-card">
      <h3>Decoupled Architecture: Auth, HTTP & UI</h3>
      <p>Demonstrates strict downward dependency direction: HTTP Client throws typed errors without importing UI modals.</p>

      <div className="button-group">
        <button onClick={executeFetch} className="primary-btn">
          Fetch Secure Data
        </button>
        <button onClick={() => TokenStorageService.setToken(null)} className="danger-btn">
          Invalidate Session Token (Simulate 401)
        </button>
      </div>

      {data && <div className="success-banner">✅ Data Received: {data}</div>}
      {error && <div className="error-banner">⚠️ Error: {error}</div>}

      {isLoginModalOpen && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <h4>🔐 Authentication Required</h4>
            <p>Your session has expired. Click below to re-authenticate.</p>
            <button
              onClick={() => handleLoginSuccess('NEW_REFRESHED_JWT_TOKEN_999')}
              className="primary-btn"
            >
              Log In & Retry Request
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🧠 Part 03 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: Temporal Dead Zone in Circular Imports
```js
// moduleA.mjs
import { b } from "./moduleB.mjs";
export const a = 1;
export const aPlusB = a + b; // 💥 Evaluates at load time!

// moduleB.mjs
import { a } from "./moduleA.mjs";
export const b = a + 10;
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
ReferenceError: Cannot access 'a' before initialization
```
**Why:** When `moduleB` tries to evaluate `export const b = a + 10;`, `a` in `moduleA` is still in the Temporal Dead Zone because `moduleA` is suspended awaiting `moduleB`'s evaluation.
</details>

---

### Prediction Challenge 2: Deferred Function Execution in Cycles
```js
// fnA.mjs
import { getB } from "./fnB.mjs";
export function getA() { return "Result-A"; }
export function execute() { return getB(); }

// fnB.mjs
import { getA } from "./fnA.mjs";
export function getB() { return `${getA()} + Result-B`; }

// test.mjs
import { execute } from "./fnA.mjs";
console.log("Output:", execute());
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Output: Result-A + Result-B
```
**Why:** Because function bodies are evaluated lazily at runtime (after all modules in the graph have completed top-level evaluation and initialization), no TDZ errors occur.
</details>

---

### Prediction Challenge 3: Decoupling via Layer Extraction
```js
// constants.mjs
export const TAX_RATE = 0.18;

// taxService.mjs
import { TAX_RATE } from "./constants.mjs";
export function computeTax(val) { return val * TAX_RATE; }

// invoiceService.mjs
import { TAX_RATE } from "./constants.mjs";
export function getInvoiceHeader() { return `Standard Rate: ${TAX_RATE * 100}%`; }
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Graph Analysis:**  
```text
taxService ──► constants (No cycle!)
invoiceService ──► constants (No cycle!)
```
**Why:** Extracting the shared leaf constant into `constants.mjs` transforms what would have been a cycle into a clean Directed Acyclic Graph (DAG).
</details>

---

### Prediction Challenge 4: Workflow Orchestrator Decoupling
```js
class OrderCoordinator {
  constructor(cart, payment) {
    this.cart = cart;
    this.payment = payment;
  }
  checkout() {
    const total = this.cart.getTotal();
    return this.payment.charge(total);
  }
}
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Architectural Benefit:**  
`Cart` and `Payment` have zero direct knowledge of each other. The `OrderCoordinator` owns the multi-feature interaction, preventing cross-feature coupling.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is a circular dependency in JavaScript modules?  
<details>
<summary><strong>Answer</strong></summary>
A circular dependency occurs when two or more modules directly or indirectly depend on each other (e.g. Module A imports Module B, and Module B imports Module A).
</details>

**Q2:** Why do path aliases (like `@/components/Button`) improve project maintainability?  
<details>
<summary><strong>Answer</strong></summary>
Path aliases map arbitrary prefix symbols (`@/`) to absolute project root paths (`src/`). This prevents brittle relative paths (`../../../../components/Button`), making refactoring and moving files between directories fast and error-free.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** Why does accessing an exported `const` in a circular module during top-level evaluation throw a `ReferenceError`?  
<details>
<summary><strong>Answer</strong></summary>
When Module A imports Module B in a cycle, Module A's evaluation pauses to evaluate Module B. If Module B immediately attempts to read an exported `const` from Module A, that variable is still in the Temporal Dead Zone (TDZ) because Module A has not yet executed its declaration statement.
</details>

**Q4:** What is "Dependency Direction" and why should low-level modules never import high-level UI modules?  
<details>
<summary><strong>Answer</strong></summary>
Dependency direction dictates that dependencies must strictly flow downward: `UI` $\to$ `Feature` $\to$ `Domain` $\to$ `Infrastructure`. If a low-level module (like `httpClient.ts`) imports a high-level UI module (like `<LoginModal />`), the infrastructure becomes coupled to the DOM, breaking reusability in non-browser environments (Node.js SSR, Web Workers) and creating circular dependency traps.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** How do you resolve a complex circular dependency between `authService`, `authStore`, and `authApi` in a large TypeScript application?  
<details>
<summary><strong>Answer</strong></summary>
1. **Identify Misplaced Responsibilities:** The cycle typically occurs because `authApi` needs a token held by `authStore`, which calls `authService`.  
2. **Extract a Low-Level Leaf Module:** Create an independent `tokenStorage.ts` module with zero upward dependencies.  
3. **Invert Dependency Flow:** Both `authStore` and `authApi` import downward from `tokenStorage.ts`.  
4. **Use Typed Custom Errors:** Have `authApi` throw `UnauthorizedError` instead of directly triggering UI store changes.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How do you design and enforce an automated module boundary architecture across an enterprise monorepo with 50+ feature teams?  
<details>
<summary><strong>Answer</strong></summary>
1. **Feature-Sliced Hierarchy:** Enforce strict architectural tiers: `app` $\to$ `pages` $\to$ `widgets` $\to$ `features` $\to$ `entities` $\to$ `shared`.  
2. **Public API Facades:** Require every feature to expose a single `index.ts` file; ban deep internal imports (`features/auth/internal/*`) via ESLint rules (`eslint-plugin-import` or `eslint-plugin-boundaries`).  
3. **Automated CI Cycle Gates:** Run `madge --circular --extensions ts,tsx src/` in CI builds, failing the pipeline if any cyclic dependency is introduced.  
4. **Workflow Orchestrators:** Provide architectural templates where cross-feature operations are coordinated by dedicated orchestrator services rather than peer-to-peer feature imports.
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Circular Dependency Resolver & Workflow Orchestrator

```js
// See runnable implementation in examples/03-circular-dependencies-orchestrator.mjs
```

---

## Key Takeaways
1. **Cycles Cause TDZ Crashes:** Avoid top-level evaluation access to imported variables.
2. **Strict Downward Dependency Direction:** Infrastructure never imports UI components.
3. **Decouple via Layer Extraction:** Extract shared state into low-level leaf modules.
4. **Use Workflow Orchestrators:** Keep feature boundaries independent and decoupled.
5. **Enforce Zero Cycles in CI:** Use `madge` and ESLint boundary rules to prevent architectural rot.

---

[⬅️ Part 02: Dynamic `import()`, Code Splitting & Tree Shaking](./02-module-loading-dynamic-imports-tree-shaking.md) | [📚 KPI 20/14 Index](./README.md) | [KPI 10/15 — Error Handling & Resilient JavaScript ➡️](../10-Error-Handling-Debugging/README.md)
