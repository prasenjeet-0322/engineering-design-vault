# KPI 24 — JavaScript Performance & Profiling Architecture

[⬅️ KPI 23 — Advanced Design Patterns](../23-Advanced-Design-Patterns/README.md) | [📚 JavaScript Index](../README.md) | [🏁 KPI 25 — Graduation Project ➡️](../25-Graduation-Project/README.md)

---

## Overview

High-performance JavaScript engineering is not simply about micro-optimizing algorithms; it requires a deep, mechanical understanding of the **Browser Rendering Pipeline**, Main-Thread scheduling budgets, C++ DOM engine crossing, Forced Synchronous Layouts, Long Tasks ($>50\text{ms}$), Web Workers, and DevTools CPU/Memory profiling.

This master module provides an exhaustive, production-grade guide to diagnosing, measuring, and eliminating frontend performance bottlenecks, layout thrashing, frame drops, and memory leaks.

---

## 🗺️ Module Architecture & Navigation

| Part | Title | Document | Key Architectural Focus | Status |
|---|---|---|---|---|
| **Part 1** | The Browser Performance Mental Model & Expensive DOM Operations | [01-browser-performance-mental-model-dom-operations.md](./01-browser-performance-mental-model-dom-operations.md) | Main thread budget ($16.67\text{ms}$ / $8.33\text{ms}$), DOM reads vs writes, `DocumentFragment`, DOM as View vs Database | 🟢 Complete |
| **Part 2** | DOM Batching & Layout Thrashing | [02-dom-batching-layout-thrashing.md](./02-dom-batching-layout-thrashing.md) | Forced synchronous layout, FastDOM architecture, Read/Write phase separation, Reflow triggers, GPU transforms | 🟢 Complete |
| **Part 3** | Reflow, Repaint & The Complete Rendering Pipeline | [03-reflow-repaint-rendering-pipeline.md](./03-reflow-repaint-rendering-pipeline.md) | Layout vs Paint vs Compositing, CSS containment (`contain`), `will-change` VRAM tradeoffs, `content-visibility` | 🟢 Complete |
| **Part 4** | Event Listener Performance & Event Delegation | [04-event-listener-performance-delegation.md](./04-event-listener-performance-delegation.md) | Passive event listeners (`{ passive: true }`), Event delegation scalability, Memory footprint | 🟡 Upcoming |
| **Part 5** | Long Tasks & Main-Thread Non-Blocking Execution | [05-long-tasks-main-thread-blocking.md](./05-long-tasks-main-thread-blocking.md) | Total Blocking Time (TBT), Interaction to Next Paint (INP), Time-slicing (`scheduler.yield()`) | 🟡 Upcoming |
| **Part 6** | Web Workers & Off-Main-Thread Multi-Threading | [06-web-workers-multi-threading.md](./06-web-workers-multi-threading.md) | Dedicated workers, Structured clone algorithm, `postMessage`, Comlink RPC, OffscreenCanvas | 🟡 Upcoming |
| **Part 7** | Performance Profiling & Diagnosing Slow Features | [07-performance-profiling-diagnostics.md](./07-performance-profiling-diagnostics.md) | Chrome DevTools flamecharts, Heap snapshots, Detached DOM tree leaks, Allocation timelines | 🟡 Upcoming |

---

## 📁 Runnable Code Examples (`examples/`)

- [`examples/01-browser-performance-mental-model-dom-operations.js`](./examples/01-browser-performance-mental-model-dom-operations.js): Demonstrates simulated layout thrashing reflow count vs batched read-then-write phase separation, in-memory filtering benchmarks vs DOM traversal, and a standalone microtask batch scheduler.
- [`examples/02-dom-batching-layout-thrashing.js`](./examples/02-dom-batching-layout-thrashing.js): Demonstrates clean read vs dirty read forced reflow counts, equal-height card loop thrashing vs phase-separated batching, and a FastDOM priority task scheduler.
- [`examples/03-reflow-repaint-rendering-pipeline.js`](./examples/03-reflow-repaint-rendering-pipeline.js): Demonstrates pipeline stage classification (Layout vs Paint vs Composite), `will-change` VRAM memory allocation calculations, and CSS containment subtree reflow isolation.

---

## 🧭 Industry Badges & Evaluation Guide

- 🟢 **[Daily Driver]**: Core mental models used constantly in day-to-day frontend development.
- 🟡 **[Moderate]**: Intermediate patterns used for specialized SDK configuration, architecture, and code reviews.
- 🔵 **[Foundational / Engine Internals]**: V8 engine internals, AST scope analysis, memory context lifting, and Staff-level concepts.
- 🔴 **[Production-Critical]**: High-risk failure modes, race conditions, memory leaks, and fatal runtime crashes.
