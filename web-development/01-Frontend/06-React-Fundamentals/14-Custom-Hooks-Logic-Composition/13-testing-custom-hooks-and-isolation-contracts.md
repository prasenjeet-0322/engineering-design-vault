# Level 06 — React Fundamentals
## KPI 12 — Custom Hooks & Logic Composition
### PART 13 — Testing Custom Hooks & Vitest Harnesses

[⬅️ Previous Part](./12-headless-ui-and-interaction-coordination.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](./examples/13-testing-custom-hooks-and-vitest-harnesses.html) | [Next Part ➡️](./14-custom-hooks-crucible-and-production-traps.md)

---

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)  
> **Co-Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)

---

# PART 13 — Testing Custom Hooks & Vitest Harnesses

```text
                             THE HOOK TESTING BOUNDARY
                             
   IMPLEMENTATION TESTING (Anti-Pattern)              BEHAVIORAL CONTRACT TESTING (Senior Standard)
   
  ┌─────────────────────────────────────────┐       ┌─────────────────────────────────────────┐
  │  test("useCounter implementation") {    │       │  test("useCounter behavioral contract") │
  │    // ❌ Asserts useState called twice  │       │    // 1. Initial State Contract         │
  │    // ❌ Spies on internal helper fns   │       │    // 2. State Transition verification  │
  │    // ❌ Asserts useEffect was declared │       │    // 3. Temporal update with act()     │
  │    // ❌ Breaks on internal refactor    │       │    // 4. Resilience across rerender     │
  │  }                                      │       │    // 5. Symmetric resource cleanup     │
  │                                         │       │  }                                      │
  │  • Tests code lines instead of behavior │       │  ┌───────────────────────────────────┐  │
  │  • False confidence on broken contracts │       │  │ Real Fiber Execution Harness      │  │
  │  • Fragile test suite prevents refactor │       │  │ (renderHook -> act -> unmount)    │  │
  └─────────────────────────────────────────┘       └───────────────────────────────────────┘
```

---

## Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

### 1. Executive Summary

A custom Hook is not valuable merely because its internal logic is reusable across components. It is valuable when its **behavioral contract is deterministic, verifiable across time, and cleanly isolated from ambient environmental noise**.

The central governing equation of custom Hook verification:

$$\text{Hook Test Quality} = \text{Behavioral Contract} + \text{Controlled Inputs} + \text{Controlled Environment} + \text{Observed Outputs} + \text{Lifecycle Verification} + \text{Temporal Verification}$$

The test suite must answer one definitive question:
> *"Given this initial input and this exact sequence of lifecycle events, does the custom Hook produce the correct observable output and preserve all behavioral invariants?"*

A senior test suite **never** asserts:
- Did this Hook call `useState` twice?
- Does the Hook contain a specific `useEffect` declaration?
- Did an internal private helper function execute?
- Was a raw setter function invoked with a specific argument?

---

### 2. The Hook Testing Mental Model

A custom Hook cannot be invoked as a plain, isolated JavaScript function:

```tsx
// ❌ CRITICAL RUNTIME ERROR: Invalid hook call!
// Hooks can only be called inside the body of a function component.
const result = useCounter(0); 
```

Custom Hooks fundamentally rely on React's internal **dispatcher state**, the **Fiber node architecture**, and the **Hook linked list topology**. Therefore, testing a custom Hook requires an execution harness component mounted inside a React test renderer:

```text
TEST SUITE (Vitest / Jest)
   │
   ▼
TEST HARNESS COMPONENT (Created by renderHook)
   │
   ▼
REACT FIBER NODE (memorizedState linked list)
   │
   ├── [Hook 1: useState] ──► [Hook 2: useRef] ──► [Hook 3: useEffect]
   │
   ▼
OBSERVABLE RESULT ENVELOPE (result.current)
   │
   ├── State Values (count, isOpen, data, status)
   ├── Semantic Action Callbacks (increment, toggle, refetch)
   └── Exposed Prop Getters / ARIA references
```

---

