Part 01 established the document-head and metadata mental model. **Part 02 now moves into the concrete Next.js Metadata API surface**, while keeping the architectural reasoning intact.

# Level 08 — Next.js & Full-Stack React

## KPI 09 — Metadata, SEO & Document Representation

# Part 02 — Next.js Metadata API: Static Metadata, Metadata Fields & Composition

---

# 1. Part Objective

Part 01 established:

```text
Request
  ↓
Route Context
  ↓
Resource
  ↓
Representation
  ├── UI
  └── Metadata
```

This part moves from the mental model into the **Next.js Metadata API**.

The objective is not to memorize every property.

The objective is to understand:

* where metadata is declared
* how static metadata works
* which metadata categories exist
* how metadata is composed through layouts and pages
* which fields describe the document
* which fields describe indexing behavior
* which fields describe alternate URLs
* which fields describe social previews
* which metadata should be generated dynamically later
* how metadata configuration affects the final HTML document

The core model is:

```text
Next.js Route Tree
       │
       ├── Root Layout Metadata
       │
       ├── Nested Layout Metadata
       │
       └── Page Metadata
               │
               ▼
        Metadata Resolution
               │
               ▼
          Final <head>
```

---

# 2. Industry Frequency & Framework Relevance

| Metadata capability   |       Frequency | Senior relevance             |
| --------------------- | --------------: | ---------------------------- |
| `title`               | 🟢 Daily Driver | Document identity            |
| `description`         | 🟢 Daily Driver | Search/social representation |
| `metadata` export     | 🟢 Daily Driver | Static route metadata        |
| Metadata inheritance  | 🟢 Daily Driver | Large route trees            |
| `openGraph`           |     🟡 Moderate | Social previews              |
| `robots`              |     🟡 Moderate | Indexing control             |
| `alternates`          |     🟡 Moderate | Canonical/localized URLs     |
| `icons`               | 🟢 Daily Driver | Browser/document integration |
| `authors` / `creator` |  🔵 Situational | Content attribution          |
| `keywords`            | 🔵 Low priority | Historical/limited SEO value |
| `manifest`            |     🟡 Moderate | PWA/browser integration      |
| `metadataBase`        |     🟡 Moderate | Absolute URL resolution      |
| Dynamic metadata      | 🟢 Daily Driver | Resource-driven pages        |

---

# 3. Static Metadata

The simplest Next.js metadata architecture is a static metadata export.

Conceptually:

```ts
export const metadata = {
  title: 'About Acme',
  description: 'Learn about Acme.',
};
```

The important architectural property is:

```text
metadata
    ↓
known without request-specific resource lookup
```

For a static route:

```text
/about
```

the metadata can be represented as:

```text
title:
"About Acme"

description:
"Learn about Acme."
```

The framework incorporates that metadata into the document representation.

---

# 4. Where Static Metadata Lives

A typical App Router structure might look like:

```text
app/
│
├── layout.tsx
├── page.tsx
│
├── about/
│   └── page.tsx
│
└── products/
    ├── layout.tsx
    ├── page.tsx
    │
    └── [id]/
        └── page.tsx
```

Metadata can exist at multiple levels:

```text
app/layout.tsx
      │
      ▼
global metadata
      │
      ▼
products/layout.tsx
      │
      ▼
products metadata
      │
      ▼
products/[id]/page.tsx
      │
      ▼
product metadata
```

This creates a hierarchical metadata system.

---

# 5. Root Metadata

The root layout commonly owns application-wide defaults.

Conceptually:

```ts
export const metadata = {
  title: 'Acme',
  description: 'Acme products and services',
};
```

This establishes a baseline.

Think:

```text
                 Root Metadata
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
       /about      /products    /contact
          │           │           │
          ▼           ▼           ▼
       inherit      inherit      inherit
```

This avoids repeating application-wide metadata in every page.

---

# 6. Nested Layout Metadata

Suppose:

```text
app/
└── products/
    ├── layout.tsx
    └── [id]/
        └── page.tsx
```

The products layout can establish metadata relevant to that subtree.

Conceptually:

```text
Root:
Acme

Products layout:
Products

Product page:
Product 123
```

