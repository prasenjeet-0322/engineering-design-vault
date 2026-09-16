# KPI 04 — Server Actions & Data Mutations

## KPI Objective

Master the architecture of **data mutations in Next.js using Server Actions**.

This KPI focuses on understanding how modern Next.js applications can move standard UI mutations away from the traditional:

```text
Client
  ↓
fetch()
  ↓
API endpoint
  ↓
server logic
  ↓
database
```

toward:

```text
React UI
  ↓
Server Action
  ↓
Server execution
  ↓
validation
  ↓
authorization
  ↓
database / service mutation
  ↓
cache invalidation
  ↓
updated UI
```

The objective is **not** to memorize Server Action syntax.

The objective is to understand the complete mutation lifecycle:

```text
Invocation
    ↓
Network transition
    ↓
Server execution
    ↓
Authentication
    ↓
Authorization
    ↓
Input validation
    ↓
Business logic
    ↓
Persistence
    ↓
Cache invalidation
    ↓
Returned state
    ↓
UI feedback
```

---

# Governing Question

For every mutation written in this KPI, the engineer must be able to determine:

> **How is this action invoked, where does it execute, how is the user informed of its progress, and what cache must be invalidated after it succeeds?**

Expand that into nine questions:

```text
1. Who invokes the action?
2. How is it invoked?
3. Where does the function actually execute?
4. What input crosses the network?
5. How is that input validated?
6. Who is allowed to perform the mutation?
7. What data is changed?
8. What cache becomes stale?
9. How does the UI learn about success, failure, and pending state?
```

A senior engineer should be able to answer all nine before calling a mutation production-ready.

---

# KPI Architecture

The complete mutation architecture is:

```text
                         USER
                           │
                           ▼
                     UI Interaction
                           │
                           ▼
                  Server Action Invocation
                           │
                 ┌─────────┴─────────┐
                 │                   │
             Form Action        Programmatic
                 │                   │
                 └─────────┬─────────┘
                           ▼
                    Network Boundary
                           │
                           ▼
                   Server Action
                           │
             ┌─────────────┼─────────────┐
             │             │             │
       Authentication   Validation   Authorization
             │             │             │
             └─────────────┼─────────────┘
                           ▼
                    Business Logic
                           │
                           ▼
                  Database / Service
                           │
                           ▼
                     Mutation Result
                           │
             ┌─────────────┼─────────────┐
             │             │             │
          Success        Failure      Exception
             │             │             │
             └─────────────┼─────────────┘
                           ▼
                    Cache Invalidation
                           │
                           ▼
                      UI Update
                           │
             ┌─────────────┼─────────────┐
             │             │             │
          Success        Error        Optimistic
           State          State          State
```

---

# Part 01 — The Mutation Paradigm Shift

## Core Objective

Understand **why Server Actions exist** and how they change the architecture of ordinary UI mutations.

This part establishes the mental model before introducing syntax.

---

## 1. The Traditional Mutation Model

A conventional React application frequently uses:

```text
Form
 ↓
onSubmit
 ↓
preventDefault()
 ↓
fetch("/api/...")
 ↓
loading state
 ↓
API
 ↓
validation
 ↓
database
 ↓
JSON response
 ↓
setState()
 ↓
UI update
```

The developer has to manually coordinate:

```text
network request
loading state
error state
success state
API endpoint
serialization
response parsing
UI synchronization
```

For example:

```tsx
async function handleSubmit(event) {
  event.preventDefault();

  setLoading(true);

  const response = await fetch("/api/users", {
    method: "POST",
    body: JSON.stringify(data),
  });

  const result = await response.json();

  setLoading(false);
}
```

This is valid architecture.

But it creates an explicit API layer even when the operation exists primarily to support one UI interaction.

---

## 2. The Server Action Model

Server Actions provide a different programming model:

```text
Form / React UI
       ↓
Server Action
       ↓
Server
       ↓
Database
```

The action represents a server-side operation that can be invoked from the UI.

The conceptual model becomes:

```text
Client intent
     ↓
Remote function invocation
     ↓
Server execution
```

This resembles **RPC — Remote Procedure Call**.

---

