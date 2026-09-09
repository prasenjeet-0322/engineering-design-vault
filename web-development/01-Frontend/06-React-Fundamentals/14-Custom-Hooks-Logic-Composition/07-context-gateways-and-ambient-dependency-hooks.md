# Level 06 — React Fundamentals
## KPI 12 — Custom Hooks & Logic Composition
### PART 07 — Custom Hooks & Context Gateways

[⬅️ Previous Part](./06-refs-and-mutable-instance-coordination.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](./examples/07-custom-hooks-and-context-gateways.html) | [Next Part ➡️](./08-performance-optimization-and-memoization.md)

---

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)  
> **Co-Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)

---

# PART 07 — Custom Hooks & Context Gateways

```text
                               THE CONTEXT GATEWAY ARCHITECTURE
                               
   LEAKY DIRECT COUPLING (Anti-Pattern)                 ENCAPSULATED DOMAIN GATEWAY (Senior Standard)
   
  ┌─────────────────────────────────────┐              ┌─────────────────────────────────────┐
  │         Feature Consumer            │              │          Feature Consumer           │
  └──────────────────┬──────────────────┘              └──────────────────┬──────────────────┘
                     │ Raw useContext(Token)                              │ useAuth()
                     ▼                                                    ▼
  ┌─────────────────────────────────────┐              ┌─────────────────────────────────────┐
  │    Public Context Token & Reducer   │              │     Context Gateway (useAuth)       │
  │  • Exposes dispatch({ type: ... })  │              │  • Runtime Invariant Guard (throw)  │
  │  • Returns T | null everywhere      │              │  • Strict Non-Null TypeScript Type  │
  │  • No boundary validation           │              │  • Semantic Domain Command Facade   │
  └──────────────────┬──────────────────┘              └──────────────────┬──────────────────┘
                     │                                                    │ Internal Read
                     ▼                                                    ▼
  ┌─────────────────────────────────────┐              ┌─────────────────────────────────────┐
  │        Generic Root Provider        │              │  Private Token & Scoped Provider    │
  └─────────────────────────────────────┘              └─────────────────────────────────────┘
```

---

## Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

### 1. Executive Summary

A **Context Gateway** is a custom Hook that acts as the sole public API boundary through which React components consume a Context-backed dependency.

Instead of allowing application code across hundreds of files to import and consume raw Context tokens directly:
```tsx
// ❌ Anti-pattern: Application code coupled directly to ambient storage mechanism
const auth = useContext(AuthContext);
```

The architecture encapsulates the storage mechanics, invariant assertions, and state transformations behind a domain-specific custom Hook gateway:
```tsx
// ✅ Senior Architecture: Clean domain contract
const { user, signIn, signOut } = useAuth();
```

The React Context becomes an unexported, encapsulated implementation detail. The consumer component depends strictly on the domain contract.

```text
┌────────────────────────────────────────┐
│             AuthProvider               │
│                                        │
│   ┌────────────────────────────────┐   │
│   │     private AuthContext        │   │
│   └───────────────┬────────────────┘   │
│                   │                    │
│                   ▼                    │
│              domain value              │
└───────────────────┬────────────────────┘
                    │
                    ▼
          ┌───────────────────┐
          │     useAuth()     │
          │  Context Gateway  │
          └─────────┬─────────┘
                    │
      ┌─────────────┼─────────────┐
      ▼             ▼             ▼
  LoginForm      Header       Settings
```

The critical architectural thesis:
> **Context distributes a dependency through the React tree; the custom Hook gateway defines how consumers are authorized and shaped to depend on it.**

---

### 2. Architectural Equation

$$\text{Context Gateway} = \text{Private Context Token} + \text{Provider Ownership} + \text{Domain Hook API} + \text{Runtime Invariant Guard} + \text{Implementation Encapsulation}$$

A mature enterprise implementation strictly obeys the following lifecycle topology:

```text
createContext<T | null>(null)
           │
           ▼
Provider owns state & commands
           │
           ▼
Private Context Token (Unexported)
           │
           ▼
useDomain() Gateway Hook
   ├── 1. Read Context via useContext
   ├── 2. Validate Provider ancestry (Fail-Fast Invariant)
   └── 3. Return narrowed, type-safe Domain Contract
```

---

### 3. The Fundamental Problem of Raw `useContext`

Consider the naive implementation frequently found in junior-to-mid codebases:

```tsx
// ❌ auth-context.ts
export interface AuthContextValue {
  user: { id: string; name: string } | null;
  status: "idle" | "authenticated" | "loading";
  dispatch: React.Dispatch<any>;
}

// Exported public context token
export const AuthContext = createContext<AuthContextValue | null>(null);

// ❌ ConsumerComponent.tsx
export function LoginButton() {
  const auth = useContext(AuthContext);
  return (
    <button onClick={() => auth?.dispatch({ type: "SIGN_OUT" })}>
      Sign out
    </button>
  );
}
```

This pattern creates four catastrophic architectural vulnerabilities:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       THE 4 FLAWS OF RAW CONTEXT CONSUMPTION                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Storage Coupling   │ Consumers know auth is stored in React Context. If  │
│                       │ we migrate to Zustand or TanStack, all files break. │
├───────────────────────┼─────────────────────────────────────────────────────┤
│ 2. Leaked Infrastructure│ Context token is public. Any component can bypass │
│                       │ domain rules, read raw states, or mock incorrectly. │
├───────────────────────┼─────────────────────────────────────────────────────┤
│ 3. Runtime Null Hell  │ auth?.user and auth?.dispatch mask missing provider │
│                       │ bugs, causing silent failures in production.        │
├───────────────────────┼─────────────────────────────────────────────────────┤
│ 4. Dispatch Leakage   │ Reducer action types leak globally. Refactoring an  │
│                       │ action string requires codebase-wide find-and-replace│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 4. Context Gateway Mental Model

The gateway acts as an architectural membrane between the internal state management mechanics of a feature and the consumer components that express domain intent:

```text
DOMAIN INTERNALS (Private)
          │
          ▼
┌──────────────────────────────────┐
│           AuthProvider           │
│  • useReducer / useState         │
│  • Token refreshing timers       │
│  • Async network calls           │
│  • Semantic action wrappers      │
└─────────────────┬────────────────┘
                  │
                  ▼ (Private Context Value)
┌──────────────────────────────────┐
│             useAuth              │  <--- ARCHITECTURAL MEMBRANE
│  • Asserts Provider exists       │       (Narrows types, encapsulates mechanics)
│  • Exposes stable domain methods │
└─────────────────┬────────────────┘
                  │
                  ▼ (Strict Non-Null Domain Contract)
┌─────────────────┼──────────────────┐
│                 │                  │
▼                 ▼                  ▼
LoginForm       Header           AccountPage
```

---

### 5. Essential Distinctions

| Concept | Architectural Role | Fiber / Runtime Representation |
| :--- | :--- | :--- |
| **Context** | React dependency propagation channel | Module-level object token containing `$$typeof`, `Provider`, and `_currentValue` |
| **Provider** | Establishes the current value for a given subtree | Fiber node (`ContextProvider`) storing `memoizedProps.value` |
| **Context Token** | The unique identity used by React to lookup ancestry | Static JS object reference created via `createContext()` |
| **Gateway Hook** | Public consumer API and invariant validator | Composable JS function executing within caller Fiber |
| **Domain Contract** | The semantic methods and state exposed to callers | Strict TypeScript interface (e.g., `signIn()`, `user`) |
| **Raw Dispatch** | Primitive state machine transition trigger | `React.Dispatch<Action>` leaking internal reducer mechanics |
| **Invariant Guard** | Runtime check throwing if Provider is absent | `if (val === null) throw new Error(...)` |
| **Provider Scope** | Boundary of lifetime and isolation for state | Subtree spanned by `<FeatureProvider>` in the JSX tree |

---

### 6. Private Context vs. Public Hook

#### ❌ Weak Architecture (Exposed Infrastructure)
```tsx
// auth.ts
export const AuthContext = createContext<AuthContextValue | null>(null);

// Header.tsx
import { AuthContext } from "./auth";

export function Header() {
  const auth = useContext(AuthContext); // Can be null, requires auth?.
  return <div>{auth?.user?.name}</div>;
}
```

