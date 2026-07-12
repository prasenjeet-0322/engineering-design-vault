# ⚡ 03 - Two-Phase Commit (2PC)

## 📋 Tracker Metadata
| Column | Value / Status |
| :--- | :--- |
| **Concept ID** | C090 |
| **Category** | Distributed Transactions |
| **Difficulty** | 🟡 Medium |
| **Interview Frequency** | 🔥 High |
| **Understanding** | [🔴 None / 🟡 Conceptual / 🟢 Applied] |
| **Can Explain** | [ ] Yes / [ ] No |
| **Whiteboard Drawn** | [ ] Yes / [ ] No |
| **Taught Someone** | [ ] Yes / [ ] No |
| **Next Review** | YYYY-MM-DD |
| **Mastery** | [🔴 Familiar / 🟡 Competent / 🟢 Expert] |

---

## ⚡ 1. The Core Definition & Trigger
*   **Two-Sentence Trigger:** Two-Phase Commit (2PC) is a synchronous consensus protocol that ensures atomic transaction execution across multiple database nodes. A central Coordinator asks all nodes to prepare writes (locking resources) in Phase 1, and only issues the commit command in Phase 2 if all nodes vote "Yes", rolling back if any node votes "No" or times out.
*   **Scalability Dimension:** Primary: **Strong Consistency (Distributed ACID)**. Secondary: Negative impact on **System Latency** & **Throughput (anti-scalable due to resource locking)**.

---

## ⚖️ 2. Trade-offs & Deep Dive

### The 2PC Protocol Execution Path
1.  **Phase 1 (Prepare):**
    *   Coordinator sends a `PREPARE` message to all database nodes (participants).
    *   Participants execute transaction locally up to the commit point, write to their WAL logs, acquire database locks, and vote `YES` (ready) or `NO` (abort).
2.  **Phase 2 (Commit):**
    *   If all vote `YES`, Coordinator writes a commit record to its log and sends `COMMIT` to all nodes.
    *   Nodes commit the changes, release locks, and acknowledge.
    *   If any vote is `NO` or times out, Coordinator sends `ABORT`, and all participants roll back local changes.

### The Blocking Coordinator Problem
The fatal flaw of 2PC is that it is a **blocking protocol**:
*   If a participant database node votes `YES` in Phase 1, it must lock those database rows.
*   If the Coordinator crashes *after* the participant votes but *before* sending the `COMMIT`/`ABORT` command, the participant **must keep the locks active** indefinitely. It cannot unilaterally decide to abort or commit, blocking all other transactions from accessing those rows.

---

## 💥 3. Resiliency & Operations
*   **Observability (The "Signal"):**
    *   `Database lock hold duration`: Spikes indicate coordinator coordination latency or network partitions.
    *   `Coordinator transaction timeouts`.
*   **Blast Radius (The "Impact"):**
    *   High. If the coordinator or network links fail during commit phase, row-level locks lock up database engines, freezing API throughput globally.

---

## 🚫 4. Interview Playbook

### Common Mistakes (The "Junior" Signals)
*   Recommending 2PC as a standard solution for scaling transactional microservices (2PC is rarely used in high-scale microservices due to the latency penalty of network locking).
*   Not knowing what happens when the coordinator node crashes mid-transaction.

### Interview Tip (The "Strong Hire" Signal)
> *"While 2PC provides strong distributed consistency, it is a blocking protocol. If the coordinator crashes, database row locks remain active, degrading scale. For high-scale services, I will trade strong consistency for eventual consistency using the [Saga Pattern](02-Saga-Pattern.md) or the **TCC (Try-Confirm-Cancel)** pattern."*

---

## 💡 5. My Custom Study Notes & Whiteboard
*Use this section to document your sketches, code blocks, or personal notes.*
