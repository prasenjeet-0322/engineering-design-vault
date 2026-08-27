# KPI 02 — Part 7: Higher-Order Functions, Callbacks & Functional Composition

[⬅️ Part 6: Recursion & Execution Limits](./06-recursion-call-stack-limits.md) | [📚 KPI 02 Index](./README.md) | [Part 8: `this`, Methods & Class Semantics ➡️](./08-this-methods-classes.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Concept | Core Mechanism | Execution Flow & Lifecycle | Memory & Identity | Production Best Practice |
|---|---|---|---|---|
| **Callback** | Function passed into another function for deferred invocation. | Inversion of Control: callee controls execution timing. | Retains `[[Environment]]` of creation scope. | 🟢 Essential for UI event handlers, custom hooks, and array operations. |
| **Higher-Order Function (HOF)** | Accepts or returns other functions. | Intercepts, wraps, or specializes function execution. | Allocates closure environment context on Heap. | 🟢 Use for middleware, auth decorators, and declarative array transforms. |
| **Function Composition (`compose`)** | Chains functions where output of $g(x)$ feeds input to $f(x)$ ($f \circ g$). | Evaluates **right-to-left** (`reduceRight`). | Pure data flow without shared intermediate variables. | 🟡 Use for declarative data normalization; avoid hiding complex side-effects. |
| **Pipeline (`pipe`)** | Chains functions **left-to-right** ($g \circ f$). | Evaluates sequentially (`reduce`). | Pure data transformation steps. | 🟡 Preferred over `compose` for readable business workflows. |
| **Currying** | Transforms $f(a, b, c)$ into $f(a)(b)(c)$. | Returns chained unary functions holding captured closures. | Allocates nested Heap closure frames. | 🟡 Use for configurable utility factories (e.g. `hasRole('admin')(user)`). |
| **Partial Application** | Pre-fills a subset of function arguments. | Returns a specialized function expecting remaining arguments. | Retains pre-filled arguments in closure. | 🟡 API clients with pre-filled baseUrl or auth headers. |
| **Middleware Pipeline** | Nested HOF onion model (`next => ctx => ...`). | Intercepts requests before and after downstream handlers. | Preserves middleware chain in execution scope. | 🟢 Redux middleware, Express routing, Next.js request pipelines. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotcha: Passing Function Reference vs Passing Invocation Result
> **Question:** *"What is the runtime difference between `setTimeout(greet, 1000)` and `setTimeout(greet(), 1000)`?"*  
> ```js
> function greet() {
>   console.log("Hello");
>   return "GREETED";
> }
> 
> // Line A:
> setTimeout(greet, 1000);   // ✅ Passes function pointer; executes after 1000ms
> 
> // Line B:
> setTimeout(greet(), 1000); // ❌ Invokes greet() IMMEDIATELY, passes return value "GREETED"
> ```
> **Deep Architectural Answer:**  
> 1. `greet` evaluates to the **Function Object reference pointer** (`0xA101`). The timer runtime stores this pointer and schedules its execution for 1000ms later.  
> 2. `greet()` contains the invocation operator `()`. JavaScript evaluates `greet()` immediately on the current synchronous Call Stack, printing `"Hello"` and returning `"GREETED"`.  
> 3. `setTimeout("GREETED", 1000)` is then scheduled. When the timer expires, the runtime attempts to invoke a string as a callback, failing silently or throwing in strict environments.  
> 4. **The Senior Standard:** In React JSX, `<button onClick={handleClick}>` passes a callback; `<button onClick={handleClick()}>` triggers immediate execution during render, causing infinite render loops if state updates occur!

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / TypeScript Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Array methods (`.map()`, `.filter()`, `.reduce()`), callback props (`onDelete(id)`), `useCallback`, functional updaters | Foundational for component state, declarative data transformations, and React event systems. |
| 🟡 **Moderate** | Used in ~25% of code | Functional composition (`compose`/`pipe`), currying, middleware, `once()` decorators | Critical for Redux/Zustand middleware, API client factories, and data transformation layers. |
| 🔵 **Foundational / Engine** | Runtime internals | Intermediate array allocations in HOF chains, closure retention heap footprint, V8 call site ICs | Essential for high-throughput pipeline optimizations, preventing GC thrashing, and Staff interviews. |

---

## Core Concepts (21 Subtopics)

### Part 1 — Functions as First-Class Values & Memory Pointers `🟢 [Daily Driver]`

```js
const greet = function () { return "Hello"; };
const alias = greet; // Both identifiers hold identical Heap pointer 0xA101
console.log(greet === alias); // true
```

---

### Part 2 — Callback Functions & Inversion of Control `🟢 [Daily Driver]`

A callback delegates execution timing to the receiving callee:

```js
function processUser(user, callback) {
  const normalized = { ...user, name: user.name.trim() };
  callback(normalized); // Callee decides WHEN to invoke callback
}
```

---

### Part 3 — Callback Reference vs. Callback Invocation `🔵 [Foundational / Engine]`

```js
function execute(fn) { return fn; }
function sayHi() { return "Hi"; }

console.log(typeof execute(sayHi));   // "function" (Reference passed)
console.log(typeof execute(sayHi())); // "string"   (Invocation evaluated first)
```

---

### Part 4 — Higher-Order Functions & Authentication Wrappers `🟢 [Daily Driver]`

```ts
function withAuth<TArgs extends unknown[], TReturn>(
  handler: (user: User, ...args: TArgs) => TReturn
) {
  return (user: User | null, ...args: TArgs): TReturn => {
    if (!user) throw new Error("401 Unauthorized");
    return handler(user, ...args);
  };
}
```

---

### Part 5 — `map()` as a Declarative HOF `🟢 [Daily Driver]`

`map()` transforms an array into a new array. It allocates a new array container, but elements retain their original object references unless explicitly cloned:

```js
const users = [{ id: 1, name: "Sunny" }, { id: 2, name: "Alex" }];
const names = users.map(u => u.name); // ['Sunny', 'Alex']
```

---

### Part 6 — `filter()` as a Predicate Selection Pipeline `🟢 [Daily Driver]`

```js
const activeUsers = users.filter(u => u.active); // Shallow copy of matching elements
```

---

### Part 7 — `reduce()` & Accumulator Architecture `🟡 [Moderate]`

```js
// Converting array to normalized lookup map:
const userMap = users.reduce((acc, user) => {
  acc[user.id] = user; // Controlled mutation of newly created accumulator is safe
  return acc;
}, {});
```

> **Warning:** Never pass existing React state as the initial value to `reduce()`, as mutating it will violate React's state immutability invariant.

---

### Part 8 — Function Composition (`compose`) `🟡 [Moderate]`

Mathematically represents $f(g(x))$, executing **right-to-left**:

```js
const compose = (...fns) => (initial) =>
  fns.reduceRight((val, fn) => fn(val), initial);

const trim = s => s.trim();
const lowercase = s => s.toLowerCase();
const sanitizeEmail = compose(lowercase, trim);

console.log(sanitizeEmail(" Sunny@Demo.COM ")); // "sunny@demo.com"
```

---

### Part 9 — Pipeline Style (`pipe`) `🟡 [Moderate]`

Executes **left-to-right**, aligning with natural reading order:

```js
const pipe = (...fns) => (initial) =>
  fns.reduce((val, fn) => fn(val), initial);

const processInput = pipe(trim, lowercase);
console.log(processInput(" Alex@Dev.IO ")); // "alex@dev.io"
```

---

### Part 10 — Currying (Chained Unary Functions) `🟡 [Moderate]`

```js
const multiply = (a) => (b) => a * b;
const double = multiply(2);
console.log(double(10)); // 20
```

---

### Part 11 — Partial Application `🟡 [Moderate]`

```js
function createLogger(level, message) {
  console.log(`[${level}] ${message}`);
}
const errorLogger = (msg) => createLogger("ERROR", msg);
errorLogger("Database timeout"); // "[ERROR] Database timeout"
```

---

### Part 12 — Closure-Based Function Factories & Custom Hooks `🟢 [Daily Driver]`

```ts
export function createApiClient(baseUrl: string) {
  return async function request<T>(path: string): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`);
    return res.json();
  };
}
```

---

### Part 13 — Callback Identity & `React.memo` Prop Equality `🟢 [Daily Driver]`

```tsx
// Every render creates a new handleClick instance (0xA101 !== 0xB202), bailing out React.memo!
function Parent() {
  const handleClick = () => console.log("Clicked");
  return <MemoizedChild onClick={handleClick} />;
}
```

---

### Part 14 — `useCallback` Mechanics & Tradeoffs `🟢 [Daily Driver]`

`useCallback` caches the **function reference pointer** across renders as long as dependencies match:

```tsx
const handleSave = useCallback(() => {
  saveData(userId);
}, [userId]); // Only updates pointer if userId changes
```

---

### Part 15 — Middleware as Function Composition Pipelines `🟢 [Daily Driver]`

```js
const loggerMiddleware = (next) => async (ctx) => {
  console.log("Before request:", ctx.path);
  const result = await next(ctx);
  console.log("After request");
  return result;
};
```

---

### Part 16 — Closure Retention & Memory Cleanup `🔵 [Foundational / Engine]`

If a long-lived callback retains an outer variable, that entire scope stays alive in Heap memory:

```tsx
useEffect(() => {
  const handler = () => console.log(largeData.length);
  window.addEventListener("resize", handler);
  // ✅ Cleanup is mandatory to drop GC reference:
  return () => window.removeEventListener("resize", handler);
}, [largeData]);
```

---

### Part 17 — Event Listener Reference Equality Mismatches `🟢 [Daily Driver]`

```js
// ❌ FAILS: Anonymous arrow functions have different pointers; listener is never removed:
window.addEventListener("click", () => log());
window.removeEventListener("click", () => log());

