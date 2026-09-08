Level 06 — React Fundamentals
KPI 04 — State & State Updates
PART 03 — State Update Queues & Functional Updates
[⬅️ Previous Part](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/02-useState-api-initialization-and-state-update-semantics.md) | [📚 Level 06 Index](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/README.md) | [🧪 Companion Lab](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/examples/03-state-update-queues.html) | [Next Part ➡️](https://chatgpt.com/g/g-p-6a6c3da4a8e48191b5117e7f6f69b908-frontend-development/c/04-state-immutability-objects-and-arrays.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models
1. The Problem This Part Solves
Part 02 established:
state = current render snapshot
setState(...) = request a future state transition

But one critical question remains:
What happens when several state updates are requested before the next render?

React cannot simply treat every setter call as:
mutate state immediately

Instead, updates are represented as work that React processes to determine the next state.
The senior mental model is:
Current state
│
▼ Update 1
│
▼ Update 2
│
▼ Update 3
│
▼ process updates in order
│
▼ next state
│
▼ new render snapshot

2. The Two Fundamental Update Forms
Direct value update:
setCount(10);
Conceptually:
next state = 10

Functional update:
setCount(previous => previous + 1);
Conceptually:
next state = transform(previous state)

This difference becomes critical when multiple updates are pending.

3. The Core Queue Model
Do not imagine:
setCount(...) ↓ count changes immediately

Instead think:
Current state
│
▼
┌───────────────────────────┐
│   Pending state updates   │
│                           │
│  Update 1                 │
│  Update 2                 │
│  Update 3                 │
└───────────────────────────┘
│
▼ React processes them
│
▼ Next state
│
▼ Render

The exact Fiber implementation contains additional details, but this conceptual queue model is the correct foundation for application-level reasoning.

4. Executive Concept Table
Concept | Core Mechanism | Production Impact | Common Senior Trap
--- | --- | --- | ---
update request | Setter creates state-update work | State changes become renderable | Treating setter as assignment
pending updates | Updates await processing | Multiple updates can interact | Assuming each immediately changes state
direct value | Supplies a concrete next value | Can overwrite earlier pending values | Reusing stale render snapshot
functional updater | Transforms pending state | Correct for dependent updates | Using direct values when chaining
update order | Updates are processed in order | Determines final state | Treating updates as unordered
render snapshot | Fixed for current render | Closures retain old values | Expecting queue processing to mutate closure
batching | Multiple updates can be processed together | Reduces unnecessary rendering | Assuming batching means updates disappear
replacement | Direct value establishes next value | Later updates can build from it | Assuming all updates compose identically
updater composition | Functions transform prior result | Enables reliable sequences | Forgetting functional updates receive prior result
purity | Updaters should calculate state | Predictable updates | Performing side effects inside updater

5. Golden Rule
When the next state depends on the previous state, express that dependency with a functional updater.
And the deeper rule:
A state setter records update work; React processes the resulting updates to derive the next state before rendering the next snapshot.

Layer 2 — 🔬 Deep Mechanical Breakdown
6. Why an Update Queue Is Necessary
Consider:
function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
  }

  return <button>{count}</button>;
}

During the handler:
count = 0

Every expression evaluates against that same snapshot:
setCount(1)
setCount(1)
setCount(1)

React therefore has multiple update requests to process.
A useful abstraction is:
State: 0
Pending updates:
┌────────────┐
│ replace 1  │
├────────────┤
│ replace 1  │
├────────────┤
│ replace 1  │
└────────────┘

Processing those updates does not magically turn them into:
0 → 1 → 2 → 3
because they did not express those transformations.
They expressed:
next = 1
next = 1
next = 1

7. Functional Updates Express Transformations
Now:
function handleClick() {
  setCount(previous => previous + 1);
  setCount(previous => previous + 1);
  setCount(previous => previous + 1);
}

The pending work can be modeled as:
┌────────────────────────────┐
│ previous => previous + 1   │
├────────────────────────────┤
│ previous => previous + 1   │
├────────────────────────────┤
│ previous => previous + 1   │
└────────────────────────────┘

