# KPI 10 — Error Handling & Debugging

[⬅️ KPI 09 — Arrays & Functional Data Manipulation](../09-Arrays-Data-Manipulation/README.md) | [📚 JavaScript Index](../README.md) | [KPI 11 — Async Foundations ➡️](../11-Async-Foundations/README.md)

---

## Overview

Error handling and debugging are core engineering disciplines that separate brittle software from resilient, enterprise-grade applications.

This master curriculum provides an exhaustive deep dive into JavaScript Failure Taxonomies (Programmer vs. Runtime vs. System), Exception Lifecycle Mechanics (`throw`, `try`, `catch`, `finally`), Built-in vs. Custom Domain Error Hierarchies (`Error.cause`), Call Stack Unwinding, Unhandled Rejection Traps, Browser DevTools Mastery (Conditional Breakpoints, Logpoints, Source Maps), Asynchronous Event Loop Debugging, and Production Telemetry Monitoring.

---

## 🗺️ Module Architecture & Navigation

| Part | Title | Document | Key Architectural Focus | Status |
|---|---|---|---|---|
| **Part 1** | Error Mental Model, Failure Taxonomy & `try`/`catch`/`finally` | [01-error-mental-model-taxonomy-try-catch-finally.md](./01-error-mental-model-taxonomy-try-catch-finally.md) | Failure taxonomy, async `try/catch` disconnect traps, `finally` control flow hijacking, and layered error translation | 🟢 Complete |
| **Part 2** | Custom Errors, Error Taxonomy, `cause` & Rethrowing | [02-error-objects-custom-errors-cause.md](./02-error-objects-custom-errors-cause.md) | Subclassing `AppError`, prototype chain restoration (`Object.setPrototypeOf`), `Error.cause` chaining, and telemetry serialization (`toJSON`) | 🟢 Complete |
| **Part 3** | Stack Traces, Propagation & Global Error Traps | [03-stack-traces-propagation-global-traps.md](./03-stack-traces-propagation-global-traps.md) | Call stack unwinding, `window.onerror`, `unhandledrejection`, and centralized telemetry pipelines | 🟡 Upcoming |
| **Part 4** | Browser DevTools Mastering & Breakpoints | [04-devtools-breakpoints-logpoints-sourcemaps.md](./04-devtools-breakpoints-logpoints-sourcemaps.md) | Conditional breakpoints, logpoints, DOM mutation breakpoints, watch expressions, and source maps | 🟡 Upcoming |
| **Part 5** | Debugging Asynchronous Code & Event Loop Failures | [05-debugging-async-event-loop-failures.md](./05-debugging-async-event-loop-failures.md) | Microtask queue rejections, async stack traces, un-awaited promises, and race condition debugging | 🟡 Upcoming |
| **Part 6** | Production Error Monitoring & Telemetry Architecture | [06-production-monitoring-telemetry-sentry.md](./06-production-monitoring-telemetry-sentry.md) | Sentry / Datadog integration, error sanitization, circuit breakers, and fault-tolerant UI degradation | 🟡 Upcoming |

---

## 📁 Runnable Code Examples (`examples/`)

- [`examples/01-error-mental-model-taxonomy-try-catch-finally.js`](./examples/01-error-mental-model-taxonomy-try-catch-finally.js): Demonstrates async callback `try/catch` disconnect vs async/await fixes, `finally` return hijack hazard, `finally` execution guarantees, conditional catch re-throwing, and resilient HTTP client architectures.
- [`examples/02-error-objects-custom-errors-cause.js`](./examples/02-error-objects-custom-errors-cause.js): Demonstrates enterprise base `AppError` subclassing, prototype chain restoration, V8 stack trimming (`Error.captureStackTrace`), `Error.cause` causal chaining, non-enumerable JSON serialization (`toJSON`), and polymorphic error routing.

---

## 🧭 Industry Badges & Evaluation Guide

- 🟢 **[Daily Driver]**: Core mental models used constantly in day-to-day frontend development.
- 🟡 **[Moderate]**: Intermediate patterns used for specialized SDK configuration, architecture, and code reviews.
- 🔵 **[Foundational / Engine Internals]**: V8 engine internals, AST scope analysis, memory context lifting, and Staff-level concepts.
- 🔴 **[Production-Critical]**: High-risk failure modes, race conditions, memory leaks, and fatal runtime crashes.
