# Level 06 — React Fundamentals
## KPI 15 — Async UI State & Data Lifecycle
### PART 03 — Loading, Stale Data, Error Recovery & Revalidation

[⬅️ Previous Part](./02-request-cancellation-race-guards.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](./examples/03-loading-stale-error-revalidation.html) | [Next Part ➡️](./04-optimistic-ui-and-mutation-lifecycle.md)

---

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)  
> **Co-Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)

---

# PART 03 — Loading, Stale Data, Error Recovery & Revalidation

```text
                               STALE-WHILE-REVALIDATE ASYNC TOPOLOGY
                               
   INITIAL STATE: No Data in Memory
   ┌────────────────────────────────────────────────────────────────────────┐
   │ status: "loading", data: null                                          │
   │ UI: Full <SkeletonLoader /> (Blocking Initial Acquisition)             │
   └───────────────────┬────────────────────────────────────────────────────┘
                       │
                       │ FETCH_SUCCEEDED (fetchedAt: 10:00)
                       ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │ status: "success", data: [Users...], isStale: false                    │
   │ UI: Complete Interactive Data View                                     │
   └───────────────────┬────────────────────────────────────────────────────┘
                       │
                       │ Time passes (Clock reaches 10:05 > staleAt threshold)
                       ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │ status: "stale", data: [Users...], isStale: true                       │
   │ UI: Interactive Data View Remains Visible (0ms disruption!)            │
   └───────────────────┬────────────────────────────────────────────────────┘
                       │
                       │ REFRESH_STARTED (Manual click or background window focus)
                       ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │ status: "refreshing", data: [Users...], isRefreshing: true             │
   │ UI: Data View + Subtle Refresh Badge (Non-Blocking Revalidation!)      │
   └───────────────────┬────────────────────────────────────────────────────┘
                       │
         ┌─────────────┴──────────────┐
         ▼                            ▼
   REFRESH_SUCCEEDED            REFRESH_FAILED (Network error)
   ┌───────────────────────┐    ┌───────────────────────────────────────────┐
   │ status: "success"     │    │ status: "stale-error", data: [Users...]   │
   │ Fresh Data Committed  │    │ UI: PRESERVED DATA + Non-Destructive Error│
   └───────────────────────┘    └───────────────────────────────────────────┘
```

---

## Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

### 1. The Senior Problem: Initial Loading $\neq$ Background Refreshing

A junior asynchronous model collapses all network activity into a single boolean `isLoading`. When the user clicks "Refresh", the application executes:

```tsx
// ❌ JUNIOR MISTAKE: Destroys existing data on refresh
function UserDashboard() {
  const [data, setData] = useState<User[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = async () => {
    setIsLoading(true); // 💥 Destroys visible UI, forcing full-screen spinner!
    const res = await fetchUsers();
    setData(res);
    setIsLoading(false);
  };

  if (isLoading) return <FullPageSpinner />; // Jarring UI flicker!
  return <UserList users={data!} />;
}
```

> **The Architectural Law:** *"The application is fetching"* is NOT the same thing as *"the user has no usable data."*  
> An active background revalidation must never destroy or hide an existing valid data snapshot.

### 2. The Fundamental Async UI Equation

$$\text{Async UI State} = \text{Data Snapshot} + \text{Operation Status} + \text{Freshness} + \text{Error State} + \text{Operation Identity} + \text{Recovery Policy}$$

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Initial Loading:        Data Unavailable  + Request In-Flight ──► Full Skeleton  │
│ Background Refresh:     Data Available    + Request In-Flight ──► Subtle Spinner │
│ Stale Error Recovery:   Data Available    + Request Failed    ──► Data + Banner  │
│ Fatal Error:            Data Unavailable  + Request Failed    ──► Error Screen   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 3. The Golden Rule

> **The Golden Rule:** Loading describes an operation; it does not describe the availability of data. Never replace a valid data snapshot with a loading spinner unless the previous data has been semantically invalidated.

