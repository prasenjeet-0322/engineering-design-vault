# KPI 05 — Events & User Interaction

[⬅️ Level 06 Master Hub](../README.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

## 🎯 Executive Overview

KPI 05 establishes the foundational mental model and architectural contracts for user interaction in React: how events enter the application, passing handler references vs immediate invocations, adapter functions, callback contracts (`onX` vs `handleX`), closure snapshots in event handlers, SyntheticEvents, event propagation, and distinguishing user interaction boundaries from `useEffect` synchronization.

```text
USER INTERACTION
       │
       ▼
BROWSER EVENT
       │
       ▼
REACT SYNTHETIC EVENT
       │
       ▼
EVENT HANDLER (onClick / onChange / onSubmit)
       │
       ├─────────────────► STATE TRANSITION
       └─────────────────► COMPONENT CALLBACK PROP (Parent Action)
              │
              ▼
        TRIGGER RE-RENDER
              │
              ▼
         NEW SNAPSHOT
              │
              ▼
        RECONCILIATION
              │
              ▼
        COMMIT TO DOM
```

---

## 🗺️ KPI 05 Part Index

| Part & File | Status | Key Focus & Mechanics |
| :--- | :---: | :--- |
| [01. React Event Handling & Event Handlers](./01-react-event-handling-and-event-handlers.md) | ✅ Completed | Interaction vs rendering boundaries, `onClick={fn}` vs `onClick={fn()}`, adapter functions, callback contracts, and event vs effect distinctions. |
| [02. Event Objects & Event Semantics](./02-event-objects-and-event-semantics.md) | ✅ Completed | Event objects as interaction metadata, `event.target` vs `event.currentTarget`, keyboard `key` vs `code`, `preventDefault()` vs `stopPropagation()`, and decoupled callback boundaries. |
| [03. Event Propagation & Event Flow](./03-event-propagation-and-event-flow.md) | ✅ Completed | 3-phase event flow (Capture, Target, Bubble), `onClickCapture` vs `onClick`, `stopPropagation()` boundaries, clickable card conflicts, and component vs DOM event paths. |
| [04. Event Arguments & Handler Contracts](./04-event-arguments-and-handler-contracts.md) | ✅ Completed | Event arguments vs domain arguments, closure adapter functions, 3-layer contract architecture, DOM vs semantic callback design, and telemetry. |
| [05. Forms & Input Interaction Fundamentals](./05-forms-and-input-interaction.md) | ✅ Completed | Controlled inputs feedback loop, `value` vs `defaultValue`, `checked` vs `defaultChecked`, `onSubmit` semantics, `preventDefault()`, and generic input adapters. |
| [06. Keyboard Interaction & Accessible User Input](./06-keyboard-interaction-and-accessibility.md) | ✅ Completed | Keyboard events, `key` vs `code`, `repeat`, modifier combos, native `<button>` vs custom `<div>`, focus management, `tabIndex`, and scoped overlays. |
| [07. Event Handler Identity, Closures & Rendering](./07-event-handler-identity-and-rendering.md) | ✅ Completed | Function identity, render snapshot closures, `useCallback` conditional stability, `React.memo` bailouts, stale closures, and profiling. |
| [08. Event Handler Patterns & Callback Contracts](./08-event-handler-patterns-and-callback-contracts.md) | ✅ Completed | 3-layer interaction pipeline, callback dependency injection, semantic contracts vs DOM leakage, callback composition, and god-handler elimination. |
| [09. Event-Driven State Transitions & UI State Machines](./09-event-driven-state-transitions.md) | ✅ Completed | UI state machine mental models, avoiding boolean explosion, state invariants, async execution sequences, transition guards, and useReducer. |
| [10. Event-Driven State Architecture](./10-event-driven-state-architecture.md) | ✅ Completed | Event vs state separation, pure transition reducers, async request identity tokens, stale response avoidance, and complexity escalation ladders. |
| [11. Event-Driven State Architecture in Complex Components](./11-event-driven-state-architecture-in-complex-components.md) | ✅ Completed | Multi-domain state partitioning, invariant enforcement, semantic action protocols, async request identity, optimistic rollback recovery, and interaction telemetry. |
| [12. Advanced Form Interaction Architecture](./12-advanced-form-interaction-architecture.md) | ✅ Completed | 5 major form concerns, derived validation vs touched/dirty metadata, dependent field invariants, submission snapshots, stale token rejection, and dynamic entity keys. |
| [13. Interaction State Machines & Async Workflows](./13-interaction-state-machines-and-async-workflows.md) | ✅ Completed | Finite state graph transitions, guards vs presentation disabled, stale async response protection with request identity, and discriminated state algebra. |
| [14. Event-Driven Async Interaction Patterns](./14-event-driven-async-interaction-patterns.md) | ✅ Completed | Event policies (immediate, debounce, throttle), latest-wins vs queueing vs deduplication, cancellation limits, optimistic UI rollback, and idempotency keys. |
| [15. Event & Interaction Crucible](./15-event-and-interaction-crucible.md) | ✅ Completed | Comprehensive interaction stress test: propagation, target vs currentTarget, state queues, closure snapshots, async race invariant resolution, and gotchas. |
| [16. KPI 05 Final Review & Mastery](./16-kpi-05-final-review-and-mastery.md) | ✅ Completed | Final synthesis, complete 5-dimension interaction model, 8 graduation examinations, and cross-KPI mastery gate. |

---

## 🧪 Interactive Diagnostic Labs

* Companion interactive HTML diagnostic visualizers are placed in the [`examples/`](./examples/) directory for live runtime inspection:
  * [`01-react-event-handling-and-event-handlers.html`](./examples/01-react-event-handling-and-event-handlers.html) — Handler reference vs immediate invocation timing, adapter function argument mapping, and decoupled callback contracts.
  * [`02-event-objects-and-event-semantics.html`](./examples/02-event-objects-and-event-semantics.html) — SyntheticEvent inspector, target vs currentTarget divergence, keyboard key vs code, and preventDefault vs stopPropagation.
  * [`03-event-propagation-and-event-flow.html`](./examples/03-event-propagation-and-event-flow.html) — 5-phase capture/bubble flow visualizer, stopPropagation halting, and nested clickable card conflict simulator.
  * [`04-event-arguments-and-handler-contracts.html`](./examples/04-event-arguments-and-handler-contracts.html) — Adapter closures, call-on-render vs reference demo, 3-layer architecture visualizer, and Crucible prediction challenges.
  * [`05-forms-and-input-interaction.html`](./examples/05-forms-and-input-interaction.html) — Controlled form feedback loop, live SyntheticEvent inspector, render snapshot timeline, and submission pipeline trace.
  * [`06-keyboard-interaction-and-accessibility.html`](./examples/06-keyboard-interaction-and-accessibility.html) — Keystroke scan codes, document.activeElement focus tracker, native button vs custom div, and scoped modal escape dismissal.
  * [`07-event-handler-identity-and-rendering.html`](./examples/07-event-handler-identity-and-rendering.html) — Function identity comparisons (`===`), `React.memo` bailout failure vs `useCallback` success, and asynchronous stale closure simulator.
  * [`08-event-handler-patterns-and-callback-contracts.html`](./examples/08-event-handler-patterns-and-callback-contracts.html) — 3-layer interaction pipeline, semantic callback contracts, callback composition with internal state, and propagation shielding.
  * [`09-event-driven-state-transitions.html`](./examples/09-event-driven-state-transitions.html) — Interactive UI state machine visualizer, status transition dispatch tracing, async execution sequences, and transition guards.
  * [`10-event-driven-state-architecture.html`](./examples/10-event-driven-state-architecture.html) — File upload state machine, async race condition resolver with request identity tokens, and transition telemetry.
  * [`11-event-driven-state-architecture-in-complex-components.html`](./examples/11-event-driven-state-architecture-in-complex-components.html) — Multi-domain partitioned document editor, stale response rejection with active request tokens, optimistic delete rollback, and invariant auditing.
  * [`12-advanced-form-interaction-architecture.html`](./examples/12-advanced-form-interaction-architecture.html) — 5 form concerns sandbox, derived client validation vs touched/blurred state, dependent country-state reset, server error mapping, and race condition token protection.
  * [`13-interaction-state-machines-and-async-workflows.html`](./examples/13-interaction-state-machines-and-async-workflows.html) — Visual state graph, transition guards, out-of-order race simulator with stale response rejection, and boolean explosion vs discriminated union comparisons.
  * [`14-event-driven-async-interaction-patterns.html`](./examples/14-event-driven-async-interaction-patterns.html) — Event policy rate visualizer (immediate/debounce/throttle), out-of-order race rejection with active request tokens, and optimistic UI rollback recovery.
  * [`15-event-and-interaction-crucible.html`](./examples/15-event-and-interaction-crucible.html) — Multi-module diagnostic station: propagation path inspector, state queue calculator, native form submit boundaries, and out-of-order race tokens.
  * [`16-kpi-05-final-review-and-mastery.html`](./examples/16-kpi-05-final-review-and-mastery.html) — Graduation self-assessment suite with interactive solutions for all 8 core mastery questions.

---

[⬅️ Level 06 Master Hub](../README.md)


