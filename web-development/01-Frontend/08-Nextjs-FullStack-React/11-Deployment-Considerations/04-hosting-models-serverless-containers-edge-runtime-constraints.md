# Level 08 — Next.js & Full-Stack React

## KPI 11 — Deployment Considerations

# Part 04 — Hosting Models, Serverless, Containers, Edge Runtime & Runtime Constraints

---

## 1. Part Objective

Deployment architecture is not simply:

```text
build
→
upload
→
run
```

The hosting model determines the runtime characteristics of the application.

A Next.js application may run through:

* a traditional Node.js server
* a container
* a serverless function platform
* an edge runtime
* a hybrid deployment
* a managed platform combining several of these

The important engineering question is:

> **What runtime model executes each part of the application, what constraints does that runtime impose, and how does the application architecture adapt to those constraints?**

The central model for this part is:

```text
Application Workload
        ↓
Runtime Requirements
        ↓
Hosting Model
        ↓
Runtime Constraints
        ↓
Application Architecture
```

---

# 2. Hosting Is an Architectural Decision

A hosting platform is not merely infrastructure.

It determines characteristics such as:

```text
startup behavior
execution lifetime
memory
CPU
network access
filesystem behavior
scaling model
concurrency
geographic placement
connection management
deployment model
observability
```

Therefore:

```text
hosting decision
→
runtime behavior
→
application architecture
```

---

# 3. The Major Hosting Models

A simplified model is:

```text
Traditional Server
       │
       ├── persistent process
       ├── long-lived runtime
       └── application-controlled lifecycle

Container
       │
       ├── packaged runtime
       ├── controlled process
       └── orchestrated lifecycle

Serverless
       │
       ├── demand-driven execution
       ├── platform-managed scaling
       └── potentially short-lived instances

Edge Runtime
       │
       ├── geographically distributed execution
       ├── constrained runtime APIs
       └── latency-oriented placement
```

These are not merely deployment packaging differences.

They represent different execution models.

---

# 4. Traditional Node.js Server

A traditional deployment may look like:

```text
Load Balancer
      ↓
Node.js Process
      ↓
Next.js Application
      ↓
Database / APIs
```

The process remains alive and handles many requests.

Characteristics commonly include:

```text
long-lived process
persistent memory
connection reuse
process-level initialization
custom networking
custom lifecycle management
```

This model provides substantial runtime control.

---

# 5. Containerized Deployment

A container packages the application and runtime environment.

Conceptually:

```text
Source
 ↓
Build
 ↓
Application Artifact
 ↓
Container Image
 ↓
Container Runtime
 ↓
Next.js Server
```

The container itself becomes a deployment artifact.

For example:

```text
Docker Image
      ↓
Container
      ↓
Node.js
      ↓
Next.js
```

The important property is reproducibility.

The same container image can move through:

```text
staging
→
production
```

without rebuilding the application.

---

# 6. Container Does Not Mean Server

A container is a packaging and isolation mechanism.

It does not inherently determine:

```text
scaling
networking
availability
load balancing
deployment
```

Those responsibilities may belong to:

```text
Kubernetes
container service
VM platform
managed orchestration
cloud platform
```

Therefore:

```text
container
≠
complete deployment architecture.
```

---

# 7. Serverless Architecture

A serverless model typically looks like:

```text
Request
   ↓
Platform Router
   ↓
Function Instance
   ↓
Application Logic
   ↓
Response
```

The platform manages much of:

```text
instance creation
scaling
routing
capacity
infrastructure lifecycle
```

The application developer instead needs to reason carefully about:

```text
cold starts
execution limits
memory
concurrency
statelessness
connection reuse
deployment packaging
```

---

# 8. Serverless Does Not Mean “No Server”

The server still exists.

The distinction is:

```text
traditional hosting
→
developer/operator manages more runtime infrastructure

serverless
→
platform manages more runtime infrastructure.
```

The architectural consequence is a shift in operational responsibility.

---

# 9. Serverless Invocation Model

A simplified lifecycle is:

```text
Request
  ↓
Instance available?
  ├── yes → execute
  └── no  → initialize
               ↓
            execute
               ↓
            response
```

