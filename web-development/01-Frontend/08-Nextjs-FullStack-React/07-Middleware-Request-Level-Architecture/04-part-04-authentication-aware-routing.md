# Level 08 — KPI 07 — Part 04: Authentication-Aware Routing

## 1. Purpose

Authentication-aware routing is the layer where request routing begins depending on **who the requester is and whether an authenticated session exists**.

This is not simply:

```text
if (!user) redirect("/login")
```

At SDE-2 level, authentication-aware routing requires reasoning about:

* request lifecycle
* session resolution
* protected routes
* public routes
* authentication state
* redirects
* return URLs
* middleware
* Server Components
* Server Actions
* API routes
* authorization boundaries
* caching
* multi-tenant context
* session expiry
* race conditions
* security
* observability
* failure behavior

The governing question is:

> **At which point in the request lifecycle should authentication be established, and how should the routing system respond to each authentication state without creating security, caching, or navigation bugs?**

---

# 2. Authentication vs Authorization

These concepts must remain separate.

## Authentication

Answers:

```text id="f3xq2a"
"Who is this requester?"
```

Possible result:

```text id="9yq2kd"
anonymous
authenticated(userId)
```

## Authorization

Answers:

```text id="q0j5nz"
"Is this authenticated requester allowed
to perform this operation?"
```

Possible result:

```text id="7tw3rf"
allowed
denied
```

Therefore:

```text id="h7e0y4"
Authentication
      ↓
Identity

Authorization
      ↓
Permission
```

A routing redirect can respond to authentication state.

It does not replace authorization.

---

# 3. The Basic Authentication-Aware Request Flow

A protected page can conceptually follow:

```text id="x0q4gk"
Request
   ↓
Request classification
   ↓
Session resolution
   ↓
Authenticated?
   ├── NO
   │    ↓
   │  redirect → /login
   │
   └── YES
        ↓
      continue
        ↓
   route resolution
        ↓
   authorization
        ↓
   rendering
```

The exact framework lifecycle can vary, but the architectural responsibility remains.

---

# 4. Public vs Protected Routes

A routing architecture should explicitly classify routes.

Example:

```text id="p3z8la"
/                    public
/pricing              public
/docs                 public
/login                public
/signup               public

/dashboard            protected
/projects             protected
/settings              protected
/billing               protected
/admin                 privileged
```

Do not infer protection from component appearance.

Define the policy.

A route registry might conceptually contain:

```text id="v6w1zn"
public:
  /

  /pricing
  /docs
  /login

authenticated:
  /dashboard
  /projects
  /settings

privileged:
  /admin
```

The routing layer can then make deterministic decisions.

---

# 5. Why Explicit Route Classification Matters

Without explicit classification, teams often end up with scattered checks:

```text id="c0h2dz"
Dashboard.tsx
 → auth check

Settings.tsx
 → auth check

Billing.tsx
 → auth check

Projects.tsx
 → auth check
```

This creates:

```text id="qf9d0r"
policy duplication
inconsistent behavior
missed routes
different redirect destinations
harder auditing
```

A centralized routing policy can instead express:

```text id="f6z7eu"
protected route
      ↓
authentication required
```

This improves consistency.

However, centralized routing should not be treated as the only security enforcement layer.

---

# 6. Middleware as an Early Authentication Gate

Middleware can perform early request classification.

Conceptually:

```text id="x0qg17"
Request
   ↓
Middleware
   ↓
Session presence
   ↓
Protected route?
   ↓
Decision
```

For an unauthenticated request:

```text id="7m9r0n"
/dashboard
   ↓
no valid session
   ↓
redirect
   ↓
/login
```

This prevents the protected route from being rendered unnecessarily.

---

# 7. Authentication Should Not Be Only Middleware

A common architectural mistake is:

> "Middleware protects the application, so the server-side operation does not need authentication checks."

That is unsafe.

Consider:

```text id="4r9h6d"
/dashboard
```

and:

```text id="s7m0k2"
POST /api/projects
```

Even if middleware protects `/dashboard`, the API endpoint must independently enforce the appropriate security policy.

Similarly:

```text id="0x7c6n"
Server Action
```

must validate authentication and authorization for the mutation it performs.

The security model should be:

```text id="g4s1ae"
Routing gate
+
Server-side security boundary
```

not:

```text id="z6t8wv"
Routing gate only
```

---

# 8. Session Resolution

Authentication-aware routing depends on resolving the session.

Conceptually:

```text id="y9m8je"
Request
   ↓
Cookie / token / session identifier
   ↓
Session verification
   ↓
Identity
```

Possible outcomes:

```text id="c2a8sh"
NO SESSION
INVALID SESSION
EXPIRED SESSION
VALID SESSION
```

These states should not automatically be treated as identical.

For example:

```text id="h5d7le"
invalid session
```

may require clearing stale authentication state.

---

# 9. Authentication State Machine

Model authentication as a state machine:

```text id="k7p2sm"
             ┌──────────────┐
             │  ANONYMOUS   │
             └──────┬───────┘
                    │ login
                    ▼
             ┌──────────────┐
             │AUTHENTICATED │
             └──────┬───────┘
                    │ expiry/logout
                    ▼
             ┌──────────────┐
             │  ANONYMOUS   │
             └──────────────┘
```

But production systems often have additional states:

```text id="q8m1jf"
anonymous
authenticating
authenticated
session-expired
session-invalid
account-disabled
reauthentication-required
```

Routing behavior should be deliberate for each state.

---

# 10. Protected Route + Anonymous User

Example:

```text id="e7v3sb"
/dashboard
```

Requester:

```text id="4b5h9k"
anonymous
```

Expected navigation:

```text id="8k0z4m"
/dashboard
    ↓
authentication gate
    ↓
redirect
    ↓
/login
```

The original destination may be preserved:

```text id="p6q3yx"
/login?returnTo=/dashboard
```

But that value must be validated.

---

# 11. Return URL Architecture

A common UX requirement is:

```text id="2t7x8b"
User requested:
/dashboard/projects/123

Authentication required.

Redirect:
/login?returnTo=/dashboard/projects/123
```

After successful login:

```text id="x1r7ka"
/login
   ↓
validated returnTo
   ↓
/dashboard/projects/123
```

This creates a smooth navigation flow.

But the return URL is security-sensitive.

---

# 12. Safe Return URL Validation

Never blindly do:

```text id="7p1n4e"
redirect(returnTo)
```

if `returnTo` is controlled by the user.

A malicious value could be:

```text id="9w3k5a"
https://attacker.example
```

The routing layer should establish:

```text id="s4m8jx"
trusted internal destination
```

before redirecting.

A conceptual validation pipeline:

```text id="z7n2pk"
returnTo
   ↓
parse
   ↓
allowed?
   ├── YES → redirect
   └── NO  → safe default
```

A safe default might be:

```text id="b6q1vx"
/dashboard
```

depending on the application.

---

# 13. Authentication Redirect Loop

A classic failure:

```text id="u8x3rj"
/dashboard
    ↓
not authenticated
    ↓
/login
    ↓
authentication middleware
    ↓
not authenticated
    ↓
/login
```

The login route itself must generally be classified as public.

The invariant is:

```text id="r3m7fz"
Public authentication routes
must not require the same authentication
they are responsible for establishing.
```

---

# 14. Authenticated User Visiting Login

The inverse problem also occurs.

Suppose:

```text id="d5y2wa"
authenticated user
```

visits:

```text id="e9q4sp"
/login
```

The product may choose to:

```text id="j1v7cx"
/login
   ↓
redirect
   ↓
/dashboard
```

or allow the login page to remain accessible.

The important point is that this is a **product routing policy**, not an inherent authentication rule.

