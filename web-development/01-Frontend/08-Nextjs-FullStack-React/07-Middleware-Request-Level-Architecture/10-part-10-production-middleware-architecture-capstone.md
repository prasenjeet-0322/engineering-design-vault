# Level 08 — KPI 07 — Part 10: Production Middleware Architecture Capstone

## 1. Part Objective

This capstone integrates the complete middleware architecture covered across KPI 07.

The objective is not to learn another middleware API.

The objective is to demonstrate that you can design, reason about, debug, and defend a production request-processing architecture where middleware participates in:

* request classification
* authentication
* authorization boundaries
* redirects
* rewrites
* multi-tenant routing
* locale routing
* rate limiting
* request policies
* runtime constraints
* caching
* rendering
* personalization
* observability
* security

The central SDE-2 question is:

> **Can you design middleware as a controlled request-policy layer without turning it into an unbounded application runtime?**

---

# 2. KPI 07 Complete Mental Model

The complete middleware architecture should now be understood as:

```text
Incoming Request
      ↓
Request Normalization
      ↓
Matcher / Scope
      ↓
Request Classification
      ↓
Security / Trust Validation
      ↓
Tenant Resolution
      ↓
Locale Resolution
      ↓
Authentication
      ↓
Authorization Boundary
      ↓
Request Policies
      ↓
Rate Limiting
      ↓
Redirect / Rewrite / Continue
      ↓
Cache / Rendering Decision
      ↓
Application Execution
      ↓
Response
      ↓
Observability
```

Not every request executes every conceptual step.

The important point is that middleware participates in the **request-control plane**.

It should determine:

> “What should happen to this request before expensive application work occurs?”

It should not become:

> “The entire backend of the application.”

---

# 3. The Ten-Part KPI Architecture

KPI 07 is composed of:

```text
Part 01
Middleware Mental Model

Part 02
Request Matching & Execution Model

Part 03
Redirects & Rewrites

Part 04
Authentication-Aware Routing

Part 05
Authorization Boundaries & Security

Part 06
Multi-Tenant / Locale / Host-Based Routing

Part 07
Rate Limiting & Request Policies

Part 08
Middleware Performance & Runtime Constraints

Part 09
Middleware + Caching + Rendering Integration

Part 10
Production Middleware Architecture Capstone
```

Part 10 integrates all nine previous parts.

---

# 4. Middleware's Proper Architectural Role

A production middleware layer should be thought of as a:

```text
Request Policy Engine
```

rather than:

```text
Application Business Logic Layer
```

Middleware is particularly useful for decisions that can be made from:

* request metadata
* headers
* cookies
* URL
* hostname
* authenticated session metadata
* lightweight policy information
* routing state
* request rate
* security signals

Examples:

```text
Request:
    /dashboard

Middleware:
    Is this route protected?
    Is the session valid?
    Which tenant?
    Which locale?
    Is the request allowed?
    Should the URL redirect?
    Should the request rewrite?

Application:
    Fetch dashboard data
    Execute business logic
    Render UI
```

---

# 5. Production Request Pipeline

A useful production pipeline is:

```text
                    ┌────────────────────┐
                    │ Incoming Request   │
                    └─────────┬──────────┘
                              ↓
                    ┌────────────────────┐
                    │ Normalize Request  │
                    └─────────┬──────────┘
                              ↓
                    ┌────────────────────┐
                    │ Matcher / Scope    │
                    └─────────┬──────────┘
                              ↓
                    ┌────────────────────┐
                    │ Trust Validation   │
                    └─────────┬──────────┘
                              ↓
              ┌───────────────┼───────────────┐
              ↓               ↓               ↓
           Tenant          Locale          Auth
          Resolution      Resolution       Context
              └───────────────┼───────────────┘
                              ↓
                    ┌────────────────────┐
                    │ Request Policies   │
                    └─────────┬──────────┘
                              ↓
                    ┌────────────────────┐
                    │ Rate Limiting      │
                    └─────────┬──────────┘
                              ↓
                 ┌────────────┼────────────┐
                 ↓            ↓            ↓
              Redirect      Rewrite      Continue
                                            ↓
                                   Cache / Rendering
                                            ↓
                                      Application
                                            ↓
                                        Response
```

This decomposition makes middleware responsibilities explicit.

---

# 6. Request Classification

Before implementing middleware, classify requests.

For example:

```text
/static/*
/favicon.ico
/api/*
/auth/*
/dashboard/*
/admin/*
/tenant/*
/webhooks/*
```

Each class may have different policy requirements.

Example:

| Request      | Auth      | Rate Limit | Tenant  | Redirect | Cache                |
| ------------ | --------- | ---------- | ------- | -------- | -------------------- |
| Static asset | No        | Usually no | No      | No       | Yes                  |
| Public page  | Optional  | Maybe      | Maybe   | Maybe    | Often                |
| Dashboard    | Yes       | Maybe      | Yes     | Maybe    | Context-dependent    |
| Admin        | Yes       | Yes        | Yes     | Maybe    | Usually personalized |
| API          | Usually   | Yes        | Maybe   | Rarely   | Context-dependent    |
| Webhook      | Signature | Yes        | Derived | No       | No                   |

The key lesson:

> Middleware policy should be request-class aware.

---

# 7. Matcher Design

Middleware should execute only where its policy is relevant.

Conceptually:

```text
Middleware Scope
        ↓
Relevant Requests
        ↓
Policy Evaluation
```

rather than:

```text
Every Request
        ↓
Huge Conditional Tree
```

Poor design:

```text
if path !== "/static"
if path !== "/favicon"
if path !== "/robots"
if path !== "/images"
if path !== "/api/internal"
...
```

Better:

```text
Define the request surface intentionally.
```

The matcher becomes an architectural boundary.

---

# 8. Trust Boundary

One of the most important production concerns is determining which request metadata can be trusted.

Potentially sensitive inputs include:

```text
Host
X-Forwarded-Host
X-Forwarded-Proto
X-Forwarded-For
Cookie
Authorization
Custom tenant headers
Custom role headers
```

Never assume that an arbitrary client-controlled header represents trusted infrastructure state.

For example:

```text
X-Tenant-ID: enterprise-a
```

should not automatically mean:

```text
request belongs to enterprise-a
```

Tenant identity should come from a trusted routing mechanism or be validated against authenticated membership.

The security model must distinguish:

```text
client-provided signal
```

from:

```text
trusted infrastructure signal
```

---

# 9. Tenant Resolution

For multi-tenant systems:

```text
Request
   ↓
Hostname
   ↓
Tenant Resolution
   ↓
Tenant Context
```

Example:

```text
acme.example.com
        ↓
tenant = acme
```

Custom domains may require:

```text
acme.com
   ↓
domain lookup
   ↓
tenant = acme
```

The tenant context should then propagate consistently:

```text
Request
 ↓
Tenant
 ↓
Authentication
 ↓
Authorization
 ↓
Database
 ↓
Cache
 ↓
Rendering
```

A tenant should never be inferred independently at each layer.

---

# 10. Tenant Isolation Invariant

The critical invariant is:

> A request must never access, cache, render, or mutate another tenant's representation or data merely because two requests share a route.

For example:

```text
/acme/dashboard
```

and

```text
/beta/dashboard
```

may resolve to:

```text
/dashboard
```

internally.

That does not mean they are equivalent requests.

Their effective context is:

```text
tenant = acme
```

versus:

```text
tenant = beta
```

Therefore cache identity and authorization must preserve that distinction.

---

# 11. Locale Resolution

Locale routing follows similar principles.

Example:

```text
/en/products
/fr/products
/de/products
```

may map to:

```text
/products
```

internally.

But the rendered representation differs because:

```text
locale = en
```

is not equivalent to:

```text
locale = fr
```

Locale must therefore become part of the effective request context.

---

# 12. Context Composition

A useful conceptual request context is:

```text
RequestContext {
    host
    tenant
    locale
    principal
    authorization
    route
    featureVariant
}
```

The application should reason from this context rather than repeatedly reinterpreting raw request metadata.

The important distinction is:

```text
Raw Request
```

versus:

```text
Normalized Application Context
```

---

# 13. Authentication

Authentication answers:

> Who is making the request?

Example:

```text
Anonymous
Authenticated(User A)
Authenticated(User B)
```

Middleware can perform early authentication checks.

For a protected route:

```text
/dashboard
```

the request might become:

```text
No session
   ↓
redirect /login
```

while:

```text
Valid session
   ↓
continue
```

However, middleware should not be treated as the only security boundary.

---

# 14. Authorization

Authorization answers:

> Is this principal allowed to perform this operation on this resource?

For example:

```text
User authenticated
        ↓
tenant membership
        ↓
role
        ↓
resource ownership
        ↓
operation permission
```

Authentication:

```text
Who are you?
```

Authorization:

```text
What are you allowed to do?
```

These must remain separate.

---

# 15. Middleware Is Not the Final Security Boundary

A critical production rule:

```text
Middleware authorization
        +
Server-side authorization
        +
Database/resource-level authorization
```

should be considered where appropriate.

Suppose middleware allows:

```text
/admin
```

That does not mean an API endpoint should trust the browser because navigation passed middleware.

The endpoint must independently validate:

```text
principal
tenant
resource
operation
```

Security cannot depend solely on a UI route.

---

# 16. Redirect Architecture

A redirect changes external navigation.

```text
Client
  ↓
/old-url
  ↓
302 /new-url
  ↓
Client requests /new-url
```

