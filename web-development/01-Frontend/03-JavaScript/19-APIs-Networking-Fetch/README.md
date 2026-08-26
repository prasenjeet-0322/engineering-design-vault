# KPI 19 — APIs, HTTP Networking & AbortController

[⬅️ KPI 18 — Browser Storage](../18-Browser-Storage-Security/README.md) | [📚 JavaScript Index](../README.md) | [KPI 20 — Modules ESM ➡️](../20-Modules-ESM/README.md)

---

## Overview
*Status: 🟡 Ready for Master Content & Evaluation.*

---

## 🎯 Learning Objectives
- HTTP/1.1 vs HTTP/2 vs HTTP/3 fundamentals, Status Codes (2xx, 3xx, 4xx, 5xx), and Headers.
- `fetch()` API Mechanics: Why `fetch()` does NOT reject on 404 or 500 errors (`res.ok` checks).
- Request Cancellation & Timeout handling using `AbortController` and `signal`.
- Building an Enterprise API Client layer with Interceptors, Retry Logic, and Exponential Backoff.
- Handling race conditions in search-as-you-type and React `useEffect` data fetching.
