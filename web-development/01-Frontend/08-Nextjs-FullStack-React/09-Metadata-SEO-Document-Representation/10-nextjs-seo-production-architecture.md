# Level 08 — KPI 09 — Part 10

## Production SEO & Metadata Architecture Capstone

---

# 1. Part Objective

This is the final integration part of **KPI 09 — Metadata, SEO & Web Representation Architecture**.

The previous parts isolated the major mechanisms:

1. Metadata mental model
2. Static metadata
3. Dynamic metadata
4. Canonical URLs and alternates
5. Open Graph and social metadata
6. Robots and indexing directives
7. Structured data / JSON-LD
8. Sitemaps and URL discovery
9. Cross-surface SEO representation consistency

This part combines them into a single production architecture.

The goal is not to memorize APIs.

The goal is to be able to look at a real application and answer:

> **How should this application determine, generate, cache, validate, observe, and operate its public web representation?**

---

# 2. The Final KPI Mental Model

The complete architecture is:

```text
                         REQUEST
                            │
                            ▼
                    ROUTE RESOLUTION
                            │
                            ▼
                  TENANT / LOCALE
                            │
                            ▼
                  RESOURCE RESOLUTION
                            │
                            ▼
                REPRESENTATION POLICY
                            │
                            ▼
                   RESOURCE IDENTITY
                            │
             ┌──────────────┼───────────────┐
             │              │               │
             ▼              ▼               ▼
        CANONICAL       VISIBILITY      DISCOVERY
             │              │               │
             └──────────────┼───────────────┘
                            ▼
                   REPRESENTATION MODEL
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                  │
          ▼                 ▼                  ▼
      METADATA           SOCIAL           STRUCTURED
                           DATA              DATA
          │                 │                  │
          └─────────────────┼──────────────────┘
                            ▼
                           HTML
                            │
                            ▼
                     CRAWLER DISCOVERY
                            │
                            ▼
                         SITEMAP
```

This is the architecture you should retain.

---

# 3. SEO Is a Representation System

A production web application produces more than visible HTML.

It produces multiple representations:

```text
HTML
Metadata
Canonical URL
Alternate URLs
Open Graph
Robots directives
Structured data
Sitemap entries
```

These representations are consumed by different systems:

```text
Browser
Search crawlers
Social crawlers
Search indexing systems
Assistive/automated consumers
```

Therefore:

```text
SEO architecture
=
external representation architecture
```

It is not simply:

```text
SEO
=
<meta> tags
```

---

# 4. The Resource Is the Source of Truth

Start with the domain resource.

Example:

```text
Product
Article
Category
Organization
Profile
Event
```

Resolve:

```text
resource
tenant
locale
publication state
visibility
canonical identity
```

Then derive representations.

The direction should be:

```text
Domain State
      ↓
Resource Identity
      ↓
Representation Policy
      ↓
External Representations
```

Not:

```text
HTML
      ↓
SEO logic
      ↓
Sitemap
      ↓
structured data
```

---

# 5. Production Representation Object

A conceptual representation model might look like:

```ts
type PublicRepresentation = {
  resource: {
    type: string;
    id: string;
  };

  tenant?: {
    id: string;
    origin: string;
  };

  locale: string;

  canonicalUrl?: string;

  alternates?: Record<string, string>;

  indexable: boolean;

  discoverable: boolean;

  socialShareable: boolean;

  structuredDataEligible: boolean;

  metadata: {
    title: string;
    description?: string;
  };

  social?: {
    title: string;
    description?: string;
    image?: string;
  };

  structuredData?: unknown;

  sitemap?: {
    include: boolean;
    lastModified?: Date;
  };
};
```

This is a conceptual model.

The exact implementation can vary.

The architectural principle does not:

> **Resolve representation decisions centrally before projecting them into individual protocols.**

---

# 6. End-to-End Request Lifecycle

Consider:

```text
GET /products/123
```

The system should conceptually execute:

```text
1. Receive request
2. Resolve route
3. Resolve tenant
4. Resolve locale
5. Resolve resource
6. Determine publication/visibility state
7. Determine representation policy
8. Determine canonical identity
9. Generate metadata
10. Generate social representation
11. Generate structured data
12. Generate crawler directives
13. Render HTML
14. Expose appropriate discovery representation
```

The important thing is that these decisions share context.

---

# 7. Step 1 — Request Resolution

Start with the request:

```text
Host
Path
Query
Headers
Cookies
```

Determine:

```text
route
tenant
locale
resource parameters
```

For example:

```text
Host:
acme.example.com

Path:
/products/123

Locale:
en-US

Tenant:
acme

Product:
123
```

---

# 8. Step 2 — Resource Resolution

Resolve the actual domain object.

```ts
const product = await getProduct({
  tenantId,
  productId,
  locale,
});
```

Do not assume:

```text
route parameter = resource
```

The route identifies the lookup inputs.

The resource resolver determines the actual domain entity.

---

# 9. Step 3 — Representation Policy

Determine:

```text
Is it public?
Is it published?
Is it indexable?
Should it appear in sitemap?
Should it generate structured data?
Should it have social metadata?
```

For example:

```text
Published Product
→ public
→ indexable
→ discoverable
→ socialShareable
→ structuredDataEligible
```

Draft:

```text
Draft Product
→ not public
→ not indexable
→ not discoverable
```

---

# 10. Step 4 — Canonical Identity

Determine the canonical URL.

For:

```text
tenant:
acme

locale:
en-US

product:
123
```

the canonical representation might be:

```text
https://acme.example.com/products/123
```

This identity should then flow into:

```text
metadata
Open Graph
structured data
sitemap
```

where appropriate.

---

# 11. Step 5 — Metadata

Generate:

```text
title
description
icons
other document metadata
```

The metadata should describe the resolved resource.

Example:

```text
Product 123
↓
"Professional Laptop — Acme"
```

The metadata should not independently query an unrelated version of the product.

---

# 12. Step 6 — Open Graph

Generate social representation from the same resource.

```text
resource
   ↓
social title
social description
social image
social URL
```

The social URL should normally correspond to the public representation identity.

---

# 13. Step 7 — Structured Data

Generate JSON-LD from the same resource.

Example conceptual mapping:

```text
Product domain object
       ↓
Product schema representation
```

Not:

```text
database row
       ↓
dump entire row into JSON-LD
```

The structured data layer is a semantic mapping boundary.

---

# 14. Step 8 — Crawler Policy

Determine:

```text
index
follow
```

and any other applicable crawler-facing directives.

This must be based on the representation policy.

For example:

```text
draft
→ noindex

published
→ indexable
```

Do not confuse crawler policy with security.

---

# 15. Step 9 — HTML Rendering

The final HTML should expose a coherent representation:

```text
HTML
├── visible content
├── metadata
├── canonical
├── social metadata
├── robots directives
└── structured data
```

The visible page and machine-readable metadata should describe the same intended resource.

---

# 16. Step 10 — Sitemap Representation

The sitemap is generated separately as a discovery representation.

But it should use the same:

```text
resource identity
publication state
canonical identity
locale
tenant
```

A product should not be included simply because a database record exists.

Instead:

```text
resource
    ↓
public representation?
    ↓
canonical?
    ↓
discoverable?
    ↓
sitemap inclusion
```

---

# 17. The Production Dependency Graph

A useful mental model is:

```text
                    RESOURCE
                       │
                       ▼
               RESOURCE STATE
                       │
                       ▼
             REPRESENTATION POLICY
                       │
         ┌─────────────┼──────────────┐
         ▼             ▼              ▼
     IDENTITY       VISIBILITY     DISCOVERY
         │             │              │
         └─────────────┼──────────────┘
                       ▼
              REPRESENTATION MODEL
                       │
       ┌───────────────┼────────────────┐
       ▼               ▼                ▼
   Metadata          Social         Structured Data
       │               │                │
       └───────────────┼────────────────┘
                       ▼
                      HTML
```

This graph gives you the dependency direction.

---

# 18. Caching the Architecture

A production application cannot necessarily regenerate every representation from scratch for every request.

