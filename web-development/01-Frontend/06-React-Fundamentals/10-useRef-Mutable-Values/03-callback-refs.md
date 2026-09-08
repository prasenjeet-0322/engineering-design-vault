# Level 06 — React Fundamentals
## KPI 10 — `useRef` & Mutable Values (DOM Refs, Imperative Handles, Instance Values & Measurement)
### PART 03 — Callback Refs & Dynamic Ref Attachment

[⬅️ Previous Part (02: DOM Refs & Host Instances)](02-dom-refs-forwardref.md) | [📚 KPI 10 Index](./README.md) | [🧪 Companion Lab](examples/03-callback-refs-dynamic-attachment.html) | [Next Part (04: Ref Lifecycle, Ownership & Resource Lifetime) ➡️](04-ref-lifecycle-and-ownership.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

# Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

## 1. What a Callback Ref Actually Is

A callback ref is a function that React invokes when a host instance becomes associated with, or detached from, that ref relationship.

```text
React commit
      │
      ├── host instance attached
      │   ▼
      │  ref(node)
      │
      └── host instance detached
          ▼
         ref(null)
```

### The Key Mental Model

> **An object ref stores a mutable pointer; a callback ref gives you lifecycle notification about the host-instance relationship.**

---

## 2. Object Ref vs Callback Ref

### Object ref

```jsx
const inputRef = useRef(null);

return <input ref={inputRef} />;
```

Conceptually:

```text
React
  │
  ▼
inputRef.current = DOMNode
```

### Callback ref

```jsx
const handleRef = (node) => {
  console.log(node);
};

return <input ref={handleRef} />;
```

Conceptually:

```text
React
  │
  ├── attach → handleRef(node)
  └── detach → handleRef(null)
```

The difference is not merely syntax:
* **Object ref** = persistent storage container.
* **Callback ref** = imperative lifecycle callback.

---

## 3. Why Callback Refs Matter

Callback refs become particularly useful when you need to perform logic at the moment a host node is attached or detached.

### Typical use cases:
* Dynamic measurement (`getBoundingClientRect()`)
* Dynamic DOM registration (`Map<ID, HTMLElement>`)
* Focus coordination on mount
* Imperative library registration (D3, Chart.js, Monaco)
* Observer attachment (`ResizeObserver`, `IntersectionObserver`)
* Resource setup/teardown
* Collection of DOM nodes in virtualized / dynamic lists

Callback refs are not a replacement for every effect. The architecture should remain:

```text
React lifecycle
       │
       ▼
 host instance
       │
       ▼
  callback ref
       ├── register
       ├── measure
       ├── connect
       └── store capability
```

---

## 4. The Three Identities You Must Track

With dynamic refs, you must distinguish between three separate concepts:

```text
1. Ref callback identity   (Function memory in JS heap)
2. DOM host-instance identity (Physical node in browser DOM)
3. Logical entity identity (Domain data item, e.g. item.id)
```

For a list:

```text
Product A
   │
   ├── React child identity (key="prod_123")
   ├── DOM node identity (<div data-id="prod_123">)
   └── ref callback relationship (register("prod_123"))
```

A robust architecture does not confuse **array position** with **logical entity identity**.

---

## 5. Golden Rule

> **Use callback refs when the attachment/detachment boundary itself is meaningful; use object refs when you primarily need stable mutable access to the current host instance.**

---

# Layer 2 — 🔬 Deep Mechanical Breakdown

## 6. Basic Callback Ref

```jsx
function Example() {
  const handleRef = (node) => {
    console.log("attached:", node);
  };

  return <div ref={handleRef}>Hello</div>;
}
```

Conceptually:

```text
Render
  ↓
React determines <div>
  ↓
Commit
  ↓
DOM node created/updated
  ↓
Callback ref invoked
  ↓
handleRef(div)
```

The callback receives the **host instance**. It does not receive a React Element, Fiber node, or component function.

---

## 7. Detachment

If the node is removed:

```jsx
return visible ? <div ref={handleRef} /> : null;
```

The relationship transitions through:

```text
visible = true
      │
      ▼
DOM node exists
      │
      ▼
handleRef(node)

visible = false
      │
      ▼
DOM node removed
      │
      ▼
handleRef(null)
```

The `null` callback is an important lifecycle signal: it signifies that this callback ref no longer has the host instance attached through this relationship.

---

## 8. Render #1 — Initial Mount

```jsx
function Panel() {
  const setPanel = (node) => {
    console.log("callback:", node);
  };

  return <section ref={setPanel}>Panel</section>;
}
```

During **Render #1**:
1. Component executes.
2. JSX creates the virtual element description.
3. React performs reconciliation.

No callback invocation occurs merely because JSX was evaluated. The host relationship is established during **Commit**:

```text
Commit
  ↓
<section> created/connected
  ↓
setPanel(sectionNode)
```

---

## 9. Render #2 — Ordinary Rerender

Suppose:

```jsx
function Panel({ count }) {
  const setPanel = (node) => {
    console.log("callback:", node);
  };

  return (
    <section ref={setPanel}>
      {count}
    </section>
  );
}
```

A new function is created during each render:
* Render #1: `setPanel₁`
* Render #2: `setPanel₂`
* Render #3: `setPanel₃`

That introduces an important reality: **callback ref identity** can itself change between renders. React must account for the ref relationship changing.

---

## 10. Why Callback Identity Matters

Consider:

```jsx
function Example() {
  return (
    <div
      ref={(node) => {
        console.log(node);
      }}
    />
  );
}
```

The inline arrow function creates a new reference during rendering:
* Render #1: `callback A`
* Render #2: `callback B` (where `A !== B`)

A changed callback identity causes ref attachment relationships to be updated. React detaches the previous callback (`callback A(null)`) and attaches the new one (`callback B(domNode)`).

Therefore: **Do not assume that an inline callback ref is lifecycle-stable merely because the DOM node itself is stable.**

---

## 11. Important Precision: Inline Callback Refs Do Not Mean "Always Unmount DOM"

This distinction is critical:

```text
callback identity changes
         │
         ├── ref relationship may detach/attach
         └── DOM identity can remain completely unchanged
```

Therefore:

$$\text{Ref Callback Churn} \neq \text{DOM Remount}$$

The physical DOM node is preserved across renders, but React re-synchronizes the changing ref callback reference by cycling it with `null` and then the current node.

---

## 12. Callback Ref as a Lifecycle Boundary

A callback ref can serve as a direct resource boundary:

```text
attach ──► initialize relationship
detach ──► tear down relationship
```

Example:

```jsx
function MeasuredBox() {
  const setNode = (node) => {
    if (!node) {
      console.log("detached");
      return;
    }
    console.log("attached");
    console.log(node.getBoundingClientRect());
  };

  return <div ref={setNode}>Content</div>;
}
```

This is useful when the lifecycle you care about is specifically: **the host node became available in the DOM**, rather than generic component mount.

---

## 13. Callback Refs and Measurement

Suppose a component renders a dynamic node:

```jsx
function Card({ children }) {
  const setCard = (node) => {
    if (!node) return;
    const rect = node.getBoundingClientRect();
    console.log(rect);
  };

  return <article ref={setCard}>{children}</article>;
}
```

The callback runs after the host relationship has been established, allowing the node to be inspected immediately.

However, continuous measurement requires additional architecture when:
* Fonts load asynchronously
* Content expands or shrinks
* Viewport or container resizes
* The node remains mounted but its layout changes

A callback ref tells you about **attachment/detachment**, not ongoing layout shifts.

---

## 14. Callback Ref ≠ ResizeObserver

* **Callback ref:** *"Give me the node when attachment changes."*
* **ResizeObserver:** *"Tell me when the observed element's size changes."*

Combining both yields a robust architecture:

```text
node attached
      │
      ▼
observer.observe(node)
      │
      ▼
size changes
      │
      ▼
observer callback
      │
      ▼
measurement update
      │
      ▼
React state / external consumer
```

---

## 15. Dynamic Collections

Object refs become awkward when you need access to an arbitrary list of dynamic nodes:

```jsx
items.map(item => (
  <div ref={...}>
    {item.name}
  </div>
))
```

A single `useRef(null)` cannot represent an entire list. A **DOM Registry** backed by a `Map` solves this naturally:

```text
DOM Registry ─────────────────────
  "item_A" ──► <div id="A">
  "item_B" ──► <div id="B">
  "item_C" ──► <div id="C">
```

---

## 16. Dynamic Ref Registry

```jsx
function List({ items }) {
  const nodes = useRef(new Map());

  const register = (id) => (node) => {
    if (node) {
      nodes.current.set(id, node);
    } else {
      nodes.current.delete(id);
    }
  };

  return (
    <>
      {items.map((item) => (
        <div key={item.id} ref={register(item.id)}>
          {item.name}
        </div>
      ))}
    </>
  );
}
```

This registry follows **logical entity identity** (`item.id`) rather than fragile array indices (`refs[0]`, `refs[1]`).

---

## 17. The Hidden Churn Problem in Naive Factories

In the naive implementation above:

```jsx
ref={register(item.id)}
```

`register(item.id)` produces a brand-new closure on every single render cycle:
* Render #1: `register(A)` $\rightarrow$ `callback A₁`
* Render #2: `register(A)` $\rightarrow$ `callback A₂` (`A₁ !== A₂`)

React will call `callback A₁(null)` and then `callback A₂(domNode)` on every re-render. While functionally working, it generates unnecessary attachment churn.

---

## 18. Stable Callback Registry

To stabilize callback references across renders, cache the callback functions per entity:

```jsx
function List({ items }) {
  const nodes = useRef(new Map());
  const callbacks = useRef(new Map());

  function getRef(id) {
    let callback = callbacks.current.get(id);
    if (!callback) {
      callback = (node) => {
        if (node) {
          nodes.current.set(id, node);
        } else {
          nodes.current.delete(id);
          callbacks.current.delete(id); // Clean up callback cache too
        }
      };
      callbacks.current.set(id, callback);
    }
    return callback;
  }

  return (
    <>
      {items.map((item) => (
        <div key={item.id} ref={getRef(item.id)}>
          {item.name}
        </div>
      ))}
    </>
  );
}
```

---

## 19. Registration Leaks

Suppose entities `A`, `B`, `C` are registered. When `B` is removed, if detachment cleanup is omitted:

```text
nodes.current ────────────────
  A ──► DOM Node A
  B ──► STALE DOM Node B (Disconnected from DOM heap)
  C ──► DOM Node C
```

This causes:
* Memory retention (preventing garbage collection of unmounted DOM subtrees)
* Invalid imperative commands executed against detached nodes
* Stale measurement calculations
* Failed focus operations

Therefore, callback refs must implement symmetric lifecycles:

$$\text{Attach} \longrightarrow \text{Register} \quad \Big| \quad \text{Detach} \longrightarrow \text{Unregister}$$

---

## 20. Registry Invariant

> **For every registry entry:**  
> 1. The domain entity is currently represented in the component state.  
> 2. The DOM node belongs to the active, committed document tree (`node.isConnected === true`).

$$\text{Registry Correctness} = \text{Registration Symmetry} + \text{Stable Entity Identity} + \text{Correct Detach Handling}$$

---

## 21. List Reordering

Suppose `[A, B, C]` is reordered to `[C, A, B]` with `key={item.id}`:

```text
Logical mapping remains constant:
  A ──► DOM A
  B ──► DOM B
  C ──► DOM C
```

A registry keyed by `item.id` remains semantically correct across sorts and filters.

In contrast, an **index-based registry** (`0 ➔ DOM`, `1 ➔ DOM`) breaks immediately upon reordering because index `0` now points to item `C` instead of `A`.

---

## 22. Callback Ref + Stable React Keys

A bulletproof dynamic list architecture synchronizes identities across all layers:

```text
Domain Entity ID
       │
       ├── React key (key={item.id})
       └── Callback-ref registry key (ref={getRef(item.id)})
               │
               ▼
        Committed DOM Node
```

---

## 23. Logical Entity vs Physical DOM Node

* **Logical Entity:** Domain application data object in memory.
* **Physical DOM Node:** Rendered host instance in the browser DOM.

In virtualized lists or paginated interfaces, logical entities exist without physical DOM nodes:

```text
Logical dataset (10,000 entities) ────► 1, 2, 3, ... 10,000
                                              │
Mounted DOM viewport (30 rows)   ────► 997, 998, ... 1026
```

A callback-ref registry should only store host instances for currently mounted entities (`997` – `1026`).

---

## 24. Virtualization Mechanics

A virtualized callback registry must never attempt to allocate or retain 10,000 DOM nodes. As items scroll into view, the callback ref attaches and registers them; as they scroll out of view, the callback ref receives `null` and purges them from the registry.

---

## 25. Callback Ref + Focus Management

Dynamic focus coordination requires waiting until the host node is fully committed:

```text
Item enters React state
         ↓
Host node committed to DOM
         ↓
Callback ref receives node
         ↓
nodes.current.get(id)?.focus()
```

Ideal for:
* Focusing newly inserted table rows
* Auto-focusing first invalid field on form submission
* Keyboard arrow navigation across dynamic grids
* Modal dialog trap initialization

---

## 26. Focus Is Not React Identity

Having a ref does not guarantee focus persistence:
* If the element's `key` changes, React remounts the DOM node.
* The old DOM node loses browser focus.
* The new DOM node attaches to the ref, but focus is lost unless imperatively restored.

---

## 27. Dynamic Measurement Architecture

```text
Entity ──► React Key ──► Fiber ──► Host DOM ──► Callback Ref ──► Observer ──► Measurement State
```

Separating these concerns prevents coupling layout calculations with render loops.

---

## 28. Callback Refs vs Effects

```jsx
function Widget() {
  const setNode = (node) => {
    if (!node) return;
    initializeWidget(node);
  };

  return <div ref={setNode} />;
}
```

* **Use Callback Ref:** When initialization is strictly tied to host attachment/detachment.
* **Use `useEffect`:** When setup depends on reactive props, async queries, or complex synchronization logic.

---

## 29. Anti-Pattern: Callback Ref as Disguised Effect

```jsx
// ❌ WRONG: Callback ref abused as an effect
function Search({ query }) {
  const setNode = (node) => {
    if (!node) return;
    fetch(`/api/search?q=${query}`);
  };

  return <input ref={setNode} />;
}
```

The callback ref fires on host node attachment, but the network request depends on `query` updates. Placing data synchronization in a ref callback breaks React's dependency lifecycle.

---

## 30. Ref Callback Closures

```jsx
function Item({ id }) {
  const setNode = (node) => {
    console.log(id, node);
  };

  return <div ref={setNode}>{id}</div>;
}
```

The ref callback closes over the lexical scope of the render that created it:
* Render #1 (`id = A`): Callback closure captures `A`.
* Render #2 (`id = B`): Callback closure captures `B`.

---

## 31. Prediction Challenge — Closures

```jsx
function Item({ id }) {
  const setNode = (node) => {
    console.log("id:", id, "node:", node);
  };

  return <div ref={setNode} />;
}
```

When `id` updates from `A` to `B`, React invokes the old callback with `null` (`id: A, node: null`) and the new callback with the element (`id: B, node: <div>`).

---

## 32. Dynamic Ref Factories and Closures

When building dynamic ref factories:
1. Ensure the closure correctly captures the logical entity ID.
2. Memoize or cache the callback functions to avoid per-render recreation churn.

---

## 33. Ref Callback Exceptions

Exceptions thrown inside a ref callback abort the commit phase and trigger React Error Boundaries. Ref callbacks must be defensive, deterministic, and safe.

---

## 34. Strict Mode Double-Invocation

In React Strict Mode (development), React mounts, unmounts, and remounts components to stress-test cleanup logic:

$$\text{Attach } (\text{node}) \longrightarrow \text{Detach } (\text{null}) \longrightarrow \text{Attach } (\text{node})$$

A properly authored callback ref handles this seamlessly through symmetric registration and unregistration.

---

# Layer 3 — 🧪 Diagnostic Labs & DevTools Profiling

## Lab 1 — Basic Callback Ref Trace

```jsx
function Probe() {
  const setNode = (node) => {
    console.table({
      phase: node ? "attach" : "detach",
      node: node ? node.tagName : null,
      time: performance.now(),
    });
  };

  return <div ref={setNode}>Probe</div>;
}
```

---

## Lab 2 — Callback Identity Probe

```jsx
function Probe({ tick }) {
  const callback = (node) => {
    console.log("ref tick:", tick, "node:", node);
  };

  return <div ref={callback}>{tick}</div>;
}
```

Observe that on every render, React logs detachment with `null` followed by attachment with `node` because `callback` has a new function reference.

---

## Lab 3 — Registry Inspection

```js
console.table(
  [...nodes.current.entries()].map(([id, node]) => ({
    id,
    tag: node?.tagName,
    connected: node?.isConnected,
  }))
);
```

Inspect active registrations and verify no detached (`isConnected === false`) DOM nodes linger in memory.

---

## Lab 4 — Chrome Elements DOM Identity Verification

1. Open Chrome DevTools $\rightarrow$ **Elements**.
2. Trigger item reordering or list filtering.
3. Observe DOM node highlights: verify that existing DOM nodes are reordered rather than destroyed and recreated.

---

## Lab 5 — React DevTools Profiler

Profile dynamic list reordering:
* Distinguish between **Component Rerender**, **Host Node Recreation**, and **Ref Callback Attachment**.

---

## Lab 6 — Registry Leak Diagnostic

```jsx
// Register items A, B, C -> Remove item B
console.assert(registry.current.has("B") === false, "Memory Leak: B was not unregistered!");
```

---

# Layer 4 — 🔥 The Crucible

## Challenge 1 — Callback Invocation Argument

```jsx
function Example() {
  const setNode = (node) => {
    console.log(node);
  };

  return <div ref={setNode} />;
}
```

**Question:** What does `setNode` receive on mount and unmount?  
**Answer:** On mount, it receives the committed `HTMLDivElement`. On unmount, it receives `null`.

---

## Challenge 2 — Rerenders and Host DOM Instances

```jsx
function Example({ count }) {
  const setNode = (node) => {
    console.log(count, node);
  };

  return <div ref={setNode}>{count}</div>;
}
```

**Question:** Does changing `count` create a new DOM node?  
**Answer:** No. Reconciliation updates the text content of the existing `HTMLDivElement`. However, the inline `setNode` function changes reference, triggering detach (`null`) and reattach (`div`).

---

## Challenge 3 — Factory Churn

```jsx
const refs = useRef(new Map());

function getRef(id) {
  return (node) => {
    if (node) refs.current.set(id, node);
    else refs.current.delete(id);
  };
}
```

**Question:** Why does `ref={getRef(item.id)}` cause attachment churn on every render?  
**Answer:** Because `getRef(id)` returns a newly instantiated arrow function on every render, causing React to detach and re-attach the ref.

---

## Challenge 4 — Reordering Stable Keys

Given `[A, B, C]` reordered to `[C, A, B]` with `key={item.id}`:  
**Question:** Does a registry keyed by `item.id` retain correct DOM mappings?  
**Answer:** Yes. The domain identity remains constant; each DOM node stays correctly mapped to its respective entity ID.

---

## Challenge 5 — Virtualized Registry Size

In a list of 10,000 items with 30 rendered rows:  
**Question:** How many entries should exist in the DOM registry?  
**Answer:** Exactly 30 entries (the currently mounted host instances).

---

## Challenge 6 — Missing Detach Handler

If `registry.current.delete(id)` is omitted when `node === null`:  
**Question:** What are the consequences?  
**Answer:** Stale DOM references remain in heap memory, leaking unmounted subtrees and causing erroneous focus/scroll actions.

---

# Production Post-Mortems

## Incident 1: Stale Row Registry Breaks Auto-Scroll

### Symptom
A chat application with auto-scroll sometimes scrolls to invisible, unmounted message rows.

### Root Cause
Message rows registered their DOM nodes in a `Map`, but omitted the `node === null` deletion check. When old messages were pruned from memory, the registry held stale DOM nodes.

### Senior Resolution
```tsx
const registerNode = (id: string) => (node: HTMLElement | null) => {
  if (node) {
    messageNodes.current.set(id, node);
  } else {
    messageNodes.current.delete(id); // Symmetric unregistration
  }
};
```

---

## Incident 2: Focus Jumps to Wrong Row on Table Sort

### Symptom
Editing a table row and sorting causes focus to jump to an entirely different user's row.

### Root Cause
The ref callback was keyed by array index (`register(index, node)`) instead of domain entity ID (`register(user.id, node)`).

### Senior Resolution
Always key ref registries by immutable domain IDs matching the React `key` prop.

---

## Incident 3: Third-Party Chart Re-renders Continuously

### Symptom
A high-frequency dashboard re-instantiates heavy canvas charts on every prop change.

### Root Cause
Chart initialization was placed directly inside an inline ref callback (`ref={node => initChart(node)}`). Every parent render triggered a full chart destroy and re-create cycle.

### Senior Resolution
Stabilize the ref callback or separate host container attachment from reactive property synchronization via `useEffect`.

---

## Incident 4: Detached DOM Memory Growth

### Symptom
A single-page application experiences gradual heap memory growth of 200MB+ after navigating large data tables.

### Root Cause
Detached DOM nodes were retained in module-scoped or component-scoped ref registries without deletion.

---

# Senior Architecture Decision Matrix

| Requirement | Object Ref (`useRef`) | Callback Ref (`ref={fn}`) | Effect (`useEffect`) |
| :--- | :---: | :---: | :---: |
| **Singular DOM handle** | ✅ | ✅ | — |
| **Attachment notification** | — | ✅ | — |
| **Detachment notification** | — | ✅ | Cleanup return |
| **Dynamic list DOM registry** | ⚠️ Awkward | ✅ **Ideal** | ⚠️ Indirect |
| **Immediate measurement** | ⚠️ Delayed | ✅ **Synchronous** | ⚠️ Layout effect |
| **Continuous resize observing** | — | Setup only | ✅ Paired with observer |
| **Third-party widget lifecycle** | Possible | Possible | ✅ **Preferred** |
| **Latest mutable value** | ✅ **Ideal** | — | — |
| **UI State representation** | ❌ Never | ❌ Never | ❌ Never |

---

# Senior Anti-Patterns

## Anti-Pattern 1: Module-Global DOM Registries

```jsx
// ❌ WRONG: Leaks memory and collides across multiple component instances
const globalDOMRegistry = new Map();

function Item({ id }) {
  return <div ref={node => globalDOMRegistry.set(id, node)} />;
}
```

### Senior Refactoring
Scope registries to the component instance via `useRef(new Map())`.

---

## Anti-Pattern 2: God-Object Ref Callbacks

```jsx
// ❌ WRONG: Ref callback overloaded with application logic
<div ref={node => {
  if (!node) return;
  fetchAnalytics();
  startWebsocket();
  updateGlobalState();
  initHeavySDK(node);
}} />
```

### Senior Refactoring
Keep ref callbacks strictly focused on host registration, capability storage, and immediate measurement. Delegate orchestration to custom hooks and effects.

---

# Senior Interview Q&A

### Q1. What is the fundamental difference between an object ref and a callback ref?
> **Answer:** An object ref is a passive mutable container (`{ current: T }`) whose `.current` property React updates during commit. A callback ref is an active lifecycle function `(node: T | null) => void` that React explicitly invokes whenever the host DOM node attaches or detaches.

### Q2. When should you choose a callback ref over `useRef`?
> **Answer:** Choose a callback ref when you need immediate notification of DOM attachment/detachment (such as measuring an element as soon as it mounts, managing a dynamic list of DOM nodes via a `Map`, or attaching a `ResizeObserver` directly to a conditional element).

### Q3. Does changing an inline callback ref cause the DOM node to remount?
> **Answer:** No. Changing the callback ref's function identity causes React to detach the old callback (`callbackA(null)`) and invoke the new callback (`callbackB(node)`), but the underlying physical DOM node remains mounted and untouched.

### Q4. Why is keying dynamic ref registries by array index dangerous?
> **Answer:** Because array indices change when items are sorted, filtered, inserted, or deleted. Index-keyed registries end up pointing to the wrong domain entities after reconciliation.

### Q5. What is the symmetric cleanup protocol for callback refs?
> **Answer:** When `node` is non-null, register or initialize the resource; when `node` is `null`, unregister, disconnect observers, and release all references to avoid memory leaks.

---

# Master Checklist

* [ ] Explain the mechanical difference between object refs and callback refs.
* [ ] Understand the attachment (`node`) and detachment (`null`) lifecycle protocol.
* [ ] Diagnose why inline callback refs cause per-render attach/detach cycling.
* [ ] Implement a stable dynamic DOM registry (`Map<ID, HTMLElement>`).
* [ ] Ensure all dynamic registries use domain IDs matching React `key` props.
* [ ] Implement symmetric attach and unregister logic to prevent detached DOM memory leaks.
* [ ] Distinguish logical domain entities from physical host DOM nodes in virtualized lists.
* [ ] Combine callback refs with `ResizeObserver` for continuous layout measurement.
* [ ] Prevent overloading ref callbacks with data fetching or application state side effects.
* [ ] Handle React Strict Mode double-invocation gracefully.

---

# Companion Lab Contract

The companion interactive lab visualizes:
1. Object ref vs Callback ref lifecycle traces.
2. Dynamic DOM Registry (`Map<ID, HTMLElement>`) with live add, remove, sort, and filter operations.
3. Real-time logging of `attach(node)` and `detach(null)` events.
4. Memory leak simulation: Toggle symmetric unregistration on/off and observe detached DOM counts.
5. Focus coordinator: Selectively focus dynamic rows after sorting.

---

# Final Mental Model

```text
LOGICAL ENTITY (item.id)
       │
       ▼
React Key (key={item.id})
       │
       ▼
Host Instance (<div id="row-1">)
       │
       ▼
Callback Ref
      / \
attach   detach
  │         │
  ▼         ▼
register   unregister
  │         │
  └────► DOM REGISTRY (Map<ID, HTMLElement>) ────► IMPERATIVE BROWSER APIS
```

> **A callback ref is strongest when the existence of the host instance itself is the event you care about. Attach the capability when the node exists, release it when the node disappears, and key the relationship by stable logical identity rather than physical position.**

---

[⬅️ Previous Part (02: DOM Refs & Host Instances)](02-dom-refs-forwardref.md) | [📚 KPI 10 Index](./README.md) | [🧪 Companion Lab](examples/03-callback-refs-dynamic-attachment.html) | [Next Part (04: Ref Lifecycle, Ownership & Resource Lifetime) ➡️](04-ref-lifecycle-and-ownership.md)