The final metadata is determined through the route hierarchy.

This allows a large application to establish progressively more specific metadata.

---

# 7. Metadata as Configuration

Think of the Metadata API as a typed document configuration model.

Instead of manually constructing:

```html
<head>
  <title>...</title>
  <meta ... />
  <link ... />
</head>
```

you describe the desired document metadata:

```text
Metadata object
       │
       ├── title
       ├── description
       ├── authors
       ├── creator
       ├── keywords
       ├── robots
       ├── alternates
       ├── openGraph
       ├── twitter
       ├── icons
       └── manifest
```

Next.js translates that representation into the appropriate document head output.

The abstraction therefore becomes:

```text
Application metadata model
        ↓
Next.js metadata resolution
        ↓
HTML document head
```

---

# 8. The `title` Field

`title` establishes the document title.

Conceptually:

```ts
export const metadata = {
  title: 'Products',
};
```

This ultimately represents the document's:

```html
<title>Products</title>
```

The title is important because it participates in:

* browser tab identity
* bookmarks
* history
* search-result representation
* accessibility/document identification
* social metadata when explicitly derived or configured

---

# 9. Title Is Document Identity

Consider:

```text
/products
/products/123
/cart
/account
```

These are different documents/representations.

A useful title strategy might be:

```text
Products — Acme
MacBook Pro — Acme
Shopping Cart — Acme
Account — Acme
```

This is much better than:

```text
Acme
Acme
Acme
Acme
```

because the title communicates the specific document identity.

---

# 10. Title Templates

Large applications frequently want a consistent brand suffix.

Conceptually:

```text
title.template
```

can establish a pattern such as:

```text
%s | Acme
```

Then a child route can specify:

```text
Products
```

and the resolved title becomes conceptually:

```text
Products | Acme
```

The architecture becomes:

```text
Parent:
"%s | Acme"

Child:
"Products"

Resolved:
"Products | Acme"
```

This prevents every page from manually repeating:

```text
Products | Acme
Pricing | Acme
About | Acme
Contact | Acme
```

---

# 11. `default` and `template` Are Different

A senior engineer should distinguish:

```text
default
```

from:

```text
template
```

Conceptually:

```text
default
    ↓
Used when no more specific title exists.

template
    ↓
Transforms a child-provided title.
```

Therefore:

```text
Parent:
default = "Acme"

template = "%s | Acme"
```

has a different purpose from:

```text
Parent:
title = "Acme"
```

The distinction matters when building nested route hierarchies.

---

# 12. The `description` Field

Conceptually:

```ts
export const metadata = {
  description: 'Explore Acme products.',
};
```

produces a document description representation.

The key architectural question is:

> What resource or document does this description describe?

For a product:

```text
Product:
MacBook Pro

Description:
"Explore MacBook Pro specifications,
pricing and availability."
```

For a category:

```text
Category:
Laptops

Description:
"Explore laptops from leading brands."
```

The description should therefore be derived from the correct representation.

---

# 13. Description Is Not a UI Copy Field

Avoid blindly reusing:

```text
hero.subtitle
```

as:

```text
metadata.description
```

They serve different purposes.

UI copy might be:

```text
"Powerful performance. Beautifully designed."
```

Metadata might need:

```text
"Explore specifications, pricing and availability."
```

The distinction is:

```text
UI copy
   ↓
Designed for users interacting with the page

Metadata
   ↓
Designed to describe the document to external consumers
```

Sometimes they can share source data.

They should not automatically share semantic responsibility.

---

# 14. `keywords`

The Metadata API supports keywords.

Conceptually:

```ts
keywords: ['laptops', 'computers', 'electronics']
```

However, senior engineers should understand the distinction between:

```text
API capability
```

and:

```text
SEO importance
```

A framework supporting a metadata field does not mean the field should become a major SEO strategy.

Therefore:

```text
metadata API completeness
        ≠
SEO strategy
```

Do not build an application architecture around keyword stuffing.

---

# 15. Authors, Creator and Publisher Information

Metadata can describe content ownership and authorship.

Conceptually:

```text
authors
creator
publisher
```

This can be useful for:

* editorial sites
* blogs
* documentation
* publishing platforms
* content-heavy applications