Starting from:
0
React conceptually evaluates:
0
↓ 0 + 1 = 1
↓ 1 + 1 = 2
↓ 2 + 1 = 3

Final state:
3

This is why functional updates are not merely a coding style.
They encode a state transformation.

8. Direct Value vs Functional Transformation
Compare:
setCount(10);
with:
setCount(previous => previous + 10);

The first says:
replace with 10

The second says:
take whatever the relevant previous state is and add 10

That distinction matters when multiple updates interact.

9. Queue Processing Model
A useful conceptual abstraction is:
INITIAL STATE
│
▼
┌─────────────┐
│  Update #1  │
└─────────────┘
│
▼ intermediate state
│
▼
┌─────────────┐
│  Update #2  │
└─────────────┘
│
▼ intermediate state
│
▼
┌─────────────┐
│  Update #3  │
└─────────────┘
│
▼ FINAL STATE
│
▼ RENDER

For functional updates:
S0
│
├── f1(S0) → S1
├── f2(S1) → S2
└── f3(S2) → S3

Therefore:
Sfinal = f3(f2(f1(S0)))

This is the mathematical model you should carry into senior-level debugging.

10. Function Composition Is the Key
Suppose:
setCount(c => c + 1);
setCount(c => c * 2);
setCount(c => c - 3);

Starting:
count = 5

Process:
5
↓ +1
6
↓ ×2
12
↓ -3
9

Final:
9

The order matters.
If the updates were reordered:
5
↓ ×2
10
↓ +1
11
↓ -3
8
different result.

Therefore:
Pending state updates are not merely a bag of intentions. Their semantics depend on processing order.

11. Render Snapshot vs Update Queue
This distinction prevents many bugs.
Imagine:
function Counter() {
  const [count, setCount] = useState(5);

  function handleClick() {
    setCount(c => c + 1);
    console.log(count);
  }

  return <button>{count}</button>;
}

The current handler sees:
count = 5

The updater is different:
c => c + 1

The updater does not capture the current count value as its source of truth.
Instead, it tells React:
“When processing this update, give me the relevant previous state.”

So:
Handler closure └── count = 5
Pending updater └── c => c + 1

These are different mechanisms.

12. Why This Distinction Matters
This is safer:
setCount(count + 1);
when there is a single straightforward update based on the current render.

But this:
setCount(c => c + 1);
is the stronger semantic choice when:
- multiple updates may occur
- updates are composed
- an update is triggered asynchronously
- the next value fundamentally depends on previous state
- you want the update to describe a state transformation

13. Update Queue ≠ Render Queue
Do not conflate:
state update queue
with:
React's broader scheduling/rendering machinery

This Part focuses on the state-update semantics.
React also has scheduling behavior determining when rendering work is performed.
Advanced scheduler lanes, priorities, time slicing, interruption and transitions belong to Level 07.

For this curriculum, maintain the boundary:
KPI 04 state update semantics
│
▼ derive next state
│
▼ render

Do not prematurely replace this model with concurrent scheduler internals.

14. Batching Does Not Mean “Updates Are Ignored”
Suppose:
setCount(c => c + 1);
setCount(c => c + 1);

React may process these together rather than performing a separate visible render after every call.

Conceptually:
event
│
├── update #1
├── update #2
│
▼ process updates
│
▼ next state = current + 2
│
▼ render

Batching is about coordinating updates and rendering work.
It does not mean:
only one setter matters

Nor does it mean:
each setter immediately mutates state

15. Direct Updates in a Batch
Consider:
setCount(count + 1);
setCount(count + 1);

If:
count = 0
the expressions produce:
setCount(1)
setCount(1)

The fact that React processes them in one rendering cycle does not change the fact that both direct expressions were calculated from:
count = 0

Therefore:
batching ≠ sequential JavaScript mutation

16. Functional Updates in a Batch
Now:
setCount(c => c + 1);
setCount(c => c + 1);

The updates express:
transform previous state
transform resulting state

Conceptually:
0 → 1 → 2

Therefore:
batching + functional updates
can produce multiple logical state transitions while still resulting in a single rendered outcome.

17. Direct Replacement and Functional Updates Can Interact
Consider:
setCount(10);
setCount(c => c + 1);