---

## Layer 2 — 🔬 Deep Architectural Mechanics & Freshness Timelines

### 1. The Multi-Dimensional State Model

A senior architecture models 5 orthogonal dimensions of asynchronous reality:

| Dimension | Possible States | Meaning & Purpose |
| :--- | :--- | :--- |
| **1. Data Availability** | `none` \| `partial` \| `available` | Determines whether the primary view can be rendered. |
| **2. Request Lifecycle** | `idle` \| `loading` \| `refreshing` \| `retrying` | Represents active network transport execution. |
| **3. Freshness Status** | `fresh` \| `stale` \| `unknown` | Derived from `Date.now() >= staleAt` timestamp. |
| **4. Error Severity** | `none` \| `recoverable` \| `fatal` | Differentiates background refresh failures from total load failures. |
| **5. Operation Currentness** | `current` \| `obsolete` \| `cancelled` | Enforces generation counter and abort signal checks. |

---

### 2. Explicit Discriminated Union with Freshness Metadata

```tsx
export type User = { id: string; name: string; email: string };

export type AsyncResourceState<T> =
  | { status: 'idle'; data: null; error: null; fetchedAt: null; staleAt: null }
  | { status: 'loading'; data: null; error: null; fetchedAt: null; staleAt: null }
  | { status: 'success'; data: T; error: null; fetchedAt: number; staleAt: number }
  | { status: 'refreshing'; data: T; error: null; fetchedAt: number; staleAt: number }
  | { status: 'stale-error'; data: T; error: Error; fetchedAt: number; staleAt: number }
  | { status: 'error'; data: null; error: Error; fetchedAt: null; staleAt: null };
```

```tsx
export type AsyncResourceAction<T> =
  | { type: 'FETCH_STARTED'; operationId: number }
  | { type: 'FETCH_SUCCEEDED'; operationId: number; data: T; fetchedAt: number; ttlMs: number }
  | { type: 'FETCH_FAILED'; operationId: number; error: Error }
  | { type: 'REFRESH_STARTED'; operationId: number }
  | { type: 'REFRESH_SUCCEEDED'; operationId: number; data: T; fetchedAt: number; ttlMs: number }
  | { type: 'REFRESH_FAILED'; operationId: number; error: Error }
  | { type: 'RETRY'; operationId: number }
  | { type: 'RESET' };
```

---

### 3. Pure State Transition Reducer

```tsx
export function resourceReducer<T>(
  state: AsyncResourceState<T>,
  action: AsyncResourceAction<T>
): AsyncResourceState<T> {
  switch (action.type) {
    case 'FETCH_STARTED':
      return { status: 'loading', data: null, error: null, fetchedAt: null, staleAt: null };

    case 'FETCH_SUCCEEDED':
      return {
        status: 'success',
        data: action.data,
        error: null,
        fetchedAt: action.fetchedAt,
        staleAt: action.fetchedAt + action.ttlMs,
      };

    case 'FETCH_FAILED':
      return { status: 'error', data: null, error: action.error, fetchedAt: null, staleAt: null };

    case 'REFRESH_STARTED':
      // Invariant: Refresh only valid when previous data exists
      if (state.data !== null) {
        return {
          status: 'refreshing',
          data: state.data,
          error: null,
          fetchedAt: state.fetchedAt,
          staleAt: state.staleAt,
        };
      }
      return state;

    case 'REFRESH_SUCCEEDED':
      return {
        status: 'success',
        data: action.data,
        error: null,
        fetchedAt: action.fetchedAt,
        staleAt: action.fetchedAt + action.ttlMs,
      };

    case 'REFRESH_FAILED':
      // Invariant: Preserve existing data snapshot in stale-error state
      if (state.data !== null) {
        return {
          status: 'stale-error',
          data: state.data,
          error: action.error,
          fetchedAt: state.fetchedAt,
          staleAt: state.staleAt,
        };
      }
      return { status: 'error', data: null, error: action.error, fetchedAt: null, staleAt: null };

    case 'RETRY':
      if (state.status === 'stale-error') {
        return { ...state, status: 'refreshing', error: null };
      }
      if (state.status === 'error') {
        return { status: 'loading', data: null, error: null, fetchedAt: null, staleAt: null };
      }
      return state;

    case 'RESET':
      return { status: 'idle', data: null, error: null, fetchedAt: null, staleAt: null };

    default:
      return state;
  }
}
```

