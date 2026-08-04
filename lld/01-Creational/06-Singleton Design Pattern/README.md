# 🔒 Singleton Design Pattern

---

## 🧭 Section 0: Formal Definition

> **A Singleton** is a creational design pattern that ensures a class has **exactly one instance** throughout the application's lifetime, and provides a **global access point** to that instance.

**The Two Guarantees a Singleton Must Make:**
1. Only one instance ever exists — no matter how many threads call `getInstance()`
2. That instance is globally accessible — from anywhere in the codebase

**Invariant (must always hold):**
```java
assert PaymentGateway.getInstance() == PaymentGateway.getInstance(); // Must ALWAYS be true
```

---

### 🌱 Beginner's 5-Second Mental Models

> **1. The Kitchen Wall Clock Metaphor:**
> * **Normal Objects (`new`):** The Cookies baked in the oven. Each cookie has its own unique shape, icing, and toppings.
> * **`static` Singleton:** The Kitchen Wall Clock. There is only ONE clock hanging on the wall, shared by every cookie baked in that kitchen.

> **2. The ConfigManager Disk Analogy:**
> Reading a `.env` file from disk, parsing JSON/YAML, and validating strings is expensive (~100ms).
> * **Without Singleton:** Every time a class calls `new ConfigManager()`, it re-reads the disk file 1,000 times for 1,000 requests.
> * **With Singleton:** `getInstance()` parses the `.env` file ONCE on startup and hands the SAME in-memory object to all 1,000 requests in 0.0001ms.

---

### 🌳 Decision Tree: "Singleton vs. Dependency Injection vs. Utility Class"

```
                 Does this component hold STATE or perform EXPENSIVE INITIALIZATION?
                                             │
                   ┌─────────────────────────┴─────────────────────────┐
                   ▼                                                   ▼
                【 YES 】                                            【 NO 】
                   │                                                   │
  Are you using a Dependency Injection                 Use a Static Utility Class
  framework (Spring, NestJS, Guice)?                   (private constructor + public static methods,
                   │                                   e.g. Math.sqrt, JsonUtils)
        ┌──────────┴──────────┐
        ▼                     ▼
     【 YES 】              【 NO 】
        │                     │
 Use Framework        Use Manual Singleton Pattern
 Singleton Scope      (Bill Pugh Holder or Enum)
 (@Service / @Bean)   to guarantee 1 instance
```

---


## ⚠️ 2. The Anti-Pattern Debate (Senior Awareness)

> **"Singleton is the most abused pattern in Java."** — Every senior who has ever maintained legacy enterprise code.

The core problem: **Singleton = hidden global state**.

```java
// How you write it:
Logger.getInstance().log("something");

// What you're actually doing:
GLOBAL_LOGGER.log("something");
// → Your class now secretly depends on a global.
// → You cannot test it without the real Logger running.
// → You cannot swap implementations without touching every call site.
```

**The modern alternative: Dependency Injection**
```java
// ❌ Old way — Singleton pulled from global scope
class OrderService {
    public void placeOrder() {
        PaymentGateway.getInstance().charge();   // Untestable, tightly coupled
    }
}

// ✅ Modern way — Singleton managed by DI container (Spring @Bean)
class OrderService {
    private final PaymentGateway gateway;
    
    public OrderService(PaymentGateway gateway) {  // Injected!
        this.gateway = gateway;
    }
}
// Spring ensures only ONE PaymentGateway bean exists.
// Tests inject a mock. Zero global state in your class.
```

**When to still use manual Singletons:**
- You are NOT using a DI framework (embedded systems, Android without Hilt, etc.)
- The Singleton is truly stateless (just a utility/registry)
- You explicitly need eager initialization at class-loading time

---

## 🧩 3. Singleton vs. SOLID Principles (The Senior Perspective)

The Singleton pattern is often criticized because it notoriously **violates** several SOLID principles when used naively. A Senior Engineer must understand this paradox:

- **S - Single Responsibility Principle (SRP): ❌ Violates**
  A classic Singleton does *two* things: it manages its own lifecycle (creation and restriction) AND performs its actual business logic. (Solution: Use Dependency Injection to externalize lifecycle management).
- **O - Open/Closed Principle (OCP): ❌ Violates**
  If classes tightly couple themselves to `Database.getInstance()`, you cannot extend the `Database` behavior (e.g., swapping to a `TestDatabase` or `InMemoryDatabase`) without modifying the calling code.
- **L - Liskov Substitution Principle (LSP): ⚠️ Difficult**
  Singletons are notoriously hard to subclass. The `getInstance()` method is static, and static methods cannot be polymorphically overridden in Java.
