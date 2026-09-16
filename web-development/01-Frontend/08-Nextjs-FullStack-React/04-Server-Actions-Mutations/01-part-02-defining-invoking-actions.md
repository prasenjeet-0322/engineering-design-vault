# KPI 04 — Server Actions & Data Mutations

## Part 02 — Defining and Invoking Server Actions (`'use server'`)

---

# 1. Part Objective

The purpose of this part is to understand **how Server Actions are defined, exposed, referenced, and invoked across the Server/Client boundary** in Next.js.

The central question is:

> **When a function is marked with `'use server'`, what exactly changes about that function, where does it execute, and how can another component invoke it?**

By the end of this part, you should be able to reason about:

* what `'use server'` means;
* the difference between a normal server function and a Server Action;
* inline Server Actions;
* extracted Server Actions;
* invoking Server Actions from Server Components;
* invoking Server Actions from Client Components;
* passing Server Actions as props;
* why the browser does not receive the function implementation;
* how the client obtains an action reference;
* why a Server Action behaves like a controlled RPC endpoint;
* what arguments can cross the boundary;
* what execution actually happens after invocation;
* why Server Actions should not be confused with ordinary JavaScript functions;
* how Server Actions fit into the Next.js execution architecture.

---

# 2. Governing Mental Model

The most important model for this part is:

```text
Server Action
     │
     ├── defined on server
     │
     ├── exposed through framework-managed mechanism
     │
     ├── referenced by client/server React code
     │
     ├── invocation crosses network boundary
     │
     ▼
Next.js server
     │
     ├── resolves action
     ├── reconstructs arguments
     ├── executes function
     └── produces result / rendering consequences
```

The critical distinction is:

```text
You are NOT sending the function to the browser.

You are sending a reference to an operation
that the server knows how to execute.
```

Conceptually:

```text
Browser

"invoke action X with these arguments"

        │
        │ network
        ▼

Next.js Server

"action X corresponds to this server function"

        │
        ▼

execute function
```

This is why Server Actions should be understood as a form of **framework-managed RPC**.

---

# 3. Normal Function vs Server Action

Consider:

```ts
async function createUser(name: string) {
  return db.user.create({
    data: { name },
  })
}
```

This is simply a JavaScript/TypeScript function.

It may execute on the server if the module containing it is server-side code.

But being server-side does not automatically make it a Server Action.

There is an important distinction:

```text
Server-only function
        ≠
Server Action
```

A server-only function might be:

```ts
async function getUserFromDatabase(id: string) {
  return db.user.findUnique({
    where: { id },
  })
}
```

It can only be called by other server-side code.

A Server Action is different because Next.js treats it as an **invokable server operation across the application boundary**.

---

# 4. What `'use server'` Means

The directive:

```ts
'use server'
```

tells the framework that the relevant function should be treated as a Server Action.

Example:

```ts
'use server'

export async function createUser(formData: FormData) {
  const name = formData.get('name')

  // server-side mutation
}
```

The important idea is:

```text
'use server'
```

does not mean:

> "Run this function on the server."

The function is already intended to be server-side.

The important meaning is:

> **Make this function available as a Server Action that can be invoked through the framework's server-action mechanism.**

This distinction matters.

---

# 5. `'use server'` Is Not Equivalent to `'use client'`

These directives represent very different architectural boundaries.

## `'use client'`

Defines a Client Component module boundary.

It tells React/Next.js:

```text
This module participates in client-side execution.
```

Example:

```tsx
'use client'

import { useState } from 'react'
```

---

## `'use server'`

Marks functions as Server Actions or establishes a server-action module context.

Example:

```ts
'use server'

export async function updateProfile(data: FormData) {
  // server execution
}
```

The architectural relationship is:

```text
'use client'
     │
     ▼
Client execution boundary


'use server'
     │
     ▼
Server Action invocation boundary
```

Do not mentally model them as symmetrical directives.

They solve different problems.

---

# 6. Inline Server Actions

A Server Action can be defined inline within a Server Component.

Example:

```tsx
export default function Page() {
  async function createProject(formData: FormData) {
    'use server'

    const name = formData.get('name')

    // create project
  }

  return (
    <form action={createProject}>
      <input name="name" />
      <button type="submit">
        Create
      </button>
    </form>
  )
}
```

Here:

```text
Page
 │
 ├── defines createProject
 │
 └── passes createProject to form action
```

