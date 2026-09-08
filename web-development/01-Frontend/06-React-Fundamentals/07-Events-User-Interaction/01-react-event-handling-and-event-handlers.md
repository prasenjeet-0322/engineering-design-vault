Level 06 — React Fundamentals
KPI 05 — Events & User Interaction
PART 01 — React Event Handling & Event Handlers
[⬅️ Previous Part](../04-Props-One-Way-Data-Flow/16-state-and-state-updates-final-review.md) | [📚 Level 06 Index](./README.md) | [🧪 Companion Lab](./examples/01-react-event-handling-and-event-handlers.html) | [Next Part ➡️](./02-event-objects-and-event-semantics.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

## PART PURPOSE

React is fundamentally a system for describing UI and updating that UI as application state changes.
But a UI does not change by itself.
* Users click buttons.
* Users type.
* Users submit forms.
* Users select options.
* Users press keys.
* Users interact with controls.

Those interactions are represented as events, and React gives components a programming model for responding to those events through event handlers.

The fundamental relationship is:
```text
User Interaction
       │
       ▼
Browser Event
       │
       ▼
React Event Handling
       │
       ▼
Event Handler
       ├──────────────► callback / application action
       └──────────────► state update
              │
              ▼
            Render
              │
              ▼
            Commit
              │
              ▼
          Updated UI
```

The senior-level goal is not merely:  
*“I know how to write `onClick`.”*  
It is:  
*“I understand where an interaction belongs in React's programming model, how the handler relates to the render that created it, how data flows into and out of the handler, and when an interaction should update state versus synchronize with an external system.”*

This Part establishes that foundation.

---

## LAYER 1 — ⚡ 30-SECOND EXECUTIVE CHEAT SHEET & CORE MENTAL MODELS

### 1. The Core Mental Model
A React event handler is a function associated with an interactive element so that a user interaction can cause application behavior.

```javascript
function Counter() {
  const [count, setCount] = useState(0);

  function handleIncrement() {
    setCount(count + 1);
  }

  return (
    <button onClick={handleIncrement}>
      Count: {count}
    </button>
  );
}
```

The critical distinction is:
$$\mathbf{onClick=\{handleIncrement\}} \quad\text{versus}\quad \mathbf{onClick=\{handleIncrement()\}}$$

* The first gives React a function to invoke when the click occurs.
* The second invokes the function while rendering.

Therefore:
```text
onClick={handleIncrement}
    └── register/provide handler reference

onClick={handleIncrement()}
    └── execute immediately during render
```

This distinction is foundational.

---

### 2. Event Handling Is Not Rendering
* **React rendering answers:** *“What should the UI look like for this render?”*
* **An event handler answers:** *“What should happen when this interaction occurs?”*

Conceptually:
```text
RENDERING
state/props
    │
    ▼
   JSX
    │
    ▼
UI description

INTERACTION
user action
    │
    ▼
  event
    │
    ▼
 handler
    │
    ▼
application update
    │
    ▼
next render
```

Do not collapse these into one operation.

---

### 3. Handler $\neq$ Event
A handler is a function. An event is information describing an interaction.

```javascript
function handleClick(event) {
  console.log(event);
}
```
Here:
* `handleClick` $\rightarrow$ function
* `event` $\rightarrow$ event data

The handler receives the event when React invokes it. (Detailed event-object semantics are covered in Part 02.)

---

### 4. Event Handlers Are Interaction Boundaries
A useful architectural model is:

```text
Component
    │
┌───┴─────────┐
│             │
View     Interaction
│             │
JSX        Handler
              │
      ┌───────┴────────┐
      │                │
state update       callback
      │                │
      ▼                ▼
    render       parent/application
```

A handler is therefore more than syntax. It is an interaction boundary between the UI and application behavior.

---

### 5. Props Carry Handler Capabilities
A parent can give a child a function:

```javascript
function Parent() {
  function handleDelete() {
    // ...
  }
  return <DeleteButton onDelete={handleDelete} />;
}
```

The child can invoke the capability:
```javascript
function DeleteButton({ onDelete }) {
  return (
    <button onClick={onDelete}>
      Delete
    </button>
  );
}
```

The child does not need to know how deletion is implemented. It only knows:  
*“I have been given an operation I can invoke.”*

This is one of the most important foundations of React component communication.

---

### EXECUTIVE CONCEPT TABLE

| Concept | Core Mechanism | Production Impact | Common Senior Trap |
| :--- | :--- | :--- | :--- |
| **Event** | Representation of an interaction | Supplies interaction data | Confusing event data with application state |
| **Event handler** | Function invoked in response to interaction | Defines UI behavior | Executing the handler during render |
| `onClick={fn}` | Gives React a function | Defers execution until interaction | Treating it as ordinary function invocation |
| `onClick={fn()}` | Executes immediately | Can cause incorrect renders/side effects | Calling instead of passing |
| **Handler prop** | Function passed through component boundary | Enables child $\rightarrow$ parent communication | Creating tightly coupled child components |
| **Inline handler** | Function created in JSX | Convenient for small logic | Assuming every inline handler is automatically a performance problem |
| **Named handler** | Function declared separately | Improves semantic clarity and reuse | Over-abstracting trivial handlers |
| **State update in handler** | Requests next UI state | Connects interaction to rendering | Expecting the state variable to mutate immediately |
| **Closure** | Handler retains lexical environment | Determines which render's values it sees | Assuming a handler reads some globally "current" state |
| **Event boundary** | User action enters application logic | Useful architectural boundary | Moving user-driven actions into effects unnecessarily |
| **Effect** | Synchronization with external systems | Handles external-world synchronization | Using effects for ordinary user-event logic |

---

### GOLDEN RULE
> **Pass event handlers; do not execute them during render. Put user-driven behavior at the event boundary, and let state changes drive subsequent renders.**

---

## LAYER 2 — 🔬 DEEP MECHANICAL BREAKDOWN

### 6. What Problem Does React Event Handling Solve?
Without a component-oriented interaction model, UI code can become a collection of imperative DOM operations:
```javascript
button.addEventListener("click", ...);
modal.style.display = "block";
label.textContent = "...";
input.value = "...";
```

The application becomes responsible for manually coordinating:
$$\text{DOM node} + \text{event listener} + \text{mutable DOM state} + \text{application state} + \text{synchronization}$$

React instead encourages:
```text
Application State
       │
       ▼
     Render
       │
       ▼
       UI
       ▲
       │ Event Handler
       ▲
       │
User Interaction
```

The handler generally changes application state or invokes application behavior, rather than manually orchestrating the rendered DOM.

---

### 7. React's Event Programming Model
Consider:
```javascript
function Toggle() {
  const [open, setOpen] = useState(false);

  function handleToggle() {
    setOpen(!open);
  }

  return (
    <button onClick={handleToggle}>
      {open ? "Close" : "Open"}
    </button>
  );
}
```

The conceptual lifecycle is:
```text
Initial state open = false
       │
       ▼
   Render #1
       │
       ▼
<button>Open</button>
       │
       ▼
  User clicks
       │
       ▼
React invokes handler
       │
       ▼
  setOpen(true)
       │
       ▼
React schedules state update
       │
       ▼
   Render #2
       │
       ▼
<button>Close</button>
```

The handler does not directly rewrite `<button>Open</button>`. Instead it changes state. The next render describes `<button>Close</button>`. This distinction is fundamental.

---

### 8. `onClick={handleClick}` — What It Means
Consider:
```javascript
function handleClick() {
  console.log("clicked");
}
return <button onClick={handleClick}>Save</button>;
```

Conceptually:
```text
Render
  │
  ▼
Create React element description
  │
  ▼
Associate onClick with handler function
  │
  ▼
Commit UI
  │
  ▼
User clicks
  │
  ▼
React invokes handler
```

The function is not supposed to execute while JSX is being evaluated.

---

### 9. Why `onClick={handleClick()}` Is Different
Consider:
```javascript
return (
  <button onClick={handleClick()}>
    Save
  </button>
);
```

JavaScript evaluates `handleClick()` **during rendering**. Therefore the conceptual sequence becomes:
```text
Render
  │
  ▼
Evaluate JSX
  │
  ▼
Evaluate handleClick()
  │
  ▼
Function executes NOW
  │
  ▼
Returned value becomes onClick
```

This is not an event-handler registration pattern; it is a function invocation occurring during render.

---

### 10. Prediction Challenge — Handler Reference vs Invocation

**Case 1:**
```javascript
function Button() {
  function handleClick() {
    console.log("clicked");
  }
  return <button onClick={handleClick}>Save</button>;
}
```
* **Render #1:** Does `"clicked"` appear? **No.** The function reference is passed, not invoked.
* **User click:** Does `"clicked"` appear? **Yes.** React invokes the handler in response to the user interaction.

**Case 2:**
```javascript
function Button() {
  function handleClick() {
    console.log("clicked");
  }
  return <button onClick={handleClick()}>Save</button>;
}
```
* **Render #1:** Does `"clicked"` appear? **Yes.** The function is executed immediately during render evaluation.

This distinction should become automatic.

---

### 11. The Three Fundamental Forms

#### Form A — Direct Handler
```jsx
<button onClick={handleSave}>Save</button>
```
Use when no adaptation or extra arguments are required.

#### Form B — Adapter Handler
```jsx
<button onClick={() => handleDelete(id)}>Delete</button>
```
Use when the handler needs application-specific arguments:
```text
click
  │
  ▼
anonymous adapter
  │
  ▼
handleDelete(id)
```
The adapter receives the interaction and supplies the required application data.

#### Form C — Handler Receives Event
```jsx
<button onClick={handleClick}>Save</button>
```
```javascript
function handleClick(event) {
  console.log(event);
}
```
React invokes the function with event information.

---

### 12. Handler vs Callback Prop
These concepts are related but not identical:

* **DOM-facing event handler:** `<button onClick={handleSave}>`. `onClick` is the React prop through which the native DOM element receives a function for the click interaction.
* **Component callback prop:** `<UserRow onDelete={handleDelete} />`. `onDelete` is a component domain API designed by the application.

Inside `UserRow`:
```javascript
function UserRow({ onDelete }) {
  return (
    <button onClick={onDelete}>
      Delete
    </button>
  );
}
```

The flow becomes:
$$\text{Browser interaction} \longrightarrow \text{React event handler} \longrightarrow \text{Component callback prop} \longrightarrow \text{Parent-owned behavior}$$

A senior engineer distinguishes **DOM interaction APIs** from **component communication APIs**.

---

### 13. Component Event Contracts
Consider:
```javascript
function ProductRow({ product, onAddToCart }) {
  return (
    <button onClick={() => onAddToCart(product.id)}>
      Add
    </button>
  );
}
```

The component exposes `onAddToCart(productId)`. This is an **interaction contract**. The parent decides what the operation means:
```jsx
<ProductRow product={product} onAddToCart={handleAddToCart} />
```

This is far superior to embedding application-wide behavior inside the child:
```javascript
// AVOID: Child tightly coupled to infrastructure
function ProductRow({ product }) {
  // directly manipulating global cart implementation
  // directly making unrelated network requests
  // directly depending on application infrastructure
}
```

The child should generally own: *“User clicked Add”*, while the parent/application owns: *“What adding this product means.”*

---

### 14. Event Handlers and State Ownership
A critical architectural question is: **Where should the state changed by this interaction live?**

In simple components:
```javascript
function Counter() {
  const [count, setCount] = useState(0);
  function handleIncrement() {
    setCount(count + 1);
  }
  return <button onClick={handleIncrement}>{count}</button>;
}
```
The interaction and state belong to the same component.

Now consider:
```text
Parent
  ├── SearchInput
  └── SearchResults
```
If typing in `SearchInput` affects `SearchResults`, the state belongs to the parent:
```text
Parent
  ├── query state
  ├── SearchInput (onChange -> parent callback)
  └── SearchResults (receives query)
```
The event originates in the child; state ownership belongs in the parent.

---

### 15. Event Handler as a Capability
A function prop can be understood as a **capability**:
```jsx
<Editor onSave={saveDocument} />
```
The editor receives permission to request `saveDocument(...)`. It does not receive (nor need) knowledge of database protocols, HTTP clients, auth tokens, routing, or caching.

$$\text{Child knows: “I can request save.”} \quad\mid\quad \text{Child does NOT need to know: “How saving works.”}$$

This is one of the primary mechanisms by which React composition remains decoupled.

---

### 16. Naming Event Handlers
Prefer semantic names:
```javascript
function handleSubmit() {}
function handleDelete() {}
function handleOpenSettings() {}
function handleRetry() {}
```

And component callback contracts:
```jsx
<Dialog onConfirm={handleConfirm} />
<Editor onSave={handleSave} />
<Row onDelete={handleDelete} />
```

Avoid vague names like `handleThing()`, `doStuff()`, `callback()`, `action()`. The handler name should communicate domain intent.

---

### 17. `handleX` vs `onX`
A clean architectural convention:
* **Inside a component (Implementation):** Use `handleClick`, `handleSubmit`, `handleDelete`.
* **Component API (Props / Contracts):** Use `onClick`, `onSubmit`, `onDelete`, `onSave`.

```javascript
function DeleteButton({ onDelete }) {
  function handleClick() {
    onDelete();
  }
  return <button onClick={handleClick}>Delete</button>;
}
```
This API-design convention dramatically improves codebase consistency and readability.

---

### 18. Inline Handlers
This is perfectly valid:
```jsx
<button onClick={() => setOpen(true)}>Open</button>
```
Do not classify inline handlers as anti-patterns. For small, single-line behavior, an inline handler is concise and expressive. Do not introduce boilerplate functions solely to avoid an inline arrow function.

---

### 19. Named Handlers
A named handler becomes valuable when:
* Logic is non-trivial or has multiple statements.
* The handler needs validation or guards.
* The handler is reused across multiple elements.
* The name clarifies domain intent.
* Debugging/profiling benefits from a named function.

```javascript
function handleSubmit() {
  if (!isValid) return;
  setSubmitting(true);
  submitForm();
}
```

---

### 20. Do Not Create Abstractions Without a Reason
**Bad (Pointless Indirection):**
```javascript
function handleButtonClick() {
  handleClick();
}
<button onClick={handleButtonClick}>
```
when `<button onClick={handleClick}>` is sufficient.

**Good (Transforms Event into Data):**
```jsx
<button onClick={() => handleDelete(product.id)}>
```
Senior engineering means understanding when indirection creates value and when it merely adds noise.

---

### 21. Event Handlers and Closures
Event handlers are functions created within a specific render execution:

```text
Render #1
   ├── count = 0
   └── handleClick₁ (closes over count = 0)

setCount(1)
   │
   ▼
Render #2
   ├── count = 1
   └── handleClick₂ (closes over count = 1)
```

Do not imagine one magical handler function whose internal variables mutate underneath it. Different renders create different function instances with different lexical environments.

---

### 22. Prediction Challenge — Closure Snapshot
```javascript
function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    console.log("count:", count);
  }

  function increment() {
    setCount(count + 1);
  }

  return (
    <>
      <button onClick={handleClick}>Log</button>
      <button onClick={increment}>Increment</button>
    </>
  );
}
```
* **Initial render:** `count = 0`, `handleClick₁` captures `0`.
* **Click Increment:** Triggers state update.
* **Next render:** `count = 1`, `handleClick₂` captures `1`.
* **Click Log:** Logs `count: 1`.

---

### 23. Event Handler vs Effect
Suppose the user clicks Save:

$$\mathbf{Correct:\ } \text{click} \longrightarrow \text{handleSave()} \longrightarrow \text{saveDocument()}$$

**Avoid Manufacturing Effects for User Actions:**
```javascript
// ANTI-PATTERN:
const [shouldSave, setShouldSave] = useState(false);

useEffect(() => {
  if (shouldSave) {
    saveDocument();
  }
}, [shouldSave]);

function handleClick() {
  setShouldSave(true);
}
```
This introduces an unnecessary state variable and extra render cycle.

$$\text{User Event } \longrightarrow \text{ Event Handler} \quad\mid\quad \text{External System Synchronization } \longrightarrow \text{ Effect}$$

---

### 24. Derived UI vs User Actions
Do not use `useEffect` for derived data resulting from user interaction:

```text
USER ACTION
    │
    ▼
EVENT HANDLER (handleQuantityChange)
    │
    ▼
STATE UPDATE (setQuantity)
    │
    ▼
RENDER
    │
    ▼
DERIVED UI (const total = price * quantity)
```

---

### 25. Event Handler Purity
* **Rendering must remain pure:** Free from network calls, DOM mutations, or interaction side effects.
* **Event handlers are side-effect boundaries:** They are specifically intended to initiate application side effects (dispatching actions, saving to APIs, mutating external stores).

```javascript
function Editor() {
  saveDocument(); // WRONG: Side effect in render!
  return <EditorUI />;
}
```

---

## LAYER 3 — 🧪 PRODUCTION ANTI-PATTERNS & DIAGNOSTIC LABS

### 26. Production Anti-Pattern #1 — Calling the Handler During Render
**Flawed:**
```javascript
function SaveButton() {
  function handleSave() {
    saveDocument();
  }
  return <button onClick={handleSave()}>Save</button>;
}
```
* **Mechanical failure:** `handleSave()` executes immediately during JSX evaluation.
* **Correct:** `<button onClick={handleSave}>Save</button>`.

---

### 27. Production Anti-Pattern #2 — Putting User Actions in Effects
**Flawed:**
```javascript
const [saveRequested, setSaveRequested] = useState(false);
useEffect(() => {
  if (saveRequested) {
    saveDocument();
  }
}, [saveRequested]);

function handleClick() {
  setSaveRequested(true);
}
```
* **Better:**
```javascript
function handleClick() {
  setSaving(true);
  saveDocument();
}
```

---

### 28. Production Anti-Pattern #3 — Child Owns Parent Business Logic
**Flawed:**
```javascript
function DeleteButton({ userId }) {
  function handleClick() {
    api.delete(`/users/${userId}`);
    analytics.track("user_deleted");
    refreshUsers();
    showToast("Deleted");
  }
  return <button onClick={handleClick}>Delete</button>;
}
```
* **Better:** Expose `onDelete` callback prop and let the parent/controller handle API, analytics, and cache invalidation.

---

### 29. Production Anti-Pattern #4 — Giant Event Handlers
A single handler coordinating validation, normalization, network calls, cache updates, analytics, toasts, form resets, and navigation should be decomposed into modular domain functions called by the handler.

---

### 30. Production Anti-Pattern #5 — Passing the Wrong Function
```jsx
<button onClick={setOpen}>Open</button>
```
React invokes the handler with an event object, causing `open` state to receive `SyntheticBaseEvent` rather than `true`. Use an adapter:
```jsx
<button onClick={() => setOpen(true)}>Open</button>
```

---

### 31. Prediction Challenge — What Happens?
```javascript
function Panel() {
  const [open, setOpen] = useState(false);
  return (
    <button onClick={() => setOpen(true)}>
      {open ? "Close" : "Open"}
    </button>
  );
}
```
* **Render #1:** `open = false`, renders `"Open"`.
* **Click:** Anonymous adapter executes `setOpen(true)`.
* **Render #2:** `open = true`, renders `"Close"`.

---

### 32. Prediction Challenge — Direct Handler Execution Timing
```javascript
function SaveButton() {
  function handleSave() {
    console.log("save");
  }
  return <button onClick={handleSave}>Save</button>;
}
```
| Moment | `handleSave` executes? |
| :--- | :---: |
| Component function begins | No |
| JSX is evaluated | No |
| Render completes | No |
| Commit occurs | No |
| User clicks | **Yes** |

---

### 33. Prediction Challenge — Invocation Timing
```javascript
function SaveButton() {
  function handleSave() {
    console.log("save");
  }
  return <button onClick={handleSave()}>Save</button>;
}
```
| Moment | `handleSave` executes? |
| :--- | :---: |
| Component function begins | No |
| JSX is evaluated | **Yes (Immediate Execution)** |
| Render completes | Already executed |
| User clicks | No (function already executed during render) |

---

### 34. Prediction Challenge — Handler Closure
```javascript
function Counter() {
  const [count, setCount] = useState(0);
  const handleClick = () => { console.log(count); };

  return (
    <>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={handleClick}>Log</button>
    </>
  );
}
```
After one increment, the newly committed `handleClick` logs: **`1`**.

---

### 35. Event Handler Decision Matrix

| Situation | Preferred Pattern |
| :--- | :--- |
| **Simple click with no arguments** | `onClick={handleClick}` |
| **Small trivial state update** | `onClick={() => setOpen(true)}` |
| **Needs application argument** | `onClick={() => handleDelete(id)}` |
| **Reused complex behavior** | Named handler function |
| **Child needs parent behavior** | Callback prop (`onDelete={...}`) |
| **User action causes state update** | Event handler |
| **User action invokes domain operation** | Event handler |
| **External synchronization caused by state** | `useEffect` |
| **Derived value** | Calculate during render |
| **Direct DOM manipulation** | Avoid unless using explicit ref escape hatch |

---

### 36. Senior-Level Judgment
* **Beginner:** `onClick={handleClick}` runs when clicked.
* **Professional:** Handlers are passed as function references, capture render closures, receive SyntheticEvents, and trigger updates.
* **Senior Architect:** Defines clear interaction boundaries, designs clean capability props, decouples children from infrastructure, and places user actions strictly at event boundaries rather than effects.

---

### 37. Diagnostic Lab — React DevTools
```javascript
function Counter() {
  const [count, setCount] = useState(0);
  function handleIncrement() {
    setCount(count + 1);
  }
  return <button onClick={handleIncrement}>Count: {count}</button>;
}
```
1. Open React DevTools $\rightarrow$ **Components** panel.
2. Select `Counter` and observe initial state `count: 0`.
3. Click button $\rightarrow$ observe state update to `1` $\rightarrow$ trace resulting re-render.

---

### 38. Diagnostic Exercise — Deliberate Bug
Test `<button onClick={handleIncrement()}>` vs `<button onClick={handleIncrement}>` to observe render-time loops.

---

### 39. Diagnostic Questions
1. Was the handler passed or invoked (`onClick={fn}` vs `onClick={fn()}`)?
2. What arguments does the handler expect?
3. Is an event object being confused with application state?
4. Is the handler updating the component that actually owns the state?
5. Is a callback prop cleanly crossing a component boundary?
6. Is an effect being misused where an event handler belongs?
7. Is the handler reading a stale closure?

---

### 40. Production Trace: Todo Deletion
```text
User clicks Delete
      │
      ▼
TodoItem's click handler
      │
      ▼
onDelete(todo.id)
      │
      ▼
TodoList.handleDelete(id)
      │
      ▼
setTodos(current => current.filter(...))
      │
      ▼
React state update & re-render
      │
      ▼
Reconciliation & DOM commit
```

---

### 41. Why This Matters at Senior Level
* **Junior:** *“How do I handle this click?”*
* **Senior:** *“What responsibility should this interaction trigger, and where should that responsibility live?”*

---

### 42. Part Boundary
* **In Scope:** Handler references, invocation timing, callback props, interaction boundaries, closures, event vs effect distinction.
* **Deferred to Part 02+:** SyntheticEvent object properties, `currentTarget`, event propagation, bubbling, capturing, `preventDefault()`, `stopPropagation()`.

---

### 43. Cross-KPI Connections
* **KPI 01 (Mental Model):** Events trigger state transitions that produce new UI descriptions.
* **KPI 03 (Components & Composition):** Callback props implement unidirectional capability passing.
* **KPI 04 (State & State Updates):** Handlers initiate asynchronous state update queues.

---

### 44. Engineering Rules
1. `onClick={handler}` provides a handler reference.
2. `onClick={handler()}` executes the function during render.
3. User-driven behavior belongs in event handlers, not `useEffect`.
4. State must live where resulting UI is owned.
5. Callback props communicate intent (`onSave`), not implementation (`saveToPostgresDb`).
6. Inline handlers are valid for concise logic.
7. Do not wrap handlers in pointless intermediate functions.
8. Child components should not own parent business logic.
9. Always account for render-scoped closures in handlers.
10. Ensure adapter functions map event objects to domain arguments.

---

## LAYER 4 — 🔥 THE CRUCIBLE

### 45. Crucible Challenges

#### Challenge 1 — Immediate Invocation
```jsx
<button onClick={submitForm()}>Submit</button>
```
* `submitForm()` executes during render evaluation.
* The return value (e.g. `undefined` or a Promise) is assigned to `onClick`.
* When clicked, nothing happens (or runtime error).

#### Challenge 2 — Adapter Function
* `<button onClick={deleteUser}>`: Passes the SyntheticEvent object as the first argument to `deleteUser(event)`.
* `<button onClick={() => deleteUser(user.id)}>`: Adapter function intercepts the event and passes the domain ID `user.id`.

#### Challenge 3 — State Ownership in Filtering
In `Dashboard ├── FilterBar └── ResultsTable`, filter state belongs in `Dashboard` (narrowest common owner), not inside `FilterBar`.

#### Challenge 4 — Effect Misuse Refactoring
**Refactor:** Remove `saveRequested` state and `useEffect`. Call `saveDocument()` directly inside `handleSave()`.

#### Challenge 5 — Callback Contract Design
`<UserRow user={user} onDelete={() => handleDelete(user.id)} />`. `UserRow` only invokes `onDelete()`; parent handles domain deletion.

#### Challenge 6 — Closure Reasoning
`handleLog` captures `count` from the render pass that created it; clicking increment triggers a new render with a fresh `handleLog` closing over the new count.

---

### 46. Production Incident Runbook
**Symptom:** *“Clicking Save runs save repeatedly or infinite loops on mount.”*
* **Check:** Did someone write `onClick={save()}` instead of `onClick={save}` or `onClick={() => save()}`?

---

### 47. Senior Interview Traps
1. *“React event handlers are just DOM event listeners.”* $\rightarrow$ False. React wraps them in a synthetic dispatch and reconciliation pipeline.
2. *“Always use named functions instead of inline handlers.”* $\rightarrow$ False. Inline handlers are often cleaner and perfectly performant.
3. *“Effects are where all side effects go.”* $\rightarrow$ False. User-initiated side effects belong in event handlers.

---

### 48. Master Mental Model

```text
REACT COMPONENT
       │
       │ render
       ▼
JSX / UI description
       │
       ▼
Interactive element
       │
       │ user interaction
       ▼
     Event
       │
       ▼
 Event handler
       │
 ┌─────┴───────────────┐
 │                     │
State transition   Callback prop
 │                     │
 ▼                     ▼
React update       Parent/application
 │
 ▼
Render
 │
 ▼
Reconcile
 │
 ▼
Commit
 │
 ▼
Updated interface
```

---

### 49. Completion Checklist
- [x] Explain what an event and an event handler are.
- [x] Distinguish `onClick={fn}` from `onClick={fn()}`.
- [x] Pass direct handlers and adapter functions.
- [x] Design clean component callback contracts (`onX` vs `handleX`).
- [x] Keep child components decoupled from parent business logic.
- [x] Distinguish user events from `useEffect` external synchronization.
- [x] Trace click $\rightarrow$ handler $\rightarrow$ state update $\rightarrow$ render $\rightarrow$ commit.
- [x] Reason accurately about closures and render snapshots in handlers.

---

### 50. PART GRADUATION STANDARD
> **Do not think: “Click $\rightarrow$ manipulate UI.”  
> Think: “Click $\rightarrow$ handler $\rightarrow$ application/state transition $\rightarrow$ render $\rightarrow$ commit $\rightarrow$ UI.”**

---

[⬅️ Previous Part](../04-Props-One-Way-Data-Flow/16-state-and-state-updates-final-review.md) | [📚 Level 06 Index](./README.md) | [🧪 Companion Lab](./examples/01-react-event-handling-and-event-handlers.html) | [Next Part ➡️](./02-event-objects-and-event-semantics.md)
