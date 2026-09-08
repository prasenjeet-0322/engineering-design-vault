# Level 06 — React Fundamentals
## KPI 05 — Events & User Interaction
### PART 13 — Interaction State Machines & Async Workflows

[⬅️ Previous Part](12-advanced-form-interaction-architecture.md) | [📚 Level 06 Index](README.md) | [🧪 Companion Lab](examples/13-interaction-state-machines-and-async-workflows.html) | [Next Part ➡️](14-event-driven-async-interaction-patterns.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

# Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

## 1. The Core Problem
A user interaction rarely has only two states:
```text
"button clicked"
  ↓
"request sent"
  ↓
"request pending"
  ↓
"request succeeded"
```

Real production interactions contain multiple states, transitions, guards, asynchronous boundaries, cancellation concerns, and failure paths.

**Examples:**
- Autocomplete
- Login
- Checkout
- File upload
- Optimistic mutation
- Multi-step forms
- Delete confirmation
- Search
- Pagination
- Save / retry workflows
- Dependent dropdowns
- Modal workflows

> **The Senior-Level Problem:**  
> Not: *“How do I handle the click?”*  
> It is: *“What state machine does this interaction implement, and which events are allowed to move it between states?”*

---

## 2. Core Mental Model

```text
               USER / SYSTEM EVENT
                       │
                       ▼
               ┌─────────────┐
               │    EVENT    │
               │ click/input │
               │ submit/etc. │
               └──────┬──────┘
                      │
                      ▼
            ┌──────────────────────┐
            │   CURRENT UI STATE   │
            │  idle/loading/error  │
            │     success/etc.     │
            └──────────┬───────────┘
                       │ transition logic
                       ▼
            ┌──────────────────────┐
            │    NEXT UI STATE     │
            └──────────┬───────────┘
                       │
                       ▼
                  React render
                       │
                       ▼
                  committed UI
```

React renders the result of the current state.  
Your interaction architecture determines how the state changes.

---

## 3. State Machine Vocabulary

| Concept | Meaning | Production Impact | Common Senior Trap |
| :--- | :--- | :--- | :--- |
| **State** | Current condition of an interaction | Defines what UI is valid | Storing every boolean independently |
| **Event** | Something that happened | Drives transitions | Treating events as state |
| **Transition** | State $\rightarrow$ state change | Defines behavior | Allowing impossible transitions |
| **Guard** | Condition required for transition | Prevents invalid actions | Encoding guards only in UI |
| **Effect** | External consequence of a transition | Network/storage/analytics/etc. | Mixing effects into rendering |
| **Request identity** | Identifies an async operation | Prevents stale results | Accepting every response |
| **Terminal state** | State requiring explicit new event | Clarifies lifecycle | Assuming success automatically returns to idle |

---

## 4. The Golden Rule

> [!IMPORTANT]
> Model the interaction as a **finite set of meaningful states and explicit transitions** before writing independent `useState` booleans.
>
> If you cannot describe the legal states and transitions, your component probably does not yet have a sufficiently clear interaction model.

---

## 5. Why Boolean State Becomes Dangerous
Consider:
```javascript
const [isLoading, setIsLoading] = useState(false);
const [isSuccess, setIsSuccess] = useState(false);
const [isError, setIsError] = useState(false);
const [isCancelled, setIsCancelled] = useState(false);
```

This appears simple. But it permits contradictory combinations:
```text
isLoading = true
isSuccess = true
isError = true
isCancelled = true
```

The component now has to answer: *What does this combination mean?* It probably means nothing.

The actual domain is a state machine:
```text
idle
 │
 ├── SUBMIT ──→ submitting
 │               │
 │               ├── SUCCESS ──→ succeeded
 │               ├── FAILURE ──→ failed
 │               └── CANCEL ───→ cancelled
 │
 └── RESET ───────→ idle
```

A discriminated state is therefore much safer:
```javascript
const [status, setStatus] = useState("idle");
// with explicit domain: "idle" | "submitting" | "succeeded" | "failed" | "cancelled"
```

---

# Layer 2 — 🔬 Deep Mechanical Breakdown

## 6. Interaction State Is Not the Same Thing as Domain Data
A component may simultaneously contain:

```text
DOMAIN DATA
────────────────────
email
password
cart items
search query
selected account

INTERACTION STATE
────────────────────
idle
focused
dirty
submitting
loading
error
success

ASYNC OPERATION STATE
────────────────────
requestId
startedAt
completedAt
abort controller
response

DERIVED UI STATE
────────────────────
canSubmit
showValidation
hasChanges
isDisabled
```

These categories should not automatically become separate pieces of state.  
For example:
```javascript
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const canSubmit = email.length > 0 && password.length >= 8;
```
`canSubmit` is derived. There is no reason to create `const [canSubmit, setCanSubmit] = useState(false)` which risks synchronization drift.

---

## 7. State Machine vs. State Snapshot
- **React state** represents a snapshot for a render.
- **A state machine** describes the legal evolution of snapshots over time.

**Example:**
```text
Render #1: status = "idle"
  USER SUBMITS
Render #2: status = "submitting"
  SERVER RETURNS SUCCESS
Render #3: status = "succeeded"
```

Each render observes a particular state snapshot. The state machine describes:
$$\text{idle} \xrightarrow{\text{SUBMIT}} \text{submitting} \xrightarrow{\text{SUCCESS}} \text{succeeded}$$

These are complementary models.

---

## 8. Render-by-Render Prediction
Consider:
```jsx
function SaveButton() {
  const [status, setStatus] = useState("idle");

  function handleSave() {
    setStatus("submitting");
    fakeSave().then(() => {
      setStatus("succeeded");
    });
  }

  return (
    <button onClick={handleSave}>
      {status === "submitting" ? "Saving..." : status === "succeeded" ? "Saved" : "Save"}
    </button>
  );
}
```

### Render #1
- Fiber `SaveButton` hook `memoizedState = "idle"`.
- Committed UI: `Save`.
- Closure: `handleSave` sees `status = "idle"`.

### User Clicks
- `handleSave` executes: `setStatus("submitting")`.
- Update enters hook update mechanism; React schedules work.

### Render #2
- State snapshot: `status = "submitting"`.
- Component produces: `Saving...`.
- Commit: `<button>Saving...</button>`.

### Promise Resolves
- Callback executes later: `setStatus("succeeded")`.
- React schedules another update.

### Render #3
- State snapshot: `status = "succeeded"`.
- Committed UI: `Saved`.

> [!NOTE]
> The promise callback is not changing the DOM directly. It changes React state, which triggers a render and DOM commit.

---

## 9. Events Are Transitions, Not Persistent State
A common conceptual mistake:
```javascript
const [clicked, setClicked] = useState(false);
onClick={() => setClicked(true)}
```

"Clicked" is not the domain state.
- **Event:** `CLICK` (Something that happened).
- **State:** `idle → open` or `idle → submitting` (What is currently true).

---

## 10. Explicit Transition Functions
For complex interactions, transition logic can be isolated:
```javascript
function transition(state, event) {
  switch (state.status) {
    case "idle":
      if (event.type === "SUBMIT") {
        return { status: "submitting" };
      }
      return state;
    case "submitting":
      if (event.type === "SUCCESS") {
        return { status: "succeeded" };
      }
      if (event.type === "FAILURE") {
        return { status: "failed", error: event.error };
      }
      return state;
    case "failed":
      if (event.type === "RETRY") {
        return { status: "submitting" };
      }
      return state;
    default:
      return state;
  }
}
```

```text
                  SUBMIT
        idle ─────────────────→ submitting
                                   │
                         ┌─────────┴─────────┐
                         │                   │
                      SUCCESS             FAILURE
                         │                   │
                         ▼                   ▼
                     succeeded             failed
                                             │
                                           RETRY
                                             │
                                             ▼
                                         submitting
```
The value is making **legal transitions visible**.

---

## 11. Guards
Not every event should be legal in every state.  
`idle` accepts `SUBMIT`. But `submitting` should reject another `SUBMIT` (unless concurrent submissions are explicitly supported).

```javascript
if (status === "submitting") {
  return; // Guard
}
```

$$\text{CURRENT STATE} + \text{EVENT} + \text{GUARD} \rightarrow \text{TRANSITION}$$

---

## 12. UI Guards Are Not System Guards
Rendering `<button disabled={status === "submitting"}>` is only presentation state.  
The underlying handler still requires client transition guards, and the server still requires idempotency.

$$\text{UI guard} \neq \text{client transition guard} \neq \text{server idempotency}$$

---

## 13. Async Operations Create Temporal Complexity
Synchronous transitions are straightforward (`idle → open → closed`).  
Async workflows introduce a delay where:
- User can click again
- User can navigate away
- User can change input values
- User can cancel
- Component can unmount
- Another request can start
- Server can fail or network can reorder completion

Asynchronous interactions demand **explicit temporal reasoning**.

---

## 14. The Classic Stale Response Problem
Consider:
```javascript
function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetchResults(query).then(setResults);
  }, [query]);
  // ...
}
```

If Request A (`"react"`) completes *after* Request B (`"react hooks"`), the UI will display stale results for `"react"` even though the input is `"react hooks"`.  
The problem is **async result ownership**.

---

## 15. Request Identity

```text
QUERY
  │
  ▼
REQUEST #41
  │
  └──── response (late)

QUERY
  │
  ▼
REQUEST #42
  │
  └──── response (fast)
```
When Request #42 becomes current, Request #41 must not overwrite state.

```javascript
const requestIdRef = useRef(0);

async function search(query) {
  const requestId = ++requestIdRef.current;
  const result = await fetchResults(query);
  
  if (requestId !== requestIdRef.current) {
    return; // Ignore stale async resolution
  }
  setResults(result);
}
```

> **The Invariant:**  
> *Only the current operation may commit its result into current UI state.*

---

## 16. Cancellation Is Different From Staleness
- **Cancellation:** Attempting to stop the operation (e.g. `AbortController.abort()`).
- **Staleness:** The operation continues, but its result is ignored because a newer operation is current.

$$\text{Cancellation} \neq \text{Stale-result protection}$$
A robust application often uses both.

---

## 17. Component Unmount and Async Completion
When a component unmounts while a request is in flight, the operation outlives the UI.  
The architecture must determine:
- Who owns the operation?
- Should completion update a global cache or be cancelled?

Do not blindly assume the request belongs exclusively to the local component.

---

## 18. Async Workflow State Should Represent Meaningful States
**Avoid:**
```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [success, setSuccess] = useState(false);
const [retrying, setRetrying] = useState(false);
```

**Prefer:**
```javascript
const [state, setState] = useState({ status: "idle" });
// { status: "submitting", requestId: 17, submittedValues: { ... } }
```

---

## 19. Impossible States
`{ status: "success", error: "Network failed" }` is an impossible contradiction.  
Discriminated state representations eliminate impossible states by design:
- `{ status: "idle" }`
- `{ status: "loading" }`
- `{ status: "success", data }`
- `{ status: "failure", error }`

---

## 20. State Algebra
$$\text{InteractionState} = \text{Idle} \mid \text{Submitting} \mid \text{Succeeded} \mid \text{Failed} \mid \text{Cancelled}$$

Each variant carries its own valid payload:
```typescript
type SubmitState =
  | { status: "idle" }
  | { status: "submitting"; requestId: number; values: FormValues }
  | { status: "succeeded"; response: SaveResponse }
  | { status: "failed"; error: Error };
```

---

## 21. Effects Belong at Transition Boundaries
```text
EVENT
  ↓
transition
  ↓
NEW STATE
  ↓
React render
  ↓
external effect
```

Render must remain `state + props → UI`. External side effects (HTTP, `localStorage`, analytics) belong in handlers or transition listeners, not inside rendering logic.

---

## 22. Submission Snapshot
User input changes during in-flight requests must not mutate the payload already sent:
```javascript
const payload = { email, password };
submit(payload); // Snapshot captured
```

---

## 23. Race Between Submit #1 and Submit #2
When Submit B completes before Submit A:
- **Block/Reject:** Ignore Submit B if submitting.
- **Latest-Wins:** Invalidate Submit A when Submit B starts.
- **Queueing:** Sequence A then B.
- **Deduplicating:** Coalesce equivalent operations.

Product semantics dictate the required strategy.

---

## 24. Interaction State Machines Are Product Contracts
In checkout:
$$\text{cart} \rightarrow \text{validating} \rightarrow \text{payment\_pending} \rightarrow \text{payment\_authorized} \rightarrow \text{order\_creating} \rightarrow \text{order\_created}$$

State machines define contracts across UI, client state, APIs, payment gateways, and databases.

---

## 25. Example — Delete Confirmation Workflow

```text
idle
 │
 │ DELETE_CLICK
 ▼
confirming
 ├── CANCEL ───────→ idle
 └── CONFIRM
      │
      ▼
   deleting
      ├── FAILURE ──→ failed
      └── SUCCESS ──→ deleted
```

```javascript
const [state, setState] = useState({ status: "idle" });

function requestDelete() {
  setState({ status: "confirming" });
}

function cancelDelete() {
  setState({ status: "idle" });
}

async function confirmDelete() {
  if (state.status !== "confirming") return;
  setState({ status: "deleting" });
  try {
    await deleteItem();
    setState({ status: "deleted" });
  } catch (error) {
    setState({ status: "failed", error });
  }
}
```

---

## 26. Example — Retry Semantics

```text
failed
 ├── RETRY ───→ submitting
 ├── EDIT ────→ editing
 └── DISMISS ─→ idle
```
Failure does not imply an automatic reset to `idle`.

---

## 27. Example — Upload Workflow
$$\text{idle} \rightarrow \text{selecting} \rightarrow \text{uploading} \rightarrow \text{processing} \rightarrow \text{completed}$$

- `uploading` $\rightarrow$ `upload_failed` / `cancelled`
- `processing` $\rightarrow$ `processing_failed`

Distinguishing `uploading` from `processing` matters because bytes have been transmitted even if backend transformation fails.

---

# Layer 3 — 🧪 Diagnostic Labs & DevTools Profiling

## 28. The Crucible — Prediction Challenge 1
```javascript
const [status, setStatus] = useState("idle");

function handleClick() {
  setStatus("loading");
  setStatus("success");
}
```
**Prediction:** React batches and updates `status` to `"success"`. The intermediate `"loading"` does not commit to the DOM.

---

## 29. The Crucible — Prediction Challenge 2
```jsx
function Component() {
  const [status, setStatus] = useState("idle");
  function handleSubmit() {
    setStatus("submitting");
    Promise.resolve().then(() => {
      setStatus("success");
    });
  }
  return <div>{status}</div>;
}
```
**Prediction:** Render #1 (`idle`) $\rightarrow$ Click $\rightarrow$ Render #2 (`submitting`) $\rightarrow$ Microtask executes $\rightarrow$ Render #3 (`success`).

---

## 30. The Crucible — Prediction Challenge 3
```javascript
let request = 0;
async function search(query) {
  const id = ++request;
  const result = await fetchResults(query);
  if (id !== request) return;
  setResults(result);
}
```
Sequence: `search("a")` (id 1) $\rightarrow$ `search("ab")` (id 2) $\rightarrow$ response for "ab" $\rightarrow$ response for "a".  
**Prediction:** Response for "ab" is accepted (id 2 === request). Response for "a" is rejected as stale (1 !== 2).

---

## 31. React DevTools Render Investigation
1. Open React DevTools Profiler.
2. Record single interaction.
3. Inspect initiating component, rendering descendants, and prop/state causes.
4. Verify render sequence matches the state machine transitions.

---

## 32. Interaction Telemetry
```javascript
function logTransition(previous, event, next) {
  console.table({
    previous,
    event,
    next,
    timestamp: performance.now()
  });
}
```

---

## 33. Request Identity Logging
```javascript
console.table({
  requestId,
  query,
  startedAt,
  completedAt,
  accepted: requestId === currentRequestId
});
```

---

## 34. Chrome Performance Workflow
Correlate:
$$\text{Event Handler Cost} \rightarrow \text{React Rendering Cost} \rightarrow \text{Commit Cost} \rightarrow \text{Browser Layout/Paint} \rightarrow \text{Network Latency}$$

---

## 35. Diagnose Async Races
```javascript
const operationId = ++operationCounter;
console.log("START", operationId);
try {
  const result = await operation();
  console.log("COMPLETE", operationId);
  if (operationId !== currentOperationId) {
    console.log("STALE", operationId);
    return;
  }
  commitResult(result);
} catch (error) {
  console.log("FAIL", operationId, error);
}
```

---

# Layer 4 — 🔥 The Crucible

## 36. Production Anti-Pattern #1 — Boolean Explosion
- **Flawed:** `isLoading`, `isSuccess`, `isError`, `isCancelled`.
- **Refactoring:** Discriminated union `{ status: "loading" }` or `{ status: "failure", error }`.

---

## 37. Production Anti-Pattern #2 — Promise Callback Blindly Commits
- **Flawed:** `fetchResults(query).then(setResults)` without request tokens.
- **Refactoring:** Introduce request identity and/or cancellation.

---

## 38. Production Anti-Pattern #3 — Disable Button and Assume Correctness
- **Flawed:** Relying solely on `<button disabled={loading}>`.
- **Refactoring:** Add handler guards and backend idempotency.

---

## 39. Production Anti-Pattern #4 — Reset Everything After Failure
- **Flawed:** Clearing form values in catch block.
- **Refactoring:** Preserve user input; only transition error status.

---

## 40. Production Anti-Pattern #5 — Treating Every Async Workflow as loading/error
- **Flawed:** Collapsing multi-stage checkouts into simple `loading`.
- **Refactoring:** Model domain stages (`validating`, `authorizing`, `order_creating`).

---

## 41. Engineering Decision Matrix

| Situation | Recommended Model |
| :--- | :--- |
| **Simple toggle** | Boolean state |
| **Simple finite status** | String / discriminated status |
| **Complex transitions** | Explicit transition function (`useReducer`) |
| **Async request** | Status + operation identity token |
| **Search race** | Cancellation and/or request identity |
| **Multi-stage workflow** | Explicit state machine |
| **Independent concurrent operations** | Per-operation state entity |
| **Server mutation requiring retry safety** | Client state + server idempotency |
| **Derived validation** | Derive synchronously during render |
| **Complex reusable workflow** | Dedicated state-machine abstraction |

---

## 42. Senior-Level Questions
Before shipping an interaction, answer:
- **State:** What are the legal states? What states are impossible?
- **Events:** Which events can occur? Which are invalid in the current state?
- **Transitions:** What state follows each event? Are guards required?
- **Async:** Can operations overlap? Can they be cancelled? Which operation owns the result?
- **Failure:** Is failure recoverable? Does user input survive? Is retry safe?
- **Unmount:** What happens if the component unmounts?
- **Server:** Does the backend require idempotency?

---

## 43. Master Execution Timeline

```text
USER ACTION
    │
    ▼
DOM / React EVENT
    │
    ▼
EVENT HANDLER
    │
    ▼
STATE TRANSITION
    │
    ▼
REACT UPDATE QUEUE
    │
    ▼
RENDER
    │
    ▼
RECONCILIATION
    │
    ▼
COMMIT
    │
    ▼
UPDATED UI
    │
    ▼
ASYNC EXTERNAL OPERATION
    │
    ├──────────────┐
    │              │
 SUCCESS        FAILURE
    │              │
    └──────┬───────┘
           ▼
VALIDITY / IDENTITY CHECK
           │
           ▼
    STATE TRANSITION
           │
           ▼
        RENDER
           │
           ▼
        COMMIT
```

---

## 44. Completion Checklist
- [ ] What an interaction state machine is.
- [ ] Difference between event and state.
- [ ] Difference between transition and render.
- [ ] Why independent booleans produce impossible states.
- [ ] Why explicit statuses improve state representation.
- [ ] What a guard is.
- [ ] Why disabled UI is not sufficient for correctness.
- [ ] Why asynchronous workflows require temporal reasoning.
- [ ] What a stale async response is.
- [ ] Difference between cancellation and staleness.
- [ ] Why request identity prevents stale commits.
- [ ] Why submission payloads should be snapshots.
- [ ] How concurrent submissions create race conditions.
- [ ] How retry semantics affect state-machine design.
- [ ] Why failure should not automatically destroy user input.
- [ ] How component unmount affects async ownership.
- [ ] Why effects should not run during rendering.
- [ ] Why UI state should represent meaningful domain states.
- [ ] How to identify impossible states.
- [ ] How to model a delete-confirmation workflow.
- [ ] How to model a search workflow.
- [ ] How to model an upload workflow.
- [ ] How to model retry transitions.
- [ ] How to inspect interaction renders using React DevTools.
- [ ] How to instrument transitions with `console.table`.
- [ ] How to instrument request identity.
- [ ] How to investigate interaction performance in Chrome DevTools.
- [ ] How to correlate React Profiler data with browser performance.
- [ ] Why request completion order cannot determine UI ownership.
- [ ] Why client-side guards do not replace server-side idempotency.
- [ ] How to identify latest-wins, queued, deduplicated, or concurrent models.
- [ ] How to explain an interaction as a state graph.
- [ ] How to reason through Render #1 $\rightarrow$ event $\rightarrow$ Render #2 $\rightarrow$ async completion $\rightarrow$ Render #3.
- [ ] How to distinguish domain state from derived UI state.
- [ ] How to identify the owner of an asynchronous result.

---

## 45. Graduation Test
Look at a production interaction and answer:
1. What are its states?
2. What are its events?
3. Which transitions are legal?
4. Which transitions are impossible?
5. What guards exist?
6. Which effects occur?
7. Which async operation is current?
8. What happens when responses arrive out of order?
9. What happens when the component unmounts?
10. What happens on retry?
11. Can retry duplicate a side effect?
12. Who owns correctness?
13. What does each render represent?

---

## 46. Final Mental Model

```text
               ┌──────────────┐
               │    EVENT     │
               └──────┬───────┘
                      │
                      ▼
               ┌─────────────────┐
               │  CURRENT STATE  │
               └────────┬────────┘
                        │ transition
                        ▼
               ┌─────────────────┐
               │   NEXT STATE    │
               └────────┬────────┘
                        │
                        ▼
                  REACT RENDER
                        │
                        ▼
                     COMMIT
                        │
                        ▼
                       UI
                        │
                        │ external async work
                        ▼
               ┌─────────────────┐
               │ RESULT / ERROR  │
               └────────┬────────┘
                        │ identity / guard
                        ▼
                 NEXT TRANSITION
```

> [!IMPORTANT]
> **Senior Rule:** An interaction is not merely a handler attached to an element. It is a **state transition system** whose state is rendered by React and whose asynchronous boundaries must have explicit ownership, validity, and failure semantics.

---

# Companion Lab Contract
The companion lab [`examples/13-interaction-state-machines-and-async-workflows.html`](examples/13-interaction-state-machines-and-async-workflows.html) provides:
1. **Interactive state graph:** `idle`, `submitting`, `succeeded`, `failed`, `cancelled`.
2. **Event controls:** `SUBMIT`, `SUCCESS`, `FAILURE`, `RETRY`, `CANCEL`, `RESET`.
3. **Live transition log:** Previous State, Event, Next State, Timestamp.
4. **Async race simulator:** Request A vs Request B, manual resolve A/B, stale-result rejection.
5. **Request identity visualization:** Request #1, Request #2, Current Request, Accepted / Stale.
6. **Impossible-state demonstration:** Compare boolean explosion against discriminated state.
7. **Render timeline:** Event $\rightarrow$ State Update $\rightarrow$ Render $\rightarrow$ Commit $\rightarrow$ Async Result $\rightarrow$ State Update.
8. **Production incident simulator:** Duplicate submit, stale search result, retry after failure, component unmount during request.

---

# Cross-KPI Boundary
This Part intentionally establishes the architectural model for event-driven interaction workflows.
It does not attempt to teach:
- React concurrent scheduling internals
- Transition lanes & time slicing
- Suspense scheduling internals
- Server Components & Server Actions

The core competency established here is:
$$\text{EVENT} \rightarrow \text{STATE MACHINE} \rightarrow \text{STATE TRANSITION} \rightarrow \text{REACT RENDER} \rightarrow \text{COMMIT} \rightarrow \text{EXTERNAL ASYNC RESULT} \rightarrow \text{VALIDATED NEXT TRANSITION}$$
