# KPI 13 — `async` / `await` & Modern Asynchronous Control Flow

[⬅️ KPI 12 — Promises & Concurrency](../12-Promises-Concurrency/README.md) | [📚 JavaScript Index](../README.md) | [KPI 14 — Event Loop & Microtasks ➡️](../14-Event-Loop-Microtasks/README.md)

---

## Overview

The `async` / `await` syntax provides declarative, synchronous-like ergonomics for authoring asynchronous JavaScript code without compromising non-blocking performance. While `async` / `await` significantly simplifies asynchronous control flow, it does **not** replace the underlying Promise abstraction. Under the hood, `async` functions operate as Generator Coroutines compiled over Promises and scheduled via the Event Loop's Microtask Queue.

This master module provides an exhaustive, production-grade guide to `async` function execution mechanics, `await` suspension and continuation scheduling, structured `try` / `catch` / `finally` error boundaries, async iterations (`for await...of`), async waterfalls vs concurrent orchestration, and enterprise error architecture.

---

## 🗺️ Module Architecture & Navigation

| Part | Title | Document | Key Architectural Focus | Status |
|---|---|---|---|---|
| **Part 1** | The Mental Model, `async` Functions & `await` Mechanics | [01-async-await-mental-model.md](./01-async-await-mental-model.md) | Coroutine mental model, synchronous entry boundary, suspension vs non-blocking thread, waterfall elimination | 🟢 Complete |
| **Part 2** | Error Handling with `try` / `catch` / `finally` | [02-async-await-error-handling.md](./02-async-await-error-handling.md) | `try/catch` boundaries, rejection-to-throw conversion, `return await` nuances, cleanup invariants | 🟢 Complete |
| **Part 3** | Sequential vs Concurrent Execution & Waterfalls | [03-sequential-vs-concurrent-waterfalls.md](./03-sequential-vs-concurrent-waterfalls.md) | Dependency graphs, `Promise.all` with `await`, `Promise.allSettled`, bounded worker queues | 🟢 Complete |
| **Part 4** | Async Iteration, Loops & `for await...of` | [04-async-iteration-loops.md](./04-async-iteration-loops.md) | `for await...of`, `async function*`, `ReadableStream`, pull backpressure, cursor pagination | 🟢 Complete |
| **Part 5** | Real-World Fetch, Cancellation, Timeouts & Race Conditions | [05-advanced-patterns-toplevel-await.md](./05-advanced-patterns-toplevel-await.md) | `fetch()`, `response.ok`, `AbortController`, search race conditions, timeouts, React unmount | 🟡 Upcoming |

---

## 📁 Runnable Code Examples (`examples/`)

- [`examples/01-async-await-mental-model.js`](./examples/01-async-await-mental-model.js): Demonstrates synchronous entry execution before the first `await` vs post-`await` microtask continuations, parallel `Promise.all` execution eliminating async waterfalls, `await 42` primitive unboxing, and a standalone generator-to-async coroutine runner (`asyncToGenerator`).
- [`examples/02-async-await-error-handling.js`](./examples/02-async-await-error-handling.js): Demonstrates `return await` inside `try/catch` vs raw Promise return (bypassing local catch), silent `undefined` error swallowing vs explicit typed fallbacks, `finally` return override hazards, and a Go-style result tuple adapter (`toAsync`).
- [`examples/03-sequential-vs-concurrent-waterfalls.js`](./examples/03-sequential-vs-concurrent-waterfalls.js): Demonstrates `forEach(async)` callback ignoring traps vs `for...of` vs `Promise.all(map)`, array order preservation in `Promise.all`, and a standalone bounded concurrency pool (`mapConcurrent`).
- [`examples/04-async-iteration-loops.js`](./examples/04-async-iteration-loops.js): Demonstrates direct `await generator()` trap vs progressive `for await...of`, early loop `break` triggering `try...finally` resource cleanup, and a paginated REST API async generator.

---

## 🧭 Industry Badges & Evaluation Guide

- 🟢 **[Daily Driver]**: Core mental models used constantly in day-to-day frontend development.
- 🟡 **[Moderate]**: Intermediate patterns used for specialized SDK configuration, architecture, and code reviews.
- 🔵 **[Foundational / Engine Internals]**: V8 engine internals, AST scope analysis, memory context lifting, and Staff-level concepts.
- 🔴 **[Production-Critical]**: High-risk failure modes, race conditions, memory leaks, and fatal runtime crashes.
