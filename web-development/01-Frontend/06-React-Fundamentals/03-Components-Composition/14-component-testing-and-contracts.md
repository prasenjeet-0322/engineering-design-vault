Level 06 — React Fundamentals
KPI 03 — Components, Props & Composition
PART 14 — Component Testing & Contracts
[⬅️ Previous Part](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/13-component-reuse-and-abstraction.md) | [📚 Level 06 Index](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/README.md) | [🧪 Companion Lab](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/examples/14-component-testing-and-contracts.html) | [Next Part ➡️](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/15-component-architecture-crucible.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models
1. The Core Question
Component testing is not primarily about proving that React rendered some JSX.
The senior-level question is:
Does this component preserve the behavioral contract that its consumers depend upon?

A component is an architectural boundary.
Its tests should therefore protect that boundary.

         COMPONENT CONTRACT
  │ ┌───────────────┼────────────────┐
  │ │               │                │
  │ INPUTS       BEHAVIOR         OUTPUTS
  │ │               │                │
  │ props         events          rendered UI
  │ children      state           accessibility
  │ context       transitions     callbacks
  │ │               │                │
  │ └───────────────┼────────────────┘
  │
  ▼
  TEST BOUNDARY
  │
  ┌─────────┴─────────┐
  │                   │
User-observable   Consumer-observable
  behavior            contract

A strong component test asks:
Given contract-valid inputs
↓
when the consumer/user performs an action
↓
the component reaches the correct observable state
↓
and communicates the correct result

A weak test asks:
Did useState get called?
Did this internal function execute?
Did this implementation-specific class appear?
Did React produce exactly this snapshot?

The second category is usually coupled to implementation rather than architecture.

Executive Concept Table
Concept | Core Mechanism | Production Impact | Common Senior Trap
--- | --- | --- | ---
Component contract | Observable inputs, behavior, outputs | Defines what consumers can safely rely upon | Testing internals instead of contract
Behavioral testing | Exercise behavior through public surface | Tests survive refactoring | Treating implementation details as behavior
Props contract | Inputs supplied by parent | Prevents invalid assumptions | Testing destructuring rather than semantics
Callback contract | Child communicates events/data upward | Preserves ownership boundaries | Only asserting callback invocation without payload semantics
Children contract | Parent supplies structure/content | Enables composition | Snapshotting arbitrary child trees
Controlled component | Parent owns canonical value | Enables predictable orchestration | Testing internal state rather than controlled behavior
Uncontrolled component | Component owns local state | Simplifies isolated usage | Failing to test default → interaction → output lifecycle
Context contract | Dependency supplied through provider | Enables scoped dependency distribution | Testing provider internals
Accessibility contract | Semantic/interactive behavior exposed to users | Prevents inaccessible UI | Treating accessibility as styling
Identity contract | State persists/reset according to identity | Prevents destructive UI bugs | Assuming every render should preserve state
Snapshot | Serialized rendered structure | Useful for narrow stable structures | Using snapshots as primary behavior tests
Mock | Replacement dependency | Isolates external behavior | Mocking React itself or component internals
Test boundary | Deliberate scope of verification | Controls brittleness | Testing an entire application as one component test
Failure diagnosis | Trace observable contract failure | Reduces debugging time | Fixing test instead of understanding component

Golden Rule
Test the component from the outside in: provide the inputs a consumer can provide, perform the interactions a consumer can perform, and assert the outcomes a consumer can observe.

The closer a test is to the public contract, the more architectural signal it provides.

2. The Four-Layer Component Contract
For senior-level React work, model a component contract across four dimensions:
┌──────────────────────┐
│  COMPONENT CONTRACT  │
└──────────┬───────────┘
           │
 ┌─────────┴───────────┬────────────────────┐
 │                     │                    │
 ▼                     ▼                    ▼
INPUTS              BEHAVIOR             OUTPUTS
 │                     │                    │
 props               actions              rendered UI
 children            transitions          callback payload
 context             state changes        accessibility
 │                     │                    │
 └─────────────────────┼────────────────────┘
                       │
                       ▼
              LIFECYCLE / IDENTITY
                       │
                       ▼
              preservation / reset

A complete test strategy asks:

Input contract
Can the component correctly consume:
required props?
optional props?
primitive values?
objects?
callback functions?
React elements?
children?
contextual dependencies?

Behavioral contract
Does it correctly respond to:
clicks?
typing?
selection?
submission?
opening?
closing?
cancellation?
validation?
controlled value changes?

Output contract
Does it expose:
correct visible state?
correct semantic structure?
correct callback?
correct callback payload?
correct disabled/loading state?
correct accessibility relationship?

Identity/lifecycle contract
Does it correctly:
preserve state when identity remains stable?
reset state when explicitly required?
clean up owned resources?
preserve controlled values across parent renders?
avoid accidental remount behavior?

3. The Public-Surface Principle
Consider:
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}

A consumer does not care that:
useState exists
setCount exists
the state variable is called count
the callback is an arrow function
the implementation uses one state hook

The consumer cares that:
initially → Count: 0
click → Count: 1
click → Count: 2

Therefore:
Implementation
│
├── useState
├── closure
├── handler
└── JSX
│
▼ observable contract
│
▼ test

The test should usually target the bottom of this chain.

4. Test What Cannot Be Safely Changed
A useful senior heuristic:
If a developer can refactor the implementation without changing the component's public behavior, the test should ideally continue passing.

For example:
Implementation A:
const [open, setOpen] = useState(false);

Implementation B:
const [state, dispatch] = useReducer(reducer, initialState);

If both implementations expose identical behavior, a good behavioral test should pass against both.
That is desirable.
It means the test protects the contract rather than the implementation.

