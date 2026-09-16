# Level 08 — KPI 04 — Part 07

# Security and Authorization in Server Actions

## 1. Part Objective

The previous parts established the complete Server Action mutation lifecycle:

```text
Part 01
Mutation paradigm
        ↓
Part 02
Defining and invoking actions
        ↓
Part 03
FormData and validation
        ↓
Part 04
Pending state
        ↓
Part 05
Action result state
        ↓
Part 06
Optimistic UI
```

There is now one question that must be answered before this mutation architecture can be considered production-safe:

> **Who is allowed to invoke this mutation, and what are they allowed to mutate?**

Server Actions execute on the server, but **server execution does not automatically mean authorization**.

A Server Action must be treated as a security boundary.

The objective of this part is to understand:

* why every Server Action must be treated as externally invokable
* authentication vs authorization
* authorization inside the action
* why client-side permission checks are insufficient
* ownership checks
* role and permission checks
* input validation vs authorization
* closure-related risks
* CSRF considerations
* sensitive data handling
* security boundaries between UI and server
* secure mutation architecture

---

# 2. Governing Question

The governing question is:

> **Can this caller perform this mutation on this specific resource, and where is that decision enforced?**

This is the key mental model:

```text
UI visibility
      ≠
authorization
```

And:

```text
Server execution
      ≠
automatic permission
```

The authoritative authorization decision must happen on the server.

---

# 3. The Most Important Rule

Treat every Server Action as if it were a publicly reachable API endpoint.

That means you should reason about:

```text
id="3xq7zv"
Who can call it?
What arguments can they provide?
What resources can they target?
What permissions do they have?
What data can they cause the server to modify?
What information can the action return?
```

Even though the developer experience may look like:

```tsx
await updateProject(data);
```

the architectural reality is:

```text
Browser
   ↓
network boundary
   ↓
Server Action
   ↓
server execution
```

Therefore the action must establish trust independently.

---

# 4. The Client Is Not a Trust Boundary

Consider:

```tsx
if (user.role === "admin") {
  return <DeleteButton />;
}
```

This is useful for UX.

It is not sufficient security.

A malicious client can potentially:

```text
hide UI restrictions
modify requests
invoke endpoints directly
alter submitted values
attempt unauthorized mutations
```

Therefore:

```text
Client-side permission check
        ↓
UX control
```

while:

```text
Server-side authorization check
        ↓
Security boundary
```

The server must assume the client may be malicious.

---

# 5. Authentication vs Authorization

These concepts must be separated.

## Authentication

Answers:

> **Who is this user?**

Example:

```text
userId = 42
```

## Authorization

Answers:

> **Is user 42 allowed to perform this operation?**

Example:

```text
user 42
    ↓
edit project 9001?
    ↓
yes / no
```

Therefore:

```text
Authentication
    ↓
identity

Authorization
    ↓
permission
```

Having a valid identity does not imply permission to perform every action.

---

# 6. Basic Secure Action Architecture

A secure mutation generally follows:

```text
Request
   ↓
Authenticate
   ↓
Authorize
   ↓
Validate input
   ↓
Normalize data
   ↓
Execute mutation
   ↓
Return safe result
```

Conceptually:

```tsx
async function updateProject(previousState, formData) {
  const user = await requireUser();

  if (!user) {
    return unauthorizedResult();
  }

  const input = validateInput(formData);

  const project = await getProject(input.id);

  if (!canEditProject(user, project)) {
    return forbiddenResult();
  }

  await updateProjectInDatabase(input);

  return successResult();
}
```

The exact ordering can vary based on the application, but the security decision must occur before the protected mutation.

---

# 7. Why Authentication Must Be Rechecked Inside the Action

Suppose the page renders:

```text
Current user = Alice
```

The UI shows:

```text
Edit Project
```

The user then invokes the Server Action.

You cannot safely assume:

```text
UI says Alice
      ↓
Server assumes Alice
```

