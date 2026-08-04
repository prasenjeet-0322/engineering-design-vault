# Static and Access Modifiers (Scope & Protection)

> **The One-Liner Summary:** Modifiers define exactly "who" can legally touch your data (Access Control) and "where" your data physically lives (Instance vs. Class level).

---

## 📌 0. Formal Definition — What is `static`?

In Java, every field and method you write belongs to one of two worlds:

| World | Keyword | Belongs to | Created when | Lives until |
|---|---|---|---|---|
| **Instance** | *(no keyword)* | A specific object | `new ClassName()` is called | Object is garbage collected |
| **Class** | `static` | The class blueprint itself | JVM first loads the class | Program ends / class unloaded |

> **`static` = "This member belongs to the class, not to any object."**

The `static` keyword can be applied to:
- **Fields** → one shared variable for the whole JVM
- **Methods** → callable without creating an object (`ClassName.method()`)
- **Blocks** → `static { }` runs once when the class is first loaded
- **Nested classes** → inner class doesn't need an enclosing instance

---

### 🌱 Beginner's 5-Second Mental Models

> **1. The Kitchen Metaphor (`static` vs. `instance`):**
> * **Class (Blueprint):** The Cookie Cutter.
> * **Instance (Object):** The Cookie itself (each cookie has its own unique sprinkles/toppings).
> * **`static`:** The Wall Clock in the kitchen. There is only ONE clock, hanging on the wall, shared by every cookie baked in that kitchen.

> **2. The Security Clearance Metaphor (Access Modifiers):**
> * **`private`**: Your personal Bank PIN (Only YOU know it).
> * **Package-Private (default)**: Your Department's Office Printer (Only people on the same floor/package can use it).
> * **`protected`**: Family Heirloom (Your family/package + any children/subclasses can inherit it).
> * **`public`**: The Street Billboard (Anyone in the city/app can read it).

---

### 🌳 Decision Tree: "Should I make this `static` or `instance`?"

```
                 Does this member need data from a specific Object ('this')?
                                             │
                   ┌─────────────────────────┴─────────────────────────┐
                   ▼                                                   ▼
                【 YES 】                                            【 NO 】
                   │                                                   │
  It MUST be an INSTANCE member                     Does it hold SHARED STATE across objects,
 (e.g. user.balance, order.id)                      or is it a STATELESS UTILITY function?
                                                                       │
                                                   ┌───────────────────┴───────────────────┐
                                                   ▼                                       ▼
                                           【 SHARED STATE 】                     【 STATELESS UTILITY 】
                                                   │                                       │
                                        Use 'static' carefully                  Use 'static' function
                                      (prefer 'static final' constant         (e.g., Math.sqrt, JsonUtils)
                                      to prevent Thread-Safety bugs)
```

---

### ⚙️ What "JVM Loads the Class" Actually Means (Step-by-Step)

Beginners often get confused by *"when the JVM loads the class"*. Here is the exact physical execution order:

1. **On Hard Disk:** Your code is compiled into `Car.class`.
2. **Program Starts:** Memory (RAM) is completely empty of `Car`.
3. **First Reference to `Car` (`Car c1 = new Car()` or `Car.getTotalCars()`):**
   * **Step 3A (Class Loading):** The JVM reads `Car.class` from the hard disk and copies the blueprint into **Metaspace (RAM)**.
   * **Step 3B (`static` Init):** The JVM runs any `static { }` blocks and initializes `static` variables. **(This happens ONCE per JVM run)**.
   * **Step 3C (Object Creation):** Memory is allocated on the **Heap** for `c1`, and the constructor runs.
4. **Second Reference (`Car c2 = new Car()`):**
   * The JVM sees `Car` is **already loaded** in Metaspace! It skips Steps 3A & 3B, and directly creates `c2` on the Heap.

---


### Side-by-side comparison

```java
class BankAccount {
    // INSTANCE field: every account has its OWN balance
    private double balance;

    // STATIC field: ONE value shared by ALL accounts in the entire JVM
    private static int totalAccountsCreated = 0;

    BankAccount(double initialBalance) {
        this.balance = initialBalance;       // unique per object
        totalAccountsCreated++;              // increments the shared counter
    }

    // INSTANCE method: needs 'this' (a specific account's balance)
    public double getBalance() { return this.balance; }

    // STATIC method: no 'this' — operates only on class-level data
    public static int getTotalAccounts() { return totalAccountsCreated; }
}
```

