# Level 08 — Next.js & Full-Stack React

# KPI 11 — Deployment Considerations

## Part 04 — Hosting Models, Serverless, Containers, Edge Runtime & Runtime Constraints

---

## 1. Part Objective

This part establishes the runtime layer underneath a Next.js deployment.

The goal is not to memorize hosting providers.

The goal is to understand how the **hosting model changes the behavior, constraints, scaling characteristics, failure modes, and architectural possibilities of the application**.

By the end of this part, you should be able to reason about:

* traditional Node.js servers
* serverless functions
* containerized deployments
* edge runtimes
* managed Next.js hosting
* static hosting
* process lifetime
* invocation lifetime
* cold starts
* warm instances
* concurrency
* horizontal scaling
* CPU and memory limits
* execution duration
* ephemeral filesystems
* network access
* database connections
* background work
* streaming
* WebSockets
* runtime compatibility
* regional deployment
* latency
* cost
* reliability
* workload-to-runtime selection

The senior-level question is:

> **What runtime execution model does this application actually require, and which hosting model can provide it reliably?**

---

# 2. Hosting Is an Architectural Decision

A common mistake is to treat hosting as an infrastructure detail that comes after application architecture.

At SDE-2 level, that is too late.

The runtime model influences:

* request lifecycle
* state management
* connection management
* caching
* filesystem behavior
* scaling
* background processing
* streaming
* authentication
* observability
* cost
* failure recovery

Therefore:

```text
Application Architecture
        ↓
Runtime Requirements
        ↓
Hosting Model
        ↓
Infrastructure Topology
        ↓
Operational Characteristics
```

Not:

```text
Build Application
      ↓
Pick Hosting Later
```

---

# 3. The Core Runtime Mental Model

Separate four concepts.

```text
Deployment
    ↓
Runtime Instance
    ↓
Invocation / Request
    ↓
Application Work
```

A deployment is the released artifact.

An instance is an execution environment capable of running that artifact.

An invocation is a request or execution event handled by that environment.

The application work occurs inside the invocation.

These are not interchangeable.

---

# 4. Deployment vs Instance vs Invocation

Consider a server deployment:

```text
Deployment
   │
   ├── Instance A
   │      ├── Request 1
   │      ├── Request 2
   │      └── Request 3
   │
   ├── Instance B
   │      ├── Request 4
   │      └── Request 5
   │
   └── Instance C
          └── Request 6
```

The same deployment artifact may execute simultaneously across many instances.

Therefore:

```text
deployment identity
≠
instance identity
≠
request identity
```

This distinction becomes critical for:

* in-memory state
* caching
* database connections
* locks
* rate limiting
* sessions
* background jobs
* observability

---

# 5. Hosting Model #1 — Traditional Node.js Server

The traditional model is a long-lived server process.

Conceptually:

```text
Internet
   ↓
Load Balancer
   ↓
Node.js Instance
   ↓
Next.js Application
```

The process may remain alive for a long period.

The application can therefore maintain process-local resources such as:

* in-memory caches
* connection pools
* initialized SDK clients
* loaded configuration
* compiled modules
* reusable objects

But these resources are local to that instance.

---

# 6. Long-Lived Process Characteristics

A long-running Node.js process generally provides:

```text
Process starts
      ↓
Application initializes
      ↓
Process handles many requests
      ↓
Process remains alive
      ↓
Eventually restarted/replaced
```

This enables reuse.

For example:

```text
Request 1
    ↓
Database client created

Request 2
    ↓
Reuse client

Request 3
    ↓
Reuse client
```

That can be beneficial.

But it creates another responsibility:

> Process-local state must never be assumed to be globally shared.

---

# 7. The Horizontal Scaling Problem

Suppose there are three instances:

```text
Instance A
cache = { user: 123 }

Instance B
cache = {}

Instance C
cache = {}
```

A later request may reach Instance B.

Therefore:

```text
process-local state
```

is not equivalent to:

```text
distributed application state
```

This affects:

* authentication state
* rate limits
* job state
* sessions
* feature state
* locks
* caches

If the state must survive instance changes or be visible globally, move it into an appropriate shared system.

Examples:

```text
Database
Redis
Object Storage
External Queue
Distributed Cache
```

---

# 8. Hosting Model #2 — Serverless Functions

Serverless changes the execution model.

Conceptually:

