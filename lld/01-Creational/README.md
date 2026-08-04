# 🏗️ Creational Design Patterns: The SDE-2+ Master Guide

> **"A Junior Developer memorizes how to write a pattern. A Senior Engineer knows when to delete one."**

In a senior-level (SDE-2/SDE-3) Low-Level Design (LLD) interview, the focus isn't on drawing a UML diagram. It is on **Pragmatism, Trade-off Analysis, and Production-Grade Stability.**

---

## 🛠️ The "Strong Hire" Philosophy

When a senior candidate discusses creational patterns, they MUST demonstrate awareness of:
1.  **Testability:** Patterns that hide global state (like a naive Singleton) are "Bad Patterns" because they cannot be mocked in unit tests.
2.  **Concurrency:** Every creation method must be thread-safe by design in a modern, multi-threaded environment.
3.  **Clean Code:** We prefer **Immutability** and **Fail-Fast** error handling over silent failures.
4.  **Framework Reality:** In modern Java (Spring/Guice), the **Inversion of Control (IoC) Container** handles most of our creation logic. We only write manual patterns for truly dynamic or custom logic.

---

## ⚡ Senior Synergy: How Patterns Stack

In enterprise systems (like Spring or Kubernetes), patterns are never solo. Use these combinations to impress your interviewer:

1.  **Singleton + Registry:** The foundation of **Spring IoC**. A single registry (Singleton) that holds and manages all other beans (Registry Factory).
2.  **Abstract Factory + Singleton:** One platform-specific factory (Mac/Windows) that is shared globally across the app.
3.  **Builder + Prototype:** Use a Builder to create a complex "Master Archetype," then use Prototype to clone it 1,000 times for performance.
4.  **Factory Method + Template Method:** The base class defines the workflow, but the Factory Method allows subclasses to decide *what* object is used in that workflow.

---

## ⏱️ Interview Strategy: The 30-Minute Target

In a 45-min interview, you have ~30 mins to code. **Speed + Working Solution = Success.**

1.  **Phase 1: [INTERVIEW_MVP] (0-15 mins)**
    *   Focus on **Interfaces** and the core pattern structure.
    *   Goal: Get a **Compilable and Runnable** solution that covers the main requirements.
    *   *Why?* Submitting early shows confidence and leaves time for the "Senior" discussion.

2.  **Phase 2: [PRODUCTION_ENHANCEMENT] (15-30 mins)**
    *   Add **Thread Safety** (e.g., `volatile`, `synchronized`).
    *   Add **Error Handling** (e.g., throw `IllegalArgumentException` instead of returning null).
    *   *Why?* This is where you demonstrate SDE-2+ maturity.

---

## 📈 Creational Patterns: Pedagogical Learning Order

| # | Pattern | Pragmatic Use-Case | 🏗️ Senior "Strong Hire" Insight |
| :--- | :--- | :--- | :--- |
| **01** | **Simple Factory** | **The '80% Solution'** for centralizing basic creation logic. | *"Start here. Don't over-engineer to a full Factory Method unless you actually need polymorphism."* |
| **02** | **Factory Method** | **Plug-in Architectures** where you want to add new types without changing existing code. | *"Use it when you need to follow the **Open/Closed Principle**, but watch out for 'Class Explosion'—sometimes a simple Registry is cleaner."* |
| **03** | **Abstract Factory** | **Suites of Related Products** (e.g., UI Themes, Multi-DB Connectors). | *"The goal isn't just 'creation'; it is **Consistency Enforcement**. It makes adding new families easy but adding new product types very rigid."* |
| **04** | **Builder** | **Objects with >3 Optional Fields** or complex validation. | *"Replace **Telescoping Constructors** and ensure **Immutability**. Perform all cross-field validation in the `.build()` method before the object is 'born'."* |
| **05** | **Prototype** | **Expensive Object Creation** (e.g., objects requiring DB/Network calls). | *"Use it as a performance cache for pre-configured objects. **Avoid Java's `Cloneable`**; use **Copy Constructors** or **Serialization** for a safe deep-copy."* |
| **06** | **Singleton** | **Global, Stateful Resources** (e.g., DB Connection Pool, Config Manager). | *"Don't just use Singleton; use **Dependency Injection**. It provides the same 'exactly one instance' guarantee while maintaining **Testability** via mocks."* |
| **08** | **Object Pool** | **Expensive, Limited Resources** (DB Connections, Sockets). | *"Use a BlockingQueue to manage a pool of pre-warmed resources. It's the key to scaling 10k users against a limited DB."* |

