# 🎙️ Module 04: L4/Senior Interview Playbook & Articulation Guide

[🏠 Back to Master Guide](./README.md) &nbsp; | &nbsp; [Previous: ⚖️ When to Use vs. Upgrade](./03-WHEN_TO_USE_VS_WHEN_TO_UPGRADE.md) &nbsp; | &nbsp; [Next: 🌍 Cross-Language Patterns](./05-CROSS_LANGUAGE_PATTERNS.md)

---

## 🎯 Executive Overview

In technical hiring loops at FAANG / Tier-1 MNCs (Google, Meta, Amazon, Uber), interviewers evaluate your ability to justify **simplicity vs. over-engineering**, explain **SOLID trade-offs**, and propose **high-performance Java supplier implementations**.

This playbook provides:
1. **5 Verbatim 30-Second Interview Scripts** for high-frequency questions.
2. **Rapid-Fire 1-Sentence FAANG Q&A**.
3. **Common Interviewer Traps & Counter-Moves**.
4. **Candidate Self-Assessment Rubric**.

---

## ⏱️ Section 1: The 30-Second Verbatim Scripts

### 🎙️ Script 1: "What is a Simple Factory, and is it an official GoF pattern?"

> *"Simple Factory is not an official Gang of Four design pattern; it is a commonly used creational programming idiom.  
> 
> It encapsulates object creation logic inside a single centralized class or static method based on given input parameters (such as an Enum or String). Its primary advantage is satisfying the Single Responsibility Principle by decoupling caller classes from concrete product constructors."*

---

### 🎙️ Script 2: "Does Simple Factory violate the Open/Closed Principle (OCP)?"

> *"Yes, in its naive form. When implemented with a standard switch-case or if-else block, adding a new product type requires opening and modifying the factory class itself.  
> 
> In modern Java, we can eliminate this OCP violation by maintaining a dynamic `Map<Type, Supplier<Product>>` where new product constructor references (`Product::new`) can be registered at runtime without modifying existing lookup code."*

---

### 🎙️ Script 3: "How do you implement a high-performance Simple Factory in Java?"

> *"Rather than using string comparisons or hash lookups, we use an **`EnumMap<ProductType, Supplier<Product>>`**.  
> 
> An `EnumMap` is internally backed by a flat primitive array indexed by the enum's `ordinal()`, delivering direct $O(1)$ array-access speed with zero hash collision overhead. Combining this with Java 8+ `Supplier<Product>` constructor references defers object creation until the product is explicitly requested."*

---

### 🎙️ Script 4: "When is Simple Factory the right choice instead of Factory Method?"

> *"We choose Simple Factory when we have a **small, stable set of products** (such as 2-4 fixed payment or export types) that rarely change and are maintained by a single team.  
> 
> Introducing a full GoF Factory Method with dozens of creator subclasses for a small, static enum would be premature over-engineering that violates YAGNI. We start simple and refactor only when multi-team development requires decentralized creation."*

---

### 🎙️ Script 5: "What is the trigger that forces you to upgrade from Simple Factory to Factory Method?"

> *"The primary trigger is **collaborative friction and frequent merge conflicts**.  
> 
> When multiple independent feature teams must constantly edit the same centralized `LoggerFactory.java` to add their specialized loggers, the centralized switch becomes an operational bottleneck. At that breaking point, we refactor to **Factory Method**, decentralizing creation into independent creator subclasses so each team owns their own factory."*

---

## ⚡ Section 2: Rapid-Fire FAANG Q&A

| Interviewer Question | Senior 1-Sentence Response |
|---|---|
| **"Why make a Simple Factory method static?"** | "Because the factory holds no instance state; making it static simplifies client access without needing to instantiate the factory object." |
| **"What collection is fastest for an Enum-based factory in Java?"** | "`EnumMap`, because it uses direct array indexing via `enum.ordinal()` with zero hashing overhead." |
| **"How is Simple Factory different from Factory Method?"** | "Simple Factory is a single class with centralized conditional logic; Factory Method uses polymorphic subclasses to create objects." |
| **"Can a Simple Factory return an interface?"** | "Yes, the return type must always be an abstract interface or superclass to preserve polymorphism." |
| **"What happens if an unknown type is passed to a Simple Factory?"** | "The factory must throw an explicit `IllegalArgumentException` rather than returning `null` to fail fast and prevent `NullPointerException` downstream." |

---

## 🪤 Section 3: Interviewer Traps & Counter-Moves

### Trap 1: The Interviewer asks: "Why not always use Factory Method instead of Simple Factory just in case?"
* **Bad Move:** Agreeing that Factory Method is always superior.
* **Senior Counter-Move:** *"Always defaulting to Factory Method creates unnecessary class explosion ($2N$ classes) for small, stable domains. Senior engineering is about pragmatic trade-offs: use Simple Factory for simple domains to keep the codebase lean (YAGNI), and graduate to Factory Method when OCP violations become an operational issue."*

### Trap 2: The Interviewer asks you to code a Simple Factory and checks if you return concrete types.
* **Senior Answer:** *"I ensure the factory method returns the common interface (`ILogger` or `IPaymentGateway`), so caller code remains 100% decoupled from concrete implementation classes."*

---

## 🎯 Section 4: Self-Assessment Rubric (L4 vs L5)

```
                    【 SIMPLE FACTORY EVALUATION RUBRIC 】
 ┌──────────────────────────────────────────────────────────────┬────────────┐
 │ Topic & Competency                                           │ Verified?  │
 ├──────────────────────────────────────────────────────────────┼────────────┤
 │ 1. Clarified that Simple Factory is an idiom, not GoF pattern│   [  ]     │
 │ 2. Articulated the SRP Win vs. OCP Violation paradox         │   [  ]     │
 │ 3. Explained `EnumMap<Type, Supplier<T>>` $O(1)$ optimization│   [  ]     │
 │ 4. Articulated the YAGNI principle against premature upgrade │   [  ]     │
 │ 5. Stated the multi-team merge conflict breaking point       │   [  ]     │
 │ 6. Ensured return type is an abstract interface              │   [  ]     │
 └──────────────────────────────────────────────────────────────┴────────────┘
```
