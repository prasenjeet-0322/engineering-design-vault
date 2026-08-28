# KPI 23 — Part 01: Factory Pattern & Module Pattern

[⬅️ KPI 22 — Asynchronous JavaScript](../22-Asynchronous-JavaScript/README.md) | [📚 KPI 23 Index](./README.md) | [Part 02: Observer Pattern & Pub/Sub ➡️](./02-observer-pattern-pub-sub.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Design Pattern | Core Problem Solved | Implementation Mechanism | Senior Architectural Standard |
|---|---|---|---|
| **Factory Pattern** | Centralizes, validates, and normalizes object creation. | Pure function returning a new configured object literal. | 🟢 Use for API clients, DTO normalization, and dependency injection without `new`. |
| **Factory + Closures** | Encapsulates true private state without class fields. | Internal `let` variables captured by returned method closures. | 🔵 Ideal for isolated state instances; each call allocates independent lexical memory. |
| **Module Pattern (Classic)** | Restricts global scope pollution and encapsulates private helpers. | Immediately Invoked Function Expression (**IIFE**) returning a public API. | 🟡 Legacy architectural pattern; foundational for understanding closure encapsulation. |
| **Revealing Module Pattern** | Exposes selected internal pointers while hiding implementation details. | Defines all functions internally, returning an object mapping public names to private functions. | 🟢 Keeps module definitions clean and clearly demarcates public contracts from internals. |
| **Native ES Modules** | Replaces IIFEs with file-scoped modules and static `import`/`export`. | Native engine module scope with static analysis and tree-shaking. | 🟢 Modern standard; prefer file-level ES modules over manual runtime IIFE wrappers. |
| **Factory Dependency Injection** | Decouples business logic from concrete infrastructure (APIs, storage). | Factory accepts infrastructure dependencies (e.g. `createService(apiClient)`). | 🟢 Essential for unit testing; enables passing mock clients without global monkey-patching. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: Closure State Desync & IIFE Singletons
> 
> #### Gotcha A: Factory Function Closure State vs Object Property Desync
> *"Why did modifying `user.name = 'Alex'` fail to update the name returned by `user.getName()`?"*  
> ```js
> // ❌ CLOSURE DESYNCHRONIZATION GOTCHA:
> function createUser(name) {
>   return {
>     name, // Object property initialized to 'Sunny'
>     rename(newName) {
>       name = newName; // 💥 Mutates CLOSURE VARIABLE 'name', NOT this.name!
>     },
>     getName() {
>       return name; // 💥 Reads CLOSURE VARIABLE 'name'
>     }
>   };
> }
> 
> const user = createUser("Sunny");
> user.name = "Alex"; // Mutates object property
> console.log("user.name:", user.name);       // "Alex"
> console.log("user.getName():", user.getName()); // 💥 "Sunny" (Desynchronized!)
> ```
> **Deep Architectural Explanation:**  
> When `name` is passed as a factory parameter, it exists in the factory's **lexical environment**. The returned object has an independent own-property `name`. When external code mutates `user.name`, it only changes the object property descriptor. Internal methods that reference the identifier `name` continue reading from the lexical closure variable.  
> **The Senior Standard:** Pick a single source of truth: either rely purely on closure variables (omitting public object properties) or use getters/setters:
> ```js
> // ✅ CONSISTENT CLOSURE ENCAPSULATION:
> function createUser(initialName) {
>   let _name = initialName;
>   return {
>     getName: () => _name,
>     setName: (val) => { _name = val; }
>   };
> }
> ```
> 
> ---
> 
> #### Gotcha B: The Module Pattern IIFE Singleton vs ES Module Singletons
> *"Why did importing an ES module instance share state across files, but calling a classic module function did not?"*  
> ```js
> // Classic IIFE Module (Evaluates ONCE into a global singleton):
> const Store = (() => {
>   let state = 0;
>   return { inc: () => ++state };
> })();
> ```
> **Deep Architectural Explanation:**  
> A classic IIFE executes immediately upon script evaluation, creating a single lexical closure in memory (Singleton). In modern ES Modules, files are evaluated once per module graph; importing `import { store } from './store.js'` shares the same top-level module instance across all importing files. If you need multiple isolated instances, you must export a **Factory Function** (`export function createStore() {}`) rather than a bare module-level singleton object.

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / Next.js / Vite Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Factory functions (`createApiClient`, `createStore`), ES modules, Dependency Injection | Foundational for custom hooks, Redux/Zustand store creators, and API transport wrappers. |
| 🟡 **Moderate** | Used in ~45% of code | Revealing Module Pattern, DTO normalization factories, Closure privacy | Crucial for SDK architecture, third-party libraries, and micro-frontend modular isolation. |
| 🔵 **Foundational / Engine** | Runtime internals | Lexical environment lifetime lifting, V8 Context allocation per factory invocation | Mandatory for Staff/Principal engineering evaluations, memory optimization, and module bundling. |

---

## Core Concepts (20 Subtopics)

### Part 1 — What Is a Design Pattern? Problem-First Mental Model `🟢 [Daily Driver]`

A design pattern is a reusable, language-idiomatic solution to a recurring architectural problem, composed of primitives (functions, closures, objects).

---

### Part 2 — Why Design Patterns Matter in Frontend Architecture `🟢 [Daily Driver]`

Patterns structure code for maintainability, high cohesion, loose coupling, testability, and clear separation of concerns.

---

### Part 3 — What Is the Factory Pattern? `🟢 [Daily Driver]`

The Factory Pattern encapsulates and centralizes object creation behind a function call rather than requiring direct object literals or `new Class()` invocations.

---

### Part 4 — Industry Frequency & Common Use Cases `🟢 [Daily Driver]`

Widely used across major libraries: `createStore()` (Zustand/Redux), `createRouter()` (TanStack Router), `createApiClient()` (Axios/Ky).

---

### Part 5 — Basic Factory Functions `🟢 [Daily Driver]`

```js
function createUser(name, role) {
  return { name, role, createdAt: new Date() };
}
```

---

### Part 6 — Why Object Literals Fall Short for Complex Systems `🟢 [Daily Driver]`

Scattering `{ name: "A", role: "admin" }` across an application duplicates default values, validation rules, and schema changes.

---

### Part 7 — Factory as a Validation & Invariant Guard `🟢 [Daily Driver]`

```js
function createAccount({ id, balance }) {
  if (balance < 0) throw new RangeError("Balance cannot be negative");
  return { id, balance };
}
```

---

### Part 8 — Factory as a Data Normalization Layer (DTO Transformation) `🟢 [Daily Driver]`

Transforms snake_case backend payloads (`user_id`, `created_at`) into clean camelCase frontend domain models (`id`, `createdAt`).

---

### Part 9 — Factory Functions with Closures for True Private State `🔵 [Foundational / Engine]`

Variables declared inside the factory body remain private to returned closure methods, inaccessible from external property lookups:
```js
function createCounter() {
  let count = 0;
  return { increment: () => ++count, getCount: () => count };
}
```

---

### Part 10 — Factory vs Constructor Function (`new` Binding) `🟢 [Daily Driver]`

Factories avoid `this` context loss, do not require the `new` keyword, and return custom object shapes directly.

---

### Part 11 — Factory vs ES6 Class: Lexical Scopes vs Prototype Sharing `🔵 [Foundational / Engine]`

- **Class:** Methods are defined on `Class.prototype` and shared among all instances (Memory Efficient).
- **Factory:** Methods are recreated per factory call and close over local variables (Encapsulation Flexible).

---

### Part 12 — Memory & Performance Tradeoffs `🔴 [Production-Critical]`

When creating $>100,000$ objects in memory, prototype classes consume less memory than factory closures because methods are not duplicated per instance.

---

### Part 13 — What Is the Module Pattern? `🔵 [Foundational / Engine]`

Classic pattern using an IIFE to create private scope, returning a public API object to protect global variables from pollution.

---

### Part 14 — The Revealing Module Pattern `🟢 [Daily Driver]`

```js
const Calculator = (() => {
  const add = (a, b) => a + b;
  const subtract = (a, b) => a - b;
  return { add, subtract }; // Reveals public methods
})();
```

---

### Part 15 — Module Pattern vs Native ES Modules `🟢 [Daily Driver]`

Native ES Modules (`export function ...`) provide file-level scope, static analysis, tree-shaking, and asynchronous module loading natively in the browser.

---

### Part 16 — Module Scope vs Object-Level Privacy `🔵 [Foundational / Engine]`

Top-level unexported variables in an ES module are private to the file, while exported objects/functions define the public contract.

---

### Part 17 — Realistic Frontend Module Organization `🟢 [Daily Driver]`

Organize directories by feature responsibilities (`api/`, `services/`, `ui/`, `storage/`) rather than dumping arbitrary logic into `utils.js`.

---

### Part 18 — The Anti-Pattern of Giant `utils.js` Dumping Grounds `🔴 [Production-Critical]`

Avoid monolith 2,000-line utility files; split into domain-specific modules (`format/date.js`, `validation/user.js`).

---

### Part 19 — Factory + Module Composition: Service Instances with Private State `🟢 [Daily Driver]`

```js
export function createTodoService(apiClient) {
  const todos = [];
  return {
    add: (title) => { const t = { id: Date.now(), title }; todos.push(t); return t; },
    getAll: () => [...todos]
  };
}
```

---

### Part 20 — The 10-Point Senior Factory & Module Audit Checklist `🟢 [Daily Driver]`

```text
1. Is object creation centralized in factories? ──► 2. Are DTOs normalized at API boundaries?
3. Is closure state isolated from object properties? ──► 4. Are native ES modules used over IIFEs?
5. Is dependency injection used for testing? ──► 6. Are giant utils.js files eliminated?
7. Is prototype memory considered for huge collections? ──► 8. Are factory returns explicitly typed?
9. Is public API surface minimal & explicit? ──► 10. Are mock clients easy to substitute?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Pattern / Abstraction | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Factory Functions** | Dynamic object creation, closure encapsulation, DTO normalization. | Creating millions of uniform objects in high-performance engines. | Recreates functions per instance; higher memory footprint. | ES6 Classes / Prototypes. |
| **ES6 Classes** | Large-scale collections, high-frequency instances, strong inheritance hierarchy. | Functional composition pipelines and simple utility services. | `this` binding context loss; rigid inheritance hierarchies. | Factory functions / Object composition. |
| **Revealing Module (IIFE)** | Legacy script bundling without module loaders; global script isolation. | Modern TypeScript/ESM projects. | No tree-shaking; polluting global scope if attached to `window`. | Native ES Modules. |
| **Native ES Modules** | All modern application architecture, services, components, utilities. | Legacy non-modular scripts without build tooling. | Requires bundler or `<script type="module">`. | Bare Factory Functions. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Multi-Tenant API Client & Service Factory in TypeScript
```tsx
import React, { useState, useEffect, useMemo } from 'react';

// ==========================================
// 1. API CLIENT FACTORY & DEPENDENCY INJECTION
// ==========================================
export interface ApiClientConfig {
  baseUrl: string;
  authToken?: string;
}

export interface ApiClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body: any): Promise<T>;
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  const { baseUrl, authToken } = config;

  return {
    async get<T>(path: string): Promise<T> {
      console.log(`[ApiClient]: GET ${baseUrl}${path} (Auth: ${authToken ? 'Present' : 'None'})`);
      // Simulating network delay
      await new Promise((res) => setTimeout(res, 100));
      return { success: true, path, timestamp: Date.now() } as T;
    },

    async post<T>(path: string, body: any): Promise<T> {
      console.log(`[ApiClient]: POST ${baseUrl}${path}`, body);
      await new Promise((res) => setTimeout(res, 100));
      return { success: true, data: body } as T;
    }
  };
}

