# Level 06 — React Fundamentals
# KPI 16 — Error Handling, Boundaries & Resilience
## PART 07 — Expected vs Unexpected Errors & Domain-Level Error Modeling

[⬅️ Previous Part](./06-error-telemetry-correlation-observability.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](./examples/07-expected-vs-unexpected-errors-domain-modeling.html) | [Next KPI ➡️](../../17-Accessibility-React/README.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)  
> **Co-Author:** Prasenjeet (Mid-Level Full Stack Developer)

---

# 0. 🧭 The Core Architectural Question & Mental Models

Parts 01 through 06 established the foundational infrastructure of frontend resilience:
1. **Component-Tree Failure Isolation (Part 01):** Intercepting Fiber render crashes via class-based boundaries.
2. **Failure-Surface Classification (Part 02):** Distinguishing render-phase errors from asynchronous, event-handler, and SSR execution errors.
3. **Recovery & Reset Semantics (Part 03):** Implementing retry state machines, exponential backoff, and fallback UI ergonomics.
4. **Failure Domains & Blast Radius (Part 04):** Topographical placement of boundaries to prevent single-widget failures from crashing the shell.
5. **Boundary State & Identity Keys (Part 05):** Resetting error states via key-based identity shifting and remount mechanics.
6. **Error Telemetry & Correlation (Part 06):** Capturing component stacks, tracing IDs, and building observability pipelines.

```text
  ┌──────────────┐     ┌────────────────┐     ┌─────────────┐     ┌────────────┐     ┌──────────────┐     ┌──────────────┐
  │  Detection   │ ──► │ Classification │ ──► │ Containment │ ──► │  Recovery  │ ──► │   Identity   │ ──► │ Observability│
  │  Origins     │     │  (Render/Async)│     │ (Boundaries)│     │  (Retries) │     │ (Reset Keys) │     │ (Telemetry)  │
  │  (Part 01)   │     │   (Part 02)    │     │  (Part 03)  │     │ (Part 04)  │     │  (Part 05)   │     │  (Part 06)   │
  └──────────────┘     └────────────────┘     └─────────────┘     └────────────┘     └──────────────┘     └──────────────┘
```

This masterclass tackles the most fundamental semantic design challenge in modern software engineering:

> **When something fails in an application, what does that failure mean to the product, who owns the decision about it, and should it be modeled as first-class domain state or caught by an Error Boundary as an exceptional runtime failure?**

---

### The Semantic Flattening Anti-Pattern

In junior codebases, every unexpected response or rejected promise is converted into a thrown JavaScript `Error`:

```text
                               THE FLAT EXCEPTION ANTI-PATTERN (WRONG)
    ┌─────────────────────────────────────────────────────────────────────────────────────────┐
    │ Invalid Password       ──► throw new Error("Invalid password")     ──► <ErrorBoundary>   │
    │ 403 Forbidden          ──► throw new Error("Permission denied")    ──► <ErrorBoundary>   │
    │ 409 Document Conflict  ──► throw new Error("Version mismatch")     ──► <ErrorBoundary>   │
    │ Payment Card Declined  ──► throw new Error("Card declined")        ──► <ErrorBoundary>   │
    │ Search No Results      ──► throw new Error("No items found")       ──► <ErrorBoundary>   │
    │ Null Pointer Bug (💥)  ──► TypeError: Cannot read prop of null     ──► <ErrorBoundary>   │
    └─────────────────────────────────────────────────────────────────────────────────────────┘
                                                │
                                                ▼
                   ALL SIX FAILURES RENDER THE EXACT SAME GENERIC FALLBACK:
                   "💥 Something went wrong. Please reload the application."
```

When all failures are thrown as exceptions:
1. **Domain Context Is Annihilated:** A user who mistyped their CVV code receives the same catastrophic crash screen as a user whose browser encountered a memory corruption defect.
2. **Actionable Recovery Is Destroyed:** The user cannot fix their typing mistake, cannot switch credit cards, and cannot resolve document merge conflicts because the form component has been unmounted from the DOM.
3. **Telemetry Pipelines Are Polluted:** Engineering on-call alerts fire constantly for routine business outcomes (e.g. 10,000 users entering wrong passwords), masking genuine software regressions.

---

### The Senior Architectural Invariant

A senior staff engineer partitions all system failures into three orthogonal categories based on **expectation**, **ownership**, and **handling mechanism**:

```text
                               THE 3-TIER FAILURE TAXONOMY
                                            │
        ┌───────────────────────────────────┼───────────────────────────────────┐
        ▼                                   ▼                                   ▼
  1. EXPECTED DOMAIN FAILURE        2. OPERATIONAL ASYNC FAILURE        3. UNEXPECTED RUNTIME FAILURE
  - Invalid user input              - Temporary network drop            - Null pointer dereference
  - Credit card declined            - 504 Gateway timeout               - Broken render invariant
  - 403 Forbidden permission        - Rate limiting (429)               - Corrupted third-party canvas
  - 409 Document editing conflict   - WebSocket disconnection           - SyntaxError in parser hook
  - 404 Entity not found            - Service degraded (503)            - React Hook order violation
        │                                   │                                   │
        ▼                                   ▼                                   ▼
  OWNER: Form / Business Domain     OWNER: Async Data Lifecycle Hook    OWNER: React Error Boundary
  HANDLING: Explicit State Machine  HANDLING: Retry / Offline Banner    HANDLING: Bulkhead Isolation Fallback
  UX: Contextual Actionable UI      UX: Non-blocking Revalidation       UX: Graceful Error Card + Telemetry
```

$$\text{Resilient Architecture Invariant:} \quad \text{Expected Failures} \implies \text{Domain Data} \quad \Big\vert \quad \text{Unexpected Failures} \implies \text{Bulkhead Containment}$$

---

# 1. ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       THE 3 MAJOR FAILURE CATEGORIES IN REACT                                        │
├────────────────────┬──────────────────────────────────────┬────────────────────────────┬─────────────────────────────┤
│ Failure Class      │ Semantic Meaning                     │ State Representation       │ Handling Mechanism          │
├────────────────────┼──────────────────────────────────────┼────────────────────────────┼─────────────────────────────┤
│ 1. Expected Domain │ Normal, predictable business outcome │ Discriminated union        │ Modeled in feature state;   │
│    Failure         │ (e.g. Card Declined, Username Taken) │ `{ kind: "declined" }`     │ renders specialized UI card │
├────────────────────┼──────────────────────────────────────┼────────────────────────────┼─────────────────────────────┤
│ 2. Recoverable     │ Transient infrastructure or resource │ Async query state machine  │ Handled in hook / loader;   │
│    Operational     │ outage (e.g. 504 Timeout, Offline)   │ `{ status: "stale_error" }`│ non-fatal retry banner      │
├────────────────────┼──────────────────────────────────────┼────────────────────────────┼─────────────────────────────┤
│ 3. Unexpected      │ Software defect or violated invariant│ React Fiber exception      │ Intercepted by nearest      │
│    Programming Bug │ (e.g. `undefined.map()`, syntax err) │ Uncaught runtime throw     │ `<ErrorBoundary>` bulkhead  │
└────────────────────┴──────────────────────────────────────┴────────────────────────────┴─────────────────────────────┘
```

### 1.1 The Failure Ownership Matrix

```text
┌────────────────────────────────────────┬─────────────────────────────┬───────────────────────────────────────────────┐
│ Incident Scenario                      │ Primary Architectural Owner │ Appropriate UI Experience                     │
├────────────────────────────────────────┼─────────────────────────────┼───────────────────────────────────────────────┤
│ Required form field is empty           │ Form State (`useForm`)      │ Inline red validation label below input       │
│ User enters incorrect password         │ Auth Controller (`useAuth`) │ "Incorrect credentials. Reset password?"      │
│ User lacks permission (403 Forbidden)  │ Route / Feature Container   │ "Access Restricted. Request Manager Approval" │
│ Document edited by peer (409 Conflict) │ Document Domain Hook        │ Side-by-side diff conflict resolution modal   │
│ Credit card declined (Insufficient)    │ Payment Mutation Hook       │ "Card declined by issuer. Try another card"   │
│ Resource ID not found (404 Not Found)  │ Feature Loader / Router     │ Clean empty state: "Document does not exist"  │
│ Search query returns 0 items           │ Search View State           │ Informative empty state with filter reset     │
│ Rate limit exceeded (429 Too Many Req) │ API Client / Rate Limiter   │ Countdown banner: "Rate limited. Retry in 12s"│
│ Network drops during auto-save         │ Sync Manager Hook           │ Floating warning banner: "Offline. Retrying..."│
│ Developer typos `user.prfile.name` (💥)│ Local Widget Error Boundary │ Isolated error card with diagnostic UUID      │
│ WebGL chart crashes on GPU shader (💥) │ Chart Bulkhead Boundary     │ Fallback SVG table view without page crash    │
│ Root context provider throws (💥)      │ Global Root Boundary        │ Enterprise disaster recovery fallback screen  │
└────────────────────────────────────────┴─────────────────────────────┴───────────────────────────────────────────────┘
```

---

# 2. 🔬 Architectural Equation for Failure Classification

The health of a distributed web application can be formally modeled as:

$$\text{Resilience Quality Index (RQI)} = \frac{\sum \text{Domain Modeled Outcomes} + \sum \text{Handled Operational Retries} + \sum \text{Bulkhead Isolations}}{\sum \text{Uncaught Exceptions} + \sum \text{Swallowed Silent Defects} + \sum \text{False Positive Alarms}}$$

```text
                                        FAILURE CLASSIFICATION DECISION TREE
                                                         │
                                                         ▼
                                            DID SOMETHING FAIL?
                                                         │
                        ┌────────────────────────────────┴────────────────────────────────┐
                        ▼                                                                 ▼
             IS THIS A KNOWN BUSINESS                                          IS THIS A PROGRAMMING BUG
             OR OPERATIONAL OUTCOME?                                           OR FIBER INVARIANT CRASH?
                        │                                                                 │
           ┌────────────┴────────────┐                                                    ▼
           ▼                         ▼                                         UNEXPECTED RUNTIME FAILURE
      EXPECTED                  OPERATIONAL                                    - Null pointer dereference
   DOMAIN OUTCOME               RESOURCE GAP                                   - Render syntax exception
   - Card declined              - Network timeout                              - Broken component invariant
   - 403 Forbidden              - HTTP 504 gateway                             - Hook rule violation
   - 409 Conflict               - Offline mode                                            │
   - Form invalid               - HTTP 429 rate limit                                     ▼
           │                                 │                                  THROW RUNTIME EXCEPTION
           ▼                                 ▼                                            │
   DISCRIMINATED UNION           ASYNC QUERY STATE MACHINE                                ▼
   - kind: "validation"          - status: "stale_error"                       INTERCEPT VIA ERROR BOUNDARY
   - kind: "forbidden"           - retry: exponential_backoff                  - Isolate blast radius
   - kind: "conflict"            - preserve cached data                        - Mount fallback card
           │                                 │                                 - Send Sentry/OTel telemetry
           ▼                                 ▼                                            │
   ACTIONABLE BUSINESS UI        NON-BLOCKING WARNING BANNER                              ▼
   (Diff Resolver, Switch Card)  ("Offline. Retrying in 5s...")                 CONTROLLED RECOVERY RESET
