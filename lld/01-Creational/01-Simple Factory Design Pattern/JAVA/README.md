# Simple Factory Design Pattern

> **The One-Liner Summary:** Simple Factory centralizes object creation logic behind a single static method so that clients never need to know *which concrete class* to instantiate — they only talk to the abstraction.

---

## 📖 1. The Conceptual Core (The "Why")

### The Problem — A Production Story

**Day 1.** A junior dev needs logging in `OrderService`. Reasonable. They write:

```java
// OrderService.java — Day 1
public void placeOrder(String orderId) {
    if (env.equals("dev"))    { new DebugLogger().log("Placing: " + orderId); }
    if (env.equals("prod"))   { new ErrorLogger().log("Placing: " + orderId); }
    if (env.equals("stage"))  { new InfoLogger().log("Placing: " + orderId); }
    // ... business logic
}
```

Fine. Ships. Nobody notices.

**Day 30.** Every team needed logging. Each copy-pasted the same pattern because *it was already there*.

```
OrderService.java       → if (env == dev/prod/stage) { new XxxLogger() }  line 14
PaymentService.java     → same switch                                       line 22
ShippingService.java    → same switch                                       line  9
UserService.java        → same switch                                       line 31
NotificationService.java→ same switch                                       line 40
... 15 files total
```

The decision *"dev→Debug, prod→Error, stage→Info"* is a **single piece of business knowledge** now living in **15 different places**.

**Day 45.** Business introduces a `canary` environment. Needs `WarnLogger`. You write the class in 5 minutes. Then `grep` the codebase, find 15 files, update 12 of them, and ship.

**Day 46 — Production incident.** `ReportingService` produces zero logs on canary. You open it:

```java
// ReportingService.java — lines 6–9
if (env.equals("dev"))   { new DebugLogger().log(msg); }
if (env.equals("prod"))  { new ErrorLogger().log(msg); }
if (env.equals("stage")) { new InfoLogger().log(msg); }
// ← canary case missing. You forgot this file.
// ← No compile error. No test failure. No exception. Pure silence.
```

The `if` block never matched. Business logic ran — but zero evidence in logs. The bug sat invisible for 18 hours.

> [!IMPORTANT]
> **The Core Problem has 3 layers:**
> 1. **Knowledge Duplication** — The mapping *"env → logger type"* is ONE piece of knowledge living in 15 files. Any change must be done N times. Human memory always fails.
> 2. **No Compiler Safety Net** — The missing `canary` branch is syntactically valid Java. The compiler cannot warn you. You are entirely on your own.
> 3. **Wrong Class Responsibility** — `OrderService` knows about orders. It should NOT know that *"in dev, we use DebugLogger"*. Infrastructure knowledge is leaking into domain classes.

### What Simple Factory Does
It extracts the creation decision into **one dedicated class**. When `canary` is needed:
- Change: **1 file** (`LoggerFactory`)
- Callers: **zero changes** — they never did the selection, they just asked
- Silent failure: **impossible** — factory throws immediately for unknown env

> **The one-line summary:** When object creation logic is scattered across callers, adding a new type is a `grep`-and-pray operation. Simple Factory makes it a one-line change in one file.

---

## 🔍 2. The Evolution Story (How We Arrive Here)

This is the most important section for interviews. The pattern doesn't exist in a vacuum — it **evolves** from painful code. Understanding the journey is what separates a senior from a junior.

### 🪜 Stage 0 — The Problem (Direct Construction Everywhere)
The caller knows about *every* concrete class. Object creation is scattered.

```
Client Code                     Concrete Classes
─────────────                   ─────────────────
if DEBUG → new DebugLogger()  ──→ DebugLogger
if INFO  → new InfoLogger()   ──→ InfoLogger
if ERROR → new ErrorLogger()  ──→ ErrorLogger
```

**Caller interaction:** The caller must `import` every concrete class. Adding `WarnLogger` means touching every caller.

### 🪜 Stage 1 — Naive Centralization (Helper Method)
A developer moves all the `if/switch` into one helper method — but it's static, inside the client class itself.

```
Main.java
────────────────────────────────────────────────
static ILogger getLogger(String type) {
    if (type == "DEBUG") return new DebugLogger();
    ...
}
```

Better? Yes. But the creation logic is still inside the client. It can't be reused by other clients without copy-pasting.

### 🪜 Stage 2 — Simple Factory (The Pattern)
Extract the creation method to a **dedicated, separate class** (`LoggerFactory`). All clients call that class.

```
Client Code             LoggerFactory           Concrete Classes
───────────             ─────────────           ─────────────────
ILogger logger   ──→   createLogger(level)  ──→ new DebugLogger()
                                             ──→ new InfoLogger()
                                             ──→ new ErrorLogger()
```

