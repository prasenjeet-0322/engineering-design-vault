# Level 08 — KPI 07 — Part 03: Redirects & Rewrites

## 1. Purpose

Redirects and rewrites are two of the most important request-routing transformations in Next.js.

They may look similar because both alter what happens after a request arrives.

They are fundamentally different.

The core distinction is:

```text
Redirect
→ changes where the client goes

Rewrite
→ changes what the server serves
```

A senior frontend engineer must understand the distinction at the level of:

* HTTP semantics
* browser behavior
* request lifecycle
* URL identity
* routing
* middleware
* caching
* SEO
* authentication
* localization
* multi-tenancy
* observability
* failure modes
* security

The goal is not to memorize configuration syntax.

The goal is to predict:

> **Given a request, what URL does the user see, what resource does the server execute, what request reaches the application, and what happens to cache and routing identity?**

---

# 2. The Fundamental Distinction

Consider:

```text
/user/profile
```

A redirect says:

```text
/user/profile
      ↓
302
      ↓
/account/profile
```

The browser receives a response telling it to request another URL.

The address bar changes:

```text
/account/profile
```

A rewrite says:

```text
/user/profile
      ↓
server internally resolves
      ↓
/account/profile
```

The browser continues to see:

```text
/user/profile
```

while the server executes the destination route.

Therefore:

```text
Redirect
= external navigation

Rewrite
= internal routing transformation
```

---

# 3. Request Flow Comparison

## Redirect

```text
Browser
   │
   │ GET /old-url
   ▼
Server
   │
   │ 3xx Location: /new-url
   ▼
Browser
   │
   │ GET /new-url
   ▼
Server
   │
   ▼
Response
```

There are two HTTP requests.

---

## Rewrite

```text
Browser
   │
   │ GET /public-url
   ▼
Server
   │
   │ internal route transformation
   ▼
Destination handler
   │
   ▼
Response
```

The browser does not make a second navigation request merely because of the rewrite.

This distinction has major consequences for:

* latency
* browser history
* URL visibility
* SEO
* cache keys
* analytics
* authentication
* debugging

---

# 4. Redirect Semantics

A redirect communicates:

> "The resource you requested should be reached through another URL."

Typical redirect statuses include:

```text
301
302
303
307
308
```

Their semantics differ.

A senior engineer must understand that:

```text
3xx
```

is not synonymous with:

```text
"send the user somewhere else"
```

The exact status influences:

* caching
* method preservation
* client behavior
* permanence
* browser behavior
* intermediary behavior

---

# 5. 301 vs 308

A useful conceptual distinction:

```text
301
→ permanent redirect

308
→ permanent redirect with method preservation
```

For ordinary page navigation:

```text
GET /old-page
```

both commonly result in navigation to the new location.

For mutation requests, however, method semantics matter.

For example:

```text
POST /old-endpoint
```

should not casually be transformed using a redirect whose behavior does not preserve the intended method semantics.

This is one reason modern applications should understand the distinction between:

```text
temporary vs permanent
```

and:

```text
method-preserving vs potentially transformed
```

rather than treating every redirect as equivalent.

---

# 6. 302 vs 307

Similarly:

```text
302
→ temporary redirect semantics

307
→ temporary redirect while preserving the HTTP method
```

Suppose:

```text
POST /checkout
```

redirects to:

```text
/checkout/confirm
```

The engineer must ask:

```text
Should the destination receive POST?
```

If yes, method-preserving semantics matter.

This is especially important for:

* form submissions
* Server Actions
* API endpoints
* payment flows
* webhook-like requests
* authentication callbacks

---

# 7. Why Redirect vs Rewrite Matters

Consider:

```text
/products/123
```

and:

```text
/catalog/products/123
```

If the old URL should permanently disappear:

```text
/products/123
      ↓
308
      ↓
/catalog/products/123
```

Use a redirect.

If:

```text
/products/123
```

is intentionally the public URL while the application internally maps it to:

```text
/catalog/products/123
```

use a rewrite.

The decision is based on **URL ownership**.

---

# 8. URL Ownership

Ask:

> Which URL should represent this resource to the user?

If the answer is:

```text
/catalog/products/123
```

then the old URL may need a redirect.

If the answer is:

```text
/products/123
```

while the implementation happens elsewhere:

```text
/internal/catalog/products/123
```

a rewrite may be appropriate.

This produces a useful rule:

```text
Public URL changes
→ redirect

Implementation mapping changes
→ rewrite
```

---

# 9. Redirects and Browser History

A redirect changes the browser's navigation target.

For example:

```text
/user
 ↓
/account
```

The browser ultimately displays:

```text
/account
```

This affects:

* bookmarks
* copied URLs
* browser history
* analytics
* canonical URL
* user expectations

A rewrite does not inherently change the visible URL.

Therefore:

```text
redirect
→ URL identity changes externally

rewrite
→ URL identity remains externally stable
```

---

# 10. Redirect Chains

Consider:

```text
/a
 ↓
/b
 ↓
/c
 ↓
/d
```

This is a redirect chain.

It causes:

```text
multiple requests
multiple routing decisions
additional latency
more failure points
more complicated debugging
```

Prefer:

```text
/a
 ↓
/d
```

when possible.

The target should generally be the final canonical destination.

---

# 11. Redirect Loops

A redirect loop occurs when routing rules produce a cycle.

Example:

```text
/a
 ↓
/b

/b
 ↓
/a
```

The request never reaches a stable destination.

Another example:

```text
HTTP
 ↓
HTTPS
 ↓
HTTP
```

or:

```text
tenant-a.example.com
 ↓
example.com/a
 ↓
tenant-a.example.com
```

Every routing architecture should have a termination invariant:

> **Every redirect chain must eventually reach a terminal response or a bounded failure.**

---

# 12. Rewrite Loops

Rewrites can also create routing cycles.

Conceptually:

```text
/public
   ↓
/internal
   ↓
/public
```

Depending on the framework and routing configuration, repeated transformations may produce:

* routing errors
* unexpected destination matching
* confusing middleware behavior
* repeated processing

Therefore rewrite rules should also be designed as an acyclic transformation graph.

---

# 13. Redirect Graph

Model redirects as a directed graph:

```text
Old URL
   │
   ▼
Canonical URL
   │
   ▼
Terminal Resource
```

A healthy graph looks like:

```text
A ──→ C
B ──→ C
D ──→ C
```

rather than:

```text
A ──→ B ──→ C
```

or:

```text
A ──→ B
↑     │
└─────┘
```

The first is unnecessarily long.

The second is a cycle.

---

# 14. Rewrite Graph

Similarly:

```text
Public Route
     ↓
Routing Transformation
     ↓
Internal Route
     ↓
Handler
```

The public route should have a deterministic internal destination.

Avoid rules whose destination depends on transformations that can send the request back into the same matching space.

---

# 15. Middleware Interaction

Middleware can execute before or around route resolution depending on the framework's routing lifecycle and configuration.

Conceptually:

```text
Request
  ↓
Middleware
  ↓
Redirect / Rewrite decision
  ↓
Routing
  ↓
Handler
  ↓
Rendering
```

This means middleware can be used for:

```text
authentication routing
locale routing
tenant routing
host routing
legacy URL handling
request normalization
```

But it also means middleware transformations can interact with:

```text
route matching
cache identity
rendering
observability
```

---

# 16. Redirect From Middleware

A middleware redirect conceptually does:

```text
Request
 ↓
Middleware
 ↓
Condition
 ↓
Redirect response
 ↓
Browser navigation
```

Example:

```text
Unauthenticated request
        ↓
/dashboard
        ↓
redirect
        ↓
/login
```

The browser sees:

```text
/login
```

This is appropriate when the user genuinely needs to navigate to another resource.

---

# 17. Rewrite From Middleware

