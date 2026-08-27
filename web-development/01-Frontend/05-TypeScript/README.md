# Level 05: TypeScript Enterprise Architecture

[⬅️ Level 04: Browser Internals](../04-Browser-Internals-Web-Platform/README.md) | [📚 Frontend Master Hub](../README.md) | [Level 06: React Fundamentals ➡️](../06-React-Fundamentals/README.md)

> **Repository Owner & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer \| Founding Engineer)  
> **Co-Author & Contributor:** [Prasanjeet Yadav](https://www.linkedin.com/in/prasenjeet-yadav-2277a6258/) ([GitHub](https://github.com/prasenjeet-0322)) (Mid-Level Full Stack Engineer)

---

## 🎯 Level Goal

Transform an engineer into a **Senior Full-Stack / Platform Architect** capable of designing, modeling, maintaining, and scaling enterprise type-safe applications. 

This level approaches TypeScript not merely as "JavaScript with syntax annotations," but as a **static type analysis engine, compiler pipeline, and architectural contract system**—moving beyond basic types into algebraic domain modeling, type-safe API boundaries (Zod), compiler performance optimization, and React 19 / Next.js Server Action integration.

---

## 🧭 Tiered Mastery Classification

```text
LEVEL 5 — TYPESCRIPT ENTERPRISE ARCHITECTURE
│
├── 🔴 TIER 1: MUST KNOW (Core Senior Full-Stack Competency)
│   ├── Mental Model, Fundamentals, Objects, Discriminated Unions, Generics, Utility Types,
│   │   Escape Hatches, Runtime Validation (Zod), tsconfig Architecture, React/Next.js Integration
│
├── 🟢 TIER 2: GOOD TO KNOW (Senior Differentiators & SDK/Library Architecture)
│   ├── Advanced Operators (infer/mapped/conditional), Type-Level Programming, OOP Classes,
│   │   Ambient Modules (.d.ts), Compiler Diagnostics/Performance, Branded Domain Types
│
├── ⚪ TIER 3: TAXONOMY & TYPE REFERENCE MAP
│   └── Categorized Type System & Utility Operator Cheat Sheet
│
└── 🔴 CAPSTONE: ENTERPRISE TYPE-SAFE DOMAIN ENGINE & SDK (KPI 18)
    └── Production E-Commerce SDK with Branded IDs, Zod Validation, and Zero-Type-Leakage React Client
```

---

## 🎯 Mastery Level Target Matrix

```text
RECOGNIZE ───► UNDERSTAND ───► USE ───► DEBUG ───► MASTER
```

| KPI Module | Tier | Target Mastery Level | Why It Matters for Senior/Founding Full-Stack Engineers |
|---|---|---|---|
| **01. TypeScript Mental Model** | 🔴 MUST KNOW | 🔴 **Master** | Prevent false runtime security assumptions and reason about structural subtyping. |
| **02. Type System Fundamentals** | 🔴 MUST KNOW | 🔴 **Master** | Eliminate `any` pollution; correctly wield `unknown`, `never`, and strict nulls. |
| **03. Object Type Modeling** | 🔴 MUST KNOW | 🔴 **Master** | Prevent excess property leaks, enforce immutability with `readonly`, choose `interface` vs `type`. |
| **04. Union Types & Narrowing** | 🔴 MUST KNOW | 🔴 **Master** | Eliminate impossible async states via Discriminated Unions and exhaustiveness with `never`. |
| **05. Functions & Advanced Typing** | 🔴 MUST KNOW | 🔴 **Master** | Author clean function overloads, contextual typing, and generic higher-order functions. |
| **06. Generics Deep Dive** | 🔴 MUST KNOW | 🔴 **Master** | Author reusable, flexible component & API abstractions using `extends` constraints. |
| **07. Advanced Type Operators** | 🟢 GOOD TO KNOW | 🟢 **Understand** | Wield `keyof`, `typeof`, indexed access, mapped types, and conditional `infer`. |
| **08. Built-In Utility Types** | 🔴 MUST KNOW | 🔴 **Master** | Fluidly transform domain models with `Pick`, `Omit`, `Record`, `ReturnType`, `Awaited`. |
| **09. Type-Level Programming** | 🟢 GOOD TO KNOW | 🟢 **Use** | Construct deep immutable structures (`DeepReadonly`) and type-safe dot-notation paths. |
| **10. Type Assertions & Hatches** | 🔴 MUST KNOW | 🔴 **Master** | Control escape hatches safely with `as const` and `@ts-expect-error` instead of `any`. |
| **11. Runtime Validation (Zod)** | 🔴 MUST KNOW | 🔴 **Master** | Gate the 5 universal trust boundaries (APIs, Storage, Env, Forms) with schema parsers. |
| **12. Classes & OOP TypeScript** | 🟢 GOOD TO KNOW | 🟢 **Understand** | Structure clean enterprise service layers with abstract classes and access modifiers. |
| **13. Modules & Ambient `.d.ts`** | 🟢 GOOD TO KNOW | 🟢 **Master** | Author clean declaration files, declaration maps (`.d.ts.map`), and library type definitions. |
| **14. Compiler Configuration** | 🔴 MUST KNOW | 🔴 **Master** | Configure enterprise `tsconfig.json`, `isolatedModules`, `moduleResolution`, Project References. |
| **15. Compiler Performance** | 🟢 GOOD TO KNOW | 🟢 **Debug** | Diagnose slow build times using `tsc --extendedDiagnostics` and eliminate `tsserver` lag. |
| **16. Type-Safe Architecture** | 🟢 GOOD TO KNOW | 🟢 **Master** | Prevent primitive obsession with Branded Types and decouple API DTOs from UI domain models. |
| **17. React & Next.js Integration**| 🔴 MUST KNOW | 🔴 **Master** | Type generic React 19 components, custom hooks, Server Actions, and RSC boundaries. |
| **18. Graduation Capstone** | 🔴 CAPSTONE | 🔴 **Master** | Build an enterprise SDK proving 100% end-to-end type safety from database to UI. |

---

## 🗺️ Master Curriculum & KPI Directory (18 KPIs)

### 🏛️ Pillar 1: Type System Foundations & Core Modeling
| KPI | Module Title | Tier | Core Focus |
|---|---|---|---|
| **[KPI 01](./01-TypeScript-Mental-Model/README.md)** | [TypeScript Mental Model](./01-TypeScript-Mental-Model/README.md) | 🔴 MUST KNOW | Static analysis vs runtime memory, structural subtyping ($\text{Source} \supseteq \text{Target}$), 5-stage `tsc` pipeline, type erasure. |
| **[KPI 02](./02-Type-System-Fundamentals/README.md)** | [Type System Fundamentals](./02-Type-System-Fundamentals/README.md) | 🔴 MUST KNOW | Type inference, widening, literal types, `as const`, tri-state decision matrix (`any` vs `unknown` vs `never`), strict null checks. |
| **[KPI 03](./03-Object-Type-Modeling/README.md)** | [Object Type Modeling](./03-Object-Type-Modeling/README.md) | 🔴 MUST KNOW | `interface` vs `type`, excess property checks on fresh literals, index signatures, interface merging, `readonly` immutability. |
| **[KPI 04](./04-Union-Types-Type-Narrowing/README.md)** | [Union Types & Type Narrowing](./04-Union-Types-Type-Narrowing/README.md) | 🔴 MUST KNOW | Control flow analysis, discriminated unions, `typeof`/`instanceof`/`in` narrowing, custom type guards (`is`), `never` exhaustiveness. |
| **[KPI 05](./05-Functions-Advanced-Function-Typing/README.md)** | [Functions & Advanced Function Typing](./05-Functions-Advanced-Function-Typing/README.md) | 🔴 MUST KNOW | Function signatures, overloads vs union parameters, contextual typing, `this` parameter typing, generic higher-order functions. |
| **[KPI 06](./06-Generics-Deep-Dive/README.md)** | [Generics Deep Dive](./06-Generics-Deep-Dive/README.md) | 🔴 MUST KNOW | Generic type arguments, constraints (`extends`), default types, generic interfaces/classes, generic factories. |

---

### ⚡ Pillar 2: Type Operators, Utilities & Runtime Boundaries
| KPI | Module Title | Tier | Core Focus |
|---|---|---|---|
| **[KPI 07](./07-Advanced-Type-Operators/README.md)** | [Advanced Type Operators](./07-Advanced-Type-Operators/README.md) | 🟢 GOOD TO KNOW | `keyof`, `typeof`, indexed access (`T[K]`), mapped types (`[P in K]`), conditional types (`T extends U ? X : Y`), `infer` keyword. |
| **[KPI 08](./08-Built-In-Utility-Types/README.md)** | [Built-In Utility Types](./08-Built-In-Utility-Types/README.md) | 🔴 MUST KNOW | `Partial`, `Required`, `Readonly`, `Record`, `Pick`, `Omit`, `Exclude`, `Extract`, `NonNullable`, `ReturnType`, `Parameters`, `Awaited`. |
| **[KPI 09](./09-Custom-Utility-Types-Type-Level-Programming/README.md)** | [Custom Utility Types & Type-Level Programming](./09-Custom-Utility-Types-Type-Level-Programming/README.md) | 🟢 GOOD TO KNOW | `DeepReadonly`, `DeepPartial`, Template Literal types, type-safe dot-notation path resolvers (`Paths<T>`), tuple manipulation. |
| **[KPI 10](./10-Type-Assertions-Escape-Hatches/README.md)** | [Type Assertions & Escape Hatches](./10-Type-Assertions-Escape-Hatches/README.md) | 🔴 MUST KNOW | Type assertions (`as`), double assertions (`as unknown as T`), non-null assertion (`!`), `@ts-expect-error` vs `@ts-ignore`. |
| **[KPI 11](./11-Runtime-Validation-Type-Safety-Boundaries/README.md)** | [Runtime Validation & Type-Safety Boundaries](./11-Runtime-Validation-Type-Safety-Boundaries/README.md) | 🔴 MUST KNOW | Gating the 5 universal trust boundaries (APIs, Storage, URLs, Forms, Env) with **Zod** / **Valibot**, static inference (`z.infer`). |

---

### 🏢 Pillar 3: Object-Oriented Design, Modules & Tooling Architecture
| KPI | Module Title | Tier | Core Focus |
|---|---|---|---|
| **[KPI 12](./12-Classes-Object-Oriented-TypeScript/README.md)** | [Classes & Object-Oriented TypeScript](./12-Classes-Object-Oriented-TypeScript/README.md) | 🟢 GOOD TO KNOW | Access modifiers (`public`, `private`, `protected`, `#private`), parameter properties, abstract classes, interface implementation. |
| **[KPI 13](./13-Modules-Declaration-Files-Ambient-Types/README.md)** | [Modules, Declaration Files & Ambient Types](./13-Modules-Declaration-Files-Ambient-Types/README.md) | 🟢 GOOD TO KNOW | `.d.ts` declaration files, `declare module`, `declare global`, `typeRoots`, declaration maps (`.d.ts.map`), `isolatedModules`. |
| **[KPI 14](./14-TypeScript-Compiler-Configuration/README.md)** | [TypeScript Compiler Configuration](./14-TypeScript-Compiler-Configuration/README.md) | 🔴 MUST KNOW | Enterprise `tsconfig.json`, `strict` flags, `noImplicitAny`, `exactOptionalPropertyTypes`, `moduleResolution`, Project References. |
| **[KPI 15](./15-TypeScript-Performance-Large-Codebases/README.md)** | [TypeScript Performance & Large Codebases](./15-TypeScript-Performance-Large-Codebases/README.md) | 🟢 GOOD TO KNOW | Diagnosing `tsc` checking latency with `--extendedDiagnostics`, recursive type depth limits, `tsserver` memory optimization. |

---

### 🚀 Pillar 4: Architecture, Framework Integration & Capstone
| KPI | Module Title | Tier | Core Focus |
|---|---|---|---|
| **[KPI 16](./16-Type-Safe-Application-Architecture/README.md)** | [Type-Safe Application Architecture](./16-Type-Safe-Application-Architecture/README.md) | 🟢 GOOD TO KNOW | Domain modeling, Branded/Nominal types (`UserId` vs `OrderId`), Finite State Machines, Decoupling DTOs from UI models. |
| **[KPI 17](./17-TypeScript-React-Nextjs-Preparation/README.md)** | [TypeScript for React & Next.js Preparation](./17-TypeScript-React-Nextjs-Preparation/README.md) | 🔴 MUST KNOW | Typing component props, polymorphic components (`as`), generic hooks, typing Server Actions, React 19 RSC boundaries. |
| **[KPI 18](./18-Graduation-Project/README.md)** | [Graduation Project: Enterprise Domain Engine & SDK](./18-Graduation-Project/README.md) | 🔴 CAPSTONE MASTER | Build an end-to-end type-safe E-Commerce SDK with branded types, Zod boundary validation, generic repositories, and React UI. |

---

## 📖 Comprehensive Per-KPI Curriculum Breakdown

---

### [KPI 1 — TypeScript Mental Model](./01-TypeScript-Mental-Model/README.md)
* **Tier:** 🔴 MUST KNOW
* **Purpose:** Understand what TypeScript actually is, what guarantees it provides at compile time vs runtime, structural subtyping, and its soundness tradeoffs.
* **Core Scope:**
  - Static type checking & type erasure
  - Compile-time vs Runtime mental model
  - Structural typing (shape-based) vs Nominal typing
  - Soundness tradeoffs (e.g. `any`, mutation, index signatures)
  - TypeScript as a developer tool & DX accelerator rather than runtime code
* **Practical Competency:** Ability to reason about what TypeScript can and cannot guarantee, avoiding false runtime security assumptions.
* **Graduation Criteria:** Articulate structural subtyping rules and identify where TypeScript type erasure leaves runtime vulnerabilities.

---

### [KPI 2 — Type System Fundamentals](./02-Type-System-Fundamentals/README.md)
* **Tier:** 🔴 MUST KNOW
* **Purpose:** Master core annotations, type inference, type widening, literal types, and critical tri-state primitives (`any`, `unknown`, `never`).
* **Core Scope:**
  - Type annotations & type inference mechanics
  - Type widening, literal types, `const` assertions
  - Primitive & compound types (Arrays, Tuples, Enums & Enum tradeoffs)
  - The fundamental decision matrix: `any` vs `unknown` vs `never` vs `void`
  - Handling `null` and `undefined` under strict null checks
* **Practical Competency:** Write precise, inferable types without default `any` pollution or unnecessary verbose annotations.
* **Graduation Criteria:** Correctly choose between `unknown`, `never`, and `any` in library and application signatures with 100% precision.

---

### [KPI 3 — Object Type Modeling](./03-Object-Type-Modeling/README.md)
* **Tier:** 🔴 MUST KNOW
* **Purpose:** Model complex object shapes using `interface` and `type` aliases, understanding structural compatibility, index signatures, and excess property checks.
* **Core Scope:**
  - `interface` vs `type` aliases: structural differences, declaration merging, performance
  - Optional (`?`) and `readonly` properties
  - Index signatures & `Record<K, V>`
  - Excess property checks & structural compatibility
  - Interface inheritance (`extends`) vs Type intersections (`&`)
* **Practical Competency:** Design maintainable domain object models and choose between `interface` and `type` based on architectural tradeoffs.
* **Graduation Criteria:** Construct clean domain object definitions that enforce immutability (`readonly`) and prevent unintended excess property pollution.

---

### [KPI 4 — Union Types & Type Narrowing](./04-Union-Types-Type-Narrowing/README.md)
* **Tier:** 🔴 MUST KNOW
* **Purpose:** Master control flow analysis, type guards, discriminated unions, and exhaustiveness checking for robust, safe state modeling.
* **Core Scope:**
  - Union types & intersections
  - Control Flow Analysis (CFA) and type narrowing
  - Type guards: `typeof`, `instanceof`, `in`, and custom type predicates (`is`)
  - Discriminated Unions (tagged unions) for state machines
  - Exhaustiveness checking using the `never` type
* **Practical Competency:** Replace scattered boolean flags with robust Discriminated Unions and handle all union branches safely.
* **Graduation Criteria:** Build a state machine with full exhaustiveness checking where adding a new state triggers a compile-time error until handled.

---

### [KPI 5 — Functions & Advanced Function Typing](./05-Functions-Advanced-Function-Typing/README.md)
* **Tier:** 🔴 MUST KNOW
* **Purpose:** Type complex functions, callbacks, overloads, and higher-order functions while leveraging contextual typing and `this` annotations.
* **Core Scope:**
  - Function signatures, parameter types, and return type inference
  - Optional and default parameters
  - Rest parameters and tuple rest types
  - Function overloads vs union parameters (tradeoffs & best practices)
  - `this` parameter typing in callbacks
  - Contextual typing and higher-order functions
* **Practical Competency:** Author expressive function signatures and overloads for library/utility functions without leaky type assertions.
* **Graduation Criteria:** Write a clean, overloaded utility function with full contextual type inference for consumer callbacks.

---

### [KPI 6 — Generics Deep Dive](./06-Generics-Deep-Dive/README.md)
* **Tier:** 🔴 MUST KNOW
* **Purpose:** Master generic functions, interfaces, classes, constraints, and default type parameters to author reusable, type-safe abstractions.
* **Core Scope:**
  - Generic functions and type parameter inference
  - Generic interfaces and type aliases
  - Generic constraints using `extends`
  - Default generic type parameters
  - Generics with multiple type parameters
  - When to use generics vs when they add unnecessary complexity
* **Practical Competency:** Design reusable, flexible data structures and API helper functions that preserve precise type identity.
* **Graduation Criteria:** Implement a generic repository or data-fetching wrapper with constrained generic parameters.

---

### [KPI 7 — Advanced Type Operators](./07-Advanced-Type-Operators/README.md)
* **Tier:** 🟢 GOOD TO KNOW
* **Purpose:** Harness TypeScript's type-level operators (`keyof`, `typeof`, indexed access, mapped types, conditional types, and `infer`).
* **Core Scope:**
  - `keyof` and `typeof` operators
  - Indexed access types (`T[K]`)
  - Mapped types (`[P in K]`, key remapping with `as`)
  - Conditional types (`T extends U ? X : Y`)
  - The `infer` keyword in conditional types
  - Distributive conditional types
* **Practical Competency:** Read, understand, and construct advanced type transformations for complex library and domain requirements.
* **Graduation Criteria:** Author a custom conditional type that unwraps nested Promises and extracts function return types using `infer`.

---

### [KPI 8 — Built-In Utility Types](./08-Built-In-Utility-Types/README.md)
* **Tier:** 🔴 MUST KNOW
* **Purpose:** Fluently use TypeScript's standard utility types to transform, mutate, and extract object and function types efficiently.
* **Core Scope:**
  - Object transformation: `Partial`, `Required`, `Readonly`, `Record`, `Pick`, `Omit`
  - Union manipulation: `Exclude`, `Extract`, `NonNullable`
  - Function utilities: `ReturnType`, `Parameters`, `ConstructorParameters`, `InstanceType`
  - Promise utilities: `Awaited`
  - Combining utility types to express domain models cleanly
* **Practical Competency:** Transform existing domain types for different application layers (e.g. Create DTO vs Update DTO vs View Model) without duplication.
* **Graduation Criteria:** Derive multiple CRUD entity schemas from a single base type using composition of built-in utility types.

---

### [KPI 9 — Custom Utility Types & Type-Level Programming](./09-Custom-Utility-Types-Type-Level-Programming/README.md)
* **Tier:** 🟢 GOOD TO KNOW
* **Purpose:** Build custom, production-grade utility types (e.g. `DeepReadonly`, `DeepPartial`, path resolvers, template literal types) without falling into over-engineering.
* **Core Scope:**
  - Recursive type definitions (`DeepPartial<T>`, `DeepReadonly<T>`)
  - Template literal types & string manipulation utilities
  - Dot-notation object path resolvers (`Paths<T>`, `PathValue<T, P>`)
  - Tuple manipulation types (Push, Pop, Shift, Unshift)
  - Type-level performance budgets & preventing compiler recursion depth errors
* **Practical Competency:** Create safe, ergonomic type helpers for form paths, nested state updates, and schema mappers.
* **Graduation Criteria:** Author a type-safe `get(object, "nested.path.key")` resolver with complete autocomplete and return type inference.

---

### [KPI 10 — Type Assertions & Escape Hatches](./10-Type-Assertions-Escape-Hatches/README.md)
* **Tier:** 🔴 MUST KNOW
* **Purpose:** Understand when and how to safely use type assertions, non-null assertions, `any`, and `@ts-expect-error` without compromising type safety.
* **Core Scope:**
  - Type assertions (`as Type`) vs type casting / conversion
  - Double assertions (`as unknown as T`) and their severe hazards
  - Non-null assertion operator (`!`) and runtime risks
  - `const` assertions (`as const`) for deep immutability
  - `@ts-expect-error` vs `@ts-ignore` (strict compiler comment directives)
  - Defending against unsafe third-party library typings
* **Practical Competency:** Audit a codebase for unsafe type assertions and replace them with runtime type guards or safe narrowing.
* **Graduation Criteria:** Successfully refactor an untyped legacy module using safe narrowing, removing all `as any` and `!` assertions.

---

### [KPI 11 — Runtime Validation & Type Safety Boundaries](./11-Runtime-Validation-Type-Safety-Boundaries/README.md)
* **Tier:** 🔴 MUST KNOW
* **Purpose:** Bridge the gap between static types and dynamic external runtime data using schema validation libraries (Zod, Valibot) and type inference.
* **Core Scope:**
  - Why TypeScript cannot validate external runtime data (APIs, localStorage, user input)
  - Schema-first validation with Zod / Valibot
  - Type inference from runtime schemas (`z.infer<typeof Schema>`)
  - Safe API client wrappers & response validation
  - Environment variable validation & type-safe configuration loading
  - Designing resilient boundary architectures
* **Practical Competency:** Guarantee end-to-end type safety at all I/O boundaries, ensuring unvalidated runtime data never infects internal domain logic.
* **Graduation Criteria:** Implement a type-safe API client that validates incoming JSON payloads at runtime and infers the static domain type automatically.

---

### [KPI 12 — Classes & Object-Oriented TypeScript](./12-Classes-Object-Oriented-TypeScript/README.md)
* **Tier:** 🟢 GOOD TO KNOW
* **Purpose:** Apply TypeScript's OOP enhancements (access modifiers, abstract classes, parameter properties) where appropriate vs functional composition.
* **Core Scope:**
  - Access modifiers (`public`, `private`, `protected`) vs ES `#private` fields
  - `readonly` properties in classes
  - Parameter properties shorthand constructor syntax
  - Abstract classes and `implements` interface contracts
  - OOP vs Functional composition in modern frontend architecture
* **Practical Competency:** Use TypeScript classes effectively for domain services, SDK design, or stateful engines when OOP fits the problem.
* **Graduation Criteria:** Implement an abstract base service class with parameter properties and strict access controls.

---

### [KPI 13 — Modules, Declaration Files & Ambient Types](./13-Modules-Declaration-Files-Ambient-Types/README.md)
* **Tier:** 🟢 GOOD TO KNOW
* **Purpose:** Manage `.d.ts` declaration files, declaration merging, module augmentation, ambient types, and untyped third-party packages.
* **Core Scope:**
  - Declaration files (`.d.ts`) and ambient module declarations (`declare module`)
  - Declaration merging (interfaces, namespaces)
  - Module augmentation for expanding global or third-party types (e.g. `Express`, `Window`)
  - Managing `@types/*` dependencies and DefinitelyTyped
  - Module resolution algorithms (`node16`, `nodenext`, `bundler`)
* **Practical Competency:** Augment poorly typed third-party libraries and write clean declaration files for internal JS utilities.
* **Graduation Criteria:** Successfully augment a global window/third-party library interface and author a type declaration for an untyped NPM module.

---

### [KPI 14 — TypeScript Compiler & Configuration](./14-TypeScript-Compiler-Configuration/README.md)
* **Tier:** 🔴 MUST KNOW
* **Purpose:** Master `tsconfig.json` flags, strictness settings, path aliases, compiler targets, and project references.
* **Core Scope:**
  - `tsconfig.json` anatomy and inheritance (`extends`)
  - Strict mode flags (`strict`, `strictNullChecks`, `noImplicitAny`, `noUncheckedIndexedAccess`)
  - Target, module, and moduleResolution configurations
  - Path aliases (`paths`, `baseUrl`) and bundler integration
  - TypeScript Project References (`composite`, `references`) for monorepos
* **Practical Competency:** Configure high-performance, strict `tsconfig.json` setups tailored for monorepos, React apps, and build tools.
* **Graduation Criteria:** Draft an enterprise strict `tsconfig.json` baseline with path aliases and `noUncheckedIndexedAccess` enabled without build breaks.

---

### [KPI 15 — TypeScript Performance & Large Codebases](./15-TypeScript-Performance-Large-Codebases/README.md)
* **Tier:** 🟢 GOOD TO KNOW
* **Purpose:** Diagnose and optimize slow type-checking compilation times, complex type recursion, and IDE developer experience in large codebases.
* **Core Scope:**
  - Type checker performance diagnostics (`tsc --extendedDiagnostics`, `--generateTrace`)
  - Identifying expensive recursive types and large union computations
  - Optimizing interface vs type alias evaluation speed
  - Incremental compilation (`incremental`, `.tsbuildinfo`)
  - DX considerations: type complexity vs developer productivity
* **Practical Competency:** Audit and optimize slow TypeScript compilation speeds in large frontend enterprise repositories.
* **Graduation Criteria:** Run type-checking diagnostics, locate a complex type bottleneck, and optimize its checking speed by >50%.

---

### [KPI 16 — Type-Safe Application Architecture](./16-Type-Safe-Application-Architecture/README.md)
* **Tier:** 🟢 GOOD TO KNOW
* **Purpose:** Architect end-to-end type-safe frontend systems using domain models, DTOs, discriminated union state machines, and Result error types.
* **Core Scope:**
  - Domain models vs Data Transfer Objects (DTOs)
  - Architectural boundary layers (API contracts, UI state, Storage state)
  - Modeling complex application states as Finite State Machines using unions
  - Error modeling: Throwing exceptions vs Result/Either types (`{ success: true; data: T } | { success: false; error: E }`)
  - Avoiding global type pollution and leaky abstractions
* **Practical Competency:** Architect clean, refactor-resilient domain models and state management layers for enterprise applications.
* **Graduation Criteria:** Design a multi-step checkout state machine enforcing valid state transitions purely via TypeScript's type system.

---

### [KPI 17 — TypeScript with React & Next.js Preparation Layer](./17-TypeScript-React-Nextjs-Preparation/README.md)
* **Tier:** 🔴 MUST KNOW
* **Purpose:** Prepare for React and Next.js by mastering prop typing, event handlers, generic components, hooks typing, and server/client boundaries.
* **Core Scope:**
  - Component props modeling (`children`, optional props, discriminated prop unions)
  - Event handler typing (`React.MouseEvent`, `React.ChangeEvent`)
  - Generic React components (`<List<T> items={...} />`)
  - Typing custom hooks and `useRef` / `useContext`
  - Server/Client data boundary considerations in SSR/RSC (Next.js)
  - Avoiding `React.FC` anti-patterns & adopting inference-first prop typing
* **Practical Competency:** Author clean, type-safe React component interfaces and custom hooks with maximum type inference.
* **Graduation Criteria:** Design a reusable, generic React table component with type-safe column accessors and row selection.

---

## 🎓 TypeScript Graduation Project

### [KPI 18 — Enterprise Type-Safe E-Commerce Domain Engine & SDK](./18-Graduation-Project/README.md)
* **Tier:** 🔴 CAPSTONE MASTER

**Description:**
Build a headless, fully type-safe E-Commerce Domain Engine & API SDK. The project features a strict state-machine checkout pipeline, typed event bus, runtime Zod API validation layer, custom generic query builder, and clean domain boundaries—configured under strict compiler settings.

### What the Project Must Demonstrate:
1. **Strict Compiler Setup:** Configured with `strict: true`, `noUncheckedIndexedAccess: true`, path aliases, and project references.
2. **Domain State Machine:** Cart & Checkout lifecycle modeled as Discriminated Unions with exhaustiveness checking (`never`).
3. **Runtime Boundary Layer:** External product catalog and checkout payloads validated via Zod schema inference.
4. **Generic SDK & Query Builder:** Type-safe API client supporting nested path lookups (`Path<T>`) and typed response transformations.
5. **Typed Event Bus:** Custom event emitter leveraging mapped/template-literal types for event subscription names.
6. **React/Next.js Prep API:** Custom React hook bindings (`useCartState`) exposing clean, inferred prop types.

### Level 5 Graduation Checklist:
- [ ] Zero usage of `any` or loose `as` assertions.
- [ ] 100% strict `tsconfig.json` compliance with `noUncheckedIndexedAccess`.
- [ ] All external API calls validated through Zod runtime boundaries.
- [ ] All state transitions checked exhaustively via `never`.
- [ ] Generics used purposefully with explicit constraints (`extends`).
- [ ] Type-checking build finishes with clean diagnostics.

---

## 📌 Compact Level 5 Structure

```text
LEVEL 5 — TYPESCRIPT
│
├── KPI 1  → TypeScript Mental Model
├── KPI 2  → Type System Fundamentals
├── KPI 3  → Object Type Modeling
├── KPI 4  → Union Types & Type Narrowing
├── KPI 5  → Functions & Advanced Function Typing
├── KPI 6  → Generics Deep Dive
├── KPI 7  → Advanced Type Operators
├── KPI 8  → Built-In Utility Types
├── KPI 9  → Custom Utility Types & Type-Level Programming
├── KPI 10 → Type Assertions & Escape Hatches
├── KPI 11 → Runtime Validation & Type Safety Boundaries
├── KPI 12 → Classes & Object-Oriented TypeScript
├── KPI 13 → Modules, Declaration Files & Ambient Types
├── KPI 14 → TypeScript Compiler & Configuration
├── KPI 15 → TypeScript Performance & Large Codebases
├── KPI 16 → Type-Safe Application Architecture
├── KPI 17 → TypeScript with React & Next.js Preparation Layer
└── KPI 18 → Graduation Project
        ↓
LEVEL 6 → React Fundamentals
```

---

[⬅️ Level 04: Browser Internals](../04-Browser-Internals-Web-Platform/README.md) | [📚 Frontend Master Hub](../README.md) | [Level 06: React Fundamentals ➡️](../06-React-Fundamentals/README.md)