The browser-visible URL changes.

Use redirects for:

* canonical URLs
* migrations
* authentication navigation
* deprecated routes
* locale canonicalization
* domain canonicalization

A redirect is externally observable.

---

# 17. Rewrite Architecture

A rewrite changes internal routing while preserving the external URL.

Conceptually:

```text
Browser
  ↓
/customer/dashboard
  ↓
internal route
/dashboard
```

The browser continues to see:

```text
/customer/dashboard
```

Use rewrites when:

* external URL identity should remain stable
* implementation routes differ
* tenant routing maps to internal application routes
* legacy internal structures need hiding

But rewrite correctness must account for caching and representation identity.

---

# 18. Redirect vs Rewrite Decision

Ask:

### Should the browser's URL change?

If yes:

```text
Redirect
```

If no:

```text
Rewrite
```

But also ask:

```text
Is this mapping canonical?
Is the destination safe?
Could this create a loop?
Does the method need preservation?
Does cache identity remain correct?
Could user-controlled input influence the destination?
```

---

# 19. Open Redirect Defense

Dangerous pattern:

```text
/login?returnTo=https://evil.example
```

followed blindly.

Safer architecture:

```text
returnTo
   ↓
validate
   ↓
allow only expected internal destinations
   ↓
redirect
```

For example, conceptually:

```text
Allowed:
    /dashboard
    /settings

Rejected:
    https://external.example
    //external.example
```

The exact validation implementation depends on the framework and URL handling, but the security principle is universal.

---

# 20. Rate Limiting

Middleware is often useful for early rate policies.

Example:

```text
Request
   ↓
Identify caller
   ↓
Determine policy
   ↓
Check budget
   ↓
Allow / reject
```

Possible identity dimensions:

```text
IP
API key
user
tenant
route
combination
```

For example:

```text
tenant + endpoint
```

may be more meaningful than:

```text
IP only
```

for a multi-tenant API.

---

# 21. Rate-Limit Identity

A rate-limit key should represent the actual policy boundary.

Examples:

```text
ip:1.2.3.4
```

or:

```text
user:123
```

or:

```text
tenant:acme:api:/reports
```

or:

```text
api-key:xyz
```

The design question is:

> What entity is the system trying to protect?

If the answer is:

```text
Tenant API capacity
```

then tenant-level rate limiting may be more appropriate than IP-level limiting.

---

# 22. Distributed Rate Limiting

In a horizontally scaled system:

```text
Request A → Instance 1
Request B → Instance 2
Request C → Instance 3
```

a process-local counter is insufficient for global limits.

Instead:

```text
                    ┌─────────────┐
Instance 1 ─────────│             │
Instance 2 ─────────│ Rate Store  │
Instance 3 ─────────│             │
                    └─────────────┘
```

Potential distributed mechanisms include:

```text
Redis
distributed KV
edge provider primitives
database-backed counters
```

The architecture must consider:

* atomicity
* expiration
* clock behavior
* race conditions
* failure behavior
* regional consistency

---

# 23. Fail-Open vs Fail-Closed

Suppose the rate-limit backend is unavailable.

What happens?

### Fail closed

```text
Cannot verify limit
        ↓
Reject request
```

### Fail open

```text
Cannot verify limit
        ↓
Allow request
```

The appropriate choice depends on what is being protected.

For security-sensitive policy:

```text
fail-closed
```

may be appropriate.

For availability-critical, lower-risk traffic:

```text
fail-open
```

may be preferable.

The decision should be explicit.

---

# 24. Runtime Constraints

Middleware often executes in an environment with stricter constraints than a full application server.

Therefore avoid treating middleware as a general-purpose service layer.

Ask:

```text
Can this dependency execute here?
Is the runtime supported?
How expensive is it?
Does it require filesystem access?
Does it require a persistent process?
Does it perform large database queries?
Does it import unnecessary code?
```

A middleware bundle should generally remain focused.

---

# 25. Middleware Performance

Middleware runs on the request path.

Therefore:

```text
Middleware latency
+
Application latency
=
User-visible latency
```

If middleware performs:

```text
database query
+
remote API call
+
authorization service call
+
feature service call
```

before every request, it can become a bottleneck.

A useful question is:

> Can this decision be made from already-available request context?

If yes, avoid unnecessary I/O.

---

# 26. Avoid Middleware Waterfalls

Bad:

```text
request
 ↓
tenant lookup
 ↓
user lookup
 ↓
permissions lookup
 ↓
feature lookup
 ↓
application
```

This creates serial latency.

Better:

```text
request
 ↓
normalize context
 ↓
use compact trusted/session information
 ↓
perform only necessary lookups
 ↓
application
```

Or, where appropriate:

```text
parallel lookups
```

while ensuring that the policy semantics remain correct.

