# Level 08 — KPI 08 — Part 04: API Authentication & Authorization

## 1. Part Objective

This part establishes the security architecture for Next.js Route Handlers and server-side APIs.

The governing question is:

> **How does an API establish who is making a request, determine what that identity is allowed to do, and prevent authentication context from being confused with authorization?**

The production request pipeline becomes:

```text
HTTP Request
    ↓
Parse Transport Input
    ↓
Authenticate
    ↓
Establish Principal
    ↓
Resolve Tenant / Resource Context
    ↓
Authorize
    ↓
Application Operation
    ↓
Response
```

The central distinction is:

```text
Authentication = Who are you?

Authorization = What are you allowed to do?
```

These are related but separate security decisions.

---

# 2. The Security Boundary

A Route Handler is an important security boundary, but it is not necessarily the only one.

```text
                    HTTP Request
                         ↓
                 ┌───────────────┐
                 │ Route Handler │
                 └───────┬───────┘
                         ↓
                  Authentication
                         ↓
                    Principal
                         ↓
                   Authorization
                         ↓
                 Application Logic
                         ↓
                    Persistence
```

The application should never assume:

```text
"Because the request reached this route,
the requester is authorized."
```

Routing determines **where the request goes**.

Authentication determines **who is making it**.

Authorization determines **what they may do**.

---

# 3. Authentication vs Authorization

Consider:

```text
Alice → POST /api/admin/users
```

Authentication asks:

```text
Who is Alice?
```

Authorization asks:

```text
Can Alice create administrative users?
```

Possible result:

```text
Authentication:
valid

Authorization:
denied
```

Therefore:

```text
Authenticated ≠ Authorized
```

This is one of the most important API security invariants.

---

# 4. The Principal

After successful authentication, the system establishes a principal.

Conceptually:

```ts
type Principal = {
  id: string;
  type: "user";
};
```

A richer principal may contain:

```text
userId
sessionId
tenantId
roles
scopes
authentication method
authentication timestamp
```

But avoid placing arbitrary authorization conclusions into authentication data.

A principal answers:

> **Who is this requester?**

Authorization should answer:

> **What may this requester do?**

---

# 5. Authentication State Machine

An API request can exist in several states:

```text
                    ┌─────────────┐
                    │   Request   │
                    └──────┬──────┘
                           ↓
                     Authenticate
                           ↓
            ┌──────────────┼──────────────┐
            ↓              ↓              ↓
         Missing        Invalid         Valid
            ↓              ↓              ↓
          401            401          Principal
                                           ↓
                                     Authorize
```

Authentication can fail because:

```text
credential absent
credential malformed
credential expired
credential revoked
credential invalid
session no longer exists
token signature invalid
```

These are authentication failures.

---

# 6. Cookie-Based Authentication

A browser application may authenticate through a session cookie.

Conceptually:

```text
Browser
   ↓
Cookie: session=...
   ↓
Route Handler
   ↓
Session Store
   ↓
Principal
```

The cookie might contain:

```text
opaque session identifier
```

rather than the entire user identity.

The server then resolves:

```text
session ID
   ↓
session record
   ↓
user ID
   ↓
principal
```

This allows the server to revoke or expire sessions centrally.

---

# 7. Token-Based Authentication

Another architecture uses bearer tokens.

Conceptually:

```http
Authorization: Bearer <token>
```

The server then verifies the credential.

Depending on the architecture, this may involve:

```text
signature verification
expiration
issuer
audience
scope
revocation strategy
```

The important principle is:

> A token is a credential, not proof that every requested operation is authorized.

---

# 8. Authentication Credential vs Identity

Do not confuse:

```text
credential
```

with:

```text
identity
```

For example:

```text
Cookie / token
       ↓
credential
       ↓
authentication verification
       ↓
principal
```

The application should operate on the verified principal rather than repeatedly interpreting raw credentials.

---

# 9. Authentication Should Be Centralized

A reusable authentication boundary might conceptually expose:

```ts
const principal = await authenticate(request);
```

The result might be:

```text
Principal
```

or:

```text
Unauthenticated
```

This avoids duplicating authentication logic across every endpoint.

But centralization does **not** mean authorization should become one giant global rule.

Authentication can be standardized.

Authorization often requires operation-specific context.

---

# 10. Authentication Middleware vs Route Handler

Middleware can perform early authentication-related work.

