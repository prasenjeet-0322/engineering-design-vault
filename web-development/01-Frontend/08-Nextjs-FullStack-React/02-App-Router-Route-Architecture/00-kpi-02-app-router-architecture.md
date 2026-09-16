# KPI 02 — App Router & Route Architecture

## Objective

Understand how the Next.js App Router turns the filesystem and route configuration into an application navigation and execution architecture.

The goal is not merely to know how to create routes.

The goal is to reason about:

* how URLs map to the component tree
* how folders become route segments
* how layouts participate in route composition
* how dynamic segments are resolved
* how nested routes are assembled
* how route groups affect organization
* how parallel routes create independent UI regions
* how intercepting routes alter navigation behavior
* how navigation differs from a traditional full-page request
* how route architecture affects rendering, data access, caching, loading, errors, and performance

The central question is:

> **Given a URL and a navigation event, what route tree does Next.js construct, which segments participate, and what work must execute or change?**

---

# Governing Mental Model

Do not think:

```text
URL
 ↓
Page component
```

Think:

```text
URL
 ↓
Route Tree
 ↓
Route Segments
 ↓
Layouts / Templates / Pages
 ↓
Server + Client Component Tree
 ↓
Data / Rendering / Cache Decisions
 ↓
Response / Navigation Update
```

The App Router is therefore not simply a routing library.

It is an architectural mechanism for defining the relationship between:

```text
URL
Route hierarchy
Component hierarchy
Layout hierarchy
Execution boundaries
Loading boundaries
Error boundaries
Data dependencies
Navigation behavior
```

A route is an architectural composition, not just a pathname.

---

# Part 01 — App Router Mental Model

## Objective

Understand what the App Router actually represents and why it is fundamentally different from treating routing as a simple URL-to-component lookup.

---

## 1. Routing Is a Tree

A route such as:

```text
/dashboard/settings/profile
```

should be reasoned about as:

```text
dashboard
└── settings
    └── profile
```

Each segment can participate in the resulting UI tree.

Conceptually:

```text
Root Layout
    │
    └── Dashboard Layout
            │
            └── Settings Layout
                    │
                    └── Profile Page
```

The URL hierarchy and UI hierarchy can therefore be related.

This is one of the most important App Router concepts.

---

## 2. Route Segment ≠ React Component

A route segment represents a routing boundary.

A component represents a rendering unit.

They are related, but they are not identical.

For example:

```text
app/
└── dashboard/
    ├── layout.tsx
    └── page.tsx
```

The `dashboard` segment can participate in:

* URL matching
* layout composition
* loading boundaries
* error boundaries
* data dependencies
* navigation transitions

Therefore:

```text
route segment
    ≠
component
```

A route segment is an architectural concept.

---

# Part 02 — Filesystem-Based Route Architecture

## Objective

Understand how the `app` directory becomes the structural definition of the application's route tree.

A simplified structure:

```text
app/
├── layout.tsx
├── page.tsx
├── dashboard/
│   ├── layout.tsx
│   ├── page.tsx
│   └── settings/
│       └── page.tsx
└── products/
    └── page.tsx
```

Corresponding URLs:

```text
/                   → app/page.tsx
/dashboard          → app/dashboard/page.tsx
/dashboard/settings → app/dashboard/settings/page.tsx
/products           → app/products/page.tsx
```

The filesystem becomes part of the routing architecture.

---

## Route Segment Rule

A folder generally represents a route segment.

A `page.tsx` represents the UI for that route.

A `layout.tsx` represents persistent UI surrounding child segments.

Conceptually:

```text
folder
   ↓
route segment

page.tsx
   ↓
route endpoint UI

layout.tsx
   ↓
shared segment UI
```

---

# Part 03 — Pages and Route Endpoints

## Objective

Understand the role of `page.tsx` and why a folder alone does not necessarily create a publicly accessible page.

Example:

```text
app/
└── dashboard/
    └── page.tsx
```

creates:

```text
/dashboard
```

But:

```text
app/
└── dashboard/
    └── components/
        └── Chart.tsx
```

does not mean:

```text
/dashboard/components
```

The route architecture is therefore intentionally separated from arbitrary component organization.

