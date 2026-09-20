# Level 08 — KPI 09 — Part 09

## SEO Representation Architecture & Cross-Surface Consistency

---

## 1. Part Objective

The previous parts established the individual mechanisms used to describe a web resource:

* metadata
* dynamic metadata
* canonical URLs
* alternate URLs
* Open Graph/social metadata
* crawler directives
* structured data
* sitemaps and URL discovery

This part moves from **individual SEO mechanisms** to the **architecture that makes them agree**.

The senior-level problem is no longer:

> “How do I add metadata?”

It becomes:

> “How does the application ensure that every machine-readable representation of a resource describes the same resource, under the same visibility, identity, localization, tenancy, and indexing rules?”

The central concern is **cross-surface consistency**.

A production page can simultaneously expose:

```text
HTML
Metadata
Canonical URL
Alternate URLs
Open Graph
Robots directives
Structured Data
Sitemap membership
```

These are different representations and control surfaces.

They must not independently invent what the resource means.

---

# 2. The Core Mental Model

A useful architecture is:

```text
                         ┌── HTML
                         │
                         ├── Metadata
                         │
Resource Identity ───────┼── Canonical
                         │
                         ├── Alternates
                         │
                         ├── Open Graph
                         │
                         ├── Robots / Indexing
                         │
                         ├── Structured Data
                         │
                         └── Sitemap
```

The important architectural insight is:

> These surfaces should be projections of the same underlying representation model.

Not:

```text
HTML team decides one thing
SEO code decides another
Sitemap code decides another
Social metadata decides another
```

Instead:

```text
Request
  ↓
Route Resolution
  ↓
Tenant / Locale / Resource Resolution
  ↓
Representation Policy
  ↓
Resource Identity
  ↓
Canonical Representation
  ↓
┌──────────────────────────────────────────┐
│              Projections                 │
│                                          │
│ HTML                                     │
│ Metadata                                 │
│ Canonical                                │
│ Alternates                               │
│ Open Graph                               │
│ Robots                                   │
│ Structured Data                          │
│ Sitemap                                  │
└──────────────────────────────────────────┘
```

---

# 3. Why Cross-Surface Consistency Matters

Consider a product:

```text
/products/iphone-17
```

Suppose the application produces:

```text
HTML:
Product A

Canonical:
https://example.com/products/iphone-17

Open Graph:
https://example.com/products/iphone-16

Structured Data:
Product B

Sitemap:
https://example.com/products/iphone-17
```

Each individual subsystem may technically work.

The system as a whole is inconsistent.

The problem is not a missing API.

The problem is:

> Multiple systems disagree about resource identity.

That is an architecture problem.

---

# 4. Resource Identity Comes First

Before generating SEO representations, determine:

```text
What resource is this request representing?
```

For example:

```ts
type ResourceIdentity = {
  type: "product";
  id: string;
  tenantId: string;
  locale: string;
  canonicalPath: string;
};
```

The identity may be derived from:

```text
host
pathname
route params
locale
tenant
database resource
publication state
```

Example:

```text
Host:
shop.example.com

Locale:
en-US

Route:
products/123

Resource:
Product 123

Tenant:
shop

Canonical:
https://shop.example.com/products/123
```

Everything else should derive from this identity.

---

# 5. Representation Policy

Resource identity alone is not sufficient.

The application must also determine whether the representation should be:

```text
public
indexable
canonical
localized
shareable
discoverable
```

A useful conceptual policy:

```ts
type RepresentationPolicy = {
  public: boolean;
  indexable: boolean;
  canonical: boolean;
  discoverable: boolean;
  socialShareable: boolean;
  structuredDataEligible: boolean;
};
```

Example:

```text
Published public product
→ public
→ indexable
→ canonical
→ discoverable
→ socialShareable
→ structuredDataEligible
```

But:

```text
Draft product
→ public: false
→ indexable: false
→ discoverable: false
→ structuredDataEligible: false
```

