# Level 14: Turborepo & Build Pipeline Engineering 🆕

[⬅️ Level 13: Nx Ecosystem](../13-Nx-Ecosystem-Enterprise-Monorepos/README.md) | [📚 Frontend Master Hub](../README.md) | [Level 15: Testing & Quality ➡️](../15-Testing-Quality-Engineering/README.md)

---

## 🎯 Overview
High-performance build pipelines and monorepo orchestration with Turborepo: `turbo.json` task pipelines, input/output content hashing, local & remote caching (Vercel Remote Cache), dependency-aware execution, and Next.js monorepo integration.

---

## 🗺️ Curriculum Topics (20 KPIs)

- **KPI 01:** Turborepo Mental Model & Philosophy
- **KPI 02:** Workspace Structure & Multi-Package Topology
- **KPI 03:** `turbo.json` Configuration Architecture
- **KPI 04:** Tasks & Pipeline Definitions
- **KPI 05:** Task Dependencies (`dependsOn: ["^build"]`)
- **KPI 06:** Package Topological Sort & Execution Order
- **KPI 07:** Inputs (Source File Hashing & Glob Patterns)
- **KPI 08:** Outputs (Artifact Directories & File Tracking)
- **KPI 09:** Task Hashing Engine & Cache Keys
- **KPI 10:** Local File-System Cache Mechanics
- **KPI 11:** Remote Caching (Vercel Remote Cache & Self-Hosted S3/GCS)
- **KPI 12:** Cache Invalidation & Cache Miss Troubleshooting
- **KPI 13:** Parallel Execution & Concurrency Limits (`--concurrency`)
- **KPI 14:** Filtering & Selective Execution (`--filter=...`)
- **KPI 15:** Dependency-Aware Task Execution
- **KPI 16:** Environment Variables & Caching (`env`, `globalEnv`)
- **KPI 17:** Persistent Tasks & Dev Servers (`persistent: true`)
- **KPI 18:** CI/CD Pipeline Optimization with Turborepo
- **KPI 19:** Turborepo with React & Next.js App Router
- **KPI 20:** Workspace Package Publishing & Changesets Workflow