For example:

```text
Article
  │
  ├── title
  ├── description
  ├── author
  └── publication metadata
```

This is especially useful when the application represents content rather than merely application screens.

---

# 16. `robots`

Robots metadata communicates indexing/crawling directives.

Conceptually:

```ts
robots: {
  index: false,
  follow: false,
}
```

This should be understood as:

```text
Application
   ↓
Document
   ↓
Crawler directives
```

not:

```text
robots
   ↓
Authentication
```

Robots directives are **not a security boundary**.

Never use:

```text
robots: noindex
```

as a replacement for:

* authentication
* authorization
* access control
* private data protection

A private document must actually be protected.

---

# 17. Robots and Route Classification

Consider:

```text
Public marketing page
        ↓
Indexable

Authenticated dashboard
        ↓
Usually not an SEO target

Admin panel
        ↓
Should not be publicly indexable
```

But the architecture should still enforce:

```text
Authentication
Authorization
```

independently.

Therefore:

```text
robots
    =
crawler instruction

authorization
    =
security control
```

This distinction is fundamental.

---

# 18. `alternates`

`alternates` communicates alternate document identities/representations.

The most important case is often:

```text
canonical
```

Conceptually:

```ts
alternates: {
  canonical: '/products/123',
}
```

This communicates the preferred URL representation.

---

# 19. Canonical Metadata and Resource Identity

Suppose the following URLs exist:

```text
/products/123
/products/123?utm_source=email
/products/123?utm_campaign=sale
```

If these all represent the same resource:

```text
Resource:
Product 123
```

the canonical identity may be:

```text
/products/123
```

The model becomes:

```text
Incoming URL
      │
      ▼
Normalize representation
      │
      ▼
Canonical resource identity
```

This is different from issuing a redirect.

---

# 20. Canonical ≠ Redirect

This distinction should be automatic in your reasoning.

### Redirect

```text
Browser
   │
   ▼
URL A
   │
   └── HTTP redirect ──► URL B
```

The browser navigates to another URL.

### Canonical

```text
Browser
   │
   ▼
URL A
   │
   ▼
HTML
   │
   └── canonical = URL B
```

The current document remains URL A.

The application tells consumers which URL represents the preferred identity.

Therefore:

```text
Redirect
    =
navigation behavior

Canonical
    =
representation identity signal
```

---

# 21. `metadataBase`

Absolute URLs are frequently required for metadata such as:

```text
canonical
Open Graph images
alternate URLs
```

A relative URL such as:

```text
/images/product.jpg
```

needs a base origin when converted into an absolute URL.

Conceptually:

```text
metadataBase
      +
relative metadata URL
      ↓
absolute metadata URL
```

Example conceptual result:

```text
https://example.com/images/product.jpg
```

This becomes particularly important in production because environments differ:

```text
localhost
staging.example.com
production.example.com
```

---

# 22. Environment Awareness

A common production failure is:

```text
Production application
       │
       ▼
Metadata points to staging.example.com
```

or:

```text
Production
       │
       ▼
Open Graph image points to localhost
```

Therefore:

```text
Deployment environment
        ↓
Canonical origin
        ↓
Metadata absolute URLs
```

must be treated as part of deployment configuration.

---

# 23. Open Graph

Open Graph metadata describes how a document can be represented when shared on compatible social platforms.

Conceptually:

```text
openGraph
    │
    ├── title
    ├── description
    ├── url
    ├── siteName
    ├── images
    └── locale
```

The architecture becomes:

```text
Page
 │
 ├── Browser representation
 │
 ├── Search representation
 │
 └── Social representation
         │
         └── Open Graph
```

This is why social metadata should be treated as part of document representation rather than as an unrelated marketing feature.

---

# 24. Open Graph Image Identity

Suppose:

```text
/products/123
```

has:

```text
Product 123
```

Its social preview might require:

```text
og:image = product-123.jpg
```

Then:

```text
Product identity
       ↓
Social image identity
```

must be consistent.

If a product changes:

```text
Product Name
Product Image
Price
```

you must consider whether social metadata is also stale.

This again creates a dependency graph:

```text
Product
 ├── UI
 ├── title
 ├── description
 └── OG image
```

---

# 25. Twitter/X Metadata

The Metadata API can also represent social-card information for Twitter/X-compatible consumers.

Conceptually:

```text
twitter
   │
   ├── card
   ├── title
   ├── description
   └── images
```

The important architectural point is not memorizing every card variant.

It is recognizing:

```text
Document
    │
    ├── Search metadata
    ├── Open Graph metadata
    └── Twitter/X metadata
```

These are different consumers of the same document representation.

---

# 26. Icons

Metadata can also describe application/document icons.

Conceptually:

```text
icons
   │
   ├── favicon
   ├── shortcut
   └── other icon representations
```

This belongs to the browser/document layer rather than the SEO layer.

That distinction matters.

Not every Metadata API field is about search engines.

```text
Metadata API
     │
     ├── SEO
     ├── Browser
     ├── Social
     ├── Identity
     └── Application integration
```

---

# 27. Manifest

A web application may expose a manifest through metadata configuration.

Conceptually:

```text
Application
     │
     └── Web App Manifest
             │
             ├── name
             ├── icons
             ├── display
             └── start URL
```

Again:

```text
Metadata API
    ≠
SEO-only API
```

It is a broader document/application integration mechanism.

---

# 28. Structured Metadata Is a Separate Concern

Do not confuse standard document metadata with structured data.

For example:

```text
<title>
<meta name="description">
<link rel="canonical">
```

are different from:

```text
JSON-LD structured data
```

Structured data describes entities and relationships in machine-readable form.

For example:

```text
Product
 ├── name
 ├── image
 ├── offers
 ├── brand
 └── aggregateRating
```

That is a different layer.

The conceptual hierarchy is:

```text
Document Metadata
       │
       ├── Title
       ├── Description
       ├── Robots
       ├── Canonical
       └── Social metadata

Structured Data
       │
       └── Entity / relationship representation
```

Structured data will be handled separately so this part does not collapse two distinct concerns.

---

# 29. Metadata Composition

The most important implementation concept in a nested Next.js application is **composition**.

Imagine:

```text
Root Layout
    │
    ├── title template
    ├── description
    └── site-wide defaults
          │
          ▼
Products Layout
    │
    ├── section metadata
    └── section-specific defaults
          │
          ▼
Product Page
    │
    ├── product title
    ├── product description
    └── product-specific social metadata
```

The final result is not authored by one file.

It is **resolved from the route hierarchy**.

---

# 30. Metadata Resolution as a Function

A useful abstraction is:

```text
FinalMetadata =
    Resolve(
        RootMetadata,
        NestedLayoutMetadata,
        PageMetadata,
        DynamicMetadata
    )
```

Or:

```text
M_final = R(M_root, M_layout1, M_layout2, ..., M_page)
```

The important question is:

> What metadata does this route ultimately produce?

not:

> What metadata does this one file declare?

---

# 31. Object Composition Is Not Always Simple Spreading

A common mistake is thinking:

```ts
{
  ...parentMetadata,
  ...childMetadata
}
```

is the entire model.

Nested metadata contains structured fields:

```text
openGraph
robots
alternates
icons
twitter
```

Therefore composition can involve nested semantics.

The engineering principle is:

```text
Metadata composition
      ↓
field-aware resolution
```

not:

```text
blind object replacement
```

---

# 32. Static Metadata vs Dynamic Metadata

This part focuses on static metadata.

Use static metadata when:

```text
Route
  ↓
Metadata known independently
```

Examples:

```text
/about
/contact
/pricing
```

Dynamic metadata becomes necessary when:

```text
Route parameter
      ↓
Resource lookup
      ↓
Metadata
```

Examples:

```text
/products/[id]
/articles/[slug]
/authors/[username]
```

The next part will go deeper into dynamic generation.

---

# 33. 4-Pillar Engineering Decision Matrix

## A. Static Metadata

### When to use

Use when metadata is:

* stable
* route-level
* configuration-driven
* independent of request-specific resource data

### When not to use

Avoid static metadata when:

* title depends on `[id]`
* description comes from a CMS record
* canonical URL depends on resolved resource identity
* Open Graph image depends on database content

