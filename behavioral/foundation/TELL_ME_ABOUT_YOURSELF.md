# 🗣️ Tell Me About Yourself & Elevator Pitch

First impressions dictate the interviewer's grading baseline. Prepare three versions of your introduction script.

---

## ⚡ 1. The 30-Second Elevator Pitch
*Best for recruiter chats, quick team introductions, or networking.*

### Structure:
1.  **Who you are**: stack + focus.
2.  **Core achievement**: project + metric.
3.  **Your Superpower**: technical specialty.
4.  **Target**: what you are looking for next.

### 📝 Template Slot:
> *"I'm a software engineer with `[X]` years of experience, specializing in `[Domain, e.g., low-latency distributed systems]`. Most recently at `[Current Company]`, I designed and built `[Project]`, which `[Hero Metric, e.g., reduced silent transaction failures by 98%]`. My superpower is `[Superpower, e.g., decoupling backend monoliths into thread-safe microservices]`. I'm currently looking for `[Target Role]` opportunities where I can own `[specific technical challenge]` at scale."*

*   **Draft Space**:
    *   *Srikar's Pitch:* "I'm a Backend Software Engineer with 3 years of experience building high-performance Node.js/TypeScript applications on AWS. As a Founding Engineer at Saavik Solutions, I owned the backend architecture for Kridaz (a sports venue booking engine serving 7k+ DAU) and EA Overseas (a multi-tenant marketplace). My specialty is concurrency and performance profiling—I recently resolved an auth bottleneck dropping p95 latency from 1.5s to 300ms, and built a custom Postgres read/write router using ES6 Proxies. I'm looking for my next role where I can tackle distributed transactional challenges at FAANG scale."

---

## 🏗️ 2. The 2-Minute "Tell Me About Yourself"
*Best for technical rounds and hiring manager loops.*

### Breakdown:
*   **Part 1: The Hook (20 sec)** — Present status, tech stack, scale.
*   **Part 2: Chronological Journey (40 sec)** — Trajectory of growth, key roles, decisions behind job shifts.
*   **Part 3: Recent Peak Win (30 sec)** — Your most impressive engineering project.
*   **Part 4: The Pivot (30 sec)** — Why this role is the perfect intersection of your skills and their engineering needs.

### 📝 Draft Space:
*   **Part 1 (The Hook)**: "I am a backend-focused engineer specializing in TypeScript, Node.js, PostgreSQL, Redis, and AWS infrastructure. Over the past few years, as the Founding Software Engineer at Saavik Solutions, I've architected and scaled two core platforms from zero to production: Kridaz, a sports booking app serving 7k+ daily active users, and EA Overseas, a multi-tenant EdTech marketplace."
*   **Part 2 (Journey)**: "My engineering journey started with a degree in Artificial Intelligence, but I quickly pivoted to backend systems where I could design for scalability. At Saavik Solutions, as the sole founding backend engineer, I owned the core monorepo architecture. I established domain boundaries across 31 backend modules and led standards for testing and CI/CD, which reduced our PR validation time by 80%."
*   **Part 3 (Peak Win)**: "One of my favorite challenges was designing Kridaz's checkout platform. We faced concurrency race conditions on slot bookings. I designed a Saga orchestrator with compensating transactions to ensure booking, slot allocation, and payment authorization were transactionally consistent. I also implemented an automated reconciliation worker that reduced payment mismatches, cutting manual audit hours by 95%."
*   **Part 4 (The Pivot)**: "While I've loved building platforms from scratch, I'm eager to solve architectural challenges at a much larger scale. I'm targeting this role because your team's focus on high-throughput event streaming aligns perfectly with my background in performance profiling, caching strategy, and concurrency."

---

## 🚀 3. The 5-Minute Walkthrough
*Best for Senior/Staff loops where they request a deep overview of your technical background.*

### Breakdown:
*   **Phase 1 (1 min)**: Persona, tech philosophy, and high-level architectural preferences.
*   **Phase 2 (2 min)**: Chronological projects, detailing specific databases, caching strategies, and concurrency patterns used.
*   **Phase 3 (1.5 min)**: Core architecture ownership, scale statistics (QPS, bytes/sec, DB replica layouts), and business impact.
*   **Phase 4 (30 sec)**: Next career steps and alignment with the target company's mission.

### 📝 Draft Space:
*   **Phase 1 (Persona & Stack)**: "I am a systems-oriented backend engineer who believes that high-scale architectures should remain as simple as possible. My primary stack is TypeScript/Node.js, PostgreSQL, Redis, and AWS. I lean heavily on Domain-Driven Design (DDD) to keep domains isolated, and I treat observability as a core requirement rather than an afterthought."
*   **Phase 2 (Chronological Projects)**: "At Saavik Solutions, I started by architecting **Kridaz**. During early load testing, our auth flow choked under load. I profiled the event-loop and found synchronous bcrypt blocking the single thread. I offloaded hashing to libuv threadpool using native Argon2id and set up Redis caching, boosting throughput to 1200+ requests/minute. Later, for **EA Overseas**, I built a multi-tenant Postgres read/write router using ES6 Proxies and AsyncLocalStorage, which resolved replica lag consistency issues by forcing sticky reads immediately after writes."
*   **Phase 3 (Scale & Impact)**: "Across both platforms, I scaled operations to 7k+ DAU. I owned the developer productivity pipeline, implementing Turborepo affected-graphs to cut CI lint/test pipelines from 20 to 4 minutes. In production, to keep telemetry costs low while preserving debuggability under traffic, I set up tail-based sampling with OpenTelemetry (10% normal, 100% errors), which reduced our log ingestion bill by 90%."
*   **Phase 4 (Next Steps)**: "I am looking to bring this deep ownership and system optimization mindset to your distributed systems team. I want to work with engineering teams that design systems that survive massive traffic and are built to last."
