# 🪞 Self-Discovery Dojo

This document serves as your raw database of past experiences. Before writing structured stories, use these inventories to capture high-signal moments, core technical metrics, and personal growth reflections.

---

## 🏗️ 1. Professional Identity
Define your core technical persona:

### Engineering Philosophy
*   **Prompt**: Write 3-4 sentences summarizing your architectural values, stack of choice, and approach to delivery.
*   **Draft**: 
    *   *Srikar's Draft:* I believe in building highly reliable, observable, and performant backend systems by matching the right technology to the actual operational scale. I advocate for clean Domain-Driven Design (DDD) boundaries, modular architectures, and strict row-level multi-tenant isolation. When scaling, I focus on profiling before optimization, leveraging concurrency patterns (like Saga orchestration, Request Coalescing, and transactional outbox), and maintaining clean interfaces to keep code decoupled and maintainable.

### The Superpower
*   **Prompt**: What is the one specific capability you bring to a team that sets you apart?
*   **Draft**:
    *   *Srikar's Draft:* **Performance profiling & Concurrency engineering.** I have a strong instinct for identifying event-loop blockages, designing multi-layer caching with request coalescing, and implementing transactional/financial correctness patterns (e.g., Saga, Transactional Outbox, and automated ledger reconciliation) to build robust systems under concurrency.

### The Mitigated Weakness
*   **Prompt**: Identify a genuine technical or process-oriented weakness and detail the exact guardrails you use to manage it.
*   **Draft**:
    *   *Srikar's Draft:* **Over-indexing on low-level micro-optimizations early in the product lifecycle.** I historically spent too much time tuning database queries and caching layers for features before product-market fit was established. I mitigate this by utilizing time-boxed architectural spikes, prioritizing initial feature delivery first, and only applying deep performance profiling (e.g., flame graphs, tail sampling) once we hit key scale thresholds or clear SLO deviations.

---

## 🗺️ 2. Career Journey Map
Map your career inflection points chronologically:

| Period | Company & Role | Technical Stack | Major Project Win | Key Decoupling / Scale Challenge | Exit Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Year 1-2** | | | | | |
| **Year 3-4** | | | | | |
| **Current** | | | | | |
| **Jan 2024 - Present** | Saavik Solutions, Founding Software Engineer | TypeScript, JavaScript, Node.js (Fastify, Express), PostgreSQL, Redis, AWS (ECS, EC2, RDS, S3), Nx, Turborepo | Designed and scaled the backend for **Kridaz** (sports venue booking and live scores, 7K+ DAU) and **EA Overseas** (multi-tenant EdTech platform). | Designed transparent PostgreSQL replica routing via AsyncLocalStorage; built ScopedRepository for row-level tenant isolation; resolved event-loop latency. | Seeking to transition from early-stage platform ownership to solving massive, highly distributed scale challenges at top-tier companies. |

---

## 📊 3. Achievement & Metrics Inventory
List every notable technical win:

| Win Description | Date | Scale Metric (QPS, DB size, Users) | Your Specific Role | Quantifiable Impact (Before vs After) | Key Component / Pattern Used |
| :--- | :--- | :--- | :--- | :--- | :--- |
| *Template Row* | | | | | |
| **Auth Event-Loop Optimization** | 2024 | 1,200+ req/min, 7K+ DAU | Lead Backend Engineer | Login Latency: **1.5s -> 300ms (p95)**; DB lookups: **-90%** | Native Argon2id + libuv thread offloading + Redis cache |
| **Telemetry Cost Reduction** | 2024 | Distributed traces | Observability Owner | Telemetry storage cost: **-90%**; improved debugging | OpenTelemetry + parent-based tail-sampling (10% base, 100% errors) |
| **Read/Write DB Routing** | 2024 | PostgreSQL replicas | Core Architect | **Zero replica lag consistency bugs** via sticky writes | ES6 Proxies + AsyncLocalStorage |
| **Financial Ledger Reconciliation** | 2024 | Payment transactions | Lead Engineer | Manual audit investigation effort: **-95%** | Automated reconciliation workers matching PG settlements |
| **CI/CD Optimization** | 2025 | 72-project Nx monorepo | DevOps/Platform Lead | PR validation time: **20 min -> 4 min (80% faster)** | Turborepo affected-graph + incremental builds; AWS OIDC |
| **Multi-Tenant Row Isolation** | 2024 | 31 backend modules | Domain Architect | Secured row-level data isolation across all domains | ScopedRepository injecting dynamic tenant SQL filters |

---

## ❌ 4. Failure & Reflection Inventory
List failures honestly. Highlight what you changed systematically afterwards:

| Incident / Mistake | Date | Business Impact | Root Cause | Immediate Mitigation | Permanent Engineering Fix | Core Learning |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| *Template Row* | | | | | | |
| **Auth Latency Spikes under Load** | 2024 | Elevated 5xx errors and high login drop-offs | Blocking synchronous `bcryptjs` calls clogged the single-threaded Node.js event-loop. | Increased ECS container count to distribute load. | Migrated to native `Argon2id` with libuv thread offloading and Redis caching. | Single-threaded environments require asynchronous offloading for CPU-intensive tasks. |

---

## ⚔️ 5. Conflict Resolution Inventory
Log instances where you navigated disagreements:

| Disagreement Type | Teammate Role | Your Stance | Their Stance | The Friction Point | How You Resolved It (Data/SPIKE) | Final System Outcome |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| *Template Row* | | | | | | |
| **Technical Design** | Lead DevOps Engineer | Use **Redis Streams** for live score updates on Kridaz. | Set up and run a self-hosted **Apache Kafka** cluster. | Kafka introduced massive operational overhead for our small team, whereas Redis was already in our stack. | Conducted a 3-day load-test SPIKE proving Redis Streams handled our 1.2k req/min with sub-millisecond latency. | Delivered WebSocket real-time updates without Kafka overhead; became a primary user acquisition channel. |

---

## 🚀 6. Everyday Leadership Inventory
Log leadership moments that did not require a formal title:

| Initiative Taken | Scope of Influence | Why it Mattered | Actions Taken | System/Team Result |
| :--- | :--- | :--- | :--- | :--- |
| *Template Row* | | | | |
| **Mentorship** | 5 junior developers & 7+ interns | Accelerating onboarding and aligning codebase quality. | Led structured code reviews, established Git workflows, and provided architectural documentation. | Reduced developer onboarding time and decreased pull-request revision loops. |
| **Standard Setting** | Saavik Solutions Backend Team | Eliminating cross-domain spaghetti code in the monorepo. | Authored DDD standards and module design guidelines for modular monolith with 31 bounded contexts. | Eliminated direct cross-domain dependencies using Anti-Corruption Layers (ACL). |
| **Security Improvement** | Platform Services | Eliminating long-lived AWS credentials vulnerability. | Reconfigured GitHub Action runners to use AWS OIDC role assumption. | Eradicated hardcoded secrets, bringing CI/CD up to IAM best practices. |