```

---

# 3. 🔬 Expected Domain Failures: Modeling Errors as First-Class Data

In functional domain-driven design (DDD) and senior TypeScript engineering, **expected business failures are data, not exceptions**.

### 3.1 The Payment Mutation Example

Consider processing a customer's subscription renewal:

```typescript
// ❌ CRITICAL JUNIOR ANTI-PATTERN: Throwing exceptions for business outcomes
async function processSubscription(cardToken: string): Promise<string> {
  const response = await fetch("/api/checkout", { 
    method: "POST", 
    body: JSON.stringify({ cardToken }) 
  });
  const data = await response.json();

  if (!response.ok) {
    // 💥 This converts a normal business failure into an uncontrolled runtime crash!
    throw new Error(data.message || "Payment failed");
  }

  return data.subscriptionId;
}
```

```typescript
// ✅ SENIOR ARCHITECTURAL PATTERN: Discriminated Union Domain Modeling
export type PaymentOutcome =
  | { status: "SUCCESS"; subscriptionId: string; receiptUrl: string }
  | { status: "CARD_DECLINED"; declineCode: "INSUFFICIENT_FUNDS" | "EXPIRED_CARD" | "SUSPECTED_FRAUD"; message: string }
  | { status: "AUTHENTICATION_REQUIRED"; threeDSecureUrl: string }
  | { status: "GATEWAY_TIMEOUT"; retryable: boolean };

export async function processSubscriptionResilient(cardToken: string): Promise<PaymentOutcome> {
  try {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardToken }),
    });

    const data = await response.json();

    if (response.status === 200) {
      return { status: "SUCCESS", subscriptionId: data.id, receiptUrl: data.receipt };
    }

    if (response.status === 402) {
      return {
        status: "CARD_DECLINED",
        declineCode: data.declineCode || "INSUFFICIENT_FUNDS",
        message: data.message || "Card was declined by issuing bank.",
      };
    }

    if (response.status === 403 && data.requires3DS) {
      return { status: "AUTHENTICATION_REQUIRED", threeDSecureUrl: data.redirectUrl };
    }

    return { status: "GATEWAY_TIMEOUT", retryable: true };
  } catch (networkError) {
    // Network drop is an operational failure, not an Error Boundary crash!
    return { status: "GATEWAY_TIMEOUT", retryable: true };
  }
}
```

### 3.2 Exhaustive Pattern Matching in the UI

Because `PaymentOutcome` is a TypeScript discriminated union on `status`, the React rendering component can use TypeScript's `never` compile-time exhaustiveness check:

```tsx
export function SubscriptionStatusView({ outcome, onRetry, onSwitchCard }: {
  outcome: PaymentOutcome;
  onRetry: () => void;
  onSwitchCard: () => void;
}) {
  switch (outcome.status) {
    case "SUCCESS":
      return (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-200">
          <h3 className="font-bold text-white text-base">🎉 Subscription Activated!</h3>
          <p className="text-xs mt-1">Receipt ID: {outcome.subscriptionId}</p>
          <a href={outcome.receiptUrl} className="text-xs text-emerald-400 underline mt-2 block">
            Download Invoice PDF
          </a>
        </div>
      );

    case "CARD_DECLINED":
      return (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-200">
          <h3 className="font-bold text-white text-base">⚠️ Payment Declined</h3>
          <p className="text-xs mt-1">{outcome.message}</p>
          <div className="flex gap-2 mt-3">
            <button onClick={onSwitchCard} className="px-3 py-1.5 bg-amber-600 text-white rounded text-xs font-bold hover:bg-amber-500 transition">
              Use Another Card
            </button>
            <button onClick={onRetry} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs hover:bg-slate-700 transition">
              Retry Card
            </button>
          </div>
        </div>
      );

    case "AUTHENTICATION_REQUIRED":
      return (
        <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800 text-blue-200">
          <h3 className="font-bold text-white text-base">🔒 Bank Verification Required</h3>
          <p className="text-xs mt-1">Please complete 3D Secure verification with your bank.</p>
          <a href={outcome.threeDSecureUrl} className="mt-3 inline-block px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-500 transition">
            Complete Verification ↗
          </a>
        </div>
      );

    case "GATEWAY_TIMEOUT":
      return (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
          <h3 className="font-bold text-white text-base">⏳ Payment Processing Delayed</h3>
          <p className="text-xs mt-1">The banking gateway took too long to respond. Your card was not charged.</p>
          <button onClick={onRetry} className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-500 transition">
            Try Again
          </button>
        </div>
      );

    default: {
      // Compile-time exhaustive check! If a new status is added to PaymentOutcome, this line will fail to compile.
      const _exhaustiveCheck: never = outcome;
      return null;
    }
  }
}
```

---

# 4. 🔬 Unexpected Programming Failures: When Error Boundaries MUST Intervene

An unexpected failure occurs when an internal invariant, type guarantee, or rendering dependency is violated at runtime.

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               PROGRAMMING INVARIANT VIOLATIONS                                   │
├────────────────────────────┬───────────────────────────────────┬─────────────────────────────────┤
│ Failure Manifestation      │ Root Cause                        │ Correct Isolation Boundary      │
├────────────────────────────┼───────────────────────────────────┼─────────────────────────────────┤
│ `TypeError: x is undefined`│ Null pointer dereference in Fiber │ Nearest Widget Error Boundary   │
│ `Invariant Violation #42`  │ Hook called conditionally         │ Feature Bulkhead Error Boundary │
│ Corrupted Third-Party Canvas│ WebGL context destroyed by OS    │ Canvas Container Error Boundary │
│ Circular JSON Serialization│ Stack overflow in deep formatter  │ Isolated Card Error Boundary    │
│ SyntaxError in JSON.parse  │ Corrupted localStorage cache      │ Storage Wrapper Error Boundary  │
└────────────────────────────┴───────────────────────────────────┴─────────────────────────────────┘
```

```tsx
// 💥 GENUINE PROGRAMMING DEFECT:
// The developer assumed `user.profile` is guaranteed by the API contract.
// If the API returns `{ id: "104" }` without `profile`, rendering crashes!
export function UserProfileCard({ user }: { user: { id: string; profile?: { name: string; avatarUrl: string } } }) {
  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
      {/* 💥 Throws TypeError if user.profile is undefined! */}
      <img src={user.profile.avatarUrl} alt={user.profile.name} />
      <h3>{user.profile.name}</h3>
    </div>
  );
}
```

When this crashes:
1. React's Fiber work loop catches the `TypeError` during the render phase.
2. The nearest ancestor `<ErrorBoundary boundaryName="UserProfileBoundary">` captures the exception via `getDerivedStateFromError`.
3. The boundary renders a localized fallback error card.
4. Telemetry records the JavaScript call stack and component stack for engineers to fix the bug.
5. **The rest of the parent dashboard layout remains 100% healthy and responsive!**

---

# 5. 🔬 The Crucial Distinction: Domain Meaning vs Runtime Defect

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             CRUCIAL DISTINCTION: MEANING VS CRASH                                │
├───────────────────────────────────┬──────────────────────────────────────────────────────────────┤
│ Expected Domain Outcome           │ Unexpected Programming Crash                                 │
├───────────────────────────────────┼──────────────────────────────────────────────────────────────┤
│ "Payment Card Declined"           │ "TypeError: Cannot read properties of undefined (reading 'x')"│
│ Expected business condition       │ Defect in frontend code or violated data invariant           │
│ Handled in feature state          │ Intercepted by `<ErrorBoundary>` bulkhead                    │
│ User understands and takes action │ User cannot fix code; needs retry or fallback view           │
│ Metric logged to business BI      │ High-priority exception logged to Sentry / Datadog           │
│ UI stays mounted with custom form │ Subtree unmounts; fallback view mounted                      │
│ Blast radius = zero               │ Blast radius = isolated to nearest boundary                  │
│ Engineering action: None          │ Engineering action: P1/P2 Bug fix in next sprint             │
└───────────────────────────────────┴──────────────────────────────────────────────────────────────┘
```

```text
        PAYMENT DECLINED                                  PAYMENT COMPONENT CRASH
               │                                                     │
               ▼                                                     ▼
     Expected Business Outcome                             Unexpected Implementation Bug
               │                                                     │
               ▼                                                     ▼
     User understands message                              Isolate broken component subtree
               │                                                     │
               ▼                                                     ▼
     User switches credit card                             Dispatch Sentry telemetry alert
               │                                                     │
               ▼                                                     ▼
     Conversion is preserved!                              Controlled reset / retry button
```

---

# 6. 🔬 HTTP Status Codes $\neq$ React Error Handling Semantics

