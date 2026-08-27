# KPI 18 — Browser Storage, Persistence & Client-Side Security

[⬅️ KPI 17 — Advanced JavaScript Patterns](../23-Advanced-Design-Patterns/README.md) | [📚 JavaScript Index](../README.md) | [KPI 19 — APIs & Networking ➡️](../19-APIs-Networking-Fetch/README.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Storage Mechanism | Storage Model & Quota | Access & Network Behavior | Security & Risk Profile | Senior Production Standard |
|---|---|---|---|---|
| **`localStorage`** | Synchronous key-value strings (~5–10MB). Persistent across sessions. | Scoped to Origin. Not sent over HTTP. | Accessible to all JS on Origin (Vulnerable to XSS). | 🟢 Use strictly for non-sensitive UI settings (theme, collapsed sidebar). |
| **`sessionStorage`** | Synchronous key-value strings (~5MB). Cleared on tab close. | Scoped to active Tab context. Not sent over HTTP. | Accessible to JS in tab (Vulnerable to XSS). | 🟢 Use for multi-step checkout/registration wizard progress. |
| **`HttpOnly` Cookies** | Browser-managed key-value pairs (~4KB total). Configurable TTL. | Sent automatically in HTTP headers with matching Domain/Path. | **Inaccessible to JS** (`document.cookie` returns empty). Mitigates XSS. | 🔴 **Enterprise Standard**: Store auth refresh & session tokens in `HttpOnly; Secure; SameSite=Strict` cookies. |
| **`IndexedDB`** | Asynchronous transactional NoSQL database ($>500\text{MB}$). | Scoped to Origin. Not sent over HTTP. | Accessible to all JS on Origin (Vulnerable to XSS). | 🟢 Use for offline caching, PWA datasets, media blobs, and client-side search indices. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: Client-Side Authorization Gates & Serialization Traps
> 
> #### Gotcha A: Insecure Client-Side Authorization Gates
> *"Why did storing `role: 'admin'` in `localStorage` allow unauthorized users to access restricted admin dashboard views?"*  
> ```js
> // ❌ CATASTROPHIC SECURITY VULNERABILITY:
> const userRole = localStorage.getItem("user_role");
> if (userRole === "admin") {
>   // 💥 Any user can open DevTools and run: localStorage.setItem('user_role', 'admin')!
>   renderAdminPanel();
> }
> ```
> **Deep Architectural Explanation:**  
> Client-side browser storage is fully mutable and controlled by the end user. Treating client storage as a trusted authority for permissions or security checks is a fundamental flaw. Client-side checks only control UI visibility (hiding a button); true authorization must be enforced on the backend via cryptographically signed JWTs or server-side session cookies validated on every API request.  
> **The Senior Standard:** Treat all client storage as untrusted cache. Gate backend routes with `HttpOnly` session tokens, and never rely on client storage for access control:
> ```js
> // ✅ SECURE ARCHITECTURE:
> // 1. UI renders based on server response:
> async function loadDashboard() {
>   const response = await api.get("/me"); // Validates HttpOnly cookie on backend
>   if (response.user.role === "ADMIN") {
>     renderAdminPanel();
>   }
> }
> ```
> 
> ---
> 
> #### Gotcha B: Silent `JSON.stringify` Data Loss & Serialization Traps
> *"Why did saving an order object with Dates and status functions into `localStorage` result in stringified dates and dropped properties?"*  
> ```js
> // ❌ NAIVE SERIALIZATION DATA CORRUPTION:
> const order = {
>   id: "ORD_99",
>   createdAt: new Date("2026-08-27T10:00:00Z"),
>   taxRate: undefined, // 💥 Stripped by JSON.stringify!
>   calculateTotal: () => 100, // 💥 Stripped by JSON.stringify!
> };
> 
> localStorage.setItem("order", JSON.stringify(order));
> const restored = JSON.parse(localStorage.getItem("order"));
> console.log(typeof restored.createdAt); // 💥 "string", NOT a Date object!
> console.log(restored.taxRate); // undefined
> console.log(restored.calculateTotal); // undefined
> ```
> **Deep Architectural Explanation:**  
> `JSON.stringify` does not preserve structured JavaScript types:  
> 1. `Date` objects are serialized to ISO-8601 strings and are **not** automatically revived as `Date` instances by `JSON.parse`.  
> 2. `undefined`, functions, and Symbols are completely omitted from serialized objects.  
> 3. `NaN` and `Infinity` are converted to `null`.  
> 4. Circular object references throw an uncaught `TypeError: Converting circular structure to JSON`.  
> **The Senior Standard:** Use explicit serialization schema mappers or custom revivers:
> ```js
> function deserializeOrder(rawJson) {
>   const parsed = JSON.parse(rawJson);
>   return {
>     ...parsed,
>     createdAt: new Date(parsed.createdAt), // 🟢 Explicitly revived to Date instance
>   };
> }
> ```

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / Next.js / Vite Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Safe `localStorage` wrappers, Multi-tab synchronization (`storage` event), Schema validation on read | Fundamental for theme toggles, sidebar persistence, form drafts, and hydration safety. |
| 🟡 **Moderate** | Used in ~45% of code | Cookie security attributes (`HttpOnly`, `SameSite`), Storage version migrations, TTL expiration | Essential for authentication flows, PWA state management, and enterprise data lifecycle design. |
| 🔵 **Foundational / Engine** | Runtime internals | Synchronous main-thread I/O blocking, Browser Quota eviction policies, Origin isolation | Mandatory for Staff/Principal security audits, browser storage profiling, and architecture reviews. |

---

## Core Concepts (20 Subtopics)

### Part 1 — The Client-Side Storage Architecture Matrix `🟢 [Daily Driver]`

Browser storage provides persistence across execution cycles. Different storage primitives serve distinct lifecycles, capacities, and network integration requirements.

---

### Part 2 — `localStorage` Mechanics & Origin Scope `🟢 [Daily Driver]`

Persists data indefinitely per Origin (`protocol://host:port`). Survives page reloads, browser restarts, and tab closures until explicitly removed.

---

### Part 3 — String-Only Storage Constraints `🟢 [Daily Driver]`

`localStorage` and `sessionStorage` store **only string values**. Primitives are coerced to strings (`localStorage.setItem('count', 10)` $\to$ `"10"`).

---

### Part 4 — JSON Serialization Traps & Edge Cases `🔴 [Production-Critical]`

`JSON.stringify` drops `undefined`, functions, and Symbols; converts `Date` to strings; turns `NaN` to `null`; and crashes on circular references.

---

### Part 5 — Defensive Deserialization: Safe Parsers & Fallbacks `🟢 [Daily Driver]`

Never assume storage contains valid JSON. Always wrap `JSON.parse` in `try...catch` and provide deterministic default fallbacks:
```js
function getStorageItem(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
```

---

### Part 6 — `sessionStorage`: Ephemeral Tab Contexts `🟢 [Daily Driver]`

Isolated strictly to the active browsing tab. It survives reloads within that tab, but is completely cleared when the tab closes (ideal for multi-step wizards).

---

### Part 7 — Multi-Tab Cross-Context Synchronization (`storage` Event) `🟢 [Daily Driver]`

Updates to `localStorage` in Tab A dispatch a `storage` event in all *other* tabs on the same origin, enabling coordinated logout and theme synchronization.

---

### Part 8 — HTTP Cookies & Header-Based Communication `🟢 [Daily Driver]`

Small key-value pairs (~4KB) automatically included in HTTP request headers for domain-scoped client-server session coordination.

---

### Part 9 — Cookie Security Flags: `HttpOnly`, `Secure`, `SameSite` `🔴 [Production-Critical]`

- **`HttpOnly`:** Blocks JavaScript (`document.cookie`) access; prevents XSS token theft.  
- **`Secure`:** Transmits cookie only over encrypted HTTPS.  
- **`SameSite=Strict/Lax`:** Restricts cross-site cookie transmission; mitigates CSRF.

---

### Part 10 — Auth Token Storage: `localStorage` (XSS) vs `HttpOnly` Cookies (CSRF) `🔴 [Production-Critical]`

Never store refresh tokens in `localStorage`. Store session credentials in `HttpOnly; Secure; SameSite=Strict` cookies and short-lived access tokens in memory closures.

---

### Part 11 — Storage Quotas & `QuotaExceededError` `🟢 [Daily Driver]`

`localStorage` is typically capped at 5–10MB per origin. Writing beyond the quota throws a `QuotaExceededError` (or `NS_ERROR_DOM_QUOTA_REACHED` in Firefox).

---

### Part 12 — Schema Versioning & Client Data Migrations `🟢 [Daily Driver]`

When application state schemas change across deployments, embed a `version` field in stored objects and execute sequential migration functions.

---

### Part 13 — Defensive Schema Validation on Read `🟢 [Daily Driver]`

Treat storage data as untrusted external input. Validate data shapes using type guards or validation libraries (Zod) before hydrating application state.

---

### Part 14 — Storage Namespacing (`app:feature:key`) `🟢 [Daily Driver]`

Avoid generic keys (`"data"`, `"user"`). Use structured prefixes (`"vault:theme"`, `"vault:checkout:draft"`) to eliminate naming collisions.

---

### Part 15 — The Centralized Storage Abstraction Layer Pattern `🟢 [Daily Driver]`

Encapsulate storage reads, writes, serialization, and error handling into a dedicated `storageService` rather than scattering `localStorage` calls across components.

---

### Part 16 — Single Source of Truth: Memory vs Storage `🟢 [Daily Driver]`

Runtime state (e.g. React state) is the authoritative source of truth; browser storage is merely an asynchronous or persisted snapshot.

---

### Part 17 — State Hydration & SSR Safety Guards `🔴 [Production-Critical]`

`localStorage` does not exist during Server-Side Rendering (Next.js/Node.js). Guard all storage access behind `typeof window !== 'undefined'` or React `useEffect`.

---

### Part 18 — Anti-Pattern: Trusting Client Storage for Security `🔴 [Production-Critical]`

Never rely on client storage to grant admin privileges or bypass payment checks. Authorization must be strictly validated server-side.

---

### Part 19 — Expiration Lifecycles & TTL Caching in Storage `🟢 [Daily Driver]`

Attach timestamp metadata (`{ value: data, expiresAt: Date.now() + 3600000 }`) to prevent stale data from lingering in storage indefinitely.

---

### Part 20 — The 6-Question Storage Decision Framework `🟢 [Daily Driver]`

```text
1. Does it need to survive reloads? ──► 2. Beyond this tab? ──► 3. Is it sensitive (Auth/PII)?
4. How large is it? ──► 5. What is the source of truth? ──► 6. How does it expire or migrate?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Storage Mechanism | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **`localStorage`** | Non-sensitive UI settings (theme, collapsed layout). | Auth tokens, passwords, large datasets ($>1\text{MB}$). | Synchronous blocking I/O; 5MB limit; XSS exposure. | `IndexedDB` / Cookies. |
| **`sessionStorage`** | Temporary single-tab form steps, checkout wizard progress. | Data that must survive across new tabs or browser restarts. | Cleared when tab closes; isolated per tab. | `localStorage`. |
| **`HttpOnly` Cookies** | Session credentials, refresh tokens, auth tickets. | Heavy client-side caching or large data objects. | 4KB size limit; sent with every HTTP request. | `IndexedDB`. |
| **`IndexedDB`** | Offline PWA caching, large structured datasets, media blobs. | Simple 1-key UI preferences (overly complex API). | Asynchronous setup overhead; complex schema migrations. | `idb` wrapper library. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Schema-Validated, Multi-Tab Synchronized Storage Hook in TypeScript
```tsx
import React, { useState, useEffect, useCallback } from 'react';

// ==========================================
// 1. STORAGE METADATA ENVELOPE & INTERFACES
// ==========================================
export interface StorageEnvelope<T> {
  version: number;
  data: T;
  expiresAt: number | null; // Timestamp in ms (null = never expires)
}

export interface StorageOptions<T> {
  version?: number;
  ttlMs?: number; // Time-to-live in milliseconds
  migrator?: (oldData: any, oldVersion: number) => T;
}

// ==========================================
// 2. RESILIENT STORAGE HOOK WITH MULTI-TAB SYNC
// ==========================================
export function useValidatedStorage<T>(
  key: string,
  initialValue: T,
  options: StorageOptions<T> = {}
) {
  const { version = 1, ttlMs = null, migrator } = options;

  const readStorage = useCallback((): T => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initialValue;

      const envelope: StorageEnvelope<T> = JSON.parse(raw);

      // 🟢 1. TTL Expiration Check
      if (envelope.expiresAt !== null && Date.now() > envelope.expiresAt) {
        localStorage.removeItem(key);
        return initialValue;
      }

      // 🟢 2. Schema Migration Check
      if (envelope.version < version && migrator) {
        const migrated = migrator(envelope.data, envelope.version);
        // Persist migrated schema
        const newEnvelope: StorageEnvelope<T> = {
          version,
          data: migrated,
          expiresAt: ttlMs ? Date.now() + ttlMs : null
        };
        localStorage.setItem(key, JSON.stringify(newEnvelope));
        return migrated;
      }

      return envelope.data;
    } catch {
      return initialValue; // Fallback on corrupt JSON
    }
  }, [key, initialValue, version, ttlMs, migrator]);

  const [state, setState] = useState<T>(readStorage);

  const setStoredValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((current) => {
        const nextValue = value instanceof Function ? value(current) : value;
        try {
          const envelope: StorageEnvelope<T> = {
            version,
            data: nextValue,
            expiresAt: ttlMs ? Date.now() + ttlMs : null
          };
          localStorage.setItem(key, JSON.stringify(envelope));
        } catch (err) {
          console.error(`[Storage Engine]: Write failed for key "${key}":`, err);
        }
        return nextValue;
      });
    },
    [key, version, ttlMs]
  );

  // 🟢 3. Cross-Tab Synchronization via `storage` event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        setState(readStorage());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, readStorage]);

  return [state, setStoredValue] as const;
}

