# Level 06 — React Fundamentals
# KPI 02 — JSX & React Elements
## PART 03 — JSX Expressions, Props, Children & Fragments

[⬅️ Previous Part: React Elements](./02-element-objects-immutability.md) | [📚 KPI 02 Index](./README.md) | [🧪 Companion Lab](./examples/03-jsx-expressions-props-children-fragments.html) | [Next Part ➡️: Conditional UI, Lists & Element Identity](./04-lists-and-keys-foundations.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

# Knowledge Contract

By the end of this Part, you must be able to reason mechanically about:
- what a JSX expression actually represents
- where JavaScript ends and JSX syntax begins
- how `{...}` changes JSX from static structure into dynamic structure
- how expressions become element props
- how JSX children are represented
- why text, numbers, elements, arrays, and null behave differently as children
- how children reaches a component
- why children is a prop rather than a special second argument
- how nested JSX becomes nested element objects
- how fragments group elements without introducing a host DOM node
- the difference between `<>...</>` and `<React.Fragment>...</React.Fragment>`
- when a keyed fragment is required
- how conditional expressions produce different element descriptions
- why 0, false, null, undefined, and "" must not be treated as equivalent
- how dynamic lists become arrays of React elements
- why JavaScript array behavior matters to JSX rendering
- how object identity, element identity, key identity, and DOM identity differ
- how to predict the resulting React element tree before React renders it
- how to diagnose incorrect JSX caused by truthiness, children, array, or fragment mistakes
- how production component APIs use children deliberately rather than accidentally

This Part assumes JavaScript fundamentals from the earlier JavaScript curriculum and the React mental model established in KPI 01.
It does not reteach JavaScript syntax generally.

---

# LAYER 1 — ⚡ 30-SECOND EXECUTIVE CHEAT SHEET

## 1. The Core Mental Model

JSX is best understood as a structured way of writing JavaScript expressions that produce React element descriptions.

```text
JavaScript data
       │
       ▼
JSX expressions
       │
       ▼
React element objects
       │
       ▼
Element tree
       │
       ▼
React rendering process
       │
       ▼
    DOM / UI
```

The critical distinction:

```text
JSX source ≠ React element ≠ Fiber ≠ DOM node
```

Conceptually:

```text
JSX
 │
 │ evaluated / transformed
 ▼
React element description
 │
 │ consumed by React
 ▼
Fiber representation
 │
 │ commit
 ▼
DOM
```

---

## 2. The Most Important Rule

Anything inside `{}` in JSX is a JavaScript expression whose resulting value becomes part of the React element description.

Example:

```jsx
const name = "Srikar";
<h1>Hello {name}</h1>
```

Conceptually:

```javascript
React.createElement(
  "h1",
  null,
  "Hello ",
  name
);
```

The JSX is not storing the variable name as some magical JSX object.
The JavaScript expression is evaluated and its resulting value participates in creating the element.

---

## 3. Executive Concept Table

| Concept | Core Mechanism | Production Impact | Common Senior Trap |
| :--- | :--- | :--- | :--- |
| **JSX expression** | JavaScript expression embedded in JSX | Dynamic UI | Treating `{}` as template interpolation |
| **`{value}`** | Evaluates JavaScript expression | Data enters UI structure | Assuming every value becomes visible text |
| **Props** | Input fields attached to element description | Component configuration/data flow | Confusing props with DOM attributes |
| **`children`** | Nested JSX becomes a child prop | Composition API | Treating `children` as a separate rendering mechanism |
| **Text child** | String/number child | Visible text | Forgetting number rendering semantics |
| **Element child** | React element nested inside another | Component composition | Confusing element object with rendered DOM |
| **Array child** | Multiple children represented as array | Lists and dynamic composition | Ignoring keys |
| **`null`** | No rendered child | Conditional UI | Assuming it creates a DOM node |
| **`false`** | Generally no rendered child | Conditional rendering | Using truthiness without considering `0` |
| **Fragment** | Groups children without host DOM node | DOM-neutral composition | Using wrapper `<div>` unnecessarily |
| **Short fragment** | `<>...</>` | Convenient grouping | Forgetting it cannot carry a key |
| **Explicit fragment** | `<Fragment key="...">` | Keyed grouping | Thinking all fragments support keys |
| **Child order** | Position in children sequence | Reconciliation | Assuming visual similarity means same identity |
| **Expression result** | Runtime value inserted into element structure | Dynamic rendering | Predicting from source instead of evaluated value |

---

## 4. Golden Rule

> **JSX describes structure; JavaScript expressions supply the runtime values that populate that structure.**

And for children:

> **`children` is ordinary React element input whose value happens to come from nested JSX or explicit children arguments.**

---

# LAYER 2 — 🔬 DEEP MECHANICAL BREAKDOWN

## 5. Why JSX Expressions Exist

A static JSX tree is insufficient for real applications.

This:

```jsx
<h1>Dashboard</h1>
```

always describes the same conceptual element:

```text
type = "h1"
props = { children: "Dashboard" }
```

Real interfaces require runtime data:

```jsx
<h1>{user.name}</h1>
```

Now the element description depends on JavaScript state/data.

For example:

```javascript
user = { name: "Srikar" }
```

produces conceptually:

```javascript
{ type: "h1", props: { children: "Srikar" } }
```

If:

```javascript
user = { name: "Alex" }
```

the resulting element description changes:

```javascript
{ type: "h1", props: { children: "Alex" } }
```

The JSX source itself did not change.
The evaluated JavaScript data changed.
That distinction is fundamental.

---

## 6. JSX Is Not Template Interpolation

A common mental model is:

```text
JSX = HTML template + ${variables}
```

That model is insufficient.

In a string template:

```javascript
`Hello ${name}`
```

the result is a string.

In JSX:

```jsx
<h1>Hello {name}</h1>
```

the expression participates in constructing a React element.

Conceptually:

```text
"h1"
 │
 ├── props
 │    │
 │    └── children
 │         ├── "Hello "
 │         └── name
 │
 ▼
React element description
```

The output is not merely:
`"Hello Srikar"`

It is structurally closer to:

```text
Element
 └── type: "h1"
     props
      └── children
           ├── "Hello "
           └── "Srikar"
```

---

## 7. What Counts as a JSX Expression?

Examples:

```jsx
{name}
{user.name}
{count + 1}
{isLoggedIn ? <Dashboard /> : <Login />}
{items.map(item => <Item key={item.id} item={item} />)}
{getDisplayName(user)}
{condition && <Banner />}
```

All of these are JavaScript expressions.
The important question is:
**What value does this expression evaluate to?**
That value determines what enters the element tree.

---

## 8. Expression Evaluation Is the Critical Step

Consider:

```jsx
const count = 5;
<div>{count}</div>
```

Prediction:
- Expression: `count`
- Value: `5`
- Result: `<div> 5 </div>`

Now:

```jsx
const count = 0;
<div>{count}</div>
```

The value is: `0`
And 0 is a renderable numeric child.
Therefore:

```jsx
<div>{count}</div>
```

renders:

```html
<div>0</div>
```

This becomes critically important when using:

```jsx
{count && <Badge />}
```

If:
`count = 0`
then:
`count && <Badge />` evaluates to: `0`
React can render that number.

Therefore:

```jsx
{count && <Badge />}
```

can unexpectedly produce: `0` instead of: nothing.

Senior engineers must reason about the expression result, not the intention behind the expression.

---

## 9. Expressions Do Not Automatically Become Text

Consider:

```jsx
<div>{user}</div>
```

If:

```javascript
user = { name: "Srikar" };
```

the expression evaluates to an object.
React does not interpret arbitrary objects as valid text children.

That is fundamentally different from:

```jsx
<div>{user.name}</div>
```

which evaluates to: `"Srikar"`.

The practical rule:

```text
Primitive renderable value
 │
 ├── string
 ├── number
 └── certain React-supported values ──▶ renderable
React element                       ──▶ nested UI
Array                               ──▶ collection of children
null / false / undefined            ──▶ no child
arbitrary object                    ──▶ invalid child
```

---

## 10. Props — The Configuration Surface of an Element

Consider:

```jsx
<Button variant="primary" disabled={isSaving} />
```

The JSX describes an element with props.

Conceptually:

```javascript
{
  type: Button,
  props: {
    variant: "primary",
    disabled: isSaving
  }
}
```

After expression evaluation:

```javascript
isSaving = true
```

the conceptual result is:

```javascript
{
  type: Button,
  props: {
    variant: "primary",
    disabled: true
  }
}
```

Props are therefore values attached to the element description.

---

## 11. Static Props vs Expression Props

These:

```jsx
<Button variant="primary" />
```

and:

```jsx
<Button variant={"primary"} />
```

communicate essentially the same value:
`variant: "primary"`

But:

```jsx
<Button variant={theme.variant} />
```

requires expression evaluation.

If:
`theme.variant = "secondary"`
then:
`props.variant = "secondary"`

The braces do not mean:
"Make this prop dynamic."
They mean:
"Evaluate this JavaScript expression."

---

## 12. Boolean Props

JSX has concise boolean syntax:

```jsx
<Button disabled />
```

Conceptually:

```javascript
{ disabled: true }
```

Compare:

```jsx
<Button disabled={false} />
```

which explicitly supplies:

```javascript
{ disabled: false }
```

This matters because:
`<Button disabled />`
does not mean: `disabled = "disabled"`
It means: `disabled = true`

---

## 13. Props Are Not Automatically DOM Attributes

Consider:

```jsx
<UserCard user={user} />
```

The user prop is meaningful to the `UserCard` component.
It does not mean: `<usercard user="[object Object]">`

React component props are an application-level interface.

For:

```jsx
<input disabled={isDisabled} />
```

the `disabled` prop has host-element semantics.

For:

```jsx
<UserCard user={user} />
```

the `user` prop is interpreted by the component.

Therefore:

```text
Component element ──▶ props ──▶ component function
while:
Host element ──▶ props ──▶ React DOM host configuration ──▶ DOM behavior/properties/attributes
```

Do not collapse these two layers.

---

## 14. Children Are Props

This is one of the most important concepts in React.

Consider:

```jsx
<Card>
  <h2>Hello</h2>
</Card>
```

The natural mental model is:

```text
Card
 └── h2
      └── Hello
```

Mechanically, the `Card` element receives nested JSX through its `children` prop.

Conceptually:

```javascript
{
  type: Card,
  props: {
    children: {
      type: "h2",
      props: {
        children: "Hello"
      }
    }
  }
}
```

Therefore:

```javascript
function Card(props) {
  return props.children;
}
```

can return the nested element.

---

## 15. `children` Is Not a Magical DOM Concept

Do not think:
`children = actual DOM descendants`

Instead:
`children = input passed to a component`

For example:

```jsx
<Card>
  <Button />
</Card>
```

At element-description time:

```text
Card element
 └── props
      └── children
           └── Button element
```

The actual DOM descendants depend on what `Card` eventually returns.

For example:

```javascript
function Card({ children }) {
  return (
    <section className="card">
      {children}
    </section>
  );
}
```

Now:

```text
Card ──▶ <section> └── Button output
```

But the component could instead return:

```javascript
function Card({ children }) {
  return <div>{children}</div>;
}
```

or:

```javascript
function Card({ children }) {
  return null;
}
```

The `children` prop is input.
It is not a guarantee about the final DOM.

---

## 16. `children` Can Be Explicitly Supplied

These are conceptually related:

```jsx
<Card> Hello </Card>
```

and:

```jsx
<Card children="Hello" />
```

Both supply a `children` prop.
The nested JSX syntax is simply the natural JSX notation for providing children.

---

## 17. Children Can Have Different Shapes

A component may receive:

```jsx
<Card>Hello</Card>
```
where `children === "Hello"`.

Or:

```jsx
<Card>
  <Button />
</Card>
```
where `children` is a React element.

Or:

```jsx
<Card>
  <Button />
  <Button />
</Card>
```
where multiple children are represented as a collection of child values.

Conceptually:

```text
children
 ├── child #1 ──▶ Button element
 └── child #2 ──▶ Button element
```

Or:

```jsx
<Card>
  {items.map(item => <Row key={item.id} />)}
</Card>
```
where the expression produces an array.

This is why component code should not casually assume `children.length` or `children.type` without understanding the possible shape.

---

## 18. Single Child Does Not Mean "Always an Array"

Consider:

```jsx
<Card>
  <Button />
</Card>
```

Conceptually, `children` may be a single element value.

With multiple children:

```jsx
<Card>
  <Button />
  <Button />
</Card>
```

the representation can become collection-like.

Therefore this is unsafe as a universal assumption:

```javascript
function Card({ children }) {
  return children.map(...)
}
```

because `children` is not guaranteed to expose array semantics simply because it is named "children."

When child cardinality matters, use appropriate React child utilities rather than guessing the runtime shape.

---

## 19. Text Children

This:

```jsx
<Card>
  Hello
</Card>
```

provides: `children = "Hello"`.

This:

```jsx
<Card>
  Hello {name}
</Card>
```

produces a sequence of child values.

Conceptually:

```text
children
 ├── "Hello "
 └── name result
```

If:
`name = "Srikar"`
the rendered text becomes:
`Hello Srikar`

---

## 20. Numeric Children

This:

```jsx
<div>{42}</div>
```

produces a number child: `42`.
React can render numbers as text.

Therefore:

```jsx
<div>{0}</div>
```

renders: `0`.

This is different from:

```jsx
<div>{false}</div>
```

which does not produce visible "false" text.

---

## 21. `false`, `null`, and `undefined`

These values are commonly used for conditional rendering:

```jsx
{isVisible && <Panel />}
```

If:
`isVisible = false`
the expression evaluates to: `false`.
React treats this as no rendered child.

Similarly:

```jsx
{condition ? <Panel /> : null}
```

explicitly describes the absence of the child.

Conceptually:

```text
React element tree
before: Panel
after: no Panel child
```

No empty DOM element is automatically inserted.

---

## 22. Empty String Is Different

Consider:

```jsx
<div>{""}</div>
```

An empty string has a different semantic value from `null`.
The empty string represents text with zero characters.
`null` represents absence of a child.

This distinction matters when building generic rendering abstractions.
Do not simplify all falsy values into "nothing" because JavaScript truthiness and React child rendering are separate concepts.

---

## 23. The Dangerous Truthiness Family

These JavaScript values are falsy:
- `false`
- `0`
- `""`
- `null`
- `undefined`
- `NaN`

But they do not all have identical React rendering semantics.

Therefore:

```jsx
{value && <Component />}
```

must be evaluated mechanically.

Examples:
- `value = false` $\to$ `false` $\to$ no rendered child
- `value = null` $\to$ `null` $\to$ no rendered child
- `value = undefined` $\to$ `undefined` $\to$ no rendered child
- `value = 0` $\to$ `0` $\to$ numeric child
- `value = ""` $\to$ `""` $\to$ empty text value

This is one of the most important JSX production traps.

---

## 24. Production-Safe Conditional Pattern

Instead of:

```jsx
{items.length && <ItemList items={items} />}
```

prefer:

```jsx
{items.length > 0 && <ItemList items={items} />}
```

Now the left side is guaranteed to be boolean:

```text
items.length > 0 ──▶ true / false
```

Therefore:
- `true` $\to$ `ItemList`
- `false` $\to$ no child

This removes the accidental `0` output.

---

## 25. React Elements as Children

Consider:

```jsx
<Panel>
  <Header />
  <Content />
</Panel>
```

The `Panel` element receives:

```text
children
 ├── Header element
 └── Content element
```

Those children are themselves React element descriptions.
The hierarchy is recursive:

```text
React Element
 │
 ├── type
 ├── props
 │    │
 │    └── children
 │         │
 │         ├── React Element
 │         │    └── props
 │         │
 │         └── React Element
 └── props
```

This recursive structure is what allows JSX to represent UI trees.

---

## 26. Fragment Mental Model

Suppose you need a component to return multiple sibling elements:

```jsx
function Header() {
  return (
    <h1>Title</h1>
    <p>Description</p>
  );
}
```

This is structurally invalid because JSX requires a single enclosing expression/root.

A common workaround is:

```jsx
<div>
  <h1>Title</h1>
  <p>Description</p>
</div>
```

But that introduces an actual host element.

A fragment solves the structural requirement without introducing a host DOM wrapper:

```jsx
<>
  <h1>Title</h1>
  <p>Description</p>
</>
```

Conceptually:

```text
Fragment
 ├── h1
 └── p
```

but the fragment itself does not correspond to `<div>` in the DOM.

---

## 27. Fragment = Grouping Without Host Wrapper

The critical mental model:

```jsx
<div> children </div>
```
means: React structure + actual host DOM node.

Whereas:

```jsx
<> children </>
```
means approximately: React grouping structure + NO additional host DOM node.

Therefore fragments are valuable when DOM topology must remain clean.

---

## 28. Why Not Always Use `<div>`?

Because wrappers can change browser behavior.
An unnecessary wrapper can affect:
- CSS layout
- flex/grid relationships
- selectors
- accessibility structure
- semantics
- event targeting assumptions
- table markup validity
- list markup validity
- styling inheritance and layout constraints

Example:

```html
<ul>
  <div>
    <li>One</li>
    <li>Two</li>
  </div>
</ul>
```

is structurally wrong for HTML semantics.

A fragment allows:

```jsx
<ul>
  <>
    <li>One</li>
    <li>Two</li>
  </>
</ul>
```

Conceptually preserving:

```text
ul
 ├── li
 └── li
```

without a wrapper node.

---

## 29. Short Fragment Syntax

The shorthand:

```jsx
<>
  <A />
  <B />
</>
```

is convenient.
It represents a fragment-like grouping.

However, shorthand has an important limitation: `<>` cannot receive arbitrary props.
Most importantly: **`key` cannot be supplied to the shorthand syntax.**

---

## 30. Explicit Fragment Syntax

When you need a key:

```jsx
import { Fragment } from "react";

items.map(item => (
  <Fragment key={item.id}>
    <dt>{item.term}</dt>
    <dd>{item.definition}</dd>
  </Fragment>
));
```

This is different from:

```jsx
<>
  <dt />
  <dd />
</>
```

because the explicit fragment can receive the key.

The reason matters:
- Short fragment: `<>...</>`
- Explicit fragment: `<Fragment key="...">...</Fragment>`

The second form provides a place for the key.

---

## 31. Keyed Fragments Solve Grouped Collection Identity

Suppose each item produces two siblings:

```jsx
items.map(item => (
  <>
    <dt>{item.term}</dt>
    <dd>{item.definition}</dd>
  </>
))
```

The collection item is conceptually:

```text
item
 ├── dt
 └── dd
```

The problem is that the grouping itself needs stable identity in the collection.

Use:

```jsx
items.map(item => (
  <Fragment key={item.id}>
    <dt>{item.term}</dt>
    <dd>{item.definition}</dd>
  </Fragment>
))
```

Now:

```text
Collection
 ├── Fragment(id=1)
 │    ├── dt
 │    └── dd
 │
 ├── Fragment(id=2)
 │    ├── dt
 │    └── dd
 │
 └── Fragment(id=3)
      ├── dt
      └── dd
```

The fragment provides logical grouping and key identity without adding a DOM wrapper.

---

## 32. Props + Children Together

Consider:

```jsx
<Card variant="featured">
  <h2>Revenue</h2>
  <p>$1.2M</p>
</Card>
```

Conceptually:

```text
Card element
 │
 ├── type ──▶ Card
 └── props
      ├── variant ──▶ "featured"
      └── children
           ├── h2 element ──▶ "Revenue"
           └── p element  ──▶ "$1.2M"
```

This is the core shape of composition.

---

## 33. Component API Design Through `children`

A component can expose a composition-oriented API:

```jsx
<Modal>
  <Modal.Header>
    Delete account?
  </Modal.Header>
  <Modal.Body>
    This action cannot be undone.
  </Modal.Body>
  <Modal.Footer>
    <Button>Cancel</Button>
    <Button>Delete</Button>
  </Modal.Footer>
</Modal>
```

The outer component receives nested React elements.
The API communicates:

```text
Modal
 ├── Header
 ├── Body
 └── Footer
```

This is more expressive than forcing every possible content region into dozens of props:

```jsx
<Modal
  title="Delete account?"
  body="..."
  cancelText="Cancel"
  confirmText="Delete"
  ...
/>
```

This is one reason `children` is an important architectural mechanism rather than just JSX syntax.

---

## 34. Named Regions vs Generic Children

Sometimes generic children are insufficient.

Example:
`<Layout> ... </Layout>` does not communicate which child is header, sidebar, main, or footer.

You may instead use explicit slots:

```jsx
<Layout
  header={<Header />}
  sidebar={<Sidebar />}
>
  <MainContent />
</Layout>
```

Now the API explicitly identifies regions.

The decision is architectural:
- Generic children $\to$ flexible composition
- Named props $\to$ explicit semantic slots
- Compound components $\to$ structured composition API

Do not blindly prefer one.

---

## 35. JSX Children and Whitespace

Consider:

```jsx
<div>
  Hello
  World
</div>
```

Developers sometimes assume source formatting directly maps to text nodes.
JSX whitespace behavior is not identical to copying source characters directly into a DOM text node.
Therefore do not build layout around incidental JSX source formatting.

Use explicit structures when whitespace is semantically important:

```jsx
<div>
  Hello{" "}
  <strong>World</strong>
</div>
```

or appropriate CSS/layout mechanisms.

The key principle is:
**JSX source formatting is not a reliable substitute for explicit text/layout intent.**

---

## 36. Nested Expressions

JSX expressions can produce elements:

```jsx
<div>
  {isAdmin ? <AdminPanel /> : <UserPanel />}
</div>
```

The outer element contains the result of the conditional expression.

If `isAdmin = true`:
`div └── AdminPanel element`

If `isAdmin = false`:
`div └── UserPanel element`

The expression does not mutate the existing element. It produces a different child value during that render.

---

## 37. Expressions Can Produce Arrays

Example:

```jsx
<div>
  {items.map(item => (
    <Row key={item.id} item={item} />
  ))}
</div>
```

The `map()` expression evaluates to: `[ RowElement1, RowElement2, RowElement3 ]`.

The outer JSX therefore conceptually receives:

```text
div
 └── children
      └── array
           ├── RowElement1
           ├── RowElement2
           └── RowElement3
```

React can flatten/interpret the child collection as part of the children structure.
This is the bridge between JavaScript collection processing and dynamic UI.

---

## 38. Why `map()` Is So Important in JSX

The pattern `items.map(item => <Row key={item.id} item={item} />)` is powerful because it preserves the declarative model.

You are not saying:
1. Create DOM node.
2. Append node.
3. Set text.
4. Attach event.
5. Repeat.

You are expressing:
*For every item, describe a Row.*

The resulting collection becomes React input.
The rendering system remains responsible for deciding how to realize the result.

---

## 39. JSX Does Not Execute the DOM Mutation

This:

```jsx
items.map(item => <Row key={item.id} item={item} />)
```

creates element descriptions.
It does not mean `document.createElement(...)` or `appendChild(...)` at that point.

The distinction:

```text
JavaScript execution
   ↓
React element descriptions
   ↓
React rendering/reconciliation
   ↓
commit
   ↓
DOM mutation
```

This preserves the separation between description and realization.

---

## 40. Prediction-First Walkthrough #1

Consider:

```javascript
function App() {
  const name = "Srikar";
  const count = 3;

  return (
    <main>
      <h1>Hello {name}</h1>
      <p>Count: {count}</p>
    </main>
  );
}
```

### Render #1
Evaluate: `name = "Srikar"`, `count = 3`.

Element tree:

```text
App
 └── main
      ├── h1
      │    ├── "Hello "
      │    └── "Srikar"
      │
      └── p
           ├── "Count: "
           └── 3
```

Conceptually:

```text
Element(main)
 └── props.children
      ├── Element(h1) ──▶ children: ["Hello ", "Srikar"]
      └── Element(p)  ──▶ children: ["Count: ", 3]
```

The DOM is not yet the thing being described.

---

## 41. Prediction-First Walkthrough #2 — Conditional Child

```javascript
function Status({ loading }) {
  return (
    <section>
      {loading && <Spinner />}
    </section>
  );
}
```

### Render #1: `loading = true`
- Expression: `true && <Spinner />`
- Result: `Spinner element`
- Tree: `section └── Spinner element`

### Render #2: `loading = false`
- Expression: `false && <Spinner />`
- Result: `false`
- React treats it as no rendered child.
- Tree: `section └── no Spinner child`

The important fact: **The JSX source did not change. The evaluated child value changed.**

---

## 42. Prediction-First Walkthrough #3 — The 0 Trap

```javascript
function CartSummary({ itemCount }) {
  return (
    <section>
      {itemCount && <Badge />}
    </section>
  );
}
```

### Render #1: `itemCount = 4`
- Evaluation: `4 && <Badge />`
- Result: `Badge element`
- Tree: `section └── Badge`

### Render #2: `itemCount = 0`
- Evaluation: `0 && <Badge />`
- Result: `0`
- Tree: `section └── 0`

The developer intended: *no badge*.
The expression actually produced: `0`.
This is precisely why senior-level JSX reasoning must begin with expression evaluation.

---

## 43. Prediction-First Walkthrough #4 — Children

Consider:

```javascript
function Card({ children }) {
  return (
    <article>
      <header>Card</header>
      <div>{children}</div>
    </article>
  );
}

function App() {
  return (
    <Card>
      <strong>Hello</strong>
    </Card>
  );
}
```

### Render #1
`App()` returns:

```text
Card element
 └── props
      └── children
           └── strong element
                └── "Hello"
```

`Card` receives that element as input.
`Card` then returns:

```text
article
 ├── header ──▶ "Card"
 └── div
      └── strong ──▶ "Hello"
```

The original `Card` element is not a DOM node. It is a component element description that React processes.

---

## 44. Prediction-First Walkthrough #5 — Fragment

```javascript
function UserInfo() {
  return (
    <>
      <h2>Srikar</h2>
      <p>Frontend Engineer</p>
    </>
  );
}
```

Element structure:

```text
Fragment
 ├── h2 ──▶ "Srikar"
 └── p  ──▶ "Frontend Engineer"
```

DOM result:

```html
<h2>Srikar</h2>
<p>Frontend Engineer</p>
```

There is no `<div>` between them.
The fragment satisfies React's structural requirement without creating a host DOM wrapper.

---

## 45. Prediction-First Walkthrough #6 — Keyed Fragment

```javascript
function Glossary({ items }) {
  return (
    <dl>
      {items.map(item => (
        <Fragment key={item.id}>
          <dt>{item.term}</dt>
          <dd>{item.definition}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
```

Suppose:

```javascript
items = [
  { id: "a", term: "JSX", definition: "..." },
  { id: "b", term: "Fiber", definition: "..." }
];
```

Conceptual tree:

```text
dl
 ├── Fragment(key="a")
 │    ├── dt("JSX")
 │    └── dd("...")
 │
 └── Fragment(key="b")
      ├── dt("Fiber")
      └── dd("...")
```

The fragments provide logical grouping and collection identity. No fragment DOM element is inserted.

---

## 46. JSX Expression $\to$ Element Tree Pipeline

A useful mechanical model:

```text
JSX SOURCE
    │
    ▼
Evaluate JavaScript expressions
    │
    ▼
Construct React element descriptions
    │
    ▼
┌────────────────────┐
│        type        │
│       props        │
│      children      │
│  key/ref metadata  │
└────────────────────┘
    │
    ▼
React element tree
    │
    ▼
Fiber tree
    │
    ▼
Commit
    │
    ▼
DOM
```

This pipeline prevents several common category errors.

---

## 47. Fiber and JSX Children

At this stage, keep the distinction clear:
- **React element** = input/description
- **Fiber** = React's internal work/state representation
- **DOM node** = browser-owned host representation

During rendering, React uses element descriptions as input for Fiber reconciliation.
A component's Fiber can retain state and other runtime information independently of the immutable element object produced by the render.

Therefore:
`<Card> <Button /> </Card>`
does not mean `Card element = Card Fiber = DOM node`.

Instead:

```text
Card element ──▶ Card Fiber ──▶ returned element tree ──▶ child Fibers ──▶ host Fibers ──▶ DOM nodes
```

---

## 48. Element Identity vs Object Identity

Consider:

```javascript
const element = <Button />;
```

Each evaluation of `<Button />` creates an element description.
The JavaScript object identity can therefore differ:

```javascript
const a = <Button />;
const b = <Button />;
a === b; // false
```

Yet React can still recognize that both describe the same conceptual component type in an appropriate tree position.

This is why JavaScript object identity must not be confused with React reconciliation identity.
Keys, type, and tree position participate in React's identity model.

---

## 49. Props Are Snapshot Inputs

Consider:

```javascript
function User({ name }) {
  return <h1>{name}</h1>;
}
```

If React renders `<User name="Srikar" />`, the render receives `props.name = "Srikar"`.
A later render `<User name="Alex" />` receives `props.name = "Alex"`.

The previous props object is not conceptually a mutable container that React expects you to modify.
The render describes UI from the current inputs.
This connects directly to KPI 01's state $\to$ update $\to$ render $\to$ commit model.

---

## 50. Production Anti-Pattern #1 — Treating JSX as HTML Strings

### Flawed
```javascript
const content = `
  <button>${label}</button>
`;
return content;
```

### Why Developers Do It
They mentally model JSX as HTML templating.

### Mechanical Failure
A string containing HTML is not automatically a React element description.
You lose React's normal element/component composition model.

### Senior Refactoring
```javascript
return <button>{label}</button>;
```

Now: `label ──▶ JS expression ──▶ React element ──▶ React rendering`.

---

## 51. Production Anti-Pattern #2 — Assuming All Falsy Values Disappear

### Flawed
```jsx
{count && <Badge />}
```

### Why Developers Do It
They remember `false && X → false` and assume all falsy values produce no visible output.

### Mechanical Failure
If `count = 0`, then `0 && <Badge />` returns `0`, which is renderable.

### Senior Refactoring
```jsx
{count > 0 && <Badge />}
```

Now the expression produces boolean before deciding whether the component appears.

---

## 52. Production Anti-Pattern #3 — Treating `children` as Always an Array

### Flawed
```javascript
function Stack({ children }) {
  children.map(child => ...)
}
```

### Why Developers Do It
They see `<Stack><A /><B /></Stack>` and assume `children` always means array.

### Mechanical Failure
Single-child and multiple-child cases can have different shapes (`Object` vs `Array`).

### Senior Refactoring
Use React's child utilities (`React.Children.map`) when you need normalized child iteration/transformation.
The key design principle: **Do not infer runtime shape from JSX indentation.**

---

## 53. Production Anti-Pattern #4 — Wrapper `<div>` Everywhere

### Flawed
```jsx
return (
  <div>
    <Header />
    <Content />
  </div>
);
```

### Why Developers Do It
It satisfies JSX's single-root requirement.

### Mechanical Failure
The wrapper becomes a real DOM node and may alter layout, semantics, accessibility, CSS selectors, and DOM structure.

### Senior Refactoring
If no host node is semantically required:

```jsx
return (
  <>
    <Header />
    <Content />
  </>
);
```

---

## 54. Production Anti-Pattern #5 — Short Fragment When Key Is Required

### Flawed
```jsx
items.map(item => (
  <>
    <dt>{item.term}</dt>
    <dd>{item.definition}</dd>
  </>
))
```

### Why Developers Do It
The fragment syntax is concise.

### Mechanical Failure
The fragment grouping has no key. The collection lacks the intended stable identity for each grouped item.

### Senior Refactoring
```jsx
items.map(item => (
  <Fragment key={item.id}>
    <dt>{item.term}</dt>
    <dd>{item.definition}</dd>
  </Fragment>
))
```

---

## 55. Production Anti-Pattern #6 — Rendering Arbitrary Objects

### Flawed
```jsx
<div>{user}</div>
```

### Why Developers Do It
They expect React to stringify the object.

### Mechanical Failure
A normal JavaScript object is not a valid React child.

### Senior Refactoring
Render the intended fields:

```jsx
<div>{user.name}</div>
```

or explicitly serialize for diagnostic purposes:

```jsx
<pre>{JSON.stringify(user, null, 2)}</pre>
```

The latter is diagnostic output, not a normal UI representation.

---

## 56. Production Anti-Pattern #7 — Confusing Children With Layout

### Flawed
```javascript
function Card({ children }) {
  return children;
}
```

### Why It Can Be a Problem
The component has no structural responsibility.
This may be intentional, but if the component is supposed to enforce padding, border, semantic region, accessibility behavior, and layout, then merely forwarding children may defeat the component's API purpose.

### Better
```javascript
function Card({ children }) {
  return (
    <article className="card">
      {children}
    </article>
  );
}
```

The component owns its structural contract while allowing composition inside it.

---

## 57. Production Anti-Pattern #8 — Excessive Prop Serialization

### Flawed
```jsx
<UserCard userName={user.name} />
```
followed by:
```jsx
<UserCard
  userName={user.name}
  email={user.email}
  avatar={user.avatar}
  role={user.role}
  department={user.department}
  ...
/>
```

This can produce a brittle API when the component fundamentally consumes a user domain object.
A more coherent boundary may be:

```jsx
<UserCard user={user} />
```

The correct choice depends on ownership and API stability.
The senior question is: **What is the component's semantic contract, and where should transformation occur?**

---

## 58. Production Anti-Pattern #9 — Hiding Business Logic Inside JSX Expressions

### Risky
```jsx
return (
  <button
    disabled={
      user &&
      user.permissions &&
      user.permissions.some(p => p.name === "admin") &&
      !account.isLocked &&
      !request.pending
    }
  >
    Save
  </button>
);
```

This may be valid JavaScript, but the JSX becomes difficult to reason about.

Prefer deriving a named value:

```javascript
const canSave =
  user?.permissions?.some(p => p.name === "admin") &&
  !account.isLocked &&
  !request.pending;

return (
  <button disabled={!canSave}>
    Save
  </button>
);
```

The JSX remains declarative while the decision is explicit.

---

## 59. Production Anti-Pattern #10 — Using Children as an Unstructured Dumping Ground

### Risky API
```jsx
<Dashboard>
  <RandomThing />
  <AnotherThing />
  <SomethingElse />
</Dashboard>
```
with no documented composition contract.
A component may become dependent on child ordering, types, or undocumented structure.

Senior-level component APIs should establish clear contracts:
- What children are accepted?
- Can there be one or many?
- Does order matter?
- Are certain child types required?
- Can arbitrary elements be passed?
- Who owns layout?

Composition is powerful, but unrestricted composition can become implicit coupling.

---

# LAYER 3 — 🧪 DIAGNOSTIC LABS & DEVTOOLS PROFILING

## 60. Lab Environment

Companion Lab created at:
[`examples/03-jsx-expressions-props-children-fragments.html`](./examples/03-jsx-expressions-props-children-fragments.html)

```text
┌────────────────────────────────────────────────────────────┐
│                  JSX Expression Laboratory                 │
├───────────────────────┬────────────────────────────────────┤
│       Source JSX      │     Evaluated Conceptual Tree      │
│                       │                                    │
│  {count && <Badge/>}  │  section                           │
│                       │   └── 0                            │
├───────────────────────┴────────────────────────────────────┤
│ Render Value Controls                                      │
│                                                            │
│ count: [ 0 ] [ 1 ] [ 5 ]                                   │
│ loading: [true] [false]                                    │
├────────────────────────────────────────────────────────────┤
│ Explanation                                                │
│                                                            │
│ 0 && <Badge/> → 0                                          │
└────────────────────────────────────────────────────────────┘
```

---

## 61. Diagnostic Lab #1 — Expression Result

Start with:

```javascript
function Example({ value }) {
  return <div>{value}</div>;
}
```

Test:
- `"hello"`
- `42`
- `0`
- `false`
- `null`
- `undefined`
- `[]`
- `[<span />]`
- `{}`

Record input value, expression result, React child interpretation, and visible output. Use `console.table(...)` to create a structured diagnostic table.

---

## 62. Diagnostic Lab #2 — The `&&` Trap

Use:

```javascript
function Example({ count }) {
  return (
    <section>
      {count && <strong>Items available</strong>}
    </section>
  );
}
```

Test: `count = 0`, `count = 1`, `count = 5`.

Expected reasoning:
- `0` $\to$ `0 && element` $\to$ `0` $\to$ numeric child
- `1` $\to$ `1 && element` $\to$ `element`
- `5` $\to$ `5 && element` $\to$ `element`

Then compare `{count > 0 && <strong>Items available</strong>}`, which guarantees `true / false`.

---

## 63. Diagnostic Lab #3 — Children Shape

```javascript
function Inspector({ children }) {
  console.log(children);
  return <pre>{JSON.stringify(children, null, 2)}</pre>;
}
```

Test:
1. `<Inspector> Hello </Inspector>`
2. `<Inspector> <span>Hello</span> </Inspector>`
3. `<Inspector> <span>Hello</span> <span>World</span> </Inspector>`
4. `<Inspector> {items.map(item => <span key={item.id}>{item.name}</span>)} </Inspector>`

Observe how child representation changes. Do not conclude that all output should be treated as raw arrays.

---

## 64. Diagnostic Lab #4 — Fragment vs DOM Wrapper

Compare:

```jsx
return (
  <div className="wrapper">
    <Header />
    <Content />
  </div>
);
```

against:

```jsx
return (
  <>
    <Header />
    <Content />
  </>
);
```

Inspect the DOM tree: record host nodes introduced, DOM parent-child relationships, CSS layout differences, and semantic differences.

---

## 65. Diagnostic Lab #5 — Keyed Fragment

```jsx
items.map(item => (
  <Fragment key={item.id}>
    <dt>{item.name}</dt>
    <dd>{item.value}</dd>
  </Fragment>
))
```

Reorder `A B C` to `C A B`. Observe how keys preserve item identity across the reordered collection. The fragment itself is the logical keyed unit.

---

## 66. React DevTools Runbook

1. Open application in Chrome DevTools.
2. Navigate to **React DevTools $\to$ Components**.
3. Select the component containing `{children}`.
4. Inspect: Props, Hooks, Rendered component tree.
5. Confirm `children` is visible as component input.

---

## 67. Render Highlighting

Enable React DevTools setting:
*Highlight updates when components render*

Trigger state updates. Observe:
`Parent rerender ──▶ children expressions reevaluated ──▶ new element descriptions ──▶ React determines necessary work`.

Do not interpret a component rerender as "DOM completely recreated."

---

## 68. Record Why Each Component Rendered

Enable: *Record why each component rendered*.
Trigger changes: parent state update, prop change, context change.
Inspect reason to distinguish component function execution from specific child DOM mutations.

---

## 69. Profiler Runbook

1. Open **React DevTools $\to$ Profiler $\to$ Start profiling**.
2. Perform: change count, toggle condition, reorder list, change children.
3. Stop profiling.
4. Inspect: Commit Duration, Flamegraph, Ranked chart.
5. Ask: Which component rerendered? Why? Which descendants rerendered? Which host nodes actually changed?

---

## 70. Console-Based Element Inspection

```javascript
const child = items.map(item => (
  <Row key={item.id} item={item} />
));

console.table(
  child.map(element => ({
    type: typeof element.type === "string" ? element.type : element.type?.name,
    key: element.key
  }))
);
```

---

## 71. PerformanceObserver Diagnostic Boundary

```javascript
const observer = new PerformanceObserver(list => {
  for (const entry of list.getEntries()) {
    console.table({
      name: entry.name,
      startTime: entry.startTime,
      duration: entry.duration
    });
  }
});
observer.observe({ entryTypes: ["measure"] });

performance.mark("render-start");
// application operation
performance.mark("render-end");
performance.measure("operation", "render-start", "render-end");
```

---

## 72. Master Execution Timeline

```text
Trigger
   │
   ▼ Render Phase
   ├── component function executes
   ├── JSX expressions evaluate
   ├── React elements are produced
   └── element tree becomes reconciliation input
   │
   ▼ Reconciliation
   ├── type
   ├── key
   ├── position
   └── tree structure
   │
   ▼ Commit Phase
   │
   ▼ DOM Mutation
   │
   ▼ Browser Layout / Paint
   │
   ▼ Passive Effects
```

---

# LAYER 4 — 🔥 THE CRUCIBLE

## 73. Prediction Challenges Overview

The Crucible tests the strict mechanical evaluation of expressions, children shapes, and Fragment boundaries.

---

## 74. Prediction Challenge #1

Given:

```javascript
function Example({ value }) {
  return <div>{value && <span>Visible</span>}</div>;
}
```

Predict the child for:
- `value = false` $\to$ `false` $\to$ No child
- `value = null` $\to$ `null` $\to$ No child
- `value = undefined` $\to$ `undefined` $\to$ No child
- `value = 0` $\to$ `0` $\to$ **Renders numeric `"0"`**
- `value = 1` $\to$ `<span>Visible</span>`
- `value = ""` $\to$ `""` $\to$ Empty text node
- `value = "hello"` $\to$ `<span>Visible</span>`

---

## 75. Prediction Challenge #2

Given:

```javascript
function Wrapper({ children }) {
  return <section>{children}</section>;
}

function App() {
  return (
    <Wrapper>
      <h1>Hello</h1>
      <p>World</p>
    </Wrapper>
  );
}
```

Predict:
- **`App` element:** `{ type: App }`
- **`Wrapper` props:** `{ children: [ { type: 'h1', ... }, { type: 'p', ... } ] }`
- **`Wrapper` returned element:** `{ type: 'section', props: { children: [ ... ] } }`
- **Final host tree:** `<section><h1>Hello</h1><p>World</p></section>`

---

## 76. Prediction Challenge #3

Given:

```javascript
function Example({ items }) {
  return (
    <div>
      {items.map(item => (
        <span key={item.id}>{item.name}</span>
      ))}
    </div>
  );
}
```

Input: `[{ id: "a", name: "A" }, { id: "b", name: "B" }]`.
`map()` produces an array of 2 React elements (`type: "span"` with `key: "a"` and `key: "b"`).
Reordering to `[B, A]` preserves the span DOM nodes and moves them via key matching.

---

## 77. Prediction Challenge #4

Consider:

```javascript
function Example() {
  return (
    <>
      <h1>Title</h1>
      <p>Description</p>
    </>
  );
}
```

- React structural root: `React.Fragment`
- Number of host DOM elements created by root: `0`
- DOM parent-child: `h1` and `p` are attached directly to Example's parent container.

Replacing with `<div>`: inserts an extra `HTMLDivElement` into the DOM hierarchy.

---

## 78. Prediction Challenge #5

```javascript
function Example({ count }) {
  const message = count > 0 ? <Badge /> : null;
  return <section>{message}</section>;
}
```

- **Render #1 (`count = 3`):** `message = <Badge />` $\to$ `<section><Badge /></section>`
- **Render #2 (`count = 0`):** `message = null` $\to$ `<section />` (no children)
- **Render #3 (`count = 7`):** `message = <Badge />` $\to$ `<section><Badge /></section>`

---

## 79. Prediction Challenge #6

```javascript
function Example({ value }) {
  return <div>{value}</div>;
}
```

- `value = 42` $\to$ renderable numeric text node (`"42"`)
- `value = "42"` $\to$ renderable string text node (`"42"`)
- `value = false` $\to$ no rendered child
- `value = null` $\to$ no rendered child
- `value = undefined` $\to$ no rendered child
- `value = { answer: 42 }` $\to$ **INVALID CHILD** (Throws React Invariant Exception)

---

## 80. Production Incident Runbook: The Missing Empty State

### Incident
Users report: *"The dashboard sometimes displays a 0 where the empty state should be."*

1. **Step 1:** Search for `{something.length && ...}`.
2. **Step 2:** Inspect runtime values: `console.table({ length: items.length, condition: items.length && "render" })`.
3. **Step 3:** Verify expression semantics: `0 && JSX` evaluates to `0`.
4. **Step 4:** Refactor to `{items.length > 0 && <List />}`.
5. **Step 5:** Add regression test confirming `0 items` produces zero output.

---

## 81. Production Incident Runbook — Missing Group Identity

### Incident
A collection renders grouped sibling structures:
`term` $\to$ `definition` $\to$ `term` $\to$ `definition`
and warnings appear around missing keys.

### Root Cause
```jsx
items.map(item => (
  <>
    <dt>{item.term}</dt>
    <dd>{item.definition}</dd>
  </>
))
```
The short fragment `<>` cannot accept a key.

### Fix
```jsx
items.map(item => (
  <Fragment key={item.id}>
    <dt>{item.term}</dt>
    <dd>{item.definition}</dd>
  </Fragment>
))
```

---

## 82. Engineering Decision Matrix

| Requirement | Recommended Pattern |
| :--- | :--- |
| One dynamic value | `{value}` |
| Dynamic component | `{condition ? <A /> : <B />}` |
| Optional component | `{condition && <A />}` (when condition is boolean) |
| Numeric condition | `{count > 0 && <A />}` |
| Pass data to component | `prop={value}` |
| Pass nested UI | `children` |
| Multiple sibling children | Fragment |
| Fragment without key | `<>...</>` |
| Fragment with key | `<Fragment key={...}>...</Fragment>` |
| Dynamic collection | `.map(...)` |
| Need collection identity | Stable `key` |
| Need named composition region | Named prop / slot |
| Need generic nested composition | `children` |
| Need inspect arbitrary data | Explicit serialization / debug UI |

---

## 83. Senior Interview Gotchas

1. **Is JSX HTML?** No. JSX is syntax that participates in producing JavaScript values representing React element descriptions.
2. **What does `{count && <Badge />}` return when `count` is 0?** `0`. That numeric result becomes a rendered text node in the DOM.
3. **Is `children` special?** It is a conventional React prop populated by nested JSX or explicit children input.
4. **Does a fragment create a DOM element?** No additional host DOM element is created for the fragment itself.
5. **Can shorthand fragments receive keys?** No. Use explicit `<Fragment key={id}>` when keys are required.
6. **Does a JSX expression immediately modify the DOM?** No. It produces React element descriptions during the render phase.
7. **Is a React element a DOM node?** No. A React element is a plain object description in the V8 heap.
8. **Does rerendering mean the DOM is recreated?** No. React reconciles element descriptions and updates existing DOM nodes in-place.

---

## 84. Completion Checklist

- [x] Can explain what `{expression}` means in JSX.
- [x] Identify JavaScript expressions inside JSX and predict their runtime values.
- [x] Understand why `count && <UI />` traps on `0`.
- [x] Know why `children` is an ordinary prop.
- [x] Recognize that single child $\neq$ Array.
- [x] Distinguish `<>` from `<Fragment key={...}>`.
- [x] Predict full React element trees before React renders them.

---

## 85. Final Crucible — Senior-Level Test

```javascript
function Dashboard({ user, items, loading }) {
  const count = items.length;
  const content = loading ? (
    <Spinner />
  ) : count > 0 ? (
    items.map(item => (
      <Fragment key={item.id}>
        <Row item={item} />
        <Divider />
      </Fragment>
    ))
  ) : null;

  return (
    <main>
      <h1>Welcome {user.name}</h1>
      <section>{content}</section>
      {count > 0 && <footer>Showing {count} items</footer>}
    </main>
  );
}
```

### Given:
`user = { name: "Srikar" }`, `items = [{ id: "a", name: "Alpha" }, { id: "b", name: "Beta" }]`, `loading = false`.

### Render #1:
- `count = 2`
- `content = [ Fragment(key="a"), Fragment(key="b") ]`
- `main` element $\to$ `h1 ("Welcome Srikar")`, `section (2 Fragments)`, `footer ("Showing 2 items")`.

### Render #2 (`items = []`, `loading = false`):
- `count = 0`
- `content = null`
- `section` $\to$ no content children
- `count > 0` $\to$ `false` (footer omitted cleanly).

### Render #3 (`loading = true`):
- `content = <Spinner />`
- `section └── Spinner`

---

## 86. Part Graduation Test

Decompose without mentally jumping to the DOM:

```jsx
<Component data={data} enabled={count > 0}>
  {loading ? (
    <Spinner />
  ) : (
    items.map(item => (
      <Fragment key={item.id}>
        <Item item={item} />
      </Fragment>
    ))
  )}
</Component>
```

```text
Component element
 ├── props.data    ──▶ evaluated data
 ├── props.enabled ──▶ evaluated boolean (count > 0)
 └── props.children
      └── conditional expression:
           ├── Spinner element (if loading)
           └── array [ Fragment(key=id) └── Item element ]
```

---

## 87. Cross-Part Boundary

- **Part 01:** JSX is JavaScript-oriented declarative UI syntax.
- **Part 02:** JSX produces React element descriptions.
- **Part 03:** JavaScript expressions $\to$ props $\to$ children $\to$ fragments $\to$ dynamic element structures.
- **Part 04:** JSX Trees, Identity, Conditional UI & Dynamic Collections.

---

## 88. One-Minute Revision

```text
1. JSX is syntax for describing React input.
2. {} means: evaluate this JavaScript expression.
3. The expression's RESULT matters.
4. Props are values attached to the React element description.
5. Nested JSX becomes children input.
6. children is a component prop, not automatically a DOM subtree.
7. Strings and numbers can become visible text.
8. false, null, and undefined generally represent no rendered child.
9. 0 is falsy in JavaScript but can render as a number.
10. && therefore requires careful condition design.
11. Arrays can represent dynamic collections of children.
12. Fragments group children without adding a host DOM wrapper.
13. <>...</> cannot carry a key.
14. <Fragment key={...}> is required for keyed fragment groups.
15. A React element is not a Fiber.
16. A Fiber is not a DOM node.
17. New element objects do not automatically mean new DOM nodes.
18. Always reason: JavaScript evaluation ──▶ element description ──▶ element tree ──▶ reconciliation ──▶ commit ──▶ DOM
```

> **The Senior Mental Model:**  
> **"JSX is not where rendering happens. JSX is where declarative structure is expressed. JavaScript expressions determine the runtime values inside that structure; React then consumes the resulting element tree and determines what work must reach the browser."**

---

[⬅️ Previous Part: React Elements](./02-element-objects-immutability.md) | [📚 KPI 02 Index](./README.md) | [🧪 Companion Lab](./examples/03-jsx-expressions-props-children-fragments.html) | [Next Part ➡️: Conditional UI, Lists & Element Identity](./04-lists-and-keys-foundations.md)