Therefore caching becomes important.

Possible layers:

```text
Resource cache
Representation cache
Page/render cache
Metadata cache
Social image cache
Sitemap cache
```

The challenge is maintaining coherent invalidation.

---

# 19. Example Mutation

Suppose:

```text
Product 123
```

changes:

```text
title:
"Old Laptop"
→
"New Laptop"
```

Potentially affected:

```text
HTML
metadata title
Open Graph title
structured data name
```

Therefore the mutation must invalidate all dependent representations.

Conceptually:

```text
Product Updated
       ↓
Representation Dependency Graph
       ↓
Invalidate affected projections
```

---

# 20. Slug Change

A slug change is more significant.

```text
/products/old-name
```

becomes:

```text
/products/new-name
```

Potentially affected:

```text
old URL
new URL
canonical
redirect
Open Graph URL
structured-data URL
sitemap
internal links
cached HTML
metadata
```

This is not merely a database update.

It is a public representation identity change.

---

# 21. Publication State Change

Suppose:

```text
draft
```

becomes:

```text
published
```

The representation graph changes.

Before:

```text
HTML:
preview/private

robots:
noindex

sitemap:
excluded
```

After:

```text
HTML:
public

robots:
indexable

sitemap:
included
```

The transition should trigger the necessary invalidation and regeneration.

---

# 22. Unpublishing

The reverse transition is equally important.

```text
published
→
unpublished
```

Potential actions:

```text
remove sitemap membership
invalidate page cache
change crawler policy
change metadata behavior
remove public structured representation
```

If the URL has historical public existence, routing behavior also needs an explicit policy.

---

# 23. URL Migration

Suppose:

```text
/products/123
```

moves to:

```text
/catalog/products/123
```

A production migration should consider:

```text
old URL
new URL
redirect behavior
canonical
sitemap
internal links
metadata
social URL
structured-data URL
cache
```

The system should avoid leaving multiple competing public identities.

---

# 24. Multi-Locale Production Architecture

Suppose:

```text
/en/products/123
/fr/products/123
/de/products/123
```

The system should model:

```text
Product 123
   │
   ├── English representation
   ├── French representation
   └── German representation
```

Then generate:

```text
canonical
alternates
metadata
social metadata
structured data
sitemap
```

from the locale-aware representation model.

---

# 25. Multi-Tenant Production Architecture

Suppose:

```text
tenant-a.example.com
tenant-b.example.com
```

Both contain:

```text
/products/123
```

Resource identity should be:

```text
tenant + resource + locale
```

not simply:

```text
resource ID
```

This protects against:

```text
wrong canonical
wrong social URL
wrong sitemap
wrong structured data
cross-tenant content
```

---

# 26. Custom Domain Architecture

For SaaS systems:

```text
customer-a.com
customer-b.com
```

the public origin becomes part of representation identity.

The application should explicitly resolve:

```text
request host
        ↓
tenant
        ↓
public origin
        ↓
canonical URL
```

Avoid scattering host derivation throughout individual metadata functions.

---

# 27. Failure Handling

Production systems must define what happens when dependencies fail.

Suppose the product database is temporarily unavailable.

Possible behaviors differ by surface.

The application needs deliberate decisions for:

```text
HTML
metadata
structured data
social metadata
sitemap
```

Do not accidentally emit fabricated SEO data merely because a fallback object exists.

A safe rule is:

> **Never generate a stronger public representation than the system can actually establish.**

---

# 28. Partial Failure

Consider:

```text
HTML:
successful

structured data:
generation failed
```

Should the entire request fail?

Not necessarily.

This depends on the application's requirements.

The important architectural point is:

```text
representation failures
```

should be classified separately from:

```text
core resource failures
```

Observability should make that distinction visible.

---

# 29. External Dependencies

Metadata or structured data may depend on:

```text
CMS
product API
pricing service
inventory service
image service
translation service
```

Every additional dependency creates:

```text
latency
failure risk
cache complexity
consistency risk
```

Therefore SEO generation should not blindly create waterfalls.

---

# 30. Avoiding Metadata Waterfalls

