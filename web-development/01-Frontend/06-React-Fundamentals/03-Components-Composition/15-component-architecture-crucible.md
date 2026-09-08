Level 06 — React Fundamentals
KPI 03 — Components, Props & Composition
PART 15 — Component Architecture Crucible
[⬅️ Previous Part](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/14-component-testing-and-contracts.md) | [📚 Level 06 Index](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/README.md) | [🧪 Companion Lab](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/examples/15-component-architecture-crucible.html) | [Next Part ➡️](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/16-kpi-03-final-review.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models
1. The Purpose of the Crucible
The previous Parts established individual mechanisms:
Components
Props
Callbacks
Composition
Boundaries
Identity
Keys
Lifecycle
Effects
State ownership
Context
Reuse
Testing

Senior React engineering begins when these mechanisms must be reasoned about simultaneously.
Production rarely presents:
"Here is a problem with useState."
It presents:
"When the user edits an item, changes the filter, opens a dialog, reorders the list, and the parent refreshes, the wrong draft sometimes appears in the wrong row."

That is an architectural problem.
The crucible therefore uses this model:

          PRODUCTION UI
                │
  ┌─────────────┼─────────────┐
  │             │             │
Ownership    Identity   Communication
  │             │             │
  ▼             ▼             ▼
state         keys        callbacks
  │             │             │
  └─────────────┼─────────────┘
                │
           Composition
                │
                ▼
           Dependencies
                │
                ▼
            Lifecycle
                │
                ▼
             Testing
                │
                ▼
      ARCHITECTURAL RESULT

The objective is not memorizing React APIs.
The objective is predicting the system.

2. Senior React Architecture Model
A production component tree should be understood as:
             FEATURE
                │
  ┌─────────────┼─────────────┐
  │             │             │
Owner         View        Behavior
  │             │             │
state          JSX        callbacks
  │             │             │
  └─────────────┼─────────────┘
                │
            contracts
                │
  ┌─────────────┼─────────────┐
  │             │             │
props        context       children
  │             │             │
  └─────────────┼─────────────┘
                │
             identity
                │
                ▼
              Fibers
                │
                ▼
           host output

Every architectural decision should answer:
Who owns this state?
Who owns this behavior?
Who owns this resource?
Who communicates the result?
What identifies this component occurrence?
What is the public contract?
What changes when the feature evolves?

3. The Narrowest Common Owner
When two components need to coordinate state:
Component A
Component B
find their nearest meaningful common owner.

         Common Owner
               │
        ┌──────┴──────┐
        ▼             ▼
   Component A   Component B

The owner should generally hold the minimum canonical state necessary for coordination.
Do not automatically lift state to the application root.
Do not automatically introduce Context.
Do not automatically introduce a state library.
First determine the ownership requirement.

4. The Six-Dimension Component Heuristic
For any component, evaluate:
┌──────────────────────────────┐
│ 1. STATE                     │
│ What does it own?            │
├──────────────────────────────┤
│ 2. BEHAVIOR                  │
│ What does it control?        │
├──────────────────────────────┤
│ 3. INPUT                     │
│ What does it receive?        │
├──────────────────────────────┤
│ 4. OUTPUT                    │
│ What does it communicate?    │
├──────────────────────────────┤
│ 5. IDENTITY                  │
│ What occurrence is it?       │
├──────────────────────────────┤
│ 6. LIFECYCLE                 │
│ What does it acquire/release?│
└──────────────────────────────┘

If these six dimensions are incoherent, the component boundary is probably wrong.

5. Golden Rule
Do not design React components from their JSX size. Design them from ownership, responsibility, change boundaries, and contracts.

A 300-line component can be coherent.
A 30-line component can be architecturally broken.

Layer 2 — 🔬 Deep Mechanical Breakdown
6. Scenario Framework
Every crucible scenario will be analyzed using:
PROBLEM
↓
OWNERSHIP
↓
COMPONENT TREE
↓
INPUT / OUTPUT CONTRACTS
↓
IDENTITY
↓
RENDER PASSES
↓
LIFECYCLE
↓
DEPENDENCY DISTRIBUTION
↓
TEST CONTRACT
↓
ARCHITECTURAL DECISION

This forces complete reasoning instead of API memorization.

7. Scenario 01 — Editable Product List
Requirements:
render products;
edit each product locally;
save one product;
delete one product;
reorder products;
filtering is supported;
draft values must remain attached to the correct product.

Initial implementation:
function ProductList({ products }) {
  return products.map((product, index) => (
    <ProductEditor
      key={index}
      product={product}
    />
  ));
}

Each editor owns:
draftName
draftPrice

8. First Architectural Diagnosis
There are at least two separate questions.

State ownership:
Who owns:
draftName
draftPrice
If drafts are truly local editing state:
ProductEditor
can own them.

Identity:
What identifies:
ProductEditor?
Not:
position
if products can reorder.
Identity should correspond to the domain entity.

Therefore:
key={product.id}
is the appropriate identity boundary when product.id is stable and unique among siblings.

9. Render Prediction
Initial:
A B C

Fibers conceptually correspond to:
A → Editor occurrence A
B → Editor occurrence B
C → Editor occurrence C

B enters:
draft = "new name"

Then list becomes:
C A B

With stable identity:
C → C
A → A
B → B
B retains its draft.

With index identity:
position 0 → C
position 1 → A
position 2 → B
State follows positions rather than entities.

That creates the production bug:
draft for B
↓
position previously occupied by B
↓
now occupied by another entity

10. Architectural Fix
Use:
products.map(product => (
  <ProductEditor
    key={product.id}
    product={product}
  />
))

The important principle is not:
"Always use IDs."
The principle is:
Choose a key that represents the identity whose state must be preserved.

For a genuinely static positional collection, an index can be acceptable.
For a mutable entity collection, it is usually the wrong identity.

11. Scenario 02 — Two Sibling Inputs Must Stay in Sync
Requirements:
Start date
End date

Rules:
start <= end

Current implementation:
StartInput owns start
EndInput owns end

Each sibling independently validates the relationship.
This creates duplicated knowledge.

12. Ownership Diagnosis
The invariant:
start <= end
belongs to the relationship between the two values.

Therefore the canonical state should generally move to their narrowest common owner.
DateRange owns relationship
     │
 ┌───┴───┐
 ▼       ▼
Start   End

Possible state:
start
end

Children become controlled components.

13. Why This Boundary Is Better
Before:
Start owns start
End owns end
The invariant exists nowhere authoritative.

After:
DateRange
├── start
└── end

The invariant has a single owner.
Children communicate:
onChange(nextStart)
onChange(nextEnd)

This produces:
child interaction
↓
semantic event
↓
common owner
↓
validation / state update
↓
new props
↓
children

14. Scenario 03 — Modal State Lifted Too High
Application:
App
├── Header
├── Sidebar
├── Dashboard
│   └── DeleteDialog
└── Footer

Current state:
App: isDeleteDialogOpen

But only Dashboard uses it.

Question:
Is this good architecture merely because App can access everything?
No.

The correct question is:
Which components need to coordinate this state?

If only Dashboard and DeleteDialog need it:
Dashboard └── DeleteDialog
may be the better ownership boundary.

15. Cost of Excessive State Lifting
When state moves too high:
App
│
├── unrelated component
├── unrelated component
└── state owner
the state acquires unnecessary architectural reach.

Consequences can include:
more prop paths
larger rerender surface
less locality
harder testing
unclear ownership

Do not confuse accessibility of state with correctness of ownership.

16. Scenario 04 — Prop Drilling
Tree:
App
│
└── Layout
    │
    └── Main
        │
        └── Toolbar
            │
            └── UserMenu

user is needed only by UserMenu.

Current implementation:
App ↓ Layout ↓ Main ↓ Toolbar ↓ UserMenu

Every intermediary relays:
user
without using it.
This is prop drilling.

17. Is Prop Drilling Automatically Bad?
No.
If the chain is:
Parent ↓ Child ↓ Grandchild
and the value is conceptually relevant to the boundary, explicit props may be clearer than Context.

The architectural question is:
Is this dependency meaningful at the intermediate boundaries?

If no:
composition
or:
Context
may become appropriate.

18. Composition Alternative
Instead of forcing intermediaries to know about UserMenu dependencies:
<Layout>
  <UserMenu user={user} />
</Layout>

The owner can compose the dependent UI directly.
Conceptually:
App
│
└── creates UserMenu
    │
    ▼ Layout
    │
    ▼ children

This reduces intermediary knowledge.

19. Context Alternative
If many distant consumers genuinely need the same dependency:
UserProvider
│
├── Toolbar
├── Sidebar
├── UserMenu
└── AccountPanel

Context may be appropriate.
But Context solves:
dependency distribution
not:
ownership ambiguity

The source of truth still needs to be deliberate.

20. Scenario 05 — Giant Component
Example:
CheckoutPage
├── fetches data
├── owns cart state
├── validates address
├── renders address
├── renders payment
├── handles promo codes
├── handles analytics
├── renders errors
└── submits order

Question:
Should this automatically become ten components?
No.

Component extraction should follow coherent responsibilities and change boundaries.

21. Decomposition Test
For each responsibility ask:
Does it have a different reason to change?
Does it have independent state?
Does it have a meaningful public contract?
Is it reused?
Does isolation improve reasoning?
Does testing become clearer?
Does the parent become easier to understand?

If several answers are yes, extraction is likely useful.

22. Avoid Artificial Fragmentation
Bad decomposition:
CheckoutPage
├── CheckoutHeader
├── CheckoutBody
├── CheckoutFooter
├── CheckoutTitle
├── CheckoutButtonWrapper
├── CheckoutInputWrapper
└── CheckoutText

If these components have no independent responsibility, the architecture becomes noisy.
Component count is not architectural quality.

23. Scenario 06 — Configuration Explosion
Component:
<Modal
  title="Delete?"
  showCloseButton
  closeOnOverlayClick
  closeOnEscape
  centered
  large
  danger
  compact
  footerAlign="right"
  headerAlign="left"
  loading
  destructive
  ...
/>

The problem is not the number of props alone.
The question is:
Does the API still represent a coherent concept?

24. Configuration vs Composition
Instead of:
<Modal
  showHeader
  showFooter
  footerButtons
  headerIcon
  customBody
  ...
/>

composition can expose structure:
<Modal>
  <Modal.Header />
  <Modal.Body />
  <Modal.Footer />
</Modal>

Now structure is represented directly.
This can reduce boolean/configuration explosion.

25. Scenario 07 — Context as a Global Garbage Bin
Bad architecture:
AppContext
├── user
├── theme
├── modal
├── cart
├── search
├── notifications
├── temporaryFormState
├── selectedRow
├── feature flags
└── random UI values

The problem is not technically "too much Context."
The deeper problem is:
unrelated ownership domains
↓
single dependency boundary

This makes ownership opaque.

26. Context Should Follow Domain Boundaries
Prefer conceptually:
AuthProvider
ThemeProvider
FeatureProvider
when those represent meaningful dependency domains.

Even then, ask:
Who owns the actual state?
Who needs to consume it?
What is the lifetime?
What is the scope?

27. Scenario 08 — Child Owns State That Parent Needs
Suppose:
Accordion
├── Section A
├── Section B
└── Section C

Each section independently owns:
open

Requirement:
Only one section can be open.

Now sibling state is constrained by a cross-sibling invariant.
Independent ownership is insufficient.

28. Correct Ownership
Move canonical selection to:
Accordion

Example conceptual state:
openSectionId

Then:
Accordion
├── Section A
├── Section B
└── Section C

Each section receives:
isOpen
onToggle

Now the invariant:
at most one open
has one authoritative owner.

29. Scenario 09 — Accidental Reset
Consider:
function Parent({ user }) {
  return (
    <Editor key={user.version} />
  );
}

Every server refresh increments:
user.version

The editor remounts.
Local draft disappears.

The test may show:
type draft → refresh parent → draft disappears

30. Diagnosis
The issue is not:
"React randomly lost state."

The issue is:
identity boundary changed

The key communicates:
This is a different component identity.

If that is not intended, the key is architecturally wrong.

31. Scenario 10 — Intentional Reset
Now consider:
<Editor key={documentId} />

Switching:
Document A → Document B
should reset document-local editing state.

Here the identity boundary is intentional.
Same mechanism:
key changes
Different architectural meaning.

This is why:
A key is not merely a warning-suppression mechanism. It is part of identity architecture.

32. Scenario 11 — Effect Used for Derived State
Bad pattern:
const [fullName, setFullName] = useState("");

useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

The value is synchronously derivable.
The architecture now contains:
firstName
lastName
fullName
instead of:
firstName
lastName

33. Better Model
Compute:
const fullName = `${firstName} ${lastName}`;

Now:
canonical state ↓ derived projection
instead of:
canonical state ↓ effect synchronization ↓ duplicated state

The test should verify the output, not the existence of an effect.

34. Scenario 12 — Resource Ownership
Component:
ChatRoom
opens:
WebSocket

Who owns the connection?
If the connection belongs to the ChatRoom lifecycle:
mount → connect
unmount / room change → disconnect

The effect/resource boundary should align with ownership.
If the connection belongs to the entire application session, putting it inside every ChatRoom may be the wrong boundary.

35. Ownership Is More Important Than Hook Choice
The senior question is not:
"Should I use useEffect?"
First ask:
"Who owns this external resource and what is its lifetime?"

Then the React mechanism follows.

36. Scenario 13 — Testing the Wrong Boundary
Component:
DeleteButton

Contract:
onDelete(id)

Bad test:
inspect internal click handler
assert exact function implementation

Better:
activate button → onDelete(id)

The test now protects the API boundary.

37. Scenario 14 — Reuse Before Semantics
Two components:
InvoiceCard
SubscriptionCard
look visually similar.

A developer creates:
UniversalCard
with:
15 configuration props

The visual similarity was real.
The semantic similarity was not.
This is abstraction driven by syntax rather than domain responsibility.

38. Senior Refactoring
Ask:
What knowledge do both components share?
What behavior changes together?
What contract should consumers depend on?
What should remain domain-specific?

Potential result:
Shared: CardSurface
while:
InvoiceCard
SubscriptionCard
remain domain components.

Reuse the stable concept, not merely repeated markup.

39. Scenario 15 — Component Boundary Through Change Propagation
Suppose a requirement changes:
Product pricing rules change.

Affected code:
ProductCard
Checkout
OrderSummary
SearchResult
RecommendationCard

If every component contains its own pricing transformation, the change propagates everywhere.
This is a sign of duplicated domain knowledge.

The solution is not necessarily a shared UI component.
It may be a shared domain-level abstraction.

This distinction is critical:
UI reuse ≠ domain knowledge reuse

40. Scenario 16 — Parent Re-render
Parent state:
counter

Child:
ProfileCard

Parent increments counter.

Question:
Does ProfileCard automatically lose its state?
No.

A parent render does not inherently mean child identity is destroyed.
React reconciles the resulting tree.
If the child occurrence remains compatible in identity and structure, its state can be preserved.

41. Render Prediction
Initial:
Parent state = 0
Child state = "draft"

Parent updates:
Parent state = 1

New tree:
Parent └── Child
same child type/key/contextual position.

Expected:
Child state = "draft"

This is different from:
Child removed
or:
Child identity changed

42. Scenario 17 — Conditional Structure
Consider:
{mode === "edit" ? <Editor /> : <Viewer />}

When:
edit → view
the resulting component type changes.
The identity relationship changes accordingly.
Local Editor state should not be assumed to transfer to Viewer.

This is a component architecture decision, not merely a conditional-rendering detail.

43. Scenario 18 — Nested Component Definition
Problem:
function Parent() {
  function Child() {
    const [value, setValue] = useState("");
    return <input value={value} onChange={...} />;
  }

  return <Child />;
}

The Child function is recreated during Parent's render.
That can create an unstable component type identity.
The resulting behavior may include state resets.

Senior diagnosis:
component type identity ↓ not stable ↓ unexpected remount behavior

Move stable component definitions outside when they are intended to represent stable component types.

44. Scenario 19 — Component API With Raw Domain Object
API:
<UserCard user={user} />

Question:
Is passing the entire domain object appropriate?
Sometimes.

But if the component only needs:
name
avatar
role
then exposing the entire domain object couples the UI component to the domain shape.

Potential API:
<UserCard
  name={user.name}
  avatar={user.avatar}
  role={user.role}
/>
or an intentionally designed view model.

The correct answer depends on the boundary.
Do not apply one universal rule.

45. Scenario 20 — Prop Explosion
Component:
<Table
  title={...}
  rows={...}
  loading={...}
  error={...}
  onRetry={...}
  onSort={...}
  onFilter={...}
  showToolbar={...}
  showFooter={...}
  ...
/>

The question is not:
"How many props are too many?"
The better questions:
Are these concerns cohesive?
Do they change together?
Are consumers using unrelated subsets?
Can composition represent structure more clearly?
Is this component becoming a feature container rather than a reusable primitive?

Prop count is a symptom, not a diagnosis.

46. Scenario 21 — Component as a State Machine
Consider a payment form:
idle
↓ submit
submitting
↓ success
success
submitting
↓ failure
error
↓ retry
submitting

Do not scatter ownership:
isLoading
isSuccess
hasError
canRetry
without considering invalid combinations.

Possible impossible state:
isLoading = true
isSuccess = true
hasError = true

A coherent state model matters.
The exact implementation may use multiple booleans or another representation, but the conceptual state machine must remain coherent.

47. Test the Valid State Transitions
Test:
idle → submitting → success
and:
idle → submitting → error → retry → submitting

Do not merely test:
spinner exists

The transition itself is the behavior.

48. Scenario 22 — Callback Semantic Design
Weak:
onAction(event)

Consumer must understand:
DOM event structure

Better:
onSelect(itemId)

Now the component communicates domain-relevant intent.
The abstraction boundary becomes:
DOM mechanism
↓
component
↓
semantic event
↓
consumer

This is a powerful reusable-component design pattern.

49. Scenario 23 — Setter Leakage
Bad API:
<Child setValue={setValue} />

The child now knows:
parent's state mutation mechanism

This exposes ownership internals.

Prefer:
<Child value={value} onChange={handleChange} />

The child receives a semantic capability.

50. Why Semantic Callbacks Matter
Compare:
setSelectedId
with:
onSelect

The first exposes implementation.
The second exposes intent.
A semantic callback creates a cleaner contract.

51. Scenario 24 — Shared Object Mutation
Parent:
const user = { name: "A" };

Child:
user.name = "B";

The child has mutated data it does not own.
Now ownership is ambiguous.

Possible consequences:
hidden state changes
unexpected sibling behavior
difficult debugging
broken assumptions about immutability

The architectural rule:
A component should not silently mutate data owned by another component.

52. Scenario 25 — Composition as Dependency Inversion
Instead of:
List knows Toolbar knows Filter knows Button

compose:
<List
  toolbar={<ProductToolbar />}
  emptyState={<EmptyProducts />}
/>

The List owns:
list mechanics
while the consumer owns:
toolbar meaning
empty-state meaning

This is inversion of control through composition.

53. Scenario 26 — Test Boundary Selection
Given:
ProductPage
├── ProductList
│   └── ProductRow
└── DeleteDialog

Question:
Where should deletion behavior be tested?

Potentially:
ProductRow → emits onDelete(id)
ProductPage → responds to deletion
Integration → user deletes product and product disappears

Each test protects a different contract.
Avoid duplicating all three responsibilities in every test.

54. Scenario 27 — Failure Propagation
Suppose:
ProductRow onDelete(id)
↓
ProductPage deleteProduct(id)
↓
server

Server deletion succeeds, but UI does not update.

Trace:
user
↓
row callback
↓
page handler
↓
server request
↓
state update
↓
render
↓
DOM

Find where the contract chain breaks.
This is the React architectural debugging model.

55. Scenario 28 — Unrelated Parent Update
A modal contains a form.
Parent also owns:
notificationCount

Parent updates notification count.

Question:
Should the form draft disappear?
No, unless the architecture intentionally remounts or resets the form.

If it disappears, investigate:
key
component definition
conditional structure
state ownership
controlled value
provider boundary

Do not blame "rerendering."

56. Scenario 29 — Provider Remount
Tree:
App
└── Provider
    └── Feature

Provider owns:
selectedTab

A parent change causes Provider itself to be recreated in a way that changes its identity.

Result:
provider state resets
Consumers appear to "randomly lose state."

The real issue is provider identity/lifetime.

57. Scenario 30 — Choosing Between Props, Composition, and Context
Use this decision sequence:
Does only one direct child need it?
 │
YES ↓ props
NO  ↓
Can composition remove intermediary knowledge?
 │
YES ↓ composition
NO  ↓
Do multiple scoped descendants need it?
 │
YES ↓ Context
NO  ↓
Re-evaluate ownership

Context should not be the automatic answer to every prop chain.

Layer 3 — 🧪 Diagnostic Labs & Profiling
58. Lab — Architecture Mapping
For any production component, create:
Component: _________________________
Canonical state: _________________________
Derived values: _________________________
External resources: _________________________
Inputs: _________________________
Outputs: _________________________
Callbacks: _________________________
Context: _________________________
Identity: _________________________
Reset boundaries: _________________________
Composition points: _________________________
Tests: _________________________

Then identify the first architectural inconsistency.

59. Lab — Render Timeline
For every stateful scenario, record:
Trigger
↓
Render
↓
Reconciliation
↓
Commit
↓
DOM
↓
Passive effects

For example:
click Save
↓
handler
↓
state update
↓
render
↓
new element tree
↓
reconciliation
↓
commit
↓
button/UI changes
↓
passive synchronization if applicable

This prevents the common mistake of treating render as DOM mutation.

60. Lab — Fiber Identity Investigation
In React DevTools:
[ ] locate component
[ ] inspect component tree
[ ] inspect props
[ ] inspect state
[ ] trigger update
[ ] inspect state preservation
[ ] reorder list
[ ] inspect which occurrence retains state

The goal is not manipulating Fiber internals.
The goal is learning to connect:
component identity → state preservation → observable behavior

61. Lab — Component Highlighting
Enable development render diagnostics.

Perform:
[ ] parent-only state update
[ ] child state update
[ ] sibling update
[ ] context update
[ ] list reorder
[ ] conditional mount/unmount

Record:
Which components rendered?
Which state changed?
Which identity changed?
Which DOM output changed?

This gives you a runtime map of ownership.

62. Lab — Production Incident Reconstruction
Take a real bug or construct:
"Typing into row B, then sorting the table, moves the draft into row A."

Write:
Initial tree
State ownership
Keys
Render #1
Interaction
Render #2
Sort
Render #3
Identity mapping
Final DOM

Then identify:
Root cause
Contract violated
Architectural correction
Regression test

63. Lab — Component API Review
For a component API, score:
Semantic clarity /5
Ownership clarity /5
Composition support /5
Prop coherence /5
Dependency clarity /5
Identity behavior /5
Testability /5

Total: ____ / 35

Do not treat the numerical score as scientific.
Use it to force explicit reasoning.

64. Lab — Change Propagation Test
Choose a hypothetical requirement:
"The product now supports archived products."

Trace:
Which components change?
Which props change?
Which callbacks change?
Which state changes?
Which Context changes?
Which tests change?
Which shared abstractions change?

Then ask:
Could a better boundary reduce unrelated changes?
This is architecture evaluation through change propagation.

Layer 4 — 🔥 The Crucible
65. Crucible A — Design a Search Feature
Requirements:
search input;
filter chips;
result list;
selected result;
loading state;
empty state;
error state.

You must decide:
Who owns query?
Who owns selected result?
Who owns loading?
Who owns error?
Which values are derived?
Which values need Context?
Where should callbacks terminate?

A strong design may look conceptually like:
SearchPage
├── query
├── selectedId
├── request state
│
├── SearchInput
├── FilterBar
└── Results
    ├── ResultRow
    └── Empty/Error/Loading

Do not prematurely introduce global state.

66. Crucible B — Editable Table
Requirements:
100 rows;
editable quantity;
row reorder;
delete;
server refresh;
unsaved drafts must remain attached to rows.

Decide:
state ownership
keys
controlled/uncontrolled boundaries
refresh behavior
identity
callback payload
testing strategy

Critical invariant:
draft belongs to entity, not row position.

67. Crucible C — Multi-Step Checkout
States:
cart
address
payment
confirmation

Question:
Which state belongs to the checkout flow and which belongs locally to each step?

Reason about:
step-local state
flow state
server state
derived state
identity
unmount behavior

Do not keep every value at the highest possible level.

68. Crucible D — Dialog Architecture
Requirements:
reusable Dialog primitive;
feature-specific DeleteDialog;
confirmation button;
async deletion;
loading state;
error state.

Design:
Dialog └── structural/composition responsibility
DeleteDialog └── deletion-domain responsibility

Do not turn the generic Dialog into:
delete
archive
warning
payment
authentication
with dozens of domain-specific flags.

69. Crucible E — Context Decision
Scenario:
Theme
Authenticated user
Current organization
Current page filter
Selected product
Temporary dialog state

Which belong in Context?
There is no automatic answer.

Evaluate:
scope
lifetime
consumer count
dependency distribution
ownership
change frequency
semantic domain

Possible result:
Theme → Context
Auth → Context
Organization → Context
Filter → local/feature state
Selected product → feature state
Dialog → local/feature state

The important skill is the reasoning, not memorizing this exact allocation.

70. Crucible F — Reuse Decision
Two components share:
padding
border
header layout
footer layout
but have different:
domain behavior
state
actions
data
lifecycle

Should they become one component?
Not necessarily.

Extract stable visual primitives if useful:
Surface
Header
Footer
while preserving domain components.

71. Crucible G — Testing Architecture
Given:
Modal
DeleteDialog
ProductPage

Define tests:
Modal:
composition
open/close behavior
accessibility

DeleteDialog:
confirmation callback contract
loading/error states

ProductPage:
delete flow integration

Avoid testing:
Modal's internal implementation
inside every ProductPage test.

72. Crucible H — Incident: Wrong Draft
Symptom:
User edits B.
User sorts.
Draft appears under A.

Potential causes:
index keys
unstable IDs
duplicate IDs
component remount
state stored at wrong level

Required investigation:
1. inspect key strategy
2. inspect entity identity
3. inspect render sequence
4. inspect state ownership
5. reproduce reorder
6. verify state/entity association
7. add regression test

73. Crucible I — Incident: State Disappears
Symptom:
User enters form data.
Unrelated parent update.
Form resets.

Investigate:
[ ] key changes
[ ] component type changes
[ ] nested component definition
[ ] conditional structure
[ ] provider remount
[ ] controlled value overwritten
[ ] state actually owned elsewhere

The phrase:
"Parent rerender reset the state"
is not a sufficient diagnosis.
Find the identity or ownership change.

74. Crucible J — Incident: Callback Wrongly Coupled
A reusable component exposes:
onClick={(event) => ...}
but consumers actually need:
item ID

Different consumers interpret the DOM event differently.
Refactor toward:
onSelect(item.id)
when semantic selection is the actual contract.
Test exact payload.

75. Crucible K — Incident: Context Everywhere
The application has:
12 Context providers
and developers cannot determine where state is owned.

Audit:
Provider ↓ state ↓ consumers ↓ lifetime ↓ scope

For every Context ask:
Is this truly a distribution problem?
Could props solve it?
Could composition solve it?
Is ownership located elsewhere?
Is the scope too broad?

76. Crucible L — Refactor Without Behavior Change
Take:
GodComponent
and split it into:
FeatureContainer
Form
Summary
Actions

Requirements:
behavior unchanged
state semantics unchanged
callback contracts unchanged
identity unchanged where intended
tests remain meaningful

This is the real component architecture exercise.

77. Senior-Level Prediction Challenge
Consider:
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>
        {count}
      </button>
      <Child />
    </>
  );
}