This distinction matters when designing large applications.

---

# Part 04 — Nested Routes

## Objective

Understand how nested folders produce nested route segments and how nested routing corresponds to nested UI composition.

Example:

```text
app/
└── account/
    ├── page.tsx
    └── security/
        └── page.tsx
```

produces:

```text
/account
/account/security
```

The important architectural question is not simply:

> "What URL does this folder produce?"

It is:

> "What hierarchy of UI and responsibilities does this route introduce?"

For example:

```text
/account
```

may own:

* account navigation
* account-level authorization
* account-level data

while:

```text
/account/security
```

owns:

* security-specific data
* security-specific UI
* security-specific mutations

This creates natural ownership boundaries.

---

# Part 05 — Dynamic Route Segments

## Objective

Understand routes whose path is determined by runtime values.

Example:

```text
app/
└── products/
    └── [id]/
        └── page.tsx
```

This represents:

```text
/products/123
/products/456
/products/abc
```

Conceptually:

```text
/products/[id]
       ↓
dynamic route segment
       ↓
runtime parameter
```

The route parameter becomes part of the server-side request context.

---

## Dynamic Segments

Common forms include:

```text
[id]
```

for one segment.

```text
[...slug]
```

for a catch-all sequence.

```text
[[...slug]]
```

for an optional catch-all sequence.

The architectural distinction is:

```text
[id]
```

means:

```text
exactly one dynamic segment
```

while:

```text
[...slug]
```

means:

```text
one or more segments
```

and:

```text
[[...slug]]
```

means:

```text
zero or more segments
```

---

# Part 06 — Route Parameters vs Query Parameters

## Objective

Understand the difference between path-based routing state and search/query state.

Example:

```text
/products/123
```

contains:

```text
route parameter:
id = 123
```

Whereas:

```text
/products?sort=price&page=2
```

contains:

```text
search parameters:
sort = price
page = 2
```

These are architecturally different.

### Route Parameter

Usually identifies the resource or hierarchical location.

```text
/products/123
```

### Search Parameter

Usually modifies the representation or query.

```text
/products?sort=price
```

This distinction becomes important for:

* caching
* rendering
* SEO
* navigation
* data fetching
* state management

---

# Part 07 — Route Groups

## Objective

Understand how route groups allow filesystem organization without changing the public URL.

Example:

```text
app/
├── (marketing)/
│   ├── about/
│   │   └── page.tsx
│   └── pricing/
│       └── page.tsx
└── (application)/
    └── dashboard/
        └── page.tsx
```

The parentheses indicate organizational grouping.

Conceptually:

```text
filesystem structure
        ≠
public URL structure
```

For example:

```text
app/(marketing)/pricing/page.tsx
```

maps to:

```text
/pricing
```

not:

```text
/(marketing)/pricing
```

---

## Why Route Groups Matter

They allow architectural organization around concerns such as:

```text
(marketing)
(application)
(auth)
(admin)
```

without forcing those concerns into the public URL.

This is particularly useful for large applications.

---

# Part 08 — Multiple Route Trees

Route groups can also help organize applications into separate architectural areas.

Example:

```text
app/
├── (public)/
│   ├── page.tsx
│   └── pricing/
│       └── page.tsx
│
└── (authenticated)/
    ├── dashboard/
    │   └── page.tsx
    └── settings/
        └── page.tsx
```

The filesystem communicates:

```text
public application area
        +
authenticated application area
```

This can improve architectural clarity.

However:

> A route group itself does not magically implement authentication.

Authentication still requires explicit authorization logic.

---

# Part 09 — Parallel Routes

## Objective

Understand how multiple independently addressable UI regions can coexist within the same route.

Parallel routes use named slots.

Conceptually:

```text
dashboard/
├── @analytics/
├── @activity/
├── layout.tsx
└── page.tsx
```

The architecture becomes:

```text
Dashboard
├── Analytics Region
└── Activity Region
```

Instead of thinking:

```text
one URL
    ↓
one component tree
```

you can reason about:

```text
one route
    ↓
multiple UI regions
    ↓
independent route composition
```

---

## Why Parallel Routes Exist

They are useful for applications such as:

```text
Admin dashboards
Mail applications
Multi-pane interfaces
Complex workspaces
Modal systems
Independent navigation regions
```

For example:

```text
┌──────────────────────────────┐
│ Navigation                  │
├──────────────┬───────────────┤
│              │               │
│ Analytics    │ Activity      │
│              │               │
└──────────────┴───────────────┘
```

Different regions can have different routing states.

---

# Part 10 — Intercepting Routes

## Objective

Understand navigation scenarios where a route can be rendered inside the context of the current route instead of performing a normal full-page transition.

A classic example is a modal.

Suppose:

```text
/photos/123
```

is a normal photo page.

From:

```text
/photos
```

a navigation to:

```text
/photos/123
```

could display the photo inside a modal while preserving the underlying gallery.

Conceptually:

```text
Gallery
   │
   └── Photo navigation
           ↓
      intercepted route
           ↓
      Photo Modal
```

But directly loading:

```text
/photos/123
```

can still produce:

```text
Full Photo Page
```

This creates different rendering behavior depending on navigation context.

---

# Part 11 — Route Architecture and Navigation

## Objective

Understand why navigation in the App Router should not be mentally modeled as:

```text
click
 ↓
browser reload
 ↓
new HTML document
```

Modern navigation can instead involve:

```text
current route tree
       ↓
navigation intent
       ↓
new route tree
       ↓
determine changed segments
       ↓
fetch required server-rendered data
       ↓
merge result into existing UI
```

This is a major conceptual shift.

---

# Part 12 — Persistent Layouts

## Objective

Understand why layouts can remain mounted while child routes change.

Consider:

```text
/dashboard
/dashboard/settings
/dashboard/billing
```

with:

```text
dashboard/
├── layout.tsx
├── page.tsx
├── settings/
│   └── page.tsx
└── billing/
    └── page.tsx
```

The conceptual tree is:

```text
Dashboard Layout
       │
       ├── Dashboard Page
       │
       ├── Settings Page
       │
       └── Billing Page
```

When navigating:

```text
/dashboard
        ↓
/dashboard/settings
```

the dashboard layout can persist while the child content changes.

This is fundamentally different from reconstructing the entire page for every navigation.

---

# Part 13 — Route Architecture and State Ownership

Routing decisions influence where state should live.

Suppose:

```text
/dashboard
/dashboard/projects
/dashboard/projects/123
```

There may be state at several levels:

```text
Dashboard state
Project-list state
Project-detail state
```

The architecture should ask:

> Which route owns this state?

For example:

```text
dashboard/layout.tsx
```

may own persistent dashboard navigation.

```text
projects/page.tsx
```

may own project listing concerns.

```text
projects/[id]/page.tsx
```

may own project-specific concerns.

This prevents unrelated state from being elevated unnecessarily.

---

# Part 14 — Route Architecture and Data Ownership

Routes often establish natural data boundaries.

Example:

```text
/dashboard/projects/[id]
```

may require:

```text
project
project members
activity
permissions
```

The route hierarchy can therefore become a useful organizational boundary for server-side data dependencies.

However:

> Route hierarchy should not automatically determine every data dependency.

A single piece of data may be shared across multiple routes.

The correct design depends on:

* reuse
* latency
* caching
* ownership
* authorization
* consistency requirements

---

# Part 15 — Route Architecture and Authorization

A common mistake is assuming:

```text
/authenticated/
```

means:

```text
automatically authenticated
```

It does not.

A route structure can communicate architectural intent:

```text
(authenticated)
```

but authorization still needs enforcement.

A robust model is:

```text
request
 ↓
identity
 ↓
authorization decision
 ↓
route execution
 ↓
data access
```

The security boundary must exist in actual execution logic.

Filesystem organization alone is not a security boundary.

---

# Part 16 — Route-Level Loading Boundaries

Route architecture also interacts with loading behavior.

A segment can have:

```text
loading.tsx
```

which establishes a loading UI boundary.

Conceptually:

```text
Route Segment
      │
      ├── loading UI
      │
      └── actual content
```

This allows slow work in a route segment to be represented without blocking the entire application UI.

The important architectural idea is:

```text
route hierarchy
       +
loading hierarchy
```

can work together.

---

