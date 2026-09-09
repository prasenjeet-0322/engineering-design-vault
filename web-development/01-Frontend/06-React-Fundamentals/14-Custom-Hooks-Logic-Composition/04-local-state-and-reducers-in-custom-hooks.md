# Level 06 — React Fundamentals
## KPI 14 — Custom Hooks & Logic Composition
### PART 04 — Managing Local State & Reducers in Custom Hooks

[⬅️ Previous Part](./03-api-design-contracts-tuples-vs-objects.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](./examples/04-managing-local-state-and-reducers-in-custom-hooks.html) | [Next Part ➡️](./05-effects-lifecycle-and-cleanup-in-hooks.md)

---

**Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
**Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)  
**Co-Author:** Prasenjeet (Mid-Level Full Stack Developer)  

---

```
====================================================================================================
                LOCAL STATE & REDUCER COMPOSITION IN CUSTOM HOOKS
====================================================================================================

         +-------------------------------------------------------------------------+
         |                    COMPONENT INSTANCE (CALLING FIBER)                   |
         |                                                                         |
         |   Fiber.memoizedState linked list allocates Hook nodes per instance:    |
         |                                                                         |
         |   +-------------------+    next    +-------------------+    next        |
         |   | Hook 1: useState  | ---------> | Hook 2: useReducer| ---------> ... |
         |   | [memoizedState: 0]|            | [memoizedState: S]|                |
         |   +-------------------+            +-------------------+                |
         +------------------------------------+------------------------------------+
                                              |
                                              | Encapsulated Private Mechanics
                                              v
         +-------------------------------------------------------------------------+
         |                           CUSTOM HOOK BOUNDARY                          |
         |                                                                         |
         |   • Owns state transition algebra & domain validation                   |
         |   • Wraps raw 'setState' & 'dispatch' into high-level semantic commands |
         |   • Prevents external consumers from violating internal invariants      |
         +------------------------------------+------------------------------------+
                                              |
                                              | Public Return Contract
                                              v
         +-------------------------------------------------------------------------+
         |                        SEMANTIC PUBLIC INTERFACE                        |
         |                                                                         |
         |   const { status, data, submit, retry, reset } = useAsyncController();   |
         |   (No leaked 'dispatch', no arbitrary mutations, 100% type-safe)        |
         +-------------------------------------------------------------------------+
```

---

## Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

### 1. Executive Summary
A custom Hook becomes architecturally valuable when it encapsulates **stateful behavior and transition invariants**, not merely when it acts as a trivial syntactic wrapper around `useState`.

The central architectural axiom that every senior engineer must internalize is:

$$\text{Custom Hook} \neq \text{Shared State}$$
$$\text{Custom Hook} = \text{Reusable Stateful Logic \& Independent State Allocation}$$

Every invocation of a custom Hook allocates its own private state nodes on the **calling component's Fiber instance**. 

```tsx
function useCounter(initial: number = 0) {
  const [count, setCount] = useState<number>(initial);
  return { 
    count, 
    increment: () => setCount(x => x + 1) 
  };
}

// In Consumer Component A:
function ComponentA() {
  const counterA = useCounter(0); // Allocates Hook on Fiber A
}

// In Consumer Component B:
function ComponentB() {
  const counterB = useCounter(0); // Allocates Hook on Fiber B
}
```

```
   Component A Fiber                          Component B Fiber
          │                                          │
          ▼ memoizedState                            ▼ memoizedState
   ┌──────────────┐                           ┌──────────────┐
   │ Hook node #1 │                           │ Hook node #1 │
   │ count = 0    │                           │ count = 0    │
   └──────────────┘                           └──────────────┘
```

**The Hook implementation logic is shared across the codebase. The runtime state is completely isolated per component instance.**

---

### 2. Architectural Equation

$$\text{Stateful Custom Hook} = \text{State Ownership} + \text{Transition Semantics} + \text{Encapsulation} + \text{Public Contract} + \text{Render Integration}$$

#### Path A: Simple Independent State
$$\text{useState} \longrightarrow \text{Local Primitive State} \longrightarrow \text{Direct Setters / Simple Commands} \longrightarrow \text{Public Contract}$$

#### Path B: Complex Coupled State Transitions
$$\text{useReducer} \longrightarrow \text{Explicit State Transition Algebra} \longrightarrow \text{Private Actions} \longrightarrow \text{Semantic Domain Commands} \longrightarrow \text{Public Contract}$$

---

### 3. Core Mental Model

```
                  +----------------------------------------------+
                  |            CALLING COMPONENT FIBER           |
                  +----------------------+-----------------------+
                                         |
                                         v memoizedState
                             +-----------------------+
                             |   Hook Linked List    |
                             +-----------+-----------+
                                         |
                         +---------------+---------------+
                         |                               |
                         v                               v
              +---------------------+         +---------------------+
              | Hook 1: useState    |         | Hook 2: useReducer  |
              | (Local Primitive)   |         | (State Machine)     |
              +----------+----------+         +----------+----------+
                         |                               |
                         +---------------+---------------+
                                         |
                                         v
                         +-------------------------------+
                         |     CUSTOM HOOK ENCAPSULATION |
                         |    Hides raw dispatch/setters |
                         +---------------+---------------+
                                         |
                                         v
                         +-------------------------------+
                         |     PUBLIC API CONTRACT       |
                         |  { count, submit, reset }     |
                         +---------------+---------------+
                                         |
                                         v
                         +-------------------------------+
                         |      CONSUMER UI WIDGET       |
                         +-------------------------------+
```

The custom Hook represents the **behavioral boundary**. The calling component's Fiber represents the **state ownership boundary**.

---

### 4. The Five Questions Before Choosing `useState` or `useReducer`

Before introducing a reducer into a custom Hook, evaluate these 5 criteria:

1. **How many independent pieces of state exist?** Are they isolated primitives, or do they describe facets of a single logical domain entity?
2. **How are those pieces mutated?** Do updates happen independently in response to separate events, or do single events require coordinated, multi-field atomic updates?
3. **Are transitions coupled?** Does changing `status` to `"loading"` require simultaneously clearing `error` and preserving previous `data`?
4. **Are there meaningful domain events?** Does the system respond to clear domain verbs (`SUBMIT_PAYMENT`, `CANCEL_ORDER`, `RETRY_UPLOAD`) rather than arbitrary assignments?
5. **Would a reducer make invariants easier to express and protect?** Does a centralized `(state, action) => nextState` pure function make invalid UI states unrepresentable?

> **Senior Warning:** Never choose a reducer simply because *"the component file has reached 200 lines."* The true metric is **transition complexity and invariant coupling**, not line count.

---

### 5. `useState` Mental Model

Use `useState` when state transitions are direct, atomic, and independent:

```tsx
const [isOpen, setIsOpen] = useState<boolean>(false);
```

```
  Current State
        │
        ▼ setter execution
  setIsOpen(true);  OR  setIsOpen(prev => !prev);
        │
        ▼
   Next State
```

When state transitions are pure direct replacements without multi-field ripple effects, `useState` is the cleanest, most performant, and most idiomatic representation.

---

### 6. `useReducer` Mental Model

`useReducer` introduces an explicit, centralized **state transition algebra**:

```
      Current State (S)  +  Dispatched Action (A)
                     │
                     ▼
             Reducer Function
        (S, A) => Next State (S')
                     │
                     ▼
              Next State (S')
```