// ==========================================
// 2. FEATURE SERVICE FACTORY (MODULE ENCAPSULATION)
// ==========================================
export interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface TodoService {
  addTodo(title: string): Promise<TodoItem>;
  getTodos(): TodoItem[];
}

export function createTodoService(apiClient: ApiClient): TodoService {
  // 🟢 Encapsulated Private Module State
  const todos: TodoItem[] = [];

  return {
    async addTodo(title: string): Promise<TodoItem> {
      const newTodo: TodoItem = {
        id: Math.random().toString(36).substring(2, 9),
        title,
        completed: false
      };

      // Sync with injected API dependency
      await apiClient.post('/todos', newTodo);
      todos.push(newTodo);
      return newTodo;
    },

    getTodos(): TodoItem[] {
      return [...todos]; // Return defensive copy
    }
  };
}

// ==========================================
// 3. REACT DASHBOARD CONSUMING FACTORY SERVICE
// ==========================================
export function EnterpriseTodoDashboard() {
  const [todoTitle, setTodoTitle] = useState('');
  const [todoList, setTodoList] = useState<TodoItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // 🟢 Memoized Service Instance with Injected API Client
  const todoService = useMemo(() => {
    const client = createApiClient({ baseUrl: 'https://api.vault.com/v1', authToken: 'JWT_SECURE_TOKEN' });
    return createTodoService(client);
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!todoTitle.trim()) return;

    setIsSyncing(true);
    try {
      await todoService.addTodo(todoTitle);
      setTodoList(todoService.getTodos());
      setTodoTitle('');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="factory-dashboard-card">
      <header className="card-header">
        <h3>Enterprise Factory & Module Service Architecture</h3>
        <span className="badge">💉 Dependency Injected</span>
      </header>

      <p className="architecture-description">
        Demonstrates decoupled object creation via <code>createApiClient</code> and encapsulated service state via <code>createTodoService</code>.
      </p>

      <form onSubmit={handleAdd} className="todo-form">
        <input
          type="text"
          value={todoTitle}
          onChange={(e) => setTodoTitle(e.target.value)}
          placeholder="Enter new architectural task..."
          className="todo-input"
        />
        <button type="submit" disabled={isSyncing} className="submit-btn">
          {isSyncing ? 'Syncing...' : '➕ Add Task'}
        </button>
      </form>

      <ul className="todo-list">
        {todoList.length === 0 && <li className="empty-text">No tasks created yet.</li>}
        {todoList.map((t) => (
          <li key={t.id} className="todo-item">
            <span>{t.title}</span>
            <code className="todo-id">ID: {t.id}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 🧠 Part 01 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: Independent Factory Closures
```js
function createCounter() {
  let count = 0;
  return {
    inc: () => ++count,
    get: () => count
  };
}

const c1 = createCounter();
const c2 = createCounter();

c1.inc();
c1.inc();
c2.inc();

console.log("c1:", c1.get());
console.log("c2:", c2.get());
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
c1: 2
c2: 1
```
**Why:** Each invocation of `createCounter()` allocates a distinct lexical environment in memory with its own independent `count` variable.
</details>

---

### Prediction Challenge 2: Object Property vs Closure Desync
```js
function createRecord(name) {
  return {
    name,
    setName(n) { name = n; },
    getName() { return name; }
  };
}

const r = createRecord("INITIAL");
r.name = "PROPERTY_MUTATED";

console.log("Direct Property:", r.name);
console.log("Closure Getter:", r.getName());
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Direct Property: PROPERTY_MUTATED
Closure Getter: INITIAL
```
**Why:** `r.name` mutates the object property, while `getName()` reads from the closed-over `name` parameter in the factory's lexical scope.
</details>

---

### Prediction Challenge 3: Revealing Module Pattern Mutation
```js
const Module = (() => {
  let value = 10;
  function update(v) { value = v; }
  function read() { return value; }
  return { update, read };
})();

Module.update(50);
console.log("Read Value:", Module.read());
console.log("Direct Access:", Module.value);
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Read Value: 50
Direct Access: undefined
```
**Why:** `value` is a private variable enclosed by the IIFE. It cannot be accessed directly on `Module`, but `update` and `read` manipulate it successfully.
</details>

---

### Prediction Challenge 4: Factory Dependency Injection Substitution
```js
function createService(api) {
  return {
    fetchData: () => api.get("/data")
  };
}

const mockApi = { get: (endpoint) => `MOCK_PAYLOAD from ${endpoint}` };
const service = createService(mockApi);

console.log("Result:", service.fetchData());
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Result: MOCK_PAYLOAD from /data
```
**Why:** The factory receives `api` via dependency injection, allowing seamless unit testing with mock implementations.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What is the Factory Pattern in JavaScript and how does it differ from a constructor?  
<details>
<summary><strong>Answer</strong></summary>
A Factory is a regular function that creates and returns a new object without requiring the `new` keyword. Unlike constructors or ES6 classes that rely on prototype links and `this` binding, factories return explicitly structured objects and can leverage closures for privacy.
</details>

**Q2:** What was the primary motivation behind the classic IIFE Module Pattern?  
<details>
<summary><strong>Answer</strong></summary>
Before native ES Modules, all script tags shared the global `window` scope. The Module Pattern used an Immediately Invoked Function Expression (IIFE) to create private lexical scope, exposing only a public API object to prevent global variable pollution and naming collisions.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** What is the "Revealing Module Pattern" and what are its advantages?  
<details>
<summary><strong>Answer</strong></summary>
The Revealing Module Pattern defines all private variables and functions inside a module/closure first, and returns an object literal exposing pointers to selected functions.  
**Advantages:**  
1. Clear syntax with clean separation of implementation and public interface.  
2. Consistent syntax across all function definitions.  
3. Prevents external code from tampering with unexposed helpers.
</details>

**Q4:** What are the performance and memory tradeoffs of Factory Functions vs ES6 Classes?  
<details>
<summary><strong>Answer</strong></summary>
- **ES6 Classes:** Methods live on `Class.prototype`. All instances share references to the same method functions in memory ($\mathcal{O}(1)$ method memory).  
- **Factory Functions:** Each factory invocation creates new function closures for every method on the returned object ($\mathcal{O}(N)$ method memory). While factories provide closure privacy, classes are more memory-efficient when instantiating tens of thousands of objects.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** How do you implement Dependency Injection using Factory Functions, and why is it superior to hardcoded module imports for testability?  
<details>
<summary><strong>Answer</strong></summary>
By designing factory functions to accept infrastructure dependencies as arguments (e.g. `createUserService({ apiClient, storage })`), the service depends only on an interface contract rather than a concrete singleton. In unit tests, developers can pass lightweight mock objects without needing complex global mocking libraries (like `jest.mock()` or monkey-patching).
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How do modern V8 optimizations handle lexical context allocation in Factory Functions vs Prototype Hidden Classes in ES6 Classes?  
<details>
<summary><strong>Answer</strong></summary>
1. **Factory Context Lifting:** When a factory returns closures, V8 creates a `Context` heap object containing all captured variables. Unused variables are pruned via static AST escape analysis, but captured variables persist in the Context heap as long as any returned closure is reachable. Each instance has its own unique Context and Map (hidden class) unless shapes are identical.  
2. **Class Shape Sharing:** ES6 classes leverage V8's prototype transitions and hidden classes (Maps). Since methods reside on the constructor's prototype, instances share identical initial Maps and inline caches (ICs), enabling V8's TurboFan compiler to optimize property access via monomorphic call sites.
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Modular Todo & Analytics Service Factory

```js
// See runnable implementation in examples/01-factory-pattern-module-pattern.js
```

---

## Key Takeaways
1. **Factories Centralize Creation:** Normalize API DTOs and enforce validation rules.
2. **Closures Provide Privacy:** Keep sensitive state out of public object properties.
3. **Prefer ES Modules over IIFEs:** Leverage native file boundaries and tree-shaking.
4. **Use Dependency Injection:** Pass dependencies to factories for simple unit testing.
5. **Beware Closure Desync:** Ensure methods and properties share a single source of truth.

---

[⬅️ KPI 22 — Asynchronous JavaScript](../22-Asynchronous-JavaScript/README.md) | [📚 KPI 23 Index](./README.md) | [Part 02: Observer Pattern & Pub/Sub ➡️](./02-observer-pattern-pub-sub.md)
