Level 06 — React Fundamentals
KPI 03 — Components, Props & Composition
PART 02 — Component Inputs — Props, Contracts, Defaults & Data Flow
[⬅️ Previous Part](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/01-react-components-as-units-of-ui-ownership.md) | [📚 Level 06 Index](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/README.md) | [🧪 Companion Lab](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/examples/02-component-inputs-props-contracts.html) | [Next Part ➡️](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/03-children-composition-and-slot-like-patterns.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models
1. The Executive Mental Model
A component does not "receive variables."
It receives an input object.
That input object is props.
PARENT RENDER
│
│
▼
┌─────────────────┐
│  React Element  │
│                 │
│ type: UserCard  │
│ props: {...}    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Child Component │
│                 │
│ UserCard(props) │
└────────┬────────┘
         │
         ▼
   RENDER OUTPUT
         │
         ▼
React Element Tree
         │
         ▼
     Reconcile
         │
         ▼
      Commit

The important distinction is:
Parent state
↓
Parent render
↓
React element
↓
props object
↓
Child render
↓
Child UI

The child does not own the parent's state.
The child receives a snapshot of the parent's current inputs for that render.

2. Props Are Inputs, Not Ownership
Consider:
function UserCard({ user }) {
  return <h2>{user.name}</h2>;
}
The component is effectively saying:
"I can render myself if you provide a user."
It is not saying:
"I own the user."
That distinction determines architecture.

DATA OWNERSHIP
┌──────────────────────────────┐
│ Component that owns the data │
└──────────────┬───────────────┘
               │
               │ props
               ▼
┌──────────────────────────────┐
│ Component that consumes it   │
└──────────────┬───────────────┘
               │
               ▼
           UI output

A senior engineer constantly asks:
Who owns this value, and who merely consumes it?

3. Props Are Read-Only Inputs
A component should not conceptually mutate its props.
Bad:
function Profile({ user }) {
  user.name = "Anonymous";
  return <h2>{user.name}</h2>;
}

The problem is deeper than "React says don't do that."
The real problem is ownership.
Parent owns object
│
▼
Child receives reference
│
▼
Child mutates parent's object
│
▼
Ownership boundary violated
│
▼
Unpredictable data flow

The correct architecture is:
Child
│
│ request/change
▼
Parent callback
│
▼
Parent updates owned state
│
▼
New props
│
▼
Child renders new snapshot

4. Props Are a Contract
A component's props define its external API.
Compare:
<UserCard
  user={user}
  compact
  showStatus
  showAvatar
  showActions
  canEdit
  canDelete
  canMessage
  theme="dark"
  variant="enterprise"
  mode="dashboard"
/>
with:
<UserCard user={user} />

The first API exposes many behavioral decisions.
The second exposes a narrower contract.
This does not mean fewer props are always better.
The engineering question is:
Does every exposed prop represent a meaningful responsibility of this component?

5. The Prop Contract Has Several Dimensions
A mature component contract has at least these dimensions:
Dimension | Question
--- | ---
Data | What information does the component need?
Behavior | What actions can the component request?
Presentation | Which visual variants are intentional?
Optionality | Which inputs are genuinely optional?
Defaults | What happens when an input is omitted?
Identity | Are references meaningful?
Ownership | Who owns the underlying data?
Composition | Can consumers provide UI rather than flags?
Stability | Will the API survive future requirements?

6. Primitive Props
Simple values are often appropriate component inputs.
<Button label="Save" disabled={isSaving} />

Examples:
string
number
boolean
null
undefined
enum-like values

But even primitive props require API judgment.
This:
<Button primary large rounded blue />
can become a collection of styling switches.
A more intentional contract might be:
<Button variant="primary" size="large" />
The second API communicates that these values belong to defined conceptual dimensions.

7. Object Props
Objects are common:
<UserCard user={user} />
But an object prop contains multiple values and introduces reference identity.
Suppose:
const user = { id: 42, name: "Srikar", role: "Engineer" };
Then:
<UserCard user={user} />
passes the object reference as an input.

Conceptually:
user prop
│
▼
┌────────────────────┐
│   object @0xA1     │
│                    │
│ id: 42             │
│ name: Srikar       │
│ role: Engineer     │
└────────────────────┘

If the parent creates:
<UserCard user={{ id: user.id, name: user.name, role: user.role }} />
the object has a different identity even if its values are equivalent.
This becomes important when components or optimization boundaries care about reference equality.
The important senior-level distinction is:
Value equality ≠ Reference identity
Do not collapse those concepts.

8. Function Props
Functions are another major prop category.
<UserForm onSubmit={handleSubmit} />

The function represents behavior supplied by the parent.
The child can invoke it:
function UserForm({ onSubmit }) {
  function submit() {
    onSubmit({ name: "Srikar" });
  }
  return <button onClick={submit}>Save</button>;
}

The child does not need to know how submission is implemented.
The parent may:
send API request
update state
show notification
navigate
log telemetry

The child only knows:
"I can request submission."
That is an important abstraction boundary.

9. Callback Props Are Control Inversion
Normally:
Parent ↓ Child
With a callback:
Parent ──data──► Child
Parent ◄─event── Child

The child does not directly control parent state.
Instead:
Child
│
│ callback(payload)
▼
Parent
│
│ state update
▼
Parent re-render
│
▼
New child props

This is one of React's foundational data-flow patterns.

10. Callback Naming Is an API Design Problem
Compare:
<UserForm onSubmit={...} />
with:
<UserForm saveUser={...} />

The first describes a component-level event:
"The form was submitted."
The second describes a parent implementation:
"Call my save operation."

Generally, component contracts become more reusable when callback props describe events or requests, rather than leaking parent implementation details.
Examples:
onSubmit
onChange
onSelect
onClose
onCancel
onDelete
onRetry

The exact naming convention is less important than semantic clarity.

11. Props Are Per-Render Inputs
This is one of the most important mental models in React.
Consider:
function Parent() {
  const [count, setCount] = useState(0);
  return <Child count={count} />;
}

Initial render:
Parent Render #1
count = 0
props
│
▼
Child({ count: 0 })

After:
setCount(1);
React produces another render.

Parent Render #2
count = 1
props
│
▼
Child({ count: 1 })

The child does not have a magical mutable connection to count.
Each render evaluates a new component invocation against the current render inputs.

12. Render Snapshot Model
Think in terms of snapshots:
Render #1 ────────────────────────
Parent state: count = 0
Child props: count = 0

Render #2 ────────────────────────
Parent state: count = 1
Child props: count = 1

Closures created during Render #1 can still refer to Render #1 values.
This connects props directly to the broader React model:
render ↓ snapshot ↓ closures ↓ events ↓ future updates
This should be reasoned about explicitly rather than treated as React magic.

13. Destructuring Does Not Change Ownership
These are conceptually equivalent:
function UserCard(props) {
  return <h2>{props.user.name}</h2>;
}
and:
function UserCard({ user }) {
  return <h2>{user.name}</h2>;
}

Destructuring is syntax.
It does not:
clone the object
transfer ownership
freeze the object
create independent state
change React identity

This distinction matters because developers sometimes mistake destructuring for copying.

14. Defaults Are Contract Semantics
Consider:
function Button({ size = "medium" }) {
  // ...
}

This means:
if size === undefined
use "medium"

It does not mean:
if size is any falsy value
use "medium"

Therefore:
<Button size={undefined} />
uses the default.

But:
<Button size={null} />
does not trigger the JavaScript parameter default.

Similarly:
function Panel({ title = "Untitled" }) {
  // ...
}
is materially different from:
const resolvedTitle = title || "Untitled";
because:
undefined
null
""
0
false
have different semantics.
Defaults should encode genuine domain defaults, not conceal invalid input.

15. Required vs Optional Props
A mature component should make its contract explicit.
For example:
type UserCardProps = {
  user: User;
  onSelect: (id: string) => void;
  compact?: boolean;
};

The important conceptual distinction is:
Required: "I cannot meaningfully operate without this."
Optional: "I have a valid behavior when this is omitted."

Do not make everything optional simply to make the component easier to call.
An enormous optional-prop surface creates ambiguity:
Which combinations are valid?
Which combinations conflict?
What is the default?
Which flags override which others?
That is an API design failure.

16. Boolean Props Need Special Attention
Boolean props are easy to add:
<Card compact bordered elevated highlighted interactive selectable />

But many independent booleans create a combinatorial state space.
With six booleans:
2^6 = 64
potential combinations exist.
Most may never have been intentionally designed.
A semantic variant can sometimes reduce ambiguity:
<Card variant="compact" />
or:
<Card appearance="elevated" />

But do not mechanically replace every boolean with an enum.
The correct question is:
Are these truly independent capabilities, or are they states of one conceptual dimension?

17. Avoid Boolean Explosion
Bad:
<DataTable
  compact
  dense
  striped
  bordered
  stickyHeader
  sortable
  filterable
  selectable
  virtualized
/>

This API mixes:
visual configuration
interaction behavior
data behavior
rendering strategy
performance implementation

These concerns may belong to different abstractions.
A better architecture could separate:
<DataTable
  density="compact"
  appearance="striped"
  columns={columns}
  selection={selection}
/>

The goal is not merely fewer props.
The goal is coherent responsibility.

18. Raw Domain Objects vs View Contracts
Suppose an API returns:
{
  id: 42,
  first_name: "Srikar",
  last_name: "Kudurmalla",
  created_at: "...",
  internal_status: "...",
  permissions: [...],
  audit_metadata: {...},
  billing_profile: {...}
}

Passing the entire object everywhere:
<UserCard user={apiUser} />
can couple the UI to the backend representation.
Sometimes a narrower contract is better:
<UserCard
  name={`${user.first_name} ${user.last_name}`}
  status={user.internal_status}
/>
or a deliberate view model:
const userCardModel = { name, status, avatarUrl };
Then:
<UserCard model={userCardModel} />

The correct choice depends on the architectural boundary.
The important principle is:
Do not expose more data than the component needs merely because the object already exists.

19. Prop Drilling
Prop drilling is not automatically a bug.
Example:
App
│
▼
Dashboard
│
▼
Sidebar
│
▼
UserMenu
│
▼
Avatar

If:
App owns user
Avatar needs user.name
you might have:
<App>
  <Dashboard user={user}>
    <Sidebar user={user}>
      <UserMenu user={user}>
        <Avatar user={user} />
      </UserMenu>
    </Sidebar>
  </Dashboard>
</App>

This is explicit.
The problem occurs when intermediate components become transport tunnels:
Component A
↓ unrelated prop
Component B
↓ unrelated prop
Component C
↓ unrelated prop
Component D
↓ actual consumer

That is an architectural signal.

20. The Senior Question Is Not "How Do I Avoid Prop Drilling?"
It is:
Does the intermediate component conceptually participate in this data flow?
If yes:
prop passing may be appropriate
If no:
composition
context
state colocating
or another boundary
may be more appropriate.
Avoid introducing global state merely to eliminate two levels of props.

21. Children Is Also a Prop
These:
<Card>
  <Avatar />
</Card>
and:
<Card children={<Avatar />} />
represent the same conceptual input:
props.children

The receiving component determines placement:
function Card({ children }) {
  return (
    <section>
      <header>Profile</header>
      <div>{children}</div>
    </section>
  );
}

This is composition.
The consumer supplies content.
The component owns the surrounding structure.
This will become the focus of the next Part.

22. Props vs State
A critical distinction:
Props | State
--- | ---
External input | Internally owned data
Supplied by parent/consumer | Managed by component
Read-only from child perspective | Updated through state APIs
Changes when parent supplies new value | Changes when owner schedules update
Defines component input contract | Defines component's local dynamic memory

Conceptually:
COMPONENT
External ─────► props
                  │
                  ▼
              render logic
                  ▲
                  │
Internal ─────► state

The two can interact:
props + state
↓
render
↓
UI
But they are not interchangeable.

23. The Derived-State Trap
Suppose:
function UserCard({ user }) {
  const [name, setName] = useState(user.name);
  return <h2>{name}</h2>;
}

This introduces a second source of truth.
Initially:
props.user.name = "Srikar"
state.name = "Srikar"

Later:
props.user.name = "Alex"
state.name = "Srikar"

Now:
Which one is authoritative?
This is a common source of stale UI.
If the value is directly derivable:
const name = user.name;
do not automatically store it as state.

24. Controlled vs Uncontrolled Component Contracts
A controlled input:
<input value={value} onChange={handleChange} />
has a parent-controlled value.

Conceptually:
Parent state
│
▼
value prop
│
▼
Input
│
│ onChange
▼
Parent
│
▼
state update

An uncontrolled component instead maintains its own internal DOM/input state.
The contract difference is architectural:
Controlled: Consumer owns current value.
Uncontrolled: Component/DOM owns current value.
A component API should make that ownership model coherent.

25. Do Not Mix Ownership Accidentally
Dangerous:
<input value={value} defaultValue="hello" />
This communicates two competing ownership models.
Likewise:
<MyInput value={value} />
but internally:
const [internalValue, setInternalValue] = useState(value);
creates ambiguity unless the component deliberately implements a controlled/uncontrolled contract.
Senior component APIs should make ownership obvious.

26. Object Identity in Props
Consider:
function Parent() {
  const options = { pageSize: 20 };
  return <Table options={options} />;
}

Every execution of Parent creates a new object.
Conceptually:
Render #1 options → Object A
Render #2 options → Object B
Object A !== Object B
even though:
Object A.pageSize === Object B.pageSize

This does not automatically mean something is wrong.
But it becomes important when:
memoization is involved
dependency arrays are involved
child APIs use reference equality
expensive calculations depend on object identity
external subscriptions use object identity

Do not cargo-cult stabilization.
First understand the semantic requirement.

27. Inline Callback Identity
Similarly:
<Child onClick={() => save(id)} />
creates a new function during the render.
Again:
new function identity ≠ automatic bug
The question is whether identity matters at a particular boundary.
Performance optimization belongs to the appropriate React performance material; here the important lesson is simply:
Function props are values with identity.

28. Prop Contract Anti-Pattern: Implementation Leakage
Bad:
<Modal
  setIsOpen={setIsOpen}
  setSelectedUser={setSelectedUser}
  setLoading={setLoading}
/>
The child now knows the parent's state architecture.
A better contract:
<Modal open={open} onClose={handleClose} />
The parent retains ownership.
The child receives capabilities, not state-management internals.

29. Prop Contract Anti-Pattern: State Setter Leakage
Passing:
<Child setCount={setCount} />
is sometimes legitimate, but often exposes the implementation of state ownership.
Compare:
<Child onIncrement={increment} />
The second contract says:
"I need an increment capability."
The first says:
"I need access to your state storage mechanism."
The narrower abstraction is often preferable.
Not universally—but often.

30. Prop Contract Anti-Pattern: God Props
Bad:
<Dashboard config={everything} />
where:
everything = {
  user,
  permissions,
  theme,
  apiClient,
  featureFlags,
  router,
  analytics,
  environment,
  tableConfig,
  modalConfig,
  ...
};

This is not a clean abstraction.
It makes dependencies implicit inside one large object.
A component should expose a contract aligned with its actual responsibilities.

Layer 2 — 🔬 Deep Mechanical Breakdown
31. What Actually Happens When Props Change?
Consider:
function Parent() {
  const [count, setCount] = useState(0);
  return <Child count={count} />;
}

function Child({ count }) {
  return <div>{count}</div>;
}

Initial render:
Parent Fiber
│
▼
Parent render
│
│ count = 0
▼
React element: Child
props: { count: 0 }
│
▼
Child Fiber
│
▼
Child render
│
▼
<div>0</div>

After:
setCount(1);
React schedules an update on the owning Fiber.
The resulting work conceptually becomes:
Parent Fiber
│
▼
Parent render
│
│ count = 1
▼
React element: Child
props: { count: 1 }
│
▼
reconciliation
│
▼
Child Fiber receives new pendingProps
│
▼
Child render
│
▼
<div>1</div>

The key mechanism is:
parent state changes
↓
parent produces new element description
↓
child receives new props
↓
child render evaluates against those props
↓
reconciliation determines resulting tree
↓
commit updates host environment if necessary

32. Fiber Reality
A conceptual Fiber for the child contains information resembling:
Fiber
├── type
├── key
├── pendingProps
├── memoizedProps
├── memoizedState
├── child
├── sibling
├── return
└── alternate

For props specifically:
pendingProps
│
│ work being evaluated
▼
render
│
▼
memoizedProps
│
│ committed/current props
▼
current tree

The exact internal implementation is React-version-dependent, but the architectural model is crucial:
Props participate in the Fiber's render lifecycle; they are not merely function arguments floating independently of React.

33. pendingProps vs memoizedProps
Conceptually:
Current Fiber
memoizedProps
│
│ currently committed input
▼
Work-In-Progress Fiber
pendingProps
│
│ input being evaluated
▼
new render

After successful work and commit:
new props
↓
become committed props

This helps explain why thinking in terms of "React calls my function with props" is useful but incomplete.
The runtime has a tree representation around that function invocation.

34. Props Do Not Persist Independently
Suppose:
function Child({ count }) {
  console.log(count);
  return <div>{count}</div>;
}

The component does not own a persistent mutable count.
Instead:
Render #1 count = 0
Render #2 count = 1
Render #3 count = 2

The value comes from the current render's props.
If the child needs persistent internal memory, that is a separate concept:
props → external input
state → internal memory

35. Render-by-Render Prediction Challenge #1
Given:
function Parent() {
  const [count, setCount] = useState(0);
  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
      <Child count={count} />
    </>
  );
}