Conceptually:
initial
│
▼ replace with 10
│
▼ functional updater
│
▼ 10 + 1
│
▼ 11

Now reverse them:
setCount(c => c + 1);
setCount(10);

Conceptually:
initial
│
▼ increment
│
▼ replacement with 10
│
▼ 10

This illustrates why update order matters.
A later direct value can establish a new state value that becomes the input to later functional updates.

18. Another Prediction
Start:
count = 5

Updates:
setCount(c => c + 2);
setCount(20);
setCount(c => c * 2);

Conceptual processing:
5
↓ +2
↓ 7
↓ replace with 20
↓ 20
↓ ×2
↓ 40

Final:
40

This is the level of state algebra you should be able to reason about manually.

19. Functional Updaters Should Be Pure
Good:
setCount(c => c + 1);

Good:
setUser(user => ({
  ...user,
  active: true,
}));

Dangerous:
setCount(c => {
  sendAnalytics();
  return c + 1;
});

The updater's job is:
previous state ↓ pure calculation ↓ next state
not:
previous state ↓ network request ↓ logging system ↓ mutation ↓ next state

Side effects inside update functions make state transitions harder to reason about and can interact badly with development checks and rendering behavior.

20. State Update Algebra
For a senior engineer, it is useful to model updates formally.
Let:
S = current state

A direct update:
setState(V)
can be viewed conceptually as:
U(S) = V

A functional updater:
setState(f)
can be viewed as:
U(S) = f(S)

A sequence:
U1 U2 U3
produces:
S3 = U3(U2(U1(S0)))

This model explains:
- ordering
- replacement
- composition
- repeated updates
- functional updater behavior
without needing to memorize framework folklore.

21. Render #1 → Queue → Render #2
Consider:
function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(c => c + 1);
    setCount(c => c + 1);
  }

  return <button>{count}</button>;
}

Render #1:
State snapshot: count = 0
Handler closes over: count = 0

User clicks.

Update creation:
Queue
┌─────────────────────────┐
│       c => c + 1        │
│       c => c + 1        │
└─────────────────────────┘

Processing:
0 ↓ 1 ↓ 2

Render #2:
count = 2
The new render creates new bindings and handlers.

22. Render #2 Has a New Snapshot
After the update:
Render #2 count = 2

The old handler still conceptually belongs to:
Render #1 count = 0

The new handler belongs to:
Render #2 count = 2

This distinction becomes especially important with asynchronous callbacks.
That topic will be expanded in later state/effect material.

23. Queue Processing Does Not Mutate Existing Closures
Suppose:
function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(c => c + 1);
    setTimeout(() => {
      console.log(count);
    }, 1000);
  }

  return <button onClick={handleClick}>{count}</button>;
}

The timeout callback closes over the render in which it was created.
The state queue can later produce:
count = 1
but that does not retroactively rewrite the closure's:
count = 0

The deeper stale-closure problem is an important later state/effect topic.
For now:
Update queues create future state snapshots; they do not mutate previous render closures.

24. State Update Is Not DOM Mutation
The queue does not directly perform:
DOM.textContent = ...

Instead:
setter ↓ state update ↓ next state ↓ render ↓ new React element description ↓ reconciliation ↓ commit ↓ DOM

Level 4 already established the browser-side pipeline.
KPI 04 is concerned with the state side of that pipeline.

Layer 3 — 🧪 Diagnostic Labs & DevTools Profiling
25. Lab 01 — Observe Multiple Direct Updates
function Counter() {
  const [count, setCount] = useState(0);

  function direct() {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
  }

  return (
    <>
      <p>{count}</p>
      <button onClick={direct}>
        +3 direct
      </button>
    </>
  );
}

Predict before running:
0 → ?
Then inspect the result.
Do not merely memorize it.
Explain:
Which snapshot did every expression read?

26. Lab 02 — Functional Update Chain
function Counter() {
  const [count, setCount] = useState(0);

  function functional() {
    setCount(c => c + 1);
    setCount(c => c + 1);
    setCount(c => c + 1);
  }

  return (
    <>
      <p>{count}</p>
      <button onClick={functional}>
        +3 functional
      </button>
    </>
  );
}

