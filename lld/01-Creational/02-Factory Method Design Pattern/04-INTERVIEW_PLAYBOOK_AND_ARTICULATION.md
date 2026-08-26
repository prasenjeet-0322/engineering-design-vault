# 🎙️ Module 04: L4/Senior Interview Playbook & Articulation Guide

[🏠 Back to Master Guide](./README.md) &nbsp; | &nbsp; [Previous: ⚖️ Factory Family Comparison](./03-FACTORY_METHOD_VS_SIMPLE_FACTORY_VS_ABSTRACT_FACTORY.md) &nbsp; | &nbsp; [Next: 🌍 Cross-Language Patterns](./05-CROSS_LANGUAGE_PATTERNS.md)

---

## 🎯 Executive Overview

In technical hiring loops at FAANG / Tier-1 MNCs (Google, Meta, Amazon, Uber), interviewers test whether you can clearly articulate **creational trade-offs**, **SOLID violations in Simple Factory**, and **modern Supplier registries**.

This playbook provides:
1. **5 Verbatim 30-Second Interview Scripts** for high-frequency questions.
2. **Rapid-Fire 1-Sentence FAANG Q&A**.
3. **Common Interviewer Traps & Counter-Moves**.
4. **Candidate Self-Assessment Rubric**.

---

## ⏱️ Section 1: The 30-Second Verbatim Scripts

### 🎙️ Script 1: "What is Factory Method, and why is it preferred over Simple Factory?"

> *"Simple Factory relies on a centralized switch-case statement, which violates the Open/Closed Principle because adding a new product requires modifying the factory class.  
> 
> Factory Method solves this by defining an abstract creator interface with a virtual `createProduct()` method. Subclasses override this method to instantiate specific products. This decentralizes object creation, allowing us to add new product types by adding new subclasses without modifying any existing production code."*

---

### 🎙️ Script 2: "What is the difference between Simple Factory, Factory Method, and Abstract Factory?"

> *"**Simple Factory** is a centralized coding idiom using conditional switch logic to create a single product.  
> **Factory Method** is a GoF creational pattern that uses **inheritance**, where subclasses override a method to create a **single** product type.  
> **Abstract Factory** is a GoF creational pattern that uses **object composition** to produce an entire **family of related, compatible products** (such as DarkTheme Button, Checkbox, and Scrollbar) without specifying their concrete classes."*

---

### 🎙️ Script 3: "How does Factory Method enforce the Dependency Inversion Principle (DIP)?"

> *"Without Factory Method, high-level business services instantiate concrete low-level classes using the `new` keyword, creating direct coupling.  
> 
> Factory Method inverts this dependency by introducing two parallel abstractions: the abstract Creator and the abstract Product. The high-level workflow in the Creator depends strictly on the Product interface, allowing runtime polymorphism to supply concrete subtypes without coupling high-level logic to low-level implementation details."*

---

### 🎙️ Script 4: "How do you avoid Class Explosion when using Factory Method in modern Java?"

> *"Classic GoF Factory Method requires a new Creator subclass for every new Product, resulting in $2N$ classes. In modern Java, we eliminate this boilerplate by using the **Factory Registry pattern** with `Map<String, Supplier<Product>>`.  
> 
> Products register their constructor references (`Product::new`) into a thread-safe `ConcurrentHashMap`. This preserves 100% Open/Closed compliance, eliminates factory subclasses, and defers instantiation until `supplier.get()` is invoked."*

---

### 🎙️ Script 5: "How does Spring Framework implement the Factory Pattern under the hood?"

> *"Spring is essentially a massive, automated enterprise factory. The core container is built on `BeanFactory` and `ApplicationContext`.  
> 
> For complex object instantiation, Spring provides the `FactoryBean<T>` interface. When Spring encounters a `FactoryBean`, it executes its `getObject()` method to dynamically build and inject complex dependencies, such as `ProxyFactoryBean` for AOP transaction interceptors."*

---

## ⚡ Section 2: Rapid-Fire FAANG Q&A

| Interviewer Question | Senior 1-Sentence Response |
|---|---|
| **"What is the difference between GoF Factory Method and Java Static Factory Methods?"** | "GoF Factory Method relies on polymorphic inheritance across creator subclasses; Static Factory Methods are named static constructor methods (like `List.of()` or `Optional.of()`)." |
| **"When should you still use a Simple Factory?"** | "When creating a small, fixed set of stable products (like LogLevel `DEBUG`, `INFO`, `ERROR`) that will rarely change." |
| **"How does Java JDBC use the Factory pattern?"** | "`DriverManager.getConnection()` acts as a factory discovering registered database drivers via Java's `ServiceLoader` SPI." |
| **"Can a Factory Method be a Singleton?"** | "Yes, factory creator instances are frequently implemented as Singletons to prevent unnecessary object allocation." |
| **"What is a Parameterized Factory Method?"** | "A factory method that accepts an argument (e.g. `createLogger(LogLevel level)`) to determine which product variant to instantiate." |

---

## 🪤 Section 3: Interviewer Traps & Counter-Moves

### Trap 1: The Interviewer asks you to design an object creation utility and you write a giant `switch-case`.
* **Bad Move:** Leaving the switch-case without acknowledging OCP violations.
* **Senior Counter-Move:** *"For a simple fixed set, a Simple Factory switch is acceptable. However, in a scalable enterprise system, this violates OCP. I can refactor this into a GoF Factory Method or a modern `Map<String, Supplier<Product>>` registry to allow plugin extensions without code modification."*

### Trap 2: The Interviewer asks: "Doesn't creating a factory subclass for every product add too much boilerplate?"
* **Senior Answer:** *"Yes, that is the classic 'Class Explosion' trade-off of GoF Factory Method. In modern production code, we use constructor references (`Map<Key, Supplier<T>>`) or Dependency Injection frameworks to get OCP benefits without class proliferation."*

---

## 🎯 Section 4: Self-Assessment Rubric (L4 vs L5)

```
                   【 FACTORY METHOD PATTERN EVALUATION RUBRIC 】
 ┌──────────────────────────────────────────────────────────────┬────────────┐
 │ Topic & Competency                                           │ Verified?  │
 ├──────────────────────────────────────────────────────────────┼────────────┤
 │ 1. Explained OCP violation in Simple Factory                 │   [  ]     │
 │ 2. Articulated the 2 Parallel Hierarchies (Creator + Product)│   [  ]     │
 │ 3. Differentiated Simple Factory vs Factory Method vs Abstract│   [  ]     │
 │ 4. Explained Class Explosion mitigation via Supplier Registry│   [  ]     │
 │ 5. Distinguished GoF Factory Method from Static Factory Method│   [  ]     │
 │ 6. Explained Spring `BeanFactory` & `FactoryBean<T>`         │   [  ]     │
 └──────────────────────────────────────────────────────────────┴────────────┘
```
