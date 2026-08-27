# KPI 03 — Part 02: Hoisting, `var`, `let`, `const` & the Temporal Dead Zone (TDZ)

[⬅️ Part 01: Scope Fundamentals & Lexical Scope](./01-scope-fundamentals-lexical-scope-chain.md) | [📚 KPI 03 Index](./README.md) | [Part 03: var vs let vs const & Shadowing ➡️](./03-var-let-const-shadowing.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Declaration Type | Scope | Binding Created During Setup? | Initialized During Setup? | Access Before Declaration Statement | Senior Production Default |
|---|---|---|---|---|---|
| **`var`** | Function / Global | **Yes** | **Yes $\rightarrow$ `undefined`** | Returns `undefined` (No error, silent bug hazard). | 🔴 **Avoid completely** in modern React/TS applications. |
| **`let`** | Block `{}` | **Yes** | **No** (Remains `<uninitialized>`) | Throws `ReferenceError` (TDZ violation). | 🟢 Use **only** when variable reassignment is required. |
| **`const`** | Block `{}` | **Yes** | **No** (Must have inline initializer) | Throws `ReferenceError` (TDZ violation). | 🟢 **Universal Standard**; default to `const` everywhere. |
| **Function Declaration** | Block / Function | **Yes** | **Yes $\rightarrow$ Function Object** | Fully callable before textual declaration. | 🟢 Ideal for top-level module helper functions. |
| **`var` Function Expression** | Function / Global | **Yes** | **Yes $\rightarrow$ `undefined`** | Throws `TypeError: fn is not a function`. | 🔴 Avoid; deceptive variable hoisting. |
| **`const` Function Expression** | Block `{}` | **Yes** | **No** (Remains `<uninitialized>`) | Throws `ReferenceError: Cannot access before initialization`. | 🟢 Ideal for React handlers and closures. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotcha: Is `let` Hoisted?
> **Question:** *"Is `let` hoisted in JavaScript? What happens when you run `console.log(user); let user = 'Sunny';`?"*  
> ```js
> console.log(user);
> let user = "Sunny";
> ```
> **Deep Architectural Answer:**  
> 1. **Yes, `let` IS hoisted!** The JavaScript engine creates the `user` binding in the declarative environment record during compilation/scope setup.  
> 2. However, unlike `var`, **`let` is NOT initialized during the setup phase**. It enters the **Temporal Dead Zone (TDZ)** in an `<uninitialized>` state.  
> 3. Accessing an uninitialized binding throws an immediate `ReferenceError: Cannot access 'user' before initialization`.  
> 4. **The Critical 3-Phase Distinction:**  
>    $$\text{Binding Creation} \neq \text{Binding Initialization} \neq \text{Value Assignment}$$  
> 5. **The Senior Standard:** Saying "`let` is not hoisted" is an architectural misconception. Hoisting means **early binding creation**; the difference lies in **initialization timing**!

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / TypeScript Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | `const` immutability, `let` reassignment boundaries, React hook initialization order, TDZ avoidance | Foundational for variable scoping, hook dependency order, derived state calculations, and lint rule compliance. |
| 🟡 **Moderate** | Used in ~25% of code | Shadowing within the TDZ, function declaration vs expression hoisting, legacy `var` refactoring | Critical for diagnosing subtle `ReferenceError` / `TypeError` bugs during code migrations and interviews. |
| 🔵 **Foundational / Engine** | Runtime internals | V8 Scope Analysis, Ignition Bytecode AST instantiation, Stack/Register slot assignment vs Heap Contexts | Essential for understanding JIT compilation tiers, memory allocations, and Staff/Principal technical evaluations. |

---

## Core Concepts (20 Subtopics)

### Part 1 — What "Hoisting" Actually Means in V8 `🔵 [Foundational / Engine]`

JavaScript engines do **not** physically re-order or move source code lines upward. Before executing bytecode, the engine scans the AST during **Scope Analysis** and instantiates environment records for all declarations in that scope.

---

### Part 2 — Underlying Runtime & Ignition Bytecode Setup Phase `🔵 [Foundational / Engine]`

```text
V8 PIPELINE:
Source Code ──► Parser ──► AST & Scope Analysis ──► Bytecode Generation (Ignition) ──► Execution
                                │
                                └── Instantiates Lexical Environment Record
```

---

### Part 3 — The 3-Phase Binding Lifecycle: Creation, Initialization, Assignment `🟢 [Daily Driver]`

```text
PHASE 1: BINDING CREATION       (Scope Setup: Allocates identifier slot in Environment Record)
           │
           ▼
PHASE 2: BINDING INITIALIZATION (Declaring statement reached: Slots initialized with value/undefined)
           │
           ▼
PHASE 3: VALUE ASSIGNMENT       (Expression evaluated: Value stored in memory slot)
```

---

### Part 4 — `var` Hoisting & The Immediate `undefined` Initialization `🟢 [Daily Driver]`

`var` combines **Creation** and **Initialization** into the setup phase, assigning `undefined` before execution:

```js
console.log(score); // undefined (Binding exists AND is initialized to undefined)
var score = 100;
console.log(score); // 100
```

---

### Part 5 — The Classic `var` Bug Surface in Async Closures and Loops `🟢 [Daily Driver]`

Because `var` is function-scoped and shares a single mutable binding, asynchronous callbacks capture the final mutated value:

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 10); // Logs: 3, 3, 3 ❌
}
```

---

### Part 6 — `let` Hoisting & The Temporal Dead Zone (TDZ) `🟢 [Daily Driver]`

`let` bindings are created during setup but remain **uninitialized** until the execution thread physically reaches the `let` statement:

```js
// ⚡ TDZ for 'user' begins here:
// console.log(user); // 💥 ReferenceError: Cannot access 'user' before initialization
let user = "Sunny";   // ⚡ TDZ ends here; 'user' is now initialized to "Sunny"
```

---

### Part 7 — `<uninitialized>` State vs. `undefined` in ECMAScript `🔵 [Foundational / Engine]`

- `undefined` is a valid primitive value.
- `<uninitialized>` is an engine-level internal state (sentinel). Attempting to read an `<uninitialized>` slot traps directly into a `ReferenceError`.

---

### Part 8 — `const` Declarations: Mandatory Initializer & Binding Immutability `🟢 [Daily Driver]`

`const` enforces two strict rules:
1. Must receive an initializer at the moment of declaration (`const x = 10;`, never `const x;`).
2. The reference pointer cannot be reassigned.

---

### Part 9 — The `const` Mutation Fallacy `🟢 [Daily Driver]`

```js
const user = { name: "Sunny" }; // user points to Heap Object @0xA100
user.name = "Alex";             // ✅ VALID: Mutates the object at @0xA100
user = { name: "Alex" };        // 💥 TypeError: Assignment to constant variable
```
*`const` protects the **binding pointer**, not the object's internal properties!*

---

### Part 10 — React Referential Equality & `Object.is()` State Bailouts `🟢 [Daily Driver]`

```tsx
// ❌ MUTATION TRAP: React fails to re-render because object pointer @0xA100 didn't change:
user.name = "Updated";
setUser(user);