5. Testing Is Not Validation of Every Line
A component with:
100 lines of implementation
does not automatically require:
100 lines of tests
Nor does 100% line coverage guarantee meaningful verification.

Consider:
Line coverage ≠ Behavior coverage ≠ Contract coverage ≠ Architecture confidence

A senior engineer asks:
Which behaviors would cause a production incident if they changed?
Those behaviors deserve strong tests.

6. The Component Testing Mental Model
Use this sequence:
ARRANGE
↓ Contract-valid inputs
RENDER
↓ OBSERVE initial contract
ACT
↓ User/consumer action
RENDER / COMMIT
↓ OBSERVE new contract
ASSERT
↓ Contract preserved?

The critical distinction:
rendering the component ≠ testing the component

Rendering establishes the initial state.
Interaction establishes behavior.
Assertions verify the contract.

7. The React Runtime Connection
At runtime:
Test
│
│ render(<Component ... />)
▼
React Element
│
▼ Fiber
│
▼ Render
│
▼ Reconciliation
│
▼ Commit
│
▼ Host DOM
│
▼ Test observes public UI

When an interaction occurs:
User event
↓
event handler
↓
state update / callback
↓
React update
↓
render
↓
reconciliation
↓
commit
↓
observable UI

A test should normally observe the result of this pipeline rather than manually reproducing its internal mechanics.

8. Why Implementation-Detail Tests Become Expensive
Suppose:
function Toggle({ onChange }) {
  const [enabled, setEnabled] = useState(false);

  function handleClick() {
    setEnabled(prev => !prev);
    onChange(!enabled);
  }

  return (
    <button onClick={handleClick}>
      {enabled ? "Enabled" : "Disabled"}
    </button>
  );
}

A brittle test might attempt to verify:
useState called with false
handleClick exists
setEnabled called
specific internal function executed

But the implementation could later become:
useReducer
or:
external state adapter
while preserving the same component contract.

The implementation-detail test fails.
The behavioral test should not.

9. A Contract-Oriented Test
The stronger conceptual test is:
Initial: button communicates "Disabled"
Action: user activates button
Expected: button communicates "Enabled"
onChange receives true

This tests:
input → interaction → state transition → output → communication
That is architectural behavior.

Layer 2 — 🔬 Deep Mechanical Breakdown
10. Props as Test Inputs
Props are the primary external input boundary.

Example:
function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}</h1>;
}

The contract is:
name ↓ component ↓ visible greeting

A useful test matrix:
Input | Expected behavior
--- | ---
"Srikar" | Hello, Srikar
"Alex" | Hello, Alex
empty string, if allowed | Defined empty-state behavior
omitted, if allowed | Defined default behavior

The test should encode the contract.

11. Primitive Props
Primitive props are generally straightforward.
<Button disabled={true}>
  Save
</Button>

The test should verify the semantic behavior:
disabled input ↓ button becomes non-interactive
not:
specific internal variable === true

12. Object Props
Consider:
<UserCard user={user} />

The important contract is usually not:
user object was stored somewhere
but:
user.name appears
user.role appears
appropriate actions exist

If object identity itself is part of the contract—for example, a memoized child depends on reference stability—that belongs to a more specific performance/identity test and should not be inferred merely from ordinary rendering.

13. Function Props
Function props require special attention because they represent a communication boundary.
function DeleteButton({ onDelete }: { onDelete: (id: string) => void; }) {
  return (
    <button onClick={() => onDelete("user-42")}>
      Delete
    </button>
  );
}

The contract is:
user action
↓
component translates action
↓
callback invoked
↓
correct semantic payload

A weak test:
expect(onDelete).toHaveBeenCalled()

A stronger test:
expect(onDelete).toHaveBeenCalledWith("user-42")

The payload is part of the API contract.

14. Callback Contract Testing
Suppose:
<Item onRemove={(id) => removeItem(id)} />

The child should communicate:
"item 42 was requested for removal"
rather than leaking unnecessary implementation information:
DOM click event
unless the event itself is intentionally part of the component's API.

The test therefore verifies semantic communication:
DOM interaction
↓
component behavior
↓
semantic event
↓
consumer callback

This protects the abstraction boundary.

15. Testing children
Because:
children
is a prop, composition is part of the component contract.

Example:
function Panel({ children }) {
  return (
    <section>
      {children}
    </section>
  );
}

A useful contract:
provided child ↓ appears in Panel's designated content region

The test does not need to assert every generated wrapper unless those wrappers are themselves contractual.

16. Composition Contract
Consider:
<Dialog>
  <Dialog.Title>Delete account?</Dialog.Title>
  <Dialog.Actions>
    <button>Cancel</button>
    <button>Delete</button>
  </Dialog.Actions>
</Dialog>

A composition-oriented test should verify the important contract:
title is exposed
actions are exposed
content is placed correctly
interaction works

It should not necessarily serialize the entire DOM tree.

17. Controlled Components
A controlled component receives canonical state from its parent.
function TextInput({ value, onChange }) {
  return (
    <input
      value={value}
      onChange={event => onChange(event.target.value)}
    />
  );
}

The ownership model is:
Parent owns canonical value
│
│ value
▼
TextInput
│
│ onChange(nextValue)
▼
Parent

The test should verify this protocol.

18. Controlled Component Test Model
Initial render:
value = "hello"

Observable state:
input.value === "hello"

User types:
"world"

Component communicates:
onChange("helloworld")

Then the parent updates the value:
value = "helloworld"

The input reflects:
helloworld

This distinction matters:
A controlled component does not become authoritative merely because the user interacted with it.
The parent remains the source of truth.

19. Controlled Component Prediction
Consider:
function SearchBox({ value, onChange }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
}

