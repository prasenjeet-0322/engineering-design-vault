# Level 08 — Next.js & Full-Stack React

# KPI 07 — Middleware & Request-Level Architecture

## Part 02 — Request Matching & Middleware Execution Model

---

# 1. Part Objective

Part 01 established the fundamental model:

```text
Incoming Request
      ↓
Middleware
      ↓
Request-Level Decision
      ↓
Application
```

Part 02 answers the next critical question:

> **Which requests should Middleware actually process, and what exactly happens when a request enters the Middleware execution path?**

This matters because Middleware is positioned close to the request boundary.

If the matching strategy is too broad:

```text
more requests
   ↓
more Middleware execution
   ↓
more latency / compute
```

If it is too narrow:

```text
some protected requests
   ↓
bypass intended policy
```

Therefore, request matching is simultaneously:

```text
correctness
+
security
+
performance
+
architecture
```

---

# 2. The Core Mental Model

Do not think:

```text
Every request
   ↓
Middleware logic
```

Think:

```text
Incoming Request
       ↓
Request Matcher
       ↓
Does this request belong to Middleware?
       │
       ├── NO ──→ normal processing
       │
       └── YES
             ↓
         Middleware
             ↓
         Decision
```

The matcher determines the **scope of the request-level policy**.

---

# 3. Why Matching Is an Architectural Boundary

Imagine an application:

```text
/
├── dashboard
├── settings
├── billing
├── admin
├── login
├── signup
├── api
├── images
├── fonts
├── favicon
└── public assets
```

Suppose the Middleware policy is:

```text
authenticated users only
```

It probably should not blindly apply to:

```text
/login
/signup
/favicon.ico
/static assets
```

The policy needs a defined scope.

For example:

```text
Protected application routes
        ↓
Middleware
```

rather than:

```text
Entire HTTP surface
        ↓
Middleware
```

---

# 4. Matcher Scope

A useful abstraction:

```text
Matcher
=
Set of requests
for which Middleware is relevant
```

Mathematically:

```text
M = { requests | request satisfies policy }
```

For example:

```text
M =
{
  /dashboard/*
  /settings/*
  /billing/*
}
```

Then:

```text
/dashboard
→ M

/dashboard/reports
→ M

/settings/profile
→ M

/login
→ not M
```

This gives you a precise definition of Middleware scope.

---

# 5. Scope Before Logic

A common mistake is:

```text
Middleware
 ↓
if pathname === "/dashboard"
   do something

if pathname === "/settings"
   do something

if pathname === "/billing"
   do something

if pathname === "/admin"
   do something
```

while Middleware itself still executes broadly.

A cleaner conceptual design is:

```text
Matcher
 ↓
select relevant requests
 ↓
Middleware
 ↓
small decision tree
```

The principle is:

> **Use matching to establish scope; use Middleware logic to make the decision.**

---

# 6. Broad Matcher vs Narrow Matcher

Consider two strategies.

### Broad

```text
All application requests
        ↓
Middleware
        ↓
check pathname
```

### Narrow

```text
Protected routes
        ↓
Middleware
```

The narrow strategy can reduce unnecessary execution.

But it introduces a responsibility:

> The matcher must remain synchronized with the application's protected surface.

If a new route is added:

```text
/admin/audit
```

but the matcher only includes:

```text
/admin/users
/admin/settings
```

the new route may not receive the intended Middleware policy.

This is a correctness risk.

---

# 7. Security Implication of Under-Matching

Suppose:

```text
/dashboard/*
```

is protected.

Later someone creates:

```text
/reports
```

and assumes Middleware protects it.

But the matcher does not include:

```text
/reports
```

Now:

```text
/reports
```

bypasses the request-level gate.

This demonstrates:

> **A matcher is part of the security configuration.**

However, remember that actual authorization should still be enforced at the operation/resource boundary.

---

# 8. Over-Matching

The opposite problem:

```text
Middleware
→ matches almost everything
```

Now requests such as:

```text
/favicon.ico
robots.txt
public images
static assets
```

may enter the Middleware path unnecessarily, depending on the application's routing/runtime behavior and matcher configuration.

Potential consequences:

```text
extra execution
+
extra branching
+
extra logging
+
extra latency
```

At high traffic volumes, this becomes operationally relevant.

---

# 9. The Cost Model

Suppose:

```text
10 million requests/day
```

and Middleware performs:

```text
1 ms
```

