Level 06 — React Fundamentals
KPI 03 — Components, Props & Composition
PART 11 — Context, State Distribution & Avoiding Prop Drilling
[⬅️ Previous Part](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/10-controlled-components.md) | [📚 Level 06 Index](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/README.md) | [🧪 Companion Lab](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/examples/11-context-state-distribution.html) | [Next Part ➡️](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/12-component-composition-patterns.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

PART PURPOSE
Context is frequently misunderstood as:
“React's global state system.”
That is too broad.
Context is primarily a dependency-distribution mechanism.
It allows a component to receive a value from an ancestor without requiring every intermediate component to explicitly relay that value through props.

The architectural model is:
WITHOUT CONTEXT
Provider/Owner
│
▼ Layer A
│
▼ Layer B
│
▼ Layer C
│
▼ Consumer

versus:

WITH CONTEXT
Provider
│
│ context value
├──────────────► Consumer A
├──────────────► Consumer B
└──────────────► Consumer C

But Context does not eliminate ownership.
The critical distinction is:
state ownership ≠ state distribution
A component can own state while Context distributes access to that state.

LAYER 1 — ⚡ 30-SECOND EXECUTIVE CHEAT SHEET & CORE MENTAL MODELS
1. Core Mental Model
STATE OWNER
│
▼ Provider
│ context value
┌──────────────┼──────────────┐
▼              ▼              ▼
Consumer A   Consumer B   Consumer C

Context changes how a value travels through the component tree.
It does not inherently determine:
who owns the value
where the value comes from
how the value changes
whether the value is global
whether the value should be state at all

2. Executive Concept Table
Concept | Core Mechanism | Production Impact | Common Senior Trap
--- | --- | --- | ---
Context | Ancestor-provided dependency available to descendants | Removes unnecessary prop relay | Treating Context as global state
Provider | Supplies context value | Defines distribution boundary | Putting everything in one provider
Consumer | Reads nearest provider's value | Explicit dependency | Forgetting dependency exists
useContext | Reads context during render | Direct descendant access | Treating it as a state-management primitive
Prop drilling | Passing props through non-consuming layers | Can create coupling | Assuming all prop chains are bad
State ownership | Determines authority over data | Preserves correctness | Confusing provider with owner
Context value | Distributed value | Enables shared access | Putting unstable/huge objects into one context
Provider boundary | Scope of dependency | Limits visibility | Making provider scope unnecessarily broad
Composition | Passes elements/components structurally | Often avoids drilling | Reaching for Context before composition
Context default | Fallback value when no provider exists | Can simplify APIs | Using misleading defaults
Nested providers | Nearest provider wins | Enables scoped overrides | Forgetting shadowing semantics

3. Golden Rule
Use Context when a dependency must be available across a subtree and passing it explicitly through intermediate components would create unnecessary coupling. Do not use Context merely because multiple components need state.

A stronger architecture model:
Need sharing?
│
├── No ───────► keep local
│
└── Yes
    │
    ▼
Can explicit props express ownership clearly?
    │
 ┌──┴──┐
YES   NO / excessive relay
 │     │
 ▼     ▼
props Context

And even then:
Context distribution ↓ does not answer ↓ state ownership

4. The Four Concepts You Must Not Confuse
STATE ↓ authoritative mutable information
PROPS ↓ explicit parent → child inputs
CONTEXT ↓ ancestor → descendant dependency distribution
COMPOSITION ↓ structural dependency injection through children/elements

These solve related but different problems.

LAYER 2 — 🔬 DEEP MECHANICAL BREAKDOWN
5. What Problem Does Context Solve?
Consider:
App
└── Page
    └── Layout
        └── Sidebar
            └── Navigation
                └── UserMenu

Suppose UserMenu needs:
currentUser

Without Context:
App ↓ user
Page ↓ user
Layout ↓ user
Sidebar ↓ user
Navigation ↓ user
UserMenu

Intermediate components may not actually consume the value.
This is the classic prop-relay chain.

Context can instead establish:
App
└── UserProvider
    └── Page
        └── Layout
            └── Sidebar
                └── Navigation
                    └── UserMenu

and:
UserProvider
│
└──────► UserMenu

without every intermediate component declaring:
user={user}

6. Context Is Dependency Injection
A useful mental model:
Provider
│
└── supplies dependency
    │
    ▼ consumer

The consumer says:
const user = useContext(UserContext);

Conceptually:
“I require the current user dependency from my ancestor environment.”
This is closer to dependency injection than to a complete state-management architecture.

7. Creating a Context
Basic model:
const UserContext = createContext<User | null>(null);

Provider:
function UserProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);

  return (
    <UserContext.Provider value={user}>
      {children}
    </UserContext.Provider>
  );
}