```text
Request
   ↓
Platform Router
   ↓
Function Instance
   ↓
Handler
   ↓
Response
```

The platform controls:

* instance creation
* instance reuse
* scaling
* replacement
* capacity management

The developer primarily supplies the application logic.

---

# 9. Serverless Does Not Mean "No Server"

The term is operational rather than literal.

There are still:

* CPUs
* memory
* operating systems
* networking
* processes
* containers or sandbox environments

The distinction is that the developer does not directly manage the underlying server fleet in the traditional model.

So:

```text
serverless
≠
server-free
```

Instead:

```text
serverless
=
provider-managed execution infrastructure
```

---

# 10. Cold Starts

A serverless environment may need to initialize an execution environment.

Conceptually:

```text
Request
   ↓
No warm instance
   ↓
Create execution environment
   ↓
Load runtime
   ↓
Load application
   ↓
Initialize dependencies
   ↓
Execute handler
```

This initialization contributes to latency.

That is a cold start.

---

# 11. Warm Invocations

After initialization, the same execution environment may handle another request.

```text
Warm Instance
   ↓
Request
   ↓
Handler
   ↓
Response
```

The runtime may therefore reuse:

* loaded modules
* initialized clients
* memory
* connection state

But this reuse is an optimization, not a correctness guarantee.

Never build correctness around:

> "The function will probably still be warm."

---

# 12. Correctness vs Runtime Reuse

Bad assumption:

```text
global cache exists
therefore
cache is always available
```

Correct model:

```text
global process state
    ↓
may survive between invocations
    ↓
but may disappear at any time
```

Therefore process-local reuse can improve performance.

It must not become a correctness dependency unless the hosting model explicitly guarantees the behavior.

---

# 13. Serverless Scaling

Serverless platforms can create additional instances when demand increases.

For example:

```text
Low traffic

Instance A
  ↓
Requests
```

Then:

```text
Traffic increases

Instance A
Instance B
Instance C
Instance D
```

This can provide rapid horizontal scaling.

But it also creates:

* more independent memory
* more database connections
* more cache fragmentation
* more concurrent outbound requests

Scaling the application can therefore overload a downstream dependency.

---

# 14. The Database Connection Problem

Suppose one server instance maintains:

```text
20 database connections
```

At:

```text
10 instances
```

you might have:

```text
200 connections
```

At:

```text
100 instances
```

you might have:

```text
2,000 connections
```

The application may scale successfully while the database fails.

This creates a fundamental principle:

> **Application scalability and dependency scalability are coupled.**

---

# 15. Connection Management

At scale, reason about:

```text
Application Instances
        ↓
Connection Pooling
        ↓
Database
```

Potential strategies include:

* connection pooling
* managed database proxies
* serverless-aware database drivers
* bounded concurrency
* connection reuse
* workload-specific databases
* read replicas
* queue-based smoothing

The exact solution depends on the database and hosting model.

---

# 16. Hosting Model #3 — Containers

Containers provide a more explicit runtime boundary.

Conceptually:

```text
Container Image
      ↓
Container Instance
      ↓
Operating Environment
      ↓
Next.js / Node.js
```

The application and its runtime dependencies are packaged together.

A container can then run in:

* Kubernetes
* managed container platforms
* virtual machines
* container services
* internal infrastructure

---

# 17. Container Mental Model

Think:

```text
Source
  ↓
Build
  ↓
Container Image
  ↓
Registry
  ↓
Deployment
  ↓
Container Instances
```

The image becomes a deployment artifact.

This strongly supports:

```text
build once
promote many
```

The same image can move through:

```text
staging
   ↓
production
```

without rebuilding the application.

---

# 18. Containers vs Traditional Servers

A traditional server might mean:

```text
VM
 └── Node process
```

A containerized system might mean:

```text
Host
 ├── Container A
 ├── Container B
 └── Container C
```

Containers improve packaging and isolation.

They do not automatically provide:

* infinite scalability
* zero downtime
* distributed state
* automatic failover

Those capabilities come from the surrounding orchestration/infrastructure.

---

# 19. Container Lifecycle

A container has a lifecycle.

```text
Image
 ↓
Container Created
 ↓
Process Started
 ↓
Requests Served
 ↓
Health Checks
 ↓
Replacement / Shutdown
```

Applications must tolerate:

* startup
* restart
* termination
* rescheduling
* instance replacement

Therefore graceful shutdown matters.

---

# 20. Graceful Shutdown