Predict:
0 → 3
Then verify.

27. Lab 03 — Mixed Update Algebra
Use:
function Counter() {
  const [count, setCount] = useState(5);

  function update() {
    setCount(c => c + 2);
    setCount(20);
    setCount(c => c * 2);
  }

  return (
    <>
      <p>{count}</p>
      <button onClick={update}>
        Run
      </button>
    </>
  );
}

Before clicking, write:
Initial: 5
Update 1: ?
Update 2: ?
Update 3: ?
Final: ?

Expected conceptual result:
5
↓ +2
7
↓ replace 20
↓ ×2
40

28. Lab 04 — Console Snapshot vs Updater
function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(c => {
      console.log("updater received", c);
      return c + 1;
    });
    console.log("handler snapshot", count);
  }

  return (
    <button onClick={handleClick}>
      {count}
    </button>
  );
}

The key diagnostic question:
Why can the updater receive a state value while the handler still sees its old snapshot?

Answer:
They operate at different conceptual layers.
handler ↓ current render snapshot
updater ↓ pending state processing

29. Lab 05 — React DevTools Profiler
Procedure:
Open React DevTools.
Select Profiler.
Start recording.
Trigger a handler containing multiple state updates.
Stop recording.
Inspect the resulting commit.
Inspect which components rendered.
Compare direct and functional update versions.
Inspect the component's state in the Components panel.

Questions to answer:
- How many commits occurred?
- What state changed?
- Which component owns it?
- Which descendants rendered?
- Did the number of setter calls equal the number of commits?
- Does batching alter state semantics or only rendering coordination?

The important distinction:
setter calls ≠ commits

30. Lab 06 — Instrument Update Intent
For educational diagnostics:
function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    console.table({
      snapshot: count,
      action: "three functional updates",
    });
    setCount(c => c + 1);
    setCount(c => c + 1);
    setCount(c => c + 1);
  }

  console.table({
    phase: "render",
    count,
  });

  return (
    <button onClick={handleClick}>
      {count}
    </button>
  );
}

The goal is to distinguish:
render snapshot
update intent
queue processing
next render

Layer 4 — 🔥 The Crucible
31. Production Anti-Pattern — Assuming Sequential Assignment
Flawed:
setCount(count + 1);
setCount(count + 1);
setCount(count + 1);

Developer reasoning:
increment
increment
increment

Mechanical reality:
If:
count = 0
then:
all three expressions calculate 1

Senior refactoring:
setCount(c => c + 1);
setCount(c => c + 1);
setCount(c => c + 1);

32. Production Anti-Pattern — Using a Captured Value When You Need a Transformation
Fragile:
function incrementLater() {
  setTimeout(() => {
    setCount(count + 1);
  }, 1000);
}

The callback can hold a stale render snapshot.

Stronger update semantics:
setTimeout(() => {
  setCount(c => c + 1);
}, 1000);

The updater expresses:
increment whatever relevant previous state exists

This does not solve every asynchronous state problem, but it removes unnecessary dependence on the callback's captured state value.

33. Production Anti-Pattern — Side Effects in Updaters
Bad:
setCount(c => {
  analytics.track("increment");
  return c + 1;
});

Why it is dangerous:
An updater should describe state transformation.
Side effects create additional observable behavior whose execution count and timing should not be coupled to state calculation.

Better:
Separate concerns:
analytics.track("increment");
setCount(c => c + 1);

The exact placement may depend on the product requirement, but the state updater itself should remain a pure transformation.

34. Production Anti-Pattern — Thinking Batching Changes the Meaning of State
Incorrect:
“React batches updates, so only the last setter matters.”

Incorrect:
“Every setter causes an immediate render.”

Correct:
multiple update requests
↓
React processes them
↓
next state derived
↓
render/commit coordinated

Batching changes how work is coordinated.
It does not erase state-update semantics.

35. Incident Runbook — “+3 Only Increased by 1”
Symptom:
setCount(count + 1);
setCount(count + 1);
setCount(count + 1);

Developer expected:
+3
Observed:
+1

