# Level 06 — React Fundamentals
# KPI 01 — React Mental Model & Programming Model
## PART 02 — React's Core Entities: Component, Element, Instance, Fiber & DOM Node

[⬅️ Part 01: React as a Declarative UI System](./01-react-as-a-declarative-ui-system.md) | [📚 KPI 01 Index](./README.md) | [🧪 Lab 02](./examples/02-react-core-entities-inspector-lab.html) | [Part 03: State → Update → Render → Commit ➡️](./03-state-update-render-commit.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer \| Founding Engineer)

---

# 🧭 PART OBJECTIVE

This Part establishes one of the most important vocabulary and architectural boundaries in React:

```text
Component  ──►  Element  ──►  Component Instance / Identity  ──►  Fiber  ──►  DOM Node
```

These terms are often casually treated as synonyms. **They are not synonyms.**

A senior React engineer looking at `<UserCard user={user} />` must be able to answer:
* What is `UserCard`?
* What is `<UserCard user={user} />`?
* What does React create from that JSX?
* Is that object a DOM node?
* Where does the component's identity live?
* Where does React keep state?
* What is the Fiber?
* What eventually appears in the DOM?
* Which of these concepts survives across renders?
* Which objects are implementation details?
* Which concepts are part of the public React programming model?

---

# LAYER 1 — ⚡ 30-SECOND EXECUTIVE CHEAT SHEET

## 1. The Core Model

Start with:

```jsx
<UserCard user={user} />
```

Conceptually:

```text
               JavaScript
                   │
                   ▼
           UserCard function
             "component"
                   │
                   ▼ used through
        <UserCard user={user} />
                   │
                   ▼
          React Element Object
                   │
                   ▼ React rendering process
                 Fiber
       (internal React structure)
                   │
                   ▼ Host / DOM representation
                DOM Node
                   │
                   ▼ Browser
                 Pixels
```

### Critical Correction:
`Component → Element → Fiber → DOM` should be treated as a **conceptual relationship**, not a literal one-to-one object conversion pipeline.
* A component may produce many elements.
* An element can describe a host element or another composite component.
* A Fiber is React's internal representation of work and identity.
* A DOM node is a browser host object.

---

## 2. Executive Concept Table

| Concept | What It Is | Production Impact | Common Senior Trap |
| :--- | :--- | :--- | :--- |
| **Component** | Reusable unit of React UI and business logic | Defines composition and responsibility boundaries | Calling the component itself an element |
| **Component Function** | JavaScript function implementing a function component | Executes during rendering to return element tree | Assuming one function object equals one mounted component |
| **React Element** | Plain, immutable JS object describing what React should render | Input to React's reconciliation diffing process | Calling it a DOM node |
| **Component Instance** | Runtime identity of a mounted component in the tree | Holds state identity across render passes | Assuming function components are class-style instances (`new Component()`) |
| **Fiber** | Internal React data structure representing a unit of work/tree identity | Enables reconciliation, double-buffering, and state bookkeeping | Treating private Fiber fields as public application APIs |
| **DOM Node** | Browser C++ object representing host DOM tree (`HTMLDivElement`) | Receives committed mutation patches | Calling it React's internal representation |
| **Host Element** | React description of a native host target (`"div"`, `"button"`) | Eventually corresponds to host DOM output | Confusing `<button />` with actual `HTMLButtonElement` |

---

## 3. The Golden Rule

> **A React component describes UI; a React element describes what should be rendered; a Fiber is an internal React representation of work and identity; a DOM node is the browser's actual host object. Keep these layers strictly separate.**

---

# LAYER 2 — 🔬 DEEP MECHANICAL BREAKDOWN

## 4. What Is a Component?

A component is a reusable unit of UI composition.

```jsx
function UserCard({ user }) {
  return (
    <article>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </article>
  );
}
```

At the JavaScript runtime level:

```text
UserCard ──► JavaScript Function
```

The function is the implementation of the function component. It describes what UI should result from its inputs (`props`).

---

## 5. A Component Is Not a DOM Node

Given:

```jsx
function UserCard() {
  return <article>User</article>;
}
```

`UserCard` is **not** `<article>` and it is **not** `HTMLArticleElement`.

```text
UserCard (JS Function Component)
   │
   ▼ returns
<article> (React Element Object: { type: 'article', props: { children: 'User' } })
   │
   ▼ committed to
DOM <article> node (HTMLArticleElement in browser heap)
```

---

## 6. Component Function

```jsx
function Greeting({ name }) {
  return <h1>Hello {name}</h1>;
}
```

