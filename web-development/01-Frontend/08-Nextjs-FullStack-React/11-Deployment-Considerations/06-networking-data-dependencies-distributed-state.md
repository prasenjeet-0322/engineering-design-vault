# Level 08 — KPI 11 — Part 06

## Networking, Data Dependencies & Distributed State Architecture

### Part Objective

Master the networking and distributed-state layer that sits underneath a production Next.js application.

The goal is not merely to understand how an application connects to a database or API. The goal is to reason about the complete dependency topology:

```text
User
  ↓
DNS
  ↓
CDN / Edge
  ↓
Load Balancer / Ingress
  ↓
Application Runtime
  ↓
 ┌───────────────┬────────────────┬─────────────────┐
 ↓               ↓                ↓
Database       Cache            External APIs
 ↓               ↓                ↓
Object Store   Queue            Background Jobs
```

At SDE-2 level, deployment architecture requires understanding **where state lives, how traffic reaches it, what happens when dependencies become slow or unavailable, and how distributed systems behavior affects application correctness.**

---

# 1. The Networking Mental Model

A production request is not simply:

```text
Browser → Next.js
```

It is usually a chain of network and dependency boundaries:

```text
Browser
  ↓
DNS
  ↓
Global Routing
  ↓
CDN / Edge
  ↓
TLS Termination
  ↓
Load Balancer
  ↓
Application Runtime
  ↓
Internal Network
  ↓
Database / Cache / APIs / Storage
```

Every hop introduces:

* latency
* failure probability
* connection management
* security boundaries
* capacity constraints
* observability requirements

Therefore:

```text
application latency
≠ application execution time
```

Instead:

```text
Total Request Latency
=
Network Latency
+
Queueing
+
Application Execution
+
Dependency Latency
+
Response Transfer
```

A server-side function that takes 30 ms can still produce a 500 ms request if its dependency path contains multiple network calls.

---

# 2. Network Topology Is Part of Application Architecture

Application architecture cannot be separated completely from infrastructure topology.

Consider:

```text
App
 ↓
Database
```

versus:

```text
App
 ↓
Service A
 ↓
Service B
 ↓
Database
```

The second architecture introduces additional:

* network hops
* failure domains
* latency
* retry behavior
* connection pools
* observability requirements

Therefore a senior engineer must reason about:

```text
dependency graph
```

rather than only:

```text
module graph
```

A useful mental model is:

```text
Code Dependency
        ↓
Runtime Dependency
        ↓
Network Dependency
        ↓
Data Dependency
        ↓
Failure Dependency
```

---

# 3. Ingress and Egress

Two fundamental networking directions are:

### Ingress

Traffic entering the application environment.

```text
Internet
   ↓
Load Balancer
   ↓
Application
```

### Egress

Traffic leaving the application environment.

```text
Application
   ↓
Database
```

or:

```text
Application
   ↓
External API
```

Egress is particularly important because an application may be publicly reachable while its internal dependencies should remain private.

Example:

```text
Internet
   ↓
Public CDN
   ↓
Public Load Balancer
   ↓
Private Application
   ↓
Private Database
```

The database does not need to be publicly addressable.

---

# 4. Private vs Public Networking

A common production principle is:

```text
Public access should be minimized.
```

For example:

```text
Internet
   │
   ├── CDN
   │
   └── Public API / Load Balancer
            │
            ↓
       Private App Network
            │
       ┌────┴────┐
       ↓         ↓
   Database    Cache
```

The application can communicate with internal dependencies without exposing those dependencies directly to the public internet.

This creates security boundaries.

---

# 5. VPC / VNet / Subnet Mental Model

Cloud providers use different terminology, but the architectural concepts are similar.

A private network can contain isolated network segments.

Conceptually:

```text
Virtual Network
│
├── Public Subnet
│     └── Load Balancer
│
├── Private Application Subnet
│     └── Application Runtime
│
└── Private Data Subnet
      ├── Database
      └── Cache
```

The important architectural question is not the provider-specific terminology.

It is:

> Which components can communicate with which other components?

That should be explicit.

---

# 6. Security Groups, Firewalls & Network Policies

Network-level security should enforce allowed communication paths.

For example:

```text
Internet
   ↓
Load Balancer :443
   ↓
Application :3000
   ↓
Database :5432
```