---

# 27. Middleware + Cache Integration

This is one of the most important capstone concepts.

The request:

```text
/acme/dashboard
```

may internally rewrite to:

```text
/dashboard
```

But the rendered representation still depends on:

```text
tenant = acme
```

Therefore:

```text
cache identity
```

must preserve the representation-affecting context.

The core invariant:

> Two requests may share a cached representation only if all representation-affecting dependencies are equivalent.

---

# 28. Cache Context

Potential representation dimensions:

```text
tenant
locale
authentication state
user
role
feature flag
region
device class
experimentation variant
```

Do not automatically put every dimension into every cache key.

Instead ask:

> Does this dimension actually change the representation?

If yes, it must influence cache identity or force an appropriate dynamic boundary.

---

# 29. Cache Fragmentation

Suppose:

```text
100,000 users
```

each receive a unique page.

If user identity becomes part of the full-page cache key:

```text
page:user:1
page:user:2
page:user:3
...
```

the cache may fragment badly.

A better architecture might separate:

```text
Shared shell
+
personalized region
```

rather than making the entire page unique.

This is why middleware, caching, and rendering cannot be designed independently.

---

# 30. Personalized Responses

Authentication does not automatically imply:

```text
no caching
```

Instead ask:

```text
Which portion is personalized?
Which portion is shared?
Which dependencies vary?
Where should the dynamic boundary exist?
```

For example:

```text
┌──────────────────────────────┐
│ Shared navigation            │
├──────────────────────────────┤
│ Tenant-specific content      │
├──────────────────────────────┤
│ User-specific notification   │
└──────────────────────────────┘
```

These regions may have different cacheability characteristics.

---

# 31. CDN Interaction

A major production debugging issue is assuming:

```text
every request → application middleware
```

That may not be true when an upstream cache serves the response.

Conceptually:

```text
Browser
   ↓
CDN
   ↓
Cache HIT?
  /   \
yes    no
 |      |
response Middleware
          ↓
       Application
```

Therefore a middleware change may appear ineffective because an upstream cached representation is still being served.

This is an operational concern, not merely an application-code concern.

---

# 32. Cache Identity vs URL Identity

One of the most important KPI 07 conclusions:

```text
same URL
    ≠
same representation
```

Likewise:

```text
same internal route
    ≠
same representation
```

And:

```text
same path
    ≠
same tenant
```

A representation is determined by its effective dependencies.

---

# 33. Feature Flags

Suppose middleware assigns:

```text
variant = A
```

or:

```text
variant = B
```

and both variants render different UI.

Then:

```text
variant
```

is representation-affecting.

A cache that ignores it may serve:

```text
Variant A
```

to a request that should receive:

```text
Variant B
```

Therefore experimentation context must participate in the architecture.

---

# 34. Middleware and Rendering

Middleware should establish context.

Rendering should consume context.

Conceptually:

```text
Middleware
    ↓
Normalized Context
    ↓
Rendering
    ↓
Representation
```

Avoid making every rendering component independently parse:

```text
hostname
cookie
locale
route
headers
```

when a normalized architecture can provide the required context.

---

# 35. Middleware and Server Components

In a full-stack React architecture, middleware should generally answer request-level questions.

Server-side application code should handle:

```text
data fetching
business rules
resource authorization
domain computation
rendering
```

The boundary is:

```text
Middleware:
    Should this request proceed and under what context?

Application:
    What should the application actually do?
```

---

# 36. Mutation Interaction

A mutation can change routing or policy state.

Example:

```text
Admin changes tenant domain
```

Then:

```text
Database
   ↓
tenant routing state changes
   ↓
routing/cache state invalidated
   ↓
future requests use new mapping
```

Another example:

```text
User role changes
```

Then:

```text
authorization state
   ↓
session / policy state
   ↓
cached representation
   ↓
must be reconciled
```

Middleware architecture therefore participates in state transition management.

---

# 37. Stale Routing State

Suppose:

```text
tenant domain:
old.example.com
```

changes to:

```text
new.example.com
```

but some cache still contains:

```text
old.example.com → tenant A
```

The system may produce inconsistent behavior.

Possible stale states include:

```text
routing cache
session state
CDN cache
application cache
database
```

The architecture must define:

```text
source of truth
+
cache lifetime
+
invalidation mechanism
+
failure behavior
```

---

# 38. Redirect Loop Failure

Example:

```text
Request /dashboard
   ↓
Middleware sees no auth
   ↓
redirect /login
   ↓
Middleware sees /login as protected
   ↓
redirect /login
```

Result:

```text
infinite redirect loop
```

Every redirect rule therefore needs an invariant such as:

```text
destination must not trigger the same redirect condition
```

---

# 39. Rewrite Loop Failure

Likewise:

```text
/a → /b
/b → /a
```

