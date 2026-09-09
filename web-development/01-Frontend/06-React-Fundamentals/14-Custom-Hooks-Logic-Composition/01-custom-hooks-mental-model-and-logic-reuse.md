# Level 06 — React Fundamentals
# KPI 14 — Custom Hooks & Logic Composition
## PART 01 — Custom Hooks Mental Model & Logic Reuse

[⬅️ Previous KPI (11: Context & Dependency Distribution)](../11-Context-Dependency-Distribution/16-context-dependency-distribution-final-review-mastery.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab (Lab 01)](./examples/01-custom-hooks-mental-model-and-logic-reuse.html) | [Next Part (02: Hook Composition & Rules of Hooks) ➡️](./02-hook-composition-and-the-rules-of-hooks.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)  
> **Co-Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)

---

### 🏛️ Core Architectural Thesis
> **A custom Hook is NOT a component, NOT a shared-state container, and NOT merely a syntax trick to reduce duplicated lines of code. It is a reusable composition boundary for React-aware behavior. Its state remains strictly associated with the individual component Fiber invocation that executes the Hook.**

---

## LAYER 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

### 1. Executive Summary
A custom Hook is a JavaScript function whose implementation composes React primitive Hooks (`useState`, `useReducer`, `useEffect`, `useRef`, `useMemo`, `useCallback`, `useContext`, `useSyncExternalStore`) and exposes a reusable behavioral API.

```text
====================================================================================================
                              CUSTOM HOOK COMPOSITION TOPOLOGY
====================================================================================================

      Calling Component Fiber
                │
                ▼
      Custom Hook Invocation: useFeature()
                │
                ├── useState()      ──► Local isolated reactive memory
                ├── useReducer()    ──► Local deterministic transition engine
                ├── useEffect()     ──► External synchronization lifecycle
                ├── useRef()        ──► Mutable instance coordination memory
                ├── useMemo()       ──► Derived computation caching
                ├── useCallback()   ──► Stable command handler identity
                └── useContext()    ──► Ambient tree-scoped dependency resolution
                │
                ▼
        Encapsulated Reactive Behavior
                │
                ▼
        Public Returned API Contract: { data, actions, status }
                │
                ▼
      Consuming Component Renders Virtual DOM
====================================================================================================
```

#### 🚨 The Cardinal Invariant: REUSABLE LOGIC $\neq$ SHARED STATE
Consider the canonical counter hook:
```typescript
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  const increment = useCallback(() => setCount((c) => c + 1), []);
  const decrement = useCallback(() => setCount((c) => c - 1), []);
  const reset = useCallback(() => setCount(initialValue), [initialValue]);

  return { count, increment, decrement, reset };
}
```

When two components invoke `useCounter`:
```tsx
function CounterAlpha() {
  const { count, increment } = useCounter(0);
  return <button onClick={increment}>Alpha: {count}</button>;
}

function CounterBeta() {
  const { count, increment } = useCounter(0);
  return <button onClick={increment}>Beta: {count}</button>;
}
```

```text
                                  useCounter()
                                 /            \
                                /              \
                               ▼                ▼
                         CounterAlpha       CounterBeta
                         (Fiber A)          (Fiber B)
                             │                  │
                             ▼                  ▼
                         [State A]          [State B]
                         (count: 1)         (count: 0)
```

- Clicking `CounterAlpha` increments **State A** to `1`.
- **State B** remains `0`.
- The **implementation** is shared; the **state instances** are completely isolated.

---

### 2. The Architectural Equation
$$\text{Custom Hook Architecture} = \text{Behavior} + \text{State Ownership} + \text{Synchronization} + \text{Dependencies} + \text{Lifetime} + \text{Public API Contract}$$

A senior engineer reasons about all six dimensions. A hook that merely hides 10 lines of code without a coherent behavioral boundary is accidental complexity.

---

### 3. The 5-Way Logic Placement Decision Tree

```text
====================================================================================================
                              LOGIC PLACEMENT DECISION TREE
====================================================================================================

                           Duplicated / Reusable Logic
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
Requires React Primitives?                              Pure Computation?
(state, effects, refs, context)                                   │
            │                                                     ▼
     ┌──────┴──────┐                                     Pure Utility Function
     │             │                                    (e.g., formatCurrency,
    NO            YES                                    calculateTax, sortList)
     │             │
     ▼             ▼
Pure Utility   Requires Shared State Instance
               Across Multiple Consumers?
                           │
                    ┌──────┴──────┐
                    │             │
                   NO            YES
                    │             │
                    ▼             ▼
               Custom Hook   Context Provider / External Store
             (Isolated State) (Single Source of Truth + Hook Gateway)
====================================================================================================
```

