# KPI 14 — Event Loop & Task / Microtask Queues

[⬅️ KPI 13 — Async / Await](../13-Async-Await/README.md) | [📚 JavaScript Index](../README.md) | [KPI 15 — DOM Fundamentals ➡️](../15-DOM-Fundamentals/README.md)

---

## Overview
*Status: 🟡 Ready for Master Content & Evaluation.*

---

## 🎯 Learning Objectives
- The Architecture: Call Stack, Heap, Web APIs, Task Queue (Macrotasks), and Microtask Queue.
- The Event Loop Tick Algorithm: Run call stack to completion $\rightarrow$ Drain entire microtask queue $\rightarrow$ Render opportunity $\rightarrow$ Pick one macrotask $\rightarrow$ Repeat.
- Microtasks: `Promise.then`, `queueMicrotask()`, `MutationObserver`.
- Macrotasks: `setTimeout`, `setInterval`, `setImmediate` (Node), I/O, UI rendering events.
- Starving the render tree with infinite microtask loops.