Diagnosis:
Record:
Render snapshot: count = X
Update expressions: X + 1, X + 1, X + 1
Therefore all direct values resolve to:
X + 1

Fix:
Use:
setCount(c => c + 1);
setCount(c => c + 1);
setCount(c => c + 1);

36. Incident Runbook — “The State Is Correct but the Log Is Wrong”
Example:
setCount(c => c + 1);
console.log(count);

Developer sees:
0
while the UI later displays:
1

This is not contradictory.
The log is reading:
current render snapshot
The next render reads:
new state snapshot

37. Incident Runbook — “An Async Increment Lost Updates”
Suppose:
setTimeout(() => {
  setCount(count + 1);
}, 1000);

Two callbacks can both capture:
count = 0
and both request:
setCount(1)

A functional updater:
setTimeout(() => {
  setCount(c => c + 1);
}, 1000);
expresses the intended operation as:
increment the relevant previous state

This is a key reason functional updates are valuable beyond the simple “three clicks” example.

38. Senior Decision Matrix
Requirement | Use
--- | ---
Set state to known value | setState(value)
Next state depends on previous state | setState(prev => ...)
Several dependent updates | functional updaters
State update needs current render value but does not depend on sequential updates | direct value can be sufficient
Async update depends on prior state | functional updater
Need multiple transformations in sequence | functional updater
Side effect inside updater | ❌
Assume setter mutates current binding | ❌
Assume one setter = one render | ❌
Assume batching discards updates | ❌
Need scheduler lane details | Level 07
Need immutable object/array update mechanics | Part 04

39. 🔥 Crucible Challenge 1
Initial:
count = 0

Handler:
setCount(count + 1);
setCount(count + 1);
setCount(c => c + 1);

Reason step by step.
The first two expressions become:
setCount(1)
setCount(1)

The functional update then transforms the state resulting from the previous processing.
Conceptual result:
0
↓ replace 1
1
↓ replace 1
1
↓ +1
2

Final:
2

40. 🔥 Crucible Challenge 2
Initial:
count = 0

Updates:
setCount(c => c + 1);
setCount(10);
setCount(c => c + 5);

Process:
0
↓ 1
↓ 10
↓ 15

Final:
15

41. 🔥 Crucible Challenge 3
Initial:
count = 5

Updates:
setCount(c => c * 2);
setCount(c => c + 10);
setCount(c => c / 5);

Prediction:
5
↓ ×2
10
↓ +10
20
↓ ÷5
4

Final:
4

42. 🔥 Crucible Challenge 4
function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(c => c + 1);
    console.log(count);
  }

  return <button onClick={handleClick}>{count}</button>;
}

Question:
Why can the updater logically process a new state while console.log(count) still prints the old value?

Answer:
Because:
count
belongs to the current render snapshot, while:
c => c + 1
is evaluated as part of state-update processing.

43. 🔥 Crucible Challenge 5
Which better communicates the requirement?
A:
setBalance(balance + transaction.amount);
B:
setBalance(previous => previous + transaction.amount);

If the requirement is:
Add this transaction to whatever the current balance is when the update is processed.
Prefer:
setBalance(previous => previous + transaction.amount);

The functional form expresses the dependency explicitly.

44. 🔥 Crucible Challenge 6
Suppose:
setCount(c => c + 1);
setCount(c => c + 1);
setCount(100);
setCount(c => c * 2);

Initial:
10

Process:
10
↓ +1
11
↓ +1
12
↓ replace 100
↓ ×2
200

Final:
200

If you cannot derive this manually, you do not yet fully understand state-update composition.

45. Senior Gotchas
Gotcha 1 — “State updates are asynchronous.”
This phrase is too imprecise.
It encourages incorrect reasoning.
Prefer:
A setter requests a state update; the current render snapshot does not mutate in place, and React later processes the update to produce a new render.

Gotcha 2 — “The setter changes the state.”
Also imprecise.
The setter communicates an update request.
The current state binding does not become a new mutable value.

Gotcha 3 — “Functional updates are only for counters.”
False.
They are appropriate whenever:
next state depends on previous state
Examples include:
setItems(items => [...items, newItem]);
setUser(user => ({ ...user, active: true, }));
setSelectedIds(ids =>
  ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
);
Object/array immutability mechanics are covered separately.

