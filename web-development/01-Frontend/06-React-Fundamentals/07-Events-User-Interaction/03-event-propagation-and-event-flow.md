Level 06 — React Fundamentals
KPI 05 — Events & User Interaction
PART 03 — Event Propagation & Event Flow
[⬅️ Previous Part](./02-event-objects-and-event-semantics.md) | [📚 Level 06 Index](./README.md) | [🧪 Companion Lab](./examples/03-event-propagation-and-event-flow.html) | [Next Part ➡️](./04-event-arguments-and-handler-contracts.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

## PART PURPOSE

Part 01 established:
$$\text{User Interaction} \longrightarrow \text{Event Handler} \longrightarrow \text{State / Application Action}$$

Part 02 established that the handler receives event information and introduced the critical distinction between:
$$\text{event.target} \quad\text{and}\quad \text{event.currentTarget}$$

This Part explains how an event moves through a hierarchy of elements:
* Why can a parent handler run when a child is clicked?
* What is event bubbling?
* What is event capturing?
* What is the event path?
* In what order do handlers execute?
* What does `stopPropagation()` actually stop?
* Why is `preventDefault()` unrelated to propagation?
* How does nested React UI affect event behavior?
* When should propagation be intentionally controlled?
* When is `stopPropagation()` actually a design smell?
* How should senior engineers design nested interactive components?

The central model is:
```text
                  EVENT
                    │
                    ▼
          Event propagation path
                    │
       ┌────────────┴────────────┐
       │                         │
 CAPTURE PHASE              BUBBLE PHASE
       │                         │
       ▼                         ▼
 outer → inner             inner → outer
```

> **The most important practical principle:**  
> An event occurring on a nested element does not necessarily belong only to that element. Events can propagate through the surrounding hierarchy, and your component architecture must account for that deliberately.

---

## LAYER 1 — ⚡ 30-SECOND EXECUTIVE CHEAT SHEET & CORE MENTAL MODELS

### 1. The Core Propagation Model
Suppose:
```jsx
<div onClick={handleParent}>
  <button onClick={handleChild}>
    Save
  </button>
</div>
```

The button is nested inside the div. A click on the button travels through the hierarchy:
```text
DIV
 │
 ▼
BUTTON (user clicks)
```

The event propagates:
* **Capture:** `DIV` $\downarrow$ `BUTTON`
* **Target:** `BUTTON`
* **Bubble:** `BUTTON` $\downarrow$ `DIV`

Therefore, both handlers can potentially execute.

---

### 2. The Three Conceptual Phases
An event moves through:
$$\mathbf{CAPTURE} \longrightarrow \mathbf{TARGET} \longrightarrow \mathbf{BUBBLE}$$

```text
Outer ancestor
       │
       ▼ capture
       │
 Inner target
       │
       ▼ target
       │
       ▼ bubble
       │
Outer ancestor
```

---

### 3. Default React Handler = Bubble-Oriented Interaction
For ordinary React handlers:
```jsx
<div onClick={handleParent}>
  <button onClick={handleChild}>Click</button>
</div>
```
The execution order is:
$$\text{button click} \longrightarrow \text{button handler (child)} \longrightarrow \text{parent handler}$$

Capture handlers use `onClickCapture` and execute during the capture phase (before target/bubble handlers).

---

### 4. `stopPropagation()` Changes the Event Path
```javascript
function handleChild(event) {
  event.stopPropagation();
}
```
* **Meaning:** Do not continue propagating this event to other nodes along the propagation path.
* **Does not mean:** Undo the click, cancel default browser actions, or stop synchronous JavaScript execution.

---

### 5. `preventDefault()` Is Different
`event.preventDefault()` controls default browser behavior (e.g. form submission page refresh or link navigation). Propagation is an orthogonal concern:
$$\mathbf{preventDefault() \neq stopPropagation()}$$

---

### EXECUTIVE CONCEPT TABLE

| Concept | Core Mechanism | Production Impact | Common Senior Trap |
| :--- | :--- | :--- | :--- |
| **Propagation** | Event travels through related nodes | Determines which handlers can run | Assuming only target handler executes |
| **Capture phase** | Event travels ancestor $\rightarrow$ target | Enables capture-oriented handling | Treating it as equivalent to bubbling |
| **Target phase** | Event reaches originating target | Target interaction occurs | Assuming target always equals current handler |
| **Bubble phase** | Event travels target $\rightarrow$ ancestors | Enables parent-level handling | Accidentally triggering parent actions |
| `onClick` | Normal React click handler | Common interaction handling | Forgetting it participates in propagation |
| `onClickCapture` | Capture-phase handler | Useful for interception/observation | Using capture without architectural reason |
| `stopPropagation()` | Stops further propagation | Prevents ancestor handlers from receiving event | Using it as a generic bug fix |
| `preventDefault()` | Prevents default browser behavior | Controls browser-native action | Thinking it stops propagation |
| **Event path** | Nodes participating in propagation | Explains execution order | Assuming DOM nesting alone explains every application behavior |
| **Delegation-style handling** | Parent handles descendant interactions | Can simplify interaction architecture | Overusing generic parent handlers |

---

### GOLDEN RULE
> **First understand the propagation path; only then decide whether propagation should be altered. Do not use `stopPropagation()` as a substitute for good component boundaries or correct event ownership.**

---

## LAYER 2 — 🔬 DEEP MECHANICAL BREAKDOWN

### 6. Why Event Propagation Exists
Consider a UI:
```text
Card
  ├── Image
  ├── Title
  ├── Description
  └── Button
```

Suppose the card itself is clickable (`<Card onClick={openDetails}>`) and the button performs an action (`<button onClick={addToCart}>`).

When the user clicks the button:
1. Button action: *“Add to cart”*
2. Card action: *“Open details”*

Without understanding propagation, both handlers execute. The click originated on the button but bubbled through its ancestors.

---

### 7. The Event Path
```jsx
<div className="app">
  <article className="card">
    <button>Buy</button>
  </article>
</div>
```

```text
       APP
        │
        ▼
     ARTICLE
        │
        ▼
     BUTTON
```

* **Capture:** `APP` $\rightarrow$ `ARTICLE` $\rightarrow$ `BUTTON`
* **Target:** `BUTTON`
* **Bubble:** `BUTTON` $\rightarrow$ `ARTICLE` $\rightarrow$ `APP`

---

### 8. Bubbling
Bubbling means an event travels from the originating target outward toward ancestors.

```javascript
function App() {
  function handleParent() { console.log("parent"); }
  function handleChild() { console.log("child"); }

  return (
    <div onClick={handleParent}>
      <button onClick={handleChild}>Click</button>
    </div>
  );
}
```
**Console Output on Button Click:**
```text
child
parent
```

---

### 9. Capture
React supports capture-phase handlers using `onClickCapture`:
```jsx
<div onClickCapture={handleParentCapture}>
  <button onClick={handleChild}>Click</button>
</div>
```
Order: `parent capture` $\rightarrow$ `button target/bubble`.

---

### 10. Full Capture + Bubble Example
```javascript
function App() {
  function parentCapture() { console.log("parent capture"); }
  function parentBubble() { console.log("parent bubble"); }
  function child() { console.log("child"); }

  return (
    <div onClickCapture={parentCapture} onClick={parentBubble}>
      <button onClick={child}>Click</button>
    </div>
  );
}
```
**Execution Sequence on Button Click:**
1. `parent capture`
2. `child`
3. `parent bubble`

---

### 11. Nested Capture
```jsx
<div onClickCapture={outerCapture}>
  <section onClickCapture={innerCapture}>
    <button onClick={buttonClick}>Click</button>
  </section>
</div>
```
$$\text{outer capture} \longrightarrow \text{inner capture} \longrightarrow \text{button target} \longrightarrow \text{inner bubble} \longrightarrow \text{outer bubble}$$

---

### 12. `target` Does Not Change During Propagation
```javascript
function handleParent(event) {
  console.log(event.target);        // Originating element (<button>)
  console.log(event.currentTarget); // Currently executing handler element (<div>)
}
```
While the parent handler runs:
* `event.target` $\rightarrow$ `<button>`
* `event.currentTarget` $\rightarrow$ `<div>`

---

### 13. Prediction-First Walkthrough
```javascript
function App() {
  function handleParent(event) {
    console.log("parent", event.target.tagName, event.currentTarget.tagName);
  }
  function handleChild() {
    console.log("child");
  }
  return (
    <div onClick={handleParent}>
      <button onClick={handleChild}>Save</button>
    </div>
  );
}
```
1. User clicks `<button>`.
2. Target phase runs `handleChild` $\rightarrow$ logs `"child"`.
3. Bubble phase reaches `<div>` and runs `handleParent` $\rightarrow$ logs `"parent BUTTON DIV"`.

---

### 14. `stopPropagation()`
```javascript
function handleChild(event) {
  event.stopPropagation();
  console.log("child");
}
```
On click, logs `"child"`. The event does not propagate to the parent.

```text
button
  │
  ▼
child handler
  │
  X (propagation stops here)
```

---

### 15. What `stopPropagation()` Does Not Mean
* It does **not** stop JavaScript execution inside the current function.
* It does **not** cancel default browser actions.
* It does **not** unbind event listeners.

---

### 16. `stopImmediatePropagation()` — Boundary Note
DOM platform listeners on the same element are handled via native browser methods. In React Fundamentals, focus on component propagation paths and `event.stopPropagation()`.

---

### 17. `preventDefault()` vs `stopPropagation()`

```text
preventDefault():
event ──► default browser action? ──► CANCELLED (NO)

stopPropagation():
event ──► continue propagating up tree? ──► HALTED (NO)
```

---

### 18. They Can Be Used Independently
* You can call `event.preventDefault()` without stopping propagation.
* You can call `event.stopPropagation()` without preventing default browser actions.

---

### 19. Production Example — Clickable Card
```jsx
function ProductCard({ product }) {
  function handleCardClick() { openProduct(product.id); }
  function handleAddToCart() { addToCart(product.id); }

  return (
    <article onClick={handleCardClick}>
      <h2>{product.name}</h2>
      <button onClick={handleAddToCart}>Add to cart</button>
    </article>
  );
}
```
Clicking *“Add to cart”* bubbles to `article` and triggers `openProduct`.

---

### 20. One Possible Fix
```javascript
function handleAddToCart(event) {
  event.stopPropagation();
  addToCart(product.id);
}
```

---

### 21. Senior Question: Why Does the Parent Need to Be Clickable?
Before blindly adding `stopPropagation()`, ask:  
*“Is the component architecture creating conflicting interaction semantics?”*

A cleaner UI architecture:
```text
Card Content ──► explicit navigation link / title button
Card Actions ──► Add to Cart, Delete, Bookmark
```
Do not rely on large clickable wrappers that swallow nested interactions.

---

### 22. Production Anti-Pattern — `stopPropagation()` Everywhere
**Flawed:**
```javascript
function Button({ onClick }) {
  function handleClick(event) {
    event.stopPropagation(); // BAD: Enforces hidden policy on all consumers
    onClick();
  }
  return <button onClick={handleClick} />;
}
```
This breaks legitimate parent analytics, keyboard traps, and selection listeners.

---

### 23. Better Design
Let the specific composition layer handle propagation:
```javascript
function CardAction({ onAction }) {
  function handleClick(event) {
    event.stopPropagation();
    onAction();
  }
  return <button onClick={handleClick}>Action</button>;
}
```

---

### 24. Parent-Level Event Handling
```jsx
function List({ items, onSelect }) {
  function handleClick(event) {
    const itemId = event.target.dataset.itemId;
    if (itemId) onSelect(itemId);
  }

  return (
    <div onClick={handleClick}>
      {items.map(item => (
        <button key={item.id} data-item-id={item.id}>
          {item.name}
        </button>
      ))}
    </div>
  );
}
```

---

### 25. Delegation vs Explicit Handlers
* **Explicit handlers:** `<button onClick={() => onSelect(item.id)}>` preserves direct closure data and eliminates DOM dataset parsing.
* In React, explicit handlers are usually clearer and preferred over manual delegation.

---

### 26. Senior Decision Flow
```text
Do I need parent-level interaction semantics?
       │ YES
       ▼
Can I express the relationship explicitly?
       │ YES
       ▼
Prefer explicit component callback contracts.
```

---

### 27. Capture-Phase Use Cases
Capture is used when a top-level boundary must intercept interactions before children run:
* High-level interaction telemetry
* Modal dismissal or focus locks
* Intercepting unauthorized clicks

Normal application code should default to standard `onClick`.

---

### 28. Capture Is Not a "More Powerful Click"
Capture is not higher priority; it simply runs during the downward traversal phase of the propagation cycle.

---

### 29. Prediction Challenge — Capture Ordering
```jsx
<div onClickCapture={() => console.log("A")}>
  <section onClickCapture={() => console.log("B")}>
    <button onClick={() => console.log("C")}>Click</button>
  </section>
</div>
```
**Order:** `A` $\rightarrow$ `B` $\rightarrow$ `C`.

---

### 30. Prediction Challenge — Capture + Bubble
```jsx
<div onClickCapture={() => console.log("A")} onClick={() => console.log("D")}>
  <section onClickCapture={() => console.log("B")} onClick={() => console.log("C")}>
    <button onClick={() => console.log("E")}>Click</button>
  </section>
</div>
```
**Order:** `A` $\rightarrow$ `B` $\rightarrow$ `E` $\rightarrow$ `C` $\rightarrow$ `D`.

---

### 31. Prediction Challenge — Stop During Bubble
```jsx
<div onClick={() => console.log("parent")}>
  <button onClick={e => { e.stopPropagation(); console.log("child"); }}>
    Click
  </button>
</div>
```
**Output:** `"child"`.

---

### 32. Prediction Challenge — Stop During Capture
```jsx
<div onClickCapture={e => { e.stopPropagation(); console.log("parent capture"); }}>
  <button onClick={() => console.log("button")}>Click</button>
</div>
```
**Output:** `"parent capture"`. (Button handler does **not** run because propagation was halted during capture!)

---

### 33. `target` and `currentTarget` During Bubbling
When a button inside a parent `div` is clicked:
* `event.target` $\rightarrow$ `<button>`
* `event.currentTarget` $\rightarrow$ `<div>` (inside div's handler)

---

### 34. Why `currentTarget` Is More Reliable for Parent Handlers
`event.currentTarget` always points to the element that owns the active handler, avoiding accidental bugs when clicking nested child nodes.

---

## LAYER 3 — 🧪 PRODUCTION ANTI-PATTERNS & DIAGNOSTIC LABS

### 35. Production Anti-Pattern — Using `target` to Infer Component Ownership
**Bad:**
```javascript
function handleClick(event) {
  if (event.target.matches(".delete-btn")) {
    deleteItem();
  }
}
```
Tightly couples behavior to CSS class names. Use direct component callbacks instead.

---

### 36. Propagation and Component Boundaries
$$\text{DOM / Event Hierarchy } \neq \text{ Application Responsibility Hierarchy}$$

---

### 37. Event Propagation Does Not Mean Business Logic Propagation
Just because a click bubbles from button to card to page does not mean all three should execute business logic.

---

### 38. Senior Architecture Principle
> **Do not ask only: *“How do I stop this event from bubbling?”*  
> Ask: *“Why does the parent need to react to this event at all?”***

---

### 39. Production Incident — Click Triggers Two Actions
* **Symptom:** Clicking *“Delete”* deletes the row AND opens the details modal.
* **Fix:** Add `event.stopPropagation()` to the delete action or decouple row clickability.

---

### 40. Production Incident — Parent Handler Silently Breaks
A child library component added `event.stopPropagation()`, silently breaking parent analytics. Keep propagation policies explicit at composite boundaries.

---

### 41. Event Propagation and Accessibility
Use semantic `<button>` elements instead of clickable `<div onClick={...}>` to ensure native keyboard navigation and focus management.

---

### 42. Event Propagation and Nested Interactive Elements
Avoid placing `<button>` inside `<a>` or `<button>` inside `<button>`. Invalid HTML causes unpredictable browser event dispatching.

---

### 43. Diagnostic Lab — Propagation Visualizer
```javascript
// Outer capture -> Middle capture -> Button target -> Middle bubble -> Outer bubble
```

---

### 44. Diagnostic Lab — Add `stopPropagation()`
Test adding `event.stopPropagation()` at the button level vs middle capture level.

---

### 45. Diagnostic Lab — Target vs CurrentTarget
Inspect `event.target.tagName` vs `event.currentTarget.tagName`.

---

### 46. Diagnostic Lab — Default vs Propagation
Demonstrate that `event.preventDefault()` on a form submit does not prevent the submit event from bubbling to parent listeners.

---

### 47. Decision Matrix

| Problem | Correct First Question | Likely Tool |
| :--- | :--- | :--- |
| **Parent reacts unexpectedly** | Should parent react? | Redesign or `stopPropagation()` |
| **Unwanted browser navigation** | Should default action occur? | `preventDefault()` |
| **Ancestor should not receive event** | Should event propagate? | `stopPropagation()` |
| **Need earliest ancestor observation** | Need capture semantics? | `onClickCapture` |
| **Item-specific action** | Can child express intent? | Explicit handler / callback prop |

---

## LAYER 4 — 🔥 THE CRUCIBLE

### 48. Crucible Challenges

#### Challenge 1 — Full Propagation Order
```jsx
<div onClickCapture={() => console.log("A")} onClick={() => console.log("D")}>
  <section onClickCapture={() => console.log("B")} onClick={() => console.log("C")}>
    <button onClick={() => console.log("E")}>Click</button>
  </section>
</div>
```
**Prediction:** `A` $\rightarrow$ `B` $\rightarrow$ `E` $\rightarrow$ `C` $\rightarrow$ `D`.

#### Challenge 2 — Target vs CurrentTarget
`<div onClick={handleClick}><button><span>Save</span></button></div>`. Clicking `<span>`:
* `event.target` = `<span>`
* `event.currentTarget` = `<div>`

#### Challenge 3 — Stop Propagation
`<div onClick={...}><button onClick={e => { e.stopPropagation(); console.log("button"); }}>Save</button></div>`.  
**Logs:** `"button"`. Parent handler is skipped.

#### Challenge 4 — `preventDefault` vs `stopPropagation`
Form submission requires `preventDefault()`. `stopPropagation()` would only stop bubbling, leaving default page reload intact.

#### Challenge 5 — Clickable Card
Clicking Delete triggers both actions. Immediate fix: `event.stopPropagation()`. Senior fix: Separate card navigation into an explicit link.

#### Challenge 6 — Reusable Button Policy
A shared button should **not** call `stopPropagation()` by default, as it breaks legitimate parent composite behavior.

#### Challenge 7 — Interception in Capture
If `<section onClickCapture={...}>` calls `event.stopPropagation()`, the event never reaches the child `<button>`.

---

### 49. Production Architecture Review
```text
1. Identify originating target.
   ↓
2. Identify propagation path.
   ↓
3. Identify capture handlers.
   ↓
4. Identify target handler.
   ↓
5. Identify bubble handlers.
   ↓
6. Identify propagation interruption.
   ↓
7. Identify default-action cancellation separately.
   ↓
8. Determine actual application responsibilities.
```

---

### 50. Senior-Level Judgment
```text
Layer 1: Event Mechanics (capture, target, bubble)
Layer 2: Component Interaction (child, parent, callback)
Layer 3: Application Responsibility (selection, deletion, navigation)
```

---

### 51. Cross-KPI Connections
* **KPI 01:** Events enter React's update pipeline via handlers.
* **KPI 03:** Composition allows children to communicate without exposing propagation details.
* **KPI 04:** Propagation determines which state transitions are triggered.

---

### 52. Deferred Topics
* Browser event loop internals $\rightarrow$ Browser / Web Platform.
* Advanced React scheduling & event priorities $\rightarrow$ Advanced Rendering.

---

### 53. PART 03 COMPLETION CHECKLIST
- [x] Explain the 3 phases of event flow: Capture, Target, Bubble.
- [x] Predict execution order for mixed `onClickCapture` and `onClick`.
- [x] Explain `event.target` vs `event.currentTarget` during propagation.
- [x] Apply `event.stopPropagation()` appropriately without masking architecture flaws.
- [x] Distinguish `preventDefault()` from `stopPropagation()`.
- [x] Refactor nested interactive cards into clean decoupled boundaries.

---

### 54. PART GRADUATION STANDARD

```text
EVENT PROPAGATION
CAPTURE: Outer ───────────────► Target
                                  │
                                  ▼
BUBBLE:  Target ─────────────► Outer
```

```text
EVENT MECHANICS        ──► Who can receive the event?
COMPONENT CONTRACTS    ──► Who should receive the interaction?
APPLICATION ARCHITECTURE ──► Who should own the resulting behavior?
```

---

[⬅️ Previous Part](./02-event-objects-and-event-semantics.md) | [📚 Level 06 Index](./README.md) | [🧪 Companion Lab](./examples/03-event-propagation-and-event-flow.html) | [Next Part ➡️](./04-event-arguments-and-handler-contracts.md)
