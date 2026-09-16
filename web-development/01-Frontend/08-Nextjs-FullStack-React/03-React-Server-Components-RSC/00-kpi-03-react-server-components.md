# KPI 03 — React Server Components (RSC) & Execution Boundaries

## Objective

Master the execution model of **React Server Components (RSC)** in Next.js.

This KPI focuses on understanding the strict boundaries between **Server** and **Client** environments, how to effectively compose Server and Client Components, and the serialization rules required to pass data across the network boundary.

The goal is not to memorize:

```text
Server Component = server
Client Component = browser
```

The goal is to reason precisely about:

```text
where code executes
when it executes
what APIs it can access
what dependencies it can import
what data crosses the boundary
what becomes part of the client bundle
what is serialized
what remains server-only
```

---

# Governing Question

For every component written in this KPI, the engineer must be able to answer:

> **Where does this component execute, what environment capabilities does it possess, and what data must cross the network to render it?**

Use this mental model:

```text
Component
   │
   ├── Execution Environment
   │      ├── Server
   │      └── Client
   │
   ├── Environment Capabilities
   │      ├── Database
   │      ├── Secrets
   │      ├── Node APIs
   │      ├── Browser APIs
   │      └── React client interactivity
   │
   ├── Dependencies
   │
   └── Network Boundary
          │
          ▼
       Serialized
          Data
```

The fundamental question is therefore not:

> "Is this component a Server Component or Client Component?"

It is:

> **What execution environment does this component belong to, and where should the boundary be placed?**

---

# Part 01 — The RSC Paradigm Shift

## Objective

Understand why React introduced Server Components and how RSC changes the traditional mental model of React applications.

---

## 1. Traditional React Mental Model

A traditional client-heavy React application can be modeled as:

```text
Browser
   │
   ├── JavaScript bundle
   │
   ├── React runtime
   │
   ├── Components
   │
   └── API requests
          │
          ▼
       Backend
```

Much of the application logic eventually reaches the browser.

The browser therefore needs:

* JavaScript
* React runtime
* component code
* client-side data-fetching logic
* state management
* event handlers

---

# 2. Server Components Change the Boundary

RSC introduces another execution model:

```text
                    Application
                        │
             ┌──────────┴──────────┐
             │                     │
          Server                Browser
             │                     │
      Server Components       Client Components
             │                     │
      database / APIs        state / effects
      secrets / services     browser APIs
             │                     │
             └──── network ────────┘
```

Some React components can execute entirely on the server.

Their implementation does not need to become browser JavaScript simply because it is a React component.

---

# 3. Zero-Bundle-Size React Components

A key RSC benefit is that Server Component implementation code does not need to be shipped to the browser as client component code.

Consider:

```tsx
export default async function ProductPage() {
  const product = await getProduct();

  return <ProductDetails product={product} />;
}
```

If this remains a Server Component, the browser does not need the implementation of:

```text
ProductPage
getProduct
server-only dependencies
database client
server-side business logic
```

as browser JavaScript.

The browser receives the necessary representation of the resulting component tree.

This is the architectural meaning behind the idea of:

> **zero-bundle-size React components**

It does **not** mean that the rendered UI requires zero bytes of network data.

It means the Server Component's implementation does not need to be included in the client JavaScript bundle.

---

# 4. Backend Logic Inside Components

Server Components can execute server-side application logic directly.

Conceptually:

```text
Server Component
      │
      ├── database
      ├── filesystem
      ├── internal services
      ├── environment variables
      └── server-side libraries
```

This can eliminate unnecessary browser-to-API-to-database chains.

Traditional pattern:

```text
Browser
   ↓
React Component
   ↓
HTTP API
   ↓
Backend Service
   ↓
Database
```

Potential Server Component pattern:

```text
Server Component
   ↓
Backend Service / Database
```

The correct architecture depends on the application boundary and security requirements.

---

# 5. RSC Is Not SSR

This distinction is essential.

