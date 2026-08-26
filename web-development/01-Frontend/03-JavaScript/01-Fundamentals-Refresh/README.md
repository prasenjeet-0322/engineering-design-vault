# KPI 01 — JavaScript Fundamentals Refresh

[📚 JavaScript Index](../README.md) | [KPI 02 — Functions Deep Dive ➡️](../02-Functions-Deep-Dive/README.md)

---

## ⚡ Executive Overview & Architecture
KPI 01 establishes the core foundational mechanics of JavaScript as an interpreted/JIT-compiled runtime. It focuses on memory models (Stack vs Heap), execution bindings (`var`, `let`, `const`), the type system (7 primitives vs objects), explicit and implicit type coercion, value vs referential equality, and modern language features (destructuring, spread/rest, optional chaining, nullish coalescing).

---

## 🗺️ KPI 01 Conceptual Breakdown & Parts Index

| Part | Title | Master Guide | Key Engineering Concepts Covered | Status |
|---|---|---|---|---|
| **Part 1** | Variables, Values & Assignment | [01-variables-values-assignment.md](./01-variables-values-assignment.md) | Identifier binding, Stack vs Heap, `var`/`let`/`const`, Reassignment vs Mutation, React state bailout | 🟢 Complete |
| **Part 2** | Data Types & Type Behavior | [02-data-types-type-behavior.md](./02-data-types-type-behavior.md) | 7 Primitives, `typeof` operator quirks (`typeof null === 'object'`), Dynamic typing, Boxing | 🟢 Complete |
| **Part 3** | Primitives vs References & Identity | [03-primitives-references-identity.md](./03-primitives-references-identity.md) | Object identity, Shallow vs Deep copy, Structural Sharing, `Object.is()`, GC Reachability | 🟢 Complete |
| **Part 4** | Type Coercion & Implicit Operations | [04-type-coercion-conversion.md](./04-type-coercion-conversion.md) | `ToPrimitive`, `ToString`, `ToNumber`, `+` operator dual behavior, Coercion bugs | 🟢 Complete |
| **Part 5** | Equality, Operators & Truthiness | [05-equality-boolean-logic.md](./05-equality-boolean-logic.md) | `==` vs `===` coercion algorithm, `Object.is()`, `[] == ![]` coercion chain, React bailouts | 🟢 Complete |
| **Part 6** | Scope, Hoisting & the Temporal Dead Zone | [06-scope-hoisting-tdz.md](./06-scope-hoisting-tdz.md) | Binding lifecycle, TDZ mechanics, Lexical scope chain, Closures, React stale closures | 🟢 Complete |
| **Part 7** | Operators, Control Flow & Short-Circuiting | [07-modern-syntax-safe-access.md](./07-modern-syntax-safe-access.md) | `&&` vs `\|\|` vs `??`, `?.`, Short-circuit evaluation, Logical assignment, Guard clauses | 🟢 Complete |
| **Part 8** | KPI 1 Integration & Master Challenges | [08-integration-challenges.md](./08-integration-challenges.md) | Multi-concept active recall, senior interview questions, prediction challenges | 🟡 Upcoming |

---

## 📁 Runnable Code Examples (`examples/`)

- [`examples/01-variables-mutation-state.js`](./examples/01-variables-mutation-state.js): Demonstrates reference copying, shared mutation hazards, and mutable vs immutable state manager patterns.
- [`examples/02-data-types-boundary-normalizer.js`](./examples/02-data-types-boundary-normalizer.js): Demonstrates `typeof` inspection quirks, IEEE 754 float precision, and production-grade runtime API boundary normalization.
- [`examples/03-structural-sharing-immutable-state.js`](./examples/03-structural-sharing-immutable-state.js): Demonstrates shallow copy traps, `Object.is()` SameValue edge cases, and high-performance structural sharing state updates.
- [`examples/04-type-coercion-boundary-pipeline.js`](./examples/04-type-coercion-boundary-pipeline.js): Demonstrates multi-step coercion pipelines, truthiness traps, `||` vs `??` matrices, and custom `Symbol.toPrimitive` hooks.
- [`examples/05-equality-comparison-mechanics.js`](./examples/05-equality-comparison-mechanics.js): Demonstrates `===` vs `==` vs `Object.is()` comparison matrix, `[] == ![]` coercion, and React state bailout simulation.
- [`examples/06-scope-hoisting-closures.js`](./examples/06-scope-hoisting-closures.js): Demonstrates TDZ error catching, `var` vs `let` loop closures, and React stale closure simulation with functional fixes.
- [`examples/07-operators-short-circuit-evaluation.js`](./examples/07-operators-short-circuit-evaluation.js): Demonstrates `||` vs `??` zero-preservation, `&&` return operand short-circuiting, and defensive product pipelines.

---

## 🎯 Senior Interview Gotcha of the Module
> **The `const` Immutability Fallacy & React State Bailout:**  
> `const` locks variable bindings on the Stack Frame, preventing reassignment. It does **not** freeze the Heap memory of objects/arrays. In React, state updates rely on referential equality (`Object.is()`); mutating a `const` state object directly and passing it to `setState` causes React to bail out of rendering! Always produce fresh object references (`{ ...state }`).