Parent:
function SearchPage() {
  const [query, setQuery] = useState("");

  return (
    <SearchBox value={query} onChange={setQuery} />
  );
}

Render #1:
Parent state: query = ""
Child receives: value = ""
DOM: input.value = ""

User types a:
Child handler: event.target.value = "a"
Callback: setQuery("a")

Render #2:
Parent state: query = "a"
Child receives: value = "a"
DOM: input.value = "a"

The child did not independently establish the canonical state.
That is the contract the test should preserve.

20. Uncontrolled Components
An uncontrolled component owns its internal value.

Conceptually:
Component
│
└── local state / DOM-managed state

Example:
function NameField() {
  const [name, setName] = useState("");

  return (
    <input
      value={name}
      onChange={e => setName(e.target.value)}
    />
  );
}

Testing focuses on:
initial state → user interaction → observable state → callback/output

The distinction between controlled and uncontrolled behavior should be explicit in the component contract.

21. Controlled vs Uncontrolled Test Matrix
Property | Controlled | Uncontrolled
--- | :---: | :---:
Canonical value | Parent | Component
Test initial value | Yes | Yes
Test interaction | Yes | Yes
Test callback | Usually | If exposed
Test parent update | Critical | Usually irrelevant
Test local persistence | Usually not central | Important
Test ownership semantics | Critical | Critical

22. Defaults Are Part of the Contract
Suppose:
function Button({ variant = "primary" }) { ... }

The default is observable if it affects behavior or output.

Test:
variant omitted ↓ primary behavior

Do not test merely:
default parameter exists
Test what the default means.

23. Boolean Props
Consider:
<Button primary />

The test should verify the actual contract represented by primary.
If:
<Button disabled />
then the important behavior is:
cannot activate normally
not:
disabled prop equals true internally

24. Context Contracts
Context is a dependency-distribution mechanism.

Example:
const ThemeContext = createContext(null);

function Button() {
  const theme = useContext(ThemeContext);
  return (
    <button data-theme={theme}>
      Save
    </button>
  );
}

The component contract is:
Provider supplies dependency
↓
consumer reads dependency
↓
consumer behavior changes accordingly

A test should normally verify the consumer's behavior under relevant provider values.

25. Missing Provider Is Also a Contract Decision
Suppose a component requires context.

Possible contract:
outside provider → throw meaningful error
or:
outside provider → use fallback

Both are valid architectural choices.
What matters is that the contract is intentional and tested.

26. Context Provider Placement
Consider:
Provider A
├── Component X
└── Provider B
    └── Component Y

Y consumes B.
Testing should verify:
Y receives nearest applicable provider value
This protects against accidental provider nesting changes.

27. Accessibility Is a Component Contract
Accessibility should not be treated as a secondary visual concern.

For interactive components:
semantic role
accessible name
keyboard interaction
focus behavior
disabled state
relationships
may all be part of the public contract.

Example:
<button aria-label="Close dialog">
  ×
</button>

The contract includes:
user can identify this as Close dialog
not merely:
button exists

28. Query Strategy as Contract Strategy
A useful conceptual hierarchy:
Accessible user-facing semantics
↑
public behavior
↑
implementation

Prefer locating elements through stable user-facing meaning where practical.

Examples of strong semantic targets:
button by accessible name
textbox
heading
dialog
checkbox
link

This causes tests to fail when the user-visible contract fails.
That is valuable.

29. Why DOM Class Selectors Can Be Brittle
Suppose:
<button className="btn-primary save-button">
  Save
</button>

A test targeting:
.save-button
may fail after a CSS refactor.
But:
button named "Save"
may remain stable.

Therefore:
styling implementation ≠ interaction contract
Tests should generally reflect that distinction.

30. Snapshot Testing
A snapshot captures a representation of rendered output.

Conceptually:
Component
↓
rendered representation
↓
serialized snapshot

Snapshots can detect structural changes.
But they can also create noise.

Large snapshot:
████████████████████████████████
████████████████████████████████
████████████████████████████████
████████████████████████████████

A small semantic assertion:
expect(screen.getByRole("button", { name: "Save" })).toBeEnabled()
often communicates intent better.

31. Snapshot Anti-Pattern
Bad strategy:
Every component → entire DOM snapshot → snapshot updated whenever UI changes

This creates:
high maintenance + low semantic precision
The team may start approving snapshots without understanding what changed.
That produces false confidence.

32. When Snapshots Can Be Useful
Snapshots can be appropriate when:
the serialized output is intentionally stable;
structural output itself is meaningful;
the snapshot is small;
changes require deliberate review;
the snapshot complements behavioral tests.

They should generally not become the only evidence that a component works.

33. Testing State Transitions
A component with state should be tested as a state machine when its behavior is stateful.

Example:
CLOSED
│
│ open
▼
OPEN
│
│ close
▼
CLOSED

Tests should cover meaningful transitions.
For a menu:
initial → closed
open → open
select → selected behavior
close → closed

This is more valuable than merely asserting that a useState call occurred.

34. Multi-Render Testing
React state behavior requires render-by-render reasoning.

Example:
function Counter({ step }) {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(c => c + step)}>
      {count}
    </button>
  );
}

Render #1:
Props: step = 1
State: count = 0
Output: 0

Interaction:
User clicks.
Update: count + 1

Render #2:
State: count = 1
Output: 1

A second click:
count = 2

The test should verify the observable sequence.

35. Testing Functional State Updates
Consider:
setCount(c => c + 1);
setCount(c => c + 1);

The update queue conceptually becomes:
previous state
↓
+1
↓
+1
↓
final state

Expected:
0 → 2

A useful test verifies the final behavior rather than inspecting the update queue.

