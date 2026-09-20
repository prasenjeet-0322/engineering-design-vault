# Level 08 — Next.js & Full-Stack React

## KPI 09 — Metadata, SEO & Document Representation

# Part 05 — Open Graph, Social Metadata & Share Representation Architecture

---

# 1. Part Objective

A web page is not consumed only by browsers and search engines.

URLs are also consumed by:

```text
social platforms
messaging applications
link preview systems
chat applications
content aggregators
bookmarking systems
```

When a user shares:

```text
https://example.com/products/123
```

the receiving platform may construct a preview containing:

```text
title
description
image
URL
site identity
```

The application therefore has another representation problem:

```text
Application resource
        │
        ├── Browser representation
        ├── Search representation
        └── Social/share representation
```

The central question is:

> **How do we generate a social preview that accurately represents the same resource and representation as the page itself?**

The mental model for this part is:

```text
Resource
   │
   ▼
Representation model
   │
   ├── HTML
   ├── Search metadata
   └── Social metadata
          │
          ▼
      Share preview
```

---

# 2. What Open Graph Represents

Open Graph metadata provides structured information describing a web page for systems that consume shared URLs.

Conceptually:

```text
Open Graph
    =
metadata representation for shared content
```

Typical concepts include:

```text
og:title
og:description
og:image
og:url
og:type
```

The important architectural principle is:

> **Open Graph metadata should describe the same public representation represented by the document.**

---

# 3. Social Metadata Is Not the Page

A common mistake is to treat:

```text
og:title
```

as the actual page title.

It is not.

The application has multiple consumers:

```text
             Resource
                │
       ┌────────┼────────┐
       ▼        ▼        ▼
    Browser   Search   Social
       │        │        │
       ▼        ▼        ▼
     HTML    Metadata  Preview
```

These representations should be consistent, but they are not identical systems.

For example:

```text
HTML title:
MacBook Pro 2026

Open Graph title:
MacBook Pro 2026 — Acme

```

may be intentionally different.

The key requirement is semantic consistency.

---

# 4. Open Graph as a Derived Representation

The same resource model from Part 03 applies.

```text
Product
   │
   ├── name
   ├── description
   ├── image
   └── canonical URL
        │
        ▼
Open Graph model
```

For example:

```text
Product.name
      ↓
og:title

Product.description
      ↓
og:description

Product.primaryImage
      ↓
og:image

Product.canonicalUrl
      ↓
og:url
```

This is preferable to maintaining a second independent source of truth.

---

# 5. Core Open Graph Fields

A typical document representation may include:

```text
og:title
og:description
og:image
og:url
og:type
```

The conceptual mapping is:

| Field            | Represents                |
| ---------------- | ------------------------- |
| `og:title`       | Share-preview title       |
| `og:description` | Share-preview description |
| `og:image`       | Preview image             |
| `og:url`         | URL identity              |
| `og:type`        | Content/resource category |

The exact values should come from the application's resource model.

---

# 6. `og:title`

The title should communicate the identity of the shared resource.

For:

```text
/products/123
```

the application may derive:

```text
Product.name
```

into:

```text
og:title
```

A useful abstraction:

```text
ogTitle = f(resource)
```

Avoid constructing titles from unrelated runtime information.

For example:

```text
"Welcome back Alice — Product 123"
```

may introduce unnecessary personalization.

If the page is public, a stable resource-derived title is generally easier to cache and share.

---

# 7. `og:description`

The description should represent the resource rather than unrelated application state.

For example:

```text
Product.description
```

can become:

```text
og:description
```

The architecture should avoid blindly inserting arbitrary text.

Consider:

```text
description:
"MacBook Pro with M-series processor..."
```

versus:

```text
description:
"Click here!!!"
```

The first is resource-derived.

The second is not a useful representation of the resource.

---

# 8. `og:url`

`og:url` is closely connected to Part 04.

The important invariant is:

```text
og:url
    should describe
the intended public resource identity
```

Suppose:

```text
Request:
https://example.com/products/123?utm_source=email
```

and canonical identity is:

```text
https://example.com/products/123
```

Then the social representation should generally avoid creating contradictory identity signals.

Conceptually:

```text
Request URL
     │
     ▼
Canonical URL
     │
     ├── canonical metadata
     └── og:url
```

The exact policy depends on the application's representation model.

---

# 9. `og:image`

The image is one of the most important social representation fields.

The architecture becomes:

```text
Resource
   │
   ▼
Share image selection
   │
   ▼
og:image
```

For a product:

```text
Product.primaryImage
```