function Child({ count }) {
  console.log("Child:", count);
  return <div>{count}</div>;
}

Render #1
Predict:
Parent count = ?
Child props.count = ?
DOM = ?

Answer:
Parent count = 0
Child props.count = 0
DOM = <div>0</div>

After click:
Render #2
Parent count = 1
Child props.count = 1
DOM = <div>1</div>

The child did not mutate its props.
The parent produced new input.

36. Render-by-Render Prediction Challenge #2
Now:
function Parent() {
  const [count, setCount] = useState(0);
  return (
    <Child count={count} onIncrement={() => setCount(c => c + 1)} />
  );
}

function Child({ count, onIncrement }) {
  return (
    <button onClick={onIncrement}>
      {count}
    </button>
  );
}

Trace:
Initial
Parent state = 0
Child props.count = 0
Child props.onIncrement = Function A

After click:
Parent state = 1
Child props.count = 1
Child props.onIncrement = Function B

The callback can have a new identity while still representing the same semantic operation.
That distinction becomes important later when an optimization boundary explicitly cares about identity.

37. Render-by-Render Prediction Challenge #3 — Stale Derived State
function Child({ count }) {
  const [localCount] = useState(count);
  return <div>{localCount}</div>;
}

Initial:
Parent count = 0
Child props.count = 0
Child state = 0
DOM = 0

