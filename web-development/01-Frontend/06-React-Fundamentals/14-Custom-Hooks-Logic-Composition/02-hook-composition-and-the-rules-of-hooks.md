# Level 06 — React Fundamentals
# KPI 14 — Custom Hooks & Logic Composition
## PART 02 — Hook Composition & The Rules of Hooks

[⬅️ Previous Part (01: Custom Hooks Mental Model)](./01-custom-hooks-mental-model-and-logic-reuse.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab (Lab 02)](./examples/02-hook-composition-and-the-rules-of-hooks.html) | [Next Part (03: API Design Contracts: Tuples vs Objects) ➡️](./03-api-design-contracts-tuples-vs-objects.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)  
> **Co-Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)

---

### 🏛️ Core Architectural Thesis
> **Hook composition works because React associates each Hook call with a stable position in the currently rendering component Fiber's Hook topology. The Rules of Hooks are NOT arbitrary stylistic guidelines or linter preferences; they are strict runtime mathematical invariants that preserve the identity mapping between `Rendering Component` $\to$ `Hook Call Index` $\to$ `Persistent Hook State`.**

---

## LAYER 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

### 1. Executive Summary
Custom Hooks enable the composition of primitive Hooks (`useState`, `useReducer`, `useEffect`, `useRef`, `useMemo`, `useCallback`, `useContext`, `useSyncExternalStore`) into modular behavioral units.

```text
====================================================================================================
                        STABLE HOOK CALL ORDER MAPPING IN FIBER
====================================================================================================

 COMPONENT RENDER INVOCATION
            │
            ▼
 Hook Calls Execute in Fixed Sequential Order:
            │
            ├── Call #1 ──► useState()   ──► Resolves Hook Node #1 [memoizedState: "A"]
            ├── Call #2 ──► useRef()     ──► Resolves Hook Node #2 [memoizedState: RefObject]
            ├── Call #3 ──► useEffect()  ──► Resolves Hook Node #3 [memoizedState: EffectTree]
            └── Call #4 ──► useMemo()    ──► Resolves Hook Node #4 [memoizedState: Tuple]
            │
            ▼
 Stable 1-to-1 Association Preserved Across Hundreds of Re-Renders!
====================================================================================================
```

When this invariant is broken:
```text
Render #1: [Hook A] ──► [Hook B] ──► [Hook C]
Render #2: [Hook A] ──► [Hook C]  ◄── 💥 CORRUPTION! Hook C reads Hook B's state!
```

---

### 2. The Rules of Hooks as Runtime Invariants

```text
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. ONLY call Hooks at the top level of React functions (never in conditions, loops, or blocks).   │
│ 2. ONLY call Hooks from React Function Components or Custom Hooks (never in vanilla JS utils).    │
│ 3. NEVER call Hooks inside event handlers, promises, timeouts, or effect callbacks.               │
│ 4. NEVER call Hooks after an early return that varies across render passes.                       │
│ 5. The sequential call topology that React encounters for a Fiber MUST remain 100% stable.       │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3. The Core Architecture Equation
$$\text{Custom Hook Composition} = \text{Stable Call Topology} + \text{Primitive Composition} + \text{Stable Caller Fiber} + \text{Explicit Contract}$$

```text
Fiber Node
    │
    ▼
Current Render Pass
    │
    ▼
Active Dispatcher (HooksDispatcherOnMount vs HooksDispatcherOnUpdate)
    │
    ├── Hook Call #1 (useState)  ──► Node 1
    ├── Hook Call #2 (useRef)    ──► Node 2
    ├── Hook Call #3 (useEffect) ──► Node 3
    └── ...
    │
    ▼
