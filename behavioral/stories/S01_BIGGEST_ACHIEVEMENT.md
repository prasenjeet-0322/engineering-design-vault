# S01 — Biggest Achievement

* **Primary Question**: *"Tell me about your greatest professional accomplishment."*
* **Core Signal**: High ownership, major business impact, technical depth.

---

## 📝 Story Builder (STAR+)

### [S] Situation (Context)
*   **Prompt**: Define the company, project, size of codebase/team, and target scale (e.g., QPS, database size).
*   **Draft**: 
    *   
*   **Srikar's Draft**:
    *   At Saavik Solutions, our sports venue booking platform Kridaz was scaling to 7k+ Daily Active Users. Under concurrent load during peak slot releases (e.g., weekend evenings), we suffered from race conditions that allowed double-booking of slots, and transient network dropouts that left payment authorization out of sync with internal booking states.

### [T] Task (Your Responsibility)
*   **Prompt**: What was *your* exact role and assignment? (e.g., Lead developer tasked with reducing transaction failures).
*   **Draft**: 
    *   
*   **Srikar's Draft**:
    *   I was the lead backend engineer responsible for redesigning the transaction checkout system to ensure absolute transactional correctness, eliminating double-bookings, and maintaining 100% financial matching between our database and the third-party payment gateways.

### [A] Action (Your Steps)
*   **Prompt**: Detail 3-4 specific technical steps YOU took. Explain the *Why* behind your choices.
*   **Draft**:
    1.  
    2.  
    3.  
*   **Srikar's Draft**:
    1.  **Designed Saga Orchestration:** I mapped the checkout lifecycle into distinct phases (hold slot -> authorize payment -> commit booking) and implemented Saga orchestration with explicit compensating actions to release slot holds if payments failed or timed out.
    2.  **PostgreSQL Row-Level Locking:** I utilized PostgreSQL row-level locking (`SELECT FOR UPDATE`) on the slot hold table to serialize checkouts targeting the exact same venue slot, avoiding concurrency double-allocations at the database tier.
    3.  **Engineered Reconciliation Workers:** I built background cron workers that polled transaction logs and cross-referenced payment gateway settlement logs against internal DB ledgers, generating compensating ledger records for discrepancies.

### [R] Result (The Metrics)
*   **Prompt**: Quantifiable outcomes. Include at least two metrics (e.g., Latency: 500ms -> 80ms, transaction success rate: 97% -> 99.98%).
*   **Draft**: 
    *   
*   **Srikar's Draft**:
    *   **Inconsistent booking states dropped to 0** (no double-bookings reported post-release).
    *   **Manual accounting investigation effort was reduced by 95%** due to automated ledger reconciliation.

### [+] Reflection (Lessons Learned)
*   **Prompt**: What did this win prove to you about system architecture or operational safety? What would you do differently today?
*   **Draft**: 
    *   
*   **Srikar's Draft**:
    *   It proved that local database ACID transactions are insufficient when your system integrates with external APIs across the network. Designing with compensation states (Sagas) and self-healing reconciliation cron loops is critical for distributed transactional reliability.

---

## 🗣️ Spoken Draft Script (Max 2 Minutes)
*(Write out the complete narrative exactly as you would speak it aloud).*

> *"[Placeholder Baseline Script]*
> *At [Company], our payment service was silently dropping 3% of incoming webhook transactions, costing the business roughly ₹40L/month in manual reconciliations. As the lead engineer on the gateway team, I was tasked with redesigning the ingestion pipeline to ensure exactly-once processing.*
> 
> *First, I analyzed the ingestion logs and identified a race condition in our DB write lock. I proposed replacing the pessimistic locking mechanism with an idempotency layer using Redis for distributed locking with token hashing.*
> *Second, I led the implementation of a DLQ (Dead Letter Queue) strategy with exponential backoff on our event consumers.*
> *Finally, I introduced open telemetry tracing across the boundary services to trace failed requests in real-time.*
> 
> *As a result of this architecture shift, silent failures dropped to 0.02% in 6 weeks, and manual engineering triage hours were reduced from 15 hours/week to zero. This taught me that observability is not a nice-to-have; it's a core operational requirement."*

---

> **Srikar's Spoken Draft Script:**
> *"At Saavik Solutions, on our sports booking platform Kridaz which serves 7k daily active users, we ran into a critical transactional issue. Under peak weekend booking hours, concurrent requests and webhook timeouts resulted in slot double-bookings and out-of-sync payment states, leading to frustrated users and manual customer support audits.*
> 
> *As the founding backend engineer, I took charge of redesigning the checkout architecture. First, I implemented a Saga orchestrator that decoupled checkout into atomic steps. If slot booking failed or timed out after the payment hold was initiated, the system automatically rolled back the transaction via compensating flows. Second, to serialize concurrent bookings on hot slots, I implemented PostgreSQL row-level locking during the initial hold phase to prevent race conditions. Finally, I built background reconciliation workers to systematically cross-reference third-party payment settlements with our database ledgers.*
> 
> *As a result, we brought slot double-bookings down to zero, and reduced the manual hours spent by engineers on financial reconciliation by 95%. This experience taught me that in distributed architectures, you cannot rely on a single database transaction boundary; you must design for network partition and compensating states."*

---

## 🕵️ Rehearsal Log

| Date | Duration (sec) | Confidence (1-5) | Filler Count | Peer/Self Feedback |
| :--- | :--- | :--- | :--- | :--- |
| | | | | |