`typeof Greeting === "function"`. That function is invoked by React as a component.
The function object itself is **not** the mounted component instance.

---

## 7. React Element

```jsx
<Greeting name="Sunny" />
```

This is JSX. Conceptually, React receives a description corresponding to:

```javascript
{
  $$typeof: Symbol.for('react.element'),
  type: Greeting,
  props: { name: "Sunny" },
  key: null,
  ref: null
}
```

A React element is a **lightweight, immutable JavaScript description of what React should render**. It is not the DOM node itself.

---

## 8. Element ≠ DOM Node

```javascript
const element = <button>Save</button>;
```

`element` is a plain JavaScript object. It is **not** `HTMLButtonElement`.
The DOM node exists in the browser host environment after React commits the corresponding host output.

```text
React Element
   │ (describes)
   ▼
Host Output
   │ (committed to)
   ▼
DOM Node (HTMLButtonElement)
```

---

## 9. React Element ≠ Component

```jsx
function Button() {
  return <button>Save</button>;
}

const element = <Button />;
```

* `Button` $\longrightarrow$ Component function (the blueprint).
* `<Button />` $\longrightarrow$ React element (the invocation description).

---

## 10. Entity Separation Walkthrough

```jsx
function Button({ label }) {
  return <button>{label}</button>;
}

const element = <Button label="Save" />;
```

Identify every layer:
1. `Button` $\longrightarrow$ Component function
2. `element` $\longrightarrow$ React element
3. `Fiber` $\longrightarrow$ Internal React work/state node
4. `<button>Save</button>` $\longrightarrow$ Host DOM node (`HTMLButtonElement`) in the browser

```text
Button
  │ (component function)
  ▼
<Button label="Save" />
  │ (React element)
  ▼
React internal representation
  │ (Fiber)
  ▼
Host representation
  │
  ▼
DOM node (<button>Save</button>)
```

---

## 11. Why React Needs Elements

If components directly manipulated the DOM, React would lose its declarative programming model.
Instead, a component returns an element description:

```jsx
return (
  <button disabled={disabled}>
    {label}
  </button>
);
```

React compares the previous description with the next description:

```text
Previous: <button disabled={false}>Save</button>
Next:     <button disabled={true}>Save</button>
```

React diffs the two plain JavaScript descriptions in memory and calculates that only the `disabled` property needs patching on the existing host DOM node.

---

## 12. Element Objects Are Descriptions

```text
Element = description
Element ≠ actual UI object
```

```javascript
const element = (
  <button className="primary">
    Save
  </button>
);
```

Conceptually:

```text
Element
├── $$typeof: Symbol(react.element)
├── type: "button"
├── props:
│   ├── className: "primary"
│   └── children: "Save"
├── key: null
└── ref: null
```

---

## 13. What About Component Instances?

* In **Class Components**, there is an actual ES6 class instance created (`new UserCard()`) that persists state on `this.state`.
* In **Function Components**, there is **no class instance**.

---

## 14. Function Components Do Not Have Class-Style Instances

```jsx
function UserCard() {
  return <div>User</div>;
}
```

There is no JavaScript object created via `new UserCard()`.
React maintains identity, state, and hook subscriptions through its internal **Fiber** data structure.

---

## 15. What "Component Instance" Means in Modern React

For function components, "instance" refers to the **persistent identity and state relationship** that React tracks at a specific location in the tree across multiple render passes.

```text
Function Component
       │
       ▼
Fiber Identity (at specific tree position & key)
       │
       ▼
Persistent Hook/State Bookkeeping
```

---

## 16. Component Identity

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(c => c + 1)}>
      {count}
    </button>
  );
}
```

Where does `count = 3` live?
* Not in the JSX element object (which is recreated and discarded on every render).
* Not in the DOM `<button>` alone.
* It lives in the **Fiber node** attached to React's internal Fiber tree at that specific tree position!

---

## 17. Fiber: The Internal Work Engine

React uses **Fiber** as its internal engine for tracking component identity, state, props, and scheduled work.

```text
Fiber
├── type: Counter
├── key: null
├── pendingProps: { ... }
├── memoizedProps: { ... }
├── memoizedState: { memoizedState: 3, next: null } // Hooks linked list
├── child: Fiber
├── sibling: Fiber
├── return: Fiber (parent)
├── stateNode: HTMLButtonElement (for host components)
└── ...
```

Fiber fields are **private engine internals**, not public application APIs.

---

## 18. Fiber Is Not the DOM

```text
JavaScript Heap (V8/Browser)
│
├── React Elements (Ephemeral descriptions discarded after render)
├── Fibers (Persistent internal tree nodes tracking identity & hooks)
├── Application Objects (User state, caches)
└── Browser DOM (C++ Host Objects: HTMLButtonElement, HTMLDivElement)
```

---

## 19. Fiber's Role in the Architecture

```text
React Component Tree
        │
        ▼