// ==========================================
// 3. REACT DEMONSTRATION DASHBOARD
// ==========================================
interface UserSettings {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
}

export function EnterpriseStorageDashboard() {
  const [settings, setSettings] = useValidatedStorage<UserSettings>(
    'vault:user_settings',
    { theme: 'dark', sidebarCollapsed: false },
    {
      version: 2,
      ttlMs: 24 * 60 * 60 * 1000, // 24-hour TTL
      migrator: (oldData: any, oldVersion: number) => {
        // Migration from v1 to v2: adds `sidebarCollapsed`
        return {
          theme: oldData.theme || 'dark',
          sidebarCollapsed: false
        };
      }
    }
  );

  return (
    <div className={`storage-card theme-${settings.theme}`}>
      <header className="card-header">
        <h3>Enterprise Schema-Validated Storage Engine</h3>
        <span className="sync-badge">🔄 Multi-Tab Synced</span>
      </header>

      <p>Demonstrates TTL expiration, schema versioning migrations, and cross-tab synchronization.</p>

      <div className="controls">
        <button
          onClick={() =>
            setSettings((prev) => ({
              ...prev,
              theme: prev.theme === 'light' ? 'dark' : 'light'
            }))
          }
          className="toggle-btn"
        >
          Toggle Theme: <strong>{settings.theme.toUpperCase()}</strong>
        </button>

        <button
          onClick={() =>
            setSettings((prev) => ({
              ...prev,
              sidebarCollapsed: !prev.sidebarCollapsed
            }))
          }
          className="toggle-btn"
        >
          Sidebar: <strong>{settings.sidebarCollapsed ? 'COLLAPSED' : 'EXPANDED'}</strong>
        </button>
      </div>
    </div>
  );
}
```

---

## 🧠 KPI 18 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: `JSON.stringify` Date Mutation
```js
const record = { date: new Date("2026-08-27T00:00:00.000Z") };
const jsonString = JSON.stringify(record);
const restored = JSON.parse(jsonString);

