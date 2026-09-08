# KPI 09 — Conditional Rendering & Lists (Lists, Keys & Reconciliation)

[⬅️ Level 06 Master Hub](../README.md) | [⬅️ Previous KPI (Forms & Controlled Inputs)](../12-Forms-Controlled-Uncontrolled/README.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

## 🎯 Executive Overview

Conditional rendering and list reconciliation are the foundation of React's dynamic virtual DOM model. Mastering this KPI means understanding the exact **Fiber node reconciliation heuristics**, how **component identity** dictates state preservation vs destruction, the mechanics of **stable list keys**, and how to prevent **reconciliation bottlenecks across large collections**.

```text
                     CONDITIONAL & LIST ARCHITECTURE
                                   │
                ┌──────────────────┴──────────────────┐
                │                                     │
                ▼                                     ▼
       CONDITIONAL RENDERING                  LIST RECONCILIATION
       (Tree Shape & Identity)                (Collection Diffing)
                │                                     │
    • Declarative state projection         • Key-based identity mapping
    • Same type = state preservation       • Index key shifting corruption
    • Diff type / key = clean remount      • O(N) linear reconciliation
    • Mount vs CSS hiding boundaries       • Virtualization & windowing
```

---

## 🗺️ Master Part Index

| Part & File | Status | Key Focus & Mechanics | Companion Lab |
| :--- | :---: | :--- | :---: |
| [01. Conditional Rendering Mental Model & Declarative Branching Architecture](./01-conditional-rendering-mental-model.md) | ✅ Completed | Declarative tree projection, Fiber node reconciliation heuristics, type/key identity preservation vs reset, `0`/`NaN` traps, mount vs hide lifecycles. | [🧪 Lab 01](./examples/01-conditional-rendering-mental-model.html) |
| [02. Conditional Rendering Patterns: Guard Clauses, Ternary Topologies & State Machines](./02-conditional-rendering-patterns.md) | ✅ Completed | Guard clauses, early returns, polymorphic component maps, discriminated union state machines, eliminating boolean explosion. | [🧪 Lab 02](./examples/02-conditional-rendering-patterns.html) |
| [03. Nullish Conditional Rendering, Empty States & Data-Availability Semantics](./03-nullish-conditional-rendering-and-empty-states.md) | ✅ Completed | JavaScript falsiness vs domain availability, `??` vs `||`, `return null` vs unmount lifecycle, infinite spinner traps on empty arrays. | [🧪 Lab 03](./examples/03-nullish-conditional-rendering-and-empty-states.html) |
| [04. Rendering Collections & List Data](./04-rendering-collections-and-list-data.md) | ✅ Completed | Array mapping in JSX, element descriptions vs DOM nodes, Fiber 2-pass reconciler, index-key state shift traps, keyed fragments. | [🧪 Lab 04](./examples/04-rendering-collections-and-list-data.html) |
| [05. Keys & Component Identity](./05-keys-and-component-identity.md) | ✅ Completed | Identity Tuple $\langle P, T, K \rangle$, ten mutation topologies, rerender vs remount, state partitioning, temporary UUID transitions. | [🧪 Lab 05](./examples/05-keys-and-component-identity.html) |
| [06. Reconciliation & List Diffing](./06-reconciliation-and-list-diffing.md) | ✅ Completed | Deep key matching algorithms, two-pass linear scan & Map lookup, Fiber double buffering, `lastPlacedIndex` minimal DOM shifts. | [🧪 Lab 06](./examples/06-reconciliation-and-list-diffing.html) |
| [07. List Rendering Performance & Architecture](./07-list-rendering-performance-and-architecture.md) | ✅ Completed | Render vs DOM surface, `React.memo` & prop identity traps, structural sharing, DOM virtualization (windowing) geometry, overscan tuning. | [🧪 Lab 07](./examples/07-list-rendering-performance-and-architecture.html) |
| [08. Advanced List Patterns & Dynamic Collections](./08-advanced-list-patterns-and-dynamic-collections.md) | ✅ Completed | Domain identity vs position, 12 collection concerns, cross-group reparenting, optimistic additions, temporary UUIDs, headless hooks. | [🧪 Lab 08](./examples/08-advanced-list-patterns-and-dynamic-collections.html) |
| [09. List State Architecture & Entity Lifecycle](./09-list-state-architecture-and-entity-lifecycle.md) | ✅ Completed | 4 orthogonal lifetimes, state registries (`draftsById`, `selectedIds`), async `requestId` currentness, strict mathematical invariants. | [🧪 Lab 09](./examples/09-list-state-architecture-and-entity-lifecycle.html) |
| [10. List Reconciliation Crucible](./10-list-reconciliation-crucible.md) | ✅ Completed | Two-pass Fiber reconciler algorithm, `lastPlacedIndex` watermark, 14 prediction challenges, reparenting breakdown. | [🧪 Lab 10](./examples/10-list-reconciliation-crucible.html) |
| [11. Advanced List Performance Crucible](./11-advanced-list-performance-crucible.md) | ✅ Completed | Virtual windowing geometry, fine-grained subscriptions, 60 FPS scrolling benchmarks, memory leak profiling. | [🧪 Lab 11](./examples/11-advanced-list-performance-crucible.html) |
| [12. Advanced List Architecture](./12-advanced-list-architecture.md) | ✅ Completed | 4-lifetime model, normalized entity store (`entitiesById + visibleIds`), multi-view projections, $O(K)$ selection intent model. | [🧪 Lab 12](./examples/12-advanced-list-architecture.html) |
| [13. List Architecture Crucible](./13-list-architecture-crucible.md) | ✅ Completed | 17-point audit framework, 4 decoupled lifetimes, draft registries, out-of-order async currentness, logical focus models. | [🧪 Lab 13](./examples/13-list-architecture-crucible.html) |
| [14. Advanced List Architecture Patterns](./14-advanced-list-and-conditional-patterns.md) | ✅ Completed | Compound components, headless hooks, semantic prop getters, split context, immutable bulk snapshots. | [🧪 Lab 14](./examples/14-list-architecture-patterns.html) |
| [15. Conditional Rendering & Lists Crucible](./15-conditional-rendering-and-lists-crucible.md) | ✅ Completed | 30 prediction challenges, 10 incident post-mortems, four-lifetime model, 10-question graduation exam. | [🧪 Lab 15](./examples/15-conditional-rendering-and-lists-crucible.html) |
| [16. Conditional Rendering & Lists: Final Review & Synthesis Mastery](./16-conditional-rendering-and-lists-final-review.md) | ✅ Completed | Comprehensive capstone synthesis, 4-lifetime model, 20 interview master Q&As, 40-point completion checklist. | [🧪 Lab 16](./examples/16-conditional-rendering-and-lists-final-review-and-mastery.html) |

---

## 🧪 Interactive Diagnostic Labs

* Companion interactive HTML diagnostic visualizers are placed in the [`examples/`](./examples/) directory for live runtime inspection.

---

[⬅️ Level 06 Master Hub](../README.md) | [⬅️ Previous KPI (Forms & Controlled Inputs)](../12-Forms-Controlled-Uncontrolled/README.md)
