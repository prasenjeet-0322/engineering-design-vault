# KPI 16 — Browser APIs, Web Platform & Client-Side Capabilities

[⬅️ KPI 15/10 — Error Handling & Debugging](../10-Error-Handling-Debugging/README.md) | [📚 JavaScript Index](../README.md) | [KPI 17 — Forms & Validation ➡️](../17-Forms-Validation/README.md)

---

## Overview

JavaScript as a core language specification (ECMAScript) provides syntax, objects, and asynchronous primitives, but lacks native I/O, rendering, and networking capabilities. The **Browser Web Platform** bridges this boundary by injecting powerful host APIs (`window`, `document`, `fetch`, `localStorage`, `sessionStorage`, `Cookies`, `IndexedDB`, `WebSocket`, `history`, `navigator`). A senior frontend engineer must master the execution mechanics of Web APIs, manage client-side storage hierarchies and XSS/CSRF security, structure URLs as reactive application state, control navigation history stacks, and safely interact with device hardware APIs.

This master module provides an exhaustive, production-grade guide to Web Platform host environments, event delegation patterns, storage selection models, Fetch API stream semantics, History & `URLSearchParams` routing, device hardware capabilities, and client-side security architecture.

---

## 🗺️ Module Architecture & Navigation

| Part | Title | Document | Key Architectural Focus | Status |
|---|---|---|---|---|
| **Part 1** | The Browser as a Platform, Web APIs & Page Lifecycle | [01-browser-platform-web-apis-lifecycle.md](./01-browser-platform-web-apis-lifecycle.md) | JS vs Web APIs, `globalThis`/`window`, event delegation, recursive polling, debounce/throttle, Page Visibility API | 🟢 Complete |
| **Part 2** | Storage, Networking, Navigation, URLs & Device APIs | [02-storage-networking-navigation-device-apis.md](./02-storage-networking-navigation-device-apis.md) | `localStorage` vs `Cookies` (XSS/CSRF), `IndexedDB`, `URLSearchParams` as state, `pushState`/`replaceState`, Device APIs | 🟢 Complete |
| **Part 3** | Web Workers, Service Workers, WebSockets & Security | [03-web-workers-service-workers-websockets.md](./03-web-workers-service-workers-websockets.md) | Multi-threading with Web Workers, Service Workers & Offline PWAs, WebSockets, CSP & Sandboxing | 🟡 Upcoming |

---

## 📁 Runnable Code Examples (`examples/`)

- [`examples/01-browser-platform-web-apis-lifecycle.js`](./examples/01-browser-platform-web-apis-lifecycle.js): Demonstrates `setInterval` async overlap concurrency bugs vs guaranteed sequential recursive `setTimeout`, debounce trailing-edge execution, throttle rate-limiting, and an adaptive polling engine respecting tab visibility states.
- [`examples/02-storage-networking-navigation-device-apis.js`](./examples/02-storage-networking-navigation-device-apis.js): Demonstrates safe client-side storage with corrupt JSON fallback resilience, URL search parameter query serialization, and a standalone URL state synchronizer engine.

---

## 🧭 Industry Badges & Evaluation Guide

- 🟢 **[Daily Driver]**: Core mental models used constantly in day-to-day frontend development.
- 🟡 **[Moderate]**: Intermediate patterns used for specialized SDK configuration, architecture, and code reviews.
- 🔵 **[Foundational / Engine Internals]**: V8 engine internals, AST scope analysis, memory context lifting, and Staff-level concepts.
- 🔴 **[Production-Critical]**: High-risk failure modes, race conditions, memory leaks, and fatal runtime crashes.
