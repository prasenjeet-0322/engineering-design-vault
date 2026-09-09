# Level 06 — React Fundamentals
## KPI 13 — Derived State, Memoization & Render Optimization
### PART 05 — Memoization Crucible, Cost of Over-Optimization & React Compiler

[⬅️ Level 06 Index](../README.md) | [📚 KPI 13 Index](./README.md) | [🧪 Companion Lab](./examples/05-memoization-crucible-react-compiler.html) | [Next KPI ➡️](../14-Render-Performance-Optimization/README.md)

---

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)  
> **Co-Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)

---

# PART 05 — Memoization Crucible, Cost of Over-Optimization & React Compiler

```text
                             THE PERFORMANCE ARCHITECTURE HIERARCHY
                             
   JUNIOR / MID PERFORMANCE ATTEMPT (Local Cargo-Cult)   SENIOR ARCHITECTURAL OPTIMIZATION (Systemic)
   
  ┌──────────────────────────────────────────────┐       ┌──────────────────────────────────────────────┐
  │  "Component renders frequently"              │       │  1. ELIMINATE UNNECESSARY WORK               │
  │        │                                     │       │     • Colocate state to closest consumer     │
  │        ▼                                     │       │     • Eliminate dual-render sync effects     │
  │  Wrap in useMemo()                           │       │     • Normalize state trees                  │
  │        │                                     │       │        │                                     │
  │        ▼                                     │       │        ▼                                     │
  │  Wrap handlers in useCallback()              │       │  2. REDUCE DEPENDENCY SURFACE                │
  │        │                                     │       │     • Pass narrow primitive props            │
  │        ▼                                     │       │     • Leverage immutable structural sharing  │
  │  Wrap component in React.memo()              │       │        │                                     │
  │        │                                     │       │        ▼                                     │
  │        ▼                                     │       │  3. TARGETED MEMOIZATION                     │
  │  💥 Result: Stale closures, high comparison  │       │     • useMemo for measured >1ms calculations │
  │     overhead, zero profiling justification!  │       │     • React.memo on high-frequency tables    │
  └──────────────────────────────────────────────┘       └──────────────────────────────────────────────┘
                                           │
                                           ▼
                           THE REACT COMPILER (REACT FORGET) PARADIGM
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │  Idiomatic React Code ──► Compiler SSA Graph Analysis ──► Automatic Fine-Grained useMemoCache   │
  │  • Shifts memoization from manual developer burden to automatic compiler optimization pass     │
  │  • Purity and correct data-flow architecture remain mandatory prerequisites!                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Master Mental Models

### 1. The Actual Senior-Level Problem

At the junior level, performance optimization is often treated as a reflex:
```text
"This component renders often" ──► Add useMemo ──► Add useCallback ──► Add React.memo
```

At the senior engineering level, the mental model transforms into a rigorous diagnostic inquiry:
```text
What work is actually happening?
       │
       ▼
Why is that work happening? (Props, State, Context, Key Churn)
       │
       ▼
Which dependency changed identity?
       │
       ▼
Was that identity change semantically necessary?
       │
       ▼
Can the work be eliminated architecturally (State colocation, pure derivation)?
       │
       ▼
What does avoiding the work cost (Comparison latency, memory retention, complexity)?
       │
       ▼
Did Chrome DevTools / React Profiler PROVE the optimization improved user metrics?
```

That is the distinction between cargo-cult memoization and **senior performance engineering**.

---

### 2. The Master Optimization Equation

$$\text{Net Performance Improvement} = \text{Unnecessary Work Eliminated} - \text{Optimization Overhead} - \text{Architectural Complexity}$$

Where **Optimization Overhead** includes:
1. **CPU Dependency Comparisons:** `Object.is` iterations on every render pass.
2. **Prop Comparisons:** `shallowEqual` and custom comparator traversals.
3. **Memory Retention:** Retaining old closures, heap allocations, and cached arrays in Fiber nodes.
4. **Cache Invalidation Rates:** Ineffective caches that fail bailout $>90\%$ of the time.
5. **Cognitive Complexity:** Stale closure bugs, broken dependency arrays, and maintenance drag.

---

### 3. The 7-Stage Optimization Hierarchy

Always apply optimizations in this strict order of priority:

```text
  1. ELIMINATE UNNECESSARY WORK ENTIRELY
     └── Remove synchronization effects, derived state syncing, and redundant state slices.
  
  2. REDUCE WORK MAGNITUDE
     └── Colocate state, decompose monolithic components, and narrow subscription scopes.
  
  3. REDUCE WORK FREQUENCY
     └── Debounce/throttle input streams, batch updates, and use transitions.
  
  4. REDUCE DEPENDENCY SURFACE AREA
     └── Pass primitive props (`id`, `title`) instead of multi-kilobyte composite objects.
  
  5. PRESERVE USEFUL IDENTITY
     └── Leverage structural sharing in immutable state trees.
  
  6. MEMOIZE EXPENSIVE STABLE WORK
     └── Apply `useMemo` to measured $>1\text{ms}$ pure mathematical calculations.
  
  7. ADD SPECIALIZED COMPARISON BOUNDARIES
     └── Apply `React.memo` to high-count list items and complex charting nodes.