---

### 4. Freshness Derivation: Storing Facts vs Manual Toggling

Never store `isFresh: true/false` in state. Time passes continuously on the client clock without triggering state setters.

```tsx
// ❌ BAD: Storing derived freshness booleans causes synchronization drift
const [data, setData] = useState(users);
const [isFresh, setIsFresh] = useState(true); // Who sets this to false when 5 min pass?!

// ✅ SENIOR PATTERN: Store authoritative timestamps, derive freshness dynamically
const fetchedAt = 1718000000000;
const TTL = 5 * 60 * 1000; // 5 minutes
const staleAt = fetchedAt + TTL;

// Derived during render
const isStale = Date.now() >= staleAt;
```

---

## Layer 3 — 💥 Production Incidents & Anti-Patterns

### Incident 1: The "Blinking Dashboard" Polling Incident

#### The Incident
An operations monitoring screen polled metrics every 30 seconds. Every 30 seconds, the entire screen flashed white, unmounted charts, displayed a 1-second loading skeleton, and remounted the charts. Users complained of eye strain and broken chart tooltips.

#### Root Cause
The component checked `if (isLoading)` and returned `<Skeleton />`, failing to differentiate initial acquisition from periodic background revalidation.

#### Production Resolution
```tsx
// ✅ PRODUCTION RENDER POLICY:
function MonitoringDashboard({ state }: { state: AsyncResourceState<Metrics> }) {
  // 1. Initial blocking acquisition state
  if (state.status === 'loading' || state.status === 'idle') {
    return <DashboardSkeleton />;
  }

  // 2. Fatal load error without data
  if (state.status === 'error') {
    return <FatalErrorScreen error={state.error} />;
  }

  // 3. Resilient rendering: Data exists! (success, refreshing, or stale-error)
  return (
    <div className="relative">
      {state.status === 'refreshing' && (
        <div className="absolute top-2 right-2 text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded">
          Syncing latest telemetry...
        </div>
      )}
      {state.status === 'stale-error' && (
        <div className="bg-amber-500/20 border border-amber-500 text-amber-300 p-2 text-xs rounded mb-3 flex justify-between">
          <span>⚠ Failed to refresh latest metrics. Showing cached data.</span>
          <button onClick={retry}>Retry</button>
        </div>
      )}
      <MetricsChart metrics={state.data} />
    </div>
  );
}
```

---

### Incident 2: Deleting Last Known Good State on Network Timeout

#### The Incident
A cryptocurrency trading screen tracked live Bitcoin order books. During a brief 2-second Wi-Fi drop, the refresh failed. The app immediately wiped the order book and displayed: *"Error: Offline"*. Traders lost access to their existing order context.

#### Architectural Principle
> **Invariant:** Stale data is NOT invalid data. An error during revalidation informs the user that a refresh attempt failed; it does **NOT** invalidate the pre-existing client snapshot.

---

### Incident 3: Unbounded Retry Stampede

#### The Incident
A backend microservice experienced high latency. Client apps with recursive `catch () => retry()` fired thousands of retries in an infinite loop, causing a Distributed Denial of Service (DDoS) self-inflicted outage.