#### ✅ Gateway Architecture (Private Infrastructure, Public Domain)
```tsx
// auth.tsx
const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (value === null) {
    throw new Error(
      "Invariant Violation: useAuth() was called outside of an <AuthProvider>. " +
      "Ensure the calling component is nested within an AuthProvider subtree."
    );
  }
  return value;
}

// Header.tsx
import { useAuth } from "./auth";

export function Header() {
  const { user, signOut } = useAuth(); // Guaranteed non-null AuthContextValue!
  return <div>{user.name}</div>;
}
```

---

### 7. Why `null` Is the Only Correct Default for Mandatory Providers

A common anti-pattern is creating dummy or mock default objects inside `createContext()` to avoid handling `null`:

```tsx
// ❌ Dangerous Mock Default
export const AuthContext = createContext<AuthContextValue>({
  user: null,
  status: "idle",
  signIn: async () => {}, // Fake stub
  signOut: async () => {}, // Fake stub
});
```

#### Why Fake Defaults are Dangerous:
If a component calls `useAuth()` outside an `<AuthProvider>`, the mock default silently executes without errors. The user clicks "Sign Out", nothing happens, network calls are skipped, and UI shows ghost states.

```text
MISSING PROVIDER WITH FAKE DEFAULT (Catastrophic Silent Failure):
Component calls useAuth() outside Provider ──► Returns Fake Stub ──► Click "Sign Out" ──► No-op ──► Silent Bug

MISSING PROVIDER WITH NULL + GATEWAY GUARD (Fast-Fail Senior Standard):
Component calls useAuth() outside Provider ──► Reads null ──► Invariant Throws ──► Caught in Dev/Tests immediately!
```

---

### 8. Fail-Fast Invariant Guards

The gateway enforces an unbreakable runtime invariant:

$$\text{useAuth() succeeds} \iff \text{AuthProvider exists in component ancestry}$$

```tsx
export function useFeatureGateway<T>(
  context: React.Context<T | null>,
  hookName: string,
  providerName: string
): T {
  const value = useContext(context);
  if (value === null) {
    throw new Error(
      `[Architectural Invariant Violation]: '${hookName}' must be used within a '<${providerName}>'. ` +
      `No matching context provider was found in the component tree ancestry.`
    );
  }
  return value;
}
```

---

### 9. TypeScript Contract Transformation

Without a gateway, every consumer must either perform manual null checking or abuse optional chaining (`auth?.user`), propagating uncertainty throughout the codebase:

```text
Without Gateway:
useContext(AuthContext) ────────► AuthContextValue | null ──► Requires null checks in every component!

With Gateway:
useAuth() ──[ Guard: if (val === null) throw ]──► AuthContextValue (Strictly Non-Null!)
```

```tsx
export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within <WorkspaceProvider>");
  }
  // TypeScript narrows type from `WorkspaceContextValue | null` to `WorkspaceContextValue`
  return ctx;
}
```

---

### 10. Gateway Hooks Are Semantic Dependency Boundaries

Compare the cognitive load:

```tsx
// Codebase A: Raw Context
const data = useContext(DataContext);
const session = useContext(SessionContext);
const flags = useContext(FeatureFlagContext);

// Codebase B: Gateway Hooks
const { currentProject } = useActiveProject();
const { currentUser, isSessionExpired } = useUserSession();
const { isFeatureEnabled } = useFeatureFlags();
```

In Codebase B:
1. The component communicates **what domain entities it needs**, not **where they are stored in React**.
2. If `useFeatureFlags()` switches from Context to an internal LaunchDarkly SDK, consumer components do not modify a single line of code.

---

## Layer 2 — 🔬 Deep Mechanical Breakdown & Fiber Internals

### 11. Custom Hooks Do Not Create Fibers

A foundational React invariant:
> **Custom Hooks are plain JavaScript functions. They do NOT create Fiber nodes, component boundaries, or DOM elements.**

```text
COMPONENT TREE (Fibers)              HOOK EXECUTION TOPOLOGY (Inside Header Fiber)
┌─────────────────────────┐         ┌──────────────────────────────────────────────┐
│  AuthProvider Fiber     │         │ Header Fiber                                 │
│  (state, memoizedProps) │         │  ├── memoizedState: Hook 1 (useContext)      │
└───────────┬─────────────┘         │  │     └── points to AuthContext._currentVal │
            │                       │  ├── next: Hook 2 (useState / counter)       │
            ▼                       │  └── next: Hook 3 (useEffect)                │
┌─────────────────────────┐         └──────────────────────────────────────────────┘
│      Header Fiber       │
└─────────────────────────┘
```

When `Header` calls `useAuth()`, React's currently rendering Fiber dispatcher (`ReactCurrentDispatcher.current`) handles the nested `useContext` call, attaching the dependency directly to `Header`'s Fiber.

---

### 12. Hook Execution Topology & Linked List Traversal

Inside the React reconciler, a component's Hook list is a singly-linked list of `Hook` objects stored on `Fiber.memoizedState`:

```text
Header Fiber
  │
  └── memoizedState ──► ┌───────────────────────────────────────┐
                        │ Hook 1: useContext                   │
                        │ memoizedState: AuthContextValue       │
                        │ next                                  │
                        └──────────────────┬────────────────────┘
                                           │
                                           ▼
                        ┌───────────────────────────────────────┐
                        │ Hook 2: useRef                        │
                        │ memoizedState: { current: buttonRef } │
                        │ next                                  │
                        └──────────────────┬────────────────────┘
                                           │
                                           ▼
                        ┌───────────────────────────────────────┐
                        │ Hook 3: useCallback                   │
                        │ memoizedState: [callbackFn, [deps]]   │
                        │ next: null                            │
                        └───────────────────────────────────────┘
```

When `useAuth()` executes:
1. `useContext(AuthContext)` is called.
2. React checks `HeaderFiber.dependencies`.
3. React inserts a `ContextDependency<AuthContextValue>` into `HeaderFiber.dependencies.firstContext`.
4. If `AuthProvider` re-renders and produces a new reference, React marks `HeaderFiber.lanes` for re-rendering.

---

### 13. Context Gateway + Fiber Execution Walkthrough

```text
                  RENDER & DEPENDENCY REGISTRATION TIMELINE
                  
  Step 1: Begin Work on Header Fiber
          │
  Step 2: Execute Header() Functional Body
          │
  Step 3: Call useAuth() Gateway
          │
  Step 4: Execute useContext(AuthContext)
          │  ├── React reads ReactCurrentDispatcher.current.useContext(AuthContext)
          │  ├── Discovers nearest ancestor Provider Fiber (AuthProvider)
          │  └── Reads ProviderFiber.memoizedProps.value
          │
  Step 5: Gateway Asserts Invariant (value !== null)
          │
  Step 6: useAuth() returns AuthContextValue
          │
  Step 7: Header() constructs JSX output using domain contract
          │
  Step 8: Complete Work & Commit phase
```

---

### 14. Fiber Hook Linked List During Gateway Calls

Consider this component:

```tsx
function ProfileEditor() {
  const { user, updateName } = useAuth(); // Hook 1 (useContext)
  const [isEditing, setIsEditing] = useState(false); // Hook 2 (useState)
  const inputRef = useRef<HTMLInputElement>(null); // Hook 3 (useRef)
  // ...
}
```

The React reconciler does not distinguish whether Hook 1 came from `useAuth()` or raw `useContext()`. The sequence on `ProfileEditor`'s Fiber is identical:

```text
Hook 1 (Context Dependency) ──► Hook 2 (State) ──► Hook 3 (Ref)
```

The abstraction cost of the gateway Hook in terms of Fiber overhead is **zero bytes and zero extra nodes**.

---

### 15. Mount Timeline Mechanics