The database should ideally accept connections only from trusted application infrastructure.

Conceptually:

```text
Database
ALLOW:
  App → 5432

DENY:
  Internet → 5432
```

This creates defense in depth.

Application authorization remains necessary, but network controls reduce the attack surface.

---

# 7. DNS Is Part of Runtime Architecture

DNS is often treated as a setup concern.

In production it is part of the request path.

```text
Browser
 ↓
DNS Resolution
 ↓
IP / Edge Endpoint
 ↓
Connection
```

DNS can participate in:

* traffic routing
* regional routing
* failover
* domain ownership
* tenant routing
* service discovery

But DNS is not instantaneous control.

Caching and TTLs mean that routing changes may propagate differently across resolvers and clients.

Therefore:

```text
DNS change
≠ immediate universal traffic migration
```

This matters during:

* failover
* migrations
* incident response
* regional evacuation
* domain changes

---

# 8. TLS and Connection Establishment

A network dependency can involve multiple setup stages.

Conceptually:

```text
DNS
 ↓
TCP / transport connection
 ↓
TLS handshake
 ↓
HTTP request
 ↓
Server processing
 ↓
HTTP response
```

Repeatedly establishing connections can be expensive.

Connection reuse therefore matters.

A production application should understand:

```text
connection creation
connection reuse
connection pooling
connection timeout
connection expiration
connection failure
```

---

# 9. Application-to-Database Connectivity

The application/database relationship is one of the most important deployment dependencies.

```text
Next.js Runtime
      ↓
Database Client
      ↓
Connection Pool
      ↓
Database
```

The application does not merely issue SQL.

It manages network connections to a stateful system.

---

# 10. Connection Pooling

Suppose:

```text
100 application instances
```

each create:

```text
20 database connections
```

The database may receive:

```text
100 × 20 = 2,000 connections
```

even if the actual application traffic does not justify that number.

This creates a critical scaling relationship:

```text
Application Scale
        ↓
Connection Count
        ↓
Database Capacity
```

Horizontal scaling can therefore overload a database without the database itself receiving more logical work.

---

# 11. Serverless Connection Exhaustion

Serverless environments make this problem more subtle.

A deployment may create many ephemeral execution environments:

```text
Request
 ↓
Instance A
 ↓
DB connection

Request
 ↓
Instance B
 ↓
DB connection

Request
 ↓
Instance C
 ↓
DB connection
```

At sufficient concurrency:

```text
connection demand
>
database connection capacity
```

The application may begin failing even though CPU and memory utilization appear healthy.

Therefore database capacity must be considered alongside runtime scaling.

---

# 12. Connection Lifecycle

A production connection has a lifecycle:

```text
Create
  ↓
Authenticate
  ↓
Use
  ↓
Reuse
  ↓
Idle
  ↓
Expire / Close
```

Failures can occur at every stage.

Examples:

* DNS resolution failure
* TLS failure
* authentication failure
* connection timeout
* idle connection termination
* network interruption
* database failover
* connection pool exhaustion

A robust architecture treats these as expected operational conditions rather than impossible events.

---

# 13. Latency Budgets

Suppose a request has a 500 ms target.

A dependency chain might be:

```text
App processing       100 ms
Database              80 ms
External API         120 ms
Cache                  5 ms
Network overhead      50 ms
Queueing              80 ms
----------------------------
Total                 435 ms
```

The remaining budget is:

```text
500 - 435 = 65 ms
```

This illustrates why latency must be budgeted across the dependency graph.

A senior engineer asks:

> Where is the latency budget being spent?

not merely:

> Why is this endpoint slow?

---

# 14. Sequential vs Parallel Dependencies

Consider:

```text
App
 ↓
API A
 ↓
API B
 ↓
API C
```

If each takes 100 ms:

```text
≈ 300 ms
```

But independent dependencies can sometimes execute concurrently:

```text
        ┌→ API A ─┐
App ────┼→ API B ─┼→ Response
        └→ API C ─┘
```

The dependency latency becomes closer to:

```text
max(A, B, C)
```

rather than:

```text
A + B + C
```

This is why dependency topology directly affects performance.

---

# 15. N+1 Network Dependencies

The classic N+1 problem is not limited to database queries.

It can happen across HTTP services.

