# ⚡ Level 03: JavaScript Core & Engine Internals

[⬅️ Level 02: CSS & Modern Layout](../02-CSS-Modern-Layout/README.md) | [📚 Frontend Master Hub](../README.md) | [Level 04: Browser Internals ➡️](../04-Browser-Internals-Web-Platform/README.md)

---

Welcome to the **JavaScript Engineering Knowledge Vault**. JavaScript is a vast, runtime-driven language running on complex browser engines (V8, SpiderMonkey, JavaScriptCore) with memory heaps, call stacks, microtask queues, and garbage collection lifecycles.

To ensure **zero compromise on technical depth and quality**, every KPI in this level is structured as an **independent module directory** containing:
1. **`README.md`**: The comprehensive Master Engineering Reference (V8 Mechanics, Memory Diagrams, 4-Pillar Decision Matrices, React Patterns, and Full Challenge Solutions).
2. **`examples/` & Code Snippets**: Standalone, runnable JavaScript code examples, edge-case proofs, and benchmark scripts.
3. **Deep-Dive Subtopic Notes**: Dedicated architectural guides for multi-faceted topics (e.g. Memory profiling, Event Loop step tracing, Promise combinators).

---

## 🗺️ Learning Map & KPI Index

| # | KPI Directory | Master Reference | Key Architectural Focus | Status |
|---|---|---|---|---|
| **01** | `01-Fundamentals-Refresh` | [README.md](./01-Fundamentals-Refresh/README.md) | Primitives vs References, Memory allocation, Coercion, Equality | 🟡 Ready for Content |
| **02** | `02-Functions-Deep-Dive` | [README.md](./02-Functions-Deep-Dive/README.md) | First-Class, Higher-Order, Arrow vs Declarations, Callbacks | 🟡 Ready for Content |
| **03** | `03-Scope-Hoisting-TDZ` | [README.md](./03-Scope-Hoisting-TDZ/README.md) | Lexical Scope, Variable Environment, TDZ, Shadowing | 🟡 Ready for Content |
| **04** | `04-Execution-Context-Call-Stack` | [README.md](./04-Execution-Context-Call-Stack/README.md) | Creation vs Execution phase, Stack frames, Recursion limit | 🟡 Ready for Content |
| **05** | `05-This-Keyword-Binding` | [README.md](./05-This-Keyword-Binding/README.md) | Implicit/Explicit binding, `call()`, `apply()`, `bind()`, Arrow `this` | 🟡 Ready for Content |
| **06** | `06-Objects-Internals` | [README.md](./06-Objects-Internals/README.md) | Property Descriptors, Hidden Classes, Shallow vs Deep Copy | 🟡 Ready for Content |
| **08** | `08-Iterators-Generators` | [README.md](./08-Iterators-Generators/README.md) | Protocols, Generators, `yield*`, Async Streams, Coroutines | 🟢 Complete |
| **08-FP** | `09-Arrays-Functional-Programming` | [README.md](./09-Arrays-Functional-Programming/README.md) | Pure Functions, Immutability, HOFs, Currying, Monads, Architecture | 🟢 Complete |
| **09** | `09-Arrays-Data-Manipulation` | [README.md](./09-Arrays-Data-Manipulation/README.md) | `map`, `filter`, `reduce`, `sort`, `flatMap`, Method Chaining, Immutability | 🟡 In Progress |
| **10** | `10-Error-Handling-Debugging` | [README.md](./10-Error-Handling-Debugging/README.md) | Error boundaries, Stack traces, Breakpoints, Async errors | 🟡 Ready for Content |
| **11** | `11-Async-Foundations` | [README.md](./11-Async-Foundations/README.md) | Non-blocking I/O, Web APIs, Timers, Callback queue | 🟡 Ready for Content |
| **12** | `12-Promises-Concurrency` | [README.md](./12-Promises-Concurrency/README.md) | Promise lifecycle, Microtasks, `all`, `allSettled`, `race`, `any` | 🟡 Ready for Content |
| **13** | `13-Async-Await` | [README.md](./13-Async-Await/README.md) | Generator transformation, Parallel vs Sequential, Error cascades | 🟡 Ready for Content |
| **14** | `14-Event-Loop-Microtasks` | [README.md](./14-Event-Loop-Microtasks/README.md) | Macrotasks vs Microtasks, Render scheduling, `queueMicrotask` | 🟡 Ready for Content |
| **15** | `15-DOM-Fundamentals` | [README.md](./15-DOM-Fundamentals/README.md) | DOM Tree, Reflow/Repaint, `DocumentFragment`, `dataset` | 🟡 Ready for Content |
| **16** | `16-Events-Delegation` | [README.md](./16-Events-Delegation/README.md) | Capturing, Bubbling, Event Delegation, Custom Events | 🟡 Ready for Content |
| **17** | `17-Forms-Validation` | [README.md](./17-Forms-Validation/README.md) | `FormData`, Constraint Validation API, Input sanitization | 🟡 Ready for Content |
| **18** | `18-Browser-Storage-Security` | [README.md](./18-Browser-Storage-Security/README.md) | `localStorage`, `sessionStorage`, Cookies, XSS & CSRF hygiene | 🟡 Ready for Content |
| **19** | `19-APIs-Networking-Fetch` | [README.md](./19-APIs-Networking-Fetch/README.md) | HTTP, Headers, `fetch()`, `AbortController`, Request pooling | 🟡 Ready for Content |
| **20** | `20-Modules-ESM` | [README.md](./20-Modules-ESM/README.md) | ES Modules, Static analysis, Tree-shaking, Dynamic imports | 🟡 Ready for Content |
| **21** | `21-Classes-OOP` | [README.md](./21-Classes-OOP/README.md) | Private fields (`#`), `extends`, `super`, Composition over Inheritance | 🟢 Complete |
| **22** | `22-Asynchronous-JavaScript` | [README.md](./22-Asynchronous-JavaScript/README.md) | Runtime, Call Stack, Event Loop, Microtasks, Promises, async/await | 🟢 Complete |
| **22-GC** | `22-Memory-Garbage-Collection` | [README.md](./22-Memory-Garbage-Collection/README.md) | Mark-and-Sweep, WeakMap/WeakSet, Memory leak diagnostics | 🟡 Ready for Content |
| **23** | `23-Advanced-Design-Patterns` | [README.md](./23-Advanced-Design-Patterns/README.md) | Factory, Module, Observer, Pub/Sub, Strategy, Debounce, Throttle | 🟢 Complete |
| **24** | `24-Performance-Profiling` | [README.md](./24-Performance-Profiling/README.md) | Long Tasks, Web Workers, DOM Batching, DevTools Profiling | 🟡 Ready for Content |
| 🏁 | `25-Graduation-Project` | [README.md](./25-Graduation-Project/README.md) | Production-Grade Vanilla JS Application Architecture | 🟡 Milestone |

