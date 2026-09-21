# Level 08 — Next.js & Full-Stack React

# KPI 11 — Deployment Considerations

## Part 01 — Deployment Architecture Mental Model & Runtime Topology

---

# 1. Part Objective

Modern Next.js applications are not merely:

```text
source code
    ↓
build
    ↓
static files
```

A production Next.js application may contain:

* static assets
* server-rendered pages
* Server Components
* Client Components
* Route Handlers
* Server Actions
* middleware/proxy logic
* image optimization
* metadata generation
* cached data
* dynamic rendering
* background processing
* authentication
* environment configuration
* external API dependencies
* databases
* object storage
* CDNs
* edge infrastructure

Therefore deployment is not simply:

> "Where do I upload my Next.js application?"

The senior-level question is:

> **What runtime topology does this application require, and how does each part of the application execute after deployment?**

The fundamental model is:

```text
                    ┌──────────────────┐
                    │      Browser     │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ CDN / Edge Layer │
                    └────────┬─────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
                 ▼                       ▼
        Static Representation      Dynamic Request
                 │                       │
                 │                       ▼
                 │               ┌──────────────┐
                 │               │ Server/Edge  │
                 │               │   Runtime    │
                 │               └──────┬───────┘
                 │                      │
                 │              ┌───────┼────────┐
                 │              │       │        │
                 │              ▼       ▼        ▼
                 │            API     Cache    Database
                 │
                 ▼
          Static Asset / HTML
```

Deployment architecture determines:

* where code executes
* when it executes
* what it can access
* how long it lives
* what it can cache
* how it scales
* what it costs
* how failures propagate

---

# 2. Industry Frequency & Framework Relevance

| Concept                   | Frequency                    | Senior Relevance |
| ------------------------- | ---------------------------- | ---------------- |
| Production build          | 🟢 Daily Driver              | Essential        |
| Environment configuration | 🟢 Daily Driver              | Essential        |
| Static asset deployment   | 🟢 Daily Driver              | Essential        |
| Server runtime            | 🟢 Daily Driver              | Essential        |
| CDN                       | 🟢 Daily Driver              | Essential        |
| Serverless deployment     | 🟡 Moderate                  | High             |
| Edge runtime              | 🟡 Moderate                  | High             |
| Container deployment      | 🟡 Moderate                  | High             |
| Multi-region deployment   | 🟡 Moderate                  | High             |
| Runtime isolation         | 🟡 Moderate                  | High             |
| Deployment topology       | 🔵 Foundational Architecture | Very High        |
| Immutable releases        | 🔵 Foundational Architecture | Very High        |
| Build/runtime separation  | 🔵 Foundational Architecture | Very High        |

---

# 3. The First Mental Shift

A frontend repository contains **multiple execution environments**.

Consider:

```text
Next.js application
│
├── Browser
│   ├── Client Components
│   ├── browser APIs
│   └── event handlers
│
├── Server runtime
│   ├── Server Components
│   ├── Route Handlers
│   ├── Server Actions
│   └── server-side data access
│
├── Edge/runtime-specific code
│   └── middleware/proxy-style request processing
│
└── Build environment
    ├── compilation
    ├── bundling
    ├── static generation
    └── asset processing
```

These environments are not interchangeable.

A deployment decision therefore begins with:

```text
Where does this code execute?
        ↓
What does that runtime require?
        ↓
What infrastructure provides it?
        ↓
How does that infrastructure scale?
```

---

# 4. Build Time vs Runtime

One of the most important deployment distinctions is:

```text
BUILD TIME
    ↓
compile / bundle / generate
    ↓
DEPLOYMENT ARTIFACT
    ↓
RUNTIME
    ↓
requests execute
```

These are separate phases.

## Build time

The build system may perform:

* TypeScript compilation
* JavaScript transformation
* bundling
* tree shaking
* CSS processing
* static generation
* asset optimization
* route analysis
* dependency resolution

Conceptually:

```text
Source Code
     │
     ▼
Build System
     │
     ├── JS bundles
     ├── CSS
     ├── static assets
     ├── server artifacts
     └── generated representations
             │
             ▼
        Deployment Artifact
```

## Runtime

After deployment:

```text
HTTP Request
     │
     ▼
Runtime
     │
     ├── route resolution
     ├── authentication
     ├── data access
     ├── rendering
     ├── cache interaction
     └── response
```

This distinction becomes critical when discussing:

* environment variables
* database access
* secrets
* static generation
* dynamic rendering
* caching
* scaling

---

# 5. Build Artifact vs Source Repository

A production runtime should generally execute a **deployment artifact**, not depend on the developer's source repository.

Conceptually:

```text
Git Repository
      │
      ▼
CI Build
      │
      ▼
Validated Artifact
      │
      ├──────────────┐
      ▼              ▼
Environment A    Environment B
      │              │
      ▼              ▼
Production       Staging
```

This creates an important deployment property:

> **Build once, promote the resulting artifact where practical.**

Instead of:

```text
Build for staging
       ↓
Change environment
       ↓
Build again
       ↓
Deploy production
```

you want to reduce the possibility that staging and production run materially different artifacts.

---

# 6. Static vs Dynamic Deployment

Not every part of a Next.js application requires a server request.

Think in terms of representation classes.

## Static representation

```text
Build / precompute
      ↓
Stored representation
      ↓
CDN
      ↓
Browser
```

Characteristics:

* cheap delivery
* highly cacheable
* globally distributable
* low runtime compute

## Dynamic representation

```text
Request
   ↓
Server runtime
   ↓
Data / authentication / computation
   ↓
Rendered response
```

Characteristics:

* runtime compute
* runtime dependencies
* potentially personalized
* potentially uncached or selectively cached

## Hybrid application

Modern applications frequently contain both:

```text
                    Application
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       Static          Cached        Dynamic
       content       rendering      rendering
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                       User
```

This is why deployment architecture cannot be determined merely by saying:

> "It's a Next.js app."

---

# 7. Runtime Topology

A production application may look like:

```text
                    Internet
                       │
                       ▼
                DNS / Traffic
                       │
                       ▼
                CDN / Edge
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
   Static Assets              Dynamic Requests
          │                         │
          │                         ▼
          │                  Application Runtime
          │                         │
          │            ┌────────────┼────────────┐
          │            ▼            ▼            ▼
          │         Database      APIs         Cache
          │
          ▼
       Browser
```

A senior engineer should be able to identify every box.

For each component ask:

```text
Who owns it?
Where does it run?
How does it scale?
What does it cache?
What happens when it fails?
```

---

# 8. CDN Is Not the Application Runtime

A common conceptual mistake is:

> "The app is deployed to the CDN."

A CDN can distribute content, but dynamic application execution requires some compute environment.

Conceptually:

```text
                 CDN
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
 Static content       Dynamic request
        │                   │
        ▼                   ▼
    Cache hit          Application
                            │
                            ▼
                       Data sources
```

The CDN may cache:

* static assets
* HTML
* generated responses
* images
* API responses

But whether something can be cached depends on:

```text
representation
+
request identity
+
authorization
+
personalization
+
cache policy
+
invalidation strategy
```

---

# 9. Origin Architecture

When a CDN cannot satisfy a request:

```text
Browser
   │
   ▼
CDN
   │
   │ cache miss
   ▼
Origin
   │
   ▼
Application runtime
```

The origin may be:

* a server
* a serverless function
* an edge function
* a container
* a managed application platform
* another backend service

The key concept is:

> **The origin is the source of runtime computation when the edge/cache cannot directly satisfy the request.**

---

# 10. Server Runtime Choices

A Next.js application may be deployed into different runtime models.

## Traditional server

```text
Load Balancer
      │
 ┌────┼────┐
 ▼    ▼    ▼
S1   S2   S3
```

Each server runs the application.

Advantages:

* predictable process model
* long-lived runtime
* broad Node.js capability
* connection reuse
* straightforward server architecture

Tradeoffs:

* server management
* scaling infrastructure
* patching
* capacity planning

---

## Serverless

Conceptually:

```text
Request
   │
   ▼
Function
   │
   ▼
Response
```

Scaling may be demand-driven.

Advantages:

* operational simplicity
* elastic scaling
* reduced infrastructure management

Tradeoffs:

* startup latency
* execution limits
* connection management
* concurrency behavior
* cost characteristics
* ephemeral execution assumptions

---

## Edge Runtime

Conceptually:

```text
User
 │
 ▼
Nearest Edge Location
 │
 ▼
Edge Compute
 │
 ▼
Response
```

Potential advantages:

* low network latency
* geographically distributed execution

But edge execution may impose runtime constraints.

Therefore:

```text
"Runs at the edge"
        ≠
"Better"
```

