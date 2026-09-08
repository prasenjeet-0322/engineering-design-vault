<!--
# Level 06 — React Fundamentals
## KPI 11 — Context & Dependency Distribution (Context API, Provider Architecture, Re-render Propagation & Dependency Injection)
### PART 09 — Context as Dependency Injection: Testing & Modular Adapters

[⬅️ Previous Part](file:///d:/engineering/web-development/01-Frontend/06-React-Fundamentals/11-Context-Dependency-Distribution/08-context-propagation-bailouts-and-reconciliation-boundaries.md) | [📚 Level 06 Index](file:///d:/engineering/web-development/01-Frontend/06-React-Fundamentals/11-Context-Dependency-Distribution/README.md) | [🧪 Companion Lab](file:///d:/engineering/web-development/01-Frontend/06-React-Fundamentals/11-Context-Dependency-Distribution/examples/09-context-as-dependency-injection-testing-and-modular-adapters.html) | [Next Part ➡️](file:///d:/engineering/web-development/01-Frontend/06-React-Fundamentals/11-Context-Dependency-Distribution/10-context-selectors-external-stores-and-usesyncexternalstore.md)

---
**Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
**Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)  
**Co-Author:** Prasenjeet (Mindset & Code Quality)  
---
-->

# Context as Dependency Injection: Testing & Modular Adapters

```
========================================================================================================================
HEXAGONAL / PORTS & ADAPTERS DEPENDENCY INJECTION ARCHITECTURE IN REACT
========================================================================================================================

                 +-------------------------------------------------------------------------+
                 |                         APPLICATION UI CONSUMER                         |
                 |                       (UserProfile, CheckoutForm)                       |
                 +-------------------------------------------------------------------------+
                                                      |
                                                      | 1. Consumes Semantic Hook Gateway
                                                      v
                 +-------------------------------------------------------------------------+
                 |                         CUSTOM HOOK GATEWAY                             |
                 |                    useAuthService(), usePaymentGateway()                |
                 +-------------------------------------------------------------------------+
                                                      |
                                                      | 2. Validates Invariant & Queries Context
                                                      v
                 +-------------------------------------------------------------------------+
                 |                         REACT CONTEXT CHANNEL                           |
                 |                 createContext<AuthServicePort | null>(null)             |
                 +-------------------------------------------------------------------------+
                                                      |
                                                      | 3. Resolves Active Provider in Fiber Tree
                                                      v
+----------------------------------------------------------------------------------------------------------------------+
|                                             PROVIDER COMPOSITION ROOT                                                |
|                              (Defines Scope, Owns Lifetime & Injects Port Adapter)                                   |
+----------------------------------------------------------------------------------------------------------------------+
         |                                                 |                                                 |
         | (Production Mode)                               | (Test / Mock Mode)                              | (Offline / Sandbox Mode)
         v                                                 v                                                 v
+-----------------------------+                   +-----------------------------+                   +-----------------------------+
|    PRODUCTION ADAPTER       |                   |       TEST FAKE ADAPTER     |                   |    IN-MEMORY SANDBOX        |
|  (AxiosHttpClient, Stripe)  |                   |    (Deterministic In-Mem)   |                   |    (LocalStorage / IndexedDB|
+-----------------------------+                   +-----------------------------+                   +-----------------------------+
         |                                                 |                                                 |
         v                                                 v                                                 v
[ External Live HTTP REST API ]                   [ Zero-Network MSW / Vitest ]                     [ Browser Storage Engine ]
========================================================================================================================
```

---

## ⚡ Layer 1 — 30-Second Executive Cheat Sheet & Core Mental Models

### 1. Context Is More Than State Distribution
React Context is frequently misconstrued as merely a global state broadcast channel. In reality, Context is a **Scoped Hierarchical Dependency Delivery Pipeline**. It can distribute:
- **State:** Application state models, active themes, form validation records.
- **Commands:** Imperative handles, dialog triggers, modal orchestration, focus managers.
- **Services:** Authentication gateways, HTTP clients, telemetry dispatchers, WebSocket streams.
- **Configuration:** Environment feature flags, regional currency exchange mappings, API base URIs.
- **Capabilities & Adapters:** Stripe checkout adapters, IndexedDB storage engines, Bluetooth/WebRTC managers.

```typescript
// Context as a Service Contract (Port)
export const AuthServiceContext = createContext<AuthServicePort | null>(null);

// Component depends strictly on the Port Abstraction, not the concrete Network Implementation
export function UserProfileHeader() {
  const auth = useAuthService(); // Contract: { getUser(), logout() }
  return <button onClick={() => auth.logout()}>Log Out</button>;
}
```

The consumer has **zero awareness** of whether the underlying `AuthServicePort` is powered by OAuth2 PKCE via Axios, Firebase Authentication, an in-memory test fake, or an embedded WebView native bridge. That is **Inversion of Control (IoC) / Dependency Injection (DI)**.

---

### 2. The Core Mental Model: The Dependency Pipeline

```
+-----------------------------------------------------------------------------+
|                                COMPONENT                                    |
|                      "I need an API capability."                            |
+-----------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------+
|                          CUSTOM HOOK GATEWAY                                |
|          useApi() -> Validates Provider presence & exposes Port             |
+-----------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------+
|                            CONTEXT CHANNEL                                  |
|         createContext<ApiPort | null>(null) -> Identifies Token             |
+-----------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------+
|                            PROVIDER SCOPE                                   |
|                Determines implementation based on tree position             |
+-----------------------------------------------------------------------------+
                                      |
         +----------------------------+----------------------------+
         |                                                         |
         v                                                         v
+------------------------------------+    +-----------------------------------+
|     PRODUCTION IMPLEMENTATION      |    |        TEST FAKE ADAPTER          |
|  new RealHttpApiClient({ ... })    |    |  new InMemoryDeterministicFake()  |
+------------------------------------+    +-----------------------------------+
```

1. **The Component** depends exclusively on the **Contract (Interface)**.
2. **The Custom Hook Gateway** enforces runtime invariants and hides internal Context tokens.
3. **The Provider** chooses and binds the **Concrete Implementation** to a specific subtree.

---

### 3. Dependency Injection vs Global Module Singletons

| Architectural Dimension | React Context Dependency Injection | Global Module Singleton (`import api from './api'`) |
| :--- | :--- | :--- |
| **Scope & Lifetime** | **Tree-Scoped:** Bounded to the mounting Fiber node. Automatically torn down on unmount. | **Process-Wide:** Static memory allocated on module load. Never cleaned up. |
| **Test Isolation** | **Deterministic & Concurrent:** Each test renders a fresh `<ApiProvider value={fake}>` without module pollution. | **Brittle & Leaky:** Requires `jest.mock()`, `vi.spyOn()`, and manual `beforeEach` resets. |
| **Nesting & Shadowing** | **Subtree Polymorphism:** Nested subtrees can override dependencies (e.g. multi-tenant sandboxes). | **Monolithic:** One global configuration for the entire runtime. |
| **SSR Safety** | **100% Request-Isolated:** Concurrent server requests get distinct Fiber trees with zero state leakage. | **High-Risk Leakage:** Global mutable state leaks between concurrent user requests in Node.js. |
| **Decoupling** | **High:** Consumer depends on an abstract TypeScript interface. | **Zero:** Consumer hardcodes direct dependency on concrete module paths. |

---

### 4. Executive Concept Reference Table

