# KPI 03 — Scope, Hoisting & Temporal Dead Zone (TDZ)

[⬅️ KPI 02 — Functions](../02-Functions-Deep-Dive/README.md) | [📚 JavaScript Index](../README.md) | [KPI 04 — Execution Context & Call Stack ➡️](../04-Execution-Context-Call-Stack/README.md)

---

## Overview

Scope, Hoisting, the Temporal Dead Zone (TDZ), Closures, Execution Contexts, `this` Binding, Memory Retention, Scope Chain Name Resolution, Scope Boundaries, Binding Semantics, and Variable Shadowing form the foundational identifier-resolution, variable-lifecycle, and runtime-execution mechanics of JavaScript. This module covers how JavaScript engines analyze lexical structures, allocate environment records on the Call Stack and Heap, hoist bindings during compilation, enforce initialization temporal boundaries, manage variable shadowing, execute escaping closures, evaluate contextual receivers, isolate module and request scopes, and prevent production memory leaks.

---

## 🗺️ Module Architecture & Navigation

| Part | Title | Document | Key Architectural Concepts | Status |
|---|---|---|---|---|
| **Part 1** | Scope Fundamentals, Lexical Scope & Scope Chain | [01-scope-fundamentals-lexical-scope-chain.md](./01-scope-fundamentals-lexical-scope-chain.md) | Global, function, and block boundaries, declarative environment records, identifier lookup, nearest-match shadowing | 🟢 Complete |
| **Part 2** | Hoisting & Temporal Dead Zone (TDZ) | [02-hoisting-temporal-dead-zone.md](./02-hoisting-temporal-dead-zone.md) | Declaration vs initialization phases, `var` vs `let`/`const`, uninitialized slots, `ReferenceError` lifecycle | 🟢 Complete |
| **Part 3** | Shadowing, Scope Collisions & Nested Environments | [03-var-let-const-shadowing.md](./03-var-let-const-shadowing.md) | Variable shadowing, nearest-match resolution, illegal shadowing, TDZ shadowing, explicit domain naming | 🟢 Complete |
| **Part 4** | Closures — Captured Bindings & React Architecture | [04-closures-captured-bindings-memory-lifecycle.md](./04-closures-captured-bindings-memory-lifecycle.md) | Live variable bindings, Heap Context Records, GC reachability, React render closures, stale closures, `useCallback`, `AbortController` | 🟢 Complete |
| **Part 5** | Execution Contexts, Call Stack & Code Execution | [05-execution-contexts-call-stack.md](./05-execution-contexts-call-stack.md) | Global vs Function contexts, Creation vs Execution phases, Call Stack LIFO, Stack frames vs Heap allocations, recursion limits | 🟢 Complete |
| **Part 6** | `this` Binding, Execution Context Receivers & Invocations | [06-this-binding-execution-context-receivers.md](./06-this-binding-execution-context-receivers.md) | Method calls vs plain calls, `call`/`apply`/`bind`, `new` constructor pipeline, arrow lexical `this`, method extraction | 🟢 Complete |
| **Part 7** | Closures, Memory Retention, GC & Leaks | [07-closures-memory-retention-gc-leaks.md](./07-closures-memory-retention-gc-leaks.md) | GC reachability, Young vs Old generation, event listener & timer leaks, detached DOM, `WeakMap`/`WeakRef`, DevTools Heap Snapshots | 🟢 Complete |
| **Part 8** | `this`, Execution Context Binding & Function Invocation | [08-this-execution-context-binding-invocation.md](./08-this-execution-context-binding-invocation.md) | Method invocation semantics, ES module strictness, arrow lexical `this`, class prototype methods vs field arrows, bound dispatchers | 🟢 Complete |
| **Part 9** | Closures, Lexical Environments & Memory Retention | [09-closures-lexical-environments-memory-retention.md](./09-closures-lexical-environments-memory-retention.md) | Live environment slot mutation, render snapshots, functional updaters, `useRef` state tunnels, async `var`/`let` loop closures | 🟢 Complete |
| **Part 10** | Scope Chain, Shadowing & Name Resolution | [10-scope-chain-shadowing-name-resolution.md](./10-scope-chain-shadowing-name-resolution.md) | Nearest-match resolution, Call Stack vs Scope Chain, illegal shadowing syntax errors, module scope isolation in SSR, V8 `LdaContextSlot` | 🟢 Complete |
| **Part 11** | Block, Function & Module Scope Boundaries | [11-block-function-module-scope-boundaries.md](./11-block-function-module-scope-boundaries.md) | Block scope boundaries, `var` leakage, loop per-iteration environments, ES Module isolation, SSR request safety, scope vs object lifetime | 🟢 Complete |
| **Part 12** | `var`, `let`, and `const` Binding Semantics & TDZ | [12-var-let-const-binding-semantics-tdz.md](./12-var-let-const-binding-semantics-tdz.md) | Binding vs value immutability, `TheHole` TDZ sentinel in V8, mandatory `const` initializers, redeclaration rules, structured cloning | 🟢 Complete |
| **Part 13** | Lexical Scope, Scope Chain & Identifier Resolution | [13-lexical-scope-chain-identifier-resolution.md](./13-lexical-scope-chain-identifier-resolution.md) | Static lexical scope, nearest-match halting, TDZ shadowing traps, Call Stack vs Scope Chain, identifier vs property lookups | 🟢 Complete |
| **Part 14** | Shadowing — Collisions, Isolation & Debugging | [14-shadowing-binding-collisions-debugging.md](./14-shadowing-binding-collisions-debugging.md) | Callback parameter shadowing (`user.id === user.id`), TDZ shadowing traps, domain role naming, import aliasing, V8 slot indexing | 🟢 Complete |

