# Level 06 — React Fundamentals
## KPI 06 / KPI 09 — Effects & Synchronization
### PART 06 — Dependency Correctness, Stable Identity & Stale Closures

[⬅️ Previous Part](05-effects-vs-events-and-derived-data.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](examples/06-dependency-correctness-stable-identity-stale-closures.html) | [Next Part ➡️](07-effect-dependency-refactoring.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

# Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

## 1. The Core Problem

An Effect reads values from a particular render snapshot. Those values belong to that render's JavaScript closure.

Therefore:
> **If an Effect's synchronization logic reads a reactive value, that value participates in the Effect's dependency relationship.**

The dependency array is not fundamentally a timer configuration. It describes:
> **Which reactive values this synchronization depends upon.**

### The Central Mental Model:
```text
COMPONENT RENDER #N
        │
   ┌────┼────┐
   │    │    │
 props state local values
   │    │    │
   └────┼────┘
        │
  Effect closure
        │
  reads reactive values
        │
        ▼
dependency relationship
        │
   ┌────┴────┐
   │         │
 same     changed
 deps    dependency
   │         │
   ▼         ▼
  keep    cleanup old synchronization
  sync       │
             ▼
          setup new synchronization
```

---

## 2. Reactive Values

For this level, treat values created or received during rendering as potentially reactive:
```typescript
function ChatRoom({ roomId }: { roomId: string }) {
  const [connected, setConnected] = useState(false);
  const options = { roomId };

  useEffect(() => {
    connect(options);
  }, [options]);
}
```

`roomId`, `connected`, and `options` have direct relationships to the render snapshot.

The important issue is not merely whether the value is a primitive. The essential question is:
> **Can this value change between renders and therefore change what synchronization the Effect should establish?**

---

## 3. Identity Matters

React does not deep-compare arbitrary dependency objects. Dependency entries are compared using **`Object.is` semantics**:

```javascript
Object.is(1, 1);                  // true
Object.is("chat", "chat");        // true
Object.is({}, {});                // false!
Object.is(() => {}, () => {});    // false!
```

Consequently:
```typescript
const options = { roomId };
```
creates a brand new object during each render. Even if `options.roomId === previousOptions.roomId`, the object itself is not the same object in memory.

Therefore:
```typescript
useEffect(() => {
  connect(options);
}, [options]);
```
can re-synchronize whenever the component renders and creates a new `options` object reference.

---

## 4. Stale Closure

A **stale closure** occurs when an Effect continues operating with values captured from an older render when the intended synchronization should reflect newer reactive values.

### Example:
```typescript
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log(count);
  }, []); // ❌ Captures count = 0 forever

  return (
    <button onClick={() => setCount(c => c + 1)}>
      {count}
    </button>
  );
}
```

The Effect's callback closes over the value from the render in which that Effect was created. Removing a dependency does not make the value non-reactive; it merely prevents the Effect from being resynchronized when that value changes.

---

## 5. The Three Questions Senior Engineers Ask

Before writing `useEffect(..., [...])`, ask:

1. **Question 1:** What external synchronization does this Effect establish?
2. **Question 2:** Which values determine that synchronization?
3. **Question 3:** Which of those values can change between renders?

Then encode that exact relationship.

---

## 6. Dependency Graph Mental Model

Think of an Effect as a node in a reactive dependency graph:

```text
roomId ──────────────┐
                     │
serverUrl ───────────┼──► Effect ───► connection
                     │
authToken ───────────┘
```

If `roomId` changes, the synchronization may need to change:
```text
roomId changes
      ↓
Effect invalidated
      ↓
cleanup previous connection
      ↓
establish connection for new roomId
```

This is much more accurate than saying *"Run this Effect when `roomId` changes"*. The latter describes observed behavior; the former explains the underlying causal architecture.

---

### Executive Concept Table

| Concept | Core Mechanism | Production Impact | Common Senior Trap |
| :--- | :--- | :--- | :--- |
| **Reactive value** | Value whose change can affect rendered/synchronized behavior | Determines synchronization boundaries | Treating only state as reactive |
| **Dependency** | Reactive input to Effect synchronization | Determines when synchronization must be reconsidered | Treating dependency array as timer |
| **`Object.is`** | Identity/value comparison for dependency entries | Unstable objects/functions can cause resynchronization | Assuming deep equality |
| **Stable identity** | Same object/function identity across renders | Prevents unnecessary synchronization | Using memoization mechanically |
| **Closure** | Effect callback captures render values | Determines what code observes | Assuming callback reads "current" state automatically |
| **Stale closure** | Callback observes outdated render value | Can produce incorrect subscriptions/timers/async behavior | Hiding the dependency |
| **Missing dependency** | Effect omits a reactive value it reads | Synchronization can become outdated | Suppressing lint instead of fixing design |
| **Unstable dependency** | Dependency identity changes frequently | Causes unnecessary cleanup/setup | Blaming React for reruns |
| **Ref** | Mutable non-rendering container | Useful for coordination/state not requiring render | Using refs to conceal reactive dependencies |
| **Dependency normalization** | Refactoring code to make relationships explicit | Improves correctness and diagnosability | Treating dependency removal as optimization |

---

### Golden Rule

> **Do not choose dependencies based on how often you want an Effect to run. Choose them based on which reactive values the synchronization actually depends upon.**

---

# Layer 2 — 🔬 Deep Mechanical Breakdown

## 7. Render Snapshot $\rightarrow$ Effect Closure

Consider:
```typescript
function Dashboard({ userId }: { userId: string }) {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    subscribe(userId, theme);
  }, [userId, theme]);

  return <Panel theme={theme} />;
}
```

There is no single timeless `userId` or `theme` inside the component. Each render creates a new execution context:

```text
Render #1 ─────────
userId = "u1"
theme  = "dark"
Effect closure #1 captures: { userId: "u1", theme: "dark" }

Render #2 ─────────
userId = "u1"
theme  = "light"
Effect closure #2 captures: { userId: "u1", theme: "light" }
```

The closures are different JavaScript function instances associated with distinct render snapshots.

---

## 8. Why Missing Dependencies Are Dangerous

Suppose:
```typescript
useEffect(() => {
  subscribe(userId, theme);
}, [userId]); // ❌ Missing theme
```

The Effect reads `userId` and `theme`, but only declares `userId`. The synchronization relationship is incomplete.

```text
Render #1: userId = u1, theme = dark  ──► Effect subscribe(u1, dark)

[User switches theme]

Render #2: userId = u1, theme = light ──► Effect does NOT re-run!
```

The component now renders with `theme = light`, but the existing external subscription still represents `theme = dark`. The UI and external synchronization have diverged.

---

## 9. Render-by-Render Prediction Challenge #1

```tsx
function Panel({ userId }) {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    console.log("subscribe", userId, theme);
  }, [userId]);

  return (
    <button onClick={() => setTheme("light")}>
      {theme}
    </button>
  );
}
```

### Trace:
- **Render #1:** `userId = "A"`, `theme = "dark"`. Effect logs: `"subscribe A dark"`.
- **User clicks button $\rightarrow$ Render #2:** `userId = "A"`, `theme = "light"`.
- **Question:** Does the Effect execute again?
- **Answer:** **No**, because the declared dependency `userId` did not change (`Object.is("A", "A") === true`).
- **Consequence:** The external system is left with obsolete `theme = "dark"` state. This is the mechanical anatomy of a stale dependency bug.

---

## 10. Dependency Arrays Are Not "Run Conditions"

A common explanation is:
```typescript
useEffect(fn, [count]); // "Run fn whenever count changes"
```
That explanation is incomplete. A more useful model is:
```text
Effect synchronization
     │
     ├── reads count
     └── therefore depends on count
```

React compares the dependency relationship across committed renders. The dependency array describes the reactive inputs relevant to that Effect; it is not arbitrary scheduling syntax.

---

## 11. Dependency Comparison

```typescript
const roomId = "room-a";

useEffect(() => {
  connect(roomId);
}, [roomId]);
```

Across renders:
- `Render #1: roomId = "room-a"`
- `Render #2: roomId = "room-a"` $\rightarrow$ `Object.is` evaluates `true`. No dependency change.
- `Render #3: roomId = "room-b"` $\rightarrow$ `Object.is` evaluates `false`.

The dependency changed. The synchronization is transitioned:
```text
cleanup(room-a) ──► setup(room-b)
```

---

## 12. Primitive vs Reference Identity

```javascript
const a = { roomId: "room-a" };
const b = { roomId: "room-a" };

Object.is(a, b);             // false!
a.roomId === b.roomId;       // true
```

The primitive string `"room-a"` compares equal by value across renders. But `{ roomId: "room-a" }` is a new object reference allocated in heap memory every single render.

---

## 13. Unstable Object Dependency

```typescript
function Chat({ roomId }: { roomId: string }) {
  const options = { roomId, reconnect: true };

  useEffect(() => {
    connect(options);
    return () => disconnect(options);
  }, [options]);

  return <ChatView />;
}
```

Suppose unrelated state causes renders #1, #2, #3, #4. Every render creates:
```text
options #1 !== options #2 !== options #3 !== options #4
```
Even if `roomId = "A"` never changed, `Object.is` evaluates `false` every render, causing continuous socket teardown and reconnection thrashing.

---

## 14. Important: The Problem Is Not "Objects Are Bad"

Objects are not inherently problematic. The question is:
> **Does the Effect genuinely depend on the identity of this object, or only on the primitive values inside it?**

If the synchronization only needs `roomId` and `reconnect`:
```typescript
useEffect(() => {
  const options = { roomId, reconnect: true };
  connect(options);

  return () => {
    disconnect(options);
  };
}, [roomId]); // ✅ Primitive dependency
```

Now the temporary object belongs to the synchronization operation itself. Its identity does not become an unnecessary external dependency. This is **dependency normalization**.

---

## 15. Function Identity

Functions behave identically:
```typescript
function Editor({ documentId }: { documentId: string }) {
  function handleUpdate(data) {
    save(documentId, data);
  }

  useEffect(() => {
    subscribe(handleUpdate);
    return () => unsubscribe(handleUpdate);
  }, [handleUpdate]); // ❌ New function identity every render

  return <EditorView />;
}
```

Every render executes `function handleUpdate()`, creating a new function reference:
```text
new function identity ──► dependency changed ──► cleanup ──► setup
```

---

## 16. Why `useCallback` Is Not the First Answer

A common reaction is: *"Just wrap it in `useCallback`."*

That may sometimes be appropriate, but first ask:
> **Why does the Effect need this function as a dependency?**

Often the better architecture is to move the function into the Effect:
```typescript
useEffect(() => {
  function handleUpdate(data) {
    save(documentId, data);
  }

  subscribe(handleUpdate);

  return () => {
    unsubscribe(handleUpdate);
  };
}, [documentId]); // ✅ Depend directly on documentId
```

Now: `documentId → Effect → subscription callback`. The function exists inside the synchronization boundary.

---

## 17. `useCallback` as an Identity Tool

When a function genuinely needs stable identity across renders (e.g. passed to child components or external subscribers), `useCallback` is useful:
```typescript
const handleUpdate = useCallback(
  (data) => {
    save(documentId, data);
  },
  [documentId]
);
```

- `documentId` unchanged $\rightarrow$ callback identity remains stable.
- `documentId` changes $\rightarrow$ callback receives new identity reflecting updated closure.

---

## 18. `useMemo` Has the Same Architectural Question

```typescript
const options = useMemo(
  () => ({ roomId, reconnect: true }),
  [roomId]
);
```

Do not ask *"How can I make React stop rerunning my Effect?"*. Ask:
> **"Does this object represent a meaningful stable entity whose identity should persist until `roomId` changes?"**

If yes, stable identity is semantically useful. If no, restructuring the Effect directly around primitives is clearer.

---

## 19. Dependency Optimization vs Dependency Correctness

| Aspect | Definition | Priority |
| :--- | :--- | :---: |
| **Correctness** | Does the Effect synchronize with all reactive values that determine it? | **#1 (Non-negotiable)** |
| **Optimization** | Can unnecessary synchronization be avoided without changing semantics? | **#2 (Secondary)** |

**Correctness comes first.** Do not deliberately omit a dependency because *"the Effect runs too often"*. First determine whether the Effect itself is badly structured.

---

## 20. The "Remove the Dependency" Anti-Pattern

### Bad:
```typescript
useEffect(() => {
  connect(options);
}, []); // ❌ Lying to React
```

This conceals the relationship instead of solving it:
```text
UI: roomId = B  |  Connection: roomId = A
```
The component appears visually updated while its external connection remains silently stuck on obsolete information.

---

## 21. The "Disable the Linter" Anti-Pattern

A dependency lint warning is an architectural signal, not annoying noise.

### Bad Response:
```javascript
// eslint-disable-next-line react-hooks/exhaustive-deps
```

### Senior Response:
1. *Why does this value participate in the Effect?*
2. *Should it?*
3. *If yes: declare it.*
4. *If no: restructure the code so the Effect no longer reads it.*
5. *If the value must remain mutable but non-reactive: determine whether a ref is semantically appropriate.*

---

## 22. Refs: Reactive vs Non-Reactive Data

A ref provides mutable storage whose updates do not themselves trigger a render:
```typescript
const latestValue = useRef(value);

useEffect(() => {
  latestValue.current = value;
}, [value]);
```

Another callback can read `latestValue.current` without requiring the callback itself to be recreated for every value change.

> **Crucial Distinction:** A ref is an architectural escape hatch for imperative coordination, not a cheat code to silence dependency arrays.

Ask:
> **Should changing this value cause React to re-render or re-synchronize this relationship?**
- If **YES** $\rightarrow$ use reactive state/props.
- If **NO** $\rightarrow$ a ref may be appropriate.

---

## 23. Render Snapshot vs Mutable Ref

- **State:** `const [count, setCount] = useState(0);`
  - Has *render-snapshot semantics*. A render observes `count = N` immutably.
- **Ref:** `const countRef = useRef(0);`
  - Has *mutable-container semantics*. Operations mutate `countRef.current` without producing renders.

```text
state ──► render-visible reactive value
ref   ──► mutable coordination container
```

---

## 24. Stale Closure vs Stale Ref

- **Stale Closure:** Callback captured value from Render #1 $\rightarrow$ Later execution still reads Render #1 value.
- **Ref-based Latest Value:** Callback $\rightarrow$ reads `latestValue.current` $\rightarrow$ reads mutable current value directly.

---

## 25. Prediction Challenge #2 — Closure Identity

```typescript
function Timer({ count }) {
  useEffect(() => {
    const id = setInterval(() => {
      console.log(count);
    }, 1000);

    return () => clearInterval(id);
  }, []); // ❌ Captures count = 0
}
```

- **Render #1:** `count = 0`. Interval callback closes over `count = 0`.
- **Render #2:** `count = 1`. Component render sees `count = 1`.
- **Output:** Interval continues logging `0, 0, 0...`. Classic stale closure.

---

## 26. Prediction Challenge #3 — Unstable Dependency

```tsx
function App() {
  const [count, setCount] = useState(0);
  const config = { enabled: true };

  useEffect(() => {
    console.log("sync");
  }, [config]);

  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
}
```

- `Render #1: config = Object #1`
- `Render #2: config = Object #2`
- `Object #1 !== Object #2` $\rightarrow$ Effect re-synchronizes on every click despite `config.enabled === true`.

---

## 27. Dependency Normalization

### Before:
```typescript
const config = { roomId, enabled: true };

useEffect(() => {
  connect(config);
}, [config]);
```

### After:
```typescript
useEffect(() => {
  const config = { roomId, enabled: true };
  connect(config);

  return () => disconnect(config);
}, [roomId]);
```

---

## 28. Derived Values and Dependency Chains

```typescript
const fullName = `${firstName} ${lastName}`;

useEffect(() => {
  analytics.identify(fullName);
}, [fullName]);
```

Graph: `firstName, lastName → fullName → Effect`. Both `[fullName]` and `[firstName, lastName]` are mechanically valid as long as the dependency graph is complete and consistent.

---

## 29. Dependency Graphs Reveal Hidden Architecture

```typescript
useEffect(() => {
  connect(serverUrl, roomId, userId, theme, locale);
}, [serverUrl, roomId, userId, theme, locale]);
```

A large dependency set is an architectural signal. It often indicates that one Effect is overloaded with multiple independent responsibilities.

---

## 30. Dependency Explosion

```typescript
useEffect(() => {
  connect(serverUrl, roomId);
  analytics.track(userId);
  document.title = title;
  syncTheme(theme);
}, [serverUrl, roomId, userId, title, theme]);
```

Changing `title` causes the WebSocket connection to disconnect and reconnect!

**Fix:** Separate into 4 distinct Effects with individual lifecycles.

---

## 31. One Effect $\neq$ One Component

```text
Component
   ├── Effect A ──► WebSocket connection (depends on serverUrl, roomId)
   ├── Effect B ──► document.title (depends on title)
   └── Effect C ──► theme synchronization (depends on theme)
```
The correct unit is **one synchronization relationship**, not one Effect per component.

---

## 32. Production Anti-Pattern Teardown: "Make the Effect Run Once"

### Flawed:
```typescript
useEffect(() => {
  connect(roomId);
}, []); // ❌ Assumes [] means "once"
```

### Senior Refactoring:
```typescript
useEffect(() => {
  const connection = connect(roomId);
  return () => {
    connection.disconnect();
  };
}, [roomId]); // ✅ Synchronizes with actual roomId input
```

---

## 33. Production Anti-Pattern Teardown: Memoize Everything

### Flawed:
```typescript
const options = useMemo(() => ({ roomId }), [roomId]);
const handler = useCallback(data => save(roomId, data), [roomId]);

useEffect(() => {
  connect(options, handler);
}, [options, handler]);
```

### Senior Refactoring:
```typescript
useEffect(() => {
  const options = { roomId };
  const handler = (data) => save(roomId, data);

  connect(options, handler);

  return () => {
    disconnect(options, handler);
  };
}, [roomId]); // ✅ Simpler graph without unnecessary hook overhead
```

---

## 34. Production Anti-Pattern Teardown: Ref as Dependency Escape Hatch

```typescript
const valueRef = useRef(value);
valueRef.current = value;

useEffect(() => {
  subscribe(() => {
    use(valueRef.current);
  });
}, []);
```

Ask:
1. *Does subscription configuration depend on `value`?*
2. *Should subscription restart when `value` changes?*
3. *Or should the same subscription observe the latest value?*

---

## 35. Engineering Decision Matrix

| Situation | Preferred Approach |
| :--- | :--- |
| **Effect genuinely depends on primitive** | Declare it |
| **Effect depends on changing object fields** | Construct object inside Effect |
| **Effect depends on function created during render** | Move function inside Effect |
| **Stable function identity is itself meaningful** | Use `useCallback` |
| **Stable object identity is meaningful** | Use `useMemo` |
| **Mutable latest value should not trigger render** | Use `useRef` |
| **Dependency warning appears** | Investigate relationship |
| **Effect has huge dependency set** | Decompose synchronization boundaries |
| **Dependency intentionally omitted** | Require explicit semantic justification |
| **Derived value has no external synchronization** | Calculate during render |
| **User action triggers command** | Prefer event handler |
| **External system must synchronize** | Effect is appropriate |

---

# Layer 3 — 🧪 Diagnostic Labs & DevTools Profiling

## 36. Lab A — Dependency Identity Probe

```tsx
function Probe() {
  const [count, setCount] = useState(0);
  const objectValue = { enabled: true };
  const primitiveValue = true;

  useEffect(() => {
    console.table({ effect: "object", count, objectValue });
  }, [objectValue]);

  useEffect(() => {
    console.table({ effect: "primitive", count, primitiveValue });
  }, [primitiveValue]);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      {count}
    </button>
  );
}
```

Observe that `objectValue` receives a new reference identity each render, re-running its Effect on every click.

---

## 37. Lab B — Render Identity Probe

```typescript
const previous = useRef();

useEffect(() => {
  console.table({ sameObject: previous.current === objectValue });
  previous.current = objectValue;
});
```

---

## 38. Lab C — Stale Closure Probe

```tsx
function Probe() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      console.log("interval count:", count);
    }, 1000);

    return () => clearInterval(id);
  }, []);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      {count}
    </button>
  );
}
```

Observe UI count updating $0 \rightarrow 1 \rightarrow 2 \rightarrow 3$ while the interval closure continues logging `0, 0, 0, 0`.

---

## 39. Lab D — React DevTools

1. Open React DevTools $\rightarrow$ Profiler.
2. Start profiling.
3. Trigger interaction.
4. Stop profiling.
5. Correlate: `dependency change → render → Effect synchronization`.

---

## 40. Lab E — Console Identity Diagnostics

```javascript
console.log({ objectValue, identity: objectValue });
console.log(previousObject === objectValue);
console.log(previousHandler === handler);
console.table({ roomId, userId, theme });
```

---

## 41. Production Diagnostic Workflow

```text
1. Identify the Effect.
   ↓
2. Identify all dependencies.
   ↓
3. Determine which dependency changed.
   ↓
4. Inspect reference identity.
   ↓
5. Determine why it changed.
   ↓
6. Ask whether the synchronization actually needs to restart.
   ↓
7. Refactor the synchronization boundary if needed.
```

---

# Layer 4 — 🔥 The Crucible

### 42. Prediction Challenge #1
```tsx
function App() {
  const [count, setCount] = useState(0);
  const options = { enabled: true };

  useEffect(() => {
    console.log("effect");
  }, [options]);

  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```
- **Prediction:** Clicking button triggers render $\rightarrow$ new `options` object allocated $\rightarrow$ `Object.is` fails $\rightarrow$ Effect logs `"effect"` on every single click.

---

### 43. Prediction Challenge #2
```typescript
function App({ roomId }: { roomId: string }) {
  useEffect(() => {
    console.log("connect", roomId);
  }, []);
}
```
- **Prediction:** When `roomId` changes $A \rightarrow B \rightarrow C$, Effect never re-runs because `[]` declares no dependencies. External system remains stuck on room $A$.

---

### 44. Prediction Challenge #3
```typescript
function App({ value }: { value: number }) {
  useEffect(() => {
    const timer = setInterval(() => {
      console.log(value);
    }, 1000);
    return () => clearInterval(timer);
  }, []);
}
```
- **Prediction:** Value updates $10 \rightarrow 20 \rightarrow 30$. The interval callback logs `10` forever because its closure captured `value = 10` on initial mount.

---

### 45. Prediction Challenge #4
```typescript
function App({ roomId }: { roomId: string }) {
  const options = useMemo(() => ({ roomId }), [roomId]);

  useEffect(() => {
    connect(options);
  }, [options]);
}
```
- `roomId = A` (Render 1) $\rightarrow$ connects options $A$.
- `roomId = A` (Render 2) $\rightarrow$ `useMemo` preserves object identity $\rightarrow$ no Effect re-run.
- `roomId = B` (Render 3) $\rightarrow$ `useMemo` produces new object $\rightarrow$ Effect re-synchronizes with room $B$.

---

### 46. Prediction Challenge #5
```typescript
useEffect(() => {
  connect(serverUrl, roomId);
  analytics.identify(userId);
  document.title = title;
}, [serverUrl, roomId, userId, title]);
```
- **Problem:** When `title` updates, `connect()` re-runs unnecessarily.
- **Remediation:** Decompose into 3 separate Effects.

---

## 47. Production Incident — Duplicate Connections

- **Symptom:** Users report duplicate WebSocket messages.
- **Root Cause:** `options` object literal created in render $\rightarrow$ dependency changed every render $\rightarrow$ continuous socket churn.
- **Remediation:** Move `options` inside the Effect and depend directly on `roomId`.

---

## 48. Production Incident — UI Correct, Subscription Wrong

- **Symptom:** UI displays Room B, but messages arrive from Room A.
- **Likely Cause:** Missing `roomId` in dependency array $\rightarrow$ Stale closure.

---

## 49. Production Incident — "Fix" Creates Infinite Reruns

```typescript
const config = { mode, enabled: true };

useEffect(() => {
  doSomething(config);
}, [config]); // ❌ Infinite render loop if doSomething updates state
```

---

## 50. Senior Interview Gotchas

1. **"The dependency array tells React when to run the Effect."** $\rightarrow$ *Better:* It declares the reactive inputs the synchronization depends upon.
2. **"Objects don't work as dependencies."** $\rightarrow$ *False:* They work, but compare via reference equality (`Object.is`).
3. **"useMemo fixes dependency problems."** $\rightarrow$ *False:* It stabilizes identity; it doesn't fix a broken synchronization boundary.
4. **"useRef fixes stale closures."** $\rightarrow$ *Too broad:* Refs provide mutable latest values, but can break reactivity if misused.
5. **"Just remove the dependency."** $\rightarrow$ *Dangerous:* Hides dependencies and creates stale closures.
6. **"If the UI is correct, the Effect is correct."** $\rightarrow$ *False:* External systems can remain synchronized with obsolete state.

---

## 51. Senior Architecture Checklist

Before approving an Effect, verify:
- [ ] The external system is explicitly identified.
- [ ] The synchronization relationship is clearly stated.
- [ ] Every reactive value used by the synchronization is accounted for.
- [ ] Dependency identity semantics are understood.
- [ ] Objects are not accidentally unstable dependencies.
- [ ] Functions are not accidentally unstable dependencies.
- [ ] Missing dependencies are not hidden.
- [ ] Lint warnings are investigated rather than blindly suppressed.
- [ ] `useMemo` is used only when stable identity has architectural value.
- [ ] `useCallback` is used only when function identity matters.
- [ ] Refs are not being used to conceal render-visible state.
- [ ] Stale closures are explicitly considered.
- [ ] Cleanup corresponds to the exact synchronization resource.
- [ ] Multiple unrelated synchronization systems are not unnecessarily coupled.
- [ ] Dependency changes have an understandable synchronization consequence.
- [ ] Unrelated renders do not unnecessarily restart expensive synchronization.
- [ ] The Effect does not secretly implement ordinary derived data.
- [ ] User commands remain in event handlers when appropriate.
- [ ] The external system remains authoritative where appropriate.

---

## 52. Final Mental Model

```text
RENDER
  │
┌─┴─────────┐
│           │
props     state    locals
│           │        │
└─┬─────────┘        │
  │                  │
  ▼                  ▼
Effect closure ──► reactive dependencies
                         │
                  ┌──────┴──────┐
                  │             │
                same         changed
                  │             │
                  │             ▼
                  │        cleanup old
                  │             │
                  │             ▼
                  │         setup new
                  │             │
                  └──────┬──────┘
                         │
                         ▼
                external synchronization
```

$$\text{Effect Correctness} = \text{Sync Boundary} + \text{Reactive Inputs} + \text{Identity Semantics} + \text{Closure Semantics} + \text{Cleanup}$$

---

# 53. Graduation Standard

You are finished when you can inspect an unfamiliar Effect and explain:
1. What external system it synchronizes.
2. Which render values its closure captures.
3. Which values are reactive.
4. Why each dependency exists.
5. Why each dependency has its current identity.
6. Which renders cause resynchronization.
7. Which renders do not.
8. Whether any stale closure can occur.
9. Whether an object/function dependency is accidentally unstable.
10. Whether `useMemo` or `useCallback` would actually improve architecture.
11. Whether a ref represents legitimate non-reactive coordination.
12. Whether the Effect should be decomposed into separate synchronization relationships.
13. What cleanup releases.
14. What happens when props/state change.
15. What happens when the component unmounts.

> **Final Rule:** Never manipulate the dependency array to force the Effect into the lifecycle you want. Design the synchronization relationship correctly, then let the dependency model describe that relationship.

---

[⬅️ Previous Part](05-effects-vs-events-and-derived-data.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](examples/06-dependency-correctness-stable-identity-stale-closures.html) | [Next Part ➡️](07-effect-dependency-refactoring.md)
