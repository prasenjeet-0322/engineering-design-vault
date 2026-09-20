# Level 08 — KPI 07 — Part 05

# Authorization Boundaries & Security

## 1. Purpose

Authentication answers:

> **Who is making this request?**

Authorization answers:

> **What is this authenticated principal allowed to do?**

These are fundamentally different questions.

A request can be:

```text
Authenticated = true
Authorization = false
```

For example:

```text
User A
   ↓
authenticated successfully
   ↓
requests Tenant B's billing page
   ↓
authentication succeeds
   ↓
authorization fails
```

The application must reject the operation.

This part establishes the authorization architecture required for production Next.js applications.

The governing model is:

```text
Request
   ↓
Identity
   ↓
Tenant / Resource Context
   ↓
Authorization Policy
   ↓
Allowed?
   ├── No → deny
   └── Yes
          ↓
      Continue
```

---

# 2. Authentication Is Not Authorization

Consider:

```ts
const session = await getSession();

if (!session) {
  redirect('/login');
}
```

This proves:

```text
there is a user
```

It does **not** prove:

```text
the user may access this resource
```

Suppose:

```text
session.user.id = 123
```

and the requested resource is:

```text
invoice.ownerId = 456
```

The user is authenticated.

But:

```text
123 !== 456
```

Therefore access should be denied unless another authorization rule permits it.

The distinction is:

```text
Authentication
    ↓
Identity establishment

Authorization
    ↓
Permission evaluation
```

---

# 3. The Authorization Boundary

An authorization boundary is the point at which the system decides:

```text
"this principal may perform this operation"
```

A robust architecture makes this boundary explicit.

Example:

```text
Request
   ↓
Authentication
   ↓
Authorization
   ↓
Business Operation
```

Not:

```text
Request
   ↓
Business Operation
   ↓
Maybe check permission later
```

The latter allows unauthorized work to occur before the security decision.

---

# 4. Principal

Authorization operates on a **principal**.

A principal can represent:

```text
User
Service
API Client
Machine Identity
System Role
```

For a normal SaaS application:

```text
principal
├── userId
├── tenantId
├── roles
├── permissions
└── authentication context
```

The authorization layer should consume an explicit principal rather than repeatedly reconstructing identity in arbitrary business logic.

Conceptually:

```ts
type Principal = {
  userId: string;
  tenantId: string;
  roles: string[];
};
```

The exact implementation can vary.

The architectural idea does not.

---

# 5. Resource

Authorization also requires a **resource**.

Examples:

```text
Project
Invoice
Document
Organization
Comment
Account
Dashboard
```

Authorization is often a relationship between:

```text
Principal
+
Action
+
Resource
```

For example:

```text
User 123
   ↓
update
   ↓
Project 789
```

The authorization decision is:

```text
Can User 123 update Project 789?
```

---

# 6. Action

Typical actions include:

```text
read
create
update
delete
publish
invite
manage
approve
export
```

Therefore an authorization request can be modeled as:

```text
authorize(
  principal,
  action,
  resource
)
```

Conceptually:

```text
authorize(
    User 123,
    "update",
    Project 789
)
```

returns:

```text
allowed
```

or:

```text
denied
```

---

# 7. RBAC

Role-Based Access Control assigns permissions through roles.

Example:

```text
Admin
Manager
Member
Viewer
```

Conceptually:

```text
Admin
 ├── read
 ├── create
 ├── update
 ├── delete
 └── manage-members

Manager
 ├── read
 ├── create
 └── update

Member
 ├── read
 └── create

Viewer
 └── read
```

RBAC is useful when permissions are naturally role-oriented.

However:

```text
role === authorization
```

is not always sufficient.

---

# 8. Resource Ownership

Suppose:

```text
User 123
```

owns:

```text
Document 456
```

Authorization can be:

```text
document.ownerId === principal.userId
```

This is an ownership rule.

It is more precise than:

```text
role === "member"
```

because two members can have different resource relationships.

---

# 9. Relationship-Based Authorization

A more complex application may use relationships.

Example:

```text
User
  ↓ member of
Organization
  ↓ owns
Project
  ↓ contains
Document
```

Authorization may depend on the entire relationship graph.

For example:

```text
Can user update document?
```

requires:

```text
user
  ↓
member of organization
  ↓
has project membership
  ↓
has edit permission
  ↓
document belongs to project
```

This is fundamentally different from checking one global role.

---

# 10. Multi-Tenant Authorization

Multi-tenancy introduces another security boundary.

Suppose:

```text
Tenant A
├── User 1
├── User 2
└── Projects

Tenant B
├── User 3
├── User 4
└── Projects
```

A request contains:

```text
userId = 1
tenantId = B
```

The application must not simply trust the URL:

```text
/acme/projects/123
```

The tenant must be resolved and verified.

Conceptually:

```text
Request
   ↓
Authenticate user
   ↓
Resolve tenant
   ↓
Verify membership
   ↓
Resolve resource
   ↓
Verify resource belongs to tenant
   ↓
Evaluate permission
```

---

# 11. Tenant Context Is Not Authorization

A common mistake is:

```text
tenantId = request.hostname
```

and then:

```text
query projects where tenantId = hostnameTenant
```

This establishes routing context.

It does not prove:

```text
current user belongs to tenant
```

The correct model is:

```text
Hostname
   ↓
Candidate Tenant

Authenticated User
   ↓
User Identity

Candidate Tenant + User Identity
   ↓
Membership Verification
```

Only then should tenant-scoped operations continue.

---

# 12. Never Trust Client-Supplied Authorization Context

A browser might submit:

```json
{
  "tenantId": "tenant-b",
  "role": "admin"
}
```

These are untrusted inputs.

The server must not treat them as authoritative.

Instead:

```text
Client Input
   ↓
Untrusted
   ↓
Server resolves identity
   ↓
Server resolves membership
   ↓
Server resolves permissions
```

The client may communicate intent.

It does not establish authority.

---

# 13. URL Parameters Are Not Permission Proof

Consider:

```text
/projects/123
```

The existence of project `123` in the URL does not mean:

```text
currentUser may access project 123
```

A route parameter identifies a resource.

It does not authorize access.

The flow must be:

```text
projectId = params.id
       ↓
load resource
       ↓
verify access
       ↓
return representation
```

---

# 14. The IDOR Problem

Insecure Direct Object Reference occurs when an application exposes a resource identifier without enforcing ownership or authorization.

Example:

```text
GET /api/invoices/100
```

User A changes:

```text
100 → 101
```

and receives User B's invoice.

The vulnerability is not that IDs are visible.

The vulnerability is:

```text
resource lookup
without authorization enforcement
```

The correct architecture is:

```text
resourceId
   ↓
resolve resource
   ↓
authorization check
   ↓
allow / deny
```

Or, where appropriate, encode the authorization constraint directly into the data query.

---

# 15. Authorization in Data Access

Consider:

```ts
const project = await db.project.findUnique({
  where: {
    id: projectId,
  },
});
```

This retrieves the resource.

But the authorization question remains:

```text
Does this user have access?
```

A safer conceptual pattern is:

```ts
const project = await db.project.findFirst({
  where: {
    id: projectId,
    tenantId: principal.tenantId,
  },
});
```

Then additionally enforce the user's permission.

The important architectural principle is:

> Authorization should constrain resource access as close to the protected data boundary as practical.

---

# 16. Query-Level Authorization

Suppose the user can only see projects in their tenant.

Instead of:

```text
fetch all projects
↓
filter in JavaScript
```

prefer:

```text
database query
    WHERE tenant_id = currentTenant
```

Conceptually:

```text
Unauthorized data
        ↓
should never unnecessarily cross
        ↓
the protected data boundary
```

This reduces:

```text
data exposure
memory usage
application filtering risk
```

and makes the security invariant easier to enforce.

---

# 17. Authorization Functions

A production application benefits from explicit authorization primitives.

Conceptually:

```ts
authorizeProjectAccess({
  principal,
  projectId,
});
```

or:

```ts
can({
  principal,
  action: 'update',
  resource: project,
});
```

The objective is not merely code reuse.

It is to centralize policy semantics.

Without this, authorization logic tends to become:

```text
page.tsx
api/route.ts
server-action.ts
worker.ts
component.tsx
```

with subtly different rules.

---

