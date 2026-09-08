Level 06 — React Fundamentals
KPI 04 — State & State Updates
PART 05 — State Structure, Derived State & Normalization
[⬅️ Previous Part](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/04-state-immutability-objects-and-arrays.md) | [📚 Level 06 Index](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/README.md) | [🧪 Companion Lab](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/examples/05-state-structure-derived-state.html) | [Next Part ➡️](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/06-state-reset-and-preservation.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models
1. The Real State-Design Problem
The hardest state bugs are often not caused by useState syntax.
They come from answering this question incorrectly:
What information actually needs to be stored?

A component may receive:
products
and store:
filteredProducts
and also:
filteredProductCount
and:
hasResults
and:
isEmpty

Now one conceptual fact exists in multiple places.
That creates synchronization problems.
A senior React engineer instead asks:
What is the minimal canonical state?
What can be derived?
What relationships exist between entities?
What identity needs to remain stable?
Where should the state live?

2. Core Mental Model
A strong state model separates:
          COMPONENT DATA
                 │
  ┌──────────────┴──────────────┐
  │                             │
  ▼                             ▼
CANONICAL STATE           DERIVED DATA
  │                             │
  │                             │
stored by React           calculated during render
  │                             │
  └──────────────┬──────────────┘
                 ▼
           UI projection

The fundamental rule:
Store facts. Derive consequences.

For example:
const [items, setItems] = useState([]);
const [query, setQuery] = useState("");

Usually store:
items
query

and derive:
const filteredItems = items.filter(...);

rather than storing:
items
query
filteredItems

3. Executive Concept Table
Concept | Core Mechanism | Production Impact | Common Senior Trap
--- | --- | --- | ---
canonical state | minimal authoritative facts | reduces synchronization | storing every UI result
derived data | computed from current inputs | prevents duplicate state | putting it into useState
redundant state | same fact represented twice | creates drift | syncing with effects
state shape | organization of stored facts | affects update complexity | designing state around JSX
normalization | entities stored by stable identity | simplifies shared relationships | normalizing everything
denormalization | nested/domain-oriented structure | can simplify local consumption | duplicating mutable entities
entity identity | stable identifier for an entity | enables targeted updates | using array position as identity
source of truth | authoritative representation | prevents disagreement | multiple competing owners
state dependency | one value determined by another | signals derivation | storing both values
state duplication | same conceptual fact stored repeatedly | creates synchronization burden | “keep them in sync”
minimal state | smallest set of independent facts | simplifies reasoning | under-modeling required information
normalization boundary | deliberate entity storage strategy | useful for relational data | premature database-like architecture

4. Golden Rule
If a value can always be calculated from existing props, state, or stable constants during render, it usually does not need to be stored as separate React state.
And:
State should represent independent information, not every value your UI happens to display.

Layer 2 — 🔬 Deep Mechanical Breakdown
5. State Is a Model, Not a Screenshot of the UI
Consider:
function Cart({ products }) {
  const [items, setItems] = useState(products);

  const total = items.reduce(
    (sum, item) => sum + item.price,
    0
  );

  return <div>Total: {total}</div>;
}

The state represents:
items

The UI displays:
items → total

total is not necessarily another piece of information.
It is a projection of the information already available.

Think:
items
│
▼ calculate total
│
▼
UI

rather than:
items ───────────────► UI
  │
  └──► total state ──► UI

The second model introduces another thing that can become stale.

6. Independent Facts vs Consequences
Suppose:
const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");

These are independent inputs.
You could derive:
const fullName = `${firstName} ${lastName}`;

There is usually no reason to store:
const [fullName, setFullName] = useState("");

because:
fullName = f(firstName, lastName)

The dependency relationship is deterministic.

Therefore:
firstName ─┐
           ├──────┐
           │      │
lastName ──┘      │
                  ▼
              fullName

Store the independent facts.
Derive the consequence.

7. The Redundant State Problem
Consider:
const [items, setItems] = useState([]);
const [itemCount, setItemCount] = useState(0);

Then:
setItems(nextItems);
setItemCount(nextItems.length);

Now the developer has created an invariant:
itemCount === items.length

That invariant must remain true forever.
Every code path modifying items must also update itemCount.
Miss one:
setItems(previous => [...previous, item]);

and:
items.length = 5
itemCount = 4

The UI now has contradictory state.

8. Derive Instead
Use:
const itemCount = items.length;

Now there is only one source of truth:
items
│
└──► items.length

There is no synchronization operation.
There is no second state setter.
There is no effect required to repair the relationship.

9. Derived State Is Not “Bad”
The phrase derived state can cause confusion.
There is nothing inherently wrong with derived values.

This is perfectly normal:
const visibleProducts = products.filter(
  product => product.name.includes(query)
);

The problem is usually storing derived values as independent React state when they do not need independent lifetime.

Distinguish:
derived data
from:
derived React state

The first is often desirable.
The second often creates synchronization problems.

10. The Effect Synchronization Smell
A common pattern:
const [items, setItems] = useState([]);
const [count, setCount] = useState(0);

useEffect(() => {
  setCount(items.length);
}, [items]);

This says:
items changed
↓
effect runs
↓
count update requested
↓
another render

But the relationship is simply:
count = items.length;

Therefore the effect is solving a problem that should not exist.

Prefer:
const count = items.length;

11. Why Effect-Based Derivation Is Mechanically Inferior
Suppose:
Render #1 items = [A, B] count = 2

Items update:
Render #2 items = [A, B, C] count = 2

The effect then runs:
Effect items.length = 3 setCount(3)

Then:
Render #3 items = [A, B, C] count = 3

The UI had an intermediate state where the two representations disagreed.

A direct derivation:
const count = items.length;

produces:
Render #2 items = [A, B, C] count = 3

No synchronization phase exists.

12. Render-Time Derivation
If:
const [items, setItems] = useState([]);
const [query, setQuery] = useState("");

then:
const visibleItems = items.filter(item =>
  item.name
    .toLowerCase()
    .includes(query.toLowerCase())
);

Every render evaluates:
current state snapshot
│
▼ pure calculation
│
▼
derived value

This is aligned with React's rendering model.

13. Derived Data Must Be Pure
Good:
const total = items.reduce(
  (sum, item) => sum + item.price,
  0
);

Bad:
const total = items.reduce((sum, item) => {
  item.totalized = true;
  return sum + item.price;
}, 0);

A derived calculation should not mutate state.
Remember:
Derivation is a calculation, not a state transition.

14. State Shape Is an Architectural Decision
Compare:
Model A:
const [selectedId, setSelectedId] = useState(null);

with:
Model B:
const [selectedItem, setSelectedItem] = useState(null);

Both can work.
But they encode different ownership and identity models.

If the canonical data already exists in:
items
then:
selectedId
may be enough.

The selected entity can be derived:
const selectedItem = items.find(item => item.id === selectedId) ?? null;

Now:
items
│
└──► selectedId
     │
     ▼
selectedItem

The entity itself does not need to be duplicated.

15. Why IDs Can Be Better Than Storing Whole Entities
Suppose:
const [selectedUser, setSelectedUser] = useState(user);

Later:
users
changes.

Now:
selectedUser
may refer to an older object/value.

You can instead store:
const [selectedUserId, setSelectedUserId] = useState(null);

and derive:
const selectedUser = users.find(user => user.id === selectedUserId);

Now the selected entity always comes from the canonical collection.
This avoids duplicating the entity itself.

16. State as a Dependency Graph
A useful senior-level model:
             canonical facts
                    │
  ┌─────────────────┼─────────────────┐
  ▼                 ▼                 ▼
query             items           selectedId
  │                 │                 │
  └────────┬────────┘                 │
           ▼                          │
     visibleItems                     │
           │                          │
           └────────────┬─────────────┘
                        ▼
                  selectedItem
                        │
                        ▼
                        UI

The goal is to keep the graph:
acyclic
explicit
minimal
predictable

Avoid unnecessary stored nodes.

17. When Should Something Actually Be State?
Use this test.
Ask:
Question 1: Does this value represent information that can change independently?
If yes, it may deserve state.
Question 2: Can it be deterministically calculated from existing state/props?
If yes, derive it first.
Question 3: Does it need an independent lifetime?
If no, deriving is often preferable.
Question 4: Would storing it create an invariant between two values?
If yes, be suspicious.
Question 5: Does the value represent an external event/result that cannot simply be calculated from current inputs?
Then state may be appropriate.

18. Example — Search UI
Bad:
const [query, setQuery] = useState("");
const [results, setResults] = useState([]);
const [resultCount, setResultCount] = useState(0);

if results are simply:
items.filter(...)

Better:
const [query, setQuery] = useState("");

const results = items.filter(item =>
  item.name
    .toLowerCase()
    .includes(query.toLowerCase())
);
const resultCount = results.length;

State:
query

Derived:
results
resultCount

This is substantially easier to reason about.

19. But Not Everything Should Be Derived
Suppose search results come from a server.
Then:
query
may trigger a request.

The returned data is not necessarily:
results = pureFunction(items, query)

because the result depends on:
server
network
authorization
time
backend state

At this fundamentals level, the important distinction is:
A value that cannot be deterministically reconstructed from current local state is not merely derived local data.

Do not blindly apply:
“Never store derived data.”
The correct principle is:
Do not duplicate locally derivable information without a reason.

20. Normalization
Normalization becomes useful when state represents multiple entities with relationships.

Imagine:
const [users, setUsers] = useState([
  {
    id: 1,
    name: "A",
    posts: [
      { id: 101, title: "Post 1" }
    ]
  }
]);

Now imagine the same post appears under several relationships.
You can end up with duplicated entities:
User A └── Post 101
User B └── Post 101

Now changing Post 101 requires deciding:
Which copy is authoritative?
That is a data-model problem.

21. Normalized Representation
A normalized model separates entities by identity:
const state = {
  usersById: {
    1: {
      id: 1,
      name: "A",
    },
  },
  postsById: {
    101: {
      id: 101,
      title: "Post 1",
    },
  },
  userPostIds: {
    1: [101],
  },
};

Conceptually:
usersById
│
└── user 1
    │
    └── post IDs
        │
        ▼
    postsById

Now Post 101 has one canonical entity.

22. Why Normalize?
Normalization can provide:
- one canonical copy of an entity
- targeted updates
- clearer relationships
- less duplicated data
- easier entity lookup
- fewer synchronization problems

But normalization has costs.
You introduce:
- indirection
- lookup logic
- more complex state shape
- relationship maintenance

Therefore:
Normalize when the domain's relationships justify it.
Do not normalize a simple local component because “senior React code should be normalized.”

23. Local State vs Relational State
A local form:
{ name: "", email: "" }
does not usually need:
entitiesById
relationships
indexes
selectors

A large entity graph may.
The appropriate state shape depends on:
- domain complexity
- relationship density
- update patterns
- ownership
- consumers

24. Render Prediction #1 — Derived Count
function List() {
  const [items, setItems] = useState(["A", "B"]);
  const count = items.length;
  return <div>{count}</div>;
}

Render #1:
items = [A, B]
count = 2

Update:
setItems(previous => [...previous, "C"]);

Render #2:
items = [A, B, C]
count = 3

There is no separate count state.
There is no synchronization phase.

25. Render Prediction #2 — Redundant Count State
function List() {
  const [items, setItems] = useState(["A", "B"]);
  const [count, setCount] = useState(2);

  function addItem() {
    setItems(previous => [...previous, "C"]);
  }

  return (
    <>
      <div>{items.length}</div>
      <div>{count}</div>
    </>
  );
}

After:
addItem();

the update queue contains:
items → [A, B, C]
but:
count → 2

The state model now contains contradictory information.
This is the danger of redundant state.

26. Render Prediction #3 — Selected ID
function Users({ users }) {
  const [selectedId, setSelectedId] = useState(null);
  const selectedUser =
    users.find(user => user.id === selectedId) ?? null;
  // ...
}

Render #1:
users = [A, B, C]
selectedId = null
selectedUser = null

Select B:
selectedId = B.id

Render #2:
selectedId = B.id
selectedUser = B

If user B's data later changes:
users = [A, B', C]
selectedId = B.id

then:
selectedUser = B'

The selection continues pointing to the canonical entity identity.

27. The “Copy Props Into State” Trap
Consider:
function UserEditor({ user }) {
  const [form, setForm] = useState(user);
  // ...
}

This establishes:
props.user
│
└── initial value only
    │
    ▼
form state

The state is no longer automatically the same source of truth as the prop.
That may be intentional for an editable draft.
But if the developer expected:
user changes → form automatically changes
the design is incorrect.

28. Intentional Draft State
Copying data into state can be correct when creating a distinct concept:
server entity
│
▼
editable draft

The draft intentionally has its own lifetime.
For example:
Persisted user: name = Srikar
Draft: name = Arun

These are now two legitimate concepts.
The mistake is not:
“copying is always bad.”
The mistake is:
“copying without defining ownership.”

29. State Shape and Ownership
Ask:
Who owns this fact?

For:
query
the search component may own it.

For:
selectedId
the parent coordinating multiple children may own it.

For:
draft
the editor may own it.

For:
derived count
nobody needs to own it because it can be calculated.

This connects state shape directly to component architecture.

Layer 3 — 🧪 Diagnostic Labs & DevTools Profiling
30. Lab 01 — Find Redundant State
Search a component for patterns like:
const [x, setX] = useState(...);

Then ask:
Can x be calculated from props?
Can x be calculated from another state variable?
Can x be reconstructed deterministically?

If yes, challenge the state decision.

31. Lab 02 — Detect Synchronization Effects
Search for:
useEffect(() => {
  setSomething(...);
}, [otherThing]);

Ask:
Is Something mathematically/functionally determined by otherThing?
If yes, test whether:
const something = derive(otherThing);
can replace the effect.

This is one of the highest-value React code-review heuristics.

32. Lab 03 — State Dependency Table
Create:
console.table({
  items,
  query,
  visibleCount: items.length,
});

Then classify each value:
Value | Stored? | Why
--- | --- | ---
items | yes | canonical collection
query | yes | independently changes
visibleItems | no | derived
count | no | derived
hasResults | no | derived from visibleItems

This makes state architecture explicit.

33. Lab 04 — Reference Graph Inspection
For normalized or nested data:
console.table({
  sameUser: previous.usersById[1] === next.usersById[1],
  samePost: previous.postsById[101] === next.postsById[101],
});

The objective:
Determine which entities were actually replaced by the state transition.

34. Lab 05 — React Profiler
Use React DevTools Profiler to compare:

Architecture A:
state ↓ effect ↓ derived state update ↓ additional render

versus:

Architecture B:
state ↓ pure derivation ↓ render

The point is not to optimize every calculation.
The point is to recognize unnecessary state transitions.

Layer 4 — 🔥 Production Anti-Pattern Teardowns
35. Anti-Pattern — “Store Everything the UI Displays”
Bad:
const [items, setItems] = useState([]);
const [count, setCount] = useState(0);
const [hasItems, setHasItems] = useState(false);
const [isEmpty, setIsEmpty] = useState(true);

These values overlap heavily.
For example:
count = items.length
hasItems = count > 0
isEmpty = count === 0

The state model has become a collection of duplicated consequences.

Better:
const [items, setItems] = useState([]);
const count = items.length;
const hasItems = count > 0;
const isEmpty = items.length === 0;

36. Anti-Pattern — Effect as Synchronization Engine
Bad:
useEffect(() => {
  setFiltered(
    items.filter(item => item.active)
  );
}, [items]);

if filtered is entirely derivable.

Better:
const filtered = items.filter(
  item => item.active
);

37. Anti-Pattern — Duplicating Entity Objects
Bad:
users └── user object
selectedUser └── another user object

Now two values represent the same conceptual entity.

Better:
users └── canonical user
selectedUserId └── identity reference
Then derive the selected entity.

38. Anti-Pattern — Premature Normalization
Bad architecture:
A tiny component with:
[
  { id: 1, label: "A" },
  { id: 2, label: "B" }
]
gets transformed into:
{
  entitiesById: {},
  ids: [],
  indexes: {},
  relationships: {}
}
without a real requirement.

This increases cognitive load without solving a meaningful problem.

Senior principle:
Choose the simplest state shape that accurately models the domain and update patterns.

39. Production Incident — Two Values Disagree
Symptom:
UI says: 5 items
Actual array: 6 items

Investigation reveals:
const [items, setItems] = useState([]);
const [count, setCount] = useState(0);

One update path changed:
items
without changing:
count

Root cause:
Redundant state created an invariant that the code failed to maintain.

Fix:
const count = items.length;

40. Production Incident — Selection Shows Stale Data
State:
const [selectedUser, setSelectedUser] = useState(user);

Later the canonical user list changes.
The UI continues using the old selected object.

Root cause:
entity duplicated in state

Potential fix:
const [selectedUserId, setSelectedUserId] = useState(null);
const selectedUser = users.find(user => user.id === selectedUserId);

Now identity is stored, entity data is derived.

41. Production Incident — Render Cascade From Derived State
Architecture:
items
↓ render
↓ effect
↓ setFiltered
↓ render
↓ effect
↓ setCount
↓ render

The application has transformed a pure calculation into a chain of state synchronization.
The senior refactor is to collapse deterministic relationships into render-time derivation.

42. State Design Decision Matrix
Question | If Yes | If No
--- | --- | ---
Does it change independently? | candidate for state | derive
Can it be deterministically calculated? | prefer derivation | state may be required
Does another state already contain the fact? | derive | consider state
Does storing it duplicate an entity? | store identity instead | okay
Does it represent an intentional draft? | separate state may be correct | avoid copying
Are entities shared across relationships? | consider normalization | simple nesting may suffice
Does normalization reduce real complexity? | normalize | keep simple
Is an effect only synchronizing derived data? | remove effect | investigate external synchronization

43. Senior Interview Traps
Trap 1:
“Derived values should never be calculated during render.”
False.
Render-time derivation is often exactly what you want.

Trap 2:
“Never copy props into state.”
Too absolute.
Copying props into state can be correct when creating an intentionally independent concept such as a draft.

Trap 3:
“Always normalize React state.”
False.
Normalization is a modeling technique, not a React requirement.

Trap 4:
“Every displayed value should be state.”
False.
UI frequently contains many derived values.

Trap 5:
“Effects are the right place to calculate derived state.”
Usually false.
Effects are for synchronization with systems outside the render calculation itself, not ordinary deterministic derivation.

44. 🔥 Final Crucible
Design state for:
ProductList

Requirements:
- 500 products
- search by name
- filter by category
- selected product
- display result count
- display whether results exist
- editing a product creates a local draft
- products may appear in multiple categories

A weak design:
const [products, setProducts] = useState([]);
const [filteredProducts, setFilteredProducts] = useState([]);
const [resultCount, setResultCount] = useState(0);
const [hasResults, setHasResults] = useState(false);
const [selectedProduct, setSelectedProduct] = useState(null);

Problems:
filteredProducts → derived
resultCount → derived
hasResults → derived
selectedProduct → potentially duplicated entity

A stronger conceptual model:
canonical product entities
search query
selected product ID
active category/filter
draft state when editing

Derived:
filtered products
result count
has results
selected product

If product relationships genuinely justify it:
productsById
category → product IDs

This is a much cleaner state graph.

45. Master Mental Model
The senior React state architecture can be summarized as:
          STATE DESIGN
               │
   ┌───────────┴───────────┐
   ▼                       ▼
STORE FACTS          DERIVE RESULTS
   │                       │
   ▼                       ▼
minimal canonical    pure calculation
     state                 │
   │                       │
   └───────────┬───────────┘
               ▼
               UI

For entity-heavy domains:
          ENTITY MODEL
               │
   ┌───────────┴───────────┐
   ▼                       ▼
entity identity      relationships
   │                       │
   ▼                       ▼
canonical data       IDs / references

The guiding question is always:
What is the smallest set of independent facts from which the rest of this UI can be reconstructed?

46. Completion Checklist
You should be able to:
[ ] Define canonical state.
[ ] Distinguish stored state from derived data.
[ ] Explain why redundant state is dangerous.
[ ] Identify duplicated facts.
[ ] Identify deterministic state relationships.
[ ] Replace redundant state with render-time derivation.
[ ] Explain why an effect is often unnecessary for derived values.
[ ] Identify synchronization effects.
[ ] Design minimal state.
[ ] Explain state shape as an architectural decision.
[ ] Store IDs instead of duplicated entities when appropriate.
[ ] Derive entities from canonical collections.
[ ] Explain entity identity.
[ ] Explain when copying props into state is intentional.
[ ] Distinguish drafts from synchronized copies.
[ ] Explain normalization.
[ ] Explain the benefits of normalized entities.
[ ] Explain the costs of normalization.
[ ] Recognize premature normalization.
[ ] Model relational data with stable identities.
[ ] Build a state dependency graph.
[ ] Identify redundant dependency nodes.
[ ] Explain structural sharing in normalized state.
[ ] Use DevTools to inspect state architecture.
[ ] Use Profiler to identify unnecessary state-driven render chains.
[ ] Diagnose stale duplicated entities.
[ ] Diagnose contradictory state.
[ ] Diagnose derived-state effects.
[ ] Explain why “store everything” is poor state architecture.
[ ] Explain why “never derive during render” is incorrect.
[ ] Explain why “never copy props” is too absolute.
[ ] Explain why normalization is contextual.
[ ] Design state for a moderately complex product UI.
[ ] Separate canonical facts from UI projections.
[ ] Identify the owner of each independent fact.
[ ] Explain why state shape affects update complexity.
[ ] Explain why minimal state improves predictability.

47. Final Engineering Principle
Good React state is not a mirror of the UI. It is the smallest canonical model of independently changing information from which the UI can be deterministically reconstructed.

The strongest state-design question is therefore not:
“What values do I need to render?”
It is:
“What independent facts must React remember?”

Everything else should be challenged as a possible derivation.
And when entities become relational:
“Where is the single canonical representation of each entity, and how are relationships represented without creating competing copies?”

That is the transition from merely using useState to actually designing state architecture.

Boundary of Part 05
This Part establishes:
- state shape
- canonical state
- derived data
- redundant state
- state dependencies
- entity identity
- introductory normalization
- intentional draft state
- state modeling decisions
It intentionally does not deeply cover:
- reducer architecture
- complex state machines
- external stores
- Redux-style architectures
- advanced selector systems
- server-state libraries
- Context architecture in depth
- concurrent state update semantics
- scheduler lanes
- advanced memoization
Those belong to subsequent React material.

Next: KPI 04 — Part 06 — State Reset, Preservation & Component Identity.
