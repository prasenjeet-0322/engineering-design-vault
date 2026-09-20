# Level 08 — Next.js & Full-Stack React

## KPI 09 — Metadata, SEO & Document Representation

# Part 03 — Dynamic Metadata Generation with `generateMetadata()`

---

# 1. Part Objective

Static metadata works when the metadata is known independently of the requested resource.

But consider:

```text
/products/123
/articles/react-server-components
/authors/john-doe
```

The final metadata depends on the resource identified by the route.

For example:

```text
/products/123
        │
        ▼
Product 123
        │
        ├── name
        ├── description
        ├── image
        └── availability
        │
        ▼
Dynamic Metadata
```

The central Next.js mechanism for this problem is:

```text
generateMetadata()
```

The goal of this part is to understand the complete architecture:

```text
Request
  ↓
Route parameters
  ↓
Resource lookup
  ↓
Metadata derivation
  ↓
Metadata resolution
  ↓
Document head
```

The senior-level question is not:

> "How do I use `generateMetadata()`?"

It is:

> **What data does metadata depend on, where is that data resolved, how is it cached, and how does the resulting metadata remain consistent with the rendered representation?**

---

# 2. Static vs Dynamic Metadata

The distinction from Part 02 becomes critical.

## Static

```ts
export const metadata = {
  title: 'Products',
};
```

Conceptually:

```text
Route
 ↓
Known metadata
 ↓
Document
```

## Dynamic

```text
Route parameter
      ↓
Resource lookup
      ↓
Resource-dependent metadata
```

Conceptually:

```text
/products/[id]
       ↓
params.id
       ↓
loadProduct(id)
       ↓
product.name
       ↓
metadata.title
```

Therefore:

```text
Static metadata
    =
metadata known without resource resolution

Dynamic metadata
    =
metadata derived from request/route/resource context
```

---

# 3. The `generateMetadata()` Mental Model

A useful abstraction is:

```text
generateMetadata(context)
        │
        ▼
Resolve dependencies
        │
        ▼
Construct metadata
        │
        ▼
Next.js metadata resolution
        │
        ▼
Document head
```

The function should be treated as a **representation derivation function**.

Conceptually:

```text
Metadata = f(
    route params,
    search/context where applicable,
    resource data,
    parent metadata
)
```

The output should describe the document that the route is rendering.

---

# 4. Dynamic Route Example

Consider:

```text
app/
└── products/
    └── [id]/
        └── page.tsx
```

The route:

```text
/products/123
```

contains:

```text
id = 123
```

The application can resolve:

```text
Product {
    id: 123
    name: "MacBook Pro"
    description: "..."
    image: "..."
}
```

Then metadata can derive:

```text
title:
MacBook Pro

description:
product.description

openGraph:
product.image
```

The architecture becomes:

```text
URL
 │
 ▼
Route params
 │
 ▼
Product ID
 │
 ▼
Product data
 │
 ├──────────────┐
 ▼              ▼
Page UI      Metadata
```

This shared dependency is extremely important.

---

# 5. Metadata and Page Data Should Share Domain Identity

A weak architecture might do:

```text
Page:
loadProduct(123)

Metadata:
loadSomethingElse(123)
```

Now two independent data paths can disagree.

For example:

```text
Page:
"MacBook Pro 2026"

Metadata:
"MacBook Pro 2025"
```

A stronger architecture recognizes:

```text
Product 123
     │
     ├── Page representation
     └── Metadata representation
```

Both derive from the same domain identity.

The principle is:

> **Metadata and UI should agree on the resource they represent.**

---

# 6. Metadata Is a Derived Representation

Think of:

```text
Product
```

as the source domain object.

From it we derive:

```text
             Product
                │
       ┌────────┴────────┐
       ▼                 ▼
   UI model         Metadata model
       │                 │
       ▼                 ▼
   Page body         Document head
```

This means metadata is not normally an independent source of truth.

For example:

```text
product.name
```

may become:

```text
title
```

while:

```text
product.description
```

may become:

```text
description
```

and:

```text
product.primaryImage
```

may become:

```text
openGraph.images
```

---

# 7. Route Params Are Part of the Dependency Graph

For:

```text
/articles/[slug]
```

the metadata dependency might be:

```text
slug
 ↓
article lookup
 ↓
article
 ↓
metadata
```

For:

```text
/products/[category]/[id]
```

it might be:

```text
category + id
        ↓
resource resolution
        ↓
product
        ↓
metadata
```

The important point is:

```text
Route parameters
        ↓
Resource identity
        ↓
Metadata identity
```

A metadata implementation that ignores route identity is usually incomplete for dynamic routes.

---

# 8. `generateMetadata()` Should Be Deterministic

For a given representation context:

```text
tenant
locale
route params
resource version
```

metadata should be predictably derived.

Conceptually:

```text
same representation context
        ↓
same metadata
```

unless there is an explicit time-dependent dependency.

For example:

```text
Product 123
locale=en
tenant=acme
```

should not randomly produce:

```text
Title A
```

on one request and:

```text
Title B
```

on another request without an underlying resource change.

Determinism makes caching, debugging, and testing dramatically easier.

---

# 9. Metadata Generation Is Not Arbitrary Business Logic

A common architectural mistake is allowing:

```text
generateMetadata()
```

to become a general-purpose business-logic container.

For example:

```text
generateMetadata()
    ├── mutate database
    ├── send email
    ├── create order
    ├── update analytics
    └── load unrelated systems
```

That is the wrong boundary.

Metadata generation should primarily:

```text
resolve representation dependencies
        ↓
derive metadata
```

It should not become a side-effect engine.

---

# 10. Read-Oriented Architecture

A good conceptual model is:

```text
generateMetadata()
        │
        ├── read route context
        ├── read domain data
        ├── derive representation
        └── return metadata
```

Not:

```text
generateMetadata()
        │
        └── mutate application state
```

This keeps metadata generation:

* predictable
* cacheable
* testable
* observable
* safe to execute as part of rendering

---

# 11. Metadata and Data Fetching

Dynamic metadata often requires data fetching.

Example:

```text
generateMetadata()
        │
        ▼
getProduct(id)
        │
        ▼
product
```

The important question becomes:

> What happens if the page itself also calls `getProduct(id)`?

You may have:

```text
Metadata
   │
   └── getProduct(123)

Page
   │
   └── getProduct(123)
```

At first glance this appears to be duplicate work.

But the correct analysis is not simply:

> "Two function calls are bad."

Instead ask:

```text
Are they reading the same resource?
Is the data access cacheable?
Can requests be memoized/deduplicated?
What is the cache lifetime?
What is the invalidation strategy?
```

This is where metadata intersects directly with KPI 06's caching architecture.

---

# 12. Shared Data Dependency

The ideal dependency graph is:

```text
                   Product 123
                       │
              ┌────────┴────────┐
              ▼                 ▼
          Metadata             Page
              │                 │
              ▼                 ▼
          <head>              <body>
```

Both representations depend on the same underlying product data.

If the product changes:

```text
Product updated
      │
      ├── Page becomes stale
      └── Metadata becomes stale
```

The invalidation strategy should therefore account for both.

---

# 13. Data Cache vs Metadata Output

Do not confuse:

```text
resource data cache
```

with:

```text
final metadata output
```

For example:

```text
Product Data
     │
     ▼
Cached data
     │
     ├───────────────┐
     ▼               ▼
Metadata         Page Rendering
     │               │
     ▼               ▼
<head>            <body>
```

The data cache may be shared between multiple consumers.

The resulting metadata and rendered page are representations derived from that data.

This distinction becomes critical when designing invalidation.

---

# 14. Dynamic Metadata and Cache Reuse

Suppose:

```text
getProduct(123)
```

is expensive.

If both:

```text
generateMetadata()
```

and:

```text
page.tsx
```

need it, the architecture should avoid unnecessary duplicate origin work where the framework/data-access architecture permits reuse.

Conceptually:

```text
Request
  │
  ├── Metadata
  │      │
  │      └── Product data
  │
  └── Page
         │
         └── Product data
```

should ideally converge on a shared data dependency rather than creating two unrelated backend operations.

---

# 15. Not Every Metadata Field Requires Dynamic Generation

Suppose:

```text
title = product.name
```

is dynamic.

But:

```text
siteName = "Acme"
```

is static.

Do not make the entire metadata object dynamic merely because one field is dynamic.