Do not accidentally create:

```text id="h7z2ka"
/login → /dashboard
/dashboard → /login
```

---

# 15. Session Expiration During Navigation

Consider:

```text id="n5c7pt"
User authenticated at 10:00
```

Session expires at:

```text id="q4k1zr"
10:30
```

At 10:31:

```text id="b8j2yx"
/dashboard
```

is requested.

The system must resolve:

```text id="m7c9wd"
expired session
```

rather than treating the stale cookie as proof of authentication.

Possible behavior:

```text id="p1x6gh"
clear invalid authentication state
       ↓
redirect to login
       ↓
preserve safe destination
```

---

# 16. Session Expiration During Mutation

A more subtle case:

```text id="w3k8vz"
User opens form
      ↓
session valid
      ↓
waits 45 minutes
      ↓
submits Server Action
      ↓
session expired
```

The mutation must not assume that because the page was previously accessible, the current action is authorized.

The server must re-establish:

```text id="j8f2cx"
current authentication
```

at mutation time.

This is a critical distinction:

```text id="q7d1mn"
page access
≠
future operation authorization
```

---

# 17. Server Actions and Authentication

A Server Action is a server-side operation.

Therefore:

```text id="s9k3tr"
Client
   ↓
Server Action
   ↓
Authenticate
   ↓
Authorize
   ↓
Validate input
   ↓
Mutate
```

Do not rely on:

```text id="w1p4zs"
"the user could only see the form
if middleware authenticated them"
```

The action is itself a security boundary.

---

# 18. Forms and Authentication

Consider:

```text id="z5q0an"
POST /profile/update
```

The UI may be rendered only for authenticated users.

But the server must still verify:

```text id="v8r3ec"
current identity
```

before changing profile data.

The correct model is:

```text id="u6n1kr"
UI visibility
      ↓
UX concern

Server authorization
      ↓
Security concern
```

Never use UI visibility as authorization.

---

# 19. API Authentication

API requests can arrive without navigating through a page.

For example:

```text id="m4x7ds"
POST /api/projects
```

The requester may call the endpoint directly.

Therefore:

```text id="t8z2cp"
API endpoint
   ↓
authenticate
   ↓
authorize
   ↓
validate
   ↓
execute
```

A page-level redirect is not sufficient protection.

---

# 20. Browser Navigation vs API Request

This distinction is important.

For:

```text id="b6k8qw"
GET /dashboard
```

an unauthenticated browser may reasonably receive:

```text id="v1z7sf"
redirect → /login
```

For:

```text id="r2m9xc"
POST /api/projects
```

an API consumer may instead require:

```text id="n7c3ah"
401 Unauthorized
```

rather than HTML login navigation.

Therefore authentication-aware routing should distinguish:

```text id="x3k5md"
document navigation
```

from:

```text id="q8v1lz"
API/data request
```

---

# 21. Request Classification

A useful classifier is:

```text id="b5x8zn"
Request
 │
 ├── Document navigation
 │
 ├── API request
 │
 ├── Server Action
 │
 ├── Static asset
 │
 ├── Webhook
 │
 └── Internal infrastructure request
```

Authentication behavior can differ by class.

Example:

```text id="q2m7cv"
Document + anonymous + protected
→ redirect

API + anonymous + protected
→ 401

Webhook
→ verify webhook authentication/signature

Static asset
→ usually bypass application authentication
```

This prevents one generic authentication rule from being incorrectly applied to every request.

---

# 22. Middleware Matcher Scope

Middleware should not indiscriminately process every request.

A broad matcher may include:

```text id="c4q7vw"
HTML
API
images
fonts
framework assets
favicon
webhooks
```

This can produce:

```text id="y5m1sp"
performance overhead
incorrect redirects
asset failures
unexpected cache behavior
```

The matcher should target the request classes that actually require authentication-aware routing.

---

# 23. Authentication and Static Assets

