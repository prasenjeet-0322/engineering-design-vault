# KPI 11 — Part 05: Async State, Race Conditions & Reliable Frontend Workflows

[⬅️ Part 04: Callback Queues, Task Scheduling & Execution Order](./04-callback-queues-task-readiness-execution.md) | [📚 KPI 11 Index](./README.md) | [KPI 12 — Promises & Concurrency ➡️](../12-Promises-Concurrency/README.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Concurrency / State Concept | Architectural Definition | Core Hazard Prevented | Senior Production Standard |
|---|---|---|---|
| **Tagged Union Async State** | Modeling state as `{ status: 'idle' \| 'loading' \| 'success' \| 'error' }`. | 🔴 **Impossible States** (`isLoading: true && isError: true`). | 🟢 Use single discriminated union rather than multiple disconnected booleans. |
| **Start $\ne$ Completion Order** | Network request A starting before B does not guarantee A finishes before B. | **Out-of-Order Race Overwrites** (stale data overwriting fresh data). | 🔴 Never assume FIFO network arrivals; always enforce request sequencing. |
| **Sequence ID Tagging** | Tagging requests with monotonic counter `requestId = ++latestId`. | Stale response UI corruption in autocomplete and live filters. | 🟢 Check `if (reqId === latestId)` before applying responses to UI state. |
| **`AbortController`** | Browser standard for aborting in-flight HTTP requests and event listeners. | Wasted bandwidth, backend load, unmounted component updates. | 🟢 Abort previous in-flight requests when a new user query begins. |
| **Cancellation vs Ignoring** | **Cancellation** attempts to stop I/O; **Ignoring** discards the payload on arrival. | Relying solely on cancellation when network abort arrives too late. | 🟢 Combine `AbortController` with Sequence ID validation for 100% reliability. |
| **Async Time Gaps** | Shared variables mutating during the pause between `fetch()` and response. | Data cross-contamination between different user accounts. | 🔴 Snapshot local variables before `await`; never rely on global mutable state. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: The Impossible State Bug & Shared Mutable Time Gaps
> 
> #### Gotcha A: The Multiple Boolean "Impossible State" Trap
> *"Why did our checkout page render both the error banner AND the success screen simultaneously?"*  
> ```js
> // ❌ BROKEN MULTIPLE BOOLEAN STATE:
> const [isLoading, setIsLoading] = useState(false);
> const [isError, setIsError] = useState(false);
> const [isSuccess, setIsSuccess] = useState(false);
> // 💥 If an error occurs on retry after a success, both isError and isSuccess can be true!
> ```
> **Deep Architectural Explanation:**  
> Using $N$ independent booleans creates $2^N$ possible states. For 3 booleans, there are $8$ state permutations, $4$ of which are mathematically invalid impossible states (e.g. `isLoading: true && isSuccess: true`).  
> **The Senior Standard (Discriminated Tagged Union):**  
> ```ts
> // ✅ EXPLICIT STATE MACHINE (Impossible States Made Impossible):
> type AsyncState<T> =
>   | { status: 'IDLE' }
>   | { status: 'LOADING' }
>   | { status: 'SUCCESS'; data: T }
>   | { status: 'ERROR'; error: Error };
> ```
> 
> ---
> 
> #### Gotcha B: The Shared Mutable State in Async Time Gaps
> *"Why did User A's private banking transactions show up on User B's dashboard after fast profile switching?"*  
> ```js
> // ❌ SHARED MUTABLE STATE CORRUPTION:
> let activeUserId = "User-A";
> async function loadTransactions() {
>   // 💥 Time Gap occurs here!
>   const res = await fetch(`/api/users/${activeUserId}/tx`);
>   const data = await res.json();
>   // While awaiting, user switched to "User-B" (activeUserId = "User-B")!
>   // But data belongs to User-A! It gets saved into User-B's state!
>   renderDashboard(activeUserId, data); 
> }
> ```
> **Deep Architectural Explanation:**  
> Asynchronous operations create a **temporal gap**. Any shared, mutable variable referenced across an `await` boundary can mutate while the operation is pending on the network.  
> **The Senior Standard:** Capture local parameter snapshots (`const targetUser = userId`) or pass immutable state tokens.

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / TypeScript Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | TanStack Query (React Query) query keys, `AbortController` in `useEffect`, search debouncing | Essential for building production web applications that stay consistent across high-frequency user interactions. |
| 🟡 **Moderate** | Used in ~45% of code | Optimistic UI mutations with rollback cache, request deduplication, optimistic locking | Critical for real-time collaborative editors (Figma/Google Docs), chat messaging, and e-commerce carts. |
| 🔵 **Foundational / Engine** | Runtime internals | Asynchronous boundary memory retention, V8 lexical closure snapshotting, Idempotency keys | Essential for distributed frontend system design, micro-frontends, and Staff/Principal architecture reviews. |

---

## Core Concepts (20 Subtopics)

### Part 1 — Async State Modeling: Beyond Boolean Flags `🟢 [Daily Driver]`

Asynchronous operations are not binary (Done / Not Done). They possess distinct temporal phases that must be represented with state architectures that prevent invalid UI configurations.

---

### Part 2 — The 4 Canonical UI States `🟢 [Daily Driver]`

1. **`IDLE`:** Initial un-triggered state (prompting user action).
2. **`LOADING`:** Request in-flight (displaying skeleton/spinner, disabling submit).
3. **`SUCCESS`:** Data available and validated (rendering data views).
4. **`ERROR`:** Operation failed (displaying actionable error recovery/retry).

---

### Part 3 — Eliminating Impossible States via Tagged Unions `🟢 [Daily Driver]`

In TypeScript, use Discriminated Unions to guarantee that data only exists in `SUCCESS` and errors only exist in `ERROR`:
```ts
type RequestState<T> =
  | { status: 'idle'; data: null; error: null }
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: T; error: null }
  | { status: 'error'; data: null; error: Error };
```

---

### Part 4 — Async Operations as Finite State Machines (FSM) `🟢 [Daily Driver]`

$$\text{IDLE} \xrightarrow{\text{FETCH}} \text{LOADING} \xrightarrow{\text{RESOLVE}} \text{SUCCESS}$$
$$\text{LOADING} \xrightarrow{\text{REJECT}} \text{ERROR} \xrightarrow{\text{RETRY}} \text{LOADING}$$
Illegal jumps (e.g. `IDLE \to SUCCESS` without loading) are rejected by the state machine.

---

### Part 5 — The Timeline Problem: Race Conditions Dissected `🔴 [Production-Critical]`

A race condition occurs when the correctness of application state depends on the non-deterministic arrival order of overlapping network responses.

---

### Part 6 — Start Order $\ne$ Completion Order `🔴 [Production-Critical]`

$$\text{Request 1 (Query: "re", Latency: 400ms)} \longrightarrow \text{Finishes at } T=400\text{ms}$$
$$\text{Request 2 (Query: "react", Latency: 50ms)} \longrightarrow \text{Finishes at } T=150\text{ms}$$
Request 2 finishes first. If Request 1 is applied at 400ms, the UI displays outdated "re" results!

---

### Part 7 — Out-of-Order Response Hazards in Live Search `🔴 [Production-Critical]`

Without race condition protection, typing fast in search fields causes older responses to overwrite newer search results, confusing users.

---

### Part 8 — Stale Results: Data Validity vs. UI Relevance `🟢 [Daily Driver]`

- **Data Validity:** The backend correctly returned the exact data requested for query "re".
- **UI Relevance:** The user is now looking at query "react". The data is valid on the server, but **stale** on the client.

---

### Part 9 — Strategy 1: Operation Identity Sequencing (`requestId`) `🟢 [Daily Driver]`

Maintain a monotonic sequence counter. Compare the request's sequence ID upon arrival against the active counter:
```js
let latestSequenceId = 0;

async function executeSearch(query) {
  const seqId = ++latestSequenceId;
  const data = await api.search(query);
  if (seqId === latestSequenceId) {
    setResults(data); // 🟢 Safe: This is the latest request!
  }
}
```

---

### Part 10 — Cancellation vs. Ignoring Stale Results `🟢 [Daily Driver]`

- **Ignoring:** Discards the response payload when it arrives (protects UI state, but wastes bandwidth).
- **Cancellation:** Aborts the HTTP socket on the wire via `AbortController` (saves bandwidth and server compute).

---

### Part 11 — `AbortController` Mechanics & Signal Propagation `🟢 [Daily Driver]`

`AbortController` creates an `AbortSignal` that can be passed to `fetch({ signal })`, `addEventListener({ signal })`, and async pipelines:
```js
const controller = new AbortController();
fetch(url, { signal: controller.signal });
controller.abort(); // Immediately cancels in-flight fetch
```

---

### Part 12 — Handling `AbortError` Cleanly `🔴 [Production-Critical]`

When `fetch` is aborted, its Promise rejects with a `DOMException` named `AbortError`. Always catch and ignore `AbortError` so it is not mistaken for a real server failure:
```js
try {
  const res = await fetch(url, { signal });
} catch (err) {
  if (err.name === 'AbortError') return; // 🟢 Expected cancellation
  handleRealError(err);
}
```

---

### Part 13 — Request Ownership: Component, Route, and User Lifecycles `🟢 [Daily Driver]`

Every asynchronous operation must have a defined owner. When the owner unmounts or navigates away, all associated operations must be cancelled or detached.

---

### Part 14 — Disconnected Lifecycles: Unmount vs Pending I/O `🔴 [Production-Critical]`

If a component unmounts while an async request is pending, setting React state on the unmounted component without cleanup can leak memory and trigger console warnings.

---

### Part 15 — Concurrency Policies Matrix `🟢 [Daily Driver]`

| Concurrency Policy | Behavioral Rule | Common Use Case |
|---|---|---|
| **Latest-Wins (Switch)** | Cancel/discard previous in-flight requests; only render newest. | Autocomplete search, tab navigation. |
| **Every-Result-Matters** | Process and display all responses independently. | Multi-file uploads, chat messages. |
| **Queue-Sequential** | Enqueue requests and process strictly one-by-one in order. | Database migrations, order processing. |
| **First-Success-Wins** | Race multiple sources; take first response and cancel rest. | Multi-CDN asset fetching. |

---

### Part 16 — Sequential vs. Parallel Dependency Chains `🟢 [Daily Driver]`

- **Sequential:** Operation B requires output from Operation A ($\text{Order} \to \text{Payment} \to \text{Receipt}$).
- **Parallel:** Operations A, B, and C are independent ($\text{User} + \text{Notifications} + \text{Stats}$).

---

### Part 17 — Shared Mutable State Across Asynchronous Time Gaps `🔴 [Production-Critical]`

Any shared global/module-scoped mutable variable accessed after an `await` statement is vulnerable to mutation by other concurrent operations during the network wait time.

---

### Part 18 — Optimistic UI Updates & Safe Rollback `🟢 [Daily Driver]`

1. Snapshot current state ($S_0$).
2. Optimistically apply expected state ($S_1$).
3. Fire async network request.
4. On error, rollback state to snapshot ($S_0$) and alert user.

---

### Part 19 — Preventing Duplicate Submissions `🟢 [Daily Driver]`

Disable buttons and apply idempotency tokens on submit handlers to prevent users from double-clicking and submitting duplicate financial transactions.

---

### Part 20 — 10-Point Master KPI 11 Async Checklist `🟢 [Daily Driver]`

```text
1. Are async states modeled using Discriminated Tagged Unions instead of multiple booleans?
2. Are all live search inputs protected against out-of-order race conditions?
3. Is AbortController used to cancel stale in-flight requests on new user queries?
4. Are AbortError exceptions caught and safely ignored in UI error banners?
5. Are shared mutable variables snapshotted locally before entering await time gaps?
6. Are component unmount cleanups configured to cancel active background requests?
7. Is loading state modeled with active request counters when multiple requests run?
8. Are optimistic mutations backed by snapshot rollback handlers on failure?
9. Are submit buttons disabled during in-flight mutations to prevent duplicate actions?
10. Is the appropriate concurrency policy (Latest-Wins vs Sequential) chosen intentionally?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Solution | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Sequence ID Tagging** | Protecting UI state from stale out-of-order responses in high-speed typing/filtering. | Scenarios where backend server bandwidth and compute savings are paramount. | Request still runs to completion on wire; payload is discarded on client. | `AbortController`. |
| **`AbortController` Invalidation** | Cancelling expensive network fetches, large file downloads, and unmounting views. | Fire-and-forget background analytics beacons. | Requires handling `AbortError` rejections explicitly across the stack. | Sequence ID tagging. |
| **Tagged Union State Machines** | Enterprise asynchronous UI flows (checkout, multi-step forms, complex widgets). | Simple 1-line synchronous UI toggles (`isModalOpen`). | Requires structured TypeScript discriminated union setup. | Plain `useState`. |
| **Optimistic Updates with Rollback** | High-frequency interactive apps (social media likes, todo item toggles). | High-stakes irreversible financial transactions (wire transfers, crypto swaps). | High complexity in rolling back concurrent subsequent user mutations. | Pessimistic loading states. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Multi-Tab Data Grid with Request Sequencing, Abort Cancellation & FSM
```tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';

// ==========================================
// 1. DISCRIMINATED ASYNC STATE MACHINE
// ==========================================
export type TabState<T> =
  | { status: 'IDLE'; data: null; error: null }
  | { status: 'LOADING'; data: T | null; error: null }
  | { status: 'SUCCESS'; data: T; error: null }
  | { status: 'ERROR'; data: null; error: Error };

export interface DataItem {
  id: string;
  title: string;
  category: string;
}

// ==========================================
// 2. RESILIENT DATA GRID HOOK
// ==========================================
export function useResilientTabData<T>(fetcher: (tab: string, signal: AbortSignal) => Promise<T>) {
  const [activeTab, setActiveTab] = useState('tech');
  const [state, setState] = useState<TabState<T>>({ status: 'IDLE', data: null, error: null });

  const abortControllerRef = useRef<AbortController | null>(null);
  const latestSequenceIdRef = useRef<number>(0);

  const switchTab = useCallback(
    async (tabName: string) => {
      setActiveTab(tabName);

      // 🟢 1. Abort previous in-flight network request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // 🟢 2. Increment Monotonic Sequence Counter
      const seqId = ++latestSequenceIdRef.current;

      setState((prev) => ({ status: 'LOADING', data: prev.data, error: null }));

      try {
        const result = await fetcher(tabName, controller.signal);

        // 🟢 3. Sequence Invariant: Apply only if this is still the latest tab request!
        if (seqId === latestSequenceIdRef.current) {
          setState({ status: 'SUCCESS', data: result, error: null });
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return; // Safe cancellation

        if (seqId === latestSequenceIdRef.current) {
          setState({
            status: 'ERROR',
            data: null,
            error: err instanceof Error ? err : new Error(String(err))
          });
        }
      }
    },
    [fetcher]
  );

  // Load initial tab on mount & cleanup on unmount
  useEffect(() => {
    switchTab('tech');
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [switchTab]);

  return { activeTab, switchTab, state };
}

// ==========================================
// 3. ENTERPRISE DATA GRID COMPONENT
// ==========================================
export function EnterpriseResilientTabGrid() {
  const fetchMockData = useCallback(async (category: string, signal: AbortSignal): Promise<DataItem[]> => {
    // Simulated variable network latency
    const delay = category === 'tech' ? 150 : 30;
    await new Promise((res, rej) => {
      const timer = setTimeout(res, delay);
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        rej(new DOMException('Aborted', 'AbortError'));
      });
    });

    return [
      { id: `${category}-1`, title: `${category.toUpperCase()} Article 1`, category },
      { id: `${category}-2`, title: `${category.toUpperCase()} Article 2`, category }
    ];
  }, []);

  const { activeTab, switchTab, state } = useResilientTabData(fetchMockData);

  return (
    <div className="grid-container">
      <h3>Enterprise Resilient Tab Grid (Race-Condition Free)</h3>

      <div className="tab-buttons">
        {['tech', 'finance', 'health'].map((tab) => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            className={activeTab === tab ? 'active-tab' : ''}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="state-viewer">
        <p>Active Tab: <strong>{activeTab}</strong> | State: <strong><code>{state.status}</code></strong></p>

        {state.status === 'LOADING' && <div className="loading-spinner">⏳ Loading fresh tab data...</div>}
        {state.status === 'ERROR' && <div className="error-banner">⚠️ {state.error.message}</div>}

        {state.status === 'SUCCESS' && (
          <ul className="item-list">
            {state.data.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong> (Category: {item.category})
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
```

---

## 🧠 Part 05 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: Out-of-Order Response Discarding
```js
let latestId = 0;
let displayed = "";

function fetchQuery(query, delay) {
  const seq = ++latestId;
  setTimeout(() => {
    if (seq === latestId) {
      displayed = query;
      console.log("Displayed:", displayed);
    } else {
      console.log("Discarded stale query:", query);
    }
  }, delay);
}

// Request 1 starts first (slow, 60ms)
fetchQuery("re", 60);

// Request 2 starts second (fast, 20ms)
fetchQuery("react", 20);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Displayed: react
Discarded stale query: re
```
**Why:** Request 2 incremented `latestId` to 2 and finished at 20ms. When Request 1 finished at 60ms, its sequence ID (1) did not match `latestId` (2), so its stale payload was safely discarded.
</details>

---

### Prediction Challenge 2: Shared Mutable State across Time Gap
```js
let activeTenant = "Tenant-A";

async function saveTenantRecord() {
  const capturedTenant = activeTenant;
  await new Promise((r) => setTimeout(r, 30)); // Async Time Gap
  console.log("Safe Captured Tenant:", capturedTenant);
  console.log("Global Active Tenant:", activeTenant);
}

saveTenantRecord();
activeTenant = "Tenant-B"; // Mutated during time gap
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Safe Captured Tenant: Tenant-A
Global Active Tenant: Tenant-B
```
**Why:** The local `capturedTenant` variable snapshotted the state before the time gap. Accessing the global `activeTenant` after the `await` returns the mutated value ("Tenant-B").
</details>

---

### Prediction Challenge 3: Tagged Union State Invariant
```js
function renderUI(state) {
  switch (state.status) {
    case "IDLE": return "Prompt user to search";
    case "LOADING": return "Show spinner";
    case "SUCCESS": return `Data: ${state.data}`;
    case "ERROR": return `Error: ${state.error}`;
  }
}

console.log("Result:", renderUI({ status: "SUCCESS", data: "Order #101" }));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Result: Data: Order #101
```
**Why:** Tagged union pattern guarantees deterministic single-branch rendering with zero ambiguous boolean conflicts.
</details>

---

### Prediction Challenge 4: AbortController Abort Rejection
```js
const controller = new AbortController();

const task = new Promise((resolve, reject) => {
  controller.signal.addEventListener("abort", () => {
    reject(new DOMException("Aborted", "AbortError"));
  });
});

controller.abort();

task.catch((err) => {
  console.log("Caught Abort Error Name:", err.name);
});
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Caught Abort Error Name: AbortError
```
**Why:** Firing `controller.abort()` triggered the abort event listener, rejecting the Promise with an `AbortError` DOMException.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is an asynchronous "Race Condition" in frontend development?  
<details>
<summary><strong>Answer</strong></summary>
A race condition occurs when two or more asynchronous operations (e.g. network requests) are triggered in parallel, and the correctness of the application depends on which one finishes first. Because network latency varies, an older request might finish *after* a newer request, overwriting fresh UI state with stale data.
</details>

**Q2:** What is `AbortController` and how is it used with `fetch()`?  
<details>
<summary><strong>Answer</strong></summary>
`AbortController` is a native browser Web API used to cancel asynchronous operations. You pass `controller.signal` into `fetch(url, { signal })`. When you call `controller.abort()`, the browser immediately aborts the underlying HTTP socket request and rejects the fetch Promise with a `DOMException` named `AbortError`.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** Why is using multiple independent boolean flags (`isLoading`, `isError`, `isSuccess`) considered an anti-pattern for async state?  
<details>
<summary><strong>Answer</strong></summary>
Multiple independent booleans create $2^N$ possible states, leading to impossible and ambiguous state permutations (e.g. `isLoading === true && isSuccess === true`). Senior engineers model async state using **Discriminated Tagged Unions** (`status: 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'`), which mathematically restricts the state space to valid, mutually exclusive states.
</details>

**Q4:** What is the difference between "Cancelling an operation" and "Ignoring a stale result"?  
<details>
<summary><strong>Answer</strong></summary>
- **Cancelling (`AbortController`):** Actively terminates the in-flight network connection on the wire, freeing network sockets, saving client/server bandwidth, and stopping server compute.  
- **Ignoring (Sequence ID):** The network request runs to completion on the wire, but when the response arrives, the client inspects its sequence ID, determines it is stale, and discards the payload without modifying UI state.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** What are "Asynchronous Time Gaps" and how do they cause data cross-contamination bugs across user sessions?  
<details>
<summary><strong>Answer</strong></summary>
An asynchronous time gap is the temporal pause between when an async function initiates an operation and when execution resumes after an `await` statement. If an async function relies on shared, module-scoped mutable state (e.g. `activeUser`), that variable may be mutated by another event (e.g. the user switching accounts) during the time gap. When the original fetch resolves, it applies User A's data to User B's state. To prevent this, local variables must snapshot state before entering the time gap.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How do you design an enterprise-grade Optimistic UI mutation pipeline with conflict resolution and offline rollback guarantees?  
<details>
<summary><strong>Answer</strong></summary>
1. **Immutable State Snapshotting:** Before applying an optimistic mutation, capture an immutable snapshot of the current state tree ($S_0$) along with an incremented entity version tag ($V_{\text{client}}$).  
2. **Optimistic Projection:** Apply the predicted state ($S_1$) immediately to the client cache to give the user instant 0ms latency feedback.  
3. **Idempotent Mutation Dispatch:** Send the mutation to the backend with an idempotency key (`X-Idempotency-Key: uuid`) and the base version ($V_{\text{client}}$).  
4. **Deterministic Resolution & Conflict Rollback:** If the server returns a 409 Conflict or network error, revert the cache to snapshot $S_0$. If concurrent mutations occurred, use Operational Transformation (OT) or Conflict-free Replicated Data Types (CRDTs) to reconcile intermediate deltas without destroying user input.
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Concurrency & Sequence Coordinator

```js
// See runnable implementation in examples/05-async-workflows-state-modeling-cancellation.js
```

---

## Key Takeaways
1. **Model State as FSM:** Use Tagged Unions to make impossible states unrepresentable.
2. **Never Rely on FIFO Network Arrivals:** Always tag requests with monotonic sequence IDs.
3. **Combine Abort with Sequencing:** Abort for bandwidth efficiency; validate IDs for UI safety.
4. **Beware of Async Time Gaps:** Snapshot local state before entering `await` pauses.
5. **Handle `AbortError` Cleanly:** Differentiate user cancellations from true server errors.

---

[⬅️ Part 04: Callback Queues, Task Scheduling & Execution Order](./04-callback-queues-task-readiness-execution.md) | [📚 KPI 11 Index](./README.md) | [KPI 12 — Promises & Concurrency ➡️](../12-Promises-Concurrency/README.md)