Parent changes:
Parent count = 1
Child props.count = 1
Child state = 0
DOM = 0

The prop changed.
The state did not.
This is the mechanical reason the pattern can become stale.

38. Render-by-Render Prediction Challenge #4 — Default Values
function Badge({ label = "Unknown" }) {
  return <span>{label}</span>;
}

Case A:
<Badge />
Result:
label = "Unknown"

Case B:
<Badge label={undefined} />
Result:
label = "Unknown"

Case C:
<Badge label={null} />
Result:
label = null

Case D:
<Badge label="" />
Result:
label = ""

Defaults are not truthiness checks.

39. Render-by-Render Prediction Challenge #5 — Object Identity
function Parent() {
  const [count, setCount] = useState(0);
  const config = { pageSize: 20 };
  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>
        {count}
      </button>
      <Child config={config} />
    </>
  );
}

Render #1:
config → Object A

Render #2:
config → Object B

Therefore:
ObjectA === ObjectB
is:
false
even though:
ObjectA.pageSize === ObjectB.pageSize
is:
true

The distinction is fundamental.

40. Component Contract Design: A Formal Model
Think of a component as:
Component: Inputs → UI + Events
More formally:
P = props
S = internal state
R = render function
UI = R(P, S)

But behavior also includes externally exposed events:
Event → callback → owner update → new P/S → new UI