For example:

```text
Request
   ↓
Middleware
   ↓
session presence check
   ↓
Route Handler
   ↓
authoritative authentication
```

But middleware should not automatically become the only security boundary.

Why?

Because APIs can be reached through:

```text
direct requests
internal calls
background execution
webhooks
different routes
non-browser clients
```

Security-sensitive operations should enforce authorization at the operation boundary.

---

# 11. Authentication Context Propagation

Once a principal is established:

```text
Request
 ↓
authenticate
 ↓
Principal
 ↓
Application Service
```

The application can receive:

```ts
{
  principal,
  command
}
```

rather than:

```ts
{
  request
}
```

This preserves transport/application separation.

---

# 12. Authorization

Authorization evaluates whether the principal can perform an operation.

Conceptually:

```text
Principal
    +
Action
    +
Resource
    +
Context
    ↓
Authorization Decision
```

For example:

```text
Principal:
Alice

Action:
update

Resource:
Project #42

Context:
Tenant A

Decision:
allow / deny
```

Authorization is therefore more than checking a role.

---

# 13. Role-Based Access Control

A simple authorization model may use roles:

```text
user
manager
admin
```

Then:

```text
admin
→ manage users

manager
→ manage team resources

user
→ manage own resources
```

This is commonly called RBAC:

```text
Role-Based Access Control
```

It can be useful, but roles alone can become insufficient for complex systems.

---

# 14. Permission-Based Authorization

Instead of only roles:

```text
admin
```

the system can define permissions:

```text
users.read
users.create
users.update
users.delete
billing.read
billing.manage
```

Then:

```text
role
 ↓
permissions
 ↓
authorization
```

This allows more granular policies.

---

# 15. Resource-Based Authorization

Sometimes the question is not:

```text
"Does this user have the editor role?"
```

but:

```text
"Does this user own this particular resource?"
```

Example:

```text
PUT /api/documents/123
```

Authorization may require:

```text
document.ownerId === principal.id
```

or:

```text
principal has permission on document 123
```

This is resource-based authorization.

---

# 16. Role Is Not Ownership

Consider:

```text
Alice
role = user
```

and:

```text
Document 123
owner = Alice
```

Alice may be allowed to edit Document 123.

But:

```text
Document 456
owner = Bob
```

may be inaccessible.

Therefore:

```text
role
≠
resource ownership
```

A production policy may require both.

---

# 17. Tenant Authorization

In a multi-tenant system:

```text
Principal
+
Tenant
+
Resource
```

must be evaluated together.

For example:

```text
Alice belongs to Tenant A.
Document 123 belongs to Tenant A.
```

Potentially:

```text
allow
```

But:

```text
Document 999 belongs to Tenant B.
```

must not automatically become accessible merely because Alice is authenticated.

The critical invariant is:

> **Authentication establishes the requester; authorization establishes whether that requester may access the requested tenant resource.**

---

# 18. Tenant Resolution vs Tenant Authorization

These are separate steps.

```text
Hostname
    ↓
Tenant Resolution
    ↓
Tenant A
```

does not automatically mean:

```text
Principal
    ↓
Authorized for Tenant A
```

The system must establish:

```text
principal ∈ tenant membership
```

or an equivalent authorization relationship.

This is especially important for:

```text
subdomains
custom domains
tenant path routing
```

---

# 19. Resource Ownership Check

Consider:

```text
GET /api/orders/123
```

The application may perform:

```text
authenticate
    ↓
principal = Alice
    ↓
load order 123
    ↓
verify Alice may access order 123
    ↓
return
```

Do not rely only on:

```text
GET /api/orders/123
```

being reachable by an authenticated user.

Authentication is not sufficient.

---

# 20. IDOR

A common authorization vulnerability occurs when users can manipulate resource IDs to access another user's data.

Conceptually:

```text
Alice requests:
GET /api/orders/123

works.

Alice changes:
GET /api/orders/124

and receives Bob's order.
```

This is an authorization failure.

The important lesson is:

```text
resource identifier
≠
authorization proof
```

An ID identifies a resource.

It does not establish permission to access it.

---

# 21. Authorization at the Data Boundary

Authorization should ideally be enforced close enough to the protected operation that bypassing the check becomes difficult.

Possible layers:

```text
Route Handler
Application Service
Domain Policy
Repository / query constraint
Database policy
```

