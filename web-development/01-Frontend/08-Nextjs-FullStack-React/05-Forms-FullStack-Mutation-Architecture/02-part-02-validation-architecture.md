# Level 08 — Next.js & Full-Stack React

# KPI 05 — Forms & Full-Stack Mutation Architecture

## Part 02 — Validation Architecture: Client vs Server Validation, Schemas, Business Rules & Error Contracts

---

## 1. Part Objective

In Part 01, we established the complete form lifecycle:

```text
User Input
    ↓
Form Submission
    ↓
Server Boundary
    ↓
Authentication
    ↓
Authorization
    ↓
Validation
    ↓
Business Logic
    ↓
Persistence
    ↓
Cache Reconciliation
    ↓
UI
```

Part 02 focuses on one of the most important stages in that pipeline:

> **How do we determine whether submitted data is acceptable, and how do we communicate rejection back to the UI?**

The goal is not merely to learn a validation library.

The goal is to understand the **architecture of validation** across the client, server, domain, and persistence boundaries.

---

# 2. Governing Question

The governing question for this Part is:

> **Where should validation happen, what exactly should be validated at each layer, and how should validation failures become reliable UI state?**

A senior engineer must be able to distinguish:

```text
Browser validation
        ≠
Client validation
        ≠
Server input validation
        ≠
Business validation
        ≠
Authorization
        ≠
Database constraints
```

They overlap in purpose, but they are not interchangeable.

---

# 3. Why Validation Is an Architecture Problem

A beginner often thinks:

```text
Input
  ↓
if invalid
  ↓
show error
```

Production systems are more complicated.

Consider:

```text
Create Project
```

The input might need to satisfy:

```text
name exists
name length <= 100
description <= 5000
organization exists
user belongs to organization
user has create-project permission
project name is unique within organization
organization is active
database accepts the write
```

These conditions belong to different layers.

Therefore:

```text
Validation is not one operation.
```

It is a collection of constraints enforced at appropriate boundaries.

---

# 4. The Validation Stack

A useful mental model is:

```text
                    USER INPUT
                        │
                        ▼
              ┌──────────────────┐
              │ Browser / HTML    │
              │ Constraints       │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │ Client Validation │
              │ UX-oriented       │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │ Server Validation │
              │ Trust boundary    │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │ Business Rules   │
              │ Domain semantics │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │ Database          │
              │ Constraints       │
              └──────────────────┘
```

Each layer protects against a different class of problem.

---

# 5. Browser Validation

HTML provides built-in validation mechanisms.

For example:

```html
<input
  name="email"
  type="email"
  required
/>
```

The browser can determine that:

```text
empty value
```

violates:

```text
required
```

or that:

```text
hello
```

does not satisfy:

```text
type="email"
```

This is valuable because it provides immediate feedback without requiring a network round trip.

But browser validation is not a security boundary.

---

# 6. Browser Validation Is UX

Consider:

```html
<input
  name="age"
  type="number"
  min="18"
/>
```

The browser may prevent submission for:

```text
age = 15
```

But a malicious client can bypass browser behavior entirely.

For example, someone can send a request directly to the server.

Therefore:

```text
HTML validation
       ↓
User experience
```

not:

```text
HTML validation
       ↓
Security
```

The server must independently evaluate submitted data.

---

# 7. Client-Side Validation

Client validation is broader than native HTML validation.

For example:

```text
password
+
confirmPassword
```

The client may immediately determine:

```text
password !== confirmPassword
```

and display:

```text
Passwords do not match.
```

This improves interaction quality.

The user gets feedback:

```text
immediately
```

instead of:

```text
submit
  ↓
network request
  ↓
server
  ↓
response
  ↓
error
```

But client-side validation remains untrusted.

---

# 8. Why Duplicate Validation Is Sometimes Correct

You may see:

```text
Client
  ↓
validate email
  ↓
Server
  ↓
validate email again
```

At first this looks redundant.

It is not.

The two validations have different responsibilities.

```text
CLIENT
──────
Fast feedback
UX
Reduced unnecessary requests
```

versus:

```text
SERVER
──────
Trust
Correctness
Security
Consistency
```

The same rule may legitimately exist in both places.

The duplication is intentional because the boundaries have different trust characteristics.

---

# 9. The Server Is the Authoritative Validation Boundary

The server receives:

```text
untrusted input
```

Therefore it must assume:

```text
anything can be malformed
anything can be missing
anything can be manipulated
anything can be unexpected
```

For example:

```text
name = ""
```

or:

```text
name = extremely-large-payload
```

or:

```text
organizationId = someone-else's-org
```

The server must not assume that the browser behaved correctly.

---

# 10. Validation Pipeline

A strong server pipeline looks like:

```text
Raw Input
   ↓
Normalize
   ↓
Validate Shape
   ↓
Validate Types
   ↓
Validate Constraints
   ↓
Authorize
   ↓
Apply Business Rules
   ↓
Persist
```

Depending on the operation, authorization may happen earlier or after loading the relevant resource.

The critical point is that:

> **Every trust-sensitive decision happens on the server.**

---

# 11. Validation vs Normalization

These are often confused.

### Normalization

Transforms input into a canonical representation.

Example:

```text
"  Apollo  "
```

might become:

```text
"Apollo"
```

Another example:

```text
USER@EXAMPLE.COM
```

might be normalized according to application policy.

### Validation

Determines whether the resulting value satisfies constraints.

Example:

```text
"Apollo"
```

might satisfy:

```text
length >= 2
length <= 100
```

Conceptually:

```text
Raw Input
   ↓
Normalization
   ↓
Validation
   ↓
Domain Input
```

Do not assume normalization and validation are the same operation.

---

# 12. Validation vs Sanitization

"Sanitization" is frequently used imprecisely.

A better mental model is:

```text
Normalize
→ canonicalize expected representations

Validate
→ determine whether input is acceptable

Encode / escape
→ safely represent data for a particular output context
```

For example, HTML escaping is an output-context concern.

It should not be treated as a generic replacement for proper input validation.

---

# 13. Schema Validation

A schema describes the expected shape and constraints of data.

Conceptually:

```text
ProjectInput
├── name
│   ├── string
│   ├── required
│   └── max length
│
└── description
    ├── string
    └── optional
```

A schema can provide a centralized representation of these constraints.

Libraries such as Zod are commonly used for this purpose.

Conceptually:

```ts
const ProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(5000).optional(),
});
```

The important concept is not the library syntax.

It is:

```text
Untrusted input
      ↓
Schema
      ↓
Validated data
```

---

# 14. Schema Validation Is Not Authorization

Consider:

```ts
const schema = z.object({
  projectId: z.string(),
  name: z.string().min(1),
});
```

A successful parse establishes something like:

```text
projectId has expected shape
name has expected shape
```

It does **not** establish:

```text
user may modify projectId
```

Therefore:

```text
Schema validation
      ≠
Authorization
```

You still need:

```text
authenticated user
      ↓
permission check
      ↓
resource access decision
```

---

# 15. Schema Validation Is Not Business Logic

Suppose:

```text
name.length <= 100
```

is a schema constraint.

Now suppose:

```text
A project name must be unique within an organization.
```

That rule requires application state.

A schema alone generally cannot establish that.

You need something like:

```text
validate shape
     ↓
load relevant state
     ↓
apply business rule
     ↓
mutate
```

Therefore:

```text
Schema
    ≠
Domain
```

---

# 16. Static Types Are Not Runtime Validation

TypeScript provides compile-time information.

For example:

```ts
type ProjectInput = {
  name: string;
};
```

This helps developers.

But the server receives runtime data.

The network does not automatically guarantee:

```text
name is actually a string
```

Therefore:

```text
TypeScript type
      ↓
developer/compiler contract
```

while:

```text
runtime schema validation
      ↓
actual runtime boundary
```

You need both when crossing untrusted boundaries.

---

# 17. The Runtime Boundary

Think about:

```ts
function createProject(input: ProjectInput) {
  // ...
}
```

The type may say:

```text
input.name: string
```

But if the data originated from:

```text
FormData
```

then the runtime value must still be checked.

The architecture is:

```text
External / Untrusted Data
          ↓
Runtime Validation
          ↓
Trusted Application Data
          ↓
TypeScript Domain Types
```

This distinction is essential for SDE-2 interviews.

---

# 18. FormData and Validation

A form submission may produce:

```text
FormData
```

rather than a domain object.

Conceptually:

```text
FormData
  ↓
extract fields
  ↓
normalize
  ↓
schema validation
  ↓
validated object
```

For example:

```ts
const raw = {
  name: formData.get("name"),
  description: formData.get("description"),
};
```

This object is still untrusted.

Do not immediately treat it as:

```ts
ProjectInput
```

without runtime validation.

---

# 19. Validation Result

A validation operation should conceptually produce:

```text
SUCCESS
```

or:

```text
FAILURE
```

For example:

```text
Success
{
  name: "Apollo",
  description: "Analytics platform"
}
```

versus:

```text
Failure
{
  name: ["Name is required"]
}
```

This separation makes downstream logic predictable.

---

# 20. Field-Level Errors

Forms frequently need errors associated with individual fields.

Example:

```text
Name
[________________]

Project name is required.
```

A useful structured representation is:

```ts
{
  name: ["Project name is required"]
}
```

Another field might have:

```ts
{
  email: ["Enter a valid email address"]
}
```

This enables the UI to map:

```text
field name
      ↓
field error
```

without parsing arbitrary strings.

---

# 21. Form-Level Errors

Not every error belongs to a field.

Example:

```text
The organization has reached its project limit.
```

No single input is necessarily invalid.

The form itself cannot proceed.

Therefore distinguish:

```text
fieldErrors
```

from:

```text
formError
```

Conceptually:

```ts
{
  fieldErrors: {
    name: ["Name is required"]
  },
  formError: "Unable to create project."
}
```

This distinction becomes important as forms become more complex.

---

# 22. Business Errors

Suppose:

```text
Project name = Apollo
```

passes schema validation.

But the organization already contains:

```text
Apollo
```

The server may reject the operation.

This is not necessarily a malformed input problem.

It is a business constraint.

The UI may need:

```text
A project named Apollo already exists.
```

This is different from:

```text
Name must not be empty.
```

The architecture should preserve that distinction.

---

# 23. Error Taxonomy

A mature mutation system can classify failures.

```text
                    FAILURE
                       │
       ┌───────────────┼────────────────┐
       ↓               ↓                ↓
  Validation       Business         Infrastructure
    Error            Error              Error
       │               │                │
       ↓               ↓                ↓
Bad input        Rule violation     DB/network/etc.
```

You may also have:

```text
Authorization Error
Authentication Error
Concurrency Error
Rate-limit Error
```

The classification helps determine:

* what the user sees
* whether retry is appropriate
* whether a field should be highlighted
* whether logging/alerting is required

---

# 24. Error Messages Are Part of the Contract

Avoid returning random strings from different parts of the application.

Bad:

```text
"oops"
```

Another action:

```text
"Something went wrong with this request."
```

Another:

```text
"Validation failed!"
```

A better architecture defines predictable result shapes.

For example:

```ts
type FormResult =
  | {
      status: "success";
      message?: string;
    }
  | {
      status: "validation-error";
      fieldErrors: Record<string, string[]>;
      formError?: string;
    }
  | {
      status: "business-error";
      message: string;
    };
```

The exact shape can differ by application.

The important idea is:

> **The mutation boundary should expose a stable result contract.**

---

# 25. Never Leak Internal Errors Directly

Suppose the database throws:

```text
UniqueConstraintViolation:
users_email_key
```

Do not automatically display that raw message to the user.

Instead:

```text
Internal error
       ↓
classify
       ↓
safe application-level message
```

The user might receive:

```text
An account with this email already exists.
```

while internal logs retain the technical details.

This creates separation between:

```text
user-facing error
```

and:

```text
diagnostic error
```

---

# 26. Error Contract Example

A useful conceptual contract:

```ts
type CreateProjectResult =
  | {
      status: "success";
      projectId: string;
    }
  | {
      status: "validation-error";
      fieldErrors: {
        name?: string[];
        description?: string[];
      };
      formError?: string;
    }
  | {
      status: "forbidden";
      message: string;
    }
  | {
      status: "business-error";
      message: string;
    }
  | {
      status: "error";
      message: string;
    };
```

The client can then reason explicitly:

```text
status === "validation-error"
       ↓
show field errors

status === "forbidden"
       ↓
show permission message

status === "success"
       ↓
reconcile UI
```

---

# 27. Validation and Pending State

These concerns are related but different.

Pending means:

```text
mutation is currently executing
```

Validation error means:

```text
mutation completed with invalid input
```

Therefore:

```text
PENDING
  ↓
WAITING
```

while:

```text
VALIDATION ERROR
  ↓
COMPLETED + REJECTED
```

This distinction matters when designing state machines.

---

# 28. Validation and Optimistic UI

Optimistic UI predicts success before the server confirms it.

But validation remains authoritative.

Example:

```text
User adds comment
      ↓
UI immediately displays comment
      ↓
Server validates
      ↓
validation fails
      ↓
optimistic comment removed / marked failed
```

