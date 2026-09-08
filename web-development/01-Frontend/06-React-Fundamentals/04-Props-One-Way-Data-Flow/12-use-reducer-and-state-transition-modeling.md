Level 06 — React Fundamentals
KPI 04 — State & State Updates
PART 12 — useReducer & State Transition Modeling
[⬅️ Previous Part](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/11-state-architecture-complex-transitions.md) | [📚 Level 06 Index](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/README.md) | [🧪 Companion Lab](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/examples/12-use-reducer-state-transition-modeling.html) | [Next Part ➡️](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/13-state-persistence-and-derived-state-boundaries.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

1. Why useReducer Exists
`useReducer` does not create a fundamentally different kind of React state.
It provides a different way to organize state transitions.

With `useState`, transition logic commonly looks like:
```javascript
setStatus("loading");
setError(null);
setData(null);
```

With a reducer-oriented model:
```
event ↓ action ↓ reducer(state, action) ↓ next state ↓ render
```
The reducer centralizes the transition rule.

```
┌──────────────┐
│ User / Event │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Action    │
│ { type: ...} │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│       Reducer        │
│                      │
│   (state, action)    │
│          ↓           │
│      nextState       │
└──────────┬───────────┘
           │
           ▼
      React state
           │
           ▼
        Render
           │
           ▼
        Commit
```

The reducer is therefore best understood as:
> A pure transition function that maps current state + action to the next state.

2. Core API
The essential API is:
```javascript
const [state, dispatch] = useReducer(reducer, initialState);
```

Conceptually:
- `state` = current state snapshot
- `dispatch(action)` = request a state transition
- `reducer(state, action)` = calculate next state

The reducer itself:
```javascript
function reducer(state, action) {
  switch (action.type) {
    case "increment":
      return { ...state, count: state.count + 1 };
    default:
      return state;
  }
}
```
Then:
```javascript
dispatch({ type: "increment" });
```
The event does not directly manipulate the state fields.
It expresses intent.

3. Executive Concept Table
| Concept | Core Mechanism | Production Impact | Common Senior Trap |
| :--- | :--- | :--- | :--- |
| **useReducer** | State + centralized transition function | Makes complex transitions explicit | Using it merely because a component has multiple fields |
| **Reducer** | `(state, action) → nextState` | Centralizes state transition rules | Performing side effects inside it |
| **Action** | Description of an event/intent | Decouples event source from transition logic | Designing actions as setter commands |
| **dispatch** | Sends an action to the reducer | Creates a clear transition boundary | Expecting dispatch to synchronously mutate the current snapshot |
| **Initial state** | Starting state value | Defines initial state model | Treating it as a reset mechanism |
| **Pure reducer** | Same inputs → same output, no side effects | Predictability and testability | API calls, timers, logging with external effects inside reducer |
| **State invariant** | Relationship that valid state must satisfy | Prevents contradictory states | Assuming reducer automatically creates good invariants |
| **Action payload** | Data required for a transition | Keeps transition inputs explicit | Passing entire component implementation details |
| **Lazy initialization** | Computes initial reducer state | Useful for expensive initialization | Confusing initialization with every render |
| **Reducer composition** | Multiple transition domains | Helps organize large state models | Splitting reducers without real boundaries |
| **useState vs useReducer** | Two ways to manage local React state | Lets architecture match complexity | Treating reducer as inherently more senior |

4. Golden Rule
> 🏆 **Golden Rule:** Use `useReducer` when the important problem is coordinating state transitions—not merely when there are many state fields.

The progression should be:
```
Simple independent state ↓ useState ↓ Related transitions ↓ Explicit actions/invariants ↓ useReducer
```
Not:
```
Senior engineer ↓ useReducer everywhere
```

---

Layer 2 — 🔬 Deep Mechanical Breakdown

5. useState and useReducer Solve the Same Fundamental Problem
Both establish React-managed component state.

With `useState`:
```javascript
const [count, setCount] = useState(0);
```
With `useReducer`:
```javascript
const [state, dispatch] = useReducer(
  reducer,
  { count: 0 }
);
```
Both ultimately provide:
`persistent state across renders + an update mechanism + a new render after state changes`

The difference is primarily where transition logic lives.

6. Direct Setter Model
Consider:
```javascript
function Counter() {
  const [count, setCount] = useState(0);

  function increment() {
    setCount(c => c + 1);
  }

  return (
    <button onClick={increment}>
      {count}
    </button>
  );
}
```
The event handler contains the transition:
`increment ↓ count + 1`
This is excellent for simple state.

7. Reducer Model
Now:
```javascript
function reducer(state, action) {
  switch (action.type) {
    case "increment":
      return { ...state, count: state.count + 1 };
    default:
      return state;
  }
}
```
Component:
```javascript
function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });

  function increment() {
    dispatch({ type: "increment" });
  }

  return (
    <button onClick={increment}>
      {state.count}
    </button>
  );
}
```
Now:
```
click ↓ dispatch({ type: "increment" }) ↓ reducer(currentState, action) ↓ nextState ↓ render
```
The component says: “An increment happened.”
The reducer says: “Given an increment, this is how state changes.”
That separation is the architectural value.

8. Reducer as a Mathematical Function
The conceptual model is:
$$R : \text{State} \times \text{Action} \to \text{State}$$
Or:
$$\text{nextState} = \text{reducer}(\text{currentState}, \text{action})$$

For:
```javascript
function reducer(state, action) {
  switch (action.type) {
    case "increment":
      return { ...state, count: state.count + 1 };
    default:
      return state;
  }
}
```
we can model:
$$R(\{ \text{count}: 4 \}, \{ \text{type}: \text{"increment"} \}) = \{ \text{count}: 5 \}$$

This gives us an important property:
> The reducer describes state transition semantics independently from the UI event source.

9. Action Is an Event Description
A good action usually describes what happened.
For example:
```javascript
dispatch({ type: "itemAdded", item });
```
rather than:
```javascript
dispatch({ type: "setItems", items: nextItems });
```
The first says: *Something happened: itemAdded*.
The second says: *Here is an implementation-level state assignment*.
The former preserves more domain meaning.

10. Events vs Setters
Compare:
```javascript
setItems(prev => [...prev, item]);
```
with:
```javascript
dispatch({ type: "itemAdded", item });
```
The setter describes *how* state changes.
The action can describe *why* state changes.
This distinction becomes valuable when multiple components or event sources can cause the same transition.

11. Action Design
A strong action generally answers:
- What happened?
- What information is required to process it?

Example:
```javascript
{ type: "quantityChanged", productId: "p42", quantity: 3 }
```
The reducer owns the interpretation.

Avoid actions like:
```javascript
{ type: "setState", field: "whatever", value: ... }
```
when the domain actually has meaningful events.
Generic setter-style actions can turn a reducer into a disguised mutable state API.

12. Action Payloads
Payloads should contain the information required for the transition.
Example:
```javascript
dispatch({ type: "productSelected", productId });
```
The reducer can then calculate:
`selectedId = productId`

Do not necessarily send:
```javascript
dispatch({ type: "productSelected", product, products, selectedId, ... });
```
if the reducer can derive what it needs from its existing state.
The action should not become a duplicate state container.

13. Reducer Purity
A reducer should be conceptually:
```
input state + input action ↓ deterministic calculation ↓ next state
```
It should not perform:
- API requests
- timers
- DOM mutation
- subscriptions
- navigation
- side effects
- random external mutation

Bad:
```javascript
function reducer(state, action) {
  if (action.type === "save") {
    fetch("/api/save"); // ❌
    return ...
  }
}
```
The reducer should calculate state.
Effects belong outside the reducer.

14. Why Purity Matters
Suppose:
```javascript
function reducer(state, action) {
  return { ...state, count: state.count + 1 };
}
```
Given:
`state = { count: 5 }`, `action = { type: "increment" }`
the result is predictable:
`{ count: 6 }`

This allows:
- isolated testing
- deterministic reasoning
- replaying transitions conceptually
- inspecting action histories
- easier debugging

The reducer becomes a state-transition specification.

15. Reducer Does Not Mean Mutation Is Allowed
This is wrong:
```javascript
function reducer(state, action) {
  state.count += 1;
  return state;
}
```
The state object is still treated immutably.

Correct:
```javascript
function reducer(state, action) {
  return { ...state, count: state.count + 1 };
}
```
For nested state:
```javascript
return {
  ...state,
  user: {
    ...state.user,
    name: action.name
  }
};
```
The same reference and structural-sharing principles from earlier state Parts continue to apply.

16. Reducer Does Not Eliminate React State Semantics
This:
```javascript
dispatch({ type: "increment" });
console.log(state.count);
```
still observes the current render's state binding.
It does not synchronously rewrite that JavaScript variable.

The model remains:
```
Render #1 state.count = 0
│
▼ dispatch(...)
│
▼ transition requested
│
▼ future render
│
▼ Render #2 state.count = 1
```
The same render-snapshot model applies.

17. Prediction-First Walkthrough #1 — Basic Dispatch
Consider:
```javascript
function reducer(state, action) {
  switch (action.type) {
    case "increment":
      return { count: state.count + 1 };
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });

  function handleClick() {
    dispatch({ type: "increment" });
  }

  return (
    <button onClick={handleClick}>
      {state.count}
    </button>
  );
}
```

**Render #1**
State: `count = 0`.
The component produces: `<button>0</button>`.

**Event**
User clicks.
The handler dispatches: `{ type: "increment" }`.
The current snapshot remains: `count = 0` inside the already-running handler.

**Transition**
Conceptually:
`reducer({ count: 0 }, { type: "increment" })` returns `{ count: 1 }`.

**Render #2**
`count = 1`.
The new UI description becomes: `<button>1</button>`.

18. Prediction-First Walkthrough #2 — Multiple Dispatches
Consider:
```javascript
function handleClick() {
  dispatch({ type: "increment" });
  dispatch({ type: "increment" });
}
```
The two dispatches represent two actions.
Conceptually:
```
S0 = { count: 0 }
A1 = increment
A2 = increment

R(S0, A1) ↓ { count: 1 }
R(S1, A2) ↓ { count: 2 }
```
Final state: `count = 2`.
The key is that the reducer processes the state transitions in sequence.

19. Prediction-First Walkthrough #3 — Action Payload
Reducer:
```javascript
function reducer(state, action) {
  switch (action.type) {
    case "quantityChanged":
      return { ...state, quantity: action.quantity };
    default:
      return state;
  }
}
```
Dispatch:
```javascript
dispatch({ type: "quantityChanged", quantity: 4 });
```
If current state is: `quantity = 2`, the next state is: `quantity = 4`.

The reducer does not need to know whether the action originated from:
- a button
- an input
- keyboard interaction
- a test
- another event source

It only interprets the action.

20. Prediction-First Walkthrough #4 — Multiple Related Fields
Initial:
```javascript
const initialState = {
  status: "idle",
  data: null,
  error: null
};
```
Reducer:
```javascript
function reducer(state, action) {
  switch (action.type) {
    case "requestStarted":
      return { status: "loading", data: null, error: null };
    case "requestSucceeded":
      return { status: "success", data: action.data, error: null };
    case "requestFailed":
      return { status: "error", data: null, error: action.error };
    default:
      return state;
  }
}
```
This makes transitions explicit:
```
idle
 │
 │ requestStarted
 ▼
loading
 ├── requestSucceeded ──► success
 └── requestFailed ─────► error
```
The reducer now encodes the state architecture discussed in Part 11.

21. The Reducer as a State Invariant Boundary
Consider:
```javascript
case "requestSucceeded":
  return { status: "success", data: action.data, error: null };
```
The transition establishes:
`status = success`, `error = null`, `data = result`.
The reducer therefore becomes the place where the invariant is enforced.
This is one of the strongest reasons to use reducer modeling.

22. Unknown Actions
A reducer normally handles unknown actions by returning the existing state:
```javascript
default:
  return state;
```
Conceptually:
`unknown event ↓ no transition ↓ same state`

However, in larger systems, developers may choose stricter development-time validation.
The important architectural principle is:
> The reducer must have an explicit answer for every action category it is expected to process.

23. Lazy Initialization
`useReducer` supports an optional initialization function:
```javascript
const [state, dispatch] = useReducer(
  reducer,
  initialArg,
  init
);
```
Conceptually:
`initialArg ↓ init() ↓ initial state`
This is useful when initialization requires computation.

Example:
```javascript
function init(initialCount) {
  return { count: initialCount * 2 };
}

const [state, dispatch] = useReducer(
  reducer,
  5,
  init
);
```
Initial state becomes: `count = 10`.
Initialization is distinct from ordinary state transitions.

24. Initialization vs Reset
A common misunderstanding:
`init(initialArg)` does not mean: *run initialization on every render*.
It establishes the initial reducer state.

If the application needs a reset transition, model that explicitly:
```javascript
dispatch({ type: "reset" });
```
For example:
```javascript
case "reset":
  return initialState;
```
The semantics are different:
- **Initialization:** component state creation
- **Reset action:** runtime transition

25. Reset and Initial Arguments
If reset depends on the original input:
```javascript
function reducer(state, action) {
  switch (action.type) {
    case "reset":
      return action.initialState;
    default:
      return state;
  }
}
```
or use an initializer architecture that makes the reset source explicit.
The important thing is to avoid confusing:
`props changed` with `state automatically resets`.
React does not infer that relationship.

26. useReducer Does Not Automatically Solve Prop Synchronization
This is still problematic:
```javascript
function Editor({ user }) {
  const [state, dispatch] = useReducer(
    reducer,
    user
  );
}
```
Changing `user` does not automatically mean: `state = new user`.
The reducer's state has its own lifetime.
If the application intentionally needs synchronization, that must be architecturally defined.
If the desired behavior is a fresh component state for a different entity, component identity/key modeling may be more appropriate.

27. Action Semantics vs Setter Leakage
With `useState`, a child might receive: `setItems`.
This exposes implementation details.

With reducer architecture: `dispatch` can still be overly broad if exposed indiscriminately.
Better component boundaries may expose semantic callbacks:
```javascript
onItemAdded(item)
onItemRemoved(id)
onCheckoutSubmitted()
```
The reducer remains an implementation mechanism.
Do not assume `dispatch` is automatically a better public API than `onChange`.
Architecture still determines the correct boundary.

28. Dispatch Is a Capability
A dispatch function is effectively a capability to request transitions.
If you pass:
```jsx
<Child dispatch={dispatch} />
```
the child may potentially dispatch every action the reducer supports.
That can be excessive.

Compare:
```jsx
<Child onAddItem={handleAddItem} />
```
where the child receives a narrow capability.
The same principle from callback API design applies:
> Expose the narrowest capability required by the consumer.

29. Reducer Scope
A reducer should have a coherent state domain.

**Good:**
```
Checkout reducer
├── step
├── shipping
├── payment
└── submission status
```

**Questionable:**
```
Application reducer
├── theme
├── authentication
├── cart
├── modal
├── search
├── notifications
└── unrelated feature state
```
A reducer is not a justification for creating a giant local state object.

30. Reducer vs Giant Object
This:
```javascript
const [state, dispatch] = useReducer(reducer, {
  theme: "dark",
  modalOpen: false,
  search: "",
  cart: [],
  editor: {},
  notifications: []
});
```
is still architecturally questionable.
The reducer has not magically created cohesion.
The same question remains:
> Do these values belong to the same state domain?

31. Reducer vs useState
**Prefer useState when:**
- simple state
- few transitions
- independent values
- local update logic
- minimal invariants
Example: `const [isOpen, setIsOpen] = useState(false);`

**Prefer useReducer when:**
- many related transitions
- strong invariants
- multiple event types
- state transitions are easier to describe as actions
- transition logic is becoming scattered
- testing transition rules independently is valuable

32. Do Not Use useReducer Because It “Looks Senior”
This is a particularly dangerous engineering habit.
Code such as:
```javascript
const [state, dispatch] = useReducer(
  reducer,
  { open: false }
);
```
for a simple modal does not necessarily improve architecture.
Compare: `const [open, setOpen] = useState(false);`

If the state is:
- one concept
- two transitions
- no meaningful invariant
`useState` is likely clearer.

Senior engineering is not maximizing abstraction.
It is choosing the simplest mechanism that preserves the required semantics.

33. Reducer Testing Advantage
A reducer can be tested independently.
Example:
```javascript
const initialState = {
  status: "idle",
  data: null,
  error: null
};

expect(
  reducer(initialState, { type: "requestStarted" })
).toEqual({
  status: "loading",
  data: null,
  error: null
});
```
The test asks directly:
*Given this state and this event, what state should result?*
That aligns naturally with the transition model.

34. Reducer Testing Is Not UI Testing
Testing the reducer does not prove:
- the button dispatches the correct action
- the component renders the correct UI
- the event wiring is correct
- accessibility is correct
- effects behave correctly

It tests one architectural boundary:
$$\text{state} + \text{action} \to \text{next state}$$
The component contract still requires its own tests.

35. Reducer and Effects
Suppose:
`SUBMIT` causes: `state → loading`.
Then an external request happens.
When it completes: `SUCCESS` can be dispatched.

Conceptually:
```
UI event ↓ dispatch(SUBMIT) ↓ reducer ↓ loading ↓ external effect ↓ dispatch(SUCCESS) ↓ reducer ↓ success
```
The reducer models state.
The external effect performs external work.
Do not put the request itself inside the reducer.

36. Production Anti-Pattern — Side Effects in Reducers
**Bad:**
```javascript
function reducer(state, action) {
  switch (action.type) {
    case "submit":
      fetch("/api/orders");
      return { ...state, status: "loading" };
  }
}
```
**Why developers do it:**
“The reducer is where the submit transition lives, so the request belongs there.”

**Mechanical failure:**
`state transition + external effect` become coupled.
This undermines reducer purity and makes transition behavior harder to reason about.

**Senior architecture:**
```
event ├── state transition → reducer
      └── external work → effect/event orchestration
```

37. Production Anti-Pattern — Dispatching Setter Actions
Example:
```javascript
dispatch({ type: "setStatus", value: "loading" });
dispatch({ type: "setError", value: null });
dispatch({ type: "setData", value: null });
```
This recreates setter-driven architecture under a different API.

**A stronger action:**
```javascript
dispatch({ type: "requestStarted" });
```
The reducer owns the transition.

38. Production Anti-Pattern — Action Contains Complete Next State
**Bad:**
```javascript
dispatch({
  type: "stateChanged",
  state: { status: "success", data, error: null }
});
```
This effectively moves the reducer's responsibility into the event producer.
The action becomes a transport mechanism for the entire next state.
That reduces the value of centralized transition logic.

39. Production Anti-Pattern — Reducer Mutates State
**Bad:**
```javascript
function reducer(state, action) {
  state.items.push(action.item);
  return state;
}
```
**Failure:**
`previous state object ↓ mutated directly ↓ same reference returned`
This violates predictable state-update semantics.

**Correct:**
```javascript
function reducer(state, action) {
  return {
    ...state,
    items: [...state.items, action.item]
  };
}
```

40. Production Anti-Pattern — One Reducer for Everything
**Bad:**
```
FeaturePageReducer
├── authentication
├── cart
├── theme
├── notifications
├── search
├── modal
├── editor
└── unrelated feature state
```
This is merely a giant state object with a reducer attached.
The reducer's scope should match a coherent state domain.

41. Production Incident — Scattered Transition Logic
**Symptom:**
A checkout submission behaves inconsistently. Some paths produce `loading` but retain an old error. Other paths clear the error but forget to clear stale data.

**Original architecture:**
```
Component A ├── setLoading() └── setError()
Component B ├── setData() └── setLoading()
Effect C └── setError()
```
**Root Cause:**
One conceptual state machine was distributed across multiple mutation sites.

**Senior Refactoring:**
Define actions: `SUBMIT`, `SUCCESS`, `FAILURE`, `RESET`, and centralize transition semantics.

42. Production Incident — Reducer Used as an API Boundary
A component exposes:
```jsx
<Checkout dispatch={dispatch} />
```
The child starts dispatching:
`setStep`, `setShipping`, `setPayment`, `setError`, `setStatus`, `reset`.
The child now knows the parent's internal reducer vocabulary.
The reducer has become an accidental public API.

**Senior fix:**
```
Parent state domain
│
├── semantic child callback
▼ parent action
▼ reducer
```
Keep implementation vocabulary behind architectural boundaries when possible.

43. Production Incident — Over-Reducerization
A simple:
```javascript
const [open, setOpen] = useState(false);
```
was replaced with:
```javascript
const initialState = { open: false };

function reducer(state, action) {
  switch (action.type) {
    case "OPEN":
      return { ...state, open: true };
    case "CLOSE":
      return { ...state, open: false };
    default:
      return state;
  }
}
```
The new version introduces: action vocabulary, reducer indirection, object state, dispatch calls, switch logic, without solving a meaningful architectural problem.
This is abstraction without complexity reduction.

44. DevTools Diagnostic — Dispatch Trace
When debugging a reducer-driven component, record:
```
Render snapshot ↓ Event ↓ Action ↓ Reducer input state ↓ Reducer output state ↓ Render ↓ Commit
```
Example:
```
R1: status = idle
Event: submit
Action: { type: "requestStarted" }
Reducer: idle → loading
R2: status = loading
```
This gives a precise transition trace.

45. Diagnostic Lab — Reducer Transition Table
Create:
| Current State | Action | Next State |
| :--- | :--- | :--- |
| `idle` | `requestStarted` | `loading` |
| `loading` | `requestSucceeded` | `success` |
| `loading` | `requestFailed` | `error` |
| `error` | `retry` | `loading` |
| `success` | `reset` | `idle` |
| `error` | `reset` | `idle` |

Then ask:
- Which actions are valid?
- Which are ignored?
- Which should be impossible?
- Which require payloads?

This is architecture work, not merely syntax work.

46. Diagnostic Lab — Pure Reducer Verification
For each reducer case:
- [ ] Reads state
- [ ] Reads action
- [ ] Calculates next state
- [ ] Does not mutate previous state
- [ ] Does not perform external side effects
- [ ] Preserves unrelated state
- [ ] Establishes required invariants
- [ ] Returns a valid state shape

47. Diagnostic Lab — Reference Identity
For:
```javascript
return { ...state, status: "loading" };
```
the root object changes: `prev !== next`, while unchanged nested references can remain shared.

Inspect:
```javascript
console.table({
  rootChanged: !Object.is(prev, next),
  itemsShared: Object.is(prev.items, next.items)
});
```
This connects reducer design directly to the immutability and structural-sharing concepts from Parts 04 and 08.

---

Layer 4 — 🔥 The Crucible

48. Crucible Challenge 1 — Choose the Mechanism
For each case, choose `useState`, `useReducer`, or `derived value`:
- **A:** `isMenuOpen` with only open/close transitions $\to$ `useState`
- **B:** `request status`, `data`, `error`, `retry`, `reset` with mutually exclusive request states $\to$ `useReducer`
- **C:** `itemCount = items.length` $\to$ `derived value`
- **D:** `theme`, `sidebarOpen`, `searchQuery` with independent lifetimes $\to$ `useState` (separate cells)
Explain every decision.

49. Crucible Challenge 2 — Action Design
Given: A user changes a product quantity.
Compare:
```javascript
dispatch({ type: "setState", field: "quantity", value: 3 });
```
with:
```javascript
dispatch({ type: "quantityChanged", productId, quantity: 3 });
```
Which better expresses domain intent? Why?

50. Crucible Challenge 3 — Reducer Prediction
Given:
```javascript
const initialState = { count: 0 };

function reducer(state, action) {
  switch (action.type) {
    case "add":
      return { count: state.count + action.amount };
    case "multiply":
      return { count: state.count * action.amount };
    default:
      return state;
  }
}
```
Dispatch:
```javascript
dispatch({ type: "add", amount: 2 });
dispatch({ type: "multiply", amount: 3 });
```
Predict the final state: $(0 + 2) \times 3 = 6$.

51. Crucible Challenge 4 — Side Effect Boundary
Given:
```javascript
function reducer(state, action) {
  switch (action.type) {
    case "submit":
      fetch("/api/save");
      return { ...state, status: "loading" };
    default:
      return state;
  }
}
```
Identify:
- The architectural violation (Side effect in pure function).
- Why it harms predictability (Unrepeatable, untestable, multiple calls on re-renders).
- Where the external request should conceptually live (Event handler or orchestrated effect).
- What action should represent its completion (`saveSucceeded` / `saveFailed`).

52. Crucible Challenge 5 — Invariant Enforcement
Design a reducer for:
`idle | loading | success(data) | error(message)`
Rules:
- `success` must contain data
- `error` must contain an error
- `loading` cannot contain an error
Define actions: `SUBMIT`, `SUCCESS`, `FAILURE`, `RESET`.
Then specify the exact state returned by each transition.

53. Crucible Challenge 6 — Dispatch Boundary
A child receives:
`<Child dispatch={dispatch} />`
and starts dispatching: `setName`, `setEmail`, `setStep`, `setStatus`, `setError`, `reset`.
Explain why this can be a component architecture problem even though the reducer itself is well written (Leaks broad mutation authority to child).

54. Crucible Challenge 7 — Overengineering
A component contains:
```javascript
const [open, setOpen] = useState(false);
```
Someone proposes replacing it with `useReducer`.
Should you accept? What complexity would justify the migration?

55. Crucible Challenge 8 — Reducer Purity
Given:
```javascript
function reducer(state, action) {
  console.log("transition");
  return { ...state, count: state.count + 1 };
}
```
Is the reducer still conceptually pure?
Distinguish observational/debug logging from external state-changing side effects and explain why production reducer code should remain as deterministic as practical.

56. Crucible Challenge 9 — Mutation
Given:
```javascript
function reducer(state, action) {
  state.user.name = action.name;
  return state;
}
```
Explain:
1. Which object was mutated? (`state.user`)
2. What reference identity changed? (None)
3. What reference identity stayed the same? (`state`, `state.user`)
4. Why is this incompatible with predictable immutable state transitions?
5. How should the transition be rewritten?

57. Crucible Challenge 10 — Full Transition Model
Design the state architecture for:
> A shopping-cart editor allows adding products, removing products, changing quantities, selecting a product, submitting an order, receiving success/failure, and resetting the checkout.

Define:
1. Canonical state
2. Derived state
3. Actions
4. Reducer transitions
5. Invariants
6. State ownership
7. Public child callbacks
8. External side effects
9. Reset semantics
10. Cases where `useState` remains appropriate

58. Senior Architecture Decision Matrix
| Question | useState | useReducer |
| :--- | :---: | :---: |
| **One simple state value** | ✅ Strong fit | ❌ Usually unnecessary |
| **Few independent values** | ✅ Strong fit | ⚠️ Maybe |
| **Many related fields** | ⚠️ Depends | ✅ Often useful |
| **Strong invariants** | ⚠️ Manual coordination | ✅ Explicit transition boundary |
| **Many event types** | ⚠️ Can scatter logic | ✅ Natural fit |
| **Complex transition graph** | ⚠️ Becomes difficult | ✅ Strong fit |
| **Simple toggle** | ✅ Excellent | ❌ Overkill |
| **Need isolated transition tests** | ⚠️ Possible | ✅ Natural |
| **Need explicit action semantics** | ⚠️ Not inherent | ✅ Natural |
| **Side effects** | Effects/events | Effects/events, not reducer |
| **Giant unrelated state** | ❌ Bad | ❌ Still bad |
| **Performance by itself** | Not inherently better | Not inherently better |
| **“Senior-looking code”** | Irrelevant | Irrelevant |

59. Senior Gotchas
- **Gotcha 1:** “useReducer is for global state.”  
  ❌ False. It manages local component state.
- **Gotcha 2:** “Reducers are faster than useState.”  
  ❌ Not as a general architectural rule. Choose based on transition complexity.
- **Gotcha 3:** “Dispatch immediately changes state.”  
  ❌ False. It requests a state update for future rendering.
- **Gotcha 4:** “Reducers can mutate state because they centralize it.”  
  ❌ False. Reducer state still requires predictable immutable transitions.
- **Gotcha 5:** “Every action should be a setter.”  
  ❌ No. Prefer meaningful events when domain semantics exist.
- **Gotcha 6:** “Passing dispatch is always cleaner.”  
  ❌ No. A broad dispatch capability can leak internal architecture across component boundaries.
- **Gotcha 7:** “A reducer prevents invalid states automatically.”  
  ❌ No. The reducer must be designed to enforce the intended invariants.
- **Gotcha 8:** “The reducer is where API calls belong.”  
  ❌ No. Reducers calculate state; external effects perform external work.
- **Gotcha 9:** “One reducer is cleaner than multiple state domains.”  
  ❌ Not necessarily. A reducer should have a coherent responsibility.
- **Gotcha 10:** “More explicit architecture is always better.”  
  ❌ No. Explicitness has a complexity cost. The correct architecture is the simplest one that makes the required state transitions reliable.

60. Completion Checklist

**Core API**
- [ ] Explain `useReducer`.
- [ ] Explain `state`.
- [ ] Explain `dispatch`.
- [ ] Explain `reducer`.
- [ ] Explain `initialState`.
- [ ] Explain `initialArg`.
- [ ] Explain lazy initialization.
- [ ] Distinguish initialization from reset.

**Transition Model**
- [ ] Define a reducer as `(state, action) → nextState`.
- [ ] Explain action semantics.
- [ ] Design semantic actions.
- [ ] Design appropriate action payloads.
- [ ] Explain action ordering.
- [ ] Predict multiple dispatches.
- [ ] Explain reducer transition boundaries.
- [ ] Model state invariants.
- [ ] Model impossible states.
- [ ] Build transition tables.

**Immutability**
- [ ] Never mutate reducer state directly.
- [ ] Create new state objects when appropriate.
- [ ] Preserve structural sharing.
- [ ] Understand nested immutable updates.
- [ ] Understand reference identity.
- [ ] Explain why returning a mutated state object is problematic.

**Purity**
- [ ] Keep reducers deterministic.
- [ ] Avoid API calls inside reducers.
- [ ] Avoid timers inside reducers.
- [ ] Avoid DOM mutation inside reducers.
- [ ] Separate state calculation from external effects.
- [ ] Explain why reducer purity improves testability.

**Architecture**
- [ ] Know when `useState` is simpler.
- [ ] Know when `useReducer` is justified.
- [ ] Avoid reducerization for simple state.
- [ ] Avoid giant reducer state.
- [ ] Keep reducer scope coherent.
- [ ] Avoid generic setter actions when domain actions are clearer.
- [ ] Avoid leaking dispatch unnecessarily.
- [ ] Keep component boundaries explicit.
- [ ] Preserve state ownership.
- [ ] Separate derived state from canonical state.

**Prediction**
- [ ] Predict dispatch behavior from a render snapshot.
- [ ] Predict multiple actions.
- [ ] Predict payload-driven transitions.
- [ ] Predict invariant-preserving transitions.
- [ ] Explain why dispatch does not synchronously mutate the current binding.
- [ ] Trace `reducer → render → reconciliation → commit`.

61. Final Engineering Principle
> 🏆 **`useReducer` is not “more powerful state.” It is a more explicit transition architecture.**

The progression should be:
```
Simple state ↓ useState ↓ Related state ↓ Shared invariants ↓ Multiple meaningful events ↓ Explicit transition model ↓ useReducer
```

And the core mathematical model should remain:
```
ACTION
  │
  ▼
┌─────────────────┐
│     REDUCER     │
│                 │
│ state + action  │
│        ↓        │
│    next state   │
└────────┬────────┘
         │
         ▼
    React State
         │
         ▼
  Render Snapshot
         │
         ▼
  Reconciliation
         │
         ▼
       Commit
```

The senior engineer does not ask:
“Should I use useReducer?” first.
They ask:
> “Is my state transition system complex enough that explicit action → reducer → next-state modeling makes the architecture clearer and safer?”

If yes, `useReducer` is a natural React primitive.
If no, `useState` may be the better engineering decision.

62. KPI 04 Boundary
This Part establishes:
- `useReducer`
- reducer semantics
- action design
- dispatch semantics
- pure transition functions
- reducer state modeling
- invariant enforcement
- immutable reducer updates
- reducer testing
- transition tables
- side-effect boundaries
- reducer/component API boundaries
- `useState` vs `useReducer` decision-making

**Deferred:**
- advanced reducer composition
- external state stores
- sophisticated state-machine libraries
- Redux architecture
- concurrent state transitions
- React scheduler lanes
- server state
- advanced async orchestration
- distributed state synchronization

Those belong to later curriculum boundaries.

63. Master Mental Model
The complete state architecture established across KPI 04 is now:
```
USER / SYSTEM EVENT
        │
        ▼
 ACTION / UPDATE
        │
 ┌──────┴──────┐
 │             │
useState  useReducer
 │             │
 │      ┌──────▼──────┐
 │      │   REDUCER   │
 │      │             │
 │      │state+action │
 │      └──────┬──────┘
 │             │
 └─────────────┬────────────┘
               ▼
           NEXT STATE
               │
               ▼
        RENDER SNAPSHOT
               │
               ▼
         JSX / Elements
               │
               ▼
         Reconciliation
               │
               ▼
             Commit
               │
               ▼
              DOM
               │
               ▼
     Browser-visible result
```

And the architectural hierarchy is:
```
Component
├── Ownership
├── Canonical State
├── State Invariants
├── Events / Actions
├── State Transitions
├── Derived Data
└── Rendered UI
```

The central lesson of KPI 04 is therefore:
> **State is not merely data stored between renders. State is a model of changing information, and state updates are transitions through that model.**

Once that distinction becomes natural, `useState` and `useReducer` stop being competing APIs and become two mechanisms for expressing the same deeper React principle:
```
event → state transition → new snapshot → UI projection → reconciliation → commit
```
That is the foundation for the next state-architecture boundary.
