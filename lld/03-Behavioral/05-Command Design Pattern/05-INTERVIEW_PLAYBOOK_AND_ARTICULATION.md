# 🎙️ Module 05: L4/Senior Interview Playbook & Articulation Guide

[🏠 Back to Master Guide](./README.md) &nbsp; | &nbsp; [Previous: ⚖️ Command vs. Strategy vs. Memento](./04-COMMAND_VS_STRATEGY_VS_MEMENTO.md) &nbsp; | &nbsp; [Next: 🌍 Cross-Language Patterns](./06-CROSS_LANGUAGE_PATTERNS.md)

---

## 🎯 Executive Overview

In technical hiring loops at FAANG / Tier-1 MNCs (Google, Meta, Amazon, Uber), interviewers evaluate your ability to clearly articulate **architectural trade-offs**, **undo mechanisms**, and **distributed transactional rollbacks**.

This playbook provides:
1. **5 Verbatim 30-Second Interview Scripts** for high-frequency questions.
2. **Rapid-Fire 1-Sentence FAANG Q&A**.
3. **Common Interviewer Traps & Counter-Moves**.
4. **Candidate Self-Assessment Rubric**.

---

## ⏱️ Section 1: The 30-Second Verbatim Scripts

### 🎙️ Script 1: "What is the Command Pattern, and what architectural problem does it solve?"

> *"The Command Pattern encapsulates a request as a standalone object containing all execution parameters. This completely decouples the object that triggers the request (the Invoker) from the domain object that performs the work (the Receiver).  
> 
> By turning method invocations into first-class objects in memory, it unlocks three critical enterprise capabilities: (1) multi-level Undo/Redo operations, (2) asynchronous request queuing and background scheduling, and (3) distributed transaction rollbacks in microservice Sagas."*

---

### 🎙️ Script 2: "What is the difference between Thin Commands and Thick Commands?"

> *"In software design, a **Thin Command** acts purely as a lightweight delegator that invokes methods on the Receiver. This preserves the Single Responsibility Principle by keeping domain business logic in domain entities where it belongs.  
> 
> A **Thick Command** (often considered an anti-pattern) embeds heavy business and database logic directly inside its own `execute()` method. This leads to code duplication, poor testability, and tightly couples the command to specific data storage implementations."*

---

### 🎙️ Script 3: "How do you implement multi-level Undo and Redo?"

> *"We maintain two LIFO stacks: an `undoStack` and a `redoStack`. When a command is executed, it is pushed onto the `undoStack`, and the `redoStack` is cleared.  
> 
> When the user triggers Undo, we pop the command from the `undoStack`, invoke its `undo()` method (which runs the inverse business operation), and push it onto the `redoStack`. When the user triggers Redo, we pop from the `redoStack`, invoke `execute()`, and push it back onto the `undoStack`."*

---

### 🎙️ Script 4: "What is the core difference between Command and Strategy?"

> *"While both patterns often use single-method interfaces, their architectural intents differ. **Strategy** encapsulates **HOW** an algorithm is performed (e.g., sorting algorithms or payment computation) and configures an entire context object.  
> 
> **Command** encapsulates **WHAT** specific action is to be performed (e.g., a specific fund transfer of \$100 from Account A to B). Command stores execution parameters, parameterizes method calls or UI buttons, and supports queuing, logging, and undo operations."*

---

### 🎙️ Script 5: "How does the Command Pattern enable the Saga Pattern in distributed microservices?"

> *"In distributed systems without 2-Phase Commit, a multi-service business transaction is structured as an Orchestrated Saga. Each microservice step (e.g., Book Flight, Book Hotel, Charge Card) is encapsulated as a Command with both an `execute()` method and an `undo()` compensating transaction.  
> 
> If a step fails halfway through the workflow, the Saga Orchestrator pops previously executed commands and invokes their `undo()` methods in reverse order to issue refunds and restore system consistency."*

---

## ⚡ Section 2: Rapid-Fire FAANG Q&A

| Interviewer Question | Senior 1-Sentence Response |
|---|---|
| **"What built-in Java interfaces implement the Command pattern?"** | "`java.lang.Runnable` and `java.util.concurrent.Callable<V>` are standard implementations of the Command pattern." |
| **"Why must you clear the Redo stack when a new command is executed?"** | "Because executing a new command creates a divergent timeline; keeping old redo commands would result in corrupted state when reapplied over new state." |
| **"What order must a MacroCommand execute its undo operations?"** | "In strict reverse chronological order ($N \rightarrow 1$) to ensure dependencies between sub-operations are unwound properly." |
| **"How does CQRS relate to the Command pattern?"** | "In CQRS, every state-mutating operation is modeled as a Command object that returns void or an ID, completely separating write operations from read queries." |
| **"How does Command compare to Memento for Undo?"** | "Command undoes state by applying reverse operations with low memory overhead; Memento undoes state by restoring full snapshot copies with higher memory overhead." |

---

## 🪤 Section 3: Interviewer Traps & Counter-Moves

### Trap 1: The Interviewer asks you to implement Undo using deep object cloning.
* **Bad Move:** Cloning the entire system state for every user keystroke.
* **Senior Counter-Move:** *"Rather than cloning heavy state snapshots (Memento), I will implement Undo using the Command Pattern's inverse operations (`insert` $\rightarrow$ `delete`, `deposit` $\rightarrow$ `withdraw`), which reduces memory overhead from $O(\text{State Size} \times N)$ to $O(N)$ parameter deltas."*

### Trap 2: The Interviewer asks: "Can a Command execute asynchronously across different servers?"
* **Senior Answer:** *"Yes. Because a Command encapsulates all input parameters, it can be serialized to JSON/Protobuf, pushed to an asynchronous task queue like RabbitMQ or AWS SQS, and executed remotely by worker nodes."*

---

## 🎯 Section 4: Self-Assessment Rubric (L4 vs L5)

```
                       【 COMMAND PATTERN EVALUATION RUBRIC 】
 ┌──────────────────────────────────────────────────────────────┬────────────┐
 │ Topic & Competency                                           │ Verified?  │
 ├──────────────────────────────────────────────────────────────┼────────────┤
 │ 1. Defined all 4 actors (Client, Invoker, Command, Receiver) │   [  ]     │
 │ 2. Articulated Thin Commands vs. Thick Commands anti-pattern │   [  ]     │
 │ 3. Explained Undo/Redo dual-stack algorithm & Redo clearing  │   [  ]     │
 │ 4. Distinguished Command (WHAT) vs. Strategy (HOW)           │   [  ]     │
 │ 5. Connected Command to Distributed Sagas & Compensating TX  │   [  ]     │
 │ 6. Explained Reverse Undo order in Macro / Composite Commands│   [  ]     │
 └──────────────────────────────────────────────────────────────┴────────────┘
```
