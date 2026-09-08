# Level 06 — React Fundamentals
## KPI 05 — Events & User Interaction
### PART 05 — Forms & Input Interaction Fundamentals

[⬅️ Previous Part](04-event-arguments-and-handler-contracts.md) | [📚 Level 06 Index](README.md) | [🧪 Companion Lab](examples/05-forms-and-input-interaction.html) | [Next Part ➡️](06-keyboard-interaction-and-accessibility.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

## Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

### 1. The Core Problem
A form is not merely a collection of inputs.
A React form is an interaction system where user actions produce events, events are translated into application state, and state determines what the UI displays.

The fundamental pipeline is:

```
                  USER INTERACTION
                         │
                         ▼
               ┌──────────────────┐
               │ Browser Control  │
               │ input/select/etc │
               └────────┬─────────┘
                        │
                        │ event
                        ▼
               ┌──────────────────┐
               │  React Handler   │
               │    onChange      │
               │    onSubmit      │
               └────────┬─────────┘
                        │
                        │ extract data
                        ▼
               ┌──────────────────┐
               │   State Update   │
               │ setFormState(...)│
               └────────┬─────────┘
                        │
                        ▼
               ┌──────────────────┐
               │   React Render   │
               │  state snapshot  │
               └────────┬─────────┘
                        │
                        ▼
               ┌──────────────────┐
               │  Controlled UI   │
               │  value/checked   │
               └──────────────────┘
```

The senior-level mental model is:
> **The DOM reports interaction. React handlers translate interaction into state. State becomes the source of truth for the rendered control.**

---

### 2. Controlled Input in One Sentence
A controlled input is an input whose displayed value is determined by React state.

```tsx
const [name, setName] = useState("");

<input
  value={name}
  onChange={(event) => {
    setName(event.target.value);
  }}
/>
```

The important relationship is:

```
React State
    │
    │ value
    ▼
 <input>
    │
    │ user types
    ▼
 onChange
    │
    │ event.target.value
    ▼
 setState
    │
    ▼
React State
```

This creates a continuous feedback loop.

---

### 3. The Most Important Distinction
Do not confuse **`value`** with **`defaultValue`**. They represent fundamentally different ownership models.

- **`value`**:
  ```tsx
  <input value={name} />
  ```
  *Means:* React is actively controlling the current value.
- **`defaultValue`**:
  ```tsx
  <input defaultValue="Srikar" />
  ```
  *Means:* Initialize the control with this value, but do not continuously control it through this prop.

Similarly:
- **`checked`** is the controlled equivalent for checkbox/radio state.
- While **`defaultChecked`** is the initialization-oriented equivalent.

---

### 4. Executive Concept Table

| Concept | Core Mechanism | Production Impact | Common Senior Trap |
| :--- | :--- | :--- | :--- |
| **Controlled input** | React state determines current value | Predictable UI state | Updating state but forgetting `value` |
| **`onChange`** | Interaction handler receives input event | Converts user input into application state | Treating it like DOM-only change semantics |
| **`value`** | Current controlled value | Establishes React ownership | Expecting it to initialize only |
| **`defaultValue`** | Initial value | Useful for uncontrolled controls | Expecting later prop changes to synchronize |
| **`checked`** | Current boolean state | Controls checkbox/radio | Using `value` to model checkbox state |
| **`defaultChecked`** | Initial checked state | Initializes uncontrolled control | Expecting it to remain synchronized |
| **`onSubmit`** | Form submission handler | Centralizes submit behavior | Putting submit logic only on the button |
| **`preventDefault()`** | Prevents browser default submission navigation | Keeps SPA interaction inside React | Confusing it with `stopPropagation()` |
| **`name`** | Identifies a form field | Enables scalable field handling and native form semantics | Treating it as merely visual metadata |
| **`event.target.value`** | Reads current control value | Bridges DOM interaction to state | Storing the event instead of extracted data |
| **`event.target.checked`** | Reads checkbox/radio state | Correct boolean state representation | Reading `.value` for checked state |
| **Form state** | Application representation of user input | Enables validation/submission logic | Creating fragmented or duplicated state |
| **Reset** | Returns form to defined initial state | Prevents stale input | Assuming DOM reset automatically resets React state |
| **`disabled`** | Removes interaction capability | Enforces UI interaction constraints | Using it as a validation substitute |
| **`readOnly`** | Prevents editing while retaining readable value | Useful for immutable displayed fields | Treating it as equivalent to `disabled` |

---

### 5. Golden Rule
> **For a controlled form control, React state is the authority, and the DOM is the interaction surface.**

If you cannot explain:
1. Where does the current value live?
2. Who owns it?
3. How does user interaction change it?
4. How does the new value get rendered?
5. What happens when the form submits?

...then you do not yet understand the form.

---

## Layer 2 — 🔬 Deep Mechanical Breakdown

### 6. What React Forms Actually Solve
Consider a simple form:
```html
<form>
  <input />
  <button>Submit</button>
</form>
```

The browser already knows how forms work. Why does React need form handling?

Because an application usually needs to transform raw interaction into application state and application behavior:

```
User enters: "srikar@example.com"
            │
            ▼
React receives interaction
            │
            ▼
email state becomes: "srikar@example.com"
            │
            ▼
rendered UI reflects state
            │
            ▼
submit action consumes: email
```

React gives you an explicit programming model for this interaction.

---

### 7. Form Controls Are Stateful Systems
An input has state even before React enters the picture:

```
<input> Internal control state
   │
   ├── current value
   ├── checked state
   ├── selection/cursor state
   ├── focus state
   └── browser interaction state
```

React can either:
1. Allow the browser/control to own the current value (uncontrolled interaction), or
2. Make React state authoritative (controlled interaction).

KPI 04 established ownership as the central distinction. Here we focus on how that ownership mechanically operates during interaction.

---

### 8. Controlled Text Input
The canonical pattern:
```tsx
function NameField() {
  const [name, setName] = useState("");

  return (
    <input
      value={name}
      onChange={(event) => {
        setName(event.target.value);
      }}
    />
  );
}
```

There are three important pieces:
1. **State:** `const [name, setName] = useState("");`
2. **Current rendered value:** `value={name}`
3. **Interaction-to-state transition:** `onChange={(event) => { setName(event.target.value); }}`

Together:
```
name state
    │
    ▼
value={name}
    │
    ▼
input displays value
    │
    │ user types
    ▼
onChange(event)
    │
    ▼
event.target.value
    │
    ▼
setName(...)
    │
    ▼
new state
    │
    ▼
next render
    │
    ▼
new value
```

---

### 9. Render #1 — Initial Form
Consider:
```tsx
function ProfileForm() {
  const [name, setName] = useState("");

  return (
    <input
      value={name}
      onChange={(event) => {
        setName(event.target.value);
      }}
    />
  );
}
```

Initial state: `name = ""`  
React creates the element description: `<input value="" onChange={handler}>`

Conceptually:
```
Fiber
  └── ProfileForm
        └── input
              ├── value = ""
              └── onChange = handler
```

Committed UI:
```
┌────────────────────────┐
│                        │
└────────────────────────┘
```
The input is empty.

---

### 10. User Types 'S'
The user presses a key. The interaction occurs against the input control. React's event handler receives the interaction:

```
DOM input interaction
         │
         ▼
  onChange(event)
         │
         ▼
 event.target.value
         │
         ▼
        "S"
         │
         ▼
    setName("S")
```

The state update is queued. React subsequently renders using the updated state.

---

### 11. Render #2
State: `name = "S"`  
React evaluates: `<input value="S" onChange={handler} />`

The committed control now reflects:
```
┌────────────────────────┐
│ S                      │
└────────────────────────┘
```

The critical point:
> **The user interaction did not directly become permanent application state merely because the browser displayed a character.**

The React-controlled model is:
$$\text{interaction} \longrightarrow \text{event} \longrightarrow \text{state update} \longrightarrow \text{render} \longrightarrow \text{controlled value}$$

---

### 12. Render #3 — User Types 'r'
Suppose the current state is `name = "S"`. User types `r`.  
Handler receives an event whose target reflects the current control value:
```javascript
event.target.value === "Sr"
```

Then:
```javascript
setName("Sr");
```

Next render: `name = "Sr"`  
React renders: `<input value="Sr" />`  
Committed UI:
```
┌────────────────────────┐
│ Sr                     │
└────────────────────────┘
```
The loop continues for each interaction.

---

### 13. Why `value` Is More Than Display
Consider:
```tsx
<input value={name} />
```

It is tempting to interpret this as *"Show the name."* That is incomplete. It means:
> *"The current rendered value of this input is governed by the `name` state."*

Therefore:
```tsx
<input value={name} onChange={...} />
```
creates an ownership relationship:

```
     OWNER
       │
       ▼
  React state
       │
       ▼
  input value
```

If some other mechanism changes the input's internal value without updating the controlling state, the next React-controlled update will reassert the state-derived value.

---

### 14. The Broken Controlled Input
Consider:
```tsx
function NameField() {
  const [name, setName] = useState("");

  return <input value={name} />;
}
```

There is no `onChange`. The input is controlled by `value={name}`, but there is no state transition path from interaction back into `name`:

```
state ──► value ──► input
                      │
                      │ user interaction
                      ▼
                     ????
```

The control has no application-level mechanism to accept the user's edit. This is one of the classic controlled-input mistakes (the "frozen input").

---

### 15. Correct Controlled Loop
The complete loop is:

```
┌─────────────────┐
│   React State   │
│    name="Sr"    │
└────────┬────────┘
         │
         │ render
         ▼
┌─────────────────┐
│     <input>     │
│   value="Sr"    │
└────────┬────────┘
         │
         │ user types
         ▼
┌─────────────────┐
│    onChange     │
└────────┬────────┘
         │
         │ extract
         ▼
┌─────────────────┐
│  event.target.  │
│      value      │
└────────┬────────┘
         │
         ▼
    setName(...)
         │
         └──────────► State
```

---

### 16. `onChange` and Text Inputs
A common React pattern is:
```tsx
<input
  value={email}
  onChange={(event) => {
    setEmail(event.target.value);
  }}
/>
```

The important operation is: `event.target.value`.  
The event object is interaction metadata. The application state should contain the domain-relevant value, not the event object itself.

- **Prefer:** `setEmail(event.target.value);`
- **Not:** `setEmail(event);`

The latter couples application state to the event representation.

---

### 17. Event Extraction Boundary
A clean architecture establishes an explicit boundary:

```
React Event
    │
    ▼
Interaction Adapter
    │
    │ extract value
    ▼
Domain / Application Data
    │
    ▼
State
```

For example:
```tsx
onChange={(event) => {
  setEmail(event.target.value);
}}
```
The event does not need to escape this boundary.

---

### 18. Textarea
A React `<textarea>` follows the identical controlled model:
```tsx
const [message, setMessage] = useState("");

<textarea
  value={message}
  onChange={(event) => {
    setMessage(event.target.value);
  }}
/>
```

The conceptual pipeline is identical:
$$\text{message state} \longrightarrow \text{textarea value} \longrightarrow \text{user edits} \longrightarrow \text{onChange} \longrightarrow \text{event.target.value} \longrightarrow \text{setMessage} \longrightarrow \text{new state}$$

Do not treat `<textarea>` as a completely different state architecture.

---

### 19. Select
Controlled select:
```tsx
const [country, setCountry] = useState("");

<select
  value={country}
  onChange={(event) => {
    setCountry(event.target.value);
  }}
>
  <option value="">Select country</option>
  <option value="in">India</option>
  <option value="us">United States</option>
</select>
```

The selected option is derived from `value={country}`. Interaction produces `event.target.value` which updates `country`.

---

### 20. Checkbox: The Critical Difference
Checkboxes are where developers frequently apply the wrong mental model. A checkbox has a **boolean checked state**.

Therefore:
```tsx
<input
  type="checkbox"
  checked={enabled}
  onChange={(event) => {
    setEnabled(event.target.checked);
  }}
/>
```

Notice:
- `checked={enabled}`
- and `event.target.checked`
- **NOT** `value={enabled}`

---

### 21. `value` vs `checked`
- **For a text input:** `value={name}` $\longrightarrow$ `event.target.value`
- **For a checkbox:** `checked={enabled}` $\longrightarrow$ `event.target.checked`

```
Text     └── string state  ──► value
Checkbox └── boolean state ──► checked
```

---

### 22. Radio Buttons
Radio buttons represent one selection among a group:
```tsx
const [plan, setPlan] = useState("pro");

<input
  type="radio"
  name="plan"
  value="basic"
  checked={plan === "basic"}
  onChange={(event) => {
    setPlan(event.target.value);
  }}
/>
<input
  type="radio"
  name="plan"
  value="pro"
  checked={plan === "pro"}
  onChange={(event) => {
    setPlan(event.target.value);
  }}
/>
```

Here, `plan = "pro"` determines:
- `basic` $\rightarrow$ `checked={false}`
- `pro` $\rightarrow$ `checked={true}`

The application state represents the selected domain value. It does not need to store `basicChecked` and `proChecked` separately.

---

### 23. Avoid Duplicate Form State
#### Bad
```tsx
const [plan, setPlan] = useState("pro");
const [basicChecked, setBasicChecked] = useState(false);
const [proChecked, setProChecked] = useState(true);
```
This creates multiple sources of truth. You now have to preserve an invariant:
```
plan === "basic" ↔ basicChecked === true
plan === "pro" ↔ proChecked === true
```

#### Prefer
```tsx
const [plan, setPlan] = useState("pro");
```
and derive: `checked={plan === "pro"}`.

> **Store the minimum authoritative state; derive what can be derived.**

---

### 24. Multiple Inputs
Suppose:
```typescript
const [form, setForm] = useState({
  firstName: "",
  lastName: "",
  email: "",
});
```

You can use `name` to identify fields:
```tsx
<input name="firstName" value={form.firstName} onChange={handleChange} />
<input name="lastName" value={form.lastName} onChange={handleChange} />
<input name="email" value={form.email} onChange={handleChange} />
```

Then:
```typescript
function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
  const { name, value } = event.target;
  setForm((previous) => ({
    ...previous,
    [name]: value,
  }));
}
```
This creates a generic interaction adapter.

---

### 25. Mechanical Breakdown of the Generic Handler
Suppose the user edits `email`:
- `event.target.name = "email"`
- `event.target.value = "srikar@example.com"`

Destructuring:
```javascript
const { name, value } = event.target;
```
produces `name = "email"`, `value = "srikar@example.com"`.

Then:
```javascript
setForm((previous) => ({
  ...previous,
  [name]: value,
}));
```
Conceptually:
```javascript
previous: { firstName: "Srikar", lastName: "Kudurmalla", email: "" }
```
becomes:
```javascript
{ firstName: "Srikar", lastName: "Kudurmalla", email: "srikar@example.com" }
```

The computed property `[name]: value` evaluates to `["email"]: "srikar@example.com"`.

---

### 26. Why the Functional Update Matters
```tsx
setForm((previous) => ({
  ...previous,
  [name]: value,
}));
```
expresses: *Compute the next form state from the previous state.*

This is preferable when the next state depends on the previous object. The functional updater makes the dependency explicit:
$$\text{previous state} \longrightarrow \text{transformation} \longrightarrow \text{next state}$$

---

### 27. Form Submission
Basic React form:
```tsx
function LoginForm() {
  function handleSubmit(event) {
    event.preventDefault();
    // submit application data
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" />
      <input name="password" type="password" />
      <button type="submit">
        Sign in
      </button>
    </form>
  );
}
```

The important distinction is:
$$\text{onClick on submit button} \quad \text{vs} \quad \text{onSubmit on form}$$

The form itself owns the submission interaction.

---

### 28. Why `onSubmit` Belongs on `<form>`
`<form onSubmit={handleSubmit}>` captures the form-level submission contract. Submission can be initiated through multiple mechanisms (clicking a submit button, pressing <kbd>Enter</kbd> in a text field, assistive tech commands).

The form is the semantic owner of **submit**, not merely the button.

---

### 29. `preventDefault()` During Submit
Browsers have native form submission behavior that triggers full-page navigation. In a Single-Page React application:

```javascript
function handleSubmit(event) {
  event.preventDefault();
  // application submission logic
}
```

- **`preventDefault()`**: Prevents the browser's default submission navigation.
- **`stopPropagation()`**: Prevents event bubbling to ancestor handlers.

*They solve completely different problems.*

---

### 30. Submission Pipeline
A complete submission flow:

```
User submits form
        │
        ▼
<form onSubmit={handleSubmit}>
        │
        ▼
   submit event
        │
        ▼
event.preventDefault()
        │
        ▼
read/validate application state
        │
        ▼
application action
        │
        ▼
 state transition
        │
        ▼
render updated UI
```

---

### 31. Do Not Confuse Input State With Submission State
A form has **field state** and **submission state**:

```typescript
const [form, setForm] = useState({
  email: "",
  password: "",
});
const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
```

- **Fields:** What the user entered.
- **Status:** What the application is currently doing with that data.

Do not collapse unrelated concepts into one giant tangled object.

---

### 32. Form State Modeling
Keep the conceptual boundaries clear:

```
FORM DATA
  ├── firstName
  ├── lastName
  ├── email
  └── plan

SUBMISSION
  ├── idle
  ├── submitting
  ├── success
  └── error
```

This is far cleaner than disjoint booleans (`loading: true, submitted: false, success: false`) where invalid states can be accidentally represented.

---

### 33. `defaultValue` vs `value`
- `<input defaultValue="Srikar" />`: The browser begins with `"Srikar"`, but React does not continuously control the value.
- `<input value={name} />`: React actively controls the current value on every single render.

$$\text{defaultValue} = \text{initial configuration} \qquad \text{value} = \text{current controlled state}$$

---

### 34. `defaultChecked` vs `checked`
- `<input type="checkbox" defaultChecked />`: Initializes the checkbox as checked (uncontrolled).
- `<input type="checkbox" checked={enabled} />`: Current checked state is bound to `enabled`.

---

### 35. The Initialization Trap
Consider:
```tsx
function UserForm({ user }) {
  return <input defaultValue={user.name} />;
}
```

A developer may assume: `user.name changes` $\longrightarrow$ `input updates`.  
That is **not** what `defaultValue` means. It establishes initial/default behavior on mount. If your architecture requires ongoing synchronization, use controlled state (`value={name}` + `onChange`).

---

### 36. Controlled Reset
```tsx
const [name, setName] = useState("");

<input
  value={name}
  onChange={(event) => setName(event.target.value)}
/>
```

To reset:
```javascript
setName("");
```

The reset pipeline is:
$$\text{setName("")} \longrightarrow \text{state becomes ""} \longrightarrow \text{render} \longrightarrow \text{value=""} \longrightarrow \text{input becomes empty}$$

React state is the authority.

---

### 37. Resetting Multiple Fields
```typescript
const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
};

function handleReset() {
  setForm(initialForm);
}
```

---

### 38. Native Form Reset vs React State
A native reset button (`<button type="reset">`) resets the DOM controls, but does not reset React state. In a controlled form, the next render will reassert React state over the DOM.

Therefore, define reset as an explicit application state transition: `setForm(initialForm)`.

---

### 39. `disabled` vs `readOnly`
- **`disabled`** (`<input disabled />`): The control is not interactive and omitted from form data.
- **`readOnly`** (`<input readOnly />`): The value cannot be edited, but the control remains focusable and readable.

---

### 40. Accessibility Is Part of Form Architecture
A form is not correct merely because state updates:
```tsx
<label htmlFor="email">Email</label>
<input id="email" name="email" type="email" />
```
The relationship: `label[htmlFor] ──► input#id`.

Do not rely solely on `placeholder="Email"` as an accessible name. A placeholder is instructional hint text, not a substitute for proper labeling.

---

### 41. Form Field Identity
A form field has several distinct identities:
- **DOM identity:** `id="email"`
- **Form submission identity:** `name="email"`
- **Application state identity:** `form.email`
- **Accessibility association:** `label[htmlFor="email"]`

---

### 42. The `name` Attribute
```tsx
<input name="email" value={form.email} onChange={handleChange} />
```
`name` identifies the field in form semantics and enables generic handlers:
```javascript
const { name, value } = event.target;
setForm(prev => ({ ...prev, [name]: value }));
```

---

### 43. A Complete Controlled Form
```tsx
function ProfileForm() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    newsletter: false,
    plan: "free",
  });

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const target = event.target;
    const name = target.name;
    const value = target.type === "checkbox" 
      ? (target as HTMLInputElement).checked 
      : target.value;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    console.log(form);
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="firstName">First name</label>
      <input
        id="firstName"
        name="firstName"
        value={form.firstName}
        onChange={handleChange}
      />

      <label htmlFor="lastName">Last name</label>
      <input
        id="lastName"
        name="lastName"
        value={form.lastName}
        onChange={handleChange}
      />

      <label htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
      />

      <label>
        <input
          type="checkbox"
          name="newsletter"
          checked={form.newsletter}
          onChange={handleChange}
        />
        Subscribe to newsletter
      </label>

      <label htmlFor="plan">Plan</label>
      <select
        id="plan"
        name="plan"
        value={form.plan}
        onChange={handleChange}
      >
        <option value="free">Free</option>
        <option value="pro">Pro</option>
      </select>

      <button type="submit">Save</button>
    </form>
  );
}
```

---

### 44. Prediction Walkthrough: Full Form
1. **Initial State:** `form = { name: "", newsletter: false }`. Render #1 commits empty string and `checked=false`.
2. **User types "Alice":** `onChange` receives `target.name="name"`, `target.value="Alice"`. State updates. Render #2 commits `value="Alice"`.
3. **User checks newsletter:** `onChange` receives `target.name="newsletter"`, `target.checked=true`. State updates. Render #3 commits `checked=true`.

---

### 45. Production Anti-Pattern #1 — Controlled Without Update
- **Flawed:** `<input value={email} />`
- **Mechanical failure:** User interaction cannot update state; input appears frozen.
- **Refactor:** `<input value={email} onChange={(e) => setEmail(e.target.value)} />`.

---

### 46. Production Anti-Pattern #2 — Checkbox Using `value`
- **Flawed:** `<input type="checkbox" value={enabled} onChange={(e) => setEnabled(e.target.value)} />`
- **Mechanical failure:** Checkbox interaction is governed by `checked`, not `value`.
- **Refactor:** `<input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />`.

---

### 47. Production Anti-Pattern #3 — `defaultValue` Used as Synchronization
- **Flawed:** `<input defaultValue={user.name} />` expecting it to re-sync when `user.name` prop changes.
- **Mechanical failure:** `defaultValue` only initializes initial state.
- **Refactor:** Use controlled state (`value={name}` + `onChange`).

---

### 48. Production Anti-Pattern #4 — Submission on Button Click Only
- **Flawed:** `<form><button onClick={handleSubmit}>Save</button></form>`
- **Mechanical failure:** Bypasses form-level submit semantics (e.g., keyboard <kbd>Enter</kbd> submit).
- **Refactor:** `<form onSubmit={handleSubmit}><button type="submit">Save</button></form>`.

---

### 49. Production Anti-Pattern #5 — Forgetting `preventDefault`
- **Flawed:** `function handleSubmit(e) { submitForm(); }`
- **Mechanical failure:** Browser submits natively, causing full page reload and lost state.
- **Refactor:** Always call `event.preventDefault()`.

---

### 50. Production Anti-Pattern #6 — Storing the Event
- **Flawed:** `const [lastEvent, setLastEvent] = useState(null);`
- **Mechanical failure:** Couples application domain state to transient browser event objects.
- **Refactor:** Extract `event.target.value` immediately at the adapter boundary.

---

### 51. Production Anti-Pattern #7 — Duplicating Derived Selection State
- **Flawed:** Storing both `plan: "pro"` and `isPro: true` in state.
- **Refactor:** Store only `plan: "pro"`, and compute `const isPro = plan === "pro";`.

---

### 52. Production Anti-Pattern #8 — Giant Generic Handler Without Semantics
Do not let generic `handleChange` become a 200-line dumping ground for formatting, validation, network calls, and analytics. Keep `handleChange` focused on interaction-to-state adaptation.

---

### 53. Event-to-State Adapter
```typescript
function handleEmailChange(event: React.ChangeEvent<HTMLInputElement>) {
  setForm((previous) => ({
    ...previous,
    email: event.target.value,
  }));
}
```
DOM details terminate at the boundary; domain logic operates cleanly on `form.email`.

---

### 54. What Belongs in Form State?
- **Form state:** `email`, `password`, `plan`, `newsletterOptIn`.
- **Submission state:** `isSubmitting`, `status`, `serverError`.
- **Derived values (do not store):** `isEmailValid`, `isProPlan`, `fullName`.

---

### 55. Form Validation: Fundamental Boundary
Distinguish input handling from validation. The foundational model:
$$\text{input} \longrightarrow \text{state} \longrightarrow \text{validation reads state} \longrightarrow \text{submission decides whether to proceed}$$

---

### 56. Don't Validate by Mutating the Input
Never manipulate the DOM node directly. Derive feedback from state:
```tsx
const emailError = form.email.length === 0 ? "Email is required" : null;

return (
  <>
    <input value={form.email} onChange={handleChange} />
    {emailError && <p className="error">{emailError}</p>}
  </>
);
```

---

### 57. Input State and Render State
```typescript
function handleChange(event) {
  setEmail(event.target.value);
  console.log(email); // logs previous snapshot value, not next state!
}
```
Handlers are closures over render snapshots.

---

### 58. Prediction Challenge: Handler Closure
```tsx
function NameForm() {
  const [name, setName] = useState("");
  function handleChange(event) {
    setName(event.target.value);
    console.log("inside handler:", name);
  }
  return <input value={name} onChange={handleChange} />;
}
```
When user types `"S"`, the console logs `""` (the value from the render that created the handler).

---

### 59. Why This Matters in Real Forms
Calling `setEmail("")` followed by `submit(email)` sends the old `email` value because `setEmail` schedules a state update for the next render without mutating the local variable.

---

### 60. Form Submission and Current State
```tsx
function handleSubmit(event) {
  event.preventDefault();
  submitForm(form);
}
```
The handler captures the current render's committed `form` state.

---

### 61. Form State and Object Identity
Always produce a new object reference when updating state:
```javascript
setForm((previous) => ({
  ...previous,
  email: nextEmail,
}));
```

---

### 62. Dangerous Mutation
```javascript
// DANGEROUS:
form.email = nextEmail;
setForm(form);
```
Mutating state objects in place breaks React's identity checks and can lead to missed re-renders.

---

### 63. Forms and Component Boundaries
```
ProfileForm (owns state)
  ├── NameFields
  ├── ContactFields
  ├── Preferences
  └── SubmitActions
```
Lift state to the common ancestor that requires it.

---

### 64. Child Input Component
```tsx
function TextField({ id, name, label, value, onChange }) {
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} name={name} value={value} onChange={onChange} />
    </div>
  );
}
```

---

### 65. Don't Leak DOM Events Through Every Layer
- Low-level primitives (`<TextField>`) accept `onChange(event)`.
- High-level domain components (`<UserProfileEditor>`) expose semantic contracts (`onEmailChange(email: string)`).

---

### 66. Form Submission Contract Across Components
A modular form component encapsulates its DOM details and exposes domain objects:
```tsx
<ProfileForm initialValues={user} onSubmit={handleProfileSubmit} />
```

---

### 67. Native Form Semantics Still Matter
Always use semantic `<form>`, `<input>`, `<label>`, `<select>`, `<textarea>`, and `<button>` for built-in accessibility, browser password managers, and keyboard handling.

---

### 68. Submit Button Types
- Submit action: `<button type="submit">Save</button>`
- Secondary action: `<button type="button">Cancel</button>`

*Omitting `type="button"` defaults to `type="submit"` inside forms, causing unintended submissions.*

---

### 69. Form Interaction Architecture
```
PLATFORM
  │
  ├───────────────────────────────┐
  │ input                         │ submit
  ▼                               ▼
React event                     React event
  │                               │
  ▼                               ▼
interaction adapter             form handler
  │                               │
  ▼                               ▼
field state                     form action
  │                               │
  └───────────────┬───────────────┘
                  ▼
             React render
                  │
                  ▼
                  UI
```

---

## Layer 3 — 🧪 Diagnostic Labs & DevTools Profiling

### 70. Diagnostic Lab 1 — Inspect Controlled Input Rendering
```tsx
function DebugInput() {
  const [name, setName] = useState("");
  console.log("render", { name });

  return (
    <input
      value={name}
      onChange={(event) => {
        console.log("event", {
          value: event.target.value,
          target: event.target,
          currentTarget: event.currentTarget,
        });
        setName(event.target.value);
      }}
    />
  );
}
```

---

### 71. Diagnostic Lab 2 — Compare `target` and `currentTarget`
`event.target` is the origin node (e.g., `<input>`), while `event.currentTarget` is the element whose handler is currently executing.

---

### 72. Diagnostic Lab 3 — Inspect Render Snapshots
Compare `value` (current render value) with `event.target.value` (incoming DOM value) across rapid keystrokes to observe snapshot flow.

---

### 73. React DevTools Runbook
1. Open React DevTools $\rightarrow$ Profiler.
2. Start recording $\rightarrow$ Type in form field $\rightarrow$ Stop recording.
3. Inspect which components rendered and verify state ownership boundaries.

---

### 74. Chrome DevTools Runbook
- **Console:** `console.table({ field, value, checked });`
- **Elements:** Verify `id`, `name`, `type`, `checked`, `disabled`, `readOnly`, and `htmlFor` attributes.
- **Accessibility:** Inspect accessible name and role in DevTools Accessibility tree.

---

### 75. Diagnostic Lab 4 — Find the Broken Control Loop
If `<input value={email} />` has no `onChange` and `email` state never changes, the control loop is broken.

---

### 76. Diagnostic Lab 5 — Checkbox Semantics
Always verify that checkbox state maps to `event.target.checked` rather than `event.target.value`.

---

### 77. Diagnostic Lab 6 — Submission Trace
Log `event.defaultPrevented` before and after `event.preventDefault()` to confirm default navigation is halted.

---

### 78. Diagnostic Lab 7 — State Ownership
Profile the component tree to confirm that typing into a child field re-renders only components that depend on that state.

---

## Layer 4 — 🔥 The Crucible

### 79. Prediction Challenge #1 — Controlled Input
- Initial: `value=""`
- User types `'A'`: `onChange` extracts `"A"`, calls `setValue("A")`, queues state transition, next render commits `<input value="A" />`.

---

### 80. Prediction Challenge #2 — Snapshot Trap
`setEmail(event.target.value)` schedules an update; `console.log(email)` logs the current render's captured value (`""`).

---

### 81. Prediction Challenge #3 — Checkbox
Checking a checkbox produces `event.target.checked = true` (while `event.target.value` remains default `"on"`).

---

### 82. Prediction Challenge #4 — Generic Handler
`setForm(prev => ({ ...prev, [name]: value }))` computes a new object shallow-copying previous fields and replacing the `[name]` key.

---

### 83. Prediction Challenge #5 — `defaultValue`
Changing a parent prop from `"Srikar"` to `"Sunny"` does **not** automatically update an uncontrolled `<input defaultValue={name} />`.

---

### 84. Prediction Challenge #6 — Submit Semantics
`onSubmit` on `<form>` captures submission; `preventDefault()` halts browser navigation without mutating React state or halting bubbling.

---

### 85. Prediction Challenge #7 — Derived Checkbox State
Deriving `const isPro = plan === "pro";` eliminates state synchronization bugs compared to maintaining separate `plan` and `isPro` states.

---

### 86. Production Incident #1 — "The Input Is Frozen"
- **Root cause:** Controlled `value={email}` without `onChange` state transition.

---

### 87. Production Incident #2 — "Checkbox State Is Wrong"
- **Root cause:** Used `value={enabled}` instead of `checked={enabled}` and read `event.target.value`.

---

### 88. Production Incident #3 — "Reset Button Doesn't Really Reset"
- **Root cause:** Native reset cleared DOM without calling React state setter `setForm(initialForm)`.

---

### 89. Production Incident #4 — "Clicking Cancel Submits the Form"
- **Root cause:** `<button>Cancel</button>` lacked `type="button"`, defaulting to submit.

---

### 90. Production Incident #5 — "Submit Handler Receives Weird Data"
- **Root cause:** Leaked DOM event objects into backend service layers instead of extracted domain payload.

---

### 91. Engineering Decision Matrix

| Situation | Preferred Pattern |
| :--- | :--- |
| React needs current input value | Controlled `value` |
| React needs checkbox state | Controlled `checked` |
| Need initial uncontrolled value | `defaultValue` |
| Need initial uncontrolled checkbox state | `defaultChecked` |
| Form submission | `onSubmit` on `<form>` |
| Prevent native submit behavior | `preventDefault()` |
| Non-submit button in form | `type="button"` |
| Submit button | `type="submit"` |
| Multiple fields | Model coherent form state object |
| Generic field handler | Use `name` property |
| Checkbox generic handler | Branch on `type === "checkbox"` / `checked` |
| Derived form fact | Derive instead of duplicate state |
| Reset controlled form | Reset React state (`setForm(initialState)`) |
| Field accessibility | Explicit `label[htmlFor]` $\leftrightarrow$ `input[id]` |
| Domain component | Semantic callback contracts |
| Low-level input primitive | Standard `onChange` event contract |

---

### 92. Senior-Level Form Review Checklist
- [x] **Ownership:** Single authoritative React state owner for every controlled field.
- [x] **Controlled Inputs:** Text uses `value`; checkbox/radio uses `checked`.
- [x] **Events:** Extract `target.value` / `target.checked` at adapter boundary.
- [x] **Submission:** Form-level `onSubmit` with `event.preventDefault()`.
- [x] **Button Types:** Explicit `type="submit"` vs `type="button"`.
- [x] **Reset:** Application-level state reset function.
- [x] **Accessibility:** Explicit `label[htmlFor]` $\leftrightarrow$ `input#id` association.
- [x] **Immutability:** Functional state updates without object mutations.

---

### 93. Senior Interview Traps
1. **"Controlled means React mutates DOM directly on keypress."** $\implies$ No, interaction schedules state update, triggering render and reconciliation.
2. **"`defaultValue` is just `value`."** $\implies$ False, `defaultValue` is one-time uncontrolled initialization.
3. **"Read checkbox state from `target.value`."** $\implies$ False, read `target.checked`.
4. **"`preventDefault()` stops bubbling."** $\implies$ False, it halts default browser navigation; `stopPropagation()` halts bubbling.
5. **"Submit button owns submission."** $\implies$ False, the `<form>` owns submission semantics.
6. **"`setState` immediately mutates current scope variable."** $\implies$ False, state updates apply to the next render snapshot.

---

### 94. The Complete Mechanical Model
```
┌────────────────────┐
│    React State     │
│  email, name, etc  │
└─────────┬──────────┘
          │ render
          ▼
┌───────────────────────────────┐
│ <input value> <input checked> │
└─────────┬─────────────────────┘
          │ user input
          ▼
┌───────────────────────────────┐
│     onChange / onSubmit       │
└─────────┬─────────────────────┘
          │ extract value/checked
          ▼
┌───────────────────────────────┐
│         setFormState          │
└─────────┬─────────────────────┘
          │ next render
          ▼
     Controlled UI
```

---

### 95. The Senior Mental Model
```
INTERACTION
    │
    ▼
Browser Control
    │
    ▼
React Event
    │
    ▼
Interaction Adapter
    │
    ▼
Application Data
    │
    ▼
State Transition
    │
    ▼
Render Snapshot
    │
    ▼
Reconciliation & Commit
    │
    ▼
Controlled UI
```

---

### 96. Cross-KPI Connections
- **KPI 01 (React Mental Model):** State $\rightarrow$ Render $\rightarrow$ Commit cycle.
- **KPI 02 (JSX):** Form elements as virtual descriptors.
- **KPI 03 (Components & Props):** Composed form fields and callback boundaries.
- **KPI 04 (State):** Snapshots, immutability, and derived state.
- **Level 04 (Browser Internals):** DOM event dispatch and form submission mechanics.

---

### 97. Companion Lab Specification
Interactive sandbox implemented in [`examples/05-forms-and-input-interaction.html`](examples/05-forms-and-input-interaction.html):
- **Panel 1 — Form State:** Live state inspector (`name`, `email`, `newsletter`, `plan`).
- **Panel 2 — Event Inspector:** Real-time extraction of `type`, `target`, `name`, `value`, and `checked`.
- **Panel 3 — Render Timeline:** Step-by-step history of render snapshots.
- **Panel 4 — Ownership Flow:** Animated visualizer of the controlled feedback loop.
- **Panel 5 — Controlled vs Default:** Side-by-side comparison of `value` vs `defaultValue`.
- **Panel 6 — Submission Pipeline:** Multi-step trace of `submit` event, `preventDefault()`, and domain dispatch.

---

### 98. Completion Standard
You are ready when you can explain the complete lifecycle of text and boolean inputs, the difference between `value` and `defaultValue`, form submission contracts, and how to debug frozen inputs without memorization.

---

### 99. Final Crucible
$$\text{User types 'a'} \longrightarrow \text{React event} \longrightarrow \text{extract target.value} \longrightarrow \text{setState} \longrightarrow \text{new render snapshot} \longrightarrow \text{input receives value="a"}$$

$$\text{User submits} \longrightarrow \text{form onSubmit} \longrightarrow \text{preventDefault()} \longrightarrow \text{read state} \longrightarrow \text{domain action}$$

---

### 100. Final Rule
> **A React form is not fundamentally an input-handling problem. It is an ownership-and-state-transition problem expressed through form controls.**