Suppose a container receives termination.

Bad behavior:

```text
Terminate immediately
↓
Active requests fail
↓
Connections abruptly close
```

Better architecture:

```text
Termination signal
      ↓
Stop accepting new work
      ↓
Finish in-flight requests
      ↓
Close resources
      ↓
Exit
```

This matters for:

* database connections
* message consumers
* streaming responses
* background work
* telemetry flushing

---

# 21. Hosting Model #4 — Edge Runtime

An edge runtime places request execution closer to users geographically.

Conceptually:

```text
                    User A
                       ↓
                 Edge Region A
                       ↓
                    Request

User B
   ↓
Edge Region B
   ↓
Request
```

The objective is to reduce network distance for latency-sensitive work.

But edge execution often comes with runtime constraints.

---

# 22. Edge Is Not "Node.js Everywhere"

An edge runtime may not expose the complete Node.js runtime.

Some Node APIs or native modules may be unavailable.

Therefore:

```text
Node.js compatibility
≠
Edge compatibility
```

A dependency that works in a Node server may fail at the edge.

This is especially important for libraries relying on:

* filesystem APIs
* native binaries
* Node-specific modules
* process-level APIs
* certain cryptographic implementations
* long-running connections

---

# 23. Web Platform APIs vs Node APIs

Edge runtimes often emphasize Web APIs such as:

```text
Request
Response
fetch
URL
Headers
Streams
Web Crypto
```

Whereas Node environments provide a much broader server runtime.

Therefore architecture should explicitly identify:

```text
required runtime capabilities
```

rather than assuming:

```text
all server code can execute anywhere
```

---

# 24. Runtime Selection Must Be Explicit

A useful model is:

```text
Workload
   ↓
Required APIs
   ↓
Execution Duration
   ↓
Latency Requirements
   ↓
State Requirements
   ↓
Dependency Requirements
   ↓
Runtime Selection
```

Do not reverse this:

```text
Provider offers runtime X
   ↓
Force every workload into X
```

---

# 25. Edge Workloads

Edge execution can be useful for work such as:

* lightweight request classification
* redirects
* locale detection
* geographic routing
* authentication checks
* header manipulation
* personalization decisions
* low-latency API logic

But not every workload belongs there.

---

# 26. Heavy Compute and Edge

Suppose an operation requires:

```text
500 MB memory
+
large native dependency
+
long CPU computation
+
database transaction
```

Moving it to the edge simply because edge is geographically close may be counterproductive.

The correct architecture may be:

```text
User
 ↓
Edge
 ↓
Origin / Compute Region
 ↓
Database
```

Use edge for the part where geographic proximity matters.

---

# 27. Serverless vs Containers vs Edge

A simplified comparison:

| Dimension             | Traditional Node       | Serverless                 | Container            | Edge                               |
| --------------------- | ---------------------- | -------------------------- | -------------------- | ---------------------------------- |
| Process lifetime      | Long-lived             | Provider-controlled        | Long-lived-ish       | Provider-controlled                |
| Scaling               | Infrastructure-managed | Automatic/platform-managed | Orchestrator-managed | Distributed/platform-managed       |
| Runtime control       | High                   | Medium                     | High                 | Lower                              |
| Node compatibility    | High                   | Usually high               | High                 | More constrained                   |
| Cold starts           | Usually low            | Possible                   | Possible on scale-up | Possible                           |
| Geographic execution  | Configurable           | Provider-dependent         | Configurable         | Core characteristic                |
| Long-running work     | Stronger               | Often constrained          | Strong               | Usually constrained                |
| Operational control   | High                   | Lower                      | High                 | Lower                              |
| Deployment complexity | Higher                 | Lower                      | Medium/high          | Lower/higher depending on platform |

This is a conceptual comparison, not a universal provider guarantee.

---

# 28. Static Hosting

Some Next.js applications can be deployed as static assets.

Conceptually:

```text
Build
 ↓
HTML / CSS / JS / Assets
 ↓
CDN
 ↓
Browser
```

There is no per-request application server for the statically generated output.

This can be extremely efficient for workloads that do not require runtime server execution.

---

# 29. Static Hosting Boundary

Static hosting becomes insufficient when the application requires request-time behavior such as:

* server-side personalization
* protected server rendering
* dynamic mutations
* runtime authorization
* request-dependent data
* server-side secrets
* server execution

The important question is not:

> "Can Next.js generate HTML?"

The important question is:

> "Does this representation require server execution at request time?"

---

# 30. Runtime Capability Matrix

For each workload, identify:

| Requirement           |                     Node |                 Serverless |         Container |                       Edge |
| --------------------- | -----------------------: | -------------------------: | ----------------: | -------------------------: |
| Long-lived process    |                        ✓ |                          — |                 ✓ |                          — |
| Node APIs             |                        ✓ |                  Usually ✓ |                 ✓ |                    Limited |
| Heavy computation     |                        ✓ |         Provider-dependent |                 ✓ |        Usually constrained |
| Geographic proximity  |             Configurable |         Provider-dependent |      Configurable |                          ✓ |
| Runtime secrets       |                        ✓ |                          ✓ |                 ✓ |                          ✓ |
| Local persistent disk | Infrastructure-dependent |                 Usually no | Usually ephemeral |                 Usually no |
| WebSockets            |                 Possible |         Platform-dependent |          Possible |         Platform-dependent |
| Background workers    |                        ✓ | Usually separate mechanism |                 ✓ | Usually separate mechanism |

The exact platform determines the actual capabilities.

---

# 31. Execution Duration

Runtime choice must consider:

```text
How long can the work take?
```

Examples:

```text
5 ms
100 ms
1 second
10 seconds
5 minutes
1 hour
```

A request/response runtime is generally not the right abstraction for arbitrarily long background work.

For long-running work, consider:

```text
Queue
 ↓
Worker
 ↓
Job
```

rather than:

```text
HTTP Request
 ↓
wait 30 minutes
 ↓
HTTP Response
```

---

# 32. Background Work

A user request should not necessarily execute all downstream work synchronously.

Bad:

```text
POST /upload
 ↓
Upload file
 ↓
Resize 20 images
 ↓
Generate thumbnails
 ↓
Run OCR
 ↓
Send email
 ↓
Return response
```

Better:

```text
POST /upload
 ↓
Persist upload
 ↓
Enqueue job
 ↓
Return success
```

Then:

```text
Queue
 ↓
Worker
 ↓
Image processing
 ↓
OCR
 ↓
Notification
```

Runtime constraints often force this architectural separation.

---

# 33. Request Timeout Is an Architectural Signal

If a request repeatedly approaches the platform's execution limit:

```text
Request duration
        ↓
███████████████████
                ↑
             timeout
```

Do not merely increase the timeout.

Ask:

* Is the operation too expensive?
* Can it be asynchronous?
* Can work be parallelized?
* Can intermediate results be cached?
* Can the operation be moved to a worker?
* Can the user receive a job ID?
* Can the operation be split?

Timeouts are often architecture signals.

---

# 34. Filesystem Semantics

A critical runtime distinction:

```text
persistent filesystem
≠
ephemeral filesystem
```

An application may be able to write:

```text
/tmp/file
```

during execution.

That does not imply:

```text
/tmp/file
```

will exist later.

It may disappear when the instance is:

* restarted
* replaced
* scaled down
* moved
* recreated

---

# 35. Correct Persistent Storage Architecture

Do not use ephemeral runtime storage for durable business data.

Instead:

```text
Application
   ↓
Object Storage / Database
   ↓
Durable Data
```

Ephemeral storage can still be useful for:

* temporary processing
* decompression
* intermediate files
* short-lived transformations

But durability must be provided by a durable system.

---

# 36. Memory Is Also Local

Suppose:

```text
Instance A:
session = X
```

A request may then reach:

```text
Instance B:
session = undefined
```

Therefore:

```text
in-memory state
```

should not be treated as distributed state.

This is one of the most common production misconceptions in horizontally scaled systems.

---

# 37. Runtime State Categories

Classify state explicitly:

### Process-local state

```text
module cache
temporary objects
connection pools
local optimization cache
```

### Instance-shared state

State visible to requests handled by one instance.

### Distributed state

```text
database
Redis
object storage
queue
```

### Client state

```text
cookies
browser storage
URL
client memory
```

### Durable state

State expected to survive deployments and infrastructure replacement.

This classification should happen before deciding where state belongs.

---

# 38. Streaming Constraints

Streaming depends on the runtime and infrastructure path.

Conceptually:

```text
Server
 ↓
Stream chunks
 ↓
Proxy/CDN
 ↓
Browser
```

Streaming may be affected by:

* runtime support
* proxy buffering
* CDN behavior
* timeout configuration
* connection lifetime
* compression
* infrastructure limits

Therefore:

```text
framework supports streaming
```

does not automatically mean:

```text
end-to-end path streams immediately
```

---

# 39. WebSockets

WebSockets require a long-lived bidirectional connection.

That introduces different infrastructure requirements from ordinary request/response traffic.

Architecture may become:

```text
Browser
   ↓
WebSocket Gateway
   ↓
Realtime Service
```

rather than forcing the normal HTTP rendering layer to maintain all realtime connections.

This separation can simplify scaling.

---

# 40. Network Topology Matters

A request may traverse:

```text
Browser
 ↓
DNS
 ↓
CDN
 ↓
Edge
 ↓
Load Balancer
 ↓
Application
 ↓
Database
```

Each hop introduces:

* latency
* failure possibility
* connection behavior
* security boundaries

The runtime cannot be evaluated independently from the network path.

---

# 41. Geographic Placement

Suppose:

```text
Users → Europe
Application → US
Database → US
```

The application may be fast enough for some requests.

But:

```text
Europe
 ↓
US application
 ↓
US database
```

creates network distance.

Moving only the application to Europe:

```text
Europe User
 ↓
Europe Application
 ↓
US Database
```

may still leave the database as the dominant latency source.

Therefore:

> **Compute locality and data locality must be evaluated together.**

---

# 42. Edge + Regional Origin Architecture

A common architecture is:

```text
                    ┌── User
                    │
                Edge Layer
                    │
          ┌─────────┴─────────┐
          ↓                   ↓
     Region A             Region B
          ↓                   ↓
       Compute               Compute
          └─────────┬─────────┘
                    ↓
                 Database
```

The edge handles lightweight geographically sensitive work.

Regional compute handles heavier application logic.

---

# 43. Cost Is a Runtime Dimension

Do not compare hosting models only by monthly infrastructure price.

Consider:

```text
Request cost
+
CPU cost
+
Memory cost
+
Bandwidth
+
Database cost
+
Cache cost
+
Observability cost
+
Operational cost
+
Engineering cost
```

A cheap runtime can create expensive downstream load.

---

# 44. The Hidden Cost of Scaling

Suppose:

```text
10 application instances
```

become:

```text
500 application instances
```

Potential secondary effects:

```text
500 DB connection pools
500 cache clients
500 telemetry streams
500 concurrent dependency clients
```

Therefore scaling should be modeled as a system, not a single service.

---

# 45. Reliability and Failure Domains

Every runtime creates a failure domain.

Examples:

```text
Process failure
Instance failure
Host failure
Region failure
Provider failure
Dependency failure
Network failure
Deployment failure
```

A robust system asks:

> What happens when this runtime disappears?

If the answer is:

> "The application loses critical state."

then that state is probably in the wrong place.

---

# 46. Health Checks

Containers and managed runtimes often need health information.

Distinguish:

### Liveness

> Is the process alive?

### Readiness

> Can this instance safely receive traffic?

An application can be alive but not ready.

Example:

```text
Process running
+
database initialization incomplete
=
alive but not ready
```

Traffic should not necessarily be sent to it.

---

# 47. Dependency Health

A readiness check can become dangerous if it performs expensive dependency checks.

Bad:

```text
Every health check
 ↓
Database query
 ↓
External API query
 ↓
Queue query
```

At scale this creates additional dependency load.

Health checks themselves must be designed as production traffic.

---

# 48. Runtime Failure Isolation

Suppose an external API becomes slow.

Bad architecture:

```text
Every request
 ↓
Wait indefinitely
 ↓
External API
```

Better:

```text
Timeout
Circuit breaking
Fallback
Cache
Queue
Bulkhead
```

Runtime architecture should prevent one dependency from consuming all available execution capacity.

---

# 49. Concurrency Is a First-Class Constraint

Ask:

```text
How many requests can one instance execute concurrently?
```

Then:

```text
How many instances can exist?
```

Then:

```text
How many downstream operations can that create?
```

For example:

```text
100 instances
×
20 concurrent requests
=
2,000 active requests
```

If every request performs two database operations:

```text
≈ 4,000 database operations
```

This is why concurrency must be modeled end-to-end.

---

# 50. Backpressure

If incoming work exceeds processing capacity:

```text
Incoming Rate
     ↓
████████████████████
Processing Capacity
     ↓
████████
```