```tsx
type CounterState = { readonly count: number };
type CounterAction = 
  | { readonly type: "INCREMENT"; readonly step?: number }
  | { readonly type: "DECREMENT"; readonly step?: number }
  | { readonly type: "RESET" };

function counterReducer(state: CounterState, action: CounterAction): CounterState {
  switch (action.type) {
    case "INCREMENT":
      return { count: state.count + (action.step ?? 1) };
    case "DECREMENT":
      return { count: state.count - (action.step ?? 1) };
    case "RESET":
      return { count: 0 };
    default:
      return state;
  }
}
```

The reducer makes the transition vocabulary explicit, centralized, testable in pure unit tests, and decoupled from React render loops.

---

### 7. The Critical Distinction

| Feature | `useState` Contract | `useReducer` Contract |
| :--- | :--- | :--- |
| **Philosophical Model** | "Here is the state and a setter to request its replacement." | "Here is the state and a formal event transition system." |
| **Transition Logic** | Distributed across event handlers and UI callbacks. | Centralized in a single pure transition function. |
| **Coupled State Updates**| Requires multiple sequential `setState` calls or object spreads. | Single atomic action updates all related fields at once. |
| **Unit Testability** | Hard to test state transitions without mounting a component. | Reducer can be 100% unit-tested as a pure function in Node/Vitest. |
| **Action Logging / Auditing** | Difficult (setters have no action types). | Trivial (actions carry explicit semantic metadata). |
| **Mental Overhead** | Low (minimal boilerplate). | Medium (requires action types, switch blocks, reducer typing). |

Neither primitive is inherently superior. A Staff Engineer selects based on **state relationship topology and transition coupling**.

---

## Layer 2 — 🔬 Deep Mechanical Breakdown & Fiber Internals

### 8. Custom Hook Invocation Mechanics

Consider a custom Hook and a consuming component:

```tsx
function useCounter(initialValue: number = 0) {
  const [count, setCount] = useState<number>(initialValue);
  const increment = useCallback(() => setCount(c => c + 1), []);
  return { count, increment };
}

function CounterWidget() {
  const { count, increment } = useCounter(10);
  return <button onClick={increment}>Count: {count}</button>;
}
```

When React executes `CounterWidget`:
1. React enters the component render function on the `CounterWidget` Fiber.
2. `useCounter(10)` is invoked as a standard JavaScript function.
3. Inside `useCounter`, `useState(10)` runs and invokes React's current dispatcher (`ReactCurrentDispatcher.current.useState`).
4. React allocates or retrieves the corresponding `Hook` object on `CounterWidget.memoizedState`.
5. The returned object `{ count, increment }` is constructed and handed back to `CounterWidget`.

```
CounterWidget Render Execution
       │
       ▼ calls
useCounter(10)
       │
       ▼ calls
useState(10) ──> ReactCurrentDispatcher attaches Hook #1 to CounterWidget Fiber
```

There is **no separate Fiber** created for `useCounter`. The Hook's state resides physically inside the caller's Fiber.

---

### 9. Fiber Hook Linked List Architecture

Inside React's internal reconciler, every Fiber node contains a `memoizedState` pointer referencing the head of a singly linked list of `Hook` records:

```
                  CounterWidget Fiber Record
               +------------------------------+
               | tag: FunctionComponent (0)   |
               | type: CounterWidget          |
               | memoizedState: ──────────────+────┐
               | updateQueue: null            |    |
               +------------------------------+    |
                                                   v
                                        +──────────────────────+
                                        | Hook Node #1         |
                                        | memoizedState: 10    |
                                        | baseState: 10        |
                                        | queue: UpdateQueue   |
                                        | next: ───────────────+────┐
                                        +──────────────────────+    |
                                                                    v
                                                        +──────────────────────+
                                                        | Hook Node #2         |
                                                        | memoizedState: fn    |
                                                        | next: null           |
                                                        +──────────────────────+
```

Every `useState`, `useReducer`, `useEffect`, or `useRef` call inside any custom Hook traverses this exact linked list by following the `next` pointer in index sequence.

---

### 10. Mount Phase Execution

During the initial mount of the component:
1. `ReactCurrentDispatcher.current` points to `HooksDispatcherOnMount`.
2. Each primitive Hook call creates a new `Hook` record via `mountWorkInProgressHook()`.
3. The initial value is assigned to `hook.memoizedState`.
4. The hook node is appended to the tail of the Fiber's linked list.

```tsx
// React Reconciler Mount Mental Model:
function mountState<S>(initialState: S): [S, Dispatch<BasicStateAction<S>>] {
  const hook = mountWorkInProgressHook();
  hook.memoizedState = hook.baseState = typeof initialState === 'function' ? initialState() : initialState;
  const queue = (hook.queue = { pending: null, dispatch: null, lastRenderedReducer: basicStateReducer, lastRenderedState: hook.memoizedState });
  const dispatch = (queue.dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue));
  return [hook.memoizedState, dispatch];
}
```

---

### 11. Update Phase Execution

During subsequent re-renders:
1. `ReactCurrentDispatcher.current` switches to `HooksDispatcherOnUpdate`.
2. React traverses the existing linked list node by node using `updateWorkInProgressHook()`.
3. Any queued state updates or dispatched actions are processed in order.
4. `hook.memoizedState` is computed and updated.

```tsx
// React Reconciler Update Mental Model:
function updateReducer<S, I, A>(reducer: (S, A) => S, initialArg: I): [S, Dispatch<A>] {
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;
  let baseState = hook.baseState;
  let firstUpdate = queue.pending;

  if (firstUpdate !== null) {
    // Process circular pending update queue
    let update = firstUpdate.next;
    let newState = baseState;
    do {
      const action = update.action;
      newState = reducer(newState, action);
      update = update.next;
    } while (update !== null && update !== firstUpdate.next);

    hook.memoizedState = newState;
    hook.baseState = newState;
  }

  return [hook.memoizedState, queue.dispatch];
}
```

---

### 12. Unmount & Cleanup Lifecycle

When a component unmounts from the DOM:
1. The Fiber node is marked for deletion by the reconciler.
2. All `useEffect` cleanups associated with the Hook list are executed in reverse order.
3. The Fiber's `memoizedState` linked list is severed, allowing the JavaScript engine's garbage collector to reclaim the allocated memory.
4. Because the custom Hook's state was attached directly to that Fiber, **all state maintained by the custom Hook is automatically destroyed**.

---

### 13. Two Components, Two Hook States

```tsx
function LeftPanel() {
  const { count, increment } = useCounter(0);
  return <button onClick={increment}>Left: {count}</button>;
}

function RightPanel() {
  const { count, increment } = useCounter(0);
  return <button onClick={increment}>Right: {count}</button>;
}
```

```
       LeftPanel Fiber                           RightPanel Fiber
   +----------------------+                  +----------------------+
   | memoizedState        |                  | memoizedState        |
   |   ┌────────────────┐ |                  |   ┌────────────────┐ |
   |   │ Hook 1: count  │ |                  |   │ Hook 1: count  │ |
   |   │ value: 5       │ |                  |   │ value: 0       │ |
   |   └────────────────┘ |                  |   └────────────────┘ |
   +----------------------+                  +----------------------+
```

