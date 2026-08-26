# KPI 13 — Async / Await & Error Handling

[⬅️ KPI 12 — Promises](../12-Promises-Concurrency/README.md) | [📚 JavaScript Index](../README.md) | [KPI 14 — Event Loop ➡️](../14-Event-Loop-Microtasks/README.md)

---

## Overview
*Status: 🟡 Ready for Master Content & Evaluation.*

---

## 🎯 Learning Objectives
- The syntactic sugar of `async`/`await` over Promises and Generators.
- Sequential waterfall anti-patterns (`await a; await b;`) vs concurrent execution (`Promise.all([a(), b()])`).
- Error handling with structured `try/catch` blocks and wrapper tuples.
- Async functions inside loops (`for...of` sequential vs `Promise.all(arr.map())` parallel vs `forEach` async bugs).
