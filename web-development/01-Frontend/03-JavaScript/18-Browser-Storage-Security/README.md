# KPI 18 — Browser Storage, Persistence & Client-Side Security

[⬅️ KPI 17 — Advanced JavaScript Patterns](../23-Advanced-Design-Patterns/README.md) | [📚 JavaScript Index](../README.md) | [KPI 19 — APIs & Networking ➡️](../19-APIs-Networking-Fetch/README.md)

---

## Overview

Browser storage bridges ephemeral in-memory runtime execution and long-term client persistence. However, storing data in the browser requires strict architectural discipline: a senior engineer must understand **where data lives, how long it survives, who can access it, and when it should never be stored in client-accessible storage at all**.

This master module provides an exhaustive, production-grade guide to `localStorage`, `sessionStorage`, `IndexedDB`, and HTTP Cookie security flags (`HttpOnly`, `Secure`, `SameSite`), JSON serialization edge cases, schema versioning and client data migrations, TTL expiration lifecycles, and Cross-Site Scripting (XSS) defense-in-depth.

---

## 🗺️ Module Architecture & Navigation

| Part | Title | Document | Key Architectural Focus | Status |
|---|---|---|---|---|
| **Master Guide** | Browser Storage, Persistence & Security Architecture | [01-browser-storage-lifecycle-security.md](./01-browser-storage-lifecycle-security.md) | `localStorage` vs `sessionStorage` vs `Cookies` vs `IndexedDB`, `HttpOnly` security flags, XSS token storage risks, Schema version migrations, TTL caching | 🟢 Complete |

---

## 📁 Runnable Code Examples (`examples/`)

- [`examples/01-browser-storage-lifecycle-security.js`](./examples/01-browser-storage-lifecycle-security.js): Demonstrates JSON serialization traps with `Date` objects and `undefined`, automated schema versioning and data migrations, and a standalone resilient storage engine with TTL expiration.

---

## 🧭 Industry Badges & Evaluation Guide

- 🟢 **[Daily Driver]**: Core mental models used constantly in day-to-day frontend development.
- 🟡 **[Moderate]**: Intermediate patterns used for specialized SDK configuration, architecture, and code reviews.
- 🔵 **[Foundational / Engine Internals]**: V8 engine internals, AST scope analysis, memory context lifting, and Staff-level concepts.
- 🔴 **[Production-Critical]**: High-risk failure modes, race conditions, memory leaks, and fatal runtime crashes.