Consumer:
function UserMenu() {
  const user = useContext(UserContext);
  return <span>{user?.name}</span>;
}

The ownership remains:
UserProvider └── user state

Context provides:
distribution
not necessarily:
ownership

8. Provider vs State Owner
This distinction is fundamental.
You can have:
Provider
│
└── receives value from parent

Example:
function ThemeProvider({ theme, children }: Props) {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

Here:
ThemeProvider
distributes the value but does not own it.

Therefore:
Provider ≠ automatically state owner

9. Provider as State Owner
A provider may also own the state:
function CartProvider({ children }: Props) {
  const [cart, setCart] = useState<Cart>(initialCart);

  return (
    <CartContext.Provider value={{ cart, setCart }}>
      {children}
    </CartContext.Provider>
  );
}

Now:
CartProvider
├── owns cart
└── distributes cart

This is common.
But do not infer:
“If something uses Context, its provider must own its state.”
That is not required.

10. The Nearest Provider Rule
Suppose:
App
└── ThemeProvider("dark")
    └── Page
        └── ThemeProvider("light")
            └── Button

Button reads the nearest matching provider.
Conceptually:
Button ↑ nearest ThemeProvider ↑ "light"
not:
App-level provider "dark"

This enables scoped context values.

11. Prediction-First Walkthrough — Context Read
Consider:
const ThemeContext = createContext("light");

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Button />
    </ThemeContext.Provider>
  );
}

function Button() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>Click</button>;
}

Render #1:
Provider establishes:
ThemeContext = "dark"

Button reads:
theme = "dark"

Rendered result:
<button class="dark">

The value was not passed through props.
It was obtained through the context dependency.

12. Prediction-First Walkthrough — Provider Update
Suppose:
function App() {
  const [theme, setTheme] = useState("light");

  return (
    <ThemeContext.Provider value={theme}>
      <Button />
    </ThemeContext.Provider>
  );
}

Render #1:
App.theme = "light"
Consumer:
Button.theme = "light"

User changes theme:
setTheme("dark")

Render #2:
App.theme = "dark"
Provider now supplies:
"context value = dark"
Consumers reading that context can observe the updated value.

The important architecture remains:
App owns state
Provider distributes state
Button consumes state

13. Context Does Not Remove One-Way Data Flow
Context still follows an ancestor → descendant relationship.
Provider ↓ Consumer

The consumer cannot magically mutate the provider's state unless the provider exposes an appropriate operation.

For example:
value={{
  theme,
  setTheme,
}}
gives descendants:
theme
setTheme

The flow is still conceptually:
state ↓ context ↓ consumer ↓ event/action ↓ state owner

This is still one-way data flow.

14. Context and Actions
Instead of exposing raw setters:
value={{
  user,
  setUser,
}}

a domain-oriented API may expose:
value={{
  user,
  signIn,
  signOut,
}}

Now consumers interact through semantic operations.
Consumer
│
├── signIn(...)
└── signOut()
│
▼ state owner

This can preserve better encapsulation.
The same principle from component callback design applies at a broader distribution boundary.

15. Context Does Not Mean Global
A context can be narrowly scoped:
Checkout
└── CheckoutProvider
    ├── AddressForm
    ├── ShippingOptions
    └── OrderSummary

The state is shared across the checkout subtree but may have no relevance to:
Header
Footer
MarketingPage

Therefore:
Context ≠ application-global
Context scope is determined by provider placement.

16. Provider Placement Is an Architectural Decision
Compare:

Broad provider:
App
└── CartProvider
    ├── Header
    ├── Dashboard
    ├── Settings
    └── Footer

versus:

Narrow provider:
App
├── Header
├── Dashboard
│   └── CartProvider
│       ├── CartPanel
│       └── Checkout
└── Footer

The second communicates:
cart dependency belongs to Dashboard subtree
The first communicates:
cart dependency belongs to entire application

Choose intentionally.

17. Context vs Prop Drilling
Prop drilling:
A ↓ B ↓ C ↓ D

Context:
A
│
└──────────────► D