```

The further down this hierarchy you venture, the stronger your empirical profiling justification must be.

---

### 4. The 3 Layers of React Performance

```text
  ┌────────────────────────────────────────────────────────────┐
  │  LAYER 1: APPLICATION ARCHITECTURE                         │
  │  • State Ownership & Normalization                         │
  │  • Subscription Granularity (Zustand / Redux Selectors)    │
  │  • Data Fetching & Caching Strategy (TanStack Query)       │
  └─────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
  ┌────────────────────────────────────────────────────────────┐
  │  LAYER 2: RENDER ARCHITECTURE                              │
  │  • Component Boundaries & Tree Composition                 │
  │  • State Colocation (Moving state down the tree)           │
  │  • Structural Sharing in State Transitions                 │
  └─────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
  ┌────────────────────────────────────────────────────────────┐
  │  LAYER 3: LOCAL HOOK OPTIMIZATION                          │
  │  • useMemo, useCallback, React.memo                        │
  │  • Custom arePropsEqual Comparators                        │
  └────────────────────────────────────────────────────────────┘
```

> **Crucial Axiom:** A Layer 3 local optimization (`useMemo`) cannot reliably compensate for a broken Layer 1 or Layer 2 architecture.

---

## Layer 2 — 🔬 The Cost of Over-Optimization & The Memoization Tax

### 5. Scenario: The "Over-Optimized" Orders Table

Consider this seemingly optimized component:
```tsx
function OrdersTable({ orders, query, sort }: Props) {
  const filtered = useMemo(
    () => filterOrders(orders, query),
    [orders, query]
  );

  const sorted = useMemo(
    () => sortOrders(filtered, sort),
    [filtered, sort]
  );

  return <Table rows={sorted} />;
}
```

#### The Senior Architectural Questions:
1. How expensive is `filterOrders`? If it takes $0.05\text{ms}$ on 50 items, memoization saves zero perceptible time.
2. How frequently does `orders` change? If `orders` updates on every WebSocket tick, `filtered` and `sorted` invalidate 100% of the time, making both `useMemo` hooks pure CPU overhead!
3. Can the data be normalized upstream? Selecting only visible order IDs via a selector eliminates table-wide array re-filtering entirely.

---

### 6. The "Memoization Tax" Incident

#### The Disaster Scenario:
An engineering team mandated a strict ESLint rule: *"Wrap all components in `React.memo`, all objects in `useMemo`, and all functions in `useCallback`."*

```text
  CODEBASE ACCUMULATED:
  • 600+ React.memo wrappers
  • 1,200+ useCallback hooks
  • 800+ useMemo hooks
  • 50+ custom arePropsEqual comparators
  
  OBSERVED SYMPTOMS:
  • Memory footprint grew by 35MB due to retained closure contexts in V8 heap.
  • Stale closure bugs emerged across 15 critical checkout and auth flows.
  • Chrome DevTools Profiler became unreadable due to hundreds of Hook cells per Fiber.
  • Frame rates on low-end mobile devices DROPPED by 18%!