A useful abstraction is:
┌───────────────────┐
│ Component Contract│
└─────────┬─────────┘
          │
  ┌───────┼───────┐
  ▼       ▼       ▼
Data   Behavior Composition
props  callbacks children
  │       │       │
  └───────┼───────┘
          ▼
        Render
          │
          ▼
          UI

41. Production Pattern — Narrow Input Contract
Prefer:
function UserSummary({ name, role, avatarUrl }) {
  return (
    <section>
      <img src={avatarUrl} alt="" />
      <h2>{name}</h2>
      <p>{role}</p>
    </section>
  );
}
when those are genuinely the component's required inputs.
This makes dependencies obvious.
The caller can adapt its domain model.

42. Production Pattern — Domain Object Contract
Prefer:
function UserSummary({ user }) {
  return (
    <section>
      <h2>{user.name}</h2>
      <p>{user.role}</p>
    </section>
  );
}
when:
the user is a meaningful domain entity
the component conceptually operates on a user
multiple related fields belong together
the object boundary is stable

There is no universal rule that "many primitives are better" or "objects are better."
The correct question is:
What is the conceptual abstraction represented by this component?

43. Production Pattern — Event Contract
Instead of:
function UserRow({ setSelectedUser, setModalOpen, setMode }) {
  // ...
}
prefer:
function UserRow({ user, onSelect }) {
  return (
    <button onClick={() => onSelect(user.id)}>
      {user.name}
    </button>
  );
}