**Server-Side Rendering (SSR)** describes where HTML rendering work occurs.

**React Server Components (RSC)** describe where React component logic executes and how the component tree is represented across server/client boundaries.

They are related but not equivalent.

Think:

```text
SSR
↓
HTML generation strategy
```

while:

```text
RSC
↓
Component execution + component-tree transport model
```

A system can use server rendering without the architectural model being identical to RSC.

---

# 6. The Critical Distinction

Do not reason:

```text
Server Component
=
HTML generated on server
```

Instead:

```text
Server Component
=
component whose React logic executes in the server environment
```

The resulting application may involve:

```text
RSC payload
+
HTML
+
Client JavaScript
```

depending on the application's architecture.

---

# 7. RSC Mental Model

The high-level model is:

```text
Server Component Tree
        │
        ▼
Server Execution
        │
        ▼
RSC Representation
        │
        ├───────────────┐
        │               │
        ▼               ▼
HTML / UI          Client Component References
                        │
                        ▼
                  Browser Runtime
```

The browser reconstructs the appropriate React tree using the information delivered from the server and the client-side JavaScript required for Client Components.

---

# Part 02 — Server Components (The Default)

## Objective

Understand why Server Components are the default in the App Router and how that default determines the initial execution environment of a component.

---

# 1. Server Components Are the Default

In the Next.js App Router model, a component is a Server Component unless it enters a Client Component boundary.

Conceptually:

```tsx
export default function Dashboard() {
  return <h1>Dashboard</h1>;
}
```

is treated as a Server Component.

You do not normally write:

```tsx
"use server";
```

at the top of an ordinary Server Component.

---

# 2. `'use server'` Is Not the Opposite of `'use client'`

This distinction is critical.

Do not teach yourself:

```text
"use client" → client component

"use server" → server component
```

That is an incorrect mental model.

Ordinary Server Components are already the default.

`"use server"` is associated with server-side functions / Server Actions rather than being the normal marker for declaring every Server Component.

That topic belongs more deeply to the mutation architecture later in the curriculum.

---

# 3. Async Server Components

Server Components can naturally perform asynchronous server-side work.

Example:

```tsx
export default async function Dashboard() {
  const data = await getDashboardData();

  return <DashboardView data={data} />;
}
```

This allows the component tree to participate directly in asynchronous server-side data access.

The important architectural distinction is:

```text
Server Component
     ↓
server-side async work
```

versus:

```text
Client Component
     ↓
browser-side async work
```

These are different execution environments.

---

# 4. Direct Data Access

A Server Component can potentially access:

```text
database
internal services
server-side SDKs
filesystem
private environment variables
```

Example:

```tsx
export default async function UserPage() {
  const user = await database.user.findById(...);

  return <UserProfile user={user} />;
}
```

This avoids unnecessarily exposing a database API to the browser.

---

# 5. Server Components and Secrets

Server Components can access server-only secrets because their implementation executes in a server environment.

For example:

```text
DATABASE_URL
PRIVATE_API_KEY
INTERNAL_SERVICE_TOKEN
```

should remain on the server.

The architecture must nevertheless ensure that those values do not cross the network boundary accidentally.

This distinction is fundamental:

```text
Server-only access
        ≠
safe to return to client
```

A Server Component can access a secret without making the secret safe to serialize.

---

# 6. `server-only`

For modules that must never be imported into client-side code, the `server-only` package can be used to explicitly mark server-only modules.

Conceptually:

```text
server-only module
       │
       ├── database client
       ├── secret access
       └── private service logic
```

Then an accidental client-side import can be detected rather than silently creating an architectural leak.

The principle is:

> **Make execution assumptions explicit at dependency boundaries.**

---

# 7. Server Component Capabilities

A Server Component can generally reason about:

```text
✓ database access
✓ private service calls
✓ server environment variables
✓ server-side libraries
✓ async server execution
✓ server-side computation
```

It cannot assume access to:

```text
✗ window
✗ document
✗ browser event handlers
✗ browser storage
✗ client-only React interaction APIs
```

