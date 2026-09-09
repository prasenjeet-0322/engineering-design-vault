# Level 06 — React Fundamentals
## KPI 14 — Render Performance, Transitions & Concurrency
### PART 01 — The Architecture of Render Performance & Concurrent Transitions

[⬅️ Level 06 Index](../README.md) | [📚 KPI 14 Index](./README.md) | [🧪 Companion Lab](./examples/01-architecture-of-render-performance.html) | [Next Part ➡️](./02-usetransition-and-non-blocking-rendering.md)

---

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)  
> **Co-Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)

---

# PART 01 — The Architecture of Render Performance & Concurrent Transitions

```text
                             THE 3 COMPUTATIONAL LAYERS OF REACT UI
                             
   USER INTERACTION (Keypress, Click, Pointer, Touch, Scroll)
         │
         ▼
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │  LAYER 1: PURE JAVASCRIPT EXECUTION                                                    │
  │  • Event handlers, array filter/sort/reduce, data selectors, business logic            │
  │  • Bottleneck: O(N^2) algorithms, 100k array transformations, heavy CPU calculations   │
  └──────────────────────────────────────┬─────────────────────────────────────────────────┘
                                         │
                                         ▼
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │  LAYER 2: REACT FIBER RECONCILIATION & SCHEDULER                                       │
  │  • Component tree traversal, Hook linked-lists, element diffing, context propagation   │
  │  • Bottleneck: Massive unmemoized subtrees, broad state invalidation regions           │
  └──────────────────────────────────────┬─────────────────────────────────────────────────┘
                                         │
                                         ▼
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │  LAYER 3: BROWSER RENDERING PIPELINE                                                   │
  │  • DOM node mutations, style recalculation, layout (reflow), paint, composite layers   │
  │  • Bottleneck: Forced synchronous layout (getBoundingClientRect), 10,000 active DOMs   │
  └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

### 1. Executive Summary: Why This KPI Exists

In web development, React performance is frequently explained with an incomplete, junior-level heuristic:
$$\text{"Too many renders = slow application"}$$

That equation is fundamentally insufficient for staff-level software engineering:
1. A React application can render 500 times per second and remain silky smooth at 120 FPS if the work is prioritized and lightweight.
2. A React application can render only once and completely freeze the browser tab for 2,000ms if a single synchronous layout measurement or un-virtualized list blocks the main thread.
3. A React application can have 100% `React.memo` coverage and still suffer from catastrophic interaction latency because its state architecture forces high-priority main-thread starvation.

The definitive senior performance question is:
> **"Which layer is consuming the user's interaction budget, why is that work on the critical path, and can that work be eliminated, reduced, moved, deferred, interrupted, or virtualized?"**

---

### 2. The 3 Primary Render Bottlenecks

```text
                                 THE 3 RENDER BOTTLENECKS
                                 
   BOTTLENECK A: PURE JAVASCRIPT            BOTTLENECK B: FIBER WORK            BOTTLENECK C: BROWSER PIPELINE
  ┌───────────────────────────────┐        ┌───────────────────────────────┐   ┌───────────────────────────────┐
  │ const list = items            │        │ Parent update                 │   │ element.getBoundingClientRect()│
  │   .filter(heavyPredicate)     │        │  ├── Traverses 5,000 Fibers   │   │ Large DOM mutations           │
  │   .sort(heavySort);           │        │  ├── Evaluates 10,000 Hooks   │   │ Style Recalc -> Layout ->     │
  │                               │        │  └── Context propagation      │   │ Paint -> Composite            │
  │ • CPU heavy loops (>100ms)    │        │ • High reconciliation cost    │   │ • Forced synchronous reflow   │
  │ • React hasn't even started!  │        │ • DOM diffing overhead        │   │ • Main thread layout lockup   │
  └───────────────────────────────┘        └───────────────────────────────┘   └───────────────────────────────┘
