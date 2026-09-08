Level 06 — React Fundamentals
KPI 03 — Components, Props & Composition
PART 04 — Component Communication & Event Contracts
[⬅️ Previous Part](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/03-children-composition-and-slot-like-component-apis.md) | [📚 Level 06 Index](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/README.md) | [🧪 Companion Lab](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/examples/04-component-communication-events.html) | [Next Part ➡️](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/05-component-api-design-and-production-patterns.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models
1. The Core Communication Model
React's default communication model is intentionally directional:
DATA DOWN
│
▼
┌───────────┐
│  Parent   │
└─────┬─────┘
      │ props
      ▼
┌───────────┐
│   Child   │
└─────┬─────┘
      │ callback
      ▼
┌───────────┐
│  Parent   │
└───────────┘
EVENT UP

The child does not directly modify the parent's state.
Instead:
Child detects interaction
↓
Child invokes callback
↓
Parent receives semantic event
↓
Parent updates owned state
↓
Parent renders again
↓
New props flow downward

This is the fundamental data-down / events-up model.

2. Components Do Not "Talk" Arbitrarily
A common beginner mental model is:
Component A ───────► Component B
Component B ───────► Component C
Component C ───────► Component A

That quickly becomes difficult to reason about.
React's preferred model is:
State Owner
│
┌──────────┴──────────┐
│                     │
props               props
│                     │
▼                     ▼
Child A             Child B
│                     │
event               event
│                     │
└──────────┬──────────┘
           ▼
      State Owner

The owner coordinates the shared state.

3. The Golden Rule
The component that owns mutable state should normally own the state transition; descendants communicate intent through explicit event contracts.
That means:
<Child onDelete={handleDelete} />
is usually a healthier boundary than:
<Child setUsers={setUsers} />
because the first exposes intent, while the second exposes implementation.

4. Communication Has Four Major Forms
At this level, distinguish:
Mechanism | Direction | Purpose
--- | --- | ---
Props | Parent → Child | Data/configuration
Callback props | Child → Parent | Events/requests
Composition | Parent/consumer → Component | Structure/content
Shared context/state | Ancestor → descendants | Cross-cutting/shared information

This Part focuses primarily on:
props
callbacks
events
ownership
component communication contracts

Context and advanced shared-state mechanics should not be introduced merely to avoid understanding ordinary props.

5. Event ≠ State Mutation
A child should generally communicate:
"User selected item 42."
rather than:
"Set your selectedItem state to 42."

This distinction is fundamental.
EVENT ↓ semantic information
STATE UPDATE ↓ owner's implementation decision

The parent decides how to translate the event into state.

6. Semantic Event Contract
Weak:
<Child setValue={setValue} />

Stronger:
<Child onValueChange={handleValueChange} />

Even stronger when domain-specific:
<UserList onUserSelected={handleUserSelected} />

The child says:
"What happened."
The parent decides:
"What that means for application state."

Layer 2 — 🔬 Deep Mechanical Breakdown
7. Parent → Child Communication
Basic example:
function Parent() {
  const user = { name: "Srikar" };
  return <Child user={user} />;
}

function Child({ user }) {
  return <h2>{user.name}</h2>;
}

Flow:
Parent render
│
▼
user value
│
▼
React element Child + props
│
▼
Child render
│
▼
UI

The child consumes the value.
It does not own the parent's user.

8. Child → Parent Communication
Now:
function Parent() {
  const [selectedId, setSelectedId] = useState(null);

  function handleSelect(id) {
    setSelectedId(id);
  }

  return (
    <Child
      selectedId={selectedId}
      onSelect={handleSelect}
    />
  );
}

function Child({ selectedId, onSelect }) {
  return (
    <button onClick={() => onSelect(42)}>
      Select
    </button>
  );
}

The flow is:
User interaction
↓
Child event handler
↓
onSelect(42)
↓
Parent handler
↓
setSelectedId(42)
↓
Parent update
↓
new selectedId prop
↓
Child render

The child never directly touches:
selectedId state storage
It invokes the capability exposed by the parent.

9. Callback Props Are Capabilities
A function prop can be viewed as a capability:
onDelete
onSelect
onSubmit
onClose
onRetry

The receiving component gets permission to perform a specific operation.
For example:
<UserRow onDelete={handleDelete} />
means:
UserRow: "I have the ability to request deletion."
It does not mean:
UserRow: "I own deletion state."

This distinction becomes extremely useful when designing reusable component APIs.

10. Event Contracts Should Be Semantic
Suppose:
<UserCard onClick={...} />
What does onClick mean?
Possibly:
card clicked
user selected
profile opened
navigation requested

The ambiguity may matter.
Compare:
<UserCard onUserSelected={handleUserSelected} />
Now the contract has domain semantics.
The browser event is an implementation detail.
The component event describes the component's meaning.

11. DOM Events vs Component Events
These are different abstraction levels.

DOM-level:
<button onClick={handleClick}>
The event is a browser interaction.

Component-level:
<UserPicker onUserSelected={handleSelected} />
The event represents application-level meaning.

Conceptually:
Browser event
↓
Component interprets interaction
↓
Domain event
↓
Parent handles application behavior

A reusable component should often translate low-level interaction into meaningful component events.

12. Example — Translating DOM Interaction
Bad boundary:
<UserRow onClick={event => {
  // parent knows DOM structure
}} />

Better:
<UserRow user={user} onSelect={handleSelect} />

Inside:
function UserRow({ user, onSelect }) {
  return (
    <button onClick={() => onSelect(user.id)}>
      {user.name}
    </button>
  );
}

Now the parent doesn't need to understand:
button click event
DOM event target
internal markup
The child translates those details into:
user selected

13. Callback Payload Design
Consider:
onSelect(user)
versus:
onSelect(user.id)
versus:
onSelect({ id: user.id, source: "search" })

There is no universal answer.
Ask:
What does the event mean?
What information does the consumer legitimately need?
Would passing the entire object couple the component to its current representation?
Does the payload contain implementation details?

A good payload is:
minimal
semantic
stable
useful

14. Avoid Accidental Payload Coupling
Suppose:
onSubmit({
  values,
  internalValidationState,
  touchedFields,
  renderVersion,
  internalId
})

This exposes implementation details.
The parent now depends on the child's internals.

Prefer:
onSubmit(values)
when the contract is simply:
"The user submitted these values."

15. Callback Direction
Consider:
<Parent>
  <Child onSave={handleSave} />
</Parent>

The function reference flows:
Parent
│
│ callback reference
▼
Child

But invocation flows:
Child
│
│ callback()
▼
Parent

This produces an important distinction:
Function ownership: Parent
Function invocation: Child

The child is allowed to invoke the capability, but the parent owns the implementation.

16. Callback Does Not Mean Child Controls Parent
This misconception is common.
function Parent() {
  function handleDelete(id) {
    // Parent owns state transition
  }

  return <Child onDelete={handleDelete} />;
}

The child calls:
onDelete(id);

But the parent still controls:
what deletion means
whether deletion is allowed
what state changes
whether an API call occurs
whether navigation occurs
whether an error is shown

The callback is an inversion-of-control mechanism, not ownership transfer.

17. State Ownership Determines Communication
Suppose two sibling components need the same state:
      Parent
      /    \
     /      \
Child A    Child B

If A changes something B must see:
Wrong mental model:
A ─────────► B

Better:
      Parent
      /    \
     ▼      ▼
     A      B
     │      │ event
     ▼      │
   Parent ──┘
     │
     │ new props
     └────────► B

The parent becomes the common owner.
This is the classic lifting state up pattern.

18. Lifting State Up
Before:
function ChildA() {
  const [value, setValue] = useState("");
}
and:
function ChildB() {
  // needs value
}

The state is owned too low.

Move it:
function Parent() {
  const [value, setValue] = useState("");

  return (
    <>
      <ChildA value={value} onChange={setValue} />
      <ChildB value={value} />
    </>
  );
}

Now:
Single source of truth
│
├──► Child A
└──► Child B

This is not merely a React pattern.
It is an ownership decision.

19. The Narrowest Common Owner Principle
When multiple components need the same state:
Place the state at the lowest component in the tree that can correctly own it while making it available to every consumer that needs it.

Do not automatically put it in:
App
global store
context
just because multiple descendants use it.
The target is the narrowest common owner.

20. Too-Low State
Parent
├── A
│   └── state
│
└── B

If B needs A's state:
A owns state
B needs state
The ownership boundary is wrong.
Lift it.

21. Too-High State
Now:
App
└── Dashboard
    └── UserEditor
        └── local interaction

If the value only matters to:
UserEditor
putting it in App may create unnecessary propagation.

A senior engineer asks:
Who actually needs this state?
Who should own its lifecycle?
How far does it need to travel?

22. Render-by-Render Prediction #1 — Child Event
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <Child
      count={count}
      onIncrement={() => setCount(c => c + 1)}
    />
  );
}

