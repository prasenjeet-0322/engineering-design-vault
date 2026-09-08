Level 06 — React Fundamentals
KPI 03 — Components, Props & Composition
PART 16 — KPI 03 Final Review & Mastery
[⬅️ Previous Part](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/15-component-architecture-crucible.md) | [📚 Level 06 Index](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/README.md) | [🧪 Companion Lab](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/examples/16-kpi-03-final-review.html) | [Next KPI ➡️](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/04-README.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models
1. The Complete KPI 03 Mental Model
KPI 03 is not fundamentally about learning <Component />, props, or children.
It is about learning how to design React component boundaries that preserve ownership, identity, data flow, and change isolation.

        REACT COMPONENT ARCHITECTURE
                     │
  ┌──────────────────┼──────────────────┐
  │                  │                  │
OWNERSHIP          INPUTS            OUTPUTS
  │                  │                  │
Who owns state?    Props / children   Events / callbacks
Who owns effects?  Data contracts     Semantic actions
Who owns behavior? Composition        Return values
  │                  │                  │
  └──────────────────┼──────────────────┘
                     │
                 COMPONENT
                     │
  ┌──────────────────┼──────────────────┐
  │                  │                  │
IDENTITY           LIFECYCLE         BOUNDARY
  │                  │                  │
type + key +       render → commit →  cohesion
tree position      effect / cleanup   coupling
  │                  │                  │
  └──────────────────┼──────────────────┘
                     │
                ARCHITECTURE
                     │
  ┌──────────────────┼──────────────────┐
  │                  │                  │
Composition        Context          Abstraction
  │                  │                  │
structural DI    distribution       reuse boundary

2. Executive Concept Table
Concept | Core Mechanism | Production Impact | Common Senior Trap
--- | --- | --- | ---
Component | Reusable unit of UI ownership | Defines change boundary | Measuring quality by line count
Props | Immutable inputs to a component occurrence | Defines public API | Passing implementation details
children | A prop carrying nested React nodes | Enables composition | Treating it as special global syntax
Callback | Parent-owned capability passed downward | Events/data flow upward | Passing raw setters everywhere
State | Memory associated with component identity | Determines ownership | Duplicating canonical state
Lifting state | Move shared state to common owner | Coordinates siblings | Lifting everything too high
Composition | Consumer supplies structure/dependencies | Reduces coupling | Replacing every abstraction with wrappers
Context | Distributes dependencies through a subtree | Avoids unnecessary prop relay | Treating Context as universal state
Key | Identity hint within sibling set | Preserves/resets state correctly | Using array index for mutable identity
Component identity | Type/key/tree position relationship | Determines state continuity | Confusing JSX position with source code
Lifecycle | Render/commit/effect ownership | Controls synchronization | Treating effects as general lifecycle code
Abstraction | Shared semantic boundary | Controls reuse cost | Abstracting repeated syntax too early
Testing | Verifies public behavior/contracts | Prevents regressions | Testing implementation details
Boundary | Ownership + responsibility + change isolation | Determines architecture | Creating arbitrary component layers

3. Golden Rule
A React component boundary is good when ownership is clear, inputs are explicit, outputs are semantic, identity is predictable, and changes remain localized.
Everything else is secondary.

Layer 2 — 🔬 Deep Mechanical Breakdown
4. The Full React Component Model
A senior engineer must keep several different representations separate.
JSX source
↓
React element description
↓
Reconciliation
↓
Fiber representation
↓
Host tree
↓
DOM

These are not the same thing.
For example:
<UserCard user={user} />
creates a React element description.
It does not immediately mean:
DOM node

The React runtime reconciles that description against existing work.
Conceptually:
React Element
{ type: UserCard, props: { user: ... } }
│
▼
Fiber
{
  type: UserCard,
  pendingProps: ...,
  memoizedState: ...,
  child: ...,
  sibling: ...,
  return: ...
}
│
▼
Host descendants
│
▼
DOM

The distinction matters because state, identity, reconciliation, and component ownership operate at different layers.

5. Component Type vs Component Occurrence
Consider:
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

and:
<>
  <Counter />
  <Counter />
</>

There is one component type:
Counter
but two component occurrences.

Conceptually:
Counter type
│
├── occurrence A → independent state
└── occurrence B → independent state

Therefore:
A.count !== B.count
even though both execute the same component function.

The state belongs to the component occurrence's identity in the React tree.
It does not belong to:
the JavaScript function globally
and it does not belong to:
the JSX source line as a physical variable

6. Props Are Contracts
A component should expose a deliberate API.

Bad:
<UserCard
  user={user}
  internalCache={cache}
  rawApiResponse={response}
  setGlobalState={setState}
  isLoading={loading}
  internalMode="x"
/>
The consumer now knows too much about implementation.

Better:
<UserCard
  name={user.name}
  avatarUrl={user.avatarUrl}
  onSelect={() => selectUser(user.id)}
/>
The second contract expresses what the component needs rather than exposing the entire surrounding architecture.

7. Data Down, Events Up
The canonical communication direction remains:
Parent
│
│ props
▼
Child
│
│ callback invocation
▼
Parent

Example:
function SearchPanel() {
  const [query, setQuery] = useState("");

  return (
    <SearchInput value={query} onChange={setQuery} />
  );
}

The child does not own the parent state.
It receives a capability.

Conceptually:
SearchPanel
│
│ value
▼
SearchInput

SearchInput
│
│ onChange(nextValue)
▼
SearchPanel

This keeps ownership explicit.

8. Why Semantic Callbacks Matter
Compare:
onClick={handleSave}
with:
onSave={handleSave}

The second communicates component-level semantics.
A button might expose:
onClick
because its abstraction is a button.

A form might expose:
onSubmit
because its abstraction is a form.

An editor might expose:
onSave
because its abstraction is a document editor.

The further an API moves from DOM-level behavior toward domain-level behavior, the more it can decouple consumers from implementation details.

9. State Ownership
The most important state question is:
Which component owns the invariant that this state represents?

Suppose two siblings need the same selected user.
Dashboard
├── UserList
└── UserDetails

If UserList owns:
selectedUserId
then UserDetails cannot naturally consume the same source of truth without communication complexity.

Instead:
Dashboard └── selectedUserId
│
├── UserList
└── UserDetails

This is lifting state.
The important principle is not:
"Always lift state."
It is:
Lift state to the narrowest common owner that needs to coordinate the invariant.

10. State Locality
State should generally remain as close as practical to the behavior it controls.

Bad:
Application
└── entire application state
    └── tiny Tooltip
when the tooltip's visibility is only relevant to itself.

Better:
Tooltip └── isOpen

Locality reduces:
prop traffic
coupling
change propagation
mental load
accidental synchronization

11. Derived State
Consider:
const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const [fullName, setFullName] = useState("");

If:
fullName = firstName + " " + lastName
then storing all three creates multiple sources of truth.

Prefer:
const fullName = `${firstName} ${lastName}`;

The state model becomes:
firstName ─┐
           ├──> fullName
lastName ──┘

rather than:
firstName ─┐
lastName ──┼──> fullName state
           │
           └── synchronization logic

Every additional source of truth creates synchronization responsibility.

12. Controlled Component Contract
A controlled component typically has:
<Input value={value} onChange={setValue} />

The parent owns the canonical value.
The child renders the supplied value and communicates changes.

Parent state
│
│ value
▼
Controlled Input
│
│ onChange(next)
▼
Parent state update
│
▼
new render

This creates an explicit ownership boundary.

13. Context Does Not Replace Ownership
Context solves:
"How do I distribute this dependency through a subtree?"

It does not automatically solve:
"Who owns this state?"

For example:
<ThemeContext.Provider value={theme}>
  <Application />
</ThemeContext.Provider>

The context distributes:
theme
through the subtree.

It does not mean:
theme is automatically global state

A useful distinction:
Ownership ↓ Who creates / changes / controls the value?
Distribution ↓ How do consumers obtain the value?

Context primarily addresses the second.

14. Composition as Structural Dependency Injection
Instead of forcing a component to know everything:
<Page
  headerTitle={...}
  headerActions={...}
  sidebarContent={...}
  footerContent={...}
/>

composition can move structure outward:
<Page>
  <Header />
  <Main />
  <Sidebar />
</Page>

The parent controls the structure.
The layout component controls placement.

This is a powerful separation:
Consumer
│
├── supplies WHAT
▼
Layout
│
└── decides WHERE

15. Identity Is Separate From Object Identity
These are different questions.

JavaScript object identity:
{} === {} // false

React component identity asks something different:
Does this resulting component occurrence correspond to the previous occurrence?

React uses the resulting tree's identity information, including type, key, and structural position/context.

Therefore:
JS object identity ≠ React component identity
Do not collapse them into one concept.

16. Keys Are Identity Hints
Consider:
items.map(item => (
  <Row key={item.id} item={item} />
))

The key communicates:
This occurrence corresponds to entity item.id

For a mutable collection:
[A, B, C]
becoming:
[B, C, D]
stable entity keys allow React to preserve the correct row identities.

With:
key={index}
identity becomes positional:
position 0
position 1
position 2
That can become incorrect when items reorder, insert, or delete.

17. Lifecycle Mental Model
At fundamentals level:
Trigger
↓
Render
↓
Reconciliation
↓
Commit
├── DOM mutation
▼
Browser
▼
Passive effects

A critical distinction:
Render:
Determine what the UI should be.

Commit:
Apply the accepted result to the host environment.

Effect:
Synchronize with external systems after commit.

Therefore:
render ≠ DOM mutation
render ≠ effect
effect ≠ derived-data calculation

18. Effects Are Synchronization Boundaries
Good:
useEffect(() => {
  const connection = connect(roomId);
  return () => {
    connection.disconnect();
  };
}, [roomId]);

The effect owns a resource.
Its lifecycle is:
dependency identity
↓
create resource
↓
resource active
↓
cleanup
↓
dependency changes / unmount

Bad:
useEffect(() => {
  setFullName(firstName + lastName);
}, [firstName, lastName]);
when fullName can simply be derived during rendering.

19. Abstraction Boundary
A reusable component should not merely eliminate repeated syntax.
It should represent a stable concept.

Bad abstraction:
<UniversalBox
  mode="header"
  variant="dialog"
  type="table"
  behavior="..."
  layout="..."
/>
This is often a configuration system disguised as a component.
A better abstraction has a coherent responsibility.

20. The Senior Component Heuristic
Before introducing or modifying a component, ask six questions:
1. OWNERSHIP: What does it own?
2. INPUT: What does it receive?
3. OUTPUT: What does it communicate?
4. IDENTITY: What preserves or resets its state?
5. LIFECYCLE: What external resources does it synchronize?
6. BOUNDARY: What change should remain localized?

If these answers are unclear, the component boundary is probably unclear.

Layer 3 — 🧪 Diagnostic Labs & DevTools Profiling
21. Lab 01 — Identify the Ownership Boundary
Given:
function ProductPage() {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <>
      <ProductList selectedId={selectedId} onSelect={setSelectedId} />
      <ProductDetails selectedId={selectedId} />
    </>
  );
}

