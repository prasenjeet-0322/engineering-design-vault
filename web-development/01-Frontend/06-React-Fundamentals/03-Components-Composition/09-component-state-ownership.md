Level 06 — React Fundamentals
KPI 03 — Components, Props & Composition
PART 09 — Component State Ownership, Lifting State & State Placement
[⬅️ Previous Part](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/08-component-lifecycle.md) | [📚 Level 06 Index](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/README.md) | [🧪 Companion Lab](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/examples/09-state-ownership.html) | [Next Part ➡️](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/10-controlled-components.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

PART PURPOSE
State ownership is one of the most consequential architectural decisions in a React application.
The difficult question is rarely:
“How do I create state?”
The difficult question is:
“Which component should own this state, and who actually needs to coordinate around it?”

A poor state-placement decision produces:
prop drilling
duplicated state
synchronization effects
stale values
conflicting sources of truth
unnecessary coupling

A good decision produces:
clear ownership
predictable data flow
small APIs
localized updates
explicit coordination

The central principle of this Part is:
State should live at the lowest component boundary that can correctly own it while still being accessible to every consumer that must coordinate around that state.
This is the practical meaning of lifting state up.

SCOPE
This Part covers:
state ownership
state placement
local state
shared state
lifting state up
narrowest common owner
sibling coordination
duplicated state
single source of truth
derived state
state versus props
state versus refs at a conceptual level
controlled/uncontrolled ownership boundaries
state colocation
state propagation
state hoisting
state synchronization failures
state ownership and component boundaries
state ownership and composition
state ownership and lifecycle
production state-architecture diagnostics

This Part does not deeply cover:
useReducer
Context internals
external state libraries
server-state/cache architecture
advanced state machines
concurrent state semantics
transitions
advanced performance optimization
Those belong to later material.

LAYER 1 — ⚡ 30-SECOND EXECUTIVE CHEAT SHEET & CORE MENTAL MODELS
1. The Core Model
React state is not merely:
data stored inside a component
It is:
persistent UI/application information owned by a particular component occurrence across renders

The architecture is:
      STATE OWNER
           │
   ┌───────┴───────┐
   │               │
   ▼               ▼
 state          updater
   │               │
   └───────┬───────┘
           ▼
        render
           │
           ▼ props
     ┌─────┴─────┐
     ▼           ▼
  Child A     Child B
     │           │
     └─────┬─────┘
           │ callback
           ▼
      STATE OWNER

The important direction is:
state ↓ render ↓ props ↓ children
events ↑ callbacks ↑ children

2. The Narrowest Common Owner Principle
Suppose:
Component A needs state
Component B needs state
and they are siblings:
      Parent
      /    \
     A      B

The correct owner is often:
      Parent
      /    \
     A      B
with:
Parent └── owns shared state
not:
A owns copy
B owns copy

The parent is the narrowest common owner because it is the lowest component boundary that can coordinate both consumers.

3. Executive Concept Table
Concept | Core Mechanism | Production Impact | Common Senior Trap
--- | --- | --- | ---
Local state | One occurrence owns information | Keeps unrelated concerns isolated | Lifting everything globally
Shared state | Multiple components coordinate through one owner | Prevents conflicting copies | Duplicating state
State owner | Component responsible for authoritative value | Clarifies updates and lifecycle | Ownership spread across components
Lifting state | Move state to common ancestor | Enables sibling coordination | Lifting too far
Colocation | Keep state near consumers | Reduces coupling and prop plumbing | Treating all state as global
Single source of truth | One authoritative representation | Prevents divergence | Maintaining synchronized copies
Derived value | Computed from existing state/props | Avoids redundant state | Storing calculations
Callback | Child communicates event to owner | Preserves one-way flow | Passing generic setters everywhere
State boundary | Component that owns persistence | Defines responsibility | Choosing boundaries by visual layout only
State duplication | Multiple authoritative copies | Creates synchronization bugs | Assuming copies “stay in sync” automatically

4. Golden Rule
Put state at the lowest common component that needs to own and coordinate it—then pass data down and events up. Do not duplicate authoritative state merely to avoid a prop.

A useful equation:
Correct owner = lowest boundary capable of serving all components that must coordinate around the state

Not:
correct owner = highest convenient component
and not:
correct owner = component that happens to display the value

5. State Ownership Is a Responsibility
Suppose:
const [selectedId, setSelectedId] = useState<string | null>(null);

Ownership means the component decides:
what selectedId represents
when it changes
which transitions are valid
who receives the value
who can request changes
when its lifetime ends

Therefore:
state ownership
is architectural responsibility, not merely variable placement.

LAYER 2 — 🔬 DEEP MECHANICAL BREAKDOWN
6. What Does “Own State” Mean?
Consider:
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(c => c + 1)}>
      {count}
    </button>
  );
}

