# KPI 14 / 20 — JavaScript Modules (ESM) & Modern Code Organization

[⬅️ KPI 13 — `async` / `await`](../13-Async-Await/README.md) | [📚 JavaScript Index](../README.md) | [KPI 21 — Classes & OOP ➡️](../21-Classes-OOP/README.md)

---

## Overview

JavaScript Modules (ESM) provide the fundamental boundary for code encapsulation, dependency management, and build optimization in modern frontend architecture. Rather than relying on global namespaces or legacy runtime loaders (CommonJS, AMD), ES Modules establish static, declarative dependency graphs analyzed at build time. Modules enable high-performance features including Live Bindings, Single-Evaluation singletons, dead-code elimination (Tree Shaking), and dynamic on-demand code splitting.

This master module provides an exhaustive, production-grade guide to module scopes, named vs default export strategies, live binding mechanics, barrel module performance pitfalls, dynamic `import()`, and enterprise feature-based module architectures.

---

## 🗺️ Module Architecture & Navigation

| Part | Title | Document | Key Architectural Focus | Status |
|---|---|---|---|---|
| **Part 1** | The Module System, Scope, `import` & `export` | [01-module-system-scope-import-export.md](./01-module-system-scope-import-export.md) | Module scope, named vs default exports, read-only live bindings, top-level side effects | 🟢 Complete |
| **Part 2** | Dynamic `import()`, Code Splitting & Tree Shaking | [02-module-loading-dynamic-imports-tree-shaking.md](./02-module-loading-dynamic-imports-tree-shaking.md) | Static AST analysis, dynamic on-demand loading, route splitting, tree-shaking dead code | 🟢 Complete |
| **Part 3** | Circular Dependencies, Module Resolution & Monorepos | [03-circular-dependencies-resolution-monorepos.md](./03-circular-dependencies-resolution-monorepos.md) | Cyclic module graphs, `TDZ` crashes during import, package resolution, barrel pitfalls | 🟡 Upcoming |
| **Part 4** | Feature-Based Architecture & Enterprise Boundaries | [04-feature-based-architecture-boundaries.md](./04-feature-based-architecture-boundaries.md) | Feature-Sliced Design (FSD), public API facades, lint boundary enforcement, monorepo packages | 🟡 Upcoming |

---

## 📁 Runnable Code Examples (`examples/`)

- [`examples/01-module-system-scope-import-export.mjs`](./examples/01-module-system-scope-import-export.mjs): Demonstrates live bindings mutation reflection across module boundaries, read-only imported variable constraints, private encapsulated scope isolation, and a feature-based public API facade.
- [`examples/01-counter-helper.mjs`](./examples/01-counter-helper.mjs): Supporting ESM helper providing live binding mutations and encapsulated private variables.
- [`examples/02-dynamic-imports-tree-shaking.mjs`](./examples/02-dynamic-imports-tree-shaking.mjs): Demonstrates dynamic `import()` module namespace inspection, eliminating dynamic import waterfalls with `Promise.all`, and a predictive prefetch cache loader.
- [`examples/02-lazy-math-plugin.mjs`](./examples/02-lazy-math-plugin.mjs): Supporting lazy plugin module loaded dynamically at runtime.

---

## 🧭 Industry Badges & Evaluation Guide

- 🟢 **[Daily Driver]**: Core mental models used constantly in day-to-day frontend development.
- 🟡 **[Moderate]**: Intermediate patterns used for specialized SDK configuration, architecture, and code reviews.
- 🔵 **[Foundational / Engine Internals]**: V8 engine internals, AST scope analysis, memory context lifting, and Staff-level concepts.
- 🔴 **[Production-Critical]**: High-risk failure modes, race conditions, memory leaks, and fatal runtime crashes.