36. Testing Stale-Closure Bugs
Consider:
setCount(count + 1);
setCount(count + 1);

Both expressions may derive from the same render snapshot.
Therefore the result can differ from the functional-update version.
This is precisely the type of behavior a senior test should expose.

The test is not proving:
closure exists
It is proving:
two intended increments actually produce two increments

37. Testing Identity and State Preservation
Component state is attached to component identity, not source-code line numbers.

Suppose:
{show && <Editor />}

If show changes:
true → false
the occurrence disappears.

If it later returns:
false → true
a new occurrence may be created and local state starts from its initial state.

A test can verify this when preservation/reset behavior is contractually important.

38. Keys as Testable Identity
Consider:
items.map(item => (
  <Editor key={item.id} item={item} />
))

If item order changes:
A B C
↓
C A B

stable keys allow React to associate state with:
A → A
B → B
C → C

A component test should not generally duplicate React reconciliation internals.
But if the product behavior depends on preserving an editor's draft with its entity, an integration-level component test should verify:
draft belongs to entity
rather than:
fiber.key === item.id

The latter is implementation-oriented.

39. Test Identity Through User-Visible Consequences
Example:
Row A draft = "Alpha"
Row B draft = "Beta"
reorder rows
Expected:
Row A → "Alpha"
Row B → "Beta"

This is an excellent behavioral identity test.
It catches key mistakes without coupling the test to Fiber internals.

40. Testing Unmount/Cleanup Contracts
Suppose:
useEffect(() => {
  const subscription = subscribe();
  return () => {
    subscription.unsubscribe();
  };
}, []);

The component owns a resource.
The contract includes:
mount → resource acquired
unmount → resource released

A test can verify the externally meaningful lifecycle behavior.
Do not inspect React's internal effect list.

41. Testing Effects Correctly
An effect is generally an external synchronization mechanism.

Examples:
subscription
timer
browser API
external object
network interaction

The test should ask:
Did the component establish the required external synchronization?
Did it clean it up?
Did dependency changes cause the intended resynchronization?

not:
Did React execute useEffect exactly once?

42. Testing Effects Without Testing React
If a component:
useEffect(() => {
  analytics.track("opened");
}, []);

the contract may be:
when component enters the required lifecycle state, analytics event is emitted

The test should observe the analytics boundary.
It should not assert React's internal effect scheduling.

43. Mock Boundaries
Mocks are most valuable at external boundaries.

Good candidates:
network client
analytics service
clock
browser API
storage adapter
external service

Riskier candidates:
React
useState
useEffect
internal component functions
private helpers

The more internal the mock, the more implementation coupling is introduced.

44. Component Mocks and Architectural Meaning
Suppose:
<CheckoutForm />
uses:
<PaymentButton />

Mocking PaymentButton may be appropriate if the parent contract only depends on:
payment completion event

But mocking it solely to assert:
PaymentButton was rendered exactly once
may provide little behavioral value.

The decision depends on the architectural boundary.

45. Test Doubles Follow Dependency Direction
Use the same dependency direction established architecturally:
Component
│
▼ External service

Mock at:
Component → Service
rather than:
Component ↓ internal helper ↓ internal function

The latter often tests implementation wiring.

46. Testing Component Contracts Across Composition
Suppose:
<Card>
  <Card.Header />
  <Card.Body />
  <Card.Footer />
</Card>

There are multiple contracts:
Card
├── composition contract
├── layout contract
├── child placement contract
└── interaction contract

Tests should target the important promises.
Not every internal wrapper.

47. Test Failure as an Architectural Signal
A failing test should answer:
Which contract changed?

Example:
Expected: Save button enabled
Actual: Save button disabled

Potential causes:
input contract changed
validation changed
state ownership changed
derived state changed
callback behavior changed
provider changed

A good test points toward the boundary.
A brittle test might merely say:
snapshot mismatch
which gives much less architectural information.

48. Test Naming
A senior test name describes behavior.

Weak:
it("renders Button")

Better:
it("disables submission while the form is invalid")

Better still when contractually precise:
it("prevents submission and communicates the invalid state to the user")

The name should expose intent.

49. Test Cases Should Follow Failure Modes
Suppose production risk is:
Delete action accidentally targets another row.

Test:
render multiple rows
select one
activate delete
assert correct entity ID communicated

Do not waste most test effort proving:
three divs exist

Risk determines test priority.

50. Testing Derived State
Consider:
const fullName = `${firstName} ${lastName}`;

There is no reason to test the existence of a state variable because there isn't one.

Test:
firstName + lastName → displayed full name

If derived state is implemented with an unnecessary effect, a behavioral test can expose synchronization problems.

51. Duplicate State and Tests
Suppose:
props.value
state.value
both represent the same concept.

Tests may reveal synchronization failures:
parent value changes
↓
child still displays old value

This is a component design smell.
A good test can therefore act as an architectural specification.

52. Test the Source of Truth
For each stateful component, ask:
Who owns this value?

Then construct the test around that ownership.

Example:
Parent owns value → child emits changes → parent re-renders child
versus:
Child owns value → child changes itself

The tests should distinguish these models.

53. Contract Tests vs Implementation Tests
Implementation-oriented:
expect(setState).toHaveBeenCalled()
expect(useEffect).toHaveBeenCalled()
expect(internalHandler).toHaveBeenCalled()
expect(componentFunction).toHaveBeenCalled()

Contract-oriented:
expect(input).toHaveValue("...")
expect(button).toBeDisabled()
expect(onSubmit).toHaveBeenCalledWith(expectedData)
expect(screen.getByRole(...)).toBeVisible()

The second category generally survives refactoring better.