Counter owns:
count
because:
Counter
├── stores state
├── renders state
├── defines transitions
└── controls state lifetime

The state belongs to the component occurrence, not to the function declaration globally.
Two occurrences:
<>
  <Counter />
  <Counter />
</>
produce:
Counter occurrence A └── count A
Counter occurrence B └── count B

They do not share state merely because they use the same component type.

7. State Is Attached to Identity
This follows directly from Part 07.

Conceptually:
component type + tree position / key identity
↓
component occurrence
↓
state

Therefore changing identity can change the state lifetime.
old identity ↓ old state
new identity ↓ new state

This means state placement cannot be understood independently from component identity.

8. Local State
Local state is state needed by one component boundary.

Example:
function SearchInput() {
  const [value, setValue] = useState("");

  return (
    <input
      value={value}
      onChange={event => setValue(event.target.value)}
    />
  );
}

If no other component needs to coordinate around value, keeping it local is usually the strongest design.

Architecture:
SearchInput └── value

Advantages:
small API
low coupling
clear ownership
easier reasoning
lifecycle naturally matches component

9. Do Not Lift State Just Because You Can
Consider:
App
└── SearchPanel
    └── SearchInput

If only SearchInput needs:
draftValue
then moving it to App creates:
App └── draftValue
↓
SearchPanel
↓
SearchInput

Now the state travels through boundaries that do not need it.
This creates unnecessary coupling.

The goal is not:
“Put all state high enough that everyone can access it.”
The goal is:
“Put state exactly where its ownership requirements demand.”

10. The Opposite Failure — State Too Low
Suppose:
Dashboard
├── FilterBar
└── Results

Both need:
selectedCategory

If FilterBar owns it:
Dashboard
├── FilterBar
│   └── selectedCategory
│
└── Results

Results cannot directly consume the authoritative value.
You may end up with:
FilterBar ↓ Dashboard callback ↓ Dashboard state ↓ Results
or, worse, duplicated state:
FilterBar └── selectedCategory A
Results └── selectedCategory B

The state is too low because both siblings need coordinated access.

11. Lifting State Up
Original architecture:
Dashboard
├── FilterBar
│   └── selectedCategory
│
└── Results

Desired architecture:
Dashboard └── selectedCategory
│
├── FilterBar
└── Results

The data flow becomes:
Dashboard state
│
├──────► FilterBar
│
└──────► Results

Interaction:
FilterBar
│
│ onSelect(category)
▼
Dashboard
│
│ setSelectedCategory(...)
▼
state update
│
▼ render
│
├──────► FilterBar
└──────► Results

This is one of React's fundamental architectural patterns.

12. Narrowest Common Owner
Suppose:
App
└── Dashboard
    ├── Sidebar
    │   └── Filter
    └── Content
        └── Results

Both Filter and Results need:
category

Candidate owners:
Filter
Results
Content
Dashboard
App

The narrowest common owner is:
Dashboard
assuming both paths are under Dashboard.

Therefore:
Dashboard └── category
is usually preferable to:
App └── category
because App would own state unrelated to its broader responsibility.

13. Why Lifting Too High Is Also Bad
Consider:
App
├── Header
├── Dashboard
│   ├── Filter
│   └── Results
└── Footer

If only Filter and Results coordinate around:
category
placing it in:
App
creates a wider dependency:
App └── category
↓
Dashboard
↓
Filter / Results

The state now crosses:
Header
Footer
other unrelated branches
even if they do not care.
This increases the blast radius of the state ownership decision.

14. State Placement as a Graph Problem
Think of the component tree as a graph:
          Root
           │
     ┌─────┴─────┐
     A           B
   ┌─┴─┐       ┌─┴─┐
   C   D       E   F

Suppose:
C needs X
D needs X
The owner can be:
A