And:
function Child() {
  const [draft, setDraft] = useState("hello");

  return (
    <input
      value={draft}
      onChange={e => setDraft(e.target.value)}
    />
  );
}

Predict:
Render #1:
Parent count = 0
Child draft = hello

User types: world
Render #2:
Child draft = world
Parent count = 0

Parent button clicked.
Render #3:
Parent count = 1
Child draft = world

Why?
Because:
Parent rerender ≠ Child identity destruction

78. Senior-Level Prediction Challenge — Key Change
<Editor key={documentId} />

Render #1:
documentId = A
draft = "hello"

Render #2:
documentId = B

Expected:
new identity → new local state → initial draft for B

This is different from an ordinary parent rerender.

79. Senior-Level Prediction Challenge — Context
Tree:
Provider A
└── Parent
    └── Provider B
        └── Child

Child consumes context.
Which value?
Provider B
because the nearest applicable provider establishes the dependency for that consumer.

The important architecture lesson:
Context scope is determined structurally.

80. Senior-Level Prediction Challenge — Controlled Input
Parent: value = "A"
Child: value="A" onChange=handler

User types B.
Child emits:
"A B" or the actual resulting input value
depending on the event.

Parent accepts it.
Child receives new props.
The child should not independently become the canonical source.
This is the controlled protocol.