function Child({ count, onIncrement }) {
  return (
    <button onClick={onIncrement}>
      {count}
    </button>
  );
}

Render #1:
Parent state: count = 0
Child props: count = 0
onIncrement = Function A

DOM:
<button>0</button>

User clicks
Child invokes:
onIncrement()
That executes the parent-owned callback.
The state update is scheduled.

Render #2:
Parent state: count = 1
Child props: count = 1
onIncrement = Function B

DOM:
<button>1</button>

The communication cycle is:
event
↓
callback
↓
owner state update
↓
render
↓
new props
↓
new UI

23. Render-by-Render Prediction #2 — Two Siblings
function Parent() {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <>
      <List selectedId={selectedId} onSelect={setSelectedId} />
      <Details selectedId={selectedId} />
    </>
  );
}

Initial:
Parent selectedId = null
List selectedId = null
Details selectedId = null

List invokes:
onSelect(42)

Parent becomes:
selectedId = 42

New render:
List selectedId = 42
Details selectedId = 42

The siblings did not communicate directly.
The owner coordinated them.

24. Render-by-Render Prediction #3 — Event Payload
function UserList({ users, onSelect }) {
  return users.map(user => (
    <button
      key={user.id}
      onClick={() => onSelect(user.id)}
    >
      {user.name}
    </button>
  ));
}