The correct question is:

> **Does this workload benefit from edge execution enough to justify its runtime constraints?**

---

# 11. Stateful vs Stateless Runtime

A deployment architecture should generally avoid assuming:

```text
Request 1
   ↓
Server memory
   ↓
Request 2
   ↓
same server memory
```

This assumption becomes dangerous in horizontally scaled or serverless environments.

Instead:

```text
Request
   │
   ▼
Any runtime instance
   │
   ▼
External durable state
```

Durable state may live in:

* databases
* distributed caches
* object storage
* external queues
* managed services

Therefore:

```text
application instance
        ≠
source of truth
```

This is one of the most important deployment principles.

---

# 12. Horizontal Scaling

Suppose traffic increases:

```text
100 requests/s
```

and one runtime instance handles:

```text
50 requests/s
```

A horizontally scalable system may move toward:

```text
                 Load Balancer
                      │
             ┌────────┼────────┐
             ▼        ▼        ▼
            S1       S2       S3
             │        │        │
             └────────┼────────┘
                      ▼
                   Database
```

The application should not depend on:

```text
"All users must reach server S1."
```

unless deliberate session affinity is part of the architecture.

---

# 13. Environment Configuration

Production deployment introduces multiple environments:

```text
Development
     ↓
Preview / Test
     ↓
Staging
     ↓
Production
```

Each may require different configuration:

```text
DATABASE_URL
API_BASE_URL
AUTH_SECRET
STORAGE_BUCKET
PUBLIC_ORIGIN
FEATURE_FLAG_CONFIG
```

The critical distinction is:

```text
configuration
     ≠
source code
```

and:

```text
public configuration
     ≠
secret configuration
```

A value exposed to browser JavaScript is not a secret.

Therefore:

```text
PUBLIC_API_URL
```

and:

```text
DATABASE_PASSWORD
```

belong to fundamentally different security categories.

---

# 14. Environment Variables and Build-Time Leakage

One dangerous mistake is assuming:

> "Environment variables are automatically private."

They are not.

If a value becomes part of a client bundle:

```text
Environment Variable
       ↓
Build
       ↓
Client JavaScript
       ↓
Browser
```

the browser can inspect it.

Therefore the senior-level question is:

> **Does this value remain server-side, or does the build expose it to the client?**

The security boundary is:

```text
                    SERVER
                       │
              ┌────────┴────────┐
              │                 │
           Secrets         Private config
              │
              ▼
        Server execution
              │
              │ controlled output
              ▼
                    CLIENT
```

Never rely on naming alone as the security model.

---

# 15. Deployment Immutability

A strong deployment architecture attempts to make releases immutable.

Conceptually:

```text
Commit A
   ↓
Artifact A
   ↓
Production

Commit B
   ↓
Artifact B
   ↓
Production
```

Instead of modifying an already-running artifact in place:

```text
Production artifact
       ↓
manually modify
       ↓
unknown state
```

Immutable releases provide:

* reproducibility
* easier rollback
* clearer debugging
* stronger auditability
* predictable deployment state

---

# 16. Rollback Architecture

Suppose:

```text
Version 101 → production
```

Then:

```text
Version 102 → production
```

and a critical bug appears.

A good deployment system can conceptually perform:

```text
Production
    │
    ▼
Version 102 ❌
    │
    ▼
Rollback
    │
    ▼
Version 101 ✅
```

But rollback is not always simply:

```text
deploy previous frontend
```

Consider:

```text
Frontend v2
      │
      ▼
Database schema v2
```

If the database changed incompatibly, rolling only the frontend backward may not restore correctness.

Therefore deployment architecture must consider:

```text
Application version
        +
API version
        +
Database schema
        +
Data migrations
        +
Cache state
```

---

# 17. Deployment and Database Compatibility

A mature deployment strategy often uses backward-compatible transitions.

For example:

```text
Old application
      │
      ▼
Schema supports old + new
      │
      ▼
Deploy new application
      │
      ▼
Migrate remaining data
      │
      ▼
Remove old schema behavior
```

This is safer than:

```text
Break database
      ↓
Deploy application
```

The frontend may not own the database, but a senior frontend engineer working in a full-stack system must understand these deployment dependencies.

---

# 18. Deployment and Caching

Deployment does not end when the new code reaches servers.

Caches may still contain:

```text
old HTML
old JS
old CSS
old images
old API responses
```

Therefore:

```text
Deployment
   ↓
Cache behavior
   ↓
Client behavior
```

must be designed together.

A particularly important relationship is:

```text
HTML
 ↓
references
 ↓
JS/CSS/assets
```

If an old HTML document references an asset that no longer exists, deployment can produce failures.

This is why hashed/static asset strategies are valuable:

```text
app.a81f3.js
app.29bc1.js
```

rather than:

```text
app.js
```

where the same URL may represent multiple releases.

---

# 19. Deployment and Static Asset Identity

A useful model is:

```text
Source asset
      ↓
Content / build transformation
      ↓
Versioned asset
      ↓
CDN
```

For example:

```text
logo.svg
```

may become:

```text
logo.83d91f.svg
```

The URL now carries an identity tied to a particular artifact.

This enables aggressive caching:

```text
Cache-Control:
    long-lived
```

because a new version receives a new URL.

The principle is:

> **Immutable identity reduces the need for destructive cache invalidation.**

---

# 20. Serverless Deployment and Connection Management

A common mistake:

```text
Every invocation
      ↓
create database connection
      ↓
query
      ↓
destroy
```

At high concurrency this can overload the database.

Conceptually:

```text
1000 concurrent requests
        ↓
1000 new DB connections
        ↓
Database saturation
```

A production architecture may require:

* connection pooling
* managed database proxies
* appropriate driver behavior
* concurrency limits
* external data services

Therefore:

```text
application scalability
        ≠
database scalability
```

Scaling the application may actually make the database failure worse.

---

# 21. Deployment Topology and Failure Domains

A senior engineer should ask:

> What happens if this component fails?

Example:

```text
Browser
   │
   ▼
CDN
   │
   ▼
Application
   │
   ├── Database
   ├── Auth provider
   ├── API
   └── Storage
```

If the database fails:

```text
Application
     │
     ▼
Database ❌
     │
     ▼
What happens?
```

Possible strategies include:

* graceful degradation
* cached reads
* static fallback
* retries
* circuit breakers
* clear error responses
* fail-fast behavior

Deployment architecture is therefore also:

> **failure architecture.**

---

# 22. Deployment Topology and Latency

Consider:

```text
User
 │
 ▼
India
 │
 ▼
US application server
 │
 ▼
US database
```

versus:

```text
User
 │
 ▼
India edge
 │
 ▼
India-region application
 │
 ▼
India-region data
```

The second may reduce network latency, but introduces additional complexity.

Therefore:

```text
lower latency
        ≠
automatically better architecture
```

You must consider:

* consistency
* replication
* operational complexity
* data residency
* cost
* failure modes

---

# 23. Build-Time Rendering vs Runtime Rendering

A crucial deployment decision:

```text
Can this representation be produced before deployment?
```

If yes:

```text
Build
 ↓
Generate
 ↓
Deploy
 ↓
Serve
```

If no:

```text
Request
 ↓
Runtime
 ↓
Fetch data
 ↓
Render
 ↓
Response
```

The more work moved to build time, the less runtime compute may be required.

But build-time generation introduces another cost:

```text
Large application
      ↓
Huge build
      ↓
Long deployment
```

Therefore:

> **Moving work from runtime to build time is a tradeoff, not a free optimization.**

---

# 24. Deployment as a Resource Allocation Problem

Every architecture allocates work across:

```text
Build
Runtime
CDN
Browser
Database
External services
```

For example:

```text
                WORK
                 │
     ┌───────────┼────────────┐
     ▼           ▼            ▼
   Build       Server       Browser
     │           │            │
 generate     fetch         hydrate
 assets       data          interact
```

A senior engineer asks:

> Where is the cheapest and safest place to perform this work?

Not:

> Can Next.js do this?

---

# 25. The Four-Pillar Engineering Decision Matrix

| Dimension                  | Key Question                        | Senior Consideration                                              |
| -------------------------- | ----------------------------------- | ----------------------------------------------------------------- |
| 🟢 When to use             | What deployment model fits?         | Match runtime to workload                                         |
| 🔴 When not to use         | What assumptions make it dangerous? | Stateful/runtime coupling, unsupported APIs, excessive complexity |
| 🟡 Bottlenecks / tradeoffs | What becomes the limiting resource? | CPU, memory, network, DB, cold starts, cache misses               |
| 🔵 Modern alternatives     | What else could solve it?           | CDN, serverless, containers, edge, managed platforms              |

---

