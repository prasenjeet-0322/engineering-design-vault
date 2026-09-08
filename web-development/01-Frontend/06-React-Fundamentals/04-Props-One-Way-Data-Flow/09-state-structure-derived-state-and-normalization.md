Level 06 — React Fundamentals
KPI 04 — State & State Updates
PART 09 — State Structure, Derived State & Normalization
[⬅️ Previous Part](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/08-state-objects-arrays-and-complex-updates.md) | [📚 Level 06 Index](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/README.md) | [🧪 Companion Lab](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/examples/09-state-structure-derived-state-normalization.html) | [Next Part ➡️](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/10-controlled-and-uncontrolled-state.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

1. The Core Problem
The difficult state problem is usually not:
“How do I call setState?”
It is:
“What information actually deserves to exist as state?”

A component can be perfectly valid JavaScript and perfectly valid React while still having an architecturally broken state model.
The most common failure is storing information that React could have derived from existing state.
That creates multiple representations of the same fact.
Once multiple representations exist, the component must preserve an invariant:
```
representation A === representation B
```
Every update now has to keep both representations synchronized.
That is where stale UI, synchronization effects, race conditions, and unnecessary complexity begin.

2. The Senior Mental Model
A useful model is:
```
┌──────────────────────┐
│   Canonical State    │
│                      │
│   facts that can     │
│   independently      │
│       change         │
└──────────┬───────────┘
           │ pure derivation
   ┌───────┴───────┬───────────────┐
   │               │               │
   ▼               ▼               ▼
visibleRows   totalPrice      isSelected
   │               │               │
   └───────────────┼───────────────┘
                   │
                   ▼
                 JSX/UI
```

The architectural rule is:
> Store canonical facts. Derive consequences.

3. Executive Concept Table
| Concept | Core Mechanism | Production Impact | Common Senior Trap |
| :--- | :--- | :--- | :--- |
| **Canonical state** | One authoritative representation of independently changing information | Prevents synchronization bugs | Storing convenient duplicates |
| **Derived data** | Pure calculation from existing inputs | Keeps state minimal | Putting calculations into `useState` |
| **Redundant state** | Multiple representations of the same fact | Creates synchronization invariants | “I'll update both” |
| **State shape** | Structure of the stored information | Determines update complexity and correctness | Designing state around today's JSX |
| **Selected ID** | Store identity rather than duplicated entity | Prevents stale selected-object references | Storing both `selectedId` and `selectedUser` |
| **Draft state** | Intentionally independent editable representation | Correctly models temporary user intent | Treating every duplicate as bad |
| **Normalization** | Store entities once and reference them by ID | Reduces relational duplication | Normalizing trivial local state |
| **byId** | Entity lookup map | Efficient targeted access/update | Building it when no relational problem exists |
| **Ordered IDs** | Separates collection order from entity storage | Makes reorder explicit | Treating object key order as business ordering |
| **Structural sharing** | Reuse unchanged references | Preserves predictable identity | Deep-cloning everything |
| **Denormalization** | Construct read-oriented projections | Keeps UI consumption convenient | Persisting every projection |
| **State ownership** | State lives where its invariant can be maintained | Controls architecture | Lifting state unnecessarily |

4. The Golden Rule
> 🏆 **Golden Rule:** State should contain the smallest canonical representation of information that must persist across renders and can change independently. Everything that can be deterministically reconstructed from that state should normally be derived rather than stored.

A second rule follows:
> If two pieces of state must always change together because they represent the same fact, question whether they should actually be two pieces of state.

5. State Is a Data Model, Not a UI Screenshot
A common beginner mental model is:
```
What does the screen currently show?
                 ↓
      Store all of that in state.
```
That approach is backwards.

A stronger architecture is:
```
Domain/UI facts ↓ Canonical state ↓ Derived projections ↓ Rendered UI
```
The UI is a projection of application information.
It is not necessarily the storage format of that information.

Consider:
```javascript
const [products, setProducts] = useState(...)
const [visibleProducts, setVisibleProducts] = useState(...)
const [productCount, setProductCount] = useState(...)
```
The question is not:
“Can React store these?”
It obviously can.
The question is:
“Which of these represent independently changing facts?”

If:
```javascript
visibleProducts = filter(products, query)
productCount = products.length
```
then `visibleProducts` and `productCount` are consequences.
They are not additional facts.

6. The Dependency Graph Mental Model
Before adding state, model the information as a dependency graph.

Example:
```
products
   │
   ├───────────────┐
   │               │
   ▼               ▼
filteredProducts  count
   │
   ▼
visibleRows
```
If:
```javascript
filteredProducts = f(products, query)
count = g(products)
visibleRows = h(filteredProducts, sort)
```
then storing all of these creates:
```
products ──────────────┐
                       │
query ────────┐        │
              ▼        ▼
       filteredProducts│
              ▼        ▼
         visibleRows products ──────────────► count
```
There is no reason for React to remember the outputs if they can be recomputed deterministically.

The canonical state might simply be:
```javascript
const [products, setProducts] = useState(...)
const [query, setQuery] = useState("")
const [sort, setSort] = useState("name")
```
Then:
```javascript
const filteredProducts = products.filter(...)
const visibleRows = sortProducts(filteredProducts, sort)
const count = products.length
```

7. The State Qualification Test
Before creating a state variable, ask:

**Question 1**
Does this information need to survive a render?
If no: `ordinary variable` may be sufficient.

**Question 2**
Can it be deterministically calculated from existing props/state?
If yes: `derived data` is usually preferable.

**Question 3**
Can it independently change?
If no, it may not deserve separate state.

**Question 4**
Does it represent a temporary concept with its own lifecycle?
If yes, independent state may be correct.
Examples:
- form draft
- open/closed dialog
- currently focused field
- optimistic local interaction
- temporary selection

**Question 5**
Would storing it create an invariant that another state value must keep synchronized?
If yes, reconsider the state shape.

8. Canonical State
Canonical state means:
`the authoritative representation from which other information can be derived.`

Suppose we have:
```javascript
const [items, setItems] = useState([
  { id: 1, price: 10, quantity: 2 },
  { id: 2, price: 20, quantity: 1 }
])
```
The total is:
```javascript
const total = items.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0
)
```

A dangerous design is:
```javascript
const [items, setItems] = useState(...)
const [total, setTotal] = useState(...)
```
Now every item mutation must also update total.
You have created an invariant:
```
total === Σ(item.price × item.quantity)
```
The more update paths the component gains, the more opportunities exist to violate it.

9. The Redundant-State Failure
Consider:
```javascript
const [items, setItems] = useState([])
const [itemCount, setItemCount] = useState(0)

function addItem(item) {
  setItems(prev => [...prev, item])
  setItemCount(prev => prev + 1)
}
```
It looks harmless.
But now ask:
What happens when:
- an item is removed?
- an item is imported?
- items are replaced?
- state is reset?
- a server response replaces the list?
- a batch update changes several items?

Every operation must preserve:
```
itemCount === items.length
```

The canonical version is:
```javascript
const [items, setItems] = useState([])
const itemCount = items.length
```
Now the invariant is structurally guaranteed.
There is no synchronization operation.

10. Why Derived State Is Safer
Compare:

Duplicated model:
```
items ───────► UI
  │
  └──────────► itemCount

Every mutation must update:
items
itemCount
```

versus:

Canonical model:
```
items
  │
  ├────► UI
  │
  └────► itemCount
```
In the second design:
`items.length` cannot become stale relative to items.
The relationship is encoded in the computation itself.
That is a powerful architectural property.

11. The Effect-Based Derivation Trap
One of the most common React state anti-patterns is:
```javascript
const [items, setItems] = useState([])
const [count, setCount] = useState(0)

useEffect(() => {
  setCount(items.length)
}, [items])
```
This is usually inferior to:
```javascript
const count = items.length
```

Why?
Because the effect introduces an additional state transition.

Conceptually:
```
Render A ↓ items changed ↓ commit ↓ effect executes ↓ setCount(...) ↓ Render B
```
The derived value was available during Render A.
Instead, the architecture delayed it until after commit and introduced another render path.

The fundamental problem is not merely “extra render.”
The deeper problem is:
> A deterministic calculation has been incorrectly modeled as an independently synchronized state transition.

12. Render-Time Derivation
For pure calculations:
```javascript
const filteredItems = items.filter(item =>
  item.name.includes(query)
)
```
the mental model is:
```
Render
│
├── read items
├── read query
├── calculate filteredItems
└── produce JSX
```
No second state update is required.
The result belongs to the render computation.

13. A More Formal Model
Let canonical state be:
```
S = {items, query, sort}
```
Then the UI can be represented as:
```
UI = F(S)
```
Derived values are functions:
```
filtered = G(items, query)
sorted = H(filtered, sort)
rows = J(sorted)
```
The final UI becomes:
```
UI = J(H(G(items, query), sort))
```
You do not need React state for each intermediate value.
You only need state for information whose persistence and mutation semantics require React-managed memory.

14. Redundant State Creates Synchronization Obligations
Suppose:
```javascript
const [users, setUsers] = useState([])
const [selectedUser, setSelectedUser] = useState(null)
const [selectedUserId, setSelectedUserId] = useState(null)
```
Now you have:
```
selectedUser.id === selectedUserId
```
as an invariant.

But what if:
`users` changes?
The selected object might now be stale.

For example:
```
Render #1
users: A(name = "Alice")
selectedUser: A(name = "Alice")
```
Then the user data updates:
```
Render #2
users: A(name = "Alicia")
selectedUser: A(name = "Alice")
```
The identity is the same.
The object representation is stale.

If the actual requirement is:
“Which user is selected?”
the canonical state is usually:
```javascript
const [selectedUserId, setSelectedUserId] = useState(null)
```
Then:
```javascript
const selectedUser = users.find(user => user.id === selectedUserId) ?? null
```
Now the selected entity is derived from the latest canonical collection.

15. Store Identity When Identity Is the Fact
This pattern is extremely important.
Prefer:
`selectedId`
over:
`selectedObject`
when the actual independently changing fact is:
“Which entity is selected?”

The model becomes:
```
users
  │
  │ lookup(selectedId)
  ▼
selectedUser
```
rather than:
```
users ──────────► selectedUser
                      ▲
                      │ separate state
```
The second representation can diverge.
The first cannot become stale independently.

16. Render-by-Render Prediction #1 — Selected Entity
Consider:
```javascript
function Users({ users }) {
  const [selectedUserId, setSelectedUserId] = useState(null)

  const selectedUser =
    users.find(user => user.id === selectedUserId) ?? null

  return (
    <>
      <button onClick={() => setSelectedUserId("u1")}>
        Select Alice
      </button>
      <div>{selectedUser?.name}</div>
    </>
  )
}
```

Initial state:
```
users: u1 → Alice
selectedUserId: null
```

**Render #1**
State snapshot:
`selectedUserId = null`
Derived:
`selectedUser = null`
DOM:
Select Alice (no selected user)

**Click**
Handler requests:
`setSelectedUserId("u1")`
The current render binding does not mutate.
React schedules another render.

**Render #2**
State snapshot:
`selectedUserId = "u1"`
Derived lookup:
`u1 → Alice`
DOM:
Select Alice Alice

Now suppose the parent provides:
`u1 → Alicia`

**Render #3**
State:
`selectedUserId = "u1"`
Derived:
`selectedUser = Alicia`
No synchronization operation was necessary.
That is the advantage of canonical identity state.

17. Raw Domain Data vs UI Projection
Another important distinction:
```
Raw data ↓ UI projection
```
Suppose the application has:
`products`
and the UI needs:
- filtered products
- sorted products
- grouped products
- visible count
- total price

These are usually projections.

A poor state model might be:
```javascript
const [products, setProducts] = useState(...)
const [filteredProducts, setFilteredProducts] = useState(...)
const [sortedProducts, setSortedProducts] = useState(...)
const [visibleCount, setVisibleCount] = useState(...)
const [totalPrice, setTotalPrice] = useState(...)
```
Now every update must maintain a large synchronization graph.

A better model:
```javascript
const [products, setProducts] = useState(...)
const [query, setQuery] = useState("")
const [sort, setSort] = useState("name")
```
Then:
```javascript
const filteredProducts = ...
const sortedProducts = ...
const visibleCount = ...
const totalPrice = ...
```
The state describes the information.
The render computes the presentation.

18. When Derived Data Should NOT Become State
Do not automatically convert every calculated value into state because the calculation is expensive.

The correct sequence is:
1. Is it actually derived?
2. Is the calculation pure?
3. Is it actually expensive?
4. Does the optimization require caching?

Only after that should you consider memoization or another optimization mechanism.

The important boundary is:
> Performance optimization does not automatically transform derived data into canonical state.

Do not confuse:
`derived data` with `state`
and do not confuse:
`memoization` with `canonical ownership`

19. Intentional Duplicate Representation: Draft State
Not every duplicate-looking value is wrong.
Consider an editor:
```
Persisted user name: "Alice"
Draft currently being edited: "Alicia"
```
These values intentionally differ.
The draft is not merely a copy that must always equal the persisted value.
It represents a different concept:
`persisted value vs temporary user intent`

That is legitimate independent state.
For example:
```javascript
const [user, setUser] = useState(initialUser)
const [draftName, setDraftName] = useState(initialUser.name)
```
This can be valid if:
`user.name` represents committed domain data while:
`draftName` represents an independently changing editing session.

The crucial distinction is:
> Duplication is problematic when two values are supposed to represent the same fact at the same time.
> If they represent different concepts, separate state can be correct.

20. The Semantic Difference Test
When you see:
```javascript
const [a, setA] = useState(...)
const [b, setB] = useState(...)
```
ask:
“Can a and b legitimately disagree?”

- **If the answer is NO:**
  You probably have redundant state.
  Example: `items`, `items.length`

- **If the answer is YES:**
  Ask why.
  If the answer is: *because they represent different lifecycle concepts* then separate state may be correct.
  Example: `savedProfile`, `editingDraft`

That distinction is much more useful than the simplistic rule: “Never duplicate data.”

21. State Shape Is Architecture
State structure determines:
- how updates work
- how invariants are represented
- how components access information
- how much data is copied
- how easy bugs are to diagnose
- how much synchronization exists

Therefore:
`State shape is an architectural decision.`

Consider:
```javascript
const [selectedProduct, setSelectedProduct] = useState(product)
```
versus:
```javascript
const [selectedProductId, setSelectedProductId] = useState(product.id)
```
These are not equivalent architectures.
The first stores an entity representation.
The second stores an identity relationship.
That difference becomes important as the application grows.

22. Nested State
Suppose state looks like:
```javascript
const [state, setState] = useState({
  user: {
    profile: {
      preferences: {
        theme: "dark"
      }
    }
  }
})
```
Changing: `theme` requires copying the changed path:
```javascript
setState(prev => ({
  ...prev,
  user: {
    ...prev.user,
    profile: {
      ...prev.user.profile,
      preferences: {
        ...prev.user.profile.preferences,
        theme: "light"
      }
    }
  }
}))
```
This is mechanically valid.
But if state becomes deeply relational, ask a more important architectural question:
> Is the state shape itself creating unnecessary update complexity?

This is where normalization becomes useful.

23. Normalization
Normalization means representing entities once and referring to them by stable identifiers.

Instead of:
```javascript
const state = {
  projects: [
    {
      id: "p1",
      name: "Frontend",
      owner: { id: "u1", name: "Alice" }
    },
    {
      id: "p2",
      name: "Backend",
      owner: { id: "u1", name: "Alice" }
    }
  ]
}
```
we can represent:
```javascript
const state = {
  usersById: {
    u1: { id: "u1", name: "Alice" }
  },
  projectsById: {
    p1: { id: "p1", name: "Frontend", ownerId: "u1" },
    p2: { id: "p2", name: "Backend", ownerId: "u1" }
  },
  projectIds: ["p1", "p2"]
}
```
Now Alice exists once.
Projects reference her identity.

24. Normalized State Mental Model
Think:
```
Entity Storage
usersById
┌─────────────┐
│ u1 → Alice  │
│ u2 → Bob    │
└─────────────┘
projectsById
┌──────────────────────┐
│ p1 → ownerId: u1     │
│ p2 → ownerId: u1     │
└──────────────────────┘

Ordering / Membership
projectIds
["p1", "p2"]
```
Relationships are explicit:
```
project.ownerId ─────► usersById[project.ownerId]
```
This is fundamentally a data-modeling technique.
It is not a React-specific trick.

25. Why Normalization Exists
Normalization becomes useful when the application contains:
```
many entities + relationships + repeated references + independent updates
```
For example:
- Users
- Teams
- Projects
- Tasks
- Comments
- Permissions

Suppose a user appears in:
- project list
- task list
- comment list
- team member list

If each representation embeds a copy of the user:
```
Project → User copy
Task → User copy
Comment → User copy
Team → User copy
```
then updating the user's name may require changing multiple copies.

A normalized model:
```
projects ─┐
tasks ────┼──► usersById
comments ─┤
teams ────┘
```
stores the user once.

26. Duplication Creates Referential Inconsistency
Imagine:
```javascript
usersByProject: p1 → { userId: u1, name: "Alice" }
usersByTask:    t1 → { userId: u1, name: "Alice" }
```
Now one path updates:
`Alice → Alicia`
but another doesn't.
You get:
- Project screen: Alicia
- Task screen: Alice

The system contains two representations of the same entity.
Normalization makes the relationship explicit:
```javascript
p1.ownerId = u1
t1.assigneeId = u1
usersById[u1].name = "Alicia"
```
Both projections resolve the current entity.

27. Normalization Does Not Mean “Normalize Everything”
This is an important senior-level correction.
Do not transform:
```javascript
const [tabs, setTabs] = useState([
  "Overview", "Activity", "Settings"
])
```
into:
```javascript
const [tabsById, setTabsById] = useState(...)
const [tabIds, setTabIds] = useState(...)
```
just because normalized state is sophisticated.

That would increase:
- indirection
- boilerplate
- lookup cost
- mental overhead
- update complexity
without solving a meaningful problem.

The correct question is:
> Does the domain have enough relational complexity or repeated entity representation that normalization reduces overall complexity?

28. Normalization Decision Heuristic
Normalization becomes more attractive when several of these are true:
- [ ] Entities have stable IDs
- [ ] The same entity appears in multiple places
- [ ] Entities update independently
- [ ] Relationships matter
- [ ] Collections can reorder independently
- [ ] Targeted entity updates are common
- [ ] Deep nested updates are becoming difficult
- [ ] Duplicated representations have already caused bugs

If most are false:
`keep the state simple`

29. Ordered IDs vs Entity Storage
A normalized collection often separates:
`what exists`
from:
`in what order it appears`

Example:
```javascript
{
  usersById: {
    u1: { id: "u1", name: "Alice" },
    u2: { id: "u2", name: "Bob" }
  },
  userIds: ["u2", "u1"]
}
```
The entity map answers:
*What is user u1?*
The ordered ID list answers:
*Which users belong to this collection and in what order?*

This separation is powerful because ordering is a relationship/projection, not necessarily an intrinsic property of the entity.

30. Reordering Without Rewriting Entities
Suppose:
```javascript
userIds = ["u1", "u2", "u3"]
```
A reorder can change:
```javascript
userIds = ["u3", "u1", "u2"]
```
without changing:
`usersById`
The entity records remain stable.

This is particularly useful for:
- drag and drop
- sortable lists
- kanban boards
- playlist ordering
- navigation items
- priority queues

31. Relational State Model
A useful generalized model is:
```
Entities
│
├── identity
├── attributes
└── relationships
│
▼
Collections
│
├── membership
├── ordering
└── filtering
│
▼
UI projections
```
Do not force every layer into one object.
Instead, represent each concept according to its own semantics.

32. Denormalization at the Read Boundary
Normalization does not mean the UI must consume normalized structures directly.
You can reconstruct convenient objects:
```javascript
const visibleProjects = projectIds.map(id => {
  const project = projectsById[id]
  const owner = usersById[project.ownerId]
  return { ...project, owner }
})
```
This is a read projection.
The important distinction is:
```
Canonical storage ↓ read projection ↓ component rendering
```
You do not have to persist every convenient projection.

33. Normalized State and Object Identity
Normalization can also improve identity reasoning.
Suppose:
`usersById.u1` is one canonical object.
Multiple components can derive:
`user = usersById[u1]`
and reason about the same entity identity.

When an unrelated user changes:
`usersById.u2`
the `u1` entity can retain its reference.
That preserves useful structural sharing.

Do not interpret this as a promise that every component will automatically avoid rendering; rendering behavior depends on the surrounding component tree and optimization strategy.
The architectural point is:
> The state model makes entity identity explicit and stable.

34. State Normalization and Ownership
Normalization does not answer:
“Who owns this state?”
It answers:
“How should the owned information be represented?”

These are separate questions.
You can have:
- local normalized state
- or shared normalized state
- or server-derived normalized data

The ownership decision still comes first.
Ask:
- Who needs this information?
- Who changes it?
- Who owns its invariant?
- What is its lifetime?

Then decide how complex the state representation needs to be.

35. Prediction Challenge — Redundant Count
Consider:
```javascript
function Cart() {
  const [items, setItems] = useState([])
  const [count, setCount] = useState(0)

  function add(item) {
    setItems(prev => [...prev, item])
  }

  return (
    <>
      <button onClick={() => add({ id: 1 })}>
        Add
      </button>
      <div>{count}</div>
      <div>{items.length}</div>
    </>
  )
}
```

**Question:**
After clicking Add:
- What is count?
- What is items.length?

**Answer:**
The update only changes `items`.
Therefore:
```
count = 0
items.length = 1
```
The component contains two conflicting representations.
The fix is:
```javascript
const count = items.length
```

36. Prediction Challenge — Effect-Derived Count
Consider:
```javascript
function Cart() {
  const [items, setItems] = useState([])
  const [count, setCount] = useState(0)

  useEffect(() => {
    setCount(items.length)
  }, [items])

  return <div>{count}</div>
}
```
Initial:
`items = []`, `count = 0`

User adds an item.
Conceptually:
```
Render #1
items = [] count = 0
event ↓ setItems([...])
Render #2
items = [item] count = 0
commit ↓ effect ↓ setCount(1)
Render #3
items = [item] count = 1
```
The value was available during Render #2.
The effect introduced a synchronization cycle.
Prefer:
```javascript
const count = items.length
```

37. Prediction Challenge — Selected Object
Consider:
```javascript
function UserPanel({ users }) {
  const [selectedUser, setSelectedUser] = useState(null)

  return (
    <button onClick={() => setSelectedUser(users[0])}>
      {selectedUser?.name}
    </button>
  )
}
```
Initial:
`users[0] = { id: "u1", name: "Alice" }`

Click.
State becomes a reference to the selected object.

Now the parent receives:
```javascript
[ { id: "u1", name: "Alicia" } ]
```
The selected state may still reference:
`{ id: "u1", name: "Alice" }`

The component has stored an old entity representation.
If the desired fact is selection identity, use:
`selectedUserId`
and derive the current user from users.

38. Prediction Challenge — Valid Draft Duplication
Consider:
```javascript
function Editor({ savedName }) {
  const [draftName, setDraftName] = useState(savedName)

  return (
    <input
      value={draftName}
      onChange={e => setDraftName(e.target.value)}
    />
  )
}
```
Suppose:
`savedName = "Alice"`
`draftName = "Alicia"`

Is this automatically redundant state?
No.
The two values represent:
- `savedName` = externally committed value
- `draftName` = current editing session

They are allowed to diverge.
The important architectural question is what happens when `savedName` changes and what semantics the editor requires.
Do not solve that synchronization question blindly with an effect. First define the lifecycle contract.

39. Production Anti-Pattern #1 — “State Everything”
**Flawed Design:**
```javascript
const [products, setProducts] = useState([])
const [filteredProducts, setFilteredProducts] = useState([])
const [productCount, setProductCount] = useState(0)
const [totalPrice, setTotalPrice] = useState(0)
```
**Why Developers Do It:**
Because the UI visibly needs those values.

**Mechanical Failure:**
Each state variable becomes another independently scheduled representation.
Now every update must preserve:
```
filteredProducts === filter(products)
productCount === products.length
totalPrice === sum(products)
```

**Senior Refactor:**
```javascript
const [products, setProducts] = useState([])
const [query, setQuery] = useState("")

const filteredProducts = products.filter(...)
const productCount = products.length
const totalPrice = products.reduce(...)
```

**Engineering Principle:**
UI outputs are not automatically state.

40. Production Anti-Pattern #2 — Synchronizing State with Effects
**Flawed:**
```javascript
const [firstName, setFirstName] = useState("")
const [lastName, setLastName] = useState("")
const [fullName, setFullName] = useState("")

useEffect(() => {
  setFullName(`${firstName} ${lastName}`)
}, [firstName, lastName])
```

**Failure:**
The application now has: `firstName`, `lastName`, `fullName`, with:
`fullName === firstName + " " + lastName`
as an invariant.

**Better:**
```javascript
const fullName = `${firstName} ${lastName}`
```
The invariant is encoded structurally.

41. Production Anti-Pattern #3 — Storing Selected Objects
**Flawed:**
```javascript
const [selectedProduct, setSelectedProduct] = useState(null)
```
Selection handler:
```javascript
setSelectedProduct(product)
```

**Failure:**
The selected object can become stale if `product data changes` while the selected object reference remains unchanged.

**Better:**
```javascript
const [selectedProductId, setSelectedProductId] = useState(null)
```
Then:
```javascript
const selectedProduct =
  products.find(p => p.id === selectedProductId) ?? null
```

42. Production Anti-Pattern #4 — Deeply Nested State Without a Domain Reason
**Flawed:**
```javascript
const [dashboard, setDashboard] = useState({
  company: {
    teams: [
      {
        members: [
          {
            profile: {
              preferences: {
                notifications: {
                  email: true
                }
              }
            }
          }
        ]
      }
    ]
  }
})
```

**Failure:**
A small update requires copying a long object path.
As the application grows:
- update complexity ↑
- aliasing risk ↑
- mental load ↑

**Senior Response:**
Do not immediately normalize.
First determine:
- What entities exist?
- What relationships exist?
- Which parts update independently?
- Which components own which concepts?
Then redesign the representation if the domain warrants it.

43. Production Anti-Pattern #5 — Premature Normalization
**Flawed:**
A simple modal contains: `{ title, description, isOpen }`
The developer converts it into:
`entitiesById`, `entityIds`, `relationships`, `indexes`, `selectors`

**Failure:**
The abstraction is larger than the problem.

**Senior Response:**
Use the simplest state shape that preserves correctness.
Normalization is a tool for managing relational complexity.
It is not a badge of seniority.

44. Production Anti-Pattern #6 — Storing Both Entity and ID
**Flawed:**
```javascript
const [selectedId, setSelectedId] = useState(null)
const [selectedUser, setSelectedUser] = useState(null)
```
**Invariant:**
`selectedUser?.id === selectedId`

**Failure:**
Every update path must maintain the invariant.

**Better:**
Choose one canonical representation: `selectedId` and derive: `selectedUser`, unless the object represents an intentionally independent concept.

45. Production Incident — “Count Sometimes Wrong”
**Symptom:**
Analytics dashboard occasionally displays `Items: 47` while the list contains `48`.

**Root Cause:**
Two state variables `items` and `count` are updated through different paths.
One code path updates `setItems(...)` without `setCount(...)`.

**Corrective Architecture:**
Remove the duplicated state:
```javascript
const count = items.length
```

**Lesson:**
The bug was not primarily an update bug. It was a state-modeling bug.

46. Production Incident — “Selected User Shows Old Name”
**Symptom:**
A user edits their profile. The user list displays `Alicia`, but the selected-user panel displays `Alice`.

**Root Cause:**
The component stored `selectedUser` as a separate object reference.
The canonical collection changed. The selected object did not.

**Corrective Architecture:**
Store `selectedUserId` and derive `selectedUser` from the latest collection.

47. Production Incident — “UI Updates One Render Late”
**Symptom:**
A computed label changes one render after its source state.

**Root Cause:**
The derived value was implemented through:
```javascript
useEffect(() => {
  setDerived(...)
}, [source])
```

**Timeline:**
```
source update ↓ render ↓ commit ↓ effect ↓ derived state update ↓ second render
```

**Corrective Architecture:**
Compute it during render:
```javascript
const derived = calculate(source)
```

48. Production Incident — “Nested Update Is Becoming Unmaintainable”
**Symptom:**
Developers repeatedly write:
```javascript
{ ...a, b: { ...a.b, c: { ...a.b.c, d: newValue } } }
```

**Root Cause:**
Potentially state shape does not match independent domain concepts.

**Investigation:**
Ask:
- Is `b` actually an entity?
- Is `c` actually an entity?
- Are these entities referenced elsewhere?
- Do they update independently?
- Are relationships represented by IDs?

If yes, normalization may reduce complexity.
If no, a simpler local state split may be sufficient.

49. Diagnostic Lab — State Inventory
Take any real component.
Write down every state variable:
```
State:
────────────────────────────
1. products
2. query
3. selectedProduct
4. filteredProducts
5. count
6. isModalOpen
7. draftName
```
For each one classify:
- [ ] Canonical fact
- [ ] Derived value
- [ ] Temporary draft
- [ ] UI state
- [ ] Relationship/identity
- [ ] Redundant representation

Then draw:
```
state A ─────► derived B
state A ─────► derived C
state D ─────► derived E
```
Any derived value stored separately deserves scrutiny.

50. Diagnostic Lab — Invariant Hunting
For every pair of state variables, ask:
*What must always be true about these two?*

Examples:
- `selectedUser.id === selectedUserId`
- `count === items.length`
- `total === sum(items)`
- `isEmpty === items.length === 0`
- `visibleItems === filter(items, query)`
- `hasSelection === selectedId !== null`

If you discover many such invariants, your state model may be over-specified.

51. Diagnostic Lab — Dependency Graph
Create a graph:
```
Canonical State
│
├────► Derived A
│      │
│      └────► Derived B
│
└────► Derived C
```
Now inspect every state variable.
If something has only incoming dependencies and no independent mutation semantics, it probably does not need to be state.

52. Diagnostic Lab — React DevTools
Use React DevTools to inspect:
- Components
- Profiler
- props
- state
- render frequency

When a component has suspicious derived state:
1. Open React DevTools.
2. Select the component.
3. Inspect state variables.
4. Identify values that appear mathematically determined by other values.
5. Trigger the source update.
6. Observe whether a second update occurs.
7. Profile the interaction.
8. Compare before/after refactoring.

The goal is not merely to prove that an extra render exists.
The goal is to determine:
> Why did the architecture require another state transition?

53. Diagnostic Lab — console.table
A useful temporary diagnostic:
```javascript
console.table({
  itemCount: items.length,
  storedCount: count,
  selectedId,
  selectedObjectId: selectedUser?.id,
})
```
This can immediately expose invariants:
```
itemCount        48
storedCount      47
selectedId       u1
selectedObjectId u1
```
The first mismatch identifies a synchronization defect.

54. Diagnostic Lab — Identity Inspection
When debugging entity duplication:
```javascript
console.log({
  canonicalUser: usersById[u1],
  selectedUser,
  sameReference: usersById[u1] === selectedUser
})
```
Do not stop at: `sameReference = false`.
Ask the architectural question:
*Why are two representations of this entity supposed to exist?*
Reference inequality is a symptom.
State-model semantics are the actual issue.

55. State Modeling Decision Matrix
| Situation | Preferred Model |
| :--- | :--- |
| Value changes independently and must persist | State |
| Value can be calculated from props/state | Derived value |
| Count of array items | `items.length` |
| Filtered collection | Derived |
| Sorted collection | Derived |
| Selected entity identity | Selected ID |
| Current entity from selected ID | Derived |
| Persisted value vs editing draft | Separate concepts/state |
| Same entity duplicated across relationships | Consider normalization |
| Simple flat list | Simple array |
| Complex relational graph | Consider normalized representation |
| Temporary modal open state | Local UI state |
| Value only needed during one function execution | Local variable |
| Expensive pure calculation | Derived first; optimize separately if necessary |
| Derived value synchronized through effect | Usually refactor |
| Two state values must always agree | Reconsider state shape |

56. Senior Heuristic — The Six Questions
Before adding state, ask:
1. What exact fact does this state represent?
2. Can that fact change independently?
3. Can it be deterministically derived from existing inputs?
4. What invariant connects it to other state?
5. Who owns that invariant?
6. What is the lifetime of this information?

If the answer to #3 is:
`yes`
you should strongly question whether state is necessary.

If #2 is:
`no`
you should question whether independent state is necessary.

If #4 reveals:
`A must always equal f(B)`
you should strongly consider storing only B.

57. The Canonical-State Principle
Suppose:
```
A = source of truth
B = f(A)
C = g(A, B)
```
The architecture should usually look like:
```
A ├──► B = f(A)
  └──► C = g(A, B)
```
not:
```
A ─────► B
│        │
│        ▼
└──────► C
with A, B, C all stored independently
```
The second graph creates synchronization obligations.
The first encodes the relationships as computation.

58. State as a Minimal Information Set
A strong state model has a useful property:
> Remove any state variable and some independently changing information becomes impossible to represent.

Suppose:
```javascript
const [firstName, setFirstName] = useState("")
const [lastName, setLastName] = useState("")
const [fullName, setFullName] = useState("")
```
You can remove `fullName` because:
```javascript
const fullName = `${firstName} ${lastName}`
```
Therefore `fullName` was not canonical information.

Now consider:
```javascript
const [firstName, setFirstName] = useState("")
const [lastName, setLastName] = useState("")
```
Both may be independently edited.
Removing either changes what the UI can represent.
That is a better signal that they belong in state.

59. Minimal State Does Not Mean Tiny State
Do not interpret:
“Keep state minimal”
as:
“Put everything into one giant object.”

These are different.
Bad:
```javascript
const [everything, setEverything] = useState({
  modal: ...,
  form: ...,
  users: ...,
  filters: ...,
  dashboard: ...,
  notifications: ...
})
```
Minimality is about information redundancy, not object count.
You can have several state variables with no redundancy.
You can also have one giant state object containing enormous redundancy.

60. State Shape and Update Locality
Good state shape often makes updates local.
For example:
```javascript
const [isOpen, setIsOpen] = useState(false)
const [query, setQuery] = useState("")
const [selectedId, setSelectedId] = useState(null)
```
Each concept has a clear update mechanism.
Compare a giant structure where every update requires navigating unrelated data.

The senior goal is:
```
minimal information + clear ownership + predictable updates + explicit relationships
```

61. State Machine Thinking at the Fundamentals Boundary
Even without introducing a full reducer/state-machine implementation, you should recognize that some UI state is not a collection of unrelated booleans.

Bad:
```javascript
const [isLoading, setIsLoading] = useState(false)
const [hasError, setHasError] = useState(false)
const [hasData, setHasData] = useState(false)
```
This permits impossible combinations:
```
isLoading = true
hasError = true
hasData = true
```
A more coherent conceptual model is:
`idle | loading | success | error`

The important lesson for this Part is:
> State shape should represent valid domain/UI states rather than merely mirror individual visual flags.

Detailed reducer/state-machine mechanics belong to later material.

62. Derived Booleans
Derived booleans are particularly easy to accidentally store.
Instead of:
```javascript
const [hasItems, setHasItems] = useState(false)
```
with `setHasItems(items.length > 0)`, prefer:
```javascript
const hasItems = items.length > 0
```
Similarly:
```javascript
const isEmpty = items.length === 0
const hasSelection = selectedId !== null
const canSubmit = isValid && !isSubmitting
```
These are logical consequences.
They generally do not deserve independent state.

63. Derived State and Event Handlers
A subtle distinction:
This:
```javascript
function handleSubmit() {
  const total = items.reduce(...)
  submit(total)
}
```
is fine.
So is:
```javascript
const total = items.reduce(...)
```
The key issue is not where the derivation occurs.
The key issue is whether the derived result needs to be persistent React state.
A value that only exists to perform one event-side calculation can simply be a local variable.

64. State vs Local Variable vs Derived Value
Three categories:
```
┌──────────────────────────────────────┐
│            Local variable            │
│       Exists for one execution       │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│         Derived render value         │
│    Recomputed from current inputs    │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│             React state              │
│  Persists across renders and can     │
│  participate in update scheduling    │
└──────────────────────────────────────┘
```
Do not use state merely because a value is used in JSX.

65. Normalized State Example
Consider:
```javascript
const state = {
  usersById: {
    u1: { id: "u1", name: "Alice" },
    u2: { id: "u2", name: "Bob" }
  },
  teamsById: {
    t1: {
      id: "t1",
      name: "Frontend",
      memberIds: ["u1", "u2"]
    }
  },
  teamIds: ["t1"]
}
```
The relationships are:
```
teamIds
  │
  ▼
teamsById[t1]
  │
  └── memberIds
        │
        ├── u1 ──► usersById[u1]
        └── u2 ──► usersById[u2]
```
The UI can derive:
```javascript
const teamMembers = team.memberIds.map(id => usersById[id])
```
The canonical data remains relational.

66. Updating One Entity
Suppose Alice changes: `Alice → Alicia`
A normalized update conceptually changes:
`usersById.u1`
while preserving:
`usersById.u2`, `teamsById`, `teamIds`

The state graph communicates exactly which entity changed.
In a deeply duplicated denormalized graph, the same logical update could require touching many locations.

67. Normalization Trade-Offs
Normalization provides:
**Benefits:**
- single entity representation
- explicit relationships
- targeted updates
- less duplication
- easier consistency
- stable identity model

**Costs:**
- more indirection
- more lookup logic
- more state-shape complexity
- more relationship management
- more difficult direct inspection

Therefore:
`Normalize when it reduces domain complexity, not because normalized state looks more advanced.`

68. Senior Gotcha — “Derived Means Cheap”
False.
A derived calculation can be expensive.
But the correct response is not automatically:
```javascript
const [result, setResult] = useState(...)
```
Instead:
1. first establish semantic ownership
2. then evaluate performance
3. then choose an optimization mechanism

State ownership and computation caching are separate architectural concerns.

69. Senior Gotcha — “Duplicated Data Is Always Wrong”
False.
This is valid:
`saved document` vs `draft document`
because they represent different concepts.

This is suspicious:
`items` vs `itemCount`
because one is mechanically derived from the other.

The question is semantic identity, not textual similarity.

70. Senior Gotcha — “Normalization Fixes Deep State”
Not automatically.
If your problem is:
`component owns one small nested object`
normalization may be excessive.

If your problem is:
`hundreds of entities, many references, independent updates, relationships, duplicated records`
normalization may be exactly the right model.

71. Senior Gotcha — “Store the Object Because Lookup Is Annoying”
Convenience is not necessarily a good state-model criterion.
This: `selectedUser` may feel convenient.
But: `selectedUserId` often expresses the actual fact more accurately.

The lookup is a read concern.
The selected ID is an ownership concern.

72. Senior Gotcha — “Use an Effect to Keep It in Sync”
Whenever you see:
```javascript
useEffect(() => {
  setDerived(...)
}, [source])
```
ask:
*Is this actually synchronization with an external system?*

If the answer is:
*No. It is just calculating a value from React state/props.*
then render-time derivation is usually the better model.
Effects are not a general-purpose “after state changes” mechanism.

73. The State Architecture Pipeline
A mature state-modeling process looks like:
```
Requirements
     ↓
Identify independently changing facts
     ↓
Identify ownership
     ↓
Choose canonical representation
     ↓
Identify relationships
     ↓
Remove redundant representations
     ↓
Derive projections
     ↓
Normalize only if relational complexity warrants it
     ↓
Validate invariants
     ↓
Profile actual behavior
```
This is much stronger than:
"I need another useState."

74. Production Architecture Review Checklist
When reviewing a component, inspect:

**State necessity**
- [ ] Does every state variable represent persistent information?
- [ ] Does each state variable have an independent reason to change?
- [ ] Could any value be calculated during render?

**Canonicality**
- [ ] Is there exactly one authoritative representation of each fact?
- [ ] Are IDs preferred over duplicated entity objects where appropriate?
- [ ] Are derived booleans calculated instead of stored?

**Invariants**
- [ ] What must always equal what?
- [ ] Are invariants encoded structurally?
- [ ] Or are they manually synchronized?

**Draft semantics**
- [ ] Are duplicated-looking values actually different concepts?
- [ ] Is draft state intentionally independent?
- [ ] Is the lifecycle of the draft explicit?

**Relational complexity**
- [ ] Are entities repeated?
- [ ] Are relationships explicit?
- [ ] Would normalization reduce duplication?
- [ ] Would normalization add unnecessary indirection?

**Ownership**
- [ ] Who owns the canonical state?
- [ ] Who mutates it?
- [ ] Who derives projections?
- [ ] Does state lifetime match concept lifetime?

---

75. 🔥 The Crucible

Challenge 01 — Count
```javascript
const [items, setItems] = useState([])
const [count, setCount] = useState(0)
```
If `count === items.length` must always hold, identify the architectural problem.

**Expected reasoning:**
`count` is derived from `items`.
Prefer:
```javascript
const count = items.length
```

76. Challenge 02 — Filter
You have:
```javascript
const [products, setProducts] = useState([])
const [query, setQuery] = useState("")
const [filteredProducts, setFilteredProducts] = useState([])
```
Ask:
Which values are canonical? Which value is derived?

**Expected:**
- `products` = canonical
- `query` = canonical
- `filteredProducts` = derived

77. Challenge 03 — Selected Entity
You have:
```javascript
const [selectedUser, setSelectedUser] = useState(null)
```
The user collection updates from the server.
The selected panel shows stale information.
What state-model change would you investigate?

**Expected:**
Store `selectedUserId` and derive the current entity from the canonical collection.

78. Challenge 04 — Draft
You have:
```javascript
savedName = "Alice"
draftName = "Alicia"
```
Should one necessarily be deleted?

**Expected:**
No. Determine whether `savedName` and `draftName` represent distinct concepts.
If yes, both may be legitimate.

79. Challenge 05 — Relational Data
You have:
- 1,000 tasks
- 500 users
- each task contains a full user object
- the same users appear in many tasks
- user updates are frequent

Would you investigate normalization?

**Expected:**
Yes. There is stable entity identity, repeated representation, many relationships, and independent entity updates. A normalized model may substantially reduce consistency problems.

80. Challenge 06 — Premature Normalization
You have:
```javascript
const [tabs, setTabs] = useState([
  "Overview", "Activity", "Settings"
])
```
Someone proposes:
`tabsById`, `tabIds`, `tabRelationships`
Should you accept automatically?

**Expected:**
No. The data has little relational complexity. The normalized representation likely adds more complexity than it removes.

81. Challenge 07 — Effect Synchronization
You see:
```javascript
const [fullName, setFullName] = useState("")

useEffect(() => {
  setFullName(`${firstName} ${lastName}`)
}, [firstName, lastName])
```
What is your first architectural question?

**Expected:**
Whether `fullName` is truly independent state.
If not:
```javascript
const fullName = `${firstName} ${lastName}`
```

82. Challenge 08 — Invariant Discovery
You find:
```javascript
const [selectedId, setSelectedId] = useState(null)
const [hasSelection, setHasSelection] = useState(false)
```
What invariant probably exists?
`hasSelection === (selectedId !== null)`

What is the likely better representation?
```javascript
const hasSelection = selectedId !== null
```

83. Challenge 09 — State Shape
A component contains:
`profile`, `settings`, `teams`, `projects`, `notifications`, `modal`, `filters`, `drafts`
inside one enormous state object.

Is the problem necessarily “too much state”?
Not necessarily.
The deeper questions are:
- Which concepts have independent lifetimes?
- Which concepts share ownership?
- Which are relational?
- Which are derived?
- Which should be colocated?

84. Challenge 10 — Normalize or Split?
A nested object is difficult to update.
Possible solutions:
- A. normalize
- B. split into several local states
- C. derive the value
- D. move ownership
- E. leave it unchanged

There is no universal answer.
The senior engineer identifies the actual source of complexity before choosing the mechanism.

85. Master Prediction Scenario
Consider:
```javascript
function ProjectView({ projects, users }) {
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [query, setQuery] = useState("")

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(query.toLowerCase())
  )

  const selectedProject =
    projects.find(project => project.id === selectedProjectId) ?? null

  const selectedOwner = selectedProject
    ? users.find(user => user.id === selectedProject.ownerId)
    : null

  return (
    <>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      {filteredProjects.map(project => (
        <button
          key={project.id}
          onClick={() => setSelectedProjectId(project.id)}
        >
          {project.name}
        </button>
      ))}
      <div>
        {selectedProject?.name}
        {" — "}
        {selectedOwner?.name}
      </div>
    </>
  )
}
```

86. Master Prediction — Render #1
Assume:
```
projects: p1 → Frontend, owner u1
          p2 → Backend, owner u2
users:    u1 → Alice
          u2 → Bob
selectedProjectId = null
query = ""
```
Derived:
```
filteredProjects = [p1, p2]
selectedProject = null
selectedOwner = null
```
The UI renders both projects.

87. Master Prediction — Click Frontend
Handler:
`setSelectedProjectId("p1")`
The current render's `selectedProjectId` does not mutate.
React schedules another render.

88. Master Prediction — Render #2
State:
`selectedProjectId = "p1"`, `query = ""`
Derived:
```
filteredProjects = [p1, p2]
selectedProject = projects.find(...) = p1
selectedOwner = users.find(...) = Alice
```
The UI now displays:
`Frontend — Alice`
No additional state synchronization is necessary.

89. Master Prediction — Server Updates Alice
Now:
`users: u1 → Alicia`, `u2 → Bob`
No selection state changes.
The component renders again because its inputs changed.
The selected project remains: `p1`
The derived owner lookup now produces: `Alicia`
The UI becomes:
`Frontend — Alicia`
This is exactly what a canonical identity model should provide.

90. What Would Have Gone Wrong?
Suppose instead the component stored:
```javascript
const [selectedProject, setSelectedProject] = useState(null)
const [selectedOwner, setSelectedOwner] = useState(null)
```
The application would now need to synchronize:
`selectedProject`, `selectedOwner`, `projects`, `users`
Every update path becomes more complicated.
The canonical model avoids this.

91. Production Decision Framework
When state modeling becomes difficult, use this sequence:
```
               START
                 │
                 ▼
         What is the fact?
                 │
                 ▼
  Does it persist across renders?
        /                \
      NO                  YES
       │                   │
       ▼                   ▼
local variable     Can it be derived?
                         /     \
                       YES      NO
                        │        │
                        ▼        ▼
                    derive it   Can it change independently?
                                      /          \
                                    NO            YES
                                     │             │
                                     ▼             ▼
                            reconsider       store state
                          representation
```

Then separately:
```
Does the data contain many related entities?
            │
      ┌─────┴─────┐
     NO          YES
      │           │
      ▼           ▼
 stay simple   evaluate normalization
```

92. Senior-Level State Smells
Treat these as review signals:
- 🚨 state variable whose value equals another state's length
- 🚨 state variable that equals a boolean expression
- 🚨 state object copied from another state object
- 🚨 selected object plus selected ID
- 🚨 derived collection stored in state
- 🚨 effect whose only purpose is setting derived state
- 🚨 duplicated entity records
- 🚨 deeply nested relational objects
- 🚨 giant “everything” state object
- 🚨 normalization with no relational problem
- 🚨 multiple booleans representing mutually exclusive states
- 🚨 state with no clear owner
- 🚨 state whose lifetime does not match its concept

A smell is not automatically a bug.
It is an instruction:
*Investigate the model.*

93. Cross-KPI Boundary
This Part establishes state modeling.
It intentionally does not deeply teach:
- `useReducer` architecture
- advanced reducer composition
- external stores (Redux/Zustand/etc.)
- server-state libraries
- concurrent scheduling lanes
- transitions
- advanced memoization

Those belong elsewhere in the curriculum.
The core competency here is:
> Can you design React state so that the application has one coherent source of truth and derives everything that does not independently need to exist?

94. Connection to Earlier KPIs
- **KPI 01 — Mental Model:** State is part of $UI = f(props, state)$. This Part asks: *What should actually be inside state?*
- **KPI 02 — JSX:** JSX consumes derived projections. JSX does not determine what deserves state.
- **KPI 03 — Components:** State ownership belongs to the component that owns the invariant. The state model must align with component boundaries.
- **KPI 04 — Previous Parts:** Earlier Parts established state persistence, `useState`, update queues, functional updates, immutability, identity. This Part asks: *What information should those mechanisms store in the first place?*
That is the architectural progression.

95. Completion Checklist
You should be able to confidently verify every item below.

**State Modeling**
- [ ] I can define canonical state.
- [ ] I can distinguish canonical state from derived data.
- [ ] I can explain why minimal state reduces synchronization problems.
- [ ] I can identify redundant state.
- [ ] I can identify state that represents independently changing information.
- [ ] I can distinguish local variables from React state.
- [ ] I can explain why using JSX does not automatically justify state.
- [ ] I can model state as a dependency graph.
- [ ] I can identify state invariants.

**Derived Data**
- [ ] I can derive filtered collections during render.
- [ ] I can derive counts from collections.
- [ ] I can derive booleans from canonical state.
- [ ] I can derive totals from entity data.
- [ ] I can explain why effect-based derivation is usually inferior.
- [ ] I can predict the additional render caused by effect-based derivation.
- [ ] I can distinguish derivation from caching/optimization.
- [ ] I can avoid storing deterministic projections as state.

**Entity Identity**
- [ ] I understand why selected IDs can be preferable to selected objects.
- [ ] I can identify stale selected-object problems.
- [ ] I can derive the current entity from canonical entity data.
- [ ] I understand the distinction between entity identity and entity representation.
- [ ] I can recognize duplicated entity representations.

**Draft State**
- [ ] I understand why draft state can legitimately differ from persisted state.
- [ ] I can distinguish semantic duplication from intentional independent state.
- [ ] I can reason about state lifetime.
- [ ] I do not blindly remove every duplicate-looking value.

**State Shape**
- [ ] I understand that state shape is an architectural decision.
- [ ] I can recognize unnecessarily deep state.
- [ ] I can distinguish deep nesting from genuine relational complexity.
- [ ] I can reason about update locality.
- [ ] I can recognize boolean combinations representing invalid states.

**Normalization**
- [ ] I can explain normalization.
- [ ] I understand `byId` entity storage.
- [ ] I understand ID-based relationships.
- [ ] I understand ordered ID collections.
- [ ] I can explain why normalization reduces duplicated entity records.
- [ ] I can identify when normalization is useful.
- [ ] I can identify when normalization is premature.
- [ ] I understand normalized storage versus read projections.
- [ ] I understand that normalization does not solve state ownership.

**Senior Reasoning**
- [ ] I can identify synchronization obligations between state variables.
- [ ] I can replace redundant state with derivation.
- [ ] I can explain why canonical state reduces entire classes of bugs.
- [ ] I can inspect a component and inventory its state.
- [ ] I can draw a state dependency graph.
- [ ] I can identify the invariant behind suspicious state.
- [ ] I can choose between simple state and normalized state based on domain complexity.
- [ ] I can explain my state-shape decision mechanically rather than stylistically.

96. Final Engineering Principle
> 🏆 **State Is the Model; UI Is the Projection**  
> A senior React engineer does not begin state design by asking:  
> “What does the UI need to remember?”  
> They ask:  
> “What independently changing facts must persist, who owns them, and what can be deterministically reconstructed from them?”

Store the facts.
Derive the consequences.
Represent relationships explicitly when they matter.
Preserve intentional independent concepts such as drafts.
Normalize relational data only when normalization reduces complexity.
And whenever two state variables must always agree, stop and question the model before writing another synchronization update.

97. Part 09 Master Mental Model
```
┌──────────────────────┐
│  INDEPENDENT FACTS   │
│                      │
│   canonical React    │
│        state         │
└──────────┬───────────┘
           │
   ┌───────┴───────┐
   │               │
   ▼               ▼
simple values  relationships
                   │
                   │ normalize when
                   │ complexity warrants
                   │
   ┌───────────────┘
   ▼
PURE DERIVATION
   │
   ┌───────────────┼───────────────┐
   ▼               ▼               ▼
filtered       selected         totals
  rows          entity          flags
   │               │               │
   └───────────────┼───────────────┘
                   │
                   ▼
                  JSX
                   │
                   ▼
              React render
```

The entire Part can be compressed into one engineering equation:
```
Good State Architecture = Canonical Facts + Explicit Ownership + Intentional Relationships + Derived Projections − Redundant Representations − Unnecessary Synchronization
```

And the senior review question is:
> “If this state variable disappeared, what independently changing information would the application lose?”

If the answer is:
“Nothing; I can calculate it from the state I already have.”
then you probably found derived data, not state.

98. Companion Lab Specification
Create:
`examples/09-state-structure-derived-state-normalization.html`

The standalone visualizer should contain four interactive sections:

**Lab A — Redundant State**
Visualize: `items`, `count`
Allow the user to add/remove items and intentionally create synchronization divergence.
Display:
- Canonical `items.length`
- Stored `count`
- Invariant status

**Lab B — Derived State**
Show: `items`, `query` $\to$ `filteredItems`
Update the inputs live and visualize the dependency graph.

**Lab C — Selected ID vs Selected Object**
Provide: `users`, `selectedUserId`, `selectedUserObject`
Allow user records to update and visibly demonstrate how a stored selected object can become stale while an ID-based selection resolves the latest entity.

**Lab D — Normalized vs Duplicated Entities**
Provide:
- Denormalized: `projects` $\to$ embedded users
- Normalized: `projectsById` $\to$ `ownerId` $\to$ `usersById`
Update one user and visualize how many entity representations must change in each model.

The lab should remain:
- standalone
- zero-build
- zero external dependencies
- double-click runnable
- dark-mode engineering-dashboard style
- interactive
- mechanically explanatory

99. Part 09 Exit Criterion
You are not finished with this Part merely because you can define “derived state.”
You are finished when you can take an unfamiliar React component and, without guessing:
1. Inventory every state value.
2. Identify the independently changing facts.
3. Identify the owner of each fact.
4. Identify redundant representations.
5. Identify every invariant.
6. Convert deterministic values into derivations.
7. Distinguish drafts from accidental duplication.
8. Identify entity relationships.
9. Decide whether normalization actually reduces complexity.
10. Predict the render behavior after the refactor.
11. Explain the production failure prevented by the new state model.

That is the senior-level competency this Part is designed to establish.

Part Boundary
Next Part:
**KPI 04 — Part 10 — Controlled & Uncontrolled State**
The next Part moves from how state should be modeled internally to how a component exposes state ownership through controlled and uncontrolled APIs, including ownership transfer, synchronization boundaries, default values, control contracts, and the architectural consequences of choosing who owns the state.