But the presence of a prop chain does not automatically justify Context.

Consider:
Parent
└── Card
    └── Header
        └── Button

If:
Parent
passes one meaningful value to:
Card
then explicit props may be clearer.

Context becomes more compelling when:
many intermediate layers + multiple consumers + dependency is conceptually shared

18. Prop Drilling Is Not Automatically Bad
This:
<Page user={user} />
is often excellent.

So is:
<Page>
  <UserMenu user={user} />
</Page>

The issue is not:
number of prop levels
by itself.

The issue is:
unnecessary coupling

An intermediate component that legitimately needs the value should receive it.
An intermediate component that exists only as a relay may be a candidate for composition or Context.

19. Composition Before Context
Suppose:
Page
└── Layout
    └── Sidebar
and Layout does not need to know about:
user

Instead of:
<Layout user={user} />

consider:
<Layout>
  <UserMenu user={user} />
</Layout>

Now:
Layout
does not depend on:
User
at all.

This is often architecturally superior to introducing Context.

20. Context vs Composition
Requirement | Props | Composition | Context
--- | :---: | :---: | :---:
Direct parent-child input | ✅ | Maybe | ❌
Avoid one relay layer | Maybe | ✅ | Maybe
Deep descendant dependency | ❌ | Maybe | ✅
Many consumers across subtree | Maybe | Maybe | ✅
Explicit API desired | ✅ | ✅ | Less explicit
Dependency should be visible at call site | ✅ | ✅ | ❌
Scoped ambient dependency | ❌ | Maybe | ✅

21. Context Default Values
Consider:
const ThemeContext = createContext("light");

If no provider exists:
function Button() {
  const theme = useContext(ThemeContext);
}
the consumer receives:
"light"
as the default.

This can be useful.
But there is a danger.
If "light" is not a legitimate fallback and merely hides configuration mistakes, a stricter design can use:
const ThemeContext = createContext<ThemeContextValue | null>(null);

and a custom hook:
function useTheme() {
  const value = useContext(ThemeContext);
  if (value === null) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return value;
}

Now missing provider configuration fails explicitly.

22. Context as an Architectural Dependency
A consumer using:
useContext(UserContext)
has a dependency:
UserContext
even though it is not represented in ordinary props.

This means Context can make dependencies:
less visible at the call site

That is both its power and its cost.

Props:
<Component user={user} />
make dependencies explicit.

Context:
<Component />
may conceal that:
Component └── requires UserContext

Senior engineers must account for this hidden coupling.

23. Context Anti-Pattern — “Everything Context”
Bad:
AppProvider
├── user
├── theme
├── modal
├── search
├── cart
├── notifications
├── form
├── filters
└── random UI flags

Why it happens:
“Context avoids prop drilling.”

Mechanical problem:
unrelated concerns
↓
single distribution boundary
↓
large dependency surface
↓
harder reasoning

Use separate contexts/boundaries where the domains are actually separate.

24. Context Anti-Pattern — One Giant Context Object
Example:
const AppContext = createContext({
  user,
  theme,
  cart,
  notifications,
  search,
  filters,
});

Now a consumer interested only in:
theme
depends on an enormous conceptual object.

The architecture becomes:
ThemeConsumer
↓
AppContext
↓
entire application dependency surface

A more deliberate design may use separate contexts:
UserContext
ThemeContext
CartContext
when the domains and lifetimes are independent.

25. Context Anti-Pattern — Context as a Database
Context should not become:
remote persistence
database
cache
domain store

Context distributes values.
It does not automatically provide:
persistence
server synchronization
caching
normalization
transactions
cross-tab synchronization
Those are different architectural problems.

26. Context and State Ownership
Consider:
function CartProvider({ children }: Props) {
  const [cart, setCart] = useState<Cart>(initialCart);

  return (
    <CartContext.Provider value={{ cart, setCart }}>
      {children}
    </CartContext.Provider>
  );
}

The architecture is:
CartProvider ├── owns cart
│
└── distributes cart
    │
    ├── CartIcon
    ├── CartDrawer
    └── Checkout

This is a legitimate shared-state boundary because:
multiple descendants + same conceptual domain + shared coordination
exist.

27. Context Does Not Automatically Solve State Design
Suppose:
value={{
  firstName,
  lastName,
  email,
  password,
  temporaryModal,
  hoverState,
  randomFlag,
}}

