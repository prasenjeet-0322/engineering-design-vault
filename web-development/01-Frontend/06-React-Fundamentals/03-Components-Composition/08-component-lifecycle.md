Level 06 — React Fundamentals
KPI 03 — Components, Props & Composition
PART 08 — Component Lifecycle: Mount, Update, Unmount & Effects
[⬅️ Previous Part](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/07-component-identity-and-keys.md) | [📚 Level 06 Index](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/README.md) | [🧪 Companion Lab](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/examples/08-component-lifecycle.html) | [Next Part ➡️](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/09-component-state-ownership.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

PART PURPOSE
A React component does not simply “run once.”
A component participates in a lifecycle in which React can:
create a component occurrence
↓
render it
↓
commit its UI
↓
synchronize external systems
↓
render again because inputs changed
↓
commit changes
↓
synchronize again if required
↓
eventually remove the component
↓
clean up external resources

Understanding this lifecycle is essential because many production bugs come from confusing:
rendering,
committing,
browser effects,
event handlers,
React effects,
component identity,
state preservation,
cleanup.

The central question is not:
“Which lifecycle method should I call?”
The senior-level question is:
“What external synchronization does this component occurrence own, when does that synchronization need to start, and when must it stop?”

This Part establishes that mental model.

SCOPE
This Part covers:
component mount
component update
component unmount
render versus commit
effect setup
effect cleanup
useEffect
dependency arrays
synchronization with external systems
subscriptions
timers
event listeners
network-request fundamentals
resource ownership
effect lifecycle
cleanup ownership
effect dependency reasoning
common effect anti-patterns
render-time versus effect-time work
event handlers versus effects
effect-driven synchronization
development behavior relevant to effect correctness
debugging lifecycle behavior
production incident diagnosis

This Part does not deeply cover:
concurrent rendering internals
scheduler lanes
transitions
Suspense architecture
advanced stale-closure analysis
advanced effect optimization
React Compiler
render performance engineering
advanced memoization
hydration behavior
Those are deferred to Level 7 — Advanced React & Rendering.

LAYER 1 — ⚡ 30-SECOND EXECUTIVE CHEAT SHEET & CORE MENTAL MODELS
1. The Core Lifecycle Model
Think in terms of render snapshots and synchronization lifetimes:
COMPONENT OCCURRENCE
│
▼
┌─────────────┐
│   RENDER    │
│             │
│  Calculate  │
│   next UI   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   COMMIT    │
│             │
│ Apply React │
│   changes   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   EFFECT    │
│             │
│ Synchronize │
│  external   │
│   system    │
└──────┬──────┘
       │
       ▼
external system active
       │
   ┌───┴───┐
   │       │ dependency   unmount
 change    │
   │       │
   ▼       ▼
cleanup cleanup
   │
   ▼
 setup
   │
   ▼
new synchronization

The critical distinction is:
Render ≠ Commit ≠ Effect

2. The Most Important Mental Model
A component render answers:
“What should the UI look like for this snapshot?”

An effect answers:
“Now that this UI has been committed, what external system must this component synchronize with?”

Examples of external systems:
browser event listeners
timers
WebSocket-like connections
subscriptions
imperative third-party widgets
media playback
external stores
network synchronization

Therefore:
Render ↓ describe UI
Commit ↓ make React's UI changes real
Effect ↓ synchronize with something outside React

3. Executive Concept Table
Concept | Core Mechanism | Production Impact | Common Senior Trap
--- | --- | --- | ---
Mount | Component occurrence enters committed tree | Initialization/synchronization begins | Treating mount as “run code once”
Update | Existing identity receives new inputs/state | UI and synchronization may change | Assuming every render requires effect work
Unmount | Component occurrence leaves committed tree | Owned resources must be released | Forgetting subscriptions/listeners/timers
Render | React calculates UI | Must remain pure | Performing external side effects during render
Commit | React applies the resulting UI changes | Establishes committed state | Assuming render means DOM is already updated
Effect | Post-commit synchronization | Connects React to external systems | Using effects for ordinary derived calculations
Dependency | Values that determine synchronization inputs | Controls effect re-synchronization | Treating dependencies as an arbitrary “when to run” list
Cleanup | Stops previous synchronization | Prevents leaks and stale resources | Thinking cleanup means “unmount only”
Event Handler | Responds to user/system event | Represents interaction causality | Moving event-specific actions into effects
Effect Ownership | Component owns external resource lifecycle | Makes teardown predictable | Creating resources without clear ownership

4. Golden Rule
Keep rendering pure. Use effects to synchronize with external systems after commit, and make cleanup the exact inverse of the synchronization that setup established.

A useful engineering test is:
Can this logic be calculated during render?
│
├── YES → Prefer render-time calculation.
│
└── NO
    │
    ▼
Does it respond directly to a user/event action?
│
├── YES → Prefer the event handler.
│
└── NO
    │
    ▼
Does it synchronize React with an external system?
│
├── YES → Effect may be appropriate.
│
└── NO → Reconsider whether an effect is needed.

5. Lifecycle in One Sentence
A React component occurrence has a lifetime:
mount
↓
zero or more updates
↓
unmount

During that lifetime:
render → commit → effect synchronization
can happen repeatedly.

The component function itself should not be interpreted as:
“the component.”
Instead distinguish:
Component type ↓ function declaration
Component occurrence ↓ one mounted identity in the tree
Render ↓ one invocation producing one snapshot
Fiber ↓ React's runtime representation of that occurrence

This distinction becomes critical when predicting state and effect behavior.

LAYER 2 — 🔬 DEEP MECHANICAL BREAKDOWN
6. What Does “Lifecycle” Actually Mean?
Lifecycle describes changes in the existence and participation of a component occurrence in the React tree.

At a fundamentals level:
Not present
│
│ React renders occurrence
▼
Mounted
│
│ props/state/context change
▼
Updated
│
│ identity removed/replaced
▼
Unmounted

A component can update many times:
Mount
↓
Update
↓
Update
↓
Update
↓
Update
↓
Unmount

There is no fixed number of updates.

7. Component Type vs Component Occurrence
Consider:
function Counter() {
  return <button>Count</button>;
}

Counter is a component type.

Now:
<>
  <Counter />
  <Counter />
</>
creates two component occurrences.

Conceptually:
Counter component type
│
├── occurrence A
│
└── occurrence B

Each occurrence can have:
its own state
its own effect lifecycle
its own props
its own identity
its own cleanup

Therefore:
same component type ≠ same component occurrence

This distinction was established in Part 07 and becomes essential here.

8. Mount
A component occurrence is mounted when React establishes it as part of the committed UI tree.

Example:
function App() {
  return <Profile />;
}

When <Profile /> first becomes part of the committed tree:
App
│
└── Profile
Profile has mounted.

For a component containing:
useEffect(() => {
  // synchronization
}, []);
the effect setup becomes eligible after the relevant commit.

The important sequence is:
React determines Profile should exist
↓
Profile renders
↓
React commits the resulting UI
↓
effect synchronization runs

Do not mentally model this as:
component function starts
↓
effect immediately executes
↓
DOM gets rendered
That reverses the conceptual phases.

9. Update
A mounted component updates when React needs to reconcile a new render for that occurrence.

Possible causes include:
state update
props change
context change
ancestor-driven rendering

Not every parent render necessarily means the child receives a meaningful input change, and not every render means an effect must synchronize again.

For example:
function UserCard({ user }: { user: User }) {
  return <h2>{user.name}</h2>;
}

If the component renders again:
Render #1 user = Alice
Render #2 user = Alice
the component has rendered again, but the external synchronization requirements may be unchanged.

This is why:
render count
and:
effect synchronization count
are not synonymous concepts.

10. Unmount
Unmount means the component occurrence is removed from the committed tree.

Example:
function App() {
  const [open, setOpen] = useState(true);
  return open ? <Dialog /> : null;
}

When:
open = true
the tree contains:
App
│
└── Dialog

When:
open = false
the resulting tree becomes:
App

The Dialog occurrence is removed.

If that occurrence owns an external resource:
Dialog
├── timer
├── event listener
└── subscription
those resources must not continue indefinitely.
The cleanup function provides the lifecycle boundary.

11. useEffect Is Not “A Lifecycle Method”
A beginner mental model often says:
useEffect = componentDidMount + componentDidUpdate + componentWillUnmount

This is convenient but incomplete and potentially misleading.

A better mental model is:
useEffect describes synchronization between a committed React component and an external system.

Example:
useEffect(() => {
  const connection = connect(roomId);
  return () => {
    connection.disconnect();
  };
}, [roomId]);

This is not fundamentally saying:
“Run this after mount and whenever roomId changes.”

It is saying:
“Keep the external connection synchronized with the current roomId.”

That distinction produces better designs.

12. The Effect Synchronization Model
Suppose:
useEffect(() => {
  const connection = connect(roomId);
  return () => {
    connection.disconnect();
  };
}, [roomId]);

Conceptually:
React commit
↓
Effect dependencies describe current synchronization inputs
↓
setup connection(roomId)
↓
external system synchronized

If roomId changes:
old synchronization
↓
cleanup old connection
↓
new synchronization
↓
connect(newRoomId)

If the component unmounts:
current synchronization
↓
cleanup
↓
external connection released

This gives us the central effect lifecycle:
SETUP
↓
resource active
↓
dependency changes OR unmount
↓
CLEANUP
↓
possibly SETUP again

13. Cleanup Is Not Only an Unmount Concept
A common misconception:
“Cleanup runs when the component unmounts.”

More precisely, cleanup corresponds to the previous effect synchronization ending.

For:
useEffect(() => {
  const subscription = subscribe(userId);
  return () => {
    subscription.unsubscribe();
  };
}, [userId]);

Suppose:
Render #1 userId = 10

Then:
commit
↓
setup subscription(10)

Later:
Render #2 userId = 20

The synchronization target changed.
Conceptually:
cleanup subscription(10)
↓
setup subscription(20)

Finally:
unmount
↓
cleanup subscription(20)

Therefore:
cleanup
means:
stop the synchronization established by the previous setup.

14. Setup and Cleanup Should Form a Pair
Good:
useEffect(() => {
  const handler = () => {
    console.log(window.scrollY);
  };
  window.addEventListener("scroll", handler);
  return () => {
    window.removeEventListener("scroll", handler);
  };
}, []);

Setup: addEventListener
Cleanup: removeEventListener

Good:
useEffect(() => {
  const timer = setInterval(refresh, 5000);
  return () => {
    clearInterval(timer);
  };
}, []);

Setup: setInterval
Cleanup: clearInterval

The senior rule:
Cleanup should undo the resource acquisition performed by setup.

15. Why Render Must Remain Pure
Consider:
function Profile({ userId }: Props) {
  fetch(`/api/users/${userId}`);
  return <div>Profile</div>;
}

This is dangerous because rendering is supposed to calculate UI.
The fetch is an external side effect.

Conceptually:
render ↓ calculate UI
should not become:
render ↓ network request ↓ calculate UI
because React may perform rendering work without that render becoming the final committed UI.

The safe fundamentals-level model is:
render
↓
describe UI
↓
commit
↓
effect
↓
synchronize external system

This is one reason React's purity requirement matters.

16. Render Is a Calculation
Think of a render as:
inputs + state snapshot + context
↓
component function
↓
React element tree

Example:
function Greeting({ name }: Props) {
  return <h1>Hello {name}</h1>;
}

Conceptually:
props.name = "Alice"
↓
render
↓
<h1>Hello Alice</h1>

The function describes the desired UI.
It should not secretly:
subscribe,
mutate global systems,
start timers,
modify unrelated DOM,
send analytics,
establish connections.

Those are synchronization or event responsibilities.

17. Event Handlers vs Effects
This distinction is critical.

Suppose a user clicks:
<button onClick={handleCheckout}>
  Checkout
</button>

The checkout request is caused by:
USER CLICK

Therefore:
function handleCheckout() {
  submitOrder();
}
is the natural location.

Do not automatically create:
useEffect(() => {
  if (shouldCheckout) {
    submitOrder();
  }
}, [shouldCheckout]);
just because an effect can execute code.

The question is:
What caused the operation?

If the causal event is:
click
the event handler owns it.

If the causal requirement is:
keep an external system synchronized with current state
an effect may own it.

18. Causality Is a Better Effect Test
Use this decision model:
Something needs to happen
│
▼
What caused it?
│
├── User interaction
│   ↓
│   Event handler
│
├── Render-derived value
│   ↓
│   Calculate during render
│
└── External synchronization requirement
    ↓
    Effect

Example:
const fullName = `${firstName} ${lastName}`;
No effect.

const handleSubmit = () => {
  saveForm();
};
Event handler.

useEffect(() => {
  document.title = title;
}, [title]);
External browser state synchronization.

19. Dependency Arrays
Consider:
useEffect(() => {
  connect(roomId);
}, [roomId]);

The dependency list should be understood as describing the reactive inputs used by the synchronization.

If the effect reads:
roomId
and synchronization must change when roomId changes:
[roomId]
expresses that relationship.

Do not think:
“The array is a scheduling menu where I manually choose which renders should run this effect.”

A stronger mental model:
Effect synchronization depends on: roomId
Therefore: roomId changes ↓ previous synchronization becomes obsolete ↓ cleanup ↓ new synchronization

20. Empty Dependency Array
Example:
useEffect(() => {
  const timer = setInterval(refresh, 5000);
  return () => {
    clearInterval(timer);
  };
}, []);

An empty dependency list means the effect does not declare changing reactive inputs.
It does not mean:
“This is universally a mount-only operation.”

The synchronization still belongs to a particular component occurrence.
The effect:
begins after the relevant commit,
remains associated with that occurrence,
cleans up when that synchronization ends, including unmount.

Also, development tooling/configuration can expose incorrect assumptions about effect cleanup and idempotence.
Therefore avoid designing effects around:
“I need this to execute exactly once because React promises once.”
Instead design:
setup + correct cleanup
so repeated setup/cleanup sequences remain safe.

21. Dependency List vs [] vs No Dependency List
Compare:

No dependency list:
useEffect(() => {
  synchronize();
});
Conceptually, the effect is eligible after commits repeatedly.
This can be appropriate in specific synchronization designs but is frequently a signal to inspect whether the effect has a clear synchronization model.

Empty dependency list:
useEffect(() => {
  synchronize();
}, []);
The effect declares no changing reactive dependencies.

Specific dependencies:
useEffect(() => {
  synchronize(userId);
}, [userId]);
The synchronization tracks userId.

The key question is never simply:
“Which syntax should I use?”
The key question is:
“What inputs determine the external synchronization represented by this effect?”

22. Effect Example: Subscription
function OnlineStatus({ userId }: Props) {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const subscription = presence.subscribe(userId, status => {
      setOnline(status);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return <span>{online ? "Online" : "Offline"}</span>;
}

Ownership:
OnlineStatus occurrence
│
└── owns subscription(userId)

When userId changes:
old user subscription
↓
unsubscribe
↓
new user subscription

When the component unmounts:
unsubscribe

The state update:
setOnline(status)
is not itself the external resource.
The subscription is.
That distinction helps identify what cleanup should release.

23. Effect Example: Timer
function PollingIndicator() {
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTicks(value => value + 1);
    }, 1000);

    return () => {
      clearInterval(id);
    };
  }, []);

  return <span>{ticks}</span>;
}