Suppose:
C needs X
F needs X
The owner may need to move higher:
Root

But if only:
C needs Y
keep Y in:
C

This yields:
owner = lowest common ancestor of consumers

subject to the additional question:
Is this component actually responsible for the meaning and transitions of the state?

The lowest common ancestor is a strong heuristic, not a mechanical law.

15. State Ownership Is More Than Consumer Location
Suppose two components display:
isAuthenticated
The fact that both consume it does not mean an arbitrary common ancestor should own it.

Authentication may belong to:
application/session boundary
rather than:
some visual parent

Therefore ask two questions:
1. Who needs the value?
2. Who should own the meaning and transitions?

The intersection determines the right architectural boundary.

16. Single Source of Truth
Suppose:
const [selectedId, setSelectedId] = useState("a");
is authoritative.

Then:
selectedId
should ideally be represented in one authoritative location.

Avoid:
Parent: selectedId = "a"
Child: selectedId = "a"
with synchronization:
Parent ↓ Child ↓ useEffect ↓ Child state

This creates:
one concept + two representations
which creates a synchronization problem.

17. Why Duplicated State Drifts
Suppose:
Parent.selected = A
Child.selected = A

Then parent updates:
Parent.selected = B
But child remains:
Child.selected = A

Now:
Parent ≠ Child
The application must decide:
Which is correct?

If the answer is:
“They should always be equal.”
then maintaining two copies is usually the wrong architecture.

Use:
single source
and derive/pass the value.

18. The Synchronization Smell
A classic smell:
function Child({ value }: Props) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // ...
}

This may be valid in a specific uncontrolled/controlled transition design, but it is frequently used as a substitute for deciding who owns the state.

The question is:
Why are there two representations?
If the child does not need independent ownership:
remove local copy
If the child genuinely needs an independent draft:
define the ownership boundary explicitly

19. State Duplication Can Be Legitimate
Not every duplicate-looking value is wrong.

Example:
Server value: "Original title"
Local draft: "Edited title before save"

These represent different concepts.
originalTitle
draftTitle
are not duplicate state if they have different semantics.

The important distinction is:
same concept vs related but different concepts

Senior engineers must avoid blindly applying:
“Never duplicate data.”
The stronger rule is:
Do not maintain multiple authoritative representations of the same conceptual state without a deliberate synchronization model.

20. State vs Derived Data
Suppose:
const [items, setItems] = useState<Item[]>([]);
const [selectedId, setSelectedId] = useState<string | null>(null);

You can derive:
const selectedItem = items.find(item => item.id === selectedId) ?? null;

Do not automatically create:
const [selectedItem, setSelectedItem] = useState<Item | null>(null);

because now:
items
selectedId
selectedItem
must remain synchronized.

The first design has:
two authoritative inputs
one derived result

The second creates:
three mutable representations
with additional consistency obligations.

21. State Ownership and Props
If:
Parent owns state
then:
Parent
│
├── value ─────► Child
│
└── callback ◄── Child

This gives:
data down
events up

Example:
function Tabs() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <>
      <TabList activeTab={activeTab} onChange={setActiveTab} />
      <TabPanel activeTab={activeTab} />
    </>
  );
}

Tabs owns:
activeTab
TabList does not need its own authoritative copy.

22. Avoid Generic Setter Leakage
This:
<TabList setActiveTab={setActiveTab} />
works mechanically.
But it exposes the parent's state-management mechanism.

Prefer:
<TabList onChange={setActiveTab} />
or:
<TabList onSelectTab={setActiveTab} />

The difference is architectural.
Generic setter:
"change this state variable"
Semantic callback:
"the user selected this tab"

The latter expresses the component contract rather than the owner's implementation.

23. State Ownership and Semantic Events
Suppose:
<Accordion onOpenChange={...} />
is preferable to:
<Accordion setState={...} />
because the child component exposes:
domain/UI event
rather than:
parent state implementation

This preserves encapsulation.
The parent owns the state.
The child owns the interaction surface.

24. State Ownership and Composition
Composition can eliminate the need to lift state through multiple layers.

Suppose:
Page └── Layout └── Content └── Button

If only Page owns some data but Layout and Content merely relay props:
Page ↓ Layout ↓ Content ↓ Button
you may be creating a relay chain.