Trace:
ProductPage
│
├── selectedId
│
├── ProductList
│   └── onSelect
│
└── ProductDetails

Questions:
Who owns selectedId?
Who changes it?
Who consumes it?
Is there one source of truth?
Could either sibling independently own it without duplication?

Expected:
Owner = ProductPage
Consumers = ProductList + ProductDetails
Mutation capability = ProductList callback

22. Lab 02 — React DevTools Component Tree
Open React DevTools.
Inspect:
Component tree
↓
Select parent
↓
Inspect props
↓
Inspect state
↓
Inspect context

For a suspicious component, record:
[ ] What props does it receive?
[ ] Which props are actually used?
[ ] Does it own state?
[ ] Which state is canonical?
[ ] Does it consume Context?
[ ] Does it render children?
[ ] Does it expose callbacks?
[ ] Does its state survive parent renders?
[ ] Does its state survive list reordering?

23. Lab 03 — Highlight Component Updates
Use React DevTools' render highlighting where available.

Trigger:
Parent update
Sibling update
Local state update
Context update
List reorder
Key change

Observe which components update.
Do not interpret:
component rendered
as automatically meaning:
DOM changed
Those are separate questions.

24. Lab 04 — Record Why Components Rendered
Where supported by your React DevTools version, enable:
Record why each component rendered