A rewrite conceptually does:

```text
Request
 ↓
Middleware
 ↓
Rewrite
 ↓
Internal destination
 ↓
Handler
 ↓
Response
```

Example:

```text
tenant.example.com
        ↓
rewrite
        ↓
/tenants/acme
```

The browser still sees:

```text
tenant.example.com
```

while the application handles the request through the internal tenant route.

This is a common multi-tenant routing pattern.

---

# 18. Authentication Example

Consider:

```text
/dashboard
```

with an unauthenticated request.

A redirect is usually appropriate:

```text
/dashboard
      ↓
/login
```

because the user must navigate to a different resource.

After authentication:

```text
/login
   ↓
/dashboard
```

The URL changes because the navigation state changes.

---

# 19. Authentication Rewrite Misuse

Suppose middleware rewrites:

```text
/dashboard
```

to:

```text
/login
```

while leaving the browser URL as:

```text
/dashboard
```

Now the user may see a login page at:

```text
/dashboard
```

This can create confusing semantics.

The browser says:

```text
/dashboard
```

but the content is:

```text
/login
```

That may be appropriate in some specialized architectures, but it is usually not the intended authentication UX.

The key question is:

> **Is the user actually navigating to another resource, or are we only changing internal implementation routing?**

---

# 20. Authorization vs Routing

Redirects and rewrites do not replace authorization.

A rewrite such as:

```text
/user-content
   ↓
/internal/content
```

does not mean:

```text
authorization succeeded
```

Likewise:

```text
redirect to /login
```

does not itself establish authorization.

The security pipeline remains:

```text
Authenticate
    ↓
Authorize
    ↓
Route
    ↓
Render
```

or the framework-specific equivalent.

Do not use routing transformations as the security boundary.

---

# 21. Multi-Tenant Host Routing

Suppose:

```text
acme.example.com
globex.example.com
```

map to:

```text
/tenant/acme
/tenant/globex
```

A rewrite can preserve the tenant's public hostname:

```text
acme.example.com
        ↓
rewrite
        ↓
/tenant/acme
```

This is useful because:

```text
public identity
=
tenant hostname
```

while:

```text
internal routing identity
=
tenant route
```

---

# 22. Tenant Redirect

A redirect would instead expose the destination:

```text
acme.example.com
      ↓
example.com/tenant/acme
```

Now the public URL has changed.

That may be correct if the desired canonical URL is:

```text
example.com/tenant/acme
```

but incorrect if tenant-specific hostnames are part of the product's public URL architecture.

Therefore:

```text
host-based public identity
→ usually rewrite internally

canonical URL migration
→ usually redirect
```

---

# 23. Locale Routing

Suppose:

```text
/en/products
/fr/products
/de/products
```

represent localized routes.

You might receive:

```text
/products
```

and determine:

```text
Accept-Language
→ fr
```

A redirect could produce:

```text
/products
   ↓
/fr/products
```

The locale becomes visible.

A rewrite could internally serve:

```text
/fr/products
```

while the browser remains at:

```text
/products
```

The correct choice depends on whether locale is intended to be part of the public URL identity.

---

# 24. URL Normalization

Applications frequently normalize URLs:

```text
/trailing-slash/
/trailing-slash
```

or:

```text
/Products
/products
```

If one form is canonical, redirecting to it establishes a stable public identity.

For example:

```text
/Products
   ↓
/products
```

This is preferable to allowing multiple public URLs to represent the same resource without a clear reason.

---

# 25. SEO Implications

Redirects and rewrites communicate different information.

A redirect tells clients and crawlers:

```text
"This resource is reached elsewhere."
```

A rewrite preserves the requested URL while changing the server-side resolution.

Therefore migrations typically rely on redirects when:

```text
old URL
```

should be replaced by:

```text
canonical URL
```

A rewrite is more appropriate when:

```text
public URL remains canonical
```

but internal implementation differs.

The important principle:

> **Canonical public identity should be explicit and stable.**