of computation per matched request.

If all requests match:

```text
10,000,000 × 1ms
=
10,000 seconds
```

of cumulative execution.

If only 20% require Middleware:

```text
2,000,000 × 1ms
=
2,000 seconds
```

The exact infrastructure cost depends on deployment architecture, but the principle is general:

> **Request scope determines how often request-level work occurs.**

---

# 10. Request Matching Is Not Authorization

This distinction must remain clear.

A matcher answers:

```text
Should Middleware run for this request?
```

It does not answer:

```text
Is this user allowed to access this resource?
```

For example:

```text
/admin/*
```

matching Middleware does not prove:

```text
user.role === "admin"
```

It merely means:

```text
/admin/* requests
→ request-level policy applies
```

Authorization remains a separate concern.

---

# 11. Matcher + Middleware + Authorization

The complete architecture:

```text
Incoming Request
       ↓
Matcher
       ↓
Does policy apply?
       ↓
Middleware
       ↓
Coarse request gate
       ↓
Application
       ↓
Authentication
       ↓
Authorization
       ↓
Operation
```

This gives you multiple layers without confusing their responsibilities.

---

# 12. Execution Model

Once a request matches:

```text
Request
   ↓
Middleware execution
   ↓
inspect request
   ↓
make decision
```

The possible conceptual outcomes are:

```text
continue
redirect
rewrite
reject
```

The important property is:

> Middleware is part of the request's control-flow graph.

---

# 13. Continue

The simplest outcome:

```text
Request
   ↓
Middleware
   ↓
Continue
   ↓
normal routing/application processing
```

The request proceeds toward its intended destination.

This is the common path for an already-valid request.

---

# 14. Redirect

A redirect changes the browser-visible destination.

Conceptually:

```text
Request A
   ↓
Middleware
   ↓
Redirect → B
   ↓
Browser
   ↓
Request B
```

Therefore a redirect can produce a **new request lifecycle**.

This is important when debugging.

You may see:

```text
Request A
→ middleware
→ redirect
```

followed by:

```text
Request B
→ middleware
→ application
```

Middleware may therefore participate in both requests if the matcher includes both destinations.

---

# 15. Rewrite

A rewrite changes the internal destination.

Conceptually:

```text
Browser
   │
   │ /public
   ▼
Middleware
   │
   │ rewrite
   ▼
Internal route
```

The browser can continue to represent the public URL while the application resolves another destination.

This is especially useful for:

```text
tenant routing
legacy routes
friendly URLs
custom domains
internal application structure
```

---

# 16. Reject / Block

A request may also be stopped.

Conceptually:

```text
Request
   ↓
Middleware
   ↓
Policy violation
   ↓
Reject
```

Examples can include:

```text
invalid request pattern
rate limit exceeded
known disallowed route
security policy violation
```

The exact response mechanism depends on the application and deployment architecture.

---

# 17. Execution Graph

Think of Middleware as a graph node:

```text
                 ┌────────────┐
                 │  Request   │
                 └─────┬──────┘
                       │
                       ▼
                 ┌────────────┐
                 │  Matcher   │
                 └─────┬──────┘
                       │
              ┌────────┴────────┐
              │                 │
          no match            match
              │                 │
              ▼                 ▼
          Continue         Middleware
                                │
                   ┌────────────┼────────────┐
                   │            │            │
                   ▼            ▼            ▼
                Continue     Redirect      Rewrite
```

This mental model is more useful than memorizing configuration syntax.

---

# 18. Matcher Design Strategy

When designing a matcher, start from requirements.

Bad starting point:

```text
"What regex can I write?"
```

Better:

```text
"Which request classes require this policy?"
```

Then define:

```text
Request Classes
       ↓
Protected routes
       ↓
Public routes
       ↓
API routes
       ↓
Static resources
       ↓
Special cases
```

Only then encode the matching strategy.

---

# 19. Request Classification

A useful architecture is:

```text
Request
│
├── Public page
├── Protected page
├── API request
├── Authentication route
├── Static resource
├── Asset request
└── Special system route
```

Each class can have a different policy.

For example:

```text
Protected page
→ authentication gate

Authentication route
→ redirect authenticated user if appropriate

API
→ API-specific security

Static asset
→ usually no application authentication logic
```

This is clearer than one giant conditional tree.

---

# 20. Authentication Routes

Authentication routes are a classic special case:

```text
/login
/signup
/forgot-password
/reset-password
```

