# Level 08 — Next.js & Full-Stack React

## KPI 09 — Metadata, SEO & Document Representation

# Part 07 — Structured Data, JSON-LD & Machine-Readable Entity Architecture

---

# 1. Part Objective

The previous parts established several document representations:

```text id="zq8q4j"
Part 03
Dynamic metadata
        ↓
Part 04
Canonical + alternate URL identity
        ↓
Part 05
Social/share representation
        ↓
Part 06
Crawler + indexing policy
```

This part introduces another representation layer:

> **How can an application expose its domain entities in a structured, machine-readable form?**

A normal HTML document communicates primarily through rendered content:

```text id="xj2l7m"
<h1>MacBook Pro</h1>
<p>Apple's laptop...</p>
```

Structured data adds explicit semantic information:

```text id="q7j3p8"
This document represents:
    Product
    name = MacBook Pro
    brand = Apple
    ...
```

The architecture therefore becomes:

```text id="1x8p4s"
                 Resource
                    │
                    ▼
             Domain representation
                    │
        ┌───────────┼────────────┐
        ▼           ▼            ▼
       HTML      Metadata    Structured Data
                               │
                               ▼
                           JSON-LD
```

The governing question is:

> **How do we expose structured entity information without creating a second, contradictory source of truth?**

---

# 2. What Structured Data Is

Structured data is machine-readable information embedded in a web document.

Instead of forcing a consumer to infer:

```text id="y6s1p4"
"This looks like a product page."
```

the document can explicitly describe:

```text id="1g0o2r"
"This representation describes a Product."
```

The conceptual difference is:

```text id="2x7s8w"
Unstructured:
    infer meaning from rendered content

Structured:
    explicitly describe semantic entities
```

---

# 3. JSON-LD Mental Model

JSON-LD is a JSON-based representation for linked data.

A simplified conceptual structure is:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Example Product"
}
```

The important architectural pieces are:

```text id="h8m2jv"
@context
@type
entity properties
```

The application should think of this as:

```text id="q8d4t1"
Domain Entity
      ↓
Structured representation
      ↓
JSON-LD serialization
```

not:

```text id="p5x0r9"
HTML string
      ↓
random JSON object
```

---

# 4. Structured Data Is Not Visible UI

A page may contain:

```text id="9k2m3a"
Visible UI
```

and:

```text id="c7w1ps"
Machine-readable structured data
```

They serve different consumers.

Conceptually:

```text id="r4k7e2"
Resource
   │
   ├── Human representation
   │      ↓
   │     Browser
   │
   └── Machine representation
          ↓
        Search/consumer systems
```

The structured representation should still describe the same underlying resource.

---

# 5. Structured Data Is Not an SEO Guarantee

A common misconception is:

```text id="n7b3c9"
"Add JSON-LD"
      ↓
"Search engine will show rich result"
```

That is not guaranteed.

Structured data provides semantic information.

Search systems independently determine:

```text id="p4m8q1"
whether the data is valid
whether it is eligible
whether it is useful
whether a rich presentation should be shown
```

Therefore:

```text id="a8v2r5"
structured data
    ≠
guaranteed search feature
```

---

# 6. Entity-Centric Thinking

Structured data becomes much easier to reason about when the application thinks in entities.

For example:

```text id="w5f1n8"
Product
Article
Organization
Person
Breadcrumb
Event
```

The architecture becomes:

```text id="k1p6s3"
Domain Entity
      ↓
Entity Representation
      ↓
JSON-LD
```

The domain model should remain the source of truth.

---

# 7. Schema Type vs Application Type

Your application may have:

```text id="b2d9x7"
Product
```

while structured data uses:

```text id="q5v1m8"
Product
```

These concepts may correspond but are not automatically identical.

The mapping should be explicit:

```text id="r8c3k2"
Application Product
        ↓
Structured Product representation
```

This protects the domain model from becoming coupled directly to an external vocabulary.

---

# 8. Why Mapping Matters

Bad architecture:

```text id="h7v4m1"
Database schema
     ↓
