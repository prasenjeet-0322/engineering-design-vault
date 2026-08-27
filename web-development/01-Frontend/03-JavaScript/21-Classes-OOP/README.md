# KPI 21 — Classes & Object-Oriented JavaScript (OOP)

[⬅️ KPI 20 — Modules ESM](../20-Modules-ESM/README.md) | [📚 JavaScript Index](../README.md) | [KPI 22 — Memory & GC ➡️](../22-Memory-Garbage-Collection/README.md)

---

## Overview

Classes in JavaScript provide a clean, declarative syntax for object-oriented programming, built directly on top of JavaScript's prototypal inheritance engine. Rather than replacing prototypes, ES6 classes structure constructor definitions, prototype method delegation, private field encapsulation (`#field`), static utilities, and inheritance (`extends`, `super()`). Mastering classes requires understanding the 4-step `new` lifecycle, memory implications of prototype methods vs class fields, `this` execution context binding, and knowing when to choose Object Composition over deep class hierarchies.

This master module provides an exhaustive, production-grade guide to class blueprints, constructor mechanics, instance vs prototype memory layout, hard private fields, static members, class inheritance, polymorphism, and senior-level architectural tradeoffs.

---

## 🗺️ Module Architecture & Navigation

| Part | Title | Document | Key Architectural Focus | Status |
|---|---|---|---|---|
| **Part 1** | Why Classes Exist, Constructors & Instances | [01-why-classes-exist-constructors-instances.md](./01-why-classes-exist-constructors-instances.md) | Prototypal syntactic sugar, 4-step `new` lifecycle, Constructors, Instance properties vs Prototype methods, Arrow function memory traps, TDZ | 🟢 Complete |
| **Part 2** | Static Methods, Private Fields `#`, Getters & Setters | [02-static-methods-private-fields-getters-setters.md](./02-static-methods-private-fields-getters-setters.md) | Static members, Hard private fields (`#`), Encapsulation, Accessors (`get`/`set`), Validation | 🟡 Upcoming |
| **Part 3** | Inheritance, `extends`, `super()` & Polymorphism | [03-inheritance-extends-super-polymorphism.md](./03-inheritance-extends-super-polymorphism.md) | Prototype chain delegation in `extends`, `super()` constructor calls, Method overriding, Polymorphism | 🟡 Upcoming |
| **Part 4** | Composition vs Inheritance & Senior OOP Architecture | [04-composition-vs-inheritance-oop-architecture.md](./04-composition-vs-inheritance-oop-architecture.md) | Fragile base class problem, Composition over inheritance, Classes vs Factory functions, Decision matrix | 🟡 Upcoming |

---

## 📁 Runnable Code Examples (`examples/`)

- [`examples/01-why-classes-exist-constructors-instances.js`](./examples/01-why-classes-exist-constructors-instances.js): Demonstrates prototype method sharing vs arrow function field memory allocation, extracted method `this` context loss in class strict mode, constructor return object overrides, and a stateful WebSocket manager class.

---

## 🧭 Industry Badges & Evaluation Guide

- 🟢 **[Daily Driver]**: Core mental models used constantly in day-to-day frontend development.
- 🟡 **[Moderate]**: Intermediate patterns used for specialized SDK configuration, architecture, and code reviews.
- 🔵 **[Foundational / Engine Internals]**: V8 engine internals, AST scope analysis, memory context lifting, and Staff-level concepts.
- 🔴 **[Production-Critical]**: High-risk failure modes, race conditions, memory leaks, and fatal runtime crashes.