Think:

```text
Global configuration
        +
Resource-specific metadata
        ↓
Final metadata
```

This is the same principle used throughout full-stack architecture:

> **Make the smallest necessary region dynamic.**

---

# 16. Parent Metadata

Dynamic metadata can participate in the route hierarchy.

Conceptually:

```text
Root metadata
      │
      ▼
Products layout metadata
      │
      ▼
Product page generateMetadata()
```

The product page may need to preserve or extend parent metadata.

For example:

```text
Parent:
site-wide defaults

Child:
product title
product description
product image
```

The final representation combines the applicable metadata according to Next.js's metadata resolution rules.

---

# 17. Parent Metadata Is Useful for Shared Defaults

Imagine:

```text
Root:
Acme

Products:
Products | Acme

Product:
MacBook Pro | Acme
```

The hierarchy can be:

```text
Root
 │
 └── title template
       │
       ▼
Products
 │
 └── section configuration
       │
       ▼
Product
 │
 └── dynamic title
```

This avoids duplicating:

```text
| Acme
```

in every dynamic metadata function.

---

# 18. Dynamic Metadata and Not Found

Consider:

```text
/products/999999
```

where the product does not exist.

Metadata generation must participate correctly in the resource-not-found architecture.

Conceptually:

```text
Product ID
    │
    ▼
Lookup
    │
    ├── Found ──────► Metadata
    │
    └── Not Found ──► Not-found representation
```

Do not create metadata for a nonexistent resource as if it were valid.

This is another reason metadata and resource resolution should share domain semantics.

---

# 19. Dynamic Metadata and Redirects

Some resource lookups may reveal:

```text
Product 123
    ↓
canonical slug = macbook-pro
```

while the incoming URL is:

```text
/products/123
```

The application may have routing behavior such as:

```text
redirect
```

or canonical metadata depending on the intended URL architecture.

The important decision is:

```text
Is the incoming URL valid but non-preferred?
```

or:

```text
Is the incoming URL supposed to redirect?
```

Metadata should not be used to hide a routing mistake.

---

# 20. Dynamic Metadata and Canonical URLs

A dynamic product route may derive:

```text
/product/[id]
```

into:

```text
canonical:
https://example.com/products/macbook-pro
```

if the application's canonical resource identity is slug-based.

The dependency graph becomes:

```text
Product
  │
  ├── name
  ├── slug
  ├── description
  └── image
       │
       ▼
Dynamic Metadata
```

The canonical URL therefore becomes another derived field from resource identity.

---

# 21. Dynamic Metadata and Localization

Suppose:

```text
/en/products/123
/fr/products/123
```

resolve to the same underlying product.

Metadata may vary by locale:

```text
English:
"MacBook Pro — Buy Online"

French:
"MacBook Pro — Acheter en ligne"
```

The dependency graph becomes:

```text
Product
   +
Locale
   ↓
Localized metadata
```

Therefore:

```text
Metadata identity
    =
resource identity
+
locale
```

when locale changes the representation.

---

# 22. Dynamic Metadata and Multi-Tenancy

For:

```text
acme.example.com/products/123
globex.example.com/products/123
```

the dependency becomes:

```text
Tenant
   +
Product
   +
Locale
   ↓
Metadata
```

For example:

```text
Acme:
MacBook Pro — Acme

Globex:
MacBook Pro — Globex
```

If tenant identity changes the metadata, it must be part of the representation identity.

This directly connects:

```text
KPI 07
Routing context

KPI 06
Cache identity

KPI 09
Metadata identity
```

---

# 23. Dynamic Metadata and Personalization

Now consider:

```text
/dashboard
```

with:

```text
"Welcome, Alice"
```

If metadata depends on the current user:

```text
User
  ↓
Metadata
```

the representation becomes personalized.

That means caching must be analyzed carefully.

A dangerous architecture is:

```text
Alice
 ↓
"Welcome, Alice"
 ↓
Shared cache
 ↓
Bob
```

The metadata system itself is not the security boundary.

The representation/cache architecture must prevent cross-user leakage.

---

# 24. Metadata Generation and Authentication

Ask:

> Does this metadata genuinely depend on authentication?

For public pages:

```text
Product
Article
Documentation
Landing page
```

usually:

```text
Metadata
    ↓
Shared representation
```

For private application screens:

```text
Dashboard
Account
Internal workspace
```

metadata may be user-specific or simply generic.

Do not introduce personalization into metadata unnecessarily.

A useful optimization principle is:

> **Do not make document metadata dynamic merely because the application happens to have a logged-in user.**

---

# 25. Error Handling

Dynamic metadata depends on external data.

Therefore failure is possible:

```text
Database unavailable
CMS timeout
API timeout
Resource deleted
Malformed route
```

The architecture should distinguish:

```text
Expected absence
        vs
Unexpected infrastructure failure
```

For example:

```text
Product doesn't exist
    ↓
not-found behavior

Database unavailable
    ↓
availability/error behavior
```

Do not silently turn infrastructure failures into fake metadata such as:

```text
title = "Unknown Product"
```

unless that is an intentional product requirement.

---

# 26. Metadata and External APIs

Suppose product information comes from:

```text
CMS
```

or:

```text
commerce API
```

Then:

```text
generateMetadata()
        ↓
external request
```

introduces a new latency dependency.

The architecture becomes:

```text
Request
 │
 ├── Metadata
 │      │
 │      └── External API
 │
 └── Page
        │
        └── External API
```

Potentially:

```text
        External API
          ▲       ▲
          │       │
     Metadata    Page
```

The system must account for:

* latency
* caching
* failures
* rate limits
* retries
* consistency
* timeouts

---

# 27. Avoid Unbounded Metadata Dependencies

A bad architecture might do:

```text
generateMetadata()
    │
    ├── Product API
    ├── Reviews API
    ├── Recommendations API
    ├── Analytics API
    ├── Inventory API
    └── User Profile API
```

Now metadata generation has become a large dependency graph.

This can increase:

```text
latency
failure probability
origin load
cache complexity
```

Metadata should fetch the **minimum data required to construct metadata**.

For example:

```text
Product
 ├── name
 ├── description
 └── image
```

may be enough.

There is no reason to load:

```text
100 reviews
```

just to construct a title.

---

# 28. Metadata Fetching and Waterfalls

Consider:

```text
generateMetadata()
       ↓
getProduct()
       ↓
getBrand()
       ↓
getCategory()
       ↓
getImage()
```

If these are sequential:

```text
T = T1 + T2 + T3 + T4
```

metadata generation can become unnecessarily slow.

If dependencies permit parallelization:

```text
          ┌── getProduct()
Request ──┼── getBrand()
          ├── getCategory()
          └── getImage()
```

then:

```text
T ≈ max(T1, T2, T3, T4)
```

rather than:

```text
T ≈ T1 + T2 + T3 + T4
```

But do not parallelize blindly.

If:

```text
getBrand()
```

requires:

```text
product.brandId
```

then there is a real dependency:

```text
Product
   ↓
brandId
   ↓
Brand
```

The senior-level skill is identifying the actual dependency graph.

---

# 29. Dynamic Metadata and Cache Invalidation

Suppose:

```text
Product 123
name = "MacBook Pro"
```

generates:

```text
title = "MacBook Pro"
```

Then the product is renamed:

```text
name = "MacBook Pro 2026"
```

What must happen?

Potentially:

```text
Product mutation
      │
      ├── product data invalidation
      ├── page representation invalidation
      └── metadata representation invalidation
```

The exact implementation depends on the application's caching architecture.

But the invariant is:

> **When metadata dependencies change, representations derived from them must eventually be regenerated or invalidated according to the application's consistency contract.**

---

# 30. Metadata Dependency Graph

A useful production model:

```text
                    Product
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
      name       description       image
        │              │              │
        ▼              ▼              ▼
      title       description       OG image
        │              │              │
        └──────────────┼──────────────┘
                       ▼
                 Metadata Output
                       │
                       ▼
                    Document
```

Now mutation:

```text
Product.name changes
        │
        ▼
title dependency becomes stale
        │
        ▼
metadata regenerated
```

This is the same dependency-graph thinking used for application data caches.

---

# 31. Metadata and Rendering Consistency

One of the most important senior-level invariants is:

```text
<head> representation
        must describe
<body> representation
```

For example:

```text
<head>
<title>MacBook Pro</title>
</head>

<body>
<h1>MacBook Air</h1>
</body>
```