directly emitted JSON-LD
```

Now database changes can unexpectedly alter your public semantic representation.

Better:

```text id="s3p8n6"
Database
   ↓
Domain model
   ↓
Structured-data mapper
   ↓
JSON-LD
```

This creates a boundary.

---

# 9. Structured Data as a Projection

A powerful mental model is:

```text id="u4k7d2"
Domain Entity
       │
       ├── UI projection
       ├── API projection
       ├── Metadata projection
       └── Structured-data projection
```

Structured data is therefore a projection.

This is important because different consumers need different representations.

---

# 10. Single Source of Truth

Suppose:

```text id="g3p8r1"
Product.name
Product.description
Product.image
Product.brand
```

The application should derive:

```text id="x6n2q9"
HTML
metadata
Open Graph
JSON-LD
```

from the same resource model where appropriate.

Conceptually:

```text id="t5v9m2"
                  Product
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
      HTML        Metadata       JSON-LD
```

This reduces semantic drift.

---

# 11. Structured Data Consistency

Suppose the visible page says:

```text id="m4j7p8"
Product:
"MacBook Pro"
```

but JSON-LD says:

```text id="c9v2k6"
name:
"MacBook Air"
```

The document contains contradictory representations.

That is a representation integrity problem.

The invariant is:

```text id="q3w8s1"
Visible resource
      ≈
Structured resource
```

The representations can differ in formatting, but they should not contradict the underlying resource.

---

# 12. Product Structured Data

Products are a useful example because they often contain:

```text id="d8r2f5"
name
description
image
brand
offers
availability
price
```

The architecture might be:

```text id="u7m4k9"
Product
   │
   ├── identity
   ├── descriptive data
   ├── pricing
   └── inventory state
         │
         ▼
Structured Product representation
```

The key engineering problem is not writing JSON.

It is determining:

> **Which product facts are authoritative, current, public, and semantically appropriate for the structured representation?**

---

# 13. Product Pricing

Suppose the UI displays:

```text id="v4k1n8"
$999
```

but structured data emits:

```text id="e2p7m5"
$899
```

Now there are two representations of price.

Potential causes:

```text id="s8q3w6"
different data source
stale cache
currency conversion
personalized pricing
region-specific pricing
```

This becomes a representation consistency problem.

---

# 14. Personalized Pricing

Consider:

```text id="n5c7r2"
User A:
$899

User B:
$999
```

Can a single public structured representation safely describe both?

Not necessarily.

This is where:

```text id="z6p2m9"
personalization
```

interacts with:

```text id="k4r8v1"
structured data
```

The application must determine whether the structured representation can be public and stable.

Do not automatically expose user-specific values as globally shared metadata.

---

# 15. Availability and Inventory

Suppose product inventory is:

```text id="j8q4m2"
in stock
```

then changes to:

```text id="s7n3p6"
out of stock
```

Structured data can become stale if the cache is not invalidated.

Therefore:

```text id="x9w5k1"
Inventory mutation
       ↓
Product representation changes
       ↓
Structured data becomes stale
```

This connects directly to KPI 06.

---

# 16. Structured Data and Cache Dependencies

A useful dependency graph:

```text id="p2v7k8"
Product
 ├── name
 ├── image
 ├── price
 ├── inventory
 └── brand
       │
       ▼
Structured Product
       │
       ▼
Page representation
```

If price changes:

```text id="m8s3q5"
price mutation
    ↓
structured-data representation invalidation
```

The application should understand these dependencies explicitly.

---

# 17. Article Structured Data

An article may have:

```text id="q7n2v4"
headline
description
image
author
publication date
modified date
```

The application model might be:

```text id="r3m8x1"
Article
   │
   ├── title
   ├── body
   ├── author
   ├── publishedAt
   └── updatedAt
```

Structured representation:

```text id="c5k9p2"
Article
   ↓
