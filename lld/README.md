# 🗺️ Low-Level Design (LLD) Master Learning Curriculum

Welcome to the LLD Concept Dictionary. This index structures the core object-oriented programming foundations, design patterns, and machine coding practices into a progressive learning path to ace SDE-2/SDE-3 engineering interviews.

> [!IMPORTANT]
> **Mock Practice Pacing:** Refer to the [LLD Delivery Framework: The 90-Minute Strategy](./000-LLD_DELIVERY_FRAMEWORK.md) first to learn how to pace yourself within the 90-minute mock timeline, then proceed through the curriculum topics in order.

Use this curriculum sequentially to build system design intuition from fundamental object-oriented concepts to advanced, highly-concurrent architectural patterns.

## 🧭 Roadmap of Phases

| Phase | Focus Area |
| :--- | :--- |
| **[Phase 1: Foundations & SOLID Principles](#phase-1-foundations--solid-principles)** | Master OOP basics, pillars, and the SOLID principles that act as the foundation for scalable code. |
| **[Phase 2: Creational Patterns](#phase-2-creational-patterns)** | Learn patterns for object creation mechanisms, increasing flexibility and reuse of existing code. |
| **[Phase 3: Structural Patterns](#phase-3-structural-patterns)** | Understand how to assemble objects and classes into larger structures while keeping them flexible and efficient. |
| **[Phase 4: Behavioral Patterns](#phase-4-behavioral-patterns)** | Deep dive into effective communication and the assignment of responsibilities between objects. |
| **[Phase 5: Advanced Architectural Patterns](#phase-5-advanced-architectural-patterns)** | Explore DAO, Repository, Unit of Work, Dependency Injection, and domain architecture patterns. |
| **[Phase 6: Senior LLD Extensions (Addons)](#phase-6-senior-lld-extensions-addons)** | Production-grade components like Rule Engines, Distributed Locks, and LRU/LFU caches. |
| **[Phase 7: Machine Coding Guide & Case Studies](#phase-7-machine-coding-guide--case-studies)** | Put it all together with structured levels of machine coding problems and 10k-user case studies. |

---

## 🗺️ Phase 1: Foundations & SOLID Principles

> **Overview:** Master OOP basics, pillars, and the SOLID principles that act as the foundation for scalable code.

| ID | Concept Topic | Location | Difficulty | Frequency |
| :--- | :--- | :--- | :--- | :--- |
| `F001` | [OOP Basics](./00-Foundations/01-OOP_Basics/README.md) | `00-Foundations` | 🟢 Easy | 🔥 High |
| `F002` | [OOP Pillars (Encapsulation, Polymorphism, etc.)](./00-Foundations/02-OOP_Pillars/README.md) | `00-Foundations` | 🟢 Easy | 🔥 High |
| `F003` | [OOP Advanced](./00-Foundations/03-OOP_Advanced/README.md) | `00-Foundations` | 🟡 Medium | 🟡 Medium |
| `F004` | [Java 8+ Features](./00-Foundations/04-Java_8_Plus/README.md) | `00-Foundations` | 🟡 Medium | 🔥 High |
| `F005` | [Class Relationships](./00-Foundations/05-Class_Relationships/README.md) | `00-Foundations` | 🟢 Easy | 🔥 High |
| `F006` | [Single Responsibility Principle (SRP)](./00-SOLID_Principles/01-Single_Responsibility/README.md) | `00-SOLID_Principles` | 🟢 Easy | 🔥 High |
| `F007` | [Open/Closed Principle (OCP)](./00-SOLID_Principles/02-Open_Closed/README.md) | `00-SOLID_Principles` | 🟡 Medium | 🔥 High |
| `F008` | [Liskov Substitution Principle (LSP)](./00-SOLID_Principles/03-Liskov_Substitution/README.md) | `00-SOLID_Principles` | 🟡 Medium | 🔥 High |
| `F009` | [Interface Segregation Principle (ISP)](./00-SOLID_Principles/04-Interface_Segregation/README.md) | `00-SOLID_Principles` | 🟢 Easy | 🔥 High |
| `F010` | [Dependency Inversion Principle (DIP)](./00-SOLID_Principles/05-Dependency_Inversion/README.md) | `00-SOLID_Principles` | 🟡 Medium | 🔥 High |

---

## 🗺️ Phase 2: Creational Patterns

> **Overview:** Learn patterns for object creation mechanisms, increasing flexibility and reuse of existing code.

| ID | Concept Topic | Location | Difficulty | Frequency |
| :--- | :--- | :--- | :--- | :--- |
| `C001` | [Singleton Design Pattern](./01-Creational/01-Singleton%20Design%20Pattern/README.md) | `01-Creational` | 🟢 Easy | 🔥 High |
| `C002` | [Factory Method Design Pattern](./01-Creational/02-Factory%20Method%20Design%20Pattern/README.md) | `01-Creational` | 🟢 Easy | 🔥 High |
| `C003` | [Abstract Factory Design Pattern](./01-Creational/03-Abstract%20Factory%20Design%20Pattern/README.md) | `01-Creational` | 🟡 Medium | 🟡 Medium |
| `C004` | [Builder Design Pattern](./01-Creational/04-Builder%20Design%20Pattern/README.md) | `01-Creational` | 🟢 Easy | 🔥 High |
| `C005` | [Prototype Design Pattern](./01-Creational/05-Prototype%20Design%20Pattern/README.md) | `01-Creational` | 🟢 Easy | 🟡 Medium |
| `C006` | [Simple Factory Design Pattern](./01-Creational/06-Simple%20Factory%20Design%20Pattern/README.md) | `01-Creational` | 🟢 Easy | 🔥 High |
| `C007` | [Combined Patterns](./01-Creational/07-Combined-Patterns/README.md) | `01-Creational` | 🟡 Medium | 🔴 Low |

---

## 🗺️ Phase 3: Structural Patterns

> **Overview:** Understand how to assemble objects and classes into larger structures while keeping them flexible and efficient.

| ID | Concept Topic | Location | Difficulty | Frequency |
| :--- | :--- | :--- | :--- | :--- |
| `S001` | [Adapter Design Pattern](./02-Structural/01-Adapter%20Design%20Pattern/README.md) | `02-Structural` | 🟢 Easy | 🔥 High |
| `S002` | [Facade Design Pattern](./02-Structural/02-Facade%20Design%20Pattern/README.md) | `02-Structural` | 🟢 Easy | 🔥 High |
| `S003` | [Decorator Design Pattern](./02-Structural/03-Decorator%20Design%20Pattern/README.md) | `02-Structural` | 🟡 Medium | 🔥 High |
| `S004` | [Proxy Design Pattern](./02-Structural/04-Proxy%20Design%20Pattern/README.md) | `02-Structural` | 🟡 Medium | 🔥 High |
| `S005` | [Composite Design Pattern](./02-Structural/05-Composite%20Design%20Pattern/README.md) | `02-Structural` | 🔴 Hard | 🟡 Medium |
| `S006` | [Bridge Design Pattern](./02-Structural/06-Bridge%20Design%20Pattern/README.md) | `02-Structural` | 🔴 Hard | 🔴 Low |
| `S007` | [Flyweight Design Pattern](./02-Structural/07-Flyweight%20Design%20Pattern/README.md) | `02-Structural` | 🔴 Hard | 🟡 Medium |

---

## 🗺️ Phase 4: Behavioral Patterns

> **Overview:** Deep dive into effective communication and the assignment of responsibilities between objects.

| ID | Concept Topic | Location | Difficulty | Frequency |
| :--- | :--- | :--- | :--- | :--- |
| `B001` | [Strategy Design Pattern](./03-Behavioral/01-Strategy%20Design%20Pattern/README.md) | `03-Behavioral` | 🟢 Easy | 🔥 High |
| `B002` | [Observer Design Pattern](./03-Behavioral/02-Observer%20Design%20Pattern/README.md) | `03-Behavioral` | 🟢 Easy | 🔥 High |
| `B003` | [Command Design Pattern](./03-Behavioral/03-Command%20Design%20Pattern/README.md) | `03-Behavioral` | 🟡 Medium | 🟡 Medium |
| `B004` | [State Design Pattern](./03-Behavioral/04-State%20Design%20Pattern/README.md) | `03-Behavioral` | 🟡 Medium | 🔥 High |
| `B005` | [Chain of Responsibility](./03-Behavioral/05-Chain%20of%20Responsibility%20Design%20Pattern/README.md) | `03-Behavioral` | 🟡 Medium | 🔥 High |
| `B006` | [Template Method](./03-Behavioral/06-Template%20Method%20Design%20Pattern/README.md) | `03-Behavioral` | 🟢 Easy | 🟡 Medium |
| `B007` | [Iterator Design Pattern](./03-Behavioral/07-Iterator%20Design%20Pattern/README.md) | `03-Behavioral` | 🟢 Easy | 🔴 Low |
| `B008` | [Memento Design Pattern](./03-Behavioral/08-Memento%20Design%20Pattern/README.md) | `03-Behavioral` | 🟡 Medium | 🔴 Low |
| `B009` | [Mediator Design Pattern](./03-Behavioral/09-Mediator%20Design%20Pattern/README.md) | `03-Behavioral` | 🟡 Medium | 🟡 Medium |
| `B010` | [Visitor Design Pattern](./03-Behavioral/10-Visitor%20Design%20Pattern/README.md) | `03-Behavioral` | 🔴 Hard | 🔴 Low |

---

## 🗺️ Phase 5: Advanced Architectural Patterns

> **Overview:** Explore advanced design architectures that bridge the gap between low-level objects and high-level system components.

| ID | Concept Topic | Location | Difficulty | Frequency |
| :--- | :--- | :--- | :--- | :--- |
| `A001` | [Concurrency Patterns](./04-Advanced_Architectural/01-Concurrency-Patterns/README.md) | `04-Advanced_Architectural` | 🔴 Hard | 🔥 High |
| `A002` | [DAO and Repository Patterns](./04-Advanced_Architectural/02-DAO%20and%20Repository%20Patterns/README.md) | `04-Advanced_Architectural` | 🟢 Easy | 🔥 High |
| `A003` | [Resiliency Patterns](./04-Advanced_Architectural/03-Resiliency-Patterns/README.md) | `04-Advanced_Architectural` | 🟡 Medium | 🟡 Medium |
| `A004` | [Unit of Work](./04-Advanced_Architectural/04-Unit%20of%20Work/README.md) | `04-Advanced_Architectural` | 🟡 Medium | 🔴 Low |
| `A005` | [Dependency Injection](./04-Advanced_Architectural/05-Dependency%20Injection/README.md) | `04-Advanced_Architectural` | 🟢 Easy | 🔥 High |
| `A006` | [Domain Architecture Patterns](./04-Advanced_Architectural/06-Domain-Architecture-Patterns/README.md) | `04-Advanced_Architectural` | 🔴 Hard | 🟡 Medium |
| `A007` | [Distributed Rate Limiter](./04-Advanced_Architectural/07-DistributedRateLimiter/README.md) | `04-Advanced_Architectural` | 🔴 Hard | 🔥 High |

---

## 🗺️ Phase 6: Senior LLD Extensions (Addons)

> **Overview:** Production-grade components like Rule Engines, Distributed Locks, and LRU/LFU caches, designed to showcase SDE-2/3 proficiency.

| ID | Concept Topic | Location | Difficulty | Frequency |
| :--- | :--- | :--- | :--- | :--- |
| `X001` | [Rule Engine](./06-Addons/01-Rule-Engine/README.md) | `06-Addons` | 🟡 Medium | 🔥 High |
| `X002` | [Distributed Lock](./06-Addons/02-Distributed-Lock/README.md) | `06-Addons` | 🔴 Hard | 🔥 High |
| `X003` | [Plugin System](./06-Addons/03-Plugin-System/README.md) | `06-Addons` | 🔴 Hard | 🟡 Medium |
| `X004` | [Thread-Safe LRU Cache](./06-Addons/04-LRU-Cache/README.md) | `06-Addons` | 🟡 Medium | 🔥 High |
| `X005` | [AI Semantic Cache](./06-Addons/05-AI-Semantic-Cache/README.md) | `06-Addons` | 🔴 Hard | 🟡 Medium |
| `X006` | [AI Token Rate Limiter](./06-Addons/07-AI-Token-Rate-Limiter/README.md) | `06-Addons` | 🟡 Medium | 🔥 High |
| `X007` | [Transactional Outbox](./06-Addons/08-Transactional-Outbox/README.md) | `06-Addons` | 🔴 Hard | 🔥 High |
| `X008` | [Lamport Clocks](./06-Addons/15-Lamport-Clocks/README.md) | `06-Addons` | 🔴 Hard | 🟡 Medium |
| `X009` | [Leader Election](./06-Addons/17-Leader-Election/README.md) | `06-Addons` | 🔴 Hard | 🟡 Medium |
| `X010` | [Uber LLD](./06-Addons/20-Uber-LLD/README.md) | `06-Addons` | 🔴 Hard | 🔥 High |

*(See the `06-Addons` directory for the full list of 20+ advanced extensions.)*

---

## 🗺️ Phase 7: Machine Coding Guide & Case Studies

> **Overview:** Put it all together with structured levels of machine coding problems and 10k-user case studies.

| ID | Concept Topic | Location | Difficulty | Frequency |
| :--- | :--- | :--- | :--- | :--- |
| `M001` | [Level 1: Foundations](./05-Machine-Coding-Guide/LEVEL-1-Foundations/README.md) | `05-Machine-Coding-Guide` | 🟢 Easy | 🔥 High |
| `M002` | [Level 2: Intermediate](./05-Machine-Coding-Guide/LEVEL-2-Intermediate/README.md) | `05-Machine-Coding-Guide` | 🟡 Medium | 🔥 High |
| `M003` | [Level 3: Advanced](./05-Machine-Coding-Guide/LEVEL-3-Advanced/README.md) | `05-Machine-Coding-Guide` | 🔴 Hard | 🔥 High |
| `M004` | [Level 4: Architect](./05-Machine-Coding-Guide/LEVEL-4-Architect/README.md) | `05-Machine-Coding-Guide` | 🔴 Hard | 🟡 Medium |
| `M005` | [10K Concurrent Users Template](./Architectural-Case-Studies/10K-CONCURRENT-USERS-TEMPLATE.md) | `Architectural-Case-Studies` | 🔴 Hard | 🟡 Medium |

## 📚 Reference Handbooks 
1.  [🚀 LLD Delivery Framework: The 90-Minute Strategy](./000-LLD_DELIVERY_FRAMEWORK.md) — *Refer to this framework first to practice pacing yourself within the 90-minute mock timeline.*
2.  [🤖 2025 LLD Interview Master Guide](./2025_LLD_INTERVIEW_MASTER_GUIDE.md) — *Read this to understand modern SDE-2/SDE-3 expectations (concurrency, compilable code, AI pairing).*
3.  [🗣️ Interview Tips & OCP/ISP Defense](./INTERVIEW_TIPS.md) — *Review this to master FAANG-style design communication and OCP/ISP trade-off defense.*
4.  [🎯 LLD Practice Questions](./001-LLD_PRACTICE_QUESTIONS.md) — *The backlog of practice questions categorized by difficulty.*
5.  [✅ LLD Mastery Checklist](./002-LLD_MASTERY_CHECKLIST.md) — *The checklist to track your mastery of design patterns and concepts.*