The initialization path can add latency.

This is commonly called a:

```text
cold start
```

The application should therefore avoid unnecessary startup work.

---

# 10. Cold Start Architecture

Startup work might include:

```text
module loading
configuration parsing
SDK initialization
connection setup
large dependency loading
cryptographic initialization
```

If this happens before the first request:

```text
cold start latency
↑
```

Therefore the application should distinguish:

### Required initialization

```text
must happen before serving
```

from:

### Deferred initialization

```text
can happen after or only when needed
```

---

# 11. Persistent Instances Are Possible

Serverless should not be modeled as:

```text
every request
=
new process.
```

An instance may remain available for multiple requests.

Therefore:

```text
module scope
```

or:

```text
process memory
```

may sometimes persist between invocations.

But persistence is not guaranteed.

This leads to an important invariant:

> **Process reuse may improve performance, but correctness must not depend on it.**

---

# 12. Statelessness

For horizontally scalable applications:

```text
Request A
    ↓
Instance 1

Request B
    ↓
Instance 2
```

The application cannot assume that instance 2 knows the in-memory state created by instance 1.

Therefore durable state belongs in appropriate external systems:

```text
Database
Cache
Object Storage
Queue
External State Service
```

rather than process memory.

---

# 13. In-Memory State

In-memory state can still be useful for:

```text
memoization
connection reuse
configuration
short-lived caches
performance optimization
```

But it should not become the source of truth for durable application state.

Bad architecture:

```text
Instance A
 └── user session state

Instance B
 └── no session state
```

Better:

```text
Instance A ─┐
            ├── Shared Durable State
Instance B ─┘
```

---

# 14. Connection Management

Serverless creates a particular challenge for databases.

Suppose:

```text
100 concurrent invocations
```

each opens:

```text
10 database connections.
```

The theoretical pressure becomes:

```text
1000 connections
```

even though the application may have expected only a small number of servers.

Therefore connection architecture must account for:

```text
instance count
concurrency
connection reuse
pooling
database limits
proxying
```

---

# 15. Connection Reuse

Where the runtime permits it, clients may be initialized outside request handlers.

Conceptually:

```text
Module Scope
   ↓
Reusable Client
   ↓
Requests
```

This can reduce repeated setup.

But the architecture must remain valid if the runtime destroys the instance.

Therefore:

```text
reuse
=
optimization

not

correctness requirement.
```

---

# 16. Serverless Concurrency

A serverless platform may execute multiple requests using:

```text
multiple instances
```

or:

```text
multiple concurrent executions
```

depending on the platform.

This means application code should not assume:

```text
one process
=
one request
```

or:

```text
one process
=
one user.
```

Concurrency assumptions must be explicit.

---

# 17. Execution Time Limits

Serverless environments commonly impose execution constraints.

A request may have a bounded execution window:

```text
Request
 ↓
Function
 ↓
Timeout
```

This changes architecture.

A long-running operation should often become:

```text
Request
 ↓
Queue Job
 ↓
Worker
 ↓
Completion
```

instead of:

```text
HTTP Request
 ↓
10-minute computation
```

---

# 18. Synchronous vs Asynchronous Work

Use synchronous execution for work where the user needs the immediate result.

Examples:

```text
authentication check
small database read
small mutation
page rendering
```

Use asynchronous processing for:

```text
large image processing
video processing
bulk exports
email campaigns
large data imports
```

The architecture becomes:

```text
User Request
    ↓
Accept Job
    ↓
Queue
    ↓
Worker
    ↓
Persistent Result
```

---

# 19. Filesystem Constraints

A common deployment mistake is assuming:

```text
local filesystem
=
durable storage.
```

In serverless/container environments, local filesystem behavior may be:

```text
ephemeral
instance-local
non-shared
temporary
```

Therefore user uploads should generally use:

```text
Object Storage
```

rather than relying on local application disk.

---

# 20. Container Filesystem

A container filesystem is also generally tied to the container lifecycle unless persistent storage is explicitly attached.

Therefore:

```text
container restart
```

may result in loss of local changes.

This is desirable for immutable application deployment.

Application state should instead live outside the container.

---

# 21. Immutable Infrastructure