81. Senior-Level Prediction Challenge — Composition
Given:
<Panel>
  <DeleteButton />
</Panel>

Panel should not need to know:
DeleteButton's domain meaning

Panel owns:
panel structure
The consumer owns:
what content belongs inside

This is composition-based inversion of control.

82. Senior-Level Prediction Challenge — State Ownership
Given:
Sibling A
Sibling B
both must obey:
only one selected

Independent local state is insufficient.
The common owner must represent the shared invariant.

The question is not:
"How do I synchronize two states?"
The better question is:
"Why are there two canonical states representing one invariant?"

83. Senior Architecture Review Matrix
Question | Weak Answer | Senior Answer
--- | --- | ---
Where should state live? | Highest parent | Narrowest owner that needs it
When should Context be used? | Prop drilling | Scoped dependency distribution
Why use keys? | Remove warnings | Preserve/reset identity intentionally
Why extract component? | File too large | Responsibility/change boundary
Why reuse? | JSX is duplicated | Stable knowledge/contract is shared
How test callbacks? | Called | Correct semantic payload
How test state? | Inspect hook | Observe transition/result
How debug reset? | Parent rerendered | Find identity/lifetime change
How design APIs? | Maximum flexibility | Minimum coherent contract
How use composition? | Avoid props | Invert structural ownership
How mock dependencies? | Mock everything | Isolate meaningful external boundaries
How test accessibility? | Optional | Contractual user behavior
How manage shared state? | Global store | Deliberate ownership and scope