```

#### Bottleneck A — Pure JavaScript Execution
The browser main thread is blocked by raw computational complexity before React reconciliation can even begin:
```typescript
const filtered = hugeArray.filter(expensivePredicate);
const grouped = buildComplexIndex(records);
const result = calculateFinancialProjection(data);
```

#### Bottleneck B — React Reconciliation & Tree Traversal
React spends substantial CPU time determining *what* should change across thousands of component Fiber nodes, even if the actual DOM output changes minimally.

#### Bottleneck C — Browser Rendering Pipeline
Direct browser DOM operations trigger layout thrashing:
```typescript
element.style.width = `${w}px`;
const rect = element.getBoundingClientRect(); // 💥 Forces immediate browser layout!
```

---

### 3. The Master Performance Equation

$$\text{Interaction Cost} = \text{JS Execution} + \text{Fiber Reconciliation} + \text{Commit/DOM Mutation} + \text{Browser Layout/Paint} + \text{Scheduler Overhead}$$

The senior optimization objective:

$$\text{Performance ROI} = \text{Work Eliminated} + \text{Work Reduced} + \text{Work Deferred} + \text{DOM Virtualized} - \text{Comparison Overhead}$$

> **Core Axiom:** The cheapest work is the work that **never happens**.

---

### 4. The Golden Rule of Render Performance

> 🥇 **GOLDEN RULE OF RENDER PERFORMANCE**  
> Do not optimize renders merely because they exist. Optimize work that is **unnecessary**, **expensive**, **interaction-blocking**, **incorrectly prioritized**, or **occurring at excessive scope/frequency**.
>
> A 0.5ms render is not a performance bug.  
> A 150ms interaction-blocking keystroke freeze is a production emergency.

---

### 5. Synchronous Blocking vs. Concurrent Interruptible Rendering

```text
   TRADITIONAL SYNCHRONOUS RENDERING (React 17 and below / Urgent Updates)
   
   User Input ──► [██████████████████████ 300ms Synchronous Render Block ██████████████████████] ──► Paint
   (Browser is 100% frozen: Typing is dropped, animations stutter, user clicks fail!)
   
   CONCURRENT INTERRUPTIBLE RENDERING (React 18/19 Transitions)
   
   User Input ──► [███ Yield ███] ──► Browser handles next keypress ──► [███ Yield ███] ──► Paint
   (Main thread yields cooperatively: Typing remains at 60/120 FPS!)
```

- **Synchronous Rendering:** Once React begins rendering a tree, it cannot stop until the entire Virtual DOM reconciliation is finished and committed.
- **Concurrent Rendering:** React can pause rendering, yield control back to the browser event loop to handle user clicks or keystrokes, and resume or discard the background work later.

---

## Layer 2 — 🔬 Deep Mechanical Breakdown & Fiber Internals

### 6. The React Scheduler & Cooperative Yielding

Concurrent React does **not** run JavaScript on multiple operating system threads (JavaScript in browsers remains single-threaded).

Instead, React implements **cooperative multitasking** using the React Scheduler:

```text
                          THE SCHEDULER WORK LOOP
                          
                      performWorkUntilDeadline()
                                 │
                                 ▼
                     workLoopConcurrent(root)
                                 │
                                 ▼
                 ┌───────────────────────────────┐
                 │  performUnitOfWork(fiber)     │
                 └───────────────┬───────────────┘
                                 │
                                 ▼
                    shouldYieldToHost() == true?
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
               TRUE                            FALSE
                 │                               │
                 ▼                               ▼
       Yield to Main Thread             Continue Next Fiber Unit
       Schedule MessageChannel           in Current Time Slice
       task for next turn
```

React core source code logic (`Scheduler.js`):
```typescript
function shouldYieldToHost(): boolean {
  const timeElapsed = getCurrentTime() - startTime;
  if (timeElapsed < frameInterval) {
    // Current budget (heuristic ~5ms) not yet exhausted
    return false;
  }
  // Yield execution back to the browser host event loop
  return true;
}
```

---

### 7. Priority Lanes: The Internal Priority Spectrum

React 18 coordinates work priorities using 31-bit integer bitmasks known as **Lanes**:

```text
  PRIORITY LEVEL (High to Low)             INTERNAL LANE BITMASK        TYPICAL USE CASE
  ─────────────────────────────────────────────────────────────────────────────────────────────
  1. SyncLane (Urgent)                   0b0000000000000000000000000000001   Controlled inputs, clicks
  2. InputContinuousLane                 0b0000000000000000000000000000100   Mouse drag, sliders, scroll
  3. DefaultLane                         0b0000000000000000000000100000000   Standard data fetch setState
  4. TransitionLanes (Non-urgent)        0b0000000000000111111110000000000   startTransition, useDeferred
  5. IdleLane (Background)               0b0100000000000000000000000000000   Offscreen, pre-fetching