The child communicates:
User was selected.
The parent decides:
open modal
change route
update selection
fetch details

This preserves ownership.

44. Production Pattern — Semantic Callback Payloads
Compare:
onSelect={() => onSelect(user)}
with:
onSelect={() => onSelect(user.id)}

Neither is universally correct.
The decision depends on the contract.
If the child is a generic selector:
onSelect(id)
may keep the contract narrow.
If the parent already works with the domain object and the component semantically selects that object:
onSelect(user)
may be clearer.
The payload should represent the event's meaningful information, not arbitrary implementation state.

45. Anti-Pattern Teardown #1 — Mutating Props
Flawed:
function Profile({ user }) {
  user.name = "Changed";
  return <h2>{user.name}</h2>;
}

Why developers do it:
It feels convenient:
"I already have the object."

Mechanical failure:
Parent owns object
↓
Child receives reference
↓
Child mutates reference
↓
Parent-owned data changes outside owner

Now multiple consumers may observe changes without an explicit state transition.

Senior refactor:
function Profile({ user, onRename }) {
  return (
    <button onClick={() => onRename(user.id, "Changed")}>
      {user.name}
    </button>
  );
}
The owner performs the mutation/update.

46. Anti-Pattern Teardown #2 — Setter Leakage
Flawed:
<Child setUser={setUser} />