84. Production Architecture Checklist
Before shipping a complex component tree:
[ ] Every state value has a clear owner.
[ ] Derived values are not unnecessarily duplicated as state.
[ ] Shared invariants have a common owner.
[ ] Children do not mutate parent-owned data.
[ ] Callback APIs communicate semantic intent.
[ ] Setter functions are not leaked unnecessarily.
[ ] Keys represent actual identity.
[ ] Index keys are justified where used.
[ ] Identity resets are intentional.
[ ] Effects own clearly defined external resources.
[ ] Cleanup corresponds to resource lifetime.
[ ] Context represents meaningful dependency distribution.
[ ] Providers have deliberate scope.
[ ] Composition is used where structural inversion helps.
[ ] Generic components do not contain domain-specific behavior.
[ ] Reuse follows shared knowledge rather than visual similarity.
[ ] Component boundaries follow responsibility/change boundaries.
[ ] Tests protect public behavior.
[ ] Tests verify callback payloads.
[ ] Controlled contracts are tested.
[ ] Accessibility contracts are tested.
[ ] Identity-sensitive behavior has regression coverage.
[ ] Large snapshots are avoided unless justified.
[ ] Internal React implementation is not treated as application contract.

85. The Ultimate Component Review
For every component, answer:

Ownership:
What does it own?
What must it never own?