One of the most widespread junior misunderstandings in frontend architecture is equating HTTP status codes directly with Error Boundary catches.

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               HTTP STATUS SEMANTIC MAPPING GUIDE                                 │
├─────────────┬──────────────────────────┬───────────────────────┬─────────────────────────────────┤
│ HTTP Status │ RFC Standard Semantics   │ React Domain Category │ Appropriate Handling Mechanism  │
├─────────────┼──────────────────────────┼───────────────────────┼─────────────────────────────────┤
│ HTTP 400    │ Bad Request (Validation) │ Expected Domain Error │ Form validation state (`useForm`)│
│ HTTP 401    │ Unauthorized             │ Auth Session Lifecycle│ Redirect to `/login` or Modal   │
│ HTTP 403    │ Forbidden (Permissions)  │ Expected Domain State │ Render `<ForbiddenView />`      │
│ HTTP 404    │ Not Found (Missing ID)   │ Expected Domain State │ Render `<ResourceNotFound />`   │
│ HTTP 409    │ Conflict (Concurrency)   │ Expected Domain State │ Render `<ConflictResolver />`   │
│ HTTP 422    │ Unprocessable Entity     │ Expected Domain Error │ Inline field error highlights   │
│ HTTP 429    │ Rate Limited             │ Operational Resource  │ Non-fatal countdown banner      │
│ HTTP 500    │ Internal Server Error    │ Operational Failure   │ Async query retry state machine │
│ HTTP 502    │ Bad Gateway              │ Operational Failure   │ Retry with exponential backoff  │
│ HTTP 503    │ Service Unavailable      │ Operational Failure   │ Maintenance / Degraded banner   │
│ HTTP 504    │ Gateway Timeout          │ Operational Failure   │ Non-fatal stale data indicator  │
└─────────────┴──────────────────────────┴───────────────────────┴─────────────────────────────────┘
```

```typescript
// ❌ CRITICAL ANTI-PATTERN: Blanket throwing on all HTTP non-200s
async function fetchDocument(docId: string) {
  const res = await fetch(`/api/docs/${docId}`);
  if (!res.ok) {
    // 💥 404 and 403 are thrown as fatal exceptions, destroying the UI tree!
    throw new Error(`HTTP Error ${res.status}`);
  }
  return res.json();
}
```

```typescript
// ✅ SENIOR ARCHITECTURAL PATTERN: HTTP Normalization Adapter
export type DocumentResourceResult =
  | { status: "LOADED"; data: DocumentPayload }
  | { status: "NOT_FOUND"; docId: string }
  | { status: "FORBIDDEN"; requiredRole: string }
  | { status: "RATE_LIMITED"; retryAfterSeconds: number }
  | { status: "SERVER_ERROR"; retryable: boolean };

export async function fetchDocumentNormalized(docId: string): Promise<DocumentResourceResult> {
  try {
    const res = await fetch(`/api/docs/${docId}`);

    if (res.status === 200) {
      const data = await res.json();
      return { status: "LOADED", data };
    }

    if (res.status === 404) {
      return { status: "NOT_FOUND", docId };
    }

    if (res.status === 403) {
      const errorJson = await res.json().catch(() => ({}));
      return { status: "FORBIDDEN", requiredRole: errorJson.requiredRole || "Editor" };
    }

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("Retry-After") || "10", 10);
      return { status: "RATE_LIMITED", retryAfterSeconds: retryAfter };
    }

    return { status: "SERVER_ERROR", retryable: res.status >= 500 };
  } catch (networkErr) {
    return { status: "SERVER_ERROR", retryable: true };
  }
}
```

---

# 7. 🔬 The Layered 4-Tier Normalization Architecture

To keep React components clean and prevent transport protocols from leaking into presentation components, enterprise frontend systems employ a **4-Tier Normalization Pipeline**:

```text
    THE 4-TIER NORMALIZATION PIPELINE:
    
    ┌─────────────────────────────────────────────────────────────┐
    │ Tier 1: Transport & Network Layer (Fetch / Axios / RPC)     │
    │ - Receives raw HTTP bytes, status codes, and headers.       │
    │ - Handles network timeouts, DNS drops, and TLS failures.    │
    └──────────────────────────────┬──────────────────────────────┘
                                   │
                                   ▼
    ┌─────────────────────────────────────────────────────────────┐
    │ Tier 2: Domain Normalization Adapter                        │
    │ - Translates HTTP status codes into typed Discriminated     │
    │   Unions (`{ kind: "conflict" }`, `{ kind: "forbidden" }`). │
    │ - Normalizes error codes, server timestamps, and payloads.  │
    └──────────────────────────────┬──────────────────────────────┘
                                   │
                                   ▼
    ┌─────────────────────────────────────────────────────────────┐
    │ Tier 3: Feature State & State Machine Layer (Hook / Store)  │
    │ - Merges domain outcomes with UI memory snapshots.          │
    │ - Manages optimistic updates, rollbacks, and retry policies.│
    └──────────────────────────────┬──────────────────────────────┘
                                   │
                                   ▼
    ┌─────────────────────────────────────────────────────────────┐
    │ Tier 4: Pure React Presentation Layer                       │
    │ - Renders explicit, actionable domain views.                │
    │ - Free of `try/catch` boilerplate and raw HTTP checks.      │
    └─────────────────────────────────────────────────────────────┘
```

---

# 8. 🔬 The Anti-Patterns: Boolean Explosions & String Protocol Traps

### Anti-Pattern 1: The Boolean Explosion Trap

```typescript
// ❌ CATASTROPHIC ANTI-PATTERN: Boolean state explosion
interface DocumentEditorState {
  isLoading: boolean;
  isError: boolean;
  isForbidden: boolean;
  isNotFound: boolean;
  isConflict: boolean;
  isSaved: boolean;
  isRateLimited: boolean;
}
```

**Why this fails in production:**  
With 7 booleans, there are $2^7 = 128$ possible states! What does it mean when `isLoading = true`, `isError = true`, and `isSaved = true` simultaneously? The UI enters impossible, glitchy states where a spinner, a red error card, and a green success checkmark render on top of each other!

```typescript
// ✅ PRODUCTION BEST PRACTICE: Discriminated State Union
export type DocumentEditorState =
  | { stage: "LOADING" }
  | { stage: "READY"; doc: DocumentPayload }
  | { stage: "NOT_FOUND"; docId: string }
  | { stage: "FORBIDDEN"; requiredRole: string }
  | { stage: "SAVING"; doc: DocumentPayload }
  | { stage: "CONFLICT"; localDoc: DocumentPayload; serverDoc: DocumentPayload }
  | { stage: "RATE_LIMITED"; retryAfterSeconds: number }
  | { stage: "SAVE_ERROR"; doc: DocumentPayload; reason: string };
```

There is now **exactly 1 active stage** at any millisecond. Impossible states are mathematically eliminated at compile time!

### Anti-Pattern 2: The Error Message String Protocol Trap

```typescript
// ❌ DANGEROUS ANTI-PATTERN: String inspection
if (error.message.includes("permission") || error.message.includes("403")) {
  renderForbiddenScreen();
}
```

**Why this fails in production:**  
When the backend engineering team updates the error message from `"Permission denied"` to `"Access unauthorized"`, or when the application is translated into German (`"Zugriff verweigert"`), the string match fails! The UI defaults to a generic crash card.  
**Rule:** Always branch on **stable numeric/enum machine codes** (`code === "AUTH_FORBIDDEN"`), never human-readable text strings!

---

# 9. 🔬 Domain Errors Are Data: Discriminated Unions & Result Types

In high-reliability frontend architectures, we can model asynchronous operations using an algebraic `Result<T, E>` pattern:

```typescript
// Core Algebraic Result Type
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// Enterprise AppError Discriminated Union
export type AppDomainError =
  | { kind: "VALIDATION"; fieldErrors: Record<string, string[]> }
  | { kind: "FORBIDDEN"; requiredRole: string; resourceId: string }
  | { kind: "CONFLICT"; localVersion: number; serverVersion: number; serverData: unknown }
  | { kind: "NOT_FOUND"; resourceId: string; resourceType: string }
  | { kind: "RATE_LIMITED"; retryAfterMs: number }
  | { kind: "OPERATIONAL"; retryAfterMs?: number; canRetry: boolean; message: string };
```

### React 19 Action Error Modeling (`useActionState`)

With React 19 Server Actions and Form Actions, domain errors are returned directly as Action state, completely avoiding synthetic client exceptions:

```tsx
// React 19 Server/Client Action with First-Class Domain Error Modeling
type FormState = {
  status: "idle" | "success" | "validation_error" | "conflict";
  message?: string;
  errors?: Record<string, string[]>;
};

async function updateAccountAction(prevState: FormState, formData: FormData): Promise<FormState> {
  const email = formData.get("email") as string;
  
  if (!email || !email.includes("@")) {
    return {
      status: "validation_error",
      errors: { email: ["Please enter a valid work email address."] },
    };
  }

  const response = await fetch("/api/account", { method: "PUT", body: formData });
  
  if (response.status === 409) {
    return {
      status: "conflict",
      message: "Account was modified by another administrator. Please reload.",
    };
  }

  if (!response.ok) {
    return {
      status: "validation_error",
      message: "Unable to update account settings.",
    };
  }

  return { status: "success", message: "Account updated successfully!" };
}
```

---

# 10. 🔬 Deep-Dive: Specific Domain Scenarios & Patterns

### 10.1 Form Validation as Local Component State

```text
User Input ──► Zod Schema ──► Validation Errors ──► Inline Red Labels (NO Boundary Activation)
```

Validation failures represent 100% expected user interaction outcomes. Throwing inside validation schemas unmounts the form, wipes user typing, and creates catastrophic friction.

```tsx
// Production-Grade Form Validation State Pattern
export interface FormFieldState<T> {
  value: T;
  touched: boolean;
  errors: string[];
}

