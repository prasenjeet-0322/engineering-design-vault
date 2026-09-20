# Level 08 — KPI 07 — Part 06

# Multi-Tenant, Locale & Host-Based Routing

## 1. Purpose

Modern applications frequently use the incoming request itself to determine application context.

That context may come from:

* hostname,
* subdomain,
* custom domain,
* pathname,
* locale,
* region,
* deployment environment,
* tenant,
* request headers.

Examples:

```text
acme.example.com
globex.example.com
example.com/en/dashboard
example.com/fr/dashboard
customer-domain.com/dashboard
```

The routing problem is no longer simply:

```text
URL → Page
```

It becomes:

```text
Request
   ↓
Context Resolution
   ↓
Tenant / Locale / Host
   ↓
Route Mapping
   ↓
Authorization
   ↓
Rendering
```

The core objective of this part is to understand how routing context is resolved, transformed, and propagated without violating security, caching, or rendering boundaries.

---

# 2. The Fundamental Routing Model

A request can be modeled as:

```text
Request
├── protocol
├── hostname
├── port
├── pathname
├── query
├── headers
├── cookies
└── method
```

Routing derives application context from these dimensions.

For example:

```text
https://acme.example.com/fr/dashboard
```

could produce:

```text
host   = acme.example.com
tenant = acme
locale = fr
route  = /dashboard
```

The application then operates on:

```text
tenant + locale + route
```

rather than treating the raw URL as the complete routing model.

---

# 3. Why This Is Architecturally Difficult

Multi-dimensional routing introduces multiple identities.

A request may have:

```text
User Identity
Tenant Identity
Host Identity
Locale Identity
Route Identity
Region Identity
```

These identities interact.

For example:

```text
acme.example.com/fr/projects
```

could mean:

```text
tenant = acme
locale = fr
resource = projects
```

But:

```text
other.example.com/fr/projects
```

must not resolve to:

```text
tenant = acme
```

The routing system must preserve these invariants.

---

# 4. Host-Based Routing

Host-based routing derives application context from the hostname.

Examples:

```text
acme.example.com
globex.example.com
admin.example.com
```

Conceptually:

```text
Hostname
   ↓
Host Resolver
   ↓
Routing Context
```

Example:

```text
acme.example.com
        ↓
tenant = acme
```

This allows the public URL to represent tenant identity without exposing it as a pathname segment.

---

# 5. Subdomain Routing

A common SaaS architecture is:

```text
tenant.example.com
```

where:

```text
tenant = subdomain
```

Conceptually:

```text
Request
   ↓
Host
   ↓
Extract subdomain
   ↓
Resolve tenant
```

But do not assume:

```text
subdomain === tenant ID
```

A production system may have:

```text
subdomain
   ↓
tenant alias
   ↓
tenant database record
```

For example:

```text
acme
  ↓
tenant_483
```

This allows tenant identifiers to change independently from their public hostname.

---

# 6. Custom Domains

Enterprise customers may use:

```text
app.customer.com
```

instead of:

```text
customer.example.com
```

Now tenant resolution becomes:

```text
Host
   ↓
Domain Mapping
   ↓
Tenant
```

Example:

```text
portal.customer.com
        ↓
domain mapping
        ↓
tenant = 483
```

This is more flexible than deriving tenant identity directly from the hostname.

---

# 7. Hostname Must Be Normalized

Host comparison should be treated carefully.

Conceptually:

```text
Raw Host
   ↓
Normalize
   ↓
Canonical Host
   ↓
Resolve Mapping
```

Potential dimensions include:

```text
case
port
trailing formatting
internationalized domains
proxy behavior
forwarded host information
```

The application must know which host value is authoritative in its deployment environment.

---

# 8. Trusted Proxy Context

In some deployments, the application does not directly receive the original public connection.

The request may pass through:

```text
Browser
   ↓
CDN
   ↓
Reverse Proxy
   ↓
Load Balancer
   ↓
Application
```

The application may receive forwarded metadata.

Therefore:

```text
"host information"
```

is partly a deployment trust question.

The architecture must define:

```text
Which proxy is trusted?
Which headers are trusted?
Who is allowed to set them?
How are they normalized?
```