Then inspect:
props changed
state changed
context changed
parent rendered

The purpose is not merely performance tuning.
It is architecture diagnosis.

If a component repeatedly receives unrelated data, ask:
Is the component boundary too broad?

If a component requires many relayed props:
Is the communication architecture wrong?

If a component repeatedly resets:
Is identity unstable?

25. Lab 05 — Identity Experiment
Start with:
function Item({ id }) {
  const [draft, setDraft] = useState("");

  return (
    <input
      value={draft}
      onChange={e => setDraft(e.target.value)}
      placeholder={id}
    />
  );
}

Render:
items.map(item => (
  <Item key={item.id} id={item.id} />
))

Then reorder the list.
Expected conceptual result:
entity identity preserved
draft follows entity

Now replace with:
key={index}
and reorder.
Observe the difference.

This experiment makes the key principle concrete:
List identity should usually follow entity identity, not accidental position.

26. Lab 06 — Intentional State Reset
Consider:
<Editor key={documentId} document={document} />

Changing:
documentId = A
↓
documentId = B
can intentionally create a new identity.

This can be useful when:
A's local editing state
should not leak into:
B

The important distinction:
Accidental reset → bug
Intentional reset → design

27. Lab 07 — Composition vs Prop Relay
Start with:
<App>
  <Page
    user={user}
    avatar={avatar}
    permissions={permissions}
    actions={actions}
    sidebar={sidebar}
  />