JSON-LD Article representation
```

Again, the mapper should derive values from the authoritative article model.

---

# 18. Dates and Temporal Semantics

Dates are a common source of inconsistency.

For example:

```text id="d1v7q4"
publishedAt
updatedAt
```

must have clearly defined semantics.

Do not use:

```text id="m4x8p2"
database createdAt
```

simply because it is available.

The structured field should represent the intended domain meaning.

This is a general principle:

> **Map semantic meaning, not merely available fields.**

---

# 19. Author Representation

An article's author might be:

```text id="f9k3q6"
User
```

but structured data may require:

```text id="r7v2m8"
Person
```

The application therefore needs a projection:

```text id="w4n1p5"
Application User
       ↓
Public author identity
       ↓
Structured Person representation
```

Do not automatically expose all user fields.

---

# 20. Privacy Boundary

A user record might contain:

```text id="b6t8m3"
email
phone
internalId
permissions
```

while the public author representation only needs:

```text id="k2r7p9"
name
public profile URL
public image
```

Structured data must respect the same privacy boundaries as the UI.

The correct architecture is:

```text id="j5m9x1"
Private domain entity
       ↓
Public projection
       ↓
Structured representation
```

---

# 21. Organization Structured Data

A company or application may expose:

```text id="v3q8m5"
name
logo
URL
contact information
```

Again, the architecture should use authoritative organization data.

Potential failure:

```text id="n7p4k2"
HTML logo = Acme
JSON-LD logo = old Acme asset
```

This is another representation drift problem.

---

# 22. Breadcrumb Structured Data

Breadcrumbs provide hierarchical context.

Suppose the visible UI is:

```text id="q8m1v5"
Home
  >
Products
  >
Laptops
  >
MacBook Pro
```

The structured representation should reflect the same conceptual hierarchy.

The architecture is:

```text id="x4k7p2"
Route hierarchy
      ↓
Breadcrumb model
      ├── visible breadcrumb
      └── structured breadcrumb
```

This is preferable to maintaining two unrelated breadcrumb systems.

---

# 23. Route Hierarchy vs Resource Hierarchy

These are not always identical.

For example:

```text id="z5m2q8"
/products/apple/macbook
```

does not necessarily mean:

```text id="h7r4p1"
Apple
    >
MacBook
```

is the domain hierarchy.

Therefore structured breadcrumb data should be based on the application's semantic navigation model, not blindly derived from URL segments.

---

# 24. Structured Data IDs

Linked data often benefits from stable entity identity.

Conceptually:

```text id="s9v3m7"
@id
```

can identify an entity representation.

For example:

```text id="a2k8q4"
Product
   @id
   ↓
https://example.com/products/123#product
```

The exact identity scheme should be deliberate.

The important question is:

> **What stable identifier represents this semantic entity?**

---

# 25. Entity Identity vs URL Identity

Part 04 established URL identity.

Structured data introduces semantic entity identity.

They may be related:

```text id="p8m4x2"
URL
    ↓
https://example.com/products/123

Entity
    ↓
Product #123
```

But:

```text id="y3q7v1"
URL identity
≠
entity identity
```

They should be connected intentionally.

---

# 26. Multiple Structured Entities

A document may contain several related entities:

```text id="w6r2p9"
Article
 ├── Author
 ├── Organization
 └── Breadcrumb
```

or:

```text id="q4m8x1"
Product
 ├── Brand
 ├── Offer
 └── Organization
```

The application should decide whether to represent:

```text id="f7v3k2"
one primary entity
```

or:

```text id="z8p5m1"
a connected entity graph
```

based on the semantic structure of the page.

---

# 27. Avoid Random Entity Duplication

Bad architecture:

```text id="x7m2q4"
Product JSON-LD

Brand JSON-LD

Company JSON-LD

```

with each object independently recreating:

```text id="r9p3v6"
same organization
same URL
same identity
```

This increases drift.

A better conceptual model is:

```text id="n5k8q2"
Entity Graph
   │
   ├── Product
   ├── Brand
   └── Organization
```

with explicit relationships.

---

# 28. JSON-LD Serialization Boundary

The application should treat JSON-LD as an output format.

Architecture:

```text id="j3v7m9"
Domain model
      ↓
