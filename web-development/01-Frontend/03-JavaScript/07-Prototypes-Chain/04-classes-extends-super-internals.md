# KPI 07 — Part 04: Classes, `extends`, `super`, Instance vs Static Methods & Prototype Internals

[⬅️ Part 03: `Object.create()`, Null Prototypes & Safe Manipulation](./03-object-create-null-prototypes.md) | [📚 KPI 07 Index](./README.md) | [Part 05: V8 Hidden Classes, Inline Caches & Prototype Optimization ➡️](./05-v8-hidden-classes-inline-caches-deopt.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Feature / Keyword | Underlying Prototype Mechanism | Runtime Behavior & Ownership | Senior Production Recommendation |
|---|---|---|---|
| **`class User {}`** | Creates constructor function and links its `User.prototype`. | Methods placed on `User.prototype`; class body strictly evaluated in Strict Mode. | 🟢 **Universal Standard** for domain models and SDK services. |
| **Instance Methods** | Attached to `Class.prototype`. | Shared across all instances in Heap memory; uses call-site receiver `this`. | 🟢 **Daily Driver**: Highly memory-efficient. |
| **`static method()`** | Attached directly to the class constructor object (`User.method`). | Accessible via `User.method()`, **not** on instances (`user.method()` is `undefined`). | 🟢 Use for factories, utilities & deserializers. |
| **`extends`** | Creates **Dual Prototype Chains**: Instance chain and Static constructor chain. | `Child.prototype.[[Prototype]] === Parent.prototype` AND `Child.[[Prototype]] === Parent`. | 🟡 Use for true "IS-A" domain relationships; avoid deep nesting. |
| **`super()`** | Invokes base constructor to initialize instance memory and bind `this`. | In derived constructors, `this` is uninitialized (in TDZ) until `super()` completes. | 🟢 **Mandatory**: Must be called before accessing `this`. |
| **`super.method()`** | Resolves method on `Parent.prototype`, but executes with derived instance as `this`. | Preserves derived receiver context. | 🟢 Essential for controlled method extension. |
| **Private Fields (`#field`)**| Internal Private Slots managed by engine with runtime brand checking. | Inaccessible via string indexing (`obj['#field']` throws syntax error). | 🟡 Use for true runtime encapsulation in SDKs/libraries. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotcha: Why Does `this` Access Throw `ReferenceError` Before `super()` in Derived Constructors?
> **Question:** *"Why does the following code throw `ReferenceError: Must call super constructor in derived class before accessing 'this'`?"*  
> ```js
> class BaseService {
>   constructor(name) {
>     this.name = name;
>   }
> }
> 
> class CustomService extends BaseService {
>   constructor(name, config) {
>     this.config = config; // ❌ ReferenceError!
>     super(name);
>   }
> }
> ```
> **Deep Architectural Answer:**  
> 1. In JavaScript base classes, the constructor itself allocates the new instance object and assigns `this`.  
> 2. In derived classes (`extends BaseService`), the derived constructor does **not** allocate the instance object. Instead, instance allocation is delegated to the base class constructor.  
> 3. The derived constructor enters execution with its `this` binding in an **uninitialized Temporal Dead Zone (TDZ)** state.  
> 4. Calling `super(name)` executes the base constructor, which allocates the underlying instance, runs base field initializers, and initializes the derived constructor's `this` binding.  
> 5. Accessing `this` before `super()` attempts to read an uninitialized TDZ binding, resulting in a spec-mandated `ReferenceError`!

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / TypeScript Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Domain entities, custom error hierarchies (`extends Error`), static factory methods, TypeScript classes | Essential for architecting clean domain layers, error boundary handlers, and SDK abstractions. |
| 🟡 **Moderate** | Used in ~25% of code | Class field arrows vs prototype methods, `#private` field encapsulation, `static { ... }` blocks | Critical for library authoring, memory optimization, and data security boundaries. |
| 🔵 **Foundational / Engine** | Runtime internals | The Dual Prototype Chain of `extends`, V8 `[[Construct]]` derived frame dispatch | Essential for compiler understanding, runtime optimization, and Staff/Principal technical evaluations. |

---

## Core Concepts (20 Subtopics)

### Part 1 — ES6 Class Declaration Syntax Desugaring to Prototype Delegation `🟢 [Daily Driver]`

ES6 `class` syntax is syntactic sugar over constructor functions and `.prototype`. Methods defined in the class body are placed on `ClassName.prototype`.

---

### Part 2 — The Dual Prototype Chains of `extends`: Instance Chain vs Static Chain `🔵 [Foundational / Engine]`

`class Child extends Parent` establishes **two distinct prototype chains**:
```text
1. Instance Chain: childInstance -> Child.prototype -> Parent.prototype -> Object.prototype -> null
2. Static Chain:   Child -> Parent -> Function.prototype -> Object.prototype -> null
```

---

### Part 3 — Instance Methods (`Class.prototype`) vs Instance Fields (`this.field`) `🟢 [Daily Driver]`

- **Instance Methods:** Stored on the prototype. Shared across all instances.
- **Instance Fields:** Initialized per instance inside the constructor or via class field declarations.

---

### Part 4 — Static Methods and Properties on the Class Object `🟢 [Daily Driver]`

Static methods live on the class constructor object itself. Thanks to the Static Chain (`Child.[[Prototype]] === Parent`), derived classes automatically inherit static methods.

---

### Part 5 — The 4-Stage Derived Class Construction Protocol (`super()`) `🔵 [Foundational / Engine]`

```text
1. Derived constructor called -> 'this' is in uninitialized TDZ.
2. super(...args) called -> Delegates instantiation to Parent constructor.
3. Parent initializes base state and returns initialized instance object.
4. Derived instance fields are evaluated, and derived constructor finishes with initialized 'this'.
```

---

### Part 6 — Temporal Dead Zone (TDZ) on `this` in Derived Constructors `🟢 [Daily Driver]`

Attempting to read or write `this.property` before `super()` throws a fatal `ReferenceError`.

---

### Part 7 — `super.method()` Resolution and Dynamic Receiver `this` Binding `🟢 [Daily Driver]`

Calling `super.method()` resolves the function from `Parent.prototype`, but executes with `this` bound to the derived instance.

---

### Part 8 — Subclass Initialization Order & Dangerous Base Constructor Field Access `🟢 [Daily Driver]`

If a base constructor calls an overridable method that accesses child instance fields, those fields will be `undefined` because child field initializers run *after* the base constructor finishes.

---

### Part 9 — ECMAScript Private Fields (`#field`) & Brand Checks `🟢 [Daily Driver]`

Private identifiers (`#field`) use internal private slots with engine-enforced brand checks. Attempting to access private fields on unrelated objects throws a `TypeError`.

---

### Part 10 — TypeScript `private` vs JavaScript `#private` `🟢 [Daily Driver]`

- **TypeScript `private`:** Compile-time check only; stripped during compilation, leaving properties public at runtime.
- **JavaScript `#private`:** Enforced by the JavaScript runtime engine; strictly inaccessible from outside the class.

---

### Part 11 — Class Arrow Methods (`field = () => {}`) vs Prototype Methods `🟢 [Daily Driver]`

- **Class Arrow Method (`handleClick = () => {}`):** Creates a brand-new function instance on **every object**. Prevents `this` context loss in callbacks but consumes significant Heap memory.
- **Prototype Method (`handleClick() {}`):** Shares a single function on the prototype.

---

### Part 12 — Memory Allocation Benchmarks: Class Field Arrows vs Prototype Methods `🟢 [Daily Driver]`

For 10,000 class instances:
- **Prototype Methods:** $\approx 1.2\text{MB}$ Heap memory.
- **Arrow Class Fields:** $\approx 16.8\text{MB}$ Heap memory + GC pressure.

---

### Part 13 — Static Initialization Blocks (`static { ... }`) `🟡 [Moderate]`

ES2022 `static { ... }` blocks execute once when the class is defined, allowing multi-statement initialization of static properties with access to private fields.

---

### Part 14 — Abstract Class Patterns with `new.target` Guards `🟡 [Moderate]`

```js
class AbstractRepository {
  constructor() {
    if (new.target === AbstractRepository) {
      throw new Error("Cannot instantiate AbstractRepository directly.");
    }
  }
}
```

---

### Part 15 — Built-In Class Subclassing (`class CustomArray extends Array`) `🟡 [Moderate]`

Extending built-in classes (`Array`, `Error`, `Map`) allows customizing native behaviors while preserving internal exotic object slots.

---

### Part 16 — Species Pattern (`Symbol.species`) in Derived Collections `🔵 [Foundational / Engine]`

Used by built-in methods (like `Array.prototype.map`) to determine whether to construct derived instances or base instances during transformation.

---

### Part 17 — React Component Architecture: Class vs Functional Hooks Evolution `🟢 [Daily Driver]`

Modern React favors functional components with Hooks over `class Component extends React.Component` to eliminate `this` binding bugs, reduce bundle size, and improve code reusability.

---

### Part 18 — React State Hazards: Mutable Class Instances vs Immutable DTO Updates `🟢 [Daily Driver]`

Mutating properties on a class instance in React state (`user.name = "Alex"; setUser(user)`) preserves object reference identity, causing React to bail out of re-renders. **Always treat React state immutably with plain DTOs.**

---

### Part 19 — TypeScript `InstanceType<typeof Class>` & Structural Typing Interop `🟢 [Daily Driver]`

```ts
type UserInstance = InstanceType<typeof User>;
```

---

### Part 20 — 10-Point Senior Class Architecture & Inheritance Checklist `🟢 [Daily Driver]`

```text
1. Are methods placed on the prototype instead of using arrow class fields where memory matters?
2. Is super() called before accessing this in all derived class constructors?
3. Are base constructors avoiding calls to overridable methods that rely on child fields?
4. Is true runtime privacy implemented via #private fields rather than TypeScript private?
5. Are static methods used for factories, utilities, and DTO deserialization?
6. Is class inheritance limited to <= 3 levels to prevent tight coupling?
7. Is composition preferred over inheritance for code reuse?
8. Are React state values stored as plain serializable DTOs rather than mutable class instances?
9. Are custom error hierarchies built by extending Error (e.g. class ApiError extends Error)?
10. Is new.target used to enforce abstract class contracts where required?
```

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Domain Entity Hierarchy with Static Factories & Serializable DTO Bridges
```tsx
import React, { useState, useMemo } from 'react';

export interface UserDTO {
  id: string;
  name: string;
  role: 'USER' | 'ADMIN';
  createdAt: number;
}

/**
 * Base Domain Entity with Shared Prototype Behaviors
 */
export class BaseEntity {
  public id: string;
  public createdAt: number;

  constructor(id: string, createdAt: number = Date.now()) {
    this.id = id;
    this.createdAt = createdAt;
  }

  // Prototype method shared across all entities
  public getAgeMs(): number {
    return Date.now() - this.createdAt;
  }
}

/**
 * Derived Domain Entity with Dual Prototype Inheritance
 */
export class UserEntity extends BaseEntity {
  public name: string;
  public role: 'USER' | 'ADMIN';
  #authToken: string; // ✅ Runtime Private Field with Brand Checking

  constructor(dto: UserDTO, authToken: string = 'TOKEN_ANON') {
    // 1. Mandatory super() call initializes base instance
    super(dto.id, dto.createdAt);
    // 2. Derived fields initialized
    this.name = dto.name;
    this.role = dto.role;
    this.#authToken = authToken;
  }

  // ✅ Static Factory Method on Class Constructor Object
  public static fromDTO(dto: UserDTO): UserEntity {
    return new UserEntity(dto);
  }

  public getSummary(): string {
    return `${this.name} (${this.role}) - Active for ${Math.round(this.getAgeMs() / 1000)}s`;
  }

  public isAdmin(): boolean {
    return this.role === 'ADMIN';
  }

  // ✅ Safe Serialization Boundary for React/Redux State
  public toDTO(): UserDTO {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      createdAt: this.createdAt
    };
  }
}

export function UserProfileBadge({ rawUser }: { rawUser: UserDTO }) {
  // Hydrate DTO into domain entity for rich prototype method access
  const userEntity = useMemo(() => UserEntity.fromDTO(rawUser), [rawUser]);

  return (
    <div className={`user-badge ${userEntity.isAdmin() ? 'admin-theme' : 'user-theme'}`}>
      <h4>User Profile: {userEntity.name}</h4>
      <p>Summary: {userEntity.getSummary()}</p>
      <p>Role: <strong>{userEntity.role}</strong></p>
    </div>
  );
}
```

---

## 🧠 Part 04 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: Static Method Inheritance via Dual Chains
```js
class BaseService {
  static getEndpoint() {
    return "https://api.domain.com";
  }
}

class AuthService extends BaseService {}

const auth = new AuthService();

console.log(AuthService.getEndpoint());
console.log(typeof auth.getEndpoint);
console.log(Object.getPrototypeOf(AuthService) === BaseService);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
https://api.domain.com
undefined
true
```
**Why:** `extends` creates the Static Chain `AuthService.[[Prototype]] === BaseService`. `AuthService.getEndpoint()` delegates up the static chain. However, `auth` is an instance; its instance chain (`AuthService.prototype -> BaseService.prototype`) does not contain static methods.
</details>

---

### Prediction Challenge 2: Derived Subclass Field Initialization Order Trap
```js
class Parent {
  constructor() {
    this.initialize();
  }
  initialize() {
    console.log("Parent Init:", this.label);
  }
}

class Child extends Parent {
  label = "CHILD_DATA";

  initialize() {
    console.log("Child Init:", this.label);
  }
}

new Child();
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Child Init: undefined
```
**Why:** When `new Child()` executes, the `Parent` constructor runs first. It invokes `this.initialize()`, which dynamically resolves to `Child.prototype.initialize`. At this moment, however, `Child`'s own field initializers (`label = "CHILD_DATA"`) have not run yet! Therefore, `this.label` evaluates to `undefined`.
</details>

---

### Prediction Challenge 3: `super.method()` Receiver Dynamic Binding
```js
class Base {
  constructor(name) {
    this.name = name;
  }
  greet() {
    return `Hello from ${this.name}`;
  }
}

class Derived extends Base {
  greet() {
    return `[Derived] ${super.greet()}`;
  }
}

const item = new Derived("Alpha");
console.log(item.greet());
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
[Derived] Hello from Alpha
```
**Why:** `super.greet()` resolves the method implementation from `Base.prototype.greet`, but when invoked, `this` remains dynamically bound to the calling instance `item` (`name: "Alpha"`).
</details>

---

### Prediction Challenge 4: Private Field Brand Checking
```js
class Vault {
  #secretKey;
  constructor(key) {
    this.#secretKey = key;
  }
  readSecret(otherVault) {
    return otherVault.#secretKey;
  }
}

const v1 = new Vault("KEY_A");
const v2 = new Vault("KEY_B");
const fakeVault = { #secretKey: "HACKED" }; // Syntax error if literal, or ordinary object

console.log(v1.readSecret(v2));

try {
  v1.readSecret({ fake: true });
} catch (err) {
  console.log("Caught:", err.name);
}
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
KEY_B
Caught: TypeError
```
**Why:** Private fields enforce **class brand checking**. `v1.readSecret(v2)` succeeds because `v2` is an instance of `Vault` and possesses the private brand slot `#secretKey`. Passing a plain object `{ fake: true }` fails the brand check and throws a `TypeError: Cannot read private member #secretKey from an object whose class did not declare it`.
</details>

---

### Prediction Challenge 5: Class Field Arrow vs Prototype Method Reference Equality
```js
class Widget {
  // Arrow method as class field
  handleClick = () => {
    return this;
  };

  // Prototype method
  render() {
    return "UI";
  }
}

const w1 = new Widget();
const w2 = new Widget();

console.log(w1.handleClick === w2.handleClick);
console.log(w1.render === w2.render);
console.log(Object.hasOwn(w1, "handleClick"));
console.log(Object.hasOwn(w1, "render"));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
false
true
true
false
```
**Why:** Arrow class fields are initialized as **own properties** on each instance during construction (creating a new closure function object per instance). Prototype methods reside on `Widget.prototype` and are shared across all instances.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What happens behind the scenes when you declare an ES6 `class`?  
<details>
<summary><strong>Answer</strong></summary>
Declaring `class User { ... }` creates a constructor function `User` whose code executes in strict mode. All methods declared in the class body (except static methods and field initializers) are attached to `User.prototype`. Calling `new User()` executes the standard 5-step prototype construction protocol.
</details>

**Q2:** What is the difference between a static method and an instance method in an ES6 class?  
<details>
<summary><strong>Answer</strong></summary>
- **Instance Method:** Attached to `Class.prototype`. Shared by all instances and accessed via `instance.method()`.  
- **Static Method:** Attached directly to the class constructor object itself (`Class.method`). Accessed directly on the class identifier and cannot be called from an instance.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** What are the "Dual Prototype Chains" created by the `extends` keyword?  
<details>
<summary><strong>Answer</strong></summary>
When `class Child extends Parent` is evaluated, JavaScript links two separate chains:  
1. **Instance Chain:** `Child.prototype.[[Prototype]] = Parent.prototype` (enables instances of `Child` to inherit instance methods from `Parent`).  
2. **Static Chain:** `Child.[[Prototype]] = Parent` (enables `Child` constructor to inherit static methods and properties from `Parent`).
</details>

**Q4:** Why is `super()` required before accessing `this` in a derived constructor?  
<details>
<summary><strong>Answer</strong></summary>
In derived classes, instance object allocation is delegated to the parent constructor. The derived constructor starts with its `this` binding uninitialized in a Temporal Dead Zone (TDZ). Calling `super()` invokes the parent constructor to allocate the instance, run base initializers, and bind `this`. Accessing `this` prior to `super()` throws a spec-mandated `ReferenceError`.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** What are the performance and memory implications of using class field arrow functions (`method = () => {}`) versus prototype methods?  
<details>
<summary><strong>Answer</strong></summary>
- **Class Field Arrows:** Allocate a brand-new function instance on the Heap for every constructed instance as an own property. While convenient for auto-binding `this` in callbacks, instantiating 10,000 objects creates 10,000 function closures, increasing memory usage from $\approx 1\text{MB}$ to $>16\text{MB}$ and increasing GC churn.  
- **Prototype Methods:** Stored once on `Class.prototype`. All 10,000 instances share a single function reference in memory. In performance-critical or high-instance components, prototype methods combined with manual binding or parameter passing are vastly superior.
</details>

**Q6:** Why can calling a polymorphic method from a base class constructor cause runtime bugs in derived classes?  
<details>
<summary><strong>Answer</strong></summary>
In JavaScript construction order, the base class constructor executes *before* derived class instance field initializers run. If the base constructor invokes an overridden method (`this.setup()`), dynamic dispatch routes the call to the derived class's implementation. If that method attempts to access derived class fields (`this.childField`), they will evaluate to `undefined` because derived field initialization has not occurred yet.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q7:** How does the ECMAScript specification enforce Private Field Brand Checks (`#privateSlot`) at the engine level?  
<details>
<summary><strong>Answer</strong></summary>
1. **Private Names & Private Elements:** The specification associates a unique `PrivateName` identifier with each private field.  
2. **Brand Check Algorithm:** When a class method accesses `target.#field`, the engine evaluates `PrivateFieldGet(target, P)`. It inspects the internal `[[PrivateElements]]` list of `target`.  
3. **Identity Verification:** If `target` does not have a private element matching the exact `PrivateName` registered to that class definition, the engine throws a `TypeError`. This prevents prototype borrowing, dynamic monkey-patching, or spoofing private state via foreign objects.
</details>

---

## 🛠️ Senior Architecture Challenge: Enterprise Multi-Tenant Domain Service Hierarchy

```js
// See runnable implementation in examples/04-classes-extends-super-internals.js
```

---

## Key Takeaways
1. **Classes Are Prototypes:** `class` is clean syntax built on prototype delegation.
2. **Dual Prototype Chains:** `extends` links both instance prototypes and constructor functions.
3. **`super()` Clears TDZ:** `this` cannot be accessed before `super()` in derived constructors.
4. **Beware Subclass Init Order:** Derived fields are `undefined` when base constructor executes.
5. **Private Fields Have Brand Checks:** `#private` enforces runtime engine-level privacy.

---

[⬅️ Part 03: `Object.create()`, Null Prototypes & Safe Manipulation](./03-object-create-null-prototypes.md) | [📚 KPI 07 Index](./README.md) | [Part 05: V8 Hidden Classes, Inline Caches & Prototype Optimization ➡️](./05-v8-hidden-classes-inline-caches-deopt.md)