Persistent Hook State Linked List Mapping Guaranteed
```

---

### 4. Fundamental Distinctions Table

| Concept | Architectural Meaning | Common Fallacy |
| :--- | :--- | :--- |
| **Custom Hook** | A JavaScript function that composes primitive Hooks. | A separate component or Fiber node. |
| **Primitive Hook** | Core React dispatcher primitives (`useState`, etc.). | Global mutable variables. |
| **Hook Call Order** | The sequential index React uses to traverse `memoizedState`. | Irrelevant; React doesn't use variable names. |
| **Hook State** | Persistent memory retained on the Fiber node across renders. | Temporary state that resets each render. |
| **Conditional Hook** | A hook executed inside an `if`/`switch` control block. | A valid way to save CPU cycles (Fatal Error!). |
| **Conditional Behavior** | Unconditional hook execution with conditional internal logic. | Confused with conditional hook calls. |
| **Event Handler** | Callback executed during user interaction (outside render). | A place to invoke custom hooks. |
| **Component Boundary** | An independent Fiber with its own isolated Hook linked list. | Purely a visual layout element. |

---

### 5. Why React Needs Stable Call Ordering (Variable Names Don't Exist in Bytecode)
Consider:
```tsx
function Profile() {
  const [name, setName] = useState('Alice');
  const [age, setAge] = useState(28);
  return <div>{name}: {age}</div>;
}
```

When minified/compiled, `name` and `age` become `a` and `b`. The JavaScript runtime does not convey variable names to React:
```text
Render #1:
  Hook Position 0 ──► Allocate HookNode #1 (holds 'Alice')
  Hook Position 1 ──► Allocate HookNode #2 (holds 28)

Render #2:
  Hook Position 0 ──► Retrieve HookNode #1 (returns 'Alice')
  Hook Position 1 ──► Retrieve HookNode #2 (returns 28)
```

If Hook #0 is skipped conditionally:
```text
Render #2 (Skip Hook #0):
  Hook Position 0 ──► React reads HookNode #1, but caller expects 'age'!
  Result: age is assigned 'Alice' (Catastrophic State Shift & Type Mismatch)!
```

---

## LAYER 2 — 🔬 Deep Mechanical Breakdown & Fiber Internals

### 6. The Fiber `memoizedState` Linked List
Inside the React 18/19 reconciler, every Function Component Fiber maintains a singly-linked list of `Hook` objects on its `memoizedState` property.

```typescript
// Conceptual React Fiber Hook Internal Node Structure
interface HookNode {
  memoizedState: any;       // Snapshot state (useState), cached value (useMemo), ref object
  baseState: any;           // Base state before unprocessed updates
  baseQueue: Update | null; // Queued state transitions
  queue: UpdateQueue | null;// Pending update actions
  next: HookNode | null;    // Pointer to next Hook in topology
}
```

```text
====================================================================================================
                        FIBER HOOK LINKED LIST TRAVERSAL
====================================================================================================

 Fiber (FunctionComponent)
   │
   └── memoizedState
         │
         ▼
     [Hook 1: useState]
       • memoizedState: "Alice"
       • next ──► [Hook 2: useRef]
                    • memoizedState: { current: HTMLDivElement }
                    • next ──► [Hook 3: useEffect]
                                 • memoizedState: EffectRecord
                                 • next ──► [Hook 4: useMemo]
                                              • memoizedState: [CalculatedData, [depA]]
                                              • next: null
====================================================================================================
```

---

### 7. Mount Dispatcher vs Update Dispatcher
React swaps its internal Hook dispatcher depending on the component lifecycle stage:

```text
                                  ReactCurrentDispatcher.current
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
    HooksDispatcherOnMount                                        HooksDispatcherOnUpdate
  (Allocates fresh HookNode;                                    (Traverses existing HookNode list;
   Appends to memoizedState)                                     Steps via hook = hook.next)
```

When the Hook call count or sequence differs between Mount and Update:
- **Fewer Hooks called:** `workInProgressHook.next` is not null at end of render $\to$ `Error: Rendered fewer hooks than expected.`
- **More Hooks called:** `workInProgressHook` is null when more hooks execute $\to$ `Error: Rendered more hooks than during the previous render.`

---

### 8. Custom Hooks are Flattened during Execution
When custom hooks compose other custom hooks, React does **not** create nested sub-scopes. The execution flattens directly into the single caller Fiber's linked list:

```tsx
function useA() {
  useState('A1');
  useEffect(() => {}, []);
}

function useB() {
  useRef('B1');
  useState('B2');
}

function MyComponent() {
  useA();
  useB();
  return <div />;
}
```

```text
====================================================================================================
                              FLATTENED HOOK TOPOLOGY
====================================================================================================
 MyComponent Fiber.memoizedState:
   ├── Hook #1 (useA -> useState)
   ├── Hook #2 (useA -> useEffect)
   ├── Hook #3 (useB -> useRef)
   └── Hook #4 (useB -> useState)