Ownership:
component occurrence
│
└── interval

Lifecycle:
mount
↓
render
↓
commit
↓
create interval
↓
timer fires
↓
state update
↓
render
↓
commit
↓
interval remains active
↓
unmount
↓
clear interval

Notice:
state update
causes a render, but does not necessarily create a new interval because the effect's synchronization inputs have not changed.

24. Render-by-Render Prediction #1 — Mount
function Panel() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log("effect", count);
    return () => {
      console.log("cleanup", count);
    };
  }, [count]);

  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
}

Initial render:
Render #1 state snapshot: count = 0
JSX: <button>0</button>

React commits:
DOM: <button>0</button>

Then effect synchronization:
effect 0

Conceptual lifecycle:
Render #1 ↓ Commit #1 ↓ Effect setup for count=0

25. Render-by-Render Prediction #2 — State Update
User clicks.
The event handler from Render #1 contains:
setCount(count + 1);
Its captured count is:
0
So it requests:
1

Next render:
Render #2 state snapshot: count = 1
JSX: <button>1</button>

React commits:
<button>1</button>

The previous effect synchronization depends on:
count = 0
The new render requires:
count = 1

Therefore conceptually:
cleanup for count=0
↓
effect setup for count=1

So the lifecycle trace is:
Render #1
↓
Commit #1
↓
Effect(0)
click
↓
state update
Render #2
↓
Commit #2
↓
Cleanup(0)
↓
Effect(1)