</App>

Then ask whether the parent can instead supply structure:
<Page>
  <Header user={user} />
  <Sidebar>{sidebar}</Sidebar>
  <Content />
</Page>

Compare:
prop relay architecture
against:
composition architecture

Evaluate:
ownership
coupling
API size
change propagation
testability

28. Lab 08 — Context Distribution Diagnosis
Create:
<ThemeProvider>
  <App />
</ThemeProvider>

Then inspect consumers.
Ask:
[ ] Is Theme actually cross-cutting?
[ ] Is Context reducing meaningful prop relay?
[ ] Does the provider own the theme?
[ ] Could composition solve this instead?
[ ] Is the provider scope appropriate?

Do not conclude:
"Context is bad."
The correct question is:
"Is Context solving the distribution problem that actually exists?"

Layer 4 — 🔥 The Crucible
29. Prediction Challenge 01 — Two Counters
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      {count}
    </button>
  );
}

function App() {
  return (
    <>
      <Counter />
      <Counter />
    </>
  );
}

Predict:
After clicking the first button three times:
Counter A = ?
Counter B = ?

Answer:
Counter A = 3
Counter B = 0

Reason:
same component type + different component occurrences = independent state

30. Prediction Challenge 02 — Lifted State
function Parent() {
  const [value, setValue] = useState("");

  return (
    <>
      <Input value={value} onChange={setValue} />
      <Preview value={value} />
    </>
  );
}

Predict the ownership graph.

Answer:
Parent └── value
├── Input
└── Preview

Input does not own the canonical value.
Preview does not own the canonical value.
The parent owns the invariant.

31. Prediction Challenge 03 — Derived State
function User({ first, last }) {
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    setFullName(`${first} ${last}`);
  }, [first, last]);

  return <div>{fullName}</div>;
}

Question:
Is fullName actually state?

Answer:
Not conceptually.
It is derived from:
first + last
The effect introduces a synchronization cycle that is unnecessary if no external system is involved.

Prefer:
const fullName = `${first} ${last}`;

32. Prediction Challenge 04 — Stable Entity Keys
Initial:
A B C

Each row has local draft state.

Then:
B C D
with:
key={item.id}

Predict:
A → removed
B → preserved
C → preserved
D → new

That is the intended identity model.

33. Prediction Challenge 05 — Index Keys
Initial:
A B C

Then:
B C D
with:
key={index}

React sees positions.
Conceptually:
position 0: A → B
position 1: B → C
position 2: C → D

This can cause local state to remain attached to positions rather than entities.
That is why editable/reorderable collections are especially dangerous with index keys.

34. Prediction Challenge 06 — Context vs Ownership
Suppose:
<ThemeProvider value={theme}>
  <Button />
</ThemeProvider>

Question:
Does Button own theme?