may be used.

For an article:

```text
Article.socialImage
```

may be preferable.

The key principle:

> **Do not assume the image used in the UI is automatically the best social representation.**

---

# 10. UI Image vs Social Image

A product page may contain:

```text
thumbnail
gallery images
zoom images
technical diagrams
```

while social sharing may require:

```text
dedicated social image
```

Therefore:

```text
UI image selection
    ≠
social image selection
```

They may share the same source asset but do not have to.

---

# 11. Image Selection Hierarchy

A useful architecture is:

```text
Dedicated social image
        │
        ├── exists → use it
        │
        └── absent
              ↓
        Primary resource image
              │
              └── fallback
                    ↓
              Site/default image
```

Conceptually:

```text
socialImage =
    resource.socialImage
    ?? resource.primaryImage
    ?? site.defaultSocialImage
```

The exact implementation depends on the application.

The important point is to define the fallback policy explicitly.

---

# 12. Social Image Failure Modes

Possible failures include:

```text
missing image
broken image URL
private image
incorrect tenant image
incorrect locale image
unsupported dimensions
slow image response
expired image
```

These failures affect the share representation even if:

```text
page UI
```

works correctly.

Therefore social metadata needs its own validation.

---

# 13. Absolute Image URLs

Social systems may consume metadata independently of your application's browser navigation.

Therefore the image URL generally needs to be externally resolvable.

Conceptually:

```text
relative:
 /images/product-123.png

resolved:
 https://example.com/images/product-123.png
```

The architecture is:

```text
asset identity
     │
     ▼
public origin
     │
     ▼
absolute image URL
```

This again connects to:

```text
metadataBase
deployment origin
tenant host
```

from Part 04.

---

# 14. Social Image + Multi-Tenancy

Consider:

```text
acme.example.com/products/123
globex.example.com/products/123
```

If the social image is tenant-specific:

```text
Acme image
Globex image
```

then:

```text
Tenant
   +
Product
   ↓
Social image
```

must be represented correctly.

A catastrophic failure would be:

```text
Acme page
   ↓
Globex social image
```

This indicates a representation identity or asset-resolution problem.

---

# 15. Social Image + Localization

Suppose:

```text
/en/articles/react
/fr/articles/react
```

have different social graphics.

Then:

```text
Locale
   +
Article
   ↓
Social image
```

must be part of the metadata dependency graph.

If the image is language-independent:

```text
Article
   ↓
same social image
```

then locale does not need to affect image identity.

The architecture should reflect actual dependencies rather than assuming every context dimension affects every field.

---

# 16. `og:type`

The type communicates the broad category of the shared object.

Conceptually:

```text
article
website
product
```

The important question is:

> **What kind of representation is being shared?**

This should correspond to the application's content model.

Do not choose a type merely because it sounds appropriate.

---

# 17. Metadata Should Remain Semantically Coherent

Suppose:

```text
og:title:
MacBook Pro

og:description:
Latest React tutorial

og:image:
Coffee shop image

og:url:
https://example.com/articles/react
```

Each field describes a different resource.

That creates a broken representation.

The correct model is:

```text
                  Resource
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
      title      description     image
        │            │            │
        └────────────┼────────────┘
                     ▼
               Social Metadata
```

All fields should describe the same underlying representation.

---

# 18. Open Graph and Canonical URL

Part 04 established:

```text
canonical URL
```

Part 05 extends that identity into social metadata.

A useful invariant is:

```text
canonical
   ≈
og:url
```

where both represent the same public resource identity.

They are not necessarily mechanically required to be identical in every architecture, but contradictory values should trigger investigation.

For example:

```text
canonical:
 /products/123

og:url:
 /products/456
```

is a strong indication of metadata inconsistency.

---

# 19. Open Graph and Page Title

Similarly:

```text
HTML title
```

and:

```text
og:title
```

can differ stylistically.

But they should normally preserve the same resource identity.

For example:

```text
HTML:
MacBook Pro 2026 | Acme

OG:
MacBook Pro 2026
```

is coherent.

But:

```text
HTML:
MacBook Pro 2026

OG:
React Server Components Guide
```

is not.

The principle is:

```text
Different formatting
    ≠
different semantic resource
```

---

# 20. Twitter/X-Oriented Metadata

Social ecosystems can consume platform-specific metadata in addition to generic Open Graph metadata.

A production architecture should therefore think in terms of:

```text
Shared resource
       │
       ├── Open Graph representation
       │
       └── platform-specific social representation
```

Rather than duplicating resource logic:

```text
Product
  ├── OG builder
  └── Twitter builder
```

prefer:

```text
Product
   ↓
Social representation model
   ├── OG mapping
   └── platform-specific mapping
```

This keeps domain identity centralized.

---

# 21. Social Metadata Model

A useful abstraction:

```text
SocialMetadata
{
    title
    description
    url
    image
    type
}
```

Then platform-specific metadata can derive from it.

Conceptually:

```text
Resource
   ↓
SocialMetadata
   │
   ├── Open Graph
   └── platform-specific metadata
```

This reduces duplication.

---

# 22. Metadata Normalization

Before emitting social metadata, normalize:

```text
title
description
URL
image URL
resource type
```

Potential normalization concerns include:

```text
whitespace
missing values
invalid URLs
relative paths
unexpected characters
empty strings
```

The goal is:

```text
Domain data
    ↓
normalized social model
    ↓
metadata serialization
```

---

# 23. Truncation Is a Product Decision

Titles and descriptions may have practical presentation constraints on different platforms.

Do not automatically implement:

```text
description.slice(0, 160)
```

as a universal rule.

Different consumers may render differently.

A better architecture is:

```text
Canonical resource description
          │
          ▼
Social description policy
          │
          ▼
Platform metadata
```

If truncation is necessary, define it deliberately.

---

# 24. Avoid Duplicate Business Logic

Bad:

```text
og:title:
product.name.substring(...)

twitter:title:
product.name.substring(...)

page title:
product.name.substring(...)
```

Now three independent rules can diverge.

Better:

```text
Product
   ↓
Title policy
   ↓
Document title
   ├── HTML title
   └── social title
```

The exact formatting can still differ.

But the underlying identity should come from one domain-aware policy.

---

# 25. Dynamic Social Metadata

Part 03 established dynamic metadata.

The same mechanism can derive:

```text
og:title
og:description
og:image
og:url
```

from:

```text
route params
resource data
locale
tenant
```

Conceptually:

```text
generateMetadata(context)
       │
       ▼
resource resolver
       │
       ▼
social metadata mapping
       │
       ▼
Open Graph metadata
```

The important thing is that social metadata becomes another consumer of the same resource representation.

---

# 26. Dynamic Social Image Architecture

Some applications generate social images dynamically.

For example:

```text
/article/react
```

might produce:

```text
image:
React — Server Components
```

from:

```text
article.title
article.author
article.category
```

The architecture becomes:

```text
Article
   │
   ▼
Social image model
   │
   ▼
Image generation
   │
   ▼
Public image URL
   │
   ▼
og:image
```

This is more complex than referencing a static asset.

---

# 27. Generated Social Images and Caching

Suppose:

```text
/article/react
```

generates an image.

If every share request regenerates it:

```text
request
  ↓
image generation
  ↓
response
```

the system can become expensive.

A better architecture considers:

```text
article identity
       ↓
image identity
       ↓
cache
```

For example:

```text
article 123
version 5
      ↓
social-image key
      ↓
cached image
```

The exact implementation depends on the image generation system.

The architectural principle is:

> **Generated social assets should have deliberate cache identity and invalidation behavior.**

---

# 28. Social Image Invalidation

Suppose:

```text
Article title:
"React Server Components"
```

produces a generated image containing the title.

Then the title changes:

```text
"React Server Components in 2026"
```

The social image is now stale.

Therefore:

```text
Article mutation
      │
      ├── page representation
      ├── metadata
      └── generated social image
```

may all require invalidation.

This is the same dependency-graph thinking from KPI 06.

---

# 29. Social Metadata and Cache Identity

Suppose:

```text
acme.example.com/article/123
```

and:

```text
globex.example.com/article/123
```

share the same underlying article ID but use different branding.

Then:

```text
Article ID
    ≠
complete social representation identity
```

The cache may need:

```text
tenant + article
```

rather than merely:

```text
article
```

The same applies to:

```text
locale
theme
branding
```

when those dimensions alter social output.

---

# 30. Social Metadata and Personalization

Avoid unnecessary user-specific social metadata.

For example:

```text
"John, check out this article"
```

is usually not appropriate as a public social representation.

Why?

Because social previews may be:

```text
cached
shared
previewed by other users
stored by third parties
```

A personalized social representation can create both correctness and privacy problems.

The preferred model is usually:

```text
Public URL
   ↓
Public representation
   ↓
Public social metadata
```

---

# 31. Authentication and Social Metadata

Consider:

```text
/dashboard
```

which requires authentication.

Generating public social metadata for a private resource may not make sense.