26. Render-by-Render Prediction #3 — Unmount
Now:
function App() {
  const [visible, setVisible] = useState(true);

  return (
    <>
      <button onClick={() => setVisible(false)}>
        Hide
      </button>
      {visible && <Panel />}
    </>
  );
}

Initial:
App
├── Button
└── Panel

After clicking Hide:
App └── Button

The Panel occurrence disappears.
Its active effect synchronization must be cleaned up.

Lifecycle:
Panel mounted
↓
effect active
↓
App state update
↓
Panel no longer exists in resulting tree
↓
Panel unmount
↓
Panel effect cleanup

27. Fiber-Level Mental Model
At this level, you do not need to study React's source code, but you should understand the runtime distinction.

Conceptually:
Component function
↓
React element
↓
Fiber representation
↓
committed tree
↓
host DOM

A Fiber associated with a component occurrence can conceptually contain:
Fiber
├── pendingProps
├── memoizedState
├── child
├── sibling
├── return
└── ...

Hooks such as:
useState(...)
useEffect(...)
are associated with the component's hook state representation.

Therefore:
Component function ≠ Fiber ≠ DOM node

An effect belongs conceptually to the component occurrence's React-managed lifecycle, not directly to the JavaScript function declaration itself.

28. Current Tree and Work-in-Progress Tree
React can maintain:
current tree
representing the committed UI and a:
work-in-progress tree
representing work toward the next result.

For Level 6, the key implication is:
Rendering is not equivalent to commitment.

Therefore avoid reasoning:
component function executed
↓
side effect is definitely visible

Instead:
render calculation
↓
reconciliation
↓
commit
↓
post-commit synchronization

The advanced mechanics of how React schedules and interrupts this work belong to Level 7.

29. Effect Dependencies and Object Identity
Consider:
function Search({ query }: Props) {
  const options = { query, limit: 20 };

  useEffect(() => {
    search(options);
  }, [options]);

  return <Results />;
}

Each render creates:
new options object