```java
// Calling them:
BankAccount a1 = new BankAccount(1000);
BankAccount a2 = new BankAccount(2000);

a1.getBalance();                     // ← instance method: needs an object
BankAccount.getTotalAccounts();      // ← static method: NO object needed. Returns 2.

// BankAccount.getBalance();         // ← COMPILE ERROR: instance method needs an object
```

### The Formal Rule
> A `static` member does NOT have access to `this`, instance fields, or instance methods — because it runs without any specific object existing. It only knows about other `static` members of the same class.

```java
class Example {
    int instanceField = 10;
    static int staticField = 20;

    static void staticMethod() {
        System.out.println(staticField);   // ✅ OK: static accessing static
        // System.out.println(instanceField); // ❌ COMPILE ERROR: no 'this' here
        // System.out.println(this.field);    // ❌ COMPILE ERROR: 'this' doesn't exist
    }
}
```

---

## 📖 1. The Conceptual Core (The "Why")
*   **The Problem:** If all data is public and tied to instances, it becomes impossible to share data efficiently across a system, and impossible to prevent external components from maliciously mutating your object's internal state.
*   **The Metaphor:** 
    *   **Access Modifiers** are the security clearance levels of a military base (Public = Lobby, Private = Safe vault). 
    *   **Static** = a whiteboard on the wall of the base (Class level) vs. a post-it note in a soldier's pocket (Instance level). Every soldier can read the whiteboard. Only that soldier can read their pocket note.

---


## 🔍 2. Deep Dive: The Mechanics (The "How")

### 2.1 The Metaspace (Static Memory)
`static` variables and methods do not live on the standard Object Heap alongside unique object instances. They live in a special memory region called the **Metaspace**.
*   Because they belong to the blueprint (Class), there is **exactly one copy** of a static variable for the entire JVM.
*   If Thread A modifies `static int count`, Thread B immediately sees the change.

```java
class Counter {
    static int total = 0;  // ONE copy in Metaspace — shared by ALL instances
    int id;                // ONE copy per object in Heap — unique to each instance

    Counter() {
        total++;           // affects the shared counter
        id = total;        // assigns unique per-object value
    }
}
// Counter c1 = new Counter(); // total=1, c1.id=1
// Counter c2 = new Counter(); // total=2, c2.id=2
// Counter.total is 2 — no instance needed to access it
```

### 2.2 Static Methods — "Belongs to the Blueprint, Not the Object"
A `static` method has **no `this` reference**. It cannot touch instance fields because it has no specific object to reach into.

```java
class MathUtils {
    // ✅ static: belongs to the class. Call as MathUtils.square(5). No object needed.
    public static int square(int n) { return n * n; }

    private int value; // instance field
    // ❌ This is WRONG inside a static method:
    // public static void badMethod() { return this.value; } // 'this' doesn't exist here
}
```

**Why does Simple Factory use `static createLogger()`?**
Because you should never need to instantiate a `LoggerFactory` object to get a logger. The factory is a *utility* — you call `LoggerFactory.createLogger(LogLevel.DEBUG)` the same way you call `Math.sqrt(4)`. No object. No state. Just the service.

### 2.3 The Static Block (Class Initializer) — Runs Once at Class Load
A `static { }` block executes **exactly once**, when the JVM first loads the class into Metaspace. It's used to initialize complex static data that can't be done in a single expression.

```java
class LoggerFactory {
    // This Map is static — ONE map for the entire JVM
    private static final Map<LogLevel, ILogger> CACHE = new EnumMap<>(LogLevel.class);

    // static block: runs once when LoggerFactory class is first referenced
    static {
        CACHE.put(LogLevel.DEBUG, new DebugLogger()); // built once, reused forever
        CACHE.put(LogLevel.INFO,  new InfoLogger());
        CACHE.put(LogLevel.ERROR, new ErrorLogger());
    }

    // static method: no object needed to call this
    public static ILogger createLogger(LogLevel level) {
        return CACHE.get(level);
    }
}
// Usage: LoggerFactory.createLogger(LogLevel.DEBUG)
// No 'new LoggerFactory()' anywhere.
```

The static block is the **Class Constructor** — it runs once for the class, just like an instance constructor runs once per object.

### 2.4 The Utility Class Pattern — `private` Constructor + `public static` Methods
When a class is **purely a collection of static methods** (like `Math`, `Arrays`, `Collections`, `LoggerFactory`), you should prevent instantiation entirely with a `private` constructor.

