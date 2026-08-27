# KPI 1 — TypeScript Mental Model

[⬅️ Back to Level 05 Master Hub](../README.md)

---

## 🎯 Purpose
Establish the correct mental model of TypeScript before learning its type syntax. Understand TypeScript as a **static analysis & type-checking system layered over JavaScript**, including compile-time vs runtime boundaries, structural subtyping, type erasure, and soundness tradeoffs.

---

## 🗺️ KPI 1 Part Index

| Part | Title | Status | Core Focus |
|---|---|---|---|
| **Part 1** | [What TypeScript Actually Is](./01-what-typescript-actually-is.md) | ✅ Completed | Static analysis, compile vs runtime, type erasure, boundaries |
| **Part 2** | [TypeScript's Type System](./02-typescripts-type-system.md) | ⏳ Next | Structural typing, assignability, compatibility, soundness |
| **Part 3** | [From TS Source to JS Runtime](./03-from-ts-source-to-js-runtime.md) | ⏳ Pending | Parsing, AST, type checker (`checker.ts`), emitter |
| **Part 4** | [Static Types vs Runtime Data](./04-static-types-vs-runtime-data.md) | ⏳ Pending | External API responses, Zod validation, trust boundaries |
| **Part 5** | [TypeScript Engineering Philosophy](./05-typescript-engineering-philosophy.md) | ⏳ Pending | Inference-first, escape hatches, senior trade-off decision making |

---

## 🧠 Practical Competency
Ability to reason about what TypeScript can and cannot guarantee, avoiding false runtime security assumptions.

---

## 🎓 Graduation Criteria
Articulate structural subtyping rules and identify where TypeScript type erasure leaves runtime vulnerabilities.