Composition can sometimes change the boundary:
<Layout>
  <PageControls data={data} />
</Layout>

Now Layout does not need to understand data.

The principle:
Do not move state merely to satisfy component structure when composition can preserve ownership without creating prop plumbing.

25. State Colocation
Colocation means:
Keep state and behavior near the component boundary that actually uses and owns them.

Example:
ProductCard
├── expanded
├── toggle
└── UI

rather than:
App
└── expandedCards
    ↓
    ProductGrid
    ↓
    ProductCard
when no other part of the application needs to coordinate with expansion.

Colocation reduces:
API surface
prop depth
coupling
reasoning scope

26. The Cost of Over-Lifting
Imagine:
App
└── Dashboard
    └── ProductPage
        └── ProductGrid
            └── ProductCard

and ProductCard owns:
isExpanded

If you lift it to App:
App └── expandedProductIds
you have introduced a dependency through every intermediate boundary.

Potential consequences:
App knows card concerns
Dashboard knows card concerns
ProductPage knows card concerns
ProductGrid knows card concerns

This is architecture leakage.

27. The Cost of Under-Lifting
Opposite example:
Dashboard
├── Filter
│   └── category
└── Results
    └── category

Two copies may diverge.
Symptoms:
Filter says "Books"
Results shows "Electronics"

The problem is not necessarily rendering.
The problem is:
incorrect state ownership

28. Ownership Decision Algorithm
For every state value:
Step 1: What concept does this state represent?
↓
Step 2: Who needs to read it?
↓
Step 3: Who needs to change it?
↓
Step 4: Which components must coordinate around it?
↓
Step 5: What is the lowest common owner?
↓
Step 6: Does that owner have semantic responsibility for the state?
↓
Step 7: Can unrelated branches remain unaware?
↓
Step 8: Can derived values remain derived?
↓
Step 9: Can child APIs express semantic events instead of exposing setters?

This is a practical state-placement review.

29. Prediction-First Walkthrough — Local State
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      {count}
    </button>
  );
}

Render #1:
Counter occurrence state: count = 0
UI: 0

Click:
setCount(c => c + 1)

Render #2:
count = 1

Same component occurrence.
Same state owner.
State persists.

30. Prediction-First Walkthrough — Two Occurrences
<>
  <Counter />
  <Counter />
</>

Initial:
Counter A count = 0
Counter B count = 0

Click A:
Counter A count = 1
Counter B count = 0

Why?
Because:
same type ≠ same occurrence
Each occurrence owns independent state.

31. Prediction-First Walkthrough — Lifted State
Consider:
function Parent() {
  const [value, setValue] = useState("");

  return (
    <>
      <Input value={value} onChange={setValue} />
      <Preview value={value} />
    </>
  );
}

Render #1:
Parent state: value = ""
Children receive:
Input: value = ""
Preview: value = ""

User types:
"A"
Input invokes:
onChange("A")
Parent updates state.

Render #2:
Parent state: value = "A"
Both children receive: "A"

One state owner coordinates both consumers.

32. Prediction-First Walkthrough — Incorrect Duplication
function Parent() {
  const [value, setValue] = useState("");
  return <Child value={value} />;
}

function Child({ value }: Props) {
  const [localValue, setLocalValue] = useState(value);

  return (
    <input
      value={localValue}
      onChange={e => setLocalValue(e.target.value)}
    />
  );
}

Now there are:
Parent.value
Child.localValue

Initial: ""
Child changes: Child.localValue = "abc"
Parent remains: ""

The values have different owners.
If the intended concept was a single shared input value, the architecture is incorrect.

33. Controlled Ownership Boundary
A controlled component makes the ownership explicit:
<Input value={value} onChange={setValue} />

The parent owns:
value
The child renders it and emits events.

Parent
├── owns value
│
├── passes value
└── receives onChange

This is particularly powerful when multiple components must coordinate around the same value.

34. Uncontrolled Ownership Boundary
A component can instead own its internal state:
function Input() {
  const [value, setValue] = useState("");
  return ...;
}

Then:
Input └── owns value
No parent coordination is required.

The architectural choice is:
Who should be authoritative?
not:
Which pattern is universally better?

35. State Ownership and Lifecycle
State lifetime follows component identity.
If:
component occurrence
is preserved:
state can persist across renders
If it is unmounted/replaced:
state lifetime ends