For:
[
  { id: 10, name: "A" },
  { id: 20, name: "B" }
]

the rendered handlers conceptually represent:
Button A → onSelect(10)
Button B → onSelect(20)

The parent does not need to know how the buttons are structured.

25. Render-by-Render Prediction #4 — Callback Closure
function Parent() {
  const [selectedId, setSelectedId] = useState(10);

  function handleDelete() {
    console.log(selectedId);
  }

  return <Child onDelete={handleDelete} />;
}

Render #1:
selectedId = 10
handleDelete closure captures render snapshot

After:
setSelectedId(20);

Render #2 creates a new handleDelete.
Render #2 selectedId = 20
handleDelete closure captures new snapshot

An event handler created by a render is associated with that render's lexical environment.
This is why React event logic must be understood together with JavaScript closures.

26. Stale Closure Scenario
Consider:
function Parent() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setTimeout(() => {
      console.log(count);
    }, 1000);
  }

  return <button onClick={handleClick}>Run</button>;
}

Suppose:
Render #1 count = 0
User clicks.

Then parent updates:
Render #2 count = 1

The timeout callback created during Render #1 can still observe:
count = 0
because its closure belongs to the earlier render.

This is not a React bug.
It follows from JavaScript lexical closures combined with React's snapshot-oriented rendering model.

27. Functional State Updates
When a callback represents an update based on previous state:
setCount(c => c + 1);

the updater communicates:
"Take the current state value used by React for this update and derive the next value."

This is often safer than:
setCount(count + 1);
when multiple updates can be queued around the same logical event.

The distinction is:
captured value vs state transition function

28. Multiple Callback Invocations
Consider:
function handleClick() {
  setCount(count + 1);
  setCount(count + 1);
}

