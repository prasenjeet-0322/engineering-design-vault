# Level 06 — React Fundamentals
## KPI 05 — Events & User Interaction
### PART 12 — Advanced Form Interaction Architecture

[⬅️ Previous Part](11-event-driven-state-architecture-in-complex-components.md) | [📚 Level 06 Index](README.md) | [🧪 Companion Lab](examples/12-advanced-form-interaction-architecture.html) | [Next Part ➡️](13-interaction-state-machines-and-async-workflows.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

# Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

## 1. Why Forms Become an Architecture Problem
A trivial form is:
```text
input
  ↓
state
  ↓
submit
```

A production form is often:
```text
User input
  ↓
field state
  ↓
validation
  ↓
interaction metadata
  ↓
submission
  ↓
async lifecycle
  ↓
server response
  ↓
field/form errors
  ↓
recovery
```

And potentially:
- Draft persistence
- Autosave
- Dependent fields
- Conditional fields
- Keyboard navigation
- Dirty tracking
- Confirmation dialogs
- Optimistic feedback
- Retry
- Cancellation

> **The Senior Question:**  
> Not: *“How do I make a form submit?”*  
> It is: *“How do I model ownership, events, validation, state transitions, and asynchronous outcomes so the form remains predictable as its complexity grows?”*

---

## 2. The Production Form Mental Model

```text
               USER
                │
        ┌───────┼────────┐
        │       │        │
      input    blur    submit
        │       │        │
        └───────┼────────┘
                ▼
      ┌───────────────────┐
      │   Event Adapter   │
      └─────────┬─────────┘
                │
                ▼
         Semantic Action
                │
        ┌───────┴───────┐
        ▼               ▼
   Field State   Validation Logic
        │               │
        └───────┬───────┘
                ▼
            Form State
                │
                ▼
            Submission
                │
                ▼
         External System
                │
        ┌───────┴───────┐
        ▼               ▼
     Success         Failure
        │               │
        └───────┬───────┘
                ▼
           New UI State
```

---

## 3. The Five Major Form Concerns
A production form commonly has at least five conceptually different concerns:
1. **Form values**
2. **Interaction metadata**
3. **Validation**
4. **Submission lifecycle**
5. **Server/remote errors**

For example:
- **Values:** `{ email: "user@example.com", password: "secret" }`
- **Interaction metadata:** `{ email: { touched: true } }`
- **Validation:** `{ email: null, password: "Password is too short" }`
- **Submission:** `idle | submitting | success | error`
- **Remote failure:** `"Email already exists"`

> [!IMPORTANT]
> Do not automatically collapse all five of these into one giant boolean state.

---

## 4. Executive Concept Table

| Concept | Core Mechanism | Production Impact | Common Senior Trap |
| :--- | :--- | :--- | :--- |
| **Form values** | User-controlled data | Source for submission | Duplicating values |
| **Touched** | Interaction metadata | Controls validation UX | Treating touched as validity |
| **Dirty** | Change-from-baseline state | Navigation protection | Assuming every dirty flag is derived |
| **Validation** | Rules over values | Prevents invalid submission | Treating client validation as authoritative |
| **Field error** | Error attached to field | Precise UX | Mixing server and local errors blindly |
| **Form error** | Cross-field/global error | Handles domain failures | Forcing every error into a field |
| **Submission state** | Lifecycle | Controls buttons/feedback | Boolean-only modeling |
| **Submit event** | User intent | Starts workflow | Treating submit as success |
| **Server response** | External result | Determines authoritative outcome | Assuming request completion means success |
| **Reset** | State replacement | Recovery/reuse | Resetting state unnecessarily |
| **Controlled input** | React owns value | Predictability | Creating excessive state for every derived value |
| **Uncontrolled input** | DOM owns current value | Useful for some cases | Mixing ownership models accidentally |
| **Validation timing** | When rules run | UX/performance | Validating at every event without reason |
| **Field dependency** | One field affects another | Correctness | Forgetting downstream invalidation |
| **Submission snapshot**| Values submitted at a point in time | Prevents ambiguity | Assuming live state after async starts |

---

## 5. Golden Rule

> [!IMPORTANT]
> A form is not one piece of state. It is a **coordinated interaction system** containing values, metadata, validation, submission lifecycle, and external outcomes.

---

# Layer 2 — 🔬 Deep Mechanical Breakdown

## 6. Controlled Form Architecture
Consider:
```jsx
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form>
      <input
        value={email}
        onChange={event => setEmail(event.target.value)}
      />
      <input
        type="password"
        value={password}
        onChange={event => setPassword(event.target.value)}
      />
    </form>
  );
}
```

The ownership model is:
```text
React state
  ↓
input value
  ↓
user interaction
  ↓
onChange
  ↓
state update
  ↓
render
  ↓
input value
```
React owns the current value. This gives the application a predictable source of truth.

---

## 7. Controlled Does Not Mean "Every Character Must Have Global State"
This is a common overreaction.

A controlled input means:
> The value is supplied by React/application state rather than being independently owned by the DOM.

It does not mean:
$$\text{every keystroke} \rightarrow \text{global store}$$
Local component state is still controlled state.  
The **ownership boundary** matters more than the storage technology.

---

## 8. Form State vs Field State
Suppose:
```text
RegistrationForm
├── NameInput
├── EmailInput
└── PasswordInput
```

You could keep:
```javascript
const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
```
or:
```javascript
const [form, setForm] = useState({ name: "", email: "", password: "" });
```

Neither is inherently superior.

**Ask:**
- Do fields transition independently?
- Do they share invariants?
- Are updates frequently grouped?
- Does one action update multiple fields?
- Would a reducer clarify the workflow?

Architecture should follow relationships, not aesthetics.

---

## 9. The Form Submission Event
A proper form submission handler:
```javascript
function handleSubmit(event) {
  event.preventDefault(); // interpret submission
}
```

The browser event is infrastructure information. The application cares about:
$$\text{SUBMIT\_REQUESTED}$$

Therefore:
```javascript
function handleSubmit(event) {
  event.preventDefault();
  dispatch({ type: "SUBMIT_REQUESTED" });
}
```
The transition layer should not need to understand `event.target`, `event.currentTarget`, or `preventDefault()` unless that information is genuinely required there.

---

## 10. Submit Is an Intent, Not a Result
This distinction is fundamental.

When the user clicks **Submit**, that means:
$$\text{SUBMIT\_REQUESTED}$$
It does **not** mean:
$$\text{SUBMIT\_SUCCEEDED}$$

The sequence is:
```text
SUBMIT_REQUESTED
  ↓
validation
  ↓
submission begins
  ↓
request
  ↓
response
  ↓
success / failure
```
Confusing these states creates incorrect UI.

---

## 11. Form Validation
Validation can happen at several boundaries:
- **Field-level:** Email must contain valid structure (`@`).
- **Form-level:** `password === confirmPassword`.
- **Domain/server-level:** Email already registered in database.

These are not equivalent. A useful mental model:
```text
Local validation
  ↓
Can this interaction proceed?

Server validation
  ↓
Does the authoritative system accept it?
```

---

## 12. Client Validation Is Not Authority
Suppose:
`email = "new@example.com"`  
Client validation passes.

The server responds:
`409 Conflict: Email already exists`

The UI must accept that result. Client validation is an optimization for user experience. The server remains authoritative for server-controlled rules.

---

## 13. Derived Validation
If validation is synchronous and inexpensive:
```javascript
const emailError = email.length === 0
  ? "Email is required"
  : !email.includes("@")
    ? "Invalid email"
    : null;
```

There is no need for:
```javascript
const [emailError, setEmailError] = useState(null);
```
if `emailError` is purely derived from `email`.

> [!TIP]
> **The Rule:** Do not store a value independently when it can reliably be derived from authoritative state.

---

## 14. But Validation Metadata Can Be Real State
Consider:
- User has not interacted with email yet.
- User interacted with email, left the field, and it is invalid.

The validation result is the same: `invalid`.  
However, the UI behavior differs:
- `untouched + invalid` $\rightarrow$ don't show error yet (avoid annoying the user).
- `touched + invalid` $\rightarrow$ show error clearly.

Therefore, `touched = false / true` is meaningful, independent state.

---

## 15. Touched Is Not Valid
Do not create semantic confusion:
```typescript
{ touched: true, valid: true }
```
These answer completely different questions:
- **`touched`:** *"Has the user interacted with or blurred this field?"*
- **`valid`:** *"Do the current values satisfy validation rules?"*

They should never be collapsed.

---

## 16. Dirty Is Also Different
- **`touched`** means interaction occurred.
- **`dirty`** means current values differ from baseline.

A field can be: `touched = true`, `dirty = false`.

**Example:**
- `initial = "React"`
- user changes $\rightarrow$ `"Vue"` (touched = true, dirty = true)
- user changes back $\rightarrow$ `"React"` (touched = true, dirty = false)

This is why:
$$\text{touched} \neq \text{dirty}$$

---

## 17. Validation Timing
Possible strategies:
1. **On change:** Immediate feedback. Downside: validation runs on every keystroke, potentially shouting errors before completion.
2. **On blur:** Less intrusive. Shows errors only after the user finishes interacting with the field.
3. **On submit:** Minimal interruption. Useful for simple, short forms.
4. **Hybrid (Standard Production Pattern):**
   - Before interaction: minimal feedback.
   - After blur: show field feedback.
   - After submit: show all relevant validation immediately.

---

## 18. Field Dependencies
Suppose:
- `country`
- `state / province`

Changing `country` can invalidate `state`. The transition is not merely `country = "Canada"`.  
It implies:
1. `country` changed
2. `state` selection is no longer valid
3. `state` must reset to `null`

Therefore, one semantic event produces multiple coordinated state changes:
```javascript
// Action:
{ type: "COUNTRY_CHANGED", country: "CA" }

// Transition:
{
  country: "CA",
  state: null // Invariant preserved
}
```

---

## 19. Dependent Field Invariants
Suppose:
`country = "US"`, `state = "California"`.  
The user selects `country = "India"`.

Keeping `state = "California"` creates an impossible, corrupt state.  
The invariant is:
> *The selected state must belong to the selected country.*

The transition must preserve this invariant. This is stronger than independently calling `setCountry("India")` and `setState(null)` from multiple ad-hoc handlers.

---

## 20. Form Submission Snapshot
Consider:
```javascript
async function handleSubmit() {
  const payload = { email, password };
  await submit(payload);
}
```

The payload represents the values captured when submission started.  
During the async request, the user may continue editing `email`. The in-flight request does not mutate because React state changed.

$$\text{current form state} \neq \text{historical request payload}$$

---

## 21. Async Submission Timeline

```text
Render #1:
  email = "a@example.com"
  password = "password123"

User clicks Submit:
  SUBMIT_REQUESTED
    ↓
  Payload Snapshot: { email: "a@example.com", password: "password123" }
    ↓
  Request starts...

User edits email:
  Render #2:
    email = "b@example.com"

Original request in flight still contains:
  "a@example.com"
```
The request already received its own input snapshot.

---

## 22. Why This Matters
Without this mental model, developers may incorrectly assume:
> *“The form changed, so the request should now use the new values.”*

No. The request received its own snapshot upon invocation. This is a manifestation of snapshot-based reasoning.

---

## 23. Submission Lifecycle
A robust lifecycle:
```text
idle
  ↓
SUBMIT_REQUESTED
  ↓
validating (if async)
  ↓
submitting
  ├── SUBMIT_SUCCEEDED → success
  └── SUBMIT_FAILED → error
```

Do not introduce `validating` as state if validation is synchronous and occurs within the same event execution tick. State must represent meaningful, observable conditions.

---

## 24. Field Errors vs Form Errors
A server might return:
```json
{ "email": "Email already exists" }
```
This is a **field-specific error**.

Another response:
```text
"503 Service Unavailable: Unable to complete registration at this time."
```
is a **form-level error**.

Do not force a generic server error into an individual field error; preserve the semantic location of the failure.

---

## 25. Cross-Field Errors
Some validation belongs to relationships between fields:
- `password`
- `confirmPassword`

Error: *"Passwords do not match."*  
This does not belong exclusively to either field. Visual placement (under `confirmPassword`) should be kept separate from logical invariant ownership (`password === confirmPassword`).

---

## 26. Reset Semantics
A form reset can mean several different things:
- Reset current values
- Reset validation errors
- Reset touched metadata
- Reset submission status
- Restore initial server values
- Discard draft

A production reset action should be explicit:
$$\text{FORM\_RESET}$$
with a clear contract of what is reset. Avoid `setForm(initialState)` if `initialState` accidentally resets unrelated lifecycle state.

---

## 27. Partial Reset
Suppose submission failed:
- **Do not:** `draft → empty` (user loses all typed work).
- **Correct:**
  ```javascript
  {
    ...state,
    submission: { status: "error", error: message }
    // draft remains intact
  }
  ```
User data is expensive to reproduce.

---

## 28. Disabled Submit vs Validation
A common pattern:
```jsx
<button disabled={!isValid || status === "submitting"}>
  Submit
</button>
```
Distinguish the reasons:
- `invalid`
- `not yet validated`
- `currently submitting`

The UI should communicate why submission is unavailable.

---

## 29. Do Not Trust UI Disabled State for Correctness
`<button disabled={status === "submitting"}>` reduces accidental duplicate clicks in the browser.  
It does **not** replace backend idempotency or uniqueness validation. A client script or network glitch can still send duplicate HTTP requests.

$$\text{UI Guard} + \text{Server Correctness} = \text{Separate Layers}$$

---

## 30. Controlled ↔ Uncontrolled Boundary
A common React error is accidentally changing ownership:
```jsx
<input value={value} />
// then later:
<input defaultValue={initialValue} />
```
- **Controlled:** React owns the value.
- **Uncontrolled:** DOM owns the value.

Never switch ownership models during a component's lifecycle.

---

## 31. When Uncontrolled Inputs Are Reasonable
Uncontrolled inputs (`useRef` / `FormData`) are reasonable when:
- The form is simple.
- Values do not drive dynamic rendering or conditional fields.
- Values are only read once at submit time.
- Integrating with non-React DOM libraries.
- Minimizing keystroke re-renders in massive data-entry grids.

The question is: *“Who owns the current value?”*

---

## 32. Form Ownership Architecture
Suppose:
```text
CheckoutPage
├── BillingForm
├── ShippingForm
└── OrderSummary
```
- If only `BillingForm` needs billing fields: `BillingForm` owns billing state.
- If `OrderSummary` needs the billing address for tax calculations: `CheckoutPage` owns the shared source of truth.

Lift state because another consumer needs the same authoritative state, not just because a parent component exists.

---

## 33. Form Context and Shared Access
Large forms can use context so deeply nested fields access form state without prop drilling:
```text
Form
 │
 ├── Section
 │    └── Field
 └── Section
      └── Field
```
Context distributes: form values, validation, dispatch, registration, and submission status.  
Context does not eliminate the need for state architecture; it only changes distribution.

---

## 34. Form Context Is Not a Global Store
A form context should remain scoped:
```text
CheckoutForm
  ↓
Scoped FormContext
  ↓
Descendants
```
It does not belong in the global application store. Keep scope aligned with ownership.

---

## 35. Dynamic Fields
Production forms often allow:
- Add address
- Remove address
- Reorder line items

Stable domain identity (`id`) is critical:
```jsx
{addresses.map(address => (
  <AddressField key={address.id} address={address} />
))}
```
Keys must follow the entity identity, not the array index.

---

## 36. Dynamic Field Removal
Suppose entities: `[A, B, C]`.  
User removes `B`. Remaining: `[A, C]`.

- **With Stable IDs:** `A` remains `A`, `C` remains `C`.
- **With Array Indices ($0, 1, 2$):** $0 \rightarrow A$, $1 \rightarrow C$. The second component instance represents a new entity, corrupting local field focus and transient state.

---

## 37. Form State Normalization
For dynamic entities:
```javascript
{
  byId: {
    "addr-1": { street: "123 Main St", city: "Seattle" },
    "addr-2": { street: "456 Pine St", city: "Portland" }
  },
  allIds: ["addr-1", "addr-2"]
}
```
Maintain one authoritative representation for each independent entity.

---

## 38. Production Anti-Pattern — Store Every Validation Result
### Flawed
```javascript
const [email, setEmail] = useState("");
const [emailError, setEmailError] = useState("");
```
Every update manually synchronizes both.

### Mechanical Failure
Two pieces of state represent related facts. A missed synchronization produces:
`email = "valid@example.com"`, `emailError = "Invalid email"`.

### Better
Derive synchronous validation during render:
```javascript
const emailError = validateEmail(email);
```

---

## 39. Production Anti-Pattern — One isValid Flag
### Flawed
```javascript
const [isValid, setIsValid] = useState(false);
```
Why is this weak? Validity depends on `email`, `password`, `confirmPassword`, `terms`, and server state. Storing a boolean hides the source of truth.

### Better
$$\text{Authoritative Values} + \text{Derived Validation} + \text{Explicit Submission State}$$

---

## 40. Production Anti-Pattern — Reset Form on Every Server Error
### Flawed
```javascript
catch {
  setForm(initialForm); // Wipes out all user inputs!
}
```
Preserve user values; only update submission error state.

---

## 41. Production Anti-Pattern — Treat Submit as Success
### Flawed
```javascript
function handleSubmit() {
  setSubmitted(true);
  save();
}
// UI: {submitted && <SuccessMessage />}
```
Submit was *attempted*, not *succeeded*. Use `submission.status = "submitting"`, then transition to `"success"` upon server resolution.

---

## 42. Production Anti-Pattern — Validation Effect Pipeline
### Weak
```javascript
const [isValid, setIsValid] = useState(false);

useEffect(() => {
  setIsValid(validate(form));
}, [form]);
```
This causes an unnecessary 2-pass render cycle:
$$\text{form change} \rightarrow \text{render} \rightarrow \text{effect} \rightarrow \text{state update} \rightarrow \text{render again}$$

### Better
```javascript
const isValid = validate(form); // Computed directly during render
```

---

## 43. Production Anti-Pattern — Mixing Server and Client Errors
If both client regex errors and server "already taken" errors are stored in a single undifferentiated string, clearing client errors on input change can accidentally erase server error context. Keep sources distinguishable.

---

## 44. Prediction Walkthrough — Basic Form
1. **Initial render:** `{ email: "", password: "", status: "idle" }`
2. **User types "a":** State $\rightarrow$ `{ email: "a", password: "", status: "idle" }`
3. **Render #2** uses this snapshot.
4. **User types "a@":** State $\rightarrow$ `{ email: "a@", password: "", status: "idle" }`
5. **Render #3** uses this snapshot.

Each render produces its own snapshot and associated handlers.

---

## 45. Prediction Walkthrough — Submit Snapshot
1. Render: `email = "a@example.com"`
2. User submits: `payload = { email: "a@example.com" }`
3. In-flight request starts.
4. User edits input: `email = "b@example.com"`.
5. Render #2 occurs. UI displays `"b@example.com"`.
6. The running request still contains `"a@example.com"`.

---

## 46. Prediction Walkthrough — Dependent Fields
1. Initial: `{ country: "US", state: "CA" }`
2. Action: `{ type: "COUNTRY_CHANGED", country: "IN" }`
3. Invariant transition: `{ country: "IN", state: null }` (invalid CA state reset).

---

## 47. Prediction Walkthrough — Submission Failure
1. Initial: `{ values: { email: "user@example.com" }, status: "submitting", error: null }`
2. Action: `{ type: "SUBMIT_FAILED", error: "Network unavailable" }`
3. Expected: `{ values: { email: "user@example.com" }, status: "error", error: "Network unavailable" }`
4. Form values remain intact.

---

# Layer 3 — 🧪 Diagnostic Labs & DevTools Profiling

## 48. Lab — Log Form State Dimensions
Do not simply `console.log(form)`. Log dimensions clearly:
```javascript
console.table({ email, touchedEmail, emailError, status, dirty });
```

---

## 49. Lab — Trace Form Actions
For reducer-driven forms:
```javascript
function reducer(state, action) {
  const next = transition(state, action);
  console.table({
    action: action.type,
    previousStatus: state.status,
    nextStatus: next.status,
    email: next.values.email
  });
  return next;
}
```

---

## 50. Lab — React DevTools
Use React DevTools to inspect:
- [ ] Form component state
- [ ] Input props
- [ ] Submission status
- [ ] Validation-related state
- [ ] Parent/child ownership
- [ ] Components rendering after typing
- [ ] Components rendering after submit

---

## 51. Lab — Identify Excess State
For every form variable ask:
- Can this be calculated?
- Is it authoritative?
- Does it represent interaction metadata?
- Does it represent an external outcome?
- Can it become stale?

If it can always be calculated from existing values, **derive it**.

---

## 52. Lab — Test Invariants
```javascript
function assertFormState(state) {
  if (state.status === "success" && state.error !== null) {
    throw new Error("Successful submission cannot contain a submission error");
  }
  if (state.country !== "US" && state.state === "CA") {
    throw new Error("State does not belong to selected country");
  }
}
```

---

## 53. Lab — Submission Race Investigation
```javascript
console.table({
  requestId,
  submittedEmail,
  currentEmail,
  startedAt: performance.now()
});

// When response returns:
console.table({
  requestId,
  currentRequestId,
  responseEmail
});
```

---

## 54. Lab — Form Render Cost
When typing into a field:
1. Open React DevTools Profiler.
2. Start recording.
3. Type several characters.
4. Stop recording.
5. Inspect which descendants rendered and determine if memoization or state isolation is needed.

---

# Layer 4 — 🔥 The Crucible

## 55. Challenge — Model a Registration Form
- **Requirements:** `email`, `password`, `confirmPassword`, `termsAccepted`
- **Interactions:** field changes, submit request, success, failure
- **Design:** Separate values, metadata, validation, and submission lifecycle.

---

## 56. Challenge — Determine State vs Derived Data
- `email` $\rightarrow$ **State**
- `password` $\rightarrow$ **State**
- `emailError` $\rightarrow$ **Derived**
- `isValid` $\rightarrow$ **Derived**
- `touchedEmail` $\rightarrow$ **State** (metadata)
- `submitStatus` $\rightarrow$ **State**
- `canSubmit` $\rightarrow$ **Derived** (`isValid && submitStatus !== "submitting"`)

---

## 57. Challenge — Dependent Field
- Initial: `{ country: "US", state: "CA" }`
- Action: `{ type: "COUNTRY_CHANGED", country: "IN" }`
- Result: Reset `state` to `null` to preserve country-state consistency.

---

## 58. Challenge — Submit Then Edit
- User submits `a@example.com`.
- User edits field to `b@example.com`.
- Request for `a@example.com` returns success.
- Current form state is still `b@example.com`; do not overwrite the user's active draft.

---

## 59. Challenge — Server Error After Client Validation
- Client: format valid.
- Server: email already exists.
- The UI accepts server domain rejection without conflicting with local format rules.

---

## 60. Challenge — Form Reset
When submission fails, preserve user input. Never reset user data unless explicitly requested by the user.

---

## 61. Challenge — Dynamic Addresses
State:
```javascript
[
  { id: "a", city: "Hyderabad" },
  { id: "b", city: "Pune" },
  { id: "c", city: "Delhi" }
]
```
Remove `b`. Remaining: `[a, c]`. React keys must use `key={address.id}` to preserve DOM focus and instance continuity.

---

## 62. Production Incident — "Error Message Is Stale"
- **Symptom:** User edits field, but old validation error stays visible.
- **Root Cause:** Error was stored in separate state and not synchronized.
- **Fix:** Derive validation synchronously during render.

---

## 63. Production Incident — "Submit Button Never Enables"
- **Root Cause:** Redundant `canSubmit` state drifted out of sync.
- **Fix:** Derive `canSubmit` directly from `isValid && status !== "submitting"`.

---

## 64. Production Incident — "Changing Country Leaves Invalid State"
- **Root Cause:** Handler updated `country` but forgot to clear `state`.
- **Fix:** Centralize transition logic so `COUNTRY_CHANGED` resets dependent `state`.

---

## 65. Production Incident — "User Lost Entire Form After Network Error"
- **Root Cause:** Error recovery called `setForm(initialState)`.
- **Fix:** Separate values from submission lifecycle; preserve input fields on failure.

---

## 66. Production Incident — "Old Submission Overwrites New Form"
- **Root Cause:** Out-of-order responses mutating current state.
- **Fix:** Associate responses with request IDs and discard stale responses.

---

## 67. Senior Decision Matrix

| Problem | Preferred Thinking |
| :--- | :--- |
| **Current input value** | Controlled state when UI needs React ownership |
| **Value only needed at submit** | Uncontrolled (`FormData` / `useRef`) can be reasonable |
| **Synchronous derived validation** | Derive during render |
| **User interaction metadata** | Explicit state (`touched`, `blurred`) |
| **Submission lifecycle** | Explicit status (`idle`, `submitting`, `success`, `error`) |
| **Cross-field dependency** | Coordinated transition in reducer |
| **Server validation** | External authoritative result mapped to form/field |
| **Dynamic fields** | Stable entity identity (`id` key) |
| **Deep form tree** | Scoped FormContext |
| **Multiple tightly related transitions** | Reducer |
| **Simple two-field form** | Local `useState` |
| **Form failure** | Preserve user data by default |
| **Overlapping submissions** | Request identity / currentness token |
| **Pure computation** | Do not route through `useEffect` |

---

## 68. The Complete Production Form Model

```text
               ┌──────────────┐
               │     USER     │
               └──────┬───────┘
                      │ click / type / blur
                      ▼
               ┌────────────────┐
               │  React Event   │
               └──────┬─────────┘
                      │
                      ▼
               ┌────────────────┐
               │ Event Adapter  │
               └──────┬─────────┘
                      │
                      ▼
               ┌────────────────┐
               │ Semantic Action│
               └──────┬─────────┘
                      │
                      ▼
       ┌────────────────────────────────┐
       │           FORM STATE           │
       │                                │
       │  values                        │
       │  interaction metadata          │
       │  validation                    │
       │  submission lifecycle          │
       │  request identity              │
       └──────────────┬─────────────────┘
                      │
                      ▼
                 React Render
                      │
                      ▼
                    Commit
                      │
                      ▼
                      UI
                      │
                      ▼ submit / external
                 Network / API
                      │
              ┌───────┴────────┐
              ▼                ▼
           success          failure
              │                │
              └───────┬────────┘
                      ▼
                  New Action
                      │
                      └──────────►
```

---

## 69. The Senior Form Architecture Rules

> **Rule 1:** Values are not validation results.  
> **Rule 2:** Touched is not valid.  
> **Rule 3:** Touched is not dirty.  
> **Rule 4:** Submit requested is not submit succeeded.  
> **Rule 5:** Client validation is not server authority.  
> **Rule 6:** Current form state is not necessarily the payload of an already-running request.  
> **Rule 7:** A failed request should not automatically destroy valid user work.  
> **Rule 8:** Dependent fields must transition together when invariants require it.  
> **Rule 9:** Derived values should not become redundant state without a reason.  
> **Rule 10:** Stable entity identity matters for dynamic form fields.

---

## 70. 40-Point Completion Checklist

### Form Fundamentals
- [ ] I understand controlled form ownership.
- [ ] I understand uncontrolled form ownership.
- [ ] I can choose between them intentionally.
- [ ] I can distinguish form values from form metadata.
- [ ] I understand field-level state.
- [ ] I understand form-level state.
- [ ] I understand submission lifecycle state.

### Validation
- [ ] I can distinguish field validation from form validation.
- [ ] I understand cross-field validation.
- [ ] I understand client vs server validation.
- [ ] I know when validation can be derived.
- [ ] I understand touched semantics.
- [ ] I understand dirty semantics.
- [ ] I know that touched and dirty are different.
- [ ] I can choose validation timing intentionally.

### Events
- [ ] I can convert form DOM events into semantic actions.
- [ ] I understand that submit is an intent.
- [ ] I can design semantic field-change actions.
- [ ] I can design dependent-field transitions.
- [ ] I can design reset semantics.
- [ ] I can avoid passing unnecessary DOM events into domain logic.

### Async Submission
- [ ] I understand submission snapshots.
- [ ] I understand that current form state can change while a request is running.
- [ ] I can model submitting/success/error explicitly.
- [ ] I understand stale submission results.
- [ ] I understand request identity.
- [ ] I can preserve form values across failures.
- [ ] I understand retry transitions.
- [ ] I understand why disabled buttons do not establish server correctness.

### Architecture
- [ ] I can identify redundant state.
- [ ] I can identify derived validation.
- [ ] I can identify state invariants.
- [ ] I can identify cross-field dependencies.
- [ ] I can determine appropriate state ownership.
- [ ] I know when to lift form state.
- [ ] I know when scoped context is useful.
- [ ] I know when a reducer is justified.
- [ ] I avoid creating one giant reducer unnecessarily.
- [ ] I can preserve stable identity for dynamic fields.

---

## 71. Final Graduation Model

```text
                  USER INTENT
                       │
                       ▼
               DOM / React Event
                       │
                       ▼
              Semantic Interaction
                       │
                       ▼
            ┌─────────────────────┐
            │     Form Model      │
            │                     │
            │  Values             │
            │  Metadata           │
            │  Validation         │
            │  Submission Status  │
            │  Request Identity   │
            └──────────┬──────────┘
                       │
                       ▼
             Valid State Transition
                       │
                       ▼
                  React Render
                       │
                       ▼
                    Commit
                       │
                       ▼
                      UI
                       │
                       ▼
               External Operation
                       │
                ┌──────┴──────┐
                ▼             ▼
             Success       Failure
                │             │
                └──────┬──────┘
                       ▼
                   New Action
                       │
                       └──────────►
```

---

# Part 12 Graduation Test

Without referring back to this document, design the architecture for:
> **A registration form with email, password, confirm password, terms acceptance, client validation, server validation, retry, and protection against duplicate submission.**

You should be able to specify:
1. Who owns each value?
2. Which values are derived?
3. Which interaction metadata is real state?
4. What are the valid submission states?
5. What actions exist?
6. Which actions are valid in each state?
7. What happens when password changes?
8. What happens when confirmPassword becomes invalid?
9. What happens when submit is requested?
10. What payload snapshot is sent?
11. What happens if the user edits the form during submission?
12. What happens if the server rejects the email?
13. What happens if the network fails?
14. What happens on retry?
15. What prevents stale submission results?
16. What state must survive an error?
17. What state should reset after success?
18. Which child components receive values?
19. Which callbacks should they expose?
20. Where does the actual side effect occur?

If you can answer all 20 without collapsing the form into a collection of unrelated booleans, you have reached **senior-level form interaction architecture**.