54. The Refactoring Test
Imagine replacing:
useState
with:
useReducer

Ask:
Which tests should fail?
Ideally:
none
unless behavior changed.

Now imagine changing:
button
to:
div role="button"

If accessibility behavior changes, appropriate tests should fail.
That is useful.

This gives a powerful rule:
A good test fails when a contractual behavior changes, not merely when implementation structure changes.

Layer 3 — 🧪 Diagnostic Labs & DevTools Profiling
55. Lab 01 — Component Contract Inventory
Before writing tests, create:
Component: ________________________
Inputs: ________________________
User actions: ________________________
State transitions: ________________________
Callbacks: ________________________
Context dependencies: ________________________
Observable outputs: ________________________
Accessibility requirements: ________________________
Identity/reset behavior: ________________________
External effects: ________________________

Then classify each item:
[ ] Required contract
[ ] Internal implementation
[ ] External dependency
[ ] Performance concern
[ ] Future concern

Only contractual behavior should automatically become a component test.

56. Lab 02 — React DevTools Render Inspection
Open the application.
Enable React DevTools.
Inspect the target component.

Record:
[ ] component identity
[ ] props
[ ] state
[ ] rendered tree
[ ] parent relationship
[ ] child relationship
[ ] provider context where relevant

Then interact with the component.
Observe:
[ ] what caused the render
[ ] which props changed
[ ] which state changed
[ ] whether child components rerendered
[ ] whether identity remained stable

The purpose is diagnostic understanding.
DevTools should not become the implementation being tested.

57. Lab 03 — Render Highlighting
Use React DevTools development diagnostics where available.

Observe:
initial render
↓
interaction
↓
rendered component
↓
child renders

Ask:
Which component owns the changed state?
Which component rerendered?
Which output changed?

Then map this back to the test:
state owner ↓ behavior ↓ observable contract

58. Lab 04 — Browser Accessibility Inspection
Use Chrome DevTools to inspect:
Elements Accessibility

Check:
[ ] role
[ ] accessible name
[ ] state
[ ] relationship
[ ] keyboard semantics

For a dialog:
[ ] role=dialog
[ ] accessible name
[ ] focus behavior
[ ] close interaction

For a button:
[ ] button semantics
[ ] accessible name
[ ] disabled state

59. Lab 05 — Contract vs Implementation Experiment
Create:
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      {count}
    </button>
  );
}

Write behavioral expectations:
0 initially
1 after one click
2 after two clicks

Then refactor implementation:
useState → useReducer
without changing behavior.

Expected result:
tests remain green

This demonstrates test resilience.

60. Lab 06 — Controlled Input Contract
Construct:
Parent state
↓
controlled input
↓
user types
↓
onChange
↓
parent state update
↓
new props
↓
input reflects canonical value

Verify each transition.
Do not inspect the child's internal state because a properly controlled input should not depend on private canonical state.

61. Lab 07 — Callback Payload Verification
Create:
<Item id="42" onRemove={onRemove} />

Perform:
user activates remove

Verify:
onRemove("42")

Then intentionally introduce:
onRemove("41")
The test should fail.
This confirms the test protects the communication contract.

62. Lab 08 — Identity Preservation
Build:
A B C
Each row contains editable local state.

Modify:
B → "draft"

Reorder:
A B C
↓
C A B

Expected:
B retains "draft"

Now replace stable keys with indexes.
The test should expose the behavioral regression when positional identity is not valid for the data.

63. Lab 09 — Intentional Reset
Use:
<Editor key={documentId} />

Change:
documentId = A → documentId = B

Expected:
Editor state resets for B

This demonstrates that a key can be an intentional identity boundary.
Test the product behavior:
switching documents starts the correct document state
not:
React Fiber key changed

64. Lab 10 — Effect Cleanup
Create a component that subscribes to an external resource.

Test:
mount → subscription created
unmount → subscription removed

Then test dependency change:
dependency A → dependency B
old synchronization cleaned up
new synchronization established

The exact mechanism should remain an implementation concern unless externally observable.

65. Lab 11 — Failure Diagnosis Workflow
When a test fails:

Step 1: Read the assertion.
What contract failed?

Step 2: Inspect current inputs.
props, context, initial state

Step 3: Inspect the interaction.
Was the intended event actually triggered?

Step 4: Inspect state ownership.
Who should have changed?

Step 5: Inspect rendered output.
Did React commit the expected result?

Step 6: Inspect identity.
Did the component remount unexpectedly?

Step 7: Inspect external dependencies.
Did a service/timer/network boundary behave differently?

This is substantially more effective than immediately rewriting the assertion.

66. Production Diagnostic Runbook — "Button Clicks but Nothing Changes"
Symptom:
User clicks:
Save
Nothing appears to happen.

Investigation:
1. Is the button actually interactive?
2. Is the event handler attached?
3. Is the callback invoked?
4. Does the callback communicate the correct payload?
5. Does the state owner update?
6. Does the component receive updated props?
7. Does the resulting UI commit?
8. Is an external request failing?

Test coverage should isolate:
button interaction → semantic callback → state transition → observable UI

67. Production Diagnostic Runbook — "Wrong Row Deleted"
Symptom:
Deleting row B deletes row A.

Potential causes:
wrong callback payload
wrong closure
index-based identity
incorrect list mapping
stale data

Test:
render A B C
activate delete for B
assert onDelete("B")

Then test identity behavior if row-local state is involved.
The test should catch the contract failure at the boundary.

68. Production Diagnostic Runbook — "Form Loses Input"
Potential causes:
component remount
key change
conditional structure change
controlled value reset
parent overwriting value
state ownership bug

Test:
type value
trigger parent update
assert value remains