```java
class LoggerFactory {
    // ✅ Private constructor: 'new LoggerFactory()' is now a compile error
    private LoggerFactory() {
        throw new AssertionError("LoggerFactory is a utility class. Do not instantiate.");
    }

    public static ILogger createLogger(LogLevel level) { ... }
}
```

**Why?** Because `new LoggerFactory()` would create a useless object in memory that has no instance state. The `private` constructor communicates design intent: *this class is a namespace for static utilities, not a template for objects.*

#### 💥 The SDE-3 Blast Radius: What happens if you omit the `private` constructor?

If you omit the `private` constructor on a utility class, Java injects an implicit `public` constructor. In high-scale production systems (e.g. 50k QPS):
1. **Garbage Collection & P99 Spikes:** Developers in loops/request handlers write `new DateUtils()` or `new JsonUtils()`. Millions of 24-byte junk objects flood the Young Generation Heap, triggering **Stop-The-World GC pauses** and degrading API P99 latency.
2. **State Pollution & Race Conditions:** Another developer might mistakenly add mutable fields to the utility class (`private int counter`), creating catastrophic **thread-safety race conditions** across concurrent requests.
3. **Security Vulnerabilities:** External developers can subclass your utility class (`class RogueUtils extends StringUtils`), bypassing encapsulation boundary rules.

---

### 2.5 Access Modifiers — Deep Dive

#### Formal Definition
> **Access Modifiers** are keywords that control the **visibility** of a class, field, method, or constructor — i.e., which other classes in the codebase are legally allowed to reference it.

They answer one question: **"Can this code over HERE touch that member over THERE?"**

#### The 4 Levels — Ordered from Most Restrictive to Most Open

| Modifier | Keyword | Visible to |
|---|---|---|
| **Private** | `private` | Only code inside the **same class file** |
| **Package-Private** | *(no keyword — default)* | Only code inside the **same package folder** |
| **Protected** | `protected` | Same package + any **subclass** (anywhere) |
| **Public** | `public` | **Everywhere** in the entire application |

#### Visualizing the Boundary Rings

```
╔══════════════════════════════════════════════════════╗
║  PUBLIC — visible to the entire application          ║
║  ╔════════════════════════════════════════════╗      ║
║  ║  PROTECTED — visible to package + subclass ║      ║
║  ║  ╔══════════════════════════════════════╗  ║      ║
║  ║  ║  PACKAGE-PRIVATE — same package only ║  ║      ║
║  ║  ║  ╔════════════════════════════════╗  ║  ║      ║
║  ║  ║  ║  PRIVATE — same class only     ║  ║  ║      ║
║  ║  ║  ╚════════════════════════════════╝  ║  ║      ║
║  ║  ╚══════════════════════════════════════╝  ║      ║
║  ╚════════════════════════════════════════════╝      ║
╚══════════════════════════════════════════════════════╝
```

#### Code: All 4 Levels Side by Side

```java
package com.example.bank;

public class BankAccount {
    private   double balance;       // PRIVATE: only BankAccount methods can touch this
    double    interestRate;         // PACKAGE-PRIVATE: only classes in com.example.bank
    protected String accountType;  // PROTECTED: bank package + any subclass (SavingsAccount)
    public    String accountId;     // PUBLIC: anyone anywhere can access this
}
```

```java
// ── Same class (BankAccount.java) ──────────────────────────────────────────
class BankAccount {
    void someMethod() {
        this.balance      = 1000;  // ✅ private    — same class, allowed
        this.interestRate = 0.05;  // ✅ package-private — same class, allowed
        this.accountType  = "CHK"; // ✅ protected  — same class, allowed
        this.accountId    = "A01"; // ✅ public     — same class, allowed
    }
}

// ── Same package (com.example.bank), different class ───────────────────────
class AuditService {  // in com.example.bank
    void audit(BankAccount acc) {
        // acc.balance      = ...  // ❌ private — cannot access from different class
        acc.interestRate = 0.06;   // ✅ package-private — same package, allowed
        acc.accountType  = "SAV";  // ✅ protected — same package, allowed
        acc.accountId    = "A02";  // ✅ public — allowed
    }
}

// ── Different package, but a subclass ──────────────────────────────────────
package com.example.retail;
class SavingsAccount extends BankAccount {
    void calculate() {
        // this.balance      = ... // ❌ private — blocked even in subclass
        // this.interestRate = ... // ❌ package-private — different package, blocked
        this.accountType  = "SAV"; // ✅ protected — subclass, allowed
        this.accountId    = "A03"; // ✅ public — allowed
    }
}

// ── Completely unrelated class in a different package ──────────────────────
package com.example.analytics;
class ReportGenerator {
    void report(BankAccount acc) {
        // acc.balance      = ... // ❌ private
        // acc.interestRate = ... // ❌ package-private
        // acc.accountType  = ... // ❌ protected (not a subclass)
        acc.accountId    = "A04"; // ✅ public — only this is accessible
    }
}
```

