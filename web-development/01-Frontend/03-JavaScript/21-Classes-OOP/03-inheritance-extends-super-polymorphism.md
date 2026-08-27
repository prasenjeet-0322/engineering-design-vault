# KPI 21 — Part 03: Inheritance, `extends`, `super`, Method Overriding & Polymorphism

[⬅️ Part 02: Static Members, Private Fields `#`, Getters & Setters](./02-static-methods-private-fields-getters-setters.md) | [📚 KPI 21 Index](./README.md) | [Part 04: Composition vs Inheritance & Senior OOP Architecture ➡️](./04-composition-vs-inheritance-oop-architecture.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Inheritance Concept | Mechanism / Behavior | Core Production Rule | Senior Architectural Standard |
|---|---|---|---|
| **`extends` Keyword** | Creates prototype link between derived prototype and base prototype. | Subclass inherits both instance methods and static constructor properties. | 🟢 Use only when there is a true, stable **"Is-A"** semantic relationship. |
| **`super()` Constructor** | Invokes superclass constructor to allocate and initialize `this`. | Accessing `this` before `super()` throws `ReferenceError`. | 🔴 In derived constructors, always execute `super(...args)` before accessing `this`. |
| **`super.method()`** | Resolves method on parent prototype while preserving current `this`. | Executes parent behavior without duplicating code. | 🟢 Use when extending parent behavior rather than completely replacing it. |
| **Method Overriding** | Subclass defines a method with identical name to parent class. | Prototype delegation stops at the first matching method found on subclass. | 🟢 Always adhere to Liskov Substitution Principle (LSP); do not violate parent contract. |
| **Dual Prototype Chain** | Links both instance prototypes (`Admin.prototype`) and constructor functions (`Admin`). | Static methods on `User` are accessible via `Admin.staticMethod()`. | 🔵 Subclass constructor functions inherit directly from base constructor functions. |
| **Polymorphism** | Different subclasses respond to the same method invocation uniquely. | Eliminates long `switch (type)` statements across domain logic. | 🟢 Program to an abstract interface contract, allowing seamless subtyping. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: `this` Before `super()` & The Fragile Base Class Trap
> 
> #### Gotcha A: Accessing `this` Before `super()` in Derived Class Constructors
> *"Why does `this.role = 'admin'` crash when placed before `super(name)` in a derived class constructor?"*  
> ```js
> class User {
>   constructor(name) { this.name = name; }
> }
> 
> class Admin extends User {
>   constructor(name, role) {
>     // ❌ FATAL ERROR: Accessing this before super():
>     this.role = role; // 💥 ReferenceError: Must call super constructor in derived class before accessing 'this'!
>     super(name);
>   }
> }
> ```
> **Deep Architectural Explanation:**  
> In traditional ES5 constructors, the derived constructor allocated `{}` and called `User.call(this)`. In ES2015 classes, the memory allocation is inverted: the **base class constructor is responsible for allocating the instance object**. Until `super()` is executed, the derived constructor's `this` binding remains in an uninitialized **Temporal Dead Zone (TDZ)**. Any read or write to `this` before `super()` returns triggers a fatal `ReferenceError`.  
> **The Senior Standard:** Always invoke `super()` on the first line of derived class constructors:
> ```js
> // ✅ PROPER DERIVED CONSTRUCTOR EXECUTION:
> class Admin extends User {
>   constructor(name, role) {
>     super(name);      // 🟢 Allocates and initializes this
>     this.role = role; // 🟢 Safe to access this
>   }
> }
> ```
> 
> ---
> 
> #### Gotcha B: The Fragile Base Class Problem & Implicit Method Coupling
> *"Why did adding an internal telemetry call inside `User.save()` cause `Admin.save()` to enter an infinite loop or throw unexpected validation errors?"*  
> ```js
> // ❌ FRAGILE BASE CLASS COUPLING:
> class User {
>   save() {
>     console.log("Saving user to database...");
>     this.logAudit(); // 💥 Base class introduces internal dependency!
>   }
>   logAudit() { console.log("Audit logged"); }
> }
> 
> class Admin extends User {
>   logAudit() {
>     this.save(); // 💥 Infinite recursion: save() -> logAudit() -> save() -> Crash!
>   }
> }
> ```
> **Deep Architectural Explanation:**  
> Subclasses often rely on implicit assumptions about the internal implementation of base classes. When a base class refactors its internal method call graph, subclasses that override those methods can inadvertently cause infinite recursion, double-saving, or broken invariants. Deep inheritance hierarchies create tight invisible coupling across architectural layers.  
> **The Senior Standard:** Prefer shallow hierarchies (maximum 1 level of inheritance) and make base class methods pure or decoupled via Object Composition.

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / Next.js / Vite Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | `extends`, `super()`, Method overriding, Polymorphic domain handlers | Essential for custom Error classes (`class APIError extends Error`), SDKs, and event emitters. |
| 🟡 **Moderate** | Used in ~45% of code | `super.method()`, Static inheritance, `instanceof` prototype checking | Critical for design system components, web components (`HTMLElement`), and rich client abstractions. |
| 🔵 **Foundational / Engine** | Runtime internals | Dual prototype chain linking, Derived constructor TDZ mechanics, Liskov Substitution Principle | Mandatory for Staff/Principal engineering evaluations, runtime architecture, and library development. |

---

## Core Concepts (20 Subtopics)

### Part 1 — What Is Inheritance? Specialization & Code Reuse `🟢 [Daily Driver]`

Inheritance allows a subclass to specialize and extend the state and behavior of a base class without duplicating common code.

---

### Part 2 — The `extends` Keyword `🟢 [Daily Driver]`

`class Sub extends Super {}` establishes a prototype delegation link between `Sub.prototype` and `Super.prototype`.

---

### Part 3 — Dual Prototype Chain Linking in ES6 Classes `🔵 [Foundational / Engine]`

ES6 `extends` creates two distinct prototype chains:
1. **Instance Chain:** `Admin.prototype.__proto__ === User.prototype`
2. **Constructor Chain (Static):** `Admin.__proto__ === User`

---

### Part 4 — The Complete Prototype Delegation Chain `🔵 [Foundational / Engine]`

```text
admin ──► Admin.prototype ──► User.prototype ──► Object.prototype ──► null
```

---

### Part 5 — The `super()` Constructor Execution Pipeline `🟢 [Daily Driver]`

`super(name, email)` executes the parent constructor, initializing inherited instance properties onto `this`.

---

### Part 6 — Why `super()` Must Precede `this` `🔴 [Production-Critical]`

Derived instances are allocated by the base class constructor. `this` remains uninitialized in the TDZ until `super()` completes.

---

### Part 7 — Default Derived Constructors `🟢 [Daily Driver]`

If a derived class omits `constructor()`, JavaScript automatically generates:
```js
constructor(...args) { super(...args); }
```

---

### Part 8 — Method Overriding & Prototype Shadowing `🟢 [Daily Driver]`

Defining a method with the same name in a subclass shadows the parent method during prototype chain traversal.

---

### Part 9 — Calling Superclass Methods with `super.method()` `🟢 [Daily Driver]`

```js
getPermissions() {
  return [...super.getPermissions(), "admin:write"];
}
```
Invokes parent logic to extend rather than replace capabilities.

---

### Part 10 — `super` vs `this` Context Resolution `🔵 [Foundational / Engine]`

`super.method()` resolves the function from the parent prototype, but executes with `this` bound to the current derived instance.

---

### Part 11 — Static Inheritance in ES6 Classes `🔵 [Foundational / Engine]`

Static methods and properties defined on a parent class are inherited by child classes via the constructor prototype link (`Admin.createGuest()`).

---

### Part 12 — The `instanceof` Operator & Chain Traversal `🟢 [Daily Driver]`

`admin instanceof User` traverses `admin`'s prototype chain, returning `true` because `User.prototype` is present.

---

### Part 13 — Polymorphism: Uniform Interfaces Across Implementations `🟢 [Daily Driver]`

Different classes implement the same method signature (`send()`), allowing callers to invoke `notification.send()` uniformly.

---

### Part 14 — Polymorphism Without Classes `🟢 [Daily Driver]`

Polymorphism is a design concept achievable via plain objects and functions (Duck Typing); it does not require class inheritance.

---

### Part 15 — The "Is-A" vs "Has-A" Semantic Test `🟢 [Daily Driver]`

- **"Is-A" $\implies$ Inheritance:** `Admin is a User`.
- **"Has-A" $\implies$ Composition:** `UserService has an ApiClient`.

---

### Part 16 — The Fragile Base Class Problem `🔴 [Production-Critical]`

Subclasses become tightly coupled to base class implementation details; changes in the base class can silently break subclasses.

---

### Part 17 — Multi-Level Inheritance Trees `🟢 [Daily Driver]`

Avoid deep hierarchies (`Entity -> User -> Staff -> Admin -> SuperAdmin`). Deep chains increase cognitive load and bug potential; keep hierarchies shallow ($\le 1$ level).

---

### Part 18 — Abstract Classes in Vanilla JavaScript `🟢 [Daily Driver]`

Simulate abstract base classes by checking `new.target === AbstractBase` in the constructor and throwing an error if instantiated directly.

---

### Part 19 — Inheritance in Real-World SDKs `🟢 [Daily Driver]`

Standard use cases: Custom Error hierarchies (`class HttpError extends Error`), custom DOM elements (`class CustomButton extends HTMLElement`).

---

### Part 20 — The 7-Point Senior Inheritance Audit Checklist `🟢 [Daily Driver]`

```text
1. True "Is-A" relationship? ──► 2. super() called before this? ──► 3. Hierarchy depth <= 2?
4. Liskov Substitution honored? ──► 5. Base class pure & decoupled? ──► 6. Static inheritance verified?
7. Would Object Composition be simpler?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Code Reuse Approach | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Class Inheritance (`extends`)** | True "Is-A" specializations (Custom Errors, Web Components). | When code reuse is the only motivation without domain hierarchy. | Fragile Base Class problem; tight horizontal coupling. | Object Composition. |
| **Object Composition** | Combining multiple independent behaviors (logging, caching, auth). | Simple polymorphic subtyping where `instanceof` is required. | Requires explicit delegation wrappers. | Functional pipelines. |
| **Mixins / Class Factories** | Composing multiple behavioral traits into classes dynamically. | Complex systems where mixin collision tracking is error-prone. | Obscures prototype chain; harder IDE type inference. | Pure functions / Hooks. |
| **Duck Typing (Polymorphic Objects)** | Lightweight UI state models and functional pipelines. | Strict enterprise SDKs requiring validated prototype hierarchies. | No compile-time or runtime prototype chain guarantee. | TypeScript interfaces. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Polymorphic Notification Engine in TypeScript
```tsx
import React, { useState } from 'react';

// ==========================================
// 1. ABSTRACT BASE NOTIFICATION CLASS
// ==========================================
export abstract class BaseNotification {
  public id: string;
  public recipient: string;
  public message: string;

  constructor(recipient: string, message: string) {
    this.id = Math.random().toString(36).substring(2, 9);
    this.recipient = recipient;
    this.message = message;
  }

  // 🟢 Abstract polymorphic method
  public abstract send(): { success: boolean; channel: string; formatted: string };

  // Shared base method
  public getMetadata() {
    return { id: this.id, recipient: this.recipient, length: this.message.length };
  }
}

// ==========================================
// 2. SPECIALIZED SUBCLASSES (POLYMORPHISM)
// ==========================================
export class EmailNotification extends BaseNotification {
  public subject: string;

  constructor(recipient: string, message: string, subject: string = 'System Alert') {
    super(recipient, message); // 🟢 Calls base constructor
    this.subject = subject;
  }

  public override send() {
    console.log(`[EmailChannel]: Sending to ${this.recipient} with Subject: "${this.subject}"`);
    return {
      success: true,
      channel: 'EMAIL',
      formatted: `📧 [${this.subject}] To: ${this.recipient} -> ${this.message}`
    };
  }
}

export class SMSNotification extends BaseNotification {
  constructor(recipient: string, message: string) {
    super(recipient, message);
  }

  public override send() {
    console.log(`[SMSChannel]: Dispatching SMS to ${this.recipient}`);
    return {
      success: true,
      channel: 'SMS',
      formatted: `📱 [SMS] To: ${this.recipient} -> ${this.message.slice(0, 160)}`
    };
  }
}

export class PushNotification extends BaseNotification {
  public priority: 'HIGH' | 'LOW';

  constructor(recipient: string, message: string, priority: 'HIGH' | 'LOW' = 'HIGH') {
    super(recipient, message);
    this.priority = priority;
  }

  public override send() {
    console.log(`[PushChannel]: Sending push notification with priority ${this.priority}`);
    return {
      success: true,
      channel: 'PUSH',
      formatted: `🔔 [PUSH - ${this.priority}] To: ${this.recipient} -> ${this.message}`
    };
  }
}

// ==========================================
// 3. REACT DASHBOARD CONSUMING POLYMORPHISM
// ==========================================
export function EnterpriseNotificationDashboard() {
  const [logs, setLogs] = useState<string[]>([]);

  const dispatchAll = () => {
    // 🟢 Polymorphic Array: Different derived classes treated uniformly via BaseNotification interface
    const notifications: BaseNotification[] = [
      new EmailNotification('sunny@vault.com', 'Your report is ready', 'Weekly Summary'),
      new SMSNotification('+1-555-0199', 'Your security code is 984210'),
      new PushNotification('device_token_xyz', 'New deployment completed!', 'HIGH')
    ];

    const results = notifications.map((n) => n.send().formatted);
    setLogs(results);
  };

  return (
    <div className="polymorphic-card">
      <header className="card-header">
        <h3>Polymorphic Class Inheritance Engine</h3>
        <button onClick={dispatchAll} className="dispatch-btn">
          🚀 Dispatch Polymorphic Notifications
        </button>
      </header>

      <p className="architecture-description">
        Demonstrates base class abstraction, derived class <code>super()</code> initialization, method overriding, and uniform polymorphic execution.
      </p>

      <ul className="log-list">
        {logs.map((log, i) => (
          <li key={i} className="log-item"><code>{log}</code></li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 🧠 Part 03 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: Dual Prototype Chain Verification
```js
class User {
  static role = "BASE_USER";
  greet() { return "Hello from User"; }
}

class Admin extends User {
  static role = "ADMIN_USER";
}

const admin = new Admin();

console.log("Instance Prototype Link:", Object.getPrototypeOf(Admin.prototype) === User.prototype);
console.log("Constructor Prototype Link:", Object.getPrototypeOf(Admin) === User);
console.log("Static Property Access:", Admin.role);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Instance Prototype Link: true
Constructor Prototype Link: true
Static Property Access: ADMIN_USER
```
**Why:** ES6 `extends` links both the instance prototypes (`Admin.prototype -> User.prototype`) and the constructor functions themselves (`Admin -> User`), allowing static property inheritance.
</details>

---

### Prediction Challenge 2: `super.method()` Receiver Binding
```js
class Base {
  constructor(name) { this.name = name; }
  identify() { return `Base: ${this.name}`; }
}

class Derived extends Base {
  constructor(name) { super(name); }
  identify() { return `${super.identify()} | Derived: ${this.name}`; }
}

const d = new Derived("Sunny");
console.log("Result:", d.identify());
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Result: Base: Sunny | Derived: Sunny
```
**Why:** When `super.identify()` executes, the method from `Base.prototype` is invoked with `this` bound to the current `Derived` instance (`d`).
</details>

---

### Prediction Challenge 3: `instanceof` Traversal in Inheritance Chain
```js
class Shape {}
class Rectangle extends Shape {}
class Square extends Rectangle {}

const sq = new Square();

console.log("sq instanceof Square:", sq instanceof Square);
console.log("sq instanceof Rectangle:", sq instanceof Rectangle);
console.log("sq instanceof Shape:", sq instanceof Shape);
console.log("sq instanceof Object:", sq instanceof Object);
console.log("sq instanceof Array:", sq instanceof Array);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
sq instanceof Square: true
sq instanceof Rectangle: true
sq instanceof Shape: true
sq instanceof Object: true
sq instanceof Array: false
```
**Why:** `instanceof` checks if the constructor's `prototype` exists anywhere along the instance's prototype chain.
</details>

---

### Prediction Challenge 4: Derived Constructor TDZ Violation
```js
class Parent {
  constructor(id) { this.id = id; }
}

class Child extends Parent {
  constructor(id) {
    try {
      this.type = "CHILD"; // Accessing this before super()
    } catch (err) {
      console.log("Caught Error:", err.name);
    }
    super(id);
  }
}

new Child(101);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Caught Error: ReferenceError
```
**Why:** In a derived constructor, accessing `this` before calling `super()` triggers a Temporal Dead Zone `ReferenceError`.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What does the `extends` keyword do in JavaScript?  
<details>
<summary><strong>Answer</strong></summary>
The `extends` keyword creates an inheritance relationship between a subclass and a superclass. It links the subclass's prototype to the superclass's prototype for instance method inheritance, and links the subclass constructor function to the superclass constructor for static method inheritance.
</details>

**Q2:** Why must `super()` be called before using `this` in a child class constructor?  
<details>
<summary><strong>Answer</strong></summary>
In ES6 class inheritance, the superclass constructor is responsible for allocating the instance object in memory. Until `super()` is executed, `this` is uninitialized and resides in the Temporal Dead Zone (TDZ). Attempting to read or write to `this` before `super()` throws a `ReferenceError`.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** What is the difference between `super()` and `super.method()`?  
<details>
<summary><strong>Answer</strong></summary>
- `super()`: Used only in derived class constructors to invoke the superclass constructor and initialize `this`.  
- `super.method()`: Used in instance or static methods to invoke a method defined on the superclass prototype, while retaining the current `this` execution context.
</details>

**Q4:** What is Polymorphism and how is it demonstrated in JavaScript?  
<details>
<summary><strong>Answer</strong></summary>
Polymorphism is the ability for different objects to respond to the same method call with specialized behavior. For example, `EmailNotification` and `SMSNotification` both extend `BaseNotification` and implement `send()`. A caller can iterate over an array of notifications and invoke `notification.send()` uniformly without caring about the concrete subclass.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** What is the "Fragile Base Class Problem" and how do you mitigate it?  
<details>
<summary><strong>Answer</strong></summary>
The Fragile Base Class problem occurs when changes to a base class's internal implementation inadvertently break derived subclasses. Because subclasses inherit implementation details, modifying a base class method (e.g. adding internal method calls or changing state expectations) can cause infinite loops or broken invariants in subclasses.  
**Mitigation:**  
1. Favor **Composition over Inheritance**.  
2. Keep inheritance hierarchies shallow (maximum 1 level).  
3. Strictly adhere to the **Liskov Substitution Principle (LSP)**: subclasses must be substitutable for their base class without altering program correctness.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How does V8 execute ES6 subclass instantiation under the hood via the `[[Construct]]` internal method and `new.target`?  
<details>
<summary><strong>Answer</strong></summary>
1. **`new.target` Preservation:** When `new Admin()` is invoked, V8 sets the internal `new.target` metadata pointer to `Admin`.  
2. **`[[Construct]]` Delegation:** The `Admin` constructor begins execution without allocating memory for `this`. When `super()` is called, V8 invokes `User.[[Construct]]`, passing the original `new.target` (`Admin`).  
3. **Prototype Linking at Base:** The base class constructor (`User`) allocates the empty instance object and sets its `[[Prototype]]` to `new.target.prototype` (`Admin.prototype`), rather than `User.prototype`.  
4. **Binding Return:** Once `User` finishes initialization, the allocated instance is returned back down to `Admin`, which binds `this` and exits TDZ, allowing `Admin` to attach its own properties.
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Polymorphic Notification System

```js
// See runnable implementation in examples/03-inheritance-extends-super-polymorphism.js
```

---

## Key Takeaways
1. **`extends` Links Dual Prototype Chains:** Instance methods and static constructors both inherit.
2. **`super()` Precedes `this`:** Base constructor allocates instance memory before derived use.
3. **`super.method()` Preserves `this`:** Executes parent logic with current instance receiver.
4. **Keep Hierarchies Shallow:** Avoid deep inheritance to prevent Fragile Base Class bugs.
5. **Polymorphism Simplifies Dispatch:** Call uniform interface methods across specialized subclasses.

---

[⬅️ Part 02: Static Members, Private Fields `#`, Getters & Setters](./02-static-methods-private-fields-getters-setters.md) | [📚 KPI 21 Index](./README.md) | [Part 04: Composition vs Inheritance & Senior OOP Architecture ➡️](./04-composition-vs-inheritance-oop-architecture.md)