## 3. RPC Mental Model

Instead of thinking:

```text
"Send POST request to /api/create-user"
```

you can reason:

```text
"Invoke createUser() on the server."
```

The architectural abstraction becomes:

```text
Client
  │
  │ invoke
  ▼
createUser()
  │
  │ remote execution
  ▼
Server
```

The important word is **remote**.

A Server Action may look like a normal function:

```ts
createUser(data)
```

but its execution environment is server-side.

Therefore:

```text
function syntax
      ≠
local execution
```

---

## 4. Server Actions Are Not Magic Local Functions

This is one of the most important concepts in the KPI.

A Server Action can look like:

```ts
await updateProfile(formData);
```

but the client is not simply executing the server function in the browser.

Conceptually:

```text
Browser
   │
   │ invocation
   ▼
network boundary
   │
   ▼
Server
   │
   ▼
Action execution
```

The framework manages much of the transport machinery.

---

## 5. Traditional API vs Server Action

### Traditional API

```text
Component
   ↓
fetch()
   ↓
POST /api/users
   ↓
Route Handler
   ↓
Service
   ↓
Database
```

### Server Action

```text
Component
   ↓
Server Action
   ↓
Server execution
   ↓
Service
   ↓
Database
```

This does **not** mean APIs disappear.

Route Handlers remain useful for:

```text
external consumers
mobile applications
webhooks
public APIs
machine-to-machine communication
third-party integrations
explicit HTTP contracts
```

Server Actions are particularly useful for application-internal UI mutations.

---

## 6. Progressive Enhancement

One major advantage of form-based Server Actions is the ability to integrate with standard HTML form semantics.

Conceptually:

```text
<form>
    ↓
submit
    ↓
server action
```

The application does not have to depend entirely on a custom JavaScript `onSubmit` implementation to understand the intent.

This aligns with the web platform.

The broader principle is:

> **Use browser-native mechanisms where the framework can enhance them rather than replacing them unnecessarily.**

---

## 7. Part 01 Boundaries

This part should establish:

```text
✓ traditional mutation architecture
✓ Server Action mental model
✓ RPC model
✓ Server Action vs API endpoint
✓ progressive enhancement
✓ why framework-managed mutation is useful
✓ where Server Actions fit architecturally
```

It should **not yet deeply cover**:

```text
✗ exact "use server" mechanics
✗ FormData parsing
✗ useFormStatus
✗ useActionState
✗ useOptimistic
✗ security implementation
✗ cache invalidation implementation
```

Those belong to later parts.

---

# Part 02 — Defining and Invoking Server Actions (`'use server'`)

## Core Objective

Understand exactly what `"use server"` means and how Server Actions are defined, imported, passed, and invoked.

The critical distinction is:

> **`"use server"` marks a function as server-invokable. It does not turn a React component into a Server Component.**

---

## 1. Function-Level Meaning

Conceptually:

```ts
"use server";

export async function createUser(formData: FormData) {
  ...
}
```

The directive identifies the function/module as containing server-side actions.

The architectural consequence is:

```text
Function
   ↓
Server-invokable operation
```

not:

```text
Component
   ↓
Server Component
```

---

## 2. Inline Server Actions

An action can be defined within a Server Component context.

Conceptually:

```tsx
export default function Page() {
  async function createUser(formData: FormData) {
    "use server";

    ...
  }

  return (
    <form action={createUser}>
      ...
    </form>
  );
}
```

This is useful when the action is tightly coupled to the surrounding server component.

---

## 3. Extracted Server Actions

For reusable mutations, actions can be extracted into dedicated modules.

Example architecture:

```text
app/
├── actions/
│   └── users.ts
│
└── users/
    └── page.tsx
```

Conceptually:

```text
users.ts
    ↓
Server Actions
    ↓
UI consumers
```

This becomes particularly useful when multiple Client Components need the same mutation.

---

## 4. Client Component Invocation

Client Components can import appropriately defined Server Actions.

The important architecture is:

```text
Client Component
      │
      │ invokes
      ▼
Server Action
      │
      ▼
Server
```

The client does not receive the server implementation as ordinary browser code.

Instead, the framework manages the remote invocation.

