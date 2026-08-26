# ⚖️ Module 03: CoR vs. Decorator vs. Strategy vs. Composite

[🏠 Back to Master Guide](./README.md) &nbsp; | &nbsp; [Previous: 🏛️ Spring Security Deep Dive](./02-SPRING_SECURITY_AND_MIDDLEWARE_DEEP_DIVE.md) &nbsp; | &nbsp; [Next: 🌐 Distributed Pipelines](./04-DISTRIBUTED_PIPELINES_AND_API_GATEWAYS.md)

---

## 🎯 Executive Overview

Because several design patterns use **object composition and recursive forwarding**, candidates frequently confuse:
1. **Chain of Responsibility (CoR)** vs. **Decorator**
2. **Chain of Responsibility (CoR)** vs. **Strategy**
3. **Chain of Responsibility (CoR)** vs. **Composite**

This guide provides a definitive architectural comparison matrix and mental hooks to distinguish them in system design interviews.

---

## 🥊 1. Chain of Responsibility vs. Decorator

Both patterns chain objects together via composition, but their **architectural intents** are fundamentally different:

```
  ┌───────────────────────────────────────────────┬───────────────────────────────────────────────┐
  │         Chain of Responsibility (CoR)         │                   Decorator                   │
  ├───────────────────────────────────────────────┼───────────────────────────────────────────────┤
  │ • Intent: Pass a request along independent    │ • Intent: Dynamically add new responsibilities│
  │   handlers until one handles it or halts it.  │   or behaviors to an object without subclass. │
  │ • Halting Power: ANY link has the power to    │ • Halting Power: Almost NEVER halts; ALL      │
  │   completely abort/short-circuit the chain.   │   layers in the onion wrapper are executed.   │
  │ • Coupling: Handlers can be completely        │ • Coupling: Decorators wrap an existing core  │
  │   independent and unaware of each other.      │   component implementing the exact same type. │
  │ • Real Example: Spring Security Filters       │ • Real Example: `BufferedInputStream(new FileInputStream())`│
  └───────────────────────────────────────────────┴───────────────────────────────────────────────┘
```

```mermaid
graph LR
    subgraph Chain of Responsibility (Linear Pipeline)
        A[Request] --> B[AuthFilter]
        B -->|Pass| C[RateLimiter]
        B -.->|Fail: HALT| H[401 Exit]
        C -->|Pass| D[Controller]
        C -.->|Fail: HALT| I[429 Exit]
    end

    subgraph Decorator (Nested Onion Wrapper)
        E[Client] --> F[LoggingDecorator]
        F --> G[EncryptionDecorator]
        G --> J[BaseDataSource]
    end
```

---

## 🥊 2. Chain of Responsibility vs. Strategy

| Dimension | Chain of Responsibility (CoR) | Strategy Pattern |
|---|---|---|
| **Intent** | Passes request through a sequence of candidate handlers | Swaps a specific algorithm out for an alternative algorithm |
| **Execution** | Multi-step sequential traversal ($0 \dots N$ handlers) | Single-step direct execution (Exactly 1 strategy chosen upfront) |
| **Selection Time** | Evaluated dynamically at runtime as the request moves down the chain | Selected upfront by client/factory before execution |
| **Real Example** | Multi-tier Escalation / Middleware | Payment Processing (CreditCard vs. PayPal vs. Crypto) |

---

## 🥊 3. Chain of Responsibility vs. Composite

* **Composite:** A tree-structured hierarchy ($1 \rightarrow N$) representing part-whole hierarchies (e.g. GUI DOM Tree, File System Folders & Files).
* **CoR:** A linear or single-path chain ($1 \rightarrow 1$) representing sequential delegation.
* **Hybrid Combination:** A Composite tree often uses Chain of Responsibility for **Event Bubbling** (e.g., HTML button click bubbles up through parent `div` $\rightarrow$ `body` $\rightarrow$ `window`).

---

## 📊 Comprehensive Pattern Comparison Matrix

| Pattern | Category | Primary Intent | Cardinality | Can Halt Early? |
|---|---|---|:---:|:---:|
| **Chain of Responsibility** | Behavioral | Intercept, process, or filter requests sequentially | $1 \rightarrow 1$ chain | ✅ **YES (Core feature)** |
| **Decorator** | Structural | Augment/enhance object behavior transparently | $1 \rightarrow 1$ nested onion | ❌ No (Executes all layers) |
| **Strategy** | Behavioral | Encapsulate interchangeable algorithms | $1 \rightarrow 1$ direct swap | ❌ N/A (Single execution) |
| **Composite** | Structural | Represent tree hierarchies uniformly | $1 \rightarrow N$ tree branches | ⚠️ Can terminate branch |
| **Mediator** | Behavioral | Coordinate complex many-to-many communication | $N \rightarrow N$ central hub | ✅ Yes |

---

## 🔑 Key Takeaways for Interviews

1. If an interviewer asks: *"How is CoR different from Decorator?"*, your immediate hook is:  
   **"A Decorator enhances behavior and runs every wrapper in the stack; a Chain of Responsibility inspects requests and has the authority to halt execution early."**
2. If asked: *"How is CoR different from Strategy?"*, your hook is:  
   **"Strategy picks one algorithm upfront; CoR traverses a pipeline of potential handlers dynamically at runtime."**
