# S09 — Unpopular Decision

* **Primary Question**: *"Tell me about a decision you made that was unpopular with your team or stakeholders."*
* **Core Signal**: Architectural courage, data-backed conviction, empathy, consensus building, trade-off management.

---

## 📝 Story Builder (STAR+)

### [S] Situation (Context)
*   **Prompt**: Identify an engineering decision where you had to push back against a deadline or a popular technical trend (e.g., stopping a launch, selecting a boring technology over a hyped one).
*   **Draft**: 
    *   

### [T] Task (Your Responsibility)
*   **Prompt**: What was your responsibility?
*   **Draft**: 
    *   

### [A] Action (Your Steps)
*   **Prompt**: How did you present your unpopular opinion? What data did you use? How did you build consensus?
*   **Draft**:
    1.  
    2.  
    3.  
*   **Srikar's Draft**:
    1.  **Drafted a Trade-off RFC:** I wrote a design document outlining the concrete costs of microservices (network latency, Saga orchestrations, infrastructure complexity) vs. a Modular Monolith.
    2.  **Proposed Modular Monorepo boundaries:** I proposed building a Modular Monolith in a 72-project Nx monorepo. This would keep code domains decoupled at the directory level, using Anti-Corruption Layers to mediate cross-domain calls.
    3.  **Automated Dependency Linting:** To address concerns about monoliths decaying into spaghetti code, I set up ESLint rules to block invalid cross-domain imports, ensuring code-level modularity.

### [R] Result (The Metrics)
*   **Prompt**: What was the outcome? How did the team adapt? Was your decision validated?
*   **Draft**: 
    *   

### [+] Reflection (Lessons Learned)
*   **Prompt**: What did you learn about managing expectations, handling dissent, and the value of plain communication?
*   **Draft**: 
    *   

---

## 🗣️ Spoken Draft Script (Max 2 Minutes)
*(Write out the complete narrative exactly as you would speak it)*

> *"[Placeholder Baseline Script]*
> *At [Company], our product team wanted to launch a new feature that required storing sensitive payment details on a legacy SQL database to meet a marketing deadline. The entire team was on board with shipping it immediately and patching the security gaps later. I was the security anchor for the project and chose to block the release.*
> 
> *First, I scheduled an emergency meeting with the Product Manager and detailed the compliance and financial risks of data exposure, presenting a matrix of potential fines.*
> *Second, I proposed a compromise: a 3-day sprint to integrate our existing tokenized payment gateway instead of storing the raw data.*
> *Finally, I paired with the backend engineers to write the adapter client to speed up the integration.*
> 
> *The feature was shipped 3 days late, but with 100% security compliance and zero raw data exposed. This validated the decision to block the launch. This taught me that as a senior engineer, my responsibility is to protect the long-term stability and security of the system, even when it delays timelines."*

---

> **Srikar's Spoken Draft Script:**
> *At Saavik Solutions, while designing EA Overseas, our multi-tenant marketplace, the consensus among the engineers and advisors was to build it as a set of 15 microservices. Microservices are heavily hyped, and the team felt it was the modern way to build. However, as the founding backend engineer, I knew that introducing 15 network boundaries, distributed transactions, and independent deployment pipelines for a 4-person team would paralyze our delivery speed and increase our AWS bill significantly.*
> 
> *I made the unpopular decision to build the platform as a Modular Monolith inside a single Nx monorepo instead.*
> 
> *To get the team on board, I wrote a detailed architecture trade-off RFC. I argued that modularity is about code-level decoupling, not network separation. I proposed setting up 31 backend modules with strict Domain-Driven Design boundaries, using Anti-Corruption Layers to isolate services. To guarantee that this monolith wouldn't decay into a 'big ball of mud', I implemented ESLint boundary rules in Nx that programmatically blocked direct imports between domains.*
> 
> *The team was skeptical initially, but the design allowed us to ship the entire platform in a single pipeline with zero distributed network latency. We scaled to 31 bounded contexts seamlessly without the operational overhead of microservices. This taught me that a senior engineer must have the courage to make unpopular, pragmatic choices that fit the team's operational constraints rather than chasing industry hype.*



---

## 🕵️ Rehearsal Log

| Date | Duration (sec) | Confidence (1-5) | Filler Count | Peer/Self Feedback |
| :--- | :--- | :--- | :--- | :--- |
| | | | | |