Suppose:

```text id="a6j3hr"
/_next/static/...
```

is accidentally subjected to:

```text id="t9w5kx"
authentication redirect
```

The application may produce broken assets for anonymous pages.

Therefore static assets should generally be excluded from application-level authentication routing unless there is a specific reason to protect them.

This is one reason request matching and authentication policy must be designed together.

---

# 24. Authentication and Caching

Authentication introduces a major cache question:

```text id="h3r8my"
Does the response vary by identity?
```

If yes, a shared cache must not accidentally reuse one user's response for another.

For example:

```text id="x5c2nv"
/dashboard
```

may depend on:

```text id="p4k8jw"
userId
tenantId
permissions
feature flags
```

A shared representation must account for these dependencies or the content should remain appropriately dynamic/private.

---

# 25. The Dangerous Pattern

Avoid conceptual architecture like:

```text id="k1y6qb"
GET /dashboard
   ↓
shared cache
   ↓
HTML generated for User A
   ↓
User B receives it
```

The critical security invariant is:

> **Authentication-dependent content must never become incorrectly reusable across authorization scopes.**

This is why authentication and caching cannot be designed independently.

---

# 26. Authentication State and Rendering

A route may have:

```text id="g7m4ps"
public shell
+
authenticated content
```

The architecture should determine which portion depends on identity.

Conceptually:

```text id="c3x8dy"
Page
│
├── Public Header
│
├── Product Information
│
├── User Dashboard
│
└── User Notifications
```

The public portions may be reusable.

The user-specific portions require appropriate request context.

---

# 27. Authentication and Streaming

Suppose:

```text id="q5k9za"
/dashboard
```

starts rendering.

If a dynamic authenticated region requires session resolution, the architecture should ensure that protected data is not streamed before the appropriate authentication checks occur.

The principle is:

```text id="r8m3jc"
Authenticate before exposing protected representation.
```

Do not treat streaming as a way to bypass the security boundary.

---

# 28. Authentication + Tenant Resolution

Many SaaS applications require:

```text id="v2n7xf"
hostname
   ↓
tenant
```

and:

```text id="m8q4zs"
session
   ↓
user
```

The system then needs:

```text id="y3c6kp"
user belongs to tenant?
```

This produces:

```text id="f8w2vd"
Request
   ↓
Resolve tenant
   ↓
Resolve identity
   ↓
Verify membership
   ↓
Authorize
   ↓
Route
```

Authentication alone is insufficient.

---

# 29. Tenant Mismatch

Consider:

```text id="u4s7cb"
acme.example.com
```

but the session belongs to a user who is not a member of Acme.

The system must not assume:

```text id="p8n2xy"
authenticated
→ allowed
```

Instead:

```text id="x6k3mw"
authenticated
+
tenant membership
+
permission
```

must all be considered.

This is where authentication-aware routing connects directly to the next part:

**Authorization Boundaries & Security.**

---

# 30. Login Callback Routing

Authentication systems often include a callback:

```text id="m7c4zt"
/auth/callback
```

The callback may contain:

```text id="b3x8vn"
authorization code
state
provider information
```

This endpoint must be handled differently from an ordinary public page.

The callback flow is conceptually:

```text id="w1j9qs"
Identity Provider
      ↓
callback
      ↓
validate state
      ↓
exchange/verify credentials
      ↓
establish session
      ↓
validated destination
      ↓
redirect
```

The callback must not simply trust arbitrary query parameters.

---

# 31. Authentication Callback Security

Important security concepts include:

```text id="q8m2sd"
state validation
nonce where applicable
PKCE where applicable
callback URL validation
session establishment
token handling
```

The exact implementation depends on the authentication system.

The routing architecture must nevertheless treat the callback as a security-sensitive boundary.

---

# 32. Authentication Failure Semantics

Not every authentication failure means:

```text id="c7n4ya"
redirect to /login
```