Putting poorly designed state into Context does not improve the state model.
You still need:
correct ownership
minimal state
derived values
semantic actions
clear boundaries

Context distributes architecture.
It does not repair architecture.

28. Context and State Lifetime
Provider placement determines which subtree can access the context.
Provider lifecycle also affects the lifetime of provider-owned state.

Provider mounted
↓
state exists
↓
Provider unmounted
↓
provider-owned state disappears

Therefore moving a Provider can change:
state lifetime
dependency scope
identity boundaries

This is an architectural refactor, not merely a wrapper change.

29. Prediction Challenge — Provider Remount
Suppose:
App
└── FeatureProvider
    └── Feature
and FeatureProvider owns:
draft

If a refactor causes the provider itself to unmount and remount:
old FeatureProvider ↓ old draft disappears
new FeatureProvider ↓ new initial draft

If the draft must survive that boundary, ownership is too low or the provider lifecycle is incorrect.

30. Nested Provider Prediction
Consider:
ThemeProvider("dark")
└── Page
    └── ThemeProvider("light")
        └── Button

Button reads:
"light"
because the nearest provider shadows the outer value.

This is useful for scoped configuration:
Application theme = dark
Dialog theme = light
but nested providers should remain intentional.

31. Context and Callbacks
A context value may contain:
{ value, onChange }

Conceptually:
Consumer
├── reads value
└── invokes action
    ↓ owner

This can produce a shared domain API:
Context
├── state
└── semantic operations

That pattern is often cleaner than exposing raw state setters.

32. Context and Event Flow
Even with Context:
User interaction
↓
Consumer event handler
↓
Context action
↓
state owner
↓
state update
↓
render
↓
context value
↓
consumers

The fundamental React programming model remains intact.
Context changes the distribution path, not the fundamental update lifecycle.

33. Production Incident — Consumer Has Wrong Value
Symptoms:
Component expects theme = dark but receives light

Investigation:
1. Which Context object is being consumed?
2. Is the consumer beneath the expected Provider?
3. Is there a nested Provider?
4. Which provider is nearest?
5. Did provider placement change?
6. Did a provider remount?

A common cause is accidental provider shadowing.

34. Production Incident — Context Dependency Missing
Symptom:
useUser() crashes outside UserProvider

This is often desirable.
The architecture says:
UserMenu requires UserContext
The failure is explicit rather than silently producing invalid behavior.
A strict custom hook can turn an implicit dependency into a clear runtime invariant.

35. Production Incident — Context Used to Avoid a Two-Level Prop
Architecture:
Parent
└── Child
    └── Grandchild

A value travels:
Parent → Child → Grandchild

Developer introduces Context.
But only one consumer exists.

Now:
Context declaration
Provider
custom hook
consumer
has been introduced for a dependency that could have been:
<Child value={value} />

This is architectural overengineering.
The number of props avoided is not the only metric.
Consider:
API explicitness
dependency visibility
lifetime scope
reusability
complexity

36. Production Incident — Provider Too High
Suppose:
App
└── ThemeProvider
    └── entire application
but the theme only applies to:
Checkout

Now unrelated application regions implicitly depend on a checkout-specific context.
Move the provider closer:
App
├── Home
└── Checkout
    └── ThemeProvider

Provider placement becomes clearer.

37. Production Incident — Provider Too Low
Opposite case:
Dashboard
├── Header
├── Sidebar
└── Content

All three require:
DashboardContext
but the provider is placed inside:
Content

Header and Sidebar cannot consume it.
Move the provider to the appropriate common boundary:
Dashboard
└── DashboardProvider
    ├── Header
    ├── Sidebar
    └── Content

38. DevTools Diagnostic Lab
When debugging Context:
Inspect the component tree
Find:
Provider
and identify:
provider placement
consumer placement
nested providers

Then trace:
state owner
↓
provider
↓
consumer

Ask:
Who owns the value?
Who distributes it?
Who consumes it?
Who changes it?

These may be four different responsibilities.

39. Context Dependency Inventory
For a production feature, create:
Context: ________________
Provider: ________________
State owner: ________________
Consumer(s): ________________
Actions: ________________
Provider scope: ________________
Expected lifetime: ________________
Nested overrides: ________________
Fallback behavior: ________________

If you cannot answer these questions, the Context boundary is probably insufficiently designed.