This prevents each surface from independently deciding visibility.

---

# 6. Separate Resource Identity From Representation Policy

These are different concepts.

### Identity

Answers:

> What resource is this?

### Policy

Answers:

> How should this resource be represented externally?

For example:

```text
Resource:
Product 123

Policy:
published = false
```

The resource exists.

But the public representation may not be eligible for:

```text
indexing
sitemap discovery
social sharing
structured data
```

Therefore:

```text
resource existence ≠ public representation eligibility
```

This distinction is essential in production systems.

---

# 7. The Canonical Representation Object

A mature system can centralize derived representation information.

Conceptually:

```ts
type SeoRepresentation = {
  identity: ResourceIdentity;

  canonicalUrl?: string;

  alternates?: {
    languages?: Record<string, string>;
  };

  metadata?: {
    title: string;
    description?: string;
  };

  social?: {
    title: string;
    description?: string;
    image?: string;
  };

  crawler?: {
    index: boolean;
    follow: boolean;
  };

  structuredData?: unknown;

  sitemap?: {
    include: boolean;
    lastModified?: Date;
  };
};
```

The exact implementation may differ.

The architecture matters more than the interface.

The objective is to avoid this:

```text
generateMetadata()
    ↓
independent logic

generateOpenGraph()
    ↓
independent logic

generateRobots()
    ↓
independent logic

generateJsonLd()
    ↓
independent logic

generateSitemap()
    ↓
independent logic
```

Instead:

```text
resolveResource()
        ↓
resolveRepresentationPolicy()
        ↓
resolveCanonicalIdentity()
        ↓
generate projections
```

---

# 8. Single Source of Truth

The most important rule is:

> Do not duplicate business identity logic across SEO surfaces.

Bad:

```ts
// metadata
const product = await getProduct(params.id);

// sitemap
const products = await getProducts();

// structured data
const product = await db.product.find(...);

// Open Graph
const product = await fetch(...);
```

Each implementation can eventually diverge.

Better:

```text
Product Resolver
      ↓
Resource Model
      ↓
SEO / Representation Model
      ↓
Multiple projections
```

For example:

```ts
const representation =
  await resolveProductRepresentation({
    tenant,
    locale,
    productId,
  });
```

Then:

```text
metadata ← representation
canonical ← representation
Open Graph ← representation
JSON-LD ← representation
sitemap ← representation
```

---

# 9. Canonical URL Consistency

Canonical URL should represent the resource's intended public identity.

For a page:

```text
https://example.com/products/123
```

the following should normally agree:

```text
canonical URL
og:url
sitemap URL
```

That does not mean every URL must always be identical.

There can be legitimate differences.

For example:

```text
alternate locale:
https://example.com/fr/products/123
```

But they should describe a coherent representation graph.

---

# 10. Canonical vs Sitemap

These mechanisms have different jobs.

### Canonical

Communicates:

> This is the preferred URL representation for this resource.

### Sitemap

Communicates:

> These URLs are useful candidates for discovery.

Therefore:

```text
sitemap inclusion
≠ canonical declaration
```

But they should normally be consistent.

A common failure:

```text
Sitemap:
URL A

URL A:
canonical → URL B
```

This creates a conflicting signal.

A senior engineer should recognize:

```text
Sitemap identity
        ↓
should generally align with
        ↓
canonical identity
```

---

# 11. Canonical vs Robots

These also solve different problems.

```text
Canonical:
Which representation is preferred?

Robots:
Should this representation be indexed?

```

Therefore:

```text
noindex
≠ canonical
```

And:

```text
canonical
≠ authorization
```

A private page should not rely on:

```text
robots.txt
noindex
```

for security.

The application must enforce:

```text
authentication
authorization
data access
```

first.

---

# 12. Canonical vs Redirect

A canonical declaration says:

```text
“This URL represents the resource, but another URL is preferred.”
```