Therefore:

```text
Optimistic UI
      ≠
Validation bypass
```

The server remains authoritative.

---

# 29. Cross-Field Validation

Some constraints involve multiple fields.

Example:

```text
password
confirmPassword
```

The rule is:

```text
password === confirmPassword
```

Another example:

```text
startDate <= endDate
```

Another:

```text
minimumSeats <= maximumSeats
```

These are not independent field constraints.

The validation model must support:

```text
field-level rules
+
cross-field rules
```

This is one reason schema-level validation becomes useful.

---

# 30. Conditional Validation

Enterprise forms often contain conditional fields.

Example:

```text
accountType = business
```

then:

```text
companyName required
taxId required
```

But:

```text
accountType = individual
```

may not require them.

Therefore:

```text
Validation rules
```

may depend on:

```text
other form values
```

The architecture must represent those relationships explicitly.

---

# 31. Dynamic Forms

Consider:

```text
Team members
[ John ]
[ Sarah ]
[ + Add member ]
```

The form shape itself can change.

The system may need to validate:

```text
members.length >= 1
```

and:

```text
no duplicate members
```

and:

```text
every member ID belongs to organization
```

Notice the progression:

```text
shape validation
      ↓
business validation
      ↓
authorization
```

Again, one mechanism does not solve every layer.

---

# 32. Server-Side Validation Is Still Required for Client-Validated Forms

Suppose the client checks:

```text
email is valid
```

A malicious client can send:

```text
email = "not-an-email"
```

directly to the mutation boundary.

Therefore:

```text
Client
  ↓
best-effort UX validation

Server
  ↓
authoritative validation
```

The client is an optimization.

The server is the authority.

---

# 33. Avoid Over-Validation on the Client

Client validation can become excessive.

Imagine a form that duplicates:

```text
all database business rules
all permission rules
all server policies
```

in the browser.

Now you have:

```text
Client rules
        +
Server rules
        +
synchronization problem
```

Rules can drift.

For example:

```text
Server:
maxProjects = 20

Client:
maxProjects = 10
```

The client may reject valid input unnecessarily.

Therefore:

> **Duplicate rules only when the UX benefit justifies the maintenance cost.**

---

# 34. Validation as a UX Optimization

A good division is:

```text
Client
──────
Rules that improve immediate feedback

Server
──────
Rules required for correctness and trust
```

Examples suitable for client feedback:

```text
required field
obvious format
password mismatch
simple length constraint
```

Examples that should remain authoritative on the server:

```text
resource ownership
permission checks
uniqueness
account limits
business state
database constraints
```

---

# 35. Validation Does Not Replace Database Constraints

Suppose the application checks:

```text
email is unique
```

before inserting.

Two requests arrive simultaneously:

```text
Request A → check → available
Request B → check → available
```

Both pass.

Then:

```text
A → insert
B → insert
```

Without a database uniqueness constraint, duplicates may occur.

Therefore:

```text
Application validation
       +
Database constraint
```

provides defense in depth.

---

# 36. Race Conditions and Validation

This leads to an important senior-level concept:

> **A validation result can become stale before the mutation executes.**

Example:

```text
T1:
Check username "apollo"
→ available

T2:
Another request creates "apollo"

T3:
First request inserts "apollo"
```

The earlier validation result is no longer authoritative.

Therefore critical invariants often require:

```text
transaction
+
database constraint
+
proper error handling
```

rather than validation alone.

---

# 37. Validation and Authorization Ordering

A common conceptual pipeline is:

```text
authenticate
    ↓
authorize
    ↓
validate
    ↓
mutate
```

But real applications may need:

```text
authenticate
    ↓
parse basic input
    ↓
load resource
    ↓
authorize resource access
    ↓
validate mutation
    ↓
mutate
```

The exact order depends on what information is required to make a safe decision.

The important principle is:

> **Do not perform trust-sensitive work based on unverified assumptions about the caller or resource.**

---

# 38. Avoid Authorization by Validation

This is a dangerous mistake.

Suppose:

```text
projectId = 42
```

passes:

```text
z.string()
```

That does not mean:

```text
user can modify project 42
```

The correct flow is:

```text
projectId structurally valid
       ↓
load project
       ↓
determine authenticated user
       ↓
check permission
       ↓
allow/reject
```

---

# 39. Validation Contracts Should Be Stable

A form component should ideally not need to know database internals.

Bad contract:

```text
database error code 23505
```

Better:

```text
status: "business-error"
message: "Project name already exists."
```

