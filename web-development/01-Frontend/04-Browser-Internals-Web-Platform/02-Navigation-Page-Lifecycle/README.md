# KPI 02 — Navigation & Page Lifecycle

[⬅️ Back to Level 04 Master Hub](../README.md) | [KPI 03: HTML Parsing ➡️](../03-HTML-Parsing-DOM-Construction/README.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

## 🎯 Purpose & Core Competencies

Master the complete navigation lifecycle from URL entry to a rendered, active document:

`	ext
URL Input / Click
        ↓
Network Resolution (DNS → TCP/QUIC → TLS 1.3)
        ↓
HTTP Response & MIME Sniffing
        ↓
Process Allocation & Document Creation
        ↓
Parser & Resource Discovery Boundaries
        ↓
Page Lifecycle Events (DOMContentLoaded → load → pageshow)
        ↓
History Traversal & BFCache Restoration
`

---

## 🗺️ KPI 02 Complete Part Map (11 Parts)

| Part | Title | Status | Core Focus |
|---|---|---|---|
| **Part 01** | [Complete Navigation Mental Model](./01-complete-navigation-mental-model.md) | ✅ Completed | Navigation initiation, URL resolution, navigation types, document navigation vs SPA navigation, high-level lifecycle. |
| **Part 02** | [DNS & Connection Establishment](./02-dns-connection-establishment.md) | ✅ Completed | DNS resolution, browser DNS caching, connection reuse, TCP/QUIC, connection setup and how these affect navigation. |
| **Part 03** | [TLS & Secure Connection Establishment](./03-tls-secure-connection-establishment.md) | ✅ Completed | TLS 1.3, certificate validation, handshake mechanics, session resumption, security/performance implications. |
| **Part 04** | [HTTP Navigation & Response Processing](./04-http-navigation-response-processing.md) | ✅ Completed | HTTP request/response, redirects, status codes relevant to navigation, headers, caching interaction, response handling. |
| **Part 05** | [Resource Loading & Critical Rendering Path](./05-document-navigation-lifecycle.md) | ✅ Completed | Resource scheduler, parser-blocking JS, render-blocking CSS, preloads, heuristics, Critical Rendering Path. |
| **Part 06** | [JavaScript Execution & Event Loop](./06-page-lifecycle-events.md) | ✅ Completed | Event loop, tasks, microtasks, Long Tasks (50ms), layout thrashing, React scheduling, Web Workers. |
| **Part 07** | [Events, Input & User Interaction](./07-history-session-navigation.md) | ✅ Completed | Event propagation, capture/bubble, delegation, passive listeners, pointer/touch, default actions. |
| **Part 08** | [Forms, Submission & Default Behavior](./08-bfcache-deep-mechanics.md) | ✅ Completed | Form submission algorithm, constraint validation, FormData, requestSubmit vs submit, CSRF. |
| **Part 09** | [History API & SPA Navigation](./09-spa-react-nextjs-navigation.md) | ✅ Completed | Session history, pushState/replaceState, popstate, same-document navigation, scroll restoration. |
| **Part 10** | [Navigation Timing & Measurement](./10-navigation-performance-diagnostics.md) | ✅ Completed | PerformanceNavigationTiming, waterfalls, transition latency, TTFB decomposition, DCL/Load attribution. |
| **Part 11** | [Navigation Cancellation & Competing Navigations](./11-production-failure-traces-crucible.md) | ✅ Completed | Competing navigations, supersession, AbortController boundaries, race conditions, latest-intent guards. |

---

## 🧠 Diagnostic Labs & Runbooks

* examples/ — Interactive diagnostic labs covering Navigation Timing API visualizer, live BFCache freeze/restore simulator, and DNS pre-resolution profiling.

---

[⬅️ Back to Level 04 Master Hub](../README.md) | [KPI 03: HTML Parsing ➡️](../03-HTML-Parsing-DOM-Construction/README.md)
