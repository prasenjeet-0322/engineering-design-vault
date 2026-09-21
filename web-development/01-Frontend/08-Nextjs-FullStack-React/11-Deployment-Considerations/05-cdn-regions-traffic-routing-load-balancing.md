# Level 08 — KPI 11 — Part 05

## CDN, Regions, Traffic Routing, Load Balancing & Global Delivery Architecture

---

## 1. Part Objective

Part 04 established **where application code executes**.

This part establishes **how user traffic reaches that application**.

The focus is the delivery and traffic-management layer:

* CDN architecture
* edge locations
* regions
* origins
* DNS routing
* traffic routing
* load balancing
* reverse proxies
* regional failover
* global traffic distribution
* cache layers
* origin shielding
* health-aware routing
* latency-aware routing
* geographic routing
* weighted routing
* failover routing
* deployment traffic shifting
* request affinity
* connection termination
* TLS termination
* global delivery failure modes

The senior-level question is:

> **Given a user request, how does the system determine where that request should go, what can be served at the edge, and when traffic should reach the origin?**

The fundamental path is:

```text
User
  ↓
DNS
  ↓
CDN / Edge
  ↓
Traffic Router
  ↓
Load Balancer
  ↓
Regional Origin
  ↓
Application Runtime
  ↓
Dependencies
```

---

# 2. Why Traffic Architecture Matters

A deployed application is not useful merely because it exists in a region.

Users must reach it.

That creates a separate architecture layer:

```text
Application Runtime
        +
Traffic Delivery
        +
Network Topology
```

Two applications with identical application code can have radically different performance and reliability depending on:

* where users connect
* where DNS resolves
* where TLS terminates
* where cache hits occur
* where requests are routed
* where the origin lives
* where the database lives
* how failures are detected

Therefore:

```text
application performance
≠
application code performance alone
```

---

# 3. The End-to-End Traffic Mental Model

Start with the request path:

```text
Browser
   ↓
DNS
   ↓
CDN / Edge
   ↓
Edge Routing
   ↓
Load Balancer
   ↓
Application Instance
   ↓
Database / Cache / APIs
```

At each layer ask:

1. Who receives the request?
2. What decision does that layer make?
3. Can it terminate the request?
4. Can it cache the response?
5. Can it modify the request?
6. Can it route elsewhere?
7. What happens if the next layer fails?

This creates an explicit traffic graph.

---

# 4. CDN Mental Model

A CDN is a distributed network of edge locations positioned closer to users.

Conceptually:

```text
                 ┌── Edge A
                 │
User ── CDN ─────┼── Edge B
                 │
                 └── Edge C
                       ↓
                     Origin
```

The CDN can potentially serve:

* static assets
* images
* fonts
* JavaScript
* CSS
* cacheable HTML
* cacheable API responses

without contacting the origin for every request.

---

# 5. Edge vs Origin

Define the terms precisely.

### Edge

The geographically distributed request-processing and caching layer closer to users.

### Origin

The authoritative backend that can generate or retrieve the requested representation.

For example:

```text
User
 ↓
Edge
 ↓ cache miss
Origin
 ↓
Response
 ↓
Edge cache
 ↓
User
```

On subsequent requests:

```text
User
 ↓
Edge cache hit
 ↓
User
```

The origin is bypassed.

---

# 6. The Most Important CDN Question

Do not ask:

> "Is this endpoint behind a CDN?"

Ask:

> **"Under which conditions can this representation be served from the edge without contacting the origin?"**

That requires understanding:

* cacheability
* cache key
* freshness
* invalidation
* authentication
* personalization
* request headers
* cookies
* query parameters
* response headers

---

# 7. CDN Cache Hit

Suppose:

```text
GET /products/123
```

exists in the edge cache.

The request can follow:

```text
User
 ↓
Edge
 ↓
Cache hit
 ↓
Response
```

Origin work:

```text
0
```

This can reduce:

* latency
* origin CPU
* database traffic
* bandwidth from origin
* regional dependency load

---

# 8. CDN Cache Miss