The directive is placed inside the function:

```ts
async function createProject(formData: FormData) {
  'use server'
}
```

This tells Next.js:

```text
This particular function is a Server Action.
```

---

# 7. Why Inline Actions Are Useful

Inline Server Actions are useful when the action is tightly coupled to the Server Component that defines it.

For example:

```tsx
export default async function ProjectPage() {
  const project = await getProject()

  async function renameProject(formData: FormData) {
    'use server'

    const name = formData.get('name')

    await db.project.update({
      where: {
        id: project.id,
      },
      data: {
        name,
      },
    })
  }

  return (
    <form action={renameProject}>
      <input name="name" defaultValue={project.name} />
      <button>Rename</button>
    </form>
  )
}
```

The action is conceptually associated with this particular page.

The architecture is:

```text
ProjectPage
   │
   ├── project data
   │
   └── renameProject()
          │
          └── mutation for this page
```

This can make small mutations easy to understand.

---

# 8. Extracted Server Actions

As an application grows, Server Actions will often be extracted into dedicated modules.

Example:

```ts
// actions/projects.ts

'use server'

export async function createProject(formData: FormData) {
  const name = formData.get('name')

  // mutation
}
```

Then:

```tsx
import { createProject } from '@/actions/projects'

export default function ProjectPage() {
  return (
    <form action={createProject}>
      <input name="name" />
      <button>Create project</button>
    </form>
  )
}
```

The architecture becomes:

```text
Server Action module
        │
        ├── createProject()
        ├── updateProject()
        └── deleteProject()
                │
                ▼
        UI components
```

This provides a clearer separation between:

```text
UI
   │
   ▼
mutation operation
   │
   ▼
application/domain logic
```

---

# 9. Why Extract Actions?

Extraction becomes useful when actions are:

* reused;
* domain-specific;
* large;
* independently testable;
* shared by multiple UI surfaces;
* part of an application's mutation layer.

For example:

```text
actions/
├── users.ts
├── projects.ts
├── billing.ts
└── settings.ts
```

This can create a mutation architecture:

```text
UI
 │
 ├── ProjectForm
 ├── ProjectMenu
 └── ProjectSettings
        │
        ▼
actions/projects.ts
        │
        ▼
application services
        │
        ▼
database / external services
```

The action becomes the boundary between the UI invocation mechanism and server-side application logic.

---

# 10. Server Action References

One of the most important concepts is that the client does not receive the actual function implementation.

Consider:

```ts
'use server'

export async function deleteProject(id: string) {
  await db.project.delete({
    where: { id },
  })
}
```

The browser does not download:

```ts
async function deleteProject(id) {
  await db.project.delete(...)
}
```

Instead, the framework provides a mechanism by which the client can reference the server operation.

Conceptually:

```text
Server implementation

deleteProject()
     │
     ▼
Action identity
     │
     ▼
Client reference
```

The browser therefore has something closer to:

```text
"invoke this server operation"
```

rather than:

```text
"execute this JavaScript function locally"
```

---

# 11. Reference vs Execution

This distinction is critical.

Suppose:

```tsx
<form action={deleteProject}>
```

The expression:

```ts
deleteProject
```

should not be mentally interpreted as:

```text
"run deleteProject now"
```

It is a reference to the action.

Conceptually:

```text
Reference
   │
   ▼
Server Action identity
```

Later:

```text
User submits form
   │
   ▼
Action invoked
   │
   ▼
Network request
   │
   ▼
Server executes function
```

This is similar to RPC systems.

---

# 12. Server Component → Server Action

A Server Component can invoke a Server Action.

For example:

```tsx
import { createProject } from '@/actions/projects'

export default function Page() {
  return (
    <form action={createProject}>
      <input name="name" />
      <button>Create</button>
    </form>
  )
}
```

The Server Component is constructing the UI and associating the form with the action.

The important point is that the actual mutation still executes on the server.

---

# 13. Client Component → Server Action

A Client Component can also invoke a Server Action.

Example:

```tsx
'use client'

import { createProject } from '@/actions/projects'

export function CreateProject() {
  return (
    <form action={createProject}>
      <input name="name" />
      <button>Create</button>
    </form>
  )
}
```

The component itself executes in the browser.

But:

```ts
createProject
```

does not become browser-side business logic.

Instead:

```text
Client Component
       │
       │ invokes
       ▼
Server Action
       │
       │ network boundary
       ▼
Server
       │
       ▼
database
```

This is one of the most powerful aspects of Server Actions.

---

# 14. Client Component Does Not Mean Client-Side Mutation Logic

A common misconception is:

> "If a Client Component imports a Server Action, the action must run in the browser."

Incorrect.

The execution environments remain separate.

```text
Client Component
     │
     │ action reference
     ▼
Server Action
     │
     ▼
Server
```

Therefore:

```tsx
'use client'

import { updateUser } from '@/actions/users'
```

does not mean:

```text
updateUser()
```

has been bundled as normal client-side code.

The action remains a server operation.

---

# 15. Server Actions as RPC

A useful conceptual model is:

```text
Remote Procedure Call
```

Traditional RPC:

```text
Client
  │
  │ callRemoteProcedure()
  ▼
Network
  │
  ▼
Server
  │
  ▼
procedure()
```

Server Action:

```text
React UI
  │
  │ invoke action
  ▼
Next.js action protocol
  │
  ▼
Server Action
  │
  ▼
server-side logic
```

The developer experience is intentionally more function-like than manually creating an HTTP endpoint.

Instead of manually writing:

```ts
fetch('/api/projects', {
  method: 'POST',
  body: JSON.stringify(data),
})
```

the UI can work with:

```tsx
<form action={createProject}>
```

The framework handles much of the transport machinery.

---

# 16. But Server Actions Are Still Network Operations

This is a crucial senior-level distinction.

The syntax may look local:

```ts
await updateProject(id, data)
```

But if the invocation crosses from browser to server, it is not a normal local function call.

Think:

```text
Normal function:

caller
  │
  ▼
function
  │
  ▼
return
```

Server Action:

```text
caller
  │
  ▼
action reference
  │
  ▼
network
  │
  ▼
server
  │
  ▼
function execution
  │
  ▼
response
```

Therefore network concerns still exist:

* latency;
* failure;
* serialization;
* retries;
* duplicate submissions;
* authentication;
* authorization;
* server errors;
* stale UI.

Later KPI 04 parts will address these concerns individually.

---

# 17. Passing Arguments

Server Actions can receive arguments that can cross the supported serialization boundary.

For example:

```ts
'use server'

export async function deleteProject(id: string) {
  await db.project.delete({
    where: {
      id,
    },
  })
}
```

Conceptually:

```text
Client
   │
   │ id
   ▼
Server Action
   │
   ▼
deleteProject(id)
```

But the important principle remains:

> **Arguments crossing the boundary must be representable by the framework's supported serialization model.**

Do not assume arbitrary JavaScript values can cross.

For example, these should immediately raise architectural questions:

```text
Database connection
Class instance
Function
Socket
File handle
Process object
```

The boundary is not equivalent to passing values inside one JavaScript process.

---

# 18. Bound Arguments and UI Invocation

An action may be associated with additional arguments through supported React/Next.js mechanisms.

Conceptually:

```text
Action

updateProject(projectId, formData)
```

can be connected to UI that already knows:

```text
projectId = "123"
```

while the submitted form supplies:

```text
formData
```

The important mental model is:

```text
UI context
     +
submitted data
     ↓
Server Action
```

This becomes particularly useful for resource-specific mutations.

Example:

```text
Rename Project 123
Delete Project 123
Archive Project 123
```

The action must still treat incoming values as untrusted input.

Security belongs to Part 07, but the architectural implication starts here.

---

# 19. Passing Server Actions as Props

Server Components can pass Server Actions to Client Components.

Example:

```tsx
import { ProjectForm } from './ProjectForm'

export default function Page() {
  async function createProject(formData: FormData) {
    'use server'

    // mutation
  }

  return (
    <ProjectForm action={createProject} />
  )
}
```

Client Component:

```tsx
'use client'

export function ProjectForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>
}) {
  return (
    <form action={action}>
      <input name="name" />
      <button>Create</button>
    </form>
  )
}
```

Architecture:

```text
Server Component
      │
      │ Server Action reference
      ▼
Client Component
      │
      │ user interaction
      ▼
Server Action
      │
      ▼
server execution
```

This is a powerful composition pattern.

---

# 20. Why This Pattern Matters

It allows you to keep:

```text
server-side mutation logic
```

on the server while allowing:

```text
interactive form UI
```

to remain client-side.

For example:

```text
Server
 └── page
      └── passes action
           ↓
Client
 └── interactive form
      └── invokes action
           ↓
Server
 └── mutation
```

This prevents unnecessary movement of business logic into the browser.

---

# 21. Function Reference Is Not Function Serialization

This is one of the most important concepts in the entire KPI.

Consider:

```tsx
<ClientForm action={createProject} />
```

Do not think:

```text
serialize JavaScript function
        ↓
send function to browser
```

Think:

```text
identify Server Action
        ↓
create framework-managed reference
        ↓
send reference through React/Next.js mechanism
        ↓
client can invoke reference
        ↓
framework routes invocation to server
```

The implementation stays server-side.

---

# 22. Why This Matters for Secrets

Suppose:

```ts
'use server'

export async function createInvoice(data: FormData) {
  const stripeSecret =
    process.env.STRIPE_SECRET_KEY

  // use secret
}
```

The secret remains server-side because:

```text
Server Action implementation
        │
        ▼
server runtime
        │
        ▼
secret environment variable
```

The browser receives only the ability to invoke the action.

This is one reason Server Actions are useful for server-owned operations.

However:

> **Server-side execution does not automatically make the operation secure.**

The caller may still be able to invoke the action.

Authentication and authorization must therefore be enforced inside the action.

That is covered in Part 07.

---

# 23. Inline vs Extracted Actions

A practical architectural comparison:

| Dimension           | Inline Action        | Extracted Action   |
| ------------------- | -------------------- | ------------------ |
| Locality            | High                 | Lower              |
| Reuse               | Limited              | High               |
| Small mutation      | Excellent            | Good               |
| Shared mutation     | Poor                 | Excellent          |
| Discoverability     | Near UI              | Centralized        |
| Domain organization | Limited              | Strong             |
| Testing             | Possible             | Easier to isolate  |
| Large application   | Can become cluttered | Usually preferable |

A useful rule:

```text
Closely coupled + small
        → inline

Reusable + domain-oriented
        → extracted
```

This is not a hard law.

The decision should follow ownership and complexity.

---

# 24. Server Action Module Organization

A scalable structure might look like:

```text
src/
├── actions/
│   ├── projects.ts
│   ├── users.ts
│   ├── billing.ts
│   └── settings.ts
│
├── components/
│   ├── ProjectForm.tsx
│   └── UserForm.tsx
│
├── lib/
│   ├── db.ts
│   └── auth.ts
│
└── app/
    ├── projects/
    └── users/
```

The responsibilities become:

```text
components/
    UI behavior

actions/
    mutation boundary

lib/
    reusable server/application infrastructure

database/
    persistence
```

This is cleaner than allowing every Client Component to contain its own custom API request implementation.

---

# 25. Server Action vs API Route

These are not identical architectural mechanisms.

## Traditional API Route

```text
Client
   │
   │ fetch()
   ▼
HTTP endpoint
   │
   ▼
handler
   │
   ▼
database
```

You explicitly define:

```text
URL
HTTP method
request parsing
response format
```

---

## Server Action

```text
React UI
   │
   │ action reference
   ▼
Next.js action mechanism
   │
   ▼
Server Action
   │
   ▼
database
```

The framework integrates the operation directly with React.

---

# 26. When Server Actions Are a Better Fit

Server Actions are particularly natural for:

```text
UI-driven mutations
```

Examples:

```text
Create project
Rename project
Update profile
Archive task
Delete comment
Change preference
Submit form
Add item
Remove item
```

The interaction is closely coupled to the application's React UI.

---

# 27. When an API Boundary May Still Be Appropriate

Not every backend operation should automatically become a Server Action.

An explicit API may be more appropriate when:

```text
External clients need the endpoint
        OR
mobile applications consume the API
        OR
third-party integrations consume the API
        OR
you need a public HTTP contract
        OR
non-React clients depend on the interface
```

Think architecturally:

```text
Internal UI mutation
        → Server Action

Public/external API contract
        → API endpoint
```

This distinction becomes important when designing full-stack applications.

---

# 28. Invocation Lifecycle

A simplified Server Action invocation looks like:

```text
1. User interacts with UI
        │
        ▼
2. Action reference is invoked
        │
        ▼
3. Next.js constructs action request
        │
        ▼
4. Request crosses network boundary
        │
        ▼
5. Server resolves action
        │
        ▼
6. Arguments are reconstructed
        │
        ▼
7. Server Action executes
        │
        ▼
8. Result / rendering effects return
        │
        ▼
9. React UI updates
```

