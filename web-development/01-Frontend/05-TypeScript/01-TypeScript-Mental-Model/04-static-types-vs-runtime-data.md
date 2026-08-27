# KPI 01 — Part 04: Static Types vs Runtime Data

[⬅️ Part 03: From TS Source to JS Runtime](./03-from-ts-source-to-js-runtime.md) | [📚 KPI 01 Index](./README.md) | [💻 Runnable Example Script](./examples/04-static-types-vs-runtime-data.ts) | [Part 05: TypeScript Engineering Philosophy ➡️](./05-typescript-engineering-philosophy.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Concept | Core Mental Model | Production Standard | Critical Failure Mode / Anti-Pattern |
|---|---|---|---|
| **Static Type** | Compile-time structural description for `tsc`. | Model internal code contracts & business logic. | Assuming a static type validates runtime memory. |
| **Runtime Value** | The actual JavaScript object/primitive in V8 memory. | Treat all external data as untrusted by default. | Passing unvalidated payloads into business services. |
| **`unknown`** | Type-safe top type representing unverified values. | Default input type for all external boundaries. | Bypassing narrowing by immediately casting to `any`. |
| **`any` Contamination** | Opts out of all static type checking. | Restrict to audited legacy escape hatches. | Spreading `any` through return types, infecting codebases. |
| **Type Assertion (`as`)** | Overrides compiler interpretation without runtime checks. | Use only when external evidence guarantees shape. | Using `as Type` to silence API deserialization errors. |
| **Type Guard (`is`)** | Runtime predicate that narrows a static type. | Use for lightweight polymorphic branching. | Writing incomplete guards with missing null/shape checks. |
| **Schema Validation** | Runtime executable verification (**Zod**, **Valibot**). | Gate all network, storage, and env boundaries. | Duplicating separate TS interfaces and validation schemas. |
| **Discriminated Union** | Modeling states via mutually exclusive literal tags. | Enforce state machines over "optional property soup". | Creating invalid combinations (`{ loading: true, error: "err" }`). |
| **Exhaustiveness (`never`)**| Proving at compile-time that all union branches are handled. | Enforce via `const _exhaustive: never = state` in defaults. | Forgetting fallback handling when adding new union members. |

---

## 🌗 The Trust Boundary Decision Matrix

| Boundary Mechanism | Compile-Time Type Safety | Runtime Validation Executed? | Performance Overhead | Best Used For |
|---|---|---|---|---|
| **Type Assertion (`data as User`)** | ❌ Falsified (Compiler trusts developer) | ❌ None (0 bytes emitted) | ⚡ 0 ns | Interfacing with trusted DOM elements (`HTMLInputElement`). |
| **`any` Escape Hatch** | ❌ None (Type checking disabled) | ❌ None (0 bytes emitted) | ⚡ 0 ns | Temporary migration step in legacy JS codebases. |
| **`unknown` + Type Guard (`is`)** | 🟢 Complete static narrowing | 🟢 Custom JS conditional logic | ⚡ Microseconds (Fast) | Internal polymorphic utilities and lightweight shape checks. |
| **Zod Schema Parsing (`Schema.parse`)** | 🟢 Complete static inference (`z.infer`) | 🟢 Comprehensive runtime schema verification | 🟡 Nanoseconds/Microseconds | External REST/GraphQL APIs, LocalStorage, Env variables, Forms. |

---

```text
                               THE TYPE SAFETY TRUST BOUNDARY
                               
 ┌───────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   UNTRUSTED EXTERNAL WORLD                                │
 │     (REST APIs, WebSockets, LocalStorage, URL Search Params, Form Data, PostMessage)       │
 └─────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                               │ Raw unknown data
                                               ▼
 ┌───────────────────────────────────────────────────────────────────────────────────────────┐
 │                                 RUNTIME VALIDATION BOUNDARY                               │
 │                                                                                           │
 │   const UserSchema = z.object({                                                          │
 │     id: z.string().uuid(),                                                                │
 │     email: z.string().email(),                                                            │
 │     status: z.enum(["active", "suspended"])                                               │
 │   });                                                                                     │
 │                                                                                           │
 │   const result = UserSchema.safeParse(rawJson);                                           │
 └─────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                               │
                        ┌──────────────────────┴──────────────────────┐
                        │                                             │
             ❌ Validation Fails (400 / Drift)               ✅ Validation Passes
                        │                                             │
                        ▼                                             ▼
             Log Sentry Alert & Reject                     Trusted Domain Model
                                                           type User = z.infer<typeof UserSchema>
                                                                      │
                                                                      ▼
                                                           Application Logic / React UI
```

> **The Architectural Axiom:** TypeScript can only verify data that has *earned its trust*. Your application boundary layer is responsible for validating and establishing that trust.

---

## 🎯 Senior & Staff Interview Gotchas

---

### Gotcha 1: The "Optional Property Soup" Anti-Pattern vs. Discriminated Unions
```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ QUESTION:                                                                              │
│ "Why is modeling async UI state with optional properties an architectural smell, and    │
│ how do Discriminated Unions solve impossible UI states?"                               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

```ts
// ❌ The Anti-Pattern: Optional Property Soup
type AsyncState = {
  loading?: boolean;
  data?: UserProfile;
  error?: string;
};

// ⚠️ This permits 8 possible permutations, 5 of which are completely invalid:
const invalidState: AsyncState = {
  loading: true,
  data: { id: "1", name: "Alex" },
  error: "Network Timeout" // Contradictory state!
};
```

#### 🎓 Architectural Answer Grading:
* **🔴 Junior Candidate Answer:** *"Optional properties are fine, you just have to remember to check if `loading` is true before checking `data`."*
* **🟡 Mid-Level Candidate Answer:** *"Optional properties allow impossible states (like `loading: true` and `error: 'Failed'` simultaneously). We should use a union with a `status` property so TypeScript knows what fields exist in each state."*
* **🟢 Principal / Staff Engineer Answer:**
  1. **Combinatorial State Explosion:** With $N$ independent optional boolean/data fields, the state space expands to $2^N$ permutations. The UI template is forced to write brittle nested ternary checks (`loading ? ... : error ? ... : data ? ...`).
  2. **Algebraic Data Types (ADTs):** By modeling the lifecycle as a **Discriminated Union**, we reduce the state space to only *valid domain states*:
     ```ts
     type AsyncState =
       | { status: "idle" }
       | { status: "loading" }
       | { status: "success"; data: UserProfile }
       | { status: "error"; error: string };
     ```
  3. **Control Flow Narrowing:** In React, checking `if (state.status === "success")` allows TypeScript's control flow analyzer to narrow `state.data` without optional chaining (`state.data?.name`) or non-null assertions (`state.data!.name`).

---

### Gotcha 2: Compile-Time Exhaustiveness Checking with `never`
```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ QUESTION:                                                                              │
│ "How do we guarantee at compile time that every possible branch of a Discriminated     │
│ Union is handled when a new union member is added months later?"                       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

```ts
type PaymentMethod = "credit_card" | "paypal" | "apple_pay" | "crypto"; // 'crypto' added recently!

function processPayment(method: PaymentMethod) {
  switch (method) {
    case "credit_card":
      return handleCreditCard();
    case "paypal":
      return handlePayPal();
    case "apple_pay":
      return handleApplePay();
    default:
      // 💥 TS2322: Type 'string' is not assignable to type 'never'.
      // The variable 'method' was not narrowed completely because 'crypto' is unhandled!
      const _exhaustiveCheck: never = method;
      throw new Error(`Unhandled payment method: ${_exhaustiveCheck}`);
  }
}
```

#### 🎓 Architectural Explanation:
1. `never` represents the **empty set** / impossible state in TypeScript's type system.
2. In an exhaustive `switch` or `if/else` ladder, once all declared union members are handled, the remaining type in the `default` branch narrows to `never`.
3. Assigning the unhandled value to `const _exhaustiveCheck: never = value` forces the TypeScript compiler to emit a build-halting diagnostic error if *any* new union member is added to the domain without a corresponding `case` handler.

---

## 🧭 Industry Frequency & Framework Relevance

| Badge | Industry Frequency | Relevance in React 19, Next.js Server Actions & API Clients | Where to Focus Attention |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of production code | Discriminated unions, `unknown` narrowing, type guards (`is`), exhaustiveness checks with `never`. | UI async state modeling, custom hook return values, and form action handlers. |
| 🟡 **Moderate** | Used in ~50% of production code | Zod schema parsing at network boundaries, deriving types via `z.infer`, LocalStorage defense. | Next.js Server Action argument validation, tRPC/REST endpoints, and environment variable loaders. |
| 🔵 **Compiler / Engine** | Runtime internals & language spec | Control Flow Analysis (CFA) graph traversal in `checker.ts`, reachability analysis for `never`. | Designing enterprise SDKs, library type-narrowing utilities, and Staff architecture reviews. |

---

## 4.1 🧠 The Fundamental Boundary: Static Description vs. Runtime Reality

The most dangerous pitfall in TypeScript is believing that a type annotation validates runtime memory.

```text
                 COMPILE TIME (STATIC SPECIFICATION)
                 type User = { id: string; name: string };
                                   │
                    Type erased during transpilation
                                   ▼
                 RUNTIME MEMORY (UNCHECKED BY TS)
                 const user = { id: 1002, name: null };
```

```ts
type User = {
  id: string;
  name: string;
};

// ⚠️ Unsafe cast: Tells compiler to trust data blindly
const user: User = JSON.parse('{"id": 1002, "name": null}');

// 💥 Runtime Crash: TypeError: Cannot read properties of null (reading 'toUpperCase')
console.log(user.name.toUpperCase());
```

---

## 4.2 🛡️ The 5 Universal Trust Boundaries

Every modern web application has 5 perimeter boundaries where data **must be treated as `unknown`**:

```text
┌────────────────────────────────────────┬─────────────────────────────────────────────────┐
│ TRUST BOUNDARY                         │ WHY DATA IS UNTRUSTED AT RUNTIME                │
├────────────────────────────────────────┼─────────────────────────────────────────────────┤
│ 1. Network APIs & WebSockets           │ Server response schemas drift or fail unannounced│
│ 2. LocalStorage & SessionStorage       │ Persistent data may be stale, modified, or empty│
│ 3. URL Search Params & Dynamic Routes  │ Users can manually edit URL query strings        │
│ 4. Form Inputs & File Uploads          │ Raw user input is always string/blob by default │
│ 5. Worker `postMessage` & Broadcast    │ Cross-thread messages can deserialize corrupted │
└────────────────────────────────────────┴─────────────────────────────────────────────────┘
```

---

## 4.3 🟢 `unknown` vs. `any`: The Safety Infection Chain

`any` is a viral escape hatch that turns off the type checker for all downstream expressions:

```text
                              THE 'ANY' INFECTION CHAIN
                              
                        const response: any = fetch();
                                     │
                                     ▼
                        const user = response.user;       (user is any)
                                     │
                                     ▼
                        const name = user.profile.name;   (name is any)
                                     │
                                     ▼
                     renderComponent(name.toUpperCase()); (💥 Runtime crash if undefined!)
```

### The `unknown` Defense:
`unknown` forces the developer to provide **runtime evidence** before accessing properties:

```ts
function handlePayload(payload: unknown) {
  // payload.id; // 💥 TS18046: 'payload' is of type 'unknown'.
  
  if (payload && typeof payload === "object" && "id" in payload) {
    console.log("Safely narrowed ID:", (payload as { id: unknown }).id);
  }
}
```

---

## 4.4 🟢 Type Guards & Custom Type Predicates (`is`)

When checking object structures repeatedly, author reusable **User-Defined Type Guards** with the `val is Type` return annotation:

```ts
interface ProductRecord {
  sku: string;
  price: number;
}

// User-Defined Type Guard:
export function isProductRecord(value: unknown): value is ProductRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    "sku" in value &&
    typeof (value as Record<string, unknown>).sku === "string" &&
    "price" in value &&
    typeof (value as Record<string, unknown>).price === "number"
  );
}

// Usage in application code:
function processIncomingData(item: unknown) {
  if (isProductRecord(item)) {
    // TypeScript automatically narrows 'item' to ProductRecord:
    console.log(`SKU: ${item.sku} - Price: $${item.price.toFixed(2)}`);
  } else {
    console.error("Malformed product payload rejected at boundary.");
  }
}
```

---

## 4.5 🧱 Schema-Driven Type Safety with Zod

For complex enterprise payloads, manual type guards become verbose and brittle. Use declarative schema validation:

```ts
import { z } from "zod";

// 1. Define the Executable Runtime Schema (Single Source of Truth)
export const OrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPriceCents: z.number().positive(),
});

export const CheckoutPayloadSchema = z.object({
  orderId: z.string(),
  items: z.array(OrderItemSchema).min(1),
  discountCode: z.string().optional(),
});

// 2. Infer the Static TypeScript Domain Type automatically:
export type CheckoutPayload = z.infer<typeof CheckoutPayloadSchema>;

// 3. Resilient Boundary API Handler:
export async function submitCheckout(rawData: unknown): Promise<CheckoutPayload> {
  const parseResult = CheckoutPayloadSchema.safeParse(rawData);
  
  if (!parseResult.success) {
    // Format human-readable validation errors:
    const errorDetails = parseResult.error.format();
    console.error("Validation failed at boundary:", errorDetails);
    throw new Error("Invalid checkout payload structure.");
  }
  
  // parseResult.data is 100% guaranteed to be CheckoutPayload:
  return parseResult.data;
}
```

---

## 4.6 🧠 Decoupling DTOs from Internal Domain Models

Never leak raw backend database/API shapes directly into React components:

```text
               API RESPONSE (DTO)                INTERNAL DOMAIN MODEL
               ┌──────────────────────┐          ┌──────────────────────┐
               │ first_name: string   │ ───────► │ fullName: string     │
               │ last_name: string    │ (Mapping │ isVip: boolean       │
               │ is_vip_member: 0 | 1 │  Layer)  │                      │
               └──────────────────────┘          └──────────────────────┘
```

```ts
// 1. External API Data Transfer Object (DTO)
type UserDto = {
  first_name: string;
  last_name: string;
  is_active: number;
};

// 2. Internal Clean Domain Entity
type UserDomain = {
  fullName: string;
  isActive: boolean;
};

// 3. Transformation Boundary
function mapDtoToDomain(dto: UserDto): UserDomain {
  return {
    fullName: `${dto.first_name} ${dto.last_name}`.trim(),
    isActive: Boolean(dto.is_active),
  };
}
```

---

## 4.7 🚨 Real-World Production Incident Post-Mortem

---

### 💥 Incident: Mobile App Session Crash on App Launch (LocalStorage Poisoning)
* **Severity:** P0 (Over 35,000 active mobile web users unable to open app).
* **Symptom:** App crashed with permanent white-screen on launch: `TypeError: user.roles.map is not a function`.
* **Root Cause:**
  ```ts
  interface UserSession {
    token: string;
    roles: string[];
  }
  
  // ⚠️ Blind deserialization without validation:
  const session = JSON.parse(localStorage.getItem("user_session")!) as UserSession;
  session.roles.map(r => ...);
  ```
  A previous v1 release stored `roles: "admin"` (a single string instead of an array). When v2 deployed, `session.roles.map` threw a fatal runtime exception on app bootstrap.
* **Resolution:** Replaced raw `JSON.parse` with a Zod safe-parser that falls back to wiping corrupt session keys and redirecting to the login screen.

---

## 4.8 🧪 Interactive Prediction Challenges

---

### Challenge 1: The `JSON.parse` Return Type Trap
```ts
const raw = '{"count": "100"}';
const data: { count: number } = JSON.parse(raw);

console.log(data.count + 5);
```
**Question:** What does `tsc` do, and what does JavaScript print at runtime?

<details>
<summary>🔍 Click to view Deep-Dive Solution</summary>

* **Static Compilation:** `tsc` compiles with **0 errors** because `JSON.parse` returns `any`.
* **Runtime Execution:** `data.count` is `"100"`. JavaScript evaluates `"100" + 5` (string concatenation).
* **Output:** `"1005"`.
</details>

---

### Challenge 2: Type Guard Narrowing Scope
```ts
function formatLength(val: unknown) {
  if (typeof val === "string" || Array.isArray(val)) {
    return val.length;
  }
  return 0;
}
```
**Question:** What type does TypeScript infer for `val` inside the `if` block?

<details>
<summary>🔍 Click to view Deep-Dive Solution</summary>

* **Inferred Type:** `string | any[]`.
* **Explanation:** TypeScript's control flow analyzer combines both conditions into a union of types that possess the `.length` property.
</details>

---

### Challenge 3: Exhaustiveness Checking Verification
```ts
type Status = "idle" | "loading" | "success";

function getLabel(s: Status) {
  switch (s) {
    case "idle": return "Ready";
    case "loading": return "Working...";
    default:
      const check: never = s; // 💥 Will this line compile?
      return check;
  }
}
```
**Question:** Does `const check: never = s` compile cleanly?

<details>
<summary>🔍 Click to view Deep-Dive Solution</summary>

* **Compilation Result:** 💥 **Build Error!**
* **Diagnostic:** `Type 'string' is not assignable to type 'never'.`
* **Reason:** The `case "success"` branch is unhandled. In the `default` block, `s` is narrowed to `"success"`, which cannot be assigned to `never`.
</details>

---

## 4.9 🔨 Anti-Pattern Refactoring Recipe

### 🔴 Anti-Pattern: Unchecked LocalStorage Access
```ts
// ❌ Dangerous: Assumes stored data matches current schema
function getAuthToken(): string {
  const data = JSON.parse(localStorage.getItem("auth_data")!) as { token: string };
  return data.token; // Throws if auth_data is missing, corrupt, or old schema!
}
```

### 🟢 Gold-Standard Production Refactor: Safe Schema Gateway
```ts
import { z } from "zod";

const AuthDataSchema = z.object({
  token: z.string().min(10),
  expiresAt: z.number(),
});

function getAuthToken(): string | null {
  try {
    const raw = localStorage.getItem("auth_data");
    if (!raw) return null;
    
    const parsed = AuthDataSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      console.warn("Corrupted auth cache purged from storage.");
      localStorage.removeItem("auth_data");
      return null;
    }
    
    return parsed.data.token;
  } catch {
    return null;
  }
}
```

---

## 4.10 🧠 Active Recall / Mentor Handoff Prompt

Paste the following prompt into your mentor/interview session to test your mastery of **Part 4**:

```text
I have mastered Level 5 — TypeScript, KPI 1 Part 4 (Static Types vs. Runtime Data).

Conduct a Staff Frontend Engineer interview evaluating my runtime boundary mastery.

Evaluate me across these core competencies:
1. The 5 Universal Trust Boundaries (Network, Storage, URLs, Forms, Workers).
2. The danger of 'any' infection chains and why 'unknown' is the safe default.
3. Type Assertions vs. Runtime Conversion vs. Schema Validation.
4. Discriminated Unions vs. Optional Property Soup for async UI states.
5. Exhaustiveness checking with 'never' and compiler unreachable code analysis.
6. Decoupling API DTOs from internal UI Domain Models.

Rules:
- Present complex distributed system boundary failures and subtle deserialization bugs.
- Grade my explanations against Junior vs. Senior vs. Staff Engineer standards.
```

---

## 🔑 Key Takeaways

1. **Static Assumptions $\neq$ Runtime Truth:** A TypeScript annotation describes what the compiler assumes; it does not validate or sanitize external runtime payloads in memory.
2. **The 5 Universal Trust Boundaries:** Treat all Network APIs, LocalStorage, URL parameters, Form inputs, and Worker messages as `unknown` at the application perimeter.
3. **The Danger of `any` Contamination:** `any` disables static checking transitively across consumers. Use `unknown` to force runtime narrowing via type guards or schema parsers.
4. **Discriminated Unions Over Optional Soup:** Model asynchronous UI lifecycles with mutually exclusive tag states (`status: "loading" | "success" | "error"`) to eliminate impossible states.
5. **Schema-Driven Single Source of Truth:** Use **Zod** or **Valibot** to validate runtime boundaries while automatically inferring static TypeScript types via `z.infer`.

---

[⬅️ Part 03: From TS Source to JS Runtime](./03-from-ts-source-to-js-runtime.md) | [📚 KPI 01 Index](./README.md) | [💻 Runnable Example Script](./examples/04-static-types-vs-runtime-data.ts) | [Part 05: TypeScript Engineering Philosophy ➡️](./05-typescript-engineering-philosophy.md)