Therefore JavaScript identity differs:
options(Render #1) !== options(Render #2)
even if:
query = "react"
limit = 20
in both renders.

This means the effect's dependency relationship may observe a changing object reference.
The deeper performance implications belong to later material, but the fundamental principle is important:
Dependency reasoning operates over values/references produced by JavaScript renders.

Do not confuse:
same contents
with:
same object identity

30. Derived Data Does Not Need an Effect
Bad:
function User({ firstName, lastName }: Props) {
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    setFullName(`${firstName} ${lastName}`);
  }, [firstName, lastName]);

  return <h1>{fullName}</h1>;
}

This creates an unnecessary sequence:
props change
↓
render
↓
effect
↓
state update
↓
render again

The value is directly derivable.

Better:
function User({ firstName, lastName }: Props) {
  const fullName = `${firstName} ${lastName}`;
  return <h1>{fullName}</h1>;
}

Now:
props
↓
render
↓
derived value
↓
UI

No synchronization is required.

Senior rule:
Do not use an effect to calculate data that can already be calculated from the current render inputs.

31. Effect Anti-Pattern — State Synchronization Loop
Bad:
useEffect(() => {
  setFilteredItems(
    items.filter(item => item.category === category)
  );
}, [items, category]);

If:
filteredItems
is purely derived from:
items + category
it does not need to be separate state.

Prefer:
const filteredItems = items.filter(item => item.category === category);

The effect is introducing synchronization between two React state representations when no external system exists.
That creates:
source state
↓
render
↓
effect
↓
derived state
↓
render again

This is usually unnecessary complexity.

32. Effect Anti-Pattern — “Run After Every Render”
Bad reasoning:
useEffect(() => {
  calculateSomething();
});
followed by:
“I need this because I want code after every render.”

The real question is:
Why does calculateSomething need to happen after commit?

If the result is render-derived:
calculate during render

If it responds to an event:
event handler

If it synchronizes an external system:
effect

Effects should have a meaningful synchronization responsibility.

33. Effect Anti-Pattern — Event Chains Through State
Consider:
function Form() {
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (submitted) {
      sendAnalytics();
    }
  }, [submitted]);

  function handleSubmit() {
    saveForm();
    setSubmitted(true);
  }

  return <form onSubmit={handleSubmit}>...</form>;
}

The analytics event is causally connected to:
form submission
not fundamentally to:
submitted === true

The effect creates an indirect event chain:
submit
↓
state update
↓
render
↓
effect
↓
analytics

A direct event flow may be clearer:
submit
↓
save
↓
analytics

Effects should not become an event orchestration engine.

34. Effect Anti-Pattern — Missing Cleanup
Bad:
useEffect(() => {
  window.addEventListener("resize", handleResize);
}, []);

The component establishes:
window resize listener
but provides no teardown.

The resource ownership becomes unclear.

Better:
useEffect(() => {
  window.addEventListener("resize", handleResize);
  return () => {
    window.removeEventListener("resize", handleResize);
  };
}, []);

Now:
setup = add listener
cleanup = remove same listener

35. Effect Anti-Pattern — Wrong Handler Identity
This is incorrect:
useEffect(() => {
  window.addEventListener("resize", () => {
    handleResize();
  });
  return () => {
    window.removeEventListener("resize", () => {
      handleResize();
    });
  };
}, []);

The two arrow functions are different objects.
Conceptually:
setup handler !== cleanup handler
Therefore cleanup cannot remove the originally registered listener.

Correct:
useEffect(() => {
  const handler = () => {
    handleResize();
  };
  window.addEventListener("resize", handler);
  return () => {
    window.removeEventListener("resize", handler);
  };
}, []);

This is a direct application of JavaScript object identity knowledge from Level 3.

36. Effect Ownership
Every external resource should have a clear owner.

Example:
ChatRoom
│
└── connection

The ChatRoom component should be responsible for:
create connection
↓
keep it synchronized
↓
disconnect

Avoid:
Component A creates resource
Component B cleans resource
Component C changes configuration
unless there is a deliberate architectural abstraction.

A senior component boundary should make resource ownership obvious.

37. One Effect, One Synchronization Responsibility
This does not mean:
“Every effect must contain exactly one statement.”

It means an effect should represent a coherent synchronization relationship.

Good:
useEffect(() => {
  const connection = connect(roomId);
  return () => {
    connection.disconnect();
  };
}, [roomId]);

Less coherent:
useEffect(() => {
  connect(roomId);
  document.title = title;
  localStorage.setItem("theme", theme);
  analytics.track("page");
}, [roomId, title, theme]);

These operations may have different causal relationships and different lifetimes.
Separate synchronization responsibilities when that makes ownership and dependency reasoning clearer.

38. Cleanup Must Match the Resource Lifetime
Suppose:
useEffect(() => {
  const socket = connect(roomId);
  return () => {
    socket.disconnect();
  };
}, [roomId]);

The resource lifetime is:
roomId = A
│
▼
socket A active
│
│ roomId changes
▼
disconnect socket A
│
▼
socket B active

This is cleaner than maintaining one global connection and manually mutating it from multiple unrelated locations.

The effect expresses:
component occurrence + roomId
↓
connection lifecycle

39. Asynchronous Operations
Effects are commonly used for asynchronous external synchronization.

Example:
useEffect(() => {
  let cancelled = false;

  async function loadUser() {
    const user = await fetchUser(userId);
    if (!cancelled) {
      setUser(user);
    }
  }

  loadUser();

  return () => {
    cancelled = true;
  };
}, [userId]);

At fundamentals level, understand the ownership problem:
request A starts
↓
userId changes
↓
request A may finish later

The component must not blindly assume:
latest render = request that finishes first

Async race handling becomes substantially more sophisticated in production applications and later state/data-fetching levels.
For Level 6, the key competency is recognizing that asynchronous work has a lifetime that must be considered when the component changes or unmounts.

40. Component Lifetime vs Request Lifetime
These are different.

Component lifetime:
mount ───────────────────────────── unmount

Request:
start ─────────────── finish

Possible ordering:
mount
↓
request starts
↓
component unmounts
↓
request finishes

Therefore:
request completion
cannot automatically be treated as:
component still active
This is one reason lifecycle-aware async logic matters.

41. Production Mental Model: External Systems
A useful taxonomy:

React-internal calculation:
const total = price * quantity;
Render.

User interaction:
onClick={handleSave}
Event handler.

External browser synchronization:
document.title = title;
Effect.

External subscription:
subscribe(...)
Effect + cleanup.