| Concept | Core Mechanism | Production Impact | Common Senior Trap |
| :--- | :--- | :--- | :--- |
| **Dependency Injection** | Consumer declares requirement via Port; Provider supplies Adapter. | Eliminates tight coupling to third-party SDKs and network protocols. | Assuming Context is solely for state management and creating global service singletons. |
| **Port (Contract)** | Pure TypeScript `interface` or `type` defining capabilities. | Allows drop-in replacement of vendors (e.g. Stripe $\rightarrow$ Adyen). | Leaking vendor-specific data structures through the Port contract. |
| **Adapter** | Concrete class wrapping external APIs to implement the Port. | Isolates SDK breaking changes to a single adapter file. | Passing raw third-party SDK clients (`new Stripe()`) directly into Context. |
| **Custom Hook Gateway** | Encapsulated function reading Context and throwing invariant errors. | Centralizes null-checks, telemetry, and debugging hooks. | Exporting raw `useContext(MyContext)` across 500 files. |
| **Composition Root** | Top-level assembly point (`App.tsx` or Feature boundary) instantiating dependencies. | Single location responsible for infrastructure wiring. | Scattering `new ApiClient()` instantiation inside UI components. |
| **Test Fake** | Working in-memory implementation with zero network I/O. | Blazing fast, non-flaky integration and unit tests without network. | Conflating complex mock assertions with realistic in-memory Fakes. |
| **Scoped Override** | Nested Provider supplying a localized alternative implementation. | Enables sandboxed feature previews, multi-tenant views, and storybooks. | Unintentional context shadowing masking parent services. |
| **Resource Lifetime** | Synchronizing service creation and destruction with Provider mounts. | Prevents memory leaks, dangling WebSockets, and abandoned timers. | Instantiating stateful services directly inside function render bodies. |

---

### 5. The Golden Rule of Context Dependency Injection
> **Golden Architectural Invariant:**  
> Use React Context to inject dependencies that possess **structural scope, distinct ownership, and replaceable lifetimes**. Expose stable, application-level **Port Contracts**, never concrete implementation classes or raw third-party vendor SDKs.

---

## 🔬 Layer 2 — Deep Mechanical Breakdown

---

### 6. Architectural Foundations: Ports & Adapters (Hexagonal Architecture) in React

