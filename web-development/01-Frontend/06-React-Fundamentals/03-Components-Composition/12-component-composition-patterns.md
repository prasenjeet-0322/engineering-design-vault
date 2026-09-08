Level 06 — React Fundamentals
KPI 03 — Components, Props & Composition
PART 12 — Component Composition Patterns
[⬅️ Previous Part](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/11-context-state-distribution.md) | [📚 Level 06 Index](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/README.md) | [🧪 Companion Lab](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/examples/12-component-composition-patterns.html) | [Next Part ➡️](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/13-component-reuse-and-abstraction.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models
1. The Core Problem
As React applications grow, components need to cooperate without becoming tightly coupled.
A weak architecture often evolves like this:
Parent
├── 15 configuration props
├── 8 boolean flags
├── 5 callbacks
├── 3 context dependencies
└── complicated conditional rendering

The component technically works.
The architecture does not.

Composition provides another mechanism:
Instead of:
<Dialog
  title="Delete account"
  showIcon
  showFooter
  footerButtons={...}
  variant="danger"
  ...
/>

Prefer:
<Dialog>
  <Dialog.Header>
    <DeleteIcon />
    <Dialog.Title>Delete account</Dialog.Title>
  </Dialog.Header>
  <Dialog.Body>
    ...
  </Dialog.Body>
  <Dialog.Footer>
    ...
  </Dialog.Footer>
</Dialog>

The parent supplies structure.
The component owns the behavior and boundary.
That is the fundamental idea.

2. Core Composition Model
COMPOSITION
│
▼
┌──────────────────────┐
│ Parent owns context  │
│ and domain meaning   │
└──────────┬───────────┘
           │
  supplies │
           ▼
┌──────────────────────┐
│   Child / Slot /     │
│  Element / Function  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Component decides   │
│  WHERE content lives │
│  and WHAT behavior   │
│     it controls      │
└──────────────────────┘

Composition is therefore not merely:
"Passing children."
It is a mechanism for transferring structural control without transferring implementation ownership.

3. The Most Important Mental Model
Composition = Inversion of Control for UI Structure

Without composition:
Component owns:
layout
content
conditional rendering
specific domain decisions
visual variations
behavior

With composition:
Component owns:
layout contract
behavior
interaction boundary
structural guarantees

Parent owns:
specific content
domain meaning
specific child arrangement

The component exposes a controlled structural surface.
The caller supplies the content.

4. Executive Concept Table
Concept | Core Mechanism | Production Impact | Common Senior Trap
--- | --- | --- | ---
children | Element content passed through props.children | Simple structural composition | Treating children as magical
Element prop | Parent supplies an already-created element | Flexible slot-like API | Passing too many arbitrary elements
Named slot | Explicit props such as header, footer, actions | Clear structural API | Turning every visual region into a prop
Render function | Component invokes caller-provided function | Caller controls rendering while component controls data/behavior | Using it where ordinary composition is enough
Compound component | Related components cooperate around a shared conceptual API | Expressive APIs | Building unnecessary implicit machinery
Inversion of control | Caller supplies part of structure/behavior | Reduces configuration explosion | Moving too much ownership outward
Layout component | Component owns placement, caller owns content | Reusable structural primitives | Over-generalizing layout
Headless composition | Behavior/state separated from rendering | Flexible reusable behavior | Premature abstraction
Composition over inheritance | Assemble behavior structurally | React-native extensibility model | Assuming composition always wins
Slot API | Explicit insertion points | Predictable component architecture | Creating an unbounded slot surface
Boolean explosion | Many flags encode structural combinations | API complexity grows combinatorially | Fixing it by adding more flags
Wrapper component | Structural component surrounds content | Can isolate layout/behavior | Wrapper proliferation

5. Golden Rule
Use composition when callers need control over structure, while the component should continue owning the behavior, layout contract, or interaction boundary.

And the companion rule:
Do not use composition merely to avoid writing a prop. Use it when structural ownership genuinely belongs with the caller.

Layer 2 — 🔬 Deep Mechanical Breakdown
6. What Composition Actually Means in React
Consider:
function Card({ children }) {
  return (
    <section className="card">
      {children}
    </section>
  );
}

And:
<Card>
  <h2>Account</h2>
  <p>Account information</p>
</Card>

The JSX does not directly place the <h2> inside the DOM.
Conceptually:
<Card>
│
└── React element
    ├── type = Card
    └── props
        └── children
            │
            ├── React element: h2
            └── React element: p

The Card component receives those element descriptions.
During rendering:
Card(props)
│
▼
<section className="card">
  {props.children}
</section>

React then reconciles the resulting element tree.
The browser ultimately receives host mutations corresponding to the committed result.
The important ownership distinction is:
Caller owns: "What content should be inside?"
Card owns: "Where does that content appear?"

7. children Is Just a Prop
This is fundamental.
These are conceptually equivalent:
<Card>
  <Profile />
</Card>
and:
<Card children={<Profile />} />

children does not represent:
DOM children
a special browser mechanism
automatically rendered HTML
a portal
a lifecycle boundary

It is a React prop containing whatever child value the caller supplied.
That value may be:
<Card> text </Card>
or:
<Card> <Profile /> </Card>
or:
<Card>
  <>
    <Header />
    <Body />
  </>
</Card>
or even:
<Card>
  {condition ? <A /> : <B />}
</Card>

The component decides how to consume it.

8. Composition Does Not Mean the Child Owns the Parent
Consider:
function Panel({ children }) {
  return (
    <section className="panel">
      {children}
    </section>
  );
}

The caller supplies content:
<Panel>
  <AccountDetails />
</Panel>

But Panel still controls:
<section>
  └── AccountDetails

The caller does not control the implementation of:
<section className="panel">
unless the API explicitly allows it.
This distinction is important.
Composition creates controlled extensibility.

9. Composition Versus Configuration
Consider this API:
<Modal
  title="Delete account"
  titleIcon="warning"
  showCloseButton
  closeOnBackdrop
  showFooter
  footerAlign="right"
  primaryButtonText="Delete"
  primaryButtonVariant="danger"
  secondaryButtonText="Cancel"
/>

This looks convenient.
But the API is encoding a large number of structural and visual decisions.
Now compare:
<Modal>
  <Modal.Header>
    <WarningIcon />
    <Modal.Title>Delete account</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    Are you sure?
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary">
      Cancel
    </Button>
    <Button variant="danger">
      Delete
    </Button>
  </Modal.Footer>
</Modal>

The second API exposes structure directly.
The caller can express:
Header
Body
Footer
without requiring the Modal API to anticipate every possible combination.

10. Boolean Prop Explosion
A common component evolution path:

Version 1:
<Card title="Profile" />

Version 2:
<Card title="Profile" showIcon />

Version 3:
<Card title="Profile" showIcon showActions />

Version 4:
<Card title="Profile" showIcon showActions showDivider compact elevated />

Version 5:
<Card
  title="Profile"
  showIcon
  showActions
  showDivider
  compact
  elevated
  actionPosition="right"
  iconPosition="left"
  footerAlignment="end"
/>

The component has become a configuration language.
At some point:
boolean/configuration API
│
▼ combinatorial growth
│
▼ conditional rendering
│
▼ giant component

Composition can collapse that complexity.

11. The Structural Alternative
Instead:
<Card>
  <Card.Header>
    <Card.Icon>
      <UserIcon />
    </Card.Icon>
    <Card.Title>
      Profile
    </Card.Title>
    <Card.Actions>
      <EditButton />
    </Card.Actions>
  </Card.Header>
  <Card.Body>
    <ProfileDetails />
  </Card.Body>
</Card>

Now callers express the structure directly.
The component does not need:
showIcon
showActions
showDivider
title
icon
actionPosition
for every variation.

12. Named Slots
A simpler pattern is explicit element props:
function PageSection({
  header,
  actions,
  children,
}) {
  return (
    <section>
      <header>
        <div>{header}</div>
        <div>{actions}</div>
      </header>
      <main>
        {children}
      </main>
    </section>
  );
}

Usage:
<PageSection
  header={<h2>Users</h2>}
  actions={<CreateUserButton />}
>
  <UserTable />
</PageSection>

Conceptually:
PageSection
├── header ← caller supplied
├── actions ← caller supplied
└── children ← caller supplied

This is often called a slot pattern.
The component owns the slots.
The caller owns their content.

13. children Versus Named Slots
Use children when there is one primary content region:
<Panel>
  <UserProfile />
</Panel>

Use named slots when the component has meaningful structural regions:
<PageSection
  header={<Heading />}
  actions={<Actions />}
>
  <Table />
</PageSection>

A useful decision rule:
One primary content region ↓ children
Multiple semantically distinct regions ↓ named slots

Do not mechanically create slots for every <div>.

14. Element Props
Another pattern:
function EmptyState({
  illustration,
  title,
  description,
  action,
}) {
  return (
    <section>
      {illustration}
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </section>
  );
}

Usage:
<EmptyState
  illustration={<EmptyBox />}
  title="No projects"
  description="Create your first project."
  action={<CreateProjectButton />}
/>

This is structurally expressive.
However, there is a boundary:
Too few slots ↓ component becomes rigid
Too many slots ↓ component becomes configuration infrastructure

The API should expose meaningful extension points, not every possible DOM location.

15. Passing Components Versus Passing Elements
These are different APIs.

Element:
<Panel header={<Header title="Users" />} />
The caller creates an element.
The panel receives that element description.

Component type:
<Panel Header={Header} />
The panel receives a component type and decides how to instantiate it.
function Panel({ Header }) {
  return (
    <section>
      <Header />
    </section>
  );
}

These imply different ownership.

Element:
Caller controls: props + element creation
Panel controls: placement

Component type:
Caller controls: which component type
Panel controls: when/how it is instantiated + props

This difference matters when designing APIs.

16. Why Element Props Can Be More Flexible
Suppose:
function Dialog({ footer }) {
  return (
    <div className="dialog">
      ...
      <footer>
        {footer}
      </footer>
    </div>
  );
}

The caller can provide:
<Dialog
  footer={
    <>
      <Button>Cancel</Button>
      <Button>Save</Button>
    </>
  }
/>

The dialog does not need to know:
how many buttons
which button type
what labels
which business action
That information remains with the caller.

17. Composition and Inversion of Control
Traditional configuration:
Caller
│
│ configuration
▼
Component
│
├── decides structure
├── decides rendering
└── decides content

Composition:
Caller
│
│ supplies content
▼
Component
│
├── controls boundary
├── controls layout contract
└── inserts caller content

The caller has gained structural control.
This is inversion of control.
The component no longer needs to know every possible content variant.

18. Composition Is Not "Less Code"
This is a common misconception.
Compare:
<Card
  compact
  showHeader
  showIcon
  showActions
  footerMode="actions"
  bodyPadding="small"
/>
with:
<Card>
  <Card.Header>
    <Icon />
    <Title />
    <Actions />
  </Card.Header>
  <Card.Body>
    ...
  </Card.Body>
</Card>

The second may contain more JSX.
That is acceptable.
The objective is not minimum characters.
The objective is:
clear ownership + explicit structure + stable contracts + controlled coupling

19. Composition and State Ownership
Composition becomes particularly powerful when state and structure have different ownership requirements.

Example:
function Accordion({ children }) {
  const [openId, setOpenId] = useState(null);

  return (
    <div>
      {children}
    </div>
  );
}

The caller can provide:
<Accordion>
  <Accordion.Item id="profile">
    <Profile />
  </Accordion.Item>
  <Accordion.Item id="security">
    <Security />
  </Accordion.Item>
</Accordion>

Conceptually:
Accordion
├── owns accordion behavior/state
│
└── composes caller-provided content

This separates:
behavior ownership
from:
content ownership
That is a powerful architectural pattern.

20. Compound Components
A compound component API groups related components around a shared conceptual abstraction.

Example:
<Tabs>
  <Tabs.List>
    <Tabs.Tab value="overview">
      Overview
    </Tabs.Tab>
    <Tabs.Tab value="activity">
      Activity
    </Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="overview">
    <Overview />
  </Tabs.Panel>
  <Tabs.Panel value="activity">
    <Activity />
  </Tabs.Panel>
</Tabs>

The API communicates a domain model:
Tabs
├── List
├── Tab
├── Panel
└── shared conceptual behavior

This is often easier to understand than:
<Tabs
  tabs={[
    {
      id: "overview",
      label: "Overview",
      render: () => <Overview />,
    },
    ...
  ]}
/>

The compound API exposes the structure.

21. Why Compound APIs Are Powerful
The caller can see the UI architecture directly:
<Tabs>
  <Tabs.List>...</Tabs.List>
  <Tabs.Panel>...</Tabs.Panel>
</Tabs>

Instead of encoding structure indirectly:
<Tabs
  tabs={...}
  renderTab={...}
  renderPanel={...}
  ...
/>

This can improve:
readability
extensibility
local reasoning
semantic structure
API discoverability

But it introduces a new responsibility:
The compound components must still have a coherent ownership model.

22. Compound Components Are Not Automatically Better
Bad:
<Tabs>
  <Tabs.FancyLeftHeader />
  <Tabs.FancyCenterHeader />
  <Tabs.FancyRightHeader />
  <Tabs.SpecialPanel />
  <Tabs.AlternativePanel />
  <Tabs.LegacyPanel />
</Tabs>

The API has become a namespace for every possible variation.
That is not composition excellence.
It is API accumulation.

Good composition has:
small conceptual vocabulary + strong invariants + clear ownership

23. Context and Composition
Part 11 established:
Context distributes dependencies.
Composition can sometimes eliminate the need for Context.

Consider a deeply nested component:
<App>
  <Layout>
    <Sidebar>
      <UserMenu />
    </Sidebar>
  </Layout>
</App>

If UserMenu needs some UI supplied by App, one solution may be Context.
But another is:
<App>
  <Layout
    sidebar={
      <Sidebar>
        <UserMenu />
      </Sidebar>
    }
  />
</App>

Or:
<Layout>
  <Layout.Sidebar>
    <UserMenu />
  </Layout.Sidebar>
</Layout>

Composition allows dependencies to be passed structurally rather than globally distributed.

24. Composition Versus Prop Drilling
Suppose:
App
↓
Page
↓
Layout
↓
Sidebar
↓
UserMenu

And every intermediate component receives:
user
only to forward it.
That is classic prop relay.

Composition can change the ownership graph.
Instead of:
<Page user={user}>
  <Layout user={user}>
    <Sidebar user={user}>
      <UserMenu user={user} />
    </Sidebar>
  </Layout>
</Page>

the parent can construct the actual content:
<Page
  sidebar={
    <Sidebar>
      <UserMenu user={user} />
    </Sidebar>
  }
/>

Now:
Page
│
└── supplied sidebar subtree
    │
    └── UserMenu receives user directly

The intermediate components do not become data transport pipes.

25. Composition Can Reduce Coupling
Consider:
function Dashboard({ user, notifications, projects, permissions }) {
  return (
    <DashboardLayout
      user={user}
      notifications={notifications}
      projects={projects}
      permissions={permissions}
    />
  );
}

Then:
function DashboardLayout({
  user,
  notifications,
  projects,
  permissions,
}) {
  ...
}

The layout now knows domain concepts.
But layout may only need:
where content goes

Composition can isolate the layout:
<DashboardLayout
  sidebar={<Sidebar user={user} />}
  header={<Header notifications={notifications} />}
>
  <Projects
    projects={projects}
    permissions={permissions}
  />
</DashboardLayout>

Now:
DashboardLayout
├── sidebar slot
├── header slot
└── children

The layout does not understand:
user
notifications
projects
permissions
unless it needs them.
That is reduced coupling.

26. Composition and Dependency Direction
A healthy dependency graph:
Domain Feature
│
▼
Specific UI
│
▼
Generic Layout
│
▼
Primitive

For example:
ProjectsPage
├── ProjectFilters
├── ProjectTable
└── DashboardLayout
    └── Stack

The generic layout should not know:
Project
User
Invoice
Permission

The feature supplies those concepts through composition.

27. Layout Components
A layout component is often an excellent composition boundary.

Example:
function SplitLayout({ sidebar, children }) {
  return (
    <div className="split-layout">
      <aside>{sidebar}</aside>
      <main>{children}</main>
    </div>
  );
}

Usage:
<SplitLayout
  sidebar={<Navigation />}
>
  <AccountPage />
</SplitLayout>

The layout owns:
grid/flex arrangement
regions
spacing contract
responsive structure

The caller owns:
Navigation
AccountPage

This is a clean separation.

28. Composition and Semantic HTML
Composition must not destroy semantic structure.
Bad:
<Card>
  <div>
    <div>
      <div>
        <button>Save</button>
      </div>
    </div>
  </div>
</Card>

Composition should preserve semantic boundaries:
<Card>
  <Card.Header>
    <h2>Account</h2>
  </Card.Header>
  <Card.Body>
    <form>
      ...
    </form>
  </Card.Body>
  <Card.Footer>
    <button type="submit">Save</button>
  </Card.Footer>
</Card>

Reusable composition must still respect:
semantic HTML
heading hierarchy
form structure
button semantics
accessible naming
keyboard interaction

Composition is an architecture mechanism, not permission to create arbitrary wrapper trees.

29. Render Functions
Another composition mechanism:
function DataList({ items, renderItem }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}

Usage:
<DataList
  items={users}
  renderItem={user => (
    <UserRow user={user} />
  )}
/>

The DataList owns:
iteration
list semantics
key location
structural layout

The caller owns:
how one item is visually represented

This is a form of inversion of control.

30. Render Props: The Core Idea
A render prop is simply a prop whose value is a function used to produce UI.
<DataProvider
  render={data => (
    <Dashboard data={data} />
  )}
/>

The important concept is not the name.
It is:
Component owns data/behavior + Caller owns rendering

This can be useful when behavior is reusable but presentation must remain flexible.

31. Render Functions Versus Ordinary Children
Compare:
<DataList>
  ...
</DataList>
with:
<DataList>
  {item => <UserRow user={item} />}
</DataList>

The second is not merely content.
It is a function.
The child component can invoke it:
children(item)

This means the child can provide data to the caller's rendering function.
That is fundamentally different from ordinary static children.

32. When Render Functions Are Appropriate
Use them when:
Reusable behavior/data + caller-controlled rendering
is the actual requirement.

Examples:
reusable list iteration
reusable state machine exposure
reusable measurement behavior
reusable interaction behavior

Do not introduce them simply because:
"Render props are flexible."
Flexibility has a cost.

33. Composition Versus Render Functions
Requirement | Better Starting Point
--- | ---
Static caller content | children
Named structural region | Element prop / slot
Caller controls rendering with component-owned data | Render function
Related semantic UI pieces | Compound components
Reusable behavior with arbitrary presentation | Headless/render-function pattern
Simple layout | Composition
Configuration of a small stable variation | Props
Many structural flags | Composition

34. Headless Composition
A headless component provides behavior without imposing a complete visual implementation.

Conceptually:
Headless behavior
├── state
├── event handlers
├── derived interaction state
└── accessibility-related behavior
│
▼ caller-controlled UI

Example conceptual API:
<Combobox>
  ...
</Combobox>
or a lower-level behavior interface:
const {
  inputProps,
  listProps,
  optionProps,
} = useCombobox(...);

The exact implementation belongs to more advanced patterns, but the architectural idea is important:
Behavior and presentation can have different ownership boundaries.

35. Do Not Confuse Headless With "No UI"
Headless does not mean:
nothing is provided
It means:
behavioral contract + caller-controlled presentation
The reusable abstraction may still enforce important invariants.

36. Composition and State Locality
Suppose:
function Page() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Layout>
      <Toolbar isOpen={isOpen} onOpen={() => setIsOpen(true)} />
      <Content isOpen={isOpen} />
    </Layout>
  );
}

