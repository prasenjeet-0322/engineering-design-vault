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
| [Error Crucible & Enterprise Resilience Architecture](./04-error-crucible-resilience-design.md) | ✅ Completed | Designing granular widget error boundaries vs page-level fallback boundaries. | [🧪 Lab 04](./examples/04-error-crucible-resilience-design.html) |
| [Boundary State, Error Identity, Reset Keys & Component Remount Semantics](./05-boundary-state-error-identity-reset-keys.md) | ✅ Completed | The 5 React identities, Fiber instance state, `resetKeys` vs `key`, draft state survival, telemetry lineage. | [🧪 Lab 05](./examples/05-boundary-state-error-identity-reset-keys.html) |
| [Error Telemetry, Correlation IDs & Production Observability](./06-error-telemetry-correlation-observability.md) | ✅ Completed | Error normalization, dual-stack capture (JS vs component stack), distributed correlation, PII scrubbing, rate-limiting. | [🧪 Lab 06](./examples/06-error-telemetry-correlation-observability.html) |


---

## 🧪 Interactive Diagnostic Labs

* Companion interactive HTML diagnostic visualizers are placed in the [`examples/`](./examples/) directory for live runtime inspection.

---

[⬅️ Level 06 Master Hub](../README.md)
