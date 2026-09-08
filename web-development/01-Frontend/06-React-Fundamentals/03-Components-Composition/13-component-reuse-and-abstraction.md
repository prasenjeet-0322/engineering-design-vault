Level 06 — React Fundamentals
KPI 03 — Components, Props & Composition
PART 13 — Component Reuse, Abstraction Boundaries & Avoiding Over-Engineering
[⬅️ Previous Part](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/12-component-composition-patterns.md) | [📚 Level 06 Index](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/README.md) | [🧪 Companion Lab](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/examples/13-component-reuse-and-abstraction.html) | [Next Part ➡️](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/14-component-testing-and-contracts.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models
1. The Real Problem
Component reuse sounds universally good.
It is not.
A component is useful when its abstraction creates a stable boundary around shared behavior, structure, semantics, or ownership.

Bad reuse creates:
Local requirement
↓
Premature abstraction
↓
Generic component
↓
configuration props
↓
conditional branches
↓
consumer-specific exceptions
↓
hard-to-change API

Good reuse creates:
Repeated stable concept
↓
Shared abstraction
↓
Clear contract
↓
Multiple consumers
↓
Independent evolution

The distinction is crucial.

2. Core Mental Model
             COMPONENT
                 │
        ┌────────┴────────┐
        │                 │
    LOCAL NEED       SHARED NEED
        │                 │
        ▼                 ▼
   Keep it local   Evaluate abstraction
                          │
                 ┌────────┴────────┐
                 │                 │
           Stable concept    Coincidental similarity
                 │                 │
                 ▼                 ▼
          Extract candidate   Keep separate
                 │
                 ▼
          Define contract
                 │
                 ▼
         Validate consumers

The key question is not:
"Can these components share code?"
It is:
"Do these components share a stable concept with the same ownership and change boundary?"

3. Executive Concept Table
Concept | Core Mechanism | Production Impact | Common Senior Trap
--- | --- | --- | ---
Reuse | One abstraction serves multiple consumers | Reduces duplication | Reusing before behavior stabilizes
Abstraction | Hides implementation behind a contract | Controls coupling | Making abstractions broader than needed
Extraction | Moving shared responsibility into a component | Creates a reusable boundary | Extracting by line count
Duplication | Repeated implementation | Can create maintenance cost | Assuming every duplication is bad
Cohesion | Related responsibilities remain together | Improves maintainability | Treating small size as cohesion
Coupling | Consumers depend on implementation/contract | Determines change propagation | Ignoring hidden coupling
Generic component | Abstraction over multiple use cases | Can scale reuse | Becoming a configuration engine
Local component | Encapsulates one feature | Preserves locality | Refusing useful reuse
Premature abstraction | Generalizing before requirements stabilize | Creates rigid APIs | "DRY" as automatic justification
Stable abstraction | Repeated concept with consistent semantics | Safe reuse | Confusing visual similarity with semantic similarity
Change boundary | Things changing together remain together | Reduces blast radius | Extracting things that evolve differently
API surface | Public inputs and extension points | Determines coupling | Exposing implementation details
Specialization | Domain-specific layer over generic primitive | Preserves semantics | Making primitives domain-aware
Over-engineering | Complexity exceeds actual requirement | Slows development | Mistaking sophistication for quality

4. Golden Rule
Abstract stable concepts, not merely repeated syntax.

And:
Duplication is often cheaper than the wrong abstraction.

A senior engineer must be comfortable saying:
"These two implementations look similar, but they should remain separate."

5. What Is Reuse?
Reuse means an existing abstraction serves a new requirement without requiring the abstraction to become distorted.
That last condition matters.

Suppose:
<Button variant="primary">
  Save
</Button>
is reused for:
<Button variant="primary">
  Continue
</Button>

The concept remains:
Button
The abstraction is stable.

But if a new consumer requires:
<Button
  variant="primary"
  workflow="checkout"
  showPaymentIcon
  analyticsCategory="purchase"
  confirmBeforeSubmit
/>
the abstraction may be absorbing domain-specific requirements.
That is a warning sign.

6. Reuse Has Levels
Think in layers:
Level 1: Repeated markup
Level 2: Repeated UI structure
Level 3: Repeated interaction behavior
Level 4: Repeated semantic concept
Level 5: Reusable architectural primitive

Not every repetition should become a component.
For example:
<div className="card">
  <h2>{title}</h2>
</div>
appearing twice does not automatically justify:
<Card />
You need to determine whether "Card" is actually a stable concept in the system.

7. Syntax Similarity Is Not Semantic Similarity
Consider:
function UserCard() {
  return (
    <div className="card">
      <h2>User</h2>
    </div>
  );
}
and:
function InvoiceCard() {
  return (
    <div className="card">
      <h2>Invoice</h2>
    </div>
  );
}

They look similar.
But:
UserCard → user semantics
InvoiceCard → invoice semantics
may evolve independently.

Extracting:
<Card />
may be premature.

8. Semantic Similarity
A stronger signal is:
same visual structure + same interaction behavior + same accessibility contract + same reason to change

Then:
stable concept ↓ reusable API

This is much stronger than:
same JSX shape ↓ extract component

9. The Three Questions Before Extraction
Before creating:
<SharedComponent />
ask:

Question 1: Are the consumers actually solving the same problem?
Question 2: Will they likely change for the same reasons?
Question 3: Can one contract represent both use cases without special cases?

If the answer is:
Yes / Yes / Yes
reuse is promising.

If:
Yes / No / No
duplication may be healthier.

10. Change Boundary as the Primary Test
Suppose:
Component A
Component B
always change together.
They may belong behind one abstraction.

But if:
A changes because billing requirements changed
B changes because profile requirements changed
then shared code can create coupling.

A change to A may accidentally affect B.
That is exactly what a bad abstraction does.

11. The Change Propagation Model
Good abstraction:
Consumer A ───┐
              │
Consumer B ───┼──> Stable abstraction
              │
Consumer C ───┘

Change:
A requirement ↓ A consumer ↓ No impact on B/C

Bad abstraction:
A ───┐
B ───┼──> Giant abstraction
C ───┘    │
          ├── A-specific flag
          ├── B-specific branch
          └── C-specific exception

Now:
A changes ↓ abstraction changes ↓ B/C risk regressions
Coupling has increased.

12. The Configuration Smell
A reusable component often starts clean:
<Input label="Email" />

Then evolves:
<Input label="Email" required error={error} />

Then:
<Input label="Email" required error={error} variant="compact" />

Then:
<Input
  label="Email"
  required
  error={error}
  variant="compact"
  showPasswordToggle
  passwordStrength
  mask
  currency
/>

The component is no longer one abstraction.
It is several abstractions forced into one API.

13. The Consumer-Specific Exception Test
If you repeatedly write:
if (variant === "foo") { ... }
and:
if (variant === "bar") { ... }

ask:
Are these actually one conceptual component?
A healthy abstraction usually has a small number of meaningful variations.
An unhealthy abstraction accumulates consumer-specific exceptions.

14. Abstraction Surface Area
Think of a component API as a surface:
          API SURFACE
  props  ┌──────────────┐
  ───────┤              │
callbacks│              │ slots
  ───────┤              │
         └──────┬───────┘
                │ behavior

Every exposed option becomes a potential compatibility obligation.
Therefore:
Every public prop is a future maintenance decision.
Do not expose a capability merely because it might be useful.

15. Generic Does Not Mean Better
Compare:
<Stack gap={16}>
  ...
</Stack>

with:
<UniversalLayoutEngine
  direction="row"
  justify="space-between"
  align="center"
  wrap
  gap={16}
  responsive
  breakpoint="md"
  columns={...}
  areas={...}
/>

The second may be more configurable.
That does not mean it is architecturally better.
Genericity has a cost:
more API + more states + more documentation + more tests + more compatibility constraints

16. Reuse Should Reduce Total Complexity
A useful test:
complexity_before ↓ complexity_after

If abstraction creates:
less duplication + less conceptual complexity
good.

If it creates:
less duplication + more API complexity + more conditional logic + more coupling
the abstraction may be negative-value reuse.

17. DRY Is Not "Never Duplicate"
DRY is frequently misunderstood.

Bad interpretation:
"Never write the same code twice."

Better:
"Avoid maintaining multiple sources of truth for the same knowledge."

Two similar implementations may represent different knowledge.
Therefore:
duplication ≠ duplicate knowledge

18. Duplicate Markup Versus Duplicate Policy
Suppose two components both contain:
className="rounded border p-4"
This may be duplicated styling syntax.

But if both independently implement:
authentication authorization policy
that is much more concerning.

Not all duplication has equal architectural cost.

19. Duplication Tax
Every duplicated implementation has some cost:
maintenance
testing
bug fixes
inconsistent behavior

But every abstraction also has a tax:
API complexity
coupling
documentation
testing
mental overhead
migration cost

Therefore:
Choose the lower long-term cost.

20. The Abstraction Equation
A useful conceptual model:
Abstraction Value =
  duplicated knowledge removed
+ stable shared behavior
+ clearer ownership
- API complexity
- coupling
- special cases
- migration cost
- cognitive overhead

This is not a literal numerical formula.
It is a decision framework.

21. Locality Is a Feature
Consider:
function CheckoutPage() {
  function CouponInput() {
    ...
  }

  return <CouponInput />;
}

If CouponInput exists only for this page and has no stable reuse requirement, keeping it local can be beneficial.
Why?
Because the developer can reason about:
CheckoutPage └── CouponInput
without navigating across a shared component library.
Locality reduces discovery cost.

22. Extraction Has a Cost
Moving code from:
Feature
to:
shared/components
creates a new dependency relationship.

Before:
Feature └── local component

After:
Feature └── shared component

Now the shared component needs:
public API
naming
documentation
tests
compatibility considerations
ownership

Therefore extraction should be intentional.

23. Shared Components Are Architectural Assets
A component in:
shared/
ui/
components/
design-system/
is not simply code moved to another folder.
It becomes infrastructure.

Its API matters.
Its consumers matter.
Its change impact matters.
Treat shared components accordingly.

24. Feature Component Versus Design-System Component
A useful distinction:
Feature component ↓ domain-specific ↓ owns business meaning
Design-system component ↓ domain-neutral ↓ owns reusable visual/interaction contract

For example:
InvoiceStatusBadge
may belong to a feature/domain layer.

Whereas:
Badge
may belong to a generic UI layer.

Do not make:
Badge
understand:
invoice
payment
subscription
just because one consumer needs it.

25. Specialization Is Healthy
You can compose:
Generic primitive
↓
Generic component
↓
Domain-specific component

For example:
function InvoiceStatusBadge({ status }) {
  return (
    <Badge variant={getVariant(status)}>
      {formatStatus(status)}
    </Badge>
  );
}

The generic Badge remains generic.
The domain component owns:
Invoice status semantics

This is often stronger than adding:
<Badge domain="invoice" status={status} />
to the generic component.

26. The Dependency Direction Rule
Prefer:
Domain ↓ Generic UI

not:
Generic UI ↓ Domain

For example:
InvoiceStatusBadge ↓ Badge
is healthy.

But:
Badge ↓ InvoiceStatus
pollutes the generic layer.

27. Reuse Through Composition
You do not always need one giant shared component.
Instead:
Button
↓
IconButton
↓
DeleteButton

Each layer adds meaning.
Button → generic interaction
IconButton → icon-specific presentation
DeleteButton → domain action semantics

This creates progressive specialization.

28. Abstraction Ladder
A healthy abstraction hierarchy can look like:
Primitive
│
▼
Generic UI
│
▼
Pattern
│
▼
Feature component
│
▼
Domain workflow

Example:
Button
↓
FormButton
↓
SubmitButton
↓
CheckoutSubmitButton

Not every layer must exist.
The point is:
Add abstraction only when the responsibility is real.

29. Over-Abstraction
Consider:
<UniversalAction
  mode="button"
  intent="submit"
  context="checkout"
  appearance="primary"
  behavior="confirm"
  loadingStrategy="async"
  tracking="purchase"
  ...
/>

This is likely not reuse.
It is abstraction collapse.
Different concepts have been merged into one object because they happen to render similar UI.

30. Under-Abstraction
The opposite problem:
UserCard
InvoiceCard
ProjectCard
SubscriptionCard
all independently implement exactly the same:
Avatar
Title
Description
Actions
and the structure is genuinely identical.

If they repeatedly require the same changes, extraction may be justified.

Senior engineering is not:
always abstract
or:
never abstract
It is:
abstract when the boundary is stable

31. The "Third Use" Heuristic
A common practical heuristic:
1st occurrence ↓ keep local
2nd occurrence ↓ observe similarity
3rd occurrence ↓ evaluate abstraction

Why?
The second occurrence often reveals whether the first was genuinely reusable.
The third often reveals whether the pattern is stable.

This is a heuristic, not a law.
Do not manufacture a third occurrence simply to justify an abstraction.

32. Prediction-First Walkthrough #1 — Premature Extraction
Initial implementation:
function ProfilePage() {
  return (
    <section className="card">
      <h2>Profile</h2>
      <p>...</p>
    </section>
  );
}

Developer extracts:
function Card({ title, children }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

Then another consumer requires:
no title
footer actions
different heading level
special padding

The API evolves:
<Card
  title={...}
  showTitle
  headingLevel={...}
  footer={...}
  compact
  actions={...}
/>

The abstraction became more expensive than the original duplication.

33. Prediction-First Walkthrough #2 — Stable Extraction
Initial:
function ProfileCard() {
  return (
    <article className="surface">
      <Avatar />
      <h2>...</h2>
      <button>...</button>
    </article>
  );
}

Second:
function TeamMemberCard() {
  return (
    <article className="surface">
      <Avatar />
      <h2>...</h2>
      <button>...</button>
    </article>
  );
}

Third:
function CustomerCard() {
  return (
    <article className="surface">
      <Avatar />
      <h2>...</h2>
      <button>...</button>
    </article>
  );
}

Now the common concept may be:
IdentityCard
if:
structure + interaction + semantics
are genuinely shared.
The abstraction has evidence.

34. Prediction-First Walkthrough #3 — False Similarity
Two components:
<UserRow />
and:
<InvoiceRow />

Both render:
icon
title
secondary text
action

But:
UserRow → user permissions → user status
InvoiceRow → invoice state → payment status

The visual similarity is not enough.
If their semantics and change reasons differ, keeping separate implementations may be safer.

35. Production Anti-Pattern Teardown #1
"Everything Must Be Reusable"

Flawed approach:
Every component is moved into:
components/
even when used once.

Why developers do it:
They equate:
componentization = reuse

Mechanical failure:
The codebase gains:
navigation cost
abstraction overhead
fragmentation
without actual reuse.

Senior refactoring:
Keep feature-local components local until a stable shared boundary emerges.

36. Production Anti-Pattern Teardown #2
The Universal Component:
<UniversalCard
  mode="profile"
  layout="compact"
  variant="billing"
  showFooter
  showAvatar
  showActions
  ...
/>

Failure:
The component represents multiple unrelated concepts.

Senior response:
Split by semantic responsibility:
Card
ProfileCard
BillingCard
where appropriate.
Shared visual primitives remain underneath.

37. Production Anti-Pattern Teardown #3
Premature Design System:
A team creates:
UniversalInput
UniversalSelect
UniversalModal
UniversalTable
UniversalCard
UniversalPanel
before real use cases stabilize.

Every new requirement becomes:
another prop

Result:
The design system becomes a constraint instead of an accelerator.

Senior response:
Extract stable primitives and patterns from demonstrated usage.

38. Production Anti-Pattern Teardown #4
Copy-Paste Without Evaluating Knowledge:
The opposite extreme:
Feature A └── duplicated validation
Feature B └── duplicated validation
Feature C └── duplicated validation

If the validation policy is the same business rule, duplication may create multiple sources of truth.
Here abstraction may be necessary.

The senior question is:
Are we duplicating syntax or duplicating knowledge?

39. Production Anti-Pattern Teardown #5
Shared Component With Consumer Exceptions:
if (consumer === "checkout") { ... }
if (consumer === "admin") { ... }
if (consumer === "profile") { ... }

This is one of the strongest signs that the abstraction boundary is wrong.
The component should not know its consumers.
Consumers should compose or specialize the generic primitive.

40. Production Incident Runbook — Shared Component Regression
Incident:
A change to:
SharedCard
breaks:
ProfilePage
BillingPage
AdminPage

Investigation:
Trace:
SharedCard ↓ consumer assumptions ↓ props ↓ conditional branches

Identify whether:
one abstraction
is serving:
multiple unrelated semantics

Remediation:
Possible outcomes:
1. Narrow shared API
2. Split component
3. Move consumer-specific behavior outward
4. Introduce specialized wrappers
5. Keep duplicated implementation where semantics differ

41. Production Incident Runbook — Abstraction Freeze
Symptom:
A simple feature takes days because:
"the shared component doesn't support this."

Developer proposes:
<SharedComponent newFlag />

Investigation:
Ask:
Is this requirement shared?
Will other consumers need it?
Does it belong to the shared concept?

If no:
keep the requirement outside the shared component

42. Production Incident Runbook — API Explosion
Measure:
[ ] total props
[ ] boolean props
[ ] callbacks
[ ] slots
[ ] render functions
[ ] conditional branches
[ ] consumer-specific branches
[ ] deprecated props

Look for:
consumer-specific configuration
That is stronger evidence than raw prop count.
A component can have 20 legitimate props.
A component can have 6 terrible props.

43. 🧪 DevTools Lab — Reuse Versus Locality
Build:
PageA
PageB
with:
<SharedCard />

Then profile both.
Inspect:
[ ] component tree
[ ] props
[ ] state
[ ] render reasons
[ ] consumers

Ask:
Does SharedCard actually create a meaningful shared boundary? Or is it merely a wrapper around identical markup?

44. DevTools Lab — Change Propagation
Modify:
<SharedCard />
and observe every consumer.

Create a small dependency graph:
SharedCard
├── PageA
├── PageB
├── PageC
└── PageD

Then classify each consumer:
same semantics?
same behavior?
same accessibility contract?
same change reasons?

This is architectural profiling.

45. DevTools Lab — Component Tree as Architecture Evidence
React DevTools should not be used only for performance.
The component tree reveals:
ownership
composition
abstraction boundaries
provider boundaries
feature decomposition

If the tree looks like:
UniversalWrapper
└── GenericContainer
    └── SharedLayout
        └── CommonComponent
            └── FeatureThing
ask whether abstraction layers are providing meaningful ownership.

46. Architecture Decision Matrix
Question | Keep Local | Extract
--- | :---: | :---:
Used once | ✅ | Usually no
Stable semantic concept | — | ✅
Same reason to change | — | ✅
Same accessibility contract | — | ✅
Same behavior | — | ✅
Only same markup | ✅ | Usually no
Requirements still changing rapidly | ✅ | Usually wait
Consumer-specific branches required | ✅ | ❌
Shared business rule | — | ✅
Generic primitive with clear contract | — | ✅
Extraction increases API complexity | ✅ | Usually no
Multiple independent consumers | — | Candidate
Component has meaningful invariant | — | Candidate
Reuse only hypothetical | ✅ | ❌

47. The Abstraction Review Checklist
Before merging a new shared component:
[ ] What exact problem does it abstract?
[ ] Who are its current consumers?
[ ] Are the consumers semantically related?
[ ] What behavior is actually shared?
[ ] What structure is actually shared?
[ ] What accessibility contract is shared?
[ ] Do consumers change for similar reasons?
[ ] Are any consumer-specific flags required?
[ ] Can the API remain small?
[ ] Can the component remain domain-neutral?
[ ] Does composition remove configuration?
[ ] Does extraction reduce total complexity?
[ ] Could the abstraction remain local for now?
[ ] Is the abstraction based on evidence or speculation?
[ ] What happens when the next consumer differs?
[ ] Will that difference require another boolean?
[ ] Does the abstraction have a meaningful invariant?
[ ] Is the dependency direction healthy?
[ ] Does the abstraction preserve state ownership?
[ ] Does it preserve identity semantics?
[ ] Is the name semantic rather than implementation-based?
[ ] Can consumers understand it without reading internals?

48. Senior Heuristic: The Change-Together Principle
A powerful heuristic:
Things that change together should usually live together.

Suppose:
Button appearance
Button accessibility
Button interaction
change together.
They belong together.

But:
User permissions
Button appearance
should not become one component simply because permissions affect whether the button appears.
The feature can compose the generic button.

49. Senior Heuristic: The Reason-to-Change Test
Ask:
"What reasons could make this component change?"
If the answer is:
A B C D E
and those reasons belong to unrelated domains, the component may be too broad.
A cohesive component has a smaller, coherent set of change reasons.

50. Senior Heuristic: The Consumer-Blindness Test
A generic component should not contain:
if (consumer === ...)
or:
if (page === ...)
or:
if (feature === ...)

Instead:
generic component ↑ consumer composes/specializes it

The abstraction should not need to know who consumes it.

51. Senior Heuristic: The API Stability Test
Imagine three future consumers.
Can they use the component without requiring:
new boolean
new mode
new exception
new callback

If not, the abstraction may not actually be general.

52. Senior Heuristic: The Delete Test
Ask:
"What happens if we delete this abstraction and keep the implementations local?"
If deleting it would make:
ownership clearer
dependencies simpler
changes more isolated
the abstraction may be harmful.

If deleting it causes:
duplicate policy
inconsistent behavior
repeated infrastructure
the abstraction is likely valuable.

53. Senior Interview Gotcha #1
"Is duplication always bad?"
No.
Duplication can be preferable when implementations represent different concepts or are likely to evolve independently.

54. Senior Interview Gotcha #2
"When should you extract a component?"
When there is a meaningful boundary around:
responsibility
behavior
structure
semantics
ownership
and the boundary is useful beyond merely reducing line count.

55. Senior Interview Gotcha #3
"Is a reusable component always more maintainable?"
No.
A reusable component can increase coupling if unrelated consumers depend on the same abstraction.

56. Senior Interview Gotcha #4
"What is premature abstraction?"
Generalizing multiple implementations before their shared requirements and semantics are sufficiently understood.

57. Senior Interview Gotcha #5
"What is the problem with a universal component?"
It tends to absorb unrelated requirements through:
flags
modes
variants
callbacks
slots
exceptions
until its public API represents multiple concepts.

58. Senior Interview Gotcha #6
"How does composition help reuse?"
Instead of forcing every consumer into one configuration model, composition allows consumers to reuse stable primitives while retaining control over domain-specific structure.

59. 🔥 THE CRUCIBLE
Challenge 1 — Should This Become a Component?
You see the same 12 lines of JSX in two places.
Should you extract?
Explain your answer without using:
"Because DRY."

60. Challenge 2 — Shared Business Rule
Three components independently implement:
invoice status classification
The rule changes frequently.
Should it remain duplicated?
Explain the difference between:
UI duplication
and:
knowledge duplication

61. Challenge 3 — Universal Card
You inherit:
<Card
  mode="user"
  showAvatar
  showStatus
  showInvoiceNumber
  showPaymentState
  showActions
/>

Identify:
[ ] shared primitive
[ ] domain-specific responsibilities
[ ] configuration smells
[ ] possible composition boundaries

62. Challenge 4 — Three Consumers
A component has:
Consumer A: header + body
Consumer B: header + body + footer
Consumer C: body + custom toolbar

Would you:
A. Add flags
B. Add slots
C. Use composition
D. Split components

Explain what information you need before deciding.

63. Challenge 5 — Delete Test
A shared component:
<SharedPanel />
has:
2 consumers
9 props
4 boolean flags
3 consumer-specific branches

Would you keep it?
Design the migration strategy.

64. Challenge 6 — Abstraction Boundary
You have:
Badge
InvoiceStatusBadge

Where should:
"Paid" "Pending" "Overdue"
semantics live?
Explain the dependency direction.

65. Final Render-by-Render Crucible
Consider:
function Card({ children }) {
  return (
    <section className="card">
      {children}
    </section>
  );
}

function ProfilePage() {
  const [editing, setEditing] = useState(false);

  return (
    <Card>
      <ProfileHeader
        editing={editing}
        onEdit={() => setEditing(true)}
      />
      {editing ? (
        <ProfileForm onSave={() => setEditing(false)} />
      ) : (
        <ProfileDetails />
      )}
    </Card>
  );
}

Render #1:
editing = false
Tree:
ProfilePage
└── Card
    ├── ProfileHeader
    └── ProfileDetails

Render #2:
Click Edit.
State:
false → true
New tree:
ProfilePage
└── Card
    ├── ProfileHeader
    └── ProfileForm

The important point:
Card
is still a structural abstraction.
It does not need to understand:
editing
ProfileHeader
ProfileForm
ProfileDetails

Its contract is simply:
provide card structure + accept caller-controlled content
This is a good abstraction boundary.

66. Contrast With the Bad Version
<Card
  editing={editing}
  showProfileHeader
  showProfileForm={editing}
  showProfileDetails={!editing}
  onEdit={...}
  onSave={...}
/>

Now Card has become coupled to:
profile workflow
The generic component is no longer generic.
Composition was replaced with configuration.

67. The Senior-Level Difference
Junior reasoning:
"Can I reuse this code?"
Intermediate reasoning:
"Can I extract this into a component?"
Senior reasoning:
"What stable concept exists here, what should it own, who should depend on it, and what change propagation will this abstraction create?"

That is the difference between code reuse and architecture.

68. Final Engineering Decision Tree
Need to reuse something?
           │
           ▼
Is the knowledge identical?
          / \
        NO   YES
        │     │
Keep separate ▼
     Is the concept stable?
              / \
            NO   YES
            │     │
    Keep local    ▼
        Same reason to change?
                  / \
                NO   YES
                │     │
   Consider local     ▼
          Can one contract represent consumers?
                      / \
                    NO   YES
                    │     │
      Split/specialize    ▼
                       Extract
                          │
                          ▼
                     Validate API
                          │
                          ▼
              Monitor consumer exceptions

69. 35-Point Completion Checklist
[ ] I can distinguish reuse from abstraction
[ ] I understand why duplicate JSX does not automatically require extraction
[ ] I can distinguish syntax similarity from semantic similarity
[ ] I understand change boundaries
[ ] I can apply the reason-to-change test
[ ] I understand abstraction surface area
[ ] I understand the cost of shared components
[ ] I understand locality as an architectural advantage
[ ] I can identify premature abstraction
[ ] I can identify over-abstraction
[ ] I can identify under-abstraction
[ ] I understand that DRY does not mean zero duplication
[ ] I can distinguish duplicated syntax from duplicated knowledge
[ ] I can evaluate abstraction cost
[ ] I understand consumer-specific exception smells
[ ] I can recognize configuration explosion
[ ] I understand generic versus domain-specific components
[ ] I understand specialization
[ ] I understand healthy dependency direction
[ ] I can use composition for specialization
[ ] I can evaluate a design-system boundary
[ ] I can apply the third-use heuristic appropriately
[ ] I can use the delete test
[ ] I can use the consumer-blindness test
[ ] I can use the API stability test
[ ] I can evaluate change propagation
[ ] I can identify a component with too many responsibilities
[ ] I can identify a component with too little responsibility
[ ] I can diagnose shared-component regressions
[ ] I can diagnose abstraction freezes
[ ] I can evaluate component APIs in React DevTools
[ ] I can distinguish state ownership from visual reuse
[ ] I can reason about identity through extracted components
[ ] I can explain why abstraction is an architectural decision
[ ] I can defend keeping duplicated code when the concepts differ

70. Final Mental Model
             REUSE
               │
               ▼
    ┌───────────────────┐
    │   Is knowledge    │
    │  actually shared? │
    └─────────┬─────────┘
              │ YES
              ▼
    ┌───────────────────┐
    │   Is the concept  │
    │      stable?      │
    └─────────┬─────────┘
              │ YES
              ▼
    ┌───────────────────┐
    │  Same reason to   │
    │      change?      │
    └─────────┬─────────┘
              │ YES
              ▼
    ┌───────────────────┐
    │ Can one contract  │
    │  serve consumers? │
    └─────────┬─────────┘
              │ YES
              ▼
           ABSTRACT
              │
              ▼
        KEEP API SMALL
              │
              ▼
       MONITOR COUPLING

The central principle is:
Reuse is valuable only when the abstraction reduces complexity without creating stronger coupling than the duplication it replaced.

A component is not good because it is:
small
generic
reusable
configurable

A component is good when it establishes a clear, coherent, durable boundary.

71. Cross-KPI Boundary
This Part establishes the fundamentals of:
reuse
extraction
abstraction
component locality
specialization
generic versus domain-specific boundaries
premature abstraction
over-engineering
change propagation

It intentionally does not deeply cover:
advanced component testing frameworks
React Testing Library methodology
mocking architecture
snapshot strategy
advanced performance optimization
compiler-driven memoization
concurrent rendering architecture
custom renderers
Server Components
Those belong elsewhere in the Level 06/Level 07 boundary.

72. Final Engineering Principle
The best reusable component is not the one that accepts the most use cases. It is the one whose contract remains coherent as the number of consumers grows.

And the strongest senior-level rule:
When two pieces of code look similar, do not ask "How can I remove this duplication?" first. Ask "What knowledge, responsibility, and change boundary do these pieces actually share?"

If the answer is unclear, keep the code local until the architecture provides evidence for extraction.