```text
1. Reconciler begins rendering <AuthProvider value={domainValue}>
   │
2. AuthProvider establishes domainValue in its Fiber memoizedProps
   │
3. Reconciler traverses child: <Header />
   │
4. Header() invokes useAuth()
   │
5. useAuth() executes useContext(AuthContext)
   │
6. React reconciler looks up current value for AuthContext:
   │  - Scans upward along return Fiber chain (Header ──► Div ──► AuthProvider)
   │  - Locates matching ContextProvider Fiber
   │  - Returns memoizedProps.value
   │
7. useAuth() verifies value !== null (Invariant Passes)
   │
8. useAuth() returns { user, signIn, signOut }
   │
9. Header() returns Virtual DOM
   │
10. Commit phase mounts DOM nodes
```

---

### 16. Update & Propagation Timeline

When state changes inside the Provider:

```text
1. User clicks "Sign In" inside LoginForm
   │
2. AuthProvider triggers internal setState({ user: { id: "u123", name: "Alice" } })
   │
3. AuthProvider schedules render on its Fiber
   │
4. AuthProvider re-renders, computing new value object:
   │  newValue = { user: { id: "u123", ... }, signIn, signOut }
   │
5. React compares newValue with oldValue via Object.is(newValue, oldValue)
   │  - If false: Marks all descendant Fibers with AuthContext dependency as DIRTY (Schedule Lane)
   │
6. Reconciler reaches Header Fiber (marked dirty due to context change):
   │  - Renders Header()
   │  - useAuth() executes useContext(AuthContext)
   │  - Returns fresh domain snapshot with Alice
   │  - Header updates UI to "Welcome, Alice"
   │
7. Commit Phase updates DOM
```

---

### 17. Context Gateway + Reducer Architecture

In production systems, feature state should be managed via `useReducer` inside the Provider, but **never** exposed as `{ state, dispatch }`.

```tsx
// 1. Internal Discriminated Union Actions
type AuthAction =
  | { type: "SIGN_IN_START" }
  | { type: "SIGN_IN_SUCCESS"; payload: { user: User; token: string } }
  | { type: "SIGN_IN_FAILURE"; payload: { error: string } }
  | { type: "SIGN_OUT" };

// 2. Internal State Shape
interface AuthState {
  user: User | null;
  token: string | null;
  status: "idle" | "authenticating" | "authenticated" | "error";
  error: string | null;
}

// 3. Internal Reducer Function
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SIGN_IN_START":
      return { ...state, status: "authenticating", error: null };
    case "SIGN_IN_SUCCESS":
      return {
        user: action.payload.user,
        token: action.payload.token,
        status: "authenticated",
        error: null,
      };
    case "SIGN_IN_FAILURE":
      return { ...state, status: "error", error: action.payload.error };
    case "SIGN_OUT":
      return { user: null, token: null, status: "idle", error: null };
    default:
      return state;
  }
}
```

---

### 18. The Hazard of Raw Dispatch Leakage

If the Provider exposes `{ state, dispatch }`:

```tsx
// ❌ Dangerous Leaked Reducer Mechanics
export function UserProfile() {
  const { state, dispatch } = useAuthContext();

  const handleUpdate = () => {
    // Consumer knows internal action string!
    dispatch({ type: "SIGN_IN_SUCCESS", payload: { user: newUser, token: "abc" } });
  };
}
```

#### Why This Breaks Scaled Codebases:
1. **No Validation:** A consumer can dispatch invalid payloads or transition from illegal states.
2. **Coupling:** Renaming an action type in the reducer breaks every consuming component.
3. **No Side Effects:** Consumers cannot easily trigger async operations or logging alongside state transitions.

---

### 19. Encapsulated Domain Command API

Instead of exposing `dispatch`, the Provider constructs semantic domain commands:

```tsx
// ✅ Public Domain Contract
export interface AuthContract {
  // Read-only state
  user: User | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  authError: string | null;

  // Semantic Domain Commands
  signIn(credentials: LoginCredentials): Promise<void>;
  signOut(): Promise<void>;
  clearError(): void;
}
```

```text
RAW DISPATCH VS DOMAIN COMMAND FACADE
┌───────────────────────────────────────┐        ┌───────────────────────────────────────┐
│           Raw Dispatch API            │        │          Domain Command API           │
├───────────────────────────────────────┤        ├───────────────────────────────────────┤
│ dispatch({ type: "AUTH_START" })      │        │ signIn(credentials)                   │
│ dispatch({ type: "AUTH_SUCCESS", ...})│        │                                       │
│ dispatch({ type: "AUTH_FAIL", ...})   │        │                                       │
│ dispatch({ type: "RESET" })           │        │ signOut()                             │
│ dispatch({ type: "CLEAR_ERRORS" })    │        │ clearError()                          │
└───────────────────────────────────────┘        └───────────────────────────────────────┘
  • Exposes internal mechanics                     • Expresses user & business intent
  • Highly coupled to reducer                      • Completely hides state transitions
  • Hard to refactor                               • Easy to mock, refactor, and test
```

---

### 20. Domain Commands vs. Raw State Transitions

```tsx
// Inside AuthProvider.tsx
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // Encapsulated Async Domain Command
  const signIn = useCallback(async (credentials: LoginCredentials) => {
    dispatch({ type: "SIGN_IN_START" });
    try {
      const response = await authApiClient.login(credentials);
      dispatch({ type: "SIGN_IN_SUCCESS", payload: response });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      dispatch({ type: "SIGN_IN_FAILURE", payload: { error: message } });
      throw err; // Allow caller to handle form validation if needed
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authApiClient.logout();
    } finally {
      dispatch({ type: "SIGN_OUT" });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const value = useMemo<AuthContract>(() => ({
    user: state.user,
    isAuthenticated: state.status === "authenticated",
    isAuthenticating: state.status === "authenticating",
    authError: state.error,
    signIn,
    signOut,
    clearError,
  }), [state.user, state.status, state.error, signIn, signOut, clearError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

---

### 21. Read/Write Separation (State vs. Actions Gateways)

When high-frequency state updates cause excessive re-renders in components that only need commands (e.g., buttons), split the Context into two private tokens while exposing twin gateways:

```text
                            READ / WRITE SPLIT TOPOLOGY
                            
                         ┌─────────────────────────────┐
                         │      Feature Provider       │
                         └──────────────┬──────────────┘
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
     ┌────────────────────────┐                   ┌────────────────────────┐
     │  Private State Context │                   │ Private Action Context │
     │  (Changes frequently)  │                   │ (Referentially Stable) │
     └───────────┬────────────┘                   └───────────┬────────────┘
                 │                                             │
                 ▼                                             ▼
     ┌────────────────────────┐                   ┌────────────────────────┐
     │      useAuthState      │                   │     useAuthActions     │
     │      (Read Gateway)    │                   │    (Command Gateway)   │
     └───────────┬────────────┘                   └───────────┬────────────┘
                 │                                             │
                 ▼                                             ▼
          UserProfileView                              LogoutButton
     (Re-renders on data change)                   (NEVER re-renders on state!)
```

```tsx
// Internal Private Tokens
const AuthStateContext = createContext<AuthState | null>(null);
const AuthActionsContext = createContext<AuthActionsContract | null>(null);

// Twin Public Gateways
export function useAuthState(): AuthState {
  const ctx = useContext(AuthStateContext);
  if (!ctx) throw new Error("useAuthState must be used within <AuthProvider>");
  return ctx;
}

export function useAuthActions(): AuthActionsContract {
  const ctx = useContext(AuthActionsContext);
  if (!ctx) throw new Error("useAuthActions must be used within <AuthProvider>");
  return ctx;
}
```

---

### 22. Architectural Decision: When NOT to Split Contexts

Do not split contexts prematurely. Splitting increases boilerplate and cognitive overhead.

```text
                              CONTEXT SPLITTING DECISION DAG
                              
                     Do components only need commands without reading state?
                                             │
                             ┌───────────────┴───────────────┐
                            Yes                              No
                             │                               │
                             ▼                               ▼
                 Is the state high-frequency?       Keep Single Unified Context
                 (e.g., streaming, typing, 60fps)   (useAuth, useCart, useTheme)
                             │
             ┌───────────────┴───────────────┐
            Yes                              No
             │                               │
             ▼                               ▼
    Split State & Actions           Keep Single Unified Context
    (useCartState, useCartActions)  (Measure render profiler first!)
