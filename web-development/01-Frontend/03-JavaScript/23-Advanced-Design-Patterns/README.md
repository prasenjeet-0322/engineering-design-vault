# KPI 17 / 23 — Advanced JavaScript Patterns & Code Architecture

[⬅️ KPI 16 — Browser APIs & Web Platform](../16-Events-Delegation/README.md) | [📚 JavaScript Index](../README.md) | [KPI 18 — Browser Storage & Security ➡️](../18-Browser-Storage-Security/README.md)

---

## Overview

Writing working JavaScript is only the beginning of senior frontend engineering. As applications grow in complexity, scale, and team size, codebases must be architected to remain **maintainable, testable, composable, decoupled, and resilient to change**.

This master module provides an exhaustive, production-grade guide to modular system design, separation of concerns (UI $\to$ Application Services $\to$ Domain Rules $\to$ Infrastructure), classical and functional design patterns (Factory, Strategy, Observer, Adapter, Command), pure functional architecture, state machines and reducers, event-driven systems, and error and performance architecture.

---

## 🗺️ Module Architecture & Navigation

| Part | Title | Document | Key Architectural Focus | Status |
|---|---|---|---|---|
| **Part 1** | Code Organization, Separation of Concerns & Composition | [01-code-organization-separation-of-concerns-composition.md](./01-code-organization-separation-of-concerns-composition.md) | Separation of concerns, High Cohesion, Low Coupling, Public API contracts, Orchestration vs Implementation, Dependency Injection | 🟢 Complete |
| **Part 2** | Design Patterns & Functional Architecture | [02-design-patterns-functional-architecture.md](./02-design-patterns-functional-architecture.md) | Factory, Strategy, Observer, Adapter, Command, Pure Functions, Immutability, Higher-Order Functions, Overengineering avoidance | 🟢 Complete |
| **Part 3** | State Architecture, State Machines, Reducers & Event-Driven Systems | [03-state-architecture-observability-performance.md](./03-state-architecture-observability-performance.md) | State taxonomy (UI, Server, URL, Persistent), Discriminated Union FSMs, Pure Reducers, Async Race Condition tracking | 🟢 Complete |
| **Part 4** | Error Architecture, Performance & Senior Decisions | [04-error-architecture-performance-senior-decisions.md](./04-error-architecture-performance-senior-decisions.md) | Error normalization layers, Performance & Memoization budgets, Duplication vs Abstraction tradeoffs | 🟡 Upcoming |

---

## 📁 Runnable Code Examples (`examples/`)

- [`examples/01-code-organization-composition-di.js`](./examples/01-code-organization-composition-di.js): Demonstrates private class field encapsulation isolation (`#`), functional composition pipelines, and a modular e-commerce checkout engine with Dependency Injection.
- [`examples/02-design-patterns-functional-architecture.js`](./examples/02-design-patterns-functional-architecture.js): Demonstrates the Strategy pattern dictionary vs monolithic `switch/case`, pure functions with structural sharing, and a composable email masking pipeline.
- [`examples/03-state-architecture-observability-performance.js`](./examples/03-state-architecture-observability-performance.js): Demonstrates Finite State Machine (FSM) transition modeling with invalid state rejection, and asynchronous search race condition protection using request sequence IDs.

---

## 🧭 Industry Badges & Evaluation Guide

- 🟢 **[Daily Driver]**: Core mental models used constantly in day-to-day frontend development.
- 🟡 **[Moderate]**: Intermediate patterns used for specialized SDK configuration, architecture, and code reviews.
- 🔵 **[Foundational / Engine Internals]**: V8 engine internals, AST scope analysis, memory context lifting, and Staff-level concepts.
- 🔴 **[Production-Critical]**: High-risk failure modes, race conditions, memory leaks, and fatal runtime crashes.