---

## 5. Passing Server Actions as Props

A Server Component can pass an action to a Client Component.

Conceptually:

```text
Server Component
      │
      │ action reference
      ▼
Client Component
      │
      │ invocation
      ▼
Server Action
```

This allows the server to define the mutation while the client controls the interaction.

For example:

```tsx
<DeleteButton action={deletePost} />
```

The button can remain a client-side interactive component while the mutation remains server-side.

---

## 6. Function Reference vs Function Execution

This distinction is critical.

Passing:

```tsx
action={deletePost}
```

is different from:

```tsx
action={deletePost()}
```

The first passes the action reference.

The second attempts to execute it immediately.

The architecture is:

```text
action reference
     ↓
Client
     ↓
user interaction
     ↓
remote invocation
```

---

## 7. Part 02 Boundaries

This part owns:

```text
✓ "use server"
✓ action definition
✓ inline actions
✓ extracted actions
✓ importing actions
✓ Client Component invocation
✓ passing action references
✓ server/client action relationship
```

It should not deeply teach:

```text
✗ FormData validation
✗ pending state
✗ action state
✗ optimistic updates
✗ security policy
```

---

# Part 03 — Form Actions and Web Standards (`FormData`)

## Core Objective

Understand how Server Actions integrate directly with standard HTML forms and how form input becomes server-side `FormData`.

This part connects:

```text
HTML
+
React
+
Server Actions
```

rather than treating forms as purely client-side state machines.

---

# 1. Form Action Architecture

Conceptually:

```tsx
<form action={createUser}>
```

becomes:

```text
User
 ↓
Submit
 ↓
HTML Form
 ↓
Server Action
 ↓
Server
```

The developer does not need to manually construct:

```text
fetch()
headers
JSON body
response parsing
```

for the basic form submission path.

---

# 2. FormData

A form submission can produce:

```text
FormData
```

containing fields such as:

```text
email
name
password
```

The action can receive:

```ts
async function createUser(formData: FormData) {
  const email = formData.get("email");
}
```

This is standard web-platform data.

---

# 3. Why FormData Matters

FormData creates a useful boundary:

```text
Browser form
      ↓
standard web encoding
      ↓
Server Action
      ↓
validation
```

It avoids requiring every form to become a heavily controlled React component.

---

# 4. Form Validation

The server must never trust the browser.

Validation belongs on the server.

Conceptually:

```text
FormData
   ↓
Parse
   ↓
Validate
   ↓
Normalize
   ↓
Business logic
```

A validation library such as Zod can be used to turn raw form input into validated application data.

For example:

```text
raw FormData
     ↓
schema validation
     ↓
validated DTO
     ↓
mutation
```

---

# 5. Validation vs Sanitization vs Authorization

These must not be conflated.

### Validation

> Is the input structurally and semantically acceptable?

### Sanitization / normalization

> Should the input be transformed into a canonical form?

### Authorization

> Is this user allowed to perform this operation?

Architecture:

```text
Input
 ↓
Validation
 ↓
Normalization
 ↓
Authentication
 ↓
Authorization
 ↓
Business Logic
```

The exact ordering can vary by operation, but all are distinct concerns.

---

# 6. Returning Structured Results

A Server Action can return structured state such as:

```ts
{
  message: "Profile updated",
  errors: {}
}
```

or:

```ts
{
  message: "Validation failed",
  errors: {
    email: ["Invalid email"]
  }
}
```

The returned result becomes part of the UI feedback architecture.

---

# 7. Part 03 Boundaries

Owns:

```text
✓ <form action={...}>
✓ FormData
✓ form field naming
✓ server validation
✓ schema parsing
✓ normalization
✓ serializable result states
✓ success/error contracts
```

Does not yet deeply own:

```text
✗ useFormStatus
✗ useActionState
✗ optimistic UI
✗ complete authorization architecture
```

---

# Part 04 — Managing Pending States

## Core Objective

Understand how React provides native mechanisms for representing the period during which a Server Action is executing.

The objective is to replace unnecessary manual network-state bookkeeping.

---

# 1. Traditional Loading State

Traditional React often uses:

```tsx
const [isLoading, setIsLoading] = useState(false);
```

then:

```text
submit
 ↓
setLoading(true)
 ↓
fetch
 ↓
response
 ↓
setLoading(false)
```

The developer manually tracks the lifecycle.

---

# 2. Server Action Pending State

With form actions, React can expose whether the associated action is pending.

The relevant hook is:

```text
useFormStatus
```

This allows UI elements such as submit buttons to respond to the form's pending state.

---

# 3. Structural Requirement

A critical detail:

`useFormStatus` needs to be used within a component that is a descendant of the relevant `<form>`.

Conceptually:

```text
Form
│
├── Input
│
├── Input
│
└── SubmitButton
       │
       └── useFormStatus()
```

Not:

```text
Page
└── useFormStatus()
```

outside the relevant form hierarchy.

---

# 4. Submit Button Pattern

Conceptually:

```text
Form
  │
  └── SubmitButton
          │
          ├── pending?
          ├── disabled?
          └── "Saving..."
```

The form owns the mutation lifecycle.

The button consumes that lifecycle.

---

# 5. Why This Is Better

The framework/React model can coordinate:

```text
submission
pending state
UI feedback
```

without every component manually synchronizing:

```text
setLoading(true)
try
catch
finally
setLoading(false)
```

This reduces incidental state management.

---

# 6. Pending Is Not Success

This distinction matters.

```text
pending
```

means:

> The action has not completed yet.

It does not mean:

```text
success
```

or:

```text
failure
```

A robust UI therefore needs separate reasoning for:

```text
idle
pending
success
validation failure
authorization failure
unexpected failure
```

---

# 7. Part 04 Boundaries

Owns:

```text
✓ pending lifecycle
✓ useFormStatus
✓ submit button state
✓ disabled state
✓ spinners
✓ form-level pending UX
✓ relationship between form and pending state
```

Does not deeply own:

```text
✗ validation result state
✗ optimistic state
✗ authorization
✗ cache invalidation
```

---

# Part 05 — Advanced Action State (`useActionState`)

## Core Objective

Understand how Server Action results can become structured UI state without requiring every form to become a manually controlled client-side state machine.

This part moves from:

```text
"Is the action running?"
```

to:

```text
"What did the action return?"
```

---

# 1. Pending vs Result State

Part 04 answers:

```text
Is the action pending?
```

Part 05 answers:

```text
What state did the action produce?
```

For example:

```text
initial
   ↓
submit
   ↓
pending
   ↓
validation failure
```

or:

```text
submit
   ↓
pending
   ↓
success
```

---

# 2. `useActionState`

The architecture can be represented as:

```text
Form
  ↓
Server Action
  ↓
returned state
  ↓
useActionState
  ↓
Client UI
```

The action can return structured state:

```ts
{
  message: "Please fix the following errors",
  errors: {
    email: ["Invalid email"],
    name: ["Required"]
  }
}
```

The client can render this state.

---

# 3. Why This Matters

Without structured action state, developers frequently create multiple pieces of local state:

```text
error
success
fieldErrors
serverMessage
loading
```

and manually synchronize them.

Action state provides a more coherent mutation result model.

---

# 4. Avoiding Excessive Controlled Inputs

Traditional form architecture might create:

```text
value
onChange
setValue
```

for every field.

For a large form:

```text
email
name
phone
company
role
...
```

this can become unnecessarily complex.

When immediate client-side interaction is not required, native form submission plus Server Actions can keep the form simpler.

The browser can maintain input state until submission.

---

# 5. Server Validation Feedback

The preferred conceptual flow is:

```text
Form
 ↓
FormData
 ↓
Server validation
 ↓
validation result
 ↓
action state
 ↓
field errors
 ↓
UI
```

The server remains authoritative.

---

# 6. Error Taxonomy

The action result should distinguish at least:

```text
validation error
authorization error
business-rule error
unexpected server error
success
```

Do not turn every failure into:

```text
"Something went wrong"
```

when the UI needs actionable information.

---

# 7. Part 05 Boundaries

Owns:

```text
✓ useActionState
✓ structured action results
✓ validation errors
✓ success messages
✓ field-level errors
✓ server-to-client mutation state
✓ reducing excessive controlled-form state
```

