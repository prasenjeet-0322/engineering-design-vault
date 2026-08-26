# KPI 12 — Promises & Promise Concurrency

[⬅️ KPI 11 — Async Foundations](../11-Async-Foundations/README.md) | [📚 JavaScript Index](../README.md) | [KPI 13 — Async / Await ➡️](../13-Async-Await/README.md)

---

## Overview
*Status: 🟡 Ready for Master Content & Evaluation.*

---

## 🎯 Learning Objectives
- Promise States: `pending`, `fulfilled`, `rejected` (Settled state immutability).
- Method chaining: `.then()`, `.catch()`, `.finally()`, and return value unboxing.
- Error propagation and unhandled promise rejections.
- Promise Combinators:
  - `Promise.all()` (Fail-fast parallel)
  - `Promise.allSettled()` (Resilient inspection)
  - `Promise.race()` (First settled winner)
  - `Promise.any()` (First fulfilled winner)