Timer:
setInterval(...)
Effect + cleanup.

Imperative third-party widget:
widget.mount(...)
Effect + cleanup.

The goal is not to memorize APIs.
The goal is to identify the causal and ownership boundary.

42. Prediction Challenge — Parent Update
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>
        {count}
      </button>
      <Child />
    </>
  );
}

function Child() {
  useEffect(() => {
    console.log("Child effect");
    return () => {
      console.log("Child cleanup");
    };
  }, []);

  return <div>Child</div>;
}

Question:
When Parent updates:
Does Child necessarily unmount?
Does Child necessarily remount?
Does Child's effect necessarily clean up and restart?

The correct conceptual answer is:
Parent update
↓
Child occurrence can remain the same identity
↓
Child does not necessarily unmount
↓
[] effect does not represent a dependency change

Do not equate:
parent rendered
with:
child mounted again

This is an important identity/lifecycle distinction.

43. Prediction Challenge — Conditional Identity
function App() {
  const [show, setShow] = useState(true);

  return (
    <>
      <button onClick={() => setShow(value => !value)}>
        Toggle
      </button>
      {show && <Child />}
    </>
  );
}

When:
show = true
the occurrence exists.

When:
show = false
it does not.

Therefore:
Child
↓
unmount
↓
effect cleanup

When it becomes true again:
new Child occurrence
↓
mount
↓
render
↓
commit
↓
effect setup

This is fundamentally different from:
same occurrence
↓
update