Do not blindly trust arbitrary client-provided forwarding headers.

---

# 9. Tenant Resolution

Tenant resolution should be explicit.

Conceptually:

```text
resolveTenant(request)
```

produces:

```text
TenantContext
```

For example:

```ts
type TenantContext = {
  id: string;
  slug: string;
  domain: string;
};
```

The rest of the request pipeline consumes this context.

```text
Request
   ↓
Tenant Resolver
   ↓
TenantContext
   ↓
Authorization
   ↓
Business Logic
```

---

# 10. Tenant Resolution Is Not Tenant Authorization

This distinction from Part 05 remains critical.

Suppose:

```text
Host = acme.example.com
```

The routing system resolves:

```text
tenant = acme
```

But that does not establish:

```text
currentUser ∈ acme
```

Therefore:

```text
Host
 ↓
Tenant Resolution
 ↓
User Authentication
 ↓
Membership Authorization
```

must remain separate concepts.

---

# 11. Tenant Context as a Security Boundary

Once tenant context is resolved, every protected operation should consistently use it.

Conceptually:

```text
TenantContext
     │
     ├── database queries
     ├── authorization
     ├── cache keys
     ├── rendering
     └── observability
```

This avoids repeatedly deriving tenant identity through different mechanisms.

---

# 12. Tenant Isolation Invariant

A core invariant is:

> A request resolved to tenant A must not accidentally access tenant B's protected resources.

This applies to:

```text
database
cache
authorization
rendering
background operations
logs
analytics
```

A routing bug can therefore become a security bug.

---

# 13. Path-Based Tenant Routing

Another architecture is:

```text
example.com/t/acme/dashboard
```

where:

```text
/t/acme
```

identifies the tenant.

Conceptually:

```text
pathname
   ↓
tenant segment
   ↓
tenant resolution
```

This is simpler in some environments because tenant identity is explicit in the pathname.

But it also makes tenant identifiers part of the public URL.

---

# 14. Host vs Path Tenant Routing

### Host-based

```text
acme.example.com/dashboard
```

### Path-based

```text
example.com/acme/dashboard
```

Neither is universally superior.

The decision depends on:

```text
branding
SEO
custom domains
routing complexity
cookie scope
DNS management
tenant discovery
operational constraints
```

The engineering decision should be driven by product and infrastructure requirements.

---

# 15. Locale Routing

Locale routing introduces another routing dimension.

Examples:

```text
/en/dashboard
/fr/dashboard
/de/dashboard
```

The locale can be derived from:

```text
pathname
cookie
Accept-Language
user profile
domain
```

The application should establish an explicit precedence policy.

---

# 16. Locale Precedence

Suppose the request contains:

```text
URL locale = fr
Cookie locale = en
Accept-Language = de
User preference = es
```

Which wins?

There must be a deterministic rule.

For example:

```text
Explicit URL
   ↓
User preference
   ↓
Cookie
   ↓
Accept-Language
   ↓
Default locale
```

The exact ordering is application-specific.

The important principle is:

> Locale resolution must be deterministic and documented.

---

# 17. Locale Is Routing Context

Once resolved:

```text
locale = fr
```

it can influence:

```text
routing
translation
formatting
currency presentation
dates
metadata
content
cache identity
```

Therefore locale is not merely a UI concern.

It can become part of the representation identity.

---

# 18. Locale and Caching

Consider:

```text
/dashboard
```

rendered in:

```text
en
```

and:

```text
fr
```

If the output differs, then:

```text
locale
```

is part of the cache identity.

Conceptually:

```text
dashboard:tenant123:en
dashboard:tenant123:fr
```

A shared cache that ignores locale can return the wrong language.

This is the same cache identity principle established in KPI 06.

---

# 19. Host + Locale

A multi-tenant internationalized application may have:

```text
acme.example.com/en/dashboard
acme.example.com/fr/dashboard
```

Now the routing identity is:

```text
tenant + locale + route
```

Conceptually:

```text
Host
 ↓
Tenant

Path
 ↓
Locale + Route
```

The final context becomes:

```text
TenantContext
LocaleContext
RouteContext
```

---

# 20. Domain-Based Locale Routing