Why developers do it:
It is quick.

Mechanical failure:
The child now depends on the parent's state implementation.

Refactor:
<Child onRename={handleRename} />
The child receives a semantic capability.

47. Anti-Pattern Teardown #3 — Everything in One data Prop
Flawed:
<UserPanel data={everything} />

Why developers do it:
It avoids repeatedly editing the component API.

Mechanical failure:
Dependencies become hidden.
The component can silently begin depending on unrelated properties.

Refactor:
<UserPanel
  user={user}
  permissions={permissions}
  onEdit={handleEdit}
/>
Or redesign the component boundary if those concerns do not belong together.

48. Anti-Pattern Teardown #4 — Copying Props Into State
Flawed:
function SearchBox({ value }) {
  const [internalValue, setInternalValue] = useState(value);
  return (
    <input
      value={internalValue}
      onChange={e => setInternalValue(e.target.value)}
    />
  );
}

Failure:
Parent:
value = "React"
Child:
internalValue = "React"

Later parent:
value = "TypeScript"
Child:
internalValue = "React"

Now the component has two competing sources of truth.

Refactor:
If controlled:
function SearchBox({ value, onChange }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
}
If local state is genuinely required, define an explicit synchronization/ownership contract rather than copying props casually.

49. Anti-Pattern Teardown #5 — Boolean Configuration Explosion
Flawed:
<Panel
  compact
  dark
  bordered
  elevated
  interactive
  selectable
  closable
  searchable
  exportable
/>

Mechanical failure:
The API represents too many independent axes.
Potential state combinations explode.

Senior response:
Separate concerns:
<Panel
  density="compact"
  appearance="dark"
  interaction={{ selectable: true, closable: true }}
/>
or split responsibilities into multiple components.
The exact refactor depends on the domain.

Layer 3 — 🧪 Diagnostic Labs & DevTools Profiling
50. Lab A — Inspecting Props in React DevTools
Open the application.
Open Chrome DevTools.
Open the Components panel in React DevTools.
Select the target component.
Inspect its props.
Trigger the parent update.
Observe which props changed.
Inspect nested object/function values.
Compare behavior across renders.

Your goal is not merely:
"props changed"
but:
Which prop?
Why?
Who produced it?
Was the change semantic?
Was the reference changed?
Did the child actually need it?

51. Lab B — Record Why Components Rendered
In React DevTools Profiler:
[ ] Select the component
[ ] Record profiling session
[ ] Trigger state update
[ ] Stop recording
[ ] Inspect component
[ ] Inspect render reason information where available

Investigate:
props changed
state changed
parent rendered
context changed

Then ask:
Was the component's contract responsible for unnecessary propagation?
Do not jump directly to memoization.
First understand the data flow.

52. Lab C — Identity Probe
Use:
function Child({ config, onSave }) {
  console.table({
    config,
    configType: typeof config,
    onSaveType: typeof onSave
  });
  return null;
}

For deeper identity experiments:
const previous = useRef();
useEffect(() => {
  if (previous.current) {
    console.table({
      sameConfig: previous.current.config === config,
      sameOnSave: previous.current.onSave === onSave
    });
  }
  previous.current = { config, onSave };
});

This gives you an observable experiment instead of relying on intuition.

53. Lab D — Prop Contract Audit
For a production component, create this table:
Prop | Why required? | Owner | Type | Identity-sensitive? | Optional?
--- | --- | --- | --- | --- | ---
user | domain entity | parent | object | potentially | no
onSelect | selection event | parent | function | potentially | no
variant | visual state | consumer | string union | usually no | yes
children | composition | consumer | React node | yes | yes

If you cannot explain why a prop exists, investigate the contract.