console.log("Is restored.date an instanceof Date?", restored.date instanceof Date);
console.log("Restored Date Type:", typeof restored.date);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Is restored.date an instanceof Date? false
Restored Date Type: string
```
**Why:** `JSON.stringify` converts `Date` objects to ISO string representations. `JSON.parse` does not revive them as `Date` instances; they remain raw strings unless manually passed to `new Date()`.
</details>

---

### Prediction Challenge 2: Storage Version Migration Execution
```js
function migrate(envelope) {
  if (envelope.version === 1) {
    return {
      version: 2,
      data: { ...envelope.data, fontSize: "16px" }
    };
  }
  return envelope;
}

const v1Stored = { version: 1, data: { theme: "dark" } };
const migrated = migrate(v1Stored);

console.log("Migrated Version:", migrated.version);
console.log("Migrated Font Size:", migrated.data.fontSize);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Migrated Version: 2
Migrated Font Size: 16px
```
**Why:** Version tagging allows the application to detect old stored data formats and cleanly upgrade the schema before consumption.
</details>

---

### Prediction Challenge 3: `localStorage` Primitive Type Coercion
```js
localStorage.setItem("active", true);
localStorage.setItem("count", 0);

console.log("Boolean check active === true:", localStorage.getItem("active") === true);
console.log("Number check count === 0:", localStorage.getItem("count") === 0);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Boolean check active === true: false
Number check count === 0: false
```
**Why:** `localStorage` coerces all primitives to strings (`"true"` and `"0"`). Strict equality comparisons against boolean `true` or number `0` evaluate to `false`.
</details>

---

### Prediction Challenge 4: TTL Expiration Eviction
```js
function isExpired(envelope) {
  return envelope.expiresAt !== null && Date.now() > envelope.expiresAt;
}