```

#### Why it occurred:
1. **The Allocation Overhead:** Every `useCallback` and `useMemo` allocates a Hook cell object in the Fiber's singly linked list and stores a dependency array tuple.
2. **Comparison Latency:** On every render pass, React iterates over each dependency array executing `Object.is`.
3. **Cache Invalidation Failure:** When parent components passed inline object literals, the child memoization failed to bail out, meaning the browser paid **both** the comparison cost and the full render cost!

---

### 7. State Colocation vs. Memoization

Consider a monolithic dashboard:
```tsx
// 💥 POOR ARCHITECTURE: High-level state invalidates entire tree
function Dashboard() {
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState("dark");
  const [notifications, setNotifications] = useState([]);

  return (
    <div className={theme}>
      <Header notifications={notifications} />
      <SearchInput value={search} onChange={setSearch} />
      <HeavyAnalyticsChart data={buildChart(search)} />
      <ThemeSelector value={theme} onChange={setTheme} />
    </div>
  );
}
```

When the user selects a new `theme` or receives a `notification`, the entire `Dashboard` re-renders, recalculating `buildChart(search)`.

A junior fix is to wrap `buildChart(search)` in `useMemo` and wrap `HeavyAnalyticsChart` in `React.memo`.

#### The Senior Refactor (State Colocation):
Move the state down to the components that actually care about it:

```tsx
// ✅ SENIOR ARCHITECTURE: Colocated state shrinks invalidation regions
function Dashboard() {
  return (
    <ThemeProvider>
      <DashboardLayout>
        <NotificationBell />
        <AnalyticsSection />
      </DashboardLayout>
    </ThemeProvider>
  );
}

function AnalyticsSection() {
  const [search, setSearch] = useState(""); // ✅ Search state lives strictly inside its section!
  return (
    <div>
      <SearchInput value={search} onChange={setSearch} />
      <HeavyAnalyticsChart data={buildChart(search)} />
    </div>
  );
}
```

```text
  STATE SCOPE DETERMINES INVALIDATION SCOPE
  
  Global / High State:
  theme update ──► Dashboard Rerenders ──► Entire Subtree Traversed 💥
  
  Colocated State:
  theme update ──► ThemeSelector Rerenders ──► AnalyticsSection NOT Touched! ✅