---

## 📁 Runnable Code Examples (`examples/`)

- [`examples/01-scope-fundamentals-lexical-scope-chain.js`](./examples/01-scope-fundamentals-lexical-scope-chain.js): Demonstrates lexical scope vs call-site resolution, scope chain nearest-match resolution, block scope isolation and `ReferenceError` protection, independent factory scopes, and multi-tenant configuration resolvers.
- [`examples/02-hoisting-temporal-dead-zone.js`](./examples/02-hoisting-temporal-dead-zone.js): Demonstrates let TDZ ReferenceError, var undefined hoisting, shadowing inside TDZ, function declarations vs var (TypeError) vs const (ReferenceError) expressions, and immutable session state managers.
- [`examples/03-var-let-const-shadowing.js`](./examples/03-var-let-const-shadowing.js): Demonstrates shadowing inside TDZ, basic function shadowing, lexical scope vs caller execution context, legal block shadowing, and multi-layer state synchronizers.
- [`examples/04-closures-captured-bindings-memory-lifecycle.js`](./examples/04-closures-captured-bindings-memory-lifecycle.js): Demonstrates closures capturing live bindings, independent factory closure states, live mutation vs snapshots, memory leak prevention via primitive destructuring, and abortable event pollers.
- [`examples/05-execution-contexts-call-stack.js`](./examples/05-execution-contexts-call-stack.js): Demonstrates Call Stack LIFO execution order, independent execution contexts per invocation, closure survival after stack frame pop, recursive stack unwinding, and non-blocking task chunking.
- [`examples/06-this-binding-execution-context-receivers.js`](./examples/06-this-binding-execution-context-receivers.js): Demonstrates method extraction receiver loss, arrow functions in object literals, `bind()` permanent locking, `new` instantiation, and telemetry event broadcasters.
- [`examples/07-closures-memory-retention-gc-leaks.js`](./examples/07-closures-memory-retention-gc-leaks.js): Demonstrates independent factory closures, shared multi-method closure state, anonymous listener removal failure, strong Map vs WeakMap, and abortable stream managers.
- [`examples/08-this-execution-context-binding-invocation.js`](./examples/08-this-execution-context-binding-invocation.js): Demonstrates method extraction context loss, plain calls in ES modules, arrow in object literals, `bind()` immutability, class callback loss, and multi-channel broadcasters.
- [`examples/09-closures-lexical-environments-memory-retention.js`](./examples/09-closures-lexical-environments-memory-retention.js): Demonstrates live variable slot mutations, independent factory closures, shared multi-method state, async `var` vs `let` loop closures, and stream aggregators with ref tunnels.
- [`examples/10-scope-chain-shadowing-name-resolution.js`](./examples/10-scope-chain-shadowing-name-resolution.js): Demonstrates static lexical scope vs dynamic call stack, basic nested shadowing, caller independence, shadowing vs mutation, returned function traversal, and hierarchical scope resolvers.
- [`examples/11-block-function-module-scope-boundaries.js`](./examples/11-block-function-module-scope-boundaries.js): Demonstrates `var` in block vs `let`/`const` block isolation, block scope shadowing, `var` control block leakage, loop per-iteration bindings, and scope boundary engines.
- [`examples/12-var-let-const-binding-semantics-tdz.js`](./examples/12-var-let-const-binding-semantics-tdz.js): Demonstrates binding immutability vs object mutation, `var` undefined hoisting, block-level TDZ errors, loop per-iteration bindings with `let`, and immutable state managers with deep freezing.
- [`examples/13-lexical-scope-chain-identifier-resolution.js`](./examples/13-lexical-scope-chain-identifier-resolution.js): Demonstrates static lexical definition vs caller context, basic shadowing, TDZ shadowing blocking fallback, nested closures traversal, and telemetry context resolvers.
- [`examples/14-shadowing-binding-collisions-debugging.js`](./examples/14-shadowing-binding-collisions-debugging.js): Demonstrates TDZ shadowing blocking fallback, callback parameter shadowing self-comparison bugs, shadowing vs reassignment, deeply nested closure resolution, and permission resolvers.

---

## 🧭 Industry Badges & Evaluation Guide

- 🟢 **[Daily Driver]**: Core mental models used constantly in day-to-day frontend development.
- 🟡 **[Moderate]**: Intermediate patterns used for specialized SDK configuration, architecture, and code reviews.
- 🔵 **[Foundational / Engine Internals]**: V8 engine internals, AST scope analysis, memory context lifting, and Staff-level concepts.
