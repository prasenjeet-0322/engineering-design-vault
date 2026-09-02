# KPI 01 — React Mental Model & Programming Model

[⬅️ Level 06 Master Hub](../README.md) | [Part 01: React as a Declarative UI System](./01-react-as-a-declarative-ui-system.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer \| Founding Engineer)

---

## 🎯 Executive Overview

KPI 01 establishes the foundational mental model of React before learning individual hooks or rendering optimizations. It defines what React is (and what it is not), declarative UI, state-driven UI, components as units of composition, the difference between React rendering and browser rendering, and the distinct entities in React's universe: **Component vs Element vs Instance vs Fiber vs DOM Node**.

```text
                    APPLICATION
                       STATE
                         │
                         ▼
                   REACT UPDATE
                         │
                         ▼
                    RENDER PHASE
                         │
                         ▼
               REACT ELEMENT TREE
                         │
                         ▼
                  RECONCILIATION
                         │
                         ▼
                    COMMIT PHASE
                         │
                         ▼
                    DOM MUTATION
                         │
                         ▼
               BROWSER RENDERING
                         │
                  ┌──────┴──────┐
                  ▼             ▼
                LAYOUT         PAINT
```

---

## 🗺️ KPI 01 Part Index

| Part | Title & Link | Status | Key Focus & Mechanics |
| :--- | :--- | :---: | :--- |
| **Part 01** | [React as a Declarative UI System](./01-react-as-a-declarative-ui-system.md) | ✅ Completed | Declarative vs imperative, `UI = f(s, p)`, Render $\neq$ Commit $\neq$ Paint, Fiber conceptual double-buffering. |
| **Part 02** | [React's Core Entities](./02-react-core-entities.md) | ✅ Completed | Component vs Element vs Instance vs Fiber vs DOM Node. Element object anatomy and immutability. |
| **Part 03** | [State $\to$ Update $\to$ Render $\to$ Commit](./03-state-update-render-commit.md) | ✅ Completed | The complete update lifecycle, state snapshots, reconciliation triggering, and DOM commit boundaries. |
| **Part 04** | [React, Reconciliation & the Browser](./04-react-reconciliation-browser.md) | ⏳ Next | Virtual tree comparison heuristics, bailout conditions, DOM mutation batching, and browser pipeline handoff. |
| **Part 05** | [One-Way Data Flow & Programming Model](./05-one-way-data-flow-programming-model.md) | ⏳ Pending | Unidirectional dataflow, parent-child contracts, immutable props inputs, and component API boundaries. |

---

## 🧪 Interactive Diagnostic Labs

* [🧪 Lab 01: Declarative UI vs Render/Commit Pipeline](./examples/01-declarative-vs-imperative-render-lab.html) — Live simulator of state update triggers, render phase execution, Fiber diff bailout, commit phase mutations, and browser paint telemetry.
* [🧪 Lab 02: React Core Entities & Memory Anatomy](./examples/02-react-core-entities-inspector-lab.html) — Live inspector for Component Functions, Element Objects, Fiber Nodes, and DOM Nodes with the nested component focus-loss bug simulator.
* [🧪 Lab 03: State Update Queue, Render Snapshots & Commit Simulator](./examples/03-state-update-render-commit-lab.html) — Live inspector for render snapshot closures, direct vs functional update queue resolution, and `Object.is` reference bailout checks.

---

[⬅️ Level 06 Master Hub](../README.md) | [Part 01: React as a Declarative UI System](./01-react-as-a-declarative-ui-system.md)
