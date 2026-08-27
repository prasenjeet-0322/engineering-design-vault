# KPI 02 — Functions Deep Dive

[⬅️ KPI 01 — Fundamentals Refresh](../01-Fundamentals-Refresh/README.md) | [📚 JavaScript Index](../README.md) | [KPI 03 — Scope & Hoisting ➡️](../03-Scope-Hoisting-TDZ/README.md)

---

## 🗺️ Master KPI 02 Architecture & Parts

| Part | Title | Master Guide | Key Engineering Concepts Covered | Status |
|---|---|---|---|---|
| **Part 1** | Function Architecture, Declarations & First-Class Functions | [01-function-architecture-declarations-expressions.md](./01-function-architecture-declarations-expressions.md) | Runtime function objects, Call Stack frames, Hoisting setup vs TDZ, Function identity across React renders, `useCallback` | 🟢 Complete |
| **Part 2** | Parameters, Arguments & Return Semantics | [02-parameters-arguments-return.md](./02-parameters-arguments-return.md) | Default params, Rest (`...args`), Argument evaluation order, Pass-by-value of pointers, Return semantics, TypeScript contracts | 🟢 Complete |
| **Part 3** | Arrow Functions vs Traditional Functions | [03-arrow-vs-regular-functions.md](./03-arrow-vs-regular-functions.md) | Lexical `this`, `arguments` absence, `prototype` omission, Non-constructible, Object literal return syntax, React handlers | 🟢 Complete |
| **Part 4** | Higher-Order Functions & Callbacks | [04-higher-order-functions-callbacks.md](./04-higher-order-functions-callbacks.md) | Functions as values, Inversion of control, Synchronous vs async callbacks, Array HOFs, Function wrappers, Event listeners | 🟢 Complete |
| **Part 5** | Closures & Lexical Environment Retention | [05-closures-lexical-retention.md](./05-closures-lexical-retention.md) | Lexical environment capture, Memory retainers & GC reachability, Stale closures in React, `useEffect` sync | 🟢 Complete |
| **Part 6** | Recursion, Call Stack & Function Execution Limits | [06-recursion-call-stack-limits.md](./06-recursion-call-stack-limits.md) | Base cases, Stack frames & unwinding, `RangeError` overflow, DFS vs BFS, Explicit array stacks, Cycle protection | 🟢 Complete |
| **Part 7** | Higher-Order Functions, Callbacks & Composition | [07-higher-order-functions-composition.md](./07-higher-order-functions-composition.md) | Composition (`compose`/`pipe`), Currying, Partial application, Middleware pipelines, `once()` decorator, TypeScript wrappers | 🟢 Complete |
| **Part 8** | `this`, Method Binding, Constructors & Class Semantics | [08-this-methods-classes.md](./08-this-methods-classes.md) | Dynamic call-site `this`, `call`/`apply`/`bind`, Arrow lexical `this`, Prototype vs Arrow field memory, Constructor `new` | 🟢 Complete |
| **Part 9** | Closures, Lexical Environments & Stateful Architecture | [09-closures-stateful-architecture.md](./09-closures-stateful-architecture.md) | Lexical records, V8 context lifting, Stale render closures, `useLatest` bridge, Module singletons, Abortable search | 🟢 Complete |
| **Part 10** | Higher-Order Functions, Callbacks & Declarative Architecture | [10-higher-order-functions-declarative-architecture.md](./10-higher-order-functions-declarative-architecture.md) | Currying, Pipeline (`pipe`), Middleware onion dispatch, Wrapper order semantics, Async retry and timing | 🟢 Complete |
| **Part 11** | Recursion, Call Stack Limits & Architecture | [11-recursion-call-stack-architecture.md](./11-recursion-call-stack-architecture.md) | Logical termination vs stack safety, Tree virtualization, DFS/BFS queues, Memoization caches, Main-thread chunking | 🟢 Complete |
| **Part 12** | Currying, Partial Application & Function Factories | [12-currying-partial-application-factories.md](./12-currying-partial-application-factories.md) | Separation of configuration and execution phases, DI, Service objects, Memory retainers, React factory memoization | 🟢 Complete |
| **Part 13** | Higher-Order Functions, Callbacks & Pipeline Architecture | [13-higher-order-functions-pipeline-architecture.md](./13-higher-order-functions-pipeline-architecture.md) | Inversion of control, Onion middleware, Async pipelines, Receiver preservation, Explicit orchestration | 🟢 Complete |
| **Part 14** | `this`, Invocation Context, Binding & Method Extraction | [14-this-invocation-context-binding.md](./14-this-invocation-context-binding.md) | Dynamic call-site context, `call`/`apply`/`bind`, Arrow immutability, Method extraction bugs, Event listener leaks | 🟢 Complete |
| **Part 15** | Closures, Lexical Environments & Memory Retention | [15-closures-lexical-environments-retention.md](./15-closures-lexical-environments-retention.md) | Lexical records, Factory isolation, Stale render closures, `useLatest` bridge, Network race cancellation | 🟢 Complete |
| **Part 16** | Function Composition, Currying & Behavior Pipelines | [16-composition-currying-behavior-pipelines.md](./16-composition-currying-behavior-pipelines.md) | Sequential transforms, `compose` vs `pipe`, Partial application vs currying, Immutable `toSorted`, React pipelines | 🟢 Complete |
| **Part 17** | `this` Binding, Execution Context & Invocation | [17-this-execution-context-invocation.md](./17-this-execution-context-invocation.md) | Call-site receiver, Method extraction stripping, Strict mode, Arrow lexical resolution, Inline caches | 🟢 Complete |
| **Part 18** | Advanced Function Patterns: IIFEs, Generators & Async | [18-advanced-function-patterns-iterators-async.md](./18-advanced-function-patterns-iterators-async.md) | IIFEs, Iterator protocol, Generators (`function*`), Async/await, Microtasks, `for await...of` streaming | 🟢 Complete |
| **Part 19** | KPI 2 Master Challenges & Evaluation | [19-master-challenges-evaluation.md](./19-master-challenges-evaluation.md) | Multi-part prediction challenges, active recall, Tiered Interview Question Bank | 🟡 Upcoming |