---

### 4. Fundamental Distinctions Table

| Concept | What It Actually Represents | What It Does NOT Mean |
| :--- | :--- | :--- |
| **Custom Hook** | Reusable composition of React primitives. | A shared global state container. |
| **Hook Invocation** | A function call during a specific Fiber render. | A new component or Fiber node. |
| **Component** | A node in the React reconciliation tree (produces UI). | Just a helper function. |
| **`useState` inside Hook** | State allocated on the **caller's** Fiber Hook linked list. | State shared across all callers. |
| **`useRef` inside Hook** | Mutable memory tied to the **caller's** instance. | Global shared mutable reference. |
| **`useEffect` inside Hook** | Synchronization tied to the **caller's** mount/update/unmount. | App-wide background worker. |
| **Context in Hook** | Consuming an ambient dependency from the tree. | State generated by the hook itself. |
| **Utility Function** | Framework-independent deterministic computation. | A React lifecycle participant. |
| **External Store** | State owned independently of the React tree. | A standard local hook. |
| **Hook Return Value** | Consumer-facing semantic capability contract. | The internal state structure. |

---

### 5. What Makes a Function a Custom Hook?
By convention and compiler invariant:
1. Its name **must start with `use`** followed by a capital letter (`useToggle`, `useOnlineStatus`).
2. It **calls other React Hooks** internally.
3. It **obeys the Rules of Hooks** (never called conditionally, in loops, or in nested functions).
4. It encapsulates **reactive behavior** and returns a structured public API.

```tsx
// 1. Synchronization Abstraction
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}

// 2. Local State Abstraction
export function useToggle(initial = false): readonly [boolean, () => void] {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((v) => !v), []);
  return [value, toggle] as const;
}

// 3. Dependency Gateway Abstraction
export function useAuthSession(): AuthSession {
  const session = useContext(AuthContext);
  if (!session) {
    throw new Error('[useAuthSession] Must be used within <AuthProvider>');
  }
  return session;
}
```

---

### 6. A Custom Hook Does NOT Create a Fiber
A critical misunderstanding is assuming custom hooks create sub-fibers in the reconciliation tree:

```text
❌ WRONG MENTAL MODEL:
Counter Component Fiber ──► useCounter Fiber ──► useState Fiber

✅ EXACT FIBER REALITY:
Counter Component Fiber
  └── memoizedState: HookNode #1 (useState: count)
        └── next: HookNode #2 (useCallback: increment)
              └── next: HookNode #3 (useCallback: decrement)
                    └── next: null
```

*The custom Hook function `useCounter()` executes inline during the render phase of `Counter`. Its internal primitive hook calls append directly to `Counter`'s `memoizedState` linked list.*

---

## LAYER 2 — 🔬 Deep Mechanical Breakdown & Fiber Internals

### 7. The State Isolation Algebra
$$\text{Hook State Instance} = \text{Caller Fiber Identity} \times \text{Call Order Index} \times \text{Mount Lifetime}$$

Therefore:
$$\text{Same Hook Implementation} + \text{Distinct Calling Fibers} = \text{Strictly Isolated States}$$

```text
====================================================================================================
                        FIBER HOOK LINKED LIST ALLOCATION
====================================================================================================

 Fiber: <DashboardWidget id="alpha">
   │
   └── memoizedState ──► [Hook 1: useState(0)] ──► [Hook 2: useEffect()] ──► [Hook 3: useRef()]
                                ▲                          ▲                      ▲
                                │                          │                      │
                      useCounter() internals     useAutoSave() internals     usePrevious()

 Fiber: <DashboardWidget id="beta">
   │
   └── memoizedState ──► [Hook 1: useState(0)] ──► [Hook 2: useEffect()] ──► [Hook 3: useRef()]
                                ▲                          ▲                      ▲
                                │                          │                      │
                      (Completely separate)      (Completely separate)  (Completely separate)
====================================================================================================
```

---

### 8. Render Lifecycle & Snapshot Semantics inside Hooks
A custom Hook executes on **every single render** of its calling component. It does **not** "run once."