the system needs backpressure.

Possible mechanisms:

* queueing
* rate limiting
* admission control
* concurrency limits
* load shedding
* circuit breakers
* bounded worker pools

Without backpressure, overload can cascade.

---

# 51. Runtime Selection Decision Tree

Use this reasoning process.

### Step 1 — Does request-time server execution exist?

If no:

```text
Static/CDN architecture
```

may be sufficient.

### Step 2 — Does the workload require full Node APIs?

If yes:

```text
Node-compatible runtime
```

is required.

### Step 3 — Is low-latency geographic execution important?

If yes:

```text
Edge
```

may be appropriate for compatible workloads.

### Step 4 — Is long-running work required?

If yes:

```text
Worker / container / job runtime
```

may be more appropriate.

### Step 5 — Does the workload require persistent process resources?

If yes:

```text
Long-lived server/container
```

may be preferable.

### Step 6 — Does the workload scale unpredictably?

If yes:

```text
serverless / autoscaling infrastructure
```

may simplify capacity management.

---

# 52. Workload-to-Runtime Mapping

| Workload                         | Common Runtime Direction             |
| -------------------------------- | ------------------------------------ |
| Static marketing page            | Static/CDN                           |
| Lightweight redirect             | Edge/CDN                             |
| Locale detection                 | Edge                                 |
| Request authorization            | Edge or server                       |
| Standard server-rendered page    | Node/serverless/container            |
| Database-heavy API               | Regional server/serverless/container |
| Long-running processing          | Worker/container/job                 |
| Image transformation             | Dedicated image/CDN processing       |
| Realtime WebSocket service       | Realtime infrastructure              |
| Large CPU computation            | Worker/container                     |
| Global low-latency request logic | Edge                                 |
| Durable scheduled job            | Queue + worker                       |

These are architectural directions, not universal prescriptions.

---

# 53. Next.js Runtime Boundary

At the framework level, think:

```text
Next.js Application
        ↓
Rendering / API / Middleware
        ↓
Runtime Requirements
        ↓
Deployment Runtime
```

Different parts of an application may have different runtime requirements.

That means:

```text
application
```

does not necessarily equal:

```text
single runtime behavior
```

---

# 54. Avoid Runtime Leakage

A server-only module should not accidentally enter a client or edge-incompatible bundle.

Likewise, a Node-only dependency should not silently become a dependency of edge-executed code.

The architectural rule is:

```text
runtime-specific dependencies
must remain inside compatible boundaries
```

This connects directly to the build graph discussed in Part 02.

---

# 55. Environment Variables and Runtime

Configuration can be consumed at:

### Build time

```text
Build
 ↓
Environment
 ↓
Artifact
```

### Runtime

```text
Request
 ↓
Runtime Environment
 ↓
Configuration
```

These are different architectures.

If a value is embedded during build:

```text
change environment
≠
change already-built artifact
```

This reinforces the principle:

> **Build-time configuration and runtime configuration have different lifecycle semantics.**

---

# 56. Secrets

Secrets belong on the server-side runtime boundary.

Examples:

```text
DATABASE_URL
API_SECRET
PRIVATE_SIGNING_KEY
SERVICE_TOKEN
```

They should not become client bundle data.

Runtime architecture must therefore preserve:

```text
secret
 ↓
server-only boundary
```

not:

```text
secret
 ↓
client JavaScript
```

---

# 57. Deployment Portability

A useful engineering goal is to make the application explicit about its assumptions.

Document:

```text
Runtime:
Node / Edge

Memory:
X

Execution duration:
Y

Filesystem:
Ephemeral

Database:
External

Background jobs:
Queue + Worker

Required APIs:
fetch / crypto / filesystem / native modules

Regions:
X

Secrets:
Runtime-managed
```

This makes the deployment architecture reviewable.

---

# 58. Production Architecture Example

A mature Next.js system might look like:

```text
                         Users
                           │
                           ▼
                         CDN
                           │
                    ┌──────┴──────┐
                    │             │
                  Edge          Static
                    │             │
                    ▼             ▼
              Request Logic     Assets
                    │
                    ▼
               Regional App
                    │
          ┌─────────┼─────────┐
          │         │         │
          ▼         ▼         ▼
       Database   Cache      Queue
                              │
                              ▼
                           Workers
                              │
                              ▼
                       Object Storage
```

Each component has a distinct runtime responsibility.