The environment determines the capability set.

---

# Part 03 — The Client Boundary (`'use client'`)

## Objective

Understand what `'use client'` actually does and why its architectural effect extends beyond the file where it appears.

---

# 1. `'use client'` Defines a Boundary

Consider:

```tsx
"use client";

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
}
```

The directive communicates that this module belongs to the Client Component side of the architecture.

The important mental model is:

```text
"use client"
      ↓
Client Boundary
      ↓
Client dependency graph
```

It is therefore not merely a label saying:

> "Run this one component in the browser."

---

# 2. The Dependency Graph

Consider:

```text
A
└── B
    └── C
```

If:

```text
B
```

enters the client boundary, the dependency graph must be reasoned about accordingly.

Conceptually:

```text
Client Boundary
      │
      ├── B
      ├── dependencies
      └── dependencies of dependencies
```

This is why `'use client'` placement has bundle and architecture consequences.

---

# 3. Browser Capabilities

Client Components are appropriate when the component requires browser capabilities such as:

```text
useState
useEffect
event handlers
window
document
localStorage
Web APIs
browser-only libraries
```

For example:

```tsx
"use client";

export function SearchInput() {
  const [query, setQuery] = useState("");

  return (
    <input
      value={query}
      onChange={(event) => setQuery(event.target.value)}
    />
  );
}
```

This requires client execution because state and browser interaction are involved.

---

# 4. The Leaf Node Pattern

A strong architectural principle is:

> **Push the Client Component boundary as far down the component tree as practical.**

Instead of:

```text
Page
 ↓
"use client"
 ↓
Entire application subtree
```

prefer:

```text
Server Page
   │
   ├── Server Header
   ├── Server Content
   ├── Server Data
   └── Client SearchInput
```

This keeps the interactive surface small.

---

# 5. Why Boundary Placement Matters

Compare:

```text
"use client"
ApplicationShell
 ├── Navigation
 ├── ProductList
 ├── ProductDetails
 ├── Footer
 └── SearchInput
```

against:

```text
ApplicationShell
 ├── Navigation
 ├── ProductList
 ├── ProductDetails
 ├── Footer
 └── SearchInput
          ↑
      "use client"
```

The second architecture preserves more server-side execution and limits client responsibilities.

---

# 6. Poisonous Imports

A dangerous pattern is:

```text
Client Component
      │
      ▼
shared utility
      │
      ▼
server-only dependency
```

For example:

```text
Client Component
   ↓
userService.ts
   ↓
database SDK
```

This is an architectural dependency problem.

The issue is not merely:

> "Can the code compile?"

The issue is:

> **What execution environment is this dependency graph now asking for?**

Server-only modules should be protected from accidental client consumption.

---

# 7. Boundary Placement Rule

When deciding whether a component should become client-side, ask:

```text
Does it require:
    ↓
state?
effects?
event handlers?
browser APIs?
client-only library?
```

If not, first consider keeping it on the server.

This leads to:

```text
Server by default
        ↓
Client only where required
```

rather than:

```text
Client by default
        ↓
move things back to server later
```

---

# Part 04 — Crossing the Boundary (Serialization)

## Objective

Understand how data moves from Server Components to Client Components and why serialization is a fundamental architectural constraint.

---

# 1. The Network Boundary

Consider:

```text
Server Component
      │
      │ props
      ▼
Client Component
```

Those props are conceptually crossing a network/runtime boundary.

Therefore the data cannot simply be an arbitrary JavaScript object graph.

The framework must be able to represent the value in the RSC transport model.

---

# 2. Think in Terms of Data Transfer

Do not think:

```text
server function calls client component
```

Think:

```text
server execution
      ↓
data representation
      ↓
network boundary
      ↓
client reconstruction
```

This is much closer to the architectural reality.

---

# 3. DTOs

A strong pattern is to explicitly create a Data Transfer Object.

Instead of passing an entire database entity:

```text
Database Entity
 ├── internal fields
 ├── ORM metadata
 ├── methods
 ├── relationships
 └── private data
```

transform it:

```text
DTO
 ├── id
 ├── name
 ├── displayName
 └── status
```

Then:

```text
Database
   ↓
Server Component
   ↓
DTO
   ↓
RSC boundary
   ↓
Client Component
```

This creates a controlled data contract.

---

# 4. Why DTO Transformation Matters

It prevents:

```text
accidental secret exposure
unnecessary payload size
leaking persistence-layer structure
coupling UI to ORM models
serialization problems
```

Example:

```ts
const userDTO = {
  id: user.id,
  name: user.name,
  avatarUrl: user.avatarUrl,
};
```

Then:

```tsx
<UserCard user={userDTO} />
```

is much safer architecturally than passing a complex persistence object blindly.

---

# 5. What Should Not Cross

The important rule is not merely:

> "Everything must be JSON."

The RSC serialization model supports more than plain JSON primitives, but you must still treat the boundary as a constrained serialization contract.

Values that should not be treated as transferable application state include things such as:

```text
database connections
open sockets
server resources
arbitrary server functions
ORM clients
request-scoped infrastructure objects
```

The boundary transports data—not server execution environments.

---

# 6. Functions Are a Special Case

A normal JavaScript function is not simply serializable application data.

This:

```tsx
<ClientComponent
  onSomething={serverFunction}
/>
```

cannot be treated as an ordinary function transfer.

A server-side function does not become executable browser code merely because it was passed as a prop.

Special framework mechanisms exist for server-side mutations/functions, but those belong to the Server Actions architecture.

Therefore:

```text
ordinary function
        ≠
serializable prop
```

---

# 7. Serialization Debugging

When a boundary fails, ask:

```text
What value am I passing?
        ↓
What is its actual runtime type?
        ↓
Does the RSC transport support it?
        ↓
Is this really data?
        ↓
Am I accidentally passing server infrastructure?
```

Do not immediately change the component architecture.

First inspect the boundary contract.

---

# Part 05 — Interleaving Server and Client Components

## Objective

Understand how Server and Client Components can be composed together without forcing an entire subtree into the browser.

---

# 1. The Common Misconception

A frequent incorrect assumption is:

```text
Client Component
      ↓
renders Server Component
      ↓
therefore Server Component becomes Client Component
```

That is too simplistic.

The architecture supports composition patterns where server-rendered content is passed through Client Components.

---

# 2. The `children` Composition Pattern

Consider:

```tsx
"use client";

export function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value={...}>
      {children}
    </ThemeContext.Provider>
  );
}
```

Then:

```tsx
<ThemeProvider>
  <ServerContent />
</ThemeProvider>
```

The important idea is that:

```text
ServerContent
```

can remain server-rendered content rather than automatically turning its implementation into client JavaScript simply because it appears beneath a Client Component in the conceptual JSX hierarchy.

---

# 3. Composition Instead of Importing

This distinction is crucial.

A Client Component directly importing a Server Component is a different relationship from receiving already-composed server content through props such as `children`.

Conceptually:

### Risky mental model

```text
Client
  ↓ imports
Server
```

### Composition model

```text
Server
  ↓ composes
Client Wrapper
  ↓ receives
Server-rendered children
```

This allows client wrappers to surround server content.

---

# 4. Client Wrappers

Common examples include:

```text
ThemeProvider
AuthProvider
StateProvider
TooltipProvider
UI interaction wrapper
```

Architecture:

```text
Server Layout
     │
     ▼
Client Provider
     │
     ├── Server Header
     ├── Server Navigation
     └── Server Page
```

The provider needs client capabilities.

The nested application content does not necessarily need to become client-side.

---

# 5. Root Layout Example

Instead of:

```tsx
"use client";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
      </body>
    </html>
  );
}
```

because the entire root layout now belongs to the client boundary, consider:

```tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

where:

```tsx
"use client";