# Part 17 — Route-Level Error Boundaries

Similarly, route segments can define error handling boundaries.

Conceptually:

```text
Application
   │
   ├── Dashboard
   │      │
   │      └── error boundary
   │
   └── Marketing
```

A failure in one subtree does not necessarily need to destroy unrelated application regions.

This is an important resilience property.

The architecture becomes:

```text
route tree
   ↓
execution boundaries
   ↓
failure boundaries
```

rather than:

```text
one global failure boundary
```

---

# Part 18 — Route Architecture as a Dependency Graph

A sophisticated way to reason about App Router architecture is to model each route segment as a node.

For example:

```text
/
│
├── marketing
│   ├── pricing
│   └── about
│
└── dashboard
    ├── projects
    │   └── [id]
    └── settings
```

Each node can have:

```text
UI
Data
Authorization
Loading
Error handling
Caching
Navigation behavior
```

Therefore:

```text
Route Tree
    ↓
Architectural Dependency Graph
```

This becomes particularly important in large applications.

---

# Part 19 — Route Design Heuristics

When designing a route, ask:

### 1. Does the URL represent a meaningful resource?

Bad:

```text
/a/b/c
```

Good:

```text
/projects/123/settings
```

---

### 2. Does the hierarchy represent a meaningful UI hierarchy?

If:

```text
/projects
/projects/123
```

share persistent UI, the nesting may be valuable.

---

### 3. Does the route need independent loading behavior?

If yes, a segment boundary may be useful.

---

### 4. Does the route need independent error handling?

If yes, isolate the relevant subtree.

---

### 5. Does the route represent a different authorization boundary?

If yes, model that boundary explicitly.

---

### 6. Does the route need a different layout?

If yes, introduce the appropriate layout architecture.

---

### 7. Is the URL hierarchy becoming artificial?

Do not create deep nesting simply because the filesystem allows it.

---

# Part 20 — Route Architecture Anti-Patterns

## Anti-Pattern 1 — Treating the App Router as a URL Map

Weak mental model:

```text
URL → page.tsx
```

Better:

```text
URL
 ↓
route tree
 ↓
layout/page composition
 ↓
execution
 ↓
rendering
```

---

## Anti-Pattern 2 — Putting Everything Under One Route

Example:

```text
/dashboard
```

with hundreds of unrelated client-side states.

This can create:

* difficult ownership
* poor isolation
* unnecessary complexity
* weak navigation semantics

---

## Anti-Pattern 3 — Over-Nesting Routes

This:

```text
/company/organization/business/platform/products/catalog
```

is not automatically better architecture.

Route depth should communicate meaningful domain or UI hierarchy.

---

## Anti-Pattern 4 — Using Route Groups as Security

This is incorrect:

```text
(authenticated)
```

therefore:

```text
secure
```

Route groups organize architecture.

Authorization must actually be enforced.

---

## Anti-Pattern 5 — Confusing URL Structure with Component Structure

Not every reusable component deserves a route.

For example:

```text
components/
├── Button.tsx
├── Modal.tsx
└── DataTable.tsx
```

should not become:

```text
/button
/modal
/data-table
```

Routing and component reuse solve different problems.

---

# Part 21 — Production Scenario: SaaS Dashboard

Suppose we need:

```text
/dashboard
/dashboard/projects
/dashboard/projects/[id]
/dashboard/settings
```

A reasonable architecture could be:

```text
app/
└── dashboard/
    ├── layout.tsx
    ├── page.tsx
    │
    ├── projects/
    │   ├── page.tsx
    │   └── [id]/
    │       ├── page.tsx
    │       └── loading.tsx
    │
    └── settings/
        └── page.tsx
```

Architectural reasoning:

```text
dashboard/
    ↓
persistent dashboard shell

projects/
    ↓
project domain

[id]/
    ↓
individual project

loading.tsx
    ↓
project-detail loading boundary
```

This is more useful than simply memorizing folder conventions.

---

# Part 22 — Production Scenario: E-Commerce

Consider:

```text
/products
/products/[slug]
/categories/[slug]
/cart
/checkout
```

Potential ownership:

```text
/products
    ↓
catalog

/products/[slug]
    ↓
product detail

/categories/[slug]
    ↓
category representation

/cart
    ↓
shopping state

/checkout
    ↓
transaction workflow
```

The routes communicate different domain responsibilities.

But the architecture must still determine:

* which data is server-owned
* which state is client-owned
* which pages are dynamic
* which data is cacheable
* where authentication is required
* where mutations occur

Routing is one architectural layer, not the entire architecture.

---

# Part 23 — Navigation Decision Model

When evaluating a navigation flow, reason through:

```text
1. What URL is being requested?
        ↓
2. Which route segments change?
        ↓
3. Which layouts remain?
        ↓
4. Which page/subtree changes?
        ↓
5. Which server work is required?
        ↓
6. Which client state remains?
        ↓
7. Which loading/error boundaries apply?
        ↓
8. What data crosses the network?
        ↓
9. What UI is updated?
```

This is the correct level of reasoning for SDE-2 interviews.

---

# Part 24 — Architecture Decision Matrix

| Requirement                                | Appropriate Architecture |
| ------------------------------------------ | ------------------------ |
| Public URL                                 | Route segment            |
| Shared persistent UI                       | Layout                   |
| Route-specific page                        | `page.tsx`               |
| Dynamic resource                           | Dynamic segment          |
| Filesystem organization without URL change | Route group              |
| Multiple independently rendered regions    | Parallel route           |
| Context-sensitive modal navigation         | Intercepting route       |
| Route-specific loading UI                  | Loading boundary         |
| Route-specific failure isolation           | Error boundary           |
| Persistent shell across navigation         | Nested layout            |
| Resource identity                          | Path parameter           |
| Representation/filter state                | Search parameter         |

---

# Part 25 — Prediction Challenges

## Challenge 1

Given:

```text
app/
└── products/
    └── [id]/
        └── page.tsx
```

What URLs can reach this page?

### Answer

Examples:

```text
/products/1
/products/abc
/products/xyz
```

The `[id]` segment is dynamic.

---

## Challenge 2

Given:

```text
app/
└── (admin)/
    └── users/
        └── page.tsx
```

What is the public URL?

### Answer

```text
/users
```

The route group does not appear in the URL.

---

## Challenge 3

Given:

```text
app/
└── dashboard/
    ├── layout.tsx
    ├── page.tsx
    └── settings/
        └── page.tsx
```

What can remain persistent when navigating:

```text
/dashboard
        ↓
/dashboard/settings
```

### Answer

The dashboard layout can remain persistent while the child route changes.

---

## Challenge 4

Does this:

```text
app/(authenticated)/dashboard/page.tsx
```

guarantee that the user is authenticated?

### Answer

No.

It communicates filesystem organization.

Authentication and authorization must still be enforced by actual application logic.

---

# Part 26 — Senior Interview Gotchas

### Gotcha 1

**"Every folder creates a route."**

Incorrect.

A folder participates in route structure, but a publicly renderable page generally requires the appropriate route file such as `page.tsx`.

---

### Gotcha 2

**"Route groups appear in URLs."**

Incorrect.

Route groups are organizational.

---

### Gotcha 3

**"Layouts are just reusable components."**

Incomplete.

Layouts participate in the routing architecture and can persist across child navigation.

---

### Gotcha 4

**"Dynamic routes mean client-side routing."**

Incorrect.

Dynamic route resolution is part of the application routing architecture and can execute on the server.

---

### Gotcha 5

**"A route boundary automatically provides authorization."**

Incorrect.

Routing structure and security enforcement are separate concerns.

---

### Gotcha 6

**"The route hierarchy is only about URLs."**

Incorrect.

In the App Router, route hierarchy influences:

```text
UI composition
layout persistence
loading boundaries
error boundaries
navigation
data ownership
rendering architecture
```

---

# Part 27 — Debugging Route Problems

When a route behaves unexpectedly, do not immediately modify components.

Start with:

```text
1. What URL was requested?
2. Which filesystem path should match?
3. Which segments are static?
4. Which segments are dynamic?
5. Are route groups involved?
6. Are parallel routes involved?
7. Are intercepting routes involved?
8. Which layouts participate?
9. Which page participates?
10. Which loading/error boundaries participate?
```

