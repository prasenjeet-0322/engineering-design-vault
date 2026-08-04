# Google/FAANGM Interview Tips: LLD & HLD

For Senior SDE Roles, knowing the design patterns is only 40% of the battle. The core evaluation is your **Engineering Judgment** and **Communication Strategy**.

---

## 🏛️ FAANGM LLD Evaluation Rubric

Interviewers rate candidates across 5 core dimensions. Strive for "Strong Hire" signals:

| Dimension | Junior / SDE-1 Signal | Senior / SDE-2+ (Strong Hire) Signal |
| :--- | :--- | :--- |
| **1. Requirements** | Accepts prompt blindly; misses edge cases. | Clarifies scale, concurrency, invariants, and scope. |
| **2. Class Design** | Monolithic classes; tight coupling; public fields. | Separation of concerns (SRP), interface-first design (DIP). |
| **3. Concurrency** | Ignored or global `synchronized` blocks. | Lock-free collections (`ConcurrentHashMap`), DCL, fine-grained locks. |
| **4. Patterns** | Hardcoded switch blocks; forced patterns. | Pluggable strategies, clear extension points (OCP). |
| **5. Communication** | Over-explaining; defensive when challenged. | **Decision -> Reason -> Stop**. Clear trade-off analysis. |

---

## 🗣️ The 7 Terms You Must Use

Use these to signal seniority and compress your reasoning:

1.  **Responsibility**: A cohesive set of rules that change together.
2.  **Reason to Change**: A distinct trigger that forces code modification.
3.  **Change Axis**: An independent dimension along which behavior evolves.
4.  **Stakeholder/Owner**: The group/actor that decides how the logic changes.
5.  **Ripple Effect**: Unrelated changes breaking stable logic.
6.  **Shotgun Surgery**: A code smell where one change forces you to touch many classes (OCP violation).
7.  **Combinatorial Explosion**: When inheritance trees grow uncontrollably due to mixing behaviors.

---

## 🏛️ The "Golden Rule" of Communication

### ⚡ **Decision -> Reason -> Stop.**

Avoid long, academic definitions or over-explaining before the interviewer asks. State your architectural choice, justify it with a stakeholder or change axis, and pause.

| Target | ❌ Bad / Academic Response | ✅ Good / Senior Response |
| :--- | :--- | :--- |
| **SRP** | "SRP states that a class should only have one job, so I am going to create separate classes for database writes, audit logging, and calculations." | "I am separating `AuditLogger` from `PaymentProcessor` because they serve different stakeholders—Security Compliance vs. Billing. This isolates their independent change vectors." |
| **OCP** | "I'm using an interface here so that the code is open for extension but closed for modification according to the open-closed principle." | "I'm wrapping the `PaymentChannel` in a Strategy pattern. When we onboard a new gateway next month, we only add a new strategy class—preventing regression bugs in the core engine." |

---

## 🛡️ Handling Interviewer Pushback

Interviewers at Google/Meta will intentionally challenge your design to test your pragmatism.

> [!WARNING]
> **Pushback Scenario:** *"Why not just put audit logging inside the PaymentProcessor to keep it simple?"*
> 
> **Your 2-Step Response:**
> 1.  **Acknowledge:** *"For a small, throwaway system or a prototype, keeping them together is absolutely the right choice to move fast."*
> 2.  **Defend:** *"But for a production system, Audit rules are driven by Security/Compliance standards which change independently of Billing rules. Separating them now prevents future ripple-effect bugs and enables independent testing."*

---

## 🌁 The Transition: LLD → HLD (SDE-2+)

At Google and Meta, HLD is not a separate round; it's a "Thinking Layer" added to LLD. If asked: *"How does this scale when we hit 100k requests/sec?"* follow this protocol:

```
[1. Correct First] ➔ [2. Identify Bottleneck] ➔ [3. Apply HLD-Lite Component]
```

### 🛠️ The HLD-Lite Toolkit:
*   **If the bottleneck is DB Write Latency:** *"We can introduce an in-memory **Write Buffer** or a **Message Queue** (like Kafka) to decouple and throttle writes."*
*   **If the bottleneck is Read Latency:** *"I will wrap the database in a **Read Cache** (Redis) using a Cache-Aside pattern."*
*   **If the bottleneck is Memory Capacity:** *"We can partition our data across multiple nodes using **Consistent Hashing** based on a tenant/user ID key."*

---