export function ThemeProvider({ children }) {
  ...
}
```

The client boundary is pushed into the provider rather than consuming the entire root layout.

---

# 6. RSC Payload Mental Model

The browser does not receive a simplistic:

```text
HTML only
```

model.

The architecture involves an RSC representation that allows React to reconstruct the appropriate tree and identify Client Components.

Conceptually:

```text
Server
  │
  ├── Server Component output
  ├── Client Component references
  └── serialized props
          │
          ▼
       RSC Payload
          │
          ▼
       Browser React
```

This is one reason RSC should not be reduced to "server-side HTML rendering."

---

# 7. Interleaving Architecture

A useful model is:

```text
                    Server
                      │
              ┌───────┴───────┐
              │               │
          Server UI       Client Component
              │               │
              │          client behavior
              │               │
              └───────┬───────┘
                      │
                  composition
                      │
                      ▼
                   Browser
```

The application can therefore have both execution environments in one logical React tree.

---

# Part 06 — Third-Party Libraries and Context Providers

## Objective

Understand how external libraries interact with RSC boundaries and how to introduce React Context without unnecessarily converting large parts of the application into Client Components.

---

# 1. Third-Party Client Libraries

Suppose a library contains:

```tsx
function Widget() {
  const [open, setOpen] = useState(false);

  ...
}
```

but the library's component does not declare:

```tsx
"use client";
```

The component may not be directly compatible with the Server Component environment.

The problem is not that the library is "bad."

The problem is:

```text
library execution requirements
        ≠
Server Component capabilities
```

---

# 2. Boundary Wrapper Pattern

Create a small client wrapper:

```tsx
"use client";

import { ThirdPartyWidget } from "third-party-library";

export function WidgetWrapper() {
  return <ThirdPartyWidget />;
}
```

Then:

```text
Server Component
      │
      ▼
WidgetWrapper
      │
      ▼
Third-party client library
```

This makes the execution boundary explicit.

---

# 3. Why Wrappers Are Valuable

A wrapper gives you:

```text
boundary ownership
dependency isolation
controlled API
smaller client surface
easier replacement
clear architectural intent
```

It prevents third-party implementation details from determining the architecture of the entire application.

---

# 4. React Context

React Context is commonly associated with client-side state and therefore usually requires a Client Component provider.

Example:

```tsx
"use client";

export function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value={...}>
      {children}
    </ThemeContext.Provider>
  );
}
```

The provider itself belongs to the client environment.

That does **not** mean every component beneath it must automatically become a Client Component.

---

# 5. Provider Placement

Weak architecture:

```text
"use client"

RootLayout
    │
    └── entire application
```

Better:

```text
Server Root Layout
        │
        ▼
Client Provider
        │
        ▼
Application Tree
```

The client boundary is placed at the provider's actual requirement.

---

# 6. Provider Placement Principle

Ask:

> **What is the smallest subtree that actually requires this context?**

If only the dashboard requires a provider:

```text
Root
├── Marketing
└── Dashboard
      │
      └── Client Provider
```

Do not automatically place it at the root.

This follows the same architectural principle:

```text
Minimize client boundary surface area.
```

---

# 7. Third-Party Dependency Review

When adding a library, ask:

```text
Does it use:
    ↓
useState?
useEffect?
browser APIs?
event handlers?
context?
DOM APIs?
```

If yes, determine whether it belongs behind a Client Component boundary.

Then ask:

```text
How large is its dependency graph?
```

A tiny client wrapper around a huge browser library may still create substantial client JavaScript.

---

# RSC Boundary Decision Framework

For every component, walk through this sequence:

```text
                 Component
                     │
                     ▼
        Does it require browser capabilities?
               /               \
             YES                NO
              │                 │
              ▼                 ▼
        Client boundary     Server by default
              │                 │
              ▼                 ▼
    How small can boundary   Can it access
       become?               server resources?
              │                 │
              ▼                 ▼
      Push boundary down    Keep secrets server-side
              │                 │
              └────────┬────────┘
                       ▼
                What crosses boundary?
                       │
                       ▼
                  Serialize data