creates a routing cycle.

More subtle:

```text
tenant route
 ↓
internal route
 ↓
middleware reconstructs tenant route
 ↓
internal route
```

This can produce hidden loops.

Routing rules should therefore be designed as a directed transformation graph rather than a collection of unrelated conditionals.

---

# 40. Routing Graph

Think of routing transformations as:

```text
                 /legacy
                    |
                    v
              /canonical
                    |
                    v
               /resource
```

A valid routing system should have:

```text
clear terminal destinations
```

rather than arbitrary cycles.

For complex systems, explicitly document:

```text
input
→ normalization
→ transformation
→ destination
```

---

# 41. Production Middleware Architecture Example

Consider:

```text
acme.example.com/fr/dashboard
```

The request pipeline might be:

```text
1. Request arrives

2. Matcher determines middleware applies

3. Trusted host information is validated

4. Host resolves tenant:
       acme

5. Path resolves locale:
       fr

6. Authentication resolves:
       user = 123

7. Authorization verifies:
       user 123 ∈ tenant acme

8. Rate policy evaluated

9. Canonical routing evaluated

10. Request rewritten internally:
       /dashboard

11. Effective context:
       tenant = acme
       locale = fr
       user = 123

12. Rendering/cache architecture determines
    which representation is reusable

13. Application executes

14. Response emitted

15. Observability records:
       request ID
       tenant
       locale
       route
       policy outcome
       latency
```

That is the complete architecture.

---

# 42. Example Policy Matrix

A production system should document its policies.

| Route Class | Auth                  | Tenant            | Rate Limit | Redirect   | Rewrite  | Cache                    |
| ----------- | --------------------- | ----------------- | ---------- | ---------- | -------- | ------------------------ |
| Public      | Optional              | Optional          | Optional   | Canonical  | Possible | Shared                   |
| Dashboard   | Required              | Required          | Yes        | Canonical  | Possible | Context-dependent        |
| Admin       | Required              | Required          | Yes        | Canonical  | Rare     | Usually personalized     |
| API         | Usually required      | Context-dependent | Yes        | Rare       | Rare     | Endpoint-specific        |
| Login       | Anonymous/conditional | Optional          | Yes        | Auth-aware | Possible | Usually not personalized |
| Webhook     | Signature             | Derived           | Yes        | No         | No       | No                       |

The exact policies depend on the application.

The important skill is explicitly defining them.

---

# 43. Request Policy Ordering

Ordering matters.

For example:

```text
tenant resolution
```

may need to occur before:

```text
tenant authorization
```

Likewise:

```text
authentication
```

may need to occur before:

```text
user-specific rate limiting
```

And:

```text
canonical URL determination
```

may need to happen before:

```text
application execution
```

A policy pipeline should therefore be intentionally ordered.

---

# 44. Policy Dependency Graph

Instead of thinking only linearly:

```text
A → B → C
```

think:

```text
                Request
                   |
          ┌────────┴────────┐
          ↓                 ↓
      Host Trust        Path Match
          ↓                 ↓
        Tenant           Route
          ↓
    Authentication
          ↓
    Authorization
          ↓
      Policies
          ↓
      Rendering
```

Dependencies should determine ordering.

---

# 45. Middleware Should Be Deterministic

Given equivalent request context:

```text
Request A
```

and:

```text
Request B
```

middleware should produce equivalent routing/policy outcomes unless an explicitly time-varying policy exists.

Avoid hidden dependencies such as:

```text
random state
local process memory
unstable clocks
uncontrolled external services
```

unless their behavior is intentionally part of the design.

Determinism dramatically improves debugging.

---

# 46. Idempotence

A middleware transformation should ideally be safe to evaluate repeatedly.

For example, canonicalization:

```text
/foo/
   ↓
/foo
```

should not become:

```text
/foo
   ↓
/foo/
```

and back again.

A useful invariant is:

```text
normalize(normalize(request))
=
normalize(request)
```

This is particularly important for:

* trailing slashes
* locale prefixes
* tenant paths
* canonical domains
* query normalization

---

# 47. Observability Architecture

Middleware failures can occur before application code executes.

Therefore observability should capture middleware decisions.

Useful fields include:

```text
requestId
traceId
host
path
method
tenant
locale
principal
route classification
middleware outcome
redirect target
rewrite target
rate-limit outcome
authorization outcome
cache-related context
latency
error
```

Do not log sensitive credentials or raw authentication secrets.

---

# 48. Correlation

A request should be traceable across:

```text
CDN
 ↓
middleware
 ↓
application
 ↓
database
 ↓
external services
```

For example:

```text
traceId = abc123
```

can allow an engineer to reconstruct:

```text
why was this request redirected?
why was this tenant selected?
why was authorization denied?
why did the request hit this route?
why was the response slow?
```