Clicking `increment` in `LeftPanel` enqueues an update exclusively on `LeftPanel`'s Fiber update queue. `RightPanel`'s Fiber remains completely untouched and does not re-render.

---

### 14. State Isolation Algebra

Let $F_A$ and $F_B$ represent the distinct Fiber nodes for Component $A$ and Component $B$:

$$F_A \neq F_B$$
$$\text{HookStorage}(F_A) \cap \text{HookStorage}(F_B) = \emptyset$$
$$\therefore \text{State}(F_A) \neq \text{State}(F_B)$$

Even though:
$$\text{useCustomHook}_A \equiv \text{useCustomHook}_B \quad (\text{Identical Function Reference})$$

**Code sharing is static; state allocation is dynamic and instance-bound.**

---

### 15. When State Should Be Shared Across Subtrees

If multiple components must coordinate around identical reactive state, do not expect a standard custom Hook alone to share state. You must introduce an explicit state distributor:

```
                      +-----------------------------+
                      |       SHARED STATE OWNER    |
                      |   Context / Zustand / Redux |
                      +--------------+--------------+
                                     |
                     +---------------+---------------+
                     |                               |
                     v                               v
        +-------------------------+     +-------------------------+
        |   Consumer Component A  |     |   Consumer Component B  |
        |   useAuth() (Gateway)   |     |   useAuth() (Gateway)   |
        +-------------------------+     +-------------------------+
```

A custom Hook can serve as a **gateway adapter** over Context or an external store (`useAuth() => useContext(AuthContext)`), but local `useState` or `useReducer` inside a custom Hook will always remain private to the caller.

---

### 16. Simple `useState` Encapsulation

A well-designed custom Hook encapsulates state, transitions, and commands cleanly:

```tsx
export interface UseDisclosureResult {
  readonly isOpen: boolean;
  readonly open: () => void;
  readonly close: () => void;
  readonly toggle: () => void;
}

export function useDisclosure(initial: boolean = false): UseDisclosureResult {
  const [isOpen, setIsOpen] = useState<boolean>(initial);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return { isOpen, open, close, toggle };
}
```

The consumer is given high-level intention verbs (`open()`, `close()`) without ever needing to know how `isOpen` is represented or updated internally.

---

### 17. Why `setIsOpen` Is Deliberately Hidden

If the Hook returned `{ isOpen, setIsOpen }`:
1. Callers could execute `setIsOpen(null as any)` or other invalid assignments.
2. Callers would be forced to write verbose boolean toggles (`setIsOpen(!isOpen)` which suffers from stale closure bugs).
3. If the internal implementation is later refactored to trigger analytics or sync with URL query params, every single `setIsOpen` call site across the application would need manual refactoring.

Hiding raw setters preserves the **Open/Closed Principle** of software architecture.

---

### 18. Transition Complexity Analysis

```
+-----------------------------------------------------------------------------+
|                      TRANSITION COMPLEXITY SPECTRUM                         |
|                                                                             |
|  Low Complexity:              Medium Complexity:         High Complexity:   |
|  Independent Booleans         Form Inputs                Async Pipelines    |
|  [isOpen, setIsOpen]          [values, setFieldValue]    (Status, Data,     |
|                                                          Errors, Invariants)|
|                                                                             |
|  ───────► USE useState ─────────────► EVALUATE ────────────► USE useReducer |
+-----------------------------------------------------------------------------+
```

When an asynchronous workflow involves `status`, `data`, `error`, `retryCount`, and `isStale`, updating these fields with five separate `useState` setters causes:
- Multiple staggered re-renders (unless batched).
- Inconsistent intermediate render snapshots where `status === "error"` but old `data` persists unexpectedly.
- Fragile update cascades spread across multiple callback functions.

---

### 19. Reducer as a Formal State Transition Boundary

```tsx
export interface AsyncState<T> {
  readonly status: "idle" | "loading" | "success" | "error";
  readonly data: T | null;
  readonly error: Error | null;
}

export type AsyncAction<T> =
  | { readonly type: "FETCH_START" }
  | { readonly type: "FETCH_SUCCESS"; readonly payload: T }
  | { readonly type: "FETCH_FAILURE"; readonly error: Error }
  | { readonly type: "RESET" };

export function asyncReducer<T>(
  state: AsyncState<T>,
  action: AsyncAction<T>
): AsyncState<T> {
  switch (action.type) {
    case "FETCH_START":
      return { status: "loading", data: null, error: null };
    case "FETCH_SUCCESS":
      return { status: "success", data: action.payload, error: null };
    case "FETCH_FAILURE":
      return { status: "error", data: null, error: action.error };
    case "RESET":
      return { status: "idle", data: null, error: null };
    default:
      return state;
  }
}
```

The reducer acts as an atomic transaction processor. Every transition produces a completely valid, coherent state snapshot.

---

### 20. Why Reducers Eliminate Multi-Setter Desynchronization

Without a reducer:
```tsx
// ❌ MULTI-SETTER DESYNCHRONIZATION HAZARD:
setStatus("loading");
setData(null);
setError(null);
// If an unhandled exception throws after setStatus, state is left in a broken partial state!
```

With a reducer:
```tsx
// ✅ ATOMIC TRANSACTION:
dispatch({ type: "FETCH_START" });
// One pure reduction step transitions all 3 fields simultaneously.
```

---

### 21. Reducer Does Not Automatically Equal "Finite State Machine"

A reducer is a general-purpose state transformation function:
$$(S, A) \longrightarrow S'$$

A true **Finite State Machine (FSM)** strictly enforces:
1. A finite set of formal States ($S$).
2. A finite set of valid Events/Actions ($E$).
3. A deterministic transition function ($\delta: S \times E \rightarrow S$) where invalid transitions are explicitly rejected.
4. Entry/exit side effects and guards.

A naive reducer that allows any action to modify state in any mode is **not** an FSM. To build an FSM in `useReducer`, you must validate that the incoming action is legally permitted in the current `state.status`:

```tsx
function fsmReducer(state: State, action: Action): State {
  switch (state.status) {
    case "idle":
      if (action.type === "START") return { status: "loading" };
      return state; // Reject invalid transition!
    case "loading":
      if (action.type === "RESOLVE") return { status: "success", data: action.data };
      if (action.type === "REJECT") return { status: "error", error: action.error };
      return state;
    case "success":
    case "error":
      if (action.type === "RESET") return { status: "idle" };
      return state;
  }
}
```

---

### 22. Action Creators in Custom Hooks

Inside the custom Hook, write private action creators that bind `dispatch`:

```tsx
export function useAsyncWorkflow<T>() {
  const [state, dispatch] = useReducer(asyncReducer<T>, {
    status: "idle",
    data: null,
    error: null,
  });

  const start = useCallback(() => dispatch({ type: "FETCH_START" }), []);
  const succeed = useCallback((payload: T) => dispatch({ type: "FETCH_SUCCESS", payload }), []);
  const fail = useCallback((error: Error) => dispatch({ type: "FETCH_FAILURE", error }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { state, start, succeed, fail, reset };
}
```

---

### 23. Internal Action Vocabulary vs. Public Domain API