If the representation does not exist:

```text
User
 ↓
Edge
 ↓
Cache miss
 ↓
Origin
 ↓
Application
 ↓
Database
```

The origin generates the response.

The CDN may then store the result:

```text
Origin Response
      ↓
Edge Cache
      ↓
User
```

The next request may avoid the origin.

---

# 9. Cache Hit Ratio

A useful operational metric is:

```text
cache hit ratio
=
cache hits
─────────────
total cacheable requests
```

For example:

```text
900 hits
100 misses
─────────
1000 requests
```

gives:

```text
90% hit ratio
```

But a high hit ratio does not automatically mean the system is correct.

A cached response can be:

* stale
* wrong
* personalized
* cross-tenant
* incorrectly keyed

Therefore:

```text
cache efficiency
≠
cache correctness
```

---

# 10. Cache Identity

The CDN needs to determine whether two requests can share a representation.

Conceptually:

```text
Request
  ↓
Cache Key
  ↓
Representation
```

A cache key may depend on:

```text
URL
Host
Query Parameters
Selected Headers
Locale
Device Class
Tenant
Authorization Context
```

The exact key is platform-specific.

The architectural principle is universal:

> **Requests that produce different representations must not collide in the cache.**

---

# 11. Cache-Key Explosion

Suppose a response varies by:

```text
tenant
locale
currency
device
user segment
theme
```

The number of possible variants can grow rapidly.

Conceptually:

```text
10 tenants
× 5 locales
× 3 currencies
× 2 devices
× 4 segments
```

creates:

```text
10 × 5 × 3 × 2 × 4
= 1,200 variants
```

per resource.

This can reduce cache efficiency and increase storage requirements.

Therefore:

> Every cache variation dimension has a cost.

---

# 12. CDN Caching and Personalization

Suppose:

```text
GET /dashboard
```

returns user-specific information.

A shared CDN cache is dangerous if:

```text
User A
 ↓
Personalized response
 ↓
Shared cache
```

and then:

```text
User B
 ↓
Same cache key
 ↓
User A's response
```

The architecture must distinguish:

```text
public representation
```

from:

```text
private/personalized representation
```

This is a security boundary.

---

# 13. CDN and Authentication

Authentication does not automatically imply:

```text
no CDN
```

Instead ask:

> Can the requested representation be shared safely?

For example:

```text
Public product page
+
logged-in user
```

may still be publicly cacheable if the representation does not depend on the user.

Whereas:

```text
Account dashboard
```

usually has user-specific data.

Therefore:

```text
authentication state
≠
automatic cache policy
```

The representation determines the policy.

---

# 14. CDN as a Request-Termination Layer

A CDN does more than cache.

It may also perform:

* TLS termination
* redirects
* rewrites
* bot filtering
* WAF checks
* header normalization
* compression
* image optimization
* request routing
* rate limiting

Conceptually:

```text
Client
 ↓
Edge
 ├── TLS
 ├── Security
 ├── Routing
 ├── Cache
 └── Transformation
       ↓
     Origin
```

This makes the edge a meaningful part of application architecture.

---

# 15. TLS Termination

HTTPS connections may terminate at the edge:

```text
Browser
   │ HTTPS
   ▼
CDN / Edge
   │ internal connection
   ▼
Origin
```

The edge can therefore handle:

* certificate negotiation
* TLS connection management
* HTTP protocol handling

The connection from edge to origin can then follow the platform's security model.

---

# 16. Why TLS at the Edge Helps

A global CDN can absorb connection establishment close to users.

This can reduce the cost of repeatedly establishing long-distance connections to the origin.

The edge effectively becomes:

```text
global client-facing network boundary
```

while the origin remains:

```text
application execution boundary
```

---

# 17. DNS as the First Routing Layer

Before an HTTP request reaches the CDN, DNS often participates in determining where the client connects.

Conceptually:

```text
Browser
 ↓
DNS Resolver
 ↓
DNS Answer
 ↓
Endpoint
```

DNS can participate in:

* geographic routing
* weighted routing
* failover
* regional routing
* service discovery

But DNS is not an instantaneous global traffic switch.

Caching and resolver behavior affect how quickly changes propagate.

---

# 18. DNS TTL

DNS responses can be cached.

Conceptually:

```text
Authoritative DNS
       ↓
Resolver Cache
       ↓
Client
```

If the authoritative answer changes:

```text
new routing
```

existing resolver caches may continue using:

```text
old routing
```

until their TTL expires.

Therefore:

> DNS-based failover has propagation characteristics.

---

# 19. DNS Is Not a Health Check by Itself

A DNS record saying:

```text
region-a.example.com
```

does not guarantee Region A is healthy.

A production traffic architecture may combine:

```text
Health Monitoring
      +
DNS / Global Router
      +
Regional Load Balancer
```

The router can then avoid unhealthy regions according to the platform's capabilities.

---

# 20. Regional Architecture

A multi-region application might look like:

```text
                    Global Router
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
          Region A               Region B
              │                     │
         Load Balancer         Load Balancer
              │                     │
         Application           Application
              │                     │
              ▼                     ▼
           Cache A                Cache B
              │                     │
              └──────────┬──────────┘
                         ▼
                     Data Layer
```

The data layer determines whether true multi-region operation is possible.

---

# 21. Multi-Region Does Not Automatically Mean Multi-Region Data

Suppose:

```text
Region A → Database A
Region B → Database B
```

Now ask:

> How is data synchronized?

Possible models include:

* primary/replica
* asynchronous replication
* synchronous replication
* globally distributed database
* region-local data
* partitioned tenancy

Each model has different consistency and failure characteristics.

Therefore:

```text
multi-region compute
≠
multi-region application
```

---

# 22. Latency-Based Routing

A global router may attempt to direct users toward a low-latency region.

Conceptually:

```text
User Europe
    ↓
Region Europe

User Asia
    ↓
Region Asia

User America
    ↓
Region America
```

But latency to compute is only one dimension.

You must also consider:

* database location
* cache state
* dependency location
* consistency
* user data residency
* failover
* cold capacity

---

# 23. Geographic Routing

Geographic routing uses location-derived rules.

Example:

```text
India
 ↓
Asia Region

Germany
 ↓
Europe Region

US
 ↓
US Region
```

This can be useful for:

* data residency
* compliance boundaries
* latency
* regional product availability

But geography is not identical to actual network latency.

---

# 24. Weighted Routing

Traffic can be intentionally divided:

```text
Region A → 90%
Region B → 10%
```

This is useful for:

* canary releases
* migrations
* regional testing
* capacity balancing
* gradual infrastructure changes

Example:

```text
100 requests

90 → version A
10 → version B
```

This provides controlled exposure.

---

# 25. Failover Routing

A simple failover model:

```text
Primary Region
      ↓
Healthy?
  ┌───┴───┐
 Yes      No
  ↓        ↓
Serve   Secondary
        Region
```

But a mature architecture must also ask:

* How quickly is failure detected?
* What counts as unhealthy?
* Is the secondary warm?
* Is its cache populated?
* Is its database current?
* Are writes safe?
* Will traffic fail back automatically?

---

# 26. Cold Failover vs Warm Failover

### Cold failover

Secondary infrastructure is largely inactive.

Advantages:

* lower cost

Disadvantages:

* slower recovery
* capacity may need to start
* caches may be cold

### Warm failover

Secondary infrastructure is already running.

Advantages:

* faster recovery
* capacity already available

Disadvantages:

* higher ongoing cost
* operational complexity

---

# 27. Load Balancing

Within a region, a load balancer can distribute traffic across application instances.

```text
                  Load Balancer
                 /      |      \
                /       |       \
              App A   App B   App C
```

Possible strategies include:

* round robin
* weighted routing
* least connections
* latency-aware selection
* health-aware selection

The actual strategy depends on the infrastructure.

---

# 28. Health-Aware Load Balancing

Suppose:

```text
App A → healthy
App B → unhealthy
App C → healthy
```

