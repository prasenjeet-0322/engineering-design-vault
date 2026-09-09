# Level 06 — React Fundamentals
# Custom Hooks & Logic Composition
## PART 01 — Custom Hooks Mental Model & Logic Reuse

[⬅️ Level 06 Master Hub](../README.md) | [🧪 Companion Lab (Lab 01)](./examples/01-custom-hooks-mental-model-and-logic-reuse.html) | [Next Part (02: Hook Composition & Rules) ➡️](./02-custom-hook-api-contracts.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)  
> **Co-Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)

---

## Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

### 1. The Core Mental Model
Before learning advanced custom hook patterns, you must understand the foundational invariant:
> **A custom hook reuses stateful logic and behavior, NOT component state instances.**

```text
====================================================================================================
                        CUSTOM HOOK COMPOSITION & CALLER MAPPING
====================================================================================================

 Component A ──────┐
                   │
 Component B ──────┼──► useSomething()
                   │
 Component C ──────┘
                          │
                          ▼
                   Hook Composition (Primitives)
                          │
           ┌──────────────┼──────────────┐
           ▼              ▼              ▼
        useState       useEffect       useRef
           │              │              │
           └──────────────┼──────────────┘
                          ▼
                   Behavioral Contract (API)
                          │
                          ▼
                     Consumer UI
====================================================================================================
```

---

### 2. The Core Distinction: Reusable Logic vs Shared State

If two components call the exact same custom hook:

```tsx
function SearchBox() {
  const search = useSearch(); // Allocated on SearchBox Fiber
}

function SearchPage() {
  const search = useSearch(); // Allocated on SearchPage Fiber
}
```

They do **not** share state. Each component Fiber allocates its own independent singly-linked list of hooks.

```text
====================================================================================================
                       FIBER HOOK MEMORY ALLOCATION TOPOLOGY
====================================================================================================

 SearchBox Fiber (Host Instance A)
     │
     └── memoizedState ──► [Hook 1: useState(query)] ──► [Hook 2: useEffect(debounce)]
                               (query: "react")


 SearchPage Fiber (Host Instance B)
     │
     └── memoizedState ──► [Hook 1: useState(query)] ──► [Hook 2: useEffect(debounce)]
                               (query: "fiber")
====================================================================================================
```

$$\text{Reusable Logic } \neq \text{ Shared State}$$

---

### 3. Senior Trap: The Counter Fallacy

A developer sees:
```typescript
function useCounter() {
  const [count, setCount] = useState(0);

  return {
    count,
    increment: () => setCount((c) => c + 1),
  };
}
```

and thinks:
> *"Now I have a reusable counter across my application."*

More precisely: you have a **reusable counter algorithm**.

```text
Component A calls useCounter() ──► count = 0
Component B calls useCounter() ──► count = 0

User clicks A.increment()
   │
   ▼
Component A Rerenders ──► count = 1
Component B (Untouched) ──► count = 0
```

The abstraction reused the state management pattern, not the state memory slot.

---

### 4. Custom Hook vs Context vs External Store

```text
====================================================================================================
                       DISTRIBUTION MECHANISM COMPARISON
====================================================================================================

 1. CUSTOM HOOK (Local Behavior Reusability)
    • Mechanism: Composes primitive hooks directly into calling Fiber.
    • Memory: 100% isolated per caller instance.
    • Best For: Encapsulating state machines, timers, form validation, event listeners.

 2. CONTEXT (Scoped Ambient Dependency)
    • Mechanism: Fiber tree ancestor lookup via Context Stack.
    • Memory: Single Provider Fiber owns the state; broadcast to subtree.
    • Best For: Theme, Auth Session, Multi-instance Feature Controllers.

 3. EXTERNAL STORE (Global Observable State)
    • Mechanism: Module-level or scoped pub/sub engine read via useSyncExternalStore.
    • Memory: Outside React Fiber tree; fine-grained subscriptions.
    • Best For: High-frequency data (60fps), cross-tab sync, multi-branch sharing.
====================================================================================================
```

---

## Layer 2 — 🔬 Deep Mechanical Breakdown & Fiber Hook List

### 5. Custom Hooks Do Not Create Component Fibers
A common novice misconception is that custom hooks create child Fibers or virtual component nodes.

```text
❌ WRONG MENTAL MODEL:
Counter Fiber ──► useCounter Fiber ──► useState

✅ CORRECT FIBER REALITY:
Counter Fiber (Tag: 0, IndeterminateComponent / 2, FunctionComponent)
    │
    └── memoizedState (Singly Linked List)
            │
            ├── [Hook 1: useState (from useCounter)]
            ├── [Hook 2: useEffect (from useCounter)]
            └── [Hook 3: useRef (direct from Counter)]
```