```

---

# RSC Dependency Graph

A senior engineer should reason about dependencies as a graph, not individual files.

Example:

```text
ProductPage
    │
    ├── ProductService
    │      └── Database
    │
    ├── ProductCard
    │
    └── AddToCartButton
              │
              └── Client Component
```

The architecture becomes:

```text
                Server
                  │
          ┌───────┴────────┐
          │                │
    ProductService    ProductCard
          │                │
       Database             │
                           │
                     AddToCartButton
                           │
                         Client
```

The goal is not to eliminate Client Components.

The goal is to put them exactly where browser execution is actually required.

---

# Common Architectural Mistakes

## Mistake 1 — Treating `'use client'` as a small annotation

Incorrect:

```text
"use client"
=
this one component runs in browser
```

Better:

```text
"use client"
=
establishes a Client Component boundary
```

and then reason about its dependency graph.

---

## Mistake 2 — Adding `'use client'` to the root layout

This is often unnecessary.

If only a provider requires client capabilities:

```text
Server Root Layout
       ↓
Client Provider
       ↓
Application
```

is generally a better boundary architecture.

---

## Mistake 3 — Assuming Server Components are SSR

Incorrect:

```text
Server Component = SSR
```

Better:

```text
RSC
=
component execution / transport model

SSR
=
server-side HTML rendering strategy
```

---

## Mistake 4 — Passing database entities directly to clients

This can expose:

```text
internal fields
large object graphs
persistence details
sensitive data
serialization problems
```

Prefer an explicit DTO.

---

## Mistake 5 — Passing arbitrary functions across the boundary

A JavaScript function is not simply transferable application data.

Use an appropriate server/client interaction mechanism rather than assuming the function can execute across environments.

---

## Mistake 6 — Making everything client-side

Weak:

```text
"use client"
Application
```

Better:

```text
Server Application
 ├── Server UI
 ├── Server Data
 ├── Server Logic
 └── Client Interactive Islands
```

The second model preserves the architectural advantages of RSC.

---

# Production Scenario 01 — Product Page

Requirement:

```text
Product page
 ├── Product information
 ├── Reviews
 ├── Add to cart
 └── Image gallery
```

Possible architecture:

```text
ProductPage                 Server
│
├── ProductDetails          Server
├── Reviews                 Server
├── ImageGallery            Client
└── AddToCartButton         Client
```

Reasoning:

```text
ProductDetails
    ↓
database/server access
    ↓
Server Component

Reviews
    ↓
server data access
    ↓
Server Component

ImageGallery
    ↓
interactive browser state
    ↓
Client Component

AddToCartButton
    ↓
browser interaction
    ↓
Client Component
```

The page itself does not need to become client-side merely because two descendants are interactive.

---

# Production Scenario 02 — Secret Exposure

Suppose:

```tsx
const result = await privateService({
  token: process.env.PRIVATE_TOKEN,
});
```

is performed in a Server Component.

This is appropriate only if the resulting response contains safe data.

Incorrect:

```tsx
<ClientComponent
  data={{
    token: process.env.PRIVATE_TOKEN,
  }}
/>
```

The secret has now crossed the boundary.

The key rule is:

```text
Server-only execution
        ≠
automatically server-only data
```

You must control the output.

---

# Production Scenario 03 — Client Bundle Explosion

Suppose:

```text
"use client"
Dashboard
   ↓
chart library
   ↓
large dependency tree
   ↓
multiple server-unaware utilities
```

The problem may not be the dashboard itself.

The problem is boundary placement.

Possible redesign:

```text
Server Dashboard
    │
    ├── Server Metrics
    ├── Server Table
    └── Client Chart
             │
             └── chart library