This is a representation inconsistency.

It can happen when:

```text
Metadata
  ↓
old data

Page
  ↓
new data
```

or the reverse.

Therefore:

```text
Metadata correctness
        +
UI correctness
        ↓
Document representation correctness
```

---

# 32. Dynamic Metadata Is Not Automatically Per-Request

A subtle but important point:

```text
generateMetadata()
```

does not mean:

```text
always uncached
always fully dynamic
always origin hit
```

The actual behavior depends on the framework's rendering and data/caching model.

You should reason about:

```text
metadata dependency
        ↓
data access
        ↓
cacheability
        ↓
rendering strategy
```

rather than treating "dynamic" as a binary switch for the entire page.

---

# 33. Production Architecture Pattern

A clean architecture can look like:

```text
Route
 │
 ▼
Route Params
 │
 ▼
Resource Resolver
 │
 ├───────────────┐
 ▼               ▼
Page Model    Metadata Model
 │               │
 ▼               ▼
<body>         <head>
```

The resource resolver owns domain retrieval.

The page and metadata layers derive their respective representations.

This avoids duplicating domain knowledge.

---

# 34. Recommended Domain Boundary

Prefer:

```text
domain/
├── products/
│   ├── getProduct.ts
│   └── productTypes.ts
```

over putting all database/API logic directly into:

```text
generateMetadata()
```

Conceptually:

```text
generateMetadata()
       │
       ▼
domain resolver
       │
       ▼
resource
       │
       ▼
metadata mapping
```

This gives you:

* reusable domain access
* centralized business rules
* easier testing
* clearer ownership
* reduced duplication

---

# 35. Metadata Mapping Layer

It can be useful to think in terms of:

```text
Product
   ↓
toProductMetadata()
   ↓
Metadata
```

For example:

```text
Product
{
  name
  description
  image
  slug
}
```

becomes:

```text
Metadata
{
  title
  description
  alternates
  openGraph
}
```

This separates:

```text
domain model
```

from:

```text
document metadata model
```

That separation becomes valuable as the application grows.

---

# 36. 4-Pillar Engineering Decision Matrix

## Dynamic metadata

### When to use

Use when metadata depends on:

* route parameters
* resource data
* locale
* tenant
* canonical resource identity
* CMS content

### When not to use

Do not use dynamic generation when metadata is completely invariant.

### Bottlenecks

Potential:

```text
data lookup
latency
cache complexity
failure propagation
```

### Modern alternative

Use the smallest dynamic dependency possible and cache stable data appropriately.

---

# 37. Metadata Data Access

### When to use direct resource lookup

When metadata requires a small, well-defined subset of resource data.

### When not to use

Avoid loading an entire complex domain graph merely to construct:

```text
title
description
image
```

### Bottlenecks

Large metadata dependencies can increase:

```text
TTFB
origin load
failure probability
```

### Modern alternative

Create focused read models or resource resolvers.

---

# 38. Shared Resource Resolver

### When to use

When both:

```text
page
```

and:

```text
metadata
```

depend on the same resource.

### When not to use

Avoid duplicating independent API/database access paths.

### Bottlenecks

Poorly designed shared resolvers can become giant abstractions.

### Modern alternative

Keep the resolver focused on domain retrieval while keeping presentation mapping separate.

---

# 39. Dynamic Metadata and Caching

### When to use caching

When metadata dependencies:

* change less frequently than requests
* are expensive to fetch
* can safely be shared

### When not to use shared caching

When metadata contains:

* user-specific information
* tenant-specific information without tenant-aware identity
* request-specific secrets
* highly volatile representation

### Bottlenecks

Incorrect cache identity can cause:

```text
cross-user leakage
cross-tenant leakage
stale metadata
```

### Modern alternative

Design cache identity around every representation-affecting dependency.

---

# 40. Prediction Challenges

## Challenge 1 — Duplicate data fetching

Both page and metadata call:

```text
getProduct(123)
```

What should you investigate?

Not merely:

> "There are two calls."

Investigate:

```text
same dependency?
deduplicated?
cached?
same request?
same cache identity?
```

---

## Challenge 2 — Stale title

Database:

```text
Product.name = "MacBook Pro 2026"
```