A mature architecture may use multiple layers.

For example:

```text
Route Handler
→ authenticate

Application Service
→ authorize operation

Repository query
→ constrain tenant/resource scope
```

This creates defense in depth.

---

# 22. Do Not Trust Client Authorization State

A browser might contain:

```js
user.role === "admin"
```

That is useful for UI decisions.

It is not sufficient for security.

The client can potentially modify:

```text
localStorage
client state
request payload
JavaScript variables
network requests
```

Therefore:

```text
Client authorization state
→ UX hint

Server authorization decision
→ security boundary
```

---

# 23. Hidden UI Is Not Authorization

Consider:

```text
if (user.isAdmin) {
  showDeleteButton();
}
```

This improves UX.

But the server must still enforce:

```text
DELETE /api/users/123
```

independently.

Otherwise a user can call the endpoint directly.

The invariant is:

> **If an operation is security-sensitive, the server must authorize the operation regardless of whether the UI exposes it.**

---

# 24. 401 vs 403

This distinction should be precise.

### 401 Unauthorized

The requester has not successfully authenticated.

Conceptually:

```text
No valid principal
```

### 403 Forbidden

The requester is authenticated, but the operation is not permitted.

Conceptually:

```text
Valid principal
+
authorization denied
```

Therefore:

```text
401 → authentication problem

403 → authorization problem
```

---

# 25. Browser Navigation vs API Response

Authentication failures may be represented differently depending on the client.

For a browser document request:

```text
GET /dashboard
```

the application may redirect to:

```text
/login
```

For an API request:

```text
GET /api/me
```

the application may return:

```http
401 Unauthorized
```

The correct response depends on the contract.

Do not blindly redirect every API request.

---

# 26. Return-To URLs

After authentication, the user may need to return to the original page.

Conceptually:

```text
/dashboard
   ↓
login
   ↓
authenticated
   ↓
/dashboard
```

A query parameter might carry:

```text
returnTo=/dashboard
```

But this creates an important security concern.

---

# 27. Open Redirect Vulnerability

Suppose the application accepts:

```text
/login?returnTo=https://attacker.example
```

and after login redirects there.

That can become an open redirect.

A safer design restricts destinations to allowed internal paths.

For example:

```text
/dashboard
/settings
/projects/123
```

rather than arbitrary external URLs.

The principle is:

> **Navigation destinations derived from user-controlled input must be constrained.**

---

# 28. Authentication Redirect Loops

A common failure:

```text
/dashboard
 ↓
middleware sees unauthenticated
 ↓
/login
 ↓
login route is also protected
 ↓
/login
 ↓
/login
```

The system loops.

Therefore authentication architecture needs explicit route classification:

```text
Public
Protected
Authentication
Privileged
```

---

# 29. Authenticated User Visiting Login

The reverse case also matters.

Suppose:

```text
Alice is already authenticated.
```

Then:

```text
GET /login
```

may redirect to:

```text
/dashboard
```

But again:

```text
login
 ↓
dashboard
 ↓
middleware
 ↓
login
```

must not create loops.

Routing and authentication state machines must be designed together.

---

# 30. Session Expiration

Authentication can change while a user is interacting with the application.

Example:

```text
10:00
user authenticated

10:30
session expires

10:31
POST /api/orders
```

The request must not assume that the browser's previous state remains valid.

The server re-evaluates authentication for the request.

This produces:

```text
client state
    ≠
server authentication truth
```

---

# 31. Reauthentication

Certain sensitive operations may require stronger assurance.

Examples:

```text
change password
change MFA settings
change payout account
delete organization
rotate credentials
```

The system may require:

```text
recent authentication
```

rather than merely:

```text
active session
```

The authorization model can therefore include authentication freshness.

Conceptually:

```text
Principal
+
permission
+
authentication age
```

---

# 32. Session Revocation

A production authentication system may need to revoke sessions.

For example:

```text
user logs out all devices
security incident
password reset
account suspension
administrator revocation
```

The server must be able to establish:

```text
credential exists
+
credential is valid
+
credential is not revoked
```

A long-lived credential without revocation strategy can create operational security problems.

---

# 33. Cookies and Security

Authentication cookies require deliberate security properties.

Conceptually relevant attributes include:

```text
HttpOnly
Secure
SameSite
Path
Domain
Expiration
```

### HttpOnly