---

# 26. Cache Identity Implications

Redirects and rewrites interact differently with caching.

Consider:

```text
/requested-url
```

A redirect causes another request:

```text
/requested-url
      ↓
/destination-url
```

Therefore there are potentially separate caching behaviors for:

```text
redirect response
destination response
```

A rewrite keeps the externally requested URL stable while the server resolves a different internal destination.

Therefore cache analysis must ask:

```text
What is the external URL?
What is the internal destination?
Which representation is cached?
What constitutes the cache key?
```

---

# 27. Rewrite and Cache Safety

Consider:

```text
/profile
```

rewritten internally according to:

```text
Cookie: user=A
```

to:

```text
/internal/profile/A
```

If an upstream cache does not understand that the response varies by user, there is a potential privacy problem.

Therefore:

```text
request-dependent rewrite
+
shared cache
```

requires careful cache-key and cacheability analysis.

Never assume:

```text
rewrite = private
```

or:

```text
rewrite = safe
```

---

# 28. Query Parameters

Suppose:

```text
/search?q=react
```

is rewritten to:

```text
/internal/search/react
```

You must understand:

```text
which query parameters are preserved
which are transformed
which affect the destination
which affect caching
```

A routing transformation that accidentally drops an important parameter can produce subtle production bugs.

---

# 29. Redirect Query Preservation

Suppose:

```text
/login?returnTo=/dashboard
```

redirects elsewhere.

The application must intentionally decide whether:

```text
returnTo
```

is preserved.

It should not blindly forward arbitrary values.

This is particularly important for:

```text
redirect targets
return URLs
callback URLs
```

because improperly validated redirect destinations can create security vulnerabilities.

---

# 30. Open Redirect Risk

An application may receive:

```text
?returnTo=https://attacker.example
```

and redirect users there after login.

That creates an open redirect vulnerability if arbitrary destinations are accepted.

A safer policy is to validate redirect destinations against an explicit allowlist or constrain them to trusted internal paths.

Conceptually:

```text
User-provided redirect target
        ↓
Validate
        ↓
Trusted?
   ├── yes → redirect
   └── no  → safe default
```

Never treat redirect destinations as harmless strings.

---

# 31. Rewrite Security

Rewrites can also create security problems.

Suppose an application allows:

```text
/path?target=/internal/admin
```

to control internal routing.

If authorization is evaluated against the public path rather than the actual resource being served, the system can accidentally create a privilege boundary mismatch.

Therefore:

> **Authorization must apply to the resource ultimately being accessed, not merely the original URL string.**

---

# 32. Internal Route Exposure

A rewrite can hide implementation routes from the public URL.

For example:

```text
/public-dashboard
      ↓
/_internal/dashboard
```

But "hidden URL" does not mean "protected resource."

If:

```text
/_internal/dashboard
```

is directly reachable, security must still be enforced.

A rewrite is a routing mechanism, not an access-control mechanism.

---

# 33. Redirect vs Rewrite Decision Matrix

| Requirement                     |    Redirect |     Rewrite |
| ------------------------------- | ----------: | ----------: |
| Change visible URL              |         Yes |          No |
| Browser makes new request       |         Yes |          No |
| Preserve public URL             |          No |         Yes |
| Canonical URL migration         |     Usually | Usually not |
| Internal implementation mapping | Usually not |         Yes |
| Host-based tenant routing       |   Sometimes |       Often |
| Locale internal mapping         |   Sometimes |       Often |
| Legacy URL migration            |         Yes |   Sometimes |
| Authentication navigation       |       Often | Usually not |
| Hide internal route structure   |          No |         Yes |
| Requires cache analysis         |         Yes |         Yes |
| Can replace authorization       |          No |          No |

The table is a starting point, not a substitute for analyzing the actual request lifecycle.

---

# 34. Decision Algorithm

When deciding between redirect and rewrite, ask:

### Question 1

```text
Should the browser URL change?
```

If yes:

```text
redirect
```

### Question 2

```text
Should the public URL remain stable?
```

If yes:

```text
rewrite
```

### Question 3

```text
Is this a URL migration?
```

Usually:

```text
redirect
```

### Question 4

```text
Is this an internal routing mapping?
```

Usually:

```text
rewrite
```

### Question 5

```text
Is the transformation request-dependent?
```

Then inspect:

```text
cache identity
security
observability
```

### Question 6

```text
Does the request carry a mutation method?
```

Then explicitly analyze:

```text
GET
POST
PUT
PATCH
DELETE
```

and redirect method semantics.

---

# 35. Production Example — Legacy Migration

Old architecture:

```text
/blog/:slug
```

New architecture:

```text
/articles/:slug
```

Requirement:

```text
old public URL should permanently become new public URL
```

Architecture:

```text
/blog/react
      ↓
permanent redirect
      ↓
/articles/react
```

Benefits:

* old bookmarks transition
* canonical URL becomes explicit
* browser address bar updates
* clients learn the new location
* the migration is externally visible

---

# 36. Production Example — Internal Architecture Change

Public URL:

```text
/products/123
```

Internal architecture changes from:

```text
/products/[id]
```

to:

```text
/catalog/[id]
```

But the product team wants the public URL unchanged.

Architecture:

```text
/products/123
      ↓
rewrite
      ↓
/catalog/123
```

The external contract remains:

```text
/products/123
```

while the implementation can evolve.

This is one of the strongest use cases for rewrites.

---

# 37. Production Example — Tenant Routing

Public request:

```text
acme.example.com/projects
```

Internal destination:

```text
/tenants/acme/projects
```

Architecture:

```text
acme.example.com/projects
          ↓
      rewrite
          ↓
/tenants/acme/projects
```

The browser remains at:

```text
acme.example.com/projects
```

The server gets a tenant-aware route.

Critical invariant:

```text
hostname → tenant identity
```

must be deterministic and security-validated.

---

# 38. Production Example — Authentication

Request:

```text
/dashboard
```

No authenticated session.

Architecture:

```text
/dashboard
     ↓
authentication check
     ↓
redirect
     ↓
/login?returnTo=/dashboard
```

After authentication:

```text
/login
     ↓
validated return destination
     ↓
/dashboard
```

This is a navigation change, so redirect semantics fit the user-facing behavior.

---

# 39. Production Example — Feature Flag

Suppose:

```text
/checkout
```

can internally execute one of:

```text
/checkout-v1
/checkout-v2
```

The public URL should remain:

```text
/checkout
```

A rewrite can provide:

```text
/checkout
    ↓
feature flag
    ↓
/checkout-v2
```

The user still sees:

```text
/checkout
```

This can support controlled rollout without changing the external URL contract.

However, cache and experimentation dimensions must be analyzed.

---

# 40. Feature Flag Cache Problem

Suppose:

```text
10% users → v2
90% users → v1
```

and the rewrite depends on:

```text
experiment assignment
```

Then caching must understand that assignment.

Otherwise:

```text
user A → v2
```

could accidentally produce a cached representation reused by:

```text
user B → v1
```

Therefore:

```text
rewrite condition
+
shared cache
```

requires cache-identity analysis.

---

# 41. Redirect and Rewrite Observability

For every transformation, production telemetry should help answer:

```text
original URL
destination
transformation type
reason
status code
request ID
tenant
user/session scope where appropriate
```

For example:

```text
requestId=abc
source=/dashboard
action=redirect
destination=/login
reason=unauthenticated
```

or:

```text
requestId=xyz
source=/products/123
action=rewrite
destination=/catalog/123
reason=route-migration
```

This makes routing behavior observable.

---

# 42. Debugging Redirect Problems

If users report:

> "The site keeps redirecting me."

Check:

```text
1. Source URL
2. Redirect status
3. Location header
4. Middleware condition
5. Destination
6. Next redirect rule
7. Authentication state
8. Protocol/host normalization
9. Locale logic
10. Tenant logic
```