44. Prediction Challenge — Changing Effect Dependency
function UserPanel({ userId }: Props) {
  useEffect(() => {
    const subscription = subscribe(userId);
    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return <div>{userId}</div>;
}

Render #1:
userId = 10
Synchronization:
subscribe(10)

Render #2:
userId = 20
Synchronization transition:
unsubscribe(10)
↓
subscribe(20)

Unmount:
unsubscribe(20)

The important insight:
effect lifecycle
is tied to the synchronization's dependency inputs, not merely the component's mount/unmount boundaries.

45. Development Strictness and Effect Correctness
Development environments can intentionally expose effect setup/cleanup problems.

A developer may observe:
setup
cleanup
setup
and incorrectly conclude:
“React is broken.”

The correct senior response is:
“Is my effect synchronization safe if setup and cleanup happen more than once during development?”

A well-designed effect should have:
setup
↓
resource established
cleanup
↓
resource released
setup
↓
resource established again

without:
duplicate subscriptions,
leaked timers,
duplicated listeners,
corrupted external state.

Do not build production correctness around:
“I observed this only runs once in my current development environment.”

46. The Effect Contract
For every effect, be able to answer five questions:
1. What external system am I synchronizing with?
2. What inputs determine that synchronization?
3. When does synchronization begin?
4. What exactly does cleanup release?
5. What happens when those inputs change?

If you cannot answer these, the effect probably needs redesign.

47. Production Anti-Pattern Teardown
Anti-Pattern A — Effect for Derived State
Flawed:
const [fullName, setFullName] = useState("");

useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

Why developers do it:
They think:
“Whenever inputs change, I need to update the output.”

Mechanical failure:
inputs change
↓
render
↓
effect
↓
state update
↓
second render

Senior refactoring:
const fullName = `${firstName} ${lastName}`;

48. Anti-Pattern B — Effect as Event Bus
Flawed:
useEffect(() => {
  if (submitted) {
    notifySuccess();
  }
}, [submitted]);

Why developers do it:
They want to react to a state change.

Mechanical failure:
The true causal chain:
submit
becomes:
submit
↓
state
↓
render
↓
effect
↓
notification

Senior refactoring:
Keep event-caused behavior near the event when appropriate.

49. Anti-Pattern C — Subscription Without Cleanup
Flawed:
useEffect(() => {
  subscribe(userId);
}, [userId]);

Mechanical failure:
userId = A ↓ subscription A
userId = B ↓ subscription B
userId = C ↓ subscription C

Potentially:
A + B + C
remain active.

Senior refactoring:
useEffect(() => {
  const subscription = subscribe(userId);
  return () => {
    subscription.unsubscribe();
  };
}, [userId]);

50. Anti-Pattern D — “Just Add an Effect”
Bad engineering process:
Something changed
↓
useEffect
↓
setState
↓
another render

The presence of an effect does not automatically make a design more React-like.

The correct sequence is:
What is the requirement?
↓
What causes it?
↓
Is it derivation, interaction, or synchronization?
↓
Choose the appropriate mechanism.

51. Senior Decision Matrix
Situation | Render | Event Handler | Effect | State
--- | :---: | :---: | :---: | :---:
Calculate derived value | ✅ | ❌ | ❌ | Usually ❌
Respond to button click | ❌ | ✅ | Usually ❌ | Maybe
Subscribe to external system | ❌ | ❌ | ✅ | Maybe
Start/stop timer owned by component | ❌ | ❌ | ✅ | Maybe
Update document title from state | ❌ | ❌ | ✅ | ❌
Submit form after click | ❌ | ✅ | Usually ❌ | Maybe
Filter existing array | ✅ | ❌ | ❌ | Usually ❌
Connect to external resource | ❌ | ❌ | ✅ | ❌
Cleanup subscription | ❌ | ❌ | ✅ | ❌
Compute display label | ✅ | ❌ | ❌ | ❌
Respond to route/event transition | Depends | Often ✅ | Depends | Depends

52. Diagnostic Lab — React DevTools
Use React DevTools to inspect:
component tree
props
state
component hierarchy
whether the component remains mounted
whether a conditional branch removes it

Recommended investigation sequence:
1. Open React DevTools.
2. Locate the component.
3. Observe its position in the component tree.
4. Trigger the interaction.
5. Check whether the component remains present.
6. Inspect state/props.
7. Determine: update? unmount? remount?
8. Add explicit lifecycle telemetry if necessary.

Do not infer lifecycle behavior solely from:
console.log("render");
A render log tells you:
component function executed
It does not by itself prove:
mounted
unmounted
effect setup
effect cleanup

53. Diagnostic Instrumentation
A useful development-only trace:
function DebugComponent({ id }: Props) {
  console.log("render", id);

  useEffect(() => {
    console.log("effect setup", id);
    return () => {
      console.log("effect cleanup", id);
    };
  }, [id]);

  return <div>{id}</div>;
}

Now compare:
render
effect setup

with:
render
render
render

and:
render
effect cleanup
effect setup

These traces answer different questions.

54. Diagnostic Table
Observation | Likely Meaning
--- | ---
render only | Component rendered; effect may not yet be observed
render → effect setup | Initial synchronization established
render → render | Component rendered again
render → cleanup → setup | Effect synchronization changed/restarted
render → cleanup, component absent | Effect/component lifetime ended
Multiple setup/cleanup cycles in development | Investigate development behavior and effect idempotence
Increasing subscriptions | Cleanup/resource ownership bug
Timer continues after UI disappears | Missing cleanup or resource owned elsewhere

55. Production Incident Runbook — Duplicate Subscription
Symptom:
Users receive duplicate updates.

Initial hypothesis:
multiple subscriptions are active

Investigate:
Step 1:
Find the effect creating the subscription.
useEffect(() => { ... }, [...]);

Step 2:
Identify the resource.
subscription

Step 3:
Find cleanup.
return () => ...

Step 4:
Verify cleanup corresponds to the exact subscription instance.

Step 5:
Check dependency changes.

Step 6:
Determine whether the component is:
updating
or:
unmounting/remounting

Step 7:
Use instrumentation:
console.count("subscribe");
console.count("unsubscribe");

The goal is not:
“Make the effect run less.”
The goal is:
Ensure resource lifetime matches component synchronization lifetime.

56. Production Incident Runbook — Timer Survives Unmount
Symptom:
A hidden component continues updating state or performing work.

Investigation:
Find:
setInterval
setTimeout
requestAnimationFrame
inside effects.

Verify cleanup.
Correct:
useEffect(() => {
  const id = setInterval(work, 1000);
  return () => {
    clearInterval(id);
  };
}, []);

Then inspect whether the timer belongs to:
component occurrence
or:
application-global service

Do not automatically add cleanup to something that intentionally has application-global ownership.
Ownership must be explicit.

57. Production Incident Runbook — Effect Runs Too Often
Symptom:
An API request or external synchronization happens unexpectedly often.

Do not begin with:
“How do I stop the effect from running?”

Begin with:
1. What is this effect synchronizing?
2. What values does it read?
3. Which values determine synchronization?
4. Are dependencies changing?
5. Are object/function references recreated?
6. Is the effect actually necessary?
7. Is the work really event-driven?

Possible root causes:
unnecessary effect + derived state + unstable dependency identity + incorrect ownership + event logic placed in effect

The solution is often architectural rather than syntactic.

58. Production Incident Runbook — Effect Loop
Example:
const [value, setValue] = useState(0);

useEffect(() => {
  setValue(value + 1);
}, [value]);

Lifecycle:
render value=0
↓
effect
↓
setValue(1)
↓
render value=1
↓
effect
↓
setValue(2)
↓
render value=2
↓
...

The effect is synchronizing a value with itself.
This is usually a design error.

Ask:
Why does this state need to be derived through an effect at all?

59. Component Lifecycle vs Browser Lifecycle
Do not confuse:
React lifecycle
with:
browser lifecycle

A React component can:
mount
update
unmount
while the browser document remains alive.

Similarly, a DOM node may be:
created
updated
removed
as a consequence of React's commit.

The browser then performs its own work such as:
style calculation
layout
paint
compositing
Those mechanics were studied in Level 4.

For this level, the boundary is:
React: render → commit
Browser: process committed DOM

Do not duplicate the browser rendering pipeline here.

60. Lifecycle Does Not Mean “Every Render Is a Mount”
A frequent debugging mistake:
component rendered again
↓
component mounted again
False.

A component occurrence can remain the same identity across many renders.

Example:
Counter occurrence
Render #1
Render #2
Render #3
Render #4
Render #5
↓
same mounted occurrence

Mount happens when the occurrence enters the committed tree.
Unmount happens when it leaves or its identity is replaced.
Render can happen many times inside that lifetime.

61. Lifecycle and Keys
Part 07 established:
type + key + tree context
as important identity inputs.

Therefore keys influence lifecycle behavior.

Example:
items.map(item => (
  <Editor key={item.id} item={item} />
))

Stable keys allow React to preserve the correct component occurrence as items reorder.

If identity changes unexpectedly:
old occurrence
↓
unmount
↓
new occurrence
↓
mount

This means lifecycle bugs can actually be identity bugs.

Example symptom:
“Why does my form reset when the list changes?”
Possible underlying cause:
component identity changed
↓
old occurrence unmounted
↓
new occurrence mounted
↓
state/effects reset

62. Lifecycle as Resource Ownership
A useful senior architecture model:
Component occurrence
│
├── owns state
├── owns UI
├── may own external synchronization
└── owns cleanup for that synchronization

This gives a strong design principle:
The code that establishes an external resource should usually own the responsibility for releasing it.

Examples:
add listener ↕ remove listener
subscribe ↕ unsubscribe
setInterval ↕ clearInterval
connect ↕ disconnect

63. Basic Understanding
You should be able to explain:
what mount means
what update means
what unmount means
what useEffect does
what cleanup does
why effects run after commit
why render should be pure
why subscriptions need cleanup
what dependency arrays represent
why effects can re-synchronize when dependencies change

64. Strong Engineering Understanding
You should additionally understand:
component occurrence versus component type
render versus mount
render versus commit
effect synchronization versus event handling
cleanup as synchronization teardown
resource ownership
derived values versus synchronized values
why effects can cause unnecessary render chains
why object identity affects dependencies
why conditional rendering can cause unmount
why stable keys influence lifecycle continuity
how asynchronous work can outlive a render
why cleanup must match setup exactly

65. Senior-Level Judgment
A senior engineer should be able to look at:
useEffect(...)
and immediately ask:
What external system exists?
Who owns it?
What are its synchronization inputs?
What is the resource lifetime?
What exactly does cleanup release?
Could this logic instead be:
- render-time derivation?
- event-driven behavior?
- state ownership?
- a separate abstraction?

The senior skill is not:
“Knowing more effect syntax.”
It is:
Knowing when an effect represents a legitimate synchronization boundary and when it is compensating for a poor state/data-flow design.

66. 🔥 THE CRUCIBLE
Challenge 1 — Identify the Correct Mechanism
Given:
const total = price * quantity;

Should this be:
state?
effect?
event handler?
render calculation?

Explain why.

Challenge 2 — Subscription Lifetime
Given:
useEffect(() => {
  subscribe(roomId);
}, [roomId]);

Identify:
the resource
its owner
the missing lifecycle operation
what happens when roomId changes
what happens on unmount

Challenge 3 — Event vs Effect
Given:
const [saved, setSaved] = useState(false);

useEffect(() => {
  if (saved) {
    showToast("Saved");
  }
}, [saved]);

Determine whether the toast is:
state synchronization
or:
event consequence
Explain where the behavior should normally live and why.

Challenge 4 — Lifecycle Prediction
Given:
function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>
        {count}
      </button>
      <Child />
    </>
  );
}