The action must derive the identity from a trusted server-side authentication mechanism.

Conceptually:

```text
Request
   ↓
server authentication context
   ↓
authenticated identity
   ↓
authorization
```

Never trust:

```text
formData.get("userId")
```

as proof of identity.

---

# 8. Never Trust Client-Supplied Identity

Consider this dangerous pattern:

```tsx
<form action={updateProject}>
  <input
    type="hidden"
    name="userId"
    value={currentUser.id}
  />
</form>
```

The hidden input is not a security mechanism.

A malicious caller can attempt:

```text
userId = another-user
```

Therefore:

```text
hidden input
      ≠
trusted identity
```

The server should derive the authenticated user from its trusted authentication context.

---

# 9. Authorization Must Consider the Resource

Authorization is often not simply:

```text
role === "admin"
```

It may depend on the specific resource.

Suppose:

```text
User A owns Project 1
User B owns Project 2
```

User A requests:

```text
update Project 2
```

The server must evaluate:

```text
Can User A modify Project 2?
```

not merely:

```text
Is User A authenticated?
```

This is resource-level authorization.

---

# 10. Ownership Checks

A common pattern:

```text
authenticatedUserId
        ↓
project.ownerId
        ↓
compare
```

Conceptually:

```tsx
if (project.ownerId !== user.id) {
  return forbidden();
}
```

But production systems often have more sophisticated rules:

```text
owner
organization member
project editor
project viewer
administrator
service account
```

The important principle is:

> **Authorization must be evaluated against the actual resource being mutated.**

---

# 11. Role-Based Authorization

One common model is RBAC:

```text
Role-Based Access Control
```

For example:

```text
viewer
editor
admin
```

Permissions might be:

```text
viewer → read
editor → read + update
admin → read + update + delete
```

The action can enforce:

```text
required permission
        ↓
current user's permissions
        ↓
allow / deny
```

But role checks alone may not be sufficient when authorization depends on resource ownership or organization membership.

---

# 12. Permission-Based Authorization

Instead of:

```text
user.role === "admin"
```

the application can reason in terms of permissions:

```text
project:read
project:update
project:delete
```

Then:

```text
Can user perform project:update?
```

This can make authorization logic more composable.

The architecture becomes:

```text
Identity
   ↓
permissions
   ↓
resource
   ↓
decision
```

---

# 13. Organization / Tenant Boundaries

In multi-tenant systems, authorization often requires checking organization boundaries.

Suppose:

```text
Organization A
 ├── Project 1
 └── Project 2

Organization B
 └── Project 3
```

A user from Organization A should not be able to mutate:

```text
Project 3
```

simply because they know its ID.

Therefore authorization may require:

```text
user.organizationId
        =
project.organizationId
```

plus a permission check.

This prevents cross-tenant data access.

---

# 14. Object-Level Authorization

A particularly important security category is:

> **Object-level authorization**

The server must determine whether the authenticated principal can access the specific object identified by the request.

For example:

```text
PATCH /project/9001
```

or conceptually:

```text
updateProject(9001)
```

does not mean:

```text
user can update 9001
```

The server must verify it.

This protects against patterns where attackers change:

```text
resourceId = 9001
```

to:

```text
resourceId = 9002
```

and access another user's resource.

---

# 15. Validation Is Not Authorization

These are frequently confused.

Suppose:

```text
projectId = 9001
```

passes schema validation.

That proves:

```text
9001 is a valid project ID
```

It does **not** prove:

```text
the current user is allowed to modify project 9001
```

Therefore:

```text
Validation
    ↓
Is the input structurally valid?

Authorization
    ↓
Is this operation allowed?
```

Both are necessary.

---

# 16. Sanitization Is Not Authorization

Similarly:

```text
sanitize(input)
```

does not determine whether the user is allowed to perform the operation.

A perfectly sanitized request can still be unauthorized.

Therefore:

```text
Normalization
Validation
Authorization
```