```
+-----------------------------------------------------------------------------+
|                          PUBLIC CONSUMER BOUNDARY                           |
|                                                                             |
|   const { execute, cancel, retry } = usePaymentWorkflow();                  |
+-------------------------------------+---------------------------------------+
                                      |
                                      | Semantic Commands
                                      v
+-----------------------------------------------------------------------------+
|                         INTERNAL REDUCER VOCABULARY                         |
|                                                                             |
|   dispatch({ type: "PAYMENT_SUBMIT_REQUESTED", timestamp: Date.now() })     |
|   dispatch({ type: "PAYMENT_GATEWAY_TIMEOUT", retryCount: 2 })              |
|   dispatch({ type: "ROLLBACK_TRANSACTION_STATE" })                          |
+-----------------------------------------------------------------------------+
```

Consumers are decoupled from internal action types. You can rename, split, or merge action types inside the Hook without breaking any external UI component.

---

### 24. Action Types vs. Domain Commands

| Architectural Layer | Artifact | Example | Audience |
| :--- | :--- | :--- | :--- |
| **Public API** | Domain Command | `checkout()`, `applyDiscount(code)` | Consuming UI components |
| **Private Implementation** | Action Object | `{ type: "COUPON_APPLIED", payload: { code, rate: 0.15 } }` | Reducer pure function |
| **Storage Layer** | State Snapshot | `{ step: 2, subtotal: 100, discount: 15, total: 85 }` | Fiber `memoizedState` |

---

### 25. Detailed Example: `useCart` Implementation

#### Anti-Pattern: Distributed Domain Mutation
```tsx
// ❌ FLAWED DESIGN: Leaking raw array setter
export function useCartBad() {
  const [items, setItems] = useState<CartItem[]>([]);
  return { items, setItems };
}

// In HeaderComponent:
setItems(prev => prev.filter(i => i.id !== id));

// In CheckoutComponent (Buggy update logic):
setItems([...items, newItem]); // Stale closure hazard!
```

#### Senior Architecture: Encapsulated State Model
```tsx
export interface CartItem {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly quantity: number;
}

export interface UseCartResult {
  readonly items: readonly CartItem[];
  readonly totalQuantity: number;
  readonly totalPrice: number;
  readonly addItem: (item: Omit<CartItem, "quantity">) => void;
  readonly removeItem: (id: string) => void;
  readonly updateQuantity: (id: string, quantity: number) => void;
  readonly clearCart: () => void;
}

export function useCart(): UseCartResult {
  const [items, setItems] = useState<readonly CartItem[]>([]);

  const addItem = useCallback((newItem: Omit<CartItem, "quantity">) => {
    setItems(currentItems => {
      const existing = currentItems.find(i => i.id === newItem.id);
      if (existing) {
        return currentItems.map(i =>
          i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...currentItems, { ...newItem, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(currentItems => currentItems.filter(i => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(currentItems => currentItems.filter(i => i.id !== id));
      return;
    }
    setItems(currentItems =>
      currentItems.map(i => (i.id === id ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalQuantity = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items]
  );

  const totalPrice = useMemo(
    () => items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [items]
  );

  return {
    items,
    totalQuantity,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  };
}
```

---

### 26. When `useReducer` Becomes Strictly Better

When the cart requirements expand to include:
- Promotional coupon codes with dynamic discounts.
- Tiered tax calculations based on shipping zip codes.
- Inventory reservation locks with timeout countdowns.
- Validation errors for out-of-stock items.

Managing this with individual `useState` calls causes severe state fragmentation. A reducer unifies this into a single transactional state machine.

---

### 27. Fully Encapsulated `useReducer` Cart Architecture

```tsx
interface CartState {
  readonly items: readonly CartItem[];
  readonly discountCode: string | null;
  readonly discountRate: number;
  readonly status: "idle" | "validating" | "locked" | "error";
  readonly errorMessage: string | null;
}

type CartAction =
  | { type: "ADD_ITEM"; item: Omit<CartItem, "quantity"> }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "UPDATE_QTY"; id: string; quantity: number }
  | { type: "APPLY_DISCOUNT_START"; code: string }
  | { type: "APPLY_DISCOUNT_SUCCESS"; code: string; rate: number }
  | { type: "APPLY_DISCOUNT_ERROR"; message: string }
  | { type: "CLEAR" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find(i => i.id === action.item.id);
      const items = existing
        ? state.items.map(i => i.id === action.item.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...state.items, { ...action.item, quantity: 1 }];
      return { ...state, items, errorMessage: null };
    }
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter(i => i.id !== action.id) };
    case "UPDATE_QTY":
      return {
        ...state,
        items: action.quantity <= 0
          ? state.items.filter(i => i.id !== action.id)
          : state.items.map(i => i.id === action.id ? { ...i, quantity: action.quantity } : i),
      };
    case "APPLY_DISCOUNT_START":
      return { ...state, status: "validating", errorMessage: null };
    case "APPLY_DISCOUNT_SUCCESS":
      return { ...state, status: "idle", discountCode: action.code, discountRate: action.rate };
    case "APPLY_DISCOUNT_ERROR":
      return { ...state, status: "error", errorMessage: action.message };
    case "CLEAR":
      return { ...state, items: [], discountCode: null, discountRate: 0, status: "idle", errorMessage: null };
    default:
      return state;
  }
}
```

---

### 28. `useReducer` Does Not Automatically Improve Architecture

Introducing a 100-line reducer for a simple hover tooltip or disclosure toggle is architectural over-engineering:

```tsx
// ❌ OVER-ENGINEERED:
const [state, dispatch] = useReducer(tooltipReducer, { isHovered: false });

// ✅ CLEAN & IDIOMATIC:
const [isHovered, setIsHovered] = useState(false);
```

Complexity must be earned by actual business requirements.

---

### 29. `useState` vs. `useReducer` Decision Matrix

| Evaluation Dimension | `useState` Recommendation | `useReducer` Recommendation |
| :--- | :--- | :--- |
| **Independent Primitives (Number/String/Boolean)** | 🟢 Excellent | 🔴 Unnecessary Overhead |
| **2-State UI Toggles (Modal Open/Close)** | 🟢 Ideal | 🟡 Overkill |
| **Direct Value Replacements (`<input />`)** | 🟢 Standard | 🟡 Verbose |
| **Coupled Multi-Field Transitions** | 🟡 Risk of desynchronization | 🟢 Highly Recommended |
| **Explicit Domain Event Vocabularies** | 🟡 Scattered across callbacks | 🟢 Centralized in Action Union |
| **Strict Invariant Guarantees** | 🔴 Error-prone | 🟢 Enforced by pure reducer |
| **Complex Async State Pipelines** | 🟡 Multi-setter boilerplate | 🟢 Optimal Architecture |
| **Unit Testing State Logic without React** | 🔴 Requires Test Harness | 🟢 100% Pure Function Testing |

---

### 30. Temporal Closure Analysis

Consider a flawed counter Hook:

```tsx
// ❌ BUGGY SNAPSHOT CLOSURE:
function useCounterFlawed() {
  const [count, setCount] = useState(0);

  const doubleIncrement = () => {
    setCount(count + 1); // Closes over 'count' from current render
    setCount(count + 1); // Closes over identical 'count' value!
  };

  return { count, doubleIncrement };
}
```

When `doubleIncrement` runs on Render #1 (`count = 0`):
1. First call enqueues `setCount(0 + 1)`.
2. Second call enqueues `setCount(0 + 1)`.
3. Render #2 receives `count = 1` instead of `2`.

