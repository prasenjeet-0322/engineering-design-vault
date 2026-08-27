# KPI 01 — Part 2: Data Types & Type Behavior

[⬅️ Part 1: Variables & Assignment](./01-variables-values-assignment.md) | [📚 KPI 01 Index](./README.md) | [Part 3: Equality & Boolean Logic ➡️](./03-equality-boolean-logic.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Data Type | Category | `typeof` Return | Memory / Engine Characteristics | Production Default / Traps |
|---|---|---|---|---|
| **`string`** | Primitive | `"string"` | Immutable textual glyphs; V8 optimizes via Ropes & ConsStrings. | 🟢 Avoid massive concatenation in loops; use template literals. |
| **`number`** | Primitive | `"number"` | IEEE 754 64-bit float; V8 optimizes integers as SMIs (Small Integers). | 🟢 Beware `0.1 + 0.2 !== 0.3` and `typeof NaN === "number"`. |
| **`boolean`** | Primitive | `"boolean"` | Binary logic (`true` / `false`); 1-byte / tagged slot. | 🟢 Never check strings like `"false"` (non-empty strings are truthy). |
| **`undefined`** | Primitive | `"undefined"` | Uninitialized variable or missing property; engine default. | 🟢 Represents unintentional absence / optional fields. |
| **`null`** | Primitive | ⚠️ `"object"` | Intentional absence of an object pointer; historical type-tag bug. | 🟢 Check via `val === null` or `val ?? fallback`. |
| **`bigint`** | Primitive | `"bigint"` | Arbitrary precision integer; cannot mix with numbers without casting. | 🟡 For crypto, blockchain, and 64-bit IDs (`> 2^53 - 1`). |
| **`symbol`** | Primitive | `"symbol"` | Globally unique runtime identifier; non-enumerable key by default. | 🟡 Language protocol hooks (`Symbol.iterator`, metadata). |
| **Object (`{}`)** | Reference | `"object"` | Heap-allocated dynamic hash/shape with Prototype delegation. | 🟢 Referential identity; mutability; needs `Object.freeze()`. |
| **Array (`[]`)** | Reference | ⚠️ `"object"` | Continuous/Holey elements backing store on Heap. | 🟢 **Never check with `typeof`**; use `Array.isArray(val)`. |
| **Function** | Callable Ref | `"function"` | First-class executable object with Scope & Prototype pointers. | 🟢 Callable; preserves closure lexical environments. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotcha: Why is `typeof null === "object"`?
> **Question:** *"Why does `typeof null` return `'object'`, and why is `typeof val === 'object'` a major production bug for checking plain objects?"*  
> **Deep Architectural Answer:**  
> 1. In the initial JavaScript implementation (1995), values were stored with a **Type Tag** in their low-order bits. The tag `000` represented an **Object pointer reference**. Because `null` was represented as the NULL pointer (`0x00` in memory), its type tag bits were `000`, causing `typeof` to mistakenly return `"object"`. This historical bug is permanently preserved in the ECMAScript spec for web backward compatibility.  
> 2. **The Production Trap:** `typeof val === 'object'` returns `true` for **`null`**, **Arrays (`[]`)**, **`Date`**, **`RegExp`**, and **`Map`/`Set`**.  
> 3. **The Senior Standard:**  
>    ```js
>    // Robust plain object validation
>    const isPlainObject = (val) => 
>      val !== null && typeof val === 'object' && !Array.isArray(val) && val.constructor === Object;
>    ```

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / TypeScript Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | `string`, `number`, `boolean`, `null`, `undefined`, `Array.isArray()`, plain objects | Foundational for component props, API payloads, form state, and schema validation. |
| 🟡 **Moderate** | Used in ~20% of code | `bigint`, `symbol`, `Number.isNaN()`, floating-point integer math | Critical for monetary calculations (paise/cents), unique symbol keys, and 64-bit entity IDs. |
| 🔵 **Foundational / Engine** | Runtime internals | V8 SMI tagging, Rope string allocations, IEEE 754 precision, Hidden Class shapes | Crucial for performance profiling, avoiding JIT de-optimizations, and Staff interview depth. |

---

## Core Concepts (9 Subtopics)

### Part 1 — Primitive Values & Dynamic Typing `🟢 [Daily Driver]`

#### Definition & Engine Mechanics
JavaScript is **dynamically typed**: variables are identifier bindings, while the **values themselves carry runtime type semantics**.

```js
let data = "frontend"; // Holds string value
data = 42;             // Rebound to number value
data = true;           // Rebound to boolean value
```

```text
Execution Context Frame
┌──────────────────────────────┐
│ Lexical Environment          │
│                              │
│ data ──────────────┐         │
└────────────────────│─────────┘
                     │
Initial assignment   ▼
                 ["frontend"] (string)
                     │
Later reassignment   ▼
                 [42] (number / SMI)
                     │
Later reassignment   ▼
                 [true] (boolean)
```

#### ⚖️ Senior Engineering Decision Matrix: Dynamic Typing
- **✅ When to Use:** Generic utility wrappers, JSON serialization boundaries, polymorphic UI components.
- **❌ Anti-Pattern:** Allowing untrusted dynamic types to flow unvalidated through your core application domain (`any`-soup).
- **🚀 Modern Leverage:** Use **TypeScript** for static compile-time developer contracts paired with runtime validation (**Zod / Valibot**) at network boundaries.

---

### Part 2 — `string` (Immutability & V8 Allocation) `🟢 [Daily Driver]`

#### Definition & Engine Mechanics
A string is an **immutable primitive sequence of UTF-16 code units**.
- Any string method (`toUpperCase()`, `slice()`, `replace()`) produces a **brand-new string allocation in memory**; it cannot mutate characters in-place.
- In V8, string concatenations are optimized as **ConsStrings (Ropes)**—a binary tree of string pointers—avoiding immediate flat memory copies until flattening is required.

```js
const role = "engineer";
const upper = role.toUpperCase(); // Allocates a new string "ENGINEER"
console.log(role); // "engineer" (Original remains untouched)
```

#### ⚖️ Senior Engineering Decision Matrix: Strings
- **✅ When to Use:** Textual UI content, URLs, route params, search queries, localized labels.
- **⚠️ Bottleneck:** Repeated `str += chunk` in massive loops creates deep Rope trees. Use array joins (`chunks.join('')`) or streams for high-throughput buffering.

---

### Part 3 — `number`, `NaN`, & Floating-Point Reality `🟢 [Daily Driver]`

#### Definition & Engine Mechanics
JavaScript numbers are **IEEE 754 Double-Precision (64-bit) binary floats**.
- **The Floating-Point Hazard:** $0.1 + 0.2 = 0.30000000000000004$ because fractions with prime denominators other than $2$ cannot be represented exactly in binary floating-point.
- **`NaN` (Not-a-Number):** The only value in JavaScript that is **not equal to itself** (`NaN === NaN` is `false`).

```js
console.log(typeof NaN); // "number" ⚠️
console.log(Number.isNaN("hello")); // false (Correct: does not coerce)
console.log(isNaN("hello"));        // true  (Legacy: coercively converts "hello" -> NaN)
```

#### ⚖️ Senior Engineering Decision Matrix: Numbers
- **✅ When to Use Standard Numbers:** UI counters, pagination, layout measurements, percentages.
- **❌ Financial Anti-Pattern:** Never calculate currency using raw floating-point numbers (`$19.99 + $0.10`).
- **🚀 The Senior Leverage:** Represent monetary amounts as **Integer minor units** (e.g. ₹10.50 as `1050` paise or $19.99 as `1999` cents) to maintain perfect integer arithmetic.

---

### Part 4 — `bigint` (Arbitrary-Precision Integers) `🟡 [Moderate]`

#### Definition & Engine Mechanics
`bigint` represents integers of arbitrary magnitude beyond `Number.MAX_SAFE_INTEGER` ($2^{53} - 1 = 9{,}007{,}199{,}254{,}740{,}991$).

```js
const largeId = 9007199254740993n;
console.log(typeof largeId); // "bigint"

// ❌ Type Mixing Trap:
// const total = largeId + 10; // TypeError: Cannot mix BigInt and other types
const total = largeId + 10n; // ✅ 9007199254741003n
```

#### ⚖️ Senior Engineering Decision Matrix: `bigint`
- **✅ When to Use:** 64-bit database IDs (Snowflake IDs), blockchain ledger math, cryptographic keys.
- **⚠️ JSON Serialization Trap:** Standard `JSON.stringify()` throws a `TypeError: Do not know how to serialize a BigInt`. Implement a custom serializer or serialize as strings.

---

### Part 5 — `boolean` (Truthy vs Boolean Primitives) `🟢 [Daily Driver]`

#### Definition & Engine Mechanics
Booleans are strict binary primitives: `true` and `false`.
- **The `"false"` String Trap:** `"false"` is a non-empty string, making it **truthy** in conditional evaluations!

```js
const isUserActive = "false";

if (isUserActive) {
  // ⚠️ EXECUTES! Because Boolean("false") === true
  console.log("Active!"); 
}
```

#### ⚖️ Senior Engineering Decision Matrix: Booleans
- **✅ When to Use:** Strict binary flags (`isOpen: boolean`, `isEnabled: boolean`).
- **❌ Anti-Pattern:** Representing multi-state asynchronous lifecycles with multiple boolean flags (`isLoading`, `isSuccess`, `isError`).
- **🚀 Modern Leverage:** Model state machines via **TypeScript Discriminated Unions**:
  ```ts
  type AsyncState<T> = 
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: T }
    | { status: 'error'; error: Error };
  ```

---

### Part 6 — `undefined` vs `null` (Absence Semantics) `🟢 [Daily Driver]`

```text
┌───────────────────────────────────────────────────────────┐
│              UNDEFINED vs NULL SEMANTICS                  │
├─────────────────────────────┬─────────────────────────────┤
│ undefined                   │ null                        │
│ Unintentional / Default     │ Intentional / Explicit      │
│ "Value has not been set"    │ "Value is explicitly empty" │
│ Default function return     │ Selected record: null       │
└─────────────────────────────┴─────────────────────────────┘
```

```js
// Nullish Coalescing (??) checks strictly for null and undefined:
const port = process.env.PORT ?? 3000;
```

#### ⚖️ Senior Engineering Decision Matrix: Absence
- **✅ When to Use `null`:** Intentional domain absence (e.g. `selectedUser: User | null = null`).
- **✅ When to Use `undefined`:** Optional parameters, uninitialized form fields, default fallback triggers.
- **🚀 Modern Leverage:** Always use **Nullish Coalescing (`??`)** over Logical OR (`||`) to avoid accidentally overriding valid falsy values like `0`, `""`, or `false`.

---

### Part 7 — `symbol` (Unique Protocol Identifiers) `🟡 [Moderate]`

```js
const keyA = Symbol("apiKey");
const keyB = Symbol("apiKey");

console.log(keyA === keyB); // false (Guaranteed global uniqueness)
```

#### ⚖️ Senior Engineering Decision Matrix: Symbols
- **✅ When to Use:** ECMAScript language hooks (`[Symbol.iterator]`, `[Symbol.toPrimitive]`), and hiding internal metadata on shared library objects.

---

### Part 8 — Objects, Arrays & Functions as Runtime Values `🟢 [Daily Driver]`

```text
Stack (Execution Frame)                 Heap (Garbage-Collected Memory)
┌─────────────────────────┐             ┌─────────────────────────────────────┐
│ user: 0xA1F0 (Pointer)  │────────────►│ 0xA1F0: { name: "Sunny", age: 25 }  │
├─────────────────────────┤             ├─────────────────────────────────────┤
│ list: 0xB8C2 (Pointer)  │────────────►│ 0xB8C2: [ "HTML", "CSS" ]           │
├─────────────────────────┤             ├─────────────────────────────────────┤
│ fn:   0xC4D1 (Callable) │────────────►│ 0xC4D1: FunctionObject [[Scope]]     │
└─────────────────────────┘             └─────────────────────────────────────┘
```

#### ⚙️ V8 Hidden Classes & Shape Transitions:
When objects are instantiated with identical properties in the exact same order, V8 shares an optimized **Hidden Class (Map/Shape)**. Adding properties dynamically in random order mutates the object shape, de-optimizing inline property access caches.

---

### Part 9 — `typeof` Operator Mechanics & Limitations `🟢 [Daily Driver]`

```js
typeof "Sunny"    // "string"
typeof 42         // "number"
typeof true       // "boolean"
typeof undefined  // "undefined"
typeof 10n        // "bigint"
typeof Symbol()   // "symbol"
typeof (() => {}) // "function"

// ⚠️ Objects Broad Categorization:
typeof {}         // "object"
typeof []         // "object" ──► Use Array.isArray()
typeof null       // "object" ──► Use val === null
```

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### 1. The Multi-Boolean Anti-Pattern vs. Discriminated Union State Machine
```tsx
import React, { useState } from 'react';

interface User { id: string; name: string; }

// ❌ ANTI-PATTERN: Multiple disjoint booleans allow impossible states (isLoading && isError)
// const [isLoading, setIsLoading] = useState(false);
// const [isError, setIsError] = useState(false);
// const [data, setData] = useState<User | null>(null);

// ✅ SENIOR PATTERN: Discriminated Union State Machine
type UserState = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; message: string };

export function UserProfileCard() {
  const [state, setState] = useState<UserState>({ status: 'idle' });

  // Exhaustive pattern matching ensures impossible states cannot render
  switch (state.status) {
    case 'idle':
      return <button onClick={() => setState({ status: 'loading' })}>Load Profile</button>;
    case 'loading':
      return <div className="animate-spin text-blue-500">Loading...</div>;
    case 'success':
      return <div className="font-bold text-emerald-400">Welcome, {state.data.name}</div>;
    case 'error':
      return <div className="text-rose-500">Error: {state.message}</div>;
  }
}
```

---

### 2. Runtime API Boundary Normalization Layer
```ts
// schema-normalizer.ts
export interface NormalizedProduct {
  id: string;
  price: number; // Guaranteed pure number
  isActive: boolean; // Guaranteed pure boolean
}

/**
 * Defensive Normalizer: Prevents string coercion bugs ("100" + 20 = "10020")
 * from penetrating the React UI component layer.
 */
export function normalizeProduct(raw: unknown): NormalizedProduct {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new TypeError("Invalid product payload: expected object");
  }

  const payload = raw as Record<string, unknown>;

  return {
    id: String(payload.id ?? 'unknown-id'),
    price: typeof payload.price === 'number' && !Number.isNaN(payload.price)
      ? payload.price
      : Number(payload.price) || 0,
    isActive: typeof payload.isActive === 'boolean'
      ? payload.isActive
      : payload.isActive === 'true' || payload.isActive === 1
  };
}
```

---

## 🧠 Part 2 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: `typeof` Array
```js
const values = [42, "42", true, undefined, null, [], {}, () => {}];
for (const value of values) {
  console.log(typeof value);
}
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**
```text
number
string
boolean
undefined
object
object
object
function
```
**Why:**
- `null` returns `"object"` due to the historical 1995 type-tag bug.
- Arrays `[]` return `"object"` because they inherit from `Object.prototype`.
- `() => {}` returns `"function"` because functions are callable object entities.
</details>

---

### Prediction Challenge 2: API Boundary Concatenation Trap
```js
const response = {
  price: "100",
  discount: null,
  active: "false"
};

const total = response.price + 20;

if (response.active) {
  console.log("Product is active");
}
console.log("Total:", total);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**
```text
Product is active
Total: 10020
```
**Why:**
1. `response.price` is a string (`"100"`). The `+` operator encounters a string operand and performs **string concatenation** (`"100"` + `20` = `"10020"`).
2. `response.active` is the string `"false"`. In JavaScript, all non-empty strings evaluate to **truthy**, executing the conditional block!
3. **Senior Takeaway:** No errors are thrown, but severe business logic corruption occurs silently.
</details>

---

### Prediction Challenge 3: Object Identity & Mutation
```js
const a = { status: "active" };
const b = a;
console.log(typeof a);
console.log(a === b);
b.status = "inactive";
console.log(a.status);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**
```text
object
true
inactive
```
**Why:**
`a` and `b` hold the exact same memory pointer address on the Heap. Modifying `b.status` edits the shared memory slot, observed immediately through `a.status`.
</details>

---

### Active Recall Questions (1 to 5)

1. **Why is "Variables can change their type" less precise than "Bindings are associated with values having runtime types"?**  
   *Answer:* JavaScript variables do not possess static types; they are identifiers in environment records. Types reside entirely in the runtime values currently referenced by those identifiers.
2. **Why is `if (typeof value === "object")` dangerous? List 3 categories that fool this check.**  
   *Answer:* It falsely accepts `null`, Arrays (`[]`), and special object instances (`Date`, `RegExp`).
3. **Why can `isAdmin: "false"` in JSON cause catastrophic security/logic bugs?**  
   *Answer:* `Boolean("false") === true`. A check like `if (user.isAdmin)` will grant administrative permissions to a disabled user.
4. **Why does TypeScript (`type User = { age: number }`) fail to protect against API runtime type corruption?**  
   *Answer:* TypeScript is purely a compile-time static type system that is completely stripped during compilation. At runtime, the browser parses raw JSON without TypeScript checks.
5. **When does multiple boolean state become inferior to a discriminated union?**  
   *Answer:* Whenever states are mutually exclusive (e.g. `idle`, `loading`, `success`, `error`), multiple booleans permit invalid concurrent combinations (`isLoading: true` and `isError: true`).

---

## 🛠️ Practical Architecture Challenge: Runtime Boundary Normalizer

```ts
// See runnable implementation in examples/02-data-types-boundary-normalizer.js
```

---

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What are the 7 primitive data types in JavaScript, and what distinguishes them from objects?  
<details>
<summary><strong>Answer</strong></summary>
`string`, `number`, `boolean`, `null`, `undefined`, `symbol`, and `bigint`. Primitives are immutable and stored directly by value (on the Stack), whereas objects are mutable collections stored on the Heap and passed by reference.
</details>

**Q2:** Why does `typeof null` return `"object"`?  
<details>
<summary><strong>Answer</strong></summary>
It is a historical 1995 JavaScript engine bug. The NULL pointer had a type tag of `000`, which matched the tag for Object references. It is permanently preserved in the ECMAScript standard for backward compatibility.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** Why does `0.1 + 0.2 === 0.3` evaluate to `false`, and how should financial monetary values be modeled in production?  
<details>
<summary><strong>Answer</strong></summary>
JavaScript numbers use IEEE 754 64-bit binary floating-point representation. Decimals like $0.1$ and $0.2$ cannot be represented precisely in binary fractions, resulting in $0.30000000000000004$. In financial systems, currency should always be stored and calculated as **Integer minor units** (e.g. `1050` paise or `1999` cents) and formatted only for display.
</details>

**Q4:** What is the difference between `Number.isNaN(val)` and global `isNaN(val)`?  
<details>
<summary><strong>Answer</strong></summary>
Global `isNaN(val)` first attempts to coerce the input to a number (`isNaN("hello")` returns `true` because `"hello"` coerces to `NaN`). `Number.isNaN(val)` performs no coercion and strictly checks if the value is both of type `number` and mathematically `NaN` (`Number.isNaN("hello")` returns `false`).
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** Why is TypeScript unable to prevent runtime crashes caused by unexpected API payload data types (e.g. receiving a string `"100"` instead of a number `100`), and how do you architect a defense against this?  
<details>
<summary><strong>Answer</strong></summary>
TypeScript types are purely compile-time constructs that are completely erased during compilation to JavaScript. At runtime, the browser parses raw JSON over the network with zero TypeScript validation. The solution is an **API Boundary Validation & Normalization Layer** (using Zod/Valibot or custom normalizers) that parses, validates, and normalizes raw JSON before it reaches React state.
</details>

**Q6:** Why is representing asynchronous component state with multiple booleans (`isLoading`, `isError`, `isSuccess`) an anti-pattern compared to a Discriminated Union?  
<details>
<summary><strong>Answer</strong></summary>
Multiple booleans allow $2^N$ possible state permutations, permitting mathematically impossible states (e.g. `isLoading: true` and `isError: true` simultaneously). A TypeScript **Discriminated Union** (e.g. `type State = { status: 'loading' } | { status: 'error'; error: Error }`) restricts the component to valid, mutually exclusive states.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q7:** How does the V8 engine optimize objects using "Hidden Classes" (Shapes/Maps), and how can dynamic property assignments cause JIT de-optimizations (Megamorphic Inline Caching)?  
<details>
<summary><strong>Answer</strong></summary>
V8 creates internal **Hidden Classes (Shapes)** that track object property offsets in memory. When objects share the exact same property names in the exact same initialization order, they share a Hidden Class, allowing V8 to generate fast **Inline Caches (ICs)** for property reads. If code randomly attaches properties or initializes objects with varying keys, the Hidden Class transitions diverge. When an access site encounters more than 4 different shapes, it degrades to **Megamorphic IC state**, falling back to slow dictionary lookups.  
*Best Practice:* Always initialize all expected object properties in constructors or factory functions in a consistent order.
</details>

---

## Key Takeaways
1. **Types belong to values, not bindings:** Variables are dynamic pointers to typed values.
2. **`typeof` is incomplete:** Always pair object checks with `val !== null` and `Array.isArray()`.
3. **Avoid floating-point currency:** Store monetary values as minor integer units (paise/cents).
4. **`"false"` is truthy:** Never evaluate raw string flags directly in boolean conditionals.
5. **Runtime Validation is Mandatory:** TypeScript does not validate external JSON payloads at runtime.

---

[⬅️ Part 1: Variables & Assignment](./01-variables-values-assignment.md) | [📚 KPI 01 Index](./README.md) | [Part 3: Equality & Boolean Logic ➡️](./03-equality-boolean-logic.md)