- **I - Interface Segregation Principle (ISP): ✅ Unaffected**
  Singleton doesn't directly impact interface design.
- **D - Dependency Inversion Principle (DIP): ❌ Violates**
  Consumers depend on a concrete implementation rather than an abstraction. Calling `Logger.getInstance()` creates a hard-coded dependency instead of relying on an `ILogger` interface being injected.

**The Fix:** Modern architecture solves these SOLID violations by moving the "Singleton" responsibility to a framework (like Spring) and injecting the dependency as an interface.

---

## 🔬 4. The 4 Evolutionary Stages

### Stage 1a: Naive Lazy Init — ❌ Thread Unsafe
```java
public static Stage1NaiveLazy getInstance() {
    if (instance == null) {           // Thread A and B both see null
        instance = new Stage1NaiveLazy();  // BOTH create an instance!
    }
    return instance;
}
```
**Bug:** Race condition. In high-concurrency, you get 2+ instances.

---

### Stage 1b: Synchronized Method — ❌ Performance Bottleneck
```java
public static synchronized Stage1bSynchronizedMethod getInstance() {
    if (instance == null) {
        instance = new Stage1bSynchronizedMethod();
    }
    return instance;
}
```
**Bug:** The lock is held on EVERY call — even after the instance is created. 1000 threads reading the instance = 1000 sequential lock acquisitions. Kills throughput.

---

### Stage 2: Double-Checked Locking — ✅ Correct, But Complex
```java
private static volatile Stage2DoubleChecked instance;  // volatile is MANDATORY

public static Stage2DoubleChecked getInstance() {
    if (instance == null) {           // Fast path — no lock
        synchronized (Stage2DoubleChecked.class) {
            if (instance == null) {   // Guard after acquiring lock
                instance = new Stage2DoubleChecked();
            }
        }
    }
    return instance;
}
```
**The `volatile` is critical:** Without it, the CPU/compiler can reorder instructions so that `instance` is assigned *before* the constructor finishes running. Another thread sees a non-null but partially-constructed object — one of the most subtle bugs in Java.

---

### Stage 3: Bill Pugh — ⭐⭐⭐ Clean & Lock-Free
```java
public class Stage3BillPugh {
    private static class InstanceHolder {
        private static final Stage3BillPugh INSTANCE = new Stage3BillPugh();
    }
    
    public static Stage3BillPugh getInstance() {
        return InstanceHolder.INSTANCE;   // JVM classloader handles thread-safety
    }
}
```
**Why this works:** The JVM guarantees that class initialization is atomic and happens exactly once. `InstanceHolder` is only loaded when `getInstance()` is first called — and the JVM handles all the synchronization for us, invisibly.

---

### Stage 4: Enum Singleton — ⭐⭐⭐⭐⭐ Unhackable
```java
public enum Stage4EnumSingleton {
    INSTANCE;
    
    public void processPayment(double amount) { ... }
}

// Usage:
Stage4EnumSingleton.INSTANCE.processPayment(100.0);
```
**Why this is the ultimate solution:**
1. **Reflection-proof:** `Constructor.setAccessible(true)` throws an exception for enums
2. **Serialization-proof:** Enum deserialization never creates a new instance
3. **Thread-safe by spec:** Java spec guarantees enum initialization is atomic
4. **Brevity:** Zero boilerplate

---

## 🎭 5. Junior vs. Senior Comparison

| Concern | Junior | Senior |
|---|---|---|
| **Thread Safety** | Slaps `synchronized` on the whole method | Uses Bill Pugh or Enum |
| **`volatile` awareness** | Doesn't know it's needed | Explains instruction reordering without prompting |
| **Testing** | Returns production Singleton in tests | Passes mock via constructor; Singleton managed by DI |
| **Reflection attack** | Doesn't know it's possible | Uses Enum to prevent it; or throws exception in constructor |
| **Use judgment** | Uses Singleton for every shared object | Prefers DI; uses Singleton only when DI framework is absent |

---

## 🏢 6. Real-World System Design Uses

| System | How Singleton Appears |
|---|---|
| **Spring `@Bean` (singleton scope)** | Spring ApplicationContext manages one bean instance — the framework IS the Singleton pattern |
| **Java `Runtime.getRuntime()`** | Classic Bill Pugh-style singleton to access JVM runtime |
| **Android `Application` class** | One instance per process — effectively a Singleton |
| **Database Connection Pool (HikariCP)** | One `HikariDataSource` per datasource config, shared across all threads |
| **Logging frameworks (SLF4J/Log4j)** | Single logging registry per JVM; loggers are cached by name |

---

## 🧠 7. FAANG Interview Q&A