```tsx
// ✅ FUNCTIONAL UPDATE (TEMPORALLY DECOUPLED):
function useCounterFixed() {
  const [count, setCount] = useState(0);

  const doubleIncrement = useCallback(() => {
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
  }, []);

  return { count, doubleIncrement };
}
```

---

### 31. Reducer Temporal Queue Model

In `useReducer`, `dispatch(action)` is naturally decoupled from render snapshots because actions are processed sequentially against the accumulator:

```
Initial State: { count: 0 }
       │
       ├── dispatch({ type: "INC" }) ──> Reducer computes: 0 + 1 = 1
       │
       └── dispatch({ type: "INC" }) ──> Reducer computes: 1 + 1 = 2
       │
       ▼
Next Render State: { count: 2 }
```

Actions operate on React's internal update queue, eliminating snapshot race conditions.

---

### 32. Execution Prediction Walkthrough — Render #1 (Mount)

```tsx
function useCounter() {
  const [count, setCount] = useState(0);
  const increment = useCallback(() => setCount(c => c + 1), []);
  return { count, increment };
}
```

1. **Mount Dispatcher:** Allocates `Hook #1` with `memoizedState = 0`.
2. Allocates `Hook #2` (`useCallback`) caching function pointer `increment#1`.
3. Returns `{ count: 0, increment: increment#1 }`.
4. Component paints UI with count `0`.

---

### 33. Execution Prediction Walkthrough — User Event

1. User clicks `<button onClick={increment}>`.
2. Callback `increment#1` fires: `setCount(c => c + 1)`.
3. Dispatcher adds update to `Hook #1`'s `updateQueue.pending`.
4. React marks the host component Fiber as `Lanes: SyncLane` (or Concurrent Lane) and schedules a re-render.

---

### 34. Execution Prediction Walkthrough — Render #2 (Update)

1. **Update Dispatcher:** Traverses to `Hook #1`.
2. Evaluates queued functional update against base state `0`: `0 + 1 = 1`.
3. Updates `Hook #1.memoizedState = 1`.
4. Traverses to `Hook #2`: dependencies `[]` unchanged, returns cached `increment#1`.
5. Returns `{ count: 1, increment: increment#1 }`.
6. Component reconciliation detects change from `0` to `1` and commits DOM mutation.

---

### 35. Two Hook Instances in One Component

```tsx
function Dashboard() {
  const leftCounter = useCounter(0);
  const rightCounter = useCounter(100);

  return (
    <div>
      <button onClick={leftCounter.increment}>Left: {leftCounter.count}</button>
      <button onClick={rightCounter.increment}>Right: {rightCounter.count}</button>
    </div>
  );
}
```

```
Dashboard Fiber memoizedState Linked List:
  ┌───────────────────────────────────────────────────────┐
  │ Hook #1: useState (leftCounter)   ──> memoizedState: 0│
  │ Hook #2: useCallback (leftInc)                        │
  │ Hook #3: useState (rightCounter)  ──> memoizedState:100│
  │ Hook #4: useCallback (rightInc)                       │
  └───────────────────────────────────────────────────────┘
```

Both instances execute within the single Fiber's linear sequence. Index position isolates `leftCounter` from `rightCounter`.

---

### 36. Hook Reordering Hazard in Conditional Custom Hook Invocations

```tsx
// ❌ CATASTROPHIC VIOLATION OF THE RULES OF HOOKS:
function BrokenComponent({ showExtraCounter }: { showExtraCounter: boolean }) {
  const primary = useCounter(0);

  if (showExtraCounter) {
    const extra = useCounter(50); // 💥 CONDITIONAL HOOK INVOCATION!
  }

  const secondary = useCounter(100);
}
```

When `showExtraCounter` toggles from `true` to `false`:
- Render #1: Index 0 $\rightarrow$ `primary`, Index 1 $\rightarrow$ `extra`, Index 2 $\rightarrow$ `secondary`.
- Render #2: Index 0 $\rightarrow$ `primary`, Index 1 $\rightarrow$ `secondary`!
- **Result:** `secondary` reads the internal state previously allocated for `extra` (value `50` instead of `100`), corrupting the entire component state graph.

---

## Layer 3 — 🛠️ Production Crucibles & Anti-Patterns

### 37. Incident 01 — The "Shared State Custom Hook" Production Bug

#### Incident Log:
A junior developer created `useThemeSettings()` containing local `useState` and called it in `Header`, `Sidebar`, and `ProfileModal`. Toggling dark mode in `ProfileModal` updated the modal UI, but the `Header` and `Sidebar` remained stubbornly in light mode.

#### Root Cause:
The developer believed custom Hooks share state globally. Each component invocation had allocated an independent `useState` node on its own Fiber.

#### Corrective Action:
Lifted state to a `ThemeContext.Provider` and refactored `useThemeSettings()` to serve as a context gateway consuming `useContext(ThemeContext)`.

---

### 38. Incident 02 — The 500-Line `useState` God Controller

#### Incident Log:
A critical KYC compliance form Hook used a giant single `useState` object:
```tsx
const [form, setForm] = useState({ step: 1, ssn: "", idDoc: null, ...40 fields });
```
Multiple asynchronous upload callbacks and blur event handlers spread stale `...form` references concurrently, resulting in lost user inputs and corrupted form submissions in 3.4% of production sessions.

#### Corrective Action:
Migrated the entire state management to `useReducer` with atomic action types (`SET_DOCUMENT_UPLOADED`, `UPDATE_FIELD`, `PROCEED_STEP`), completely eliminating spread race conditions.

---

### 39. Incident 03 — Reducer as an Uncontrolled Dumping Ground

#### Incident Log:
A team converted all component state into a single massive reducer containing UI hover flags, transient modal positions, animations, and business entities. Action payloads like `{ type: "SET_HOVERED", id: "btn-1" }` caused the entire form and table subtree to re-evaluate and re-render on every mouse movement.

#### Corrective Action:
Separated concerns: transient UI hover state was returned to local `useState` within leaf components, while the core domain model remained in the reducer.

---

### 40. Anti-Pattern: Returning Raw `dispatch`

```tsx
// ❌ ANTI-PATTERN: Leaking internal reducer mechanics
export function useWizard() {
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);
  return { state, dispatch };
}

// Consuming UI:
dispatch({ type: "FORCE_INVALID_STEP_JUMP", step: 99 }); // 💥 Breaches invariant!
```

```tsx
// ✅ SENIOR ARCHITECTURE: Encapsulated Command Boundary
export function useWizard() {
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);

  const next = useCallback(() => dispatch({ type: "NEXT_STEP" }), []);
  const prev = useCallback(() => dispatch({ type: "PREV_STEP" }), []);
  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= 5) dispatch({ type: "GOTO_STEP", step });
  }, []);

  return {
    currentStep: state.step,
    isComplete: state.isComplete,
    next,
    prev,
    goToStep,
  };
}
```

---

### 41. Anti-Pattern: Action String Leakage

Exporting action type constants (`export const SET_NAME = "SET_NAME"`) for external callers to dispatch defeats the purpose of custom Hook abstraction. Keep all action types internal to the Hook file.

---

### 42. Anti-Pattern: Generic State Replacement

```tsx
// ❌ DANGEROUS:
const { updateState } = useAccount();
updateState({ balance: -9999 }); // Bypasses business validation!
```

Expose domain verbs (`deposit(amount)`, `withdraw(amount)`) with built-in invariant validation.

---