If the closure's count is 0, both updates can conceptually request:
setCount(1)
setCount(1)

Using:
function handleClick() {
  setCount(c => c + 1);
  setCount(c => c + 1);
}
expresses:
previous → +1
result → +1
so the resulting state can advance twice.

The exact batching behavior depends on React's update processing, but the key senior concept is:
When the next state depends on previous state, use a functional updater to express the transition explicitly.

29. Event Contract: State vs Intent
Compare:
<Counter setCount={setCount} />
with:
<Counter onIncrement={handleIncrement} />

First:
Child knows: parent has count state; parent exposes setCount.

Second:
Child knows: increment is an available operation.

The second is a stronger abstraction boundary.
The child can remain reusable even if the parent later changes its state implementation from:
useState
to:
useReducer
or another state owner.

30. Callback API Stability
Suppose a component exposes:
<Editor onSave={save} />
This is usually more stable than:
<Editor
  setDraft={setDraft}
  setErrors={setErrors}
  setSaving={setSaving}
  setLastSaved={setLastSaved}
/>

The first expresses the component's domain interaction.
The second leaks internal parent state architecture.
This matters especially in shared component libraries.

31. Controlled Component Communication
A classic controlled input:
function SearchBox({ value, onChange }) {
  return (
    <input
      value={value}
      onChange={event => onChange(event.target.value)}
    />
  );
}

Flow:
Parent state
↓
value prop
↓
input
↓
DOM interaction
↓
component translates event
↓
onChange(nextValue)
↓
Parent
↓
state update
↓
new value prop

This is a complete feedback loop.
┌───────────────┐
│ Parent state  │
└───────┬───────┘
        │
        ▼ value
        │
        ▼
┌───────────┐
│   Input   │
└─────┬─────┘
      │ interaction
      ▼ onChange()
      │
      ▼
┌───────────────┐
│ Parent update │
└───────────────┘

32. Event Translation Is a Valuable Boundary
A reusable input should usually not force its parent to understand:
event.target.value
unless the API intentionally exposes DOM-level semantics.

Compare:
<SearchBox onChange={event => ...} />
with:
<SearchBox onValueChange={value => ...} />

The second abstracts the browser event.
That makes the component contract more domain-oriented.
But a lower-level primitive may intentionally preserve the DOM event.
Again:
Abstraction level must match component responsibility.

33. Callback Naming Patterns
Useful semantic patterns include:
onChange
onValueChange
onSelect
onUserSelect
onSubmit
onClose
onOpen
onCancel
onRetry
onDelete
onConfirm

Naming should answer:
What happened? or What action is being requested?

Avoid names that reveal state implementation:
setSomething
updateParentState
changeStoreValue
mutateThing
unless the component is intentionally exposing such a primitive contract.

34. Event Contracts and Validation
Suppose:
<Form onSubmit={handleSubmit} />

Should the form call:
onSubmit(values)
or:
onSubmit(event)
or:
onSubmit({ values, errors, touched })

The correct answer depends on where validation responsibility lives.
For a reusable form abstraction:
component owns: input mechanics, validation mechanics
parent owns: application-level submission behavior

Then:
onSubmit(validatedValues)
may be a stronger abstraction.

But if the component is intentionally a thin DOM wrapper:
onSubmit(event)
may be appropriate.
Do not abstract away information that consumers legitimately need.

35. Communication and Composition Together
Composition can reduce the number of communication channels.
Instead of:
<Layout
  user={user}
  onLogout={handleLogout}
  notifications={notifications}
/>

you can compose:
<Layout>
  <Header>
    <UserMenu user={user} onLogout={handleLogout} />
    <NotificationBell notifications={notifications} />
  </Header>
</Layout>

Now:
Layout
does not participate in user/notification communication.
It only owns layout.

This is an important combination:
composition + narrow communication contracts = lower coupling

36. Anti-Pattern Teardown #1 — Passing State Setters
Flawed:
<Child
  setUsers={setUsers}
  setSelectedUser={setSelectedUser}
  setModalOpen={setModalOpen}
