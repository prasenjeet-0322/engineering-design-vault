# Level 08 — Next.js & Full-Stack React

## KPI 11 — Deployment Considerations

# Part 05 — CDN, Regions, Traffic Routing & Global Delivery Architecture

---

## 1. Part Objective

This part focuses on the global delivery layer of a production Next.js application.

The central question is:

> **How does a request travel from a user to the correct execution environment, and how do CDN caching, geographic placement, traffic routing, and regional architecture affect correctness, latency, availability, and cost?**

The core model is:

```text
User
  ↓
DNS / Global Routing
  ↓
CDN / Edge
  ↓
Regional Routing
  ↓
Application Runtime
  ↓
Data Dependencies
```

The key principle is:

> **Global delivery is a request-routing architecture, not simply “put the application on a CDN.”**

---

# 2. Why Global Delivery Is an Architecture Problem

A globally distributed application must reason about:

```text
latency
availability
cache locality
origin locality
regional capacity
traffic distribution
failover
data locality
consistency
cost
security
```

A request may cross several boundaries:

```text
Browser
 ↓
ISP
 ↓
DNS
 ↓
CDN Edge
 ↓
Origin Region
 ↓
Application
 ↓
Database Region
```

Optimizing only one layer can leave the actual bottleneck untouched.

---

# 3. The Global Request Path

A useful mental model is:

```text
                 USER
                   │
                   ↓
              DNS / Routing
                   │
                   ↓
              CDN / Edge
                   │
          ┌────────┴────────┐
          ↓                 ↓
       Cache Hit         Cache Miss
          │                 │
          ↓                 ↓
       Response          Origin
                            │
                            ↓
                       App Runtime
                            │
                    ┌───────┴───────┐
                    ↓               ↓
                  Cache            Data
                                    │
                                    ↓
                                 Database
```

Every hop can introduce:

```text
latency
failure
security policy
observability requirements
```

---

# 4. CDN Mental Model

A CDN is fundamentally a distributed cache and delivery network.

Instead of:

```text
User
 ↓
Origin
```

the architecture becomes:

```text
User
 ↓
Nearest/selected Edge
 ↓
Cache
 ↓
Origin only when required
```

The goal is to reduce:

```text
origin requests
+
network distance
+
response latency
```

for cacheable content.

---

# 5. CDN Is Not the Application

A CDN should not automatically be treated as:

```text
application server
```

Its primary responsibilities may include:

```text
content delivery
caching
TLS termination
routing
compression
request filtering
edge logic
```

The application runtime remains responsible for application-specific computation unless the architecture intentionally moves some work to the edge.

---

# 6. Static Assets and CDN Delivery

Static assets are particularly suitable for CDN delivery.

Examples:

```text
JavaScript
CSS
fonts
images
public files
immutable build assets
```

A typical architecture is:

```text
Browser
 ↓
CDN
 ↓
Cached Asset
```

The origin may not be contacted at all.

---

# 7. Immutable Build Assets

Next.js build assets can use content-based or deployment-specific identity.

Conceptually:

```text
app.js
```

becomes something like:

```text
app.<content-hash>.js
```

The important property is:

```text
new content
→
new URL
```

This allows aggressive caching.

For example:

```text
Cache-Control:
public, immutable
```

can be appropriate for truly immutable assets.

---

# 8. Cacheable HTML

HTML can also be cached, but the problem becomes more complex.

A page may depend on:

```text
route
locale
tenant
authentication
query parameters
data freshness
cookies
headers
```

Therefore:

```text
HTML caching
```

requires careful representation identity.

The CDN must not serve one user's representation to another user.

---

# 9. Public vs Personalized Responses

Consider:

```text
/product/123
```

The response may be public.

But:

```text
/dashboard
```

may depend on:

```text
user identity
permissions
private data
```

The caching strategy must therefore differ.

A useful distinction is:

```text
Public Representation
→
Potentially shared

Personalized Representation
→
Potentially private
```

---

# 10. Cache Identity

A cache does not understand your application's business meaning automatically.