If Middleware protects all routes indiscriminately:

```text
request /login
 ↓
Middleware
 ↓
not authenticated
 ↓
redirect /login
```

This creates:

```text
/login
→ /login
→ /login
→ ...
```

Therefore public authentication routes need deliberate treatment.

---

# 21. Redirect Loop Invariant

A safe routing policy should have a termination condition.

For every redirect rule:

```text
if condition is true
    redirect
```

you should ask:

> Can the destination request cause the same condition to remain true?

If yes:

```text
potential redirect loop
```

For example:

```text
if !authenticated:
    redirect("/login")
```

requires:

```text
/login
```

to be excluded from that same protection condition.

---

# 22. Rewrite Loop Invariant

The same idea applies to rewrites.

Suppose:

```text
/public
→ /internal
```

and:

```text
/internal
→ /public
```

You have a cycle.

Therefore:

> Request transformations must have a clear terminating state.

A routing graph should converge.

---

# 23. Matcher Changes as Deployment Risk

Suppose your production system currently protects:

```text
/dashboard/*
```

and a new deployment adds:

```text
/reports/*
```

but forgets to update the matcher.

The feature may work functionally while the intended request-level policy does not apply.

Therefore matcher changes should be treated as part of:

```text
security-sensitive configuration
```

and tested accordingly.

---

# 24. Testing Matcher Behavior

Do not test only:

```text
/dashboard
```

Test the request classes around it:

```text
/dashboard
/dashboard/settings
/dashboard/reports
/settings
/login
/signup
/api/*
/public
/static resources
```

Create an explicit matrix.

Example:

| Request              | Middleware? | Expected decision |
| -------------------- | ----------: | ----------------- |
| `/dashboard`         |         Yes | auth gate         |
| `/dashboard/reports` |         Yes | auth gate         |
| `/login`             |          No | continue          |
| `/signup`            |          No | continue          |
| `/public`            |          No | continue          |
| `/admin`             |         Yes | admin policy      |

The exact paths depend on your application.

---

# 25. Negative Tests Are Critical

A common testing mistake is only verifying:

```text
protected route
→ Middleware runs
```

Also verify:

```text
public route
→ Middleware does not apply
```

and:

```text
unrelated route
→ Middleware does not apply
```

Why?

Because over-matching can introduce:

```text
latency
+
redirects
+
unexpected behavior
```

Negative-space testing is essential for routing systems.

---

# 26. Matcher Regression Testing

Imagine a matcher initially supports:

```text
/dashboard/*
/settings/*
```

A later refactor changes route structure:

```text
/app/dashboard/*
/app/settings/*
```

If the matcher is not updated:

```text
new routes
→ policy bypass
```

Therefore route migrations should include:

```text
matcher review
+
security review
+
integration tests
```

---

# 27. Middleware and API Routes

API routes may have different requirements from page routes.

For example:

```text
GET /api/public-products
```

may be public.

While:

```text
POST /api/admin/users
```

requires authentication and authorization.

Do not assume:

```text
/api/*
```

should have one universal policy.

Instead classify:

```text
public API
authenticated API
admin API
webhook API
internal API
```

---

# 28. Webhooks

Webhooks are a particularly important exception.

Example:

```text
POST /api/webhooks/payment
```

This request may not contain a normal user session.

Instead, security may depend on:

```text
signature verification
```

Therefore:

```text
"not authenticated as a user"
```

does not necessarily mean:

```text
"invalid request"
```

This demonstrates why Middleware authentication assumptions must not be blindly applied to every endpoint.

---

# 29. Cron / Internal Requests

Similarly, internal jobs may use:

```text
service credentials
signed requests
internal network controls
```

rather than browser sessions.

A generic:

```text
if no user session → redirect
```

can break non-browser workflows.

Request classification is therefore essential.

---

# 30. Middleware and Content Negotiation

Request properties may include:

```text
method
host
pathname
headers
cookies
query parameters
```

These can influence routing.

For example:

```text
Accept-Language
```

may influence locale routing.

But avoid turning Middleware into a full content-negotiation engine if the application's routing layer can handle the responsibility more cleanly.

---

# 31. Host-Based Matching

Multi-tenant applications often care about:

```text
Host
```

For example:

```text
acme.example.com
```

versus:

```text
globex.example.com
```

The path might be identical:

```text
/dashboard
```

but the tenant differs.

Therefore:

```text
request identity
=
host + pathname
```

may be more appropriate than:

```text
pathname only
```

This has direct consequences for caching.

---

# 32. Tenant Routing Example

Conceptually:

```text
Request
Host: acme.example.com
Path: /dashboard

        ↓

Middleware

tenant = acme

        ↓

rewrite

/_tenants/acme/dashboard
```

Another request:

```text
Host: globex.example.com
Path: /dashboard

        ↓

tenant = globex

        ↓

rewrite

/_tenants/globex/dashboard
```

The public URL remains stable while the internal destination changes.

---

# 33. Tenant Isolation and Cache Identity

Now connect this with KPI 06.

If:

```text
acme.example.com/dashboard
```

and:

```text
globex.example.com/dashboard
```

share the same cached representation incorrectly:

```text
tenant A
   ↓
cache
   ↓
tenant B
```

you have a serious isolation failure.

Therefore:

```text
tenant resolution
```

must be reflected in the architecture of:

```text
data access
+
rendering
+
cache identity
```

---

# 34. Locale + Tenant + User

A complex request may have:

```text
host = acme.example.com
locale = fr
user = 123
path = /dashboard
```

The application may therefore conceptually depend on:

```text
tenant
+
locale
+
user
+
path
```

But this does **not** mean every dimension must be embedded into every cache key.

Instead, determine which dimensions actually change each representation.

For example:

```text
Organization data
→ tenant

Localized marketing content
→ tenant + locale

Private profile
→ user

Shared dashboard metrics
→ tenant + period
```

This is dependency-driven identity design.

---

# 35. Middleware and Cache Poisoning

Routing transformations can interact with caches.

Suppose:

```text
request A
→ rewrite destination X
```

and the caching layer incorrectly treats:

```text
request A
```

and:

```text
request B
```

as equivalent.

Then a representation generated for one request context may be reused for another.

This is why:

```text
routing identity
+
cache identity
```

must be designed together.

---

# 36. Middleware and Request Headers

Headers can influence request decisions.

Examples:

```text
Host
Accept-Language
Authorization
Cookie
User-Agent
```

But not every header should become part of cache identity.

Otherwise:

```text
many header variations
        ↓
many cache entries
        ↓
cache fragmentation
```

Again, identify only the dimensions that actually affect the representation.

---

# 37. Request Matching and Performance

Suppose Middleware performs:

```text
tenant extraction
authentication verification
logging
feature evaluation
```

If it runs for:

```text
all requests
```

then even cheap operations multiply.

If it runs only for:

```text
protected application requests
```

the system may avoid unnecessary work.

Therefore:

> **The matcher is a performance optimization as well as a correctness boundary.**

---

# 38. But Do Not Over-Optimize the Matcher

There is a tradeoff.

An extremely complicated matcher:

```text
huge regex
+
many exceptions
+
special cases
+
route-specific conditions
```

can become difficult to reason about.

Then the configuration itself becomes a source of bugs.

Prefer:

```text
clear route classes
+
simple matching rules
+
small Middleware decision tree
```

over cleverness.

---

# 39. Request Matching and Maintainability

A good Middleware architecture should make this obvious:

```text
Protected:
 /dashboard/*
 /settings/*
 /billing/*

Public:
 /login
 /signup

Special:
 /api/webhooks/*
```

A future engineer should be able to answer:

> "Which requests are intercepted?"

without reverse-engineering a giant regular expression.

Clarity is an operational feature.

---

# 40. Execution Frequency

Middleware execution frequency depends on:

```text
request volume
+
matcher scope
+
navigation behavior
+
asset/API requests
+
deployment architecture
```

Therefore do not mentally model Middleware as:

```text
once per page
```

Model it as:

```text
once per matching request
```

That is the safer abstraction.

---

# 41. Client Navigation

Modern Next.js applications may perform navigation requests that do not look identical to a traditional full browser navigation.

Therefore, when debugging Middleware, inspect the actual network/request behavior rather than assuming:

```text
one click
=
one HTTP request
```

There may be framework-specific requests involved in rendering/navigation.

The key architectural principle remains:

```text
Middleware operates at the request boundary.
```

---

# 42. Middleware and Static Assets

A broad Middleware policy can accidentally affect assets.

Potentially:

```text
/dashboard
→ auth logic

/logo.svg
→ auth logic

/font.woff2
→ auth logic
```

This is unnecessary for most applications.

The desired architecture is generally:

```text
application request
→ request policy

static resource
→ resource delivery
```

unless a specific security or routing requirement says otherwise.

---

# 43. Middleware and Images

Image requests can have different routing characteristics from page requests.

If Middleware is only intended to protect application pages, avoid unintentionally adding application-level authentication logic to every image request.

This is another reason to define request classes explicitly.

---

# 44. Middleware and Favicon

The classic debugging symptom:

> "Why is my favicon redirecting to login?"

Likely cause:

```text
broad matcher
+
authentication redirect
```

The request:

```text
/favicon.ico
```

enters Middleware and gets redirected.

The fix is not React.

The fix is request scope.

---

# 45. Matcher and Route Evolution

Routes change over time.

For example:

```text
/dashboard
```

becomes:

```text
/app/dashboard
```

or:

```text
/workspaces/[workspaceId]/dashboard
```

Now the original matcher may no longer describe the intended security surface.

Therefore Middleware configuration should be reviewed whenever:

```text
route structure changes
+
authentication architecture changes
+
tenant model changes
+
API structure changes
```

---

# 46. Architecture Rule: Route Ownership

A useful practice is to define ownership:

```text
Route
 ↓
Policy owner
```

Example:

```text
/dashboard/*
→ authenticated application

/admin/*
→ authenticated + admin authorization

/api/webhooks/*
→ webhook signature validation

/public/*
→ public
```

This makes security policy explicit.

---

# 47. Policy Composition

As applications grow, multiple policies may apply:

```text
Request
 ↓
Tenant detection
 ↓
Authentication gate
 ↓
Locale routing
 ↓
Application
```

Do not let these become an uncontrolled chain.

Instead define:

```text
policy order
```

and:

```text
policy responsibility
```

For example:

```text
1. Normalize request
2. Resolve tenant
3. Determine authentication context
4. Apply routing decision
5. Continue
```

The exact order depends on requirements.

---

# 48. Why Ordering Matters

Suppose:

```text
authentication
```

depends on:

```text
tenant
```

Then:

```text
authentication
```

cannot correctly execute before:

```text
tenant resolution
```

Conceptually:

```text
Host
 ↓
Tenant
 ↓
Authentication
 ↓
Authorization
```

versus an incorrect:

```text
Authentication
 ↓
Tenant
```

if authentication configuration itself is tenant-specific.

Therefore Middleware policy ordering is part of system correctness.

---

# 49. Middleware as a Pipeline

A useful mental model:

```text
Request
  ↓
Normalize
  ↓
Tenant
  ↓
Locale
  ↓
Auth
  ↓
Routing
  ↓
Application
```

Each stage should have:

```text
input
+
decision
+
output
```

Avoid one stage doing everything.

---

# 50. Pipeline Failure Semantics

For each stage ask:

```text
What happens if this fails?
```

For example:

### Tenant resolution fails

```text
reject
```

or:

```text
fallback
```

### Authentication fails

```text
redirect
```

### Locale detection fails

```text
default locale
```

### Rate limit exceeded

```text
reject
```

These decisions should be explicit.

---

# 51. Fail Open vs Fail Closed

Security-sensitive request policies require careful consideration.

### Fail closed

```text
uncertain
 ↓
deny
```

### Fail open

```text
uncertain
 ↓
allow
```

For example:

```text
authorization
```

usually has a very different failure posture from:

```text
locale detection
```

You should not apply one universal failure policy to every Middleware concern.

---

# 52. Middleware Dependency Graph

Imagine:

```text
Request
│
├── Host
│    ↓
│   Tenant
│
├── Cookie
│    ↓
│   Authentication
│
└── Headers
     ↓
    Locale
```

Then:

```text
Tenant + Authentication
        ↓
Protected route decision
```

This is a dependency graph.

The more external dependencies Middleware introduces, the more complex this graph becomes.

---

# 53. Avoid Dependency Explosion

Bad:

```text
Middleware
├── DB
├── Redis
├── Payment API
├── Feature Flag API
├── User Preferences API
├── Analytics API
└── CMS
```

Now every request depends on many systems.

Better:

```text
Middleware
├── request metadata
├── lightweight identity signal
├── deterministic routing rules
└── minimal policy
```

Then:

```text
Application
├── data
├── business logic
├── authorization
└── external integrations
```

---

# 54. Observability for Matching

For debugging, record structured information such as:

```text
requestId
path
host
matchedPolicy
decision
redirectTarget
rewriteTarget
latency
```

Example:

```text
requestId: abc123
path: /dashboard
matched: protected
decision: redirect
target: /login
middlewareDuration: 1.4ms
```

This is much more useful than:

```text
console.log("middleware")
```

---

# 55. Do Not Log Secrets

Avoid logging:

```text
session cookies
Authorization headers
tokens
password reset values
private user data
```

Instead log:

```text
request ID
route
policy result
timing
safe identifiers
```

Observability must not weaken security.

---

# 56. Testing the Complete Request Matrix

A senior-level test matrix might look like:

| Class            | Example                 |   Match | Expected         |
| ---------------- | ----------------------- | ------: | ---------------- |
| Public           | `/`                     |      No | Continue         |
| Auth             | `/login`                |      No | Continue         |
| Protected        | `/dashboard`            |     Yes | Auth gate        |
| Protected nested | `/dashboard/reports`    |     Yes | Auth gate        |
| Admin            | `/admin`                |     Yes | Admin policy     |
| Webhook          | `/api/webhooks/payment` | Special | Signature policy |
| Public API       | `/api/products`         | Special | Public           |
| Static           | `/favicon.ico`          |      No | Continue         |
| Asset            | `/images/logo.svg`      |      No | Continue         |

The actual application can differ.

The important part is explicit classification.

---

# 57. Prediction Challenge 1

### Situation

You add authentication Middleware.

Suddenly:

```text
/logo.svg
```

returns a redirect to:

```text
/login
```

### What is your first suspicion?

Not React.

Not CSS.

Not image loading.

Investigate:

```text
request matcher
+
Middleware scope
```

---

# 58. Prediction Challenge 2

### Situation

A new protected route:

```text
/reports
```

works for unauthenticated users even though:

```text
/dashboard
```

does not.

### What should you inspect?

```text
matcher coverage
+
route classification
```

The likely issue is that the request is not entering the intended Middleware policy.

---

# 59. Prediction Challenge 3

### Situation

A webhook from a payment provider suddenly gets redirected to:

```text
/login
```

### What is the architectural smell?

A generic browser authentication policy has been applied to a machine-to-machine endpoint.

Investigate:

```text
/api/webhooks/*
```

classification and authentication assumptions.

---

# 60. Prediction Challenge 4

### Situation

A tenant routing system works correctly for:

```text
acme.example.com
```

but sometimes resolves:

```text
globex.example.com
```

to the wrong tenant.

Investigate:

```text
host parsing
+
tenant resolution
+
rewrite destination
+
cache identity
```

Do not treat this as merely a frontend routing bug.

---

# 61. Prediction Challenge 5

### Situation

Middleware latency rises from:

```text
2ms → 80ms
```

after a feature is added.

The new code calls:

```text
remote feature-flag service
```

What happened?

You introduced a remote dependency into the critical request path.

Trace:

```text
request
 ↓
Middleware
 ↓
remote service
 ↓
application
```

The request now inherits that dependency's latency and failure behavior.

---

# 62. Prediction Challenge 6

### Situation

A protected route is added during a refactor.

The route works correctly for logged-in users but is also accessible without authentication.

### What does this teach?

Functional routing and security routing are separate concerns.

A route can be:

```text
functionally correct
```

while:

```text
policy coverage is incorrect
```

Therefore matcher coverage must be tested independently.

---

# 63. Senior Interview Question

### "How do you design Middleware for a large application?"

A strong answer:

```text
1. Define request classes.
2. Establish explicit matching scope.
3. Keep Middleware lightweight.
4. Separate authentication gating from authorization.
5. Use redirects and rewrites deliberately.
6. Avoid expensive data dependencies.
7. Define policy ordering.
8. Test positive and negative matcher cases.
9. Consider tenant/locale/cache identity interactions.
10. Instrument decisions and latency.
```

This demonstrates architectural thinking.

---

# 64. Senior Interview Question

### "Should Middleware run on every request?"

The answer should not be an absolute yes or no.

Instead:

> Middleware should run for requests that require the request-level policy it implements. Broad matching can simplify coverage but may increase execution cost and introduce unintended behavior; overly narrow matching can create policy gaps.

That is the tradeoff.

---

# 65. Senior Interview Question

### "What is the difference between a matcher and Middleware logic?"

A concise answer:

```text
Matcher
→ determines whether Middleware applies.

Middleware logic
→ determines what to do with a matching request.
```