---

# 59. Scenario — Traffic Spike

Suppose traffic suddenly increases by 20×.

Reason through:

```text
Users
 ↓
CDN
 ↓
Edge
 ↓
Application
 ↓
Database
```

Questions:

1. Does the CDN absorb static traffic?
2. Can the application scale?
3. How quickly?
4. Does scaling increase DB connections?
5. Does cache hit rate remain high?
6. Does the queue absorb asynchronous work?
7. Does the database have enough capacity?
8. What happens when capacity is exhausted?

Do not stop at:

> "The application autos-scales."

---

# 60. Scenario — Runtime Migration

Suppose a Node server is migrated to edge execution.

Ask:

```text
Which APIs are used?
Which dependencies are imported?
Where is the database?
Where are secrets?
What is the request latency?
What is the execution duration?
Are native modules involved?
Are streaming semantics preserved?
Are observability tools compatible?
```

Migration is a runtime compatibility exercise, not merely a deployment configuration change.

---

# 61. Scenario — Serverless Database Failure

Suppose:

```text
Traffic increases
 ↓
Serverless instances increase
 ↓
Database connections increase
 ↓
Database reaches connection limit
 ↓
Requests fail
```

The failure appears to be a database issue.

But the architectural root cause may be:

```text
runtime scaling model
+
connection management
```

This is the kind of cross-layer reasoning expected at SDE-2.

---

# 62. Scenario — Edge Dependency Failure

Suppose an edge function imports a Node-only library.

Deployment may:

```text
fail during build
```

or:

```text
fail during runtime
```

depending on the toolchain and dependency.

The correct debugging path is:

```text
Runtime selection
 ↓
Dependency graph
 ↓
Compatibility
 ↓
Bundle
 ↓
Execution
```

---

# 63. Scenario — Ephemeral Filesystem Bug

Application:

```text
Request 1
 ↓
write /tmp/result.json
```

Request 2:

```text
read /tmp/result.json
```

It works locally.

It fails in production.

Why?

Possible reasons:

* request 2 reached another instance
* original instance was replaced
* runtime storage is ephemeral
* deployment restarted the process

Correct architecture:

```text
Temporary processing
    ↓
Object storage / database
    ↓
Durable result
```

---

# 64. Four-Pillar Engineering Matrix

Every hosting decision should be evaluated through four dimensions.

## Mental Model

Understand:

* process lifetime
* invocation lifetime
* instance lifecycle
* scaling
* runtime capabilities
* network topology
* state ownership

## Mechanics

Understand:

* cold starts
* warm reuse
* concurrency
* CPU/memory
* filesystem
* runtime APIs
* health checks
* shutdown
* connection management

## Architecture

Design:

* runtime boundaries
* workload placement
* regional topology
* edge/origin split
* background workers
* dependency isolation
* durable state
* scaling strategy

## Production

Operate:

* deployment
* monitoring
* latency
* capacity
* failures
* cost
* rollback
* incident response

---

# 65. Prediction Challenges

## Challenge 1

You have:

```text
100 serverless instances
```

Each instance creates:

```text
10 DB connections
```

What is the potential database connection count?

### Answer

```text
100 × 10 = 1,000
```

The important insight is that application scaling can multiply downstream resource consumption.

---

## Challenge 2

A request writes a file locally and a later request cannot find it.

What should you investigate?

### Answer

Investigate:

* instance identity
* filesystem persistence
* horizontal scaling
* instance replacement
* runtime lifecycle

Do not immediately assume application code deleted the file.

---

## Challenge 3

An edge migration causes a package import failure.

What is the first architectural question?

### Answer

Whether the dependency is compatible with the selected edge runtime.

The problem may exist before application logic executes.

---

## Challenge 4

A request takes 40 seconds and frequently times out.

Should you only increase the timeout?

### Answer

No.

First determine whether the workload belongs in a synchronous request path.

Potentially move expensive work into:

```text
Queue → Worker → Durable Result
```

---

## Challenge 5

Moving compute closer to users does not significantly improve latency.

Why might that happen?

### Answer

The dominant latency may come from:

```text
Application
    ↓
Remote Database
```

Compute locality alone does not guarantee data locality.

---

# 66. Senior Interview Gotchas

### Gotcha 1

**"Serverless means there is no server."**

Incorrect.

Serverless means infrastructure management is abstracted from the developer.

---

### Gotcha 2