No.
Context determines how Button obtains the dependency.
Ownership remains a separate architectural question.

35. Production Incident — Draft Attached to Wrong Row
Symptom:
A user edits product B.
They sort the table.
The draft appears under product C.

Investigation:
Inspect:
key={index}

Root cause:
Identity followed position instead of entity.

Fix:
Use:
key={product.id}
provided the identifier is stable and unique among siblings.

Prevention:
Add an architecture rule:
Mutable entity collection ↓ entity-stable key

36. Production Incident — Form Resets on Parent Change
Symptom:
A form unexpectedly clears when unrelated parent state changes.

Investigation:
Look for:
<Form key={someChangingValue} />
or:
function Parent() {
  function Form() { ... }
  return <Form />;
}

The second pattern creates a new component type when the nested function is recreated.

Diagnosis:
The problem is component identity, not "React randomly losing state."

Fix:
Move the component definition outside the render scope or otherwise provide a stable component type.

37. Production Incident — Two UI Areas Disagree
Symptom:
A selected item appears selected in one component but not another.

Investigation:
Find:
List.selectedId
Details.selectedId

Root cause:
Duplicated canonical state.

Fix:
Move the state to the narrowest common owner:
Common parent
│
├── List
└── Details

38. Production Incident — Giant Context
Symptom:
An application has:
<AppContext.Provider value={{
  user,
  theme,
  cart,
  modal,
  notifications,
  filters,
  editor,
  search,
  permissions,
  ...
}}>

Diagnosis:
Context has become a generic application-state container.
The architectural problem is not simply "too much Context."
It is that unrelated ownership boundaries have been collapsed.

Refactoring direction:
Separate by semantic ownership/distribution requirements.
Authentication context
Theme context
Feature-specific state
Local component state
Composition

Do not mechanically split every field into its own provider either.

39. Production Incident — State Lifted Too High
Symptom:
A small tooltip interaction requires:
App → Layout → Page → Feature → Panel → Tooltip
to coordinate state.

Diagnosis:
State was lifted beyond its required ownership boundary.

Refactoring:
Move it back toward:
Tooltip
or the smallest subtree that genuinely needs the state.

40. Production Incident — Universal Component
Symptom:
A shared component has:
25 props
8 booleans
5 variants
3 render callbacks
4 modes

Diagnosis:
The abstraction is absorbing unrelated responsibilities.

Refactoring:
Split according to stable semantics and composition boundaries.

41. Senior Architecture Decision Matrix
Situation | Prefer | Avoid
--- | --- | ---
State used by one component | Local state | Global Context
State shared by siblings | Lifted state | Duplicated state
Deep dependency distribution | Context | Long prop relay
Custom structure | Composition | Configuration explosion
Stable mutable list | Entity key | Index key
Reset local state intentionally | Explicit key | Manual reset synchronization
Derived value | Computation | Redundant state
External resource | Effect + cleanup | Render-side effect
Domain-specific UI | Feature component | Universal component
Repeated stable semantic concept | Shared abstraction | Copy/paste forever
Similar syntax only | Keep local | Premature abstraction
Component behavior varies structurally | Composition | Boolean explosion
DOM event abstraction | Semantic callback when appropriate | DOM event leakage
Cross-cutting dependency | Context where justified | Giant application Context

42. Senior Interview Gotchas
Gotcha 1:
"Every parent render recreates all child components."
Oversimplified.
A parent render creates a new set of React element descriptions, but reconciliation determines what component occurrences continue to correspond to prior ones.

Gotcha 2:
"Keys are just for performance."
False.
Keys participate in identity decisions and therefore can affect state preservation.

Gotcha 3:
"Context is global state."
False.
Context is fundamentally a subtree dependency-distribution mechanism.

Gotcha 4:
"Props are immutable."
More precisely:
A component should treat its received props as read-only inputs.
That does not mean every object graph reachable from a prop is magically immutable at the JavaScript runtime level.

Gotcha 5:
"If two components share data, use Context."
Not necessarily.
Possible solutions include:
composition
lifting state
props
Context
external state architecture
Choose according to ownership and distribution requirements.

Gotcha 6:
"More components means better architecture."
False.
A component boundary should represent meaningful responsibility and change isolation.

