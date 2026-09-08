Level 06 — React Fundamentals
KPI 03 — Components, Props & Composition
PART 01 — React Components as Units of UI Ownership
[⬅️ Previous Part](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/05-jsx-production-patterns-anti-patterns.md) | [📚 Level 06 Index](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/README.md) | [🧪 Companion Lab](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/examples/kpi-03-part-01-component-ownership.html) | [Next Part ➡️](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/02-component-inputs-props.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

🎯 Knowledge Contract
By the end of this Part, you should be able to:
Define precisely what a React component is.
Distinguish a component from a JSX element, React element, DOM node, and ordinary JavaScript function.
Explain why component boundaries are architectural boundaries.
Understand component invocation through React rather than treating components as ordinary functions.
Reason about component identity across renders.
Explain the relationship between component type, element, Fiber, and committed host nodes.
Identify what a component should own.
Identify what a component should not own.
Design components around responsibility rather than visual size.
Recognize god components.
Recognize premature component fragmentation.
Understand parent/child relationships.
Understand how data and behavior cross component boundaries.
Predict render behavior when parent components update.
Reason about component extraction without losing state ownership.
Diagnose component-boundary problems with React DevTools.
Make production-level component architecture decisions.

Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models
1. The Core Model
The most important production rule for JSX is:
A React component is best understood as:
A reusable unit of UI behavior and ownership that participates in React's rendering model.
A component is not simply:
"a function that returns JSX"
That definition is useful for beginners but insufficient for senior engineering.
The stronger model is:
Component Type
│
▼
React Element
│
▼
Fiber
│
▼
Render / Reconciliation
│
▼
Committed Host Tree

For example:
function UserProfile({ user }) {
  return <section>{user.name}</section>;
}

When used as:
<UserProfile user={user} />

you should mentally distinguish:
UserProfile
│
│ component type
▼
<UserProfile ... />
│
│ React element description
▼
Fiber
│
│ React runtime representation
▼
<section>
│
│ host element
▼
DOM node

These are not the same thing.

2. Executive Concept Table
Concept | Core Mechanism | Production Impact | Common Senior Trap
--- | --- | --- | ---
Component | React-managed UI unit | Defines responsibility boundary | Treating components as mere functions
Component type | Identity of component implementation | Determines reconciliation | Confusing type with instance
React element | Immutable UI description | Input to reconciliation | Treating it as a DOM node
Fiber | Runtime work/state representation | Tracks component over time | Assuming Fiber is the component itself
Props | Parent-provided input | Defines component contract | Mutating props
State | Component-owned evolving data | Drives updates | Putting shared state in arbitrary children
Parent | Supplies structure/data | Defines ownership hierarchy | Assuming parent should own all logic
Child | Nested UI responsibility | Encapsulates behavior | Passing everything through blindly
Composition | Combining components | Controls architecture | Replacing composition with prop explosion
Component boundary | Encapsulation boundary | Enables independent evolution | Splitting by file size
Extraction | Moving responsibility | Improves maintainability | Extracting without moving ownership
Render | Component evaluation | Produces next UI description | Treating render as DOM mutation
Identity | Type + position/key relationships | Determines state continuity | Assuming visual similarity preserves state
Remount | New component identity | Resets local state | Accidentally triggering it
Reuse | Same component type in multiple locations | Reduces duplication | Assuming reuse means identical state
API surface | Props exposed by component | Determines coupling | Creating huge prop interfaces

3. Golden Rule
A component boundary should represent meaningful ownership, responsibility, or composition—not merely a convenient place to move JSX.
A good component lets another engineer answer quickly:
What does this component own?
What does it receive?
What does it render?
What does it control?
What does it expose?
What does it deliberately NOT know about?
If those answers are unclear, the component boundary is probably weak.

4. Component Architecture in One Diagram
APPLICATION
│
▼
PAGE / SCREEN
│
┌──────────┼──────────┐
▼          ▼          ▼
Header   Content    Sidebar
│
┌─────────┼─────────┐
▼         ▼         ▼
List      Form   Summary
│
┌────┼────┐
▼    ▼    ▼
Item Item Item

But this diagram is not merely visual hierarchy.
It should represent:
ownership
responsibility
data flow
behavior
composition
state boundaries

Layer 2 — 🔬 Deep Mechanical Breakdown
5. What Exactly Is a Component?
Consider:
function Button({ label }) {
  return <button>{label}</button>;
}

At the source-code level, this is a JavaScript function.
But React uses that function as a component type.
When JSX contains:
<Button label="Save" />

the resulting React element conceptually contains information like:
type → Button
props → { label: "Save" }

React can then use that description to construct/reconcile the component's Fiber.
Therefore:
JavaScript function
↓
used as React component type
↓
React element
↓
Fiber
↓
rendered subtree

The function is the implementation.
The component is the React-managed abstraction represented by that implementation.

6. Component vs React Element
This distinction is fundamental.
Component:
function Button() {
  return <button>Save</button>;
}
Button is a component type.

Element:
<Button />
is a React element description.

Conceptually:
Button = component type
<Button /> = element describing an occurrence of Button

You can create multiple elements from the same component:
<Button />
<Button />
<Button />

These represent three occurrences of the same component type.
They do not imply one shared local state.

7. Same Type ≠ Same Instance
Consider:
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
}

