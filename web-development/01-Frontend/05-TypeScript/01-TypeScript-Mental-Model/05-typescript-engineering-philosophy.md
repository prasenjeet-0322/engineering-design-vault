# KPI 01 — Part 05: TypeScript Engineering Philosophy

[⬅️ Part 04: Static Types vs Runtime Data](./04-static-types-vs-runtime-data.md) | [📚 KPI 01 Index](./README.md) | [💻 Runnable Example Script](./examples/05-typescript-engineering-philosophy.ts) | [Level 05: Master Hub ➡️](../README.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Concept | Core Mental Model | Production Standard | Critical Failure Mode / Anti-Pattern |
|---|---|---|---|
| **Inference-First** | Let the compiler infer types wherever obvious. | Annotate function boundaries & public APIs; let locals infer. | Over-annotating obvious variables (`const x: number = 10`). |
| **Type Complexity vs. DX** | Complex type gymnastics slow down `tsserver` and teams. | Prioritize clarity and maintainability over clever type tricks. | Authoring 5-level nested recursive types for simple UI logic. |
| **Controlled Escape Hatches**| Safe interop with legacy JS and complex dynamic cases. | Use `unknown` + narrowing or type predicates (`is`); audit `any`. | Littering codebase with `as any` and non-null `!` assertions. |
| **Contract Immutability** | Prevent accidental mutation of shared state. | Apply `readonly` and `as const` on shared configurations & models. | Passing mutable references that get mutated across service boundaries. |
| **Senior Engineering Bar** | Types are communication tools that protect domain invariants. | Measure type system value by defects prevented and refactoring speed. | Believing maximum type complexity equals senior engineering capability. |

---

## 🗺️ Part Scope & Architecture

1. **The Inference-First Principle:** Strategic boundaries where explicit annotations add value vs where inference prevents maintenance churn.
2. **The Type Complexity Budget:** How recursive type gymnastics degrade compiler performance (`tsc` checking latency) and increase onboarding friction.
3. **Strictness Escalation Ladder:** Progressing from loose JavaScript to strict TypeScript (`strictNullChecks`, `noUncheckedIndexedAccess`).
4. **Governing Escape Hatches:** Safe migration strategies for legacy codebases, wrapping third-party libraries, and banning `any`.
5. **Architectural Evaluation Rubric:** The 5 questions every senior engineer must ask before introducing a new generic abstraction.

---

*(Detailed Gold-Standard content to be expanded)*

---

## 🔑 Key Takeaways

1. **Inference-First Thinking:** Let the compiler do the work. Explicitly annotate public API boundaries and complex return types; let local variables infer naturally.
2. **The Type Complexity Budget:** Complex type gymnastics slow down `tsserver` and team velocity. Prioritize clean maintainability over clever type acrobatics.
3. **Controlled Escape Hatches:** Eliminate raw `any` and non-null `!` assertions. Use `unknown` with user-defined type guards (`is`) or schema parsers.
4. **Contract Immutability with `as const`:** Enforce read-only invariants on domain configs and action maps to prevent state mutation leaks.
5. **Types as Communication:** The primary value of TypeScript is clear domain modeling, safe refactoring, and team collaboration—not maximum type complexity.

---

[⬅️ Part 04: Static Types vs Runtime Data](./04-static-types-vs-runtime-data.md) | [📚 KPI 01 Index](./README.md) | [💻 Runnable Example Script](./examples/05-typescript-engineering-philosophy.ts) | [Level 05: Master Hub ➡️](../README.md)