---

## 📁 Runnable Code Examples (`examples/`)

- [`examples/01-function-architecture-identity.js`](./examples/01-function-architecture-identity.js): Demonstrates function declaration vs expression hoisting, TDZ error catching, factory function recreation, and `React.memo` / `useCallback` render bailout simulation.
- [`examples/02-parameters-arguments-contracts.js`](./examples/02-parameters-arguments-contracts.js): Demonstrates left-to-right argument evaluation, dynamic default parameter execution, pass-by-value vs parameter reassignment, and pure structural sharing state updates.
- [`examples/03-arrow-vs-regular-functions.js`](./examples/03-arrow-vs-regular-functions.js): Demonstrates expression body vs block body semantics, lexical `this` resolution, constructor rejection (`TypeError`), prototype omission, and React list memoization bailouts.
- [`examples/04-higher-order-functions-callbacks.js`](./examples/04-higher-order-functions-callbacks.js): Demonstrates function reference passing vs invocation result traps, sync vs async callback flow, function telemetry wrappers, and async retry HOF with backoff.
- [`examples/05-closures-lexical-retention.js`](./examples/05-closures-lexical-retention.js): Demonstrates live binding mutation vs snapshots, independent factory scopes, loop closure scopes (`let` vs `var`), and `useLatest` poller bridge simulation.
- [`examples/06-recursion-call-stack-limits.js`](./examples/06-recursion-call-stack-limits.js): Demonstrates stack growth vs unwinding, explicit LIFO array stack traversal, recursive closures, circular graph cycle guards, and virtual tree flattening.
- [`examples/07-higher-order-functions-composition.js`](./examples/07-higher-order-functions-composition.js): Demonstrates reference passing vs invocation result gotchas, compose vs pipe pipelines, currying, `once()` decorators, middleware chains, and single-pass transformers.
- [`examples/08-this-methods-classes.js`](./examples/08-this-methods-classes.js): Demonstrates method extraction receiver loss, explicit binding (`call`/`apply`/`bind`), `bind()` immutability, prototype vs arrow field memory sharing, and analytics tracker teardown.
- [`examples/09-closures-stateful-architecture.js`](./examples/09-closures-stateful-architecture.js): Demonstrates live binding mutation in factories, independent instances, private bank accounts, module cache singletons, and debounced abortable search managers.
- [`examples/10-higher-order-functions-declarative-architecture.js`](./examples/10-higher-order-functions-declarative-architecture.js): Demonstrates curried factories, pipe vs compose evaluation, telemetry wrappers, function identity differences, and composable API client middleware.
- [`examples/11-recursion-call-stack-architecture.js`](./examples/11-recursion-call-stack-architecture.js): Demonstrates stack growth downward vs unwinding upward logs, circular graph cycle detection with Set, recursive closure state retention, DFS traversal order, and virtualized file tree flattening.
- [`examples/12-currying-partial-application-factories.js`](./examples/12-currying-partial-application-factories.js): Demonstrates function factory reference identity checks, independent factory scopes, partial application mutation traps, and multi-tenant API clients.
- [`examples/13-higher-order-functions-pipeline-architecture.js`](./examples/13-higher-order-functions-pipeline-architecture.js): Demonstrates detached method receiver loss & arrow/bind fixes, synchronous callback flow, wrapper identity checks, pipeline error short-circuiting, and onion middleware dispatch.
- [`examples/14-this-invocation-context-binding.js`](./examples/14-this-invocation-context-binding.js): Demonstrates method extraction receiver loss, call-site receivers, object literal arrow traps, bind function identity checks, constructor context capture, and listener leak fixes.
- [`examples/15-closures-lexical-environments-retention.js`](./examples/15-closures-lexical-environments-retention.js): Demonstrates independent factory scopes, shared sibling closures, functional state updates, and async race condition elimination with AbortController.
- [`examples/16-composition-currying-behavior-pipelines.js`](./examples/16-composition-currying-behavior-pipelines.js): Demonstrates bind partial application vs currying, compose right-to-left evaluation, curried closure state, independent multipliers, immutable sorting, and e-commerce filter pipelines.
- [`examples/17-this-execution-context-invocation.js`](./examples/17-this-execution-context-invocation.js): Demonstrates detached method receiver loss, call-site receivers, object literal arrow traps, bind instance identity checks, and canvas drawing controllers with safe handlers.
- [`examples/18-advanced-function-patterns-iterators-async.js`](./examples/18-advanced-function-patterns-iterators-async.js): Demonstrates await microtask ordering, IIFE evaluations, generator suspensions, parallel async calls, and paginated async generator streams.

---

## 🎯 How to Use This Module
1. Study each part sequentially to build a firm runtime mental model of functions as heap-allocated execution units.
2. Run and experiment with the verification scripts in `examples/` using Node.js (`node examples/01-...js`).
3. Solve the tiered interview questions (Intern ➔ Staff / Principal) inside each part's collapsible sections before expanding solutions.