# 18. Policy Centralization

Imagine:

```text
Page:
if role === "admin"

API:
if role === "admin" || role === "manager"

Server Action:
if role !== "viewer"

Worker:
no check
```

The system now has inconsistent authorization.

A better model is:

```text
                Authorization Policy
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
        Page          API       Server Action
```

Each execution path asks the same policy questions.

---

# 19. Middleware Is Not the Final Authorization Boundary

Middleware is useful for:

```text
early request classification
authentication checks
tenant resolution
routing decisions
coarse access control
```

But it should not become the only authorization layer.

Why?

Because operations can be reached through:

```text
Page
API
Server Action
Route Handler
Background Job
Webhook
Internal Service
```

A middleware-only policy protects only the paths that actually pass through that middleware decision.

Business operations need their own security boundary.

---

# 20. Defense in Depth

A strong architecture can look like:

```text
                Request
                   ↓
              Middleware
                   ↓
          Authentication
                   ↓
           Tenant Resolution
                   ↓
          Route-Level Policy
                   ↓
         Business Authorization
                   ↓
            Data Boundary
```

Each layer addresses a different concern.

This is defense in depth.

---

# 21. Server Actions Must Authorize

A Server Action can be invoked from a legitimate UI.

That does not make the invocation trustworthy.

The action must independently verify:

```text
identity
+
authorization
+
input validity
```

Conceptually:

```text
Server Action
    ↓
resolve session
    ↓
verify permission
    ↓
validate input
    ↓
perform mutation
```

Never assume:

```text
"Only this button can call the action."
```

The server action is itself a security-sensitive entry point.

---

# 22. API Authorization

APIs require explicit authorization.

For example:

```text
GET /api/projects/123
```

requires:

```text
authenticated?
tenant member?
project accessible?
permission to read?
```

Likewise:

```text
DELETE /api/projects/123
```

requires:

```text
authenticated?
tenant member?
project accessible?
permission to delete?
```

Authentication alone is insufficient.

---

# 23. 401 vs 403

These statuses communicate different conditions.

### 401 Unauthorized

Typically means:

```text
No valid authentication context
```

Example:

```text
anonymous request
```

### 403 Forbidden

Typically means:

```text
Identity exists
but access is denied
```

Example:

```text
authenticated member
without required permission
```

Conceptually:

```text
No identity
    ↓
401

Identity exists
    ↓
Not permitted
    ↓
403
```

The exact API contract can vary, but the semantic distinction should be deliberate.

---

# 24. Redirect vs Authorization Failure

For browser navigation:

```text
unauthenticated
    ↓
redirect to login
```

For an API:

```text
unauthenticated
    ↓
401
```

For authenticated but unauthorized:

```text
authorization failure
    ↓
403
```

Do not blindly redirect every failure to `/login`.

Otherwise:

```text
authenticated user
   ↓
forbidden resource
   ↓
login page
```

creates incorrect semantics and poor debugging.

---

# 25. Role Checks vs Permission Checks

This:

```ts
if (user.role === 'admin')
```

may be adequate for simple systems.

But consider:

```text
Organization Admin
Project Admin
Billing Admin
Support Agent
Content Editor
```

A global role may not capture resource-specific authority.

Prefer policies that represent the actual business rule.

For example:

```text
canUpdateProject(user, project)
```

rather than:

```text
user.role === "admin"
```

when the latter is too coarse.

---

# 26. Avoid Permission Explosion

An authorization system can become:

```text
can_read_project
can_write_project
can_delete_project
can_publish_project
can_manage_project_members
can_export_project
...
```

This may be appropriate in a complex enterprise system.

But every permission introduces:

```text
policy complexity
testing requirements
administrative complexity
audit requirements
```

Design permissions around meaningful business capabilities rather than arbitrary UI controls.

---

# 27. UI Authorization vs Security Authorization

The UI can hide:

```text
Delete
```

when the user cannot delete.

That is useful.

But:

```text
button hidden
```

is not a security control.

The server must still enforce:

```text
canDelete(resource)
```

Therefore:

```text
UI authorization
    ↓
experience optimization

Server authorization
    ↓
security enforcement
```

---

# 28. The Client Is Not a Trust Boundary