```

---

### 23. Provider Lifetime & Subtree Scoping

A Context Gateway does **not** equal global state. The gateway resolves its value based on where the `<Provider>` is mounted in the JSX tree.

```tsx
export function App() {
  return (
    <GlobalAuthProvider>
      <DashboardLayout>
        {/* Workspace A has its own isolated workspace context */}
        <WorkspaceProvider workspaceId="ws_101">
          <WorkspaceEditor />
        </WorkspaceProvider>

        {/* Workspace B has completely independent state & lifecycle */}
        <WorkspaceProvider workspaceId="ws_202">
          <WorkspaceEditor />
        </WorkspaceProvider>
      </DashboardLayout>
    </GlobalAuthProvider>
  );
}
```

---

### 24. Multi-Instance Isolation & Tree Shadowing

Because React resolves `useContext` by traversing up the Fiber tree to the nearest matching Provider, multiple instances of the same Provider create isolated dependency zones:

```text
┌────────────────────────────────────────────────────────┐
│ WorkspaceProvider (workspaceId="ws_101")               │
│   └── Editor (calls useWorkspace() ──► receives ws_101) │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ WorkspaceProvider (workspaceId="ws_202")               │
│   └── Editor (calls useWorkspace() ──► receives ws_202) │
└────────────────────────────────────────────────────────┘
```

Both editors call the exact same Hook (`useWorkspace()`), but receive isolated, independent state containers with no cross-talk.

---

### 25. Prediction Walkthrough #1 — Missing Provider Invariant

#### Code:
```tsx
const ThemeContext = createContext<"light" | "dark" | null>(null);

function useTheme() {
  const value = useContext(ThemeContext);
  if (value === null) {
    throw new Error("useTheme must be used within <ThemeProvider>");
  }
  return value;
}

function DarkModeToggle() {
  const theme = useTheme();
  return <button>Current: {theme}</button>;
}

// Rendered in Test without Provider:
render(<DarkModeToggle />);
```

#### Execution Analysis:
1. `DarkModeToggle` mounts.
2. Invokes `useTheme()`.
3. `useContext(ThemeContext)` traverses Fiber ancestry. No `ThemeContext.Provider` exists.
4. Returns the default value: `null`.
5. Gateway checks `value === null` and immediately throws `Error("useTheme must be used within <ThemeProvider>")`.
6. **Verdict:** Execution fails immediately at the exact boundary where the architecture was violated, pinpointing the missing provider.

---

### 26. Prediction Walkthrough #2 — Dynamic Provider Insertion

#### Code:
```tsx
function Root({ hasAuth, children }) {
  if (hasAuth) {
    return <AuthProvider user={{ id: "1", name: "Bob" }}>{children}</AuthProvider>;
  }
  return <>{children}</>;
}

function Nav() {
  const { user } = useAuth();
  return <span>{user.name}</span>;
}
```

#### Execution Analysis:
1. When `hasAuth = false`, `Root` renders children without `<AuthProvider>`.
2. `Nav` executes `useAuth()` ──► Invariant throws ──► React Error Boundary catches crash.
3. When `hasAuth = true`, `AuthProvider` wraps `children`.
4. `Nav` executes `useAuth()` ──► Finds `AuthProvider` in ancestry ──► Renders "Bob".
4. **Architectural Takeaway:** If a subtree conditionally requires context, the provider wrapping must be unconditionally present at a higher level (with null/empty state), or consumers must be conditionally rendered.

---

### 27. Prediction Walkthrough #3 — Nested Provider Shadowing

#### Code:
```tsx
const ProjectContext = createContext<{ id: string } | null>(null);

function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("Missing ProjectProvider");
  return ctx;
}

function ProjectBadge() {
  const { id } = useProject();
  return <span>{id}</span>;
}

function App() {
  return (
    <ProjectContext.Provider value={{ id: "PROJECT_OUTER" }}>
      <ProjectBadge /> {/* Badge 1 */}
      <ProjectContext.Provider value={{ id: "PROJECT_INNER" }}>
        <ProjectBadge /> {/* Badge 2 */}
      </ProjectContext.Provider>
    </ProjectContext.Provider>
  );
}
```

#### Execution Analysis:
1. `Badge 1` calls `useProject()`. React walks up Fiber ancestry, finds `PROJECT_OUTER`. Renders `PROJECT_OUTER`.
2. `Badge 2` calls `useProject()`. React walks up Fiber ancestry, finds `PROJECT_INNER` first and halts traversal. Renders `PROJECT_INNER`.
3. **Verdict:** The inner provider cleanly shadows the outer provider for all descendants in its subtree.

---

### 28. Prediction Walkthrough #4 — Independent State Containers

#### Code:
```tsx
function CounterProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  const inc = () => setCount((c) => c + 1);
  return <CounterContext.Provider value={{ count, inc }}>{children}</CounterContext.Provider>;
}

function Display() {
  const { count, inc } = useCounter();
  return <button onClick={inc}>{count}</button>;
}

function Dashboard() {
  return (
    <div>
      <CounterProvider><Display /></CounterProvider>
      <CounterProvider><Display /></CounterProvider>
    </div>
  );
}
```

#### Execution Analysis:
1. Two distinct `<CounterProvider>` Fiber instances exist.
2. Clicking the first `Display` button updates state in Provider #1 only.
3. Provider #1 re-renders its subtree (Count = 1).
4. Provider #2 and second `Display` are completely unaffected (Count = 0).
5. **Verdict:** State is completely isolated per Provider instance.

---

### 29. Prediction Walkthrough #5 — Custom Hook vs. Context Gateway State Isolation

#### Scenario:
```tsx
// Case A: Standalone Custom Hook
function useLocalCounter() {
  const [count, setCount] = useState(0);
  return { count, inc: () => setCount(c => c + 1) };
}

// Case B: Context Gateway Hook
function useSharedCounter() {
  return useGateway(CounterContext, "useSharedCounter", "CounterProvider");
}
```

#### Execution Analysis:
```text
CASE A (Standalone Hook in Components X and Y):
Component X Fiber ──► useState(0) [Instance 1]
Component Y Fiber ──► useState(0) [Instance 2]
Result: Independent state! X does not share count with Y.

CASE B (Context Gateway in Components X and Y under same Provider):
Provider Fiber ──► useState(0) [Single Owner]
Component X Fiber ──► useContext(Token) ──► Reads Provider State
Component Y Fiber ──► useContext(Token) ──► Reads Provider State
Result: Shared state! Incrementing in X re-renders both X and Y.
```

---

### 30. Gateway Hook + Stale Closure Prevention

If a domain command in a Provider captures state improperly:

```tsx
// ❌ Stale Closure Bug in Provider
export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);

  // signOut captures initial `user` value (null) forever!
  const signOut = useCallback(() => {
    analytics.track("User Signed Out", { userId: user?.id }); // Always undefined!
    setUser(null);
  }, []); // ⚠️ Missing `user` dependency

  // ...
}
```

#### Fix Options:
1. **Include Dependencies:** `useCallback(..., [user])`
2. **Latest Ref Pattern:** When stable identity is required:
```tsx
// ✅ Stable Callback with Latest Value Ref
export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  const userRef = useRef(user);
  userRef.current = user;

  const signOut = useCallback(() => {
    analytics.track("User Signed Out", { userId: userRef.current?.id });
    setUser(null);
  }, []); // Truly stable callback reference!
}
```

---

### 31. Gateway Does Not Mean "Memoize Everything"

A frequent architectural blunder:

```tsx
// ❌ Over-engineered useless memoization in gateway
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("Missing provider");

  // Premature and wasteful: ctx itself already changes on update!
  return useMemo(() => ({
    user: ctx.user,
    signOut: ctx.signOut,
  }), [ctx]);
}
```

The gateway's job is **contract enforcement and domain mapping**, not redundant caching. Memoization belongs in the **Provider** when creating the context value object.

---

### 32. Enterprise Module Directory Structure

```text
src/features/auth/
├── api/
│   ├── auth-client.ts           # Axios / Fetch client methods
│   └── types.ts                 # DTO network schemas
├── context/
│   ├── auth-context.ts          # Private React Context Tokens (UNEXPORTED)
│   ├── auth-provider.tsx        # Provider component owning state & effects
│   ├── auth-reducer.ts          # Pure transition algebra & action types
│   └── use-auth.ts              # Public Context Gateway Hook
├── hooks/
│   └── use-auth-guard.ts        # Composed routing guard using useAuth()
├── components/
│   ├── LoginForm.tsx
│   └── UserAvatar.tsx
└── index.ts                     # Public Feature Surface
```

#### The Feature Public Index:
```tsx
// src/features/auth/index.ts
// ✅ ONLY export the Provider and Gateway Hook!
export { AuthProvider } from "./context/auth-provider";
export { useAuth } from "./context/use-auth";
export type { AuthContract, User, LoginCredentials } from "./api/types";

