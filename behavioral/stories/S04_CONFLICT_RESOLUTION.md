# S04 — Conflict Resolution

* **Primary Question**: *"Tell me about a disagreement you had with a teammate or manager."*
* **Core Signal**: Emotional intelligence, negotiation, active listening, data-backed resolution, disagree and commit.

---

## 📝 Story Builder (STAR+)

### [S] Situation (Context)
*   **Prompt**: Describe a scenario where you and a colleague disagreed on a technical or project path (e.g., framework, architecture approach, database choice).
*   **Draft**: 
    *   

### [T] Task (Your Responsibility)
*   **Prompt**: What was your responsibility in resolving this conflict?
*   **Draft**: 
    *   

### [A] Action (Your Steps)
*   **Prompt**: What did you do to understand their perspective? How did you gather objective data? How did you achieve consensus?
*   **Draft**:
    1.  
    2.  
    3.  
*   **Srikar's Draft**:
    1.  **Conducted a Load-Test SPIKE:** I set up a local benchmark sandbox running both Redis Streams and a Kafka container, utilizing `k6` to simulate our peak target throughput of 1,200+ requests/minute.
    2.  **Analyzed Performance and Latency:** The benchmarks proved that Redis Streams achieved sub-millisecond message delivery latency, satisfying our user experience needs while running on our existing Redis cluster.
    3.  **Prepared an Operational Cost Analysis:** I detailed the setup, schema management, and maintenance costs of Kafka vs. Redis. I presented the benchmark data and cost comparison to the DevOps lead, framing it around operational simplicity and rapid delivery.

### [R] Result (The Metrics)
*   **Prompt**: What was the technical outcome? How did the relationship between you and the colleague end up?
*   **Draft**: 
    *   

### [+] Reflection (Lessons Learned)
*   **Prompt**: What did you learn about communication, building prototypes to resolve debates, or when to commit after a decision?
*   **Draft**: 
    *   

---

## 🗣️ Spoken Draft Script (Max 2 Minutes)
*(Write out the complete narrative exactly as you would speak it)*

> *"[Placeholder Baseline Script]*
> *At [Company], our team was designing a real-time analytics portal. A senior colleague insisted on using MongoDB because of write performance, while I advocated for PostgreSQL using JSONB columns because of relational integrity requirements.*
> 
> *First, instead of arguing opinions, I set up a meeting with my colleague to document their concerns about PostgreSQL write latency. We agreed on a set of criteria for evaluation.*
> *Second, I spent a day building a benchmark pipeline in our staging environment, generating 5 million mock writes using JMeter to test both databases.*
> *Finally, I presented the results, which showed PostgreSQL met our latency threshold while maintaining indexes, and MongoDB had index drift. We agreed Postgres was the better choice.*
> 
> *We implemented PostgreSQL, and the system launched with zero data inconsistencies, handling 1.2M events daily. This taught me that building prototypes is the fastest way to resolve technical debates."*

---

> **Srikar's Spoken Draft Script:**
> *At Saavik Solutions, when we were building the real-time live scoring platform for Kridaz, our lead DevOps engineer strongly pushed to set up a self-hosted Apache Kafka cluster as our messaging backend. While I understood that Kafka is the industry standard for high-throughput streaming, I was concerned about the operational tax it would impose on our 4-person engineering team in terms of cluster management, partition strategy, and custom clients.*
> 
> *To resolve this disagreeing stance constructively, I proposed a 3-day load testing spike. I simulated our peak target throughput of 1,200 requests per minute using k6 against both Kafka and Redis Streams, which we already had running in production. The performance data proved that Redis Streams easily achieved sub-millisecond message delivery latency with negligible CPU impact, using our existing cache node resources. *
> 
> *I presented this benchmark data alongside a trade-off sheet detailing the operational maintenance overhead of Kafka. Seeing that Redis fully satisfied our performance requirements without any infrastructure cost or setup overhead, the DevOps engineer immediately aligned with my proposal.*
> 
> *We launched using Redis Streams, and the WebSocket live score feature went live ahead of schedule, successfully driving nearly 50% of our user registrations. This taught me that the most effective way to lead is by inventing automated guardrails that guide the team toward clean architecture by default.*



---

## 🕵️ Rehearsal Log

| Date | Duration (sec) | Confidence (1-5) | Filler Count | Peer/Self Feedback |
| :--- | :--- | :--- | :--- | :--- |
| | | | | |
