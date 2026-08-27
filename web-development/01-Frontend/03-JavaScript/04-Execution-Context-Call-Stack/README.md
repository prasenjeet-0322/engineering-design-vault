# KPI 04 — Execution Context & Call Stack

[⬅️ KPI 03 — Scope, Hoisting & TDZ](../03-Scope-Hoisting-TDZ/README.md) | [📚 JavaScript Index](../README.md) | [KPI 05 — 'this' Keyword ➡️](../05-This-Keyword-Binding/README.md)

---

## Overview

The Execution Context and Call Stack constitute the core synchronous execution engine of JavaScript. This module covers the Global Execution Context (GEC), Function Execution Contexts (FEC), the 2-phase lifecycle (Creation Phase vs. Execution Phase), Call Stack LIFO mechanics, Stack Frames, recursion limits, Stack Overflow handling, and how synchronous execution coordinates with the broader JavaScript runtime and event loop.

---

## 🗺️ Module Architecture & Navigation

| Part | Title | Document | Key Architectural Concepts | Status |
|---|---|---|---|---|
| **Part 1** | The JavaScript Execution Model & Lifecycle | [01-javascript-execution-model-lifecycle.md](./01-javascript-execution-model-lifecycle.md) | Global vs Function Execution Contexts, Creation vs Execution phases, Call Stack LIFO, Stack Frames vs Heap Objects, React render execution cycles | 🟢 Complete |
| **Part 2** | Call Stack & Stack Frames — LIFO Execution | [02-call-stack-stack-frames-lifo.md](./02-call-stack-stack-frames-lifo.md) | Call stack LIFO pipeline, stack frame anatomy, caller suspension, stack unwinding exceptions, recursion limits & iterative trees | 🟢 Complete |
| **Part 3** | Execution Context Lifecycle & Binding Initialization | [03-creation-execution-phase-variables.md](./03-creation-execution-phase-variables.md) | Creation vs Execution Phase, parameter bindings, Function Declarations vs Arrow Expressions, `var` vs `let`/`const`, `typeof` in TDZ, reachability | 🟢 Complete |
| **Part 4** | `this` Binding — Call-Site Semantics & React Patterns | [04-this-binding-execution-context.md](./04-this-binding-execution-context.md) | Call-site receiver resolution, method extraction traps, arrow lexical `this`, `call`/`apply`/`bind` mechanics, class method callbacks, SDK receiver auto-binding | 🟢 Complete |
| **Part 5** | Strict Mode, Global Execution & ES Modules | [05-strict-mode-global-execution-modules.md](./05-strict-mode-global-execution-modules.md) | Strict mode plain calls (`this === undefined`), ES module automatic strictness, top-level `this`, accidental globals prevention, SSR multi-runtime guards | 🟢 Complete |
| **Part 6** | The Global Object, Global Scope & Top-Level Bindings | [06-global-object-scope-top-level-bindings.md](./06-global-object-scope-top-level-bindings.md) | Global Environment Records (Object vs Declarative), `globalThis` portability, ES Module isolation, SSR request safety, bounded LRU caches | 🟢 Complete |
| **Part 7** | Execution Context Internals & Lexical Environment Deep Dive | [07-execution-context-internals-lexical-environment.md](./07-execution-context-internals-lexical-environment.md) | Lexical Environment Records, Call Stack vs Scope Chain disconnect, mutable closure bindings vs snapshots, React stale closures, V8 Context allocation | 🟢 Complete |
| **Part 8** | Scope, Hoisting, TDZ & Binding Initialization Internals | [08-scope-hoisting-tdz-initialization-internals.md](./08-scope-hoisting-tdz-initialization-internals.md) | Binding Creation vs Initialization, `var` early initialization vs `let`/`const` TDZ, TDZ shadowing traps, Class TDZ, loop per-iteration environments, circular imports | 🟢 Complete |
| **Part 9** | The Event Loop, Web APIs, Tasks, Microtasks & Async | [09-event-loop-microtasks-macro-tasks.md](./09-event-loop-microtasks-macro-tasks.md) | Call Stack vs Event Loop, Task vs Microtask queues, `async/await` continuations, `AbortController` cancellation, async race condition guards, INP metrics | 🟢 Complete |
| **Part 10** | Closures, Memory Retention & Lexical Lifetime | [10-closures-memory-retention-lexical-lifetime.md](./10-closures-memory-retention-lexical-lifetime.md) | Closures as live binding retainers, V8 Heap Context lifting, React stale closure anatomy, `useRef` mutable pointers, GC reachability & `WeakMap` | 🟢 Complete |
| **Part 11** | Recursion, Recursive Call Frames & Stack Overflow | [11-recursion-call-frames-stack-overflow.md](./11-recursion-call-frames-stack-overflow.md) | Recursive Execution Contexts, Base Case invariants, Call Stack frame suspension/unwinding, Trampolining, Explicit Heap Stacks, React Fiber linked list | 🟢 Complete |

