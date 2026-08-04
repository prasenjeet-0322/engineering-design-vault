# S11 — Data-Driven Impact

* **Primary Question**: *"Tell me about a time you used data to make an engineering decision or optimize a system."*
* **Core Signal**: Analytical reasoning, metrics instrumentation, database indexing profiling, A/B testing.

---

## 📝 Story Builder (STAR+)

### [S] Situation (Context)
*   **Prompt**: Describe a scenario where a system was underperforming, but the cause was unclear until you set up telemetry, dashboards, or queried profiling logs.
*   **Draft**: 
    *   

### [T] Task (Your Responsibility)
*   **Prompt**: What was your responsibility?
*   **Draft**: 
    *   

### [A] Action (Your Steps)
*   **Prompt**: What telemetry did you instrument (e.g., Prometheus metrics, Grafana charts)? How did you analyze the metrics? What solution did you implement based on that analysis?
*   **Draft**:
    1.  
    2.  
    3.  
*   **Srikar's Draft**:
    1.  **Instrumented OpenTelemetry:** I migrated our applications to use standard OpenTelemetry SDKs, Prometheus metrics, and Grafana dashboarding.
    2.  **Configured Tail-Based Sampling:** I set up an OpenTelemetry Collector cluster and configured a tail-sampling strategy. Instead of sampling at the entry point, the collector buffered trace spans and checked their final status: successful traces were sampled at a 10% rate, but any trace containing a 5xx error, DB timeout, or span error was retained at **100%**.
    3.  **Defined SLO Dashboarding:** I built Grafana alerts linked to our service-level objectives (SLOs), notifying developers only when error rates or p99 latencies exceeded set thresholds.

### [R] Result (The Metrics)
*   **Prompt**: Quantifiable gains (e.g., latency reduction %, resource savings in dollars).
*   **Draft**: 
    *   

### [+] Reflection (Lessons Learned)
*   **Prompt**: What did this teach you about the value of pre-production profiling and observability frameworks?
*   **Draft**: 
    *   

---

## 🗣️ Spoken Draft Script (Max 2 Minutes)
*(Write out the complete narrative exactly as you would speak it)*

> *"[Placeholder Baseline Script]*
> *At [Company], our checkout database was experiencing periodic lock saturation, but our query logs didn't show any single query exceeding the timeout threshold. I was assigned to investigate the root cause using system data.*
> 
> *First, I instrumented detailed database lock metrics using Prometheus and set up a Grafana dashboard to map transaction timelines against CPU consumption.*
> *Second, I analyzed the dashboards and identified that a background inventory reconciliation job was running concurrent updates on the same database table partitions as the checkout queries, causing lock contention.*
> *Finally, I refactored the background job to execute updates in batches during off-peak hours and partitioned the checkout tables.*
> 
> *As a result, database lock saturation dropped from 12% to less than 0.1%, and checkout transaction failure rate dropped to zero. This taught me that you cannot optimize what you do not measure, and dashboard metrics are the only source of truth in production systems."*

---

> **Srikar's Spoken Draft Script:**
> *At Saavik Solutions, as our transactional volume grew, our CloudWatch logging and OpenTelemetry trace storage costs skyrocketed, eating up 25% of our monthly infrastructure budget. Even worse, our head-based sampling mechanism, which randomly sampled 15% of all requests at start, meant we were capturing millions of redundant successful spans but missing rare, intermittent 5xx error traces that occurred in downstream payment steps.*
> 
> *I was tasked with reducing our cloud telemetry bills by at least 50% without losing visibility into production issues.*
> 
> *I decided to re-architect our telemetry pipeline using the OpenTelemetry Collector. First, I migrated us from simple head-based sampling to a parent-based tail-sampling strategy. Instead of sampling requests at the start, the collector evaluated the entire trace lifecycle at its end. I configured it to retain a 10% baseline of successful HTTP requests, but capture 100% of traces that encountered a 5xx error, DB exception, or span-timeout. Second, I linked Prometheus metrics to Grafana, designing dashboard SLOs that measured p99 latencies and error rates per domain.*
> 
> *As a result, we reduced our telemetry ingestion and storage costs by 90%, saving the company thousands of dollars monthly. More importantly, we improved our production debugging since engineers were guaranteed that any system failure would have its complete, un-sampled trace tree preserved. This taught me that observability is not just about logging everything; it's about setting up cost-effective, data-driven filters that guarantee high-signal debug data when things fail.*



---

## 🕵️ Rehearsal Log

| Date | Duration (sec) | Confidence (1-5) | Filler Count | Peer/Self Feedback |
| :--- | :--- | :--- | :--- | :--- |
| | | | | |
