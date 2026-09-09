# Level 06 — React Fundamentals
# KPI 14 / KPI 12 — Custom Hooks & Logic Composition
## PART 01 — Custom Hooks Mental Model & Logic Reuse

[⬅️ Level 06 Master Hub](../README.md) | [🧪 Companion Lab (Lab 01)](./examples/01-custom-hooks-mental-model-and-logic-reuse.html) | [Next Part (02: Hook Composition & Rules) ➡️](./02-hook-composition-and-the-rules-of-hooks.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)  
> **Co-Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)

---

### Core Architectural Thesis
> **A custom Hook is not a component, not a shared-state container, and not merely a way to reduce duplicated lines of code. It is a reusable composition boundary for React behavior. Its state remains associated with the component invocation that executes the Hook.**

---

## Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

### 1. Executive Summary
A custom Hook is a JavaScript function whose implementation composes React Hooks and exposes a reusable behavioral API.

```text
====================================================================================================
                        CUSTOM HOOK EXECUTION & COMPOSITION TOPOLOGY
====================================================================================================

 Component
    │
    ▼
 Custom Hook Invocation
    │
    ├── useState()
    ├── useReducer()
    ├── useEffect()
    ├── useRef()
    ├── useMemo()
    ├── useCallback()
    └── useContext()
    │
    ▼
 Reusable Behavior
    │
    ▼
 Returned API
    │
    ▼
 Component Output
====================================================================================================
```

$$\text{Critical Architectural Invariant: } \mathbf{\text{REUSABLE LOGIC } \neq \text{ SHARED STATE}}$$

Suppose:
```typescript
function useCounter() {
  const [count, setCount] = useState(0);
  return {
    count,
    increment: () => {
      setCount((value) => value + 1);
    },
  };
}
```

Two components can use the same Hook:
```tsx
function FirstCounter() {
  const counter = useCounter();
  return <button onClick={counter.increment}>{counter.count}</button>;
}

function SecondCounter() {
  const counter = useCounter();
  return <button onClick={counter.increment}>{counter.count}</button>;
}
```

They share the implementation:
```text
           useCounter()
          /            \
         /              \
        ▼                ▼
   FirstCounter     SecondCounter
        │                │
        ▼                ▼
     State A          State B
```

They do **not** share the same state instance. After incrementing the first:
$$\text{FirstCounter} \to 1 \quad \text{vs} \quad \text{SecondCounter} \to 0$$

---

### 2. Architectural Equation

$$\text{Custom Hook Architecture} = \text{Behavior} + \text{State Ownership} + \text{Synchronization} + \text{Dependencies} + \text{Lifetime} + \text{Public API}$$

A Hook that merely removes duplicated code is not necessarily a good abstraction. A senior engineer must reason about all six factors.

---

### 3. The Five-Way Logic Placement Decision

```text
====================================================================================================
                              FIVE-WAY LOGIC PLACEMENT DECISION TREE
====================================================================================================

 Does the logic require React lifecycle / state / context / refs?
             │
      ┌──────┴──────┐
      │             │
     NO            YES
      │             │
      ▼             ▼
 Pure utility   Candidate custom Hook
                    │
                    ▼
          Does it need shared state across multiple callers?
                    │
             ┌──────┴──────┐
             │             │
            NO            YES
             │             │
             ▼             ▼
        CUSTOM HOOK    Context / External Store
====================================================================================================
```

---

### 4. Fundamental Distinctions Table

| Concept | What It Actually Represents | What It Does NOT Mean |
| :--- | :--- | :--- |
| **Custom Hook** | Reusable Hook composition boundary | Shared state container |
| **Hook Invocation** | One execution of the Hook for a caller | A new component or Fiber |
| **Component** | React component identity and UI boundary | Merely a function call |
| **`useState` inside Hook** | State associated with caller's Hook position | Global state |
| **`useRef` inside Hook** | Mutable instance memory associated with caller | Shared mutable memory |
| **`useEffect` inside Hook** | Synchronization owned by caller's Hook lifecycle | Generic post-render callback |
| **Context Consumed by Hook** | Dependency distributed through React tree | State created by the Hook |
| **Utility Function** | Pure/general reusable computation | React lifecycle abstraction |
| **External Store** | Independently owned subscribable state | A custom Hook |
| **Hook Return Value** | Consumer-facing API | Shared state container |

---

### 5. The Most Important Mental Model
Never reason about `useCounter()` as if it were a singleton. Instead reason:
```text
Component Instance ──► Hook Invocation ──► Hook State Memory
```