Used twice:
<>
  <Counter />
  <Counter />
</>

The conceptual tree is:
Fragment
├── Counter
└── Counter

There are two component positions.
Therefore:
Counter #1 state → 0
Counter #2 state → 0

If Counter #1 becomes:
5
Counter #2 does not automatically become:
5

The component type is shared.
The state belongs to each component occurrence in the rendered tree.

8. Component Type vs Component Occurrence
Think:
Component Type
│
├───────────────┐
▼               ▼
Occurrence A    Occurrence B
│               │
State A         State B

This is one of the most important mental models in React.
The source function:
Counter
does not itself contain one universal state object.
React associates state with the rendered component position represented by its runtime tree.

9. Fiber as the Runtime Representation
A Fiber conceptually tracks a component occurrence and its work.
Relevant fields can include:
Fiber
├── type
├── key
├── pendingProps
├── memoizedProps
├── memoizedState
├── child
├── sibling
└── return

For:
<Counter />
the Fiber can conceptually represent:
type ↓ Counter
memoizedProps ↓ {}
memoizedState ↓ hook state structure
child ↓ host subtree

This is why component state cannot be understood merely by looking at the JavaScript function.
The function is recreated/evaluated as JavaScript.
React's runtime representation tracks the evolving component occurrence.

10. Components as Ownership Boundaries
Suppose:
function ShoppingCart() {
  const [items, setItems] = useState([]);
  return (
    <Cart>
      <CartItems items={items} />
      <CartSummary items={items} />
    </Cart>
  );
}

The important architectural question is:
Who owns items?
Answer:
ShoppingCart
│
├── owns items
├── gives items → CartItems
└── gives items → CartSummary

This is better than allowing:
CartItems
│
└── owns one copy
CartSummary
│
└── owns another copy

because now the application has competing sources of truth.

11. Ownership Is More Important Than Nesting
A component being visually above another component does not automatically mean it should own all state.
For example:
Page └── Dashboard └── SearchBox

The search state could belong to:
SearchBox
if only SearchBox needs it.
But if:
SearchBox
↓
Results
↓
Summary
all depend on the same query, then state may need to move upward.

The decision should be driven by:
Who needs the data?
Who changes the data?
Who derives behavior from the data?
What is the narrowest common owner?

12. The Narrowest Common Owner Principle
Suppose:
Dashboard
/       \
SearchBox Results

Both need:
query

Then:
Dashboard
│
├── query state
├── SearchBox
└── Results

is usually more coherent than:
SearchBox └── query
Results └── duplicate query

The state should generally live at the narrowest component boundary that can coordinate all consumers.

13. Parent → Child Data Flow
React's standard data flow is:
Parent State
│
▼
Parent Render
│
▼
Props
│
▼
Child Render

Example:
function Parent() {
  const [name, setName] = useState("Srikar");
  return <Child name={name} />;
}