/>

Why developers do it:
It is easy to wire.

Mechanical failure:
The child now knows the parent's state architecture.

Better:
<Child
  onUserSelect={handleUserSelect}
  onDelete={handleDelete}
/>
The parent owns the state transitions.

37. Anti-Pattern Teardown #2 — Child Directly Mutates Shared Object
Flawed:
function Child({ user }) {
  user.name = "Changed";
  return null;
}

Failure:
The child mutates a reference owned elsewhere.
This breaks explicit event-driven ownership.

Better:
function Child({ user, onRename }) {
  return (
    <button onClick={() => onRename(user.id, "Changed")}>
      Rename
    </button>
  );
}

38. Anti-Pattern Teardown #3 — Sibling-to-Sibling Ref Wiring
Conceptually:
Sibling A
│
│ imperative communication
▼
Sibling B

when the real problem is shared state.

Prefer:
      Parent
      /    \
     A      B
     │      ▲
     ▼      │
   event    │ state
     │      │
     └──────┘

Use imperative coordination only when the problem genuinely requires imperative interaction.

39. Anti-Pattern Teardown #4 — DOM Event Leakage
Flawed:
<ComplexUserPicker
  onClick={event => {
    const id = event.target
      .closest("[data-user-id]")
      .dataset.userId;
    selectUser(id);
  }}
/>

The parent now knows the child's DOM structure.

Better:
<ComplexUserPicker onUserSelected={selectUser} />
The component translates internal DOM interaction into a semantic event.

40. Anti-Pattern Teardown #5 — Event Name Is Too Generic
Flawed:
<UserCard onAction={handleAction} />

What is:
Action?
Possible meanings:
edit
delete
select
open
share
archive

Better:
<UserCard
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
or:
<UserCard onUserSelected={handleUserSelected} />

The contract should carry semantic meaning.

41. Anti-Pattern Teardown #6 — Child Owns Shared State
Flawed:
function SearchPanel() {
  const [query, setQuery] = useState("");
  return <SearchInput />;
}

function ResultsPanel() {
  // also needs query
}

The state is trapped inside one branch.

Refactor:
Move it to the narrowest common owner:
function SearchPage() {
  const [query, setQuery] = useState("");

  return (
    <>
      <SearchInput value={query} onChange={setQuery} />
      <ResultsPanel query={query} />
    </>
  );
}

Layer 3 — 🧪 Diagnostic Labs & DevTools Profiling
42. Lab A — Trace an Event End-to-End
Build:
function Parent() {
  const [value, setValue] = useState(0);

  function handleIncrement() {
    console.log("Parent handler");
    setValue(v => v + 1);
  }

  return (
    <Child
      value={value}
      onIncrement={handleIncrement}
    />
  );
}

function Child({ value, onIncrement }) {
  console.log("Child render");
  return (
    <button
      onClick={() => {
        console.log("Child event");
        onIncrement();
      }}
    >
      {value}
    </button>
  );
}

Expected conceptual trace:
Child render
↓
user click
↓
Child event
↓
Parent handler
↓
state update
↓
render
↓
new props

Use the browser console and React DevTools to verify the actual sequence.

43. Lab B — Inspect Event Payloads
Instrument:
function UserList({ users, onSelect }) {
  return users.map(user => (
    <button
      key={user.id}
      onClick={() => {
        console.table({ id: user.id, name: user.name });
        onSelect(user.id);
      }}
    >
      {user.name}
    </button>
  ));
}

Verify that the child exposes only the information intended by the contract.

44. Lab C — Detect Setter Leakage
Search your codebase for:
set*
inside JSX props.

Examples:
setUser=
setCount=
setModalOpen=
setSelected=

This is not an automatic error.
Instead classify each occurrence:
[ ] intentional low-level primitive
[ ] reusable controlled contract
[ ] accidental implementation leakage
[ ] should become semantic callback

This is a code-review exercise.