---

# 49. Production Debugging Method

When routing behavior is incorrect, do not immediately inspect application components.

Start with:

```text
1. What URL did the client request?

2. Which host was received?

3. Which middleware matcher applied?

4. What tenant was resolved?

5. What locale was resolved?

6. What authentication state was resolved?

7. What authorization decision occurred?

8. Was there a redirect?

9. Was there a rewrite?

10. Was an upstream cache involved?

11. Which internal route executed?

12. Which response was returned?
```

This sequence prevents debugging the wrong layer.

---

# 50. Debugging Matrix

| Symptom                           | Possible Middleware Cause                  |
| --------------------------------- | ------------------------------------------ |
| Redirect loop                     | Circular redirect condition                |
| Wrong tenant                      | Host/domain resolution bug                 |
| Wrong language                    | Locale precedence bug                      |
| Unauthorized page accessible      | Missing authorization boundary             |
| API redirects unexpectedly        | Incorrect API request handling             |
| Cache leaks tenant data           | Tenant absent from representation identity |
| Users see wrong experiment        | Variant omitted from cache identity        |
| Middleware change appears ignored | CDN/cache hit                              |
| Requests unexpectedly slow        | Middleware I/O                             |
| Rate limit inconsistent           | Local rather than distributed state        |
| Random routing                    | Non-deterministic context                  |
| Legacy URL never disappears       | Incorrect redirect/rewrite graph           |

---

# 51. Failure Scenario 1 — Cross-Tenant Cache Collision

Request:

```text
acme.example.com/dashboard
```

rewrites to:

```text
/dashboard
```

Cache key:

```text
/dashboard
```

Acme response enters cache.

Beta requests:

```text
beta.example.com/dashboard
```

and receives Acme content.

Root cause:

```text
tenant affects representation
but tenant is absent from cache identity.
```

Fix:

```text
tenant-aware representation boundary
```

or:

```text
avoid sharing that representation.
```

---

# 52. Failure Scenario 2 — Authentication Redirect Loop

```text
/dashboard
```

requires authentication.

Middleware redirects:

```text
/dashboard
→ /login
```

But `/login` is accidentally included in the protected matcher.

Result:

```text
/login
→ /login
→ /login
...
```

Fix the route classification.

The login route must satisfy:

```text
login route
+
authentication entry point
=
reachable by anonymous users
```

---

# 53. Failure Scenario 3 — Rate Limiter Becomes Bottleneck

Every request performs:

```text
remote rate-limit lookup
```

with high network latency.

Traffic increases.

Middleware latency increases.

The application appears slow even though business logic is healthy.

Root cause:

```text
request-control dependency became a critical-path bottleneck.
```

Possible architectural responses:

```text
edge-native limiting
local fast-path
distributed atomic store
coarser policy
batching
different request classification
```

The correct choice depends on the workload.

---

# 54. Failure Scenario 4 — Middleware-Only Authorization

Middleware checks:

```text
/admin
```

and allows an authenticated administrator.

An API endpoint:

```text
/api/users/delete
```

does not perform equivalent authorization.

An attacker calls the API directly.

The UI route protection provides no security.

Lesson:

> Navigation protection is not resource authorization.

---

# 55. Failure Scenario 5 — Stale Tenant Mapping

Tenant domain is updated:

```text
old.example.com
→ new.example.com
```

Database is correct.

But a routing cache still contains the old mapping.

Some requests behave differently depending on which cache state they encounter.

The architecture needs:

```text
source of truth
+
cache policy
+
invalidation
+
propagation expectation
```

---

# 56. Failure Scenario 6 — Feature Flag Cache Collision

Middleware determines:

```text
variant = A
```

for one request.

Another request should receive:

```text
variant = B
```

but both share:

```text
/page
```

cache identity.

The cache returns the wrong representation.

Root cause:

```text
feature variant is representation-affecting
but absent from cache identity.
```

---

# 57. Failure Scenario 7 — CDN Masks Middleware Change

Engineer changes:

```text
redirect /old → /new
```

but testing still returns the previous behavior.

Application logs show:

```text
middleware never executed
```

Possible explanation:

```text
CDN served cached response before reaching origin.
```

Debugging must inspect every request layer.

---

# 58. Production Architecture Principles

The capstone should leave you with these principles.

### Principle 1

> Middleware is a request-control layer, not the entire application.

### Principle 2

> Scope middleware narrowly.

### Principle 3

> Normalize request context early.

### Principle 4

> Separate authentication from authorization.

### Principle 5

> Never rely solely on navigation middleware for resource security.

### Principle 6

> Treat tenant context as a first-class isolation boundary.

### Principle 7

> Treat locale and feature variants as representation context when they affect output.

### Principle 8

> Redirect when external URL identity should change.

### Principle 9