When React executes a Function Component, `ReactCurrentDispatcher.current` intercepts primitive hook calls (`useState`, `useEffect`, `useRef`). It does not know or care whether those calls happened directly inside the component body or nested 5 layers deep inside custom utility functions.

---

### 6. The Complete Execution & Rerender Lifecycle

```text
====================================================================================================
                     CUSTOM HOOK EXECUTION & RERENDER TIMELINE
====================================================================================================

 1. MOUNT PHASE
    Component executes ──► Invokes useCounter() ──► mountWorkInProgressHook()
    Appends Hook nodes to Fiber.memoizedState linked list ──► Returns initial snapshot [0, inc]
    Component renders JSX with count = 0 ──► Commit Phase mounts DOM.

 2. INTERACTION TRIGGER
    User clicks <button onClick={inc}> ──► Dispatches update to Hook 1's queue
    React schedules render lane on the calling Component Fiber.

 3. UPDATE RENDER PASS
    Calling Component re-executes ──► Invokes useCounter() again
    updateWorkInProgressHook() walks existing linked list ──► Computes next count = 1
    Custom hook returns fresh snapshot tuple { count: 1, increment }
    Component returns new JSX output ──► Reconciler commits DOM text update.
====================================================================================================
```

---

### 7. The 5-Way Decision Framework: Where Does Logic Belong?

```text
====================================================================================================
                              LOGIC PLACEMENT DECISION TREE
====================================================================================================

Does logic require React Hook primitives (state, effects, refs, context)?
        │
    ┌───┴───┐
    │       │
   NO      YES
    │       │
 Pure    Is the logic specific to exactly ONE component?
Utility     │
        ┌───┴───┐
        │       │
       YES     NO
        │       │
   Keep inside  Does state need to be SHARED across multiple components?
    Component   │
            ┌───┴───┐
            │       │
           NO      YES
            │       │
      CUSTOM HOOK  Is the shared state tree-scoped or high-frequency/global?
   (Isolated State) │
                ┌───┴───┐
                │       │
             Scoped    Global / 60fps
                │       │
             CONTEXT  EXTERNAL STORE
====================================================================================================
```

---

## Layer 3 — 🛠️ Production Crucibles & Anti-Patterns

### 8. Production Anti-Pattern: The Fake Global User Hook

#### ❌ Flawed Code: Expecting Shared State from a Custom Hook
```tsx
// ❌ WRONG: Expecting useUser() to behave like a shared singleton
export function useUser() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchCurrentUser().then(setUser);
  }, []);

  return { user, setUser };
}

// In Header.tsx:
export function Header() {
  const { user } = useUser(); // Allocates User State Instance A
  return <div>Welcome, {user?.name}</div>;
}

// In Profile.tsx:
export function Profile() {
  const { user, setUser } = useUser(); // Allocates User State Instance B!
  return <button onClick={() => setUser(newUser)}>Update Name</button>;
}
```
*Result: Clicking `setUser` in `Profile` updates Profile's local state, but `Header` remains completely unaware and displays stale data because each caller has its own isolated `user` state slot!*

#### ✅ Senior Refactoring: Context Gateway + Custom Hook
```tsx
// 1. Single Authoritative Provider owns the user state instance
const UserContext = createContext<{ user: User | null; setUser: (u: User) => void } | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchCurrentUser().then(setUser);
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

// 2. Custom Hook acts as an ambient gateway to the shared Context instance
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('[useUser] Invariant Violation: Missing <UserProvider> in ancestry.');
  }
  return context;
}
```

---

## Layer 4 — 🧪 Mastery Checklist & Diagnostic Gauntlet

- [x] 1. Define a custom hook as a behavioral abstraction over primitive hooks.
- [x] 2. Explain why custom hooks reuse stateful algorithms, not state instances.
- [x] 3. Prove that custom hooks do NOT allocate child Component Fibers.
- [x] 4. Trace primitive hook allocations into the caller Fiber's `memoizedState` linked list.
- [x] 5. Distinguish between isolated custom hook state, tree-scoped Context, and external stores.
- [x] 6. Diagram the complete execution timeline from event trigger to hook re-run.
- [x] 7. Apply the 5-way decision tree to determine if code belongs in a pure utility, component, hook, or context.
- [x] 8. Diagnose and fix the "Fake Global Singleton" anti-pattern.

---

## 🧪 Interactive Diagnostic Lab
Launch the companion interactive diagnostic lab to visualize dual-caller state isolation and inspect Fiber hook linked lists:
👉 **[🧪 Interactive Custom Hooks Mental Model Lab (Lab 01)](./examples/01-custom-hooks-mental-model-and-logic-reuse.html)**

---

[⬅️ Level 06 Master Hub](../README.md) | [🧪 Companion Lab (Lab 01)](./examples/01-custom-hooks-mental-model-and-logic-reuse.html) | [Next Part (02: Hook Composition & Rules) ➡️](./02-custom-hook-api-contracts.md)