are distinct concerns.

---

# 17. Security Pipeline

A useful mental model is:

```text
                 Incoming request
                        │
                        ▼
                  Authentication
                        │
                        ▼
                    Identity
                        │
                        ▼
                 Input validation
                        │
                        ▼
                  Resource lookup
                        │
                        ▼
                   Authorization
                        │
                        ▼
                    Mutation
                        │
                        ▼
                 Safe response
```

Depending on the application, validation and authorization may be reordered or combined strategically, but the conceptual responsibilities must remain separate.

---

# 18. Authorization Should Happen Close to the Mutation

A dangerous architecture is:

```text
Page
 ↓
permission check
 ↓
Server Action
 ↓
database mutation
```

where the action itself assumes authorization already happened.

Why?

Because the Server Action can potentially be invoked independently of the page.

A safer architecture is:

```text
Server Action
    ↓
authenticate
    ↓
authorize
    ↓
mutate
```

The mutation boundary itself protects the resource.

---

# 19. Reusable Authorization Functions

Do not duplicate complex permission logic everywhere.

For example:

```tsx
function canEditProject(user, project) {
  return (
    project.ownerId === user.id ||
    user.permissions.includes("project:update")
  );
}
```

Then:

```tsx
async function updateProject(previousState, formData) {
  const user = await requireUser();

  const project = await getProject(...);

  if (!canEditProject(user, project)) {
    return forbidden();
  }

  // mutation
}
```

This makes authorization rules:

```text
centralized
testable
reviewable
consistent
```

---

# 20. Server Actions Are Not Automatically Secure

A common misconception is:

> “It has `'use server'`, so users cannot call it directly.”

That is the wrong mental model.

`'use server'` establishes server execution semantics.

It does not mean:

```text
authenticated
authorized
safe
```

Therefore:

```text
'use server'
    ≠
security policy
```

Security still needs to be explicitly designed.

---

# 21. Closures and Captured Values

Inline Server Actions can capture values from their surrounding scope.

Conceptually:

```tsx
const userId = ...

async function update() {
  "use server";

  // uses userId
}
```

Captured values deserve careful security reasoning.

The important question is:

> **What data crosses the server/client boundary as part of the action's invocation mechanism, and could any captured value expose information that should not be exposed?**

Do not casually capture:

```text
secrets
private tokens
sensitive credentials
internal data
```

into action definitions.

---

# 22. Why Closures Need Care

A closure can make code look local:

```text
function component() {
  const sensitiveValue = ...

  async function action() {
    "use server";
    ...
  }
}
```

But the action is still a server-invokable operation.

Therefore the mental model must remain:

```text
Looks local
      ≠
Only local
```

The boundary is still networked.

This is particularly important when reviewing Server Actions for data leakage.

---

# 23. Do Not Trust Authorization UI

Suppose the UI does:

```tsx
{user.canDelete && (
  <DeleteButton />
)}
```

This is good UX.

But the action must still enforce:

```text
canDelete(user, resource)
```

because:

```text
attacker
   ↓
bypasses UI
   ↓
invokes mutation
```

The server must reject it.

---

# 24. Hidden Fields Are User Input

Consider:

```tsx
<input
  type="hidden"
  name="role"
  value="editor"
/>
```

Do not treat this as trusted.

The user can potentially alter:

```text
role = admin
```

The same applies to:

```text
userId
organizationId
ownerId
price
permissions
isAdmin
```

Anything submitted by the browser is untrusted input.

---

# 25. Authorization Must Not Depend on Client-Controlled Flags

Avoid:

```tsx
formData.get("isAdmin")
```

as a permission source.

Likewise:

```text
isOwner
canDelete
canEdit
role
organizationId
```

should not be accepted blindly from the client.

Instead:

```text
trusted identity
      ↓
server lookup
      ↓
server authorization decision
```

---

# 26. CSRF Considerations