// ✅ FIX: Retain identical function pointer in variable:
const onClick = () => log();
window.addEventListener("click", onClick);
window.removeEventListener("click", onClick);
```

---

### Part 18 — `once()` Function Decorator & Closure State `🟢 [Daily Driver]`

```js
function once(fn) {
  let executed = false;
  let result;
  return (...args) => {
    if (!executed) {
      executed = true;
      result = fn(...args);
    }
    return result;
  };
}
```

---

### Part 19 — Functional State Updates (`setCount(prev => prev + 1)`) `🟢 [Daily Driver]`

```tsx
// ✅ Stable Callback: Omits 'count' dependency entirely!
const increment = useCallback(() => {
  setCount(prev => prev + 1);
}, []);
```

---

### Part 20 — Callback Hell vs. Structured Async Flows `🟡 [Moderate]`

```js
// Modern Promise / Async-Await pipeline:
async function loadUserData(id) {
  const user = await fetchUser(id);
  const orders = await fetchOrders(user.id);
  return await fetchPayment(orders[0].id);
}
```

---

### Part 21 — TypeScript Generic Wrappers (`Parameters<T>`, `ReturnType<T>`) `🟡 [Moderate]`

```ts
export function withTiming<T extends (...args: any[]) => any>(
  fn: T,
  label: string
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>): ReturnType<T> => {
    const start = performance.now();
    try {
      return fn(...args);
    } finally {
      console.log(`[${label}] took ${(performance.now() - start).toFixed(2)}ms`);
    }
  };
}
```

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### E-Commerce Order Processing Pipeline with Memoization & Abortable Requests
```tsx
import React, { useState, useMemo, useCallback } from 'react';