Gotcha 4 — “Batching means there is only one update.”
False.
There can be multiple logical state updates processed together.

Gotcha 5 — “Every setter creates a new render.”
Not necessarily.
Multiple updates can be coordinated into rendering work.
The important distinction is:
update request ≠ render ≠ commit

46. Master Mental Model
At senior level, your internal model should now be:
CURRENT RENDER
│
▼ state snapshot
│
▼ event handler
│
▼ setState(...)
│
▼ pending updates
│
┌─────────┴─────────┐
│                   │
value            updater
│                   │
│             prev → next
│                   │
└─────────┬─────────┘
          ▼ process in order
│
▼ next state
│
▼ NEW RENDER
│
▼ new state snapshot

The key transition is:
snapshot → update queue → next snapshot
not:
variable → mutation

47. Completion Checklist
You should be able to confidently:
[ ] Explain why state updates require update processing.
[ ] Explain the conceptual state update queue.
[ ] Distinguish direct value updates from functional updates.
[ ] Explain why repeated direct updates can use the same snapshot.
[ ] Explain why functional updates compose.
[ ] Predict multiple functional updates.
[ ] Predict mixed direct and functional updates.
[ ] Explain update ordering.
[ ] Model functional updates as transformations.
[ ] Model direct updates as replacement values.
[ ] Explain why a later replacement can overwrite earlier work.
[ ] Explain why a later functional updater can transform a replacement.
[ ] Explain why batching does not mean updates are ignored.
[ ] Distinguish setter calls from renders.
[ ] Distinguish renders from commits.
[ ] Explain why a setter does not mutate the current state binding.
[ ] Explain why a handler can see an old snapshot while an updater processes new state.
[ ] Explain why functional updaters are valuable for asynchronous updates.
[ ] Explain why functional updaters should be pure.
[ ] Identify side effects inside state updaters.
[ ] Diagnose repeated-update bugs.
[ ] Diagnose stale-value update bugs.
[ ] Diagnose incorrect assumptions about batching.
[ ] Use React DevTools to inspect resulting state.
[ ] Use Profiler to distinguish updates from commits.
[ ] Manually calculate a sequence of state transformations.
[ ] Explain state updates algebraically.
[ ] Distinguish update semantics from concurrent scheduling internals.
[ ] Explain why scheduler lanes are outside this Part.
[ ] Explain why functional updates encode intent more precisely when state depends on previous state.
[ ] Predict direct-vs-functional behavior without executing the code.
[ ] Explain queue processing without claiming the current render mutates.
[ ] Debug a production “increment lost” incident.
[ ] Debug a production “state is correct but log is stale” incident.
[ ] Explain the difference between a render snapshot and pending state updates.
[ ] Explain state transitions as Sfinal = Un(...U2(U1(S0))).

48. Final Engineering Principle
A React state update is best understood as an ordered transformation of state, not an assignment to a mutable variable.

The senior mental model is:
STATE S₀
│
▼
┌───────────┐
│ Update U₁ │
└───────────┘
│
▼ S₁
│
▼
┌───────────┐
│ Update U₂ │
└───────────┘
│
▼ S₂
│
▼
┌───────────┐
│ Update U₃ │
└───────────┘
│
▼ S₃
│
▼ Render

And:
Direct update: U(S) = V
Functional update: U(S) = f(S)

Therefore:
Sfinal = Uₙ(...U₃(U₂(U₁(S₀))))

Once you can reason in those terms, repeated updates, batching, stale values, and functional updaters stop being React “tricks” and become ordinary state-transition algebra.

Boundary of Part 03
This Part intentionally establishes state-update semantics, but does not yet deeply cover:
- immutable object state
- immutable array state
- nested object updates
- structural sharing
- mutation detection
- reducer semantics
- complex state normalization
- stale closures across effects and asynchronous systems in depth
- external stores
- concurrent lanes and priorities
- transitions/time slicing
- advanced scheduling internals
Those remain separate concerns.

Next: KPI 04 — Part 04 — State Immutability, Objects & Arrays.
