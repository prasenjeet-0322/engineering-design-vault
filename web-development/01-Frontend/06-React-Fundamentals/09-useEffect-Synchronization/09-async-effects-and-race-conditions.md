# Level 06 — React Fundamentals
## KPI 06 / KPI 09 — Effects & Synchronization
### PART 09 — Async Effects, Cancellation, Race Conditions & Stale Results

[⬅️ Previous Part](08-effect-cleanup-resource-ownership.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](examples/09-async-effects-cancellation-races.html) | [Next Part ➡️](10-useLayoutEffect-and-browser-synchronization.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

# Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

## 1. The Senior Mental Model

An asynchronous Effect is not:
> *"Run some async code after render."*

It is:
> **A render establishes a synchronization relationship, and that relationship may initiate asynchronous work whose eventual result must still belong to the correct owner and current synchronization generation.**

The fundamental problem is **time**.

A synchronous Effect can establish and tear down a resource immediately:
```text
render ──► commit ──► Effect setup ──► subscribe
```

An asynchronous Effect introduces an unpredictable temporal gap:
```text
render #1 ──► commit ──► start request A (Alice)
                               │
render #2 ──► commit ──► start request B (Bob)
                               │
               Bob completes   │ (fast network response)
                               ▼
               Alice completes │ (slow/delayed network response)
```

The crucial question is no longer merely: *"Did this request finish?"*  
It becomes: **"Does this result still belong to the current synchronization relationship?"**

---

## 2. Core Model

```text
COMPONENT RENDER
       │
       ▼
┌─────────────────────┐
│  Reactive snapshot  │
│   query = "react"   │
└──────────┬──────────┘
           │
           ▼
        COMMIT
           │
           ▼
     EFFECT SETUP
           │
           ▼
   Start request #17
           │
   ┌───────┴──────────────┐
   │                      │
   ▼                      ▼
Request pending   Component changes
   │                      │
   │                      ▼
   │                 Cleanup #17
   │                      │
   │                      ▼
   │              Start request #18
   │                      │
   ┌──────────────────────┴──────────────┐
   │                                     │
   ▼                                     ▼
#18 resolves                         #17 resolves
   │                                     │
   ▼                                     ▼
CURRENT RESULT?                      STALE RESULT?
   │                                     │
  YES                                   NO
   │                                     │
   ▼                                     ▼
update UI                           ignore / abort
```

---

## 3. Executive Concept Table

| Concept | Core Mechanism | Production Impact | Common Senior Trap |
| :--- | :--- | :--- | :--- |
| **Async Effect** | Effect starts external async work | UI becomes temporally dependent on external result | Treating async work as if it were synchronous |
| **Cleanup** | Terminates the synchronization relationship | Prevents stale ownership/resources | Assuming cleanup automatically cancels everything |
| **Cancellation** | Attempts to stop in-flight work | Saves resources and can reduce stale completions | Believing cancellation guarantees server rollback |
| **Request identity** | Associates result with a particular operation | Prevents stale results from winning | Using a single boolean without understanding ownership |
| **Latest-wins** | Newer synchronization generation supersedes older one | Correct for search/typeahead | Incorrect for independent mutations |
| **Race condition** | Completion order differs from initiation order | Older data can overwrite newer data | Assuming requests resolve in initiation order |
| **Stale closure** | Async callback retains an older render's values | Wrong decisions or updates | Confusing closure staleness with network race |
| **AbortController** | Provides cancellation signal to supported APIs | Allows fetch cancellation | Treating abort as proof that server never processed request |
| **Ownership** | Defines who controls async operation/result | Determines cleanup and update policy | Assuming component always owns operation |
| **Currentness** | Determines whether result still applies | Protects UI state | Equating "request completed" with "result is valid" |

---

## 4. Golden Rule

> **Starting asynchronous work is easy. Correctly deciding whether its result is still allowed to affect the current UI is the senior-level problem.**

And:
$$\text{Cancellation} \neq \text{Currentness} \neq \text{Rollback}$$
Do not collapse them into one concept.

---

# Layer 2 — 🔬 Deep Mechanical Breakdown

## 5. Why Async Effects Need Special Reasoning

Consider:
```typescript
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(response => response.json())
      .then(data => {
        setUser(data);
      });
  }, [userId]);

  return <Profile user={user} />;
}
```

Suppose:
1. `t0`: `userId = "alice"` $\rightarrow$ Request Alice starts.
2. `t1`: `userId = "bob"` $\rightarrow$ Request Bob starts.
3. `t2`: Bob completes (100ms) $\rightarrow$ `setUser(Bob)`. UI shows Bob.
4. `t3`: Alice completes (800ms) $\rightarrow$ `setUser(Alice)`. **UI flips back to Alice!**

The final UI is displaying data for a user that is no longer selected. This is a classic **network race condition**.

---

## 6. Async Effect $\neq$ Async Component Lifecycle

```text
Effect lifetime:  |------------------------|
                  setup                 cleanup

Request lifetime: |--------------------------------------|
                  start                               completion
```

The network request frequently outlives the Effect that initiated it.

---

## 7. The Effect Callback Must Not Return a Promise as Cleanup

### Avoid:
```typescript
useEffect(async () => { // ❌ Illegal: returns Promise
  const response = await fetch("/api/data");
  const data = await response.json();
  setData(data);
}, []);
```

React requires the Effect callback to return either `undefined` or a **cleanup function**, not a `Promise`.

### Correct Pattern:
```typescript
useEffect(() => {
  let cancelled = false;

  async function load() {
    const response = await fetch("/api/data");
    const data = await response.json();
    if (!cancelled) {
      setData(data);
    }
  }

  load();

  return () => {
    cancelled = true;
  };
}, []);
```

The outer Effect callback remains synchronous, while the asynchronous operation is nested safely inside.

---

## 8. The Five-Stage Async Effect Lifecycle

```text
1. Effect setup
   ↓
2. Create operation identity
   ↓
3. Start external work (fetch / promise)
   ↓
4. External system performs work
   ↓
5. Result arrives ──► Is this result still relevant?
                        ├── NO  ──► Discard / Ignore
                        └── YES ──► Commit state update to React UI
```

---

## 9. Race Conditions Are About Ordering

```typescript
useEffect(() => {
  fetch(`/api/search?q=${query}`)
    .then(r => r.json())
    .then(results => setResults(results));
}, [query]);
```

### Real-World Timing:

| Query | Started | Completed | Duration |
| :--- | :---: | :---: | :---: |
| `"r"` | $10\text{ ms}$ | $700\text{ ms}$ | $690\text{ ms}$ |
| `"re"` | $50\text{ ms}$ | $500\text{ ms}$ | $450\text{ ms}$ |
| `"rea"` | $90\text{ ms}$ | $400\text{ ms}$ | $310\text{ ms}$ |
| `"reac"` | $130\text{ ms}$ | $300\text{ ms}$ | $170\text{ ms}$ |
| `"react"` | $170\text{ ms}$ | $220\text{ ms}$ | $50\text{ ms}$ |

**Completion Order:** `"react"` $\rightarrow$ `"reac"` $\rightarrow$ `"rea"` $\rightarrow$ `"re"` $\rightarrow$ `"r"`.  
The UI ends up displaying results for `"r"` instead of `"react"`!

---

## 10. Race Condition $\neq$ Stale Closure

- **Stale Closure:** Callback captures outdated variables from an older render snapshot in JavaScript lexical scope.
- **Race Condition:** Two or more asynchronous operations overlap in time and complete in an order different from their initiation order.

---

## 11. Render-by-Render Prediction Challenge #1

```typescript
function Search({ query }: { query: string }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetch(`/search?q=${query}`)
      .then(r => r.json())
      .then(data => setResults(data));
  }, [query]);

  return <Results items={results} />;
}
```

- `query = "react"` (Request A starts) $\rightarrow$ `query = "react hooks"` (Request B starts).
- Request B resolves first $\rightarrow$ `setResults(B)`.
- Request A resolves second $\rightarrow$ `setResults(A)`.
- **Result:** UI incorrectly displays results for `"react"`.

---

## 12. Request Identity

Explicitly track which operation is current using an incremental version identifier:

```text
Request #41
Request #42
Request #43 (Current)
```

When `#42` arrives:
$$\text{requestId } (42) === \text{currentRequestId } (43) \implies \text{false (Discard!)}$$

When `#43` arrives:
$$\text{requestId } (43) === \text{currentRequestId } (43) \implies \text{true (Apply!)}$$

---

## 13. A Request-ID Pattern

```typescript
function Search({ query }: { query: string }) {
  const [results, setResults] = useState([]);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;

    fetch(`/search?q=${encodeURIComponent(query)}`)
      .then(response => response.json())
      .then(data => {
        if (requestId !== requestIdRef.current) {
          return; // Stale result discarded!
        }
        setResults(data);
      });
  }, [query]);

  return <Results items={results} />;
}
```

---

## 14. Why `useRef` Is Useful Here

A ref provides persistent mutable coordination storage without triggering re-renders:
```text
Fiber ──► Hook List ──► useRef hook ──► { current: 3 }
```
`requestIdRef.current = 4` does not schedule an unnecessary render.

---

## 15. Cancellation With `AbortController`

```typescript
useEffect(() => {
  const controller = new AbortController();

  fetch(`/api/users/${userId}`, {
    signal: controller.signal,
  })
    .then(response => response.json())
    .then(data => {
      setUser(data);
    })
    .catch(error => {
      if (error.name === "AbortError") {
        return; // Ignore expected aborts
      }
      setError(error);
    });

  return () => {
    controller.abort();
  };
}, [userId]);
```

---

## 16. Cancellation Is Not Currentness

> **Critical Distinction:** Aborting a request does **not** prove the server never received it, nor does it guarantee transactional rollback.

$$\text{Cancellation} \neq \text{Currentness} \neq \text{Rollback}$$

---

## 17. Three Separate Questions

For every async operation, answer:
1. **Cancellation:** *Can the client-side operation be stopped?*
2. **Currentness:** *If a result arrives, should this UI still accept it?*
3. **Rollback:** *If the operation already mutated external state, can that change be compensated?*

---

## 18. The Strong Pattern: Cancellation + Currentness

```typescript
useEffect(() => {
  const controller = new AbortController();
  const requestId = ++requestIdRef.current;

  async function run() {
    try {
      const response = await fetch(
        `/search?q=${encodeURIComponent(query)}`,
        { signal: controller.signal }
      );
      const data = await response.json();

      if (requestId !== requestIdRef.current) {
        return; // Currentness guard
      }
      setResults(data);
    } catch (error: any) {
      if (error.name === "AbortError") {
        return; // Cancellation guard
      }
      if (requestId !== requestIdRef.current) {
        return;
      }
      setError(error);
    }
  }

  run();

  return () => {
    controller.abort(); // Cancel network socket
  };
}, [query]);
```

---

## 19. Cleanup and Async Results

```typescript
useEffect(() => {
  let active = true;

  fetch("/api/data")
    .then(r => r.json())
    .then(data => {
      if (active) {
        setData(data);
      }
    });

  return () => {
    active = false;
  };
}, []);
```
`active = false` marks the Effect generation as obsolete. It does not cancel the network request, but it prevents stale state mutations.

---

## 20. Why a Boolean Can Become Insufficient

When coordinating multiple concurrent operations, global stores, or shared queues, explicit version IDs (`requestIdRef.current`) communicate semantics far more reliably than isolated local booleans.

---

## 21. Component Unmount Is an Ownership Question

If an `UploadDialog` unmounts:
- **Component-owned upload:** Stop upload on unmount (`controller.abort()`).
- **Application-owned upload:** Upload continues in background service; unmounting only detaches the local modal UI.

---

## 22. Async State Machines

Avoid impossible boolean flags (`loading = true`, `success = true`, `error = true`). Model explicit statuses:

```text
       ┌──────────────┐
       │     idle     │
       └──────┬───────┘
              │ start
              ▼
       ┌──────────────┐
       │   loading    │
       └──┬───────┬───┘
          │       │
   success│       │ failure
          ▼       ▼
     ┌─────────┐ ┌─────────┐
     │ success │ │  error  │
     └─────────┘ └─────────┘
```

---

## 23. Do Not Automatically Model "Stale" as UI State

A stale search request is discarded internally. The user does not need to see a flickering `STATUS: STALE` badge.

---

## 24. Prediction Challenge #2

If `controller.abort()` is called after request 1 reached the server:
- **Does `abort()` guarantee the server didn't process it?**
- **Answer:** **No.** The server may have already committed the database transaction.

---

## 25. Search Is Usually Latest-Wins

```text
"rea" ──► "react" ──► "react hooks"
```
The newer query semantically supersedes older queries. Discarding old results is correct.

---

## 26. Payments Are Not Latest-Wins

```text
POST /payments (Payment A)
POST /payments (Payment B)
```
Payment B does not supersede Payment A; ignoring A could charge a user twice without showing confirmation. Mutations require server-side idempotency keys.

---

## 27. Async Effect Policy Matrix

| Operation | Typical Policy |
| :--- | :--- |
| **Search query** | Latest-wins + Cancellation |
| **Typeahead** | Latest-wins + Cancellation |
| **Live preview** | Latest-wins |
| **Profile fetch keyed by ID** | Latest-wins |
| **Analytics event** | Fire-and-forget / Batching |
| **Save mutation** | Preserve operation semantics |
| **Payment** | Independent / Idempotent server operation |
| **Delete** | Explicit mutation semantics |
| **Upload** | Application-owned + Cancellable |
| **Polling** | Cancel previous timer/request before replacing |
| **Subscription** | Cleanup exact subscription |

---

# Layer 3 — 🧪 Diagnostic Labs & DevTools Profiling

## 28. Diagnostic Lab A — Observe Request Ordering

```javascript
console.log("[request:start]", { requestId, query, time: performance.now() });
console.log("[request:complete]", { requestId, query, time: performance.now() });
console.log("[request:discard]", { requestId, currentRequestId: requestIdRef.current });
```

---

## 29. Diagnostic Lab B — Network Panel

Use Chrome DevTools Network tab with **Fast 3G** throttling to reliably reproduce out-of-order completions.

---

## 30. Diagnostic Lab C — React DevTools Profiler

Correlate which external asynchronous completion triggered which component state commit.

---

## 31. Diagnostic Lab D — Timeline Telemetry

```typescript
function logAsyncEvent(type: string, metadata: Record<string, any>) {
  console.table({
    type,
    timestamp: performance.now(),
    ...metadata,
  });
}
```

---

## 32. Diagnostic Lab E — Deliberately Create a Race

```typescript
function fakeFetch(query: string) {
  const delay = query.length === 5 ? 100 : 800; // "react" returns fast, "react hooks" returns slow
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ query, results: [`Result for ${query}`] });
    }, delay);
  });
}
```

---

## 33. Production Incident Runbook — Search Result Reversal

1. Check if multiple requests overlap.
2. Verify if requests complete out of order.
3. Check if every completion unconditionally calls `setState`.
4. Implement `requestIdRef` currentness check + `AbortController`.

---

## 34. Production Incident — Stale Profile

User switches Alice $\rightarrow$ Bob $\rightarrow$ Charlie. Responses arrive Charlie $\rightarrow$ Bob $\rightarrow$ Alice. Ensure only `requestId === currentRequestId` updates state.

---

## 35. Production Incident — Abort Confusion

Never rely solely on `AbortController` for state safety; pair it with an explicit `requestId` currentness check.

---

## 36. Production Incident — Unmounted Component

Determine whether the operation is component-owned (cancel on unmount) or application-owned (detach UI, continue operation).

---

# Layer 4 — 🔥 The Crucible

### 37. Prediction Challenge #3
```typescript
function Search({ query }) {
  const [results, setResults] = useState([]);
  useEffect(() => {
    let active = true;
    fakeFetch(query).then(data => {
      if (active) setResults(data);
    });
    return () => { active = false; };
  }, [query]);
  return <Results data={results} />;
}
```
- Request A finishes after Request B.
- `active(A) === false` $\rightarrow$ Result A discarded. UI correctly retains Result B.

---

### 38. Prediction Challenge #4
- URL A starts $\rightarrow$ URL B starts $\rightarrow$ A aborted $\rightarrow$ B resolves.
- Result B updates state because B is current.

---

### 39. Prediction Challenge #5
- Two `POST /orders` attempts.
- Using latest-wins to ignore attempt A is dangerous because attempt A may already have created an order on the server.

---

## 40. Anti-Pattern Teardown #1 — "Just Abort It"

Abort cancels network transport, but does not guarantee server rollback or currentness. Always pair with `requestId`.

---

## 41. Anti-Pattern Teardown #2 — Missing Request Identity

Unconditional `fetch().then(setData)` will fail under real-world network latency jitter.

---

## 42. Anti-Pattern Teardown #3 — Treating All Async Operations as Latest-Wins

Only queries and typeahead are latest-wins. Chat messages, comments, and payment submissions are independent commands.

---

## 43. Anti-Pattern Teardown #4 — One Global `isMounted`

Never use a module-level global `let isMounted = true;` variable; multiple component instances will overwrite it.

---

## 44. Anti-Pattern Teardown #5 — Async Effect as a Generic Data Pipeline

Pure filtering or sorting should be computed during render, not inside an async Effect pipeline.

---

## 45. Decision Matrix

| Situation | Cancellation | Currentness Check | Latest-Wins |
| :--- | :---: | :---: | :---: |
| **Search** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Typeahead** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Profile fetch** | Often | ✅ Yes | ✅ Yes |
| **Independent messages** | ❌ No | Operation-specific | ❌ No |
| **Payment** | Transport-only | Operation-specific | ❌ No |
| **Upload** | Often | ✅ Yes | Usually No |
| **Polling** | ✅ Yes | ✅ Yes | Replace poll |

---

## 46. Senior Engineering Framework

Before writing an async Effect, answer:
1. **Ownership:** Who owns this operation?
2. **Lifetime:** Should it survive unmount?
3. **Cancellation:** Can the underlying API be canceled?
4. **Currentness:** Can an old result arrive after a newer operation?
5. **Semantics:** Does the newest operation supersede previous ones?
6. **Mutation:** Does it change server state?
7. **Idempotency:** Can retries produce duplicate side effects?
8. **UI State:** Which states are meaningful to render?

---

## 47. Async Effect Mental Model

```text
RENDER ──► Reactive Snapshot ──► COMMIT ──► EFFECT SETUP
                                                  │
                 ┌────────────────────────────────┴────────────────┐
                 ▼                                                 ▼
        Operation Identity                                   Cancellation
                 │                                                 │
                 └────────────────────────┬────────────────────────┘
                                          ▼
                                   External System
                                          │
                                          ▼
                                     Async Result
                                          │
                                          ▼
                                  Currentness Check
                                   ┌──────┴──────┐
                                   ▼             ▼
                                 stale        current
                                   │             │
                                   ▼             ▼
                                discard       setState ──► RENDER
```

---

## 48. Cross-KPI Boundary

- **KPI 05 (Events):** User interaction policies (debouncing, throttling, click commands).
- **KPI 06 (Effects):** Reactive synchronization with external systems and request lifecycles.

---

## 49. Level 07 Boundary

Concurrent rendering, scheduler lanes, and transitions build upon this temporal correctness foundation.

---

## 50. Senior Interview Traps

1. **"Cleanup only runs on unmount."** $\rightarrow$ *False:* Runs on dependency changes too.
2. **"Abort means the request never reached the server."** $\rightarrow$ *False:* Client cancel $\neq$ Server rollback.
3. **"Latest request should always win."** $\rightarrow$ *False:* Only valid for superseding queries.
4. **"Async Effect means the callback should be async."** $\rightarrow$ *False:* Callback cannot return a Promise.
5. **"Stale closures and race conditions are the same."** $\rightarrow$ *False:* Lexical closure vs Temporal ordering.
6. **"If component unmounts, all work must stop."** $\rightarrow$ *False:* Depends on ownership.
7. **"A request completed, therefore it should update state."** $\rightarrow$ *False:* Completion $\neq$ Currentness.

---

## 51. Senior Completion Checklist

You should be able to:
- [ ] Explain why async Effects introduce temporal correctness problems.
- [ ] Explain the distinction between Effect lifetime and request lifetime.
- [ ] Explain why an Effect callback should not directly return a Promise.
- [ ] Start async work from a synchronous Effect callback.
- [ ] Return cleanup independently of async completion.
- [ ] Explain request races and out-of-order completion.
- [ ] Distinguish stale closures from stale results.
- [ ] Explain request identity and latest-wins protection.
- [ ] Explain why `useRef` is useful for mutable coordination metadata.
- [ ] Use `AbortController` for supported cancelable operations.
- [ ] Distinguish cancellation from currentness and rollback.
- [ ] Explain component-owned vs application-owned async work.
- [ ] Model meaningful async UI state machines.
- [ ] Identify when latest-wins is semantically correct vs dangerous.
- [ ] Diagnose search result reversals and stale profile data.
- [ ] Instrument operation IDs and reproduce race conditions deliberately.
- [ ] Explain why resource lifetime should follow ownership.

---

# 52. Graduation Test

A senior React engineer looks at:
```typescript
useEffect(() => {
  fetch(url).then(r => r.json()).then(setData);
}, [url]);
```
and immediately verifies:
1. Can requests overlap?
2. Can completion order differ from start order?
3. Is latest-wins the intended semantic?
4. Who owns the request?
5. What happens on dependency change and unmount?
6. Can the operation be canceled with `AbortController`?
7. How is stale-result protection enforced?
8. What async states are rendered?

---

# 53. Final Mental Model

> **An asynchronous result is not automatically authoritative merely because it arrived. It must still belong to the correct synchronization generation and obey the operation's domain semantics.**

---

[⬅️ Previous Part](08-effect-cleanup-resource-ownership.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](examples/09-async-effects-cancellation-races.html) | [Next Part ➡️](10-useLayoutEffect-and-browser-synchronization.md)