Bad:

```text
render page
   ↓
fetch product

generate metadata
   ↓
fetch product again

generate structured data
   ↓
fetch product again
```

Potential result:

```text
same resource
multiple requests
```

Better:

```text
resolve resource
      ↓
shared cached/data layer
      ↓
HTML
metadata
structured data
social
```

The implementation depends on the framework and caching architecture.

The principle is:

> **Share resource resolution where the runtime allows it without compromising correctness.**

---

# 31. Security Boundary

SEO generation must never become a data-leak path.

Dangerous example:

```text
private product
   ↓
structured data
   ↓
private pricing exposed publicly
```

Or:

```text
authenticated user
   ↓
personalized metadata
   ↓
cached globally
```

Potential result:

```text
User A's representation
→
User B
```

Therefore:

```text
public representation
```

must be separated from:

```text
personalized/private representation
```

---

# 32. Personalization

Suppose the page says:

```text
Welcome back, Srikar
```

Do not automatically place user-specific information into globally cached metadata.

SEO-facing representations should generally be based on public resource state.

A useful rule:

```text
public resource state
→
public SEO representation
```

while:

```text
private user state
→
private application representation
```

---

# 33. Observability Model

A production SEO system should expose enough information to answer:

> Why did this URL receive this representation?

Useful diagnostic fields:

```text
request URL
resolved resource
tenant
locale
publication state
canonical URL
indexability
sitemap eligibility
structured-data eligibility
representation version
cache source
generation duration
error state
```

---

# 34. Representation Versioning

For complex systems, it can be useful to think in terms of representation versions.

Example:

```text
resource version:
42

representation version:
42
```

If:

```text
database = version 42
metadata cache = version 39
```

the system has a stale projection.

This mental model makes debugging cache inconsistency much easier.

---

# 35. Automated Validation

Production pipelines can validate:

### URL integrity

```text
canonical is absolute
canonical uses expected origin
canonical matches resource identity
```

### Representation consistency

```text
og:url == canonical
structured-data identity == resource identity
sitemap URL == intended canonical
```

### Policy consistency

```text
non-public resource
→ not discoverable
```

### Locale consistency

```text
French page
→ French representation identity
```

### Tenant consistency

```text
tenant A resource
→ tenant A public origin
```

---

# 36. Testing Strategy

Use multiple testing layers.

## Unit tests

Test:

```text
URL builders
policy functions
structured-data serializers
metadata transformations
```

## Integration tests

Test:

```text
route → resource → representation
```

## End-to-end tests

Test:

```text
HTTP request
→ rendered document
→ metadata
→ canonical
→ structured data
```

## Operational tests

Test:

```text
publication
unpublication
slug changes
tenant changes
locale changes
cache invalidation
```

---

# 37. Production Invariants

These invariants should become part of your engineering vocabulary.

### Invariant 1

```text
canonical identity
must describe
the resolved public resource
```

### Invariant 2

```text
Open Graph URL
should correspond to
the same public representation
```

### Invariant 3

```text
structured data
must describe
the intended entity represented by the page
```

### Invariant 4

```text
non-public resources
must not become public discovery candidates
```

### Invariant 5

```text
sitemap membership
should be derived from
public representation eligibility
```

### Invariant 6

```text
robots directives
must never substitute for authorization
```

### Invariant 7

```text
tenant + locale + resource identity
must remain coherent
across all URL-bearing projections
```

---

# 38. Production Architecture Example

Consider an e-commerce platform.

```text
Request
  ↓
Host: shop.example.com
Path: /products/123
  ↓
Tenant Resolver
  ↓
Locale Resolver
  ↓
Product Resolver
  ↓
Publication Policy
  ↓
Canonical URL Builder
  ↓
Representation Model
  ├── Metadata
  ├── Open Graph
  ├── Robots
  ├── JSON-LD
  └── Sitemap eligibility
  ↓
React / Next.js Rendering
  ↓
HTML
```

Mutation:

```text
Admin updates Product 123
  ↓
Product event
  ↓
Representation invalidation
  ├── page
  ├── metadata
  ├── social
  ├── structured data
  └── sitemap
```