export interface Order {
  id: string;
  total: number;
  status: "pending" | "completed" | "cancelled";
  createdAt: string;
}

// ⚡ Pure, testable pipeline transformation steps:
const filterCompleted = (orders: Order[]): Order[] => 
  orders.filter(o => o.status === "completed");

const calculateTotalRevenue = (orders: Order[]): number => 
  orders.reduce((sum, o) => sum + o.total, 0);

export function OrderDashboard({ rawOrders }: { rawOrders: Order[] }) {
  const [currency, setCurrency] = useState<"USD" | "INR">("INR");

  // ✅ useMemo: Prevents re-running pipeline unless rawOrders changes
  const { completedOrders, totalRevenue } = useMemo(() => {
    const completed = filterCompleted(rawOrders);
    const revenue = calculateTotalRevenue(completed);
    return { completedOrders: completed, totalRevenue: revenue };
  }, [rawOrders]);

  // ✅ useCallback: Stable handler for memoized child items
  const handleExport = useCallback(() => {
    console.log(`Exporting ${completedOrders.length} orders totaling ₹${totalRevenue}`);
  }, [completedOrders.length, totalRevenue]);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-slate-100">
      <h2 className="text-xl font-bold">Order Metrics</h2>
      <p className="mt-2 text-emerald-400">Total Revenue: ₹{totalRevenue.toLocaleString()}</p>
      <p className="text-slate-400">Completed Orders: {completedOrders.length}</p>

      <button 
        onClick={handleExport}
        className="mt-4 rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500"
      >
        Export Metrics
      </button>
    </div>
  );
}
```

---

## 🧠 Part 7 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: Synchronous Callback Execution
```js
function run(cb) {
  console.log("A");
  cb();
  console.log("C");
}
run(() => console.log("B"));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:** `A -> B -> C`  
**Why:** The callback is invoked synchronously inside `run()`, so `"B"` executes before `run()` proceeds to `"C"`.
</details>

---