### 3. The 5 Core Questions Every Hook Test Plan Must Answer

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    THE 5-POINT HOOK TEST ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. What enters the Hook?      │ Inputs: initial props, options, callbacks,  │
│                               │ Context providers, ambient environment.     │
├───────────────────────────────┼─────────────────────────────────────────────┤
│ 2. What does the Hook expose? │ Outputs: state values, actions, metadata,   │
│                               │ prop-getters, refs, error status.           │
├───────────────────────────────┼─────────────────────────────────────────────┤
│ 3. What external boundaries   │ Side-effects: window listeners, timers,     │
│    does it touch?             │ network requests, localStorage, DOM nodes.  │
├───────────────────────────────┼─────────────────────────────────────────────┤
│ 4. What lifecycle transitions │ Phases: mount setup ➔ rerender sync ➔       │
│    matter?                    │ dependency change ➔ unmount cleanup.        │
├───────────────────────────────┼─────────────────────────────────────────────┤
│ 5. What invariant must remain │ Guarantees: latest-wins on async race,      │
│    true across time?          │ referential stability, zero leaked memory.  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 4. Fundamental Distinctions Matrix

| Concept | Precise Engineering Meaning | Primary Tooling / API |
| :--- | :--- | :--- |
| **Unit Test** | Verifies a single isolated behavioral unit without external side-effects. | `renderHook(() => useToggle())` |
| **Hook Harness** | Minimal synthetic React component used to mount and execute the Hook inside a Fiber. | `@testing-library/react` |
| **`act()`** | Synchronous test boundary ensuring all pending state updates and effects are flushed. | `act(() => result.current.toggle())` |
| **`rerender()`** | Re-executes the harness component with new props to test dependency updates and stale closures. | `rerender({ step: 5 })` |
| **`unmount()`** | Dismantles the harness Fiber, triggering all `useEffect` cleanup destructors. | `const { unmount } = renderHook(...)` |
| **Cleanup Symmetry** | Proving that resource acquisition on mount is 100% reversed on unmount. | `expect(removeListener).toHaveBeenCalled()` |
| **Fake Timers** | Deterministic clock manipulation bypassing real wall-clock delays. | `vi.useFakeTimers()`, `vi.advanceTimersByTime()` |
| **Deferred Promise** | Manually controlled Promise facilitating out-of-order async race testing. | `createDeferred<T>()` |
| **Referential Equality** | Verifying callback or object stability across re-renders. | `expect(result.current.fn).toBe(prevFn)` |
| **Fail-Fast Boundary** | Verifying the Hook throws informative errors when missing mandatory Context. | `expect(() => renderHook(...)).toThrow()` |

---

## Layer 2 — 🔬 Deep Mechanical Breakdown & Fiber Internals

### 5. What `renderHook` Conceptually Does Under the Hood

When `@testing-library/react` executes `renderHook(useMyHook, options)`, it dynamically synthesizes a lightweight React wrapper component:

```tsx
// Conceptual implementation of renderHook
export function renderHook<TProps, TResult>(
  callback: (props: TProps) => TResult,
  options: { initialProps?: TProps; wrapper?: React.ComponentType<{ children: React.ReactNode }> } = {}
) {
  const result = { current: undefined as unknown as TResult, error: undefined as unknown as Error };

  function TestComponent({ renderCallbackProps }: { renderCallbackProps: TProps }) {
    try {
      result.current = callback(renderCallbackProps);
    } catch (err) {
      result.error = err as Error;
    }
    return null;
  }

  const Wrapper = options.wrapper;
  const element = Wrapper ? (
    <Wrapper>
      <TestComponent renderCallbackProps={options.initialProps as TProps} />
    </Wrapper>
  ) : (
    <TestComponent renderCallbackProps={options.initialProps as TProps} />
  );

  const { rerender: baseRerender, unmount } = render(element);

  return {
    result,
    rerender: (newProps?: TProps) => {
      baseRerender(
        Wrapper ? (
          <Wrapper>
            <TestComponent renderCallbackProps={newProps as TProps} />
          </Wrapper>
        ) : (
          <TestComponent renderCallbackProps={newProps as TProps} />
        )
      );
    },
    unmount,
  };
}
```

```text
EXECUTION TRACE:
1. renderHook mounts <TestComponent /> into the synthetic test DOM (jsdom / happy-dom).
2. React initializes a new Fiber node for TestComponent.
3. React invokes the hook callback inside TestComponent's render phase.
4. Hook's memoizedState linked list is populated on the Fiber.
5. The return value is stored by reference into `result.current`.
```

---

### 6. Why `act()` Exists & React 18 Concurrent Scheduling

In React, state updates and effect executions are queued in the work loop:

```text
User Event / Callback Trigger
   │
   ▼
enqueueUpdate(fiber, update)
   │
   ▼
[ React Work Loop: Render Phase ──► Commit Phase ──► Passive Effects Flush ]
```

When running in standard Node.js/Vitest environments, asynchronous updates or detached event callbacks can trigger React updates outside of React's natural browser callstack. 

`act()` establishes an explicit execution boundary that intercepts and synchronously flushes:
1. **State transition queues** on the Fiber.
2. **Layout effects** (`useLayoutEffect`).
3. **Passive effects** (`useEffect` mount and cleanup queues).
4. **Microtasks** scheduled during the render cycle.

```tsx
// ✅ Correct: State update wrapped in act()
act(() => {
  result.current.increment();
});
expect(result.current.count).toBe(1);

// ❌ Flaky: State update without act() triggers React console warning:
// "Warning: An update to TestComponent inside a test was not wrapped in act(...)"
result.current.increment();
```

---

### 7. Testing State Transitions: Semantic Commands vs. Raw Setters

```tsx
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";

// The Hook under test
function useCounter(initialValue = 0, { step = 1, min = -Infinity, max = Infinity } = {}) {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount((prev) => Math.min(max, prev + step));
  }, [step, max]);

  const decrement = useCallback(() => {
    setCount((prev) => Math.max(min, prev - step));
  }, [step, min]);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  return { count, increment, decrement, reset };
}

describe("useCounter Behavioral Contract", () => {
  it("initializes with default value and step", () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it("increments state according to step parameter", () => {
    const { result } = renderHook(() => useCounter(0, { step: 5 }));
    
    act(() => {
      result.current.increment();
    });
    expect(result.current.count).toBe(5);

    act(() => {
      result.current.increment();
    });
    expect(result.current.count).toBe(10);
  });

  it("respects upper boundary constraint (max clamp invariant)", () => {
    const { result } = renderHook(() => useCounter(8, { step: 5, max: 10 }));
    
    act(() => {
      result.current.increment();
    });
    expect(result.current.count).toBe(10); // Clamped to max, not 13!
  });

  it("resets to initial value after multiple transitions", () => {
    const { result } = renderHook(() => useCounter(100, { step: 10 }));
    
    act(() => {
      result.current.increment();
      result.current.increment();
    });
    expect(result.current.count).toBe(120);

    act(() => {
      result.current.reset();
    });
    expect(result.current.count).toBe(100);
  });
});
```

---

### 8. Testing Dynamic Props & `rerender()` Transitions

When a custom Hook receives dynamic configuration parameters from a parent component, tests must verify that changes to those props correctly update internal memoized callbacks and synchronization effects:

```tsx
describe("useCounter Dynamic Props Synchronization", () => {
  it("adapts dynamically when step prop changes across renders", () => {
    const { result, rerender } = renderHook(
      ({ step }) => useCounter(0, { step }),
      { initialProps: { step: 1 } }
    );

    act(() => {
      result.current.increment();
    });
    expect(result.current.count).toBe(1);

    // Dynamic Rerender: Step changes from 1 to 10
    rerender({ step: 10 });

    act(() => {
      result.current.increment();
    });
    expect(result.current.count).toBe(11); // 1 + 10 = 11
  });
});
```

---

### 9. Testing `useEffect` Lifecycle & Cleanup Symmetry

A critical responsibility of custom Hook testing is validating that **setup side-effects on mount are 100% symmetrically undone on unmount**, preventing memory leaks in single-page applications.

```tsx
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

function useWindowOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

describe("useWindowOnlineStatus Lifecycle & Cleanup", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { onLine: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("installs event listeners on mount and reacts to browser events", () => {
    const { result } = renderHook(() => useWindowOnlineStatus());
    expect(result.current).toBe(true);

    // Simulate browser offline event
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current).toBe(false);

    // Simulate browser online event
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current).toBe(true);
  });

  it("strictly cleans up window event listeners on unmount (Symmetric Teardown)", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    
    const { result, unmount } = renderHook(() => useWindowOnlineStatus());
    
    // Unmount the Hook harness
    unmount();

    expect(removeSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("offline", expect.any(Function));

    // Behavioral proof: Dispatched events after unmount must NOT cause state updates or errors
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    // result.current remains unchanged from its last committed state before unmount
    expect(result.current).toBe(true);
  });
});
```

---