In classic enterprise architecture (Alistair Cockburn's Hexagonal Architecture), business logic resides in the core, interacting with the outside world through **Ports** (interfaces) and **Adapters** (concrete implementations).

In React:
- **Port:** A TypeScript interface representing a capability (`HttpClientPort`, `TelemetryPort`, `StoragePort`).
- **Adapter:** A class or object implementing that interface (`FetchHttpAdapter`, `SegmentTelemetryAdapter`, `LocalStorageAdapter`).
- **Injector:** React Context Provider (`<HttpProvider value={adapter}>`).
- **Consumer:** React Component utilizing a custom hook (`useHttpClient()`).

```typescript
// ============================================================================
// 1. THE PORT (Domain Contract)
// ============================================================================
export interface TelemetryPort {
  trackEvent(event: string, properties?: Record<string, unknown>): void;
  identifyUser(userId: string, traits?: Record<string, unknown>): void;
  flush(): Promise<void>;
}

// ============================================================================
// 2. CONCRETE ADAPTER A: Production Mixpanel / Segment
// ============================================================================
export class ProductionSegmentAdapter implements TelemetryPort {
  constructor(private readonly apiKey: string) {}

  trackEvent(event: string, properties?: Record<string, unknown>): void {
    if (typeof window !== "undefined" && (window as any).analytics) {
      (window as any).analytics.track(event, { ...properties, apiKey: this.apiKey });
    }
  }

  identifyUser(userId: string, traits?: Record<string, unknown>): void {
    if (typeof window !== "undefined" && (window as any).analytics) {
      (window as any).analytics.identify(userId, traits);
    }
  }

  async flush(): Promise<void> {
    // Production batch flush
  }
}

// ============================================================================
// 3. CONCRETE ADAPTER B: Deterministic In-Memory Test Fake
// ============================================================================
export class InMemoryTelemetryFake implements TelemetryPort {
  public readonly recordedEvents: Array<{ event: string; properties?: Record<string, unknown> }> = [];
  public readonly identifiedUsers: Array<{ userId: string; traits?: Record<string, unknown> }> = [];

  trackEvent(event: string, properties?: Record<string, unknown>): void {
    this.recordedEvents.push({ event, properties });
  }

  identifyUser(userId: string, traits?: Record<string, unknown>): void {
    this.identifiedUsers.push({ userId, traits });
  }

  async flush(): Promise<void> {
    // Immediate no-op in memory
  }

  public clear(): void {
    this.recordedEvents.length = 0;
    this.identifiedUsers.length = 0;
  }
}
```

---

### 7. Contract Granularity: Interface Segregation Principle (ISP)

One of the most dangerous anti-patterns is constructing a monolithic "Service Container" Context containing dozens of unrelated methods.

```typescript
// ❌ ANTI-PATTERN: The Monolithic "God Context" Service Container
interface GodServiceContainer {
  http: HttpClient;
  auth: AuthService;
  database: DatabaseClient;
  telemetry: TelemetryClient;
  flags: FeatureFlagClient;
  billing: StripeBillingClient;
  router: NavigationClient;
  fileUpload: S3Uploader;
}
const GodContext = createContext<GodServiceContainer | null>(null);
```

When components subscribe to `GodContext`, they register Fiber dependencies against the entire object. More critically, testing a component that only needs to upload a file requires mocking all 8 infrastructure subsystems!

#### The Solution: Segregated Capability Channels

```typescript
// ✅ GOLD STANDARD: Narrow, Purpose-Driven Capability Channels
export interface FileUploaderPort {
  uploadFile(file: File, path: string): Promise<{ downloadUrl: string }>;
}

export interface BillingGatewayPort {
  processPayment(amountCents: number, currency: string): Promise<{ transactionId: string }>;
}

export const FileUploaderContext = createContext<FileUploaderPort | null>(null);
export const BillingGatewayContext = createContext<BillingGatewayPort | null>(null);
```

---

### 8. State Context vs Service Context: Architectural Comparison

| Dimension | State Context (`ThemeContext`, `CartContext`) | Service Context (`ApiClientContext`, `AuthServiceContext`) |
| :--- | :--- | :--- |
| **Primary Payload** | Render-relevant reactive data values (strings, numbers, objects). | Imperative functions, classes, and capability gateways. |
| **Update Frequency** | High to Moderate (user interactions, toggles, keystrokes). | Very Low / Static (typically established at mount). |
| **Re-render Propagation** | Forces consuming components to re-render when state changes. | Consumers do **not** re-render because service reference remains identical across the application lifecycle. |
| **Lifecycle Ownership** | Managed via React primitives (`useState`, `useReducer`). | Managed via Composition Root (`useMemo`, Factory classes, `useEffect` cleanup). |
| **Anti-Pattern Risk** | Unintentional render cascades if unmemoized. | Instantiating new service instances on every parent render, thrashing connections. |

---

### 9. Resource Lifecycle & The Provider Composition Root

When a Service Dependency encapsulates stateful network resources (WebSockets, EventSources, IndexedDB connections, background polling timers), the **Provider** is strictly responsible for managing its full lifecycle (Allocation $\rightarrow$ Provision $\rightarrow$ Teardown).

```typescript
// src/core/infrastructure/WebSocketProvider.tsx
import React, { createContext, useContext, useEffect, useMemo } from "react";

export interface RealtimeMessagePort {
  subscribe(channel: string, callback: (data: unknown) => void): () => void;
  send(channel: string, payload: unknown): void;
}

export const RealtimeContext = createContext<RealtimeMessagePort | null>(null);

export function RealtimeProvider({
  endpoint,
  children,
}: {
  endpoint: string;
  children: React.ReactNode;
}) {
  // 1. Establish stable instance matching endpoint lifetime
  const realtimeService = useMemo(() => {
    return new WebSocketClientAdapter(endpoint);
  }, [endpoint]);

  // 2. Manage asynchronous connection lifecycle and cleanup
  useEffect(() => {
    realtimeService.connect();

    return () => {
      // Tear down active socket, abort inflight frames, clean up listeners
      realtimeService.disconnect();
    };
  }, [realtimeService]);

  return (
    <RealtimeContext.Provider value={realtimeService}>
      {children}
    </RealtimeContext.Provider>
  );
}
```

---

### 10. The Custom Hook Gateway: Defensive Invariant Enforcement

Never expose the raw Context token directly to UI components. A dedicated **Custom Hook Gateway** fulfills 4 essential architectural functions:
1. **Guarantees Provider Invariant:** Throws an actionable, human-readable error if invoked outside its designated Provider.
2. **Hides Context Identity:** Allows refactoring the internal transport without modifying consuming components.
3. **Type Narrowing:** Narrows the returned type from `T | null` to non-nullable `T`.
4. **Telemetry & Auditing Hook:** Provides a centralized choke-point for debugging and profiling service access.

```typescript
// src/core/gateways/useAuthService.ts
import { useContext } from "react";
import { AuthServiceContext } from "../infrastructure/AuthContext";
import { AuthServicePort } from "../ports/AuthServicePort";

export function useAuthService(): AuthServicePort {
  const service = useContext(AuthServiceContext);

  if (service === null) {
    throw new Error(
      "🚨 [Invariant Violation]: useAuthService() was invoked outside of an <AuthProvider /> boundary. " +
      "Ensure the component tree is wrapped with <AuthProvider> at the application or feature root."
    );
  }

  return service;
}
```

---

### 11. Context DI vs React Query / RTK Query / Zustand / Redux

A common architectural question for Staff Engineers is: *When should a capability be an Injected Context Service versus a Server-State / Global Store hook?*

```
+----------------------------------------------------------------------------------------------------+
|                                    APPLICATION STATE TAXONOMY                                      |
+----------------------------------------------------------------------------------------------------+
| 1. INFRASTRUCTURE & CAPABILITIES (Context DI)                                                      |
|    - HttpClients, PaymentGateways, WebSockets, StorageEngines, Telemetry, Crypto Bridges            |
|    - Stable references, zero reactive re-render churn, tree-scoped polymorphism.                  |
+----------------------------------------------------------------------------------------------------+
| 2. SERVER CACHE & ASYNC DATA (TanStack Query / SWR / RTK Query)                                    |
|    - Fetched Entity Collections, Pagination, Background Invalidation, Polling, Optimistic Mutates  |
|    - Internal deduplication, automatic garbage collection, request deduplication.                  |
+----------------------------------------------------------------------------------------------------+
| 3. CLIENT GLOBAL UI STATE (Zustand / Redux / External Store)                                       |
|    - Modal orchestration, complex multi-step wizards, collaborative multi-cursor selections        |
|    - High-frequency updates, selector-based fine-grained subscription bailouts.                   |
+----------------------------------------------------------------------------------------------------+
```

Context DI forms the **foundation layer** upon which data-fetching libraries sit. For example, TanStack `QueryClientProvider` is itself an injected Context service distributing the `QueryClient` capability to child `useQuery` hooks!

---

### 12. Asynchronous Service Initializers & Suspense Integration

Certain enterprise adapters require asynchronous initialization (e.g. SQLite WASM initialization, WebAssembly cryptographic key generation, IndexedDB schema upgrades) before they can satisfy their Port contract.

```typescript
// src/core/infrastructure/AsyncInitializationPattern.tsx
import React, { createContext, useContext, useState, useEffect } from "react";

export interface CryptoEnginePort {
  encrypt(plaintext: string): Promise<string>;
  decrypt(ciphertext: string): Promise<string>;
}

export const CryptoContext = createContext<CryptoEnginePort | null>(null);

export function AsyncCryptoProvider({
  wasmBinaryUrl,
  children,
  fallback = <div>Initializing Secure Cryptographic Module...</div>,
}: {
  wasmBinaryUrl: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [engine, setEngine] = useState<CryptoEnginePort | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadWasmCrypto() {
      try {
        const response = await fetch(wasmBinaryUrl);
        const buffer = await response.arrayBuffer();
        const instance = await WebAssembly.instantiate(buffer);

        if (!isCancelled) {
          setEngine(new WasmCryptoAdapter(instance));
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err : new Error("WASM initialization failed"));
        }
      }
    }

    loadWasmCrypto();

    return () => {
      isCancelled = true;
    };
  }, [wasmBinaryUrl]);

  if (error) {
    throw error; // Propagate to nearest React Error Boundary
  }

  if (!engine) {
    return <>{fallback}</>; // Block rendering until adapter is 100% operational
  }

  return (
    <CryptoContext.Provider value={engine}>
      {children}
    </CryptoContext.Provider>
  );
}
```

---

## 🛠️ Layer 3 — Production-Grade TypeScript Reference Implementation

Let us construct an enterprise-grade, hexagonal dependency-injected **E-Commerce Checkout & Payment Engine**.

```
========================================================================================================================
FEATURE DIRECTORY STRUCTURE
========================================================================================================================
src/
├── core/
│   ├── ports/
│   │   ├── HttpClientPort.ts
│   │   ├── PaymentGatewayPort.ts
│   │   ├── StoragePort.ts
│   │   ├── AuthPort.ts
│   │   ├── TracingPort.ts
│   │   └── LoggerPort.ts
│   ├── adapters/
│   │   ├── FetchHttpAdapter.ts
│   │   ├── StripePaymentAdapter.ts
│   │   ├── LocalStorageAdapter.ts
│   │   ├── OAuth2AuthAdapter.ts
│   │   ├── OpenTelemetryTracingAdapter.ts
│   │   ├── ConsoleLoggerAdapter.ts
│   │   └── fakes/
│   │       ├── InMemoryHttpFake.ts
│   │       ├── InMemoryPaymentFake.ts
│   │       ├── InMemoryStorageFake.ts
│   │       ├── InMemoryAuthFake.ts
│   │       ├── InMemoryTracingFake.ts
│   │       └── InMemoryLoggerFake.ts
│   ├── context/
│   │   └── DependencyContexts.ts
│   └── gateways/
│       ├── useHttpClient.ts
│       ├── usePaymentGateway.ts
│       ├── useStorage.ts
│       ├── useAuth.ts
│       ├── useTracing.ts
│       └── useLogger.ts
├── features/
│   └── checkout/
│       ├── components/
│       │   ├── CheckoutModal.tsx
│       │   └── OrderSummary.tsx
│       └── hooks/
│           └── useCheckoutWorkflow.ts
└── test/
    ├── renderWithProviders.tsx
    ├── CheckoutWorkflow.spec.tsx
    └── AuthWorkflow.spec.tsx
========================================================================================================================
```

---

### 13. Defining the Enterprise Ports (Contracts)

```typescript
// src/core/ports/HttpClientPort.ts
export interface HttpResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export interface HttpClientPort {
  get<T>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>>;
  post<T>(url: string, body: unknown, headers?: Record<string, string>): Promise<HttpResponse<T>>;
  put<T>(url: string, body: unknown, headers?: Record<string, string>): Promise<HttpResponse<T>>;
  delete<T>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>>;
}

// src/core/ports/PaymentGatewayPort.ts
export interface PaymentIntent {
  intentId: string;
  clientSecret: string;
  amountCents: number;
  currency: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface PaymentGatewayPort {
  createPaymentIntent(amountCents: number, currency: string): Promise<PaymentIntent>;
  confirmPayment(intentId: string, paymentMethodId: string): Promise<PaymentResult>;
}

// src/core/ports/StoragePort.ts
export interface StoragePort {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

// src/core/ports/AuthPort.ts
export interface UserSession {
  userId: string;
  email: string;
  roles: string[];
  accessToken: string;
  expiresAt: number;
}

export interface AuthPort {
  getSession(): Promise<UserSession | null>;
  loginWithCredentials(email: string, pass: string): Promise<UserSession>;
  logout(): Promise<void>;
  refreshAccessToken(): Promise<string>;
}

// src/core/ports/TracingPort.ts
export interface SpanContext {
  traceId: string;
  spanId: string;
  sampled: boolean;
}

export interface TracingPort {
  startSpan(name: string, attributes?: Record<string, string>): SpanContext;
  endSpan(spanId: string, error?: Error): void;
  getTraceparentHeader(spanId: string): string;
}

// src/core/ports/LoggerPort.ts
export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LoggerPort {
  log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void;
}
```

---

### 14. Concrete Production Adapters

```typescript
// src/core/adapters/FetchHttpAdapter.ts
import { HttpClientPort, HttpResponse } from "../ports/HttpClientPort";

export class FetchHttpAdapter implements HttpClientPort {
  constructor(private readonly baseUrl: string) {}

  private async execute<T>(
    method: string,
    url: string,
    body?: unknown,
    headers: Record<string, string> = {}
  ): Promise<HttpResponse<T>> {
    const fullUrl = `${this.baseUrl}${url}`;
    const response = await fetch(fullUrl, {
      method,
      headers: { "Content-Type": "application/json", ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${method} failed with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { data, status: response.status, headers: {} };
  }

  async get<T>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.execute<T>("GET", url, undefined, headers);
  }

  async post<T>(url: string, body: unknown, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.execute<T>("POST", url, body, headers);
  }

  async put<T>(url: string, body: unknown, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.execute<T>("PUT", url, body, headers);
  }

  async delete<T>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.execute<T>("DELETE", url, undefined, headers);
  }
}

// src/core/adapters/StripePaymentAdapter.ts
import { PaymentGatewayPort, PaymentIntent, PaymentResult } from "../ports/PaymentGatewayPort";
import { HttpClientPort } from "../ports/HttpClientPort";

export class StripePaymentAdapter implements PaymentGatewayPort {
  constructor(
    private readonly httpClient: HttpClientPort,
    private readonly publishableKey: string
  ) {}

  async createPaymentIntent(amountCents: number, currency: string): Promise<PaymentIntent> {
    const response = await this.httpClient.post<PaymentIntent>("/api/v1/payments/intent", {
      amountCents,
      currency,
      publishableKey: this.publishableKey,
    });
    return response.data;
  }

  async confirmPayment(intentId: string, paymentMethodId: string): Promise<PaymentResult> {
    const response = await this.httpClient.post<PaymentResult>("/api/v1/payments/confirm", {
      intentId,
      paymentMethodId,
    });
    return response.data;
  }
}

// src/core/adapters/LocalStorageAdapter.ts
import { StoragePort } from "../ports/StoragePort";

export class LocalStorageAdapter implements StoragePort {
  constructor(private readonly prefix: string = "app_v1:") {}

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(`${this.prefix}${key}`);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(`${this.prefix}${key}`, JSON.stringify(value));
    } catch (e) {
      console.error("LocalStorage write quota exceeded", e);
    }
  }

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(`${this.prefix}${key}`);
  }

  async clear(): Promise<void> {
    localStorage.clear();
  }
}
```

---

### 15. Test Fakes (Zero-Network In-Memory Test Doubles)

```typescript
// src/core/adapters/fakes/InMemoryHttpFake.ts
import { HttpClientPort, HttpResponse } from "../../ports/HttpClientPort";

export class InMemoryHttpFake implements HttpClientPort {
  private readonly routes = new Map<string, (body?: unknown) => HttpResponse<unknown>>();

  public registerRoute<T>(method: "GET" | "POST" | "PUT" | "DELETE", url: string, handler: (body?: unknown) => HttpResponse<T>): void {
    this.routes.set(`${method}:${url}`, handler as any);
  }

  async get<T>(url: string): Promise<HttpResponse<T>> {
    const handler = this.routes.get(`GET:${url}`);
    if (!handler) throw new Error(`[InMemoryHttpFake]: No route for GET ${url}`);
    return handler() as HttpResponse<T>;
  }

  async post<T>(url: string, body: unknown): Promise<HttpResponse<T>> {
    const handler = this.routes.get(`POST:${url}`);
    if (!handler) throw new Error(`[InMemoryHttpFake]: No route for POST ${url}`);
    return handler(body) as HttpResponse<T>;
  }

  async put<T>(url: string, body: unknown): Promise<HttpResponse<T>> {
    const handler = this.routes.get(`PUT:${url}`);
    if (!handler) throw new Error(`[InMemoryHttpFake]: No route for PUT ${url}`);
    return handler(body) as HttpResponse<T>;
  }

  async delete<T>(url: string): Promise<HttpResponse<T>> {
    const handler = this.routes.get(`DELETE:${url}`);
    if (!handler) throw new Error(`[InMemoryHttpFake]: No route for DELETE ${url}`);
    return handler() as HttpResponse<T>;
  }
}

// src/core/adapters/fakes/InMemoryPaymentFake.ts
import { PaymentGatewayPort, PaymentIntent, PaymentResult } from "../../ports/PaymentGatewayPort";

export class InMemoryPaymentFake implements PaymentGatewayPort {
  public shouldFail = false;
  public failureCode = "CARD_DECLINED";
  public readonly processedIntents: PaymentIntent[] = [];

  async createPaymentIntent(amountCents: number, currency: string): Promise<PaymentIntent> {
    const intent: PaymentIntent = {
      intentId: `intent_fake_${Math.random().toString(36).substring(7)}`,
      clientSecret: "secret_fake_token",
      amountCents,
      currency,
    };
    this.processedIntents.push(intent);
    return intent;
  }

  async confirmPayment(intentId: string, paymentMethodId: string): Promise<PaymentResult> {
    if (this.shouldFail) {
      return {
        success: false,
        errorCode: this.failureCode,
        errorMessage: "Your card has insufficient funds.",
      };
    }
    return {
      success: true,
      transactionId: `txn_fake_${Date.now()}`,
    };
  }
}

// src/core/adapters/fakes/InMemoryStorageFake.ts
import { StoragePort } from "../../ports/StoragePort";

export class InMemoryStorageFake implements StoragePort {
  private readonly store = new Map<string, unknown>();

  async getItem<T>(key: string): Promise<T | null> {
    return (this.store.get(key) as T) ?? null;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

// src/core/adapters/fakes/InMemoryTracingFake.ts
import { TracingPort, SpanContext } from "../../ports/TracingPort";

export class InMemoryTracingFake implements TracingPort {
  public readonly activeSpans = new Map<string, { name: string; attributes?: Record<string, string> }>();
  public readonly completedSpans: Array<{ spanId: string; error?: Error }> = [];

  startSpan(name: string, attributes?: Record<string, string>): SpanContext {
    const spanId = `span_${Math.random().toString(36).substring(7)}`;
    const traceId = `trace_00001`;
    this.activeSpans.set(spanId, { name, attributes });
    return { traceId, spanId, sampled: true };
  }

  endSpan(spanId: string, error?: Error): void {
    this.activeSpans.delete(spanId);
    this.completedSpans.push({ spanId, error });
  }

  getTraceparentHeader(spanId: string): string {
    return `00-trace_00001-${spanId}-01`;
  }
}

// src/core/adapters/fakes/InMemoryLoggerFake.ts
import { LoggerPort, LogLevel } from "../../ports/LoggerPort";

export class InMemoryLoggerFake implements LoggerPort {
  public readonly logs: Array<{ level: LogLevel; message: string; metadata?: Record<string, unknown> }> = [];

  log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    this.logs.push({ level, message, metadata });
  }

  public getErrors(): string[] {
    return this.logs.filter((l) => l.level === "error").map((l) => l.message);
  }
}
```

---

### 16. Context Channels & Custom Hook Gateways

```typescript
// src/core/context/DependencyContexts.ts
import { createContext } from "react";
import { HttpClientPort } from "../ports/HttpClientPort";
import { PaymentGatewayPort } from "../ports/PaymentGatewayPort";
import { StoragePort } from "../ports/StoragePort";
import { AuthPort } from "../ports/AuthPort";
import { TracingPort } from "../ports/TracingPort";
import { LoggerPort } from "../ports/LoggerPort";

export const HttpContext = createContext<HttpClientPort | null>(null);
export const PaymentContext = createContext<PaymentGatewayPort | null>(null);
export const StorageContext = createContext<StoragePort | null>(null);
export const AuthContext = createContext<AuthPort | null>(null);
export const TracingContext = createContext<TracingPort | null>(null);
export const LoggerContext = createContext<LoggerPort | null>(null);

// src/core/gateways/useDependencies.ts
import { useContext } from "react";
import {
  HttpContext,
  PaymentContext,
  StorageContext,
  AuthContext,
  TracingContext,
  LoggerContext,
} from "../context/DependencyContexts";
import { HttpClientPort } from "../ports/HttpClientPort";
import { PaymentGatewayPort } from "../ports/PaymentGatewayPort";
import { StoragePort } from "../ports/StoragePort";
import { AuthPort } from "../ports/AuthPort";
import { TracingPort } from "../ports/TracingPort";
import { LoggerPort } from "../ports/LoggerPort";

export function useHttpClient(): HttpClientPort {
  const client = useContext(HttpContext);
  if (!client) throw new Error("useHttpClient must be rendered within an HttpProvider");
  return client;
}

export function usePaymentGateway(): PaymentGatewayPort {
  const gateway = useContext(PaymentContext);
  if (!gateway) throw new Error("usePaymentGateway must be rendered within a PaymentProvider");
  return gateway;
}

export function useStorage(): StoragePort {
  const storage = useContext(StorageContext);
  if (!storage) throw new Error("useStorage must be rendered within a StorageProvider");
  return storage;
}

export function useAuth(): AuthPort {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth must be rendered within an AuthProvider");
  return auth;
}

export function useTracing(): TracingPort {
  const tracing = useContext(TracingContext);
  if (!tracing) throw new Error("useTracing must be rendered within a TracingProvider");
  return tracing;
}

export function useLogger(): LoggerPort {
  const logger = useContext(LoggerContext);
  if (!logger) throw new Error("useLogger must be rendered within a LoggerProvider");
  return logger;
}
```

---

### 17. The UI Feature Component

```tsx
// src/features/checkout/components/CheckoutModal.tsx
import React, { useState } from "react";
import { usePaymentGateway, useLogger } from "../../../core/gateways/useDependencies";

export interface CheckoutModalProps {
  orderId: string;
  totalCents: number;
  currency: string;
  onSuccess: (transactionId: string) => void;
  onClose: () => void;
}

export function CheckoutModal({
  orderId,
  totalCents,
  currency,
  onSuccess,
  onClose,
}: CheckoutModalProps) {
  const paymentGateway = usePaymentGateway();
  const logger = useLogger();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePayNow = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    logger.log("info", "Initiating checkout payment", { orderId, totalCents, currency });

    try {
      // Step 1: Create intent
      const intent = await paymentGateway.createPaymentIntent(totalCents, currency);

      // Step 2: Confirm payment via adapter
      const result = await paymentGateway.confirmPayment(intent.intentId, "pm_card_visa");

      if (result.success && result.transactionId) {
        logger.log("info", "Payment succeeded", { transactionId: result.transactionId });
        onSuccess(result.transactionId);
      } else {
        const error = result.errorMessage || "Payment declined";
        logger.log("warn", "Payment declined by gateway", { code: result.errorCode });
        setErrorMessage(error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unexpected system failure";
      logger.log("error", "Payment processing crashed", { error: msg });
      setErrorMessage("Service unavailable. Please retry later.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="checkout-modal" role="dialog" aria-labelledby="modal-title">
      <h2 id="modal-title">Complete Your Purchase</h2>
      <p>Order ID: {orderId}</p>
      <p>Total: {(totalCents / 100).toFixed(2)} {currency.toUpperCase()}</p>

      {errorMessage && (
        <div role="alert" className="error-banner">
          {errorMessage}
        </div>
      )}

      <div className="modal-actions">
        <button onClick={onClose} disabled={isProcessing}>
          Cancel
        </button>
        <button onClick={handlePayNow} disabled={isProcessing}>
          {isProcessing ? "Processing Payment..." : "Pay Now"}
        </button>
      </div>
    </div>
  );
}
```

---

### 18. Unit & Integration Testing Suite with Deterministic Fakes

```tsx
// src/test/renderWithProviders.tsx
import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import {
  HttpContext,
  PaymentContext,
  StorageContext,
  TracingContext,
  LoggerContext,
} from "../core/context/DependencyContexts";
import { InMemoryHttpFake } from "../core/adapters/fakes/InMemoryHttpFake";
import { InMemoryPaymentFake } from "../core/adapters/fakes/InMemoryPaymentFake";
import { InMemoryStorageFake } from "../core/adapters/fakes/InMemoryStorageFake";
import { InMemoryTracingFake } from "../core/adapters/fakes/InMemoryTracingFake";
import { InMemoryLoggerFake } from "../core/adapters/fakes/InMemoryLoggerFake";

export interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  httpFake?: InMemoryHttpFake;
  paymentFake?: InMemoryPaymentFake;
  storageFake?: InMemoryStorageFake;
  tracingFake?: InMemoryTracingFake;
  loggerFake?: InMemoryLoggerFake;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const httpFake = options.httpFake ?? new InMemoryHttpFake();
  const paymentFake = options.paymentFake ?? new InMemoryPaymentFake();
  const storageFake = options.storageFake ?? new InMemoryStorageFake();
  const tracingFake = options.tracingFake ?? new InMemoryTracingFake();
  const loggerFake = options.loggerFake ?? new InMemoryLoggerFake();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <HttpContext.Provider value={httpFake}>
        <StorageContext.Provider value={storageFake}>
          <TracingContext.Provider value={tracingFake}>
            <LoggerContext.Provider value={loggerFake}>
              <PaymentContext.Provider value={paymentFake}>
                {children}
              </PaymentContext.Provider>
            </LoggerContext.Provider>
          </TracingContext.Provider>
        </StorageContext.Provider>
      </HttpContext.Provider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    httpFake,
    paymentFake,
    storageFake,
    tracingFake,
    loggerFake,
  };
}
```

```tsx
// src/test/CheckoutWorkflow.spec.tsx
import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CheckoutModal } from "../features/checkout/components/CheckoutModal";
import { renderWithProviders } from "./renderWithProviders";
import { InMemoryPaymentFake } from "../core/adapters/fakes/InMemoryPaymentFake";
import { InMemoryLoggerFake } from "../core/adapters/fakes/InMemoryLoggerFake";

describe("CheckoutModal Component (Context DI Testing)", () => {
  it("executes successful checkout without touching real network or Stripe SDK", async () => {
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();
    const paymentFake = new InMemoryPaymentFake();
    const loggerFake = new InMemoryLoggerFake();

    renderWithProviders(
      <CheckoutModal
        orderId="ord_9941"
        totalCents={4999}
        currency="usd"
        onSuccess={handleSuccess}
        onClose={handleClose}
      />,
      { paymentFake, loggerFake }
    );

    // 1. Initial State Assertions
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Total: 49.99 USD")).toBeInTheDocument();

    // 2. Trigger Payment
    const payBtn = screen.getByRole("button", { name: /pay now/i });
    fireEvent.click(payBtn);

    // 3. Button transitions to loading
    expect(screen.getByRole("button", { name: /processing payment/i })).toBeDisabled();

    // 4. Await Success Assertion
    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalledTimes(1);
      expect(handleSuccess).toHaveBeenCalledWith(expect.stringContaining("txn_fake_"));
    });

    // 5. Verify Logger Invariant
    expect(loggerFake.logs.some((l) => l.message === "Payment succeeded")).toBe(true);
    expect(paymentFake.processedIntents.length).toBe(1);
    expect(paymentFake.processedIntents[0].amountCents).toBe(4999);
  });

  it("handles payment decline gracefully and displays error message", async () => {
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();
    const paymentFake = new InMemoryPaymentFake();
    paymentFake.shouldFail = true; // Inject failure condition
    const loggerFake = new InMemoryLoggerFake();

    renderWithProviders(
      <CheckoutModal
        orderId="ord_declined_1"
        totalCents={12000}
        currency="usd"
        onSuccess={handleSuccess}
        onClose={handleClose}
      />,
      { paymentFake, loggerFake }
    );

    fireEvent.click(screen.getByRole("button", { name: /pay now/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Your card has insufficient funds.");
    });

    expect(handleSuccess).not.toHaveBeenCalled();
    expect(loggerFake.logs.some((l) => l.level === "warn")).toBe(true);
  });
});
```

---

## 🔮 Layer 4 — Advanced Senior Engineering Mastery

---

### 19. Multi-Tenant Scoped Override & Sandboxed Execution

In enterprise SaaS platforms, a single application runtime may render multiple workspace sandboxes simultaneously (e.g., an Admin previewing Tenant A's dashboard alongside Tenant B's analytics).

```
+---------------------------------------------------------------------------------------------+
|                                    GLOBAL COMPOSITION ROOT                                  |
|                             (Production ApiUrl: "https://api.acme.com")                     |
+---------------------------------------------------------------------------------------------+
                               |                                             |
                               v                                             v
        +-----------------------------+               +-----------------------------+
        |     TENANT A SANDBOX        |               |     TENANT B SANDBOX        |
        |  <ApiProvider prefix="/tA"> |               |  <ApiProvider prefix="/tB"> |
        |      <WorkspaceView />      |               |      <WorkspaceView />      |
        +-----------------------------+               +-----------------------------+
```

```tsx
// src/features/admin/MultiTenantPreview.tsx
import React, { useMemo } from "react";
import { HttpContext } from "../../core/context/DependencyContexts";
import { FetchHttpAdapter } from "../../core/adapters/FetchHttpAdapter";
import { WorkspaceDashboard } from "../workspace/WorkspaceDashboard";

export function ScopedTenantContainer({ tenantId }: { tenantId: string }) {
  // Each container establishes a dedicated, isolated HttpAdapter instance scoped to that tenant
  const tenantHttpAdapter = useMemo(() => {
    return new FetchHttpAdapter(`https://api.enterprise.com/v1/tenants/${tenantId}`);
  }, [tenantId]);

  return (
    <HttpContext.Provider value={tenantHttpAdapter}>
      <div className="tenant-card border p-4 rounded shadow">
        <h3>Active Tenant: {tenantId}</h3>
        <WorkspaceDashboard />
      </div>
    </HttpContext.Provider>
  );
}