#### The Senior Decision Framework — Which Modifier to Use?

> Start at `private`. Widen access **only** when there is a concrete, documented reason.

```
Should this be accessible OUTSIDE this class?
    └── No  → private  ← default choice for all fields, helper methods

Should this be accessible to SUBCLASSES or the same package?
    └── Same package only    → package-private (no keyword)
    └── Subclasses anywhere  → protected

Must this be part of the PUBLIC API?
    └── Yes → public  ← only for intentional contract surface
```

| What you're defining | Recommended default |
|---|---|
| Instance fields (state) | Always `private` — expose only via getter/setter |
| Helper/internal methods | `private` |
| Methods intended for subclasses to override | `protected` |
| Factory methods, service interfaces | `public` |
| Constants | `public static final` |
| Package-internal utilities | Package-private (no modifier) |

#### The `private` Field + `public` Getter Pattern (Encapsulation in Practice)

```java
public class BankAccount {
    private double balance; // ← private: outsiders cannot directly mutate

    // public getter: controlled read access
    public double getBalance() { return balance; }

    // public setter: controlled write access (validation possible)
    public void deposit(double amount) {
        if (amount <= 0) throw new IllegalArgumentException("Amount must be positive");
        this.balance += amount;
    }
    // No setBalance(double) — direct mutation is intentionally prevented
}

// Why this matters:
BankAccount acc = new BankAccount();
// acc.balance = -9999;     // ❌ compile error — encapsulation holds
acc.deposit(-9999);         // ❌ throws IllegalArgumentException — caught by validation
acc.deposit(1000);          // ✅ controlled, validated write
acc.getBalance();           // ✅ read-only access — no mutation possible
```

---

## ❌ 3. Junior Mistakes vs. ✅ Senior Solutions

| ❌ The Junior Approach | ✅ The Senior/LLD Approach | 🧠 Why it matters |
| :--- | :--- | :--- |
| Making fields `public` by default to avoid writing getters. | `private` fields always. Write getters/setters with validation. | Once a field is `public`, any caller can bypass your invariants. You can never take it back without breaking existing callers. |
| Using `protected` for "I might need this in a subclass someday." | `protected` only when there IS a subclass relationship that concretely needs it. | `protected` is `public` to any subclass in any package. It's a larger surface than package-private. Don't open it speculatively. |
| Using `static` variables as "easy global variables" to share data. | Avoiding mutable `static` state completely. Using `static final` for constants only. | Global mutable state destroys concurrent thread-safety. Race conditions are invisible until production. |
| Hardcoding strings like `"SUCCESS"` everywhere. | Using `public static final String STATUS_SUCCESS = "SUCCESS";` | Centralizes configuration, prevents typos, and provides a single source of truth. |

---

## 🏗️ 4. Real-World Application (System Design)
In an enterprise **Database Connection Pool**:
Creating a TCP connection to a database takes massive resources. You do NOT want every object creating its own physical connection.
Instead, you create a ConnectionPool class. The pool itself is heavily locked down using a `private` constructor and exposed via a `public static` method (Singleton). The individual TCP ports and passwords are kept `private` so malicious or careless code outside the package cannot terminate active database connections.



---

## 💥 5. FAANG / MNC Interview Preparation

### Q1: "Are static variables thread-safe?"
**The Senior Answer:**
Absolutely not. Because static variables belong to the Class, all threads in the JVM share the exact same variable. If it is mutable, and multiple threads read/write to it concurrently without synchronization, you will instantly create Race Conditions. This is why Senior Engineers strictly avoid mutable statics. The only safe `static` state is `static final` — effectively a constant, immutable after class load.