A production deployment should ideally treat application artifacts as immutable.

Instead of:

```text
running container
 ↓
modify files
 ↓
restart
```

prefer:

```text
Source
 ↓
Build
 ↓
Artifact
 ↓
Deploy new artifact
 ↓
Remove old artifact
```

This improves:

```text
reproducibility
rollback
debugging
auditability
```

---

# 22. Edge Runtime

Edge execution moves request processing closer to users.

Conceptually:

```text
User in India
     ↓
India/Asia Edge
     ↓
Edge Application
```

rather than:

```text
User in India
     ↓
US Origin
     ↓
Application
```

This can reduce network latency for appropriate workloads.

But geographic proximity does not automatically make the entire request fast.

---

# 23. Edge Is Not Free Global Compute

An edge runtime still has constraints.

The application must consider:

```text
runtime APIs
CPU limits
memory
execution time
available libraries
network behavior
database latency
observability
```

An edge function may be geographically close to the user but still call:

```text
database in another continent.
```

The request can therefore remain latency-bound.

---

# 24. Edge + Central Database

Consider:

```text
User
 ↓
Tokyo Edge
 ↓
Application
 ↓
US Database
```

The edge execution may be fast.

But:

```text
Tokyo → US
```

may dominate request latency.

Therefore:

```text
edge placement
```

must be evaluated together with:

```text
data placement.
```

---

# 25. Runtime Compatibility

Not every Node.js library is suitable for every runtime.

A package may depend on:

```text
Node filesystem APIs
TCP sockets
native modules
child processes
specific Node globals
```

An edge runtime may not provide those capabilities.

Therefore runtime selection must happen before blindly choosing dependencies.

---

# 26. Dependency Compatibility Matrix

For a runtime-sensitive application, think in terms of:

| Capability             | Node.js Server     | Serverless          | Edge                |
| ---------------------- | ------------------ | ------------------- | ------------------- |
| Node APIs              | Broad              | Usually broad       | Restricted          |
| Long-lived process     | Yes                | Not guaranteed      | Not guaranteed      |
| Persistent local state | Instance-local     | Instance-local      | Instance-local      |
| Native modules         | Usually            | Platform-dependent  | Often restricted    |
| Long CPU work          | Possible           | Usually constrained | Highly constrained  |
| Geographic execution   | Deployment-defined | Platform-defined    | Core characteristic |
| Custom networking      | Broad              | Platform-dependent  | Restricted          |
| Durable state          | External           | External            | External            |

The exact limits depend on the hosting platform.

The architectural lesson is more important than any single platform number.

---

# 27. Runtime Selection

Choose runtime based on workload.

For example:

### Traditional Node / Container

Useful when requiring:

```text
longer execution
Node compatibility
custom networking
persistent process behavior
complex backend dependencies
```

### Serverless

Useful when requiring:

```text
demand-driven scaling
low infrastructure management
bursty workloads
request-oriented compute
```

### Edge

Useful when requiring:

```text
low geographic latency
request interception
lightweight computation
globally distributed logic
```

These are workload characteristics, not universal rules.

---

# 28. Hybrid Architecture

Real systems often combine runtime models.

For example:

```text
                     CDN
                      │
             ┌────────┴────────┐
             ↓                 ↓
           Edge             Origin
             │                 │
       Lightweight         Node.js
        Routing             Server
             │                 │
             └────────┬────────┘
                      ↓
                 Data Services
```

Different workloads can execute in different environments.

---

# 29. Next.js Runtime Boundaries

A Next.js application may contain:

```text
Server Components
Route Handlers
Server Actions
Middleware
Client Components
```

These do not necessarily execute in the same runtime.

Therefore deployment reasoning should ask:

```text
Where does this code execute?
```

before asking:

```text
How should this code be optimized?
```

---

# 30. Runtime Selection Per Workload

For example:

```text
Middleware
    ↓
Edge-compatible logic

Route Handler
    ↓
Node.js

Server Component
    ↓
Server runtime

Client Component
    ↓
Browser
```

The exact configuration depends on the deployment architecture.

The important point is:

> **Runtime boundaries are architectural boundaries.**

---