Therefore:
state ownership + identity + lifecycle
are connected.

Example:
unstable key
↓
identity replacement
↓
old occurrence unmount
↓
state discarded
↓
new occurrence mount
↓
new state

A state-reset bug can therefore originate from a key/identity bug rather than from the state declaration itself.

36. State Ownership and Composition
Consider:
function Modal({ children }: Props) {
  const [open, setOpen] = useState(false);

  return open ? (
    <div>
      {children}
      <button onClick={() => setOpen(false)}>Close</button>
    </div>
  ) : null;
}

Modal owns:
open
but does not need to own the child's domain data.

Composition allows:
Modal
├── modal lifecycle
└── children supplied by consumer

This is a clean separation:
container behavior + consumer-owned content

37. State Ownership Anti-Pattern — Global by Default
Bad architecture:
GlobalState
├── modalOpen
├── searchDraft
├── cardHover
├── accordionOpen
├── temporaryInput
└── localDropdown

Why developers do it:
“Then every component can access everything.”

Mechanical problem:
local concern
↓
global ownership
↓
global coupling
↓
larger blast radius

Not every shared-looking value is application-global state.
Start local.
Lift only when coordination requires it.

38. State Ownership Anti-Pattern — Copy Props Into State
function Profile({ name }: Props) {
  const [localName, setLocalName] = useState(name);
}

This is not automatically wrong, but it creates two representations.
Ask:
Is localName an editable draft?
If yes:
different concept
If no:
probably redundant state

The semantic distinction is more important than the syntax.

39. State Ownership Anti-Pattern — Parent Owns Everything
A common overcorrection:
App
├── all state
├── all callbacks
├── all data
└── all orchestration

This becomes a god component.
Symptoms:
huge state surface
large prop contracts
deep prop drilling
unrelated updates
unclear ownership

The answer is not necessarily “move everything into Context.”
First ask:
Which state actually needs to be shared?

40. State Ownership Anti-Pattern — Child Owns Shared State
Example:
Dashboard
├── Filter
│   └── selectedFilter
└── Results

If Results needs the same value, keeping it only in Filter creates awkward communication.
You may see:
Filter ↓ callback Dashboard ↓ callback Filter
or duplicated state.

Lift the state to the narrowest common owner.

41. State Ownership Anti-Pattern — Synchronization Effects
Bad:
function Parent() {
  const [value, setValue] = useState("");
  return <Child value={value} />;
}

function Child({ value }: Props) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return ...;
}

This introduces:
Parent state
↓
prop
↓
effect
↓
Child state

The question is:
Why does the child need a second owner?
If the answer is simply:
“Because the child needs the value,”
then the local copy is probably unnecessary.

42. Diagnostic Lab — State Ownership Trace
For a suspicious component, write:
State: __________
Current owner: __________
Consumers: __________
Writers: __________
Derived values: __________
Callbacks: __________
Lifecycle: __________
Potential duplicate representations: __________

Then draw:
OWNER
│
├── value ─────► consumer A
│
├── value ─────► consumer B
│
└── event ◄──── consumer A/B

If you instead find:
A owns copy
B owns copy
Parent owns copy
stop and investigate.

43. Diagnostic Lab — React DevTools
Use React DevTools to inspect:
Component tree.
Component state.
Props.
Which component currently owns the value.
Which component changes it.
Whether multiple components maintain similar copies.
Whether a state value survives a rerender.
Whether a state value resets after a key/identity change.

A particularly useful question:
Where is the authoritative state actually stored?

Do not infer ownership from:
which component displays the value
Display and ownership are different responsibilities.

44. Diagnostic Lab — Render Logging
Instrument:
function DebugPanel(props: Props) {
  console.table({
    component: "DebugPanel",
    propValue: props.value
  });

  const [localValue, setLocalValue] = useState("");
  console.table({ localValue });

  return ...;
}

Compare:
propValue
localValue
across renders.

If they are supposed to represent the same concept but diverge:
state ownership problem
may be present.

45. Production Incident — Two UI Regions Disagree
Symptom:
Filter UI says:
Category: Books
Results display:
Category: Electronics

Investigation:
Trace:
Filter.selectedCategory
Results.selectedCategory