It stores representations according to a cache key.

Conceptually:

```text
Cache Key =
URL
+
relevant request dimensions
```

Potential dimensions include:

```text
path
query
host
locale
tenant
encoding
content variant
```

The key must contain every dimension that changes the representation.

But adding unnecessary dimensions creates cache fragmentation.

---

# 11. Cache Cardinality

Suppose a page varies by:

```text
5 locales
×
3 device classes
×
4 product variants
```

That could produce:

```text
5 × 3 × 4 = 60
```

possible representations.

If unnecessary dimensions are added:

```text
user ID
session ID
timestamp
tracking parameter
```

the representation count can explode.

Therefore:

> **Every cache-key dimension has a cost.**

---

# 12. Tracking Parameters

Consider:

```text
/product/123?utm_source=google
```

and:

```text
/product/123?utm_source=email
```

If the content is identical, treating them as completely independent cache objects may reduce cache efficiency.

The architecture should distinguish:

```text
representation-changing parameters
```

from:

```text
analytics-only parameters.
```

This is a URL and caching architecture concern.

---

# 13. CDN Cache Hit

A cache hit means:

```text
Request
 ↓
CDN
 ↓
Matching cached representation
 ↓
Response
```

The origin is avoided.

This generally reduces:

```text
origin load
latency
compute
```

for that request.

---

# 14. CDN Cache Miss

A miss becomes:

```text
Request
 ↓
CDN
 ↓
No cached representation
 ↓
Origin
 ↓
Application
 ↓
Response
 ↓
Potential cache insertion
```

Therefore cache-miss latency can be significantly higher than hit latency.

A production system should measure both.

---

# 15. Cache Hit Ratio

A basic metric is:

```text
Cache Hit Ratio =
Cache Hits / Total Cache Requests
```

A high ratio can indicate effective caching.

But aggregate hit ratio can hide critical problems.

For example:

```text
Overall:
99%

LCP hero:
60%
```

The application can still have poor user-facing performance.

Therefore metrics should be segmented by:

```text
resource
route
region
device
representation
```

where useful.

---

# 16. Cache-Control

HTTP caching behavior can be influenced through headers such as:

```text
Cache-Control
```

Conceptually:

```text
public
private
max-age
s-maxage
stale-while-revalidate
stale-if-error
immutable
```

These directives communicate caching policy to clients and intermediaries.

The important distinction is:

```text
browser cache
≠
shared CDN cache
```

and the policies may need to differ.

---

# 17. `s-maxage`

A shared-cache policy can conceptually distinguish:

```text
browser freshness
```

from:

```text
shared CDN freshness.
```

For example:

```text
max-age
```

may describe browser behavior while:

```text
s-maxage
```

can influence shared caches.

The exact behavior depends on the caching infrastructure.

---

# 18. Stale-While-Revalidate

A useful delivery model is:

```text
Request
 ↓
Fresh cache
 → return immediately
```

or:

```text
Request
 ↓
Stale-but-usable cache
 ├── return stale response
 └── refresh asynchronously
```

This can reduce user-facing latency while allowing the representation to refresh in the background.

---

# 19. Stale-If-Error

Another resilience strategy is allowing stale content to remain usable when the origin fails.

Conceptually:

```text
CDN
 ↓
Origin unavailable
 ↓
Serve acceptable stale representation
```

This can improve availability for public content.

However, stale data is only appropriate when the product semantics tolerate it.

---

# 20. Freshness Is a Product Decision

Not all content has the same freshness requirement.

Examples:

```text
Marketing page
→
minutes/hours may be acceptable

Product description
→
potentially minutes

Inventory
→
much stricter

User balance
→
not shared-cacheable
```

Therefore:

```text
cache policy
=
technical policy
+
product semantics.
```

---

# 21. Regional Architecture

A globally distributed application may have:

```text
Region A
Region B
Region C
```

Each region may contain:

```text
CDN origin
application
cache
database
```

or only some of those.

The architecture must explicitly define:

```text
what is regional
what is global
what is replicated
what is centralized.
```

---