function Child({ name }) {
  return <h1>{name}</h1>;
}

The child does not reach into the parent's state directly.
The parent provides the value through props.
This creates an explicit dependency:
Child depends on ↓ name prop

14. Child → Parent Communication
Data flow remains conceptually downward, but children can request parent-owned changes through callbacks.
function Parent() {
  const [count, setCount] = useState(0);
  return (
    <Child count={count} onIncrement={() => setCount(c => c + 1)} />
  );
}

The architecture becomes:
Parent
/    \
state callback
│    │
▼    ▼
Child ────────→ Parent update

The child does not own the parent's state.
It emits an intent:
"increment"
The owner performs the update.

15. Component APIs
A component API is its public contract.
Example:
<Modal
  open={open}
  onClose={handleClose}
  title="Delete account"
>
  ...
</Modal>

The API communicates:
open → caller controls visibility
onClose → component requests closure
title → caller supplies metadata
children → caller supplies content

This is a much stronger design than:
<Modal
  user={user}
  account={account}
  permissionService={permissionService}
  deleteService={deleteService}
  navigation={navigation}
  ...
/>
where the component begins absorbing application responsibilities.

16. Good Component Contracts
A strong component contract tends to have:
small inputs
clear semantics
predictable output
explicit behavior
minimal hidden dependencies

Example:
<Avatar src={user.avatarUrl} alt={user.name} size="medium" />

The component does not need:
entire User object
authentication context
database client
navigation object
global store
unless those dependencies are genuinely part of its responsibility.

17. Bad Component Contracts
Consider:
<UserCard
  user={user}
  account={account}
  permissions={permissions}
  organization={organization}
  featureFlags={featureFlags}
  theme={theme}
  router={router}
  analytics={analytics}
/>

This might be valid.
But it should trigger investigation.
Ask:
Does UserCard really need all of this?

Large prop surfaces often indicate:
high coupling
unclear responsibility
poor composition
insufficient separation
Not always—but often enough to investigate.

18. The God Component
A god component might look like:
Dashboard
├── fetches data
├── owns authentication logic
├── owns filters
├── owns modal state
├── validates forms
├── transforms API responses
├── manages table sorting
├── controls pagination
├── handles navigation
├── renders 600 lines of JSX
└── contains 17 event handlers

The problem is not the number 600.
The problem is responsibility density.
A better decomposition could be:
Dashboard
├── DashboardHeader
├── FilterBar
├── ResultsTable
│   └── ResultRow
├── Pagination
└── EditModal

But decomposition should happen according to ownership.

19. The Opposite Failure — Component Fragmentation
Over-fragmentation:
Dashboard
└── DashboardHeader
    └── DashboardHeaderContainer
        └── DashboardHeaderContent
            └── DashboardHeaderTitle
                └── DashboardHeaderTitleText

when the pieces have no independent responsibility.
This creates:
more files
more props
more navigation
more indirection
less context

Componentization is not inherently good.
Meaningful componentization is good.

20. Component Boundaries Should Follow Change Boundaries
A powerful senior heuristic:
Things that change together often belong together; things that evolve independently may deserve separate boundaries.
Suppose:
BillingSummary
changes independently from:
ActivityFeed
Then separating them makes sense.
But if:
Title
Subtitle
Icon
always change together and have no independent behavior, separating each may add unnecessary complexity.

21. Component Boundaries and State
This becomes particularly important when extracting components.
Original:
function Form() {
  const [value, setValue] = useState("");
  return (
    <form>
      <input value={value} onChange={e => setValue(e.target.value)} />
    </form>
  );
}

If you extract:
function Input({ value, onChange }) {
  return (
    <input value={value} onChange={onChange} />
  );
}

the state remains owned by:
Form
The extracted component owns rendering behavior, not the state.
This is a common and useful boundary.

22. Extraction That Changes Ownership
Compare:
function Form() {
  const [value, setValue] = useState("");
  return <Input value={value} onChange={setValue} />;
}
with:
function Input() {
  const [value, setValue] = useState("");
  return (
    <input value={value} onChange={e => setValue(e.target.value)} />
  );
}