Perhaps Layout does not care about isOpen.
Do not make it part of the layout API merely because the JSX is nested.

Composition can preserve locality:
<Layout>
  <PageFeature />
</Layout>

and:
function PageFeature() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Toolbar ... />
      <Content ... />
    </>
  );
}

The state stays near the feature that owns it.

37. Composition and State Boundaries
The important question is:
Who owns the state?
Not:
Which component visually surrounds the state?

For example:
<Modal>
  <DeleteAccountFlow />
</Modal>

The Modal owns modal mechanics.
The DeleteAccountFlow owns domain state.

That gives:
Modal └── structural/interaction boundary
DeleteAccountFlow └── domain workflow state

This is stronger than putting everything into the parent.

38. Composition Does Not Eliminate Props
A common mistake is:
"Composition means no props."
False.

A well-designed component can use:
<Dialog
  open={open}
  onOpenChange={setOpen}
>
  <Dialog.Body>
    ...
  </Dialog.Body>
</Dialog>

Props still express:
behavioral contract
state control
semantic inputs

Composition expresses:
structural extensibility

They solve different problems.

39. Props Versus Composition
A useful separation:
Props ↓ "What behavior/data does this component receive?"
Composition ↓ "What UI structure/content does the caller provide?"

A component may legitimately use both.