If reset is intentional:
change identity
assert reset

This distinction is crucial.

69. Production Diagnostic Runbook — "Dialog Closes Unexpectedly"
Potential causes:
parent state reset
provider remount
key changed
callback fired unexpectedly
effect synchronization bug

Test the contract:
open dialog
interact inside
trigger unrelated parent update
dialog remains open

If the dialog is supposed to close on a specific action:
close action → dialog disappears

70. Production Diagnostic Runbook — "Context Consumer Receives Wrong Value"
Investigate:
provider placement
nested provider
default value
provider remount
wrong provider scope

Test:
Provider A Component
and:
Provider A Provider B Component
Verify the nearest applicable dependency wins.

71. Testing Accessibility Regressions
Suppose a refactor changes:
<button>Save</button>
into:
<div onClick={save}>Save</div>

A visual test might still pass.
A contract-oriented accessibility test should expose the regression because:
button semantics
are gone.

This is exactly what a strong test should do.

72. Test Architecture
A mature test suite can be layered:
              TEST SYSTEM
                   │
     ┌─────────────┼──────────────┐
     │             │              │
    UNIT       COMPONENT     INTEGRATION
     │             │              │
 pure logic    public UI     feature flow
 contracts     behavior        multiple
                              boundaries
     │             │              │
     └─────────────┼──────────────┘
                   │
              E2E / SYSTEM

This Part focuses primarily on component contracts.
Do not turn every component test into a full application test.

73. Component Test Boundary
A useful boundary:
Component
├── props
├── children
├── context
├── user interactions
├── observable output
└── relevant external boundary

Avoid automatically including:
entire application router
entire database
entire backend
unrelated global providers
unless the behavior genuinely requires them.

74. Avoid the "Everything Provider" Test Harness
Bad test setup:
AppProvider
RouterProvider
ThemeProvider
AuthProvider
QueryProvider
AnalyticsProvider
FeatureFlagProvider
LocalizationProvider
...
for every component.

Problems:
slow tests
hidden dependencies
hard diagnosis
unnecessary coupling

Instead provide the minimum dependency surface required by the component.

75. Minimal Test Harness
Prefer:
Component
├── required context
└── required external dependency

rather than:
Entire application ↓ Component

This makes dependency requirements visible.

76. Testing Composition Without Overcoupling
Suppose:
<Card>
  <button>Buy</button>
</Card>

The Card test should verify:
provided children are rendered

It does not necessarily need to know:
the child is a button
unless Card explicitly promises button-specific behavior.
This preserves composition boundaries.

77. Testing Parent-Child Contracts
Parent:
<Editor value={draft} onChange={setDraft} />

Child contract:
value
onChange(nextValue)

Parent test can verify:
child interaction → parent state updates → new value reaches child

Child test can verify:
provided value → displayed value
user interaction → onChange(nextValue)

Different tests protect different boundaries.

78. Don't Test the Same Contract Everywhere
Avoid:
Child test: assert onChange implementation
Parent test: assert child's internal handler
Integration test: assert child's DOM structure

Instead divide ownership:
Child: guarantees its public callback contract
Parent: guarantees correct response to that contract
Integration: guarantees feature-level behavior

This creates a coherent testing architecture.

Layer 4 — 🔥 The Crucible
79. Production Anti-Pattern Teardown #1 — Testing Internal State
Flawed Approach:
expect(component.state.count).toBe(1)
or an equivalent internal inspection strategy.

Why Developers Do It:
Because the implementation is easy to inspect.

Mechanical Failure:
The test becomes coupled to:
state representation
rather than:
behavior

Changing:
useState → useReducer
can break the test without changing behavior.

Senior Refactoring:
Assert:
visible count
or the relevant callback/output.

80. Anti-Pattern #2 — Mocking React Hooks
Flawed:
mock useState
mock useEffect
mock useContext
to prove implementation behavior.

Why:
Developers want deterministic control.

Failure:
The test is now verifying:
React API wiring
instead of:
component contract

It also creates unusual behavior that may not resemble production.

Refactor:
Exercise the component through:
inputs
actions
outputs

81. Anti-Pattern #3 — Giant Snapshots
Flawed:
every component gets a huge snapshot

Failure:
A minor wrapper change produces:
hundreds of changed lines
Reviewers stop analyzing differences.

Refactor:
Use targeted assertions for:
semantic output
state behavior
accessibility
callbacks

Use snapshots only where structural serialization provides meaningful value.

82. Anti-Pattern #4 — Testing CSS as Behavior
Flawed:
expect(element).toHaveClass("blue-primary-button")
when the class is purely implementation.

Failure:
CSS refactors break behavioral tests.

Refactor:
Test:
button is available
button has correct semantic state
button is disabled/enabled

If a visual state itself is contractual, test the appropriate externally meaningful representation.

83. Anti-Pattern #5 — Testing Every Child Internally
Parent test:
assert Child's internal implementation
assert Child's hook count
assert Child's internal handler
assert Child's exact DOM

This destroys component boundaries.

Senior architecture says:
Parent depends on Child's contract.
Parent should test that contract.
Child owns its implementation.

84. Anti-Pattern #6 — Over-Mocking
Suppose:
Component ↓ Service ↓ Adapter ↓ HTTP client

Mocking every layer may leave the test proving nothing meaningful.
Instead identify the actual boundary:
Component → Service contract
and isolate there when appropriate.

85. Anti-Pattern #7 — Tests That Only Assert Rendering
Example:
renders button
renders input
renders title

This proves existence.
It does not necessarily prove:
interaction
state transition
callback communication
ownership
accessibility

For interactive components, behavior matters.

86. Anti-Pattern #8 — Tests That Ignore Callback Payloads
Weak:
expect(onSelect).toHaveBeenCalled()