---

## 🎓 FAANG-Level Interview Pro-Tips (The "Impact" Section)

### 1. "Fail-Fast and Loud"
**Never return `null` from a factory.** A `NullPointerException` (NPE) is the most expensive bug to track down. A senior candidate always says: *"My creation methods throw a loud `IllegalArgumentException` with the invalid type name. We catch the bug at the source, not 10 stack frames later."*

### 2. "The Immutability Advantage"
**Prefer Builder for Thread-Safety.** In high-concurrency LLD problems, an immutable object is **Thread-Safe by Default**. If an object doesn't change after it's built, you don't need locks, `synchronized` blocks, or `volatile` keywords to read its data safely.

### 3. "Registry over Switch"
**O(1) beats O(N).** In production systems, instead of a 20-case `switch` statement in your factory, use a **Map-based Registry** with Java 8 `Supplier` references. This is faster, cleaner, and allows you to "plug in" new types at runtime without modifying the factory class itself.

### 4. "Pattern vs. Idiom"
**Know the nuance.** A senior developer knows that **Simple Factory** is an "idiom" or "best practice," not a formal GoF pattern. This demonstrates a deep understanding of architectural history and the GOF (Gang of Four) standard.

### 5. "The Testability Question"
**Always ask yourself: 'How do I mock this?'** If you use a static `getInstance()` or a hardcoded `new` inside your business logic, it's hard to test. A strong candidate always prefers **Inversion of Control (IoC)**, where the creation is delegated to a factory or DI container that can be swapped during testing.

---

## 📂 Navigation (Follow the Pedagogical Learning Order)

1.  [**01-Simple Factory**](./01-Simple%20Factory%20Design%20Pattern/README.md) — The pragmatic starting point for centralized creation.
2.  [**02-Factory Method**](./02-Factory%20Method%20Design%20Pattern/README.md) — Decentralized creation for plug-in systems.
3.  [**03-Abstract Factory**](./03-Abstract%20Factory%20Design%20Pattern/README.md) — Enforcing consistency across product families.
4.  [**04-Builder**](./04-Builder%20Design%20Pattern/README.md) — Solving "Constructor Hell" and ensuring immutability.
5.  [**05-Prototype**](./05-Prototype%20Design%20Pattern/README.md) — Performance-optimized cloning for expensive objects.
6.  [**06-Singleton**](./06-Singleton%20Design%20Pattern/README.md) — The thread-safety, memory, and testability trade-off.


---

---

---

## 🌍 The Polyglot Perspective (Node/TS vs. Golang vs. Java)

As a senior engineer, you must know how these patterns manifest in different runtimes. Here is how creational logic shifts across the stack:

| Pattern | Java (Multi-threaded) | Node/TS (Event Loop) | Golang (Goroutines) |
| :--- | :--- | :--- | :--- |
| **Singleton** | Complex `volatile` + Double-checked locking or `Enum`. | **Module Caching.** Node's `require/import` is a natural singleton. | **`sync.Once`** is the bulletproof, idiomatic way. |
| **Factory** | Heavy Interface + Class hierarchies. | **Functions/Object Literals.** Often just a function returning an object. | **`New` functions** returning interfaces. Simple and flat. |
| **Builder** | Static Inner Classes to solve "Telescoping Constructors." | **Fluent API** or **Partial Objects**. TS types make this very safe. | **Functional Options Pattern.** (Passing `func(*Options)`) is the Go standard. |
| **Prototype** | Copy Constructors or Serialization for Deep Copy. | `Object.assign` or `{...obj}` for shallow; `structuredClone` for deep. | **Manual Copy** or library helpers for deep-cloning structs. |

