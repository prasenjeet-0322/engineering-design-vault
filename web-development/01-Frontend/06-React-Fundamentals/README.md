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
| **KPI 02** | `02-JSX-React-Elements` | ⏳ Pending | JSX transformation, `react/jsx-runtime`, Element objects, Fragment/null/boolean rendering. |
| **KPI 03** | `03-Components-Composition` | ⏳ Pending | Function components, boundaries, composition over inheritance, slots, compound components. |
| **KPI 04** | `04-Props-One-Way-Data-Flow` | ⏳ Pending | Unidirectional dataflow, immutable inputs, prop drilling vs composition, TS prop design. |
| **KPI 05** | `05-State-State-Ownership` | ⏳ Pending | `useState`, state snapshots, functional updates, batching queues, derived state vs state. |
| **KPI 06** | `06-Rendering-Reconciliation-Identity` | ⏳ Pending | Render phase vs Commit phase, Fiber diffing heuristics, Keys, state preservation vs reset. |
| **KPI 07** | `07-Events-User-Interaction` | ⏳ Pending | SyntheticEvent abstraction, event delegation, closures in handlers, React vs browser events. |
| **KPI 08** | `08-Hooks-Mental-Model` | ⏳ Pending | Rules of Hooks, call order invariants, hook singly linked list on Fiber, stateful logic sharing. |
| **KPI 09** | `09-useEffect-Synchronization` | ⏳ Pending | Synchronization with external systems, dependency arrays, cleanups, race conditions. |
| **KPI 10** | `10-useRef-Mutable-Values` | ⏳ Pending | Ref identity, mutable `.current`, DOM refs, imperative handles vs state, measurement. |
| **KPI 11** | `11-Context-Dependency-Distribution` | ⏳ Pending | Dependency distribution, Provider nesting, context propagation, performance pitfalls. |
| **KPI 12** | `12-Forms-Controlled-Uncontrolled` | ⏳ Pending | Controlled vs uncontrolled inputs, `FormData`, validation boundaries, performance in forms. |
| **KPI 13** | `13-Derived-State-Memoization` | ⏳ Pending | Derived data, `useMemo`, `useCallback`, `React.memo`, referential equality, memoization cost. |
| **KPI 14** | `14-Custom-Hooks-Logic-Composition` | ⏳ Pending | Extracting stateful logic, hook composition, contract boundaries, avoiding over-abstraction. |
| **KPI 15** | `15-Async-UI-State-Lifecycle` | ⏳ Pending | Idle/Loading/Success/Error state machines, optimistic UI, cancellation, race conditions. |
| **KPI 16** | `16-Error-Handling-Resilience` | ⏳ Pending | Error Boundaries, render errors vs async errors, failure isolation, fallback UI architecture. |
| **KPI 17** | `17-Accessibility-React` | ⏳ Pending | Semantic HTML, accessible APIs, focus management via refs, ARIA live announcements. |
| **KPI 18** | `18-React-TypeScript-Engineering` | ⏳ Pending | Generic components/hooks, discriminated props, polymorphic components, event/ref typing. |
| **KPI 19** | `19-React-Component-Architecture` | ⏳ Pending | Domain vs UI components, dependency direction, cohesion, refactoring God components. |
| **KPI 20** | `20-Capstone-Senior-Reasoning` | ⏳ Pending | Full-stack synthesis, production debugging runbooks, architecture reviews, interview crucibles. |

---

[⬅️ Level 05: TypeScript](../05-TypeScript/README.md) | [📚 Frontend Master Hub](../README.md) | [Level 07: Advanced React & Rendering ➡️](../07-Advanced-React-Rendering/README.md)