Semantic model
      ↓
JSON-LD serializer
      ↓
<script type="application/ld+json">
```

This creates a clean boundary.

The serializer is responsible for:

```text id="q8m2x5"
shape
escaping
serialization
schema vocabulary
```

while the domain layer owns:

```text id="s4p9k1"
business meaning
```

---

# 29. Security and JSON-LD Serialization

JSON-LD is embedded into HTML.

Therefore serialization must be safe.

Do not construct HTML through unsafe string concatenation.

Conceptually:

```text id="m5x8q2"
Domain data
   ↓
safe structured serialization
   ↓
HTML embedding
```

Special attention is required when user-controlled content can appear in:

```text id="r7n3p6"
name
description
author
URLs
images
```

The goal is to preserve valid JSON and safe HTML embedding.

---

# 30. User-Generated Content

Suppose a user creates an article titled:

```text id="u2m7q5"
`</script><script>...`
```

If JSON-LD is embedded unsafely, serialization can become an HTML security problem.

Therefore:

```text id="v8p3k1"
user data
    ↓
validated/normalized model
    ↓
safe JSON serialization
    ↓
HTML
```

The structured-data layer is not exempt from application security.

---

# 31. Structured Data and XSS

The important security boundary is:

```text id="j4m9x2"
JSON
    is not automatically safe
    merely because it is JSON
```

Once embedded inside:

```html
<script type="application/ld+json">
```

it participates in HTML parsing behavior.

Therefore the serializer must be designed with the embedding context in mind.

This is an SDE-2 concern because:

```text id="z5q8m1"
data serialization
+
HTML embedding
```

crosses abstraction boundaries.

---

# 32. Structured Data and Localization

Suppose:

```text id="x7m2p4"
English article
French article
German article
```

The structured representation may vary by locale.

Potential fields include:

```text id="n3k9q1"
headline
description
URL
image
```

The architecture becomes:

```text id="q6v1m8"
Article
  +
Locale
    ↓
Localized representation
    ↓
JSON-LD
```

The application must decide which fields are:

```text id="h4r8p2"
locale-dependent
```

and which are:

```text id="m7x3k5"
locale-independent
```

---

# 33. Structured Data and Multi-Tenancy

For:

```text id="p2n8q4"
acme.example.com/products/123
globex.example.com/products/123
```

the structured representation may differ by:

```text id="v6m1x9"
brand
organization
logo
URL
offers
language
```

Therefore:

```text id="k4r7m2"
tenant
   +
resource
   ↓
structured entity
```

must preserve tenant isolation.

A shared cache must not collapse:

```text id="s8q3p5"
tenant A product
```

into:

```text id="f2m7v1"
tenant B product
```

---

# 34. Structured Data and Cache Identity

The same principle from earlier parts applies:

```text id="c5n9q2"
same URL
    ≠
same structured representation
```

when representation depends on:

```text id="v7m3x8"
tenant
locale
resource state
branding
pricing
inventory
```

Therefore cache identity must include every representation-affecting dependency.

---

# 35. Structured Data and Dynamic Rendering

If structured data is generated server-side:

```text id="r2k7m4"
request
 ↓
resource lookup
 ↓
structured-data generation
 ↓
HTML
```

then dynamic data can participate.

But if:

```text id="p8v3x1"
price
inventory
```

changes frequently, the rendering/cache architecture must account for those dependencies.

Structured data should not silently become stale because it was embedded into a cached document.

---

# 36. Static vs Dynamic Structured Data

Some structured data is stable:

```text id="g4m8p2"
Organization
name
logo
URL
```

Some is dynamic:

```text id="x6r1v9"
Product
price
availability
rating
```

Therefore the architecture can distinguish:

```text id="k3m7q5"
stable semantic data
```

from:

```text id="n8p2v4"
frequently changing semantic data
```

This affects:

```text id="j5r9m1"
rendering
cache lifetime
invalidation
```

---

# 37. Structured Data Validation

Validation should occur at multiple levels.

## Level 1 — JSON validity

```text id="v4m8q2"
Is the output valid JSON?
```

## Level 2 — structural validity

```text id="p7n3x5"
Does the expected entity structure exist?
```

## Level 3 — semantic validity

```text id="r2k9m6"
Does the data accurately represent the resource?
```

## Level 4 — application consistency

```text id="x8v1q4"
Does it agree with:
HTML
metadata
canonical
social representation?
```

This is much more valuable than checking only whether the JSON parses.

---

# 38. Testing Structured Data

A production test suite can verify:

```text id="q5m7x2"
entity type
entity identity
name
URL
image
relationships
required domain fields
```

Example:

```text id="n8p4r1"
Product page
   ↓
