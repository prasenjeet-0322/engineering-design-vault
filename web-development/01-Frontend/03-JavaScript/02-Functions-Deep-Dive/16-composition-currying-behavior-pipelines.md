# KPI 02 — Part 16: Function Composition, Partial Application & Currying — Building Functions as Reusable Behavior Pipelines

[⬅️ Part 15: Closures & Memory Retention](./15-closures-lexical-environments-retention.md) | [📚 KPI 02 Index](./README.md) | [Part 17: KPI 2 Master Challenges & Evaluation ➡️](./17-master-challenges-evaluation.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Concept | Core Mechanism | Execution Flow | Memory & Allocation Impact | Senior Production Default |
|---|---|---|---|---|
| **Function Composition (`compose`)** | Mathematical combination $f(g(x))$. | Evaluates **right-to-left** (`reduceRight`). | Pure data transformation; intermediate stack frames. | 🟡 Use for mathematical utilities; avoid deep nesting. |
| **Pipeline Architecture (`pipe`)** | Left-to-right sequential transformation: $x \rightarrow f(x) \rightarrow g(x)$. | Evaluates **left-to-right** (`reduce`). | Minimal intermediate overhead; matches reading order. | 🟢 **Universal Standard** for business data transformations. |
| **Partial Application** | Pre-supplies a subset of arguments ($f(a, b, c) \rightarrow f(b, c)$). | Configuration Phase $\rightarrow$ Execution Phase. | Allocates wrapper closure holding configured values. | 🟢 Preferred over currying for readable utility specialization. |
| **Currying** | Transforms $N$-argument function into $N$ chained unary functions ($f(a)(b)(c)$). | Evaluates in progressive unary stages. | Allocates $N-1$ intermediate function objects and closures. | 🟡 Use selectively for composable transformers; avoid in main app APIs. |
| **`bind()` Partial Application** | Built-in JavaScript method pre-supplying `this` and initial arguments. | Returns exotic bound function object. | Creates new function reference pointer every call. | 🟡 Use for method binding; prefer explicit arrow closures. |
| **Immutable Pipeline** | Transforming data using non-mutating methods (`toSorted`, `filter`, `map`). | Prevents side-effects on original dataset. | Allocates new arrays per stage ($O(k \cdot N)$). | 🟢 **Mandatory in React** to preserve pure component rendering. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotcha: `bind()` Partial Application vs. True Currying
> **Question:** *"Is `const addFive = add.bind(null, 5);` an example of Currying?"*  
> ```js
> function add(a, b) {
>   return a + b;
> }
> 
> // Technique A: bind()
> const addFive = add.bind(null, 5);
> console.log(addFive(10)); // 15
> 
> // Technique B: True Currying
> const curriedAdd = a => b => a + b;
> console.log(curriedAdd(5)(10)); // 15
> ```
> **Deep Architectural Answer:**  
> 1. **No, `add.bind(null, 5)` is NOT currying; it is Partial Application.**  
> 2. `bind()` pre-fills arguments upfront and returns an exotic bound function that still expects the remaining arguments in a single invocation.  
> 3. **True Currying** structurally decomposes an $N$-ary function into a chain of $N$ single-argument (unary) functions ($f(a, b) \rightarrow f(a)(b)$).  
> 4. Both specialize functions, but their invocation models, closure allocation trees, and type signatures are fundamentally different.

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / TypeScript Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Pipeline transformations (`pipe`), non-mutating array chains (`toSorted`), React derived state | Foundational for data sanitization, search filters, formatted displays, and component decoupling. |
| 🟡 **Moderate** | Used in ~25% of code | Currying ($f(a)(b)$), `bind()` partial application, validation builders, specialized event handlers | Critical for utility SDKs, localization formatters, and reusable filter builders. |
| 🔵 **Foundational / Engine** | Runtime internals | Intermediate array allocations, Young-gen GC scavenging, V8 Ignition Stack vs Register optimization | Essential for optimizing high-throughput data tables, preventing Garbage Collection pauses, and Staff interviews. |

---

## Core Concepts (20 Subtopics)

### Part 1 — Function Composition Fundamentals ($f(g(x))$) `🟢 [Daily Driver]`

Function composition combines two or more functions where the output of the inner function directly becomes the input of the outer function:

```js
const double = x => x * 2;
const addOne = x => x + 1;

// f(g(x)) -> addOne(double(5))
const result = addOne(double(5)); // (5 * 2) + 1 = 11
```

---

### Part 2 — Runtime Stack Mechanics of Composition `🔵 [Foundational / Engine]`

```text
CALL STACK TRANSITION:
1. addOne(double(5)) evaluated
2. double(5) Frame pushed ──► Returns primitive 10 ──► Frame popped
3. addOne(10) Frame pushed ──► Returns primitive 11 ──► Frame popped
```
*Primitive numbers are passed directly via CPU registers without allocating persistent Heap objects.*

---

### Part 3 — Composition Flow Model & Single-Responsibility Stages `🟢 [Daily Driver]`

```text
INPUT (Raw Email)
      │
      ▼
┌──────────────────┐
│ normalizeEmail() │ ──► email.trim().toLowerCase()
└──────────────────┘
      │
      ▼
┌──────────────────┐
│ extractDomain()  │ ──► email.split("@")[1]
└──────────────────┘
      │
      ▼
OUTPUT (Clean Domain String)
```

---

### Part 4 — Building a `compose()` Utility (Right-to-Left Evaluation) `🟢 [Daily Driver]`

```js
const compose = (...fns) => (initial) =>
  fns.reduceRight((val, fn) => fn(val), initial);

const transform = compose(addOne, double);
console.log(transform(5)); // double(5) = 10 -> addOne(10) = 11
```

---

### Part 5 — Pipeline Architecture (`pipe()` Left-to-Right Flow) `🟢 [Daily Driver]`

```js
const pipe = (...fns) => (initial) =>
  fns.reduce((val, fn) => fn(val), initial);

const processUser = pipe(
  (email) => email.trim(),
  (email) => email.toLowerCase(),
  (email) => email.split("@")[1]
);
console.log(processUser("  SUNNY@GMAIL.COM  ")); // "gmail.com"
```

---

### Part 6 — React Data Transformation Pipelines & Separation of Concerns `🟢 [Daily Driver]`

```tsx
// ✅ Decouple data transformation from UI rendering:
const normalizeUser = (u: ApiUser) => ({ ...u, email: u.email.trim().toLowerCase() });
const formatName = (u: ApiUser) => ({ ...u, displayName: `${u.firstName} ${u.lastName}`.trim() });

export const transformUser = pipe(normalizeUser, formatName);

export function UserProfile({ rawUser }: { rawUser: ApiUser }) {
  const user = useMemo(() => transformUser(rawUser), [rawUser]);
  return <div>{user.displayName} ({user.email})</div>;
}
```

---

### Part 7 — Partial Application Mechanics & Specialized Factories `🟡 [Moderate]`

```js
function multiply(a, b) { return a * b; }

// Partially applying 'a = 2':
const multiplyByTwo = (b) => multiply(2, b);
console.log(multiplyByTwo(5)); // 10
```

---

### Part 8 — Memory Model of Partially Applied Functions `🔵 [Foundational / Engine]`

```text
HEAP MEMORY MODEL:
multiplyByTwo Function Object @0xA100
  └── [[Environment]] ──► Lexical Context @0xB200 { a: 2 }
```

---

### Part 9 — Currying Transformations ($f(a, b) \rightarrow f(a)(b)$) `🟡 [Moderate]`

```js
const add = a => b => a + b;
const addFive = add(5);
console.log(addFive(10)); // 15
console.log(add(2)(3));   // 5
```

---

### Part 10 — Nested Function Allocation & Multi-Stage Closure Scopes `🔵 [Foundational / Engine]`

```text
curriedAdd(1)(2)(3)
  ├── curriedAdd(1) ──► Allocates Function B (Context { a: 1 })
  ├── Function B(2)  ──► Allocates Function C (Context { a: 1, b: 2 })
  └── Function C(3)  ──► Evaluates a + b + c = 6
```

---

### Part 11 — Currying for Progressive Dependency Configuration `🟢 [Daily Driver]`

```ts
const createRequest = (baseUrl: string) => (token: string) => (path: string) =>
  fetch(`${baseUrl}${path}`, { headers: { Authorization: `Bearer ${token}` } });

const api = createRequest("https://api.enterprise.com")("jwt-token-alpha");
api("/users");
api("/orders");
```

---

### Part 12 — Function Factories vs. Currying (Architectural Intent) `🟢 [Daily Driver]`

- **Factory:** Instantiates a pre-configured service capability (`createLogger("API")`).
- **Currying:** Transforms parameter invocation syntax ($f(a)(b)$).

---

### Part 13 — Combining Composition & Partial Application `🟢 [Daily Driver]`

```js
const withPrefix = prefix => msg => `[${prefix}] ${msg}`;
const toUpper = str => str.toUpperCase();

const formatLog = pipe(
  withPrefix("AUTH"),
  toUpper
);
console.log(formatLog("token expired")); // "[AUTH] TOKEN EXPIRED"
```

---

### Part 14 — Composition in Array Method Chains `🟢 [Daily Driver]`

```js
const users = [
  { name: " Sunny ", active: true },
  { name: "Alex", active: false }
];

const activeUserNames = users
  .filter(u => u.active)
  .map(u => u.name.trim());
console.log(activeUserNames); // ["Sunny"]
```

---

### Part 15 — Derived State Pipelines in React & `useMemo` Guidelines `🟢 [Daily Driver]`

```tsx
// ✅ Immutable pipeline using ES2023 toSorted():
const sortedActiveUsers = useMemo(() => {
  return users
    .filter(user => user.active)
    .toSorted((a, b) => a.name.localeCompare(b.name));
}, [users]);
```

---

### Part 16 — Referential Transparency & Pure Behavioral Pipelines `🟢 [Daily Driver]`

A function is **referentially transparent** if replacing its call with its return value never alters program behavior. Pure functions guarantee testable, bug-free pipelines.

---

### Part 17 — TypeScript Generics in Composition Contracts `🟡 [Moderate]`

```ts
export function pipe2<A, B, C>(
  initial: A,
  fn1: (val: A) => B,
  fn2: (val: B) => C
): C {
  return fn2(fn1(initial));
}
```

---

### Part 18 — React Event Handler Factories vs. Inline Arrow Callbacks `🟡 [Moderate]`

```tsx
// Factory Approach (Partial Application):
const createDeleteHandler = (id: string) => () => onDelete(id);

// Inline Callback (Preferred for standard React readability):
<button onClick={() => onDelete(id)}>Delete</button>
```

---

### Part 19 — Allocation Pressure & V8 Generational Garbage Collection `🔵 [Foundational / Engine]`

Short-lived intermediate functions allocated in pipelines are collected in V8's **Young Generation (Nursery)** during minor GC scavenges without causing UI stutter.

---

### Part 20 — Explicit Arguments vs. Captured Dependencies Decision Tree `🟢 [Daily Driver]`

- **Dynamic per-call value:** Pass as explicit parameter (`fn(data, config)`).
- **Static application setup:** Bind via function factory / partial application (`createFn(config)(data)`).

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### High-Performance E-Commerce Product Filter & Sort Pipeline
```tsx
import React, { useMemo } from 'react';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  inStock: boolean;
}

export interface FilterCriteria {
  category?: string;
  maxPrice?: number;
  inStockOnly?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'name';
}

// ⚡ Composable Transformation 1: Category Filter
const filterByCategory = (category?: string) => (products: Product[]): Product[] =>
  category ? products.filter(p => p.category === category) : products;

// ⚡ Composable Transformation 2: Price Filter
const filterByPrice = (maxPrice?: number) => (products: Product[]): Product[] =>
  maxPrice !== undefined ? products.filter(p => p.price <= maxPrice) : products;

// ⚡ Composable Transformation 3: Stock Filter
const filterByStock = (inStockOnly?: boolean) => (products: Product[]): Product[] =>
  inStockOnly ? products.filter(p => p.inStock) : products;

// ⚡ Composable Transformation 4: Immutable Sort (ES2023 toSorted)
const sortProducts = (sortBy?: FilterCriteria['sortBy']) => (products: Product[]): Product[] => {
  if (!sortBy) return products;
  return products.toSorted((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });
};

// ⚡ Linear Pipeline Assembly
export function executeProductPipeline(products: Product[], criteria: FilterCriteria): Product[] {
  return [
    filterByCategory(criteria.category),
    filterByPrice(criteria.maxPrice),
    filterByStock(criteria.inStockOnly),
    sortProducts(criteria.sortBy)
  ].reduce((acc, fn) => fn(acc), products);
}
```

---

## 🧠 Part 16 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: Composition Order Evaluation
```js
const addTwo = x => x + 2;
const multiplyByThree = x => x * 3;
const result = addTwo(multiplyByThree(4));
console.log(result);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:** `14`  
**Why:** Innermost function evaluates first: `multiplyByThree(4) = 12`, then `addTwo(12) = 14`.
</details>

---

### Prediction Challenge 2: Curried Closure State Retention
```js
const createAdder = a => b => a + b;
const addTen = createAdder(10);
console.log(addTen(5));
console.log(addTen(20));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**
```text
15
30
```
**Why:** `addTen` permanently closes over `a = 10` in its Lexical Context Record on the Heap.
</details>

---

### Prediction Challenge 3: Independent Multiplier Configurations
```js
const createMultiplier = m => v => m * v;
const double = createMultiplier(2);
const triple = createMultiplier(3);
console.log(double(5));
console.log(triple(5));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**
```text
10
15
```
**Why:** Two separate invocations of `createMultiplier` allocate two distinct Heap Context Records holding `m = 2` and `m = 3`.
</details>

---

### Prediction Challenge 4: Two-Stage Partial Application Execution
```js
function createGreeting(prefix) {
  return function greet(name) { return `${prefix}, ${name}`; };
}
const hello = createGreeting("Hello");
console.log(hello("Sunny"));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:** `"Hello, Sunny"`  
**Why:** Stage 1 captures `prefix = "Hello"`. Stage 2 receives `name = "Sunny"` and evaluates the string concatenation.
</details>

---

### Prediction Challenge 5: React Handler Re-allocation
```tsx
function Parent() {
  const [count, setCount] = useState(0);
  const handler = () => console.log(count);
  return <Child onAction={handler} />;
}
```
*After `count` changes, what happens to `handler`?*

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Result:** A brand-new `handler` function object is allocated (`handlerA !== handlerB`). It captures the updated `count` value from the new render snapshot.
</details>

---

### Prediction Challenge 6: Pipeline Array Mutation Trap
```js
const sorted = users.filter(u => u.active).sort((a, b) => a.name.localeCompare(b.name));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Analysis:** While `.filter()` returns a new intermediate array so `users` is not mutated, `.sort()` mutates its target array in place. To ensure pure immutability, always prefer `.toSorted()`.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is the difference between `pipe` and `compose`?  
<details>
<summary><strong>Answer</strong></summary>
Both chain functions together by passing the output of one function as the input to the next. `pipe` evaluates **left-to-right** (matching standard reading order), while `compose` evaluates **right-to-left** (matching mathematical $f(g(x))$ notation).
</details>

**Q2:** Why does `[...arr].sort()` or `arr.toSorted()` matter in React state transformations?  
<details>
<summary><strong>Answer</strong></summary>
Because `Array.prototype.sort()` mutates the array in-place. Mutating existing state directly prevents React from detecting state changes (breaking pure component rendering) and introduces side-effects. `toSorted()` returns a new sorted copy without mutating the original.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** What is the architectural difference between Partial Application and Currying?  
<details>
<summary><strong>Answer</strong></summary>
- **Partial Application:** Fixes a subset of arguments upfront ($f(a, b, c) \rightarrow f(b, c)$), returning a function that accepts the remaining arguments in a single call.  
- **Currying:** Decomposes a multi-argument function into a chain of unary functions ($f(a, b, c) \rightarrow f(a)(b)(c)$), requiring one argument per invocation.
</details>

**Q4:** When should a team use a Pipeline (`pipe`) instead of chaining native array methods?  
<details>
<summary><strong>Answer</strong></summary>
Use `pipe` when combining custom domain functions with differing signatures, performing complex object transformations, or integrating asynchronous operations. Use native array chaining (`.filter().map()`) for standard list transformations where built-in readability is already optimal.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** How does function allocation in render pipelines impact garbage collection in V8?  
<details>
<summary><strong>Answer</strong></summary>
Intermediate functions created during pipeline execution reside in V8's **Nursery (Young Generation)**. V8 uses a **Scavenger garbage collector** that reclaims short-lived objects with sub-millisecond pauses. Function allocation is only an issue when it triggers `React.memo` prop bailouts or occurs in high-frequency 60fps animation loops.
</details>

**Q6:** How do you preserve strict TypeScript type inference across a dynamic multi-stage `pipe` function?  
<details>
<summary><strong>Answer</strong></summary>
By declaring overloaded function signatures using generic type parameters that chain output to input:
```ts
function pipe<A, B, C>(val: A, fn1: (x: A) => B, fn2: (x: B) => C): C;
```
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q7:** What are the architectural tradeoffs between Heavy Functional Currying (e.g. Ramda style) and Service Object APIs in enterprise frontend codebases?  
<details>
<summary><strong>Answer</strong></summary>
1. **Heavy Currying:** Maximizes composability in point-free pipelines, but introduces steep cognitive overhead, cryptic TypeScript error messages, poor IDE autocomplete, and $O(N)$ intermediate closure allocations.  
2. **Service Object APIs:** Provides optimal discoverability, clean method autocomplete (`client.get()`), simple debugging stack traces, and cohesive lifecycle management. Production enterprise applications universally favor explicit service objects and configuration dictionaries over heavy currying.
</details>

---

## 🛠️ Senior Architecture Challenge: Configured API Layer

```js
// See runnable implementation in examples/16-composition-currying-behavior-pipelines.js
```

---

## Key Takeaways
1. **`pipe` for Reading Order:** Prefer left-to-right pipelines for business data workflows.
2. **Partial Application for Specialization:** Pre-bind static configuration while leaving dynamic parameters open.
3. **Immutability First:** Always use non-mutating transformations (`toSorted`) in React derived state.
4. **Avoid Over-Abstraction:** Never force currying where an explicit configuration object is clearer.
5. **Generational GC Handles Functions:** Do not prematurely optimize short-lived pipeline functions without profiling.

---

[⬅️ Part 15: Closures & Memory Retention](./15-closures-lexical-environments-retention.md) | [📚 KPI 02 Index](./README.md) | [Part 17: KPI 2 Master Challenges & Evaluation ➡️](./17-master-challenges-evaluation.md)