**Caller interaction:** The client imports only `ILogger` and `LogLevel`. It has zero knowledge of `DebugLogger`, `InfoLogger`, or `ErrorLogger`. Adding `WarnLogger` means changing **one file**: `LoggerFactory`.

---

## 👥 3. Who Are the Clients?

The word **"client"** in design patterns means: *any class that uses the factory's output.*

| Role | Before Factory | After Factory |
|---|---|---|
| **Client** | `OrderService`, `PaymentService`, `ShippingService`, `UserService`... | Same classes — but now they only call `LoggerFactory.createLogger()` |
| **What the client knows** | Every concrete class: `DebugLogger`, `InfoLogger`, `ErrorLogger` | Only the abstraction: `ILogger` and `LogLevel` |
| **What the client does** | Creates the object AND uses it — it is a mini-factory | Only uses the object — creation is someone else's job |
| **Who is NOT a client** | — | `LoggerFactory` itself, and the concrete loggers (`DebugLogger`, etc.) |

### The key insight about clients:

```
┌─────────────────── BEFORE (clients are mini-factories) ────────────────────┐
│                                                                             │
│  OrderService  ──creates──→ DebugLogger / InfoLogger / ErrorLogger          │
│  PaymentService ─creates──→ DebugLogger / InfoLogger / ErrorLogger  (copy!) │
│  ShippingService ─creates─→ DebugLogger / InfoLogger / ErrorLogger  (copy!) │
│                                                                             │
│  Every client = User + Creator. Two responsibilities. SRP violated.        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────── AFTER (clients are pure users) ─────────────────────────┐
│                                                                             │
│  OrderService   ──asks──→ LoggerFactory ──creates──→ DebugLogger           │
│  PaymentService ──asks──→ LoggerFactory ──creates──→ InfoLogger            │
│  ShippingService─asks──→ LoggerFactory ──creates──→ WarnLogger             │
│                              ↑                                             │
│                    ONE place. ONE responsibility. SRP respected.           │
└─────────────────────────────────────────────────────────────────────────────┘
```

> **Clients become pure users.** They receive a ready-made `ILogger` and call `log()`. They are completely decoupled from the question of *which* logger, *how* it was constructed, and *whether* it was cached.

---

## 🔄 4. Caller Interaction: Before vs After

### ❌ BEFORE — "Bad Code" Interaction Flow
```
Client.java
    │
    ├── import DebugLogger   ← ❌ Coupled to concrete class
    ├── import InfoLogger    ← ❌ Coupled to concrete class
    ├── import ErrorLogger   ← ❌ Coupled to concrete class
    │
    └── if (level == DEBUG)  → new DebugLogger()
        if (level == INFO)   → new InfoLogger()
        if (level == ERROR)  → new ErrorLogger()
        // Repeated in 15 files
```

**Problems with this flow:**
1. Every client becomes a "mini-factory" that re-implements the same switch logic.
2. Adding a new type requires touching every client.
3. Testing is hard — you can't inject a mock logger without changing the client.

### ✅ AFTER — Simple Factory Interaction Flow
```
Client.java                     LoggerFactory.java
    │                               │
    ├── import ILogger   ✅         ├── switch(level)
    ├── import LogLevel  ✅         │     DEBUG → new DebugLogger()
    │                               │     INFO  → new InfoLogger()
    └── LoggerFactory               │     ERROR → new ErrorLogger()
        .createLogger(level)  ──→   │     WARN  → new WarnLogger()    ← Added once
                                    │     default → throw exception ✅
```