40. Anti-Pattern: Everything Becomes children
Bad:
<Dashboard>
  <div className="whatever">
    ...
  </div>
</Dashboard>

If the component has meaningful required regions:
header
sidebar
main
footer
then blindly using children may weaken the contract.

Prefer:
<Dashboard
  header={<Header />}
  sidebar={<Sidebar />}
>
  <MainContent />
</Dashboard>

when those regions are semantically part of the component's public contract.

41. Anti-Pattern: Slot Explosion
The opposite mistake:
<Component
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

This is often a sign that the component has become a generic layout engine.
The better abstraction may simply be:
<Grid> ... </Grid>
or composition around meaningful regions.

42. Anti-Pattern: Configuration Disguised as Composition
This is not necessarily good:
<Component
  header={<Header />}
  footer={<Footer />}
  body={<Body />}
  sidebar={<Sidebar />}
  toolbar={<Toolbar />}
  extra={<Extra />}
  overlay={<Overlay />}
  ...
/>

If the component merely receives every possible subtree as a prop, ask:
Why does this component exist?
If it owns no meaningful behavior, structure, or invariant, it may not be providing useful abstraction.

43. Anti-Pattern: Wrapper Proliferation
Composition can produce:
<App>
  <Layout>
    <Section>
      <Container>
        <Stack>
          <Card>
            <Panel>
              <Content />
            </Panel>
          </Card>
        </Stack>
      </Container>
    </Section>
  </Layout>