Helps prevent client-side JavaScript from reading the cookie.

### Secure

Restricts transmission to secure contexts.

### SameSite

Controls cross-site cookie behavior.

These attributes are part of authentication architecture, not merely configuration trivia.

---

# 34. Cookie Scope

Cookie domain and path affect where credentials are sent.

For multi-tenant applications, careless cookie scope can create unexpected credential sharing.

Consider:

```text
tenant-a.example.com
tenant-b.example.com
```

Cookie configuration must be consistent with the intended trust boundary.

The important question is:

> **Which hosts should receive this credential?**

---

# 35. Authentication Across Subdomains

Suppose:

```text
app.example.com
admin.example.com
api.example.com
```

share an authentication system.

Cookie domain and origin architecture must be deliberately designed.

Do not assume:

```text
same parent domain
=
same trust boundary
```

Subdomain trust relationships should be explicit.

---

# 36. Token Leakage

Authentication credentials should not casually appear in:

```text
URLs
logs
error messages
analytics
client-visible payloads
debug output
```

For example:

```text
/api/users?token=secret
```

creates unnecessary exposure because URLs can propagate through logs and other systems.

Credentials should be transported using mechanisms designed for credential handling.

---

# 37. Authorization Policy

A useful authorization policy can be expressed as:

```text
Can(principal, action, resource, context)
```

Example:

```text
Can(
  Alice,
  UPDATE,
  Document123,
  TenantA
)
```

returns:

```text
allow
```

or:

```text
deny
```

This is more powerful than:

```text
if role === "admin"
```

because it explicitly models the authorization decision.

---

# 38. Policy Inputs

Authorization may depend on:

```text
principal
role
permission
tenant
resource owner
resource state
action
environment
authentication freshness
organization policy
```

Therefore authorization can become a domain-level decision rather than a simple boolean role check.

---

# 39. Resource State Matters

Consider:

```text
Document status = archived
```

Even if the user normally has:

```text
documents.update
```

the policy might prohibit:

```text
update archived document
```

Therefore:

```text
permission
+
resource state
```

may both be required.

---

# 40. Authorization Is Operation-Specific

The same resource may permit:

```text
READ
```

but deny:

```text
DELETE
```

Example:

```text
Alice → read document → allow
Alice → update document → allow
Alice → delete document → deny
```

Therefore authorization should be modeled around:

```text
principal
+
action
+
resource
```

rather than merely:

```text
principal
+
resource
```

---

# 41. Batch Authorization

Consider:

```http
DELETE /api/documents
```

with:

```json
{
  "ids": ["1", "2", "3", "4"]
}
```

A dangerous implementation might authorize once:

```text
Alice can delete documents
```

and then delete every supplied ID.

But the real question is:

```text
Can Alice delete document 1?
Can Alice delete document 2?
Can Alice delete document 3?
Can Alice delete document 4?
```

Batch operations therefore require careful authorization semantics.

---

# 42. Authorization Before Side Effects

A strong rule is:

```text
authenticate
 ↓
authorize
 ↓
perform side effect
```

Avoid:

```text
perform database mutation
 ↓
check permission
```

Authorization should generally happen before irreversible or externally visible side effects.

---

# 43. Authorization and Transactions

Sometimes authorization depends on data that is concurrently changing.

Example:

```text
Alice may approve invoice 123
```

but another operation changes:

```text
invoice.status
```

between authorization and mutation.

This creates a potential time-of-check/time-of-use problem.

A mature system may need:

```text
authorization
+
transactional state verification
```

rather than treating authorization as completely detached from mutation.

---

# 44. Database Query Scoping

Instead of:

```text
find document 123
then check tenant
```

a safer architecture may query:

```text
find document 123
where tenantId = currentTenant
```

Conceptually:

```text
resource ID
+
authorization scope
```

becomes part of the retrieval operation.

This reduces the chance of accidentally loading another tenant's resource.

---

# 45. Tenant-Scoped Queries

For example:

```text
tenantId = A
resourceId = 123
```

The repository query becomes conceptually:

```text
WHERE id = 123
AND tenant_id = A
```

rather than:

```text
WHERE id = 123
```

followed by assumptions elsewhere.

This is defense in depth for tenant isolation.

---

# 46. Authentication Context and Caching

Authentication has major caching implications.

Consider:

```text
GET /api/me
```

The response depends on:

```text
principal
```

Therefore a shared cache must not accidentally serve:

```text
Alice's response
```

to:

```text
Bob
```

The cache identity must respect the response's representation dependencies.

This connects directly to KPI 06.

---

# 47. Authorization and Caching

Even if two users receive structurally similar responses, their authorization contexts may differ.

For example:

```text
Alice:
canEdit = true

Bob:
canEdit = false
```

If the response includes:

```json
{
  "canEdit": true
}
```

then the representation depends on authorization context.

Therefore:

```text
authorization decision
→ possible representation dependency
→ possible cache identity dimension
```

---

# 48. Personalized Data and Shared Caches

A dangerous pattern is:

```text
GET /api/dashboard
```

returns personalized data.

The server accidentally caches:

```text
/dashboard
```

globally.

Then:

```text
Alice's representation
```

could be reused for:

```text
Bob
```

This is a security failure, not merely a performance bug.

The core principle is:

> **Caching must preserve authorization and personalization boundaries.**

---

# 49. Middleware + Authorization

Middleware is useful for coarse routing decisions.

For example:

```text
/admin/*
```

may require authentication.

But:

```text
/admin/projects/123
```

may require:

```text
project membership
```

Middleware may not have enough information to make that resource-level decision efficiently or correctly.

Therefore:

```text
Middleware
→ coarse boundary

Application authorization
→ resource-level decision
```

---

# 50. Route Protection vs Operation Protection

These are not identical.

### Route protection

```text
/admin
```

requires authenticated users.

### Operation protection

```text
POST /api/users/123/promote
```

requires a specific authorization decision.

An authenticated user reaching the route does not imply permission for every operation underneath it.

---

# 51. API Authentication Architecture

A production request may follow:

```text
HTTP Request
     ↓
Credential Extraction
     ↓
Credential Verification
     ↓
Session / Token Validation
     ↓
Principal
     ↓
Tenant Resolution
     ↓
Authorization
     ↓
Application Operation
```

Each stage has a distinct responsibility.

---

# 52. Security Context Object

A useful conceptual structure is:

```ts
type SecurityContext = {
  principal: Principal;
  tenant?: Tenant;
  authentication: {
    method: string;
    authenticatedAt: Date;
  };
};
```

Then:

```text
SecurityContext
      +
Application Command
      ↓
Application Service
```

This keeps security context explicit.

---

# 53. Do Not Trust User-Supplied Identity

Consider:

```json
{
  "userId": "alice"
}
```

The server should not automatically interpret that as:

```text
requesting user = Alice
```

The authenticated identity should come from the verified credential.

The body might contain:

```text
targetUserId
```

but not authoritative:

```text
requestingUserId
```

This distinction prevents impersonation-style authorization errors.

---

# 54. Acting on Behalf of Another User

Some systems legitimately support delegated actions.

For example:

```text
administrator
acts on behalf of customer
```

Then the architecture should model this explicitly:

```text
authenticated principal
+
acting subject
+
delegation policy
```

Do not overload:

```text
userId
```

to represent all three concepts.

---

# 55. Service-to-Service Authentication

Not every API request comes from a browser.

Internal services may authenticate using:

```text
service credentials
signed requests
mTLS
service tokens
workload identity
```

The principal may therefore be:

```text
user
```

or:

```text
service
```

The authorization model should account for the caller type.

---

# 56. Webhook Authentication

Webhooks introduce another authentication pattern.

A webhook provider may sign the request.

Conceptually:

```text
Webhook Request
      ↓
signature extraction
      ↓
signature verification
      ↓
trusted external principal
      ↓
process event
```

The endpoint must not trust arbitrary incoming webhook payloads merely because they use a known URL.

---

# 57. Background Jobs

Background jobs may not have a normal browser session.

For example:

```text
queue
 ↓
worker
 ↓
process order
```

The system should establish:

```text
job identity
+
authorization context
+
tenant context
```

explicitly.

Do not assume:

```text
no browser session
=
no security requirement
```

---

# 58. Least Privilege

A useful security principle is:

> Give each principal only the permissions required for the operation.

For services:

```text
service A
→ read orders

service B
→ write invoices
```

rather than:

```text
every service
→ full database access
```

For users:

```text
read-only
```

should not implicitly become:

```text
delete
```

---

# 59. Deny by Default

A secure authorization architecture generally starts from:

```text
deny
```

and explicitly grants valid operations.

Conceptually:

```text
if authorized:
    allow
else:
    deny
```

Do not depend on an ever-growing list of prohibited cases.

---

# 60. Fail Closed

If the authorization system cannot determine whether an operation is permitted because of an unexpected failure, the secure default for sensitive operations is generally:

```text
deny
```

rather than:

```text
allow
```

For example:

```text
policy service unavailable
```

should not automatically mean:

```text
all requests allowed
```

This is a critical production security property.

---

# 61. Avoid Authorization Side Channels

Sometimes the difference between:

```text
404
```

and:

```text
403
```

can reveal whether a protected resource exists.

For sensitive resources, an application may intentionally use a response strategy that avoids revealing resource existence to unauthorized callers.

This is a policy decision.

The important reasoning is:

```text
HTTP response
→ information disclosure
```

not merely:

```text
HTTP response
→ protocol correctness
```

---

# 62. Authentication Logging

Authentication failures should be observable.

Useful information may include:

```text
request ID
timestamp
endpoint
authentication method
failure category
principal if safely known
tenant if safely known
```

Avoid logging:

```text
raw passwords
session secrets
bearer tokens
private credentials
```

Observability must not create a second security vulnerability.

---

# 63. Authorization Logging

Sensitive authorization decisions may also need auditability.

For example:

```text
actor
action
resource
tenant
decision
timestamp
request ID
```

This can support:

```text
security investigations
compliance
incident response
debugging
```

But audit logging itself must respect privacy and data-minimization requirements.

---

# 64. Security Event Correlation

A useful production chain is:

```text
Request ID
    ↓
Authentication event
    ↓
Authorization decision
    ↓
Application mutation
    ↓
Audit event
```

This allows engineers to answer:

> Who attempted this operation, what authorization decision was made, and what changed?

---

# 65. Common Authentication Anti-Patterns

## Anti-pattern 1

```text
Client says userId = Alice
→ trust it
```

Problem:

```text
identity spoofing
```

---

## Anti-pattern 2

```text
Client says isAdmin = true
→ trust it
```

Problem:

```text
client-controlled authorization
```

---

## Anti-pattern 3

```text
Middleware checks auth
→ Route Handler assumes authorization
```

Problem:

```text
authentication
≠
authorization
```

---

## Anti-pattern 4

```text
authenticated user
→ access any resource by ID
```

Problem:

```text
IDOR / resource authorization failure
```

---

## Anti-pattern 5

```text
all API failures
→ redirect to /login
```

Problem:

```text
API clients need protocol-level authentication responses
```

---

## Anti-pattern 6

```text
cache personalized response globally
```

Problem:

```text
cross-user data exposure
```

---

# 66. Production Scenario: ID Manipulation

Endpoint:

```text
GET /api/invoices/:id
```

Alice legitimately accesses:

```text
/invoices/100
```

She changes the ID:

```text
/invoices/101
```

and receives Bob's invoice.

### Diagnosis

Authentication works.

Routing works.

Parsing works.

The failure is:

```text
resource authorization
```

Correct model:

```text
authenticate Alice
        ↓
resolve invoice 101
        ↓
authorize Alice against invoice 101
        ↓
allow / deny
```

---

# 67. Production Scenario: Tenant Escape

Request:

```text
GET https://tenant-a.example.com/api/projects/123
```

Tenant resolution gives:

```text
Tenant A
```

but the database lookup only uses:

```text
projectId = 123
```

Project 123 belongs to Tenant B.

The system returns it.

Root cause:

```text
tenant context was resolved
but not enforced in resource access
```

Correct:

```text
tenant A
+
project 123
```

must form the authorization/data-access scope.

---

# 68. Production Scenario: Admin UI Bypass

The frontend hides:

```text
Delete User
```

for normal users.

But the API:

```text
DELETE /api/users/123
```

does not check authorization.

A user manually sends the request.

The operation succeeds.

Root cause:

```text
UI restriction
≠
server authorization
```

---

# 69. Production Scenario: Cache Leak

Alice requests:

```text
GET /api/dashboard
```

The response is cached.

Bob requests:

```text
GET /api/dashboard
```

and receives Alice's personalized dashboard.

Authentication was correctly implemented.

The failure occurred in:

```text
representation identity
+
cache architecture
```

