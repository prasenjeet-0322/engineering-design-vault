Level 06 — React Fundamentals
KPI 04 — State & State Updates
PART 13 — State Persistence, Reset Semantics & Derived-State Boundaries
[⬅️ Previous Part](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/12-use-reducer-state-transition-modeling.md) | [📚 Level 06 Index](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/README.md) | [🧪 Companion Lab](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/examples/13-state-persistence-reset-derived-boundaries.html) | [Next Part ➡️](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/14-state-architecture-patterns.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

1. The Central Question
A React state bug often looks like:
“Why didn't my state reset?”
or:
“Why did my state disappear?”

But the deeper question is:
> What determines the lifetime of this state?

React state is neither:
- permanently attached to a component function,
- attached to a JSX source line,
- attached to a DOM node,
- nor automatically synchronized with props.

State persists according to component identity across renders.

The core model is:
```
COMPONENT OCCURRENCE
        │
        │ identity
        ▼
 ┌───────────────┐
 │  React state  │
 │    memory     │
 └───────┬───────┘
         │
    ┌────┴──────────────┐
    │                   │
same identity      new identity
    │                   │
    ▼                   ▼
preserve state    initialize state
```

This is why:
```javascript
<UserEditor user={user} />
```
does not automatically mean:
`user changed ↓ editor state resets`

And this is why:
```javascript
<UserEditor key={user.id} user={user} />
```
can intentionally establish:
`different identity ↓ fresh state`

2. The Four-State-Lifetime Questions
For every state value, ask:
1. Who owns it?
2. What concept does it represent?
3. How long should that concept live?
4. What event should cause it to reset?

If the answers are unclear, state architecture is probably unclear.

3. Executive Concept Table
| Concept | Core Mechanism | Production Impact | Common Senior Trap |
| :--- | :--- | :--- | :--- |
| **State persistence** | Same component identity preserves state | Maintains user interaction across renders | Thinking re-render means state reset |
| **State reset** | Identity changes or explicit update changes state | Controls state lifetime | Using random keys to “fix” state |
| **Component identity** | Type + key + structural position/context | Determines state preservation | Thinking JSX source location defines identity |
| **key** | Identity information within sibling sets | Enables stable list state and intentional resets | Treating key as a normal prop |
| **Initialization** | State's starting value | Establishes initial memory | Expecting initializer to rerun every render |
| **Explicit reset** | State transition to a known value | Predictable reset behavior | Using remounting when a transition is sufficient |
| **Derived state** | Computed from canonical state/props | Avoids synchronization | Storing deterministic consequences |
| **State lifetime** | Duration a concept should persist | Prevents stale/vanishing state | Letting component structure accidentally define domain lifetime |
| **Remount** | New component occurrence | Recreates state/effects | Using remount as a generic synchronization mechanism |
| **Prop-to-state initialization** | State initialized from props | Useful for independent drafts | Assuming later prop changes automatically synchronize |

4. Golden Rule
> 🏆 **Golden Rule:** State should persist for exactly as long as the concept it represents is supposed to persist.

That means:
```
Concept lifetime ↓ State lifetime ↓ Component identity
```
When these three disagree, production bugs appear.

---

Layer 2 — 🔬 Deep Mechanical Breakdown

5. State Is Memory Attached to Identity
Consider:
```javascript
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      {count}
    </button>
  );
}
```

The function executes again on every render.
Yet:
`count` persists.

Why?
Because React associates the hook state with the component occurrence represented in its internal tree.

Conceptually:
```
Component occurrence
        │
        ▼
      Fiber
        │
        ▼
   hook state
        │
        ▼
memoized state chain
```
The JavaScript function invocation is temporary.
The React-managed state associated with the component occurrence persists across renders.

6. Re-render Does Not Mean Remount
This distinction is fundamental.

**Re-render:**
```
same component identity ↓ function executes again ↓ state preserved
```

**Remount:**
```
previous occurrence removed/replaced ↓ new component occurrence ↓ new state initialized
```

Therefore:
$$\text{render} \neq \text{mount}$$
and:
$$\text{function execution} \neq \text{state creation}$$

7. Render Timeline
Consider:
```javascript
const [count, setCount] = useState(0);
```

Initial:
```
Mount ↓ initialize state ↓ Render #1 ↓ Commit
```
Then:
```
setCount(...) ↓ Render #2 ↓ Commit
```
The state is not initialized again.

A later remount:
```
old occurrence removed ↓ new occurrence created ↓ initialize state again ↓ Render #1 for new occurrence
```
This is the distinction you must carry into every state prediction.

8. Initial State Is Not Synchronization
Consider:
```javascript
function Editor({ user }) {
  const [name, setName] = useState(user.name);

  return (
    <input
      value={name}
      onChange={e => setName(e.target.value)}
    />
  );
}
```
Suppose:
`Render #1: user.name = "Alice", name = "Alice"`
The user edits:
`name = "Alicia"`

Now:
`Render #2: name = "Alicia"`

If the parent later provides:
`user.name = "Bob"`
the state does not automatically become:
`name = "Bob"`

The initial value has already served its purpose.
The state now represents an independent concept:
`editor draft`

9. Prop-to-State Initialization Can Be Correct
The previous example is not automatically an anti-pattern.
If the intended architecture is:
```
server/domain user ↓ initial editor draft ↓ user edits independently
```
then `useState(user.name)` is appropriate.

The important distinction is:
- **Initialize from prop**
versus:
- **Continuously mirror prop**

These are different architectures.

10. Prop-to-State Mirroring Is Dangerous
Consider:
```javascript
function Editor({ user }) {
  const [name, setName] = useState(user.name);

  useEffect(() => {
    setName(user.name);
  }, [user.name]);

  // ...
}
```
This creates a synchronization system:
```
prop ↓ render ↓ effect ↓ state update ↓ render
```
Now you must answer:
- When should user edits win?
- When should prop changes win?
- What if both happen close together?
- What if the server updates while the user is typing?

The state architecture becomes ambiguous.

11. Independent Draft vs Live Value
This is one of the most important distinctions.

**Live value:**
If the UI should always display `props.user.name`, then derive it directly:
```jsx
<input value={user.name} />
```

**Independent draft:**
If the user should edit locally:
```javascript
const [draftName, setDraftName] = useState(user.name);
```
Now `user.name` and `draftName` are intentionally different concepts.
The draft has its own lifecycle.

12. State Lifetime Must Match Concept Lifetime
Consider a modal editor:
```
Product A ↓ Edit modal ↓ draft = Product A
```
If the user switches to Product B, the draft should probably become:
`draft = Product B`

That can be represented through:
```javascript
<Editor key={product.id} product={product} />
```
if the intended semantic is:
> “Each product gets an independent editor instance.”

The key is not a synchronization mechanism.
It establishes component identity.

13. Key as Identity
Suppose:
```javascript
<Editor key="A" product={A} />
```
then:
```javascript
<Editor key="B" product={B} />
```
The conceptual identity changes:
```
Editor + key A ↓ old occurrence
Editor + key B ↓ new occurrence
```
Therefore state is initialized for B.

14. Explicit Reset With Key
A deliberate reset can be:
```javascript
<ChatInput key={conversationId} />
```
When `conversationId = "A"`, the component owns one state instance.
When `conversationId = "B"`, React sees a different keyed identity.
State resets.

This is appropriate when the intended semantics are:
`A different entity represents a different state lifetime.`

15. Key Is Not a Reset Button
This is dangerous:
```javascript
<Editor key={Math.random()} />
```
Every render creates a new identity.
Therefore:
```
render ↓ new key ↓ new component ↓ state reset ↓ effects recreated ↓ DOM subtree replaced as necessary
```
This destroys persistence.
It is not a valid general debugging strategy.

16. Explicit State Reset vs Identity Reset
There are two fundamentally different operations:

**Explicit reset:**
```javascript
setDraft(initialDraft);
```
Meaning:
`same component occurrence + new state value`

**Identity reset:**
```javascript
<Editor key={entityId} />
```
Meaning:
`different component occurrence + new state lifecycle`

Choose based on semantics.

17. When Explicit Reset Is Better
Suppose a form has: `name`, `email`, `errors`, `isDirty` and the user clicks `Cancel`.
The component remains the same conceptual form.
The correct transition may be:
`current draft ↓ RESET ↓ initial draft`
No remount is required.

18. When Identity Reset Is Better
Suppose:
`Editor for Document A` becomes `Editor for Document B`.
If each document should have an entirely separate local editing lifecycle, identity reset can express that naturally:
```javascript
<Editor key={document.id} document={document} />
```
This resets:
- local state
- effect lifecycle
- internal component subtree state

That is a broader semantic operation than changing one state variable.

19. State Preservation During Conditional Rendering
Consider:
```javascript
{show && <Counter />}
```
If `show = true`, the occurrence exists.
If `show = false`, the occurrence is removed.
If later `show = true`, a new occurrence is created.

Therefore:
```
mount   ↓ state created
unmount ↓ state lifetime ends
remount ↓ state initialized again
```

20. Conditional Branches and Identity
Consider:
```javascript
return isAdmin ? <Panel /> : <Panel />;
```
The source branches differ.
But the resulting tree contains the same component type in the corresponding position.
Conceptually:
`Panel ↓ same identity context ↓ state can persist`

Do not reason about state from source-code branches alone.
Reason about the resulting React tree.

21. Different Component Types
Consider:
```javascript
return isAdmin ? <AdminPanel /> : <UserPanel />;
```
The component type changes.
Therefore:
`AdminPanel occurrence ↓ replaced ↓ UserPanel occurrence`
Their state is independent.
This can intentionally reset state.

22. Position Matters
Consider:
```jsx
return (
  <>
    {showFirst && <Counter />}
    <Counter />
  </>
);
```
There can be multiple component occurrences.
State belongs to each occurrence.
Conceptually:
```
Parent
├── Counter occurrence #1
└── Counter occurrence #2
```
Each owns separate state.

23. Keys Are Local to Sibling Sets
Consider:
```javascript
items.map(item => (
  <Row key={item.id} item={item} />
))
```
The keys distinguish sibling occurrences.
Keys are not globally unique application identifiers.
This is enough:
```
List A: key = 1, key = 2
List B: key = 1, key = 2
```
because they exist in different sibling contexts.

24. Keys Are Not Props
Given:
```javascript
<Row key={item.id} item={item} />
```
inside Row:
```javascript
function Row(props) {
  console.log(props.key); // undefined
}
```
`key` is not an ordinary component prop.
If the component needs the identifier:
```javascript
<Row key={item.id} itemId={item.id} />
```
Now:
- `key` controls identity
while:
- `itemId` is application data.

25. Derived-State Boundary
State architecture has another boundary:
```
canonical facts
│
├── derived value A
├── derived value B
└── derived value C
```
If a value can be deterministically reconstructed from current inputs, it generally does not need its own state.

Example:
```javascript
const [items, setItems] = useState([]);
const total = items.reduce(
  (sum, item) => sum + item.price,
  0
);
```
`total` is derived.

26. Stored Consequence vs Independent Concept
Compare:
`cartItems`, `cartTotal`
If `cartTotal = calculate(cartItems)`, then `cartTotal` is a consequence.

But:
`checkoutQuote` might be an independently obtained server result.
It may depend on:
`cartItems + shipping address + promotions + server rules`
and may have its own asynchronous lifecycle.

Therefore:
```
deterministic local consequence           → derive
independently changing / temporal fact    → state
```

27. Derived Data Must Respect State Lifetime
Suppose:
```javascript
const [selectedId, setSelectedId] = useState(null);
const selectedItem = items.find(item => item.id === selectedId);
```
If `items` changes, `selectedItem` is recalculated.
There is no stale second state.
This means the lifetime of `selectedItem` is exactly:
`current render`
while `selectedId` persists across renders.
That is a healthy boundary.

28. Temporal State
Not everything that is not directly derivable should become a giant state object.
Consider:
`requestStatus`
The value changes over time:
`idle ↓ loading ↓ success`
That temporal lifecycle makes it state.

Similarly:
`draft` changes independently from its source entity.
Temporal independence is a major signal for state.

29. State Lifetime Categories
A useful classification is:
```
               STATE LIFETIME
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
  Render-only    Component   Entity/session
    derived      lifetime       lifetime
       │             │             │
       ▼             ▼             ▼
    derive       useState    explicit owner/
                           persistence model
```
The exact persistence mechanism depends on the concept.
Do not force every lifetime into component-local state.

30. Component State vs Persistent Application Data
`useState` is not a database.
If information must survive:
- component unmount
- page navigation
- browser refresh
- application restart

then local React state alone is insufficient.
Persistence may require:
- URL
- local storage
- session storage
- server/database
- external application state

Those are architectural boundaries beyond ordinary component-local state.

31. Prediction-First Walkthrough #1 — Re-render
```javascript
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      {count}
    </button>
  );
}
```
**Render #1:**
`identity = Counter occurrence A`, `count = 0`

**Click:**
`setCount(...)`

**Render #2:**
`identity = Counter occurrence A`, `count = 1`

Identity remained stable. Therefore state persisted.

32. Prediction-First Walkthrough #2 — Conditional Removal
```javascript
{visible && <Counter />}
```
**Initial:**
`visible = true`, `Counter identity = A`, `count = 5`

**Then:**
`visible = false`
The Counter occurrence is removed.

**Later:**
`visible = true`
A new occurrence is created.
Initial state runs again: `count = 0`.
The previous count of 5 does not return.

33. Prediction-First Walkthrough #3 — Key Change
```javascript
<Editor key={user.id} user={user} />
```
**Render #1:**
`user.id = A`, `key = A`, `draft = "Alice"`

**User edits:**
`draft = "Alicia"`

**Then:**
`user.id = B`
Resulting identity changes:
`Editor key A ↓ replaced ↓ Editor key B ↓ new state`
If initial state is derived from B:
`draft = "Bob"`
The old draft does not carry over.

34. Prediction-First Walkthrough #4 — Same Key, New Props
```javascript
<Editor key={user.id} user={user} />
```
**Render #1:**
`user.id = A`, `draft = "Alice"`

**Parent rerenders with:**
`user.id = A`, `user.name = "Alice Smith"`

Identity remains:
`Editor + key A`
Therefore:
`draft` is preserved. It does not automatically become `"Alice Smith"`.

35. Prediction-First Walkthrough #5 — Explicit Reset
```javascript
function Editor() {
  const [draft, setDraft] = useState("Initial");

  function reset() {
    setDraft("Initial");
  }

  // ...
}
```
The component identity remains unchanged.
The state transitions:
`"Modified" ↓ RESET ↓ "Initial"`
This is an explicit state transition, not a remount.

36. Prediction-First Walkthrough #6 — Derived Selection
```javascript
const [selectedId, setSelectedId] = useState("A");
const selected = items.find(item => item.id === selectedId);
```
**Render #1:**
`selectedId = A`, `selected = item A`

**Items update:**
`item A name changes`

**Render #2:**
`selectedId = A`, `selected = updated item A`

No synchronization effect is required.
The selected object is reconstructed from current canonical inputs.

37. Production Anti-Pattern — Random Keys
**Bad:**
```javascript
<Editor key={Math.random()} />
```
**Why developers do it:**
“I need the component to reset.”

**Mechanical failure:**
```
Every render ↓ new identity ↓ state reset ↓ effects recreated ↓ focus/input state lost ↓ potential performance degradation
```
**Senior fix:**
Determine why reset is required.
Then choose:
- `explicit state reset`
or:
- `stable semantic key`
depending on the intended lifecycle.

38. Production Anti-Pattern — Index as Entity Identity
```javascript
items.map((item, index) => (
  <Row key={index} item={item} />
))
```
If items reorder:
`position 0` may now represent a different entity.
State follows the keyed occurrence.
Therefore:
`row state` can become attached to the wrong entity.

Use stable entity identity when the list is reorderable or mutable:
```javascript
<Row key={item.id} item={item} />
```

39. Production Anti-Pattern — Effect-Based Reset
```javascript
useEffect(() => {
  setDraft(user.name);
}, [user.id]);
```
This may appear to solve:
`new user ↓ new draft`
but introduces a synchronization cycle.

If the desired semantics are:
“A different user is a different editor instance.”
then identity can express the lifecycle directly:
```javascript
<Editor key={user.id} user={user} />
```
If instead:
“The same editor instance should explicitly transition to a new draft.”
then an explicit state transition may be better.
Choose semantics first.

40. Production Anti-Pattern — Resetting State on Every Prop Change
**Bad:**
```javascript
useEffect(() => {
  setForm(initialFormFromProps);
}, [props]);
```
This can destroy user edits whenever the parent creates a new object.
The component loses control over its draft lifecycle.
Before implementing synchronization, establish:
> Is this value live? Or is this an independent draft?

41. Production Anti-Pattern — State That Should Be Derived
**Bad:**
```javascript
const [items, setItems] = useState([]);
const [count, setCount] = useState(0);

function add(item) {
  setItems(prev => [...prev, item]);
  setCount(prev => prev + 1);
}
```
Now the architecture requires:
`count === items.length`

**Prefer:**
```javascript
const [items, setItems] = useState([]);
const count = items.length;
```

42. Production Incident — User Draft Disappears
**Symptom:**
A parent rerenders and the editor loses unsaved text.

**Investigation:**
The component has: `<Editor key={Math.random()} />`
Every parent render creates a new identity.

**Failure:**
```
parent render ↓ random key ↓ new Editor identity ↓ old state discarded ↓ new initial state
```
**Fix:**
Remove unstable identity. Use a stable key only when identity genuinely corresponds to a meaningful entity.

43. Production Incident — Wrong Draft on Row
**Symptom:**
After sorting a list, one row displays another row's input state.

**Root cause:**
`key={index}`
The key tracks position. The domain identity tracks `item.id`. The two identities diverged.

**Fix:**
`key={item.id}`
Now:
$$\text{React identity} \approx \text{entity identity}$$

44. Production Incident — Editor Doesn't Update
**Symptom:**
The parent receives a new user `Bob`, but the editor still shows `Alice`.

**Root cause:**
The editor intentionally initialized `useState(user.name)`, but the architecture assumed this meant continuous synchronization. It does not.

**Correct architectural choices:**
- **Live view:** Derive directly from user.
- **Independent draft:** Keep local state and define an explicit transition when the selected entity changes.
- **Entity-scoped lifecycle:** Use `key={user.id}` when a new entity should mean a new editor occurrence.

45. Diagnostic Lab — State Lifetime Map
For every state value, document:
```
State:                              _________________________
Owner:                              _________________________
Concept:                            _________________________
Initial value:                      _________________________
Should survive re-render?           YES / NO
Should survive component remount?   YES / NO
Should survive entity change?       YES / NO
Should survive page navigation?     YES / NO
Reset trigger:                      _________________________
```
This exposes lifetime mismatches.

46. Diagnostic Lab — Identity Trace
When state unexpectedly resets, record:
```
Render N:   type = ? key = ? position/context = ?
Render N+1: type = ? key = ? position/context = ?
```
Then determine:
*same identity?*
If not:
*why did identity change?*
This is more reliable than randomly adding setters or effects.

47. Diagnostic Lab — Derived-State Audit
For every state variable:
- Can I calculate this from props?
- Can I calculate this from state?
- Can I calculate this from props + state?

If yes, ask:
*Why is it state?*
If the answer is only: “It is easier to access,” that is usually insufficient.

48. Diagnostic Lab — Reset Mechanism Audit
Classify every reset as:
- **A.** Explicit state transition
- **B.** Component identity change
- **C.** External persistence reset
- **D.** Derived recalculation

Then ask:
> Does the mechanism match the semantic requirement?

---

Layer 4 — 🔥 The Crucible

49. Crucible Challenge 1 — Re-render vs Remount
Explain the difference between:
- `re-render`
and:
- `remount`
Then explain what happens to `state`, `effects`, and `component initialization` in each case.

50. Crucible Challenge 2 — Key Change
Given:
```javascript
<Editor key={user.id} user={user} />
```
Predict state behavior:
- **Render A:** `user.id = 1`, `draft = "Alice"`
- **Render B:** `user.id = 1`, `user.name = "Alice Smith"`
- **Render C:** `user.id = 2`, `user.name = "Bob"`
Explain the state in each render.

51. Crucible Challenge 3 — Random Key
Given:
```javascript
<Editor key={Math.random()} />
```
Explain what happens across three parent renders.
Track: `identity`, `state`, `effects`.

52. Crucible Challenge 4 — Derived Selection
Given:
```javascript
const [selectedId, setSelectedId] = useState("A");
const selected = products.find(p => p.id === selectedId);
```
Explain why `selected` does not need to be state.
Then describe a case where a similarly named value would legitimately become independent state.

53. Crucible Challenge 5 — Draft Architecture
Design an editor where:
```
server data ↓ initial draft ↓ user edits locally ↓ save
```
Answer:
1. What is canonical?
2. What is draft state?
3. What should happen if server data changes?
4. When should draft reset?
5. Should reset be explicit or identity-driven?

54. Crucible Challenge 6 — List Identity
Given:
```javascript
items.map((item, index) => (
  <Row key={index} item={item} />
))
```
The list can: `insert`, `delete`, `reorder`.
Predict what happens to row-local state after moving item 3 to position 1.
Then explain why `key={item.id}` changes the result.

55. Crucible Challenge 7 — Conditional State
Given:
```javascript
{showEditor && <Editor />}
```
Track:
`showEditor = true` $\to$ `showEditor = false` $\to$ `showEditor = true`.
What happens to the editor's state?

Now compare with:
```jsx
<Editor style={{ display: showEditor ? "block" : "none" }} />
```
Explain the state-lifetime difference.

56. Crucible Challenge 8 — Prop Synchronization
Given:
```javascript
function Editor({ user }) {
  const [name, setName] = useState(user.name);

  useEffect(() => {
    setName(user.name);
  }, [user.name]);

  return ...
}
```
Identify the architectural ambiguity.
Then propose two different solutions:
- **live value**
and:
- **independent draft**

57. Crucible Challenge 9 — Explicit Reset vs Key Reset
You have:
- `Cancel editing`
and:
- `Switch to another document`
Which should normally use `explicit reset` and which may naturally use `identity change`?
Explain why.

58. Crucible Challenge 10 — Full State Lifetime Review
For this application:
```
Dashboard
├── SearchInput
├── ProductList
│   └── ProductRow*
├── ProductEditor
└── Notification
```
Classify:
- `search query`
- `row input draft`
- `selected product`
- `editor draft`
- `notification message`
- `product count`

for:
- owner
- lifetime
- canonical/derived
- reset mechanism
- identity relationship

59. Senior Decision Matrix
| Requirement | Preferred Mechanism |
| :--- | :--- |
| Value is pure calculation | Derive |
| User edits independently | Local state |
| Value must survive rerender | Component state |
| New entity should have fresh local state | Stable entity key / identity boundary |
| User clicks Reset | Explicit state transition |
| Different component occurrence should have new lifecycle | Remount |
| Value must survive component unmount | External persistence/owner |
| Value must survive page refresh | Persistent storage/server |
| Row state must follow entity | Stable entity key |
| Temporary render calculation | Local variable / derived value |
| Prop is always source of truth | Controlled/live prop |
| Prop seeds an independent draft | State initialization |
| Prop continuously mirrors draft | Usually reconsider architecture |

60. Senior Gotchas
- **Gotcha 1:** “A rerender resets local state.”  
  ❌ False. A rerender normally preserves state when identity is preserved.
- **Gotcha 2:** “useState(prop) keeps state synchronized with the prop.”  
  ❌ False. It establishes initial state.
- **Gotcha 3:** “Changing props remounts the component.”  
  ❌ False. A component can receive entirely different props while preserving identity and state.
- **Gotcha 4:** “Changing a key only changes a prop.”  
  ❌ False. `key` participates in identity.
- **Gotcha 5:** “A key should be unique across the entire application.”  
  ❌ False. Keys are meaningful within the relevant sibling set.
- **Gotcha 6:** “Random keys are a reliable way to reset state.”  
  ❌ They force identity churn and can destroy legitimate state persistence.
- **Gotcha 7:** “Every reset requires a remount.”  
  ❌ False. Many resets are ordinary state transitions.
- **Gotcha 8:** “Every new entity requires a new component.”  
  ❌ False. Sometimes the same component occurrence should intentionally transition to new props/state.
- **Gotcha 9:** “Derived data should be stored if it is used frequently.”  
  ❌ Usage frequency does not turn deterministic data into canonical state.
- **Gotcha 10:** “If state is persistent, it must be global.”  
  ❌ False. Persistence across renders is the normal purpose of local React state.

61. Completion Checklist

**State Lifetime**
- [ ] Explain state persistence.
- [ ] Explain state reset.
- [ ] Distinguish render from remount.
- [ ] Explain component occurrence identity.
- [ ] Explain state lifetime.
- [ ] Explain why state survives rerenders.
- [ ] Explain why state disappears after remount.
- [ ] Explain why source-code location is not the complete identity model.

**Keys**
- [ ] Explain what keys represent.
- [ ] Explain key locality.
- [ ] Explain stable entity keys.
- [ ] Explain index-key failure modes.
- [ ] Explain why random keys are dangerous.
- [ ] Explain why key is not an ordinary prop.
- [ ] Explain intentional key-based resets.

**Prop/State Boundaries**
- [ ] Distinguish initialization from synchronization.
- [ ] Distinguish live props from independent drafts.
- [ ] Identify prop-to-state synchronization traps.
- [ ] Choose appropriate reset semantics.
- [ ] Explain controlled/live ownership.
- [ ] Explain independent draft ownership.

**Derived State**
- [ ] Identify deterministic derived values.
- [ ] Avoid redundant state.
- [ ] Explain canonical vs derived information.
- [ ] Explain selected ID vs selected object.
- [ ] Distinguish temporal state from pure derivation.

**Architecture**
- [ ] Identify state owner.
- [ ] Identify concept lifetime.
- [ ] Identify reset trigger.
- [ ] Decide explicit reset vs identity reset.
- [ ] Decide local state vs external persistence.
- [ ] Diagnose accidental remounts.
- [ ] Diagnose accidental state persistence.
- [ ] Diagnose wrong state attached to list entities.

**Prediction**
- [ ] Predict state across rerenders.
- [ ] Predict state across conditional removal/recreation.
- [ ] Predict state across key changes.
- [ ] Predict state across prop changes.
- [ ] Predict state across stable list reorders.
- [ ] Predict state across index-key list reorders.
- [ ] Explain derived-state recalculation.

62. Final Engineering Principle
> 🏆 **State lifetime is an architectural decision. React preserves state because identity persists; React resets state because identity changes. Your job is to make that identity boundary match the lifetime of the concept the state represents.**

The complete model is:
```
DOMAIN CONCEPT
      │
      ▼
Concept lifetime
      │
      ▼
State ownership
      │
      ▼
State lifetime
      │
      ▼
Component identity
      │
  ┌───┴───────────────┐
  │                   │
same identity    new identity
  │                   │
  ▼                   ▼
preserve state   initialize state
```

And for every value:
```
Is it canonical?
  │
  ├── YES → How long should it live?
  │           │
  │           ▼
  │         Who owns that lifetime?
  │
  └── NO  → Can it be derived?
              ├── YES → derive
              └── NO  → identify its independent concept
```

This prevents two of the most expensive classes of React state bugs:
- *state disappears when it should persist*
and:
- *state persists when it should reset*

The mature React engineer does not treat these as mysterious framework behaviors.
They trace:
$$\text{concept} \to \text{ownership} \to \text{lifetime} \to \text{identity} \to \text{preservation/reset} \to \text{render} \to \text{commit}$$

63. KPI 04 Boundary
This Part establishes:
- state persistence
- remount vs rerender
- component identity and state lifetime
- key-driven identity
- intentional resets
- explicit resets
- prop-to-state initialization
- independent drafts
- live values
- derived-state boundaries
- state lifetime vs domain lifetime
- local React state vs persistent application data

**Deferred:**
- advanced external stores
- Redux architecture
- server-state libraries
- persistence synchronization protocols
- concurrent state preservation mechanics
- React scheduler internals
- advanced state-machine libraries
- Server Components state boundaries

Those belong to later curriculum boundaries.

64. Master Mental Model
KPI 04 now has a more complete architecture:
```
        EVENT
          │
          ▼
   STATE TRANSITION
          │
          ▼
┌─────────────────┐
│ CANONICAL STATE │
└────────┬────────┘
         │
    ┌────┴────────────────────┐
    ▼                         ▼
Persistent state        Derived values
    │                         │
    └────────────┬────────────┘
                 ▼
          Render Snapshot
                 │
                 ▼
            React Tree
                 │
                 ▼
             Identity
                 │
        ┌────────┴─────────┐
        ▼                  ▼
  same identity       new identity
        │                  │
        ▼                  ▼
  preserve state    initialize state
        │                  │
        └────────┬─────────┘
                 ▼
           Reconciliation
                 │
                 ▼
               Commit
```

The final state architecture principle is:
> **Store independently meaningful information, derive deterministic consequences, model transitions explicitly when relationships become complex, and make component identity boundaries match the intended lifetime of state.**

That is the foundation required before moving deeper into React state architecture patterns.