extract JSON-LD
   ↓
parse
   ↓
assert Product
   ↓
assert name === product.name
   ↓
assert URL === canonical identity
```

This makes semantic regressions detectable.

---

# 39. Structured Data and Canonical Identity

A strong invariant is:

```text id="m4x8q2"
Structured entity
       ↓
public resource identity
       ↓
canonical URL
```

If:

```text id="z7p3k1"
canonical:
https://example.com/products/123
```

but JSON-LD identifies:

```text id="q9v2m5"
https://example.com/products/456
```

the document contains contradictory identity signals.

---

# 40. Structured Data and Social Identity

Part 05 established:

```text id="x3m8q7"
og:url
```

Structured data adds:

```text id="v5p2n9"
entity identity
```

The system should preserve semantic consistency:

```text id="k7r4m1"
Resource
  │
  ├── canonical URL
  ├── og:url
  └── structured entity identity
```

These representations do not have to be byte-for-byte identical.

They must refer to the intended resource coherently.

---

# 41. Structured Data and Robots

Part 06 established:

```text id="p6m2x9"
indexing policy
```

Structured data should not be treated as an independent public representation when the underlying document should not be exposed.

For example:

```text id="r8v3k5"
private resource
```

should not accidentally expose:

```text id="j2m7q4"
private product details
```

through structured data.

The same visibility boundary applies.

---

# 42. Structured Data Policy

A useful architecture:

```text id="c9p4m2"
Resource
   │
   ▼
Representation Policy
   │
   ├── page
   ├── metadata
   ├── social
   ├── crawler
   └── structured data
```

This creates one place to reason about representation.

Not every page needs every representation.

---

# 43. Structured Data Anti-Pattern: Copying the UI

Bad:

```text id="w7m3p9"
DOM
 ↓
scrape text
 ↓
generate JSON-LD
```

This couples semantic representation to presentation.

If UI structure changes:

```text id="j5q8v2"
semantic output breaks
```

Better:

```text id="n2m7x4"
Domain model
 ↓
structured-data mapper
```

The UI and structured data become separate projections of the same domain state.

---

# 44. Structured Data Anti-Pattern: Database Dump

Also bad:

```text id="x4p9m1"
database row
 ↓
JSON-LD
```

This exposes persistence details and couples external semantics to internal storage.

Better:

```text id="v8m2q5"
Database
 ↓
domain model
 ↓
public semantic projection
 ↓
JSON-LD
```

---

# 45. Structured Data Anti-Pattern: Hardcoded JSON

Bad:

```text id="q3m7v9"
const schema = {
  name: "Example Product"
}
```

inside a dynamic product route.

This will drift.

Better:

```text id="k8p2m4"
const schema = createProductStructuredData(product)
```

where:

```text id="x5r9v1"
product
```

comes from the authoritative domain model.

---

# 46. Structured Data Anti-Pattern: Overclaiming

Do not create structured entities simply because they might provide an SEO benefit.

The entity must actually represent the page.

For example:

```text id="j6m3q8"
page about a product
```

should not arbitrarily claim to represent:

```text id="v4p9x2"
an unrelated event
```

The semantic representation must be truthful.

---

# 47. Production Architecture

A mature architecture can look like:

```text id="n7q3m1"
Request
   │
   ▼
Route resolution
   │
   ▼
Tenant / Locale / Params
   │
   ▼
Resource resolution
   │
   ▼