Different failures may require different responses.

| Condition                      | Possible Response            |
| ------------------------------ | ---------------------------- |
| No session                     | Login redirect / 401         |
| Expired session                | Reauthenticate               |
| Invalid session                | Clear state + reauthenticate |
| Disabled account               | Access-denied flow           |
| API authentication failure     | 401                          |
| Authenticated but unauthorized | 403 / access-denied page     |
| Invalid callback               | Reject callback              |
| Invalid return URL             | Safe fallback                |

The exact UX is application-specific.

The important skill is distinguishing the states.

---

# 33. 401 vs 403

A classic interview question.

Conceptually:

```text id="d5k8zx"
401
→ authentication is missing or invalid

403
→ requester is authenticated but lacks permission
```

Therefore:

```text id="m1q7cs"
anonymous
→ 401/login flow

authenticated but forbidden
→ 403/access-denied flow
```

Do not use them interchangeably.

---

# 34. Authentication Routing State Machine

A useful model:

```text id="z8r2vm"
                 Request
                    │
                    ▼
             ┌─────────────┐
             │Session Check│
             └──────┬──────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
    Anonymous     Valid       Invalid
        │           │           │
        ▼           ▼           ▼
     Public?     Continue    Reauthenticate
      /   \         │
    yes   no        ▼
    │      │    Authorization
    ▼      ▼         │
 Continue Login      ▼
                 Allowed?
                  /    \
                yes     no
                 │       │
                 ▼       ▼
              Continue   403
```

This state machine prevents authentication logic from becoming a collection of unrelated `if` statements.

---

# 35. Route Groups and Authentication

Application route organization can also reflect authentication boundaries.

Conceptually:

```text id="e6t3rp"
app/
├── (public)/
│   ├── page
│   ├── pricing
│   └── login
│
├── (authenticated)/
│   ├── dashboard
│   ├── projects
│   └── settings
│
└── (admin)/
    └── admin
```

This does not automatically create authorization.

It is an organizational mechanism.

The runtime security policy still needs to enforce access.

---

# 36. Nested Authentication Boundaries

Consider:

```text id="j2q8mb"
/dashboard
/dashboard/settings
/dashboard/settings/security
```

You may have:

```text id="s9v4kd"
dashboard
→ authenticated

security settings
→ authenticated + recent reauthentication
```

This demonstrates that authentication requirements can become progressively stronger.

Possible policy:

```text id="u4h7qx"
ordinary dashboard
→ session required

security-sensitive action
→ session + recent authentication
```

Do not assume every authenticated route has identical security requirements.

---

# 37. Reauthentication

Certain operations may require:

```text id="c6x1ny"
recent authentication
```

Examples include:

```text id="m9w4sv"
change password
change MFA settings
delete account
view sensitive security information
```

Routing may therefore send the user to:

```text id="t5z7ka"
/reauthenticate
```

rather than:

```text id="p2x9mc"
/login
```

The distinction is important because the user is already authenticated.

---

# 38. Authentication-Aware Redirect Preservation

Suppose:

```text id="a3r6vz"
/settings/security
```

requires reauthentication.

Redirect:

```text id="w9k2jc"
/reauthenticate?returnTo=/settings/security
```

After successful reauthentication:

```text id="g5v8nx"
/settings/security
```

Again:

```text id="y1m4qs"
returnTo
```

must be safely constrained.

---

# 39. Race Conditions

Authentication state can change while requests are in flight.

Example:

```text id="q6x3wm"
Request A
→ session valid

Request B
→ logout

Request A
→ continues
```

The system must define whether the request's authentication decision is based on:

```text id="v2p8jd"
session state at request start
```

or another consistent security model.

For sensitive operations, the final server-side authorization check remains critical.

---

# 40. Concurrent Tabs

Browser example:

```text id="n8c4sy"
Tab A → dashboard
Tab B → logout
Tab A → submit mutation
```

