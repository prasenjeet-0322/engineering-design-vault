# 🔗 07 — Combined Creational Patterns

> Individual patterns are vocabulary. Combined patterns are sentences.
> This folder contains case studies where **two or more creational patterns work together** to solve a real interview-grade problem.

---

## 📚 Case Studies

| # | Case Study | Patterns Combined | Real-World Analogy |
|---|---|---|---|
| [01](./01-notification-system/README.md) | **Notification System** | Singleton + Factory Method + Builder | Twilio / SendGrid / Firebase internals |
| [02](./02-payment-system/README.md) | **Payment System** | Strategy + Simple Factory | Stripe / PayPal checkout integrations |

---

## 🧠 When Are Patterns Combined in Interviews?

Interviewers rarely ask you to implement a single pattern in isolation at the senior level. The real question is always: *"Design X"*, where X naturally requires multiple patterns to solve cleanly.

| Common Trigger | Patterns Forced |
|---|---|
| "The system has global config/connection" | Singleton (for the shared resource) |
| "Different types/variants of objects are created" | Factory Method or Abstract Factory |
| "Objects have many optional parameters" | Builder |
| "Objects need to be pre-configured and cloned cheaply" | Prototype |

---

## 🗺️ Pattern Interaction Map

```
Singleton  ──── "one shared state"  ────► Config, Connection Pools, Registries
    │
    └───── commonly holds ──────────────► Factory instances (the factory is a singleton)

Factory Method ── "what to create" ─────► Products (channels, parsers, handlers)
    │
    └───── products often built by ────► Builder (complex product construction)

Builder ── "how to construct" ──────────► Complex objects with optional fields
    │
    └───── prototypes can feed ─────────► Prototype (clone a pre-built object)
```