Some applications use domains:

```text
example.com
example.fr
example.de
```

Now:

```text
hostname
```

may encode locale rather than tenant.

For example:

```text
example.fr
    ↓
locale = fr
```

This creates another mapping layer:

```text
host
 ↓
domain configuration
 ↓
locale
```

The routing system should not hard-code assumptions if domains are configurable.

---

# 21. Combining Tenant and Locale

A complex system might use:

```text
acme.example.com/fr/dashboard
```

The routing pipeline becomes:

```text
Request
   ↓
Host Resolution
   ↓
Tenant Resolution
   ↓
Path Resolution
   ↓
Locale Resolution
   ↓
Route Resolution
```

Result:

```text
{
  tenant: "acme",
  locale: "fr",
  route: "/dashboard"
}
```

This context can then be consumed by authorization and rendering.

---

# 22. Canonical URLs

Multiple URLs may represent the same logical resource.

For example:

```text
acme.example.com/dashboard
example.com/acme/dashboard
```

If both represent the same resource, the system needs a canonicalization strategy.

Possible mechanisms include:

```text
redirect
rewrite
canonical metadata
domain normalization
```

The important objective is to avoid ambiguous external identity.

---

# 23. Redirecting to Canonical Tenant URLs

Suppose a tenant has:

```text
acme.example.com
```

but the user accesses:

```text
example.com/acme
```

The system may choose:

```text
redirect
```

rather than silently maintaining two public URL forms.

This improves:

```text
URL consistency
SEO
bookmark stability
analytics
cache behavior
```

But canonicalization should be deliberately designed.

---

# 24. Rewrite-Based Tenant Routing

Another architecture is to preserve the public URL while internally mapping it.

For example:

```text
Public:

acme.example.com/dashboard

Internal:

/_tenants/acme/dashboard
```

Conceptually:

```text
Public Request
      ↓
Tenant Resolution
      ↓
Internal Rewrite
      ↓
Tenant Route
```

The browser continues to display:

```text
acme.example.com/dashboard
```

while the application resolves:

```text
/_tenants/acme/dashboard
```

---

# 25. Why Rewrites Are Useful Here

Rewrites can separate:

```text
public URL design
```

from:

```text
internal route organization
```

This is particularly useful when a routing architecture needs internal tenant segmentation without exposing implementation details.

But rewrite design must account for:

```text
authorization
cache identity
route matching
observability
loop prevention
```

---

# 26. Middleware Routing Pipeline

A robust middleware model can be:

```text
Request
   ↓
Normalize request
   ↓
Resolve host
   ↓
Resolve tenant
   ↓
Resolve locale
   ↓
Classify route
   ↓
Authenticate
   ↓
Authorize
   ↓
Redirect / Rewrite / Continue
```

Not every application needs every stage.

The important part is explicit ordering.

---

# 27. Ordering Matters

Consider:

```text
rewrite
   ↓
authorization
```

versus:

```text
authorization
   ↓
rewrite
```

The correct order depends on what the authorization policy considers authoritative.

If tenant identity is derived from the original host, authorization may need tenant context before the internal rewrite.

A strong design defines:

```text
which identity is resolved from which representation
```

before applying security policy.

---

# 28. Tenant-Aware Authorization

The authorization model becomes:

```text
Principal
+
Tenant
+
Resource
+
Action
```

Example:

```text
User 123
Tenant 456
update
Project 789
```

Policy:

```text
Is User 123 a member of Tenant 456?
Does Project 789 belong to Tenant 456?
Can User 123 update Project 789?
```

This connects Part 06 directly to Part 05.

---

# 29. Tenant-Aware Cache Identity

The cache identity should generally include tenant context when the representation differs by tenant.

For example:

```text
dashboard:tenant-123
dashboard:tenant-456
```

If locale also changes the output:

```text
dashboard:tenant-123:en
dashboard:tenant-123:fr
```

If user identity changes it:

```text
dashboard:tenant-123:user-789:en
```

However, do not add dimensions blindly.

Every added dimension increases:

```text
cache cardinality
memory consumption
fragmentation
```

The correct identity is the minimum complete identity.

---

# 30. The Minimum Complete Identity

