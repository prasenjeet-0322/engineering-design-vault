Level 06 — React Fundamentals
KPI 03 — Components, Props & Composition
PART 06 — Component Boundaries, Decomposition & Architectural Design
[⬅️ Previous Part](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/05-component-api-design-reusability-boundaries.md) | [📚 Level 06 Index](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/README.md) | [🧪 Companion Lab](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/examples/06-component-boundaries.html) | [Next Part ➡️](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/07-component-identity-and-lifecycle.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

⚡ LAYER 1 — 30-SECOND EXECUTIVE CHEAT SHEET & CORE MENTAL MODELS
1. The Core Problem
Componentization is not:
“How many components can I create?”
It is:
Where should responsibility, state, behavior, and change be separated?

A React component boundary creates a unit around some combination of:
UI responsibility
state ownership
behavior
data transformation
interaction
domain semantics
composition
change isolation

Bad decomposition creates hundreds of tiny components that provide no meaningful boundary.
Bad consolidation creates giant components where unrelated concerns evolve together.
Senior React architecture requires finding the right granularity.

2. Core Model
UI REQUIREMENT
│
▼
Identify responsibilities
│
┌────────────┼────────────┐
▼            ▼            ▼
State     Behavior      View
│            │            │
└────────────┼────────────┘
             ▼
      Define ownership
             │
             ▼
    Define component API
             │
             ▼
    Define composition
             │
             ▼
   COMPONENT BOUNDARIES

A component boundary should answer:
Who owns this?
Who changes this?
Who renders this?
Who needs to communicate with it?
What can change independently?

3. Executive Concept Table
Concept | Core Mechanism | Production Impact | Common Senior Trap
--- | --- | --- | ---
Component boundary | Separates responsibility | Controls coupling | Splitting by visual size
Decomposition | Breaks responsibility into units | Improves change isolation | Over-fragmentation
Cohesion | Related behavior stays together | Easier reasoning | Ignoring ownership
Coupling | Dependencies between units | Determines change propagation | Counting props only
State boundary | Determines state ownership | Controls coordination | Putting state too low
Behavioral boundary | Encapsulates interaction logic | Improves reuse | Extracting every handler
Composition boundary | Allows structural variation | Reduces configuration | Excessive wrapper components
Container/presentation split | Separates coordination from display | Can clarify ownership | Applying it mechanically
Feature boundary | Groups domain behavior | Supports scalability | Creating arbitrary folders
Extraction | Moves responsibility into another component | Can isolate change | Extracting too early
Colocation | Keeps related code together | Reduces cognitive distance | Ignoring cross-feature ownership
Component granularity | Size and responsibility balance | Affects maintainability | “Small is always better”

4. Golden Rule
Create a component when the boundary creates meaningful ownership, reuse, composition, or change isolation—not merely because a block of JSX is large.

🔬 LAYER 2 — DEEP MECHANICAL BREAKDOWN
5. What Is a Component Boundary?
Consider:
function CheckoutPage() {
  return (
    <main>
      <h1>Checkout</h1>
      <section>
        <h2>Shipping</h2>
        ...
      </section>
      <section>
        <h2>Payment</h2>
        ...
      </section>
      <aside>
        ...
      </aside>
    </main>
  );
}

The question is not:
“This file is 300 lines. Should I split it?”
Instead ask:
Shipping
│
├── state?
├── behavior?
├── validation?
└── rendering?

Payment
│
├── state?
├── behavior?
├── validation?
└── rendering?

Order summary
│
├── data?
├── calculations?
└── rendering?

If these regions have distinct responsibilities and ownership, meaningful component boundaries may exist.

6. Visual Boundary vs Responsibility Boundary
This is one of the most important distinctions.
A visually large region does not automatically deserve a component.
Conversely, a visually small region may deserve one.

For example:
<button onClick={...}>
  <Icon /> Save
</button>

Extracting:
function SaveButton() { ... }
may be useful if:
it has domain-specific behavior
it is reused
it has independent state
it establishes a meaningful semantic boundary

But extracting:
function ButtonIconWrapper() {
  return <Icon />;
}
usually provides little architectural value.

7. Cohesion
Cohesion asks:
How strongly related are the responsibilities inside this component?

High cohesion:
Accordion
├── open state
├── toggle behavior
├── accessibility state
└── accordion rendering

Low cohesion:
Dashboard
├── authentication logic
├── chart transformation
├── modal state
├── invoice generation
├── user preferences
├── table sorting
└── notification orchestration

High cohesion generally makes a component easier to understand.

8. Coupling
Coupling asks:
How much does one component depend on another component's details?

Example:
<ProfileEditor
  user={user}
  onUserChange={...}
  validationSchema={...}
  internalFieldState={...}
  formReducer={...}
  inputRefs={...}
/>

The more implementation details cross the boundary, the more tightly coupled the units become.
A strong boundary allows:
consumer
│ semantic API
component
│ implementation

rather than:
consumer
│ private state
│ private handlers
│ private DOM
│ private data structures
component

9. The Four Ownership Questions
When deciding whether to extract a component, ask four questions.

Question 1 — Who owns the state?
Component A
│
└── state belongs here?
If yes, that can be a strong boundary.

Question 2 — Who owns the behavior?
For example:
Dropdown
├── keyboard navigation
├── open/close
├── selection
└── focus management
These behaviors form a coherent unit.

Question 3 — Who needs the data?
If multiple siblings require the same changing value:
      Parent
      /    \
Child A    Child B
   ↑          ↑
   └── state ─┘
the common owner may need to move upward.

Question 4 — What changes together?
If two pieces of code almost always change together, separating them may not provide meaningful independence.
If two regions evolve independently, a boundary can reduce change coupling.

10. Change-Coupling Model
Imagine:
Checkout
├── Shipping
├── Payment
└── Summary

A requirement arrives:
Change shipping address validation.

If the entire checkout implementation must be modified:
Checkout
↓
Shipping
Payment
Summary
the change boundary is broad.

If:
Checkout
├── ShippingForm
├── PaymentForm
└── OrderSummary
isolates shipping behavior, the change can remain localized.

The architectural goal is not fewer files.
It is:
Reduce unnecessary change propagation.

11. The Narrowest Common Owner
Suppose:
A
├── B
│   └── Input
└── C
    └── Preview

Both Input and Preview need:
value

The state should generally live at the nearest ancestor that legitimately coordinates both:
A
├── value state
├── B
│   └── Input
└── C
    └── Preview

This is the narrowest common owner principle.
Do not automatically move state to the application root.
Do not automatically keep it in the deepest component.
Find the narrowest owner that needs authority.

12. Extraction Should Follow Responsibility
Bad extraction:
function UserPage() {
  return (
    <>
      <Header />
      <UserCard />
      <Footer />
    </>
  );
}

This looks clean.
But suppose Header, UserCard, and Footer are each used once, have no independent state, and have no meaningful behavioral boundary.
The extraction may simply distribute one conceptual unit across multiple files.

The question is:
Did the extraction improve reasoning?
If not, it may be unnecessary.

13. The Single Responsibility Principle in React
Do not interpret SRP as:
One component = one visual element.

A more useful interpretation is:
One component should have a coherent reason to change.

Consider:
function UserProfile() {
  // user fetching
  // avatar processing
  // permissions
  // form validation
  // modal state
  // notification state
  // profile rendering
}

There may be multiple reasons to change.
Potential boundaries:
UserProfile
├── ProfileHeader
├── ProfileDetails
├── ProfileEditor
└── PermissionSummary

But the correct decomposition depends on actual ownership and behavior.

14. Component Size Is a Weak Metric
This:
function HugeComponent() {
  // 250 lines
}
is not enough evidence.

And this:
function TinyComponent() {
  // 4 lines
}
is not enough evidence either.

Useful architectural signals are:
responsibility
ownership
cohesion
coupling
reuse
composition
change isolation
state coordination

Line count is merely a symptom.

15. Over-Fragmentation
Consider:
Dashboard
└── DashboardContainer
    └── DashboardContent
        └── DashboardSection
            └── DashboardCard
                └── DashboardCardBody
                    └── DashboardText
                        └── DashboardTextSpan

Each boundary adds cognitive overhead.
The developer must navigate:
file → import → component → props → another file → another component

If every boundary contributes little meaning, the architecture becomes harder to understand.

16. Under-Fragmentation
The opposite problem:
function Dashboard() {
  // authentication
  // filters
  // fetching
  // pagination
  // chart calculations
  // chart rendering
  // table selection
  // modal behavior
  // keyboard handling
  // notifications
}

Now unrelated concerns share:
state
handlers
rendering
effects
and become difficult to modify independently.

17. Component Extraction Decision Test
Before extracting:
Does this have independent state?
│
├── yes → strong extraction signal
│
▼
Does it have coherent behavior?
│
├── yes → strong signal
│
▼
Is it reused?
│
├── yes → strong signal
│
▼
Does it isolate a meaningful change boundary?
│
├── yes → strong signal
│
▼
Is composition improved?
│
├── yes → possible signal
│
▼
Only visually smaller?
│
└── reconsider

18. Container and Presentation Responsibilities
A useful conceptual distinction:
Container / coordinator
│
├── state
├── data coordination
└── event orchestration
│
▼
Presentation
│
├── props
└── rendering

Example:
function UserPanel() {
  const [user, setUser] = useState(...);

  return (
    <UserView
      user={user}
      onUpdate={setUser}
    />
  );
}

This can be useful.
But do not turn it into a rigid law.
Modern React components can legitimately contain:
state
behavior
rendering
when those responsibilities are cohesive.

19. The “Smart vs Dumb” Trap
Avoid rigid classifications such as:
smart component
dumb component

A presentational component can still contain meaningful local interaction state.
For example:
function Tooltip() {
  const [visible, setVisible] = useState(false);
  ...
}

It is not “dumb.”
It owns a coherent interaction.
The more useful question is:
What responsibility does this component own?

20. Feature Boundaries
Large applications should not necessarily organize everything around generic UI categories.

Weak:
components/
  Button/
  Modal/
  User/
  Order/
  Payment/

A feature-oriented structure might instead be:
features/
  checkout/
    components/
    state/
    validation/
  profile/
    components/
    state/
  orders/
    components/
    state/

The important architectural idea is:
Keep closely related domain behavior close together when that improves change locality.
Folder structure itself does not create architecture.
Ownership and dependency direction do.

21. Dependency Direction
Suppose:
OrderFeature
↓
OrderSummary
↓
GenericButton

This is understandable:
domain
↓
specific UI
↓
generic primitive

The reverse can become problematic:
GenericButton
↓
OrderFeature

Now a supposedly generic primitive depends on a specific domain.
That reverses the abstraction boundary.

22. Generic Components Should Stay Generic
Bad:
function Button({ onClick, order }) {
  ...
}

If Button needs an order, it is no longer generic.
Instead:
<Button onClick={() => cancelOrder(order.id)}>
  Cancel
</Button>
The domain-specific behavior belongs outside the generic primitive.

23. Composition as Architectural Decoupling
Consider:
function Card({ title, body, footer }) {
  ...
}
versus:
<Card>
  <CardHeader />
  <OrderSummary />
  <OrderActions />
</Card>

Composition lets the parent determine:
structure
content
domain behavior
while the Card owns:
visual container semantics
This creates a strong separation.

24. Avoid “Wrapper for Everything”
A wrapper component is justified when it owns something meaningful.
Good:
<Modal>
  <ModalHeader />
  <ModalBody />
  <ModalFooter />
</Modal>
because the modal establishes a behavioral/semantic boundary.

Less useful:
<SpacingWrapper>
  <TextWrapper>
    <ContentWrapper>
      <div>...</div>
    </ContentWrapper>
  </TextWrapper>
</SpacingWrapper>
if every layer only forwards children.

25. Render-by-Render Prediction
Consider:
function App() {
  const [query, setQuery] = useState("");

  return (
    <SearchPage
      query={query}
      onQueryChange={setQuery}
    />
  );
}

Then:
function SearchPage({ query, onQueryChange }) {
  return (
    <>
      <SearchInput query={query} onQueryChange={onQueryChange} />
      <SearchResults query={query} />
    </>
  );
}

And:
function SearchInput({ query, onQueryChange }) {
  return (
    <input
      value={query}
      onChange={e => onQueryChange(e.target.value)}
    />
  );
}

Render #1:
App state query = ""
Tree:
App
└── SearchPage
    ├── SearchInput
    └── SearchResults

Props:
SearchInput.query = ""
SearchResults.query = ""

User types "r":
Event:
SearchInput
│
▼ onChange
│
▼ setQuery("r")
│
▼ App state update

Render #2:
App snapshot:
query = "r"

New props:
SearchInput.query = "r"
SearchResults.query = "r"

The state owner is App because both descendants depend on the value.
This is not arbitrary lifting.
It is ownership driven by coordination requirements.

26. Production Anti-Pattern — “Extract Because File Is Big”
Flawed reasoning:
File > 300 lines ↓ must split

Mechanical failure:
You may create:
MainPage
PageSection
PageSectionHeader
PageSectionBody
without reducing conceptual complexity.
Now developers must reconstruct one responsibility across multiple files.

Senior correction:
Extract around:
ownership
behavior
state
reuse
change boundary
composition
not line count.

27. Production Anti-Pattern — “Everything Gets Its Own Component”
Flawed:
function UserName() {
  return <span>{name}</span>;
}
used exactly once, with no behavior.

Mechanical problem:
The abstraction has no meaningful independent responsibility.
The cost is:
extra file
extra import
extra navigation
extra API surface

Senior correction:
Keep trivial JSX local unless the extraction creates real value.

28. Production Anti-Pattern — “Everything Goes Into Parent”
The opposite:
function App() {
  const [modalOpen, setModalOpen] = ...
  const [search, setSearch] = ...
  const [selectedTab, setSelectedTab] = ...
  const [tooltipOpen, setTooltipOpen] = ...
  const [menuOpen, setMenuOpen] = ...
}

The root becomes the owner of unrelated local interactions.
This creates unnecessary coordination.

Senior correction:
Keep state local until another component genuinely needs it.

29. Production Anti-Pattern — Prop Relay Chains
Consider:
A ↓ B ↓ C ↓ D
where each component simply forwards:
data={data}
onChange={onChange}
selected={selected}
without using the values.

This can be a signal that the boundary is poorly aligned.
However, prop drilling is not automatically an architectural failure.
Ask:
Is the chain short?
Is the data conceptually owned by A?
Do intermediate components still have understandable contracts?
Would another abstraction be more complex?

If yes, explicit props may remain preferable.

30. Production Incident Runbook — “Every Change Touches Everything”
Symptom:
A small feature request requires edits across:
Page
Layout
Card
List
Item
because state and callbacks are being threaded through unrelated layers.

Diagnosis:
Trace the value:
source
↓
owner
↓
consumer
↓
consumer
↓
consumer

Find where the value is actually needed.

Remediation:
Choose among:
lift state
move state down
composition
better component boundary
feature-level state
explicit context where justified

Do not immediately introduce global state.

31. Diagnostic Lab — Component Ownership Map
Take a real page.
Draw:
Page
├── Header
├── Search
├── Filters
├── Results
└── Summary

For every state value record:
State | Current Owner | Consumers | Correct Owner?
--- | --- | --- | ---
searchQuery | Page | Search, Results | Yes
menuOpen | Page | Header | No
selectedItem | Page | Results, Summary | Yes
tooltipOpen | Page | Item | No

Then move state toward its narrowest legitimate owner.

32. Diagnostic Lab — Change Propagation
Choose a hypothetical change:
“Add keyboard navigation to the dropdown.”
Ask:
Which files should change?
Which components should know?
Which state changes?
Which public API changes?

If implementing the feature requires modifying unrelated consumers, investigate the boundary.

33. Diagnostic Lab — Dependency Graph
Represent components:
Checkout
↓
ShippingForm
↓
Input

and:
Checkout
↓
PaymentForm
↓
Input

Generic Input should not know:
Checkout
Shipping
Payment

The dependency direction should generally point toward more specific behavior:
specific domain
↓
specific component
↓
generic primitive

34. Engineering Decision Matrix
Signal | Action
--- | ---
Independent local state | Consider extraction
Independent behavior | Consider extraction
Reused UI/behavior | Consider extraction
Clear domain boundary | Strong extraction candidate
Different change cadence | Consider boundary
Only visually large | Do not extract automatically
Only 3 lines long | Do not avoid extraction automatically
Many unrelated states | Decompose
Many props with no ownership clarity | Redesign
Pure prop forwarding | Reconsider boundary
Generic component knows domain | Reverse dependency
State needed by siblings | Lift to narrowest common owner
Local interaction only | Keep state local
Structural variation | Prefer composition

35. Senior-Level Component Decomposition Heuristic
Evaluate a candidate component on six dimensions:
        COMPONENT CANDIDATE
                 │
  ┌──────────────┼──────────────┐
  ▼              ▼              ▼
Cohesion     Ownership        Reuse
  │              │              │
  └──────────────┼──────────────┘
                 │
           ┌─────┴─────┐
           ▼           ▼
       Coupling  Change boundary
           │           │
           └─────┬─────┘
                 ▼
            Composition

A strong candidate scores meaningfully across several dimensions.
Do not demand all six.

🔥 THE CRUCIBLE
36. Challenge 1 — Where Does State Belong?
function Page() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Menu isOpen={isOpen} onOpenChange={setIsOpen} />
  );
}