---

## 📁 Runnable Code Examples (`examples/`)

- [`examples/01-javascript-execution-model-lifecycle.js`](./examples/01-javascript-execution-model-lifecycle.js): Demonstrates Execution Context vs Scope Chain resolution, independent local context variables, synchronous nested invocations and caller pausing, distinct instance allocations, and a full Execution Context & Call Stack simulator.
- [`examples/02-call-stack-stack-frames-lifo.js`](./examples/02-call-stack-stack-frames-lifo.js): Demonstrates Call Stack LIFO vs static scope chain, nested call push/pop order, error stack unwinding, recursive base cases, and safe heap-backed iterative tree flatteners.
- [`examples/03-creation-execution-phase-variables.js`](./examples/03-creation-execution-phase-variables.js): Demonstrates function declaration instantiation, `typeof` TDZ violations, independent parameter bindings across invocations, TDZ in called functions, and execution lifecycle trackers.
- [`examples/04-this-binding-execution-context.js`](./examples/04-this-binding-execution-context.js): Demonstrates destructuring method extraction receiver loss, class method extraction in timers, same function with different receivers, object literal arrow traps, `.bind()` unique identities, and auto-bound event broadcasters.
- [`examples/05-strict-mode-global-execution-modules.js`](./examples/05-strict-mode-global-execution-modules.js): Demonstrates strict mode plain function `this === undefined`, property access on undefined TypeError, accidental global ReferenceError prevention, safe environment detection, and request context isolators.
- [`examples/06-global-object-scope-top-level-bindings.js`](./examples/06-global-object-scope-top-level-bindings.js): Demonstrates Global Declarative Record vs Object Record on `globalThis`, module top-level variable isolation, shared mutable module state, and bounded LRU caches with external store synchronization.
- [`examples/07-execution-context-internals-lexical-environment.js`](./examples/07-execution-context-internals-lexical-environment.js): Demonstrates live mutable closure bindings, lexical scope vs caller scope resolution, async stale closure simulations, and closure-based dependency injection service factories.
- [`examples/08-scope-hoisting-tdz-initialization-internals.js`](./examples/08-scope-hoisting-tdz-initialization-internals.js): Demonstrates `var` initialization to undefined vs `let` TDZ ReferenceError, TDZ shadowing traps, loop closures (`var` vs `let`), default parameter TDZ order, class TDZ, and module dependency pipelines.
- [`examples/09-event-loop-microtasks-macro-tasks.js`](./examples/09-event-loop-microtasks-macro-tasks.js): Demonstrates Promise microtask priority over `setTimeout(0)`, mixed task vs microtask interleaving, async/await synchronous start vs resumption, and race-free async pipelines with `AbortController`.
- [`examples/10-closures-memory-retention-lexical-lifetime.js`](./examples/10-closures-memory-retention-lexical-lifetime.js): Demonstrates independent factory closure environments, async closures reading mutated bindings, React render snapshot simulations, WeakMap GC lifecycle integration, and leak-proof subscription managers.
- [`examples/11-recursion-call-frames-stack-overflow.js`](./examples/11-recursion-call-frames-stack-overflow.js): Demonstrates Call Stack unwinding order, separate local activation states per invocation, indirect mutual recursion cycles, trampolined deep recursion, and safe heap-backed tree flatteners.

---

## 🧭 Industry Badges & Evaluation Guide

- 🟢 **[Daily Driver]**: Core mental models used constantly in day-to-day frontend development.
- 🟡 **[Moderate]**: Intermediate patterns used for specialized SDK configuration, architecture, and code reviews.
- 🔵 **[Foundational / Engine Internals]**: V8 engine internals, AST scope analysis, memory context lifting, and Staff-level concepts.
