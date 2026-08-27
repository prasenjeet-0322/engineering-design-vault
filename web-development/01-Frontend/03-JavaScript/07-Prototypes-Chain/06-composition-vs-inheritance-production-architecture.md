# KPI 07 — Part 06: Composition vs. Inheritance, Production Architecture, TypeScript Boundaries & React/Next.js Patterns

[⬅️ Part 05: V8 Hidden Classes & Inline Caches](./05-v8-hidden-classes-inline-caches-deopt.md) | [📚 KPI 07 Index](./README.md) | [KPI 08: Closures & Lexical Environments ➡️](../08-Closures-Lexical-Environments/README.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Architectural Paradigm | Core Mechanism | Best Use Case | Primary Production Risk | Senior Default |
|---|---|---|---|---|
| **Inheritance (`extends`)** | Subtype inherits prototype chain of parent class. | Stable "IS-A" domain models, Custom Error hierarchies (`extends Error`). | Fragile base class problem, tight coupling, combinatorial hierarchy explosion. | 🟡 Use sparingly (max 2-3 levels). |
| **Object Composition** | Assemble capabilities via object spread, mixins, or factory decorators. | Combining independent, orthogonal behaviors (`withLogging(withCache(service))`). | Property name collisions, shallow copy overhead. | 🟢 **Senior Standard** for services. |
| **Dependency Injection** | Pass dependencies explicitly via constructor or factory arguments. | Testable domain services, API clients, repository layers. | Slight parameter boilerplate. | 🟢 **Universal Standard** for enterprise backends/services. |
| **React Custom Hooks** | Stateful behavioral composition via Fiber hook primitives. | Reusable UI logic, subscriptions, async data fetching. | Hook rules (top-level execution only). | 🟢 **Universal Standard** for React UI logic. |
| **TypeScript Structural Types** | Compile-time shape matching (duck typing). | Type boundaries, API responses, component props. | Does not enforce runtime prototype identity. | 🟢 **Universal Standard** for typing. |
| **Plain DTOs (Data Objects)** | Plain JSON-serializable objects (`{ id, name }`). | React / Next.js Server-to-Client boundaries, Redux/Zustand state. | Lacks attached prototype methods. | 🟢 **Universal Standard** for state & wire data. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotcha: Why Does `class User implements Serializable` NOT Create Prototype Inheritance?
> **Question:** *"Why does `Object.getPrototypeOf(new User())` point to `Object.prototype` (or `User.prototype`), and why is `Serializable` completely missing at runtime?"*  
> ```ts
> interface Serializable {
>   serialize(): string;
> }
> 
> class User implements Serializable {
>   serialize() { return "{}"; }
> }
> ```
> **Deep Architectural Answer:**  
> 1. In TypeScript, `interface` is a **pure compile-time structural type construct**.  
> 2. The `implements` keyword instructs the TypeScript compiler to verify that `User` satisfies the shape of `Serializable` during type checking.  
> 3. During compilation to JavaScript, all interfaces and `implements` clauses are **completely erased (zero runtime emitted code)**!  
> 4. At runtime, `Serializable` does not exist in memory. `User` inherits directly from `Function.prototype`, and instances inherit from `User.prototype -> Object.prototype -> null`.  
> 5. **The Senior Standard:** TypeScript types check compile-time structure; JavaScript prototypes govern runtime delegation!

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / TypeScript Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Component composition, Custom Hooks, Dependency Injection, Plain DTOs | Essential for architecting maintainable React/Next.js codebases, eliminating fragile inheritance hierarchies, and designing clean APIs. |
| 🟡 **Moderate** | Used in ~25% of code | Custom Error hierarchies (`extends Error`), AST visitor patterns | Critical for error handling boundaries, compiler/parser construction, and library extension points. |
| 🔵 **Foundational / Engine** | Runtime internals | Memory footprint of closures vs prototype methods, Liskov Substitution Principle | Essential for large-scale systems design, performance profiling, and Staff/Principal technical evaluations. |

---

## Core Concepts (20 Subtopics)

### Part 1 — The Fundamental Axiom: Composition Over Inheritance `🟢 [Daily Driver]`

Inheritance asks *"What is this object?"* (`Admin IS-A User`). Composition asks *"What can this object do?"* (`Admin has login and deleteUser capabilities`).

---

### Part 2 — The Fragile Base Class Problem & Implicit Coupling `🟢 [Daily Driver]`

Modifying a base class's internal method or state can unintentionally break behavior across dozens of subclass layers.

---

### Part 3 — The Liskov Substitution Principle (LSP) in Practice `🔵 [Foundational / Engine]`

Subtypes must be behaviorally substitutable for their base types without altering program correctness.

---

### Part 4 — The Combinatorial Inheritance Explosion `🟢 [Daily Driver]`

Attempting to model multiple orthogonal features via inheritance leads to classes like `TrialAdminWithTelemetryAndAuditLogger`. Composition resolves this with independent decorators.

---

### Part 5 — Factory Functions with Closures `🟢 [Daily Driver]`

```ts
function createUserService(apiClient: ApiClient) {
  return {
    getUser: (id: string) => apiClient.get(`/users/${id}`)
  };
}
```
Encapsulates dependencies without `this` binding issues or prototype hierarchies.

---

### Part 6 — Dependency Injection (DI) Patterns `🟢 [Daily Driver]`

Supplying dependencies explicitly (e.g. passing `Logger` and `Repository` into factory functions) enables easy unit testing and mock injection.

---

### Part 7 — React Component Composition Patterns `🟢 [Daily Driver]`

React UIs are built using slot composition (`<Card><UserProfile /></Card>`), not inheritance (`class UserProfileCard extends Card`).

---

### Part 8 — Custom Hooks as Behavioral Composition `🟢 [Daily Driver]`

Custom Hooks (`useAuth()`, `usePermissions()`) compose independent stateful capabilities directly into React function components.

---

### Part 9 — TypeScript Structural Typing vs. Nominal Prototype Inheritance `🟢 [Daily Driver]`

TypeScript interfaces check object shapes structurally. Any plain object matching `interface User` satisfies the type without needing `extends`.

---

### Part 10 — Why `implements` Leaves Zero Runtime Footprint `🟢 [Daily Driver]`

`implements InterfaceName` is completely stripped during compilation. It creates no prototype link at runtime.

---

### Part 11 — Abstract Classes vs. TypeScript Interfaces `🟡 [Moderate]`

- **Interface:** 100% compile-time contract. Zero runtime byte cost.
- **Abstract Class:** Emits runtime constructor with shared methods and prototype delegation.

---

### Part 12 — Next.js Server Components & Serialization Boundaries `🟢 [Daily Driver]`

Data crossing Server Component to Client Component boundaries must be plain serializable JSON/DTOs. Prototype methods are stripped during RSC transmission.

---

### Part 13 — Memory Footprint: Prototype Methods vs. Closure Factories `🔵 [Foundational / Engine]`

- **Prototype Methods:** 1 shared function reference for $N$ instances.
- **Closure Factories:** $N$ function references on the Heap. Use prototypes when creating $>100,000$ instances.

---

### Part 14 — Object Spread Composition & Property Collisions `🟢 [Daily Driver]`

```ts
const service = { ...withLogging(base), ...withAuth(base) };
```
Beware of conflicting property names; outer decorators overwrite inner properties.

---

### Part 15 — When Inheritance IS Justified (The 5-Rule Test) `🟢 [Daily Driver]`

1. Genuine "IS-A" relationship
2. Strict Liskov Substitutability
3. Stable base contract
4. Deep shared behavior
5. Hierarchy depth $\le 3$ (e.g. `extends Error`)

---

### Part 16 — Custom Error Hierarchies with `extends Error` `🟢 [Daily Driver]`

```ts
export class AppError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = this.constructor.name;
  }
}
```

---

### Part 17 — State Management Immutability (Redux / Zustand) `🟢 [Daily Driver]`

State stores require immutable object updates (`{ ...state, key: val }`). Using class instances with prototype mutations causes silent render bugs.

---

### Part 18 — Mixins & Functional Decorators `🟡 [Moderate]`

Composing behaviors using higher-order functions that take a base class/object and return an enhanced object.

---

### Part 19 — The "God Base Class" Anti-Pattern `🔴 [Production-Critical]`

A bloated `BaseService` that manages Auth, Caching, Logging, Telemetry, and DB queries. Decompose into modular, injected dependencies.

---

### Part 20 — 10-Point Senior Architectural Decision Checklist `🟢 [Daily Driver]`

```text
1. Is UI behavior composed via React Component nesting and Custom Hooks?
2. Are services receiving dependencies explicitly via Dependency Injection?
3. Are data models crossing network boundaries defined as plain TypeScript DTOs?
4. Is inheritance restricted to shallow hierarchies (<= 3 levels, e.g. extends Error)?
5. Are state management slices updating immutably without class instance mutations?
6. Are TypeScript interfaces used for compile-time contracts instead of empty base classes?
7. Is prototype method sharing used when memory profiling indicates closure churn?
8. Are property collision risks managed when spreading composite objects?
9. Does every subclass strictly satisfy the Liskov Substitution Principle?
10. Is composition the default architectural choice for all new feature design?
```

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Modular Service Architecture with Dependency Injection & DTO Boundaries
```tsx
import React, { useState, useEffect, useMemo } from 'react';

export interface UserDTO {
  id: string;
  name: string;
  role: string;
}

export interface IApiClient {
  get<T>(url: string): Promise<T>;
}

export interface ILogger {
  log(message: string): void;
}

/**
 * Clean Service with Explicit Dependency Injection (Composition)
 * Zero inheritance coupling; 100% unit-testable
 */
export class UserService {
  constructor(
    private readonly apiClient: IApiClient,
    private readonly logger: ILogger
  ) {}

  public async fetchUser(id: string): Promise<UserDTO> {
    this.logger.log(`[UserService] Fetching user: ${id}`);
    return this.apiClient.get<UserDTO>(`/api/users/${id}`);
  }
}

// React Custom Hook composing the service
export function useUserService(client: IApiClient, logger: ILogger) {
  return useMemo(() => new UserService(client, logger), [client, logger]);
}

export function UserDashboard({ userId }: { userId: string }) {
  const [user, setUser] = useState<UserDTO | null>(null);

  // Injected dependencies
  const apiClient = useMemo<IApiClient>(() => ({
    get: async (url) => ({ id: userId, name: 'Sunny', role: 'Staff Architect' })
  }), [userId]);

  const logger = useMemo<ILogger>(() => ({
    log: (msg) => console.log(`[Telemetry]: ${msg}`)
  }), []);

  const userService = useUserService(apiClient, logger);

  useEffect(() => {
    userService.fetchUser(userId).then(setUser);
  }, [userService, userId]);

  return (
    <div className="user-dashboard-card">
      <h4>Enterprise User Dashboard</h4>
      {user ? (
        <p>Active User: <strong>{user.name}</strong> ({user.role})</p>
      ) : (
        <p>Loading user state...</p>
      )}
    </div>
  );
}
```

---

## 🧠 Part 06 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: Property Collision in Object Composition
```ts
const withLogging = (target: any) => ({
  ...target,
  execute() { return "LOGGED_ACTION"; }
});

const withMetrics = (target: any) => ({
  ...target,
  execute() { return "METRIC_ACTION"; }
});

const compositeService = withMetrics(withLogging({}));
console.log(compositeService.execute());
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
METRIC_ACTION
```
**Why:** In object spread composition, later decorators overwrite properties defined by earlier decorators. `withMetrics` executes last, shadowing `withLogging`'s `execute` method.
</details>

---

### Prediction Challenge 2: TypeScript `implements` Runtime Prototype Lineage
```ts
interface Identifiable {
  id: string;
}

class Product implements Identifiable {
  constructor(public id: string) {}
}

const p = new Product("prod_01");
console.log(Object.getPrototypeOf(p) === Product.prototype);
console.log(Object.getPrototypeOf(Product.prototype) === Object.prototype);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
true
true
```
**Why:** `Identifiable` is erased at compile time. `p` inherits from `Product.prototype`, which inherits directly from `Object.prototype`.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is the core difference between Composition and Inheritance in JavaScript?  
<details>
<summary><strong>Answer</strong></summary>
- **Inheritance (`extends`):** An object is a subtype of another class, inheriting its entire prototype chain and internal implementation.  
- **Composition:** An object is constructed by combining smaller, independent functions, modules, or capability objects. Composition emphasizes *"has-a"* or *"can-do"* relationships over *"is-a"* relationships.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q2:** Why does React favor Component Composition and Custom Hooks over Class Inheritance?  
<details>
<summary><strong>Answer</strong></summary>
Class inheritance in UI components creates tight coupling, fragile base classes, and combinatorial explosion when combining features (e.g. `AuthenticatedPaginatedFilterableTable`). Component composition (slot pattern via `children`) and Custom Hooks allow combining stateful logic and UI flexibly without inheritance hierarchies.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q3:** How do TypeScript Interfaces differ from ES6 Classes in terms of runtime memory and prototype chains?  
<details>
<summary><strong>Answer</strong></summary>
- **TypeScript Interfaces:** 100% compile-time artifacts that are completely erased during JavaScript emission. They consume zero runtime memory and create no prototype links.  
- **ES6 Classes:** Runtime constructs that emit constructor functions, allocate prototype objects in Heap memory, and establish live prototype delegation chains.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q4:** What are the architectural criteria for choosing between Prototype Method Sharing and Closure-Based Factory Functions at enterprise scale?  
<details>
<summary><strong>Answer</strong></summary>
1. **Instance Volume & Memory:** If the application creates $\ge 100,000$ active in-memory instances (e.g. charting nodes, data grid cells, AST nodes), prototype methods are essential to prevent allocating millions of duplicate function objects on the Heap.  
2. **Encapsulation & Security:** If strict data privacy, zero `this` context loss, and dependency injection are paramount, closure-based factory functions provide robust encapsulation.  
3. **Serialization Boundaries:** If objects must cross network/worker/RSC boundaries, plain serializable DTOs should always be used.
</details>

---

## Key Takeaways
1. **Default to Composition:** Assemble capabilities rather than extending deep class hierarchies.
2. **Use Dependency Injection:** Pass dependencies explicitly to maximize testability.
3. **TypeScript Types Are Erased:** Interfaces check compile-time structure, not runtime prototypes.
4. **Use Plain DTOs Across Boundaries:** Prototypes do not survive JSON / RSC serialization.
5. **Inherit for True Subtypes Only:** Use `extends` primarily for shallow hierarchies like `extends Error`.

---

[⬅️ Part 05: V8 Hidden Classes & Inline Caches](./05-v8-hidden-classes-inline-caches-deopt.md) | [📚 KPI 07 Index](./README.md) | [KPI 08: Closures & Lexical Environments ➡️](../08-Closures-Lexical-Environments/README.md)
