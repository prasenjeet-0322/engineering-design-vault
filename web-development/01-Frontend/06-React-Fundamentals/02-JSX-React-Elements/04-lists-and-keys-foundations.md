# Level 06 — React Fundamentals
# KPI 02 — JSX & React Elements
## PART 04 — JSX Trees, Identity, Conditional UI & Dynamic Collections

[⬅️ Previous Part: Expressions, Props, Children & Fragments](./03-conditional-rendering-fragments.md) | [📚 KPI 02 Index](./README.md) | [🧪 Companion Lab](./examples/04-jsx-trees-identity-conditional-collections.html) | [Next Part ➡️: Production Patterns & Anti-Patterns](./05-jsx-crucible-production-traps.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

# Knowledge Contract

By the end of this Part, you must be able to:
- construct a JSX tree mentally before React processes it
- distinguish parent/child/sibling relationships
- explain how nested JSX becomes tree topology
- predict how conditional JSX changes tree structure
- distinguish changing a prop from changing an element type
- reason about identity across renders
- explain why position matters when keys are absent
- explain why keys belong to collection identity
- distinguish key from ordinary props
- predict what happens when list items are inserted, removed, reordered, or replaced
- explain why array indexes are sometimes technically valid keys but often poor identity
- reason about nested dynamic collections
- distinguish stable identity from visual position
- understand why conditional branches can preserve or reset state depending on resulting identity
- diagnose unstable-key bugs
- diagnose state-moving bugs caused by index keys
- reason render-by-render rather than source-code-by-source-code
- understand the boundary between JSX tree construction and reconciliation

This Part builds directly on Parts 01–03.

---

# LAYER 1 — ⚡ 30-SECOND EXECUTIVE CHEAT SHEET

## 1. Core Mental Model

React receives trees.
Not:
HTML strings
Not:
DOM instructions
But conceptually:
React element tree

For:

```jsx
<App>
  <Header />
  <Main>
    <Sidebar />
    <Content />
  </Main>
  <Footer />
</App>
```

the structural model is:

```text
App
 │
 ├── Header
 │
 ├── Main
 │    ├── Sidebar
 │    └── Content
 │
 └── Footer
```

That topology matters.

---

## 2. The Render-to-Tree Model

Every render can be thought of as producing a new description:

```text
Render #N
    │
    ▼
JavaScript executes
    │
    ▼
JSX expressions evaluate
    │
    ▼
React element tree
    │
    ▼
Reconciliation against previous tree
    │
    ▼
Fiber work
    │
    ▼
Commit
    │
    ▼
DOM
```

The key point:
**React compares successive descriptions of a UI tree and uses identity rules to determine what should persist, change, move, mount, or unmount.**

---

## 3. Executive Concept Table

| Concept | Core Mechanism | Production Impact | Common Senior Trap |
| :--- | :--- | :--- | :--- |
| **Tree** | Hierarchical element structure | Defines UI relationships | Thinking only in terms of DOM |
| **Parent** | Element containing another element | Controls structure | Confusing component parent with DOM parent |
| **Child** | Nested element/value | Composition | Assuming child means DOM descendant |
| **Sibling** | Elements sharing a parent | Collection/branch structure | Ignoring sibling order |
| **Position** | Location among siblings | Identity when keys absent | Assuming visual identity |
| **Type** | Element/component identity category | Determines reuse/replacement | Treating props change as type change |
| **Key** | Stable identity among siblings | Preserves collection item identity | Using array index by default |
| **Conditional branch** | Runtime tree selection | Mount/unmount/state preservation | Thinking hidden $\neq$ removed |
| **Collection** | Array of child descriptions | Dynamic lists | Missing stable keys |
| **Reorder** | Same identities at new positions | Efficient movement/preservation | Using indexes and moving state |
| **Replacement** | Different identity/type | Unmount + mount | Expecting state preservation |
| **State continuity** | Fiber identity survives | Inputs/local state persist | Assuming DOM position alone determines it |

---

## 4. Golden Rule

> **React identity is not determined by visual appearance. It is determined by the structural identity of elements within the tree—primarily their type, key, and position in the relevant parent context.**

For dynamic collections:

> **The key should identify the logical item, not its current position.**

---

## 5. The Tree Is the Unit of Reasoning

Consider:

```jsx
return (
  <main>
    <h1>Dashboard</h1>
    <section>
      <Card />
      <Card />
    </section>
  </main>
);
```

Do not immediately think:
`main DOM ➔ h1 DOM ➔ section DOM ➔ div DOM ➔ div DOM`

First construct the React structure:

```text
main
 ├── h1
 │    └── "Dashboard"
 │
 └── section
      ├── Card
      └── Card
```

Then React determines the runtime work required to realize that structure.

---

## 6. Why Tree Topology Matters

These are not structurally equivalent:

```jsx
<A>
  <B />
</A>
```

and:

```jsx
<A>
  <Wrapper>
    <B />
  </Wrapper>
</A>
```

The second introduces another level:

```text
A └── Wrapper └── B
```

rather than:

```text
A └── B
```

That can affect:
- component boundaries
- CSS/layout
- reconciliation
- state ownership
- context boundaries
- DOM structure
- accessibility
- event propagation
- performance characteristics

Tree topology is therefore architectural information.

---

# LAYER 2 — 🔬 DEEP MECHANICAL BREAKDOWN

## 7. What Is a JSX Tree?

A JSX tree is the hierarchical structure implied by nested JSX.

Example:

```jsx
<div>
  <header>
    <h1>Dashboard</h1>
  </header>
  <main>
    <section>
      <p>Hello</p>
    </section>
  </main>
</div>
```

Conceptual tree:

```text
div
 │
 ├── header
 │    └── h1
 │         └── "Dashboard"
 │
 └── main
      └── section
           └── p
                └── "Hello"
```

Every nesting level establishes a parent-child relationship.
Every adjacent child under the same parent establishes sibling relationships.

---

## 8. Parent, Child, Sibling

Given:

```jsx
<ul>
  <li>A</li>
  <li>B</li>
  <li>C</li>
</ul>
```

The tree is:

```text
ul
 ├── li A
 ├── li B
 └── li C
```

Relationships:
- `ul` $\to$ parent of all three `li` elements
- `li A` $\to$ sibling of `li B` and `li C`
- `li B` $\to$ sibling of `li A` and `li C`
- `li A` $\to$ not parent of `li B`

These relationships matter when reasoning about reconciliation.

---

## 9. Sibling Position

Without keys:

```jsx
<ul>
  <Item />
  <Item />
  <Item />
</ul>
```

the conceptual sibling positions are:
- `position 0 ➔ Item`
- `position 1 ➔ Item`
- `position 2 ➔ Item`

If a new item is inserted at the beginning:

```jsx
<ul>
  <NewItem />
  <Item />
  <Item />
  <Item />
</ul>
```

positions become:
- `position 0 ➔ NewItem`
- `position 1 ➔ Item`
- `position 2 ➔ Item`
- `position 3 ➔ Item`

Without stable keys, React has limited information about the semantic identity of those positions.
This is exactly why keys exist.

---

## 10. Identity Is Not "Where It Appears on Screen"

Suppose:
`Alice Bob Charlie`
becomes:
`Charlie Alice Bob`

Visually, each item moved.
The logical identities are still: `Alice`, `Bob`, `Charlie`.

A stable-keyed representation tells React:
- Alice = same logical item
- Bob = same logical item
- Charlie = same logical item

even though their positions changed.

Therefore:

$$\mathbf{position \neq logical\ identity}$$

This is one of the most important ideas in dynamic React UI.

---

## 11. Keys

Consider:

```jsx
items.map(item => (
  <Row key={item.id} item={item} />
))
```

The key provides identity information among siblings.

For:

```javascript
[
  { id: "a", name: "Alpha" },
  { id: "b", name: "Beta" }
]
```

the conceptual tree is:

```text
parent
 ├── Row(key="a")
 └── Row(key="b")
```

On the next render:

```javascript
[
  { id: "b", name: "Beta" },
  { id: "a", name: "Alpha" }
]
```

the tree becomes:

```text
parent
 ├── Row(key="b")
 └── Row(key="a")
```

The positions changed. The keys did not. That allows React to associate each new element with the corresponding prior identity.

---

## 12. What a Key Is Not

A key is not:

```jsx
<Row key={item.id} id={item.id} />
```

where React magically passes `props.key` to `Row`.

`key` has special meaning to React. It is not ordinary component data.
If the component needs the ID:

```jsx
<Row key={item.id} id={item.id} />
```

Then:
- `key` $\to$ React identity information
- `id` $\to$ component prop

Do not rely on `props.key` for application data.

---

## 13. Why Stable Keys Matter

Consider a list: `A B C`.
Each row has internal state:
- `A ➔ input "Apple"`
- `B ➔ input "Banana"`
- `C ➔ input "Cherry"`

Now insert `X` at the front: `X A B C`.

If indexes are used as identity:
- `0 ➔ A ➔ now X`
- `1 ➔ B ➔ now A`
- `2 ➔ C ➔ now B`
- `3 ➔ C`

State becomes associated with the wrong logical item.

With stable keys:
- `X ➔ key X`
- `A ➔ key A`
- `B ➔ key B`
- `C ➔ key C`

the logical association remains:
- `state A ➔ A`
- `state B ➔ B`
- `state C ➔ C`

This is not merely a performance optimization. It is correctness.

---

## 14. Index Keys

This:

```jsx
items.map((item, index) => (
  <Row key={index} item={item} />
))
```

is sometimes acceptable.

But the critical condition is:
**The list must behave as a stable positional collection.**

Index keys become dangerous when the collection can:
- reorder
- insert at the beginning
- delete from the middle
- filter dynamically
- sort
- paginate in ways that alter local ordering
- change membership

The issue is not: *"index keys are always forbidden"*.
The issue is: **Does the index represent stable identity?**
Usually, for mutable application collections, it does not.

---

## 15. The Correct Identity Question

Do not ask:
*"What value is easiest to put into key?"*

Ask:
**"What uniquely identifies this logical item across renders?"**

Possible answers:
- database ID
- UUID
- stable domain identifier
- immutable entity key

Bad answers for mutable collections:
- array index
- random value generated during render (`Math.random()`)
- timestamp generated during render (`Date.now()`)

---

## 16. Random Keys Are Particularly Destructive

This:

```jsx
items.map(item => (
  <Row key={Math.random()} item={item} />
))
```

creates unstable identity.

Every render generates different keys:
- Render #1: `A ➔ key 0.123`, `B ➔ key 0.456`
- Render #2: `A ➔ key 0.789`, `B ➔ key 0.111`

React sees completely different identities on every render pass.
The logical result is repeated remounting.

Consequences include:
- state resets
- effects re-running
- DOM replacement
- lost input focus
- expensive garbage collection
- broken CSS animations
- unnecessary lifecycle churn

**Never generate keys from unstable render-time randomness.**

---

## 17. Conditional Rendering Changes Tree Topology

Consider:

```jsx
{isAdmin && <AdminPanel />}
```

When `isAdmin = false`, the child is absent:
`Dashboard └── no AdminPanel`

When `isAdmin = true`, the tree becomes:
`Dashboard └── AdminPanel`

The tree topology changed. React must determine what was added.

---

## 18. Conditional Branches Are Runtime Tree Selection

Consider:

```jsx
{isLoading ? <Spinner /> : <Content />}
```

- Render #1 (`isLoading = true`): `section └── Spinner`
- Render #2 (`isLoading = false`): `section └── Content`

This is not *"same node with different appearance"*.
It is: **different element types at the same structural location.**
That distinction is central to state preservation.

---

## 19. Type Change Is a Major Identity Boundary

Consider:

```jsx
return condition ? <UserProfile /> : <LoginForm />;
```

At the same parent position (position 0):
- Render #1: `UserProfile`
- Render #2: `LoginForm`

The type changed.

```text
UserProfile ──▶ different type ──▶ LoginForm
```

React does not treat the new component as the old component merely because it occupies the same screen position.
This results in full unmounting of that subtree and corresponding state destruction.

---

## 20. Same Type, Different Props

Now:

```jsx
<UserProfile userId={userId} />
```

- Render #1: `userId = "a"`
- Render #2: `userId = "b"`

The type remains `UserProfile` while props change (`"a" → "b"`).
This is fundamentally different from `UserProfile → LoginForm`.
The component identity persists while its inputs change.

---

## 21. Prediction Walkthrough #1 — Same Type, Changed Props

```javascript
function Profile({ userId }) {
  return <div>{userId}</div>;
}
```

Parent: `<Profile userId={userId} />`

### Render #1 (`userId = "A"`):
`Parent └── Profile └── div └── "A"`

### Render #2 (`userId = "B"`):
`Parent └── Profile └── div └── "B"`

Identity:
- `Profile` $\to$ same component type
- same sibling position
- no key change

Props changed. The component remains the same logical instance while receiving new input.

---

## 22. Prediction Walkthrough #2 — Type Replacement

```javascript
function Screen({ authenticated }) {
  return (
    <main>
      {authenticated ? <Dashboard /> : <Login />}
    </main>
  );
}
```

- Render #1 (`authenticated = false`): `main └── Login`
- Render #2 (`authenticated = true`): `main └── Dashboard`

Same parent. Same position. Different type.
Therefore: `Login` unmounts and destroys state; `Dashboard` mounts cleanly.

---

## 23. Prediction Walkthrough #3 — Stable List Keys

```javascript
function List({ items }) {
  return (
    <section>
      {items.map(item => (
        <Row key={item.id} item={item} />
      ))}
    </section>
  );
}
```

- Initial `[A, B, C]`: `section ├── Row(key=A) ├── Row(key=B) └── Row(key=C)`
- Next render `[C, A, B]`: `section ├── Row(key=C) ├── Row(key=A) └── Row(key=B)`

The ordering changed. The identities remain: `C ➔ C`, `A ➔ A`, `B ➔ B`.

---

## 24. Prediction Walkthrough #4 — Index Key State Bug

Consider:

```javascript
function Row({ item }) {
  const [draft, setDraft] = useState(item.name);
  return (
    <input
      value={draft}
      onChange={e => setDraft(e.target.value)}
    />
  );
}
```

Parent:

```jsx
items.map((item, index) => (
  <Row key={index} item={item} />
))
```

Initial: `A, B, C`.
Identity: `0 ➔ A`, `1 ➔ B`, `2 ➔ C`.

User edits B: `A ➔ "A"`, `B ➔ "B edited"`, `C ➔ "C"`.

Now insert X at the front: `X, A, B, C`.
Index identity becomes:
- `0 ➔ X` (Inherits previous state of index 0: `"A"`)
- `1 ➔ A` (Inherits previous state of index 1: `"B edited"`)
- `2 ➔ B` (Inherits previous state of index 2: `"C"`)
- `3 ➔ C` (New state initialized)

The state that belonged to B now appears attached to A.

---

## 25. Why `useState(item.name)` Does Not Automatically Update

`const [draft] = useState(item.name);`
The initializer runs only when that component instance is mounted.
If the same component identity receives `item.name = "A"` and later `item.name = "B"`, the state variable does not automatically reset to `"B"`.

Therefore index-key bugs become fatal:

```text
unstable identity + state initialized from props ──▶ state attached to wrong logical item
```

---

## 26. Production Anti-Pattern — Index Keys in Editable Lists

### Flawed
```jsx
{users.map((user, index) => (
  <EditableUser key={index} user={user} />
))}
```

### Why Developers Do It
The index is always available without thinking.

### Mechanical Failure
If users reorder `Alice Bob Charlie` to `Charlie Alice Bob`, index-based identity follows array slots rather than users, corrupting uncontrolled inputs and local state.

### Senior Refactoring
```jsx
{users.map(user => (
  <EditableUser key={user.id} user={user} />
))}
```

---

## 27. Production Anti-Pattern — Random Keys

### Flawed
```jsx
<Row key={crypto.randomUUID()} />
```

### Mechanical Failure
Unique is not enough. React requires **stable** identity across renders. A new UUID on every render forces React to tear down and recreate DOM on every frame.

### Senior Rule
A good key is **stable**, **unique among siblings**, and **tied to the logical entity**.

---

## 28. Production Anti-Pattern — Keying the Wrong Element

Consider:

```jsx
items.map(item => (
  <div>
    <Row key={item.id} item={item} />
  </div>
))
```

The key is on `Row`, but the repeated sibling at the parent level is `div`.
The logical collection identity is attached to the wrong level.

### Prefer
```jsx
items.map(item => (
  <div key={item.id}>
    <Row item={item} />
  </div>
))
```

---

## 29. Keyed Fragment as the Repeated Unit

```jsx
items.map(item => (
  <Fragment key={item.id}>
    <Row item={item} />
    <Divider />
  </Fragment>
))
```

The fragment is now the repeated logical unit:

```text
Fragment(key=A) ├── Row └── Divider
Fragment(key=B) ├── Row └── Divider
```

Preserves identity without adding wrapper DOM nodes.

---

## 30. Conditional UI: Three Different Meanings

```jsx
// Pattern 1: Absent when false
{condition && <Panel />}

// Pattern 2: Explicit absence
{condition ? <Panel /> : null}

// Pattern 3: Structurally present, hidden via CSS/DOM property
<Panel hidden={!condition} />
```

`remove from tree ≠ hide`.

---

## 31. Conditional Rendering and State

```jsx
{open && <Editor />}
```

- When `open = true`: `Editor` mounts, initializes local state and effects.
- When `open = false`: `Editor` unmounts, local state and effects are destroyed.
- When `open` becomes `true` again: a brand new mount occurs.

This differs from `<Editor hidden={!open} />`, where state is preserved.

---

## 32. State Preservation Is a Tree Identity Question

A senior engineer asks:
**"Did the element remain the same identity?"**
rather than: *"Is it still visually in roughly the same place?"*

```text
same type + same key + same parent context / position ──▶ identity continuity
different type or different key                       ──▶ destruction & recreation
```

---

## 33. The Position Trap

Consider:

```jsx
{showFirst ? <Counter /> : <Counter />}
```

Both branches produce `Counter` at the exact same structural position.
React does not track source-code branch syntax. What matters is the resulting tree.

```text
source code branches ≠ runtime tree branches
```

---

## 34. Explicit Keys Can Deliberately Change Identity

```jsx
<Counter key={userId} />
```

- `userId = A ➔ Counter(key=A)`
- `userId = B ➔ Counter(key=B)`

Even though the component type remains `Counter`, the key changed, intentionally forcing a clean state reset.

---

## 35. Intentional State Reset Pattern

```jsx
<ProfileEditor key={user.id} user={user} />
```

When `user.id` changes, React treats it as a brand new component, resetting draft inputs without complex `useEffect` state syncing.

---

## 36. Key as a Semantic Reset Boundary

```jsx
<Form key={record.id} record={record} />
```

Communicates: *"This is a different logical form instance when the record changes."*

---

## 37. Do Not Abuse Keys for Random Resetting

```jsx
// ❌ Bad: Forces remount on every keystroke/frame
<Component key={Date.now()} />
```

Destroys focus, cancels pending animations, and causes memory churn.

---

## 38. Dynamic Collections

```jsx
items.map(item => (
  <Item key={item.id} item={item} />
))
```

If data changes from `A B C` to `A C D`:
- `A` $\to$ preserved
- `B` $\to$ removed
- `C` $\to$ preserved
- `D` $\to$ new

---

## 39. Collection Operations and Identity

- **Append (`A B C ➔ A B C D`):** `A, B, C` preserved; `D` new.
- **Remove (`A B C ➔ A C`):** `A, C` preserved; `B` removed.
- **Reorder (`A B C ➔ C A B`):** `C, A, B` preserved in new positions.
- **Replace (`A B C ➔ A X C`):** `A, C` preserved; `B` removed; `X` new.

---

## 40. Nested Collections

```jsx
departments.map(department => (
  <Department key={department.id}>
    {department.users.map(user => (
      <User key={user.id} user={user} />
    ))}
  </Department>
))
```

Two identity scopes:
```text
Root
 ├── Department(key=D1)
 │    ├── User(key=U1)
 │    └── User(key=U2)
 │
 └── Department(key=D2)
      ├── User(key=U3)
      └── User(key=U4)
```

Keys only need to be unique among their immediate sibling set.

---

## 41. Key Scope

Keys are scoped to their sibling set. They are not global application IDs.

---

## 42. Composite Identity

```jsx
key={`${user.id}-${role}`}
```

Valid when an entity can appear multiple times in different roles within the same sibling collection.

---

## 43. Key Collisions

```jsx
// ❌ Dangerous if names are not guaranteed unique
items.map(item => <Row key={item.name} item={item} />)
```

Duplicate keys break reconciliation and corrupt UI updates.

---

## 44. Conditional Lists (Filtering)

```jsx
items
  .filter(item => item.visible)
  .map(item => <Row key={item.id} item={item} />)
```

Stable keys preserve item identity during filtering without state migration.

---

## 45. Sorting

Stable keys allow React to follow `Alice`, `Bob`, `Charlie` as persistent entities when array order changes.

---

## 46. Why Keys Belong to Data Mapping

```text
domain entity
 ├── identity ──▶ key
 └── data     ──▶ props
```

Direct mapping from domain model to React identity and props.

---

## 47. Tree Topology vs DOM Topology

```jsx
<App>
  <Card />
</App>
```

`App └── Card`. If `Card` returns `<article><h2>Title</h2></article>`, the host DOM is `article └── h2`.
The `Card` component is not a DOM element.

---

## 48. Fiber Perspective

```text
React element
     │
     ▼
   Fiber
     ├── type
     ├── key
     ├── pendingProps
     ├── memoizedState
     ├── child
     ├── sibling
     └── return
```

`key` $\to$ element identity hint; `Fiber` $\to$ persistent runtime structure; `DOM node` $\to$ host representation.

---

## 49. Render #1 $\to$ Render #2: Full Mechanical Trace

```javascript
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map(todo => (
        <Todo key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}
```

Initial `[ { id: 1 }, { id: 2 } ]`: `ul ├── Todo(key=1) └── Todo(key=2)`.
React allocates `Fiber(key=1)` and `Fiber(key=2)`.

---

## 50. Render #2 — Append

Data: `[ { id: 1 }, { id: 2 }, { id: 3 } ]`.
Reconciliation matches `1` and `2`, allocating new `Fiber 3`.

---

## 51. Render #3 — Reorder

Data: `[ { id: 3 }, { id: 1 }, { id: 2 } ]`.
Reconciliation maps `3 ➔ 3`, `1 ➔ 1`, `2 ➔ 2`. Fibers survive position changes.

---

## 52. Render #4 — Remove

Data: `[ { id: 3 }, { id: 2 } ]`.
Reconciliation preserves `3` and `2`, unmounting `Fiber 1`.

---

## 53. Conditional Tree Prediction

```javascript
function App({ mode }) {
  return (
    <main>
      {mode === "loading" && <Spinner />}
      {mode === "ready" && <Content />}
      {mode === "error" && <ErrorPanel />}
    </main>
  );
}
```

- `mode = "loading"` $\to$ `main └── Spinner`
- `mode = "ready"` $\to$ `main └── Content`
- `mode = "error"` $\to$ `main └── ErrorPanel`

---

## 54. Mutually Exclusive Conditional Branches

- `{mode === "loading" && <Spinner />} {mode === "ready" && <Content />}` models 3 states (including neither).
- `{mode === "loading" ? <Spinner /> : <Content />}` models exactly 2 outcomes.

---

## 55. Exhaustiveness Matters

For finite UI states:

```javascript
switch (status) {
  case "loading": return <Spinner />;
  case "success": return <Content />;
  case "error":   return <ErrorPanel />;
  case "empty":   return <EmptyState />;
  default:        return null;
}
```

---

## 56. Boolean Explosion

Avoid combinations of booleans (`!loading && !hasError && hasData`). Represent mutually exclusive states explicitly in the state model.

---

## 57. Tree Shape Is a Debugging Tool

When UI behaves unexpectedly, draw the tree. Drawing the tree often reveals the bug faster than reading DOM snapshots.

---

## 58. Production Anti-Pattern — Conditional Wrapper Changes

```jsx
// ❌ Flawed: Changes tree topology between compact and expanded
return isCompact ? (
  <Panel><Content /></Panel>
) : (
  <div><Panel><Content /></Panel></div>
);
```

---

## 59. Production Anti-Pattern — Changing Type to Change Styling

```jsx
// ❌ Bad: Destroys host identity for styling
return emphasized ? <strong>{text}</strong> : <span>{text}</span>;

// ✅ Senior Refactor
return (
  <span className={emphasized ? "emphasized" : undefined}>
    {text}
  </span>
);
```

---

## 60. Production Anti-Pattern — Treating Visual Position as Identity

Draggable lists using `key={index}` fail because position is not logical identity.

---

## 61. Production Anti-Pattern — Reusing a Key Across Different Logical Entities

```jsx
// ❌ Reusing static key fails to encode document identity
<Editor key="editor" document={document} />

// ✅ Correct
<Editor key={document.id} document={document} />
```

---

## 62. Production Anti-Pattern — Using `key` as a Prop

```jsx
// ❌ Broken
function Row({ key }) { return <span>{key}</span>; }

// ✅ Correct
function Row({ id }) { return <span>{id}</span>; }
```

---

# LAYER 3 — 🧪 DIAGNOSTIC LABS & DEVTOOLS PROFILING

## 63. Companion Lab Architecture

Lab available at:
[`examples/04-jsx-trees-identity-conditional-collections.html`](./examples/04-jsx-trees-identity-conditional-collections.html)

```text
┌──────────────────────────────────────────────────────────────┐
│                JSX Tree & Identity Laboratory                │
├──────────────────────┬───────────────────────────────────────┤
│       Data / JSX     │               React Tree              │
│                      │                                       │
│          A           │  List                                 │
│          B           │   ├── Row key=A                       │
│          C           │   ├── Row key=B                       │
│                      │   └── Row key=C                       │
├──────────────────────┴───────────────────────────────────────┤
│ Operations                                                   │
│ [Append] [Remove] [Reverse] [Insert First] [Shuffle]         │
├──────────────────────────────────────────────────────────────┤
│ Identity Mapping                                             │
│ Previous key → Current key → Status                          │
│ A → A → PRESERVED                                            │
│ B → C → MOVED                                                │
│ C → B → MOVED                                                │
└──────────────────────────────────────────────────────────────┘
```

---

## 64. Lab #1 — Tree Construction

Visualize nested JSX topology and observe structural changes when introducing wrapper nodes.

---

## 65. Lab #2 — Stable Key Reorder

Compare `A B C` reversed to `C B A` with stable keys vs index keys.

---

## 66. Lab #3 — State Migration Simulation

Simulate input state corruption when inserting `X` at index 0 with `key={index}`.

---

## 67. Lab #4 — Conditional Identity

Inspect `Login ➔ Dashboard` type change and `<Profile key={userId} />` semantic reset.

---

## 68. React DevTools Runbook — Components

Inspect list components, correlating application data order with the React component tree.

---

## 69. React DevTools Runbook — Profiler

Profile list reorder, insert, and delete operations to observe mount/unmount vs update commits.

---

## 70. DevTools Diagnostic Checklist

- [ ] Is the list generated by `map`/`filter`?
- [ ] What is the logical entity?
- [ ] What key identifies it?
- [ ] Is the key stable across renders?
- [ ] Can the collection reorder, insert, remove, or filter?
- [ ] Does a row contain local state?
- [ ] Are keys attached to the repeated sibling unit?
- [ ] Are there duplicate or random keys?

---

## 71. Console Identity Diagnostics

```javascript
items.map((item, index) => {
  console.table({ index, id: item.id, name: item.name });
  return <Row key={item.id} item={item} />;
});
```

---

## 72. Diagnostic Instrumentation for Mount/Unmount

```javascript
useEffect(() => {
  console.log("mounted", item.id);
  return () => {
    console.log("unmounted", item.id);
  };
}, []);
```

---

## 73. Important Diagnostic Distinction

```text
rerender vs reconciliation identity vs mount/unmount vs DOM mutation
```

---

## 74. Master Execution Timeline

```text
Trigger
   │
   ▼ Component render
   │
   ▼ JavaScript evaluates collection (map/filter)
   │
   ▼ New React element tree
   │
   ▼ Reconciliation (type, key, position matching)
   │
   ▼ Commit (insert, update, remove, move DOM nodes)
   │
   ▼ Browser rendering
   │
   ▼ Passive effects
```

---

# LAYER 4 — 🔥 THE CRUCIBLE

## 75. Prediction Challenge #1 — Reorder

- Initial: `A B C`
- Render #2: `C A B`
- **Result:** All 3 logical identities survive; positions updated; 0 rows unmounted.

---

## 76. Prediction Challenge #2 — Insert With Index Keys

- Initial: `A B C` (`key=0,1,2`)
- Insert `X` at front: `X A B C` (`key=0,1,2,3`)
- **Result:** Index `0` receives `X` but retains state of `A`; index `1` receives `A` but retains state of `B`.

---

## 77. Prediction Challenge #3 — Type Change

`return mode === "a" ? <Editor /> : <Preview />;`
- `mode = "a" ➔ mode = "b"`
- **Result:** Different type $\to$ `Editor` unmounts, state destroyed, `Preview` mounts cleanly.

---

## 78. Prediction Challenge #4 — Key Change

`<Editor key={document.id} document={document} />`
- `document.id = A ➔ document.id = B`
- **Result:** Same type, different key $\to$ identity reset, state reset.

---

## 79. Prediction Challenge #5 — Filtering

Filter out `B` from `A B C`:
- Stable keys: `A` and `C` preserved, `B` unmounts.
- Index keys: `C` takes index 1 and inherits `B`'s local state.

---

## 80. Prediction Challenge #6 — Keyed Fragment

```jsx
items.map(item => (
  <Fragment key={item.id}>
    <dt>{item.name}</dt>
    <dd>{item.value}</dd>
  </Fragment>
))
```
Reorder `A B C` to `C A B` preserves both `dt` and `dd` for each item cleanly.

---

## 81. Production Incident Runbook — Wrong Input State

- **Symptom:** Edited input value moves to a different task after sorting.
- **Root Cause:** `key={index}` used on mutable list.
- **Fix:** Replace with `key={task.id}`.

---

## 82. Production Incident Runbook — State Reset on Navigation

- **Symptom:** Switching records resets editor draft.
- **Cause:** `<Editor key={record.id} />` intentionally resets identity.
- **Fix:** Remove `key` if shared draft state is desired across record switches.

---

## 83. Engineering Decision Matrix

| Situation | Identity Strategy |
| :--- | :--- |
| Static fixed children | Position is sufficient |
| Stable domain collection | Domain ID |
| Reorderable list | Stable entity key |
| Filterable list | Stable entity key |
| Editable rows | Stable entity key |
| Drag-and-drop list | Stable entity key |
| Grouped multi-node item | Keyed Fragment |
| Deliberate state reset | Change key intentionally |
| Randomly generated key | Avoid |
| Index key in mutable list | Avoid |
| Duplicate key | Fix immediately |
| Key on inner child | Move key to outer repeated sibling |
| Key used as application prop | Pass separate prop (`id`) |

---

## 84. Senior Interview Gotchas

1. **"Keys improve performance."** $\to$ Incomplete. Keys primarily guarantee identity correctness.
2. **"Keys must be globally unique."** $\to$ False. Keys must be unique only among immediate siblings.
3. **"Index keys are always wrong."** $\to$ False. Valid for strictly static, immutable collections.
4. **"Changing props remounts the component."** $\to$ False. Same type/key persists across prop changes.
5. **"Changing the key only affects warnings."** $\to$ False. Changing a key resets component state and identity.
6. **"Same screen location means same component."** $\to$ False. Type and key dictate identity.
7. **"A component rerender means it remounted."** $\to$ False. Rerender and remount are distinct lifecycles.
8. **"React compares DOM nodes directly."** $\to$ False. React reconciles virtual element trees.
9. **"A key is passed as props."** $\to$ False. `key` is consumed by the reconciler.
10. **"Conditional rendering only hides elements."** $\to$ False. It removes nodes from the tree and unmounts them.

---

## 85. Completion Checklist

- [x] Can construct a JSX tree mentally before React renders it.
- [x] Distinguish visual position from logical entity identity.
- [x] Understand why index keys corrupt state in dynamic collections.
- [x] Know why random keys destroy component continuity.
- [x] Correctly attach keys to the top-level repeated sibling.
- [x] Use keyed Fragments for multi-node collection items.
- [x] Intentionally use `key` as a semantic state reset boundary.

---

## 86. Final Crucible — Full Render-by-Render Analysis

```javascript
function TodoList({ todos, filter }) {
  const visibleTodos = todos.filter(
    todo => filter === "all" || todo.status === filter
  );
  return (
    <section>
      {visibleTodos.map(todo => (
        <TodoRow key={todo.id} todo={todo} />
      ))}
    </section>
  );
}
```

- **Render #1 (`filter = "all"`, `[a, b, c]`):** `section ├── TodoRow(key=a) ├── TodoRow(key=b) └── TodoRow(key=c)`.
- **Render #2 (`filter = "open"`, `[a, c]`):** `section ├── TodoRow(key=a) └── TodoRow(key=c)` (`b` unmounts cleanly).
- **Render #3 (`[c, a, d]`):** `section ├── TodoRow(key=c) ├── TodoRow(key=a) └── TodoRow(key=d)` (`c` and `a` move; `d` mounts).

$$\mathbf{logical\ entity \longrightarrow stable\ key \longrightarrow React\ identity \longrightarrow state\ continuity \longrightarrow host\ realization}$$

---

## 87. The Senior Mental Model

```text
JSX SOURCE
    │
    ▼ JavaScript evaluation
    │
    ▼ React element tree
    │
 ┌────────────┴────────────┐
 │                         │
structure               identity
 │                         │
 ┌─────┼─────┐       ┌─────┼─────┐
 │     │     │       │     │     │
parent child sibling type key position
 │     │     │       │     │     │
 └─────┼─────┘       └─────┼─────┘
       │                   │
       ▼                   ▼
          reconciliation
                │
                ▼ Fiber
                │
                ▼ commit
                │
                ▼ DOM
```

---

## 88. Cross-Part Handoff

```text
Part 01: JSX Mental Model
   ↓
Part 02: React Elements
   ↓
Part 03: Expressions + Props + Children + Fragments
   ↓
Part 04: Trees + Identity + Conditional UI + Collections
   ↓
Part 05: Production JSX Patterns + Anti-Patterns
```

---

## 89. One-Minute Revision

```text
1. React reasons about trees.
2. JSX nesting creates tree topology.
3. Parent, child, and sibling relationships matter.
4. Visual position is not logical identity.
5. Keys identify logical siblings across renders.
6. Keys must be stable.
7. Keys must be unique among relevant siblings.
8. Index keys are dangerous when collections mutate.
9. Random keys destroy stable identity.
10. key is React metadata, not ordinary props.
11. Put the key on the actual repeated sibling unit.
12. Use keyed Fragments for grouped multi-node collection items.
13. Conditional rendering can change tree topology.
14. Hiding is not the same as removing from the tree.
15. Same type + changed props is different from type replacement.
16. Changing a key can intentionally reset component state.
17. Rerender ≠ remount.
18. React tree ≠ DOM tree.
19. Always reason: Render ──▶ evaluate JSX ──▶ construct tree ──▶ identify entities ──▶ reconcile ──▶ commit ──▶ DOM
20. The key question is: "What logical entity should this React instance represent?"
```

> **Senior-level conclusion:**  
> **"JSX does more than describe what the UI looks like. It defines a tree whose structure and identity become the foundation for React's reconciliation behavior. When dynamic data changes, stable identity—not visual position—is what allows stateful UI to remain attached to the correct logical entity."**

---

[⬅️ Previous Part: Expressions, Props, Children & Fragments](./03-conditional-rendering-fragments.md) | [📚 KPI 02 Index](./README.md) | [🧪 Companion Lab](./examples/04-jsx-trees-identity-conditional-collections.html) | [Next Part ➡️: Production Patterns & Anti-Patterns](./05-jsx-crucible-production-traps.md)