Thus:
```text
Component A ──► useCounter() ──► Hook State A
Component B ──► useCounter() ──► Hook State B
```
*The implementation is shared; the Hook state is isolated.*

---

### 6. What Makes a Function a Custom Hook?
Conventionally, a custom Hook:
1. Begins with `use` (e.g. `useToggle`, `useAuth`).
2. Calls other primitive or custom Hooks.
3. Obeys the Rules of Hooks (unconditional call order).
4. Encapsulates reusable reactive behavior.
5. Exposes an intention-revealing consumer API.

```typescript
// 1. Synchronization abstraction
function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

// 2. Local state abstraction
function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = () => setValue((current) => !current);
  return { value, toggle };
}

// 3. Dependency gateway
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```
*Custom Hook is not an architectural category—it is a composition mechanism.*

---

### 7. A Custom Hook Does NOT Create a Fiber

```text
❌ WRONG MENTAL MODEL:
Counter Fiber ──► useCounter Fiber ──► useState

✅ CORRECT FIBER REALITY:
Counter Fiber
    │
    └── Hook list (memoizedState)
            │
            ├── useState (from useCounter)
            └── ...
```

`useCounter()` is a plain JavaScript function executing during the render pass of `Counter`. The primitive `useState()` call inside it participates directly in the Hook linked list of the calling component.

---

### 8. Custom Hooks Are Composition
```typescript
function useSearch(query: string) {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => { /* fetch logic */ }, [query]);
  return { results, loading };
}

function useSearchPage(query: string) {
  const search = useSearch(query);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return { ...search, selectedId, setSelectedId };
}
```

```text
Component ──► useSearchPage ──► useSearch ──► useState(results)
                                         ├── useState(loading)
                                         └── useEffect()
                           ──► useState(selectedId)
```

---

### 10. The State Isolation Algebra
$$\text{Hook Implementation} + \text{Caller Fiber} + \text{Hook Position} = \text{Hook State Instance}$$

Therefore:
$$\text{Same Hook Implementation} + \text{Different Caller} = \text{Different Hook State Instance}$$

---

## Layer 2 — 🔬 Deep Mechanical Breakdown & Fiber Internals

### 52. Fiber Association and the `memoizedState` Linked List
At runtime, a React Function Component Fiber stores its hooks as a singly-linked list on `Fiber.memoizedState`.

```text
FunctionComponent Fiber
    │
    └── memoizedState ──► [Hook Node 1] ──► [Hook Node 2] ──► [Hook Node 3]
                             │                 │                 │
                             ▼                 ▼                 ▼
                        useState(0)       useEffect(...)     useRef(null)
```

Each Hook node contains:
```typescript
interface Hook {
  memoizedState: any;       // Current state snapshot (e.g. 0)
  baseState: any;           // Base state for update queues
  baseQueue: Update<any> | null;
  queue: UpdateQueue<any> | null; // Queued dispatches
  next: Hook | null;        // Pointer to next hook in sequence
}
```

---

### 58. Update Timeline: From Action Dispatch to Re-execution

```text
====================================================================================================
                        CUSTOM HOOK UPDATE & SNAPSHOT TIMELINE
====================================================================================================

 1. USER INTERACTION
    User clicks <button onClick={counter.increment}>
    Calls setCount(current => current + 1)

 2. UPDATE QUEUE DISPATCH
    React enqueues update on Hook Node 1's queue
    Schedules update lane on the calling Component Fiber.

 3. COMPONENT RERENDER PASS
    Calling Component re-executes its function body
    Executes useCounter() again
    updateWorkInProgressHook() advances pointer on Fiber.memoizedState
    Calculates next state: count = 1
    useCounter returns new snapshot: { count: 1, increment }

 4. RECONCILIATION & COMMIT
    Component returns updated JSX with count = 1
    Reconciler diffs Virtual DOM and commits DOM update.
====================================================================================================
```

---

### 60. State Isolation Example With Two Fibers

```tsx
function App() {
  return (
    <>
      <Counter />
      <Counter />
    </>
  );
}
```

```text
Counter Fiber A (Instance A) ──► useCounter() ──► count A = 0
Counter Fiber B (Instance B) ──► useCounter() ──► count B = 0

Click Counter A:
Counter Fiber A (Instance A) ──► useCounter() ──► count A = 1
Counter Fiber B (Instance B) ──► useCounter() ──► count B = 0 (Untouched)
```