### Prediction Challenge 2: Array HOF Transformation Pipeline
```js
const users = [{ id: 1, active: true }, { id: 2, active: false }];
const result = users.filter(u => u.active).map(u => ({ ...u, role: "member" }));
console.log(result);
console.log(users);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**
```js
// result:
[{ id: 1, active: true, role: "member" }]
// users (Original unchanged):
[{ id: 1, active: true }, { id: 2, active: false }]
```
**Why:** `filter` creates a new array with matching references. `map` spread `{ ...u }` creates a brand-new object for each item, leaving `users` completely untouched.
</details>

---

### Prediction Challenge 3: React Callback Identity across Renders
```tsx
function Parent() {
  const [count, setCount] = useState(0);
  const handleClick = () => console.log("Clicked");
  return <button onClick={() => setCount(count + 1)} />;
}
```
*When `count` updates, does `handleClick` maintain reference equality?*

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Result:** `false` (`prevHandleClick !== nextHandleClick`)  
**Why:** Every render executes the component function body again, creating a brand-new arrow function object on the Heap with a distinct memory address.
</details>

---

### Prediction Challenge 4: `once()` Closure State Retention
```js
function once(fn) {
  let called = false;
  return (...args) => {
    if (!called) { called = true; return fn(...args); }
  };
}
const init = once(() => console.log("Initialized"));
init(); init(); init();
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:** `"Initialized"` (Logged only once!)  
**Why:** The closure retains the mutable `called` binding across invocations. The first call sets `called = true`; subsequent calls return `undefined`.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is the difference between passing a function reference (`onClick={handleClick}`) and calling a function (`onClick={handleClick()}`) in React?  
<details>
<summary><strong>Answer</strong></summary>
Passing `handleClick` gives React the function memory pointer to invoke when the user clicks. Calling `handleClick()` executes the function immediately during component rendering, passing its return value to `onClick` and potentially triggering infinite render loops.
</details>

**Q2:** What does the `reduce()` method do in JavaScript?  
<details>
<summary><strong>Answer</strong></summary>
`reduce(callback, initialValue)` executes an accumulator function on each element of an array, returning a single accumulated result (e.g. summing numbers or grouping items into an object).
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** What is the difference between Currying and Partial Application?  
<details>
<summary><strong>Answer</strong></summary>
- **Currying:** Transforms a function with $N$ arguments into a chain of $N$ unary functions (each taking exactly 1 argument): $f(a)(b)(c)$.  
- **Partial Application:** Fixes a subset of arguments upfront, returning a function that accepts the remaining arguments: $f(a, b)(c, d)$.
</details>

**Q4:** What is the difference between `compose` and `pipe`?  
<details>
<summary><strong>Answer</strong></summary>
Both chain functions together. `compose` executes **right-to-left** ($f(g(x))$ using `reduceRight`), while `pipe` executes **left-to-right** ($g(f(x))$ using `reduce`), matching natural English reading order.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** In large data transformations (e.g. 5,000,000 items), why can chaining `.filter().map().reduce()` cause performance bottlenecks, and what is the senior alternative?  
<details>
<summary><strong>Answer</strong></summary>
Each chained method creates a complete intermediate array on the Heap, leading to massive memory allocations ($O(N)$ extra space per step) and triggering frequent V8 Garbage Collection Scavenger/Mark-Sweep pauses (GC thrashing).  
*Senior Alternative:* Use a single `for...of` loop or a custom Transducer/Generator pipeline to process all transformations in a single pass without intermediate array allocations.
</details>

**Q6:** How do you preserve TypeScript types when building higher-order wrapper functions?  
<details>
<summary><strong>Answer</strong></summary>
By using TypeScript generics constrained to function signatures (`<T extends (...args: any[]) => any>`) and utilizing the utility types `Parameters<T>` and `ReturnType<T>` so that the returned wrapper preserves the exact input and output type contracts.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q7:** How does V8's Ignition and TurboFan optimize Higher-Order Function callback dispatch, and how does the Redux/Express middleware pattern impact the JIT call-stack inline cache?  
<details>
<summary><strong>Answer</strong></summary>
When an HOF passes callbacks through a middleware pipeline (`next => action => ...`), TurboFan analyzes the **Call Site Feedback Vector**. If the middleware chain is statically configured and dispatch order is deterministic (Monomorphic), TurboFan inlines the entire middleware pipeline into a single contiguous machine code block, eliminating function call frame allocation overhead. If dynamic middleware is injected at runtime causing Megamorphic dispatch, TurboFan de-optimizes and falls back to indirect C++ pointer calls.
</details>

---

## 🛠️ Senior Architecture Challenge: 5-Million Order Data Pipeline

```js
// See runnable implementation in examples/07-higher-order-functions-composition.js
```

---

## Key Takeaways
1. **Pass Reference, Not Invocation:** Use `fn` to defer execution; `fn()` invokes immediately.
2. **`pipe` over `compose`:** Prefer left-to-right `pipe` pipelines for readable domain workflows.
3. **Controlled Mutation in `reduce`:** Mutating an accumulator created inside the reducer is safe; mutating external state is an anti-pattern.
4. **Preserve TypeScript Contracts:** Use `Parameters<T>` and `ReturnType<T>` in generic HOF wrappers.
5. **Beware Intermediate Allocations:** Avoid deep `.filter().map()` chains on massive datasets; use single-pass loops or transducers.

---

[⬅️ Part 6: Recursion & Execution Limits](./06-recursion-call-stack-limits.md) | [📚 KPI 02 Index](./README.md) | [Part 8: `this`, Methods & Class Semantics ➡️](./08-this-methods-classes.md)