### 43. Anti-Pattern: Reducer for Every Boolean

```tsx
// ❌ OVERKILL:
function toggleReducer(state: boolean, action: { type: "TOGGLE" }) {
  return !state;
}
const [open, dispatch] = useReducer(toggleReducer, false);
```

Use `useState` for simple primitive transitions.

---

### 44. Anti-Pattern: The "God Hook" Domain Monolith

A single Hook that manages Authentication, Cart, Notifications, Theme, and WebSockets violates the **Single Responsibility Principle**. Split into focused, composable Hooks:
- `useAuth()`
- `useCart()`
- `useNotifications()`

---

### 45. State Placement Matrix

| Scope Requirement | Local Custom Hook (`useState`/`useReducer`) | React Context Gateway | External Store (Zustand/Redux) |
| :--- | :---: | :---: | :---: |
| **Component Instance State** | 🟢 Optimal | 🔴 Anti-pattern | 🔴 Overkill |
| **Reusable Stateful Logic (Independent Memory)** | 🟢 Optimal | 🟡 Requires Factory | 🟡 Complex |
| **Scoped React Subtree Sharing** | 🟡 Requires Prop Drilling | 🟢 Optimal | 🟡 Possible |
| **Cross-Tree Global Shared State** | 🔴 Not Possible Alone | 🟡 Re-render Caution | 🟢 Optimal |
| **High-Frequency State (60fps Animation)** | 🟡 Local Only | 🔴 Re-render Bottleneck | 🟢 Optimal (Selectors) |

---

### 46. Decision Matrix — `useState` vs. `useReducer`

```
                                 START STATE DESIGN
                                         │
                                         ▼
                       Are multiple fields updated together?
                                         │
                  ┌──────────────────────┴──────────────────────┐
                  ▼                                             ▼
                 YES                                           NO
                  │                                             │
                  ▼                                             ▼
       Do transitions have invariants                Are transitions simple
          or explicit domain events?                   direct replacements?
                  │                                             │
          ┌───────┴───────┐                             ┌───────┴───────┐
          ▼               ▼                             ▼               ▼
         YES              NO                           YES              NO
          │               │                             │               │
          ▼               ▼                             ▼               ▼
     useReducer        useState                      useState       useReducer
```

---

### 47. Production Refactoring Pattern: From Scattered `useState` to Cohesive Reducer

#### Before (Scattered `useState`):
```tsx
export function useCheckoutWorkflow() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const submit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const id = await apiSubmitOrder();
      setOrderId(id);
      setStep(3);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { step, isSubmitting, error, orderId, submit };
}
```

#### After (Discriminated State Reducer):
```tsx
export type CheckoutState =
  | { readonly status: "editing"; readonly step: number }
  | { readonly status: "submitting"; readonly step: number }
  | { readonly status: "success"; readonly orderId: string }
  | { readonly status: "error"; readonly step: number; readonly error: Error };

type CheckoutAction =
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS"; orderId: string }
  | { type: "SUBMIT_ERROR"; error: Error }
  | { type: "RETRY" };

function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
  switch (action.type) {
    case "NEXT_STEP":
      return state.status === "editing" ? { status: "editing", step: state.step + 1 } : state;
    case "PREV_STEP":
      return state.status === "editing" ? { status: "editing", step: Math.max(1, state.step - 1) } : state;
    case "SUBMIT_START":
      return state.status === "editing" ? { status: "submitting", step: state.step } : state;
    case "SUBMIT_SUCCESS":
      return { status: "success", orderId: action.orderId };
    case "SUBMIT_ERROR":
      return state.status === "submitting" ? { status: "error", step: state.step, error: action.error } : state;
    case "RETRY":
      return state.status === "error" ? { status: "editing", step: state.step } : state;
    default:
      return state;
  }
}

export function useCheckoutWorkflow() {
  const [state, dispatch] = useReducer(checkoutReducer, { status: "editing", step: 1 });

  const submit = useCallback(async () => {
    dispatch({ type: "SUBMIT_START" });
    try {
      const orderId = await apiSubmitOrder();
      dispatch({ type: "SUBMIT_SUCCESS", orderId });
    } catch (err) {
      dispatch({ type: "SUBMIT_ERROR", error: err as Error });
    }
  }, []);

  return {
    state,
    isSubmitting: state.status === "submitting",
    submit,
    next: useCallback(() => dispatch({ type: "NEXT_STEP" }), []),
    prev: useCallback(() => dispatch({ type: "PREV_STEP" }), []),
    retry: useCallback(() => dispatch({ type: "RETRY" }), []),
  };
}
```

---

### 48. When Complexity Justifies a Reducer

When you notice:
1. You are writing `setA(a); setB(b); setC(c);` in 4 different functions.
2. You need an `enum` or union to represent impossible state combinations.
3. Bug tickets report race conditions between asynchronous callbacks updating state.

---

### 49. The Refactoring Threshold Rule

Do not ask: *"How many `useState` calls are in this Hook?"*  
Ask: **"How difficult is it to reason about and guarantee the validity of state transitions under asynchronous concurrency?"**

---

### 50. Diagnostic Runbook for Custom Hook State Architecture

When auditing or architecting custom Hook state:
1. **Verify State Owner:** Confirm that the state belongs to the component instance, or migrate to Context if cross-tree coordination is required.
2. **Audit Public Interface:** Ensure raw `setState` or `dispatch` functions are NOT exported directly.
3. **Check Functional Updates:** Verify that all setters depending on prior state use `setState(prev => ...)` to eliminate stale closure bugs.
4. **Inspect Coupled Fields:** If 3+ fields change simultaneously, refactor to `useReducer` with discriminated unions.
5. **Enforce Referential Stability:** Wrap all exported semantic commands in `useCallback` to prevent breaking downstream `React.memo` consumers.

---

## Layer 4 — 🧪 Diagnostic Gauntlet & Master Checklist

### 51. Prediction Challenge 01 — Independent Instances

```tsx
function useToggle() {
  const [on, setOn] = useState(false);
  return { on, toggle: () => setOn(v => !v) };
}

function Parent() {
  const a = useToggle();
  const b = useToggle();
  return (
    <div>
      <button onClick={a.toggle}>Toggle A ({a.on ? "ON" : "OFF"})</button>
      <span>B: {b.on ? "ON" : "OFF"}</span>
    </div>
  );
}
```
- **Question:** Clicking `Toggle A` changes `a.on` to `ON`. Does `b.on` change?
- **Answer:** **No.** `a` and `b` allocate separate Hook nodes (Index 0 and Index 1) on `Parent`'s Fiber.

---

### 52. Prediction Challenge 02 — Shared Function Reference vs. State

```tsx
const hookRefA = useCounter;
const hookRefB = useCounter;
```
- **Question:** If `hookRefA === hookRefB`, does invoking them in two components share their count?
- **Answer:** **No.** The function definition is identical in JavaScript memory, but each call allocates fresh state on the respective caller's Fiber `memoizedState`.

---

### 53. Prediction Challenge 03 — Leaked Dispatch

```tsx
const { state, dispatch } = useAuth();
dispatch({ type: "SET_TOKEN_DIRECT", token: "fake" });
```
- **Question:** Why does this create an architectural liability?
- **Answer:** Consumers can bypass authentication validation invariants and inject corrupt state, and any internal renaming of `SET_TOKEN_DIRECT` breaks external code.

