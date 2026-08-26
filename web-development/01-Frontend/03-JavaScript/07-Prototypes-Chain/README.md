# KPI 07 — Prototypes & Prototype Chain

[⬅️ KPI 06 — Objects & Internals](../06-Objects-Internals/README.md) | [📚 JavaScript Index](../README.md) | [KPI 08 — Closures ➡️](../08-Closures-Lexical-Environments/README.md)

---

## Overview
*Status: 🟡 Ready for Master Content & Evaluation.*

---

## 🎯 Learning Objectives
- The `__proto__` internal slot vs the function `prototype` property.
- The Prototype Lookup Chain (`obj.prop` $\rightarrow$ `__proto__` $\rightarrow$ `Object.prototype` $\rightarrow$ `null`).
- Constructor functions, the `new` operator mechanics, and prototype delegation.
- Prototypal inheritance with `Object.create()`.
- ES6 Classes as syntactic abstraction over prototype delegation.
- Prototype pollution vulnerabilities and defense strategies (`Object.create(null)`).