Bad:

```text
Fetch 50 products
       ↓
50 API requests for metadata
```

Instead of:

```text
Fetch products
       ↓
Batch metadata request
```

or:

```text
Aggregated API
```

Network-level N+1 behavior can produce severe latency and load amplification.

---

# 16. Distributed State

A scalable application should distinguish between:

### Ephemeral state

State tied to a particular runtime instance.

Examples:

* in-memory variables
* local caches
* process-local locks
* temporary buffers

### Durable/shared state

State accessible across instances.

Examples:

* database
* distributed cache
* object storage
* durable queue

The architectural invariant is:

```text
instance-local state
≠
system-wide state
```

---

# 17. Stateless Application Design

Horizontal scaling works best when application instances can be replaced freely.

Ideal:

```text
           Load Balancer
          /      |      \
         ↓       ↓       ↓
       App A   App B   App C
          \      |      /
           Shared State
```

Any request can reach any instance.

This enables:

* autoscaling
* rolling deployments
* failover
* replacement
* multi-region deployment

---

# 18. Why In-Memory State Is Dangerous

Suppose:

```text
App A:
session = logged-in user

App B:
session = unknown
```

If the next request lands on App B:

```text
state disappears
```

This is why shared session state should generally live in a durable/shared system when multiple instances need it.

Examples:

```text
Session
   ↓
Database / Distributed Cache
```

rather than:

```text
Session
   ↓
Process Memory
```

unless the architecture intentionally uses another mechanism such as signed stateless tokens.

---

# 19. Sessions

Session architecture must answer:

```text
Where does session state live?
Who can read it?
How is it invalidated?
How does it scale?
What happens across regions?
```

Possible models include:

### Stateful session

```text
Cookie → Session ID
             ↓
          Session Store
```

### Stateless session

```text
Cookie / Token
      ↓
Encoded claims
```

Neither model is universally correct.

The decision depends on:

* revocation requirements
* token size
* security requirements
* infrastructure topology
* consistency requirements
* regional architecture

---

# 20. Distributed Cache

A distributed cache sits between the application and durable storage.

```text
Application
    ↓
Distributed Cache
    ↓ miss
Database
```

It can reduce:

* database load
* latency
* repeated computation

But it introduces another distributed dependency.

Therefore:

```text
cache availability
cache consistency
cache invalidation
cache failure
```

must be part of the architecture.

---

# 21. Cache Failure Must Have an Explicit Policy

Possible policies:

### Fail open

```text
Cache unavailable
      ↓
Read origin
```

### Fail closed

```text
Cache unavailable
      ↓
Reject request
```

### Degraded mode

```text
Cache unavailable
      ↓
Serve reduced functionality
```

The correct policy depends on the data and product semantics.

For example, a cache outage should not necessarily make an entire public website unavailable.

---

# 22. Queues and Background Jobs

Not every dependency should execute synchronously.

Instead of:

```text
HTTP Request
 ↓
Send email
 ↓
Generate report
 ↓
Process image
 ↓
Response
```

use:

```text
HTTP Request
 ↓
Persist Job
 ↓
Queue
 ↓
Background Worker
 ↓
External Service
```

The user-facing request becomes shorter and more resilient.

This introduces:

* eventual consistency
* retries
* duplicate delivery
* job visibility
* dead-letter handling
* idempotency requirements

---

# 23. Object Storage

Large or durable binary data generally belongs outside application process memory.

Examples:

* images
* videos
* documents
* exports
* backups

Architecture:

```text
Application
    ↓
Object Storage
    ↓
CDN
    ↓
User
```

This separates:

```text
compute
```

from:

```text
durable binary storage
```

and allows independent scaling.

---

# 24. Durable State vs Ephemeral Compute

A powerful deployment principle is:

```text
Compute can disappear.
State cannot.
```

Therefore:

```text
Runtime instance
    = disposable
```

while:

```text
Database / Object Storage / Durable Queue
    = persistent
```

This makes deployments and autoscaling safer.

---

# 25. Consistency Models

Distributed systems introduce different consistency guarantees.

### Strong consistency

After a successful write:

```text
subsequent reads
→ current value
```

### Eventual consistency

After a write:

```text
different readers
may temporarily observe
different values
```

This matters for:

* multi-region databases
* replicated caches
* search indexes
* analytics systems
* asynchronous workflows

The correct question is:

> What consistency does this product behavior actually require?

---

# 26. Transactions

When multiple state changes must remain logically consistent, transactions may be required.

Example:

```text
Create Order
+
Reserve Inventory
```

If only one succeeds:

```text
system state becomes inconsistent
```

A transaction can provide atomicity when both operations share the same transactional boundary.

But distributed transactions across independent systems are much more complicated.

---

# 27. Distributed Transactions

Consider:

```text
Database A
+
Payment Provider
+
Inventory Service
```

A single database transaction cannot automatically roll back all three systems.

Instead, architectures may use:

* state machines
* compensating actions
* transactional outbox
* queues
* workflow orchestration
* idempotent operations

The system must explicitly model partial failure.

---

# 28. Timeouts

Every network dependency should have a bounded timeout.

Without one:

```text
Dependency hangs
      ↓
Request waits
      ↓
Worker remains occupied
      ↓
Concurrency decreases
      ↓
Queue grows
      ↓
System becomes overloaded
```

Timeouts prevent one dependency from consuming unlimited resources.

---

# 29. Retry Architecture

Retries can recover transient failures.

But retries can also amplify failures.

Suppose:

```text
1 request
```

retries three times:

```text
1 → 2 → 3 → 4 attempts
```

At high concurrency, this can dramatically increase dependency load.

Therefore retries should consider:

* maximum attempts
* timeout budget
* exponential backoff
* jitter
* retryable status codes
* idempotency
* dependency health

---

# 30. Retry Storms

A dangerous failure pattern:

```text
Dependency slows
       ↓
Requests timeout
       ↓
Clients retries
       ↓
More requests arrive
       ↓
Dependency slows further
       ↓
More retries
```

This creates positive feedback.

Therefore:

```text
retry
```

is not automatically resilience.

It must be paired with:

```text
bounded attempts
+
backoff
+
jitter
+
timeouts
+
load protection
```

---

# 31. Circuit Breakers

A circuit breaker can prevent repeated calls to a failing dependency.

Conceptually:

```text
CLOSED
  ↓ failures
OPEN
  ↓ cooldown
HALF-OPEN
  ↓ successful probe
CLOSED
```

This prevents an unhealthy dependency from consuming all application capacity.

The key idea is:

```text
failure isolation
```

rather than simply retrying harder.

---

# 32. Bulkheads

A bulkhead prevents one dependency from consuming all available resources.

For example:

```text
App Capacity
│
├── Database requests
├── Payment requests
├── Search requests
└── Analytics requests
```

If analytics becomes slow, it should not necessarily consume every worker needed for payments.

Resource isolation can therefore reduce blast radius.

---

# 33. Idempotency

Distributed systems often produce duplicate requests.

Example:

```text
Client
 ↓
POST /payment
 ↓
Timeout
 ↓
Client retries
 ↓
POST /payment
```

Did the first request succeed?

The server may not know.

An idempotency key can allow the system to treat repeated requests as the same logical operation.

Conceptually:

```text
Idempotency Key
      ↓
Operation Record
      ↓
Return Existing Result
```

This is particularly important for:

* payments
* orders
* provisioning
* mutations
* job creation

---

# 34. Distributed Locks

Some workflows require coordination.

Example:

```text
App A ──┐
        ├── acquire lock → process job
App B ──┘
```

But distributed locks introduce difficult failure cases:

* lock expiration
* process crash
* network partition
* clock assumptions
* duplicate ownership
* stale lock holders

Therefore locks should not be introduced casually.

Often an idempotent operation or queue-based design is safer.

---

# 35. Cross-Region Data Dependencies

Multi-region deployment introduces another dimension:

```text
Region A
  App
   ↓
 Region A DB

Region B
  App
   ↓
 Region B DB
```

Questions immediately arise:

* Is data replicated?
* How quickly?
* Is replication synchronous?
* Which region owns writes?
* Can both regions write?
* What happens during partition?
* How are conflicts resolved?

Global compute does not automatically imply global data consistency.

---

# 36. Single-Writer Architecture

A common model is:

```text
Region A ──┐
Region B ──┼──→ Primary Database
Region C ──┘
```

Reads may be distributed, while writes have a defined authority.