This distinction is fundamental.

---

# 66. Senior Interview Question

### "Can Middleware replace authorization?"

No.

A useful explanation:

```text
Middleware
→ early request-level gate

Authorization
→ operation/resource-level security
```

The latter must be enforced where the protected operation executes.

---

# 67. Production Review Checklist

Before shipping Middleware, verify:

### Scope

* [ ] Which requests match?
* [ ] Which requests must not match?
* [ ] Are public routes excluded?
* [ ] Are API exceptions explicit?
* [ ] Are webhook routes handled correctly?
* [ ] Are assets unaffected where appropriate?

### Correctness

* [ ] No redirect loops.
* [ ] No rewrite loops.
* [ ] All protected routes are covered.
* [ ] New route structures are covered.
* [ ] Policy ordering is explicit.

### Security

* [ ] Authentication is distinguished from authorization.
* [ ] Tenant identity is correct.
* [ ] Sensitive request data is not logged.
* [ ] Cache identity respects routing context.

### Performance

* [ ] Middleware is lightweight.
* [ ] Expensive database calls are avoided.
* [ ] Remote API dependencies are avoided where possible.
* [ ] Matcher scope is intentional.
* [ ] Latency is measured.

### Operations

* [ ] Decisions are observable.
* [ ] Redirect targets are observable.
* [ ] Rewrite targets are observable.
* [ ] Failure modes are understood.

---

# 68. Completion Criteria

You have completed Part 02 when you can independently explain:

### Matching

* [ ] What a Middleware matcher represents.
* [ ] Why matcher scope matters.
* [ ] Over-matching.
* [ ] Under-matching.
* [ ] Protected route coverage.
* [ ] Public route exclusions.

### Execution

* [ ] Continue.
* [ ] Redirect.
* [ ] Rewrite.
* [ ] Reject/block.
* [ ] Redirect lifecycle.
* [ ] Rewrite lifecycle.

### Architecture

* [ ] Request classification.
* [ ] Policy ordering.
* [ ] Middleware pipeline.
* [ ] Failure semantics.
* [ ] Fail-open vs fail-closed considerations.

### Security

* [ ] Matcher ≠ authorization.
* [ ] Authentication ≠ authorization.
* [ ] Webhook exceptions.
* [ ] Tenant isolation.

### Performance

* [ ] Per-request cost.
* [ ] Broad vs narrow matching.
* [ ] Database dependency risk.
* [ ] External service dependency risk.

### Integration

* [ ] Middleware + caching.
* [ ] Middleware + tenant routing.
* [ ] Middleware + locale routing.
* [ ] Middleware + Server Actions.
* [ ] Middleware + authorization.

---

# 69. Core Mental Model to Retain

The entire part reduces to:

```text
                 Incoming Request
                         │
                         ▼
                 ┌───────────────┐
                 │    Matcher    │
                 └───────┬───────┘
                         │
                ┌────────┴────────┐
                │                 │
             No Match           Match
                │                 │
                ▼                 ▼
             Continue         Middleware
                                  │
                                  ▼
                         Request-Level Policy
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
                 Continue      Redirect       Rewrite
                    │             │             │
                    ▼             ▼             ▼
              Application      New Request   Internal
                                               Route
```

And the most important distinction is:

```text
Matcher
→ "Does this policy apply?"

Middleware
→ "What should happen to this request?"

Authorization
→ "Is this identity allowed to perform this operation?"
```

Those three questions should never be collapsed into one abstraction.

---

# 70. Part Boundary

Part 02 establishes:

```text
Request Matching
+
Execution Model
+
Policy Scope
+
Request Classification
```

It intentionally does not yet go deeply into redirect and rewrite implementation patterns.

The sequence continues:

```text
Part 01
Middleware Mental Model
        ↓
Part 02
Request Matching & Execution Model
        ↓
Part 03
Redirects & Rewrites
        ↓
Part 04
Authentication-Aware Routing
        ↓
Part 05
Authorization Boundaries & Security
        ↓
Part 06
Multi-Tenant / Locale / Host-Based Routing
        ↓
Part 07
Rate Limiting & Request Policies
        ↓
Part 08
Middleware Performance & Runtime Constraints
        ↓
Part 09
Middleware + Caching + Rendering Integration
        ↓
Part 10
Production Middleware Architecture Capstone
```

**End of KPI 07 — Part 02.**