The load balancer should avoid App B.

This requires health information.

Conceptually:

```text
Health Checks
     ↓
Load Balancer
     ↓
Healthy Instance Set
```

Traffic routing and health monitoring are therefore coupled.

---

# 29. Load Balancer vs CDN

They solve different but overlapping problems.

### CDN

Primarily:

* global edge delivery
* caching
* client proximity
* edge processing

### Load balancer

Primarily:

* distribute traffic across origins/instances
* health-aware routing
* capacity distribution
* connection management

A production system may use both:

```text
Client
 ↓
CDN
 ↓
Load Balancer
 ↓
Application Instances
```

---

# 30. Reverse Proxy Mental Model

A reverse proxy sits in front of application servers.

```text
Client
 ↓
Reverse Proxy
 ↓
Application
```

It can perform:

* routing
* TLS termination
* compression
* header manipulation
* caching
* access control
* connection management

CDNs and load balancers often provide reverse-proxy capabilities.

---

# 31. Connection Reuse

Without connection reuse:

```text
Client
 ↓
new connection
 ↓
Origin
```

repeatedly establishes connections.

With persistent connections:

```text
Connection
 ├── Request 1
 ├── Request 2
 ├── Request 3
 └── Request 4
```

This can reduce connection overhead.

Modern HTTP protocols further change the mechanics through:

* HTTP/2
* HTTP/3
* multiplexing
* connection reuse

The important architectural idea is:

> Network connection management is part of performance.

---

# 32. HTTP/2 and Multiplexing

HTTP/2 can multiplex multiple request/response streams over one connection.

Conceptually:

```text
One Connection
 ├── Stream A
 ├── Stream B
 ├── Stream C
 └── Stream D
```

This reduces the need for multiple independent TCP connections.

A CDN can therefore provide substantial connection-management benefits before the request reaches the application.

---

# 33. HTTP/3 and QUIC

HTTP/3 operates over QUIC rather than TCP.

At a high level, QUIC provides:

* encrypted transport
* stream multiplexing
* connection migration
* reduced connection-establishment overhead in appropriate scenarios

For frontend architecture, the key point is:

> The delivery network can influence transport performance before application code executes.

---

# 34. Origin Shielding

Imagine many edge locations all miss the cache simultaneously.

Without shielding:

```text
Edge A ─┐
Edge B ─┼──→ Origin
Edge C ─┤
Edge D ─┘
```

Origin receives many requests.

With an origin shield:

```text
Edge A ─┐
Edge B ─┼──→ Shield ──→ Origin
Edge C ─┤
Edge D ─┘
```

The shield can consolidate origin traffic.

This can reduce:

* origin request volume
* connection count
* duplicate cache misses
* origin bandwidth

---

# 35. Cache Stampede

Suppose a popular cache entry expires.

Thousands of requests arrive:

```text
Cache expired
      ↓
Request 1 ─┐
Request 2 ─┤
Request 3 ─┼──→ Origin
Request 4 ─┤
Request 5 ─┘
```

The origin receives a sudden burst.

Possible mitigation:

* request coalescing
* stale-while-revalidate
* origin shielding
* cache warming
* locking/single-flight
* staggered expiration

---

# 36. Stale-While-Revalidate

A cached representation can sometimes continue serving stale data while a background refresh occurs.

Conceptually:

```text
Request
 ↓
Stale but usable cache
 ↓
Return response

Background:
 ↓
Fetch fresh origin representation
 ↓
Update cache
```

This can reduce latency spikes caused by synchronous cache regeneration.

---

# 37. CDN and Revalidation

A CDN may use:

```text
TTL
ETag
Last-Modified
Cache-Control
revalidation
```

to determine whether cached content can continue being used.

The important distinction is:

```text
fresh
stale
revalidated
invalidated
```

These states should not be treated as interchangeable.

---

# 38. Cache Invalidation

Suppose:

```text
/products/123
```

is cached.

Product information changes.

You now need to decide:

```text
wait for TTL?
revalidate?
purge?
version URL?
tag-based invalidation?
```

The correct strategy depends on the representation's freshness requirements.

---

# 39. Immutable Assets

Static assets are often ideal CDN candidates when their URLs are content-versioned.

For example:

```text
/app.abc123.js
```

A new deployment produces:

```text
/app.def456.js
```

Now the old asset can remain cached safely because its identity represents its content version.

This is the principle:

```text
immutable URL
→
long cache lifetime
→
simple invalidation
```

---

# 40. Mutable URLs

A URL such as:

```text
/logo.png
```

may represent changing content.

Long-lived caching requires stronger invalidation or versioning.

Therefore:

```text
URL identity
```

is part of cache architecture.

---

# 41. Traffic Routing and Deployment

Traffic routing can participate in deployment strategies.

Example:

```text
                 Router
                /      \
             v1         v2
             95%        5%
```

If v2 behaves correctly:

```text
90/10
70/30
50/50
10/90
0/100
```

This is progressive traffic shifting.

The routing layer becomes part of release engineering.

---

# 42. Regional Canary

Suppose version 2 is deployed only in one region.

```text
Region A → v2
Region B → v1
Region C → v1
```

This provides another form of controlled release.

If problems appear:

```text
remove v2 traffic
```

without necessarily rolling back every region.

---

# 43. Session Affinity

Some applications attempt to route the same user repeatedly to the same instance.

This is called affinity or stickiness.

Conceptually:

```text
User A
 ↓
Instance A

User A
 ↓
Instance A
```

It can simplify some stateful systems.

But it can also:

* reduce load-balancing flexibility
* create uneven load
* complicate failover
* hide incorrect state architecture

A better distributed design usually minimizes dependence on affinity.

---

# 44. Stateless Application Preference

A horizontally scalable application ideally behaves like:

```text
Request
+
Shared Durable State
→
Response
```

rather than:

```text
Request
+
specific instance memory
→
Response
```

Statelessness improves:

* scaling
* failover
* deployment
* routing flexibility

This does not mean the application cannot use in-memory state for optimization.

It means correctness should not require a particular instance.

---

# 45. Global Delivery and Cookies

Cookies can affect caching and routing.

Potential dimensions include:

```text
session cookie
locale cookie
experiment cookie
authentication cookie
tenant cookie
```

If a response varies based on these values, the delivery architecture must ensure that the cache and routing layers understand the variation.

Otherwise:

```text
request identity
```

and:

```text
representation identity
```

can diverge.

---

# 46. Host-Based Routing

Multi-tenant systems may route based on hostname:

```text
tenant-a.example.com
tenant-b.example.com
```

The edge may resolve:

```text
Host
 ↓
Tenant
 ↓
Region
 ↓
Application
```

The routing layer must preserve tenant isolation.

A cache key that ignores tenant identity can cause cross-tenant data exposure.

---

# 47. Locale Routing

Traffic may also depend on locale:

```text
/en/products/123
/fr/products/123
/de/products/123
```

or:

```text
Accept-Language
```

Locale can affect:

* routing
* content
* metadata
* caching
* origin selection

Therefore locale is another potential representation dimension.

---

# 48. Security at the Edge

The delivery layer is an important security boundary.

Possible controls include:

* WAF
* rate limiting
* bot mitigation
* IP filtering
* request-size limits
* DDoS protection
* TLS enforcement
* header normalization

The principle is:

> Reject obviously invalid or abusive traffic as early as practical.

This prevents expensive origin work.

---

# 49. DDoS and Origin Protection

Suppose malicious traffic generates:

```text
1 million requests
```

If every request reaches:

```text
Application
 ↓
Database
```

the origin may collapse.

Edge protection can absorb or reject traffic before it reaches expensive dependencies.

```text
Internet
 ↓
Edge Security
 ↓
Valid traffic only
 ↓
Origin
```

This is both a security and reliability strategy.

---

# 50. Rate Limiting Placement

Rate limiting can exist at multiple layers:

```text
Global edge
Regional edge
API gateway
Application
Database
```