If both exist:
duplicate state

Determine whether they represent:
same concept

If yes:
lift to common owner

Architecture:
Dashboard └── selectedCategory
├── Filter
└── Results

46. Production Incident — State Resets Unexpectedly
Symptom:
A form loses its draft when the parent updates.

Possible investigation path:
1. Does the component remain mounted?
2. Did its identity change?
3. Did its key change?
4. Did the component type change?
5. Is the state actually owned by this occurrence?
6. Is the component being remounted?
7. Is the parent replacing the subtree?

Do not immediately conclude:
“React state is unreliable.”
State persistence depends on component identity.

47. Production Incident — Prop Drilling Explosion
Symptoms:
Page
↓
Layout
↓
Section
↓
Panel
↓
List
↓
Item
with:
value
onChange
onSelect
setValue
data
passed through layers that do not consume them.

First ask:
Does composition remove the need for intermediate components to know about the data?

Then ask:
Is the state actually shared widely enough to justify another state-distribution mechanism?

Do not jump immediately to global state.

48. Production Incident — “We Need Global State”
Before introducing global ownership, classify the state:
Local?
Shared by siblings?
Shared within feature?
Shared across routes?
Application-wide?
Server-owned?
URL-owned?
Form-owned?

A useful first-level classification:
State | Typical Ownership
--- | ---
Input draft | Input/form boundary
Accordion open | Accordion/list boundary
Active tab | Tab container
Filter shared by filter + results | Feature/common parent
Auth/session | Application/session boundary
URL filter | Router/URL boundary
Server cache | Data/server-state layer

The exact architecture depends on the application, but classification prevents premature globalization.

49. State Ownership Decision Matrix
Question | Keep Local | Lift Up | Broader State Boundary
--- | :---: | :---: | :---:
Only one component needs it | ✅ | ❌ | ❌
Two siblings need coordination | ❌ | ✅ | ❌
Multiple descendants need same feature state | Maybe | ✅ | Maybe
Many unrelated branches need it | ❌ | Maybe | ✅
State is URL-derived | ❌ | ❌ | Router/URL
State is server-owned | ❌ | ❌ | Data layer
State represents temporary UI interaction | ✅ | Maybe | Usually ❌
State represents app session | ❌ | ❌ | Broader boundary

50. Senior Design Heuristic
For every state variable, document:
Concept: __________
Authoritative owner: __________
Readers: __________
Writers: __________
Derived values: __________
Lifetime: __________
Coordination boundary: __________
Why this owner? __________

If the answer to:
Why this owner?
is:
“Because it was convenient.”
that is an architecture smell.

51. Six-State-Placement Questions
Before committing state to a component, answer:

1. What does the value mean?
Not: "some boolean"
Instead: "is checkout panel currently open"

2. Who needs to read it?
List every consumer.

3. Who needs to change it?
List every writer/event source.

4. Who must coordinate around it?
This determines sharing requirements.

5. What is its lifetime?
Does it belong to:
component
feature
route
session
application
server

6. Can it be derived?
If yes, avoid storing another copy.

52. State Ownership and Change Propagation
Suppose:
Parent
├── A
└── B

Parent owns:
x

When x changes:
state update
↓
Parent render
↓
resulting child tree
↓
A receives x
B receives x

The architectural consequence is:
State placement determines the boundary through which changes propagate.

Therefore moving state upward is not free.
It changes:
ownership
dependency graph
prop interfaces
render graph
reasoning scope

Performance consequences should be evaluated later; at Level 6, understand the architectural consequence first.

53. State Ownership and API Design
Suppose:
<Filter selected={category} onChange={setCategory} />
This is a narrow API.

Compare:
<Filter state={filterState} setState={setFilterState} />
The second exposes internal state structure.

Now Filter depends on:
parent's state representation
instead of:
Filter's semantic contract

Prefer APIs that express the domain interaction.

54. State Ownership and Component Boundaries
Part 06 established:
component boundary = responsibility boundary

State ownership reinforces this:
Component boundary
↓
state responsibility
↓
behavior responsibility
↓
API responsibility

If a component owns state but another component owns the transitions, you may have a legitimate split—but it should be explicit.
Otherwise you may have unclear ownership.

55. State Ownership and Composition
Composition allows a component to own behavior without owning consumer content.