### 10. Testing Asynchronous Custom Hooks & Controlled Deferred Promises

When testing asynchronous data fetching or state machine hooks, **never rely on `setTimeout` or real network requests**. Use a **Deferred Promise harness** to deterministically control exact resolution and rejection timing:

```tsx
// Reusable Deferred Promise Test Utility
export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
}

export function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}
```

```tsx
// The Async Hook under test
interface AsyncState<T> {
  status: "idle" | "loading" | "success" | "error";
  data: T | null;
  error: Error | null;
}

function useAsync<T>(asyncFn: () => Promise<T>) {
  const [state, setState] = useState<AsyncState<T>>({
    status: "idle",
    data: null,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ status: "loading", data: null, error: null });
    try {
      const result = await asyncFn();
      setState({ status: "success", data: result, error: null });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState({ status: "error", data: null, error });
      throw error;
    }
  }, [asyncFn]);

  return { ...state, execute };
}

describe("useAsync Controlled State Machine Testing", () => {
  it("transitions through idle -> loading -> success state machine", async () => {
    const deferred = createDeferred<string>();
    const fetcher = vi.fn().mockReturnValue(deferred.promise);

    const { result } = renderHook(() => useAsync(fetcher));
    expect(result.current.status).toBe("idle");
    expect(result.current.data).toBeNull();

    // Trigger asynchronous execution
    let executionPromise: Promise<string>;
    act(() => {
      executionPromise = result.current.execute();
    });

    // Verify immediate synchronous loading state
    expect(result.current.status).toBe("loading");
    expect(result.current.data).toBeNull();

    // Manually resolve the deferred promise
    await act(async () => {
      deferred.resolve("Quantum Payload");
      await executionPromise;
    });

    // Verify terminal success state
    expect(result.current.status).toBe("success");
    expect(result.current.data).toBe("Quantum Payload");
    expect(result.current.error).toBeNull();
  });

  it("transitions through idle -> loading -> error on promise rejection", async () => {
    const deferred = createDeferred<string>();
    const fetcher = vi.fn().mockReturnValue(deferred.promise);

    const { result } = renderHook(() => useAsync(fetcher));

    let executionPromise: Promise<string>;
    act(() => {
      executionPromise = result.current.execute();
    });

    expect(result.current.status).toBe("loading");

    // Manually reject the deferred promise
    await act(async () => {
      deferred.reject(new Error("Network Gateway Timeout 504"));
      try {
        await executionPromise;
      } catch {
        // Expected caught error
      }
    });

    expect(result.current.status).toBe("error");
    expect(result.current.data).toBeNull();
    expect(result.current.error?.message).toBe("Network Gateway Timeout 504");
  });
});
```

---

### 11. Testing Race Conditions & Out-Of-Order Resolution (Latest-Wins Invariant)

In production search and typeahead hooks, rapid user queries generate multiple concurrent in-flight HTTP requests. If Request 1 takes 500ms and Request 2 takes 50ms, Request 1 may resolve *after* Request 2, overwriting fresher data with stale data.

A senior test suite **must explicitly construct this race scenario**:

```tsx
function useSearch(fetcher: (query: string) => Promise<string[]>) {
  const [data, setData] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const activeReqIdRef = useRef(0);

  const search = useCallback(async (query: string) => {
    const requestId = ++activeReqIdRef.current;
    setLoading(true);

    try {
      const results = await fetcher(query);
      // Latest-Wins Guard: Ignore stale response if a newer query was issued
      if (requestId === activeReqIdRef.current) {
        setData(results);
        setLoading(false);
      }
    } catch {
      if (requestId === activeReqIdRef.current) {
        setLoading(false);
      }
    }
  }, [fetcher]);

  return { data, loading, search };
}

describe("useSearch Race Condition Verification (Latest-Wins Invariant)", () => {
  it("preserves latest query results when earlier requests resolve late", async () => {
    const deferredA = createDeferred<string[]>();
    const deferredB = createDeferred<string[]>();

    const mockFetcher = vi.fn((query: string) => {
      if (query === "React") return deferredA.promise;
      if (query === "Rust") return deferredB.promise;
      return Promise.resolve([]);
    });

    const { result } = renderHook(() => useSearch(mockFetcher));

    // 1. User types "React" (Request A starts)
    act(() => {
      result.current.search("React");
    });

    // 2. User immediately changes input to "Rust" (Request B starts)
    act(() => {
      result.current.search("Rust");
    });

    // 3. Out-of-order resolution: Request B (Rust) finishes FIRST!
    await act(async () => {
      deferredB.resolve(["Rust Book", "Cargo", "Tokio"]);
      await deferredB.promise;
    });

    expect(result.current.data).toEqual(["Rust Book", "Cargo", "Tokio"]);

    // 4. Stale Request A (React) finishes LATER!
    await act(async () => {
      deferredA.resolve(["React 18", "Fiber", "Hooks"]);
      await deferredA.promise;
    });

    // CRITICAL ASSERTION: Stale Request A MUST BE DISCARDED!
    expect(result.current.data).toEqual(["Rust Book", "Cargo", "Tokio"]);
  });
});
```