This is the production-level mental model expected from a senior engineer.

---

# 39. Architecture Decision Matrix

| Decision                            | Correctness | Performance    | Reliability | Maintainability |
| ----------------------------------- | ----------- | -------------- | ----------- | --------------- |
| Central resource resolver           | High        | High           | High        | High            |
| Independent SEO DB queries          | Risky       | Lower          | Lower       | Lower           |
| Shared representation model         | High        | High           | High        | High            |
| Hardcoded sitemap                   | Low         | High initially | Low         | Low             |
| Central URL builder                 | High        | High           | High        | High            |
| Independent URL generation          | Risky       | Variable       | Low         | Low             |
| Explicit invalidation               | High        | High           | High        | High            |
| User-specific global metadata cache | Low         | High           | Low         | Low             |

The table is not a ranking of technologies.

It describes architectural consequences.

---

# 40. Prediction Challenge — Full System

You receive this production bug:

```text
A product was renamed.

The product page displays the new name.

The browser title displays the new name.

Google preview still shows the old name.

The sitemap contains the correct URL.

JSON-LD contains the old name.
```

Identify the likely architecture problem.

The page is not the only representation.

The mutation invalidated some projections but not all.

Likely dependency graph:

```text
Product
  ├── HTML → fresh
  ├── Metadata → fresh
  ├── Sitemap → fresh
  └── JSON-LD → stale
```

The solution is not merely:

```text
change JSON-LD code
```

The deeper fix is:

```text
correct representation dependency/invalidation architecture
```

---

# 41. Prediction Challenge — Tenant Bug

You receive:

```text
Tenant A:
https://a.example.com/products/123
```

but generated canonical is:

```text
https://b.example.com/products/123
```

What should you investigate?

```text
request host resolution
tenant resolution
public origin mapping
URL builder inputs
cache key
representation context propagation
```

The key architectural question:

> Where was tenant identity lost?

---

# 42. Prediction Challenge — Locale Bug

Request:

```text
/fr/products/123
```

produces:

```text
canonical:
/fr/products/123

og:url:
/en/products/123

JSON-LD URL:
/fr/products/123

sitemap:
/en/products/123
```

The individual systems are functioning.

The shared locale context is not.

The correct diagnosis is:

```text
representation context divergence
```

---

# 43. Prediction Challenge — Private Data

An authenticated user visits:

```text
/account
```

The generated metadata includes:

```text
"John's Account — $43,821 balance"
```

The response is globally cached.

Another user receives the cached metadata.

This is a security architecture failure.

The correct lesson:

```text
personalized state
must not leak into
public/shared representation caches
```

---

# 44. Senior Interview Question

### “How would you design SEO architecture for a large Next.js application?”

A strong answer should discuss:

```text
1. Resource identity
2. Route resolution
3. Tenant/locale resolution
4. Publication state
5. Representation policy
6. Canonical URL construction
7. Metadata generation
8. Open Graph
9. Robots/indexing policy
10. Structured data
11. Sitemap generation
12. Caching
13. Invalidation
14. Security boundaries
15. Testing
16. Observability
17. Deployment/environment behavior
```

The answer should be architectural rather than:

> “I would use `generateMetadata()`.”

The API is only one component.

---

# 45. Senior Interview Question

### “How do you prevent SEO metadata from becoming inconsistent?”

A strong response:

```text
Do not make each SEO surface independently resolve business state.

Resolve the resource and representation policy centrally.

Then derive metadata, canonical URLs, social metadata, structured data, crawler policy, and sitemap eligibility from that shared model.

Finally, test cross-surface invariants and invalidate all dependent projections when the underlying resource changes.
```

---

# 46. Senior Interview Question

### “What happens when a product URL changes?”

A strong architectural response should include:

```text
new resource identity
old URL handling
redirect policy
canonical update
metadata update
Open Graph update
structured-data URL update
sitemap update
internal-link update
cache invalidation
observability
```

This demonstrates system thinking rather than API memorization.

---

# 47. KPI-Level Mental Model