45. Lab D — Identify State Ownership
For each state variable in a page, create:
State | Current owner | Consumers | Writers | Correct owner?
--- | --- | --- | --- | ---
query | SearchPanel | Search + Results | SearchInput | Maybe
selectedId | Page | List + Details | List | Yes
isModalOpen | App | Modal | Toolbar | Maybe

Then determine:
lowest common owner

This exercise is more valuable than memorizing "lift state up."

46. Lab E — React DevTools Component Tree
Open React DevTools and inspect:
Parent
├── List
│   └── Row
└── Details

Select each component and ask:
Which props enter this component?
Which callbacks leave this component?
Which state does it own?
Which values are merely forwarded?

You are effectively reconstructing the communication graph.

47. Production Diagnostic Runbook — Sibling Synchronization Bug
Symptom:
Selecting an item updates one component but not another.

Step 1:
Find where selection state lives.

Step 2:
Identify all consumers.

Step 3:
Determine whether they share a common owner.

Step 4:
If not, lift state to the narrowest common owner.

Step 5:
Pass:
current state ↓
event callback ↑

Step 6:
Verify with React DevTools.
Expected:
event ↓ owner state ↓ render ↓ both consumers receive new props

48. Production Diagnostic Runbook — Child Knows Too Much
Symptom:
A reusable child imports or manipulates parent-specific mechanisms.
Examples:
global store directly accessed
parent setter passed everywhere
routing logic embedded unnecessarily
parent DOM queried
parent-specific state shape assumed

Step 1:
List what the child actually needs.

Step 2:
Convert parent implementation dependencies into:
props
callbacks
composition
where appropriate.

Step 3:
Keep domain-specific behavior at the correct ownership boundary.

Step 4:
Retest the component in isolation.
A good component should become easier to reuse and test after this refactor.

49. Production Diagnostic Runbook — Event Contract Ambiguity
Symptom:
Callback APIs such as:
onAction
onUpdate
onChange
onDone
have unclear semantics.

Step 1:
Define what happened.

Step 2:
Define who owns the resulting state.

Step 3:
Define the minimum payload.

Step 4:
Rename the event if necessary.

Step 5:
Document whether the callback receives:
DOM event
value
domain object
ID
event payload

Do not make consumers reverse-engineer the contract.

Layer 4 — 🔥 The Crucible
50. Senior Challenge #1 — Design a Selection Contract
You have:
<UserList
  users={users}
  setSelectedUser={setSelectedUser}
  setDetailsOpen={setDetailsOpen}
/>

Redesign the contract.
A strong direction:
<UserList
  users={users}
  selectedUserId={selectedUserId}
  onUserSelected={handleUserSelected}
/>

Why?
Because the child communicates:
User was selected.
The parent decides:
select user
open details
navigate
fetch data

51. Senior Challenge #2 — Controlled Input
Design:
SearchInput
with parent-owned state.

Expected conceptual contract:
<SearchInput
  value={query}
  onValueChange={setQuery}
/>

The component owns:
input interaction

The parent owns:
query state

The browser event stays inside the input abstraction.

52. Senior Challenge #3 — Shared Sibling State
Requirements:
UserList selects a user.
UserDetails displays the selected user.

Do not allow:
UserList → UserDetails
direct communication.

Design:
UserPage
/      \
UserList UserDetails
│       ▲
│       │
└─ event ──► owner

More precisely:
UserList
│
│ onSelect(id)
▼
UserPage state
│
│ selectedId
▼
UserDetails

53. Senior Challenge #4 — Event Payload
You are designing:
<FilePicker onFileSelected={...} />

Should it emit:
File
or:
FileList
or:
{ file, source, validation, internalDropZoneState }

Do not answer from habit.
Ask:
What is the component's abstraction?
What does the consumer need?
What implementation details should remain private?

If the component promises "a file was selected," a single semantic payload may be enough.

54. Senior Challenge #5 — Setter or Event?
Evaluate:
<Modal setOpen={setOpen} />
versus:
<Modal open={open} onClose={handleClose} />