# 31. Environment Variables

Runtime choice also affects configuration.

There is a distinction between:

```text
build-time configuration
```

and:

```text
runtime configuration.
```

A value embedded into a client bundle becomes part of the delivered application.

Therefore:

```text
secret
≠
public environment variable.
```

Secrets must remain server-side.

---

# 32. Runtime Configuration and Immutable Artifacts

A strong deployment model is:

```text
Build once
     ↓
Immutable artifact
     ↓
Promote across environments
```

with environment-specific configuration supplied at runtime where supported.

This reduces:

```text
environment drift
```

and prevents:

```text
staging build
≠
production build.
```

---

# 33. Scaling Models

Different hosting models scale differently.

### Traditional server

```text
1 process
→
increase machine size
```

or:

```text
many processes
→
load balancer
```

### Container

```text
Container
→
replicas
→
orchestrator
```

### Serverless

```text
Requests
→
platform-managed instances
```

### Edge

```text
Requests
→
distributed regional execution
```

Each introduces different capacity and failure behavior.

---

# 34. Horizontal Scaling

For web applications:

```text
Load Balancer
 ├── Instance A
 ├── Instance B
 ├── Instance C
 └── Instance D
```

is usually easier to scale than one enormous process.

But horizontal scaling requires:

```text
stateless request handling
+
externalized durable state
+
shared cache/state architecture
```

---

# 35. Vertical Scaling

Vertical scaling means increasing resources for one instance:

```text
2 CPU
→
8 CPU
```

or:

```text
4 GB RAM
→
32 GB RAM
```

It can be useful for workloads that cannot easily scale horizontally.

But it introduces:

```text
larger failure domain
+
higher per-instance cost
+
eventual capacity ceiling.
```

---

# 36. Scaling Is Not the Same as Capacity

Suppose application servers scale from:

```text
10
→
100
```

but the database allows only:

```text
500 connections.
```

If each server opens:

```text
20 connections
```

the database can become saturated.

Therefore system capacity is constrained by the weakest relevant dependency.

A useful model is:

```text
Application Capacity
=
min(
  compute capacity,
  database capacity,
  cache capacity,
  network capacity,
  dependency capacity
)
```

---

# 37. Failure Domains

Hosting architecture defines failure domains.

For example:

```text
One Process
```

has a small deployment unit but potentially large process-level impact.

A distributed deployment might look like:

```text
Region A
 ├── Instance 1
 ├── Instance 2

Region B
 ├── Instance 3
 └── Instance 4
```

Now failures can be isolated by:

```text
instance
zone
region
dependency
```

depending on architecture.

---

# 38. Deployment Blast Radius

A deployment to:

```text
100% traffic
```

has a larger blast radius than:

```text
5% canary
```

Runtime architecture therefore connects directly to deployment strategy.

A robust system can combine:

```text
container
+
multiple replicas
+
canary
+
automated health checks
+
rollback
```

---

# 39. Runtime Lifecycle

Every runtime has a lifecycle.

Conceptually:

```text
STARTING
   ↓
INITIALIZING
   ↓
READY
   ↓
SERVING
   ↓
DRAINING
   ↓
SHUTDOWN
```

The hosting model determines how much control the application has over these transitions.

This becomes particularly important during:

```text
deployment
scaling
restart
failure
```

---

# 40. Health Checks

A deployment system needs to know:

```text
Is the process alive?
```

and:

```text
Can it actually serve traffic?
```

These are different questions.

### Liveness

```text
process is functioning
```

### Readiness

```text
instance can safely receive traffic
```

A server can be alive but not ready.

---

# 41. Startup Dependencies

Suppose startup requires:

```text
database
configuration service
secret manager
```

If startup blocks on all three, one unavailable dependency may prevent the entire application from becoming ready.

A more deliberate architecture classifies dependencies:

```text
Critical
Non-critical
Deferred
```

and establishes startup budgets.

---

# 42. Graceful Shutdown

During deployment:

```text
Old Instance
     ↓
Stop accepting new requests
     ↓
Finish active requests
     ↓
Close resources
     ↓
Exit
```

This is preferable to:

```text
kill process
```

because active requests may otherwise fail.