Each layer sees different information.

For example:

### Edge

Good for:

* IP-based protection
* global abuse control

### Application

Good for:

* authenticated user limits
* tenant quotas
* business-specific policies

Therefore rate limiting often requires multiple layers.

---

# 51. Traffic Routing Failure Scenario

Suppose Region A becomes unhealthy.

A mature system should reason through:

```text
Health signal
 ↓
Router detects failure
 ↓
Traffic shifts
 ↓
Region B receives traffic
 ↓
Capacity verified
 ↓
Application serves requests
```

But then ask:

```text
Is Region B's cache warm?
Is Region B's database current?
Can Region B handle write traffic?
Will authentication still work?
Are external dependencies reachable?
```

Failover is not merely a routing change.

---

# 52. Global Failover and Data Consistency

Suppose a user writes:

```text
Order = Paid
```

in Region A.

Immediately afterward Region A fails.

Traffic moves to Region B.

If Region B's data is stale:

```text
Region B
Order = Pending
```

The traffic router succeeded.

The application still appears broken.

Therefore:

```text
traffic failover
+
data consistency
```

must be designed together.

---

# 53. Region Selection as a Data Problem

The routing decision may need to consider:

```text
User Location
Tenant
Data Residency
Database Primary
Consistency Requirements
Feature Availability
Capacity
Health
```

Therefore a mature global router is not necessarily:

```text
nearest region wins
```

It is closer to:

```text
eligible regions
    ↓
health
    ↓
policy
    ↓
capacity
    ↓
latency
    ↓
route
```

---

# 54. Origin Selection

The edge may select among origins:

```text
                Edge
                 │
       ┌─────────┼─────────┐
       ▼         ▼         ▼
    Origin A  Origin B  Origin C
```

Possible selection criteria:

* health
* weight
* geography
* latency
* capacity
* tenant
* deployment version

The origin-selection policy must be explicit.

---

# 55. Global Traffic Architecture

A mature global architecture might look like:

```text
                         Internet
                            │
                            ▼
                         DNS
                            │
                            ▼
                    Global Edge / CDN
                            │
                 ┌──────────┼──────────┐
                 ▼          ▼          ▼
              Region A   Region B   Region C
                 │          │          │
              LB/Proxy   LB/Proxy   LB/Proxy
                 │          │          │
              App Pool   App Pool   App Pool
                 │          │          │
                 └──────────┼──────────┘
                            ▼
                     Shared / Global
                       Data Layer
```

Each layer has a separate responsibility.

---

# 56. Production Scenario — Global Traffic Spike

Imagine:

```text
Normal:
10k requests/min

Event:
500k requests/min
```

Reason through:

### Edge

Can the CDN absorb static/cacheable traffic?

### Router

Can traffic be distributed safely?

### Application

Can origins autoscale?

### Database

Can the data layer handle the increased load?

### Cache

Will popular resources remain cached?

### Queue

Can asynchronous work absorb bursts?

### Observability

Can operators identify saturation?

The correct answer is never simply:

> "Enable autoscaling."

---

# 57. Production Scenario — CDN Outage

Suppose the CDN becomes unavailable.

Potential architecture:

```text
User
 ↓
CDN
 X
 ↓
Origin
```

Questions:

* Is there a fallback path?
* Can DNS route directly to origin?
* Can origin handle the traffic?
* Are static assets still accessible?
* Does direct-origin traffic bypass security controls?
* Does the fallback create a traffic storm?

A fallback path can itself become a failure amplifier.

---

# 58. Production Scenario — Origin Overload

Suppose:

```text
CDN hit ratio drops
 ↓
Origin traffic increases
 ↓
Application CPU increases
 ↓
Database load increases
 ↓
Latency increases
 ↓
Requests retry
 ↓
Traffic increases further
```

This is a cascading failure.

Possible protections:

```text
Caching
+
Rate limiting
+
Request coalescing
+
Timeouts
+
Circuit breakers
+
Load shedding
+
Backpressure
```

---

# 59. Retry Amplification

