# KPI 01: Next.js Mental Model & Application Architecture

## Part 01 — What Next.js Actually Adds to React

To master Next.js, you must first unlearn the assumption that React is an application architecture. It is not. React is a rendering primitive and a state-synchronization library. Next.js is the **application framework** that surrounds that primitive.

This part defines exactly what Next.js adds to React, transitioning you from a client-side component author to a full-stack application architect.

---

### 1. React Library vs Application Framework

**React is unopinionated.** 
When building a Single Page Application (SPA) with Create React App or Vite, React knows nothing about URLs, network requests, databases, caching, or servers. It only knows how to take data (props/state) and map it to a UI tree (DOM). It forces the engineer to string together third-party libraries to simulate an application.

**Next.js is highly opinionated.**
Next.js provides the missing architectural layers required for production systems. It establishes rigid, built-in conventions for routing, server execution, caching, and mutations. It does not just render your components; it orchestrates the entire request-response lifecycle, dictating *where* and *when* your React code executes.

### 2. Routing as an Architectural Construct

In a pure React SPA, routing (e.g., React Router) is a client-side illusion. The browser loads one massive JavaScript bundle, boots the React runtime, and JavaScript intercepts URL changes to swap out components in memory.

**What Next.js adds:** Filesystem-based Routing (the App Router).
Routing in Next.js is no longer just memory mapping; it is the backbone of the architecture. The folder structure determines:
*   **Execution boundaries:** Which code runs on the server vs. the client.
*   **Rendering strategies:** Which routes are static vs. dynamic.
*   **Data fetching:** Where data dependencies are resolved.
*   **Layout persistence:** Which parts of the UI remain mounted across navigations.

### 3. Server Execution (The Expansion of React)

Historically, a React developer's mental model stopped at the browser. Code executed on the user's device.

**What Next.js adds:** A Server Runtime for React.
Next.js integrates **React Server Components (RSC)**. Your React components can now execute exclusively on a Node.js or Edge server. This completely shifts the architectural paradigm:
*   You can write components that have direct access to a database or internal microservices.
*   The code for these components is **never sent to the browser**.
*   Sensitive secrets (API keys) can be used directly inside component logic without exposing them to the client.

### 4. Rendering as a Multidimensional Decision

Pure React implies one rendering strategy: **Client-Side Rendering (CSR)**. The browser downloads a blank HTML page, downloads JavaScript, executes it, and renders the UI. This is highly susceptible to network latency and poor device performance.

**What Next.js adds:** A spectrum of rendering strategies orchestrated per-route.
*   **Pre-rendering (Static):** HTML is generated at build time and served from a CDN.
*   **Dynamic Rendering:** HTML is generated on the server at request time, customized for the user.
*   **Streaming:** The server generates HTML sequentially, sending chunks to the browser via HTTP chunked transfer encoding as data becomes ready, avoiding waterfalls and preventing slow queries from blocking the entire page.

### 5. Data Access

In a standard React SPA, data fetching happens via `useEffect` or libraries like React Query *after* the component mounts in the browser. This results in the classic "waterfall": load JS -> boot React -> render skeleton -> fetch data -> render real UI.

**What Next.js adds:** Server-centric data access.
Because components execute on the server, data fetching is shifted to the backend. You can fetch data synchronously (conceptually, via `await`) before any UI is sent to the client. This eliminates client-side waterfalls, reduces the amount of JavaScript sent to the browser, and utilizes the server's low-latency connection to databases.

### 6. Caching as a Core Primitive

In React, caching usually means storing data in memory (Redux/Context) or `localStorage`.

**What Next.js adds:** A highly aggressive, multi-tiered caching architecture by default.
Next.js forces you to reason about cache invalidation at every layer:
1.  **Request Memoization:** Prevents duplicate `fetch` calls during a single server render pass.
2.  **Data Cache:** Persists fetched data across multiple requests and deployments.
3.  **Full Route Cache:** Stores statically rendered HTML and RSC payloads at the edge.
4.  **Router Cache:** Caches navigated route segments in the browser's memory to make subsequent navigations instant.

### 7. Mutations (Server Actions)

To mutate data in a traditional React app, you attach an `onClick` handler, fire a `fetch` or `axios` POST request to a separate API endpoint, wait for the response, and manually update your client-side state.

**What Next.js adds:** Server Actions.
Next.js allows you to define asynchronous functions that run securely on the server, but can be invoked directly from your client-side forms or buttons. Next.js handles the network serialization, the HTTP request, and the integration with the caching layer, automatically revalidating the UI when the mutation succeeds.

### 8. Deployment and Infrastructure Orchestration

React outputs a folder of static files (`index.html`, `.js`, `.css`). You can drop these on an S3 bucket or any static host.

**What Next.js adds:** A complex runtime artifact.
Next.js outputs a deployment architecture. It produces static files, but it also produces serverless functions (for dynamic routes and API handlers), edge middleware (for request interception), and image optimization pipelines. Next.js natively understands the difference between the **Build Environment**, the **Server Runtime**, and the **Browser Runtime**.

---

### The Governing Question

As you proceed through Level 08, every piece of code you write will force you to answer the governing question:

> **Where did this work actually happen?**

You are no longer just writing React. You are orchestrating the network. For every component, function, and fetch, you must now determine:
1. Where does it execute?
2. What crosses the network boundary?
3. What reaches the browser?
4. What is cached, and what invalidates it?
