# Level 06 — React Fundamentals
## KPI 05 — Events & User Interaction
### PART 10 — Event-Driven State Architecture

[⬅️ Previous Part](09-event-driven-state-transitions.md) | [📚 Level 06 Index](README.md) | [🧪 Companion Lab](examples/10-event-driven-state-architecture.html) | [Next Part ➡️](11-event-driven-state-architecture-in-complex-components.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

## Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

### 1. The Core Problem
A React event handler is easy to write:
```tsx
<button onClick={handleSave}>Save</button>
```

But production interaction architecture becomes difficult when one user action must:
- Interpret an event,
- Validate input,
- Update several pieces of state,
- Trigger an asynchronous operation,
- Prevent duplicate actions,
- Preserve invariants,
- Communicate with parent components,
- Update loading/error/success state,
- And remain debuggable.

The senior-level problem is therefore not: *“How do I handle a click?”* It is:
> **How do I convert user events into predictable state transitions while keeping rendering, state ownership, and side effects correctly separated?**

The fundamental architecture is:

```
┌──────────────────────┐
│   User Interaction   │
│ click / input / key  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Event Interpretation │
│   What happened?     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Domain Action/Event  │
│    SAVE_REQUESTED    │
│    ITEM_SELECTED     │
│    SEARCH_CHANGED    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   State Transition   │
│   previous state     │
│         +            │
│       action         │
│         ↓            │
│     next state       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│     React Render     │
│  new state snapshot  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│        Commit        │
│       DOM / UI       │
└──────────────────────┘
```

External systems (network / browser API / storage / timers) should not be confused with pure state transition logic.

---

### 2. Event vs State
One of the most important distinctions in interaction architecture:

- **Event:** Describes something that *happened* (historical fact).
  - `USER_TYPED`, `BUTTON_CLICKED`, `FORM_SUBMITTED`, `ITEM_SELECTED`, `MODAL_CLOSED`, `RETRY_REQUESTED`
- **State:** Describes what is *true now* (current condition).
  - `query = "react"`, `status = "loading"`, `selectedId = "42"`, `isOpen = true`, `error = null`

$$\text{Event} = \text{historical fact} \qquad \text{State} = \text{current condition}$$

**Example:** `USER_SUBMITTED_FORM` is not state. The resulting state might be:
```typescript
{ status: "submitting", error: null }
```

This distinction prevents a huge class of React designs where developers accidentally store actions as state.

---

### 3. The Event $\rightarrow$ Action $\rightarrow$ Transition $\rightarrow$ Render Model
```
Browser Event
     │
     ▼
React Handler
     │
     ▼
Action / Domain Fact
     │
     ▼
State Transition
     │
     ▼
React Update
     │
     ▼
Render Snapshot
     │
     ▼
   Commit
```

**Example:**
```tsx
function SearchBox() {
  const [query, setQuery] = useState("");

  function handleChange(event) {
    setQuery(event.target.value);
  }

  return <input value={query} onChange={handleChange} />;
}
```

Mechanically:
$$\text{Browser input} \longrightarrow \text{React dispatch} \longrightarrow \text{handleChange(event)} \longrightarrow \text{extract target.value} \longrightarrow \text{setQuery("react")} \longrightarrow \text{scheduled render} \longrightarrow \text{value="react"} \longrightarrow \text{DOM commit}$$

---

### 4. The Four Responsibilities of a Good Event Handler
1. **Interpret**
2. **Validate**
3. **Dispatch / update**
4. **Coordinate effects when necessary**

```tsx
function handleSubmit(event) {
  event.preventDefault();
  const normalizedEmail = email.trim();
  if (!normalizedEmail) {
    setError("Email is required");
    return;
  }
  submitEmail(normalizedEmail);
}
```

As complexity increases, a cleaner architecture becomes:
```tsx
function handleSubmit(event) {
  event.preventDefault();
  dispatch({ type: "SUBMIT_REQUESTED", email });
}
```
$$\text{idle} \xrightarrow{\text{SUBMIT\_REQUESTED}} \text{submitting} \longrightarrow \text{async effect} \longrightarrow \text{SUCCESS / FAILURE}$$

---

### 5. Pure Transition Logic
$$\text{nextState} = \text{transition}(\text{previousState}, \text{action})$$

```tsx
function reducer(state, action) {
  switch (action.type) {
    case "OPEN":
      return { ...state, isOpen: true };
    case "CLOSE":
      return { ...state, isOpen: false };
    default:
      return state;
  }
}
```
$$\text{same state} + \text{same action} \implies \text{same next state}$$

---

### 6. Senior Architecture Rule
> **Keep event interpretation, state transition, and external side effects conceptually separate even when they temporarily live in the same component.**

```
Simple interaction:
  handler ──► setState

Moderate interaction:
  handler ──► dispatch(action) ──► reducer

Complex workflow:
  handler ──► action ──► state transition ──► effect / external operation ──► success/failure action ──► state transition
```

---

### 7. Executive Concept Table

| Concept | Core Mechanism | Production Impact | Common Senior Trap |
| :--- | :--- | :--- | :--- |
| **Event** | Something happened | Drives interaction | Treating it as persistent state |
| **Action** | Structured representation of an event | Makes transitions explicit | Designing meaningless action types |
| **State** | Current UI condition | Determines rendering | Storing historical events as state |
| **Transition** | State + action $\rightarrow$ next state | Predictability | Mixing network calls into pure transitions |
| **Reducer** | Central transition function | Complex state becomes inspectable | Using reducers for every tiny state value |
| **Effect** | Synchronization with external systems | Handles side effects | Using effects as ordinary event handlers |
| **State ownership** | Determines where truth lives | Prevents synchronization bugs | Duplicating the same source of truth |
| **Invariant** | Rule that must always hold | Prevents impossible UI states | Enforcing invariants only in event handlers |
| **Action payload** | Data required by transition | Preserves event context | Passing arbitrary component internals |
| **Command** | Request to perform an operation | Useful for imperative boundaries | Confusing commands with facts |
| **Domain event** | Statement that something happened | Useful for decoupled workflows | Inventing unnecessary event systems |
| **Async status** | Explicit lifecycle state | Prevents ambiguous UI | `isLoading` without request identity |
| **Request identity** | Identifies which response belongs to which request | Prevents stale-response bugs | Assuming completion order equals request order |
| **Functional update** | Transition from latest state | Avoids stale closure updates | Using captured state for dependent updates |

---

### 8. Golden Rule
> **Events describe what happened. State describes what is true. Transition logic decides how state changes. Effects synchronize with systems outside React.**

If those four concepts become mixed together, interaction code becomes increasingly difficult to predict.

---

## Layer 2 — 🔬 Deep Mechanical Breakdown

### 9. Why Event-Driven Architecture Matters in React
Consider a growing Editor component:
```tsx
function Editor() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await saveDocument({ title, body });
      setSaving(false);
    } catch (error) {
      setSaving(false);
      setError(error.message);
    }
  }

  return ( /* ... */ );
}
```

When the editor gains autosave, retry, publish, draft restoration, dirty-tracking, and request cancellation, a procedural `handleSave` degenerates into an unmaintainable 15-step monolith. This is a state architecture problem.

---

### 10. State Should Represent the Domain, Not the Implementation History
- **Bad:** `const [didUserClickSave, setDidUserClickSave] = useState(false);`
- **Better:** `const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");`

The UI does not need to know that the user clicked button #2; it needs to know whether the document is currently saving.

---

### 11. State Invariants
- If `status === "saving"`, then `saveError` must be `null`.
- If `selectedId !== null`, then `selectedId` must identify an existing item.
- If modal is closed, modal-specific interaction state must not affect visible UI.

`{ status: "saving", error: null }` is far more resilient than `{ isSaving: true, hasSaved: true, hasError: false, isRetrying: false }`.

---

### 12. Boolean Explosion
4 independent booleans $\implies 2^4 = 16$ states.  
Replacing with `status: "idle" | "loading" | "success" | "error" | "retrying"` reduces the state space to 5 mutually exclusive values.

---

### 13. Reducers as Explicit Transition Tables
```tsx
const [state, dispatch] = useReducer(reducer, initialState);

function reducer(state, action) {
  switch (action.type) {
    case "SAVE_REQUESTED":
      return { ...state, status: "saving", error: null };
    case "SAVE_SUCCEEDED":
      return { ...state, status: "saved", error: null };
    case "SAVE_FAILED":
      return { ...state, status: "error", error: action.error };
    default:
      return state;
  }
}
```

```
                 SAVE_SUCCEEDED
              ┌──────────────────┐
              │                  ▼
┌───────┐     │               ┌───────┐
│ idle  │─────┴──────────────►│saving │
└───────┘     SAVE_REQUESTED  └───┬───┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
              SAVE_SUCCEEDED               SAVE_FAILED
                    │                           │
                    ▼                           ▼
                  saved                       error
```

---

### 14. Reducers Do Not Make Code Automatically Better
Do not use a reducer for a simple counter or single toggle. A reducer is justified when multiple fields transition together, invariants must be preserved, and transitions need explicit testing.

---

### 15. Action Design
- **Good:** `{ type: "ITEM_SELECTED", itemId: "42" }`, `{ type: "SAVE_FAILED", error }`
- **Weak:** `{ type: "SET_STATE", value: ... }` (exposes raw implementation rather than domain meaning).

---

### 16. Commands vs Events
- **Command (Imperative):** `SAVE_DOCUMENT`, `DELETE_ITEM`
- **Event (Descriptive):** `DOCUMENT_SAVED`, `ITEM_DELETED`

---

### 17. Do Not Confuse `dispatch` with an External Event Bus
`dispatch` in React is a local state transition trigger, not a global pub/sub bus. Keep it local unless cross-feature architecture is required.

---

### 18. Event Interpretation Belongs Near the Interaction Boundary
```tsx
// Prefer:
function handleChange(event) {
  dispatch({ type: "SEARCH_CHANGED", query: event.target.value });
}

// Avoid:
dispatch({ type: "SEARCH_CHANGED", event });
```

---

### 19. Why Passing Raw DOM Events Deeper Is Usually Weak
Passing raw SyntheticEvents into reducers couples transition logic to `event.preventDefault`, `event.target`, and DOM structures.

---

### 20. The Render Snapshot Constraint
```tsx
function handleClick() {
  setCount(count + 1);
  setCount(count + 1); // Both evaluate 0 + 1 from Render #1 snapshot
}
```
For sequential transitions, functional updates (`setCount(c => c + 1)`) compose correctly.

---

### 21. Event Handler $\neq$ Live Mutable Controller
Event handlers execute using the render snapshot that created them. State updates schedule future renders.

---

### 22. Event $\rightarrow$ State Transition $\rightarrow$ Render Timeline
`setOpen(true)` does not directly modify the DOM. It schedules a state transition; React renders the next snapshot, reconciles fibers, and commits DOM mutations.

---

### 23. Important Boundary: State Transition Is Not DOM Mutation
$$\text{Event} \longrightarrow \text{State update} \longrightarrow \text{Render} \longrightarrow \text{Element comparison} \longrightarrow \text{Commit} \longrightarrow \text{DOM mutation}$$

---

### 24. Side Effects
A reducer must remain a pure function. Never put `fetch()`, `localStorage`, or timer calls inside a reducer.

---

### 25. Pure Transition vs External Synchronization
```
Reducer:
  state + action ──► nextState (Pure calculation)

Effect / External Operation:
  action ──► async fetch ──► SAVE_SUCCEEDED / SAVE_FAILED ──► Reducer nextState
```

---

### 26. Effects Should Synchronize, Not Replace Event Modeling
Avoid flags whose sole purpose is triggering a `useEffect` (`if (shouldSave) saveDocument()`). Handle user-triggered actions directly in handlers.

---

### 27. Async Event Architecture
$$\text{request order} \neq \text{response order}$$
In search auto-complete, slow earlier queries (`request("r")`) must not overwrite fast subsequent responses (`request("react")`).

---

### 28. Request Identity
Track an incrementing `requestId` or active query key to discard out-of-order asynchronous responses.

---

### 29. Stale Response Failure
If Request A (`"cat"`) resolves after Request B (`"car"`), without request identity guards, the UI displays `query = "car"` with `results = "cat"`.

---

### 30. Interaction State vs Server State
- **Interaction state:** `isModalOpen`, `selectedTab`, `draftText`.
- **Server state:** `users`, `orders`, `permissions`.

---

### 31. State Ownership
Lift shared state (`query`) to the common parent (`SearchPage`) rather than synchronizing duplicate state copies across child components.

---

### 32. Controlled Interaction Architecture
Child emits `onChange(value)`; parent decides what that interaction means for application state.

---

### 33. Event Contracts
Expose minimal semantic contracts: `onSelect(id)`, `onDelete(id)`, `onSubmit(values)` instead of `onClick(event)`.

---

### 34. Event Contract Layer
$$\text{DOM} \longrightarrow \text{React event} \longrightarrow \text{component interpretation} \longrightarrow \text{semantic callback} \longrightarrow \text{parent transition}$$

---

### 35. When a Handler Should Remain Imperative
For simple one-off actions (`navigator.clipboard.writeText(text)`), direct imperative handlers are completely appropriate.

---

### 36. The Complexity Escalation Ladder
1. **Level 1:** `handler -> setState`
2. **Level 2:** `handler -> multiple setState`
3. **Level 3:** `handler -> dispatch -> reducer`
4. **Level 4:** `handler -> action -> state transition -> effect/external operation -> success/failure action`
5. **Level 5:** Feature-level state machine + async lifecycle + request identity.

---

### 37. Production Anti-Pattern #1 — Giant Event Handler
- **Flawed:** 100-line `handleSubmit` combining parsing, validation, fetching, analytics, localStorage, and routing.
- **Refactor:** Separate event extraction $\rightarrow$ pure state transition $\rightarrow$ async service $\rightarrow$ result action.

---

### 38. Production Anti-Pattern #2 — Generic `SET_STATE`
- **Flawed:** `dispatch({ type: "SET_STATE", payload: { submitting: true } })`.
- **Refactor:** `dispatch({ type: "SUBMIT_REQUESTED" })`.

---

### 39. Production Anti-Pattern #3 — Multiple Flags for One State Machine
- **Flawed:** `{ isLoading: true, isSuccess: true, isError: false }`.
- **Refactor:** `{ status: "loading" }` or `{ status: "success" }`.

---

### 40. Production Anti-Pattern #4 — Effect as Click Relay
- **Flawed:** Setting `saveRequested = true` just to run a `useEffect`.
- **Refactor:** Call the save operation directly from the event handler.

---

### 41. Production Anti-Pattern #5 — Storing Derived Interaction State
- **Flawed:** Storing `firstName`, `lastName`, and `fullName` in state.
- **Refactor:** Derive `const fullName = `${firstName} ${lastName}`;`.

---

## Layer 3 — 🧪 Diagnostic Labs & DevTools Profiling

### 47. Diagnostic Lab — Transition Logger
```javascript
function reducer(state, action) {
  const nextState = transition(state, action);
  console.table({
    action: action.type,
    previousStatus: state.status,
    nextStatus: nextState.status
  });
  return nextState;
}
```

---

### 48. Diagnostic Lab — Render Logging
Log `{ component, renderId, status, dirty, selectedId }` to trace the cause of each render snapshot.

---

### 49. Diagnostic Lab — React DevTools
Use React DevTools Profiler to correlate user clicks with component re-renders and fiber updates.

---

### 50. Production Incident Runbook — Impossible UI State
- **Symptom:** UI displays *Saving...* and *Saved* simultaneously.
- **Fix:** Consolidate `isSaving` and `isSaved` booleans into `status: "saving" | "saved"`.

---

### 51. Production Incident Runbook — Stale Search Results
- **Symptom:** Query is `"react"` but results show `"rea"`.
- **Fix:** Track `activeRequestId` and discard stale asynchronous completions.

---

### 52. Production Incident Runbook — Duplicate Submission
- **Symptom:** Rapid double-clicks send duplicate network mutations.
- **Fix:** Guard UI state (`if (status === "submitting") return;`) and enforce backend idempotency.

---

### 53. Event-Driven Architecture Decision Matrix

| Situation | Recommended Approach |
| :--- | :--- |
| Simple interaction | `useState` |
| Dependent state update | Functional update (`set(c => c + 1)`) |
| Multiple related transitions | `useReducer` |
| Mutually exclusive statuses | Explicit `status` union |
| Child interaction | Semantic callback |
| External synchronization | Explicit async handler or `useEffect` |
| Overlapping requests | Request identity / token tracking |
| Sibling communication | Lift state to common owner |
| Derived values | Compute during render |

---

## Layer 4 — 🔥 The Crucible

### 42. Prediction Challenge #1 — Two Events, One Snapshot
`setCount(count + 1)` called twice with initial `count = 0` produces `1`.

---

### 43. Prediction Challenge #2 — Functional Transitions
`setCount(c => c + 1)` called twice with initial `count = 0` produces `2`.

---

### 44. Prediction Challenge #3 — Event vs State
`submitted` boolean represents the current UI condition, not full submission lifecycle history.

---

### 45. Prediction Challenge #4 — Stale Request
Out-of-order response resolution without request identity leads to UI state corruption.

---

### 46. Prediction Challenge #5 — Impossible State
Fragmented booleans allow impossible `{ isLoading: true, isSuccess: true }` states.

---

### 55. Final Crucible: File Upload State Machine
```
              FILE_SELECTED
     idle ─────────────────────► ready
                                   │ UPLOAD_REQUESTED
                                   ▼
                               uploading ◄── UPLOAD_PROGRESS
                                   │
                   ┌───────────────┴───────────────┐
  UPLOAD_SUCCEEDED │                               │ UPLOAD_FAILED
                   ▼                               ▼
                success                          error
                                                   │ RETRY_REQUESTED
                                                   ▼
                                               uploading
```

---

### 56. Challenge — Event Boundary vs Domain Boundary
`<TodoItem onComplete={() => onComplete(todo.id)} />` is cleaner than passing `(event, todo)`.

---

### 57. Challenge — Where Does Validation Belong?
- **Client validation:** UX feedback.
- **Domain transition validation:** Invariant protection.
- **Server validation:** Authoritative correctness.

---

### 58. Challenge — What Should Be Stored?
Store independent authoritative facts; derive `fullName` and `isEmpty`.

---

### 59. Completion Checklist
- [x] **Event vs State:** Distinguish historical facts from current conditions.
- [x] **Invariants:** Enforce invariants via union status types.
- [x] **Pure Reducers:** Keep reducers deterministic and side-effect-free.
- [x] **Async Concurrency:** Handle request identity and stale response hazards.
- [x] **Snapshots:** Reason about closures in event handlers and functional updates.
- [x] **Clean Boundaries:** Shield domain logic from raw DOM event details.

---

### 60. Final Senior Mental Model
```
┌───────────────────────────────────────────────────┐
│                 USER INTERACTION                  │
└───────────────────────┬───────────────────────────┘
                        │
                        ▼ Browser / React Event
                Event Interpretation
                        │
                        ▼ Semantic Action
┌───────────────────────────────────────────────────┐
│                 State Transition                  │
│             previous state + action               │
│                        ↓                          │
│                    next state                     │
└───────────────────────┬───────────────────────────┘
                        │
                        ▼ React Render
                  Reconciliation
                        │
                        ▼ Commit
                      DOM / UI
                        │
                        │ External synchronization
            ┌───────────┴───────────┐
            ▼                       ▼
   Browser / Storage        Network APIs / Server
            │                       │
            └───────────┬───────────┘
                        │
                        ▼ Result / Event
                  New transition
```

> - **EVENT:** *"What happened?"*
> - **STATE:** *"What is true now?"*
> - **TRANSITION:** *"How should the state change?"*
> - **EFFECT:** *"How do we synchronize with something outside React?"*
> - **RENDER:** *"What UI corresponds to the current state?"*
> - **COMMIT:** *"What DOM changes are required?"*

---

### Part 10 Graduation Test
1. **Where is the browser event interpreted?** In the component event handler.
2. **Where is the semantic action created?** At the interaction adapter boundary.
3. **Where is the state transition determined?** In the pure reducer / transition function.
4. **Where should the network request occur?** In an async operation outside the pure reducer.
5. **What prevents impossible states?** Explicit status unions and state invariants.
6. **What prevents stale responses?** Request identity / token tracking.
7. **What prevents duplicate submissions?** Transition guards and backend idempotency.
8. **Which values are derived?** Values computed directly from props/state during render.
9. **Which component owns state?** The common ancestor with authority over that domain.
10. **Which part renders?** React component render functions producing element trees.
11. **Which part mutates the DOM?** React's commit phase.
12. **Which parts are pure?** Reducers and render computations.
13. **Which parts interact with external systems?** Handlers, async services, and effects.
14. **What happens if two requests overlap?** Request identity ensures only the latest request updates state.
15. **What information determines relevance?** Active query string / request ID.