```

The client dependency is isolated to the actual interactive visualization.

---

# Prediction Challenges

## Challenge 1

Given:

```tsx
export default async function Page() {
  const data = await database.query();

  return <ClientView data={data} />;
}
```

Where does the database query execute?

### Answer

On the server, assuming `Page` remains a Server Component and the database access occurs in server-compatible code.

The result then crosses the server/client boundary as data.

---

# Challenge 2

Given:

```tsx
"use client";

export function Search() {
  const [query, setQuery] = useState("");
}
```

Why is this client-side?

### Answer

Because the component requires client-side React state and browser interaction.

---

# Challenge 3

Given:

```tsx
export default function Layout({ children }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}
```

where `ThemeProvider` is:

```tsx
"use client";
```

Does the layout itself have to become a Client Component?

### Answer

No.

The provider can establish the client boundary while the surrounding layout remains server-side.

---

# Challenge 4

A Server Component passes:

```tsx
<ClientComponent
  user={databaseUser}
/>
```

Should you automatically pass the complete database entity?

### Answer

No.

First define the client-facing data contract and transform the persistence object into an appropriate DTO.

---

# Challenge 5

A Client Component imports:

```text
userService
    ↓
databaseClient
```

What should you investigate?

### Answer

The dependency graph.

The client boundary may be pulling server-only dependencies into a client-oriented module graph. The service should be redesigned or split so that server-only infrastructure remains server-side.

---

# Senior Interview Gotchas

## Gotcha 1

**"Server Components are just SSR components."**

Incorrect.

RSC and SSR describe different architectural concepts.

---

## Gotcha 2

**"`use client` means only this component goes to the browser."**

Incomplete.

It establishes a client boundary whose dependency graph must be considered.

---

## Gotcha 3

**"If a Client Component is somewhere above a Server Component, everything below becomes client-side."**

Incorrect as a general rule.

Composition through patterns such as `children` allows server-rendered content to be passed through client wrappers.

---

## Gotcha 4

**"`use server` is required for every Server Component."**

Incorrect.

Server Components are the default in the App Router.

---

## Gotcha 5

**"Anything available on the server is safe to pass to the client."**

Incorrect.

Execution location and data confidentiality are separate concerns.

---

## Gotcha 6

**"DTOs are only a backend concern."**

Incorrect.

DTOs are highly valuable at Server → Client boundaries because they create explicit transport contracts.

---

## Gotcha 7

**"Third-party React libraries automatically work as Server Components."**

Incorrect.

Their implementation may depend on client-only APIs.

A Client Component wrapper can establish the required boundary.

---

# Debugging Framework

When an RSC problem appears, classify it before changing code.

```text
RSC Problem
    │
    ├── Execution Problem
    │      └── wrong environment
    │
    ├── Dependency Problem
    │      └── server/client import violation
    │
    ├── Boundary Problem
    │      └── "use client" placed too high
    │
    ├── Serialization Problem
    │      └── unsupported data crossing boundary
    │
    ├── Security Problem
    │      └── secret/private data crossing boundary
    │
    └── Bundle Problem
           └── excessive client dependency graph
```

Then ask:

```text
Where does the component execute?
        ↓
Why does it need that environment?
        ↓
What does it import?
        ↓
What crosses the boundary?
        ↓
What reaches the browser?
```

---

# RSC Architecture Review Checklist

## Execution

* [ ] Every component has an intentional execution environment.
* [ ] Server Components remain the default where appropriate.
* [ ] Client Components exist because browser capabilities are required.

## Boundary

* [ ] Client boundaries are as low in the tree as practical.
* [ ] Root-level client boundaries are justified.
* [ ] Client wrappers isolate interactive libraries.

## Dependencies

* [ ] Server-only modules cannot accidentally enter client dependency graphs.
* [ ] Database clients remain server-side.
* [ ] Private SDKs remain server-side.
* [ ] Browser-only dependencies remain client-side.

## Data

* [ ] Data crossing the boundary has an explicit contract.
* [ ] DTOs are used where persistence objects are inappropriate.
* [ ] Secrets never cross the boundary.
* [ ] Server infrastructure objects never cross the boundary.

## Composition

* [ ] Server and Client Components are intentionally interleaved.
* [ ] Client providers do not unnecessarily convert surrounding architecture into client code.
* [ ] `children` composition is understood and used where appropriate.

## Third-Party Libraries

* [ ] Client-only libraries are isolated behind appropriate boundaries.
* [ ] Their dependency size is understood.
* [ ] Missing `"use client"` directives are handled through explicit wrappers where necessary.

---

# SDE-2 Competency Standard

You should be able to look at a component tree such as:

```text
DashboardPage
│
├── DashboardHeader
├── Analytics
│    └── Chart
├── ActivityFeed
└── FilterPanel
```

and independently determine:

```text
DashboardPage
    → Server