export function MultiTenantAuditor() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <ScopedTenantContainer tenantId="tenant-alpha" />
      <ScopedTenantContainer tenantId="tenant-beta" />
    </div>
  );
}
```

---

### 20. OAuth2 PKCE Authentication Gateway with In-Memory Token Refresh Queue

```typescript
// src/core/adapters/OAuth2AuthAdapter.ts
import { AuthPort, UserSession } from "../ports/AuthPort";
import { HttpClientPort } from "../ports/HttpClientPort";
import { StoragePort } from "../ports/StoragePort";

export class OAuth2AuthAdapter implements AuthPort {
  private activeSession: UserSession | null = null;
  private refreshPromise: Promise<string> | null = null;

  constructor(
    private readonly httpClient: HttpClientPort,
    private readonly storage: StoragePort,
    private readonly tokenEndpoint: string = "/oauth/token"
  ) {}

  async getSession(): Promise<UserSession | null> {
    if (this.activeSession) return this.activeSession;
    const stored = await this.storage.getItem<UserSession>("auth_session");
    if (stored && stored.expiresAt > Date.now()) {
      this.activeSession = stored;
      return stored;
    }
    return null;
  }

  async loginWithCredentials(email: string, pass: string): Promise<UserSession> {
    const res = await this.httpClient.post<UserSession>(this.tokenEndpoint, {
      grant_type: "password",
      username: email,
      password: pass,
    });
    this.activeSession = res.data;
    await this.storage.setItem("auth_session", res.data);
    return res.data;
  }