---

### 12. Testing Context-Gateway Hooks with Wrapper Harnesses

```tsx
interface AuthContextType {
  user: { id: string; name: string; role: string } | null;
  login: (name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be consumed within an <AuthProvider>");
  }
  return context;
}

describe("useAuth Context Gateway Contracts", () => {
  it("fails fast with explicit descriptive error when rendered outside AuthProvider", () => {
    // Suppress expected React console error for clean test output
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be consumed within an <AuthProvider>");

    consoleSpy.mockRestore();
  });

  it("consumes authenticated context contract when rendered inside AuthProvider wrapper", () => {
    const mockAuthValue: AuthContextType = {
      user: { id: "usr_99", name: "Alice Architect", role: "Staff Engineer" },
      login: vi.fn(),
      logout: vi.fn(),
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={mockAuthValue}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual({
      id: "usr_99",
      name: "Alice Architect",
      role: "Staff Engineer",
    });

    act(() => {
      result.current.logout();
    });
    expect(mockAuthValue.logout).toHaveBeenCalledTimes(1);
  });
});
```

---

### 13. Testing Referential Stability Contracts

When a custom Hook documents that its exposed action functions or objects are referentially stable across renders, tests must explicitly assert identity equality (`toBe`):

```tsx
function useStableActions() {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => {
    setCount((c) => c + 1);
  }, []); // Guaranteed stable identity

  return { count, increment };
}

describe("useStableActions Referential Stability Contract", () => {
  it("preserves identical function reference across re-renders", () => {
    const { result, rerender } = renderHook(() => useStableActions());

    const firstIncrementRef = result.current.increment;

    act(() => {
      result.current.increment();
    });
    expect(result.current.count).toBe(1);

    rerender();

    const secondIncrementRef = result.current.increment;

    // Must be strictly referentially identical (same pointer memory)
    expect(secondIncrementRef).toBe(firstIncrementRef);
  });
});
```

---

## Layer 3 — 🛠️ Production Crucibles & Anti-Patterns

### 14. Anti-Pattern Crucible: The 5 Testing Traps

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       THE 5 HOOK TESTING ANTI-PATTERNS                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Testing Implementation     │ Asserting spyOn(React, "useState") or       │
│    Instead of Behavior        │ spying on private helper functions.         │
├───────────────────────────────┼─────────────────────────────────────────────┤
│ 2. Real Clock Timeouts        │ Using setTimeout(done, 1000) instead of     │
│                               │ vi.useFakeTimers() and vi.advanceTimersBy().│
├───────────────────────────────┼─────────────────────────────────────────────┤
│ 3. Happy-Path Only Testing    │ Never testing network rejections, aborted   │
│                               │ requests, or empty collection edge cases.   │
├───────────────────────────────┼─────────────────────────────────────────────┤
│ 4. Missing Unmount Checks     │ Forgetting to test cleanup destructors for  │
│                               │ event listeners, timers, and WebSockets.    │
├───────────────────────────────┼─────────────────────────────────────────────┤
│ 5. Over-Mocking React         │ Mocking the React dispatcher or Fiber       │
│    Internals                  │ instead of using real renderHook harnesses. │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 15. Production Incident #1: The Leaked Window Listener Memory Disaster

#### The Scenario:
In an analytics dashboard, a custom hook `useScrollPosition()` tracked window scroll events for a data table. When users navigated between tabs, application memory climbed by 150MB per hour until the browser tab crashed with an Out-of-Memory (OOM) error.