export function useValidatedField<T>(initialValue: T, validator: (val: T) => string[]) {
  const [value, setValue] = useState<T>(initialValue);
  const [touched, setTouched] = useState(false);

  const errors = useMemo(() => {
    return touched ? validator(value) : [];
  }, [value, touched, validator]);

  const onChange = useCallback((newVal: T) => {
    setValue(newVal);
    setTouched(true);
  }, []);

  return { value, touched, errors, isValid: errors.length === 0, onChange, onBlur: () => setTouched(true) };
}
```

---

### 10.2 Authorization Failures (HTTP 403) & Permission Matrices

```text
Fetch Resource ──► HTTP 403 ──► Feature Container State ──► <AccessRestrictedCard />
```

A user trying to access a restricted document is not an application crash. It is an intentional access state. The surrounding page (navigation header, user avatar, settings menu) must remain fully interactive.

```tsx
export interface RoleAccessPolicy {
  userRole: "VIEWER" | "EDITOR" | "ADMIN" | "COMPLIANCE";
  requiredRole: "EDITOR" | "ADMIN";
  resourceId: string;
}

export function AccessRestrictedView({ policy, onRequestRole }: {
  policy: RoleAccessPolicy;
  onRequestRole: (role: string) => void;
}) {
  return (
    <div className="p-6 rounded-2xl bg-amber-950/30 border border-amber-800/60 text-amber-200 space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🔒</span>
        <div>
          <h3 className="font-bold text-white text-base">Access Restricted</h3>
          <p className="text-xs text-amber-300 font-mono">Resource ID: {policy.resourceId}</p>
        </div>
      </div>
      <p className="text-xs text-slate-300">
        Your current role is <span className="font-mono text-white font-bold">{policy.userRole}</span>. 
        Modifying this entity requires <span className="font-mono text-amber-400 font-bold">{policy.requiredRole}</span> permissions.
      </p>
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => onRequestRole(policy.requiredRole)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition"
        >
          Request Role Elevation
        </button>
      </div>
    </div>
  );
}
```

---

### 10.3 Concurrency Conflict Resolution (HTTP 409)

When multiple users edit a collaborative document concurrently:

```text
User Submits v1 Edit ──► Server reports v2 Exists (409) ──► ConflictResolver State ──► Side-by-Side Diff Modal
```

Throwing an exception would wipe the user's unsaved local text from memory! Modeling the 409 as `{ status: "CONFLICT", localText, serverText }` enables a rich 3-way merge UI:

```tsx
export function computeThreeWayMerge(local: string, server: string, base: string): string {
  // Deterministic 3-way text merge preview
  if (local === base) return server;
  if (server === base) return local;
  return `<<<<<<< LOCAL REVISION\n${local}\n=======\n${server}\n>>>>>>> SERVER REVISION`;
}
```

---

### 10.4 Resource Not Found (HTTP 404) & Intelligent Empty States

```text
Request /docs/999 ──► Server returns 404 ──► Feature State: NOT_FOUND ──► <EmptyStateSuggestions />
```

A missing resource does not mean the React application failed. Rendering an informative empty state with suggestions (e.g. "Did you mean Document #998?") keeps the user engaged:

```tsx
export function DocumentNotFoundView({ docId, onSearchAgain }: {
  docId: string;
  onSearchAgain: () => void;
}) {
  return (
    <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
      <div className="text-4xl">📄🔍</div>
      <h3 className="font-bold text-white text-lg">Document Not Found</h3>
      <p className="text-xs text-slate-400 max-w-sm mx-auto">
        We could not find an agreement with reference ID <span className="font-mono text-blue-400 font-bold">{docId}</span>. It may have been archived or deleted.
      </p>
      <button
        onClick={onSearchAgain}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition"
      >
        Search Document Repository
      </button>
    </div>
  );
}
```

---

### 10.5 Rate Limiting (HTTP 429) & Token Bucket Countdown

```text
API returns 429 ──► Adapter reads "Retry-After" ──► State: RATE_LIMITED ──► Animated Countdown Banner
```

```tsx
export function RateLimitedBanner({ retryAfterSeconds, onExpired }: {
  retryAfterSeconds: number;
  onExpired: () => void;
}) {
  const [remaining, setRemaining] = useState(retryAfterSeconds);

  useEffect(() => {
    if (remaining <= 0) {
      onExpired();
      return;
    }
    const timer = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(timer);
  }, [remaining, onExpired]);

  return (
    <div className="p-4 rounded-xl bg-orange-950/40 border border-orange-800 text-orange-200 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="animate-spin text-lg">⏳</span>
        <span className="text-xs">API rate limit reached. Auto-resuming in <strong>{remaining}s</strong>...</span>
      </div>
      <div className="w-24 bg-orange-950 rounded-full h-2 overflow-hidden border border-orange-800">
        <div
          className="bg-orange-500 h-full transition-all duration-1000"
          style={{ width: `${(remaining / retryAfterSeconds) * 100}%` }}
        />
      </div>
    </div>
  );
}
```

---

### 10.6 Operational Network Outages & Stale-While-Revalidate Sync

When network connectivity is lost during an auto-save operation:

```text
Auto-Save Triggered ──► Network Drop ──► Save in LocalStorage Queue ──► Floating Warning Banner
```

```tsx
export function OfflineSyncStatus({ pendingCount, isOnline }: {
  pendingCount: number;
  isOnline: boolean;
}) {
  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex items-center gap-3 text-xs">
      <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-amber-400 animate-pulse" : "bg-red-500"}`} />
      <span className="text-slate-300">
        {!isOnline ? "Working Offline" : `Syncing ${pendingCount} pending changes...`}
      </span>
    </div>
  );
}
```

---

# 11. 🔬 Production Crucible Incidents & Post-Mortems

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PRODUCTION CRUCIBLE INCIDENTS                                  │
├────────────────────────────┬────────────────────────────────────┬────────────────────────────────┤
│ Incident Name              │ Core Failure Mechanism             │ Architectural Fix              │
├────────────────────────────┼────────────────────────────────────┼────────────────────────────────┤
│ 1. The Global 403 Lockout  │ Document permission 403 threw to   │ Model 403 as feature-level     │
│    Incident                │ root boundary, crashing entire app.│ `<AccessRestricted />` view.   │
├────────────────────────────┼────────────────────────────────────┼────────────────────────────────┤
│ 2. The Silent Bug Masking  │ Broad `try/catch` swallowed render │ Remove catch block; isolate    │
│    Disaster                │ TypeError; rendered blank card.    │ in Error Boundary with logging.│
├────────────────────────────┼────────────────────────────────────┼────────────────────────────────┤
│ 3. The 409 Version Override│ Concurrency conflict threw generic │ Implement side-by-side diff    │
│    Data Loss               │ error; wiped user's legal draft.   │ conflict resolution state.     │
├────────────────────────────┼────────────────────────────────────┼────────────────────────────────┤
│ 4. The Card Decline Crash  │ 402 Card Declined thrown as Error; │ Model payment outcomes as      │
│    Conversion Drop         │ prevented user from trying new card│ discriminated union state.     │
├────────────────────────────┼────────────────────────────────────┼────────────────────────────────┤
│ 5. Real Bug Hidden as      │ Developer caught complex widget    │ Use Bulkhead Boundary with     │
│    "Feature Degraded"      │ crash in `try/catch`, masked bug.  │ Sentry error reporting.        │
└────────────────────────────┴────────────────────────────────────┴────────────────────────────────┘
```

### Crucible Incident #1: The Global 403 Forbidden Lockout
* **System Context:** Multi-tenant enterprise SaaS workspace with 40,000 active corporate users.
* **The Incident:** When a junior employee opened a shared workspace containing a single restricted financial spreadsheet, the API returned HTTP 403. The frontend data fetching hook threw a generic `new Error("HTTP 403")`. Because there was no local boundary or domain handling, the error bubbled to the root `<AppBoundary>`, crashing the **entire workspace application** (navigation sidebar, chat, and other accessible documents vanished).
* **Root Cause Analysis:** Transport status HTTP 403 was treated as an unhandled component crash rather than a valid authorization domain state.
* **Code Refactoring Diff:**
```diff
- async function loadDoc(id: string) {
-   const res = await fetch(`/api/docs/${id}`);
-   if (!res.ok) throw new Error("Load failed");
-   return res.json();
- }
+ async function loadDoc(id: string): Promise<DocResult> {
+   const res = await fetch(`/api/docs/${id}`);
+   if (res.status === 403) return { status: "FORBIDDEN", id };
+   if (!res.ok) return { status: "ERROR", retryable: true };
+   return { status: "SUCCESS", data: await res.json() };
+ }
```

### Crucible Incident #2: The Silent Bug Masking Disaster
* **System Context:** E-commerce checkout flow processing $2M in transactions daily.
* **The Incident:** A developer wrapped a cart item rendering function in `try { ... } catch { return <EmptyItem />; }` to "prevent crashes". During a release, a regression in currency formatting threw `TypeError: formatCurrency is not a function`. Instead of bubbling to telemetry or triggering an alert, the entire cart silently rendered zero items. Customers assumed their carts were emptied and abandoned purchases.
* **Root Cause Analysis:** Masking a genuine programming defect as an ordinary domain state.
* **Code Refactoring Diff:**
```diff
- function CartItemList({ items }: { items: Item[] }) {
-   try {
-     return <div>{items.map(renderItem)}</div>;
-   } catch (e) {
-     return <EmptyCart />; // 💥 BUG MASKED! Telemetry never alerted.
-   }
- }
+ function CartItemList({ items }: { items: Item[] }) {
+   return (
+     <BulkheadBoundary boundaryName="CartList" fallback={(err, reset) => <CartErrorCard onReset={reset} />}>
+       <div>{items.map(renderItem)}</div>
+     </BulkheadBoundary>
+   );
+ }
```