---

## 🏛️ Directory Structure Template for Each KPI

```text
01-Fundamentals-Refresh/
├── README.md                # The Complete Master Engineering Guide
└── examples/
    ├── 01-primitives-vs-references.js
    ├── 02-coercion-equality-matrix.js
    └── 03-modern-operators.js
```

---

## 🔬 Master Architectural Standard Applied to Every Module:

1. **⚡ 30-Second Executive Cheat Sheet:** High-density summary table of runtime rules, types, and traps.
2. **🎯 Senior Interview Gotcha (`> [!CAUTION]`):** The #1 classic runtime trick question asked in Staff/Senior rounds.
3. **Underlying Runtime Mechanics:** V8 memory allocation, execution context creation phases, prototype lookup trees, microtask scheduling.
4. **⚖️ 4-Pillar Senior Engineering Decision Matrix:**
   - **✅ When to Use**
   - **❌ When NOT to Use (Anti-patterns & Traps)**
   - **⚠️ Bottlenecks & Tradeoffs (Memory Leaks, Blocking Event Loop, Prototype Pollution)**
   - **🚀 Modern Leverages (Optional Chaining, Nullish Coalescing, AbortController, WeakMap)**
5. **⚛️ Senior React Ecosystem Architecture:** Connecting core JS mechanics directly to React hooks, state batching, closures in `useEffect`, and custom hook lifecycles.
6. **Integrated Code Challenges:** Verbatim question sets with full step-by-step solutions inside `<details>`.
