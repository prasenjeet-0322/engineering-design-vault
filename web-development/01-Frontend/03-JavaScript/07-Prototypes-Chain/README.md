# KPI 07 — Prototypes & Prototype Chain

[⬅️ KPI 06 — Objects & Internals](../06-Objects-Internals/README.md) | [📚 JavaScript Index](../README.md) | [KPI 08 — Closures ➡️](../08-Closures-Lexical-Environments/README.md)

---

## Overview

JavaScript is fundamentally a prototype-based language. Rather than copying class blueprints during instantiation, JavaScript objects delegate property lookups dynamically through an internal `[[Prototype]]` chain.

This module covers the prototype chain delegation pipeline, `[[Prototype]]` vs `Function.prototype`, property shadowing, `Object.create()`, prototype pollution vulnerabilities, constructor function mechanics, ES6 class desugaring, and V8 engine inline caching optimizations.

---

## 🗺️ Module Architecture & Navigation

| Part | Title | Document | Key Architectural Focus | Status |
|---|---|---|---|---|
| **Part 1** | Prototype Fundamentals, `[[Prototype]]`, Delegation & Lookup | [01-prototype-fundamentals-delegation-lookup.md](./01-prototype-fundamentals-delegation-lookup.md) | Internal `[[Prototype]]` slot, `Object.hasOwn` vs inherited properties, property shadowing, `Object.create(null)`, and prototype lookup algorithms | 🟢 Complete |
| **Part 2** | Function `.prototype`, Constructor Functions, `new` & Instance Linking | [02-function-prototype-constructors-new.md](./02-function-prototype-constructors-new.md) | Function `.prototype` vs `[[Prototype]]`, 5-step `new` construction algorithm, `instanceof` prototype chain traversal, and cross-realm array checks | 🟢 Complete |
| **Part 3** | `Object.create()`, Null-Prototypes & Safe Prototype Manipulation | [03-object-create-null-prototypes.md](./03-object-create-null-prototypes.md) | `Object.getPrototypeOf` reflection, `Object.create(null)` dictionaries, `setPrototypeOf` JIT hazards, non-writable shadowing rules, and scoped configs | 🟢 Complete |
| **Part 4** | Classes, `extends`, `super`, Instance vs Static & Prototype Internals | [04-classes-extends-super-internals.md](./04-classes-extends-super-internals.md) | ES6 class desugaring, Dual Prototype Chains of `extends`, `super()` TDZ mechanics, `#private` brand checks, and static factory deserializers | 🟢 Complete |

---

## 📁 Runnable Code Examples (`examples/`)

- [`examples/01-prototype-fundamentals-delegation-lookup.js`](./examples/01-prototype-fundamentals-delegation-lookup.js): Demonstrates property lookup delegation, property shadowing, prototype method execution with dynamic `this`, shared mutable prototype traps, null-prototype dictionary safety, and secure plugin registries.
- [`examples/02-function-prototype-constructors-new.js`](./examples/02-function-prototype-constructors-new.js): Demonstrates shared prototype method equality, `instanceof` invalidation after prototype reassignment, constructor return overrides, cross-realm `Array.isArray()` verification, and session entity managers.
- [`examples/03-object-create-null-prototypes.js`](./examples/03-object-create-null-prototypes.js): Demonstrates null-prototype dictionary safety, property descriptors in `Object.create()`, dynamic prototype mutation with `setPrototypeOf()`, non-writable prototype property shadowing restrictions, and scoped configuration managers.
- [`examples/04-classes-extends-super-internals.js`](./examples/04-classes-extends-super-internals.js): Demonstrates Dual Prototype Chains in `extends`, subclass initialization order traps, `super.method()` dynamic receiver preservation, `#private` field brand checks, and domain entity hierarchies.

---

## 🧭 Industry Badges & Evaluation Guide

- 🟢 **[Daily Driver]**: Core mental models used constantly in day-to-day frontend development.
- 🟡 **[Moderate]**: Intermediate patterns used for specialized SDK configuration, architecture, and code reviews.
- 🔵 **[Foundational / Engine Internals]**: V8 engine internals, AST scope analysis, memory context lifting, and Staff-level concepts.
