# Level 06 — React Fundamentals
## KPI 06 / KPI 09 — Effects & Synchronization
### PART 04 — Effect Synchronization Patterns & External Systems

[⬅️ Previous Part](03-dependencies-and-reactive-values.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](examples/04-effect-synchronization-patterns.html) | [Next Part ➡️](05-effect-events-and-derived-data.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

# ⚡ LAYER 1 — 30-SECOND EXECUTIVE CHEAT SHEET

## 1. What Is an Effect Actually Synchronizing?

An Effect exists when React owns the desired application state, while something outside React owns an external resource or system.

```text
       React
         │
   rendered state
         │
         ▼
       Effect
         │
    ┌────┼────┐
    ▼    ▼    ▼
 Browser Network Subscription
    │    │    │
    ▼    ▼    ▼
 DOM/API Request Connection
```

The Effect's job is:
```text
React state / props
        ↓
derive synchronization parameters
        ↓
establish external relationship
        ↓
keep relationship aligned
        ↓
cleanup obsolete relationship
```

The Effect is not primarily:
> *"run some JavaScript after rendering"*

It is:
> **A synchronization mechanism between React's current rendered world and an external system.**

---

## 2. External System Categories

| External System | Typical Effect |
| :--- | :--- |
| **Browser API** | `document.title`, media APIs, observers (`ResizeObserver`, `IntersectionObserver`) |
| **Subscription** | WebSocket, event emitter, store subscription |
| **Timer** | `setInterval`, `setTimeout` |
| **Imperative widget** | Chart / editor / map library initialization and lifecycle |
| **Network synchronization** | Connection / request lifecycle |
| **Media** | Video / audio playback imperative state |
| **DOM integration** | Imperative DOM APIs (`focus()`, `scrollIntoView()`) |
| **Third-party library** | Library initialization and configuration |
| **External store** | Subscribe / unsubscribe relationship |

The key architectural question:
> **What resource or relationship does this Effect own?**

---

## 3. Synchronization Is a Lifecycle

A useful mental model:

```text
dependency values
       │
       ▼
synchronization
       │
   ┌───┴───┐
   ▼       ▼
establish maintain
   │
   ▼
dependency changes?
   │
  yes
   │
   ▼
cleanup
   │
   ▼
establish new sync
```

The lifecycle is therefore:
```text
Setup  ──►  Active synchronization  ──►  Cleanup  ──►  New setup
```
not simply:
```text
Render  ──►  callback
```

---

## 4. Golden Rule

> **Every Effect should have an identifiable external synchronization target, an explicit ownership boundary, and a cleanup strategy whenever the synchronization establishes a resource or relationship that must be terminated.**

If you cannot answer:
> *"What external system is this Effect synchronizing?"*

you should immediately question whether the Effect belongs there.

---

# 🔬 LAYER 2 — DEEP MECHANICAL BREAKDOWN

## 5. React vs External Systems

React is exceptionally good at describing UI:
```tsx
return <Video isPlaying={isPlaying} />;
```

But React does not automatically know how to command an imperative video object. The browser's media element has imperative state:
```javascript
video.play();
video.pause();
```

So the architecture becomes:
```text
React state
    │
    ▼
isPlaying
    │
    ▼
 Effect
    │
    ├── true  ──► video.play()
    └── false ──► video.pause()
```

This is synchronization.
- **React owns:** `isPlaying` state
- **The external system owns:** `HTMLMediaElement` playback state
- **The Effect:** Reconciles those two worlds.

---

## 6. Example — Document Title

Suppose:
```typescript
function Page({ title }: { title: string }) {
  useEffect(() => {
    document.title = title;
  }, [title]);

  return <main>{title}</main>;
}
```

- React owns: `title`
- The browser owns: `document.title`
- The Effect establishes: `React title → browser document title`

When `title = "Dashboard"`, the external system becomes `document.title = "Dashboard"`. When React later renders `title = "Settings"`, the synchronization transitions: `Dashboard → Settings`. No additional React state is necessary.

---

## 7. Effect Does Not Mean "Store the Result"

A common mistake:
```typescript
function Page({ title }: { title: string }) {
  const [documentTitle, setDocumentTitle] = useState("");

  useEffect(() => {
    setDocumentTitle(title); // ❌ Redundant state pipeline
  }, [title]);

  return <div>...</div>;
}
```

This introduces an unnecessary pipeline:
```text
title ──► Effect ──► state update ──► second render
```
when the actual synchronization is simply:
```text
title ──► document.title
```
If the external system is the browser document title, synchronize it directly.

---

## 8. External System #1 — Browser APIs

Examples:
- `document.title`
- `window.addEventListener(...)`
- `navigator.geolocation`
- `IntersectionObserver`
- `ResizeObserver`
- `MutationObserver`
- `window.matchMedia`

These APIs live completely outside React's state model.

```typescript
useEffect(() => {
  const handleResize = () => {
    console.log(window.innerWidth);
  };

  window.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("resize", handleResize);
  };
}, []);
```

- **The Effect owns:** `window` resize subscription
- **Setup:** `addEventListener`
- **Cleanup:** `removeEventListener`
- **Ownership:** Component instance

---

## 9. Resource Identity Matters

This is subtle and extremely important.

### Correct:
```typescript
useEffect(() => {
  const handler = () => {
    console.log("resize");
  };

  window.addEventListener("resize", handler);

  return () => {
    window.removeEventListener("resize", handler);
  };
}, []);
```

The exact function identity is preserved:
```text
handler₁ ──┬──► add(handler₁)
           └──► remove(handler₁)
```

### Incorrect:
```typescript
useEffect(() => {
  window.addEventListener("resize", () => {
    console.log("resize");
  });

  return () => {
    window.removeEventListener("resize", () => {
      console.log("resize");
    }); // ❌ Different function reference!
  };
}, []);
```

Now: `add(handler₁)` and `remove(handler₂)` where `handler₁ !== handler₂`. The subscription remains permanently active in the browser. This is a JavaScript function-identity issue becoming a React resource-lifecycle bug.

---

## 10. External System #2 — Timers

Consider:
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

- **Resource:** Interval ID
- **Ownership:** Effect instance
- **Setup:** `setInterval`
- **Cleanup:** `clearInterval`

Lifecycle:
```text
setup ──► interval active ──► cleanup ──► interval terminated
```

Without cleanup:
```text
render / remount ──► new interval ──► old interval remains
```
Eventually `interval₁`, `interval₂`, `interval₃` all fire concurrently.

---

## 11. External System #3 — Subscriptions

Consider:
```typescript
useEffect(() => {
  const unsubscribe = store.subscribe(() => {
    refresh();
  });

  return unsubscribe;
}, []);
```

- **The external relationship:** Component $\rightarrow$ store subscription
- **Setup:** `subscribe()`
- **Cleanup:** `unsubscribe()`

The returned cleanup function represents the exact resource termination operation.

---

## 12. External System #4 — WebSocket

Consider:
```typescript
function Chat({ roomId }: { roomId: string }) {
  useEffect(() => {
    const socket = new WebSocket(`wss://example.com/rooms/${roomId}`);

    return () => {
      socket.close();
    };
  }, [roomId]);

  return <div>...</div>;
}
```

- **Dependency:** `roomId`
- **External resource:** `WebSocket(roomId)`
- `roomId = A` produces `Socket A`
- `roomId = B` requires: `close Socket A → create Socket B`

The Effect dependency describes the connection identity.

---

## 13. Prediction-First Walkthrough — WebSocket

```typescript
function Chat({ roomId }: { roomId: string }) {
  useEffect(() => {
    const socket = new WebSocket(`wss://example.com/${roomId}`);
    console.log("OPEN", roomId);

    return () => {
      console.log("CLOSE", roomId);
      socket.close();
    };
  }, [roomId]);

  return <div>{roomId}</div>;
}
```

### Render #1:
- `roomId = "general"`
- Effect closure: `roomId → "general"`
- Setup: `OPEN general`
- External resource: `Socket(general)`

### Render #2:
- `roomId = "general"`
- `Object.is("general", "general") === true`
- No dependency transition. Existing synchronization remains.

### Render #3:
- `roomId = "engineering"`
- `Object.is("general", "engineering") === false`
- React transitions synchronization:
  ```text
  cleanup old Effect  ──►  CLOSE general
          ↓
  setup new Effect    ──►  OPEN engineering
  ```

> **Crucial Fact:** The cleanup closure still contains `"general"`. That is exactly what we want. Cleanup must terminate the old resource.

---

## 14. Why Cleanup Uses Old Values

This often confuses developers.

Suppose:
```typescript
useEffect(() => {
  const socket = connect(roomId);

  return () => {
    socket.disconnect();
  };
}, [roomId]);
```

- **Render #1:** `roomId = A`, `socket = socketA`
- **Render #2:** `roomId = B`, `socket = socketB`

The cleanup from Render #1 still closes over `socketA`, **not** `socketB`. That is precisely correct. The cleanup belongs to the synchronization established by that Effect instance:
```text
Effect₁ ──┬── input A
          └── owns socketA