# 22. Single-Origin Global CDN

A simpler architecture is:

```text
                 Global Users
                      │
                      ↓
                     CDN
                      │
                      ↓
                 Single Origin
                      │
                      ↓
                   Database
```

Advantages:

```text
simpler operations
simpler data consistency
simpler deployment
```

Potential disadvantages:

```text
origin distance
regional failure
origin bottleneck
cross-region latency
```

The CDN reduces static-content latency but does not eliminate origin locality concerns.

---

# 23. Multi-Region Application

A multi-region architecture may look like:

```text
                    Global Router
                         │
            ┌────────────┼────────────┐
            ↓            ↓            ↓
         Region A     Region B     Region C
            │            │            │
         App A        App B        App C
            │            │            │
            └────────────┼────────────┘
                         ↓
                  Distributed Data
```

This can improve:

```text
availability
regional latency
failure isolation
capacity
```

but substantially increases system complexity.

---

# 24. Geographic Routing

Traffic can be routed based on:

```text
user geography
latency
region health
capacity
business policy
```

Conceptually:

```text
User
 ↓
Global Router
 ↓
Best Eligible Region
```

“Best” is not always simply “nearest.”

A nearby region might be:

```text
overloaded
unhealthy
missing required data
```

Therefore routing is a policy problem.

---

# 25. Latency-Based Routing

A routing system may attempt to select the region with the lowest network latency.

Conceptually:

```text
User
 ↓
Measure / estimate latency
 ↓
Select region
```

But network latency is not the only component.

Total request latency can be modeled as:

```text
Request Latency
=
Network
+
Queueing
+
Application
+
Cache
+
Database
+
External Dependencies
```

---

# 26. Capacity-Aware Routing

Suppose:

```text
Region A:
20% capacity

Region B:
95% capacity
```

Routing every user to Region B merely because it is geographically closer can create overload.

A mature system can combine:

```text
geography
+
health
+
capacity
```

to determine eligibility.

---

# 27. Health-Aware Routing

If Region A becomes unhealthy:

```text
Region A
   ↓
Health failure
   ↓
Removed from eligible destinations
```

Traffic can move to:

```text
Region B
```

This creates a failover architecture.

But failover is only safe if the destination can actually serve the request correctly.

---

# 28. Failover and Data Dependencies

Suppose:

```text
Region A
Application A
Database A
```

fails.

Traffic moves to:

```text
Region B
Application B
```

but Database A remains unavailable.

If Region B requires Database A:

```text
application failover
```

did not produce:

```text
service failover.
```

Therefore:

> **A failover architecture must include its critical dependencies.**

---

# 29. Regional Data Placement

Consider:

```text
User
 ↓
Europe Region
 ↓
US Database
```

The application is regional.

The data path is not.

This can introduce:

```text
cross-region latency
```

and potentially:

```text
data residency
compliance
cost
availability
```

considerations.

---

# 30. Read Replicas

A common architecture is:

```text
Primary Database
       │
       ├── Replica A
       ├── Replica B
       └── Replica C
```

Regional applications may read from a nearby replica.

This can improve:

```text
read latency
```

but introduces:

```text
replication lag
```

Therefore:

```text
read-after-write guarantees
```

must be considered.

---

# 31. Read-After-Write Problem

User performs:

```text
POST /profile
```

which writes to:

```text
Primary
```

Then immediately:

```text
GET /profile
```

routes to a replica.

If replication has not completed:

```text
GET
→
old state
```

The user may see stale information immediately after updating it.

This is a distributed-systems consistency problem.

---

# 32. Sticky Routing

One possible strategy is temporarily keeping a user associated with a region.

Conceptually:

```text
User
 ↓
Region A
 ↓
Region A
 ↓
Region A
```

This may improve locality and consistency in some architectures.

But sticky routing reduces routing flexibility and complicates failover.

Therefore it should not be introduced automatically.

---

# 33. CDN vs Application Routing

These are different layers.

### CDN routing

Determines:

```text
Which edge handles the request?
```

### Application routing

Determines:

```text
Which application/runtime handles the request?
```

### Data routing

Determines:

```text
Which database/storage system handles the data operation?
```

A global architecture should model all three.

---

# 34. DNS Architecture

DNS may participate in:

```text
global traffic distribution
```

through:

```text
regional endpoints
health-aware records
latency-aware routing
geographic policies
```

But DNS decisions are not equivalent to per-request routing.

DNS caching means clients and recursive resolvers may retain answers for some period.

Therefore failover behavior has timing characteristics.

---

# 35. DNS TTL and Failover

Suppose:

```text
DNS TTL = 300 seconds
```

and Region A fails.

Changing DNS does not necessarily mean:

```text
all clients
→
Region B immediately.
```

Some clients may continue using cached DNS information.

Therefore DNS-based failover has propagation characteristics that must be understood.

---

# 36. CDN Failover

CDNs may provide origin failover:

```text
CDN
 ├── Primary Origin
 └── Secondary Origin
```

If the primary fails:

```text
CDN
 ↓
Secondary
```

But the secondary must be compatible with:

```text
content
authentication
cache behavior
data dependencies
```

Otherwise the failover only moves the failure.

---

# 37. Origin Shielding

A CDN architecture may include an additional caching layer:

```text
Edge
 ↓
Regional Cache / Shield
 ↓
Origin
```

Instead of every edge independently contacting the origin, the shield can consolidate requests.

Benefits can include:

```text
origin offload
cache efficiency
request consolidation
```

---

# 38. Cache Stampede

Suppose a popular object expires simultaneously at many edges.

Thousands of requests arrive:

```text
Cache Miss
 ↓
Origin
```

The origin receives a sudden burst.

This is a cache stampede.

Mitigations can include:

```text
request coalescing
stale-while-revalidate
cache warming
jittered expiration
origin shielding
```

---

# 39. Request Coalescing

If 10,000 requests ask for the same uncached resource simultaneously:

Instead of:

```text
10,000 origin requests
```

a cache layer can attempt:

```text
1 origin request
+
9,999 waiters
```

This is often called:

```text
request collapsing
```

or:

```text
single-flight behavior.
```

---

# 40. Cache Warming

For predictable high-traffic content:

```text
deployment
 ↓
preload / warm cache
 ↓
traffic
```

can reduce cold-cache latency.

Examples:

```text
homepage
popular product
major campaign page
```

But cache warming has a cost.

Warming everything creates unnecessary origin traffic.

---

# 41. Global Cache Invalidation

A global deployment can involve:

```text
Edge A
Edge B
Edge C
...
```

If content changes, invalidation must propagate appropriately.

Potential strategies:

```text
purge
TTL expiration
versioned URLs
tag-based invalidation
```

The architecture should avoid requiring massive synchronous invalidation when possible.

---

# 42. Versioned Content

For immutable assets:

```text
asset-v1
asset-v2
```

is often simpler than:

```text
purge every edge
```

because identity changes naturally.

This is one reason content-addressed or versioned assets work well with CDNs.

---

# 43. Dynamic HTML and CDN Caching

Dynamic pages require more careful classification.

Suppose:

```text
/products/123
```

depends on product data.

If product data is public and cacheable:

```text
CDN
 ↓
Cached HTML
```

may be viable.

If the page contains user-specific information:

```text
CDN shared cache
```

may be unsafe.

The correct architecture may instead separate:

```text
public shell
+
personalized data.
```

---

# 44. Partial Personalization

A page can sometimes be architected as:

```text
Cached Public Representation
        +
Client/Server Personalized Data
```

rather than making the entire page uncacheable.

This can significantly improve global delivery.

The architectural question is:

> **What portion of the representation actually varies by user?**

---

# 45. Multi-Tenant CDN Architecture

Suppose:

```text
tenant-a.example.com
tenant-b.example.com
```

Both route through the same CDN.

The system must correctly preserve:

```text
host
tenant identity
cache identity
authorization
canonical URL
```

A dangerous cache design could accidentally serve:

```text
tenant A response
→
tenant B request
```