The form consumes application-level semantics.

This allows the underlying persistence system to change without forcing UI components to understand database-specific behavior.

---

# 40. Example: Create Project

Conceptual server flow:

```ts
async function createProject(formData: FormData) {
  const raw = {
    name: formData.get("name"),
    description: formData.get("description"),
  };

  const parsed = ProjectSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      status: "validation-error",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await authenticate();

  if (!user) {
    return {
      status: "unauthenticated",
    };
  }

  const allowed = await canCreateProject(user);

  if (!allowed) {
    return {
      status: "forbidden",
    };
  }

  // Domain operation...
}
```

The exact implementation is less important than the separation:

```text
raw input
    ↓
runtime validation
    ↓
identity
    ↓
authorization
    ↓
domain operation
```

---

# 41. What the UI Should Know

The UI needs enough information to respond correctly.

For example:

```text
validation-error
```

means:

```text
highlight relevant fields
```

while:

```text
forbidden
```

means:

```text
do not pretend the mutation succeeded
```

and:

```text
success
```

means:

```text
update/reconcile UI
```

The UI does not need to know:

```text
SQL query
database driver
transaction implementation
```

This is good abstraction.

---

# 42. Validation and Form Libraries

Form libraries can help manage:

* field registration
* touched state
* dirty state
* client validation
* error mapping
* controlled/uncontrolled integration

But a library does not change the fundamental architecture.

Even with a library:

```text
browser
   ↓
client
   ↓
server
   ↓
domain
   ↓
database
```

still exists.

Therefore:

> **A form library is an implementation tool, not an architectural boundary.**

---

# 43. When a Form Library Is Justified

A library becomes valuable when you have:

```text
many fields
complex validation
dynamic fields
nested structures
conditional logic
field arrays
rich client interactions
```

For a simple form:

```text
name
email
submit
```

native React/HTML primitives may be sufficient.

Avoid adding abstraction merely because a form library is popular.

---

# 44. Debugging Validation

When validation behaves incorrectly, inspect each boundary.

### Step 1

What did the browser submit?

```text
FormData
```

### Step 2

What values did the server extract?

```text
raw input
```

### Step 3

What did normalization produce?

```text
normalized input
```

### Step 4

What did the schema receive?

```text
validated input candidate
```

### Step 5

Did schema validation succeed?

```text
success / failure
```

### Step 6

Did authorization succeed?

```text
allowed / rejected
```

### Step 7

Did business validation succeed?

```text
allowed / rejected
```

### Step 8

Did persistence succeed?

```text
success / constraint failure
```

### Step 9

Did the UI correctly map the result?

```text
field/form/system state
```

This creates a complete debugging path.

---

# 45. Common Mistakes

## Mistake 1 — Client-only validation

```text
Client says valid
→ send
→ server trusts it
```

Incorrect.

---

## Mistake 2 — Treating TypeScript as runtime validation

```text
type ProjectInput
```

does not validate network data.

---

## Mistake 3 — Using schema validation as authorization

A valid `projectId` is not necessarily an authorized `projectId`.

---

## Mistake 4 — Returning arbitrary error strings

This creates unstable UI behavior.

---

## Mistake 5 — Exposing database errors directly

This leaks implementation details and produces poor UX.

---

## Mistake 6 — Reimplementing every server rule on the client

This creates rule duplication and drift.

---

## Mistake 7 — Ignoring database constraints

Application validation alone cannot always protect invariants under concurrency.

---

# 46. SDE-2 Interview Questions

### Q1. Why validate on both client and server?

Because they serve different purposes:

```text
client → UX
server → authority/trust
```

---

### Q2. Why aren't TypeScript types enough?

Because TypeScript types are not runtime enforcement of external data.

---

### Q3. Is schema validation authorization?

No.

Schema validation establishes input shape/constraints.

Authorization establishes whether the caller may perform the operation.

---

### Q4. Where should uniqueness be enforced?

Application logic can provide early feedback, but critical uniqueness invariants should generally be protected by the persistence layer as well.

---

### Q5. Should every server error be shown to the user?

No.

Translate internal errors into safe application-level messages while retaining diagnostic detail internally.

---

### Q6. Why might client and server validation intentionally duplicate the same rule?

Because the client provides fast feedback while the server provides authoritative enforcement.

---

# 47. Prediction Challenge

Consider:

```text
User enters:
name = "Apollo"

Client:
valid

Request sent.

Server:
valid

Database:
unique constraint violation
```