Effect₂ ──┬── input B
          └── owns socketB
```

---

## 15. External System #5 — Imperative Widgets

Suppose a third-party chart library expects:
```javascript
const chart = new Chart(element, options);
chart.destroy();
```

React renders the container:
```tsx
<div ref={containerRef} />
```

The imperative chart instance belongs to the external library:
```typescript
useEffect(() => {
  const chart = new Chart(containerRef.current, options);

  return () => {
    chart.destroy();
  };
}, [options]);
```

### Architecture:
```text
React
  │ renders container
  ▼
DOM node
  │ Effect
  ▼
Chart instance
```

- React owns: container existence
- The chart library owns: chart instance
- The Effect connects the two.

---

## 16. Resource Ownership

Every external synchronization should trigger the question:
> **Who owns this resource?**

Possible owners:
- component instance
- parent / application
- shared singleton
- external service
- browser

### Example:
```typescript
useEffect(() => {
  const socket = new WebSocket(url);
  return () => socket.close();
}, [url]);
```
Here the component owns the socket.

But consider a global analytics client:
```text
Application
    ↓
Analytics singleton
    ↓
many components
```
A component should not destroy the singleton during its cleanup. Otherwise:
```text
Component A unmounts  ──►  analytics singleton destroyed  ──►  Component B breaks
```
Therefore cleanup correctness depends on ownership.

---

## 17. Component-Owned vs Shared Resources

### Component-Owned:
```text
Component  ──►  creates resource  ──►  uses resource  ──►  destroys resource
```
*Excellent candidate for local Effect synchronization.*

### Shared:
```text
Application  ──►  creates resource
                      ├──► Component A uses
                      ├──► Component B uses
                      └──► Component C uses