Suppose 10,000 requests fail.

Clients retry automatically.

Now:

```text
10,000 original
+
10,000 retries
+
10,000 retry retries
```

can create a traffic amplification loop.

Therefore:

> Retry policy is part of global traffic architecture.

Retries should have:

* bounded attempts
* backoff
* jitter
* appropriate idempotency

---

# 60. The Traffic Architecture Four-Pillar Matrix

## Mental Model

Understand:

* DNS
* CDN
* edge
* origin
* regions
* load balancers
* routing
* cache
* failover
* network topology

## Mechanics

Understand:

* DNS caching
* TTL
* cache hits/misses
* origin requests
* health checks
* load balancing
* connection reuse
* TLS termination
* regional routing
* traffic shifting

## Architecture

Design:

* global delivery
* regional application topology
* cache hierarchy
* origin protection
* failover
* deployment traffic shifting
* tenant-aware routing
* locale-aware routing

## Production

Operate:

* latency
* cache hit ratio
* origin load
* regional health
* routing failures
* CDN incidents
* capacity
* traffic spikes
* failover

---

# 61. Prediction Challenges

## Challenge 1

A CDN has a 95% cache hit ratio, but the origin is still overloaded.

What should you investigate?

### Answer

Look beyond the aggregate hit ratio.

Investigate:

* which routes are missing
* whether misses are concentrated on expensive endpoints
* cache-key fragmentation
* cache bypasses
* request bursts
* origin requests per miss
* personalized traffic

A 95% global hit ratio can hide a small but extremely expensive uncached workload.

---

## Challenge 2

Traffic is routed to the nearest region, but database latency remains high.

Why?

### Answer

The application may be close to the user while the database remains geographically distant.

```text
User
 ↓
Nearby App
 ↓
Far Database
```

Compute locality alone does not solve data locality.

---

## Challenge 3

A regional failover succeeds, but users see stale data.

What failed?

### Answer

Traffic routing succeeded.

Data replication/consistency did not meet the application's requirements.

---

## Challenge 4

A deployment routes 5% of traffic to version 2.

Version 2 fails only for one tenant.

Why might aggregate metrics hide the problem?

### Answer

The failing traffic may represent a small global percentage while being 100% of that tenant's traffic.

Observability must support dimensions such as:

```text
tenant
region
version
route
status
```

without creating uncontrolled metric cardinality.

---

## Challenge 5

The CDN is healthy, but latency suddenly increases.

What should you inspect?

### Answer

Potential layers:

```text
DNS
Edge
Cache hit ratio
Origin latency
Regional routing
Application latency
Database latency
External dependencies
```

Do not assume the CDN is the source merely because traffic passes through it.

---

# 62. Senior Interview Gotchas

### Gotcha 1

**"A CDN makes everything fast."**

No.

It helps most when the representation can be served efficiently from the edge.

Dynamic uncached requests can still travel to the origin.

---

### Gotcha 2

**"Multi-region automatically improves reliability."**

Not necessarily.

If the database, authentication service, or critical dependency remains single-region, the system may retain a major single point of failure.

---

### Gotcha 3

**"DNS failover is instant."**

No.

DNS caching and TTL behavior affect propagation.

---

### Gotcha 4

**"Load balancing means round robin."**

Round robin is only one possible strategy.

Production routing can incorporate:

* health
* weight
* latency
* capacity
* geography

---

### Gotcha 5

**"A cache hit is always correct."**

No.

The cached representation can be stale or incorrectly shared.

---

### Gotcha 6

**"Nearest region is always best."**

Not necessarily.

Data locality, consistency, compliance, capacity, and health can override geographic proximity.

---

### Gotcha 7

**"Failover only means changing the destination."**

No.

Failover also requires:

* capacity
* data availability
* configuration
* secrets
* dependencies
* cache behavior

---

### Gotcha 8

**"CDN and load balancer are the same thing."**

They overlap operationally but have different primary responsibilities.

---

# 63. Production Checklist

### Global Delivery