const validEnvelope = { data: "token", expiresAt: Date.now() + 10000 };
const expiredEnvelope = { data: "token", expiresAt: Date.now() - 1000 };

console.log("Valid Envelope Expired:", isExpired(validEnvelope));
console.log("Expired Envelope Expired:", isExpired(expiredEnvelope));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Valid Envelope Expired: false
Expired Envelope Expired: true
```
**Why:** Comparing the envelope `expiresAt` timestamp against `Date.now()` enables automated eviction of stale client-side cached entries.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is the difference between `localStorage` and `sessionStorage`?  
<details>
<summary><strong>Answer</strong></summary>
- **`localStorage`:** Stores key-value string data indefinitely per origin. Survives page reloads, browser restarts, and tab closures.  
- **`sessionStorage`:** Stores key-value string data strictly for the duration of the active browser tab. It survives page reloads within that tab, but is completely cleared when the tab is closed.
</details>

**Q2:** Why should you always wrap `JSON.parse(localStorage.getItem(key))` in a `try...catch` block?  
<details>
<summary><strong>Answer</strong></summary>
If the key does not exist (`null`), or if the stored value has been corrupted, manually modified in DevTools, or formatted incorrectly, `JSON.parse()` throws an unhandled `SyntaxError`, which will crash the application during startup. Wrapping it in `try...catch` allows returning a safe fallback default.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** Why is storing JWT authentication access tokens in `localStorage` an enterprise security vulnerability?  
<details>
<summary><strong>Answer</strong></summary>
`localStorage` is fully accessible to any JavaScript running on the origin. If a third-party npm package, analytics script, or compromised dependency contains a Cross-Site Scripting (XSS) vulnerability, an attacker can read `localStorage.getItem('token')` and exfiltrate the user's credentials immediately. Storing tokens in `HttpOnly; Secure; SameSite=Strict` cookies ensures the browser attaches tokens to HTTP requests while completely preventing JavaScript access via `document.cookie`.
</details>

**Q4:** What are the three essential cookie security flags and what attacks do they mitigate?  
<details>
<summary><strong>Answer</strong></summary>
1. **`HttpOnly`:** Prevents client-side scripts from reading the cookie via `document.cookie` (mitigates XSS token theft).  
2. **`Secure`:** Ensures the cookie is only transmitted over encrypted HTTPS connections (mitigates Man-in-the-Middle eavesdropping).  
3. **`SameSite=Strict` (or `Lax`):** Restricts the cookie from being sent with cross-site requests (mitigates Cross-Site Request Forgery / CSRF).
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** How do you design a client-side storage migration strategy when refactoring data schemas across production deployments?  
<details>
<summary><strong>Answer</strong></summary>
1. **Version Envelope Tagging:** Wrap all persisted values in a metadata envelope: `{ version: 2, data: { ... }, expiresAt: ... }`.  
2. **Sequential Migration Registry:** Maintain a map of migration functions (`migrations = { 1: migrateV1toV2, 2: migrateV2toV3 }`).  
3. **Hydration Pipeline:** When reading from storage, check `envelope.version`. If `envelope.version < CURRENT_VERSION`, loop through sequential migration functions, transform the data, write the new envelope back to storage, and return the migrated state.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How do you architect an enterprise multi-tier storage and offline persistence model that balances main-thread performance, quota management, and zero-trust security?  
<details>
<summary><strong>Answer</strong></summary>
1. **Storage Tiering by Lifecycle & Sensitivity:**  
   - **Auth Credentials:** Store refresh tokens in `HttpOnly; Secure; SameSite=Strict` cookies; keep short-lived access tokens in non-exported JavaScript in-memory closures.  
   - **User UI Settings (<5KB):** Use `localStorage` strictly for non-sensitive theme and layout preferences with schema versioning and namespace prefixes (`app:settings:theme`).  
   - **Heavy / Offline Datasets (>50MB):** Route all large datasets, binary blobs, and cached search indices to **`IndexedDB`** via an asynchronous wrapper (`idb`) to avoid blocking the main UI thread.  
2. **Storage Quota & Eviction Governance:** Monitor `navigator.storage.estimate()` to inspect storage usage and quota limits. Implement an LRU (Least Recently Used) cache eviction policy to purge expired blobs before hitting browser storage limits.  
3. **Multi-Tab Event Mesh:** Listen to `window.addEventListener('storage')` to coordinate global authentication logout and theme synchronization across all open browser windows in real time.
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Schema-Validated Storage Engine

```js
// See runnable implementation in examples/01-browser-storage-lifecycle-security.js
```

---

## Key Takeaways
1. **Never Store Auth Tokens in `localStorage`:** Use `HttpOnly; Secure; SameSite` cookies.
2. **Always Wrap `JSON.parse` with Fallbacks:** Prevent app crashes from corrupt data.
3. **`localStorage` Is Synchronous:** Avoid storing multi-megabyte datasets; use `IndexedDB`.
4. **Embed Schema Versions in Storage:** Plan for migrations across application deployments.
5. **Never Trust Storage for Authorization:** Access control must be validated server-side.

---

[⬅️ KPI 17 — Advanced JavaScript Patterns](../23-Advanced-Design-Patterns/README.md) | [📚 JavaScript Index](../README.md) | [KPI 19 — APIs & Networking ➡️](../19-APIs-Networking-Fetch/README.md)