</App>

Every abstraction might technically be reusable.
But the resulting tree can become difficult to reason about.

Ask:
Does this wrapper:
- own behavior?
- enforce a meaningful invariant?
- define a stable layout contract?
- isolate a responsibility?

If not, reconsider it.

44. Anti-Pattern: Composition for Every Variation
Suppose:
<Button>
  Save
</Button>
needs only:
<Button variant="primary" />

Composition is unnecessary.
Do not replace:
<Button variant="danger">
with:
<Button>
  <DangerButtonContent />
</Button>
merely because composition exists.

Use the simplest mechanism that accurately expresses ownership.

45. Production API Design Rule
When deciding between a prop and composition, ask:

Question 1: Is the variation primarily data?
Use a prop.
<Button size="small" />

Question 2: Is the variation primarily behavioral?
Use a behavioral prop/callback or controlled contract.
<Dialog open={open} onOpenChange={...} />

Question 3: Is the variation primarily structure/content?
Consider composition.
<Dialog>
  <Dialog.Body>...</Dialog.Body>
</Dialog>

Question 4: Does the caller need to provide arbitrary rendering based on component-owned data?
Consider a render function.
<DataList>
  {item => ...}
</DataList>

46. 🔬 Prediction-First Walkthrough #1 — children
Given:
function Panel({ children }) {
  console.log("Panel render");
  return (
    <section>
      {children}
    </section>
  );
}

function App() {
  const [count, setCount] = useState(0);

  return (
    <Panel>
      <p>Static content</p>
      <button onClick={() => setCount(c => c + 1)}>
        {count}
      </button>
    </Panel>
  );
}

Render #1:
App state: count = 0
App produces:
Panel
└── children
    ├── p("Static content")
    └── button("0")

Panel renders.
Committed DOM:
<section>
  <p>Static content</p>
  <button>0</button>
</section>