Therefore host/tenant context must participate in representation identity whenever the content differs.

---

# 46. Locale-Aware Delivery

Consider:

```text
/en/products/123
/fr/products/123
```

The representation differs.

Therefore:

```text
locale
```

may be part of:

```text
routing
cache identity
metadata
content selection
```

The architecture should not assume:

```text
same resource ID
=
same representation.
```

---

# 47. Authentication and CDN

Authenticated pages require special caution.

Potential dimensions include:

```text
Authorization header
cookies
session
user identity
permissions
tenant
```

If these change the representation, shared caching can become unsafe.

One common architecture is:

```text
Public Content
→
shared CDN

Private Content
→
private/request-specific delivery
```

rather than trying to share every response.

---

# 48. CDN Security

The CDN can also provide security controls such as:

```text
rate limiting
bot filtering
WAF rules
IP controls
request size limits
TLS
DDoS mitigation
```

But these are defense layers.

Application authorization must still happen where the resource is actually protected.

---

# 49. Origin Protection

The origin should ideally not become directly exposed unnecessarily.

Conceptually:

```text
Internet
 ↓
CDN / Security Layer
 ↓
Origin
```

rather than:

```text
Internet
 ├── CDN
 └── Direct Origin
```

Otherwise attackers may bypass CDN protections and attack the origin directly.

---

# 50. Origin Load

A CDN's major architectural value is often:

```text
edge requests
≫
origin requests
```

If origin traffic becomes unexpectedly high, investigate:

```text
cacheability
cache key
TTL
personalization
query parameters
cookies
headers
purges
traffic distribution
cache stampedes
```

rather than simply adding more application servers.

---

# 51. Global Delivery Cost

Global delivery has several cost dimensions:

```text
bandwidth
CDN requests
origin requests
cross-region traffic
cache storage
compute
data replication
```

A design that minimizes latency at any cost may become economically unsustainable.

Therefore:

```text
performance
+
availability
+
cost
```

must be evaluated together.

---

# 52. Regional Capacity Planning

Each region needs sufficient capacity for:

```text
normal traffic
traffic spikes
deployment capacity
failover traffic
```

If Region B normally operates at:

```text
90% utilization
```

it may not be able to absorb Region A's traffic.

Therefore multi-region architecture requires:

```text
failure capacity.
```

---

# 53. N+1 Regional Capacity

A common resilience concept is:

```text
normal:
A = 50%
B = 50%
```

If A fails:

```text
B = 100%
```

But this leaves no room for additional load.

A stronger architecture may maintain enough spare capacity so that:

```text
one region failure
```

does not immediately overload the remaining regions.

---

# 54. Regional Deployment

Global deployments introduce another problem:

```text
Region A:
version N+1

Region B:
version N
```

Now mixed versions coexist.

The application must remain compatible across the transition.

This affects:

```text
API contracts
database schema
cache formats
feature flags
serialized data
```

---

# 55. Backward Compatibility

Suppose version N+1 writes:

```text
new_field
```

while Region B still runs version N.

The old version must not fail when reading the new representation.

This is why production migrations often use:

```text
expand
→
migrate
→
contract
```

rather than immediately removing old structures.

---

# 56. Global Cache During Deployment

Deployment can produce:

```text
new application
+
old cached HTML
```

or:

```text
new HTML
+
old JavaScript
```

The asset architecture should prevent incompatible combinations.

Immutable hashed assets help because:

```text
HTML references exact asset identity.
```

But HTML cache lifetime still matters.

---

# 57. Global Delivery Observability

Monitor by:

```text
region
edge
route
status
cache result
latency
origin
```

Useful dimensions include:

```text
p50
p95
p99
cache hit ratio
origin request rate
5xx
4xx
bandwidth
regional traffic
```

---

# 58. Region-Level SLOs

Instead of only:

```text
global p95 latency
```

also examine:

```text
India p95
Europe p95
US p95
```

A global aggregate can hide regional failures.

For example:

```text
Global p95:
500ms

Region A:
150ms

Region B:
2.5s
```

