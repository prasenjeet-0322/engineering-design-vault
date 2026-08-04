m# LLD Mastery OS: Markdown Templates for Content Modification

Use these templates to update existing LLD patterns and problems to ensure they integrate seamlessly with your Google Sheet tracker.

---

## 1. Pattern README Template
Add this section to the bottom of every file in `lld/01-Creational/`, `lld/02-Structural/`, and `lld/03-Behavioral/` to track design boundaries.

```markdown
---

## 🧠 Tracker Integration

*   **Trigger Phrases:** [List 3-4 phrases that indicate this pattern is needed]
*   **SOLID Connection:** [Explain which SOLID principle it primarily satisfies and how]
*   **Confuses With:** 
    *   **[Pattern Name]:** [Distinction hook]
    *   **[Pattern Name]:** [Distinction hook]
*   **Anti-Freeze Starter Code:** 
    ```java
    // 3-5 lines of the core interface or base class
    ```
*   **Self-Assessment Prompts:** 
    1. [Technical check question]
    2. [Design judgment question]
    3. [Comparison question]
```

### 💡 Example: Strategy Pattern Integration
```markdown
---

## 🧠 Tracker Integration

*   **Trigger Phrases:** 
    *   "Varying tax/fee calculations based on user location."
    *   "Dynamic discount/pricing policies at checkout."
    *   "Swappable notification channels (Email, SMS, Push)."
*   **SOLID Connection:** Satisfies **OCP (Open-Closed Principle)**: adding a new calculation strategy only requires creating a new subclass without altering the core checkout class.
*   **Confuses With:** 
    *   **State Pattern:** State alters object behavior based on *internal lifecycle state* (self-mutating); Strategy alters behavior based on *external injection* (caller controlled).
    *   **Factory Pattern:** Factory is a *Creational* pattern (how objects are built); Strategy is a *Behavioral* pattern (how objects behave).
*   **Anti-Freeze Starter Code:** 
    ```java
    public interface PaymentStrategy {
        void executePayment(double amount);
    }
    ```
*   **Self-Assessment Prompts:** 
    1. Did you avoid hardcoding the strategies inside a switch-statement inside the Context?
    2. Is the Context class receiving the Strategy via Constructor or Setter Dependency Injection?
```

---

## 2. Problem README Template
Add this section to the bottom of every problem description (e.g., in `lld/01-Creational/08-LLD-Problems/`) to audit machine coding practice runs.

```markdown
---

## 🔬 Tracker Diagnostics

*   **Primary Patterns:** [List patterns]
*   **The "Freeze Trap":** [Identify where candidates usually get stuck or over-engineer]
*   **Class Design Checklist:**
    *   [ ] [Core Entity 1]
    *   [ ] [Core Interface 1]
    *   [ ] [Orchestrator Class]
*   **Concurrency & Thread-Safety Checklist:**
    *   [ ] Shared mutable state identified (e.g., map, lists)
    *   [ ] Lock boundaries defined (synchronized, ReadWriteLock, Segment locks)
    *   [ ] Race condition test harness implemented
*   **SOLID Violations to Watch For:**
    *   **[Principle]:** [Common mistake in this problem]
```

### 💡 Example: BookMyShow Diagnostics Integration
```markdown
---

## 🔬 Tracker Diagnostics

*   **Primary Patterns:** Strategy (Dynamic Pricing), State (Seat Status).
*   **The "Freeze Trap:** Getting stuck writing complex database tables, UI layouts, or payment processing gateways instead of focusing on seat assignment concurrency.
*   **Class Design Checklist:**
    *   [ ] `Show` (Representing movie, hall, and timing)
    *   [ ] `Seat` (Enclosing row, column, status, and price)
    *   [ ] `Booking` (Linking user, show, selected seats, and transaction)
    *   [ ] `BookingOrchestrator` (Entry point for reserving seats)
*   **Concurrency & Thread-Safety Checklist:**
    *   [ ] `ConcurrentHashMap<String, Seat>` used to store show seat states.
    *   [ ] `ReentrantLock` per `Show` to prevent thundering herd bookings.
    *   [ ] Concurrency test harness written simulating 10 parallel booking requests for the same seat.
*   **SOLID Violations to Watch For:**
    *   **SRP:** Putting booking logic, seat layout logic, and payment routing all inside the `Show` class.
    *   **OCP:** Hardcoding discount formulas directly in `Booking` instead of injecting a `DiscountStrategy`.
```

---

## 3. Google Sheets Tracker Schema
Use this schema to construct your Google Sheets tracking log to match the metrics compiled by the Markdown diagnostics:

| Column | Description | Acceptable Values / Formats |
| :--- | :--- | :--- |
| **Problem Name** | Name of LLD/Machine Coding problem | e.g., *BookMyShow*, *Splitwise* |
| **Primary Pattern** | Pattern used to solve the main variation axis | e.g., *Strategy*, *State*, *Chain of Resp* |
| **Time Spent** | Total time taken to get compilable code | e.g., *75 mins*, *90 mins* |
| **Mastery Rating** | Current skill rating | `🔴 Weak` / `🟡 Medium` / `🟢 Strong` |
| **Concurrency Score** | Thread-safety validation status | `Pass` / `Fail` / `Not Tested` |
| **SOLID Score** | Adherence to SOLID | `No Violations` / `OCP Violation` / `SRP Violation` |
| **Refactoring Date** | Date last practiced | `YYYY-MM-DD` |