```

```text
  URGENT vs TRANSITION PRIORITY ASSIGNMENT
  
  User types "React" in Search Box
       │
       ├─► Urgent Update (SyncLane):
       │   setInputValue("React") ──► Input updates immediately on screen (0ms delay)
       │
       └─► Transition Update (TransitionLane):
           startTransition(() => setFilter("React")) ──► Filters 50,000 items in background!
```

---

### 8. Render Phase (Interruptible) vs. Commit Phase (Atomic)

| Characteristic | Render / Reconciliation Phase | Commit Phase |
| :--- | :--- | :--- |
| **Execution** | Pure computation, component function calls | DOM node insertion, deletion, attribute mutation |
| **Interruptibility**| **100% Interruptible** in Concurrent Mode | **Strictly Atomic & Synchronous** (Cannot yield) |
| **Side Effects** | Forbidden (must remain pure) | Allowed (`useLayoutEffect`, `useEffect` scheduling) |
| **DOM Visibility** | Invisible to user | Painted to browser screen |

```text
  WHY COMMIT MUST BE ATOMIC:
  React can pause during the Render phase without visual consequences.
  However, React CANNOT pause halfway through the Commit phase, or the user would see a broken, half-rendered DOM tree!
```

---

### 9. The 4 Major Performance Levers

```text
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │  LEVER 1: ELIMINATE                                                                    │
  │  • Remove derived state sync effects; avoid fetching unviewed data                     │
  ├────────────────────────────────────────────────────────────────────────────────────────┤
  │  LEVER 2: REDUCE                                                                       │
  │  • State colocation, component decomposition, structural sharing, useMemo              │
  ├────────────────────────────────────────────────────────────────────────────────────────┤
  │  LEVER 3: DEFER                                                                        │
  │  • startTransition, useDeferredValue (decouple urgent input from heavy rendering)      │
  ├────────────────────────────────────────────────────────────────────────────────────────┤
  │  LEVER 4: VIRTUALIZE                                                                   │
  │  • DOM windowing: render only 20 visible items instead of 50,000 DOM nodes             │
  └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Layer 3 — 🎯 Failure Modes & Production Incidents

### 10. Production Incident #1 — 300ms Search Input Stutter

#### Incident Summary
A B2B SaaS logistics application had a search input filtering 10,000 shipment rows. Users complained that typing was completely unusable, with characters appearing in choppy bursts of 3–4 letters.

#### The Flawed Code
```tsx
// 💥 BROKEN CODE: Couples urgent input state with heavy array computation
function ShipmentSearch({ shipments }: { shipments: Shipment[] }) {
  const [query, setQuery] = useState("");

  // 💥 Heavy computation + 10,000 row reconciliation runs synchronously on every keystroke!
  const filteredShipments = shipments
    .filter(s => s.trackingNumber.includes(query) || s.destination.includes(query))
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)} // 💥 Sync update blocks main thread for 250ms!
      />
      <ShipmentList items={filteredShipments} />
    </div>
  );
}
```

#### Diagnostic Breakdown:
- Input keystroke triggers `setQuery`.
- `ShipmentSearch` renders $\rightarrow$ spends $120\text{ms}$ in JavaScript filter/sort $\rightarrow$ spends $140\text{ms}$ in React Fiber reconciliation $\rightarrow$ Total main-thread lock: **$260\text{ms}$**.
- Next keystroke is delayed in the browser queue.

#### The Senior Refactor (Decoupling Urgency with `startTransition`):
```tsx
// ✅ PRODUCTION REFACTOR
function ShipmentSearch({ shipments }: { shipments: Shipment[] }) {
  const [inputVal, setInputVal] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nextVal = e.target.value;
    // 1. URGENT: Update input text immediately (0ms delay)
    setInputVal(nextVal);

    // 2. NON-URGENT: Defer heavy list filtering to background transition
    startTransition(() => {
      setSearchFilter(nextVal);
    });
  }

  const filteredShipments = useMemo(() => {
    return shipments
      .filter(s => s.trackingNumber.includes(searchFilter) || s.destination.includes(searchFilter))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [shipments, searchFilter]);

  return (
    <div>
      <input
        type="text"
        value={inputVal}
        onChange={handleInputChange}
      />
      {isPending && <span className="spinner">Filtering...</span>}
      <ShipmentList items={filteredShipments} />
    </div>
  );
}
```

