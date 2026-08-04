# 💎 Values & Identity

Your core engineering values are your guidelines. This worksheet helps you identify, define, and map your top 5 values to corporate principles.

---

## 🏗️ 1. Core Values Ranking

Define your top 5 values from the options list:
*   *Options*: `Technical Excellence`, `Innovation`, `Ownership`, `Speed`, `Quality`, `Collaboration`, `Transparency`, `Impact`, `Growth`, `Integrity`, `Simplicity`, `Customer Focus`, `Data-Driven`, `Boldness`, `Humility`, `Learning`, `Mentorship`, `Execution`.

| Rank | Chosen Value | Your Definition | How You Embody It Daily | Story Reference |
| :--- | :--- | :--- | :--- | :--- |
| **1** | | | | |
| **2** | | | | |
| **3** | | | | |
| **4** | | | | |
| **5** | | | | |
| **Rank (Srikar)** | **Chosen Value (Srikar)** | **Your Definition (Srikar)** | **How You Embody It Daily (Srikar)** | **Story Reference (Srikar)** |
| **1** | Technical Excellence | Writing performant, concurrent, and highly-observable systems. | Using flame graphs, optimizing event loops, and setting up SLO alerting. | S03, S11 |
| **2** | Ownership | Taking end-to-end accountability for system architecture and developer productivity. | Establishing Nx workspace boundaries and implementing AWS OIDC. | S05, S10 |
| **3** | Simplicity | Choosing minimal operational complexity to fulfill scale requirements. | Opting for Redis Streams instead of Apache Kafka to avoid overhead. | S04, S09 |
| **4** | Quality / Correctness | Building resilient code that handles failures gracefully and guarantees correct state. | Designing Saga transactions with compensating steps and reconciliation. | S01, S08 |
| **5** | Mentorship | Uplifting the engineering team through guidelines, reviews, and teaching. | Guiding 5 junior engineers and 7 interns on clean code. | S12 |

---

## 🤝 2. Company Alignment Map

Map your ranked values to company core principles:

| Your Value | Googleyness Equivalent | Amazon LP Equivalent | Meta Culture Fit | Microsoft growth Fit | Startup Fit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| | | | | | |
| | | | | | |
| | | | | | |
| **Srikar's Value** | **Googleyness Equivalent** | **Amazon LP Equivalent** | **Meta Culture Fit** | **Microsoft growth Fit** | **Startup Fit** |
| Technical Excellence | Thriving in complexity | Insist on the Highest Standards | Focus on Long-Term Impact | Growth Mindset | High Performance |
| Ownership | Bias for Action | Ownership | Be Bold / Move Fast | Individual Impact | Direct Accountability |
| Simplicity | Simple Solutions | Invent and Simplify | Focus on Impact | Make It Simple | Speed of execution |
| Quality / Correctness | Doing the right thing | Customer Obsession | Build Awesome Things | Customer-obsessed | Survival & Trust |
| Mentorship | Helping others grow | Develop the Best | Build Social Value | Empower Others | Team Catalyst |

---

## 🔥 3. Values Tested Under Pressure
*Write down instances where maintaining your value was difficult or costly:*

### Disagreeing with Technical Direction
*   **The Value**: 
*   **The Cost**: 
*   **What You Did**: 
*   **Srikar's Example**:
    *   *The Value:* Simplicity
    *   *The Cost:* Disagreeing with lead DevOps engineer, spending 3 days building a load-test spike.
    *   *What You Did:* Showed load-test numbers proving Redis Streams handles 1.2k req/min with minimal operational cost compared to self-hosted Kafka.

### Pushing Back on Timelines for Quality
*   **The Value**: 
*   **The Cost**: 
*   **What You Did**: 
*   **Srikar's Example**:
    *   *The Value:* Quality / Correctness
    *   *The Cost:* Delaying a checkout release by a week to build compensating transaction logic.
    *   *What You Did:* Designed Saga patterns and reconciliation workers to guarantee no double-booking or slot leakage under high concurrency.