```
The lifecycle belongs above the individual components. **Do not automatically treat every external resource as component-owned.**

---

## 18. Synchronization Is Not Necessarily Creation

An Effect does not always create a resource.

### Example:
```typescript
useEffect(() => {
  document.title = title;
}, [title]);
```
No resource needs cleanup. The synchronization is simply: `React title → browser title`.

> `Effect ≠ must always have cleanup`  
> Cleanup is required when setup establishes something that needs termination/release.

---

## 19. Setup/Cleanup Symmetry

### Invariant:
```text
Setup establishes X  ──►  Cleanup terminates X
```

| Setup | Cleanup |
| :--- | :--- |
| `addEventListener` | `removeEventListener` |
| `subscribe` | `unsubscribe` |
| `setInterval` | `clearInterval` |
| `setTimeout` | `clearTimeout` |
| `new WebSocket` | `socket.close()` |
| `new Observer` | `observer.disconnect()` |
| `new Chart` | `chart.destroy()` |

> **Crucial:** `cleanup ≠ generic undo button`. The exact external API determines the correct cleanup.

---

## 20. Cleanup Is Not Universal Rollback

Suppose:
```typescript
useEffect(() => {
  analytics.track("page_view");

  return () => {
    // what would "undo" mean?
  };
}, []);
```

There may be no meaningful rollback. A page-view event is not a persistent subscription that needs termination.

Therefore:
- `Effect cleanup` does not imply *undo everything setup did*.
- It means: *Terminate/release the synchronization relationship or resource that requires cleanup.*

---

## 21. External System #6 — Observers

```typescript
useEffect(() => {
  const observer = new ResizeObserver(entries => {
    console.log(entries);
  });

  observer.observe(element);

  return () => {
    observer.disconnect();
  };
}, [element]);
```

- **Resource:** `ResizeObserver`
- **Setup:** `observe()`
- **Cleanup:** `disconnect()`
- **Potential failure:** Missing `disconnect` causes the component's external relationship to remain active longer than intended.

---

## 22. External System #7 — Media

Suppose React state controls playback:
```typescript
function VideoPlayer({ isPlaying }: { isPlaying: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isPlaying) {
      ref.current?.play();
    } else {
      ref.current?.pause();
    }
  }, [isPlaying]);

  return <video ref={ref} />;
}
```

The relationship:
```text
React state
    │
    ▼