Inputs:
What does it need?
Are those inputs minimal?

Outputs:
What does it expose?
Are outputs semantic?

State:
What is canonical?
What is derived?
What must be shared?

Identity:
What represents one occurrence?
When should state persist?
When should it reset?

Composition:
What should consumers control?
What should this component control?

Dependencies:
Which dependencies are explicit?
Which are contextual?
What is the scope?

Lifecycle:
What resources are acquired?
Who owns them?
When are they released?

Reuse:
What knowledge is actually shared?
Is the abstraction coherent?

Testing:
What promise must never break?
Which observable behavior proves it?

86. The Senior Refactoring Algorithm
When you encounter a problematic React component:
STEP 1: Map responsibilities
↓
STEP 2: Map state ownership
↓
STEP 3: Map communication
↓
STEP 4: Map identity
↓
STEP 5: Map dependencies
↓
STEP 6: Map lifecycle
↓
STEP 7: Identify duplicated knowledge
↓
STEP 8: Identify unstable contracts
↓
STEP 9: Choose boundaries
↓
STEP 10: Write behavioral regression tests
↓
STEP 11: Refactor
↓
STEP 12: Re-run contract tests

This prevents random component extraction.

87. The "Delete Test"
After extracting a component, ask:
If I delete this component boundary, what architectural capability disappears?