Render #2:
Click button.
State queue:
count: 0 → 1

App renders:
Panel
└── children
    ├── p("Static content")
    └── button("1")

Important:
The conceptual Panel component occurrence remains the same.
The content description changes because the parent produced a new result.

47. Prediction Question
Does:
<Panel>
  <p>Static content</p>
</Panel>
mean that Panel owns the <p>?
No.
The caller owns the supplied content.
Panel owns where that content is inserted.

48. 🔬 Prediction-First Walkthrough #2 — Named Slot
function Layout({ sidebar, children }) {
  return (
    <div className="layout">
      <aside>{sidebar}</aside>
      <main>{children}</main>
    </div>
  );
}

function App() {
  return (
    <Layout
      sidebar={<Navigation />}
    >
      <Dashboard />
    </Layout>
  );
}

Resulting conceptual tree:
App
└── Layout
    ├── sidebar
    │   └── Navigation
    │
    └── children
        └── Dashboard

Layout does not need to understand:
Navigation's domain
Dashboard's domain

It only owns:
sidebar placement
main placement

This is strong composition.

49. 🔬 Prediction-First Walkthrough #3 — Render Function
function List({ items, children }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>
          {children(item)}
        </li>
      ))}
    </ul>
  );
}

Usage:
<List items={users}>
  {user => <UserRow user={user} />}
</List>

During rendering:
List
│
├── item = user1
│   │
│   └── children(user1)
│
├── item = user2
│   │
│   └── children(user2)
│
└── item = user3
    │
    └── children(user3)

The list owns iteration.
The caller owns item rendering.

50. Critical Distinction: Element Versus Function
This:
<List>
  <UserRow />
</List>
supplies an element.

This:
<List>
  {user => <UserRow user={user} />}
</List>
supplies a function.

The second gives the receiving component a mechanism to provide data back to the caller.
That is a materially different contract.

51. 🔬 Prediction-First Walkthrough #4 — Compound Structure
function Dialog({ children }) {
  return (
    <div role="dialog">
      {children}
    </div>
  );
}

function App() {
  return (
    <Dialog>
      <DialogHeader />
      <DialogBody />
      <DialogFooter />
    </Dialog>
  );
}

The important architectural model is:
App
↓
Dialog occurrence
↓
caller-supplied subtree
├── Header
├── Body
└── Footer

The dialog controls the outer interaction boundary.
The caller controls the specific content.

52. Composition and React Identity
Composition does not bypass reconciliation.
Consider:
<Panel>
  <Counter />
</Panel>
and later:
<Panel>
  <Counter />
</Panel>

The Counter element descriptions may be newly created during render.
That does not automatically mean its state is reset.
React determines continuity based on the resulting tree and identity rules.

Conceptually:
new element object ≠ new component identity
This distinction remains essential.

53. Composition Can Accidentally Change Identity
Consider:
function Parent() {
  return (
    <Panel>
      <Counter />
    </Panel>
  );
}

Later:
function Parent() {
  return (
    <Wrapper>
      <Panel>
        <Counter />
      </Panel>
    </Wrapper>
  );
}

The resulting tree structure changed.
That can affect identity relationships depending on where elements occur in the resulting tree.

Therefore:
Composition is structural programming.
Changing composition can change:
identity
state preservation
DOM structure
accessibility
CSS behavior
event boundaries

54. Composition and Keys
When composition creates collections:
<List>
  {items.map(item => (
    <Row key={item.id} item={item} />
  ))}
</List>
the key belongs to the relevant sibling collection.
Composition does not remove key responsibilities.
A reusable component should not hide key mistakes by generating unstable keys.

55. Component API Design: Semantic Slots
Prefer:
<Dialog
  title={<DialogTitle />}
  actions={<DialogActions />}
/>
when those are genuine semantic regions.

Avoid:
<Dialog
  slot1={...}
  slot2={...}
  slot3={...}
/>

Good slot names encode meaning.
Bad slot names encode implementation position.

56. Semantic Versus Positional APIs
Weak:
<Component left={...} right={...} top={...} />

Potentially stronger:
<Dialog header={...} footer={...} />

Why?
Because:
left/right/top
describe layout.
Whereas:
header/footer
describe component semantics.

Semantic APIs survive visual rearrangement better.

57. Composition and Responsive Design
Suppose:
<PageLayout
  sidebar={<Filters />}
/>

On desktop:
┌──────────┬─────────────────┐
│ Filters  │     Content     │
└──────────┴─────────────────┘

On mobile:
┌─────────────────────────────┐
│           Content           │
│                             │
│ Filters may move elsewhere  │
└─────────────────────────────┘

The caller should not need to know the CSS implementation.
The layout component can own responsive placement.
Composition gives the layout control over placement while the caller supplies content.

58. Composition and Accessibility
A reusable component must define what it guarantees.
For example:
<Dialog>
  <Dialog.Title>Delete account</Dialog.Title>
  <Dialog.Body>...</Dialog.Body>
</Dialog>

The dialog may own:
role
label association
focus behavior
dismissal behavior

while the caller owns:
title content
body content
actions

This is stronger than allowing arbitrary DOM content without semantic constraints.

59. Composition and Behavioral Ownership
Consider:
<Dropdown>
  <Dropdown.Trigger>
    ...
  </Dropdown.Trigger>
  <Dropdown.Content>
    ...
  </Dropdown.Content>
</Dropdown>

The caller controls:
trigger content
menu content

The dropdown abstraction can own:
open/closed state
interaction contract
placement boundary
dismissal
keyboard semantics

The exact implementation can vary, but the ownership model is the important part.

60. Production Anti-Pattern Teardown #1
The Mega-Component:
<Modal
  showTitle
  showDescription
  showIcon
  iconType="warning"
  showPrimary
  showSecondary
  primaryText="Delete"
  secondaryText="Cancel"
  primaryVariant="danger"
  footerAlign="right"
  showDivider
  compact
  ...
/>

Why developers do it:
Initially:
"Let's make the component reusable."
Each new requirement adds:
one prop

Mechanical failure:
The state space grows:
2 booleans → 4 combinations
5 booleans → 32 combinations
10 booleans → 1024 combinations

Not every combination is necessarily meaningful.
The component's public API becomes a matrix of accidental states.

