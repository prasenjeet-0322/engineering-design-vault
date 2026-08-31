# KPI 02 — Part 12: BFCache: Advanced Eligibility, Eviction & Restoration

[⬅️ Part 11: Page Lifecycle & Visibility API](./11-page-lifecycle-visibility-api.md) | [📚 KPI 02 Index](./README.md) | [Part 13: End-to-End Navigation Debugging & Mastery ➡️](./13-end-to-end-navigation-debugging-mastery.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| BFCache Concept | Underlying Browser Mechanism | Critical Risk / Antipattern | Senior Engineering Standard |
|---|---|---|---|
| **BFCache (Back/Forward Cache)** | Preserves the entire live in-memory document, DOM tree, JS heap, and React fiber state in a frozen state. | Assuming Back/Forward navigation triggers a fresh HTTP request or component remount. | 🟢 Design applications for two distinct lifecycles: **Fresh Mount** vs **BFCache Restoration**. |
| **`pageshow` (`event.persisted`)** | Dispatched whenever a page becomes active; `event.persisted === true` signals a BFCache restore. | Ignoring `pageshow.persisted`, leaving stale financial data or revoked auth tokens visible. | 🟢 Listen to `pageshow` to trigger selective data freshness reconciliation and session validation. |
| **`pagehide` vs `unload`** | `pagehide` signals page deactivation (and potential freezing); `unload` is legacy and blocks BFCache. | Attaching `window.addEventListener("unload", ...)` permanently disqualifies page from BFCache. | 🔴 **NEVER use `unload`:** Use `pagehide` or `visibilitychange` for cleanup and analytics beacons. |
| **Eligibility Constraints** | Browser checks open WebSockets, WebRTC, active locks, IndexedDB transactions, and headers. | Unclosed active network connections or exclusive hardware locks causing silent BFCache eviction. | 🔵 Close background connections in `pagehide` and re-establish them on `pageshow`. |
| **Freezing vs Destruction** | Frozen state suspends JS execution timers and microtasks without garbage collecting memory. | Assuming background `setInterval` timers continue ticking while the page is in BFCache. | 🟢 Re-sync time-sensitive timers and clocks on `pageshow` restoration. |
| **BFCache vs HTTP Cache** | HTTP cache stores raw asset payloads (HTML/JS/CSS); BFCache stores **live execution state**. | Conflating HTTP `Cache-Control` response headers with BFCache browser memory retention. | 🟢 Use `Cache-Control: no-store` only for sensitive authenticated pages requiring immediate eviction. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: React `useEffect` Mount Assumptions & The `unload` Blocker
> 
> #### Gotcha A: `useEffect(..., [])` Does NOT Run on BFCache Restores (The Stale Balance Trap)
> *"Why did our React banking dashboard display a stale $100 balance instead of the updated $250 balance when the user clicked the browser's Back button?"*  
> ```tsx
> // ❌ BROKEN ASSUMPTION: Component always mounts on Back navigation
> function BankingDashboard() {
>   const [balance, setBalance] = useState<number | null>(null);
> 
>   useEffect(() => {
>     // 💥 FATAL FLAW: When restored from BFCache, React does NOT re-mount!
>     // The component tree, Fiber nodes, and state (balance = $100) are restored directly from memory.
>     // This empty-dependency effect NEVER executes on BFCache restoration!
>     fetchAccountBalance().then(setBalance);
>   }, []); // Only runs on initial mount!
> 
>   return <div>Account Balance: ${balance}</div>;
> }
> ```
> **Deep Architectural Explanation:**  
> When a browser navigates back to a BFCached page, it does not parse HTML, execute script tags, or instantiate a new React root. The entire JavaScript heap—including closures, component state, and the Fiber reconciler—is resumed from a frozen memory snapshot. Therefore, component mount lifecycles (`componentDidMount` and `useEffect(() => {}, [])`) are completely bypassed.  
> **The Senior Standard:** Bind restoration logic to the window `pageshow` event with `event.persisted` checks:
> ```tsx
> // ✅ RESILIENT RECONCILIATION HOOK:
> function useBFCacheRevalidate(onRestore: () => void) {
>   useEffect(() => {
>     const handlePageShow = (event: PageTransitionEvent) => {
>       if (event.persisted) {
>         // 🟢 Explicitly reconcile fresh state when restored from BFCache!
>         onRestore();
>       }
>     };
>     window.addEventListener('pageshow', handlePageShow);
>     return () => window.removeEventListener('pageshow', handlePageShow);
>   }, [onRestore]);
> }
> ```
> 
> ---
> 
> #### Gotcha B: The Legacy `unload` Handler Disqualifying BFCache
> *"Why is our e-commerce site experiencing 0% BFCache hit rates and slow back navigation across Chrome and Safari?"*  
> ```js
> // ❌ FATAL BFCache BLOCKER:
> window.addEventListener("unload", () => {
>   // 💥 FATAL MISTAKE: Adding an 'unload' event listener disqualifies the page from BFCache
>   // in many modern browser engines because browsers cannot guarantee unload execution
>   // if the page is frozen in memory!
>   navigator.sendBeacon("/api/analytics/exit", JSON.stringify({ exitTime: Date.now() }));
> });
> ```
> **Deep Architectural Explanation:**  
> The `unload` event model assumes synchronous, irreversible document destruction. If a browser placed a document with an `unload` handler into BFCache, it would either have to fire `unload` (violating preservation invariants) or skip it (breaking legacy code expectations). Consequently, browsers treat `unload` listeners as a hard signal to destroy the document and disqualify it from BFCache.  
> **The Senior Standard:** Migrate all teardown and telemetry beacons to `visibilitychange` (`document.visibilityState === 'hidden'`) and `pagehide`:
> ```js
> // ✅ BFCache-COMPLIANT TEARDOWN BEACON:
> window.addEventListener("pagehide", (event) => {
>   // 🟢 Safe for BFCache: event.persisted tells us if it will be preserved!
>   navigator.sendBeacon("/api/analytics/leave", JSON.stringify({
>     persisted: event.persisted,
>     timestamp: Date.now()
>   }));
> });
> ```

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / Next.js / Core Web Vitals | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of apps | `pageshow` with `event.persisted`, `pagehide` teardowns, BFCache-friendly SPAs | Crucial for achieving sub-100ms Instant Back/Forward navigation and perfect INP/LCP scores. |
| 🟡 **Moderate** | Used in ~45% of apps | Selective revalidation, Auth session invalidation, WebSocket reconnection on restore | Essential for financial portals, e-commerce checkouts, collaborative editors, and multi-tab dashboards. |
| 🔵 **Foundational / Engine** | Runtime internals | Chromium BFCache eviction reasons, WebKit PageCache, Memory pressure heuristics | Required for Staff/Principal performance audits, browser compatibility reviews, and framework design. |

---

## Core Concepts (20 Subtopics)

### Part 1 — The Back/Forward Cache Mental Model `🟢 [Daily Driver]`

BFCache is a browser memory cache that stores a complete snapshot of a web page (DOM, JS heap, scroll position, CSSOM) in memory when the user navigates away, allowing instantaneous restoration upon Back/Forward traversal.

---

### Part 2 — BFCache vs HTTP Cache: The Architectural Boundary `🟢 [Daily Driver]`

- **HTTP Cache:** Stores static network byte responses (HTML, JS, CSS, images) on disk/memory; navigation reconstructs a brand-new document and re-executes all scripts.
- **BFCache:** Stores the **live executing document instance**; navigation resumes the exact suspended JavaScript environment.

---

### Part 3 — The 4-Stage BFCache Lifecycle Graph `🟢 [Daily Driver]`

$$\text{Active} \xrightarrow[\text{nav away}]{\text{pagehide}} \text{Eligible} \xrightarrow{\text{freeze}} \text{Frozen (BFCached)} \xrightarrow[\text{Back button}]{\text{pageshow}} \text{Restored (Active)}$$

---

### Part 4 — `pageshow` & `event.persisted`: The Signal of Restoration `🟢 [Daily Driver]`

```js
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    console.log("🟢 Page was restored from BFCache!");
  } else {
    console.log("⚪ Normal fresh navigation mount.");
  }
});
```

---

### Part 5 — `pagehide` vs `unload`: The Teardown Paradigm Shift `🔴 [Production-Critical]`

`pagehide` fires whenever a page transitions away from active view. Unlike `unload`, `pagehide` receives `event.persisted`, indicating whether the page is entering BFCache (`true`) or being destroyed (`false`).

---

### Part 6 — What Gets Preserved in Memory? `🟢 [Daily Driver]`

- **JavaScript Closures & Heap:** In-memory variables, singleton stores, React state, Redux stores.
- **DOM & Form Elements:** Input text values, radio selections, checkbox states, scroll offset coordinates.
- **Execution Stack:** Suspended timers and microtask queues (paused during freeze).

---

### Part 7 — The React Mount Fallacy `🔴 [Production-Critical]`

React components do not remount on BFCache restore. `useEffect(() => {}, [])` and class `componentDidMount` do **not** run.

---

### Part 8 — BFCache Eligibility & Blocker Taxonomy `🔵 [Foundational / Engine]`

Browsers evaluate eligibility based on:
1. Absence of `unload` event listeners.
2. `Cache-Control: no-store` response headers.
3. Active WebSockets, WebTransport, or WebRTC channels.
4. Active Web Locks (`navigator.locks`) or IndexedDB transactions.
5. Outstanding camera/microphone media streams.

---

### Part 9 — The Eviction Mechanism: Why BFCache Is Not Guaranteed `🟢 [Daily Driver]`

BFCache is a best-effort performance optimization. Browsers evict cached pages under:
- System memory pressure.
- Cache timeout expiration (e.g. 10–30 minutes).
- Sibling tab navigations consuming memory thresholds.

---

### Part 10 — Selective Revalidation: Stale Data Strategies `🟢 [Daily Driver]`

Never refetch everything on `pageshow`. Partition state into:
- **Static Content:** Retain as-is (e.g. article text, search filters).
- **Dynamic Content:** Revalidate in background (e.g. cart badge count, user notifications).
- **Sensitive Content:** Invalidate immediately (e.g. bank balances, auth tokens).

---

### Part 11 — Authentication & Logout Security Invariants `🔴 [Production-Critical]`

If a user logs out in Tab B, pressing Back in Tab A must not reveal private cached dashboard data. Validate session tokens on `pageshow.persisted`:
```js
window.addEventListener("pageshow", async (event) => {
  if (event.persisted) {
    const isAuth = await checkSessionValidity();
    if (!isAuth) window.location.replace("/login");
  }
});
```

---

### Part 12 — Managing WebSockets & Real-Time Connections `🟡 [Moderate]`

Close WebSockets in `pagehide` to allow clean BFCache freezing; re-open them in `pageshow`:
```js
window.addEventListener("pagehide", () => socket.close());
window.addEventListener("pageshow", (e) => { if (e.persisted) initSocket(); });
```

---

### Part 13 — Managing Timers & Scheduled Intervals `🟢 [Daily Driver]`

Timers (`setInterval`, `setTimeout`) pause when frozen. On restoration, timers resume from where they left off, which can cause timing skew. Re-synchronize timestamps on `pageshow`.

---

### Part 14 — Double Subscription & Event Listener Leaks `🔴 [Production-Critical]`

Ensure `pageshow` listeners do not repeatedly register new event listeners on preserved DOM nodes without proper unbinding.

---

### Part 15 — BFCache vs `document.visibilityState` `🟢 [Daily Driver]`

- `visibilityState === 'hidden'`: Page is in background (tab switch, minimize, or navigation).
- `pageshow.persisted === true`: Page was suspended in BFCache and resumed via history traversal.

---

### Part 16 — Testing BFCache in Chrome DevTools `🟢 [Daily Driver]`

Use **DevTools $\to$ Application $\to$ Back/forward cache $\to$ "Test back/forward cache"** to inspect blocking reasons and simulation passes.

---

### Part 17 — The `notRestoredReasons` Reporting API `🔵 [Foundational / Engine]`

Modern browsers expose `PerformanceNavigationTiming.notRestoredReasons` via Performance Observer to track production BFCache disqualifications in RUM telemetry.

---

### Part 18 — Impact on Core Web Vitals (INP, LCP, FID) `🟢 [Daily Driver]`

BFCache restores achieve near-zero ($<50\text{ms}$) LCP and eliminate layout shifts (CLS), dramatically boosting Core Web Vitals pass rates.

---

### Part 19 — The 4-Pillar Restoration Architecture Pattern `🟢 [Daily Driver]`

$$\text{Detect Restore} \implies \text{Validate Auth} \implies \text{Revalidate Volatile Data} \implies \text{Reconnect Sockets}$$

---

### Part 20 — The 10-Point Senior BFCache Audit Checklist `🟢 [Daily Driver]`

```text
1. Are all unload handlers removed? ──► 2. Is pageshow.persisted used for freshness?
3. Are WebSockets closed in pagehide? ──► 4. Is auth token re-verified on restore?
5. Is Cache-Control: no-store avoided for public pages? ──► 6. Are timers re-synchronized?
7. Is double-event registration avoided? ──► 8. Are form input states preserved?
9. Is notRestoredReasons logged to RUM? ──► 10. Does Back navigation feel instant?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| State Revalidation Pattern | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Selective `pageshow` Revalidation** | High-traffic e-commerce, banking dashboards, collaborative apps. | Static blogs, marketing landing pages with immutable content. | Requires maintaining separate fresh vs cached data pathways. | Global `window.location.reload()` (anti-pattern). |
| **`pagehide` Connection Teardown** | WebSockets, WebRTC, Server-Sent Events (SSE), long polling. | Stateless REST-only applications with no persistent sockets. | Slight latency ($50\text{ms}$) to re-establish sockets upon return. | Leaving sockets open (blocks BFCache). |
| **`Cache-Control: no-store`** | Sensitive financial statements, PII user settings, medical records. | Public product catalogs, documentation, news articles. | Completely destroys BFCache, forcing slow multi-second reloads. | Token verification on `pageshow`. |
| **Form State Preservation** | Multi-step checkout wizards, complex search filters, draft forms. | Security-sensitive password inputs or credit card CVV fields. | Stale form state can conflict with updated backend schemas. | Clearing inputs manually. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise BFCache Restoration & Revalidation Engine in TypeScript
```tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';

// ==========================================
// 1. REUSABLE BFCACHE REVALIDATION HOOK
// ==========================================
export interface UseBFCacheOptions {
  onRestore?: () => void;
  revalidateAuth?: boolean;
}

export function useBFCache(options: UseBFCacheOptions = {}) {
  const { onRestore, revalidateAuth = true } = options;
  const isRestoredRef = useRef(false);

  useEffect(() => {
    const handlePageShow = async (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.info('⚡ [BFCache Engine]: Page restored from Back/Forward Cache.');
        isRestoredRef.current = true;

        if (revalidateAuth) {
          // Verify session validity upon restoration
          const isAuthenticated = checkLocalSession();
          if (!isAuthenticated) {
            console.warn('🔒 [BFCache Engine]: Session expired during suspension. Redirecting...');
            window.location.replace('/login');
            return;
          }
        }

        if (onRestore) {
          onRestore();
        }
      }
    };

    const handlePageHide = (event: PageTransitionEvent) => {
      console.info(`📦 [BFCache Engine]: Page hiding (Eligible for BFCache: ${event.persisted})`);
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [onRestore, revalidateAuth]);

  return { isRestored: isRestoredRef.current };
}

function checkLocalSession(): boolean {
  // Simulated session validation check
  return localStorage.getItem('auth_token') !== null;
}

// ==========================================
// 2. ENTERPRISE RESILIENT DASHBOARD COMPONENT
// ==========================================
export function EnterpriseBFCacheDashboard() {
  const [balance, setBalance] = useState<number>(100);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());
  const [restoreCount, setRestoreCount] = useState<number>(0);

  const fetchLatestBalance = useCallback(() => {
    // Reconcile volatile financial state
    const newBalance = Math.floor(Math.random() * 500) + 100;
    setBalance(newBalance);
    setLastRefreshed(new Date().toLocaleTimeString());
    setRestoreCount((prev) => prev + 1);
  }, []);

  // 🟢 Bind BFCache restoration handler
  useBFCache({
    onRestore: fetchLatestBalance,
    revalidateAuth: true
  });

  return (
    <div className="bfcache-dashboard-card">
      <header className="card-header">
        <h3>Enterprise BFCache-Aware Dashboard</h3>
        <span className="badge">⚡ Instant Back/Forward Restoration</span>
      </header>

      <p className="architecture-description">
        Demonstrates resilient React state preservation and automatic data freshness reconciliation on <code>pageshow.persisted</code>.
      </p>

      <div className="metrics-grid">
        <div className="metric-box">
          <label>Account Balance</label>
          <div className="metric-value">${balance}.00</div>
        </div>
        <div className="metric-box">
          <label>Last Revalidated</label>
          <div className="metric-value">{lastRefreshed}</div>
        </div>
        <div className="metric-box">
          <label>BFCache Restores</label>
          <div className="metric-value">{restoreCount}</div>
        </div>
      </div>

      <div className="controls-row">
        <button
          type="button"
          onClick={() => {
            // Simulate client-side navigation
            window.location.href = '#settings';
          }}
          className="btn-navigate"
        >
          Navigate to Settings (Test Back Button)
        </button>
      </div>
    </div>
  );
}
```

---

## 🧠 Part 12 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: `pageshow` vs Component Mount
```text
User visits Page A (React mounts, counter = 0)
User increments counter to 42
User navigates to Page B
User clicks Back button (Page A is restored from BFCache)
```
**Question:** Does React's `useEffect(() => {}, [])` execute on the Back navigation, and what is the value of `counter`?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:**  
- **`useEffect` Execution:** **No.** `useEffect(..., [])` does not run because the component was never unmounted; its Fiber memory was suspended and resumed.  
- **`counter` Value:** **`42`**. The JavaScript heap is restored exactly as it was when the user navigated away.
</details>

---

### Prediction Challenge 2: The `unload` Listener Impact
```js
window.addEventListener("unload", () => {
  console.log("Cleanup executed");
});
```
**Question:** What impact does this code snippet have on BFCache eligibility in modern desktop and mobile browsers?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:**  
It **disqualifies the page from BFCache** in many major browser engines (especially WebKit/Safari and Firefox, and historically Chromium). The browser will discard the document upon navigation, forcing a slow network/parse cycle on Back traversal.
</details>

---

### Prediction Challenge 3: `pageshow.persisted` Value
```js
window.addEventListener("pageshow", (e) => {
  console.log(e.persisted);
});
```
**Question:** What will be logged when: (1) The user types the URL and presses Enter? (2) The user presses the browser Back button to a BFCached page?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:**  
1. Initial navigation: **`false`** (Normal new document creation).  
2. BFCache Back navigation: **`true`** (Document restored from memory).
</details>

---

### Prediction Challenge 4: Freezing vs Timers
```js
let tick = 0;
setInterval(() => { tick++; }, 1000);
```
**Question:** If a page enters BFCache for 60 seconds, will `tick` increase by 60 while in the background?
<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Answer:**  
**No.** When a page is in BFCache, all JavaScript execution is completely **frozen (paused)**. The timer will resume ticking from its exact pause point only after `pageshow` restores the document.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is BFCache and how is it different from normal browser caching?  
<details>
<summary><strong>Answer</strong></summary>
HTTP caching stores static file responses (HTML, CSS, JS) on disk to speed up network downloads. BFCache (Back/Forward Cache) stores the **live, in-memory execution state** of the entire web page (DOM, JS heap, scroll position, React state) in a frozen state, enabling instant sub-50ms Back/Forward navigations without re-executing scripts from scratch.
</details>

**Q2:** How can you detect if a page was loaded fresh or restored from BFCache?  
<details>
<summary><strong>Answer</strong></summary>
Listen to the `pageshow` event on `window` and check `event.persisted`. If `event.persisted === true`, the page was restored from BFCache. If `false`, it was a normal initial navigation or reload.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** Why does adding an `unload` event listener harm website performance?  
<details>
<summary><strong>Answer</strong></summary>
The `unload` event implies permanent, irreversible document destruction. Modern browsers disqualify pages containing `unload` listeners from entering BFCache because they cannot guarantee both preserving the document state and firing `unload`. Developers should replace `unload` with `pagehide` and `visibilitychange`.
</details>

**Q4:** Why might a user see stale financial data after pressing the browser Back button, and how do you fix it?  
<details>
<summary><strong>Answer</strong></summary>
Because BFCache restores the frozen in-memory state of the page from when the user left, bypassing initial React `useEffect` data-fetching hooks. To fix this, listen to `pageshow` with `event.persisted === true` and trigger selective revalidation for volatile data (e.g. account balance, notification badges).
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** How do you architect an enterprise single-page application (SPA) to support BFCache without leaking WebSockets, auth tokens, or background timers?  
<details>
<summary><strong>Answer</strong></summary>
1. **Teardown in `pagehide`:** Explicitly close WebSockets, WebRTC channels, and Web Locks when `pagehide` fires.  
2. **Re-establish in `pageshow`:** If `event.persisted === true`, re-verify the auth session with the identity provider, re-open real-time sockets, and re-sync paused timers.  
3. **Session Invalidation:** If a user logs out in another tab, verify token validity on `pageshow` and redirect to `/login` if invalid.  
4. **Telemetry Ingestion:** Use `PerformanceObserver` to monitor `notRestoredReasons` in production to prevent regressions.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How does the browser engine manage memory pressure and eviction policies across multiple BFCached documents, and how does the `notRestoredReasons` API operate?  
<details>
<summary><strong>Answer</strong></summary>
1. **Memory Heuristics:** Browsers maintain an LRU (Least Recently Used) cache of page snapshots. When OS or browser memory limits are reached, the oldest or largest BFCached pages are silently evicted and destroyed.  
2. **`notRestoredReasons` API:** Exposed via `PerformanceNavigationTiming`, this API returns structured metadata detailing why a document was ineligible for BFCache (e.g. `unloadListener`, `openIndexedDBTransaction`, `networkRequestOngoing`).  
3. **Staff Strategy:** Integrate `notRestoredReasons` into your Real User Monitoring (RUM) pipeline to establish alerting thresholds when BFCache eligibility drops below 95% across critical user funnels.
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone BFCache Lifecycle Simulator

```js
// See runnable implementation in examples/12-bfcache-advanced-eligibility-eviction-restoration.js
```

---

## Key Takeaways
1. **BFCache Preserves In-Memory State:** DOM, React Fiber, and JS heap are frozen, not reloaded.
2. **`pageshow.persisted` Is Key:** Use it to trigger data freshness and auth revalidation.
3. **Never Use `unload`:** Always use `pagehide` or `visibilitychange`.
4. **Close Active Sockets:** Disconnect WebSockets on `pagehide` and reconnect on `pageshow`.
5. **Monitor `notRestoredReasons`:** Track BFCache disqualification reasons in production RUM.

---

[⬅️ Part 11: Page Lifecycle & Visibility API](./11-page-lifecycle-visibility-api.md) | [📚 KPI 02 Index](./README.md) | [Part 13: End-to-End Navigation Debugging & Mastery ➡️](./13-end-to-end-navigation-debugging-mastery.md)