### Bottlenecks / tradeoffs

Static metadata is simple, but can become incorrect if the underlying resource changes.

### Modern alternative

Use dynamic metadata with appropriate caching.

---

# 34. Canonical Metadata

### When to use

Use when:

* multiple URLs can represent one resource
* tracking query parameters exist
* localization creates alternate representations
* routing creates duplicate URL forms

### When not to use

Do not use canonical metadata as:

* authentication
* authorization
* URL redirection
* access control

### Bottlenecks / tradeoffs

Incorrect canonical configuration can communicate the wrong resource identity.

### Modern alternative

Combine canonical metadata with explicit routing normalization where appropriate.

---

# 35. Robots Metadata

### When to use

Use when crawler/indexing behavior needs to be explicitly controlled.

### When not to use

Never use it as:

* security
* authentication
* authorization
* privacy enforcement

### Bottlenecks / tradeoffs

Crawler directives are external signals; they do not create an access-control boundary.

### Modern alternative

For genuinely private data:

```text
Authentication
+
Authorization
+
No public response
```

---

# 36. Open Graph

### When to use

Use for public pages where social sharing representation matters.

### When not to use

Do not spend disproportionate effort generating social previews for:

* internal admin pages
* private dashboards
* non-shareable authenticated workflows

### Bottlenecks / tradeoffs

Dynamic images and metadata may increase rendering/data dependencies.

### Modern alternative

Use shared templates for common social metadata and dynamic generation only where the content materially differs.

---

# 37. Metadata and TypeScript

Metadata configuration benefits from TypeScript because complex nested structures are easy to misconfigure.

Conceptually:

```text
Metadata
 ├── title
 ├── description
 ├── alternates
 ├── robots
 ├── openGraph
 ├── twitter
 └── icons
```

Strong typing helps prevent:

```text
wrong field
wrong value shape
incorrect nested structure
```

But TypeScript cannot determine whether your metadata is **semantically correct**.

For example:

```text
Type-safe canonical URL
```

can still point to the wrong product.

Therefore:

```text
Type correctness
    ≠
Representation correctness
```

---

# 38. React Relevance

In React architecture, avoid thinking of metadata as ordinary component state.

The distinction is:

```text
Component state
    ↓
Interactive UI behavior

Document metadata
    ↓
Document representation
```

This is especially important when deciding whether metadata should be resolved server-side.

---

# 39. Next.js Relevance

Next.js provides the framework-level machinery to:

```text
declare
compose
resolve
render
```

metadata alongside the route tree.

The senior engineer should therefore understand:

```text
Route
  ↓
Layout hierarchy
  ↓
Metadata hierarchy
  ↓
Metadata resolution
  ↓
Document
```

---

# 40. Production Architecture Example

Consider:

```text
app/
│
├── layout.tsx
│
├── page.tsx
│
├── blog/
│   ├── layout.tsx
│   ├── page.tsx
│   │
│   └── [slug]/
│       └── page.tsx
│
└── products/
    ├── layout.tsx
    │
    └── [id]/
        └── page.tsx
```

A reasonable metadata ownership model could be:

```text
Root Layout
│
├── brand
├── global description
└── global defaults
     │
     ├── Blog Layout
     │    ├── blog defaults
     │    └── article metadata
     │
     └── Products Layout
          ├── product-section defaults
          └── product-specific metadata
```

This gives ownership to the route that understands the relevant resource.

---

# 41. Production Failure Scenario

Suppose:

```text
Root:
title = "Acme"
```

and:

```text
/products/[id]
```

uses a generic static title:

```text
"Product"
```

The UI correctly renders:

```text
MacBook Pro
```

but the document title remains:

```text
Product
```

The failure is:

```text
Resource identity
       ↓
not propagated into metadata
```

The solution is not to modify the UI.

The solution is to make metadata depend on the same resource identity.

---

# 42. Another Production Failure

Suppose:

```text
staging.example.com
```

is accidentally used as:

```text
metadataBase
```

in production.

Then:

```text
canonical
og:image
alternate URLs
```

may resolve against the staging origin.

The application can look visually perfect while emitting incorrect external document metadata.