### Q2: "Can you override a static method?"
**The Senior Answer:**
No. Method overriding occurs at runtime (dynamic polymorphism) based on the specific Object instance on the Heap. Static methods are bound to the Class at compile time (early binding). If a child class defines a static method with the same signature, it "hides" the parent method — it does not override it. This is called **method hiding**. The distinction matters because polymorphism does NOT apply: calling the method via a parent reference will always dispatch to the parent's static method, not the child's.

### Q3: "What is the difference between `private` and package-private? When do you choose each?"
**The Senior Answer:**
`private` restricts access to the **single class file** — not even classes in the same package can see it. Package-private (no keyword) restricts to the **same package** — all classes in that folder share access.

**When to choose:**
- `private` → for all internal implementation details of a class (fields, helper methods). Default choice.
- Package-private → for **internal collaboration between classes in the same module** that shouldn't be exposed outside. Example: `LoggerFactory` (public) creates `DebugLogger` (package-private constructor) — `DebugLogger`'s constructor is package-private so only `LoggerFactory` in the same package can call `new DebugLogger()`. This makes the factory the enforced entry point structurally, not just by convention.

### Q4: "Is `protected` more or less permissive than package-private?"
**The Senior Answer:**
More permissive — and most developers get this wrong. `protected` = package-private + ALL subclasses anywhere. A subclass in a completely different JAR in a different country can access a `protected` member. Package-private is actually **tighter** than protected for cross-package subclasses. The confusion is that protected *sounds* stricter because it has an explicit keyword, but it isn't. This is why the decision framework says: prefer package-private over `protected` unless you explicitly need subclass access from a different package.

### Q5: "Why should all fields be `private` by default? Doesn't it just add boilerplate?"
**The Senior Answer:**
The boilerplate is the point. `private` fields with `public` getters force every mutation to go through a method — and methods are checkpoints where you can add validation, logging, events, threading logic, or change the internal representation later without breaking callers. A `public` field is a promise to the entire world: *"this field will always exist, always be directly accessible, and have this exact type"*. That promise can never be broken without a breaking change. With a `private` field + getter, you can swap `double balance` to `BigDecimal balance` internally and update only the getter. No callers break. This is the core of Encapsulation — not hiding data for security, but **protecting your freedom to change internals**.

---


## 🛠️ 6. Executable Code Examples
- [StaticModifiersDemo.java](./StaticModifiersDemo.java): Code illustrating the massive thread-safety difference between static state and instance state.

---

## 📚 7. Further Reading / Patterns Linked
- `static` is the core ingredient in the **Singleton Pattern** and **Factory Methods**.
- Proper Access Modifiers directly enable the first pillar of OOP: **Encapsulation**.

---

## 🌉 8. Bridge: How `static` Powers the Simple Factory Pattern

This is where everything in this module comes together in a real design pattern. Open `01-Creational/06-Simple Factory Design Pattern/JAVA/` and look at `logger/LoggerFactory.java`. Every concept from this module is in use:

```java
// ── FROM MODULE 2.3: Static block initializes the cache ONCE at class load ──
private static final Map<LogLevel, ILogger> CACHE = new EnumMap<>(LogLevel.class);
static {
    CACHE.put(LogLevel.DEBUG, new DebugLogger()); // ← runs once. Zero re-creation.
    CACHE.put(LogLevel.WARN,  new WarnLogger());
}

// ── FROM MODULE 2.4: Private constructor = utility class, no instantiation ──
private LoggerFactory() {} // 'new LoggerFactory()' is a compile error

// ── FROM MODULE 2.2: Static method = call without any object ──
public static ILogger createLogger(LogLevel level) {
    return CACHE.get(level); // O(1) lookup. Returns cached instance.
}
```

```java
// ── FROM MODULE 2.5: Package-private logger constructors = enforced factory use ──
// In logger/Loggers.java:
class DebugLogger implements ILogger {  // no 'public' on the class
    DebugLogger() {}  // no 'public' on the constructor ← package-private
    // new DebugLogger() from outside 'logger' package = COMPILE ERROR
}
```

| Concept from this module | Used in Simple Factory as |
|---|---|
| `static` method | `LoggerFactory.createLogger()` — callable without instantiation |
| `static final` field | `CACHE` map — one map for the JVM, immutable reference |
| `static { }` block | Eager initialization of all cached logger instances at class load |
| `private` constructor | `LoggerFactory()` — prevents `new LoggerFactory()`, enforces utility-class intent |
| Package-private (default) | Logger constructors — only `LoggerFactory` (same package) can call `new DebugLogger()` |