The second version moves state ownership.
That can be a legitimate architectural change.
But it is not merely JSX extraction.
This is why component refactoring must explicitly ask:
Did I move responsibility, or only move markup?

23. Controlled vs Locally Owned State
Controlled:
<Input value={value} onChange={setValue} />
Ownership:
Parent └── value

Locally controlled:
function Input() {
  const [value, setValue] = useState("");
}
Ownership:
Input └── value

Neither is universally better.
The architecture depends on who needs to coordinate the state.

24. Component Composition
Composition allows a component to own structure while callers supply content.
function Layout({ sidebar, children }) {
  return (
    <div className="layout">
      <aside>{sidebar}</aside>
      <main>{children}</main>
    </div>
  );
}

Usage:
<Layout
  sidebar={<Navigation />}
>
  <Dashboard />
</Layout>

This gives:
Layout
├── sidebar → caller-provided UI
└── children → caller-provided UI

while Layout owns:
layout structure
This is a powerful separation.

25. Component Composition vs Inheritance
React's component model generally favors composition.
Instead of:
BaseCard
↓
UserCard extends BaseCard
↓
AdminUserCard extends UserCard

prefer:
Card
├── CardHeader
├── CardBody
└── CardFooter

and compose behavior/content as needed.
Composition keeps relationships explicit in the rendered tree.

26. Prediction-First Walkthrough #1 — Parent Render
Consider:
function Parent() {
  const [count, setCount] = useState(0);
  return (
    <>
      <Header />
      <Counter count={count} />
    </>
  );
}

Initial render:
count = 0
Tree:
Parent
├── Header
└── Counter(count=0)

Now:
setCount(1)
React schedules an update.

Render #2
Parent evaluates again.
It produces conceptually:
Parent
├── Header
└── Counter(count=1)

React compares the trees.
Header remains the same component type in the same structural position.
Counter also remains the same type.
But Counter receives:
count: 0 → 1
Therefore the Counter's props change.

The important distinction:
Parent function executed again
does not mean:
every child became a new conceptual component identity
React reconciles the resulting tree.

27. Prediction-First Walkthrough #2 — Two Counters
function App() {
  return (
    <>
      <Counter />
      <Counter />
    </>
  );
}

Conceptual tree:
App
└── Fragment
    ├── Counter A
    └── Counter B

Each occurrence has its own state.
If:
Counter A = 3
Counter B = 7
then changing A's state does not mutate B's state.
The shared source code does not imply shared runtime state.

28. Prediction-First Walkthrough #3 — Component Type Replacement
function App({ admin }) {
  return admin ? <AdminPanel /> : <UserPanel />;
}

Render #1:
admin = false
Tree:
App └── UserPanel

Render #2:
admin = true
Tree:
App └── AdminPanel

At that child position:
UserPanel ↓ AdminPanel
The component type changes.
This is not simply:
UserPanel receives new props
It is a different component type.
Any local state associated with the replaced component is not automatically transferred to the new component.

29. Prediction-First Walkthrough #4 — Same Component, Different Props
function App({ mode }) {
  return <Panel mode={mode} />;
}

Render #1:
Panel(mode="view")

Render #2:
Panel(mode="edit")

The component type remains:
Panel
The props change.
Therefore React can preserve the component's identity while updating its props.

This distinction is foundational:
same type + compatible identity ↓ existing component updated
different type ↓ component replaced

30. Component Identity Is Not Object Identity
Do not confuse:
JavaScript object identity
with:
React component identity

For example:
const element = <Counter />;
This creates a React element object.
On another render:
const element = <Counter />;
a new element object may be created.
That does not mean React necessarily treats the underlying component as a completely new mounted occurrence.
React reasons about the structure, type, keys, and position/context of elements in the tree.

31. Component Identity Is a Tree Concept
Think:
Parent
│
▼ child position
│
┌──────┴──────┐
▼             ▼
Counter A     Counter B

Identity belongs to an occurrence in the rendered tree.
This is why moving components, changing wrappers, changing keys, or changing types can have state-preservation consequences.

