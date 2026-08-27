# KPI 08 — Iterators, Iterables & Generators

[⬅️ KPI 07 — Prototypes & Prototype Chain](../07-Prototypes-Chain/README.md) | [📚 JavaScript Index](../README.md) | [KPI 09 — Closures & Lexical Environments ➡️](../08-Closures-Lexical-Environments/README.md)

---

## Overview

The Iteration Protocol is one of JavaScript's most elegant core runtime abstractions. It completely decouples data structures (Arrays, Maps, Sets, Trees, DOM collections, Network streams) from traversal algorithms (`for...of`, spread syntax, destructuring, `Array.from()`).

This module provides an exhaustive breakdown of the iteration machinery: `Symbol.iterator`, the `IteratorResult` specification contract, iterator lifecycle cleanup (`return()`, `throw()`), Generator functions (`function*` and `yield`), two-way coroutine communication, `yield*` delegation, and Async Iterators (`Symbol.asyncIterator`, `for await...of`).

---

## 🗺️ Module Architecture & Navigation

| Part | Title | Document | Key Architectural Focus | Status |
|---|---|---|---|---|
| **Part 1** | Iteration Protocols, `Symbol.iterator` & `for...of` Internals | [01-iteration-protocols-symbol-iterator.md](./01-iteration-protocols-symbol-iterator.md) | Iterable vs Iterator protocols, `IteratorResult` (`{ value, done }`), Unicode string traversal, restartable iterables, and `take(n)` bounded streams | 🟢 Complete |
| **Part 2** | Iterator Lifecycle, `IteratorClose`, `break`, `return()` & Cleanup | [02-iterator-lifecycle-return-cleanup.md](./02-iterator-lifecycle-return-cleanup.md) | Normal vs abrupt completions, `IteratorClose` algorithm, `.return()` teardown hook, destructuring truncation, and safe resource management | 🟢 Complete |
| **Part 3** | Generator Functions, `yield`, Suspension & Two-Way Coroutines | [03-generator-functions-yield-coroutines.md](./03-generator-functions-yield-coroutines.md) | `function*` execution state machine, `yield` outbound/inbound mechanics, `.next(val)` input injection, `return` completion omissions, and wizard sagas | 🟢 Complete |
| **Part 4** | `yield*`, Generator Delegation, `return()`, `throw()` & `finally` | [04-yield-star-delegation-error-handling.md](./04-yield-star-delegation-error-handling.md) | Recursive tree traversals via `yield*`, capturing inner completion values, external termination via `.return()`, error injection via `.throw()`, and `finally` guarantees | 🟢 Complete |
| **Part 5** | Async Iterators, Async Generators & `for await...of` Streaming | [05-async-iterators-async-generators-streaming.md](./05-async-iterators-async-generators-streaming.md) | `Symbol.asyncIterator`, `async function*`, `for await...of` loops, Web Streams API, AI token streaming, backpressure, and async `try...finally` teardowns | 🟢 Complete |
| **Part 6** | Production Patterns, Lazy Pipelines, Architecture & Performance | [06-production-patterns-performance-architecture.md](./06-production-patterns-performance-architecture.md) | Lazy pipeline composition, avoiding accidental stream materialization, high-throughput AI token batching, controlled concurrency pools, and senior decision matrices | 🟢 Complete |

---

## 📁 Runnable Code Examples (`examples/`)

- [`examples/01-iteration-protocols-symbol-iterator.js`](./examples/01-iteration-protocols-symbol-iterator.js): Demonstrates stateful iterator exhaustion, restartable collection allocation, `undefined` yielding, Unicode emoji surrogate pair iteration, Map destructuring, and lazy paginated virtual feed engines.
- [`examples/02-iterator-lifecycle-return-cleanup.js`](./examples/02-iterator-lifecycle-return-cleanup.js): Demonstrates `break` and `return` triggering `iterator.return()` cleanup, destructuring truncation teardowns, post-closure `.next()` latching, and managed telemetry stream iterators.
- [`examples/03-generator-functions-yield-coroutines.js`](./examples/03-generator-functions-yield-coroutines.js): Demonstrates first `.next(arg)` value ignoring rules, interleaved suspension/resumption logging, two-way arithmetic coroutine pipelines, spread discarding return values, and interactive onboarding wizard sagas.
- [`examples/04-yield-star-delegation-error-handling.js`](./examples/04-yield-star-delegation-error-handling.js): Demonstrates capturing `yield*` return values, recursive tree traversal, `gen.return()` forcing `finally` cleanup, `gen.throw()` error injection and recovery, and hierarchical file system tree walkers.
- [`examples/05-async-iterators-async-generators-streaming.js`](./examples/05-async-iterators-async-generators-streaming.js): Demonstrates sequential async iteration latency, synchronous iterable promotion in `for await`, async `finally` teardown on loop break, and AI token streaming pipelines.
- [`examples/06-production-patterns-performance-architecture.js`](./examples/06-production-patterns-performance-architecture.js): Demonstrates lazy pipeline upstream halting, controlled concurrency pool execution, and high-throughput telemetry batching pipelines.

---

## 🧭 Industry Badges & Evaluation Guide

- 🟢 **[Daily Driver]**: Core mental models used constantly in day-to-day frontend development.
- 🟡 **[Moderate]**: Intermediate patterns used for specialized SDK configuration, architecture, and code reviews.
- 🔵 **[Foundational / Engine Internals]**: V8 engine internals, AST scope analysis, memory context lifting, and Staff-level concepts.
