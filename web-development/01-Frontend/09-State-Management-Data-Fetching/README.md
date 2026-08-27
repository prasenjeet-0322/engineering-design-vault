# Level 09: State Management & Data Fetching Architecture

[⬅️ Level 08: Next.js & Full-Stack React](../08-Nextjs-FullStack-React/README.md) | [📚 Frontend Master Hub](../README.md) | [Level 10: Forms & Validation ➡️](../10-Forms-Validation-Complex-UI/README.md)

---

## 🎯 Overview
Architecting scalable client and server state: Global Client Stores (Zustand, Redux Toolkit), Server State Management (TanStack Query, SWR), Cache invalidation, Optimistic Mutations, and Offline persistence.

---

## 🗺️ Curriculum Topics

1. **Client State vs Server State:** Decoupling ephemeral UI state from asynchronous remote server caches.
2. **TanStack Query (React Query):** Query keys, caching lifecycle, background fetching, stale-while-revalidate, mutations, query cancellation.
3. **Zustand Architecture:** Minimalist store creation, slice pattern, selectors, middleware (persist, devtools, immer).
4. **Redux Toolkit (RTK) & RTK Query:** Normalized state, entity adapters, createAsyncThunk, listener middleware.
5. **Optimistic UI & Cache Synchronization:** Immediate optimistic updates, rollback on rejection, cache mutation helpers.