// ✅ IMMUTABLE UPDATE: Allocates new object pointer @0xB200; triggers re-render:
setUser(prev => ({ ...prev, name: "Updated" }));
```

---

### Part 11 — The Temporal Dead Zone (TDZ) Runtime Boundaries `🟢 [Daily Driver]`

The TDZ is the temporal window from the start of the block until the variable declaration statement is executed.

---

### Part 12 — TDZ Is Temporal (Execution Time), Not Strictly Spatial (Line Numbers) `🟢 [Daily Driver]`

```js
function test() {
  const show = () => console.log(msg); // Declared textually BEFORE 'msg'
  let msg = "Hello";                  // 'msg' is initialized
  show();                             // ✅ WORKS: Executed temporally AFTER initialization!
}
test();
```

---

### Part 13 — Declaration Order in React Components & Hook Initializers `🟢 [Daily Driver]`

```tsx
// ❌ FAILS: Accessing 'lastName' before its declaration inside derived calculation:
function UserBadge() {
  const fullName = `${firstName} ${lastName}`; // 💥 ReferenceError
  const firstName = "Sunny";
  const lastName = "Kumar";
  return <h1>{fullName}</h1>;
}
```

---

### Part 14 — Function Declaration Hoisting & Instantiation Semantics `🟢 [Daily Driver]`

Function declarations are hoisted with their complete function body initialized:

```js
console.log(calculateTotal(100)); // 118 ✅ (Fully callable before textual declaration)

function calculateTotal(price) {
  return price * 1.18;
}
```

---

### Part 15 — Function Declarations vs. `var` Function Expressions (`TypeError`) `🟢 [Daily Driver]`

```js
greet(); // 💥 TypeError: greet is not a function (greet is 'undefined' at this point!)

var greet = function() {
  console.log("Hello");
};
```

---

### Part 16 — Function Expressions with `let`/`const` (`ReferenceError`) `🟢 [Daily Driver]`

```js
greet(); // 💥 ReferenceError: Cannot access 'greet' before initialization