**"Serverless functions are always stateless."**

More precise:

They should not depend on local state for distributed correctness, but execution environments can retain process-local state between invocations.

---

### Gotcha 3

**"Edge is always faster."**

Not necessarily.

If the edge function must make a long-distance database request, the total path may still be slow.

---

### Gotcha 4

**"Containers solve scaling."**

Containers provide a packaging/runtime abstraction.

Scaling requires orchestration or infrastructure around them.

---

### Gotcha 5

**"Autoscaling solves database capacity."**

No.

Autoscaling application instances can increase database load.

---

### Gotcha 6

**"Filesystem writes are persistent because they worked locally."**

Incorrect.

Local development and production runtime storage semantics may differ significantly.

---

### Gotcha 7

**"A longer timeout fixes long-running work."**

Not necessarily.

Long-running workloads may belong in asynchronous job infrastructure.

---

### Gotcha 8

**"If Next.js supports it, every runtime supports it."**

Incorrect.

Framework capability and runtime capability are separate dimensions.

---

# 67. Production Checklist

Before selecting or changing a hosting model, verify:

### Runtime

* [ ] Required runtime APIs are available.
* [ ] Node/Edge compatibility is known.
* [ ] Native dependencies are compatible.
* [ ] Execution duration is sufficient.
* [ ] Memory limits are sufficient.

### State

* [ ] No critical state depends on process memory.
* [ ] Persistent data uses durable storage.
* [ ] Ephemeral storage is treated as temporary.
* [ ] Sessions work across instances.

### Scaling

* [ ] Horizontal scaling is understood.
* [ ] Concurrency limits are known.
* [ ] Downstream dependency capacity is modeled.
* [ ] Database connection behavior is understood.

### Networking

* [ ] Region placement is intentional.
* [ ] Database locality is considered.
* [ ] CDN/edge/origin path is understood.
* [ ] Timeouts are configured.

### Reliability

* [ ] Instance failure is tolerated.
* [ ] Graceful shutdown is implemented where relevant.
* [ ] Readiness and liveness are distinguished.
* [ ] Dependency failures are isolated.

### Operations

* [ ] Logs are available.
* [ ] Metrics are available.
* [ ] Traces are available where appropriate.
* [ ] Runtime failures are observable.
* [ ] Deployment rollback is understood.

---

# 68. Core Invariants

Memorize these.

```text
hosting model ≠ deployment artifact
```

```text
instance state ≠ distributed state
```

```text
serverless ≠ server-free
```

```text
warm reuse ≠ correctness guarantee
```

```text
application scaling ≠ dependency scaling
```

```text
edge locality ≠ data locality
```

```text
ephemeral storage ≠ durable storage
```

```text
framework capability ≠ runtime capability
```

```text
request timeout ≠ correct background-job architecture
```

```text
containerization ≠ automatic scaling
```

```text
runtime selection should follow workload requirements
```

---

# 69. Final Senior-Level Mental Model

A production Next.js application should be understood as:

```text
                    Deployment Artifact
                           │
                           ▼
                    Runtime Environment
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
           Request      Instance      Dependencies
              │            │            │
              ▼            ▼            ▼
          Execution    Local State    Database/Cache
              │
              ▼
        Network / CDN / Edge
              │
              ▼
            User
```

The critical reasoning chain is:

```text
Workload
   ↓
Runtime Requirements
   ↓
Hosting Model
   ↓
Instance Lifecycle
   ↓
Scaling Model
   ↓
Dependency Load
   ↓
Network Topology
   ↓
Failure Model
   ↓
Operational Model
```

That is the real hosting architecture.

---

# 70. Part Boundary

This part established **where and how the application executes**.

We covered:

* traditional Node.js
* serverless
* containers
* edge
* static hosting
* runtime lifecycle
* cold starts
* warm instances
* scaling
* concurrency
* filesystem semantics
* database connections
* background work
* streaming
* WebSockets
* regional placement
* runtime compatibility
* cost
* failure domains

The next part should move from **runtime execution models** into the infrastructure layer surrounding those runtimes:

> **CDN, Regions, Traffic Routing, Load Balancing, Caching Layers & Global Delivery Architecture**

The key transition is:

```text
Part 04
Hosting Model
      ↓
How the application executes
      ↓
Part 05
Global Traffic & Delivery Architecture
      ↓
How users reach the application
```

**Part 04 complete.**