  async logout(): Promise<void> {
    this.activeSession = null;
    await this.storage.removeItem("auth_session");
  }

  async refreshAccessToken(): Promise<string> {
    // Deduplicate concurrent refresh requests across the application
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const res = await this.httpClient.post<{ accessToken: string; expiresIn: number }>(
          `${this.tokenEndpoint}/refresh`,
          {}
        );
        if (this.activeSession) {
          this.activeSession.accessToken = res.data.accessToken;
          this.activeSession.expiresAt = Date.now() + res.data.expiresIn * 1000;
          await this.storage.setItem("auth_session", this.activeSession);
        }
        return res.data.accessToken;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }
}
```

---

### 21. Step-by-Step Prediction Challenges with Memory Traces

#### Challenge 1: The Accidental Object Factory Recreation
```tsx
function BadServiceProvider({ children }: { children: React.ReactNode }) {
  // Allocating object literal directly during render
  const analyticsService = {
    track: (event: string) => console.log("Track:", event),
  };

  return (
    <AnalyticsContext.Provider value={analyticsService}>
      {children}
    </AnalyticsContext.Provider>
  );
}
```
**Prediction Question:** What happens in memory when `BadServiceProvider` renders 5 times due to parent state updates?  
**Memory Trace & Senior Answer:**
1. *Render 1:* Heap allocates `Object@0x001`. `AnalyticsContext.Provider` stores `0x001`.
2. *Render 2:* Heap allocates `Object@0x002`. Fiber reconciler evaluates `!Object.is(0x001, 0x002) === true`.
3. *Outcome:* React triggers `propagateContextChange()` on every single parent render, forcing every subscriber down the tree to re-evaluate, even though `track()` logic never changed!
4. *Fix:* Wrap in `useMemo(() => ({ track: ... }), [])` or declare the adapter class outside the component.

#### Challenge 2: Sibling Sandboxes with Conflicting Mutating State
```tsx
function SiblingSandboxTest() {
  return (
    <div>
      <StorageContext.Provider value={new InMemoryStorageFake()}>
        <FeatureComponent id="A" />
      </StorageContext.Provider>
      <StorageContext.Provider value={new InMemoryStorageFake()}>
        <FeatureComponent id="B" />
      </StorageContext.Provider>
    </div>
  );
}
```
**Prediction Question:** If `FeatureComponent A` writes `{ token: "ALPHA" }` to its injected `useStorage()`, can `FeatureComponent B` read `{ token: "ALPHA" }`?  
**Memory Trace & Senior Answer:**
1. *Fiber Tree Allocation:* React creates two distinct `ContextProvider` Fibers (`Fiber@A`, `Fiber@B`).
2. *Heap Partition:* `Fiber@A` holds reference `Map@0x101`, while `Fiber@B` holds reference `Map@0x202`.
3. *Outcome:* Writing to `A` updates `Map@0x101`. `B` queries `Map@0x202` and receives `null`. Perfect isolation is preserved with zero cross-talk!

---

### 22. Production Incident Post-Mortem: "The Vendor SDK Hardcode Outage"

#### Incident Overview
- **Impact:** 100% of e-commerce checkout operations stalled in staging and CI integration suites for 14 hours.
- **Root Cause:** A developer refactored the checkout flow to call `import { loadStripe } from '@stripe/stripe-js'` directly inside 34 UI components instead of consuming the injected `PaymentGatewayPort`.
- **Failure Mode:** Unit tests and CI pipelines crashed with `ReferenceError: window is not defined` and `TypeError: Stripe API Key missing` because the test suites ran in Node.js (jsdom) where Stripe's native CNAME scripts cannot load.

```
========================================================================================================================
ROOT CAUSE DISSECTION
========================================================================================================================
[UI Component] ---> (Direct Hardcoded Import) ---> [ @stripe/stripe-js (Vendor SDK) ]
        |
        +---> Requires browser script injection, real publishable keys, active Stripe CDN
        +---> Crashes in Node.js / JSDOM / Storybook / CI Environments
        +---> Breaks unit testing isolation completely