A redirect says:

```text
“This request should go somewhere else.”
```

Therefore:

```text
redirect
→ navigation behavior

canonical
→ representation preference
```

A mature application must know when each is appropriate.

---

# 13. Canonical vs Rewrite

A rewrite changes internal routing while preserving the visible URL.

Example:

```text
/public/product/123
        ↓ rewrite
/internal/products/123
```

The browser still sees:

```text
/public/product/123
```

Therefore SEO identity should generally correspond to the public representation, not an internal implementation path.

This is another reason to separate:

```text
routing identity
```

from:

```text
internal implementation identity
```

---

# 14. Metadata Consistency

The title and description should represent the same resource as the page.

Bad:

```text
HTML:
MacBook Pro 16

Metadata:
MacBook Air 13
```

This is not merely an SEO issue.

It indicates representation divergence.

The metadata should be generated from the same resolved resource:

```text
Product 123
    ↓
title
description
canonical
social
structured data
```

---

# 15. Open Graph Consistency

Open Graph should represent the same resource.

For example:

```text
canonical:
https://example.com/products/123
```

Then:

```text
og:url:
https://example.com/products/123
```

The image should also correspond to the same resource:

```text
Product 123
    ↓
Product 123 image
```

Avoid:

```text
Product 123 page
    ↓
Product 456 social image
```

This is a representation integrity failure.

---

# 16. Structured Data Consistency

Structured data should not describe an entity unrelated to the page.

Example:

```text
Page:
Product 123

JSON-LD:
Product 456
```

Incorrect.

Instead:

```text
Resource 123
    ↓
HTML representation
    ↓
Product structured data
```

The structured data should project the same domain entity.

---

# 17. Structured Data vs Visible Content

Structured data should also remain consistent with publicly represented information.

Suppose the page shows:

```text
Price: $99
```

but structured data declares:

```json
{
  "price": "149"
}
```

The system now exposes conflicting representations.

The problem is not simply invalid JSON.

The problem is:

```text
domain state
       ↓
multiple inconsistent projections
```

---

# 18. Sitemap Consistency

A URL should generally be considered for sitemap inclusion based on the same representation policy used elsewhere.

Conceptually:

```ts
function shouldIncludeInSitemap(
  representation: SeoRepresentation
) {
  return (
    representation.sitemap?.include === true &&
    representation.canonicalUrl != null
  );
}
```

The exact rule depends on the application.

But the architectural principle is:

> Sitemap eligibility should derive from resource and representation state, not from a separate arbitrary URL list.

---

# 19. Draft and Published States

Consider:

```text
Product 123

status:
draft
```

Potential outputs:

```text
HTML:
preview page

Canonical:
none / controlled preview representation

Robots:
noindex

Structured Data:
restricted

Sitemap:
excluded
```

After publishing:

```text
status:
published
```

The representation can transition:

```text
public
indexable
canonical
discoverable
social-shareable
```

The state transition should update all relevant projections.

---

# 20. Deleted Resources

Deletion introduces another consistency problem.

Suppose:

```text
Product 123
```

is deleted.

Potential stale surfaces:

```text
HTML route
metadata
canonical
structured data
sitemap
cache
social preview
```

A production architecture needs explicit deletion semantics.

Possible outcome:

```text
resource deleted
       ↓
route resolves unavailable
       ↓
appropriate HTTP response
       ↓
remove sitemap membership
       ↓
invalidate relevant caches
       ↓
remove generated representation dependencies
```

The exact HTTP behavior depends on whether the resource is:

```text
temporarily unavailable
permanently removed
moved
```

---

# 21. Localization Architecture

Consider:

```text
/en/products/123
/fr/products/123
/de/products/123
```

These may represent the same conceptual product in different language representations.

The architecture should distinguish:

```text
entity identity
```

from:

```text
localized representation identity
```

Conceptually:

```text
Product 123
    ├── en-US representation
    ├── fr-FR representation
    └── de-DE representation
```

Then:

```text
canonical
alternates
metadata
social
structured data
sitemap
```

must understand the locale model.

---

# 22. Multi-Tenant Architecture

Now consider:

```text
tenant-a.example.com/products/123
tenant-b.example.com/products/123
```

The same numeric ID does not identify the same resource.

Therefore:

```text
productId = 123
```

may be insufficient.

The identity becomes:

```text
tenant + resource type + resource id + locale
```

For example:

```text
tenant-a + product + 123 + en
```

This identity should drive:

```text
canonical
metadata
Open Graph
structured data
sitemap
```

Otherwise cross-tenant leakage becomes possible.

---

# 23. Custom Domains

A SaaS system may allow:

```text
customer-a.com
customer-b.com
```

The same application deployment serves both.

The canonical URL must be derived from the correct public origin.

Dangerous architecture:

```text
canonical = process.env.APP_URL + pathname
```

when the public representation actually depends on:

```text
request host
tenant
custom domain
locale
```

The canonical representation must understand the deployment's domain model.

---

# 24. Query Parameter Normalization

Suppose:

```text
/products/123
/products/123?utm_source=x
/products/123?campaign=spring
```

The tracking parameters may not change resource identity.

Therefore:

```text
resource identity
```

may remain:

```text
/products/123
```

while the request URL differs.

The architecture should distinguish:

```text
request URL
```

from:

```text
resource identity URL
```

This distinction is foundational to canonicalization.

---

# 25. Faceted Navigation

Consider:

```text
/products?brand=apple
/products?brand=samsung
/products?sort=price
/products?color=black
```

Not every parameterized URL necessarily deserves:

```text
indexing
canonicalization
sitemap inclusion
```

The application needs an explicit URL policy.

For example:

```text
parameter category
    ↓
representation policy
    ↓
indexable?
canonical?
discoverable?
```

Do not allow crawler-facing URL behavior to emerge accidentally from frontend routing.

---

# 26. Search Results Pages

Internal search often creates URLs such as:

```text
/search?q=iphone
```

These pages may be useful to users but may have different indexing requirements.

The architectural point is:

```text
user utility
≠
search-engine indexability
```

The application should explicitly classify such routes.

---

# 27. Preview Routes

CMS preview URLs are another important case.

Example:

```text
/preview/article/123
```

The preview representation may be:

```text
authenticated
temporary
unpublished
noncanonical
nonindexable
```

Therefore preview routes should not accidentally enter:

```text
sitemaps
structured data
canonical graph
```

or public social representations.

---

# 28. Environment Separation

Production:

```text
https://example.com
```

Staging:

```text
https://staging.example.com
```

Development:

```text
http://localhost:3000
```

A dangerous implementation can generate production-looking metadata in staging.

For example:

```text
canonical:
https://example.com/article/123
```

while running on staging.

Environment-aware representation policy should prevent accidental publication.

---

# 29. Cache Architecture

SEO representations are still application outputs.

Therefore they can be cached.

Consider:

```text
Product update
    ↓
database changes
    ↓
HTML changes
    ↓
metadata should change
    ↓
JSON-LD should change
    ↓
social image may change
    ↓
sitemap lastModified may change
```

If different surfaces use different cache lifetimes:

```text
HTML:
fresh

metadata:
stale

structured data:
stale

sitemap:
fresh
```

the system can expose inconsistent representations.

Therefore:

> Cache invalidation must understand representation dependencies.

---

# 30. Representation Dependency Graph

A useful model is:

```text
Product
  │
  ├── HTML
  ├── Metadata
  ├── Canonical
  ├── Open Graph
  ├── Structured Data
  └── Sitemap
```

If:

```text
product.title
```

changes, potentially affected projections include:

```text
HTML title
metadata title
Open Graph title
structured data name
```

If:

```text
product.slug
```