#### Root Cause:
```tsx
// ❌ BROKEN HOOK
function useScrollPosition() {
  const [pos, setPos] = useState(0);

  useEffect(() => {
    const onScroll = () => setPos(window.scrollY);
    window.addEventListener("scroll", onScroll);
    // ❌ Missing return () => window.removeEventListener(...)!
  }, []);

  return pos;
}
```

#### The Senior Regression Test That Prevents It:
```tsx
it("strictly unregisters scroll listener on unmount to prevent memory leaks", () => {
  const removeSpy = vi.spyOn(window, "removeEventListener");
  const { unmount } = renderHook(() => useScrollPosition());

  unmount();

  expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
});
```

---

### 16. Production Incident #2: Stale Callback Closure in WebSocket Hook

#### The Scenario:
A crypto trading terminal used `useWebSocket(onMessage)` to stream live prices. When the parent component re-rendered with an updated filter criteria in `onMessage`, the hook continued executing the stale initial version of `onMessage` from mount, causing missed trade alerts.

#### Root Cause:
```tsx
// ❌ BROKEN HOOK: Captured stale callback in effect closure
function useWebSocket(url: string, onMessage: (data: any) => void) {
  useEffect(() => {
    const ws = new WebSocket(url);
    ws.onmessage = (e) => onMessage(JSON.parse(e.data)); // Stale closure!
    return () => ws.close();
  }, [url]); // onMessage omitted from deps to avoid reconnecting
}
```

#### The Senior Fix & Test Harness:
```tsx
// ✅ SENIOR STANDARD: Latest Ref Pattern
function useWebSocket(url: string, onMessage: (data: any) => void) {
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  });

  useEffect(() => {
    const ws = new WebSocket(url);
    ws.onmessage = (e) => onMessageRef.current?.(JSON.parse(e.data));
    return () => ws.close();
  }, [url]);
}

// Verification Test:
it("executes the latest callback without closing the active WebSocket connection", () => {
  const firstCallback = vi.fn();
  const secondCallback = vi.fn();

  const { rerender } = renderHook(
    ({ cb }) => useWebSocket("wss://stream.io", cb),
    { initialProps: { cb: firstCallback } }
  );

  // Rerender with new callback
  rerender({ cb: secondCallback });

  // Simulate incoming WebSocket packet
  mockWsInstance.triggerMessage({ price: 42000 });

  expect(firstCallback).not.toHaveBeenCalled();
  expect(secondCallback).toHaveBeenCalledWith({ price: 42000 });
});
```

---

### 17. Decision Matrix: Unit vs. Integration vs. E2E Testing for Hooks

| Interaction / Feature Type | Recommended Test Type | Rationale & Execution Environment |
| :--- | :--- | :--- |
| **Pure State Transitions** (`useCounter`, `useToggle`) | Hook Unit Test | Ultra-fast execution via `renderHook` + `act()`. |
| **Browser Subscriptions** (`useOnline`, `useResize`) | Hook Unit Test with JSDOM mocks | Validates listener installation and teardown symmetry. |
| **Async Data Fetching & Caching** (`useQuery`) | Hook Unit Test + Deferred Promises | Precise microtask and race condition determinism. |
| **Context Gateway Hooks** (`useAuth`, `useTheme`) | Hook Test with Wrapper Provider | Tests fail-fast guards and downstream consumption. |
| **Complex Headless UI** (`useMenu`, `useListbox`) | Component Integration Test | Needs real DOM focus, keyboard bubbling, and ARIA roles. |
| **Full User Checkout Flow** | Playwright / Cypress E2E | Verifies backend integration, cookies, and visual DOM. |

---

## Layer 4 — 🧪 Diagnostic Gauntlet & Master Checklist

### 18. Senior Prediction Challenges

#### Challenge #1:
```tsx
const { result } = renderHook(() => useCounter(0));
result.current.increment();
expect(result.current.count).toBe(1);
```
**Question:** Why does this test potentially fail or throw a warning in React 18?  
**Answer:** The state mutation `increment()` was called outside an `act()` wrapper. In React 18, state updates scheduled outside React's render/event loop must be wrapped in `act(() => { ... })` to synchronously flush pending Fiber work.

---

#### Challenge #2:
```tsx
const { result, rerender } = renderHook(() => usePrevious("Alpha"));
rerender();
```
**Question:** What is `result.current` after the first render and after `rerender()`?  
**Answer:** On the first render, `result.current` is `undefined` because `ref.current` is only updated inside `useEffect` *after* the initial render commits. On `rerender()`, `result.current` returns `"Alpha"`, which was captured during the previous commit.