This simplifies consistency but can introduce:

* write latency
* regional dependency
* failover complexity

---

# 37. Multi-Writer Architecture

Another model:

```text
Region A → DB A
Region B → DB B
Region C → DB C
```

Now the system must handle:

```text
conflicting writes
replication
ordering
consistency
conflict resolution
```

This is substantially more complex.

The architectural principle is:

```text
more regions
≠
automatically better availability
```

because the data plane becomes harder to coordinate.

---

# 38. Data Residency

Some applications must control where data is stored or processed.

Therefore deployment topology may be constrained by:

```text
user region
tenant region
regulatory requirements
data classification
```

Architecture may become:

```text
Tenant A
   ↓
EU Region
   ↓
EU Data Store

Tenant B
   ↓
US Region
   ↓
US Data Store
```

This is both a deployment and data-architecture concern.

---

# 39. Dependency Failure Domains

Dependencies should be classified by failure domain.

Example:

```text
Application
   │
   ├── Database
   ├── Redis
   ├── Search
   └── Payments
```

If Redis fails:

```text
Does the whole application fail?
```

If Search fails:

```text
Can search functionality degrade
while checkout continues?
```

If Payments fails:

```text
Should browsing remain available?
```

These questions determine architecture.

---

# 40. Critical vs Non-Critical Dependencies

Classify dependencies.

### Critical

Without it, the requested operation cannot safely complete.

Examples:

```text
checkout → payment authorization
```

### Non-critical

The core operation can still complete.

Examples:

```text
checkout → analytics event
```

A useful architecture is:

```text
Critical dependency
→ bounded failure
→ explicit error

Non-critical dependency
→ asynchronous/degraded behavior
```

---

# 41. Dependency Graph

A production system can be represented as:

```text
                    ┌→ Cache
                    │
Request → App ──────┼→ Database
                    │
                    ├→ Search
                    │
                    ├→ Payment
                    │
                    └→ Queue
```

Each edge should conceptually have:

```text
timeout
retry policy
authentication
capacity
failure behavior
observability
```

This transforms a dependency graph into a resilience architecture.

---

# 42. Network Failure Is Normal

Production networks fail in many ways:

* DNS failure
* connection timeout
* TLS failure
* connection reset
* packet loss
* routing failure
* load balancer failure
* regional outage
* dependency overload
* database failover
* firewall misconfiguration

The architecture should assume:

```text
network calls can fail
```

rather than:

```text
network calls always succeed
```

---

# 43. Dependency Timeouts Must Respect the Request Budget

Suppose:

```text
Request budget = 1 second
```

and the application calls:

```text
API A timeout = 2 seconds
```

The dependency can outlive the request's useful lifetime.

Instead:

```text
Request
  ↓
Dependency timeout
  ≤
Request timeout
```

Timeouts should form a coherent hierarchy.

---

# 44. Observability of Network Dependencies

For every important dependency, observe:

```text
request count
success rate
error rate
latency
timeout rate
retry count
connection pool usage
saturation
```

Useful dimensions include:

```text
service
region
endpoint
dependency
status
release
tenant
```

But high-cardinality labels must be controlled.

---

# 45. Connection Pool Observability

Database pool metrics can reveal failures before database CPU does.

Important metrics:

```text
active connections
idle connections
pool size
wait time
connection creation rate
connection errors
timeouts
```

Example failure:

```text
DB CPU = 40%
Application errors = high
Pool utilization = 100%
```

The database itself may be healthy while the application is unable to obtain connections.

---

# 46. Deployment and Networking Interaction

A deployment can change networking behavior.

Examples:

* new region
* new database endpoint
* changed security group
* new DNS record
* changed load balancer
* changed service discovery
* changed connection pool size

Therefore:

```text
deployment correctness
```

includes:

```text
network correctness
```

---

# 47. Deployment-Safe Data Dependencies

Application version changes must remain compatible with dependencies.

Example:

```text
Old App
  ↓
Database schema V1

New App
  ↓
Database schema V2
```

A rolling deployment may temporarily run:

```text
Old App + New App
```

simultaneously.

Therefore migrations often need:

```text
expand
 ↓
deploy compatible code
 ↓
migrate data
 ↓
contract
```

rather than immediately removing old fields.

---

