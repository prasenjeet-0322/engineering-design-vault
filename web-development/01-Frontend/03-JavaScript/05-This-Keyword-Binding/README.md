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

---

## 📁 Runnable Code Examples (`examples/`)

- [`examples/01-this-fundamental-mental-model-determination.js`](./examples/01-this-fundamental-mental-model-determination.js): Demonstrates multiple receivers for identical functions, method extraction context loss, object literal arrow scope traps, asynchronous timer receiver preservation, and auto-bound telemetry broadcaster classes.

---

## 🧭 Industry Badges & Evaluation Guide

- 🟢 **[Daily Driver]**: Core mental models used constantly in day-to-day frontend development.
- 🟡 **[Moderate]**: Intermediate patterns used for specialized SDK configuration, architecture, and code reviews.
- 🔵 **[Foundational / Engine Internals]**: V8 engine internals, AST scope analysis, memory context lifting, and Staff-level concepts.
