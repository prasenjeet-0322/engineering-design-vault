# Level 06 — React Fundamentals
## KPI 06 / KPI 09 — Effects & Synchronization
### PART 07 — Effect Dependency Refactoring & Synchronization Boundaries

[⬅️ Previous Part](06-effect-dependencies-and-stable-identities.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](examples/07-effect-dependency-refactoring.html) | [Next Part ➡️](08-effect-cleanup-resource-ownership.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

# Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

## 1. The Core Problem

A dependency problem is frequently a design problem upstream of the dependency array.

Consider:
```typescript
const options = { roomId, serverUrl };

useEffect(() => {
  connect(options);
}, [options]);
```

- A junior-level response is: *"Memoize `options` with `useMemo`."*
- A senior-level response is: *"Why is `options` an external dependency at all?"*

That distinction is the foundation of Effect refactoring.

---

## 2. The Refactoring Hierarchy

When an Effect has problematic dependencies, reason in this strict order:

```text
       EFFECT HAS PROBLEMATIC DEPENDENCY
                       │
                       ▼
       Is the dependency actually part
              of synchronization?
                       │
         ┌─────────────┴─────────────┐
         │                           │
        NO                          YES
         │                           │
         ▼                           ▼
Remove the dependency         Is its identity
  by restructuring        intentionally meaningful?
                                     │
                       ┌─────────────┴─────────────┐
                       │                           │
                      NO                          YES
                       │                           │
                       ▼                           ▼
             Normalize dependency          Stabilize identity
                   boundary               when appropriate
                       │                           │
                       └─────────────┬─────────────┘
                                     │
                                     ▼
                    Verify synchronization semantics
                             remain correct
```

---

## 3. Three Different Problems

Do not confuse:

- **Problem A — Incorrect Dependency:** Effect reads $X$ but the dependency relationship omits $X$.  
  $\rightarrow$ *This is a correctness problem.*
- **Problem B — Unstable Dependency:** Effect depends on $X$, but $X$ is recreated every render.  
  $\rightarrow$ *This is a synchronization-churn problem.*
- **Problem C — Incorrect Synchronization Boundary:** One Effect synchronizes multiple unrelated systems.  
  $\rightarrow$ *This is an architecture problem.*

They require completely different solutions.

---

## 4. Golden Rule

> **Refactor the synchronization relationship before optimizing the dependency identity.**

Do not reach for `useMemo`, `useCallback`, or `useRef` until you understand why the dependency exists in the first place.

---

## 5. The Four Main Refactoring Moves

A senior React engineer recognizes four major architectural moves:

1. **Move derived values into the Effect**
2. **Move helper functions into the Effect**
3. **Split unrelated synchronization Effects**
4. **Stabilize identity when identity itself is meaningful**

Each changes the dependency graph fundamentally.

---

# Layer 2 — 🔬 Deep Mechanical Breakdown

## 6. Move Derived Objects Inside the Effect

### Problem:
```typescript
function Chat({ roomId }: { roomId: string }) {
  const options = { roomId, reconnect: true };

  useEffect(() => {
    connect(options);
  }, [options]);

  return <ChatView />;
}
```

```text
roomId ──► options object ──► Effect
```
`options` is merely an intermediate representation created during rendering.

### Refactor:
```typescript
function Chat({ roomId }: { roomId: string }) {
  useEffect(() => {
    const options = { roomId, reconnect: true };
    connect(options);

    return () => {
      disconnect(options);
    };
  }, [roomId]); // ✅ Depends only on primitive roomId

  return <ChatView />;
}
```

```text
roomId ──► Effect ──► options ──► connection
```
This is significantly easier to reason about and eliminates unnecessary object allocations from the dependency graph.

---

## 7. Why This Works

The true reactive dependency is `roomId`. The temporary configuration object exists only because the imperative API requires a configuration object.

Its reference identity is **not** part of the application's reactive model. Therefore, object identity does not need to escape the Effect boundary. This is **dependency normalization**.

---

## 8. Move Helper Functions Inside the Effect

### Problem:
```typescript
function Editor({ documentId }: { documentId: string }) {
  function createPayload(data) {
    return { documentId, data };
  }

  useEffect(() => {
    subscribe(createPayload);
  }, [createPayload]); // ❌ New function identity every render

  return <EditorView />;
}
```

`createPayload` is recreated on every render snapshot:
```text
Render #1 ──► Function A
Render #2 ──► Function B
Render #3 ──► Function C
```

### Refactor:
```typescript
function Editor({ documentId }: { documentId: string }) {
  useEffect(() => {
    function createPayload(data) {
      return { documentId, data };
    }

    subscribe(createPayload);

    return () => {
      unsubscribe(createPayload);
    };
  }, [documentId]); // ✅ Explicit relationship

  return <EditorView />;
}
```

Now the dependency relationship is explicit: `documentId → Effect → subscription callback`.

---

## 9. When `useCallback` Is Actually Appropriate

Consider:
```typescript
const submit = useCallback(
  (data) => {
    api.save(documentId, data);
  },
  [documentId]
);
```

This is appropriate if `submit` identity has meaning outside the Effect:
- A child component uses it as a memoization boundary (`React.memo`)
- Another hook consumes it
- An external subscription genuinely requires a stable callback identity
- A third-party library uses callback identity as part of its registration API

> **Rule:** Stable identity should solve an identity requirement, not conceal an unexamined dependency problem.

---

## 10. Split Unrelated Effects

### Bad:
```typescript
useEffect(() => {
  connect(roomId);
  document.title = title;
  analytics.track(userId);
}, [roomId, title, userId]);
```

Three external systems exist:
1. WebSocket
2. Document title
3. Analytics

One mega-Effect couples all three. If `title` changes, the WebSocket disconnects and reconnects!

### Refactor:
```typescript
// Effect 1: WebSocket lifecycle
useEffect(() => {
  const connection = connect(roomId);
  return () => connection.disconnect();
}, [roomId]);

// Effect 2: Browser document title synchronization
useEffect(() => {
  document.title = title;
}, [title]);

// Effect 3: Analytics synchronization
useEffect(() => {
  analytics.track(userId);
}, [userId]);
```

The dependency graph now mirrors the actual external system boundaries:
```text
roomId ──► connection
title  ──► document title
userId ──► analytics
```

---

## 11. Effect Boundaries Should Follow Resource Boundaries

> **Architectural Invariant:** If two operations have different resource lifetimes, they deserve different synchronization boundaries.

- **WebSocket:** Active while entering room $\rightarrow$ Destroyed when leaving room.
- **Document Title:** Updates independently whenever title changes.

Do not combine resources merely because they happen to be located inside the same component.

---

## 12. Dependency Count Is Not a Quality Metric

Bad heuristic: *"Five dependencies is bad."*

Not necessarily. This is completely reasonable:
```typescript
useEffect(() => {
  connect(serverUrl, roomId, userId);
}, [serverUrl, roomId, userId]);
```
if all three values genuinely configure that connection.

> The problem is never the **number of dependencies**; it is an **incorrect dependency relationship**.

---

## 13. Dependency Surface Area

```typescript
// Surface Area = 2
useEffect(() => {
  connect(serverUrl, roomId);
}, [serverUrl, roomId]);

// Surface Area = 5 (Overloaded)
useEffect(() => {
  connect(serverUrl, roomId);
  log(userId);
  updateTitle(title);
  syncTheme(theme);
}, [serverUrl, roomId, userId, title, theme]);
```

A large dependency surface area increases the probability of accidental invalidation.

---

## 14. Refactor Based on Invalidation Semantics

Ask:
> **What specific event should cause this external resource to be recreated?**

- **WebSocket:** `roomId` changes $\rightarrow$ Recreate connection.
- **Document title:** `title` changes $\rightarrow$ Update title string.
- **Analytics identity:** `userId` changes $\rightarrow$ Re-identify session.

---

## 15. Render-by-Render Prediction #1

```tsx
function Chat({ roomId }) {
  const [count, setCount] = useState(0);
  const options = { roomId };

  useEffect(() => {
    console.log("connect", options.roomId);
  }, [options]);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      {count}
    </button>
  );
}
```

- **Render #1:** `count = 0`, `roomId = A`, `options = Object #1` $\rightarrow$ Effect executes.
- **Render #2 (after button click):** `count = 1`, `roomId = A`, `options = Object #2`.
- `roomId` is unchanged, but `Object #1 !== Object #2`.
- **Result:** Effect re-runs. Unrelated counter update caused WebSocket connection churn!

---

## 16. Refactored Version

```tsx
function Chat({ roomId }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const options = { roomId };
    console.log("connect", options.roomId);
  }, [roomId]);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      {count}
    </button>
  );
}
```

`count` changes $\rightarrow$ render $\rightarrow$ `roomId` unchanged $\rightarrow$ dependencies unchanged $\rightarrow$ **Zero connection churn.**

---

## 17. Render-by-Render Prediction #2

```typescript
function App({ roomId, title }) {
  useEffect(() => {
    connect(roomId);
    document.title = title;
  }, [roomId, title]);
}
```

- `Render #1: roomId = "A", title = "Dashboard"`
- `Render #2: roomId = "A", title = "Settings"`

`title` changed $\rightarrow$ entire Effect re-runs $\rightarrow$ WebSocket reconnects unnecessarily!

---

## 18. Correct Refactoring

```typescript
useEffect(() => {
  const connection = connect(roomId);
  return () => connection.disconnect();
}, [roomId]);

useEffect(() => {
  document.title = title;
}, [title]);
```

- `title` change $\rightarrow$ only title Effect runs.
- `roomId` change $\rightarrow$ only connection Effect runs.

---

## 19. Dependency Removal vs Dependency Elimination

| Move | Mechanism | Evaluation |
| :--- | :--- | :---: |
| **Dependency Removal** | `useEffect(() => { use(value); }, []);` | ❌ **Stale Closure Bug** (Lie to React) |
| **Dependency Elimination** | Restructure architecture so Effect genuinely no longer reads changing value | ✅ **Architectural Fix** |

---

## 20. Dependency Elimination Through Event Ownership

### Flawed:
```typescript
useEffect(() => {
  if (submitted) {
    sendOrder(order);
  }
}, [submitted, order]);
```

### Refactored to Event Handler:
```typescript
function handleSubmit() {
  sendOrder(order);
}
```
No Effect dependency required.

---

## 21. Dependency Elimination Through Render Derivation

### Flawed:
```typescript
const [fullName, setFullName] = useState("");

useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);
```

### Refactored to Pure Render Calculation:
```typescript
const fullName = `${firstName} ${lastName}`;
```

---

## 22. Dependency Elimination Through Component Structure

```text
Parent
  ├── ConnectionManager   (owns WebSocket synchronization)
  ├── TitleSynchronizer   (owns document.title)
  ├── AnalyticsBoundary   (owns analytics tracking)
  └── ThemeSynchronizer   (owns theme DOM manipulation)
```

Component boundaries create isolated synchronization lifecycles.

---

## 23. Stable Identity Has a Cost

`useMemo` and `useCallback` introduce:
- Hook state overhead
- Extra dependency array maintenance
- Cognitive load

> Ask: *"Does preserving this identity provide meaningful correctness or performance value?"*

---

## 24. `useCallback` Dependency Chains

```typescript
const save = useCallback(
  (data) => api.save(userId, data),
  [userId]
);

useEffect(() => {
  subscribe(save);
  return () => unsubscribe(save);
}, [save]);
```

Graph: `userId → save identity → Effect → subscription`. Changing `userId` produces a new `save` reference $\rightarrow$ cleans up old subscription $\rightarrow$ sets up new subscription. **This is completely correct.**

---

## 25. Dependency Graphs Can Be Composed

```text
userId ──► useCallback ──► save ──► useEffect ──► subscription
```
Each edge is explicit and traceable.

---

## 26. Production Anti-Pattern — Memoization Patch

### Flawed Reasoning:
```typescript
const config = useMemo(() => ({ roomId }), [roomId]);

useEffect(() => {
  connect(config);
}, [config]);
```
*Developer says:* "Fixed. No more reruns."

### Senior Critique:
1. Why was `config` outside the Effect?
2. Does connection depend on the object reference or just `roomId`?
3. `useEffect(..., [roomId])` with inline `config` is simpler and eliminates a hook.

---

# Layer 3 — 🧪 Diagnostic Labs & DevTools Profiling

## 27. Lab A — Compare Three Designs

- **Version A (Inline Unstable Object):** `const config = { roomId }; useEffect(..., [config]);`
- **Version B (Memoized Object):** `const config = useMemo(() => ({ roomId }), [roomId]); useEffect(..., [config]);`
- **Version C (Normalized Primitive):** `useEffect(() => { const config = { roomId }; ... }, [roomId]);`

Observe: Version C provides the cleanest architecture without intermediate hook state.

---

## 28. Lab B — Effect Invalidation Matrix

| Reactive Change | WebSocket Connection | Document Title | Analytics | Theme |
| :--- | :---: | :---: | :---: | :---: |
| `roomId` changes | **Re-sync** | No-op | No-op | No-op |
| `title` changes | No-op | **Re-sync** | No-op | No-op |
| `userId` changes | No-op | No-op | **Re-sync** | No-op |
| `theme` changes | No-op | No-op | No-op | **Re-sync** |

Combining them into one Effect causes all 4 columns to re-sync on any single change!

---

## 29. Lab C — Identity Trace

```typescript
const previousConfig = useRef();
const previousHandler = useRef();

useEffect(() => {
  console.table({
    sameConfig: previousConfig.current === config,
    sameHandler: previousHandler.current === handler,
  });
  previousConfig.current = config;
  previousHandler.current = handler;
});
```

---

## 30. Lab D — React Profiler

1. Profile an unrelated state update while an Effect owns an expensive external resource.
2. **Before Refactoring:** `render → dependency identity changes → cleanup → setup`.
3. **After Refactoring:** `render → relevant dependency unchanged → synchronization preserved`.

---

# Layer 4 — 🔥 The Crucible

### 31. Challenge — Identify the Correct Refactoring
```typescript
function Search({ query }) {
  const config = { query, mode: "fuzzy" };

  useEffect(() => {
    search(config);
  }, [config]);

  return null;
}
```
- **Refactoring:** Move `config` inside the Effect: `useEffect(() => { const config = { query, mode: "fuzzy" }; search(config); }, [query]);`.

---

### 32. Challenge — Split the Effect
```typescript
useEffect(() => {
  connect(roomId);
  document.title = title;
  analytics.identify(userId);
}, [roomId, title, userId]);
```
- **Refactoring:** Split into 3 independent Effects based on resource invalidation boundaries.

---

### 33. Challenge — `useCallback` or Refactor?
```typescript
function App({ userId }) {
  const save = data => api.save(userId, data);

  useEffect(() => {
    subscribe(save);
    return () => unsubscribe(save);
  }, [save]);
}
```
- **Evaluation:** Move `save` directly inside the Effect: `useEffect(() => { const save = data => api.save(userId, data); subscribe(save); return () => unsubscribe(save); }, [userId]);`.

---

### 34. Challenge — Event or Effect?
```typescript
const [shouldSend, setShouldSend] = useState(false);

useEffect(() => {
  if (shouldSend) {
    sendEmail();
    setShouldSend(false);
  }
}, [shouldSend]);
```
- **Smell:** Event-as-State. Move `sendEmail()` directly into the `onClick` event handler.

---

## 35. Production Incident Runbook

### Incident: Expensive connection reconnects whenever a local counter increments.

1. **Step 1:** Inspect the Effect and list declared dependencies.
2. **Step 2:** Identify reference identity changes (`Object.is`).
3. **Step 3:** Determine which dependency changed because of the counter render.
4. **Step 4:** Check if that dependency is semantically required.
5. **Step 5:** Move object/function creation inside the Effect boundary.
6. **Step 6:** Profile with React DevTools to verify zero reconnects on counter clicks.
7. **Step 7:** Verify genuine `roomId` changes still reconnect cleanly.

---

## 36. Senior Decision Matrix

| Problem | First Move | What to Avoid |
| :--- | :--- | :--- |
| **Derived object causes reruns** | Move derivation into Effect | Blind `useMemo` |
| **Helper function causes reruns** | Move helper into Effect | Blind `useCallback` |
| **Event command is Effect-driven** | Move command into handler | Extra state flags (`submitted`) |
| **Derived render data uses Effect** | Calculate during render | Redundant `useEffect` + `setState` |
| **Unrelated systems share Effect** | Split Effects | Giant monolithic Effects |
| **Identity itself matters** | Stabilize identity | Arbitrary memoization |
| **Mutable latest coordination needed** | Evaluate `useRef` | Hiding reactive state |
| **Dependency is genuinely required** | Keep it | Removing it (`[]`) |
| **Dependency warning appears** | Re-evaluate architecture | Disabling ESLint rule |

---

## 37. Senior-Level Traps

1. **"Fewer dependencies means better React."** $\rightarrow$ *False:* Correct dependency relationships matter more than dependency count.
2. **"Every unstable object should be memoized."** $\rightarrow$ *False:* Move the object inside the Effect.
3. **"Every function dependency needs `useCallback`."** $\rightarrow$ *False:* Move the helper function inside the Effect.
4. **"One component should have one Effect."** $\rightarrow$ *False:* Multiple synchronization relationships deserve separate Effects.
5. **"Split every Effect into tiny Effects."** $\rightarrow$ *False:* Split only along true resource and invalidation boundaries.
6. **"Removing a dependency fixes reruns."** $\rightarrow$ *Dangerous:* Causes stale synchronization bugs.

---

## 38. Completion Checklist

You should be able to:
- [ ] Explain dependency refactoring.
- [ ] Distinguish incorrect dependencies from unstable dependencies.
- [ ] Distinguish dependency problems from synchronization-boundary problems.
- [ ] Explain dependency normalization.
- [ ] Move derived configuration inside Effects when appropriate.
- [ ] Move helper functions inside Effects when appropriate.
- [ ] Explain when `useCallback` is semantically justified.
- [ ] Explain when `useMemo` is semantically justified.
- [ ] Split unrelated synchronization systems.
- [ ] Explain resource-boundary-based Effect decomposition.
- [ ] Explain invalidation semantics.
- [ ] Explain dependency surface area.
- [ ] Explain why dependency count is not a quality metric.
- [ ] Distinguish dependency elimination from dependency removal.
- [ ] Move event commands back into event handlers when appropriate.
- [ ] Remove unnecessary Effect-driven derived state.
- [ ] Use component boundaries when ownership genuinely differs.
- [ ] Trace dependency chains through memoized callbacks.
- [ ] Diagnose unnecessary synchronization churn.
- [ ] Diagnose memoization patches.
- [ ] Diagnose giant Effects.
- [ ] Predict Effect invalidation across renders.
- [ ] Profile synchronization churn with React DevTools.
- [ ] Verify that refactoring preserves legitimate synchronization.
- [ ] Verify cleanup/setup semantics after refactoring.
- [ ] Explain every dependency in an unfamiliar Effect.
- [ ] Complete the companion lab.
- [ ] Solve the Crucible challenges without executing the code first.

---

# 39. Final Mental Model

```text
       RENDER
         │
         ▼
   reactive values
         │
         ▼
synchronization design
         │
   ┌─────┴─────┐
   │           │
dependency  resource
  graph     boundary
   │           │
   └─────┬─────┘
         │
         ▼
       EFFECT
         │
   ┌─────┴─────┐
   │           │
cleanup      setup
   │           │
   └─────┬─────┘
         │
         ▼
  external system
```

The core engineering question:
> **"What specific event or state transition should cause this synchronization to become obsolete?"**

---

### Final Senior Rule

> **Do not optimize an Effect until you understand its invalidation semantics. Refactor the synchronization boundary first; stabilize identity only when identity itself has semantic or performance value.**

---

[⬅️ Previous Part](06-effect-dependencies-and-stable-identities.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](examples/07-effect-dependency-refactoring.html) | [Next Part ➡️](08-effect-cleanup-resource-ownership.md)
