# Level 06 — React Fundamentals
## KPI 06 / KPI 09 — Effects & Synchronization
### PART 14 — Advanced Effect Architecture

[⬅️ Previous Part](13-effect-performance-and-synchronization-optimization.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](examples/14-advanced-effect-architecture.html) | [Next Part ➡️](15-effects-and-synchronization-crucible.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Frontend Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

# Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

## 1. The Senior-Level Problem

Basic Effect usage looks deceptively simple:
```javascript
useEffect(() => {
  synchronize();
}, [dependencies]);
```

Production architecture is not simple. A mature React application operates across multiple interconnected layers:
```text
React State ──► Derived Values ──► Events ──► Effects ──► Browser APIs ──► Network ──► External Stores ──► Imperative SDKs
```

The senior architectural challenge is:
> **Where exactly should synchronization boundaries exist, who owns each external resource, and how should those boundaries interact without creating infinite loops, race conditions, stale state, or hidden coupling?**

---

## 2. The Architecture Model

```text
                     REACT APPLICATION
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
          Render           Events       External Data
    (UI Calculation)     (Commands)    (Store Snapshot)
            │                │                │
            └────────────────┼────────────────┘
                             │
                             ▼
                  EFFECT SYNCHRONIZATION
                         BOUNDARY
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
         DOM APIs       WebSockets      Imperative SDKs
            │                │                │
            └────────────────┼────────────────┘
                             │
                             ▼
                    CLEANUP & TEARDOWN
```

Every external relationship requires:
$$\text{Owner} + \text{Identity} + \text{Inputs} + \text{Lifetime} + \text{Cleanup} + \text{Failure Semantics}$$

---

## 3. Executive Concept Table

| Concept | Core Mechanism | Production Impact | Common Senior Trap |
| :--- | :--- | :--- | :--- |
| **Synchronization boundary** | Defines exactly one external relationship | Controls lifecycle, invalidation, and scope | Organizing Effects by code size or line count |
| **Resource ownership** | Defines who creates and destroys a resource | Prevents leaks and premature teardown | Assuming the component must always own the resource |
| **Resource identity** | Identifies the exact underlying external object | Prevents stale cleanup and orphaned handles | Recreating resources unnecessarily on every render |
| **Effect orchestration** | Coordinates multiple synchronization processes | Controls cross-system timing and behavior | Building brittle, cascading Effect chains |
| **Feedback loop** | External update triggers React update $\rightarrow$ external update | Causes infinite render loops and CPU lockups | Assuming cleanup callbacks alone prevent loops |
| **Bidirectional sync** | React and external system both influence each other | Requires explicit canonical authority rules | Allowing two systems to simultaneously claim truth |
| **Adapter** | Converts React contract to external imperative API | Isolates third-party vendor volatility | Spreading imperative library calls across component trees |
| **Invalidation** | Determines when prior synchronization is obsolete | Prevents stale external state and memory leaks | Treating every update as an independent event |
| **Lifecycle ownership** | Defines setup and cleanup lifetime boundaries | Prevents resource leaks in long-lived apps | Tying global singleton resources to incidental component mounts |
| **Error boundary** | Defines failure handling and retry ownership | Makes synchronization failures diagnosable | Silently swallowing exceptions inside Effects |
| **Idempotence** | Repeated setup produces the same safe result | Essential for Strict Mode and retry policies | Assuming cleanup makes every operation safe |
| **Architecture** | Cohesive system of boundaries and ownership | Dictates maintainability and scalability | Treating Effects as generic "lifecycle" hooks |

---

## 4. Golden Rule

> **An Effect should own a synchronization relationship, not merely contain code that happens to run after rendering.**

For every Effect you write or review, you must be able to state:
> *"This Effect synchronizes **[React State]** with **[External Resource]** while **[Condition]** is true, and cleanup releases **[Specific Resource Handle]**."*

If that sentence cannot be stated clearly, the boundary is architecturally flawed.

---

# Layer 2 — 🔬 Deep Mechanical Breakdown

## 5. The Synchronization Boundary

Consider:
```jsx
useEffect(() => {
  const connection = createConnection(roomId);
  connection.connect();

  return () => {
    connection.disconnect();
  };
}, [roomId]);
```

The boundary is:
$$\text{roomId} \implies \text{Chat WebSocket Connection}$$

It is **not** *"Component mounted $\rightarrow$ run some code"*. The Effect exists because a specific React input (`roomId`) must remain synchronized with an external system.

---

## 6. Resource Ownership

For every external resource, explicitly identify:
- **Who creates it?**
- **Who configures it?**
- **Who updates it?**
- **Who destroys it?**
- **Who is allowed to consume it?**

```text
COMPONENT-OWNED RESOURCE:
Component ──► Owns WebSocket ──► Mount ──► Create ──► Use ──► Unmount ──► Destroy

APPLICATION-OWNED RESOURCE:
Application Root ──► Owns Global Analytics Client
                          ├── Component A (Uses / Subscribes)
                          ├── Component B (Uses / Subscribes)
                          └── Component C (Uses / Subscribes)
```

> [!IMPORTANT]
> **A component must never destroy a resource it does not own.**

---

## 7. Ownership Is Different From Access

A component can consume a resource without owning its lifecycle:
- An application-wide store is owned by the application root.
- Consuming components own their **individual subscriptions**, but **not** the store itself.
- When Component A unmounts, it unregisters its listener; it does not shut down the store.

---

## 8. Resource Identity

```jsx
useEffect(() => {
  const connection = connect(roomId);

  return () => {
    connection.disconnect();
  };
}, [roomId]);
```

The cleanup callback holds a closure over `connection` (the exact instance created during this setup pass):
```text
Effect Instance #1 ──► Connection A ──► Cleanup closes Connection A
Effect Instance #2 ──► Connection B ──► Cleanup closes Connection B
```
The instances remain deterministically paired.

---

## 9. Why External Resource Identity Matters

```jsx
// ❌ AMBIGUOUS TEARDOWN: What if multiple connections exist for room A?
useEffect(() => {
  connect(roomId);
  return () => {
    disconnect(roomId); // Ambiguous lookup by room key!
  };
}, [roomId]);
```

```jsx
// ✅ PRECISE RESOURCE TEARDOWN: Targets exact instance reference
useEffect(() => {
  const socket = connect(roomId);
  return () => {
    socket.close(); // Target exact allocated resource!
  };
}, [roomId]);
```

---

## 10. Synchronization vs Command

$$\begin{aligned}
\text{\textbf{Command (Event Handler):}} &\quad \text{User Action} \xrightarrow{\text{onClick}} \text{Execute imperative mutation} \\
\text{\textbf{Synchronization (Effect):}} &\quad \text{React State} \xrightarrow{\text{useEffect}} \text{Keep external system in parity}
\end{aligned}$$

### The Litmus Test:
*Is this action triggered directly by a discrete user event, or must it remain continuously synchronized with React state regardless of what triggered the change?*

---

## 11. Example: Video Player Architecture

```jsx
function VideoPlayer({ isPlaying }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      videoRef.current?.play();
    } else {
      videoRef.current?.pause();
    }
  }, [isPlaying]);

  return <video ref={videoRef} src="/stream.mp4" />;
}
```
- **User clicks Play button:** Handler sets `setIsPlaying(true)`.
- **Effect Synchronization:** Synchronizes React `isPlaying` state with DOM `HTMLVideoElement.play()`.

---

## 12. Two-Way Synchronization & Feedback Loops

When both React and the external widget can initiate state updates, an infinite feedback loop is risked:
```text
React State ──► widget.setValue() ──► widget.emit('change') ──► React setState() ──► React State ──► ...
```

---

## 13. The Feedback Loop Mitigation Model

```text
┌────────────────────────┐
│   React State (v=10)   │
└───────────┬────────────┘
            │
            ▼ (Push to widget)
┌────────────────────────┐
│  Widget Instance (10)  │
└───────────┬────────────┘
            │
            ▼ (User types "11" in widget)
┌────────────────────────┐
│  Widget onChange("11") │
└───────────┬────────────┘
            │
            ▼ (Value Guard: 11 !== 10)
┌────────────────────────┐
│   React setState(11)   │
└────────────────────────┘
```

A resilient architecture requires:
1. **Source of Truth definition.**
2. **Directionality invariants.**
3. **Value equality / Convergence guards.**

---

## 14. Determining the Source of Truth

| Scenario | Authoritative Owner | Non-Authoritative Projection |
| :--- | :--- | :--- |
| **Controlled Form / Editor** | React State | Third-Party Widget (`setValue`) |
| **Uncontrolled High-FPS Canvas** | Canvas Engine | React (Reads on demand via refs) |
| **URL Route / Location** | Browser History API | React Router State |

---

## 15. Bidirectional Synchronization Architecture

```text
                     AUTHORITATIVE STATE
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
        React UI                           External UI
            │                                   │
            └─────────── Convergence ───────────┘
```
Updates must converge to a stable fixed point rather than endlessly ping-ponging between abstractions.

---

## 16. Prediction Walkthrough — Type Conversion Oscillation

```text
React state: 0 (Number)
Widget state: "0" (String)

Render #1: Effect pushes 0 to widget.
Widget converts: 0 → "0", emits onChange("0").
Handler receives "0", calls setState("0").
Render #2: React state is now "0" (String).
Effect pushes "0" to widget...
```
If serialization/deserialization is asymmetric, the component oscillates endlessly.

---

## 17. Normalize at the Adapter Boundary

```text
React (number) ──► Serialize ──► Widget (string)
Widget (string) ──► Parse ──► React (number)
```
The **Adapter layer** must enforce deterministic normalization before values touch React state.

---

## 18. The Adapter Pattern

```text
┌────────────────────────────────────────────────────────┐
│                   React Component                      │
└───────────────────────────┬────────────────────────────┘
                            │ (Declarative Props)
                            ▼
┌────────────────────────────────────────────────────────┐
│                 Integration Adapter                    │
│  • Resource identity    • Normalization & parsing      │
│  • Cleanup & teardown   • Event subscription bridging  │
└───────────────────────────┬────────────────────────────┘
                            │ (Imperative Calls)
                            ▼
┌────────────────────────────────────────────────────────┐
│              Third-Party Library / SDK                 │
└────────────────────────────────────────────────────────┘
```

---

## 19. Example Adapter Boundary Implementation

```javascript
function createWidgetAdapter(containerElement) {
  const widget = new ThirdPartyWidget(containerElement);

  return {
    setValue(value) {
      if (widget.getValue() !== value) {
        widget.setValue(value);
      }
    },
    subscribe(onValueChange) {
      widget.on("change", onValueChange);
      return () => widget.off("change", onValueChange);
    },
    destroy() {
      widget.destroy();
    }
  };
}
```

---

## 20. The 6-Stage Synchronization Lifecycle

```text
1. ESTABLISH    ──► Allocate external resource instance
2. SYNCHRONIZE  ──► Apply initial React state
3. OBSERVE      ──► Attach listeners for external events
4. RECONFIGURE  ──► Update parameters on prop changes
5. INVALIDATE   ──► Mark in-flight operations as stale
6. CLEANUP      ──► Detach listeners & free system memory
```

---

## 21. Invalidation vs Cleanup

- **Cleanup:** Freeing allocated system resources (sockets, timers, DOM listeners).
- **Invalidation:** Declaring that an in-flight asynchronous operation is no longer valid for the current UI generation.

---

## 22. Async Currentness Protection

```jsx
useEffect(() => {
  let active = true;

  fetchUserData(userId).then(data => {
    if (active) {
      setUserData(data);
    }
  });

  return () => {
    active = false; // Invalidation guard
  };
}, [userId]);
```

---

## 23. Cancellation vs Currentness

$$\begin{aligned}
\text{\textbf{Cancellation (AbortController):}} &\quad \text{"Stop the HTTP/WebSocket transmission immediately."} \\
\text{\textbf{Currentness (active flag / id):}} &\quad \text{"Do not allow this result to mutate the committed UI."}
\end{aligned}$$

Production systems combine both.

---

## 24. The Effect as a Resource Owner

```text
EFFECT INSTANCE
  ├── Owns WebSocket connection handle
  ├── Owns interval timer ID
  ├── Owns ResizeObserver instance
  └── Owns third-party widget memory pointer
```
Cleanup releases everything allocated within that specific instance.

---

## 25. Component Lifetime vs Resource Lifetime

```text
Component Mounted ──► Subscribes to existing Session Manager
Component Unmounted ──► Unsubscribes (Session Manager stays alive)
```
Do not tie persistent application infrastructure to transient UI component mounts.

---

## 26. Global Resource Anti-Pattern

```jsx
// ❌ SEVERE BUG: Provider unmount kills analytics for sibling components
function AnalyticsTracker() {
  useEffect(() => {
    analyticsClient.init();
    return () => analyticsClient.shutdown(); // KILLS global instance!
  }, []);
}
```

---

## 27. Shared Resource Architecture

```text
               APPLICATION CORE
                      │
            ┌─────────┴─────────┐
            ▼                   ▼
     Auth Singleton     WebSocket Pool
            │                   │
     ┌──────┴──────┐     ┌──────┴──────┐
     ▼             ▼     ▼             ▼
  Header        Sidebar ChatBox      LiveFeed
  (Sub)          (Sub)   (Sub)        (Sub)
```
Components hold lightweight **subscriptions**; the application core owns **lifecycles**.

---

## 28. Effect Composition

Do not bundle unrelated resources into one massive hook. Split by **independent lifecycle**:
- `Effect A`: WebSocket connection (`[roomId]`)
- `Effect B`: Page document title (`[title]`)
- `Effect C`: Telemetry tracking (`[userId]`)

---

## 29. Eliminating Effect Orchestration Chains

```text
ANTI-PATTERN (Cascading State Chain):
Connection ready? ──► Effect ──► setReady(true) ──► Effect ──► initializeWidget()
```

### Senior Refactoring:
Initialize the widget directly inside the connection Effect, or model the connection lifecycle via a state machine.

---

## 30. Clean Direct Synchronization

```jsx
useEffect(() => {
  const connection = createConnection(roomId);
  const widget = createWidget(connection);

  return () => {
    widget.destroy();
    connection.disconnect();
  };
}, [roomId]);
```

---

## 31. Effect Ordering Invariants

> [!WARNING]
> **Never rely on the top-to-bottom source code order of `useEffect` calls to coordinate dependent systems.** If step B depends on step A, coordinate them within a single Effect, an explicit adapter, or a state machine.

---

## 32. Render Must Remain Pure

Never invoke external mutations during render to bypass Effects:
```jsx
// ❌ UNCONTROLLED SIDE EFFECT IN RENDER
function Chart({ data }) {
  chartEngine.setData(data); // Render runs unpredictably!
  return <div />;
}
```

---

## 33. Effect Semantics: Synchronization, Not Arbitrary Callbacks

An Effect is a declarative bridge between React state snapshots and external systems—not a generic post-render callback hook.

---

## 34. Error Ownership

| Error Source | Responsible Owner |
| :--- | :--- |
| **Network Socket Error** | Resource Manager / Retry Policy |
| **Rendering Failure** | React Error Boundary |
| **User Form Submission** | Event Handler Try/Catch |
| **Async Fetch Failure** | Local State / Query Client Error State |

---

## 35. Decoupling Retry Protocols From Components

Do not embed exponential backoff, jitter, and offline reconnect state machines inside a component's `useEffect`. Build a **Connection Manager** and synchronize React with its state.

---

## 36. State Machine Architecture for Complex Synchronization

```text
┌────────────────┐      connect()      ┌────────────────┐
│  Disconnected  ├────────────────────►│   Connecting   │
└───────▲────────┘                     └───────┬────────┘
        │                                      │ success
        │ failure                              ▼
┌───────┴────────┐      retry          ┌────────────────┐
│  Reconnecting  │◄────────────────────┤   Connected    │
└────────────────┘                     └────────────────┘
```
The state machine owns protocol transitions; React simply renders the current state.

---

## 37. Advanced Domain / Resource Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   Domain Engine                        │
│         State Machine + Protocol Manager               │
└───────────────────────────┬────────────────────────────┘
                            │ (State & Events)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   React Adapter                        │
│            useSyncExternalStore / Effect               │
└───────────────────────────┬────────────────────────────┘
                            │ (Declarative UI)
                            ▼
┌────────────────────────────────────────────────────────┐
│                  React Components                      │
└────────────────────────────────────────────────────────┘
```

---

## 38. Production Anti-Pattern — Effect as Business Logic Engine

```jsx
// ❌ ANTI-PATTERN: Hidden state machine inside Effect
useEffect(() => {
  if (status === "pending" && retryCount < 3 && isOnline) {
    executeRetry();
  }
}, [status, retryCount, isOnline]);
```
**Fix:** Move state transitions to explicit domain events or an XState/Redux reducer.

---

## 39. Production Anti-Pattern — Effect as Event Bus

```jsx
// ❌ ANTI-PATTERN: Reacting to state changes as synthetic events
useEffect(() => {
  if (isSaved) {
    analytics.track("Document Saved");
  }
}, [isSaved]);
```
**Fix:** Track analytics directly inside the `onSave` event handler.

---

## 40. The 10-Question Senior Architecture Audit

1. What external system is involved?
2. What React values does synchronization depend on?
3. What exact resource is established?
4. Who owns that resource?
5. What causes invalidation?
6. What exact handle does cleanup release?
7. Can an obsolete asynchronous result arrive late?
8. Can external changes flow back into React?
9. Is there any possibility of a feedback loop?
10. Could this lifecycle be owned outside the component?

---

# Layer 3 — 🧪 Diagnostic Labs & DevTools Profiling

## 41. Lab 1 — The Resource Ledger

```text
┌────────────────────────────────────────────────────────┐
│                 Effect Resource Ledger                 │
├────────────────────────────────────────────────────────┤
│ Resource:              WebSocket Chat Session          │
│ Owner:                 ChatRoom Component              │
│ Created By:            useEffect([roomId])             │
│ Inputs:                roomId                          │
│ Setup:                 socket.connect(roomId)          │
│ Cleanup:               socket.close()                  │
│ External Events:       onMessage, onError              │
│ Invalidation:          roomId prop change              │
│ Failure Behavior:      Retry manager reconnects        │
└────────────────────────────────────────────────────────┘
```

---

## 42. Lab 2 — Feedback Loop Telemetry

```javascript
function logSync(direction, source, value) {
  console.table({
    Direction: direction,
    Source: source,
    Value: value,
    Timestamp: performance.now().toFixed(2)
  });
}
```

---

## 43. Lab 3 — Resource Identity Trace

```jsx
let sequence = 1;

useEffect(() => {
  const instanceId = sequence++;
  console.log(`%c[SETUP] Instance #${instanceId}`, "color: #22c55e;");

  return () => {
    console.log(`%c[CLEANUP] Instance #${instanceId}`, "color: #ef4444;");
  };
}, [dependency]);
```
*Verification Invariant:* `SETUP #N` must always pair with `CLEANUP #N`.

---

## 44. Lab 4 — React Profiler + External Event Correlator

```text
t0: Render Component
t1: DOM Commit
t2: Effect Setup (Allocated Widget #1)
t3: External Event emitted ("update")
t4: React setState()
t5: Re-render (Pass #2)
```

---

## 45. Lab 5 — Strict Mode Symmetry Stress Test

Verify under development double-invocations (`Mount → Unmount → Remount`):
- Setup runs idempotently.
- Cleanup releases exact instance handles.
- No shared singletons are killed.
- Zero memory leaks remain.

---

# Layer 4 — 🔥 The Crucible

## 46. Crucible #1 — Ownership Mismatch

A component subscribes to an application-wide store and runs `store.destroy()` on unmount.  
**Flaw:** The component destroyed an application-owned resource that sibling components still require.

---

## 47. Crucible #2 — Feedback Ping-Pong

React pushes `value` to a widget $\rightarrow$ widget emits `change` $\rightarrow$ React updates state.  
**Resolution:** Implement value equality guards (`if (widget.getValue() !== nextVal)`) and normalize data formats at the adapter boundary.

---

## 48. Crucible #3 — Eliminating Effect Chains

`Effect A (setReady)` $\rightarrow$ `Effect B (if ready -> init)`.  
**Resolution:** Remove the intermediate state variable and initialize the resource directly within the primary Effect.

---

## 49. Crucible #4 — Sibling Socket Duplication

Two components create separate WebSockets to the same room.  
**Resolution:** Hoist connection management to a shared Context Provider or application-level socket manager with reference-counted consumers.

---

## 50. Crucible #5 — Async Race Currentness

Request A is dispatched for `user=1`. Prop changes to `user=2`. Request B is dispatched. Request A resolves *after* Request B.  
**Resolution:** Apply an `active` boolean guard or incremental `requestId` in the Effect cleanup to discard stale responses.

---

## 51. Production Incident — Infinite Sync Loop Lockup

- **Root Cause:** Widget converted `0` to `"0"`, causing React state to oscillate between number and string types.
- **Fix:** Added deterministic type coercion in the adapter layer.

---

## 52. Production Incident — Premature Socket Termination

- **Root Cause:** Sibling component unmounted and executed `globalSocket.close()`.
- **Fix:** Implemented reference counting so `close()` only executes when total active subscribers reach `0`.

---

## 53. Production Incident — Resource Multiplication

- **Root Cause:** Creating an audio synth engine inside the component render body instead of an Effect.
- **Fix:** Moved instantiation into `useEffect` with matching `synth.dispose()` cleanup.

---

## 54. Production Incident — Effect as Application Runtime

- **Root Cause:** A 400-line Effect containing retry timers, WebSocket reconnects, validation, and analytics.
- **Fix:** Refactored into a decoupled domain class + lightweight React adapter.

---

## 55. Senior Decision Matrix

| Question | Architectural Solution |
| :--- | :--- |
| **Is this a discrete user command?** | Event Handler |
| **Is this derived UI data?** | Render Calculation |
| **Is this an external mutable store?** | `useSyncExternalStore` |
| **Is this resource synchronization?** | `useEffect` |
| **Is this a complex protocol/retry engine?** | Decoupled Domain Class / State Machine |
| **Is the resource shared across components?** | Parent Provider / Ref-Counted Manager |
| **Is the resource component-exclusive?** | Component-level `useEffect` |
| **Are systems synchronizing bidirectionally?** | Explicit Authority + Value Equality Guards |
| **Can async responses arrive out of order?** | Cancellation (`AbortController`) + Currentness Guard |

---

## 56. Senior Architecture Review Checklist

- [x] External system clearly identified.
- [x] Synchronization relationship explicitly defined.
- [x] Resource owner explicitly identified.
- [x] Resource identity invariant established.
- [x] Symmetrical cleanup verified.
- [x] Shared resource reference counting implemented where applicable.
- [x] Asynchronous currentness protection applied.
- [x] Feedback loops prevented with value guards.
- [x] Data representations normalized at adapter boundary.
- [x] Business logic decoupled into domain managers.

---

## 57. Final Completion Checklist

- [x] Define a formal synchronization boundary.
- [x] Distinguish resource ownership from resource access.
- [x] Implement deterministic setup/cleanup pairing.
- [x] Model bidirectional synchronization without feedback loops.
- [x] Build an adapter boundary around third-party libraries.
- [x] Isolate component lifetimes from shared resource lifetimes.
- [x] Eliminate cascading Effect chains.
- [x] Protect asynchronous operations with currentness guards.
- [x] Decouple complex network protocols into state machines.
- [x] Audit and profile synchronization lifecycles with React DevTools.

---

### 🏆 Final Mental Model

```text
                     REACT COMPONENT
                            │
                            ▼
                 SYNCHRONIZATION BOUNDARY
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
      Reactive Inputs     Resource      Lifecycle
      (Exact Surface)     Identity      Ownership
            │               │               │
            └───────────────┼───────────────┘
                            │
                            ▼
                 ADAPTER & NORMALIZATION
                            │
                            ▼
                EXTERNAL IMPERATIVE SYSTEM
```

> **Effects are synchronization boundaries, not miniature application runtimes. When an Effect begins accumulating state machines, retry protocols, event buses, and domain logic, the senior architectural response is decomposition.**

---

### KPI 06 Progression
- Part 01: Why Effects Exist
- Part 02: Effect Lifecycle: Setup & Cleanup
- Part 03: Dependencies & Reactive Values
- Part 04: Dependency/Synchronization Foundations
- Part 05: Effects vs Event Handlers & Derived Data
- Part 06: Dependency Correctness, Stable Identity & Stale Closures
- Part 07: Effect Dependency Refactoring & Synchronization Boundaries
- Part 08: Cleanup, Resource Ownership & Synchronization Teardown
- Part 09: Async Effects, Cancellation, Races & Stale Results
- Part 10: Browser Synchronization & Layout Effects
- Part 11: External Systems & Imperative APIs
- Part 12: External Store Synchronization
- Part 13: Effect Performance & Synchronization Optimization
- **Part 14: Advanced Effect Architecture** *(Current)*
- **Part 15: Effects & Synchronization Crucible** *(Next & Final Part)*
