# KPI 09 — Part 06: Currying, Partial Application & Function Specialization

[⬅️ Part 05: Function Composition & Pipelines](./05-function-composition-pipelines.md) | [📚 KPI 09 Index](./README.md) | [Part 07: Advanced Functional Concepts (Memoization, Monads & Error Handling) ➡️](./07-advanced-functional-concepts-memoization-error-handling.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Functional Mechanism | Conceptual Structure | Invocation Syntax | Senior Production Rule |
|---|---|---|---|
| **Currying** | Transforms $f(a, b, c)$ into $f(a)(b)(c)$ (series of 1-arg functions). | `add(1)(2)(3)` | 🟢 **Core Pattern**: Use to create unary functions for pipeline composition. |
| **Partial Application** | Pre-fills some arguments, returning a function accepting the rest. | `addFive(b, c)` | 🟢 Use when configuration is known early and runtime data arrives later. |
| **Data-Last Convention** | Parameters ordered as `config => config => data`. | `filter(pred)(data)` | 🟢 **Standard**: Enables seamless composition with `pipe()` without wrapper lambdas. |
| **Function Specialization** | Deriving domain-specific verbs from generic operations. | `const isAdmin = hasRole("admin")` | 🟢 Greatly enhances readability and domain expressiveness in business logic. |
| **Generic `curry()`** | Automatically curries any function based on `fn.length`. | `curry(fn)` | 🟡 Useful in functional SDKs; avoid overusing when manual arrows are clearer. |
| **Over-Currying** | Anti-pattern: Currying functions whose arguments always arrive together. | `createUser(first)(last)` | 🔴 **Avoid**: Creates pointless syntactic ceremony and call stack depth. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotcha: Data-First vs Data-Last Argument Ordering
> **Question:** *"Why does the standard Lodash/Ramda `filter` argument order `(predicate, data)` enable point-free pipeline composition, whereas native `Array.prototype.filter` cannot be directly piped?"*  
> ```js
> // ❌ DATA-FIRST (Hard to compose without wrapper glue):
> const dataFirstFilter = (data, predicate) => data.filter(predicate);
> 
> // ✅ DATA-LAST (Perfect for pipe):
> const dataLastFilter = (predicate) => (data) => data.filter(predicate);
> 
> const getAdmins = pipe(
>   dataLastFilter(user => user.role === 'admin'),
>   sortByJoinDate
> );
> ```
> **Deep Architectural Answer:**  
> 1. In a unary composition pipeline (`pipe`), the incoming data flows through the pipeline stages automatically.  
> 2. With **Data-First** design (`(data, pred)`), the function requires `data` first, making it impossible to pre-configure `predicate` without writing an inline wrapper `(data) => dataFirstFilter(data, pred)`.  
> 3. With **Data-Last** design (`(predicate) => (data)`), passing the `predicate` during pipeline setup immediately yields a configured unary function `(data) => result` ready to receive the pipeline's stream.  
> 4. **The Senior Standard:** Design functional utilities with **Configuration First, Data Last**!

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / TypeScript Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | React curried event handlers (`onClick={handleSelect(id)}`), Redux action creators, Permission checkers | Essential for staged configuration, parameterized event callbacks, and clean domain selectors. |
| 🟡 **Moderate** | Used in ~25% of code | Dynamic `curry(fn)` utility engines, parameterized form validators, custom middleware | Critical for reusable functional utility libraries, telemetry decorators, and SDK design. |
| 🔵 **Foundational / Engine** | Runtime internals | Function reflection `fn.length`, closure memory capture overhead, TurboFan JIT call inlining | Essential for compiler optimization understanding, memory profiling, and Staff/Principal evaluations. |

---

## Core Concepts (20 Subtopics)

### Part 1 — Formal Definition of Currying `🟢 [Daily Driver]`

Currying is the mathematical transformation of a function with multiple arity $f: (A \times B \times C) \to D$ into a sequence of unary functions $f: A \to (B \to (C \to D))$.

---

### Part 2 — Progressive Closure Frame Capturing `🟢 [Daily Driver]`

Each intermediate function call creates a new Lexical Environment Record on the Heap, capturing its specific argument in closure until the final argument triggers evaluation.

---

### Part 3 — Function Specialization: Deriving Domain Verbs `🟢 [Daily Driver]`

```js
const hasRole = role => user => user.roles.includes(role);
const isSuperAdmin = hasRole('SUPER_ADMIN'); // Specialized domain verb
```

---

### Part 4 — Currying vs. Partial Application `🟢 [Daily Driver]`

- **Currying:** Structural transformation into single-argument chain ($f(a)(b)(c)$).
- **Partial Application:** Fixing a subset of arguments, producing a function with reduced arity ($f(a, b, c) \to g(b, c)$).

---

### Part 5 — Partial Application via `bind()` vs. Arrow Closures `🟢 [Daily Driver]`

- `fn.bind(null, arg1)`: Allocates bound function object using native internal slots.
- `arg2 => fn(arg1, arg2)`: Modern arrow closure with superior readability, debugging names, and inlineability.

---

### Part 6 — Multi-Parameter Partial Application `🟢 [Daily Driver]`

```js
const sendEmail = (from, to, subject, body) => { /* ... */ };
const sendSystemAlert = (subject, body) => sendEmail('system@corp.com', 'ops@corp.com', subject, body);
```

---

### Part 7 — Why Currying Unlocks Seamless `pipe()` Composition `🟢 [Daily Driver]`

Calling the first stage of a curried function pre-fills its configuration, producing the exact unary `(data) => result` signature required by `pipe()`.

---

### Part 8 — Configurable Predicates and Sorters `🟢 [Daily Driver]`

```js
const sortBy = selector => items => items.toSorted((a, b) => selector(a) - selector(b));
const sortByPrice = sortBy(p => p.price);
```

---

### Part 9 — The Data-Last Convention `🟢 [Daily Driver]`

Always place static configuration options in the initial argument slots and dynamic runtime data in the final argument slot (`config => options => data`).

---

### Part 10 — Data-First vs. Data-Last Decision Matrix `🟢 [Daily Driver]`

- **Use Data-First (`fn(data, config)`):** When the function is intended for direct, one-off standalone execution.
- **Use Data-Last (`fn(config)(data)`):** When the function is designed for reusable pipelines, selectors, and composition.

---

### Part 11 — Dynamic Generic `curry(fn)` Utility `🟢 [Daily Driver]`

```js
function curry(fn) {
  return function curried(...args) {
    return args.length >= fn.length
      ? fn.apply(this, args)
      : (...nextArgs) => curried.apply(this, args.concat(nextArgs));
  };
}
```

---

### Part 12 — `fn.length` Reflection & Default/Rest Parameter Gotchas `🔵 [Foundational / Engine]`

`Function.prototype.length` reports only declared parameters **before** the first parameter with a default value, and ignores `...rest` parameters entirely (`((a, b = 1, c) => {}).length === 1`).

---

### Part 13 — Curried Event Handlers in React `🟢 [Daily Driver]`

```jsx
const handleRowSelect = (rowId: string) => (e: React.MouseEvent) => {
  setSelectedId(rowId);
};
<tr onClick={handleRowSelect(row.id)}>...</tr>
```

---

### Part 14 — Multi-Layer Configuration Architecture `🟢 [Daily Driver]`

Structure enterprise services in progressive stages:  
`createServiceClient(baseUrl)(authToken)(endpoint)(payload)`

---

### Part 15 — Permission & RBAC Rule Engines `🟢 [Daily Driver]`

```js
const canAccessResource = requiredPerm => user => user.permissions.includes(requiredPerm);
const canDeleteAuditLog = canAccessResource('AUDIT_DELETE');
```

---

### Part 16 — Feature Flag Evaluation via Curried Specifiers `🟢 [Daily Driver]`

```js
const isFeatureEnabled = featureKey => user => user.activeFlags.has(featureKey);
const hasAiSummarizer = isFeatureEnabled('AI_SUMMARY_V2');
```

---

### Part 17 — State Reducer Action Handlers with Curried Immutability `🟢 [Daily Driver]`

```js
const updateField = fieldName => value => state => ({
  ...state,
  [fieldName]: value
});
```

---

### Part 18 — The Over-Currying Anti-Pattern `🔴 [Production-Critical]`

Never curry basic utilities whose parameters are always available at the same time (`const add = a => b => a + b`). It degrades readability and incurs unnecessary closure allocations.

---

### Part 19 — TypeScript Strongly-Typed Generic Currying Types `🔵 [Foundational / Engine]`

```ts
type Curried2<A, B, R> = (a: A) => (b: B) => R;
type Curried3<A, B, C, R> = (a: A) => (b: B) => (c: C) => R;
```

---

### Part 20 — 10-Point Senior Currying Architecture Checklist `🟢 [Daily Driver]`

```text
1. Are curried functions designed with the Data-Last convention (configuration first, data last)?
2. Is currying used to produce unary functions specifically for pipe() or compose() integration?
3. Are React curried event handlers used to capture list identifiers cleanly during render?
4. Is fn.length reflection audited to ensure default or rest parameters do not break generic curry()?
5. Are domain verbs (canEdit, isSuperAdmin) extracted via specialized curried predicates?
6. Is over-currying avoided on trivial multi-argument functions where args are always present together?
7. Are closure variables in curried stages treated as immutable configuration values?
8. Are arrow function closures preferred over Function.prototype.bind() for clarity and speed?
9. Is TypeScript type safety preserved across all intermediate curried application steps?
10. Can all specialized functions be unit-tested independently of their configuration factory?
```

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise RBAC Permission & Authorization Engine
```tsx
import React, { createContext, useContext, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  roles: string[];
  permissions: string[];
}

/**
 * 🟢 CURRIED PERMISSION SPECIFIERS (Configuration First, Data Last)
 */
export const hasPermission = (permission: string) => (user: User | null): boolean =>
  !!user && user.permissions.includes(permission);

export const hasAnyRole = (...requiredRoles: string[]) => (user: User | null): boolean =>
  !!user && requiredRoles.some((role) => user.roles.includes(role));

export const canPerformAction = (permission: string, fallbackRole: string) => (user: User | null): boolean =>
  hasPermission(permission)(user) || hasAnyRole(fallbackRole)(user);

// Context
const AuthContext = createContext<{ currentUser: User | null }>({ currentUser: null });

/**
 * 🟢 HIGHER-ORDER PERMISSION GUARD COMPONENT
 */
export function ProtectedSection({
  guard,
  children,
  fallback = null
}: {
  guard: (user: User | null) => boolean;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { currentUser } = useContext(AuthContext);
  const isAuthorized = guard(currentUser);

  if (!isAuthorized) return <>{fallback}</>;
  return <>{children}</>;
}

// Specialized Guard Predicates
const canManageBilling = canPerformAction('BILLING_WRITE', 'SUPER_ADMIN');
const canViewAnalytics = hasPermission('ANALYTICS_READ');

export function AdminControlPanel() {
  const mockUser: User = {
    id: 'U_1',
    name: 'Prasenjeet',
    roles: ['ADMIN'],
    permissions: ['ANALYTICS_READ', 'USER_READ']
  };

  return (
    <AuthContext.Provider value={{ currentUser: mockUser }}>
      <div className="panel-container">
        <h3>Enterprise RBAC Management Panel</h3>
        <p>Logged in as: <strong>{mockUser.name}</strong></p>

        <ProtectedSection
          guard={canViewAnalytics}
          fallback={<p className="denied-text">🔒 Analytics Access Restricted</p>}
        >
          <div className="feature-box">📊 Real-Time Telemetry & Revenue Analytics</div>
        </ProtectedSection>

        <ProtectedSection
          guard={canManageBilling}
          fallback={<p className="denied-text">🔒 Billing Actions Require Higher Authority</p>}
        >
          <button className="billing-btn">Modify Corporate Invoices</button>
        </ProtectedSection>
      </div>
    </AuthContext.Provider>
  );
}
```

---

## 🧠 Part 06 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: Multi-Stage Curried Calculation
```js
const volume = l => w => h => l * w * h;

const baseArea = volume(10)(5);
const boxA = baseArea(2);
const boxB = baseArea(4);

console.log("Box A Volume:", boxA);
console.log("Box B Volume:", boxB);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Box A Volume: 100
Box B Volume: 200
```
**Why:** `volume(10)(5)` pre-calculates length and width in closure ($10 \times 5 = 50$). Calling it with `2` yields $50 \times 2 = 100$, and with `4` yields $50 \times 4 = 200$.
</details>

---

### Prediction Challenge 2: Dynamic `curry()` Arity Evaluation
```js
function curry(fn) {
  return function curried(...args) {
    return args.length >= fn.length
      ? fn.apply(this, args)
      : (...next) => curried.apply(this, args.concat(next));
  };
}

const sum4 = (a, b, c, d) => a + b + c + d;
const curriedSum = curry(sum4);

console.log(curriedSum(1)(2)(3)(4));
console.log(curriedSum(1, 2)(3, 4));
console.log(curriedSum(1, 2, 3)(4));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
10
10
10
```
**Why:** The generic `curry` utility checks whether accumulated arguments satisfy `fn.length` ($4$). It supports any combination of partial calls until all 4 arguments are supplied.
</details>

---

### Prediction Challenge 3: `fn.length` Default Parameter Gotcha
```js
const fnA = (a, b, c) => a + b + c;
const fnB = (a, b = 10, c) => a + b + c;
const fnC = (a, ...rest) => a + rest.length;

console.log(fnA.length);
console.log(fnB.length);
console.log(fnC.length);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
3
1
1
```
**Why:** `Function.prototype.length` stops counting parameters as soon as it encounters a parameter with a default value (`fnB` stops at `a`, returning `1`) and ignores rest parameters (`fnC` only counts `a`, returning `1`).
</details>

---

### Prediction Challenge 4: Data-Last Pipeline Composition
```js
const filter = pred => arr => arr.filter(pred);
const map = fn => arr => arr.map(fn);
const pipe = (...fns) => val => fns.reduce((res, f) => f(res), val);

const getEvenSquares = pipe(
  filter(n => n % 2 === 0),
  map(n => n * n)
);

console.log(getEvenSquares([1, 2, 3, 4, 5, 6]));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
[4, 16, 36]
```
**Why:** Currying `filter` and `map` with the Data-Last signature produces unary functions that compose seamlessly in `pipe()`.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is the technical difference between Currying and Partial Application?  
<details>
<summary><strong>Answer</strong></summary>
- **Currying:** Transforms a function of $N$ arguments into a chain of $N$ nested functions, each accepting strictly one argument ($f(a)(b)(c)$).  
- **Partial Application:** Fixes a subset of a function's arguments upfront and returns a new function that accepts the remaining arguments all at once ($f(a, b, c) \to g(b, c)$).
</details>

**Q2:** How do closures enable currying in JavaScript?  
<details>
<summary><strong>Answer</strong></summary>
When an outer function receives an argument and returns an inner function, the inner function maintains a persistent lexical reference to the outer function's environment record on the Heap. This allows the inner function to retain access to all previously supplied parameters across multiple successive function calls.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** What is the "Data-Last" API design convention, and why is it essential for functional pipelines?  
<details>
<summary><strong>Answer</strong></summary>
The Data-Last convention places static configuration parameters in the first argument slots and the dynamic runtime data structure in the final argument slot (`const filter = (predicate) => (data) => ...`). This allows developers to pre-configure transformations upfront, yielding unary functions that slot directly into `pipe()` without needing anonymous inline wrapper lambdas.
</details>

**Q4:** Why is `Function.prototype.length` unreliable when building generic auto-currying utilities?  
<details>
<summary><strong>Answer</strong></summary>
`fn.length` only counts parameters up to the first parameter with a default value and excludes `...rest` parameters completely. For example, `(a, b = 2, c) => {}` has a `.length` of `1`, not `3`. An auto-currying utility relying naively on `fn.length` will execute prematurely after receiving only `1` argument instead of waiting for `c`.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** How do curried event handlers in React list items compare with inline arrow functions regarding garbage collection and memory allocation?  
<details>
<summary><strong>Answer</strong></summary>
- **Inline Arrow (`onClick={() => handleDelete(item.id)}`):** Re-allocates a closure instance on every render pass for every item in the list.  
- **Curried Handler (`onClick={handleDelete(item.id)}` where `handleDelete = (id) => () => ...`):** Also executes during render to return a closure instance.  
- **Architectural Reality:** Both allocate a closure on every render pass. The curried pattern is syntactically cleaner and separates configuration from execution, but for performance-critical lists with thousands of items, **Event Delegation** (a single click listener on the parent container reading `data-id`) is superior to both approaches as it allocates zero closures per row.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How does V8's TurboFan compiler optimize curried function chains, and what are the performance implications of deep currying in hot loops?  
<details>
<summary><strong>Answer</strong></summary>
1. **Escape Analysis & Inlining:** If curried functions are small and invoked in local monomorphic call sites, TurboFan inlines the chain and eliminates intermediate closure object allocations through escape analysis.  
2. **Deoptimization Hazards in Hot Loops:** If curried functions are invoked across polymorphic boundaries or retained long-term, V8 must allocate intermediate closure context objects on the Heap. In critical hot loops ($>10^6$ iterations), deep currying adds call overhead and memory pressure compared to flat multi-argument functions. Senior architects reserve deep currying for configuration and pipeline setup boundaries, not inner tight loops.
</details>

---

## 🛠️ Senior Architecture Challenge: Enterprise RBAC Authorization Engine

```js
// See runnable implementation in examples/06-currying-partial-application.js
```

---

## Key Takeaways
1. **Currying Staged Execution:** Transform $N$-ary functions into unary sequences.
2. **Data-Last is King for Pipelines:** Pass configuration first, data last.
3. **Specialize for Domain Clarity:** Turn generic operations into expressive domain verbs.
4. **Avoid Over-Currying:** Keep flat signatures when arguments always arrive together.
5. **Beware `fn.length` Quirks:** Default and rest parameters alter reported arity.

---

[⬅️ Part 05: Function Composition & Pipelines](./05-function-composition-pipelines.md) | [📚 KPI 09 Index](./README.md) | [Part 07: Advanced Functional Concepts (Memoization, Monads & Error Handling) ➡️](./07-advanced-functional-concepts-memoization-error-handling.md)