### Crucible Incident #3: The 409 Version Override Data Loss
* **System Context:** Real-time legal contract management tool.
* **The Incident:** When two attorneys edited a clause simultaneously, the second attorney's save triggered an HTTP 409 Conflict. The frontend threw an unhandled exception, unmounting the document editor and wiping 2 hours of uncommitted draft edits from React memory.
* **Root Cause Analysis:** Concurrency conflict treated as an unrecoverable runtime exception instead of an interactive domain state.
* **Remediation:** Implemented a `stage: "CONFLICT"` discriminated union that preserves local draft memory and opens a side-by-side diff resolution screen.

### Crucible Incident #4: The Payment Decline Conversion Drop
* **System Context:** High-volume SaaS checkout flow.
* **The Incident:** The payment gateway returned `402 Payment Required` with code `CARD_DECLINED_INSUFFICIENT_FUNDS`. The client code threw `throw new Error("Payment failed")`, which triggered an unhandled boundary crash that redirected the user to `/error`. The user had no chance to provide a secondary debit card or PayPal account. Conversion dropped by 18% in 48 hours.
* **Root Cause Analysis:** Conflating an expected financial refusal with an application defect.
* **Remediation:** Modeled card declines as first-class domain state, rendering an actionable "Card Declined — Select Alternative Payment" card directly in the checkout container.

### Crucible Incident #5: Real Bug Hidden as "Feature Degraded"
* **System Context:** Real-time financial analytics dashboard with WebGL charts.
* **The Incident:** A developer caught all rendering exceptions inside a financial candlestick chart using `catch (e) { return <div>Chart unavailable</div>; }`. An upstream library update caused all chart renderings to crash for Chrome 124 users. Because no errors reached Sentry and no Error Boundary was triggered, the engineering team remained oblivious for 3 weeks while enterprise clients complained of missing market analytics.
* **Root Cause Analysis:** Swallowing runtime defects without telemetry or bulkhead containment.
* **Remediation:** Replaced silent catch blocks with a `<BulkheadBoundary>` that renders an SVG table fallback and automatically logs the stack trace to Sentry with a P1 severity tag.

---

# 12. 🛠️ Complete Production Architecture: Domain Error Framework

Here is the complete production TypeScript implementation of a resilient, multi-entity domain management application featuring:
1. **Discriminated Domain Error Modeling**
2. **HTTP Normalization Adapter (Handling 400, 403, 404, 409, 500)**
3. **Dedicated Domain Conflict Resolver**
4. **Isolated Bulkhead Error Boundaries for Unexpected Render Defects**