This is an important senior-level concept.

Suppose output depends on:

```text
tenant
locale
```

but not:

```text
user
```

Then:

```text
tenant + locale
```

is sufficient.

Adding:

```text
user
```

creates unnecessary fragmentation.

Therefore:

> A cache key should contain every necessary identity dimension, but no unnecessary dimensions.

---

# 31. Tenant Routing and Cookies

Cookie scope can become important.

Suppose tenants use:

```text
acme.example.com
globex.example.com
```

Cookie behavior may differ depending on whether cookies are scoped to:

```text
host
subdomain
parent domain
```

A broadly scoped cookie can create cross-tenant concerns.

The security architecture must deliberately define:

```text
Which hosts receive authentication cookies?
Can one tenant subdomain influence another?
What happens with custom domains?
```

---

# 32. Authentication Cookies and Custom Domains

Custom domains introduce another challenge.

Consider:

```text
acme.customer.com
```

The application may still need to identify:

```text
tenant = acme
```

while authentication is managed by a central identity system.

The architecture must distinguish:

```text
identity domain
tenant domain
application domain
```

rather than assuming all authentication state naturally belongs to the tenant's public domain.

---

# 33. Tenant Discovery vs Tenant Access

There is a subtle distinction between:

```text
discovering a tenant
```

and:

```text
being authorized to enter the tenant
```

Example:

```text
Host: acme.example.com
```

may allow the system to know:

```text
tenant = acme
```

without allowing:

```text
current user → acme
```

The two stages remain:

```text
Tenant Discovery
       ↓
Tenant Authorization
```

---

# 34. Unknown Tenant

What happens when:

```text
unknown.example.com
```

arrives?

Possible outcomes:

```text
404
redirect
tenant provisioning flow
generic error
```

The choice depends on product requirements.

But the system must not silently map:

```text
unknown tenant
```

to:

```text
default tenant
```

That can create severe isolation failures.

---

# 35. Missing Locale

Similarly:

```text
/fr/dashboard
```

may be valid.

But:

```text
/xx/dashboard
```

may not map to a supported locale.

The routing layer needs deterministic behavior:

```text
unsupported locale
   ↓
redirect
or
404
or
fallback
```

The decision should be explicit.

---

# 36. Locale Redirect Loops

Poor locale logic can produce:

```text
/en
 ↓
/fr
 ↓
/en
 ↓
/fr
```

Potential causes include:

```text
conflicting cookie
Accept-Language interpretation
incorrect canonicalization
middleware rewrite interaction
```

A routing system should have explicit invariants preventing redirect loops.

---

# 37. Host Redirect Loops

Likewise:

```text
http → https
www → non-www
non-canonical host → canonical host
```

can interact with tenant routing.

For example:

```text
foo.example.com
   ↓
www.example.com
   ↓
foo.example.com
```

Canonicalization rules must have a clear final state.

---

# 38. Host Header Security

Host-derived routing deserves special scrutiny.

If the application uses host information to determine:

```text
tenant
redirect destination
absolute URLs
password reset links
```

then an attacker-controlled or improperly trusted host value can influence security-sensitive behavior.

Therefore:

```text
incoming host
   ↓
validate against trusted domain configuration
   ↓
resolve tenant
```

rather than blindly treating arbitrary host values as trusted tenant identifiers.

---

# 39. Open Redirect Interaction

Suppose routing constructs:

```text
https://{host}/login
```

from request-controlled host information.

If host validation is weak, the application can generate unintended redirect destinations.

This connects host-based routing to the open-redirect concerns from Part 04.

Canonical host configuration should be explicit.

---

# 40. Middleware Matchers

Multi-dimensional routing can create broad middleware matchers.

For example:

```text
all application requests
```

might accidentally include:

```text
static assets
images
framework internals
favicon
robots
sitemap
API routes
```

The middleware matcher should reflect actual routing responsibilities.

Broad matching increases:

```text
execution cost
complexity
unexpected behavior
```

---

# 41. Static Assets and Tenant Routing

Consider:

```text
acme.example.com/logo.svg
```

Does the logo depend on tenant?

If yes:

```text
tenant context
```

may be necessary.

But if:

```text
/_next/static/...
```

is shared infrastructure content, tenant resolution may be unnecessary.

This illustrates a key design principle:

> Routing context should be resolved only where the representation actually depends on it.

---

# 42. Tenant-Aware Assets

Suppose each tenant has a custom logo:

```text
acme → logo-A.svg
globex → logo-B.svg
```

Then:

```text
host
 ↓
tenant
 ↓
asset representation
```

may need tenant-aware caching.

A shared cache key:

```text
logo.svg
```

would be unsafe if the underlying representation differs by tenant.

---

# 43. Tenant + Locale + Theme

A highly customized SaaS application might vary by:

```text
tenant
locale
theme
```

The representation identity becomes:

```text
tenant + locale + theme
```

But before creating such a high-cardinality cache, ask:

```text
Can some dimensions be handled at rendering time?
Can static assets be independently cached?
Can tenant configuration be separated from shared UI?
```

This is the same decomposition principle used in KPI 06.

---

# 44. Routing Context Propagation

Once context is resolved:

```text
TenantContext
LocaleContext
```

it should flow consistently through the application.

Conceptually:

```text
Request
   ↓
Routing Context
   ↓
Server Components
   ↓
Data Access
   ↓
Authorization
   ↓
Cache Identity
```

Avoid independently recomputing tenant or locale in each layer.

Repeated resolution creates opportunities for disagreement.

---

# 45. Context Consistency

A dangerous architecture is:

```text
Middleware says:
tenant = A

Database layer says:
tenant = B

Cache layer says:
tenant = A
```

The system now has contradictory context.

A better model is:

```text
Request
   ↓
Canonical Context
   ↓
all downstream systems
```

This is a form of context propagation.

---

# 46. Tenant Context in Database Access

A useful conceptual interface is:

```ts
getProjects({
  tenantId,
});
```

rather than:

```ts
getProjects();
```

where the function secretly discovers tenant context from unrelated global state.

Explicit dependencies make security review easier.

---

# 47. Tenant Context in Cache Access

Likewise:

```ts
getCachedProjects({
  tenantId,
});
```

makes identity visible.

Conceptually:

```text
tenantId
   ↓
cache key
   ↓
tenant-scoped representation
```

This reduces accidental cross-tenant reuse.

---

# 48. Tenant Context in Observability

Logs should make tenant context observable where appropriate.

For example:

```text
requestId=abc
tenantId=123
route=/dashboard
locale=en
```

This helps diagnose:

```text
wrong tenant
wrong locale
unexpected rewrite
cache leakage
authorization failure
```

Sensitive identifiers should be handled according to logging policy.

---

# 49. Routing and SEO

Public-facing multi-tenant applications may care about:

```text
canonical URL
sitemaps
robots
metadata
locale alternates
domain authority
```

Host-based routing can affect how search engines perceive content identity.

This is primarily a product/SEO architecture concern, but it can influence the routing design.

---

# 50. Routing and Analytics

A request may need dimensions such as:

```text
tenant
locale
route
host
```

for observability and analytics.

However, analytics should not become a reason to duplicate routing resolution.

Use the canonical request context.

---

# 51. Routing and Server Actions

A Server Action may need tenant context.

Never rely solely on a hidden field:

```text
tenantId = formData.get("tenantId")
```

Instead:

```text
authenticated principal
       ↓
tenant membership
       ↓
authorized tenant context
```

The submitted tenant identifier can be validated against trusted context if needed.

---

# 52. Routing and Background Jobs

Background jobs may not have:

```text
hostname
pathname
cookies
```

Therefore tenant context must often be serialized explicitly into the job.

Example:

```text
Job
├── tenantId
├── resourceId
└── operation
```

When the job executes:

```text
tenantId
   ↓
authorization/business invariants
```

must still be enforced.

Do not assume request routing exists in asynchronous execution.

---

# 53. Routing and Webhooks

Webhooks may identify tenant through:

```text
endpoint
signature
integration ID
external account ID
```

rather than the browser hostname.

Therefore tenant resolution is not always:

```text
hostname → tenant
```

The broader abstraction is:

```text
request source
   ↓
context resolver
   ↓
tenant context
```