---

# 43. Long-Lived Work During Shutdown

Consider:

```text
request
 ↓
large operation
```

If the instance receives shutdown:

```text
shutdown signal
 ↓
request interrupted
```

The operation may partially complete.

Therefore long-running work should often use:

```text
durable queue
+
idempotent worker
```

rather than depending on HTTP request lifetime.

---

# 44. Runtime-Specific Anti-Patterns

### Anti-pattern 1 — Durable state in memory

```text
instance memory
=
database.
```

Incorrect.

### Anti-pattern 2 — Local filesystem as permanent storage

```text
container disk
=
object storage.
```

Incorrect.

### Anti-pattern 3 — Assuming warm serverless instances

```text
warm instance
=
guaranteed.
```

Incorrect.

### Anti-pattern 4 — Using edge for incompatible workloads

```text
edge
=
all backend workloads.
```

Incorrect.

### Anti-pattern 5 — Scaling application without scaling dependencies

```text
more servers
=
more system capacity.
```

Not necessarily.

---

# 45. Production Failure Scenario — Serverless Database Exhaustion

System:

```text
Serverless API
+
PostgreSQL
```

Traffic increases.

The platform creates many concurrent instances.

Each creates a database connection pool.

Eventually:

```text
database connections
↑↑↑
```

and requests begin failing.

The senior diagnosis is:

```text
serverless concurrency
→
connection multiplication
→
database saturation.
```

Potential architectural responses include:

```text
connection pooling/proxy
+
smaller per-instance pools
+
query optimization
+
capacity controls
+
backpressure
```

---

# 46. Production Failure Scenario — Edge Doesn't Improve Latency

Architecture:

```text
User
 ↓
Edge
 ↓
Central Database
```

The edge function executes in 5 ms.

But the database call takes 180 ms.

Total latency remains dominated by data access.

Lesson:

> **Compute proximity cannot compensate for data-path distance.**

---

# 47. Production Failure Scenario — Container Works Locally

Developer environment:

```text
Mac
 ↓
Docker
 ↓
Next.js
```

Production:

```text
Container
 ↓
Restricted network
 ↓
Database
```

Application fails because it depended on:

```text
localhost
```

or an environment-specific network assumption.

Therefore deployment validation must test:

```text
actual runtime topology
```

not merely:

```text
application starts.
```

---

# 48. Production Failure Scenario — Native Dependency

Application works in Node.js.

Team switches a workload to edge runtime.

A package requires:

```text
native Node API
```

The deployment fails.

Correct reasoning:

```text
runtime selection
→
dependency compatibility
```

must be evaluated before migration.

---

# 49. Production Failure Scenario — Local File Upload

Application writes:

```text
/uploads/avatar.png
```

to the container filesystem.

The container restarts.

The file disappears.

Correct architecture:

```text
Browser
 ↓
Upload
 ↓
Object Storage
 ↓
Persistent Asset Identity
```

The application server should not be the durable storage layer unless explicitly designed as such.

---

# 50. Runtime Selection Decision Framework

Before choosing a runtime, ask:

### 1. Execution

```text
How long can the work run?
```

### 2. APIs

```text
Which runtime APIs are required?
```

### 3. State

```text
What state must survive execution?
```

### 4. Networking

```text
What network access is required?
```

### 5. Scaling

```text
How does concurrency grow?
```

### 6. Data

```text
Where is the database?
```

### 7. Geography

```text
Where are users?
```

### 8. Dependencies

```text
Which libraries are runtime-compatible?
```

### 9. Operations

```text
How are health, logs and traces collected?
```

### 10. Cost

```text
What is the workload shape?
```

---

# 51. Runtime Decision Matrix