> [!IMPORTANT]
> When an interviewer asks *"Why is `createLogger()` static?"*, the senior answer is:
> *"Because LoggerFactory is a utility class with no instance state. Making `createLogger()` static lets callers use it like a function — `LoggerFactory.createLogger(level)` — without the overhead or confusion of instantiating a factory object that serves no purpose beyond holding static methods."*

---

## 🌍 9. Cross-Language: `static` and Access Modifiers in Python, TypeScript, and Go

> The **concept** is universal — "some things belong to the class, not instances; some things should be hidden." What changes between languages is the **syntax** and critically, the **level of enforcement** (compile-time, runtime, or none at all).

---

### 🐍 Python

#### Static-equivalent: No keyword — use decorators and class variables

| Java | Python Equivalent | Notes |
|---|---|---|
| `static int count` | Class variable (outside `__init__`) | Shared across all instances |
| `static void method()` | `@staticmethod` | No `self` or `cls` — pure function namespace |
| `public static T create()` | `@classmethod` | Receives `cls` — the idiomatic factory pattern in Python |
| `static { }` block | Module-level code at import time | Runs when the module is first imported |

```python
class BankAccount:
    total_created = 0          # CLASS variable — shared (Java: static int)

    def __init__(self, balance: float):
        self.balance = balance  # INSTANCE variable — unique per object
        BankAccount.total_created += 1

    def get_balance(self) -> float:       # instance method — has 'self'
        return self.balance

    @staticmethod
    def validate_amount(amount: float) -> bool:  # no self, no cls
        return amount > 0

    @classmethod
    def create_with_bonus(cls, balance: float) -> "BankAccount":  # factory
        return cls(balance * 1.1)  # cls = BankAccount

# Calling:
BankAccount.total_created          # 0  — class-level, no object needed
BankAccount.validate_amount(50)    # True — static, no object needed
a = BankAccount.create_with_bonus(1000)  # classmethod as Simple Factory
```

#### Python Access Modifiers: Convention, NOT Enforcement

> [!WARNING]
> Python has **zero formal access modifiers**. There are no `public`, `private`, or `protected` keywords. Everything is a naming convention. Nothing is truly enforced.

| Java | Python | Enforced? |
|---|---|---|
| `public` | Default (no prefix) | N/A |
| `protected` | `_single_underscore` | ❌ Convention only — nothing stops access |
| `private` | `__double_underscore` | ❌ Name-mangled to `_ClassName__field`, but still accessible |

```python
class Account:
    def __init__(self):
        self.public = 1          # anyone can access
        self._internal = 2       # "please don't" — not enforced
        self.__mangled = 3       # renamed _Account__mangled — still not truly private

a = Account()
print(a._internal)          # ✅ Works. Just bad manners.
print(a.__mangled)          # ❌ AttributeError — but only via this name...
print(a._Account__mangled)  # ✅ Still works! Python has NO true private.
```

> **Interview answer for Python:** *"Python's double underscore is name-mangling, not true privacy. The philosophy is 'we are all consenting adults' — the language trusts developers to respect naming conventions rather than enforcing rules mechanically."*

---

### 🟦 TypeScript

#### `static` keyword exists and works like Java — but runtime is JavaScript

```typescript
class BankAccount {
    private static totalCreated: number = 0;  // class-level
    private balance: number;                  // instance-level

    constructor(balance: number) {
        this.balance = balance;
        BankAccount.totalCreated++;
    }

    static getTotalAccounts(): number { return BankAccount.totalCreated; }
    getBalance(): number { return this.balance; }
}

BankAccount.getTotalAccounts();   // ✅ Class-level call — no 'new' needed
// BankAccount.getBalance();      // ❌ TypeScript compile error
```

#### Static Initialization Block (ES2022 / TypeScript 4.4+)

```typescript
class LoggerFactory {
    static readonly cache = new Map<string, ILogger>();

    static {
        // Runs once when class is first loaded — equivalent to Java 'static { }'
        LoggerFactory.cache.set("debug", new DebugLogger());
        LoggerFactory.cache.set("info",  new InfoLogger());
        LoggerFactory.cache.set("warn",  new WarnLogger());
    }

    static createLogger(level: string): ILogger {
        const logger = LoggerFactory.cache.get(level);
        if (!logger) throw new Error(`Unknown level: ${level}`);
        return logger;
    }
}
```

