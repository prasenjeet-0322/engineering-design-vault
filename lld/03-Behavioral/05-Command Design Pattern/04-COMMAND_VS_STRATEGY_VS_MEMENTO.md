# ⚖️ Module 04: Command vs. Strategy vs. Memento vs. Observer

[🏠 Back to Master Guide](./README.md) &nbsp; | &nbsp; [Previous: 🏛️ CQRS & Sagas](./03-CQRS_SAGAS_AND_TRANSACTIONAL_ROLLBACKS.md) &nbsp; | &nbsp; [Next: 🎙️ Interview Playbook](./05-INTERVIEW_PLAYBOOK_AND_ARTICULATION.md)

---

## 🎯 Executive Overview

Candidates frequently confuse the **Command Pattern** with **Strategy** (due to similar single-method interfaces) and **Memento** (due to their role in Undo functionality).

This guide provides an architectural comparison matrix and mental hooks to distinguish them in system design interviews.

---

## 🥊 1. Command vs. Strategy

```
  ┌───────────────────────────────────────────────┬───────────────────────────────────────────────┐
  │                    Command                    │                   Strategy                    │
  ├───────────────────────────────────────────────┼───────────────────────────────────────────────┤
  │ • Encapsulates **WHAT** is done (a specific   │ • Encapsulates **HOW** something is done      │
  │   request or action).                         │   (an interchangeable algorithm).             │
  │ • Contains request data/parameters and a      │ • Stateless or algorithmic; does not store    │
  │   reference to the Receiver.                  │   request-specific execution parameters.      │
  │ • Supports Queuing, Undo/Redo, and Logging.   │ • Used for algorithmic variation (e.g. Sort). │
  │ • Parameterizes a method call or UI button.   │ • Configures an entire Context object.        │
  └───────────────────────────────────────────────┴───────────────────────────────────────────────┘
```

---

## 🥊 2. Command vs. Memento (How to Implement Undo)

Both patterns can implement **Undo (Ctrl+Z)**, but their memory and computational mechanisms differ fundamentally:

| Dimension | Command Pattern Undo | Memento Pattern Undo |
|---|---|---|
| **Mechanism** | **Inverse Action:** Executes opposite business logic (e.g., `insert` $\rightarrow$ `delete`, `withdraw` $\rightarrow$ `deposit`). | **State Snapshot:** Restores a complete historical snapshot of the object's internal fields. |
| **Memory Footprint** | 🟢 **Extremely Low** (Stores only operation delta/parameters). | 🔴 **High** (Clones full state snapshot into memory per keystroke). |
| **Complexity** | 🔴 High for non-invertible operations (e.g. lossy data operations or hashing). | 🟢 Trivial (Simple state replacement). |
| **Best Used When** | Mathematical/reversible business transactions (Banking, E-Commerce). | Complex graphic canvases or text editors where state cannot be easily reversed. |

---

## 📊 Comprehensive Pattern Comparison Matrix

| Pattern | Primary Intent | Core Method | Supports Queuing? | Supports Undo? |
|---|---|---|:---:|:---:|
| **Command** | Encapsulate request as object | `execute()`, `undo()` | ✅ **YES** | ✅ **YES** |
| **Strategy** | Encapsulate interchangeable algorithm | `executeAlgorithm()` | ❌ No | ❌ No |
| **Memento** | Capture & restore object snapshot | `getSavedState()` | ❌ No | ✅ **YES** |
| **Observer** | Notify listeners of state change | `update(event)` | ⚠️ Via message bus | ❌ No |

---

## 🔑 Key Takeaways for Interviews

1. If asked: *"How is Command different from Strategy?"*, your hook is:  
   **"Strategy encapsulates HOW to execute an algorithm; Command encapsulates WHAT action to perform, including its parameters and the ability to queue or undo it."**
2. If asked: *"How does Command compare to Memento for Undo?"*, your hook is:  
   **"Command undoes actions by running reverse operations with low memory overhead; Memento undoes by restoring full state snapshots with higher memory overhead."**
