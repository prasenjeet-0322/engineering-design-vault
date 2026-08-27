# KPI 22 — Memory Management & Garbage Collection

[⬅️ KPI 21 — Classes & OOP](../21-Classes-OOP/README.md) | [📚 JavaScript Index](../README.md) | [KPI 23 — Design Patterns ➡️](../23-Advanced-Design-Patterns/README.md)

---

## Overview
*Status: 🟡 Ready for Master Content & Evaluation.*

---

## 🎯 Learning Objectives
- V8 Memory Architecture: Stack Memory (Primitives/Pointers) vs Heap Memory (Objects/Functions/Closures).
- Garbage Collection Algorithms: Generational GC (Scavenge/Young Gen vs Mark-Sweep-Compact/Old Gen).
- Object Reachability, Roots, and Reference Counting vs Tracing GC.
- The 4 Classic Frontend Memory Leaks:
  1. Forgotten Timers and Callbacks (`setInterval`)
  2. Unremoved Global Event Listeners
  3. Detached DOM Tree References
  4. Unintentional Closures Retaining Outer Scope
- Memory-Safe data structures: `WeakMap` and `WeakSet` (Ephemerons).