---

### 19. 10 Senior Interview Questions & Staff-Level Answers

#### Q1: What is the mechanical difference between testing a custom hook via `renderHook` versus creating a manual test component?
> **Staff-Level Answer:** Under the hood, `renderHook` creates an internal synthetic component `<TestComponent />`, wraps it in any provided Context wrapper, and renders it using React DOM's test renderer. It encapsulates the boilerplates of creating a ref to capture `result.current`, handling errors, and exposing `rerender()` and `unmount()` handles while preserving the exact same Fiber architecture.

#### Q2: How do you deterministically test a race condition in a custom hook without using `setTimeout`?
> **Staff-Level Answer:** Use Deferred Promises (`createDeferred<T>()`). By creating two unfulfilled promises for Query A and Query B, triggering both queries, and then resolving Promise B *before* Promise A, we can deterministically assert that Query A's late-arriving response is safely discarded by the Hook's internal currentness/cancellation guard.

#### Q3: Why should we test cleanup symmetry on unmount?
> **Staff-Level Answer:** Because SPA applications do not refresh the page during user navigation. An unmounted custom hook that fails to remove an event listener, clear a timer, disconnect an observer, or abort an HTTP request will leak memory and potentially attempt state updates on unmounted component trees.

#### Q4: When should you assert referential equality (`toBe`) on a custom hook return value?
> **Staff-Level Answer:** Only when referential stability is an explicit part of the public API contract (e.g. passing stable callbacks to memoized children like `React.memo` or dependency arrays). Asserting stability on every internal object couples tests to implementation details and prevents harmless refactoring.

#### Q5: How do you test a custom hook that relies on `window.matchMedia` in JSDOM?
> **Staff-Level Answer:** JSDOM does not implement `window.matchMedia`. We define a controlled mock on `window` using `vi.stubGlobal` or `Object.defineProperty` that returns an object matching the `MediaQueryList` interface (`matches`, `addEventListener`, `removeEventListener`), allowing the test to manually dispatch `change` events.

#### Q6: What is the purpose of `initialProps` in `renderHook`?
> **Staff-Level Answer:** `initialProps` sets the initial arguments passed to the hook callback during the first render. It is paired with `rerender(newProps)` to test how the hook responds to prop changes, dependency recalculations, and stale closures.

#### Q7: How do you verify that a Context-Gateway hook fails fast outside its Provider?
> **Staff-Level Answer:** Render the hook without a wrapper and assert that it throws the expected descriptive error using `expect(() => renderHook(() => useMyHook())).toThrow("descriptive message")`. We also spy on `console.error` during the assertion to prevent expected React error logs from polluting test output.

#### Q8: Why is mocking `useState` or `useEffect` directly an anti-pattern?
> **Staff-Level Answer:** Mocking React primitives replaces React's real Fiber engine with a fake simulation, invalidating all guarantees about state scheduling, batched updates, effect timing, and cleanup ordering. Tests should treat React as an immutable black-box runtime.

#### Q9: How do you test a custom hook that uses `useId()`?
> **Staff-Level Answer:** `useId()` produces deterministic strings scoped to the component tree. Tests should assert that generated ARIA IDs remain consistent across re-renders and correctly link triggers to panels (`aria-controls === panelId`).

#### Q10: What is the difference between `vi.useFakeTimers()` and real wall-clock delays in hook testing?
> **Staff-Level Answer:** Real wall-clock delays (`setTimeout`) cause slow, flaky tests vulnerable to CPU throttling in CI/CD pipelines. `vi.useFakeTimers()` virtualizes the clock, allowing instantaneous, deterministic time advancement via `vi.advanceTimersByTime(ms)` without waiting.

---

### 20. 50-Point Senior Hook Testing & Isolation Mastery Checklist

#### Contract & Test Architecture
- [ ] 1. Tests verify observable behavioral contracts rather than internal implementation lines.
- [ ] 2. `renderHook` from `@testing-library/react` is used as the standard execution harness.
- [ ] 3. React primitives (`useState`, `useEffect`, `useRef`) are never mocked.
- [ ] 4. Test files are co-located with their respective hooks (`useCounter.test.ts`).
- [ ] 5. Each test validates a single logical state transition or lifecycle boundary.
- [ ] 6. Happy-path, edge-case, and error-path scenarios are all represented.
- [ ] 7. Public API contracts are tested before refactoring internal implementation.
- [ ] 8. Descriptive test names explain the expected domain behavior.
- [ ] 9. Flaky async assertions (`sleep()`, `setTimeout()`) are strictly banned.
- [ ] 10. Test execution runs 100% deterministically in headless CI environments.