====================================================================================================
```

---

### 9. Conditional Behavior vs Conditional Hook Execution

#### ❌ Fatal Pattern: Conditional Hook Call
```tsx
function UserProfile({ userId }: { userId: string | null }) {
  if (userId) {
    // 💥 CRASH: Call order depends on runtime prop truthiness!
    useEffect(() => {
      fetchUserData(userId);
    }, [userId]);
  }
  return <div>Profile</div>;
}
```

#### ✅ Senior Gold Standard: Unconditional Hook with Conditional Internal Logic
```tsx
function UserProfile({ userId }: { userId: string | null }) {
  useEffect(() => {
    // ✅ Safe: Hook call order is 100% constant; work executes conditionally
    if (!userId) return;
    fetchUserData(userId);
  }, [userId]);

  return <div>Profile</div>;
}
```

---

### 10. The Early Return Trap & Refactoring
Placing an early return **before** a hook call alters the component's Hook count across render passes:

#### ❌ The Early Return Trap:
```tsx
function DocumentViewer({ docId, isLoading }: Props) {
  if (isLoading) {
    return <Spinner />; // 💥 Returns early; useDocumentSync() is skipped!
  }

  const document = useDocumentSync(docId);
  return <Editor doc={document} />;
}
```

#### ✅ Senior Refactoring: Hooks First, Branches Second
```tsx
function DocumentViewer({ docId, isLoading }: Props) {
  // ✅ Always execute all hooks unconditionally at the very top
  const document = useDocumentSync(isLoading ? null : docId);

  if (isLoading) {
    return <Spinner />;
  }

  return <Editor doc={document} />;
}
```

---

### 11. Dynamic Collections & The Component Boundary Law

$$\text{Cardinal Law: } \text{Dynamic Stateful Instances} \implies \text{Dynamic Component Boundaries}$$

#### ❌ Fatal Pattern: Hooks inside Loops / `.map()`
```tsx
function UserList({ users }: { users: User[] }) {
  return (
    <div>
      {users.map((u) => {
        // 💥 FATAL: If array length changes (add/delete), hook call count changes!
        const [isExpanded, setIsExpanded] = useState(false);
        return <div key={u.id}>{u.name} (Expanded: {String(isExpanded)})</div>;
      })}
    </div>
  );
}
```

#### ✅ Senior Refactoring: Extracting Independent Child Components
```tsx
// 1. Child component encapsulates its own stable Hook topology
function UserRow({ user }: { user: User }) {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div>
      {user.name} 
      <button onClick={() => setIsExpanded((v) => !v)}>
        {isExpanded ? 'Collapse' : 'Expand'}
      </button>
    </div>
  );
}

// 2. Parent renders dynamic list of Component Fibers safely
export function UserList({ users }: { users: User[] }) {
  return (
    <div>
      {users.map((u) => (
        <UserRow key={u.id} user={u} />
      ))}
    </div>
  );
}
```

```text
====================================================================================================
                        COMPONENT FIBER BOUNDARIES FOR DYNAMIC LISTS
====================================================================================================
 <UserList> Fiber
     │
     ├── <UserRow key="u1"> Fiber ──► [Hook 1: useState(false)]
     ├── <UserRow key="u2"> Fiber ──► [Hook 1: useState(false)]
     └── <UserRow key="u3"> Fiber ──► [Hook 1: useState(false)]
====================================================================================================
```

---

## LAYER 3 — 🛠️ Production Crucibles & Anti-Patterns

### 12. Anti-Pattern Matrix: Hook Composition Invariants

| Anti-Pattern | Root Mechanical Failure | Production Impact | Senior Architectural Fix |
| :--- | :--- | :--- | :--- |
| **Conditional Hook Call** | Hook list indices shift between renders. | Runtime React crash: *"Rendered fewer hooks"*. | Move condition inside effect/hook body. |
| **Early Return before Hook** | Hook sequence skipped during loading/error states. | Crash as soon as component transitions from loading $\to$ data. | Hoist all Hook declarations above all return statements. |
| **Hook in Array `.map()`** | Hook count tied to dynamic array length. | State cross-contamination when items reorder/filter. | Extract row into a dedicated React child component. |
| **Hook inside Event Handler** | Hook called outside Fiber render phase. | Dispatcher error: *"Invalid hook call"*. | Call hook at top level; trigger actions in event handler. |
| **Hook in Promise `.then()`** | Hook invoked asynchronously after render commit. | Fiber context loss; unpredictable memory corruption. | Manage async status via `useState` / `useEffect` at top level. |
| **Dynamic Hook Factory** | Swapping `useStrategyA` vs `useStrategyB` at runtime. | Incompatible hook topologies on mode change. | Render `<StrategyAComponent />` vs `<StrategyBComponent />`. |

---

### 13. Production Crucible 1: The Feature Flag State Shift

#### ❌ Flawed Code:
```tsx
function AdminDashboard({ flags }: { flags: FeatureFlags }) {
  if (flags.enableRealtimeAudit) {
    useAuditStream(); // Consumes Hook #1 (useState), Hook #2 (useEffect)
  }

  const [activeTab, setActiveTab] = useState('metrics'); // Hook #3 or Hook #1?
  const [filters, setFilters] = useState({});            // Hook #4 or Hook #2?

  return <DashboardLayout tab={activeTab} />;
}
```

```text
Flag OFF:
  Hook #1 ──► activeTab ('metrics')
  Hook #2 ──► filters ({})

