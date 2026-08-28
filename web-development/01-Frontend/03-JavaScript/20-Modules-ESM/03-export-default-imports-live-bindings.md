# KPI 20 — Part 03: `export default`, Import Patterns & Choosing the Right Module API

[⬅️ Part 02: `export`, Named Exports & Designing a Module's Public API](./02-export-declarations-named-exports.md) | [📚 KPI 20 Index](./README.md) | [Part 04: Dependency Structure & Production Module Architecture ➡️](./04-dependency-structure-production-architecture.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Import / Export Pattern | Syntax Example | Core Architectural Role | Senior Production Standard |
|---|---|---|---|
| **Default Export** | `export default class UserService {}` | Designates the primary single abstraction of a module. | 🟡 Use for single React components, Next.js page routes, or dynamic lazy chunks. |
| **Default Import** | `import UserService from './UserService.js';` | Consumed without braces; importer chooses local name. | 🔴 Enforce consistent naming conventions across the team to avoid renaming drift. |
| **Combined Export** | `import request, { parseData } from './api.js';` | Primary default entity paired with secondary named helpers. | 🟢 Ideal for client SDKs where the default is the client instance and named exports are utilities. |
| **Namespace Import** | `import * as MathUtils from './math.js';` | Groups all named exports under a single object dictionary. | 🟡 Useful for mathematical or date toolkits; beware of potential tree-shaking bailouts. |
| **Side-Effect Import** | `import './polyfills.js';` | Evaluates module top-level code without importing bindings. | 🔴 Restrict to global CSS, polyfills, or telemetry setup; never hide business logic. |
| **Dynamic `import()`** | `const { Chart } = await import('./chart.js');` | Asynchronously loads modules on demand for code splitting. | 🟢 Essential for lazy-loading heavy routes, modals, and third-party libraries. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: Renaming Drift & Namespace Tree-Shaking Bailouts
> 
> #### Gotcha A: The "Renaming Drift" Trap in Default Exports
> *"Why did searching for `UserAvatarCard` across our codebase miss 12 component files that imported it under different names?"*  
> ```js
> // UserAvatarCard.jsx
> export default function UserAvatarCard() { /* ... */ }
> 
> // FileA.jsx
> import UserAvatarCard from "./UserAvatarCard"; // Name 1
> 
> // FileB.jsx
> import Avatar from "./UserAvatarCard"; // 💥 Name 2
> 
> // FileC.jsx
> import UserCard from "./UserAvatarCard"; // 💥 Name 3
> ```
> **Deep Architectural Explanation:**  
> Default exports have no fixed public name binding in the consumer's scope. The importing module is free to assign any arbitrary identifier (`import Foo from './UserAvatarCard'`). In large codebases (50+ engineers), different developers invent different local names for the same component, making global grep searches, automated AST refactoring, and code reviews brittle and error-prone.  
> **The Senior Standard:** Enforce named exports by default across domain services and utility libraries, restricting default exports to file-based routing frameworks (Next.js pages/routes):
> ```js
> // ✅ CONSISTENT NAMED EXPORT:
> export function UserAvatarCard() { /* ... */ }
> // Every consumer is forced to write: import { UserAvatarCard } from "./UserAvatarCard";
> ```
> 
> ---
> 
> #### Gotcha B: Unintended Tree-Shaking Bailout via Namespace Imports
> *"Why did using `import * as Lodash` increase our production bundle by 70KB when we only called `Lodash.debounce`?"*  
> ```js
> // ❌ NAMESPACE IMPORT TREE-SHAKING TRAP:
> import * as Utils from "./utils.js";
> 
> export function calculate() {
>   return Utils.formatCurrency(100);
>   // 💥 If Utils is passed to a function or indexed dynamically (Utils[fnName]),
>   // bundlers cannot statically prove unused exports and bundle ALL of utils.js!
> }
> ```
> **Deep Architectural Explanation:**  
> `import * as` creates a module namespace exotic object containing every exported identifier. While modern bundlers (Rollup/Webpack 5) can tree-shake static property accesses (`Utils.formatCurrency`), any dynamic property lookup, object spreading, or passing `Utils` as an argument bails out of Dead Code Elimination (DCE), forcing the bundler to include the entire module in the production bundle.  
> **The Senior Standard:** Use explicit named imports for high-value tree-shaking:
> ```js
> // ✅ EXPLICIT NAMED IMPORT:
> import { formatCurrency } from "./utils.js"; // 🟢 Guaranteed tree-shaking
> ```

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / Next.js / Vite Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Named imports (`import { a }`), Default exports for pages/components, Dynamic `import()` | Fundamental for authoring React components, Next.js routing, and organizing libraries. |
| 🟡 **Moderate** | Used in ~45% of code | Namespace imports (`import * as`), Combined default + named imports, Import aliasing (`as`) | Crucial for large utility toolkits (Lucide icons, Date-fns, Three.js) and code-splitting architectures. |
| 🔵 **Foundational / Engine** | Runtime internals | Module Namespace Exotic Objects, Live binding evaluation under the hood, AST tree-shaking | Mandatory for Staff/Principal engineering evaluations, bundler optimization, and package design. |

---

## Core Concepts (20 Subtopics)

### Part 1 — What Is a Default Export? `🟢 [Daily Driver]`

A default export designates the primary, single abstraction of a module (`export default class App {}`).

---

### Part 2 — Default Export Syntax Variations `🟢 [Daily Driver]`

- **Functions:** `export default function Button() {}`
- **Classes:** `export default class ApiService {}`
- **Expressions & Literals:** `export default { theme: 'dark' };`

---

### Part 3 — The One Default Export Invariant `🟢 [Daily Driver]`

A module can contain only **one** default export statement. Attempting to define multiple default exports in the same file throws a compile-time `SyntaxError`.

---

### Part 4 — Default Import Syntax: No Braces & Local Naming `🟢 [Daily Driver]`

Default exports are imported without curly braces (`import Button from './Button.js'`). The importer decides the local identifier name.

---

### Part 5 — Named vs Default Exports: Architectural Comparison `🟢 [Daily Driver]`

| Attribute | Named Exports | Default Exports |
|---|---|---|
| **Export Count** | Unlimited per module | Maximum 1 per module |
| **Import Syntax** | `import { a, b } from './mod'` | `import a from './mod'` |
| **Contract Name** | Enforced by exporting module | Chosen arbitrarily by importer |
| **Tree-Shaking** | Optimal / Direct | Can require bundler property analysis |
| **Refactoring** | Automatic across IDEs | Prone to renaming drift |

---

### Part 6 — When to Use Default Exports `🟢 [Daily Driver]`

Use default exports when a file represents a single cohesive entity: React root components, Next.js page routes, and dynamic lazy-loaded modal chunks.

---

### Part 7 — When Named Exports Are Superior `🟢 [Daily Driver]`

Use named exports for utility libraries (`math.js`), API service collections (`usersApi.js`), and design system token packages (`colors.js`).

---

### Part 8 — Consistency Over Preference: Eliminating Renaming Drift `🟢 [Daily Driver]`

Establish a repository-wide standard: use named exports for all internal utilities and services to guarantee identical naming across hundreds of files.

---

### Part 9 — Combining Default and Named Exports in a Single Module `🟢 [Daily Driver]`

```js
// client.js
export default function createClient() {} // Primary default
export const VERSION = "2.0.0";           // Secondary named
export function validateConfig() {}      // Secondary named
```

---

### Part 10 — Importing Default and Named Bindings Simultaneously `🟢 [Daily Driver]`

```js
import createClient, { VERSION, validateConfig } from "./client.js";
```

---

### Part 11 — Namespace Imports: `import * as Namespace` `🟢 [Daily Driver]`

```js
import * as DateUtils from "./dateUtils.js";
DateUtils.format(new Date());
DateUtils.parse("2026-08-27");
```

---

### Part 12 — Namespace Import Tradeoffs & Tree-Shaking Hazards `🔴 [Production-Critical]`

Namespace imports improve domain grouping (`MathUtils.add()`), but dynamic indexing (`MathUtils[fn]`) completely breaks tree-shaking dead code elimination.

---

### Part 13 — Side-Effect Imports: Execution Without Bindings `🟢 [Daily Driver]`

```js
import "./global.css";
import "./initTelemetry.js";
```
Evaluates the module's top-level statements without binding any exported identifiers in the importer.

---

### Part 14 — Architectural Hazards of Implicit Side-Effect Dependencies `🔴 [Production-Critical]`

Avoid using side-effect imports for core business logic. Side-effect execution order is implicit and makes data flow impossible to trace.

---

### Part 15 — Import Aliasing with `as` `🟢 [Daily Driver]`

```js
import { format as formatUser } from "./userUtils.js";
import { format as formatOrder } from "./orderUtils.js";
```
Eliminates namespace collisions when importing identical identifier names from different modules.

---

### Part 16 — Syntax Trap Analysis `🟢 [Daily Driver]`

- **Trap 1:** `import { Button } from './Button'` when `Button` was exported as `default` (throws `SyntaxError` or undefined).
- **Trap 2:** `import getUser from './users'` when `getUser` was exported as named (imports undefined or wrong default).

---

### Part 17 — Framework Conventions: React, Next.js & TypeScript `🟢 [Daily Driver]`

- **Next.js Pages/App Router:** Requires `export default function Page()` for route discovery.
- **`React.lazy()`:** Requires modules with default exports (`const Modal = lazy(() => import('./Modal'))`).

---

### Part 18 — Dynamic `import()`: Asynchronous On-Demand Code Splitting `🟢 [Daily Driver]`

```js
const module = await import("./heavyChart.js");
module.renderChart();
```
Returns a `Promise<ModuleNamespace>` that downloads and evaluates the script chunk only when executed.

---

### Part 19 — Module Import Maps in Native Browsers `🔵 [Foundational / Engine]`

HTML `<script type="importmap">` allows mapping bare specifiers (`import React from 'react'`) to CDN URLs without a bundler.

---

### Part 20 — The 6-Question Export Strategy Decision Framework `🟢 [Daily Driver]`

```text
1. Is it a Next.js/React.lazy file? ──► Default Export
2. Is it a multi-utility module? ──► Named Exports
3. Are identifiers colliding? ──► Import Aliasing (as)
4. Is it a grouped toolkit? ──► Namespace Import (* as)
5. Is it a CSS/Polyfill setup? ──► Side-Effect Import
6. Is it a heavy on-demand chunk? ──► Dynamic import()
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Import / Export Style | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Named Exports (`export { a }`)** | Utility libraries, services, shared components, hooks. | Framework files requiring default export discovery (Next.js). | Requires explicit `{}` import syntax. | Default exports. |
| **Default Exports (`export default`)** | Single primary React components, Next.js route handlers. | Multi-utility toolkits (`math.js`, `stringUtils.js`). | Importer naming drift; harder grep/refactoring. | Named exports. |
| **Namespace Import (`import * as`)** | Grouped toolkits (`DateUtils`, `LucideIcons`, `Three`). | When importing only 1 small function from a 500KB library. | Potential tree-shaking bailouts if dynamically indexed. | Named imports. |
| **Dynamic `import()`** | Lazy loading heavy modals, rich editors, and secondary routes. | Critical above-the-fold landing page rendering logic. | Introduces asynchronous network loading delay on click. | Static static `import`. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Component Module with Default, Named Variants & Dynamic Lazy Loader in TypeScript
```tsx
import React, { useState, Suspense, lazy } from 'react';

// ==========================================
// 1. PRIMARY COMPONENT (DEFAULT EXPORT) & VARIANTS (NAMED EXPORTS)
// ==========================================
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export function ButtonVariantIcon({ variant }: { variant: ButtonProps['variant'] }) {
  if (variant === 'danger') return <span>🚨</span>;
  if (variant === 'secondary') return <span>⚙️</span>;
  return <span>🚀</span>;
}

export default function EnterpriseButton({ variant = 'primary', children, ...rest }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} {...rest}>
      <ButtonVariantIcon variant={variant} />
      <span className="btn-label">{children}</span>
    </button>
  );
}