HTML title:

```text
"MacBook Pro"
```

The UI is also stale.

Where should you investigate?

```text
Product data cache
        ↓
Metadata dependency
        ↓
Page rendering
        ↓
Revalidation
```

---

## Challenge 3 — Correct page, incorrect metadata

Page:

```text
<h1>MacBook Pro</h1>
```

Metadata:

```text
<title>MacBook Air</title>
```

What architectural invariant was violated?

```text
Metadata representation
        ≠
Body representation
```

They are describing different resource states.

---

## Challenge 4 — Cross-tenant metadata

Request:

```text
acme.example.com/products/123
```

receives:

```text
title = "Product 123 — Globex"
```

What should you inspect first?

```text
Tenant resolution
        ↓
Resource lookup
        ↓
Metadata derivation
        ↓
Cache identity
```

---

# 41. Senior Interview Gotchas

### Gotcha 1

**"`generateMetadata()` is just an SEO function."**

No.

It is part of document representation generation.

---

### Gotcha 2

**"Dynamic metadata means no caching."**

No.

Metadata dependencies can still be cached according to the application's representation and data-cache strategy.

---

### Gotcha 3

**"The page and metadata should fetch data independently."**

Not necessarily.

They often share the same underlying domain dependency.

---

### Gotcha 4

**"Any data needed by the page can be loaded for metadata."**

This can create unnecessary latency and origin work.

Metadata should load the minimum required representation dependencies.

---

### Gotcha 5

**"Metadata can perform mutations."**

It should not become a mutation/business-operation boundary.

---

### Gotcha 6

**"If the title is correct, metadata is correct."**

No.

Canonical URL, robots directives, Open Graph, locale, and other metadata may still be wrong.

---

### Gotcha 7

**"Dynamic route means dynamic metadata automatically knows the resource."**

No.

The application must explicitly derive metadata from the relevant route/resource context.

---

# 42. 30-Second Executive Cheat Sheet

```text
generateMetadata()
        =
dynamic document metadata generation

Typical flow:

Route
  ↓
Params
  ↓
Resource resolver
  ↓
Metadata derivation
  ↓
Next.js metadata resolution
  ↓
<head>

Core principles:

Metadata should describe the same
resource representation as the page.

Metadata should be derived from
the correct domain identity.

Avoid unnecessary metadata dependencies.

Metadata generation should be read-oriented.

Dynamic metadata does not automatically
mean uncached.

Cache identity must include every
representation-affecting dependency.

Tenant + locale + resource + user
may all affect metadata identity.

Metadata and page rendering should
remain representation-consistent.
```

---

# 43. Completion Checklist

You should be able to explain:

* [ ] Why `generateMetadata()` exists
* [ ] Static vs dynamic metadata
* [ ] Dynamic route parameters
* [ ] Resource-driven metadata
* [ ] Metadata as derived representation
* [ ] Shared domain dependencies
* [ ] Metadata and page data consistency
* [ ] Parent metadata
* [ ] Metadata inheritance
* [ ] Dynamic canonical URLs
* [ ] Dynamic Open Graph metadata
* [ ] Locale-dependent metadata
* [ ] Tenant-dependent metadata
* [ ] Personalized metadata
* [ ] Metadata data fetching
* [ ] Avoiding metadata waterfalls
* [ ] Metadata error handling
* [ ] Not-found behavior
* [ ] Redirect interaction
* [ ] Metadata caching
* [ ] Metadata invalidation
* [ ] Metadata dependency graphs
* [ ] Representation consistency
* [ ] Metadata/business-logic boundaries
* [ ] Production failure diagnosis

---

# Part Boundary

This part establishes **dynamic metadata generation with `generateMetadata()`**.

It deliberately stops before the deeper SEO/document-identity concerns:

```text
Dynamic Metadata
       ↓
Canonical URLs
       ↓
Alternates
       ↓
Internationalization
       ↓
Open Graph
       ↓
Robots
       ↓
Structured data
```

Those concerns require their own architectural treatment rather than being collapsed into one implementation example.

**Part 03 is complete when you can design dynamic metadata as a deterministic, resource-derived document representation whose dependencies, caching, failure modes, and consistency characteristics are understood—not merely write a `generateMetadata()` function.**