#### TypeScript Access Modifiers: Two Layers (Compile vs Runtime)

| Modifier | TypeScript (compiler) | JavaScript runtime |
|---|---|---|
| `public` | Accessible everywhere | Accessible everywhere |
| `private` | Blocked at compile time | **Still accessible** via `(obj as any)['field']` |
| `protected` | Blocked at compile time | **Still accessible** at runtime |
| `#privateField` | Blocked (syntax error) | **Truly blocked** by JS engine |

```typescript
class Account {
    private softPrivate: number = 1;  // TypeScript-only enforcement
    #hardPrivate: number = 2;         // True JS runtime enforcement

    getHard() { return this.#hardPrivate; }
}

const a = new Account();
// a.softPrivate              // ❌ TypeScript compile error
(a as any)['softPrivate']    // ✅ Bypasses TypeScript — accessible at runtime!
// a.#hardPrivate             // ❌ Syntax error — TRULY blocked at runtime too
```

> **Interview answer for TypeScript:** *"`private` in TypeScript is a compile-time lie — the JavaScript runtime doesn't know what 'private' means. For true encapsulation that survives transpilation, use ES2022 `#privateField` syntax. That's enforced by the V8 engine, not just the TypeScript compiler."*

---

### 🐹 Go

Go is the most radical departure. It has **no `static` keyword**, **no classes**, and **no access modifier keywords**.

#### No `static` — Package-Level Replaces It Entirely

In Go, anything at the **package level** (outside any struct or function) is shared across all code in the package — this is Go's equivalent of `static`.

| Java | Go | Location |
|---|---|---|
| `static int count` | `var count int` | Package-level variable |
| `static void foo()` | `func Foo()` | Package-level function |
| Instance method | `func (a *Account) method()` | Method with explicit receiver |
| `static { }` block | `func init()` | Auto-runs on package import |
| `new T()` / factory | `func NewT() *T` | Convention for constructors |

```go
package bank

// Package-level var → Java 'static int totalCreated'
var totalCreated int = 0

// Struct → Java class (instance data only, no static here)
type BankAccount struct {
    balance float64  // lowercase = unexported (private to package)
    ID      string   // uppercase = exported (public)
}

// Package-level function → Java 'public static BankAccount create()'
// Go convention: factory functions are named 'NewXxx'
func NewBankAccount(balance float64) *BankAccount {
    totalCreated++
    return &BankAccount{balance: balance}
}

// Method with receiver → Java instance method
func (a *BankAccount) GetBalance() float64 {
    return a.balance
}

// Package-level function → Java 'public static int getTotalCreated()'
func GetTotalCreated() int { return totalCreated }

// init() → Java 'static { }' — JVM calls it once when package is imported
func init() {
    // initialize package-level state here
    totalCreated = 0
}
```

#### Access Control: Capitalization is the One and Only Rule

> [!IMPORTANT]
> Go has **no `public`, `private`, `protected` keywords**. The rule is simple and absolute:
> - **Uppercase first letter** → Exported (public — visible outside the package)
> - **Lowercase first letter** → Unexported (private — invisible outside the package)

```go
package bank

type BankAccount struct {
    Balance float64  // Exported → accessible from any package
    id      string   // Unexported → only usable within 'bank' package
}

func NewBankAccount(b float64) *BankAccount { ... }  // Exported
func validate(amount float64) bool { ... }           // Unexported
```

```go
// In a different package:
import "myapp/bank"

acc := bank.NewBankAccount(1000)  // ✅ Exported function
acc.Balance                        // ✅ Exported field
acc.id                             // ❌ COMPILE ERROR: unexported field
bank.validate(100)                 // ❌ COMPILE ERROR: unexported function
```

> **Interview answer for Go:** *"Go replaces the `static` keyword entirely with package-level declarations. And instead of access modifier keywords, Go uses a single, elegant rule: uppercase = exported, lowercase = unexported. There's no `protected` because Go has no inheritance. If two types need to share 'protected' data, the Go answer is: put them in the same package."*

---

### 📊 Master Comparison Table

