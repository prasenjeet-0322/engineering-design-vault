# KPI 22 — Part 04: `async` / `await`, Error Handling, Parallel Execution & Async Loops

[⬅️ Part 03: Promise Chaining & Promise Combinators](./03-promise-chaining-combinators-concurrency.md) | [📚 KPI 22 Index](./README.md) | [Part 05: Production Async Patterns, `AbortController` & Race Conditions ➡️](./05-production-async-patterns-race-conditions.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| `async/await` Pattern | Mechanism / Execution Behavior | Core Production Rule | Senior Architectural Standard |
|---|---|---|---|
| **`async` Function** | Wraps any returned value in a fulfilled Promise (`Promise.resolve`). | Always produces a `Promise<T>`; never returns bare synchronous values. | 🟢 Keep pure async functions typed as `Promise<T>`; never ignore returned promise. |
| **`await` Expression** | Suspends current async function execution until the promise settles. | Yields thread back to event loop; resumes continuation via **Microtask Queue**. | 🔵 `await 10` is automatically coerced to `await Promise.resolve(10)`. |
| **`try / catch / finally`** | Catches rejected promises awaited inside the `try` block as exceptions. | `finally` block runs on both success and caught/uncaught exceptions. | 🟢 Separate data loading error boundaries from UI rendering error boundaries. |
| **Sequential `await`** | `await a(); await b();` executes sequentially in series ($\sum T_i$). | Use only when operation `B` strictly depends on output from operation `A`. | 🔴 Never use sequential `await` for independent operations (creates request waterfalls). |
| **Parallel `Promise.all`** | `await Promise.all([a(), b()])` executes operations concurrently ($\max T_i$). | Starts all operations simultaneously; awaits collective completion. | 🟢 Benchmark and use for independent API calls (User + Settings + Permissions). |
| **`for...of` vs `forEach`** | `for (const x of arr) await fn(x)` awaits sequentially; `forEach` does **not**. | `arr.forEach(async ...)` returns `undefined` immediately without awaiting! | 🔴 **BANNED IN PROD:** Never use `async` callbacks inside `Array.prototype.forEach`. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: The `forEach(async)` Trap & Request Waterfalls
> 
> #### Gotcha A: The `Array.prototype.forEach(async ...)` Silent Concurrency Bug
> *"Why did our database migration script report 'Migration Complete' before any records were actually inserted?"*  
> ```js
> // ❌ FATAL FOREACH ASYNC HAZARD:
> async function migrateUsers(users) {
>   console.log("Starting migration...");
>   
>   // 💥 forEach does NOT await the async callback! It executes all callbacks concurrently and returns undefined!
>   users.forEach(async (user) => {
>     await db.insertUser(user); // 💥 Still pending in microtasks/network!
>   });
>   
>   console.log("Migration Complete!"); // 💥 Runs immediately before db.insertUser finishes!
> }
> ```
> **Deep Architectural Explanation:**  
> `Array.prototype.forEach` was specified in ES5 and is completely oblivious to Promises. It invokes the callback for each element synchronously in a standard loop and immediately returns `undefined`. When passed an `async` callback, `forEach` receives a returned Promise for each item, but does nothing with it. It does not await them or collect them. The surrounding function continues executing immediately, creating unhandled background operations and race conditions.  
> **The Senior Standard:** Use `for...of` for sequential execution or `Promise.all(arr.map(...))` for parallel execution:
> ```js
> // ✅ SEQUENTIAL:
> for (const user of users) {
>   await db.insertUser(user); // 🟢 Strictly awaits each insertion before proceeding
> }
> 
> // ✅ PARALLEL:
> await Promise.all(users.map((user) => db.insertUser(user))); // 🟢 Awaits all insertions
> ```
> 
> ---
> 
> #### Gotcha B: Accidental Sequential Request Waterfalls
> *"Why did our dashboard take 1,200ms to load when all 3 microservices respond in 400ms each?"*  
> ```js
> // ❌ ACCIDENTAL SEQUENTIAL WATERFALL:
> async function loadDashboard() {
>   const user = await fetchUser();         // ⏳ Takes 400ms
>   const settings = await fetchSettings(); // ⏳ Takes 400ms (Waits for User to finish first!)
>   const feed = await fetchFeed();         // ⏳ Takes 400ms (Waits for Settings to finish first!)
>   return { user, settings, feed };        // 💥 Total duration: 1,200ms!
> }
> ```
> **Deep Architectural Explanation:**  
> Writing separate `await` statements on consecutive lines forces the JavaScript runtime to pause execution at each line until the network request finishes. If `fetchSettings()` does not require `user.id`, running them sequentially triples total latency.  
> **The Senior Standard:** Parallelize independent network operations with `Promise.all()` to drop total duration to $\max(T_i) = 400\text{ms}$:
> ```js
> // ✅ PARALLEL CONCURRENT EXECUTION:
> async function loadDashboard() {
>   const [user, settings, feed] = await Promise.all([
>     fetchUser(),
>     fetchSettings(),
>     fetchFeed()
>   ]); // 🟢 Total duration: ~400ms!
>   return { user, settings, feed };
> }
> ```

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / Next.js / Vite Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | `async/await`, `try/catch/finally`, `for...of` async loops, `Promise.all` parallel loading | Universal standard for asynchronous programming across React components, Server Actions, and API routes. |
| 🟡 **Moderate** | Used in ~45% of code | Async generators, Top-level `await` in ESM, Controlled rate-limiting batching | Critical for streaming SSR in Next.js, bulk data imports, and build-time configuration loaders. |
| 🔵 **Foundational / Engine** | Runtime internals | Coroutine desugaring, Execution context stack suspension, Microtask continuation resumption | Mandatory for Staff/Principal engineering evaluations, performance profiling, and runtime architecture. |

---

## Core Concepts (20 Subtopics)

### Part 1 — What Is an `async` Function? Automatic Promise Wrapping `🟢 [Daily Driver]`

An `async function` always returns a Promise. Any returned non-Promise value is automatically wrapped via `Promise.resolve(value)`.

---

### Part 2 — How `async` Always Produces a Promise `🟢 [Daily Driver]`

```js
async function getNum() { return 10; }
console.log(getNum()); // Promise { <fulfilled>: 10 }
```

---

### Part 3 — Returning Promises from `async` Functions `🔵 [Foundational / Engine]`

Returning a Promise from an async function adopts that Promise's state and unwraps it seamlessly for downstream callers.

---

### Part 4 — What Does `await` Actually Do? Coroutine Execution Suspension `🔵 [Foundational / Engine]`

`await promise` suspends the execution of the current async function context, releasing the call stack to the Event Loop. When the promise settles, the remaining function body is scheduled onto the **Microtask Queue**.

---

### Part 5 — `await` with Non-Promise Values `🟢 [Daily Driver]`

`await 10` implicitly converts to `await Promise.resolve(10)`, guaranteeing asynchronous microtask continuation.

---

### Part 6 — Valid Async Contexts & Top-Level `await` `🟢 [Daily Driver]`

Top-level `await` is permitted at the module root in ES Modules (`<script type="module">` / `.mjs`), pausing module graph evaluation until the awaited promise settles.

---

### Part 7 — The Fallacy: `await` Does NOT Make Operations Parallel `🔴 [Production-Critical]`

`await a(); await b();` runs in strict series. `await` halts function execution; it never starts sibling tasks in parallel on its own.

---

### Part 8 — Kicking Off Promises Before `await` (Eager Invocation) `🟢 [Daily Driver]`

```js
const p1 = fetchA(); // 🟢 Starts immediately
const p2 = fetchB(); // 🟢 Starts immediately
const [res1, res2] = [await p1, await p2];
```

---

### Part 9 — Parallel Execution with `Promise.all()` `🟢 [Daily Driver]`

```js
const [user, posts] = await Promise.all([getUser(), getPosts()]);
```
Clean, idiomatic syntax for concurrent independent operations.

---

### Part 10 — Dependent Operations in DAG Chains `🟢 [Daily Driver]`

When `Operation B` requires data from `Operation A` (`getPosts(user.id)`), sequential `await` is architecturally necessary and correct.

---

### Part 11 — Mixed Dependency Graphs: Blending Sequential & Parallel `🟢 [Daily Driver]`

```text
User ──► [Posts, Settings] ──► Comments
```
Fetch `User` $\to$ Parallel `Promise.all([Posts, Settings])` $\to$ Fetch `Comments`.

---

### Part 12 — Synchronous-Style Error Handling with `try/catch` `🟢 [Daily Driver]`

```js
try {
  const data = await fetchData();
} catch (err) {
  console.error("Caught rejected promise:", err.message);
}
```

---

### Part 13 — Rejected Promises and the `await` Exception Transformation `🔵 [Foundational / Engine]`

When an awaited promise rejects, the JavaScript engine converts the rejection reason into a thrown exception at the exact `await` expression.

---

### Part 14 — Why `try/catch` Cannot Catch Delayed Callback Errors `🔴 [Production-Critical]`

`try { setTimeout(() => { throw new Error(); }, 100); } catch (e)` fails to catch because the callback runs in a separate future call stack turn.

---

### Part 15 — Strategic Error Boundaries `🟢 [Daily Driver]`

Separate data fetching `try/catch` blocks from UI processing blocks to avoid misclassifying rendering bugs as network failures.

---

### Part 16 — Guaranteed Cleanup with `finally` in `async` Functions `🟢 [Daily Driver]`

```js
try { await api.sync(); } finally { setLoading(false); }
```
Guarantees UI loading spinners or file descriptors are reset on both success and error paths.

---

### Part 17 — Unhandled Rejection Hazards from Orphaned Async Functions `🔴 [Production-Critical]`

Calling `asyncFunction()` without `await` or `.catch()` causes uncaught rejections to crash Node.js processes or trigger global browser error events.

---

### Part 18 — Async Loops: Sequential Iteration with `for...of` `🟢 [Daily Driver]`

```js
for (const item of items) {
  await processItem(item); // 🟢 Strictly sequential (rate-limited / ordered)
}
```

---

### Part 19 — Parallel Async Mapping with `Promise.all(arr.map(...))` `🟢 [Daily Driver]`

```js
const results = await Promise.all(items.map(async (item) => processItem(item)));
```
Runs all iterations concurrently; aggregates all results into a preserved-order array.

---

### Part 20 — The 10-Point Senior `async/await` Audit Checklist `🟢 [Daily Driver]`

```text
1. Are independent awaits parallelized with Promise.all? ──► 2. Is forEach(async) completely eliminated?
3. Are try/catch boundaries scoped to specific failure domains? ──► 4. Is finally used for teardown?
5. Are orphaned async function calls caught? ──► 6. Is top-level await used only in ESM modules?
7. Is for...of used for ordered/rate-limited loops? ──► 8. Are CPU-heavy loops offloaded?
9. Is Promise.all concurrency bounded for large arrays? ──► 10. Does async always return a Promise?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Async Control Pattern | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **`async` / `await` (`try/catch`)** | Sequential async workflows, business logic pipelines, synchronous readability. | Pure functional transformations or simple single-shot event hooks. | Easy to accidentally write sequential request waterfalls. | Promise `.then()` chains. |
| **`Promise.all(map)`** | Parallel mapping over small-to-medium datasets ($< 50$ items). | Huge datasets ($10,000$ items) that overload backend API rate limits. | Fires all requests simultaneously; can exhaust connection pool. | Bounded concurrency queue (p-limit). |
| **`for...of` + `await`** | Sequential dependent processing, rate-limited APIs, strict order of execution. | Independent operations that can safely run concurrently. | Slower total execution time ($\sum T_i$). | `Promise.all`. |
| **`Array.prototype.forEach`** | Pure synchronous array iterations only. | **ANY asynchronous code using `await` or Promises.** | **BANNED FOR ASYNC:** Ignores returned promises; silent race conditions. | `for...of` or `Promise.all(map)`. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Async Batch Processor & UI Dashboard in TypeScript
```tsx
import React, { useState, useCallback, useRef } from 'react';

// ==========================================
// 1. ASYNC BATCH PROCESSOR HOOK
// ==========================================
export interface BatchMetrics {
  total: number;
  completed: number;
  progressPercent: number;
  isRunning: boolean;
  errors: string[];
}

export function useAsyncBatchProcessor<T, R>(
  processFn: (item: T) => Promise<R>,
  concurrencyLimit: number = 3
) {
  const [metrics, setMetrics] = useState<BatchMetrics>({
    total: 0,
    completed: 0,
    progressPercent: 0,
    isRunning: false,
    errors: []
  });

  const abortRef = useRef(false);

  const processBatch = useCallback(
    async (items: T[]): Promise<R[]> => {
      abortRef.current = false;
      const total = items.length;
      const results: R[] = [];
      const errors: string[] = [];
      let completed = 0;

      setMetrics({ total, completed: 0, progressPercent: 0, isRunning: true, errors: [] });

      // 🟢 Bounded Concurrency Pool Execution
      const executing = new Set<Promise<void>>();

      for (const item of items) {
        if (abortRef.current) break;

        const taskPromise = (async () => {
          try {
            const res = await processFn(item);
            results.push(res);
          } catch (err: any) {
            errors.push(err.message);
          } finally {
            completed++;
            setMetrics({
              total,
              completed,
              progressPercent: Math.round((completed / total) * 100),
              isRunning: completed < total && !abortRef.current,
              errors
            });
          }
        })();

        const wrapped = taskPromise.then(() => {
          executing.delete(wrapped);
        });

        executing.add(wrapped);

        // If concurrency limit reached, wait for the fastest task to finish
        if (executing.size >= concurrencyLimit) {
          await Promise.race(executing);
        }
      }

      // Wait for remaining running tasks to drain
      await Promise.all(executing);
      return results;
    },
    [processFn, concurrencyLimit]
  );

  const cancel = useCallback(() => {
    abortRef.current = true;
  }, []);

  return { processBatch, metrics, cancel };
}

// ==========================================
// 2. REACT DASHBOARD CONSUMER
// ==========================================
export function EnterpriseAsyncBatchDashboard() {
  const mockApiCall = useCallback(async (id: number) => {
    // Simulating variable latency API call
    const delay = Math.floor(Math.random() * 200) + 100;
    await new Promise((res) => setTimeout(res, delay));
    if (id === 7) throw new Error(`Item #${id} failed: Rate Limit Exceeded`);
    return `Record #${id} processed in ${delay}ms`;
  }, []);

  const { processBatch, metrics, cancel } = useAsyncBatchProcessor(mockApiCall, 3);

  const handleStart = () => {
    const dataset = Array.from({ length: 12 }, (_, i) => i + 1);
    processBatch(dataset);
  };

  return (
    <div className="async-batch-card">
      <header className="card-header">
        <h3>Enterprise Bounded Concurrency Processor</h3>
        <span className="badge">Concurrency Limit: 3</span>
      </header>

      <p className="architecture-description">
        Demonstrates controlled async iteration using <code>Promise.race</code> pool management and <code>async/await</code>, eliminating backend rate-limit saturation.
      </p>

      <div className="controls">
        <button onClick={handleStart} disabled={metrics.isRunning} className="start-btn">
          {metrics.isRunning ? 'Processing Batch...' : '🚀 Process 12 Async Items (Pool: 3)'}
        </button>
        <button onClick={cancel} disabled={!metrics.isRunning} className="cancel-btn">
          🛑 Abort
        </button>
      </div>

      {metrics.isRunning && (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${metrics.progressPercent}%` }} />
          <span>{metrics.progressPercent}% ({metrics.completed} / {metrics.total} items)</span>
        </div>
      )}

      {metrics.errors.length > 0 && (
        <div className="error-list">
          <h4>⚠️ Batch Errors Intercepted:</h4>
          {metrics.errors.map((err, i) => (
            <p key={i} className="error-item">{err}</p>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🧠 Part 04 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: Microtask Suspension Order with `await`
```js
async function foo() {
  console.log("2: foo start");
  await null; // Suspends foo, schedules microtask continuation
  console.log("4: foo resume");
}

console.log("1: script start");
foo();
console.log("3: script end");
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
1: script start
2: foo start
3: script end
4: foo resume
```
**Why:**  
1. `1: script start` logs synchronously on Call Stack.  
2. `foo()` begins synchronously $\to$ logs `2: foo start`.  
3. `await null` suspends `foo()` and queues its continuation in the Microtask Queue.  
4. Control returns to the outer script $\to$ logs `3: script end`.  
5. Call Stack empties $\to$ Microtask Queue drains $\to$ `4: foo resume` logs.
</details>

---

### Prediction Challenge 2: The `forEach(async)` Concurrency Ordering
```js
const items = [1, 2, 3];

console.log("Start");

items.forEach(async (num) => {
  await Promise.resolve();
  console.log("Item:", num);
});

console.log("End");
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Start
End
Item: 1
Item: 2
Item: 3
```
**Why:** `forEach` does not await the async callbacks. It executes them synchronously in loop order, ignores the returned promises, logs `"End"` immediately on the Call Stack, and then the microtasks log `Item: 1`, `Item: 2`, `Item: 3`.
</details>

---

### Prediction Challenge 3: Parallel Promise Eager Invocation
```js
function makeTimer(id, delay) {
  return new Promise((res) => {
    setTimeout(() => {
      console.log("Finished:", id);
      res(id);
    }, delay);
  });
}

async function run() {
  const p1 = makeTimer("A", 30);
  const p2 = makeTimer("B", 10);

  const res1 = await p1;
  const res2 = await p2;
  console.log("All done:", res1, res2);
}

run();
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Finished: B
Finished: A
All done: A B
```
**Why:** Both `makeTimer("A")` and `makeTimer("B")` start eagerly when called. Timer B finishes first at 10ms. `run()` awaits `p1` (finishes at 30ms), then checks `p2` (already finished), logging `"All done: A B"`.
</details>

---

### Prediction Challenge 4: `try/catch/finally` Value Overrides in Async Functions
```js
async function testReturn() {
  try {
    return "TRY_VAL";
  } catch {
    return "CATCH_VAL";
  } finally {
    return "FINALLY_OVERRIDE"; // Explicit return in finally overrides try!
  }
}

testReturn().then((val) => console.log("Result:", val));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Result: FINALLY_OVERRIDE
```
**Why:** In JavaScript, an explicit `return` statement inside a `finally` block supersedes and overrides any previous `return` from the preceding `try` or `catch` blocks.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What does placing the `async` keyword in front of a function declaration do?  
<details>
<summary><strong>Answer</strong></summary>
The `async` keyword ensures that the function always returns a Promise. If the function returns a non-promise primitive or object, JavaScript automatically wraps it in a fulfilled Promise (`Promise.resolve(val)`). If an uncaught error is thrown inside, the returned Promise rejects with that error.
</details>

**Q2:** Why should you never use `async` callbacks inside `Array.prototype.forEach`?  
<details>
<summary><strong>Answer</strong></summary>
`forEach` is a synchronous method from ES5 that ignores the Promises returned by its callback functions. It does not await them, cannot catch rejections, and returns `undefined` immediately before asynchronous operations complete, causing race conditions and unhandled background operations.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** What is the difference in execution between sequential `await` and `Promise.all()`?  
<details>
<summary><strong>Answer</strong></summary>
- **Sequential `await` (`await a(); await b()`):** Operation `b()` does not start until operation `a()` has fully completed. Total duration is the sum of all durations ($\sum T_i$).  
- **`Promise.all([a(), b()])`:** Both operations start concurrently at the same time. Total duration is bounded by the slowest operation ($\max T_i$).
</details>

**Q4:** How does `try / catch` handle errors when paired with `await`?  
<details>
<summary><strong>Answer</strong></summary>
When a Promise awaited inside a `try` block rejects, the JavaScript engine unwraps the rejection reason and re-throws it as a standard JavaScript exception at that exact line of code, allowing standard `catch (error) {}` blocks to intercept it synchronously.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** How does `await` interact with the Event Loop under the hood? Does it freeze the browser tab?  
<details>
<summary><strong>Answer</strong></summary>
`await` does **not** freeze the browser tab. Under the hood, `await` pauses only the *local execution context* of the async function and pushes a continuation callback into the Microtask Queue. It immediately releases the main thread Call Stack, allowing the Event Loop to handle user clicks, DOM rendering, and timer callbacks while the awaited Promise is pending in the host environment.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How did JavaScript engines (V8) historically implement `async/await` using Generator coroutines and the `spawn` helper, and what optimizations were introduced in ES2018?  
<details>
<summary><strong>Answer</strong></summary>
1. **Generator Coroutine Transformation (Babel/ES2017):** `async/await` desugared into generator functions (`function*`) managed by a runtime `spawn(generatorFn)` helper. `await promise` became `yield promise`. The runner attached `.then(val => gen.next(val), err => gen.throw(err))` to step the iterator.  
2. **ES2018 Native V8 Optimization (Bypass 3-Microtask Overhead):** Initially, native `await` created 3 microtick steps: creating an internal Promise, wrapping via `PromiseResolve`, and attaching a throwaway handler. V8 optimized this in 2018 by directly attaching the resume handler to the underlying promise instance, reducing `await` suspension overhead from 3 microticks to a single microtick ($1\times$ microtask resumption).
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Async DAG Orchestrator & Bounded Pool

```js
// See runnable implementation in examples/04-async-await-sequential-parallel-loops.js
```

---

## Key Takeaways
1. **`async` Always Returns a Promise:** Automatically wrapped via `Promise.resolve()`.
2. **`await` Suspends Local Context:** Yields call stack; resumes via Microtask Queue.
3. **Eliminate `forEach(async)`:** Use `for...of` (sequential) or `Promise.all(map)` (parallel).
4. **Parallelize Independent Operations:** Avoid accidental sequential request waterfalls.
5. **Bound Concurrency for Bulk Work:** Prevent backend rate limiting with `Promise.race` pools.

---

[⬅️ Part 03: Promise Chaining & Promise Combinators](./03-promise-chaining-combinators-concurrency.md) | [📚 KPI 22 Index](./README.md) | [Part 05: Production Async Patterns, `AbortController` & Race Conditions ➡️](./05-production-async-patterns-race-conditions.md)