This is the foundational lifecycle for the rest of KPI 04.

---

# 29. The Three Boundaries You Must Track

Every Server Action should be understood through three boundaries.

## Boundary 1 — Code Boundary

```text
Browser code
     │
     │
     ▼
Server code
```

---

## Boundary 2 — Network Boundary

```text
Client
   │
   │ HTTP/network
   ▼
Server
```

---

## Boundary 3 — Trust Boundary

```text
User-controlled input
        │
        ▼
Server Action
        │
        ▼
trusted server operations
```

The third boundary is particularly important.

The fact that an action executes on the server does not mean its arguments are trustworthy.

---

# 30. Common Incorrect Mental Models

## Incorrect Model 1

> "`'use server'` means the function is simply server-side."

Incomplete.

The important concept is that the function becomes a framework-managed Server Action.

---

## Incorrect Model 2

> "The browser downloads the function."

Incorrect.

The browser receives a mechanism/reference for invoking the server operation.

---

## Incorrect Model 3

> "Calling a Server Action is a local function call."

Incorrect.

A client-to-server invocation crosses a network boundary.

---

## Incorrect Model 4

> "Client Components cannot use Server Actions."

Incorrect.

Client Components can invoke Server Actions through supported mechanisms.

---

## Incorrect Model 5

> "Server Actions replace every API."

Incorrect.

They are particularly optimized for UI-driven mutations, not every possible API architecture.

---

## Incorrect Model 6

> "Server Action means secure."

Incorrect.

The action still requires authentication, authorization, input validation, and careful handling of sensitive data.

---

# 31. Production Scenario — Project Management Application

Imagine:

```text
Project Management App
```

The user sees:

```text
Project
 ├── Name
 ├── Description
 ├── Members
 └── Actions
      ├── Rename
      ├── Archive
      └── Delete
```

You define:

```ts
'use server'

export async function renameProject(
  projectId: string,
  formData: FormData
) {
  const name = formData.get('name')

  await db.project.update({
    where: {
      id: projectId,
    },
    data: {
      name,
    },
  })
}
```

The client form can invoke it:

```tsx
<form action={renameProject}>
```

Conceptually:

```text
Project UI
    │
    │ rename
    ▼
Server Action reference
    │
    ▼
network
    │
    ▼
renameProject()
    │
    ▼
database
```

The database logic never needs to become client-side JavaScript.

---

# 32. Debugging Model

When a Server Action behaves unexpectedly, ask these questions in order.

### Question 1

Is the function actually a Server Action?

```text
Is 'use server' correctly applied?
```

### Question 2

Where is the caller executing?

```text
Server Component?
Client Component?
```

### Question 3

Is the invocation crossing the network?

If the caller is client-side:

```text
yes
```

### Question 4

What arguments are crossing the boundary?

```text
string?
number?
FormData?
object?
unsupported value?
```

### Question 5

Did the server action actually execute?

Check server logs.

### Question 6

Did the mutation succeed?

Check:

```text
database
external service
transaction
```

### Question 7

What should happen to the UI afterward?

That leads directly into:

* form state;
* cache invalidation;
* revalidation;
* optimistic updates.

Those belong to later parts of the KPI.

---

# 33. Prediction Challenge

Consider:

```tsx
'use client'

import { createUser } from '@/actions/users'

export function UserForm() {
  return (
    <form action={createUser}>
      <input name="email" />
      <button>Create</button>
    </form>
  )
}
```

And:

```ts
'use server'

export async function createUser(formData: FormData) {
  const email = formData.get('email')

  console.log('SERVER:', email)

  await db.user.create({
    data: {
      email: String(email),
    },
  })
}
```

Predict:

### Question 1

Where does `UserForm` execute?

```text
Browser
```

### Question 2

Where does `createUser` execute?

```text
Server
```

### Question 3

Does the database code get bundled into the client?

```text
No
```

### Question 4

Does invoking the action cross a network boundary?

```text
Yes
```

### Question 5

Is `email` trustworthy merely because it reached the Server Action?

```text
No
```

These five answers demonstrate whether the execution model is understood.

---

# 34. Senior-Level Architecture Principle

A strong architecture separates:

```text
Invocation mechanism
        ↓
Server Action
        ↓
Application logic
        ↓
Infrastructure
```

