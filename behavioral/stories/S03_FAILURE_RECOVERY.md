# S03 — Failure & Recovery

* **Primary Question**: *"Tell me about a time you failed or made a mistake."*
* **Core Signal**: Humility, self-awareness, accountability, incident mitigation, blameless post-mortems.

---

## 📝 Story Builder (STAR+)

### [S] Situation (Context)
*   **Prompt**: Identify a genuine mistake you made (e.g., pushed bad code, misconfigured production, failed to meet estimation by weeks).
*   **Draft**: 
    *   

### [T] Task (Your Responsibility)
*   **Prompt**: What was your responsibility in resolving the incident?
*   **Draft**: 
    *   

### [A] Action (Your Steps)
*   **Prompt**: How did you identify the bug? How did you communicate the failure to stakeholders? What temporary and permanent fixes did you apply?
*   **Draft**:
    1.  
    2.  
    3.  
*   **Srikar's Draft**:
    1.  **Event-Loop Profiling:** I ran Node.js CPU profiling under load and analyzed flame graphs. This revealed that the single-threaded event loop was blocked by synchronous CPU-bound cryptographic operations.
    2.  **Offloading with Argon2id & libuv:** I replaced the pure-JavaScript synchronous `bcryptjs` library with native asynchronous `Argon2id`. This successfully offloaded the CPU-bound password hashing to the background thread pool managed by `libuv`, freeing the main loop to process other event requests.
    3.  **Token Caching with Redis:** I set up an active session token cache in Redis. Instead of querying the database and verifying credentials on every high-frequency API call, session tokens were validated in-memory, avoiding redundant hashing operations.

### [R] Result (The Metrics)
*   **Prompt**: What was the recovery timeline? What permanent system changes were instituted to prevent recurrence?
*   **Draft**: 
    *   

### [+] Reflection (Lessons Learned)
*   **Prompt**: What did this failure teach you about testing protocols, deployment guards, or estimation processes?
*   **Draft**: 
    *   

---

## 🗣️ Spoken Draft Script (Max 2 Minutes)
*(Write out the complete narrative exactly as you would speak it)*

> *"[Placeholder Baseline Script]*
> *At [Company], I was lead developer for a major data migration project where we migrated 12 million legacy customer database records to a new schema. During the migration, a legacy record format inconsistency caused our script to fail halfway through, leaving 4 million records in an inconsistent state.*
> 
> *I immediately notified the incident team and my manager, taking full responsibility for the script's validation gaps. First, I ran the rollback procedure to restore database state from the latest snapshot.*
> *Second, I wrote a validation suite to scan the remaining data for anomalies before running the script again.*
> *Finally, I worked with the DevOps team to set up staging environment parity for testing migrations.*
> 
> *The database was fully recovered within 2 hours with zero permanent data loss, and we successfully executed the migration 3 days later. This failure taught me to never execute schema migrations without dynamic validation and to test migration scripts against production-replica data in staging first."*

---

> **Srikar's Spoken Draft Script:**
> *At Saavik Solutions, during a launch event on our sports venue booking platform Kridaz, our login endpoints choked under peak load. The p95 authentication latency spiked to 1.5 seconds, CPU usage hit 98%, and users were seeing connection timeouts.*
> 
> *As the founding engineer, I set out to diagnose the performance bottleneck. I ran a CPU profiler under simulated load and compiled flame graphs. The analysis showed that the single-threaded Node.js event loop was being blocked for hundreds of milliseconds at a time. The blocker was our synchronous password hashing library, bcryptjs, which ran entirely on the main JavaScript thread. *
> 
> *To resolve this, I did two things. First, I migrated our hashing to asynchronous native Argon2id bindings. This offloaded the cryptographic computations from the single-threaded event loop to the background threads managed by Node's libuv. Second, I implemented a Redis caching layer for active session tokens, eliminating the need to repeatedly run password verifications for active API calls, which cut database lookups by 90%.*
> 
> *This dropped our p95 login latency from 1.5 seconds to 300ms, and our systems comfortably handled the peak load of 1,200 requests per minute. This experience hammered home the lesson that you must never block the single thread in Node.js, and CPU-intensive operations must always be offloaded or cached.*



---

## 🕵️ Rehearsal Log

| Date | Duration (sec) | Confidence (1-5) | Filler Count | Peer/Self Feedback |
| :--- | :--- | :--- | :--- | :--- |
| | | | | |
