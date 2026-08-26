# KPI 05 — `this` Keyword & Execution Binding

[⬅️ KPI 04 — Execution Context](../04-Execution-Context-Call-Stack/README.md) | [📚 JavaScript Index](../README.md) | [KPI 06 — Objects & Internals ➡️](../06-Objects-Internals/README.md)

---

## Overview

The `this` keyword represents one of the most fundamental yet commonly misunderstood mechanisms in JavaScript. Unlike lexical scope (which is determined statically by where code is written), `this` is evaluated dynamically based on the **call-site invocation pattern** for regular functions, or inherited statically from the enclosing lexical environment for arrow functions.

This module provides an exhaustive, senior-level breakdown across all invocation mechanisms: Default Binding, Implicit Method Binding, Explicit Binding (`call`, `apply`, `bind`), `new` Constructor Binding, Class Methods, Arrow Functions, and React Hook state paradigms.

---

## 🗺️ Module Architecture & Navigation

| Part | Title | Document | Key Architectural Focus | Status |
|---|---|---|---|---|
| **Part 1** | Fundamental Mental Model: How `this` Is Determined | [01-this-fundamental-mental-model-determination.md](./01-this-fundamental-mental-model-determination.md) | Call-site receiver resolution, method extraction traps, arrow lexical `this`, constructor `new` binding, and SDK callback auto-binding | 🟢 Complete |
| **Part 2** | Regular Function Invocation, Default `this` & Strict Mode | [02-regular-functions-global-strict-mode.md](./02-regular-functions-global-strict-mode.md) | Plain function calls, strict mode `undefined` vs sloppy global coercion, ES Module isolation, nested function `this` reset, and `globalThis` | 🟢 Complete |
| **Part 3** | Object Methods, Receiver Evaluation & Context Loss | [03-object-methods-receiver-context-loss.md](./03-object-methods-receiver-context-loss.md) | Method invocation vs property access, Reference Records, destructuring extraction traps, nested receivers, and comma operator stripping | 🟢 Complete |
| **Part 4** | Arrow Functions, Lexical `this` & Closure Boundaries | [04-arrow-functions-lexical-this.md](./04-arrow-functions-lexical-this.md) | Lexical `this` resolution, immunity to `.call()`/`.bind()`, object literal arrow traps, lack of `[[Construct]]`, and class field arrow tradeoffs | 🟢 Complete |

---

## 📁 Runnable Code Examples (`examples/`)

- [`examples/01-this-fundamental-mental-model-determination.js`](./examples/01-this-fundamental-mental-model-determination.js): Demonstrates multiple receivers for identical functions, method extraction context loss, object literal arrow scope traps, asynchronous timer receiver preservation, and auto-bound telemetry broadcaster classes.
- [`examples/02-regular-functions-global-strict-mode.js`](./examples/02-regular-functions-global-strict-mode.js): Demonstrates strict mode plain function `undefined` returns, nested regular function `this` reset, array method callback context loss with `thisArg`, and environment-safe multi-runtime configuration managers.
- [`examples/03-object-methods-receiver-context-loss.js`](./examples/03-object-methods-receiver-context-loss.js): Demonstrates destructuring method context loss, nested property receiver resolution, method reassignment between objects, comma operator Reference Record stripping, and auto-bound notification stream clients.
- [`examples/04-arrow-functions-lexical-this.js`](./examples/04-arrow-functions-lexical-this.js): Demonstrates `.call()`/`.bind()` immunity in arrow functions, lexical `this` preservation inside methods, object literal arrow traps, nested arrow pipelines, and metrics auto-poller engines.

---

## 🧭 Industry Badges & Evaluation Guide

- 🟢 **[Daily Driver]**: Core mental models used constantly in day-to-day frontend development.
- 🟡 **[Moderate]**: Intermediate patterns used for specialized SDK configuration, architecture, and code reviews.
- 🔵 **[Foundational / Engine Internals]**: V8 engine internals, AST scope analysis, memory context lifting, and Staff-level concepts.