---

### 11. Production Incident #2 — Forced Synchronous Layout Thrashing

#### Incident Summary
A custom data grid with resizable columns froze the browser for 4.2 seconds during drag interactions.

#### The Flawed Code
```tsx
// 💥 BROKEN CODE: Interleaving DOM mutations with geometry queries
function onColumnResize(newWidth: number) {
  columns.forEach((col, index) => {
    const headerEl = document.getElementById(`header-${index}`)!;
    headerEl.style.width = `${newWidth}px`; // 💥 WRITE: Invalidates browser layout

    const currentRect = headerEl.getBoundingClientRect(); // 💥 READ: Forces synchronous reflow!
    
    const cellEl = document.getElementById(`cell-${index}`)!;
    cellEl.style.transform = `translateX(${currentRect.width}px)`; // 💥 WRITE
  });
}
```

```text
  THE LAYOUT THRASHING CYCLE
  WRITE width ──► READ rect (FORCED REFLOW) ──► WRITE transform ──► READ rect (FORCED REFLOW)
  Result: 50 forced browser layout cycles on EVERY mousemove event!
```

#### The Senior Refactor (Batch Reads, then Batch Writes):
```tsx
// ✅ PRODUCTION REFACTOR: Decouple measurements from mutations
function onColumnResize(newWidth: number) {
  // 1. PURE CALCULATION (Zero DOM reads/writes)
  const transforms = columns.map((col, index) => ({
    id: index,
    width: newWidth,
    offset: index * newWidth
  }));

  // 2. BATCHED DOM MUTATIONS (via CSS Variables or RequestAnimationFrame)
  requestAnimationFrame(() => {
    document.documentElement.style.setProperty('--column-width', `${newWidth}px`);
  });
}
```

---

### 12. Production Incident #3 — High-Level State Freezing 60 FPS Animations

#### Incident Summary
A real-time analytics dashboard with an animated timeline slider stuttered at 14 FPS whenever the slider was dragged.

#### Why it occurred:
The slider's `currentTimestamp` was stored in the root `<Dashboard />` component state. Every tick of `requestAnimationFrame` ($16.6\text{ms}$) triggered a complete re-render of 12 sub-charts, consuming $65\text{ms}$ of CPU time per frame.

#### The Senior Fix:
Colocate slider state into `<TimelineSlider />` and communicate with charts via debounced/deferred transitions or native CSS transforms.

---

## Layer 4 — 🧪 Prediction Challenges & Diagnostic Runbook

### 13. Prediction Challenge 1
```tsx
function App() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <HeavySubtree />
    </div>
  );
}
```
*Scenario:* `HeavySubtree` takes $0.05\text{ms}$ to render.  
*Question:* Does clicking the button cause noticeable UI lag?  
**Answer:** **No.** A component re-rendering frequently is only problematic if its render duration is substantial ($>16\text{ms}$) or causes heavy DOM reflows.

---

### 14. Prediction Challenge 2
*Scenario:* Chrome DevTools Performance Profiler shows:
- React Render duration: $3\text{ms}$.
- Browser Layout & Reflow duration: $120\text{ms}$.  
*Question:* Should the senior engineer spend time adding `useMemo` and `useCallback` to React components?  
**Answer:** **No.** The bottleneck is in the Browser Layout layer (Layer 3), likely caused by large un-virtualized DOM trees or forced reflows. Adding memoization will have zero impact on the $120\text{ms}$ layout cost.

---

### 15. Prediction Challenge 3
*Question:* If a calculation has an $\mathcal{O}(N^2)$ algorithm taking $500\text{ms}$, will wrapping the state update in `startTransition` make the calculation take less time?  
**Answer:** **No.** `startTransition` changes scheduling priority (allowing user clicks to interrupt), but the underlying CPU work still requires $500\text{ms}$ of main-thread execution. Algorithmic optimization or Web Workers are required.

---

### 16. Prediction Challenge 4
*Question:* Why is `setTimeout(() => setFilter(val), 0)` not equivalent to `startTransition(() => setFilter(val))`?  
**Answer:** `setTimeout` pushes the execution to a later macrotask on the browser event loop, where it still executes **synchronously and non-interruptibly**. `startTransition` executes within React's Scheduler, enabling time-slicing and interruption if a higher-priority event occurs.

