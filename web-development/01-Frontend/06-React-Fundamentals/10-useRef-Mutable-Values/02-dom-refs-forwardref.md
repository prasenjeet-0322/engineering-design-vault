# Level 06 — React Fundamentals
## KPI 10 — `useRef` & Mutable Values (DOM Refs, Imperative Handles, Instance Values & Measurement)
### PART 02 — DOM Refs, Host Instances & Imperative Browser Access

[⬅️ Previous Part (01: useRef Mental Model)](01-useref-mental-model.md) | [📚 KPI 10 Index](./README.md) | [🧪 Companion Lab](examples/02-dom-refs-host-instances.html) | [Next Part (03: Callback Refs & Dynamic Ref Attachment) ➡️](03-callback-refs.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

# Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

## 1. The Core Mental Model

A DOM ref is React's mechanism for giving your component access to a **committed host instance**.

```text
React Component
      │
      │ render
      ▼
React Element
      │
      ▼
Fiber
      │
      │ reconciliation + commit
      ▼
Host Fiber
      │
      ▼
Actual DOM Node
      │
      │ ref attachment
      ▼
ref.current ───────────────► DOM Node
```

The critical distinction:

```text
render phase
    │
    ├── describes what should exist
    │
    └── MUST NOT depend on DOM mutation

commit phase
    │
    ├── DOM mutations happen
    ├── refs are attached/detached
    └── browser-facing imperative work becomes possible

post-commit code
    │
    └── can safely interact with committed DOM
```

### Golden Rule

> **A DOM ref is a capability to imperatively interact with a committed host instance; it is not a mechanism for describing UI state.**

---

## 2. What `ref.current` Actually Represents

For:

```jsx
function SearchBox() {
  const inputRef = useRef(null);

  return <input ref={inputRef} />;
}
```

the lifecycle is conceptually:

```text
initial render
────────────────────────────────

inputRef
┌──────────────────────┐
│ current: null        │
└──────────────────────┘

React creates work
        │
        ▼
reconciliation
        │
        ▼
commit
        │
        ▼
<input> DOM node created
        │
        ▼
ref attachment
        │
        ▼
inputRef.current = HTMLInputElement
```

After commit:

```text
inputRef.current
       │
       ▼
HTMLInputElement
```

When the DOM node is detached:

```text
inputRef.current = null
```

The important point is that **the ref follows the lifecycle of the React-host relationship**.

---

## 3. Ref vs State

| Question | `useState` | `useRef` |
| :--- | :--- | :--- |
| Stores a value across renders? | Yes | Yes |
| Changing it schedules render? | Yes | No |
| Intended for UI-visible state? | Yes | Usually no |
| Mutable directly? | No | Yes |
| Stable ref object? | Hook-managed state | Hook-managed ref object |
| Useful for DOM node? | No | Yes |
| Useful for timer/observer handle? | Usually no | Yes |
| React automatically observes `.current` changes? | N/A | No |

The decisive question is:

> **Should changing this value cause React to calculate a new UI?**

If yes:

```jsx
useState(...)
```

If no, and the value must survive renders:

```jsx
useRef(...)
```

---

# Layer 2 — 🔬 Deep Mechanical Breakdown

## 4. DOM Refs Are About Host Instances

React applications contain multiple conceptual layers:

```text
Component
   ↓
React Element
   ↓
Fiber
   ↓
Host Fiber
   ↓
DOM Host Instance
```

For example:

```jsx
function Button() {
  return <button>Save</button>;
}
```

The component itself is not the DOM node.

There is a conceptual relationship:

```text
Button function
     │
     ▼
Function Component Fiber
     │
     ▼
<button> element description
     │
     ▼
Host Fiber
     │
     ▼
HTMLButtonElement
```

A DOM ref ultimately points to the **host instance**:

```js
buttonRef.current
```

which may be an:

```text
HTMLButtonElement
```

rather than:

```text
Button component function
```

That distinction becomes extremely important when reasoning about component refs and imperative handles later in this KPI.

---

## 5. The Ref Object Is Persistent

Consider:

```jsx
function Example() {
  const ref = useRef(null);

  console.log(ref);

  return <div ref={ref} />;
}
```

React conceptually maintains a stable hook object.

```text
Fiber
 │
 └── memoizedState
       │
       ▼
    Hook node
       │
       ▼
    ref object
       │
       └── current → DOM node
```

The exact internal implementation is not an API contract, but the useful mental model is:

```text
component identity
       │
       ▼
Fiber-associated hook memory
       │
       ▼
stable ref object
       │
       ▼
mutable current field
```

This is why:

```js
const ref = useRef(null);
```

does not create a brand-new logical ref object on every render.

The component receives the same ref object for its continuing identity.

---

## 6. Render #1 — Before the DOM Exists

Consider:

```jsx
function Login() {
  const inputRef = useRef(null);

  console.log("render", inputRef.current);

  return (
    <input
      ref={inputRef}
      placeholder="Email"
    />
  );
}
```

During the initial render:

```text
Render #1

inputRef.current
        │
        ▼
      null
```

Why?

Because the DOM node has not yet been committed.

The render phase is describing:

```text
"I want an input host node with this ref relationship."
```

It is not yet saying:

```text
"Here is the actual committed HTMLInputElement."
```

---

## 7. Commit Attaches the Ref

After React finishes the relevant work:

```text
Render
  ↓
Reconciliation
  ↓
Commit
  ↓
DOM node exists
  ↓
Ref attachment
```

Now:

```js
inputRef.current
```

can reference the actual DOM element.

Conceptually:

```text
inputRef
┌────────────────────────────┐
│ current                    │
│    │                       │
│    └────► <input DOM node> │
└────────────────────────────┘
```

This is why imperative DOM operations normally belong in:

* event handlers
* effects
* callback refs
* other post-commit mechanisms

rather than ordinary render logic.

---

## 8. Why Render-Time DOM Mutation Is the Wrong Model

Bad:

```jsx
function SearchBox() {
  const inputRef = useRef(null);

  if (inputRef.current) {
    inputRef.current.focus();
  }

  return <input ref={inputRef} />;
}
```

The problem is not simply stylistic.

The render phase is supposed to calculate UI.

```text
render
  =
pure-ish calculation of next UI description
```

while:

```text
focus()
scrollIntoView()
play()
pause()
focus management
DOM mutation
```

are imperative operations against an external host environment.

Therefore:

```text
Render
   │
   ├── calculate
   └── describe

Commit
   │
   ├── mutate host tree
   └── attach refs

Imperative interaction
   │
   └── operate on committed host instance
```

---

## 9. Correct Event-Driven DOM Access

If the user clicks a button:

```jsx
function SearchBox() {
  const inputRef = useRef(null);

  function handleFocus() {
    inputRef.current?.focus();
  }

  return (
    <>
      <input ref={inputRef} />
      <button onClick={handleFocus}>
        Focus
      </button>
    </>
  );
}
```

The sequence is:

```text
Initial render
      ↓
Commit
      ↓
inputRef.current = input DOM node
      ↓
User clicks button
      ↓
handleFocus()
      ↓
inputRef.current.focus()
      ↓
browser updates focus
```

Notice what is absent:

```text
setState
```

Focusing the element does not necessarily represent React application state.

It is an imperative browser operation.

---

## 10. DOM Ref ≠ DOM State

This distinction is foundational.

Suppose:

```jsx
inputRef.current.focus();
```

Focus is now represented by browser state.

React does not automatically receive:

```text
"the ref changed"
```

because:

```text
ref.current
```

did not necessarily change.

The DOM's internal state and React's state model are different systems.

```text
React state
    │
    ▼
React rendering model

DOM state
    │
    ▼
Browser rendering/interaction model

ref
    │
    ▼
Bridge/capability for imperative access
```

---

## 11. Example: Selection

```jsx
function Editor() {
  const inputRef = useRef(null);

  function selectEverything() {
    inputRef.current?.select();
  }

  return (
    <>
      <input ref={inputRef} defaultValue="Hello React" />
      <button onClick={selectEverything}>
        Select
      </button>
    </>
  );
}
```

The ref gives the application a capability:

```text
React component
       │
       ▼
inputRef
       │
       ▼
HTMLInputElement
       │
       ├── focus()
       ├── select()
       ├── setSelectionRange()
       └── other browser APIs
```

The ref itself does not implement those operations.

It gives access to the object that does.

---

## 12. Conditional Rendering Changes Ref Availability

Consider:

```jsx
function Panel({ open }) {
  const panelRef = useRef(null);

  return open ? (
    <section ref={panelRef}>
      Content
    </section>
  ) : null;
}
```

When:

```text
open = false
```

there is no corresponding host node.

Therefore:

```js
panelRef.current === null
```

When:

```text
open = true
```

React creates/commits the host node and attaches the ref.

```text
open false
    ↓
no section
    ↓
ref.current = null

open true
    ↓
section committed
    ↓
ref.current = HTMLElement
```

This means code must not assume:

```js
panelRef.current
```

is permanently available.

---

## 13. Render-by-Render Prediction

### Render #1

```jsx
function Demo({ visible }) {
  const ref = useRef(null);

  console.log("render", visible, ref.current);

  return visible
    ? <div ref={ref}>Hello</div>
    : null;
}
```

Initial:

```text
visible = false
```

During render:

```text
ref.current = null
```

Committed result:

```text
DOM:
nothing

ref.current:
null
```

---

### Render #2

Parent changes:

```text
visible = true
```

During render:

```text
ref.current
```

is still whatever it represented before this commit:

```text
null
```

React then commits:

```text
<div>
```

and establishes the ref:

```text
ref.current → HTMLDivElement
```

After commit:

```text
ref.current !== null
```

---

### Render #3

Now:

```text
visible = false
```

During the render phase, the previous committed ref may still point at the existing DOM node.

Then React commits the removal and detaches the ref.

Final:

```text
ref.current = null
```

This distinction is extremely important:

> **The ref's value during render describes the previous committed relationship, not a promise about the host tree that the current render will eventually commit.**

Do not build render logic around assumptions that:

```text
"because this render returns <div>, ref.current must already contain that new div."
```

It does not.

---

## 14. Object Refs vs Callback Refs

There are two major ref attachment patterns.

### Object ref

```jsx
const ref = useRef(null);

return <div ref={ref} />;
```

React writes:

```js
ref.current = node;
```

and later:

```js
ref.current = null;
```

### Callback ref

```jsx
return (
  <div
    ref={(node) => {
      console.log(node);
    }}
  />
);
```

React invokes the callback with the host instance and, when detached, with `null`.

Conceptually:

```text
attach
  ↓
callback(node)

detach
  ↓
callback(null)
```

Callback refs are especially useful when you need imperative logic at attachment/detachment boundaries.

---

## 15. Callback Ref Lifecycle

Example:

```jsx
function Example() {
  const setNode = node => {
    console.log("ref callback:", node);
  };

  return <div ref={setNode} />;
}
```

Conceptually:

```text
commit
  ↓
DOM node attached
  ↓
setNode(domNode)
```

On detach:

```text
commit
  ↓
DOM node removed/detached
  ↓
setNode(null)
```

The callback ref therefore behaves more like a lifecycle notification than a passive storage location.

---

## 16. Ref Attachment and Cleanup

Suppose:

```jsx
function Video() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.play();

    return () => {
      video.pause();
    };
  }, []);

  return <video ref={videoRef} />;
}
```

The conceptual sequence is:

```text
render
  ↓
host tree determined
  ↓
commit DOM
  ↓
ref attached
  ↓
effect setup
  ↓
videoRef.current available
  ↓
imperative API used
```

Cleanup later may occur because:

* the component unmounts
* the effect re-synchronizes
* its dependencies change

The resource ownership question is:

> **Which lifecycle owns the browser resource or imperative relationship?**

---

## 17. Refs and Effects Solve Different Problems

Do not confuse:

```text
ref
```

with:

```text
effect
```

A ref answers:

> Where is the imperative object / mutable instance value?

An effect answers:

> When should this component synchronize with an external system?

Example:

```jsx
const videoRef = useRef(null);
```

stores the capability.

Then:

```jsx
useEffect(() => {
  const video = videoRef.current;
  // synchronize with external video state
}, []);
```

performs synchronization.

So:

```text
useRef
   =
stable mutable handle

useEffect
   =
synchronization lifecycle
```

---

## 18. Ref Identity vs DOM Identity

Suppose:

```jsx
const ref = useRef(null);

return <div ref={ref} />;
```

There are at least two identities to reason about:

```text
Ref object identity
        ≠
DOM node identity
```

The ref object can remain stable while the DOM node changes.

Example:

```text
ref object
    │
    ├── Render #1 → DOM node A
    │
    ├── Render #2 → DOM node A
    │
    └── Render #3 → DOM node B
```

The ref object's identity remained stable.

Its `.current` target changed.

This is why:

```js
ref === previousRef
```

and:

```js
ref.current === previousDomNode
```

are completely different questions.

---

## 19. Ref Identity vs Component Identity

There is another distinction:

```text
Component identity
       ≠
Ref object identity
       ≠
DOM node identity
```

But they are related through lifecycle.

If the component instance is preserved:

```text
component identity preserved
        ↓
hook state preserved
        ↓
ref object preserved
```

If the component is remounted:

```text
component identity destroyed
        ↓
old hook memory discarded
        ↓
new ref object created
```

The DOM relationship may also be recreated.

---

## 20. Keys Can Therefore Affect Ref Lifetime

Consider:

```jsx
function Item({ id }) {
  const ref = useRef(null);

  return <input ref={ref} />;
}
```

Now:

```jsx
<Item key="A" id="A" />
```

becomes:

```jsx
<Item key="B" id="B" />
```

If this represents a new React identity:

```text
old Item
   ↓
unmount
   ↓
old ref detached
   ↓
new Item
   ↓
new ref object
   ↓
new DOM node
   ↓
new ref attached
```

This is why keys are not merely list-rendering performance hints.

They can affect:

* state lifetime
* ref lifetime
* effect lifetime
* DOM identity
* focus
* browser state

---

## 21. Ref and Focus Bugs

A common production problem:

```jsx
function Search({ query }) {
  const inputRef = useRef(null);

  return (
    <input
      key={query}
      ref={inputRef}
      value={query}
      onChange={...}
    />
  );
}
```

If the key changes on every meaningful update:

```text
query changes
   ↓
key changes
   ↓
old input unmounts
   ↓
focus lost
   ↓
new input created
   ↓
ref points to new node
```

A developer might incorrectly diagnose this as:

```text
"React ref is broken."
```

The actual problem is:

```text
identity architecture
```

The ref is faithfully following the host instance lifecycle.

---

## 22. DOM Ref Does Not Mean "React Will Keep This Node Forever"

This is another frequent misconception.

```jsx
<div ref={ref} />
```

does not mean:

```text
"React promises this DOM node will never change."
```

It means:

```text
"When this host instance is the committed instance for this ref relationship,
make it accessible through ref.current."
```

If reconciliation replaces or removes that host instance:

```text
ref.current
```

changes accordingly.

---

## 23. Ref Access Must Respect Ownership

Suppose a parent obtains:

```jsx
childRef.current
```

and starts modifying arbitrary child DOM:

```js
childRef.current.querySelector(".internal-row").remove();
```

This creates a dangerous ownership conflict.

React believes:

```text
"I own the DOM tree."
```

while the parent says:

```text
"I manually removed part of it."
```

Now:

```text
React virtual model
        ≠
actual DOM
```

The next React commit may attempt to operate on a structure that was manually altered.

This is why imperative access should generally be:

```text
narrow
controlled
capability-based
ownership-aware
```

rather than:

```text
"Here is the entire DOM. Do whatever you want."
```

---

## 24. Safe Imperative Operations

### Generally Appropriate:

```js
input.focus();
```

```js
element.scrollIntoView();
```

```js
video.play();
```

```js
video.pause();
```

```js
element.getBoundingClientRect();
```

```js
input.setSelectionRange(start, end);
```

These are examples of interacting with browser APIs where React's declarative model does not directly express the imperative action.

### Highly Dangerous:

```js
element.innerHTML = "...";
```

```js
element.removeChild(...);
```

```js
element.replaceChildren(...);
```

```js
element.className = "completely-unrelated-tree";
```

The issue is not that all direct DOM writes are forbidden.

The issue is:

> **Who owns the resulting DOM state?**

---

## 25. React-Owned vs Library-Owned DOM

A strong architectural boundary is:

```text
React-owned region
────────────────────────

React
  ↓
DOM

Do not manually restructure it.
```

versus:

```text
Imperative island
────────────────────────

React
  ↓
container
  ↓
Third-party library
  ↓
library-owned subtree
```

Example:

```jsx
function Chart() {
  const containerRef = useRef(null);

  useEffect(() => {
    const chart = createChart(containerRef.current);

    return () => {
      chart.destroy();
    };
  }, []);

  return <div ref={containerRef} />;
}
```

Here React owns:

```html
<div>
```

while the chart library may own what happens inside that container.

This is a much safer boundary than letting the library mutate arbitrary React-owned descendants.

---

## 26. Measurement Through DOM Refs

Refs are commonly used for measurement:

```jsx
function Card() {
  const cardRef = useRef(null);

  useLayoutEffect(() => {
    const rect = cardRef.current?.getBoundingClientRect();

    console.log(rect);
  }, []);

  return <article ref={cardRef}>...</article>;
}
```

The conceptual pipeline:

```text
render
  ↓
commit
  ↓
DOM exists
  ↓
ref attached
  ↓
layout-sensitive synchronization
  ↓
measure
```

This is different from:

```jsx
function Card() {
  const ref = useRef(null);

  const width = ref.current?.getBoundingClientRect().width;

  return <div style={{ width }} />;
}
```

The latter tries to make render depend on a mutable imperative measurement.

That creates a temporal mismatch:

```text
render is calculating
while
the measurement belongs to a committed DOM state
```

---

## 27. Ref Measurement Is a Temporal Problem

DOM measurements have meaning at a specific point in browser/React lifecycle.

Consider:

```js
const rect = node.getBoundingClientRect();
```

The result depends on:

* current DOM structure
* styles
* layout state
* viewport
* scroll position
* fonts
* content
* browser layout

Therefore:

```text
measurement
```

is not merely data stored in a ref.

It is an observation of an external system at a particular time.

---

## 28. Why `useRef` Is Useful for Mutable Instance Values

Not every persistent value is UI state.

Example:

```jsx
function Poller() {
  const intervalIdRef = useRef(null);

  // ...
}
```

The interval ID must survive renders.

But changing:

```js
intervalIdRef.current
```

should not itself cause UI rendering.

Therefore:

```text
timer handle
   ↓
ref
```

is appropriate.

Likewise:

```text
DOM node
observer instance
AbortController
animation frame ID
third-party instance
latest callback
request identity
previous measurement
```

may be ref candidates.

---

## 29. Ref Mutation Does Not Trigger Rendering

This:

```js
ref.current = 42;
```

does not mean:

```text
React:
"Ah, UI changed. Render again."
```

React is not subscribed to the property.

The ref object is mutable JavaScript memory.

Therefore:

```jsx
function Example() {
  const valueRef = useRef(0);

  function increment() {
    valueRef.current += 1;
  }

  return <button onClick={increment}>Increment</button>;
}
```

The number changes internally.

But the UI does not automatically display the new value.

If the UI renders:

```jsx
<div>{valueRef.current}</div>
```

then it will continue displaying the last rendered value until something else causes a render.

This is a classic senior-level trap.

---

## 30. Prediction Challenge — Ref Mutation

Given:

```jsx
function Counter() {
  const countRef = useRef(0);
  const [renderCount, setRenderCount] = useState(0);

  function incrementRef() {
    countRef.current += 1;
  }

  function forceRender() {
    setRenderCount(x => x + 1);
  }

  return (
    <>
      <p>Ref: {countRef.current}</p>
      <p>Renders: {renderCount}</p>

      <button onClick={incrementRef}>
        Ref++
      </button>

      <button onClick={forceRender}>
        Render
      </button>
    </>
  );
}
```

Initial:

```text
countRef.current = 0
renderCount = 0
```

Click:

```text
Ref++
```

Result:

```text
countRef.current = 1
renderCount = 0
```

No React render is scheduled merely because:

```js
countRef.current += 1;
```

Click:

```text
Render
```

Now React renders:

```text
Ref: 1
Renders: 1
```

The value was always in the ref.

The UI simply did not recalculate until a render occurred.

---

## 31. The Stale Closure + Ref Pattern

Consider:

```jsx
function Example({ value }) {
  const latestValue = useRef(value);

  useEffect(() => {
    latestValue.current = value;
  }, [value]);

  function handleSomething() {
    console.log(latestValue.current);
  }

  // ...
}
```

The ref can serve as mutable instance memory.

This creates:

```text
render snapshot
       │
       ▼
value

mutable latest-value cell
       │
       ▼
latestValue.current
```

But there is an important timing distinction.

During render:

```js
latestValue.current
```

may still contain the previous committed value if the ref is synchronized in an effect.

So:

```text
render value = B
latestValue.current = A
```

can temporarily be true during the render/commit transition.

This is why ref-based "latest value" patterns require precise lifecycle reasoning.

---

## 32. A Ref Is Not Automatically "The Latest Value"

Bad mental model:

```text
useRef(value)
```

means:

```text
ref.current always equals value
```

It does not.

This:

```jsx
const ref = useRef(value);
```

initializes the ref's initial value.

Later prop changes do not automatically execute:

```js
ref.current = newValue;
```

If you need synchronization:

```jsx
ref.current = value;
```

or another appropriate synchronization mechanism must explicitly establish that relationship.

---

## 33. `useRef(initialValue)` Is Initialization, Not Synchronization

This:

```jsx
function Component({ id }) {
  const ref = useRef(id);
}
```

does not mean:

```text
every render:
ref.current = id
```

Instead:

```text
mount
  ↓
initial ref.current = id

later renders
  ↓
same ref object
  ↓
current persists
```

Therefore:

```jsx
function Component({ id }) {
  const ref = useRef(id);

  console.log(id);
  console.log(ref.current);
}
```

can produce:

```text
Render #1
id = A
ref.current = A

Render #2
id = B
ref.current = A
```

unless something explicitly changes the ref.

---

## 34. DOM Ref Availability Is Commit-Dependent

This is perhaps the most important mechanical statement in this Part:

> **A DOM ref is attached as part of establishing the committed host relationship; it is not populated merely because JSX contains a `ref` prop.**

Therefore:

```jsx
return <input ref={inputRef} />;
```

does not imply:

```text
inputRef.current
```

is populated during the calculation of that JSX.

The host node must become part of the committed tree.

---

# Layer 3 — 🧪 Diagnostic Labs & DevTools Profiling

## Lab 1 — Render vs Commit Ref Visibility

Use:

```jsx
function Probe() {
  const ref = useRef(null);

  console.log("render", ref.current);

  useLayoutEffect(() => {
    console.log("layout effect", ref.current);
  });

  useEffect(() => {
    console.log("passive effect", ref.current);
  });

  return <div ref={ref}>Probe</div>;
}
```

Observe:

```text
render
    ↓
layout effect
    ↓
passive effect
```

The key diagnostic question:

```text
When is ref.current actually pointing at the committed host node?
```

The important lifecycle boundary is:

```text
render
  ↓
commit / ref attachment
  ↓
layout-effect opportunity
  ↓
passive effect
```

---

## Lab 2 — Chrome Elements Inspection

1. Open Chrome DevTools.
2. Go to **Elements**.
3. Locate the element receiving the ref.
4. Inspect the node.
5. Trigger the interaction that reads the ref.
6. Compare the DOM node's identity before and after conditional rendering.

Useful console probe:

```js
document.querySelector("input")
```

Then compare it with the object you expect from:

```js
inputRef.current
```

The purpose is to understand:

```text
React ref
   ↓
actual host object
```

rather than treating refs as abstract React-only values.

---

## Lab 3 — DOM Identity Marker

Use:

```jsx
function Input() {
  const ref = useRef(null);

  useEffect(() => {
    console.log("mounted DOM node", ref.current);

    return () => {
      console.log("cleanup DOM node", ref.current);
    };
  }, []);

  return <input ref={ref} />;
}
```

Then intentionally change its key:

```jsx
<Input key={version} />
```

Observe:

```text
same key
   ↓
identity preserved

different key
   ↓
remount
   ↓
new DOM instance
```

---

## Lab 4 — Render Counter vs Ref Mutation

```jsx
function Probe() {
  const renders = useRef(0);
  const [tick, setTick] = useState(0);

  renders.current += 1;

  return (
    <>
      <p>Render count: {renders.current}</p>
      <p>Tick: {tick}</p>

      <button onClick={() => setTick(t => t + 1)}>
        Render
      </button>
    </>
  );
}
```

This is useful for demonstrating that a ref can remember a mutable value across renders.

However, remember:

```text
render counter in a ref
```

is diagnostic instrumentation.

It is not a production architecture for determining application state.

---

## Lab 5 — React DevTools Profiler

Open:

```text
React DevTools
→ Profiler
→ Start profiling
```

Perform:

1. initial mount
2. state update
3. conditional hide
4. conditional show
5. key change

Observe:

```text
render
vs
mount/remount
```

Ask:

* Did the component render?
* Did it remount?
* Did its DOM node survive?
* Did its ref target survive?
* Did its effect clean up?
* Did focus survive?

This turns ref behavior into an observable lifecycle rather than an intuition.

---

## Lab 6 — Identity Logging

Use:

```jsx
function Probe({ id }) {
  const ref = useRef(null);

  useEffect(() => {
    console.log("DOM attached", ref.current);

    return () => {
      console.log("DOM detached", ref.current);
    };
  }, []);

  return (
    <div ref={ref}>
      {id}
    </div>
  );
}
```

Then render:

```jsx
<Probe key={someKey} id={someId} />
```

Track separately:

```text
component identity
DOM identity
ref object identity
prop identity
```

Do not collapse all four into one concept.

---

# Layer 4 — 🔥 The Crucible

## Challenge 1 — What Is in the Ref?

```jsx
function App() {
  const ref = useRef(null);

  console.log(ref.current);

  return <button ref={ref}>Save</button>;
}
```

**Question:** During the render that produces the button, should you expect `HTMLButtonElement` or `null`?

### Answer

For the initial render, the ref has not yet been attached to the newly committed button.

The host instance becomes available through the ref as part of commit.

---

## Challenge 2 — Ref Mutation

```jsx
const ref = useRef(0);

ref.current += 1;
```

**Question:** Does React automatically rerender?

### Answer

No.

A ref mutation is ordinary mutable memory from React's rendering perspective.

---

## Challenge 3 — Key Change

```jsx
<input key={userId} ref={inputRef} />
```

`userId` changes from `A → B`. What should you investigate?

### Answer

Potential identity replacement:

```text
old input
 ↓
detach
 ↓
new input
 ↓
attach
```

Consequences may include:

* new DOM node
* new component identity
* new ref target
* focus loss
* state reset if component identity changes

---

## Challenge 4 — Conditional Rendering

```jsx
return visible
  ? <div ref={ref} />
  : null;
```

**Question:** What should `ref.current` represent when the branch is no longer committed?

### Answer

`null`.

The ref relationship is detached when the host instance is removed from the committed tree.

---

## Challenge 5 — Ref vs State

You need to store the current `WebSocket` instance, and the socket instance changing should not itself produce UI.

Would you initially consider `useState()` or `useRef()`?

### Answer

`useRef()` is the natural candidate for the imperative resource handle.

The UI state representing:

```text
connecting
connected
failed
```

would be modeled separately via React state.

---

## Challenge 6 — Ownership Violation

A component receives a DOM ref and executes:

```js
node.innerHTML = "";
```

**Question:** What is the architectural concern?

### Answer

Potential conflict between:

```text
React's declarative ownership
```

and:

```text
imperative external mutation
```

The key question is whether that DOM subtree has explicitly been delegated to an imperative library or if React still attempts to reconcile its children.

---

# Production Post-Mortem — "The Ref Is Always Null"

## Symptom

A developer writes:

```jsx
function Modal() {
  const dialogRef = useRef(null);

  console.log(dialogRef.current);

  return <dialog ref={dialogRef}>...</dialog>;
}
```

They report:

```text
"It is always null."
```

## Investigation

Possible causes:

```text
1. Reading during render
2. Conditional branch not mounted
3. Ref attached elsewhere
4. Wrong component identity
5. Ref overwritten
6. Component has not committed
7. Imperative access occurs before required lifecycle point
```

The first diagnostic question should be:

> **At what lifecycle point is the ref being read?**

Not:

> "Is React broken?"

---

# Production Post-Mortem — "Input Loses Focus"

## Symptom

A search input loses focus after every update.

```jsx
<input
  key={query}
  ref={inputRef}
  value={query}
/>
```

## Root Cause

The key is coupled to mutable input value.

```text
query changes
    ↓
key changes
    ↓
identity changes
    ↓
input remounts
    ↓
new DOM node
    ↓
focus lost
```

## Correct Architecture

The key should represent logical identity, not the current editable value.

---

# Production Post-Mortem — "We Mutated the DOM and React Undid It"

Imperative code:

```js
ref.current.textContent = "Saved";
```

Later:

```text
React render
   ↓
commit
   ↓
React restores its declarative output
```

The developer concludes:

```text
"React randomly changed my DOM."
```

The real problem:

```text
two systems believe they own the same output
```

Correct solution:

```text
If React owns the content:
    represent it through React state/props.

If a third-party library owns the subtree:
    establish an explicit imperative island.
```

---

# Senior Decision Matrix

| Situation | Ref? | State? | Effect? | Rationale |
| :--- | :---: | :---: | :---: | :--- |
| **DOM element handle** | ✅ | ❌ | Sometimes | Handle needed for imperative access; layout effects for synchronous measurements. |
| **Focus input** | ✅ | ❌ | Event/Effect | Direct browser command. State does not express active browser focus. |
| **Timer ID (`setTimeout`)** | ✅ | ❌ | Paired | Handle survives renders silently without causing UI updates on creation. |
| **Current WebSocket instance** | ✅ | ❌ | Paired | Connection object is an imperative transport handle. |
| **Loading status (`isLoading`)** | ❌ | ✅ | Derived/Sync | Drives spinner visibility; must participate in reconciliation. |
| **Error message** | ❌ | ✅ | Depends | Directly rendered in markup; must trigger UI recalculation. |
| **Derived display value** | ❌ | ❌ | Render Pure | Compute purely during render body from props/state. |
| **DOM measurement** | ✅ | ❌/✅ | Sync | Measure via ref in `useLayoutEffect`, sync to state only if UI branches on it. |
| **Third-party widget instance** | ✅ | ❌ | Effect | Imperative lifecycle boundary (mount/destroy). |
| **User-visible selection** | Usually state | ✅ | Depends | Visual active tabs belong in state. |
| **Animation frame ID (`rAF`)** | ✅ | ❌ | Effect/Event | High-frequency tick handle; zero-render overhead. |
| **UI-visible counter** | ❌ | ✅ | No ref | Value directly displayed to user; requires UI recalculation. |

The central decision rule:

```text
Does this value represent UI state?
        │
       YES
        │
      state

Does this represent mutable imperative
instance/resource information?
        │
       YES
        │
       ref
```

---

# Senior Anti-Pattern Teardown

## Anti-Pattern 1: Ref as Hidden State

```jsx
const selectedIdRef = useRef(null);

function select(id) {
  selectedIdRef.current = id;
}
```

Then:

```jsx
return <p>{selectedIdRef.current}</p>;
```

### Why developers do it

They want:

```text
"state without rerendering."
```

### Mechanical failure

The application now has a value that changes without notifying React's rendering engine. The rendered UI becomes stale and decoupled from heap state.

### Senior refactoring

If the value determines UI:

```jsx
const [selectedId, setSelectedId] = useState(null);
```

Use refs only when the value's mutation is intentionally outside the render-triggering state model.

---

## Anti-Pattern 2: Ref as Synchronization Shortcut

```jsx
const valueRef = useRef(value);
```

Developer assumes:

```text
value changes
   ↓
ref automatically updates
```

It does not.

`useRef(initialValue)` is initialization. Synchronization must be explicitly modeled via effects or intentional assignments.

---

## Anti-Pattern 3: Ref as DOM Ownership Override

```js
ref.current.innerHTML = html;
```

while React also renders children inside that node.

This establishes competing ownership and causes hydration/reconciliation crashes.

Better:

```text
React owns subtree
```

or:

```text
third-party library owns subtree (Imperative Island)
```

with a clearly defined boundary.

---

## Anti-Pattern 4: Reading Ref as Render Truth

```jsx
const width = ref.current?.offsetWidth;

return <div>{width}px</div>;
```

The problem:

```text
DOM measurement
```

is being treated as though it were ordinary deterministic render input.

Measurement is tied to a committed browser state. If the UI depends on it, the architecture needs an explicit measurement → state/synchronization pipeline inside `useLayoutEffect`.

---

# Senior Interview Q&A

### Q1. Why doesn't changing `ref.current` trigger a render?
> **Answer:** Because React does not treat the `current` property as a state update mechanism. React's scheduler is subscribed to state dispatchers (`useState`/`useReducer`), not JavaScript object property mutations. `useRef` returns a plain JavaScript object container.

### Q2. When is a DOM ref attached?
> **Answer:** As part of the **Host Commit Phase**, when React establishes the committed host relationship and mounts the native DOM node to the document tree. During the initial render phase, `ref.current` is `null`.

### Q3. What happens to a DOM ref when the node is removed?
> **Answer:** The ref is detached; for an object ref, React sets `.current` to `null`. For callback refs, React invokes `callback(null)`.

### Q4. Is a ref object the same thing as the DOM node?
> **Answer:** No.
> ```text
> ref object ({ current: DOMNode }) ≠ DOM node (HTMLInputElement)
> ```
> The ref object is a stable heap container maintained in the Fiber's hook list; its `.current` property points to the host node.

### Q5. Can a ref survive while its DOM target changes?
> **Answer:** Yes. The ref object memory reference remains identical across the entire lifetime of the component Fiber, even as its `.current` field transitions between `null` and different DOM node instances.

### Q6. Why are keys relevant to refs?
> **Answer:** Keys determine Fiber identity in reconciliation. Changing a key forces React to unmount the old Fiber (detaching the old ref and destroying its DOM node) and mount a brand-new Fiber with fresh hook memory and a new DOM instance.

### Q7. Should refs be used for application state?
> **Answer:** No. Refs should only hold mutable instance values that do not determine the rendered UI output. If the UI must visually react to a value changing, it must be stored in React state.

### Q8. Can refs be used with third-party libraries?
> **Answer:** Yes. DOM refs provide the root host container for "Imperative Islands" (e.g., Chart.js, D3, Monaco Editor, Leaflet), allowing external libraries to mount and manage subtrees without React interfering.

### Q9. Does a ref guarantee ownership of the entire DOM subtree?
> **Answer:** No. A ref provides direct host access, but ownership must be architecturally partitioned. Mutating nodes that React is actively managing leads to reconciliation crashes.

### Q10. Is `useRef(value)` synchronization?
> **Answer:** No. `useRef(initialValue)` only reads `initialValue` on the initial mount. Subsequent renders ignore the argument entirely.

---

# Completion Checklist

You should be able to explain all of the following without notes:

* [ ] A DOM ref points to a committed host instance.
* [ ] `useRef` produces persistent mutable memory.
* [ ] `.current` mutation does not schedule rendering.
* [ ] Ref object identity differs from DOM node identity.
* [ ] Component identity differs from DOM identity.
* [ ] Initial render occurs before the newly described DOM node is committed.
* [ ] Ref attachment belongs to the commit lifecycle.
* [ ] Removed host nodes cause object refs to become `null`.
* [ ] Conditional rendering can make refs temporarily unavailable.
* [ ] Callback refs receive attachment/detachment notifications.
* [ ] `useRef(initialValue)` is initialization, not synchronization.
* [ ] Keys can change ref/DOM lifetime through identity changes.
* [ ] Remounting can replace the DOM node referenced by a ref.
* [ ] Focus loss can be caused by identity replacement.
* [ ] Ref mutation is not UI state.
* [ ] DOM measurement is temporally tied to committed browser state.
* [ ] Imperative DOM access should respect ownership boundaries.
* [ ] React-owned DOM should not casually be mutated by external code.
* [ ] Third-party libraries can be isolated behind imperative islands.
* [ ] Resource handles commonly belong in refs.
* [ ] UI-visible resource status belongs in reactive state.
* [ ] Effects and refs solve different architectural problems.
* [ ] A ref is a capability, not a synchronization engine.
* [ ] `ref.current` should not automatically be treated as render-time truth.
* [ ] Ref lifetime must be reasoned about alongside component identity.
* [ ] Ref lifetime must be reasoned about alongside DOM lifetime.
* [ ] Ref access should be guarded when the host instance may not exist.
* [ ] Imperative APIs should be narrow and intentional.
* [ ] DOM ownership conflicts are architectural bugs, not merely coding-style issues.

---

# Companion Lab Contract

The companion interactive lab for this Part should visualize:

```text
Component Identity
       │
       ▼
Fiber Hook Memory
       │
       ▼
Ref Object
       │
       ▼
.current
       │
       ▼
Host DOM Instance
```

It provides interactive controls for:

1. Mount component
2. Unmount component
3. Toggle conditional DOM
4. Change key
5. Mutate `.current`
6. Force React render
7. Focus element
8. Measure element
9. Compare ref identity
10. Compare DOM identity
11. Display render count
12. Display mount/unmount count
13. Show ref attachment state
14. Show previous vs current host instance
15. Simulate imperative ownership conflict

The lab explicitly distinguishes:

```text
RENDER ──► COMMIT ──► REF ATTACH ──► REF DETACH ──► DOM IDENTITY ──► COMPONENT IDENTITY
```

rather than presenting them as one event.

---

# Final Mental Model

Keep this model:

```text
                    REACT
                      │
               component identity
                      │
                      ▼
                    Fiber
                      │
                 hook memory
                      │
                      ▼
                  ref object
                      │
                mutable .current
                      │
                      ▼
              committed host node
                      │
                      ▼
                   BROWSER
```

And remember:

```text
useState
    =
reactive UI state

useRef
    =
persistent mutable instance memory

DOM ref
    =
imperative capability to a committed host instance

Effect
    =
synchronization with an external system

Key
    =
identity selection
```

The senior-level mental model is therefore:

> **A ref does not make React imperative. It provides a narrowly scoped escape hatch through which imperative code can interact with resources that exist outside React's declarative rendering calculation.**

---

[⬅️ Previous Part (01: useRef Mental Model)](01-useref-mental-model.md) | [📚 KPI 10 Index](./README.md) | [🧪 Companion Lab](examples/02-dom-refs-host-instances.html) | [Next Part (03: Callback Refs & Dynamic Ref Attachment) ➡️](03-callback-refs.md)
