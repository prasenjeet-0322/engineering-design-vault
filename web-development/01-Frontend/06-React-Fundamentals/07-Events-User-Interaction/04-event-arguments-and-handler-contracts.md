# Level 06 — React Fundamentals
## KPI 05 — Events & User Interaction
### PART 04 — Event Arguments & Handler Contracts

[⬅️ Previous Part](03-event-propagation-and-event-flow.md) | [📚 Level 06 Index](README.md) | [🧪 Companion Lab](examples/04-event-arguments-and-handler-contracts.html) | [Next Part ➡️](05-forms-and-input-interaction.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

## Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

### 1. Part Purpose
A React event handler rarely exists merely to "receive a click."

In production code, an interaction usually needs to communicate:

```
Browser interaction
        ↓
React event handler
        ↓
Extract event information
        ↓
Combine with domain information
        ↓
Invoke domain callback
        ↓
Update state / trigger behavior
```

For example:
```tsx
<button onClick={(event) => handleDelete(user.id, event)}>
  Delete
</button>
```

There are two fundamentally different kinds of information here:
- `event` $\rightarrow$ What happened in the UI?
- `user.id` $\rightarrow$ Which application entity does this interaction concern?

Senior React code keeps those concepts distinct.

---

### 2. Core Mental Model
The central distinction is:

```
                  USER INTERACTION
                         │
                         ▼
               ┌─────────────────┐
               │  React Handler  │
               └────────┬────────┘
                        │
            ┌───────────┴───────────┐
            ▼                       ▼
    Event information       Domain information
    ─────────────────       ──────────────────
    event.target            user.id
    event.currentTarget     product.id
    event.key               order.id
    event.clientX           selectedFilter
    modifier keys           application metadata
            │                       │
            └───────────┬───────────┘
                        ▼
                 Handler Contract
                        │
                        ▼
                Application Action
```

The handler is the adapter between:
- **UI event mechanics**
- and **application behavior**

That distinction becomes increasingly important as components become reusable.

---

### 3. Executive Concept Table

| Concept | Core Mechanism | Production Impact | Common Senior Trap |
| :--- | :--- | :--- | :--- |
| **Event parameter** | React supplies event information to the handler | Lets handlers inspect the interaction | Treating event as domain data |
| **Custom argument** | Application code supplies domain information | Identifies the entity/action being operated on | Trying to make React provide application data |
| **Inline adapter** | Function receives event and calls domain callback | Cleanly combines event + domain data | Creating unnecessarily complicated wrappers |
| **Closure** | Handler retains access to surrounding render-scope values | Enables id, state, props, configuration | Assuming closure automatically means stale data |
| **Callback contract** | Defines what information a child communicates upward | Controls component coupling | Exposing DOM events when only domain data is needed |
| `onClick={fn}` | Passes a function reference | React invokes it later with the event | Forgetting that invocation timing matters |
| `onClick={fn()}` | Calls function during render | Produces side effects / wrong handler value | Confusing a function call with a callback |
| `onClick={() => fn(id)}` | Creates adapter callback | Supplies custom argument when interaction occurs | Overusing wrappers without understanding why |
| **Event + domain argument** | Handler combines both sources | Useful for reusable UI | Making component contracts too DOM-specific |
| **Handler identity** | Function object created during rendering | Relevant to child props and memoization | Treating every new function as a performance bug |

---

### 4. Golden Rule
> **React supplies information about the interaction. Your application supplies information about what that interaction means.**

Therefore:
```tsx
onClick={(event) => deleteUser(user.id)}
```
means:
- React $\rightarrow$ `event`
- Component scope $\rightarrow$ `user.id`
- Application callback $\rightarrow$ `deleteUser(...)`

Do not design application APIs around accidental knowledge of DOM events unless the event itself is genuinely part of the contract.

---

### 5. The Three-Layer Contract
A useful senior-level model is:

```
Layer 1 — Browser / React Event
          │
          │ "A click happened."
          ▼
Layer 2 — Component Interaction
          │
          │ "The user selected this item."
          ▼
Layer 3 — Application Action
          │
          │ "Delete entity 42."
          ▼
      Domain / State Logic
```

Weak architecture collapses these layers:
```
button ──► DOM event ──► business logic
```

Better architecture makes the semantic transition explicit:
```
button ──► interaction handler ──► semantic callback ──► business action
```

**Example:**
```tsx
function UserRow({
  user,
  onDelete,
}: {
  user: User;
  onDelete: (userId: string) => void;
}) {
  return (
    <button onClick={() => onDelete(user.id)}>
      Delete
    </button>
  );
}
```

The parent does not need to know that the action originated from a button click.
The child's public contract is:
```typescript
onDelete(userId: string) => void
```
not:
```typescript
onDelete(event: React.MouseEvent) => void
```

That difference is architectural, not stylistic.

---

## Layer 2 — 🔬 Deep Mechanical Breakdown

### 6. What Does React Actually Do With `onClick={handler}`?
Consider:
```tsx
function SaveButton() {
  function handleClick(event) {
    console.log(event);
  }
  return <button onClick={handleClick}>Save</button>;
}
```

Conceptually, JSX produces a React element description containing a function reference:

```
React element
┌───────────────────────────┐
│ type: "button"            │
│ props:                    │
│   onClick: handleClick ───┼────► function object
│   children: "Save"        │
└───────────────────────────┘
```

React does not execute `handleClick()` during rendering. It records the handler as part of the element's event configuration.

Later, when the interaction occurs:
```
User clicks
    ↓
React processes interaction
    ↓
React identifies applicable handler
    ↓
React invokes handler
    ↓
handler receives event information
```

Conceptually:
```javascript
handleClick(event)
```

The important point is:
`onClick={handleClick}` means:
> *"Here is the function React should invoke when the interaction occurs."*

It does not mean:
> *"Execute this function now."*

---

### 7. `onClick={fn}` vs `onClick={fn()}`
This is one of the most important distinctions in React event handling.

#### Correct
```tsx
<button onClick={handleClick}>
  Save
</button>
```
React receives: **function reference** and can later invoke it.

#### Usually incorrect
```tsx
<button onClick={handleClick()}>
  Save
</button>
```
The function is invoked while the component is rendering.

The conceptual sequence becomes:
```
Render
  ↓
evaluate JSX
  ↓
evaluate handleClick()
  ↓
function executes
  ↓
return value becomes onClick
```

If `handleClick()` returns `undefined`, React effectively receives:
```tsx
onClick={undefined}
```
instead of a handler.

---

### 8. The Critical Timing Distinction
Think in terms of execution time:

```
onClick={handleClick}
   │
   └── store function for later

onClick={handleClick()}
   │
   └── execute function now
```

This is ordinary JavaScript evaluation combined with React's callback contract.
React is not magically preventing JavaScript from invoking the function.

The parentheses mean: **CALL IT NOW.**  
No parentheses means: **PASS THE FUNCTION.**

---

### 9. Why Custom Arguments Exist
Suppose we render a list:
```typescript
const users = [
  { id: "u1", name: "Asha" },
  { id: "u2", name: "Ravi" },
  { id: "u3", name: "Maya" },
];
```

We want:
- Click Asha $\rightarrow$ delete `"u1"`
- Click Ravi $\rightarrow$ delete `"u2"`
- Click Maya $\rightarrow$ delete `"u3"`

The click event itself does not inherently contain `user.id`.  
The event describes the **interaction**.  
The component's data describes the **entity**.

Therefore we create an adapter:
```tsx
function UserList() {
  function handleDelete(userId: string) {
    console.log("Delete:", userId);
  }

  return (
    <>
      {users.map((user) => (
        <button
          key={user.id}
          onClick={() => handleDelete(user.id)}
        >
          Delete {user.name}
        </button>
      ))}
    </>
  );
}
```

The important transformation is:
$$\text{React event} + \text{user.id from render scope} \longrightarrow \text{handleDelete(user.id)}$$

---

### 10. The Adapter Function
This pattern:
```tsx
onClick={() => handleDelete(user.id)}
```
is best understood as an **adapter**.

React expects approximately:
$$(event) \implies \text{void}$$

Your application function expects:
$$(userId) \implies \text{void}$$

Those contracts do not match directly. So we create:

```
React's callback contract
        │
        ▼
 (event) => { handleDelete(user.id); }
        │
        ▼
Application callback contract
        │
        ▼
(userId) => void
```

This is why the wrapper exists. It is not merely "extra syntax." It converts one contract into another.

---

### 11. Event + Custom Argument
Sometimes both values are genuinely needed:
```tsx
<button
  onClick={(event) => {
    handleAction(user.id, event);
  }}
>
  Delete
</button>
```

Now:
- `user.id` answers: **Which entity?**
- `event` answers: **What interaction details are available?**

The resulting function contract might be:
```typescript
type DeleteHandler = (
  userId: string,
  event: React.MouseEvent<HTMLButtonElement>
) => void;
```

But ask whether the event is actually needed. If the parent only needs `userId`, then this is usually cleaner:
```tsx
onClick={() => onDelete(user.id)}
```
rather than:
```tsx
onClick={(event) => onDelete(user.id, event)}
```

The second version exposes an implementation detail of the interaction mechanism.

---

### 12. Event Data vs Domain Data
This distinction should become automatic.

#### Event Data
Examples:
- `event.target`
- `event.currentTarget`
- `event.key`
- `event.clientX`
- `event.shiftKey`
- `event.defaultPrevented`

*These answer questions about the interaction.*

#### Domain Data
Examples:
- `userId`
- `productId`
- `orderId`
- `taskId`
- `filter`
- `sortDirection`
- `permission`
- `selectedEntity`

*These answer questions about the application.*

#### Combined Example
```tsx
function ProductRow({
  product,
  onOpen,
}: {
  product: Product;
  onOpen: (productId: string) => void;
}) {
  return (
    <button onClick={() => onOpen(product.id)}>
      {product.name}
    </button>
  );
}
```

The child converts:
$$\text{DOM interaction} \longrightarrow \text{product interaction}$$

That is exactly what a component boundary should often do.

---

### 13. Closures: Why Does `user.id` Work?
Consider:
```tsx
function UserRow({ user, onDelete }) {
  return (
    <button onClick={() => onDelete(user.id)}>
      Delete
    </button>
  );
}
```

The arrow function references `user` from the surrounding render scope. That means the function closes over the values available in that scope.

Conceptually:
```
Render #1 ────────────────────
  user └── { id: "u1" }
  handler └── () => onDelete(user.id)
                │
                └── closes over render-scope user
```

When the event eventually occurs, the handler executes using the closure associated with the render in which it was created. This is fundamental to understanding React event handlers.

---

### 14. Render Snapshots and Event Handlers
Suppose:
```tsx
function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    console.log(count);
  }

  return (
    <button onClick={handleClick}>
      {count}
    </button>
  );
}
```

**Render #1:**
`count = 0`  
The handler created during that render sees: `count → 0`.

If clicking causes `setCount(1)`, React can render again:

**Render #2:**
`count = 1`  
A new render creates a new function execution scope.

Conceptually:
```
Render #1
  count = 0
  handler₁ → sees render #1 values
     ↓ state update
Render #2
  count = 1
  handler₂ → sees render #2 values
```

This is not an advanced stale-closure investigation yet. The fundamental point is simply:
> **Event handlers participate in React's render model and close over values from the render that created them.**

Advanced stale-closure behavior, concurrent rendering interactions, and optimization strategies are intentionally deferred to Level 7.

---

### 15. Why `onClick={() => fn(id)}` Is Different From `onClick={fn}`
Suppose:
```typescript
function handleDelete(id: string) {
  console.log(id);
}
```

This function expects: `id`.  
But React's click callback supplies: `event`.

If we write:
```tsx
<button onClick={handleDelete}>
```

React effectively invokes:
```javascript
handleDelete(event);
```

Therefore:
- **expected:** `id`
- **received:** `event`

The contract is wrong! The adapter fixes it:
```tsx
<button onClick={() => handleDelete(id)}>
```

Now:
```
React
  ↓ invokes wrapper with event
wrapper ignores event
  ↓
wrapper calls handleDelete(id)
```

The event still exists, but it is not forwarded.

---

### 16. Why Parameter Order Matters
Consider:
```tsx
onClick={(event) => handleDelete(user.id, event)}
```

This communicates:
$$\text{handleDelete}(\text{domain identity}, \text{event metadata})$$

Compare:
```tsx
onClick={(event) => handleDelete(event, user.id)}
```

Both are technically possible, but the second API makes event mechanics more prominent.

A senior engineer should ask:
> *What information is essential to the domain operation?*

Usually, `userId` is the essential domain input. The event is secondary interaction context.

---

### 17. Designing Semantic Callback Contracts
A reusable component should expose the smallest useful semantic contract.

Consider:
```tsx
function DeleteButton({
  userId,
  onDelete,
}: {
  userId: string;
  onDelete: (userId: string) => void;
}) {
  return (
    <button onClick={() => onDelete(userId)}>
      Delete
    </button>
  );
}
```

The component API says: `onDelete(userId)`.  
The parent can now implement:
```typescript
function handleDelete(userId: string) {
  // application behavior
}
```

The parent does not care that the interaction was produced by `<button>`.  
It could later be produced by:
- `<MenuItem>`
- `KeyboardShortcut`
- mobile touch gesture

without necessarily changing the domain contract. This is an important abstraction boundary.

---

### 18. DOM-Oriented vs Semantic Contracts
Consider two APIs:

#### DOM-Oriented
```typescript
type Props = {
  onDelete: (event: React.MouseEvent<HTMLButtonElement>) => void;
};
```
The consumer must understand:
- button mouse event
- React synthetic event type

#### Semantic
```typescript
type Props = {
  onDelete: (userId: string) => void;
};
```
The consumer understands:
- delete user

The second API usually communicates intent more directly.

However, semantic abstraction should not become dogma. If the component is explicitly a low-level button primitive (`<Button onClick={...} />`), then an event-oriented contract can be exactly appropriate. The contract should match the component's abstraction level.

---

### 19. Abstraction Level Determines the Correct Contract
A useful architecture rule:

```
Low-level UI primitive
        ↓
DOM / event-oriented contract

Domain-oriented component
        ↓
Semantic / domain-oriented contract
```

**Example:**
`<Button onClick={(event) => { ... }} />` is reasonable for a low-level UI primitive.

But:
```tsx
<UserDeleteAction userId={user.id} onDelete={handleDelete} />
```
should generally not force consumers to understand mouse-event mechanics unless they actually need them.

---

### 20. Function Props Are Contracts
A function prop is not merely "some callback." It is an **API**.

For example:
```typescript
type UserRowProps = {
  user: User;
  onSelect: (userId: string) => void;
};
```

This establishes:
- **Input:** `userId`
- **Output:** `void`
- **Meaning:** User selection occurred

The component and parent now share a contract:
$$\text{Caller} \longrightarrow \text{contract} \longrightarrow \text{implementation}$$

React function props are local application APIs.

---

### 21. Bad Callback API Design
Suppose:
```typescript
type UserRowProps = {
  onAction: (
    event: React.MouseEvent<HTMLButtonElement>,
    user: User,
    index: number,
    isSelected: boolean
  ) => void;
};
```

This may technically work, but the contract is overloaded. The consumer now depends on:
$$\text{DOM event} + \text{entire user object} + \text{render position} + \text{selection state}$$

The component is exposing implementation details instead of communicating a focused action.

A better contract might be:
```typescript
onSelect: (userId: string) => void;
onDelete: (userId: string) => void;
```
Small contracts are easier to reason about.

---

### 22. Do Not Over-Abbreviate the Contract
The opposite problem also exists.

This:
```typescript
onAction: () => void;
```
may hide too much information.

Suppose the parent must know which product was selected. Then `onAction: () => void` forces the parent to discover identity through some external mechanism. That can produce unnecessary coupling.

Prefer:
```typescript
onSelect: (productId: string) => void;
```

The right contract is not *smallest possible*, but **smallest contract containing the information required by the semantic operation**.

---

### 23. Passing the Entire Object vs Passing the ID
Consider:
```typescript
onSelect: (user: User) => void;
```
versus:
```typescript
onSelect: (userId: string) => void;
```

Neither is universally correct.

- **Pass the ID when:** The operation fundamentally identifies an entity (e.g., `onDelete(user.id)`).
- **Pass the object when:** The consumer genuinely needs the object's current data (e.g., `onPreview(user)`).

Beware of accidentally creating contracts that encourage consumers to depend on stale or unnecessary object fields. Ask:
> *What information does the receiving component actually need to perform the operation?*

---

### 24. Handler Identity at the Appropriate Level
Every render creates JavaScript function objects for newly evaluated function expressions.

For example:
```tsx
function Item({ id, onDelete }) {
  return (
    <button onClick={() => onDelete(id)}>
      Delete
    </button>
  );
}
```

The arrow function is created as part of rendering:
```
Render #1 ↓ wrapper function #1
Render #2 ↓ wrapper function #2
```

This is normal React code. Do not immediately conclude:
> *"New function = performance bug."*

That is incorrect. Function identity matters when something *observes* identity (e.g., memoized child props, dependency arrays, caches, identity-sensitive APIs). The existence of a new function alone does not establish a performance problem.

---

### 25. When Handler Identity Actually Matters
Suppose:
```tsx
const Child = memo(function Child({
  onDelete,
}: {
  onDelete: () => void;
}) {
  return <button onClick={onDelete}>Delete</button>;
});
```

Parent:
```tsx
function Parent() {
  return (
    <Child onDelete={() => { console.log("delete"); }} />
  );
}
```

The parent creates a new function during each render. Therefore the child receives a different function identity:
```
Render #1: onDelete → function A
Render #2: onDelete → function B
A !== B
```

A memoized child can therefore observe the changed prop identity. But the correct senior response is not: *"Always use useCallback."*

The correct response is:
```
Is the identity difference actually causing meaningful work?
  ↓ If no → keep the simpler code.
  ↓ If yes → investigate the rendering relationship.
  ↓ Only then consider optimization.
```

---

### 26. Handler Identity vs Handler Semantics
These are different questions:

- **Identity:** Is this the same function object?
- **Semantics:** What does this function do? What data does it capture? What contract does it implement?

Senior engineers prioritize semantic correctness first:
- **Bad:** `onClick={useCallback(...)}` just to make a function "stable" while the callback contract itself is poorly designed.
- **Good:** `onDelete={(userId) => deleteUser(userId)}` when the semantic contract is clear.

---

### 27. The Render-by-Render Model
Consider:
```tsx
function UserRow({
  user,
  onDelete,
}: {
  user: User;
  onDelete: (id: string) => void;
}) {
  return (
    <button onClick={() => onDelete(user.id)}>
      Delete {user.name}
    </button>
  );
}
```

#### Render #1
- **Input:** `user = { id: "u1", name: "Asha" }`
- React evaluates: `() => onDelete(user.id)`
- Conceptually:
  ```
  wrapper₁
    ├── onDelete
    └── user from render #1
  ```
- **Committed UI:** Delete Asha
- **User clicks:**
  - React invokes: `wrapper₁(event)`
  - The wrapper executes: `onDelete(user.id)`
  - Result: `onDelete("u1")`

The browser event does not magically become `"u1"`. The wrapper extracted application identity from its render scope.

#### Render #2
Suppose the user changes: `Asha → Ananya`.
- The component renders again.
- **Input:** `user = { id: "u1", name: "Ananya" }`
- A new wrapper is created:
  ```
  wrapper₂
    ├── onDelete
    └── user from render #2
  ```
- The handler resolves: `user.id → "u1"`
- UI displays: `Delete Ananya`

---

### 28. Prediction Challenge: `onClick={deleteUser}`
Given:
```tsx
function UserList() {
  const [selectedId, setSelectedId] = useState("u1");

  function deleteUser(value) {
    console.log(value);
  }

  return (
    <button onClick={deleteUser}>
      Delete
    </button>
  );
}
```

**Question:** What does `deleteUser` receive when the button is clicked?  
**Answer:** The **event object** supplied by React. It does not receive `selectedId` automatically.

If the desired contract is `deleteUser(selectedId)`, the component needs an adapter:
```tsx
<button onClick={() => deleteUser(selectedId)}>
  Delete
</button>
```

---

### 29. Prediction Challenge: `onClick={deleteUser(id)}`
Given:
```tsx
function Item({ id }) {
  function deleteUser(userId) {
    console.log(userId);
  }

  return (
    <button onClick={deleteUser(id)}>
      Delete
    </button>
  );
}
```

**Timeline:**
```
Render
  ↓ evaluate deleteUser(id)
deleteUser executes immediately
  ↓
return value (undefined) becomes onClick
```
The click does not cause the original invocation.

**Correct:**
```tsx
<button onClick={() => deleteUser(id)}>
```

---

### 30. Prediction Challenge: Two Arguments
Given:
```tsx
function Item({
  id,
  onAction,
}: {
  id: string;
  onAction: (id: string) => void;
}) {
  return (
    <button onClick={(event) => onAction(id)}>
      Run
    </button>
  );
}
```

**What happens to `event`?**  
**Answer:** React passes it into the wrapper. The wrapper does not forward it. The application callback receives only `id`. The event is available inside the adapter but intentionally excluded from the semantic contract.

---

### 31. Prediction Challenge: Explicit Event Forwarding
Given:
```tsx
function Item({
  id,
  onAction,
}: {
  id: string;
  onAction: (
    id: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) => void;
}) {
  return (
    <button onClick={(event) => onAction(id, event)}>
      Run
    </button>
  );
}
```

Now the contract explicitly contains both: `id` and `event`. That is legitimate if the parent genuinely needs both. The key principle is intentionality.

---

### 32. Event Parameter Position and Adapter Design
A common mistake is:
```tsx
onClick={(id) => handleDelete(id)}
```
when `onClick` is a React event handler.

The developer may think: `id` $\rightarrow$ my custom argument.  
But React supplies: `event` $\rightarrow$ first callback argument.

Therefore `onClick={(id) => ...}` actually means:
```javascript
id variable = React event object
```
The variable name does not alter what React passes.

---

### 33. Named Parameters Do Not Change the Contract
These are mechanically equivalent:
```tsx
onClick={(event) => ...}
onClick={(banana) => ...}
```
React still supplies the event. The parameter name `banana` does not make it an ID. Parameter naming errors frequently conceal incorrect assumptions.

---

### 34. Currying-Like Handler Factories
You may encounter:
```typescript
function createDeleteHandler(id: string) {
  return () => {
    deleteUser(id);
  };
}
```
Then:
```tsx
<button onClick={createDeleteHandler(user.id)}>
  Delete
</button>
```

This is mechanically valid because `createDeleteHandler(user.id)` executes during render but **returns a function**:
```
Render
  ↓ createDeleteHandler("u1")
returns function
  ↓
React receives returned function
```

Compare this with `onClick={deleteUser(user.id)}` where `deleteUser` returns `undefined`.

The precise rule is:
> **The value assigned to the event prop must be a callable handler appropriate for the event contract.**

However, the clearest pattern remains: `onClick={() => deleteUser(user.id)}`.

---

### 35. Handler Factories: When They Are Useful
A factory can make sense when handler construction itself is meaningful:
```typescript
function makeKeyboardHandler(command: Command) {
  return (event: KeyboardEvent) => {
    // complex command mapping
  };
}
```

Prefer `onClick={() => onDelete(id)}` over `onClick={createDeleteHandler(id)}` unless the factory abstraction provides real value.

---

### 36. Event Arguments in Reusable Components
Consider:
```tsx
function ProductCard({
  product,
  onAddToCart,
}: {
  product: Product;
  onAddToCart: (productId: string) => void;
}) {
  return (
    <article>
      <h2>{product.name}</h2>
      <button onClick={() => onAddToCart(product.id)}>
        Add to cart
      </button>
    </article>
  );
}
```

The component owns: `product`.  
The parent owns: `cart behavior`.  
The child communicates: `product selected for cart action`.

```
Parent
  │
  │ product data
  ▼
ProductCard
  │
  │ onAddToCart(productId)
  ▼
Parent application logic
```
The child does not need to own cart state merely because it renders the button.

---

### 37. Callback Contracts and State Ownership
Suppose:
```tsx
function Parent() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  return (
    <UserRow
      user={user}
      onSelect={(userId) => setSelectedUserId(userId)}
    />
  );
}
```

The event originates in `UserRow`, but state ownership remains in `Parent`.

$$\text{child interaction} \longrightarrow \text{semantic callback} \longrightarrow \text{parent state update}$$

> **Data flows downward. Events communicate intent upward.**

---

### 38. Avoid Returning Domain Values From Event Handlers as If React Consumes Them
Consider:
```tsx
<button onClick={() => onDelete(id)}>
  Delete
</button>
```
Suppose:
```typescript
function onDelete(id: string) {
  return true;
}
```
The returned `true` does not become a React command. React does not consume handler return values for control flow.

The meaningful behavior comes from:
- State updates
- DOM/event APIs where appropriate (`preventDefault`, etc.)
- Application callbacks & side effects through proper boundaries

---

### 39. Handler Contracts Should Describe Intent
- **Weak:** `onAction`
- **Better:** `onDelete`
- **Better:** `onUserDelete` (depending on context)

Compare:
```tsx
<Item onAction={(id) => ...} />
```
with:
```tsx
<Item onDelete={(id) => ...} />
```
The second tells the reader *"What happened?"* without requiring them to read internal implementation details.

---

### 40. Avoid Event-Specific Names for Domain Actions
- **Weak:** `onClickDelete` (mixes mechanism and intent)
- **Better:** `onDelete`

The component can internally implement:
```tsx
<button onClick={() => onDelete(id)}>
```
The public API describes the **action**. The internal implementation describes how that action is triggered.

---

### 41. One Callback vs Multiple Callbacks
Suppose:
```tsx
<Card onAction={(type, id) => { ... }} />
```
versus:
```tsx
<Card onOpen={...} onDelete={...} onArchive={...} />
```

Use separate callbacks when actions have distinct semantics and different handlers. A generic `onAction(type)` can become an untyped internal command bus disguised as a prop.

---

### 42. Anti-Pattern Teardown #1 — Calling During Render

#### Flawed
```tsx
function DeleteButton({ id, onDelete }) {
  return (
    <button onClick={onDelete(id)}>
      Delete
    </button>
  );
}
```

#### Why Developers Write It
*"I want to call onDelete with id when clicked."* (Right intent, wrong execution timing).

#### Mechanical Failure
```
render
  ↓ onDelete(id)
execution occurs immediately during render
  ↓
returned value (undefined) assigned to onClick
```

#### Senior Refactor
```tsx
function DeleteButton({ id, onDelete }) {
  return (
    <button onClick={() => onDelete(id)}>
      Delete
    </button>
  );
}
```

---

### 43. Anti-Pattern Teardown #2 — Mislabeling the Event

#### Flawed
```tsx
<button onClick={(id) => deleteUser(id)}>
  Delete
</button>
```

#### Why It Happens
The developer knows `deleteUser` expects an ID, so they name the callback parameter `id`.

#### Mechanical Failure
React supplies `event`. Therefore `id = event` and the wrong value reaches `deleteUser(event)`.

#### Refactor
```tsx
<button onClick={() => deleteUser(user.id)}>
  Delete
</button>
```

---

### 44. Anti-Pattern Teardown #3 — Passing DOM Events Through Every Layer

#### Flawed
```tsx
<UserRow onDelete={(event) => {
  controller.deleteUser(event);
}} />
```
then:
```javascript
function controller(event) {
  service.deleteUser(event.target.dataset.userId);
}
```
Now the service layer indirectly depends on DOM structure and `event.target.dataset`.

#### Refactor
```tsx
<UserRow onDelete={(userId) => {
  controller.deleteUser(userId);
}} />
```
```typescript
function controller(userId: string) {
  service.deleteUser(userId);
}
```

---

### 45. Anti-Pattern Teardown #4 — Giant Callback Contracts

#### Flawed
```typescript
onAction={(event, user, index, selected, permissions, source) => { ... }}
```

#### Mechanical Failure
Exposes too much internal component state. Consumers become coupled to DOM event structure, list position, and internal selection state.

#### Refactor
Identify the semantic action:
```typescript
onDelete={(userId) => ...}
onSelect={(userId) => ...}
onOpen={(user) => ...}
```

---

### 46. Anti-Pattern Teardown #5 — Generic `onAction`

#### Flawed
```tsx
<ListItem onAction={(action, item) => {
  if (action === "delete") { ... }
  if (action === "archive") { ... }
}} />
```
If the component has many independent behaviors, the generic callback becomes an untyped command dispatcher. Prefer explicit contracts.

---

### 47. Anti-Pattern Teardown #6 — Optimizing Function Identity Before Correctness
- **Flawed Reasoning:** *"This arrow function is recreated on every render. Therefore I must use useCallback."*
- **Correct Sequence:**
  ```
  Correct contract
          ↓
  Correct behavior
          ↓
  Observe actual rendering cost
          ↓
  Identify identity-sensitive boundary
          ↓
  Optimize if justified
  ```

---

### 48. TypeScript: Typing Event + Domain Arguments
```typescript
type UserRowProps = {
  user: User;
  onDelete: (userId: string) => void;
};

function UserRow({ user, onDelete }: UserRowProps) {
  return (
    <button onClick={() => onDelete(user.id)}>
      Delete
    </button>
  );
}
```
No event type is required because the public callback does not expose the event.

---

### 49. When the Event Is Part of the Contract
If genuinely needed:
```typescript
type ButtonProps = {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};
```
Appropriate for a low-level button abstraction.

---

### 50. Explicitly Combining Both
```typescript
type Props = {
  itemId: string;
  onAction: (
    itemId: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) => void;
};

function ActionButton({ itemId, onAction }: Props) {
  return (
    <button onClick={(event) => onAction(itemId, event)}>
      Action
    </button>
  );
}
```

---

### 51. Callback Variance and Practical API Design
Avoid making callback contracts broader than necessary:
- Define `onDelete: (id: string) => void;`
- Rather than `onDelete: (value: unknown) => void;` or `(payload: any) => void;`

Strong callback contracts make component communication explicit.

---

### 52. Callback Contracts and Component Reuse
- `onSelect: (user: User) => void` couples callback to entire entity.
- `onSelect: (userId: string) => void` communicates only identity.

Senior judgment means asking: *What is the semantic information required?*

---

### 53. Event Handler Factories and Lists
```tsx
users.map((user) => (
  <button key={user.id} onClick={() => onDelete(user.id)}>
    Delete
  </button>
))
```
Conceptually:
- `u1` $\rightarrow \text{handler}_1 \rightarrow \text{onDelete("u1")}$
- `u2` $\rightarrow \text{handler}_2 \rightarrow \text{onDelete("u2")}$
- `u3` $\rightarrow \text{handler}_3 \rightarrow \text{onDelete("u3")}$

The closure provides the association cleanly.

---

### 54. Why Reading `event.currentTarget` Is Not Always a Replacement for Domain Arguments
```tsx
<button data-user-id={user.id}>Delete</button>
```
vs
```tsx
<button onClick={() => onDelete(user.id)}>Delete</button>
```
The first encodes domain data into DOM attributes and stringifies IDs. The second maintains clean type-safe JavaScript semantics.

---

### 55. Parent-Level Delegation and Contracts
For huge collections, parent delegation can inspect `event.target`. However, it should be an intentional architecture choice driven by measurement, not the default way to handle callbacks in React.

---

### 56. Event Argument Flow Across Component Boundaries

```
Weak Architecture:
MouseEvent ──► Button ──► Row ──► List ──► Page (Leaked DOM dependency)

Strong Architecture:
MouseEvent ──► Button ──► userId ──► Row ──► List ──► Application Action
```

The deeper the event travels, the more valuable semantic translation becomes.

---

### 57. Component Boundary Rule
> **Translate low-level interaction data into the highest-level semantic information that the component boundary actually needs.**

```
<button>       MouseEvent
   ↓
<UserRow>      userId
   ↓
<UsersPage>    deleteUser(userId)
   ↓
State / Application Logic
```

---

### 58. When Passing the Event Is Correct
Do not overcorrect:
- `<TextInput onChange={(event) => { ... }} />` is intentionally exposing an input interaction.
- Reusable primitives (`<Input>`, `<Button>`) legitimately expose synthetic events because consumers may need `value`, `name`, `checked`, `selection`, modifier keys, etc.

---

### 59. Event Contract Decision Matrix

| Situation | Preferred Contract |
| :--- | :--- |
| **Low-level button primitive** | `onClick(event)` |
| **Low-level input primitive** | `onChange(event)` |
| **User row selection** | `onSelect(userId)` |
| **Product deletion action** | `onDelete(productId)` |
| **Domain action requiring modifier keys** | `onAction(id, event)` if genuinely needed |
| **Form wrapper** | Depends on whether it owns semantic form behavior |
| **Reusable menu item** | Often semantic callback |
| **DOM abstraction** | Event-oriented contract |
| **Business/domain component** | Prefer semantic contract |
| **Service/application layer** | No DOM event dependency |

---

### 60. Event Handler vs Event Object
- **Handler:** The function reference (`onClick={handleClick}`).
- **Event:** The data object React creates and passes (`function handleClick(event) {}`).

---

### 61. The Full Execution Timeline
```
TRIGGER User interaction
    ↓
React identifies click handler
    ↓
React invokes wrapper
    ↓
wrapper receives event
    ↓
wrapper reads user from its render scope
    ↓
wrapper evaluates user.id
    ↓
wrapper calls onDelete(user.id)
    ↓
parent/application logic executes
    ↓
state update may be requested
    ↓
React may render again
    ↓
reconciliation / commit
```

---

### 62. Diagnostic Lab — React DevTools
- **Objective:** Determine which function receives the event, which receives domain args, and what closure is captured.
- **Setup:**
```tsx
function UserList() {
  const [count, setCount] = React.useState(0);
  const users = [
    { id: "u1", name: "Asha" },
    { id: "u2", name: "Ravi" },
  ];

  function handleDelete(id: string) {
    console.log("delete", id);
  }

  return (
    <>
      <button onClick={() => setCount((value) => value + 1)}>
        Re-render
      </button>
      {users.map((user) => (
        <button
          key={user.id}
          onClick={() => handleDelete(user.id)}
        >
          Delete {user.name}
        </button>
      ))}
    </>
  );
}
```

---

### 63. Diagnostic Procedure
1. **Open React DevTools:** Inspect `UserList` and button components.
2. **Trigger interaction:** Click `Delete Asha` $\rightarrow$ inspect log `delete u1`.
3. **Trigger rerender:** Click `Re-render`.
4. **Repeat:** Click `Delete Asha` $\rightarrow$ semantic result remains `delete u1`.
5. **Inspect callback behavior:** Verify that recreation of closures preserved correctness.

---

### 64. Browser DevTools Event Breakpoint Investigation
`DevTools` $\rightarrow$ `Sources` $\rightarrow$ `Event Listener Breakpoints` $\rightarrow$ `Mouse` $\rightarrow$ `click`. Inspect the call stack to trace from React's dispatcher down into your adapter and domain callback.

---

### 65. Console Instrumentation
```typescript
function handleDelete(userId: string) {
  console.table({
    action: "delete",
    userId,
    timestamp: performance.now(),
  });
}
```

---

### 66. Production Incident — Wrong Entity Deleted
- **Symptom:** User clicks *Delete Ravi* but *Asha* is deleted.
- **Root Cause:** `onClick={handleDelete}` where `handleDelete(id)` receives `event` (or closure captures stale `selectedId`).
- **Refactor:** `onClick={() => handleDelete(user.id)}`.

---

### 67. Production Incident — Delete Runs During Render
- **Symptom:** Page deletes items immediately upon mount.
- **Root Cause:** `<button onClick={handleDelete(user.id)}>` invokes `handleDelete` during render.
- **Refactor:** `<button onClick={() => handleDelete(user.id)}>`.

---

### 68. Production Incident — Event Leaks Into Service Layer
- **Symptom:** Service layer takes `event` and reads `event.currentTarget.dataset.userId`.
- **Root Cause:** DOM coupling leaked across architecture boundaries.
- **Refactor:** Translate at UI boundary; pass clean domain `userId` to service layer.

---

### 69. Production Incident — Callback API Becomes Impossible to Understand
- **Symptom:** `onAction(event, item, index, state, config, source, reason, metadata)`.
- **Refactor:** Split into focused semantic callbacks (`onSelect(id)`, `onDelete(id)`, `onRetry(id)`).

---

### 70. Senior-Level Distinction: Data Plumbing vs Behavior Contracts
- **Junior question:** *"How do I get user.id into onClick?"* $\implies$ `onClick={() => onDelete(user.id)}`
- **Senior question:** *"What is the semantic contract of this UserRow?"* $\implies$ `onDelete(user.id)` as the public API.

---

### 71. Basic Understanding
- `onClick={fn}` passes function reference.
- `onClick={fn()}` calls `fn` during render.
- `onClick={() => fn(id)}` supplies application data when event occurs.

---

### 72. Strong Engineering Understanding
- React event contract $\rightarrow$ adapter function $\rightarrow$ semantic callback contract.
- Distinguish event data from domain data.
- Function identity change is normal and not an automatic performance bug.

---

### 73. Senior-Level Judgment
Analyze callback signatures critically:
- Which values are semantic?
- Which are implementation details?
- Which belong to component vs parent vs domain state?

---

## Layer 3 — 🧪 Diagnostic Labs & Prediction Exercises

### 74. Crucible Challenge 01 — Identify the Actual Argument
```tsx
function Button() {
  function save(value) {
    console.log(value);
  }
  return <button onClick={save}>Save</button>;
}
```
- **Question:** What is `value`?
- **Answer:** The synthetic `event` object supplied by React.

---

### 75. Crucible Challenge 02 — Immediate Invocation
```tsx
function Button({ id, save }) {
  return <button onClick={save(id)}>Save</button>;
}
```
- **Question:** When does `save(id)` execute?
- **Answer:** During component render.

---

### 76. Crucible Challenge 03 — Correct Adapter
```tsx
function Button({ id, save }) {
  return <button onClick={() => save(id)}>Save</button>;
}
```
- **Question:** What happens on click?
- **Answer:** React invokes adapter $\rightarrow$ adapter calls `save(id)` with application ID.

---

### 77. Crucible Challenge 04 — Both Values
```tsx
<button onClick={(event) => { save(id, event); }}>Save</button>
```
- **Question:** What are the two data sources?
- **Answer:** `id` from render-scope application data; `event` from React interaction data.

---

### 78. Crucible Challenge 05 — Parameter Mislabeling
```tsx
<button onClick={(userId) => { deleteUser(userId); }}>Delete</button>
```
- **Question:** What is actually passed as `userId`?
- **Answer:** The `event` object. Parameter names do not change caller arguments.

---

### 79. Crucible Challenge 06 — Semantic Contract
```tsx
function UserRow({ user, onDelete }) {
  return <button onClick={(event) => onDelete(event)}>Delete</button>;
}
```
- **Question:** If parent only needs user's ID, what architectural problem exists?
- **Answer:** Exposes low-level UI event instead of semantic domain operation. Use `onDelete(user.id)`.

---

### 80. Crucible Challenge 07 — Identity
```tsx
function Parent() {
  return <Child onDelete={() => console.log("delete")} />;
}
```
- **Question:** If `Parent` rerenders, is the arrow function the same function object?
- **Answer:** No, a new function instance is created. But this is not automatically a performance problem.

---

### 81. Crucible Challenge 08 — Contract Design
- **Option A:** `onClick: (event: React.MouseEvent) => void`
- **Option B:** `onDelete: (userId: string) => void`
- **Answer:** Option B is superior for domain components; Option A is suitable for low-level button primitives.

---

### 82. Crucible Challenge 09 — Entire Object or ID?
- **Answer:** Pass ID if operation only identifies entity (`onDelete(id)`); pass object if consumer needs current data snapshot (`onPreview(user)`).

---

### 83. Crucible Challenge 10 — Event Leakage
```typescript
function handleDelete(event) {
  service.delete(event.currentTarget.dataset.id);
}
```
- **Question:** What leaked into the service boundary?
- **Answer:** DOM/event representation (`currentTarget.dataset`).

---

### 84. Production Decision Matrix

| Question | Decision |
| :--- | :--- |
| Does consumer need the event itself? | Expose event |
| Does consumer only need entity identity? | Pass ID |
| Does consumer need several domain fields? | Consider a focused domain payload |
| Is component a low-level primitive? | Event contract often appropriate |
| Is component domain-oriented? | Semantic callback usually preferable |
| Is a wrapper needed to adapt arguments? | Use it |
| Is wrapper only being added because "React requires it"? | Verify actual contract |
| Is a new handler created each render? | Usually normal |
| Is handler identity causing measured work? | Investigate |
| Is useCallback being added preemptively? | Avoid premature optimization |
| Is event crossing many layers? | Consider translating it |
| Is callback carrying many unrelated arguments? | Revisit component API |

---

### 85. Production Debugging Runbook
1. **Identify the handler:** Locate `onClick={...}`.
2. **Determine what React invokes:** Function reference vs inline adapter vs accidental immediate call.
3. **Inspect arguments:** Log event and domain values with `console.table`.
4. **Separate data sources:** Classify as `EVENT`, `DOMAIN`, `STATE`, `PROPS`.
5. **Inspect callback contract:** Check child contract vs parent expectations.
6. **Trace ownership:** Distinguish event origin from state owner.
7. **Check boundary leakage:** Search for DOM properties in business/service files.
8. **Investigate identity only with profiling evidence:** Use React DevTools Profiler.

---

### 86. Architecture Exercise — Design the Contract
```tsx
type UserRowProps = {
  user: User;
  onDelete: (userId: string) => void;
};

function UserRow({ user, onDelete }: UserRowProps) {
  return (
    <button onClick={() => onDelete(user.id)}>
      Delete
    </button>
  );
}

function UserTable() {
  function handleDelete(userId: string) {
    // application behavior
  }

  return <UserRow user={user} onDelete={handleDelete} />;
}
```

---

### 87. What This Part Does NOT Teach
- Advanced stale closure analysis
- Concurrent rendering interactions
- Lane priorities & event replay
- Advanced scheduler internals & compiler optimizations

---

### 88. Cross-KPI Connections
- **KPI 01 (React Mental Model):** One-way data flow and state ownership.
- **KPI 02 (JSX):** Evaluated JS expressions in props.
- **KPI 03 (Components & Props):** Function props as component APIs.
- **KPI 04 (State):** Event handlers trigger state transitions.
- **Future Forms Parts:** Form interactions reuse this exact adapter model.

---

### 89. Senior Interview Gotchas
1. **Why not `onClick={deleteUser(id)}`?** Calls function during render.
2. **What does `onClick={deleteUser}` receive?** The React `event` object.
3. **Why does `onClick={() => deleteUser(id)}` work?** Closes over `id` and is called on interaction.
4. **Is inline arrow function a performance bug?** No, unless profiling proves child re-render bottleneck.
5. **Should every callback expose the event?** No, only low-level primitives.
6. **Pass whole object or ID?** Smallest sufficient semantic payload.
7. **Can child transform event?** Yes, that is standard adapter architecture.

---

### 90. Senior Architecture Heuristics
1. Prefer intent over mechanism (`onDelete` over `onClick`).
2. Do not leak DOM mechanics (`dataset`, `currentTarget`) to services.
3. Adapt contracts at the boundary (`() => onDelete(id)`).
4. Do not optimize callback identity without profiling proof.
5. Expose the smallest sufficient semantic payload.
6. Abstraction level determines contract.

---

### 91. Final Mental Model
```
USER ACTION
    │
    ▼
┌─────────────────┐
│   React Event   │
│     Object      │
└────────┬────────┘
         │ event information
         ▼
┌─────────────────┐
│ Adapter Handler │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
Event data  Domain data
    │         │
    └────┬────┘
         ▼
 Semantic Callback
         │
         ▼
 Application Logic
         │
         ▼
   State / Action
```

---

## Layer 4 — 🔥 The Crucible

### 92. Final Prediction Drill
```tsx
function Row({
  item,
  onSelect,
}: {
  item: { id: string; name: string };
  onSelect: (id: string) => void;
}) {
  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    console.log("event:", event.type);
    onSelect(item.id);
  }
  return <button onClick={handleClick}>{item.name}</button>;
}
```

- **Render #1:** `item.id = "p1"`. Handler closes over render #1 scope. On click: logs `event: click` and passes `"p1"`.
- **Render #2:** `item.id = "p2"`. Handler closes over render #2 scope. On click: passes `"p2"`.

---

### 93. Completion Checklist
- [x] **Event Invocation:** Can explain `onClick={fn}` vs `onClick={fn()}`.
- [x] **Arguments:** Can adapt custom arguments using closures and combine event + domain data.
- [x] **Closures:** Understand render scopes and function creation.
- [x] **Callback Contracts:** Design clean semantic contracts (`onDelete(id)`).
- [x] **Component Architecture:** Prevent DOM event leakage into domain/service layers.
- [x] **Identity:** Distinguish identity changes from performance bugs.
- [x] **Debugging:** Diagnose argument mismatches and premature render execution.
- [x] **Production Judgment:** Formulate clean component boundaries.

---

### 94. Graduation Standard
You are ready when looking at `<button onClick={...}>` allows you to immediately evaluate:
1. What function React receives.
2. When it executes.
3. What arguments React supplies vs what comes from render scope.
4. If an adapter is needed.
5. Whether contract is semantic or DOM-oriented.
6. What data crosses component boundaries.
7. Who owns resulting state.
8. If DOM details leak to domain logic.
9. If callback identity is relevant.

---

### 95. Final Senior Rule
> **Do not merely pass values through event handlers. Design the interaction contract.**