Example:
function Dropdown({ children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setOpen(v => !v)}>
        Toggle
      </button>
      {open && children}
    </div>
  );
}

Here:
Dropdown owns: open state, visibility behavior
Consumer owns: children content

This is a strong ownership boundary.

56. State Ownership and Controlled Components
Controlled design:
Parent └── owns value
↓ Child receives value
↑ Child emits event

Uncontrolled design:
Child └── owns value

Hybrid designs:
Parent may control value
Child may provide default
require explicit contract semantics.

Do not accidentally create a hybrid because state ownership was never decided.
The dedicated controlled-components Part will expand this model.

57. Senior Gotchas
Gotcha 1:
“The component displaying state should own it.”
Not necessarily.
The component may simply be a consumer.

Gotcha 2:
“Lift state as high as possible.”
Incorrect.
Lift only to the appropriate common owner.

Gotcha 3:
“Never duplicate data.”
Too simplistic.
Different concepts may legitimately have related values.

Gotcha 4:
“If two components need the same value, put it in global state.”
Usually premature.
First identify their narrowest common owner.

Gotcha 5:
“Passing setters is always bad.”
No.
It is mechanically valid. The concern is whether the API leaks implementation details instead of expressing semantic events.

Gotcha 6:
“Prop drilling means the state is global.”
No.
It means a value crosses component boundaries through props.
Composition or better boundaries may solve it.

Gotcha 7:
“Local state is always better.”
No.
If multiple components must coordinate around one concept, keeping separate local copies is worse.

Gotcha 8:
“State placement is only about performance.”
No.
It is primarily about:
ownership
cohesion
coupling
correctness
coordination

58. 🔥 THE CRUCIBLE
Challenge 1 — Find the Owner
Dashboard
├── FilterBar
└── Results

Both need:
selectedCategory
Where should it live?
Explain:
why
what flows down
what flows up

Challenge 2 — Identify Redundant State
const [items, setItems] = useState<Item[]>([]);
const [selectedId, setSelectedId] = useState<string | null>(null);
const [selectedItem, setSelectedItem] = useState<Item | null>(null);

Determine whether selectedItem needs to be state.
Explain the consistency problem if it is stored independently.

Challenge 3 — State Too High
App
└── Dashboard
    └── ProductGrid
        └── ProductCard

Only ProductCard needs:
isExpanded

Where should it live?
What architectural damage occurs if App owns it?

Challenge 4 — State Too Low
Dashboard
├── Filter
│   └── selected
└── Results
    └── selected

Both values represent exactly the same concept.
Identify the problem.
Design the corrected tree.

Challenge 5 — Prop Contract
Choose between:
<Filter setState={setState} />
and:
<Filter onCategoryChange={setCategory} />

Explain the architectural difference.

Challenge 6 — Draft vs Duplicate
A parent owns:
savedTitle
A child owns:
draftTitle

Is this necessarily duplicate state?
Explain when this is a legitimate ownership boundary.

59. FINAL MULTI-RENDER CRUCIBLE
Consider:
function Dashboard() {
  const [category, setCategory] = useState("all");

  return (
    <>
      <Filter category={category} onChange={setCategory} />
      <Results category={category} />
    </>
  );
}

Render #1:
Dashboard state: category = "all"
Children:
Filter.category = "all"
Results.category = "all"

User interaction:
Filter invokes:
onChange("books")
The callback belongs to the parent state transition.

Render #2:
Dashboard state: category = "books"
New props:
Filter.category = "books"
Results.category = "books"

One authoritative state value coordinates both consumers.

Architectural conclusion:
          Dashboard
              │ category
      ┌───────┴───────┐
      ▼               ▼
   Filter          Results
      │
      │ onChange
      └──────────────► Dashboard

This is the canonical:
single source of truth + data down + events up
model.

60. FINAL ENGINEERING MODEL
When deciding where state belongs, use:
WHAT IS THE CONCEPT?
│
▼
WHO READS IT?
│
▼
WHO CHANGES IT?
│
▼
WHO MUST COORDINATE AROUND IT?
│
▼
WHAT IS ITS LIFETIME?
│
▼
CAN IT BE DERIVED?
│
▼
FIND THE NARROWEST OWNER
│
▼
DESIGN THE API
│
┌────────┴────────┐
▼                 ▼
data down      events up