---

### 54. Prediction Challenge 04 — Asynchronous Multi-State Hazard

```tsx
const submit = async () => {
  setLoading(true);
  const data = await fetchUser();
  setData(data);
  setLoading(false);
};
```
- **Question:** What occurs if the component unmounts while `fetchUser` is awaiting?
- **Answer:** In React 18, React safely ignores the unmounted update, but if the component remounts or the user re-triggers quickly, stale overlapping responses can cause race condition data corruption. An encapsulated reducer or AbortController is required.

---

### 55. 50-Point Senior Architectural Checklist

- [ ] 1. I understand that custom Hooks reuse stateful logic, NOT shared state instances.
- [ ] 2. I can explain why two components calling the same Hook have completely isolated state.
- [ ] 3. I can identify the specific Fiber node that owns each custom Hook's state.
- [ ] 4. I know that custom Hooks do not create independent Fiber nodes.
- [ ] 5. I understand how React's `memoizedState` linked list stores Hook records.
- [ ] 6. I use `useState` for independent, primitive local state values.
- [ ] 7. I always use functional updates (`setCount(c => c + 1)`) when next state depends on prior state.
- [ ] 8. I understand why `count + 1` in async callbacks captures stale render snapshots.
- [ ] 9. I use `useReducer` when 2 or more state fields are coupled or update simultaneously.
- [ ] 10. I write strict discriminated unions for all `useReducer` action types.
- [ ] 11. I write strict discriminated unions for multi-state async state machines (`idle` | `loading` | `success` | `error`).
- [ ] 12. I never expose raw `dispatch` functions from domain custom Hooks.
- [ ] 13. I wrap internal `dispatch` calls in high-level semantic domain commands (`open()`, `submit()`).
- [ ] 14. I keep reducer action type strings completely private to the Hook module.
- [ ] 15. I wrap all exported callback commands in `useCallback` for referential stability.
- [ ] 16. I can write pure unit tests for my reducer functions without mounting React components.
- [ ] 17. I know that `useReducer` is not automatically a Finite State Machine unless invalid transitions are explicitly guarded.
- [ ] 18. I avoid the "Everything Reducer" dumping ground anti-pattern for simple local booleans.
- [ ] 19. I avoid the "500-line useState God Object" anti-pattern.
- [ ] 20. I separate transient UI interaction state from domain business state.
- [ ] 21. I know when to lift local Hook state into React Context for subtree distribution.
- [ ] 22. I know when to use an external store (Zustand) for high-frequency or global subscriptions.
- [ ] 23. I understand mount phase (`mountWorkInProgressHook`) reconciler mechanics.
- [ ] 24. I understand update phase (`updateWorkInProgressHook`) reconciler mechanics.
- [ ] 25. I understand how unmounting severs the Fiber's `memoizedState` linked list.
- [ ] 26. I strictly avoid conditional or looped invocations of custom Hooks.
- [ ] 27. I know how to isolate dynamic lists of stateful items into distinct child components.
- [ ] 28. I avoid exporting mutable arrays or objects directly without `readonly` type modifiers.
- [ ] 29. I ensure async commands handle promise rejections and update error states cleanly.
- [ ] 30. I use `useMemo` for computationally expensive derived state calculations inside the Hook.
- [ ] 31. I ensure default hook options do not cause reference inequality loops.
- [ ] 32. I design custom Hook APIs around consumer use cases rather than internal variable names.
- [ ] 33. I document all public return properties and methods using standard TSDoc.
- [ ] 34. I test custom Hooks with `@testing-library/react` and `renderHook`.
- [ ] 35. I understand how React 18 automatic batching affects state updates inside custom Hooks.
- [ ] 36. I ensure cleanup logic is properly registered inside `useEffect` where necessary.
- [ ] 37. I avoid generic state replacement functions (`updateState(newState)`) on complex domain models.
- [ ] 38. I enforce business invariants directly inside the Hook's transition commands.
- [ ] 39. I design Hook contracts to support additive, backward-compatible evolutions.
- [ ] 40. I know that multiple Hook invocations in one component allocate sequentially on the same Fiber list.
- [ ] 41. I can refactor scattered `useState` calls into a cohesive reducer in under 10 minutes.
- [ ] 42. I use TypeScript `satisfies` or explicit return types to guarantee contract accuracy.
- [ ] 43. I verify that custom Hooks behave deterministically under React Strict Mode double-invocations.
- [ ] 44. I avoid storing redundant derived data in state when it can be computed during render.
- [ ] 45. I keep custom Hook files focused on a single domain capability (Single Responsibility Principle).
- [ ] 46. I know how to compose multiple custom Hooks together into higher-order domain controllers.
- [ ] 47. I ensure state resets (`reset()`) return all internal state fields to exact initial defaults.
- [ ] 48. I avoid leaking React `ref` handles unless building Headless UI primitives.
- [ ] 49. I evaluate the cognitive overhead of abstractions before creating new custom Hooks.
- [ ] 50. I master the golden rule: Logic is reusable; state is instance-isolated; transitions must be encapsulated.

---

### 56. Senior Interview Challenge Questions (Staff & Lead Level)

#### Q1: Does a custom Hook share state between components?
> **Staff-Level Answer:** No. A custom Hook shares stateful logic and behavior, not state instances. Hook state is stored in the `Fiber.memoizedState` linked list of the specific component instance invoking the Hook. Two separate component instances invoking the same custom Hook each receive their own isolated Hook record on their respective Fibers.

#### Q2: Does `useReducer` make state global across the application?
> **Staff-Level Answer:** No. `useReducer` is purely an alternative primitive to `useState` that operates on the local component Fiber's state queue. It creates local Hook state with a centralized `(state, action) => nextState` transition function. To make reducer state global or subtree-shared, it must be paired with React Context or an external store.

#### Q3: When should an engineer choose `useReducer` over multiple `useState` calls?
> **Staff-Level Answer:** When state transitions are coupled (mutating one field requires updating others), when the state requires strict invariant enforcement, when transitions correspond to distinct domain events, or when isolating the transition algebra into a pure, testable function improves long-term codebase maintainability.

#### Q4: Is a reducer always better than multiple `useState` calls?
> **Staff-Level Answer:** No. Independent state variables that mutate in response to unrelated events are much clearer and more idiomatic when represented as independent `useState` calls. Introducing a reducer for simple, decoupled primitives adds unnecessary boilerplate, action types, and indirection without tangible architectural benefits.

#### Q5: Why should a custom Hook avoid exporting `dispatch`?
> **Staff-Level Answer:** To preserve encapsulation and protect the public API boundary. Exposing `dispatch` leaks the internal action type strings and payload structures to consuming UI components, making refactoring breaking and difficult. Wrapping `dispatch` in semantic domain commands (`open()`, `submit()`, `retry()`) allows the internal reducer to evolve freely while presenting a stable, self-documenting interface to consumers.

#### Q6: Is `useReducer` automatically a Finite State Machine?
> **Staff-Level Answer:** Not automatically. A basic `useReducer` is simply an event accumulator. To function as a true Finite State Machine (FSM), the reducer must explicitly guard transitions by verifying that the incoming action is permitted in the current state mode (e.g., rejecting a `FETCH_SUCCESS` action if the state is currently in `idle` rather than `loading`).

