# KPI 16 — Events, Bubbling & Delegation

[⬅️ KPI 15 — DOM Fundamentals](../15-DOM-Fundamentals/README.md) | [📚 JavaScript Index](../README.md) | [KPI 17 — Forms & Validation ➡️](../17-Forms-Validation/README.md)

---

## Overview
*Status: 🟡 Ready for Master Content & Evaluation.*

---

## 🎯 Learning Objectives
- The 3 Event Phases: Capturing Phase $\rightarrow$ Target Phase $\rightarrow$ Bubbling Phase.
- `e.target` vs `e.currentTarget`.
- `e.preventDefault()`, `e.stopPropagation()`, and `e.stopImmediatePropagation()`.
- Event Delegation: Attaching a single listener to a common ancestor with `.closest()` matching.
- Passive event listeners (`{ passive: true }`) for 60fps scrolling performance.
- Creating and dispatching `CustomEvent` instances.