32. Component Refactoring Workflow
When extracting a component:
Step 1 — Identify responsibility
What behavior belongs together?
Step 2 — Identify state
Which state does the region use?
Step 3 — Identify state ownership
Should that state move?
Step 4 — Define inputs
What does the new component actually need?
Step 5 — Define outputs
What events or callbacks must it expose?
Step 6 — Preserve tree semantics
Did the extraction introduce:
wrappers?
changed keys?
changed component types?
changed conditional topology?
Step 7 — Verify behavior
Use:
React DevTools
Profiler
browser DOM inspection
interaction tests

Layer 3 — 🧪 Diagnostic Labs & DevTools Profiling
33. React DevTools Component Ownership Lab
Open React DevTools and inspect:
App
└── Dashboard
    ├── SearchBox
    ├── Results
    └── Summary

For each component record:
Component:
Props:
State:
Context:
Children:
Parent:

Then answer:
Who owns the search query?
Who consumes it?
Who can change it?
Who should own it?

34. Render Cause Investigation
Enable:
Highlight component updates.
Record render reasons when available.
Open the Profiler.
Record a state update.
Inspect the commit.
Identify the component that initiated the update.
Identify parent components that rendered.
Identify children that rendered.
Compare changed props.

The goal is not to memorize that “parents render children.”
The goal is to understand the actual render behavior of the specific tree.

35. Component Tree vs DOM Tree
Suppose:
<Card>
  <Button />
</Card>

React component tree:
Card └── Button

DOM tree might be:
article └── button

The component tree and host tree are different representations.
DevTools allows you to inspect the React component hierarchy separately from Chrome's DOM hierarchy.
Use both.

36. Render Counter
A development-only diagnostic:
function RenderCounter({ name }) {
  const count = React.useRef(0);
  count.current += 1;
  console.table({
    component: name,
    renders: count.current,
  });
  return null;
}

You can temporarily place it inside a component:
function Dashboard(props) {
  return (
    <>
      <RenderCounter name="Dashboard" />
      ...
    </>
  );
}

This gives a basic render timeline.

37. Component Contract Inspection
For each production component, create a quick table:
Question | Answer
--- | ---
What does it own? | ?
What does it receive? | ?
What does it render? | ?
What can it change? | ?
What does it expose? | ?
What external systems does it know? | ?
What responsibilities should it reject? | ?

If you cannot answer these, the component probably has unclear boundaries.

38. Production Incident Runbook — “Why Did This Component Lose State?”
Symptom:
A child component's local state resets after a refactor.

Investigate:
[ ] Did the component type change?
[ ] Did the key change?
[ ] Did the key disappear?
[ ] Did a wrapper change the tree?
[ ] Did the component move to another structural position?
[ ] Did conditional rendering replace the component?
[ ] Did state ownership move during extraction?
[ ] Did a parent recreate a different subtree?

Core diagnostic principle:
Do not start by blaming hooks.
First inspect the component's identity in the tree.

39. Production Incident Runbook — “Component Receives 20 Props”
Symptom:
A component has a huge API.

Investigate:
Group props:
data
behavior
permissions
presentation
routing
analytics
global state
services

Then ask:
Are these really one responsibility?

If not, consider:
composition
state relocation
view-model preparation
component extraction
context at an appropriate boundary

Do not blindly replace 20 props with global context.
That can simply hide coupling rather than remove it.

40. Production Incident Runbook — “Everything Is a Component”
Symptom:
The repository contains hundreds of tiny components.

Investigate:
For each component:
Does it have independent responsibility?
Does it have a useful API?
Does it isolate state?
Does it represent a meaningful UI boundary?
Does it evolve independently?

If not, consolidation may improve the architecture.

Layer 4 — 🔥 The Crucible
41. Prediction Challenge #1 — Two Component Occurrences
function App() {
  return (
    <>
      <Counter />
      <Counter />
    </>
  );
}

Answer:
How many component occurrences exist?
How many independent local state sets exist?
Are the two occurrences the same component type?
If one counter changes, what happens to the other?