Questions to ask:

```text
Is the resource publicly accessible?
Can the social crawler access it?
Should the content be shared?
Does metadata reveal private information?
```

A protected resource should not accidentally expose sensitive data through metadata.

This is especially important because:

```text
metadata
```

is itself part of the externally visible document representation.

---

# 32. Social Metadata Security

Potential leakage:

```text
og:title:
"John Doe — Salary Review"

og:description:
"Compensation increased to $..."
```

Even if the page body is protected, metadata may expose sensitive information to:

```text
crawlers
link preview systems
monitoring systems
```

Therefore:

> **Metadata is part of the public security boundary whenever the document is publicly observable.**

Do not assume:

```text
"it's only metadata"
```

means:

```text
"it's not sensitive."
```

---

# 33. Social Metadata and Tenant Isolation

For multi-tenant systems:

```text
Tenant
  ↓
Resource
  ↓
Social metadata
```

must preserve tenant isolation.

Potential failure:

```text
Acme product page
    ↓
Globex logo
Globex social image
Globex title
```

This can result from:

```text
incorrect asset lookup
incorrect cache key
incorrect host resolution
global default leakage
```

The debugging path should therefore include:

```text
host
 ↓
tenant
 ↓
resource
 ↓
asset
 ↓
metadata
 ↓
cache
```

---

# 34. Social Metadata and Locale

Similarly:

```text
French article
```

should not accidentally produce:

```text
English social title
German image
```

unless intentionally designed.

The dependency graph should make locale dependencies explicit:

```text
locale
  +
article
  +
branding
      ↓
social representation
```

---

# 35. Share Representation vs UI Representation

The social preview may intentionally contain less information than the UI.

For example:

```text
Page:
Title
Price
Inventory
Reviews
Specifications
Recommendations
```

Social:

```text
Title
Description
Primary image
URL
```

This is not inconsistency.

It is representation specialization.

The invariant is:

```text
same resource
```

not:

```text
identical field set
```

---

# 36. Social Preview Architecture

A mature system can define:

```text
Resource
   │
   ▼
Representation policy
   │
   ├── Page
   ├── Search metadata
   └── Social metadata
           │
           ├── OG
           └── platform-specific
```

This makes the architecture explicit.

---

# 37. Social Metadata Testing

Do not rely only on browser inspection.

Test:

```text
resource
locale
tenant
canonical URL
social title
social description
social image
```

Example matrix:

| Scenario         | Title             | Image      | URL              |
| ---------------- | ----------------- | ---------- | ---------------- |
| Product EN       | correct           | EN/default | EN URL           |
| Product FR       | localized         | correct    | FR URL           |
| Tenant A         | branded           | tenant A   | tenant A         |
| Tenant B         | branded           | tenant B   | tenant B         |
| Missing image    | fallback          | default    | correct          |
| Missing resource | no false metadata | —          | correct behavior |

---

# 38. Social Metadata Failure Modes

## Failure 1 — Wrong image

Page:

```text
Product A
```

Preview:

```text
Product B image
```

Investigate:

```text
asset resolution
cache identity
tenant
locale
```

---

## Failure 2 — Wrong URL

```text
canonical:
/products/123

og:url:
/products/456
```

Investigate:

```text
URL builder
metadata mapping
resource identity
```

---

## Failure 3 — Stale preview

Database:

```text
new title
```

Preview:

```text
old title
```

Investigate:

```text
resource cache
metadata generation
social asset cache
invalidation
```

---

## Failure 4 — Cross-tenant branding

```text
acme.example.com
```

returns:

```text
Globex logo
```

Investigate:

```text
host → tenant resolution
asset lookup
cache key
```

---

## Failure 5 — Private information leakage

Protected page exposes:

```text
private title
private description
```

through metadata.

Investigate:

```text
authorization
public/private representation boundary
metadata generation
crawler accessibility
```

---

# 39. 4-Pillar Engineering Decision Matrix

## Open Graph metadata

### When to use

For public resources that may be shared externally.

### When not to use

Do not expose sensitive/private information simply because it is useful for previews.

### Bottlenecks

Metadata inconsistency and cache staleness.

### Modern alternative

Derive social metadata from the same domain representation model as the page.

---

## Social images

### When to use

When a visual preview improves resource representation.

### When not to use

Do not create unnecessary image-generation infrastructure for resources that do not benefit from custom imagery.

### Bottlenecks

Image generation latency, storage, caching, invalidation.

### Modern alternative

Use static assets where possible and generated assets where dynamic representation provides meaningful value.

---

