# Level 06 — React Fundamentals
## KPI 06 / KPI 09 — Effects & Synchronization
### PART 02 — Effect Lifecycle: Setup, Cleanup & Re-Synchronization

[⬅️ Previous Part](01-why-effects-exist.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](examples/02-effect-lifecycle.html) | [Next Part ➡️](03-dependencies-and-reactive-values.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

# 1. Part Objective

Part 01 established the foundational rule:
> **Effects exist to synchronize React with external systems.**

This Part answers the next critical question:
> **What exactly happens to that synchronization relationship over time?**

A production Effect is not simply:
```text
run callback
```

It is better modeled as:
```text
SETUP
  ↓
external system synchronized
  ↓
React inputs change
  ↓
CLEANUP previous synchronization
  ↓
SETUP new synchronization
```

And when the component leaves the tree:
```text
SETUP
  ↓
...
  ↓
UNMOUNT
  ↓
CLEANUP
```

The lifecycle therefore describes the lifetime of a **synchronization relationship**, not the lifetime of an arbitrary callback.

---

# 2. ⚡ 30-Second Executive Cheat Sheet

### Core Mental Model

```text
COMMITTED REACT STATE
         │
         ▼
    EFFECT SETUP
         │
         ▼
EXTERNAL SYSTEM ACTIVE
         │
    ┌────┴────────────────────────┐
    │                             │
reactive inputs changed     component removed
    │                             │
    ▼                             ▼
CLEANUP OLD                  CLEANUP
    │
    ▼
SETUP NEW
    │
    ▼
EXTERNAL SYSTEM ACTIVE
```

### Executive Concept Table

| Concept | Core Mechanism | Production Impact | Common Senior Trap |
| :--- | :--- | :--- | :--- |
| **Setup** | Establishes synchronization | Connects React to external resource | Treating it as generic initialization |
| **Cleanup** | Ends previous synchronization | Prevents stale subscriptions/resources | Forgetting cleanup |
| **Re-synchronization** | Cleanup old relationship, establish new one | Keeps external state aligned | Assuming old setup remains valid |
| **Dependency change** | Reactive input to synchronization changed | May require new setup | Choosing dependencies based on timing preference |
| **Unmount cleanup** | Ends synchronization when component leaves tree | Prevents orphaned external work | Assuming React automatically cleans external systems |
| **Strict Mode development cycle** | Development stress test for symmetry | Exposes missing cleanup | Mistaking development behavior for production lifecycle |
| **Effect instance** | One setup/cleanup relationship | Useful for reasoning about closures | Treating all callbacks as one persistent callback |

---

# 3. The Fundamental Effect Lifecycle

Consider:
```typescript
useEffect(() => {
  connect();

  return () => {
    disconnect();
  };
}, []);
```

Conceptually:
```text
Effect setup
    │
    ▼
connect()
    │
    ▼
external connection exists
    │
    │  component remains active
    ▼
cleanup
    │
    ▼
disconnect()
```

The returned function is not:
> *"something React calls randomly later"*

It is the **inverse operation** for the synchronization established by that Effect setup.

Think:
```text
setup   = establish relationship
cleanup = terminate relationship
```

---

# 4. Setup and Cleanup Form a Pair

A strong Effect usually has a recognizable symmetry.

For example:
```typescript
useEffect(() => {
  window.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("resize", handleResize);
  };
}, []);
```

The relationship is:
```text
SETUP addEventListener
    │
    ▼
browser sends events
    │
    ▼
React receives updates
    │
CLEANUP removeEventListener
    │
    ▼
relationship terminated
```

This is structurally healthy.

Contrast:
```typescript
useEffect(() => {
  window.addEventListener("resize", handleResize);

  return () => {
    console.log("cleanup");
  };
}, []);
```

The cleanup does not actually undo the synchronization. The resource remains attached. That is a lifecycle bug.

---

# 5. Effects Should Be Reversible Where Appropriate

A useful engineering test is:
> **Can I explain exactly what setup establishes and exactly what cleanup removes?**

### Setup vs Matching Cleanup Matrix

| Setup | Matching Cleanup |
| :--- | :--- |
| `addEventListener` | `removeEventListener` |
| `subscribe()` | `unsubscribe()` |
| `connect()` | `disconnect()` |
| `setInterval()` | `clearInterval()` |
| `setTimeout()` | `clearTimeout()` |
| create external widget | destroy / dispose widget |
| acquire external resource | release resource |

This does not mean every Effect must mechanically have a cleanup function. Some synchronization operations are naturally self-contained or do not acquire a persistent external resource.

But whenever setup establishes a **continuing relationship**, cleanup generally needs to terminate that relationship.

---

# 6. Prediction-First Walkthrough #1

Consider:
```typescript
function ChatRoom({ roomId }: { roomId: string }) {
  useEffect(() => {
    console.log("connect", roomId);
    const connection = connectToRoom(roomId);

    return () => {
      console.log("disconnect", roomId);
      connection.disconnect();
    };
  }, [roomId]);

  return <div>{roomId}</div>;
}
```

Initial props:
```text
roomId = "general"
```

Predict the lifecycle.

### Render #1
The component renders:
```text
roomId = general
```
React commits the component.

Then the Effect synchronization is established:
```text
setup #1
  │
  ├── closure sees "general"
  └── connectToRoom("general")
```

Conceptually:
```text
connect general
```
Now the external system is synchronized with:
```text
roomId = general
```

---

# 7. Render #2 — Room Changes

Now:
```text
roomId = "engineering"
```

React renders again. The new render's Effect description uses:
```text
roomId = engineering
```

The previous synchronization is no longer correct.

The lifecycle becomes:
```text
previous synchronization
    │
    ▼
cleanup #1
    └── disconnect general
    │
    ▼
setup #2
    └── connect engineering
```

So the conceptual sequence is:
```text
Render #1
  ↓
Commit
  ↓
connect general

Render #2
  ↓
Commit
  ↓
disconnect general
  ↓
connect engineering
```

The important idea:
> **Cleanup belongs to the previous synchronization instance.**
> It does not suddenly acquire the new `roomId`.

---

# 8. Closure Reality

The cleanup function closes over the values from the Effect setup that created it.

For:
```typescript
useEffect(() => {
  const connection = connectToRoom(roomId);

  return () => {
    connection.disconnect();
  };
}, [roomId]);
```

Think:
```text
Effect instance #1 ────────────────────────────
roomId = "general"
setup: connection = connection(general)
cleanup: connection.disconnect()
           │
           └── closes over connection(general)

Effect instance #2 ────────────────────────────
roomId = "engineering"
setup: connection = connection(engineering)
cleanup: connection.disconnect()
           │
           └── closes over connection(engineering)
```

This is one reason closures matter so much for Effect correctness.

---

# 9. Cleanup Is Not "Clean Up the Component"

The terminology can be misleading. Cleanup does not mean:
> *"Delete this component."*

It means:
> **Terminate the synchronization established by a particular Effect setup.**

A component can remain mounted while an Effect is cleaned up.

For example:
```text
roomId = general
  ↓
setup general
  ↓
roomId changes
  ↓
cleanup general
  ↓
setup engineering
```

The component never unmounted. Only the previous synchronization relationship ended.

---

# 10. Three Important Lifecycle Cases

### Case A — Initial Synchronization
```text
Component becomes committed
  ↓
Effect setup
  ↓
External system synchronized
```

### Case B — Dependencies Change
```text
Committed component
  ↓
reactive dependency changes
  ↓
cleanup previous Effect
  ↓
setup new Effect
```

### Case C — Component Leaves Tree
```text
Component committed
  ↓
Effect active
  ↓
component removed
  ↓
cleanup Effect
```

These three cases form the fundamental lifecycle model.

---

# 11. What Happens If There Is No Cleanup?

Consider:
```typescript
useEffect(() => {
  window.addEventListener("resize", handleResize);
}, []);
```

Suppose the component is mounted. The listener is established.

If the component later leaves the tree, the browser event subscription is not inherently owned by React's component tree. Therefore the external relationship can remain.

The component may disappear while:
```text
window
  ↓
resize listener
  ↓
old handler closure
```
still exists.

This can cause:
- Memory retention
- Unexpected callbacks
- Duplicated behavior after remount
- Stale closures
- Increasing event-handler counts

The precise consequence depends on the external system.

The important principle is:
> **React cannot magically reverse arbitrary imperative work that your Effect performed.**

---

# 12. Production Incident — Duplicate Subscriptions

Suppose a notification system reports:
> *"User receives every notification twice."*

The code:
```typescript
useEffect(() => {
  notificationBus.subscribe(handleNotification);
}, []);
```

No cleanup exists.

Now imagine:
```text
mount
  ↓
subscribe handler A

unmount
  ↓
component removed

remount
  ↓
subscribe handler B
```

The external system may now contain:
```text
notificationBus
  ├── handler A
  └── handler B
```

One notification can trigger both. The UI looks normal. The bug is outside the visible React tree.

This is precisely why synchronization lifecycle must be reasoned about independently from rendered JSX.

---

# 13. Senior Debugging Pattern

When an external subscription appears duplicated, ask:
1. **How many times did setup execute?**
2. **How many times did cleanup execute?**
3. **Did cleanup remove exactly what setup added?**
4. **Is the external system retaining old callbacks?**
5. **Did component identity change?**
6. **Did dependencies cause re-synchronization?**
7. **Is development Strict Mode exposing an asymmetry?**

Do not immediately blame React. First reconstruct:
```text
setup count
cleanup count
external resource count
```

---

# 14. Effect Symmetry

A robust synchronization Effect often satisfies:
```text
N setups + N corresponding cleanups = no abandoned synchronization
```

- **For a subscription:**
  - `setup`: `subscribe(handler)`
  - `cleanup`: `unsubscribe(handler)`
- **For a timer:**
  - `setup`: `const id = setInterval(...)`
  - `cleanup`: `clearInterval(id)`
- **For a connection:**
  - `setup`: `const connection = connect()`
  - `cleanup`: `connection.disconnect()`

The exact resource identity matters.

---

# 15. Anti-Pattern — Cleanup Does Not Match Setup

### Bad:
```typescript
useEffect(() => {
  const connection = connect();

  return () => {
    console.log("cleanup");
  };
}, []);
```

- Setup acquires: `connection`
- Cleanup only logs.

Therefore:
```text
setup:   ACQUIRE RESOURCE
cleanup: DO NOTHING TO RESOURCE
```
This is asymmetrical.

### Senior Refactoring:
```typescript
useEffect(() => {
  const connection = connect();

  return () => {
    connection.disconnect();
  };
}, []);
```

Now:
```text
ACQUIRE ↕ RELEASE
```

---

# 16. Anti-Pattern — Cleanup Creates New Work

Consider:
```typescript
useEffect(() => {
  const connection = connect();

  return () => {
    connect();
  };
}, []);
```

This is conceptually inverted. Cleanup should terminate the previous synchronization. Instead it establishes another one.

Think:
```text
setup   ↓ connection A
cleanup ↓ connection B
```

That violates synchronization symmetry.

---

# 17. Anti-Pattern — Cleanup Updates Unrelated UI State

Consider:
```typescript
useEffect(() => {
  subscribe();

  return () => {
    setStatus("disconnected");
  };
}, []);
```

This deserves scrutiny. Cleanup occurs because synchronization is ending. But whether UI state should change during cleanup depends on the broader state model.

Do not blindly assume `cleanup → setState` is always meaningful.

The senior question is:
> **What state represents the actual application invariant, and who owns it?**

Cleanup should primarily terminate the external relationship.

---

# 18. Development Strict Mode

One of the most important sources of confusion is development behavior.

In development configurations using React Strict Mode, React may intentionally exercise Effect setup/cleanup symmetry by performing an additional setup/cleanup cycle.

Conceptually, you may observe:
```text
setup → cleanup → setup
```
during development.

This can surprise developers who expect `"setup once"`.

The correct reaction is not:
> *"React is broken."*

Instead ask:
> **Is my setup/cleanup pair symmetric and safe to establish, tear down, and establish again?**

A well-designed synchronization Effect should tolerate this development stress test.

---

# 19. Strict Mode Is a Bug Detector

Suppose:
```typescript
useEffect(() => {
  analytics.initialize();
}, []);
```

If initialization is not safely repeatable, development may expose the problem.

The correct architectural question becomes:
> **Is this resource owned by this component?**

- If yes, component-scoped synchronization may be appropriate.
- If initialization is application-global:
  ```text
  Application
      └── global analytics singleton
  ```
  then component-level ownership may be wrong.

This is an architecture question, not merely an Effect syntax question.

---

# 20. Prediction Challenge — Strict Mode

Consider:
```typescript
useEffect(() => {
  console.log("setup");

  return () => {
    console.log("cleanup");
  };
}, []);
```

In a development environment where Strict Mode exercises the Effect lifecycle, one possible observed sequence is:
```text
setup
cleanup
setup
```

The important invariant is:
> **Every setup can be followed by cleanup, and cleanup leaves the external system safe for another setup.**

---

# 21. Effect Lifecycle and Component Identity

Effects are associated with a component's React identity.

Consider:
```tsx
<ChatRoom key="A" roomId="general" />
```
versus:
```tsx
<ChatRoom key="B" roomId="general" />
```

Changing identity can cause the old component instance to leave the tree and a new one to be established.

Conceptually:
```text
old identity
    ↓
cleanup
    ↓
new identity
    ↓
setup
```

This connects directly to earlier work on:
- **KPI 03 — Component Identity**
- **KPI 04 — State Preservation**

Do not treat Effect lifecycle independently from component identity.

---

# 22. Prediction Walkthrough #2 — Same Props, New Identity

Suppose:
```tsx
<ChatRoom key={roomKey} roomId="general" />
```

The parent changes:
```text
roomKey = "A" ──► roomKey = "B"
```

Even though `roomId = general` remains the same, React identity has changed.

The conceptual lifecycle is:
```text
old ChatRoom identity
    ↓
cleanup old Effect
    ↓
old instance removed
    ↓
new ChatRoom identity
    ↓
setup new Effect
```

Therefore:
> **Effect lifecycle depends on component identity as well as the Effect's reactive inputs.**

---

# 23. Effects and Resource Ownership

A senior engineer should always ask:
> **Who owns this external resource?**

Possible answers:
- Component
- Application
- Route
- Feature
- External singleton
- Browser
- Server

For example, a **WebSocket** might be:
- **Component-owned:**
  ```text
  ChatRoom component
        ↓
    WebSocket
  ```
- **Application-owned:**
  ```text
     Application
          ↓
      WebSocket
          ↓
  multiple components
  ```

Those architectures require different synchronization strategies. Do not create one connection per component simply because every component can technically call `useEffect`.

---

# 24. Resource Ownership Matrix

| Resource | Possible Owner | Cleanup Responsibility |
| :--- | :--- | :--- |
| **DOM event listener** | Component | Component Effect |
| **Local timer** | Component | Component Effect |
| **Feature subscription** | Feature / component | Owning layer |
| **Shared WebSocket** | Application / service | Shared owner |
| **Third-party widget instance** | Component | Owning component |
| **Global analytics SDK** | Application | Application bootstrap / owner |
| **Browser API observer** | Component | Component Effect |

The Effect is not automatically the owner. **The owner determines where synchronization belongs.**

---

# 25. Cleanup and Resource Leaks

A resource leak is not limited to memory. You can leak:
- Event listeners
- Timers
- Subscriptions
- Connections
- Observers
- DOM relationships
- External widget instances

You can also **leak behavior**.

For example:
```text
one click
  ↓
three handlers
  ↓
three API requests
```

The system is functionally leaking duplicated work.

Therefore:
> **Cleanup protects correctness, resource usage, and temporal behavior.**

---

# 26. Async Work and Cleanup

Consider:
```typescript
useEffect(() => {
  fetchData();
}, []);
```

This begins asynchronous work. The important question is not merely:
> *"Can cleanup cancel the fetch?"*

Instead:
- Who owns the request?
- What happens if the component disappears?
- Can the result still matter?
- Can the result become stale?

Later Parts will cover:
- Cancellation
- Stale responses
- Request identity
- Race conditions
- Async Effect architecture

For now, the fundamental rule is:
> **Effect cleanup is the boundary where the previous synchronization relationship is terminated; asynchronous work may require additional ownership and currentness semantics.**

---

# 27. Cleanup Is Not Rollback

This distinction is critical.

Suppose:
```text
Effect setup
    ↓
send analytics event
```

Cleanup does not magically mean:
```text
undo analytics event
```

Likewise:
```text
POST /orders
```
cannot generally be "cleaned up" by:
```text
DELETE /orders
```
unless the application explicitly defines that semantic relationship.

Cleanup means:
> **Terminate the synchronization/resource relationship.**
> It does not universally mean reverse every external action.

---

# 28. Cleanup Is Not Cancellation

Similarly:
```text
cleanup ≠ cancel every async operation
```

Cancellation is one possible mechanism.

For example:
```typescript
useEffect(() => {
  const controller = new AbortController();

  fetch("/api/data", {
    signal: controller.signal,
  });

  return () => {
    controller.abort();
  };
}, []);
```

Here cleanup performs cancellation. But cancellation is only appropriate if:
1. The operation supports cancellation, and
2. Cancelling it is semantically correct.

This distinction becomes important in later async synchronization work.

---

# 29. Diagnostic Lab — Count Setup/Cleanup

Use:
```typescript
useEffect(() => {
  console.count("effect setup");

  return () => {
    console.count("effect cleanup");
  };
}, []);
```

Then test:
- Initial mount
- Unmount
- Remount
- Dependency changes
- Strict Mode development behavior

Record:
```text
setup count:
cleanup count:
```
Then compare them with the external resource count.

The objective is not to memorize a fixed numeric sequence. The objective is to **understand the lifecycle relationship**.

---

# 30. Diagnostic Lab — Subscription Telemetry

Wrap the subscription:
```typescript
function subscribeWithTelemetry(handler: Handler) {
  console.log("SUBSCRIBE", handler);
  const unsubscribe = subscribe(handler);

  return () => {
    console.log("UNSUBSCRIBE", handler);
    unsubscribe();
  };
}
```

Then:
```typescript
useEffect(() => {
  return subscribeWithTelemetry(handleUpdate);
}, []);
```

Observe:
```text
SUBSCRIBE
UNSUBSCRIBE
```
and verify that the external system's active subscription count returns to the expected value.

---

# 31. Diagnostic Lab — Timer Leak

### Bad:
```typescript
useEffect(() => {
  setInterval(() => {
    console.log("tick");
  }, 1000);
}, []);
```

Mount and unmount the component repeatedly. Observe whether:
```text
tick
tick
tick
```
continues after the component disappears.

### Repaired:
```typescript
useEffect(() => {
  const id = setInterval(() => {
    console.log("tick");
  }, 1000);

  return () => {
    clearInterval(id);
  };
}, []);
```

Now the timer's lifecycle matches the component synchronization lifecycle.

---

# 32. Production Incident — Timer Multiplication

Observed:
- First visit: `1 tick/sec`
- Navigate away and back: `2 ticks/sec`
- Navigate away and back: `3 ticks/sec`

Likely mechanism:
```text
mount #1   ↓ setInterval #1
unmount    ↓ interval #1 survives
mount #2   ↓ setInterval #2
unmount    ↓ interval #1 + #2 survive
mount #3   ↓ setInterval #3
```

The UI may appear correct. The external system is accumulating resources.

The missing invariant is:
> **Every acquired timer must be released.**

---

# 33. Anti-Pattern — Cleanup Uses the Wrong Resource

### Bad:
```typescript
useEffect(() => {
  const id = setInterval(tick, 1000);

  return () => {
    clearInterval(otherId);
  };
}, []);
```

The cleanup exists syntactically. But it does not release the resource established by setup.

This is a crucial senior lesson:
> **Presence of cleanup code does not prove correctness. You must verify resource identity.**

---

# 34. Effect Lifecycle as a State Machine

A useful model:

```text
┌──────────────────────┐
│   Not synchronized   │
└──────────┬───────────┘
           │ setup
           ▼
┌──────────────────────┐
│     Synchronized     │
└──────────┬───────────┘
           │ dependency change
           ▼
┌──────────────────────┐
│   Cleanup previous   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│      Setup new       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│     Synchronized     │
└──────────┬───────────┘
           │ unmount
           ▼
┌──────────────────────┐
│   Not synchronized   │
└──────────────────────┘
```

This is the synchronization lifecycle.

---

# 35. Master Execution Timeline

For an Effect whose dependency changes:

```text
Trigger
  │
  ▼
Render
  │ new props/state snapshot
  ▼
Reconciliation
  │
  ▼
Commit
  │ committed UI
  ▼
Previous Effect cleanup
  │ terminate old synchronization
  ▼
New Effect setup
  │ establish new synchronization
  ▼
External system synchronized
```

The exact scheduling relationship of passive Effects with browser work is more nuanced than this simplified conceptual timeline; later React internals work will refine it.

For this Part, the essential invariant is:
```text
previous synchronization ↓ cleanup ↓ new synchronization
```

---

# 36. Senior Interview Gotchas

### Gotcha 1: "Cleanup only runs on unmount."
**False.** Cleanup can run when an Effect is being replaced because its synchronization dependencies changed.

### Gotcha 2: "If the component stays mounted, the Effect cannot be cleaned up."
**False.** A dependency change can replace the existing synchronization instance while the component stays mounted.

### Gotcha 3: "Cleanup means reverse every external operation."
**False.** Cleanup terminates the synchronization relationship; it is not universal transactional rollback.

### Gotcha 4: "Having a return function makes an Effect safe."
**False.** The cleanup must actually release the exact resource established by setup.

### Gotcha 5: "Strict Mode means Effects run twice in production."
**False.** Development Strict Mode intentionally exercises setup/cleanup symmetry in development only.

### Gotcha 6: "Cleanup is only about preventing memory leaks."
**False.** It also prevents stale behavior, duplicate subscriptions, duplicated timers, stale callbacks, and incorrect external synchronization.

---

# 37. Engineering Decision Matrix

| Question | If YES | If NO |
| :--- | :--- | :--- |
| **Does setup establish an external relationship?** | Define matching cleanup | Reconsider whether Effect is needed |
| **Does dependency change alter synchronization requirements?** | Re-synchronize | Existing relationship may remain |
| **Does the resource have an explicit release API?** | Call it in cleanup | Determine correct ownership semantics |
| **Can the component be remounted?** | Ensure setup is repeatable | Still maintain lifecycle correctness |
| **Is resource shared globally?** | Reconsider component ownership | Component ownership may be appropriate |
| **Is async work involved?** | Define ownership / currentness / cancellation semantics | Normal cleanup may suffice |
| **Does cleanup release exactly what setup acquired?** | Good symmetry | Fix resource identity |

---

# 38. Crucible Challenge #1

Given:
```typescript
useEffect(() => {
  const unsubscribe = store.subscribe(handleChange);

  return () => {
    unsubscribe();
  };
}, [store]);
```

Predict: `store = A` then `store = B`. What happens?

### Expected Conceptual Sequence:
```text
setup A
  ↓
subscription A active

[store changes from A to B]
  ↓
cleanup A
  ↓
unsubscribe A
  ↓
setup B
  ↓
subscription B active
```

---

# 39. Crucible Challenge #2

Given:
```typescript
useEffect(() => {
  const id = setInterval(() => {
    console.log("tick");
  }, 1000);

  return () => {
    clearInterval(id);
  };
}, []);
```

Answer:
1. **What resource is acquired?** Browser interval timer identifier.
2. **Where is its identity stored?** In the local variable `id` within the setup closure.
3. **What terminates it?** `clearInterval(id)`.
4. **Why does cleanup close over `id`?** Because `id` was declared during the setup execution that created this specific cleanup function.
5. **What happens on unmount?** Cleanup runs, invoking `clearInterval(id)` with the stored identifier.
6. **What happens if development behavior exercises setup → cleanup → setup?** Timer #1 starts $\rightarrow$ Timer #1 clears $\rightarrow$ Timer #2 starts. Exactly one timer remains active.

---

# 40. Crucible Challenge #3

Find the bug:
```typescript
useEffect(() => {
  const listener = () => {
    console.log(roomId);
  };
  window.addEventListener("resize", listener);

  return () => {
    window.removeEventListener("resize", () => console.log(roomId));
  };
}, [roomId]);
```

### Bug Analysis:
The cleanup creates a brand-new inline arrow function. It is **not** the same function reference object that was passed to `addEventListener`.

Conceptually:
```text
setup listener   ↓ function object A
cleanup listener ↓ function object B
A !== B
```

Therefore `window.removeEventListener` fails to unbind listener `A`, leaving it permanently registered on `window`.

### Senior Fix:
Preserve the exact resource identity established by setup:
```typescript
useEffect(() => {
  const listener = () => {
    console.log(roomId);
  };
  window.addEventListener("resize", listener);

  return () => {
    window.removeEventListener("resize", listener);
  };
}, [roomId]);
```

---

# 41. Crucible Challenge #4

Suppose a component:
1. Mounts
2. `roomId` changes 5 times
3. Unmounts

Assuming each change requires a new synchronization, reason about:
- Number of setup instances: **6** (1 initial mount + 5 updates)
- Number of cleanup instances: **6** (5 on dependency changes + 1 on unmount)

### Step-by-Step Sequence:
```text
1. Mount: Setup #1 (Room 0)
2. Change 1: Cleanup #1 -> Setup #2 (Room 1)
3. Change 2: Cleanup #2 -> Setup #3 (Room 2)
4. Change 3: Cleanup #3 -> Setup #4 (Room 3)
5. Change 4: Cleanup #4 -> Setup #5 (Room 4)
6. Change 5: Cleanup #5 -> Setup #6 (Room 5)
7. Unmount:  Cleanup #6
```
Total setups = 6, Total cleanups = 6. Active external resources at end = 0.

---

# 42. Crucible Challenge #5

A developer says:
> *"I added cleanup, so the memory leak is fixed."*

The Effect is:
```typescript
useEffect(() => {
  const socket = connect();

  return () => {
    console.log("disconnecting");
  };
}, []);
```

**Is the statement correct?**
**No.** The cleanup does not disconnect `socket`. It only logs text to the console.

The correct diagnostic questions:
1. What did setup acquire? (`socket` connection)
2. What exactly does cleanup release? (Nothing — `socket.disconnect()` is missing)

---

# 43. Production Review Checklist

When reviewing an Effect in a pull request, inspect:
- [ ] What external system is involved?
- [ ] What resource does setup establish?
- [ ] Who owns that resource?
- [ ] What exact values configure it?
- [ ] What exact operation ends it?
- [ ] Does cleanup release the exact same resource?
- [ ] What happens when dependencies change?
- [ ] Can setup execute more than once?
- [ ] Is repeated setup safe?
- [ ] Is cleanup safe and idempotent?
- [ ] Is the external system shared across multiple components?
- [ ] Can component identity change (`key` change)?
- [ ] Can stale closures or orphaned callbacks remain?
- [ ] Is asynchronous work involved?
- [ ] Does cancellation make semantic sense?

---

# 44. Cross-KPI Integration

### KPI 03 — Component Identity
Effect lifecycle follows component identity.
```text
identity changes ↓ old synchronization ends ↓ new synchronization begins
```

### KPI 04 — State
State changes can change Effect synchronization requirements.
```text
state ↓ render ↓ new synchronization inputs
```

### KPI 05 — Events
Events can cause state changes that eventually require re-synchronization.
```text
event ↓ state transition ↓ render ↓ Effect synchronization
```
The important distinction remains: `event ≠ Effect`. The event can indirectly cause an Effect dependency to change.

---

# 45. Boundary Enforcement

### Level 4 (Prerequisites)
- Browser event loop internals
- Browser rendering pipeline
- Detailed DOM lifecycle
- Timer implementation internals

### Level 5 (Prerequisites)
- JavaScript closure fundamentals
- TypeScript syntax & generics

### Level 7 (Advanced Concurrency)
- Concurrent rendering
- Scheduler lanes & priority
- Transition internals
- React Compiler optimizations

### Level 8 (Architecture)
- React Server Components (RSC)
- Server Actions
- Framework streaming boundaries

---

# 46. 30-Second Senior Summary

```text
Effect = synchronization relationship
```

### The Lifecycle:
```text
SETUP
  ↓
synchronized
  ↓
dependency change
  ↓
CLEANUP
  ↓
SETUP
  ↓
synchronized
  ↓
unmount
  ↓
CLEANUP
```

### The Core Invariants:
1. Every setup must leave the external system in a state that cleanup can correctly terminate.
2. `cleanup ≠ rollback`
3. `cleanup ≠ automatically cancel everything`
4. `cleanup = terminate the synchronization established by the previous setup`

---

# 47. Completion Checklist

You should not mark this Part complete until you can:
- [ ] Define Effect setup.
- [ ] Define Effect cleanup.
- [ ] Explain why setup and cleanup form a synchronization pair.
- [ ] Explain why cleanup can happen while a component remains mounted.
- [ ] Explain cleanup caused by dependency changes.
- [ ] Explain cleanup caused by component removal.
- [ ] Explain Effect synchronization as a lifecycle relationship.
- [ ] Predict setup $\rightarrow$ cleanup $\rightarrow$ setup sequences.
- [ ] Explain closure capture in Effect setup and cleanup.
- [ ] Explain why cleanup operates on the previous synchronization instance.
- [ ] Identify missing cleanup.
- [ ] Identify incorrect cleanup.
- [ ] Identify cleanup that releases the wrong resource.
- [ ] Identify duplicated subscriptions.
- [ ] Identify timer leaks.
- [ ] Explain resource ownership.
- [ ] Distinguish component-owned and application-owned resources.
- [ ] Explain why React cannot automatically reverse arbitrary imperative work.
- [ ] Explain why cleanup is not universal rollback.
- [ ] Explain why cleanup is not synonymous with cancellation.
- [ ] Explain the role of development Strict Mode in exercising Effect symmetry.
- [ ] Explain why repeated setup must be safe.
- [ ] Use DevTools/console instrumentation to count setup and cleanup.
- [ ] Diagnose a duplicate-subscription incident.
- [ ] Diagnose a timer multiplication incident.
- [ ] Verify exact resource identity between setup and cleanup.
- [ ] Explain how component identity affects Effect lifecycle.
- [ ] Explain how state changes can indirectly cause re-synchronization.
- [ ] Distinguish event causality from Effect synchronization.
- [ ] Construct a setup/cleanup sequence without relying on memorized lifecycle slogans.
- [ ] Explain why cleanup code being present does not prove lifecycle correctness.
- [ ] Explain resource ownership before choosing component-level synchronization.
- [ ] Explain why cleanup correctness is about behavior as well as memory.
- [ ] Explain the fundamental Effect lifecycle without saying merely "runs after render."

---

# 48. Final Mastery Test

### 1. A component synchronizes with `roomId = "A"`, then receives `roomId = "B"`. What happens to the synchronization relationship?
**Answer:** The existing synchronization instance for room "A" is terminated via its cleanup function (e.g. `disconnect("A")`), and a brand-new synchronization instance is established for room "B" via setup (e.g. `connect("B")`).

### 2. Why can cleanup run while the component remains mounted?
**Answer:** Because cleanup terminates a specific *synchronization instance*, not the component instance. When an Effect's reactive dependencies change, the old synchronization becomes obsolete and must be torn down before the new synchronization is established, all while the component stays active in the tree.

### 3. Why is this wrong?
```typescript
useEffect(() => {
  const listener = () => {};
  window.addEventListener("resize", listener);
  return () => {
    window.removeEventListener("resize", () => {});
  };
}, []);
```
**Answer:** The cleanup creates a new anonymous function object reference (`() => {}`). It does not pass the reference `listener` that was registered. `removeEventListener` requires the exact same function reference; thus the listener is never removed and leaks.

### 4. What is the difference between cleanup and rollback?
**Answer:** Cleanup terminates an active ongoing synchronization or releases a held resource (e.g., closing a socket, removing an event listener). Rollback implies undoing the side effects of past external transactions (e.g., trying to undo an analytics hit or delete a created database record), which React Effects do not automatically perform.

### 5. Why should a senior engineer ask "Who owns this resource?" before writing an Effect?
**Answer:** Because resource ownership dictates lifecycle boundary. If a resource is component-scoped (like a local input listener), an Effect in that component is appropriate. If the resource is application-wide (like a singleton analytics client or shared WebSocket), creating and tearing it down inside an individual component leads to race conditions, redundant connections, and architecture anti-patterns.

### 6. What invariant should hold between setup and cleanup?
**Answer:** `N setups + N corresponding cleanups = 0 abandoned resources`. Cleanup must release the exact resource identity acquired during setup, restoring the external system to a clean state ready for any future setup.

### 7. Why can development Strict Mode reveal Effect bugs that developers mistakenly attribute to "React running Effects twice"?
**Answer:** Strict Mode mounts, unmounts, and remounts components in development to verify that setup and cleanup are truly symmetric. If an Effect lacks cleanup or holds onto global state unsafely, running setup $\rightarrow$ cleanup $\rightarrow$ setup will produce duplicate listeners, multiplied timers, or broken state. The bug was always present in the code; Strict Mode simply forces it to surface immediately.

### 8. If an Effect starts a network request, does cleanup automatically mean that the server-side operation has been undone?
**Answer:** No. Cleanup only terminates the client-side synchronization relationship (e.g., ignoring the promise or aborting the HTTP connection). If the request already reached the server and mutated data (such as a POST request), aborting the client connection does not roll back the server mutation.

---

### Final Mental Model

```text
The wrong model:
useEffect  ──►  run this code

The correct model:
REACT
  │
  ▼
committed state
  │
  ▼
EFFECT SYNCHRONIZATION
  │
  ▼
external relationship
  │
  ┌──────────┴────────────────────────┐
  │                                   │
dependency change                  unmount
  │                                   │
  ▼                                   ▼
cleanup old                       cleanup
  │
  ▼
setup new
  │
  ▼
new synchronization
```

And the senior-level invariant:
```text
SETUP
  │
  ▼
establish resource
  │
  ▼
external system synchronized
  │
  ▼
synchronization invalidated
  │
  ▼
CLEANUP
  │
  ▼
release EXACT resource
  │
  ▼
safe to resync
```

---

[⬅️ Previous Part](01-why-effects-exist.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](examples/02-effect-lifecycle.html) | [Next Part ➡️](03-dependencies-and-reactive-values.md)
