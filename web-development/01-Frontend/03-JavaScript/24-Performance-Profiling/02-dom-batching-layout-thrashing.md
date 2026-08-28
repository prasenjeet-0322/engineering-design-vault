# KPI 24 — Part 02: DOM Batching & Layout Thrashing

[⬅️ Part 01: The Browser Performance Mental Model](./01-browser-performance-mental-model-dom-operations.md) | [📚 KPI 24 Index](./README.md) | [Part 03: Reflow, Repaint & The Rendering Pipeline ➡️](./03-reflow-repaint-rendering-pipeline.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Layout Performance Concept | Mechanism & Failure Mode | Architectural Rule | Senior Engineering Standard |
|---|---|---|---|
| **Forced Synchronous Layout** | Querying geometric properties (`offsetWidth`, `getClientRects`) after a DOM mutation. | Forces the engine to calculate layout synchronously mid-task instead of deferring. | 🔴 Never query geometry immediately after modifying styles/classes on any element. |
| **Layout Thrashing** | Alternating **Write $\to$ Read $\to$ Write $\to$ Read** in a loop across multiple nodes. | Triggers $N$ consecutive synchronous reflows, causing severe frame drops. | 🔴 Refactor all operations into **Phase 1: Read All $\to$ Phase 2: Compute $\to$ Phase 3: Write All**. |
| **FastDOM Architecture** | Centralized queue that batches all scheduled Reads first, then all scheduled Writes. | Decouples read/write execution across independent components within a single frame. | 🔵 Standard architecture for coordinating multi-widget DOM layout calculations. |
| **`requestAnimationFrame` (rAF)** | Schedules visual DOM mutations right before the browser's next screen paint. | Coalesces high-frequency pointer/scroll events into a single visual write per frame. | 🟢 Store latest event coordinates in memory; apply style transforms inside rAF. |
| **`useLayoutEffect` vs `useEffect`** | `useLayoutEffect` runs synchronously *before* browser paint; blocks visual commit. | Misusing `useLayoutEffect` for non-geometric tasks delays screen presentation. | 🟡 Use `useLayoutEffect` strictly for reading layout to prevent visible layout flicker. |
| **CSS Over JavaScript** | Declarative CSS (Grid, Flexbox, Container Queries) replaces imperative measurements. | Calculating responsive columns via JS is fragile, verbose, and prone to reflows. | 🟢 Let the browser's C++ layout engine compute responsive layouts natively via CSS. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: The Clean Read Myth & Top/Left Animation Traps
> 
> #### Gotcha A: The Myth that "All DOM Reads Trigger Reflow"
> *"Does calling `element.offsetWidth` always trigger a reflow?"*  
> ```js
> // Scenario 1: Clean Layout Tree (NO pending mutations)
> const w1 = elementA.offsetWidth; // 🟢 ULTRA FAST: Reads cached geometry from last frame (<0.01ms)
> const w2 = elementB.offsetWidth; // 🟢 ULTRA FAST: Zero reflow overhead!
> 
> // Scenario 2: Dirty Layout Tree (Pending mutation exists)
> elementA.style.width = "300px";  // 💥 Dirties layout tree
> const w3 = elementA.offsetWidth; // 🔴 FORCED SYNCHRONOUS LAYOUT: Engine halted to recalculate!
> ```
> **Deep Architectural Explanation:**  
> Reading a layout property does **NOT** cause a reflow by itself. If the layout tree is clean (no preceding DOM/CSS modifications have occurred since the last paint), the browser simply returns the cached bounding coordinates from the previous frame's layout tree in $\mathcal{O}(1)$ time. A **Forced Synchronous Layout** occurs *only* when a layout read occurs on a **dirty** layout tree.  
> **The Senior Standard:** Group all layout reads at the beginning of the frame *before* dispatching any DOM writes:
> ```js
> // ✅ CLEAN BATCHED READS (Zero forced reflows):
> const measurements = cards.map((c) => ({ el: c, h: c.offsetHeight })); // All reads on clean tree
> measurements.forEach(({ el, h }) => { el.style.height = `${h + 10}px`; }); // All writes batched
> ```
> 
> ---
> 
> #### Gotcha B: `top`/`left` vs `transform: translate3d()` in High-Frequency Animations
> *"Why did our custom drag-and-drop widget stutter despite wrapping updates in `requestAnimationFrame`?"*  
> ```js
> // ❌ DISASTROUS TOP/LEFT MUTATION IN rAF:
> requestAnimationFrame(() => {
>   // 💥 FATAL BOTTLENECK: Modifying 'top' & 'left' invalidates geometric layout and paint trees!
>   // The main thread must recalculate box positions and repaint pixels on EVERY frame!
>   draggable.style.left = `${currentX}px`;
>   draggable.style.top = `${currentY}px`;
> });
> ```
> **Deep Architectural Explanation:**  
> Properties like `top`, `left`, `width`, and `margin` are **Layout-triggering properties**. Even when scheduled inside `requestAnimationFrame`, mutating them forces the browser's main thread to run full Layout and Paint recalculations for the moving element and its surrounding ancestors. In contrast, `transform: translate3d(x, y, 0)` and `opacity` are handled directly by the **GPU Compositor Thread**, completely bypassing the main thread layout and paint pipelines.  
> **The Senior Standard:** Always use CSS GPU transforms for position and movement animations:
> ```js
> // ✅ COMPOSITOR-ACCELERATED GPU TRANSFORM:
> requestAnimationFrame(() => {
>   // 🟢 Zero main-thread reflow! Handled directly on GPU compositor layer!
>   draggable.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
> });
> ```

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / Next.js / Vite Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Read/Write phase separation, `useLayoutEffect` positioning, CSS transform animations | Core foundation for creating smooth 60fps/120fps UI interactions, modals, popovers, and virtual lists. |
| 🟡 **Moderate** | Used in ~45% of code | FastDOM queue scheduling, Equal-height card calculations, Resizable splitters | Critical for complex data grids, rich text editors, dashboard widgets, and charting libraries. |
| 🔵 **Foundational / Engine** | Runtime internals | Blink `LocalFrameView::UpdateLayout` triggers, Compositor layers vs Paint layers | Mandatory for Staff/Principal performance evaluations, Core Web Vitals (INP) debugging, and SDK design. |

---

## Core Concepts (20 Subtopics)

### Part 1 — Why Browser Work Is Consolidated & Deferred `🟢 [Daily Driver]`

Browsers batch CSS mutations internally and defer layout calculations to the end of the frame to avoid redundant intermediate work.

---

### Part 2 — What Is DOM Batching? `🟢 [Daily Driver]`

The architectural practice of grouping all DOM reads together and all DOM writes together, minimizing expensive context switches and reflows.

---

### Part 3 — The 3-Phase Execution Model: Read $\to$ Compute $\to$ Write `🟢 [Daily Driver]`

```text
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│ 1. READ PHASE  │ ──►  │2. COMPUTE PHASE│ ──►  │ 3. WRITE PHASE │
│ Measure Layout │      │ Pure JS Logic  │      │ Apply Mutations│
└────────────────┘      └────────────────┘      └────────────────┘
```

---

### Part 4 — What Is Layout Thrashing? `🔴 [Production-Critical]`

When JavaScript repeatedly alternates between mutating styles (writes) and querying geometry (reads) inside a loop, forcing $N$ consecutive synchronous reflows.

---

### Part 5 — "Forced Synchronous Layout": Breaking Deferred Scheduling `🔵 [Foundational / Engine]`

When code asks for geometry (`offsetWidth`) after a mutation, the browser is forced to pause JavaScript and calculate layout immediately to return accurate values.

---

### Part 6 — The Exhaustive Catalog of Layout-Dependent Geometric Reads `🟢 [Daily Driver]`

- **Box Metrics:** `offsetWidth`, `offsetHeight`, `offsetTop`, `offsetLeft`, `clientWidth`, `clientHeight`.
- **Scroll Metrics:** `scrollWidth`, `scrollHeight`, `scrollTop`, `scrollLeft`.
- **Bounding Boxes:** `getBoundingClientRect()`, `getClientRects()`.
- **Window Metrics:** `window.getComputedStyle(element)`.

---

### Part 7 — Not Every Read Causes a Reflow: The Dirty Tree Requirement `🔵 [Foundational / Engine]`

Reading `offsetWidth` on an unmodified, clean layout tree is an $\mathcal{O}(1)$ cached memory lookup; it only forces a reflow if preceding code dirtied the tree.

---

### Part 8 — Classic Layout Thrashing: Auto-Equalizing Card Heights `🟢 [Daily Driver]`

Setting `card.style.height = 'auto'` and immediately reading `card.offsetHeight` inside a `forEach` loop is the textbook layout thrashing antipattern.

---

### Part 9 — Refactoring Interleaved Loops into Phase-Separated Pipelines `🟢 [Daily Driver]`

```js
// 1. Read all heights in parallel on a clean tree
const maxH = Math.max(...cards.map(c => c.offsetHeight));
// 2. Write all heights in a single batch
cards.forEach(c => { c.style.height = `${maxH}px`; });
```

---

### Part 10 — `DocumentFragment` for Multi-Node Creation Batching `🟢 [Daily Driver]`

Assembles detached DOM nodes in memory, inserting all children into the live DOM in a single atomic operation.

---

### Part 11 — `requestAnimationFrame` as a Visual Write Coalescer `🟢 [Daily Driver]`

Buffers multiple high-frequency input events (`pointermove`, `scroll`) and executes a single DOM transform write immediately prior to screen paint.

---

### Part 12 — The Limitation of rAF: Scheduling vs Computation Cost `🔴 [Production-Critical]`

`requestAnimationFrame` aligns execution with the screen refresh cycle, but heavy JavaScript computations or layout thrashing *inside* rAF still cause dropped frames.

---

### Part 13 — The "Measure $\to$ Schedule $\to$ Mutate" Production Pattern `🟢 [Daily Driver]`

1. Capture event data $\to$ 2. Read layout geometry $\to$ 3. Compute in JavaScript $\to$ 4. Schedule rAF $\to$ 5. Mutate DOM styles.

---

### Part 14 — Declarative CSS Layout vs Imperative JS Measurements `🟢 [Daily Driver]`

Replace JS layout calculations with native CSS Grid, Flexbox, Container Queries (`@container`), and `clamp()` to offload layout directly to the browser's C++ engine.

---

### Part 15 — React Relevance: `useLayoutEffect` vs `useEffect` Layout Hazards `🟢 [Daily Driver]`

- `useLayoutEffect`: Fires synchronously after DOM mutations but before screen paint; ideal for tooltip positioning without flicker.
- `useEffect`: Fires asynchronously after paint; preferred for data fetching and non-visual effects to avoid blocking render.

---

### Part 16 — Next.js Relevance: Client-Side Hydration Layout Calculations `🟢 [Daily Driver]`

Executing layout measurements immediately during hydration causes layout shifts and forced reflows; defer measurements using `requestAnimationFrame` or ResizeObserver.

---

### Part 17 — Drag-and-Drop & Pointer Tracking Optimization Case Study `🟢 [Daily Driver]`

Storing pointer coordinates in memory and applying updates via `transform: translate3d()` inside rAF achieves smooth 120fps drag animations.

---

### Part 18 — FastDOM Architecture Pattern: Centralized Read/Write Queues `🔵 [Foundational / Engine]`

A global scheduler with two queues (`reads` and `writes`) that executes all queued reads in a microtask, followed by all queued writes in rAF.

---

### Part 19 — Identifying Layout Thrashing in Chrome DevTools Performance Flamecharts `🟢 [Daily Driver]`

Look for red triangle warnings labeled **"Forced Reflow"** or repetitive alternating purple **"Layout"** and yellow **"Function Call"** bars.

---

### Part 20 — The 10-Point Senior DOM Batching Audit Checklist `🟢 [Daily Driver]`

```text
1. Are layout reads grouped before DOM writes? ──► 2. Are geometric reads avoided inside loops?
3. Is transform: translate3d() used over top/left? ──► 4. Is rAF used to throttle visual writes?
5. Is useLayoutEffect restricted to layout sync? ──► 6. Are CSS Container Queries used over JS?
7. Is FastDOM queueing used for multi-widget apps? ──► 8. Are DocumentFragments used for bulk nodes?
9. Are DevTools "Forced Reflow" warnings eliminated? ──► 10. Is 60fps/120fps frame budget verified?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Layout Batching Strategy | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Phase Separation (Read-Then-Write)** | Standard DOM manipulation, equalizing widget dimensions, tooltip positioning. | High-frequency continuous 60fps animations. | Requires manual code organization and discipline. | CSS Grid / Flexbox. |
| **FastDOM Queue Scheduler** | Complex enterprise dashboards with dozens of independent widgets needing DOM sync. | Simple single-component web applications. | Introduces asynchronous timing indirection; small bundle overhead. | Native CSS Container Queries. |
| **`requestAnimationFrame` Coalescing** | Pointer tracking, custom scrollbars, canvas animations, drag-and-drop. | Non-visual asynchronous data fetching or background analytics. | Callbacks pause when tab is minimized or in background. | Web Workers / CSS transitions. |
| **React `useLayoutEffect`** | Measuring DOM dimensions to position tooltips, popovers, or modals before paint. | Data fetching, event listeners, or non-visual state synchronization. | Blocks visual browser paint until execution finishes. | React `useEffect`. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Equal-Height Card Grid & Drag Engine in TypeScript
```tsx
import React, { useState, useRef, useLayoutEffect, useCallback } from 'react';

// ==========================================
// 1. FASTDOM-STYLE READ/WRITE BATCH CONTROLLER
// ==========================================
export class DOMBatchEngine {
  private static readQueue: Array<() => void> = [];
  private static writeQueue: Array<() => void> = [];
  private static isScheduled = false;

  public static read(fn: () => void): void {
    this.readQueue.push(fn);
    this.scheduleFlush();
  }

  public static write(fn: () => void): void {
    this.writeQueue.push(fn);
    this.scheduleFlush();
  }

  private static scheduleFlush(): void {
    if (this.isScheduled) return;
    this.isScheduled = true;

    requestAnimationFrame(() => {
      // 🟢 Phase 1: Flush all geometric READS on clean layout tree
      while (this.readQueue.length > 0) {
        const readFn = this.readQueue.shift();
        readFn?.();
      }

      // 🟢 Phase 2: Flush all DOM WRITES in a single batch
      while (this.writeQueue.length > 0) {
        const writeFn = this.writeQueue.shift();
        writeFn?.();
      }

      this.isScheduled = false;
    });
  }
}

// ==========================================
// 2. EQUAL-HEIGHT GRID COMPONENT
// ==========================================
export interface CardData {
  id: number;
  title: string;
  description: string;
}

const SAMPLE_CARDS: CardData[] = [
  { id: 1, title: 'Edge Cloud Cluster', description: 'Distributed low-latency computing node.' },
  { id: 2, title: 'Real-Time Telemetry', description: 'High-throughput stream processing with multi-region replication and automatic failover.' },
  { id: 3, title: 'Security Perimeter', description: 'Zero-trust IAM policy engine.' }
];

export function EnterpriseCardGridDashboard() {
  const [cards] = useState<CardData[]>(SAMPLE_CARDS);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const dragBoxRef = useRef<HTMLDivElement | null>(null);
  const pointerPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDragging = useRef<boolean>(false);

  // 🟢 Phase-Separated Equal-Height Equalizer (Zero Layout Thrashing)
  useLayoutEffect(() => {
    DOMBatchEngine.read(() => {
      // Phase 1: Read all heights on clean tree
      const heights = cardRefs.current.map((el) => el?.offsetHeight ?? 0);
      const maxHeight = Math.max(...heights);

      // Phase 2: Schedule batched writes
      DOMBatchEngine.write(() => {
        cardRefs.current.forEach((el) => {
          if (el) el.style.height = `${maxHeight}px`;
        });
      });
    });
  }, [cards]);

  // 🟢 Compositor-Accelerated Drag Handler (GPU Transform inside rAF)
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    pointerPos.current = { x: e.clientX, y: e.clientY };

    DOMBatchEngine.write(() => {
      if (dragBoxRef.current) {
        // 🟢 Uses translate3d: Zero reflow, zero repaint, pure GPU compositor layer!
        dragBoxRef.current.style.transform = `translate3d(${pointerPos.current.x - 50}px, ${pointerPos.current.y - 50}px, 0)`;
      }
    });
  }, []);

  return (
    <div className="layout-dashboard-card" onPointerMove={handlePointerMove}>
      <header className="card-header">
        <h3>Enterprise DOM Batching & Anti-Thrashing Grid</h3>
        <span className="badge">⚡ Zero Forced Reflows</span>
      </header>

      <p className="architecture-description">
        Demonstrates FastDOM phase separation (Read Phase $\to$ Write Phase) and GPU compositor-accelerated <code>translate3d</code> pointer tracking.
      </p>

      <div className="card-grid-container">
        {cards.map((card, idx) => (
          <div
            key={card.id}
            ref={(el) => { cardRefs.current[idx] = el; }}
            className="equal-card"
          >
            <h4>{card.title}</h4>
            <p>{card.description}</p>
          </div>
        ))}
      </div>

      <div className="drag-test-zone">
        <div
          ref={dragBoxRef}
          className="draggable-box"
          onPointerDown={() => { isDragging.current = true; }}
          onPointerUp={() => { isDragging.current = false; }}
        >
          🖐️ Drag GPU Node
        </div>
      </div>
    </div>
  );
}
```

---

## 🧠 Part 02 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: Counting Forced Reflows in Loop
```js
for (let i = 0; i < 10; i++) {
  items[i].style.width = `${i * 10}px`; // Mutation (Dirty)
  console.log(items[i].offsetHeight);  // Read (Forced Reflow)
}
```
**Question:** How many forced synchronous layout recalculations occur?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:** Exactly **10 Forced Synchronous Layouts**.  
**Why:** Each write dirties the layout tree. The subsequent `offsetHeight` read forces the browser engine to halt execution and synchronously recalculate geometry before returning the integer value, repeating 10 times.
</details>

---

### Prediction Challenge 2: Clean Tree Read Performance
```js
// Layout tree is clean (no preceding style mutations)
const a = box1.offsetWidth;
const b = box2.offsetWidth;
const c = box3.offsetWidth;
```
**Question:** How many forced synchronous reflows occur?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:** **0 Forced Reflows.**  
**Why:** Because no DOM mutations occurred before the reads, the layout tree is already up-to-date (clean). The browser returns cached geometric coordinates directly from memory in $\mathcal{O}(1)$ time.
</details>

---

### Prediction Challenge 3: Top/Left vs Transform Compositor Layers
```js
// Scenario A: element.style.left = `${x}px`;
// Scenario B: element.style.transform = `translateX(${x}px)`;
```
**Question:** Which scenario triggers a main-thread Layout (Reflow) and which runs exclusively on the GPU Compositor thread?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:**  
- **Scenario A (`style.left`):** Triggers Main-Thread **Layout (Reflow) $\to$ Paint $\to$ Composite**.  
- **Scenario B (`style.transform`):** Handled directly on the **GPU Compositor Layer**, bypassing Layout and Paint completely.
</details>

---

### Prediction Challenge 4: FastDOM Read/Write Sequence Ordering
```js
DOMBatchEngine.write(() => console.log("Write 1"));
DOMBatchEngine.read(() => console.log("Read 1"));
DOMBatchEngine.write(() => console.log("Write 2"));
DOMBatchEngine.read(() => console.log("Read 2"));
```
**Question:** In what order will the 4 console messages appear when flushed?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:**  
```text
Read 1
Read 2
Write 1
Write 2
```
**Why:** FastDOM architecture prioritizes all scheduled reads first (to evaluate against a clean tree) before executing the write queue.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is Layout Thrashing in JavaScript?  
<details>
<summary><strong>Answer</strong></summary>
Layout Thrashing occurs when JavaScript repeatedly alternates between modifying the DOM/CSS (writes) and querying geometric dimensions (reads) in a loop, forcing the browser to synchronously recalculate layout on every iteration.
</details>

**Q2:** Name 4 common JavaScript properties that trigger a layout read.  
<details>
<summary><strong>Answer</strong></summary>
1. `element.offsetWidth` / `offsetHeight`  
2. `element.clientWidth` / `clientHeight`  
3. `element.getBoundingClientRect()`  
4. `element.scrollTop` / `scrollLeft`
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** How do you refactor an interleaved layout thrashing loop to eliminate forced reflows?  
<details>
<summary><strong>Answer</strong></summary>
Separate the loop into two distinct phases:  
1. **Read Phase:** Query and store all required dimensions in JavaScript variables/arrays on a clean layout tree.  
2. **Write Phase:** Apply all DOM style/class mutations in a single batch, allowing the browser to consolidate layout recalculations to a single reflow at the end of the frame.
</details>

**Q4:** Why is `transform: translate3d()` preferred over `top`/`left` for 60fps animations?  
<details>
<summary><strong>Answer</strong></summary>
Mutating `top` or `left` alters geometric positioning, forcing the main thread to execute full Layout (Reflow) and Paint cycles. In contrast, `transform: translate3d()` promotes the element to its own GPU compositor layer, allowing the GPU to manipulate the layer's texture without triggering main-thread layout or repaint.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** What is the FastDOM architectural pattern and how does it prevent cross-component layout thrashing?  
<details>
<summary><strong>Answer</strong></summary>
In large applications with multiple independent UI components, one component might write to the DOM while another reads geometry within the same tick, causing accidental layout thrashing. FastDOM solves this by centralizing all DOM operations into two queues: `fastdom.measure()` (Reads) and `fastdom.mutate()` (Writes). It executes all registered reads first, then flushes all writes in `requestAnimationFrame`, guaranteeing zero forced reflows across disparate component trees.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How does Chromium Blink's `LocalFrameView::UpdateLayout()` execute under the hood, and how can CSS Containment (`contain: layout`) be architected to localize reflow boundaries?  
<details>
<summary><strong>Answer</strong></summary>
1. **Global Reflow Propagation:** By default, modifying an element's geometry marks its `LayoutObject` dirty and traverses parent nodes up to the document root, causing Blink to recalculate the entire page layout during `UpdateLayout()`.  
2. **CSS Containment (`contain: layout size`):** Declaring `contain: layout` establishes an explicit layout boundary. When descendants mutate, Blink confines layout recalculations strictly within the contained subtree without invalidating the global document layout tree, reducing layout computation time from $\mathcal{O}(\text{Page Nodes})$ to $\mathcal{O}(\text{Widget Nodes})$.
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone FastDOM Batching Engine

```js
// See runnable implementation in examples/02-dom-batching-layout-thrashing.js
```

---

## Key Takeaways
1. **Separate Reads from Writes:** Always execute geometric measurements before modifying DOM styles.
2. **Clean Reads Are Fast:** `offsetWidth` on an unmodified layout tree is an $\mathcal{O}(1)$ cached lookup.
3. **Use FastDOM Queueing:** Coordinate multi-component reads and writes into scheduled microtasks/rAF.
4. **Animate with GPU Transforms:** Use `transform: translate3d()` instead of `top`/`left` for smooth 60fps/120fps.
5. **Leverage CSS Layout:** Replace imperative JS dimension calculations with native CSS Grid and Container Queries.

---

[⬅️ Part 01: The Browser Performance Mental Model](./01-browser-performance-mental-model-dom-operations.md) | [📚 KPI 24 Index](./README.md) | [Part 03: Reflow, Repaint & The Rendering Pipeline ➡️](./03-reflow-repaint-rendering-pipeline.md)