Build the actual chain:

```text
A
 ↓
B
 ↓
C
 ↓
A
```

If the graph contains a cycle, you found the fundamental problem.

---

# 43. Debugging Rewrite Problems

If users report:

> "The URL looks correct but the wrong page is displayed."

Investigate:

```text
1. Original request URL
2. Matching middleware
3. Rewrite destination
4. Route matcher
5. Query parameters
6. Hostname
7. Cookies/headers
8. Cache identity
9. Authorization scope
10. Destination handler
```

A rewrite bug often appears to be a rendering bug because the browser URL remains unchanged.

---

# 44. Routing Transformation Invariants

A production routing architecture should define invariants.

### Invariant 1 — Termination

```text
Every transformation eventually terminates.
```

### Invariant 2 — Determinism

```text
Same routing inputs
→ predictable destination
```

### Invariant 3 — Authorization

```text
Routing cannot bypass authorization.
```

### Invariant 4 — Isolation

```text
Tenant/user context cannot cross cache boundaries.
```

### Invariant 5 — Canonicality

```text
A resource has a deliberate public URL identity.
```

### Invariant 6 — Method Safety

```text
Mutation requests preserve intended semantics.
```

### Invariant 7 — Observability

```text
Routing decisions can be diagnosed in production.
```

---

# 45. Testing Strategy

Do not test redirects only by asserting:

```text
status === 302
```

Test the complete contract.

### Redirect tests

Verify:

```text
source URL
status code
Location
method behavior
query parameters
canonical destination
loop prevention
```

### Rewrite tests

Verify:

```text
visible URL
destination behavior
query parameters
headers/cookies
tenant isolation
authorization
cache behavior
```

---

# 46. Property-Based Routing Tests

For large routing systems, define properties such as:

```text
Any legacy URL
→ eventually reaches canonical URL.
```

```text
Any tenant hostname
→ resolves only to that tenant.
```

```text
Any unauthenticated protected request
→ cannot reach protected content.
```

```text
Any rewrite chain
→ terminates.
```

```text
Any canonical URL
→ does not redirect back into a legacy URL.
```

These properties are more valuable than testing only a handful of examples.

---

# 47. Architecture Exercise

Design routing for:

```text
app.example.com
acme.example.com
globex.example.com
```

Requirements:

1. `acme.example.com/dashboard` serves Acme's dashboard.
2. `globex.example.com/dashboard` serves Globex's dashboard.
3. Users should remain on their tenant hostname.
4. Unauthenticated users should go to `/login`.
5. `/old-dashboard` should permanently migrate to `/dashboard`.
6. Internal implementation uses `/tenants/[tenant]/dashboard`.

Expected conceptual architecture:

```text
acme.example.com/dashboard
        ↓
tenant resolution
        ↓
rewrite
        ↓
/tenants/acme/dashboard
```

while:

```text
unauthenticated
        ↓
redirect
        ↓
/login
```

and:

```text
/old-dashboard
        ↓
permanent redirect
        ↓
/dashboard
```

The three transformations serve different purposes.

---

# 48. Prediction Challenge

Given:

```text
/old
  ↓
/new
  ↓
/final
```

and the requirement:

> Users should see `/final` in the browser.

A rewrite alone does not satisfy the public URL requirement.

Why?

Because the rewrite preserves the externally requested URL.

The architecture requires an external navigation change.

---

# 49. Prediction Challenge 2

Given:

```text
/products/123
```

the requirement is:

> Internally execute `/catalog/123`, but keep `/products/123` visible.

Use:

```text
rewrite
```

because the public URL is still the canonical external identity.

---

# 50. Prediction Challenge 3

Given:

```text
POST /submit
```

and:

```text
temporary redirect
```

ask:

```text
Should POST semantics be preserved?
```

If yes, the redirect status must support the intended method-preserving behavior.