# 26. Deployment Model Comparison

| Model                    | Strength                        | Main Tradeoff                         |
| ------------------------ | ------------------------------- | ------------------------------------- |
| Static hosting           | Extremely simple and cacheable  | Limited runtime behavior              |
| Traditional server       | Flexible runtime                | Infrastructure management             |
| Serverless               | Elastic execution               | Invocation/runtime constraints        |
| Edge                     | Low geographic latency          | Runtime/API constraints               |
| Containers               | Strong control and portability  | More operational responsibility       |
| Managed Next.js platform | Integrated framework deployment | Platform coupling/cost considerations |

There is no universally correct model.

The decision depends on:

```text
application requirements
+
runtime requirements
+
traffic
+
latency
+
data dependencies
+
security
+
team capability
+
cost
```

---

# 27. React / Next.js / TypeScript Relevance

## React

Deployment affects:

* Client Component bundles
* hydration
* code splitting
* static assets
* runtime interaction

The React component tree is not itself the deployment architecture.

---

## Next.js

Next.js introduces multiple deployment-relevant execution models:

```text
Server Components
Client Components
Route Handlers
Server Actions
Middleware / request processing
Static generation
Dynamic rendering
Caching
Image optimization
```

Therefore Next.js deployment requires understanding **where each capability executes**.

---

## TypeScript

TypeScript primarily contributes at build time:

```text
TypeScript
    ↓
type checking / transformation
    ↓
JavaScript
    ↓
runtime
```

Types generally do not exist as runtime validation.

Therefore:

```text
TypeScript type
      ≠
runtime security guarantee
```

Production systems still need runtime validation at trust boundaries.

---

# 28. Prediction Challenges

Before reading the solutions, predict what happens.

### Challenge 1

You deploy a Next.js application behind a CDN.

A page is dynamic because it depends on authenticated user data.

Should the CDN automatically cache the response?

---

### Challenge 2

A serverless application scales from:

```text
10 requests/s
```

to:

```text
10,000 requests/s
```

The application servers remain healthy, but the database collapses.

Why?

---

### Challenge 3

You deploy version 2.

Some users still receive old HTML.

Their browser requests:

```text
app.js
```

but the new deployment expects:

```text
app.v2.js
```

What deployment architecture property can prevent this class of failure?

---

### Challenge 4

You move a computation from runtime to build time.

Runtime CPU decreases.

What new bottleneck might appear?

---

### Challenge 5

You move an application from a regional server to edge execution.

Latency improves for users.

What categories of functionality should you re-evaluate?

---

# 29. Solutions

<details>
<summary>Challenge 1 — Solution</summary>

No.

Caching depends on:

* authorization
* personalization
* cache policy
* request identity
* representation identity

A response containing user-specific information must not accidentally become a shared cache representation.

</details>

<details>
<summary>Challenge 2 — Solution</summary>

Horizontal application scaling can multiply downstream pressure.

If each runtime instance creates connections or performs expensive queries:

```text
traffic ↑
instances ↑
database connections ↑
queries ↑
database saturation
```

Application scalability and dependency scalability must be designed together.

</details>

<details>
<summary>Challenge 3 — Solution</summary>

Versioned/hashed immutable asset identities.

Instead of replacing:

```text
app.js
```

with incompatible contents, releases produce distinct identities:

```text
app.v1.js
app.v2.js
```

This allows old and new HTML to coexist safely during rollout.

</details>

<details>
<summary>Challenge 4 — Solution</summary>

Build duration and build resource consumption.

You may exchange:

```text
runtime compute
```

for:

```text
build compute
```

A large application can therefore experience:

* longer builds
* higher CI cost
* deployment delays
* excessive generated output

</details>

<details>
<summary>Challenge 5 — Solution</summary>

Re-evaluate:

* Node.js API dependencies
* database connectivity
* filesystem assumptions
* long-running operations
* connection behavior
* package/runtime compatibility
* execution limits
* observability
* regional data requirements

Moving execution closer to users changes the runtime environment.

</details>

---

# 30. Senior Interview Gotchas

### Gotcha 1

> "Next.js is serverless."

Incorrect.

Next.js is a framework. Deployment architecture determines whether its server-side functionality executes through:

* traditional servers
* serverless functions
* edge runtimes
* managed infrastructure
* containers
* other supported environments

---

### Gotcha 2

> "Static means the entire application has no server."

Incorrect.

An application can contain:

```text
static pages
+
dynamic routes
+
API endpoints
+
server actions
```

simultaneously.

---

### Gotcha 3

> "Scaling the frontend means adding more application instances."

Incomplete.

You must also consider:

```text
database
cache
APIs
storage
authentication
queues
CDN
```

---

### Gotcha 4

> "Environment variables are secrets."

Incorrect.

Anything exposed to client-side code can be inspected by users.

---

### Gotcha 5

> "CDN caching solves deployment."

Incorrect.

Caching introduces:

* stale representations
* invalidation
* asset versioning
* cache-key design
* rollout concerns

---

### Gotcha 6

> "Edge is always faster."

Incorrect.

Edge reduces geographic network distance for some workloads, but runtime constraints and data dependencies can dominate total latency.

---

# 31. Production Architecture Example

Consider a SaaS dashboard:

```text
                         USERS
                           │
                           ▼
                    ┌─────────────┐
                    │ CDN / Edge  │
                    └──────┬──────┘
                           │
               ┌───────────┴───────────┐
               │                       │
               ▼                       ▼
          Static Assets          Dynamic Request
                                       │
                                       ▼
                               ┌──────────────┐
                               │ Next Runtime │
                               └──────┬───────┘
                                      │
                 ┌────────────────────┼──────────────────┐
                 │                    │                  │
                 ▼                    ▼                  ▼
              Cache                API/DB          Auth Provider
                 │                    │                  │
                 └────────────────────┼──────────────────┘
                                      │
                                      ▼
                                  Response
```

Now apply the deployment questions:

### Static assets

```text
Can they be immutable?
        ↓
Yes
        ↓
Hash/version them
        ↓
Long CDN caching
```

### Dashboard HTML

```text
Personalized?
        ↓
Yes
        ↓
Requires runtime
        ↓
Careful cache policy
```

### Database

```text
Shared durable state
        ↓
External managed resource
        ↓
Connection/scaling strategy
```

### Authentication

```text
Security boundary
        ↓
Server-side verification
        ↓
Do not trust client state alone
```

This is deployment architecture rather than simply "hosting."

---

# 32. Production Decision Framework

When deploying a Next.js application, walk through this sequence:

```text
1. What runs in the browser?
            ↓
2. What runs at build time?
            ↓
3. What runs at request time?
            ↓
4. What can be static?
            ↓
5. What must be dynamic?
            ↓
6. What can be cached?
            ↓
7. Where is durable state?
            ↓
8. What runtime APIs are required?
            ↓
9. How does the application scale?
            ↓
10. What happens when dependencies fail?
            ↓
11. How are releases versioned?
            ↓
12. How is rollback performed?
```

This sequence is more valuable than memorizing deployment-provider settings.

---

# 33. Core Invariants

Remember these:

```text
build time ≠ runtime

source repository ≠ deployment artifact

static representation ≠ dynamic representation

application scaling ≠ dependency scaling

CDN ≠ application runtime

configuration ≠ secret

client-visible configuration ≠ private configuration

deployment ≠ only code transfer

rollback ≠ only frontend rollback

edge execution ≠ automatically better

serverless scaling ≠ unlimited dependency capacity
```

---

# 34. 30-Second Executive Cheat Sheet

```text
Next.js deployment is a runtime-topology problem.

First identify:

WHERE does each piece execute?
WHEN does it execute?
WHAT does it depend on?
WHAT can be cached?
HOW does it scale?
WHAT happens when it fails?

Build:

Source
  ↓
Build
  ↓
Artifact
  ↓
Deployment

Runtime:

Request
  ↓
CDN / Edge
  ↓
Static OR Dynamic
  ↓
Application Runtime
  ↓
Cache / APIs / Database
  ↓
Response

Senior engineers optimize the topology,
not merely the deployment command.
```

---

# 35. Part Boundary

This Part established the **deployment mental model and runtime topology**.

It intentionally did **not** deeply cover:

* specific hosting-provider configuration
* CI/CD pipelines
* deployment automation
* Docker/container implementation
* deployment strategies
* blue-green deployments
* canary releases
* preview environments
* infrastructure-as-code
* production observability

Those belong to later deployment-focused parts.

The next part should therefore move from:

```text
"What executes where?"
```

to:

```text
"How does a Next.js application become a production deployment artifact?"
```

That means the next architectural layer is **Next.js Build Output, Bundling & Deployment Artifacts**.