Senior refactoring:
Use semantic composition:
<Modal>
  <Modal.Header>
    <WarningIcon />
    <Modal.Title>Delete account</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    Are you sure?
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary">
      Cancel
    </Button>
    <Button variant="danger">
      Delete
    </Button>
  </Modal.Footer>
</Modal>

61. Production Anti-Pattern Teardown #2
Generic Slot Dump:
<Layout
  slotA={<A />}
  slotB={<B />}
  slotC={<C />}
  slotD={<D />}
  slotE={<E />}
/>

Why developers do it:
They want maximum flexibility.

Mechanical failure:
The abstraction no longer communicates:
what A means
what B means
what C means
The caller must understand implementation details.

Senior refactoring:
Either:
<Layout
  header={<Header />}
  sidebar={<Sidebar />}
>
  <Content />
</Layout>

or:
<Layout>
  <Layout.Header>...</Layout.Header>
  <Layout.Sidebar>...</Layout.Sidebar>
  <Layout.Content>...</Layout.Content>
</Layout>

62. Production Anti-Pattern Teardown #3
Render Prop Everywhere:
<DataComponent>
  {data => (
    <div>
      {data.map(...)}
    </div>
  )}
</DataComponent>
for every small component.

Why developers do it:
It feels maximally flexible.

Mechanical failure:
The API becomes harder to read:
function-as-child
nested closures
implicit invocation
data ownership
render ownership
all become part of local reasoning.

Senior refactoring:
If ordinary children are enough:
<Component>
  <Content />
</Component>
Use ordinary composition.
Use a render function only when the receiving component genuinely needs to supply dynamic data/behavior to caller-controlled rendering.

63. Production Anti-Pattern Teardown #4
Layout That Knows the Domain:
Bad:
function DashboardLayout({
  users,
  invoices,
  notifications,
  permissions,
}) {
  ...
}

If layout only needs to place regions, these domain dependencies are misplaced.

Better:
<DashboardLayout
  sidebar={<UserNavigation />}
  header={<NotificationHeader />}
>
  <InvoiceDashboard />
</DashboardLayout>

Now:
DashboardLayout ↓ layout responsibility
UserNavigation ↓ user responsibility
InvoiceDashboard ↓ invoice responsibility

64. Production Anti-Pattern Teardown #5
Composition Without Ownership:
Bad:
<Form>
  <Everything />
</Form>
where:
Everything
contains:
validation
submission
network behavior
form state
layout
unrelated business logic

Composition did not improve architecture.
It merely moved code into children.
The question remains:
Which component owns each responsibility?

65. Production Incident Runbook #1
Incident: Component API Has Become Unmaintainable

Symptoms:
dozens of props
many booleans
contradictory combinations
difficult tests
frequent API additions
consumers use only small subsets

Investigation:
Inspect:
[ ] prop count
[ ] boolean count
[ ] conditional branches
[ ] mutually exclusive props
[ ] structural props
[ ] behavioral props
[ ] domain-specific props

Classify every prop:
data
behavior
structure
style
domain dependency

Refactoring:
If several props encode structure:
extract into composition
If several props encode one domain concept:
create semantic contract
If props belong to different responsibilities:
split component boundary

66. Production Incident Runbook #2
Incident: Generic Layout Depends on Business Domain

Symptom:
A layout component receives:
user
projects
billing
permissions

Investigation:
Ask for every prop:
Does layout itself need to understand this value?
If:
No
move the domain-specific subtree outward.

Refactor:
Before:
<Layout user={user} projects={projects} permissions={permissions} />

After:
<Layout
  sidebar={<Sidebar user={user} />}
>
  <Projects
    projects={projects}
    permissions={permissions}
  />
</Layout>

67. Production Incident Runbook #3
Incident: Deep Prop Drilling

Symptoms:
A → B → C → D → E
and:
user
is forwarded through B/C/D only so E can use it.

First investigation:
Do not immediately introduce Context.
Ask:
Can composition place E closer to A's data owner?
If yes:
<A>
  <B>
    <E user={user} />
  </B>
</A>
or use an appropriate slot.

If many unrelated branches require the same dependency, Context may be the stronger distribution mechanism.

68. Production Incident Runbook #4
Incident: Composition Created Too Many Wrappers

Symptoms:
React tree contains dozens of tiny components.

Investigation:
For every wrapper ask:
Does it:
[ ] own state?
[ ] own behavior?
[ ] enforce an invariant?
[ ] define a meaningful API?
[ ] isolate a responsibility?
[ ] provide a reusable structural contract?

If all are false:
candidate for removal

69. 🧪 Diagnostic Lab — React DevTools
Open React DevTools.
Inspect the component tree.
For a composition-heavy component:
[ ] Identify the component occurrence
[ ] Inspect its props
[ ] Inspect children-related props
[ ] Identify which component owns state
[ ] Identify which component owns callbacks
[ ] Inspect nested providers
[ ] Record why components rendered

Turn on:
[ ] Highlight updates when components render
[ ] Record why each component rendered

Then interact with the composed UI.
Observe:
Which component rerenders?
Which component owns the changed state?
Which components merely receive children?
Which layout components rerender?

Do not assume:
parent rerender = all children recreated as new identities
Use the profiler and tree to verify actual behavior.

70. Diagnostic Exercise — Configuration Versus Composition
Create two components.

Version A:
<Modal
  showIcon
  showFooter
  primaryLabel="Delete"
  secondaryLabel="Cancel"
  primaryVariant="danger"
/>

Version B:
<Modal>
  <Modal.Header>
    <WarningIcon />
    <Modal.Title>Delete</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    ...
  </Modal.Body>
  <Modal.Footer>
    <Button>Cancel</Button>
    <Button variant="danger">Delete</Button>
  </Modal.Footer>
</Modal>

Profile both.
Ask:
Which API is easier to extend?
Which one exposes semantics?
Which one allows arbitrary content?
Which one owns behavior?
Which one owns structure?

71. Diagnostic Exercise — Slot Ownership
Build:
<PageLayout
  header={<Header />}
  sidebar={<Sidebar />}
>
  <Content />
</PageLayout>