Flag Toggled ON:
  Hook #1 ──► useAuditStream.state (Allocated audit buffer)
  Hook #2 ──► useAuditStream.effect
  Hook #3 ──► activeTab (ASSIGNED OLD 'filters' OBJECT INSTEAD OF STRING!)
  Hook #4 ──► filters (UNDEFINED!)
💥 UI CRASHES: Cannot read property of string in <DashboardLayout tab={activeTab} />
```

#### ✅ Senior Refactoring:
```tsx
export function AdminDashboard({ flags }: { flags: FeatureFlags }) {
  // Option A: Pass flag into hook unconditionally
  useAuditStream({ enabled: flags.enableRealtimeAudit });

  const [activeTab, setActiveTab] = useState('metrics');
  const [filters, setFilters] = useState({});

  return <DashboardLayout tab={activeTab} />;
}
```

---

### 14. Production Crucible 2: Dynamic Strategy Selection

#### ❌ Flawed Strategy Hook:
```tsx
function usePaymentProcessor(method: 'credit' | 'crypto') {
  if (method === 'credit') {
    return useStripeCardProcessor(); // Has 4 internal hooks
  } else {
    return useCoinbaseCryptoProcessor(); // Has 2 internal hooks
  }
}
```

#### ✅ Senior Refactoring: Discriminated Component Subtrees
```tsx
export function CheckoutPage({ method }: { method: 'credit' | 'crypto' }) {
  return (
    <div className="checkout-container">
      {method === 'credit' ? <CreditCardCheckout /> : <CryptoCheckout />}
    </div>
  );
}

function CreditCardCheckout() {
  const processor = useStripeCardProcessor(); // Stable 4-hook topology
  return <CardForm processor={processor} />;
}