// 🚫 DO NOT export: AuthContext, authReducer, AuthAction, initialAuthState
```

---

### 33. Comprehensive Gateway Reference Implementation

```tsx
import React, { createContext, useContext, useReducer, useCallback, useMemo } from "react";

// 1. Domain Types
export interface UserProfile {
  id: string;
  email: string;
  role: "admin" | "member" | "viewer";
}

export interface AuthContract {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login(email: string, pass: string): Promise<void>;
  logout(): Promise<void>;
  resetError(): void;
}

// 2. Private Reducer State & Actions
type AuthState = {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
};

type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: UserProfile }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "AUTH_RESET_ERROR" }
  | { type: "AUTH_LOGOUT" };

const initialAuthState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_START":
      return { ...state, isLoading: true, error: null };
    case "AUTH_SUCCESS":
      return { user: action.payload, isLoading: false, error: null };
    case "AUTH_FAILURE":
      return { user: null, isLoading: false, error: action.payload };
    case "AUTH_RESET_ERROR":
      return { ...state, error: null };
    case "AUTH_LOGOUT":
      return { user: null, isLoading: false, error: null };
    default:
      return state;
  }
}

// 3. PRIVATE Context Token
const AuthContext = createContext<AuthContract | null>(null);

// 4. Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  const login = useCallback(async (email: string, pass: string) => {
    dispatch({ type: "AUTH_START" });
    try {
      // Simulated domain authentication
      await new Promise((res) => setTimeout(res, 600));
      if (pass !== "valid123") throw new Error("Invalid password credentials.");
      
      const fakeUser: UserProfile = {
        id: "usr_9981",
        email,
        role: email.includes("admin") ? "admin" : "member",
      };
      dispatch({ type: "AUTH_SUCCESS", payload: fakeUser });
    } catch (err: any) {
      dispatch({ type: "AUTH_FAILURE", payload: err.message || "Failed to login" });
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    dispatch({ type: "AUTH_START" });
    await new Promise((res) => setTimeout(res, 200));
    dispatch({ type: "AUTH_LOGOUT" });
  }, []);

  const resetError = useCallback(() => {
    dispatch({ type: "AUTH_RESET_ERROR" });
  }, []);

  const contractValue = useMemo<AuthContract>(() => ({
    user: state.user,
    isAuthenticated: state.user !== null,
    isLoading: state.isLoading,
    error: state.error,
    login,
    logout,
    resetError,
  }), [state.user, state.isLoading, state.error, login, logout, resetError]);

  return <AuthContext.Provider value={contractValue}>{children}</AuthContext.Provider>;
}

// 5. PUBLIC Context Gateway Hook
export function useAuth(): AuthContract {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error(
      "[Architecture Invariant Violation]: useAuth() must be used within an <AuthProvider> hierarchy."
    );
  }
  return context;
}
```

---

## Layer 3 — 🛠️ Production Crucibles & Anti-Patterns

### 34. Production Incident #1 — Raw Context Token Refactoring Apocalypse

#### Symptom:
A core platform team decided to split `AppContext` into `ThemeContext`, `UserContext`, and `LocaleContext`. Over 450 UI components failed compilation, requiring 3 weeks of mechanical find-and-replace.

#### Root Cause:
`AppContext` had been exported publicly and directly consumed via `useContext(AppContext)` in every component file.

```text
BEFORE (Direct Context Coupling):
450+ Components ──────────────► useContext(AppContext)
                                (Changing AppContext broke entire codebase!)

AFTER (Gateway Pattern):
450+ Components ──────────────► useTheme(), useUser(), useLocale()
                                (Gateways absorbed the context split with 0 component changes!)
```

---

### 35. Production Incident #2 — The Silent Mock Default in Billing Checkout

#### Symptom:
Users were clicking the "Confirm Subscription" button in an Enterprise checkout modal, but the loader never appeared and the transaction never executed. No error appeared in Sentry.

#### Root Cause:
The modal had been opened via a React Portal outside of `<CheckoutProvider>`. The context had a dummy default:

```tsx
// ❌ Dangerous default
const CheckoutContext = createContext({
  submitPayment: async () => {}, // Fake stub
});
```

Because `submitPayment` was a silent no-op, the click did nothing.
When refactored to `createContext(null)` with a fail-fast gateway, the error was immediately caught and reported on the first click in staging.

---

### 36. Production Incident #3 — Generic State Setter Leakage

#### Symptom:
A junior developer modified the filter sidebar by writing:
```tsx
const { setFilterState } = useFilters();
setFilterState({ search: "shoes" }); // Accompanying date and category fields wiped out!
```

#### Root Cause:
The gateway exposed raw React `setState`, allowing any consumer to overwrite or corrupt the entire state structure without domain validation.

#### Correction:
Replace raw setters with domain-specific atomic actions:
```tsx
const { setSearchQuery, setDateRange, resetFilters } = useFilters();
setSearchQuery("shoes"); // Safely updates only search field
```

---

### 37. Production Incident #4 — The "Context Event Bus" Anti-Pattern

#### Symptom:
Components across a micro-frontend shell began dispatching untyped string events through Context:
```tsx
const bus = useContext(EventBusContext);
bus.emit("ORDER_PLACED", { id: "123" });
```

#### Root Cause:
Using Context as an uncontrolled, un-typed pub/sub event bus. Tracing dependencies and render cycles became impossible.

#### Senior Architectural Rule:
Context is for **scoped dependency distribution and reactive state propagation**, not an arbitrary event bus. Use dedicated event emitters or messaging patterns when decoupled pub/sub is strictly required.

---

### 38. Production Incident #5 — Feature Context Unintentionally Promoted to Global Root

#### Symptom:
After moving `<CheckoutProvider>` to the application root to make it "easy to access from anywhere", memory usage spiked, and navigating between products retained stale checkout cart items.

#### Root Cause:
Feature-level state had its lifetime tied to the entire application lifecycle instead of the checkout checkout page lifecycle.

```text
SCOPING AUDIT:
Where does this state belong?
  ├── Application Root? ──► Only truly global ambient dependencies (Auth, Theme, I18n)
  ├── Route Layout?     ──► Feature dashboards, workspaces
  └── Component Subtree?──► Modals, wizards, data grids, multi-step forms
```

---

### 39. Anti-Pattern: Exporting Internal Implementation Elements

```tsx
// ❌ WRONG: Exporting private tokens & internal reducers
export const ProjectContext = createContext<ProjectContextValue | null>(null);
export function projectReducer(state, action) { ... }
export type ProjectAction = ...;
export function ProjectProvider({ children }) { ... }
export function useProject() { ... }

// ✅ CORRECT: Clean Encapsulation Boundary
const ProjectContext = createContext<ProjectContextValue | null>(null); // PRIVATE
function projectReducer(state, action) { ... }                         // PRIVATE

export function ProjectProvider({ children }: { children: React.ReactNode }) { ... }
export function useProject(): ProjectContract { ... }
```

---

### 40. Anti-Pattern: Fabricating Mock Defaults for TypeScript Convenience

```tsx
// ❌ WRONG: Bypassing TS null check with dummy defaults
const CartContext = createContext<CartContract>({
  items: [],
  addItem: () => {},
  checkout: async () => {},
});

// ✅ CORRECT: Explicit Nullable Default + Gateway Guard
const CartContext = createContext<CartContract | null>(null);

