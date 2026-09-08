# Level 06 — React Fundamentals
## KPI 11 — Context & Dependency Distribution (Context API, Provider Architecture, Re-render Propagation & Dependency Injection)
### PART 13 — Multi-Tier Architecture: Global vs Feature vs Local Component Contexts

[⬅️ Previous Part (12: Context Anti-Patterns: God Context, Prop Drilling Overkill & State Machine Misuse)](12-context-anti-patterns-god-context-prop-drilling-overkill-and-state-machine-misuse.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](examples/13-multi-tier-architecture-global-vs-feature-vs-local-component-contexts.html) | [Next Part (14: Context vs Signals vs Micro-State Managers) ➡️](14-context-vs-signals-vs-micro-state-managers.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)  
> **Co-Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)

---

# Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

## 1. The Core Architectural Problem

In naive React applications, developers treat the React Context API as a monolithic global store. Every piece of state—whether authentication credentials, route-specific e-commerce checkout data, or micro-state for an accordion component—is hoisted to the top-level root component (`<App />` or `<RootLayout />`).

This creates four catastrophic production failures:
1. **Uncontrolled Blast Radius:** A keystroke in a feature-level modal re-evaluates every consumer subscribed to the global context tree.
2. **Zombie Memory & Memory Leaks:** Ephemeral feature data (e.g., active WebSocket subscriptions, draft inputs, multi-megabyte cached grids) survives indefinitely in the root Fiber tree instead of being garbage-collected upon page navigation.
3. **Multi-Instance State Collisions:** Reusing a UI widget (e.g., rendering two `<DataGrid />` or `<ChatBox />` components on the same dashboard) causes both instances to share the same root context, corrupting state.
4. **Tight Architectural Coupling & Loss of Portability:** Feature modules cannot be extracted, lazy-loaded, or independently unit-tested because they implicitly depend on the entire global context ecosystem.

```text
❌ ANTI-PATTERN: The Monolithic Global Context Dump
┌────────────────────────────────────────────────────────────────────────┐
│                              <AppRoot>                                 │
│  <GlobalContext.Provider value={{ auth, theme, checkout, tabs, cart }}>│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Every update re-renders everything)
           ┌────────────────────────┼────────────────────────┐
           ▼                        ▼                        ▼
     <Navigation />          <CheckoutPage />            <Sidebar />
  (reads auth, theme)     (reads checkout, cart)        (reads tabs)
```

The professional engineering solution is **Multi-Tier Context Architecture**: strictly categorizing context into three discrete architectural tiers based on **Lifecycle, Scope, Update Frequency, and State Concurrency**.

```text
✅ ARCHITECTURAL GOLD STANDARD: 3-Tier Scoped Context Architecture
┌────────────────────────────────────────────────────────────────────────┐
│                      TIER 1: GLOBAL CONTEXTS                           │
│  Mounted at Root • App Lifetime • Low Frequency Updates (<1/min)       │
│  Examples: AuthContext, ThemeContext, I18nContext, ToastContext        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      TIER 2: FEATURE / ROUTE CONTEXTS                  │
│  Mounted at Route Boundary • Route Lifetime • Medium Frequency (1-10/s)│
│  Examples: CheckoutContext, OrderBookContext, ChatRoomContext          │
│  Automatically unmounts & GC'd on route navigation                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      TIER 3: LOCAL / COMPOUND COMPONENT CONTEXTS       │
│  Mounted at Component Root • Widget Lifetime • High Frequency (60/s)   │
│  Examples: TabsContext, AccordionContext, SelectContext, DataGridContext│
│  Supports concurrent sibling instances without collisions              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Multi-Tier Context Classification Matrix

| Dimension | Tier 1: Global Context | Tier 2: Feature / Route Context | Tier 3: Local / Compound Context |
| :--- | :--- | :--- | :--- |
| **Mount Location** | `<App />` / `<RootLayout />` | Route Boundary (`/checkout`, `/chat/:id`) | Component Instance Wrapper (`<Tabs>`, `<Table>`) |
| **Lifecycle** | Entire browser session | Active route duration | Component mount on DOM |
| **Garbage Collection** | On page refresh / hard navigation | On route transition / unmount | On component unmount |
| **Update Frequency** | Low (0 – 0.01 Hz; e.g. Login, Theme) | Medium (0.1 – 5 Hz; e.g. Step, Form) | High (10 – 60 Hz; e.g. Hover, Drag, Active) |
| **Instance Count** | Singleton ($N=1$) | Single per active route ($N=1$ per page) | Multi-instance concurrent ($N \ge 1$ siblings) |
| **Primary Risk** | App-wide re-render cascade | Stale route state if hoisted | High-frequency CPU thrashing |
| **Fail-Safe Check** | Throw if missing or fallback | Throw error: "Used outside Route" | Throw error: "Used outside <Parent>" |
| **Recommended Split**| State / Dispatch split mandatory | State / Dispatch split or Reducer | Monolithic value object if small |

---

## 3. The Three Golden Invariants of Context Scoping

### Invariant 1: The Lifecycle-Colocation Rule
> **Context state must be instantiated at the lowest common ancestor of the components that consume it.**
> If state $S$ is only required by children of Route $R$, placing $S$ in Global Root is an architectural violation. When Route $R$ unmounts, its context Fiber and associated heap allocations must be collected immediately by the JavaScript V8 Garbage Collector.

### Invariant 2: The Concurrency Isolation Rule
> **Any component intended to be instantiated multiple times on the same page MUST own its own isolated Context Provider.**
> Never manage multi-instance state (e.g., Tab 1 active index vs Tab 2 active index) by indexing into a global dictionary `activeTabs[id]` in a root store when a Tier-3 local context can isolate the state completely at zero cost.

### Invariant 3: The Update Frequency Barrier
> **High-frequency updates (>10 updates/sec) MUST NEVER share a Provider with low-frequency, wide-consumption metadata.**
> Grouping high-frequency transient state (drag position, active hover index, animation time) with static session metadata inside the same Context causes catastrophic UI frame drops across unaffected components.

---

# Layer 2 — 🔬 Deep Mechanical Breakdown

## 4. Tier 1 Mechanics: Global Contexts (Session & Ambient Environment)

Tier 1 Contexts represent ambient environment dependencies that are universal to the entire application runtime. 

### Characteristics of Tier 1:
- **Zero or Near-Zero Update Frequency:** Changes occur due to user login, theme toggle, locale change, or network status shifts.
- **Widespread Consumption:** Hundreds of leaves across the Fiber tree consume these values.
- **Singleton Lifetime:** Mounted once in `index.tsx` or `App.tsx` and never unmounted during normal user flows.

```tsx
// ============================================================================
// TIER 1 ARCHITECTURE: Global Auth & Session Context
// ============================================================================
import React, { createContext, useContext, useReducer, useMemo, ReactNode } from 'react';