Tab A may still hold stale UI state.

The server must treat:

```text id="f6m1zr"
current request authentication
```

as authoritative.

Never trust the UI's belief that the user is logged in.

---

# 41. Authentication and Client State

Client state might say:

```text id="r5j8vq"
user = authenticated
```

but the server may determine:

```text id="k3z7xp"
session expired
```

Therefore:

```text id="h9m2sd"
client auth state
```

is a UX representation.

The server's authentication result is authoritative for protected operations.

---

# 42. Authentication Loading States

A client application may temporarily represent:

```text id="w6p3kn"
unknown
```

before authentication status is resolved.

Possible client states:

```text id="z2q8yf"
loading
authenticated
unauthenticated
error
```

But server-rendered protected routes should not expose protected content while waiting for client-side authentication discovery.

This is one reason server-side authentication checks are important.

---

# 43. Anti-Pattern — Client-Only Protection

Bad architecture:

```text id="r9m4wb"
render dashboard
     ↓
client loads
     ↓
check auth
     ↓
redirect
```

Problems may include:

```text id="n1c7xs"
protected content briefly rendered
poor UX
unnecessary data transfer
security mistakes
SEO/indexing problems
flash of unauthorized UI
```

For protected server-rendered resources, authentication should be established before protected content is exposed.

---

# 44. Anti-Pattern — Middleware as Complete Security

Bad assumption:

```text id="y4t7km"
middleware protected route
→ backend operation is safe
```

Incorrect.

A direct request to the operation must still encounter its security boundary.

The correct architecture is:

```text id="p8w2vx"
Routing gate
      +
Server-side authorization
```

---

# 45. Anti-Pattern — Authentication by URL

Bad assumption:

```text id="j6m3qa"
/admin
→ admin access
```

because the route exists.

URLs do not grant permissions.

The server must determine:

```text id="k8x1zs"
identity
+
authorization policy
```

before protected operations succeed.

---

# 46. Anti-Pattern — Authentication Cookie as Authorization

A cookie may indicate:

```text id="u7p4mb"
authenticated session
```

but that does not imply:

```text id="z3q8nd"
admin permission
```

or:

```text id="w5c2ya"
tenant membership
```

Those are separate policy decisions.

---

# 47. Anti-Pattern — Redirect Everything to Login

Suppose an authenticated user accesses:

```text id="v4m7xp"
/admin
```

but lacks permission.

Redirecting them to login is misleading.

They are already authenticated.

A more accurate model is:

```text id="c8y2jw"
authenticated
+
not authorized
→ forbidden
```

which may result in:

```text id="s3n6kq"
403
```

or an application-specific access-denied page.

---

# 48. Anti-Pattern — Ignore API Semantics

Returning an HTML login redirect to:

```text id="q1r8vz"
POST /api/projects
```

may be inappropriate for an API consumer.

Classify the request before selecting the authentication failure response.

---

# 49. Production Authentication Architecture

A mature architecture can look like:

```text id="m5k8qr"
                     REQUEST
                        │
                        ▼
                Request Classification
                        │
           ┌────────────┼─────────────┐
           │            │             │
           ▼            ▼             ▼
        Document       API         Mutation
           │            │             │
           └────────────┼─────────────┘
                        ▼
                 Session Resolution
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
          Anonymous           Authenticated
              │                   │
              ▼                   ▼
        Public Route?       Authorization
          /      \            /       \
        yes      no        yes         no
         │        │         │           │
         ▼        ▼         ▼           ▼
      Continue  Login    Continue      403
```

This is the architecture to reason about rather than a specific code snippet.

---

# 50. Observability

Authentication routing decisions should be observable without exposing sensitive credentials.

Useful telemetry:

```text id="z7v3mx"
request ID
route
request class
authentication state
authentication decision
authorization decision
redirect reason
destination
tenant context where appropriate
latency
error category
```

Example:

```text id="h2k6qw"
request=abc123
route=/dashboard
requestType=document
auth=anonymous
decision=redirect
destination=/login
```

For forbidden access:

```text id="v5m9zr"
request=xyz789
route=/admin
auth=authenticated
authorization=denied
response=403
```

Avoid logging:

```text id="b1q7yc"
passwords
session secrets
access tokens
raw sensitive authentication credentials
```

---

# 51. Debugging Authentication Routing

When a user reports:

> "I keep getting redirected to login."

Investigate in this order:

```text id="m8v2qk"
1. Is the session actually present?
2. Is the session valid?
3. Is it expired?
4. Is middleware reading the correct session state?
5. Is the route classified correctly?
6. Is the login route public?
7. Is the matcher processing the expected request?
8. Is another redirect rule firing?
9. Is tenant context correct?
10. Is the client sending the expected credentials/cookies?
```

Do not immediately modify the redirect.

Find the state transition that is wrong.

---

# 52. Debugging "Logged In but 403"

If:

```text id="p4z8wc"
authenticated = true
```

but:

```text id="q7m2xa"
403
```

the problem is likely authorization rather than authentication.

Investigate:

```text id="x5n9kd"
identity
tenant membership
role
permission
resource ownership
policy evaluation
```

This distinction dramatically reduces debugging time.

---

# 53. SDE-2 Prediction Challenge

### Scenario

```text id="e8r3my"
User visits /dashboard.

Middleware detects no session.

It redirects to:
/login?returnTo=/dashboard

After login, the user is redirected back to:
/dashboard

But /dashboard immediately redirects to:
/login again.
```

Potential causes:

```text id="j5k9pz"
1. Session was not actually established.
2. Session cookie was not persisted.
3. Middleware cannot read the cookie.
4. Cookie scope/domain/path is incorrect.
5. Session validation fails.
6. Authentication provider callback failed.
7. Different environments use different session configuration.
8. Multiple auth systems disagree about session state.
```

The important insight:

> The redirect itself is probably not the root problem. The authentication state transition is.

---

# 54. SDE-2 Prediction Challenge 2

A user is authenticated.

They can access:

```text id="r2v7mx"
/dashboard
```

but:

```text id="f8k3qd"
POST /api/projects
```

returns:

```text id="x5j9pa"
401
```

Possible cause:

```text id="b7m2ck"
page authentication and API authentication
are using different credential/session mechanisms.
```

This demonstrates why authentication architecture must be consistent across request classes.

---

# 55. SDE-2 Prediction Challenge 3

A user logs out in one browser tab.

Another tab submits:

```text id="c9v4my"
Server Action
```

The UI still displays the user as authenticated.

What should determine whether the mutation succeeds?

```text id="z7k2qp"
current server-side authentication state
```

not:

```text id="j4m8xs"
client UI state
```

---

# 56. SDE-2 Interview Questions

You should be able to explain:

### Routing

1. How would you classify public and protected routes?
2. Where should authentication be checked?
3. Why use middleware?
4. Why shouldn't middleware be the only security boundary?

### HTTP

5. When would an unauthenticated browser request receive a redirect?
6. When should an API return 401 instead?
7. What is the difference between 401 and 403?

### Security

8. How do you prevent open redirects?
9. How do you protect Server Actions?
10. How do you prevent tenant-crossing access?
11. Why isn't a hidden route a security boundary?

### Caching

12. How does authentication affect cacheability?
13. What happens if user-specific HTML becomes shared?
14. Which request properties determine cache identity?

### Debugging

15. Why might a valid login still result in a login loop?
16. How would you debug "logged in but 403"?
17. How do concurrent tabs affect authentication state?

---

# 57. Architecture Review Checklist

Before shipping authentication-aware routing, verify:

## Route Policy

```text
[ ] Public routes explicitly identified
[ ] Authenticated routes explicitly identified
[ ] Privileged routes identified
```

## Session