isPlaying
    │
    ▼
HTMLMediaElement
    ├── play()
    └── pause()
```

No local state such as `const [actualPlayback, setActualPlayback] = useState(...)` is required just to perform the synchronization.

---

## 23. Prediction-First Walkthrough — Media

1. **Initial (`isPlaying = false`):** Effect executes `pause()`.
2. **Later (`isPlaying = true`):** Dependency changes (`false → true`). Effect executes `play()`.
3. **Later (`isPlaying = false`):** Dependency changes (`true → false`). Effect executes `pause()`.

The Effect is acting as a bridge: **React declarative state $\rightarrow$ Imperative browser API.**

---

## 24. Network Synchronization Requires Extra Care

A request can be external work:
```typescript
useEffect(() => {
  fetch(`/api/users/${userId}`);
}, [userId]);
```

Network work introduces asynchronous complications:
- stale responses
- cancellation
- request identity
- ordering
- ownership

> **Core Principle:** A network request started by an Effect is an external operation whose lifecycle must be reasoned about separately from the render that initiated it.

---

## 25. The Important Distinction: Synchronization vs Event

Consider:
```typescript
function SaveButton({ data }) {
  useEffect(() => {
    save(data); // ⚠️ Questionable architecture
  }, [data]);

  return <button>Save</button>;
}
```

This says: *"Whenever data changes $\rightarrow$ save"*.

But the user interaction semantics are: *"User clicks Save $\rightarrow$ save current data"*.

Those are completely different systems:
- **System 1:** `data → external synchronization`
- **System 2:** `user event → command`

The command belongs in the event handler, not the Effect.

---

## 26. Synchronization vs Derived Data

### Bad:
```typescript
const [fullName, setFullName] = useState("");

useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);
```

There is no external system. The desired value is purely derivable:
```text
firstName + lastName ──► fullName
```

### Prefer:
```typescript
const fullName = `${firstName} ${lastName}`;
```
The architecture becomes a pure render calculation rather than `render → Effect → state → render`.

---

## 27. Synchronization vs Initialization

Another common misconception:
```typescript
useEffect(() => {
  initializeSomething();
}, []);
```

Ask:
- *Is this truly synchronization with an external system, or just initialization code?*
- If the code establishes a long-lived external relationship, an Effect may be appropriate.
- If it is merely performing a one-time application action because the developer needs somewhere to put it, the architecture deserves scrutiny.

> The fact that `[]` exists does not automatically make an Effect correct.

---

## 28. The External-System Test

Before writing an Effect, ask:

1. **Question 1:** Is there something outside React involved? (If no: probably no Effect)
2. **Question 2:** What exact external system? (DOM, browser API, timer, subscription, WebSocket, media, imperative library, external store, network operation)
3. **Question 3:** What React values define the synchronization?
4. **Question 4:** What resource/relationship does setup establish?
5. **Question 5:** How is that relationship terminated?
6. **Question 6:** Who owns it?

---

## 29. Anti-Pattern — Effect for Derived Data

### Flawed:
```typescript
const [total, setTotal] = useState(0);