export interface UserSession {
  id: string;
  email: string;
  role: 'ADMIN' | 'ENGINEER' | 'VIEWER';
  tenantId: string;
}

interface AuthState {
  user: UserSession | null;
  isAuthenticated: boolean;
  status: 'IDLE' | 'LOADING' | 'AUTHENTICATED' | 'UNAUTHENTICATED';
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: UserSession }
  | { type: 'AUTH_FAILURE'; error: string }
  | { type: 'AUTH_LOGOUT' };

const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  status: 'IDLE',
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, status: 'LOADING', error: null };
    case 'AUTH_SUCCESS':
      return {
        user: action.payload,
        isAuthenticated: true,
        status: 'AUTHENTICATED',
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        user: null,
        isAuthenticated: false,
        status: 'UNAUTHENTICATED',
        error: action.error,
      };
    case 'AUTH_LOGOUT':
      return {
        user: null,
        isAuthenticated: false,
        status: 'UNAUTHENTICATED',
        error: null,
      };
    default:
      return state;
  }
}

// Split Context: Prevent dispatch-only consumers from re-rendering on session changes
const AuthStateContext = createContext<AuthState | undefined>(undefined);
const AuthDispatchContext = createContext<React.Dispatch<AuthAction> | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  return (
    <AuthDispatchContext.Provider value={dispatch}>
      <AuthStateContext.Provider value={state}>
        {children}
      </AuthStateContext.Provider>
    </AuthDispatchContext.Provider>
  );
}

export function useAuthState(): AuthState {
  const context = useContext(AuthStateContext);
  if (context === undefined) {
    throw new Error('useAuthState must be used within an <AuthProvider> in Tier 1 Root.');
  }
  return context;
}

export function useAuthDispatch(): React.Dispatch<AuthAction> {
  const context = useContext(AuthDispatchContext);
  if (context === undefined) {
    throw new Error('useAuthDispatch must be used within an <AuthProvider> in Tier 1 Root.');
  }
  return context;
}
```

---

## 5. Tier 2 Mechanics: Feature & Route Contexts (Domain-Specific Workspaces)

Tier 2 Contexts are mounted strictly at the entry boundary of a specific feature, layout, or route. 

### Why Hoisting Feature State to Tier 1 is a Senior Anti-Pattern:
1. **Memory Ballooning:** If a complex checkout flow with 50 form fields, credit card tokens, and validation states is kept in the Global Root Context, that memory persists even after the user finishes paying and navigates to the dashboard.
2. **State Leakage:** Returning to `/checkout` later might display stale state unless manual cleanup routines (`useEffect(() => () => dispatch({ type: 'RESET' }))`) are flawlessly maintained.
3. **Automated V8 GC via Fiber Unmount:** By wrapping the Route component with `<CheckoutProvider>`, navigating away destroys the Provider Fiber node. React automatically drops all hook references, allowing the browser engine to reclaim memory instantaneously.

```text
ROUTE TRANSITION TIMELINE & V8 GARBAGE COLLECTION
Time (t)
─────────────────────────────────────────────────────────────────────────────►
t0: User enters /checkout
    └─ React mounts <CheckoutProvider> Fiber Node (tag: 10)
    └─ useReducer allocates CheckoutState heap objects (120 KB)
    └─ Children subscribe via useContext(CheckoutContext)

t1: User enters shipping data & payment info
    └─ State updates; only /checkout subtree re-renders
    └─ Global Navbar & Footer completely skipped (0ms reconciliation)

t2: User clicks "Complete Order" -> Navigate to /order-confirmation
    └─ React unmounts <CheckoutProvider> Fiber subtree
    └─ Root fiber deletes child pointer to CheckoutProvider
    └─ CheckoutState object becomes unreferenced in Heap
    └─ V8 Minor/Major GC scavenges 120 KB automatically
    └─ ZERO memory leaks. ZERO manual reset code required.
```

```tsx
// ============================================================================
// TIER 2 ARCHITECTURE: Route-Scoped Checkout Context
// ============================================================================
import React, { createContext, useContext, useReducer, useMemo, ReactNode } from 'react';