```text
====================================================================================================
                           EXECUTION TIMELINE PER RENDER
====================================================================================================

 Render #1 (Mount):
   1. Component function executes.
   2. Calls useCounter(0).
   3. React mounts Hook #1 (useState): memoizedState = 0.
   4. Hook returns { count: 0, increment: fn1 }.
   5. Component renders JSX: <button>0</button>.

 User Clicks Increment:
   1. increment() dispatches action: setCount(c => c + 1).
   2. React schedules update lane on Component Fiber.

 Render #2 (Update):
   1. Component function executes again.
   2. Calls useCounter(0) again.
   3. React reads existing Hook #1: processes queued updater -> memoizedState = 1.
   4. Hook returns { count: 1, increment: fn2 }.
   5. Component reconciles JSX: <button>1</button>.
   6. Commit phase mutates host DOM.
====================================================================================================
```

---

### 9. Closures and Temporal Snapshot Models
Custom hooks capture the render snapshot via standard JavaScript lexical scoping.

```tsx
function useStaleIntervalLogger() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      // ⚠️ Closes over `count` from Render #1 (value: 0)
      console.log('Count snapshot:', count);
    }, 1000);
    return () => clearInterval(timer);
  }, []); // Missing [count]

  return { count, setCount };
}
```

```text
Render #1: count = 0 ──► setInterval closes over count: 0 ──► Logs: 0, 0, 0...
Render #2: count = 1 ──► Effect does NOT re-run         ──► Still Logs: 0, 0, 0...
```

#### ✅ Senior Solution: Functional Updates & Latest Ref Pattern
```tsx
export function useLatest<T>(value: T): React.MutableRefObject<T> {
  const ref = useRef<T>(value);
  ref.current = value;
  return ref;
}

export function useResilientInterval(callback: () => void, delayMs: number): void {
  const savedCallback = useLatest(callback);

  useEffect(() => {
    if (delayMs === null || delayMs === undefined) return;
    const tick = () => savedCallback.current();
    const id = setInterval(tick, delayMs);
    return () => clearInterval(id);
  }, [delayMs]);
}
```

---

### 10. The 5 Major Architectural Archetypes of Custom Hooks

```text
====================================================================================================
                            THE 5 CUSTOM HOOK ARCHETYPES
====================================================================================================

 1. LOCAL STATE ABSTRACTIONS
    • Examples: useToggle, useDisclosure, usePagination, useStepWizard
    • Purpose: Encapsulate state transition algebra and expose clean command methods.

 2. SYNCHRONIZATION ABSTRACTIONS
    • Examples: useOnlineStatus, useMediaQuery, useDocumentTitle, useEventListener
    • Purpose: Manage external browser event listeners, subscriptions, and teardown lifecycles.

 3. IMPERATIVE COORDINATION ABSTRACTIONS
    • Examples: usePrevious, useLatest, useAnimationFrame, useIntersectionObserver
    • Purpose: Coordinate refs, hardware clocks, DOM measurements, and frame scheduling.

 4. DEPENDENCY GATEWAYS
    • Examples: useAuthSession, useWorkspaceTheme, useFeatureFlag
    • Purpose: Encapsulate Context consumption with fail-fast runtime invariant assertions.

 5. DOMAIN INTERACTION CONTROLLERS
    • Examples: useCheckoutEngine, useCanvasDrawing, useSearchWorkflow
    • Purpose: Coordinate multi-stage asynchronous workflows, validation schemas, and mutations.
====================================================================================================
```

---

### 11. TypeScript Contracts: Tuples vs Object Return Signatures

#### Pattern A: Readonly Tuple (for single-purpose primitive hooks)
```typescript
export function useCounter(initial = 0): readonly [number, () => void, () => void] {
  const [count, setCount] = useState(initial);
  const inc = useCallback(() => setCount((c) => c + 1), []);
  const dec = useCallback(() => setCount((c) => c - 1), []);
  return [count, inc, dec] as const;
}

// Caller can rename easily:
// const [page, nextPage, prevPage] = useCounter(1);
```

#### Pattern B: Semantic Object Contract (Gold Standard for Multi-Member APIs)
```typescript
export interface DisclosureController {
  readonly isOpen: boolean;
  readonly open: () => void;
  readonly close: () => void;
  readonly toggle: () => void;
  readonly setOpen: (open: boolean) => void;
}

export function useDisclosure(initialState = false): DisclosureController {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const setOpen = useCallback((val: boolean) => setIsOpen(val), []);

  return useMemo(
    () => ({ isOpen, open, close, toggle, setOpen }),
    [isOpen, open, close, toggle, setOpen]
  );
}
```

---

## LAYER 3 — 🛠️ Production Crucibles & Anti-Patterns

### 12. Anti-Pattern Matrix: Common Pitfalls & Senior Refactoring