Different execution paths can use different trusted tenant resolution mechanisms.

---

# 54. Production Context Resolver

A mature architecture can expose:

```text
resolveRequestContext(request)
```

Conceptually:

```text
Request
   ↓
Host Resolution
   ↓
Tenant Resolution
   ↓
Locale Resolution
   ↓
Route Resolution
   ↓
RequestContext
```

Example:

```ts
type RequestContext = {
  tenantId?: string;
  locale: string;
  route: string;
  host: string;
};
```

The actual object should contain only the context genuinely required.

---

# 55. Request Context Is Not Authorization

Even a fully resolved context:

```text
{
  tenantId: "123",
  locale: "fr",
  route: "/billing"
}
```

does not prove:

```text
user can access billing
```

The next step remains:

```text
RequestContext
   +
Principal
   ↓
Authorization
```

This separation prevents routing from becoming a hidden authorization mechanism.

---

# 56. Complete Multi-Tenant Request Flow

A strong architecture is:

```text
                         Request
                            │
                            ▼
                    Normalize Request
                            │
                            ▼
                       Resolve Host
                            │
                            ▼
                      Resolve Tenant
                            │
                            ▼
                      Resolve Locale
                            │
                            ▼
                    Resolve Route
                            │
                            ▼
                    Authenticate User
                            │
                            ▼
                  Authorize Tenant Access
                            │
                            ▼
                   Authorize Resource
                            │
                            ▼
                 Redirect / Rewrite / Continue
                            │
                            ▼
                    Cache / Render
                            │
                            ▼
                         Response
```

---

# 57. Prediction Challenge 1

Request:

```text
acme.example.com/dashboard
```

The resolver determines:

```text
tenant = acme
```

The authenticated user belongs only to:

```text
globex
```

What should happen?

### Expected reasoning

Tenant resolution succeeds.

Tenant authorization fails.

The user must not receive Acme's protected dashboard.

The important distinction is:

```text
tenant discovery ≠ tenant access
```

---

# 58. Prediction Challenge 2

Two tenants use:

```text
acme.example.com
globex.example.com
```

The cache key is:

```text
dashboard
```

Both receive the same cached dashboard.

What failed?

### Expected reasoning

The cache identity is missing tenant context.

The representation must be scoped according to its reuse boundary.

---

# 59. Prediction Challenge 3

Request:

```text
acme.example.com/fr/dashboard
```

returns English content.

The locale resolver correctly returns:

```text
fr
```

What should you investigate?

### Expected reasoning

Inspect:

```text
locale propagation
rendering dependencies
translation loading
cache identity
cached representation
```

A correct locale resolution does not guarantee correct downstream rendering.

---

# 60. Prediction Challenge 4

A request for:

```text
unknown.example.com
```

is silently mapped to:

```text
default-tenant
```

Why is this dangerous?

### Expected reasoning

An unknown tenant must not accidentally inherit another tenant's context.

Default fallback can become a cross-tenant isolation failure.

---

# 61. Prediction Challenge 5

A middleware rewrite changes:

```text
/acme/dashboard
```

to:

```text
/_tenants/acme/dashboard
```

but authorization checks only the rewritten path.

What should you verify?

### Expected reasoning

Ensure the tenant identity represented by the rewritten path matches the canonical tenant context established before authorization.

Internal routing transformations must not create a new, contradictory security identity.

---

# 62. SDE-2 Interview Question

### "How would you design multi-tenant routing?"

A strong answer should describe:

```text
request
→ host/path resolution
→ tenant lookup
→ canonical tenant context
→ authentication
→ membership authorization
→ resource authorization
→ routing
→ cache/rendering
```

Then discuss:

```text
custom domains
subdomains
cache isolation
cookies
observability
failure modes
```

---

# 63. SDE-2 Interview Question

### "Would you use a subdomain or a path for tenants?"

Do not answer with a universal rule.

Compare:

```text
Subdomain
    ↓
tenant.example.com

Path
    ↓
example.com/tenant
```

Then evaluate:

```text
custom domains
branding
DNS
cookies
SEO
routing complexity
tenant discovery
infrastructure
```

The architecture should follow the application's requirements.

---

