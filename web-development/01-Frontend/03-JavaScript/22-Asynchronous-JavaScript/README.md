# KPI 22 — Asynchronous JavaScript, Event Loop & Concurrency

[⬅️ KPI 21 — Classes & OOP](../21-Classes-OOP/README.md) | [📚 JavaScript Index](../README.md) | [KPI 23 — Advanced Design Patterns ➡️](../23-Advanced-Design-Patterns/README.md)

---

## Overview

Asynchronous JavaScript is the backbone of all modern frontend engineering. A senior engineer must understand not only high-level `async/await` syntax, but the underlying **runtime mechanics**: the single-threaded execution model, Call Stack LIFO frames, Web/Host APIs, Task (Macrotask) Queue, Microtask Queue draining, `requestAnimationFrame` render synchronization, and the Event Loop coordination algorithm.

This master module provides an exhaustive, production-grade guide to the JavaScript runtime architecture, Promise lifecycles, Promise combinators (`all`, `allSettled`, `race`, `any`), `async/await` generator transformations, error cascading, request cancellation, and non-blocking main-thread task slicing.

---

## 🗺️ Module Architecture & Navigation

| Part | Title | Document | Key Architectural Focus | Status |
|---|---|---|---|---|
| **Part 1** | The JavaScript Runtime, Call Stack, Web APIs & Event Loop | [01-runtime-call-stack-web-apis-event-loop.md](./01-runtime-call-stack-web-apis-event-loop.md) | Single-threaded model, Call Stack, Web APIs, Task vs Microtask queues, Event loop turns, Microtask starvation, Task chunking | 🟢 Complete |
| **Part 2** | Callbacks, Callback Hell & Promises Lifecycle | [02-callbacks-promises-then-catch-finally.md](./02-callbacks-promises-then-catch-finally.md) | Inversion of control, Callback hell, Promise states, `.then()`, `.catch()`, `.finally()`, Error propagation | 🟢 Complete |
| **Part 3** | Promise Chaining & Promise Combinators | [03-promise-chaining-combinators-concurrency.md](./03-promise-chaining-combinators-concurrency.md) | Promise chaining, `Promise.all()`, `Promise.allSettled()`, `Promise.race()`, `Promise.any()`, Fail-fast vs Resilient concurrency | 🟢 Complete |
| **Part 4** | `async` / `await` & Sequential vs Parallel Execution | [04-async-await-sequential-parallel-loops.md](./04-async-await-sequential-parallel-loops.md) | Generator desugaring, `await` microtask suspension, Sequential waterfalls vs `Promise.all`, Async loops (`for-of` vs `forEach`) | 🟢 Complete |
| **Part 5** | Production Async Patterns, `AbortController` & Race Conditions | [05-production-async-patterns-race-conditions.md](./05-production-async-patterns-race-conditions.md) | Request lifecycles, HTTP error boundaries, `AbortController`, Search race condition elimination, Exponential backoff + jitter | 🟢 Complete |

---

## 📁 Runnable Code Examples (`examples/`)

- [`examples/01-runtime-call-stack-web-apis-event-loop.js`](./examples/01-runtime-call-stack-web-apis-event-loop.js): Demonstrates microtask priority draining over task queues (`setTimeout(0)`), main-thread blocking delaying timers, complete mixed execution turn traces, and a non-blocking dataset chunk processor.
- [`examples/02-callbacks-promises-then-catch-finally.js`](./examples/02-callbacks-promises-then-catch-finally.js): Demonstrates synchronous executor execution vs asynchronous microtask `.then()` reactions, settling immutability invariants, return value propagation, error recovery via `.catch()`, and a complete Promise data pipeline with `.finally()`.
- [`examples/03-promise-chaining-combinators-concurrency.js`](./examples/03-promise-chaining-combinators-concurrency.js): Demonstrates `Promise.all()` fail-fast background task continuation, `Promise.race()` vs `Promise.any()` settling differences, `.finally()` value pass-through invariants, and a resilient multi-widget dashboard aggregator.
- [`examples/04-async-await-sequential-parallel-loops.js`](./examples/04-async-await-sequential-parallel-loops.js): Demonstrates `Array.prototype.forEach(async)` non-awaiting bugs vs `for...of`, sequential request waterfall latency vs parallel `Promise.all()`, and a bounded concurrency batch pool processor.
- [`examples/05-production-async-patterns-race-conditions.js`](./examples/05-production-async-patterns-race-conditions.js): Demonstrates `fetch()` error normalization (`!response.ok`), search race condition cancellation with `AbortController`, `204 No Content` handling, and exponential backoff retry algorithms with full jitter.

---

## 🧭 Industry Badges & Evaluation Guide

- 🟢 **[Daily Driver]**: Core mental models used constantly in day-to-day frontend development.
- 🟡 **[Moderate]**: Intermediate patterns used for specialized SDK configuration, architecture, and code reviews.
- 🔵 **[Foundational / Engine Internals]**: V8 engine internals, AST scope analysis, memory context lifting, and Staff-level concepts.
- 🔴 **[Production-Critical]**: High-risk failure modes, race conditions, memory leaks, and fatal runtime crashes.