export interface CheckoutState {
  step: 'SHIPPING' | 'BILLING' | 'REVIEW' | 'PROCESSING' | 'COMPLETED';
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: 'CREDIT_CARD' | 'PAYPAL' | 'CRYPTO';
  isSubmitting: boolean;
  validationErrors: Record<string, string>;
}

type CheckoutAction =
  | { type: 'SET_STEP'; step: CheckoutState['step'] }
  | { type: 'UPDATE_SHIPPING'; field: string; value: string }
  | { type: 'SET_PAYMENT_METHOD'; method: CheckoutState['paymentMethod'] }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'SET_ERRORS'; errors: Record<string, string> }
  | { type: 'RESET_FORM' };

const initialCheckoutState: CheckoutState = {
  step: 'SHIPPING',
  shippingAddress: { street: '', city: '', postalCode: '', country: 'US' },
  paymentMethod: 'CREDIT_CARD',
  isSubmitting: false,
  validationErrors: {},
};

function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step };
    case 'UPDATE_SHIPPING':
      return {
        ...state,
        shippingAddress: { ...state.shippingAddress, [action.field]: action.value },
        validationErrors: { ...state.validationErrors, [action.field]: '' },
      };
    case 'SET_PAYMENT_METHOD':
      return { ...state, paymentMethod: action.method };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.isSubmitting };
    case 'SET_ERRORS':
      return { ...state, validationErrors: action.errors, isSubmitting: false };
    case 'RESET_FORM':
      return initialCheckoutState;
    default:
      return state;
  }
}

const CheckoutStateContext = createContext<CheckoutState | undefined>(undefined);
const CheckoutDispatchContext = createContext<React.Dispatch<CheckoutAction> | undefined>(undefined);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(checkoutReducer, initialCheckoutState);

  return (
    <CheckoutDispatchContext.Provider value={dispatch}>
      <CheckoutStateContext.Provider value={state}>
        {children}
      </CheckoutStateContext.Provider>
    </CheckoutDispatchContext.Provider>
  );
}

export function useCheckoutState(): CheckoutState {
  const context = useContext(CheckoutStateContext);
  if (!context) {
    throw new Error(
      '🚨 [Architecture Error] useCheckoutState called outside of <CheckoutProvider>. ' +
      'Checkout state is a Tier-2 Feature Context and is only accessible inside the /checkout route tree.'
    );
  }
  return context;
}