Child has:
useEffect(() => {
  console.log("setup");
  return () => console.log("cleanup");
}, []);

Predict:
initial mount
click
second render
unmount

Which lifecycle operations occur?

Challenge 5 — Dependency Change
Given:
useEffect(() => {
  const connection = connect(roomId);
  return () => connection.disconnect();
}, [roomId]);

Predict the exact synchronization sequence:
roomId = A
roomId = B
roomId = C
unmount

Your answer should distinguish:
render
commit
cleanup
setup

Challenge 6 — Find the Architectural Smell
Given:
const [filtered, setFiltered] = useState([]);

useEffect(() => {
  setFiltered(
    products.filter(product => product.category === category)
  );
}, [products, category]);

Explain:
what the effect is attempting to synchronize
whether an external system exists
why the state may be unnecessary
what render-time model replaces it

67. FINAL PREDICTION WALKTHROUGH
Consider:
function SearchResults({ query }: Props) {
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const data = await search(query);
      if (!cancelled) {
        setResults(data);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <ul>
      {results.map(result => (
        <li key={result.id}>{result.title}</li>
      ))}
    </ul>
  );
}

Initial:
query = "react"

Render #1:
State snapshot:
results = []
UI:
empty list
React commits.
Effect:
run search("react")

Query changes:
query = "typescript"

Render #2:
New snapshot:
query = "typescript"
results = []
React commits.
The previous synchronization is no longer appropriate.
Cleanup:
cancelled = true
New effect:
run search("typescript")

Request ordering:
Suppose:
search("typescript")
finishes first.
It can update:
results = TypeScript results

Suppose the older:
search("react")
finishes afterward.
Its closure has:
cancelled = true
Therefore it does not update the component state.

The important principle is:
component render + effect synchronization + async resource lifetime
must all be reasoned about together.

68. Engineering Decision Framework
When considering an effect, walk through this sequence:
┌─────────────────────────────────────────┐
│ 1. What requirement am I implementing?  │
└────────────────────┬────────────────────┘
                     ↓
┌─────────────────────────────────────────┐
│ 2. Is the value derivable from inputs?  │
└────────────────────┬────────────────────┘
          YES ───────┴─────── NO
           ↓                  ↓
         Render            Continue
                              ↓
┌─────────────────────────────────────────┐
│ 3. Is it caused directly by an event?   │
└────────────────────┬────────────────────┘
          YES ───────┴─────── NO
           ↓                  ↓
     Event handler         Continue
                              ↓
┌─────────────────────────────────────────┐
│ 4. Is an external system involved?      │
└────────────────────┬────────────────────┘
          YES ───────┴─────── NO
           ↓                  ↓
         Effect            Reconsider design
                              │
                              ↓
                      Perhaps state/architecture

69. Senior Interview Gotchas
Gotcha 1:
“Every render is a mount.”
False.
A mounted occurrence can render repeatedly.

Gotcha 2:
“Cleanup only runs during unmount.”
Incomplete.
Cleanup ends the previous synchronization and can therefore occur before a new effect setup when dependencies change.

Gotcha 3:
“useEffect is for code that runs after render.”
Incomplete.
Its architectural purpose is synchronization with external systems.

Gotcha 4:
“Put derived calculations into effects.”
Usually incorrect.
Derivable values normally belong in render-time calculation.

Gotcha 5:
“If something changes state, react to that state change in an effect.”
Not automatically.
Ask what caused the state change.

Gotcha 6:
“An empty dependency array means React guarantees this code executes exactly once forever.”
Incorrect mental model.
The effect belongs to a component occurrence and its synchronization lifecycle.

Gotcha 7:
“Cleanup means React is destroying the whole application.”
No.
Cleanup can simply mean:
old synchronization is ending
because its dependencies changed.

Gotcha 8:
“If the child function ran, the child mounted.”
False.
Rendering and mounting are different concepts.

70. Production Checklist
Before shipping a component containing effects, verify:

Lifecycle:
[ ] I know when this component mounts.
[ ] I know when it can unmount.
[ ] I know what causes it to update.
[ ] I am not confusing render with mount.
[ ] I am not confusing render with commit.

Effect purpose:
[ ] Each effect has a clear synchronization responsibility.
[ ] I can name the external system involved.
[ ] I can explain why the effect is necessary.
[ ] I am not using an effect merely to derive data.
[ ] I am not using an effect as an event bus.

Dependencies:
[ ] Effect dependencies represent synchronization inputs.
[ ] I understand which values the effect reads.
[ ] I understand relevant object/reference identity.
[ ] I have not arbitrarily omitted dependencies to suppress behavior.
[ ] I have not added unrelated dependencies without understanding their effect.

Cleanup:
[ ] Every owned subscription has cleanup.
[ ] Every owned timer has cleanup.
[ ] Every event listener has cleanup.
[ ] Cleanup releases the exact resource established by setup.
[ ] Cleanup remains correct when dependencies change.
[ ] Cleanup remains correct on unmount.

Architecture:
[ ] External resource ownership is clear.
[ ] Event-driven behavior lives near the event when appropriate.
[ ] Derived values are calculated rather than synchronized into redundant state.
[ ] Component identity is stable where lifecycle continuity is required.
[ ] Keys are stable for mutable collections.

Debugging:
[ ] I can distinguish render logs from effect logs.
[ ] I can identify setup/cleanup cycles.
[ ] I can determine whether a component updated or remounted.
[ ] I can investigate duplicate subscriptions.
[ ] I can investigate timers surviving unmount.
[ ] I can diagnose unnecessary effect loops.

71. DEFERRED → LEVEL 7
This Part intentionally does not deeply teach:
concurrent rendering
scheduler lanes
transition scheduling
effect behavior under advanced concurrent rendering
advanced stale closure analysis
advanced effect optimization
React Compiler
advanced memoization strategy
render interruption mechanics
advanced passive-effect scheduling internals
hydration-specific effect behavior
performance-oriented effect profiling

