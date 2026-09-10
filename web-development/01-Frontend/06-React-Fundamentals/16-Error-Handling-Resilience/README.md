# KPI 16 — Error Handling & Resilience

[⬅️ Level 06 Master Hub](../README.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer \| Founding Engineer)

---

## 🎯 Executive Overview

Error Boundaries, render errors vs async errors, failure isolation, fallback UI architecture.

---

## 🗺️ KPI 16 Part Index

| Part & File | Status | Key Focus & Mechanics | Companion Lab |
| :--- | :---: | :--- | :---: |
| [React Error Boundaries & Component-Tree Failure Isolation](./01-error-boundaries-isolation.md) | ✅ Completed | `componentDidCatch`, `getDerivedStateFromError`, render phase catch, blast radius isolation. | [🧪 Lab 01](./examples/01-error-boundaries-isolation.html) |
| [Render Errors vs Async/Event Handler Errors](./02-render-errors-vs-async-errors.md) | ✅ Completed | What Error Boundaries catch (render, lifecycle) vs what they miss (async, events, SSR). | [🧪 Lab 02](./examples/02-render-errors-vs-async-errors.html) |
| [Fallback UI & Error Recovery Strategies](./03-fallback-ui-recovery-patterns.md) | ✅ Completed | Resetting error boundaries on route navigation, retry buttons, Sentry telemetry reporting. | [🧪 Lab 03](./examples/03-fallback-ui-recovery-patterns.html) |
| [Error Crucible & Enterprise Resilience Architecture](./04-error-crucible-resilience-design.md) | ⏳ Pending | Designing granular widget error boundaries vs page-level fallback boundaries. | ⏳ Pending |


---

## 🧪 Interactive Diagnostic Labs

* Companion interactive HTML diagnostic visualizers are placed in the [`examples/`](./examples/) directory for live runtime inspection.

---

[⬅️ Level 06 Master Hub](../README.md)
