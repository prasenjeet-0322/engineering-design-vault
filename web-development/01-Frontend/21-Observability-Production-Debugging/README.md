# Level 21: Observability, Telemetry & Production Debugging

[⬅️ Level 20: Build Tools & CI/CD](../20-Build-Tools-CICD-Deployment/README.md) | [📚 Frontend Master Hub](../README.md) | [Level 22: Senior Projects ➡️](../22-Senior-Projects-Engineering-Practice/README.md)

---

## 🎯 Overview
Production resilience and real-time observability: Error tracking with Sentry, Real User Monitoring (RUM), OpenTelemetry tracing, Source Map management, Performance telemetry, and Root Cause Analysis (RCA) playbooks.

---

## 🗺️ Curriculum Topics

1. **Error Tracking & Sentry Architecture:** Global uncaught error handlers, unhandled promise rejections, context tagging (user, release, environment), source map uploads.
2. **Real User Monitoring (RUM) & Web Vitals Telemetry:** Reporting Core Web Vitals to telemetry backends (Datadog, Grafana, OpenTelemetry).
3. **Distributed Tracing & Correlation IDs:** Propagating `traceparent` headers from client to microservices, latency waterfall debugging.
4. **Production Debugging & Memory Leak RCA:** Inspecting live production errors, session replay tooling (PostHog/FullStory), Heap snapshot analysis.
5. **Incident Management & Post-Mortems:** Writing blameless post-mortems, defining SLIs/SLOs, alerting thresholds.
