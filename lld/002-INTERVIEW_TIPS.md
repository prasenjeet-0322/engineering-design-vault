# Google/FAANGM Interview Tips: LLD & HLD

For Senior SDE Roles, knowing the design patterns is only 40% of the battle. The core evaluation is your **Engineering Judgment** and **Communication Strategy**.

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
**Decision -> Reason -> Stop.**

❌ **Avoid**: Long, academic definitions or over-explaining before the interviewer asks.
✅ **Use**: "I separated X and Y because they are owned by different stakeholders—Finance and Product—and thus represent independent change vectors."

---

## 🛡️ Handling Interviewer Pushback
Interviewers at Google/Meta will intentionally challenge your design to test your pragmatism.

**Scenario**: "Why not put audit logging inside the PaymentProcessor to keep it simple?"
**Your Response**:
1.  **Acknowledge**: "For a small, throwaway system, I would keep them together."
2.  **Defend**: "But for a production system, Audit logic is driven by Security/Compliance rules which change independently of Payment logic. Separating them now prevents future ripple-effect bugs."

---

## 🌁 The Transition: LLD → HLD (SDE-2)
At Google SDE-2, HLD is not a separate round; it's a "Thinking Layer" added to LLD.

### Steps to handle HLD questions:
1.  **Correct First**: Ensure your LLD is SRP-clean.
2.  **Scalable Second**: When asked "How does this scale?", identify the bottleneck (e.g., "The DB write is the bottleneck").
3.  **Apply HLD Lite**: Add **ONE** component (e.g., a Cache, a Message Queue, or a Shard) and stop.

### OCP Specifics:
- **Decision Authority**: Explain OCP as "localizing change" so that adding a feature doesn't require regression testing the entire system.
- **Switch Trap**: Mention that large `switch` blocks are a "Fragility" smell.

---

## 🏢 FAANGM Company Perspectives

### 🔵 Meta (Product & Iteration)
- **Focus**: How does SRP enable **Rapid Iteration**? 
- **Interview Lens**: Can I add a new feature (like "Reactions") without touching the core messaging engine?

### 🔴 Uber (Scalability & Precision)
- **Focus**: **Distributed Complexity** and **Concurrency**.
- **Interview Lens**: Is your "Ride Matching" logic truly decoupled from "Pricing"? They scale differently and have different latency SLAs.

### 🟡 Amazon (Ownership & Ops)
- **Focus**: **Two-Pizza Teams** and **Operational Excellence**.
- **Interview Lens**: Who "owns" this class? If two teams could potentially request changes to the same file, it's a "two-owner" violation.

---

## 🌟 The 10/10 Presentation Checklist (SRP Focus)
*If you hit these points, you signal Staff-level maturity.*

1.  [ ] **Acknowledge Trade-offs**: "I am splitting these classes for SRP, but I'm aware this increases the number of files and might require a 'Unit of Work' to maintain transactionality."
2.  [ ] **Use Stakeholder Language**: "The Finance team owns the pricing logic, while the Ops team owns the notification logic."
3.  [ ] **Be Pragmatic**: "I wouldn't split this if we were building a MVP, but for an enterprise system, this isolation is critical."
4.  [ ] **Check Cohesion**: "All methods in this new class are highly cohesive around the responsibility of 'Persistence'."
5.  [ ] **LLD to HLD seamlessness**: "Since these classes are separate, scaling the 'Validation' service independently as a microservice is much easier in the future."

---

## 🌟 10/10 OCP Presentation (The Pro Lens)
*How to sound like a Lead Engineer during the OCP discussion:*

1.  **Mention Shotgun Surgery**: "I'm refactoring this to avoid Shotgun Surgery, where adding a single payment method currently forces us to modify the entire orchestrator."
2.  **Defend Extension Points**: "I've placed the 'Pivot' behind an interface. This allows us to inject new logic at runtime without deployment-time fragility."
3.  **Talk about the Platform**: "Thinking bigger, this makes the service a 'Platform' for notifications. Other teams can now contribute 'Channels' as plugins without needing deep knowledge of our core engine."
4.  **Balance with YAGNI**: "I'm not adding interfaces everywhere—only where we have an actual 'Variation Axis' like Notification Channels."

---

## 🌟 10/10 ISP Presentation (The Role-Based Lens)
*How to handle "Fat Interfaces" and "Polluted Contracts":*

1.  **Use the "Client-Specific" Keyword**: "ISP is about ensuring that an interface is tailored specifically to the needs of its client, rather than being a 'one-size-fits-all' monolith."
2.  **ISP vs. SRP Nuance**: "While SRP focuses on why a **Class** should change, ISP focuses on why an **Interface** might be forcing unnecessary dependencies on its clients."
3.  **The "Throwing Exception" Smell**: "Whenever I see a subclass throwing `UnsupportedOperationException` for an interface method, I immediately identify it as an ISP violation—the interface is too broad for that client."
4.  **Signal Modular Thinking**: "Breaking down fat interfaces into smaller 'Role Interfaces' like `Flyable` or `Printable` makes the system more modular and ensures that adding a new role doesn't force a re-test of unrelated implementations."

---

## 🌟 10/10 DIP Presentation (The Decoupling Lens)
*How to handle "Hard-Coded dependencies" and "Inverting the Arrow":*

1.  **DIP vs. DI Distinction**: "I treat DIP as the architectural **goal**—making high-level logic independent of low-level details—and I use DI as the primary **pattern** to achieve it."
2.  **The "Arrow Inversion" Keyword**: "Instead of my high-level business rules importing the database driver, I **invert the dependency arrow** so that both depend on an interface I own at the service level."
3.  **Testing & Mocking**: "DIP is my foundation for testability. By depending on abstractions, I can inject mock implementations during unit tests, ensuring my business logic is verified in isolation from unstable external systems."
4.  **Framework Independence**: "I avoid letting my core domain model depend on specific framework annotations or persistence libraries. This 'Pure Domain' approach is the purest form of DIP."

---

## 🌟 10/10 LSP Presentation (The Behavioral Lens)
*How to handle the "Square/Rectangle" trap and more:*

1.  **Use the "Expectation" Keyword**: "LSP isn't about code sharing; it's about maintaining the **contract of expectations** the caller has with the base type."
2.  **Mention Pre/Post Conditions**: "I'm ensuring that subclasses never strengthen pre-conditions (requiring more) or weaken post-conditions (promising less) than their parents."
3.  **The "Tell, Don't Ask" Fix**: "If I find myself using `instanceof` to check if a bird can fly, it's an LSP violation. I fix this by using 'Tell, Don't Ask' or separating the `Flyable` capability into its own interface."
4.  **Identify "Leaky Abstractions"**: "Throwing `UnsupportedOperationException` in a subclass is a major red flag—it means the abstraction is 'leaky' and the subclass shouldn't be in that hierarchy."