function CryptoCheckout() {
  const processor = useCoinbaseCryptoProcessor(); // Stable 2-hook topology
  return <CryptoForm processor={processor} />;
}
```

---

## LAYER 4 — 🧪 Diagnostic Gauntlet & Master Checklist

### 15. The 10 Prediction Challenges

#### Challenge 1: Conditional Hook Inside `if (flag)`
- **Code:** `if (enabled) { useState(0); } useEffect(() => {}, []);`
- **Result:** **CRASH**. Hook topology differs when `enabled` flips between renders.

#### Challenge 2: Unconditional Hook with Guarded Body
- **Code:** `const [val] = useState(0); useEffect(() => { if (!enabled) return; }, [enabled]);`
- **Result:** **VALID**. Call topology is identical across all render passes.

#### Challenge 3: Hook Call inside `.map()`
- **Code:** `items.map(item => useState(item.id))`
- **Result:** **CRASH**. Array length changes alter the hook linked list count.

#### Challenge 4: Extracted Row Component
- **Code:** `items.map(item => <Row key={item.id} item={item} />)` where `<Row>` calls `useState`.
- **Result:** **VALID**. Each row Fiber maintains its own stable hook topology.

#### Challenge 5: Early Return before Custom Hook
- **Code:** `if (!data) return <Loading />; const theme = useTheme();`
- **Result:** **CRASH**. As soon as `data` loads, Hook count changes from 0 to 1.

#### Challenge 6: Dynamic Component Tree Branching
- **Code:** `if (role === 'admin') return <AdminView />; return <UserView />;`
- **Result:** **VALID**. Parent component's hook topology is empty; child Fibers maintain independent lifecycles.

#### Challenge 7: Hook Call in Click Handler
- **Code:** `const onClick = () => { useSaveData(); }`
- **Result:** **CRASH**. Hook executed outside the render phase when no dispatcher is bound.

#### Challenge 8: Hook Factory Function
- **Code:** `const useDynamicHook = flag ? useHookA : useHookB; useDynamicHook();`
- **Result:** **CRASH**. Swapping functions at runtime alters the underlying primitive hook topology.

#### Challenge 9: Calling Hook in `useEffect` Callback
- **Code:** `useEffect(() => { const data = useFetch(); }, [])`
- **Result:** **CRASH**. Effect callbacks execute during the commit phase, not render declaration.

#### Challenge 10: Calling Hook in Promise `.then()`
- **Code:** `fetch('/api').then(() => { useState(1); })`
- **Result:** **CRASH**. Asynchronous callbacks execute after render has completed.

---

### 16. Senior Interview Gauntlet: 10 Critical Questions & Master Answers

#### Q1: "Why do the Rules of Hooks exist in React?"
> **Senior Answer:** React associates state with components using a sequential singly-linked list on `Fiber.memoizedState`. During re-renders, React traverses this list in the exact order hooks are called. Because JavaScript does not attach variable names to runtime bytecode, stable call ordering is the only mechanism React has to map a hook call to its persistent state node.

#### Q2: "Can conditional behavior exist inside a custom Hook?"
> **Senior Answer:** Yes, absolutely. The Hook call itself must be unconditional at the top level, but the internal logic inside effects, callbacks, or returned computed values can branch freely based on input arguments (e.g. `if (!enabled) return;` inside an effect).

#### Q3: "What happens mechanically when a component renders fewer hooks than during its mount pass?"
> **Senior Answer:** During update passes, React expects to traverse the existing `HookNode` chain to its end. If the component finishes executing before reaching the end of the chain, React detects that `workInProgressHook.next !== null` and throws the invariant error: *"Rendered fewer hooks than expected"*.

#### Q4: "How should dynamic collections with independent state be architected?"
> **Senior Answer:** By extracting child components for each list item. Dynamic state instances must be modeled as dynamic component Fiber nodes in the virtual DOM tree, each with its own private, stable Hook topology, keyed by stable unique identifiers.

#### Q5: "Why are custom Hooks called 'flattened' during execution?"
> **Senior Answer:** Custom Hooks do not create sub-fibers or separate lexical scopes in the reconciler. When a component calls a custom hook that calls three primitive hooks, all three primitives append directly to the calling component Fiber's `memoizedState` list.

#### Q6: "Does TypeScript guarantee compliance with the Rules of Hooks?"
> **Senior Answer:** No. TypeScript only validates type signatures and parameter contracts. It cannot detect runtime control flow variations (like conditional blocks or loop iterations). Compliance is enforced statically by the `eslint-plugin-react-hooks` analyzer and at runtime by the React dispatcher.

#### Q7: "What is the difference between `HooksDispatcherOnMount` and `HooksDispatcherOnUpdate`?"
> **Senior Answer:** On mount, `HooksDispatcherOnMount` allocates new `HookNode` objects and links them via `next` pointers onto `Fiber.memoizedState`. On updates, `HooksDispatcherOnUpdate` traverses existing nodes, processes queued state updaters, and returns existing state snapshots.

#### Q8: "How do you refactor an early return that violates hook rules?"
> **Senior Answer:** Hoist all hook invocations to the absolute top of the component function. Pass fallback or nullable inputs into the hooks (e.g. `useData(isLoading ? null : id)`), and place the UI branching returns (e.g. `if (isLoading) return <Spinner />`) after all hooks have executed.

#### Q9: "Why can't hooks be called inside `useEffect` callbacks?"
> **Senior Answer:** `useEffect` callbacks execute asynchronously during the commit/passive effect phase after reconciliation has finished and the DOM has updated. Hooks can only be executed during the synchronous render phase while the Fiber's work-in-progress dispatcher is active.

#### Q10: "What is the architectural rule for varying hook implementations based on feature flags?"
> **Senior Answer:** Use Component-Level Branching rather than Hook-Level Branching. Render `<FeatureAComponent />` vs `<FeatureBComponent />`. This gives each mode an explicit lifecycle, independent ref/state ownership, and a stable hook linked list.

---

### 17. 50-Point Master Checklist: Hook Composition & Call Invariants

- [x] 1. Understand that Hook call order is the mechanical key to Fiber state mapping.
- [x] 2. Know that custom Hooks do not create sub-fibers in the reconciliation tree.
- [x] 3. Explain how primitive hooks append to the caller's `memoizedState` linked list.
- [x] 4. Never call Hooks inside `if`, `switch`, or ternary statements.
- [x] 5. Never call Hooks inside `for`, `while`, or `Array.prototype.map()` loops.
- [x] 6. Never call Hooks after an early `return` statement.
- [x] 7. Never call Hooks inside event handlers (`onClick`, `onSubmit`).
- [x] 8. Never call Hooks inside asynchronous promise callbacks or `setTimeout`.
- [x] 9. Never call Hooks inside `useEffect` or `useLayoutEffect` callback bodies.
- [x] 10. Hoist all Hook declarations to the top of the function component.
- [x] 11. Pass conditional inputs into hooks rather than calling hooks conditionally.
- [x] 12. Add early guard clauses inside effect callbacks (`if (!enabled) return;`).
- [x] 13. Model dynamic stateful collections as separate child components with stable keys.
- [x] 14. Ensure custom Hook names always begin with the `use` prefix.
- [x] 15. Enforce static linting via `eslint-plugin-react-hooks`.
- [x] 16. Never suppress `rules-of-hooks` lint warnings without architectural restructuring.
- [x] 17. Understand how `HooksDispatcherOnMount` allocates initial hook nodes.
- [x] 18. Understand how `HooksDispatcherOnUpdate` iterates existing hook nodes.
- [x] 19. Recognize the exact cause of *"Rendered fewer hooks than expected"*.
- [x] 20. Recognize the exact cause of *"Rendered more hooks than during previous render"*.
- [x] 21. Understand that variable names (`count`, `name`) are invisible to the React reconciler.
- [x] 22. Refactor dynamic strategy hooks into discriminated component subtrees.
- [x] 23. Avoid hook factory functions that swap implementations at runtime.
- [x] 24. Audit composed custom hooks by flattening their primitive call sequence.
- [x] 25. Pass nullable parameters to hooks when waiting for asynchronous parent data.
- [x] 26. Keep component hook counts identical across initial render, loading, and error states.
- [x] 27. Isolate feature-flagged logic into dedicated component boundaries.
- [x] 28. Ensure custom hooks handle `null` and `undefined` arguments gracefully.
- [x] 29. Verify that hook call topologies remain stable across concurrent transition lanes.
- [x] 30. Prevent accidental hook reordering during code refactoring.
- [x] 31. Model multi-step wizards with a single stable state machine hook or child components.
- [x] 32. Avoid calling custom hooks inside helper functions defined within component bodies.
- [x] 33. Ensure recursive component trees maintain stable local hook topologies.
- [x] 34. Combine multiple custom hooks safely by ensuring all obey top-level rules.
- [x] 35. Understand how Strict Mode double-invokes render functions to catch impure hook calls.
- [x] 36. Verify that custom hooks do not mutate external variables during the render phase.
- [x] 37. Test hook error states with Vitest to ensure unhandled invariants fail fast.
- [x] 38. Map out component Hook topologies during architecture reviews.
- [x] 39. Distinguish UI branching (`{flag && <Child />}`) from hook branching.
- [x] 40. Isolate heavy un-needed hook subscriptions behind lazy-mounted component boundaries.
- [x] 41. Design clean TypeScript input interfaces for custom hook options.
- [x] 42. Use discriminated unions for mutually exclusive hook configuration modes.
- [x] 43. Ensure custom hooks return stable function references via `useCallback`.
- [x] 44. Avoid creating custom hooks that conditionally return different data shapes.
- [x] 45. Trace hook execution sequences using React DevTools Profiler.
- [x] 46. Ensure custom hooks clean up all subscriptions when caller unmounts.
- [x] 47. Recognize when a hook's internal complexity warrants decomposition into child hooks.
- [x] 48. Benchmark hook execution overhead in high-frequency rendering pipelines.
- [x] 49. Apply the Component Boundary Law to eliminate all dynamic hook loops.
- [x] 50. Defend Hook composition invariants in senior full-stack architectural reviews.

---

## 🧪 Interactive Companion Diagnostic Lab
Launch the standalone interactive HTML laboratory to explore live Hook linked list traversals, simulate conditional corruptions, and complete the diagnostic gauntlet:
👉 **[🧪 Interactive Hook Composition & Rules of Hooks Lab (Lab 02)](./examples/02-hook-composition-and-the-rules-of-hooks.html)**

---

[⬅️ Previous Part (01: Custom Hooks Mental Model)](./01-custom-hooks-mental-model-and-logic-reuse.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab (Lab 02)](./examples/02-hook-composition-and-the-rules-of-hooks.html) | [Next Part (03: API Design Contracts: Tuples vs Objects) ➡️](./03-api-design-contracts-tuples-vs-objects.md)
