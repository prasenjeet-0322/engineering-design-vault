# Level 06 — React Fundamentals
# KPI 02 — JSX & React Elements
## PART 05 — JSX Production Patterns, Anti-Patterns & Senior-Level Reasoning

[⬅️ Previous Part: Trees, Identity & Collections](./04-lists-and-keys-foundations.md) | [📚 KPI 02 Index](./README.md) | [🧪 Companion Lab](./examples/05-jsx-production-patterns-lab.html) | [Level 06 Master Hub ➡️](../README.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

# 🎯 Knowledge Contract

By the end of this Part, you should be able to:
- Treat JSX as a UI description embedded in JavaScript, not as HTML.
- Decide whether logic belongs inside JSX, before JSX, or in another component.
- Distinguish readable conditional rendering from JSX control-flow abuse.
- Design component boundaries around UI responsibility and state/data ownership.
- Recognize when JSX duplication is harmless and when it indicates an architectural problem.
- Reason about children, composition, wrappers, fragments, and conditional branches.
- Avoid accidental DOM structure changes caused by convenience wrappers.
- Understand why unstable JSX patterns can create reconciliation, accessibility, layout, or maintainability problems.
- Diagnose excessive conditional complexity.
- Recognize when a JSX expression is merely verbose versus architecturally wrong.
- Refactor production JSX without changing behavior.
- Reason about JSX from source $\to$ element descriptions $\to$ React tree $\to$ committed UI.
- Predict how production refactors affect identity, DOM structure, and state preservation.
- Make senior-level tradeoffs rather than applying simplistic “clean code” rules.

---

# Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

## 1. The Core Mental Model

The most important production rule for JSX is:

> **JSX should describe what the UI should look like for the current data/state; it should not become a second programming language for controlling the entire application.**

Conceptually:

```text
Application State / Props
           │
           ▼
    JavaScript Logic
           │
           ▼
          JSX
           │
           ▼
React Element Descriptions
           │
           ▼
    React Tree / Fiber
           │
           ▼
     Reconciliation
           │
           ▼
         Commit
           │
           ▼
      Browser DOM
```

The mistake senior engineers repeatedly encounter is allowing this:

```text
JSX
 │
 ├── business rules
 ├── data transformations
 ├── permission logic
 ├── formatting logic
 ├── networking
 ├── mutation
 ├── state management
 ├── event handling
 ├── accessibility behavior
 └── visual description
```

to collapse into one giant component.

A healthier architecture separates concerns:

```text
Component
 │
 ┌─────────┴─────────┐
 │                   │
Domain Logic       UI Logic
 │                   │
transformations    conditions
validation         composition
permissions        presentation
 │                   │
 └─────────┬─────────┘
           ▼
          JSX
           │
           ▼
      Element Tree
```

JSX remains the final declarative projection of already-understood information.

---

## 2. Executive Concept Table

| Concept | Core Mechanism | Production Impact | Common Senior Trap |
| :--- | :--- | :--- | :--- |
| **JSX expression** | JavaScript value embedded in JSX | Dynamic UI | Assuming every expression should live inline |
| **Conditional JSX** | JavaScript chooses element description | Controls UI topology | Nested ternary explosions |
| **Early return** | Component chooses an entire render path | Simplifies state-dependent UI | Using it when branches actually share substantial structure |
| **Derived data** | Compute display data from props/state | Prevents redundant state | Recomputing complex transformations inside markup |
| **Composition** | Parent supplies UI structure through props/children | Reduces branching | Creating abstraction purely to avoid repetition |
| **`children`** | Nested JSX becomes a prop | Flexible component APIs | Treating `children` as magical DOM behavior |
| **Wrapper element** | Adds an actual element to the tree | Can affect layout/accessibility/CSS | Adding `<div>` for grouping without considering semantics |
| **Fragment** | Groups elements without adding a DOM node | Preserves DOM shape | Assuming fragments have no reconciliation implications |
| **Render helper** | Function returns JSX | Can isolate local complexity | Turning helpers into pseudo-components with hidden dependencies |
| **Component extraction** | Moves JSX responsibility into a component | Improves boundaries | Extracting every few lines mechanically |
| **Data-driven rendering** | Data controls repeated JSX | Scales collections | Creating giant configuration objects that hide behavior |
| **Explicit branches** | `if`, `switch`, maps | Clear control flow | Thinking JSX must contain all logic |
| **JSX duplication** | Same markup appears in multiple branches | Sometimes acceptable | Abstracting too early |
| **DOM shape** | Actual HTML structure committed by React | Affects CSS, a11y, layout | Forgetting that JSX structure is not merely cosmetic |
| **Stable element type** | React compares tree nodes by type/key | Preserves identity | Refactoring markup and unintentionally resetting state |

---

## 3. Golden Rule

> **Keep JSX declarative, keep business decisions explicit, keep component boundaries meaningful, and never optimize JSX for cleverness at the expense of tree clarity.**

A senior engineer should be able to look at JSX and quickly answer:
- What data is being displayed?
- What state determines the branch?
- What component owns that state?
- What DOM structure is produced?
- Which elements/components preserve identity?
- Which elements intentionally disappear or appear?
- Which logic belongs outside this JSX?

If those answers require mentally executing 200 lines of nested expressions, the JSX has become an architectural problem.

---

# Layer 2 — 🔬 Deep Mechanical Breakdown

## 4. What “Production JSX” Actually Means

Production JSX is not necessarily:
- short JSX
- few lines
- zero duplication
- maximum abstraction
- one component per visual element
- no ternaries
- no conditional expressions

Production JSX means:
**The JSX makes the UI tree and its state-dependent variations understandable and mechanically predictable.**

Consider:

```jsx
return (
  <Dashboard>
    {user ? (
      user.isAdmin ? (
        user.isSuspended ? (
          <SuspendedAdmin />
        ) : (
          <AdminDashboard />
        )
      ) : (
        <UserDashboard />
      )
    ) : (
      <Login />
    )}
  </Dashboard>
);
```

This is technically valid. But validity is not the same thing as good engineering.
The tree is encoding:

```text
No user └── Login
User
 ├── Admin
 │    ├── Suspended └── SuspendedAdmin
 │    └── Active    └── AdminDashboard
 └── Normal         └── UserDashboard
```

The business state machine is hidden inside JSX.

A clearer implementation might be:

```javascript
if (!user) {
  return (
    <Dashboard>
      <Login />
    </Dashboard>
  );
}

if (user.isAdmin && user.isSuspended) {
  return (
    <Dashboard>
      <SuspendedAdmin />
    </Dashboard>
  );
}

if (user.isAdmin) {
  return (
    <Dashboard>
      <AdminDashboard />
    </Dashboard>
  );
}

return (
  <Dashboard>
    <UserDashboard />
  </Dashboard>
);
```

Or, when the common shell is genuinely important:

```javascript
let content;
if (!user) {
  content = <Login />;
} else if (user.isAdmin && user.isSuspended) {
  content = <SuspendedAdmin />;
} else if (user.isAdmin) {
  content = <AdminDashboard />;
} else {
  content = <UserDashboard />;
}

return <Dashboard>{content}</Dashboard>;
```

The point is not that `if` is inherently superior to ternaries.
The point is: **Control-flow complexity should remain visible as control flow.**

---

## 5. JSX Is a Projection Layer

A useful architecture is:

```text
Raw Application State
         │
         ▼
Domain Interpretation
         │
         ▼
View Model / Derived Data
         │
         ▼
        JSX
         │
         ▼
   React Elements
```

For example:

```javascript
function OrderStatus({ order }) {
  const status = getOrderPresentationStatus(order);
  return (
    <StatusBadge tone={status.tone} label={status.label} />
  );
}
```

Rather than:

```jsx
function OrderStatus({ order }) {
  return (
    <span
      className={
        order.cancelled
          ? "red"
          : order.refunded
          ? "orange"
          : order.paid
          ? "green"
          : order.failed
          ? "dark-red"
          : "gray"
      }
    >
      {order.cancelled
        ? "Cancelled"
        : order.refunded
        ? "Refunded"
        : order.paid
        ? "Paid"
        : order.failed
        ? "Payment Failed"
        : "Pending"}
    </span>
  );
}
```

Both can render correctly. The second version embeds domain interpretation inside visual markup. The first makes the architecture explicit.

---

## 6. Where Should Logic Live?

A useful decision hierarchy:

```text
Is this purely visual?
 │
 ├── Yes ──▶ JSX
 │
 ▼
Does it transform values for display?
 │
 ├── Simple                  ──▶ local expression
 ├── Complex                 ──▶ local variable/helper
 └── Reused/domain-specific  ──▶ dedicated function
 │
 ▼
Does it represent business/domain policy?
 │
 └── domain/service/view-model layer
 │
 ▼
Does it determine component responsibility?
 │
 └── component boundary / state owner
```

---

## 7. Inline Expressions: When They Are Good

This is excellent JSX:
```jsx
<h1>{user.name}</h1>
<p>{items.length} items</p>
<button disabled={isSubmitting}>
  {isSubmitting ? "Saving…" : "Save"}
</button>
```

These expressions have low cognitive complexity. They directly communicate the UI.

---

## 8. When Inline Logic Becomes a Problem

Consider:

```jsx
<div>
  {orders
    .filter(order => !order.cancelled)
    .filter(order => order.customer?.active)
    .sort((a, b) => b.total - a.total)
    .map(order => (
      <Order
        key={order.id}
        order={order}
        discount={
          order.customer?.tier === "enterprise"
            ? order.total > 10000
              ? 0.2
              : 0.1
            : order.total > 5000
            ? 0.05
            : 0
        }
      />
    ))}
</div>
```

Multiple responsibilities have accumulated: filtering, sorting, business policy, discount calculation, collection rendering, and presentation.

A better structure:

```javascript
const visibleOrders = getVisibleOrders(orders);

return (
  <div>
    {visibleOrders.map(order => (
      <Order
        key={order.id}
        order={order}
        discount={getOrderDiscount(order)}
      />
    ))}
  </div>
);
```

Now the JSX communicates visual structure (`List └── Order × N`) rather than the business algorithm.

---

## 9. But Do Not Abstract Everything

A dangerous reaction is: *“Logic should never exist inside JSX.”* That is wrong.

This is unnecessarily verbose:

```javascript
const isDisabled = disabled === true;
return <button disabled={isDisabled}>Save</button>;
```

when:

```jsx
return <button disabled={disabled}>Save</button>;
```

is clearer.

> **Senior Rule:**  
> **Abstract complexity, not syntax.**

---

## 10. Conditional Rendering Patterns

### Pattern A — Logical `&&`
```jsx
{hasError && <ErrorMessage />}
```
Best when: condition true $\to$ render element, condition false $\to$ render nothing.

---

## 11. The `&&` Truthiness Trap

```jsx
{count && <Badge count={count} />}
```

If `count = 0`, the expression evaluates to `0`. React renders that `0`.

A safer expression:
```jsx
{count > 0 && <Badge count={count} />}
// or:
{Boolean(count) && <Badge count={count} />}
```

JSX does not change JavaScript operator semantics.

---

## 12. Pattern B — Ternary

```jsx
{isLoading ? <Spinner /> : <Content />}
```

Excellent for a simple two-way choice:

```text
condition
 ├── true  ──▶ element A
 └── false ──▶ element B
```

---

## 13. Ternary Abuse

```jsx
{status === "loading" ? (
  <Spinner />
) : status === "error" ? (
  <Error />
) : status === "empty" ? (
  <Empty />
) : status === "success" ? (
  <Results />
) : (
  <Unknown />
)}
```

Prefer:

```javascript
switch (status) {
  case "loading": return <Spinner />;
  case "error":   return <Error />;
  case "empty":   return <Empty />;
  case "success": return <Results />;
  default:        return <Unknown />;
}
```

Or a dictionary map:

```javascript
const views = {
  loading: <Spinner />,
  error:   <Error />,
  empty:   <Empty />,
  success: <Results />,
};

return views[status] ?? <Unknown />;
```

---

## 14. Pattern C — Early Return

Early return is powerful when the entire component has mutually exclusive modes:

```javascript
function Profile({ user }) {
  if (!user) {
    return <LoginPrompt />;
  }
  if (user.isSuspended) {
    return <SuspendedAccount />;
  }
  return <ProfileView user={user} />;
}
```

---

## 15. Pattern D — Extracted Render Functions

```javascript
function Dashboard({ state }) {
  function renderContent() {
    if (state.loading) return <Spinner />;
    if (state.error) return <ErrorMessage error={state.error} />;
    return <DashboardContent data={state.data} />;
  }

  return (
    <section>
      <Header />
      {renderContent()}
    </section>
  );
}
```

A giant render helper (200+ lines) is often just a giant component hidden behind a function.

---

## 16. Render Helper vs Component

```javascript
// Render Helper (invoked directly in parent frame)
function renderSidebar() { return <aside>...</aside>; }

// React Component Boundary (has its own Fiber, hooks, and lifecycle)
function Sidebar() { return <aside>...</aside>; }
```

Do not confuse “returns JSX” with “is a React component.”

---

## 17. Component Extraction Is an Ownership Decision

- **Bad extraction:** `function UserName({ user }) { return <span>{user.name}</span>; }` (Trivial 1-liner with no ownership).
- **Good extraction:** `function UserMenu({ user, onLogout }) { ... }` (Owns meaningful UI responsibility, events, and dropdown state).

Ask:
- Does this region have independent responsibility?
- Does it have a meaningful API?
- Does it hold local state?
- Is it reused?

---

## 18. Composition Beats Conditional Explosion

Avoid components becoming registries of unrelated UI types:

```jsx
// ❌ Registry Anti-Pattern
function Card({ type, data }) {
  if (type === "user") return <div><h2>{data.name}</h2>...</div>;
  if (type === "product") return <div><h2>{data.title}</h2>...</div>;
}

// ✅ Composition Pattern: Shell owns structure, caller owns content
function Card({ title, children }) {
  return (
    <article>
      <h2>{title}</h2>
      {children}
    </article>
  );
}
```

---

## 19. `children` Is a Prop

`<Card><Profile /></Card>` is conceptually `<Card children={<Profile />} />`.
The `Card` component decides where to place it in its returned element tree.

---

## 20. Composition vs Prop Explosion

Bad abstraction:
`<Card title={title} showHeader={true} showFooter={true} bodyPadding="large" ... />`

Composition pattern:
```jsx
<Card>
  <CardHeader>...</CardHeader>
  <CardBody>...</CardBody>
  <CardFooter>...</CardFooter>
</Card>
```

```text
Configuration ──▶ "What variations should this component support?"
Composition   ──▶ "What structure should the caller provide?"
```

---

## 21. JSX Duplication: When Is It Actually Bad?

```javascript
if (loading) {
  return (
    <Page>
      <Header />
      <Spinner />
    </Page>
  );
}
return (
  <Page>
    <Header />
    <Content />
  </Page>
);
```

Duplicating `<Page><Header />` is harmless when the branches are semantically distinct.
The question is: **“Does the duplication represent one invariant UI structure that should remain structurally shared?”**

---

## 22. The Dangerous “DRY JSX” Reflex

Do not create complex JSX fragment variables solely to eliminate minor visual duplication. Optimize for semantic clarity, not minimum line count.

---

## 23. Wrapper Elements Are Not Free

`<div><Button /><Button /></div>` creates an actual host DOM node.
`<><Button /><Button /></>` introduces zero DOM nodes.
Every JSX wrapper should have a layout or semantic reason to exist.

---

## 24. Semantic HTML Still Matters

- Avoid: `<div onClick={submitOrder}>Submit</div>`
- Prefer: `<button type="button" onClick={submitOrder}>Submit</button>`

React does not repeal HTML semantics or keyboard accessibility.

---

## 25. JSX and Accessibility

A production JSX review must consider:
`Visual correctness + DOM semantics + Keyboard behavior + Accessible naming + Focus behavior + State communication`.

---

## 26. Data-Driven Rendering

Repeated UI should derive from data collections via `.map()`:

```jsx
const links = [
  { href: "/home", label: "Home" },
  { href: "/products", label: "Products" },
];

return (
  <nav>
    {links.map(link => (
      <a key={link.href} href={link.href}>{link.label}</a>
    ))}
  </nav>
);
```

---

## 27. But Data-Driven Rendering Can Become Too Clever

Avoid turning simple UI into pseudo-programming configuration engines (`config = [ { visible: ctx => ..., action: ctx => ... } ]`). A configuration object becomes harmful when it hides control flow.

---

## 28. JSX and Function Calls

Render-time function invocations (`formatCurrency(price)`) must remain pure, deterministic, and side-effect free.

---

## 29. Render Must Remain Pure

$$\mathbf{props + state \longrightarrow deterministic\ render\ description}$$

Never trigger external network requests, database writes, or analytics tracking directly in the render body.

---

## 30. Production Pattern: View Models

```javascript
const viewModel = createInvoiceViewModel(invoice);
return <Invoice {...viewModel} />;
```

Transforms complex domain records into flat display props before entering JSX.

---

## 31. Prediction-First Walkthrough #1 — Conditional JSX

```jsx
function Panel({ open }) {
  return (
    <section>
      {open ? <Editor /> : <Preview />}
    </section>
  );
}
```

When `open` flips `false ➔ true`: `Preview` is unmounted and destroyed; `Editor` mounts fresh. State is not preserved across different element types.

---

## 32. Prediction-First Walkthrough #2 — Stable Component Type

```jsx
function Panel({ mode }) {
  return (
    <section>
      <Editor mode={mode} />
    </section>
  );
}
```

`Editor` element type remains stable. Only props change (`mode="view" ➔ mode="edit"`). React preserves Fiber instance and local state.

---

## 33. Prediction-First Walkthrough #3 — Wrapper Refactor

- Version A: `<Panel><Editor /></Panel>` $\to$ `Panel └── Editor`
- Version B: `<Panel><div><Editor /></div></Panel>` $\to$ `Panel └── div └── Editor`

Adding `<div>` changes tree topology and reset reconciliation paths. A JSX refactor is not always “just formatting.”

---

## 34. Production Anti-Pattern Teardown #1 — Giant JSX Expression

### Flawed
Embedding authorization, validation, filtering, sorting, and discount calculation inline in one expression.

### Senior Refactor
Compute `canManage` and `visibleItems` before JSX; render a clean `visibleItems.map()`.

---

## 35. Production Anti-Pattern Teardown #2 — Nested Ternary Pyramid

### Flawed
`loading ? <A /> : error ? <B /> : empty ? <C /> : <D />`

### Senior Refactor
Use explicit `if / else if` blocks or a `switch (status)` construct.

---

## 36. Production Anti-Pattern Teardown #3 — Side Effects During JSX Evaluation

### Flawed
`function Component({ user }) { trackView(user.id); return <div />; }`

### Senior Refactor
Move `trackView` into a `useEffect` hook or explicit event handler.

---

## 37. Production Anti-Pattern Teardown #4 — Component-as-Configuration-Engine

### Flawed
A single component taking 20 boolean flags for every header/footer permutation.

### Senior Refactor
Use compound composition (`<Panel.Header>`, `<Panel.Body>`, `<Panel.Footer>`).

---

## 38. Production Anti-Pattern Teardown #5 — Render Helper With Hidden Dependencies

### Flawed
`function renderMenu()` closing over 10 variables from the parent render body.

### Senior Refactor
Extract to a dedicated `<Menu />` component with an explicit prop interface.

---

## 39. Production Anti-Pattern Teardown #6 — Premature JSX Abstraction

### Flawed
Creating `<UserLabel>` that only returns `<span>{name}</span>`.

### Senior Refactor
Inline `<span>{name}</span>` until meaningful ownership emerges.

---

## 40. JSX Architecture: Three Useful Levels

```text
Level 1 — Preparation ──▶ derive data / interpret state
Level 2 — Decision    ──▶ choose UI branch (early return / if)
Level 3 — Description ──▶ return declarative JSX
```

---

## 41. JSX and Identity — Production Refactor Warning

Wrapping `{authenticated ? <Dashboard /> : <Login />}` inside `<Page>` alters the parent structural context and can affect reconciliation.

---

## 42. JSX Review Heuristic

1. **Structure:** Is the DOM tree intentional?
2. **Logic:** Are business rules hidden inside markup?
3. **Identity:** Did this change element types, wrappers, or keys?
4. **Composition:** Does this use composition over prop explosion?
5. **Semantics:** Are native HTML tags used appropriately?

---

# Layer 3 — 🧪 Diagnostic Labs & DevTools Profiling

## 43. React DevTools Render Inspection

- Inspect component hierarchy, props, and state.
- Enable: *Highlight updates when components render*.
- Enable: *Record why each component rendered*.

---

## 44. React Profiler Runbook

1. **Commit count:** How many commits occurred?
2. **Component duration:** Which components consumed disproportionate render time?
3. **Trigger:** What triggered the render (props, state, parent)?
4. **Identity:** Did unstable keys cause unexpected remounts?

---

## 45. Diagnostic Instrumentation

```javascript
function useRenderCount(name) {
  const count = React.useRef(0);
  count.current += 1;
  console.table({
    component: name,
    renderCount: count.current,
  });
}
```

---

## 46. JSX Branch Instrumentation

```javascript
const mode = getMode(state);
console.table({
  loading,
  hasError: Boolean(error),
  itemCount: items.length,
  mode,
});
```

---

## 47. DOM Inspection Runbook

Inspect Chrome DevTools **Elements** panel:
- Check for unnecessary wrapper `<div>` nodes.
- Verify semantic HTML elements (`<button>`, `<main>`, `<article>`).
- Observe node replacement vs in-place mutation.

---

## 48. Production Diagnostic Pattern

```text
Observed symptom
    │
    ▼ DOM changed?
    ├── Yes ──▶ inspect structure
    ▼ Component identity changed?
    ├── Yes ──▶ inspect type/key/position
    ▼ Props changed?
    ├── Yes ──▶ inspect parent data flow
    ▼ State changed?
    ├── Yes ──▶ inspect state ownership
    ▼ Render branch changed?
    └── inspect conditional topology
```

---

## 49. Master Execution Timeline

```text
User / external trigger
    │
    ▼ State / props update
    │
    ▼ Schedule update
    │
    ▼ Render Phase (evaluate components & JSX)
    │
    ▼ Reconciliation (compare types, keys, children)
    │
    ▼ Commit Phase (DOM Mutation)
    │
    ▼ Browser Layout / Paint
    │
    ▼ Passive Effects
```

---

## 50. Fiber & Memory Reality

```text
Fiber
 ├── type
 ├── key
 ├── pendingProps
 ├── memoizedProps
 ├── memoizedState
 ├── child
 ├── sibling
 └── return
```

`JSX source ──▶ React element object ──▶ Fiber ──▶ committed DOM`.

---

## 51. Current Tree vs Work-in-Progress Tree

```text
CURRENT: App └── Panel └── Editor
                   │ update
WIP:     App └── Panel └── Preview
```

The JSX returned is input to calculating the Work-in-Progress tree.

---

## 52. Production Scenario — “I Only Changed JSX”

Changing `<Panel><Editor /></Panel>` to `<Panel><section><Editor /></section></Panel>` alters tree topology: `Panel └── Editor` $\to$ `Panel └── section └── Editor`. Inspect tree consequences, not just visual screenshots.

---

# Layer 4 — 🔥 The Crucible

## 53. Prediction Challenge #1 — `&&`

```javascript
function Badge({ count }) {
  return <div>{count && <span>{count}</span>}</div>;
}
```
For `count = 0`: JavaScript evaluates `0 && <span>0</span>` $\to$ `0`. React renders `<div>0</div>`.

---

## 54. Prediction Challenge #2 — Ternary Replacement

`return mode === "edit" ? <Editor /> : <Viewer />;`
Parent is `main`. Child type flips `Viewer ➔ Editor`. Child is **replaced** (unmounted and remounted), destroying local state.

---

## 55. Prediction Challenge #3 — Wrapper Refactor

Adding `<div>` between `Panel` and `Editor` alters structural hierarchy, affecting CSS flexbox, accessibility tree, and reconciliation identity paths.

---

## 56. Prediction Challenge #4 — Composition

```jsx
<Card>
  <Editor />
</Card>
```
- Caller owns `Editor` instantiation and data inputs.
- `Card` owns container layout and decides where `props.children` is rendered.
- `Card` does not control `Editor`'s internal state.

---

## 57. Prediction Challenge #5 — Conditional Wrapper

- Version A: `<main>{enabled && <Editor />}</main>`
- Version B: `<main>{enabled && <div><Editor /></div>}</main>`

Version B introduces an extra `HTMLDivElement` into the DOM, altering flex/grid layout and accessibility tree depth.

---

## 58. Prediction Challenge #6 — Logic Placement

In an order list:
- **Presentation:** Rendering `<Order />`
- **Data Transformation:** Sorting and filtering
- **Domain Logic:** Discount calculation based on VIP tiers
- **Refactoring:** Extract data filtering and domain discount calculation outside JSX.

---

## 59. Production Incident Runbook #1 — State Disappears After JSX Cleanup

- **Symptom:** Adding a wrapper `<div>` resets child form state.
- **Investigation:** Inspect React DevTools tree to confirm position/type hierarchy changes.
- **Fix:** Remove unnecessary wrapper or use `<React.Fragment>`.

---

## 60. Production Incident Runbook #2 — Component Became Unreadable

- **Symptom:** Component has 10 nested ternaries and filters inline.
- **Fix:** Separate into Level 1 (Preparation), Level 2 (Decision), Level 3 (Description).

---

## 61. Production Incident Runbook #3 — Generic Component Configuration Explosion

- **Symptom:** `<Widget showHeader showFooter layout="grid" compact ... />`
- **Fix:** Refactor into compound composition components (`<Widget.Header>`, `<Widget.Body>`).

---

## 62. Engineering Decision Matrix

| Situation | Preferred Approach |
| :--- | :--- |
| Simple value display | Inline JSX expression |
| Simple boolean presence | `&&` |
| Simple two-way choice | Ternary |
| 3+ meaningful states | `if` / `switch` / explicit state mapping |
| Whole component mode changes | Early return |
| Complex transformation | Local variable / helper |
| Reused domain transformation | Dedicated function |
| Meaningful UI responsibility | Component |
| Structural customization | Composition |
| Repeated collection | `.map()` with stable keys |
| Decorative grouping | Fragment where appropriate |
| Semantic grouping | Real HTML element |
| Huge render helper | Reconsider component boundary |
| Configuration explosion | Composition or redesign |
| Business rules inside JSX | Extract domain / view-model logic |
| Side effects during render | Move to correct effect / event boundary |
| Tiny duplication | Keep if clearer |
| Large repeated structure | Consider abstraction |

---

## 63. Senior Interview Gotchas

1. **"JSX is HTML."** $\to$ False. JSX is an ECMAScript syntax extension for element descriptions.
2. **"If two components render in the same position, state is preserved."** $\to$ False. Type and key dictate identity.
3. **"Adding a wrapper is harmless."** $\to$ False. It modifies tree topology and DOM structure.
4. **"You should never use logic inside JSX."** $\to$ False. Simple expressions are fine; complex domain logic should be extracted.
5. **"Everything duplicated in JSX must be abstracted."** $\to$ False. Premature abstraction harms readability.
6. **"`children` is special DOM behavior."** $\to$ False. It is an ordinary prop passed to components.
7. **"A function returning JSX is a component."** $\to$ False. It is a render helper executing in the parent frame.
8. **"If the screen looks identical, the refactor is behaviorally identical."** $\to$ False. Identity, focus, and state lifecycles can differ.

---

## 64. 35-Point Completion Checklist

- [x] Explain JSX as a declarative UI description.
- [x] Distinguish JSX from HTML and DOM nodes.
- [x] Understand when to use `&&` vs Ternaries vs `switch`.
- [x] Know why `0 && <UI />` traps on numeric 0.
- [x] Distinguish presentation logic from business policy.
- [x] Design composition-oriented APIs using `props.children`.
- [x] Recognize wrapper-induced tree regressions.
- [x] Profile components using React DevTools Profiler.
- [x] Distinguish visual equivalence from structural tree equivalence.

---

## 65. Final Crucible: Architectural Review & Refactor

```jsx
// ❌ Flawed Original Dashboard
function Dashboard({ user, loading, error, orders, selectedTab }) {
  return (
    <div>
      {user ? (
        user.permissions.includes("admin") ? (
          <AdminHeader user={user} />
        ) : (
          <UserHeader user={user} />
        )
      ) : (
        <LoginHeader />
      )}
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorMessage error={error} />
      ) : orders.length === 0 ? (
        <Empty />
      ) : (
        <div>
          {orders
            .filter(order => order.active)
            .sort((a, b) => b.total - a.total)
            .map(order => (
              <OrderRow
                key={order.id}
                order={order}
                discount={
                  user?.isVip ? (order.total > 1000 ? 0.2 : 0.1) : 0
                }
              />
            ))}
        </div>
      )}
      {selectedTab === "settings" && (
        <div>
          <Settings user={user} />
        </div>
      )}
    </div>
  );
}
```

### ✅ Senior Architectural Refactor

```javascript
// 1. Domain / View-Model Extraction
function calculateDiscount(user, total) {
  if (!user?.isVip) return 0;
  return total > 1000 ? 0.2 : 0.1;
}

function getVisibleOrders(orders) {
  return orders
    .filter(order => order.active)
    .sort((a, b) => b.total - a.total);
}

// 2. Component Refactor with Explicit Levels
function Dashboard({ user, loading, error, orders, selectedTab }) {
  // Level 1: Derived Data
  const visibleOrders = getVisibleOrders(orders);

  // Level 2: Subtree Decision Logic
  function renderHeader() {
    if (!user) return <LoginHeader />;
    if (user.permissions.includes("admin")) return <AdminHeader user={user} />;
    return <UserHeader user={user} />;
  }

  function renderContent() {
    if (loading) return <Spinner />;
    if (error) return <ErrorMessage error={error} />;
    if (visibleOrders.length === 0) return <Empty />;
    return (
      <main className="order-list">
        {visibleOrders.map(order => (
          <OrderRow
            key={order.id}
            order={order}
            discount={calculateDiscount(user, order.total)}
          />
        ))}
      </main>
    );
  }

  // Level 3: Declarative Projection
  return (
    <div className="dashboard-layout">
      {renderHeader()}
      {renderContent()}
      {selectedTab === "settings" && <Settings user={user} />}
    </div>
  );
}
```

---

## 66. Senior-Level Synthesis

```text
APPLICATION STATE
       │
       ▼
DOMAIN INTERPRETATION
       │
       ▼
VIEW DECISIONS
       │
       ▼
      JSX
       │
       ▼
REACT ELEMENT OBJECTS
       │
       ▼
   FIBER TREE
       │
       ▼
 RECONCILIATION
       │
       ▼
     COMMIT
       │
       ▼
    DOM TREE
       │
       ▼
BROWSER PRESENTATION
```

The senior engineer's responsibility is to ensure JSX communicates what the UI is, what state it represents, what structure it creates, and what identity it preserves.

---

## 67. One-Minute Revision

```text
1. JSX describes UI; it is not HTML.
2. Keep simple expressions inline.
3. Extract complexity, not syntax.
4. Use ternaries for simple two-way choices.
5. Use explicit control flow for complex state machines.
6. Early returns are often clearer for mutually exclusive modes.
7. children is a prop.
8. Composition is often better than configuration explosion.
9. A wrapper changes the tree.
10. Visual equivalence does not guarantee structural equivalence.
11. Do not put side effects in render.
12. Business policy should not disappear inside JSX punctuation.
13. Do not abstract every duplicated line.
14. A function returning JSX is not automatically a component.
15. Component extraction should represent meaningful ownership.
16. Data-driven rendering is powerful, but configuration can become a hidden programming language.
17. Every DOM wrapper should have a reason.
18. JSX refactoring can affect identity, CSS, accessibility, focus, and state.
19. React DevTools should be used to verify assumptions.
20. The best JSX is not the cleverest JSX. It is the JSX whose resulting UI tree is easiest to reason about.
```

---

# 🎓 KPI 02 Completion

With Parts 01–05 complete, **KPI 02 — JSX & React Elements** is 100% complete across all 15 pillars.

The curriculum progression continues:

```text
KPI 01 — React Mental Model
        ↓
KPI 02 — JSX & React Elements ✅ (COMPLETED)
        ↓
KPI 03 — Components, Props & Composition
        ↓
KPI 04 — State & User Interaction
        ↓
...
```

---

[⬅️ Previous Part: Trees, Identity & Collections](./04-lists-and-keys-foundations.md) | [📚 KPI 02 Index](./README.md) | [🧪 Companion Lab](./examples/05-jsx-production-patterns-lab.html) | [Level 06 Master Hub ➡️](../README.md)
