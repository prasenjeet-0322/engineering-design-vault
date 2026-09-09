# Level 06 — React Fundamentals & Fiber Architecture

[⬅️ Level 05: TypeScript](../05-TypeScript/README.md) | [📚 Frontend Master Hub](../README.md) | [Level 07: Advanced React & Rendering ➡️](../07-Advanced-React-Rendering/README.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer \| Founding Engineer)

---

## 🎯 Executive Overview

**Level 06 — React Fundamentals** is designed under the **15-Pillar Gold Standard** to build a comprehensive, engineering-grade mental model of React 18/19: component architecture, JSX compilation, Fiber reconciliation tree, render passes vs commit phase, Hook linked lists, state snapshots, unidirectional dataflow, effect synchronization, and component lifecycle mechanics.

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

## 🗺️ Master Curriculum Roadmap (20 KPIs)

| KPI | Title & Directory | Status | Core Architectural Focus |
| :--- | :--- | :---: | :--- |
| **KPI 01** | [React Mental Model & Programming Model](./01-React-Mental-Model-Programming-Model/README.md) | 🟡 In Progress | Declarative UI, `UI = f(s, p)`, Component vs Element vs Instance vs DOM, Render $\neq$ Paint. |
| **KPI 02** | [JSX & React Elements](./02-JSX-React-Elements/README.md) | 🟡 In Progress | JSX transformation, `react/jsx-runtime`, Element objects, Fragment/null/boolean rendering. |
| **KPI 03** | [Components & Composition](./03-Components-Composition/README.md) | ✅ Completed | Function components, boundaries, composition over inheritance, slots, compound components. |
| **KPI 04** | [State & State Updates](./04-Props-One-Way-Data-Flow/README.md) | ✅ Completed | UI memory snapshots, updater queue algebra, immutability, normalization, component identity, and transition modeling. |
| **KPI 05** | [Events & User Interaction](./07-Events-User-Interaction/README.md) | ✅ Completed | SyntheticEvent abstraction, interaction boundaries, closures in handlers, callback contracts, state machine transitions, async race policies, and graduation suite. |
| **KPI 06 / 09** | [Conditional Rendering & Lists](./09-Conditional-Rendering-Lists/README.md) | ✅ Completed | Declarative tree projection, Fiber diffing heuristics, type/key identity preservation vs reset, list virtualization. |
| **KPI 08** | [Hooks Mental Model](./08-Hooks-Mental-Model/README.md) | 🟡 In Progress | Rules of Hooks, call order invariants, hook singly linked list on Fiber, stateful logic sharing. |
| **KPI 09** | [useEffect & External Synchronization](./09-useEffect-Synchronization/README.md) | ✅ Completed | Synchronization with external systems, dependency arrays, cleanups, race conditions, and avoidance of fake Effects. |
| **KPI 10** | [useRef & Mutable Values](./10-useRef-Mutable-Values/README.md) | ✅ Completed | Ref identity, mutable `.current`, DOM refs, imperative handles vs state, measurement. |
| **KPI 11** | [Context & Dependency Distribution](./11-Context-Dependency-Distribution/README.md) | ✅ Completed | Dependency distribution, Provider nesting, context propagation, performance pitfalls. |
| **KPI 12** | [Forms & Controlled Inputs](./12-Forms-Controlled-Uncontrolled/README.md) | ✅ Completed | Controlled vs uncontrolled inputs, multi-timeline state machines, validation DAGs, baseline reconciliation. |
| **KPI 13** | `13-Derived-State-Memoization` | ⏳ Pending | Derived data, `useMemo`, `useCallback`, `React.memo`, referential equality, memoization cost. |
| **KPI 14** | [Custom Hooks & Logic Composition](./14-Custom-Hooks-Logic-Composition/README.md) | 🟡 In Progress | Extracting stateful logic, hook composition, contract boundaries, avoiding over-abstraction. |
| **KPI 15** | `15-Async-UI-State-Lifecycle` | ⏳ Pending | Idle/Loading/Success/Error state machines, optimistic UI, cancellation, race conditions. |
| **KPI 16** | `16-Error-Handling-Resilience` | ⏳ Pending | Error Boundaries, render errors vs async errors, failure isolation, fallback UI architecture. |
| **KPI 17** | `17-Accessibility-React` | ⏳ Pending | Semantic HTML, accessible APIs, focus management via refs, ARIA live announcements. |
| **KPI 18** | `18-React-TypeScript-Engineering` | ⏳ Pending | Generic components/hooks, discriminated props, polymorphic components, event/ref typing. |
| **KPI 19** | `19-React-Component-Architecture` | ⏳ Pending | Domain vs UI components, dependency direction, cohesion, refactoring God components. |
| **KPI 20** | `20-Capstone-Senior-Reasoning` | ⏳ Pending | Full-stack synthesis, production debugging runbooks, architecture reviews, interview crucibles. |

---

[⬅️ Level 05: TypeScript](../05-TypeScript/README.md) | [📚 Frontend Master Hub](../README.md) | [Level 07: Advanced React & Rendering ➡️](../07-Advanced-React-Rendering/README.md)
