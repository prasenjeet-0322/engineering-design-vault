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

---

## 📁 Runnable Code Examples (`examples/`)

- [`examples/01-functional-foundations-pure-functions-side-effects.js`](./examples/01-functional-foundations-pure-functions-side-effects.js): Demonstrates the in-place `.sort()` mutation trap vs pure `.toSorted()` projections, object argument mutation avoidance, dependency injection for deterministic clocks, referential transparency substitution, and functional core checkout engines.

---

## 🧭 Industry Badges & Evaluation Guide

- 🟢 **[Daily Driver]**: Core mental models used constantly in day-to-day frontend development.
- 🟡 **[Moderate]**: Intermediate patterns used for specialized SDK configuration, architecture, and code reviews.
- 🔵 **[Foundational / Engine Internals]**: V8 engine internals, AST scope analysis, memory context lifting, and Staff-level concepts.