The global average does not adequately describe Region B's user experience.

---

# 59. Synthetic Global Testing

Synthetic probes can execute requests from multiple locations:

```text
Asia
Europe
North America
Australia
```

and measure:

```text
DNS
TLS
TTFB
CDN hit
HTML transfer
LCP
```

This can reveal regional regressions before they become obvious in aggregate RUM.

---

# 60. Real User Monitoring

RUM provides actual user distribution.

It can reveal:

```text
device differences
network differences
regional differences
ISP differences
cache behavior
real LCP
```

A production system should combine:

```text
synthetic
+
RUM
```

rather than relying exclusively on either.

---

# 61. Failure Scenario — Regional Overload

Suppose:

```text
Region A:
healthy

Region B:
healthy

Region C:
failed
```

Traffic shifts:

```text
A ↑
B ↑
```

Now B reaches:

```text
95% CPU
```

and starts timing out.

The system has converted:

```text
one regional failure
```

into:

```text
multi-region degradation.
```

This is a cascading failure.

---

# 62. Failure Scenario — Bad Routing Rule

Suppose a routing change sends:

```text
80%
```

of global traffic to one region unintentionally.

The region becomes saturated.

The CDN itself may still report:

```text
healthy
```

while users experience:

```text
high latency
5xx
timeouts
```

Therefore health must include:

```text
capacity
latency
error rate
```

not only process liveness.

---

# 63. Failure Scenario — Cache Poisoning

Suppose the cache key ignores:

```text
Host
```

but the response differs by host.

Then:

```text
tenant-a.example.com
```

could populate:

```text
shared cache entry
```

and another tenant could receive it.

The lesson:

> **Every representation-changing dimension must be represented in cache identity.**

---

# 64. Failure Scenario — Stale Content

Suppose:

```text
product price
```

changes immediately.

The CDN still has:

```text
old price
```

because the TTL is long.

The architecture must determine whether:

```text
stale price
```

is acceptable.

If not, the system needs:

```text
invalidation
versioning
shorter freshness
dynamic bypass
```

or another consistency strategy.

---

# 65. Failure Scenario — DNS Failover Delay

Region A fails.

DNS is changed to Region B.

Some clients continue reaching Region A because of DNS caching.

Therefore:

```text
DNS failover
```

cannot be treated as:

```text
instant global traffic migration.
```

---

# 66. Failure Scenario — Origin Outage

Suppose the CDN remains healthy but the application origin is unavailable.

Possible outcomes:

```text
cache hit
→
users still receive cached content
```

while:

```text
cache miss
→
origin failure
```

This is why stale serving and cache architecture can become availability mechanisms.

---

# 67. Senior Tradeoff — Single Region vs Multi-Region

### Single Region

Advantages:

```text
simpler consistency
simpler operations
lower replication complexity
```

Costs:

```text
regional failure risk
global origin latency
```

### Multi-Region

Advantages:

```text
regional resilience
lower regional latency
higher geographic availability
```

Costs:

```text
data consistency
deployment complexity
routing complexity
replication
cost
observability
```

The correct architecture depends on actual requirements.

---

# 68. Senior Tradeoff — CDN vs More Servers

Suppose origin CPU is high because thousands of users request the same public page.

Adding more servers may help.

But if the content is cacheable, the better architectural question is:

```text
Why is the CDN not serving the representation?
```

Potential causes:

```text
cache headers
cache key
personalization
cookies
query parameters
short TTL
```

Caching can remove the workload entirely rather than merely distributing it.

---

# 69. Senior Tradeoff — Edge vs Origin

Edge execution reduces:

```text
user → compute
```

distance.

But moving too much logic to the edge can introduce:

```text
runtime restrictions
data latency
operational complexity
```

The goal is not:

```text
everything at edge.
```

The goal is:

```text
the right computation at the right location.
```

---

# 70. Four-Pillar Engineering Matrix

