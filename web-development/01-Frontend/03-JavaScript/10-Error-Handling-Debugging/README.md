# KPI 10 — Error Handling & Debugging

[⬅️ KPI 09 — Arrays & Functional Data Manipulation](../09-Arrays-Data-Manipulation/README.md) | [📚 JavaScript Index](../README.md) | [KPI 11 — Async Foundations ➡️](../11-Async-Foundations/README.md)

---

## Overview

Error handling and debugging are core engineering disciplines that separate brittle software from resilient, enterprise-grade applications.

This master curriculum provides an exhaustive deep dive into JavaScript Failure Taxonomies (Programmer vs. Runtime vs. System), Exception Lifecycle Mechanics (`throw`, `try`, `catch`, `finally`), Built-in vs. Custom Domain Error Hierarchies (`Error.cause`), Call Stack Unwinding, Unhandled Rejection Traps, Browser DevTools Mastery (Conditional Breakpoints, Logpoints, Source Maps), Asynchronous Event Loop Debugging, Production Telemetry Monitoring, Automated Error Path Testing, and Advanced Debugging Scenarios.

---

## 🗺️ Module Architecture & Navigation

| Part | Title | Document | Key Architectural Focus | Status |
|---|---|---|---|---|
| **Part 1** | Error Mental Model, Failure Taxonomy & `try`/`catch`/`finally` | [01-error-mental-model-taxonomy-try-catch-finally.md](./01-error-mental-model-taxonomy-try-catch-finally.md) | Failure taxonomy, async `try/catch` disconnect traps, `finally` control flow hijacking, and layered error translation | 🟢 Complete |
| **Part 2** | Custom Errors, Error Taxonomy, `cause` & Rethrowing | [02-error-objects-custom-errors-cause.md](./02-error-objects-custom-errors-cause.md) | Subclassing `AppError`, prototype chain restoration (`Object.setPrototypeOf`), `Error.cause` chaining, and telemetry serialization (`toJSON`) | 🟢 Complete |
| **Part 3** | Asynchronous Error Handling & Network Resilience | [03-async-error-handling-network-resilience.md](./03-async-error-handling-network-resilience.md) | `fetch()` resolution semantics, `response.ok`, search race conditions, `AbortController`, and exponential backoff with jitter | 🟢 Complete |
| **Part 4** | Browser DevTools & Systematic Debugging | [04-devtools-breakpoints-logpoints-sourcemaps.md](./04-devtools-breakpoints-logpoints-sourcemaps.md) | Conditional breakpoints, logpoints, call stack frame inspection, DOM mutation breakpoints, and source maps | 🟢 Complete |
| **Part 5** | Production Error Architecture & Telemetry | [05-production-monitoring-telemetry-sentry.md](./05-production-monitoring-telemetry-sentry.md) | Sentry / Datadog telemetry, non-recursive dispatchers, PII sanitization, error fingerprinting, and circuit breakers | 🟢 Complete |
| **Part 6** | Testing Error Paths & Failure Scenarios | [06-testing-error-paths-complete-architecture.md](./06-testing-error-paths-complete-architecture.md) | Unit testing thrown exceptions, rejected promise assertions, state reset invariants, and regression workflows | 🟢 Complete |
| **Part 7** | Advanced Debugging Scenarios & Stale State | [07-advanced-debugging-race-conditions-closures.md](./07-advanced-debugging-race-conditions-closures.md) | Stale closures, event loop microtask timing bugs, memory leaks, infinite render loops, and production-only issues | 🟡 Upcoming |

---

## 📁 Runnable Code Examples (`examples/`)

- [`examples/01-error-mental-model-taxonomy-try-catch-finally.js`](./examples/01-error-mental-model-taxonomy-try-catch-finally.js): Demonstrates async callback `try/catch` disconnect vs async/await fixes, `finally` return hijack hazard, `finally` execution guarantees, conditional catch re-throwing, and resilient HTTP client architectures.
- [`examples/02-error-objects-custom-errors-cause.js`](./examples/02-error-objects-custom-errors-cause.js): Demonstrates enterprise base `AppError` subclassing, prototype chain restoration, V8 stack trimming (`Error.captureStackTrace`), `Error.cause` causal chaining, non-enumerable JSON serialization (`toJSON`), and polymorphic error routing.
- [`examples/03-async-error-handling-network-resilience.js`](./examples/03-async-error-handling-network-resilience.js): Demonstrates `fetch()` HTTP 500 resolution vs network error rejection, search query race condition cancellation with `AbortController`, `Promise.all` vs `Promise.allSettled`, and resilient exponential backoff with jitter.
- [`examples/04-devtools-breakpoints-logpoints-sourcemaps.js`](./examples/04-devtools-breakpoints-logpoints-sourcemaps.js): Demonstrates advanced console diagnostics (`console.table`, `console.group`, `console.trace`, `console.time`), call stack origin tracing, invariant assertion engines, and state telemetry engines.
- [`examples/05-production-monitoring-telemetry-sentry.js`](./examples/05-production-monitoring-telemetry-sentry.js): Demonstrates non-recursive telemetry dispatching, PII metadata sanitization, client-side error fingerprinting and deduplication, and Circuit Breaker state machines (`CLOSED` $\to$ `OPEN` $\to$ `HALF_OPEN`).
- [`examples/06-testing-error-paths-complete-architecture.js`](./examples/06-testing-error-paths-complete-architecture.js): Demonstrates synchronous thrown exception assertion, awaited async rejection validation, state invariant guarantees (preventing stuck loading flags), and multi-step retry recovery workflows.

---

## 🧭 Industry Badges & Evaluation Guide

- 🟢 **[Daily Driver]**: Core mental models used constantly in day-to-day frontend development.
- 🟡 **[Moderate]**: Intermediate patterns used for specialized SDK configuration, architecture, and code reviews.
- 🔵 **[Foundational / Engine Internals]**: V8 engine internals, AST scope analysis, memory context lifting, and Staff-level concepts.
- 🔴 **[Production-Critical]**: High-risk failure modes, race conditions, memory leaks, and fatal runtime crashes.