This is stronger than memorizing:
“Lift state up.”
Because lifting state is only the consequence.
The real engineering decision is:
Determine the correct ownership boundary first.

61. PRODUCTION REVIEW CHECKLIST
Before shipping a component tree, verify:

Ownership:
[ ] Every important state value has one clear owner.
[ ] The owner understands the meaning of the state.
[ ] The owner controls valid state transitions.
[ ] State lifetime matches the intended component/feature lifetime.

Placement:
[ ] State is not unnecessarily global.
[ ] State is not trapped below required consumers.
[ ] State is not lifted higher than necessary.
[ ] The narrowest appropriate common owner has been considered.
[ ] Component responsibility influenced the ownership decision.

Single source of truth:
[ ] Identical concepts are not independently stored.
[ ] Derived values are not unnecessarily duplicated.
[ ] Related values have distinct semantics when intentionally separated.
[ ] Synchronization effects are not compensating for accidental duplicate state.

Communication:
[ ] Data flows down through props.
[ ] Events flow up through callbacks.
[ ] Child APIs express semantic events.
[ ] Generic setter leakage is avoided where it weakens the contract.
[ ] Intermediate components are not unnecessarily aware of unrelated data.

Composition:
[ ] Composition has been considered before adding prop relay chains.
[ ] Container components do not unnecessarily own consumer data.
[ ] Children remain appropriately owned by their consumers.

Lifecycle:
[ ] State reset behavior is explained by component identity.
[ ] Keys are stable where state preservation matters.
[ ] Unmounting behavior is intentional.
[ ] State lifetime is not accidentally coupled to an unrelated subtree.

Debugging:
[ ] I can identify the authoritative state owner in DevTools.
[ ] I can identify every major consumer.
[ ] I can identify every major writer.
[ ] I can detect duplicated state.
[ ] I can explain why a state value is located where it is.

62. PART COMPLETION STANDARD
You have completed this Part only if you can independently explain:
[ ] What state ownership means.
[ ] Why state belongs to component occurrences rather than component types.
[ ] What local state means.
[ ] What shared state means.
[ ] Why state should not automatically be global.
[ ] Why state should not automatically remain local.
[ ] What lifting state up means.
[ ] What the narrowest common owner principle means.
[ ] How to identify a common owner.
[ ] Why the lowest common ancestor is a useful heuristic but not the entire architectural decision.
[ ] How semantic responsibility influences ownership.
[ ] What single source of truth means.
[ ] Why duplicate representations can drift.
[ ] Why derived values usually should not become state.
[ ] When related state can legitimately have different meanings.
[ ] How parent-owned state flows to children.
[ ] How children communicate changes through callbacks.
[ ] Why semantic callbacks can be stronger than generic setter props.
[ ] How composition can reduce prop drilling.
[ ] What state colocation means.
[ ] Why over-lifting increases coupling.
[ ] Why under-lifting creates coordination problems.
[ ] How state ownership relates to component identity.
[ ] How identity changes can reset state.
[ ] How controlled ownership differs from local ownership.
[ ] How to identify state duplication.
[ ] How to diagnose conflicting UI values.
[ ] How to diagnose unexpected state resets.
[ ] How to classify state before introducing broader state mechanisms.
[ ] How state placement changes the architecture's dependency graph.
[ ] How state ownership affects component API design.
[ ] How state ownership interacts with composition.
[ ] How lifecycle and state ownership interact.
[ ] How to defend a state-placement decision in a code review.
[ ] How to determine whether state belongs locally, at a common parent, or at a broader architectural boundary.

63. FINAL PRINCIPLE
The most important state-management skill at this level is not memorizing hooks or state libraries.
It is being able to answer:
“Who owns this concept?”

Once ownership is explicit, the rest follows:
OWNER
│
├── state
├── transitions
├── derived values
├── props down
└── callbacks up

A healthy React tree tends toward:
local concerns → local owners
shared concerns → narrow common owners
application concerns → deliberate broader boundaries
derived concerns → derived values
events → event handlers
external synchronization → effects

The senior engineer's objective is not to minimize state.
It is to minimize ambiguous ownership.
If two components must coordinate around one conceptual value, give them one authoritative owner. If only one component needs it, keep it local. If it can be derived, do not store another copy.
