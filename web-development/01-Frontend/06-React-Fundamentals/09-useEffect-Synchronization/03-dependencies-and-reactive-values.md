# Level 06 — React Fundamentals
## KPI 06 / KPI 09 — Effects & Synchronization
### PART 03 — Dependencies & Reactive Values

[⬅️ Previous Part](02-effect-lifecycle-and-synchronization.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](examples/03-effect-dependencies-reactive-values.html) | [Next Part ➡️](04-effect-synchronization-patterns.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

# ⚡ LAYER 1 — 30-SECOND EXECUTIVE CHEAT SHEET & CORE MENTAL MODELS

## 1. The Fundamental Problem

An Effect synchronizes React with something outside React. The moment the Effect reads values produced by the component, a dependency relationship exists.

```text
React Render
     │
┌────┴────────────────────────┐
│                             │
props       state        local values
│                             │
└────┬────────────────────────┘
     │
     ▼
Effect closure
     │
     ▼
External synchronization
```

The dependency array tells React:
> *"These are the reactive values whose changes mean this synchronization may need to be re-established."*

It does not fundamentally mean:
> *"Run my code on these occasions."*

That distinction is one of the most important Effect concepts in React.

---

## 2. The Dependency Graph Mental Model

Consider:
```typescript
function ChatRoom({ roomId }: { roomId: string }) {
  const [serverUrl, setServerUrl] = useState("https://api.example.com");

  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.connect();

    return () => {
      connection.disconnect();
    };
  }, [serverUrl, roomId]);

  return <Chat />;
}
```

The Effect depends on:
```text
serverUrl ─────┐
               ├──► Effect synchronization
roomId ────────┘
```

If either changes:
```text
old synchronization
        │
        ▼
     cleanup
        │
        ▼
new synchronization
        │
        ▼
      setup
```

Therefore:
```text
Dependency changes
        ↓
Previous synchronization no longer represents current inputs
        ↓
Cleanup previous synchronization
        ↓
Establish synchronization using new inputs
```

---

## 3. Executive Concept Table

| Concept | Core Mechanism | Production Impact | Common Senior Trap |
| :--- | :--- | :--- | :--- |
| **Reactive value** | Value that can change between renders and is read by component code | Effect may need re-synchronization | Treating only state as reactive |
| **Dependency** | Reactive value required by Effect | Determines synchronization validity | Thinking dependencies are arbitrary triggers |
| **Dependency array** | Declarative dependency specification | Controls when synchronization is reconsidered | Using it as a performance switch |
| **`Object.is` comparison** | React compares dependency entries using `Object.is` semantics | Identity changes can cause re-synchronization | Assuming deep equality |
| **Function dependency** | Function created/recreated during render | Can cause Effect re-synchronization | Removing it instead of fixing design |
| **Object dependency** | Object identity can change each render | Can cause repeated setup/cleanup | Assuming equal contents means equal dependency |
| **Missing dependency** | Effect reads a reactive value but doesn't declare it | Stale synchronization / stale closure | *"It doesn't need to rerun"* |
| **Empty dependency array `[]`** | Effect declares no reactive dependencies from component scope | Synchronizes against initial captured values | Treating `[]` as universal "run once" |
| **Derived value** | Value calculated from reactive inputs | Dependency modeling must reflect actual data relationship | Storing unnecessary derived state |
| **Stable value** | Identity/value remains stable across renders | Reduces unnecessary synchronization | Assuming stability without proving it |
| **Dependency optimization** | Reducing unnecessary reactive inputs | Better synchronization behavior | Hiding dependencies rather than restructuring code |

---

## 4. Golden Rule

> **Declare every reactive value that the Effect reads and whose current value is necessary to correctly perform the synchronization.**

Do not remove a dependency merely because its presence causes the Effect to run more often.

Instead ask:
1. *Why does this value change?*
2. *Why does the synchronization depend on it?*
3. *Can the Effect be structurally redesigned so the dependency is no longer necessary?*

That is senior-level dependency reasoning.

---

# 🔬 LAYER 2 — DEEP MECHANICAL BREAKDOWN

## 5. What Is a Reactive Value?

For React Effect reasoning, a useful model is:
> **A reactive value is a value that can change between renders because React may render the component again with different inputs/state.**

Typical reactive values include:
- `props`
- `state`
- values/functions created during rendering

### Example:
```typescript
function UserProfile({ userId }: { userId: string }) {
  const [theme, setTheme] = useState("dark");
  const requestUrl = `/api/users/${userId}`;

  useEffect(() => {
    fetch(requestUrl);
  }, [requestUrl]);

  return <div>...</div>;
}
```

Here:
```text
userId
  │
  ▼
requestUrl
  │
  ▼
Effect
```

`requestUrl` is not state. It is nevertheless derived during rendering and can change when `userId` changes. Therefore it participates in the reactive dependency relationship.

---

## 6. Reactive Does Not Mean "State"

This distinction is critical.

Consider:
```typescript
function Product({ productId }: { productId: string }) {
  useEffect(() => {
    loadProduct(productId);
  }, [productId]);

  return <div>...</div>;
}
```

`productId` is reactive because it comes from props. It is not state.

Likewise:
```typescript
const url = `/products/${productId}`;
```
`url` is a render-created value derived from reactive input.

The conceptual graph is:
```text
productId
  │
  ▼
 url
  │
  ▼
Effect
```

React does not require everything participating in synchronization to be stored in state. In fact, storing derived information in state unnecessarily often makes the architecture worse.

---

## 7. Dependency Arrays Are About Synchronization Dependencies

Consider:
```typescript
useEffect(() => {
  connect(roomId);
}, [roomId]);
```

A weak mental model says:
> *"Run this Effect whenever `roomId` changes."*

That is operationally useful, but incomplete.

The stronger model is:
> **"This synchronization is defined by the current `roomId`."**

Therefore:
```text
roomId = "general"     ──► Synchronization A
roomId = "engineering" ──► Synchronization B
```

The old synchronization is no longer correct. So React needs to transition:
```text
Synchronization A
       │
       ▼
    cleanup
       │
       ▼
Synchronization B
```

The dependency array expresses the relationship.

---

## 8. Dependency Arrays Are Not Arbitrary Event Triggers

Bad mental model:
```typescript
useEffect(() => {
  doSomething();
}, [count]);
```
interpreted as: *"I want `doSomething()` to run whenever `count` changes."*

That may be what the code operationally does, but it invites misuse. A better question is:
> **"What external synchronization does this Effect represent, and does that synchronization depend on `count`?"**

If the answer is no, perhaps the Effect should not exist.

For example:
```typescript
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log(count);
  }, [count]);

  return <div>...</div>;
}
```

If the only purpose is to calculate or display something derived from React state, an Effect may be unnecessary.

The important question is not:
> *"When should this callback execute?"*

but:
> **"What external relationship must remain synchronized?"**

---

## 9. Render Snapshot + Effect Closure

Every render creates its own lexical environment.

Consider:
```typescript
function Example({ userId }: { userId: string }) {
  useEffect(() => {
    console.log(userId);
  }, [userId]);

  return null;
}
```

Imagine:
- **Render #1:** `userId = "A"`  
  The Effect callback created during that render closes over: `userId = "A"`.
- **Render #2:** `userId = "B"`  
  Render #2 creates a new Effect callback whose closure contains: `userId = "B"`.

Conceptually:
```text
Render #1
┌──────────────────────────────┐
│ userId = "A"                 │
│                              │
│ Effect₁ closure ─────────────┼──► "A"
└──────────────────────────────┘

Render #2
┌──────────────────────────────┐
│ userId = "B"                 │
│                              │
│ Effect₂ closure ─────────────┼──► "B"
└──────────────────────────────┘
```

This is why dependency reasoning cannot be separated from JavaScript closure reasoning.
```text
lexical scope
    ↓
closures
    ↓
render snapshots
    ↓
Effect callbacks
    ↓
dependency correctness
```

---

## 10. The Classic Missing Dependency Failure

Consider:
```typescript
function Profile({ userId }: { userId: string }) {
  useEffect(() => {
    loadUser(userId);
  }, []); // ❌ Bug: missing userId

  return <div>...</div>;
}
```

At first glance: Mount $\rightarrow$ load user.

But suppose:
1. **Render #1:** `userId = "A"`. The Effect captures `userId = "A"`.
2. **Render #2:** `userId = "B"`. The component now represents user B.

But the Effect was declared without `userId` as a dependency. The synchronization relationship is now inconsistent:
```text
UI     └── user B
Effect └── user A
```

This is a **stale synchronization problem**.

The correct relationship is:
```typescript
useEffect(() => {
  loadUser(userId);
}, [userId]); // ✅
```

Now:
```text
userId A ────────► Effect synchronization A
userId changes to B
                 ▼
cleanup/transition
                 ▼
userId B ────────► Effect synchronization B
```

---

## 11. Prediction-First Walkthrough #1

### Code:
```typescript
function User({ userId }: { userId: string }) {
  useEffect(() => {
    console.log("Effect:", userId);
  }, [userId]);

  return <div>{userId}</div>;
}
```

Initial props: `userId = "A"`

### Render #1
- Component invocation: `User({ userId: "A" })`
- The render creates: `Effect callback₁`
- Closure: `userId → "A"`
- Dependency snapshot: `["A"]`
- After commit, React evaluates whether synchronization is required.
- Initial synchronization:
  ```text
  Effect₁  ──►  console.log("Effect:", "A")
  ```

### Render #2 — Same Prop
- Parent renders again: `userId = "A"`
- New render creates another callback closure.
- But dependency values are:
  - Previous: `["A"]`
  - Current: `["A"]`
- Comparison:
  ```javascript
  Object.is("A", "A") // true
  ```
- **No dependency change.**
- Therefore the existing synchronization does not need to be replaced merely because a render occurred.

> **Extremely Important:** `Render ≠ Effect re-synchronization`

### Render #3 — Changed Prop
- Now: `userId = "B"`
- Dependencies:
  - Previous: `["A"]`
  - Current: `["B"]`
- Comparison:
  ```javascript
  Object.is("A", "B") // false
  ```
- The synchronization must transition:
  ```text
  Effect using A
        ↓
  cleanup if applicable
        ↓
  Effect using B
  ```

---

## 12. Render ≠ Dependency Change

This distinction should become automatic.

A component can render because:
- state changed
- parent rendered
- context changed
- external update caused React work, etc.

But an Effect with dependencies does not necessarily need to re-synchronize after every render.

### Example:
```typescript
useEffect(() => {
  subscribe(userId);
  return () => unsubscribe(userId);
}, [userId]);
```

Suppose:
- `Render #1 → userId = A`
- `Render #2 → userId = A`
- `Render #3 → userId = A`
- `Render #4 → userId = B`

The dependency sequence is: `A → A → A → B`.
Only the transition `A → B` represents a dependency change.

---

## 13. How React Compares Dependencies

React compares dependency entries using **`Object.is` semantics**:
```javascript
Object.is(previousDependency, nextDependency)
```
for each corresponding dependency position.

```typescript
useEffect(() => { ... }, [value]);
```

If:
- previous value = $X$
- current value = $Y$

React checks `Object.is(X, Y)`. **This is not deep equality.**

---

## 14. Primitive Dependency Example

```typescript
const roomId = "engineering";

useEffect(() => {
  connect(roomId);
}, [roomId]);
```

If the value remains `"engineering"`, then:
```javascript
Object.is("engineering", "engineering") // true
```
No dependency transition occurs.

---

## 15. Object Dependency Example

Consider:
```typescript
function Chat({ roomId }: { roomId: string }) {
  const options = { roomId, reconnect: true };

  useEffect(() => {
    connect(options);
  }, [options]);

  return <div>...</div>;
}
```

This looks reasonable. But `const options = { roomId, reconnect: true };` creates a **new object reference during every render**.

Therefore:
```text
Render #1: options₁ ──► { roomId: "A", reconnect: true }
Render #2: options₂ ──► { roomId: "A", reconnect: true }
```

Even though the contents appear equal:
```javascript
options₁ !== options₂
Object.is(options₁, options₂) // false!
```
The Effect dependency changed on every render, causing infinite setup/cleanup thrashing!

---

## 16. Identity, Not Deep Contents

This is one of the most important JavaScript-to-React connections.

```javascript
const a = { x: 1 };
const b = { x: 1 };
Object.is(a, b); // false!
```

Because:
```text
a ──► Object Ref #1 (0x001)
b ──► Object Ref #2 (0x002)
```

The objects contain identical property/value pairs but are different reference identities:
> **`same structure ≠ same identity`**

React dependency reasoning relies strictly on JavaScript reference identity.

---

## 17. Function Dependencies

Functions behave identically.

Consider:
```typescript
function Component({ roomId }: { roomId: string }) {
  function createOptions() {
    return { roomId };
  }

  useEffect(() => {
    const options = createOptions();
    connect(options);
  }, [createOptions]);

  return <div>...</div>;
}
```

`createOptions` is redeclared during rendering:
```text
Render #1: createOptions₁ (Function Ref 0x01)
Render #2: createOptions₂ (Function Ref 0x02)
```

Therefore:
```javascript
Object.is(createOptions₁, createOptions₂) // false!
```
The Effect sees a changed dependency on every render.

---

## 18. Do Not "Fix" Dependencies by Lying

A common anti-pattern reaction is:
```typescript
useEffect(() => {
  const options = createOptions();
  connect(options);
}, []); // ❌ Lying to React by removing the dependency
```

This removes the dependency from the array, but it does not solve the underlying relationship.

Now the Effect captures `roomId` from Render #1, while the component later represents `roomId` from Render #N.

You have exchanged:
```text
unnecessary re-synchronization  ──►  potential stale synchronization
```
That is not an optimization. It is a correctness regression.

---

## 19. Structural Dependency Reduction

The better solution is often to **move values inside the Effect**:

### Instead of:
```typescript
function Chat({ roomId }: { roomId: string }) {
  const createOptions = () => ({ roomId });

  useEffect(() => {
    const options = createOptions();
    connect(options);
  }, [createOptions]);
}
```

### Refactor to:
```typescript
function Chat({ roomId }: { roomId: string }) {
  useEffect(() => {
    const options = { roomId };
    connect(options);
  }, [roomId]); // ✅ Depends directly on the real reactive primitive
}
```

Now the dependency relationship is transparent:
```text
roomId ──► options ──► connect
```

The Effect depends on the actual reactive input (`roomId`), rather than on a render-created function whose identity changes. This is often far superior to blindly memoizing functions.

---

## 20. Dependency Graph Normalization

Consider:
```typescript
function Search({ query }: { query: string }) {
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    search(normalizedQuery);
  }, [normalizedQuery]);
}
```

Dependency: `normalizedQuery`. This is legitimate because the Effect synchronizes according to the normalized value.

Suppose:
- **Render #1:** `query = " React "` $\rightarrow$ `normalizedQuery = "react"`
- **Render #2:** `query = "react"` $\rightarrow$ `normalizedQuery = "react"`

The raw prop changed (`" React " → "react"`), but the synchronization input did not (`"react" → "react"`). Therefore the Effect does not re-synchronize unnecessarily.

> **Key Rule:** Dependencies represent the values that define the synchronization, not necessarily every upstream raw value that exists in the component.

---

## 21. But Be Careful With Derived Objects

Consider:
```typescript
const options = { query: query.trim(), page };

useEffect(() => {
  fetchResults(options);
}, [options]); // ❌ options reference recreated every render
```

Because `options` is an object recreated each render, its reference is unstable.

A more direct model is:
```typescript
useEffect(() => {
  const options = { query: query.trim(), page };
  fetchResults(options);
}, [query, page]); // ✅ Primitive dependencies
```

Now the synchronization graph is explicit:
```text
query ──────┐
            ├──► request options ──► fetch
page ───────┘
```

---

## 22. Empty Dependency Array `[]`

Consider:
```typescript
useEffect(() => {
  initialize();
}, []);
```

An empty dependency array means the Effect declares **no reactive dependencies from the component scope**.

It does not mean:
> *"React guarantees this callback executes exactly once under every circumstance in production and development."*

Development behavior, Strict Mode, remounts, and component lifecycle all matter.

The correct conceptual statement is:
```text
[]  ──►  No declared reactive dependencies
```
not:
```text
[]  ──►  Universal once-only guarantee
```

---

## 23. Empty Array + Reactive Value = Warning Sign

Consider:
```typescript
function User({ userId }: { userId: string }) {
  useEffect(() => {
    connectToUser(userId);
  }, []); // ⚠️ Mismatch!
}
```

- Dependency declaration: `[]`
- Actual reactive input: `userId`

Mismatch:
```text
Effect reads userId
        ↓
dependency declaration ignores userId
        ↓
potential stale synchronization
```

The code may appear to work if `userId` never changes. That does not make the dependency model correct.

---

## 24. No Dependency Array

Consider:
```typescript
useEffect(() => {
  synchronize();
});
```

Without a dependency array, the Effect is eligible to run **after every committed render**:
```text
Render ──► Commit ──► Effect synchronization
```

Repeated rendering results in repeated synchronization. That can be correct if the synchronization genuinely needs to be reconsidered after every single DOM commit. But frequently it indicates that the Effect needs a more precise dependency model—or shouldn't exist at all.

---

## 25. Three Dependency Modes

| Declaration | Conceptual Meaning | Re-evaluation Timing |
| :--- | :--- | :--- |
| `useEffect(fn)` | Reconsider after every commit | Every committed render |
| `useEffect(fn, [])` | No declared reactive dependencies | Only on mount / unmount |
| `useEffect(fn, [a, b])` | Synchronization depends on `a` and `b` | When `Object.is` fails on any dependency |

The senior interpretation is:
- **No array:** Reconsider after every commit
- **`[]`:** No declared reactive dependencies
- **`[a, b]`:** Reconsider when dependency relationship changes

Do not reduce this to:
> *"no array = always; `[]` = once; `[a]` = whenever `a` changes"*

That shortcut hides the synchronization model.

---

## 26. Prediction-First Walkthrough #2 — Object Identity

### Code:
```typescript
function Panel({ userId }: { userId: string }) {
  const options = { userId };

  useEffect(() => {
    connect(options);
  }, [options]);

  return <div>{userId}</div>;
}
```

### Render #1:
- `userId = "A"`
- Creates `options₁` (Ref `0x01`)
- Dependency: `[options₁]`
- Initial synchronization occurs.

### Render #2:
- Parent renders again. `userId = "A"` (unchanged)
- Creates new object: `options₂` (Ref `0x02`)
- Contents: `options₁ = { userId: "A" }`, `options₂ = { userId: "A" }`
- Comparison:
  ```javascript
  Object.is(options₁, options₂) // false!
  ```
- **Lifecycle result:**
  ```text
  dependency changed  ──►  cleanup  ──►  new synchronization
  ```
Even though `userId` did not change, the object identity did!

---

## 27. Prediction-First Walkthrough #3 — Stable Primitive

```typescript
function Panel({ userId }: { userId: string }) {
  useEffect(() => {
    connect(userId);
  }, [userId]);

  return <div>{userId}</div>;
}
```

### Sequence:
- `Render #1: userId = "A"` $\rightarrow$ Initial setup
- `Render #2: userId = "A"` $\rightarrow$ `Object.is("A", "A") = true` (No-op)
- `Render #3: userId = "A"` $\rightarrow$ `Object.is("A", "A") = true` (No-op)
- `Render #4: userId = "B"` $\rightarrow$ `Object.is("A", "B") = false` (Cleanup "A" $\rightarrow$ Setup "B")

Synchronization transitions only when the relevant input changes.

---

## 28. Prediction-First Walkthrough #4 — Function Identity

```typescript
function Search({ query }: { query: string }) {
  const buildUrl = () => `/search?q=${query}`;

  useEffect(() => {
    fetch(buildUrl());
  }, [buildUrl]);

  return null;
}
```

### Sequence:
- `Render #1: buildUrl₁`
- `Render #2: buildUrl₂`
- `Render #3: buildUrl₃`

Even if `query = "react"` throughout all renders:
```javascript
Object.is(buildUrl₁, buildUrl₂) // false
```
The Effect repeatedly tears down and re-synchronizes.

> **Lesson:** Function identity is data when a function appears in a dependency list.

---

## 29. Dependency Completeness vs Dependency Minimality

| Property | Definition | Category |
| :--- | :--- | :--- |
| **Dependency Completeness** | Every reactive value required by the Effect is declared. | **Correctness Property** |
| **Dependency Minimality** | The Effect does not depend on unnecessary unstable values. | **Design / Optimization Property** |

**Do not sacrifice completeness to achieve minimality.**

- **Bad:** Remove dependency $\rightarrow$ fewer Effect runs $\rightarrow$ stale closure / broken synchronization.
- **Better:** Understand why the dependency exists $\rightarrow$ restructure synchronization $\rightarrow$ remove unnecessary dependency structurally.

---

## 30. Dependency Optimization Hierarchy

When an Effect reruns too often, reason in this strict order:
```text
1. Is the Effect necessary?
   ↓
2. Is the synchronization correctly modeled?
   ↓
3. Are dependencies complete?
   ↓
4. Are unstable objects/functions being created unnecessarily?
   ↓
5. Can values be moved inside the Effect?
   ↓
6. Can the dependency be reduced to the true reactive input?
   ↓
7. Only then consider memoization/stability techniques (useMemo / useCallback)
```

This prevents premature and harmful optimization.

---

## 31. Anti-Pattern — "Just Add `[]`"

### Flawed Code:
```typescript
function Analytics({ userId }: { userId: string }) {
  useEffect(() => {
    trackUser(userId);
  }, []); // ❌
}
```

- **Why developers do it:** They want "one execution".
- **Mechanical failure:** The Effect captures the initial render's `userId`. If `Render #1 (userId: "A")` $\rightarrow$ `Render #2 (userId: "B")`, the component now represents user B while the analytics system is permanently stuck tracking user A.
- **Senior Refactoring:**
  ```typescript
  useEffect(() => {
    trackUser(userId);
  }, [userId]); // ✅
  ```
  If it is genuinely a mount-only application session integration, redesign the integration so it does not incorrectly depend on a changing component render value.

---

## 32. Anti-Pattern — "Suppress the Dependency"

### Flawed Code:
```typescript
useEffect(() => {
  subscribe(createHandler());
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // ❌
```

- **Why developers do it:** Because ESLint reports `missing dependency`.
- **Mechanical failure:** Suppressing the warning hides stale closures, wrong subscriptions, wrong request parameters, and corrupted external state.
- **Senior Response:** Do not ask *"How do I silence the warning?"*. Ask:
  > *"Why does this Effect read this value, and should synchronization change when that value changes?"*

---

## 33. Anti-Pattern — Deep Equality Assumption

### Flawed Code:
```typescript
const config = { theme: "dark", locale: "en" };

useEffect(() => {
  applyConfig(config);
}, [config]); // ❌ Recreated each render
```

- **Developer assumption:** `config` contents are the same $\rightarrow$ dependency is the same.
- **Incorrect:** Object identity differs when a new object is created.
- **Senior reasoning:** Distinguish *structural equality* from *reference identity*. React's dependency comparison does not perform arbitrary deep comparison of dependency objects.

---

## 34. Anti-Pattern — Memoization as a Bandage

A developer sees:
```typescript
const options = { roomId };
useEffect(..., [options]);
```
and immediately writes:
```typescript
const options = useMemo(() => ({ roomId }), [roomId]);
```

This stabilizes identity, but the senior question is:
> **Do I need `options` to exist outside the Effect at all?**

Often:
```typescript
useEffect(() => {
  const options = { roomId };
  connect(options);
}, [roomId]);
```
is simpler and expresses the synchronization relationship more directly without hook overhead. Memoization should have a clear architectural reason.

---

## 35. Production Incident — Subscription Multiplication

### Symptom:
A user opens a dashboard. One event arrives. The handler executes 5 times.

### Investigation:
```typescript
function Dashboard({ accountId }: { accountId: string }) {
  const config = { accountId };

  useEffect(() => {
    const unsubscribe = subscribe(config, handleUpdate);
    return unsubscribe;
  }, [config]); // ❌ Unstable object reference

  return <div>...</div>;
}
```

`config` changes identity on every render. Repeated synchronization occurs. If cleanup has a subtle bug or delay, subscriptions accumulate.

### Failure Chain:
```text
render
  ↓
new config identity
  ↓
dependency changed
  ↓
cleanup / setup
  ↓
render
  ↓
new config identity
  ↓
cleanup / setup
  ↓
subscription₁ + subscription₂ + subscription₃ + ...
```

---

## 36. Diagnostic Lab — Dependency Identity

Use console instrumentation:
```typescript
function Demo({ userId }: { userId: string }) {
  const options = { userId };

  useEffect(() => {
    console.table({ type: "effect-setup", userId, options });

    return () => {
      console.table({ type: "effect-cleanup", userId, options });
    };
  }, [options]);

  return <div>{userId}</div>;
}
```

Cause parent renders without changing `userId`. Observe `Effect cleanup` and `Effect setup` firing continuously due to unstable object reference.

---

## 37. Dependency Identity Probe

For targeted debugging:
```typescript
const previousRef = useRef();

useEffect(() => {
  if (previousRef.current) {
    console.table({
      sameIdentity: Object.is(previousRef.current, options),
      previous: previousRef.current,
      current: options,
    });
  }
  previousRef.current = options;
});
```

This lets you verify JavaScript reference facts rather than guessing.

---

## 38. React DevTools Runbook

1. **Step 1 — Open React DevTools:** Inspect the component in the component tree.
2. **Step 2 — Trigger a render:** Change parent state, component state, or props without intentionally altering the Effect's semantic inputs.
3. **Step 3 — Observe component renders:** Determine whether the component rendered.
4. **Step 4 — Observe Effect setup/cleanup telemetry:** Instrument `console.count("Effect setup")` and `console.count("Effect cleanup")`.
5. **Step 5 — Compare dependency identities:** For objects/functions, test `Object.is(previous, current)`.
6. **Step 6 — Determine root cause:** Classify into:
   - Necessary dependency change
   - Unstable object
   - Unstable function
   - Unnecessary Effect
   - Missing dependency
   - Incorrect synchronization boundary

---

## 39. The Dependency Array as a Data-Flow Contract

Consider:
```typescript
useEffect(() => {
  connect(serverUrl, roomId);
}, [serverUrl, roomId]);
```

Read it as a reactive data-flow graph:
```text
serverUrl ───────┐
                 ▼
          synchronization
                 ▲
roomId ──────────┘
```

When one input changes, the previous synchronization no longer represents current graph inputs. Therefore React transitions it.

---

## 40. What Counts as a Dependency?

```text
Does the Effect read this value?
  │
  ├── No  ──► probably not a dependency
  │
  └── Yes
       │
       ▼
Does the value come from reactive component scope?
  │
  ├── No  ──► may be stable/non-reactive (module-level constant, useRef)
  │
  └── Yes ──► dependency relationship exists
```

Then ask: **Is the value actually necessary for synchronization?**

---

## 41. Local Constants Are Not Automatically Non-Reactive

Consider:
```typescript
function Component({ id }: { id: string }) {
  const url = `/users/${id}`;

  useEffect(() => {
    fetch(url);
  }, [url]);
}
```

The developer might think: *"url is a const, so it can't be reactive."*

`const` means the binding cannot be reassigned *within that single render scope*. It does not mean the value is globally immutable across renders.
```text
Render #1: url = "/users/A"
Render #2: url = "/users/B"
```
The value is reactive across renders.

---

## 42. Destructuring Does Not Remove Reactivity

Consider:
```typescript
function User({ account }: { account: { id: string } }) {
  const { id } = account;

  useEffect(() => {
    load(id);
  }, [id]);
}
```

`id` is a local binding, but its value derives from reactive props (`account`). Therefore: `account → id → Effect`. If `id` changes, synchronization must transition.

---

## 43. Derived Values and Dependency Choice

Suppose:
```typescript
const fullName = `${firstName} ${lastName}`;

useEffect(() => {
  document.title = fullName;
}, [fullName]);
```

The synchronization depends semantically on `fullName`. Upstream inputs: `firstName, lastName → fullName → document.title`. The key is consistency and understanding what defines the synchronization.

---

## 44. Dependency Completeness Is a Correctness Property

Suppose:
```typescript
useEffect(() => {
  connect(serverUrl, roomId);
}, [roomId]); // ❌ missing serverUrl
```

If `serverUrl` changes, the Effect remains synchronized to the old server. The external relationship is stale and broken:
```text
dependency completeness  ──►  synchronization correctness
```

This is why dependency warnings are architectural signals, not lint noise.

---

## 45. Dependency Stability Is a Performance Property

Suppose:
```typescript
useEffect(() => {
  synchronize(options);
}, [options]);
```
and `options` changes identity every render.

If identity changes accidentally:
```text
same semantic configuration  ──►  new object identity  ──►  unnecessary synchronization
```

```text
Completeness ──► Correctness
Stability    ──► Efficiency
```
**Do not confuse them.**

---

## 46. The Senior Dependency Decision Tree

```text
Effect reran
    │
    ▼
Did the component render?
    │
    ▼
Which dependency changed?
    │
    ├── primitive/value
    │   ↓
    │   Was that change semantically necessary?
    │
    ├── object
    │   ↓
    │   Did identity change?
    │   ↓
    │   Was a new object created during render?
    │
    └── function
        ↓
        Did function identity change?
        ↓
        Does Effect really need function identity?
```

### Action:
- If dependency is necessary $\rightarrow$ **Keep it**
- If dependency is accidental $\rightarrow$ **Restructure**
- If dependency is unstable but semantically required $\rightarrow$ **Stabilize**
- **Never $\rightarrow$ Remove dependency merely to stop reruns**

---

# 🔬 LAYER 4 — THE CRUCIBLE

### 🔥 Challenge 01 — Predict the Effect
```tsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log("effect", count);
  }, [count]);

  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
}
```

- **Initial output:** `"effect 0"`
- **After first click:** `"effect 1"`
- **After second click:** `"effect 2"`
- **Explanation:** Each click triggers a state transition $\rightarrow$ render snapshot $\rightarrow$ `Object.is(prevCount, nextCount)` evaluates to `false` $\rightarrow$ Effect re-synchronizes with the new closed-over `count`.

---

### 🔥 Challenge 02 — Same Contents, Different Identity
```tsx
function App() {
  const config = { enabled: true };

  useEffect(() => {
    console.log("sync");
  }, [config]);

  return null;
}
```

The component renders 3 times.
- **Identities created:** 3 distinct object references (`config₁`, `config₂`, `config₃`).
- **Synchronization count:** 3 executions.
- **Why:** `Object.is(config₁, config₂) === false`. React compares reference identity, not deep structural contents.

---

### 🔥 Challenge 03 — Missing Dependency
```tsx
function User({ id }: { id: string }) {
  useEffect(() => {
    console.log("loading", id);
  }, []);

  return <div>{id}</div>;
}
```

- **Render #1 (`id = "A"`):** UI displays `"A"`, logs `"loading A"`.
- **Render #2 (`id = "B"`):** UI displays `"B"`, **no Effect runs**.
- **Closure:** Effect closure retains stale `id = "A"`.
- **Evaluation:** Dependency declaration `[]` lied to React; synchronization is stale and broken.

---

### 🔥 Challenge 04 — Function Identity
```tsx
function Search({ query }: { query: string }) {
  const getUrl = () => `/search?q=${query}`;

  useEffect(() => {
    fetch(getUrl());
  }, [getUrl]);

  return null;
}
```

Suppose `query = "react"` for 3 renders.
- `getUrl₁`, `getUrl₂`, `getUrl₃` are 3 distinct function objects.
- `Object.is(getUrl₁, getUrl₂) === false`.
- The Effect refetches on all 3 renders despite `query` never changing.

---

### 🔥 Challenge 05 — Structural Refactoring
Refactor:
```typescript
// Before
function Chat({ roomId }: { roomId: string }) {
  const createOptions = () => ({ roomId, reconnect: true });

  useEffect(() => {
    connect(createOptions());
  }, [createOptions]);

  return null;
}
```

**Senior Refactor:**
```typescript
// After
function Chat({ roomId }: { roomId: string }) {
  useEffect(() => {
    const options = { roomId, reconnect: true };
    connect(options);
  }, [roomId]);

  return null;
}
```
Graph: `roomId → options → connection`. Accidental function identity dependency eliminated.

---

### 🔥 Challenge 06 — Senior Diagnosis
**Production report:** *"Changing a completely unrelated piece of UI state causes our WebSocket connection to disconnect and reconnect."*

```typescript
const connectionOptions = { endpoint, roomId };

useEffect(() => {
  const connection = createConnection(connectionOptions);
  connection.connect();
  return () => connection.disconnect();
}, [connectionOptions]);
```

**Diagnostic Plan:**
1. Unrelated state change triggers component render.
2. `connectionOptions` is an object literal recreated on render $\rightarrow$ new reference identity.
3. `Object.is(prevOptions, nextOptions) === false`.
4. Effect tears down active WebSocket and reconnects unnecessarily.
5. **Fix:** Move `connectionOptions` inside Effect or declare `[endpoint, roomId]`.

---

# 48. Production Incident Runbook

### Incident: *"Effect runs constantly in an infinite loop or on every click."*

- **Step 1 — Confirm rendering:** Verify if the component itself is rendering repeatedly using React DevTools Profiler.
- **Step 2 — Identify changed dependency:** Instrument dependencies via `console.table({ roomId, options, handler })`.
- **Step 3 — Test identity:** For objects/functions, test `Object.is(previousRef.current, current)`.
- **Step 4 — Classify:** Primitive change, object identity change, function identity change, missing dependency, or missing dependency array.
- **Step 5 — Determine semantic necessity:** Does this change actually mean external synchronization must transition?
- **Step 6 — Refactor structurally:**
  ```text
  remove unnecessary Effect
          ↓
  move local construction inside Effect
          ↓
  depend on true reactive primitives
          ↓
  stabilize identity when semantically justified
  ```
- **Step 7 — Re-profile:** Measure render count, Effect setup count, cleanup count, and active network connections.

---

# 49. Engineering Decision Matrix

| Situation | Preferred Reasoning |
| :--- | :--- |
| **Effect reads changing prop** | Include the prop if synchronization depends on it |
| **Effect reads state** | Include state if synchronization depends on it |
| **Object recreated each render** | Determine whether object identity is actually meaningful |
| **Function recreated each render** | Ask whether function identity is truly required |
| **Derived primitive value** | Depend on the value that defines synchronization |
| **Effect only calculates derived data** | Remove Effect; calculate during render |
| **Developer wants `[]` to suppress reruns** | Investigate whether synchronization is actually mount-only |
| **Linter reports missing dependency** | Treat as architectural signal; do not disable rule |
| **Effect reruns due to unstable object** | Prefer restructuring before memoization |
| **Effect reruns due to unstable function** | Move function logic inside Effect or redesign |
| **Dependency changes semantically** | Keep dependency; re-synchronization is correct |
| **Dependency changes accidentally** | Remove accidental instability structurally |

---

# 50. Senior Interview Traps

### Trap 1: *"The dependency array tells React when to run the Effect."*
- **Better:** It declares the reactive values the synchronization depends upon. React compares values with `Object.is` and re-synchronizes when dependencies change.

### Trap 2: *"`[]` means run exactly once."*
- **Better:** `[]` declares no reactive dependencies from component scope. Strict Mode, remounts, and tree lifecycle still apply.

### Trap 3: *"React compares objects by their contents."*
- **False:** React uses `Object.is` reference equality.

### Trap 4: *"If an Effect reruns too much, remove dependencies."*
- **Dangerous:** Removing dependencies creates stale closures and broken external synchronization.

### Trap 5: *"Only state is reactive."*
- **False:** Props, render-created variables, and functions are all reactive.

### Trap 6: *"A const cannot be reactive."*
- **False:** A `const` is scoped to a single render snapshot. Different renders produce different values.

### Trap 7: *"Memoization fixes Effect dependencies."*
- **Better:** Memoization stabilizes identity, but the first question is whether the unstable value needs to exist outside the Effect at all.

---

# 51. The Complete Mental Model

```text
┌─────────────────────────┐
│      React Render       │
└────────────┬────────────┘
             │
┌────────────┼────────────┐
▼            ▼            ▼
props      state     local values
│            │            │
└────────────┼────────────┘
             │
             ▼
       Effect closure
             │
             ▼
      Dependency graph
             │
             ▼
   Dependency comparison (Object.is)
             │
      ┌──────┴──────┐
      │             │
  unchanged      changed
      │             │
      ▼             ▼
keep current     cleanup old
                    │
                    ▼
                setup new
                    │
                    ▼
             External system
```

And the JavaScript foundation:
```text
lexical scope
    ↓
closures
    ↓
render snapshots
    ↓
object identity
    ↓
Object.is
    ↓
function identity
    ↓
dependency comparison
    ↓
Effect synchronization
```

---

# 52. Completion Checklist

You should be able to explain all of the following without notes:
- [ ] What a reactive value means in React.
- [ ] Why props can be reactive.
- [ ] Why state can be reactive.
- [ ] Why render-created values can be reactive.
- [ ] Why render-created functions can be reactive.
- [ ] What an Effect dependency actually represents.
- [ ] Why a dependency array is more than a scheduling shortcut.
- [ ] Why rendering does not automatically imply Effect re-synchronization.
- [ ] How React compares dependency entries.
- [ ] Why `Object.is` matters.
- [ ] Why object identity matters.
- [ ] Why function identity matters.
- [ ] Why deep equality is not the dependency model.
- [ ] How closures interact with Effect dependencies.
- [ ] What a stale closure looks like.
- [ ] Why missing dependencies can produce stale synchronization.
- [ ] Why `[]` does not mean universal once-only execution.
- [ ] What omitting the dependency array means.
- [ ] Why local `const` bindings can still represent reactive values.
- [ ] How destructuring affects dependency reasoning.
- [ ] How derived values participate in dependency graphs.
- [ ] Difference between dependency completeness and minimality.
- [ ] Difference between correctness and performance in dependency design.
- [ ] Why blindly removing dependencies is dangerous.
- [ ] Why lint suppression can hide architecture bugs.
- [ ] Why moving object creation inside the Effect can help.
- [ ] Why moving function logic inside the Effect can help.
- [ ] When memoization may be appropriate.
- [ ] Why memoization should not be the first reflex.
- [ ] How to diagnose unstable object dependencies.
- [ ] How to diagnose unstable function dependencies.
- [ ] How to instrument Effect setup/cleanup.
- [ ] How to use `Object.is` when debugging dependency identity.
- [ ] How to identify unnecessary synchronization.
- [ ] How to reason about Effect behavior across multiple renders.
- [ ] How dependency changes cause synchronization transitions.
- [ ] How cleanup/setup relate to dependency changes.
- [ ] How JavaScript closures explain stale Effect behavior.
- [ ] How JavaScript identity explains repeated Effect execution.
- [ ] How to distinguish a real dependency from an accidental dependency.
- [ ] How to design dependencies from synchronization semantics rather than convenience.

---

# 53. Graduation Standard

You have mastered Part 03 when you can look at an unfamiliar Effect and immediately answer:
1. **What external system is this synchronizing?**
2. **What values define that synchronization?**
3. **Which of those values are reactive?**
4. **What closure does each render create?**
5. **Which dependency identities change?**
6. **Is that change semantically meaningful?**
7. **If the Effect reruns, is that correct or accidental?**
8. **If it does not rerun, could the synchronization become stale?**
9. **Can the dependency graph be simplified structurally?**
10. **Is memoization actually necessary?**

> **Senior Axiom:** A dependency is not a permission to rerun an Effect. It is evidence of what the Effect's synchronization depends upon.

---

# Final Mental Model

```text
REACT RENDER
     │
     ▼
┌─────────────────────────┐
│     Render Snapshot     │
│                         │
│ props                   │
│ state                   │
│ local values            │
│ functions               │
└────────────┬────────────┘
             │
             ▼
       Effect Closure
             │
             ▼
"What does this sync depend on?"
             │
             ▼
     Dependency Array
             │
             ▼
┌─────────────────────────┐
│    Object.is compare    │
└────────────┬────────────┘
             │
      ┌──────┴──────┐
      ▼             ▼
  unchanged      changed
      │             │
      ▼             ▼
 keep current   cleanup old
      │             │
      ▼             ▼
                setup new
                    │
                    ▼
             External System
```

---

[⬅️ Previous Part](02-effect-lifecycle-and-synchronization.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](examples/03-effect-dependencies-reactive-values.html) | [Next Part ➡️](04-effect-synchronization-patterns.md)
