# KPI 11 — Asynchronous JavaScript Foundations

[⬅️ KPI 10 — Error Handling & Debugging](../10-Error-Handling-Debugging/README.md) | [📚 JavaScript Index](../README.md) | [KPI 12 — Promises & Concurrency ➡️](../12-Promises-Concurrency/README.md)

---

## Overview

Asynchronous programming is the architectural bedrock of modern web applications. Because the JavaScript engine operates as a single-threaded runtime sharing the main execution thread with the browser's UI rendering pipeline, understanding how to initiate operations without blocking the Call Stack separates responsive, resilient software from janky, unresponsive user interfaces.

This master module provides an exhaustive breakdown of Synchronous vs. Asynchronous execution mechanics, Host Runtime and Web API architectures (V8 Call Stack vs. Browser C++ subsystems), Timer mechanics (`setTimeout`, `setInterval`), Minimum Clamping rules, Callback Inversion of Control, and Non-Blocking Time-Slicing schedulers.

---

## 🗺️ Module Architecture & Navigation

| Part | Title | Document | Key Architectural Focus | Status |
|---|---|---|---|---|
| **Part 1** | The Fundamental Model: Synchronous vs Asynchronous Execution | [01-sync-vs-async-execution-model.md](./01-sync-vs-async-execution-model.md) | Run-to-completion rule, main-thread blocking, Web API boundaries, `setTimeout(0)` turn scheduling, and time-slicing | 🟢 Complete |
| **Part 2** | Timers, Callback Scheduling & Cancellation | [02-timers-callback-scheduling-cancellation.md](./02-timers-callback-scheduling-cancellation.md) | `setTimeout`, `setInterval`, `clearTimeout`, timer drift, recursive `setTimeout` vs `setInterval`, and memory leaks | 🟡 Upcoming |

---

## 📁 Runnable Code Examples (`examples/`)

- [`examples/01-sync-vs-async-execution-model.js`](./examples/01-sync-vs-async-execution-model.js): Demonstrates `setTimeout(fn, 0)` Call Stack vs Macrotask Queue turn boundary, synchronous callbacks (`forEach`) vs asynchronous callbacks, minimum delay threshold blocking during heavy synchronous loops, multi-timer expiration ordering, and a standalone non-blocking time-sliced batch scheduler.

---

## 🧭 Industry Badges & Evaluation Guide

- 🟢 **[Daily Driver]**: Core mental models used constantly in day-to-day frontend development.
- 🟡 **[Moderate]**: Intermediate patterns used for specialized SDK configuration, architecture, and code reviews.
- 🔵 **[Foundational / Engine Internals]**: V8 engine internals, AST scope analysis, memory context lifting, and Staff-level concepts.
- 🔴 **[Production-Critical]**: High-risk failure modes, race conditions, memory leaks, and fatal runtime crashes.