> Rewrite when internal routing should change without changing external identity.

### Principle 10

> Middleware latency is request latency.

### Principle 11

> Cache identity must include representation-affecting dependencies.

### Principle 12

> Distributed policies require distributed state or intentionally scoped semantics.

### Principle 13

> Middleware decisions should be observable.

### Principle 14

> Routing transformations should be deterministic and preferably idempotent.

### Principle 15

> Every security-sensitive policy needs a clearly defined trust boundary.

---

# 59. SDE-2 Architecture Exercise

Design middleware for:

```text
app.example.com
acme.example.com
beta.example.com
customerdomain.com
```

Requirements:

* public marketing pages
* authenticated dashboards
* tenant isolation
* locale routing
* admin routes
* API rate limiting
* custom domains
* feature flags
* canonical redirects
* shared caching where safe
* personalized dashboard regions
* observability

Your architecture should explicitly define:

```text
matcher
tenant resolution
locale resolution
authentication
authorization
rate-limit identity
redirect rules
rewrite rules
cache identity
rendering boundaries
failure behavior
observability
```

Do not start with code.

Start with the request model.

---

# 60. Prediction Challenge 1

A request:

```text
acme.example.com/fr/dashboard
```

is rewritten to:

```text
/dashboard
```

The cache key contains only:

```text
/dashboard
```

What is the architectural risk?

### Expected reasoning

The internal route does not fully describe the representation.

The representation depends on:

```text
tenant = acme
locale = fr
```

Therefore the cache identity is incomplete.

---

# 61. Prediction Challenge 2

A middleware function performs:

```text
database tenant lookup
remote authorization lookup
remote rate-limit lookup
```

for every request.

Traffic increases by 10×.

What should you expect?

### Expected reasoning

Middleware becomes a request-path dependency on three external systems.

Likely effects include:

```text
higher latency
tail-latency amplification
dependency saturation
failure propagation
increased origin load
```

The architecture must be reconsidered.

---

# 62. Prediction Challenge 3

A middleware redirect is:

```text
if !authenticated:
    redirect("/login")
```

The matcher includes:

```text
/*
```

What happens?

### Expected reasoning

The login route itself is intercepted.

This can create an infinite redirect loop.

The problem is not the redirect primitive.

The problem is incorrect request classification.

---

# 63. Prediction Challenge 4

A user is authorized to access:

```text
/acme/reports
```

but not:

```text
/beta/reports
```

The browser is authenticated.

What must be checked?

### Expected reasoning

Authentication alone is insufficient.

The server must establish:

```text
principal
+
tenant
+
membership
+
resource
+
operation
```

Authorization must be evaluated against the effective tenant/resource context.

---

# 64. Prediction Challenge 5

Middleware assigns:

```text
experiment = checkout-v2
```

and rewrites:

```text
/checkout
→ /checkout-v2
```

A shared cache ignores the experiment context.

What can happen?

### Expected reasoning

Requests can receive representations generated for another experiment variant.

This is a cache identity problem created by routing context.

---

# 65. Senior Interview Question Set

### Question 1

Why shouldn't middleware contain all authorization logic?

Expected discussion:

```text
middleware protects request/navigation boundaries,
while resource authorization belongs at the server/resource boundary.
```

---

### Question 2

What is the difference between redirect and rewrite?

Expected discussion:

```text
redirect:
external URL/navigation changes

rewrite:
internal destination changes while external URL remains
```

---

### Question 3

How would you design tenant-aware middleware?

Expected discussion:

```text
trusted host
→ tenant resolution
→ authenticated principal
→ tenant membership
→ normalized tenant context
→ downstream propagation
```

---

### Question 4

How can middleware break caching?

Expected discussion:

```text
middleware can introduce representation dimensions
that are absent from cache identity.
```

---

### Question 5

Why can middleware hurt performance?

Expected discussion:

```text
it executes on the request path,
so unnecessary computation and I/O directly affect latency.
```

---

### Question 6

How would you rate-limit a multi-tenant API?

Expected discussion:

```text
define the policy boundary first:
tenant/user/API key/endpoint,
then choose distributed state and failure semantics accordingly.
```

---

### Question 7

What happens if middleware and CDN disagree?

Expected discussion:

```text
different layers may serve different states;
debugging must identify which layer actually handled the request.
```

---

### Question 8

How would you prevent redirect loops?

Expected discussion:

```text
explicit route classification,
canonicalization invariants,
destination safety,
idempotent normalization.
```

---

# 66. Architecture Review Checklist

Before approving production middleware, ask:

## Scope

```text
□ Is the matcher intentionally scoped?
□ Are static assets excluded where appropriate?
□ Are APIs treated separately when semantics differ?
```

## Security