If the answer is:
nothing
the extraction may be artificial.

A meaningful component should provide something:
ownership
encapsulation
reuse
composition
test boundary
change isolation
semantic API

88. The "Consumer Blindness" Test
For a reusable component:
Can consumers use it without understanding its implementation?

Good:
<DatePicker value={date} onChange={setDate} />

Consumer should not need to know:
useState
useEffect
DOM structure
internal handlers

This is abstraction working correctly.

89. The "Change Boundary" Test
Ask:
If requirement X changes, which files should change?

If:
pricing rule
changes and 15 unrelated UI components require modifications, investigate duplicated domain knowledge.

If:
button border radius
changes and 15 domain components require modifications, investigate styling abstraction.

The goal is not minimum files.
The goal is:
Change propagation that matches responsibility boundaries.

90. The "Identity Boundary" Test
For every stateful occurrence:
What entity does this state belong to?

Examples:
draft → document
selection → product
expanded state → accordion section
form state → form instance
dialog state → dialog instance

Then ensure React identity reflects the intended ownership.
This is one of the most important senior-level React reasoning skills.

91. The "State Canonicality" Test
For every state value:
Is this canonical?
If no:
Can it be derived?
If yes:
Who needs it?
Then:
Where is the narrowest owner?

This eliminates a large class of synchronization bugs.