| Requirement                  |           Traditional Node |       Container |         Serverless |              Edge |
| ---------------------------- | -------------------------: | --------------: | -----------------: | ----------------: |
| Long-running work            |                 Strong fit |      Strong fit |  Often constrained |  Usually poor fit |
| Full Node compatibility      |                     Strong |          Strong | Platform-dependent |           Limited |
| Custom runtime control       |                     Strong |          Strong |              Lower |             Lower |
| Automatic scaling            |            Manual/platform |    Orchestrator |             Strong |            Strong |
| Global execution             |                     Manual |          Manual | Platform-dependent |            Strong |
| Bursty traffic               | Requires capacity planning |     Autoscaling |         Strong fit |        Strong fit |
| Durable local state          |            Not recommended | Not recommended |    Not recommended |   Not recommended |
| Low operational overhead     |                      Lower |          Medium |               High |              High |
| Complex backend dependencies |                     Strong |          Strong | Platform-dependent | Often constrained |

The exact characteristics vary by provider.

The matrix is a reasoning tool rather than a universal platform specification.

---

# 52. Four-Pillar Engineering Matrix

| Pillar       | Part 04 Focus                      | Senior Question                                     |
| ------------ | ---------------------------------- | --------------------------------------------------- |
| Mental Model | Runtime and hosting models         | What actually executes this code?                   |
| Mechanics    | Lifecycle, scaling and constraints | What happens during invocation and shutdown?        |
| Architecture | Runtime selection                  | Which workloads belong in which runtime?            |
| Operations   | Capacity and failure behavior      | How does the system behave under scale and failure? |

---

# 53. Prediction Challenges

You should be able to predict the outcome of each scenario before changing the system.

### Challenge 1

A serverless API suddenly receives 10× traffic.

Each invocation creates a database connection.

What becomes the likely bottleneck?

---

### Challenge 2

A request moves from a central Node.js server to an edge runtime.

The database remains in the same central region.

What latency improvement should you expect for database-heavy requests?

---

### Challenge 3

A container restarts.

A user-uploaded file existed only on local disk.

What happens?

---

### Challenge 4

A Server Component imports a package using a Node-specific API, but the component is moved into an edge-compatible execution path.

What should you investigate?

---

### Challenge 5

A serverless instance remains warm for 30 minutes.

Can application correctness depend on memory surviving for the next request?

---

### Challenge 6

Application servers scale from 20 to 200 instances while database capacity remains fixed.

Which dependency should you investigate before assuming the system has gained 10× capacity?

---

# 54. Senior Interview Questions

You should be able to answer these without memorized definitions.

### Question 1

Why does serverless architecture make database connection management more important?

### Question 2

Why should application correctness not depend on warm serverless instances?

### Question 3

What is the difference between a container and a hosting platform?

### Question 4

When does an edge runtime actually improve application latency?

### Question 5

Why can moving computation to the edge fail to improve a database-heavy request?

### Question 6

Why should durable application state not live on the local filesystem?

### Question 7

How does runtime selection affect dependency selection?

### Question 8

Why is horizontal scaling insufficient if a downstream dependency cannot scale?

### Question 9

What does graceful shutdown protect?

### Question 10

How would you decide between Node.js, serverless and edge execution for a Next.js workload?

---

# 55. Architecture Exercise

Design the following system:

```text
Global SaaS Application
│
├── Marketing pages
├── Authenticated dashboard
├── API
├── File uploads
├── Background jobs
└── Database
```

Requirements:

```text
global users
bursty traffic
private user data
large uploads
background processing
low-latency public pages
```

A reasonable architecture should explicitly decide:

```text
Which runtime serves marketing pages?
Which runtime serves dashboard requests?
Where do APIs execute?
Where are uploads stored?
Where do background jobs run?
Where does durable state live?
Where is the database?
Where does caching occur?
How does the system scale?
```

Do not simply answer:

```text
"use serverless."
```

The senior-level answer assigns each workload to an appropriate execution model.

---

# 56. Reference Architecture

A generalized architecture could be:

```text
                         USERS
                           │
                           ↓
                         CDN
                           │
             ┌─────────────┴─────────────┐
             ↓                           ↓
        Edge Layer                  Application
             │                           │
       lightweight                 Node / Serverless
        routing                       Runtime
             │                           │
             │                 ┌─────────┼─────────┐
             │                 ↓         ↓         ↓
             │                DB       Cache     APIs
             │
             └────────────────────────────────────┐
                                                  │
                                                  ↓
                                             Object Storage
                                                  │
                                                  ↓
                                                Queue
                                                  │
                                                  ↓
                                               Workers
```