Strong:
expect(onSelect).toHaveBeenCalledWith(itemId)

The payload defines the communication protocol.
Ignoring it can allow severe production bugs.

87. Anti-Pattern #9 — Tests That Ignore Controlled Ownership
Suppose a controlled input renders correctly.
A test only verifies:
typing works
but never verifies:
parent-provided value changes are reflected

Then the test does not protect the controlled contract.

88. Anti-Pattern #10 — Test Setup Hides Required Dependencies
If a component silently requires:
AuthContext
but the test harness automatically supplies the entire application provider tree, the test may conceal the component's true dependency.

Prefer explicit dependency setup.

89. Senior Interview Gotcha #1
Question:
Why is:
expect(useState).toHaveBeenCalled()
usually a poor component test?

Answer:
Because the existence of useState is an implementation detail.
The component contract is the behavior produced by the state transition.
A valid implementation could use:
useReducer
Context
external store
different internal state representation
without changing the public contract.

90. Senior Interview Gotcha #2
Question:
Why is callback payload testing important?

Answer:
Because a callback is an API boundary.
These are not equivalent:
onSelect()
and:
onSelect("product-42")

The consumer depends on the semantic payload.

91. Senior Interview Gotcha #3
Question:
Should every component have a snapshot?

Answer:
No.
Snapshot tests are useful when stable serialized structure is itself meaningful.
They become problematic when they replace behavioral assertions or create large review-unfriendly snapshots.

92. Senior Interview Gotcha #4
Question:
What should a controlled input test prove?

At minimum:
provided value is represented
user interaction emits intended next value
parent-driven value changes are reflected

The parent owns the canonical state.

93. Senior Interview Gotcha #5
Question:
How do you test React identity?

Do not normally inspect Fiber identity.
Instead test the observable consequence:
state should remain associated with entity
or:
state should reset when identity intentionally changes

This keeps the test aligned with behavior.

94. Senior Interview Gotcha #6
Question:
When should you mock a child component?

When the parent only needs to verify a meaningful boundary and the child's full implementation is outside the parent's test responsibility.
Do not mock merely to assert implementation wiring.

95. Engineering Decision Matrix
Situation | Preferred Testing Strategy | Why
--- | --- | ---
Pure visual text | Semantic output assertion | Direct contract
Button interaction | User-level interaction + output | Behavioral
Callback component | Action + exact payload | Communication contract
Controlled input | Parent update loop | Ownership contract
Uncontrolled input | Interaction + local result | Local behavior
Context consumer | Provider value + observable behavior | Dependency contract
Composition component | Children/slot behavior | Composition contract
Accessibility requirement | Semantic/accessibility assertion | User contract
Identity-sensitive UI | Reorder/reset behavior | Observable identity
Effect subscription | External boundary + cleanup | Resource contract
Pure helper | Unit test | No React boundary
Stable serialization | Narrow snapshot | Structural contract
Huge dynamic DOM | Targeted assertions | Avoid snapshot noise
Internal hook implementation | Usually do not test directly | Refactor resistance
CSS implementation | Usually do not test directly | Not behavioral
External service | Boundary mock/fake | Isolation
Entire feature flow | Integration/E2E | Cross-boundary behavior

96. The Contract Coverage Matrix
For a serious component, create:
Contract | Example | Test? | Priority
--- | --- | :---: | :---:
Required prop | value | Yes | P0
Default prop | variant | If meaningful | P1
Callback | onSubmit | Yes | P0
Callback payload | submitted data | Yes | P0
Children | slot content | Yes if contractual | P1
Context | theme/auth/dependency | Yes if behavior depends on it | P0/P1
State transition | open → closed | Yes | P0
Accessibility | accessible name | Yes | P0
Identity | preserve/reset | If product behavior depends on it | P0/P1
Effect cleanup | unsubscribe | Yes for owned resources | P0
Internal hook count | implementation | No | —
CSS class | implementation | Usually no | —
JSX wrapper | implementation | Usually no | —
Fiber field | implementation | No | —

97. Final Crucible Challenge #1 — Controlled Search
Given:
function SearchBox({ value, onChange }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
}

Parent owns:
query

Predict:
Render #1:
query = "" input = ""

User types r:
onChange("r")

Parent accepts update:
query = "r"

Render #2:
input = "r"

Required tests:
[ ] initial value represented
[ ] user action emits correct next value
[ ] parent-driven value appears

98. Final Crucible Challenge #2 — Callback Payload
Given:
function ProductRow({ product, onRemove }) {
  return (
    <button onClick={() => onRemove(product.id)}>
      Remove
    </button>
  );
}

Products:
A → id="a"
B → id="b"
C → id="c"

User clicks B.

What should the contract test assert?
onRemove("b")
not merely:
onRemove called

99. Final Crucible Challenge #3 — Identity
Given:
items.map((item, index) => (
  <Editor key={index} item={item} />
))

State:
A draft = ""
B draft = "hello"
C draft = ""

Reorder:
A B C
↓
C A B

Predict the danger:
The component occurrence at position 1 may now represent a different entity while retaining positional state.
The product-level failure is:
draft "hello"
may appear attached to the wrong item.

The correct test verifies entity-associated behavior.

100. Final Crucible Challenge #4 — Intentional Reset
Given:
<Editor key={documentId} />

Document changes:
A → B

Expected:
A-local draft does not leak into B

The test should verify:
switching documents establishes the correct new editing state
This is an intentional identity boundary.

101. Final Crucible Challenge #5 — Context
Given:
Provider A ├── Button A
└── Provider B └── Button B

If both providers supply different values:
Button A → A
Button B → B