# 48. The Expand-Contract Pattern

Example:

### Expand

Add:

```text
new_column
```

while keeping:

```text
old_column
```

### Deploy

New and old application versions both work.

### Migrate

Backfill:

```text
old_column → new_column
```

### Switch

New application reads/writes the new field.

### Contract

Remove old dependency only after all old versions are gone.

This allows rolling deployments without requiring instantaneous compatibility.

---

# 49. Network Topology and Runtime Selection

The same application can behave differently depending on runtime location.

Example:

```text
App Region A
    ↓
DB Region B
```

may create:

```text
high latency
```

while:

```text
App Region A
    ↓
DB Region A
```

may provide lower latency.

Therefore runtime placement should consider data placement.

A powerful invariant is:

```text
compute locality should consider data locality
```

---

# 50. Avoiding Accidental Cross-Region Calls

A global application can accidentally introduce:

```text
User → Region A App
             ↓
        Region B API
             ↓
        Region C DB
```

This may work functionally while creating unacceptable latency.

Architecture should make regional dependency paths explicit.

---

# 51. Networking and Caching

Caching can reduce cross-network dependency pressure.

Instead of:

```text
App Region A
 ↓
Database Region B
```

a read-heavy workload may use:

```text
App Region A
 ↓
Regional Cache
 ↓ miss
Database Region B
```

But this trades:

```text
network latency
```

for:

```text
cache consistency complexity
```

The tradeoff must be explicit.

---

# 52. Networking and Queues

Queues can decouple geographically distant or slow dependencies.

Instead of:

```text
Request
 ↓
Remote Service
 ↓
Wait
```

use:

```text
Request
 ↓
Local Queue
 ↓
Worker
 ↓
Remote Service
```

This changes the consistency model from:

```text
synchronous
```

to:

```text
asynchronous / eventual
```

That can improve resilience when the product semantics permit it.

---

# 53. Failure Containment

A mature architecture defines blast radius.

For example:

```text
Analytics outage
      ↓
Queue events
      ↓
Core product remains operational
```

rather than:

```text
Analytics outage
      ↓
Every request fails
```

This is the essence of dependency isolation.

---

# 54. Production Failure Scenario: Database Connection Exhaustion

### Symptoms

```text
5xx errors increase
DB CPU remains moderate
```

Investigation:

```text
Application
 ↓
Connection pool saturated
 ↓
Requests waiting
 ↓
Timeouts
```

Root cause might be:

* too many instances
* excessive pool size
* leaked connections
* slow queries
* long transactions

The solution is not necessarily "increase database size."

First understand:

```text
runtime scale
→ pool configuration
→ connection demand
→ database capacity
```

---

# 55. Production Failure Scenario: External API Slows Down

Architecture:

```text
App
 ↓
External API
```

External API latency increases.

Without protection:

```text
requests wait
 ↓
workers saturate
 ↓
application latency increases
 ↓
timeouts
```

A resilient design may use:

```text
timeout
+
bounded concurrency
+
retry policy
+
circuit breaker
+
fallback/degraded behavior
```

---

# 56. Production Failure Scenario: Regional Data Latency

Suppose:

```text
App → DB
```

suddenly becomes:

```text
App Region A → DB Region B
```

Latency rises.

Possible causes:

* routing change
* failover
* regional outage
* deployment misconfiguration
* incorrect database endpoint

Observability should make the network path visible.

---

# 57. Production Failure Scenario: Retry Amplification

Dependency returns:

```text
503
```

Application retries aggressively.

Result:

```text
Dependency already overloaded
        ↓
more traffic
        ↓
more overload
        ↓
more failures
```

Correct response:

```text
bounded retries
+
backoff
+
jitter
+
circuit breaking
+
load shedding
```

---

# 58. Production Failure Scenario: Statelessness Violation

Deployment scales from:

```text
1 instance
```

to:

```text
10 instances
```

An in-memory session mechanism begins failing because users move between instances.

The underlying problem is not load balancing.

The problem is:

```text
shared state was incorrectly placed in local process memory
```

---

# 59. Production Failure Scenario: Cache Dependency Outage

If the application requires cache availability for every request:

```text
Cache outage
   ↓
Application outage
```

If cache is merely an optimization:

```text
Cache outage
   ↓
Origin reads
   ↓
Higher latency/load
```

This distinction should be deliberate.

---

# 60. Production Dependency Decision Framework

For every external dependency ask:

### 1. Is it critical?

```text
Can the request succeed without it?
```

### 2. Is it synchronous?

```text
Must the user wait?
```

### 3. What is the timeout?

```text
How long can it consume resources?
```

### 4. Is retry safe?

```text
Could retry duplicate an operation?
```

### 5. What is the fallback?

```text
Can the application degrade?
```

### 6. Where does state live?

```text
Local / shared / durable?
```

### 7. What happens during regional failure?

```text
Failover / degrade / reject?
```

### 8. How is it observed?

```text
Latency / errors / saturation / dependency health?
```

---

# 61. Four-Pillar Engineering Matrix

Every networking decision should be evaluated across four dimensions.

| Pillar           | Questions                                                                          |
| ---------------- | ---------------------------------------------------------------------------------- |
| **Mechanics**    | How do DNS, connections, routing, pools and dependencies actually work?            |
| **Architecture** | Where are compute, network and state boundaries placed?                            |
| **Operations**   | How are failures, saturation, failover and deployments handled?                    |
| **Judgment**     | When should state be local/shared, sync/async, single/multi-region, cached/origin? |

The goal is not to memorize networking vocabulary.

The goal is to predict system behavior.

---

# 62. Prediction Challenges

Before considering this part complete, you should be able to predict:

### Challenge 1

```text
100 server instances
×
20 DB connections each
```

What happens to database connection capacity?

---

### Challenge 2

A dependency timeout is longer than the request timeout.

What failure behavior can result?

---

### Challenge 3

An application is deployed across three regions but uses one centralized database.

What does that imply for latency and availability?

---

### Challenge 4

A cache becomes unavailable.

Should every request fail?

What architectural property determines the answer?

---

### Challenge 5

A POST request times out and the client retries.

How do you prevent duplicate mutation?

---

### Challenge 6

An external API becomes slow.

Why can retries make the outage worse?

---

### Challenge 7

A rolling deployment changes a database schema.

Why can immediately removing the old schema break production?

---

### Challenge 8

An application is horizontally scaled.

Which categories of state can remain process-local safely?

---

### Challenge 9

A global deployment sends European users to an American database.

What latency and architecture problems might appear?

---

### Challenge 10

A non-critical analytics service fails.

How should that affect the core request?

---

# 63. Senior-Level Interview Questions

You should be able to answer these without relying on memorized definitions.

### Networking

1. Walk through the complete network path of a production Next.js request.
2. What is the difference between ingress and egress?
3. Why should databases generally remain private?
4. What role does DNS play in deployment architecture?
5. What happens during TLS connection establishment?

### Database Connectivity

6. Why can horizontal application scaling exhaust database connections?
7. How does serverless execution change connection-pooling considerations?
8. How would you diagnose connection-pool saturation?
9. When would you use a connection proxy or pooling layer?

### Distributed State

10. Why is process-local state dangerous in horizontally scaled systems?
11. When is stateless authentication preferable to server-side sessions?
12. What belongs in durable storage rather than application memory?

### Resilience

13. When should a dependency call have a timeout?
14. When is retry appropriate?
15. Why can retries amplify outages?
16. What problem does a circuit breaker solve?
17. What problem does a bulkhead solve?
18. When do you need idempotency?

### Distributed Data

19. Strong consistency vs eventual consistency?
20. Single-region vs multi-region data?
21. Single-writer vs multi-writer?
22. How would you design around cross-region latency?
23. How would you perform a backward-compatible schema migration?

### Architecture

24. How would you classify dependencies as critical vs non-critical?
25. How would you design graceful degradation?
26. How would you prevent one dependency from taking down the entire application?
27. How would you reason about compute locality versus data locality?

---

# 64. Reference Architecture

A production deployment topology can be modeled as:

```text
                         Internet
                            │
                            ↓
                          DNS
                            │
                            ↓
                    Global Traffic Router
                            │
                            ↓
                         CDN / Edge
                            │
                            ↓
                    Load Balancer / Ingress
                            │
                 ┌──────────┴──────────┐
                 ↓                     ↓
             Region A               Region B
                 │                     │
              App Pool              App Pool
                 │                     │
       ┌─────────┼─────────┐   ┌───────┼────────┐
       ↓         ↓         ↓   ↓       ↓        ↓
     Cache      DB       Queue Cache   DB      Queue
       │                   │             │
       └──────────┬────────┘             │
                  ↓                      ↓
             Object Storage        External APIs
```

