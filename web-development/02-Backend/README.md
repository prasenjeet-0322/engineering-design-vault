# ⚙️ 02 - Backend Engineering

Welcome to the Backend Engineering module. This section bridges the gap between client requests and data persistence, focusing on scalability, security, and API design.

## 📂 Structure

- **Node.js / Servers:** Event-driven architecture, threading, and handling high-concurrency connections.
- **API Design:** Designing RESTful endpoints, GraphQL schemas, gRPC buffers, and WebSocket connections.
- **Databases:** Relational (SQL) vs Document (NoSQL), normalization vs denormalization, and ORM abstractions.
- **Caching & Performance:** Memory stores (Redis), query optimization, and avoiding N+1 problems.
- **Security:** Implementing secure Auth (JWT vs Sessions), CORS policies, CSRF mitigation, and rate limiting.

## 🧠 Approach

Backend engineering is about constraints. Every decision involves tradeoffs between latency, throughput, consistency, and storage.

When studying these modules, focus heavily on:
1. **The Network:** Assume the network is hostile and unreliable. How does this API handle timeouts or retries?
2. **Data Consistency:** If this server crashes mid-request, what happens to the database state?
3. **Scalability:** Will this endpoint survive 10,000 concurrent requests? What breaks first: CPU, memory, or the database connection pool?