// ==========================================
// 2. DYNAMIC CODE-SPLIT LAZY LOADED COMPONENT
// ==========================================
// Simulating an asynchronous dynamic import chunk
const LazyHeavyAnalyticsChart = lazy(async () => {
  // Simulating network delay for chunk download
  await new Promise((res) => setTimeout(res, 500));
  return {
    default: function AnalyticsChart() {
      return (
        <div className="chart-chunk-box">
          <h4>📊 Dynamic Analytics Chart Chunk (Loaded On-Demand)</h4>
          <p>Bundle Payload: <strong>48KB Chunk</strong> | Rendered: <code>{new Date().toLocaleTimeString()}</code></p>
        </div>
      );
    }
  };
});

// ==========================================
// 3. REACT DASHBOARD CONSUMING EXPORT PATTERNS
// ==========================================
export function EnterpriseModulePatternsDashboard() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div className="module-patterns-card">
      <header className="card-header">
        <h3>Enterprise Export Patterns & Dynamic Code-Splitting</h3>
        <span className="badge">📦 Default + Named + Lazy ESM</span>
      </header>

      <p>Demonstrates primary default export consumption, named variant helpers, and dynamic on-demand code splitting.</p>

      <div className="actions-bar">
        <EnterpriseButton variant="primary" onClick={() => setShowChart((p) => !p)}>
          {showChart ? 'Hide Analytics' : 'Load Heavy Chart (Dynamic ESM)'}
        </EnterpriseButton>
        <EnterpriseButton variant="secondary" onClick={() => alert('Secondary Action')}>
          Secondary Settings
        </EnterpriseButton>
      </div>

      {showChart && (
        <Suspense fallback={<p className="loading-state">⏳ Downloading dynamic ESM chunk...</p>}>
          <LazyHeavyAnalyticsChart />
        </Suspense>
      )}
    </div>
  );
}
```

---

## 🧠 Part 03 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: Combined Default and Named Import
```js
// service.mjs
export default function primaryService() { return "PRIMARY_DATA"; }
export const SERVICE_VERSION = "2.5.0";
export function helper() { return "HELPER_DATA"; }