92. The "Semantic API" Test
For every callback:
What happened?

Prefer:
onSelect(id)
onRemove(id)
onSubmit(data)
onChange(value)
onCancel()

when these represent the real semantic events.
Avoid unnecessarily exposing:
setState
DOM implementation
internal event details
unless those are intentionally part of the contract.

93. The "Contract Test" Test
For every test ask:
What production failure would this test catch?

If the answer is unclear:
the test may not be valuable.

For every implementation detail ask:
Can this change without changing consumer behavior?
If yes:
ordinary contract tests should not depend on it.

94. KPI 03 Master Mental Model
The entire KPI can now be compressed to:
          REACT COMPONENT
                 │
   ┌─────────────┼─────────────┐
   │             │             │
 INPUT         STATE        OUTPUT
   │             │             │
 props         owner       UI/events
   │             │             │
   └─────────────┼─────────────┘
                 │
           COMPONENT API
                 │
   ┌─────────────┼─────────────┐
   │             │             │
composition   context      callbacks
   │             │             │
   └─────────────┼─────────────┘
                 │
              identity
                 │
                 ▼
               Fiber
                 │
                 ▼
           render/commit
                 │
                 ▼
           browser output
                 │
                 ▼
              effects
                 │
                 ▼
          external world

Architecture asks:
Who owns each boundary?

