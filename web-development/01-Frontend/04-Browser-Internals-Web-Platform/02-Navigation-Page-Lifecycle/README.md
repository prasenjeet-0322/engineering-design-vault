# KPI 02 — Navigation & Page Lifecycle Architecture

[⬅️ Level 04 Overview](../README.md) | [📚 Frontend Master Hub](../../README.md) | [KPI 03: HTML Parsing & DOM Construction ➡️](../03-HTML-Parsing-DOM-Construction/README.md)

> **Tier:** 🔴 MUST KNOW  
> **Repository Owner & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

## Overview

Modern web applications do not simply load once and sit static in memory. Users navigate between routes, switch browser tabs, background mobile windows, traverse historical states via the Back/Forward buttons, and restore suspended tabs from memory.

This master module provides an exhaustive, production-grade guide to browser navigation mechanics, the Document and Page Lifecycle specifications, the Visibility API, Back/Forward Cache (BFCache) eligibility, eviction heuristics, and resilient state revalidation architecture.

---

## 🗺️ Module Architecture & Navigation

| Part | Title | Document | Key Architectural Focus | Status |
|---|---|---|---|---|
| **Part 1** | Navigation Types & Browser Traversal | [01-navigation-types-traversal.md](./01-navigation-types-traversal.md) | Hard vs Soft navigations, History API, URL fragment vs PushState, Location interface | 🟡 Planned |
| **Part 2** | Document Loading Stages & Parser State | [02-document-loading-parser-states.md](./02-document-loading-parser-states.md) | `document.readyState`, `DOMContentLoaded`, `load`, Parser blocking scripts, `defer` vs `async` | 🟡 Planned |
| **Part 3** | Resource Timing & Navigation Timing APIs | [03-navigation-timing-resource-timing.md](./03-navigation-timing-resource-timing.md) | `PerformanceNavigationTiming`, DNS lookup, TCP/TLS handshake, TTFB, DOM Interactive | 🟡 Planned |
| **Part 4** | The Page Lifecycle API Specification | [04-page-lifecycle-api-spec.md](./04-page-lifecycle-api-spec.md) | Active, Passive, Hidden, Frozen, Terminated, Discarded lifecycle states | 🟡 Planned |
| **Part 5** | The Visibility API & Background Throttling | [05-visibility-api-background-throttling.md](./05-visibility-api-background-throttling.md) | `document.visibilityState`, `visibilitychange`, CPU throttling, Audio/Video pausing | 🟡 Planned |
| **Part 6** | `beforeunload` & `unload` Deprecation Realities | [06-beforeunload-unload-deprecation.md](./06-beforeunload-unload-deprecation.md) | Unsaved changes dialogs, `event.preventDefault()`, Why `unload` is forbidden | 🟡 Planned |
| **Part 7** | `pagehide` & `pageshow` Event Mechanics | [07-pagehide-pageshow-mechanics.md](./07-pagehide-pageshow-mechanics.md) | `PageTransitionEvent`, `event.persisted`, Clean document teardowns | 🟡 Planned |
| **Part 8** | Tab Discarding & Memory Freeze Recovery | [08-tab-discarding-freeze-recovery.md](./08-tab-discarding-freeze-recovery.md) | `document.wasDiscarded`, Browser memory shedding, Tab suspension recovery | 🟡 Planned |
| **Part 9** | Single-Page Application (SPA) vs MPA Lifecycle | [09-spa-vs-mpa-lifecycle.md](./09-spa-vs-mpa-lifecycle.md) | Client-side routing, Virtual history, Memory accumulation, Scroll restoration | 🟡 Planned |
| **Part 10** | Pre-rendering, Prerender2 & Speculation Rules | [10-prerendering-speculation-rules.md](./10-prerendering-speculation-rules.md) | `<script type="speculationrules">`, Prerender activation, `document.prerendering` | 🟡 Planned |
| **Part 11** | Mobile Browser Page Lifecycles & App Switching | [11-mobile-browser-lifecycles.md](./11-mobile-browser-lifecycles.md) | iOS WebKit freeze limits, Android task switching, Battery saving throttles | 🟡 Planned |
| **Part 12** | BFCache: Advanced Eligibility, Eviction & Restoration | [12-bfcache-advanced-eligibility-eviction-restoration.md](./12-bfcache-advanced-eligibility-eviction-restoration.md) | Live document preservation, `pageshow.persisted`, `unload` blocker, Stale data reconciliation | 🟢 Complete |
| **Part 13** | End-to-End Navigation Debugging & Mastery/Crucible | [13-end-to-end-navigation-debugging-mastery.md](./13-end-to-end-navigation-debugging-mastery.md) | DevTools Back/forward cache testing, `notRestoredReasons`, Full Navigation Audit | 🟡 Upcoming |

---

## 📁 Runnable Code Examples (`examples/`)

- [`examples/12-bfcache-advanced-eligibility-eviction-restoration.js`](./examples/12-bfcache-advanced-eligibility-eviction-restoration.js): Demonstrates React mount bypassing on BFCache restore, `unload` blocker disqualification vs `pagehide` compliance, in-memory heap preservation, and a standalone BFCache lifecycle engine with selective balance revalidation.

---

## 🧭 Industry Badges & Evaluation Guide

- 🟢 **[Daily Driver]**: Core mental models used constantly in day-to-day frontend development.
- 🟡 **[Moderate]**: Intermediate patterns used for specialized SDK configuration, architecture, and code reviews.
- 🔵 **[Foundational / Engine Internals]**: Browser engine internals, memory context lifting, and Staff-level concepts.
- 🔴 **[Production-Critical]**: High-risk failure modes, memory leaks, and fatal runtime crashes.