**Q: Can you break a Singleton with Java Reflection?**
```java
// Yes — on Stage2/Stage3 (class-based singletons):
Constructor<Stage3BillPugh> c = Stage3BillPugh.class.getDeclaredConstructor();
c.setAccessible(true);
Stage3BillPugh hacked = c.newInstance();  // Creates a SECOND instance!

// Fix: Throw in constructor if already initialized
private Stage3BillPugh() {
    if (InstanceHolder.INSTANCE != null) {
        throw new IllegalStateException("Use getInstance()");
    }
}
// OR: Use Enum Singleton (immune by specification)
```

**Q: Can you break a Singleton via Serialization?**
```java
// Yes — deserializing a Singleton creates a NEW object!
// Fix for class-based: implement readResolve()
protected Object readResolve() {
    return getInstance();  // Returns existing instance instead of deserialized copy
}
// OR: Use Enum Singleton (immune by specification)
```

**Q: What happens with multiple ClassLoaders?**
> Each classloader has its own namespace. If two classloaders load the same class, you get two `static` fields — two "singletons." This is relevant in OSGi, application servers (Tomcat), and plugins. Fix: Use a shared parent classloader or a registry pattern.

**Q: How does Spring manage Singletons without the pattern?**
> Spring's `ApplicationContext` internally uses a `ConcurrentHashMap<String, Object>` as a bean registry. Singleton scope = store the bean after first creation and return the same reference every time. No `synchronized getInstance()` needed — the container manages all of it.

---

## 🌍 8. Cross-Language: Singleton in Python, TypeScript, and Go

### 🐍 Python

Python modules are Singletons by default — they are only loaded once per interpreter session.

```python
# The simplest Python singleton: just use a module
# config.py
_api_key = "stripe_live_key_xyz"   # Module-level variable

def get_api_key():
    return _api_key

# In any file:
import config
config.get_api_key()  # Same value everywhere — module loaded once
```

**Class-based Python Singleton:**
```python
class PaymentGateway:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

# Thread-safe Python:
import threading
_lock = threading.Lock()

class PaymentGateway:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            with _lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance
```

| Java | Python |
|---|---|
| Enum Singleton | Module-level variable (simplest) |
| Bill Pugh / Double-checked | `__new__` + threading.Lock |
| DI Framework | No enforcement; convention-based |

---

### 🟦 TypeScript

TypeScript modules are also Singletons by nature (Node.js module cache).

```typescript
// The simplest TS singleton: just export an instance from a module
// paymentGateway.ts
class PaymentGateway {
    private apiKey: string;
    private constructor() { this.apiKey = process.env.STRIPE_KEY!; }
    charge(amount: number) { console.log(`Charging $${amount}`); }
}

export const paymentGateway = new PaymentGateway();
// ↑ Module cache ensures this is created exactly once
// Any file that imports paymentGateway gets THE SAME instance
```

**Traditional class-based:**
```typescript
class PaymentGateway {
    private static instance: PaymentGateway;
    private constructor() {}

    static getInstance(): PaymentGateway {
        if (!PaymentGateway.instance) {
            PaymentGateway.instance = new PaymentGateway();
        }
        return PaymentGateway.instance;
    }
}
```

**⚡ Async Singleton in TS: Promise Caching (Promise Memoization):**
While synchronous JS memory is single-threaded, `async` operations (e.g. database connection or file I/O) yield execution back to the Event Loop. To prevent multiple async requests from starting duplicate DB connection attempts, cache the **Promise** itself:

```typescript
class AsyncConfigManager {
    // Cache the Promise, NOT the resolved object!
    private static initPromise: Promise<Record<string, string>> | null = null;

    public static async getConfig() {
        if (!this.initPromise) {
            // First caller starts the async I/O and caches the Promise
            this.initPromise = readConfigFromDisk(); 
        }
        // All subsequent callers await the EXACT SAME promise!
        return this.initPromise;
    }
}
```

| Java | TypeScript |
|---|---|
| Enum Singleton | Module export (`export const db = new DB()`) |
| `volatile` + double-check | Not needed for sync code; **Promise Caching** for async |
| Multi-Threaded Locking | Single-Threaded Event Loop (Zero locks on sync memory) |
| Multi-Core Scaling | Multi-process clusters (PM2 / Docker) + Redis state |

---

### 🐹 Go

Go runs lightweight **Goroutines** across multiple CPU cores, meaning **Goroutines CAN race on memory** just like Java threads.

Go uses `sync.Once` — the idiomatic and bulletproof Go Singleton primitive:

```go
import (
    "os"
    "sync"
)

type PaymentGateway struct {
    apiKey string
}

var (
    gateway *PaymentGateway
    once    sync.Once
)

func GetGateway() *PaymentGateway {
    once.Do(func() {
        gateway = &PaymentGateway{apiKey: os.Getenv("STRIPE_KEY")}
    })
    return gateway
}
```

