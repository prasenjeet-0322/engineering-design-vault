# KPI 01 — TypeScript Mental Model

[⬅️ Back to Level 05 Master Hub](../README.md) | [KPI 02: Type System Fundamentals ➡️](../02-Type-System-Fundamentals/README.md)

---

## 🎯 Purpose
Establish the correct mental model of TypeScript before learning its type syntax. Understand TypeScript as a **static analysis & type-checking system layered over JavaScript**, including compile-time vs runtime boundaries, structural subtyping, type erasure, and soundness tradeoffs.

---

## 🗺️ KPI 01 Part Index

| Part | Title | Status | Core Focus |
|---|---|---|---|
| **Part 01** | [What TypeScript Actually Is](./01-what-typescript-actually-is.md) | ✅ Completed | Static analysis, compile vs runtime, type erasure, boundaries |
| **Part 02** | [TypeScript's Type System](./02-typescripts-type-system.md) | ✅ Completed | Structural typing, assignability, compatibility, soundness |
| **Part 03** | [From TS Source to JS Runtime](./03-from-ts-source-to-js-runtime.md) | ✅ Completed | 5-stage pipeline, `tsc --noEmit`, SWC/esbuild, monorepos |
| **Part 04** | [Static Types vs Runtime Data](./04-static-types-vs-runtime-data.md) | ✅ Completed | Trust boundaries, Zod validation, discriminated unions, `never` |
| **Part 05** | [TypeScript Engineering Philosophy](./05-typescript-engineering-philosophy.md) | ⏳ Next | Inference-first, escape hatches, senior trade-off decision making |

---

## 🧠 Practical Competency
Ability to reason about what TypeScript can and cannot guarantee, avoiding false runtime security assumptions.

---

## 🎓 Graduation Criteria
Articulate structural subtyping rules and identify where TypeScript type erasure leaves runtime vulnerabilities.

---

[⬅️ Back to Level 05 Master Hub](../README.md) | [KPI 02: Type System Fundamentals ➡️](../02-Type-System-Fundamentals/README.md)