Never trust:

```text
React state
localStorage
hidden inputs
disabled buttons
client-side role state
route visibility
```

as authorization mechanisms.

These can be modified or bypassed.

The authoritative security decision belongs on the server or another trusted execution boundary.

---

# 29. Hidden Inputs

Consider:

```html
<input type="hidden" name="role" value="admin" />
```

A malicious client can change:

```text
admin → superadmin
```

The server must derive role from trusted identity/context.

The hidden input can communicate data.

It cannot communicate authority.

---

# 30. Authorization and Caching

Caching creates an especially dangerous interaction.

Suppose:

```text
User A
   ↓
authorized representation
   ↓
shared cache
```

Then:

```text
User B
   ↓
same cache key
   ↓
receives User A representation
```

Authorization may never execute for User B because the cached representation was reused before reaching the application logic.

Therefore:

> Authorization boundaries and cache boundaries must agree.

Personalized or authorization-sensitive representations require appropriate cache identity and isolation.

---

# 31. Authorization and Rendering

Consider a Server Component:

```text
Page
 ↓
resolve session
 ↓
check permission
 ↓
render protected data
```

This is useful for server-rendered navigation.

But do not assume:

```text
page authorization
=
all backend authorization
```

The same business capability might be invoked through:

```text
Server Action
API
background task
```

Each execution path needs enforcement.

---

# 32. Nested Authorization Boundaries

A large application can have:

```text
/app
  /dashboard
  /projects
  /billing
  /admin
```

Different areas may have different requirements.

Conceptually:

```text
Application
   │
   ├── Authenticated
   │
   ├── Tenant Member
   │
   ├── Project Member
   │
   └── Organization Admin
```

Authorization boundaries should follow business capability boundaries rather than simply route depth.

---

# 33. Privilege Escalation

Privilege escalation occurs when a principal gains authority they should not have.

Examples:

```text
member → admin
project member → organization owner
tenant user → another tenant
```

Potential causes include:

```text
trusted client input
missing authorization check
stale role data
incorrect cache identity
insecure mutation
```

Every privilege-changing operation deserves explicit authorization.

---

# 34. Role Changes and Session Staleness

Suppose:

```text
User = Admin
```

and then an administrator changes:

```text
Admin → Member
```

If the session contains cached authorization state:

```text
session.role = admin
```

the system may temporarily believe the user still has elevated privileges.

This creates a policy freshness problem.

The architecture must define:

```text
Where is authorization state sourced?
How fresh must it be?
When are sessions invalidated?
```

For high-risk permissions, stale authorization information may be unacceptable.

---

# 35. Reauthentication for Sensitive Operations

Some operations may require stronger assurance than ordinary navigation.

Examples:

```text
change password
change payment details
rotate credentials
delete organization
export sensitive data
change security settings
```

The architecture may require:

```text
authenticated
+
authorized
+
recent authentication
```

This is an authentication-strength requirement layered onto authorization.

---

# 36. Resource Ownership Checks

Consider:

```text
PATCH /projects/123
```

The authorization logic might be:

```text
1. Resolve current user
2. Resolve project
3. Verify project belongs to tenant
4. Verify user belongs to tenant
5. Verify user can update projects
6. Perform mutation
```

The sequence matters.

Do not allow a resource mutation to occur before the authorization decision.

---

# 37. Avoid Check-Then-Use Races

Consider:

```text
check permission
     ↓
wait
     ↓
perform mutation
```

If the relevant authorization state changes between the check and mutation, the system may have a race.

For sensitive operations, authorization and mutation should be designed with the underlying transaction and concurrency model in mind.

The broader principle is:

> A security decision must remain valid for the operation it authorizes.

---

# 38. Authorization and Database Transactions

For sensitive mutations:

```text
authorization
+
resource state
+
mutation
```

may need transactional coordination.

Example:

```text
User can delete project
only while they remain an organization admin.
```

If membership changes concurrently, the system must decide how to preserve the security invariant.

This is where authorization becomes distributed systems and database concurrency, not merely conditional logic.

---

# 39. Error Handling

Authorization failures should not expose unnecessary information.

Compare:

```text
"Project 123 exists but you are not allowed to access it."
```

with:

```text
"Resource unavailable."
```

Depending on the threat model, distinguishing:

```text
resource does not exist
```

from:

```text
resource exists but is forbidden
```

can leak information.

The API contract should deliberately decide how much resource existence is exposed.

---

# 40. Enumeration Resistance

Suppose:

```text
GET /users/100
GET /users/101
GET /users/102
```

reveals:

```text
404 → user doesn't exist
403 → user exists
```

An attacker may enumerate valid users.

For sensitive resources, the system may intentionally make unauthorized resources appear nonexistent.

This is not a universal rule.

It is a threat-model decision.

---

# 41. Auditability

Authorization decisions can be security-relevant events.

For sensitive operations, record enough information to answer:

```text
Who attempted the operation?
What resource?
What action?
When?
What authorization decision?
What tenant?
What request/correlation ID?
```

For example:

```text
user=123
tenant=456
action=delete_project
resource=789
decision=deny
reason=missing_permission
```

Avoid logging sensitive payloads unnecessarily.

---

# 42. Authorization Observability

When a legitimate user receives:

```text
403
```

the engineering team should be able to determine:

```text
Which policy was evaluated?
Which principal?
Which resource?
Which permission?
Which condition failed?
```

Otherwise authorization bugs become extremely difficult to diagnose.

Useful telemetry includes:

```text
authorization decision
policy identifier
resource type
action
tenant
principal identifier
decision reason
correlation ID
```

Sensitive data should be appropriately redacted.

---

# 43. Middleware + Authorization Architecture

The complete request flow now becomes:

```text
                   Request
                      │
                      ▼
              ┌───────────────┐
              │   Middleware  │
              └───────┬───────┘
                      │
                      ▼
              Authentication
                      │
                      ▼
               Tenant Context
                      │
                      ▼
              Route Classification
                      │
                      ▼
            Authorization Policy
                      │
              ┌───────┴───────┐
              │               │
            Deny             Allow
              │               │
              ▼               ▼
         401 / 403       Business Logic
                              │
                              ▼
                         Data Access
                              │
                              ▼
                         Cache/Render
```

The critical property is:

```text
cache/rendering
```

must not accidentally bypass:

```text
authorization
```

---

# 44. Secure Request Invariant

A useful invariant is:

```text
No protected operation
may execute
unless the principal
has been authorized
for that operation.
```

This sounds simple.

The difficulty is ensuring the invariant across every execution path.

You must consider:

```text
Pages
API routes
Server Actions
Route handlers
Background jobs
Cron tasks
Webhooks
Internal service calls
```

---

# 45. Authorization Decision Matrix

For a SaaS application:

| Requester          | Resource                  | Action | Expected Decision |
| ------------------ | ------------------------- | ------ | ----------------- |
| Anonymous          | Public page               | Read   | Allow             |
| Anonymous          | Private page              | Read   | Deny              |
| Tenant member      | Own project               | Read   | Allow             |
| Tenant member      | Other tenant project      | Read   | Deny              |
| Viewer             | Project                   | Update | Deny              |
| Editor             | Project                   | Update | Allow             |
| Manager            | Member management         | Invite | Allow             |
| Member             | Member management         | Invite | Depends on policy |
| Admin              | Billing                   | Manage | Allow             |
| Authenticated user | Other user's private data | Read   | Deny              |

The actual policy is product-specific.

The important requirement is that every action/resource combination has a deliberate policy.

---

# 46. Common Anti-Patterns

## Anti-Pattern 1 — "The User Is Logged In"

Authentication is not permission.

---

## Anti-Pattern 2 — Client-Only Authorization

Hiding UI controls does not secure the backend.

---

## Anti-Pattern 3 — Middleware-Only Authorization

Other execution paths can bypass route middleware.

---

## Anti-Pattern 4 — Trusting Role From Request

Client-provided roles are untrusted.

---

## Anti-Pattern 5 — URL-Based Authorization

A route parameter identifies a resource; it does not establish permission.

---

## Anti-Pattern 6 — Global Role for Every Policy

Resource-specific authorization often requires ownership or relationship checks.

---

## Anti-Pattern 7 — Authorization After Cache Retrieval

A shared cached response may bypass the intended authorization path.

---