40. Context Decision Matrix
Situation | Prefer
--- | ---
Direct parent-child dependency | Props
Small explicit data flow | Props
Intermediate component legitimately consumes value | Props
Deep subtree dependency | Context
Many consumers in one feature subtree | Context
Shared configuration | Context
Theme-like dependency | Context
Localization-like dependency | Context
Need to preserve explicit API | Props/composition
Only trying to avoid one prop | Usually props
Application-wide server cache | Not merely Context
Complex domain state | Consider dedicated state architecture

41. Senior Gotchas
Gotcha 1:
“Context is global state.”
No.
Context is scoped by provider placement.

Gotcha 2:
“The provider owns the state.”
Not necessarily.
It may merely distribute a value received from elsewhere.

Gotcha 3:
“Context eliminates one-way data flow.”
No.
It changes distribution, not the fundamental directional model.

Gotcha 4:
“Prop drilling is always bad.”
No.
Explicit data flow is often preferable.

Gotcha 5:
“Context is always better than props for shared data.”
No.
Context introduces implicit dependency coupling.

Gotcha 6:
“Context solves state management.”
Only partially, if the provider also owns state.
Context itself does not provide persistence, caching, server synchronization, or complex state semantics.

Gotcha 7:
“One AppContext is cleaner.”
Usually it creates a giant dependency boundary.

Gotcha 8:
“Moving a Provider is harmless.”
No.
Provider placement can change:
scope
lifetime
identity
dependency availability

Gotcha 9:
“Default context values should always be real application defaults.”
No.
A strict failure for missing providers can be more correct.

42. 🔥 THE CRUCIBLE
Challenge 1 — Prop Drilling
App
└── Page
    └── Layout
        └── Panel
            └── UserMenu

Only UserMenu needs:
user

Evaluate:
props
composition
context

Which is most appropriate and why?

Challenge 2 — Provider Ownership
A provider receives:
<UserProvider user={user}>
Does UserProvider necessarily own user?
Explain.

Challenge 3 — Nearest Provider
Predict:
ThemeProvider("dark")
└── Page
    └── ThemeProvider("light")
        └── Button

What does Button receive?
Why?

Challenge 4 — Context Overuse
A developer creates Context to pass:
title
from a parent to its immediate child.
Is Context justified?
Defend your answer.

Challenge 5 — Provider Placement
Which is more appropriate for checkout-only state?
App
└── CheckoutProvider
    └── entire application
or:
App
└── Checkout
    └── CheckoutProvider
        ├── Address
        ├── Shipping
        └── Summary
Why?

Challenge 6 — Ownership vs Distribution
Consider:
App owns cart
↓
CartProvider distributes cart
↓
CartButton consumes cart

Identify:
owner
provider
consumer

Why is it dangerous to treat these as the same concept?

43. FINAL MULTI-RENDER CRUCIBLE
Consider:
const ThemeContext = createContext("light");

function App() {
  const [theme, setTheme] = useState("light");

  return (
    <ThemeContext.Provider value={theme}>
      <Toolbar />
      <Content />
    </ThemeContext.Provider>
  );
}

function Toolbar() {
  const theme = useContext(ThemeContext);
  return <button>{theme}</button>;
}

function Content() {
  const theme = useContext(ThemeContext);
  return <main>{theme}</main>;
}

Render #1:
App state:
theme = "light"

Provider:
context value = "light"

Consumers:
Toolbar.theme = "light"
Content.theme = "light"

Interaction:
Suppose App executes:
setTheme("dark")

Render #2:
App state:
theme = "dark"

Provider:
context value = "dark"

Consumers reading that context can observe:
Toolbar.theme = "dark"
Content.theme = "dark"

The ownership model is:
App
├── owns theme
│
└── Provider
    ├── Toolbar
    └── Content

The Provider is a distribution boundary.
The App remains the state owner.

44. ADVANCED ARCHITECTURAL DISTINCTION
A mature React engineer distinguishes:
OWNERSHIP
│
▼ Who controls it?
│
▼ DISTRIBUTION
│
▼ Who can access it?
│
▼ COORDINATION
│
▼ Who must react to it?
│
▼ LIFETIME
│
▼ How long should it exist?

Context primarily answers:
distribution
It does not automatically answer the other four.