This is why metadata must be tested as an independent production artifact.

---

# 43. Prediction Challenges

## Challenge 1

You have:

```text
Root:
title = "Acme"

Products page:
title = "Products"
```

What should the page-specific title represent?

**Answer:** the more specific route should provide the page-specific title, while other applicable parent metadata can remain inherited.

---

## Challenge 2

A route uses:

```text
/products/123?utm_source=email
```

Should the tracking parameter automatically become the canonical URL?

**Answer:** not necessarily.

The canonical URL should represent the preferred resource identity, which may exclude tracking parameters.

---

## Challenge 3

An admin route has:

```text
robots:
index = false
```

Can an unauthenticated user access the page?

**Answer:** robots metadata does not enforce access control. Authentication/authorization must independently protect the route.

---

## Challenge 4

Two tenants use:

```text
tenant-a.example.com/products/123
tenant-b.example.com/products/123
```

Can both safely share one cached metadata representation?

**Answer:** only if the metadata is genuinely identical across tenants. If tenant identity affects the representation, tenant identity must participate in representation/cache identity.

---

# 44. Senior Interview Gotchas

### Gotcha 1

**"Metadata belongs only in the page."**

Not necessarily.

Layouts are important because metadata naturally follows the route hierarchy.

---

### Gotcha 2

**"Canonical URL redirects users."**

No.

Canonical metadata identifies the preferred representation; redirects change navigation.

---

### Gotcha 3

**"Robots prevents access."**

No.

Robots directives are not security controls.

---

### Gotcha 4

**"Open Graph is SEO."**

Not exactly.

Open Graph primarily describes social sharing representation.

---

### Gotcha 5

**"Metadata is just a JavaScript object."**

The object is an application configuration representation.

The final output is document metadata.

---

### Gotcha 6

**"Type-safe metadata means correct metadata."**

No.

TypeScript verifies structure, not semantic resource identity.

---

# 45. 30-Second Executive Cheat Sheet

```text
Next.js Metadata API
        │
        ├── title
        ├── description
        ├── robots
        ├── alternates
        ├── openGraph
        ├── twitter
        ├── icons
        ├── manifest
        └── authors / creator / publisher

Metadata can be declared at:
        Root Layout
             ↓
        Nested Layout
             ↓
           Page

The final metadata is resolved
from the route hierarchy.

Static metadata:
    known without resource lookup.

Dynamic metadata:
    depends on route/resource/request data.

Canonical:
    preferred resource identity.

Redirect:
    navigation behavior.

Robots:
    crawler directive.

Authentication:
    security boundary.

Open Graph:
    social representation.

Type safety:
    structural correctness.

Metadata correctness:
    representation correctness.
```

---

# 46. Completion Checklist

You should now be able to explain:

* [ ] What the Next.js Metadata API represents
* [ ] How static metadata is declared
* [ ] Why root layouts commonly own global defaults
* [ ] Why nested layouts can own subtree metadata
* [ ] How page metadata becomes more specific
* [ ] `title`
* [ ] title templates
* [ ] title defaults
* [ ] `description`
* [ ] `keywords`
* [ ] authors and creator metadata
* [ ] `robots`
* [ ] `alternates`
* [ ] canonical URLs
* [ ] `metadataBase`
* [ ] Open Graph metadata
* [ ] Twitter/X metadata
* [ ] icons
* [ ] manifest
* [ ] metadata composition
* [ ] static vs dynamic metadata
* [ ] metadata and TypeScript
* [ ] metadata and React
* [ ] metadata and production environments
* [ ] metadata versus security
* [ ] metadata versus redirects
* [ ] metadata versus structured data

---

# Part Boundary

This part covered the **static Next.js Metadata API surface and its composition model**.

It deliberately does not deeply cover:

```text
Dynamic metadata generation
        ↓
generateMetadata()
        ↓
Route params
        ↓
Data fetching
        ↓
Caching
        ↓
Resource-dependent metadata
```

That is the next architectural step.

**Part 02 is complete when you can design a route hierarchy where metadata ownership, inheritance, canonical identity, browser metadata, crawler directives, and social representation are deliberately assigned rather than scattered across pages.**