Question:
Should isOpen remain in Page?

Answer:
Not necessarily.
If nothing else needs the state:
<Menu />
with internal state may be better.
The correct decision depends on ownership requirements.

37. Challenge 2 — Three Components, One Value
Page
├── SearchBox
├── SearchResults
└── SearchSummary

All need:
query

Where should the state live?
The narrowest common owner is:
Page
because all three depend on it.

38. Challenge 3 — One Component, Three Responsibilities
function Profile() {
  // fetches data
  // manages edit form
  // displays profile
}

Do not immediately split it.
Ask:
Does data coordination have a separate reason to change?
Does editing have separate state?
Does profile presentation have a stable boundary?
Can the pieces evolve independently?
Then design the decomposition.

39. Challenge 4 — Prop Drilling
A ↓ B ↓ C ↓ D
A owns:
user
Only D needs it.

Should you introduce Context?
Not automatically.
Four layers of explicit props may still be clearer than adding an implicit dependency mechanism.
The architectural question is:
Which mechanism makes ownership and dependency easiest to understand?

40. Challenge 5 — Generic Component Contamination
Given:
function Button({ order, onCancel }) {
  return (
    <button onClick={() => onCancel(order.id)}>
      Cancel
    </button>
  );
}

Identify the problem.
Button knows about:
order
cancel semantics
domain identifiers