Question:

**Was the validation architecture necessarily wrong?**

No.

The earlier validations may all have been correct.

The problem is that:

```text
validation result
```

does not guarantee that the system state remains unchanged until persistence.

The database constraint is the final invariant enforcement mechanism.

This is a concurrency lesson, not necessarily a schema-validation failure.

---

# 48. Prediction Challenge — Security

Suppose:

```text
Client validation:
projectId must be numeric
```

The attacker sends:

```text
projectId = 123
```

but project 123 belongs to another organization.

What failed if the server performs the update?

The architecture failed to enforce authorization.

The fact that:

```text
projectId = 123
```

is valid does not establish:

```text
caller may mutate project 123
```

---

# 49. Prediction Challenge — Error Mapping

Suppose the server returns:

```text
{
  status: "validation-error",
  fieldErrors: {
    email: ["Invalid email"]
  }
}
```

What should the form do?

Conceptually:

```text
result
  ↓
status === validation-error
  ↓
map email error to email field
  ↓
render accessible error
```

It should not:

```text
throw generic error
```

and lose the field-specific information.

---

# 50. Production Architecture

A mature form validation architecture can be represented as:

```text
                     FORM
                       │
                       ▼
                Browser Rules
                       │
                       ▼
                Client Rules
                       │
                       ▼
                  FormData
                       │
                       ▼
               SERVER BOUNDARY
                       │
                       ▼
                Authentication
                       │
                       ▼
              Runtime Validation
                       │
                       ▼
                Authorization
                       │
                       ▼
               Business Rules
                       │
                       ▼
                  Transaction
                       │
                       ▼
             Database Constraints
                       │
                       ▼
                Result Contract
                       │
                       ▼
                 Form State
                       │
                       ▼
                       UI
```

Each layer has a distinct responsibility.

---

# 51. Senior Engineering Principle

The strongest validation architecture follows this rule:

> **Validate early for UX, validate authoritatively at the trust boundary, enforce critical invariants at the persistence boundary, and expose stable application-level error contracts.**

That gives you:

```text
Fast UX
+
Security
+
Correctness
+
Maintainability
+
Debuggability
```

---

# 52. Completion Checklist

You should now be able to explain:

* [ ] Browser validation vs client validation.
* [ ] Why client validation cannot establish trust.
* [ ] Why server validation is authoritative.
* [ ] Why validation may intentionally be duplicated.
* [ ] Normalization vs validation.
* [ ] Validation vs sanitization.
* [ ] Runtime schema validation.
* [ ] Why TypeScript types are not runtime validation.
* [ ] Schema validation vs authorization.
* [ ] Schema validation vs business rules.
* [ ] Field-level errors.
* [ ] Form-level errors.
* [ ] Business errors.
* [ ] Infrastructure errors.
* [ ] Stable mutation result contracts.
* [ ] Safe user-facing errors vs internal diagnostic errors.
* [ ] Cross-field validation.
* [ ] Conditional validation.
* [ ] Dynamic-form validation.
* [ ] Why database constraints remain important.
* [ ] Why validation can become stale under concurrency.
* [ ] How validation interacts with pending and optimistic state.
* [ ] How to debug validation across the complete request pipeline.

---

# 53. Final Mental Model

Remember:

```text
                    RAW INPUT
                        │
                        ▼
                  Normalize
                        │
                        ▼
              Runtime Validation
                        │
                        ▼
                Trusted Shape
                        │
                        ▼
                 Authorization
                        │
                        ▼
               Business Rules
                        │
                        ▼
                 Persistence
                        │
                        ▼
             Database Constraints
                        │
                        ▼
                Result Contract
                        │
                        ▼
                      FORM
```

And the critical distinctions:

```text
HTML validation
      ≠
Client validation

Client validation
      ≠
Server validation

Server validation
      ≠
Authorization

Schema validation
      ≠
Business logic

Application validation
      ≠
Database invariant enforcement
```

The senior engineer does not ask only:

> "Is this field valid?"

They ask:

> **"Which boundary owns this constraint, what is the trust model at that boundary, and how does the resulting decision propagate back into the form state?"**

---

## Part Boundary

This Part establishes the **validation architecture and error-contract model**.

It does not deeply cover:

* advanced form state orchestration
* dynamic field lifecycle implementation
* file uploads
* multi-step forms
* autosave/drafts
* advanced mutation UX
* form-library-specific implementation

Those remain separate concerns.

**Part 02 is therefore complete.**