## Platform-specific metadata

### When to use

When a platform requires or benefits from specialized metadata.

### When not to use

Avoid duplicating resource logic per platform.

### Bottlenecks

Metadata drift.

### Modern alternative

Create one social representation model and map it to platform-specific metadata.

---

# 40. Prediction Challenges

## Challenge 1

The page shows:

```text
MacBook Pro
```

but the social preview shows:

```text
MacBook Air
```

Where should you investigate?

```text
resource resolver
      ↓
social metadata mapping
      ↓
cache
      ↓
asset/metadata freshness
```

---

## Challenge 2

The page and metadata are correct for Acme, but Globex receives Acme's social image.

What class of problem is this?

Potentially:

```text
tenant resolution
cache identity
asset isolation
```

---

## Challenge 3

A product title changes, but social previews remain stale.

What dependency graph should you inspect?

```text
Product
   ↓
Metadata
   ↓
Social representation
   ↓
Preview cache / generated asset
```

---

## Challenge 4

A private dashboard's `og:description` exposes confidential information.

What principle was violated?

```text
Metadata is part of the externally observable representation.
```

---

## Challenge 5

A generated social image includes the article title.

The article title changes.

What must happen?

```text
Article mutation
   ↓
social image dependency becomes stale
   ↓
regenerate/invalidate according to cache policy
```

---

# 41. Senior Interview Gotchas

### Gotcha 1

**"Open Graph is just SEO."**

No.

It primarily describes shared/social representation.

---

### Gotcha 2

**"The social image should always be the hero image."**

Not necessarily.

A dedicated social asset may better represent the resource.

---

### Gotcha 3

**"If the page is protected, metadata cannot leak."**

False.

Metadata can itself expose sensitive information.

---

### Gotcha 4

**"Canonical and `og:url` are unrelated."**

They represent different metadata concepts but should normally remain coherent around public resource identity.

---

### Gotcha 5

**"Generated social images are static once generated."**

Not necessarily.

They can become stale when their source dependencies change.

---

### Gotcha 6

**"Social metadata can be independently hardcoded."**

This creates metadata drift.

Prefer deriving it from the resource representation model.

---

### Gotcha 7

**"Same product ID means same social representation."**

Not necessarily.

Tenant, locale, branding, or other representation dimensions may alter the output.

---

# 42. 30-Second Executive Cheat Sheet

```text
Resource
   ↓
Representation model
   │
   ├── HTML
   ├── Search metadata
   └── Social metadata
           │
           ├── title
           ├── description
           ├── URL
           ├── image
           └── type

Core invariant:

Social metadata must describe
the same public resource represented
by the page.

Important dependencies:

resource
tenant
locale
branding
canonical URL
asset identity

Generated social images introduce:

generation
caching
invalidation
failure handling

Security rule:

Metadata is externally observable.
Never assume metadata is harmless.
```

---

# 43. Completion Checklist

You should be able to explain:

* [ ] Open Graph mental model
* [ ] `og:title`
* [ ] `og:description`
* [ ] `og:image`
* [ ] `og:url`
* [ ] `og:type`
* [ ] Social metadata vs page representation
* [ ] Social metadata vs SEO metadata
* [ ] Resource-derived social metadata
* [ ] Social image selection
* [ ] Image fallback strategy
* [ ] Absolute image URLs
* [ ] Tenant-aware social assets
* [ ] Locale-aware social assets
* [ ] Platform-specific metadata
* [ ] Social representation model
* [ ] Dynamic social metadata
* [ ] Generated social images
* [ ] Social image caching
* [ ] Social image invalidation
* [ ] Social metadata cache identity
* [ ] Personalization risks
* [ ] Authentication boundaries
* [ ] Metadata security
* [ ] Cross-tenant leakage
* [ ] Social metadata testing
* [ ] Social metadata debugging

---

# Part Boundary

This part establishes **social/share representation architecture**.

The progression is now:

```text
Part 01
Metadata mental model
        ↓
Part 02
Static metadata
        ↓
Part 03
Dynamic metadata
        ↓
Part 04
Canonical + alternate URL identity
        ↓
Part 05
Open Graph + social representation
```

The next layer should move into **crawler/indexing behavior and robots policy**, where the architecture shifts from:

```text
"What should this document say about itself?"
```

to:

```text
"What should automated crawlers be permitted or instructed to do with this representation?"
```

**Part 05 is complete when you can design a tenant-, locale-, resource-, and cache-aware social representation without duplicating domain logic, leaking private information, or allowing social metadata to diverge from the public resource identity.**
