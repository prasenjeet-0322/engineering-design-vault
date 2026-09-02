# KPI 11 — Context & Dependency Distribution

[⬅️ Level 06 Master Hub](../README.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer \| Founding Engineer)

---

## 🎯 Executive Overview

Dependency distribution, Provider nesting, context propagation, performance pitfalls.

---

## 🗺️ KPI 11 Part Index

| Part & File | Status | Key Focus & Mechanics |
| :--- | :---: | :--- |
| [Context Architecture & Dependency Injection](./01-context-architecture-mental-model.md) | ⏳ Pending | createContext, Provider, useContext, ambient dependency distribution across subtrees. |
| [Context Propagation & Re-Render Cascades](./02-context-propagation-re-renders.md) | ⏳ Pending | How context value changes bypass React.memo and re-render all consuming descendants. |
| [Context Splitting & Colocation Patterns](./03-splitting-colocating-context.md) | ⏳ Pending | Splitting State vs Dispatch contexts, selector patterns, memoizing Provider values. |
| [Context vs Props vs State Management](./04-context-vs-props-vs-global-state.md) | ⏳ Pending | Decision matrix: When to use Props vs Composition vs Context vs External Store. |
| [Context Crucible & Unnecessary Render Fixes](./05-context-crucible-performance-fixes.md) | ⏳ Pending | Profiling context cascades, refactoring monolithic global context providers. |


---

## 🧪 Interactive Diagnostic Labs

* Companion interactive HTML diagnostic visualizers are placed in the [`examples/`](./examples/) directory for live runtime inspection.

---

[⬅️ Level 06 Master Hub](../README.md)