Does not deeply own:

```text
✗ optimistic updates
✗ security architecture
✗ cache invalidation architecture
```

---

# Part 06 — Optimistic UI Updates

## Core Objective

Understand how to make mutations feel instantaneous by updating the UI before the server confirms the operation.

This is a **UX consistency strategy**, not merely a React hook.

---

# 1. Traditional Mutation UX

Traditional flow:

```text
User clicks
    ↓
Request
    ↓
Wait
    ↓
Server
    ↓
Response
    ↓
UI changes
```

The user experiences network latency.

---

# 2. Optimistic Mutation UX

Optimistic flow:

```text
User clicks
    ↓
Immediately update UI
    ↓
Server Action executes
    ↓
Success?
   / \
 yes  no
  │    │
  ▼    ▼
keep  rollback
```

The user experiences:

```text
intent
 ↓
instant feedback
```

rather than:

```text
intent
 ↓
network wait
 ↓
feedback
```

---

# 3. `useOptimistic`

React provides:

```text
useOptimistic
```

for representing temporary optimistic state.

Conceptually:

```text
Authoritative State
       │
       ▼
Optimistic Projection
       │
       ▼
Immediate UI
       │
       ▼
Server Action
```

---

# 4. Temporary State

Optimistic state is not authoritative.

This distinction is critical.

```text
optimistic state
    ≠
database truth
```

It represents:

> "What we expect the state to become if this operation succeeds."

---

# 5. Rollback

If the Server Action fails:

```text
optimistic update
       ↓
server failure
       ↓
authoritative state wins
```

The UI must return to a consistent state.

This is why optimistic UI is fundamentally a temporary projection.

---

# 6. When Optimistic UI Is Appropriate

Good candidates:

```text
like/unlike
follow/unfollow
toggle preference
reorder items
add/remove lightweight item
mark as read
```

Potentially dangerous candidates:

```text
financial transaction
irreversible deletion
permission changes
security settings
critical inventory mutation
```

The decision depends on the consequences of temporary inconsistency.

---

# 7. Optimistic Concurrency

Senior engineers must consider:

```text
multiple clicks
duplicate submissions
out-of-order responses
stale UI
network failure
server rejection
conflicting updates
```

Optimistic UI is easy to implement badly.

The correct model is:

```text
optimistic intent
      +
authoritative reconciliation
```

---

# 8. Part 06 Boundaries

Owns:

```text
✓ useOptimistic
✓ immediate UI projection
✓ temporary state
✓ rollback
✓ optimistic UX
✓ failure reconciliation
✓ mutation latency perception
```

Does not deeply own:

```text
✗ general cache architecture
✗ authorization
✗ server validation
```

---

# Part 07 — Security and Authorization in Actions

## Core Objective

Establish the most important production rule in the KPI:

> **Treat every Server Action as a publicly exposed server endpoint.**

The fact that the action is called from a trusted-looking React component does not make the caller trusted.

---

# 1. Client UI Is Not a Security Boundary

Suppose the UI contains:

```text
Delete User
```

and the button is hidden for unauthorized users.

That does not protect the operation.

An attacker may attempt to invoke the server operation independently.

Therefore:

```text
UI permission
    ≠
server authorization
```

---

# 2. Authorization Must Execute Inside the Action

Conceptually:

```ts
"use server";

export async function deleteUser(userId: string) {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const allowed = await canDeleteUser(session.user, userId);

  if (!allowed) {
    throw new Error("Forbidden");
  }

  await database.user.delete(...);
}
```

The action itself must establish:

```text
identity
+
permission
```

before performing the mutation.

---

# 3. Authentication vs Authorization

These are separate.

### Authentication

> Who are you?

### Authorization

> What are you allowed to do?

Architecture:

```text
Server Action
     │
     ▼
Authentication
     │
     ▼
Identity
     │
     ▼
Authorization
     │
     ▼
Mutation
```

Do not stop after authentication.

A logged-in user may still lack permission to mutate a specific resource.

---

# 4. Resource-Level Authorization

Consider:

```text
updateProject(projectId)
```

The question is not merely:

```text
Is the user logged in?
```

It is:

```text
Does this user have permission to update this specific project?
```

Therefore:

```text
user
 +
project
 +
requested operation
```

must be evaluated.

---

# 5. Server Actions as Public Endpoints

Even if the action is:

```text
not linked from UI
```

or:

```text
hidden behind a button
```

the server-side function must still assume hostile invocation.

Security model:

```text
Untrusted Client
       │
       ▼
Server Action
       │
       ├── authenticate
       ├── authorize
       ├── validate
       ├── mutate
       └── return safe result
```

---

# 6. CSRF

Server Actions have framework-level protections around CSRF-related request handling.

The important architectural lesson is not:

```text
"Next.js handles security, therefore my action is secure."
```

That is false.

CSRF protection addresses a specific class of request-forgery problems.

It does not replace:

```text
authentication
authorization
input validation
rate limiting where appropriate
business-rule enforcement
output safety
```

---

# 7. Closures and Data Leakage

Inline Server Actions can close over surrounding variables.

Conceptually:

```text
Server Component
      │
      ├── secret
      │
      └── Server Action
             │
             └── closure
```

This creates an important security/design question:

> **What information is being captured by the action and potentially made available to the invocation mechanism?**

Do not casually capture sensitive values.

Prefer explicit inputs and server-side lookup where appropriate.

---

# 8. Never Trust Client-Supplied Identity

A dangerous pattern is:

```ts
deleteUser(userIdFromClient)
```

with the assumption:

```text
userIdFromClient === currentUser.id
```

The client can provide a different ID.

The server must establish the authenticated identity independently.

Conceptually:

```text
Client input
    ↓
requested resource
    ↓
authenticated server identity
    ↓
authorization decision
```

---

# 9. Validation Still Applies

Security is not only authorization.

An action should reason about:

```text
authentication
authorization
validation
business invariants
```

For example:

```text
updatePrice(productId, price)
```

must establish:

```text
authenticated?
authorized?
price valid?
product exists?
price allowed by business rules?
```

before mutation.

---

# 10. Part 07 Boundaries

Owns:

```text
✓ Server Action security model
✓ authentication
✓ authorization
✓ resource-level permission checks
✓ hostile invocation model
✓ CSRF understanding
✓ closure/data leakage
✓ client input distrust
```

It should not become a generic security curriculum covering every web security topic.

Its scope is specifically:

> **How security must be enforced at the Server Action boundary.**

---

# Complete KPI 04 Mutation Lifecycle

After all seven parts, the engineer should be able to model a mutation like this:

```text
                           USER
                             │
                             ▼
                        Form / UI
                             │
                             ▼
                    Action Invocation
                             │
                             ▼
                    Server Action Boundary
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        Authentication   Validation   Authorization
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                      Business Rules
                             │
                             ▼
                    Database / Service
                             │
                             ▼
                       Mutation Result
                             │
              ┌──────────────┼──────────────┐
              │              │              │
           Success         Failure       Exception
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                     Cache Invalidation
                             │
                             ▼
                       UI Reconciliation
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
       Success             Error            Optimistic
        State               State             State
```

---

# KPI 04 Cross-Part Dependency Model

The parts should not be studied as isolated features.

They form a dependency chain:

```text
PART 01
Why Server Actions?
        │
        ▼
PART 02
How are they defined/invoked?
        │
        ▼
PART 03
How do forms/input enter the action?
        │
        ▼
PART 04
How does the UI represent execution?
        │
        ▼
PART 05
How does the UI represent the result?
        │
        ▼
PART 06
How can the UI respond before confirmation?
        │
        ▼
PART 07
How do we secure the entire operation?
```

---

# Cross-Part Architectural Questions

For every mutation, the engineer should progressively answer:

## Layer 1 — Invocation

```text
Who invokes it?
How?
From a form?
From a client event?
From another server-side flow?
```

## Layer 2 — Execution

```text
Where does it execute?
What dependencies can it access?
```

## Layer 3 — Input

```text
What data enters the action?
How is it serialized?
How is it validated?
```

## Layer 4 — Security

```text
Who is the user?
What are they allowed to do?
Which resource are they mutating?
```