This demonstrates that security cannot be reasoned about independently from caching.

---

# 70. Production Scenario: Expired Session

The browser believes:

```text
loggedIn = true
```

but the server session expired.

The browser sends:

```text
POST /api/orders
```

The server correctly responds:

```text
401
```

The client must then reconcile:

```text
client authentication state
        ↓
server authentication truth
```

This is why API clients should treat authentication failures as state transitions rather than unexpected exceptions.

---

# 71. SDE-2 Prediction Challenge

Consider:

```text
GET /api/documents/123
```

The user is authenticated.

The document exists.

The user does not own it.

What should the server evaluate?

Expected reasoning:

```text
authenticated principal
+
resource
+
authorization policy
```

The correct response depends on the application's information-disclosure policy, not simply on whether the user has a valid session.

---

# 72. SDE-2 Prediction Challenge

A user has:

```text
role = editor
```

but the resource is:

```text
archived
```

The user requests:

```text
PATCH /api/documents/123
```

Can the role alone determine authorization?

No.

The authorization decision may depend on:

```text
principal
+
action
+
resource state
```

---

# 73. SDE-2 Prediction Challenge

A middleware layer validates a session cookie.

The Route Handler performs:

```text
DELETE /api/users/123
```

without another authorization check.

Is the endpoint secure?

Not necessarily.

Middleware may establish authentication.

The operation still needs authorization.

---

# 74. SDE-2 Prediction Challenge

A request contains:

```json
{
  "userId": "bob"
}
```

while the authenticated principal is:

```text
Alice
```

The endpoint performs:

```text
deleteAccount(body.userId)
```

What is the security issue?

The API has confused:

```text
target identity
```

with:

```text
requesting identity
```

The authoritative requester identity should come from the authentication context.

---

# 75. SDE-2 Interview Questions

### Authentication

1. What is authentication?
2. What is authorization?
3. How would you authenticate a Route Handler?
4. What is a principal?
5. How do sessions differ from bearer tokens?
6. What should happen when a session expires?
7. How should authentication credentials be protected?

### Authorization

8. How would you design authorization for a multi-tenant API?
9. What is RBAC?
10. When is RBAC insufficient?
11. What is resource-based authorization?
12. How would you prevent IDOR?
13. Where should authorization checks live?
14. What does least privilege mean?
15. What does fail closed mean?

### HTTP

16. When should an API return 401?
17. When should it return 403?
18. Why shouldn't every authentication failure redirect to login?
19. When might a system intentionally return 404 instead of 403?

### Next.js

20. What belongs in middleware versus a Route Handler?
21. Why shouldn't middleware be the only authorization boundary?
22. How would you protect API routes differently from browser navigation?

### Multi-Tenant

23. How do tenant resolution and tenant authorization differ?
24. How would you prevent cross-tenant access?
25. How does tenant context affect database queries?
26. How does tenant context affect caching?

### Production

27. How would you debug an authorization failure?
28. How would you audit sensitive operations?
29. How would you handle service-to-service authentication?
30. How would you design authorization for batch operations?

---

# 76. Security Decision Matrix

A useful mental model is:

| Layer             | Question                            |
| ----------------- | ----------------------------------- |
| Routing           | Where should this request go?       |
| Authentication    | Who is calling?                     |
| Tenant resolution | Which application/customer context? |
| Authorization     | Is this caller allowed?             |
| Domain policy     | Is this operation valid?            |
| Persistence       | Can this state change safely?       |
| Caching           | Can this representation be shared?  |

Never substitute one layer for another.

---

# 77. Complete Security Pipeline

A production API can therefore be modeled as:

```text
                    HTTP Request
                         ↓
                  Route Resolution
                         ↓
                 Credential Extraction
                         ↓
                Credential Verification
                         ↓
                     Principal
                         ↓
                   Tenant Resolution
                         ↓
                 Resource Resolution
                         ↓
                    Authorization
                         ↓
                 Domain Validation
                         ↓
                Application Operation
                         ↓
                  Persistence
                         ↓
                  Response Mapping
                         ↓
                     HTTP Response
```

Each step establishes a different fact.

---

# 78. The Security Invariant

The most important invariant for this part is:

```text
No security-sensitive side effect
should occur before the server has established
the caller's identity and authorization.
```

And:

```text
No client-controlled value
should be treated as authoritative identity
or authorization state.
```

---