| Anti-Pattern | Root Mechanical Defect | Architectural Damage | Senior Refactoring |
| :--- | :--- | :--- | :--- |
| **"Hook for Pure Math"** | Calling `useTax(price)` for `price * 0.18`. | Unnecessary React hook overhead; un-testable in pure JS. | Convert to pure utility function `calculateTax(price)`. |
| **"Shared State Illusion"** | Expecting `useUser()` to share state across components. | Each component creates independent state; UI sync breaks. | Wrap in `<AuthProvider>` with Context or External Store. |
| **"The God Hook"** | `useApp()` managing auth, theme, cart, search, routing. | Massive blast radius; any change forces all callers to re-render. | Segment into single-responsibility domain hooks. |
| **"Leaky Internals"** | Returning `dispatch`, `abortControllerRef`, `internalId`. | Consumers become tightly coupled to internal implementation. | Expose semantic commands (`cancelSearch()`, `save()`). |
| **"Hook-Per-Component"** | Creating `useHeaderLogic()` used only in `Header.tsx`. | Fragmentation; moves code without creating real reuse. | Keep inline unless isolating complex state machine. |
| **"Generic `setState` Leak"** | Returning `{ state, setState }` from domain hook. | Bypasses domain invariant rules and validation logic. | Expose explicit semantic actions (`addItem`, `removeDiscount`). |

---

### 13. Production Crucible 1: The "Shared State Illusion" Breakdown

#### ❌ Flawed Code:
```tsx
// Developer assumed calling this hook shares the user across the app
export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  
  const login = async (creds: Credentials) => {
    const data = await authApi.login(creds);
    setUser(data);
  };

  return { user, login };
}

// In Header.tsx:
const { user } = useCurrentUser(); // Has User Instance #1

// In Profile.tsx:
const { user, login } = useCurrentUser(); // Has User Instance #2 (user is null!)
```

#### ✅ Senior Refactoring: Context Gateway Hook
```tsx
const UserContext = createContext<{
  user: User | null;
  login: (c: Credentials) => Promise<void>;
  logout: () => void;
} | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const login = useCallback(async (c: Credentials) => {
    const data = await authApi.login(c);
    setUser(data);
  }, []);
  const logout = useCallback(() => setUser(null), []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useCurrentUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('[useCurrentUser] Invariant: Must be used within <UserProvider>');
  }
  return ctx;
}
```

---

### 14. Production Crucible 2: Refactoring a Monolithic "God Hook"

```text
====================================================================================================
                                  GOD HOOK DECOMPOSITION
====================================================================================================

 ❌ FLAWED MONOLITH:
 useDashboardEngine() ──► [Auth + Theme + Grid Data + Cursors + Notifications + Filter State]

 ✅ SENIOR ARCHITECTURAL DECOMPOSITION:
 ├── useAuthSession()       ──► (Context Gateway)
 ├── useWorkspaceTheme()    ──► (Ambient Context)
 ├── useGridData(query)     ──► (Data Fetching / SWR Hook)
 ├── useCursorStream()      ──► (useSyncExternalStore High-Frequency Socket)
 ├── useNotificationQueue() ──► (Global Command Gateway)
 └── useFilterState()       ──► (Local Component State Machine)
====================================================================================================
```

---

## LAYER 4 — 🧪 Senior Diagnostic Gauntlet & Master Checklist

### 15. Senior Diagnostic Runbook for Custom Hooks
When diagnosing a malfunctioning or slow custom Hook:

```text
Step 1: Check Caller Fiber Identity (Which component instances invoke the hook?)
Step 2: Inspect Hook State Isolation (Are callers expecting shared state without a Provider?)
Step 3: Verify Call Order Invariants (Is the hook called conditionally or inside loops?)
Step 4: Audit Closure Snapshots (Are handlers reading stale state snapshots due to missing deps?)
Step 5: Inspect Effect Teardown (Are event listeners / WebSockets cleaned up on unmount?)
Step 6: Measure Re-render Latency (Are return objects/functions re-created without memoization?)
Step 7: Probe Public API Seam (Is the hook leaking refs, dispatchers, or raw flags?)
Step 8: Check Memory Lifecycles (Are subscriptions holding unmounted component references?)
```

---

### 16. 50-Point Master Custom Hook Architecture Checklist