useEffect(() => {
  setTotal(price * quantity);
}, [price, quantity]);
```

- **Mechanical failure:** `price`/`quantity` change $\rightarrow$ render $\rightarrow$ Effect $\rightarrow$ `setTotal` $\rightarrow$ another render.
- **Refactoring:** `const total = price * quantity;` (Pure calculation during render).

---

## 30. Anti-Pattern — Effect as Event Handler

### Flawed:
```typescript
const [submitted, setSubmitted] = useState(false);

useEffect(() => {
  if (submitted) {
    submitOrder();
  }
}, [submitted]);
```

- The actual event is: **User clicked submit**.
- Artificially transformed into: `event → state → Effect → command`.
- **Senior Refactor:** Put `submitOrder()` directly inside `handleSubmit()`.

---

## 31. Anti-Pattern — Resource Created Outside Ownership Boundary

### Flawed:
```typescript
const socket = new WebSocket(url); // Module-level singleton

function Chat() {
  useEffect(() => {
    socket.onmessage = ...;

    return () => socket.close(); // ❌ Destroys module-level resource!
  }, []);
}
```

- Socket ownership: Module level.
- Cleanup: Component level (`socket.close()`).
- Unmounting one component destroys the resource shared by other components.
- **Rule:** Ownership must be coherent.

---

## 32. Anti-Pattern — Incomplete Cleanup

### Flawed:
```typescript
useEffect(() => {
  const interval = setInterval(tick, 1000);

  return () => {
    console.log("cleanup"); // ❌ interval remains alive!
  };
}, []);
```

Presence of cleanup is not evidence of cleanup correctness. The cleanup must terminate the resource.

---

## 33. Anti-Pattern — Cleanup the Wrong Resource

### Flawed:
```typescript
useEffect(() => {
  const socket = connect(roomId);

  return () => {
    disconnect(otherSocket); // ❌ Wrong resource identity!
  };
}, [roomId]);
```

Violates core invariant: `setup X → cleanup X`.

---

## 34. Production Incident — Timer Multiplication

- **Symptom:** Dashboard refreshes $1\times/\text{sec}$. After navigating away and back: $2\times/\text{sec} \rightarrow 3\times/\text{sec} \rightarrow 5\times/\text{sec}$.
- **Failure:** Missing `clearInterval(id)`.
- **Diagnostic evidence:** `console.count("interval setup")` vs `console.count("interval cleanup")`.

---

## 35. Production Incident — Duplicate Event Listeners

- **Symptom:** Single browser event triggers 10 alert modals.
- **Investigation:** Check `addEventListener` vs `removeEventListener` counts and handler function reference equality.

---

## 36. Production Incident — Wrong WebSocket Room

- **Symptom:** UI says `Room: engineering`, but messages arrive from `general`.
- **Potential cause:** Missing `roomId` in dependency array $\rightarrow$ Effect captured `roomId = general` and never re-synchronized when prop changed to `engineering`.

---

## 37. Diagnostic Lab — Synchronization Ledger

Instrument each Effect with:
```typescript
useEffect(() => {
  const startedAt = performance.now();
  console.table({ phase: "setup", roomId, startedAt });

  const resource = connect(roomId);

  return () => {
    console.table({
      phase: "cleanup",
      roomId,
      lifetime: performance.now() - startedAt,
    });
    resource.disconnect();
  };
}, [roomId]);
```

Exposes the complete resource lifecycle: `setup(A) → cleanup(A) → setup(B) → cleanup(B)`.

---

## 38. Diagnostic Lab — Resource Ownership Table

| Question | Answer |
| :--- | :--- |
| **External system** | ? |
| **Resource** | ? |
| **Creator** | ? |
| **Owner** | ? |
| **Setup operation** | ? |
| **Cleanup operation** | ? |
| **Reactive inputs** | ? |
| **Identity** | ? |
| **Failure mode** | ? |

---

## 39. Dependency $\rightarrow$ Resource Identity

```text
Dependencies
     ↓
