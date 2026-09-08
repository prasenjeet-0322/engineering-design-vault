# Level 06 — React Fundamentals
# KPI 02 — JSX & React Elements
## PART 02 — React Elements — The Objects Created by JSX

[⬅️ Previous Part: JSX Mental Model](./01-jsx-compilation-mental-model.md) | [📚 KPI 02 Index](./README.md) | [🧪 Companion Lab](./examples/02-element-symbol-security-lab.html) | [Next Part ➡️: Expressions, Props, Children & Fragments](./03-conditional-rendering-fragments.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

# 0. Knowledge Contract

Part 01 established:

```text
JSX
 │
 ▼
JavaScript
 │
 ▼
React element description
 │
 ▼
React rendering
 │
 ▼
DOM
```

This Part goes one level deeper.

The central question is:
**What exactly is a React element?**

A React element is a JavaScript value that describes something React can render.

That distinction must remain permanent:

```text
React element ≠ React component ≠ DOM node ≠ HTML string
```

A useful conceptual model is:

```text
React Element
 │
 ├── type
 ├── props
 ├── key
 ├── ref
 └── React-owned metadata
```

The exact runtime object shape is an implementation detail and must not be treated as a public contract.
What matters architecturally is the information represented by the element.

---

# 1. 30-Second Executive Cheat Sheet

## 1.1 Core Model

```text
JSX
 │
 ▼
React element
┌─────────────┐
│    type     │
│    props    │
│     key     │
│     ref     │
│  metadata   │
└──────┬──────┘
       │
       ▼ React rendering
       │
       ▼ Component / Host output
       │
       ▼
      DOM
```

The React element is the description between source code and rendered host output.

---

# 2. Executive Concept Table

| Concept | Core Mechanism | Production Impact | Common Senior Trap |
| :--- | :--- | :--- | :--- |
| **React Element** | Immutable-ish JavaScript description of UI | Forms render output | Calling it a DOM node |
| **`type`** | Identifies host element or component | Determines what React should render | Assuming every type is a string |
| **`props`** | Inputs associated with the element | Carries configuration/data | Confusing element props with component state |
| **`children`** | Nested renderable content represented through props | Builds element trees | Treating children as a separate React primitive |
| **`key`** | Identity hint used among siblings | Enables stable list reconciliation | Thinking key is automatically a component prop |
| **`ref`** | Special mechanism for references to rendered instances/values | Enables imperative escape hatches | Treating ref like an ordinary prop |
| **Element object identity** | Identity of a JavaScript value in heap | Relevant to memoization and debugging | Equating it with DOM identity |
| **Element tree** | Nested React element descriptions | Represents render output | Calling it the committed DOM |
| **Component element** | Element whose type is a component | Initiates component rendering | Confusing element with component |
| **Host element** | Element whose type identifies a host environment type | Eventually maps to host output | Assuming React elements are browser nodes |

---

# 3. Golden Rule

> **"A React element is a description, not the thing being described."**

For:

```jsx
<button className="primary">
  Save
</button>
```

the React element describes:

```text
type → button
props → className = "primary" → children = "Save"
```

It is not `HTMLButtonElement`, and it is not `"button HTML source"`.

Think:

```text
React element ──▶ "Here is what React should render."
```

---

# 4. Why React Needs Elements

React needs a representation of UI that can exist independently of the DOM.
If React's render output were immediately tied to DOM nodes, it would be much harder to reason about rendering abstractly.

Instead:

```text
Component
   ↓
React elements
   ↓
React rendering system
   ↓
Host renderer
```

The element gives React a structured representation it can compare, process, and interpret.
This is one of the foundational abstractions behind React's declarative model.

---

# 5. Element vs Component

This distinction must be automatic.

Consider:

```javascript
function Button() {
  return <button>Save</button>;
}
```

Here `Button` is a component definition.

Now:

```javascript
const element = <Button />;
```

Here `element` is a React element.

Conceptually:

```text
Button
 │
 └── component type/function

<Button />
 │
 └── React element
      ├── type ──▶ Button
      └── props ──▶ ...
```

Therefore:
- **Component** = something React can render/invoke
- **Element** = value describing a renderable thing

---

# 6. Element vs DOM Node

Consider:

```javascript
const element = <button>Save</button>;
```

The variable `element` is not the browser's button node.
After rendering, the browser may contain `HTMLButtonElement`.
These belong to completely different layers:

```text
JavaScript heap
 │
 └── React element
      │
      │ React rendering
      ▼
Browser environment
 │
 └── DOM node
```

The relationship is:

```text
description ──▶ rendering ──▶ host instance
not:
element === DOM node
```

---

# 7. Element Anatomy

Consider:

```jsx
const element = (
  <button className="primary" disabled={false}>
    Save
  </button>
);
```

Conceptually:

```text
React Element
 │
 ├── type
 │    └── "button"
 │
 ├── props
 │    ├── className ──▶ "primary"
 │    ├── disabled  ──▶ false
 │    └── children  ──▶ "Save"
 │
 ├── key
 ├── ref
 └── React metadata
```

Do not assume the exact property names or internal fields beyond the public conceptual model.
The important point is that the element contains enough information for React to understand what it represents.

---

# 8. `type`

The `type` identifies what kind of thing the element represents.

- For `<div />`, the conceptual type is `"div"`.
- For `<Button />`, the type is conceptually `Button`.
- For `<UserProfile />`, the type is `UserProfile`.

So:
- **Host element:** `type` $\to$ string/intrinsic host identifier
- **Component element:** `type` $\to$ component type/value

This is one of the most important differences between `<div />` and:

```jsx
<div>
  <Button />
</div>
```

The outer element has a host type; the nested element has a component type.

---

# 9. `type` Determines the Rendering Path

Consider:
`<div />`
React sees conceptually: `type = "div"`. This represents a host element.

Now:
`<Button />`
Conceptually: `type = Button`. React recognizes that the type represents a component.

The rendering path becomes different:

```text
<div />    ──▶ host element processing
versus:
<Button /> ──▶ render Button component ──▶ process Button's returned elements
```

Therefore `type` is not merely descriptive metadata. It participates in determining how React interprets the element.

---

# 10. `props`

Props contain the inputs associated with an element.

Example:

```jsx
<Button variant="primary" disabled={true} />
```

Conceptually:

```text
element
 │
 ├── type ──▶ Button
 │
 └── props
      ├── variant  ──▶ "primary"
      └── disabled ──▶ true
```

If the element represents a component, those props become the component's inputs:

```javascript
function Button({ variant, disabled }) {
  // receives the values represented by the element's props
}
```

---

# 11. Props Are Not State

This distinction is essential:
- **Props** = input supplied from outside the component
- **State** = component-owned render data

For:

```jsx
<Button disabled={isDisabled} />
```

the element contains `props.disabled`. That does not mean the `Button` owns that value.

Conceptually:

```text
Parent
  │
  │ prop
  ▼
Button element
  │
  ▼
Button component
```

---

# 12. Children Are Props

Consider:

```jsx
<Card>
  <h2>Dashboard</h2>
</Card>
```

The nested JSX contributes to the `children` prop:

```text
Card element
 │
 ├── type ──▶ Card
 └── props
      └── children
           └── h2 element
```

Therefore:
`<Card> ... </Card>` is conceptually related to `<Card children={...} />`.

---

# 13. Key Is Special

Consider:

```jsx
items.map(item => (
  <Item key={item.id} item={item} />
))
```

The `key` participates in React's reconciliation of sibling elements. It is not simply another ordinary application prop.

This distinction matters:
`<Item key={item.id} item={item} />` does not mean the component receives `props.key` as an ordinary application value.

Instead:

```text
key  ──▶ React reconciliation identity information
item ──▶ component prop
```

---

# 14. Ref Is Also Special

Similarly:

```jsx
<Input ref={inputRef} />
```

does not mean `ref` is an ordinary props field. `ref` participates in React's reference mechanism.

For this Part:
- **props** = ordinary element inputs
- **key / ref** = special React mechanisms

---

# 15. Element Trees

React elements naturally form trees:

```jsx
<App>
  <Header />
  <Main>
    <Sidebar />
    <Content />
  </Main>
</App>
```

Conceptually:

```text
App element
 │
 ├── Header element
 └── Main element
      ├── Sidebar element
      └── Content element
```

This is an element tree. It is not necessarily the same as the DOM tree (e.g., `App` and `Main` may represent components while the eventual DOM contains only host nodes).

---

# 16. Component Elements Expand Into More Elements

Consider:

```javascript
function App() {
  return (
    <main>
      <h1>Dashboard</h1>
    </main>
  );
}
```

and `<App />`.

The initial element is `App element`.
React renders the component. The component returns `main element └── h1 element`.

Conceptually:

```text
<App />
   │
   ▼ App component execution
   │
   ▼
<main>
  <h1>Dashboard</h1>
</main>
```

This is why a React element tree may contain component elements that eventually resolve into host elements.

---

# 17. Render Output Is a Value

Consider:

```javascript
function App() {
  return <h1>Hello</h1>;
}
```

The return value is a React element.
`App()` $\to$ React element. That value can participate in larger structures:

```javascript
function Layout() {
  return (
    <main>
      <App />
    </main>
  );
}
```

The element returned from `App` becomes part of the larger rendering process. This is a major reason React's model is compositional.

---

# 18. React Elements Are Descriptions

A powerful analogy:

```text
Blueprint ≠ Building
Similarly:
React element ≠ DOM node
```

The element describes:
- type
- properties
- children
- identity information

React uses the description to produce the appropriate host result.

$$\mathbf{React\ Element = UI\ Description}$$

---

# 19. Element Immutability

React elements should be treated as immutable values:

```javascript
// ❌ Anti-pattern: Never mutate element objects
const element = <Button />;
element.props.disabled = true;
```

Instead, produce another element:

```javascript
const element = <Button disabled={true} />;
```

or render based on changing application data.

The model is:

```text
Old description ──▶ New description
not:
Mutate old description in place
```

---

# 20. Why Immutability Matters

Suppose:
```javascript
const first = <Button disabled={false} />;
```
Later:
```javascript
const second = <Button disabled={true} />;
```

You now have:
- `first` $\to$ description A
- `second` $\to$ description B

React can reason about the transition between render outputs:

```text
previous UI description ──▶ new UI description ──▶ determine required changes
```

---

# 21. Element Object Identity

Consider:

```javascript
const a = <div />;
const b = <div />;
```

Do not assume `a === b`. The two evaluations produce separate JavaScript values in heap memory:

```text
a ──▶ element object A
b ──▶ element object B
```

Therefore: `a !== b` is the expected mental model.
But this does not imply `DOM A !== DOM B`. That conclusion would confuse element identity with host identity.

---

# 22. Three Different Identities

You must distinguish:
1. **JavaScript object identity** (heap memory address)
2. **React reconciliation identity** (`type` + `key`)
3. **DOM node identity** (host C++ object reference)

Example:

```text
Render #1: React element A ──▶ DOM node X
Render #2: React element B ──▶ same DOM node X
```

Possible outcome: **`A !== B` but DOM `X` remains the exact same node.**

---

# 23. Element Identity Is Not Visual Identity

Two separate React elements can represent equivalent output:

```javascript
const a = <h1>Hello</h1>;
const b = <h1>Hello</h1>;
```

They can be different JavaScript objects (`a !== b`) while describing equivalent UI (`h1 └── "Hello"`).

$$\mathbf{Object\ Identity \neq Rendered\ Visual\ Identity}$$

---

# 24. Element Equality Is Not a General UI Equality Algorithm

Do not write application architecture around:

```javascript
if (oldElement === newElement) {
  // UI is unchanged
}
```

That is generally the wrong abstraction. React's rendering system has its own rules for determining what work is required based on structure, keys, and reconciliation.

---

# 25. Element Type Stability

Consider:
```javascript
return <div>Dashboard</div>;
```
and later:
```javascript
return <div>Settings</div>;
```

The type remains `"div"` while props/children change:
- Previous: `type → "div"`, `children → "Dashboard"`
- Next: `type → "div"`, `children → "Settings"`

React reconciles the same structural host element while updating its content.

Now consider:
```javascript
return <div />;
```
versus:
```javascript
return <section />;
```

The type changes: `"div" → "section"`. That fundamentally changes reconciliation, tearing down the previous subtree.

---

# 26. Component Type Stability

Similarly:
`return <UserCard />;` versus `return <AdminCard />;` changes the element type (`UserCard → AdminCard`).

This is not equivalent to `<UserCard variant="admin" />` because the component type itself is different, causing state teardown.

---

# 27. Element Creation vs Rendering

Consider:
```javascript
const element = <Dashboard />;
```

There are two different events to distinguish:

1. **Event 1 — Element creation/evaluation:**
   `JSX ──▶ React element value`
2. **Event 2 — React rendering:**
   `element ──▶ React render process ──▶ host output`

Do not collapse these into one event. A React element can exist as a JavaScript value without being mounted anywhere.

---

# 28. Example: Element as a Variable

```javascript
const header = <Header />;

function App() {
  return (
    <main>
      {header}
    </main>
  );
}
```

The variable `header` contains a React element. It can participate in another element tree:

```text
header ──▶ Header element ──▶ child of main element
```

---

# 29. Example: Returning an Element

```javascript
function Greeting() {
  return <h1>Hello</h1>;
}
```

The function returns a React element, not a DOM node. React consumes the return value as part of rendering.

---

# 30. Example: Passing an Element as a Value

```jsx
const icon = <SearchIcon />;

function Button() {
  return (
    <button>
      {icon} Search
    </button>
  );
}
```

Here `icon` is a React element value. It becomes part of the `Button`'s returned element tree, proving that **React elements are composable values.**

---

# 31. Element vs JSX Syntax

```text
<Button />           ──▶ Source syntax
React element object ──▶ Runtime value produced after evaluation
```

Think:
$$\text{Source representation} \longrightarrow \text{Runtime representation}$$

---

# 32. JSX Transformation Model

Conceptually:

```javascript
const element = <Button disabled={true} />;
```

becomes something conceptually equivalent to:

```javascript
const element = jsx(Button, { disabled: true });
```

The invariant is:

```text
JSX ──▶ JavaScript ──▶ React element
```

---

# 33. Why the Exact Internal Object Should Not Be Memorized

You may inspect React elements in development tools and see fields that look roughly like:

```javascript
{
  $$typeof: Symbol.for('react.element'),
  type,
  key,
  ref,
  props,
  _owner,
  ...
}
```

Do not build production logic around undocumented internals.
The stable conceptual contract is: **an element is a description containing `type`, `props`, and React-specific metadata.**

---

# 34. React Element as a Read-Only Description

Think of this:

```javascript
const button = <Button variant="primary" disabled={false} />;
```

as: *"Button should be rendered with these inputs."*
It is not: *"Here is the Button instance."*

Functional components do not create mutable component instances. The element describes a renderable component type and its inputs.

---

# 35. Prediction-First Walkthrough — Render #1

Consider:

```javascript
function Greeting({ name }) {
  return <h1>Hello {name}</h1>;
}

function App() {
  return <Greeting name="Sunny" />;
}
```

### Render #1:
1. React evaluates `<App />`.
2. `App` executes and returns `<Greeting name="Sunny" />`.
3. `Greeting` executes and returns `<h1>Hello Sunny</h1>`.
4. Final element structure: `h1 └── "Hello Sunny"`.
5. React commits DOM: `<h1>Hello Sunny</h1>`.

---

# 36. Render #2

Suppose `App` now returns `<Greeting name="Alex" />`.

- New `Greeting` element: `props.name = "Alex"`.
- `Greeting` executes, producing `h1 └── "Hello Alex"`.
- React compares previous (`h1 └── "Hello Sunny"`) and next (`h1 └── "Hello Alex"`).
- Type remains `"h1"`. Text changes `"Hello Sunny" → "Hello Alex"`.
- Host update: in-place text update on existing DOM node.

---

# 37. Render #3

`App` renders `<Greeting name="Alex" />` again.
A new element object is allocated in heap memory, but the semantic output remains identical.
Result: **no DOM mutation required.**

$$\mathbf{New\ Render\ Output \neq New\ DOM\ Node}$$

---

# 38. Fiber Relationship

At a high level:
- **React Element** = render output description (ephemeral, garbage-collected).
- **Fiber** = React's internal persistent node tracking state, hooks, and reconciliation work.

```text
Element
   │
   ▼ consumed by
Fiber work
   │
   ▼ Commit
   │
   ▼
Host DOM
```

---

# 39. Element vs Fiber vs DOM

| Layer | Memory Space | Purpose |
| :--- | :--- | :--- |
| **React Element** | JavaScript V8 Heap | "What should be rendered" (ephemeral descriptor) |
| **Fiber** | JavaScript V8 Heap (Engine internal) | "React's internal representation of rendering work/state" |
| **Host Instance** | Browser C++ (Blink/WebKit) | "Actual DOM node on the screen" |

---

# 40. Production Anti-Pattern #1 — Mutating Element Props

### Flawed
```javascript
const element = <Button disabled={false} />;
element.props.disabled = true; // ❌ TypeError / Reconciliation desync
```

### Why developers do it
They assume the element is a live mutable UI controller.

### Senior refactoring
Produce the desired element from application data:
```javascript
const element = <Button disabled={isDisabled} />;
```

---

# 41. Production Anti-Pattern #2 — Using Elements as DOM Nodes

### Flawed
```javascript
const button = <button>Save</button>;
button.focus(); // ❌ TypeError: button.focus is not a function
```

### Senior refactoring
Use React's `ref` mechanism (`useRef`) to access the underlying DOM node after mounting.

---

# 42. Production Anti-Pattern #3 — Passing `key` as Application Data

### Flawed assumption
```jsx
<Item key={item.id} name={item.name} />
```
and then:
```javascript
function Item(props) {
  console.log(props.key); // ❌ undefined (React strips key from props)
}
```

### Correct pattern
```jsx
<Item key={item.id} id={item.id} name={item.name} />
```

---

# 43. Production Anti-Pattern #4 — Comparing Elements to Detect UI Equality

### Flawed
```javascript
if (previousElement === nextElement) {
  // UI definitely unchanged
}
```

### Senior approach
Two separately created element objects will fail reference equality (`!==`) even when representing identical UI. Rely on React's reconciliation model or explicit `React.memo` prop comparisons.

---

# 44. Production Anti-Pattern #5 — Treating Elements as Component Instances

### Flawed
```javascript
const userCard = <UserCard />; // "Now I have a UserCard instance"
```

### Correct model
`UserCard` is a component type; `<UserCard />` is an element describing that type.

---

# 45. Production Anti-Pattern #6 — Inspecting Internal Element Fields in Application Logic

### Flawed
```javascript
if (element._owner || element._store) { ... }
```

### Senior rule
Treat internal fields as private implementation details. Build production architecture strictly on public APIs.

---

# 46. Production Anti-Pattern #7 — Assuming New Element Means New DOM

### Flawed reasoning
Component renders $\to$ JSX creates new element $\to$ DOM node is recreated.

### Correct model
New element description $\to$ Reconciliation $\to$ in-place DOM mutation or preservation.

---

# 47. Production Anti-Pattern #8 — Using `key` as a Generic Identifier

`key` primarily participates in React's identity and reconciliation semantics within the relevant sibling set. Keys are sibling-scoped reconciliation hints, not global database IDs.

---

# 48. Prediction Lab — `type`

```javascript
function Button() {
  return <button>Save</button>;
}

const a = <button />;
const b = <Button />;
```

- `a.type` $\to$ `"button"` (string host type)
- `b.type` $\to$ `Button` (component function reference)

---

# 49. Prediction Lab — Props

```javascript
const element = <Button size="large" disabled={true} />;
```

`element.props` $\to$ `{ size: "large", disabled: true }`.

---

# 50. Prediction Lab — Children

```javascript
const element = <Card>Hello</Card>;
```

- `element.type` $\to$ `Card`
- `element.props.children` $\to$ `"Hello"`

---

# 51. Prediction Lab — Nested Element

```javascript
const element = (
  <Card>
    <Button>Save</Button>
  </Card>
);
```

- `element.type` $\to$ `Card`
- `element.props.children.type` $\to$ `Button`
- `element.props.children.props.children` $\to$ `"Save"`

---

# 52. Prediction Lab — New Object, Same Description

```javascript
const a = <h1>Hello</h1>;
const b = <h1>Hello</h1>;
```

`a === b` $\to$ `false`. Structurally equivalent descriptions with distinct heap addresses.

---

# 53. Prediction Lab — Different Type

```javascript
const a = <div>Hello</div>;
const b = <span>Hello</span>;
```

`a.type` (`"div"`) $\neq$ `b.type` (`"span"`). Different host types trigger full node replacement.

---

# 54. Prediction Lab — Component Element

```javascript
function Profile() {
  return <section>Profile</section>;
}
const element = <Profile />;
```

`element.type` $\to$ `Profile` (not `"Profile"` and not `"section"`).

---

# 55. Prediction Lab — Component Expansion

```text
element ──▶ type = Profile ──▶ React renders Profile ──▶ returns section element ──▶ type = "section"
```

---

# 56. Diagnostic Lab — Inspecting Element Values

```javascript
function Demo() {
  const element = (
    <Button size="large" disabled={false}>
      Save
    </Button>
  );
  console.log(element);
  return null;
}
```

Console inspects: `{ $$typeof, type: Button, props: { size: "large", disabled: false, children: "Save" }, key: null, ref: null }`.

---

# 57. Diagnostic Lab — Compare Two Elements

```javascript
function Demo() {
  const first = <div>Hello</div>;
  const second = <div>Hello</div>;
  console.table({
    sameReference: first === second,
    firstType: first.type,
    secondType: second.type
  });
  return null;
}
```

- `sameReference` $\to$ `false`
- `firstType` $\to$ `"div"`
- `secondType` $\to$ `"div"`

---

# 58. Diagnostic Lab — Component Element

```javascript
function Button() {
  return <button>Save</button>;
}

function Demo() {
  const element = <Button />;
  console.table({
    elementType: typeof element,
    componentType: typeof Button
  });
  return null;
}
```

- `componentType` $\to$ `"function"`
- `elementType` $\to$ `"object"`

---

# 59. Diagnostic Lab — DOM vs Element

Compare:

```javascript
function Demo() {
  const element = <button>Save</button>;
  console.log("React element:", element);
  return element;
}
```

Inspect Elements tab vs Console: V8 element descriptor vs Blink C++ DOM node.

---

# 60. Diagnostic Lab — React DevTools

- **Components panel:** Inspects React element and component hierarchy.
- **Elements panel:** Inspects browser DOM representation.

---

# 61. Master Execution Timeline

```text
Trigger
   ↓
React begins rendering
   ↓
App executes
   ↓
JSX evaluates: <Button disabled={true} />
   ↓
React element created
   ↓
React processes Button element
   ↓
Button executes
   ↓
Button produces host element: <button disabled={true} />
   ↓
React reconciles output
   ↓
Commit phase
   ↓
DOM updates if necessary
   ↓
Browser rendering
```

---

# 62. Render #1 — Full Mechanical Trace

```javascript
function Button({ label }) {
  return <button>{label}</button>;
}
function App() {
  return <Button label="Save" />;
}
```

1. **App Input:** `<App />` (`type: App`).
2. **App Execution:** returns `<Button label="Save" />` (`type: Button, props: { label: "Save" }`).
3. **Button Execution:** returns `<button>Save</button>` (`type: "button", props: { children: "Save" }`).
4. **Commit:** React produces host DOM `<button>Save</button>`.

---

# 63. Render #2 — Prop Change

Parent renders `<Button label="Submit" />`.
- New element: `type: Button, props: { label: "Submit" }`.
- Button executes: returns `button └── "Submit"`.
- Reconciliation: Host type `"button"` matches. Text updated `"Save" → "Submit"`.

---

# 64. Render #3 — Same Props

Parent renders `<Button label="Submit" />` again.
- New element object allocated in heap.
- Semantic output identical.
- Reconciliation: No DOM mutations required.

---

# 65. Element Trees and Conditional Rendering

```javascript
function App({ loggedIn }) {
  return loggedIn ? <Dashboard /> : <Login />;
}
```

- `loggedIn = false` $\to$ `type: Login`
- `loggedIn = true` $\to$ `type: Dashboard`
- Type change triggers complete subtree unmount and recreation.

---

# 66. Element Trees and Lists

```javascript
const elements = users.map(user => (
  <UserCard key={user.id} user={user} />
));
```

```text
Array
 ├── UserCard element (key: "user-1")
 ├── UserCard element (key: "user-2")
 └── UserCard element (key: "user-3")
```

---

# 67. Why Keys Exist

Without keys, React reconciles siblings by array index. With stable keys:

```text
Previous: [A, B, C]
New:      [X, A, B, C]

Reconciler matches A ➔ A, B ➔ B, C ➔ C and only inserts X.
```

---

# 68. Element Identity and Keys

- **Element object identity:** Is this the same JavaScript object reference?
- **React identity (`type` + `key`):** Which previous child corresponds to this new child?
- **DOM identity:** Is the browser host node being preserved?

---

# 69. Senior Debugging Model

When a UI behaves unexpectedly, ask in this order:
1. What element did the component render?
2. What is its `type`?
3. What `props` did it receive?
4. What `children` did it produce?
5. What `key` / identity information exists?
6. What did React reconcile?
7. What host DOM changed?

---

# 70. Production Decision Matrix

| Need | Correct Concept |
| :--- | :--- |
| Describe a button | React element |
| Define reusable button behavior | Component |
| Access actual browser button | DOM / ref |
| Pass configuration to component | Props |
| Provide nested UI | Children |
| Identify list item among siblings | Key |
| Describe host element | Host element type string (`"div"`) |
| Describe component | Component element reference (`Button`) |
| Represent render output | Element tree |
| Track React's rendering work | Fiber / internal engine |
| Modify actual DOM directly | Host APIs / ref-based escape hatch |

---

# 71. Senior Interview Gotchas

1. **What is a React element?** A plain JavaScript value describing what React should render.
2. **Is a React element a component?** No. Component is a function/class; element is a description returned by it.
3. **Is a React element a DOM node?** No. Element is a V8 object; DOM node is a browser host object.
4. **Does every React element have a string type?** No. Host elements have string types (`"div"`); components have function/class references (`Button`).
5. **Is `key` just another prop?** No. It is stripped from `props` and consumed by the reconciler.
6. **If two React elements are different objects, must React create two DOM nodes?** No. Reconciliation preserves DOM nodes across distinct element allocations.
7. **Can I mutate an element's props?** No. React elements are frozen/immutable.
8. **Can I use React element internals in application logic?** No. Private internals (`_owner`, `_store`) are not stable public APIs.

---

# 72. Senior Architecture Principle

```text
Application state/data
   ↓
Component inputs
   ↓
Component execution
   ↓
┌────────────────────┐
│ React Element Tree │
└────────────────────┘
   ↓
Reconciliation
   ↓
Host representation
   ↓
Browser rendering
```

---

# 73. Anti-Confusion Table

| If you hear... | Translate it to... |
| :--- | :--- |
| “JSX” | Source syntax |
| “Element” | React element value in heap |
| “Component” | Renderable component function/class |
| “DOM node” | Browser host C++ object |
| “Fiber” | React internal state/work node |
| “Props” | Inputs represented on an element |
| “Children” | Nested renderable content represented through props |
| “Key” | Sibling reconciliation identity hint |
| “Render” | Produce/process React render output |
| “Commit” | Apply required host changes |

---

# 74. The Most Important Distinction in This Part

```javascript
function Profile() {
  return <section>Profile</section>;
}
const element = <Profile />;
```

- `Profile` $\to$ Component
- `<Profile />` $\to$ React element describing `Profile`
- `<section>Profile</section>` $\to$ React element returned by `Profile`
- `<section>...</section>` in browser $\to$ DOM node

---

# 75. Production Scenario — Modal System

```jsx
const modal = (
  <Modal title="Delete account" open={true}>
    <ConfirmDelete />
  </Modal>
);
```

```text
Modal element
 ├── type ──▶ Modal
 └── props
      ├── title ──▶ "Delete account"
      ├── open  ──▶ true
      └── children ──▶ ConfirmDelete element
```

---

# 76. Production Scenario — Table Rows

```jsx
<tbody>
  {users.map(user => (
    <tr key={user.id}>
      <td>{user.name}</td>
    </tr>
  ))}
</tbody>
```

```text
tbody
 ├── tr (key="user-1") ──▶ td ──▶ "Alice"
 ├── tr (key="user-2") ──▶ td ──▶ "Bob"
 └── tr (key="user-3") ──▶ td ──▶ "Charlie"
```

---

# 77. Production Scenario — Layout Components

```jsx
<Layout>
  <Header />
  <Sidebar />
  <Content />
</Layout>
```

`Layout` receives elements as `props.children` and arranges them without tight coupling.

---

# 78. Production Scenario — Element as Configuration

```jsx
const icon = <SearchIcon size={16} />;
<Button icon={icon}>Search</Button>
```

Elements are first-class JavaScript values that can be passed through arbitrary prop slots.

---

# 79. Element Values Can Be Stored

```javascript
const emptyState = <EmptyState message="No users found" />;

return (
  <section>
    {emptyState}
  </section>
);
```

---

# 80. Element vs Component Reference

```javascript
const Component = UserCard; // Component reference (Function)
const element = <UserCard />; // React element value (Object)
```

- `Component` $\to$ *"which component?"*
- `element` $\to$ *"render this component with these inputs."*

---

# 81. Diagnostic Exercise — Build the Element Tree

```jsx
<App>
  <Header title="Dashboard" />
  <Main>
    <Sidebar />
    <Content />
  </Main>
</App>
```

```text
App
 └── children
      ├── Header (props.title = "Dashboard")
      └── Main
           ├── Sidebar
           └── Content
```

---

# 82. Diagnostic Exercise — Separate Every Layer

```javascript
function Card() {
  return <article>Dashboard</article>;
}
const element = <Card />;
```

- `Card` $\to$ Component
- `<Card />` $\to$ React element
- `<article>Dashboard</article>` $\to$ React element returned by Card
- Actual `<article>` in browser $\to$ DOM host object

---

# 83. What React Elements Give React

- **What?** $\to$ `type`
- **With what inputs?** $\to$ `props`
- **Which sibling identity?** $\to$ `key`
- **Special reference?** $\to$ `ref`
- **What nested content?** $\to$ `children` within `props`

$$\mathbf{Element = Render\ Description}$$

---

# 84. What React Elements Do NOT Give You

A React element is **NOT**:
- ❌ a DOM node
- ❌ a mounted component instance
- ❌ a live mutable UI object
- ❌ an HTML string
- ❌ a Fiber
- ❌ a browser layout object
- ❌ a painted pixel representation

---

# 85. Master Mental Model

```text
COMPONENT
   │
   │ executes
   ▼
JSX / return
   │
   ▼
┌───────────────┐
│ React Element │
├───────────────┤
│     type      │
│     props     │
│   children    │
│      key      │
│      ref      │
└───────┬───────┘
        │
        ▼ React rendering
        │
        ▼ Reconciliation
        │
        ▼ Commit
        │
        ▼
    DOM / Host
```

---

# 86. Completion Checklist

- [x] Can define a React element precisely as an immutable JavaScript value.
- [x] Distinguish element from HTML, DOM node, Component, and Fiber.
- [x] Understand the conceptual roles of `type`, `props`, `children`, `key`, and `ref`.
- [x] Predict `a.type` for `<button />` (`"button"`) vs `<Button />` (`Button`).
- [x] Understand why `key` is stripped from `props`.
- [x] Distinguish JavaScript object identity from DOM node identity.
- [x] Explain why mutating `element.props` is a mechanical failure.

---

# 87. Final Crucible

1. `const a = <div />;` $\to$ React element value.
2. `function Button() { return <button>Save</button>; } const a = <Button />;`
   - `a` $\to$ React element
   - `Button` $\to$ Component function
   - `a.type` $\to$ `Button`
3. `const a = <div>Hello</div>; const b = <div>Hello</div>;`
   - `a === b` $\to$ `false` (Different heap addresses, identical DOM representation).
4. `<Item key={item.id} id={item.id} />`
   - `key` $\to$ React reconciliation
   - `id` $\to$ Application logic
5. Trace `x = <Card />` $\to$ `Card` executes $\to$ returns `<article>` element $\to$ React commits DOM `<article>`.
6. Two renders produce separate element objects $A$ and $B$; the same DOM button remains mounted via reconciliation.

---

# 88. Part Graduation Test

```text
┌───────────────────────┐
│ Component Definition  │
└───────────┬───────────┘
            │
            ▼ Component executes
            │
            ▼
┌───────────────────────┐
│  React Element Tree   │
│                       │
│         type          │
│         props         │
│       children        │
│   key/ref metadata    │
└───────────┬───────────┘
            │
            ▼ Reconciliation
            │
            ▼ Commit
            │
            ▼
┌───────────────────────┐
│  Browser DOM / Host   │
└───────────────────────┘
```

---

# 89. Cross-Part Handoff

```text
PART 01: JSX mental model
   ↓
PART 02: React element representation
   ↓
PART 03: Expressions + Props + Children + Fragments
   ↓
PART 04: Trees + Conditional UI + Dynamic Collections + Identity
   ↓
PART 05: Production JSX Patterns + Anti-Patterns
```

---

# 90. Final One-Minute Revision

```text
React Element
 │
 ├── JavaScript value in heap
 ├── Describes something React can render
 ├── Has a conceptual type:
 │    ├── "div"  ──▶ host intrinsic string
 │    └── Button ──▶ component reference
 ├── Has props (inputs & children)
 ├── Has special React metadata (key, ref)
 ├── Is NOT a DOM node, component, or Fiber
 ├── Should be treated as immutable
 └── Participates in:
      element tree ──▶ reconciliation ──▶ commit ──▶ host DOM
```

> **Final Golden Rule:**  
> **"Do not think 'this JSX is the DOM.' Think 'this JSX evaluates to a React element describing the UI that React should render.'"**

---

[⬅️ Previous Part: JSX Mental Model](./01-jsx-compilation-mental-model.md) | [📚 KPI 02 Index](./README.md) | [🧪 Companion Lab](./examples/02-element-symbol-security-lab.html) | [Next Part ➡️: Expressions, Props, Children & Fragments](./03-conditional-rendering-fragments.md)
