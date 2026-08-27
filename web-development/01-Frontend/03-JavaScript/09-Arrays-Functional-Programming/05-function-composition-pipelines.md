# KPI 09 — Part 05: Function Composition, `compose()`, `pipe()` & Transformation Pipelines

[⬅️ Part 04: Declarative Data Transformation](./04-declarative-data-transformation-map-filter-reduce.md) | [📚 KPI 09 Index](./README.md) | [Part 06: Currying & Partial Application ➡️](./06-currying-partial-application.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Mechanism | Execution Order | Core Implementation | Senior Production Rule |
|---|---|---|---|
| **`pipe(f, g, h)`** | **Left ➔ Right** ($f \to g \to h$) | `funcs.reduce((res, fn) => fn(res), val)` | 🟢 **Preferred Standard**: Matches natural human reading order of data transformation. |
| **`compose(f, g, h)`** | **Right ➔ Left** ($h \to g \to f$) | `funcs.reduceRight((res, fn) => fn(res), val)` | 🟡 Traditional mathematical notation ($f(g(h(x)))$); common in Redux middleware. |
| **Unary Rule** | Single argument in/out ($T \to U$) | All pipeline stages must expect exactly **one** input. | 🔴 Multi-argument functions must be curried or wrapped before passing to `pipe()`. |
| **`tap(sideEffect)`** | Pass-through spy | `(fn) => (val) => { fn(val); return val; }` | 🟢 Ideal for telemetry, logging, and debugging without breaking pipeline flow. |
| **`pipeAsync()`** | Asynchronous sequential | `for (const fn of funcs) val = await fn(val)` | 🟢 Use for asynchronous pipelines (e.g. Fetch $\to$ Parse $\to$ Validate $\to$ Save). |
| **Over-Composition** | Anti-Pattern | Splitting simple 1-line operations into 20 tiny files. | 🔴 Only extract functions that have reusable meaning or independent testability. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotcha: The Unary Arity Trap in `pipe()`
> **Question:** *"Why does the following pipeline fail or produce `NaN`, and what is the required architectural fix?"*  
> ```js
> const multiply = (a, b) => a * b;
> const addTen = (x) => x + 10;
> 
> // ❌ BROKEN: multiply expects TWO arguments, but pipe passes only ONE intermediate value!
> const calculate = pipe(multiply, addTen);
> console.log(calculate(5, 4)); // Returns NaN!
> ```
> **Deep Architectural Answer:**  
> 1. Standard `pipe()` passes the output of stage $N$ as the **single first argument** to stage $N+1$.  
> 2. When `calculate(5, 4)` is called, `pipe` executes `multiply(5)` with `b = undefined`. `5 * undefined` evaluates to `NaN`.  
> 3. `NaN` is then passed into `addTen(NaN)`, producing `NaN + 10 = NaN`. The second argument `4` is completely lost!  
> 4. **The Senior Standard (Unary Function Design):** All functions in a composition pipeline must be **unary** (accepting exactly one argument). Multi-argument functions must be configured beforehand via higher-order function factories or currying:  
> ```js
> const multiplyBy = (factor) => (x) => x * factor;
> const calculate = pipe(multiplyBy(4), addTen);
> console.log(calculate(5)); // (5 * 4) + 10 = 30 (Correct!)
> ```

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / TypeScript Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | API DTO $\to$ ViewModel normalization, Form input sanitize pipelines, Redux middleware composition | Essential for breaking monolithic data handlers into small, pure, unit-testable transformation steps. |
| 🟡 **Moderate** | Used in ~25% of code | Custom `pipeAsync` async fetch pipelines, `tap` logging interceptors, functional schema validators | Critical for building robust data ingestion pipelines and domain entities. |
| 🔵 **Foundational / Engine** | Runtime internals | Call stack frame allocation overhead, TurboFan JIT function inlining of unary compositions | Essential for understanding compiler optimizations, reducing GC allocations, and Staff evaluations. |

---

## Core Concepts (20 Subtopics)

### Part 1 — The Mathematical Foundation of Composition `🟢 [Daily Driver]`

In mathematics, function composition $(g \circ f)(x) = g(f(x))$ combines two functions such that the output of $f$ is fed directly into $g$.

---

### Part 2 — Function Input/Output Type Compatibility Contracts `🟢 [Daily Driver]`

For two functions $f: A \to B$ and $g: B \to C$ to compose, the return type $B$ of the first function must strictly satisfy the input parameter type expected by the second function.

---

### Part 3 — Nested Invocations vs. Declarative Pipelines `🟢 [Daily Driver]`

- **Nested (`h(g(f(x)))`):** Reads inside-out, obscuring transformation order as depth increases.
- **Pipeline (`pipe(f, g, h)(x)`):** Reads top-to-bottom / left-to-right, matching cognitive data flow.

---

### Part 4 — `compose()`: Right-to-Left Evaluation `🟢 [Daily Driver]`

```js
const compose = (...fns) => val => fns.reduceRight((res, fn) => fn(res), val);
```
Executes the last function first, matching mathematical notation and Redux's `compose` helper.

---

### Part 5 — `pipe()`: Left-to-Right Evaluation `🟢 [Daily Driver]`

```js
const pipe = (...fns) => val => fns.reduce((res, fn) => fn(res), val);
```
Executes the first function first, providing superior readability for frontend data transformation flows.

---

### Part 6 — `compose()` vs. `pipe()` Comparison `🟢 [Daily Driver]`

Both utilities perform identical computational work; the sole difference is parameter declaration order. `pipe()` is the industry default for modern frontend application pipelines.

---

### Part 7 — Unary Function Design Rule `🟢 [Daily Driver]`

Because pipeline stages pass intermediate results as a single value, every composable function must be **unary** (accepting exactly one parameter $T \to U$).

---

### Part 8 — Configurable Pipeline Stages via Higher-Order Factories `🟢 [Daily Driver]`

```js
const filterByCategory = category => items => items.filter(i => i.category === category);
const pipeline = pipe(filterByCategory('TECH'), formatSummary);
```

---

### Part 9 — Type-Shifting Pipelines (`T -> U -> V -> W`) `🟢 [Daily Driver]`

Pipelines do not require uniform types across all stages. A pipeline can transform `Product[]` $\to$ `number[]` $\to$ `number` $\to$ `string`.

---

### Part 10 — The `tap()` Combinator: Non-Destructive Interception `🟢 [Daily Driver]`

```js
const tap = effect => val => { effect(val); return val; };
const pipeline = pipe(sanitizeInput, tap(console.log), processData);
```
Executes side effects (analytics, logging) while transparently returning the unmodified value to the next stage.

---

### Part 11 — Reusable Sub-Pipelines `🟢 [Daily Driver]`

Pipelines are themselves functions. Smaller pipelines can be composed inside larger pipelines without boilerplate.

---

### Part 12 — Error Propagation & Exception Boundaries `🔴 [Production-Critical]`

If any function in a synchronous `pipe` throws an exception, pipeline execution terminates immediately. Wrap critical pipelines in try-catch boundaries or use Result/Either monads.

---

### Part 13 — Handling `null` / `undefined` in Pipelines `🟢 [Daily Driver]`

Prevent `TypeError: Cannot read properties of undefined` by adding a sanitizing or guard stage at the beginning of the pipeline (`val ?? fallback`).

---

### Part 14 — Asynchronous Composition: `pipeAsync()` `🟢 [Daily Driver]`

```js
const pipeAsync = (...fns) => async val => {
  let res = val;
  for (const fn of fns) res = await fn(res);
  return res;
};
```

---

### Part 15 — Composition vs. OOP Class Inheritance `🟢 [Daily Driver]`

Composition models software behavior as independent data transformations, avoiding rigid base class hierarchies and the fragile base class problem.

---

### Part 16 — Real-World API Response Normalization `🟢 [Daily Driver]`

Pipelines provide an explicit architectural boundary between external raw API DTO shapes and clean internal UI ViewModels.

---

### Part 17 — The Over-Composition Pitfall `🔴 [Production-Critical]`

Avoid creating separate files and functions for trivial single-use operations (`const addOne = x => x + 1`). Compose at meaningful domain boundaries.

---

### Part 18 — Debugging Pipelines `🟢 [Daily Driver]`

Debug long pipelines by inserting `tap(debugger)` or temporary `console.log` taps to inspect intermediate values without rewriting code structure.

---

### Part 19 — TypeScript Strongly-Typed Pipe Signatures `🔵 [Foundational / Engine]`

TypeScript enforces type continuity across stages using function overloads:
```ts
function pipe<A, B, C>(f1: (a: A) => B, f2: (b: B) => C): (a: A) => C;
```

---

### Part 20 — 10-Point Senior Composition Architecture Checklist `🟢 [Daily Driver]`

```text
1. Are all functions passed into pipe() strictly unary (accepting one argument)?
2. Are multi-argument functions converted into unary factories before composition?
3. Is pipe() chosen over deeply nested inside-out function calls (f(g(h(x))))?
4. Are input/output types strictly compatible between every adjacent pipeline stage?
5. Are side effects isolated using tap() or pushed to the outer imperative shell?
6. Are asynchronous operations composed using pipeAsync() or Promise chains?
7. Is null/undefined handled gracefully with fallback guard stages?
8. Are trivial operations kept inlined rather than fragmented into unnecessary micro-functions?
9. Can each individual stage function be unit-tested in total isolation with zero mocks?
10. Is pipe() used to normalize raw backend API DTOs into clean frontend UI ViewModels?
```

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Product Search, Filter & Normalization Pipeline
```tsx
import React, { useMemo, useState } from 'react';

export interface RawApiProduct {
  id: string;
  raw_title: string;
  unit_price: number;
  category: 'ELECTRONICS' | 'FURNITURE' | 'APPAREL';
  in_stock: boolean;
}

export interface UiProductViewModel {
  id: string;
  title: string;
  formattedPrice: string;
  categoryBadge: string;
}

/**
 * 🟢 PURE UNARY TRANSFORMATION UTILITIES
 */
const pipe = <T>(...fns: Array<(arg: any) => any>) => (initialValue: T) =>
  fns.reduce((val, fn) => fn(val), initialValue);

// Configurable HOF filter factories
export const filterInStock = (products: readonly RawApiProduct[]) =>
  products.filter((p) => p.in_stock);

export const filterByCategory = (category: string) => (products: readonly RawApiProduct[]) =>
  category === 'ALL' ? products : products.filter((p) => p.category === category);

export const filterBySearch = (query: string) => (products: readonly RawApiProduct[]) => {
  const q = query.trim().toLowerCase();
  return q ? products.filter((p) => p.raw_title.toLowerCase().includes(q)) : products;
};

export const sortByPrice = (products: readonly RawApiProduct[]) =>
  products.toSorted((a, b) => a.unit_price - b.unit_price);

export const projectToViewModel = (products: readonly RawApiProduct[]): UiProductViewModel[] =>
  products.map((p) => ({
    id: p.id,
    title: p.raw_title.trim(),
    formattedPrice: `$${p.unit_price.toFixed(2)}`,
    categoryBadge: `[${p.category}]`
  }));

/**
 * 🟢 COMPOSED SEARCH & FILTER PIPELINE
 */
export function buildProductPipeline(category: string, query: string) {
  return pipe<readonly RawApiProduct[]>(
    filterInStock,
    filterByCategory(category),
    filterBySearch(query),
    sortByPrice,
    projectToViewModel
  );
}

export function ProductCatalog() {
  const [category, setCategory] = useState('ALL');
  const [search, setSearch] = useState('');

  const rawProducts: RawApiProduct[] = [
    { id: '1', raw_title: '  Ultra-Wide Monitor ', unit_price: 499, category: 'ELECTRONICS', in_stock: true },
    { id: '2', raw_title: 'Ergonomic Desk Chair', unit_price: 250, category: 'FURNITURE', in_stock: true },
    { id: '3', raw_title: 'Mechanical Keyboard', unit_price: 120, category: 'ELECTRONICS', in_stock: false },
    { id: '4', raw_title: 'Noise Cancelling Headphones', unit_price: 300, category: 'ELECTRONICS', in_stock: true }
  ];

  // Composed pipeline memoized on filter dependencies
  const visibleProducts = useMemo(() => {
    const pipeline = buildProductPipeline(category, search);
    return pipeline(rawProducts);
  }, [rawProducts, category, search]);

  return (
    <div className="catalog-container">
      <h3>Product Catalog (Composed Pipeline Architecture)</h3>
      <div className="controls">
        <input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="ALL">All Categories</option>
          <option value="ELECTRONICS">Electronics</option>
          <option value="FURNITURE">Furniture</option>
        </select>
      </div>

      <ul className="product-list">
        {visibleProducts.map((p) => (
          <li key={p.id}>
            <span>{p.categoryBadge}</span> <strong>{p.title}</strong> — {p.formattedPrice}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 🧠 Part 05 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: `compose` vs `pipe` Order of Operations
```js
const addTwo = x => x + 2;
const triple = x => x * 3;

const composeCalc = compose(addTwo, triple);
const pipeCalc = pipe(addTwo, triple);

console.log("compose(addTwo, triple)(4):", composeCalc(4));
console.log("pipe(addTwo, triple)(4):", pipeCalc(4));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
compose(addTwo, triple)(4): 14
pipe(addTwo, triple)(4): 18
```
**Why:**  
- `compose` evaluates right-to-left: $(4 \times 3) + 2 = 12 + 2 = 14$.  
- `pipe` evaluates left-to-right: $(4 + 2) \times 3 = 6 \times 3 = 18$.
</details>

---

### Prediction Challenge 2: `tap` Combinator Inspection
```js
let logCount = 0;
const tap = effect => val => { effect(val); return val; };

const process = pipe(
  x => x + 10,
  tap(val => { logCount++; }),
  x => x * 2
);

const res = process(5);
console.log("Result:", res);
console.log("Log Count:", logCount);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Result: 30
Log Count: 1
```
**Why:** `tap` executes the side-effect callback (`logCount++`) while returning the input `15` transparently to the next stage, which doubles it to `30`.
</details>

---

### Prediction Challenge 3: Asynchronous Composition with `pipeAsync`
```js
const fetchScore = async id => id * 10;
const addBonus = async score => score + 50;
const format = score => `FINAL_${score}`;

const getScore = pipeAsync(fetchScore, addBonus, format);
getScore(5).then(console.log);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
FINAL_100
```
**Why:** `pipeAsync` awaits intermediate Promises sequentially: $5 \to 50 \to 100 \to \text{"FINAL\_100"}$.
</details>

---

### Prediction Challenge 4: Type-Shifting Pipeline Flow
```js
const getLength = str => str.length;
const isEven = n => n % 2 === 0;
const booleanToString = b => b ? "YES" : "NO";

const checkWord = pipe(getLength, isEven, booleanToString);

console.log(checkWord("REACT"));
console.log(checkWord("CODE"));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
NO
YES
```
**Why:**  
- `"REACT"`: length $5 \to$ even $false \to \text{"NO"}$.  
- `"CODE"`: length $4 \to$ even $true \to \text{"YES"}$.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is function composition, and how does `pipe()` differ from `compose()`?  
<details>
<summary><strong>Answer</strong></summary>
Function composition is the process of combining multiple pure functions where the output of one function serves as the input to the next. The difference lies in execution order:
- `compose(f, g, h)(x)` evaluates right-to-left: $f(g(h(x)))$.
- `pipe(f, g, h)(x)` evaluates left-to-right: $h(g(f(x)))$.
`pipe()` is generally preferred in modern frontend development because it matches the natural reading order of data flow.
</details>

**Q2:** What is a "Unary Function", and why is it mandatory for function composition?  
<details>
<summary><strong>Answer</strong></summary>
A unary function is a function that accepts exactly one argument. It is mandatory for composition because a pipeline stage receives only a single intermediate result from the preceding stage. Functions with multiple arguments must be curried or converted into single-argument factories prior to composition.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** What is the purpose of the `tap()` functional combinator?  
<details>
<summary><strong>Answer</strong></summary>
`tap()` is a higher-order utility that allows executing a side effect (such as logging, debugging, or sending telemetry) on an intermediate value in a pipeline without modifying the value. It runs the effect function and returns the original, unmodified value to the next pipeline stage.
</details>

**Q4:** How do you handle asynchronous functions inside a composition pipeline?  
<details>
<summary><strong>Answer</strong></summary>
Synchronous `pipe()` cannot handle Promises because it immediately passes unresolved Promise objects into subsequent synchronous functions. Asynchronous pipelines require an asynchronous composer (`pipeAsync`) that iterates through each function, `await`ing the result of each stage before passing it to the next, returning a final resolved Promise.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** What are the trade-offs between a `pipe()` transformation pipeline and standard object-oriented Method Chaining (Fluent Interface)?  
<details>
<summary><strong>Answer</strong></summary>
- **Method Chaining (`data.filter().map().sort()`):** Limited strictly to methods already attached to the object's prototype. It tightly couples data to a specific class and prevents tree-shaking of unused methods.  
- **`pipe()` Pipeline:** Fully decoupled. Any standalone pure function can be plugged into the pipeline without modifying prototypes, enabling complete tree-shaking, easy unit testing, and dynamic pipeline configuration at runtime.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How do you design an enterprise-grade TypeScript generic `pipe` function with type-safety and compile-time type inference across varying stage types?  
<details>
<summary><strong>Answer</strong></summary>
Because TypeScript cannot infer arbitrary variable-length chain types from a generic rest parameter without losing type safety, a production TypeScript `pipe` is implemented using function overloads:
```ts
export function pipe<A>(val: A): A;
export function pipe<A, B>(fn1: (a: A) => B): (a: A) => B;
export function pipe<A, B, C>(fn1: (a: A) => B, fn2: (b: B) => C): (a: A) => C;
export function pipe<A, B, C, D>(fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D): (a: A) => D;
export function pipe(...fns: Array<(arg: any) => any>) {
  return (initial: any) => fns.reduce((res, fn) => fn(res), initial);
}
```
This guarantees compile-time type errors if the output type of stage $N$ does not match the input parameter type of stage $N+1$.
</details>

---

## 🛠️ Senior Architecture Challenge: Enterprise Product Search & Filter Engine

```js
// See runnable implementation in examples/05-function-composition-pipelines.js
```

---

## Key Takeaways
1. **Compose Small Functions:** Build complex data workflows from focused, single-purpose units.
2. **`pipe()` Follows Human Reading Order:** Left-to-right execution matches data flow.
3. **Respect the Unary Rule:** All pipeline stages must expect one input argument.
4. **Use `tap()` for Spying:** Inspect intermediate values without mutating the stream.
5. **Enforce Type Compatibility:** Output type of step $N$ must match input type of step $N+1$.

---

[⬅️ Part 04: Declarative Data Transformation](./04-declarative-data-transformation-map-filter-reduce.md) | [📚 KPI 09 Index](./README.md) | [Part 06: Currying & Partial Application ➡️](./06-currying-partial-application.md)