Fiber Tree
├── Tree Identity & Position
├── Props Cache (pendingProps vs memoizedProps)
├── State & Hook Bookkeeping (memoizedState singly linked list)
├── Parent / Child / Sibling Pointer Graph
└── Scheduled Work & Lane Priorities
```

---

## 20. Fiber Tree Pointer Graph (`child`, `sibling`, `return`)

```jsx
function App() {
  return (
    <main>
      <Header />
      <Content />
    </main>
  );
}
```

```text
App Fiber
   │ child
   ▼
main Fiber
   │ child
   ▼
Header Fiber ── sibling ──► Content Fiber
   │                           │
   └────────── return ─────────┴──────────► main Fiber
```

* `child`: Points to its first immediate child Fiber.
* `sibling`: Points to the next sibling Fiber at the same tree depth.
* `return`: Points back to the parent Fiber (the Fiber to return to after processing work).

---

## 21. Double Buffering: `current` vs `workInProgress`

```text
                       React Root
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
       CURRENT TREE              WORK-IN-PROGRESS TREE
      (Committed state)           (Being computed in JS)
             │                           │
             ▼                           ▼
        Screen State                Next UI State
```

* `current`: The Fiber tree currently rendered on the screen.
* `workInProgress`: The alternate Fiber tree being constructed during the render phase. Once finished and committed, the root pointer swaps `current = workInProgress` (double buffering).

---

## 22. Fiber and `memoizedState` (Hook Linked List)

```text
Fiber.memoizedState
        │
        ▼
   [Hook #1: useState (count)]
        │ next
        ▼
   [Hook #2: useEffect (subscription)]
        │ next
        ▼
   [Hook #3: useRef (inputRef)]
        │ next
        ▼
      null
```

This explains the **Rules of Hooks**: Because React traverses `memoizedState.next` sequentially during every render, hook calls **cannot be placed inside `if` statements or loops**. If the order shifts, state gets assigned to the wrong hook!

---

## 23. Composite Elements vs Host Elements

```jsx
// 1. Composite / Component Element (type is a JS Component function)
const composite = <UserCard user={user} />;
// element.type === UserCard

// 2. Host Element (type is a string matching native HTML tag)
const host = <div className="card" />;
// element.type === "div"
```

* **Composite elements** tell React: *"Invoke this function to get more element descriptions."*
* **Host elements** tell React: *"This represents a browser DOM node; reconcile its attributes with the DOM."*

---

## 24. The Full Entity Map

```text
┌──────────────────────────────────────────────┐
│           JavaScript Application             │
│                                              │
│        function UserCard() { ... }           │
│                      │                       │
│                      ▼                       │
│             COMPONENT FUNCTION               │
└──────────────────────┬───────────────────────┘
                       │ used as
                       ▼
┌──────────────────────────────────────────────┐
│                React Element                 │
│                                              │
│       { type: UserCard, props: {...} }       │
└──────────────────────┬───────────────────────┘
                       │ (Render phase)
                       ▼
┌──────────────────────────────────────────────┐
│         React Internal Representation        │
│                                              │
│                    Fiber                     │
│    ├── identity & position                   │
│    ├── props cache                           │
│    ├── memoizedState (hooks linked list)     │
│    └── child / sibling / return pointers     │
└──────────────────────┬───────────────────────┘
                       │ (Commit phase)
                       ▼
┌──────────────────────────────────────────────┐
│               Host Environment               │
│                                              │
│                   DOM Node                   │
│   HTMLDivElement / HTMLButtonElement / etc.  │
└──────────────────────┬───────────────────────┘
                       │ (Browser engine)
                       ▼
┌──────────────────────────────────────────────┐
│                    Browser                   │
│                                              │
│     Style ──► Layout ──► Paint ──► Composite │
└──────────────────────────────────────────────┘
```

---

## 25. Critical Architecture Rule: Not a 1-to-1 Mapping!

Never assume `1 Component = 1 Element = 1 Fiber = 1 DOM Node`.
* One component can return a fragment with 10 elements: `<><Header /><Body /><Footer /></>`.
* A composite component (`<App />`) does **not** create an `<app>` DOM node in HTML.
* Some components return `null` (rendering 0 DOM nodes while maintaining a Fiber).

---

# LAYER 3 — 🧪 DIAGNOSTIC LABS & DEVTOOLS

## Lab 1 — Inspecting Component vs DOM Layers in DevTools

```jsx
function UserCard({ user }) {
  console.count("UserCard render");
  return (
    <article className="user-card">
      <h2>{user.name}</h2>
    </article>
  );
}
```

1. Open **React DevTools $\to$ Components tab**:
   * Inspect `UserCard`. You see `props`, `hooks`, and the React component hierarchy.
2. Open **Chrome DevTools $\to$ Elements tab**:
   * Inspect `<article class="user-card">`. You are inspecting the native C++ `HTMLArticleElement` DOM node.

---

## Lab 2 — Proving Element Objects $\neq$ DOM Nodes with Refs

```jsx
import { useEffect, useRef } from "react";

function InputProbe() {
  const domRef = useRef(null);

  const elementObject = <input ref={domRef} defaultValue="React" />;

  console.log("React Element Object:", elementObject);
  // Plain JS Object: { type: 'input', props: { defaultValue: 'React' }, ... }

  useEffect(() => {
    console.log("Actual Host DOM Node:", domRef.current);
    // HTMLInputElement { value: 'React', focus: f(), ... }
  }, []);

  return elementObject;
}
```

---

# LAYER 4 — 🔥 THE CRUCIBLE

## Prediction Challenge 1 — Entity Classification

Given:

```jsx
function Button({ label }) {
  return <button>{label}</button>;
}

const element = <Button label="Save" />;
```

### Classify each item:
1. `Button`
2. `element`
3. `<button>`
4. The clickable rectangle on the browser screen

<details>
<summary>Answer</summary>

1. **`Button`**: Component function.
2. **`element`**: React Element object (`{ type: Button, props: { label: "Save" } }`).
3. **`<button>`**: JSX describing a host React Element (`{ type: "button", ... }`).
4. **Clickable rectangle**: Rendered pixels on screen produced by the browser engine from an underlying `HTMLButtonElement` DOM node.

</details>

---

## Prediction Challenge 2 — Element Equality vs Tree Identity

```javascript
const a = <div />;
const b = <div />;

console.log(a === b);
```

### Predict:
1. What does `a === b` evaluate to?
2. Does `a !== b` mean React will destroy and recreate the `<div>` DOM node during reconciliation?

<details>
<summary>Answer</summary>

1. **`false`**: Every JSX evaluation produces a brand-new plain JavaScript object in the heap.
2. **No**: React reconciles the tree based on element `type`, `key`, and tree position. Because both describe a `"div"` at the same position, React preserves the existing `HTMLDivElement` DOM node.

> **Senior Principle:** JavaScript object reference equality $\neq$ React tree identity!

</details>

---

## Prediction Challenge 3 — Function Component "Instantiation"

Does React execute `new UserCard()` when rendering `function UserCard() { return <div />; }`?

<details>
<summary>Answer</summary>

**No.** React calls `UserCard(props)`. Function components do not have ES6 class instances. Their state and persistent identity are maintained in internal Fiber structures.

</details>

---

## Production Incident: Lost Search Focus on Every Keystroke

### Symptom:
> *"A user types in our search input, but after every single character, the cursor disappears and the input loses focus."*

### Root Cause Diagnosis:
```jsx
// ❌ FLAGGED BUGGY CODE:
function SearchPage() {
  const [query, setQuery] = useState("");

  // BUG: Declaring a component inside another component's render body!
  function SearchInput() {
    return <input value={query} onChange={e => setQuery(e.target.value)} />;
  }

  return <SearchInput />;
}
```

### Mechanical Failure:
1. On each keystroke, `setQuery` triggers `SearchPage` to re-render.
2. During render, a **brand-new function reference** for `SearchInput` is created in memory (`SearchInput_render2 !== SearchInput_render1`).
3. During reconciliation, React compares element types: `element.type` changed from `SearchInput_render1` to `SearchInput_render2`.
4. React determines this is a **completely different component type** $\longrightarrow$ unmounts old Fiber $\longrightarrow$ destroys old `HTMLInputElement` DOM node $\longrightarrow$ mounts new DOM node.
5. Focus is permanently lost on every keystroke!

### Senior Refactoring:
Move `SearchInput` outside `SearchPage`, or render the input directly.

---

## Engineering Decision Matrix

| Question | Correct Entity / Answer |
| :--- | :--- |
| *"What JavaScript function defines this UI unit?"* | **Component Function** |
| *"What plain object describes this render pass?"* | **React Element** |
| *"What engine data structure maintains work, identity, and hooks?"* | **Fiber** |
| *"What is the actual browser C++ host object?"* | **DOM Node** (`HTMLElement`) |
| *"Can a React Element be selected with `document.querySelector`?"* | **No** (it lives in JS memory, not the DOM) |
| *"Can a DOM Node be passed directly as JSX?"* | **No** |
| *"Do function components have class instances?"* | **No** |
| *"Can different element objects represent the same React identity?"* | **Yes** (same type + position preserves Fiber) |
| *"Are Fiber fields public application API?"* | **No** (private engine implementation details) |

---

## Senior Interview Gotchas

1. **"Is JSX a DOM node?"**  
   *No.* JSX compiles to `react/jsx-runtime` function calls returning plain React Element descriptor objects.
2. **"Is a React Element a Component?"**  
   *No.* An element describes the invocation of a component (`{ type: Component, props }`).
3. **"If two React Element objects are not `===`, will React remount the DOM node?"**  
   *No.* Reconciliation checks `element.type` and `key`, not the memory address of the ephemeral element object.
4. **"Is Fiber the Virtual DOM?"**  
   *Avoid the phrase 'Virtual DOM'.* Fiber is React's internal 2-way linked-tree architecture representing work, priorities, hooks, and component identity.

---

## Cross-Level Knowledge Boundary

```text
┌────────────────────────────────────────────────────────┐
│ THIS PART: React Core Entities                         │
│ Component ──► Element ──► Fiber ──► DOM Node           │
└────────────────────────────────────────────────────────┘
             │
             ├── L4 (Browser Internals) ──► DOM C++ tree, style, layout, paint (Referenced)
             ├── L5 (TypeScript) ─────────► ReactElement, ComponentType, JSX.Element typing (Applied later)
             ├── L7 (Advanced React) ─────► Fiber Lane priority bits, work loops (Deferred)
             └── L8 (Next.js & RSC) ──────► Server Component flight objects (Deferred)
```

---

# 🧠 30-SECOND FINAL REVISION MODEL

```text
                  COMPONENT
             (JS Function Logic)
                      │
                      ▼
                REACT ELEMENT
             (Plain Object Tree)
                      │
                      ▼
                    FIBER
         (Internal Work & Identity)
                      │
                      ▼
                   DOM NODE
             (Browser Host Object)
                      │
                      ▼
                BROWSER PAINT
                   (Pixels)
```

---

# PART 02 — COMPLETION CHECKLIST

* [x] Define a React component.
* [x] Explain what a function component actually is.
* [x] Distinguish a component function from a React element.
* [x] Define a React element object anatomy (`type`, `props`, `key`, `$$typeof`).
* [x] Explain why a React element is a description rather than a DOM node.
* [x] Distinguish host elements (`"div"`) from composite component elements (`UserCard`).
* [x] Explain what a DOM node is and how it differs from a Fiber.
* [x] Explain the conceptual meaning of component instance and why function components lack class instances.
* [x] Define Fiber at a conceptual level (work, state bookkeeping, identity).
* [x] Explain `child`, `sibling`, and `return` pointer graphs.
* [x] Explain `current` vs `workInProgress` double-buffering.
* [x] Explain how `Fiber.memoizedState` forms a singly linked list for Hooks.
* [x] Explain why Fiber internals are not public application APIs.
* [x] Distinguish JavaScript object reference equality from React component identity.
* [x] Trace a nested component declaration focus bug.
* [x] Use React DevTools and Chrome DevTools to inspect different layers.

---

# KPI 01 — PART 02 EXIT GATE

You have **mastered Part 02** when you can look at:

```jsx
function UserCard({ user }) {
  return (
    <article>
      <h2>{user.name}</h2>
    </article>
  );
}
```

and effortlessly identify:
1. `UserCard` $\longrightarrow$ **Function Component**
2. `<UserCard user={user} />` $\longrightarrow$ **Composite React Element**
3. `Fiber` $\longrightarrow$ **React's internal work & identity node**
4. `<article>` $\longrightarrow$ **Host React Element**
5. `<article>` in HTML document $\longrightarrow$ **`HTMLArticleElement` DOM Node**
6. Pixels $\longrightarrow$ **Browser Paint Output**

---

[⬅️ Part 01: React as a Declarative UI System](./01-react-as-a-declarative-ui-system.md) | [📚 KPI 01 Index](./README.md) | [🧪 Lab 02](./examples/02-react-core-entities-inspector-lab.html) | [Part 03: State → Update → Render → Commit ➡️](./03-state-update-render-commit.md)