## Layer 5 — Persistence

```text
What changes?
What invariants must remain true?
```

## Layer 6 — Feedback

```text
Is the action pending?
Did validation fail?
Did authorization fail?
Did the mutation succeed?
```

## Layer 7 — Reconciliation

```text
What UI becomes stale?
What cache must be invalidated?
Does the UI need optimistic reconciliation?
```

---

# Senior-Level Mutation Architecture

A production mutation should therefore look conceptually like:

```text
                  UI INTENT
                     │
                     ▼
              Server Action
                     │
          ┌──────────┴──────────┐
          │                     │
       Input                 Identity
          │                     │
          ▼                     ▼
     Validation           Authentication
          │                     │
          └──────────┬──────────┘
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
            Cache Invalidation
                     │
                     ▼
               Result State
                     │
          ┌──────────┼──────────┐
          │          │          │
       Success     Error     Optimistic
          │          │          │
          └──────────┼──────────┘
                     ▼
                     UI
```

---

# What KPI 04 Explicitly Does NOT Cover

To prevent curriculum overlap, KPI 04 should not absorb unrelated concerns.

## It does not primarily teach:

```text
Routing
```

That belongs to earlier routing architecture.

```text
RSC execution model
```

That belongs to KPI 03.

```text
General caching architecture
```

That belongs to the dedicated caching KPI.

```text
Rendering strategy
```

That belongs to rendering architecture.

```text
Authentication architecture as a whole
```

KPI 04 only teaches the authorization/security requirements specifically at the mutation boundary.

```text
Generic API design
```

Route Handlers and BFF architecture belong to the dedicated API KPI.

---

# KPI 04 Production Scenario

Consider a project management application.

Requirement:

> A project owner can rename a project.

The complete architecture should be reasoned as:

```text
User edits name
       │
       ▼
<form action={renameProject}>
       │
       ▼
Server Action
       │
       ├── authenticate user
       │
       ├── validate project ID
       │
       ├── validate project name
       │
       ├── load project
       │
       ├── verify project ownership
       │
       ├── update database
       │
       ├── invalidate affected cache
       │
       └── return result
              │
              ▼
        Client UI state
              │
       ┌──────┴──────┐
       │             │
    success        errors
       │             │
       ▼             ▼
   updated UI     field/message
```

The user experience may additionally include:

```text
pending state
optimistic name
rollback on failure
```

This single example exercises almost the entire KPI.

---

# Failure Analysis Model

When a mutation fails, classify the failure.

```text
Mutation Failure
      │
      ├── Invocation Failure
      │
      ├── Validation Failure
      │
      ├── Authentication Failure
      │
      ├── Authorization Failure
      │
      ├── Business Rule Failure
      │
      ├── Persistence Failure
      │
      ├── Network Failure
      │
      ├── Cache Reconciliation Failure
      │
      └── Unexpected Exception
```

A senior engineer should not treat all failures as:

```text
"API failed"
```

because each failure belongs to a different architectural layer.

---

# SDE-2 Interview Competency

You should be able to answer:

### "Why use a Server Action instead of an API Route?"

Answer in terms of architecture:

```text
UI-local mutation
        ↓
Server Action
```

can remove unnecessary explicit HTTP endpoint plumbing.

But if the operation needs:

```text
external consumers
mobile clients
webhooks
public API contracts
third-party integrations
```

an explicit API may be more appropriate.

---

### "Are Server Actions secure because they are server-side?"

No.

Server-side execution does not automatically provide authorization.

Every action must independently enforce:

```text
authentication
authorization
validation
business rules
```

---

### "What happens when a Server Action is pending?"

The UI can use React's form/action state mechanisms to represent pending execution.

---

### "How do validation errors reach the UI?"

The action can return structured serializable state, which can be consumed through action-state mechanisms.

---

### "Why use optimistic updates?"

To provide immediate perceived feedback while the authoritative server mutation executes.

But optimistic state must eventually reconcile with authoritative server state.

---

### "What should happen after a successful mutation?"

You must reason about stale data:

```text
Which cached data represents the old state?
Which route/UI depends on it?
How should it be invalidated or refreshed?
```