---

### 67. TypeScript Behavioral Contracts
A strong Hook API describes semantics rather than internal implementation machinery.

```typescript
// ✅ Good: Semantic Behavioral Contract
export interface DisclosureModel {
  readonly isOpen: boolean;
  readonly open: () => void;
  readonly close: () => void;
  readonly toggle: () => void;
}

export function useDisclosure(initial = false): DisclosureModel {
  const [isOpen, setIsOpen] = useState(initial);
  
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
}
```

---

## Layer 3 — 🛠️ Production Crucibles & Anti-Patterns

### 41. Production Incident: "Our Shared Hook Isn't Shared"
- **Symptom:** Header, Profile, and Sidebar all call `useUser()` but show different user names after login.
- **Flawed Code:**
  ```tsx
  // ❌ WRONG: Local useState inside custom hook does NOT share state
  export function useUser() {
    const [user, setUser] = useState<User | null>(null);
    return { user, setUser };
  }
  ```
- **Root Cause:** Each component gets its own independent `useState` instance.
- **Refactoring:** Establish a single authoritative Provider and use the Hook as a gateway:
  ```tsx
  // ✅ REFACTORED: Context Provider + Gateway Hook
  const UserContext = createContext<{ user: User | null; setUser: (u: User) => void } | null>(null);

  export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
  }

  export function useUser() {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser must be used within UserProvider');
    return context;
  }
  ```

---

### 43. Anti-Pattern: The God Hook
```tsx
// ❌ FLAWED: All domains dumped into one monster hook
export function useApplication() {
  // auth, theme, cart, notifications, search, modal, analytics, forms, websocket
}
```
*Refactoring:* Split by semantic ownership (`useAuth`, `useCart`, `useSearch`, `useModal`).

---

## Layer 4 — 🧪 Senior Diagnostic Gauntlet & Master Checklist

### 87. Senior Interview Gauntlet: Core Questions & Answers

#### Q1: "What is a custom Hook under the hood?"
> **Staff-level Answer:** A custom Hook is a standard JavaScript function that composes primitive React Hooks (`useState`, `useEffect`, `useRef`, `useContext`). It executes synchronously during its caller's render pass and does not create an independent component Fiber. All Hook allocations append directly to the caller Fiber's `memoizedState` linked list.

#### Q2: "Do two components calling the same custom Hook share state?"
> **Staff-level Answer:** No. Calling the same custom Hook reuses the behavioral logic and transition algebra, but allocates completely isolated state memory slots in each calling component's Fiber.

#### Q3: "When should logic be a pure utility function versus a custom Hook?"
> **Staff-level Answer:** If the logic does not require React lifecycle primitives (state, effects, context, refs), it should remain a pure utility function. Introducing a custom Hook for pure math or string formatting adds unnecessary Hook overhead without reactive benefit.

---

### 88. 50-Point Senior Architectural Checklist

- [x] 1. Define a custom Hook as a behavioral composition boundary.
- [x] 2. Prove that custom Hooks do NOT allocate child component Fibers.
- [x] 3. Distinguish Hook execution (per render) from Hook state persistence (across renders).
- [x] 4. Prove that Reusable Logic $\neq$ Shared State.
- [x] 5. Trace primitive hook allocations into the caller Fiber's `memoizedState` linked list.
- [x] 6. Understand render snapshots and JavaScript closure semantics inside Hooks.
- [x] 7. Apply the 5-way decision tree (Utility vs Component vs Hook vs Context vs Store).
- [x] 8. Recognize and dismantle "God Hooks".
- [x] 9. Hide internal machinery (`refs`, `AbortController`, `dispatch`) behind semantic APIs.
- [x] 10. Diagnose and remediate the "Fake Shared Hook" anti-pattern.

---

## 🧪 Interactive Diagnostic Lab
Launch the companion interactive diagnostic lab to test dual-caller state isolation and inspect Fiber hook linked lists:
👉 **[🧪 Interactive Custom Hooks Mental Model Lab (Lab 01)](./examples/01-custom-hooks-mental-model-and-logic-reuse.html)**

---

[⬅️ Level 06 Master Hub](../README.md) | [🧪 Companion Lab (Lab 01)](./examples/01-custom-hooks-mental-model-and-logic-reuse.html) | [Next Part (02: Hook Composition & Rules) ➡️](./02-hook-composition-and-the-rules-of-hooks.md)