DashboardHeader
    → Server

Analytics
    → Server

Chart
    → Client

ActivityFeed
    → Server

FilterPanel
    → Client
```

Then explain:

```text
Why is each component server/client?
What dependencies does each component have?
What data crosses the boundary?
What must be serialized?
What enters the browser bundle?
Where could secrets leak?
Where could a client boundary be moved lower?
```

That is the required competency.

---

# KPI 03 Master Mental Model

The complete model should now be:

```text
                         React Component
                               │
                               ▼
                    Execution Environment
                         /           \
                     Server          Client
                       │                │
             ┌─────────┼──────┐     ┌───┼─────────┐
             │         │      │     │   │         │
          Database   Secrets  APIs  State Effects Browser
             │         │      │     │   │         │
             └─────────┴──────┘     └───┴─────────┘
                       │                │
                       └──── Boundary ──┘
                              │
                              ▼
                         Serialization
                              │
                              ▼
                          RSC Payload
                              │
                              ▼
                           Browser
```

The architectural rule is:

> **Keep computation and dependencies in the environment where they belong, and move only the minimum required data across the Server–Client boundary.**

---

# KPI 03 Completion Criteria

KPI 03 is complete only when you can independently:

1. Explain the RSC paradigm shift.
2. Distinguish RSC from SSR.
3. Explain why Server Components are the default.
4. Explain why ordinary Server Components do not require `"use server"`.
5. Use asynchronous server-side work inside Server Components.
6. Reason about direct database and internal-service access.
7. Protect server-only dependencies and secrets.
8. Explain precisely what `"use client"` establishes.
9. Analyze a Client Component dependency graph.
10. Push client boundaries toward leaf nodes where practical.
11. Detect poisonous server imports into client code.
12. Design DTOs for Server → Client data transfer.
13. Explain serialization constraints.
14. Explain why arbitrary server functions and infrastructure cannot simply cross the boundary.
15. Compose Server and Client Components using appropriate patterns.
16. Explain the `children` composition pattern.
17. Build client wrappers around third-party libraries.
18. Place React Context providers without unnecessarily converting the application root into a Client Component.
19. Diagnose execution, dependency, serialization, security, and bundle-boundary problems.
20. Explain the complete Server → Boundary → Client lifecycle without reducing RSC to SSR.

---

# Final KPI 03 Principle

The most important rule of this KPI is:

```text
Do not ask:
"Should this component be Server or Client?"

Ask:
"What capabilities does this component require,
where should those capabilities execute,
and what is the smallest boundary that satisfies them?"
```

The resulting architecture should generally trend toward:

```text
                  SERVER
                    │
       ┌────────────┼────────────┐
       │            │            │
     Data         Logic        UI
       │            │            │
       └────────────┼────────────┘
                    │
             Client Boundary
                    │
             Minimum Data
                    │
                    ▼
                  CLIENT
                    │
          ┌─────────┼─────────┐
          │         │         │
        State     Effects   Browser APIs
          │         │         │
          └─────────┼─────────┘
                    │
              User Interaction
```

**Server by default. Client by necessity. Boundary as low as practical. Data crossing the boundary must be intentional.**

That is the execution-boundary model required for advanced Next.js development.