export function useCheckoutDispatch(): React.Dispatch<CheckoutAction> {
  const context = useContext(CheckoutDispatchContext);
  if (!context) {
    throw new Error(
      '🚨 [Architecture Error] useCheckoutDispatch called outside of <CheckoutProvider>.'
    );
  }
  return context;
}
```

---

## 6. Tier 3 Mechanics: Local & Compound Component Contexts

Tier 3 Contexts provide dependency distribution for a single reusable UI component or compound component pattern (e.g., `<Tabs>`, `<Accordion>`, `<Menu>`, `<Modal>`, `<VirtualGrid>`).

### Characteristics of Tier 3:
- **Concurrent Sibling Instances:** A single view can render 5 independent `<Tabs>` components. Each `<Tabs>` has its own distinct `<TabsContext.Provider>` instance. They must never cross-talk or overwrite each other.
- **Ultra-Fine Blast Radius:** When Tab 2 is clicked, only the tabs in that specific widget instance re-render. Sibling widgets and parent screens experience 0ms render time.
- **Zero Configuration:** Consuming developers do not need to register stores or pass unique IDs down manually. The React Fiber tree hierarchy enforces instance boundaries naturally.

```text
CONCURRENT SIBLING INSTANCES IN TIER 3
┌────────────────────────────────────────────────────────────────────────┐
│                              <Dashboard>                               │
│                                                                        │
│   ┌────────────────────────────────┐  ┌─────────────────────────────┐  │
│   │ <Tabs defaultValue="analytics">│  │ <Tabs defaultValue="logs">  │  │
│   │   [Provider Instance #1]       │  │   [Provider Instance #2]    │  │
│   │   State: activeTab = "metrics" │  │   State: activeTab = "raw"  │  │
│   │                                │  │                             │  │
│   │   <TabList>                    │  │   <TabList>                 │  │
│   │     <Tab value="analytics" />  │  │     <Tab value="logs" />    │  │
│   │     <Tab value="metrics" />    │  │     <Tab value="raw" />     │  │
│   │   </TabList>                   │  │   </TabList>                │  │
│   │   <TabPanels>                  │  │   <TabPanels>               │  │
│   │     <TabPanel value="metrics"/>│  │     <TabPanel value="raw"/> │  │
│   │   </TabPanels>                 │  │   </TabPanels>              │  │
│   └────────────────────────────────┘  └─────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

```tsx
// ============================================================================
// TIER 3 ARCHITECTURE: Compound Component Tabs Context
// ============================================================================
import React, { createContext, useContext, useState, useId, useMemo, ReactNode } from 'react';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  baseId: string;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

interface TabsProps {
  defaultValue: string;
  value?: string;
  onChange?: (value: string) => void;
  children: ReactNode;
}

export function Tabs({ defaultValue, value, onChange, children }: TabsProps) {
  const [internalTab, setInternalTab] = useState(defaultValue);
  const baseId = useId();

  const isControlled = value !== undefined;
  const activeTab = isControlled ? value : internalTab;

  const setActiveTab = useMemo(() => {
    return (nextTab: string) => {
      if (!isControlled) {
        setInternalTab(nextTab);
      }
      onChange?.(nextTab);
    };
  }, [isControlled, onChange]);

  const contextValue = useMemo<TabsContextValue>(() => ({
    activeTab,
    setActiveTab,
    baseId,
  }), [activeTab, setActiveTab, baseId]);

  return (
    <TabsContext.Provider value={contextValue}>
      <div className="compound-tabs-root" data-tabs-id={baseId}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function useTabContext(componentName: string): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error(
      `🚨 <${componentName}> must be rendered within an enclosing <Tabs> component instance (Tier 3 Local Context).`
    );
  }
  return context;
}

export function TabList({ children }: { children: ReactNode }) {
  return (
    <div role="tablist" className="compound-tab-list">
      {children}
    </div>
  );
}

export function TabItem({ value, children }: { value: string; children: ReactNode }) {
  const { activeTab, setActiveTab, baseId } = useTabContext('TabItem');
  const isSelected = activeTab === value;
  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  return (
    <button
      id={tabId}
      role="tab"
      aria-selected={isSelected}
      aria-controls={panelId}
      tabIndex={isSelected ? 0 : -1}
      onClick={() => setActiveTab(value)}
      className={`tab-btn ${isSelected ? 'active' : ''}`}
    >
      {children}
    </button>
  );
}

export function TabPanel({ value, children }: { value: string; children: ReactNode }) {
  const { activeTab, baseId } = useTabContext('TabPanel');
  const isSelected = activeTab === value;
  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  if (!isSelected) return null;

  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={tabId}
      className="tab-panel-content"
    >
      {children}
    </div>
  );
}
```

---

# Layer 3 — 🏛️ Full Production-Grade Reference Implementation

Let us construct an enterprise-grade, 3-Tier architecture for a mission-critical **FinTech Trading & Portfolio Management Suite**.

The application features:
1. **Tier 1 (Global):** `SessionSecurityContext` (User JWT, Security Level, Currency Display Preference).
2. **Tier 2 (Feature/Route):** `TradeOrderExecutionContext` (Active ticker order book, bid/ask spread, order submission pipeline, execution WebSocket lifecycle).
3. **Tier 3 (Local Compound):** `DataGridFilterContext` (Sort order, column visibility, row selection for individual ticker tables).

```tsx
// ============================================================================
// PRODUCTION FILE: src/architecture/MultiTierTradingApp.tsx
// ============================================================================
import React, {
  createContext,
  useContext,
  useReducer,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useId,
  ReactNode,
} from 'react';

// ============================================================================
// TIER 1: GLOBAL PLATFORM CONTEXT (Session & Security)
// ============================================================================
export interface GlobalSessionState {
  traderId: string;
  traderName: string;
  baseCurrency: 'USD' | 'EUR' | 'GBP' | 'JPY';
  riskLimitUSD: number;
  sessionStatus: 'ACTIVE' | 'LOCKED' | 'EXPIRED';
}

type GlobalSessionAction =
  | { type: 'SET_CURRENCY'; currency: GlobalSessionState['baseCurrency'] }
  | { type: 'LOCK_TERMINAL' }
  | { type: 'UNLOCK_TERMINAL'; traderId: string };

const initialGlobalState: GlobalSessionState = {
  traderId: 'TRD-99420',
  traderName: 'Alex Vance (Senior Arbitrageur)',
  baseCurrency: 'USD',
  riskLimitUSD: 5_000_000,
  sessionStatus: 'ACTIVE',
};

function globalSessionReducer(
  state: GlobalSessionState,
  action: GlobalSessionAction
): GlobalSessionState {
  switch (action.type) {
    case 'SET_CURRENCY':
      return { ...state, baseCurrency: action.currency };
    case 'LOCK_TERMINAL':
      return { ...state, sessionStatus: 'LOCKED' };
    case 'UNLOCK_TERMINAL':
      return { ...state, sessionStatus: 'ACTIVE' };
    default:
      return state;
  }
}

const GlobalSessionStateContext = createContext<GlobalSessionState | undefined>(undefined);
const GlobalSessionDispatchContext = createContext<React.Dispatch<GlobalSessionAction> | undefined>(undefined);

export function GlobalSessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(globalSessionReducer, initialGlobalState);

  return (
    <GlobalSessionDispatchContext.Provider value={dispatch}>
      <GlobalSessionStateContext.Provider value={state}>
        {children}
      </GlobalSessionStateContext.Provider>
    </GlobalSessionDispatchContext.Provider>
  );
}

export function useGlobalSession(): GlobalSessionState {
  const ctx = useContext(GlobalSessionStateContext);
  if (!ctx) throw new Error('useGlobalSession must be called inside <GlobalSessionProvider> (Tier 1)');
  return ctx;
}

export function useGlobalSessionDispatch(): React.Dispatch<GlobalSessionAction> {
  const ctx = useContext(GlobalSessionDispatchContext);
  if (!ctx) throw new Error('useGlobalSessionDispatch must be called inside <GlobalSessionProvider> (Tier 1)');
  return ctx;
}

// ============================================================================
// TIER 2: FEATURE / ROUTE CONTEXT (Order Execution Desk)
// ============================================================================
export interface MarketQuote {
  symbol: string;
  bidPrice: number;
  askPrice: number;
  lastUpdated: number;
}

export interface TradeOrderState {
  activeSymbol: string;
  orderType: 'LIMIT' | 'MARKET' | 'STOP_LOSS';
  orderSide: 'BUY' | 'SELL';
  quantity: number;
  limitPrice: number;
  quotes: Record<string, MarketQuote>;
  orderHistory: Array<{
    id: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    qty: number;
    price: number;
    timestamp: number;
  }>;
  isStreaming: boolean;
}

type TradeOrderAction =
  | { type: 'SET_SYMBOL'; symbol: string }
  | { type: 'SET_QUANTITY'; quantity: number }
  | { type: 'SET_LIMIT_PRICE'; price: number }
  | { type: 'SET_SIDE'; side: 'BUY' | 'SELL' }
  | { type: 'QUOTE_TICK'; quote: MarketQuote }
  | { type: 'EXECUTE_ORDER'; order: { id: string; symbol: string; side: 'BUY' | 'SELL'; qty: number; price: number; timestamp: number } }
  | { type: 'TOGGLE_STREAM'; isStreaming: boolean };

const initialTradeState: TradeOrderState = {
  activeSymbol: 'NVDA',
  orderType: 'LIMIT',
  orderSide: 'BUY',
  quantity: 100,
  limitPrice: 125.50,
  quotes: {
    NVDA: { symbol: 'NVDA', bidPrice: 125.45, askPrice: 125.55, lastUpdated: Date.now() },
    AAPL: { symbol: 'AAPL', bidPrice: 220.10, askPrice: 220.25, lastUpdated: Date.now() },
    TSLA: { symbol: 'TSLA', bidPrice: 215.30, askPrice: 215.60, lastUpdated: Date.now() },
  },
  orderHistory: [],
  isStreaming: true,
};

function tradeOrderReducer(state: TradeOrderState, action: TradeOrderAction): TradeOrderState {
  switch (action.type) {
    case 'SET_SYMBOL':
      return {
        ...state,
        activeSymbol: action.symbol,
        limitPrice: state.quotes[action.symbol]?.askPrice || state.limitPrice,
      };
    case 'SET_QUANTITY':
      return { ...state, quantity: Math.max(1, action.quantity) };
    case 'SET_LIMIT_PRICE':
      return { ...state, limitPrice: action.price };
    case 'SET_SIDE':
      return { ...state, orderSide: action.side };
    case 'QUOTE_TICK':
      return {
        ...state,
        quotes: {
          ...state.quotes,
          [action.quote.symbol]: action.quote,
        },
      };
    case 'EXECUTE_ORDER':
      return {
        ...state,
        orderHistory: [action.order, ...state.orderHistory].slice(0, 50),
      };
    case 'TOGGLE_STREAM':
      return { ...state, isStreaming: action.isStreaming };
    default:
      return state;
  }
}

const TradeOrderStateContext = createContext<TradeOrderState | undefined>(undefined);
const TradeOrderDispatchContext = createContext<React.Dispatch<TradeOrderAction> | undefined>(undefined);

export function TradeOrderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tradeOrderReducer, initialTradeState);

  // Simulate High-Speed Realtime Mock Market Feed (Teardown on unmount)
  useEffect(() => {
    if (!state.isStreaming) return;

    const interval = setInterval(() => {
      const symbols = ['NVDA', 'AAPL', 'TSLA'];
      const target = symbols[Math.floor(Math.random() * symbols.length)];
      const current = state.quotes[target] || { bidPrice: 100, askPrice: 100.1 };
      const delta = (Math.random() - 0.49) * 0.5;
      const newBid = +(current.bidPrice + delta).toFixed(2);
      const newAsk = +(newBid + 0.10).toFixed(2);

      dispatch({
        type: 'QUOTE_TICK',
        quote: {
          symbol: target,
          bidPrice: newBid,
          askPrice: newAsk,
          lastUpdated: Date.now(),
        },
      });
    }, 1500);

    return () => {
      clearInterval(interval);
      console.log('[Tier 2 Teardown] Market quote streaming interval destroyed.');
    };
  }, [state.isStreaming, state.quotes]);

  return (
    <TradeOrderDispatchContext.Provider value={dispatch}>
      <TradeOrderStateContext.Provider value={state}>
        {children}
      </TradeOrderStateContext.Provider>
    </TradeOrderDispatchContext.Provider>
  );
}

export function useTradeOrderState(): TradeOrderState {
  const ctx = useContext(TradeOrderStateContext);
  if (!ctx) {
    throw new Error('useTradeOrderState must be called inside <TradeOrderProvider> (Tier 2 Feature)');
  }
  return ctx;
}

export function useTradeOrderDispatch(): React.Dispatch<TradeOrderAction> {
  const ctx = useContext(TradeOrderDispatchContext);
  if (!ctx) {
    throw new Error('useTradeOrderDispatch must be called inside <TradeOrderProvider> (Tier 2 Feature)');
  }
  return ctx;
}

// ============================================================================
// TIER 3: LOCAL COMPOUND CONTEXT (DataGrid Table Selection & Filtering)
// ============================================================================
interface TableGridContextValue {
  selectedRowIds: Set<string>;
  toggleRowSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  filterQuery: string;
  setFilterQuery: (query: string) => void;
  sortColumn: string;
  sortDirection: 'ASC' | 'DESC';
  setSorting: (column: string) => void;
  instanceId: string;
}

const TableGridContext = createContext<TableGridContextValue | undefined>(undefined);

export function DataGridRoot({
  children,
  defaultSortCol = 'timestamp',
}: {
  children: ReactNode;
  defaultSortCol?: string;
}) {
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [filterQuery, setFilterQuery] = useState('');
  const [sortColumn, setSortColumn] = useState(defaultSortCol);
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');
  const instanceId = useId();

  const toggleRowSelection = useCallback((id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedRowIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedRowIds(new Set());
  }, []);

  const setSorting = useCallback((column: string) => {
    setSortColumn((prevCol) => {
      if (prevCol === column) {
        setSortDirection((prevDir) => (prevDir === 'ASC' ? 'DESC' : 'ASC'));
        return column;
      }
      setSortDirection('ASC');
      return column;
    });
  }, []);

  const value = useMemo<TableGridContextValue>(
    () => ({
      selectedRowIds,
      toggleRowSelection,
      selectAll,
      clearSelection,
      filterQuery,
      setFilterQuery,
      sortColumn,
      sortDirection,
      setSorting,
      instanceId,
    }),
    [
      selectedRowIds,
      toggleRowSelection,
      selectAll,
      clearSelection,
      filterQuery,
      sortColumn,
      sortDirection,
      setSorting,
      instanceId,
    ]
  );

  return (
    <TableGridContext.Provider value={value}>
      <div className="tier3-datagrid-container" data-grid-instance={instanceId}>
        {children}
      </div>
    </TableGridContext.Provider>
  );
}

export function useDataGridContext(): TableGridContextValue {
  const ctx = useContext(TableGridContext);
  if (!ctx) {
    throw new Error('🚨 useDataGridContext must be used within <DataGridRoot> (Tier 3 Local Context)');
  }
  return ctx;
}
```

---

# Layer 4 — 🧪 Prediction Challenges & Deep Execution Traces

## Challenge 1: The Cross-Tier Re-render Propagation Trap

Examine the following component tree:

```tsx
function RootApp() {
  return (
    <GlobalSessionProvider>
      <HeaderBar />
      <TradeOrderProvider>
        <OrderEntryTicket />
        <DataGridRoot>
          <OrderHistoryTable />
        </DataGridRoot>
      </TradeOrderProvider>
    </GlobalSessionProvider>
  );
}

function HeaderBar() {
  const { traderName, baseCurrency } = useGlobalSession();
  console.log('RENDER: HeaderBar');
  return <div>{traderName} | {baseCurrency}</div>;
}

function OrderEntryTicket() {
  const { activeSymbol, limitPrice } = useTradeOrderState();
  console.log('RENDER: OrderEntryTicket');
  return <div>{activeSymbol} @ ${limitPrice}</div>;
}

function OrderHistoryTable() {
  const { orderHistory } = useTradeOrderState();
  const { selectedRowIds, toggleRowSelection } = useDataGridContext();
  console.log('RENDER: OrderHistoryTable (Selected:', selectedRowIds.size, ')');
  return <div>History Rows: {orderHistory.length}</div>;
}
```

### Scenario & Trigger:
A user clicks a row inside `<OrderHistoryTable />`, which calls `toggleRowSelection("ord-101")` in Tier 3 `DataGridRoot`.

### Questions:
1. Which components re-render during this pass?
2. Does `<HeaderBar />` re-render? Why or why not?
3. Does `<OrderEntryTicket />` re-render? Why or why not?
4. What is the Fiber reconciliation traversal path?

### Exact Architectural Solution & Memory Trace:

```text
================================================================================
EXECUTION TRACE: Tier 3 State Mutation (toggleRowSelection)
================================================================================

1. Trigger: `setSelectedRowIds` called inside `DataGridRoot` (Tier 3 Provider).
2. Fiber Scheduled: React marks the `DataGridRoot` Fiber node as DIRTY (WorkTag: FunctionComponent).
3. Ancestor Fiber Walk:
   - RootApp (tag: 0) -> Clean (No state change)
   - GlobalSessionProvider (tag: 10) -> Clean (Bypassed)
   - HeaderBar (tag: 0) -> Clean (NOT a child of DataGridRoot; unaffected)
   - TradeOrderProvider (tag: 10) -> Clean (DataGridRoot is a child; ancestor not scheduled)
   - OrderEntryTicket (tag: 0) -> Clean (Sibling of DataGridRoot; completely skipped!)
4. Downward Reconciler Walk:
   - Begins at `DataGridRoot` Fiber.
   - `TableGridContext.Provider` (tag: 10) receives a new `value` reference (selectedRowIds changed).
   - React propagates dirty flags down to consumers of `TableGridContext`.
   - `OrderHistoryTable` consumes `TableGridContext` via `useDataGridContext()` -> RE-RENDERS.
5. Console Output:
   >> RENDER: OrderHistoryTable (Selected: 1)

VERDICT:
- HeaderBar: SKIPPED (0ms)
- OrderEntryTicket: SKIPPED (0ms)
- Total App Reconciliation Time: < 0.2ms
- Blast Radius: Perfectly contained to Tier 3 sub-tree!
```

---

## Challenge 2: Route Navigation & V8 Heap Memory Reclamation

### Scenario:
A user navigates from `/trading-desk` (which mounts `<TradeOrderProvider>`) to `/settings` (which does not mount `<TradeOrderProvider>`). 

`<TradeOrderProvider>` maintained a 5,000-quote historical array and had an active `setInterval` streaming timer.

```text
================================================================================
MEMORY LEAK TEST: Proper Tier-2 Route Teardown
================================================================================

1. Navigation Event: React Router unmounts `<TradingDeskRoute />`.
2. Fiber Deletion: React Fiber reconciler performs unmount cleanup on `<TradeOrderProvider>`.
3. Effect Cleanup: `useEffect` return function runs:
   -> `clearInterval(intervalId)` is executed.
   -> Browser closes simulated socket/timer handle.
4. Pointer Severing:
   -> Parent `Route` Fiber drops its `child` pointer to `TradeOrderProvider`.
   -> `TradeOrderStateContext.Provider` Fiber node is marked for GC.
5. Heap Analysis:
   - The `TradeOrderState` closure retaining 5,000 quote objects has 0 incoming GC root references.
   - V8 Garbage Collector (Orinoco / Scavenger) frees ~4.2 MB of heap memory within the next cycle.

COUNTER-FACTUAL BUG (If state were hoisted to Tier 1 Global):
- If `quotes` were stored in `GlobalSessionProvider`, the 4.2 MB heap allocation would remain pinned forever.
- Navigating back and forth 20 times between routes would leak 84+ MB and accumulate duplicate setInterval timers, crashing mobile browser tabs.
```

---

# Layer 5 — ⚠️ Antipatterns, Traps & Failure Modes

## 1. The "Hoisting Everything to Root" Anti-Pattern

```text
❌ DISASTROUS ANTI-PATTERN: Hoisting Local Widget State to Global Root
```
```tsx
// Anti-pattern: Storing accordion expansion states in global Redux/Context
interface GlobalState {
  user: User;
  isSidebarOpen: boolean;
  expandedAccordionIds: Record<string, boolean>; // 🚨 LEAK: Storing local UI state globally!
}
```
**Why this fails in production:**
- Every time a user opens an FAQ accordion item, every global consumer in the app (Navbar, UserAvatar, ShoppingCart badge) evaluates its render function.
- Multi-instance collision: If two accordions on different tabs share an ID `"panel-1"`, toggling one toggles both.

---

## 2. The "Context as Prop-Drilling Replacement" Overkill

Context is designed for **ambient dependency distribution across wide branch hierarchies**. Using Tier-3 context for simple parent-child relationships (depth = 1) adds unnecessary React Fiber overhead (`tag: 10` nodes, context cursors, hook subscriber linked lists).

```tsx
// ❌ OVERKILL: Context for 1 level of direct prop passing
function Card({ title, content }: { title: string; content: string }) {
  return (
    <CardContext.Provider value={{ title, content }}>
      <CardHeader />
      <CardBody />
    </CardContext.Provider>
  );
}

// ✅ CLEAN & OPTIMAL: Direct props or component composition
function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card">
      <div className="card-header">{title}</div>
      <div className="card-body">{children}</div>
    </div>
  );
}
```

---

## 3. The Unmemoized Tier 2 Value Object Trap

When creating feature-level providers, developers frequently pass inline object literals to `value={{ ... }}` without `useMemo`.

```tsx
// ❌ CRITICAL PERFORMANCE DEFECT: New object allocated on EVERY parent render
export function FeatureProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, init);
  
  // 🚨 New object reference created on every single render pass!
  return (
    <FeatureContext.Provider value={{ state, dispatch }}>
      {children}
    </FeatureContext.Provider>
  );
}

// ✅ ARCHITECTURAL REMEDY: Split State/Dispatch or Memoize Payload
export function FeatureProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, init);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <FeatureContext.Provider value={value}>
      {children}
    </FeatureContext.Provider>
  );
}
```

---

# Layer 6 — 🛠️ Diagnostic & Profiling Playbook

## Profiling Multi-Tier Fiber Trees with React DevTools

To verify that your multi-tier architecture is functioning correctly, perform the following 4-step diagnostic audit:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   REACT PROFILER DIAGNOSTIC WORKFLOW                   │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Open Chrome DevTools -> Profiler tab.                               │
│ 2. Check "Record why each component rendered while profiling."         │
│ 3. Click "Record", trigger a Tier-3 action (e.g. click a table row).   │
│ 4. Inspect Flamegraph:                                                 │
│    - EXPECTED: Only <DataGridRoot> and <OrderHistoryTable> are green.  │
│    - ANOMALY CHECK: If <AppRoot> or <HeaderBar> render -> AUDIT TIER!  │
└────────────────────────────────────────────────────────────────────────┘
```

### Flamegraph Signature Comparison:

```text
MONOLITHIC GLOBAL CONTEXT (Broken Architecture):
[ AppRoot (14.2ms) ]
  ├── [ Navigation (1.2ms) ] - Rendered because: Context changed (GlobalContext)
  ├── [ Sidebar (0.8ms) ]    - Rendered because: Context changed (GlobalContext)
  └── [ TradeDesk (12.2ms) ]
        └── [ DataGrid (11.8ms) ]

MULTI-TIER SCOPED CONTEXT (Gold Standard Architecture):
[ AppRoot (0.0ms - Did Not Render) ]
  ├── [ Navigation (0.0ms - Did Not Render) ]
  ├── [ Sidebar (0.0ms - Did Not Render) ]
  └── [ TradeDesk (0.0ms - Did Not Render) ]
        └── [ DataGridRoot (0.3ms) ]
              └── [ OrderHistoryTable (0.3ms) ] - Rendered: Context changed (TableGridContext)
```

---

# Layer 7 — 🚨 Real-World Production Incident Post-Mortem

## Incident Case #8841: The 100% CPU Freeze on High-Frequency Telemetry Dashboard

### Background & Context:
An enterprise logistics company developed an IoT tracking portal with 40 interactive vehicle telemetry cards on a single fleet manager dashboard. Each card displayed live GPS coordinates, battery voltage, vehicle status, and had collapsible inspection diagnostics.

### The Failure:
During a demonstration with 100 vehicles receiving telemetry ticks at 5Hz (500 updates/sec total), the entire browser tab froze completely (0 FPS, 100% CPU core utilization), crashing Google Chrome with "Page Unresponsive".

### Root Cause Analysis:
1. **Tier Collapse:** The original engineering team created a single `TelemetryContext` placed at the root `<DashboardLayout />`.
2. Every telemetry tick updated the global state dictionary `vehicles[id] = newTelemetry`.
3. Because all 40 vehicle cards and their internal collapsible tabs consumed `useTelemetryContext()`, **all 40 cards, 120 tabs, and 400 sub-components re-rendered on every single tick (500 times per second = 200,000 component render passes/sec)**.
4. V8 garbage collection went into death spirals attempting to scavenge millions of transient Virtual DOM nodes.

### The Remediation:
1. **Separated into 3 Tiers:**
   - **Tier 1:** `FleetSummaryContext` (Total online count, fleet alert count — updates once every 10s).
   - **Tier 2:** Kept at route level for global map viewport.
   - **Tier 3 (Local Scoped Context):** Each `<VehicleCard>` was wrapped in its own `<VehicleTelemetryProvider id={v.id}>`. It subscribed individually to its own vehicle's WebSocket stream.
2. **Outcome:**
   - When Vehicle #42 received a telemetry tick, **only VehicleCard #42 re-rendered**.
   - The remaining 39 cards remained at **0% CPU / 0ms render time**.
   - Frame rate restored from 0 FPS to a solid **60 FPS**. Memory footprint dropped from **680 MB to 38 MB**.

---

# Layer 8 — 📊 Visual Architecture & State Flow Topology

```text
================================================================================
MULTI-TIER REACT CONTEXT DEPENDENCY TOPOLOGY & LIFECYCLE BOUNDARIES
================================================================================

                               ┌────────────────────────┐
                               │     Browser Window     │
                               └───────────┬────────────┘
                                           │
                                           ▼
  ╔═══════════════════════════════════════════════════════════════════════════╗
  ║ TIER 1: GLOBAL SCOPE (<AppRoot>)                                          ║
  ║ Lifetime: Browser Session                                                 ║
  ║ State: AuthSession, Locale, Global Theme, Toast Dispatcher                ║
  ╚═══════════════════════════════════════════════════════════════════════════╝
                               │                   │
               ┌───────────────┘                   └───────────────┐
               ▼                                                   ▼
      ┌─────────────────┐                                 ┌─────────────────┐
      │  <TopNavBar />  │                                 │ <GlobalToast /> │
      │ (Reads: Auth)   │                                 │ (Reads: Toasts) │
      └─────────────────┘                                 └─────────────────┘
               │
               ▼
  ╔═══════════════════════════════════════════════════════════════════════════╗
  ║ TIER 2: ROUTE / FEATURE SCOPE (<TradingDeskRoute>)                        ║
  ║ Lifetime: Active Route Navigation (Unmounts on URL Change)                ║
  ║ State: OrderBook, Live Quotes, Market Feeds, Active Ticket                ║
  ╚═══════════════════════════════════════════════════════════════════════════╝
               │                                   │
       ┌───────┴───────┐                   ┌───────┴───────┐
       ▼               ▼                   ▼               ▼
 ┌───────────┐   ┌───────────┐       ┌───────────┐   ┌───────────┐
 │ <QuoteBar>│   │<TicketForm│       │<BookChart>│   │<OrderDesk>│
 └───────────┘   └───────────┘       └───────────┘   └─────┬─────┘
                                                           │
                                                           ▼
  ╔═══════════════════════════════════════════════════════════════════════════╗
  ║ TIER 3: LOCAL COMPOUND SCOPE (<DataGridRoot instance="orders">)           ║
  ║ Lifetime: Component DOM Mount                                             ║
  ║ State: Row Selection Set, Column Sort, Local Filter Term                  ║
  ╚═══════════════════════════════════════════════════════════════════════════╝
               │                                   │
       ┌───────┴───────┐                   ┌───────┴───────┐
       ▼               ▼                   ▼               ▼
 ┌───────────┐   ┌───────────┐       ┌───────────┐   ┌───────────┐
 │ <GridHead>│   │ <Row #1>  │       │ <Row #2>  │   │ <Row #3>  │
 │ (Sort UI) │   │(Selection)│       │(Selection)│   │(Selection)│
 └───────────┘   └───────────┘       └───────────┘   └───────────┘
```

---

# Layer 9 — 🏆 Key Architectural Takeaways

1. **Context is NOT a State Manager; It is a Dependency Distribution Mechanism.**
   Structure context providers strictly according to the lifetime and blast radius of the data they distribute.
2. **Never Hoist Feature State to Global Root.**
   Route-level providers guarantee clean automatic memory cleanup via V8 garbage collection when users navigate between features.
3. **Use Tier-3 Compound Contexts for Reusable Component Micro-States.**
   Compound components (`<Tabs>`, `<DataGrid>`, `<Accordion>`) should encapsulate their own isolated context, allowing unlimited concurrent instances on the same screen without collisions.
4. **Always Split State and Dispatch Contexts in High-Impact Tiers.**
   Separating reader subscriptions from action dispatchers eliminates redundant re-renders for mutation-only UI controls.
5. **Enforce Boundary Invariants with Descriptive Error Messages.**
   Custom hooks (`useGlobalSession`, `useTradeOrderState`, `useDataGridContext`) must immediately throw descriptive errors if invoked outside their designated provider tier.

---

[🧪 Proceed to Interactive Companion Lab: Multi-Tier Context Architecture](examples/13-multi-tier-architecture-global-vs-feature-vs-local-component-contexts.html)