```text
[ ] Session resolution defined
[ ] Expiry behavior defined
[ ] Invalid-session behavior defined
[ ] Logout behavior defined
```

## Redirects

```text
[ ] Login redirect defined
[ ] Return URL validated
[ ] Redirect loops prevented
[ ] Canonical destinations defined
```

## API

```text
[ ] API authentication defined
[ ] 401 behavior defined
[ ] 403 behavior defined
```

## Security

```text
[ ] Server Actions independently protected
[ ] APIs independently protected
[ ] Authorization separate from authentication
[ ] Tenant membership checked
```

## Cache

```text
[ ] User-specific content not incorrectly shared
[ ] Tenant boundaries represented
[ ] Request-dependent caching reviewed
```

## Observability

```text
[ ] Authentication decisions observable
[ ] Redirect reasons observable
[ ] Sensitive credentials excluded from logs
```

---

# 58. Final Mental Model

Authentication-aware routing can be summarized as:

```text id="e7m4cx"
                 REQUEST
                    │
                    ▼
           CLASSIFY REQUEST
                    │
                    ▼
            RESOLVE SESSION
                    │
             ┌──────┴──────┐
             ▼             ▼
        ANONYMOUS      AUTHENTICATED
             │             │
             ▼             ▼
       PUBLIC ROUTE?   AUTHORIZATION
         /     \         /       \
       YES      NO     YES        NO
        │        │      │          │
        ▼        ▼      ▼          ▼
    CONTINUE   LOGIN  CONTINUE    403
```

But the complete production architecture is:

```text id="p9c4vz"
Request
  ↓
Request Classification
  ↓
Authentication
  ↓
Tenant Resolution
  ↓
Authorization
  ↓
Routing
  ↓
Cache / Rendering
  ↓
Response
```

And the central security principle is:

> **Authentication establishes identity; authorization establishes permission; routing determines navigation; caching must respect both.**

---

# 59. Part Boundary

This part establishes:

```text
Authentication-aware routing
+
session state
+
protected/public routes
+
login redirects
+
return URL handling
+
API authentication behavior
+
authentication-aware caching
+
authentication failure states
```

It intentionally does not fully establish:

```text
authorization policy design
role/permission models
resource ownership
tenant security boundaries
server-side security enforcement
```

Those belong to:

**KPI 07 — Part 05: Authorization Boundaries & Security.**

---

# 60. Completion Criteria

You have completed this part when you can independently:

* Model authentication as a request-state problem.
* Separate authentication from authorization.
* Classify public and protected routes.
* Design middleware authentication gates.
* Explain why middleware is not the complete security boundary.
* Design login redirects.
* Preserve and validate safe return URLs.
* Prevent authentication redirect loops.
* Handle expired and invalid sessions.
* Protect Server Actions independently.
* Protect API endpoints independently.
* Distinguish document navigation from API authentication behavior.
* Understand 401 vs 403.
* Analyze authentication-dependent caching.
* Protect tenant boundaries.
* Handle concurrent tabs and stale client auth state.
* Design reauthentication flows.
* Reason about callback routing.
* Debug login loops.
* Debug authenticated-but-forbidden requests.
* Explain authentication-aware routing architecture in an SDE-2 interview.

## KPI 07 Progress

```text
Part 01 → Middleware Mental Model                 ✓
Part 02 → Request Matching & Execution Model      ✓
Part 03 → Redirects & Rewrites                    ✓
Part 04 → Authentication-Aware Routing            ✓
Part 05 → Authorization Boundaries & Security     → NEXT
Part 06 → Multi-Tenant / Locale / Host Routing
Part 07 → Rate Limiting & Request Policies
Part 08 → Middleware Performance & Runtime Limits
Part 09 → Middleware + Cache + Rendering
Part 10 → Production Middleware Architecture
```

**Next: KPI 07 — Part 05: Authorization Boundaries & Security.**