## Anti-Pattern 8 — Inconsistent Policies

Page, API, and Server Action implementations disagree about who is allowed.

---

## Anti-Pattern 9 — Returning Detailed Authorization Errors

Error messages can unintentionally disclose resource existence or security-sensitive information.

---

# 47. Prediction Challenge 1

Suppose:

```text
User A
tenant = A
```

requests:

```text
/projects/999
```

where:

```text
project.tenantId = B
```

What should happen?

### Expected reasoning

The request must fail tenant authorization.

The important invariant is:

```text
principal.tenantId
=
resource.tenantId
```

unless the business policy explicitly supports cross-tenant access.

---

# 48. Prediction Challenge 2

A user cannot see the Delete button.

They call:

```text
Server Action → deleteProject()
```

directly.

What should happen?

### Expected reasoning

The Server Action must independently authorize the mutation.

UI visibility is not a security boundary.

---

# 49. Prediction Challenge 3

Middleware checks:

```text
user.isAuthenticated
```

and allows:

```text
/api/projects/123
```

The route handler performs no authorization.

What is the vulnerability?

### Expected reasoning

The middleware established identity.

It did not establish permission to access project `123`.

The resource authorization boundary is missing.

---

# 50. Prediction Challenge 4

Two users receive the same cached dashboard because the cache key is:

```text
dashboard:tenant-123
```

but the dashboard contains user-specific notifications.

What failed?

### Expected reasoning

The representation's cache identity does not include all relevant personalization dimensions.

The cache boundary is broader than the authorization/reuse boundary.

---

# 51. Prediction Challenge 5

A user changes:

```text
/organization/acme
```

to:

```text
/organization/other-company
```

and sees the other organization's dashboard.

What should you investigate?

### Expected reasoning

Investigate:

```text
hostname/route tenant resolution
+
membership verification
+
resource authorization
+
cache identity
```

The URL itself must never be treated as proof of membership.

---

# 52. SDE-2 Interview Questions

You should be able to explain:

### "Where should authorization happen?"

Strong reasoning:

```text
coarse request-level checks
        +
business-operation authorization
        +
data-access constraints
```

No single layer should be assumed to protect every execution path.

---

### "Why isn't middleware enough?"

Because business operations may be invoked through:

```text
API
Server Action
background job
internal service
```

and because middleware often performs coarse request classification rather than complete resource-level policy evaluation.

---

### "How do you handle multi-tenant authorization?"

Explain:

```text
authenticate user
→ resolve tenant
→ verify membership
→ resolve resource
→ verify resource tenant
→ evaluate permission
```

---

### "How do you prevent IDOR?"

Explain:

```text
resource lookup
+
authorization against the authenticated principal
+
tenant/resource constraints
```

rather than relying on opaque IDs alone.

---

### "What is the difference between role-based and resource-based authorization?"

RBAC answers:

```text
What can this role generally do?
```

Resource authorization answers:

```text
Can this principal perform this action on this particular resource?
```

Production systems often combine both.

---

# 53. Production Authorization Architecture

A mature system can be modeled as:

```text
                    Principal
                       │
                       ▼
                Authentication
                       │
                       ▼
                 Tenant Context
                       │
                       ▼
                   Resource
                       │
                       ▼
                    Action
                       │
                       ▼
                Policy Evaluation
                       │
             ┌─────────┴─────────┐
             │                   │
           Deny                 Allow
             │                   │
             ▼                   ▼
          401/403           Business Logic
                                 │
                                 ▼
                            Data Boundary
                                 │
                                 ▼
                         Cache / Rendering
```

The policy decision is explicit.

---

# 54. Authorization as a Function

A useful abstraction is:

```text
Decision = Policy(
    Principal,
    Action,
    Resource,
    Context
)
```

Where context can include:

```text
tenant
time
request origin
authentication strength
resource state
organization membership
feature configuration
```

This gives you a more powerful mental model than:

```text
if (role === 'admin')
```

---

# 55. Security Invariants

A senior engineer should define invariants.

### Tenant Isolation

```text
A principal cannot access resources belonging to a tenant
unless an explicit cross-tenant policy permits it.
```

### Operation Authorization

```text
Every protected mutation has an authorization decision
before execution.
```