```text
□ Are trust boundaries explicit?
□ Is authentication separate from authorization?
□ Are protected resources independently authorized?
□ Are open redirects prevented?
□ Are tenant boundaries enforced?
```

## Routing

```text
□ Are redirects canonical?
□ Are rewrites necessary?
□ Can transformations loop?
□ Are transformations idempotent?
□ Is URL normalization deterministic?
```

## Multi-Tenancy

```text
□ Is tenant resolution deterministic?
□ Is tenant membership verified?
□ Does tenant context propagate downstream?
□ Are tenant-specific caches isolated?
```

## Locale

```text
□ Is locale resolution deterministic?
□ Is locale canonicalized?
□ Does locale affect representation identity where necessary?
```

## Rate Limiting

```text
□ Is the policy identity correct?
□ Is distributed state required?
□ Is failure behavior explicit?
□ Are limits observable?
```

## Performance

```text
□ Is middleware lightweight?
□ Are external calls minimized?
□ Are serial waterfalls avoided?
□ Is tail latency understood?
```

## Cache

```text
□ Does cache identity include all representation-affecting context?
□ Are personalized regions isolated?
□ Is CDN behavior understood?
□ Is invalidation defined?
```

## Observability

```text
□ Are routing decisions traceable?
□ Are tenant and locale visible?
□ Are redirects/rewrite decisions observable?
□ Are failures diagnosable?
```

---

# 67. Final Production Mental Model

The complete KPI can now be reduced to:

```text
             REQUEST
                ↓
        ┌───────────────┐
        │   MATCHER     │
        └───────┬───────┘
                ↓
        ┌───────────────┐
        │   NORMALIZE   │
        └───────┬───────┘
                ↓
        ┌───────────────┐
        │ SECURITY/TRUST│
        └───────┬───────┘
                ↓
       ┌────────┴────────┐
       ↓                 ↓
    TENANT             LOCALE
       └────────┬────────┘
                ↓
        ┌───────────────┐
        │ AUTHENTICATE  │
        └───────┬───────┘
                ↓
        ┌───────────────┐
        │ AUTHORIZE     │
        └───────┬───────┘
                ↓
        ┌───────────────┐
        │ POLICY/RATE   │
        └───────┬───────┘
                ↓
       ┌────────┼────────┐
       ↓        ↓        ↓
   REDIRECT   REWRITE  CONTINUE
                         ↓
                  CACHE / RENDER
                         ↓
                    APPLICATION
                         ↓
                      RESPONSE
                         ↓
                   OBSERVABILITY
```

The architecture is not simply:

```text
request → middleware → response
```

It is:

```text
request
→ normalized context
→ policy decisions
→ routing transformation
→ representation decision
→ application execution
→ response
→ observable outcome
```

---

# 68. KPI 07 Completion Standard

KPI 07 is complete when you can independently explain and implement:

```text
□ Middleware execution model
□ Matcher design
□ Request classification
□ Redirects
□ Rewrites
□ Authentication-aware routing
□ Authorization boundaries
□ Multi-tenant routing
□ Locale routing
□ Host-based routing
□ Rate limiting
□ Request policies
□ Runtime constraints
□ Middleware performance
□ Cache interaction
□ Rendering interaction
□ Personalization boundaries
□ Feature-variant routing
□ CDN interaction
□ Routing failure modes
□ Security failure modes
□ Distributed policy failure modes
□ Observability
□ Production debugging
□ Architecture tradeoffs
```

More importantly, you should be able to answer:

> **Why does this decision belong in middleware rather than in the application layer, and what downstream consequences does that decision create for security, caching, rendering, performance, and observability?**

That is the SDE-2-level competency.

---

# 69. KPI 07 Executive Summary

```text
Middleware
    =
request-control plane
```

```text
Authentication
    =
who is requesting?
```

```text
Authorization
    =
what may they access/do?
```

```text
Tenant
    =
which customer/application context?
```

```text
Locale
    =
which representation language/context?
```

```text
Redirect
    =
change external navigation
```

```text
Rewrite
    =
change internal destination
```

```text
Rate Limit
    =
control request consumption
```

```text
Cache Identity
    =
all dependencies required to safely reuse a representation
```

```text
Observability
    =
make middleware decisions explainable
```

The governing production principle is:

> **Middleware should establish trustworthy request context and enforce request-level policy while remaining small, deterministic, observable, and compatible with the security, caching, rendering, and performance architecture around it.**

---

# 70. Part Boundary

This capstone completes **KPI 07: Middleware & Request Processing Architecture**.

The next KPI should therefore move beyond middleware itself rather than repeating:

* routing
* authentication
* rewrites
* redirects
* tenant resolution
* locale resolution
* rate limiting
* middleware performance
* middleware/cache integration

The knowledge from KPI 07 should now be treated as an established architectural capability.

**KPI 07: COMPLETE.**
