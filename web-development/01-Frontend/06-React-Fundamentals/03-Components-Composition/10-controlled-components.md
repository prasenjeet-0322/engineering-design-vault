Level 06 — React Fundamentals
KPI 03 — Components, Props & Composition
PART 10 — Controlled Components, Uncontrolled Components & Ownership Contracts
[⬅️ Previous Part](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/09-state-ownership.md) | [📚 Level 06 Index](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/README.md) | [🧪 Companion Lab](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/examples/10-controlled-components.html) | [Next Part ➡️](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/11-context-and-state-distribution.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

PART PURPOSE
Controlled versus uncontrolled components is fundamentally a question of state ownership.
It is often taught as:
“Controlled means using value; uncontrolled means using defaultValue.”
That is syntactically true but architecturally incomplete.

The deeper model is:
CONTROLLED
External owner
│
│ value
▼
Component
│
│ event
▼
External owner

versus:

UNCONTROLLED
Component
│
└── owns mutable value

The important engineering question is:
Which system is authoritative for this value?
That question determines the API, data flow, lifecycle, synchronization model, and failure modes.

LAYER 1 — ⚡ 30-SECOND EXECUTIVE CHEAT SHEET & CORE MENTAL MODELS
1. Core Mental Model
Controlled:
SOURCE OF TRUTH
      │
      │ value
      ▼
┌─────────────────┐
│    Component    │
│                 │
│  renders value  │
└────────┬────────┘
         │
         │ onChange
         ▼
SOURCE OF TRUTH

The component does not independently decide the authoritative value.
It receives the current value and reports user intent.

Uncontrolled:
┌─────────────────┐
│    Component    │
│                 │
│   owns value    │
│   internally    │
└────────┬────────┘
         │
         ▼
    rendered UI

The component owns the mutable value.
The consumer may receive an initial value or query the value through an explicit mechanism when needed.

2. Executive Concept Table
Concept | Core Mechanism | Production Impact | Common Senior Trap
--- | --- | --- | ---
Controlled | Parent owns current value | Maximum external coordination | Treating every input as needing parent state
Uncontrolled | Component owns current value | Locality and simpler ownership | Assuming uncontrolled means inaccessible
value | Current authoritative value | External source drives UI | Forgetting corresponding change contract
defaultValue | Initial value | Establishes initial state without ongoing control | Expecting later changes to behave like value
onChange | Reports user interaction | Allows owner to update value | Treating it as ownership itself
Single source of truth | One authoritative representation | Prevents divergence | Maintaining parent + child copies
Controlled boundary | External state authority | Useful for coordination | Accidentally creating hybrid behavior
Uncontrolled boundary | Internal state authority | Useful for isolated widgets | Overexposing internals
Hybrid component | Supports controlled/uncontrolled modes | Flexible reusable APIs | Switching modes during lifetime
Draft state | Temporary local representation | Enables editing before commit | Calling it duplicate state without semantic analysis

3. Golden Rule
A controlled component receives the current value from its owner and reports changes; an uncontrolled component owns its current value internally. Choose the ownership model based on coordination requirements, not stylistic preference.

4. The Three Questions
Whenever designing a stateful component, ask:
1. Who owns the current value?
2. Who is allowed to change it?
3. Does anyone outside this component need to coordinate with every change?

If the answer to #3 is yes, controlled ownership is often appropriate.
If the answer is no, local/uncontrolled ownership may be simpler.

LAYER 2 — 🔬 DEEP MECHANICAL BREAKDOWN
5. What Does “Controlled” Actually Mean?
Consider:
function SearchBox({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      value={value}
      onChange={event => onChange(event.target.value)}
    />
  );
}

The component receives:
value
and reports:
onChange(...)

The important relationship is:
Parent state
│
▼ value prop
│
▼ SearchBox
│
│ user types
▼ onChange(newValue)
│
▼ Parent state update
│
▼ new render

The child does not maintain another authoritative copy.

6. Controlled Does Not Mean “No Internal State”
This distinction is important.
A component may be controlled for one piece of state while maintaining unrelated internal state.

Example:
function Select({
  value,
  onChange,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  // value is externally controlled
  // isOpen is internally owned
}

Architecture:
Select
├── externally controlled:
│   value
│
└── internally controlled:
    isOpen

Therefore:
Controlled/uncontrolled is a property of a particular state dimension, not necessarily the entire component.

7. Controlled Input — Mechanical Timeline
Consider:
function Form() {
  const [name, setName] = useState("");

  return (
    <input
      value={name}
      onChange={event => {
        setName(event.target.value);
      }}
    />
  );
}

Render #1:
State: name = ""
React produces an input whose current controlled value is: ""
Browser displays: [ ]

User types A:
The browser reports an input event.
The handler executes:
event.target.value ↓ "A"
Then:
setName("A")

Render #2:
State: name = "A"
React renders:
value = "A"

The important point:
DOM event ↓ state transition ↓ render ↓ controlled value
The state owner remains authoritative.

8. What Makes This Different From Uncontrolled?
Uncontrolled:
<input defaultValue="" />
The component/browser-managed value evolves independently after initialization.
Conceptually:
initial value ↓ input ↓ internal/current DOM value

Controlled:
<input value={name} onChange={...} />
Conceptually:
React state ↓ current value ↓ input

The critical distinction is authority over the current value.

9. defaultValue Is Not a Dynamic value
This is one of the most important practical distinctions.
<input defaultValue="Alice" />
means approximately:
Initialize the input with "Alice".
It does not mean:
Keep the input synchronized with the "Alice" expression forever.

Compare:
<input value={name} />
which means:
The current value comes from name.

Therefore:
value = current controlled value
while:
defaultValue = initial value

10. Prediction Challenge — defaultValue
Consider:
function Example() {
  const [name, setName] = useState("Alice");

  return (
    <>
      <button onClick={() => setName("Bob")}>
        Change
      </button>
      <input defaultValue={name} />
    </>
  );
}

Render #1:
name = "Alice"
Input initializes with: Alice

User manually changes input to: Alex
Now:
React state = Alice
input current value = Alex

Click Change:
Render #2:
name = "Bob"

The important question:
Should the existing uncontrolled input necessarily become "Bob"?
No.
defaultValue establishes the initial value rather than making the input continuously controlled by name.
This is exactly why the distinction matters.

11. Controlled State as a Feedback Loop
Controlled components form a feedback loop:
┌───────────────┐
│  State Owner  │
└───────┬───────┘
        │
        │ current value
        ▼
┌───────────────┐
│   Component   │
└───────┬───────┘
        │
        │ user interaction
        ▼
┌───────────────┐
│ semantic event│
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ state update  │
└───────┬───────┘
        │
        └──────────► render

This makes external coordination possible.

12. Why Controlled Components Are Powerful
Suppose the parent owns:
query
Then other components can derive behavior from it:
SearchInput
│
├── query
▼
SearchResults
▼
SearchAnalytics

One interaction can coordinate multiple consumers.

Example:
function SearchPage() {
  const [query, setQuery] = useState("");

  return (
    <>
      <SearchInput value={query} onChange={setQuery} />
      <SearchResults query={query} />
      <SearchSummary query={query} />
    </>
  );
}

There is one authoritative value:
SearchPage.query

13. When Uncontrolled Is Better
Suppose:
SimpleInput
is only responsible for collecting a value until submission.
There may be no reason for the parent to rerender on every keystroke.

An uncontrolled design can be appropriate when:
only component needs current value
continuous external coordination is unnecessary

The principle is not:
controlled = better
It is:
correct ownership = better

14. Controlled vs Uncontrolled Decision
Requirement | Controlled | Uncontrolled
--- | :---: | :---:
Parent needs every change | ✅ | Usually ❌
Sibling must react immediately | ✅ | Usually ❌
Parent validates continuously | ✅ | Maybe
Component is completely isolated | Maybe | ✅
Initial value only | Maybe | ✅
External state is authoritative | ✅ | ❌
Internal value is authoritative | ❌ | ✅
Complex cross-component coordination | ✅ | Usually ❌
Simple local form field | Maybe | ✅
Reusable primitive | Often useful | Often useful

15. Controlled Components Are Contracts
A controlled component should have a clear contract.
For example:
type InputProps = {
  value: string;
  onChange: (value: string) => void;
};

The contract says:
consumer owns current value
component reports requested changes

This is much stronger than:
type InputProps = {
  state: string;
  setState: React.Dispatch<React.SetStateAction<string>>;
};
The latter exposes implementation details.

16. Event Semantics
Prefer:
onChange(value)
when the component abstraction is:
"the value changed"
rather than requiring consumers to understand:
event: ChangeEvent<HTMLInputElement>
unless exposing the native event is itself part of the intended API.

For a low-level input primitive:
onChange(event)
may be appropriate.

For a higher-level component:
onValueChange(value)
may create a cleaner abstraction.
The API should match the component's abstraction level.

17. Controlled Ownership Is Not Callback Ownership
This:
onChange={setValue}
does not mean the child owns the value.
It means:
child invokes callback
parent owns transition

The function travels downward:
parent ↓ callback prop ↓ child
but ownership remains:
parent

18. The “Read-Only Controlled Component” Failure
Consider:
<input value={name} />
with no mechanism for changing name.

The component is controlled.
But user interaction cannot update the source of truth.
Depending on the element/API, React may warn or the input may behave as effectively read-only.

The architectural failure is:
controlled value + no valid transition path

A controlled component normally needs:
value + change contract
when users are expected to edit it.

19. Prediction Challenge — Controlled Input
function Form() {
  const [name, setName] = useState("A");

  return (
    <input
      value={name}
      onChange={e => setName(e.target.value)}
    />
  );
}

Render #1:
state = "A"
DOM value = "A"

User types B.
Event reports: "AB"
State update: setName("AB")

Render #2:
state = "AB"
DOM controlled value = "AB"

There is no second React state copy.

20. Prediction Challenge — Parent Overrides Child
function Parent() {
  const [value, setValue] = useState("A");

  return (
    <>
      <button onClick={() => setValue("PARENT")}>
        Parent
      </button>
      <Child value={value} onChange={setValue} />
    </>
  );
}

Child tries:
onChange("child")
Parent becomes:
value = "child"

Then parent button runs:
setValue("PARENT")
New authoritative value:
"PARENT"

The child does not get to preserve its own independent value because it is controlled by the parent.

21. Uncontrolled Components and Refs
A common uncontrolled pattern uses a ref to inspect the current DOM value:
function Form() {
  const inputRef = useRef<HTMLInputElement>(null);

  function submit() {
    console.log(inputRef.current?.value);
  }

  return (
    <>
      <input ref={inputRef} defaultValue="Alice" />
      <button onClick={submit}>Submit</button>
    </>
  );
}

Conceptually:
DOM/input
│
└── owns current value

ref
│
└── provides imperative access

The ref is not itself the source of truth.
It is a handle to the underlying instance.
Detailed ref mechanics belong elsewhere; here the key architectural point is ownership.

22. Controlled vs Uncontrolled Is Not About React vs DOM
A common oversimplification is:
controlled = React
uncontrolled = DOM

The deeper distinction is:
controlled: external owner determines current value
uncontrolled: component/internal mechanism determines current value

The implementation can involve React state, DOM state, or other internal mechanisms.

23. Hybrid Components
Reusable libraries sometimes support:
<Component value={value} onChange={onChange} />
or:
<Component defaultValue="initial" />
This gives consumers a choice.

Conceptually:
      Component
       /     \
      /       \
 controlled  uncontrolled
   mode        mode

This can be valuable—but it introduces contract complexity.

24. The Controlled/Uncontrolled Mode Contract
A robust hybrid component needs to determine:
Was value provided?

Conceptually:
value prop present ↓ controlled
value prop absent ↓ uncontrolled

The component then needs consistent behavior for:
initialization
updates
callbacks
defaults
mode selection
lifecycle
invalid transitions

A hybrid component is therefore not merely:
value || internalState
It is an ownership contract.

25. The Mode-Switching Trap
A component should generally not casually transition from:
uncontrolled
to:
controlled
during its lifetime, or vice versa.

Why?
Because ownership changes while the component is already holding state.

Example:
Render #1 value prop absent ↓ component owns value
Then:
Render #2 value prop supplied ↓ external owner now claims authority

Who wins?
internal value? external value?

Without a clearly defined contract, behavior becomes ambiguous.
React development warnings exist around these patterns because they frequently represent accidental ownership changes.

26. Production Anti-Pattern — Accidental Hybrid
function Input({ value }: Props) {
  const [localValue, setLocalValue] = useState(value);

  return (
    <input
      value={localValue}
      onChange={e => setLocalValue(e.target.value)}
    />
  );
}

The parent believes:
value
is authoritative.
The child believes:
localValue
is authoritative.
That is an ownership conflict.

27. Production Anti-Pattern — Two-Way Synchronization
Parent.value
↓
Child.value
↓
Child.localValue
↓
effect
↓
Parent.value

This can create feedback loops, ordering complexity, and stale representations.
A cleaner design is usually:
ONE OWNER ↓ controlled value ↓ semantic events
or:
CHILD OWNER ↓ local state
depending on requirements.

28. Production Anti-Pattern — useEffect as Ownership Glue
Avoid using effects simply to force two state owners to agree:
useEffect(() => {
  setLocalValue(value);
}, [value]);

Ask first:
Why are there two owners?
If the child should be controlled:
remove local authoritative state
If the child needs a draft:
define draft semantics explicitly

Effects should synchronize with external systems, not routinely compensate for unclear ownership.

29. Controlled Form Architecture
Consider:
Form
├── firstName
├── lastName
├── email
└── password

A fully controlled form might be:
Form state
│
├── firstName ──► Input
├── lastName ──► Input
├── email ──► Input
└── password ──► Input

Advantages:
validation can react to changes
sibling fields can coordinate
submit logic has current state
conditional UI can derive from state
external consumers can observe changes

But the cost is increased ownership and update propagation.
Therefore:
Do not make every input controlled merely because controlled inputs are familiar.

30. Local Form Ownership
Alternatively:
Form
└── FormFields
    ├── firstName local
    ├── lastName local
    ├── email local
    └── password local

The form may only receive values on submission.
This can be architecturally cleaner when:
continuous external coordination is unnecessary
The correct choice depends on requirements.

31. State Boundary Matrix
Requirement | Recommended Direction
--- | ---
Input only affects itself | Local/uncontrolled
Parent displays current input | Controlled
Sibling reacts to input | Lift/control
Validation depends on multiple fields | Shared controlled state often useful
Draft should remain private until submit | Local draft
Parent must reset field explicitly | Controlled or explicit reset API
Component is a reusable primitive | Support clear ownership contract
Library component needs flexibility | Controlled/uncontrolled API may be appropriate

32. Reset Semantics
Controlled:
setValue("");
The owner explicitly resets the component.

Uncontrolled:
<input defaultValue="Alice" />
Changing defaultValue is not the same as continuously controlling the current value.
If an uncontrolled component needs explicit reset behavior, design a clear API.
Do not assume:
new defaultValue = reset

33. Key-Based Reset
A deliberate identity change can reset uncontrolled/local state:
<FormSection key={userId} />

When identity changes:
old occurrence ↓ unmount ↓ state discarded
new occurrence ↓ mount ↓ initial state

This can be useful.
But using keys as a generic reset mechanism without understanding identity can create surprising state loss.

34. Controlled Component and State Preservation
A controlled value does not depend on the child's internal state for persistence.

If:
Child remounts
but parent still owns:
value = "hello"
the new child can receive:
value = "hello"

This is a major architectural benefit.
Ownership outside the component can outlive the component occurrence.

35. Uncontrolled Component and Remounting
If the component itself owns the current value:
Component └── internal value = "hello"
and it is unmounted:
internal state disappears

When remounted:
initial value
is established again.

Therefore:
ownership boundary + component identity = state lifetime

36. Controlled Components and Derived State
Suppose:
function Search({
  value,
  onChange,
}: Props) {
  const normalized = value.trim().toLowerCase();
  return ...;
}

normalized does not need to become:
local state
if it is purely derived.

Keep:
authoritative value
and compute:
derived representation
when appropriate.

37. Controlled Components and Validation
A controlled component makes validation architecture explicit.

Example:
Form state
│
├── email
└── password
│
▼ validation
│
▼ error state / derived errors

This allows:
field A ↓ validation ↓ field B behavior
when cross-field coordination is required.
An isolated uncontrolled input makes such coordination less direct.
Again:
coordination requirement → ownership decision

38. Production Incident — Form Validation Uses Stale Value
Symptoms:
User enters new email
Validation still checks old email

Investigate:
Who owns email?
Possible architecture:
Input.localEmail
Form.email
Validation.email
Three representations.

If they are intended to represent one current value:
ownership duplication

If they represent:
draft
submitted
validated
then they may be legitimate—but the transitions must be explicit.

39. Production Incident — Parent Cannot Reset Child
Architecture:
Parent
│
└── Child owns uncontrolled value

Parent tries:
setSomething(...)
but has no direct ownership of the current input.

If the requirement is:
Parent must reset the current value at arbitrary times.
then the current ownership model may be insufficient.

Possible architectural solutions include:
1. Make the value controlled.
2. Define an explicit imperative reset contract.
3. Change the component boundary.

Do not invent synchronization state merely because reset became necessary.

40. Production Incident — Controlled Input Feels “Laggy”
Possible architecture:
Input ↓ parent update ↓ large component subtree ↓ render ↓ input value

At this point, investigate the render architecture and profiling.
Do not conclude:
“Controlled inputs are inherently slow.”
Controlled ownership is an architectural model.
Performance characteristics depend on the surrounding render graph and implementation.
Detailed optimization belongs to later material.

41. DevTools Diagnostic Lab
For a controlled component:
Inspect:
component props
value
callback props
owner component
state owner
component identity

Then trace:
interaction ↓ callback ↓ state update ↓ owner render ↓ new value prop

For an uncontrolled component:
Inspect:
initial/default props
refs if used
component identity
remount behavior
reset behavior

Ask:
Where does the current value actually live?

42. Diagnostic Experiment
Build:
function Demo() {
  const [value, setValue] = useState("A");

  return (
    <>
      <button onClick={() => setValue("PARENT")}>
        Parent Update
      </button>
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
      />
    </>
  );
}

Then:
Type several characters.
Click the parent button.
Observe the input.
Inspect the state.
Repeat with defaultValue.
Compare behavior.

The experiment demonstrates:
value = ongoing ownership
defaultValue = initialization

43. Production Decision Matrix
Question | Controlled | Uncontrolled
--- | :---: | :---:
External authority required? | ✅ | ❌
Continuous parent visibility? | ✅ | ❌
Cross-field coordination? | ✅ | Maybe difficult
Isolated field? | Maybe | ✅
Parent-driven reset? | Easy | Requires explicit design
Local implementation simplicity? | Lower | Higher
Component owns current value? | ❌ | ✅
Consumer owns current value? | ✅ | ❌

44. Senior Interview Gotchas
Gotcha 1:
“Controlled means the component has no state.”
Incorrect.
A component can have internal state for other concerns.

Gotcha 2:
“defaultValue keeps the input synchronized.”
Incorrect.
It establishes an initial value.

Gotcha 3:
“Uncontrolled means you cannot access the value.”
Incorrect.
You can expose or inspect it through deliberate mechanisms such as refs or submit-time extraction.

Gotcha 4:
“Controlled is always better.”
Incorrect.
It is more appropriate when external coordination is required.

Gotcha 5:
“Passing setState means the child owns state.”
Incorrect.
The owner is still the component whose state hook represents the authoritative value.

Gotcha 6:
“A hybrid component can freely switch modes.”
Dangerous.
Changing ownership semantics during the component's lifetime creates ambiguity and is commonly treated as an error.

Gotcha 7:
“If the parent needs reset, just duplicate the value.”
Usually wrong.
Reconsider the ownership boundary.

Gotcha 8:
“Effects solve controlled/uncontrolled synchronization.”
Usually the wrong first move.
Clarify ownership before introducing synchronization.

45. 🔥 CRUCIBLE
Challenge 1 — Identify the Owner
<Input value={name} onChange={setName} />
Who owns name?
Explain why the presence of setName in the child's props does not transfer ownership.

Challenge 2 — value vs defaultValue
Predict the behavior:
<input value={name} />
versus:
<input defaultValue={name} />
after name changes in the parent.

Challenge 3 — Two Owners
Identify the architectural problem:
Parent.name
Child.localName
when both represent:
current name
What should happen?

Challenge 4 — Legitimate Two Values
Determine whether this is legitimate:
savedTitle
draftTitle
Explain why this can be valid while:
parentTitle
childTitle
representing the same current value is suspicious.

Challenge 5 — Reset Requirement
A reusable input is uncontrolled.
The parent now needs to:
reset the field
at arbitrary times.
What ownership question should be answered before changing the implementation?

Challenge 6 — Hybrid Component
A component starts without:
value
and therefore owns internal state.
Three renders later, the parent supplies:
value="hello"
What ownership ambiguity has been introduced?

46. FINAL MULTI-RENDER CRUCIBLE
Consider:
function SearchPage() {
  const [query, setQuery] = useState("");

  return (
    <>
      <SearchInput value={query} onChange={setQuery} />
      <SearchResults query={query} />
    </>
  );
}

Render #1:
State:
SearchPage.query = ""
Props:
SearchInput.value = ""
SearchResults.query = ""

Interaction:
User types: react
SearchInput invokes:
onChange("react")
The child does not directly own the new value.
It requests a state transition from the owner.

Render #2:
SearchPage.query = "react"
New props:
SearchInput.value = "react"
SearchResults.query = "react"

One source of truth coordinates both components.

Now imagine an uncontrolled version:
SearchPage └── query = ""
SearchInput └── internalValue = "react"

Now SearchResults does not automatically know that:
SearchInput.internalValue = "react"
because the value is owned locally.

That is not inherently wrong.
It is simply a different architecture.
The critical question becomes:
Does the rest of the page need continuous access to the current value?
If yes:
controlled ownership
is usually the cleaner model.

47. COMPONENT API DESIGN TEMPLATE
When creating a reusable stateful component, explicitly document:
Component: ____________________
State dimension: ____________________
Current value owner: ____________________
Initialization mechanism: ____________________
Change mechanism: ____________________
Controlled API: ____________________
Uncontrolled API: ____________________
Reset semantics: ____________________
Unmount/remount behavior: ____________________
Mode-switch behavior: ____________________

This turns an implicit implementation detail into an explicit engineering contract.

48. CONTROLLED COMPONENT REVIEW CHECKLIST
Ownership:
[ ] I can identify the authoritative owner.
[ ] The current value has one source of truth.
[ ] The child does not accidentally maintain a second authoritative copy.
[ ] The owner is responsible for valid transitions.

API:
[ ] value semantics are explicit.
[ ] onChange semantics are explicit.
[ ] Event payloads match the component abstraction.
[ ] Generic setters are not exposed unnecessarily.
[ ] Controlled and uncontrolled modes are clearly distinguished.

Initialization:
[ ] value and defaultValue are not conflated.
[ ] Initial-value semantics are documented.
[ ] Reset behavior is explicit.

Lifecycle:
[ ] Remount behavior is understood.
[ ] Keys do not accidentally destroy state.
[ ] State lifetime matches ownership requirements.

Synchronization:
[ ] Effects are not being used to compensate for ambiguous ownership.
[ ] Duplicate state has been justified.
[ ] Draft state is semantically distinct from authoritative state.

Architecture:
[ ] Controlled state exists because external coordination requires it.
[ ] Local state remains local when possible.
[ ] Parent ownership is not introduced merely for convenience.
[ ] Component boundaries reflect responsibility.

49. PART COMPLETION STANDARD
You should now be able to explain:
[ ] What a controlled component is.
[ ] What an uncontrolled component is.
[ ] Why controlled/uncontrolled is fundamentally an ownership decision.
[ ] Why value differs from defaultValue.
[ ] Why defaultValue is initialization rather than continuous synchronization.
[ ] How controlled input updates propagate.
[ ] Why the child does not own state merely because it receives a setter.
[ ] Why a component can be controlled for one state dimension and uncontrolled for another.
[ ] When uncontrolled state is appropriate.
[ ] When controlled state is appropriate.
[ ] How controlled components enable sibling coordination.
[ ] Why uncontrolled state can simplify isolated components.
[ ] What a hybrid component is.
[ ] Why uncontrolled → controlled transitions are problematic.
[ ] Why controlled → uncontrolled transitions are problematic.
[ ] Why duplicate state creates ownership conflicts.
[ ] How legitimate draft state differs from redundant state.
[ ] How refs can provide access to uncontrolled values.
[ ] Why a ref is not automatically the source of truth.
[ ] How remounting affects uncontrolled state.
[ ] Why externally owned controlled state can survive child remounts.
[ ] How reset requirements influence ownership.
[ ] Why generic setters can weaken reusable component APIs.
[ ] How semantic callbacks improve contracts.
[ ] How to diagnose controlled/uncontrolled bugs.
[ ] How to reason through controlled input renders.
[ ] How to reason through uncontrolled initialization.
[ ] How to design a controlled component contract.
[ ] How to design an uncontrolled component contract.
[ ] How to decide between controlled and uncontrolled ownership in production.

50. FINAL ENGINEERING PRINCIPLE
Controlled versus uncontrolled is not fundamentally a debate about:
useState vs refs

It is a debate about:
WHO OWNS THE CURRENT VALUE?

The two architectures are:
CONTROLLED
external owner
│
▼ current value
│
▼ component
│
▼ user event
│
▼ external owner

and:

UNCONTROLLED
component
│
▼ internal current value
│
▼ user interaction

Neither is universally superior.
The senior decision is:
Need external coordination?
│
YES ↓ controlled
NO ↓ keep ownership local

Then refine the decision using:
reset requirements
validation requirements
cross-component coordination
lifecycle requirements
API boundaries
draft semantics
state lifetime

The strongest component architecture is not the one with the most control.
It is the one where ownership is explicit, singular, and aligned with responsibility.

Control a value when another boundary must own and coordinate it. Keep it uncontrolled when the component can legitimately own its current value. Never create two authoritative owners accidentally.