changes:

```text
canonical
Open Graph URL
sitemap URL
internal links
structured data URL
```

may all change.

This is why cache invalidation is a representation-architecture problem.

---

# 31. Invalidation Strategy

A mature system should identify dependencies.

Conceptually:

```ts
type ResourceChange =
  | { type: "titleChanged"; resourceId: string }
  | { type: "slugChanged"; resourceId: string }
  | { type: "publicationChanged"; resourceId: string }
  | { type: "localeChanged"; resourceId: string }
  | { type: "tenantDomainChanged"; tenantId: string };
```

Each event can map to affected representations.

Example:

```text
slugChanged
    ↓
invalidate:
    page
    metadata
    canonical
    social
    structured data
    sitemap
```

---

# 32. Observability

SEO representation systems need production observability.

Useful dimensions include:

```text
route
resource ID
tenant
locale
canonical URL
indexability
sitemap inclusion
representation version
cache state
generation latency
errors
```

Example diagnostic:

```text
Request:
 /products/123

Resource:
 Product 123

Canonical:
 /products/123

Indexable:
 true

Sitemap:
 true

StructuredData:
 Product 123

OG URL:
 /products/123
```

This allows engineers to compare representations quickly.

---

# 33. Automated Consistency Testing

A senior implementation should test cross-surface invariants.

Example:

```text
Given Product 123

HTML resource = Product 123

canonical resource = Product 123

OG resource = Product 123

JSON-LD resource = Product 123

sitemap URL = canonical URL
```

Tests should verify relationships rather than only snapshots.

---

# 34. Example Integration Test

Conceptually:

```ts
it("keeps SEO representations consistent", async () => {
  const response = await renderProductPage("123");

  expect(response.html.productId).toBe("123");

  expect(response.metadata.canonical).toBe(
    response.social.url
  );

  expect(response.structuredData["@id"]).toBe(
    response.metadata.canonical
  );

  expect(response.sitemap).toContain(
    response.metadata.canonical
  );
});
```

The exact implementation is application-specific.

The important point is:

> Test architectural invariants, not only individual functions.

---

# 35. Common Failure Modes

## Failure 1 — Independent SEO Implementations

```text
metadata logic
sitemap logic
JSON-LD logic
OG logic
```

all independently query the database.

### Result

Eventually they disagree.

### Correction

Centralize resource identity and representation policy.

---

# 36. Failure 2 — Sitemap Contains Noncanonical URLs

```text
sitemap:
URL A

canonical:
URL B
```

### Result

Conflicting discovery and canonical signals.

### Correction

Generate sitemap candidates from canonical representation identity.

---

# 37. Failure 3 — Structured Data Describes Different Entity

```text
page:
Product A

JSON-LD:
Product B
```

### Result

Semantic representation mismatch.

### Correction

Generate JSON-LD from the same resolved resource.

---

# 38. Failure 4 — Preview Enters Public SEO

```text
preview route
    ↓
sitemap
    ↓
indexing
```

### Result

Internal representation becomes externally discoverable.

### Correction

Make preview status part of representation policy.

---

# 39. Failure 5 — Tenant Leakage

```text
tenant-a/product/123
```

generates:

```text
canonical:
tenant-b/product/123
```

### Root Cause

Tenant context was lost during URL generation.

### Correction

Treat tenant identity as part of resource identity.

---

# 40. Failure 6 — Locale Leakage

```text
/fr/products/123
```

generates:

```text
og:url:
https://example.com/en/products/123
```

### Root Cause

Locale omitted from representation resolution.

### Correction

Resolve locale before generating all URL-bearing representations.

---

# 41. Failure 7 — Stale SEO Cache

Database:

```text
title = New Product
```

Metadata cache:

```text
title = Old Product
```

### Root Cause

Mutation invalidated page data but not metadata dependencies.

### Correction

Treat SEO representations as cacheable projections with explicit dependencies.

---