Gotcha 7:
"Effects are React lifecycle methods."
Incomplete.
The stronger mental model is:
Effects synchronize React with external systems.

Gotcha 8:
"Index keys are always wrong."
False.
They can be acceptable when the collection is genuinely static and positional identity is stable.
The problem occurs when positional identity differs from entity identity.

43. KPI 03 Master Architecture Review
When reviewing a React feature, walk through this sequence:
STEP 01: What are the domain concepts?
↓
STEP 02: Which component owns each mutable invariant?
↓
STEP 03: Which values are derived?
↓
STEP 04: Which values must cross component boundaries?
↓
STEP 05: Can composition reduce those dependencies?
↓
STEP 06: Where is Context actually required?
↓
STEP 07: What are the public component contracts?
↓
STEP 08: What are the semantic events?
↓
STEP 09: What establishes component identity?
↓
STEP 10: Which state must survive updates/reordering?
↓
STEP 11: Which resources require lifecycle synchronization?
↓
STEP 12: Which changes should remain localized?

44. The 35-Point KPI 03 Completion Checklist
Components:
[ ] I can distinguish a component type from a component occurrence.
[ ] I can distinguish a React element from a Fiber.
[ ] I can distinguish a Fiber from a DOM node.
[ ] I understand component boundaries as ownership boundaries.
[ ] I can identify a component's coherent responsibility.
[ ] I can detect god components.
[ ] I can detect over-fragmentation.
[ ] I can reason about change propagation.

Props:
[ ] I understand props as component inputs.
[ ] I can design a narrow prop contract.
[ ] I can distinguish data props from behavioral props.
[ ] I can design semantic callback names.
[ ] I understand children as a prop.
[ ] I can recognize prop explosion.
[ ] I can avoid leaking implementation details through props.
[ ] I understand object identity implications at the component boundary.

State:
[ ] I can identify the canonical owner of state.
[ ] I can apply the narrowest-common-owner principle.
[ ] I know when to lift state.
[ ] I know when not to lift state.
[ ] I can detect duplicated state.
[ ] I can detect unnecessary derived state.
[ ] I understand state locality.
[ ] I can intentionally transfer state ownership during refactoring.

Communication:
[ ] I understand data-down/events-up.
[ ] I can design callback payloads.
[ ] I can distinguish DOM events from component events.
[ ] I can detect setter leakage.
[ ] I can replace ambiguous callbacks with semantic events.
[ ] I understand composition as a communication mechanism.

Identity:
[ ] I understand component identity.
[ ] I understand keys as identity hints.
[ ] I know why stable entity keys matter.
[ ] I understand when index keys are unsafe.
[ ] I can intentionally reset state with identity changes.
[ ] I can diagnose accidental state resets.
[ ] I can predict state preservation across list changes.

Lifecycle:
[ ] I can distinguish render from commit.
[ ] I can distinguish commit from effects.
[ ] I understand effects as synchronization.
[ ] I can identify external resources requiring cleanup.
[ ] I can recognize derived-data effects as an anti-pattern.
[ ] I can reason about mount/update/unmount behavior.

Architecture:
[ ] I can distinguish ownership from distribution.
[ ] I understand Context as dependency distribution.
[ ] I can choose between props, lifting, composition, and Context.
[ ] I can evaluate an abstraction boundary.
[ ] I can detect premature abstraction.
[ ] I can evaluate component architecture using ownership, input, output, identity, lifecycle, and boundary.

45. Final Crucible — Senior-Level Architecture Challenge
You inherit this feature:
Dashboard
│
├── AppContext
│   ├── user
│   ├── theme
│   ├── filters
│   ├── selectedProduct
│   ├── modal
│   ├── editor
│   ├── notifications
│   └── tableState
│
└── ProductPage
    ├── ProductTable
    │   ├── ProductRow
    │   └── ProductRow
    │       ├── ProductEditor
    │       └── ProductDetails

Problems:
• rows use index keys
• editor state is stored in AppContext
• table filters are duplicated in ProductTable and ProductPage
• ProductRow receives 14 props
• ProductDetails receives raw global context
• derived values are synchronized through effects
• modal state resets unexpectedly
• ProductPage has 1,800 lines

Your task is to redesign the architecture.