SOLUTION:
[UI Component] ---> [ usePaymentGateway() ] ---> [ PaymentGatewayPort ]
                                                         |
                   +-------------------------------------+-------------------------------------+
                   |                                                                           |
                   v                                                                           v
     [ StripePaymentAdapter ] (Browser / Prod)                                  [ InMemoryPaymentFake ] (CI / Unit Tests)
========================================================================================================================
```

---

## ❓ Senior Technical Interview Defense Questions (50 Questions)

#### Q1: What is the fundamental difference between Dependency Injection and Service Location?
**Senior Answer:** In Dependency Injection, a component passively receives its dependencies via constructor arguments, props, or Context hook gateways without knowing where they originated. In Service Location, a component actively queries a global or ambient registry (`ServiceLocator.get("AuthService")`). DI enforces strict architectural boundaries, whereas Service Location hides dependencies and makes testing and lifecycle tracking brittle.

#### Q2: Why is passing a raw third-party SDK instance (e.g. `new Stripe()`) directly into a Context Provider considered an architectural failure?
**Senior Answer:** It violates the Dependency Inversion Principle. The application components become tightly coupled to the third-party vendor's method signatures, data structures, and lifecycle quirks. If the vendor updates their API or the organization migrates to Adyen/PayPal, hundreds of UI components must be refactored. Wrapping the SDK in a domain-specific Adapter Port isolates the third-party dependency to a single file.

#### Q3: How does React Context facilitate Concurrent Mode safety compared to global module singletons?
**Senior Answer:** In Concurrent Mode, React can pause, abort, and restart rendering passes across multiple priority lanes. Global singletons mutate state outside of React's scheduler, causing "tearing" where two UI branches read inconsistent values during the same frame. Context values flow strictly through the Fiber tree and are cursor-stacked (`pushProvider`/`popProvider`), guaranteeing request and priority isolation.

#### Q4: What is the purpose of custom hook gateways like `useHttpClient()` throwing when Context is `null`?
**Senior Answer:** It enforces the "Fail-Fast" principle. If a developer renders a consumer component without the required Provider ancestor, the application immediately throws a clear, descriptive error during the render phase rather than failing silently or crashing later with cryptic `Cannot read properties of undefined (reading 'get')` errors during user interaction.

#### Q5: Can a Service Context update its value without causing UI re-renders?
**Senior Answer:** If the Service Context value reference remains identical (`Object.is(oldService, newService) === true`), React’s `propagateContextChange()` will **not** trigger, and zero consumers will re-render. Services generally expose stable method references, making them optimal for Context distribution without performance overhead.

#### Q6: How do you mock a Context dependency in Vitest/Jest without using `vi.mock()` on file modules?
**Senior Answer:** Use **Provider Wrapper Substitution**. Render the component inside a test wrapper that provides an in-memory Fake adapter implementing the Port contract (`render(<MyComponent />, { wrapper: ({ children }) => <ApiContext.Provider value={new InMemoryApiFake()}>{children}</ApiContext.Provider> })`). This tests the actual runtime execution path without monkey-patching Node.js module caches.

#### Q7: What is the difference between a Mock, a Stub, and a Fake in Context testing?
**Senior Answer:**
- **Stub:** Returns hardcoded canned responses (`getUser: async () => ({ name: 'Alice' })`).
- **Mock:** Tracks method invocations and verifies interactions (`expect(mock.track).toHaveBeenCalledTimes(1)`).
- **Fake:** A fully functioning, lightweight in-memory implementation (e.g. `InMemoryDatabase` backed by a TypeScript `Map`) that behaves like the real system without network or disk I/O.

#### Q8: How should resources with asynchronous lifecycles (like WebSocket connections) be managed in a Provider?
**Senior Answer:** The Provider component should instantiate the adapter via `useMemo` (keyed on configuration) and manage connection opening, heartbeat pings, and cleanup teardown inside `useEffect`. When the Provider unmounts, the effect cleanup function executes `service.disconnect()`, guaranteeing zero connection leaks.

#### Q9: Why is assigning default fallback objects inside `createContext({ load: () => {} })` dangerous?
**Senior Answer:** Providing mock/dummy defaults inside `createContext` masks missing Provider boundaries. When a component is accidentally mounted outside its feature Provider, it silently calls no-op functions rather than throwing an error, leading to subtle data loss and rendering bugs that are extremely difficult to troubleshoot.

#### Q10: How do you prevent Context dependency recreation when a Provider's parent re-renders?
**Senior Answer:** Wrap service instantiation in `useMemo` with explicit dependency arrays (`useMemo(() => new ApiAdapter(config.baseUrl), [config.baseUrl])`), or instantiate the service once at the module level if it has no reactive React state dependencies.

#### Q11: What is the role of the Composition Root in React applications?
**Senior Answer:** The Composition Root is the centralized location where configuration is parsed, concrete adapters are instantiated, and Provider hierarchies are composed around the application tree (e.g. in `App.tsx` or feature entry points). It ensures business components never instantiate infrastructure directly.

#### Q12: How does Context Dependency Injection simplify Storybook visual regression testing?
**Senior Answer:** In Storybook, components can be wrapped with custom decorators that inject deterministic Fakes (`<ApiContext.Provider value={new MockFailureApi()}>`). This allows visual verification of loading states, error boundaries, empty states, and data grids without running backend servers or mock service workers.

#### Q13: Why is Interface Segregation Principle (ISP) critical when designing Context contracts?
**Senior Answer:** ISP states that clients should not be forced to depend on interfaces they do not use. Creating granular Contexts (`LoggerContext`, `AuthContext`) rather than a single `AppContext` ensures components only consume and re-evaluate on dependencies relevant to their immediate responsibilities.

#### Q14: How can Context DI be used to implement Feature Flag toggles cleanly?
**Senior Answer:** Define a `FeatureFlagPort` (`isEnabled(flag: string): boolean`). The production adapter evaluates flags via LaunchDarkly/PostHog, while the test adapter allows tests to imperatively toggle flags (`flagsFake.setFlag('NEW_CHECKOUT', true)`) to verify both code branches in unit tests.

#### Q15: What is the difference between shallow mocking and testing with In-Memory Fakes via Context?
**Senior Answer:** Shallow mocking stubs child components, testing only surface props. Testing with In-Memory Fakes via Context renders the complete virtual DOM subtree against a realistic, working in-memory backend, verifying genuine user workflows, state transitions, and UI assertions with maximum test confidence.

#### Q16: Can multiple independent instances of the same Provider exist simultaneously in a single React tree?
**Senior Answer:** Yes. A single Context descriptor can be provided by dozens of concurrent `<Provider>` instances in the Fiber tree. Descendant consumers automatically bind to the nearest ancestor Provider in their Fiber branch, enabling multi-tenant widgets, side-by-side comparisons, and isolated feature sandboxes.

#### Q17: How do you handle circular dependencies between two Context Services?
**Senior Answer:** Circular dependencies indicate a flawed domain model. They should be resolved by: (1) extracting the shared capability into a third, lower-level Port, (2) using an event-driven publish/subscribe bus, or (3) passing callbacks at the method invocation level rather than during service construction.

#### Q18: What is the impact of Context DI on Server-Side Rendering (SSR) performance?
**Senior Answer:** Context DI in SSR has near-zero overhead. Because SSR executes a single downward render pass without re-renders, Context values are pushed to the value cursor stack and read in $O(1)$ time. Crucially, it provides request-level isolation, preventing memory cross-talk between concurrent Node.js requests.

#### Q19: How do you test error boundaries triggered by injected service rejections?
**Senior Answer:** Instantiate an `InMemoryFake` configured to reject promises (`fake.shouldReject = true`). Render the component inside the test Provider and assert that the `<ErrorBoundary />` fallback UI appears in the DOM.

#### Q20: When is Prop Drilling actually superior to Context Dependency Injection?
**Senior Answer:** When a component is a purely presentational, reusable leaf UI element (e.g., `Button`, `Input`, `Card`) that operates on direct props and has no architectural dependency on external infrastructure. Injecting Context into low-level UI primitives destroys their portability.

#### Q21: How do you prevent memory leaks when injecting Event Emitter services via Context?
**Senior Answer:** Ensure all consumer components unsubscribe from event listeners inside `useEffect` cleanup blocks (`useEffect(() => eventBus.subscribe(handleEvent), [eventBus])`). The Provider itself must call `eventBus.removeAllListeners()` upon unmounting.

#### Q22: How does Context DI interact with TypeScript Generic types?
**Senior Answer:** TypeScript supports generic Context creation via factory functions: `function createRepositoryContext<T>() { return createContext<RepositoryPort<T> | null>(null); }`. This provides compile-time type safety across entity repositories.

#### Q23: Why should UI components never perform `instanceof` checks on injected Context services?
**Senior Answer:** `instanceof` couples the component to a concrete JavaScript class constructor, destroying the polymorphism of the Port contract and breaking tests that supply plain object stubs or Fakes.

#### Q24: How do you audit which Context dependencies a component is consuming in production?
**Senior Answer:** Wrap custom hook gateways with telemetry monitors in development/staging: `if (__DEV__) { TelemetryTracker.recordAccess(componentName, 'HttpClientPort'); }`.

#### Q25: Can Context DI be used to swap between LocalStorage and IndexedDB transparently?
**Senior Answer:** Yes. Define a `StoragePort` (`get(key)`, `set(key, val)`). Create `LocalStorageAdapter` and `IndexedDbAdapter`. Swap them in the Composition Root based on device capabilities or storage quotas without changing any UI code.

#### Q26: What is an Anti-Corruption Layer (ACL) in the context of React frontend architecture?
**Senior Answer:** An ACL is a translation layer (implemented via Adapters and Context) that converts an external vendor's complex or legacy data models into clean, domain-specific representations required by the React application.

#### Q27: How does Context DI help comply with GDPR / Cookie Consent regulations?
**Senior Answer:** The Composition Root inspects user consent. If analytics are rejected, it injects a `NoOpTelemetryAdapter`; if accepted, it injects `GoogleAnalyticsAdapter`. Consuming components execute `telemetry.track()` unconditionally without branching on cookie consent state.

#### Q28: How do you handle asynchronous initialization of an injected service before rendering children?
**Senior Answer:** Render a loading state/spinner in the Provider until the service's asynchronous `init()` promise resolves, then provide the initialized service instance to `{children}`.

#### Q29: What happens if a nested Provider passes `value={undefined}`?
**Senior Answer:** The nested Provider explicitly sets the contextual value in that subtree to `undefined`, shadowing any parent Provider value. Custom hook gateways checking `if (val === null || val === undefined)` will throw.

#### Q30: How do you structure a Custom Render utility for React Testing Library with 5+ Providers?
**Senior Answer:** Compose providers into a reusable `AllTheProviders` wrapper function that accepts custom Fake overrides via options, returning the rendered screen alongside direct references to the instantiated Fakes.

#### Q31: Why is it preferable to inject a LoggerPort rather than calling `console.log` directly?
**Senior Answer:** An injected `LoggerPort` allows formatting logs, routing critical errors to Sentry/Datadog in production, buffering logs in memory for bug reports, and completely silencing logs during unit test execution.

#### Q32: Can a Context Provider be written as a Higher-Order Component (HOC)?
**Senior Answer:** Yes (`withAuthProvider(Component)`), but modern React strongly prefers JSX Component composition (`<AuthProvider><Component /></AuthProvider>`) for better readability and devtools tree clarity.

#### Q33: How do you inject platform-specific capabilities in React Native vs React Web using Context?
**Senior Answer:** Define a common `DeviceCapabilitiesPort`. In Web, provide `WebGeolocationAdapter`; in Native, provide `CoreLocationAdapter`. Consuming UI components share 100% identical business logic.

#### Q34: What is the risk of using Context DI for high-frequency numeric animation data?
**Senior Answer:** Context is not designed for 60fps/120fps frame-by-frame updates. High-frequency animations should bypass Context reconciliation and use mutable refs, imperative animation drivers (Framer Motion, Reanimated), or direct DOM mutations.

#### Q35: How do you mock HTTP API responses when using an injected `HttpClientPort` instead of Mock Service Worker (MSW)?
**Senior Answer:** Use an `InMemoryHttpFake` that maintains an internal route registry (`fake.registerRoute('GET', '/users', () => ({ data: users, status: 200 }))`). This executes synchronously in memory without network interception latency.

#### Q36: Why should adapter classes avoid storing React-specific state internally?
**Senior Answer:** Adapters belong to the infrastructure/domain layer and should remain pure TypeScript/JavaScript. React state should be managed within React hooks and Providers to respect the Fiber reconciliation lifecycle.

#### Q37: How do you enforce architectural dependency rules in CI (e.g. components cannot import adapters)?
**Senior Answer:** Use ESLint `no-restricted-imports` or `eslint-plugin-boundaries` to enforce that UI directories can only import from `ports/` and `gateways/`, never from `adapters/` or `infrastructure/`.

#### Q38: What is the difference between constructor injection in backend frameworks (NestJS/Spring) and Context injection in React?
**Senior Answer:** Backend frameworks inject dependencies imperatively during class instantiation. React Context injects dependencies hierarchically through the virtual component tree, enabling dynamic UI scoping and localized overrides.

#### Q39: Can an injected service consume another injected service?
**Senior Answer:** Yes. The Composition Root can compose adapters hierarchically (`const http = new FetchHttpAdapter(); const auth = new OAuth2AuthAdapter(http, storage);`).

#### Q40: How do you ensure test coverage of the concrete Production Adapters themselves?
**Senior Answer:** Write dedicated Contract/Integration tests for each Adapter using Mock Service Worker (MSW) or live staging sandboxes, verifying they accurately implement the Port specification.

#### Q41: What is the performance impact of deeply nested Provider hierarchies?
**Senior Answer:** Each Provider adds 1 Fiber node to the tree. During steady-state rendering with stable values, Fiber traversal overhead is negligible (<0.01ms).

#### Q42: How does Context DI prevent "Test Flakiness"?
**Senior Answer:** By replacing non-deterministic external dependencies (network latency, clock drift, third-party outages) with deterministic In-Memory Fakes that execute instantaneously and predictably.

#### Q43: Should database query logic reside inside a Context Provider?
**Senior Answer:** No. Context should inject a `RepositoryPort` or `ApiClientPort`. Database query construction belongs inside the Adapter or backend API layer.

#### Q44: How do you handle configuration changes (e.g. switching environments at runtime)?
**Senior Answer:** The Provider updates its state with the new configuration, instantiating a fresh Adapter instance. React Fiber propagates the new service reference down the tree.

#### Q45: How can Context DI support Offline-First architectures?
**Senior Answer:** The Composition Root checks network status. When offline, it injects `IndexedDbStorageAdapter`; when online, it injects `SyncingCloudStorageAdapter`.

#### Q46: Why is `useMemo` essential when instantiating Adapters inside a Provider component?
**Senior Answer:** Without `useMemo`, every render of the Provider creates a brand new Adapter instance, breaking object reference equality and triggering unnecessary context propagation.

#### Q47: Can React Server Components (RSC) consume Service Contexts?
**Senior Answer:** No. React Server Components do not support React Context (`createContext` is client-only). Server components receive dependencies via standard Node.js module imports or async function parameters.

#### Q48: How do you test optimistic UI updates with an injected service?
**Senior Answer:** Configure a Fake service with a delayed promise (`fake.delayMs = 500`), trigger the action, assert immediate optimistic UI state, resolve the promise, and assert final confirmed state.

#### Q49: What is the ultimate benefit of decoupling UI components from concrete infrastructure?
**Senior Answer:** Maximum maintainability, zero-friction refactoring, 100% deterministic testability, and the ability to evolve backend protocols or vendors without touching UI code.

#### Q50: What is the single most important summary rule for Context as Dependency Injection?
**Senior Answer:** Components must depend on abstract Ports; Providers must supply concrete Adapters; Custom Hook Gateways must guard the boundary; and Tests must substitute deterministic Fakes.

---

### Navigation Links
[⬅️ Previous Part](file:///d:/engineering/web-development/01-Frontend/06-React-Fundamentals/11-Context-Dependency-Distribution/08-context-propagation-bailouts-and-reconciliation-boundaries.md) | [📚 Level 06 Index](file:///d:/engineering/web-development/01-Frontend/06-React-Fundamentals/11-Context-Dependency-Distribution/README.md) | [🧪 Companion Lab](file:///d:/engineering/web-development/01-Frontend/06-React-Fundamentals/11-Context-Dependency-Distribution/examples/09-context-as-dependency-injection-testing-and-modular-adapters.html) | [Next Part ➡️](file:///d:/engineering/web-development/01-Frontend/06-React-Fundamentals/11-Context-Dependency-Distribution/10-context-selectors-external-stores-and-usesyncexternalstore.md)