# 64. SDE-2 Interview Question

### "How do you prevent cross-tenant cache leakage?"

Discuss:

```text
tenant-aware cache identity
+
correct rendering boundaries
+
authorization
+
tenant-scoped data access
+
negative tests
+
cache observability
```

Do not rely on authorization alone if the cache can bypass the authorization path.

---

# 65. SDE-2 Interview Question

### "Where should locale be resolved?"

Possible sources include:

```text
URL
cookie
user profile
Accept-Language
domain
```

The important requirement is deterministic precedence.

Then propagate locale consistently into:

```text
routing
rendering
data selection
cache identity
```

where applicable.

---

# 66. Common Anti-Patterns

## Anti-Pattern 1 — Hostname Equals Tenant ID Forever

This tightly couples infrastructure naming to internal identity.

A mapping layer is often more flexible.

---

## Anti-Pattern 2 — Tenant Resolution Equals Tenant Authorization

Knowing which tenant a request targets does not prove the user belongs to that tenant.

---

## Anti-Pattern 3 — Trusting Arbitrary Host Headers

Host-derived routing must operate within a trusted deployment model.

---

## Anti-Pattern 4 — Defaulting Unknown Hosts to a Real Tenant

This can create catastrophic isolation failures.

---

## Anti-Pattern 5 — Locale Only in React State

Server rendering, routing, and caching may need locale context before client state exists.

---

## Anti-Pattern 6 — Locale Missing From Cache Identity

Different-language representations can collide.

---

## Anti-Pattern 7 — Recomputing Tenant Context Everywhere

Different layers can disagree about tenant identity.

---

## Anti-Pattern 8 — Client-Supplied Tenant ID as Authority

Client input expresses intent; trusted server context establishes authority.

---

## Anti-Pattern 9 — Middleware Does Everything

Tenant resolution, authentication, authorization, data access, and business policy should not all be hidden inside middleware.

---

# 67. Testing Strategy

Multi-dimensional routing requires a matrix.

Test combinations such as:

```text
host
+
tenant
+
locale
+
authentication
+
authorization
+
route
```

Examples:

```text
acme + en + member + dashboard
acme + fr + member + dashboard
globex + en + acme-user + dashboard
unknown-host + anonymous
acme + unsupported-locale
custom-domain + authorized-user
custom-domain + unauthorized-user
```

---

# 68. Security Test Matrix

Explicitly test:

```text
wrong tenant
wrong host
unknown host
spoofed host
wrong locale
invalid tenant
unauthenticated tenant request
authenticated but unauthorized tenant request
cross-tenant cache reuse
cross-tenant rewrite
```

The goal is to test invariants rather than only happy paths.

---

# 69. Performance Considerations

Every request may perform:

```text
host parsing
tenant lookup
locale resolution
authentication
authorization
```

If tenant lookup requires a database request on every request, routing itself can become expensive.

Possible approaches include:

```text
edge-friendly lookup
cached domain mapping
signed routing metadata
in-memory configuration
database caching
```

But optimization must not weaken correctness or security.

---

# 70. Tenant Lookup Caching

Tenant domain mappings are often relatively stable.

A cache might represent:

```text
acme.example.com
        ↓
tenant-123
```

However, changes such as:

```text
domain reassignment
tenant deletion
suspension
```

must invalidate the mapping appropriately.

Routing cache correctness therefore matters just like application data caching.

---

# 71. Tenant Suspension

Suppose:

```text
tenant = acme
status = suspended
```

The hostname still resolves correctly.

But access should not necessarily continue.

The flow becomes:

```text
Host
 ↓
Tenant Resolution
 ↓
Tenant State
 ↓
Authorization / Access Policy
```

Routing context and tenant lifecycle state are separate concerns.

---

# 72. Tenant Deletion

If a tenant is deleted:

```text
acme.example.com
```

may still receive traffic.

The system must have deterministic behavior:

```text
404
suspension page
redirect
deprovisioning state
```

The routing layer must not accidentally route the hostname to another tenant.

---

# 73. Tenant Migration

A tenant may move:

```text
old.example.com
   ↓
new.example.com
```

A mature routing system can support:

```text
old host
   ↓
canonical tenant mapping
   ↓
redirect
   ↓
new host
```

This demonstrates why separating:

```text
public host
```

from:

```text
internal tenant ID
```

is valuable.

---

# 74. Context Versioning

For complex routing systems, configuration can change.

For example:

```text
tenant domain mapping
locale configuration
routing rules
feature configuration
```

Observability should make it possible to identify which configuration produced a routing decision.

This can be useful during:

```text
migration
incident debugging
domain changes
configuration rollout
```

---

# 75. Production Architecture

A mature multi-tenant routing system can be modeled as:

```text
                     Incoming Request
                            │
                            ▼
                   ┌─────────────────┐
                   │ Request Parser  │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ Host Resolver   │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ Tenant Resolver │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ Locale Resolver │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ Route Resolver  │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ Authentication  │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ Authorization   │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ Cache / Render  │
                   └────────┬────────┘
                            │
                            ▼
                         Response
```

---

# 76. The Core Mental Model

The most important distinction is:

```text
Host
   ↓
Where is this request targeting?

Tenant
   ↓
Which application/customer context?

Locale
   ↓
Which language/regional representation?

Principal
   ↓
Who is making the request?

Authorization
   ↓
What may they do?

Route
   ↓
Which application resource?

Cache Identity
   ↓
Which representation may be reused?
```

These are separate dimensions.

A mature system keeps them conceptually separate while propagating them consistently.

---

# 77. Final Architecture Principle

The senior-level question is not:

> "How do I route `/tenant/page`?"

The stronger question is:

> **"How is request context derived, how is tenant identity established, how is locale resolved, how is that context authorized, and how does the resulting identity propagate into routing, caching, rendering, and observability?"**

The complete model is:

```text
Raw Request
     ↓
Normalize
     ↓
Resolve Host
     ↓
Resolve Tenant
     ↓
Resolve Locale
     ↓
Resolve Route
     ↓
Authenticate
     ↓
Authorize
     ↓
Redirect / Rewrite / Continue
     ↓
Cache Identity
     ↓
Render
     ↓
Response
```

And the security invariant remains:

```text
Routing Context
        ≠
Authorization

but

Routing Context
        +
Principal
        ↓
Authorization Decision
```

---

# 78. Completion Checklist

You should now be able to:

* explain host-based routing,
* explain subdomain routing,
* explain custom-domain tenant routing,
* distinguish tenant resolution from tenant authorization,
* design tenant context resolution,
* reason about path-based tenant routing,
* compare host and path tenant architectures,
* resolve locale deterministically,
* understand locale as routing context,
* include locale in representation identity when necessary,
* combine tenant and locale routing,
* design canonical host/URL behavior,
* use redirects and rewrites appropriately,
* reason about trusted proxy context,
* avoid unsafe host-derived behavior,
* design unknown-tenant behavior,
* prevent routing loops,
* propagate tenant and locale context,
* design tenant-aware cache identities,
* reason about cookies across tenant domains,
* handle custom-domain authentication architecture,
* test cross-tenant routing failures,
* reason about tenant lookup performance,
* handle tenant suspension/deletion/migration,
* and defend multi-tenant routing architecture at SDE-2 level.

---

# 79. Part Boundary

This part establishes:

```text
Multi-Tenant Routing
+
Host-Based Routing
+
Path-Based Routing
+
Locale Routing
+
Custom Domains
+
Routing Context Propagation
```

It does **not** deeply cover:

```text
rate limiting
request policies
abuse controls
request quotas
```

Those belong to:

**KPI 07 — Part 07: Rate Limiting & Request Policies**

The locked progression remains:

```text
Part 01 → Middleware Mental Model
Part 02 → Request Matching & Execution Model
Part 03 → Redirects & Rewrites
Part 04 → Authentication-Aware Routing
Part 05 → Authorization Boundaries & Security
Part 06 → Multi-Tenant / Locale / Host-Based Routing
Part 07 → Rate Limiting & Request Policies
Part 08 → Middleware Performance & Runtime Constraints
Part 09 → Middleware + Caching + Rendering Integration
Part 10 → Production Middleware Architecture Capstone
```

**KPI 07 — Part 06 is complete.**