Then inspect:

```text
execution
 ↓
data
 ↓
rendering
 ↓
navigation
```

This avoids debugging the wrong layer.

---

# Part 28 — Route Architecture Review Checklist

Before approving a production route architecture:

### URL Design

* [ ] URLs represent meaningful domain resources.
* [ ] Dynamic segments are used intentionally.
* [ ] Search parameters are separated from resource identity.
* [ ] Route depth is justified.

### UI Composition

* [ ] Shared UI is represented through appropriate layouts.
* [ ] Route-specific UI remains local.
* [ ] Persistent UI has an intentional ownership boundary.

### Organization

* [ ] Route groups are used when filesystem organization differs from URL structure.
* [ ] Route structure does not become artificially complex.

### Loading

* [ ] Slow route segments have appropriate loading boundaries.
* [ ] Loading UI is placed at the correct architectural level.

### Error Handling

* [ ] Failure-prone subtrees have appropriate error boundaries.
* [ ] One failure does not unnecessarily destroy unrelated UI.

### Security

* [ ] Authentication is enforced independently of filesystem organization.
* [ ] Authorization is enforced at the appropriate execution/data boundary.

### Navigation

* [ ] Navigation behavior is understood.
* [ ] Persistent layouts are intentional.
* [ ] Modal/intercepted navigation is used only where it improves UX.

### Data

* [ ] Data ownership aligns with route responsibilities.
* [ ] Route boundaries are not being used as arbitrary data boundaries.

---

# Part 29 — SDE-2 Competency Standard

You should be able to look at:

```text
app/
├── (marketing)/
├── (auth)/
├── dashboard/
│   ├── layout.tsx
│   ├── projects/
│   │   └── [id]/
│   └── settings/
└── api/
```

and explain:

```text
which paths are public
which segments are dynamic
which layouts persist
which route boundaries exist
which folders are organizational only
which UI regions may be parallel
where loading boundaries can exist
where errors can be isolated
where authorization must actually execute
```

without relying on memorized rules alone.

---

# Part 30 — KPI 02 Master Mental Model

The complete App Router model should now be:

```text
                    URL
                     │
                     ▼
              Route Resolution
                     │
                     ▼
                Route Tree
                     │
          ┌──────────┼──────────┐
          │          │          │
       Layout      Page      Segments
          │                     │
          │                Dynamic Params
          │                     │
          └──────────┬──────────┘
                     ▼
              UI Composition
                     │
          ┌──────────┼──────────┐
          │          │          │
       Loading      Error     Navigation
       Boundary    Boundary    Behavior
          │          │          │
          └──────────┼──────────┘
                     ▼
             Server / Client
                Architecture
                     │
                     ▼
             Data + Rendering
                     │
                     ▼
                 Response
```

The key insight is:

> **The App Router is a tree-based application architecture that connects URL structure with UI composition, navigation, execution boundaries, loading boundaries, and failure boundaries.**

It is therefore much more than a pathname-to-component mapping system.

---

# KPI 02 Completion Criteria

KPI 02 is complete only when you can independently:

1. Design an App Router filesystem for a production application.
2. Convert a URL hierarchy into a route tree.
3. Explain static and dynamic segments.
4. Distinguish route parameters from search parameters.
5. Explain nested layouts and persistence.
6. Use route groups intentionally.
7. Explain parallel route architecture.
8. Explain intercepting-route use cases.
9. Reason about route-level loading boundaries.
10. Reason about route-level error boundaries.
11. Explain how navigation changes the route tree.
12. Identify which parts of the UI persist during navigation.
13. Separate routing organization from authorization.
14. Determine appropriate route ownership boundaries.
15. Debug route-resolution problems systematically.
16. Review a production route architecture and identify unnecessary complexity.

---

# Final KPI 02 Principle

Do not memorize:

```text
"folder X means feature Y"
```

Instead reason:

```text
URL
 ↓
Route Tree
 ↓
Segment Boundaries
 ↓
Layout/Page Composition
 ↓
Navigation
 ↓
Loading/Error Boundaries
 ↓
Execution
 ↓
Data
 ↓
Rendering
```

That is the App Router mental model required for serious Next.js architecture work.
