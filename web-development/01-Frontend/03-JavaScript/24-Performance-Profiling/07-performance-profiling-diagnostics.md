# KPI 24 — Part 07: Memory Performance, Garbage Collection & JavaScript Memory Leaks

[⬅️ Part 06: Web Workers & Off-Main-Thread Compute](./06-web-workers-multi-threading.md) | [📚 KPI 24 Index](./README.md) | [🏁 KPI 25 — Error Handling & Reliability ➡️](../25-Error-Handling-Reliability/README.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Memory Concept | Underlying Mechanism | Failure Mode & Risk | Senior Engineering Standard |
|---|---|---|---|
| **Garbage Collection (GC)** | Mark-and-Sweep algorithm automatically frees memory unreachable from GC Roots. | GC cannot reclaim memory if an unused object is still reachable via a reference. | 🟢 Remove references to obsolete data; let GC naturally collect unreachable memory. |
| **Memory Leak Definition** | Memory that is no longer needed by business logic remains reachable in memory. | Progressive memory growth ($100\text{MB} \to 500\text{MB}$) causes browser crashes and mobile tab kills. | 🔴 **CRITICAL:** Every resource creation (`addEventListener`, `setInterval`, `new Worker`) must have a teardown. |
| **Detached DOM Nodes** | Elements removed from the DOM (`el.remove()`) but retained in JS variables/arrays. | Retains the removed node and its entire DOM subtree and styling descriptors in V8 memory. | 🔴 Clear array caches and nullify references when DOM nodes are unmounted. |
| **`WeakMap` & `WeakSet`** | Holds "weak" references to object keys without preventing Garbage Collection. | Strong `Map` keys keep cached objects alive forever unless explicitly deleted. | 🔵 Use `WeakMap` for attaching private metadata or caching to DOM elements / objects. |
| **Heap Snapshots & Retainers** | Chrome DevTools Memory tool capturing object allocation graphs and retaining trees. | Guessing memory leaks without profiling results in cargo-cult code modifications. | 🟢 **Profile Baseline $\to$ Repeat Action $\to$ Compare Heap Snapshots $\to$ Inspect Retaining Path.** |
| **Cleanup Ownership Principle** | "Who created this resource owns its teardown lifecycle." | React component unmounts while WebSockets, Observers, and Timers run forever in background. | 🟢 Always return cleanup functions in `useEffect` and utilize `AbortController`. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: Detached DOM Subtree Leaks & Anonymous Listener Traps
> 
> #### Gotcha A: Detached DOM Node Subtree Retention
> *"Why did removing 1,000 cards from our dashboard fail to free up 80MB of RAM?"*  
> ```js
> // ❌ DETACHED DOM NODE MEMORY LEAK:
> const recentCardsCache = []; // Module-level global array
> 
> function dismissCard(cardElement) {
>   // 1. Removed from the live browser DOM tree:
>   cardElement.remove();
>   // 2. 💥 FATAL LEAK: Storing the element in a JavaScript array!
>   // This retains NOT just cardElement, but ALL of its child nodes, text nodes, and event listeners!
>   recentCardsCache.push(cardElement);
> }
> ```
> **Deep Architectural Explanation:**  
> In Chromium Blink, a DOM element is not an isolated primitive; it is part of a C++ node tree with references to its children, parent pointers, event listeners, and computed style caches. When you invoke `cardElement.remove()`, the browser detaches the node from the document. However, if JavaScript maintains even a single reference to `cardElement` (e.g. in `recentCardsCache`), the **entire detached DOM subtree** is kept in V8 heap memory. In Chrome DevTools Heap Snapshots, these appear under the yellow/red **`Detached HTMLDivElement`** constructor.  
> **The Senior Standard:** Cache only lightweight plain JSON data (e.g. `{ id, title }`), never live DOM node references. Clear caches when objects are dismissed:
> ```js
> // ✅ MEMORY-SAFE CACHING:
> const recentDataCache = [];
> function dismissCardSafe(cardElement, cardData) {
>   cardElement.remove(); // 🟢 DOM node detached and eligible for GC!
>   recentDataCache.push({ id: cardData.id, title: cardData.title }); // Store pure data
> }
> ```
> 
> ---
> 
> #### Gotcha B: Anonymous Listener Identity and Ineffective Teardowns
> *"Why did `removeEventListener` fail to clean up our window resize listener?"*  
> ```js
> // ❌ INEFFECTIVE ANONYMOUS TEARDOWN:
> window.addEventListener("resize", () => {
>   console.log("Resized:", window.innerWidth);
> });
> 
> // Later inside cleanup function:
> // 💥 FATAL BUG: This creates a BRAND NEW function in memory!
> // Function A !== Function B -> The original listener remains active FOREVER!
> window.removeEventListener("resize", () => {
>   console.log("Resized:", window.innerWidth);
> });
> ```
> **Deep Architectural Explanation:**  
> In JavaScript, function expressions create unique object references in memory. Passing an anonymous arrow function `() => ...` to `removeEventListener` creates a new function object that does not match the reference stored in the browser's internal listener map. The original event listener remains attached to `window`, keeping its enclosed lexical variables alive in memory indefinitely.  
> **The Senior Standard:** Use stable named function references or modern `AbortController` signals:
> ```js
> // ✅ METHOD 1: STABLE FUNCTION REFERENCE
> function handleResize() { console.log(window.innerWidth); }
> window.addEventListener("resize", handleResize);
> window.removeEventListener("resize", handleResize); // 🟢 Cleanly unbinds!
> 
> // ✅ METHOD 2: MODERN ABORTCONTROLLER (Senior Standard)
> const controller = new AbortController();
> window.addEventListener("resize", () => console.log(window.innerWidth), { signal: controller.signal });
> controller.abort(); // 🟢 Atomically unbinds anonymous listeners with zero reference tracking!
> ```

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / Next.js / Vite Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | `useEffect` teardown functions, `AbortController` cancellation, Clearing intervals | Fundamental discipline for single-page applications (SPAs) where users navigate without hard page reloads. |
| 🟡 **Moderate** | Used in ~45% of code | Detached DOM node auditing, `WeakMap` metadata caching, Observer disconnects | Critical for long-running dashboard applications, complex data grids, rich text editors, and chat tools. |
| 🔵 **Foundational / Engine** | Runtime internals | Mark-and-Sweep GC phases, Heap snapshot retainer trees, Shallow vs Retained size | Mandatory for Staff/Principal engineering evaluations, memory profiling, and architecture governance. |

---

## Core Concepts (20 Subtopics)

### Part 1 — What Is Memory in JavaScript? Heap vs Stack Allocations `🟢 [Daily Driver]`

Primitives (numbers, booleans) live on the execution stack or inline in memory; objects, arrays, closures, and functions live dynamically allocated in the **V8 Heap**.

---

### Part 2 — What Is Garbage Collection? The Mark-and-Sweep Algorithm `🔵 [Foundational / Engine]`

The engine starts at **GC Roots** (`window`, `globalThis`, active execution stack frames) and traverses all reachable object references (Mark phase). Any unvisited memory is reclaimed (Sweep phase).

---

### Part 3 — Reachability: Roots, Chains, and Unreachable Memory `🟢 [Daily Driver]`

An object is retained if and only if there is an unbroken chain of references connecting it back to a GC Root.

---

### Part 4 — GC Timing Non-Determinism `🟢 [Daily Driver]`

Setting `object = null` removes a reference, but the browser engine determines *when* to execute GC cycles based on heuristics and CPU/memory pressure.

---

### Part 5 — What Is a Memory Leak? `🔴 [Production-Critical]`

When memory that is no longer needed by application logic remains reachable via lingering references, preventing the garbage collector from freeing it.

---

### Part 6 — Normal Memory Growth vs Memory Leaks (Sawtooth vs Escalating) `🟢 [Daily Driver]`

- **Healthy App:** Sawtooth pattern (Memory rises during work $\to$ Drops back down after GC).
- **Leaking App:** Escalating staircase (Memory baseline climbs continuously after navigation).

---

### Part 7 — Leak Cause #1: Accidental Globals & Unbounded Global Arrays `🔴 [Production-Critical]`

Variables declared without `const`/`let` or unbounded module-level caches (`const cache = []`) grow infinitely across the session.

---

### Part 8 — Leak Cause #2: Forgotten Event Listeners & Identity Traps `🟢 [Daily Driver]`

Listeners attached to `window`, `document`, or global targets survive component unmounting unless explicitly removed with identical function references or `AbortController`.

---

### Part 9 — Leak Cause #3: Uncleared Timers & `setInterval` `🟢 [Daily Driver]`

An unstopped `setInterval` continuously executes its callback in the background, retaining all closed-over variables in memory.

---

### Part 10 — Leak Cause #4: Lexical Closures Retaining Outer Contexts `🔵 [Foundational / Engine]`

A long-lived inner function retains the entire lexical environment scope of its parent, even if it only accesses a single property.

---

### Part 11 — Leak Cause #5: Detached DOM Nodes `🔴 [Production-Critical]`

Removing elements from the live DOM (`element.remove()`) while retaining references in JavaScript arrays keeps the detached DOM subtree and style descriptors in memory.

---

### Part 12 — React Memory Vulnerabilities: Subscriptions, WebSockets, & Workers `🟢 [Daily Driver]`

React manages UI rendering, but external side effects (EventEmitters, WebSockets, Workers) require explicit teardown logic.

---

### Part 13 — The Universal React `useEffect` Teardown Contract `🟢 [Daily Driver]`

```tsx
useEffect(() => {
  const resource = setupResource();
  return () => { resource.destroy(); }; // 🟢 Mandatory teardown contract
}, []);
```

---

### Part 14 — Async Abort Patterns via `AbortController` `🟢 [Daily Driver]`

Pass `signal: controller.signal` to `fetch()` and call `controller.abort()` on unmount to prevent state updates on unmounted components and cancel network buffers.

---

### Part 15 — Modern Observers (`IntersectionObserver`, `ResizeObserver`) `🟢 [Daily Driver]`

Always call `observer.disconnect()` in teardown blocks to release internal browser observer references.

---

### Part 16 — Cache Bloat vs LRU / Bounded Caching Strategies `🟢 [Daily Driver]`

Never use unbounded `Map` instances as caches. Enforce maximum capacities with LRU eviction policies or TTL expiration.

---

### Part 17 — `WeakMap` & `WeakSet` for Ephemeral Object Associations `🔵 [Foundational / Engine]`

Keys in a `WeakMap` are held weakly; when the target object is removed elsewhere, the `WeakMap` entry is automatically garbage collected without manual deletion.

---

### Part 18 — Chrome DevTools Heap Snapshots & Comparison Workflows `🟢 [Daily Driver]`

Take Snapshot 1 (Baseline) $\to$ Perform action 10 times $\to$ Take Snapshot 2 $\to$ Filter by "Objects allocated between Snapshot 1 and 2".

---

### Part 19 — Retaining Paths: Tracing the Root Cause of Memory Retention `🟢 [Daily Driver]`

Inspect the **Retainers Tree** at the bottom of DevTools to locate the exact variable, closure, or event listener holding the object alive.

---

### Part 20 — The 10-Point Senior Memory Leak & Lifecycle Audit Checklist `🟢 [Daily Driver]`

```text
1. Are all event listeners cleaned up? ──► 2. Are setInterval/setTimeout timers cleared?
3. Are WebSockets and Observers disconnected? ──► 4. Are Web Workers terminated on unmount?
5. Are AbortControllers used for async fetch? ──► 6. Are detached DOM node references avoided?
7. Are caches bounded with LRU eviction? ──► 8. Is WeakMap used for object metadata?
9. Are DevTools Heap Snapshots verified? ──► 10. Does memory stabilize after repeated user actions?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Memory Management Strategy | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Explicit Lifecycle Teardown (`useEffect`)** | Component-level listeners, intervals, WebSocket connections, Web Workers. | Global static singletons intended to live for the entire session. | Developer oversight risk if teardown return function is omitted. | `AbortController` signals. |
| **`WeakMap` / `WeakSet`** | Attaching metadata, flags, or cached calculations to DOM elements or objects. | Storing primitive keys (strings/numbers) or needing collection enumeration (`.size`, `keys()`). | Not enumerable; cannot inspect total count or clear all entries manually. | Bounded `Map` with LRU eviction. |
| **`AbortController` Unified Teardowns** | Multi-listener teardown, cancellable `fetch` requests, async micro-frontends. | Simple synchronous single-function callbacks. | Requires passing `signal` parameter across all async/listener APIs. | Explicit `removeEventListener`. |
| **Object Pooling** | High-frequency 60fps/120fps canvas games, particle systems, physics engines. | Standard web applications with moderate object allocation rates. | Manual memory management complexity; risk of stale object state. | Standard JavaScript GC. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Memory-Safe Telemetry Dashboard in TypeScript
```tsx
import React, { useState, useEffect, useRef } from 'react';

// ==========================================
// 1. DATA TYPES & CONTRACTS
// ==========================================
export interface MetricPacket {
  timestamp: number;
  memoryUsageMb: number;
  activeNodes: number;
}

// ==========================================
// 2. MEMORY-SAFE TELEMETRY COMPONENT
// ==========================================
export function EnterpriseMemorySafeDashboard() {
  const [metrics, setMetrics] = useState<MetricPacket[]>([]);
  const [isLive, setIsLive] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // 🟢 1. AbortController for unified lifecycle teardown
    const controller = new AbortController();
    const { signal } = controller;

    // 🟢 2. Window Event Listener with AbortSignal
    window.addEventListener(
      'resize',
      () => {
        // Handle responsive dimension sync safely
      },
      { signal, passive: true }
    );

    // 🟢 3. Interval Timer with Explicit Cleanup Handle
    const intervalId = setInterval(() => {
      const newPacket: MetricPacket = {
        timestamp: Date.now(),
        memoryUsageMb: Math.floor(120 + Math.random() * 30),
        activeNodes: Math.floor(500 + Math.random() * 50)
      };

      // Keep only latest 10 packets (Bounded in-memory state!)
      setMetrics((prev) => [...prev.slice(-9), newPacket]);
    }, 1000);

    // 🟢 4. ResizeObserver with Explicit Disconnect Lifecycle
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Observe container bounds
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // 🟢 5. ATOMIC MASTER TEARDOWN (Zero Memory Leaks Guaranteed!)
    return () => {
      controller.abort(); // 🟢 Unbinds all event listeners
      clearInterval(intervalId); // 🟢 Stops background execution
      resizeObserver.disconnect(); // 🟢 Frees browser observer references
    };
  }, [isLive]);

  return (
    <div ref={containerRef} className="memory-dashboard-card">
      <header className="card-header">
        <h3>Enterprise Memory-Safe Telemetry Engine</h3>
        <span className="badge">🛡️ Zero Memory Leaks</span>
      </header>

      <p className="architecture-description">
        Demonstrates atomic lifecycle teardown using <code>AbortController</code>, bounded state caching (10 items max), interval clearing, and <code>ResizeObserver.disconnect()</code>.
      </p>

      <div className="controls-row">
        <button
          type="button"
          onClick={() => setIsLive((prev) => !prev)}
          className={`toggle-btn ${isLive ? 'active' : ''}`}
        >
          {isLive ? '⏸️ Pause Telemetry Stream' : '▶️ Resume Telemetry Stream'}
        </button>
      </div>

      <div className="metrics-banner">
        <span>Tracked Packets: <strong>{metrics.length} / 10</strong></span>
        <span>Current Heap: <strong>{metrics[metrics.length - 1]?.memoryUsageMb ?? 120} MB</strong></span>
        <span>Lifecycle Status: <strong>{isLive ? '🟢 Active & Monitored' : '🟡 Teardown Executed'}</strong></span>
      </div>

      <ul className="packet-list">
        {metrics.map((m) => (
          <li key={m.timestamp} className="packet-item">
            <span>Timestamp: {new Date(m.timestamp).toLocaleTimeString()}</span>
            <span className="node-metric">{m.activeNodes} nodes</span>
            <span className="mem-metric">{m.memoryUsageMb} MB</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 🧠 Part 07 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: `Map` vs `WeakMap` Garbage Collection
```js
let userKey = { id: 99 };
const strongMap = new Map();
const weakMap = new WeakMap();

strongMap.set(userKey, "UserData");
weakMap.set(userKey, "UserData");

userKey = null; // Removed reference
```
**Question:** Is `{ id: 99 }` eligible for Garbage Collection?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:** **No.**  
**Why:** Although `weakMap` holds a weak reference, `strongMap` holds a **strong reference** to `{ id: 99 }` as its key. As long as `strongMap` is reachable, the key object cannot be garbage collected. To make it eligible for GC, the key must be deleted from `strongMap` as well (`strongMap.clear()`).
</details>

---

### Prediction Challenge 2: Detached DOM Node Heap Retention
```js
function testLeak() {
  const list = [];
  const div = document.createElement("div");
  const span = document.createElement("span");
  div.appendChild(span);
  list.push(span); // Storing the child span in an array
  return list;
}
const retained = testLeak();
```
**Question:** What objects are kept alive in V8 heap memory by `retained`?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:** **Both `<span>` AND `<div>`!**  
**Why:** The `<span>` node has a `.parentNode` pointer to `<div>`. Retaining a reference to a child node in a detached DOM tree retains the **entire parent DOM tree** in memory.
</details>

---

### Prediction Challenge 3: Anonymous Event Listener Teardown
```js
const btn = document.querySelector("#save");
btn.addEventListener("click", () => console.log("Save"));
btn.removeEventListener("click", () => console.log("Save"));
```
**Question:** Is the click event listener successfully removed?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:** **No.**  
**Why:** The arrow function passed to `removeEventListener` is a brand new function instance in memory with a different reference from the one passed to `addEventListener`. The original listener remains attached and active.
</details>

---

### Prediction Challenge 4: Sawtooth vs Staircase Memory Profiles
```text
Profile A: Memory climbs from 100MB to 180MB during user actions, then drops back to 105MB after GC.
Profile B: Memory climbs from 100MB to 180MB, drops to 160MB, climbs to 240MB, drops to 220MB.
```
**Question:** Which profile indicates a healthy application and which indicates an active Memory Leak?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:**  
- **Profile A:** **Healthy Application** (Classic Sawtooth pattern where garbage collection successfully reclaims transient memory).  
- **Profile B:** **Active Memory Leak** (Escalating baseline where each user action permanently retains unreleased memory).
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is a Memory Leak in JavaScript, and how does Garbage Collection work?  
<details>
<summary><strong>Answer</strong></summary>
A Memory Leak occurs when memory that is no longer needed by the application remains reachable via lingering references, preventing the browser engine from freeing it. JavaScript uses a **Mark-and-Sweep Garbage Collector** that traverses object references starting from GC Roots (`window`, stack frames); any object that cannot be reached through this reference graph is marked as unreachable and swept away to reclaim memory.
</details>

**Q2:** Name 4 common causes of JavaScript memory leaks in frontend applications.  
<details>
<summary><strong>Answer</strong></summary>
1. Forgotten event listeners on `window` or `document`.  
2. Uncleared `setInterval` or `setTimeout` timers.  
3. Detached DOM nodes retained in JavaScript arrays/objects.  
4. Closures capturing and retaining large outer scope variables.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** What is a Detached DOM Node leak, and why does retaining a child element keep the entire parent tree in memory?  
<details>
<summary><strong>Answer</strong></summary>
A Detached DOM Node leak occurs when an element is removed from the active HTML document (`el.remove()`), but a reference to it is still held in a JavaScript variable, array, or object. Because DOM nodes maintain bidirectional pointers (`.parentNode`, `.children`, `.nextSibling`), holding a reference to even a single child element retains the entire parent DOM subtree and its associated styling descriptors in memory.
</details>

**Q4:** What is the difference between `Map` and `WeakMap`, and when should `WeakMap` be used?  
<details>
<summary><strong>Answer</strong></summary>
- **`Map`:** Holds strong references to keys and values. Keys will never be garbage collected as long as the `Map` is reachable.  
- **`WeakMap`:** Holds "weak" references to object keys. If no other strong references to a key object exist, the engine automatically garbage collects the object and removes the entry from the `WeakMap`.  
- **When to use:** Ideal for attaching private metadata or cached computations to DOM elements or objects without extending their lifecycle.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** How do you diagnose and trace a memory leak in a large Single-Page Application using Chrome DevTools?  
<details>
<summary><strong>Answer</strong></summary>
1. **Take Baseline Snapshot:** Open DevTools **Memory Tab** $\to$ Take Heap Snapshot 1.  
2. **Perform Action Multiple Times:** Navigate to the suspected feature, perform the user workflow, and navigate away 5–10 times.  
3. **Force Garbage Collection:** Click the "Collect Garbage" (trash can) icon in DevTools.  
4. **Take Comparison Snapshot:** Take Heap Snapshot 2 $\to$ Change perspective to "Comparison" (Objects allocated between Snapshot 1 and 2).  
5. **Inspect Detached Nodes & Retainers:** Look for `Detached HTMLDivElement` or lingering closures, select the item, and inspect the **Retainers Tree** at the bottom to find the root reference (e.g. `window.listeners` or an uncleaned `useEffect`).
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How does V8's Generational Garbage Collector (Orinoco: Scavenger vs Major Mark-Sweep-Compact) manage memory heaps, and how do you optimize for Garbage Collection Pause Times in high-throughput applications?  
<details>
<summary><strong>Answer</strong></summary>
1. **Generational Hypothesis:** V8 divides the heap into the **New Space (Young Generation)** and **Old Space (Old Generation)**. Most objects die young.  
2. **Scavenge (Minor GC):** Fast semi-space copying collector for the New Space ($1\text{ms}$ to $3\text{ms}$ pauses). Objects that survive two Minor GCs are promoted to the Old Space.  
3. **Major GC (Mark-Sweep-Compact):** Full GC cycle for the Old Space. Uses concurrent marking, parallel sweeping, and compaction to prevent heap fragmentation.  
4. **Staff Optimization:**  
   - Minimize high-frequency allocations in 60fps hot paths (reuse objects/typed arrays via Object Pools to prevent New Space churn).  
   - Eliminate lingering references to prevent premature promotion of short-lived objects into the Old Space (which triggers expensive Major GC pauses).
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Memory Leak Detector & Lifecycle Registry

```js
// See runnable implementation in examples/07-performance-profiling-diagnostics.js
```

---

## Key Takeaways
1. **Garbage Collection Requires Unreachability:** GC only reclaims memory that has no reachable references.
2. **Every Setup Demands a Teardown:** Pair every `addEventListener`, `setInterval`, and `Worker` with cleanup.
3. **Never Store Live DOM Nodes in Arrays:** Cache plain JSON data to prevent detached DOM subtree leaks.
4. **Use `WeakMap` for Ephemeral Metadata:** Prevent memory bloat when associating state with objects.
5. **Master Heap Snapshots:** Use Chrome DevTools Comparison views and Retainer trees to pinpoint leaks.

---

[⬅️ Part 06: Web Workers & Off-Main-Thread Compute](./06-web-workers-multi-threading.md) | [📚 KPI 24 Index](./README.md) | [🏁 KPI 25 — Error Handling & Reliability ➡️](../25-Error-Handling-Reliability/README.md)