54. Production Diagnostic Runbook — Stale Child Data
Symptom:
Child UI does not reflect updated parent data.

Step 1:
Inspect child props.
Did the prop change?

Step 2:
Inspect child state.
Did a copied prop remain stale?

Step 3:
Search for:
useState(prop)

Step 4:
Search for:
prop = ...

Step 5:
Determine ownership.
Who should be authoritative?

Step 6:
Remove redundant state where possible.

Step 7:
If local state is intentional, explicitly document the synchronization semantics.

55. Production Diagnostic Runbook — Prop Explosion
Symptom:
Component calls contain many flags.

Investigate:
[ ] Are props from one conceptual dimension?
[ ] Are booleans representing variants?
[ ] Are unrelated concerns mixed?
[ ] Are implementation details exposed?
[ ] Are callbacks exposing state setters?
[ ] Could composition remove configuration flags?
[ ] Should the component be split?

Do not optimize the syntax before fixing the architecture.

Layer 4 — 🔥 The Crucible
56. Senior Decision Matrix
Situation | Preferred direction
--- | ---
Child needs external read-only data | Prop
Child needs to request parent action | Callback prop
Child needs arbitrary content | children / composition
Value belongs exclusively to child | Local state
Multiple siblings need same state | Lift to common owner
Deeply shared cross-cutting value | Consider context or appropriate state architecture
Child receives setter only to mutate parent | Prefer semantic callback
Prop copied into state with no ownership reason | Remove redundant state
Large unrelated object passed everywhere | Narrow contract
Many booleans represent one conceptual axis | Variant/configuration model
Intermediate components merely transport data | Reconsider composition/state boundary
Domain object is itself the component's abstraction | Object prop can be appropriate
Component only needs two fields | Narrow props may be clearer

57. Senior Interview Gotchas
Gotcha 1:
Are props immutable?
Correct nuance:
Props should be treated as read-only inputs by the receiving component. The parent may produce a new props object on later renders.

Gotcha 2:
Does destructuring props clone the object?
No.
function Child({ user }) {}
does not deep clone user.

Gotcha 3:
Does passing an object prop mean React compares object contents?
Do not assume deep equality.
Reference identity matters in many React-related comparisons and userland mechanisms.

Gotcha 4:
Does parent re-render imply child state is reset?
No.
A child can preserve state when React determines its identity continues across reconciliation.

Gotcha 5:
Should all props be primitives?
No.
Objects, functions, elements, arrays, and other values can be appropriate props.
The question is contract quality and ownership.

Gotcha 6:
Is prop drilling always bad?
No.
Explicit data flow through a small number of meaningful layers can be clearer than introducing global state.

Gotcha 7:
Should callbacks always be memoized?
No.
Identity stabilization is an optimization/design concern, not a universal correctness requirement.

Gotcha 8:
Is useState(props.value) automatically wrong?
No.
It is a warning sign.
It becomes problematic when the component accidentally creates two sources of truth.

58. Final Prediction Challenge
Consider:
function App() {
  const [user, setUser] = useState({ name: "Srikar" });
  return (
    <Profile
      user={user}
      onRename={name =>
        setUser(prev => ({ ...prev, name }))
      }
    />
  );
}

function Profile({ user, onRename }) {
  const [draft, setDraft] = useState(user.name);
  return (
    <>
      <h2>{user.name}</h2>
      <input
        value={draft}
        onChange={e => setDraft(e.target.value)}
      />
      <button onClick={() => onRename(draft)}>
        Save
      </button>
    </>
  );
}

Render #1
Predict:
App user.name = ?
Profile props.user.name = ?
Profile draft = ?
DOM heading = ?
DOM input = ?

Answer:
App user.name = Srikar
Profile props.user.name = Srikar
Profile draft = Srikar
DOM heading = Srikar
DOM input = Srikar

Now user types:
Alex
Profile state changes:
draft = Alex
user.name = Srikar

DOM:
heading = Srikar
input = Alex

Then Save:
onRename("Alex")

Parent updates:
user.name = Alex

Now:
Profile props.user.name = Alex
Profile draft = Alex

Everything is synchronized.

But now imagine the parent changes the user externally:
user.name = Jordan
while:
draft = Alex

The component intentionally maintains two concepts:
server/parent value
draft/local editing value

That can be valid.
The important distinction is that this is now a deliberate editing-state model, rather than accidental duplication.

That is senior-level reasoning:
Redundant state is not defined merely by "the same value exists twice." It is defined by whether multiple values have clearly differentiated ownership and semantics.

