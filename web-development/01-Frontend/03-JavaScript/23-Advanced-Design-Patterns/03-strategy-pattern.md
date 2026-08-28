# KPI 23 — Part 03: Strategy Pattern & Dynamic Algorithms

[⬅️ Part 02: Observer Pattern & Pub/Sub Architecture](./02-observer-pattern-pub-sub.md) | [📚 KPI 23 Index](./README.md) | [Part 04: Composition vs Inheritance Architecture ➡️](./04-composition-vs-inheritance.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Strategy Pattern Concept | Mechanism & Implementation | Core Production Rule | Senior Architectural Standard |
|---|---|---|---|
| **Strategy Pattern** | Defines a family of interchangeable algorithms conforming to a common contract. | Eliminates growing monolithic `if/else` or `switch` ladders. | 🟢 Use when algorithms evolve independently (Validation, Payment, Pricing, Sorting). |
| **Strategy Dictionary** | Object or `Map` mapping string keys to strategy functions: `strategies[type](data)`. | Functions are first-class values; lookups operate in $\mathcal{O}(1)$ time. | 🟢 Ideal for JavaScript; avoids heavy abstract classes when pure functions suffice. |
| **Uniform Contract** | All strategy implementations accept identical inputs and return identical shapes. | Guarantees runtime polymorphism without breaking caller expectations. | 🔴 **CRITICAL:** Never allow one strategy to return a boolean while another returns an object. |
| **Strategy + Dependency Injection** | Pass the strategy function into a factory or service constructor at initialization. | Decouples business workflows from specific third-party providers (Stripe/PayPal). | 🟢 Enables effortless mocking during automated integration and unit testing. |
| **Open/Closed Principle (OCP)** | Adding a new algorithm requires registering a new strategy, without modifying core logic. | Keeps stable core orchestration code closed to risky modifications. | 🔵 New feature delivery becomes strictly additive (low regression risk). |
| **Fallback & Error Handling** | Strategy lookup provides a default fallback or throws a descriptive `UnsupportedStrategyError`. | Prevents `TypeError: strategies[type] is not a function` runtime crashes. | 🟢 Always validate key presence via `strategies[type] ?? fallbackStrategy`. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotchas: Inconsistent Contracts & Strategy Explosion
> 
> #### Gotcha A: Inconsistent Strategy Return Contracts (Polymorphism Breakage)
> *"Why did adding a new Password Validation Strategy cause our registration form to crash in production?"*  
> ```js
> // ❌ INCONSISTENT STRATEGY CONTRACTS:
> const validators = {
>   email: (val) => val.includes("@"), // 💥 Returns primitive boolean!
>   password: (val) => ({ valid: val.length >= 8, error: "Too short" }), // 💥 Returns object!
>   username: (val) => { if (val.length < 3) throw new Error("Too short"); } // 💥 Throws exception!
> };
> 
> // Caller expects a uniform interface:
> function validateField(type, val) {
>   const res = validators[type](val);
>   // 💥 CRASH: res.valid fails on boolean (undefined), fails on thrown exception!
>   if (!res.valid) showError(res.error);
> }
> ```
> **Deep Architectural Explanation:**  
> The entire premise of the Strategy Pattern relies on **Substitutability** (Liskov Substitution Principle). If strategies return divergent data shapes or employ inconsistent error mechanisms, the caller is forced to re-introduce messy `typeof` checks and `try/catch` blocks, completely defeating the purpose of the abstraction.  
> **The Senior Standard:** Enforce a strict, uniform return contract across all strategy implementations:
> ```js
> // ✅ UNIFORM STRATEGY CONTRACT:
> // Contract: (value: string) => { isValid: boolean; errorMessage?: string }
> const validators = {
>   email: (val) => ({ isValid: val.includes("@"), errorMessage: val.includes("@") ? undefined : "Invalid email" }),
>   password: (val) => ({ isValid: val.length >= 8, errorMessage: val.length >= 8 ? undefined : "Password too short" })
> };
> ```
> 
> ---
> 
> #### Gotcha B: Over-Engineering Trivial Conditionals (Pattern Explosion)
> *"Why was a candidate rejected for using the Strategy Pattern to toggle a modal loading spinner?"*  
> ```js
> // ❌ RIDICULOUS OVERENGINEERING:
> const modalRenderStrategies = {
>   loading: () => <Spinner />,
>   ready: () => <ModalContent />
> };
> function renderModal(state) {
>   return modalRenderStrategies[state](); // 💥 Unnecessary indirection for a binary boolean!
> }
> ```
> **Deep Architectural Explanation:**  
> The Strategy Pattern should only be introduced when there is genuine **behavioral complexity, independent extensibility, or multiple interchangeable algorithms**. Replacing a simple ternary (`isLoading ? <Spinner /> : <Content />`) with a strategy dictionary increases cognitive load, bloats bundle size, and creates pointless indirection.

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React / Next.js / Vite Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of code | Form validation dictionaries, Dynamic sorting/filtering, Payment gateway selection | Fundamental for building extensible form libraries, e-commerce checkout flows, and table sorting. |
| 🟡 **Moderate** | Used in ~45% of code | Dynamic component registries, Authentication provider strategies, Dynamic formatters | Crucial for CMS renderers, multi-tenant auth integrations, and localized currency/date engines. |
| 🔵 **Foundational / Engine** | Runtime internals | $\mathcal{O}(1)$ Object hash lookups, Monomorphic inline caches in V8, Open/Closed Principle | Mandatory for Staff/Principal engineering evaluations, plugin architectures, and SDK design. |

---

## Core Concepts (20 Subtopics)

### Part 1 — What Is the Strategy Pattern? Interchangeable Family of Algorithms `🟢 [Daily Driver]`

The Strategy Pattern encapsulates related algorithms behind a common interface, allowing the algorithm to vary independently from the clients that use it.

---

### Part 2 — The Problem Before Strategy: Monolithic `if/else` & `switch` Ladders `🟢 [Daily Driver]`

Growing `switch(type)` statements become fragile, violate the Single Responsibility Principle, and create high regression risk during updates.

---

### Part 3 — Basic Strategy Pattern: Object Dictionary Lookups `🟢 [Daily Driver]`

```js
const shippingStrategies = {
  standard: (order) => order.weight * 2,
  express: (order) => order.weight * 5,
  overnight: (order) => order.weight * 10 + 20
};
const calculateShipping = (type, order) => (shippingStrategies[type] ?? shippingStrategies.standard)(order);
```

---

### Part 4 — The Core Heuristic: "How Should This Operation Be Performed?" `🟢 [Daily Driver]`

Apply Strategy whenever an operation has multiple valid execution paths (e.g. How to sort? How to charge? How to validate?).

---

### Part 5 — Industry Frequency & Modern Implementations `🟢 [Daily Driver]`

Commonly seen in table sorting (`sortStrategies[column](a, b)`), authentication providers (`authStrategies[provider](creds)`), and dynamic form widgets.

---

### Part 6 — Functional Strategies: First-Class Functions as Strategy Units `🟢 [Daily Driver]`

In JavaScript, functions are values. You do not need Java-style Strategy classes; pure functions stored in objects/Maps provide clean, lightweight strategies.

---

### Part 7 — When to Use Strategy vs When to Keep a Simple `switch` `🟢 [Daily Driver]`

- **Keep `switch`:** 2–3 static, unchanging cases with simple logic.
- **Use Strategy:** 4+ complex, independently growing algorithms or dynamic plugin extensibility.

---

### Part 8 — Form Validation Strategies `🟢 [Daily Driver]`

```js
const validators = {
  required: (val) => ({ isValid: Boolean(val), message: "Field required" }),
  email: (val) => ({ isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), message: "Invalid email" }),
  minLength: (min) => (val) => ({ isValid: val.length >= min, message: `Min ${min} chars` })
};
```

---

### Part 9 — The Strategy Interface: Enforcing Uniform Behavioral Contracts `🔵 [Foundational / Engine]`

All strategies in a family must accept identical parameters and return matching payload structures.

---

### Part 10 — TypeScript Strategy Typing `🟢 [Daily Driver]`

```ts
type Strategy<TInput, TOutput> = (input: TInput) => TOutput;
type PaymentStrategy = Strategy<Order, Promise<PaymentResult>>;
const paymentStrategies: Record<PaymentMethod, PaymentStrategy> = { ... };
```

---

### Part 11 — Authentication Provider Strategies `🟢 [Daily Driver]`

Encapsulates OAuth redirects, token exchanges, and profile fetching for Google, GitHub, and Enterprise SSO behind a single `authenticate(provider, creds)` function.

---

### Part 12 — Strategy Pattern Paired with Dependency Injection `🟢 [Daily Driver]`

```js
function createCheckoutEngine(paymentStrategy, shippingStrategy) {
  return {
    process: (order) => paymentStrategy(order) + shippingStrategy(order)
  };
}
```

---

### Part 13 — Dynamic Notification Channel Strategies `🟢 [Daily Driver]`

Encapsulates `EmailNotificationStrategy`, `SMSNotificationStrategy`, and `PushNotificationStrategy` under a unified `send(msg)` contract.

---

### Part 14 — Runtime Dynamic Strategy Selection `🟢 [Daily Driver]`

Allows users to select sort order (`price-asc`, `rating-desc`, `newest`) by mapping UI select values directly to sort strategy functions: `products.sort(sorters[sortType])`.

---

### Part 15 — Strategy Pattern in React: Dynamic Component Registries `🟢 [Daily Driver]`

```jsx
const fieldRenderers = { text: TextInput, select: SelectInput, date: DatePicker };
function DynamicFormField({ type, ...props }) {
  const Component = fieldRenderers[type] ?? FallbackInput;
  return <Component {...props} />;
}
```

---

### Part 16 — Strategy vs Conditional Rendering: Avoiding Premature Abstraction `🔴 [Production-Critical]`

Never use strategies for simple binary loading or error state toggles.

---

### Part 17 — The Open/Closed Principle (OCP) `🔵 [Foundational / Engine]`

Core orchestrators remain closed for modification; developers add new capabilities simply by registering a new strategy function in the dictionary.

---

### Part 18 — Dynamic Strategy Registries for Plugin Systems `🟢 [Daily Driver]`

```js
class StrategyRegistry {
  #strategies = new Map();
  register(key, strategy) { this.#strategies.set(key, strategy); }
  execute(key, ...args) {
    const s = this.#strategies.get(key);
    if (!s) throw new Error(`Strategy not found: ${key}`);
    return s(...args);
  }
}
```

---

### Part 19 — Strategy vs Factory vs State Pattern `🔵 [Foundational / Engine]`

- **Factory:** Focuses on *object creation* (`createInstance()`).
- **Strategy:** Focuses on *algorithm execution* (`executeAlgorithm()`).
- **State:** Focuses on *internal lifecycle transitions* (`transitionToState()`).

---

### Part 20 — The 10-Point Senior Strategy Pattern Audit Checklist `🟢 [Daily Driver]`

```text
1. Do all strategies share a uniform contract? ──► 2. Is there a safe fallback for unknown keys?
3. Are pure functions used instead of classes where possible? ──► 4. Is the strategy dictionary typed?
5. Is dependency injection supported for testing? ──► 6. Is premature abstraction avoided for simple ifs?
7. Are side-effects minimized inside strategies? ──► 8. Are strategy keys validated at runtime?
9. Is OCP preserved for future extensions? ──► 10. Are complex parameters passed via structured objects?
```

---

## ⚖️ 4-Pillar Senior Engineering Decision Matrix

| Algorithm Organization | 1. When to Use | 2. When NOT to Use | 3. Bottlenecks & Tradeoffs | 4. Modern Alternatives |
|---|---|---|---|---|
| **Strategy Dictionary (Object/Map)** | 3+ interchangeable algorithms, dynamic plugin registries, form validators. | Simple 2-state binary conditions (`if/else`). | Minimal; requires maintaining uniform return contracts. | Monolithic `switch`. |
| **Monolithic `switch/case`** | Fixed, closed sets of 2–3 static branches that never change. | Extensible systems where third parties or new modules add algorithms. | Violates OCP; large functions become hard to unit test. | Strategy Object. |
| **Class Polymorphism (`extends`)** | Heavy OOP architectures with extensive shared private state and inheritance. | Lightweight JavaScript functional pipelines. | Verbose; requires class boilerplate and instantiation overhead. | Functional Strategies. |
| **Higher-Order Function Pipes** | Sequential transformation pipelines (data processing, middleware chains). | Mutually exclusive branching where only 1 algorithm runs. | Harder to debug if intermediate pipeline steps fail silently. | Strategy Selection. |

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### Enterprise Multi-Payment & Dynamic Checkout Strategy Engine in TypeScript
```tsx
import React, { useState, useMemo } from 'react';

// ==========================================
// 1. UNIFORM STRATEGY CONTRACT & TYPES
// ==========================================
export interface OrderPayload {
  orderId: string;
  amount: number;
  currency: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  errorMessage?: string;
}

export type PaymentStrategyFn = (order: OrderPayload) => Promise<PaymentResult>;

// ==========================================
// 2. CONCRETE STRATEGY IMPLEMENTATIONS
// ==========================================
export const paymentStrategies: Record<string, PaymentStrategyFn> = {
  STRIPE: async (order) => {
    console.log(`[StripeStrategy]: Processing Credit Card payment for $${order.amount}`);
    await new Promise((res) => setTimeout(res, 120));
    return { success: true, transactionId: `ch_stripe_${Date.now()}` };
  },

  PAYPAL: async (order) => {
    console.log(`[PayPalStrategy]: Processing PayPal Express Checkout for $${order.amount}`);
    await new Promise((res) => setTimeout(res, 150));
    return { success: true, transactionId: `pp_tx_${Date.now()}` };
  },

  CRYPTO: async (order) => {
    console.log(`[CryptoStrategy]: Generating Web3 transaction for $${order.amount}`);
    await new Promise((res) => setTimeout(res, 200));
    return { success: true, transactionId: `0x7f${Date.now().toString(16)}` };
  }
};

// ==========================================
// 3. REACT CHECKOUT DASHBOARD COMPONENT
// ==========================================
export function EnterpriseCheckoutDashboard() {
  const [selectedMethod, setSelectedMethod] = useState<string>('STRIPE');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [receipt, setReceipt] = useState<PaymentResult | null>(null);

  const activeStrategy = useMemo(() => {
    return paymentStrategies[selectedMethod] ?? paymentStrategies.STRIPE;
  }, [selectedMethod]);

  const handleCheckout = async () => {
    setIsProcessing(true);
    setReceipt(null);

    const order: OrderPayload = {
      orderId: `ORD-${Date.now().toString().slice(-4)}`,
      amount: 149.99,
      currency: 'USD'
    };

    try {
      // 🟢 Execute interchangeable strategy through uniform interface
      const result = await activeStrategy(order);
      setReceipt(result);
    } catch (err: any) {
      setReceipt({ success: false, errorMessage: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="strategy-dashboard-card">
      <header className="card-header">
        <h3>Enterprise Strategy Pattern Payment Engine</h3>
        <span className="badge">🔄 Interchangeable Algorithms</span>
      </header>

      <p className="architecture-description">
        Demonstrates dynamic algorithm selection via uniform <code>PaymentStrategyFn</code> contract, completely eliminating monolithic conditional switches.
      </p>

      <div className="strategy-selector">
        <label>Select Payment Provider Strategy:</label>
        <div className="radio-group">
          {Object.keys(paymentStrategies).map((method) => (
            <label key={method} className="radio-label">
              <input
                type="radio"
                name="paymentMethod"
                value={method}
                checked={selectedMethod === method}
                onChange={(e) => setSelectedMethod(e.target.value)}
              />
              {method}
            </label>
          ))}
        </div>
      </div>

      <div className="order-summary">
        <p>Order Total: <strong>$149.99 USD</strong></p>
        <button onClick={handleCheckout} disabled={isProcessing} className="checkout-btn">
          {isProcessing ? '⚡ Executing Strategy...' : `💳 Pay via ${selectedMethod}`}
        </button>
      </div>

      {receipt && (
        <div className={`receipt-box ${receipt.success ? 'success' : 'error'}`}>
          {receipt.success ? (
            <>
              <h4>✅ Payment Succeeded</h4>
              <p>Transaction ID: <code>{receipt.transactionId}</code></p>
            </>
          ) : (
            <>
              <h4>❌ Payment Failed</h4>
              <p>{receipt.errorMessage}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 🧠 Part 03 — Integrated Challenges & Active Recall Solutions

### Prediction Challenge 1: Dynamic Strategy Lookup & Invocation
```js
const mathStrategies = {
  add: (a, b) => a + b,
  multiply: (a, b) => a * b
};

function compute(op, a, b) {
  const strategy = mathStrategies[op];
  if (!strategy) throw new Error("Unknown Op");
  return strategy(a, b);
}

console.log("Multiply:", compute("multiply", 5, 4));
console.log("Add:", compute("add", 5, 4));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Multiply: 20
Add: 9
```
**Why:** Strategy functions are stored as first-class values in the object. Dynamic key lookup retrieves the exact function reference and invokes it with `(a, b)`.
</details>

---

### Prediction Challenge 2: Missing Strategy Fallback Protection
```js
const formatters = {
  json: (data) => JSON.stringify(data),
  csv: (data) => data.join(",")
};

function format(data, formatType = "json") {
  const strategy = formatters[formatType] ?? formatters.json;
  return strategy(data);
}

console.log("Fallback Format:", format(["apple", "banana"], "xml"));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Fallback Format: ["apple","banana"]
```
**Why:** Because `"xml"` is not in `formatters`, nullish coalescing (`??`) activates the fallback `formatters.json` strategy, safely avoiding `TypeError`.
</details>

---

### Prediction Challenge 3: Multi-Parameter Higher-Order Strategy
```js
const discountStrategies = {
  fixed: (amount) => (price) => Math.max(0, price - amount),
  percentage: (percent) => (price) => price * (1 - percent / 100)
};

const tenPercentOff = discountStrategies.percentage(10);
const twentyDollarsOff = discountStrategies.fixed(20);

console.log("10% off $200:", tenPercentOff(200));
console.log("$20 off $200:", twentyDollarsOff(200));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
10% off $200: 180
$20 off $200: 180
```
**Why:** Higher-order functions allow configuring strategies with parameters (e.g. percentage or fixed deduction) before returning the standard `(price) => number` strategy function.
</details>

---

### Prediction Challenge 4: Multi-Algorithm Sorting Strategy
```js
const items = [{ name: "B", score: 90 }, { name: "A", score: 95 }];

const sorters = {
  byName: (a, b) => a.name.localeCompare(b.name),
  byScore: (a, b) => b.score - a.score
};

console.log("Sorted by Name:", [...items].sort(sorters.byName).map(i => i.name));
console.log("Sorted by Score:", [...items].sort(sorters.byScore).map(i => i.name));
```

<details>
<summary><strong>Solution & Step-by-Step Breakdown</strong></summary>

**Output:**  
```text
Sorted by Name: [ 'A', 'B' ]
Sorted by Score: [ 'A', 'B' ]
```
**Why:** JavaScript's native `Array.prototype.sort()` accepts strategy functions that return negative, zero, or positive numbers to define ordering.
</details>

---

## 🎯 Tiered Interview Question Bank (Intern ➔ Staff / Principal)

### 🟢 Tier 1: Intern / Junior Level
**Q1:** What problem does the Strategy Pattern solve in JavaScript?  
<details>
<summary><strong>Answer</strong></summary>
The Strategy Pattern solves the problem of organizing multiple interchangeable ways of performing the same operation. Instead of writing huge, hard-to-maintain `if/else` or `switch` statements, each algorithm is encapsulated into its own function or object conforming to a common contract.
</details>

**Q2:** Why is JavaScript particularly well-suited for the Strategy Pattern?  
<details>
<summary><strong>Answer</strong></summary>
In JavaScript, functions are first-class citizens. They can be stored in object keys, passed as arguments, and returned from other functions without needing verbose Java-style class hierarchies or formal interface implementations.
</details>

---

### 🟡 Tier 2: Mid-Level Engineer
**Q3:** How does the Strategy Pattern help uphold the Open/Closed Principle (OCP)?  
<details>
<summary><strong>Answer</strong></summary>
The core orchestration code remains closed to modification because it depends only on a generic strategy contract (`strategy(data)`). When business requirements introduce a new algorithm (e.g. a new shipping provider or discount rule), developers simply register a new strategy function without modifying or risking regression in existing code.
</details>

**Q4:** When should you NOT use the Strategy Pattern?  
<details>
<summary><strong>Answer</strong></summary>
Do not use the Strategy Pattern for simple binary checks (e.g. `isLoading ? <Spinner /> : <Content />`), static 2-case logic that never changes, or where different branches do not share a meaningful input/output contract. Overusing it creates unnecessary indirection and pattern explosion.
</details>

---

### 🟠 Tier 3: Senior Frontend Engineer
**Q5:** What happens if strategies in a dictionary return inconsistent data structures, and how do you prevent it in a large team?  
<details>
<summary><strong>Answer</strong></summary>
If one strategy returns a boolean, another returns an object, and a third throws an exception, runtime polymorphism collapses and consumers must write fragile `typeof` and `try/catch` checks.  
**Prevention:**  
1. Define a strict TypeScript type alias: `type ValidationStrategy = (value: string) => ValidationResult`.  
2. Apply `Record<FieldType, ValidationStrategy>` on the strategy dictionary to enforce compile-time compliance.  
3. Normalize all legacy strategies through an adapter wrapper before insertion into the registry.
</details>

---

### 🔴 Tier 4: Staff / Principal Architect
**Q6:** How does V8 optimize Strategy Pattern object dictionary lookups under the hood, and how do polymorphic call sites affect TurboFan JIT optimization?  
<details>
<summary><strong>Answer</strong></summary>
1. **Hidden Classes & Monomorphic Call Sites:** If the strategy functions share identical signatures and shapes, and the dictionary lookup is called with stable keys, V8 optimizes the invocation via an **Inline Cache (IC)** in a monomorphic state.  
2. **Polymorphic / Megamorphic Call Sites:** If $>4$ distinct strategy functions with different internal hidden classes are invoked from the same call site (`strategy(data)`), the call site transitions from Monomorphic $\to$ Polymorphic $\to$ Megamorphic. TurboFan disables inlining and falls back to a slower generic hash table lookup.  
3. **Staff Recommendation:** For ultra-hot performance loops (e.g. WebGL particle updates), keep the strategy dictionary monomorphic or inline the fast path before falling back to dynamic strategy dispatch.
</details>

---

## 🛠️ Senior Architecture Challenge: Standalone Multi-Payment & Validation Strategy Engine

```js
// See runnable implementation in examples/03-strategy-pattern.js
```

---

## Key Takeaways
1. **Encapsulate Interchangeable Algorithms:** Use strategy dictionaries to replace monolithic `switch` ladders.
2. **Enforce Uniform Contracts:** All strategies must accept identical arguments and return identical shapes.
3. **Uphold Open/Closed Principle:** Add new capabilities by registering new strategies additively.
4. **Leverage First-Class Functions:** Keep strategies as lightweight pure functions rather than heavy classes.
5. **Avoid Pattern Explosion:** Keep simple binary toggles as clean conditionals.

---

[⬅️ Part 02: Observer Pattern & Pub/Sub Architecture](./02-observer-pattern-pub-sub.md) | [📚 KPI 23 Index](./README.md) | [Part 04: Composition vs Inheritance Architecture ➡️](./04-composition-vs-inheritance.md)