These concepts build on the lifecycle model established here but belong to Level 7 — Advanced React & Rendering.
The required Level 6 mental model is:
render ↓ commit ↓ effect synchronization ↓ cleanup when synchronization ends

Level 7 can then ask:
How does React's advanced rendering and scheduling model complicate this apparently simple lifecycle?
That question should not be solved here.

72. CROSS-KPI CONNECTIONS
KPI 01 — React Mental Model
Established:
state ↓ render ↓ commit
This Part extends it to:
state/props ↓ render ↓ commit ↓ external synchronization

KPI 02 — JSX & React Elements
JSX describes UI:
<Profile userId={id} />
The element is not itself:
DOM
The lifecycle described here explains how React moves from the component/render representation toward committed UI.

KPI 03 — Components, Props & Composition
Props determine synchronization inputs.
Example:
<ChatRoom roomId={roomId} />
The component's effect may synchronize:
roomId ↓ external connection
Therefore good prop contracts contribute directly to predictable lifecycle behavior.

KPI 03 Part 07 — Identity & Keys
Identity determines whether React can preserve an existing component occurrence.
Lifecycle consequence:
same identity ↓ update
new identity ↓ unmount old ↓ mount new
Keys therefore influence state and effect lifetimes.

Future State KPI
Effects should not be used as a replacement for sound state ownership.
A useful separation:
State ↓ what the UI remembers
Effect ↓ what the UI synchronizes externally

Future Hooks KPI
This Part introduces useEffect as a fundamental hook.
The Hooks KPI can later expand the broader hook model without repeating the complete lifecycle foundation.

73. FINAL ENGINEERING PRINCIPLE
A React component should not be designed around:
“What code do I want React to run after rendering?”
It should be designed around:
What does this component render?
↓
What state/props determine that UI?
↓
What external system must remain synchronized?
↓
What inputs determine that synchronization?
↓
What resource does this component own?
↓
How is that resource released?

The resulting architecture is:
      REACT COMPONENT
             │
     ┌───────┴───────┐
     │               │
     ▼               ▼
  RENDER      EXTERNAL SYSTEM
     │               │
     ▼ UI            │
                     ▼ useEffect
               ┌─────┴─────┐
               │           │
             setup      cleanup
               │           │
               ▼           ▼
          synchronize   release

The most important distinction to retain is:
RENDER: "What should the UI be?"
EVENT: "What should happen because something happened?"
EFFECT: "What external system must remain synchronized?"
STATE: "What information must persist across renders?"

Once these responsibilities are separated, component lifecycle stops being a collection of mysterious “React phases” and becomes an understandable ownership model.

74. PART COMPLETION STANDARD
You have completed this Part only if you can independently explain, without relying on memorized definitions:
[ ] What mount means for a component occurrence.
[ ] What update means.
[ ] What unmount means.
[ ] Why render and mount are different.
[ ] Why render and commit are different.
[ ] Why render should remain pure.
[ ] What problem useEffect solves.
[ ] Why effects are fundamentally synchronization mechanisms.
[ ] How setup and cleanup form a resource-lifetime pair.
[ ] Why cleanup can occur when dependencies change.
[ ] How dependency arrays relate to synchronization inputs.
[ ] Why derived state should usually not be synchronized through effects.
[ ] Why event-caused behavior often belongs in event handlers.
[ ] How subscriptions should be owned and cleaned up.
[ ] How timers should be owned and cleaned up.
[ ] How object identity can affect effect dependencies.
[ ] How conditional rendering can cause unmount.
[ ] How keys can influence component lifecycle continuity.
[ ] How to distinguish update from remount using React DevTools.
[ ] How to diagnose duplicate subscriptions.
[ ] How to diagnose effects that run unexpectedly often.
[ ] How to diagnose effect loops.
[ ] How asynchronous work can outlive the render that created it.
[ ] Why lifecycle reasoning requires component identity reasoning.
[ ] Why effect correctness should not depend on “it only runs once” assumptions.
[ ] How component ownership determines resource cleanup.
[ ] How to distinguish React state from external synchronization.
[ ] How to distinguish render-time derivation from post-commit synchronization.
[ ] How to predict setup/cleanup across dependency changes.
[ ] How to predict cleanup on unmount.
[ ] How to explain the difference between component type and component occurrence.
[ ] How to reason about an effect from causality rather than syntax.
[ ] How to identify when an effect is compensating for poor state architecture.
[ ] How to construct a lifecycle trace for a multi-render component.
[ ] How to explain the lifecycle model without relying on class lifecycle-method terminology.

75. FINAL CRUCIBLE QUESTION
You are reviewing this component:
function Room({ roomId, userId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const connection = connect(roomId);

    connection.onMessage(message => {
      setMessages(current => [...current, message]);
    });

    document.title = `Room ${roomId}`;

    return () => {
      connection.disconnect();
    };
  }, [roomId]);

  function handleSend(message: string) {
    sendMessage(roomId, userId, message);
  }

  return (
    <>
      <h1>Room {roomId}</h1>
      <MessageList messages={messages} />
      <Composer onSend={handleSend} />
    </>
  );
}

A senior review should identify:
Component responsibility: room UI + room synchronization
State: messages
External system: room connection
Synchronization input: roomId
Cleanup: connection.disconnect()
Event-driven operation: handleSend()
Render-derived UI: Room heading
Functional state update: current => [...current, message]

Then ask:
Should document.title be part of this effect?
Would separating synchronization responsibilities improve ownership?
What happens when roomId changes?
What happens when userId changes?
Does userId require a new connection?
What happens if the component unmounts while a message arrives?
What happens if the component's identity changes because of an unstable key?
Which operations belong to render?
Which belong to events?
Which belong to effects?
Which resources does this component actually own?

That is the level of reasoning expected from a senior engineer.

END OF KPI 03 — PART 08

Core takeaway:
A React lifecycle is not primarily a sequence of callbacks. It is the lifetime of a component occurrence and the synchronization responsibilities that occur around its committed UI.

COMPONENT IDENTITY
↓
RENDER
↓
COMMIT
↓
SYNCHRONIZE
↓
RESOURCE ACTIVE
↓
dependency change / unmount
↓
CLEANUP

Understand that model deeply before attempting to optimize, abstract, or otherwise manipulate effect behavior.