#### Q7: What is the most important state architecture question when designing a custom Hook?
> **Staff-Level Answer:** Not *"Should I use useState or useReducer?"*, but rather: **"What state does this component own, what transitions are mathematically valid, and where should those transition rules live?"** The focus should always be on domain ownership boundaries and transition invariants.

#### Q8: What should a reusable custom Hook expose in its public return contract?
> **Staff-Level Answer:** Only the semantic data, computed properties, and domain commands that consumers legitimately require to render UI and execute user intents. Internal state variables, action dispatchers, raw refs, and intermediate reducer states must remain strictly private.

---

### 57. Production Case Study: Multi-Step KYC Wizard with Rollback Algebra

In high-assurance fintech applications, multi-step verification wizards require strict rollback semantics if a user cancels or encounters validation errors mid-stream:

```tsx
export interface KYCFormData {
  readonly legalName: string;
  readonly dateOfBirth: string;
  readonly ssn: string;
  readonly documentId: string | null;
  readonly selfieVerified: boolean;
}

export interface KYCWizardState {
  readonly currentStep: 1 | 2 | 3 | 4;
  readonly formData: KYCFormData;
  readonly history: readonly KYCFormData[];
  readonly status: "editing" | "validating" | "submitting" | "success" | "error";
  readonly error: string | null;
}

export type KYCWizardAction =
  | { type: "UPDATE_FIELD"; field: keyof KYCFormData; value: any }
  | { type: "STEP_NEXT" }
  | { type: "STEP_PREV" }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "SUBMIT_FAILURE"; error: string }
  | { type: "ROLLBACK_TO_CHECKPOINT" }
  | { type: "RESET" };

const initialKYCData: KYCFormData = {
  legalName: "",
  dateOfBirth: "",
  ssn: "",
  documentId: null,
  selfieVerified: false,
};

const initialKYCState: KYCWizardState = {
  currentStep: 1,
  formData: initialKYCData,
  history: [],
  status: "editing",
  error: null,
};

export function kycWizardReducer(state: KYCWizardState, action: KYCWizardAction): KYCWizardState {
  switch (action.type) {
    case "UPDATE_FIELD":
      return {
        ...state,
        formData: { ...state.formData, [action.field]: action.value },
        error: null,
      };
    case "STEP_NEXT": {
      if (state.currentStep >= 4) return state;
      // Push snapshot to history stack for rollback capability:
      return {
        ...state,
        currentStep: (state.currentStep + 1) as any,
        history: [...state.history, state.formData],
        error: null,
      };
    }
    case "STEP_PREV": {
      if (state.currentStep <= 1) return state;
      return {
        ...state,
        currentStep: (state.currentStep - 1) as any,
        error: null,
      };
    }
    case "SUBMIT_START":
      return { ...state, status: "submitting", error: null };
    case "SUBMIT_SUCCESS":
      return { ...state, status: "success", error: null };
    case "SUBMIT_FAILURE":
      return { ...state, status: "error", error: action.error };
    case "ROLLBACK_TO_CHECKPOINT": {
      if (state.history.length === 0) return state;
      const previousSnapshot = state.history[state.history.length - 1];
      return {
        ...state,
        formData: previousSnapshot,
        history: state.history.slice(0, -1),
        error: "Rollback applied to previous valid checkpoint.",
      };
    }
    case "RESET":
      return initialKYCState;
    default:
      return state;
  }
}

export function useKYCWizard() {
  const [state, dispatch] = useReducer(kycWizardReducer, initialKYCState);

  const updateField = useCallback((field: keyof KYCFormData, value: any) => {
    dispatch({ type: "UPDATE_FIELD", field, value });
  }, []);

  const nextStep = useCallback(() => dispatch({ type: "STEP_NEXT" }), []);
  const prevStep = useCallback(() => dispatch({ type: "STEP_PREV" }), []);
  const rollback = useCallback(() => dispatch({ type: "ROLLBACK_TO_CHECKPOINT" }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  const submitKYC = useCallback(async () => {
    dispatch({ type: "SUBMIT_START" });
    try {
      await apiSubmitKYC(state.formData);
      dispatch({ type: "SUBMIT_SUCCESS" });
    } catch (err: any) {
      dispatch({ type: "SUBMIT_FAILURE", error: err.message || "KYC Submission Failed" });
    }
  }, [state.formData]);

  return {
    currentStep: state.currentStep,
    formData: state.formData,
    status: state.status,
    error: state.error,
    canRollback: state.history.length > 0,
    updateField,
    nextStep,
    prevStep,
    rollback,
    submitKYC,
    reset,
  };
}
```

---

### 58. Graduation Readiness Gate

You are ready to advance to **Part 05 (Effects, Lifecycle & Resource Cleanup in Hooks)** when you can:
1. Explain with precision why custom Hooks do not create shared state across component instances.
2. Formulate bulletproof state machines using `useReducer` and TypeScript discriminated unions.
3. Encapsulate all raw `setState` and `dispatch` mechanics behind high-level semantic domain commands.
4. Diagnose and eliminate multi-setter desynchronization hazards and stale closure bugs.
5. Implement rollback stacks and transactional state transitions in custom Hooks.
6. Successfully execute and pass all interactive experiments in the companion lab.

---

### 59. Master Synthesis & Architectural Taxonomy

```
                                  STATEFUL BEHAVIOR NEEDED
                                             │
                                             ▼
                                    CUSTOM HOOK MODULE
                                             │
                     ┌───────────────────────┴───────────────────────┐
                     ▼                                               ▼
             useState PRIMITIVE                             useReducer ENGINE
         (Simple Independent Values)                    (Coupled Multi-Field Events)
                     │                                               │
                     └───────────────────────┬───────────────────────┘
                                             │
                                             ▼
                             PRIVATE TRANSITION & INVARIANT ENGINE
                                (Pure Reducers / Functional Setters)
                                             │
                                             ▼
                              SEMANTIC DOMAIN COMMAND GATEWAY
                                  (open(), submit(), reset())
                                             │
                                             ▼
                                STABLE PUBLIC HOOK CONTRACT
                                             │
                                             ▼
                                CONSUMING COMPONENT FIBERS
                              (Isolated Runtime State Nodes)
```

#### Final Senior Rule:
A custom Hook should own **reusable stateful behavior** without pretending that its local Hook state is shared. Use `useState` when transitions are simple and independent; use `useReducer` when coupled transitions, explicit events, or invariants justify a formal transition model. Keep transition machinery strictly private, expose semantic domain commands rather than raw setters or dispatchers, and choose your state architecture based on ownership boundaries and transition complexity.

The most important mental model to retain is:
$$\begin{aligned}
\text{Custom Hook} &\longrightarrow \text{Reuses stateful logic across components} \\
\text{Component Fiber} &\longrightarrow \text{Allocates and owns local runtime Hook state} \\
\text{useState} &\longrightarrow \text{Direct, independent state updates} \\
\text{useReducer} &\longrightarrow \text{Centralized, event-driven state transition algebra} \\
\text{Public API} &\longrightarrow \text{Stable semantic contract shielding consumers from implementation}
\end{aligned}$$

---

[🧪 Proceed to Companion Lab: 04-managing-local-state-and-reducers-in-custom-hooks.html](./examples/04-managing-local-state-and-reducers-in-custom-hooks.html) | [Next Part ➡️](./05-effects-lifecycle-and-cleanup-in-hooks.md)