This is why HTTP semantics matter even when working primarily as a frontend engineer.

---

# 51. SDE-2 Interview Gotchas

### Gotcha 1

> "Redirect and rewrite are basically the same."

Incorrect.

The browser-visible URL and request flow differ.

---

### Gotcha 2

> "A rewrite protects the internal route."

Incorrect.

A rewrite is not authorization.

---

### Gotcha 3

> "Every redirect should be 301."

Incorrect.

Temporary vs permanent behavior matters.

Method semantics also matter.

---

### Gotcha 4

> "If the URL looks right, the request is hitting that route."

Not necessarily.

A rewrite may cause a different internal destination to execute.

---

### Gotcha 5

> "Caching doesn't matter for rewrites."

Incorrect.

Request-dependent rewrites can fundamentally change cache correctness.

---

### Gotcha 6

> "Middleware redirect fixes authentication."

It can implement navigation behavior, but authentication and authorization remain security concerns that must be independently enforced.

---

### Gotcha 7

> "Hidden internal routes are private."

Incorrect.

Anything exposed through the application boundary must be protected appropriately.

---

# 52. Senior-Level Mental Model

Think of a request as:

```text
External Identity
       ↓
Request Classification
       ↓
Routing Transformation
       ↓
Internal Identity
       ↓
Authorization
       ↓
Cache / Rendering
       ↓
Response
```

A redirect changes:

```text
External Identity
```

A rewrite changes:

```text
Internal Identity
```

That distinction is the foundation of the entire topic.

---

# 53. Compact Decision Table

```text
Need browser URL to change?
        │
      YES
        ↓
    REDIRECT

Need browser URL to remain?
        │
      YES
        ↓
     REWRITE
```

Then add:

```text
Mutation request?
→ inspect method semantics

Request-dependent?
→ inspect cache identity

Security-sensitive?
→ inspect authorization boundary

Permanent migration?
→ inspect canonical URL

Multi-tenant?
→ inspect tenant isolation

Locale-dependent?
→ inspect URL identity and cache scope
```

---

# 54. Completion Checklist

You should now be able to:

* Explain redirects vs rewrites precisely.
* Explain the browser-visible URL difference.
* Explain the request-count difference.
* Understand common 3xx semantics.
* Distinguish temporary and permanent redirects.
* Understand method-preserving redirects.
* Design canonical URL migrations.
* Design internal route mappings.
* Detect redirect chains.
* Detect redirect loops.
* Detect rewrite cycles.
* Use middleware transformations appropriately.
* Understand authentication redirect patterns.
* Separate routing from authorization.
* Design host-based tenant routing.
* Design locale routing.
* Analyze query parameter behavior.
* Recognize open redirect risks.
* Recognize rewrite security boundaries.
* Analyze cache implications.
* Analyze feature-flag rewrite behavior.
* Design routing observability.
* Debug redirect chains.
* Debug rewrite destination problems.
* Define routing invariants.
* Test routing behavior systematically.
* Defend redirect/rewrite choices in an SDE-2 interview.

---

# 55. Part Boundary

This part establishes the complete mental model for:

```text
Redirects
+
Rewrites
+
HTTP semantics
+
URL identity
+
Internal routing identity
+
Security interaction
+
Cache interaction
```

It does **not** yet fully cover:

```text
authentication architecture
authorization architecture
multi-tenant security boundaries
```

Those are the subjects of the subsequent KPI 07 parts.

---

# 56. Final Principle

Remember the simplest possible rule:

```text
REDIRECT

"I want the client to go somewhere else."

REWRITE

"I want the server to serve something else
without changing the client's URL."
```

Then apply the senior-level questions:

```text
What is the canonical URL?
What resource is actually being served?
Who is authorized to access it?
What request context determines the route?
What happens to cache identity?
Can the transformation loop?
Does HTTP method semantics matter?
Can I observe and debug the decision?
```

If you can answer those questions, redirects and rewrites become an architectural tool rather than a routing trick.
