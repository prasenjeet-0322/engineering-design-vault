# S07 — Handling Ambiguity

* **Primary Question**: *"Tell me about a time you worked on a project with unclear or shifting requirements."*
* **Core Signal**: Independence, requirement gathering, structured decomposition, stakeholder communication.

---

## 📝 Story Builder (STAR+)

### [S] Situation (Context)
*   **Prompt**: Describe a scenario where you were handed a very vague project prompt (e.g., "Build a referral system" or "Improve system reliability") without specifications.
*   **Draft**: 
    *   

### [T] Task (Your Responsibility)
*   **Prompt**: What was your responsibility in defining and executing the scope?
*   **Draft**: 
    *   

### [A] Action (Your Steps)
*   **Prompt**: What did you do to clarify expectations? Who did you interview? How did you prototype your assumptions?
*   **Draft**:
    1.  
    2.  
    3.  
*   **Srikar's Draft**:
    1.  **Mapped Leak Vectors:** I analyzed our systems and identified logs (ELK Stack) and outbound webhook payloads as the primary risks for accidental PII leaks.
    2.  **Built Platform-Level Sanitization:** Instead of relying on developers to manually hide data, I implemented an automated sanitization framework. Using model decorators, I tagged sensitive PII fields, and wrote middleware to intercept outgoing logs/webhooks and automatically redact matched patterns.
    3.  **Centralized Consent Manager:** I designed a state-machine module to track user consent states and coordinate cascading erasures across Postgres and MongoDB databases on user deletion requests.

### [R] Result (The Metrics)
*   **Prompt**: What was the resulting system specification? What were the launch metrics?
*   **Draft**: 
    *   

### [+] Reflection (Lessons Learned)
*   **Prompt**: What did you learn about the importance of writing RFC docs, documenting assumptions, and validating assumptions early?
*   **Draft**: 
    *   

---

## 🗣️ Spoken Draft Script (Max 2 Minutes)
*(Write out the complete narrative exactly as you would speak it)*

> *"[Placeholder Baseline Script]*
> *At [Company], my manager asked me to 'improve the user onboarding flow.' There were no mock-ups, specifications, or product logs detailing where users were dropping off. I had to lead the project with complete ambiguity.*
> 
> *First, I spent 2 days querying our raw analytics DB to map the onboarding funnel, discovering that 45% of users dropped out at the verification screen.*
> *Second, I set up a whiteboard session with our lead designer and support team to understand common user complaints.*
> *Finally, I wrote a 3-page RFC document detailing a simplified verification flow, got alignment from stakeholders, and built a staging prototype.*
> 
> *We implemented the new onboarding flow, which increased user completion rates from 55% to 78% in the first month. This taught me that when faced with ambiguity, the best approach is to query the data first to identify the right problems to solve."*

---

> **Srikar's Spoken Draft Script:**
> *At Saavik Solutions, during the build of our student platform EA Overseas, our legal team requested that the platform align with GDPR and the new DPDP data privacy guidelines. The request was extremely abstract: they just asked us to ensure student PII was secure, logs and webhooks were sanitized, and data deletion requests were supported. There were no technical blueprints or design specs.*
> 
> *As the founding backend engineer, I was responsible for turning these ambiguous policies into a working system. I realized that asking developers to manually redact logs would inevitably lead to human error. Instead, I proposed building PII masking as a core platform capability.*
> 
> *First, I created custom TypeScript decorators on our user models to tag sensitive attributes like passports, phone numbers, and emails. Second, I wrote middleware for our logging library and outgoing webhook client. The middleware intercepted data payloads, checked the model metadata, and automatically ran regex masking on any tagged fields before writing logs or firing webhooks. Finally, I built a state-machine based consent manager to coordinate user erasure flows across our Postgres and MongoDB databases on deletion requests.*
> 
> *We achieved full compliance and passed audits without requiring our product developers to write a single line of custom sanitization code. This taught me that when dealing with vague mandates, a senior engineer's job is to define the technical bounds and design automated, system-level safety nets to prevent human error.*



---

## 🕵️ Rehearsal Log

| Date | Duration (sec) | Confidence (1-5) | Filler Count | Peer/Self Feedback |
| :--- | :--- | :--- | :--- | :--- |
| | | | | |
