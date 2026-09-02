# KPI 06 — Rendering, Reconciliation & Identity

[⬅️ Level 06 Master Hub](../README.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer \| Founding Engineer)

---

## 🎯 Executive Overview

Render phase vs Commit phase, Fiber diffing heuristics, Keys, state preservation vs reset.

---

## 🗺️ KPI 06 Part Index

| Part & File | Status | Key Focus & Mechanics |
| :--- | :---: | :--- |
| [Render Phase vs Commit Phase](./01-render-phase-vs-commit-phase.md) | ⏳ Pending | Pure calculation vs host mutation, double-buffering current vs workInProgress. |
| [Reconciliation Diffing Heuristics](./02-reconciliation-heuristics-diffing.md) | ⏳ Pending | O(n) tree comparison rules, element type changes, same position preservation. |
| [Keys as Component Identity](./03-keys-as-identity.md) | ⏳ Pending | Key identity, forcing state reset via key changes, reordering lists safely. |
| [State Preservation & Reset Rules](./04-state-preservation-reset-rules.md) | ⏳ Pending | Why component identity at the same tree position preserves state across renders. |
| [Rendering Crucible & Identity Traps](./05-rendering-crucible-identity-bugs.md) | ⏳ Pending | Input focus loss bugs, duplicate state glitches, nested component declaration anti-pattern. |


---

## 🧪 Interactive Diagnostic Labs

* Companion interactive HTML diagnostic visualizers are placed in the [`examples/`](./examples/) directory for live runtime inspection.

---

[⬅️ Level 06 Master Hub](../README.md)