const greet = () => {
  console.log("Hello");
};
```

---

### Part 17 — Production Decision Hierarchy: `const` $\rightarrow$ `let` $\rightarrow$ Avoid `var` `🟢 [Daily Driver]`

```text
DECISION HIERARCHY:
1. Always start with `const`.
2. Switch to `let` ONLY when variable reassignment is strictly required (e.g. accumulator loops).
3. NEVER use `var` in modern codebases.
```

---

### Part 18 — Variable Shadowing within the TDZ (`ReferenceError` Halting) `🟡 [Moderate]`

```js
const value = "outer";

function evaluate() {
  console.log(value); // 💥 ReferenceError: Cannot access 'value' before initialization!
  const value = "inner"; // Inner 'value' shadows outer 'value' throughout the ENTIRE function scope!
}
evaluate();
```
*The engine halts at the nearest matching lexical binding; it does not fall back to outer scope just because the inner binding is uninitialized.*

---

### Part 19 — Uninitialized `let` Declarations (`let value;`) Lifecycle `🟢 [Daily Driver]`

```js
let value;            // Execution reaches here: TDZ ends; value initialized to 'undefined'
console.log(value);   // undefined (Accessible!)
value = 100;          // Value assigned
console.log(value);   // 100
```

---

### Part 20 — 4-Pillar Senior Architecture Decision Matrix `🟢 [Daily Driver]`

```text
Need immutable binding? ──► `const` (Default)
Need reassignment?      ──► `let`
Need top-level utility? ──► `function` declaration
Need callback/closure?  ──► `const fn = () => {}`
```

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### High-Performance Immutable User Session Manager
```tsx
import React, { useState, useCallback } from 'react';

export interface UserSession {
  readonly userId: string;
  readonly email: string;
  readonly role: 'admin' | 'editor' | 'viewer';
  readonly lastActiveTimestamp: number;
}

// ⚡ Immutable Session Factory with Deep Freeze Protection
export function createFrozenSession(session: UserSession): Readonly<UserSession> {
  return Object.freeze({ ...session });
}

export function UserSessionController() {
  // ✅ Explicit top-down declaration flow preventing TDZ traps
  const [session, setSession] = useState<Readonly<UserSession>>(() =>
    createFrozenSession({
      userId: 'usr_9812',
      email: 'sunny@enterprise.io',
      role: 'admin',
      lastActiveTimestamp: Date.now()
    })
  );

  // ✅ Immutable updater guaranteeing fresh referential equality for React.memo
  const handleUpdateEmail = useCallback((newEmail: string) => {
    setSession(prevSession =>
      createFrozenSession({
        ...prevSession,
        email: newEmail,
        lastActiveTimestamp: Date.now()
      })
    );
  }, []);

  return (
    <div className="session-card">
      <h3>Active Session: {session.userId}</h3>
      <p>Role: {session.role}</p>
      <p>Email: {session.email}</p>
      <button onClick={() => handleUpdateEmail('architect@enterprise.io')}>
        Update Work Email
      </button>
    </div>
  );
}
```

---

## 🧠 Part 02 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: `var` Hoisting Evaluation
```js
console.log(a);
var a = 10;
console.log(a);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**
```text
undefined
10
```
**Why:** `var a` is created and initialized to `undefined` during the setup phase. The first `console.log` reads `undefined`. Line 2 assigns `10`.
</details>

---

### Prediction Challenge 2: Block Scope TDZ Violation
```js
{
  console.log(a);
  let a = 10;
}
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:** `ReferenceError: Cannot access 'a' before initialization`  
**Why:** The block's declarative environment holds an uninitialized `a` binding. Accessing it prior to `let a = 10` violates the Temporal Dead Zone.
</details>

---

### Prediction Challenge 3: Shadowing inside TDZ
```js
const value = "outer";
function test() {
  console.log(value);
  const value = "inner";
}
test();
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:** `ReferenceError: Cannot access 'value' before initialization`  
**Why:** The local `const value = "inner"` binding shadows the global `value` across the entire `test()` scope. Identifier lookup finds the uninitialized local binding first and throws.
</details>

---

