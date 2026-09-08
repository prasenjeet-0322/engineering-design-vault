Level 06 — React Fundamentals
KPI 03 — Components, Props & Composition
PART 03 — Children, Composition & Slot-Like Component APIs
[⬅️ Previous Part](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/02-component-inputs-props-contracts-data-flow.md) | [📚 Level 06 Index](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/README.md) | [🧪 Companion Lab](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/examples/03-children-composition-slots.html) | [Next Part ➡️](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/04-component-communication-and-event-contracts.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models
1. The Core Problem: Configuration vs Composition
A component can be designed in two fundamentally different ways.

Configuration-heavy:
<Card
  title="Account"
  showAvatar
  showActions
  showBadge
  actionLabel="Edit"
  actionPosition="right"
  badgeColor="green"
/>
The component decides almost everything.

Composition-oriented:
<Card>
  <Card.Header>
    <Avatar user={user} />
    <StatusBadge status={user.status} />
  </Card.Header>
  <Card.Body>
    <AccountDetails user={user} />
  </Card.Body>
  <Card.Actions>
    <EditButton userId={user.id} />
  </Card.Actions>
</Card>

Now:
Card
├── owns container structure
├── owns spacing/layout rules
└── accepts content supplied by consumer

The central principle:
Configuration tells a component what to build.
Composition lets the consumer provide what should be inside the component's structural boundary.

2. The children Mental Model
When you write:
<Card>
  <Profile />
</Card>

React conceptually constructs an element whose props include:
{ children: <Profile /> }

So:
<Card>
  <Profile />
</Card>
is conceptually equivalent to:
<Card children={<Profile />} />

The important point is:
children is not special browser behavior. It is a React prop with conventional semantics.

3. The Parent Controls Placement
Consider:
function Card({ children }) {
  return (
    <section className="card">
      <div className="card-content">
        {children}
      </div>
    </section>
  );
}

The consumer provides:
<Card>
  <UserProfile />
</Card>

But Card decides:
where children appear
how they are wrapped
what structural boundary surrounds them
what semantics the container provides

This creates:
Consumer
│
│ content
▼
┌───────────────────────┐
│ Card                  │
│                       │
│ ┌───────────────┐     │
│ │ UserProfile   │     │
│ └───────────────┘     │
│                       │
└───────────────────────┘

4. Composition Is Dependency Injection for UI Structure
A useful mental model:
Configuration
Consumer
│
│ instructions
▼
Component
│
│ builds everything
▼
UI

Composition
Consumer
│
│ supplies UI
▼
Component
│
│ supplies structural context
▼
Composed UI

This resembles dependency injection:
Component owns: structure
Consumer owns: supplied implementation/content

This is why composition can dramatically reduce component complexity.

5. The Component Boundary
A good composition boundary often looks like:
┌─────────────────────────────────────┐
│ Component-owned responsibility      │
│                                     │
│ layout                              │
│ semantics                           │
│ spacing                             │
│ accessibility relationship          │
│ lifecycle of the structure          │
│                                     │
│ ┌─────────────────────┐             │
│ │ Consumer-owned      │             │
│ │ content             │             │
│ └─────────────────────┘             │
│                                     │
└─────────────────────────────────────┘

The component does not need to know every implementation detail of its children.

6. Why Composition Matters at Senior Level
Composition is not merely a React syntax trick.
It is an architectural mechanism for controlling:
coupling
API surface
responsibility
extensibility
reuse
change propagation
test boundaries
ownership
accessibility structure

A component with 25 boolean configuration props often indicates that composition has not been used effectively.

7. The Golden Rule
Prefer composition when consumers need to control structure or content; prefer configuration when the behavior represents a stable, intrinsic property of the component.

Examples:
Button size → configuration
Button disabled → configuration
Card's arbitrary body content → composition
Modal's custom footer → composition
Table's column definitions → configuration/data model
Dashboard's completely custom sidebar → composition

There is no universal "composition always wins" rule.
The responsibility determines the abstraction.

Layer 2 — 🔬 Deep Mechanical Breakdown
8. What Exactly Is children?
Consider:
function App() {
  return (
    <Card>
      <h2>Hello</h2>
    </Card>
  );
}

The JSX describes:
App element
│
▼
Card element props
└── children
    └── h2 element

Conceptually:
{
  type: Card,
  props: {
    children: {
      type: "h2",
      props: { children: "Hello" }
    }
  }
}

The exact internal object shape is implementation-dependent, but the conceptual relationship is stable:
JSX nesting
↓
children prop
↓
receiving component

9. children Can Contain Different Shapes
children is not necessarily one element.
It can conceptually represent:
<Card>
  <Header />
  <Body />
  <Footer />
</Card>
or:
<Card>
  Hello
</Card>
or:
<Card>
  {items.map(item => (
    <Row key={item.id} item={item} />
  ))}
</Card>
or:
<Card>
  {condition && <Badge />}
</Card>

The receiving component should therefore not casually assume:
children.type
or:
children.props
without establishing what shape its API actually accepts.

10. Children Is a Value
Consider:
function Panel({ children }) {
  console.log(children);
  return <section>{children}</section>;
}

The variable:
children
is simply a value supplied through props.
That means ordinary JavaScript reasoning applies.
You can:
receive it
store it temporarily
conditionally render it
pass it elsewhere
compose it with other elements

But you should preserve the semantic ownership of the supplied tree.

11. Children Is Not Automatically "A Component"
This distinction matters.
Given:
<Card>
  <Avatar />
</Card>

children is not:
the Avatar component function
It is a React element description representing an occurrence of that component.
Conceptually:
Avatar source function
│
▼
React element
│
▼
children prop

This connects directly to the distinction established earlier:
component type
React element
Fiber
host DOM node
Do not collapse them.

12. Composition vs Conditional Configuration
Consider this API:
<Modal
  showCloseButton
  showFooter
  footerActions={actions}
  showHeader
  headerTitle="Delete User"
/>

The modal now owns decisions about:
header
footer
actions
close button
title

An alternative:
<Modal>
  <Modal.Header>
    <h2>Delete User</h2>
  </Modal.Header>
  <Modal.Body>
    Are you sure?
  </Modal.Body>
  <Modal.Footer>
    <Button>Cancel</Button>
    <Button>Delete</Button>
  </Modal.Footer>
</Modal>

The component owns the modal boundary.
The consumer owns the content.
This is usually more extensible.

13. Configuration Has a Strength
Do not misunderstand the previous section.
This:
<Button variant="danger" size="large" />
is better than:
<Button>
  <DangerButtonContent />
</Button>
when variant and size are intrinsic dimensions of the button component.
Composition should not replace every prop.
A good architecture distinguishes:
Intrinsic component behavior ↓ configuration
Variable internal content ↓ composition

14. Render Props: Composition Through Functions
Composition does not require only React elements.
A component can accept a function:
<DataProvider>
  {data => (
    <UserList data={data} />
  )}
</DataProvider>

The child function is supplied by the consumer.
The provider controls:
when it calls the function
what data it supplies

The consumer controls:
what UI is produced from that data

Conceptually:
Provider
│
│ data
▼
render function
│
▼
consumer-defined UI

This is often called a render prop.
It is an important historical and still-valid composition technique, although modern React architectures may solve some of these problems with hooks and other mechanisms.

15. Render Prop Mechanical Model
Consider:
function DataProvider({ children }) {
  const data = { name: "Srikar" };
  return children(data);
}

Consumer:
<DataProvider>
  {data => <h2>{data.name}</h2>}
</DataProvider>

The important distinction is:
children
is now:
function
rather than:
React element

Therefore the API contract must explicitly establish:
children must be callable
children receives data
children returns renderable output

This is a much stronger contract than generic children.

16. Render Prop vs Normal Children
Normal composition:
<Card>
  <Profile />
</Card>
The child tree already exists.

Render-prop composition:
<DataProvider>
  {data => <Profile data={data} />}
</DataProvider>
The provider supplies information to a function that creates the child tree.

The direction is:
Normal children: consumer creates UI ↓ component places UI
Render prop: component produces data ↓ consumer function receives data ↓ consumer creates UI

This is a critical conceptual difference.

17. Function-as-Children Is an API Contract
Bad API design:
<Provider>
  {something}
</Provider>
where nobody knows whether:
something
must be:
element
function
string
array

A mature component contract should be explicit.
For example:
type DataProviderProps = {
  children: (data: Data) => ReactNode;
};

TypeScript syntax itself is not the subject here; the architectural principle is:
The more specialized the composition protocol, the more explicit the contract should become.

18. Named Composition Slots
React has no built-in HTML-style slot primitive for ordinary component composition.
But you can model named regions through props.
Example:
<Dialog
  header={<DialogHeader />}
  footer={<DialogFooter />}
>
  <DialogBody />
</Dialog>

Now:
Dialog
├── header
├── children
└── footer

This is effectively a slot-like API.
The props contain React element values.

19. Named Slots vs Boolean Flags
Configuration-heavy:
<Dialog
  showHeader
  showFooter
  headerTitle="Delete"
  footerMode="danger"
/>

Slot-oriented:
<Dialog
  header={<DialogHeader title="Delete" />}
  footer={
    <DialogFooter>
      <Button>Cancel</Button>
      <Button>Delete</Button>
    </DialogFooter>
  }
>
  <DialogBody />
</Dialog>

The latter lets consumers control the actual content.
The dialog still controls:
overlay
focus boundary
container position
modal semantics

This is a powerful separation.

20. Slot APIs Have Costs
Do not assume slots are automatically better.
Consider:
<Page
  header={...}
  sidebar={...}
  toolbar={...}
  body={...}
  footer={...}
  mobileHeader={...}
  mobileSidebar={...}
/>

You may simply have recreated a configuration monster in another form.
The question is:
Does each slot represent a stable structural region of the component?
If not, composition may be over-engineered.

21. Compound Components
A common React composition pattern is:
<Tabs>
  <Tabs.List>
    <Tabs.Trigger value="profile">
      Profile
    </Tabs.Trigger>
    <Tabs.Trigger value="settings">
      Settings
    </Tabs.Trigger>
  </Tabs.List>
  <Tabs.Panel value="profile">
    <Profile />
  </Tabs.Panel>
  <Tabs.Panel value="settings">
    <Settings />
  </Tabs.Panel>
</Tabs>

This gives the consumer control over structure while the parent compound component coordinates behavior.
Conceptually:
Tabs
│
├── List
│   ├── Trigger
│   └── Trigger
├── Panel
└── Panel

This is composition plus a shared behavioral contract.

22. Compound Components Solve a Different Problem
Simple children:
<Card>
  <Content />
</Card>
means:
"Here is content."

Compound components:
<Tabs>
  <Tabs.List />
  <Tabs.Panel />
</Tabs>
mean:
"Here is a structured set of participants in one coordinated component system."

The parent may coordinate them through:
context
shared state
registration
IDs
accessibility relationships
event handling

The exact implementation belongs to the appropriate advanced component-communication material.
The conceptual boundary is what matters here.

23. Composition Preserves Consumer Ownership
Consider:
<Card>
  <UserActions user={user} />
</Card>

Card does not need to know:
which buttons exist
which permission system is used
which API calls happen
which navigation occurs

Card owns the structural contract.
UserActions owns its behavior.

This produces:
Card responsibility
│
├── layout
├── semantics
└── presentation boundary

UserActions responsibility
│
├── actions
├── permissions
└── interaction

This is separation of concerns through composition.

24. Composition Reduces Conditional Branching
Imagine:
function Card({ showAvatar, showBadge, showActions, showFooter, compact, interactive }) {
  return (
    <section>
      {showAvatar && <Avatar />}
      {showBadge && <Badge />}
      ...
    </section>
  );
}

The component accumulates branches.
Over time:
feature A
feature B
feature C
feature D
feature E
create a conditional matrix.

Composition can move those decisions outward:
<Card>
  <Avatar />
  <Badge />
  <Actions />
</Card>

Now the consumer constructs the desired configuration through actual UI structure.

25. But Composition Does Not Eliminate Complexity
You can create a badly composed system too.
Example:
<Card>
  <Header>
    <HeaderLeft>
      <HeaderIcon />
      <HeaderTitle />
      <HeaderBadge />
    </HeaderLeft>
    <HeaderRight>
      <HeaderMenu>
        ...
      </HeaderMenu>
    </HeaderRight>
  </Header>
</Card>

If every tiny visual fragment becomes a component, the abstraction graph becomes harder to understand.
This is component fragmentation.
The goal is not maximum component count.
The goal is:
Meaningful responsibility boundaries.

26. Render-by-Render Prediction #1 — Children Identity
Consider:
function App() {
  const [count, setCount] = useState(0);
  return (
    <Card>
      <span>{count}</span>
    </Card>
  );
}

Render #1:
App state = 0
Card element
└── children
    └── span element
        └── "0"

After:
setCount(1);

Render #2:
App state = 1
Card element
└── children
    └── span element
        └── "1"

The child content is regenerated as part of the new render output.
React then reconciles the resulting tree.
The important model:
JSX source ↓ element descriptions ↓ new render tree ↓ reconciliation
Not:
JSX magically mutates the DOM

27. Render-by-Render Prediction #2 — Parent Owns Structure
function Card({ children }) {
  return (
    <section>
      <header>Account</header>
      <main>{children}</main>
    </section>
  );
}

Consumer:
<Card>
  <UserProfile />
</Card>

The resulting conceptual structure is:
Card
├── header
│   └── "Account"
└── main
    └── UserProfile

The consumer does not determine that the content belongs inside <main>.
Card does.
That is the component's structural responsibility.

28. Render-by-Render Prediction #3 — Named Slot
function Dialog({ header, footer, children }) {
  return (
    <section>
      <header>{header}</header>
      <main>{children}</main>
      <footer>{footer}</footer>
    </section>
  );
}

Consumer:
<Dialog
  header={<h2>Delete User</h2>}
  footer={<button>Delete</button>}
>
  <p>Are you sure?</p>
</Dialog>

Conceptually:
Dialog props
├── header → h2 element
├── children → p element
└── footer → button element

The dialog controls placement.
The consumer controls content.

29. Render-by-Render Prediction #4 — Function Child
function Provider({ children }) {
  const value = 10;
  return children(value);
}

Consumer:
<Provider>
  {value => <span>{value}</span>}
</Provider>

Execution:
Provider render
↓
value = 10
↓
children is function
↓
children(10)
↓
<span>10</span>

This is fundamentally different from:
<section>{children}</section>
because the receiving component is executing consumer-supplied code.
That makes the API contract more powerful—and more important to define carefully.

30. Composition and Closures
Consider:
function App() {
  const [user, setUser] = useState(...);
  return (
    <Card>
      <UserActions user={user} />
    </Card>
  );
}

The UserActions element is created within the parent's render environment.
Therefore values used to construct it can originate from that render's snapshot.
This connects composition to React's broader render model:
Render snapshot
│
├── state values
├── props
├── closures
└── JSX construction
│
▼
React elements

Composition does not bypass render semantics.

31. Composition and Ownership
Suppose:
function Dashboard({ user }) {
  return (
    <Shell>
      <Sidebar>
        <UserMenu user={user} />
      </Sidebar>
    </Shell>
  );
}

Ask:
Who owns user?
Potential answer:
Dashboard's parent/state owner.
Who owns sidebar structure?
Sidebar.
Who owns user-menu behavior?
UserMenu.

Composition lets these responsibilities coexist without forcing Shell to understand user.

32. Composition vs Prop Drilling
Compare:
function App({ user }) {
  return (
    <Shell user={user}>
      <Sidebar user={user}>
        <UserMenu user={user} />
      </Sidebar>
    </Shell>
  );
}
with:
function App({ user }) {
  return (
    <Shell>
      <Sidebar>
        <UserMenu user={user} />
      </Sidebar>
    </Shell>
  );
}

The second version uses composition to prevent intermediate components from becoming data transport layers.
The key idea:
If intermediate component does not need the data, do not make it responsible for forwarding the data.
This is one of composition's most useful architectural properties.

33. The "Pass JSX Instead" Pattern
Instead of:
function Layout({ user, showUserMenu }) {
  return (
    <aside>
      {showUserMenu && <UserMenu user={user} />}
    </aside>
  );
}

you can sometimes use:
function Layout({ sidebar }) {
  return (
    <aside>
      {sidebar}
    </aside>
  );
}

Consumer:
<Layout sidebar={<UserMenu user={user} />} />

Now Layout knows:
there is sidebar content
but does not know:
what user system produced it

This is a clean dependency boundary.

34. But JSX Props Can Hide Dependencies
This pattern:
<Layout sidebar={<UserMenu user={user} />} />
is powerful.
But it can make data dependencies less visible when overused.
Compare:
<Layout user={user} onLogout={onLogout} />
versus:
<Layout
  sidebar={
    <UserMenu user={user} onLogout={onLogout} />
  }
/>

The second has stronger structural separation but can make debugging ownership less obvious if nesting becomes extreme.
Again:
Composition is a tool, not a religion.

35. Anti-Pattern Teardown #1 — Boolean Feature Matrix
Flawed:
<Panel
  showHeader
  showFooter
  showAvatar
  showActions
  showBadge
  showMetadata
/>

Why developers do it:
They want one reusable component.

Mechanical failure:
The component becomes a conditional orchestration engine.
2^6 = 64
possible boolean combinations exist.
Most combinations were probably never designed intentionally.

Refactor:
Use composition:
<Panel>
  <Panel.Header>
    <Avatar />
    <Badge />
  </Panel.Header>
  <Panel.Body>
    <Metadata />
  </Panel.Body>
  <Panel.Footer>
    <Actions />
  </Panel.Footer>
</Panel>

36. Anti-Pattern Teardown #2 — Configuration Instead of Content
Flawed:
<Modal
  title="Delete"
  body="Are you sure?"
  confirmLabel="Delete"
  cancelLabel="Cancel"
  danger
/>

This can work for simple primitives.
But as requirements evolve:
rich body
links
icons
multiple actions
loading state
custom warnings
permission messages
the prop API expands.

Composition:
<Modal>
  <Modal.Header>
    <h2>Delete</h2>
  </Modal.Header>
  <Modal.Body>
    <WarningMessage />
    <p>Are you sure?</p>
  </Modal.Body>
  <Modal.Footer>
    <Button>Cancel</Button>
    <Button variant="danger">Delete</Button>
  </Modal.Footer>
</Modal>

The structural component remains stable.

37. Anti-Pattern Teardown #3 — Blind Slot Explosion
Flawed:
<Page
  topLeft={...}
  topCenter={...}
  topRight={...}
  middleLeft={...}
  middleCenter={...}
  middleRight={...}
  bottomLeft={...}
  bottomCenter={...}
  bottomRight={...}
/>

Failure:
The component has become a coordinate system.

Better:
If the structure is genuinely arbitrary:
<Page>
  <CustomLayout />
</Page>

If the regions are semantically stable:
<Page>
  <Page.Header />
  <Page.Main />
  <Page.Footer />
</Page>

Use the simplest stable abstraction.

38. Anti-Pattern Teardown #4 — Component Fragmentation
Flawed:
Card
└── CardContainer
    └── CardWrapper
        └── CardContentWrapper
            └── CardInner
                └── CardBody

when every component exists only to forward:
className
children

Failure:
Abstraction cost exceeds responsibility value.

Senior refactor:
Collapse meaningless boundaries.
Keep boundaries that represent:
ownership
behavior
semantic structure
reuse
testing boundary
domain responsibility

39. Anti-Pattern Teardown #5 — Function Children Without a Real Need
Flawed:
<Container>
  {() => <UserCard user={user} />}
</Container>
where Container does nothing with the function except call it immediately.

Failure:
The API is more complex than necessary.

Prefer:
<Container>
  <UserCard user={user} />
</Container>

Use render props when the receiving component genuinely provides information or control to the render function.

40. Anti-Pattern Teardown #6 — Children as an Escape Hatch for Everything
A component can become meaningless:
function Everything({ children }) {
  return <>{children}</>;
}

If it provides no:
structure
behavior
semantics
styling boundary
coordination
ownership
then the abstraction may add no value.
Composition is useful because the receiving component contributes something meaningful.

Layer 3 — 🧪 Diagnostic Labs & DevTools Profiling
41. Lab A — Inspect the Children Prop
Create:
function DebugContainer({ children }) {
  console.log("children:", children);
  return <section>{children}</section>;
}

Try:
<DebugContainer>
  <h2>Hello</h2>
</DebugContainer>

Then:
<DebugContainer>
  <h2>Hello</h2>
  <p>World</p>
</DebugContainer>

Then:
<DebugContainer>
  Hello
</DebugContainer>

Observe the different runtime values.
The goal is to break the false mental model:
children = always one component

42. Lab B — Compare Configuration and Composition
Build two versions.
Version A:
<Card
  showHeader
  showFooter
  title="Profile"
  footerActions={<Actions />}
/>

Version B:
<Card>
  <Card.Header>
    <h2>Profile</h2>
  </Card.Header>
  <Card.Body>
    <Profile />
  </Card.Body>
  <Card.Footer>
    <Actions />
  </Card.Footer>
</Card>

Use React DevTools to inspect:
component tree
props
render behavior
ownership

Then ask:
Which component knows too much?
Which API is easier to extend?
Which API has clearer responsibilities?

43. Lab C — Render-Prop Execution
Create:
function Provider({ children }) {
  const value = 42;
  console.log("Provider render");
  return children(value);
}

Consumer:
<Provider>
  {value => {
    console.log("Consumer render function", value);
    return <div>{value}</div>;
  }}
</Provider>

Observe:
Provider render
↓
children(value)
↓
consumer function executes
↓
React element returned

This makes function-as-children mechanically visible.

44. Lab D — Prop Drilling vs Composition
Build:
App └── Layout └── Sidebar └── UserMenu

First implementation:
<Layout user={user}>
  <Sidebar user={user}>
    <UserMenu user={user} />
  </Sidebar>
</Layout>

Second:
<Layout>
  <Sidebar>
    <UserMenu user={user} />
  </Sidebar>
</Layout>

Use React DevTools.
Ask:
Does Layout need user?
Does Sidebar need user?
Which components actually depend on user?

The answer determines the better contract.

45. Lab E — Component Tree vs DOM Tree
Create:
<Card>
  <UserProfile />
</Card>

Then inspect:
React DevTools component tree
Chrome Elements DOM tree

Compare them.
Remember:
React component tree ≠ DOM tree
Composition operates primarily at the React component/element level.
The browser ultimately receives host output after React's rendering and commit process.

46. Production Incident Runbook — Configuration Explosion
Symptom:
A component has:
15+ props
many booleans
nested configuration objects
many conditional branches

Step 1 — Categorize props
[ ] intrinsic behavior
[ ] styling
[ ] content
[ ] events
[ ] structure
[ ] implementation detail

Step 2:
Find props representing content:
title
body
footer
header
actions
sidebar
Ask whether these should become composition boundaries.

Step 3:
Find boolean combinations.

Step 4:
Calculate conceptual state combinations.

Step 5:
Identify stable structural regions.

Step 6:
Prototype composition.

Step 7:
Compare API complexity.

Do not refactor simply because composition looks "more React-like."
Refactor because the ownership and responsibility model becomes clearer.

47. Production Incident Runbook — Deep Prop Drilling
Symptom:
A value travels through many components that do not consume it.
A ↓ B ↓ C ↓ D ↓ E

Step 1:
Identify actual consumer.

Step 2:
Identify components that genuinely need the value.

Step 3:
Use composition to bypass transport layers where appropriate.

Step 4:
If many independent branches need the value, evaluate a shared state/context boundary.

Step 5:
Do not introduce global state merely because two intermediate props exist.

48. Production Incident Runbook — Over-Composed UI
Symptom:
A simple component requires:
5 nested wrapper components
10 compound components
multiple slot props
render functions

Step 1:
List what each abstraction contributes.

Step 2:
Delete boundaries that contribute nothing.

Step 3:
Keep boundaries that represent:
semantic structure
behavior
ownership
coordination
reusability

Step 4:
Prefer the simplest contract that preserves the intended flexibility.

Layer 4 — 🔥 The Crucible
49. Senior Design Challenge #1
You have:
<Dialog
  title="Delete Account"
  body="This cannot be undone."
  showWarning
  warningText="Permanent deletion"
  showCancel
  showConfirm
  confirmText="Delete"
  confirmDanger
/>

Requirements change frequently.
Design a composition-oriented API.

A strong answer should move toward:
<Dialog>
  <Dialog.Header>
    <h2>Delete Account</h2>
  </Dialog.Header>
  <Dialog.Body>
    <Warning />
    <p>This cannot be undone.</p>
  </Dialog.Body>
  <Dialog.Footer>
    <Button>Cancel</Button>
    <Button variant="danger">Delete</Button>
  </Dialog.Footer>
</Dialog>

The key reasoning:
Dialog owns modal mechanics.
Consumer owns dialog content.

50. Senior Design Challenge #2
Given:
<Layout
  user={user}
  notifications={notifications}
  permissions={permissions}
/>
but only the nested UserMenu and NotificationBell need those values.
Redesign.

Potential direction:
<Layout>
  <Header>
    <UserMenu user={user} permissions={permissions} />
    <NotificationBell notifications={notifications} />
  </Header>
</Layout>

Now:
Layout
does not need to understand those domain objects.

51. Senior Design Challenge #3
Should this be composition or configuration?
<Button variant="danger" size="large" />

Answer:
configuration

Why?
Because:
variant
size
are intrinsic dimensions of the Button API.

Now:
<Card footer={<CustomFooter />} />

Answer:
composition
because the consumer controls arbitrary content inside a structural region.

52. Senior Design Challenge #4
Is this a good render-prop API?
<UserProvider>
  {user => (
    <UserCard user={user} />
  )}
</UserProvider>

Potentially yes.
But ask:
Does UserProvider actually own/provide user data?
Does consumer need render-time access?
Would another composition mechanism communicate the relationship more clearly?

Do not judge an API solely by syntax.
Judge its data and ownership model.

53. Senior Design Challenge #5 — Compound Component
Design:
<Tabs>
  <Tabs.List />
  <Tabs.Panel />
</Tabs>

What must the architecture establish?
At minimum:
Tabs owns shared tab state
Tabs.List participates in that state
Tabs.Panel participates in that state
Triggers identify panels
Accessibility relationships remain coherent
Consumer controls structure

The point is not memorizing a particular implementation.
The point is understanding why compound components exist.

54. Decision Matrix — Configuration vs Composition
Requirement | Preferred mechanism
--- | ---
Small finite visual variant | Prop
Size/density | Prop
Disabled/loading state | Prop
Arbitrary body content | Composition
Custom footer | Composition
Custom header | Composition
Consumer-defined actions | Composition
Stable semantic mode | Prop
Consumer-defined structure | Composition
Shared coordinated child behavior | Compound components
Component provides data to consumer's rendering | Render prop where appropriate
Arbitrary named structural region | Slot-like prop
One-off primitive wrapper | Avoid unnecessary abstraction

55. Senior Interview Gotchas
Gotcha 1 — Is children special?
It is conventional React API behavior represented as a prop.

Gotcha 2 — Is children always one element?
No.
It may represent:
one element
multiple children
text
arrays
conditional output
other renderable values
The contract determines what is valid.

Gotcha 3 — Is composition always better than props?
No.
Configuration is excellent for stable intrinsic component dimensions.

Gotcha 4 — Are slot props built into React?
No universal slot primitive is required. React composition can model named slots using props containing renderable values.

Gotcha 5 — Is a render prop the same as normal children?
No.
Normal children are supplied values.
A render prop is a callable contract through which the component supplies information/control to consumer-defined rendering logic.

Gotcha 6 — Should every component use compound components?
No.
Compound components add coordination complexity and should solve an actual structured interaction problem.

Gotcha 7 — Does composition eliminate prop drilling?
Not universally.
It can bypass intermediate transport components, but it does not replace every state-sharing mechanism.

Gotcha 8 — Is more composition always more reusable?
No.
Over-composition can create:
API complexity
cognitive overhead
fragmentation
debugging difficulty

56. Final Render Prediction
Consider:
function App() {
  const [count, setCount] = useState(0);
  return (
    <Panel
      header={<h2>Count</h2>}
      footer={
        <button onClick={() => setCount(c => c + 1)}>
          Increment
        </button>
      }
    >
      <span>{count}</span>
    </Panel>
  );
}

function Panel({ header, children, footer }) {
  return (
    <section>
      <header>{header}</header>
      <main>{children}</main>
      <footer>{footer}</footer>
    </section>
  );
}

Render #1
App state:
count = 0

Elements conceptually:
Panel
├── header
│   └── h2("Count")
├── children
│   └── span("0")
└── footer
    └── button

Panel renders:
section
├── header
│   └── h2
├── main
│   └── span("0")
└── footer
    └── button

Click
The callback supplied to the button executes:
setCount(c => c + 1)
Parent state becomes:
count = 1

Render #2
App creates a new render tree:
Panel
├── header
│   └── h2("Count")
├── children
│   └── span("1")
└── footer
    └── button

Panel receives those inputs and produces:
section
├── header
│   └── h2
├── main
│   └── span("1")
└── footer
    └── button

Reconciliation determines what host output needs to change.
The browser-visible text changes:
0 → 1

The architecture remains:
App owns count
Panel owns structural layout
Consumer owns supplied content

That is the central composition model.

57. The Deepest Mental Model
A component can be thought of as a structural boundary with an input contract.
Props can provide:
data
behavior
configuration
elements
functions
children

Composition specifically lets consumers provide parts of the resulting UI structure.

COMPONENT
│
┌─────────┴─────────┐
│                   │
owns structure     accepts inputs
│                   │
┌──────┼──────┐     ┌─────┼─────┐
▼      ▼      ▼     ▼     ▼     ▼
layout semantic slots data events content
│
▼
render
│
▼
React tree
│
▼
reconciliation
│
▼
commit

The mature question is therefore not:
"Should I use props or children?"
It is:
"Which part of this UI does this component own, and which part should remain under the consumer's control?"

That question scales from a tiny card to a design system.

58. Production Architecture Principle
A component becomes more robust when its contract separates:
INTRINSIC RESPONSIBILITY
↓
props/configuration

CONSUMER-OWNED CONTENT
↓
composition

CONSUMER-REQUESTED BEHAVIOR
↓
callbacks

SHARED COORDINATED STRUCTURE
↓
compound component architecture

This produces a useful architecture:
┌────────────────────┐
│ Component Boundary │
└─────────┬──────────┘
          │
  ┌───────┼───────┐
  ▼       ▼       ▼
Configure Compose Communicate
props   children callbacks
  │       │       │
  └───────┼───────┘
          ▼
        Render

The goal is not to make every component maximally flexible.
The goal is to make every component flexible at the correct boundary.

59. Completion Checklist — Part 03
You should now be able to:
[ ] Explain children as a prop.
[ ] Explain what JSX nesting produces conceptually.
[ ] Distinguish children from component types.
[ ] Explain why children can have different shapes.
[ ] Explain composition as an architectural mechanism.
[ ] Distinguish configuration from composition.
[ ] Identify intrinsic component configuration.
[ ] Identify consumer-owned UI structure.
[ ] Design a basic children API.
[ ] Design named slot-like APIs.
[ ] Explain the trade-offs of slot APIs.
[ ] Explain function-as-children.
[ ] Explain render props mechanically.
[ ] Distinguish render props from ordinary children.
[ ] Explain why function children require a specialized contract.
[ ] Explain compound components conceptually.
[ ] Explain why compound components need coordination.
[ ] Explain how composition can reduce prop drilling.
[ ] Identify unnecessary prop transport layers.
[ ] Identify configuration-heavy component APIs.
[ ] Identify boolean feature matrices.
[ ] Refactor configuration-heavy components into composition.
[ ] Recognize over-composition.
[ ] Recognize component fragmentation.
[ ] Explain why composition does not automatically improve architecture.
[ ] Design a dialog using composition.
[ ] Design a layout using composition.
[ ] Design a basic compound component API.
[ ] Predict children across multiple renders.
[ ] Predict function-as-children execution.
[ ] Reason about ownership across composed components.
[ ] Distinguish React component trees from DOM trees.
[ ] Use React DevTools to inspect composition boundaries.
[ ] Diagnose configuration explosion.
[ ] Diagnose over-composition.
[ ] Defend a composition decision in a senior design review.
[ ] Explain the principle: flexibility belongs at the correct boundary.

60. Final Crucible
You are reviewing this production API:
<Dashboard
  user={user}
  showSidebar
  sidebarMode="admin"
  showHeader
  headerTitle="Users"
  showSearch
  searchPlaceholder="Search users"
  showFilters
  filters={filters}
  showToolbar
  toolbarActions={actions}
  showFooter
  footerContent={footer}
/>

Your task is to identify:
1. Which props are intrinsic configuration?
2. Which props represent consumer-owned content?
3. Which props represent behavior?
4. Which props could become composition boundaries?
5. Which props indicate implementation leakage?
6. Which combinations create state-space complexity?
7. Which structure should Dashboard own?
8. Which structure should consumers provide?

A possible architectural direction:
<Dashboard>
  <Dashboard.Header>
    <PageTitle>User Management</PageTitle>
    <SearchBox />
  </Dashboard.Header>
  <Dashboard.Sidebar>
    <Filters />
  </Dashboard.Sidebar>
  <Dashboard.Main>
    <UserTable />
  </Dashboard.Main>
  <Dashboard.Footer>
    <Pagination />
  </Dashboard.Footer>
</Dashboard>

But do not blindly copy this solution.
The correct architecture depends on whether:
Header
Sidebar
Main
Footer
are genuinely stable structural regions.
The actual senior-level skill is being able to defend the boundary.

61. Part 03 Completion Standard
This Part is complete when you can look at an unfamiliar component API and immediately reason:
What does this component own?
What does the consumer own?
What should be configured?
What should be composed?
What should be communicated through callbacks?
Where is the structural boundary?
Where is the data boundary?
Where is the behavior boundary?

At senior level, React composition is no longer:
"Use children because React supports children."
It becomes:
Ownership ↓ Boundary ↓ Contract ↓ Composition ↓ Controlled extensibility

That is the architectural purpose of composition.

Cross-KPI Boundary
This Part establishes:
children
composition
configuration vs composition
slot-like APIs
render props
function-as-children
compound component concepts
composition as a way to control ownership and coupling
composition-based prop-drilling reduction

It intentionally does not deeply implement:
advanced Context mechanics
reducer/state-machine architecture
advanced compound-component internals
imperative handles
ref forwarding internals
advanced event architecture
memoization and rendering optimization
concurrent rendering
Server Components

Those belong to later React material.

Next Part:
KPI 03 — Part 04 — Component Communication & Event Contracts
