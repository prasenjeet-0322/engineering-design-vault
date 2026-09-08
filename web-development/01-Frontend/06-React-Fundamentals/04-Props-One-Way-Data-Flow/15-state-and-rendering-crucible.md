Level 06 — React Fundamentals
KPI 04 — State & State Updates
PART 15 — State & Rendering Crucible: Prediction, Debugging & Senior-Level Reasoning
[⬅️ Previous Part](./14-state-architecture-review.md) | [📚 Level 06 Index](./README.md) | [🧪 Companion Lab](./examples/15-state-and-rendering-crucible.html) | [Next Part ➡️](./16-state-and-state-updates-final-review.html)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

## Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

### 1. The State Prediction Model
A senior React engineer must be able to predict the result of a state update without running the application.

The fundamental model is:

```text
┌───────────────────────┐
│       Render N        │
│                       │
│  props                │
│  state snapshot       │
│  closures             │
└──────────┬────────────┘
           │
           │ user interaction
           ▼
┌───────────────────────┐
│     Event Handler     │
│                       │
│  reads Render N       │
│  snapshot             │
└──────────┬────────────┘
           │
           │ state updates
           ▼
┌───────────────────────┐
│    Pending Updates    │
│                       │
│  value replacements   │
│  functional transforms│
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│      Next Render      │
│                       │
│  new state snapshot   │
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│    Reconciliation     │
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│        Commit         │
└───────────────────────┘
```

> **The critical distinction:**  
> The event handler does not mutate the current render's state binding. It schedules state changes that participate in a future render.

---

### 2. Executive Prediction Table

| Situation | What the Current Handler Sees | What Determines Next State |
| :--- | :--- | :--- |
| `setCount(count + 1)` | Current render's `count` | Value update |
| `setCount(c => c + 1)` | Current render's closure, but transforms queued state | Functional update |
| **Three direct updates** | Same render snapshot | Later updates replace earlier values |
| **Three functional updates** | Same closure, but each transforms pending state | Transformations compose sequentially |
| **Object mutation** | Existing object reference | Reference may remain unchanged |
| **Immutable object update** | New object reference | New state value |
| **Derived value** | Current props/state | Recomputed during render |
| **Key change** | New identity | State can reset |
| **Parent re-render** | Child may render again | State can still be preserved |
| **Remount** | New component occurrence | Fresh state initialized |
| **Batching** | Multiple updates processed together | Does not redefine domain semantics |

---

## Layer 2 — 🔬 Deep Mechanical Breakdown

### 3. Why Prediction Is the Senior-Level Test
Junior reasoning often looks like:
$$\text{click} \longrightarrow \text{setState} \longrightarrow \text{screen changes}$$