---

### 17. Prediction Challenge 5
```tsx
function Chat() {
  const [messages, setMessages] = useState(Array.from({ length: 50000 }));
  return <div>{messages.map((m, i) => <Message key={i} data={m} />)}</div>;
}
```
*Question:* What is the primary performance lever needed here?  
**Answer:** **Lever 4: Virtualization.** No amount of memoization or transitions can prevent the browser from freezing when mounting $50,000$ active DOM nodes.

---

## Layer 5 — 🎓 Staff-Level Interview Questions, 50-Point Checklist & Mastery Gate

### 18. Staff-Level Interview Questions & Deep Architectural Answers

#### Q1: Differentiate between Concurrent Rendering in React and Parallel Multithreading.
**Architectural Answer:**  
- **Parallel Multithreading (e.g. Web Workers, WebAssembly threads):** Simultaneous execution of code on separate operating system CPU threads.
- **Concurrent React:** Cooperative time-slicing and priority-based scheduling on the **single browser main thread**. It allows React to yield execution back to the browser host loop periodically, interleaving urgent tasks between units of render work.

#### Q2: What is Interaction to Next Paint (INP) and how do React Transitions improve it?
**Architectural Answer:**  
INP is a Core Web Vital that measures the latency from user interaction (click, keypress) to the visual update on screen. Without transitions, heavy render work runs synchronously, delaying paint and causing poor INP scores ($>200\text{ms}$). React Transitions allow the urgent interaction (e.g. input text) to paint immediately while the heavy computation yields in the background, keeping INP under the "Good" threshold ($<200\text{ms}$).

#### Q3: Why does `getBoundingClientRect()` cause layout thrashing when called after a DOM write?
**Architectural Answer:**  
Browsers lazily batch style recalculations and layout passes. When JavaScript mutates a DOM property (`style.width = ...`), the layout is marked "dirty". If JavaScript subsequently reads a geometric property (`getBoundingClientRect()`, `offsetHeight`), the browser is forced to flush the render queue and execute a **synchronous reflow** immediately to return the accurate coordinates.

#### Q4: When should you reach for a Web Worker instead of `startTransition`?
**Architectural Answer:**  
Reach for a Web Worker when you have a pure mathematical computation (e.g. image processing, large dataset aggregation, cryptography) that takes $>100\text{ms}$ and does not require direct DOM access. `startTransition` keeps computation on the main thread; a Worker moves the computation completely off the main thread.

---

### 19. The 50-Point Senior Render Performance Master Checklist

#### Category 1: Architecture & Mental Models (Items 1–10)
- [ ] 1. Identify which layer owns a bottleneck: JavaScript (Layer 1), React (Layer 2), or Browser (Layer 3).
- [ ] 2. Understand that React rendering occurs on the single main thread.
- [ ] 3. Differentiate between concurrent interruptible rendering and parallel multithreading.
- [ ] 4. Understand the ~16.67ms frame budget at 60Hz and ~8.33ms budget at 120Hz.
- [ ] 5. Differentiate between the interruptible Render Phase and the atomic Commit Phase.
- [ ] 6. Know that `16.67ms` is an interaction budget, not a hard per-component limit.
- [ ] 7. Recognize that the cheapest render is the render that never happens.
- [ ] 8. Apply the 4 Performance Levers in order: Eliminate $\rightarrow$ Reduce $\rightarrow$ Defer $\rightarrow$ Virtualize.
- [ ] 9. Never optimize without baseline profiling traces from Chrome DevTools.
- [ ] 10. Understand that `React.memo` cannot fix Layer 1 (JS) or Layer 3 (Browser) bottlenecks.

#### Category 2: Scheduler, Concurrency & Lanes (Items 11–20)
- [ ] 11. Understand how the React Scheduler cooperatively yields execution via `shouldYieldToHost`.
- [ ] 12. Know that React uses `MessageChannel` tasks for scheduling on the browser event loop.
- [ ] 13. Differentiate Urgent Updates (`SyncLane`) from Non-Urgent Transitions (`TransitionLane`).
- [ ] 14. Keep controlled text input updates strictly in Urgent priority.
- [ ] 15. Wrap heavy list filtering and navigation transitions in `startTransition`.
- [ ] 16. Understand that transitions do not reduce algorithmic $\mathcal{O}(N)$ computational complexity.
- [ ] 17. Use `isPending` to render immediate loading skeletons or stale UI opacity cues.
- [ ] 18. Recognize that `setTimeout(..., 0)` does not provide React interruptibility or lane coordination.
- [ ] 19. Understand lane expiration and priority starvation prevention in Fiber.
- [ ] 20. Ensure transition callbacks remain synchronous functions wrapping state setters.