# 42. Failure 8 — Environment Leakage

Staging generates:

```text
canonical:
https://production.com/page
```

### Root Cause

Public origin incorrectly configured or inferred.

### Correction

Make environment and public-origin policy explicit.

---

# 43. Failure 9 — Robots Used as Security

```text
robots.txt:
Disallow /admin
```

while:

```text
/admin
```

is still publicly accessible.

### Result

The route remains accessible.

### Correction

Security enforcement belongs to:

```text
authentication
authorization
request handling
data access
```

not crawler directives.

---

# 44. Failure 10 — Hardcoded Sitemap

```ts
const urls = [
  "/product/1",
  "/product/2",
  "/product/3",
];
```

### Result

The sitemap becomes disconnected from application state.

### Correction

Derive discovery from the same resource and publication model.

---

# 45. The Four-Pillar Engineering Matrix

For every SEO representation decision, evaluate four dimensions.

| Pillar          | Core Question                                          |
| --------------- | ------------------------------------------------------ |
| Correctness     | Does the representation describe the correct resource? |
| Performance     | Can it be generated efficiently?                       |
| Reliability     | Does it remain coherent under failure/staleness?       |
| Maintainability | Can the system evolve without duplicated logic?        |

Example:

### Dynamic structured data

**Correctness**

```text
Does JSON-LD represent the same entity as the page?
```

**Performance**

```text
Does generation create additional database waterfalls?
```

**Reliability**

```text
What happens when product pricing is temporarily unavailable?
```

**Maintainability**

```text
Is entity mapping centralized?
```

---

# 46. Senior-Level Architectural Pattern

A strong architecture can be represented as:

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
        ▼              ▼               ▼
     CANONICAL     VISIBILITY       DISCOVERY
        │              │               │
        └───────┬──────┴───────┬───────┘
                ▼              ▼
            PROJECTIONS
                │
     ┌──────────┼──────────────┐
     ▼          ▼              ▼
 Metadata    Social       Structured Data
     │          │              │
     └──────────┼──────────────┘
                ▼
              HTML
                │
                ▼
             SITEMAP
```

The important idea is not the exact diagram.

It is the dependency direction:

```text
domain/resource state
        ↓
representation policy
        ↓
SEO projections
```

not:

```text
SEO projection
        ↓
invent resource state
```

---

# 47. Prediction Challenges

Before reading the answer, reason through these.

## Challenge 1

A product URL is present in the sitemap, but the page's canonical points to another URL.

What architectural inconsistency exists?

---

## Challenge 2

A localized French page generates an English `og:url`.

Which identity dimension was probably lost?

---

## Challenge 3

A product title changes in the database, but JSON-LD continues showing the previous title.

Is this primarily:

```text
rendering bug
database bug
representation consistency bug
```

Explain why.

---

## Challenge 4

A preview URL is accidentally included in a sitemap.

Which shared policy should have prevented this?

---

## Challenge 5

Two tenants use product ID `123`.

Why is:

```text
productId = 123
```

not necessarily sufficient resource identity?

---

## Challenge 6

A route is blocked in `robots.txt` but remains publicly accessible.

What security assumption is incorrect?

---

## Challenge 7

A product's slug changes.

Which representations may need invalidation?

---

## Challenge 8

The HTML describes Product A while structured data describes Product B.

What single architectural principle has been violated?

---

# 48. Senior Interview Gotchas

### Gotcha 1

**“Should every URL in the sitemap have a canonical tag?”**

The correct architectural discussion is about consistency between sitemap discovery and canonical identity, not mechanically attaching one mechanism to another.

---

### Gotcha 2

**“Can robots.txt protect private pages?”**

No.

Crawler directives are not authorization controls.

---

### Gotcha 3

**“Should structured data be generated separately from the page?”**

It can be implemented separately, but its underlying resource identity should not be independently invented.

---

### Gotcha 4

**“Is canonical the same as redirect?”**

No.

One expresses preferred representation identity; the other changes request navigation.

---

### Gotcha 5

**“Should every query parameter be removed from canonical URLs?”**

No.

The application must determine whether the parameter changes resource representation.

---

### Gotcha 6

**“Does a sitemap make a URL indexable?”**

No.

Discovery, crawling, indexing, canonicalization, and accessibility are related but distinct concerns.

---

### Gotcha 7

**“Can metadata be cached independently?”**

Technically yes, but the cache dependency graph must account for the resource state that metadata represents.

---

### Gotcha 8

**“Is SEO architecture separate from application architecture?”**

Not in a mature application.

SEO-facing representations are projections of application state and routing identity.

---

# 49. Executive Cheat Sheet

```text
RESOURCE IDENTITY
        ↓