Better:
<Button onClick={handleCancel}>
  Cancel
</Button>
The domain-specific behavior remains outside the primitive.

41. Challenge 6 — Extraction Judgment
You have:
function AccountPage() {
  return (
    <main>
      <h1>Account</h1>
      <p>
        Manage your account settings.
      </p>
    </main>
  );
}

Should you create:
AccountHeader
AccountDescription
?
Probably not.
There is no meaningful independent responsibility.
The extraction would reduce locality without adding architectural value.

42. Final Architecture Exercise
Design:
ProductPage

Requirements:
product information
quantity selection
add-to-cart
image gallery
reviews
related products

A naive design:
ProductPage
├── ProductInfo
├── Quantity
├── AddButton
├── Image
├── Thumbnail
├── ReviewText
├── ReviewAuthor
├── RelatedCard
└── RelatedCardImage

This decomposes by visual fragments.

A more responsibility-oriented design:
ProductPage
├── ProductGallery
├── ProductPurchasePanel
│   ├── QuantityControl
│   └── AddToCart
├── ProductDetails
├── ProductReviews
└── RelatedProducts

Why is this stronger?
Because the boundaries correspond more closely to:
behavior
state
domain responsibility
change boundaries

43. Completion Checklist
Component Boundaries:
[ ] I can define a meaningful component boundary.
[ ] I understand responsibility boundaries.
[ ] I distinguish visual boundaries from architectural boundaries.
[ ] I understand cohesion.
[ ] I understand coupling.
[ ] I can reason about change coupling.
[ ] I can identify independent reasons to change.
[ ] I can evaluate component granularity.