Representation policy
   │
   ├── Page
   ├── Metadata
   ├── Canonical
   ├── Social
   ├── Crawler
   └── Structured Data
                  │
                  ▼
             JSON-LD
                  │
                  ▼
                 HTML
```

This is the complete document-representation pipeline.

---

# 48. Production Scenario — Product Page

Request:

```text id="r8m2q5"
/products/123
```

Resolution:

```text id="p4x7n1"
route
 ↓
product 123
 ↓
tenant
 ↓
locale
```

Representation:

```text id="k9m3v6"
Product
 ├── HTML
 ├── title
 ├── description
 ├── canonical
 ├── OG
 └── JSON-LD
```

All projections derive from the same product representation.

---

# 49. Production Scenario — Article

Request:

```text id="x5q8m2"
/articles/react-server-components
```

Resource:

```text id="j3p7v9"
Article
```

Representation:

```text id="m6r1k4"
HTML
metadata
canonical
social
structured Article
structured Author
structured Breadcrumb
```

The architecture should avoid independently resolving the article multiple times if doing so creates unnecessary waterfalls.

---

# 50. Production Scenario — Price Mutation

Initial:

```text id="v7m2q8"
price = $999
```

Representations:

```text id="q4p9m1"
HTML = $999
JSON-LD = $999
```

Mutation:

```text id="k8r3v5"
price = $899
```

The system must consider:

```text id="n5m7x2"
page cache
metadata
structured data
social representation if affected
```

This is a cache dependency problem, not merely an SEO problem.

---

# 51. 4-Pillar Engineering Decision Matrix

## JSON-LD

### When to use

When a public resource has meaningful structured semantic information.

### When not to use

Do not fabricate structured entities or expose private information merely for potential search benefits.

### Bottlenecks

Semantic drift, stale data, unsafe serialization, duplicated domain logic.

### Modern alternative

Generate structured data from explicit public domain projections.

---

## Structured-data mapper

### When to use

When application entities need to be represented through an external semantic vocabulary.

### When not to use

Avoid direct database-to-schema coupling.

### Bottlenecks

Mapping complexity and schema evolution.

### Modern alternative

Keep a dedicated semantic mapping boundary.

---

## Entity graphs

### When to use

When multiple related entities meaningfully describe the document.

### When not to use

Do not duplicate unrelated entities simply to increase metadata volume.

### Bottlenecks

Identity management and consistency.

### Modern alternative

Use explicit entity relationships and stable identity where justified.

---

## Dynamic structured data

### When to use

When semantic fields depend on dynamic resource state.

### When not to use

Do not introduce dynamic rendering for static information unnecessarily.

### Bottlenecks

Rendering cost, cache freshness, invalidation.

### Modern alternative

Separate stable semantic data from frequently changing data and choose appropriate cache policy.

---

# 52. Prediction Challenges

## Challenge 1

The UI says:

```text id="m4p8x2"
$999
```

JSON-LD says:

```text id="q7r3n5"
$899
```

What should you investigate?

```text id="v9k2m6"
data source
cache state
pricing context
locale/currency
representation mapping
```

---

## Challenge 2

Two tenants use the same product ID but different branding.

What must structured-data cache identity consider?

```text id="x3m7p1"
tenant + product
```

if tenant affects the representation.

---

## Challenge 3

A user-controlled article title breaks JSON-LD embedding.

What architectural boundary failed?

```text id="p8r4m2"
domain data
    ↓
safe serialization
    ↓
HTML embedding
```

---

## Challenge 4

A canonical URL points to Product 123 but JSON-LD identifies Product 456.

What kind of failure is this?

```text id="n6q2v9"
representation identity inconsistency
```

---

## Challenge 5

Product inventory changes from:

```text id="j7m3x8"
in stock
```

to:

```text id="w4p9q2"
out of stock
```

but structured data remains stale.

What system should you inspect?

```text id="r5k8m1"
inventory mutation
 ↓
cache dependency
 ↓
structured representation
 ↓