| Pillar       | Part 05 Focus                | Senior Question                                    |
| ------------ | ---------------------------- | -------------------------------------------------- |
| Mental Model | Global request path          | Where does the request actually travel?            |
| Mechanics    | CDN, routing, cache behavior | Why did this request hit this region/cache?        |
| Architecture | Global delivery              | Where should content, compute and data live?       |
| Operations   | Regional resilience          | What happens when an edge, region or origin fails? |

---

# 71. Prediction Challenges

### Challenge 1

CDN hit ratio falls from:

```text
98% → 80%
```

What should you inspect?

```text
cache key
TTL
URL changes
query parameters
purges
personalization
deployment
```

---

### Challenge 2

Users in Europe experience high TTFB while US users remain fast.

What dimensions should you compare?

```text
edge location
origin region
routing
cache hit ratio
network path
regional capacity
```

---

### Challenge 3

A region fails, but traffic does not move immediately.

Possible causes include:

```text
DNS caching
routing TTL
health-check delay
CDN failover policy
connection reuse
```

---

### Challenge 4

A global application becomes slower after adding more regions.

Why?

Possible causes:

```text
database cross-region latency
replication
routing instability
cache coldness
distributed coordination
```

---

### Challenge 5

A CDN reports 99% cache hit ratio, but users report slow product pages.

What should you investigate?

```text
which resource is slow
LCP
critical-resource cache hit
origin latency
browser rendering
```

---

# 72. Senior Interview Questions

You should be able to answer:

1. What does a CDN actually solve?
2. What does a CDN not solve?
3. Why can HTML be harder to cache than static assets?
4. What is cache cardinality?
5. Why can adding cache-key dimensions hurt performance?
6. How would you design a multi-region Next.js deployment?
7. What happens when a region fails?
8. How do you prevent failover from overloading another region?
9. Why doesn't edge compute automatically make database-heavy requests fast?
10. What is origin shielding?
11. What causes cache stampedes?
12. How do immutable assets simplify CDN caching?
13. How do you safely cache tenant-specific content?
14. How do DNS and CDN routing differ?
15. How do you observe regional performance?
16. How would you handle mixed application versions during a global rollout?

---

# 73. Architecture Exercise

Design a globally distributed Next.js application with:

```text
100 million monthly users
3 geographic regions
public marketing pages
public product pages
authenticated dashboards
image-heavy content
```

Requirements:

```text
low global latency
high availability
safe caching
tenant isolation
regional failure tolerance
```

Your architecture should explicitly define:

### Routing

```text
DNS
CDN
regional routing
health checks
```

### Caching

```text
static assets
HTML
API responses
images
private content
```

### Compute

```text
edge
serverless
Node/container
```

### Data

```text
database placement
replication
read/write routing
```

### Failure

```text
region failure
origin failure
CDN failure
database failure
```

### Observability

```text
regional latency
cache hit ratio
origin load
5xx
capacity
```

---

# 74. Reference Global Architecture

A generalized production architecture:

```text
                         GLOBAL USERS
                              │
                              ↓
                         DNS / Global
                           Routing
                              │
                              ↓
                         CDN / WAF
                              │
             ┌────────────────┼────────────────┐
             ↓                ↓                ↓
          Region A         Region B         Region C
             │                │                │
          Edge/App          Edge/App          Edge/App
             │                │                │
             ├────────────────┼────────────────┤
             │                │                │
             ↓                ↓                ↓
           Cache            Cache            Cache
             │                │                │
             └────────────────┼────────────────┘
                              ↓
                     Data / Storage Layer
                              │
                  ┌───────────┼───────────┐
                  ↓           ↓           ↓
                Primary    Replicas    Object Store
```

The actual topology should follow:

```text
traffic
+
data requirements
+
consistency
+
availability
+
cost.
```

---

# 75. Core Invariants

Remember:

```text id="j0i2a1"
CDN
≠
application runtime
```

```text id="q6h1y8"
cache hit
≠
request completely fast
```

```text id="a9j3f5"
high global cache hit
≠
every region performs well
```

```text id="2m6lzi"
nearest region
≠
always best region
```

```text id="8h1s3r"
edge compute
≠
edge data
```

