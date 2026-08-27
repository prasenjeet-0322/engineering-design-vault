# KPI 09 — Part 03: `filter()` — Selection, Search Pipelines & Immutable Collection Updates

[⬅️ Part 02: `map()` Transformation & Referential Integrity](./02-map-transformation-referential-integrity.md) | [📚 KPI 09 Index](./README.md) | [Part 04: `find()`, `findIndex()`, `some()` & `every()` ➡️](./04-find-findIndex-some-every.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Core Aspect | Operational Invariant | Return Contract | Modifies Original? | Senior Production Rule |
|---|---|---|---|---|
| **Selection Contract** | Evaluates predicate on every element; returns subset where predicate is truthy. | New Array ($0 \le M \le N$) | ❌ | 🟢 **Pure Selection**: Never transform items inside `filter()`; keep selection decoupled from mapping. |
| **Reference Reuse** | Retains exact heap memory references for all surviving elements. | New Array Container | ❌ | 🔴 **Memory Trap**: Modifying a property on a filtered item mutates the object in the original array! |
| **`filter(Boolean)` Danger** | Strips all falsy values (`0`, `false`, `""`, `NaN`, `null`, `undefined`). | Cleaned Array | ❌ | 🔴 **Data Loss**: Never use `filter(Boolean)` if `0`, `false`, or `""` represent valid business data. |
| **Safe Nullish Filter** | `array.filter(item => item != null)` | Non-nullish Array | ❌ | 🟢 **Standard**: Removes strictly `null` and `undefined` while preserving `0`, `false`, and `""`. |
| **Immutable Deletion** | `items.filter(item => item.id !== targetId)` | New Array ($N-1$) | ❌ | 🟢 **React Standard**: Deletes items immutably; structural sharing maintained for survivors. |
| **No Early Termination** | Always scans all $N$ elements ($O(N)$ traversal). | Array | ❌ | 🟢 If you only need the first matching element, use `find()` to enable instant early-exit. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotcha: The `filter(Boolean)` Data Erasure Bug
> **Question:** *"Why did this e-commerce inventory filter cause an outage by wiping out all out-of-stock items and zero-dollar promotions?"*  
> ```js
> // ❌ BROKEN INVENTORY FILTER:
> const productList = [
>   { id: 'P1', name: 'Laptop', stock: 10, discountPrice: 899 },
>   { id: 'P2', name: 'Free Promo Sticker', stock: 50, discountPrice: 0 }, // ❌ discountPrice: 0 is falsy!
>   { id: 'P3', name: 'Sold Out Monitor', stock: 0, discountPrice: 299 },   // ❌ stock: 0 is falsy!
>   null
> ];
> 
> // Developer intended to remove `null` values:
> const validProducts = productList.filter(Boolean);
> const inStockPromoItems = validProducts.filter(p => Boolean(p.stock) && Boolean(p.discountPrice));
> ```
> **Deep Architectural Answer:**  
> 1. `Boolean(0)` evaluates to `false`. When filtering numerical quantities, zero (`0`) is a valid mathematical scalar representing "zero quantity" or "zero cost".  
> 2. `filter(Boolean)` and `Boolean(p.stock)` discard `0`, `false`, `""`, and `NaN` indiscriminately.  
> 3. Consequently, valid promotional items ($0) and inventory tracking records (stock: 0) are silently erased from the application state, causing cart calculations and inventory alerts to fail.  
> 4. **The Senior Standard:** Always write explicit, domain-specific predicates:  
> ```js
> // ✅ CLEAN EXPLICIT NULLISH FILTER:
> const validProducts = productList.filter(p => p != null);
> 
> // ✅ EXPLICIT BUSINESS RULE:
> const eligiblePromos = validProducts.filter(p => p.stock > 0 && p.discountPrice >= 0);
> ```

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / TypeScript Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Multi-facet search dashboards, React list filtering (`useMemo`), Immutable deletion in Redux/Zustand | Essential for building reactive search queries, item deletion workflows, and role-based item visibility. |
| 🟡 **Moderate** | Used in ~25% of code | Custom TypeScript Type Guard predicates (`val is T`), High-throughput multi-stage filter pipelines | Critical for strict type narrowing, data grid virtualization, and domain query engines. |
| 🔵 **Foundational / Engine** | Runtime internals | Intermediate array allocation garbage collection, V8 filter callback inlining, Sparse array hole skips | Essential for optimizing large data table performance and Staff/Principal technical reviews. |

---

## Core Concepts (20 Subtopics)

### Part 1 — The Formal Selection Contract: $T[] \xrightarrow{\text{pred}} T[]$ `🟢 [Daily Driver]`

`filter()` receives a predicate function $p: T \to \text{boolean}$ and produces a subset array of length $M$ where $0 \le M \le N$.

---

### Part 2 — Predicate Mechanics & Truthiness Coercion `🟢 [Daily Driver]`

The callback is evaluated for truthiness. Explicit boolean returns (`return Boolean(...)`) are not required by JavaScript, but recommended for readability.

---

### Part 3 — Reference Reuse Invariant `🟢 [Daily Driver]`

Surviving elements in the filtered array share the exact memory pointers of the original array (`filtered[0] === original[0]`). `filter()` never clones objects.

---

### Part 4 — `filter()` vs. `map()`: Decoupling Concerns `🟢 [Daily Driver]`

- **`filter()`:** Decides *which* items survive ($N \to M$).
- **`map()`:** Decides *what* surviving items become ($M \to M$).
- Always filter *before* mapping to avoid unnecessary transformation of elements that will be discarded.

---

### Part 5 — Named Domain Predicate Factories `🟢 [Daily Driver]`

```js
const hasMinAge = min => user => user.age >= min;
const isAdult = hasMinAge(18);
const adults = users.filter(isAdult);
```

---

### Part 6 — The `filter(Boolean)` Data Erasure Trap `🔴 [Production-Critical]`

`filter(Boolean)` removes `0`, `false`, `""`, `NaN`, `null`, and `undefined`. Use it only when all falsy values are guaranteed to be invalid.

---

### Part 7 — Safe Nullish Filtering (`val != null`) `🟢 [Daily Driver]`

`items.filter(item => item != null)` leverages loose inequality to discard both `null` and `undefined` while preserving `0`, `false`, and `""`.

---

### Part 8 — Immutable Item Deletion in React State `🟢 [Daily Driver]`

```jsx
// Standard React immutable removal:
setTodos(prevTodos => prevTodos.filter(todo => todo.id !== deletedId));
```

---

### Part 9 — `filter()` vs. `splice()`: Pure Projection vs. Destructive Mutation `🟢 [Daily Driver]`

- `splice(index, 1)`: In-place mutation; alters original array, breaks React state history.
- `filter(item => item.id !== id)`: Pure projection; creates a new array, keeps original state pristine.

---

### Part 10 — Multi-Field Search Query Normalization Pipelines `🟢 [Daily Driver]`

```js
function searchProducts(products, query) {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter(p =>
    p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
  );
}
```

---

### Part 11 — Composite Filtering: Chained Passes vs. Compound Predicates `🟢 [Daily Driver]`

- **Chained:** `items.filter(isA).filter(isB)` $\to$ Clear for short pipelines, but allocates intermediate arrays.
- **Compound:** `items.filter(i => isA(i) && isB(i))` $\to$ Single-pass $O(N)$ traversal with single array allocation.

---

### Part 12 — Filtering vs. Finding: Traversal Invariants `🟢 [Daily Driver]`

- `filter()` always visits all $N$ elements to collect all matches.
- `find()` stops immediately upon encountering the first matching element ($O(1)$ to $O(N)$).

---

### Part 13 — Derived Filtered State in React (`useMemo`) `🟢 [Daily Driver]`

```tsx
// ✅ Single Source of Truth: Compute filtered list on-the-fly during render
const visibleUsers = useMemo(() =>
  users.filter(user => user.role === selectedRole),
  [users, selectedRole]
);
```

---

### Part 14 — TypeScript Custom Type Predicates (`val is T`) `🟢 [Daily Driver]`

```ts
function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}
const validStrings: string[] = (['a', null, 'b'] as (string | null)[]).filter(isNonNullable);
```

---

### Part 15 — The Impure Predicate Mutation Anti-Pattern `🔴 [Production-Critical]`

Never mutate elements inside a filter callback (`items.filter(i => { i.checked = true; return i.active; })`). It creates hidden side effects during what callers expect to be a read-only selection.

---

### Part 16 — Position vs. Identity: Why Filtering by Index Breaks `🟢 [Daily Driver]`

Filtering by index (`items.filter((_, idx) => idx !== targetIdx)`) breaks when lists are sorted, filtered, or reordered. Always filter by unique domain identifier (`item.id !== targetId`).

---

### Part 17 — Sparse Array Hole Skipping in `filter()` `🔵 [Foundational / Engine]`

`filter()` ignores empty slots in sparse arrays, automatically removing holes from the output array (`[1, , 3].filter(() => true)` produces `[1, 3]`).

---

### Part 18 — Performance Profiling: Allocation Footprint `🔵 [Foundational / Engine]`

Filtering an array of $10^6$ objects where all items match allocates a new $10^6$-element pointer array. Pre-filtering before expensive transformations drastically reduces GC heap allocations.

---

### Part 19 — Asynchronous Filtering with `Promise.all` `🔵 [Foundational / Engine]`

Native `filter` does not support async predicates. To filter with async functions:
```js
async function asyncFilter(arr, asyncPredicate) {
  const masks = await Promise.all(arr.map(asyncPredicate));
  return arr.filter((_, i) => masks[i]);
}
```

---

### Part 20 — 10-Point Senior `filter()` Architecture Checklist `🟢 [Daily Driver]`

```text
1. Are selection operations strictly separated from transformation (filter before map)?
2. Is filter(Boolean) audited to ensure valid 0, false, and "" values are not wiped out?
3. Are null and undefined removed using explicit nullish checks (item != null)?
4. Is immutable deletion implemented via unique ID matching (item.id !== targetId)?
5. Do complex filtering rules use named domain predicate functions?
6. Are search queries normalized (trimmed, lowercased) once before entering the filter loop?
7. Is find() used instead of filter() when only a single matching element is needed?
8. Are multiple filter passes combined into a compound predicate for large datasets?
9. Are custom TypeScript type guards (val is T) used to narrow types on filtered arrays?
10. Is the filter predicate completely pure with zero mutations to element properties?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Mechanism | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **`Array.prototype.filter`** | Subsetting collections based on a boolean condition; immutable deletion. | Finding a single item, transforming items, or boolean existence checks. | Scans entire array ($O(N)$); allocates new array; doesn't support async. | `find()`, `some()`, `reduce()`. |
| **`Array.prototype.find`** | Retrieving the first matching element from a collection. | When you need multiple matching items or want to delete items. | Returns only the first match; returns `undefined` if no match. | `filter()`, `findIndex()`. |
| **`Array.prototype.flatMap`** | Filtering and transforming in a single pass (returning `[]` to exclude). | Pure filtering without mapping transformations. | Slightly more complex syntax (`item => condition ? [mapped] : []`). | `.filter().map()`. |
| **Imperative Loop with Break** | Early-exit filtering or async sequential predicate evaluation. | Standard React UI components and declarative Redux state transitions. | Imperative boilerplate; index variable management. | `filter()`, `for...of`. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Multi-Facet Search & Filter Dashboard
```tsx
import React, { useState, useMemo, useCallback } from 'react';

// ==========================================
// 1. DATA MODELS & FILTER STATE
// ==========================================
export interface AuditLog {
  id: string;
  action: string;
  user: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  timestamp: string;
  statusCode: number;
}

export interface FilterCriteria {
  searchQuery: string;
  selectedSeverity: string;
  onlyErrors: boolean;
}

// ==========================================
// 2. PURE DOMAIN PREDICATES (Functional Core)
// ==========================================
export const matchesSearch = (log: AuditLog, query: string): boolean => {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  return log.action.toLowerCase().includes(q) || log.user.toLowerCase().includes(q);
};

export const matchesSeverity = (log: AuditLog, severity: string): boolean =>
  !severity || severity === 'ALL' || log.severity === severity;

export const matchesErrorStatus = (log: AuditLog, onlyErrors: boolean): boolean =>
  !onlyErrors || log.statusCode >= 400;

/**
 * 🟢 COMPOUND DOMAIN FILTER PIPELINE (Single Pass)
 */
export function filterAuditLogs(logs: readonly AuditLog[], criteria: FilterCriteria): AuditLog[] {
  return logs.filter((log) =>
    matchesSearch(log, criteria.searchQuery) &&
    matchesSeverity(log, criteria.selectedSeverity) &&
    matchesErrorStatus(log, criteria.onlyErrors)
  );
}

// ==========================================
// 3. REACT DASHBOARD COMPONENT (Imperative Shell)
// ==========================================
export function AuditLogDashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([
    { id: 'L1', action: 'USER_LOGIN', user: 'sunny@corp.com', severity: 'INFO', timestamp: '2026-08-26 10:00', statusCode: 200 },
    { id: 'L2', action: 'DB_BACKUP_FAIL', user: 'system', severity: 'CRITICAL', timestamp: '2026-08-26 10:15', statusCode: 500 },
    { id: 'L3', action: 'PERMISSION_DENIED', user: 'alex@corp.com', severity: 'WARNING', timestamp: '2026-08-26 10:30', statusCode: 403 }
  ]);

  const [criteria, setCriteria] = useState<FilterCriteria>({
    searchQuery: '',
    selectedSeverity: 'ALL',
    onlyErrors: false
  });

  // 🟢 Single Source of Truth: Derived State via useMemo
  const filteredLogs = useMemo(() => filterAuditLogs(logs, criteria), [logs, criteria]);

  // 🟢 Immutable deletion
  const handleDeleteLog = useCallback((id: string) => {
    setLogs((prevLogs) => prevLogs.filter((log) => log.id !== id));
  }, []);

  return (
    <div className="audit-dashboard">
      <h3>Enterprise Security Audit Dashboard</h3>

      <div className="filter-toolbar">
        <input
          type="text"
          placeholder="Search by action or user..."
          value={criteria.searchQuery}
          onChange={(e) => setCriteria({ ...criteria, searchQuery: e.target.value })}
        />

        <select
          value={criteria.selectedSeverity}
          onChange={(e) => setCriteria({ ...criteria, selectedSeverity: e.target.value })}
        >
          <option value="ALL">All Severities</option>
          <option value="INFO">Info</option>
          <option value="WARNING">Warning</option>
          <option value="CRITICAL">Critical</option>
        </select>

        <label>
          <input
            type="checkbox"
            checked={criteria.onlyErrors}
            onChange={(e) => setCriteria({ ...criteria, onlyErrors: e.target.checked })}
          />
          HTTP Errors Only ($\ge 400$)
        </label>
      </div>

      <div className="log-summary">
        Showing <strong>{filteredLogs.length}</strong> of {logs.length} total events
      </div>

      <ul className="log-list">
        {filteredLogs.map((log) => (
          <li key={log.id} className={`log-item ${log.severity.toLowerCase()}`}>
            <span><strong>[{log.severity}]</strong> {log.action} — <em>{log.user}</em> (Status: {log.statusCode})</span>
            <button onClick={() => handleDeleteLog(log.id)}>🗑️ Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 🧠 Part 03 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: `filter(Boolean)` Scalar Erasure
```js
const data = [0, "Hello", false, 42, "", null, undefined, -1];
const filtered = data.filter(Boolean);

console.log("Filtered Output:", filtered);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Filtered Output: [ 'Hello', 42, -1 ]
```
**Why:** `Boolean(0)`, `Boolean(false)`, `Boolean("")`, `Boolean(null)`, and `Boolean(undefined)` all evaluate to `false` and are removed. Only truthy values (`"Hello"`, `42`, `-1`) survive.
</details>

---

### Prediction Challenge 2: Reference Preservation of Filtered Objects
```js
const original = [{ id: 1, active: true }, { id: 2, active: false }];
const result = original.filter(x => x.active);

result[0].active = false;

console.log("Original Item 1 active status:", original[0].active);
console.log("Are Array Containers Identical?:", original === result);
console.log("Are Inner Object References Identical?:", original[0] === result[0]);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Original Item 1 active status: false
Are Array Containers Identical?: false
Are Inner Object References Identical?: true
```
**Why:** `filter()` returns a new outer array container (`false`), but copies matching object references (`true`). Mutating `result[0]` directly mutates `original[0]`.
</details>

---

### Prediction Challenge 3: Sparse Array Hole Pruning
```js
const sparse = [1, , 3, , 5];
const filtered = sparse.filter(() => true);

console.log("Filtered Length:", filtered.length);
console.log("Filtered Elements:", filtered);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Filtered Length: 3
Filtered Elements: [ 1, 3, 5 ]
```
**Why:** `filter()` skips unallocated index holes without invoking the callback, producing a dense array with holes removed.
</details>

---

### Prediction Challenge 4: `filter()` vs. `find()` Return Invariant
```js
const users = [{ id: 10, name: "Alice" }, { id: 20, name: "Bob" }];

const filterResult = users.filter(u => u.id === 99);
const findResult = users.find(u => u.id === 99);

console.log("filter on missing ID:", filterResult);
console.log("find on missing ID:", findResult);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
filter on missing ID: []
find on missing ID: undefined
```
**Why:** `filter()` always returns an array (empty `[]` if no matches). `find()` returns the matching element value, or `undefined` if no match is found.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What does `Array.prototype.filter()` return when no elements match the predicate?  
<details>
<summary><strong>Answer</strong></summary>
It returns a brand-new, empty array (`[]`). It never returns `null` or `undefined`.
</details>

**Q2:** How do you immutably remove an item by ID from an array of objects in React?  
<details>
<summary><strong>Answer</strong></summary>
Using `array.filter(item => item.id !== targetId)`. This returns a new array containing all items except the one matching `targetId`, leaving the original state array untouched and preserving structural sharing for all surviving items.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** Why is `filter(Boolean)` hazardous when filtering numerical or string data in business applications?  
<details>
<summary><strong>Answer</strong></summary>
`filter(Boolean)` coerces all elements using JavaScript truthiness rules. It discards not only `null` and `undefined`, but also the number `0`, the boolean `false`, and empty strings `""`. In domain applications where `0` represents a valid inventory count or price, `filter(Boolean)` causes silent data loss. Developers should use explicit nullish checks (`item => item != null`) instead.
</details>

**Q4:** In what order should `map()` and `filter()` be chained, and why does the ordering matter?  
<details>
<summary><strong>Answer</strong></summary>
Always place `filter()` **before** `map()` (`array.filter(pred).map(transform)`). Filtering first reduces the size of the array from $N$ to $M$ ($M \le N$), ensuring that the mapping transformation and new object allocations are executed only on the surviving $M$ elements, saving CPU cycles and memory allocations.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** How do you implement a reusable TypeScript custom type guard for filtering out `null` and `undefined` with strict compiler type narrowing?  
<details>
<summary><strong>Answer</strong></summary>
By defining a type predicate with the `is` return signature:
```ts
function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

const rawList: (string | null | undefined)[] = ['A', null, 'B', undefined];
const cleanList: string[] = rawList.filter(isNonNullable);
```
Passing `isNonNullable` to `filter` instructs the TypeScript compiler to narrow the output array type from `(string | null | undefined)[]` directly to `string[]`.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How do you implement asynchronous filtering in JavaScript without race conditions or memory leaks?  
<details>
<summary><strong>Answer</strong></summary>
Because `Array.prototype.filter` is synchronous and cannot await promises returned by predicates, asynchronous filtering must be implemented in two coordinated phases:
1. **Concurrent Evaluation (`map` + `Promise.all`):** Map the array with the async predicate and await all promises concurrently, producing a boolean mask array `boolean[]`.  
2. **Synchronous Mask Selection (`filter`):** Synchronously filter the original array using the pre-computed boolean mask:
```js
async function asyncFilter(items, asyncPredicate) {
  const mask = await Promise.all(items.map(asyncPredicate));
  return items.filter((_, index) => mask[index]);
}
```
This guarantees all async validations complete before filtering, preserves exact index alignment, and prevents unhandled promise rejections.
</details>

---

## 🛠️ Senior Architecture Challenge: Multi-Facet Product Filtering & Search Index

```js
// See runnable implementation in examples/03-filter-selection-search-pipelines.js
```

---

## Key Takeaways
1. **Filter is Selection:** It decides which elements survive, never transforming them.
2. **Beware `filter(Boolean)`:** Removes valid `0` and `false`; use `!= null` for nullish pruning.
3. **Filter Before Map:** Minimize the workload of downstream transformation stages.
4. **Immutable Deletion Standard:** Use `item.id !== targetId` for state deletions.
5. **No Early Exit:** `filter()` always visits all $N$ items; use `find()` for single-item lookups.

---

[⬅️ Part 02: `map()` Transformation & Referential Integrity](./02-map-transformation-referential-integrity.md) | [📚 KPI 09 Index](./README.md) | [Part 04: `find()`, `findIndex()`, `some()` & `every()` ➡️](./04-find-findIndex-some-every.md)
