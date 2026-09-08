# Level 06 — React Fundamentals
## KPI 05 — Events & User Interaction
### PART 08 — Event Handler Patterns, Callback Contracts & Interaction Architecture

[⬅️ Previous Part](07-event-handler-identity-and-rendering.md) | [📚 Level 06 Index](README.md) | [🧪 Companion Lab](examples/08-event-handler-patterns-and-callback-contracts.html) | [Next Part ➡️](09-advanced-form-interaction.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

### Why This Part Exists
Knowing `<button onClick={handleClick}>` is beginner-level knowledge.

A senior frontend engineer must understand the architectural question behind it:
> **Who owns the interaction, who owns the resulting state transition, and what contract should exist between the component emitting the interaction and the component owning the behavior?**

That question becomes increasingly important as applications evolve from:
$$\text{Button} \longrightarrow \text{Toolbar} \longrightarrow \text{Editor} \longrightarrow \text{Page} \longrightarrow \text{Feature} \longrightarrow \text{Application state}$$

The event itself is only the beginning. This Part establishes the architecture for:
- Callback props
- Event-to-domain translation
- Callback contracts
- Handler factories
- Argument transformation
- Child-to-parent communication
- Component boundaries
- Event ownership
- Interaction orchestration
- Callback composition
- Preventing DOM-event leakage through component APIs
- Avoiding "god handlers"
- Designing reusable interaction components

Advanced concurrency and scheduler mechanics remain outside this Part.

---

## Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

### 1. The Core Interaction Pipeline
A production React interaction should be mentally modeled as:

```
            USER ACTION
                 │
                 ▼
         DOM / React Event
                 │
                 ▼
     Component Event Handler
                 │
                 ▼
       Interpret Interaction
                 │
                 ▼
Domain Callback / State Transition
                 │
                 ▼
           State Update
                 │
                 ▼
            React Render
                 │
                 ▼
            Committed UI
```

The critical architectural distinction:
$$\text{DOM event} \neq \text{domain event}$$

**For example:**
- DOM: `click`
- Component semantic interaction: `onDelete(itemId)`

A reusable component should often expose the second.

---

### 2. The Golden Rule
> **Translate low-level UI events into the smallest meaningful semantic callback contract at the component boundary.**

Prefer:
```tsx
<UserRow user={user} onDelete={handleDelete} />
```
over forcing the parent to understand:
```tsx
<UserRow
  onClick={(event) => {
    // understand button nesting, DOM structure, target extraction, propagation details
  }}
/>
```

The reusable component should own its internal DOM mechanics.

---

### 3. DOM Event vs Semantic Callback
Consider:
```tsx
function DeleteButton({ userId, onDelete }) {
  function handleClick(event) {
    event.stopPropagation();
    onDelete(userId);
  }

  return <button onClick={handleClick}>Delete</button>;
}
```

There are two contracts:
- **Internal:** `onClick(event)`
- **External:** `onDelete(userId)`

That is an architectural boundary. The parent does not need to know:
- Which DOM element is clickable
- Whether a button or icon is used
- How the event is extracted
- Whether propagation is stopped

---

### 4. Callback Props Are Dependency Injection
When a component receives `<Editor onSave={saveDocument} />`, the component does not own the saving implementation. It receives behavior from outside.

```
Editor
  ├── owns interaction UI
  └── invokes supplied behavior
        ▼
   parent logic
```

This is a form of **dependency injection**.

---

### 5. Child-to-Parent Communication Is Not Actually "Sending State Up"
A child does not directly mutate its parent's state. Instead:

```
Child
  │
  │ invokes callback
  ▼
Parent-owned function
  │
  ▼
Parent state update
  │
  ▼
Parent render
  │
  ▼
Child receives new props
```

The data flow remains strictly **one-way**.

---

### 6. Callback Contracts Should Be Semantic
- **Weak:** `<Card onClick={handleCardClick} />`
- **Potentially better:** `<Card onOpen={handleOpen} />` or `<Card onArchive={handleArchive} />`

`onClick` describes a physical interaction. `onArchive` describes application meaning.

---

### 7. Do Not Leak Internal DOM Structure
Avoid designing a component API that requires consumers to know:
$$\text{button} \longrightarrow \text{span} \longrightarrow \text{svg}$$

Instead expose: `onDelete(itemId)`. The implementation can change without changing the parent contract.

---

### 8. The Three Layers of Event Architecture

```
┌─────────────────────────────────┐
│ Layer 1 — Physical Interaction  │
│      click / keydown / input    │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ Layer 2 — Component Interaction │
│   onSelect / onOpen / onRemove  │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ Layer 3 — Domain Transition     │
│ selectItem / removeItem / save  │
└─────────────────────────────────┘
```

This separation is one of the most important architectural patterns in this Part.

---

### 9. Handler Ownership
Ask: *Which component knows enough to correctly interpret this interaction?* That component should generally own the low-level handler.

```tsx
function SearchInput({ value, onChange }) {
  return (
    <input
      value={value}
      onChange={event => onChange(event.target.value)}
    />
  );
}
```
The input component understands `event.target.value`. The parent receives a clean `string`.

---

### 10. Handler Transformation
`onChange={event => onChange(event.target.value)}` transforms:
$$\text{DOM contract (event)} \longrightarrow \text{component contract (string)}$$

That transformation is often architecturally valuable.

---

## Layer 2 — 🔬 Deep Mechanical Breakdown

### 11. Callback Props
Consider:
```tsx
function DeleteRow({ id, onDelete }) {
  return (
    <button onClick={() => onDelete(id)}>
      Delete
    </button>
  );
}
```

The callback flow is:
```
Parent
  │ creates onDelete
  ▼
DeleteRow receives callback
  │ render creates event handler
  ▼
button
  │ user click
  ▼
event handler
  │ calls onDelete(id)
  ▼
parent-owned callback
```
The child does not need direct access to the parent's state.

---

### 12. The Callback Is an API Boundary
Suppose: `<UserRow user={user} onDelete={handleDelete} />`.  
The contract is `onDelete(user)` or `onDelete(user.id)`. The choice matters. A component API should expose the minimum information consumers legitimately need.

---

### 13. Passing the Whole Object vs Passing the ID
- **Option A:** `onDelete={user => deleteUser(user)}`
- **Option B:** `onDelete={id => deleteUser(id)}`

Neither is universally correct. Ask: *What is the semantic contract?*
- If the component already owns the complete user object, `onDelete(user.id)` is narrow and stable.
- If the parent legitimately needs the complete entity, `onDelete(user)` is appropriate.

Avoid passing more data merely because it is available.

---

### 14. Callback Contract Minimalism
Suppose:
```tsx
function Item({ item, onAction }) {
  onAction({
    item,
    event,
    timestamp,
    index,
    source,
    internalState,
  });
}
```
This creates a large implicit contract. The parent becomes coupled to internal representation details.

> **Pass the smallest semantic payload that satisfies the contract.**

---

### 15. Event Objects at Component Boundaries
- `<SearchInput onChange={onChange} />` $\longrightarrow$ Parent must parse `event.target.value`.
- `<SearchInput onChange={value => setQuery(value)} />` $\longrightarrow$ Exposes clean `onChange(value: string)` API.

---

### 16. A Contract Decision Matrix

| API | Consumer receives | Coupling |
| :--- | :--- | :--- |
| `onClick(event)` | DOM event | Higher |
| `onChange(event)` | DOM event | Higher |
| `onChange(value)` | Semantic value | Lower |
| `onSelect(id)` | Semantic identifier | Lower |
| `onDelete(item)` | Domain entity | Moderate |
| `onSubmit(data)` | Semantic payload | Low / moderate |
| `onAction({ ...everything })` | Broad payload | High |

---

### 17. Callback Composition
A component often needs both internal and external behavior:
```tsx
function MenuItem({ onSelect }) {
  function handleClick() {
    closeMenu();
    onSelect();
  }

  return <button onClick={handleClick}>Select</button>;
}
```
Composes internal state (`closeMenu`) with external notification (`onSelect`).

---

### 18. Ordering Matters
- `closeMenu(); onSelect();` vs `onSelect(); closeMenu();`
The callback contract should define meaningful ordering when observable behavior depends on state lifecycle.

---

### 19. Conditional Callback Invocation
Distinguish optional callbacks (`onSave?.()`) from required callbacks. Optionality should be a deliberate contract decision.

---

### 20. Callback Factories
```tsx
function List({ items, onSelect }) {
  function createHandler(id) {
    return () => {
      onSelect(id);
    };
  }

  return items.map(item => (
    <button key={item.id} onClick={createHandler(item.id)}>
      {item.name}
    </button>
  ));
}
```

---

### 21. Event Handler Factory vs Handler Argument
`<button onClick={() => select(id)}>` vs `<button onClick={createSelectHandler(id)}>`. Both establish delayed execution closures. Abstractions should earn their complexity.

---

### 22. Avoid Premature Handler Abstractions
Do not build complex helper factories (`createHandlers({...})`) for simple single-button components. Senior architecture favors explicitness.

---

### 23. The "God Handler" Anti-Pattern
```tsx
// Anti-pattern:
function handleEvent(event) {
  if (event.type === "click") { /* ... */ }
  else if (event.type === "keydown") { /* ... */ }
  else if (event.type === "change") { /* ... */ }
}
```
Decompose into distinct, focused handlers: `handleClick`, `handleKeyDown`, `handleChange`.

---

### 24. UI Handlers Should Not Become Domain Monoliths
Do not combine DOM event extraction, schema validation, network calls, analytics, and modal control in a single 300-line `handleSubmit`.

---

### 25. Better Layering
```tsx
function handleSubmit(event) {
  event.preventDefault();
  const data = readFormData(event);
  submit(data);
}
```
$$\text{event handler} \longrightarrow \text{extract semantic data} \longrightarrow \text{domain operation} \longrightarrow \text{state / side effects}$$

---

### 26. Event Handler as an Adapter
A UI event handler is an adapter between browser interaction semantics and application semantics.

---

### 27. Event Ownership
```tsx
function UserRow({ user, onDelete }) {
  return (
    <div onClick={() => openUser(user.id)}>
      <button onClick={() => onDelete(user.id)}>
        Delete
      </button>
    </div>
  );
}
```
Clicking *Delete* can bubble up to the row's `openUser` handler. The component must explicitly define propagation boundaries (`event.stopPropagation()`).

---

### 28. Component-Level Event Contracts
`<Dropdown value={selected} onChange={setSelected} />`:
- Component owns: interaction mechanics, open/close state, key navigation.
- Consumer owns: authoritative selected state.

---

### 29. Controlled Component Contract
A controlled component establishes a `value + onChange` interaction loop.

---

### 30. The Interaction Loop
```
┌──────────────────────┐
│     Parent State     │
└──────────┬───────────┘
           │
           ▼ value prop
           │
           ▼
┌──────────────────────┐
│   Child Component    │
└──────────┬───────────┘
           │ user action
           ▼ internal handler
           │
           ▼ onChange(value)
┌──────────────────────┐
│   Parent Callback    │
└──────────┬───────────┘
           │
           ▼ state update
           │
           └───────────────► new render
```

---

### 31. Callback Naming
- Semantic intent: `onSelect`, `onDelete`, `onOpen`, `onClose`, `onSubmit`, `onCancel`.
- Physical event: `onClick` (only when the physical pointer event is the actual contract).

---

### 32. Naming Reveals Responsibility
- `<Dialog onClick={...} />` (physical click)
- `<Dialog onConfirm={...} />` (semantic confirmation intent)

---

### 33. Don't Make Every Component "Smart"
A simple `<Button>` should not execute database mutations or router redirects internally.

---

### 34. Don't Make Every Component "Dumb"
If every parent must calculate DOM coordinates, handle keydown focus traps, and extract form targets for every child, the abstraction has failed.

---

### 35. The Correct Boundary
$$\text{Component internals} \longrightarrow \text{physical event interpretation} \longrightarrow \text{semantic callback} \longrightarrow \text{consumer responsibility}$$

---

## Layer 3 — 🧪 Diagnostic Labs & DevTools Profiling

### 37. Lab A — DOM Event Leakage
Compare:
- `<SearchField onChange={event => setQuery(event.target.value)} />` (leaks DOM event)
- `<SearchField onChange={setQuery} />` where child handles `event.target.value` (clean semantic contract).

---

### 38. Lab B — Callback Contract Tracing
Trace argument flow from child `<Item id="item-42" onDelete={handleDelete}>` to parent `<List>` state transitions.

---

### 39. Lab C — Event vs Semantic Data
Compare `onChange(event)` vs `onChange(value)` in component library exports.

---

### 40. Lab D — Callback Identity
Track callback reference equality across parent re-renders.

---

### 41. Lab E — React DevTools
Inspect props and component trees to verify that interaction responsibility matches component boundaries.

---

### 42. Lab F — Event Propagation Trace
Log `event.target` vs `event.currentTarget` in nested action elements.

---

### 43. Lab G — Production Interaction Trace
Instrument handlers with `performance.mark` and `performance.measure` to isolate UI interaction latency.

---

## Layer 4 — 🔥 The Crucible

### 44. Prediction Challenge #1 — Semantic Callback
`<Input onChange={setValue} />` where child does `onChange(event.target.value)` passes a `string` to `setValue`, not a SyntheticEvent.

---

### 45. Prediction Challenge #2 — Nested Interaction
Clicking `<button>` inside `<div onClick={onOpen}>` triggers both handlers unless `stopPropagation()` is explicitly invoked.

---

### 46. Prediction Challenge #3 — Callback Ownership
Child owns interaction interpretation; parent owns state transition.

---

### 47. Prediction Challenge #4 — Callback Composition
Child internal state changes (`closeMenu()`) do not leak into parent callback parameters.

---

### 48. Prediction Challenge #5 — Broad Contract
Passing `{ item, event, index, target, internalMode }` increases architectural coupling and leaks internal state.

---

### 49. Prediction Challenge #6 — Handler Identity
Unmemoized inline callbacks pass a new function reference every render, failing `React.memo` prop checks on children.

---

### 50. Production Incident — "Reusable Component Exposes DOM Internals"
- **Symptom:** Parent reads `event.currentTarget.dataset.value`.
- **Fix:** Child extracts dataset value and calls `onChange(value)`.

---

### 51. Production Incident — "One Handler Controls Everything"
- **Symptom:** Single 300-line monolithic event handler.
- **Fix:** Split into distinct handlers and delegate business logic to domain layers.

---

### 52. Production Incident — "Parent Knows Too Much"
- **Symptom:** Parent manually manages date-picker popup DOM coordinates and keyboard focus.
- **Fix:** Encapsulate internal interaction inside `<DatePicker>`.

---

### 53. Production Incident — "Child Knows Too Much"
- **Symptom:** `<Button>` executes API mutations and toast notifications directly.
- **Fix:** Refactor button to emit `onClick` / `onSave` to parent.

---

### 54. Engineering Decision Matrix

| Question | Preferred Direction |
| :--- | :--- |
| Who understands DOM event details? | Component closest to DOM |
| Who owns application state? | Component responsible for that state |
| What should parent receive? | Smallest useful semantic payload |
| Should reusable components expose DOM events? | Only when genuinely useful |
| Should every callback be memoized? | No |
| Should callbacks describe physical or semantic actions? | Semantic where abstraction warrants it |
| Should child mutate parent state directly? | No |
| Should child know API implementation? | Usually no |
| Should parent know child DOM structure? | No |
| Should one event handler contain all business logic? | Usually no |
| Should event propagation determine business semantics accidentally? | No |

---

### 55. Senior Design Review Questions
- **Ownership:** Who owns state, interaction, and side effects?
- **Contract:** What payload is passed? Is it minimal and semantic?
- **Encapsulation:** Are DOM and infrastructure details shielded?
- **Composition:** Are internal and external callback orderings explicit?

---

### 56. The Senior Architecture Pattern
```
┌──────────────────────────────────────┐
│               Browser                │
│         click / key / input          │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│           React Component            │
│       interprets DOM event           │
│   manages local interaction details  │
└──────────────────┬───────────────────┘
                   │ semantic callback
                   ▼
┌──────────────────────────────────────┐
│        Parent / Feature Layer        │
│    owns application state transition │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│      Application / Domain Logic      │
│   save / delete / select / navigate  │
└──────────────────────────────────────┘
```

---

### 57. Master Mental Model
$$\text{DOM event} \longrightarrow \text{internal component handler} \longrightarrow \text{semantic callback} \longrightarrow \text{consumer-owned behavior}$$

---

### 58. Completion Checklist
- [x] **Contracts:** Design semantic callback APIs (`onSelect(id)`).
- [x] **Data Flow:** Preserve one-way data flow during child-to-parent communication.
- [x] **Encapsulation:** Shield parents from child DOM details.
- [x] **Composition:** Compose internal component state changes with external callbacks.
- [x] **Decomposition:** Eliminate god-handlers and monolithic UI dispatchers.
- [x] **Controlled Loops:** Implement `value + onChange` interaction architectures.

---

### 59. Final Rule Set
- **RULE 1:** The component closest to the DOM should usually interpret DOM events.
- **RULE 2:** Expose semantic callbacks when the component abstraction warrants them.
- **RULE 3:** Pass the smallest useful callback payload.
- **RULE 4:** Do not leak DOM structure through reusable component APIs.
- **RULE 5:** Do not put application architecture inside primitive UI components.
- **RULE 6:** Do not turn parents into DOM-event interpreters for deeply nested children.
- **RULE 7:** Keep physical interaction separate from application meaning.
- **RULE 8:** Callback identity is an independent concern from callback semantics.
- **RULE 9:** Use memoization because an identity boundary requires it—not because functions exist.
- **RULE 10:** Make interaction ownership explicit.

---

### 60. Graduation Standard
You have mastered this Part when you can take a complex interactive widget and cleanly decompose its physical DOM events, internal interaction states, boundary callback contracts, and parent domain state transitions.