```text id="j8qk9r"
application failover
≠
dependency failover
```

```text id="0c4c0d"
multi-region compute
≠
multi-region data
```

```text id="r8n3ml"
cache key
=
all representation-changing dimensions
```

```text id="8k4s5m"
more cache-key dimensions
→
more cache cardinality
```

```text id="9v1l9a"
immutable URL
→
simpler cache freshness
```

```text id="7u6q2c"
regional redundancy
→
requires spare capacity
```

```text id="s7f0o4"
DNS failover
≠
instant request migration
```

```text id="5h6s7j"
global routing
=
latency
+
health
+
capacity
+
policy.
```

---

# 76. Part Completion Checklist

You have completed this part when you can explain:

### CDN

* [ ] CDN mental model
* [ ] edge caching
* [ ] origin requests
* [ ] cache hits
* [ ] cache misses
* [ ] cache-control
* [ ] stale serving
* [ ] origin shielding
* [ ] cache stampedes
* [ ] request coalescing

### Global Routing

* [ ] DNS routing
* [ ] geographic routing
* [ ] latency routing
* [ ] health-aware routing
* [ ] capacity-aware routing
* [ ] failover
* [ ] routing propagation

### Regional Architecture

* [ ] single-region architecture
* [ ] multi-region architecture
* [ ] regional compute
* [ ] regional data
* [ ] replicas
* [ ] replication lag
* [ ] read-after-write
* [ ] spare failover capacity

### Caching

* [ ] cache identity
* [ ] cache cardinality
* [ ] public/private caching
* [ ] tenant-aware caching
* [ ] locale-aware caching
* [ ] immutable assets
* [ ] dynamic HTML caching
* [ ] personalization boundaries

### Operations

* [ ] regional SLOs
* [ ] synthetic monitoring
* [ ] RUM
* [ ] origin load
* [ ] regional capacity
* [ ] CDN health
* [ ] cache performance
* [ ] regional failure scenarios

---

# 77. Boundary of This Part

This part establishes:

```text
WHERE
requests are delivered
```

and:

```text
HOW
global traffic, caching and regions interact.
```

It intentionally does not deeply cover:

* networking implementation
* database connection architecture
* distributed state
* secrets/configuration
* runtime lifecycle
* deployment observability

Those belong to adjacent KPI 11 parts.

The progression is:

```text
Part 04
Hosting Models & Runtime Constraints
        ↓
Part 05
CDN, Regions & Global Delivery
        ↓
Part 06
Networking, Data Dependencies & Distributed State
        ↓
Part 07
Configuration & Secrets
        ↓
Part 08
Runtime Lifecycle
        ↓
Part 09
Deployment Observability
        ↓
Part 10
Production Deployment Architecture Capstone
```

---

# 78. Final Mental Model

At SDE-2 level, global delivery should be understood as:

```text
                         USER
                           │
                           ↓
                    GLOBAL ROUTING
                           │
                           ↓
                        CDN/EDGE
                           │
               ┌───────────┴───────────┐
               ↓                       ↓
             CACHE                  ORIGIN
               │                       │
               │              ┌────────┴────────┐
               │              ↓                 ↓
               │           REGION A          REGION B
               │              │                 │
               │              ↓                 ↓
               │          APPLICATION       APPLICATION
               │              │                 │
               │              └────────┬────────┘
               │                       ↓
               │                  DATA LAYER
               │                       │
               │            ┌──────────┼──────────┐
               │            ↓          ↓          ↓
               │          Primary    Replica   Storage
               │
               └───────────────────────────────┐
                                               ↓
                                        USER RESPONSE
```

The core senior-level principle is:

> **Global delivery is the coordinated placement of routing, caching, compute and data so that the request reaches an eligible, healthy and sufficiently close representation or execution environment without violating correctness or consistency.**

And the architectural chain is:

```text
User
→ Global Routing
→ CDN / Edge
→ Cache Decision
→ Region Selection
→ Runtime
→ Data Dependency
→ Response
→ Observability
```

Every production latency, availability, and caching decision should be explainable through this chain.
