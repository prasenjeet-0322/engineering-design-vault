# S02 — Technical Innovation

* **Primary Question**: *"Tell me about a complex technical problem you solved."*
* **Core Signal**: Architecture, design patterns, analytical troubleshooting, trade-off analysis.

---

## 📝 Story Builder (STAR+)

### [S] Situation (Context)
*   **Prompt**: Describe a complex, non-obvious engineering bottleneck (e.g., memory leak, N+1 query issue, high write-amplification in database).
*   **Draft**: 
    *   

### [T] Task (Your Responsibility)
*   **Prompt**: What was your responsibility?
*   **Draft**: 
    *   

### [A] Action (Your Steps)
*   **Prompt**: Detail the steps you took to diagnose (e.g., profile memory, flame graphs) and resolve the issue. What alternatives did you reject?
*   **Draft**:
    1.  
    2.  
    3.  
*   **Srikar's Draft**:
    1.  **Context Tracking with AsyncLocalStorage:** I utilized Node's `AsyncLocalStorage` to maintain request-scoped execution contexts, allowing the backend to identify if a write query had been executed in the current request thread.
    2.  **Transparent Routing with ES6 Proxies:** Instead of forcing developers to manually call `db.read()` or `db.write()`, I built an abstraction using ES6 Proxies to wrap database connections. The Proxy intercepted all queries and dynamically routed writes to the primary, and reads to the replicas.
    3.  **Implemented Sticky Reads:** I built a temporal pinning mechanism. If a user session executed a write command, the Proxy pinned their session's read queries exclusively to the primary for a 5-second window, bypassing replicas until sync was guaranteed.

### [R] Result (The Metrics)
*   **Prompt**: Performance metrics (e.g., throughput increased by 200%, p99 latency dropped from 2s to 150ms).
*   **Draft**: 
    *   

### [+] Reflection (Lessons Learned)
*   **Prompt**: What did you learn about profiling, system limits, or caching strategies?
*   **Draft**: 
    *   

---

## 🗣️ Spoken Draft Script (Max 2 Minutes)
*(Write out the complete narrative exactly as you would speak it)*

> *"[Placeholder Baseline Script]*
> *At [Company], our core product catalog search service was experiencing CPU spikes up to 98% during peak hours, causing search requests to time out. I was assigned to resolve the performance issue before Black Friday.*
> 
> *I ran profiling tools and generated flame graphs, which revealed that we were facing an extreme N+1 query pattern on the ElasticSearch index mapping layer. I evaluated two alternatives: implementing a Redis query cache or redesigning the indexing mapping to pre-bake associations. I chose the pre-baking strategy because a cache would still require database hits on cache misses.*
> *I refactored our data pipeline to compile associations asynchronously using CDC (Change Data Capture) with Kafka. I also batch-loaded records in our application layer using the DataLoader pattern.*
> 
> *As a result, CPU utilization during peak hours dropped from 98% to 35%, and search latency dropped from 2.2 seconds to 80ms under a load of 15k QPS. This taught me to always analyze database access patterns before attempting to scale compute."*

---

> **Srikar's Spoken Draft Script:**
> *At Saavik Solutions, on our EdTech marketplace EA Overseas, we scaled PostgreSQL using read replicas. However, we immediately ran into replica lag. When users updated their records and refreshed the page, the subsequent read routed to a replica that hadn't synchronized, causing the UI to display stale information. This led to users resubmitting their data, creating database duplicate rows.*
> 
> *Instead of forcing the team to manually specify primary or replica databases in their code, I designed a transparent database routing layer. First, I used Node's AsyncLocalStorage to track the request lifecycle. When a write query was detected, the request context was marked. Second, I wrapped our ORM and DB connection pools in an ES6 Proxy. This proxy intercepted every SQL query. If it detected a write command, or if the user's session had executed a write in the last 5 seconds, the proxy pinned the session's traffic to the primary database. All other standard read traffic was routed to the replicas.*
> 
> *This transparent read-after-write routing resolved all replica lag consistency bugs without requiring any modifications to our application services. This taught me that meta-programming and context-based proxies are extremely powerful tools to keep architectural concerns cleanly separated from business logic.*



---

## 🕵️ Rehearsal Log

| Date | Duration (sec) | Confidence (1-5) | Filler Count | Peer/Self Feedback |
| :--- | :--- | :--- | :--- | :--- |
| | | | | |