Trace:
Who creates Header?
Who creates Sidebar?
Who creates Content?
Who places Header?
Who places Sidebar?
Who places Content?
Who owns state inside Header?
Who owns state inside Content?

The answer should make ownership obvious.

72. Diagnostic Exercise — Render Function
Build:
<DataList items={items}>
  {item => <Row item={item} />}
</DataList>

Log:
console.table({
  itemId: item.id,
  renderedBy: "render function",
});

Observe:
List controls iteration.
Caller controls representation.

73. Engineering Decision Matrix
Situation | Prefer | Reason
--- | --- | ---
Simple data variation | Prop | Explicit and cheap
Simple visual variant | Prop/variant | Stable bounded API
One content region | children | Natural composition
Header/body/footer regions | Named slots | Semantic structure
Arbitrary caller content | Composition | Caller owns content
Caller needs component-owned data | Render function | Inversion of rendering control
Related structured API | Compound components | Domain-oriented composition
Repeated behavior with flexible UI | Headless pattern | Separate behavior/presentation
Deep dependency distribution | Context | Appropriate shared dependency
One prop forwarded through 5 layers | Composition first | May eliminate relay
Generic layout knows domain data | Refactor | Coupling is backwards
15 booleans control structure | Composition | Configuration explosion
Component has no meaningful ownership | Remove abstraction | Abstraction is not automatically value

74. Senior Design Heuristic
Use this sequence:
1. Identify ownership
↓
2. Identify variation
↓
3. Classify variation
↓ data / behavior / structure
4. Choose mechanism
↓ prop / callback / composition
5. Check coupling
↓
6. Check API discoverability
↓
7. Check semantic invariants
↓
8. Check whether abstraction is actually needed

This prevents:
"Use composition because composition is good."
from becoming dogma.

75. The Six-Dimension Composition Test
Before introducing a composition abstraction, evaluate:
1. Ownership: Who should own the content?
2. Structure: Does the component need to control placement?
3. Behavior: Does the component own interaction?
4. Variability: How much caller variation is expected?
5. Coupling: Would configuration introduce domain dependencies?
6. Contract: Can the API clearly communicate valid usage?

A strong composition abstraction scores well across all six.

76. Senior Interview Gotcha #1
Question: Is children special in React?
Answer:
children is a conventional prop name used to represent nested JSX content. It is passed as part of the component's props.
The important React behavior comes from how the resulting element tree is reconciled, not from children being a browser-native concept.

77. Senior Interview Gotcha #2
Question: Why is composition preferred over inheritance in React?
Because React's component model naturally supports assembling UI through:
elements
children
props
callbacks
slots
nested components

This provides structural reuse without requiring subclass hierarchies.
The deeper principle is:
Behavior and structure can be assembled explicitly instead of inherited implicitly.

78. Senior Interview Gotcha #3
Question: Does composition prevent prop drilling?
No.
Composition can eliminate some forms of prop relay by allowing the data-owning component to construct a subtree directly.
But if a dependency genuinely needs to cross many independent branches, Context or another appropriate distribution mechanism may still be needed.

79. Senior Interview Gotcha #4
Question: Are compound components always better than configuration props?
No.
Compound components are useful when the UI has a meaningful conceptual structure and callers need structural control.
For a small bounded variation:
<Button variant="danger" />
is often better than introducing an elaborate composition API.

80. Senior Interview Gotcha #5
Question: Is a render prop just a callback?
Mechanically, it is a function passed through props.
Architecturally, its important role is that the receiving component invokes the function to allow the caller to control rendering using data supplied by the receiving component.

81. Senior Interview Gotcha #6
Question: Does composition mean the parent owns all children?
No.
The caller supplies the child element descriptions.
The receiving component controls where and how those descriptions are incorporated into its returned element tree.
Ownership of state remains a separate architectural question.

82. 🔥 THE CRUCIBLE
Challenge 1 — Boolean Explosion
You receive:
<Dialog
  showHeader
  showIcon
  showFooter
  showCancel
  showConfirm
  confirmDanger
  compact
  centered
/>

Questions:
Which props represent structure?
Which represent behavior?
Which represent visual variation?
Which should become composition?
Which should remain props?
What semantic composition API would you design?

83. Challenge 2 — Prop Relay
You see:
<App user={user}>
  <Page user={user}>
    <Layout user={user}>
      <Sidebar user={user}>
        <UserMenu user={user} />
      </Sidebar>
    </Layout>
  </Page>
</App>

Questions:
Which components actually need user?
Which are relay nodes?
Can composition remove the relay?
Would Context be better?
What determines the correct answer?

84. Challenge 3 — Generic Layout
You inherit:
<DashboardLayout
  users={users}
  invoices={invoices}
  notifications={notifications}
  permissions={permissions}
/>

Questions:
Why is this suspicious?
What does a layout actually need to know?
Rewrite it using slots/composition.
Where should each domain dependency live?

85. Challenge 4 — Render Function
Given:
<List items={users}>
  {user => <UserRow user={user} />}
</List>

Questions:
Who owns iteration?
Who owns item rendering?
Why is children a function?
What changes if the function is replaced with <UserRow />?
When would ordinary composition be simpler?

86. Challenge 5 — Compound Components
Design:
<Tabs> ... </Tabs>

Requirements:
Tabs owns:
- selected value
- selection behavior
Caller owns:
- tab labels
- panel content
- arrangement

Define the conceptual API.
Then identify:
state owner
behavior owner
content owner
structural owner
identity boundary

87. Challenge 6 — Abstraction Removal
You find:
function ContentWrapper({ children }) {
  return <div>{children}</div>;
}
It has:
no state
no behavior
no semantic contract
no layout guarantee
no styling
one caller

Should it exist?
Usually no.
The senior answer is not:
"Composition is good."
It is:
"There is no meaningful ownership or reusable invariant here, so the abstraction has insufficient architectural value."

88. Final Render-by-Render Crucible
Consider:
function Shell({ children }) {
  console.log("Shell render");
  return (
    <main>
      {children}
    </main>
  );
}

function App() {
  const [count, setCount] = useState(0);

  return (
    <Shell>
      <Counter
        value={count}
        onIncrement={() => setCount(c => c + 1)}
      />
    </Shell>
  );
}

