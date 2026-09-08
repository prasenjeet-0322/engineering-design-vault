# Level 06 — React Fundamentals
## KPI 06 / KPI 09 — Effects & Synchronization
### PART 05 — Effects vs Event Handlers, Derived Data & Render-Time Logic

[⬅️ Previous Part](04-effect-synchronization-patterns.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](examples/05-effects-vs-events-and-derived-data.html) | [Next Part ➡️](06-effect-dependencies-and-stable-identities.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

# ⚡ LAYER 1 — 30-SECOND EXECUTIVE CHEAT SHEET

## The Most Important Question

When you are about to write an Effect, ask:
> **Is this code synchronizing React with something external, or am I merely trying to respond to an event / calculate a value?**

```text
               WHAT HAPPENED?
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   User event   Render inputs  External state
        │             │             │
        ▼             ▼             ▼
  Event handler  Render logic     Effect
        │             │             │
        ▼             ▼             ▼
     command     calculation  synchronization
```

- **Use render-time logic for:** Derived values, filtering, sorting, formatting, calculations, and conditional UI.
- **Use event handlers for:** Click commands, submit commands, explicit user actions, and business commands initiated by the user.
- **Use Effects for:** Subscriptions, timers, browser APIs, imperative widgets, network connection lifecycles, external stores, and external system synchronization.

---

## Executive Table

| Situation | Correct Home | Why |
| :--- | :---: | :--- |
| **Calculate total from `price * quantity`** | **Render** | Pure derivation |
| **Filter products based on search text** | **Render** | Derived data |
| **Format a date** | **Render** | Pure computation |
| **User clicks Save** | **Event handler** | Explicit command |
| **User submits form** | **Event handler** | User intent |
| **Subscribe to WebSocket** | **Effect** | External relationship |
| **Update `document.title`** | **Effect** | Browser synchronization |
| **Start an interval** | **Effect** | External resource |
| **Control video playback** | **Effect** | Imperative external API |
| **Copy props into state** | **Usually neither** | Often redundant state |
| **React state change should trigger external sync** | **Effect** | Synchronization |

---

## Golden Rule

> **Events represent things the user explicitly did. Effects synchronize React with external systems. Rendering derives the UI from current data.**

Do not turn:
```text
event  ──►  state  ──►  Effect  ──►  command
```
into an architecture when:
```text
event  ──►  command
```
is the actual semantic relationship.

---

# 🔬 LAYER 2 — DEEP MECHANICAL BREAKDOWN

## 1. Three Different Kinds of Work

React applications commonly contain three fundamentally different categories of logic:

### Category A — Render-Time Calculation
```typescript
const total = price * quantity;
```
*Meaning:* Current inputs $\rightarrow$ Pure calculation $\rightarrow$ Value used by UI.

### Category B — Event-Driven Commands
```typescript
function handleSubmit() {
  saveOrder();
}
```
*Meaning:* User action $\rightarrow$ Event handler $\rightarrow$ Command.

### Category C — Synchronization
```typescript
useEffect(() => {
  document.title = title;
}, [title]);
```
*Meaning:* React state $\rightarrow$ Effect $\rightarrow$ External system synchronization.

These three categories should never be collapsed into one mechanism.

---

## 2. Why Developers Overuse Effects

A common anti-pattern progression is:
```text
"I need something to happen"
            ↓
    "I need state"
            ↓
  "I'll update the state"
            ↓
"I'll watch that state in an Effect"
            ↓
  "I'll do the real work there"
```

For example:
```typescript
const [submitted, setSubmitted] = useState(false);

useEffect(() => {
  if (submitted) {
    submitOrder();
  }
}, [submitted]);
```

The actual semantic event was: **User clicked Submit**. But the architecture became:
```text
click ──► setSubmitted(true) ──► render ──► Effect ──► submitOrder()
```
This introduces unnecessary temporal complexity and extra render cycles.

---

## 3. The Better Model

If the command originates from the user's action:
```typescript
function handleSubmit() {
  submitOrder();
}
```

The architecture is:
```text
User ──► submit event ──► handler ──► command
```
Much clearer. **The Effect should not be used as an event bus.**

---

## 4. Prediction-First Walkthrough — Event vs Effect

Consider:
```typescript
function Form() {
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (submitted) {
      sendForm();
    }
  }, [submitted]);

  function handleSubmit() {
    setSubmitted(true);
  }

  return <button onClick={handleSubmit}>Submit</button>;
}
```

### Initial State: `submitted = false`
- **Render #1:** UI displays Submit button. No submission.

### User Clicks Submit:
1. Handler executes: `handleSubmit()` $\rightarrow$ `setSubmitted(true)`.
2. React schedules state update.
3. **Render #2:** State becomes `submitted = true`.
4. Effect dependency changed: `false → true`.
5. Effect executes: `sendForm()`.

The user action caused:
```text
click ──► state ──► render ──► Effect ──► network command
```
The architecture works mechanically, but it has artificially encoded an event as state.

---

## 5. What Happens If the User Clicks Again?

Suppose:
```typescript
function handleSubmit() {
  setSubmitted(true);
}
```

State is already `true`. A second click attempts `true → true`.

The state transition does not represent *"the user submitted again"*. The event happened, but the boolean does not represent event multiplicity.

> **Key Rule:**  
> - **Event:** *"I clicked Submit."* (Temporal occurrence)  
> - **State:** *"The form is currently submitting."* (Persistent truth)  
> Do not confuse them.

---

## 6. Event vs State

| Event (*Something happened*) | State (*Something is currently true*) |
| :--- | :--- |
| User clicked Save | `isSaving = true` |
| User submitted form | `status = "submitting"` |
| User selected tab | `selectedTab = "settings"` |
| User typed character | `query = "react"` |
| User pressed Escape | `modalOpen = false` |

The event causes a state transition. But the event itself does not necessarily belong in state.

---

## 7. Effects Are Not Event Queues

### Bad Architecture:
```text
click ──► setAction("save") ──► render ──► Effect sees "save" ──► save()
```
This makes the Effect behave like a hidden command dispatcher.

### Better Architecture:
```text
click ──► handleSave() ──► save()
```

If saving changes visible state:
```text
click ──► handleSave() ──┬──► save()
                         └──► setStatus("saving")
```
That is explicit and synchronous.

---

## 8. When an Effect Is Correct After an Event

There is an important nuance. An event can change React state:
```text
click ──► setSelectedRoom("engineering")
```
That state may define an external synchronization:
```text
selectedRoom ──► Effect ──► WebSocket connection
```

This is completely legitimate. The event itself does not directly trigger the Effect. Instead:
```text
Event ──► state transition ──► new rendered state ──► external synchronization must change
```

### Example:
```typescript
function Chat() {
  const [roomId, setRoomId] = useState("general");

  useEffect(() => {
    const connection = connect(roomId);
    return () => connection.disconnect();
  }, [roomId]);

  return (
    <button onClick={() => setRoomId("engineering")}>
      Engineering
    </button>
  );
}
```

The Effect is correct because `roomId` represents the desired external synchronization.

---

## 9. Event $\rightarrow$ State $\rightarrow$ Effect Can Be Correct

The chain itself is not forbidden. The semantic question is:
> **Does the state represent a persistent UI condition that should be synchronized externally?**

- If **YES:** `event → state → render → Effect → external system` is exactly right.
- Example: User selects room $\rightarrow$ `roomId` changes $\rightarrow$ UI now represents room B $\rightarrow$ Effect synchronizes connection to room B.

The Effect is not handling the click; it is synchronizing the current room state.

---

## 10. Render-Time Derived Data

Consider:
```typescript
function Cart({ items }: { items: Item[] }) {
  const total = items.reduce((sum, item) => sum + item.price, 0);

  return <div>{total}</div>;
}
```

No Effect. Why? Because:
```text
items ──► pure calculation ──► total
```
The calculation belongs directly to rendering.

---

## 11. The Anti-Pattern: Derived State Through Effects

### Bad:
```typescript
function Cart({ items }: { items: Item[] }) {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setTotal(items.reduce((sum, item) => sum + item.price, 0));
  }, [items]);

  return <div>{total}</div>;
}
```

Architecture:
```text
items ──► render ──► Effect ──► setTotal ──► render again ──► display total
```

### Better:
```typescript
const total = items.reduce((sum, item) => sum + item.price, 0);
```

---

## 12. Why the Effect Version Is Inferior

It introduces:
1. **Additional state:** `total` (must be managed and tracked)
2. **Additional render cycle:** `input change → render → Effect → state update → render`
3. **Additional synchronization semantics:** Reason about Effect dependencies, state update scheduling, and stale intermediate values when none of that was required.

---

## 13. Derived Data Has a Dependency Graph Too

Consider:
```typescript
const filteredProducts = products.filter(product =>
  product.name.includes(query)
);
```

```text
products ──────┐
               ▼
             filter ──► filteredProducts
               ▲
query ─────────┘
```

This is a render-time data-flow graph, not an external synchronization. Therefore, **render is the correct place.**

---

## 14. Prediction-First Walkthrough — Derived Data

```typescript
function Search({ products, query }: { products: Product[]; query: string }) {
  const filtered = products.filter(product =>
    product.name.includes(query)
  );

  return (
    <ul>
      {filtered.map(product => (
        <li key={product.id}>{product.name}</li>
      ))}
    </ul>
  );
}
```

- **Render #1:** `products = [A, B, C]`, `query = "a"` $\rightarrow$ Render calculates `filtered = [A, C]`.
- **Render #2:** `query = "b"` $\rightarrow$ Render calculates `filtered = [B]`.

No Effect. No extra state. No synchronization.

---

## 15. Expensive Derived Data

What if the calculation is expensive? Do not automatically reach for an Effect.

The first question remains: *Is this derivation?* If yes, it belongs conceptually to rendering. Optimization can then be considered separately:
```typescript
const filtered = useMemo(
  () => expensiveFilter(products, query),
  [products, query]
);
```

> **Important Distinction:** `useMemo ≠ Effect`  
> - `useMemo` is about memoizing a calculation within rendering.  
> - `useEffect` is about synchronization with an external system.

---

## 16. `useMemo` Does Not Turn Derivation Into Synchronization

Consider:
```typescript
const total = useMemo(() => calculateTotal(items), [items]);
```

The model remains: `items → calculation → total`. There is no external system. `useMemo` remains a render-related computation cache.

---

## 17. Event Handler vs Effect: The Semantic Test

Ask:
> **Could I describe the operation as "because the user did X"?**

If yes, start with an **event handler**:
- because user clicked Save
- because user submitted form
- because user selected Delete
- because user pressed Retry
- because user clicked Play

---

## 18. Effect Semantic Test

Ask:
> **Could I describe the operation as "while React is in this state, an external system should be synchronized accordingly"?**

If yes, an **Effect** is appropriate:
- while this room is selected $\rightarrow$ stay connected to that room
- while this title is current $\rightarrow$ browser title should match
- while this component is mounted $\rightarrow$ subscription should exist
- while `isPlaying` is true $\rightarrow$ media should be playing

---

## 19. Example — Play Button

```typescript
function Player() {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  return <button onClick={handlePlay}>Play</button>;
}
```

The click is an event. The state is `isPlaying = true`. If a `<video>` must synchronize with that state:
```typescript
useEffect(() => {
  if (isPlaying) {
    video.play();
  } else {
    video.pause();
  }
}, [isPlaying]);
```

Architecture:
```text
click ──► state transition ──► render ──► Effect ──► video synchronization
```
The event handler owns user intent; the Effect owns external synchronization.

---

## 20. Event Logic Can Update State and Run Commands

An event handler can contain both:
```typescript
function handleSave() {
  setStatus("saving");
  saveDocument();
}
```

`setStatus()` updates React state, while `saveDocument()` is an explicit command caused by user intent. The event handler is the correct semantic boundary.

---

## 21. Don't Hide Commands in Effects

### Bad:
```typescript
function Editor() {
  const [saveRequested, setSaveRequested] = useState(false);

  useEffect(() => {
    if (saveRequested) {
      save();
    }
  }, [saveRequested]);

  return <button onClick={() => setSaveRequested(true)}>Save</button>;
}
```

### Better:
```typescript
function Editor() {
  const [status, setStatus] = useState("idle");

  async function handleSave() {
    setStatus("saving");
    try {
      await save();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return <button onClick={handleSave}>Save</button>;
}
```

This keeps user intent and external command together.

---

## 22. Effects Should Not Manufacture Events

Another anti-pattern:
```typescript
useEffect(() => {
  if (user) {
    setReady(true);
  }
}, [user]);
```

If `ready = user !== null`, then `ready` is derived state. Prefer:
```typescript
const ready = user !== null;
```

---

## 23. State Synchronization Is Not Always External Synchronization

Developers often say: *"I need to synchronize these two pieces of state"*, and write:
```typescript
useEffect(() => {
  setB(transform(a));
}, [a]);
```

If $B = \text{transform}(A)$, then $B$ is derived data:
```typescript
const b = transform(a);
```

If $B$ is independently user-editable state, you need explicit state-transition logic in the input handler rather than an Effect.

---

## 24. Example — Temperature Converter

### Bad:
```typescript
const [celsius, setCelsius] = useState(0);
const [fahrenheit, setFahrenheit] = useState(32);

useEffect(() => {
  setFahrenheit((celsius * 9) / 5 + 32);
}, [celsius]);
```

### Better:
```typescript
const [celsius, setCelsius] = useState(0);
const fahrenheit = (celsius * 9) / 5 + 32;
```

---

## 25. When Two Values Are Independently Editable

When the user can type into either Celsius or Fahrenheit inputs, you cannot derive both simultaneously ($C \rightarrow F$ and $F \rightarrow C$).

A better model:
```text
last edited field + raw value ──► derive other representation
```
Determine ownership and derivation first.

---

## 26. The State Ownership Test

For any value, ask:
```text
Is this:
  ├── independently owned state? ──► React state
  ├── derived from other state?  ──► render calculation
  └── external state?            ──► Effect synchronization
```

---

## 27. A Four-Way Classification

```text
               NEED TO DO SOMETHING
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
    Calculation     User event   External sync
         │              │              │
         ▼              ▼              ▼
       Render        Handler         Effect
```

The fourth category—**React state transitions**—belongs in event handlers or state updater functions, not Effects.

---

## 28. Production Anti-Pattern — Effect Chains

Consider:
```typescript
useEffect(() => {
  setStep(2);
}, [user]);

useEffect(() => {
  setStep(3);
}, [step]);
```

Creates:
```text
user ──► Effect A ──► step = 2 ──► Effect B ──► step = 3
```
Behavior is fragmented across multiple asynchronous-looking synchronization points. Prefer explicit state transitions.

---

## 29. Why Effect Chains Become Dangerous

```text
A ──► Effect ──► B ──► Effect ──► C ──► Effect ──► D
```
Creates:
- temporal coupling
- hidden control flow
- extra render cycles
- fragile debugging
- race opportunities

A senior architecture minimizes unnecessary temporal chains.

---

## 30. Prediction-First Challenge — Effect Chain

```typescript
function Example({ user }) {
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile(buildProfile(user));
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setReady(true);
    }
  }, [profile]);

  return ready ? <Dashboard /> : <Loading />;
}
```

- **Render #1:** `user = A`, `profile = null`, `ready = false`.
- **Effect #1:** `setProfile(...)`.
- **Render #2:** `profile = derivedProfile`.
- **Effect #2:** `setReady(true)`.
- **Render #3:** `ready = true`.

Three renders were created when the relationship was purely:
```typescript
const profile = user ? buildProfile(user) : null;
const ready = Boolean(profile);
```
Solved in **1 render** with zero Effects.

---

## 31. Production Diagnostic — "Why Did This Render Again?"

When encountering multiple cascaded renders, classify every transition:
- Was it event handling?
- Was it state update?
- Was it derived calculation?
- Was it external synchronization?

---

## 32. Diagnostic Lab — Effect vs Event Trace

```typescript
function Example() {
  const [count, setCount] = useState(0);

  function handleClick() {
    console.log("EVENT: click");
    setCount(c => c + 1);
  }

  useEffect(() => {
    console.log("EFFECT: synchronization", count);
    return () => {
      console.log("EFFECT: cleanup", count);
    };
  }, [count]);

  console.log("RENDER", count);

  return <button onClick={handleClick}>{count}</button>;
}
```

Sequence:
```text
EVENT: click
  ↓
state update
  ↓
RENDER 1
  ↓
EFFECT: cleanup 0
  ↓
EFFECT: synchronization 1
```

---

## 33. React DevTools Diagnostic Workflow

1. **Step 1 — Identify triggering event:** Click, typing, navigation, timer, external subscription.
2. **Step 2 — Identify state changes.**
3. **Step 3 — Identify resulting render.**
4. **Step 4 — Identify Effect dependencies.**
5. **Step 5 — Determine whether Effect is:** External synchronization vs derived calculation vs event command.
6. **Step 6 — Delete Effect conceptually:** What breaks? If only derived calculations break, remove the Effect. If WebSocket/browser title/timer breaks, keep it.

---

## 34. The "External System" Litmus Test

```text
Effect candidate
       │
       ▼
Does it interact with something outside React?
       │
   ┌───┴───┐
   │       │
  NO      YES
   │       │
   ▼       ▼
Question  Effect may be
why it    appropriate
exists
```

---

## 35. What If the Effect Calls `setState`?

This is not automatically wrong.
```typescript
useEffect(() => {
  const unsubscribe = store.subscribe(() => {
    setSnapshot(store.getSnapshot());
  });
  return unsubscribe;
}, []);
```
Here: `external store → subscription → React state`. The `setState` call is the consequence of synchronizing with an external system.

> The problem is not *"Effect calls setState"*.  
> The problem is *"Effect exists only to derive something React already knows."*

---

## 36. Effect $\rightarrow$ State Can Be Correct

```typescript
useEffect(() => {
  const unsubscribe = externalStore.subscribe(() => {
    setValue(externalStore.getValue());
  });
  return unsubscribe;
}, []);
```
External store pushes changes into React. Legitimate synchronization boundary.

---

## 37. Effect $\rightarrow$ State Can Also Be Wrong

```typescript
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);
```
No external system. React already owns `firstName` and `lastName`. Pure render derivation.

---

## 38. The Architectural Test

Whenever you see:
```typescript
useEffect(() => {
  setSomething(...);
}, [...]);
```
Ask:
1. *Where does the source data come from? (React or external system?)*
2. *Is something independently owned?*
3. *Is this synchronization?*
4. *Could this be calculated during render?*

---

# 🔬 THE CRUCIBLE

### 🔥 Crucible Challenge #1
```tsx
function App() {
  const [count, setCount] = useState(0);
  const double = count * 2;

  useEffect(() => {
    console.log(double);
  }, [double]);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      {double}
    </button>
  );
}
```
- **Diagnosis:** `double` is pure derived data. No external synchronization exists. The Effect is unnecessary logging noise.

---

### 🔥 Crucible Challenge #2
```tsx
function Player() {
  const [isPlaying, setIsPlaying] = useState(false);

  function handleClick() {
    setIsPlaying(value => !value);
  }

  useEffect(() => {
    if (isPlaying) {
      video.play();
    } else {
      video.pause();
    }
  }, [isPlaying]);

  return <button onClick={handleClick}>Toggle</button>;
}
```
- **Classification:**
  - `handleClick` $\rightarrow$ Event handling (user intent)
  - `isPlaying` $\rightarrow$ React state
  - `video.play/pause` $\rightarrow$ External synchronization
  - `useEffect` $\rightarrow$ Valid bridge between React state and imperative DOM API

---

### 🔥 Crucible Challenge #3
```typescript
const [submitted, setSubmitted] = useState(false);

useEffect(() => {
  if (submitted) {
    send();
  }
}, [submitted]);
```
- **Diagnosis:** `submitted = true` encodes an event as state. Refactor command directly into `onSubmit()`, and use state only for status (`status = "submitting"`).

---

### 🔥 Crucible Challenge #4
```typescript
const [filtered, setFiltered] = useState([]);

useEffect(() => {
  setFiltered(products.filter(p => p.name.includes(query)));
}, [products, query]);
```
- **Diagnosis:** `filtered` is not independently owned. Remove `useState` and `useEffect`. Calculate during render: `const filtered = products.filter(p => p.name.includes(query));`.

---

### 🔥 Crucible Challenge #5
```typescript
useEffect(() => {
  const unsubscribe = externalStore.subscribe(() => {
    setValue(externalStore.getValue());
  });
  return unsubscribe;
}, []);
```
- **Evaluation:** Valid. `externalStore` is an external system pushing updates into React.

---

### 🔥 Production Incident — Double Search Query
```typescript
const [query, setQuery] = useState("");
const [searchQuery, setSearchQuery] = useState("");

useEffect(() => {
  setSearchQuery(query);
}, [query]);

useEffect(() => {
  fetch(`/search?q=${searchQuery}`);
}, [searchQuery]);
```
- **Root Cause:** Redundant `searchQuery` state and chained Effect.
- **Fix:** `useEffect(() => { fetch('/search?q=' + query); }, [query]);`.

---

## 45. Production Incident — Hidden Command

- **Symptom:** User clicks Delete $\rightarrow$ `deleteRequested = true` $\rightarrow$ runs Effect. Later, changing initial state causes accidental deletion on mount!
- **Fix:** Keep commands in `handleDelete()` event handler.

---

## 46. Production Incident — Render Loop

```typescript
useEffect(() => {
  setCount(count + 1);
}, [count]);
```
Effect synchronizes a value with itself $\rightarrow$ Infinite render loop.

---

## 47. Render-Time Logic Must Stay Pure

A render calculation must be pure:
- Inputs $\rightarrow$ Calculation $\rightarrow$ Output.
- Must not mutate external resources, start timers, subscribe, or send network commands.

---

## 48. The Three-Lane Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                        COMPONENT                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  RENDER LANE                                            │
│  props / state ──► derived UI                           │
│                                                         │
│  EVENT LANE                                             │
│  user event ──► explicit command / state update         │
│                                                         │
│  EFFECT LANE                                            │
│  reactive state ──► external synchronization            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 49. Senior Review Checklist

When reviewing an Effect:
1. [ ] What external system exists?
2. [ ] What synchronization does it establish?
3. [ ] What reactive values define that synchronization?
4. [ ] Could this logic run directly from an event?
5. [ ] Could this logic be calculated during render?
6. [ ] Is this merely derived state?
7. [ ] Does the Effect create unnecessary state?
8. [ ] Does the Effect create an Effect chain?
9. [ ] Does cleanup match setup?
10. [ ] Who owns the external resource?

---

## 50. Decision Matrix

| Question | If YES | Preferred Mechanism |
| :--- | :--- | :--- |
| **Is this pure calculation?** | Derivable from current inputs | **Render** |
| **Is this user intent?** | Explicit event caused it | **Event handler** |
| **Is this external synchronization?** | External system must match React | **Effect** |
| **Is this derived state?** | Mathematically/logically derivable | **Render** |
| **Is this external subscription?** | External system pushes changes | **Effect** |
| **Is this browser API sync?** | Browser state must match React | **Effect** |
| **Is this a user command?** | Save / Delete / Submit / Retry | **Event handler** |
| **Is this state transition?** | UI state changes from action | **State update logic** |
| **Is this shared external state?** | Store owns state outside React | **Effect / subscription** |
| **Is this only done to trigger another Effect?** | Hidden event pipeline | **Refactor** |

---

## 51. The "Delete the Effect" Test

Temporarily delete the Effect. If what disappears is a filtered list or formatted string, it belongs in render. If a WebSocket, browser title, or interval stops working, the Effect is justified.

---

## 52. The "Delete the State" Test

If state can be computed from existing props/state during render, delete the `useState` call.

---

## 53. The "Delete the Effect Chain" Test

Replace `Effect A → setState → Effect B → setState → Effect C` with direct state transitions or render computations.

---

## 54. Cross-KPI Connection — JavaScript Fundamentals

- Functions as values $\rightarrow$ Event handlers
- Closures $\rightarrow$ Effect callbacks
- Reference identity $\rightarrow$ Dependency stability
- Pure functions $\rightarrow$ Render-time derivation
- Async JavaScript $\rightarrow$ External Effect operations

---

## 55. Boundary With Earlier KPIs

- **KPI 05 (Events):** Event boundaries vs Effect boundaries.
- **KPI 04 (State):** Real React state vs external state synchronization.

---

## 56. Boundary With Level 07

Concurrent rendering, scheduler lanes, and transitions will build on top of this foundational separation.

---

## 57. Production Architecture Pattern

```typescript
function Editor({ initialDoc }: { initialDoc: { text: string } }) {
  const [text, setText] = useState(initialDoc.text);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // 1. Render Lane: Derived pure calculation
  const characterCount = text.length;

  // 2. Event Lane: User input state transition
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
  }

  // 2. Event Lane: User command
  async function handleSave() {
    setStatus("saving");
    try {
      await saveDocument(text);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  // 3. Effect Lane: External system synchronization
  useEffect(() => {
    document.title = `${characterCount} chars - Editor`;
  }, [characterCount]);

  return (
    <div>
      <textarea value={text} onChange={handleChange} />
      <div>Characters: {characterCount}</div>
      <button onClick={handleSave} disabled={status === "saving"}>
        {status === "saving" ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
```

---

## 58. Final Mental Model

```text
               REACT COMPONENT
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
     RENDER         EVENT        EFFECT
        │             │             │
  derive values  user intent  external sync
        │             │             │
        ▼             ▼             ▼
     UI data      commands/   external system
                    state
```

The architectural rule is:
- **PURE INPUT $\rightarrow$ RENDER**
- **USER ACTION $\rightarrow$ EVENT HANDLER**
- **EXTERNAL SYSTEM $\rightarrow$ EFFECT**

---

# 🔥 PART 05 GRADUATION STANDARD

You should now be able to inspect an Effect and answer:
1. *What external system is involved?*
2. *Why isn't this render-time logic?*
3. *Why isn't this an event-handler command?*
4. *What reactive values define the synchronization?*
5. *Does the Effect create or synchronize an external resource?*
6. *What does cleanup own?*
7. *Is any state merely derived state?*
8. *Could an Effect be deleted without losing external synchronization?*
9. *Is an event being incorrectly encoded as state?*
10. *Is there an unnecessary Effect $\rightarrow$ state $\rightarrow$ Effect chain?*

```text
               ┌─────────────────┐
               │    Operation    │
               └────────┬────────┘
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
    Calculation     User event   External sync
         │              │              │
         ▼              ▼              ▼
       Render        Handler         Effect
```

---

[⬅️ Previous Part](04-effect-synchronization-patterns.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](examples/05-effects-vs-events-and-derived-data.html) | [Next Part ➡️](06-effect-dependencies-and-stable-identities.md)