| Concept | ☕ Java | 🐍 Python | 🟦 TypeScript | 🐹 Go |
|---|---|---|---|---|
| **Class-level field** | `static int x` | Class variable | `static x: number` | Package-level `var x` |
| **Class-level method** | `static void foo()` | `@staticmethod` | `static foo()` | Package-level `func Foo()` |
| **Factory / constructor** | `static T create()` | `@classmethod def create(cls)` | `static create(): T` | `func NewT() *T` |
| **Init block** | `static { }` | Module-level code | `static { }` (ES2022) | `func init()` |
| **Public** | `public` keyword | Default (any name) | `public` keyword | `UppercaseFirst` |
| **Private** | `private` keyword | `__double` (mangled, not enforced) | `private` (compile) / `#field` (runtime) | `lowercaseFirst` (enforced) |
| **Protected** | `protected` keyword | `_single` (convention only) | `protected` (compile-time only) | ❌ Does not exist |
| **Package-private** | Default (no keyword) | ❌ No package system this fine-grained | ❌ No concept | `lowercaseFirst` |
| **True runtime enforcement** | ✅ Always | ❌ Never | ❌ `private` only / ✅ `#field` | ✅ Always |

> **The one senior insight to remember:**
> Java and Go enforce access at **compile time AND runtime** — trying to access a private field is a hard error. TypeScript enforces at compile-time only (JavaScript doesn't care). Python enforces nothing — it relies entirely on team discipline and naming conventions. When working across languages, always ask: *"At what point does this language actually stop me?"*

---

## 🔗 10. Vault Interlinking Map (Connecting LLD & HLD Modules)

This module (`Static and Access Modifiers`) forms the foundational bedrock for high-level system architecture and low-level design patterns across this vault:

```
                          ┌──────────────────────────────────────────┐
                          │   Static & Access Modifiers (Module 04)  │
                          └────────────────────┬─────────────────────┘
                                               │
           ┌───────────────────────────────────┼───────────────────────────────────┐
           ▼                                   ▼                                   ▼
 🛠️ LLD Creational Patterns            🏛️ LLD Foundation Rules             🌐 HLD System Architecture
 ├─ Singleton Pattern                  ├─ The 'this' Keyword               ├─ In-Memory vs Distributed Caching
 ├─ Simple Factory Pattern             ├─ Constructors & Integrity         ├─ Database Connection Pools
 └─ Builder Pattern                    └─ Interfaces (Java 8+ static)      └─ Distributed Locking
```

### 1️⃣ LLD Creational Design Patterns
* **[Singleton Pattern](../../../01-Creational/01-Singleton%20Design%20Pattern/README.md)**: Uses a `private static` instance variable + `private` constructor + `public static getInstance()` to guarantee exactly one object in Metaspace.
* **[Simple Factory Pattern](../../../01-Creational/06-Simple%20Factory%20Design%20Pattern/README.md)**: Uses a `public static createLogger()` method + `static { }` pre-caching block + package-private constructors on concrete classes to enforce factory creation.
* **[Builder Pattern](../../../01-Creational/04-Builder%20Design%20Pattern/README.md)**: Uses a `public static class Builder` inner class so callers can write `new User.Builder()` without needing an outer `User` object first.

### 2️⃣ LLD Foundations & Core Mechanics
* **[The `this` Keyword](../01.5-The_this_Keyword/README.md)**: Explains why `static` methods cannot use `this` (because `static` runs at the class/Metaspace level without an object instance on the Heap).
* **[Constructors & Object Integrity](../03-Constructors/README.md)**: Explains how `private` constructors block instantiation and how default compiler-injected constructors work.
* **[Interfaces & Abstraction](../../03-OOP_Advanced/01-Interfaces/README.md)**: Shows how Java 8+ added `static` methods to interfaces to provide utility helpers directly on interface contracts (e.g. `Comparator.comparing()`).

### 3️⃣ HLD Architecture & System Scale
* **[HLD Cache Fundamentals](../../../../hld/04-Caching-Deep-Dive/01-Cache-Fundamentals.md)**: Connects single-JVM `static ConcurrentHashMap` caches to distributed multi-node Redis/Memcached caches.
* **[HLD Database Scaling & Indexing](../../../../hld/05-Databases/02-Database-Indexing.md)**: Shows how Database Connection Pools use `private` access control to protect physical TCP sockets from being prematurely closed by application threads.
* **[Distributed Lock Addon](../../../06-Addons/02-Distributed-Lock/README.md)**: Contrasts single-JVM `static synchronized` memory locks with multi-server Redis Redlock / Zookeeper ephemeral locks.
