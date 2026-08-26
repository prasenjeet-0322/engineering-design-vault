# KPI 09 — Functional Programming & Arrays

[⬅️ KPI 08 — Iterators, Iterables & Generators](../08-Iterators-Generators/README.md) | [📚 JavaScript Index](../README.md) | [KPI 10 — Error Handling & Debugging ➡️](../10-Error-Handling-Debugging/README.md)

---

## Overview

Functional Programming (FP) is the architectural backbone of modern frontend engineering—especially in React component models, Redux state reducers, Reselect memoized selectors, and declarative data transformation pipelines.

This module provides an exhaustive, senior-level deep dive into Pure Functions, Side-Effect Boundaries, Referential Transparency, Immutability & Structural Sharing, Higher-Order Functions, Declarative Array Pipelines (`map`, `filter`, `reduce`), Function Composition (`pipe`/`compose`), Currying & Partial Application, and Enterprise Functional Architectures.

---

## 🗺️ Module Architecture & Navigation

| Part | Title | Document | Key Architectural Focus | Status |
|---|---|---|---|---|
| **Part 1** | Foundations, Pure Functions & Referential Transparency | [01-functional-foundations-pure-functions-side-effects.md](./01-functional-foundations-pure-functions-side-effects.md) | Pure function rules ($f(x) = y$), side-effect anatomy, referential transparency, `const` mutation fallacy, and Functional Core/Imperative Shell | 🟢 Complete |
| **Part 2** | Immutability, Structural Sharing & State Updates | [02-immutability-structural-sharing-state-updates.md](./02-immutability-structural-sharing-state-updates.md) | In-place mutation vs value projection, nested shallow spread trap, structural sharing, ES2023 immutable array methods, and React reducers | 🟢 Complete |
| **Part 3** | First-Class Functions, HOFs & Closures | [03-higher-order-functions-closures-functional-design.md](./03-higher-order-functions-closures-functional-design.md) | Function references vs immediate invocation, callback inversion of control, function factories, predicate combinators, and validation engines | 🟢 Complete |
| **Part 4** | Declarative Data Transformation (`map`, `filter`, `reduce`) | [04-declarative-data-transformation-map-filter-reduce.md](./04-declarative-data-transformation-map-filter-reduce.md) | Semantic method matrix, $O(N^2)$ spread in `reduce` trap vs $O(N)$ local mutation, vacuous truth in `every()`, `flatMap()`, and pipelines | 🟢 Complete |
| **Part 5** | Function Composition, `compose()` & `pipe()` | [05-function-composition-pipelines.md](./05-function-composition-pipelines.md) | Unary arity rules, `pipe` vs `compose`, `tap` spying combinator, `pipeAsync` async flow, and API $\to$ ViewModel normalization pipelines | 🟢 Complete |
| **Part 6** | Currying, Partial Application & Function Specialization | [06-currying-partial-application.md](./06-currying-partial-application.md) | Staged argument configuration, Data-Last conventions, generic `curry()` arity tracking, and enterprise RBAC permission engines | 🟢 Complete |
| **Part 7** | Advanced Functional Concepts (Lazy, Memoize, Recursion & Monads) | [07-advanced-functional-concepts-memoization-error-handling.md](./07-advanced-functional-concepts-memoization-error-handling.md) | Lazy thunks, bounded LRU memoization caches, recursive tree processing, `Result<T, E>` monadic error flows, and Functional Core/Imperative Shell | 🟢 Complete |

---

## 📁 Runnable Code Examples (`examples/`)

- [`examples/01-functional-foundations-pure-functions-side-effects.js`](./examples/01-functional-foundations-pure-functions-side-effects.js): Demonstrates the in-place `.sort()` mutation trap vs pure `.toSorted()` projections, object argument mutation avoidance, dependency injection for deterministic clocks, referential transparency substitution, and functional core checkout engines.
- [`examples/02-immutability-structural-sharing-state-updates.js`](./examples/02-immutability-structural-sharing-state-updates.js): Demonstrates the nested shallow spread mutation trap, structural sharing integrity on unchanged branches, ES2023 non-mutating array methods, `structuredClone` deep isolation, and workspace state reducers.
- [`examples/03-higher-order-functions-closures-functional-design.js`](./examples/03-higher-order-functions-closures-functional-design.js): Demonstrates function reference vs invocation timing in event handlers, function factory lexical isolation, pure strategy pattern calculators, function identity in Sets, and validation rule engines.
- [`examples/04-declarative-data-transformation-map-filter-reduce.js`](./examples/04-declarative-data-transformation-map-filter-reduce.js): Demonstrates $O(N^2)$ accumulator spread benchmark vs $O(N)$ local mutation, vacuous truth in `[].every()`, pipeline stage ordering optimization, `flatMap()` normalization, and financial transaction aggregators.
- [`examples/05-function-composition-pipelines.js`](./examples/05-function-composition-pipelines.js): Demonstrates multi-argument function arity failures inside `pipe()` without unary currying, `compose()` vs `pipe()` execution order, `tap()` debugging interceptors, `pipeAsync()` async execution, and product search pipelines.
- [`examples/06-currying-partial-application.js`](./examples/06-currying-partial-application.js): Demonstrates Data-First vs Data-Last pipeline composition, progressive multi-stage currying evaluation, generic `curry()` utility arity reflection, `fn.length` parameter quirks, and enterprise RBAC permission authorization engines.
- [`examples/07-advanced-functional-concepts-memoization-error-handling.js`](./examples/07-advanced-functional-concepts-memoization-error-handling.js): Demonstrates bounded LRU cache memoization vs unbounded leaks, lazy thunk evaluation, recursive tree calculations, monadic `Result` short-circuit chaining, and trampolined tail recursion.

---

## 🧭 Industry Badges & Evaluation Guide

- 🟢 **[Daily Driver]**: Core mental models used constantly in day-to-day frontend development.
- 🟡 **[Moderate]**: Intermediate patterns used for specialized SDK configuration, architecture, and code reviews.
- 🔵 **[Foundational / Engine Internals]**: V8 engine internals, AST scope analysis, memory context lifting, and Staff-level concepts.
