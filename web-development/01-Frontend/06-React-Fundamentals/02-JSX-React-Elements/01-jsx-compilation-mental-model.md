# Level 06 — React Fundamentals
# KPI 02 — JSX & React Elements
## PART 01 — JSX Mental Model & Compilation Mechanics

[📚 KPI 02 Index](./README.md) | [🧪 Lab 01](./examples/01-jsx-runtime-ast-visualizer-lab.html) | [Part 02: React Element Objects & Immutability ➡️](./02-element-objects-immutability.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

# 🧭 PART POSITION & OBJECTIVE

```text
JSX Source Code (AST) ──▶ Compiler Transformation ──▶ _jsx() / createElement() ──▶ Plain V8 JS Object Tree
```

By the end of Part 01, you will mechanically master:
1. Why JSX is pure ECMAScript syntactic sugar and how browsers actually parse JavaScript.
2. The mechanical difference between Legacy `React.createElement` and Modern `react/jsx-runtime` (Automatic Runtime).
3. How compiler AST tokens map JSX attributes, children, and dynamic expressions into function arguments.
4. Why statements (`if/for`) are illegal inside JSX expression slots while expressions (`ternary/map`) succeed.

---

# LAYER 1 — ⚡ 30-SECOND EXECUTIVE CHEAT SHEET

## 1. Mental Equation
$$\text{JSX}(\text{tag}, \text{props}, \text{children}) \xrightarrow{\text{Transpile}} \_jsx(\text{tag}, \{ \dots\text{props}, \text{children} \}) \xrightarrow{\text{Evaluate}} \mathcal{O}_{\text{V8}}(\text{ReactElement})$$

## 2. Executive Concept Matrix

| Concept | What It Is | Production Impact | Common Senior Trap |
| :--- | :--- | :--- | :--- |
| **JSX Syntax** | Syntactic sugar for function invocations. | Zero runtime overhead compared to raw function calls; processed entirely at build time. | Confusing JSX with template strings or DOM strings (`innerHTML`). |
| **`react/jsx-runtime`** | Modern compiler output format (React 17+). | Eliminates `import React from 'react'`, optimizes props/children allocations. | Assuming React is in global scope or importing unused React symbols. |
| **`React.createElement`** | Legacy compiler target. | Separate `(type, props, ...children)` arguments; creates arguments array slice overhead. | Writing manual `createElement` trees without understanding prop forwarding. |
| **Expression Slots `{}`** | Delimited ECMAScript expression evaluation. | Runs in current lexical scope on every render pass; constructs fresh references if inline. | Believing `{}` creates a new closure scope or reactive isolate. |

## 3. The Golden Rule
> **"JSX is never parsed by the browser DOM engine; it is purely compiler-transpiled into standard JavaScript factory calls that instantiate plain, immutable V8 objects."**

---

# LAYER 2 — 🔬 DEEP MECHANICAL BREAKDOWN

*(Full 15-Pillar mechanical breakdown to be authored during execution phase)*
- Section 2.1: The Compiler Pipeline (Babel / SWC / esbuild AST Transformation)
- Section 2.2: Classic (`React.createElement`) vs Modern (`react/jsx-runtime`) Runtime Comparison
- Section 2.3: Lowercase (Intrinsic DOM) vs Uppercase (User-defined Component) Resolution Mechanics
- Section 2.4: Expressions vs Statements inside JSX Slots

---

# LAYER 3 — 🧪 DIAGNOSTIC LABS & DEVTOOLS RUNBOOKS

*(Full diagnostic instrumentation runbook & interactive lab sandbox in `examples/01-jsx-runtime-ast-visualizer-lab.html`)*

---

# LAYER 4 — 🔥 THE CRUCIBLE

*(Prediction challenges, production incident teardowns, invariant axioms, and senior technical interview defense)*

---

[📚 KPI 02 Index](./README.md) | [🧪 Lab 01](./examples/01-jsx-runtime-ast-visualizer-lab.html) | [Part 02: React Element Objects & Immutability ➡️](./02-element-objects-immutability.md)
