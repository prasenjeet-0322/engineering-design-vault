# 📎 Simple Factory — In the Wild (Case Studies)

This file shows how the Simple Factory pattern appears **inside larger system designs** — and most importantly, when it should be **upgraded to Factory Method**.

---

## Case Study 1: When Simple Factory Is Enough
*(Already implemented — see existing Logger Simple Factory demo)*

If you have:
- A small, stable set of products (3-5, unlikely to grow)
- All products initialized the same way
- One team/one file owns the creation logic

→ **Simple Factory is the right tool.** Don't over-engineer.

---

## Case Study 2: The Breaking Point — When to Upgrade
**Trigger:** Team A needs `FileLogger`, Team B needs `CloudLogger`, Team C needs `DatabaseLogger` — all at the same time. All must modify `LoggerFactory.java`. Merge conflicts every sprint.

**The upgrade path:**
```
Simple Factory (one class, switch/if-else)
        ↓ OCP starts hurting
Factory Method (interface + concrete creators per product)
        ↓ product families needed
Abstract Factory (suite of related factories)
```

**The senior rule:**
> Start Simple. Stay Simple as long as the switch statement doesn't grow. The moment adding a new `case` requires modifying a shared class that multiple teams own — refactor to Factory Method.

---

## Case Study 3: EnumMap Factory (Production-Grade Simple Factory)
*(Already implemented in this module)*

Using `EnumMap<LoggerType, Supplier<ILogger>>` instead of `if/else`:
- O(1) lookup
- Extensible without touching the lookup logic
- Still a Simple Factory — just a faster one

---

### 🌱 Beginner's 5-Second Mental Models

> **1. The Vending Machine Analogy:**
> You press Button A1 ➡️ Vending machine dispenses Chips. You press Button B2 ➡️ Vending machine dispenses Soda.
> You don't care how the internal spiral motors work; the single Vending Machine (Simple Factory) takes your selection string/enum and hands you the right product.

> **2. The Pizza Box Order Counter:**
> A single cashier standing behind a counter with a menu (`OrderPizza("Cheese")`, `OrderPizza("Pepperoni")`). It's not a full factory method hierarchy—just one central class encapsulating the `new` logic.

---

### 🌳 Decision Tree: "Simple Factory vs. Upgrading to Factory Method"

```
                  Do you have a small, fixed set of products (2-4 types) 
                  where creation logic is straightforward?
                                             │
                   ┌─────────────────────────┴─────────────────────────┐
                   ▼                                                   ▼
                【 YES 】                                            【 NO 】
                   │                                                   │
     Use SIMPLE FACTORY                              Will adding a new product cause merge 
  (Single class + switch or EnumMap)                 conflicts across multiple feature teams?
                                                                       │
                                                   ┌───────────────────┴───────────────────┐
                                                   ▼                                       ▼
                                           【 YES 】                               【 NO 】
                                                   │                                       │
                                       Upgrade to FACTORY METHOD              Keep Simple Factory
                                       (ILoggerFactory + Creator               with EnumMap<Type, Supplier>
                                        subclasses per product)                dynamic registration
```

---

## 🔗 Vault Interlinking Map & Cross-References

```
                          ┌──────────────────────────────────────────┐
                          │     Simple Factory Pattern (Idiom)       │
                          └────────────────────┬─────────────────────┘
                                               │
           ┌───────────────────────────────────┼───────────────────────────────────┐
           ▼                                   ▼                                   ▼
 🏛️ SOLID Foundations                  🛠️ Related Creational Patterns       🌐 HLD Architecture
 ├─ Open/Closed Violation (if/else)    ├─ Factory Method (Decentralized)    ├─ Dynamic Plugin Handlers
 ├─ Single Responsibility (SRP)        ├─ Abstract Factory (Suite variant)  ├─ Payment Gateway Switcher
 └─ Dependency Inversion (DIP)         └─ Prototype Registry               └─ Notification Router
```

### 1️⃣ Foundational Rules & SOLID Principles
* **[Open/Closed Principle (OCP)](../../00-SOLID_Principles/02-Open_Closed/README.md)**: Explains why naive `if/else` Simple Factories violate OCP and how `Map<Type, Supplier<Product>>` mitigates it.
* **[Single Responsibility Principle (SRP)](../../00-SOLID_Principles/01-Single_Responsibility/README.md)**: Simple Factory extracts object creation away from business logic into a single dedicated factory class.

### 2️⃣ Creational & Structural Pattern Connections
* **[Factory Method Pattern](../02-Factory%20Method%20Design%20Pattern/README.md)**: The official GoF pattern upgrade path when Simple Factory `switch` statements become too rigid.
* **[Abstract Factory Pattern](../03-Abstract%20Factory%20Design%20Pattern/README.md)**: When Simple Factory needs to return suites of related products.

---

## 📚 See Also
- [Individual Pattern README (JAVA)](./JAVA/README.md)
- [Full Combined Patterns Index](../07-Combined-Patterns/README.md)