* [ ] CDN architecture is documented.
* [ ] Edge locations are understood.
* [ ] Origin locations are known.
* [ ] Cacheable representations are classified.

### Routing

* [ ] DNS architecture is documented.
* [ ] Routing policy is explicit.
* [ ] Health-aware routing exists where required.
* [ ] Regional failover behavior is understood.
* [ ] Traffic weights are controlled.

### Load Balancing

* [ ] Application instances are load balanced.
* [ ] Health checks are configured.
* [ ] Unhealthy instances are removed.
* [ ] Connection behavior is understood.

### Caching

* [ ] Cache keys are correct.
* [ ] Personalized content cannot leak.
* [ ] Cache invalidation is defined.
* [ ] Cache stampedes are considered.
* [ ] Origin shielding is evaluated.

### Global Architecture

* [ ] Region placement is intentional.
* [ ] Database locality is understood.
* [ ] Data consistency model is documented.
* [ ] Regional capacity is sufficient.
* [ ] Failover capacity is tested.

### Security

* [ ] TLS termination is understood.
* [ ] WAF/security controls are positioned correctly.
* [ ] Rate limiting is layered appropriately.
* [ ] Direct-origin access is controlled.

### Operations

* [ ] CDN hit ratio is monitored.
* [ ] Origin latency is monitored.
* [ ] Regional traffic is monitored.
* [ ] Routing failures are observable.
* [ ] Failover is tested.
* [ ] Traffic-shifting rollback is tested.

---

# 64. Core Invariants

Memorize these.

```text
CDN ≠ origin
```

```text
cache hit ≠ automatically correct response
```

```text
multi-region compute ≠ multi-region data
```

```text
nearest region ≠ automatically lowest total latency
```

```text
DNS routing ≠ instantaneous traffic switching
```

```text
load balancing ≠ merely round robin
```

```text
traffic failover ≠ data failover
```

```text
global routing ≠ global consistency
```

```text
cache efficiency ≠ cache correctness
```

```text
origin protection is part of reliability
```

```text
traffic routing is part of deployment architecture
```

```text
request path is an architectural dependency graph
```

---

# 65. Final Senior-Level Mental Model

The complete traffic path should now be visualized as:

```text
                         USER
                           │
                           ▼
                         DNS
                           │
                           ▼
                    GLOBAL EDGE / CDN
                           │
             ┌─────────────┼─────────────┐
             │             │             │
          Security       Cache        Routing
             │             │             │
             └─────────────┼─────────────┘
                           │
                           ▼
                    REGIONAL ROUTER
                           │
                 ┌─────────┴─────────┐
                 ▼                   ▼
             Region A             Region B
                 │                   │
            Load Balancer       Load Balancer
                 │                   │
             App Pool             App Pool
                 │                   │
                 └─────────┬─────────┘
                           │
                           ▼
                     DATA / SERVICES
```

The senior reasoning model is:

```text
User
 ↓
How does DNS direct traffic?
 ↓
Where does the edge receive it?
 ↓
Can the edge terminate the request?
 ↓
Can the CDN serve the representation?
 ↓
If not, which origin should receive it?
 ↓
Which region?
 ↓
Which instance?
 ↓
Which dependencies?
 ↓
What happens if any layer fails?
```

That is the traffic architecture.

---

# 66. Part Boundary

Part 04 answered:

> **Where and how does application code execute?**

Part 05 answered:

> **How does global traffic reach that execution environment?**

The next part should move deeper into the relationship between:

```text
Deployment
+
Runtime
+
Traffic
+
Data
```

Specifically:

> **Production Networking, Data Dependencies, Connection Management & Distributed State Architecture**

The progression is:

```text
Part 01
Deployment Mental Model
        ↓
Part 02
Build Output & Artifacts
        ↓
Part 03
CI/CD & Release Promotion
        ↓
Part 04
Hosting & Runtime Models
        ↓
Part 05
CDN / Regions / Traffic Routing
        ↓
Part 06
Networking / Data Dependencies / Distributed State
```

**Part 05 complete.**