42. Prediction Challenge #2 — Parent Update
function App() {
  const [value, setValue] = useState(0);
  return (
    <>
      <Header />
      <Content value={value} />
      <Footer />
    </>
  );
}

After:
setValue(1)

Predict:
Does App render again?
What JSX does it produce?
Does Header remain in the same structural position?
Does Footer remain in the same structural position?
What changed for Content?
What does React reconcile?

43. Prediction Challenge #3 — State Ownership Refactor
Version A:
function Form() {
  const [value, setValue] = useState("");
  return <Input value={value} onChange={setValue} />;
}

Version B:
function Form() {
  return <Input />;
}
function Input() {
  const [value, setValue] = useState("");
  return (
    <input value={value} onChange={e => setValue(e.target.value)} />
  );
}

Explain:
What responsibility moved?
What state moved?
What API disappeared?
When might Version B be better?
When would Version A be necessary?

44. Prediction Challenge #4 — Type Replacement
function App({ enabled }) {
  return enabled ? <Editor /> : <Preview />;
}

Predict the state behavior when:
enabled: false → true → false

Do not answer merely:
“React renders different components.”
Explain the identity consequences at each transition.

45. Prediction Challenge #5 — Composition
function Layout({ children }) {
  return (
    <main>
      <header>App</header>
      {children}
    </main>
  );
}

Usage:
<Layout>
  <Dashboard />
</Layout>

Answer:
Who owns the layout structure?
Who supplies Dashboard?
Is Dashboard owned by Layout?
What does children represent?
Why is this composition rather than inheritance?

46. Prediction Challenge #6 — God Component
You inherit:
AdminDashboard.jsx
1,200 lines
32 props
11 useState calls
7 effects
19 event handlers
9 API calls
14 conditional branches

Do not immediately propose:
"split into 20 components"

Instead identify:
likely ownership domains
state domains
data-fetching boundaries
reusable UI boundaries
composition opportunities
possible accidental coupling
which state should remain centralized
which state can move downward

47. Engineering Decision Matrix
Problem | Likely Direction
--- | ---
Component owns unrelated UI regions | Split by responsibility
Child needs data from sibling | Lift to common owner
Many props pass through intermediate components | Consider composition or appropriate context
Local state used only by one component | Keep it local
Shared state needed by multiple siblings | Move to common owner
Repeated UI structure | Extract meaningful component
Tiny markup with no independent meaning | Keep local
Component has 30 configuration props | Reconsider API
Component performs unrelated domain operations | Separate responsibilities
Extracted component needs entire parent object | Narrow the contract
State reset after refactor | Inspect type/key/tree position
Component is difficult to test independently | Reconsider responsibility boundary
Component changes for many unrelated reasons | Split by change boundary

48. Senior Interview Gotchas
Gotcha 1:
“A React component is just a function.”
Incomplete.
A function is the implementation mechanism; React treats it as a component type within its rendering/runtime model.

Gotcha 2:
“Two <Counter /> usages share state because they use the same function.”
False.
They are separate component occurrences.

Gotcha 3:
“Extracting JSX into a component doesn't change architecture.”
False.
Extraction can change ownership, APIs, identity, and state boundaries.

Gotcha 4:
“The parent owns all child state.”
False.
State should live at the appropriate ownership boundary.

Gotcha 5:
“More components means better architecture.”
False.
Meaningful boundaries matter.

Gotcha 6:
“Props are just parameters.”
Technically related, but incomplete.
Props form a React component's declarative input contract.

Gotcha 7:
“Children are automatically rendered by React.”
Incomplete.
children is supplied as a prop; the receiving component decides where and whether to render it.

Gotcha 8:
“A component can safely own duplicate copies of shared application state.”
Usually dangerous.
It creates synchronization problems unless the duplicated values are intentionally independent.

49. 35-Point Completion Checklist
You should be able to check every item below.

Component Fundamentals:
[ ] I can define a React component precisely.
[ ] I can distinguish a component from a React element.
[ ] I can distinguish a React element from a DOM node.
[ ] I can explain component type.
[ ] I understand component occurrences.
[ ] I understand why identical component types can have independent state.