```

---

## Layer 3 — 🔬 The React Compiler (React Forget) Deep Dive

### 8. What the React Compiler Actually Is

The **React Compiler** (formerly known as *React Forget*) is an optimizing build-time Babel/compiler plugin created by the React core team.

It analyzes plain JavaScript semantics, Static Single Assignment (SSA) intermediate representation (IR), and reactive Hook dependencies to automatically insert fine-grained memoization instructions (`$empty`, `useMemoCache`) into compiled output.

```text
  SOURCE CODE (Written by Developer)
  ┌────────────────────────────────────────────────────────────┐
  │  function ProductCard({ product, onSelect }) {             │
  │    const priceFormatted = formatCurrency(product.price);   │
  │    return (                                                │
  │      <div onClick={() => onSelect(product.id)}>            │
  │        <h3>{product.title}</h3>                            │
  │        <p>{priceFormatted}</p>                             │
  │      </div>                                                │
  │    );                                                      │
  │  }                                                         │
  └─────────────────────────────┬──────────────────────────────┘
                                │
                                ▼ React Compiler Compilation Pass
  COMPILED OUTPUT (Auto-Memoized with useMemoCache)
  ┌────────────────────────────────────────────────────────────┐
  │  function ProductCard(t0) {                                │
  │    const $ = useMemoCache(4);                              │
  │    const { product, onSelect } = t0;                       │
  │    let t1;                                                 │
  │    if ($[0] !== product.price) {                           │
  │      t1 = formatCurrency(product.price);                   │
  │      $[0] = product.price;                                 │
  │      $[1] = t1;                                            │
  │    } else {                                                │
  │      t1 = $[1];                                            │
  │    }                                                       │
  │    ...                                                     │
  └────────────────────────────────────────────────────────────┘
```

---

### 9. What the React Compiler Solves vs. What It CANNOT Solve

| Category | Solved by React Compiler | CANNOT Be Solved by Compiler |
| :--- | :--- | :--- |
| **Manual Hook Boilerplate** | Eliminates manual `useMemo`, `useCallback`, `React.memo` | Does NOT fix state placement or wrong state ownership |
| **Inline Function Stability** | Automatically caches callback closures where safe | Does NOT eliminate network latency or slow DB queries |
| **JSX Element Caching** | Automatically caches unmutated JSX virtual elements | Does NOT resolve asynchronous race conditions |
| **Dependency Arrays** | Automatically infers correct SSA reactive dependencies | Does NOT make impure render side-effects safe |
| **Structural Sharing** | Automatically preserves stable derived object references | Does NOT replace virtualization for 50,000 DOM nodes |

> ⚠️ **CRITICAL SENIOR INSIGHT:** The React Compiler does not eliminate the need for senior architectural engineering. It eliminates the manual *syntactic ceremony* of caching while making architectural purity, clean data flows, and state colocation **even more important**.

---

### 10. Purity: The Absolute Prerequisite for Compiler Optimization

The React Compiler relies on the **Rules of React** (mathematical function purity during render):
1. Components must be **idempotent**: `Render(Props, State) => Virtual DOM`.
2. Render execution must **never** mutate external variables, global stores, or arguments.
3. Hook calls must remain unconditional.

If a component mutates props or reads mutable globals during render:
```tsx
// 💥 IMPURE CODE: Compiler optimization will BREAK this component!
let globalCounter = 0;

function BadComponent({ user }) {
  globalCounter++; // 💥 Mutation during render!
  user.lastRendered = Date.now(); // 💥 Mutating prop argument!
  return <div>{user.name} - Render #{globalCounter}</div>;
}
```
The compiler's memoization cache will freeze `globalCounter` and `lastRendered`, causing severe rendering desynchronization.

---

## Layer 4 — 🧪 Prediction Challenges & Diagnostic Runbook

### 11. Prediction Challenge 1
```tsx
function SearchPage({ items }: { items: Item[] }) {
  const [query, setQuery] = useState("");
  const sorted = useMemo(() => [...items].sort(), [items]);
  const filtered = useMemo(() => sorted.filter(x => x.name.includes(query)), [sorted, query]);
  return <List items={filtered} />;
}
```
*Scenario:* The user types in `query`.  
*Question:* Does `sorted` re-execute?  
**Answer:** **No.** `sorted` depends only on `items`. When `query` changes, `items` remains stable, so `sorted` returns its cached array pointer. Only `filtered` re-executes.

---

### 12. Prediction Challenge 2
*Scenario:* A codebase adds `React.memo` to a component that renders `<span className="badge">{text}</span>` (render duration: $0.01\text{ms}$).  
*Question:* Will this improve overall application FPS?  
**Answer:** **No.** Running `shallowEqual` on props and Fiber memoization checks takes $\approx 0.015\text{ms}$, creating a slight net negative performance impact with added memory retention.

---

### 13. Prediction Challenge 3
*Question:* Can the React Compiler fix an infinite re-render loop caused by `useEffect(() => { setState({}); }, [state])`?  
**Answer:** **No.** Infinite state synchronization loops in `useEffect` are architectural state-machine defects that execute in the commit/effect phase, outside compiler-level render caching.

---

### 14. Prediction Challenge 4
*Scenario:* A developer removes all `useMemo` and `useCallback` calls from a pure component in a project with React Compiler enabled.  
*Question:* Will the application suffer performance regressions?  
**Answer:** **No** (assuming standard compiler configuration and code conforming to the Rules of React). The compiler automatically injects fine-grained `$ = useMemoCache()` instructions for all derived values and JSX blocks.

---

### 15. Prediction Challenge 5
```tsx
function UserProfile({ userId }: { userId: string }) {
  const user = useMemo(() => fetchUserFromApi(userId), [userId]);
  return <div>{user.name}</div>;
}
```
*Question:* Is this an appropriate use of `useMemo`?  
**Answer:** **No!** `useMemo` is strictly for **synchronous, pure computations**. Asynchronous network fetching inside `useMemo` is a severe anti-pattern; data fetching belongs in `useQuery` (TanStack Query), Suspense, or `useEffect`.

---

## Layer 5 — 🎓 Staff-Level Interview Questions, 50-Point Checklist & Mastery Gate

### 16. Staff-Level Interview Questions & Deep Architectural Answers

#### Q1: Walk through the complete decision process for addressing an input lag bottleneck on a search dashboard.
**Architectural Answer:**  
1. **Profile First:** Open Chrome DevTools Performance Profiler. Record the interaction and identify Long Tasks ($>50\text{ms}$).
2. **Isolate Work:** Determine if the delay is caused by main-thread JS computation, React Fiber reconciliation, layout thrashing, or DOM paint.
3. **Decompose & Colocate:** If caused by high-level re-renders, push search state down to the search box using `useDeferredValue` or `useTransition` for non-blocking rendering.
4. **Data Normalization & Virtualization:** If rendering $>500$ DOM nodes, implement list virtualization (`@tanstack/react-virtual`) rather than memoizing individual items.
5. **Targeted Memoization:** If a pure calculation (e.g. fuzzy search scoring) takes $>2\text{ms}$, wrap it in `useMemo` with primitive dependencies.
6. **Verify:** Re-record profiler trace to confirm interaction to next paint (INP) is $<50\text{ms}$.

#### Q2: How does the React Compiler's `useMemoCache` differ mechanically from traditional `useMemo` linked-list cells?
**Architectural Answer:**  
Traditional `useMemo` stores `[value, deps]` in the Fiber's dynamic singly linked list of Hook objects. The React Compiler allocates a **fixed-size array slot** (`useMemoCache(size)`) per component at compile-time. The compiler emits direct index checks (`if ($[0] !== dep)`) rather than allocating dynamic dependency tuples and iterating over them with `Object.is`. This reduces memory overhead, eliminates garbage collection churn, and enables sub-expression level caching.

#### Q3: Why is "premature memoization" considered harmful in enterprise React applications?
**Architectural Answer:**  
Premature memoization introduces:
1. **Fragile Dependency Contracts:** Out-of-sync dependency arrays produce critical stale closure and state desynchronization bugs.
2. **Main-Thread Memory Leaks:** Retaining old closures prevents the V8 garbage collector from cleaning up large lexical scopes.
3. **Debugging Overhead:** Obscures profiling data, making it difficult to determine whether updates stem from props, state, or context.
4. **Negative ROI:** The CPU cost of evaluating dependency equality checks frequently exceeds the execution cost of rendering pure Virtual DOM nodes.

---

### 17. The 50-Point Senior Performance Engineering Master Checklist

#### Category 1: Performance Mental Model & Hierarchy (Items 1–10)
- [ ] 1. Optimize for eliminated work and frame rates, not arbitrary render counts.
- [ ] 2. Prioritize state colocation and component composition over local Hook memoization.
- [ ] 3. Understand the 3 Layers of React Performance (Application -> Render -> Local Hook).
- [ ] 4. Profile before optimizing using Chrome DevTools and React DevTools Profiler.
- [ ] 5. Calculate Optimization ROI: `Avoided Work - Comparison Cost - Complexity`.
- [ ] 6. Re-profile after applying optimizations to verify concrete millisecond reductions.
- [ ] 7. Ensure application correctness and fresh data flow are never compromised for speed.
- [ ] 8. Treat `React.memo` and `useMemo` as performance hints, not correctness mechanisms.
- [ ] 9. Avoid premature memoization on trivial UI primitives ($<0.05\text{ms}$ render duration).
- [ ] 10. Understand that a re-render is cheap; DOM mutations and layout thrashing are expensive.

#### Category 2: State Placement & Invalidation Topology (Items 11–20)
- [ ] 11. Colocate state to the lowest common ancestor that actually consumes the data.
- [ ] 12. Move static container shells outside dynamic data-fetching subtrees.
- [ ] 13. Split monolithic context providers into fine-grained static and dynamic slices.
- [ ] 14. Use composition (`children` or render props) to pass static parent elements down.
- [ ] 15. Leverage immutable structural sharing so untouched state branches preserve pointers.
- [ ] 16. Normalize relational state entities by ID to avoid deep object graph traversals.
- [ ] 17. Use `useDeferredValue` or `useTransition` for non-blocking background derivations.
- [ ] 18. Eliminate intermediate derived state stored in `useState` and synchronized via `useEffect`.
- [ ] 19. Prevent high-frequency mouse/scroll coordinates from triggering React state re-renders.
- [ ] 20. Use CSS variables, transforms, or `useRef` for high-frequency animations (60/120 FPS).

#### Category 3: Hook & Component Memoization Discipline (Items 21–30)
- [ ] 21. Reserve `useMemo` for computationally heavy ($>1.0\text{ms}$) pure data transformations.
- [ ] 22. Move calculation-only options objects inside the `useMemo` factory function.
- [ ] 23. Extract static configuration objects outside the component declaration.
- [ ] 24. Use `useCallback` only when passing functions to `React.memo` components or Hook deps.
- [ ] 25. Avoid wrapping callbacks that are passed exclusively to native DOM tags (`<button>`).
- [ ] 26. Use functional state updaters `setCount(c => c + 1)` to eliminate callback state deps.
- [ ] 27. Ensure custom `arePropsEqual` comparators account for every prop affecting output.
- [ ] 28. Never put unbenchmarked recursive `deepEqual` checks inside `React.memo` comparators.
- [ ] 29. Prefer narrowing component prop interfaces over maintaining custom comparators.
- [ ] 30. Memoize Context Provider `value` objects with `useMemo` to prevent consumer churn.

#### Category 4: The React Compiler (React Forget) (Items 31–40)
- [ ] 31. Understand that React Compiler automates memoization via compile-time SSA analysis.
- [ ] 32. Maintain 100% pure component render functions (no mutations during render).
- [ ] 33. Obey the Rules of React and ESLint `react-compiler` checks strictly.
- [ ] 34. Recognize that the compiler does NOT fix state colocation or architectural flaws.
- [ ] 35. Recognize that the compiler does NOT fix asynchronous race conditions or network latency.
- [ ] 36. Understand how the compiler emits `$ = useMemoCache(n)` instead of linked-list Hook cells.
- [ ] 37. Audit legacy manual memoizations before removing them during compiler migration.
- [ ] 38. Use `useMemo` for non-standard or external library cache contracts when needed.
- [ ] 39. Verify that StrictMode double-rendering passes without side effects in compiler builds.
- [ ] 40. Prepare codebase architecture for compiler adoption by refactoring impure patterns.

#### Category 5: Production Verification & Architecture Reviews (Items 41–50)
- [ ] 41. Conduct Performance Architecture Reviews for any PR introducing memoization.
- [ ] 42. Audit Total Blocking Time (TBT) and Interaction to Next Paint (INP) in Web Vitals.
- [ ] 43. Virtualize large collections ($>100$ items) with `@tanstack/react-virtual`.
- [ ] 44. Audit heap memory snapshots to verify unmounted components release closures.
- [ ] 45. Test application on low-power mobile devices and under 4x CPU throttling.
- [ ] 46. Ensure test suites run identically with or without memoization boundaries.
- [ ] 47. Remove unused `useCallback` and `useMemo` hooks that provide zero measurable benefit.
- [ ] 48. Identify and resolve stale closure bugs caused by disabled `exhaustive-deps`.
- [ ] 49. Document architectural performance boundaries with clear component diagrams.
- [ ] 50. Master the complete KPI 13 performance philosophy: Architecture First, Measurement Always!

---

## 🏆 KPI 13 Mastery & Graduation Gate

```text
                                 THE COMPLETE KPI 13 DECISION TREE
                                 
                                     PERFORMANCE BOTTLENECK
                                                │
                                                ▼
                                    Can we ELIMINATE the work?
                                                │
                                ┌───────────────┴───────────────┐
                                ▼                               ▼
                               YES                             NO
                                │                               │
                      Colocate State / Derive          Can we REDUCE frequency?
                      Synchronously in Render                   │
                                                        ┌───────┴───────┐
                                                        ▼               ▼
                                                       YES             NO
                                                        │               │
                                              useTransition /     Is calculation
                                              Virtualize List     expensive (>1ms)?
                                                                        │
                                                                ┌───────┴───────┐
                                                                ▼               ▼
                                                               YES             NO
                                                                │               │
                                                           useMemo()      Plain Render
                                                           with Primitive Derivation
                                                           Dependencies   (Zero Hooks)
```

---

## 🧭 Navigation & Next Steps

| Resource | Link |
| :--- | :--- |
| **⬅️ Previous Part** | [PART 04 — React.memo, Bailout Semantics & Custom Comparators](./04-react-memo-component-caching.md) |
| **🧪 Interactive Lab** | [Companion Lab — 05 Memoization Crucible & React Compiler](./examples/05-memoization-crucible-react-compiler.html) |
| **📚 KPI 13 Index** | [Derived State, Memoization & Render Optimization](./README.md) |
| **Next KPI ➡️** | [KPI 14 — Render Performance, Transitions & Concurrency](../14-Render-Performance-Optimization/README.md) |