Synchronization identity
     ↓
External resource
```

Changing `roomId (A → B)` means:
```text
Connection(A)  ──►  obsolete  ──►  Connection(B)
```

The identity of the external synchronization changed.

---

## 40. Effect Design Template

1. **External system:** `______________________`
2. **Synchronization target:** `______________________`
3. **Reactive inputs:** `______________________`
4. **Resource identity:** `______________________`
5. **Setup:** `______________________`
6. **Cleanup:** `______________________`
7. **Owner:** `______________________`
8. **Failure / race considerations:** `______________________`

---

# 🔬 THE CRUCIBLE

### Challenge 1 — Identify the External System
```typescript
useEffect(() => {
  document.title = `${count} items`;
}, [count]);
```
- **External system:** Browser document title (`document.title`)
- **React owns:** `count`
- **Browser owns:** `document.title`
- **Synchronization:** `count → document.title`

---

### Challenge 2 — Is Cleanup Necessary?
- **A:** `useEffect(() => { document.title = title; }, [title]);` $\rightarrow$ **No cleanup needed** (overwritten on next sync).
- **B:** `useEffect(() => { const id = setInterval(tick, 1000); return () => clearInterval(id); }, []);` $\rightarrow$ **Cleanup required** (interval continues running in background).

---

### Challenge 3 — Resource Identity
```typescript
useEffect(() => {
  const socket = connect(roomId);
  return () => {
    socket.disconnect();
  };
}, [roomId]);
```
**Sequence $A \rightarrow B \rightarrow C$:**
`connect(A) → disconnect(A) → connect(B) → disconnect(B) → connect(C)`. Each cleanup owns the resource established by its corresponding setup.

---

### Challenge 4 — Ownership
You have `GlobalAnalytics` used by `Header`, `Dashboard`, `Settings`. Should each component execute `analytics.shutdown()` on cleanup?
- **No.** The resource is shared at the application level. Ownership is above the individual component.

---

### Challenge 5 — Find the Bug
```typescript
useEffect(() => {
  const observer = new ResizeObserver(onResize);
  observer.observe(element);
}, [element]);
```
- **Bug:** Missing cleanup leaves `ResizeObserver` observing the element indefinitely.
- **Fix:** `return () => observer.disconnect();`.

---

### Challenge 6 — Event or Synchronization?
```typescript
useEffect(() => {
  if (shouldSubmit) {
    submitForm();
  }
}, [shouldSubmit]);
```
- **Analysis:** `submitForm()` is a user action command, not external state synchronization. It belongs in the `onSubmit` event handler.

---

# 41. Senior Decision Matrix

| Requirement | Effect? | Architectural Reason |
| :--- | :---: | :--- |
| **Calculate derived value** | ❌ | Render calculation |
| **Format a string** | ❌ | Pure computation |
| **Respond directly to button click** | Usually ❌ | Event handler |
| **Set `document.title` from state** | ✅ | Browser synchronization |
| **Subscribe to external store** | ✅ | External relationship |
| **Start/stop timer** | ✅ | External resource |
| **Create/destroy imperative widget** | ✅ | External resource |
| **Control media playback** | ✅ | Imperative external API |
| **Open/close WebSocket** | ✅ | External connection |
| **Synchronize browser observer** | ✅ | External subscription |
| **Copy value to local React state** | Usually ❌ | Redundant derived state |
| **Fire business command because state changed** | Usually ❌ | Event semantics |

---

# 42. The Senior Effect Review

When reviewing production code, inspect:
1. **Boundary:** What exists outside React?
2. **Ownership:** Who owns it?
3. **Identity:** What defines the resource's identity?
4. **Dependencies:** Which reactive values define that identity?
5. **Setup:** What establishes the relationship?
6. **Cleanup:** What terminates exactly that relationship?
7. **Correctness:** Can the external system become stale?
8. **Performance:** Can synchronization occur unnecessarily?
9. **Concurrency/races:** Can external completion occur after inputs change?

---

# 43. 25–40+ Completion Checklist

You should be able to:
- [ ] Define an external system.
- [ ] Explain why Effects exist.
- [ ] Distinguish React state from external state.
- [ ] Identify browser APIs as external systems.
- [ ] Identify timers as external resources.
- [ ] Identify subscriptions as external relationships.
- [ ] Identify WebSockets as external resources.
- [ ] Identify imperative widgets as external systems.
- [ ] Identify media APIs as external systems.
- [ ] Identify observers as external resources.
- [ ] Explain synchronization as a lifecycle.
- [ ] Explain setup.
- [ ] Explain cleanup.
- [ ] Explain re-synchronization.
- [ ] Explain why cleanup may occur while a component remains mounted.
- [ ] Explain resource ownership.
- [ ] Distinguish component-owned and shared resources.
- [ ] Explain setup/cleanup symmetry.
- [ ] Explain why cleanup is not generic rollback.
- [ ] Explain why cleanup is not automatically cancellation.
- [ ] Explain resource identity.
- [ ] Explain function identity in event listener cleanup.
- [ ] Explain timer cleanup.
- [ ] Explain subscription cleanup.
- [ ] Explain WebSocket cleanup.
- [ ] Explain observer cleanup.
- [ ] Explain imperative widget cleanup.
- [ ] Explain why not every Effect needs cleanup.
- [ ] Explain why not every piece of code belongs in an Effect.
- [ ] Distinguish derived computation from synchronization.
- [ ] Distinguish event commands from synchronization.
- [ ] Identify unnecessary Effect $\rightarrow$ state pipelines.
- [ ] Identify missing cleanup.
- [ ] Identify cleanup of the wrong resource.
- [ ] Identify incorrect ownership.
- [ ] Identify stale synchronization.
- [ ] Trace an Effect across multiple renders.
- [ ] Trace dependency changes to resource replacement.
- [ ] Instrument Effect setup/cleanup.
- [ ] Build a resource ownership ledger.
- [ ] Diagnose duplicate external resources.
- [ ] Explain dependency $\rightarrow$ synchronization identity.
- [ ] Review an Effect as a production architecture boundary.

---

# 44. Final Mental Model

```text
Do not think:
Render  ──►  useEffect  ──►  run code

Think:
React World
    │
props + state
    │
    ▼
  Render
    │
    ▼
Reactive Snapshot
    │
    ▼
  Effect
    │
    ┌────────────┼─────────────┐
    ▼            ▼             ▼
   DOM         Timer      Subscription
    │            │             │
    ▼            ▼             ▼
 External     External      External
  System       System        System
    │            │             │
    └────────────┼─────────────┘
                 │
         Dependency change
                 │
                 ▼
              Cleanup
                 │
                 ▼
        New synchronization
```

The core invariant:
> **React owns the rendered description; the Effect owns the synchronization relationship with the external system.**

And the engineering chain:
```text
Reactive values
      ↓
Synchronization identity
      ↓
External resource
      ↓
Setup
      ↓
Active relationship
      ↓
Dependency change / unmount
      ↓
Cleanup
      ↓
New synchronization
```

---

[⬅️ Previous Part](03-dependencies-and-reactive-values.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](examples/04-effect-synchronization-patterns.html) | [Next Part ➡️](05-effect-events-and-derived-data.md)