REPRESENTATION POLICY
        ↓
┌─────────────────────────────┐
│ HTML                        │
│ Metadata                    │
│ Canonical                   │
│ Alternates                  │
│ Open Graph                  │
│ Robots                      │
│ Structured Data             │
│ Sitemap                     │
└─────────────────────────────┘
```

Remember:

```text
Resource identity
≠
Request URL

Resource identity
≠
Canonical URL

Canonical
≠
Redirect

Canonical
≠
Robots

Robots
≠
Security

Sitemap
≠
Indexing guarantee

Structured data
≠
Visible UI

SEO projection
≠
independent business logic
```

The central engineering principle is:

> **Resolve the resource once, establish its representation policy once, and derive externally visible representations from that shared model.**

---

# 50. Part Completion Checklist

You should now be able to explain and implement:

### Resource Identity

* [ ] Define resource identity independently from request URL
* [ ] Include tenant and locale where required
* [ ] Distinguish entity identity from representation identity

### Representation Policy

* [ ] Determine public vs private state
* [ ] Determine indexability
* [ ] Determine discoverability
* [ ] Determine social eligibility
* [ ] Determine structured-data eligibility

### Cross-Surface Consistency

* [ ] Keep HTML and metadata aligned
* [ ] Keep canonical and social URLs aligned
* [ ] Keep structured data aligned with the represented entity
* [ ] Keep sitemap URLs aligned with intended canonical representations
* [ ] Keep localization coherent
* [ ] Keep tenancy coherent

### Caching

* [ ] Identify SEO representation dependencies
* [ ] Invalidate dependent projections after mutations
* [ ] Understand stale metadata and structured-data failure modes
* [ ] Treat sitemap generation as part of representation freshness

### Production Architecture

* [ ] Centralize resource resolution
* [ ] Centralize representation policy
* [ ] Derive SEO projections
* [ ] Test cross-surface invariants
* [ ] Instrument production representation behavior

---

# 51. The Mental Model to Retain

The most important model from this part is:

```text
Request
   ↓
Route
   ↓
Tenant / Locale
   ↓
Resource Identity
   ↓
Representation Policy
   ↓
Canonical Identity
   ↓
SEO Projections
   ├── Metadata
   ├── Alternates
   ├── Open Graph
   ├── Robots
   ├── Structured Data
   └── Sitemap
   ↓
HTML / External Discovery
```

The senior-level shift is:

> **SEO is not a collection of tags. It is a representation architecture.**

Once the application has a reliable resource identity and representation policy, the individual mechanisms become projections of that architecture rather than isolated pieces of configuration.

---

# 52. Boundary of This Part

This part completes the **cross-surface SEO representation architecture**.

It does not yet focus on:

* final production SEO architecture
* deployment-wide SEO concerns
* operational governance
* comprehensive end-to-end failure recovery
* final KPI integration
* capstone architecture

Those belong to the final production-oriented portion of this KPI.

**Next part:** Production SEO / Metadata Architecture — integrating routing, rendering, caching, indexing, structured data, social representation, discovery, observability, and deployment concerns into one production system.