The second generally has a stronger ownership model:
Parent owns open state.
Modal reports close intent.
The child does not need to know how open is stored.

55. Senior Challenge #6 — Event Translation
Given:
<Calendar
  onClick={event => {
    const date = event.target.dataset.date;
    // ...
  }}
/>

Redesign the boundary.
Potentially:
<Calendar onDateSelected={handleDateSelected} />

The calendar now owns:
DOM structure
interaction interpretation
date extraction

The parent receives:
semantic date selection

56. Decision Matrix — Communication
Requirement | Contract
--- | ---
Parent supplies value | Prop
Child needs parent-owned state | Prop
Child requests parent state change | Callback
Child reports semantic event | Named callback
Child reports arbitrary DOM interaction | DOM event only if appropriate
Consumer supplies UI | Composition
Siblings share state | Lift state to common owner
Deep descendants share cross-cutting value | Consider context/shared state
Child needs parent's setter implementation | Usually redesign
Parent needs child's internal state | Usually redesign ownership
Parent needs notification of child event | Callback
Component needs arbitrary content | children / composition

57. Senior Interview Gotchas
Gotcha 1:
Does a callback prop mean the child owns the callback?
No.
The parent typically owns the function implementation.
The child receives permission to invoke it.

Gotcha 2:
Does child-to-parent communication violate one-way data flow?
No.
The data model remains directional:
state → props ↓
events ↑
The callback is the mechanism through which the child communicates an event back to the owner.

Gotcha 3:
Should callbacks always receive DOM events?
No.
A reusable abstraction can translate DOM interactions into semantic values.

Gotcha 4:
Should callbacks always receive IDs instead of objects?
No.
The correct payload depends on the component's domain contract.

Gotcha 5:
Is passing a setter always bad?
No.
For low-level controlled primitives it can be acceptable.
But exposing setters often leaks ownership implementation.

Gotcha 6:
Should siblings communicate through refs?
Not as the default state-sharing mechanism.
Shared state normally belongs in their common owner.

Gotcha 7:
Does lifting state always mean moving it to App?
No.
Move it to the narrowest common owner that legitimately needs to coordinate the consumers.

Gotcha 8:
Can callbacks have stale values?
Yes.
Callbacks created during a render close over that render's lexical environment.