At the completion of this KPI, you should see:

```text
SEO
```

as:

```text
Resource Representation Architecture
```

not:

```text
Metadata Configuration
```

The complete dependency chain is:

```text
Domain Resource
      ↓
Identity
      ↓
Publication / Visibility
      ↓
Representation Policy
      ↓
Canonical Identity
      ↓
Metadata / Social / Robots / Structured Data
      ↓
HTML
      ↓
Discovery / Sitemap
```

---

# 48. Final KPI Knowledge Map

## Part 01 — Metadata Mental Model

Understand metadata as part of document representation.

## Part 02 — Static Metadata

Understand deterministic metadata configuration.

## Part 03 — Dynamic Metadata

Understand resource-driven metadata generation.

## Part 04 — Canonical URLs & Alternates

Understand URL identity and alternate representations.

## Part 05 — Open Graph & Social Metadata

Understand social representation.

## Part 06 — Robots & Indexing Directives

Understand crawler control and indexing policy.

## Part 07 — Structured Data

Understand semantic machine-readable representation.

## Part 08 — Sitemaps & URL Discovery

Understand large-scale URL discovery.

## Part 09 — Cross-Surface Consistency

Understand how all representations must agree.

## Part 10 — Production Architecture

Integrate the entire system into an operational architecture.

---

# 49. What You Should Be Able to Do Now

You should be able to take a real production application and identify:

```text
Where is resource identity resolved?

Where is tenant identity resolved?

Where is locale resolved?

Where is publication state determined?

Where is canonical identity generated?

Where is metadata generated?

Where is social metadata generated?

Where are crawler directives determined?

Where is structured data generated?

Where is sitemap membership determined?

Where are these representations cached?

What invalidates them?

How are inconsistencies detected?

How are representation failures observed?

How are private representations separated from public ones?
```

If you cannot answer these questions in an existing codebase, the architecture is not yet understood.

---

# 50. Final KPI Completion Checklist

### Mental Models

* [ ] Metadata is understood as representation
* [ ] Canonical identity is understood
* [ ] Crawling and indexing are distinguished
* [ ] Structured data is understood as semantic projection
* [ ] Sitemap is understood as discovery
* [ ] Cross-surface consistency is understood

### Next.js Architecture

* [ ] Static metadata
* [ ] `generateMetadata()`
* [ ] dynamic route metadata
* [ ] canonical configuration
* [ ] alternates
* [ ] Open Graph
* [ ] robots
* [ ] structured data
* [ ] sitemap generation

### Production Architecture

* [ ] Resource resolution
* [ ] Representation policy
* [ ] Tenant-aware representation
* [ ] Locale-aware representation
* [ ] Cache architecture
* [ ] Invalidation architecture
* [ ] Security boundaries
* [ ] Environment separation
* [ ] Observability
* [ ] Automated consistency testing

### Senior-Level Reasoning

* [ ] Diagnose inconsistent representations
* [ ] Diagnose stale SEO projections
* [ ] reason about canonical conflicts
* [ ] reason about sitemap eligibility
* [ ] reason about tenant/locale identity
* [ ] reason about cache invalidation
* [ ] reason about public vs personalized representations
* [ ] design an end-to-end SEO architecture

---

# 51. Final Principle

The most important concept from the entire KPI is:

> **A production application should resolve resource identity and representation policy once, then derive every external representation from that shared model.**

Therefore:

```text
Resource
   ↓
Identity
   ↓
Policy
   ↓
Representation
   ├── HTML
   ├── Metadata
   ├── Canonical
   ├── Alternates
   ├── Open Graph
   ├── Robots
   ├── Structured Data
   └── Sitemap
```

The individual APIs are implementation details.

The architecture is the skill.

---

# 52. KPI 09 Boundary

**KPI 09 is now complete.**

The next KPI should therefore move beyond metadata/SEO representation and into the next independently testable Level 08 capability rather than extending this KPI with more SEO mechanisms.

The completion boundary is:

```text
KPI 09
Metadata / SEO / Web Representation Architecture
                ↓
             COMPLETE
```
