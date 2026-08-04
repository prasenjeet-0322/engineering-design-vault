# 🧠 Behavioral Design Patterns: The SDE-2+ Master Guide

> **"Behavioral patterns are about communication and responsibility. A Senior Engineer uses them to decouple workflows, manage state transitions, and build event-driven systems."**

In a senior-level (SDE-2/SDE-3) interview, behavioral patterns are the most common request because they test your ability to handle **Business Logic Evolution.**

---

## 🛠️ The "Strong Hire" Philosophy

When discussing behavioral patterns, you must demonstrate:
1.  **Workflow Decoupling:** How to separate the "What" from the "When" and "How" using patterns like Command, State, and Strategy.
2.  **Scalable Communication:** Using Observer and Mediator to move from N-to-N spaghetti to clean, event-driven architectures.
3.  **Maintenance over Code:** Every choice must prioritize the **Open/Closed Principle.** If adding a new business rule requires changing a switch statement, you have failed the senior bar.

---

## 📈 Behavioral Patterns: Pedagogical Learning Order

| # | Pattern | Pragmatic Use-Case | 🏗️ Senior "Strong Hire" Insight |
| :--- | :--- | :--- | :--- |
| **01** | **Strategy** | **Dynamic Algorithms.** Swap pricing or tax rules at runtime. | *"I use Strategy to eliminate `if-else` blocks for business logic. It's the cleanest implementation of OCP."* |
| **02** | **Observer** | **Event-Driven Systems.** Notify 10 services of a state change. | *"The foundation of EDA. Use `CopyOnWriteArrayList` for thread-safety and be wary of memory leaks from 'Lapsed Listeners'."* |
| **03** | **State** | **Workflow Engines.** Finite State Machines (FSM). | *"Mathematically guarantees valid transitions. I let the State classes manage the 'Next Step' to keep the Context clean."* |
| **04** | **CoR** | **Middleware Pipelines.** Auth -> Rate Limit -> Validation. | *"I use CoR for Fail-Fast processing. It allows me to build dynamic pipelines from config without changing core logic."* |
| **05** | **Command** | **Undo/Redo & Queuing.** Encapsulate actions as objects. | *"Essential for CQRS and Saga patterns. It turns method calls into serializable data that can be queued in Kafka."* |
| **06** | **Template** | **Framework Skeleton.** Standardize 'Validate -> Pay -> Notify'. | *"The 'Hollywood Principle' in action. I make the template `final` to ensure the business sequence is never altered."* |
| **07** | **Iterator** | **Traversal Abstraction.** Lazy pagination for 1B rows. | *"Decouples looping from data storage. Enables cursor-based pagination and infinite streams for high-load APIs."* |
| **08** | **Mediator** | **Air Traffic Control.** Decouple N-to-N peer chatter. | *"Turns spaghetti into a Hub-and-Spoke model. Essential for complex UI state (Redux) and microservice event buses."* |
| **09** | **Memento** | **State Snapshots.** Save/Restore state before a boss fight. | *"Provides snapshots without breaking encapsulation. Pair with Command for robust undo/redo systems."* |
| **10** | **Visitor** | **Algorithm Extraction.** Export AST to XML/JSON. | *"The only way to achieve Double Dispatch in Java. Separates algorithms from stable object hierarchies."* |


---

## 🎓 Behavioral Pattern vs. Intent (The Interview "Trap")

Structure can look identical, but **Intent** is different. Know these 3:
1.  **State vs. Strategy:** Strategy is about 'How' (client chooses). State is about 'What' (object manages itself).
2.  **Observer vs. Mediator:** Observer is dynamic and decentralized. Mediator is centralized and coordinates complex peer interactions.
3.  **Template vs. Strategy:** Template uses Inheritance (Compile-time). Strategy uses Composition (Runtime).

---

## ✅ Final SDE-2+ Behavioral Readiness Checklist

1.  **"How do you handle a 'Lapsed Listener' in Observer?"**
    *   **Senior Answer:** *"I use **WeakReferences** for the observer list or implement a strict `unsubscribe` lifecycle hook to prevent the Publisher from holding onto destroyed objects."*
2.  **"Why use Command for a Saga pattern in Microservices?"**
    *   **Senior Answer:** *"Because Commands are **Serializable**. I can store them in a DB or Queue and, if a step fails, I can iterate backwards to execute 'Compensating Commands' (Undo) across different services."*
3.  **"What is 'Double Dispatch' in Visitor?"**
    *   **Senior Answer:** *"Java resolves overloading at compile-time. Visitor uses two calls: `element.accept(v)` (Polymorphic dispatch) and then `v.visit(this)` (Type-safe dispatch) to resolve the correct logic at runtime."*
4.  **"When does Template Method violate the 'Composition over Inheritance' rule?"**
    *   **Senior Answer:** *"Always. It relies on a rigid inheritance tree. I only use it when the algorithm structure is 99% identical. If the steps vary wildly, I refactor to **Strategy**."*
5.  **"How does Mediator prevent 'Spaghetti Code'?"**
    *   **Senior Answer:** *"It removes direct references between peer objects. Instead of Object A needing a reference to B, C, and D, it only needs a reference to the Mediator. This simplifies the dependency graph to a **1-to-N** hub."*

---

> **Congratulations! You have completed the SDE-2+ Design Pattern Mastery Course.**