## 🏢 Company-Specific Perspectives

### 🔵 Meta (Product & Iteration)
*   **Focus:** How does SRP enable **Rapid Iteration**? 
*   **Interview Lens:** Can I add a new feature (like "Message Reactions") without touching or breaking the core messaging engine?

### 🔴 Uber (Real-Time Concurrency & State)
*   **Focus:** **Real-time state machines**, geospatial indexes (H3/S2), and concurrent matching.
*   **Interview Lens:** Is your driver availability and trip matching logic thread-safe under high concurrency (e.g. two riders requesting the same driver)? How do you decouple the trip-matching engine from trip ledgers and routing services which scale and fail independently?

### 🟡 Amazon (Ownership & Ops)
*   **Focus:** **Two-Pizza Teams** and **Operational Excellence**.
*   **Interview Lens:** Who "owns" this class? If two different engineering teams could potentially request changes to the same file, it's a "two-owner" violation.

### 💳 Stripe (Transactions & Idempotency)
*   **Focus:** **Ledger consistency**, double-charge prevention, and retry resilience.
*   **Interview Lens:** How do you handle API idempotency keys to prevent double-charges on network retries? How does your LLD guarantee audit logging and event persistence (e.g. using the Transactional Outbox pattern) before invoking external bank APIs?

### 💸 Razorpay (Gateway Routing & Failovers)
*   **Focus:** **Pluggable integrations**, dynamic routing, and gateway failovers.
*   **Interview Lens:** How do you design a payment gateway orchestrator using Strategy + Factory pattern to dynamically route requests based on real-time success rates/cost? How does your system handle gateway timeouts? (Applying a Circuit Breaker pattern to failover to backup bank APIs like HDFC or ICICI).

---

## 🌟 The 10/10 Presentation Checklists

### 1. SRP Focus (The Stakeholder Lens)
- [ ] **Acknowledge Trade-offs:** *"I am splitting these classes for SRP, but I'm aware this increases class count and might require a transactional boundary (Unit of Work) to maintain atomicity."*
- [ ] **Use Stakeholder Language:** *"The Finance team owns the pricing logic, while the Ops team owns the notification logic. They operate on different change axes."*
- [ ] **Be Pragmatic:** *"I wouldn't split this if we were building an MVP, but for an enterprise system, this isolation is critical."*

### 2. OCP Focus (The Platform Lens)
- [ ] **Mention Shotgun Surgery:** *"I'm refactoring this to avoid Shotgun Surgery, where adding a single payment method currently forces us to modify the entire orchestrator."*
- [ ] **Defend Extension Points:** *"I've placed the 'Pivot' behind an interface. This allows us to inject new logic at runtime without deployment-time fragility."*
- [ ] **Talk about the Platform:** *"Thinking bigger, this makes the service a 'Platform' for notifications. Other teams can now contribute 'Channels' as plugins without needing deep knowledge of our core engine."*

### 3. LSP Focus (The Behavioral Lens)
- [ ] **Use the "Expectation" Keyword:** *"LSP isn't about code sharing; it's about maintaining the contract of expectations the caller has with the base type."*
- [ ] **Mention Pre/Post Conditions:** *"I'm ensuring that subclasses never strengthen pre-conditions (requiring more) or weaken post-conditions (promising less) than their parents."*
- [ ] **The "Tell, Don't Ask" Fix:** *"If I find myself using `instanceof` to check if a bird can fly, it's an LSP violation. I fix this by using 'Tell, Don't Ask' or separating the `Flyable` capability into its own interface."*

### 4. ISP Focus (The Role-Based Lens)
- [ ] **Use the "Client-Specific" Keyword:** *"ISP is about ensuring that an interface is tailored specifically to the needs of its client, rather than being a 'one-size-fits-all' monolith."*
- [ ] **The "Throwing Exception" Smell:** *"Whenever I see a subclass throwing `UnsupportedOperationException` for an interface method, I immediately identify it as an ISP violation—the interface is too broad for that client."*

### 5. DIP Focus (The Decoupling Lens)
- [ ] **DIP vs. DI Distinction:** *"I treat DIP as the architectural goal—making high-level logic independent of low-level details—and I use Dependency Injection (DI) as the primary pattern to achieve it."*
- [ ] **The "Arrow Inversion" Keyword:** *"Instead of my high-level business rules importing the database driver, I invert the dependency arrow so that both depend on an interface I own at the service level."*
