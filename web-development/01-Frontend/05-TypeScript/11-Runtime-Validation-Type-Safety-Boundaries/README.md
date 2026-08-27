# KPI 11 — Runtime Validation & Type Safety Boundaries

[⬅️ Back to Level 05 Master Hub](../README.md)

---

## 🎯 Purpose
Establish strict architectural boundaries between unvalidated external data (APIs, LocalStorage, User Input) and typed internal domain models.

---

## 🗺️ Core Scope
- The Type Boundary Pattern: External Data → Validation → Trusted Typed Data
- Runtime validation vs Compile-time static checking
- Schema validation with Zod / Valibot / ArkType
- Inferring TypeScript types from schemas (z.infer<typeof Schema>)
- Environment variable, API payload, and form validation architecture

---

## 🧠 Practical Competency
Build end-to-end type-safe data pipelines that validate runtime data before exposing it to application logic.

---

## 🎓 Graduation Criteria
Build an API client that parses raw JSON payloads with Zod, throwing runtime validation errors while inferring strict static types.
