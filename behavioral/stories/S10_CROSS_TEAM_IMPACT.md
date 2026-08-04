# S10 — Cross-Team Impact

* **Primary Question**: *"Tell me about a time you led an initiative that required coordination across multiple teams."*
* **Core Signal**: Collaboration, alignment, dependency management, communication.

---

## 📝 Story Builder (STAR+)

### [S] Situation (Context)
*   **Prompt**: Describe a large-scale project that required integrations across 2 or more separate teams (e.g., frontend-backend sync, core service dependencies, database migration).
*   **Draft**: 
    *   

### [T] Task (Your Responsibility)
*   **Prompt**: What was your responsibility?
*   **Draft**: 
    *   

### [A] Action (Your Steps)
*   **Prompt**: How did you align the technical goals of both teams? How did you define the contract (API/Schema)? How did you manage delays?
*   **Draft**:
    1.  
    2.  
    3.  
*   **Srikar's Draft**:
    1.  **Restructured with Turborepo Affected-Graphs:** I re-engineered the workflow to use Turborepo affected-graph analysis, ensuring we only compiled and tested projects impacted by files changed in the PR, rather than testing the entire monorepo.
    2.  **Configured Remote Caching:** I enabled incremental builds and remote caching, allowing GitHub Actions runners to pull previously compiled outputs for unchanged modules.
    3.  **Upgraded to AWS OIDC:** I replaced long-lived AWS programmatic keys stored in GitHub Secrets with dynamic AWS OIDC role assumption, raising our infrastructure security posture.

### [R] Result (The Metrics)
*   **Prompt**: Project completion timeline. Metrics achieved by the integration.
*   **Draft**: 
    *   

### [+] Reflection (Lessons Learned)
*   **Prompt**: What did you learn about API design first, documentation, and checking dependencies?
*   **Draft**: 
    *   

---

## 🗣️ Spoken Draft Script (Max 2 Minutes)
*(Write out the complete narrative exactly as you would speak it)*

> *"[Placeholder Baseline Script]*
> *At [Company], we were migrating our microservices to a service mesh. The migration required our platform team and 4 separate product engineering teams to update their service discovery configs simultaneously, creating a complex deployment dependency. I was tasked with coordinating this migration.*
> 
> *First, I designed an interface wrapper for our discovery layer, allowing teams to toggle between the old and new discovery endpoints using feature flags.*
> *Second, I wrote a migration guide and hosted a workshop for the product team leads to align on the timeline and rollbacks.*
> *Finally, I set up a staging workspace to test the rollout configuration with mock traffic.*
> 
> *We successfully migrated 14 microservices over 3 weeks with zero user-facing downtime and no rollback incidents. This taught me that when managing cross-team initiatives, technical API contracts and clear documentation are just as important as the code you write."*

---

> **Srikar's Spoken Draft Script:**
> *At Saavik Solutions, as our team expanded our 72-project monorepo, we ran into a massive developer productivity bottleneck. Our CI pipeline was running full lints, tests, and builds on the entire workspace for every PR, which took 20 minutes. Developers were blocked waiting for validation, which slowed down reviews and delayed deployments.*
> 
> *I took the lead on re-engineering our CI/CD pipeline. First, I restructured the GitHub Actions workflow to leverage Turborepo's affected-graph execution. This programmatically mapped the code changes in the branch and restricted lints, builds, and unit testing strictly to the projects impacted by those changes, rather than rebuilding the entire repository. Second, I configured remote caching so that identical build chunks were shared between developer environments and CI runners, skipping compilation for unchanged code. Finally, I modernized our security setup by replacing long-lived AWS IAM user credentials with dynamic OpenID Connect role assumption.*
> 
> *As a result, we slashed pull request validation times from 20 minutes down to just 4 minutes—an 80% improvement. This accelerated our code review loops, eliminated hardcoded secrets, and allowed the team to deploy features twice as fast. It proved to me that optimizing developer experience and CI pipelines is one of the most high-leverage investments a systems engineer can make for their team.*



---

## 🕵️ Rehearsal Log

| Date | Duration (sec) | Confidence (1-5) | Filler Count | Peer/Self Feedback |
| :--- | :--- | :--- | :--- | :--- |
| | | | | |