Ownership:
[ ] I can identify state ownership.
[ ] I understand the narrowest common owner principle.
[ ] I can distinguish local state from shared state.
[ ] I can recognize incorrect duplicated state.
[ ] I can explain parent-to-child data flow.
[ ] I can explain child-to-parent communication through callbacks.

Component APIs:
[ ] I can design a small prop contract.
[ ] I can recognize prop explosion.
[ ] I understand composition.
[ ] I understand children.
[ ] I can distinguish configuration from composition.

Architecture:
[ ] I can recognize a god component.
[ ] I can recognize component fragmentation.
[ ] I can identify meaningful component boundaries.
[ ] I can use change boundaries as an architectural heuristic.
[ ] I can refactor without accidentally moving ownership.
[ ] I can identify when state should move upward.
[ ] I can identify when state should move downward.

Identity:
[ ] I understand component identity as a tree concept.
[ ] I can distinguish same type from different type.
[ ] I understand state preservation at stable component positions.
[ ] I can diagnose unexpected remounts.
[ ] I understand the relevance of keys.
[ ] I understand how wrappers can affect tree structure.

Diagnostics:
[ ] I can inspect the React component tree.
[ ] I can inspect the DOM tree separately.
[ ] I can use Profiler to inspect commits.
[ ] I can investigate why a component rendered.
[ ] I can inspect component props/state.
[ ] I can diagnose component-boundary regressions.

50. Final Crucible — Design the Component Tree
You receive this requirement:
Build an order-management screen containing a search field, status filters, order results, summary statistics, and an order-edit modal. Search results and summary statistics must remain synchronized. The edit modal has local form state. The screen also supports an independently toggled help panel.

Design the component tree.
A strong candidate might reason toward something like:
OrderPage
│
├── SearchControls
│   ├── SearchInput
│   └── StatusFilter
├── OrderResults
│   └── OrderRow
├── OrderSummary
├── OrderEditModal
│   └── EditForm
└── HelpPanel

But the real exercise is not the names.
Determine:
Who owns search state?
Who owns status filter?
Who derives filtered orders?
Who owns edit-modal visibility?
Who owns edit-form field state?
Who owns help-panel visibility?
Which components receive data?
Which components receive callbacks?
Which UI is composition?
Which state is intentionally local?

A strong answer should produce an architecture like:
OrderPage
│
┌───────────┼────────────┐
│           │            │
▼           ▼            ▼
Search/Filter Results Summary
│           │            │
└──────┬────┘            │
       │                 │
shared derived data ────┘

OrderPage
│
├── EditModal
│   └── EditForm
│       └── local form state
│
└── HelpPanel
    └── independent UI state

The architectural principle is:
Shared state should live where coordination occurs; local state should remain local when no external coordination is required.

51. Final Mental Model
You should now be able to reason about React components through five layers:
COMPONENT TYPE
│
▼
REACT ELEMENT
type + props + key
│
▼
FIBER
runtime/state representation
│
▼
COMPONENT TREE
ownership + relationships
│
▼
HOST TREE
actual DOM output

And across those layers:
DATA
│
▼
PROPS
│
▼
COMPONENT
│
┌─────┴─────┐
▼           ▼
STATE       EVENTS
│           │
└─────┬─────┘
      ▼
    RENDER
      │
      ▼
ELEMENT TREE
      │
      ▼
RECONCILIATION
      │
      ▼
    COMMIT

The senior engineer's job is therefore not:
“How do I split this JSX into more files?”
It is:
“What does each component own, what does it depend on, what does it expose, and how should those responsibilities map onto React's tree?”

That is the foundation for every later React topic involving state, hooks, effects, context, performance, and advanced rendering.

KPI 03 — Part 01 Boundary
This Part establishes components as ownership and responsibility units.
The next Part should move into the component's primary external contract:
KPI 03 — Part 02: Component Inputs — Props, Contracts, Defaults & Data Flow

That Part should go deeper into:
Parent
│
▼
Props
│
├── values
├── objects
├── callbacks
├── children
├── renderable content
└── component contracts

without re-teaching the JSX fundamentals already completed in KPI 02.