### Client Untrustworthiness

```text
Client-provided role/permission state is never authoritative.
```

### Cache Isolation

```text
A representation cannot be shared beyond its authorization scope.
```

### Consistent Policy

```text
Equivalent business operations use equivalent authorization rules
across execution paths.
```

These invariants are more valuable than memorizing individual checks.

---

# 56. Testing Strategy

Authorization requires negative testing.

Do not test only:

```text
admin can delete
```

Also test:

```text
anonymous cannot delete
member cannot delete
viewer cannot update
wrong tenant cannot read
wrong owner cannot update
expired session cannot mutate
revoked role cannot perform privileged operation
```

A good authorization test matrix includes:

```text
principal
+
tenant
+
resource
+
action
+
expected decision
```

---

# 57. Property-Based Security Thinking

Instead of testing only individual examples, test invariants.

For example:

```text
For every tenant T:
A user not belonging to T must not access T's protected resources.
```

Or:

```text
For every protected mutation:
no successful state transition may occur without authorization.
```

These are stronger than individual test cases.

---

# 58. Authorization and Logging

Security-sensitive actions should be auditable.

For example:

```text
2026-09-17
user=123
tenant=456
action=delete_project
resource=789
decision=deny
policy=project.delete
```

This enables:

```text
security investigations
incident response
debugging
compliance auditing
```

But avoid storing unnecessary sensitive information.

---

# 59. Authorization and Cache Invalidation

Authorization changes can themselves affect cached representations.

Example:

```text
User promoted to Admin
```

may change:

```text
navigation
admin controls
dashboard widgets
available operations
```

Or:

```text
User removed from tenant
```

should invalidate or prevent reuse of tenant-sensitive representations.

Therefore authorization state can be a cache dependency.

Conceptually:

```text
Membership change
      ↓
Authorization state changes
      ↓
Invalidate affected representations
```

---

# 60. Authorization + Routing + Caching

The complete architecture now becomes:

```text
Request
   ↓
Middleware
   ↓
Authentication
   ↓
Tenant Resolution
   ↓
Authorization
   ↓
Routing
   ↓
Cache Identity
   ↓
Rendering
   ↓
Response
```

But for mutations:

```text
Request
   ↓
Authentication
   ↓
Authorization
   ↓
Validation
   ↓
Mutation
   ↓
Cache Invalidation
   ↓
UI Synchronization
```

This connects KPI 07 with the caching architecture from KPI 06.

---

# 61. The Core Senior-Level Principle

Never ask only:

> "Is the user logged in?"

Ask:

```text
Who is the principal?
        ↓
Which tenant/context?
        ↓
Which resource?
        ↓
Which action?
        ↓
Which policy?
        ↓
Is access allowed?
        ↓
Which execution path performs the operation?
        ↓
Could caching bypass this decision?
```

That is the authorization mindset expected at SDE-2 level.

---

# 62. Completion Checklist

You should now be able to:

* distinguish authentication from authorization,
* model a principal,
* identify protected resources,
* model actions,
* understand RBAC,
* understand resource ownership,
* reason about relationship-based authorization,
* enforce tenant isolation,
* reject client-supplied authority,
* prevent IDOR,
* enforce authorization near the data boundary,
* centralize authorization policy,
* distinguish middleware authorization from business authorization,
* secure Server Actions,
* secure APIs,
* distinguish 401 from 403,
* design role and resource-based policies,
* reason about privilege escalation,
* handle stale authorization state,
* identify reauthentication requirements,
* reason about authorization/cache interactions,
* design authorization observability,
* create negative authorization tests,
* define security invariants,
* and defend the architecture in an SDE-2 interview.

---

# 63. Part Boundary

This part establishes:

```text
Authorization
+
Resource Access
+
Tenant Isolation
+
Policy Enforcement
+
Security Boundaries
```

It does **not** yet deeply cover:

```text
multi-tenant routing models
locale routing
host-based routing
```

Those belong to **KPI 07 — Part 06**.

Part 06 will therefore build on this security model and address how routing context itself can vary by:

```text
tenant
host
locale
domain
subdomain
request origin
```

The architectural progression remains:

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

**KPI 07 Part 05 is complete.**