The exact topology depends on the application.

The important property is separation of workloads.

---

# 57. Core Invariants

Memorize these architectural invariants.

```text
container
≠
hosting platform
```

```text
serverless
≠
no server
```

```text
warm instance
≠
guaranteed state.
```

```text
process memory
≠
durable application state.
```

```text
local filesystem
≠
durable storage.
```

```text
edge compute
≠
automatically low latency.
```

```text
edge proximity
+
remote database
=
potentially remote data latency.
```

```text
horizontal scaling
≠
unlimited system capacity.
```

```text
runtime compatibility
=
part of architecture.
```

```text
runtime selection
→
dependency constraints.
```

```text
serverless scaling
→
connection-scaling considerations.
```

```text
long-running work
→
often better represented as asynchronous work.
```

```text
build artifact
≠
runtime state.
```

---

# 58. Part Completion Checklist

You have completed this part when you can explain:

### Hosting

* [ ] traditional server hosting
* [ ] container hosting
* [ ] serverless hosting
* [ ] edge runtime
* [ ] hybrid runtime architecture

### Runtime

* [ ] startup
* [ ] cold starts
* [ ] warm instances
* [ ] concurrency
* [ ] execution limits
* [ ] runtime APIs
* [ ] dependency compatibility

### State

* [ ] process memory
* [ ] filesystem
* [ ] durable state
* [ ] database
* [ ] object storage
* [ ] shared cache

### Scaling

* [ ] horizontal scaling
* [ ] vertical scaling
* [ ] serverless scaling
* [ ] edge distribution
* [ ] dependency bottlenecks
* [ ] database connection pressure

### Operations

* [ ] lifecycle
* [ ] readiness
* [ ] health checks
* [ ] graceful shutdown
* [ ] deployment blast radius
* [ ] runtime failure domains

### Architecture

* [ ] runtime selection
* [ ] workload classification
* [ ] data placement
* [ ] geographic placement
* [ ] asynchronous work
* [ ] hybrid deployment

---

# 59. Boundary of This Part

This part establishes:

```text
WHERE
the application executes
```

and:

```text
WHAT
constraints that runtime imposes.
```

It intentionally does not deeply cover:

* global CDN architecture
* regional traffic routing
* multi-region delivery
* deployment networking
* detailed data dependency architecture
* deployment observability
* complete production deployment strategy

Those concerns belong to the surrounding KPI 11 parts.

The progression is therefore:

```text
Part 01
Deployment Mental Model
        ↓
Part 02
Build Output & Artifacts
        ↓
Part 03
Deployment Strategies & CI/CD
        ↓
Part 04
Hosting Models & Runtime Constraints
        ↓
Part 05
CDN, Regions & Global Delivery
        ↓
Part 06
Networking, Data Dependencies & Distributed State
```

---

# 60. Final Mental Model

At SDE-2 level, deployment architecture should be understood as:

```text
                 APPLICATION
                      │
                      ↓
                WORKLOAD TYPES
                      │
          ┌───────────┼───────────┐
          ↓           ↓           ↓
        Web         API       Background
          │           │           │
          ↓           ↓           ↓
      Runtime       Runtime      Worker
          │           │           │
          └───────────┼───────────┘
                      ↓
                HOSTING MODEL
                      │
       ┌──────────────┼──────────────┐
       ↓              ↓              ↓
    Compute         Network         State
       │              │              │
       ↓              ↓              ↓
    Scaling        Routing        Database
    Lifecycle      Regions        Cache
    Limits         Latency        Storage
       │              │              │
       └──────────────┼──────────────┘
                      ↓
                  OPERATIONS
                      │
             ┌────────┼────────┐
             ↓        ↓        ↓
          Health    Deploy    Observe
             │        │        │
             └────────┼────────┘
                      ↓
                 PRODUCTION
```

The core senior-level principle is:

> **Choose the hosting model from the workload and its runtime constraints—not the other way around.**

And the deeper deployment invariant is:

```text
Workload
→ Runtime
→ Hosting Model
→ Scaling Model
→ Data Placement
→ Network Path
→ Lifecycle
→ Operational Model
```

Every deployment decision should be traceable through that chain.