// app.mjs
import primary, { SERVICE_VERSION, helper } from "./service.mjs";

console.log("Default Result:", primary());
console.log("Named Version:", SERVICE_VERSION);
console.log("Named Helper:", helper());
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Default Result: PRIMARY_DATA
Named Version: 2.5.0
Named Helper: HELPER_DATA
```
**Why:** The default export is bound to the identifier outside braces (`primary`), while named exports are unpacked from within curly braces (`SERVICE_VERSION`, `helper`).
</details>

---

### Prediction Challenge 2: Namespace Import Object Inspection
```js
// math.mjs
export function add(a, b) { return a + b; }
export function sub(a, b) { return a - b; }

// app.mjs
import * as MathOps from "./math.mjs";

console.log("Namespace Keys:", Object.keys(MathOps).sort());
console.log("Calculation:", MathOps.add(5, 10));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Namespace Keys: [ 'add', 'sub' ]
Calculation: 15
```
**Why:** `import * as MathOps` creates a module namespace object whose keys correspond to all exported named bindings.
</details>

---

### Prediction Challenge 3: Default Object Property Mutation
```js
// state.mjs
export default { counter: 10 };

// consumerA.mjs
import stateObj from "./state.mjs";
stateObj.counter = 20;

// consumerB.mjs
import stateObj from "./state.mjs";
console.log("Observed Counter in B:", stateObj.counter);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Observed Counter in B: 20
```
**Why:** Both consumers receive references to the same evaluated default object instance in memory; mutating properties in consumer A affects consumer B.
</details>

---

### Prediction Challenge 4: Dynamic `import()` Execution Order
```js
async function runLazy() {
  console.log("1. Before Dynamic Import");
  const mathMod = await Promise.resolve({ add: (a, b) => a + b });
  console.log("2. Result:", mathMod.add(3, 4));
}
runLazy();
console.log("3. Synchronous Flow Continues");
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
1. Before Dynamic Import
3. Synchronous Flow Continues
2. Result: 7
```
**Why:** Dynamic `import()` is asynchronous. The call frame yields execution to synchronous statements before resolving the dynamic module in the microtask queue.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is the syntax difference between importing a default export and a named export?  
<details>
<summary><strong>Answer</strong></summary>
A default export is imported without curly braces and can be given any arbitrary local name (`import MyComponent from './Component.js'`). Named exports must be enclosed in curly braces matching their exact exported identifier names (`import { MyComponent } from './Component.js'`), unless explicitly renamed using `as`.
</details>

**Q2:** Can a module have multiple default exports?  
<details>
<summary><strong>Answer</strong></summary>
No. An ES Module can have at most **one** default export. Attempting to declare multiple `export default` statements in the same file results in a compile-time `SyntaxError: Only one default export allowed per module`.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** What is a Namespace Import (`import * as`), and what is its primary performance tradeoff?  
<details>
<summary><strong>Answer</strong></summary>
A Namespace Import aggregates all named exports from a module into a single Module Namespace Object (`import * as MathUtils from './math.js'`).  
**Tradeoff:** If the namespace object is dynamically indexed (`MathUtils[dynamicKey]`) or passed to other functions as a variable, bundlers cannot statically determine which functions are unused, bailing out of tree-shaking dead code elimination and increasing bundle size.
</details>

**Q4:** What is a Side-Effect Import (`import './setup.js'`) and when should it be used?  
<details>
<summary><strong>Answer</strong></summary>
A Side-Effect Import loads and executes a module's top-level statements without binding any exported identifiers to local variables. It should be used strictly for initializing global CSS stylesheets, registering polyfills, configuring monitoring SDKs, or setting up global event listeners.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** Why do many enterprise frontend teams enforce a "Named Exports Only" convention across application codebases?  
<details>
<summary><strong>Answer</strong></summary>
1. **Elimination of Renaming Drift:** Named exports force every consumer to use identical identifier names, preventing inconsistent local naming across files.  
2. **Superior Refactoring Support:** Automated IDE refactoring (Rename Symbol) reliably updates all import sites across the repository.  
3. **Flawless Code Navigation:** Global grep searches for `functionName` instantly reveal all usages without missing misnamed default imports.  
4. **Optimal Tree-Shaking:** Guarantees unambiguous AST export tracking for dead code elimination in bundlers.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How do you architect a high-performance, dynamic module-loading subsystem that supports route-based code splitting, predictive prefetching, and resilient network retry fallbacks?  
<details>
<summary><strong>Answer</strong></summary>
1. **Dynamic `import()` Facades:** Wrap route chunks in lazy factory functions (`const AdminRoute = () => import('@features/admin')`).  
2. **Predictive Prefetching:** On link hover or viewport intersection (`IntersectionObserver`), execute `const prefetch = () => import(...)` to download the chunk into the browser cache before user navigation.  
3. **Resilient Chunk Retry Wrapper:** Intercept dynamic import failures (e.g. when a new deployment invalidates old chunk hashes) with an exponential backoff wrapper:
   ```ts
   function lazyRetry(importFn: () => Promise<any>, retries = 2) {
     return new Promise((resolve, reject) => {
       importFn()
         .then(resolve)
         .catch((err) => {
           if (retries > 0) setTimeout(() => lazyRetry(importFn, retries - 1).then(resolve, reject), 1000);
           else window.location.reload(); // Force full reload to fetch new HTML entry chunk
         });
     });
   }
   ```
4. **Webpack/Vite Magic Comments:** Leverage `/* webpackChunkName: "admin" */` and `/* webpackPrefetch: true */` for optimized asset bundling.
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Modular Engine Demonstrating All Import/Export Patterns

```js
// See runnable implementation in examples/03-export-default-imports-live-bindings.mjs
```

---

## Key Takeaways
1. **Default Exports = Primary Entity:** Maximum 1 per module; imported without braces.
2. **Named Exports = Specific Capabilities:** Enforces repository-wide naming consistency.
3. **Avoid Renaming Drift:** Prefer named exports for utilities, services, and shared libraries.
4. **Namespace Imports Can Break Tree-Shaking:** Avoid dynamic indexing on `import * as`.
5. **Use Dynamic `import()` for Heavy Chunks:** Split bundles to accelerate initial page load.

---

[⬅️ Part 02: `export`, Named Exports & Designing a Module's Public API](./02-export-declarations-named-exports.md) | [📚 KPI 20 Index](./README.md) | [Part 04: Dependency Structure & Production Module Architecture ➡️](./04-dependency-structure-production-architecture.md)