#### State Transitions & `act()`
- [ ] 11. All state mutations and actions are wrapped in `act()`.
- [ ] 12. Multiple consecutive actions in a single frame verify functional updater correctness.
- [ ] 13. State clamps and validation boundaries (min/max/regex) are verified.
- [ ] 14. Reset actions restore exact initial state snapshots.
- [ ] 15. Derived state computations update synchronously with input mutations.
- [ ] 16. Reducer-backed hooks cover all action types in the discriminated union.
- [ ] 17. Unhandled action types preserve previous state without throwing.
- [ ] 18. Complex object state updates maintain immutability.
- [ ] 19. Form hooks verify dirty, touched, and validation error state cascades.
- [ ] 20. Zero "not wrapped in act(...)" warnings in Vitest test runs.

#### Lifecycle & Cleanup Symmetry
- [ ] 21. Mount effect setup installs all required external subscriptions.
- [ ] 22. `unmount()` explicitly executes all cleanup destructors.
- [ ] 23. Event listener removal matches exact callback reference (`removeEventListener`).
- [ ] 24. Timers and intervals are cleared on unmount (`clearInterval`, `clearTimeout`).
- [ ] 25. Observers are disconnected on unmount (`observer.disconnect()`).
- [ ] 26. WebSockets / SSE streams are closed on unmount (`ws.close()`).
- [ ] 27. Dispatched events after unmount do not trigger state mutations or warnings.
- [ ] 28. Mount ➔ Unmount ➔ Remount cycles verify zero duplicate listeners.
- [ ] 29. StrictMode double-mount simulation produces idempotent side-effects.
- [ ] 30. Cleanup functions do not throw exceptions if unmounted during loading.

#### Async, Promises & Race Conditions
- [ ] 31. Asynchronous operations use Deferred Promises for controlled resolution.
- [ ] 32. Loading state is verified immediately upon execution trigger.
- [ ] 33. Success state exposes resolved payload and clears error metadata.
- [ ] 34. Rejection transitions to error state and captures Error instance.
- [ ] 35. Out-of-order responses verify the Latest-Wins policy (stale results dropped).
- [ ] 36. AbortController signals are triggered on cancellation or unmount.
- [ ] 37. Rapid query mutations do not leave dangling unhandled rejections.
- [ ] 38. Retry logic respects exponential backoff and max attempt counts.
- [ ] 39. Debounce/Throttle hooks verify timer cancellation on rapid keystrokes.
- [ ] 40. Polling hooks verify recurring interval execution and pause triggers.

#### Environment, Context & Isolation
- [ ] 41. Context-dependent hooks verify fail-fast exceptions without Provider.
- [ ] 42. Context wrappers supply mock values matching full TypeScript interfaces.
- [ ] 43. Browser APIs (`window.matchMedia`, `IntersectionObserver`) use standard mocks.
- [ ] 44. `localStorage` mocks handle quota exceeded and JSON parsing failures.
- [ ] 45. `navigator.onLine` mocks test online/offline transitions cleanly.
- [ ] 46. Multiple concurrent hook instances operate in complete state isolation.
- [ ] 47. Global mocks are cleanly reset in `afterEach()` (`vi.unstubAllGlobals()`).
- [ ] 48. Referential stability is verified on callbacks returning from `useCallback`.
- [ ] 49. Headless prop-getters inject valid ARIA attributes and merge event handlers.
- [ ] 50. Code coverage reports reflect 100% branch coverage over core invariants.

---

### 21. Graduation Gate

You have mastered Part 13 when you can take any asynchronous, browser-integrated custom Hook and author a complete Vitest suite that validates its initial contract, dynamic prop updates, out-of-order race conditions, and symmetric teardown without ever mocking React internals or introducing timing flakiness.

---

[⬅️ Previous Part](./12-headless-ui-and-interaction-coordination.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](./examples/13-testing-custom-hooks-and-vitest-harnesses.html) | [Next Part ➡️](./14-custom-hooks-crucible-and-production-traps.md)
