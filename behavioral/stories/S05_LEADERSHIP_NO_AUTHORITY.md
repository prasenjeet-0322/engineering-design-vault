# S05 — Leadership Without Authority

* **Primary Question**: *"Tell me about a time you led a project or initiative without formal authority."*
* **Core Signal**: Influence, communication, standard setting, proactive ownership.

---

## 📝 Story Builder (STAR+)

### [S] Situation (Context)
*   **Prompt**: Identify a team process or system deficiency (e.g., lack of tests, manual deployments, on-call fatigue) that you decided to address voluntarily.
*   **Draft**: 
    *   

### [T] Task (Your Responsibility)
*   **Prompt**: What was your responsibility?
*   **Draft**: 
    *   

### [A] Action (Your Steps)
*   **Prompt**: How did you convince the team to adopt your idea? How did you implement it?
*   **Draft**:
    1.  
    2.  
    3.  
*   **Srikar's Draft**:
    1.  **Authored Monolith Standards:** I wrote an architectural specification detailing modular monolith standards, mapping out 31 bounded contexts and defining how domains should communicate.
    2.  **Introduced Anti-Corruption Layers (ACL):** I designed and built Anti-Corruption Layers to isolate domain models, ensuring that changes in one backend module didn't break downstream services.
    3.  **Enforced Automated Boundary Rules:** I configured Nx lint rules using project tags to programmatically block developers from importing files across invalid boundaries, catching violations at compile-time.

### [R] Result (The Metrics)
*   **Prompt**: Team metrics (e.g., test coverage increased by 30%, deployment time reduced by 50%).
*   **Draft**: 
    *   

### [+] Reflection (Lessons Learned)
*   **Prompt**: What did this teach you about leadership, persuasion, or standardizing development processes?
*   **Draft**: 
    *   

---

## 🗣️ Spoken Draft Script (Max 2 Minutes)
*(Write out the complete narrative exactly as you would speak it)*

> *"[Placeholder Baseline Script]*
> *At [Company], our deployment pipeline was failing frequently because of manual integration checks, leading to developers spending 6 hours per week troubleshooting staging environments. I was a mid-level engineer on the team with no management title, but I decided to lead the effort to automate the pipeline.*
> 
> *First, I created a short RFC (Request for Comments) outlining the automation steps and presented it during our weekly stand-up, highlighting that we could save 20 engineering hours/week.*
> *Second, I built a prototype of the automated workflow using GitHub Actions during a hackathon to prove the feasibility.*
> *Finally, I mentored two teammates on how to write integration workflows, distributing the knowledge across the team.*
> 
> *The automation was adopted, saving our team 22 hours per week in developer time and reducing production deployment incidents by 40%. This taught me that leadership is defined by ownership and initiative, not titles."*

---

> **Srikar's Spoken Draft Script:**
> *At Saavik Solutions, as we scaled our codebase inside a 72-project Nx monorepo, we ran into a classic architecture decay. Because we had no automated boundaries, developers started importing code directly between isolated domain boundaries. For example, booking logic would directly query payment tables, resulting in circular dependencies, fragile deployments, and regular regression bugs.*
> 
> *Although I did not hold a formal lead title, I knew we needed systematic guardrails. First, I authored our company's 'Modular Monolith Architectural Standards', mapping out 31 bounded contexts and establishing clear API boundaries. I introduced Anti-Corruption Layers so modules could exchange data without leaking their internal models. *
> 
> *Second, instead of just sharing a document that people would forget, I configured automated boundaries using Nx project tags and ESLint constraints. If a developer tried to import code across unauthorized boundaries, the linter blocked their commit immediately, giving them instant feedback. Finally, I held walkthrough sessions for our 5 junior developers and interns to align them on the new workflow.*
> 
> *As a result of this initiative, we eliminated circular dependencies completely and prevented modular degradation in our monorepo. This taught me that the most effective way to lead is by inventing automated guardrails that guide the team toward clean architecture by default.*



---

## 🕵️ Rehearsal Log

| Date | Duration (sec) | Confidence (1-5) | Filler Count | Peer/Self Feedback |
| :--- | :--- | :--- | :--- | :--- |
| | | | | |
