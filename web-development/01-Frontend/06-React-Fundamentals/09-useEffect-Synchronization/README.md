# KPI 09 — useEffect & Synchronization

[⬅️ Level 06 Master Hub](../README.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer \| Founding Engineer)

---

## 🎯 Executive Overview

Synchronization with external systems, dependency arrays, cleanups, race conditions.

---

## 🗺️ KPI 09 Part Index

| Part & File | Status | Key Focus & Mechanics |
| :--- | :---: | :--- |
| [Effects as External Synchronization](./01-effects-as-synchronization.md) | ⏳ Pending | Effects are NOT lifecycle hooks; synchronizing React with non-React external systems. |
| [Dependency Arrays & Reactive Values](./02-dependency-arrays-referential-equality.md) | ⏳ Pending | Object/function identity in dependencies, linter exhaustiveness rule, reactive closure guarantees. |
| [Effect Cleanup & Lifetime](./03-effect-cleanup-lifecycle.md) | ⏳ Pending | When cleanups execute (before re-run & on unmount), teardown subscriptions, WebSockets, timers. |
| [Async Effects & Race Conditions](./04-async-effects-race-conditions.md) | ⏳ Pending | Handling async operations in useEffect, cleanup cancellation flags, AbortController. |
| [When NOT to Use useEffect](./05-when-not-to-use-useeffect.md) | ⏳ Pending | You Might Not Need An Effect: Transforming data during render, handling user events in handlers. |
| [useEffect Crucible & Infinite Loop Debugging](./06-useeffect-crucible-infinite-loops.md) | ⏳ Pending | Debugging infinite render-effect loops, stale network closures, and subscription memory leaks. |


---

## 🧪 Interactive Diagnostic Labs

* Companion interactive HTML diagnostic visualizers are placed in the [`examples/`](./examples/) directory for live runtime inspection.

---

[⬅️ Level 06 Master Hub](../README.md)