59. Component Contract Review Checklist
Before approving a component API, ask:

Ownership:
[ ] Who owns every major piece of data?
[ ] Is ownership obvious from the API?
[ ] Does the child mutate parent-owned data?
[ ] Are state setters unnecessarily exposed?

Data:
[ ] Does each data prop represent a real dependency?
[ ] Are large objects being passed merely for convenience?
[ ] Is the component coupled to a backend representation unnecessarily?
[ ] Is an object prop conceptually justified?

Behavior:
[ ] Are callbacks semantic?
[ ] Do callback names describe events or implementation details?
[ ] Are callback payloads intentional?
[ ] Does the child remain ignorant of parent state-management internals?

Optionality:
[ ] Which props are genuinely optional?
[ ] Are defaults meaningful?
[ ] Are invalid states hidden by excessive optionality?
[ ] Are boolean flags creating ambiguous combinations?

Identity:
[ ] Are object references intentionally created?
[ ] Are function references intentionally created?
[ ] Does any downstream boundary care about identity?
[ ] Are developers optimizing identity without evidence?

Derived State:
[ ] Is a prop being copied into state?
[ ] If yes, why?
[ ] Are the two values semantically different?
[ ] Is synchronization behavior explicit?

Composition:
[ ] Could children eliminate configuration props?
[ ] Is the component overly configurable?
[ ] Is a component being used as a giant switchboard?
[ ] Would composition provide a cleaner boundary?

60. Completion Checklist — Part 02
You should be able to confidently explain all of the following:
[ ] Define props as component inputs.
[ ] Explain why props are treated as read-only.
[ ] Distinguish props from state.
[ ] Explain ownership boundaries.
[ ] Explain props as per-render inputs.
[ ] Explain why destructuring does not clone objects.
[ ] Explain object reference identity.
[ ] Explain function identity at a conceptual level.
[ ] Design primitive prop contracts.
[ ] Design object prop contracts.
[ ] Design callback prop contracts.
[ ] Explain semantic callback naming.
[ ] Explain callback payload design.
[ ] Explain required vs optional props.
[ ] Explain JavaScript default parameter semantics.
[ ] Distinguish undefined, null, and falsy values.
[ ] Identify boolean-prop explosion.
[ ] Explain prop drilling accurately.
[ ] Explain why prop drilling is not inherently bad.
[ ] Identify implementation leakage.
[ ] Identify setter leakage.
[ ] Identify "god props."
[ ] Identify accidental duplicated state.
[ ] Explain controlled component ownership.
[ ] Explain uncontrolled ownership at a high level.
[ ] Explain object identity across renders.
[ ] Explain callback identity across renders.
[ ] Explain why parent updates produce new child inputs.
[ ] Distinguish pendingProps from committed props conceptually.
[ ] Relate props to Fiber render processing.
[ ] Predict multiple renders involving changed props.
[ ] Predict stale state caused by copied props.
[ ] Audit a component's prop contract.
[ ] Refactor implementation-leaking callbacks.
[ ] Recognize when composition can replace configuration.
[ ] Explain why fewer props does not automatically mean better architecture.
[ ] Defend a component API in a senior-level design review.

61. Final Engineering Principle
A React component should not merely have "props."
It should have a deliberate contract.

The contract should answer:
What does this component need?
↓
Who owns that information?
↓
What can this component request?
↓
Who handles that request?
↓
What is optional?
↓
What are the valid states?
↓
What should be composed rather than configured?

The mature mental model is:
COMPONENT API
│
┌──────────────┼──────────────┐
│              │              │
▼              ▼              ▼
DATA         EVENTS      COMPOSITION
props       callbacks     children
│              │              │
└──────────────┼──────────────┘
               ▼
             RENDER
               │
               ▼
          UI snapshot
               │
               ▼
         Browser commit

The strongest React components do not expose their implementation.
They expose the minimum coherent contract required to express their responsibility.
That is the standard to carry into every subsequent component API decision.

Cross-KPI Boundary
This Part intentionally establishes props, component contracts, ownership, and data/event flow.
It does not attempt to fully cover:
JSX fundamentals — covered in KPI 02.
General TypeScript syntax — covered in Level 05.
Advanced memoization/performance optimization — reserved for the appropriate React performance material.
Concurrent rendering and scheduler internals — Level 07.
Server Components and server/client boundaries — Level 08.
Advanced composition patterns — continued in KPI 03.

Next:
KPI 03 — Part 03 — Children, Composition & Slot-Like Component APIs