58. Final Crucible — Full Communication Trace
Consider:
function UserPage() {
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");

  const users = [
    { id: 1, name: "Srikar" },
    { id: 2, name: "Alex" }
  ];

  const filteredUsers = users.filter(user =>
    user.name
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  function handleSelect(id) {
    setSelectedId(id);
  }

  return (
    <>
      <SearchInput
        value={query}
        onValueChange={setQuery}
      />
      <UserList
        users={filteredUsers}
        selectedId={selectedId}
        onUserSelected={handleSelect}
      />
      <UserDetails userId={selectedId} />
    </>
  );
}

Trace the architecture.

Render #1:
query = ""
selectedId = null

Derived:
filteredUsers = [ Srikar, Alex ]

Communication:
SearchInput value = ""
UserList users = [Srikar, Alex] selectedId = null onUserSelected = handleSelect
UserDetails userId = null

User types "A"
SearchInput internally receives a browser event.
It translates:
DOM input event
↓
"A"
and invokes:
onValueChange("A")

Parent owns the update:
setQuery("A")

Render #2:
query = "A"
selectedId = null

Derived:
filteredUsers = [ Alex ]

Now:
SearchInput value = "A"
UserList users = [Alex]
UserDetails userId = null

No sibling communication occurred.

User selects Alex
UserList executes:
onUserSelected(2)

Parent:
handleSelect(2)
Parent:
setSelectedId(2)

Render #3:
query = "A"
selectedId = 2

UserList:
selectedId = 2
UserDetails:
userId = 2

The final communication graph is:
          UserPage
         /   |    \
        /    |     \
       ▼     ▼      ▼
SearchInput UserList UserDetails
     │        │
     │ onValueChange
     │        │
     ▼        │
query state   │
              │ onUserSelected
              ▼
       selectedId state
              │
        ┌─────┴─────┐
        ▼           ▼
     UserList  UserDetails

This is the React programming model operating correctly:
state ownership
↓
props downward
↓
user interaction
↓
semantic event upward
↓
state transition
↓
new render
↓
new props

59. The Senior-Level Mental Model
The mature React communication model is:
┌──────────────────┐
│   STATE OWNER    │
└────────┬─────────┘
         │ current state
         ▼ PROPS DOWN
┌────────────────┼────────────────┐
▼                ▼                ▼
Component A   Component B   Component C
│                │                │
│ event          │ event          │ event
│                │                │
└────────────────┼────────────────┘
                 ▼ CALLBACKS UP
                 │
                 ▼ STATE TRANSITION
                 │
                 ▼ RE-RENDER

This model gives you a powerful architectural test:
If a component needs to modify data, first identify who owns that data.
Then design the smallest semantic event contract through which the component can request the change.

60. Completion Checklist — Part 04
You should be able to:
[ ] Explain parent-to-child communication.
[ ] Explain child-to-parent communication.
[ ] Explain callbacks as capabilities.
[ ] Explain event contracts.
[ ] Distinguish events from state mutations.
[ ] Distinguish DOM events from component events.
[ ] Design semantic callback names.
[ ] Design callback payloads.
[ ] Avoid accidental payload coupling.
[ ] Explain callback ownership.
[ ] Explain callback invocation direction.
[ ] Explain inversion of control.
[ ] Explain lifting state up.
[ ] Identify the narrowest common owner.
[ ] Identify state that is too low.
[ ] Identify state that is unnecessarily high.
[ ] Coordinate sibling components through their common owner.
[ ] Explain controlled component communication.
[ ] Translate DOM events into semantic component events.
[ ] Explain functional state updates.
[ ] Explain stale closures at a conceptual level.
[ ] Recognize setter leakage.
[ ] Recognize direct shared-object mutation.
[ ] Recognize sibling-to-sibling communication problems.
[ ] Recognize DOM-event leakage.
[ ] Recognize ambiguous callback contracts.
[ ] Design controlled input APIs.
[ ] Design selection APIs.
[ ] Design modal close contracts.
[ ] Design semantic event payloads.
[ ] Diagnose sibling synchronization bugs.
[ ] Diagnose implementation leakage.
[ ] Audit a component communication graph.
[ ] Use React DevTools to inspect communication boundaries.
[ ] Trace an event from browser interaction to state update to committed UI.
[ ] Explain why callbacks do not violate one-way data flow.
[ ] Defend state ownership in a component architecture review.
[ ] Predict multiple renders involving callback-driven state changes.

61. Final Engineering Principle
Good React communication is not:
"How can I make this component change another component?"
It is:
Who owns the state?
↓
Who needs to consume it?
↓
Who can request a transition?
↓
What semantic event represents that request?
↓
What is the smallest useful payload?
↓
Where does the resulting state transition happen?
↓
Which new props flow from the owner?

The resulting architecture is:
OWNERSHIP
│
▼
STATE TRANSITION
│
▼
RENDER
│
▼
PROPS DOWN
│
▼
COMPONENT UI
│
▼
EVENT UP
│
└──────────────► OWNER

That loop is one of the foundational mechanical models of React.
If you can trace it render-by-render, component-by-component, and ownership-by-ownership, you are no longer merely using callbacks—you understand React's communication architecture.

Cross-KPI Boundary
This Part establishes:
parent → child data flow
child → parent event flow
callback contracts
semantic events
event payload design
lifting state
narrowest common ownership
controlled component communication
callback closures
functional state updates
communication anti-patterns

It intentionally does not deeply cover:
Context internals
reducer architecture
external state-management libraries
imperative handles/refs
advanced event delegation internals
concurrent scheduling
memoization/performance optimization
Server Components communication boundaries

Those belong to later React material.

Next:
KPI 03 — Part 05 — Component API Design, Reusability, Boundaries & Production Patterns