#### Category 3: State Placement & Invalidation Topology (Items 21–30)
- [ ] 21. Colocate state to the lowest common component to shrink invalidation regions.
- [ ] 22. Avoid placing high-frequency animation coordinates in high-level state.
- [ ] 23. Decompose giant monolithic views into independent feature sections.
- [ ] 24. Pass static UI shells down as `children` or render props to enable natural bailout.
- [ ] 25. Leverage structural sharing in immutable state trees to preserve references.
- [ ] 26. Avoid setting state inside `useEffect` during data transformations (derive synchronously).
- [ ] 27. Split monolithic React Contexts into fine-grained static and dynamic slices.
- [ ] 28. Use `useSyncExternalStore` for high-frequency global data streams.
- [ ] 29. Isolate high-frequency hover/drag states using CSS variables or native refs.
- [ ] 30. Calculate total render workload: $\text{Frequency} \times \text{Scope} \times \text{Cost per unit}$.

#### Category 4: Browser Rendering & Layout Optimization (Items 31–40)
- [ ] 31. Prevent forced synchronous layout (reflow) by batching all DOM reads before writes.
- [ ] 32. Avoid reading `getBoundingClientRect()`, `offsetHeight`, or `scrollTop` immediately after style writes.
- [ ] 33. Use CSS `transform` and `opacity` for animations (GPU compositor thread execution).
- [ ] 34. Avoid animating properties that trigger layout (`width`, `height`, `top`, `left`, `margin`).
- [ ] 35. Use `will-change` sparingly on animated elements to promote to compositor layers.
- [ ] 36. Virtualize lists with $>100$ items using `@tanstack/react-virtual` to limit DOM node counts.
- [ ] 37. Keep total mounted DOM nodes on a page below $1,500$ for optimal mobile performance.
- [ ] 38. Use `content-visibility: auto` in CSS for offscreen DOM subtrees where appropriate.
- [ ] 39. Measure layout time in Chrome DevTools Performance Timeline.
- [ ] 40. Isolate heavy canvas/WebGL rendering contexts from React state cycles.

#### Category 5: Diagnostics, Profiling & Production Readiness (Items 41–50)
- [ ] 41. Profile interactions using Chrome DevTools Performance panel under 4x CPU throttling.
- [ ] 42. Identify Long Tasks ($>50\text{ms}$) on the main thread and trace execution origins.
- [ ] 43. Measure Interaction to Next Paint (INP) across keyboard, click, and tap events.
- [ ] 44. Use React DevTools Profiler to inspect Commit durations and render reasons.
- [ ] 45. Distinguish component function execution time from Fiber commit time.
- [ ] 46. Move CPU-heavy calculations ($>100\text{ms}$) to Web Workers where appropriate.
- [ ] 47. Verify that optimizations do not introduce stale closures or visual tearing.
- [ ] 48. Conduct Performance Architecture Reviews before merging PRs.
- [ ] 49. Maintain automated Lighthouse / Web Vitals CI performance regression gates.
- [ ] 50. Master the complete KPI 14 mental model: Architecture First $\rightarrow$ Measure $\rightarrow$ Schedule $\rightarrow$ Optimize!

---

## 🧭 Navigation & Next Steps

| Resource | Link |
| :--- | :--- |
| **⬅️ Previous KPI** | [KPI 13 — Derived State, Memoization & Render Optimization](../13-Derived-State-Memoization/README.md) |
| **🧪 Interactive Lab** | [Companion Lab — 01 Architecture of Render Performance](./examples/01-architecture-of-render-performance.html) |
| **📚 KPI 14 Index** | [Render Performance, Transitions & Concurrency](./README.md) |
| **Next Part ➡️** | [PART 02 — useTransition, startTransition & Non-Blocking UI](./02-usetransition-and-non-blocking-rendering.md) |