```tsx
import React, { useState, useCallback, Component, ErrorInfo, ReactNode } from "react";

// ---------------------------------------------------------------------------
// 1. Domain Type Contracts & Discriminated Unions
// ---------------------------------------------------------------------------
export interface LegalDocument {
  id: string;
  title: string;
  version: number;
  content: string;
}

export type DocumentLoadResult =
  | { status: "SUCCESS"; document: LegalDocument }
  | { status: "FORBIDDEN"; requiredPermission: string; documentId: string }
  | { status: "NOT_FOUND"; documentId: string }
  | { status: "CONFLICT"; localDoc: LegalDocument; serverDoc: LegalDocument }
  | { status: "RATE_LIMITED"; retryAfterSeconds: number }
  | { status: "OPERATIONAL_ERROR"; message: string; retryable: boolean };

// ---------------------------------------------------------------------------
// 2. Production Resilient Error Boundary for Unexpected Fiber Defects
// ---------------------------------------------------------------------------
interface BulkheadBoundaryProps {
  children: ReactNode;
  boundaryName: string;
  fallback: (error: Error, reset: () => void) => ReactNode;
}

interface BulkheadBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class BulkheadBoundary extends Component<BulkheadBoundaryProps, BulkheadBoundaryState> {
  public state: BulkheadBoundaryState = { hasError: false, error: null };

  public static getDerivedStateFromError(error: unknown): BulkheadBoundaryState {
    return {
      hasError: true,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[BulkheadBoundary:${this.props.boundaryName}] Intercepted unexpected Fiber crash:`, error, info.componentStack);
  }

  public reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  public render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error, this.reset);
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// 3. Presentation Views for Distinct Domain States
// ---------------------------------------------------------------------------
export function ForbiddenAccessCard({ documentId, requiredPermission, onDismiss }: {
  documentId: string;
  requiredPermission: string;
  onDismiss: () => void;
}) {
  return (
    <div className="p-6 rounded-2xl bg-amber-950/30 border border-amber-800/60 text-amber-200 space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🔒</span>
        <div>
          <h3 className="font-bold text-white text-base">Access Restricted</h3>
          <p className="text-xs text-amber-300 font-mono">Document ID: {documentId}</p>
        </div>
      </div>
      <p className="text-xs text-slate-300">
        You do not possess the <span className="font-mono text-amber-400 font-bold">{requiredPermission}</span> role required to inspect this confidential legal agreement.
      </p>
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => alert(`Access request submitted to compliance team for ${documentId}`)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition"
        >
          Request Permission Elevation
        </button>
        <button
          onClick={onDismiss}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export function ConflictResolverCard({ localDoc, serverDoc, onResolve }: {
  localDoc: LegalDocument;
  serverDoc: LegalDocument;
  onResolve: (resolvedContent: string) => void;
}) {
  return (
    <div className="p-6 rounded-2xl bg-purple-950/30 border border-purple-800/60 text-purple-200 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-3xl">⚡</span>
        <div>
          <h3 className="font-bold text-white text-base">Concurrency Conflict Detected (HTTP 409)</h3>
          <p className="text-xs text-purple-300">Another attorney committed revisions while you were drafting.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
        <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-700">
          <div className="font-bold text-amber-400 mb-1">Your Local Draft (v{localDoc.version})</div>
          <p className="text-slate-300 whitespace-pre-wrap">{localDoc.content}</p>
        </div>
        <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-700">
          <div className="font-bold text-emerald-400 mb-1">Server Active Version (v{serverDoc.version})</div>
          <p className="text-slate-300 whitespace-pre-wrap">{serverDoc.content}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onResolve(localDoc.content)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition"
        >
          Overwrite with My Draft
        </button>
        <button
          onClick={() => onResolve(serverDoc.content)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
        >
          Accept Server Version
        </button>
      </div>
    </div>
  );
}

export function LegalDocumentEditor({
  document,
  onSave,
  forceRenderCrash,
}: {
  document: LegalDocument;
  onSave: (text: string) => void;
  forceRenderCrash?: boolean;
}) {
  const [content, setContent] = useState(document.content);

  // 💥 Simulate unexpected Fiber invariant violation
  if (forceRenderCrash) {
    throw new Error("Critical Fiber Exception: Corrupted memory pointer in DocumentEditor!");
  }

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white text-lg">{document.title}</h3>
        <span className="text-xs font-mono px-2.5 py-1 bg-slate-800 text-slate-400 rounded-full border border-slate-700">
          Version {document.version}
        </span>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        className="w-full p-4 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm font-mono focus:outline-none focus:border-blue-500 transition"
      />

      <div className="flex justify-end gap-3">
        <button
          onClick={() => onSave(content)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-blue-600/30"
        >
          Commit Revisions (POST)
        </button>
      </div>
    </div>
  );
}
```

---

### 12.1 Zustand & Redux Toolkit Domain State Machine Architectures

In complex multi-screen enterprise applications, domain outcomes are frequently orchestrated through global or feature-level state machines rather than isolated component state:

```typescript
import { create } from "zustand";

// Discriminated State Union for Document Lifecycle
export type DocumentStoreState =
  | { stage: "IDLE" }
  | { stage: "FETCHING"; docId: string }
  | { stage: "READY"; doc: LegalDocument; isDirty: boolean }
  | { stage: "FORBIDDEN"; docId: string; requiredPermission: string }
  | { stage: "NOT_FOUND"; docId: string }
  | { stage: "SAVING"; doc: LegalDocument }
  | { stage: "CONFLICT"; localDoc: LegalDocument; serverDoc: LegalDocument }
  | { stage: "OPERATIONAL_ERROR"; doc: LegalDocument; reason: string; retryCount: number };

interface DocumentStoreActions {
  loadDocument: (id: string) => Promise<void>;
  updateDraft: (content: string) => void;
  commitSave: () => Promise<void>;
  resolveConflict: (chosenContent: string) => Promise<void>;
  resetToIdle: () => void;
}

export const useDocumentStore = create<DocumentStoreState & DocumentStoreActions>((set, get) => ({
  stage: "IDLE",

  loadDocument: async (docId: string) => {
    set({ stage: "FETCHING", docId });
    const result = await fetchDocumentNormalized(docId);

    switch (result.status) {
      case "LOADED":
        set({ stage: "READY", doc: result.data, isDirty: false });
        break;
      case "FORBIDDEN":
        set({ stage: "FORBIDDEN", docId, requiredPermission: result.requiredRole });
        break;
      case "NOT_FOUND":
        set({ stage: "NOT_FOUND", docId });
        break;
      case "SERVER_ERROR":
        set({
          stage: "OPERATIONAL_ERROR",
          doc: { id: docId, title: "Untitled", version: 1, content: "" },
          reason: "Server unreachable",
          retryCount: 0,
        });
        break;
    }
  },

  updateDraft: (newContent: string) => {
    const state = get();
    if (state.stage === "READY") {
      set({ stage: "READY", doc: { ...state.doc, content: newContent }, isDirty: true });
    }
  },

  commitSave: async () => {
    const state = get();
    if (state.stage !== "READY") return;

    const currentDoc = state.doc;
    set({ stage: "SAVING", doc: currentDoc });

    try {
      const res = await fetch(`/api/docs/${currentDoc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentDoc),
      });

      if (res.status === 200) {
        const updated = await res.json();
        set({ stage: "READY", doc: updated, isDirty: false });
        return;
      }

      if (res.status === 409) {
        const serverVersion = await res.json();
        set({ stage: "CONFLICT", localDoc: currentDoc, serverDoc: serverVersion });
        return;
      }

      set({ stage: "OPERATIONAL_ERROR", doc: currentDoc, reason: `HTTP ${res.status}`, retryCount: 1 });
    } catch (e) {
      set({ stage: "OPERATIONAL_ERROR", doc: currentDoc, reason: "Network dropped", retryCount: 1 });
    }
  },

  resolveConflict: async (chosenContent: string) => {
    const state = get();
    if (state.stage !== "CONFLICT") return;

    const baseServerDoc = state.serverDoc;
    const resolvedDoc: LegalDocument = {
      ...baseServerDoc,
      content: chosenContent,
      version: baseServerDoc.version + 1,
    };

    set({ stage: "SAVING", doc: resolvedDoc });
    // Re-attempt commit with incremented server version
    await fetch(`/api/docs/${resolvedDoc.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resolvedDoc),
    });
    set({ stage: "READY", doc: resolvedDoc, isDirty: false });
  },

  resetToIdle: () => set({ stage: "IDLE" }),
}));
```

---

### 12.2 TanStack Query v5 `throwOnError` Fine-Grained Filtering

When using TanStack Query (React Query) v5, developers frequently wonder whether query errors should throw to Error Boundaries or be captured in `query.error`. The senior architectural pattern uses a **predicate function** on `throwOnError`:

```typescript
import { useQuery } from "@tanstack/react-query";

interface ApiError extends Error {
  statusCode?: number;
  isFatal?: boolean;
}

export function useLegalDocumentQuery(docId: string) {
  return useQuery({
    queryKey: ["legal-document", docId],
    queryFn: () => fetchDocumentNormalized(docId),
    
    // 🎯 SENIOR PATTERN: Predicate Filter for throwOnError
    // Only throw to Error Boundary if it is a genuine FATAL invariant violation.
    // Expected domain status (400, 401, 403, 404, 409) and operational timeouts return as data!
    throwOnError: (error: ApiError) => {
      // If error is a JavaScript TypeError or marked fatal, throw to nearest <ErrorBoundary> bulkhead!
      if (error instanceof TypeError || error.isFatal) {
        return true;
      }
      // If HTTP status is known domain outcome, do NOT throw to Error Boundary!
      if (error.statusCode && [400, 401, 403, 404, 409, 422].includes(error.statusCode)) {
        return false;
      }
      // Operational 5xx errors remain in query state for retry logic!
      return false;
    },
    
    retry: (failureCount, error: ApiError) => {
      // Never retry 4xx client/domain errors
      if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        return false;
      }
      // Retry transient 5xx server drops up to 3 times
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
```

---

# 13. 💬 Staff-Level Interview Questions & Deep Dives

### Q1. What is the fundamental difference between an expected domain error and an unexpected UI exception?
**Staff Answer:**  
An expected domain error represents a recognized, predictable business outcome defined by the product specifications (e.g. Card Declined, 403 Forbidden, 409 Version Conflict, Form Validation). These outcomes are modeled as first-class domain data (usually TypeScript discriminated unions) and rendered as contextual, actionable UI cards without unmounting the parent application. An unexpected UI exception represents a software defect, null pointer dereference, or violated runtime invariant. These cannot be handled by feature logic and must be intercepted by React `<ErrorBoundary>` bulkheads to isolate the blast radius, present a fallback card, and dispatch Sentry telemetry.

### Q2. Why is equating HTTP 403 or 409 with an Error Boundary throw considered an anti-pattern?
**Staff Answer:**  
HTTP status codes represent transport layer metadata, not React component tree failures. A 403 Forbidden status indicates the user is authenticated but lacks permissions for a specific entity. Throwing a JavaScript exception causes React to unmount the entire component subtree and trigger a generic crash screen, destroying sibling components like navigation headers, sidebars, and chat panels. Instead, the API adapter should normalize 403 into `{ status: "FORBIDDEN" }`, allowing the component to render an inline `<AccessRestricted />` badge while keeping the surrounding workspace fully responsive.

### Q3. How does discriminated union state modeling prevent the "Boolean Explosion" bug in React?
**Staff Answer:**  
When developers model UI state using independent booleans (`isLoading`, `isError`, `isForbidden`, `isConflict`), an application with $N$ booleans creates $2^N$ potential state combinations. Many of these combinations are invalid or contradictory (e.g. `isLoading: true` AND `isError: true` AND `isSaved: true`). This leads to UI race conditions where multiple conflicting views render simultaneously. A discriminated union (e.g. `{ stage: "LOADING" } | { stage: "FORBIDDEN" } | { stage: "READY" }`) ensures that exactly one valid state exists at any single instant, enforced by TypeScript compile-time exhaustiveness checking.

### Q4. What is the danger of using `try/catch` inside React render methods to return fallback components?
**Staff Answer:**  
Using broad `try/catch` inside render functions to return fallback JSX silently swallows genuine programming bugs and React Fiber warnings. It prevents React's reconciliation engine from properly managing subtree lifecycles and hides defects from automated telemetry and error tracking tools like Sentry. If a regression occurs (e.g. a broken hook or undefined utility), users see degraded UI while engineering dashboards show 0 errors. Real programming defects must bubble to `<ErrorBoundary>` bulkheads where logging and telemetry are guaranteed.

### Q5. How should transient operational network failures (HTTP 504, offline) be modeled vs fatal crashes?
**Staff Answer:**  
Transient network drops should be managed by asynchronous query state machines (e.g. TanStack Query or custom state machines) using states like `status: "stale_error"` or `status: "revalidating"`. When a 504 timeout occurs, the UI should continue displaying cached stale data while displaying a non-blocking floating warning banner ("Offline. Retrying in 5s..."). Fatal Error Boundaries should only be triggered if internal component invariant checks fail completely.

### Q6. Why should domain machine logic never branch on `error.message` strings?
**Staff Answer:**  
Error messages are human-oriented, mutable presentation strings. They change across backend releases and vary depending on internationalization/localization (e.g. German vs English). Branching machine logic on strings like `if (err.message.includes("declined"))` creates brittle code that breaks unexpectedly in production. Senior architectures always branch on stable numeric status codes or structured string literals (`code: "CARD_EXPIRED"`).

### Q7. What is the difference between "Expected" and "Recoverable" along architectural axes?
**Staff Answer:**  
"Expected" defines whether the product domain model anticipates the condition as part of standard business operations. "Recoverable" defines whether an action exists for the user or system to resolve the failure. For example:
- Form Validation Error: **Expected + Recoverable** (User corrects typing).
- Isolated WebGL Shader Crash: **Unexpected + Recoverable** (Bulkhead catches crash, user clicks Reset to fallback SVG).
- Major Payment Gateway Outage: **Expected + Unrecoverable** (Feature displays downtime banner; user cannot fix gateway).

### Q8. How do React 19 Server Actions alter domain error modeling?
**Staff Answer:**  
In React 19, Server Actions using `useActionState` treat form errors as regular return state rather than thrown promise rejections. Actions return `{ ok: false, error: "EMAIL_TAKEN", fields: { ... } }`, allowing React to perform progressive enhancement and atomic state updates without triggering unhandled rejection listeners or Error Boundaries.

### Q9. Why should business recovery logic live outside Error Boundaries?
**Staff Answer:**  
An Error Boundary is an infrastructure bulkhead designed to catch unexpected virtual DOM crashes and unmount broken subtrees. Putting complex business logic (e.g. switching credit cards or merging document versions) inside an Error Boundary couples React UI infrastructure with core business domain rules. Domain recovery belongs in dedicated feature state hooks and domain components.

### Q10. How should telemetry distinguish between expected domain outcomes and unexpected Fiber crashes?
**Staff Answer:**  
Expected outcomes (card declines, 403s, form validation) should be emitted to business analytics and product telemetry pipelines (e.g. Amplitude, Segment, Mixpanel) as user behavior events. Unexpected Fiber exceptions, unhandled rejections, and runtime invariants should be routed to engineering observability platforms (e.g. Sentry, Datadog, OpenTelemetry) with component stacks, release hashes, and correlation IDs.

---

# 14. 📋 50-Point Master Checklist & Production Audit

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             50-POINT SENIOR RESILIENCE AUDIT CHECKLIST                           │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Section 1: Failure Classification & Taxonomy (Items 01–10)                                       │
│ Section 2: Domain Error Modeling & TypeScript Contracts (Items 11–20)                            │
│ Section 3: Error Boundary Bulkheads & Blast Radius (Items 21–30)                                 │
│ Section 4: Telemetry, Observability & Metrics (Items 31–40)                                      │
│ Section 5: Enterprise Architecture & Production Readiness (Items 41–50)                          │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Section 1: Failure Classification & Taxonomy

* **[ ] 01. Distinguish Expected Domain Outcomes from Unexpected Programming Crashes:**  
  *Audit Standard:* Verify no form validation or business rule failures throw exceptions into Error Boundaries.  
  *Verification:* Search codebase for `throw new Error` inside form submit handlers and validation schemas.

* **[ ] 02. Distinguish Operational Resource Gaps from Component Tree Failures:**  
  *Audit Standard:* Ensure HTTP 504 timeouts and offline states render non-blocking warning banners rather than unmounting the screen.  
  *Verification:* Simulate 10-second gateway timeout; assert parent dashboard navigation remains responsive.

* **[ ] 03. Decouple HTTP Status Codes from Error Boundary Catches:**  
  *Audit Standard:* Confirm HTTP 400, 401, 403, 404, 409, 422, and 429 are handled in feature state.  
  *Verification:* Assert no `if (!res.ok) throw` statements exist in API transport adapters without normalization.

* **[ ] 04. Model Form Validation as Local Component State:**  
  *Audit Standard:* Ensure field errors appear inline next to input elements without re-rendering parent trees.  
  *Verification:* Type invalid email; verify error message renders in `<span role="alert">` with red styling.

* **[ ] 05. Model Authorization 403 as Inline Permission View:**  
  *Audit Standard:* Verify `<AccessRestrictedCard />` keeps surrounding dashboard layout mounted.  
  *Verification:* Fetch document with missing role; assert navbar, sidebar, and breadcrumbs remain visible.

* **[ ] 06. Model Concurrency Conflict 409 as Interactive Diff Resolver:**  
  *Audit Standard:* Confirm local draft edits are preserved in memory when a 409 response is received.  
  *Verification:* Mock 409 on save; assert user's uncommitted text is displayed in side-by-side diff UI.

* **[ ] 07. Model Resource Not Found 404 as Clean Empty State:**  
  *Audit Standard:* Verify missing document IDs render a clean "Document Not Found" view rather than a crash card.  
  *Verification:* Navigate to invalid `/docs/missing-id`; assert friendly empty state with search box renders.

* **[ ] 08. Model Payment Decline as Actionable Mutation State:**  
  *Audit Standard:* Confirm card declines allow immediate retry or payment method switching.  
  *Verification:* Mock 402 Card Declined; assert checkout modal stays open with secondary card inputs.

* **[ ] 09. Route Genuine Invariant Violations to Nearest Bulkhead:**  
  *Audit Standard:* Ensure `TypeError` and null pointer dereferences bubble to isolated Error Boundaries.  
  *Verification:* Inject synthetic null reference; assert local error card renders while sibling widgets function.

* **[ ] 10. Audit Third-Party Widget Failure Containment:**  
  *Audit Standard:* Verify third-party charts, maps, and rich-text editors are wrapped in dedicated boundaries.  
  *Verification:* Crash WebGL canvas; assert surrounding dashboard displays fallback SVG table view.

---

### Section 2: Domain Error Modeling & TypeScript Contracts

* **[ ] 11. Eliminate Boolean Flag Explosions:**  
  *Audit Standard:* Replace multiple boolean flags (`isLoading`, `isError`, `isForbidden`) with a single discriminated union.  
  *Verification:* Audit state interfaces; confirm zero types have >2 concurrent boolean status flags.

* **[ ] 12. Enforce Compile-Time Exhaustive Pattern Matching:**  
  *Audit Standard:* Use `never` type assertions in `switch/case` statements handling domain outcomes.  
  *Verification:* Add `default: const _ex: never = outcome;` to all domain state switch blocks.

* **[ ] 13. Ban String Inspection in Machine Decision Logic:**  
  *Audit Standard:* Prohibit `error.message.includes()` in favor of structured `code` or `status` enums.  
  *Verification:* Grep for `.includes("` in error handling blocks; replace with strict equality on enum codes.

* **[ ] 14. Structure Error Objects with Contextual Metadata:**  
  *Audit Standard:* Include `resourceId`, `requiredRole`, `version`, and `retryable` in error payloads.  
  *Verification:* Assert all domain error interfaces extend typed metadata envelopes.

* **[ ] 15. Standardize Algebraic `Result<T, E>` Type Across API Clients:**  
  *Audit Standard:* Verify all data layer utilities return `{ ok: true, value } | { ok: false, error }`.  
  *Verification:* Check return types of shared API client functions.

* **[ ] 16. Normalize API Transport Errors at Boundary Layer:**  
  *Audit Standard:* Ensure HTTP response envelopes are converted to domain types before reaching React components.  
  *Verification:* Verify API adapter tests cover 200, 400, 401, 403, 404, 409, and 500 status codes.

* **[ ] 17. Implement React 19 `useActionState` Domain Returns:**  
  *Audit Standard:* Ensure Server Actions return typed validation states instead of throwing exceptions.  
  *Verification:* Review action signatures; assert return type is `Promise<FormActionState>`.

* **[ ] 18. Preserve Local User Drafts During Mutation Rejections:**  
  *Audit Standard:* Verify form inputs are never cleared when a save request fails.  
  *Verification:* Trigger save error; verify textarea content remains identical to user's typed text.

* **[ ] 19. Separate User-Facing Messages from Machine Error Codes:**  
  *Audit Standard:* Store machine codes in state; resolve human strings via localization dictionaries.  
  *Verification:* Ensure UI displays strings from `i18n.t(error.code)` rather than raw backend strings.

* **[ ] 20. Implement Exponential Backoff for Retryable Operations:**  
  *Audit Standard:* Apply jittered backoff ($2^N \times 1000\text{ms}$) on operational retry mechanisms.  
  *Verification:* Inspect retry loop timing in network console; assert intervals follow exponential curve.

---

### Section 3: Error Boundary Bulkheads & Blast Radius

* **[ ] 21. Strategically Position Bulkhead Boundaries:**  
  *Audit Standard:* Place Error Boundaries around isolated widgets, panels, and route outlets.  
  *Verification:* Inspect component tree; verify boundaries wrap independent feature pods.

* **[ ] 22. Implement Resilient Local Fallback Cards:**  
  *Audit Standard:* Provide contextual "Retry Widget" buttons in boundary fallbacks.  
  *Verification:* Assert fallback cards include localized reset actions.

* **[ ] 23. Bind Reset Keys to Entity IDs:**  
  *Audit Standard:* Pass `resetKeys={[docId]}` to automatically clear boundary errors upon navigation.  
  *Verification:* Navigate to new document ID; assert boundary automatically resets without manual reload.

* **[ ] 24. Ensure Bulkhead Failures Do Not Unmount Sibling Components:**  
  *Audit Standard:* Verify a crash in the sidebar does not unmount the main content canvas.  
  *Verification:* Throw error in sidebar; assert main editor and chat drawer remain interactable.

* **[ ] 25. Prevent Infinite Crash Loops During Reset:**  
  *Audit Standard:* Cleanse corrupted local storage or state before invoking boundary reset callbacks.  
  *Verification:* Trigger boundary reset; assert error state is cleared before child remounts.

* **[ ] 26. Avoid Business Logic Inside Error Boundary Fallbacks:**  
  *Audit Standard:* Keep boundary fallback components focused strictly on crash containment and reset.  
  *Verification:* Verify fallback components contain zero payment or document mutation calls.

* **[ ] 27. Maintain Root Emergency Recovery Boundary:**  
  *Audit Standard:* Provide a zero-dependency root fallback for catastrophic full-tree crashes.  
  *Verification:* Throw error in root provider; assert global "Reload Workspace" screen renders cleanly.

* **[ ] 28. Keep `getDerivedStateFromError` Pure and Synchronous:**  
  *Audit Standard:* Avoid side effects and async calls inside `getDerivedStateFromError`.  
  *Verification:* Assert `getDerivedStateFromError` returns only state objects.

* **[ ] 29. Guard Against Telemetry Client Exceptions:**  
  *Audit Standard:* Wrap all telemetry dispatches in defensive `try/catch` blocks.  
  *Verification:* Mock Sentry failure; assert Error Boundary does not crash while logging.

* **[ ] 30. Test Error Boundary Mounting with React Testing Library:**  
  *Audit Standard:* Write RTL tests verifying fallback rendering when synthetic errors are thrown.  
  *Verification:* Execute test suite; verify boundary catch assertions pass.

---

### Section 4: Telemetry, Observability & Metrics

* **[ ] 31. Log Expected Failures as Business Metrics:**  
  *Audit Standard:* Record payment declines and validation failures in analytics pipelines.  
  *Verification:* Check Segment/Amplitude events for `checkout_payment_declined` triggers.

* **[ ] 32. Log Unexpected Exceptions in Sentry / Datadog:**  
  *Audit Standard:* Transmit Fiber crashes and stack traces to observability platforms.  
  *Verification:* Assert `Sentry.captureException` is invoked in `componentDidCatch`.

* **[ ] 33. Attach Release Versions to Telemetry Events:**  
  *Audit Standard:* Include git commit hashes and semantic tags on all crash payloads.  
  *Verification:* Inspect Sentry event metadata; verify `release: "v2.14.0-abc1234"`.

* **[ ] 34. Attach React Component Stacks to Fiber Crashes:**  
  *Audit Standard:* Extract and sanitize `info.componentStack` for virtual DOM path debugging.  
  *Verification:* Check Sentry issue details; verify component stack breadcrumb is present.

* **[ ] 35. Attach Distributed Correlation IDs:**  
  *Audit Standard:* Send `traceId`, `operationId`, and `errorId` with all telemetry events.  
  *Verification:* Verify fallback card displays `Ref: err_9b8f2a1c` matching Sentry log.

* **[ ] 36. Scrub PII and Auth Credentials Before Transmission:**  
  *Audit Standard:* Mask credit cards, passwords, and tokens via AST sanitizers.  
  *Verification:* Verify telemetry payloads contain zero raw card numbers or bearer tokens.

* **[ ] 37. Calculate Resilience Recovery Ratio (RRR):**  
  *Audit Standard:* Monitor the ratio of successful UI recoveries in engineering dashboards.  
  *Verification:* Track `reset_success_count / error_boundary_mount_count` in Grafana.

* **[ ] 38. Track Error Budget Burn Rates Across Deployments:**  
  *Audit Standard:* Alert on-call teams when unhandled crash rates exceed SLO thresholds.  
  *Verification:* Verify Datadog alert triggers if crash rate exceeds 0.05% of page views.

* **[ ] 39. Display User-Readable Incident Reference Codes:**  
  *Audit Standard:* Show support correlation codes on technical fallback cards.  
  *Verification:* Assert fallback card includes a "Copy Diagnostic UUID" button.

* **[ ] 40. Rate-Limit Client Telemetry Dispatches:**  
  *Audit Standard:* Throttle error emissions to prevent client self-DDoS storms during render loops.  
  *Verification:* Trigger 100 rapid errors; assert telemetry client batches or caps at 10 requests/sec.

---

### Section 5: Enterprise Architecture & Production Readiness

* **[ ] 41. Design 4-Tier Normalization Pipelines in API Clients:**  
  *Audit Standard:* Enforce Transport ──► Adapter ──► State ──► UI layering.  
  *Verification:* Audit folder structure; confirm presence of `/adapters` directory between API and hooks.

* **[ ] 42. Maintain Zero Unhandled Exceptions on Normal User Flows:**  
  *Audit Standard:* Verify standard login, checkout, and form submissions generate zero console errors.  
  *Verification:* Run end-to-end Cypress/Playwright tests; assert zero `window.onerror` calls.

* **[ ] 43. Unit Test Discriminated Union Pattern Matching:**  
  *Audit Standard:* Test all switch branches for domain outcome components.  
  *Verification:* Run Vitest coverage report; verify 100% branch coverage on domain status switches.

* **[ ] 44. Unit Test Concurrency Conflict Resolution Workflows:**  
  *Audit Standard:* Verify local vs remote merge behaviors in document editors.  
  *Verification:* Execute test asserting both local and server texts render during 409 conflict.

* **[ ] 45. Unit Test Authorization Denial Visual States:**  
  *Audit Standard:* Assert `<AccessRestricted />` renders without Error Boundary activation.  
  *Verification:* Run RTL test asserting boundary fallback is NOT mounted on 403 response.

* **[ ] 46. Ensure Offline Mode Non-Blocking Warning Banners:**  
  *Audit Standard:* Display non-modal status banners when internet connectivity is lost.  
  *Verification:* Toggle browser offline mode; verify non-blocking banner appears.

* **[ ] 47. Support Automated Canary Rollbacks on Error Rate Deltas:**  
  *Audit Standard:* Configure CI/CD pipelines to abort releases if crash rates spike.  
  *Verification:* Verify deployment pipeline checks Sentry error delta before promoting to 100%.

* **[ ] 48. Document Disaster Recovery Runbooks for Support Teams:**  
  *Audit Standard:* Provide runbooks explaining incident reference codes to customer support.  
  *Verification:* Confirm internal knowledge base contains lookup guide for error reference UUIDs.

* **[ ] 49. Conduct Failure Modes & Effects Analysis (FMEA) on Features:**  
  *Audit Standard:* Audit all third-party dependencies for failure containment.  
  *Verification:* Review RFC document; verify failure mode table exists for all new integrations.

* **[ ] 50. Defend Domain Modeling vs Exception Tradeoffs in Reviews:**  
  *Audit Standard:* Articulate the difference between expected data and runtime defects to staff leadership.  
  *Verification:* Successfully complete the graduation gate interview defense.

---

# 15. 🧪 Automated Testing Suite: React Testing Library & Vitest

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  BulkheadBoundary,
  ForbiddenAccessCard,
  ConflictResolverCard,
  LegalDocumentEditor,
} from "./07-expected-vs-unexpected-errors-domain-modeling";

describe("KPI 16 Part 07: Domain Error Modeling & Error Boundary Test Suite", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("1. Renders ForbiddenAccessCard as domain state without Error Boundary catch", () => {
    render(
      <BulkheadBoundary boundaryName="TestBulkhead" fallback={() => <h1>Boundary Crashed</h1>}>
        <ForbiddenAccessCard
          documentId="DOC_104"
          requiredPermission="ADMIN_WRITE"
          onDismiss={vi.fn()}
        />
      </BulkheadBoundary>
    );

    // Verify domain view is rendered cleanly!
    expect(screen.getByText("Access Restricted")).toBeInTheDocument();
    expect(screen.getByText("ADMIN_WRITE")).toBeInTheDocument();
    expect(screen.queryByText("Boundary Crashed")).not.toBeInTheDocument();
  });

  it("2. Handles Concurrency Conflict (409) resolution without throwing exceptions", () => {
    const handleResolve = vi.fn();
    const localDoc = { id: "DOC_1", title: "Contract", version: 1, content: "Local Edit" };
    const serverDoc = { id: "DOC_1", title: "Contract", version: 2, content: "Server Edit" };

    render(
      <ConflictResolverCard
        localDoc={localDoc}
        serverDoc={serverDoc}
        onResolve={handleResolve}
      />
    );

    expect(screen.getByText("Concurrency Conflict Detected (HTTP 409)")).toBeInTheDocument();
    
    // User selects local draft resolution
    fireEvent.click(screen.getByText("Overwrite with My Draft"));
    expect(handleResolve).toHaveBeenCalledWith("Local Edit");
  });

  it("3. Catches genuine unexpected Fiber crashes via BulkheadBoundary", () => {
    const doc = { id: "DOC_1", title: "Contract", version: 1, content: "Draft" };

    render(
      <BulkheadBoundary
        boundaryName="EditorBulkhead"
        fallback={(error, reset) => (
          <div>
            <h1>Bulkhead Intercepted Defect</h1>
            <p>{error.message}</p>
            <button onClick={reset}>Reset</button>
          </div>
        )}
      >
        <LegalDocumentEditor document={doc} onSave={vi.fn()} forceRenderCrash={true} />
      </BulkheadBoundary>
    );

    expect(screen.getByText("Bulkhead Intercepted Defect")).toBeInTheDocument();
    expect(screen.getByText(/Critical Fiber Exception/)).toBeInTheDocument();
  });

  it("4. Allows user to accept server revisions during concurrency conflict", () => {
    const handleResolve = vi.fn();
    const localDoc = { id: "DOC_1", title: "Contract", version: 1, content: "Local Draft" };
    const serverDoc = { id: "DOC_1", title: "Contract", version: 2, content: "Server Master Revisions" };

    render(
      <ConflictResolverCard
        localDoc={localDoc}
        serverDoc={serverDoc}
        onResolve={handleResolve}
      />
    );

    fireEvent.click(screen.getByText("Accept Server Version"));
    expect(handleResolve).toHaveBeenCalledWith("Server Master Revisions");
  });

  it("5. Verifies boundary reset callback restores normal rendering", () => {
    let shouldCrash = true;
    const doc = { id: "DOC_1", title: "Contract", version: 1, content: "Draft" };

    const { rerender } = render(
      <BulkheadBoundary
        boundaryName="ResetTest"
        fallback={(error, reset) => (
          <div>
            <h1>Crashed</h1>
            <button onClick={() => { shouldCrash = false; reset(); }}>Recover</button>
          </div>
        )}
      >
        <LegalDocumentEditor document={doc} onSave={vi.fn()} forceRenderCrash={shouldCrash} />
      </BulkheadBoundary>
    );

    expect(screen.getByText("Crashed")).toBeInTheDocument();
    
    // Click recover
    fireEvent.click(screen.getByText("Recover"));
    
    rerender(
      <BulkheadBoundary
        boundaryName="ResetTest"
        fallback={() => <h1>Crashed</h1>}
      >
        <LegalDocumentEditor document={doc} onSave={vi.fn()} forceRenderCrash={false} />
      </BulkheadBoundary>
    );

    expect(screen.getByText("Contract")).toBeInTheDocument();
  });
});
```

---

# 16. 🏁 Graduation Gate: Multi-Tier Failure Architecture Review

To achieve senior staff certification for **KPI 16 Part 07**, you must analyze and defend this comprehensive multi-tier application architecture:

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Enterprise Cloud Workspace Architecture]                                                        │
├───────────────────────┬──────────────────────────────────────────────────────────────────────────┤
│ [Failure Trigger]     │ [Required Architectural Handling]                                        │
│ 1. Invalid Form Input │ Handled in local form hook state; inline red labels; NO boundary catch. │
│ 2. 403 Forbidden      │ Handled in feature container state; renders <AccessDenied />; NO crash.  │
│ 3. 409 Conflict       │ Handled in domain state; renders side-by-side diff conflict resolver.    │
│ 4. 504 Timeout        │ Handled in async query state; non-blocking retry warning banner.         │
│ 5. Render NullPointer │ Caught by local Bulkhead Error Boundary; isolated fallback + Sentry log. │
└───────────────────────┴──────────────────────────────────────────────────────────────────────────┘
```

### Architectural Defense Requirements:
1. **Explain the Semantic Failure:** Why does routing failures #1 through #4 through an Error Boundary degrade product usability?
2. **Explain the Isolation Invariant:** Why must failure #5 be caught by an Error Boundary rather than returning a silent `null` in a `try/catch` block?
3. **TypeScript Modeling Proof:** Provide the exact discriminated union type signature that models all 5 scenarios with compile-time exhaustiveness.

---

# 17. 🧭 Final Senior Mental Model & Synthesis

```text
                               THE UNIFIED FAILURE TAXONOMY
                                             │
                                     FAILURE OCCURS
                                             │
                                             ▼
                                   SEMANTIC CLASSIFICATION
                                             │
                       ┌─────────────────────┼─────────────────────┐
                       ▼                     ▼                     ▼
               EXPECTED DOMAIN          OPERATIONAL           UNEXPECTED
                   OUTCOME                OUTAGE              FIBER CRASH
               (Card Declined,        (504 Timeout,         (NullPointer,
               403, 409, Invalid)       Offline)            Syntax Defect)
                       │                     │                     │
                       ▼                     ▼                     ▼
               DISCRIMINATED            ASYNC QUERY          REACT BULKHEAD
                UNION STATE            STATE MACHINE         ERROR BOUNDARY
                       │                     │                     │
                       ▼                     ▼                     ▼
               ACTIONABLE UI         NON-BLOCKING          ISOLATED ERROR
               (Diff Resolver,      REVALIDATION           CARD + SENTRY
                Request Role)          BANNER                TELEMETRY
```

> **The Governing Staff Axiom:**  
> *Do not choose the error-handling mechanism before understanding the failure's meaning. Expected business outcomes become explicit data. Operational resource gaps become async state machines. Unexpected programming bugs become isolated Error Boundary bulkheads.*

$$\text{Expected} \implies \text{Domain Data} \quad \Big\vert \quad \text{Operational} \implies \text{Async Lifecycle} \quad \Big\vert \quad \text{Unexpected} \implies \text{Bulkhead Containment}$$

---

[⬅️ Previous Part](./06-error-telemetry-correlation-observability.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](./examples/07-expected-vs-unexpected-errors-domain-modeling.html) | [Next KPI ➡️](../../17-Accessibility-React/README.md)