45. CONTEXT ARCHITECTURE REVIEW
Before adding Context, ask:
1. Is this genuinely a subtree-wide dependency?
2. How many consumers exist?
3. Are intermediate components merely relaying the value?
4. Would composition remove the dependency?
5. Would explicit props be clearer?
6. Who owns the underlying state?
7. What is the provider's appropriate scope?
8. What is the provider's lifetime?
9. Is this one coherent domain?
10. Does the context API expose semantic operations?
11. What happens without a provider?
12. Are nested providers intentional?

If the answer to #1 is weak:
Do not add Context merely to remove props.

46. CONTEXT API DESIGN TEMPLATE
For every Context:
Context name: ________________
Purpose: ________________
Underlying state owner: ________________
Provider: ________________
Consumer(s): ________________
Read API: ________________
Write/action API: ________________
Provider scope: ________________
Fallback: ________________
Lifetime: ________________
Nested provider semantics: ________________
Why Context instead of props? ________________
Why Context instead of composition? ________________

This is the level of reasoning expected in production architecture reviews.

47. COMPLETION CHECKLIST
Fundamentals:
[ ] I can explain what Context solves.
[ ] I can distinguish Context from state.
[ ] I can distinguish Context from props.
[ ] I can distinguish Context from composition.
[ ] I understand Context as dependency distribution.
[ ] I understand provider/consumer relationships.

Ownership:
[ ] I can identify the actual state owner.
[ ] I know a Provider does not necessarily own state.
[ ] I can separate ownership from distribution.
[ ] I can separate distribution from mutation.

Scope:
[ ] I understand provider scoping.
[ ] I understand nearest-provider lookup.
[ ] I understand nested provider shadowing.
[ ] I can choose an appropriate provider boundary.
[ ] I understand that provider placement affects lifecycle.

API design:
[ ] I can design a context value.
[ ] I can distinguish state from semantic actions.
[ ] I can avoid unnecessary raw setter exposure.
[ ] I can design strict missing-provider behavior.
[ ] I can avoid giant context objects.

Architecture:
[ ] I can recognize unnecessary prop drilling.
[ ] I know prop drilling is not automatically bad.
[ ] I can evaluate composition before Context.
[ ] I can determine when Context is justified.
[ ] I can avoid using Context as a generic database.
[ ] I can scope Context to a feature when appropriate.

Debugging:
[ ] I can find the nearest Provider.
[ ] I can diagnose incorrect provider placement.
[ ] I can diagnose accidental nested-provider shadowing.
[ ] I can trace owner → provider → consumer.
[ ] I can identify hidden Context dependencies.

Senior reasoning:
[ ] I can defend Context usage in a code review.
[ ] I can explain why props may be preferable.
[ ] I can explain why composition may be preferable.
[ ] I can explain why Context does not solve state architecture.
[ ] I can predict Context behavior across renders.
[ ] I can reason about provider lifetime and state lifetime.

48. PART COMPLETION STANDARD
You have mastered this Part when you can look at:
Component tree + state + props + Context
and immediately distinguish:
WHO OWNS IT?
│
▼ WHO DISTRIBUTES IT?
│
▼ WHO CONSUMES IT?
│
▼ WHO CHANGES IT?
│
▼ WHAT IS ITS SCOPE?
│
▼ WHAT IS ITS LIFETIME?

You should no longer describe Context as:
“A way to avoid prop drilling.”
That is only one consequence.

The stronger definition is:
Context is a mechanism for making an ancestor-provided dependency available to descendants without explicitly threading that dependency through every intermediate component.

49. FINAL ENGINEERING PRINCIPLE
React gives you several ways to move information through a component tree:
           DATA / DEPENDENCY
                   │
    ┌──────────────┼──────────────┐
    ▼              ▼              ▼
  PROPS       COMPOSITION      CONTEXT
    │              │              │
 explicit     structural       ambient/
  input        injection       subtree
                             dependency

Use them deliberately.

Props:
When the dependency is:
local
explicit
direct

Composition:
When the dependency is better represented as:
content
element
behavior injection

Context:
When the dependency is:
deep
subtree-wide
conceptually shared

But above all:
STATE OWNERSHIP
│
▼ still matters
│
┌──────────┴──────────┐
▼                     ▼
props/context      composition

Context does not replace ownership.
It does not replace state modeling.
It does not replace component boundaries.
It does not replace architectural judgment.

Use Context to solve a distribution problem, not to hide an ownership problem.

A senior React engineer should be able to remove Context from an architecture and explain exactly what becomes worse—and also refuse to introduce Context when explicit props or composition produce a clearer dependency graph.