### Prediction Challenge 4: Function Declaration vs `var` Expression vs `const` Expression
```js
first();
second();
third();

function first() { console.log("first"); }
var second = function() { console.log("second"); };
const third = function() { console.log("third"); };
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**
```text
first
TypeError: second is not a function
```
**Why:** `first()` succeeds because function declarations are hoisted initialized. `second()` fails with `TypeError` because `second` is currently `undefined`. `third()` is never reached.
</details>

---

### Prediction Challenge 5: `let` Without Initial Value
```js
let value;
console.log(value);
value = 100;
console.log(value);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**
```text
undefined
100
```
**Why:** When execution reaches `let value;`, the TDZ terminates and `value` is initialized to `undefined`.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is the Temporal Dead Zone (TDZ)?  
<details>
<summary><strong>Answer</strong></summary>
The Temporal Dead Zone (TDZ) is the runtime period between the start of a block scope and the execution of the `let` or `const` declaration statement. Accessing the variable during this period throws a `ReferenceError`.
</details>

**Q2:** Why does `console.log(a)` print `undefined` for `var a = 10;`, but throws an error for `let a = 10;`?  
<details>
<summary><strong>Answer</strong></summary>
During compilation, `var` is hoisted and immediately initialized to `undefined`. `let` is hoisted into an `<uninitialized>` state, remaining inaccessible in the TDZ until its declaration line executes.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** Does `const obj = {}` prevent modifying object properties? How does this impact React state?  
<details>
<summary><strong>Answer</strong></summary>
No. `const` only prevents **reassigning the variable binding** to a new memory address. It does not prevent mutating object properties in Heap memory (`obj.name = "new"`). In React, mutating state objects directly breaks pure rendering because React compares state references via `Object.is()`; mutating properties keeps the same reference and causes React to bailout of re-rendering.
</details>

**Q4:** Why does invoking a `var` function expression before its declaration result in a `TypeError` instead of a `ReferenceError`?  
<details>
<summary><strong>Answer</strong></summary>
Because `var` is hoisted and initialized to `undefined` during the setup phase. The identifier exists in scope (so no `ReferenceError` is thrown), but attempting to invoke `undefined()` is not a valid callable function, triggering a runtime `TypeError: <name> is not a function`.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** Why does an uninitialized `let` variable shadow an outer variable even before its declaration line is executed?  
<details>
<summary><strong>Answer</strong></summary>
Because scope resolution is static and determined during compile-time **Scope Analysis**. The engine instantiates the local Lexical Environment Record containing the `let` binding for the entire block. When an identifier is looked up, the scope chain search stops at the nearest matching binding. Because that binding is in the `<uninitialized>` TDZ state, the engine throws an immediate `ReferenceError` rather than continuing up the scope chain.
</details>

**Q6:** Explain how temporal vs spatial TDZ boundaries operate when passing callbacks to higher-order functions.  
<details>
<summary><strong>Answer</strong></summary>
TDZ is temporal (based on execution timing), not spatial (line order). A function declared textually *before* a `let` variable can safely access that variable as long as the function is *invoked after* the `let` declaration has executed. Conversely, invoking the function before the declaration line executes throws a `ReferenceError` regardless of textual positioning.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q7:** How does V8 represent `<uninitialized>` TDZ variables in Ignition Bytecode, and how does TurboFan eliminate TDZ checks in optimized code?  
<details>
<summary><strong>Answer</strong></summary>
1. **Ignition Bytecode Sentinel:** V8 uses an internal `TheHole` sentinel value to represent uninitialized TDZ slots. When bytecode reads a lexical slot, it emits `LdaLookupSlot` or `Ldar` followed by a check; if the value is `TheHole`, it calls `ThrowReferenceErrorIfHole`.  
2. **TurboFan TDZ Elimination:** In optimized compilation tiers, TurboFan performs **Dominator Tree Analysis** and control-flow reachability checks. If TurboFan proves that a variable access is strictly dominated by its declaration statement, it completely eliminates the `ThrowReferenceErrorIfHole` runtime check, producing raw direct register reads with zero branching overhead.
</details>

---

## 🛠️ Senior Architecture Challenge: Enterprise Session State Manager

```js
// See runnable implementation in examples/02-hoisting-temporal-dead-zone.js
```

---

## Key Takeaways
1. **`let`/`const` ARE Hoisted:** Bindings are created early but remain in the TDZ until initialized.
2. **`const` Protects the Pointer:** Binding reassignment is forbidden; Heap object properties remain mutable.
3. **Always Immutable State Updates:** Allocate fresh object references (`{ ...prev }`) to ensure React render detection.
4. **TDZ Shadows Outer Scope:** Lookup halts at uninitialized nearest lexical bindings.
5. **Function Declarations are Fully Hoisted:** Callable before textual definition; function expressions are not.

---

[⬅️ Part 01: Scope Fundamentals & Lexical Scope](./01-scope-fundamentals-lexical-scope-chain.md) | [📚 KPI 03 Index](./README.md) | [Part 03: var vs let vs const & Shadowing ➡️](./03-var-let-const-shadowing.md)