---

## 💡 "Strong Hire" Talking Points (Node/TS & Go)

### 1. On Singleton (The "Module" Argument)
*   **In Node/TS:** *"In my Node production apps, I relied on the **CommonJS/ESM module cache**. Since Node caches the evaluated module, a simple `export const instance = new Service()` is a thread-safe singleton within a single process. This is much cleaner than the Java class-based boilerplate."*
*   **In Go:** *"I prefer **`sync.Once`**. It ensures that even with 10k goroutines, the initialization function runs exactly once. It’s the Go equivalent of the Bill Pugh singleton, but more idiomatic."*

### 2. On Builder (The "Functional Options" Insight)
*   **In Go:** *"Instead of a heavy Builder class, I use the **Functional Options** pattern in Go. It allows for a clean, variadic API like `NewServer(WithPort(8080), WithTimeout(30))`. This provides the same 'optional parameters' benefit as the Java Builder but fits Go's functional nature."*

### 3. On Factory (The "Dependency Injection" Reality)
*   **In Node/TS:** *"For my Node services handling 10k users, I used **InversifyJS** or simple **Constructor Injection**. Factories were reserved for dynamic runtime decisions (like choosing between S3 or Local storage based on an env var), rather than just for basic object creation."*

---

## ✅ Final SDE-2+ Readiness Checklist (Creational)

*Before your interview, ensure you can answer these with a "Strong Hire" mindset:*

1.  **"Do you know how to break a Singleton?"**
    *   **Senior Answer:** *"Yes, via **Reflection** (bypassing the private constructor), **Serialization** (deserializing creates a new object), and **Cloning**. I prevent these by throwing an exception in the constructor if an instance exists, implementing `readResolve()`, and overriding `clone()` to throw `CloneNotSupportedException`—or simply using an **Enum Singleton** which is immune by the Java spec."*

2.  **"Can you explain why a Simple Factory is an 'idiom' and not a 'pattern'?"**
    *   **Senior Answer:** *"Simple Factory uses a static method with a conditional switch/if-else. It violates the **Open/Closed Principle** because adding a new type requires modifying the factory. It's a 'best practice' or 'idiom' to centralize creation, but it doesn't use the polymorphic inheritance that defines the GoF **Factory Method Pattern**."*

3.  **"When would you use Prototype instead of a simple `new`?"**
    *   **Senior Answer:** *"I use Prototype when **Object Creation is Expensive**. If a 'Warrior' object requires a DB call to load its 3D mesh and stats, it's more pragmatic to cache an 'Original' in a **Prototype Registry** and clone it rather than re-hitting the DB every time. I avoid Java's `Cloneable` and prefer **Copy Constructors** for a safe deep-copy."*

4.  **"How does Abstract Factory enforce consistency?"**
    *   **Senior Answer:** *"It enforces consistency through its **Interface Contract**. By returning a 'Family' of related objects (e.g., MacButton and MacCheckbox), it ensures that a client using `MacFactory` can never accidentally mix a `WindowsButton` into a Mac-themed UI. Consistency is a first-class citizen in this pattern."*

5.  **"Why use a Builder instead of 10 constructors?"**
    *   **Senior Answer:** *"To solve the **Telescoping Constructor** anti-pattern. Instead of confusing constructors with 5 nulls, Builder provides a **Fluent API** that is self-documenting. Most importantly, it allows me to keep the object **Immutable** (`final` fields) and perform cross-field **Validation** in the `.build()` method before the object is instantiated."*

---

> **Ready for the next challenge? Move on to [02-Structural](../02-Structural/README.md) patterns.**
