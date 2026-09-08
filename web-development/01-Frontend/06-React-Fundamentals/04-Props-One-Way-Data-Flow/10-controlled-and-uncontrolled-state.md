Level 06 — React Fundamentals
KPI 04 — State & State Updates
PART 10 — Controlled & Uncontrolled State
[⬅️ Previous Part](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/09-state-structure-derived-state-normalization.md) | [📚 Level 06 Index](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/README.md) | [🧪 Companion Lab](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/examples/10-controlled-and-uncontrolled-state.html) | [Next Part ➡️](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/11-state-architecture-and-complex-transitions.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

1. The Core Question
A controlled/uncontrolled decision is fundamentally an ownership decision.
The important question is not:
“Should I use controlled inputs?”
It is:
“Where does the authoritative state for this component concept live?”

A controlled component receives its current value from its owner:
```
Parent owns state
      │
      ▼ props
Component renders value
      │
      ▼ User interaction
   callback
      │
      ▼
Parent updates state
      │
      ▼ new props
Component renders again
```

An uncontrolled component owns its internal state:
```
Component
│
├── internal state
├── user interaction
└── DOM/internal representation
```

The architectural distinction is:
```
CONTROLLED
external owner → value → component
component → event → external owner

UNCONTROLLED
component → internal state
```

2. Executive Concept Table
| Concept | Core Mechanism | Production Impact | Common Senior Trap |
| :--- | :--- | :--- | :--- |
| **Controlled** | Parent owns current value | Centralized coordination | Treating callback as optional decoration |
| **Uncontrolled** | Component owns current value | Encapsulation and locality | Assuming uncontrolled means “bad React” |
| **value** | Current authoritative value | Parent determines displayed state | Expecting user interaction to mutate it automatically |
| **defaultValue** | Initial value for internal state | Establishes starting state | Treating it as continuously synchronized |
| **onChange** | Event/update notification | Enables owner to update state | Calling it a state setter API |
| **Ownership** | Authority over state | Determines architecture | Two components both believing they own the same fact |
| **State transfer** | Ownership moves across boundary | Enables reusable APIs | Switching modes accidentally |
| **Controlled API** | Value + change contract | Explicit component contract | Ambiguous callback semantics |
| **Uncontrolled API** | Defaults + imperative access when necessary | Encapsulates local behavior | Overusing refs to recover missing architecture |
| **Hybrid component** | Supports either mode | Flexible library API | Designing ambiguous controlled/uncontrolled semantics |
| **Mode switching** | Controlled ↔ uncontrolled transition | Can create inconsistent behavior | Allowing it accidentally |
| **Form field** | Value ownership boundary | Determines validation/submission architecture | Mixing DOM, React, and parent state without a model |

3. The Golden Rule
> 🏆 **Golden Rule:** A stateful component should have one authoritative owner for each independently changing concept. Controlled components make that owner external; uncontrolled components keep that owner internal. The dangerous architecture is not either model—it is ambiguous ownership.

A second rule:
> `defaultValue` establishes an initial uncontrolled value. It does not mean “keep this component synchronized with the prop.”

4. Controlled Does Not Mean “More React”
A controlled component is not inherently superior.
For example:
```javascript
<input value={name} onChange={event => setName(event.target.value)} />
```
Here:
`name` is owned by React state outside the input.
The input is a projection of that state.

But an uncontrolled input can also be perfectly valid:
```javascript
<input defaultValue="Alice" />
```
Now the input manages its current value internally.

The correct choice depends on:
- who needs the value?
- who needs to validate it?
- who needs to coordinate it?
- who owns its lifetime?
- who needs to reset it?
- who needs to observe it?

5. The Fundamental Ownership Model
Controlled:
```
     OWNER
       │
       │ value
       ▼
┌─────────────────┐
│    COMPONENT    │
│                 │
│  renders value  │
└────────┬────────┘
         │ change
         ▼
       OWNER
```

Uncontrolled:
```
┌─────────────────┐
│    COMPONENT    │
│                 │
│ internal state  │
│        │        │
│        ▼        │
│      value      │
└─────────────────┘
```
Controlled components therefore create an explicit state ownership boundary.

6. Controlled Component: Mechanical Definition
Consider:
```javascript
function NameInput({ value, onChange }) {
  return (
    <input
      value={value}
      onChange={event => onChange(event.target.value)}
    />
  )
}
```
The component itself does not own the name.
It receives:
`value`
and reports:
`onChange(nextValue)`

The parent owns the actual state:
```javascript
function Profile() {
  const [name, setName] = useState("Alice")

  return (
    <NameInput value={name} onChange={setName} />
  )
}
```
The ownership graph is:
```
Profile
│
├── name state
└── NameInput
    ├── value prop
    └── onChange callback
```

7. Controlled Update Timeline
User types:
`"B"`

The sequence is conceptually:
```
Browser input event
        │
        ▼
NameInput event handler
        │
        ▼
  onChange("AB")
        │
        ▼
Parent setName("AB")
        │
        ▼
React schedules update
        │
        ▼
   Parent renders
        │
        ▼
NameInput receives value="AB"
        │
        ▼
input renders committed value
```
The important observation:
The child does not own the authoritative value.
It participates in changing the value by communicating with its owner.

8. Controlled Does Not Mean the DOM Is Irrelevant
A controlled input still ultimately interacts with the browser's DOM.
The ownership distinction is:
```
DOM ↓ reports interaction
React state ↓ authoritative application value
React render ↓ DOM representation
```
This is different from saying:
“React directly owns every keystroke as some magical browser state.”
The browser still produces the event.
React's component architecture determines where the application-level value is owned.

9. Render-by-Render Prediction #1 — Controlled Input
Consider:
```javascript
function SearchBox() {
  const [query, setQuery] = useState("")

  return (
    <input
      value={query}
      onChange={e => setQuery(e.target.value)}
    />
  )
}
```

**Render #1**
State:
`query = ""`
Input receives:
`value = ""`
DOM:
`<input value="">`

**User types "r"**
The event handler executes:
`setQuery("r")`
The current render's `query = ""` does not mutate.
React schedules another render.

**Render #2**
State snapshot:
`query = "r"`
Input receives:
`value = "r"`
React commits the new representation.

**User types "e"**
The same cycle occurs:
```
event ↓ setQuery("re") ↓ new render ↓ value="re" ↓ commit
```
The input's displayed application value follows the parent's state.

10. Why value Without onChange Is Dangerous
Consider:
```javascript
<input value={name} />
```
The input is being told:
“The current value is exactly name.”
But no mechanism exists for user interaction to update the owner.
The browser may report an input event, but the application's authoritative value remains unchanged.
React can therefore continue rendering:
`value = old value`

The user experiences an input that appears effectively read-only.
The issue is not that React is broken.
The contract is incomplete.

11. Controlled Contract
A robust controlled component commonly exposes:
`value`, `onChange`

Conceptually:
- `value`: current authoritative state
- `onChange`: notification/request describing the user's attempted change

The child should not assume that:
`onChange`
means:
"Here is the parent's setState function."
It means:
“The user interaction produced this semantic next value.”
That distinction preserves abstraction.

12. Semantic Callback Design
Prefer:
```javascript
<DatePicker value={date} onChange={setDate} />
```
or:
```javascript
<DatePicker value={date} onChange={nextDate => setDate(nextDate)} />
```
The component contract is:
`onChange(nextDate)`
rather than:
`setDate`

The consumer may happen to provide a setter.
But the component API should communicate the domain event/value contract.
This keeps the component decoupled from the parent's state implementation.

13. Controlled Component Does Not Mean “Pass the Setter”
This:
```javascript
<Counter value={count} onChange={setCount} />
```
can be perfectly valid.
But the API is still:
`value`, `onChange(nextValue)`

The child should not know:
"I received a React state setter."
It should only know:
"I received a callback that accepts the next value."
This distinction becomes important when the parent later changes its implementation.

14. Uncontrolled Components
Consider:
```javascript
function NameInput() {
  return <input defaultValue="Alice" />
}
```
The component does not receive a continuously authoritative value.
The initial value is:
`Alice`
After the user types:
`Alicia`
the input's current value is internally maintained.
The parent does not need to update a state variable after every keystroke.

15. defaultValue vs value
This distinction must become automatic.
```javascript
<input value={name} />
```
means:
*The current value is externally controlled.*

Whereas:
```javascript
<input defaultValue={name} />
```
means:
*Initialize the uncontrolled value from this value.*
It does not mean:
*Keep the input synchronized with name.*

16. Prediction #2 — defaultValue
Consider:
```javascript
function Editor({ initialName }) {
  return <input defaultValue={initialName} />
}
```
Initial render:
`initialName = "Alice"`
Input initializes with:
`Alice`

User changes it:
`Alicia`

Parent later renders:
`initialName = "Bob"`

The critical question:
> Does the input automatically become "Bob"?

Not merely because `defaultValue` changed.
`defaultValue` is an initialization mechanism, not continuous control.
This is exactly why the naming matters.

17. Controlled vs Uncontrolled
| Question | Controlled | Uncontrolled |
| :--- | :--- | :--- |
| **Who owns current value?** | External owner | Component/DOM |
| **Current value supplied every render?** | Yes | No |
| **Initial value** | `value` | `defaultValue` |
| **Parent receives changes?** | Usually | Only if explicitly subscribed |
| **Coordination** | Easy | More indirect |
| **Locality** | Lower | Higher |
| **API complexity** | Explicit | Simpler |
| **Useful for** | Shared/validated state | Encapsulated local behavior |
| **Main risk** | Feedback/control bugs | Hidden state / imperative access |
| **Ownership clarity** | High | Internal |

18. The Key Architectural Trade-Off
Controlled:
```
centralized authority + explicit synchronization + coordination
```
Uncontrolled:
```
encapsulation + locality + less parent state
```
Neither is inherently better.
The correct choice depends on ownership requirements.

19. When Controlled Is the Better Choice
Controlled state is generally useful when the parent needs to:
- validate immediately
- coordinate siblings
- derive other UI
- disable/enable other controls
- conditionally transform values
- persist draft state
- reset from external events
- serialize the current value
- coordinate multiple fields
- implement business rules

For example:
`quantity`, `price`, `discount`, `total`
If the parent owns the relationship:
`total = quantity × price - discount`
it may make sense for the relevant inputs to participate in a controlled state model.

20. When Uncontrolled Is the Better Choice
Uncontrolled state can be useful when:
- only the component needs the value
- the parent does not need every intermediate change
- the interaction is naturally local
- integration with imperative APIs is easier
- you want a simpler component API

For example, a complex text editor may internally manage substantial interaction state while exposing higher-level operations.
The architectural goal is not:
“Make everything controlled.”
It is:
`Keep ownership where the concept naturally belongs.`

21. Controlled State and One-Way Data Flow
Controlled components are a direct application of React's one-way data flow.
```
Parent State
     │
     ▼ Props
  Child UI
     │
     │ user event
     ▼ Callback
Parent State Update
```
There is no arbitrary child mutation of parent state.
The child communicates upward.
The owner updates state.
The owner renders downward.
This preserves the same architecture established in earlier KPIs:
```
data down
events up
```

22. Controlled Component as a State Boundary
A component can be designed as:
```
┌───────────────────────────────┐
│     Controlled Component      │
│                               │
│ Input:  value                 │
│ Output: onChange(nextValue)   │
│                               │
│ No ownership of current value │
└───────────────────────────────┘
```
This makes the component highly composable.
The parent can decide:
- where state lives
- how it is validated
- whether it is persisted
- whether it is shared
- whether changes are accepted

The child is responsible for rendering and translating interaction into semantic events.

23. Controlled Does Not Mean Every Event Must Be Accepted
A parent can reject or transform an attempted change.
For example:
```javascript
function NumericInput({ value, onChange }) {
  return (
    <input
      value={value}
      onChange={e => {
        const next = e.target.value
        if (/^\d*$/.test(next)) {
          onChange(next)
        }
      }}
    />
  )
}
```
The child can enforce an input-level contract.
Or the parent can enforce domain rules.
The important point is that the externally owned value remains authoritative.

24. Parent-Controlled Validation
Consider:
```javascript
function Signup() {
  const [email, setEmail] = useState("")
  const isValid = email.includes("@")

  return (
    <>
      <EmailInput value={email} onChange={setEmail} />
      <button disabled={!isValid}>
        Continue
      </button>
    </>
  )
}
```
The value is shared between:
- `EmailInput`
- `button validation`
- `submission`

Controlled ownership allows the parent to coordinate all of them from one canonical state value.

25. Uncontrolled Form
An uncontrolled form may look like:
```javascript
function SignupForm() {
  const formRef = useRef(null)

  function submit() {
    const formData = new FormData(formRef.current)
    // consume submitted values
  }

  return (
    <form ref={formRef}>
      <input name="email" defaultValue="" />
      <button type="button" onClick={submit}>
        Continue
      </button>
    </form>
  )
}
```
Here:
`form fields` do not need to exist as React state merely because they are editable.
The DOM can maintain the current values.
This can be an appropriate design when the application does not need React state for every intermediate edit.

26. Uncontrolled Does Not Mean “No React”
An uncontrolled component can still have:
- React props
- React callbacks
- React state
- refs
- validation
- effects
- composition

“Uncontrolled” refers specifically to the ownership of the particular value being discussed.
A component can have:
```
controlled selected value + uncontrolled internal animation state + internal focus state
```
without contradiction.
Always specify:
> Controlled with respect to which state?

27. Component APIs Can Be Partially Controlled
Consider a dropdown:
- `selectedValue` → controlled
- `open/closed` → internally managed

This is a valid architecture.
The important thing is to define ownership independently for each concept.
For example:
```
value: controlled
open: uncontrolled
```
The mistake is assuming:
“The entire component must either be controlled or uncontrolled.”
The real unit is the state concept.

28. Ownership Matrix
| Concept | Potential Owner |
| :--- | :--- |
| **Selected value** | Parent |
| **Popup open state** | Component |
| **Search query** | Parent or component |
| **Highlighted option** | Component |
| **Persisted selection** | Parent |
| **Draft input** | Component or parent |
| **Validation result** | Derived from canonical data |
| **Focus** | Usually DOM/component concern |
| **Submission state** | Parent/form owner |
| **Loading state** | Owner of the async operation |

This is how senior engineers reason about “controlled vs uncontrolled.”
Not as a binary ideology.

29. Render-by-Render Prediction #3 — Controlled Select
```javascript
function Select({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      <option value="a">A</option>
      <option value="b">B</option>
    </select>
  )
}
```
Parent:
```javascript
const [value, setValue] = useState("a")
```

**Render #1**
```
Parent state = "a" ↓ Select value = "a" ↓ DOM selected option = A
```
**User selects B**
Child calls: `onChange("b")`
Parent executes: `setValue("b")`

**Render #2**
```
Parent state = "b" ↓ Select value = "b" ↓ DOM selected option = B
```
The component's current value is determined by the owner.

30. The “Why Didn't My Value Change?” Trap
Consider:
```javascript
function Parent() {
  const [value, setValue] = useState("A")

  return (
    <Child
      value={value}
      onChange={next => {
        console.log(next)
      }}
    />
  )
}
```
The child reports: `"B"`, but the parent never updates: `value`.
Therefore the next render still has:
`value = "A"`

The child cannot permanently change its controlled value.
This is correct.
The parent owns the value.

31. Controlled Feedback Loop
A controlled component forms a feedback loop:
```
┌────────────────────────────────────────────────────────┐
│                                                        │
▼                                                        │
Owner → value → Component → event → Owner (state update) ┘
```
The loop is healthy when:
`one owner + deterministic value + semantic event`

The loop becomes dangerous when:
`multiple owners + bidirectional transformations + implicit synchronization`
exist.

32. Production Anti-Pattern — Two Owners
**Flawed:**
```javascript
function Parent() {
  const [value, setValue] = useState("")
  return (
    <Child value={value} onChange={setValue} />
  )
}

function Child({ value, onChange }) {
  const [internalValue, setInternalValue] = useState(value)
  // ...
}
```
Now the child has:
`external value`, `internal value`
What is authoritative?
The architecture is ambiguous.

33. Why Developers Create Two Owners
Usually because they want:
`external control + internal convenience`

That is a legitimate requirement.
But simply creating:
```javascript
const [internalValue, setInternalValue] = useState(value)
```
does not solve the ownership problem.
It creates two representations.
You need an explicit contract.

34. The Controlled/Uncontrolled Hybrid Pattern
A reusable component may intentionally support both modes:
```javascript
function Input({ value, defaultValue, onChange }) {
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue ?? "")

  const currentValue = isControlled ? value : internalValue

  function handleChange(nextValue) {
    if (!isControlled) {
      setInternalValue(nextValue)
    }
    onChange?.(nextValue)
  }

  return (
    <input
      value={currentValue}
      onChange={e => handleChange(e.target.value)}
    />
  )
}
```
The conceptual contract is:
- **controlled mode:** `value` is authoritative
- **uncontrolled mode:** `internal state` is authoritative

This is a legitimate library-component design.
But it must be documented precisely.

35. Hybrid Components Require Mode Stability
Once a component chooses `controlled` or `uncontrolled` during its lifetime, switching modes unexpectedly is dangerous.
For example:
```
Render #1: value = undefined → uncontrolled
Render #2: value = "Alice"   → controlled
```
Now ownership changes during the component's lifetime.
The component must define what that means.
Production-grade APIs generally warn against or explicitly manage such transitions.

36. Controlled-to-Uncontrolled Failure
Imagine:
```javascript
<Input value={maybeValue} />
```
where `maybeValue` can change between:
`undefined` and `string`.

Then:
`undefined → string`
can transition from `internal ownership` to `external ownership`.
This is not merely a type detail.
It is an ownership transition.

37. Uncontrolled-to-Controlled Failure
The reverse:
`string → undefined`
creates the opposite transition.
A component that was externally controlled suddenly loses its authoritative external value.
What should happen to its internal value?
If the API has not defined this, the component's behavior becomes ambiguous.
This is why controlled/uncontrolled mode should be treated as part of the component contract.

38. undefined Is Not Just “No Value”
In controlled APIs, the distinction between:
`undefined`, `null`, `empty string`
can be semantically important.
For example:
- `undefined` may mean: *uncontrolled*
- `""` may mean: *controlled empty value*

A senior component API must define these semantics deliberately.

39. Default Values Have a Different Meaning
Compare:
```javascript
<Input defaultValue="Alice" />
```
with:
```javascript
<Input value="Alice" />
```
The first means: *initialize internal state*.
The second means: *current authoritative value is Alice*.
This distinction is foundational for reusable components.

40. Default Value Is Not Synchronization
This is one of the most common bugs.
```javascript
function Search({ initialQuery }) {
  return <input defaultValue={initialQuery} />
}
```
A parent update:
`initialQuery: "Alice" → "Bob"`
does not imply:
`input: "Alice" → "Bob"`
because the prop was named `initialQuery`, not `query`.
The semantic contract is initialization.

41. Resetting Uncontrolled State
If an uncontrolled component needs to be reset, one mechanism is changing its identity:
```javascript
<Input key={user.id} defaultValue={user.name} />
```
A different key can create a new component occurrence.
That causes its internal state to initialize again.
This connects directly to the identity model from earlier Parts.

However:
Do not use keys as a generic synchronization mechanism.
A key reset is appropriate when the conceptual object truly changed.

42. Prediction #4 — Default Value + Key
Consider:
```javascript
<Input key={user.id} defaultValue={user.name} />
```
Initially:
`user.id = u1`, `user.name = Alice`
The input initializes: `Alice`.
User types: `Alicia`.

Now the parent switches to:
`user.id = u2`, `user.name = Bob`
The key changes: `u1 → u2`.
React treats this as a new identity.
The new input initializes from: `Bob`.
This is intentional reset behavior.

43. Controlled vs Uncontrolled and State Lifetime
Ask:
> What should survive when the parent rerenders?

- **Controlled:** parent state survives, and the child receives it again.
- **Uncontrolled:** child's internal state survives as long as the component identity survives.

This is why identity and ownership must be considered together.

44. Production Anti-Pattern — Mirroring Controlled Props
**Flawed:**
```javascript
function Input({ value }) {
  const [internalValue, setInternalValue] = useState(value)

  useEffect(() => {
    setInternalValue(value)
  }, [value])

  return <input value={internalValue} />
}
```
This creates:
`external value ↓ effect synchronization ↓ internal value ↓ UI`
The component is neither cleanly controlled nor cleanly uncontrolled.
The architecture now depends on synchronization.

45. Better Controlled Version
If the parent owns the value:
```javascript
function Input({ value, onChange }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  )
}
```
No mirror.
No synchronization effect.
One authoritative value.

46. Better Uncontrolled Version
If the component owns the value:
```javascript
function Input({ defaultValue, onChange }) {
  return (
    <input
      defaultValue={defaultValue}
      onChange={e => onChange?.(e.target.value)}
    />
  )
}
```
The callback can notify the parent.
But notification does not transfer ownership.
That distinction matters.

47. Notification vs Ownership
A parent may receive:
`onChange={handleChange}`
from an uncontrolled component.
That does not automatically make the component controlled.

For example:
```
uncontrolled input
│
├── internal value
└── onChange("Alicia")
        │
        ▼ parent
```
The parent knows the value.
But the component still owns the current value.
This distinction is critical.

48. Controlled Does Not Mean “Parent Knows More”
Ownership means:
`Who determines the current authoritative value?`
Observation is different.
A parent can observe `onChange` without owning the state.
Therefore:
`notification ≠ ownership`

49. Ref Access to Uncontrolled Values
Sometimes a parent needs the current value of an uncontrolled input at a specific moment.
A ref can provide imperative access:
```javascript
function Form() {
  const inputRef = useRef(null)

  function submit() {
    console.log(inputRef.current.value)
  }

  return (
    <>
      <input ref={inputRef} defaultValue="Alice" />
      <button onClick={submit}>
        Submit
      </button>
    </>
  )
}
```
This is different from making the input controlled.
The parent is asking:
“Give me the current value when I explicitly need it.”
rather than:
“I own the current value on every render.”

50. Imperative Access Is an Escape Hatch, Not a Replacement for State Architecture
Refs are appropriate for:
- focus
- selection
- DOM measurement
- imperative browser APIs
- one-time value reads
- integration with non-React systems

Do not use refs simply because state ownership is inconvenient.
Bad reasoning:
“I'll store everything in refs so React doesn't rerender.”
That bypasses React's declarative model without solving the ownership problem.

51. Controlled and Uncontrolled Forms
A large form can be designed either way.

**Controlled:**
```
React state
├── firstName
├── lastName
├── email
└── password
```

**Uncontrolled:**
```
DOM form
├── firstName
├── lastName
├── email
└── password
```
Neither architecture is automatically superior.
The right decision depends on whether React needs the intermediate values to drive application behavior.

52. Controlled Form Strength
Suppose:
`email`, `password`
must drive:
- submit eligibility
- password strength
- server validation
- dependent fields
- live preview

Controlled state may simplify the architecture because those values already exist in the React state model.

53. Uncontrolled Form Strength
Suppose:
`20 independent fields`
are only needed when the user submits.
If there is little value in rendering based on every keystroke, an uncontrolled form may avoid unnecessary application-level state.
The parent can read `FormData` at submission.
Again:
`The decision follows ownership and requirements, not ideology.`

54. Production Incident — Form State Conflict
**Symptom:**
A reusable input occasionally displays a value different from the parent.

**Architecture:**
`parent value + internalValue + effect synchronization`

**Failure:**
The component has two representations: `externalValue`, `internalValue` with an intended invariant:
`internalValue === externalValue`
But the invariant is maintained asynchronously.

**Corrective Action:**
Choose `controlled` or `uncontrolled` and define the ownership contract.

55. Production Incident — Default Value Misunderstanding
**Symptom:**
A form is opened for a different record, but an uncontrolled input still shows the previous user's text.

**Cause:**
The component receives:
`defaultValue={user.name}`
but retains the same identity.
The developer assumed `defaultValue` was synchronization.

**Corrective Options:**
- If the input should follow the user: `controlled value`
- If the editor should reset for a different conceptual record: `intentional key change`
The choice depends on the desired ownership model.

56. Production Incident — Accidental Mode Switch
**Symptom:**
A component behaves correctly initially but becomes inconsistent after data loads.
Initial: `value = undefined`
Later: `value = "Alice"`
The component moved: `uncontrolled → controlled`

**Root Cause:**
The API did not define stable ownership semantics.

**Corrective Architecture:**
Ensure the component has a stable mode contract.
If supporting both modes intentionally, define:
- how mode is determined
- what undefined means
- what happens on transitions
- which value is authoritative

57. Production Incident — “onChange Means Controlled”
**Symptom:**
A component receives `onChange={setValue}` and a developer assumes the component is controlled.
But the component internally manages `currentValue` and only emits notifications.

**Root Cause:**
Notification and ownership were conflated.

**Lesson:**
`onChange` does not define ownership.
The value contract does.

58. Controlled API Design
A strong controlled API should answer:
- What is the current value?
- What type is it?
- What does `onChange` receive?
- When is `onChange` called?
- Can `onChange` be rejected?
- What does `null` mean?
- What does `undefined` mean?
- Is empty value distinct from missing value?
- Who owns validation?
- Who owns formatting?

The more reusable the component, the more important these semantics become.

59. Controlled API Example
A good conceptual API:
```javascript
<CurrencyInput
  value={amount}
  onChange={setAmount}
  currency="USD"
/>
```
The contract:
- `value`: canonical amount
- `currency`: configuration
- `onChange(nextAmount)`: semantic value-change notification

The child does not need to know:
React state, database, form library, URL, global store.
The owner decides those things.

60. Uncontrolled API Example
```javascript
<CurrencyInput
  defaultValue={100}
  currency="USD"
  onChange={handlePreview}
/>
```
Contract:
- `defaultValue`: initial amount
- `onChange`: notification
- `internal current amount`: owned by component

The distinction is explicit.

61. Hybrid API Decision
Supporting both:
```javascript
<Input value={value} defaultValue="Alice" />
```
is often ambiguous.
A well-designed API usually defines:
- if `value` is supplied: *controlled*
- otherwise: *uncontrolled using defaultValue*

But the semantics must be documented.
A component should not silently treat `value` and `defaultValue` as two competing sources of truth.

62. Senior Decision Matrix
| Requirement | Prefer |
| :--- | :--- |
| Parent must know current value continuously | Controlled |
| Sibling behavior depends on value | Controlled |
| Validation depends on current value | Controlled |
| Live preview depends on value | Controlled |
| Parent must reset value externally | Controlled |
| Component is self-contained | Uncontrolled |
| Parent only needs value on submit | Uncontrolled can be appropriate |
| DOM-native form semantics are sufficient | Uncontrolled can be appropriate |
| Reusable library needs either ownership model | Explicit hybrid API |
| Parent merely needs notifications | Either |
| Need focus/imperative DOM operation | Ref, regardless of value ownership |
| Need both internal and external ownership | Stop and define the contract before implementing |

63. Senior Diagnostic Question
When reviewing a component, ask:
> If the parent renders again with the same props, where does the current value come from?

- **Controlled:** external state
- **Uncontrolled:** internal component/DOM state
- **Hybrid:** mode-dependent authority

If the answer is:
"Sometimes from here, sometimes from there."
you have found a potential ownership problem.

64. Controlled State and Derived State
Connect this Part to Part 09.
Suppose:
`const [query, setQuery] = useState("")`
and:
`const filtered = products.filter(...)`

The query is canonical.
The filtered collection is derived.
A controlled input can expose:
```javascript
<SearchInput value={query} onChange={setQuery} />
```
The architecture becomes:
```
query
  ├──► SearchInput
  └──► filteredProducts
```
One canonical fact drives multiple projections.
This is exactly the state architecture established previously.

65. Controlled State and State Ownership
Connect to KPI 03.
Suppose siblings need the same value:
`SearchInput`, `Results`, `ClearButton`

The narrowest common owner might be:
`SearchPanel`
Then:
```
SearchPanel state
  ├──► SearchInput.value
  │    └──► onChange
  ├──► Results
  └──► ClearButton
```
Controlled state is therefore one mechanism for enforcing the correct ownership boundary.

66. Controlled State and Identity
Consider:
```javascript
<Editor key={document.id} value={draft} onChange={setDraft} />
```
The value is controlled.
The identity still determines the lifetime of the component occurrence.
These are different dimensions:
- **ownership:** who controls value?
- **identity:** which component occurrence is this?

Do not confuse them.

67. Controlled vs Uncontrolled Is Not About Performance Alone
A common argument is:
“Uncontrolled is faster because it avoids renders.”
This is incomplete.
The actual architectural question is:
> Does React need this value to participate in rendering?

If yes, controlled state may be appropriate.
If no, uncontrolled state may be appropriate.
Performance is one consideration, not the definition.

68. Prediction #5 — Controlled Parent Rerender
Consider:
```javascript
function Parent() {
  const [name, setName] = useState("Alice")
  const [theme, setTheme] = useState("dark")

  return (
    <>
      <Input value={name} onChange={setName} />
      <button onClick={() => setTheme("light")}>
        Change theme
      </button>
    </>
  )
}
```
When theme changes:
Parent renders again.
The input receives:
`value = name`
The controlled value remains:
`Alice`
because it is owned by `name`, not by `theme`.
The parent's rerender does not inherently reset the input's value.

69. Prediction #6 — Uncontrolled Parent Rerender
Consider:
```javascript
function Parent() {
  const [theme, setTheme] = useState("dark")

  return (
    <>
      <input defaultValue="Alice" />
      <button onClick={() => setTheme("light")}>
        Change theme
      </button>
    </>
  )
}
```
The input is uncontrolled.
User types: `Alicia`.
Parent changes: `theme`.
Parent rerenders.
As long as the input's identity remains the same, its internal current value remains:
`Alicia`
The parent rerender does not reinitialize defaultValue.

70. Why Identity Matters Here
The previous prediction depends on:
`same component occurrence`

If instead:
```javascript
<input key={theme} defaultValue="Alice" />
```
then changing: `theme: dark → light` changes identity.
The uncontrolled input is recreated.
Its initial value becomes `Alice` again.
This is why:
`ownership + identity`
must be reasoned about together.

71. Anti-Pattern — Key as a Synchronization Hammer
Consider:
```javascript
<Input key={value} defaultValue={value} />
```
This forces remounting whenever value changes.
It may appear to synchronize the component.
But it actually means:
`destroy old occurrence → create new occurrence`
That destroys all internal state associated with the old occurrence.
It can reset:
- focus
- selection
- draft
- internal popup state
- animations
- other local state

Use identity changes when the conceptual entity changes—not merely because synchronization is inconvenient.

72. Controlled Component Testing Contract
A controlled component should be testable around:
- given value X $\to$ renders X
- given user interaction producing Y $\to$ calls `onChange(Y)`
- given parent rerender with Y $\to$ renders Y

The test architecture mirrors ownership.
For example:
```
render value="A" ↓ user interaction ↓ onChange("B") ↓ rerender value="B" ↓ UI shows B
```
This is a behavioral contract.

73. Uncontrolled Component Testing Contract
For an uncontrolled component:
- given defaultValue X $\to$ initializes X
- user interaction producing Y $\to$ internal value becomes Y
- parent rerender $\to$ current internal value remains Y unless identity/reset semantics intentionally replace it

This is a fundamentally different contract.
Testing should reflect that difference.

74. Production Anti-Pattern — Testing Implementation Instead of Ownership
Bad test:
`"the component calls setInternalValue"`
That tests an implementation detail.

Better:
`"after typing B, the input contains B"`
or, for controlled behavior:
`"typing B requests onChange('B')"`
Test the public state contract.

75. Diagnostic Lab — Determine Ownership
For a component under investigation:
- **Step 1:** Find the current value. Where is it read from?
- **Step 2:** Find the write path. Who changes it?
- **Step 3:** Find initialization. Where does the first value come from?
- **Step 4:** Find external synchronization. Does a prop get copied into state?
- **Step 5:** Find identity resets. Can keys/remounts reset it?
- **Step 6:** Write one sentence:
  > “The authoritative owner of X is ______.”
  If you cannot complete that sentence confidently, the component's ownership model probably needs review.

76. Diagnostic Lab — React DevTools
Use React DevTools:
1. Open the component.
2. Inspect props.
3. Inspect state.
4. Change the controlled value.
5. Observe which component owns the state.
6. Trigger a parent rerender.
7. Observe whether the value is preserved.
8. Change the key.
9. Observe whether internal state resets.
10. Compare controlled and uncontrolled implementations.

The goal is to connect visible behavior to:
`owner identity → props → state → render → commit`

77. Diagnostic Lab — Ownership Trace
Create a trace:
```
User interaction
       │
       ▼ DOM event
component handler
       │
       ▼ callback?
 external owner
       │
       ▼ state update
   new render
       │
       ▼ value prop
   component
```
For uncontrolled:
```
User interaction
       │
       ▼ DOM/component
internal state/value
```
Compare the two.

78. Diagnostic Lab — Mode Stability
For a reusable input:
Record:
- initial value
- initial controlled status
- later value
- later controlled status

Example:
```
Render 1: value = undefined  controlled = false
Render 2: value = ""         controlled = true
```
This is a mode transition.
Determine whether the API intentionally supports it.
If not:
`fix caller` rather than silently accepting ambiguous ownership.

79. Production Architecture Rule
Every reusable stateful component should have an explicit answer to:
- What does the component own?
- What does the parent own?
- What can the parent observe?
- What can the parent control?
- What initializes internal state?
- What resets internal state?
- What does `onChange` mean?

These are API design questions.
They should not be discovered accidentally through bugs.

80. Senior Gotcha — “Controlled Means Stateless”
Not necessarily.
A controlled component can still own:
- focus state
- hover state
- highlighted option
- animation state
- temporary interaction state
- measurement state

The word controlled applies to a specific concept.
A component can be externally controlled for:
`selectedValue`
while internally controlling:
`isFocused`
The correct question is always:
> Which state?

81. Senior Gotcha — “Uncontrolled Means DOM Only”
Not necessarily.
An uncontrolled React component can keep internal state:
```javascript
const [value, setValue] = useState(defaultValue)
```
and expose:
`defaultValue`, `onChange`, `ref`

The DOM is not the definition.
The defining property is:
`The current authoritative value is internally owned rather than externally supplied every render.`

82. Senior Gotcha — “Callbacks Transfer Ownership”
No.
`onChange` can mean:
`notification`
without:
`ownership`
Ownership changes when the API defines who determines the current authoritative value.

83. Senior Gotcha — “defaultValue Tracks the Prop”
No.
- `defaultValue` is initialization semantics.
- `value` is current-value semantics.

Do not use naming as decoration.
These props communicate fundamentally different lifecycle contracts.

84. Senior Gotcha — “Controlled Is Always More Testable”
Controlled APIs often make state transitions explicit, but uncontrolled components can have excellent behavioral contracts too.
The correct testing target is:
`observable ownership behavior`
not the presence or absence of useState.

85. Senior Gotcha — “Use a Key to Reset Everything”
A key changes identity.
Changing identity can reset all component-local state.
Therefore:
`key` is powerful but destructive.
Use it when the conceptual occurrence changed.
Do not use it to paper over an ownership or synchronization problem.

86. Architecture Decision Matrix
| Question | Controlled | Uncontrolled |
| :--- | :---: | :---: |
| Parent needs current value continuously | ✅ | ❌ |
| Parent coordinates sibling behavior | ✅ | ⚠️ |
| Local encapsulation is priority | ⚠️ | ✅ |
| Parent only needs submit-time value | ⚠️ | ✅ |
| Live validation | ✅ | ⚠️ |
| Live derived UI | ✅ | ⚠️ |
| Simple isolated field | ✅ | ✅ |
| Imperative integration | ✅ | ✅ |
| Explicit public ownership contract | Strong | Strong if designed |
| Multiple simultaneous authorities | ❌ | ❌ |

The final row is the most important.
Neither model permits ambiguous ownership.

87. Final Crucible — Design a Reusable Input
Design `<Input />` that supports:
- controlled mode
- uncontrolled mode
- defaultValue
- onChange
- reset

Before writing code, define:
1. How controlled mode is detected.
2. What `undefined` means.
3. What `null` means.
4. What `defaultValue` means.
5. Who owns current value.
6. What `onChange` emits.
7. Whether mode switching is allowed.
8. How reset works.
9. Whether reset is controlled externally.
10. Which internal state remains independent.

Only after these are defined should implementation begin.
That is the senior-level API design sequence.

88. Final Crucible — Modal
A modal supports: `open`, `close`, `confirm`.
**Question:** Should open be controlled?
Answer depends on whether the parent needs to coordinate:
- URL route
- permissions
- global navigation
- other dialogs
- business rules

If yes, controlled open may be appropriate:
```javascript
<Modal open={open} onOpenChange={setOpen} />
```
If the modal is entirely self-contained:
`uncontrolled open state` may be appropriate.
Again:
`Ownership follows requirements.`

89. Final Crucible — Search Box
Requirements:
- Search field
- Results list
- Clear button
- URL query
- analytics
- debounced search

Would uncontrolled state necessarily be the best choice?
Probably not.
The query participates in multiple concerns:
`input`, `results`, `URL`, `analytics`, `search behavior`, `clear operation`

A shared owner can provide a canonical query:
```
query
  ├──► SearchInput.value
  ├──► Results
  ├──► URL projection
  └──► search behavior
```
Controlled ownership makes that architecture explicit.

90. Final Crucible — File Input
A file input has special browser semantics and often interacts with:
- FileList
- DOM
- FormData
- upload APIs

Do not blindly apply the same mental model used for text fields.
The senior question is:
- What aspects of this browser-managed value can React meaningfully own?
- What needs imperative access?
- What should remain encapsulated?

The controlled/uncontrolled framework gives you the questions; the browser API determines the implementation constraints.

91. Master Mental Model
```
                  STATE CONCEPT
                        │
                        ▼
               Who owns the value?
                   /         \
              Parent        Component
                │               │
                ▼               ▼
           CONTROLLED      UNCONTROLLED
                │               │
              value       internal value
                │               │
                ▼               ▼
             render          render
                │               │
             event           event
                │               │
                ▼               ▼
            callback     internal update
                │
                ▼
           owner update
                │
                ▼
            new props
```

The critical architectural invariant is:
```
ONE CONCEPT ↓ ONE AUTHORITATIVE OWNER
```

92. The Ownership Equation
A useful senior abstraction is:
```
Component State Contract = Authority + Initialization + Mutation Channel + Reset Semantics + Lifetime
```

For controlled:
- **Authority** = external owner
- **Initialization** = current value
- **Mutation** = callback
- **Reset** = owner changes value
- **Lifetime** = external state lifetime

For uncontrolled:
- **Authority** = component/internal state
- **Initialization** = default value
- **Mutation** = internal interaction
- **Reset** = explicit internal mechanism/remount
- **Lifetime** = component identity lifetime

93. Completion Checklist

**Core Ownership**
- [ ] I can define a controlled component.
- [ ] I can define an uncontrolled component.
- [ ] I can explain ownership rather than memorizing API names.
- [ ] I can identify the authoritative owner of a value.
- [ ] I can distinguish ownership from notification.
- [ ] I can distinguish ownership from observation.
- [ ] I can explain why two owners are dangerous.
- [ ] I can identify state concepts independently within one component.

**Controlled APIs**
- [ ] I understand `value`.
- [ ] I understand `onChange`.
- [ ] I can design a semantic `onChange` contract.
- [ ] I understand why `value` without an update path can behave as read-only.
- [ ] I can trace a controlled update from event to commit.
- [ ] I can predict controlled state across multiple renders.
- [ ] I can coordinate siblings through controlled state.
- [ ] I can distinguish passing a setter from defining a setter-based API.

**Uncontrolled APIs**
- [ ] I understand `defaultValue`.
- [ ] I understand initialization semantics.
- [ ] I understand that `defaultValue` is not continuous synchronization.
- [ ] I can explain why uncontrolled state survives parent rerenders.
- [ ] I understand the role of component identity.
- [ ] I can use refs for legitimate imperative access.
- [ ] I understand why refs are not a replacement for state architecture.

**Hybrid APIs**
- [ ] I understand controlled/uncontrolled hybrid components.
- [ ] I understand mode detection.
- [ ] I understand mode stability.
- [ ] I can identify controlled-to-uncontrolled transitions.
- [ ] I can identify uncontrolled-to-controlled transitions.
- [ ] I can define undefined semantics.
- [ ] I can distinguish null from an uncontrolled sentinel where relevant.
- [ ] I can design explicit reset semantics.

**Architecture**
- [ ] I can choose controlled state based on coordination requirements.
- [ ] I can choose uncontrolled state based on locality requirements.
- [ ] I can reason about ownership per state concept.
- [ ] I can connect controlled state to one-way data flow.
- [ ] I can connect controlled state to canonical state.
- [ ] I can connect uncontrolled state to component identity.
- [ ] I can identify accidental synchronization.
- [ ] I can identify two-source-of-truth designs.
- [ ] I can explain why keys reset identity rather than synchronize values.

**Production Reasoning**
- [ ] I can diagnose stale mirrored state.
- [ ] I can diagnose default-value misconceptions.
- [ ] I can diagnose mode-switching bugs.
- [ ] I can diagnose ownership ambiguity.
- [ ] I can design a reusable controlled API.
- [ ] I can design a reusable uncontrolled API.
- [ ] I can explain the trade-offs of each.
- [ ] I can defend my decision using ownership, lifetime, coordination, and reset semantics.

94. Final Engineering Principle
> 🏆 **Controlled vs Uncontrolled Is Really About Authority**  
> The mature React engineer does not ask:  
> “Should I make this controlled?”  
> They ask:  
> “Who is the authoritative owner of this state concept?”

If the parent owns it, expose the current value and a semantic change contract.
If the component owns it, expose initialization semantics and keep the current value internal.
If both appear necessary, do not immediately synchronize them with effects. Define an explicit controlled/uncontrolled contract.
And if two places believe they own the same fact, the problem is architectural—not syntactic.

95. Part 10 Exit Criterion
You are finished with this Part when you can take an unfamiliar stateful component and determine:
1. What state concepts exist?
2. Who owns each concept?
3. Which concepts are controlled?
4. Which are uncontrolled?
5. What does each value prop mean?
6. What does each default prop mean?
7. What exactly does each callback communicate?
8. What happens when the parent rerenders?
9. What happens when the component identity changes?
10. What happens if the controlled value changes externally?
11. What happens if the value becomes undefined?
12. What happens if the component switches modes?
13. What is the reset mechanism?
14. Are there multiple representations of the same fact?
15. Is any synchronization effect hiding an ownership problem?

If you can answer those mechanically, you understand controlled and uncontrolled state as an architecture and ownership problem, rather than merely as a form-input API pattern.

Part Boundary
Next Part:
**KPI 04 — Part 11 — State Architecture & Complex State Transitions**
The next Part moves from individual state ownership and controlled boundaries into multi-field state transitions, coherent state updates, transactional thinking, impossible state combinations, and the architectural signals that indicate when simple independent state variables are becoming insufficient.
It will continue to build from:
```
canonical state ↓ ownership ↓ controlled/uncontrolled boundaries ↓ complex transitions
```
without prematurely moving into advanced reducer or concurrency internals.