The exact topology will vary.

The important architectural properties are:

```text
public/private boundaries
+
stateless compute
+
explicit durable state
+
bounded dependencies
+
controlled network paths
+
regional strategy
+
failure isolation
+
observability
```

---

# 65. Core Invariants

These should become part of your permanent mental model.

```text
network calls can fail
```

```text
horizontal scaling increases dependency pressure
```

```text
application scale ≠ database scale
```

```text
process memory ≠ distributed state
```

```text
durable state should survive compute replacement
```

```text
timeouts are resource-protection mechanisms
```

```text
retries can amplify failures
```

```text
idempotency is required when duplicate operations are possible
```

```text
global compute ≠ global data consistency
```

```text
compute locality should consider data locality
```

```text
critical dependencies require explicit failure behavior
```

```text
deployment correctness includes dependency compatibility
```

```text
resilience is primarily about controlling blast radius
```

---

# 66. Completion Checklist

You have completed Part 06 when you can independently explain:

* [ ] Production network request topology
* [ ] DNS and traffic routing
* [ ] Ingress and egress
* [ ] Public and private network boundaries
* [ ] VPC/VNet/subnet concepts
* [ ] Firewall/security-group boundaries
* [ ] TLS and connection establishment
* [ ] Application-to-database connectivity
* [ ] Connection pooling
* [ ] Serverless connection exhaustion
* [ ] Latency budgets
* [ ] Sequential vs parallel dependencies
* [ ] Network-level N+1 problems
* [ ] Stateless application architecture
* [ ] Ephemeral vs durable state
* [ ] Session architecture
* [ ] Distributed caching
* [ ] Cache failure behavior
* [ ] Queues and asynchronous work
* [ ] Object storage
* [ ] Strong vs eventual consistency
* [ ] Transactions
* [ ] Distributed transaction challenges
* [ ] Timeouts
* [ ] Retry architecture
* [ ] Retry storms
* [ ] Circuit breakers
* [ ] Bulkheads
* [ ] Idempotency
* [ ] Distributed locks
* [ ] Cross-region dependencies
* [ ] Single-writer architecture
* [ ] Multi-writer architecture
* [ ] Data residency
* [ ] Failure domains
* [ ] Critical vs non-critical dependencies
* [ ] Dependency observability
* [ ] Deployment-safe schema changes
* [ ] Expand-contract migrations
* [ ] Compute/data locality
* [ ] Failure containment
* [ ] Production networking diagnosis

---

# 67. Boundary of This Part

This part owns:

```text
network topology
+
dependency connectivity
+
distributed state
+
connection lifecycle
+
dependency resilience
+
data placement
```

It does **not** primarily own:

* configuration/secrets → Part 07
* runtime lifecycle/readiness/shutdown → Part 08
* deployment observability and production verification → Part 09
* end-to-end deployment architecture → Part 10

The boundary is intentional.

Part 06 answers:

> **How does the deployed application communicate with the systems it depends on, where does state live, and how does the architecture behave when those dependencies fail or become distributed?**

---

# Final Mental Model

The production application should be understood as:

```text
                REQUEST
                   │
                   ↓
             Network Path
                   │
                   ↓
            Runtime Instance
                   │
        ┌──────────┼───────────┐
        ↓          ↓           ↓
     Database    Cache       Services
        │          │           │
        └──────────┼───────────┘
                   ↓
             Durable State
                   │
                   ↓
            Async Processing
                   │
                   ↓
             External Systems
```

And every dependency should have an explicit answer for:

```text
Where is it?
How is it reached?
How long may it take?
How does it scale?
Where does its state live?
What happens when it fails?
Can the operation be retried?
Can it be duplicated?
Can the request degrade?
How is it observed?
What happens during deployment?
What happens across regions?
```

That is the networking and distributed-state layer of deployment architecture.

**Next canonical part: KPI 11 — Part 07: Configuration, Secrets, Environment Isolation & Runtime Configuration Architecture.**