# 79. Core Mental Model

Compress the entire part to:

```text
Credential
    ↓
Authentication
    ↓
Principal
    ↓
Context
    ↓
Authorization
    ↓
Allowed Operation
```

Or:

```text
WHO
 ↓
WHERE
 ↓
WHAT
 ↓
CAN
 ↓
DO
```

Where:

```text
WHO  = authenticated principal
WHERE = tenant/resource context
WHAT = requested action/resource
CAN = authorization decision
DO = application operation
```

---

# 80. Critical Distinctions

Remember:

```text
Authentication ≠ Authorization

Credential ≠ Principal

Principal ≠ Permission

Role ≠ Ownership

Authentication ≠ Resource Access

Route Protection ≠ Operation Protection

Client State ≠ Server Security State

Tenant Resolution ≠ Tenant Authorization

Resource ID ≠ Permission

Middleware Authentication ≠ Complete Authorization

401 ≠ 403

UI Visibility ≠ Security

Session Presence ≠ Authorization

Authenticated ≠ Allowed
```

These distinctions are foundational to production API security.

---

# 81. Completion Checklist

You should be able to:

### Authentication

* [ ] Explain authentication
* [ ] Explain principals
* [ ] Resolve sessions
* [ ] Understand bearer credentials
* [ ] Handle expired credentials
* [ ] Handle revoked credentials
* [ ] Understand cookie security
* [ ] Distinguish credential from identity

### Authorization

* [ ] Implement role checks
* [ ] Implement permission checks
* [ ] Implement ownership checks
* [ ] Implement resource authorization
* [ ] Implement tenant authorization
* [ ] Handle resource state
* [ ] Handle batch authorization
* [ ] Apply least privilege
* [ ] Fail closed

### Next.js API security

* [ ] Understand middleware authentication
* [ ] Understand Route Handler authorization
* [ ] Protect APIs independently
* [ ] Distinguish browser redirects from API 401 responses
* [ ] Handle login redirect loops
* [ ] Handle return-to URLs safely

### Production security

* [ ] Prevent IDOR
* [ ] Prevent cross-tenant access
* [ ] Avoid client-controlled identity
* [ ] Protect personalized caches
* [ ] Audit sensitive operations
* [ ] Avoid credential leakage
* [ ] Reason about service-to-service authentication
* [ ] Reason about webhook authentication

### SDE-2 reasoning

* [ ] Identify authentication boundaries
* [ ] Identify authorization boundaries
* [ ] Model principal/resource/action/context
* [ ] Diagnose authorization bypasses
* [ ] Predict tenant isolation failures
* [ ] Predict cache/security interactions
* [ ] Defend authorization architecture in interviews

---

# 82. Part Boundary

### Part 01 — HTTP & Server Endpoint Mental Model

```text
HTTP protocol
request/response
server endpoints
HTTP semantics
```

### Part 02 — Next.js Route Handlers Fundamentals

```text
route.ts
HTTP methods
Route Handler structure
endpoint execution
```

### Part 03 — Request Parsing & Response Architecture

```text
request extraction
normalization
validation
trusted input
response DTOs
error contracts
HTTP response mapping
```

### Part 04 — API Authentication & Authorization

```text
credentials
sessions
tokens
principal
authentication
authorization
RBAC
permissions
resource ownership
tenant authorization
401 vs 403
security boundaries
```

### Part 05 — API Data Access & Business Logic Boundaries

Next:

```text
Route Handler
    ↓
Application Service
    ↓
Domain Logic
    ↓
Repository
    ↓
Database
```

The next part will focus on **where API business logic and data-access responsibilities belong**, including transaction boundaries, repositories, service-layer design, domain invariants, and avoiding fat Route Handlers.

---

# KPI 08 Progress

```text
Part 01  HTTP & Server Endpoint Mental Model          ✓
Part 02  Next.js Route Handlers Fundamentals         ✓
Part 03  Request Parsing & Response Architecture     ✓
Part 04  API Authentication & Authorization          ✓
Part 05  API Data Access & Business Logic Boundaries → NEXT
Part 06  API Error Contracts, Validation & Idempotency
Part 07  API Caching, Rate Limiting & Resilience
Part 08  BFF, Aggregation & External Integrations
Part 09  API Observability, Testing & Operations
Part 10  Production API Architecture Capstone
```

**Part 04 complete.**
