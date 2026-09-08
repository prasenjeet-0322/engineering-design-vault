Level 06 — React Fundamentals
KPI 05 — Events & User Interaction
PART 02 — Event Objects, Event Data & React Event Semantics
[⬅️ Previous Part](./01-react-event-handling-and-event-handlers.md) | [📚 Level 06 Index](./README.md) | [🧪 Companion Lab](./examples/02-event-objects-and-event-semantics.html) | [Next Part ➡️](./03-event-propagation-and-event-flow.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

## PART PURPOSE

Part 01 established the fundamental interaction pipeline:
```text
User Interaction
       │
       ▼
     Event
       │
       ▼
 Event Handler
       │
       ▼
State / Application Action
       │
       ▼
    Render
       │
       ▼
    Commit
```

This Part answers the next critical question:
> **What exactly does the handler receive when React invokes it?**

A React event handler commonly receives an event object:
```javascript
function handleClick(event) {
  console.log(event);
}

return (
  <button onClick={handleClick}>
    Save
  </button>
);
```

That event is:
* **not** your application state,
* **not** the DOM node itself,
* **not** automatically the value your application wants.

It is **interaction information** supplied to the handler.

The senior-level mental model is:
```text
Browser/User Interaction
       │
       ▼
  React event
       │
       ▼
 Event handler
       │
 ┌─────┴─────────┐
 │               │
 ▼               ▼
inspect        application
 event            data
 │               │
 └───────┬───────┘
         ▼
 application action
```

---

## LAYER 1 — ⚡ 30-SECOND EXECUTIVE CHEAT SHEET & CORE MENTAL MODELS

### 1. Event Object = Interaction Data
Consider:
```javascript
function handleClick(event) {
  console.log(event);
}
```
The event object provides information about the interaction:
* `event.type`
* `event.target`
* `event.currentTarget`
* `event.key`
* `event.code`
* `event.clientX`, `event.clientY`
* `event.defaultPrevented`

The exact properties depend on the event category. Understand the core model:
> **The event object describes the interaction that caused the handler to run.**

---

### 2. Event Data $\neq$ Application Data
This distinction is fundamental:

```javascript
<button onClick={handleDelete}>Delete</button>
```
React invokes: `handleDelete(event)`.  
The event contains interaction metadata, but your application needs:
$$\text{userId}, \quad \text{productId}, \quad \text{orderId}, \quad \text{documentId}$$

```text
Event data
  ├── type
  ├── target
  ├── currentTarget
  └── keyboard/pointer information

Application data
  ├── userId
  ├── productId
  ├── orderId
  └── domain-specific values
```
Do not confuse the two.

---

### 3. `target` vs `currentTarget`
This is one of the most important event concepts:

```javascript
function handleClick(event) {
  console.log(event.target);
  console.log(event.currentTarget);
}
```

* **`target`** $\rightarrow$ The element from which the event originated.
* **`currentTarget`** $\rightarrow$ The element whose handler is currently executing.

These can be different when events propagate through nested elements.

---

### 4. Event Handler Signature
A handler can accept the event or ignore it:
```javascript
// Accepts event:
function handleClick(event) { ... }

// Ignores event:
function handleClick() { ... }
```
Both are valid. React supplies the event automatically upon invocation:
$$\text{React} \xrightarrow{\text{invokes}} \text{handleClick(event)}$$

---

### 5. Passing Application Arguments
```javascript
function handleDelete(id) {
  deleteUser(id);
}
```
You cannot write `<button onClick={handleDelete}>` if `handleDelete` expects a domain ID as its first argument.

Use an adapter function:
```jsx
<button onClick={() => handleDelete(user.id)}>
  Delete
</button>
```
```text
click
  │
  ▼
adapter function
  │
  ▼
handleDelete(user.id)
```
The adapter translates the interaction boundary into the application's domain contract.

---

### 6. Event Data Can Be Extracted
For a controlled input:
```javascript
function SearchBox() {
  const [query, setQuery] = useState("");

  function handleChange(event) {
    setQuery(event.target.value);
  }

  return <input value={query} onChange={handleChange} />;
}
```
The flow is:
$$\text{User types} \longrightarrow \text{event} \longrightarrow \text{event.target.value} \longrightarrow \text{setQuery(value)} \longrightarrow \text{render}$$

The event is temporary interaction information; the state becomes persistent application/UI state.

---

### EXECUTIVE CONCEPT TABLE

| Concept | Core Mechanism | Production Impact | Common Senior Trap |
| :--- | :--- | :--- | :--- |
| **Event object** | Interaction metadata supplied to handler | Enables event-aware behavior | Treating event as application state |
| `target` | Original event target | Identifies originating element | Assuming it always equals handler element |
| `currentTarget` | Element whose handler is executing | Useful for handler ownership | Confusing it with `target` |
| `type` | Event category (`"click"`, `"change"`, etc.) | Useful for generic diagnostics | Building unnecessary generic handlers |
| `value` | Common input data extracted from target | Drives controlled state | Assuming every event has `target.value` |
| `key` | Logical keyboard key (`"Enter"`, `"Escape"`) | Supports keyboard interaction | Confusing it with physical key location |
| `code` | Physical keyboard key position (`"KeyA"`) | Hardware-oriented shortcuts | Using code when semantic key is required |
| `preventDefault()` | Cancels default browser action | Controls browser behavior | Assuming it stops propagation |
| `stopPropagation()` | Stops further propagation | Controls event flow | Assuming it cancels browser default behavior |
| **Adapter function** | Converts event invocation into application arguments | Keeps function contracts clean | Passing event where domain data is expected |
| **Handler closure** | Captures render-scope values | Determines available application data | Assuming handler reads magically updated variables |
| **Component callback** | Application-defined function contract | Enables decoupling | Exposing raw browser-event contracts unnecessarily |

---

### GOLDEN RULE
> **Treat the event object as interaction data. Extract what you need, convert it into application-level data, and keep browser-event semantics separate from domain-level contracts.**

---

## LAYER 2 — 🔬 DEEP MECHANICAL BREAKDOWN

### 7. What Happens When a Handler Runs?
```javascript
function Button() {
  function handleClick(event) {
    console.log(event.type);
  }
  return <button onClick={handleClick}>Save</button>;
}
```

```text
Render
  │
  ▼
React element describes button + handler
  │
  ▼
Commit
  │
  ▼
User clicks button
  │
  ▼
React receives interaction
  │
  ▼
React invokes handler: handleClick(event)
  │
  ▼
Handler reads event.type
```
The handler does not manufacture the event object; React's synthetic event system constructs and supplies it.

---

### 8. Event Object as a Snapshot of Interaction
An event object represents information about a particular interaction:
$$\text{Interaction \#1} \longrightarrow \text{Event object \#1} \quad\mid\quad \text{Interaction \#2} \longrightarrow \text{Event object \#2}$$

Do not model the event object as permanent application state.

**Extracting Persistent Coordinates:**
```javascript
const [lastX, setLastX] = useState(null);

function handleClick(event) {
  setLastX(event.clientX);
}
```
$$\text{event.clientX (temporary interaction data)} \longrightarrow \text{setLastX(...) (persistent React state)}$$

---

### 9. `event.target`
`target` represents the element from which the event originated.

For nested markup:
```jsx
<button onClick={handleClick}>
  <span>Save</span>
</button>
```
If the user clicks the inner `<span>`:
* `event.target` $\rightarrow$ `<span>` (originating DOM element)
* `event.currentTarget` $\rightarrow$ `<button>` (element holding the `onClick` handler)

---

### 10. `event.currentTarget`
`currentTarget` represents the element whose handler is currently executing.
```javascript
function handleClick(event) {
  console.log(event.currentTarget); // <button>
}
```
$$\mathbf{target} = \text{where the interaction originated} \quad\mid\quad \mathbf{currentTarget} = \text{element of the executing handler}$$

---

### 11. Why Senior Engineers Care About `target` vs `currentTarget`
```jsx
function Button({ onAction }) {
  function handleClick(event) {
    onAction(event.target); // BUG: May leak <span> or <svg>
  }
  return (
    <button onClick={handleClick}>
      <span>Delete</span>
    </button>
  );
}
```
Passing `event.target` leaks internal DOM markup (`<span>`) to the parent.

**Architectural Principle:**
> **Do not leak browser-event details through component APIs unless the consumer genuinely needs them.**

---

### 12. Event Data vs Component API
```javascript
// Leaky API:
function DeleteButton({ onDelete }) {
  return <button onClick={event => onDelete(event)}>Delete</button>;
}

// Clean Domain API:
function DeleteButton({ onDelete }) {
  return <button onClick={() => onDelete()}>Delete</button>;
}
```
The parent should receive semantic domain intent (`onDelete()`), not browser mouse coordinates and DOM targets.

---

### 13. Semantic Event Contracts
Compare:
* `<DeleteButton onClick={handleDelete} />` $\rightarrow$ Generic DOM event prop
* `<DeleteButton onDelete={handleDelete} />` $\rightarrow$ Domain intent contract

```text
Browser/React event
       │
       ▼
   handleClick
       │
       ▼
   onDelete()
       │
       ▼
Parent/application
```

---

### 14. Event Object and Controlled Inputs
```javascript
function SearchInput() {
  const [query, setQuery] = useState("");

  function handleChange(event) {
    setQuery(event.target.value);
  }

  return <input value={query} onChange={handleChange} />;
}
```

```text
User changes input
       │
       ▼
  Input event
       │
       ▼
handleChange(event)
       │
       ▼
event.target.value
       │
       ▼
setQuery(nextValue)
       │
       ▼
  state update
       │
       ▼
   new render
       │
       ▼
<input value={query}>
```

---

### 15. Why `event.target.value` Is Not State
`event.target.value` is an ephemeral string from the browser DOM at the moment of typing. Once `setQuery(value)` executes, `query` becomes canonical React state that controls future renders.

---

### 16. Keyboard Event Data
```javascript
function handleKeyDown(event) {
  console.log(event.key);  // Logical key: "Enter", "Escape", "a"
  console.log(event.code); // Physical key position: "KeyA", "Enter"
}
```

---

### 17. `key` vs `code`
* **`event.key`:** Represents the logical character generated (respects keyboard layout and Shift/Caps).
* **`event.code`:** Represents the physical key position on the keyboard (layout-agnostic, e.g. `"KeyA"`, `"Digit1"`).

Use `event.key === "Escape"` for UI shortcuts; use `event.code` for physical hardware mapping (e.g. gaming WASD controls).

---

### 18. Modifier Keys
```javascript
function handleClick(event) {
  if (event.shiftKey) {
    // Shift-click multi-select behavior
  }
}
```
`event.altKey`, `event.ctrlKey`, `event.metaKey` (Command on Mac, Windows key on PC), `event.shiftKey`.

---

### 19. `preventDefault()`
Cancels the default browser action associated with the event (e.g., preventing a full page refresh on `<form onSubmit>` or link navigation on `<a href>`).

```javascript
function handleSubmit(event) {
  event.preventDefault();
  // custom SPA submission
}
```

---

### 20. `stopPropagation()`
Halts event bubbling up the DOM and React component tree:
```javascript
function handleChildClick(event) {
  event.stopPropagation();
}
```

---

### 21. The Critical Difference
| Operation | Purpose |
| :--- | :--- |
| `preventDefault()` | Prevents the default browser action |
| `stopPropagation()` | Prevents further propagation through the event tree |

$$\mathbf{preventDefault \neq stopPropagation}$$

---

### 22. Event Data Extraction
Extract only what the application needs:
```javascript
function handleChange(event) {
  const value = event.target.value;
  setQuery(value);
}
```

---

### 23. Adapter Functions
```jsx
<button onClick={() => handleDelete(user.id)}>
  Delete
</button>
```
```text
React event
    │
    ▼
() => handleDelete(user.id)
    │
    ▼
user.id
    │
    ▼
domain operation
```

---

### 24. Why Not Change the Handler to Accept the Event?
Avoid writing:
```javascript
function handleDelete(event) {
  // Parsing user ID from DOM dataset attributes...
}
```
Domain data should remain domain data. If the component knows `user.id`, pass it directly via an adapter arrow function.

---

## LAYER 3 — 🧪 PRODUCTION ANTI-PATTERNS & DIAGNOSTIC LABS

### 25. Production Anti-Pattern — DOM as Application Data Store
**Bad:**
```javascript
function handleDelete(event) {
  const id = event.currentTarget.dataset.userId;
  deleteUser(id);
}
```
**Prefer:**
```jsx
<button onClick={() => deleteUser(user.id)}>
```
The DOM must not become an accidental application database.

---

### 26. Production Anti-Pattern — Passing Raw Events Through Every Layer
Do not force parent components to extract domain data from raw SyntheticEvents passed up by children. Expose semantic callback signatures (`onSelect(id)` rather than `onSelect(event)`).

---

### 27. Production Anti-Pattern — Assuming Every Target Has `value`
`event.target.value` is undefined on buttons, divs, and spans. Only form controls (`<input>`, `<textarea>`, `<select>`) have standard `value` properties.

---

### 28. Production Anti-Pattern — Generic Event Handler for Everything
Avoid mega-handlers with large `switch (event.type)` blocks. Write focused, semantic handlers: `handleSave`, `handleSearchChange`, `handleKeyDown`.

---

### 29. Prediction-First Walkthrough
```javascript
function SearchBox() {
  const [query, setQuery] = useState("");
  function handleChange(event) {
    console.log(event.target.value);
    setQuery(event.target.value);
  }
  return <input value={query} onChange={handleChange} />;
}
```
* **Render #1:** `query = ""` $\rightarrow$ renders `<input value="">`.
* **User types `"r"`:** `event.target.value = "r"`.
* **Handler:** `setQuery("r")`.
* **Render #2:** `query = "r"` $\rightarrow$ renders `<input value="r">`.

---

### 30. Prediction Challenge — `target` vs `currentTarget`
```jsx
function App() {
  function handleClick(event) {
    console.log(event.target.tagName);
    console.log(event.currentTarget.tagName);
  }
  return (
    <button onClick={handleClick}>
      <span>Save</span>
    </button>
  );
}
```
* Clicking the text: `event.target.tagName` $\rightarrow$ `"SPAN"`.
* `event.currentTarget.tagName` $\rightarrow$ `"BUTTON"`.

---

### 31. Prediction Challenge — Application Argument
```jsx
function handleDelete(id) {
  console.log(id);
}
<button onClick={handleDelete}>Delete</button>
```
`id` receives the `SyntheticBaseEvent` object, **not** the user ID.  
**Fix:** `<button onClick={() => handleDelete(user.id)}>`.

---

### 32. Prediction Challenge — Input Event Value
`onChange={handleChange}` extracts input data from `event.target.value`. Calling `setValue(event.target.value)` turns it into persistent React state.

---

### 33. Prediction Challenge — `preventDefault`
`event.preventDefault()` cancels browser actions (e.g. form submit reload), but **does not** stop event propagation.

---

### 34. Prediction Challenge — `stopPropagation`
`event.stopPropagation()` stops bubbling up the hierarchy, but **does not** prevent default browser actions.

---

### 35. Event Handler Closure + Event Data
```javascript
function Item({ id }) {
  function handleClick(event) {
    console.log(id); // from render closure
    console.log(event.currentTarget); // from interaction event
  }
  return <button onClick={handleClick}>Delete</button>;
}
```

---

### 36. Application Data + Event Data
```javascript
function UserRow({ user, onDelete }) {
  function handleClick(event) {
    console.log("clicked:", event.currentTarget);
    onDelete(user.id);
  }
  return <button onClick={handleClick}>Delete {user.name}</button>;
}
```
* `event.currentTarget` $\rightarrow$ interaction context.
* `user.id` $\rightarrow$ render snapshot / props context.

---

### 37. TypeScript Event Contracts
```typescript
function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
  setValue(event.target.value);
}

function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
  // ...
}
```

---

### 38. Semantic Component Contracts + TypeScript
```typescript
type DeleteButtonProps = {
  userId: string;
  onDelete: (userId: string) => void;
};

function DeleteButton({ userId, onDelete }: DeleteButtonProps) {
  return (
    <button onClick={() => onDelete(userId)}>
      Delete
    </button>
  );
}
```
The contract accepts `userId: string`, keeping browser `MouseEvent` details encapsulated.

---

### 39. Diagnostic Lab — Event Inspector
```javascript
function EventInspector() {
  function handleClick(event) {
    console.table({
      type: event.type,
      target: event.target,
      currentTarget: event.currentTarget,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
    });
  }

  return (
    <button onClick={handleClick}>
      <span>Inspect Event</span>
    </button>
  );
}
```

---

### 40. Diagnostic Lab — Controlled Input
```javascript
function InputInspector() {
  const [value, setValue] = useState("");

  function handleChange(event) {
    console.table({
      eventType: event.type,
      targetValue: event.target.value,
    });
    setValue(event.target.value);
  }

  return (
    <>
      <input value={value} onChange={handleChange} />
      <p>State: {value}</p>
    </>
  );
}
```

---

### 41. Diagnostic Lab — Event vs Application Data
```javascript
function UserRow({ user, onDelete }) {
  function handleClick(event) {
    console.table({
      eventType: event.type,
      target: event.target,
      currentTarget: event.currentTarget,
      userId: user.id,
    });
    onDelete(user.id);
  }

  return (
    <button onClick={handleClick}>
      Delete {user.name}
    </button>
  );
}
```

---

### 42. Production Debugging Checklist
- [ ] Which event fired?
- [ ] Which handler received it?
- [ ] What is `event.target` vs `event.currentTarget`?
- [ ] Is the handler expecting event data or application data?
- [ ] Is `event.target.value` valid for this element?
- [ ] Is an adapter function needed?
- [ ] Is application data being unnecessarily parsed from the DOM?
- [ ] Is `preventDefault()` or `stopPropagation()` required?

---

### 43. Production Architecture Rule — Keep Domain Logic Event-Agnostic
```javascript
// Clean Domain Function:
function deleteUser(userId) { ... }

// UI Adapter Layer:
<button onClick={() => deleteUser(user.id)}>
```
The core domain function remains 100% decoupled from React/DOM events.

---

### 44. Event Objects Should Not Become Application State
Avoid `const [event, setEvent] = useState(null)`. Extract only the necessary primitive data:
```javascript
const [position, setPosition] = useState({ x: 0, y: 0 });

function handleClick(event) {
  setPosition({ x: event.clientX, y: event.clientY });
}
```

---

### 45. Senior Decision Matrix

| Question | Preferred Decision |
| :--- | :--- |
| **Needs event metadata?** | Accept `event` argument |
| **Needs application domain data?** | Use closure / adapter arrow function |
| **Does parent need raw event?** | Only expose if genuinely required |
| **Child knows domain ID?** | Pass ID directly via callback prop |
| **Needs text input value?** | Extract `event.target.value` |
| **Cancel browser default action?** | Call `event.preventDefault()` |
| **Stop event propagation?** | Call `event.stopPropagation()` |
| **Semantic component API?** | Prefer `onDelete`, `onSave`, `onSelect` |

---

## LAYER 4 — 🔥 THE CRUCIBLE

### 46. Crucible Challenges

#### Challenge 1 — Classify the Data
```javascript
function handleChange(event) {
  setQuery(event.target.value);
}
```
* `event`: SyntheticEvent object (ephemeral interaction metadata).
* `event.target`: Originating HTML input DOM element.
* `event.target.value`: Extracted string value from the DOM input.
* `query`: React-managed canonical state that persists and drives re-renders.

#### Challenge 2 — `target` vs `currentTarget`
`<div onClick={handleClick}><button>Save</button></div>`. Clicking button:
* `event.target` = `<button>`
* `event.currentTarget` = `<div>`

#### Challenge 3 — API Boundary
`<DeleteButton onDelete={handleDelete} />` is preferred because it exposes domain intent rather than DOM mechanics.

#### Challenge 4 — Raw Event Leakage
**Refactor:**
```jsx
// Child:
<button onClick={() => onDelete(user.id)}>Delete</button>

// Parent:
function handleDelete(id) { deleteUser(id); }
```

#### Challenge 5 — `preventDefault` vs `stopPropagation`
* Form submission reload: `event.preventDefault()`.
* Nested click reaching parent container: `event.stopPropagation()`.

#### Challenge 6 — Keyboard Semantics
Use `event.key === "Escape"` because logical keys remain consistent across international keyboard layouts.

---

### 47. Production Incident Simulation: Icon Target Bug
```jsx
<button onClick={handleClick}>
  <svg> ... </svg>
</button>
```
If `handleClick` reads `event.target`, clicking the icon yields the `<svg>` node instead of `<button>`. Use `event.currentTarget` or an adapter function.

---

### 48. Production Incident Simulation: Wrong Function Argument
`<button onClick={deleteUser}>` passes `event` to `deleteUser(id)`. Fixed by using an adapter: `<button onClick={() => deleteUser(user.id)}>`.

---

### 49. Senior Interview Traps
1. *“The event object is the DOM element.”* $\rightarrow$ False. It is an interaction wrapper; `event.target` points to the DOM element.
2. *“target and currentTarget are always identical.”* $\rightarrow$ False. Nested elements cause them to diverge.
3. *“preventDefault() stops bubbling.”* $\rightarrow$ False.
4. *“stopPropagation() stops browser defaults.”* $\rightarrow$ False.
5. *“Always pass event to parent.”* $\rightarrow$ False. Expose semantic domain callbacks.

---

### 50. Master Execution Model

```text
Controlled Input:
USER ──► interaction ──► EVENT OBJECT ──► target.value ──► setState(value) ──► RENDER

Semantic Button:
USER ──► click event ──► React handler ──► adapter extracts user.id ──► onDelete(user.id)
```

---

### 51. What You Should Now See
When reading `<button onClick={() => onDelete(user.id)}>`, visualize:
$$\text{User Click} \longrightarrow \text{React event} \longrightarrow \text{Adapter executes} \longrightarrow \text{user.id from closure} \longrightarrow \text{onDelete(user.id)}$$

---

### 52. Cross-KPI Connections
* **KPI 01:** Events initiate state transitions for the next render.
* **KPI 03:** Callback props enforce clean component interfaces.
* **KPI 04:** Extracted event data drives `useState` updater queues.

---

### 53. PART 02 COMPLETION CHECKLIST
- [x] Explain event objects as interaction metadata.
- [x] Distinguish event data from application domain data.
- [x] Master `event.target` vs `event.currentTarget`.
- [x] Use adapter arrow functions to pass domain arguments.
- [x] Extract `event.target.value` for controlled form inputs.
- [x] Differentiate `event.key` from `event.code`.
- [x] Distinguish `preventDefault()` from `stopPropagation()`.
- [x] Design semantic component callback contracts.
- [x] Keep domain functions free from raw React event objects.

---

### 54. PART GRADUATION STANDARD
```text
                  HANDLER
                     │
         ┌───────────┴───────────┐
         │                       │
     EVENT DATA               APP DATA
         │                       │
  target/value/etc.         props/state/
                           closure values
         │                       │
         └───────────┬───────────┘
                     ▼
             APPLICATION ACTION
```

> **PART 02 FINAL RULE:**  
> Do not think: *“React gives my function some event thing.”*  
> Think: *“An interaction produces event data. The handler receives that interaction data. I extract only what the application needs. I translate browser interaction into application intent. Then state/application logic drives the next UI state.”*

---

[⬅️ Previous Part](./01-react-event-handling-and-event-handlers.md) | [📚 Level 06 Index](./README.md) | [🧪 Companion Lab](./examples/02-event-objects-and-event-semantics.html) | [Next Part ➡️](./03-event-propagation-and-event-flow.md)