export function useCart(): CartContract {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart requires <CartProvider> ancestor");
  return ctx;
}
```

---

### 41. Anti-Pattern: Gateway That Merely Echoes Raw Internal State

```tsx
// ❌ WRONG: Gateway exists syntactically but fails architecturally
export function useCart() {
  const ctx = useContext(CartContext);
  return {
    rawState: ctx.state,
    dispatch: ctx.dispatch,
    internalCache: ctx._cache,
  };
}

// ✅ CORRECT: Exposing Clean Domain Facade
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("Missing CartProvider");
  return {
    items: ctx.state.items,
    totalPrice: ctx.state.total,
    addItem: (product: Product) => ctx.dispatch({ type: "ADD_ITEM", payload: product }),
    clearCart: () => ctx.dispatch({ type: "CLEAR" }),
  };
}
```

---

### 42. Anti-Pattern: Monolithic God Context

Putting auth, notifications, billing, cart, and theme into a single `AppContext` guarantees that **every component re-renders on any state change**.

```text
MONOLITHIC GOD CONTEXT (Catastrophic Re-renders)
┌────────────────────────────────────────────────────────┐
│ AppContext (Theme + User + Notifications + Cart)       │
└───────────────────────────┬────────────────────────────┘
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
  Header (Needs Theme)  CartIcon (Needs Cart)  Toast (Needs Notif)
  *All 3 re-render when ANY field changes in AppContext!*
```

---

### 43. Anti-Pattern: Context for High-Frequency Streaming Coordinates

Placing 60fps animations, pointer hover coordinates, or drag-and-drop pixel deltas inside Context causes the entire provider subtree to re-render 60 times per second.

```text
HIGH-FREQUENCY STATE PLACEMENT MATRIX
┌──────────────────────────────┬──────────────────────────────────────────────────┐
│ State Type                   │ Recommended Mechanism                            │
├──────────────────────────────┼──────────────────────────────────────────────────┤
│ Mouse / Pointer Coordinates  │ useRef / Direct DOM Mutation / useSyncExternalStore │
│ Scroll Position (Continuous) │ RAF Listener + Ref                               │
│ Drag & Drop Pixel Offset     │ Local Component State or CSS Variables           │
│ Form Field Keystrokes        │ Local Form State (React Hook Form / Uncontrolled)│
│ Authenticated User Profile   │ Context Gateway (useAuth)                        │
│ Theme Mode (Dark/Light)      │ Context Gateway (useTheme)                       │
└──────────────────────────────┴──────────────────────────────────────────────────┘
```

---

### 44. Architectural Decision Matrix: Props vs. Context Gateway

| Evaluation Dimension | Direct Props / Composition | Context Gateway (`useDomain`) |
| :--- | :--- | :--- |
| **Depth of Propagation** | 1–2 levels deep | 3+ levels deep across deep subtrees |
| **Coupling Scope** | Component is decoupled from environment | Component requires specific Provider ancestor |
| **Reusability in Storybook/Tests** | Trivial (pass mock props) | Requires wrapping with `<Provider>` harness |
| **Multiple Coexisting Instances** | Natural (pass distinct props) | Supported via localized `<Provider>` scoping |
| **Refactoring Burden** | High if intermediate components pass props | Zero for intermediate layout components |

---

### 45. Decision Matrix: Raw `useContext` vs. Gateway Hook

| Metric | Raw `useContext(Token)` | Gateway Hook (`useDomain()`) |
| :--- | :---: | :---: |
| **Domain Semantics** | Low (`useContext(Auth)`) | High (`useAuth()`) |
| **Encapsulation of Storage** | Zero (Exposes Context token) | 100% (Token is private) |
| **Type Safety** | Requires manual null checks | Strict non-null return type |
| **Provider Invariant Validation** | Dispersed & duplicated | Centralized in gateway |
| **Dispatch Hiding** | Leaks reducer action vocabulary | Exposes semantic domain methods |
| **Mockability in Unit Tests** | Requires mocking Context object | Mock standard JS Hook return value |

---

### 46. Decision Matrix: Raw Dispatch vs. Domain Command Facade

| Architecture Metric | Raw `dispatch({ type: ... })` | Domain Command (`signIn()`) |
| :--- | :--- | :--- |
| **Component Intent** | Mechanics ("dispatch action") | Business Intent ("sign in user") |
| **Refactor Safety** | Low (action strings leaked) | High (internal reducer isolated) |
| **Async Operations** | Requires thunks/sagas in component | Async function encapsulated in Provider |
| **Validation Layer** | Dispersed in callers or reducer | Enforced in domain command wrapper |
| **Testing Ergonomics** | Must test action shape | Test direct function invocation |

---

### 47. Decision Matrix: Context Gateway vs. External Store (Zustand / Redux)

```text
                     DO YOU NEED AN EXTERNAL STORE OR CONTEXT?
                                        │
             Is the state strictly bound to a specific React subtree lifetime?
                                        │
                         ┌──────────────┴──────────────┐
                        Yes                            No (Global Singleton)
                         │                             │
                         ▼                             ▼
             Is state update frequency high?     External Store (Zustand / Redux)
             (e.g., >20 updates / sec)
                         │
             ┌───────────┴───────────┐
            Yes                      No
             │                       │
             ▼                       ▼
   useSyncExternalStore /      Context Gateway
   External Store + Provider   (useAuth, useTheme, useWorkspace)
```

---

### 48. Diagnostic Runbook: "useAuth Works in App but Fails in Tests"

```text
SYMPTOM: Test throws: "[Architecture Invariant Violation]: useAuth() must be used within <AuthProvider>"

DIAGNOSTIC FLOW:
1. Inspect test render call:
   ❌ render(<Header />);
   
2. Root Cause:
   Header invokes useAuth(). In unit tests, no AuthProvider exists in the test harness tree.

3. RESOLUTION: Create a custom render test utility:
```

```tsx
// test-utils.tsx
export function renderWithAuth(
  ui: React.ReactElement,
  options?: { initialUser?: UserProfile }
) {
  return render(
    <AuthProvider initialUser={options?.initialUser}>
      {ui}
    </AuthProvider>
  );
}

// In test file:
test("renders user name", () => {
  renderWithAuth(<Header />, { initialUser: { id: "1", email: "test@co.com", role: "admin" } });
  expect(screen.getByText("test@co.com")).toBeInTheDocument();
});
```

---

### 49. Diagnostic Runbook: "Gateway Consumer Reads Stale / Wrong Instance"

```text
SYMPTOM: Component renders data from Workspace A when user selected Workspace B.

DIAGNOSTIC CHECKLIST:
1. Verify Fiber Ancestry in React DevTools:
   - Click on the failing component.
   - Inspect the component tree upwards.
   - Look for unexpected duplicate or shadowed <WorkspaceProvider> nodes.

2. Check for Missing Provider Keys:
   - If switching workspaces changes the workspace ID, ensure the Provider is keyed if a full remount is desired:
   <WorkspaceProvider key={activeWorkspaceId} id={activeWorkspaceId}>

3. Check Context Value Identity:
   - Ensure Provider value is memoized with [activeWorkspaceId] in its dependency array.
```

---

### 50. Diagnostic Runbook: "Command Uses Stale State Values"

```text
SYMPTOM: Calling submitForm() submits previous form state instead of current values.

DIAGNOSTIC CHECKLIST:
1. Inspect domain command in Provider:
   const submit = useCallback(() => {
     api.save(currentFormState);
   }, []); // ⚠️ Bug: currentFormState is captured from initial render!

2. Check Dependency Array:
   - Add currentFormState to useCallback dependencies, OR
   - Coordinate using a latest-value ref if callback reference must remain stable.
```

---

### 51. Senior Diagnostic Protocol (10-Step Workflow)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                   10-STEP SENIOR CONTEXT GATEWAY PROTOCOL                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Trace the Dependency ──► Who produces the state? Who consumes it?        │
│ 2. Audit Lifetime       ──► Is it global singleton or feature-subtree?     │
│ 3. Check Scope          ──► Where is <Provider> mounted in JSX?             │
│ 4. Verify Privacy       ──► Is Context token strictly unexported?          │
│ 5. Audit Invariant      ──► Does gateway throw meaningful descriptive error?│
│ 6. Verify Contract      ──► Does gateway return strict non-null interface?  │
│ 7. Audit Mechanics      ──► Is raw dispatch hidden behind domain commands?  │
│ 8. Inspect Closures     ──► Are Provider callbacks capturing stale values?  │
│ 9. Inspect Shadowing    ──► Are nested providers unintentionally shadowing? │
│ 10. Measure Performance ──► Is Context split warranted by render profiler? │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Layer 4 — 🧪 Diagnostic Gauntlet & Master Checklist

### 52. Senior Prediction Challenge #1: Context Value Update vs. Fiber Remount

```tsx
const CountContext = createContext<number | null>(null);