Server Actions perform state-changing operations.

Therefore request-forgery protections matter.

A CSRF attack conceptually looks like:

```text
Attacker-controlled site
        ↓
causes victim's browser
        ↓
to submit authenticated request
        ↓
to target application
```

Modern frameworks can provide protections around Server Action requests, but the application should still understand the security model rather than assuming:

```text
framework feature
     =
complete application security
```

You should understand:

```text
same-origin protections
request validation
authentication cookies
CSRF tokens where applicable
browser credential behavior
```

The key principle is:

> **State-changing operations require explicit request-forgery considerations.**

---

# 27. Authentication Cookies Are Not Permission

Suppose a browser automatically sends:

```text
session cookie
```

The server can determine:

```text
this request belongs to Alice
```

But that still does not answer:

```text
Can Alice delete Project 9001?
```

Therefore:

```text
Session
  ↓
Authentication

Permission evaluation
  ↓
Authorization
```

Both layers matter.

---

# 28. Safe Error Messages

Security-sensitive actions should avoid leaking internal information.

Bad:

```text
Database query failed:
SELECT * FROM projects WHERE ...
```

or:

```text
Project 9001 belongs to another organization.
```

depending on the application's threat model.

Prefer safe application-level messages:

```text
You are not authorized to perform this action.
```

while detailed information goes to server-side logs/observability.

---

# 29. Avoid User Enumeration

Authentication-related mutations can accidentally reveal whether an account exists.

For example:

```text
Email does not exist.
```

may allow attackers to enumerate users.

Depending on the workflow, a safer response may be deliberately generic:

```text
If the account is eligible, further instructions will be provided.
```

The broader lesson:

> **Action results should communicate enough for legitimate UX without unnecessarily revealing security-sensitive state.**

---

# 30. Rate Limiting and Abuse

Authorization is not the only security concern.

A Server Action may also need protection against:

```text
rapid repeated mutations
automation
resource exhaustion
spam
credential abuse
expensive operations
```

For example:

```text
sendInvite()
```

may be authorized but still abused.

Security architecture may therefore include:

```text
authentication
authorization
rate limiting
quotas
abuse detection
```

These are distinct controls.

---

# 31. Authorization vs Business Rules

Suppose a user is allowed to edit a project.

But the project is currently:

```text
archived
```

The user may still be unauthorized to perform **that specific transition**.

This demonstrates:

```text
Authorization
    +
Business state rules
```

Example:

```text
Can user edit project?
       ↓
yes

Can project currently be edited?
       ↓
no
```

A mature mutation architecture evaluates both.

---

# 32. Secure Mutation Example

Consider:

```tsx
async function updateProject(previousState, formData) {
  const user = await requireUser();

  const parsed = schema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Invalid input.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const project = await getProject(parsed.data.id);

  if (!project) {
    return {
      status: "error",
      message: "Project not found.",
      errors: {},
    };
  }

  if (!canEditProject(user, project)) {
    return {
      status: "error",
      message: "You are not authorized to perform this action.",
      errors: {},
    };
  }

  await updateProjectInDatabase(
    project.id,
    parsed.data.name
  );

  return {
    status: "success",
    message: "Project updated.",
    errors: {},
  };
}
```

The important sequence is:

```text
authenticate
      ↓
validate
      ↓
load resource
      ↓
authorize
      ↓
mutate
      ↓
safe result
```

---

# 33. Database-Level Defense

Application-level authorization is essential, but defense in depth can also exist at the data layer.

Depending on the database and architecture, systems may use:

```text
row-level security
database roles
tenant constraints
foreign keys
unique constraints
transactions
```

For example:

```text
Application
    ↓
authorization
    ↓
Database
    ↓
additional integrity/security guarantees
```

This is particularly valuable in multi-tenant systems.

---

# 34. Server Action Security Boundary

A strong architecture separates responsibilities:

```text
┌───────────────────────────────┐
│            Client             │
│                               │
│ UX                           │
│ forms                        │
│ optimistic state             │
│ pending state                │
└───────────────┬───────────────┘
                │
          untrusted input
                │
                ▼
┌───────────────────────────────┐
│        Server Action          │
│                               │
│ authenticate                 │
│ validate                     │
│ authorize                    │
│ business rules               │
│ mutate                       │
│ return safe result           │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│        Data / Services        │
│                               │
│ database                     │
│ external APIs                │
│ transactions                 │
└───────────────────────────────┘
```

The client should be considered untrusted.

The Server Action is where the trust decision is established.

---

# 35. Security Review Checklist

For every Server Action, ask:

### Identity

* [ ] How is the current user identified?
* [ ] Is identity derived from a trusted server-side source?
* [ ] Is client-provided identity ignored?

### Authorization

* [ ] Is permission checked inside the action?
* [ ] Is the specific resource checked?
* [ ] Are tenant/organization boundaries enforced?
* [ ] Are role/permission rules centralized?

### Input

* [ ] Is all input treated as untrusted?
* [ ] Are hidden fields treated as untrusted?
* [ ] Are IDs validated?
* [ ] Are business constraints enforced server-side?

### Output

* [ ] Is returned state serializable?
* [ ] Does it expose sensitive data?
* [ ] Are internal errors hidden?
* [ ] Could responses enable user/resource enumeration?

### Mutation

* [ ] Is the operation idempotent where appropriate?
* [ ] Is duplicate submission safe?
* [ ] Are destructive operations protected?
* [ ] Are rate limits or quotas necessary?

### Request security

* [ ] Are CSRF/request-forgery considerations understood?
* [ ] Are authentication credentials handled safely?

---

# 36. Common Mistakes

## Mistake 1 — Relying on hidden inputs

```text
hidden userId
hidden role
hidden organizationId
```

These are still user-controlled values.

---

## Mistake 2 — Checking permissions only in the UI

The UI is not a security boundary.

---

## Mistake 3 — Assuming `'use server'` means authorization

It does not.

---

## Mistake 4 — Trusting client-side validation

Client validation improves UX.

Server validation is authoritative.

---

## Mistake 5 — Validating input but not authorization

```text
valid ID
    ≠
authorized access
```

---

## Mistake 6 — Checking role but not resource ownership

```text
editor
    ≠
editor of this resource
```

---

## Mistake 7 — Returning sensitive error details

Internal implementation details should not become client-visible action state.

---

## Mistake 8 — Putting security decisions only in middleware

Middleware can be useful for broad request concerns, but resource-level authorization often belongs close to the mutation and resource being accessed.

---

# 37. SDE-2 Interview Question

### Question

> “If a Server Action can only execute on the server, why do you still need authorization?”

### Strong answer

Because server execution only determines **where the code runs**, not **who is allowed to invoke the operation**. A Server Action is still a network-accessible mutation boundary, so it should authenticate the caller and authorize the requested operation against the target resource before performing the mutation.

---

# 38. SDE-2 Interview Question

> “Why can't I trust a hidden `userId` field?”

Because everything submitted by the browser is user-controlled. A hidden field is only hidden from the normal UI; it is not protected from modification. The server should derive identity from its trusted authentication context.

---

# 39. SDE-2 Interview Question

> “What's the difference between authentication and authorization?”

A concise answer:

```text
Authentication
→ Who are you?

Authorization
→ What are you allowed to do?
```

For resource mutations:

```text
Who are you?
     +
Can you perform this operation
on this specific resource?
```

---

# 40. Prediction Challenge

Suppose:

```tsx
<form action={deleteProject}>
  <input
    type="hidden"
    name="projectId"
    value="9001"
  />
</form>
```

The UI only renders this button for project owners.

An attacker modifies the request:

```text
projectId = 9002
```

What prevents the unauthorized deletion?

Not:

```text
UI visibility
```

Not:

```text
hidden input
```

Not:

```text
client-side permission checks
```

The protection must be:

```text
Server Action
     ↓
authenticate attacker
     ↓
load Project 9002
     ↓
authorize attacker against Project 9002
     ↓
reject if unauthorized
```

This is the correct resource-level security model.

---

# 41. Production Mutation Contract

A production Server Action should conceptually implement:

```text
┌──────────────────────────────────┐
│ 1. Establish caller identity     │
├──────────────────────────────────┤
│ 2. Parse and validate input      │
├──────────────────────────────────┤
│ 3. Load target resource          │
├──────────────────────────────────┤
│ 4. Authorize operation           │
├──────────────────────────────────┤
│ 5. Enforce business invariants   │
├──────────────────────────────────┤
│ 6. Execute mutation              │
├──────────────────────────────────┤
│ 7. Revalidate affected state     │
├──────────────────────────────────┤
│ 8. Return safe structured result │
└──────────────────────────────────┘
```

This connects security back to the rest of KPI 04.

---

# 42. The Complete KPI 04 Mutation Architecture

At this point, the complete KPI can be modeled as:

```text
                         USER
                          │
                          ▼
                    FORM / UI EVENT
                          │
                          ▼
                    FormData/Input
                          │
                          ▼
                 ┌─────────────────┐
                 │  SERVER ACTION  │
                 └────────┬────────┘
                          │
                  Authenticate
                          │
                     Authorize
                          │
                      Validate
                          │
                     Mutate
                          │
                ┌─────────┴─────────┐
                │                   │
             Success              Failure
                │                   │
                ▼                   ▼
        Structured result     Structured error
                │                   │
                └─────────┬─────────┘
                          ▼
                  useActionState
                          │
                    UI response
                          │
             ┌────────────┴────────────┐
             ▼                         ▼
       Optimistic UI               Confirmed UI
```

The supporting UI mechanisms are:

```text
useFormStatus
    ↓
pending state

useActionState
    ↓
result state

useOptimistic
    ↓
temporary predicted state
```

---

# 43. Final Mental Model

Do not think:

```text
'use server'
    ↓
secure
```

Think:

```text
'use server'
    ↓
server execution boundary
    ↓
untrusted invocation
    ↓
authenticate
    ↓
validate
    ↓
authorize
    ↓
enforce business rules
    ↓
mutate
    ↓
return safe result
```

The core security principle is:

> **Every Server Action is a mutation boundary that must independently establish whether the caller is authenticated and authorized to perform the requested operation.**

The deeper SDE-2 principle is:

> **Never confuse UI restrictions, input validation, authentication, authorization, and business invariants. They solve different problems and must remain independently enforceable.**

---

# 44. KPI 04 Completion

All seven canonical parts are now complete:

```text
KPI 04 — Server Actions & Data Mutations

Part 01
Mutation Paradigm Shift
        ↓
Part 02
Defining and Invoking Server Actions
        ↓
Part 03
Form Actions and Web Standards (FormData)
        ↓
Part 04
Managing Pending States
        ↓
Part 05
Advanced Action State (useActionState)
        ↓
Part 06
Optimistic UI Updates (useOptimistic)
        ↓
Part 07
Security and Authorization in Actions
        ↓
                COMPLETE
```

## KPI 04 Governing Question

You should now be able to answer the complete question:

> **How is this action invoked, where does it execute, how is the user informed of its progress, how does the UI consume its result, how can the UI respond optimistically, and what security boundaries must be enforced before the mutation occurs?**

The complete mutation lifecycle is:

```text
Intent
  ↓
Invocation
  ↓
Server execution
  ↓
FormData
  ↓
Authentication
  ↓
Authorization
  ↓
Validation
  ↓
Mutation
  ↓
Pending feedback
  ↓
Action result
  ↓
Optimistic/reconciled UI
  ↓
Cache/data freshness
```

**KPI 04 is now locked and complete.**
