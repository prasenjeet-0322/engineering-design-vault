# KPI 14 — Render Performance, Transitions & Concurrency

[⬅️ Level 06 Master Hub](../README.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer \| Founding Engineer)

---

## 🎯 Executive Overview

Render phase vs Commit phase, Concurrent Transitions, `useTransition`, `useDeferredValue`, DOM Virtualization, Scheduler Priority Lanes, and Chrome DevTools Profiling.

---

## 🗺️ KPI 14 Part Index

| Part & File | Status | Key Focus & Mechanics |
| :--- | :---: | :--- |
| [The Architecture of Render Performance & Concurrent Transitions](./01-architecture-of-render-performance.md) | ✅ Completed | The 3 computational layers (JS, React, Browser), priority lanes, cooperative yielding, layout thrashing. | [🧪 Lab 01](./examples/01-architecture-of-render-performance.html) |
| [useTransition, startTransition & Non-Blocking UI](./02-usetransition-and-non-blocking-rendering.md) | ✅ Completed | Decoupling urgent input state from transition state, interruptibility, isPending feedback. | [🧪 Lab 02](./examples/02-usetransition-and-non-blocking-rendering.html) |
| [useDeferredValue & Deferred Subtree Optimization](./03-usedeferredvalue-and-deferred-props.md) | ✅ Completed | Deferring values vs debouncing, dual-pass rendering, pairing with React.memo for bailouts. | [🧪 Lab 03](./examples/03-usedeferredvalue-and-deferred-props.html) |
| [DOM Virtualization, Windowing & High-Density UI](./04-virtualization-and-large-dataset-rendering.md) | ⏳ Pending | Rendering 100,000 records with 20 viewport DOM nodes, `@tanstack/react-virtual`, overscan math. |
| [Render Performance Crucible & Master Synthesis](./05-render-performance-crucible-and-mastery.md) | ⏳ Pending | INP / TBT Web Vitals, Chrome Performance flame charts, Long Tasks, master decision trees. |

---

## 🧪 Interactive Diagnostic Labs

* Companion interactive HTML diagnostic visualizers are placed in the [`examples/`](./examples/) directory for live runtime inspection.

---

[⬅️ Level 06 Master Hub](../README.md)