For example:

```text
Client Form
     │
     ▼
createProject()
     │
     ▼
Project Service
     │
     ▼
Repository
     │
     ▼
Database
```

The Server Action should not necessarily become a giant business-logic container.

Poor architecture:

```text
Server Action
 ├── auth
 ├── validation
 ├── business rules
 ├── database
 ├── email
 ├── payment
 ├── cache
 └── logging
```

Better:

```text
Server Action
      │
      ├── authenticate
      ├── validate
      │
      ▼
Application Service
      │
      ├── business rules
      ├── transaction
      └── domain operations
             │
             ▼
       infrastructure
```

The Server Action is primarily an **application boundary**, not necessarily the entire application layer.

---

# 35. SDE-2 Interview Questions

You should be able to answer these without documentation.

### Question 1

What does `'use server'` actually do?

### Question 2

How is a Server Action different from a normal server-side function?

### Question 3

Does the Server Action implementation get sent to the browser?

### Question 4

Can a Client Component invoke a Server Action?

### Question 5

What crosses the Server/Client boundary?

### Question 6

Why should Server Actions be thought of as RPC?

### Question 7

Why isn't a Server Action invocation equivalent to a local function call?

### Question 8

When would you use an API route instead?

### Question 9

What is the difference between an action reference and action execution?

### Question 10

Why does server execution not automatically imply authorization?

A strong SDE-2 answer should connect:

```text
React
  +
Next.js
  +
RSC
  +
network boundary
  +
serialization
  +
server execution
  +
application architecture
```

rather than simply saying:

> "Server Actions run on the server."

---

# 36. Completion Checklist

You should consider this part complete only when you can explain:

## Core

* [ ] What `'use server'` means
* [ ] What makes a function a Server Action
* [ ] Server-only function vs Server Action
* [ ] Inline Server Actions
* [ ] Extracted Server Actions

## Execution

* [ ] Server Component invocation
* [ ] Client Component invocation
* [ ] Network boundary
* [ ] Action reference
* [ ] Action execution
* [ ] Server-side implementation

## Architecture

* [ ] RPC mental model
* [ ] Server Action vs API route
* [ ] When to extract actions
* [ ] Passing actions to Client Components
* [ ] Application-layer separation

## Boundary reasoning

* [ ] What crosses the boundary
* [ ] Serialization constraints
* [ ] Why function implementation stays server-side
* [ ] Why server execution does not equal authorization

## Debugging

* [ ] Determine caller execution environment
* [ ] Determine action execution environment
* [ ] Determine whether a network boundary exists
* [ ] Inspect transmitted arguments
* [ ] Verify server execution
* [ ] Verify mutation result

---

# 37. Final Mental Model

The most important model from this part is:

```text
                 SERVER
┌───────────────────────────────────────────┐
│                                           │
│   Server Action Implementation             │
│            │                              │
│            ▼                              │
│      Application Logic                    │
│            │                              │
│            ▼                              │
│       Database / APIs                     │
│                                           │
└───────────────────────────────────────────┘
             ▲
             │
        Network Boundary
             │
             ▼
┌───────────────────────────────────────────┐
│                 CLIENT                    │
│                                           │
│     Client Component / Browser UI         │
│              │                            │
│              ▼                            │
│       Action Reference                    │
│                                           │
└───────────────────────────────────────────┘
```

Therefore:

> **A Server Action is not a normal function transported to the browser. It is a server-owned operation exposed through a framework-managed invocation mechanism.**

The execution model is:

```text
Define
  ↓
Expose as Server Action
  ↓
Create/reference action
  ↓
User invokes
  ↓
Cross network boundary
  ↓
Server resolves action
  ↓
Server executes
  ↓
Result/rendering consequences
```

And the architectural principle is:

> **Keep mutation execution on the server while allowing React UI to invoke that mutation through a controlled framework boundary.**

This is the foundation required before understanding forms, pending state, action state, optimistic updates, and security.

---

# Part Boundary

This part intentionally stops at:

```text
How Server Actions are defined
How they become invokable
How references cross boundaries
How invocation reaches the server
```

It does **not** deeply cover:

```text
FormData mechanics       → Part 03
Pending UI               → Part 04
useActionState           → Part 05
Optimistic UI            → Part 06
Authentication/security  → Part 07
```

That separation keeps the KPI architecture non-overlapping.
