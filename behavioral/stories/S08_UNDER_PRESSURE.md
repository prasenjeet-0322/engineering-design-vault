# S08 — Under Pressure

* **Primary Question**: *"Tell me about a high-stress situation you navigated at work."*
* **Core Signal**: Resilience, cool-headed prioritization, incident command, post-incident analysis.

---

## 📝 Story Builder (STAR+)

### [S] Situation (Context)
*   **Prompt**: Describe a high-stress production emergency (e.g., site outage during holiday traffic, data loss threat) or a tight deadline threat.
*   **Draft**: 
    *   

### [T] Task (Your Responsibility)
*   **Prompt**: What was your role in managing the incident or meeting the deadline?
*   **Draft**: 
    *   

### [A] Action (Your Steps)
*   **Prompt**: What did you do to triage the problem? How did you isolate variables? How did you organize the team during the incident?
*   **Draft**:
    1.  
    2.  
    3.  
*   **Srikar's Draft**:
    1.  **Immediate Load Shedding:** I isolated the incoming payment webhooks by enqueueing them rather than processing them synchronously, reducing database transaction load immediately.
    2.  **Configured Transaction Timeouts:** I replaced standard queries with PostgreSQL `SELECT FOR UPDATE NOWAIT` row-level locks on the slots table. This prevented database transactions from stalling and blocking the pool.
    3.  **Deployed Saga Orchestration:** I re-engineered the checkout logic to process booking confirmations asynchronously. If slot validation failed after a payment hold, a background Saga worker initiated an automated refund compensation.

### [R] Result (The Metrics)
*   **Prompt**: What was the recovery time? What did you build post-incident to prevent it from happening again?
*   **Draft**: 
    *   

### [+] Reflection (Lessons Learned)
*   **Prompt**: What did you learn about operational runbooks, system limits, or incident communication protocols?
*   **Draft**: 
    *   

---

## 🗣️ Spoken Draft Script (Max 2 Minutes)
*(Write out the complete narrative exactly as you would speak it)*

> *"[Placeholder Baseline Script]*
> *At [Company], during our annual sale event, our primary relational database CPU spiked to 100% and stayed there, locking all write operations. Our site was down, and we were losing transaction volume every minute. I was the on-call incident commander.*
> 
> *First, I immediately initiated a blameless incident bridge, designated a scribe to manage stakeholder updates, and focused the engineers on isolating the read and write traffic.*
> *Second, I checked our query logs and identified a slow-running analytics query that was missing an index, blocking the main database thread pool. I executed a kill command on the queries to restore database access.*
> *Finally, I set up a read-replica database specifically for our analytics traffic to isolate read queries from write transactions.*
> 
> *The site was fully functional in 18 minutes, and we implemented index validation on all query changes in the pipeline. This taught me that keeping a calm, structured approach is essential during production incident management."*

---

> **Srikar's Spoken Draft Script:**
> *At Saavik Solutions, during a major tournament launch on Kridaz, our booking engine suffered database lock deadlocks due to heavy concurrent traffic. Our database transactions timed out, which meant the third-party gateway charged our users, but our database failed to confirm the slot booking. Our customer support channels flooded with double-charge complaints.*
> 
> *With the platform in crisis, I was responsible for fixing the system immediately. First, I shielded the database by intercepting the payment callbacks and placing them into a message queue, transforming the synchronous write pipeline into an asynchronous worker pool. *
> 
> *Second, I went to the database query layer and refactored our slot checks to use PostgreSQL row-level locks with strict timeouts, specifically SELECT FOR UPDATE NOWAIT. This immediately stopped transactions from stacking up and crashing our application pool. Finally, I implemented a Saga flow. If a booking slot hold couldn't be finalized within two minutes, the orchestrator automatically triggered a compensating transaction to initiate a payment refund and release the slot.*
> 
> *We stabilized the platform within a few hours and completely resolved the double-booking issues. This experience taught me that under high-pressure outages, you must isolate the write pipeline first, set tight timeouts on all database locks, and always design self-healing compensation logic for distributed steps.*



---

## 🕵️ Rehearsal Log

| Date | Duration (sec) | Confidence (1-5) | Filler Count | Peer/Self Feedback |
| :--- | :--- | :--- | :--- | :--- |
| | | | | |