React asks:
How does that boundary render and update?

Testing asks:
What contract proves the boundary is correct?

95. KPI 03 Completion Checklist
Components:
[ ] I can distinguish component type, element, Fiber, and DOM node.
[ ] I can identify component occurrences.
[ ] I can define meaningful component boundaries.
[ ] I can reason about responsibility and cohesion.
[ ] I can identify over-fragmentation.
[ ] I can identify god components.

Props:
[ ] I can design coherent prop APIs.
[ ] I understand primitive/object/function/element props.
[ ] I can reason about defaults.
[ ] I can design semantic callback contracts.
[ ] I can avoid setter leakage.
[ ] I can identify prop explosion.

Communication:
[ ] I understand data-down/event-up.
[ ] I can lift state when siblings share invariants.
[ ] I can distinguish DOM events from component events.
[ ] I can design semantic payloads.
[ ] I understand callback ownership.

Composition:
[ ] I understand children as a composition mechanism.
[ ] I can use element props/slots appropriately.
[ ] I can recognize inversion of control.
[ ] I can reduce intermediary knowledge with composition.
[ ] I can distinguish composition from configuration.

Identity:
[ ] I understand component identity.
[ ] I understand state preservation.
[ ] I understand keys as identity hints.
[ ] I can distinguish stable keys from positional keys.
[ ] I can intentionally create reset boundaries.
[ ] I can diagnose accidental remounts.
[ ] I understand nested component-definition hazards.

Lifecycle:
[ ] I understand mount/update/unmount.
[ ] I distinguish render from commit.
[ ] I understand effects as synchronization.
[ ] I can identify resource ownership.
[ ] I can reason about cleanup.

State Ownership:
[ ] I can identify canonical state.
[ ] I can eliminate unnecessary duplicated state.
[ ] I can derive values instead of synchronizing them.
[ ] I can locate the narrowest common owner.
[ ] I can distinguish local and shared state.
[ ] I can reason about controlled/uncontrolled boundaries.

Context:
[ ] I understand Context as dependency distribution.
[ ] I understand provider scope.
[ ] I understand nearest-provider behavior.
[ ] I know when composition may be preferable.
[ ] I can recognize Context misuse.

Reuse:
[ ] I distinguish duplication from duplicated knowledge.
[ ] I understand premature abstraction.
[ ] I can recognize universal-component failure.
[ ] I can preserve domain boundaries.
[ ] I can evaluate shared components as architectural assets.

Testing:
[ ] I test public behavior.
[ ] I test callback payloads.
[ ] I test controlled contracts.
[ ] I test composition contracts.
[ ] I test accessibility.
[ ] I test identity-sensitive behavior where required.
[ ] I avoid implementation-detail coupling.
[ ] I use mocks at meaningful boundaries.
[ ] I can diagnose failing tests as contract violations.

Architecture:
[ ] I can trace ownership through a component tree.
[ ] I can predict multi-render behavior.
[ ] I can trace change propagation.
[ ] I can diagnose state-reset incidents.
[ ] I can diagnose wrong-entity state bugs.
[ ] I can design component APIs.
[ ] I can choose between props, composition, and Context.
[ ] I can refactor a component tree without changing its contract.

96. Final Senior Engineering Principle
React component architecture is not primarily about deciding:
"What component should I create?"

It is about deciding:
"What responsibility, state, behavior, identity, dependency, and contract belong together?"

A strong architecture produces:
clear ownership + coherent contracts + stable identity + controlled communication + deliberate composition + testable boundaries

A weak architecture produces:
duplicated state + prop leakage + giant components + universal components + random Context + unstable keys + hidden dependencies + brittle tests

The senior engineer's job is not to maximize component count.
It is not to eliminate every prop.
It is not to use Context everywhere.
It is not to abstract every duplicate.
It is not to test every implementation detail.

The job is to create coherent boundaries whose ownership, identity, communication, lifecycle, and contracts remain understandable as the system changes.

The highest-quality React component tree is the one where responsibility has a clear owner, communication has a clear contract, identity has a clear meaning, and every important production behavior can be explained render by render.

97. KPI 03 Final Boundary
KPI 03 establishes the complete fundamentals of:
Components
↓
Props
↓
Communication
↓
Composition
↓
Boundaries
↓
Identity
↓
Lifecycle
↓
State Ownership
↓
Context
↓
Reuse
↓
Testing
↓
Architecture

The next material should not simply repeat these concepts.
The next KPI should build on them.

At that point, the learner should already be able to answer:
Who owns this?
Why is this here?
What does this component promise?
What identifies this occurrence?
What happens on the next render?
What happens when identity changes?
How does data move?
How does the user action propagate?
What external resource is synchronized?
What should the test guarantee?
Where will the next requirement change land?

If those questions can be answered precisely, the engineer has moved beyond "knowing React components" into reasoning about React component architecture.