Senior reasoning is:
$$\text{Render \#N snapshot} \longrightarrow \text{event closure captures snapshot} \longrightarrow \text{handler executes} \longrightarrow \text{updates enter pending queue} \longrightarrow \text{React computes resulting state} \longrightarrow \text{new render} \longrightarrow \text{new snapshot} \longrightarrow \text{reconciliation} \longrightarrow \text{commit}$$

The difference is substantial. If you can predict each step, many React bugs stop being mysterious.

---

### 4. Prediction Protocol
For every state question, write down:
1. Current render number
2. Props
3. State snapshot
4. Handler closure values
5. State updates issued
6. Update order
7. Functional vs direct update
8. Resulting state
9. Next render snapshot
10. Committed UI

Never skip directly from `setState(...)` to new UI. That shortcut hides the exact mechanics that cause most state bugs.

---

### 5. Crucible A — Three Direct Updates
```javascript
function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
  }

  return <button onClick={handleClick}>{count}</button>;
}
```
* **Initial render:** Render #1, `count = 0`.
* The handler closes over: `count = 0`.
* **Execution:** `setCount(0 + 1)`, `setCount(0 + 1)`, `setCount(0 + 1)`.
* **Pending values:** `1`, `1`, `1`.
* **Result:** Render #2, `count = 1`.
* **Key takeaway:** Three setter calls do not mean three increments.

---

### 6. Crucible B — Three Functional Updates
```javascript
function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(c => c + 1);
    setCount(c => c + 1);
    setCount(c => c + 1);
  }

  return <button onClick={handleClick}>{count}</button>;
}
```
* **Initial:** `count = 0`.
* **Queue:** $f_1(c) = c + 1$, $f_2(c) = c + 1$, $f_3(c) = c + 1$.
* **Application against base:** $0 \xrightarrow{f_1} 1 \xrightarrow{f_2} 2 \xrightarrow{f_3} 3$.
* **Next render:** `count = 3`.
* **Key takeaway:** A functional updater does not mean “Read the latest JavaScript variable.” It means: *“Given the state value at this point in processing, compute the next value.”*

---

### 7. Crucible C — Mixed Updates
```javascript
function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 5);
    setCount(c => c + 1);
    setCount(100);
    setCount(c => c + 10);
  }
}
```
* **Current snapshot:** `count = 0`.
* **Conceptual update sequence:**
  1. `setCount(0 + 5)` $\rightarrow$ pending state = `5`
  2. `setCount(c => c + 1)` $\rightarrow$ pending state = `5 + 1 = 6`
  3. `setCount(100)` $\rightarrow$ pending state = `100` (overwrites previous)
  4. `setCount(c => c + 10)` $\rightarrow$ pending state = `100 + 10 = 110`
* **Result:** `count = 110`.
* **Key takeaway:** Update order matters. Functional updaters transform whatever value exists at their exact position in the pending queue.

---

### 8. Crucible D — Reading State Immediately After Updating
```javascript
function handleClick() {
  setCount(count + 1);
  console.log(count);
}
```
If the current render has `count = 10`, the console logs: `10` (not `11`).

**Why?**  
Because the JavaScript binding `count` belongs to the current render snapshot. The setter schedules a future state change. It does not rewrite the current render's local binding.

---

### 9. The Snapshot Principle
Think of `const [count, setCount] = useState(10);` during one render as conceptually:

```text
Render #7
   ├── count = 10
   ├── setCount = stable update capability
   └── handleClick closes over count = 10
```

Calling `setCount(11)` does not mutate `count = 10` into `count = 11` inside Render #7:

```text
Render #7
   └── request update
         │
         ▼
Render #8
   └── count = 11
```

---

### 10. Crucible E — Object State
```javascript
// Initial:
const [user, setUser] = useState({ name: "Ada", age: 36 });

// Bad:
user.name = "Grace";
setUser(user);
```
The reference graph remains:
```text
previous ──────┐
               │
               ▼ same object
               ▲
               │
next ──────────┘
```
`Object.is(previous, next)` is `true`. The update does not communicate a new top-level state value, and React bails out of rendering.

**Correct:**
```javascript
setUser(prev => ({ ...prev, name: "Grace" }));
```
Now `previous !== next`, and unchanged nested properties remain structurally shared.

---

### 11. Crucible F — Nested State
```javascript
const [state, setState] = useState({
  user: {
    profile: {
      name: "Ada"
    }
  }
});
```

**Incorrect (Direct Nested Mutation):**
```javascript
setState(prev => {
  prev.user.profile.name = "Grace";
  return prev;
});
```

**Correct (Immutable Path Copying):**
```javascript
setState(prev => ({
  ...prev,
  user: {
    ...prev.user,
    profile: {
      ...prev.user.profile,
      name: "Grace"
    }
  }
}));
```

The changed path receives new container objects:
```text
state
  ├── user NEW
  │    └── profile NEW
  │         └── name NEW
  └── unchanged branches SHARED
```
The goal is not to clone everything, but to create new references along the changed path while preserving unchanged branches.

---

### 12. Crucible G — Array Reordering
Initial: `items = [ { id: "A" }, { id: "B" }, { id: "C" } ]`.

**With Stable Keys:**
```jsx
{items.map(item => (
  <Row key={item.id} item={item} />
))}
```
After reordering to `C, A, B`:
$$\text{Entity identity: } C \rightarrow C,\quad A \rightarrow A,\quad B \rightarrow B$$
React associates each row with its stable entity identity.

**With `key={index}`:**  
Identity becomes tied to array indices `0, 1, 2`. After reordering, row-local state (e.g. text draft or checkbox) becomes attached to the wrong entity.

---

### 13. Crucible H — Parent Re-render vs Remount
```javascript
function Parent() {
  const [value, setValue] = useState(0);
  return (
    <>
      <button onClick={() => setValue(v => v + 1)}>Parent</button>
      <Child />
    </>
  );
}
```
A parent update causes:
$$\text{Parent render} \longrightarrow \text{Child render}$$
without destroying `Child`'s state. The child receives a new render while preserving its component identity in the Fiber tree. **Render $\neq$ Remount.**

---

### 14. Crucible I — Explicit Identity Reset
```jsx
<Editor key={document.id} document={document} />
```
* **Render #1:** `document.id = 10`, `draft = "hello"`.
* **Render #2:** `document.id = 11`.
* Key changed: `10 → 11`. React treats this as a new component identity.
* **Result:** `draft` initializes cleanly for document 11.

Contrast with `<Editor document={document} />` without a changing key: the state would persist and keep `"hello"`.

---

### 15. Crucible J — Prop Change Does Not Reinitialize State
```javascript
function Editor({ document }) {
  const [draft, setDraft] = useState(document.title);
  return <input value={draft} onChange={e => setDraft(e.target.value)} />;
}
```
* **Initial:** `document.title = "First"`, `draft = "First"`.
* **Later:** `document.title = "Second"`.
* If component identity remains the same, `draft` stays `"First"`.
* `useState` initializer is not rerun merely because props changed. To force a reinitialization upon entity change, use `<Editor key={document.id} document={document} />`.

---

### 16. Crucible K — Derived Data
```javascript
const [items, setItems] = useState([]);
const [query, setQuery] = useState("");

const filteredItems = items.filter(item => item.name.includes(query));
```
* **Canonical state:** `items`, `query`.
* **Derived:** `filteredItems`.

Do not introduce `const [filteredItems, setFilteredItems] = useState([])` synchronized via `useEffect`. Compute it on-the-fly in render.

---

### 17. Crucible L — Functional Update in Async Callback
```javascript
function Counter() {
  const [count, setCount] = useState(0);

  function incrementLater() {
    setTimeout(() => {
      setCount(count + 1); // STALE CLOSURE BUG
    }, 1000);
  }
}
```
If the callback was created when `count = 0`, and the user clicks 5 times in that 1 second, the timeout callback still reads `0` from its closure snapshot, overwriting the state to `1`.

**Fix:**
```javascript
setTimeout(() => {
  setCount(c => c + 1); // PURE FUNCTIONAL UPDATE
}, 1000);
```

---

### 18. Stale Closure $\neq$ Stale State Storage
The state itself has not become corrupted in React's Fiber memory. The issue is that the asynchronous JavaScript callback closed over an older render snapshot:

```text
callback ────► closes over older render snapshot (count = 0)

React state ──► Fiber memoizedState (count = 5)
```
$$\text{Closure snapshot } \neq \text{ Current React state}$$

---

### 19. Crucible M — Two Independent State Values
```javascript
const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
```
These are independent concepts. Updating `firstName` does not require updating `lastName`. Separate state variables are appropriate.

Contrast with `{ status, error, data }`, where values form a coherent state machine. Combine state based on semantic coupling, not file layout.

---

### 20. Crucible N — Impossible State
**Bad:** `{ isLoading: true, isError: true, data: { ... } }`

Ask: *Is this a valid product state?* If no, constrain the domain via discriminated status:
`idle | loading | success(data) | error(error)`.

---

### 21. Crucible O — State Ownership
```text
Checkout
  ├── Address (isValid)
  └── Payment (isValid)
```
If each leaf owns its own `isValid`, the parent cannot evaluate overall checkout eligibility. Lift state to `Checkout`:

```text
Checkout (canonical checkout state)
  ├── Address
  └── Payment
```

---

### 22. Crucible P — State That Should Be Local
`Button └── isHovered`. If only the button needs hover feedback, lifting it to `ApplicationRoot` pollutes global state and forces unnecessary app-wide renders.

---

### 23. Crucible Q — Controlled Component
```jsx
<Input value={name} onChange={setName} />
```
```text
Parent
  │
  │ value prop
  ▼
Input
  │
  │ onChange event
  ▼
Parent (Updates canonical state)
```
The child does not own the canonical value; it is a controlled renderer.

---

### 24. Crucible R — Uncontrolled Component
```jsx
<Input defaultValue="Ada" />
```
The child internally owns its current DOM value. `defaultValue` is an initialization contract, not continuous synchronization.

---

### 25. Crucible S — Key as Identity, Not Synchronization
**Anti-Pattern:**
```jsx
<Widget key={Math.random()} value={value} />
```
Every render creates a new identity, discarding local state, destroying DOM elements, dropping focus, and re-executing all effects. Use keys only when identity genuinely changes: `<Widget key={entity.id} />`.

---

### 26. Crucible T — The Mutation Trap in a Child
* **Parent:** `const [user, setUser] = useState({ name: "Ada" }); <Profile user={user} />`
* **Child:** `user.name = "Grace";` *(Direct prop mutation error!)*

The child has mutated data owned by the parent without notifying React.

**Correct:**
```text
Child ──(onNameChange("Grace"))──► Parent ──(setUser(...))──► New Render
```

---

## Layer 3 — 🧪 Diagnostic Labs & DevTools Profiling

### 27. Lab 01 — Render Snapshot Trace
```javascript
function Counter() {
  const [count, setCount] = useState(0);
  console.log("render", count);

  function handleClick() {
    console.log("before", count);
    setCount(count + 1);
    console.log("after", count);
  }

  return <button onClick={handleClick}>{count}</button>;
}
```
**Console Output on Click:**
```text
render 0
before 0
after 0
render 1
```
`count` does not mutate inside `handleClick`; it remains `0` until Render #2.

---

### 28. Lab 02 — Functional Update Trace
```javascript
function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(c => {
      console.log("updater 1", c);
      return c + 1;
    });
    setCount(c => {
      console.log("updater 2", c);
      return c + 1;
    });
  }

  return <button onClick={handleClick}>{count}</button>;
}
```
* **Output:** `updater 1: 0`, `updater 2: 1`, followed by `render 2`.

---

### 29. Lab 03 — Object Identity
```javascript
function UserEditor() {
  const [user, setUser] = useState({ name: "Ada" });

  function mutate() {
    setUser(prev => {
      prev.name = "Grace";
      return prev;
    });
  }

  function replace() {
    setUser(prev => ({ ...prev, name: "Grace" }));
  }
}
```
* `mutate()` returns the same memory reference $\rightarrow$ `Object.is` check succeeds $\rightarrow$ No re-render.
* `replace()` returns a new object reference $\rightarrow$ Re-render triggered.

---

### 30. Lab 04 — Profiler State Update Investigation
1. Open React DevTools $\rightarrow$ **Profiler**.
2. Click Record.
3. Trigger a state update.
4. Stop recording.
5. Inspect the commit flamegraph.
6. Trace which component initiated the update and which descendants re-rendered.

---

### 31. Lab 05 — State Invariant Assertion
```javascript
function assertValidState(state) {
  if (state.status === "success" && state.data == null) {
    throw new Error("Invalid state: success requires data");
  }
  if (state.status === "error" && state.error == null) {
    throw new Error("Invalid state: error requires error payload");
  }
}
```

---

## Layer 4 — 🔥 The Crucible

### 32. Senior Challenge — Predict Every Render
**Code:**
```javascript
function Example() {
  const [count, setCount] = useState(0);
  const [enabled, setEnabled] = useState(false);

  function handleClick() {
    setCount(count + 1);
    setCount(c => c + 1);
    setEnabled(true);
    console.log(count, enabled);
  }

  console.log("render", count, enabled);
  return <button onClick={handleClick}>{count}:{String(enabled)}</button>;
}
```
**Starting State:** `count = 0`, `enabled = false`.

**Step-by-Step Prediction:**
1. **Handler console output:** `0, false` (snapshot bindings).
2. **Pending count queue:** `setCount(0 + 1)` $\rightarrow 1$; `setCount(c => c + 1)` $\rightarrow 1 + 1 = 2$.
3. **Pending enabled update:** `true`.
4. **Next render console:** `render 2 true`.
5. **Button text:** `2:true`.

---

### 33. Senior Challenge — Identity + State
```javascript
function Parent({ userId }) {
  return <Editor key={userId} />;
}

function Editor() {
  const [draft, setDraft] = useState("");
  return <input value={draft} onChange={e => setDraft(e.target.value)} />;
}
```
* **Render #1 (`userId = A`):** User types `draft = "hello"`.
* **Render #2 (`userId = A`):** Key is `"A"` $\rightarrow$ Identity preserved $\rightarrow$ `draft` remains `"hello"`.
* **Render #3 (`userId = B`):** Key changes to `"B"` $\rightarrow$ Old instance unmounted, new instance mounted $\rightarrow$ `draft` resets to `""`.

---

### 34. Senior Challenge — State Modeling
**Inherited:**
```javascript
const [isLoading, setIsLoading] = useState(false);
const [isSuccess, setIsSuccess] = useState(false);
const [isError, setIsError] = useState(false);
const [data, setData] = useState(null);
const [error, setError] = useState(null);
```
**Senior Model:**
```typescript
type RequestState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };
```

---

### 35. Senior Challenge — Derived or Independent?
* `filteredProducts`: **Derived** (`products.filter(...)`).
* `selectedProduct`: **Derived** (`products.find(...)`).
* `draftProduct`: **Canonical State** (user editing lifecycle).
* `totalPrice`: **Derived** (`cart.reduce(...)`).
* `isModalOpen`: **Canonical State** (UI view state).
* `serverProduct`: **Canonical State** (server payload).
* `hasUnsavedChanges`: **Derived** (`draft !== server`).

---

### 36. Senior Challenge — Mutation Reference Graph
```javascript
// Mutation:
const next = previous;
next.user.name = "Grace";
return next;
```
```text
previous ──► Object A (mutated)
next     ──► Object A (same reference)
```

```javascript
// Immutable update:
const next = { ...previous, user: { ...previous.user, name: "Grace" } };
```
```text
previous ──► Object A (user: Object C)
next     ──► Object B (user: Object D)
```

---

### 37. Senior Challenge — Parent Update vs Child Reset
* Parent updates `count`: Child renders with preserved state.
* Modifying to `<Child key={count} />`: Every parent update changes child key, unmounting child and wiping its local draft state.

---

### 38. Senior Challenge — Production Incident: Table Sorting
* **Symptom:** Value typed into row 4 moves to row 1 after sorting.
* **Diagnosis:** `<Row key={index} />` binds state to index position.
* **Fix:** `<Row key={item.id} />` binds state to stable entity ID.

---

### 39. Senior Challenge — Production Incident: Modal Draft Loss
* **Investigation:** If `<Editor key={record.id} />` resets state when switching records, that is expected entity isolation. If the draft was intended to persist globally across records, state was placed too low.

---

### 40. Senior Challenge — Production Incident: Hook Overload
* 18 `useState` and 7 `useEffect` calls do not automatically warrant a global store. Map canonical facts vs derived data first, replace sync effects with render calculations, and combine cohesive transitions into a reducer.

---

### 41. Senior Architecture Review Matrix

| Question | Healthy Signal | Warning Signal |
| :--- | :--- | :--- |
| **What is state?** | Canonical facts | UI mirrors everywhere |
| **Who owns it?** | One clear owner | Multiple competing owners |
| **Why is it state?** | Independent lifecycle | Pure derivation |
| **How does it change?** | Explicit transitions | Scattered setters |
| **Is the model valid?** | Impossible states constrained | Boolean explosion |
| **Does state survive correctly?** | Lifetime matches concept | Accidental reset |
| **Are references meaningful?** | Structural sharing | Direct mutation |
| **Are entities unique?** | Stable identity | Duplicated objects |
| **Is state local?** | Smallest useful subtree | Global by default |
| **Are transitions related?** | Coherent model | Temporal coupling |
| **Are async updates safe?** | Functional updates where needed | Stale closures |
| **Is persistence intentional?** | Explicit storage boundary | React state treated as database |

---

### 42. Senior Gotchas

1. **A setter is not assignment:** `setCount(10)` does not rewrite `count = 10` in the current render.
2. **State is not the DOM:** Changing state schedules a render; it does not manually mutate DOM nodes.
3. **Rendering is not remounting:** Re-rendering preserves hook state when identity is stable.
4. **Changing props is not changing identity:** A component can receive new props while retaining its internal state.
5. **`useState(initial)` is not prop synchronization:** The initial value is only evaluated on mount.
6. **Keys are not refresh buttons:** Changing a key alters component identity and destroys all state/effects.
7. **Batching is not magic:** Batching optimizes render passes; it does not repair broken state machine invariants.
8. **More state is not more power:** Every state variable introduces an invariant to maintain.
9. **Fewer state variables is not automatically better:** Combining unrelated variables harms readability.
10. **A reducer is not an architecture replacement:** A reducer structures transitions, but you must still design the domain model.

---

### 43. Master State Mental Model

```text
┌────────────────────┐
│       PROPS        │
└─────────┬──────────┘
          │
          ▼
┌────────────────┐     ┌────────────────────┐
│   COMPONENT    │────►│  RENDER SNAPSHOT   │
│    IDENTITY    │     │                    │
└───────┬────────┘     │ props + state      │
        │              │ closures           │
        │              └─────────┬──────────┘
        │                        │
        │                        ▼
        │              ┌────────────────────┐
        │              │  DERIVED UI DATA   │
        │              └─────────┬──────────┘
        │                        │
        ▼                        ▼
┌────────────────┐     ┌────────────────────┐
│  STATE MEMORY  │◄────│   EVENT HANDLERS   │
│                │     │                    │
│   canonical    │     │ state updates      │
│     facts      │     │ callbacks          │
└───────┬────────┘     └─────────┬──────────┘
        │                        │
        │                        ▼
        │              ┌────────────────────┐
        └─────────────►│ UPDATE PROCESSING  │
                       └─────────┬──────────┘
                                 │
                                 ▼
                       ┌────────────────────┐
                       │    NEXT RENDER     │
                       └─────────┬──────────┘
                                 │
                                 ▼
                       ┌────────────────────┐
                       │   RECONCILIATION   │
                       └─────────┬──────────┘
                                 │
                                 ▼
                       ┌────────────────────┐
                       │       COMMIT       │
                       └────────────────────┘
```

---

### 44. Final Engineering Principle
> **If you cannot predict the next render, you do not yet understand the state architecture.**

A senior React engineer looks at:
$$\text{props} + \text{state} + \text{identity} + \text{event handler} + \text{update sequence}$$
and deterministically deduces:
$$\text{snapshot values} \longrightarrow \text{update queue} \longrightarrow \text{next state} \longrightarrow \text{next render snapshot} \longrightarrow \text{reconciliation} \longrightarrow \text{committed DOM}$$

---

### 45. 40-Point Mastery Checklist

- [x] **01.** Explain state as React-owned component memory.
- [x] **02.** Explain render snapshots.
- [x] **03.** Explain why event handlers see render-specific values.
- [x] **04.** Distinguish setter calls from JavaScript assignment.
- [x] **05.** Predict direct state updates.
- [x] **06.** Predict functional state updates.
- [x] **07.** Predict mixed update queues.
- [x] **08.** Explain update ordering.
- [x] **09.** Explain batching without equating it to domain atomicity.
- [x] **10.** Explain state replacement semantics.
- [x] **11.** Explain object identity.
- [x] **12.** Explain why mutation is problematic.
- [x] **13.** Perform immutable object updates.
- [x] **14.** Perform immutable nested updates.
- [x] **15.** Perform immutable array updates.
- [x] **16.** Explain structural sharing.
- [x] **17.** Distinguish canonical and derived state.
- [x] **18.** Identify redundant state.
- [x] **19.** Identify legitimate draft state.
- [x] **20.** Identify state invariants.
- [x] **21.** Detect impossible state combinations.
- [x] **22.** Model mutually exclusive states coherently.
- [x] **23.** Identify the authoritative owner.
- [x] **24.** Apply the narrowest common owner principle.
- [x] **25.** Reason about state lifetime.
- [x] **26.** Distinguish rendering from remounting.
- [x] **27.** Explain component identity.
- [x] **28.** Explain key-based identity.
- [x] **29.** Select stable entity keys.
- [x] **30.** Diagnose index-key state corruption.
- [x] **31.** Explain controlled ownership.
- [x] **32.** Explain uncontrolled ownership.
- [x] **33.** Distinguish `defaultValue` from value synchronization.
- [x] **34.** Recognize stale closures.
- [x] **35.** Use functional updates for dependent asynchronous changes.
- [x] **36.** Diagnose effect-based derived state.
- [x] **37.** Diagnose duplicated domain facts.
- [x] **38.** Diagnose over-lifted state.
- [x] **39.** Diagnose under-lifted state.
- [x] **40.** Predict state behavior before executing the application.

---

### 46. KPI 04 State Mastery Standard

```text
┌───────────────────────────────────────────────┐
│                 STATE REVIEW                  │
├───────────────────────────────────────────────┤
│  What are the canonical facts?                │
│  Who owns each fact?                          │
│  What is derived?                             │
│  What are the invariants?                     │
│  What transitions can occur?                  │
│  What state combinations are impossible?      │
│  What is the lifetime of each state value?    │
│  What identity preserves each state value?    │
│  What references must change?                 │
│  Which updates require functional form?       │
│  Which values are duplicated?                 │
│  Which effects are actually synchronization?  │
│  Which state belongs higher/lower in tree?    │
│  Can every render be predicted?               │
└───────────────────────────────────────────────┘
```

---

[⬅️ Previous Part](./14-state-architecture-review.md) | [📚 Level 06 Index](./README.md) | [🧪 Companion Lab](./examples/15-state-and-rendering-crucible.html) | [Next Part ➡️](./16-state-and-state-updates-final-review.html)