**Benefits of this flow:**
1. Client imports **zero concrete classes** — only the interface and the enum.
2. Adding `WarnLogger` = adding one `case` in one file.
3. The factory can cache instances (stateless loggers don't need to be recreated).

---

## ❌ 5. Junior Mistakes vs. ✅ Senior Solutions

| ❌ The Junior Approach | ✅ The Senior/LLD Approach | 🧠 Why it matters |
| :--- | :--- | :--- |
| `return null` in the `default` case of the factory switch. | `throw new IllegalArgumentException("Unknown level: " + level)` | `null` from a factory is the worst kind of failure — it NPEs 10 frames later with no context. Fail fast and loud. |
| Creating a new logger object on every `createLogger()` call. | Caching instances in a `Map<LogLevel, ILogger>` (Registry/Flyweight). Loggers are **stateless** — there's no reason to create a new one each time. | A high-throughput system calling `createLogger(ERROR)` 100,000 times creates 100,000 identical objects unnecessarily. |
| Using raw `String` as the factory parameter: `createLogger("DEBUG")`. | Using a type-safe `enum LogLevel`. | Strings allow typos (`"DEBG"`). Enums are compile-time safe. The switch is exhaustive. |
| Treating Simple Factory as a GoF Design Pattern (it's not). | Knowing it's a **programming idiom** — a precursor to Factory Method and Abstract Factory. | Uncle Bob explicitly says Simple Factory is NOT a pattern. In an interview, demonstrating this nuance signals senior awareness. |

---

## 🏗️ 6. Real-World Application (System Design)
Simple Factory is the entry point for many real-world creation decisions:
- **JDBC `DriverManager.getConnection(url)`** — returns a `Connection` without you knowing whether it's MySQL, Postgres, or SQLite.
- **`Calendar.getInstance()`** — returns `GregorianCalendar` or another subclass based on locale, without exposing the concrete type.
- **`NumberFormat.getInstance(locale)`** — a factory for locale-specific number formatters.

All three share the same signature: *one static method, returns the abstraction, caller knows nothing concrete.*

---

## 💥 7. FAANG / MNC Interview Preparation

### Q1: "Is Simple Factory a Design Pattern?"
**The Senior Answer:**
No. Simple Factory is a **programming idiom** or **best practice**, not a GoF design pattern. The GoF book does not list it. Robert C. Martin explicitly calls it a "simple factory" to distinguish it from the **Factory Method Pattern**, which IS a GoF pattern and uses polymorphism to enable subclasses to decide which concrete type to create. Simple Factory uses a static method with conditional logic — it is the *conceptual predecessor* to Factory Method.

### Q2: "What is the key OCP (Open/Closed Principle) limitation of Simple Factory?"
**The Senior Answer:**
Every time you add a new product type, you must open and modify `LoggerFactory` to add a new `case`. This violates OCP — the factory is not closed for modification. The fix is the **Factory Method Pattern**: move the creation decision into a subclass of the factory, so adding a new product means adding a new `ConcreteFactory` subclass, with zero changes to the existing factory hierarchy.

### Q3: "When should you use Simple Factory vs Factory Method?"
**The Senior Answer:**
Use Simple Factory when: (1) the variety of types is small and unlikely to grow, (2) the creation logic is truly simple, and (3) you don't need clients to subclass the factory itself. Upgrade to Factory Method when: (1) new product types are regularly added (OCP concern), (2) you want framework-level extensibility where clients provide their own creation logic via subclassing.

---

## 🗂️ 8. Folder Structure & Executable Code

```
JAVA/
├── README.md                        ← You are here (master guide)
│
├── 00-Before-Factory/               ❌ Stage 0: The Problem
│   ├── README.md                    ← Stage brief + run command
│   ├── LoggersV0.java               Logger types (direct import by client)
│   ├── OrderService.java            Service with creation scattered inside it
│   ├── PaymentService.java          Duplicate if/else — the core problem
│   └── Main.java                    Runner
│
├── 01-Naive-Centralization/         🔶 Stage 1: First Attempt
│   ├── README.md                    ← Stage brief + what's still broken
│   └── Main.java                    Private helper — better but not reusable
│
├── logger/                          ✅ Stage 2: The Pattern (production code)
│   ├── ILogger.java                 Contract — only interface clients touch
│   ├── LogLevel.java                Type-safe enum key (DEBUG/INFO/WARN/ERROR/TRACE)
│   ├── LoggerFactory.java           The factory — EnumMap cache, fail-fast throw
│   └── Loggers.java                 All 5 implementations (package-private)
│
└── Main.java                        ✅ Stage 2 Runner (imports zero concrete classes)
```

## ▶️ Run Each Stage

```bash
# Stage 0 — The Problem
javac "00-Before-Factory/*.java"
java -cp "00-Before-Factory" Main

# Stage 1 — Naive Centralization
javac "01-Naive-Centralization/Main.java"
java -cp "01-Naive-Centralization" Main

# Stage 2 — Simple Factory (The Pattern)
javac -d out logger/*.java Main.java
java -cp out Main
```



---

## 📚 9. Further Reading / Patterns Linked (The Upgrade Path)

```
Simple Factory (Idiom)
    ↓ When you need subclasses to decide what to create
Factory Method Pattern (GoF)
    ↓ When you need families of related objects
Abstract Factory Pattern (GoF)
    ↓ When factory selection itself needs to be configurable
Builder Pattern (GoF)
    ↓ When the object has complex construction steps, not just type selection
```

- The caching inside `LoggerFactory` is the **Flyweight Pattern** applied to factory output.
- The registry map `Map<LogLevel, ILogger>` is the **Service Locator** / **Registry Pattern**.