#### Production Rule: Exponential Backoff & Jitter
```tsx
export async function fetchWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 500
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > maxRetries) throw err;
      // Exponential backoff with randomized full jitter
      const delay = Math.random() * (baseDelayMs * Math.pow(2, attempt));
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

## Layer 4 — 🧠 Senior Diagnostics & Prediction Challenges

### Challenge 1: Freshness Threshold Crossing
*Question:* A data snapshot has `staleAt = 10:05`. At `10:05:01`, does React automatically re-render the component?  
*Answer:* **No.** Time passing on the CPU clock does not trigger React state changes. An external trigger (timer, window focus, user click, or component re-render) is required to evaluate the derived `isStale` flag.

### Challenge 2: Concurrent Refresh vs Stale Failure
```text
t0: Data snapshot A (status: success, reqId: 5)
t1: User triggers refresh -> reqId: 6 starts
t2: User clicks refresh again -> reqId: 7 starts
t3: reqId: 7 resolves with Data B
t4: reqId: 6 fails with 504 Timeout
```
*Question:* What should the final state of the application be?  
*Answer:* `status: 'success'`, `data: B`. The stale failure of Request 6 must be discarded by operation currentness guards (`reqId 6 !== currentReqId 7`).

### Challenge 3: Error Severity Differentiation
*Question:* What is the difference between `status: "error"` and `status: "stale-error"`?  
*Answer:* `status: "error"` has `data: null` and represents a fatal block where no UI can be displayed; `status: "stale-error"` has `data: T` and preserves the last known good snapshot with a non-destructive retry notification.

---

## Layer 5 — 💼 Staff-Level Interview Questions & 50-Point Master Checklist

### 10 Staff-Level Interview Questions

1. **Why is `isLoading` an inadequate abstraction for production async UIs?**  
   *Answer:* It fails to differentiate initial blocking acquisition (`data: null`) from non-blocking background revalidation (`data: T`), causing UI flashing.
2. **What is the Stale-While-Revalidate (SWR) architectural pattern?**  
   *Answer:* A caching strategy where the UI immediately renders cached (stale) data while asynchronously fetching an updated representation in the background.
3. **Why should stale data remain visible when a background refresh fails?**  
   *Answer:* Because the failure of a refresh operation does not invalidate the semantic utility of the previous snapshot. Preserving context ensures business continuity.
4. **What is the difference between `stale` and `invalid`?**  
   *Answer:* `stale` means newer data may exist on the server; `invalid` means the current data is semantically corrupt or obsolete (e.g. user changed query) and must not be used.
5. **How do you prevent freshness synchronization drift in React state?**  
   *Answer:* Store immutable `fetchedAt` and `staleAt` timestamps, and derive `isStale = Date.now() >= staleAt` purely during render.
6. **How should a retry mechanism be modeled in a state machine?**  
   *Answer:* As a formal action transition (`RETRY`) from `stale-error` to `refreshing` (or `error` to `loading`), preserving existing data pointers.
7. **What is an exponential backoff retry policy with jitter?**  
   *Answer:* A bounded retry strategy where successive retry delays grow exponentially ($2^N$) randomized with jitter to avoid synchronized client retry storms (thundering herd).
8. **When is it appropriate to delete existing data upon starting a new request?**  
   *Answer:* When the semantic identity of the query changes (e.g., searching for "Cars" instead of "Apples"), making the previous dataset irrelevant.
9. **How do you handle partial data and partial failure in a multi-widget dashboard?**  
   *Answer:* Colocate independent async state machines for each widget so an inventory API failure does not break the revenue chart.
10. **Does `staleAt` require a `setTimeout` in every component?**  
    *Answer:* No. Timestamp derivation is computed in-render. Timers are only needed if the UI must visibly alter its presentation at the exact millisecond of staleness without user interaction.

---

### 50-Point Master Production Checklist

```text
[ ] 1. I distinguish initial loading (data: null) from background refreshing (data: T).
[ ] 2. I never replace a valid data snapshot with a full-screen loading spinner.
[ ] 3. I model async resources with discriminated unions containing status, data, error, fetchedAt.
[ ] 4. I include "stale-error" in state unions to preserve data during refresh failures.
[ ] 5. I store authoritative timestamps (fetchedAt, staleAt) rather than boolean isFresh flags.
[ ] 6. I derive isStale = Date.now() >= state.staleAt directly during render.
[ ] 7. I understand that stale data is NOT invalid data.
[ ] 8. I maintain 0ms perceived latency using Stale-While-Revalidate principles.
[ ] 9. I use subtle non-blocking spinners/badges during background revalidations.
[ ] 10. I provide non-destructive error banners with [Retry] buttons for stale-error states.
[ ] 11. I enforce transition validity in pure reducers (e.g. reject REFRESH from idle).
[ ] 12. I protect revalidation transitions with Part 02 monotonic generation IDs.
[ ] 13. I ensure older refresh failures do not overwrite newer refresh successes.
[ ] 14. I abort in-flight revalidation requests when new manual refreshes are triggered.
[ ] 15. I implement bounded retry policies with max attempts (e.g. 3 retries).
[ ] 16. I implement exponential backoff with randomized full jitter for automated retries.
[ ] 17. I distinguish read revalidations (idempotent) from mutation retries (non-idempotent).
[ ] 18. I colocate state machines at the widget level to support partial dashboard failures.
[ ] 19. I discard previous data only when semantic query identity changes (e.g. new search term).
[ ] 20. I preserve page 1 data while fetching page 2 in virtualized / paginated lists.
[ ] 21. I verify that unmounted components do not execute background revalidation state updates.
[ ] 22. I support revalidation on window focus (window.addEventListener('focus')).
[ ] 23. I support revalidation on network reconnect (window.addEventListener('online')).
[ ] 24. I clean up focus and online event listeners in hook cleanup functions.
[ ] 25. I test offline transitions while background revalidation is active.
[ ] 26. I test slow 3G network conditions to verify that stale data remains usable.
[ ] 27. I test rapid refresh button clicking (5 clicks in 2 seconds).
[ ] 28. I ensure aria-busy="true" is applied to refreshing containers.
[ ] 29. I ensure aria-live="polite" announces background revalidation failures.
[ ] 30. I avoid polling intervals that are shorter than average network latency.
[ ] 31. I pause polling timers when the browser tab is hidden (document.visibilityState).
[ ] 32. I resume polling immediately when the browser tab becomes visible.
[ ] 33. I log state transitions with operation IDs for production debugging.
[ ] 34. I wrap API error responses in standardized domain error objects.
[ ] 35. I expose user-friendly error copy while preserving HTTP status codes for telemetry.
[ ] 36. I ensure pull-to-refresh mobile interactions preserve visible scroll positions.
[ ] 37. I verify that memory usage remains constant during sustained 1-hour polling.
[ ] 38. I avoid creating circular useEffect revalidation loops.
[ ] 39. I isolate TTL configurations to domain configuration constants.
[ ] 40. I test edge cases: 0ms response times, 30s timeouts, 500 Internal Server Errors.
[ ] 41. I ensure custom async hooks expose clean semantic contracts ({ data, status, refresh, retry }).
[ ] 42. I avoid exposing raw boolean flag lists to presentation components.
[ ] 43. I verify that SSR preloaded data hydrates with correct fetchedAt timestamps.
[ ] 44. I support manual cache invalidation commands from parent controllers.
[ ] 45. I support optimistic mutations with explicit rollback transitions (Part 04).
[ ] 46. I audit network payload sizes to optimize background revalidation bandwidth.
[ ] 47. I test screen reader navigation across initial loading and refreshing transitions.
[ ] 48. I document freshness SLAs for frontend microservices.
[ ] 49. I ensure data normalization preserves entity referential equality across refreshes.
[ ] 50. I can defend the multi-dimensional async state architecture in staff-level reviews.
```

---

[Next Part ➡️](./04-optimistic-ui-and-mutation-lifecycle.md)