This question connects KPI 04 to the later dedicated cache/revalidation curriculum.

---

# KPI 04 Master Decision Framework

For every Server Action:

```text
                  MUTATION
                     │
                     ▼
              Is this UI-local?
                /          \
              YES           NO
               │             │
               ▼             ▼
        Server Action    Consider API
               │
               ▼
          Define Action
               │
               ▼
        Validate Input
               │
               ▼
       Authenticate User
               │
               ▼
        Authorize Action
               │
               ▼
        Execute Mutation
               │
               ▼
       Identify Stale Data
               │
               ▼
       Invalidate/Revalidate
               │
               ▼
        Return Safe State
               │
               ▼
             UI
               │
        ┌──────┴──────┐
        │             │
     Pending       Result
        │             │
        └──────┬──────┘
               ▼
          Reconcile UI
```

---

# KPI 04 Completion Standard

KPI 04 is complete only when the engineer can independently:

1. Explain the Server Action mutation paradigm.
2. Compare Server Actions with traditional API-based mutations.
3. Explain the RPC mental model.
4. Explain progressive enhancement for form submissions.
5. Define Server Actions using `"use server"`.
6. Distinguish Server Actions from Server Components.
7. Define inline actions.
8. Extract reusable actions into dedicated modules.
9. Invoke Server Actions from Client Components.
10. Pass Server Action references through component boundaries.
11. Wire actions directly to forms.
12. Read and parse `FormData`.
13. Validate input on the server.
14. Return structured success/error states.
15. Represent pending form submission with `useFormStatus`.
16. Understand the structural requirements of `useFormStatus`.
17. Use `useActionState` for structured mutation state.
18. Build server-driven validation feedback.
19. Avoid unnecessary controlled form state.
20. Use `useOptimistic` appropriately.
21. Understand optimistic state as temporary rather than authoritative.
22. Reconcile optimistic UI after server success or failure.
23. Treat Server Actions as hostile/public invocation boundaries.
24. Re-authenticate inside the action.
25. Re-authorize inside the action.
26. Perform resource-level permission checks.
27. Understand the role and limits of CSRF protection.
28. Avoid leaking sensitive data through action closures.
29. Identify the cache affected by a mutation.
30. Explain the complete mutation lifecycle from user intent to UI reconciliation.

---

# Final KPI 04 Principle

The mature mental model is:

```text
A Server Action is not merely
"a function that updates a database."

It is a server-side mutation boundary
between untrusted UI intent
and authoritative application state.
```

Therefore every mutation must be reasoned about as:

```text
                 USER INTENT
                      │
                      ▼
               INVOCATION
                      │
                      ▼
               SERVER ACTION
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
       INPUT       IDENTITY     SECURITY
      VALIDATION   AUTHN        AUTHZ
          │           │           │
          └───────────┼───────────┘
                      ▼
               BUSINESS LOGIC
                      │
                      ▼
                  PERSISTENCE
                      │
                      ▼
              CACHE RECONCILIATION
                      │
                      ▼
                  RESULT STATE
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
       SUCCESS       ERROR      OPTIMISTIC
          │           │           │
          └───────────┼───────────┘
                      ▼
                       UI
```

The governing engineering question remains:

> **How is this action invoked, where does it execute, how is the user informed of its progress, and what cache must be invalidated after it succeeds?**

If you can answer that precisely for every mutation, you understand KPI 04 at the SDE-2 level.

### Locked part boundaries

The seven parts are now cleanly separated:

| Part   | Primary question                                         |
| ------ | -------------------------------------------------------- |
| **01** | Why does the Server Action mutation model exist?         |
| **02** | How is a Server Action defined and invoked?              |
| **03** | How does form input cross into the action?               |
| **04** | How does the UI know the action is running?              |
| **05** | How does the UI consume the action's result?             |
| **06** | How can the UI respond before server confirmation?       |
| **07** | How is the mutation secured against an untrusted caller? |

**Next canonical generation order:** Part 01 → Part 02 → Part 03 → Part 04 → Part 05 → Part 06 → Part 07. Each can then be expanded into its own full documentation artifact without changing the locked curriculum.