State Ownership:
[ ] I can identify state ownership.
[ ] I understand the narrowest common owner principle.
[ ] I know when state should remain local.
[ ] I know when state should move upward.
[ ] I can identify over-lifted state.
[ ] I can identify under-lifted state.
[ ] I can distinguish local interaction state from shared application state.

Decomposition:
[ ] I do not extract components merely because files are large.
[ ] I do not avoid extraction merely because components are small.
[ ] I can identify meaningful extraction signals.
[ ] I recognize over-fragmentation.
[ ] I recognize under-fragmentation.
[ ] I can use behavior as a decomposition signal.
[ ] I can use change boundaries as a decomposition signal.

Composition:
[ ] I understand composition as an architectural tool.
[ ] I can use children appropriately.
[ ] I can distinguish composition from configuration.
[ ] I can avoid wrapper proliferation.
[ ] I can keep generic components domain-independent.

Dependency Design:
[ ] I can reason about dependency direction.
[ ] I can identify domain leakage into primitives.
[ ] I can identify prop relay chains.
[ ] I understand that prop drilling is not inherently bad.
[ ] I can evaluate explicit props versus alternative communication mechanisms.

Senior Architecture:
[ ] I can design component boundaries from ownership.
[ ] I can design boundaries around coherent responsibilities.
[ ] I can reason about change isolation.
[ ] I can diagnose a god component.
[ ] I can diagnose over-fragmentation.
[ ] I can perform a component ownership audit.
[ ] I can defend a decomposition decision technically.

44. Final Engineering Principle
The goal of componentization is not:
more components
and not:
smaller files

The goal is:
CLEAR OWNERSHIP
│
▼
COHERENT RESPONSIBILITY
│
▼
STABLE API BOUNDARY
│
▼
CONTROLLED COUPLING
│
▼
LOCALIZED CHANGE

The senior engineer therefore asks:
“What responsibility deserves a boundary?”
not:
“What JSX can I extract?”

A good React component is a unit that makes the system easier to reason about.
A bad component boundary merely moves code somewhere else.

Cross-KPI Boundary
This Part establishes:
component decomposition
responsibility boundaries
state ownership
cohesion and coupling
component granularity
composition as architecture
dependency direction
change isolation

It does not deeply cover:
React element identity
reconciliation identity rules
mount/unmount mechanics
effect lifecycle
key-driven identity changes
advanced rendering behavior

Those topics belong in subsequent React fundamentals sections.