invalidation/revalidation
```

---

# 53. Senior Interview Gotchas

### Gotcha 1

**"JSON-LD is just extra HTML."**

No.

It is a machine-readable semantic representation embedded in the document.

---

### Gotcha 2

**"Structured data guarantees rich search results."**

No.

It provides semantic information and potential eligibility; presentation remains a search-system decision.

---

### Gotcha 3

**"Just serialize the database row."**

That couples external semantics to persistence structure.

---

### Gotcha 4

**"Just scrape the DOM."**

That couples semantic representation to UI structure.

---

### Gotcha 5

**"JSON is safe inside a script tag."**

Not automatically.

The serialization must be safe for the actual HTML embedding context.

---

### Gotcha 6

**"The structured-data object should contain every field."**

No.

It should contain semantically meaningful public information.

---

### Gotcha 7

**"Same URL means same entity."**

Not necessarily.

URL identity and semantic entity identity are related but distinct concepts.

---

### Gotcha 8

**"Structured data does not need cache invalidation."**

False.

If its source data changes, its representation can become stale.

---

# 54. 30-Second Executive Cheat Sheet

```text id="y5m8q2"
Domain Entity
      │
      ▼
Public semantic projection
      │
      ▼
Structured Data Model
      │
      ▼
JSON-LD
      │
      ▼
HTML
```

Core principles:

```text id="q3r7m1"
Do not scrape the UI.

Do not dump the database.

Do not hardcode dynamic entities.

Do not expose private fields.

Do not duplicate domain truth.

Do not ignore cache dependencies.

Do not assume structured data
guarantees a search result feature.
```

The primary invariant is:

```text id="n8p4v2"
HTML
metadata
canonical
social
structured data

        ↓

must coherently describe

        ↓

the same intended resource.
```

---

# 55. Completion Checklist

You should be able to explain:

* [ ] Structured-data mental model
* [ ] JSON-LD
* [ ] `@context`
* [ ] `@type`
* [ ] Entity representation
* [ ] Structured data as a projection
* [ ] Domain-to-schema mapping
* [ ] Single source of truth
* [ ] Product structured data
* [ ] Article structured data
* [ ] Organization structured data
* [ ] Breadcrumb structured data
* [ ] Entity identity
* [ ] URL identity vs entity identity
* [ ] Entity relationships
* [ ] Semantic mapping boundary
* [ ] Privacy boundaries
* [ ] User-generated content
* [ ] Safe JSON-LD serialization
* [ ] XSS considerations
* [ ] Localization
* [ ] Multi-tenancy
* [ ] Cache identity
* [ ] Dynamic structured data
* [ ] Structured-data invalidation
* [ ] Structured-data testing
* [ ] Canonical consistency
* [ ] Social consistency
* [ ] Crawler-policy consistency
* [ ] Production debugging
* [ ] Structured-data anti-patterns

---

# Part Boundary

The KPI progression is now:

```text id="m7q2v9"
Part 01
Metadata Mental Model
        ↓
Part 02
Static Metadata
        ↓
Part 03
Dynamic Metadata
        ↓
Part 04
Canonical URLs + Alternates
        ↓
Part 05
Open Graph + Social Representation
        ↓
Part 06
Robots + Indexing Directives
        ↓
Part 07
Structured Data + JSON-LD
```

The conceptual progression is:

```text id="x4n8p2"
What is this document?
        ↓
What resource URL represents it?
        ↓
How should it appear when shared?
        ↓
How should crawlers interact with it?
        ↓
What semantic entities does it represent?
```

The next layer should move into **sitemaps, URL discovery and large-scale indexation architecture**.

That shifts the question from:

```text id="r3m7q1"
"What does this individual document represent?"
```

to:

```text id="k8p2v5"
"How does the application systematically expose
its entire public URL graph to crawlers?"
```

**Part 07 is complete when you can design JSON-LD from authoritative domain projections, preserve semantic consistency across HTML/metadata/canonical/social representations, handle dynamic and tenant-aware entities, safely serialize user-controlled data, and reason about structured-data caching and invalidation.**