function useCount() {
  const c = useContext(CountContext);
  if (c === null) throw new Error("Missing provider");
  return c;
}

function Child() {
  useEffect(() => {
    console.log("Child Mounted");
    return () => console.log("Child Unmounted");
  }, []);
  const count = useCount();
  return <span>{count}</span>;
}

// App renders:
// Render 1: <CountContext.Provider value={1}><Child /></CountContext.Provider>
// Render 2: <CountContext.Provider value={2}><Child /></CountContext.Provider>
```

#### Questions:
1. Does `Child` unmount and remount when `value` changes from `1` to `2`?
2. Does `useCount()` create a separate Fiber in the reconciler?
3. What is logged in the console across Render 1 and Render 2?

#### Senior Analysis & Answers:
1. **No.** Changing context value triggers a re-render of subscribed Fibers, never a remount. DOM nodes and local state in `Child` are preserved.
2. **No.** Custom Hooks execute inline within `Child`'s Fiber execution.
3. Only `"Child Mounted"` is logged once on initial mount. No unmount occurs.

---

### 53. Senior Prediction Challenge #2: Multiple Nested Providers

```tsx
const OrgContext = createContext<string | null>(null);

function useOrg() {
  const org = useContext(OrgContext);
  if (!org) throw new Error("Missing OrgProvider");
  return org;
}

function OrgDisplay() {
  return <div>{useOrg()}</div>;
}

function App() {
  return (
    <OrgContext.Provider value="Enterprise Corp">
      <OrgDisplay /> {/* Display A */}
      <OrgContext.Provider value="Startup Inc">
        <OrgDisplay /> {/* Display B */}
      </OrgContext.Provider>
    </OrgContext.Provider>
  );
}
```

#### Question:
What exact string is rendered by `Display A` and `Display B`?

#### Answer:
- `Display A` renders: `Enterprise Corp`
- `Display B` renders: `Startup Inc`
React reconciler traverses up the Fiber hierarchy from the calling component. `Display B` hits the inner `OrgContext.Provider` first and immediately resolves `"Startup Inc"`.

---

### 54. Senior Prediction Challenge #3: Hook Sharing vs. Context Sharing

```tsx
function useCounterHook() {
  const [val, setVal] = useState(0);
  return { val, inc: () => setVal((v) => v + 1) };
}

function ComponentA() {
  const { val, inc } = useCounterHook();
  return <button onClick={inc}>A: {val}</button>;
}

function ComponentB() {
  const { val } = useCounterHook();
  return <div>B: {val}</div>;
}
```

#### Question:
If a user clicks the button in `ComponentA` 3 times, what does `ComponentB` render?

#### Answer:
`ComponentB` renders `B: 0`.
A custom Hook encapsulates **stateful logic**, not **shared state instances**. Each component calling `useCounterHook()` allocates independent state slots on its own Fiber. Sharing state across components requires a **Context Gateway** or external store.

---

### 55. Senior Prediction Challenge #4: The Fallacy of Null Object Defaults

```tsx
const AuthContext = createContext({
  user: null,
  login: () => console.log("Logged in"),
});

function useAuth() {
  return useContext(AuthContext);
}

function UserGreeting() {
  const { user } = useAuth();
  return <h1>Hello, {user.name}</h1>; // ⚠️ Look closely!
}

// Rendered:
<UserGreeting />
```

#### Question:
What happens when `<UserGreeting />` is rendered outside any `<AuthContext.Provider>`?

#### Answer:
The component reads the default object `{ user: null, login: ... }`. It does not fail at `useAuth()`. Instead, it crashes inside the JSX with an unhelpful `TypeError: Cannot read properties of null (reading 'name')`.
With a proper fail-fast gateway (`createContext<T | null>(null)`), the crash occurs explicitly at `useAuth()`, declaring that `<AuthProvider>` is missing.

---

### 56. Senior Prediction Challenge #5: Leaked Action vs. Domain Command

Explain the architectural differences between:
```tsx
// Pattern A
const { dispatch } = useCart();
dispatch({ type: "CART_ADD_ITEM", payload: { id: "p1", qty: 2 } });