**Package-Level `func init()` (Go's Eager Startup Init):**
```go
var AppConfig *Config

// init() is executed ONCE by the Go runtime at package load time (100% thread-safe)
func init() {
    AppConfig = &Config{Port: "8080"}
}
```

`sync.Once` is Go's equivalent of Bill Pugh — guaranteed to run exactly once, even under concurrent access from 10,000 goroutines, with zero developer-managed locks.

| Java | Go |
|---|---|
| `volatile` + double-check | `sync.Once` |
| `static { }` block | `func init()` |
| Bill Pugh | `sync.Once` |
| Constructor DI | `func NewService(repo DBRepository) *Service` |

---

## 📚 9. Further Reading / Patterns Linked

- **Singleton + Factory Method** → The factory itself is often a Singleton (see `07-Combined-Patterns`)
- **Singleton + Abstract Factory** → One platform factory per runtime (see `07-Combined-Patterns`)
- **Singleton (Enum) ties back to** → `00-Foundations/01-OOP_Basics/05-Advanced_Enums` — Enums are the only truly unbreakable Singleton in Java

---

## 🔗 10. Vault Interlinking Map & Cross-References

```
                          ┌──────────────────────────────────────────┐
                          │         Singleton Pattern (Creational)   │
                          └────────────────────┬─────────────────────┘
                                               │
           ┌───────────────────────────────────┼───────────────────────────────────┐
           ▼                                   ▼                                   ▼
 🏛️ SOLID & OOP Foundations           📂 Case Studies                     🌐 HLD Architecture
 ├─ Dependency Inversion (DIP)         ├─ Case Study 1: Notification Config├─ In-Memory vs Distributed Cache
 ├─ Single Responsibility (SRP)        └─ Case Study 2: HikariCP DB Pool   ├─ Multi-Process Node PM2/Docker
 └─ Constructors & Private Scope                                           └─ Distributed Locks (Redis/ZK)
```

### 1️⃣ Case Studies & Practical Implementations
* **[Singleton Case Studies](CASE_STUDY.md)**: Production case studies featuring **HikariCP Database Connection Pool** (Bill Pugh + Object Pool + Factory) and **Notification System Config**.
* **[Java 4-Stage Evolution Code](./JAVA/README.md)**: Runnable Java benchmarks comparing Naive Lazy vs Synchronized vs Double-Checked Locking vs Bill Pugh vs Enum Singletons.

### 2️⃣ Foundational Rules & SOLID Principles
* **[Dependency Inversion Principle (DIP)](../../00-SOLID_Principles/05-Dependency_Inversion/README.md)**: Explains how to depend on `IPaymentGateway` contracts rather than pulling concrete `PaymentGateway.getInstance()` Singletons.
* **[Constructors & Object Integrity](../../00-Foundations/01-OOP_Basics/03-Constructors/README.md)**: Deep dive into `private` constructors and compiler default constructor injection.
* **[Static & Access Modifiers](../../00-Foundations/01-OOP_Basics/04-Static_and_Access_Modifiers/README.md)**: Metaspace vs Heap memory allocation for `static` variables.

### 3️⃣ HLD Architecture & System Scale
* **[HLD Cache Fundamentals](../../../hld/04-Caching-Deep-Dive/01-Cache-Fundamentals.md)**: Explains how single-JVM `static` memory singletons scale out to distributed Redis/Memcached clusters across multi-node services.


## 🧠 Tracker Integration

*   **Trigger Phrases:** "Only one instance", "Exactly one instance needed", "Global access point to shared resource", "Shared manager for stateful resources".
*   **SOLID Connection:** Primarily addresses **SRP** by centralizing the responsibility of instance management. However, it can violate SRP if the singleton also handles too much business logic.
*   **Confuses With:** 
    *   **Static Utility Classes:** (Hook: Singletons are objects that can be passed as arguments, implement interfaces, and be lazily initialized; static classes are just containers for methods).
    *   **Dependency Injection (Singleton Scope):** (Hook: DI manages the "exactly one" rule externally; the Pattern manages it internally. Seniors prefer DI).
*   **Anti-Freeze Starter Code:** 
    ```java
    public class Manager {
        private static volatile Manager instance;
        private Manager() {} // Prevent instantiation
        public static Manager getInstance() { ... }
    }
    ```
*   **Self-Assessment Prompts:** 
    1. Can you explain *why* `volatile` is mandatory in double-checked locking?
    2. Do you know how to prevent breaking a singleton via Reflection and Serialization?
    3. Can you articulate the trade-off between a manual Singleton and Spring's Singleton scope?