- [x] 1. Define custom Hooks as reusable behavioral composition boundaries.
- [x] 2. Understand that custom Hooks do not create separate Fiber nodes.
- [x] 3. Distinguish Hook function execution (per render) from state persistence (across renders).
- [x] 4. Prove that two callers of the same hook receive independent state instances.
- [x] 5. Apply the 5-way logic placement decision tree before writing a hook.
- [x] 6. Separate pure utility functions (`formatDate`) from React-aware hooks (`useInterval`).
- [x] 7. Follow the `use` naming convention for React compiler lint compatibility.
- [x] 8. Strictly maintain Hook call order invariants (no conditional hook execution).
- [x] 9. Use functional state updaters (`setState(prev => ...)`) for robust state transitions.
- [x] 10. Understand render snapshot closures inside custom hook callbacks.
- [x] 11. Implement the `useLatest` ref pattern to eliminate stale closure bugs.
- [x] 12. Build Local State abstractions (`useToggle`, `useDisclosure`).
- [x] 13. Build Synchronization abstractions (`useOnlineStatus`, `useMediaQuery`).
- [x] 14. Build Imperative Coordination abstractions (`usePrevious`, `useIntersectionObserver`).
- [x] 15. Build Dependency Gateways (`useAuthSession`, `useTheme`).
- [x] 16. Build Domain Interaction Controllers (`useSearchWorkflow`, `useCheckout`).
- [x] 17. Return `readonly [T, Action]` tuples for simple dual-value abstractions.
- [x] 18. Return structured TypeScript interfaces for multi-member capability contracts.
- [x] 19. Memoize returned object literals using `useMemo` when referential stability is required.
- [x] 20. Wrap exposed command handlers in `useCallback`.
- [x] 21. Hide internal state transition mechanics (reducers, actions) behind semantic methods.
- [x] 22. Avoid returning raw `dispatch` or generic `setState` functions.
- [x] 23. Add runtime fail-fast invariant guards to Context gateway hooks.
- [x] 24. Prevent the "Shared State Illusion" by pairing hooks with Providers when needed.
- [x] 25. Deconstruct monolithic "God Hooks" into single-responsibility units.
- [x] 26. Avoid extracting hooks for single-component non-reusable UI logic.
- [x] 27. Ensure effect cleanups release browser event listeners, sockets, and timers.
- [x] 28. Use generic type parameters (`useSelection<T>(items: T[])`) for reusable contracts.
- [x] 29. Use discriminated unions for asynchronous lifecycle states (`idle | loading | success | error`).
- [x] 30. Ensure hook parameter changes trigger appropriate effect re-synchronization.
- [x] 31. Coordinate hardware timers (`requestAnimationFrame`) cleanly via hooks.
- [x] 32. Isolate high-frequency stream coordination in external stores or refs.
- [x] 33. Avoid mutating ref parameters directly inside render phases.
- [x] 34. Ensure custom hooks work identically in strict mode (resilient to double-mount).
- [x] 35. Prevent memory leaks from async promise completions on unmounted components.
- [x] 36. Test custom hooks in isolation using `@testing-library/react-hooks` or `renderHook`.
- [x] 37. Test unmount lifecycles explicitly to verify complete resource cleanup.
- [x] 38. Mock external browser APIs (`matchMedia`, `ResizeObserver`) during hook tests.
- [x] 39. Validate hook return type inference in strict TypeScript configurations.
- [x] 40. Keep pure domain math out of hook bodies to preserve universal testability.
- [x] 41. Design composable hooks that can accept other hooks' return values as inputs.
- [x] 42. Prevent circular dependencies between composed custom hooks.
- [x] 43. Maintain explicit dependency arrays for all internal `useEffect` and `useMemo` calls.
- [x] 44. Audit re-render cascades using React DevTools Profiler.
- [x] 45. Never call custom hooks inside standard utility functions or event callbacks.
- [x] 46. Ensure custom hooks handle `undefined` or `null` configuration options safely.
- [x] 47. Abstract complex browser Web APIs behind clean, idiomatic React interfaces.
- [x] 48. Enforce clear boundary contracts between UI components and custom hook controllers.
- [x] 49. Benchmark custom hook memory allocations across 1,000+ simultaneous instances.
- [x] 50. Defend and explain custom hook architecture decisions in senior engineering reviews.

---

## 🧪 Interactive Companion Diagnostic Lab
Open the standalone interactive HTML laboratory to explore live state isolation, execution timelines, and diagnostic gauntlets:
👉 **[🧪 Interactive Custom Hooks Mental Model Lab (Lab 01)](./examples/01-custom-hooks-mental-model-and-logic-reuse.html)**

---

[⬅️ Previous KPI (11: Context & Dependency Distribution)](../11-Context-Dependency-Distribution/16-context-dependency-distribution-final-review-mastery.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab (Lab 01)](./examples/01-custom-hooks-mental-model-and-logic-reuse.html) | [Next Part (02: Hook Composition & Rules of Hooks) ➡️](./02-hook-composition-and-the-rules-of-hooks.md)