The test should protect the dependency scope.
Do not test:
internal Context object structure
Test:
observable behavior under provider scope

102. Final Crucible Challenge #6 — Effect Cleanup
Given:
Component mounts → subscribe()
Component unmounts → unsubscribe()

Production bug:
component mounts/unmounts repeatedly → subscriptions accumulate

The test should detect:
one subscription
one corresponding cleanup
and dependency changes should not leak old subscriptions.

103. Final Crucible Challenge #7 — Refactor Resistance
Implementation:
useState
is replaced with:
useReducer

No user-visible behavior changes.

Question:
Which tests should fail?

Expected:
No contract tests should fail.
If they do, inspect whether the tests were coupled to implementation.

104. Final Engineering Principle
A component is an architectural boundary.
Its tests should protect the boundary.

The strongest test architecture therefore follows:
           COMPONENT
  │ ┌──────────┼──────────┐
  │ │          │          │
  │ INPUT    ACTION    OUTPUT
  │ │          │          │
  │ ▼          ▼          ▼
  │ props    user UI/callback
  │ context  event semantics
  │ children consumer accessibility
  │ │          │          │
  │ └──────────┼──────────┘
  │
  ▼
CONTRACT
  │
  ▼
TEST

The test should not become a second implementation.
It should become an executable statement of what the component promises.

105. 35-Point Completion Checklist
Component Contract:
[ ] I can define a component's public contract.
[ ] I can distinguish inputs from implementation details.
[ ] I can identify observable outputs.
[ ] I can identify behavioral transitions.
[ ] I can identify lifecycle/resource contracts.

Props:
[ ] I can test required props.
[ ] I can test meaningful defaults.
[ ] I can test primitive props.
[ ] I can test object-driven behavior.
[ ] I can test callback props.
[ ] I can test exact callback payloads.

Children & Composition:
[ ] I can test children as a public contract.
[ ] I can test composition without overcoupling to child implementation.
[ ] I understand when a parent should not test a child's internals.
[ ] I can separate parent and child contract tests.

State:
[ ] I can test state transitions.
[ ] I can reason through multi-render behavior.
[ ] I can test functional-update behavior through outcomes.
[ ] I can identify state ownership.
[ ] I can distinguish controlled and uncontrolled components.
[ ] I can test controlled parent → child → parent loops.

Identity:
[ ] I understand that state belongs to component identity.
[ ] I can test state preservation through observable behavior.
[ ] I can test intentional reset behavior.
[ ] I understand why index-key bugs can be exposed behaviorally.

Context:
[ ] I can test context consumers through provider values.
[ ] I can test scoped provider behavior.
[ ] I can identify missing-provider contracts.

Accessibility:
[ ] I treat accessibility as part of the component contract.
[ ] I can test semantic roles.
[ ] I can test accessible names.
[ ] I can test important interaction states.
[ ] I can distinguish semantic contracts from styling implementation.

Test Architecture:
[ ] I can choose component vs integration boundaries.
[ ] I avoid unnecessary provider trees.
[ ] I mock external boundaries intentionally.
[ ] I avoid mocking React internals.
[ ] I can recognize brittle snapshot usage.
[ ] I can diagnose failures in terms of violated contracts.

106. KPI 03 Cross-Boundary Map
This Part connects the previous architectural material:
Part 01 Components as Units of UI Ownership
│
▼
Part 02 Props & Component Inputs
│
▼
Part 04 Component Communication
│
▼
Part 06 Component Boundaries
│
▼
Part 07 Identity & Keys
│
▼
Part 08 Lifecycle & Effects
│
▼
Part 09 State Ownership
│
▼
Part 11 Context & Distribution
│
▼
Part 12 Composition
│
▼
Part 13 Reuse & Abstraction
│
▼
Part 14 Testing & Contracts

The progression is intentional:
What is a component?
↓
What does it receive?
↓
How does it communicate?
↓
Where are its boundaries?
↓
How is identity preserved?
↓
How does it live and synchronize?
↓
Who owns its state?
↓
How are dependencies distributed?
↓
How is behavior composed?
↓
When should it be reused?
↓
How do we prove its contract?

107. What This Part Does NOT Cover
This Part deliberately does not become a complete testing-framework curriculum.
It does not reteach:
JavaScript testing syntax
TypeScript testing syntax
assertion-library fundamentals
test-runner configuration
CI/CD architecture
browser automation frameworks in depth
visual regression infrastructure
property-based testing in depth
mutation testing in depth
advanced mocking frameworks
performance benchmarking methodology
Those are separate concerns.

This Part establishes the React component testing mental model and architectural contract boundary.

108. Boundary to Future React Material
Advanced React material may extend this into:
render scheduling
concurrent rendering
transitions
Suspense
selective hydration
server/client boundaries
advanced performance diagnostics
Those mechanisms belong to the appropriate later curriculum levels.

The principle established here remains:
Test observable contractual behavior without coupling ordinary component tests to React's internal scheduler or reconciler implementation.

109. Final Senior-Level Rule
When designing a component test, ask these questions in order:
1. What does this component own?
2. What inputs can its consumers provide?
3. What actions can consumers/users perform?
4. What state transitions matter?
5. What outputs can consumers observe?
6. What callbacks or events cross the boundary?
7. What accessibility behavior is contractual?
8. What identity/preservation behavior matters?
9. What external resources does the component own?
10. Which implementation details can safely change without changing the contract?

Then test the answers.

Do not start with:
"What lines can I cover?"
Start with:
"What promise must this component keep?"

That is the difference between test coverage and engineering confidence.

Engineering Principle
A component test is strongest when it describes a promise that consumers care about and weakest when it describes an implementation that consumers should never have known existed.