// Pattern B
const { addItem } = useCart();
addItem("p1", 2);
```

#### Answer:
- **Pattern A** leaks internal action names and payload structure to consumers. Renaming the action or refactoring to a different state machine breaks all consumers.
- **Pattern B** defines a strict, type-safe domain contract. The internal reducer, action names, and persistence side-effects can change completely without modifying a single consumer component.

---

### 57. Senior Prediction Challenge #6: Fiber Execution Context

If a custom Hook `useAuth()` calls `useContext(AuthContext)`, which Fiber stores the context dependency?

```text
A) A dedicated "useAuth" Fiber created by React
B) The Fiber of the component that invoked useAuth()
C) The AuthProvider Fiber
D) The Root Fiber
```

#### Answer:
**B**. Custom Hooks do not create Fibers. The context dependency is recorded on the Fiber of the component currently executing the Hook.

---

### 58. Senior Prediction Challenge #7: Multi-Tenant Subtree Isolation

```tsx
function TenantPortal({ tenantA, tenantB }) {
  return (
    <div>
      <TenantProvider config={tenantA}>
        <TenantDashboard />
      </TenantProvider>
      <TenantProvider config={tenantB}>
        <TenantDashboard />
      </TenantProvider>
    </div>
  );
}
```

#### Question:
Do the two `<TenantDashboard />` instances share state?

#### Answer:
**No.** Each `TenantDashboard` reads from its nearest matching `TenantProvider` ancestor. The two tenant environments are completely isolated.

---

### 59. Senior Prediction Challenge #8: Ref Coordination in Commands

```tsx
export function SearchProvider({ children }) {
  const [query, setQuery] = useState("");
  const queryRef = useRef(query);
  queryRef.current = query;

  const triggerSearch = useCallback(() => {
    api.search(queryRef.current);
  }, []); // Stable callback reference

  return (
    <SearchContext.Provider value={{ query, setQuery, triggerSearch }}>
      {children}
    </SearchContext.Provider>
  );
}
```

#### Question:
Why is `queryRef` used here instead of putting `query` into the `useCallback` dependency array?

#### Answer:
If `query` were in `useCallback` dependencies, `triggerSearch` would receive a new function reference on every keystroke. This would cause all search buttons and header actions depending on `triggerSearch` to re-render. Using `queryRef` provides **latest-value execution** while preserving **referential stability**.

---

### 60. 10 Senior Interview Questions & Master Answers

#### Q1: What is a Context Gateway and why is it superior to raw `useContext`?
> **Answer:** A Context Gateway is a custom Hook that acts as the sole public API boundary for consuming a Context. It encapsulates the private Context token, validates Provider existence at runtime with fail-fast invariants, narrows nullable TypeScript types to strict non-null contracts, and exposes semantic domain commands instead of leaky reducer dispatchers.

#### Q2: Why should `createContext(null)` be used instead of dummy mock defaults?
> **Answer:** If a Context requires a Provider to function, a mock default disguises missing Provider errors as valid runtime states, causing silent UI failures and difficult-to-debug defects. `createContext(null)` combined with a fail-fast invariant check in the gateway guarantees that missing providers crash immediately in tests and development with clear architectural errors.

#### Q3: Does calling a Context Gateway Hook create a new Fiber node in React?
> **Answer:** No. Custom Hooks are pure JavaScript composition mechanisms. They execute inline within the caller component's Fiber execution and register context dependencies directly on that component's Fiber.

#### Q4: How does a Context Gateway improve TypeScript ergonomics for developers?
> **Answer:** Without a gateway, `useContext(Token)` returns `T | null`, forcing every component to write defensive checks or `?.` operators. The gateway asserts `if (val === null) throw`, narrowing the return type to `T`, so consumers receive guaranteed non-null types.

#### Q5: When should you split a Context into State and Actions contexts?
> **Answer:** Split into separate State and Actions contexts when high-frequency state updates cause excessive re-renders in components that only need to trigger commands (like buttons or event handlers) without reading the state values.

#### Q6: Why is exposing `dispatch` from a Context anti-architectural?
> **Answer:** Exposing `dispatch` leaks internal reducer implementation details, action strings, and payload structures across the application. It prevents centralized input validation, complicates async operations, and tightly couples all consumers to internal state machine mechanics.

#### Q7: Can a Context Gateway share state across sibling components without a Provider?
> **Answer:** No. A custom Hook by itself only provides isolated state per component instance. Context requires a `<Provider>` ancestor in the React tree to establish and distribute shared state across components.

#### Q8: How does React resolve which Provider a Gateway reads when Providers are nested?
> **Answer:** React traverses upwards through the Fiber return chain starting from the calling component until it finds the nearest ancestor `ContextProvider` Fiber matching the Context token.

#### Q9: Does wrapping a Context in a custom Hook automatically optimize rendering performance?
> **Answer:** No. A Gateway Hook improves architectural boundaries, encapsulation, and type safety, but does not alter React's reconciliation or context propagation mechanics. Performance depends on memoizing the Context value object inside the Provider and proper component tree structuring.

#### Q10: How do you unit test a component that consumes a Context Gateway?
> **Answer:** Create a test render harness (e.g., `renderWithAuth(ui)`) that wraps the component under test in the feature's `<Provider>`. Alternatively, because the gateway is a standard custom Hook, you can mock the Hook directly (e.g., `vi.mock('./use-auth')`) to test isolated UI behavior without mounting the full provider.

---

### 61. 50-Point Senior Architectural Checklist

#### Context Contract & Privacy
- [ ] 1. Context tokens are created at module scope via `createContext<T | null>(null)`.
- [ ] 2. Context tokens are strictly unexported (kept `private` to the feature directory).
- [ ] 3. No fake mock defaults are passed to `createContext` when a Provider is mandatory.
- [ ] 4. Context values are typed via strict domain interfaces.
- [ ] 5. Read-only properties are enforced where consumers must not mutate state directly.
- [ ] 6. Internal reducer action types are never exported publicly.
- [ ] 7. Context token references are referentially stable across the application lifecycle.
- [ ] 8. Feature public index exports only the Provider, Gateway Hook, and public domain types.
- [ ] 9. Context is not used as a generic un-typed event bus.
- [ ] 10. High-frequency transient states (60fps cursor coords) are excluded from Context.

#### Gateway Design & Invariants
- [ ] 11. Gateway Hook follows standard naming: `use<DomainName>()` (e.g., `useAuth`, `useWorkspace`).
- [ ] 12. Gateway asserts `if (val === null)` and throws a descriptive invariant error.
- [ ] 13. Invariant error message specifies the exact missing `<ProviderName>`.
- [ ] 14. Invariant error message details the calling hook name for immediate debugging.
- [ ] 15. Gateway return type is strictly narrowed from `T | null` to `T`.
- [ ] 16. Gateway does not perform redundant `useMemo` wrapping over the context value.
- [ ] 17. Gateway does not call hooks conditionally.
- [ ] 18. Gateway adheres to the Rules of Hooks unconditionally.
- [ ] 19. Gateway exposes semantic domain methods rather than generic setters.
- [ ] 20. Gateway provides optional parameter overrides only when architecturally justified.

#### Provider State & Command Architecture
- [ ] 21. Provider component is named `<DomainName>Provider` (e.g., `<AuthProvider>`).
- [ ] 22. State transitions inside Provider are managed via `useReducer` or `useState`.
- [ ] 23. Provider wraps context value in `useMemo` with strict dependency arrays.
- [ ] 24. Domain commands in Provider are wrapped in `useCallback`.
- [ ] 25. Domain commands prevent stale closures via proper deps or latest-value refs.
- [ ] 26. Provider manages side-effects (network requests, localStorage sync) internally.
- [ ] 27. Provider cleans up event listeners, timers, or abort controllers in `useEffect`.
- [ ] 28. Async commands handle errors internally and set explicit error states.
- [ ] 29. Provider supports clean unmounting without memory leaks.
- [ ] 30. Provider accepts optional initial state props for testing and hydration.

#### Read/Write Separation & Optimization
- [ ] 31. Context splitting (State vs. Actions) is applied only when justified by profiler data.
- [ ] 32. Action context value contains only referentially stable command callbacks.
- [ ] 33. State context value contains reactive data models.
- [ ] 34. Dual gateways (`useDomainState`, `useDomainActions`) are exposed when split.
- [ ] 35. Unified gateway (`useDomain`) composes both when convenient.
- [ ] 36. Children of Provider are passed via `children` prop to prevent unnecessary re-renders.
- [ ] 37. Expensive leaf consumers are isolated behind `React.memo` where appropriate.
- [ ] 38. Context values avoid allocating new inline object literals on render.
- [ ] 39. Provider value updates do not trigger cascading re-renders in unrelated features.
- [ ] 40. Context propagation is verified via React DevTools Profiler.

#### Provider Scoping & Multi-Tenancy
- [ ] 41. Feature providers are placed as close to their consumer subtree as possible.
- [ ] 42. Global root is reserved solely for truly ambient application dependencies.
- [ ] 43. Multi-instance feature widgets support side-by-side independent Providers.
- [ ] 44. Nested provider shadowing is intentional and documented.
- [ ] 45. Dynamic subtrees unmount and destroy feature provider state cleanly.
- [ ] 46. Provider keys are utilized when switching entity IDs requires full state resets.
- [ ] 47. Modal and portal subtrees preserve required provider ancestry.
- [ ] 48. Test harness provides standard wrapper utilities (`renderWithProviders`).
- [ ] 49. Storybook decorators wrap component stories in domain providers.
- [ ] 50. Documentation clearly specifies provider prerequisites for all gateway consumers.

---

### 62. Graduation Gate: The Senior Architect Interview

You have mastered Part 07 when you can answer the following architectural gauntlet without consulting notes:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SENIOR GRADUATION RUBRIC                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Why is Context an implementation detail rather than an API?              │
│    "Context is the transport layer; the Gateway Hook is the domain contract"│
│                                                                             │
│ 2. How does the Gateway transform type safety?                              │
│    "By combining null defaults with runtime fail-fast invariant checks to   │
│     narrow T | null into guaranteed non-null T across all consumers."       │
│                                                                             │
│ 3. What is the execution relationship between custom hooks and Fibers?      │
│    "Custom hooks do not allocate Fibers; they participate directly in the   │
│     calling component's Fiber hook linked list."                            │
│                                                                             │
│ 4. Why should raw reducer dispatch never be exported?                       │
│    "Because it exposes private state transition mechanics, tightly coupling │
│     consumers to internal action string vocabularies."                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 63. Final Senior Architectural Rule

> **Never allow raw Context tokens or raw reducer dispatchers to escape your feature boundaries. The Context is a transport mechanism; the custom Hook gateway is the public domain contract. Keep Context tokens private, fail fast on missing ancestry, narrow nullable types at the boundary, and expose semantic domain commands.**

```text
       ┌──────────────────────────────────────────────────────────────┐
       │             THE COMPLETE CONTEXT GATEWAY PATTERN             │
       └──────────────────────────────┬───────────────────────────────┘
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
              FEATURE IMPLEMENTATION        PUBLIC CONTRACT
              ┌─────────────────────┐    ┌─────────────────────┐
              │ • Private Context   │    │ • <DomainProvider>  │
              │ • Private Reducer   │    │ • useDomain()       │
              │ • Invariant Guards  │    │ • Domain Types      │
              └─────────────────────┘    └─────────────────────┘
```

---

[⬅️ Previous Part](./06-refs-and-mutable-instance-coordination.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](./examples/07-custom-hooks-and-context-gateways.html) | [Next Part ➡️](./08-performance-optimization-and-memoization.md)