A senior answer should identify:
1. Canonical state ownership
2. State that should remain local
3. State that should be lifted
4. State that requires distribution
5. Composition opportunities
6. Context boundaries
7. Component contracts
8. Semantic callbacks
9. Stable identity strategy
10. Derived-data simplification
11. Effect/resource boundaries
12. Feature decomposition
13. Testing boundaries
14. Expected change isolation

The goal is not to maximize the number of components.
The goal is:
coherent ownership + explicit contracts + predictable identity + minimal synchronization + localized change

46. KPI 03 Master Mental Model
Everything in this KPI can be reduced to one architecture:
          ┌─────────────────────┐
          │      COMPONENT      │
          └──────────┬──────────┘
                     │
  ┌──────────────────┼──────────────────┐
  │                  │                  │
  ▼                  ▼                  ▼
OWNERSHIP          INPUTS            OUTPUTS
  │                  │                  │
state / effects    props             callbacks
canonical data     children          events
  │                  │                  │
  └──────────────────┼──────────────────┘
                     │
                     ▼
                 IDENTITY
                     │
              type + key + position
                     │
                     ▼
              STATE CONTINUITY
                     │
                     ▼
                 LIFECYCLE
                     │
            render → commit → effect
                     │
                     ▼
               ARCHITECTURE
                     │
  ┌──────────────────┼──────────────────┐
  ▼                  ▼                  ▼
composition       context          abstraction

The senior engineer does not merely ask:
"How do I make this component work?"
They ask:
"What responsibility belongs here, what dependency crosses this boundary, what identity should survive, and what change should remain isolated?"

47. KPI 03 Final Engineering Principles
Principle 1: State belongs where the invariant is owned.
Principle 2: Props describe explicit component inputs; callbacks describe explicit component outputs.
Principle 3: Composition is often a stronger decoupling mechanism than configuration.
Principle 4: Context distributes dependencies; it does not magically determine ownership.
Principle 5: Keys are part of identity design, not merely list syntax.
Principle 6: Derived data should usually remain derived.
Principle 7: Effects synchronize with external systems; they should not be used as a general-purpose data transformation mechanism.
Principle 8: A reusable abstraction should represent stable shared knowledge, not merely repeated syntax.
Principle 9: A component boundary should make ownership and change propagation easier to reason about, not harder.
Principle 10: The best component architecture minimizes accidental coupling while keeping intentional dependencies explicit.

48. KPI 03 Boundary — What Comes Next
KPI 03 has now established the complete component architecture model:
Components
↓
Props
↓
Callbacks
↓
Composition
↓
State ownership
↓
Context distribution
↓
Identity
↓
Lifecycle
↓
Abstraction
↓
Testing
↓
Architecture

The next KPI should therefore move below the component boundary into React's state and hooks programming model rather than repeating component architecture.

Deferred deliberately
The following remain outside this KPI and should not be pulled forward prematurely:
❌ Concurrent rendering internals
❌ Scheduler lane priorities
❌ Time slicing
❌ Transition scheduling internals
❌ Custom reconcilers
❌ Server Components protocol
❌ Streaming SSR
❌ Server Actions
❌ Advanced performance optimization
Those belong to the later React/Next.js layers.

🏆 KPI 03 Completion Standard
You should consider KPI 03 mastered only when you can look at an unfamiliar React feature and, before changing code, identify:
WHO OWNS THE STATE?
↓
WHAT IS THE PUBLIC CONTRACT?
↓
HOW DOES DATA ENTER?
↓
HOW DO EVENTS LEAVE?
↓
CAN COMPOSITION REDUCE COUPLING?
↓
DOES CONTEXT ACTUALLY SOLVE DISTRIBUTION?
↓
WHAT ESTABLISHES IDENTITY?
↓
WHAT STATE MUST SURVIVE?
↓
WHAT REQUIRES EFFECT SYNCHRONIZATION?
↓
WHAT SHOULD BE DERIVED?
↓
WHERE SHOULD THE COMPONENT BOUNDARY EXIST?
↓
WHAT CHANGE SHOULD REMAIN LOCAL?

If you can answer those questions mechanically, you are no longer designing React components by intuition alone—you are designing an explicit UI architecture.