Render #1:
State: count = 0
Conceptual tree:
App
└── Shell
    └── Counter
        ├── value = 0
        └── onIncrement = function A

Click:
The callback executes:
setCount(c => c + 1)
Queue:
0 → 1

Render #2:
App produces:
Shell
└── Counter
    ├── value = 1
    └── onIncrement = function B

Notice:
function A !== function B
because a new callback function is created during the render.
But that fact alone does not imply that:
Counter identity is reset.
Its resulting tree position/type/key remain relevant.

89. The Critical Architecture Insight
Composition separates:
WHAT
from:
WHERE
and sometimes:
HOW

For example:
<Layout
  sidebar={<Navigation />}
>
  <Dashboard />
</Layout>

The caller answers:
WHAT content?

The layout answers:
WHERE does it go?

A behavior abstraction might additionally answer:
HOW does interaction work?

This separation is one of React's most important architectural capabilities.

90. Composition Boundary Checklist
Before shipping a reusable composition API:
[ ] The component has a clear responsibility
[ ] The caller has a clear responsibility
[ ] The structural contract is understandable
[ ] Slot names communicate semantics
[ ] children is used for the primary content region
[ ] Named slots exist only where semantically useful
[ ] Element props are not replacing every ordinary prop
[ ] Render functions are used only when caller rendering needs component-owned data
[ ] Compound components represent a coherent conceptual system
[ ] State ownership is explicit
[ ] Behavior ownership is explicit
[ ] Domain dependencies are not unnecessarily pushed into generic layout components
[ ] Context is not being used when composition is simpler
[ ] Composition is not being used merely to avoid a prop
[ ] Boolean prop explosion has been evaluated
[ ] Wrapper proliferation has been evaluated
[ ] Accessibility remains intact
[ ] Semantic HTML remains intact
[ ] Keys remain correct in composed collections
[ ] Identity implications have been considered
[ ] API discoverability is reasonable
[ ] The abstraction has a real invariant
[ ] The component can evolve without anticipating every caller variation
[ ] The component does not become a generic UI engine
[ ] Tests can express the intended contract

91. 30-Second Final Summary
COMPONENT COMPOSITION
│
┌──────────────┼──────────────┐
▼              ▼              ▼
children     slots      render functions
│              │              │
▼              ▼              ▼
content     regions       dynamic UI
│              │              │
└──────────────┼──────────────┘
               ▼
      INVERSION OF CONTROL
               │
               ▼
    lower structural coupling
               │
               ▼
       clearer ownership

Remember:
Props → data / behavior
Composition → structure / content
Context → dependency distribution
State → owned memory for a component occurrence

These mechanisms are complementary.
Do not turn one mechanism into a universal solution.

92. Final Engineering Principle
Good React composition does not maximize flexibility. It places structural control with the component that has the best knowledge of the structure while preserving behavioral and state ownership at the correct boundary.

The strongest composition APIs therefore have:
semantic structure + explicit ownership + controlled extensibility + minimal coupling + small conceptual vocabulary

The senior engineer's goal is not:
"How can I make this component accept anything?"
It is:
"What must this component own, what should the caller own, and what is the smallest API that makes that ownership explicit?"

93. Cross-KPI Boundary
This Part establishes the architectural role of composition.
It intentionally does not deeply cover:
advanced concurrent rendering
transition scheduling
lane priorities
advanced memoization strategies
custom renderers
Server Components
streaming architecture
framework-specific composition patterns
Those belong to later levels.

This Part also assumes prior knowledge of:
JavaScript functions and closures
object identity
TypeScript contracts
React elements
Fiber identity
state ownership
Context fundamentals
The focus here is component composition as a React architectural mechanism.

94. Part Completion Standard
You should be able to answer all of these without memorized slogans:
[ ] What exactly is children?
[ ] Why is children just a prop?
[ ] What does composition transfer?
[ ] What does composition not transfer?
[ ] What is inversion of control in UI composition?
[ ] When should children be preferred?
[ ] When should named slots be preferred?
[ ] What is an element prop?
[ ] What is the difference between an element prop and a component prop?
[ ] What is a render function?
[ ] Why does a render function differ from ordinary children?
[ ] When are render props justified?
[ ] What are compound components?
[ ] Why can compound components improve API readability?
[ ] Why can compound components also become over-engineered?
[ ] How does composition reduce prop drilling?
[ ] When should Context still be preferred?
[ ] How does composition affect dependency direction?
[ ] Why should generic layouts avoid domain dependencies?
[ ] What is boolean prop explosion?
[ ] Why does configuration complexity become combinatorial?
[ ] When should a variation remain a prop?
[ ] When should it become composition?
[ ] How does composition interact with state ownership?
[ ] How does composition interact with identity?
[ ] Can new JSX elements imply new component identity?
[ ] Why can wrappers affect identity?
[ ] How should keys be handled in composed collections?
[ ] How does composition affect accessibility?
[ ] What is slot explosion?
[ ] What is wrapper proliferation?
[ ] How do you detect a useless abstraction?
[ ] How do you diagnose a component API that has become too configurable?
[ ] How do you redesign a generic layout that knows too much about a domain?
[ ] How do you choose between props, slots, render functions, compound components, and Context?
[ ] Can you explain all of the above through render-by-render reasoning?

If you cannot answer these mechanically, the topic is not yet complete.

95. Final Mental Model
REACT COMPONENT
│
┌─────────────┴─────────────┐
│                           │
OWNS                      RECEIVES
│                           │
┌───────┼────────┐         ┌───────┼────────┐
▼       ▼        ▼         ▼       ▼        ▼
state behavior boundary  props   slots  children
                           │
                           ▼ composition
                           │
                           ▼ caller-controlled UI structure
                           │
                           ▼ reconciled element tree
                           │
                           ▼ Fiber
                           │
                           ▼ commit
                           │
                           ▼ DOM

The essential architectural distinction is:
DATA ↓ props
BEHAVIOR ↓ callbacks / contracts
STRUCTURE ↓ children / slots / composition
DISTRIBUTION ↓ Context
MEMORY ↓ state

A senior React engineer should be able to move deliberately between these mechanisms rather than allowing component APIs to evolve accidentally.
